<template>
  <div class="teacher-management">
    <h2 class="page-title">管理员列表</h2>

    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="search-group">
        <label for="search-input">用户名</label>
        <input
          id="search-input"
          type="text"
          class="search-input"
          placeholder="请输入"
          v-model="searchInfo.name"
        />
      </div>
      <div class="search-buttons">
        <button class="btn btn-primary" @click="search" :disabled="isLoading">查询</button>
        <button class="btn btn-secondary" @click="reset" :disabled="isLoading">重置</button>
      </div>
    </div>

    <!-- 操作按钮 - 仅在admin账号时显示 -->
    <div class="action-buttons" v-if="isAdminUser">
      <button class="btn btn-add" @click="showAddModal">
        <span class="plus-icon">+</span> 新增
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
      <button class="btn btn-primary retry-btn" @click="fetchTeachers">重试</button>
    </div>

    <!-- 数据表格 -->
    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>账号</th>
            <th>管理员姓名</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(teacher, index) in teachers" :key="teacher.teachId || teacher.account">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ teacher.account }}</td>
            <td>{{ teacher.teachName }}</td>
            <td>{{ teacher.createTime }}</td>
            <td class="operations">
              <a href="#" class="edit-link" @click.prevent="editTeacher(teacher)">编辑</a>
              <a href="#" class="delete-link" @click.prevent="confirmDeleteTeacher(teacher)">删除</a>
            </td>
          </tr>
          <tr v-if="teachers.length === 0">
            <td colspan="5" class="no-data">暂无数据</td>
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

    <!-- 新增/编辑管理员模态框 -->
    <div class="modal-overlay" v-if="isModalVisible" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditMode ? "编辑" : "新增" }}</h3>
          <button class="close-button" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <!-- 登录账号 -->
          <div class="form-group">
            <label for="teacher-account" class="required">登录账号</label>
            <input
              id="teacher-account"
              type="text"
              class="form-input"
              v-model="currentTeacher.account"
              placeholder="请输入登录账号"
              :disabled="isEditMode"
            />
          </div>

          <!-- 管理员姓名 -->
          <div class="form-group">
            <label for="teacher-name" class="required">管理员姓名</label>
            <input
              id="teacher-name"
              type="text"
              class="form-input"
              v-model="currentTeacher.teachName"
              placeholder="请输入管理员姓名"
            />
          </div>

          <!-- 密码 - 在新增和编辑时都显示 -->
          <div class="form-group">
            <label for="teacher-password">密码</label>
            <input
              id="teacher-password"
              type="password"
              class="form-input"
              v-model="currentTeacher.password"
              placeholder="请输入密码，留空则使用默认密码"
            />
            <div class="input-help">{{ isEditMode ? '不修改密码请留空' : '默认密码: Aa123456' }}</div>
          </div>

          <!-- 状态 -->
          <div class="form-group">
            <label class="required">状态</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="status" :value="1" v-model="currentTeacher.status" />
                正常
              </label>
              <label class="radio-label">
                <input type="radio" name="status" :value="0" v-model="currentTeacher.status" />
                禁用
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal" :disabled="isSaving">取消</button>
          <button
            class="btn btn-primary"
            @click="saveTeacher"
            :disabled="isSaving"
          >{{ isSaving ? '保存中...' : '确认' }}</button>
        </div>
      </div>
    </div>

    <!-- 确认删除模态框 -->
    <div class="modal-overlay" v-if="isDeleteModalVisible" @click="closeDeleteModal">
      <div class="modal-container delete-modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="close-button" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除管理员 "{{ teacherToDelete?.teachName || teacherToDelete?.name }}" 吗？</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteModal" :disabled="isDeleting">取消</button>
          <button
            class="btn btn-danger"
            @click="deleteTeacherConfirmed"
            :disabled="isDeleting"
          >{{ isDeleting ? '删除中...' : '删除' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import Pagination from "@/components/Pagination.vue";
import { ROLE_MANAGER, isRole } from "@/constants/role";
import {
  getTeacherList,
  addTeacher,
  updateTeacher,
  deleteTeacher
} from "@/api/user";

// 状态变量
const teachers = ref([]);
const currentPage = ref(1);
const pageSize = ref(10); // 每页显示10条
const totalItems = ref(0);
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const error = ref(null);

// 获取当前登录用户信息
const currentUser = ref(JSON.parse(sessionStorage.getItem("user") || "{}"));
const isAdminUser = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));

// 搜索参数 - 更新为与API匹配的格式
const searchInfo = ref({
  name: "", // 用于搜索的名称
  offset: 0, // 偏移量
  limit: 10 // 每页显示几条
});

// 模态框状态
const isModalVisible = ref(false);
const isDeleteModalVisible = ref(false);
const isEditMode = ref(false);
const teacherToDelete = ref(null);

