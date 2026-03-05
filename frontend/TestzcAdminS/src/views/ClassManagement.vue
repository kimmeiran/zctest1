<template>
  <div class="class-management">
    <h2 class="page-title">考试人员管理</h2>

    <div class="content-container">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <div class="search-input">
          <span class="label">职工姓名:</span>
          <input type="text" v-model="searchKeyword" placeholder="请输入" />
        </div>
        <button class="search-btn" @click="handleSearch">查询</button>
        <button class="reset-btn" @click="handleReset">重置</button>
      </div>

      <!-- 添加按钮和批量操作 -->
      <div class="action-bar">
        <div class="action-group">
          <button class="add-btn" @click="openAddModal">
            <span class="plus-icon">+</span> 新增
          </button>
          <button class="batch-btn" @click="openBatchImportModal">
            <span class="import-icon">↑</span> 批量导入
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="error" class="error-message">
        {{ error }}
        <button class="btn btn-primary retry-btn" @click="fetchPersons">重试</button>
      </div>

      <!-- 数据表格 -->
      <table class="data-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>职工名字</th>
            <th>工号</th>
            <th>职位</th>
            <th>报考职称等级</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(person, index) in paginatedPersons" :key="person.id || index">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ person.personName || '-' }}</td>
            <td>{{ person.personId || '-' }}</td>
            <td>{{ person.jobType || '-' }}</td>
            <td>{{ person.level || '-' }}</td>
            <td>{{ formatDateTime(person.createTime) }}</td>
            <td class="operations">
              <button class="edit-btn" @click="openEditModal(person)">编辑</button>
              <button class="delete-btn" @click="openDeleteConfirm(person)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页控件 -->
      <div class="pagination-container" v-if="!isLoading && !error && totalItems > 0">
        <div class="total-count">共 {{ totalItems }} 条</div>
        <div class="pagination">
          <a href="#" class="page-nav prev" @click.prevent="goToPage(currentPage - 1)"
            :class="{ disabled: currentPage === 1 }">&lt;</a>
          <template v-for="page in displayedPages" :key="page">
            <template v-if="page === '...'">
              <span class="ellipsis">...</span>
            </template>
            <template v-else>
              <a href="#" class="page-number" :class="{ active: page === currentPage }"
                @click.prevent="goToPage(page)">{{ page }}</a>
            </template>
          </template>
          <a href="#" class="page-nav next" @click.prevent="goToPage(currentPage + 1)"
            :class="{ disabled: currentPage === totalPages }">&gt;</a>
        </div>
        <div class="page-size-selector">
          <span>{{ pageSize }} 条/页</span>
          <select v-model="pageSize" @change="handlePageSizeChange">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 添加/编辑模态框 -->
    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <h3 class="modal-title">{{ isEditing ? "编辑" : "新增" }}</h3>

        <div class="form-group">
          <label>工号</label>
          <input type="text" v-model="formData.personId" placeholder="请输入工号" />
        </div>

        <div class="form-group">
          <label>职位</label>
          <select v-model="formData.jobType" class="form-select">
            <option value disabled>请选择职位</option>
            <option v-for="position in positionOptions" :key="position.id" :value="position.name">{{ position.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>报考等级</label>
          <select v-model="formData.level" class="form-select">
            <option value disabled>请选择报考等级</option>
            <option v-for="classOption in classOptions" :key="classOption.id" :value="classOption.name">{{
              classOption.name
            }}</option>
          </select>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="handleSubmit" :disabled="isSaving">{{ isSaving ? '保存中...' : '确定'
          }}</button>
        </div>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div class="modal" v-if="showDeleteModal">
      <div class="modal-content delete-confirm">
        <h3 class="modal-title">确认删除</h3>
        <p class="confirm-message">确定要删除该报考名单吗？</p>

        <div class="modal-footer">
          <button class="cancel-btn" @click="closeDeleteModal" :disabled="isDeleting">取消</button>
          <button class="confirm-btn delete" @click="handleDelete" :disabled="isDeleting">{{ isDeleting ? '删除中...' :
            '确定'
          }}</button>
        </div>
      </div>
    </div>

    <!-- 批量导入模态框 -->
    <div class="modal-overlay" v-if="showBatchImportModal" @click="closeBatchImportModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>批量导入</h3>
          <button class="close-button" @click="closeBatchImportModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>模板下载</label>
            <button class="btn btn-download full-width" @click="downloadTemplate">
              <span class="download-icon">↓</span> 下载模板
            </button>
          </div>

          <div class="form-group">
            <label>导入</label>
            <div class="file-upload-container">
              <input type="file" id="file-upload" class="file-input" ref="fileInput" @change="handleFileChange"
                accept=".xlsx, .xls, .csv" />
              <label for="file-upload" class="file-upload-label">
                <span class="upload-icon">↑</span> 选择文件
              </label>
              <span v-if="selectedFile" class="selected-file-name">{{ selectedFile.name }}</span>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="import-progress" v-if="importProgress > 0">
            <div class="progress-bar" :style="{ width: importProgress + '%' }"></div>
            <span class="progress-text">{{ importProgress }}%</span>
          </div>

          <!-- 错误信息 -->
          <div class="error-list" v-if="importErrors.length > 0">
            <h4>导入错误 ({{ importErrors.length }}条)</h4>
            <ul>
              <li v-for="(error, index) in importErrors" :key="index">第{{ error.row }}行: {{ error.message }}</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeBatchImportModal" :disabled="isImporting">取消</button>
          <button class="btn btn-primary" @click="handleImport" :disabled="!selectedFile || isImporting">{{ isImporting
            ?
            '导入中...' : '开始导入' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  getExamPersonPage,
  addExamPerson,
  updateExamPerson,
  deleteExamPerson,
  getDictionaryByType,
  getAllTeachers,
  exportExamWord,
  importExamPersons,
  downloadExamPersonTemplate
  // downloadTemplate as apiDownloadTemplate
} from "@/api/user";
import * as XLSX from "xlsx";
import { ROLE_MANAGER, isRole } from "@/constants/role";

// 获取当前用户信息
const currentUser = ref(JSON.parse(sessionStorage.getItem("user") || "{}"));
const isAdmin = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));
const currentTeacherName = computed(() => currentUser.value.teachName || "");

// 教师选项
const teacherOptions = ref([]);
const loadingTeachers = ref(false);

// 合班标识选项
const classOptions = ref([]); // 报考等级选项

// 职位选项
const positionOptions = ref([]);

// 批量导入相关
const showBatchImportModal = ref(false);
const selectedFile = ref(null);
const fileInput = ref(null);
const isImporting = ref(false);
const importProgress = ref(0);
const importErrors = ref([]);

// 获取职位选项
const fetchPositionOptions = async () => {
  try {
    const response = await getDictionaryByType({ type: 0 }); // 假设9为职位类型
    if (response && response.code === 200) {
      positionOptions.value = response.data || [];
    } else {
      throw new Error(response?.msg || "获取职位数据失败");
    }
  } catch (error) {
    console.error("获取职位数据失败:", error);
  }
};

// 获取报考等级选项
const fetchClassOptions = async () => {
  try {
    const response = await getDictionaryByType({ type: 1 });
    if (response && response.code === 200) {
      classOptions.value = response.data || [];
    } else {
      throw new Error(response?.msg || "获取报考等级数据失败");
    }
  } catch (error) {
    console.error("获取报考等级数据失败:", error);
  }
};

// 状态变量
const personList = ref([]);
const isLoading = ref(true);
const isSaving = ref(false);
const isDeleting = ref(false);
const error = ref(null);

// 搜索关键字
const searchKeyword = ref("");

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

// 当前页显示的数据
const paginatedPersons = computed(() => personList.value);

// 计算显示哪些页码
const displayedPages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;
  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    let startPage = Math.max(
      2,
      currentPage.value - Math.floor((maxVisiblePages - 3) / 2)
    );
    let endPage = Math.min(
      totalPages.value - 1,
      startPage + maxVisiblePages - 4
    );
    if (endPage - startPage + 1 < maxVisiblePages - 3) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 4) + 1);
    }
    if (startPage > 2) {
      pages.push("...");
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    if (endPage < totalPages.value - 1) {
      pages.push("...");
    }
    pages.push(totalPages.value);
  }
  return pages;
});

