<template>
  <div class="student-management">
    <h2 class="page-title">职工列表</h2>

    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="search-group">
        <label for="search-input">用户名</label>
        <input id="search-input" type="text" class="search-input" placeholder="请输入" v-model="searchQuery" />
      </div>
      <div v-if="!isExamStationAdmin" class="search-group">
        <label for="exam-station-select">考核站</label>
        <select id="exam-station-select" class="search-select" v-model="selectedStationId">
          <option value="">全部</option>
          <option v-for="station in examStations" :key="station.id" :value="station.id">{{ station.stationName }}</option>
        </select>
      </div>
      <div class="search-buttons">
        <button class="btn btn-primary" @click="search" :disabled="isLoading">查询</button>
        <button class="btn btn-secondary" @click="reset" :disabled="isLoading">重置</button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="btn btn-add" @click="showAddModal">
        <span class="plus-icon">+</span> 新增
      </button>
      <button class="btn btn-download" @click="batchDownload">
        <span class="download-icon">↓</span> 批量下载
      </button>
      <button class="btn btn-import" @click="showImportModal">
        <span class="import-icon">↑</span> 导入
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误信息 -->
    <div v-else-if="error" class="error-message">
      {{ error }}
      <button class="btn btn-primary retry-btn" @click="fetchStudents">重试</button>
    </div>

    <!-- 数据表格 -->
    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <!-- <th>序号</th> -->
            <th>用户名称</th>
            <th>工号</th>
            <th>性别</th>
            <th>职业(工种)</th>
            <th>技能等级</th>
            <th>考核站</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, index) in paginatedStudents" :key="student.studentId || index">
            <!-- <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td> -->
            <td>{{ student.sname || student.name }}</td>
            <td>{{ student.studentId }}</td>
            <td>{{ student.sex || "-" }}</td>
            <td>{{ student.jobType || "-" }}</td>
            <td>{{ student.titleLevel || "-" }}</td>
            <td>{{ getStationName(student.stationId) }}</td>
            <td>{{ student.createTime || student.createdAt }}</td>
            <td class="operations">
              <a href="#" class="edit-link" @click.prevent="editStudent(student)">编辑</a>
              <a href="#" class="password-link" @click.prevent="showChangePasswordModal(student)">修改密码</a>
              <a href="#" class="delete-link" @click.prevent="confirmDeleteStudent(student)">删除</a>
            </td>
          </tr>
          <tr v-if="paginatedStudents.length === 0">
            <td colspan="9" class="no-data">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控件 -->
    <Pagination
      v-if="!isLoading && !error && totalItems > 0"
      :total="totalItems"
      :current-page="currentPage"
      :page-size="pageSize"
      @change="onPageChange"
    />

    <!-- 新增/编辑职工模态框 -->
    <div class="modal-overlay" v-if="isModalVisible" @mousedown.self="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditMode ? "编辑" : "新增" }}</h3>
          <button class="close-button" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="student-station" class="required">考核站</label>
            <select
              id="student-station"
              class="form-select"
              v-model.number="currentStudent.stationId"
              :disabled="isStationSelectDisabled"
            >
              <option value="" disabled>请选择考核站</option>
              <option
                v-for="station in examStations"
                :key="station.id"
                :value="station.id"
              >
                {{ station.stationName }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="student-name" class="required">用户名</label>
            <input id="student-name" type="text" class="form-input" v-model="currentStudent.sname"
              placeholder="请输入职工姓名" />
          </div>

          <div class="form-group">
            <label for="student-id" class="required">工号</label>
            <input id="student-id" type="text" class="form-input" v-model="currentStudent.studentId" placeholder="请输入工号"
              :disabled="isEditMode" />
          </div>

          <div class="form-group">
            <label for="student-sex" class="required">性别</label>
            <select id="student-sex" class="form-select" v-model="currentStudent.sex">
              <option value disabled selected>请选择性别</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>

          <div class="form-group">
            <label for="student-jobType" class="required">职业(工种)</label>
            <select id="student-jobType" class="form-select" v-model="currentStudent.jobType">
              <option value disabled selected>请选择职业(工种)</option>
              <option v-for="jobType in workerTypeOptions" :key="jobType.id" :value="jobType.name">{{ jobType.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="student-titleLevel">技能等级</label>
            <select id="student-titleLevel" class="form-select" v-model="currentStudent.titleLevel">
              <option value disabled selected>请选择技能等级</option>
              <option v-for="titleLevel in titleLevelOptions" :key="titleLevel.id" :value="titleLevel.name">{{
                titleLevel.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="required">状态</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="status" :value="1" v-model="currentStudent.status" />
                正常
              </label>
              <label class="radio-label">
                <input type="radio" name="status" :value="0" v-model="currentStudent.status" />
                禁用
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal" :disabled="isSaving">取消</button>
          <button class="btn btn-primary" @click="isEditMode ? updateStudentData() : addStudentData()"
            :disabled="isSaving">{{ isSaving ? '保存中...' : '确认' }}</button>
        </div>
      </div>
    </div>

    <!-- 确认删除模态框 -->
    <div class="modal-overlay" v-if="isDeleteModalVisible" @mousedown.self="closeDeleteModal">
      <div class="modal-container delete-modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="close-button" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除职工 "{{ studentToDelete?.sname || studentToDelete?.name }}" 吗？</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteModal" :disabled="isDeleting">取消</button>
          <button class="btn btn-danger" @click="deleteStudentConfirmed" :disabled="isDeleting">{{ isDeleting ? '删除中...'
            :
            '删除' }}</button>
        </div>
      </div>
    </div>

    <!-- 修改密码模态框 -->
    <div class="modal-overlay" v-if="isPasswordModalVisible" @mousedown.self="closePasswordModal">
      <div class="modal-container delete-modal" @click.stop>
        <div class="modal-header">
          <h3>修改密码</h3>
          <button class="close-button" @click="closePasswordModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>职工姓名</label>
            <input
              type="text"
              class="form-input"
              :value="studentToChangePassword?.sname || studentToChangePassword?.name"
              disabled
            />
          </div>
          <div class="form-group">
            <label>工号</label>
            <input
              type="text"
              class="form-input"
              :value="studentToChangePassword?.studentId"
              disabled
            />
          </div>
          <div class="form-group">
            <label for="new-password" class="required">新密码</label>
            <input
              id="new-password"
              type="password"
              class="form-input"
              v-model="newPassword"
            />
          </div>
          <div class="form-group">
            <label for="confirm-password" class="required">确认密码</label>
            <input
              id="confirm-password"
              type="password"
              class="form-input"
              v-model="confirmPassword"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closePasswordModal" :disabled="isChangingPassword">取消</button>
          <button class="btn btn-primary" @click="changePasswordConfirmed" :disabled="isChangingPassword">
            {{ isChangingPassword ? '修改中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 导入模态框 -->
    <div class="modal-overlay" v-if="isImportModalVisible" @mousedown.self="closeImportModal">
      <div class="modal-container" :class="{ 'modal-container-wide': importResult && importResult.invalidList && importResult.invalidList.length > 0 }" @click.stop>
        <div class="modal-header">
          <h3>导入职工</h3>
          <button class="close-button" @click="closeImportModal">&times;</button>
        </div>
        <div class="modal-body">
          <template v-if="!importResult">
            <div class="form-group">
              <label>模板下载</label>
              <button class="btn btn-download full-width" @click="downloadTemplate">
                <span class="download-icon">↓</span> 下载
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
          </template>
          <template v-else>
            <div class="import-result-summary">
              <p v-if="importResult.newList && importResult.newList.length > 0" class="result-success">成功导入 {{ importResult.newList.length }} 条新数据</p>
              <p v-if="importResult.repList && importResult.repList.length > 0" class="result-warning">有 {{ importResult.repList.length }} 条重复数据未导入</p>
              <p v-if="importResult.invalidList && importResult.invalidList.length > 0" class="result-invalid">有 {{ importResult.invalidList.length }} 条数据校验未通过未导入（工种或职级不在字典中）</p>
            </div>
            <div v-if="importResult.invalidList && importResult.invalidList.length > 0" class="import-invalid-table-wrap">
              <label>未通过校验明细</label>
              <table class="import-invalid-table">
                <thead>
                  <tr>
                    <th>工号</th>
                    <th>姓名</th>
                    <th>原因</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in importResult.invalidList" :key="idx">
                    <td>{{ row.studentId }}</td>
                    <td>{{ row.sname }}</td>
                    <td>{{ row.reason }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
        <div class="modal-footer">
          <template v-if="!importResult">
            <button class="btn btn-secondary" @click="closeImportModal" :disabled="isImporting">取消</button>
            <button class="btn btn-primary" @click="importStudents" :disabled="isImporting">{{ isImporting ? '导入中...' : '确认' }}</button>
          </template>
          <template v-else>
            <button class="btn btn-primary" @click="closeImportModal">关闭</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import Pagination from "@/components/Pagination.vue";
import { ElTreeSelect } from "element-plus";
import {
  getStudentList,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  downloadStudentTemplate,
  importStudents as importStudentsApi,
  getDictionaryByType
} from "@/api/user";
import * as XLSX from "xlsx";
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, toRoleNumber } from "@/constants/role";

// 状态变量
const students = ref([]);
const isLoading = ref(true); // 默认设置为加载中状态
const isSaving = ref(false);
const isDeleting = ref(false);
const isImporting = ref(false);
const error = ref(null);
const totalItems = ref(0);

// 搜索和分页
const searchQuery = ref("");
const selectedStationId = ref("");
const currentPage = ref(1);
const pageSize = ref(10);

// 模态框状态
const isModalVisible = ref(false);
const isEditMode = ref(false);
const isImportModalVisible = ref(false);
const isDeleteModalVisible = ref(false);
const isPasswordModalVisible = ref(false);
const selectedFile = ref(null);
/** 导入完成后的结果，用于展示成功/重复/无效条数及 invalidList 详情 */
const importResult = ref(null);
const studentToDelete = ref(null);
const studentToChangePassword = ref(null);
const fileInput = ref(null);
const isChangingPassword = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");

const workerTypeOptions = ref([]);
const titleLevelOptions = ref([]);

// 考核站相关状态
const examStations = ref([]);
const loadingExamStations = ref(false);

// 获取当前用户信息
const getCurrentUser = () => {
  const userStr = sessionStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : {};
};

const currentUser = ref(getCurrentUser());

// 管理(5) 和 总管理员(6) 可以选择考核站，其它角色禁用
const isStationSelectDisabled = computed(() => {
  const r = toRoleNumber(currentUser.value.role);
  return r !== ROLE_MANAGER;
});
const isExamStationAdmin = computed(() => toRoleNumber(currentUser.value.role) === ROLE_EXAM_STATION_ADMIN);

import { getAllExamStations } from "@/api/examStation";

// 获取职业(工种)数据
const fetchWorkerTypeOptions = async () => {
  try {
    const response = await getDictionaryByType({ type: 0 }); // 假设4是职业(工种)类型
    if (response && response.code === 200 && response.data) {
      workerTypeOptions.value = response.data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code
      }));
    } else {
      throw new Error(response?.msg || "获取职业(工种)数据失败");
    }
  } catch (err) {
    console.error("获取职业(工种)数据失败:", err);
    ElMessage.error("获取职业(工种)数据失败，请稍后重试");
  }
};

// 获取技能等级数据
const fetchTitleLevelOptions = async () => {
  try {
    const response = await getDictionaryByType({ type: 1 }); // 职称级别类型为1
    if (response && response.code === 200 && response.data) {
      titleLevelOptions.value = response.data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code
      }));
    } else {
      throw new Error(response?.msg || "获取技能等级数据失败");
    }
  } catch (err) {
    console.error("获取技能等级数据失败:", err);
    ElMessage.error("获取技能等级数据失败，请稍后重试");
  }
};

// 考核站映射函数
const getStationName = (stationId) => {
  if (!stationId) return '-';
  const station = examStations.value.find(s => s.id === stationId);
  return station ? station.stationName : '未知考核站';
};

// 获取考核站列表
const fetchExamStations = async () => {
  loadingExamStations.value = true;
  try {
    const response = await getAllExamStations();
    const responseData = response.data || response;
    
    if (responseData && responseData.code === 200) {
      // 处理不同的响应数据格式
      const stations = responseData.data || responseData.list || [];
      examStations.value = Array.isArray(stations) ? stations : [];
      
      if (examStations.value.length === 0) {
        console.warn('考核站列表为空');
      }
    } else {
      const errorMsg = responseData?.msg || '获取考核站列表失败';
      console.error('获取考核站列表失败:', errorMsg);
      ElMessage.warning(errorMsg);
      examStations.value = [];
    }
  } catch (error) {
    console.error('获取考核站列表失败:', error);
    ElMessage.error('获取考核站列表失败，请稍后重试');
    examStations.value = [];
  } finally {
    loadingExamStations.value = false;
  }
};

// 组件挂载时加载初始数据
onMounted(async () => {
  // 先获取字典数据
  await fetchWorkerTypeOptions();
  await fetchTitleLevelOptions();
  await fetchExamStations(); // 获取考核站列表

  // 再获取职工列表
  fetchStudents();

  // 可以添加一个超时检查，确保数据加载
  const loadingTimeout = setTimeout(() => {
    if (isLoading.value && students.value.length === 0) {
      console.log("数据加载超时，重新尝试...");
      fetchStudents();
    }
    clearTimeout(loadingTimeout);
  }, 5000); // 5秒超时
});

// 当前编辑的职工
const currentStudent = ref({
  sname: "",
  studentId: "",
  dept: "",
  jobType: "",
  titleLevel: "",
  status: 1,
  sex: "",
  // 管理和总管理默认不带考核站，让用户自己选；其它角色固定为当前用户所在考核站
  stationId: isStationSelectDisabled.value ? getCurrentUser().stationId || null : null
});

// 计算属性
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

// 根据搜索条件过滤职工
const filteredStudents = computed(() => {
  return students.value;
});

// 当前页显示的职工数据
const paginatedStudents = computed(() => {
  return filteredStudents.value;
});

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

// 获取职工列表 - 使用新的API调用方式
const fetchStudents = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // 创建SearchInfo对象
    const searchInfo = {
      offset: (currentPage.value - 1) * pageSize.value, // 计算偏移量
      limit: pageSize.value,
      name: searchQuery.value || undefined,
      stationId: selectedStationId.value ? Number(selectedStationId.value) : undefined // 添加考核站筛选
    };

    const response = await getStudentList(searchInfo);

    if (response && response.code === 200) {
      students.value = response.data.list || [];
      totalItems.value = response.data.total || 0;
    } else {
      throw new Error(response?.msg || "获取职工列表失败");
    }
  } catch (err) {
    console.error("获取职工列表失败:", err);
    error.value = err.message || "获取职工列表失败，请稍后重试";
  } finally {
    isLoading.value = false;
  }
};

