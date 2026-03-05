<template>
  <div class="dictionary-management">
    <div class="page-header">
      <h2>字典管理</h2>
      <div class="tabs">
        <div v-for="tab in tabs" :key="tab.key" class="tab" :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)">{{ tab.label }}</div>
      </div>
    </div>

    <!-- 职业(工种)管理 -->
    <div v-if="activeTab === 'grade'" class="tab-content">
      <div class="actions">
        <div class="search-box">
          <input type="text" v-model="gradeSearch" placeholder="搜索职业(工种)" />
        </div>
        <button class="btn-add" @click="showAddModal('grade')">新增职业(工种)</button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="error" class="error-message">
        {{ error }}
        <button class="btn-retry" @click="fetchDictionaries(0)">重试</button>
      </div>

      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>职业(工种)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(grade, index) in filteredGrades" :key="grade.id">
              <td>{{ index + 1 }}</td>
              <td>{{ grade.name }}</td>
              <td class="actions-cell">
                <button class="btn-edit" @click="showEditModal('grade', grade)">编辑</button>
                <button class="btn-delete" @click="confirmDelete('grade', grade)">删除</button>
              </td>
            </tr>
            <tr v-if="filteredGrades.length === 0">
              <td colspan="3" class="no-data">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 技能等级管理 -->
    <div v-if="activeTab === 'major'" class="tab-content">
      <div class="actions">
        <div class="search-box">
          <input type="text" v-model="majorSearch" placeholder="搜索技能等级" />
        </div>
        <button class="btn-add" @click="showAddModal('major')">新增技能等级</button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="error" class="error-message">
        {{ error }}
        <button class="btn-retry" @click="fetchDictionaries(1)">重试</button>
      </div>

      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>技能等级</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(major, index) in filteredMajors" :key="major.id">
              <td>{{ index + 1 }}</td>
              <td>{{ major.name }}</td>
              <td class="actions-cell">
                <button class="btn-edit" @click="showEditModal('major', major)">编辑</button>
                <button class="btn-delete" @click="confirmDelete('major', major)">删除</button>
              </td>
            </tr>
            <tr v-if="filteredMajors.length === 0">
              <td colspan="3" class="no-data">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 题型类别管理 -->
    <div v-if="activeTab === 'class'" class="tab-content">
      <div class="actions">
        <div class="search-box">
          <input type="text" v-model="classSearch" placeholder="搜索题型" />
        </div>
        <button class="btn-add" @click="showAddModal('class')">新增题型</button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="error" class="error-message">
        {{ error }}
        <button class="btn-retry" @click="fetchDictionaries(2)">重试</button>
      </div>

      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>题型名称</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(classItem, index) in filteredClasses" :key="classItem.id">
              <td>{{ index + 1 }}</td>
              <td>{{ classItem.name }}</td>
              <td class="actions-cell">
                <button class="btn-edit" @click="showEditModal('class', classItem)">编辑</button>
                <button class="btn-delete" @click="confirmDelete('class', classItem)">删除</button>
              </td>
            </tr>
            <tr v-if="filteredClasses.length === 0">
              <td colspan="3" class="no-data">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 部门类别管理 -->
    <div v-if="activeTab === 'department'" class="tab-content">
      <div class="actions">
        <div class="search-box">
          <input type="text" v-model="departmentSearch" placeholder="搜索部门" />
        </div>
        <button class="btn-add" @click="showAddModal('department')">新增部门</button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="error" class="error-message">
        {{ error }}
        <button class="btn-retry" @click="fetchDictionaries(4)">重试</button>
      </div>

      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>部门名称</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(department, index) in filteredDepartments" :key="department.id">
              <td>{{ index + 1 }}</td>
              <td>{{ department.name }}</td>
              <td class="actions-cell">
                <button class="btn-edit" @click="showEditModal('department', department)">编辑</button>
                <button class="btn-delete" @click="confirmDelete('department', department)">删除</button>
              </td>
            </tr>
            <tr v-if="filteredDepartments.length === 0">
              <td colspan="3" class="no-data">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 新增/编辑模态框 -->
    <div class="modal-overlay" v-if="showModal" @mousedown.self="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? '编辑' : '新增' }}{{ getModalTitle() }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ getModalTitle() }}名称</label>
            <input type="text" v-model="formData.name" :placeholder="`请输入${getModalTitle()}名称`" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal" :disabled="isSaving">取消</button>
          <button class="btn-submit" @click="submitForm" :disabled="isSaving">{{ isSaving ? '保存中...' : '确定' }}</button>
        </div>
      </div>
    </div>

    <!-- 确认删除模态框 -->
    <div class="modal-overlay" v-if="showDeleteConfirm" @mousedown.self="cancelDelete">
      <div class="confirm-modal" @click.stop>
        <div class="confirm-content">
          <p>确定要删除该{{ getDeleteItemType() }}吗？</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="cancelDelete" :disabled="isDeleting">取消</button>
            <button class="btn-confirm" @click="deleteItem" :disabled="isDeleting">{{ isDeleting ? '删除中...' : '确定'
              }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  getDictionaryByType,
  addDictionary,
  updateDictionary,
  deleteDictionary
} from "@/api/user";