// 模态框相关
const showModal = ref(false);
const isEditing = ref(false);
const formData = ref({
  personId: "",
  jobType: "",
  level: 1
});
const currentEditId = ref(null);

// 删除确认框相关
const showDeleteModal = ref(false);
const itemToDelete = ref(null);

// 获取考试人员列表
const fetchPersons = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await getExamPersonPage({
      page: currentPage.value,
      pageSize: pageSize.value,
      personName: searchKeyword.value || undefined
    });
    if (res && res.code === 200) {
      personList.value = res.data.list || [];
      totalItems.value = res.data.total || 0;
    } else {
      throw new Error(res?.msg || "获取考试人员列表失败");
    }
  } catch (err) {
    error.value = err.message || "获取考试人员列表失败，请稍后重试";
    personList.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
  }
};

const goToPage = page => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchPersons();
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
  fetchPersons();
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchPersons();
};

const handleReset = () => {
  searchKeyword.value = "";
  currentPage.value = 1;
  fetchPersons();
};

const openAddModal = () => {
  isEditing.value = false;
  formData.value = {
    personId: "",
    jobType: "",
    level: 1
  };
  showModal.value = true;
};

const openEditModal = person => {
  isEditing.value = true;
  currentEditId.value = person.id;
  formData.value = {
    personId: person.personId,
    jobType: person.jobType,
    level: person.level
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const handleSubmit = async () => {
  if (
    !formData.value.personId ||
    !formData.value.jobType ||
    !formData.value.level
  ) {
    ElMessage.warning("请填写完整信息");
    return;
  }
  isSaving.value = true;
  try {
    let res;
    if (isEditing.value) {
      res = await updateExamPerson({
        id: currentEditId.value,
        ...formData.value
      });
    } else {
      res = await addExamPerson({
        personId: formData.value.personId,
        jobType: formData.value.jobType,
        level: formData.value.level
      });
    }
    if (res && res.code === 200) {
      ElMessage.success(isEditing.value ? "更新成功" : "添加成功");
      fetchPersons();
      closeModal();
    } else {
      throw new Error(res?.msg || (isEditing.value ? "更新失败" : "添加失败"));
    }
  } catch (err) {
    ElMessage.error(err.message || "操作失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};

const openDeleteConfirm = person => {
  itemToDelete.value = person;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  itemToDelete.value = null;
};

const handleDelete = async () => {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await deleteExamPerson(Number(itemToDelete.value.id));
    if (res && res.code === 200) {
      ElMessage.success("删除成功");
      fetchPersons();
      closeDeleteModal();
    } else {
      throw new Error(res?.msg || "删除失败");
    }
  } catch (err) {
    ElMessage.error(err.message || "删除失败，请稍后重试");
  } finally {
    isDeleting.value = false;
  }
};

// 导出考试人员名单为Word
const exportClassList = async () => {
  // 这里假设有 teachExamId，如果没有请补充传参或获取方式
  const teachExamId = 1; // TODO: 替换为实际的考试ID
  try {
    const blob = await exportExamWord(teachExamId);
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "考试人员名单.docx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败，请稍后重试");
  }
};

// 批量导入相关方法
const openBatchImportModal = () => {
  showBatchImportModal.value = true;
  importErrors.value = [];
  importProgress.value = 0;
};

const closeBatchImportModal = () => {
  showBatchImportModal.value = false;
  selectedFile.value = null;
  isImporting.value = false;
  importProgress.value = 0;
  importErrors.value = [];
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleDrop = e => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (isValidFileType(file)) {
      selectedFile.value = file;
    } else {
      ElMessage.error("请上传.xlsx或.xls格式的文件");
    }
  }
};

const isValidFileType = file => {
  const validTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv"
  ];
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  return (
    validTypes.includes(fileType) ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".csv")
  );
};

