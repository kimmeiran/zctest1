<template>
  <div class="exam-application-report">
    <h2 class="page-title">考试申请</h2>

    <!-- 列表视图 -->
    <div v-if="!showForm" class="list-container">
      <div class="action-bar">
        <button class="btn btn-primary" @click="showAddForm">
          <span class="plus-icon">+</span> 新增申请
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>年度</th>
              <th>考核站</th>
              <th>职业(工种)</th>
              <th>线上线下</th>
              <th>地点</th>
              <th>审核状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in approvalList" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td>{{ getYearFromContent(item.content) }}</td>
              <td>{{ getStationName(item.stationId) }}</td>
              <td>{{ item.jobType || '-' }}</td>
              <td>{{ getExamModeFromContent(item.content) || '-' }}</td>
              <td>{{ getLocationFromContent(item.content) || '-' }}</td>
              <td>
                <span :class="getStatusClass(item.status)">
                  {{ getStatusName(item.status) }}
                </span>
              </td>
              <td>{{ formatDate(item.createTime) }}</td>
              <td class="operations">
                <!-- 提交审批按钮：如果是自己的申请且状态为待提交审批或审批拒绝，就可以提交 -->
                <template v-if="isMyApproval(item) && (isPendingSubmit(item.status) || isRejected(item.status))">
                  <a 
                    href="#" 
                    class="submit-link" 
                    @click.prevent="handleSubmit(item)"
                  >提交审批</a>
                  <span style="margin: 0 5px;">|</span>
                </template>
                <!-- 编辑按钮：如果是自己的申请且状态为待提交审批或审批拒绝，可以编辑 -->
                <template v-if="isMyApproval(item) && (isPendingSubmit(item.status) || isRejected(item.status))">
                  <a 
                    href="#" 
                    class="edit-link" 
                    @click.prevent="showEditModal(item)"
                  >编辑</a>
                  <span style="margin: 0 5px;">|</span>
                </template>
                <!-- 审批按钮：总管理和管理可审批 -->
                <template v-if="canApprove && (isPendingReview(item.status) || (isManagerExamApproval(item) && isPendingSubmit(item.status)))">
                  <a 
                    href="#" 
                    class="approve-link" 
                    @click.prevent="showApproveModal(item)"
                  >审批</a>
                  <span style="margin: 0 5px;">|</span>
                </template>
                <!-- 删除按钮：只能删除自己创建的且状态为待提交审批、待审核或审批拒绝的申请 -->
                <template v-if="isMyApproval(item) && (isPendingSubmit(item.status) || isPendingReview(item.status) || isRejected(item.status))">
                  <a 
                    href="#" 
                    class="delete-link" 
                    @click.prevent="handleDelete(item)"
                  >删除</a>
                </template>
                <span v-if="!(isMyApproval(item) && isPendingSubmit(item.status)) && !(isMyApproval(item) && isRejected(item.status)) && !(canApprove && (isPendingReview(item.status) || (isManagerExamApproval(item) && isPendingSubmit(item.status)))) && !(isMyApproval(item) && (isPendingSubmit(item.status) || isPendingReview(item.status) || isRejected(item.status)))" class="text-muted">-</span>
              </td>
            </tr>
            <tr v-if="approvalList.length === 0">
              <td colspan="9" class="text-center">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 表单视图 -->
    <div v-else class="form-container">
      <div class="form-header">
        <div class="form-header-tabs">
          <span class="tab-active">{{ editingId ? '编辑申请' : '新增申请' }}</span>
          <button class="btn btn-link" @click="cancelForm">返回列表</button>
        </div>
      </div>

      <!-- 考核站管理员：以文件上传为主（按原型） -->
      <template v-if="isStationAdmin">
        <div class="form-group upload-section">
          <label class="required">上传考试信息</label>
          <div 
            class="upload-area"
            :class="{ 'drag-over': isDragOver }"
            @drop.prevent="handleFileDrop"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="isDragOver = false"
            @click="triggerFileInput"
          >
            <div class="upload-content">
              <div class="upload-icon">📁</div>
              <p class="upload-text">点击或拖拽文件到此处</p>
              <p class="upload-hint">支持 Word (.docx), PDF (.pdf), Excel (.xlsx) 格式</p>
            </div>
            <input
              ref="fileInputRef"
              type="file"
              accept=".docx,.doc,.pdf,.xlsx,.xls"
              style="display: none"
              @change="handleFileSelect"
            />
          </div>
          <div v-if="formData.uploadFile" class="file-info">
            <span class="file-name">{{ formData.uploadFile.name }}</span>
            <span class="file-size">{{ formatFileSize(formData.uploadFile.size) }}</span>
            <button type="button" class="remove-file-btn" @click="removeUploadFile">移除</button>
          </div>
        </div>

        <div class="form-group">
          <label class="required">职业(工种)</label>
          <select class="form-select" v-model="formData.jobType">
            <option value="">请选择职业(工种)</option>
            <option v-for="job in jobTypes" :key="job.id" :value="job.name">
              {{ job.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>备注说明</label>
          <textarea 
            class="form-textarea" 
            v-model="formData.remark" 
            placeholder="请输入备注说明（可选）"
            rows="4"
          ></textarea>
        </div>
      </template>

      <!-- 管理/总管理：完整表单 -->
      <template v-else>
        <div class="form-group">
          <label class="required">年度</label>
          <input 
            type="number" 
            class="form-input" 
            v-model="formData.year" 
            placeholder="请输入年度，如：2024"
          />
        </div>

        <div class="form-group">
          <label class="required">考核站</label>
          <select class="form-select" v-model="formData.stationId">
            <option value="">请选择考核站</option>
            <option v-for="station in examStations" :key="station.id" :value="station.id">
              {{ station.stationName }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="required">职业(工种)</label>
          <select class="form-select" v-model="formData.jobType">
            <option value="">请选择职业(工种)</option>
            <option v-for="job in jobTypes" :key="job.id" :value="job.name">
              {{ job.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="required">线上线下</label>
          <select class="form-select" v-model="formData.examMode">
            <option value="">请选择</option>
            <option value="线上">线上</option>
            <option value="线下">线下</option>
          </select>
        </div>

        <div class="form-group">
          <label class="required">地点</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="formData.location" 
            placeholder="请输入考试地点"
          />
        </div>

        <div class="form-group">
          <label>备注说明</label>
          <textarea 
            class="form-textarea" 
            v-model="formData.remark" 
            placeholder="请输入备注说明（可选）"
            rows="4"
          ></textarea>
        </div>
      </template>

      <div class="form-actions">
        <button class="btn btn-secondary" @click="cancelForm">取消</button>
        <button class="btn btn-primary" @click="submitApplication" :disabled="isSaving">
          {{ isSaving ? '提交中...' : '提交申请' }}
        </button>
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
          <div class="form-group" v-if="!isStationAdmin">
            <label class="required">年度</label>
            <input 
              type="number" 
              class="form-input" 
              v-model="editForm.year" 
              placeholder="请输入年度，如：2024"
            />
          </div>

          <div class="form-group" v-if="!isStationAdmin">
            <label class="required">考核站</label>
            <select class="form-select" v-model="editForm.stationId">
              <option value="">请选择考核站</option>
              <option v-for="station in examStations" :key="station.id" :value="station.id">
                {{ station.stationName }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="required">职业(工种)</label>
            <select class="form-select" v-model="editForm.jobType">
              <option value="">请选择职业(工种)</option>
              <option v-for="job in jobTypes" :key="job.id" :value="job.name">
                {{ job.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="required">线上线下</label>
            <select class="form-select" v-model="editForm.examMode">
              <option value="">请选择</option>
              <option value="线上">线上</option>
              <option value="线下">线下</option>
            </select>
          </div>

          <div class="form-group">
            <label class="required">地点</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="editForm.location" 
              placeholder="请输入考试地点"
            />
          </div>

          <div class="form-group">
            <label>备注说明</label>
            <textarea 
              class="form-textarea" 
              v-model="editForm.remark" 
              placeholder="请输入备注说明（可选）"
              rows="4"
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
            <label>年度</label>
            <div class="form-readonly">{{ getYearFromContent(currentApproval.content) }}</div>
          </div>
          <div class="form-group" v-if="currentApproval">
            <label>考核站</label>
            <div class="form-readonly">{{ getStationName(currentApproval.stationId) }}</div>
          </div>
          <div class="form-group" v-if="currentApproval">
            <label>职业(工种)</label>
            <div class="form-readonly">{{ currentApproval.jobType || '-' }}</div>
          </div>
          <div class="form-group" v-if="currentApproval">
            <label>线上线下</label>
            <div class="form-readonly">{{ getExamModeFromContent(currentApproval.content) || '-' }}</div>
          </div>
          <div class="form-group" v-if="currentApproval">
            <label>地点</label>
            <div class="form-readonly">{{ getLocationFromContent(currentApproval.content) || '-' }}</div>
          </div>
          <div class="form-group" v-if="currentApproval">
            <label>申请人</label>
            <div class="form-readonly">{{ currentApproval.applicantName || '-' }}</div>
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
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { createApproval, searchApprovals, deleteApproval, submitApproval, approveApproval, updateApproval } from '@/api/approval';
import { getAllExamStations } from '@/api/examStation';
import { getDictionaryByType } from '@/api/user';
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, isRole } from '@/constants/role';
import { uploadFile } from '@/api/user';

const showForm = ref(false);
const editingId = ref(null);
const approvalList = ref([]);
const examStations = ref([]);
const jobTypes = ref([]);
const isSaving = ref(false);
const isLoading = ref(false);
const showApprove = ref(false);
const showEdit = ref(false);
const currentApproval = ref(null);
const isDragOver = ref(false);
const fileInputRef = ref(null);

const approveForm = ref({
  status: 1,
  remark: ''
});

const editForm = ref({
  year: new Date().getFullYear(),
  stationId: '',
  jobType: '',
  examMode: '',
  location: '',
  remark: ''
});

const formData = ref({
  year: new Date().getFullYear(),
  stationId: '',
  jobType: '',
  examMode: '',
  location: '',
  remark: '',
  uploadFile: null
});

const currentUser = computed(() => {
  try {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : {};
  } catch {
    return {};
  }
});

const isStationAdmin = computed(() => isRole(currentUser.value.role, ROLE_EXAM_STATION_ADMIN));
const canApprove = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));
const canSubmit = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));
const isManagerExamApproval = (item) => {
  if (!item) return false;
  return isRole(currentUser.value.role, ROLE_MANAGER) && item.approvalType === 1;
};

// 判断是否是当前用户创建的申请
const isMyApproval = (item) => {
  if (!item) {
    return false;
  }
  const user = currentUser.value;
  // 尝试多种可能的ID字段
  let currentUserId = user?.id || user?.userId || user?.teachId;
  const applicantId = item.applicantId || item.applicant_id;
  
  if (!currentUserId || !applicantId) {
    // 如果无法获取用户ID，尝试从session中获取
    try {
      const sessionUserId = sessionStorage.getItem('userId');
      if (sessionUserId) {
        currentUserId = sessionUserId;
      }
    } catch (e) {
      console.error('获取用户ID失败:', e);
    }
    
    if (!currentUserId || !applicantId) {
      return false;
    }
  }
  
  const userIdStr = String(currentUserId).trim();
  const applicantIdStr = String(applicantId).trim();
  
  const isMatch = userIdStr === applicantIdStr;
  
  // 调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log('isMyApproval检查:', {
      currentUserId: userIdStr,
      applicantId: applicantIdStr,
      isMatch,
      user: user,
      item: item
    });
  }
  
  return isMatch;
};

