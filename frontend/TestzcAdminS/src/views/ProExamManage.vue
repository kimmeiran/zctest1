<template>
    <div class="exam-management">
      <h2 class="page-title">{{ title }}</h2>
  
      <!-- 搜索区域 -->
      <div class="search-area">
        <div class="search-input-wrapper">
          <input type="text" class="search-input" placeholder="搜索" v-model="searchQuery" />
          <button class="search-button" @click="search">搜索</button>
          <button class="reset-button" @click="reset">重置</button>
        </div>
      </div>
  
      <!-- 操作按钮 -->
      <div class="action-buttons">
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
        <button class="btn btn-primary retry-btn" @click="fetchExams">重试</button>
      </div>
  
      <!-- 数据表格 -->
      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>题库名称</th>
              <th>题目数量</th>
              <th>考核站</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(exam, index) in paginatedExams" :key="exam.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ exam.questionName }}</td>
              <td>{{ exam.questionCount }}</td>
              <td>{{ getStationName(exam.stationId) }}</td>
              <td>{{ exam.createTime }}</td>
              <td class="operations">
                <a href="#" class="edit-link" @click.prevent="editExam(exam)">编辑</a>
                <a href="#" class="delete-link" @click.prevent="deleteExam(exam)">删除</a>
              </td>
            </tr>
            <tr v-if="paginatedExams.length === 0">
              <td colspan="6" class="no-data">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- 分页控件 -->
      <div class="pagination-container" v-if="!isLoading && !error && totalItems > 0">
        <div class="total-count">共 {{ totalItems }} 条</div>
        <div class="pagination">
          <a
            href="#"
            class="page-nav prev"
            @click.prevent="goToPage(currentPage - 1)"
            :class="{ disabled: currentPage === 1 }"
          >&lt;</a>
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
              >{{ page }}</a>
            </template>
          </template>
          <a
            href="#"
            class="page-nav next"
            @click.prevent="goToPage(currentPage + 1)"
            :class="{ disabled: currentPage === totalPages }"
          >&gt;</a>
        </div>
      </div>
  
      <!-- 新增/编辑模态框 -->
      <div class="modal-overlay" v-if="isModalVisible" @click="closeModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3>{{ isEditMode ? "编辑" : "新建" }}</h3>
          </div>
          <div class="modal-body">
            <!-- 题库名称 -->
            <div class="form-group">
              <label for="exam-name">题库名称</label>
              <input
                id="exam-name"
                type="text"
                class="form-input"
                v-model="currentExam.questionName"
                placeholder="请输入名称"
              />
            </div>
            <!-- 新增的题目类型 -->
            <div class="form-group">
              <label for="question-type">题目类型</label>
              <select id="question-type" class="form-select" v-model="currentExam.questionType">
                <option value disabled selected>请选择题目类型</option>
                <option
                  v-for="questionType in questionTypeOptions"
                  :key="questionType.id"
                  :value="questionType.name"
                >{{ questionType.name }}</option>
              </select>
            </div>
  
            <!-- 新增的难度等级 -->
            <div class="form-group">
              <label for="difficulty"></label>
              <select id="difficulty" class="form-select" v-model="currentExam.difficulty">
                <option value disabled selected>请选择难度等级</option>
                <option
                  v-for="difficulty in difficultyTypeOptions"
                  :key="difficulty.id"
                  :value="difficulty.name"
                >{{ difficulty.name }}</option>
              </select>
            </div>
  
            <!-- 模板下载 -->
            <div class="form-group">
              <label>模板下载</label>
              <button class="template-download-btn" @click="downloadTemplate">
                <span class="download-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </span>
                下载模板
              </button>
            </div>
  
            <!-- 导入 -->
            <div class="form-group">
              <label>导入题目</label>
              <div class="file-upload-wrapper" @click="triggerFileInput">
                <input
                  type="file"
                  ref="fileInput"
                  class="file-input"
                  @change="handleFileChange"
                  accept=".xlsx, .xls, .csv"
                  style="display: none"
                />
                <div class="file-upload-box">
                  <span class="upload-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </span>
                  <span v-if="selectedFile">{{ selectedFile.name }}</span>
                  <span v-else>点击选择文件</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">取消</button>
            <button
              class="btn btn-primary"
              @click="saveExam"
              :disabled="isSaving"
            >{{ isSaving ? '保存中...' : '确认' }}</button>
          </div>
        </div>
      </div>
  
      <!-- 导入结果模态框 -->
      <div class="modal-overlay" v-if="showImportResult">
        <div class="import-result-modal">
          <div class="modal-header">
            <h3>导入结果</h3>
          </div>
          <div class="modal-body">
            <div v-if="importSuccess" class="import-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>导入成功</p>
              <div class="import-stats">
                <p>新增题目: {{ importResult.newQuestions?.length || 0 }} 条</p>
              </div>
            </div>
            <div v-else class="import-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <p>导入失败</p>
              <p class="error-message">{{ importError }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="closeImportResultModal">确定</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from "vue";
  import { ElMessage, ElMessageBox } from "element-plus";
  import {
    getAllBaseQuestions,
    deleteQuestionBase,
    importQuestions,
    getDictionaryByType
  } from "@/api/user";
  import { getAllExamStations } from "@/api/examStation";
  
  // 接收标题属性
  const props = defineProps({
    title: {
      type: String,
      default: "专业题库"
    }
  });
  
  // 状态变量
  const exams = ref([]);
  const isLoading = ref(true);
  const error = ref(null);
  const isSaving = ref(false);
  
  // 搜索和分页
  const searchQuery = ref("");
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalItems = ref(0);
  const questionTypeOptions = ref([]);
  const difficultyTypeOptions = ref([]);
  
  // 考核站相关状态
  const examStations = ref([]);
  const loadingExamStations = ref(false);
  
  // 模态框状态
  const isModalVisible = ref(false);
  const isEditMode = ref(false);
  const currentExam = ref({
    questionName: "",
    questionType: "",
    difficulty: ""
  });
  const selectedFile = ref(null);
  const fileInput = ref(null);
  
  // 导入结果状态
  const showImportResult = ref(false);
  const importSuccess = ref(false);
  const importError = ref("");
  const importResult = ref({
    newQuestions: []
  });
  
  // 根据搜索条件过滤考试数据
  const filteredExams = computed(() => {
    return exams.value;
  });
  
  // 当前页显示的考试数据
  const paginatedExams = computed(() => {
    return filteredExams.value;
  });
  
  // 计算总页数
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
  
  // 获取专业题库列表
  const fetchExams = async () => {
    isLoading.value = true;
    error.value = null;
  
    try {
      // 创建SearchInfo对象
      const searchInfo = {
        name: searchQuery.value || "",
        type: 1, // 使用props中的题库类型
        offset: (currentPage.value - 1) * pageSize.value,
        limit: pageSize.value
      };
  
      const response = await getAllBaseQuestions(searchInfo);
  
      if (response && response.code === 200) {
        exams.value = response.data.list || [];
        totalItems.value = response.data.total || 0;
      } else {
        throw new Error(response?.msg || "获取题库列表失败");
      }
    } catch (err) {
      console.error("获取题库列表失败:", err);
      error.value = err.message || "获取题库列表失败，请稍后重试";
    } finally {
      isLoading.value = false;
    }
  };
  
  // 搜索
  const search = () => {
    currentPage.value = 1; // 搜索后回到第一页
    fetchExams();
  };
  
  // 重置
  const reset = () => {
    searchQuery.value = "";
    currentPage.value = 1;
    fetchExams();
  };
  
  // 分页
  const goToPage = page => {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    fetchExams();
  };
  
  // 获取题目类型选项
  const fetchQustionTypeOptions = async () => {
    try {
      const response = await getDictionaryByType({ type: 4 }); // 假设4题型类型
      if (response && response.code === 200 && response.data) {
        questionTypeOptions.value = response.data.map(item => ({
          id: item.id,
          name: item.name,
          code: item.code
        }));
      } else {
        throw new Error(response?.msg || "获取部门数据失败");
      }
    } catch (err) {
      console.error("获取部门数据失败:", err);
      ElMessage.error("获取部门数据失败，请稍后重试");
    }
  };
  const fetchdifficultyTypeOptions = async () => {
    try {
      const response = await getDictionaryByType({ type: 5 }); // 假设5难度类型
      if (response && response.code === 200 && response.data) {
        difficultyTypeOptions.value = response.data.map(item => ({
          id: item.id,
          name: item.name,
          code: item.code
        }));
      } else {
        throw new Error(response?.msg || "获取部门数据失败");
      }
    } catch (err) {
      console.error("获取部门数据失败:", err);
      ElMessage.error("获取部门数据失败，请稍后重试");
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
    if (examStations.value.length > 0) return; // 已经加载过了
    
    loadingExamStations.value = true;
    try {
      const response = await getAllExamStations();
      const responseData = response.data || {};
      
      if (responseData && responseData.code === 200) {
        examStations.value = responseData.data || [];
      } else {
        console.error('获取考核站列表失败:', responseData?.msg);
      }
    } catch (error) {
      console.error('获取考核站列表失败:', error);
    } finally {
      loadingExamStations.value = false;
    }
  };
  
  // 显示新增模态框
  const showAddModal = () => {
    fetchQustionTypeOptions();
    fetchdifficultyTypeOptions();
    isEditMode.value = false;
    currentExam.value = {
      questionName: "",
      questionType: "",
      difficulty: ""
    };
    selectedFile.value = null;
    isModalVisible.value = true;
  };
  
  // 编辑考试
  const editExam = exam => {
    fetchQustionTypeOptions();
    fetchdifficultyTypeOptions();
    isEditMode.value = true;
    currentExam.value = { ...exam };
    selectedFile.value = null;
    isModalVisible.value = true;
  };
  
  // 关闭模态框
  const closeModal = () => {
    isModalVisible.value = false;
  };
  
  // 触发文件选择
  const triggerFileInput = () => {
    fileInput.value.click();
  };
  
  // 处理文件选择
  const handleFileChange = event => {
    const file = event.target.files[0];
    if (file) {
      selectedFile.value = file;
    }
  };
  
  /**
   * 下载题库模板文件
   * 文件位于public/assets/recourse/题库模板.xlsx
   */
  const downloadTemplate = () => {
    try {
      // 创建一个a标签用于下载
      const link = document.createElement("a");
  
      // 设置文件路径（相对于public目录）
      link.href = "/assets/recourse/题库模板.xlsx";
  
      // 设置下载文件名
      link.download = "题库模板.xlsx";
  
      // 添加到DOM并触发点击
      document.body.appendChild(link);
  
      // 使用setTimeout确保DOM操作完成后再触发点击
      setTimeout(() => {
        link.click();
  
        // 清理DOM
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      }, 0);
  
      console.log("题库模板下载成功");
      ElMessage.success("题库模板下载成功");
    } catch (error) {
      console.error("题库模板下载失败:", error);
      ElMessage.error("题库模板下载失败，请稍后重试");
    }
  };
  
  // 保存考试
  const saveExam = async () => {
    // 验证表单
    if (!currentExam.value.questionName) {
      ElMessage.warning("请输入题库名称");
      return;
    }
  
    if (!selectedFile.value) {
      ElMessage.warning("请选择要导入的文件");
      return;
    }
  
    isSaving.value = true;
  
    try {
      let response;
      // 导入题目
      await importQuestionsToBase(
        currentExam.value.id,
        currentExam.value.questionName,
        currentExam.value.questionType
      );
    } catch (err) {
      console.error("保存题库失败:", err);
      ElMessage.error(err.message || "保存题库失败，请稍后重试");
    } finally {
      isSaving.value = false;
    }
  };
  
  // 导入题目到题库
  const importQuestionsToBase = async (baseId, questionName, questionType) => {
    try {
      if (!selectedFile.value) {
        ElMessage.warning("请选择要导入的文件");
        return;
      }
  
      const response = await importQuestions(
        baseId, // 可能为空，由后端生成
        questionName,
        questionType,
        "", // level，该页面未使用
        "", // questionBankType，该页面未使用
        [selectedFile.value]
      );
  
      if (response && response.code === 200) {
        if (response.data.reqQuestionsList.length > 0) {
          ElMessage.warning(
            "导入题目有" + response.data.reqQuestionsList.length + "条失败"
          );
        } else {
          showImportResultSuccess(response.data);
        }
      }
    } catch (err) {
      console.error("导入题目失败:", err);
      showImportResultError(err.message || "导入题目失败，请稍后重试");
    }
  };
  
  // 显示导入成功结果
  const showImportResultSuccess = data => {
    importSuccess.value = true;
    importResult.value = {
      newQuestions: data.newQuestionsList || []
    };
    showImportResult.value = true;
    closeModal();
  };
  
  // 显示导入失败结果
  const showImportResultError = errorMsg => {
    importSuccess.value = false;
    importError.value = errorMsg;
    showImportResult.value = true;
  };
  
  // 关闭导入结果模态框
  const closeImportResultModal = () => {
    showImportResult.value = false;
    if (importSuccess.value) {
      fetchExams(); // 刷新列表
    }
  };
  
  // 删除考试
  const deleteExam = exam => {
    ElMessageBox.confirm(`确定要删除题库 "${exam.questionName}" 吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          const response = await deleteQuestionBase(exam.id);
  
          if (response && response.code === 200) {
            ElMessage.success("题库删除成功");
            fetchExams(); // 刷新列表
          } else {
            throw new Error(response?.msg || "删除题库失败");
          }
        } catch (err) {
          console.error("删除题库失败:", err);
          ElMessage.error(err.message || "删除题库失败，请稍后重试");
        }
      })
      .catch(() => {
        // 用户取消删除
      });
  };
  
  // 生命周期钩子
  onMounted(async () => {
    console.log(`${props.title}组件已挂载`);
    await fetchExamStations(); // 先获取考核站列表
    fetchExams(); // 组件挂载时获取题库列表
  });
  </script>
  
  <style scoped>
  .exam-management {
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
    margin-bottom: 20px;
  }
  
  .search-input-wrapper {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  
  .search-input {
    width: 300px;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
  }
  
  .search-button,
  .reset-button {
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .search-button {
    background-color: #c70019;
    color: white;
  }
  
  .reset-button {
    background-color: #f0f0f0;
    color: #333;
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
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .plus-icon {
    font-weight: bold;
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
  
  .modal-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
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
  
  .form-input,
  .form-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    box-sizing: border-box;
  }
  
  .template-download-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 8px 0;
    background-color: #c70019;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .download-icon,
  .upload-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .file-upload-wrapper {
    cursor: pointer;
  }
  
  .file-upload-box {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 36px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    padding: 0 12px;
    box-sizing: border-box;
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
  
  .modal-footer {
    padding: 10px 24px;
    text-align: right;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: center;
    gap: 8px;
  }
  
  /* 导入结果模态框 */
  .import-result-modal {
    background-color: white;
    border-radius: 4px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  .import-success,
  .import-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
  }
  
  .import-success svg {
    color: #52c41a;
    margin-bottom: 16px;
  }
  
  .import-error svg {
    color: #ff4d4f;
    margin-bottom: 16px;
  }
  
  .import-stats {
    margin-top: 16px;
    text-align: center;
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .search-input-wrapper {
      flex-direction: column;
      align-items: flex-start;
    }
  
    .search-input {
      width: 100%;
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
  </style>
  