const onPageChange = (page, size) => {
  currentPage.value = page;
  pageSize.value = size;
  fetchStudents();
};

// 搜索
const search = () => {
  currentPage.value = 1; // 搜索后回到第一页
  fetchStudents();
};

// 重置
const reset = () => {
  searchQuery.value = "";
  selectedStationId.value = "";
  currentPage.value = 1;
  fetchStudents();
};

// 分页
const goToPage = page => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchStudents();
};

// 处理每页显示数量变化
const handlePageSizeChange = () => {
  currentPage.value = 1; // 页面大小变化时回到第一页
  fetchStudents();
};

// 显示新增模态框
const showAddModal = () => {
  isEditMode.value = false;
  currentStudent.value = {
    sname: "",
    studentId: "",
    dept: "",
    jobType: "",
    titleLevel: "",
    status: 1,
    sex: "",
    stationId: currentUser.value.stationId || null // 默认设置为当前用户的考核站
  };
  isModalVisible.value = true;
};

// 编辑职工
const editStudent = async student => {
  isEditMode.value = true;

  try {
    console.log("Fetching student details for ID:", student.studentId);
    const response = await getStudentById(student.studentId);
    console.log("API Response:", response);

    if (response && response.code === 200 && response.data) {
      // 将API返回的数据映射到表单字段
      currentStudent.value = {
        sname: response.data.sname,
        studentId: response.data.studentId,
        dept: response.data.dept, // 注意这里改为dept
        jobType: response.data.jobType, // 注意这里改为jobType
        titleLevel: response.data.titleLevel,
        status: response.data.status,
        sex: response.data.sex, // 映射性别
        stationId: response.data.stationId ? Number(response.data.stationId) : null // 映射考核站ID
      };

      // 加载最新的字典数据
      await fetchWorkerTypeOptions();

      isModalVisible.value = true;
    } else {
      throw new Error(response?.msg || "获取职工详情失败");
    }
  } catch (err) {
    console.error("获取职工详情失败:", err);
    ElMessage.error("获取职工详情失败，请稍后重试");
  }
};

