<template>
  <div class="exam-station-management">
    <h2 class="page-title">考核站管理</h2>

    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="search-group">
        <label for="search-input">考核站名称</label>
        <input
          id="search-input"
          type="text"
          class="search-input"
          placeholder="请输入考核站名称"
          v-model="searchInfo.name"
        />
      </div>
      <div class="search-buttons">
        <button class="btn btn-primary" @click="search" :disabled="isLoading">
          查询
        </button>
        <button class="btn btn-secondary" @click="reset" :disabled="isLoading">
          重置
        </button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="btn btn-add" @click="showAddModal">
        <span class="plus-icon">+</span> 新增考核站
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
      <button class="btn btn-primary retry-btn" @click="fetchExamStations">
        重试
      </button>
    </div>

    <!-- 数据表格 -->
    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>考核站名称</th>
            <th>排序号</th>
            <th>状态</th>
            <!-- <th v-if="isAdmin">考试状态</th> -->
            <!-- <th v-if="isAdmin">绑定管理员</th> -->
            <th>说明</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(station, index) in examStations"
            :key="station.id"
          >
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ station.stationName }}</td>
            <td>{{ station.stationOrder }}</td>
            <td>
              <span :class="station.stationStatus === 1 ? 'status-active' : 'status-inactive'">
                {{ station.stationStatus === 1 ? '启用' : '停用' }}
              </span>
            </td>
            <!-- <td v-if="isAdmin">
              <span :class="station.examStatus === 1 ? 'exam-status-active' : 'exam-status-inactive'">
                {{ station.examStatus === 1 ? '正在考试' : '未在考试' }}
              </span>
              <button 
                class="btn btn-small btn-status" 
                @click="toggleExamStatus(station)"
                :disabled="isUpdatingStatus"
              >
                {{ station.examStatus === 1 ? '停止考试' : '开始考试' }}
              </button>
            </td> -->
            <!-- <td v-if="isAdmin">
              <span>{{ station.accountName || '未绑定' }}</span>
              <button 
                class="btn btn-small btn-bind" 
                @click="showBindAdminModal(station)"
              >
                {{ station.accountName ? '重新绑定' : '绑定管理员' }}
              </button>
            </td> -->
            <td class="desc-cell">{{ station.stationDesc || '-' }}</td>
            <td>{{ station.createTime }}</td>
            <td class="operations">
              <a
                href="#"
                class="edit-link"
                @click.prevent="editStation(station)"
                >编辑</a
              >
              <a
                href="#"
                :class="[
                  station.stationStatus === 1 ? 'disable-link' : 'enable-link',
                  { 'link-disabled': isUpdatingStatus }
                ]"
                @click.prevent="!isUpdatingStatus && toggleStationStatus(station)"
                >{{ station.stationStatus === 1 ? '禁用' : '启用' }}</a
              >
            </td>
          </tr>
          <tr v-if="examStations.length === 0">
            <td :colspan="isAdmin ? 7 : 7" class="no-data">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控件 -->
    <div
      class="pagination-container"
      v-if="!isLoading && !error && totalItems > 0"
    >
      <div class="total-count">共 {{ totalItems }} 条</div>
      <div class="pagination">
        <a
          href="#"
          class="page-nav prev"
          @click.prevent="goToPage(currentPage - 1)"
          :class="{ disabled: currentPage === 1 }"
          >&lt;</a
        >
        <template v-for="page in displayedPages" :key="page">
          <template v-if="page === '...'">
            <span class="ellipsis">...</span>
          </template>
          <template v-else>
            <a
              href="#"
              class="page-number"
              :class="{ active: page === currentPage }"
              @click.prevent="goToPage(page)"
              >{{ page }}</a
            >
          </template>
        </template>
        <a
          href="#"
          class="page-nav next"
          @click.prevent="goToPage(currentPage + 1)"
          :class="{ disabled: currentPage === totalPages }"
          >&gt;</a
        >
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

    <!-- 新增/编辑考核站模态框 -->
    <div
      class="modal-overlay"
      v-if="isModalVisible"
      @click="closeModal"
    >
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditMode ? '编辑考核站' : '新增考核站' }}</h3>
          <button class="close-button" @click="closeModal">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="required">考核站名称</label>
            <input
              type="text"
              class="form-input"
              v-model="currentStation.stationName"
              placeholder="请输入考核站名称"
            />
          </div>
          <div class="form-group">
            <label>排序号</label>
            <input
              type="number"
              class="form-input"
              v-model.number="currentStation.stationOrder"
              placeholder="请输入排序号，值越小越靠前"
            />
          </div>
          <div class="form-group">
            <label>状态</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  type="radio"
                  :value="1"
                  v-model="currentStation.stationStatus"
                />
                启用
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  :value="0"
                  v-model="currentStation.stationStatus"
                />
                停用
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>考核站说明</label>
            <textarea
              class="form-input"
              v-model="currentStation.stationDesc"
              placeholder="请输入考核站说明"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-secondary"
            @click="closeModal"
            :disabled="isSaving"
          >
            取消
          </button>
          <button
            class="btn btn-primary"
            @click="saveStation"
            :disabled="isSaving"
          >
            {{ isSaving ? "保存中..." : "保存" }}
          </button>
        </div>
      </div>
    </div>


    <!-- 绑定管理员模态框 -->
    <div
      class="modal-overlay"
      v-if="isBindAdminModalVisible"
      @click="closeBindAdminModal"
    >
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>绑定管理员</h3>
          <button class="close-button" @click="closeBindAdminModal">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="required">选择管理员</label>
            <select
              class="form-select"
              v-model="selectedAdminId"
            >
              <option value="">请选择管理员</option>
              <option
                v-for="admin in adminList"
                :key="admin.id"
                :value="admin.id"
              >
                {{ admin.displayName }} ({{ admin.account }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>考核站</label>
            <input
              type="text"
              class="form-input"
              :value="currentBindStation?.stationName"
              disabled
            />
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-secondary"
            @click="closeBindAdminModal"
            :disabled="isBinding"
          >
            取消
          </button>
          <button
            class="btn btn-primary"
            @click="confirmBindAdmin"
            :disabled="isBinding || !selectedAdminId"
          >
            {{ isBinding ? "绑定中..." : "确认绑定" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  searchExamStations,
  addExamStation,
  updateExamStation,
  bindAdminToStation,
  setExamStationStatus,
} from "@/api/examStation";
import { searchAccounts } from "@/api/account";
import { ROLE_MANAGER, toRoleNumber } from "@/constants/role";

// 状态变量
const examStations = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const isLoading = ref(false);
const isSaving = ref(false);
const isUpdatingStatus = ref(false);
const isBinding = ref(false);
const error = ref(null);

// 获取当前用户信息
const getCurrentUser = () => {
  const userStr = sessionStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : {};
};

// 当前用户信息
const currentUser = ref(getCurrentUser());

const isAdmin = computed(() => {
  const r = toRoleNumber(currentUser.value.role);
  return r === ROLE_MANAGER;
});

// 搜索参数
const searchInfo = ref({
  name: "",
  offset: 0,
  limit: 10,
});

// 模态框状态
const isModalVisible = ref(false);
const isBindAdminModalVisible = ref(false);
const isEditMode = ref(false);
const currentBindStation = ref(null);
const selectedAdminId = ref("");
const adminList = ref([]);

// 当前编辑的考核站
const currentStation = ref({
  id: null,
  stationName: "",
  stationOrder: 0,
  stationStatus: 1,
  stationDesc: "",
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

// 获取考核站列表
const fetchExamStations = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const searchQuery = {
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      name: searchInfo.value.name || undefined,
    };

    const response = await searchExamStations(searchQuery);
    const responseData = response.data || {};

    if (responseData && responseData.code === 200) {
      const data = responseData.data || {};
      examStations.value = data.rows || [];
      totalItems.value = data.total || 0;
      error.value = null;
    } else {
      throw new Error(responseData?.msg || "获取考核站列表失败");
    }
  } catch (err) {
    console.error("获取考核站列表失败:", err);
    error.value = err.message || "获取考核站列表失败，请稍后重试";
  } finally {
    isLoading.value = false;
  }
};

// 搜索
const search = () => {
  currentPage.value = 1;
  fetchExamStations();
};

// 重置
const reset = () => {
  searchInfo.value = {
    name: "",
    offset: 0,
    limit: pageSize.value,
  };
  currentPage.value = 1;
  fetchExamStations();
};

// 分页
const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchExamStations();
};

// 处理每页显示数量变化
const handlePageSizeChange = () => {
  searchInfo.value.limit = pageSize.value;
  currentPage.value = 1;
  fetchExamStations();
};

// 显示新增模态框
const showAddModal = () => {
  isEditMode.value = false;
  currentStation.value = {
    id: null,
    stationName: "",
    stationOrder: 0,
    stationStatus: 1,
    stationDesc: "",
  };
  isModalVisible.value = true;
};

// 编辑考核站
const editStation = (station) => {
  isEditMode.value = true;
  currentStation.value = {
    id: station.id,
    stationName: station.stationName || "",
    stationOrder: station.stationOrder || 0,
    stationStatus: station.stationStatus || 1,
    stationDesc: station.stationDesc || "",
  };
  isModalVisible.value = true;
};

// 关闭模态框
const closeModal = () => {
  isModalVisible.value = false;
};

// 保存考核站
const saveStation = async () => {
  // 表单验证
  if (!currentStation.value.stationName.trim()) {
    ElMessage.warning("请输入考核站名称");
    return;
  }

  isSaving.value = true;

  try {
    let response;

    if (isEditMode.value) {
      // 编辑
      response = await updateExamStation(currentStation.value);
    } else {
      // 新增
      response = await addExamStation(currentStation.value);
    }

    const responseData = response.data || {};

    if (responseData && responseData.code === 200) {
      ElMessage.success(isEditMode.value ? "更新成功" : "添加成功");
      closeModal();
      fetchExamStations();
    } else {
      throw new Error(
        responseData?.msg ||
          (isEditMode.value ? "更新考核站失败" : "添加考核站失败")
      );
    }
  } catch (err) {
    console.error("保存考核站失败:", err);
    ElMessage.error(err.message || "保存考核站失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};


// 切换考核站状态（启用/禁用）
const toggleStationStatus = async (station) => {
  isUpdatingStatus.value = true;
  
  try {
    const newStatus = station.stationStatus === 1 ? 0 : 1;
    const updateData = {
      id: station.id,
      stationName: station.stationName,
      stationOrder: station.stationOrder,
      stationStatus: newStatus,
      stationDesc: station.stationDesc,
    };
    
    const response = await updateExamStation(updateData);
    const responseData = response.data || {};

    if (responseData && responseData.code === 200) {
      ElMessage.success(`${newStatus === 1 ? '启用' : '禁用'}成功`);
      // 更新本地状态
      station.stationStatus = newStatus;
      // 重新获取数据以确保同步
      fetchExamStations();
    } else {
      throw new Error(responseData?.msg || "更新状态失败");
    }
  } catch (err) {
    console.error("更新状态失败:", err);
    ElMessage.error(err.message || "更新状态失败，请稍后重试");
  } finally {
    isUpdatingStatus.value = false;
  }
};

// 切换考试状态
const toggleExamStatus = async (station) => {
  isUpdatingStatus.value = true;
  
  try {
    const newStatus = station.examStatus === 1 ? 0 : 1;
    const response = await setExamStationStatus(station.id, newStatus);
    const responseData = response.data || {};

    if (responseData && responseData.code === 200) {
      ElMessage.success(`${newStatus === 1 ? '开始' : '停止'}考试成功`);
      // 更新本地状态
      station.examStatus = newStatus;
    } else {
      throw new Error(responseData?.msg || "设置考试状态失败");
    }
  } catch (err) {
    console.error("设置考试状态失败:", err);
    ElMessage.error(err.message || "设置考试状态失败，请稍后重试");
  } finally {
    isUpdatingStatus.value = false;
  }
};

// 显示绑定管理员模态框
const showBindAdminModal = async (station) => {
  currentBindStation.value = station;
  selectedAdminId.value = station.adminId || "";
  
  // 获取管理员列表
  try {
    const searchParams = {
      offset: 0,
      limit: 100, // 获取所有管理员
      role: ROLE_MANAGER,
    };
    
    const response = await searchAccounts(searchParams);
    const responseData = response.data || {};
    
    if (responseData && responseData.code === 200) {
      const data = responseData.data || {};
      adminList.value = data.rows || [];
    } else {
      throw new Error(responseData?.msg || "获取管理员列表失败");
    }
  } catch (err) {
    console.error("获取管理员列表失败:", err);
    ElMessage.error(err.message || "获取管理员列表失败");
    return;
  }
  
  isBindAdminModalVisible.value = true;
};

// 关闭绑定管理员模态框
const closeBindAdminModal = () => {
  isBindAdminModalVisible.value = false;
  currentBindStation.value = null;
  selectedAdminId.value = "";
  adminList.value = [];
};

// 确认绑定管理员
const confirmBindAdmin = async () => {
  if (!selectedAdminId.value || !currentBindStation.value) {
    ElMessage.warning("请选择管理员");
    return;
  }

  isBinding.value = true;

  try {
    const response = await bindAdminToStation(
      currentBindStation.value.id,
      selectedAdminId.value
    );
    const responseData = response.data || {};

    if (responseData && responseData.code === 200) {
      ElMessage.success("绑定管理员成功");
      
      // 更新本地数据
      const selectedAdmin = adminList.value.find(
        admin => admin.id == selectedAdminId.value
      );
      if (selectedAdmin) {
        currentBindStation.value.adminId = selectedAdmin.id;
        currentBindStation.value.adminName = selectedAdmin.displayName;
      }
      
      closeBindAdminModal();
      fetchExamStations(); // 重新获取数据以确保同步
    } else {
      throw new Error(responseData?.msg || "绑定管理员失败");
    }
  } catch (err) {
    console.error("绑定管理员失败:", err);
    ElMessage.error(err.message || "绑定管理员失败，请稍后重试");
  } finally {
    isBinding.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  fetchExamStations();
});
</script>

<style scoped>
/* 样式与account/index.vue保持一致 */
.exam-station-management {
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
  flex-shrink: 0;
}

.search-group label {
  margin-right: 10px;
  white-space: nowrap;
}

.search-input {
  width: 300px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.form-select {
  width: 150px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  min-width: 120px;
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
  transition: all 0.2s ease;
  outline: none;
}

.btn-primary {
  background-color: #c70019;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #a50015;
}

.btn-primary:active:not(:disabled) {
  background-color: #8b0012;
  transform: translateY(1px);
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e6e6e6;
}

.btn-secondary:active:not(:disabled) {
  background-color: #d9d9d9;
  transform: translateY(1px);
}

.btn-danger {
  background-color: #ff4d4f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #ff2629;
}

.btn-danger:active:not(:disabled) {
  background-color: #d9363e;
  transform: translateY(1px);
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

.btn-add:hover:not(:disabled) {
  background-color: #a50015;
}

.btn-add:active:not(:disabled) {
  background-color: #8b0012;
  transform: translateY(1px);
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
  transition: all 0.2s ease;
}

.edit-link:hover {
  color: #096dd9;
}

.edit-link:active {
  color: #0050b3;
  transform: translateY(1px);
}

.enable-link {
  color: #52c41a;
  text-decoration: none;
  transition: all 0.2s ease;
}

.enable-link:hover {
  color: #389e0d;
}

.enable-link:active {
  color: #237804;
  transform: translateY(1px);
}

.disable-link {
  color: #ff9800;
  text-decoration: none;
  transition: all 0.2s ease;
}

.disable-link:hover {
  color: #f57c00;
}

.disable-link:active {
  color: #e65100;
  transform: translateY(1px);
}

.link-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.desc-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-active {
  color: #52c41a;
  font-weight: 500;
}

.status-inactive {
  color: #ff4d4f;
  font-weight: 500;
}

.exam-status-active {
  color: #52c41a;
  font-weight: 500;
}

.exam-status-inactive {
  color: #999;
  font-weight: 500;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  margin-left: 8px;
}

.btn-status {
  background-color: #1890ff;
  color: white;
}

.btn-status:hover:not(:disabled) {
  background-color: #096dd9;
}

.btn-status:active:not(:disabled) {
  background-color: #0050b3;
  transform: translateY(1px);
}

.btn-bind {
  background-color: #52c41a;
  color: white;
}

.btn-bind:hover:not(:disabled) {
  background-color: #389e0d;
}

.btn-bind:active:not(:disabled) {
  background-color: #237804;
  transform: translateY(1px);
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
  transition: all 0.2s ease;
}

.page-number:hover:not(.active),
.page-nav:hover:not(.disabled) {
  background-color: #f0f0f0;
}

.page-number:active:not(.active),
.page-nav:active:not(.disabled) {
  background-color: #e6e6e6;
  transform: translateY(1px);
}

.page-number.active {
  background-color: #c70019;
  color: white;
}

.page-number.active:hover {
  background-color: #a50015;
}

.page-number.active:active {
  background-color: #8b0012;
  transform: translateY(1px);
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
    gap: 10px;
  }

  .search-group {
    width: 100%;
    margin-right: 0;
    margin-bottom: 0;
  }

  .search-input {
    width: 100%;
  }

  .form-select {
    width: 100%;
    min-width: auto;
  }

  .search-buttons {
    width: 100%;
    justify-content: flex-start;
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
