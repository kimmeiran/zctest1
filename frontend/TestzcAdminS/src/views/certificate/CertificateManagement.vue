<template>
  <div class="certificate-management">
    <h2 class="page-title">证书管理</h2>

    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="search-group">
        <label>证书编号</label>
        <input
          type="text"
          class="search-input"
          placeholder="请输入证书编号"
          v-model="searchInfo.certificateNumber"
        />
      </div>
      <div class="search-group">
        <label>姓名</label>
        <input
          type="text"
          class="search-input"
          placeholder="请输入姓名"
          v-model="searchInfo.studentName"
        />
      </div>
      <div class="search-group">
        <label>状态</label>
        <select class="form-select" v-model="searchInfo.status">
          <option :value="null">全部</option>
          <option :value="0">已录入</option>
          <option :value="1">已邮寄</option>
          <option :value="2">已收到</option>
        </select>
      </div>
      <div class="search-group">
        <label>邮寄时间</label>
        <input
          type="date"
          class="search-input"
          v-model="searchInfo.mailTime"
        />
      </div>
      <div class="search-group" v-if="canCreate">
        <label>考核站</label>
        <select class="form-select" v-model="searchInfo.stationId">
          <option :value="null">全部</option>
          <option v-for="s in examStations" :key="s.id" :value="s.id">{{ s.stationName }}</option>
        </select>
      </div>
      <div class="search-group">
        <label>考试名称</label>
        <input
          type="text"
          class="search-input"
          placeholder="请输入考试名称"
          v-model="searchInfo.examName"
        />
      </div>
      <div class="search-group">
        <label>快递单号</label>
        <input
          type="text"
          class="search-input"
          placeholder="请输入快递单号"
          v-model="searchInfo.mailTrackingNumber"
        />
      </div>
      <div class="search-group">
        <label>有效期</label>
        <input
          type="text"
          class="search-input"
          placeholder="请输入有效期"
          v-model="searchInfo.validityPeriod"
        />
      </div>
      <div class="search-buttons">
        <button class="btn btn-primary" @click="search" :disabled="isLoading">查询</button>
        <button class="btn btn-secondary" @click="reset" :disabled="isLoading">重置</button>
      </div>
    </div>

    <!-- 操作按钮 - 管理和总管理可以新增 -->
    <div class="action-buttons" v-if="canCreate">
      <button class="btn btn-add" @click="showCreateModal">
        <span class="plus-icon">+</span> 新增证书
      </button>
    </div>

    <!-- 数据表格 -->
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>证书编号</th>
            <th>姓名</th>
            <th>工号</th>
            <th>考试名称</th>
            <th>考核站</th>
            <th>状态</th>
            <th>发证日期</th>
            <th>下证日期</th>
            <th>有效期</th>
            <th>快递单号</th>
            <th>邮寄时间</th>
            <th>接收时间</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in certificateList" :key="item.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ item.certificateNumber || '-' }}</td>
            <td>{{ item.studentName || '-' }}</td>
            <td>{{ item.studentId || item.employeeId || '-' }}</td>
            <td>{{ item.examName || '-' }}</td>
            <td>{{ item.stationName || '-' }}</td>
            <td>
              <span :class="getStatusClass(item.status)">
                {{ getStatusName(item.status) }}
              </span>
            </td>
            <td>{{ item.issueDate || item.issueTime || '-' }}</td>
            <td>{{ item.downDate || item.certificateDate || item.certificateTime || '-' }}</td>
            <td>{{ item.validityPeriod || item.validity || '-' }}</td>
            <td>{{ item.mailTrackingNumber || '-' }}</td>
            <td>{{ item.mailTime || '-' }}</td>
            <td>{{ item.receiveTime || '-' }}</td>
            <td>{{ item.remark || '-' }}</td>
            <td class="operations">
              <!-- 已录入状态：管理和总管理可以标记为已邮寄 -->
              <a
                v-if="item.status === 0 && canCreate"
                href="#"
                class="mail-link"
                @click.prevent="showMailModal(item)"
              >标记为已邮寄</a>
              <!-- 已邮寄状态：考核站管理员可以确认收到 -->
              <a
                v-if="item.status === 1 && canReceive"
                href="#"
                class="receive-link"
                @click.prevent="handleConfirmReceived(item)"
              >确认收到</a>
              <!-- 管理和总管理可以编辑和删除 -->
              <a
                v-if="canCreate && (item.status === 0 || item.status === 1)"
                href="#"
                class="edit-link"
                @click.prevent="showEditModal(item)"
              >编辑</a>
              <a
                v-if="canCreate && item.status === 0"
                href="#"
                class="delete-link"
                @click.prevent="handleDelete(item)"
              >删除</a>
            </td>
          </tr>
          <tr v-if="!isLoading && certificateList.length === 0">
            <td colspan="15" style="text-align: center; padding: 20px; color: #909399;">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <Pagination
      v-if="totalItems > 0"
      :total="totalItems"
      :current-page="currentPage"
      :page-size="pageSize"
      @change="onPageChange"
    />

    <!-- 新增证书模态框 -->
    <div class="modal-overlay" v-if="showCreateModalFlag" @mousedown.self="closeCreateModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>新增证书</h3>
          <button class="close-button" @click="closeCreateModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="required">证书号</label>
            <input
              type="text"
              class="form-input"
              v-model="formData.certificateNumber"
              placeholder="请输入证书号"
            />
          </div>
          <div class="form-group">
            <label class="required">选择考试</label>
            <select class="form-select" v-model="formData.examId" @change="onCreateExamChange">
              <option :value="null">请选择考试</option>
              <option v-for="exam in examList" :key="exam.id" :value="exam.id">
                {{ exam.examName }} ({{ exam.jobType }} - {{ exam.level }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="required">选择学生</label>
            <select
              class="form-select"
              v-model="formData.studentId"
              :disabled="!formData.examId"
              placeholder="请先选择考试"
            >
              <option :value="null">请先选择考试</option>
              <option v-for="s in passedApplicantsList" :key="s.studentId" :value="s.studentId">
                {{ s.studentName || s.sname || '' }}（{{ s.studentId }}{{ s.stationName ? '_' + s.stationName : '' }}）
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>考核站</label>
            <input
              type="text"
              class="form-input"
              :value="selectedStudentStationName"
              readonly
              placeholder="根据所选学生自动带出，无需选择"
            />
          </div>
          <div class="form-group">
            <label>发证日期</label>
            <input type="date" class="form-input" v-model="formData.issueDate" placeholder="选择发证日期" />
          </div>
          <div class="form-group">
            <label>下证日期</label>
            <input type="date" class="form-input" v-model="formData.downDate" placeholder="选择下证日期" />
          </div>
          <div class="form-group">
            <label>有效期</label>
            <input
              type="text"
              class="form-input"
              v-model="formData.validityPeriod"
              placeholder="如：3年、长期"
            />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea
              class="form-input"
              v-model="formData.remark"
              placeholder="请输入备注（可选）"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeCreateModal" :disabled="isSaving">取消</button>
          <button class="btn btn-primary" @click="submitCreate" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑证书模态框 -->
    <div class="modal-overlay" v-if="showEditModalFlag" @mousedown.self="closeEditModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>编辑证书</h3>
          <button class="close-button" @click="closeEditModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>证书号</label>
            <input
              type="text"
              class="form-input"
              v-model="editFormData.certificateNumber"
              placeholder="请输入证书号"
            />
          </div>
          <div class="form-group">
            <label>发证日期</label>
            <input type="date" class="form-input" v-model="editFormData.issueDate" />
          </div>
          <div class="form-group">
            <label>下证日期</label>
            <input type="date" class="form-input" v-model="editFormData.downDate" />
          </div>
          <div class="form-group">
            <label>有效期</label>
            <input type="text" class="form-input" v-model="editFormData.validityPeriod" placeholder="如：3年、长期" />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea
              class="form-input"
              v-model="editFormData.remark"
              placeholder="请输入备注（可选）"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditModal" :disabled="isSaving">取消</button>
          <button class="btn btn-primary" @click="submitEdit" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 标记为已邮寄模态框 -->
    <div class="modal-overlay" v-if="showMailModalFlag" @mousedown.self="closeMailModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>标记为已邮寄</h3>
          <button class="close-button" @click="closeMailModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="required">快递单号</label>
            <input
              type="text"
              class="form-input"
              v-model="mailFormData.mailTrackingNumber"
              placeholder="请输入快递单号"
            />
          </div>
          <div class="form-group">
            <label>邮寄时间</label>
            <input
              type="date"
              class="form-input"
              v-model="mailFormData.mailTime"
              placeholder="选择邮寄日期"
            />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea
              class="form-input"
              v-model="mailFormData.remark"
              placeholder="请输入备注（可选）"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeMailModal" :disabled="isSaving">取消</button>
          <button class="btn btn-primary" @click="submitMail" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import Pagination from "@/components/Pagination.vue";
import {
  createCertificate,
  getCertificateList,
  updateCertificate,
  deleteCertificate,
  markAsMailed,
  confirmReceived,
} from "@/api/certificate";
import { getExamList, getPassedApplicantsByExamId } from "@/api/exam";
import { getAllExamStations } from "@/api/examStation";
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, isRole, toRoleNumber } from "@/constants/role";

// 获取用户信息
const users = sessionStorage.getItem("user")
  ? JSON.parse(sessionStorage.getItem("user") || "{}")
  : {};

// 判断权限
const canCreate = computed(() => isRole(users.role, ROLE_MANAGER));
const canReceive = computed(() => {
  const r = toRoleNumber(users.role);
  return r === ROLE_EXAM_STATION_ADMIN || r === ROLE_MANAGER;
});

// 状态变量
const certificateList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const isLoading = ref(false);
const isSaving = ref(false);

// 考核站列表（管理员筛选用）
const examStations = ref([]);

// 搜索参数
const searchInfo = ref({
  certificateNumber: "",
  studentName: "",
  status: null,
  mailTime: "",
  stationId: null,
  examName: "",
  mailTrackingNumber: "",
  validityPeriod: "",
  offset: 0,
  limit: 10,
});

// 模态框状态
const showCreateModalFlag = ref(false);
const showEditModalFlag = ref(false);
const showMailModalFlag = ref(false);

// 表单数据
const formData = ref({
  certificateNumber: "",
  examId: null,
  studentId: null,
  issueDate: "",
  downDate: "",
  validityPeriod: "",
  remark: "",
});

const editFormData = ref({
  id: null,
  certificateNumber: "",
  issueDate: "",
  downDate: "",
  validityPeriod: "",
  remark: "",
});

const mailFormData = ref({
  id: null,
  mailTrackingNumber: "",
  mailTime: "",
  remark: "",
});

// 考试列表
const examList = ref([]);
// 当前考试下通过的学生列表（证书新增用）
const passedApplicantsList = ref([]);

// 计算属性
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value);
});

