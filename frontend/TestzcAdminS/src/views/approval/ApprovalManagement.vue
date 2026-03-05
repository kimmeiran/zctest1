<template>
  <div class="approval-management">
    <h2 class="page-title">审批管理</h2>

    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="search-group">
        <label>审批状态</label>
        <select class="form-select" v-model="searchInfo.status">
          <option value="">全部</option>
          <option :value="-1">待提交审批</option>
          <option :value="0">待审核</option>
          <option :value="1">审核通过</option>
          <option :value="2">审核拒绝</option>
        </select>
      </div>
      <div class="search-buttons">
        <button class="btn btn-primary" @click="search" :disabled="isLoading">查询</button>
        <button class="btn btn-secondary" @click="reset" :disabled="isLoading">重置</button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons" v-if="canCreateApproval">
      <button class="btn btn-add" @click="showCreateModal">
        <span class="plus-icon">+</span> 创建申请
      </button>
    </div>

    <!-- 数据表格 -->
    <div class="table-responsive">
      <table class="data-table">
        <colgroup>
          <col style="width: 6%" />
          <col style="width: 10%" />
          <col style="width: 12%" />
          <col style="width: 28%" />
          <col style="width: 10%" />
          <col style="width: 8%" />
          <col style="width: 12%" />
          <col style="width: 14%" />
          <col style="width: 12%" />
        </colgroup>
        <thead>
          <tr>
            <th>序号</th>
            <th>审批类型</th>
            <th>申请人</th>
            <th>申请内容</th>
            <th>审批状态</th>
            <th>审批人</th>
            <th>审批意见</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in approvals" :key="item.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ getApprovalTypeName(item.approvalType) }}</td>
            <td>{{ item.applicantName }}</td>
            <td>
              <el-tooltip
                :content="getFormattedContentFull(item)"
                placement="top"
                :disabled="!shouldShowTooltip(item)"
              >
                <span class="content-cell">{{ formatContentForTable(item) }}</span>
              </el-tooltip>
            </td>
            <td>{{ getStatusName(item.status) }}</td>
            <td>{{ item.approverName || '-' }}</td>
            <td>{{ item.remark || '-' }}</td>
            <td>{{ item.createTime }}</td>
            <td class="operations">
              <div class="actions-cell">
                <template v-if="hasOperations(item)">
                  <a 
                    v-if="canShowSubmit(item)" 
                    href="#" 
                    class="submit-link" 
                    @click.prevent="handleSubmit(item)"
                  >提交审批</a>
                  <a 
                    v-if="canShowEdit(item)" 
                    href="#" 
                    class="edit-link" 
                    @click.prevent="showEditModal(item)"
                  >编辑</a>
                  <a 
                    v-if="canShowApprove(item)" 
                    href="#" 
                    class="approve-link" 
                    @click.prevent="showApproveModal(item)"
                  >审批</a>
                  <a 
                    v-if="canShowDelete(item)" 
                    href="#" 
                    class="delete-link" 
                    @click.prevent="handleDelete(item)"
                  >删除</a>
                </template>
                <span v-else class="no-action">{{ isManagerOrAdmin ? '已审批' : '-' }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <div class="pagination">
        <button 
          class="page-nav" 
          :disabled="currentPage === 1" 
          @click="goToPage(currentPage - 1)"
        >上一页</button>
        <span 
          v-for="page in displayedPages" 
          :key="page"
          :class="['page-number', { active: page === currentPage }]"
          @click="goToPage(page)"
        >{{ page }}</span>
        <button 
          class="page-nav" 
          :disabled="currentPage === totalPages" 
          @click="goToPage(currentPage + 1)"
        >下一页</button>
      </div>
      <div class="total-count">共 {{ totalItems }} 条</div>
    </div>

    <!-- 创建申请模态框 -->
    <div v-if="showCreate" class="modal-overlay">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>创建申请</h3>
          <button class="close-btn" @click="closeCreateModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="required">审批类型</label>
            <select class="form-select" v-model="formData.approvalType">
              <option value="">请选择</option>
              <option :value="2">专家分配申请</option>
              <option :value="4">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label class="required">申请内容</label>
            <textarea 
              class="form-textarea" 
              v-model="formData.content" 
              placeholder="请输入申请内容"
              rows="5"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeCreateModal">取消</button>
          <button class="btn btn-primary" @click="submitCreate" :disabled="isSaving">提交</button>
        </div>
      </div>
    </div>

    <!-- 编辑申请模态框 -->
    <div v-if="showEdit" class="modal-overlay">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>编辑申请</h3>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="required">申请内容</label>
            <textarea 
              class="form-textarea" 
              v-model="editForm.content" 
              placeholder="请输入申请内容"
              rows="5"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditModal">取消</button>
          <button class="btn btn-primary" @click="submitEdit" :disabled="isSaving">提交</button>
        </div>
      </div>
    </div>

    <!-- 审批模态框 -->
    <div v-if="showApprove" class="modal-overlay">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>审批申请</h3>
          <button class="close-btn" @click="closeApproveModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group" v-if="currentApproval">
            <label>审批类型</label>
            <div class="form-readonly">{{ getApprovalTypeName(currentApproval.approvalType) }}</div>
          </div>
          <div class="form-group" v-if="currentApproval">
            <label>申请人</label>
            <div class="form-readonly">{{ currentApproval.applicantName || '-' }}</div>
          </div>
          <div class="form-group" v-if="currentApproval">
            <label>申请内容</label>
            <el-tooltip
              :content="getFormattedContentFull(currentApproval)"
              placement="top"
            >
              <div class="form-readonly content-display">
                {{ getFormattedContent(currentApproval) }}
              </div>
            </el-tooltip>
          </div>
          <div class="form-group">
            <label class="required">审批结果</label>
            <select class="form-select" v-model="approveForm.status">
              <option :value="1">审核通过</option>
              <option :value="2">审核拒绝</option>
            </select>
          </div>
          <div class="form-group">
            <label>审批意见</label>
            <textarea 
              class="form-textarea" 
              v-model="approveForm.remark" 
              placeholder="请输入审批意见（可选）"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeApproveModal">取消</button>
          <button class="btn btn-primary" @click="submitApprove" :disabled="isSaving">提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElTooltip } from 'element-plus';