// 标签页配置
const tabs = [
  { key: "grade", label: "职业(工种)管理" },
  { key: "major", label: "技能等级管理" },
  { key: "class", label: "题型类别管理" },
  // { key: "department", label: "部门类别管理" }
];

// 当前激活的标签页
const activeTab = ref("grade");

// 模态框状态
const showModal = ref(false);
const isEditing = ref(false);
const formData = ref({});
const showDeleteConfirm = ref(false);
const itemToDelete = ref(null);
const isSaving = ref(false);
const isDeleting = ref(false);

// 加载状态和错误信息
const isLoading = ref(false);
const error = ref("");

// 搜索关键词
const gradeSearch = ref("");
const majorSearch = ref("");
const classSearch = ref("");
const departmentSearch = ref("");

// 数据列表
const grades = ref([]);
const majors = ref([]);
const classes = ref([]);
const departments = ref([]);

// 过滤后的数据
const filteredGrades = computed(() => {
  if (!gradeSearch.value) {
    return grades.value;
  } else {
    return grades.value.filter(
      grade =>
        grade.name.toLowerCase().includes(gradeSearch.value.toLowerCase()) ||
        grade.code.toLowerCase().includes(gradeSearch.value.toLowerCase())
    );
  }
});

const filteredMajors = computed(() => {
  if (!majorSearch.value) {
    return majors.value;
  } else {
    return majors.value.filter(
      major =>
        major.name.toLowerCase().includes(majorSearch.value.toLowerCase()) ||
        major.code.toLowerCase().includes(majorSearch.value.toLowerCase())
    );
  }
});

const filteredClasses = computed(() => {
  if (!classSearch.value) {
    return classes.value;
  } else {
    return classes.value.filter(
      classItem =>
        classItem.name
          .toLowerCase()
          .includes(classSearch.value.toLowerCase()) ||
        classItem.code.toLowerCase().includes(classSearch.value.toLowerCase())
    );
  }
});

const filteredDepartments = computed(() => {
  if (!departmentSearch.value) {
    return departments.value;
  } else {
    return departments.value.filter(
      department =>
        department.name
          .toLowerCase()
          .includes(departmentSearch.value.toLowerCase()) ||
        department.code
          .toLowerCase()
          .includes(departmentSearch.value.toLowerCase())
    );
  }
});

// 切换标签页
const switchTab = tab => {
  activeTab.value = tab;

  if (tab === "major" && grades.value.length === 0) {
    fetchDictionaries(0).then(() => {
      // After grades are loaded, fetch majors
      fetchDictionaries(1);
    });
  } else {
    const typeMap = {
      grade: 0,
      major: 1,
      class: 2,
      department: 4
    };
    fetchDictionaries(typeMap[tab]);
  }
};

// 获取字典数据
const fetchDictionaries = async (type, parentId) => {
  isLoading.value = true;
  error.value = "";

  try {
    const requestData = { type };
    if (parentId !== undefined) {
      requestData.parentId = parentId;
    }
    const response = await getDictionaryByType(requestData);

    if (response.code === 200) {
      // 根据类型更新对应的数据列表
      if (type === 0) {
        grades.value = response.data || [];
      } else if (type === 1) {
        majors.value = response.data || [];
      } else if (type === 2) {
        classes.value = response.data || [];
      } else if (type === 4) {
        departments.value = response.data || [];
      }
    } else {
      throw new Error(response.msg || "获取数据失败");
    }
  } catch (err) {
    console.error(`获取字典数据失败 (type=${type}):`, err);
    error.value = err.message || "获取数据失败，请稍后重试";
  } finally {
    isLoading.value = false;
  }
};

// 获取职业(工种)名称
const getGradeName = gradeId => {
  const grade = grades.value.find(g => g.id === gradeId);
  return grade ? grade.name : "未知职业(工种)";
};

// 格式化日期
const formatDate = dateString => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

// 显示新增模态框
const showAddModal = type => {
  isEditing.value = false;

  // 根据类型初始化表单数据
  formData.value = {
    code: "",
    name: "",
    type: getTypeByTabKey(type),
    parentId: type === "major" ? "" : 0
  };

  showModal.value = true;
};

// 显示编辑模态框
const showEditModal = (type, item) => {
  isEditing.value = true;

  // 复制一份数据，避免直接修改原始数据
  formData.value = { ...item };

  showModal.value = true;
};

// 关闭模态框
const closeModal = () => {
  showModal.value = false;
  formData.value = {};
};

