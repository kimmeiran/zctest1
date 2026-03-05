<template>
  <div class="exam-management">
    <h2 class="page-title">{{ displayTitle }}</h2>

    <!-- 一级内容：搜索、按钮、题库表格、分页（抽离为组件） -->
    <div v-if="!selectedExamForView && !showImportPage">
      <QuestionList :items="paginatedExams" :isLoading="isLoading" :error="error" v-model:searchQuery="searchQuery"
        v-model:questionBankType="questionBankType"
        :currentPage="currentPage" :pageSize="pageSize" :totalItems="totalItems" :totalPages="totalPages"
        :displayedPages="displayedPages" :examStations="examStations" @search="search" @reset="reset" @add="showAddModal" @import="showImportPageHandler" @retry="fetchExams"
        @view="viewQuestions" @delete="deleteExam" @goToPage="goToPage" />
    </div>

    <!-- 导入题目页面 -->
    <ImportQuestion v-if="showImportPage" @back="backToQuestionList" @import="handleImportQuestions" />

    <!-- 题目管理区块（页面内版） -->
    <div v-if="selectedExamForView" class="question-manage-block">
      <QuestionTable :examInfo="selectedExamForView" @back="backToExamList" />
    </div>

    <!-- 新增/编辑模态框（抽离为组件） -->
    <QuestionModal :visible="isModalVisible" :isEditMode="isEditMode" :exam="currentExam"
      :employeeTypeOptions="employeeTypeOptions" :levelOptions="levelOptions" :isSaving="isSaving" @close="closeModal"
      @save="handleModalSave" />

    <!-- 导入结果模态框 -->
    <ImportResultModal :visible="showImportResult" :importSuccess="importSuccess" :importResult="importResult"
      :importError="importError" @close="closeImportResultModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import QuestionList from "./question/QuestionList.vue";
import QuestionModal from "./question/QuestionModal.vue";
import QuestionTable from "./question/QuestionTable.vue";
import ImportResultModal from "./question/ImportResultModal.vue";
import ImportQuestion from "./question/ImportQuestion.vue";
import {
  getAllBaseQuestions,
  deleteQuestionBase,
  importQuestions,
  getDictionaryByType
} from "@/api/user";
import { getAllExamStations } from "@/api/examStation";
import { ROLE_EXAM_STATION_ADMIN, isRole } from "@/constants/role";

// 接收标题属性
const props = defineProps({
  title: {
    type: String,
    default: "基础题库"
  }
});

// 状态变量
const exams = ref([]);
const isLoading = ref(true);
const error = ref(null);
const isSaving = ref(false);

// 搜索和分页
const searchQuery = ref("");
const questionBankType = ref(""); // 题库类型筛选：0=职业认定, 1=竞赛, 2=模拟考核
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const employeeTypeOptions = ref([]);
const levelOptions = ref([]);

// 考核站相关状态
const examStations = ref([]);
const loadingExamStations = ref(false);

// 模态框状态
const isModalVisible = ref(false);
const isEditMode = ref(false);

const currentExam = ref({
  questionName: "",
  questionType: "",
  difficulty: "",
  questionBankType: ""
});
// 这些变量现在在 QuestionModal 组件中处理
// const selectedQuestionFile = ref(null);
// const questionFileInput = ref(null);
// const selectedAnswerFile = ref(null);
// const answerFileInput = ref(null);

// 导入页面状态
const showImportPage = ref(false);

// 动态标题：根据当前页面状态显示不同标题
const displayTitle = computed(() => {
  if (showImportPage.value) {
    return `${props.title} / 导入题库`;
  }
  if (selectedExamForView.value) {
    return `${props.title} / 查看题目`;
  }
  return props.title;
});

// 导入结果状态
const showImportResult = ref(false);
const importSuccess = ref(false);
const importError = ref("");
const importResult = ref({
  newQuestions: []
});

// 查看题目模态框状态
const selectedExamForView = ref(null);

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