import { createApproval, searchApprovals, approveApproval, submitApproval, updateApproval, deleteApproval } from '@/api/approval';
import { ROLE_MANAGER, isRole } from '@/constants/role';

const currentUser = computed(() => {
  try {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : {};
  } catch {
    return {};
  }
});

const approvals = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const showCreate = ref(false);
const showApprove = ref(false);
const showEdit = ref(false);
const currentApproval = ref(null);

const searchInfo = ref({
  status: ''
});

const formData = ref({
  approvalType: '',
  content: ''
});

const editForm = ref({
  content: ''
});

const approveForm = ref({
  status: 1,
  remark: ''
});

const canCreateApproval = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));
const canApprove = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));
const isManagerOrAdmin = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));
const canSubmit = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));
const canEdit = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));
const isManagerExamApproval = (item) => {
  if (!item) return false;
  return isRole(currentUser.value.role, ROLE_MANAGER) && item.approvalType === 1;
};

// 判断是否是当前用户创建的申请
const isMyApproval = (item) => {
  if (!item) {
    return false;
  }
  
  // 后端session中存储的userId是 account.getId()（真正的用户ID）
  // 后端返回的userInfo中有 id: account.getId()
  // 但前端Login.vue存储时使用的是 id: userInfo.teachId（可能是账号名称）
  // 所以需要检查多个字段，优先使用真正的ID字段
  const user = currentUser.value;
  
  // 尝试获取真正的用户ID（后端返回的userInfo.id）
  // 如果Login.vue正确存储了userInfo.id，应该能获取到
  // 否则需要从session或其他方式获取
  let currentUserId = user?.id;
  
  // 如果id是字符串且看起来像账号名称（如"22"），可能需要使用其他字段
  // 但根据后端代码，userInfo.id应该是真正的ID（数字4）
  // 如果前端存储有问题，这里可能需要调整
  
  // 获取申请人的ID（后端返回的是 applicantId）
  const applicantId = item.applicantId || item.applicant_id;
  
  if (!currentUserId || !applicantId) {
    return false;
  }
  
  // 转换为字符串进行比较，避免类型不一致
  const userIdStr = String(currentUserId).trim();
  const applicantIdStr = String(applicantId).trim();
  
  const isMatch = userIdStr === applicantIdStr;
  
  return isMatch;
};