// 获取模态框标题
const getModalTitle = () => {
  switch (activeTab.value) {
    case "grade":
      return "职业(工种)";
    case "major":
      return "技能等级";
    case "class":
      return "题型类别";
    case "department":
      return "部门类别";
    default:
      return "";
  }
};

// 根据标签页键值获取类型值
const getTypeByTabKey = key => {
  switch (key) {
    case "grade":
      return 0;
    case "major":
      return 1;
    case "class":
      return 2;
    case "department":
      return 4;
    default:
      return 0;
  }
};

// 提交表单
const submitForm = async () => {
  // 表单验证
  if (!formData.value.name || formData.value.name.trim() === "") {
    ElMessage.warning(`请输入${getModalTitle()}名称`);
    return;
  }

  // 自动设置编码，使用名称作为编码
  formData.value.code = formData.value.name;

  isSaving.value = true;

  try {
    let response;

    if (isEditing.value) {
      // 编辑现有项
      response = await updateDictionary(formData.value);
    } else {
      // 添加新项
      response = await addDictionary(formData.value);
    }

    if (response.code === 200) {
      ElMessage.success(
        isEditing.value
          ? `${getModalTitle()}更新成功`
          : `${getModalTitle()}添加成功`
      );

      // 刷新数据
      fetchDictionaries(formData.value.type);

      // 关闭模态框
      closeModal();
    } else {
      throw new Error(
        response.msg || (isEditing.value ? "更新失败" : "添加失败")
      );
    }
  } catch (err) {
    console.error("保存字典项失败:", err);
    ElMessage.error(err.message || "操作失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};

// 确认删除
const confirmDelete = (type, item) => {
  itemToDelete.value = { type, item };
  showDeleteConfirm.value = true;
};

// 取消删除
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  itemToDelete.value = null;
};

// 获取删除项类型
const getDeleteItemType = () => {
  if (!itemToDelete.value) return "";

  switch (itemToDelete.value.type) {
    case "grade":
      return "职业(工种)";
    case "major":
      return "技能等级";
    case "class":
      return "题型类别";
    case "department":
      return "部门类别";
    default:
      return "";
  }
};

const deleteItem = async () => {
  if (!itemToDelete.value) return;

  isDeleting.value = true;

  try {
    const { type, item } = itemToDelete.value;
    const typeValue = getTypeByTabKey(type);

    const response = await deleteDictionary(item.id);

    if (response.code === 200) {
      ElMessage.success(`${getDeleteItemType()}删除成功`);

      // 刷新数据
      fetchDictionaries(typeValue);
    } else {
      throw new Error(response.msg || "删除失败");
    }
  } catch (err) {
    console.error("删除字典项失败:", err);
    ElMessage.error(err.message || "删除失败，请稍后重试");
  } finally {
    isDeleting.value = false;
    cancelDelete();
  }
};
// 监听标签页变化
watch(activeTab, newTab => {
  const typeMap = {
    grade: 0,
    major: 1,
    class: 2,
    department: 4
  };

  // 如果对应的数据列表为空，则加载数据
  if (
    (newTab === "grade" && grades.value.length === 0) ||
    (newTab === "major" && majors.value.length === 0) ||
    (newTab === "class" && classes.value.length === 0) ||
    (newTab === "department" && departments.value.length === 0)
  ) {
    fetchDictionaries(typeMap[newTab]);
  }
});

// 组件挂载时加载学院数据
onMounted(() => {
  fetchDictionaries(0); // 默认加载学院数据
});
</script>

<style scoped>
.dictionary-management {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 15px 0;
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab:hover {
  color: #c70019;
}

.tab.active {
  color: #c70019;
  border-bottom-color: #c70019;
  font-weight: 500;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.btn-add {
  background-color: #c70019;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-box {
  display: flex;
  align-items: center;
}

.search-box input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  width: 200px;
}

.table-container {
  flex: 1;
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.data-table th {
  background-color: #fafafa;
  font-weight: 500;
  color: #333;
}

.actions-cell {
  display: flex;
  gap: 10px;
}

.btn-edit,
.btn-delete {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-edit {
  background-color: #1890ff;
  color: white;
}

.btn-delete {
  background-color: #ff4d4f;
  color: white;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 30px 0;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
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

.btn-retry {
  margin-top: 10px;
  background-color: #c70019;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-sizing: border-box;
}

.modal-footer {
  padding: 10px 24px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel,
.btn-submit {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel {
  background-color: #f0f0f0;
  color: #333;
}

.btn-submit {
  background-color: #c70019;
  color: white;
}

.btn-cancel:disabled,
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 确认删除模态框 */
.confirm-modal {
  background-color: white;
  border-radius: 4px;
  width: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.confirm-content {
  padding: 24px;
}

.confirm-content p {
  margin: 0 0 20px 0;
  text-align: center;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.btn-confirm {
  background-color: #ff4d4f;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