// 获取基础题库列表
const fetchExams = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // 统一走真实接口，确保创建/导入后列表能查到新增数据（见 skill zcexam-question-bank-list-fix）
    const searchInfo = {
      name: searchQuery.value || "",
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
    };
    // 题库类型筛选：0=职业认定, 1=竞赛, 2=模拟考核
    if (questionBankType.value !== '' && questionBankType.value !== null && questionBankType.value !== undefined) {
      searchInfo.questionBankType = questionBankType.value;
    }
    // 考核站管理员：仅查看本考核站的题库
    const userStr = sessionStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : {};
    if (isRole(user.role, ROLE_EXAM_STATION_ADMIN)) {
      if (user.stationId) searchInfo.stationId = user.stationId;
    }

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
  questionBankType.value = "";
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
    const response = await getDictionaryByType({ type: 0 }); // 职业(工种)
    if (response && response.code === 200 && response.data) {
      employeeTypeOptions.value = response.data.map(item => ({
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

// 获取技能等级
const fetchLevelOptions = async () => {
  try {
    const response = await getDictionaryByType({ type: 1 }); // 技能等级
    if (response && response.code === 200 && response.data) {
      levelOptions.value = response.data.map(item => ({
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
  fetchLevelOptions();
  isEditMode.value = false;
  currentExam.value = {
    questionName: "",
    questionType: "",
    difficulty: "",
    questionBankType: ""
  };
  // 文件选择现在在 QuestionModal 组件中处理
  // selectedQuestionFile.value = null;
  // selectedAnswerFile.value = null;
  isModalVisible.value = true;
};

// 显示导入页面
const showImportPageHandler = () => {
  showImportPage.value = true;
};

// 返回题库列表
const backToQuestionList = () => {
  showImportPage.value = false;
  // 返回后刷新题库列表
  fetchExams();
};

// 处理导入题目
const handleImportQuestions = async (importData) => {
  try {
    const { file, options } = importData;
    
    // 这里可以添加实际的导入逻辑
    // 例如调用API上传文件并处理导入
    console.log('导入文件:', file);
    console.log('导入选项:', options);
    
    // 模拟导入过程
    ElMessage.success('题目导入成功！');
    backToQuestionList();
    
    // 刷新题库列表
    fetchExams();
  } catch (error) {
    console.error('导入失败:', error);
    ElMessage.error('导入失败，请重试');
  }
};

// 编辑考试
const editExam = exam => {
  fetchQustionTypeOptions();
  fetchLevelOptions();
  isEditMode.value = true;
  const typeObj = employeeTypeOptions.value.find(
    opt => opt.id === exam.questionType || opt.code === exam.questionType
  );
  const levelObj = levelOptions.value.find(
    opt => opt.id === exam.level || opt.code === exam.level
  );
  currentExam.value = {
    ...exam,
    questionType: typeObj ? typeObj.name : "",
    difficulty: levelObj ? levelObj.name : ""
  };
  // 文件选择现在在 QuestionModal 组件中处理
  // selectedQuestionFile.value = null;
  // selectedAnswerFile.value = null;
  isModalVisible.value = true;
};

// 关闭模态框
const closeModal = () => {
  isModalVisible.value = false;
};

// 这些方法现在在 QuestionModal 组件中处理
// const triggerQuestionFileInput = () => {
//   questionFileInput.value.click();
// };

// const handleQuestionFileChange = event => {
//   const file = event.target.files[0];
//   if (file) {
//     selectedQuestionFile.value = file;
//   }
// };

// const triggerAnswerFileInput = () => {
//   answerFileInput.value.click();
// };

// const handleAnswerFileChange = event => {
//   const file = event.target.files[0];
//   if (file) {
//     selectedAnswerFile.value = file;
//   }
// };

// 处理模态框保存
const handleModalSave = async (data) => {
  const { exam, questionFile, answerFile } = data

  // 验证表单
  if (!exam.questionName) {
    ElMessage.warning("请输入题库名称");
    return;
  }

  if (!exam.questionType) {
    ElMessage.warning("请选择职业(工种)");
    return;
  }

  if (!exam.difficulty) {
    ElMessage.warning("请选择技能等级");
    return;
  }

  if (!exam.questionBankType) {
    ElMessage.warning("请选择题库类型");
    return;
  }

  if (!questionFile) {
    ElMessage.warning("请选择要导入的题目文件");
    return;
  }

  if (!answerFile) {
    ElMessage.warning("请选择要导入的答案文件");
    return;
  }

  isSaving.value = true;

  try {
    // 修改：传递汉字名称而不是ID
    const questionTypeName = exam.questionType; // 直接使用汉字名称
    const levelName = exam.difficulty; // 直接使用汉字名称

    // 导入题目
    await importQuestionsToBase(
      exam.id,
      exam.questionName,
      questionTypeName,
      levelName,
      exam.questionBankType,
      questionFile,
      answerFile
    );
    isSaving.value = true;
  } catch (err) {
    console.error("保存题库失败:", err);
    ElMessage.error(err.message || "保存题库失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};

// 保存考试（保留原有方法，用于兼容）
const saveExam = async () => {
  // 验证表单
  if (!currentExam.value.questionName) {
    ElMessage.warning("请输入题库名称");
    return;
  }

  if (!currentExam.value.questionType) {
    ElMessage.warning("请选择职业(工种)");
    return;
  }

  if (!currentExam.value.difficulty) {
    ElMessage.warning("请选择技能等级");
    return;
  }

  // 文件验证现在在 QuestionModal 组件中处理
  // if (!selectedQuestionFile.value) {
  //   ElMessage.warning("请选择要导入的题目文件");
  //   return;
  // }

  // if (!selectedAnswerFile.value) {
  //   ElMessage.warning("请选择要导入的答案文件");
  //   return;
  // }

  isSaving.value = true;

  try {
    const questionTypeOption = employeeTypeOptions.value.find(
      opt => opt.name === currentExam.value.questionType
    );
    const levelOption = levelOptions.value.find(
      opt => opt.name === currentExam.value.difficulty
    );

    // 修改：传递汉字名称而不是ID
    const questionTypeName = currentExam.value.questionType; // 直接使用汉字名称
    const levelName = currentExam.value.difficulty; // 直接使用汉字名称

    // 导入题目（注意：这个方法现在主要用于兼容，实际保存通过 QuestionModal 组件处理）
    // await importQuestionsToBase(
    //   currentExam.value.id,
    //   currentExam.value.questionName,
    //   questionTypeName,
    //   levelName,
    //   selectedQuestionFile.value,
    //   selectedAnswerFile.value
    // );
    ElMessage.warning("请使用新增按钮来创建题库");
    isSaving.value = true;
  } catch (err) {
    console.error("保存题库失败:", err);
    ElMessage.error(err.message || "保存题库失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};

// 导入题目到题库
const importQuestionsToBase = async (
  baseId,
  questionName,
  questionType,
  level,
  questionBankType,
  questionFile = null,
  answerFile = null
) => {
  try {
    const files = [questionFile, answerFile].filter(
      file => file instanceof File
    );

    if (files.length !== 2) {
      ElMessage.warning("请选择要导入的题目和答案文件");
      return;
    }

    const response = await importQuestions(
      baseId, // 可能为空，由后端生成
      questionName,
      questionType,
      level,
      questionBankType || "",
      files
    );

    if (response && response.code === 200) {
      ElMessage.success("导入题库成功");
      closeModal();
      fetchExams();
    } else {
      throw new Error(response?.msg || "导入题目失败");
    }
  } catch (err) {
    console.error("导入题目失败:", err);
    // showImportResultError(err.message || "导入题目失败，请稍后重试");
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

// 查看题目
const viewQuestions = exam => {
  selectedExamForView.value = exam;
  // questionsCurrentPage.value = 1; // 题目管理页面不使用分页
  // fetchQuestionsForView(); // 题目管理页面不使用分页
};













// 生命周期钩子
onMounted(async () => {
  await fetchExamStations(); // 先获取考核站列表
  fetchExams();
  console.log(`${props.title}组件已挂载`);
});

// 在<script setup>中增加返回方法
const backToExamList = () => {
  selectedExamForView.value = null;
};

// 删除题库
const deleteExam = exam => {
  ElMessageBox.confirm(`确定要删除该题库吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const res = await deleteQuestionBase(exam.id);
        if (res.code === 200) {
          ElMessage.success("题库删除成功");
          fetchExams();
        } else {
          throw new Error(res.msg || "删除题库失败");
        }
      } catch (err) {
        ElMessage.error(err.message || "删除题库失败");
      }
    })
    .catch(() => { });
};

// 在setup中添加格式化函数
function formatExamQuestionType(type) {
  if (type === 1 || type === "1" || type === "填空题") return "填空题";
  if (type === 2 || type === "2" || type === "单项选择题") return "单项选择题";
  if (type === 3 || type === "3" || type === "多项选择题") return "多项选择题";
  if (type === 4 || type === "4" || type === "判断题") return "判断题";
  if (type === 5 || type === "5" || type === "简答题") return "简答题";
  if (type === 6 || type === "6" || type === "综合题") return "综合题";
  return type || "-";
}

function formatExamLevel(level) {
  if (level === 1 || level === "1" || level === "初级") return "初级";
  if (level === 2 || level === "2" || level === "中级") return "中级";
  if (level === 3 || level === "3" || level === "高级") return "高级";
  if (level === 4 || level === "4" || level === "技师") return "技师";
  if (level === 5 || level === "5" || level === "高级技师") return "高级技师";
  return level || "-";
}


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

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
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
.delete-link,
.view-link {
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

.view-questions-modal {
  width: 900px;
  max-width: 95%;
}

.question-content {
  max-width: 300px;
  white-space: pre-wrap;
  word-break: break-all;
}

.answer-content {
  max-width: 200px;
  white-space: pre-wrap;
  word-break: break-all;
}

.answer-image {
  margin-top: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 4px;
  background-color: #fafafa;
}

.answer-image img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 2px;
}

.question-image {
  margin-top: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 4px;
  background-color: #fafafa;
}

.question-image img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 2px;
}

.question-manage-block {
  margin-top: 32px;
}

.question-form-block {
  margin-bottom: 16px;
}

/* 选项显示样式 */
.answer-options {
  margin-bottom: 8px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 1.4;
}

.option-letter {
  font-weight: 600;
  color: #333;
  margin-right: 6px;
  flex-shrink: 0;
  min-width: 16px;
}

.correct-answer {
  margin-top: 8px;
  padding: 6px 8px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  font-size: 13px;
  color: #52c41a;
}

.options-input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.option-input-item {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.option-label {
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}

</style>
