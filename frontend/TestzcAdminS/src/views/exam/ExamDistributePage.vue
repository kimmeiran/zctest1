<template>
  <div class="exam-distribute-page">
    <div class="breadcrumb-row">
      <BreadcrumbNav :items="breadcrumbItems" />
      <button type="button" class="btn-back" @click="goBack">返回</button>
    </div>
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">考核站派发 - {{ examName }}</h2>
    </div>

    <!-- 试卷选择区域 -->
    <div class="paper-selection-section">
      <div class="section-title">选择试卷</div>
      <div class="form-group">
        <label class="required">选择试卷</label>
        <select class="form-select" v-model="selectedPaperId" @change="loadPaperQuestions">
          <option :value="null">请选择试卷</option>
          <option v-for="paper in availablePapers" :key="paper.id" :value="paper.id">
            {{ paper.name || `试卷ID: ${paper.id}` }}
          </option>
        </select>
        <p v-if="availablePapers.length === 0" class="hint-text">当前职业技能等级下暂无可用试卷</p>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoadingQuestions" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载试题中...</p>
    </div>

    <!-- 错误信息 -->
    <div v-else-if="loadError" class="error-message">
      {{ loadError }}
      <button class="btn btn-primary retry-btn" @click="loadPaperQuestions">重试</button>
    </div>

    <!-- 试题展示区域 -->
    <div v-else-if="selectedPaperId && modifiedQuestions.length > 0" class="questions-section">
      <div class="section-header">
        <div class="section-title">试卷试题</div>
        <div class="question-stats">
          <span>共 {{ totalQuestionCount }} 题，总分 {{ totalScore }} 分</span>
        </div>
      </div>

      <!-- 填空题 -->
      <div class="question-group">
        <h3 class="group-title">填空题</h3>
        <template v-if="groupedQuestions.fillBlank.length > 0">
          <div v-for="(q, idx) in groupedQuestions.fillBlank" :key="q.originalIndex" class="question-item">
            <div class="question-content-wrapper">
              <div class="question-header-inline">
                <span class="question-number">{{ idx + 1 }}.</span>
                <span class="question-text" v-html="q._questionContentHtml || q.questionContent"></span>
                <span class="question-score">({{ q.score || 0 }}分)</span>
              </div>
              <div class="question-answer">
                <span class="answer-label">答案：</span>
                <span class="answer-content" v-html="q._answerHtml || q.answer || '暂无答案'"></span>
              </div>
            </div>
            <button class="btn btn-replace" @click="openReplaceModal(q, '填空题')">替换</button>
          </div>
        </template>
        <div v-else class="no-data">暂无此类题目</div>
      </div>

      <!-- 单选题 -->
      <div class="question-group">
        <h3 class="group-title">单项选择题</h3>
        <template v-if="groupedQuestions.singleChoice.length > 0">
          <div v-for="(q, idx) in groupedQuestions.singleChoice" :key="q.originalIndex" class="question-item">
            <div class="question-content-wrapper">
              <div class="question-header-inline">
                <span class="question-number">{{ idx + 1 }}.</span>
                <span class="question-text" v-html="q._questionContentHtml || q.questionContent"></span>
                <span class="question-score">({{ q.score || 0 }}分)</span>
              </div>
              <div class="question-options">
                <div v-if="q.answera" class="option">
                  <span class="option-letter">A.</span>
                  <span v-html="q._answeraHtml || q.answera"></span>
                </div>
                <div v-if="q.answerb" class="option">
                  <span class="option-letter">B.</span>
                  <span v-html="q._answerbHtml || q.answerb"></span>
                </div>
                <div v-if="q.answerc" class="option">
                  <span class="option-letter">C.</span>
                  <span v-html="q._answercHtml || q.answerc"></span>
                </div>
                <div v-if="q.answerd" class="option">
                  <span class="option-letter">D.</span>
                  <span v-html="q._answerdHtml || q.answerd"></span>
                </div>
                <div v-if="q.answere" class="option">
                  <span class="option-letter">E.</span>
                  <span v-html="q._answereHtml || q.answere"></span>
                </div>
                <div v-if="q.answerf" class="option">
                  <span class="option-letter">F.</span>
                  <span v-html="q._answerfHtml || q.answerf"></span>
                </div>
                <div v-if="q.answerg" class="option">
                  <span class="option-letter">G.</span>
                  <span v-html="q._answergHtml || q.answerg"></span>
                </div>
              </div>
              <div class="question-answer">
                <span class="answer-label">答案：</span>
                <span class="answer-content" v-html="q._answerHtml || q.answer || '暂无答案'"></span>
              </div>
            </div>
            <button class="btn btn-replace" @click="openReplaceModal(q, '单项选择题')">替换</button>
          </div>
        </template>
        <div v-else class="no-data">暂无此类题目</div>
      </div>

      <!-- 多选题 -->
      <div class="question-group">
        <h3 class="group-title">多项选择题</h3>
        <template v-if="groupedQuestions.multiChoice.length > 0">
          <div v-for="(q, idx) in groupedQuestions.multiChoice" :key="q.originalIndex" class="question-item">
            <div class="question-content-wrapper">
              <div class="question-header-inline">
                <span class="question-number">{{ idx + 1 }}.</span>
                <span class="question-text" v-html="q._questionContentHtml || q.questionContent"></span>
                <span class="question-score">({{ q.score || 0 }}分)</span>
              </div>
              <div class="question-options">
                <div v-if="q.answera" class="option">
                  <span class="option-letter">A.</span>
                  <span v-html="q._answeraHtml || q.answera"></span>
                </div>
                <div v-if="q.answerb" class="option">
                  <span class="option-letter">B.</span>
                  <span v-html="q._answerbHtml || q.answerb"></span>
                </div>
                <div v-if="q.answerc" class="option">
                  <span class="option-letter">C.</span>
                  <span v-html="q._answercHtml || q.answerc"></span>
                </div>
                <div v-if="q.answerd" class="option">
                  <span class="option-letter">D.</span>
                  <span v-html="q._answerdHtml || q.answerd"></span>
                </div>
                <div v-if="q.answere" class="option">
                  <span class="option-letter">E.</span>
                  <span v-html="q._answereHtml || q.answere"></span>
                </div>
                <div v-if="q.answerf" class="option">
                  <span class="option-letter">F.</span>
                  <span v-html="q._answerfHtml || q.answerf"></span>
                </div>
                <div v-if="q.answerg" class="option">
                  <span class="option-letter">G.</span>
                  <span v-html="q._answergHtml || q.answerg"></span>
                </div>
              </div>
              <div class="question-answer">
                <span class="answer-label">答案：</span>
                <span class="answer-content" v-html="q._answerHtml || q.answer || '暂无答案'"></span>
              </div>
            </div>
            <button class="btn btn-replace" @click="openReplaceModal(q, '多项选择题')">替换</button>
          </div>
        </template>
        <div v-else class="no-data">暂无此类题目</div>
      </div>

      <!-- 判断题 -->
      <div class="question-group">
        <h3 class="group-title">判断题</h3>
        <template v-if="groupedQuestions.decide.length > 0">
          <div v-for="(q, idx) in groupedQuestions.decide" :key="q.originalIndex" class="question-item">
            <div class="question-content-wrapper">
              <div class="question-header-inline">
                <span class="question-number">{{ idx + 1 }}.</span>
                <span class="question-text" v-html="q._questionContentHtml || q.questionContent"></span>
                <span class="question-score">({{ q.score || 0 }}分)</span>
              </div>
              <div class="question-answer">
                <span class="answer-label">答案：</span>
                <span class="answer-content">{{ q.answer === '1' ? '正确' : q.answer === '0' ? '错误' : (q._answerHtml || q.answer || '暂无答案') }}</span>
              </div>
            </div>
            <button class="btn btn-replace" @click="openReplaceModal(q, '判断题')">替换</button>
          </div>
        </template>
        <div v-else class="no-data">暂无此类题目</div>
      </div>

      <!-- 简答题 -->
      <div class="question-group">
        <h3 class="group-title">简答题</h3>
        <template v-if="groupedQuestions.shortAnswer.length > 0">
          <div v-for="(q, idx) in groupedQuestions.shortAnswer" :key="q.originalIndex" class="question-item">
            <div class="question-content-wrapper">
              <div class="question-header-inline">
                <span class="question-number">{{ idx + 1 }}.</span>
                <span class="question-text" v-html="q._questionContentHtml || q.questionContent"></span>
                <span class="question-score">({{ q.score || 0 }}分)</span>
              </div>
              <div class="question-answer">
                <span class="answer-label">答案：</span>
                <span class="answer-content" v-html="q._answerHtml || q.answer || '暂无答案'"></span>
              </div>
            </div>
            <button class="btn btn-replace" @click="openReplaceModal(q, '简答题')">替换</button>
          </div>
        </template>
        <div v-else class="no-data">暂无此类题目</div>
      </div>

      <!-- 综合题 -->
      <div class="question-group">
        <h3 class="group-title">综合题</h3>
        <template v-if="groupedQuestions.comprehensive.length > 0">
          <div v-for="(q, idx) in groupedQuestions.comprehensive" :key="q.originalIndex" class="question-item">
            <div class="question-content-wrapper">
              <div class="question-header-inline">
                <span class="question-number">{{ idx + 1 }}.</span>
                <span class="question-text" v-html="q._questionContentHtml || q.questionContent"></span>
                <span class="question-score">({{ q.score || 0 }}分)</span>
              </div>
              <div class="question-answer">
                <span class="answer-label">答案：</span>
                <span class="answer-content" v-html="q._answerHtml || q.answer || '暂无答案'"></span>
              </div>
            </div>
            <button class="btn btn-replace" @click="openReplaceModal(q, '综合题')">替换</button>
          </div>
        </template>
        <div v-else class="no-data">暂无此类题目</div>
      </div>
    </div>

    <!-- 提交按钮区域 -->
    <div v-if="selectedPaperId && modifiedQuestions.length > 0" class="submit-section">
      <button class="btn btn-primary btn-submit" @click="handleSubmit" :disabled="isSubmitting">
        {{ isSubmitting ? '提交中...' : '确认派发' }}
      </button>
    </div>

    <!-- 题库选择弹窗 -->
    <QuestionBankPickerModal
      v-model="showQuestionPicker"
      :filter-by-question-type="currentReplaceQuestionType"
      @confirm="handleQuestionReplace"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import BreadcrumbNav from '@/components/BreadcrumbNav.vue';