// 当前编辑的管理员 - 更新为与API匹配的格式
const currentTeacher = ref({
  teachId: null, // 管理员ID，编辑时需要
  account: "", // 登录账号
  teachName: "", // 管理员姓名
  password: "", // 密码
  status: 1 // 状态，默认为1（正常）
});

// 计算属性
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

// 计算显示哪些页码
const displayedPages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    const startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

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

// 获取管理员列表 - 更新为处理新的响应格式
const fetchTeachers = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // 更新分页参数 - 使用偏移量计算
    const searchQuery = {
      offset: (currentPage.value - 1) * pageSize.value, // 计算偏移量
      limit: pageSize.value,
      name: searchInfo.value.name || undefined
    };

    // 调用API获取管理员列表
    const response = await getTeacherList(searchQuery);

    if (response && response.code === 200) {
      const data = response.data;
      teachers.value = data.list || [];
      totalItems.value = data.total || 0;
    }
  } catch (err) {
    console.error("获取管理员列表失败:", err);
    error.value = err.message || "获取管理员列表失败，请稍后重试";


  } finally {
    isLoading.value = false;
  }
};

const onPageChange = (page, size) => {
  currentPage.value = page;
  pageSize.value = size;
  fetchTeachers();
};

// 搜索
const search = () => {
  currentPage.value = 1; // 搜索后回到第一页
  fetchTeachers();
};

// 重置
const reset = () => {
  searchInfo.value = {
    name: "",
    offset: 0,
    limit: pageSize.value
  };
  currentPage.value = 1;
  fetchTeachers();
};

// 分页
const goToPage = page => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchTeachers();
};

// 处理每页显示数量变化
const handlePageSizeChange = () => {
  searchInfo.value.limit = pageSize.value;
  currentPage.value = 1; // 页面大小变化时回到第一页
  fetchTeachers();
};

// 显示新增模态框
const showAddModal = () => {
  isEditMode.value = false;
  currentTeacher.value = {
    teachId: null,
    account: "",
    teachName: "",
    password: "Aa123456", // 默认密码
    status: 1
  };
  isModalVisible.value = true;
};

// 编辑管理员 - 更新为使用新的字段名
const editTeacher = teacher => {
  isEditMode.value = true;
  // 将现有数据映射到新的表单结构
  currentTeacher.value = {
    teachId: teacher.teachId || teacher.id, // 兼容旧数据
    account: teacher.account || "",
    teachName: teacher.teachName || "",
    password: teacher.password || "Aa123456", // 编辑时密码字段为空
    status: typeof teacher.status === "number" ? teacher.status : 1
  };
  isModalVisible.value = true;
};

// 关闭模态框
const closeModal = () => {
  isModalVisible.value = false;
};

// 保存管理员 - 更新为使用新的API请求格式
const saveTeacher = async () => {
  // 验证表单
  if (!currentTeacher.value.account) {
    ElMessage.warning("请输入登录账号");
    return;
  }
  if (!currentTeacher.value.teachName) {
    ElMessage.warning("请输入管理员姓名");
    return;
  }

  isSaving.value = true;

  try {
    let response;

    if (isEditMode.value) {
      // 编辑现有管理员
      response = await updateTeacher(currentTeacher.value);
    }

    if (response && response.code === 200) {
      ElMessage.success(isEditMode.value ? "更新成功" : "添加成功");
      closeModal();
      // 刷新管理员列表
      fetchTeachers();
    }
  } catch (err) {
    console.error("保存管理员失败:", err);
    ElMessage.error(err.message || "保存管理员失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};

// 确认删除管理员
const confirmDeleteTeacher = teacher => {
  teacherToDelete.value = teacher;
  isDeleteModalVisible.value = true;
};

// 关闭删除确认模态框
const closeDeleteModal = () => {
  isDeleteModalVisible.value = false;
  teacherToDelete.value = null;
};

// 确认删除 - 更新为使用新的API请求格式
const deleteTeacherConfirmed = async () => {
  if (!teacherToDelete.value) return;

  isDeleting.value = true;

  try {
    const teachId = teacherToDelete.value.teachId || teacherToDelete.value.id;
    const response = await deleteTeacher(teachId);

    if (response && response.code === 200) {
      ElMessage.success("删除成功");
      // 刷新管理员列表
      fetchTeachers();
      closeDeleteModal();
    }
  } catch (err) {
    console.error("删除管理员失败:", err);
    ElMessage.error(err.message || "删除管理员失败，请稍后重试");
  } finally {
    isDeleting.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  fetchTeachers();
});
</script>

<style scoped>
/* 样式保持不变 */
.teacher-management {
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

.search-input {
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

.btn-add {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #c70019;
  color: white;
}

.plus-icon {
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
.delete-link {
  color: #1890ff;
  text-decoration: none;
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

.input-help {
  margin-top: 5px;
  font-size: 12px;
  color: #999;
}

.select-wrapper {
  position: relative;
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 10px;
  color: #999;
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