// 所选学生所在考核站名称（考核站不选择，使用人员所在考核站，此处仅用于展示）
const selectedStudentStationName = computed(() => {
  if (!formData.value.studentId) return "请先选择学生";
  const s = passedApplicantsList.value.find((e) => e.studentId === formData.value.studentId);
  return (s && s.stationName) || "—";
});

// 方法
const fetchCertificateList = async () => {
  isLoading.value = true;
  try {
    searchInfo.value.offset = (currentPage.value - 1) * pageSize.value;
    searchInfo.value.limit = pageSize.value;
    
    // 如果是考核站管理员，添加stationId过滤
    const params = { ...searchInfo.value };
    if (canReceive.value && users.stationId) {
      params.stationId = users.stationId;
    }
    // 清理空字符串，避免干扰后端
    if (!params.mailTime) delete params.mailTime;
    if (!params.stationId) delete params.stationId;
    if (!params.examName) delete params.examName;
    if (!params.mailTrackingNumber) delete params.mailTrackingNumber;
    if (!params.validityPeriod) delete params.validityPeriod;

    const response = await getCertificateList(params);
    if (response && response.code === 200) {
      const data = response.data;
      if (data && data.list) {
        certificateList.value = Array.isArray(data.list) ? data.list : [];
        totalItems.value = data.total || certificateList.value.length;
      } else {
        certificateList.value = [];
        totalItems.value = 0;
      }
    } else {
      ElMessage.error(response?.msg || "查询失败");
      certificateList.value = [];
      totalItems.value = 0;
    }
  } catch (err) {
    console.error("获取证书列表失败:", err);
    ElMessage.error("查询失败: " + (err.message || "未知错误"));
    certificateList.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
  }
};