import { getExamList as getTeachExamList, getAllExamPaperByExamPaper, constructManualExam } from '@/api/user';
import { distributeExam } from '@/api/exam';
import QuestionBankPickerModal from '@/views/new/manualPaper/QuestionBankPickerModal.vue';
import { getFullImageUrl, replaceImgPlaceholdersWithAuth } from '@/api/imageUpload.js';

const route = useRoute();
const router = useRouter();

// 路由参数
const examId = ref(route.params.examId);
const examName = ref(route.query.examName || '');
const jobType = ref(route.query.jobType || '');
const level = ref(route.query.level || '');

// 试卷相关
const availablePapers = ref([]);
const selectedPaperId = ref(null);
const originalPaperInfo = ref(null);

// 试题相关
const modifiedQuestions = ref([]);
const isLoadingQuestions = ref(false);
const loadError = ref('');

// 替换试题相关
const showQuestionPicker = ref(false);
const currentReplaceQuestion = ref(null);
const currentReplaceQuestionType = ref(null);

// 提交状态
const isSubmitting = ref(false);

// 加载可用试卷列表
const loadAvailablePapers = async () => {
  try {
    const response = await getTeachExamList({
      offset: 0,
      limit: 1000,
      auditStatus: 1, // 只获取审核通过的试卷
    });

    if (response && response.code === 200 && response.data) {
      const allPapers = response.data.list || [];
      // 根据jobType和level筛选试卷
      availablePapers.value = allPapers.filter(paper => 
        paper.jobType === jobType.value && 
        paper.level === level.value
      );
    }
  } catch (err) {
    console.error('加载试卷列表失败:', err);
    ElMessage.error('加载试卷列表失败');
  }
};