// 获取年度（从content JSON中解析）
const getYearFromContent = (content) => {
  try {
    if (content) {
      const contentObj = JSON.parse(content);
      return contentObj.year || '-';
    }
  } catch {
    return '-';
  }
  return '-';
};

// 获取线上线下（从content JSON中解析）
const getExamModeFromContent = (content) => {
  try {
    if (content) {
      const contentObj = JSON.parse(content);
      return contentObj.examMode || '-';
    }
  } catch {
    return '-';
  }
  return '-';
};

// 获取地点（从content JSON中解析）
const getLocationFromContent = (content) => {
  try {
    if (content) {
      const contentObj = JSON.parse(content);
      return contentObj.location || '-';
    }
  } catch {
    return '-';
  }
  return '-';
};

// 获取考核站名称
const getStationName = (stationId) => {
  if (!stationId) return '-';
  const station = examStations.value.find(s => s.id === stationId);
  return station ? station.stationName : '-';
};

// 辅助函数：统一处理状态值，转换为数字
const normalizeStatus = (status) => {
  if (status === null || status === undefined || status === 'null') {
    return null;
  }
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

// 判断状态是否为审批拒绝
const isRejected = (status) => {
  const normalized = normalizeStatus(status);
  return normalized === 2;
};

// 获取状态文本（包含待提交审批状态）
const getStatusName = (status) => {
  if (isPendingSubmit(status)) {
    return '待提交审批';
  }
  const statusNum = normalizeStatus(status);
  const map = { 0: '待审核', 1: '审核通过', 2: '审核拒绝' };
  return map[statusNum] || '-';
};

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    0: 'status-pending',
    1: 'status-approved',
    2: 'status-rejected'
  };
  return classMap[status] || '';
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