const onPageChange = (page, size) => {
  currentPage.value = page;
  pageSize.value = size;
  fetchCertificateList();
};

const search = () => {
  currentPage.value = 1;
  fetchCertificateList();
};

const reset = () => {
  searchInfo.value = {
    certificateNumber: "",
    studentName: "",
    status: null,
    mailTime: "",
    stationId: null,
    examName: "",
    mailTrackingNumber: "",
    validityPeriod: "",
    offset: 0,
    limit: 10,
  };
  currentPage.value = 1;
  fetchCertificateList();
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchCertificateList();
  }
};

// 获取考试列表
const fetchExamList = async () => {
  try {
    const response = await getExamList({
      offset: 0,
      limit: 1000,
    });
    if (response && response.data && response.data.code === 200) {
      const data = response.data.data;
      if (data && data.list) {
        examList.value = Array.isArray(data.list) ? data.list : [];
      }
    }
  } catch (err) {
    console.error("获取考试列表失败:", err);
  }
};

// 选择考试后拉取该考试下通过的学生列表，并清空已选学生
const onCreateExamChange = async () => {
  formData.value.studentId = null;
  passedApplicantsList.value = [];
  if (!formData.value.examId) return;
  try {
    const res = await getPassedApplicantsByExamId(formData.value.examId);
    const data = res?.data ?? res;
    if (data?.code === 200 && data?.data) {
      passedApplicantsList.value = Array.isArray(data.data) ? data.data : [];
    }
  } catch (err) {
    console.error("获取通过学生列表失败:", err);
    ElMessage.error("获取通过学生列表失败");
  }
};