// 图片请求使用 replaceImgPlaceholdersWithAuth，发请求时带 Authorization 头

// 处理题目中的图片占位符（异步，请求图片时带 token）
const processQuestionImages = async (question) => {
  const processedQuestion = { ...question };
  const opt = (q) => q.option_images || q.optionImages || '';

  if (question.questionContent) {
    const imagesCsv = question.question_content_images || question.questionContentImages || question.questionImages || '';
    processedQuestion._questionContentHtml = await replaceImgPlaceholdersWithAuth(question.questionContent, imagesCsv);
  }
  if (question.answera) processedQuestion._answeraHtml = await replaceImgPlaceholdersWithAuth(question.answera, opt(question));
  if (question.answerb) processedQuestion._answerbHtml = await replaceImgPlaceholdersWithAuth(question.answerb, opt(question));
  if (question.answerc) processedQuestion._answercHtml = await replaceImgPlaceholdersWithAuth(question.answerc, opt(question));
  if (question.answerd) processedQuestion._answerdHtml = await replaceImgPlaceholdersWithAuth(question.answerd, opt(question));
  if (question.answere) processedQuestion._answereHtml = await replaceImgPlaceholdersWithAuth(question.answere, opt(question));
  if (question.answerf) processedQuestion._answerfHtml = await replaceImgPlaceholdersWithAuth(question.answerf, opt(question));
  if (question.answerg) processedQuestion._answergHtml = await replaceImgPlaceholdersWithAuth(question.answerg, opt(question));
  if (question.answer) {
    const imagesCsv = question.answer_image || question.answerImage || '';
    processedQuestion._answerHtml = await replaceImgPlaceholdersWithAuth(question.answer, imagesCsv);
  }
  return processedQuestion;
};