// 关闭模态框
const closeModal = () => {
  isModalVisible.value = false;
};

// 添加职工数据
const addStudentData = async () => {
  // 验证表单
  if (!currentStudent.value.sname) {
    ElMessage.warning("请输入用户名");
    return;
  }
  if (!currentStudent.value.studentId) {
    ElMessage.warning("请输入工号");
    return;
  }
  if (!currentStudent.value.jobType) {
    ElMessage.warning("请选择职业(工种)");
    return;
  }
  // 技能等级可选
  if (!currentStudent.value.sex) {
    ElMessage.warning("请选择性别");
    return;
  }
  if (!currentStudent.value.stationId) {
    ElMessage.warning("请选择考核站");
    return;
  }

  isSaving.value = true;

  try {
    const response = await addStudent(currentStudent.value);

    if (response && response.code === 200) {
      ElMessage.success("职工添加成功");
      // 刷新职工列表
      fetchStudents();
      closeModal();
    } else {
      throw new Error(response?.msg || "添加职工失败");
    }
  } catch (err) {
    console.error("添加职工失败:", err);
    ElMessage.error(err.message || "添加职工失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};

// 更新职工数据
const updateStudentData = async () => {
  // 验证表单
  if (!currentStudent.value.sname) {
    ElMessage.warning("请输入用户名");
    return;
  }
  if (!currentStudent.value.studentId) {
    ElMessage.warning("请输入工号");
    return;
  }
  if (!currentStudent.value.jobType) {
    ElMessage.warning("请选择职业(工种)");
    return;
  }
  if (!currentStudent.value.sex) {
    ElMessage.warning("请选择性别");
    return;
  }
  if (!currentStudent.value.stationId) {
    ElMessage.warning("请选择考核站");
    return;
  }

  isSaving.value = true;

  try {
    const response = await updateStudent({
      studentId: currentStudent.value.studentId,
      sname: currentStudent.value.sname,
      dept: currentStudent.value.dept,
      jobType: currentStudent.value.jobType,
      titleLevel: currentStudent.value.titleLevel,
      status: currentStudent.value.status,
      sex: currentStudent.value.sex, // 更新性别
      stationId: currentStudent.value.stationId // 更新考核站
    });

    if (response && response.code === 200) {
      ElMessage.success("职工信息更新成功");
      // 刷新职工列表
      fetchStudents();
      closeModal();
    } else {
      throw new Error(response?.msg || "更新职工失败");
    }
  } catch (err) {
    console.error("更新职工失败:", err);
    ElMessage.error(err.message || "更新职工失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};

// 显示修改密码模态框
const showChangePasswordModal = (student) => {
  studentToChangePassword.value = student;
  newPassword.value = "";
  confirmPassword.value = "";
  isPasswordModalVisible.value = true;
};

// 关闭修改密码模态框
const closePasswordModal = () => {
  isPasswordModalVisible.value = false;
  studentToChangePassword.value = null;
  newPassword.value = "";
  confirmPassword.value = "";
};

// 确认修改密码
const changePasswordConfirmed = async () => {
  if (!studentToChangePassword.value) return;

  // 验证密码
  if (!newPassword.value || newPassword.value.trim() === '') {
    ElMessage.warning("请输入新密码");
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    ElMessage.warning("两次输入的密码不一致");
    return;
  }

  isChangingPassword.value = true;

  try {
    const response = await updateStudent({
      studentId: studentToChangePassword.value.studentId,
      sname: studentToChangePassword.value.sname,
      dept: studentToChangePassword.value.dept,
      jobType: studentToChangePassword.value.jobType,
      titleLevel: studentToChangePassword.value.titleLevel,
      status: studentToChangePassword.value.status,
      sex: studentToChangePassword.value.sex,
      stationId: studentToChangePassword.value.stationId,
      password: newPassword.value.trim()
    });

    if (response && response.code === 200) {
      // 先关闭弹窗和重置状态
      isPasswordModalVisible.value = false;
      studentToChangePassword.value = null;
      newPassword.value = "";
      confirmPassword.value = "";
      isChangingPassword.value = false;
      
      ElMessage.success("密码修改成功");
      
      // 刷新职工列表（清除搜索条件，显示所有数据）
      searchQuery.value = "";
      selectedStationId.value = "";
      currentPage.value = 1;
      await fetchStudents();
    } else {
      throw new Error(response?.msg || "修改密码失败");
    }
  } catch (err) {
    console.error("修改密码失败:", err);
    ElMessage.error(err.message || "修改密码失败，请稍后重试");
  } finally {
    isChangingPassword.value = false;
  }
};

// 确认删除职工
const confirmDeleteStudent = student => {
  studentToDelete.value = student;
  isDeleteModalVisible.value = true;
};

// 关闭删除确认模态框
const closeDeleteModal = () => {
  isDeleteModalVisible.value = false;
  studentToDelete.value = null;
};

// 确认删除
const deleteStudentConfirmed = async () => {
  if (!studentToDelete.value) return;

  isDeleting.value = true;

  try {
    const studentId = studentToDelete.value.studentId;
    const response = await deleteStudent(studentId);

    if (response && response.code === 200) {
      ElMessage.success("职工删除成功");
      // 刷新职工列表
      fetchStudents();
      closeDeleteModal();
    } else {
      throw new Error(response?.msg || "删除职工失败");
    }
  } catch (err) {
    console.error("删除职工失败:", err);
    ElMessage.error(err.message || "删除职工失败，请稍后重试");
  } finally {
    isDeleting.value = false;
  }
};

// 批量下载 - 直接从当前数据生成Excel
const batchDownload = () => {
  try {
    // 准备数据
    const data = students.value.map((student, index) => ({
      序号: (currentPage.value - 1) * pageSize.value + index + 1,
      用户名称: student.sname || student.name || "",
      工号: student.studentId || "",
      "职业(工种)": student.jobType || "",
      性别: student.sex || "", // 添加性别列
      技能等级: student.titleLevel || "",
      考核站: getStationName(student.stationId), // 添加考核站列
      创建时间: student.createTime || student.createdAt || ""
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // 设置列宽
    const wscols = [
      { wch: 8 }, // 序号
      { wch: 15 }, // 用户名称
      { wch: 15 }, // 工号
      { wch: 8 }, // 性别
      { wch: 15 }, // 职业(工种)
      { wch: 12 }, // 技能等级
      { wch: 15 }, // 考核站
      { wch: 20 } // 创建时间
    ];
    ws["!cols"] = wscols;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "职工列表");

    // 生成Excel文件并下载
    XLSX.writeFile(wb, "职工列表.xlsx");

    ElMessage.success("职工列表下载成功");
  } catch (error) {
    console.error("生成Excel文件失败:", error);
    ElMessage.error("生成Excel文件失败，请稍后重试");
  }
};

// 显示导入模态框
const showImportModal = () => {
  selectedFile.value = null;
  importResult.value = null;
  isImportModalVisible.value = true;
};

// 关闭导入模态框
const closeImportModal = () => {
  if (isImporting.value) return;
  importResult.value = null;
  selectedFile.value = null;
  if (fileInput.value) fileInput.value.value = "";
  isImportModalVisible.value = false;
};

// 处理文件选择
const handleFileChange = event => {
  const files = event.target.files;
  if (files.length > 0) {
    selectedFile.value = files[0];
  }
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const link = document.createElement("a");
    link.href = "/assets/recourse/职工模板.xlsx";
    link.download = "职工模板.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("本地下载也失败:", err);
  }
};

// 导入职工
const importStudents = async () => {
  if (!selectedFile.value) {
    ElMessage.warning("请先选择文件");
    return;
  }

  isImporting.value = true;

  try {
    const response = await importStudentsApi(selectedFile.value);

    if (response && response.code === 200) {
      ElMessage.success(response.msg || "职工数据导入完成");
      const repList = response.data?.repList || [];
      const newList = response.data?.newList || [];
      const invalidList = response.data?.invalidList || [];
      importResult.value = { repList, newList, invalidList };
      if (invalidList.length > 0) {
        ElMessage.warning(`有 ${invalidList.length} 条数据校验未通过未导入，请查看下方明细`);
      }
      if (repList.length > 0 && invalidList.length === 0) {
        ElMessage.warning(`有 ${repList.length} 条重复数据未导入`);
      }
      fetchStudents();
    } else {
      throw new Error(response?.msg || "导入职工数据失败");
    }
  } catch (err) {
    console.error("导入职工数据失败:", err);
    ElMessage.error(err.message || "导入职工数据失败，请稍后重试");
  } finally {
    isImporting.value = false;
  }
};
</script>


<style scoped>
/* 样式保持不变 */
.student-management {
  padding: 20px;
}

.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 500;
}

/* 搜索区域 */
.search-area {
  display: flex;
  margin-bottom: 20px;
  align-items: center;
}

.search-group {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.search-group label {
  margin-right: 10px;
}

.search-input,
.search-select {
  width: 300px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
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

.btn-danger {
  background-color: #ff4d4f;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn-add,
.btn-download,
.btn-import {
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-add {
  background-color: #c70019;
  color: white;
}

.btn-download,
.btn-import {
  background-color: #c70019;
  color: white;
}

.plus-icon,
.download-icon,
.import-icon {
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
  margin-bottom: 20px;
}

.retry-btn {
  margin-top: 10px;
}

/* 数据表格 */
.table-responsive {
  overflow-x: auto;
  margin-bottom: 20px;
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

.edit-link,
.password-link,
.delete-link {
  color: #1890ff;
  text-decoration: none;
  margin-right: 8px;
}

.password-link {
  color: #52c41a;
}

.delete-link {
  color: #ff4d4f;
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
  margin-top: 20px;
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
.modal-container-wide {
  width: 640px;
}

.delete-modal {
  width: 400px;
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.required::before {
  content: "* ";
  color: #ff4d4f;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #999;
}

.input-help {
  margin-top: 5px;
  font-size: 12px;
  color: #999;
}

.import-result-summary {
  margin-bottom: 16px;
}
.import-result-summary p {
  margin: 6px 0;
  font-size: 14px;
}
.import-result-summary .result-success { color: #52c41a; }
.import-result-summary .result-warning { color: #faad14; }
.import-result-summary .result-invalid { color: #ff4d4f; }

.import-invalid-table-wrap {
  margin-top: 12px;
  max-height: 280px;
  overflow-y: auto;
}
.import-invalid-table-wrap > label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}
.import-invalid-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.import-invalid-table th,
.import-invalid-table td {
  padding: 8px 10px;
  text-align: left;
  border: 1px solid #e8e8e8;
}
.import-invalid-table th {
  background: #fafafa;
  font-weight: 500;
}
.import-invalid-table tbody tr:nth-child(even) {
  background: #f9f9f9;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.full-width {
  width: 100%;
}

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

.upload-icon {
  margin-right: 5px;
}

.selected-file-name {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #666;
  word-break: break-all;
}

.modal-footer {
  padding: 10px 24px;
  text-align: right;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-area {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-group {
    width: 100%;
    margin-bottom: 10px;
  }

  .search-input {
    width: 100%;
  }

  .action-buttons {
    flex-wrap: wrap;
  }

  .pagination-container {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .pagination {
    order: 1;
  }

  .total-count {
    order: 0;
  }

  .page-size-selector {
    order: 2;
  }
}

@media (max-width: 480px) {

  .page-number,
  .page-nav {
    min-width: 28px;
    height: 28px;
    font-size: 13px;
  }
}
</style>