const handleFileChange = e => {
  const file = e.target.files[0];
  if (file && isValidFileType(file)) {
    selectedFile.value = file;
  } else {
    ElMessage.error("请上传.xlsx、.xls或.csv格式的文件");
  }
};

const removeFile = () => {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const formatFileSize = bytes => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const downloadTemplate = async () => {
  try {
    const { blob, filename } = await downloadExamPersonTemplate();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename || "考试人员管理.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success("模板下载成功");
  } catch (error) {
    console.error("下载模板失败:", error);
    ElMessage.error("下载模板失败");
  }
};

const handleImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning("请先选择文件");
    return;
  }

  isImporting.value = true;
  importProgress.value = 0;
  importErrors.value = [];

  try {
    const interval = setInterval(() => {
      importProgress.value = Math.min(importProgress.value + 15, 85);
    }, 300);
    const res = await importExamPersons(selectedFile.value);
    clearInterval(interval);
    if (res && res.code === 200) {
      importProgress.value = 100;
      ElMessage.success("导入成功");
      fetchPersons();
      setTimeout(() => {
        closeBatchImportModal();
      }, 800);
    } else {
      throw new Error(res?.msg || "导入失败");
    }
  } catch (error) {
    console.error("导入失败:", error);
    ElMessage.error(error.message || "导入失败，请检查文件后重试");
  } finally {
    isImporting.value = false;
  }
};

const readExcelFile = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        resolve(jsonData);
      } catch (error) {
        reject(new Error("解析Excel文件失败"));
      }
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsArrayBuffer(file);
  });
};

const validateImportData = data => {
  const errors = [];
  const validData = [];

  // 跳过标题行
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowErrors = [];

    if (!row || row.length < 3) {
      rowErrors.push("数据不完整");
      continue;
    }

    const [personId, jobType, level] = row;

    if (!personId) rowErrors.push("工号不能为空");
    if (!jobType) rowErrors.push("职位不能为空");
    if (!level) rowErrors.push("报考等级不能为空");

    if (rowErrors.length > 0) {
      errors.push({
        row: i + 1,
        message: rowErrors.join("; ")
      });
    } else {
      validData.push({
        personId,
        jobType,
        level,
        createId: currentUser.value.id
      });
    }
  }

  return { validData, errors };
};