// 加载试卷的所有试题
const loadPaperQuestions = async () => {
  if (!selectedPaperId.value) {
    modifiedQuestions.value = [];
    return;
  }

  isLoadingQuestions.value = true;
  loadError.value = '';

  try {
    const response = await getAllExamPaperByExamPaper(selectedPaperId.value);

    if (response && response.code === 200 && response.data) {
      const apiData = response.data;
      
      // 保存原试卷信息
      if (apiData.exam) {
        originalPaperInfo.value = apiData.exam;
      }

      // 提取所有题目（异步处理图片，请求时带 Authorization 头）
      const allQuestions = [];
      let originalIndex = 0;
      const addProcessed = (arr, questionType) => {
        if (!arr || !Array.isArray(arr)) return [];
        return arr.map(q => processQuestionImages({ ...q, questionType, originalIndex: originalIndex++ }));
      };

      if (apiData.singleChoice && Array.isArray(apiData.singleChoice)) {
        const arr = await Promise.all(addProcessed(apiData.singleChoice, 'singleChoice'));
        allQuestions.push(...arr);
      }
      if (apiData.multiChoice && Array.isArray(apiData.multiChoice)) {
        const arr = await Promise.all(addProcessed(apiData.multiChoice, 'multiChoice'));
        allQuestions.push(...arr);
      }
      if (apiData.decide && Array.isArray(apiData.decide)) {
        const arr = await Promise.all(addProcessed(apiData.decide, 'decide'));
        allQuestions.push(...arr);
      }
      if (apiData.fillBlank && Array.isArray(apiData.fillBlank)) {
        const arr = await Promise.all(addProcessed(apiData.fillBlank, 'fillBlank'));
        allQuestions.push(...arr);
      }
      if (apiData.fillBank && Array.isArray(apiData.fillBank)) {
        const arr = await Promise.all(addProcessed(apiData.fillBank, 'fillBlank'));
        allQuestions.push(...arr);
      }
      if (apiData.shortAnswer && Array.isArray(apiData.shortAnswer)) {
        const arr = await Promise.all(addProcessed(apiData.shortAnswer, 'shortAnswer'));
        allQuestions.push(...arr);
      }
      if (apiData.comprehensive && Array.isArray(apiData.comprehensive)) {
        const arr = await Promise.all(addProcessed(apiData.comprehensive, 'comprehensive'));
        allQuestions.push(...arr);
      }

      modifiedQuestions.value = allQuestions;
    } else {
      throw new Error(response?.msg || '获取试卷题目失败');
    }
  } catch (err) {
    console.error('加载试题失败:', err);
    loadError.value = err.message || '获取试卷题目失败，请稍后重试';
    modifiedQuestions.value = [];
  } finally {
    isLoadingQuestions.value = false;
  }
};