// 新增证书
const showCreateModal = () => {
  formData.value = {
    certificateNumber: "",
    examId: null,
    studentId: null,
    issueDate: "",
    downDate: "",
    validityPeriod: "",
    remark: "",
  };
  passedApplicantsList.value = [];
  showCreateModalFlag.value = true;
};

const closeCreateModal = () => {
  showCreateModalFlag.value = false;
};

const submitCreate = async () => {
  if (!formData.value.certificateNumber) {
    ElMessage.warning("请输入证书号");
    return;
  }
  if (!formData.value.examId) {
    ElMessage.warning("请选择考试");
    return;
  }
  if (!formData.value.studentId) {
    ElMessage.warning("请选择学生");
    return;
  }

  isSaving.value = true;
  try {
    const selected = passedApplicantsList.value.find((s) => s.studentId === formData.value.studentId);
    const response = await createCertificate({
      certificateNumber: formData.value.certificateNumber,
      examId: formData.value.examId,
      studentId: formData.value.studentId,
      stationId: selected && selected.stationId != null ? selected.stationId : undefined,
      issueDate: formData.value.issueDate || undefined,
      downDate: formData.value.downDate || undefined,
      validityPeriod: formData.value.validityPeriod || undefined,
      remark: formData.value.remark || "",
    });
    if (response && response.code === 200) {
      ElMessage.success("创建成功");
      closeCreateModal();
      fetchCertificateList();
    } else {
      ElMessage.error(response?.msg || "创建失败");
    }
  } catch (err) {
    ElMessage.error("创建失败: " + (err.message || "未知错误"));
  } finally {
    isSaving.value = false;
  }
};

// 编辑证书
const showEditModal = (item) => {
  editFormData.value = {
    id: item.id,
    certificateNumber: item.certificateNumber || "",
    issueDate: item.issueDate || "",
    downDate: item.downDate || "",
    validityPeriod: item.validityPeriod || "",
    remark: item.remark || "",
  };
  showEditModalFlag.value = true;
};

const closeEditModal = () => {
  showEditModalFlag.value = false;
};

const submitEdit = async () => {
  if (!editFormData.value.id) return;

  isSaving.value = true;
  try {
    const response = await updateCertificate(editFormData.value);
    if (response && response.code === 200) {
      ElMessage.success("更新成功");
      closeEditModal();
      fetchCertificateList();
    } else {
      ElMessage.error(response?.msg || "更新失败");
    }
  } catch (err) {
    ElMessage.error("更新失败: " + (err.message || "未知错误"));
  } finally {
    isSaving.value = false;
  }
};