// 获取考核站列表
const fetchExamStations = async () => {
  try {
    const response = await getAllExamStations();
    const responseData = response.data || {};
    if (responseData.code === 200) {
      examStations.value = responseData.data || [];
    }
  } catch (error) {
    console.error('获取考核站列表失败:', error);
  }
};

// 获取工种列表
const fetchJobTypes = async () => {
  try {
    const response = await getDictionaryByType({ type: 0 }); // 0-职业(工种)
    if (response && response.code === 200 && response.data) {
      jobTypes.value = response.data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code
      }));
    }
  } catch (error) {
    console.error('获取职业(工种)列表失败:', error);
  }
};

// 获取审批列表
const fetchApprovalList = async () => {
  isLoading.value = true;
  try {
    // 构建查询参数
    const searchInfo = {
      approvalType: 1, // 1-考试申请
      offset: 0,
      limit: 1000
    };
    
    // 如果是考核站管理员（role=4），只查询自己考核站的数据
    if (isStationAdmin.value && currentUser.value.stationId) {
      searchInfo.stationId = currentUser.value.stationId;
    }
    
    console.log('查询参数:', searchInfo);
    console.log('当前用户:', currentUser.value);
    
    const response = await searchApprovals(searchInfo);
    console.log('查询响应:', response);
    
    if (response.code === 200 && response.data) {
      approvalList.value = response.data.list || [];
      console.log('审批列表:', approvalList.value);
    } else {
      console.error('查询失败:', response);
      if (response.msg) {
        ElMessage.error(response.msg);
      }
    }
  } catch (error) {
    console.error('获取审批列表失败:', error);
    ElMessage.error('获取审批列表失败: ' + (error.message || error));
  } finally {
    isLoading.value = false;
  }
};