// 打开替换试题弹窗
const openReplaceModal = (question, questionType) => {
  currentReplaceQuestion.value = question;
  currentReplaceQuestionType.value = questionType;
  showQuestionPicker.value = true;
};

// 处理试题替换
const handleQuestionReplace = async (selectedQuestions) => {
  if (!selectedQuestions || selectedQuestions.length === 0) {
    ElMessage.warning('请选择一个题目');
    return;
  }

  if (selectedQuestions.length > 1) {
    ElMessage.warning('只能选择一个题目进行替换');
    return;
  }

  const newQuestion = selectedQuestions[0];
  
  // 确保题型匹配
  if (newQuestion.questionType !== currentReplaceQuestionType.value) {
    ElMessage.warning(`只能替换为相同题型的题目，当前需要替换为${currentReplaceQuestionType.value}`);
    return;
  }

  // 在modifiedQuestions中找到要替换的题目并替换
  const index = modifiedQuestions.value.findIndex(q => q.originalIndex === currentReplaceQuestion.value.originalIndex);
  if (index !== -1) {
    const processedQuestion = await processQuestionImages({
      ...newQuestion,
      score: currentReplaceQuestion.value.score,
      originalIndex: currentReplaceQuestion.value.originalIndex,
      questionType: currentReplaceQuestion.value.questionType,
    });
    modifiedQuestions.value[index] = processedQuestion;
    ElMessage.success('替换成功');
  }

  showQuestionPicker.value = false;
  currentReplaceQuestion.value = null;
  currentReplaceQuestionType.value = null;
};

// 按题型分组题目
const groupedQuestions = computed(() => {
  const groups = {
    singleChoice: [],
    multiChoice: [],
    decide: [],
    fillBlank: [],
    shortAnswer: [],
    comprehensive: []
  };

  if (!Array.isArray(modifiedQuestions.value)) {
    return groups;
  }

  modifiedQuestions.value.forEach(q => {
    const type = q.questionType;
    if (groups[type]) {
      groups[type].push(q);
    }
  });

  return groups;
});

// 总题目数
const totalQuestionCount = computed(() => {
  return modifiedQuestions.value.length;
});

// 总分
const totalScore = computed(() => {
  return modifiedQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0);
});