// 标记为已邮寄
const showMailModal = (item) => {
  mailFormData.value = {
    id: item.id,
    mailTrackingNumber: "",
    mailTime: "",
    remark: "",
  };
  showMailModalFlag.value = true;
};

const closeMailModal = () => {
  showMailModalFlag.value = false;
};

const submitMail = async () => {
  if (!mailFormData.value.mailTrackingNumber) {
    ElMessage.warning("请输入快递单号");
    return;
  }
  if (!mailFormData.value.id) return;

  isSaving.value = true;
  try {
    const response = await markAsMailed({
      id: mailFormData.value.id,
      mailTrackingNumber: mailFormData.value.mailTrackingNumber,
      mailTime: mailFormData.value.mailTime || undefined,
      remark: mailFormData.value.remark || "",
    });
    if (response && response.code === 200) {
      ElMessage.success("标记成功");
      closeMailModal();
      fetchCertificateList();
    } else {
      ElMessage.error(response?.msg || "标记失败");
    }
  } catch (err) {
    ElMessage.error("标记失败: " + (err.message || "未知错误"));
  } finally {
    isSaving.value = false;
  }
};

// 确认收到
const handleConfirmReceived = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要确认收到证书 "${item.certificateNumber}" 吗？`,
      "确认收到",
      {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
  } catch {
    return;
  }

  isSaving.value = true;
  try {
    const response = await confirmReceived(item.id);
    if (response && response.code === 200) {
      ElMessage.success("确认成功");
      fetchCertificateList();
    } else {
      ElMessage.error(response?.msg || "确认失败");
    }
  } catch (err) {
    ElMessage.error("确认失败: " + (err.message || "未知错误"));
  } finally {
    isSaving.value = false;
  }
};

// 删除证书
const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除证书 "${item.certificateNumber}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
  } catch {
    return;
  }

  isSaving.value = true;
  try {
    const response = await deleteCertificate(item.id);
    if (response && response.code === 200) {
      ElMessage.success("删除成功");
      fetchCertificateList();
    } else {
      ElMessage.error(response?.msg || "删除失败");
    }
  } catch (err) {
    ElMessage.error("删除失败: " + (err.message || "未知错误"));
  } finally {
    isSaving.value = false;
  }
};

// 状态相关
const getStatusName = (status) => {
  const statusMap = {
    0: "已录入",
    1: "已邮寄",
    2: "已收到",
  };
  return statusMap[status] || "未知";
};

const getStatusClass = (status) => {
  const classMap = {
    0: "status-recorded",
    1: "status-mailed",
    2: "status-received",
  };
  return classMap[status] || "";
};

// 获取考核站列表
const fetchExamStations = async () => {
  try {
    const res = await getAllExamStations();
    const data = res?.data || res;
    if (data?.code === 200 && data?.data) {
      examStations.value = Array.isArray(data.data) ? data.data : [];
    }
  } catch (e) {
    console.error("获取考核站列表失败:", e);
  }
};

// 生命周期
onMounted(() => {
  fetchCertificateList();
  if (canCreate.value) {
    fetchExamList();
    fetchExamStations();
  } else if (canReceive.value) {
    fetchExamStations();
  }
});
</script>

<style scoped>
.certificate-management {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.search-area {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-group label {
  min-width: 80px;
}

.search-input,
.form-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
}

.search-buttons {
  display: flex;
  gap: 10px;
}

.action-buttons {
  margin-bottom: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #409eff;
  color: white;
}

.btn-secondary {
  background-color: #909399;
  color: white;
}

.btn-add {
  background-color: #67c23a;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f5f7fa;
  font-weight: bold;
}

.operations {
  white-space: nowrap;
}

.operations a {
  margin-right: 10px;
  color: #409eff;
  text-decoration: none;
}

.operations a:hover {
  text-decoration: underline;
}

.mail-link {
  color: #e6a23c !important;
}

.receive-link {
  color: #67c23a !important;
}

.delete-link {
  color: #f56c6c !important;
}

.status-recorded {
  color: #909399;
}

.status-mailed {
  color: #e6a23c;
}

.status-received {
  color: #67c23a;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 15px;
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
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  z-index: 1001;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group label.required::after {
  content: " *";
  color: red;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #303133;
}
</style>