// 显示新增表单
const showAddForm = () => {
  editingId.value = null;
  resetForm();
  showForm.value = true;
};

// 取消表单
const cancelForm = () => {
  showForm.value = false;
  editingId.value = null;
  resetForm();
};

// 重置表单
const resetForm = () => {
  formData.value = {
    year: isStationAdmin.value ? new Date().getFullYear() : new Date().getFullYear(),
    stationId: isStationAdmin.value ? (currentUser.value.stationId || '') : (currentUser.value.stationId || ''),
    jobType: '',
    examMode: '',
    location: '',
    remark: '',
    uploadFile: null
  };
};

// 文件上传相关
const ACCEPT_EXT = ['.docx', '.doc', '.pdf', '.xlsx', '.xls'];
const validateFile = (file) => {
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  if (!ACCEPT_EXT.includes(ext)) {
    ElMessage.warning('仅支持 Word (.docx/.doc)、PDF (.pdf)、Excel (.xlsx/.xls) 格式');
    return false;
  }
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    ElMessage.warning('文件大小不能超过 20MB');
    return false;
  }
  return true;
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileSelect = (e) => {
  const file = e.target.files?.[0];
  if (file && validateFile(file)) {
    formData.value.uploadFile = file;
  }
  e.target.value = '';
};

const handleFileDrop = (e) => {
  isDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file && validateFile(file)) {
    formData.value.uploadFile = file;
  }
};

const handleDragOver = () => {
  isDragOver.value = true;
};

const removeUploadFile = () => {
  formData.value.uploadFile = null;
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
};