// 提交派发
const handleSubmit = async () => {
  try {
    await ElMessageBox.confirm(
      '确认要派发考试吗？将根据当前试卷生成新试卷并派发。',
      '确认派发',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    isSubmitting.value = true;

    // 1. 创建新试卷
    const paperData = {
      name: originalPaperInfo.value?.name || `试卷-${jobType.value}-${level.value}`,
      jobType: jobType.value,
      level: level.value,
      desc: originalPaperInfo.value?.desc || '',
      questions: modifiedQuestions.value.map(q => ({
        id: q.id,
        score: q.score || 0
      }))
    };

    const createResponse = await constructManualExam(paperData);
    console.log('创建试卷响应:', createResponse);
    
    if (createResponse && createResponse.code === 200) {
      // 尝试多种方式获取试卷ID
      let newPaperId = createResponse.data?.id || createResponse.data || createResponse.id;
      
      // 如果data是数字，说明直接返回了ID
      if (typeof createResponse.data === 'number') {
        newPaperId = createResponse.data;
      }
      
      // 如果还是没有ID，尝试查询最新创建的试卷
      if (!newPaperId) {
        console.warn('API未返回试卷ID，尝试查询最新创建的试卷');
        try {
          // 查询最新创建的试卷（根据name、jobType、level匹配）
          const queryResponse = await getTeachExamList({
            offset: 0,
            limit: 10,
            auditStatus: 1,
          });
          
          if (queryResponse && queryResponse.code === 200 && queryResponse.data) {
            const papers = queryResponse.data.list || [];
            // 查找匹配的试卷（按创建时间倒序，取第一条匹配的）
            const matchedPaper = papers
              .filter(p => p.jobType === jobType.value && p.level === level.value)
              .sort((a, b) => {
                const timeA = new Date(a.createTime || 0).getTime();
                const timeB = new Date(b.createTime || 0).getTime();
                return timeB - timeA; // 倒序
              })[0];
            
            if (matchedPaper && matchedPaper.id) {
              newPaperId = matchedPaper.id;
              console.log('找到最新创建的试卷ID:', newPaperId);
            }
          }
        } catch (queryErr) {
          console.error('查询最新试卷失败:', queryErr);
        }
      }
      
      if (!newPaperId) {
        console.error('创建试卷响应结构:', createResponse);
        throw new Error('创建新试卷失败，无法获取试卷ID。请检查API响应或稍后重试。');
      }

      // 2. 使用新试卷ID派发考试
      const distributeResponse = await distributeExam(examId.value, newPaperId);
      if (distributeResponse && distributeResponse.data && distributeResponse.data.code === 200) {
        ElMessage.success(distributeResponse.data.msg || '派发成功');
        
        // 设置标记，通知Main.vue切换到考试管理视图
        localStorage.setItem('activeView', '考试管理');
        
        // 延迟一下，让用户看到成功消息，然后返回
        setTimeout(() => {
          // 返回考试管理页面，使用window.location确保页面刷新
          window.location.href = '/home';
        }, 500);
      } else {
        throw new Error(distributeResponse?.data?.msg || distributeResponse?.msg || '派发失败');
      }
    } else {
      throw new Error(createResponse?.msg || '创建新试卷失败');
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('派发失败:', err);
      ElMessage.error(err.message || '派发失败，请稍后重试');
    }
  } finally {
    isSubmitting.value = false;
  }
};

// 返回
const goBack = () => {
  router.push('/home');
};

// 面包屑：考试管理 / 考核站派发
const breadcrumbItems = computed(() => [
  { label: '考试管理', onClick: goBack },
  { label: '考核站派发' }
]);

// 组件挂载时加载数据
onMounted(() => {
  loadAvailablePapers();
});
</script>

<style scoped>
.exam-distribute-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.breadcrumb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.btn-back {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 14px;
}

.btn-back:hover {
  color: #c70019;
  border-color: #c70019;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eee;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #909399;
  color: white;
}

.btn-secondary:hover {
  background-color: #82848a;
}

.btn-primary {
  background-color: #409eff;
  color: white;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-replace {
  background-color: #e6a23c;
  color: white;
  padding: 6px 12px;
  font-size: 13px;
  margin-left: 10px;
}

.btn-replace:hover {
  background-color: #ebb563;
}

.btn-submit {
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 500;
}

.paper-selection-section,
.questions-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.question-stats {
  color: #666;
  font-size: 14px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group label.required::after {
  content: " *";
  color: red;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.hint-text {
  color: #999;
  font-size: 13px;
  margin-top: 5px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 40px;
  color: #f56c6c;
}

.retry-btn {
  margin-top: 10px;
}

.question-group {
  margin-bottom: 30px;
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
  color: #333;
}

.question-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background-color: #fafafa;
  transition: all 0.2s;
}

.question-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.question-content-wrapper {
  flex: 1;
}

.question-header-inline {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  line-height: 1.5;
}

.question-number {
  font-weight: 600;
  color: #333;
  margin-right: 8px;
  flex-shrink: 0;
}

.question-text {
  flex: 1;
  color: #333;
  line-height: 1.5;
}

.question-score {
  font-size: 13px;
  color: #666;
  margin-left: 10px;
  flex-shrink: 0;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.question-options {
  margin: 10px 0;
  padding-left: 20px;
}

.option {
  margin-bottom: 5px;
  display: flex;
  align-items: flex-start;
}

.option-letter {
  font-weight: 500;
  margin-right: 8px;
  flex-shrink: 0;
  color: #1890ff;
}

.question-answer {
  margin-top: 12px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-left: 3px solid #007bff;
  border-radius: 4px;
  font-size: 14px;
  color: #555;
}

.answer-label {
  font-weight: 600;
  color: #007bff;
  margin-right: 8px;
}

.answer-content {
  font-style: italic;
  color: #333;
  line-height: 1.4;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px;
}

.submit-section {
  text-align: center;
  padding: 30px 0;
  border-top: 2px solid #eee;
  margin-top: 30px;
}

.question-inline-image {
  display: inline-block;
  vertical-align: middle;
  max-width: 100%;
  height: auto;
  margin: 0 3px;
}
</style>