// 时间格式化函数
function formatDateTime(val) {
  if (!val) return "";
  // 兼容带时区的ISO字符串
  const date = new Date(val);
  if (isNaN(date.getTime())) return val;
  const pad = n => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
}

// 生命周期钩子
onMounted(() => {
  fetchPersons();
  fetchPositionOptions();
  fetchClassOptions();
});
</script>

<style scoped>
/* 原有样式保持不变，新增以下样式 */

.action-group {
  display: flex;
  gap: 10px;
}

.batch-btn,
.template-btn {
  background-color: #c70019;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.batch-btn:hover {
  background-color: #40a9ff;
}

.template-btn {
  background-color: #52c41a;
}

.template-btn:hover {
  background-color: #73d13d;
}

.import-icon,
.download-icon {
  margin-right: 5px;
  font-weight: bold;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 4px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 10px 24px;
  text-align: right;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 表单组样式 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

/* 按钮样式 */
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-download {
  background-color: #c70019;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.full-width {
  width: 100%;
}

/* 文件上传样式 */
.file-upload-container {
  position: relative;
}

.file-input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}

.file-upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 15px;
  background-color: #f0f0f0;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
}

.upload-icon,
.download-icon {
  margin-right: 5px;
}

.selected-file-name {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #666;
  word-break: break-all;
}

/* 进度条样式 */
.import-progress {
  height: 20px;
  background-color: #f5f5f5;
  border-radius: 10px;
  margin: 15px 0;
  position: relative;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #52c41a;
  transition: width 0.3s;
}

.progress-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

/* 错误列表样式 */
.error-list {
  margin-top: 15px;
  padding: 10px;
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
}

.error-list h4 {
  margin: 0 0 10px 0;
  color: #ff4d4f;
  font-size: 14px;
}

.error-list ul {
  margin: 0;
  padding-left: 20px;
}

.error-list li {
  margin-bottom: 5px;
  color: #ff4d4f;
  font-size: 13px;
}

/* 样式部分保持不变 */
.class-management {
  padding: 20px;
}

.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 500;
}

.content-container {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #eee;
}

.search-input {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.label {
  margin-right: 5px;
}

.search-input input {
  width: 200px;
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.search-btn,
.reset-btn {
  padding: 6px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

.search-btn {
  background-color: #c70019;
  color: white;
}

.search-btn:hover {
  background-color: #40a9ff;
}

.reset-btn {
  background-color: #f0f0f0;
  color: #333;
}

.reset-btn:hover {
  background-color: #e0e0e0;
}

/* 操作栏 */
.action-bar {
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
}

.add-btn {
  background-color: #c70019;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.add-btn:hover {
  background-color: #c70019;
}

.plus-icon {
  margin-right: 5px;
  font-weight: bold;
}

/* 加载和错误状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #c70019;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  text-align: center;
  color: #ff4d4f;
  padding: 20px;
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  margin: 20px;
}

.retry-btn {
  margin-top: 10px;
  background-color: #c70019;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 15px;
  cursor: pointer;
}

/* 表格样式 */
.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
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

.data-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.operations {
  display: flex;
  gap: 10px;
}

.edit-btn,
.delete-btn {
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  color: white;
}

.edit-btn {
  background-color: #1890ff;
}

.edit-btn:hover {
  background-color: #40a9ff;
}

.delete-btn {
  background-color: #ff4d4f;
}

.delete-btn:hover {
  background-color: #ff7875;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-number,
.page-nav,
.ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 4px;
  font-size: 14px;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
}

.page-number:hover,
.page-nav:hover {
  background-color: #f0f0f0;
}

.page-number.active {
  background-color: #c70019;
  color: white;
}

.ellipsis {
  cursor: default;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-size-selector select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

/* 模态框 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 4px;
  width: 400px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.delete-confirm {
  width: 300px;
}

.modal-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-sizing: border-box;
}

.disabled-input {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 30px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.cancel-btn,
.confirm-btn {
  padding: 6px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f0f0f0;
  color: #333;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.confirm-btn {
  background-color: #c70019;
  color: white;
}

.confirm-btn:hover {
  background-color: #40a9ff;
}

.confirm-btn.delete {
  background-color: #ff4d4f;
}

.confirm-btn.delete:hover {
  background-color: #ff7875;
}

.confirm-message {
  text-align: center;
  margin: 20px 0;
}
</style>