// 操作显示判定
const canShowSubmit = (item) => {
  return canSubmit.value && isPendingSubmit(item.status) && !isManagerExamApproval(item);
};

const canShowEdit = (item) => {
  return canEdit.value && (isPendingSubmit(item.status) || normalizeStatus(item.status) === 2) && !isManagerExamApproval(item);
};

const canShowApprove = (item) => {
  return canApprove.value && (isPendingReview(item.status) || (isManagerExamApproval(item) && isPendingSubmit(item.status)));
};

const canShowDelete = (item) => {
  return isMyApproval(item) && (isPendingSubmit(item.status) || isPendingReview(item.status));
};

const hasOperations = (item) => {
  return canShowSubmit(item) || canShowEdit(item) || canShowApprove(item) || canShowDelete(item);
};

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

const displayedPages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (currentPage.value > 3) pages.push('...');
    for (let i = Math.max(2, currentPage.value - 1); i <= Math.min(totalPages.value - 1, currentPage.value + 1); i++) {
      pages.push(i);
    }
    if (currentPage.value < totalPages.value - 2) pages.push('...');
    pages.push(totalPages.value);
  }
  return pages;
});

const fetchApprovals = async () => {
  isLoading.value = true;
  try {
    const params = {
      ...searchInfo.value,
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
    };
    // status=-1表示查询null状态（待提交审批），直接传递给后端处理
    const response = await searchApprovals(params);
    if (response.code === 200) {
      approvals.value = response.data.list || [];
      totalItems.value = response.data.total || 0;
      
      // 调试信息：打印用户角色和审批列表状态
      console.log('当前用户角色:', currentUser.value.role, '类型:', typeof currentUser.value.role);
      console.log('canApprove:', canApprove.value);
      console.log('审批列表:', approvals.value.map(item => ({
        id: item.id,
        approvalType: item.approvalType,
        approvalTypeName: getApprovalTypeName(item.approvalType),
        status: item.status,
        statusType: typeof item.status,
        normalizedStatus: normalizeStatus(item.status),
        isPendingReview: isPendingReview(item.status),
        canShowApprove: canApprove.value && isPendingReview(item.status)
      })));
    } else {
      ElMessage.error(response.msg || '查询失败');
    }
  } catch (error) {
    ElMessage.error('查询失败: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};

const search = () => {
  currentPage.value = 1;
  fetchApprovals();
};

const reset = () => {
  searchInfo.value = { status: '' };
  currentPage.value = 1;
  fetchApprovals();
};

const goToPage = (page) => {
  if (page === '...' || page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchApprovals();
};

const showCreateModal = () => {
  formData.value = { approvalType: '', content: '' };
  showCreate.value = true;
};

const closeCreateModal = () => {
  showCreate.value = false;
};

const submitCreate = async () => {
  if (!formData.value.approvalType) {
    ElMessage.warning('请选择审批类型');
    return;
  }
  if (!formData.value.content) {
    ElMessage.warning('请输入申请内容');
    return;
  }
  isSaving.value = true;
  try {
    const response = await createApproval(formData.value);
    if (response.code === 200) {
      ElMessage.success('创建成功');
      closeCreateModal();
      fetchApprovals();
    } else {
      ElMessage.error(response.msg || '创建失败');
    }
  } catch (error) {
    ElMessage.error('创建失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

const showApproveModal = (item) => {
  currentApproval.value = item;
  approveForm.value = { status: 1, remark: '' };
  showApprove.value = true;
};

const closeApproveModal = () => {
  showApprove.value = false;
  currentApproval.value = null;
};

const handleSubmit = async (item) => {
  if (!item) return;
  try {
    await ElMessageBox.confirm('确定要提交审批吗？提交后总管理将可以看到此申请。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
  } catch {
    return;
  }
  
  isSaving.value = true;
  try {
    console.log('提交审批前，item.status:', item.status, '类型:', typeof item.status);
    const response = await submitApproval(item.id);
    console.log('提交审批响应:', response);
    if (response.code === 200) {
      ElMessage.success('提交审批成功');
      // 立即更新本地数据，避免等待接口返回
      if (response.data) {
        const index = approvals.value.findIndex(a => a.id === item.id);
        if (index !== -1) {
          approvals.value[index] = response.data;
          console.log('更新后的状态:', response.data.status, '类型:', typeof response.data.status);
        }
      }
      // 刷新列表
      fetchApprovals();
    } else {
      ElMessage.error(response.msg || '提交失败');
    }
  } catch (error) {
    console.error('提交审批错误:', error);
    ElMessage.error('提交失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

const showEditModal = (item) => {
  currentApproval.value = item;
  editForm.value = { content: item.content || '' };
  showEdit.value = true;
};

const closeEditModal = () => {
  showEdit.value = false;
  currentApproval.value = null;
};

const submitEdit = async () => {
  if (!editForm.value.content) {
    ElMessage.warning('请输入申请内容');
    return;
  }
  if (!currentApproval.value) return;
  isSaving.value = true;
  try {
    const response = await updateApproval({
      id: currentApproval.value.id,
      content: editForm.value.content
    });
    if (response.code === 200) {
      ElMessage.success('更新成功');
      closeEditModal();
      fetchApprovals();
    } else {
      ElMessage.error(response.msg || '更新失败');
    }
  } catch (error) {
    ElMessage.error('更新失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

const submitApprove = async () => {
  if (!currentApproval.value) return;
  isSaving.value = true;
  try {
    const response = await approveApproval({
      id: currentApproval.value.id,
      ...approveForm.value
    });
    if (response.code === 200) {
      ElMessage.success('审批成功');
      closeApproveModal();
      fetchApprovals();
    } else {
      ElMessage.error(response.msg || '审批失败');
    }
  } catch (error) {
    ElMessage.error('审批失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm('确定要删除该申请吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
  } catch {
    return;
  }
  
  isSaving.value = true;
  try {
    const response = await deleteApproval(item.id);
    if (response.code === 200) {
      ElMessage.success('删除成功');
      fetchApprovals();
    } else {
      ElMessage.error(response.msg || '删除失败');
    }
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

const getApprovalTypeName = (type) => {
  const map = { 1: '考试申请', 2: '专家分配申请', 3: '操作审批', 4: '其他' };
  return map[type] || '-';
};

// 辅助函数：统一处理状态值，转换为数字
const normalizeStatus = (status) => {
  if (status === null || status === undefined || status === 'null') {
    return null;
  }
  // 统一转换为数字
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
  return isNaN(statusNum) ? null : statusNum;
};

// 判断状态是否为待审核
const isPendingReview = (status) => {
  const normalized = normalizeStatus(status);
  return normalized === 0;
};

// 判断状态是否为待提交审批
const isPendingSubmit = (status) => {
  const normalized = normalizeStatus(status);
  return normalized === null;
};

const getStatusName = (status) => {
  if (isPendingSubmit(status)) {
    return '待提交审批';
  }
  const statusNum = normalizeStatus(status);
  const map = { 0: '待审核', 1: '审核通过', 2: '审核拒绝' };
  return map[statusNum] || '-';
};

const formatContent = (content) => {
  if (!content) return '-';
  return content.length > 50 ? content.substring(0, 50) + '...' : content;
};

// 格式化表格中的申请内容显示
const formatContentForTable = (item) => {
  if (!item || !item.content) return '-';
  
  // 如果是考试申请（approvalType=1），解析JSON并格式化
  if (item.approvalType === 1) {
    try {
      const contentObj = JSON.parse(item.content);
      const parts = [];
      
      if (contentObj.year) {
        parts.push(`年度：${contentObj.year}`);
      }
      if (contentObj.examMode) {
        parts.push(`线上线下：${contentObj.examMode}`);
      }
      if (contentObj.location) {
        parts.push(`地点：${contentObj.location}`);
      }
      if (contentObj.remark) {
        parts.push(`备注：${contentObj.remark}`);
      }
      
      const formatted = parts.length > 0 ? parts.join('；') : item.content;
      return formatted.length > 50 ? formatted.substring(0, 50) + '...' : formatted;
    } catch (e) {
      // 如果不是JSON格式，直接返回原内容（截断）
      return item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content;
    }
  }
  
  // 其他类型的申请，直接返回内容（截断）
  return item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content;
};

// 格式化申请内容为易读文字（用于审批模态框显示）
const getFormattedContent = (item) => {
  if (!item || !item.content) return '-';
  
  // 如果是考试申请（approvalType=1），解析JSON并格式化
  if (item.approvalType === 1) {
    try {
      const contentObj = JSON.parse(item.content);
      const parts = [];
      
      if (contentObj.year) {
        parts.push(`年度：${contentObj.year}`);
      }
      if (contentObj.examMode) {
        parts.push(`线上线下：${contentObj.examMode}`);
      }
      if (contentObj.location) {
        parts.push(`地点：${contentObj.location}`);
      }
      if (contentObj.remark) {
        parts.push(`备注：${contentObj.remark}`);
      }
      
      return parts.length > 0 ? parts.join('；') : item.content;
    } catch (e) {
      // 如果不是JSON格式，直接返回原内容
      return item.content;
    }
  }
  
  // 其他类型的申请，直接返回内容
  return item.content;
};

// 获取完整的格式化内容（用于悬浮提示）
const getFormattedContentFull = (item) => {
  if (!item || !item.content) return '-';
  
  // 如果是考试申请（approvalType=1），解析JSON并格式化
  if (item.approvalType === 1) {
    try {
      const contentObj = JSON.parse(item.content);
      const parts = [];
      
      if (contentObj.year) {
        parts.push(`年度：${contentObj.year}`);
      }
      if (contentObj.examMode) {
        parts.push(`线上线下：${contentObj.examMode}`);
      }
      if (contentObj.location) {
        parts.push(`地点：${contentObj.location}`);
      }
      if (contentObj.remark) {
        parts.push(`备注：${contentObj.remark}`);
      }
      
      return parts.length > 0 ? parts.join('\n') : item.content;
    } catch (e) {
      // 如果不是JSON格式，直接返回原内容
      return item.content;
    }
  }
  
  // 其他类型的申请，直接返回内容
  return item.content;
};

// 判断是否应该显示悬浮提示（内容被截断时才显示）
const shouldShowTooltip = (item) => {
  if (!item || !item.content) return false;
  
  const formatted = formatContentForTable(item);
  const full = getFormattedContentFull(item);
  
  // 如果格式化后的内容被截断（包含...），或者完整内容与显示内容不同，则显示提示
  return formatted.includes('...') || formatted !== full;
};

onMounted(() => {
  fetchApprovals();
});
</script>

<style scoped>
.approval-management {
  padding: 20px;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 500;
}

.search-area {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: flex-end;
}

.search-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.search-group label {
  font-size: 14px;
}

.form-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.search-buttons {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #c70019;
  color: white;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-add {
  background-color: #c70019;
  color: white;
  display: flex;
  align-items: center;
  gap: 5px;
}

.action-buttons {
  margin-bottom: 20px;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  min-width: 1180px;     /* 保证各列有足够空间，避免挤压操作列 */
  border-collapse: collapse;
  table-layout: auto;    /* 配合 colgroup 控制列宽 */
}

.data-table th,
.data-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background-color: #fafafa;
  font-weight: 500;
}

.operations {
  min-width: 140px;
  text-align: left;
}

.data-table th:last-child,
.data-table td.operations {
  white-space: nowrap;
}

.actions-cell {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  min-width: 140px;
}

.no-action {
  color: #999;
  display: inline-block;
  padding: 0 4px;
}

.approve-link,
.submit-link,
.edit-link,
.delete-link {
  color: #1890ff;
  text-decoration: none;
  display: inline-flex;
  flex: 0 0 auto;        /* 不允许缩小，保持一行显示 */
}

.delete-link {
  color: #f56c6c;
}

.content-cell {
  cursor: help;
  display: inline-block;
  max-width: 100%;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 4px;
  width: 500px;
  max-width: 90%;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.form-group label.required::before {
  content: '*';
  color: red;
  margin-right: 4px;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.form-readonly {
  padding: 8px 12px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  min-height: 20px;
}

.content-display {
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  display: flex;
  gap: 5px;
}

.page-number,
.page-nav {
  padding: 5px 10px;
  border: 1px solid #d9d9d9;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.page-number.active {
  background: #c70019;
  color: white;
  border-color: #c70019;
}

.page-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