// 提交申请
const submitApplication = async () => {
  // 考核站管理员：验证文件与工种
  if (isStationAdmin.value) {
    if (!formData.value.uploadFile) {
      ElMessage.warning('请上传考试信息文件');
      return;
    }
    if (!formData.value.jobType) {
      ElMessage.warning('请选择工种');
      return;
    }
  } else {
    if (!formData.value.year) {
      ElMessage.warning('请输入年度');
      return;
    }
    if (!formData.value.stationId) {
      ElMessage.warning('请选择考核站');
      return;
    }
    if (!formData.value.jobType) {
      ElMessage.warning('请选择工种');
      return;
    }
    if (!formData.value.examMode) {
      ElMessage.warning('请选择线上线下');
      return;
    }
    if (!formData.value.location) {
      ElMessage.warning('请输入地点');
      return;
    }
  }

  isSaving.value = true;
  try {
    let fileUrl = '';
    let fileName = '';

    // 考核站管理员：先上传文件
    if (isStationAdmin.value && formData.value.uploadFile) {
      try {
        const uploadRes = await uploadFile(formData.value.uploadFile);
        // 兼容不同返回格式：{ data: 'url' } 或 { url: '...' } 或直接字符串
        fileUrl = uploadRes?.data ?? uploadRes?.url ?? (typeof uploadRes === 'string' ? uploadRes : '');
        fileName = formData.value.uploadFile.name;
      } catch (err) {
        ElMessage.error('文件上传失败: ' + (err.message || err));
        isSaving.value = false;
        return;
      }
    }

    // 构建申请内容JSON
    const contentObj = isStationAdmin.value
      ? {
          year: new Date().getFullYear(),
          examMode: '',
          location: '',
          remark: formData.value.remark,
          fileUrl,
          fileName
        }
      : {
          year: formData.value.year,
          examMode: formData.value.examMode,
          location: formData.value.location,
          remark: formData.value.remark
        };
    const content = JSON.stringify(contentObj);

    const response = await createApproval({
      approvalType: 1, // 1-考试申请
      stationId: isStationAdmin.value ? currentUser.value.stationId : formData.value.stationId,
      jobType: formData.value.jobType,
      content
    });

    if (response.code === 200) {
      ElMessage.success('申请提交成功，等待管理员审核');
      cancelForm();
      fetchApprovalList();
    } else {
      ElMessage.error(response.msg || '提交失败');
    }
  } catch (error) {
    ElMessage.error('提交失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

// 提交审批
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
    // 如果状态是审批拒绝，需要先重置状态为待提交审批
    if (isRejected(item.status)) {
      // 先调用编辑接口，不修改内容，只是重置状态
      const updateResponse = await updateApproval({
        id: item.id,
        content: item.content // 使用原内容，不修改
      });
      
      if (updateResponse.code !== 200) {
        ElMessage.error(updateResponse.msg || '重置状态失败');
        return;
      }
    }
    
    // 提交审批
    const response = await submitApproval(item.id);
    if (response.code === 200) {
      ElMessage.success('提交审批成功');
      fetchApprovalList();
    } else {
      ElMessage.error(response.msg || '提交失败');
    }
  } catch (error) {
    ElMessage.error('提交失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

// 显示审批模态框
const showApproveModal = (item) => {
  currentApproval.value = item;
  approveForm.value = { status: 1, remark: '' };
  showApprove.value = true;
};

// 关闭审批模态框
const closeApproveModal = () => {
  showApprove.value = false;
  currentApproval.value = null;
};

// 提交审批
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
      fetchApprovalList();
    } else {
      ElMessage.error(response.msg || '审批失败');
    }
  } catch (error) {
    ElMessage.error('审批失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

// 显示编辑模态框
const showEditModal = (item) => {
  if (!item) return;
  
  currentApproval.value = item;
  
  // 从content中解析数据填充到编辑表单
  try {
    const contentObj = item.content ? JSON.parse(item.content) : {};
    editForm.value = {
      year: contentObj.year || new Date().getFullYear(),
      stationId: item.stationId || (isStationAdmin.value ? (currentUser.value.stationId || '') : ''),
      jobType: item.jobType || '',
      examMode: contentObj.examMode || '',
      location: contentObj.location || '',
      remark: contentObj.remark || ''
    };
  } catch (e) {
    // 如果解析失败，使用默认值
    editForm.value = {
      year: new Date().getFullYear(),
      stationId: item.stationId || (isStationAdmin.value ? (currentUser.value.stationId || '') : ''),
      jobType: item.jobType || '',
      examMode: '',
      location: '',
      remark: ''
    };
  }
  
  showEdit.value = true;
};

// 关闭编辑模态框
const closeEditModal = () => {
  showEdit.value = false;
  currentApproval.value = null;
  resetEditForm();
};

// 重置编辑表单
const resetEditForm = () => {
  editForm.value = {
    year: new Date().getFullYear(),
    stationId: '',
    jobType: '',
    examMode: '',
    location: '',
    remark: ''
  };
};

// 提交编辑
const submitEdit = async () => {
  // 验证表单
  if (!isStationAdmin.value) {
    if (!editForm.value.year) {
      ElMessage.warning('请输入年度');
      return;
    }
    if (!editForm.value.stationId) {
      ElMessage.warning('请选择考核站');
      return;
    }
  }
  if (!editForm.value.jobType) {
    ElMessage.warning('请选择工种');
    return;
  }
  if (!editForm.value.examMode) {
    ElMessage.warning('请选择线上线下');
    return;
  }
  if (!editForm.value.location) {
    ElMessage.warning('请输入地点');
    return;
  }

  if (!currentApproval.value) return;

  isSaving.value = true;
  try {
    // 构建申请内容JSON
    const content = JSON.stringify({
      year: editForm.value.year,
      examMode: editForm.value.examMode,
      location: editForm.value.location,
      remark: editForm.value.remark
    });

    const response = await updateApproval({
      id: currentApproval.value.id,
      content: content
    });

    if (response.code === 200) {
      ElMessage.success('编辑成功，状态已重置为待提交审批');
      closeEditModal();
      fetchApprovalList();
    } else {
      ElMessage.error(response.msg || '编辑失败');
    }
  } catch (error) {
    ElMessage.error('编辑失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

// 删除申请
const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除该申请吗？\n年度：${getYearFromContent(item.content)}\n职业(工种)：${item.jobType}\n线上线下：${getExamModeFromContent(item.content)}\n地点：${getLocationFromContent(item.content)}`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const response = await deleteApproval(item.id);
    if (response.code === 200) {
      ElMessage.success('删除成功');
      fetchApprovalList();
    } else {
      ElMessage.error(response.msg || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message);
    }
  }
};

onMounted(() => {
  // 先获取基础数据
  fetchExamStations();
  fetchJobTypes();
  
  // 如果是考核站管理员，自动填充年度和考核站
  if (isStationAdmin.value) {
    formData.value.year = new Date().getFullYear();
    if (currentUser.value.stationId) {
      formData.value.stationId = currentUser.value.stationId;
    }
  } else {
    if (currentUser.value.stationId) {
      formData.value.stationId = currentUser.value.stationId;
    }
  }
  
  // 使用nextTick确保computed已更新，然后获取审批列表
  nextTick(() => {
    // 再延迟一点确保用户信息已加载
    setTimeout(() => {
      fetchApprovalList();
    }, 100);
  });
});
</script>

<style scoped>
.exam-application-report {
  padding: 20px;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 500;
}

/* 列表样式 */
.list-container {
  background: white;
  padding: 24px;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.action-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-start;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background-color: #fafafa;
  font-weight: 500;
  color: #333;
}

.data-table tbody tr:hover {
  background-color: #fafafa;
}

.operations {
  white-space: nowrap;
  display: flex;
  gap: 10px;
}

.submit-link,
.approve-link,
.edit-link,
.delete-link {
  color: #1890ff;
  text-decoration: none;
  cursor: pointer;
}

.submit-link:hover,
.approve-link:hover,
.edit-link:hover {
  text-decoration: underline;
}

.delete-link {
  color: #ff4d4f;
}

.delete-link:hover {
  text-decoration: underline;
}

.text-center {
  text-align: center;
}

.text-muted {
  color: #999;
}

.status-pending {
  color: #faad14;
}

.status-approved {
  color: #52c41a;
}

.status-rejected {
  color: #ff4d4f;
}

/* 审批模态框样式 */
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

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

/* 表单样式 */
.form-container {
  max-width: 600px;
  background: white;
  padding: 24px;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.form-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.btn-link {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
}

.btn-link:hover {
  color: #40a9ff;
  text-decoration: underline;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.form-group label.required::before {
  content: '*';
  color: red;
  margin-right: 4px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #c70019;
  color: white;
  border-color: #c70019;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border-color: #dcdfe6;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #ebebeb;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.plus-icon {
  margin-right: 4px;
}

/* 文件上传区域 */
.form-header-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.tab-active {
  font-size: 16px;
  font-weight: 500;
}

.upload-section .upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.upload-section .upload-area:hover,
.upload-section .upload-area.drag-over {
  border-color: #c70019;
  background-color: #fff8f8;
}

.upload-content {
  pointer-events: none;
}

.upload-content .upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-content .upload-text {
  font-size: 16px;
  color: #333;
  margin: 0 0 8px 0;
}

.upload-content .upload-hint {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.file-info .file-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.file-info .file-size {
  font-size: 12px;
  color: #999;
}

.remove-file-btn {
  padding: 4px 12px;
  font-size: 12px;
  color: #ff4d4f;
  background: none;
  border: 1px solid #ff4d4f;
  border-radius: 4px;
  cursor: pointer;
}

.remove-file-btn:hover {
  background: #fff1f0;
}
</style>
