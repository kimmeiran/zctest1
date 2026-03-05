<template>
  <div class="content-container">
    <div class="breadcrumb-row">
      <BreadcrumbNav :items="breadcrumbItems" />
      <button type="button" class="btn-back" @click="$emit('goBack')">返回</button>
    </div>
    <!-- 考试信息展示 -->
    <div class="exam-info-header">
      <div class="info-item">
        <span class="info-label">试卷名称:</span>
        <span class="info-value">{{ currentExam?.examName || currentExam?.paperName || '-' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">职位:</span>
        <span class="info-value">{{ examTotal.position }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">总分:</span>
        <span class="info-value">{{ totalScore }}</span>
      </div>
    </div>

    <!-- 员工信息 -->
    <div class="student-info-header">
      <div class="info-item">
        <span class="info-label">工号:</span>
        <span class="info-value">{{ currentStudent.employeeId }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">姓名:</span>
        <span class="info-value">{{ currentStudent.employeeName }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">考核站:</span>
        <span class="info-value">{{ getStationName(currentStudent.stationId) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">客观题总分:</span>
        <span class="info-value">{{ objectiveQuestionsTotalScore }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">当前客观题得分:</span>
        <span class="info-value">{{ currentObjectiveScore }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">主观题总分:</span>
        <span class="info-value">{{ subjectiveQuestionsTotalScore }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">当前主观题得分:</span>
        <span class="info-value">{{ currentSubjectiveScore }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoadingQuestions" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误信息 -->
    <div v-else-if="questionsError" class="error-message">
      {{ questionsError }}
      <button class="btn btn-primary retry-btn" @click="retryFetchQuestions">重试</button>
    </div>

    <!-- 题目列表 -->
    <div v-else class="questions-container">
      <!-- 客观题部分 -->
      <div v-if="objectiveQuestions.length > 0" class="question-section">
        <h3 class="section-title">客观题</h3>
        <div v-for="(question, index) in objectiveQuestions" :key="'obj-' + index" class="question-item">
          <div class="question-header">
            <span class="question-number">{{ index + 1 }}</span>
            <span class="question-type">{{ getQuestionTypeName(question.questionType) }}</span>
            <div class="question-text" v-html="question._questionContentHtml || question.questionContent"></div>
            <span class="question-score">{{ Number(question.questionScore) || 0 }}分</span>
          </div>
          <div v-if="question._attachedImageUrl" class="question-attached-image">
            <img :src="question._attachedImageUrl" alt="题干附图" class="attached-img" />
          </div>
          <div v-if="isQuestionType(question, 'multiple') ?
            (question.studentAnser || '') !== (question.answer || '') :
            question.studentAnser !== question.answer" class="error-indicator">
            <span class="error-icon">×</span>
            <span>错误</span>
          </div>

          <div class="question-options" v-if="!isQuestionType(question, 'fillBlank')">
            <div class="option" :class="{
              selected: isQuestionType(question, 'multiple') ? isOptionSelected(question.studentAnser, 'A') : question.studentAnser === 'A',
              correct: isQuestionType(question, 'multiple') ? isOptionCorrect(question.answer, 'A') : question.answer === 'A',
              incorrect: isQuestionType(question, 'multiple') ? isOptionIncorrect(question.studentAnser, question.answer, 'A') : (question.studentAnser === 'A' && question.answer !== 'A')
            }">
              <span class="option-letter">A.</span>
              <span class="option-text"
                v-html="isQuestionType(question, 'judge') ? '正确' : (question._answeraHtml || question.answera)"></span>
            </div>
            <div class="option" :class="{
              selected: isQuestionType(question, 'multiple') ? isOptionSelected(question.studentAnser, 'B') : question.studentAnser === 'B',
              correct: isQuestionType(question, 'multiple') ? isOptionCorrect(question.answer, 'B') : question.answer === 'B',
              incorrect: isQuestionType(question, 'multiple') ? isOptionIncorrect(question.studentAnser, question.answer, 'B') : (question.studentAnser === 'B' && question.answer !== 'B')
            }">
              <span class="option-letter">B.</span>
              <span class="option-text"
                v-html="isQuestionType(question, 'judge') ? '错误' : (question._answerbHtml || question.answerb)"></span>
            </div>
            <div v-if="!isQuestionType(question, 'judge')" class="option" :class="{
              selected: isQuestionType(question, 'multiple') ? isOptionSelected(question.studentAnser, 'C') : question.studentAnser === 'C',
              correct: isQuestionType(question, 'multiple') ? isOptionCorrect(question.answer, 'C') : question.answer === 'C',
              incorrect: isQuestionType(question, 'multiple') ? isOptionIncorrect(question.studentAnser, question.answer, 'C') : (question.studentAnser === 'C' && question.answer !== 'C')
            }">
              <span class="option-letter">C.</span>
              <span class="option-text" v-html="question._answercHtml || question.answerc"></span>
            </div>
            <div v-if="!isQuestionType(question, 'judge')" class="option" :class="{
              selected: isQuestionType(question, 'multiple') ? isOptionSelected(question.studentAnser, 'D') : question.studentAnser === 'D',
              correct: isQuestionType(question, 'multiple') ? isOptionCorrect(question.answer, 'D') : question.answer === 'D',
              incorrect: isQuestionType(question, 'multiple') ? isOptionIncorrect(question.studentAnser, question.answer, 'D') : (question.studentAnser === 'D' && question.answer !== 'D')
            }">
              <span class="option-letter">D.</span>
              <span class="option-text" v-html="question._answerdHtml || question.answerd"></span>
            </div>
            <!-- 添加E选项 -->
            <div
              v-if="!isQuestionType(question, 'judge') && (question.answere || question._answereHtml || (question.answer && question.answer.includes('E')))"
              class="option" :class="{
                selected: isQuestionType(question, 'multiple') ? isOptionSelected(question.studentAnser, 'E') : question.studentAnser === 'E',
                correct: isQuestionType(question, 'multiple') ? isOptionCorrect(question.answer, 'E') : question.answer === 'E',
                incorrect: isQuestionType(question, 'multiple') ? isOptionIncorrect(question.studentAnser, question.answer, 'E') : (question.studentAnser === 'E' && question.answer !== 'E')
              }">
              <span class="option-letter">E.</span>
              <span class="option-text" v-html="question._answereHtml || question.answere || '选项E'"></span>
            </div>
            <!-- 添加F选项 -->
            <div
              v-if="!isQuestionType(question, 'judge') && (question.answerf || question._answerfHtml || (question.answer && question.answer.includes('F')))"
              class="option" :class="{
                selected: isQuestionType(question, 'multiple') ? isOptionSelected(question.studentAnser, 'F') : question.studentAnser === 'F',
                correct: isQuestionType(question, 'multiple') ? isOptionCorrect(question.answer, 'F') : question.answer === 'F',
                incorrect: isQuestionType(question, 'multiple') ? isOptionIncorrect(question.studentAnser, question.answer, 'F') : (question.studentAnser === 'F' && question.answer !== 'F')
              }">
              <span class="option-letter">F.</span>
              <span class="option-text" v-html="question._answerfHtml || question.answerf || '选项F'"></span>
            </div>
            <!-- 添加G选项 -->
            <div
              v-if="!isQuestionType(question, 'judge') && (question.answerg || question._answergHtml || (question.answer && question.answer.includes('G')))"
              class="option" :class="{
                selected: isQuestionType(question, 'multiple') ? isOptionSelected(question.studentAnser, 'G') : question.studentAnser === 'G',
                correct: isQuestionType(question, 'multiple') ? isOptionCorrect(question.answer, 'G') : question.answer === 'G',
                incorrect: isQuestionType(question, 'multiple') ? isOptionIncorrect(question.studentAnser, question.answer, 'G') : (question.studentAnser === 'G' && question.answer !== 'G')
              }">
              <span class="option-letter">G.</span>
              <span class="option-text" v-html="question._answergHtml || question.answerg || '选项G'"></span>
            </div>
            <!-- 添加H选项 -->
            <div
              v-if="!isQuestionType(question, 'judge') && (question.answerh || question._answerhHtml || (question.answer && question.answer.includes('H')))"
              class="option" :class="{
                selected: isQuestionType(question, 'multiple') ? isOptionSelected(question.studentAnser, 'H') : question.studentAnser === 'H',
                correct: isQuestionType(question, 'multiple') ? isOptionCorrect(question.answer, 'H') : question.answer === 'H',
                incorrect: isQuestionType(question, 'multiple') ? isOptionIncorrect(question.studentAnser, question.answer, 'H') : (question.studentAnser === 'H' && question.answer !== 'H')
              }">
              <span class="option-letter">H.</span>
              <span class="option-text" v-html="question._answerhHtml || question.answerh || '选项H'"></span>
            </div>
          </div>

          <!-- 学生答案显示（studentAnser 或 answerAttachmentUrl 有值则不显示未作答） -->
          <div class="student-answer-display">
            <div class="answer-info">
              <span class="answer-label">学生答案:</span>
              <span class="answer-value" v-html="hasStudentAnswer(question) ? (getStudentAnswerRaw(question) ? (isQuestionType(question, 'multiple') ?
                getStudentAnswerRaw(question).split(',').map(opt => opt.trim()).sort().join(', ') :
                (isQuestionType(question, 'judge') ? (getStudentAnswerRaw(question) === '1' ? '正确' : '错误') :
                  (question._studentAnswerHtml || getStudentAnswerRaw(question)))) :
                '已上传附件') :
                '未作答'
              "></span>
            </div>
            <div class="answer-info">
              <span class="answer-label">正确答案:</span>
              <span class="answer-value correct-answer" v-html="question.answer ? (isQuestionType(question, 'multiple')
                ?
                question.answer.split(',').map(opt => opt.trim()).sort().join(', ') :
                (isQuestionType(question, 'judge') ? (question.answer === '1' ? '正确' : '错误') : (question._answerHtml || question.answer))) :
                ''"></span>
            </div>
          </div>
          <div v-if="hasStudentAnswerAttachment(question)" class="student-attachment-display">
            <img v-if="question._studentAttachmentUrl" :src="question._studentAttachmentUrl" alt="学生上传附件" class="answer-img" />
            <a v-else :href="getImageUrl(question.answerAttachmentUrl)" target="_blank" rel="noopener" class="attachment-link">查看/下载附件</a>
          </div>
          <div v-if="question._answerImageUrl && !(question.answer && String(question.answer).includes('[img]'))" class="answer-attached-image">
            <img :src="question._answerImageUrl" alt="答案附图" class="answer-img" />
          </div>

          <!-- 填空题答案显示 -->
          <div v-if="isQuestionType(question, 'fillBlank')" class="fill-blank-answer">
            <div class="answer-item">
              <span class="answer-label">学生答案:</span>
              <span class="answer-value" v-html="question._studentAnswerHtml || getStudentAnswerRaw(question) || (hasStudentAnswerAttachment(question) ? '已上传附件' : '未作答')"></span>
            </div>
            <div v-if="hasStudentAnswerAttachment(question)" class="student-attachment-display">
              <img v-if="question._studentAttachmentUrl" :src="question._studentAttachmentUrl" alt="学生上传附件" class="answer-img" />
              <a v-else :href="getImageUrl(question.answerAttachmentUrl)" target="_blank" rel="noopener" class="attachment-link">查看/下载附件</a>
            </div>
            <div class="answer-item">
              <span class="answer-label">正确答案:</span>
              <span class="answer-value correct-answer" v-html="question._answerHtml || question.answer || ''"></span>
            </div>
          </div>

          <div class="question-divider"></div>
        </div>
      </div>

      <!-- 主观题部分 -->
      <div v-if="subjectiveQuestions.length > 0" class="question-section">
        <h3 class="section-title">主观题</h3>
        <div v-for="(question, index) in subjectiveQuestions" :key="'sub-' + index" class="question-item">
          <div class="question-header">
            <span class="question-number">{{ objectiveQuestions.length + index + 1 }}</span>
            <span class="question-type">{{ getQuestionTypeName(question.questionType) }}</span>
            <div class="question-text" v-html="question._questionContentHtml || question.questionContent"></div>
            <span class="question-score">{{ Number(question.questionScore) || 0 }}分</span>
          </div>
          <div v-if="question._attachedImageUrl" class="question-attached-image">
            <img :src="question._attachedImageUrl" alt="题干附图" class="attached-img" />
          </div>

          <div class="subjective-answer">
            <div class="answer-item">
              <span class="answer-label">学生答案:</span>
              <div class="answer-content" v-html="question._studentAnswerHtml || getStudentAnswerRaw(question) || (hasStudentAnswerAttachment(question) ? '已上传附件' : '未作答')"></div>
            </div>
            <div v-if="hasStudentAnswerAttachment(question)" class="student-attachment-display">
              <img v-if="question._studentAttachmentUrl" :src="question._studentAttachmentUrl" alt="学生上传附件" class="answer-img" />
              <a v-else :href="getImageUrl(question.answerAttachmentUrl)" target="_blank" rel="noopener" class="attachment-link">查看/下载附件</a>
            </div>
            <div class="answer-item">
              <span class="answer-label">标准答案:</span>
              <div class="answer-content" v-html="question._answerHtml || question.answer"></div>
            </div>
            <div v-if="question._answerImageUrl && !(question.answer && String(question.answer).includes('[img]'))" class="answer-attached-image">
              <img :src="question._answerImageUrl" alt="答案附图" class="answer-img" />
            </div>
            <div class="score-section">
              <div class="score-input-group">
                <span class="score-label">得分:</span>
                <!-- 只读模式或已判分：显示分数文本 -->
                <template v-if="readOnly || isQuestionGraded(question)">
                  <span class="score-display">{{ question.subjectiveScore || question.originalScore || 0 }}</span>
                </template>
                <!-- 可编辑：未判分时显示输入框 -->
                <input v-else type="number"
                  v-model="question.subjectiveScore" class="score-input" :min="0" :max="getMaxScore(question)"
                  placeholder="请输入分数" />
                <span class="max-score">/ {{ getMaxScore(question) }}分</span>
              </div>
              <!-- 非只读且未被判分时显示保存按钮 -->
              <button v-if="!readOnly && !isQuestionGraded(question)" class="save-score-btn"
                @click="handleSaveSubjectiveScore(question)"
                :disabled="!question.subjectiveScore || question.subjectiveScore < 0 || question.subjectiveScore > getMaxScore(question)">保存分数</button>
              <!-- 已判分显示已评分状态 -->
              <span v-else-if="isQuestionGraded(question)" class="scored-status">已评分</span>
            </div>
          </div>

          <div class="question-divider"></div>
        </div>
      </div>

      <!-- 批量保存成绩（整份试题下方，仅非只读且存在主观题时显示） -->
      <div v-if="!readOnly && subjectiveQuestions.length > 0" class="questions-footer">
        <button type="button" class="btn-save-all" @click="handleBatchSaveScore" :disabled="isBatchSaving || !hasSubjectiveScoreToSave">
          {{ isBatchSaving ? '保存中...' : '保存成绩' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { saveSubjectiveScore, updateScoreBatch, downloadFile } from "@/api/user";
import { getAllExamStations } from "@/api/examStation";
import { replaceImgPlaceholdersWithAuthAdvanced, fetchImageAsBlobUrl, getImageUrl } from '@/api/imageUpload.js';

// 定义props
const props = defineProps({
  currentStudent: {
    type: Object,
    required: true
  },
  currentExam: {
    type: Object,
    required: true
  },
  examTotal: {
    type: Object,
    required: true
  },
  examDetails: {
    type: [Array, Object],
    required: true
  },
  isLoadingQuestions: {
    type: Boolean,
    default: false
  },
  questionsError: {
    type: String,
    default: null
  },
  // 是否只读（管理员/考核站管理员查看时，不显示判分输入和保存按钮）
  readOnly: {
    type: Boolean,
    default: false
  }
});

// 定义emits
const emit = defineEmits(['goBack', 'retryFetchQuestions', 'updateTotalScore']);

// 面包屑：考核成绩 / 成绩列表 / 学生详情
const breadcrumbItems = computed(() => [
  { label: '考核成绩' },
  { label: '成绩列表', onClick: () => emit('goBack') },
  { label: '学生详情' }
]);

// 考核站相关状态
const examStations = ref([]);
const loadingExamStations = ref(false);

// 图片显示逻辑与组卷管理 PaperDetailView 一致：replaceImgPlaceholdersWithAuthAdvanced + fetchImageAsBlobUrl，请求带 Authorization 头

const processedObjectiveQuestions = ref([]);
const processedSubjectiveQuestions = ref([]);
const isBatchSaving = ref(false);

const processQuestionImagesForDisplayAsync = async (question) => {
  const processedQuestion = { ...question };
  const contentImages = question.question_content_images ?? question.questionContentImages ?? question.questionImages ?? '';
  if (question.questionContent) {
    processedQuestion._questionContentHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.questionContent, contentImages);
  }
  const optImages = question.option_images || question.optionImages || '';
  const optionFields = ['answera', 'answerb', 'answerc', 'answerd', 'answere', 'answerf', 'answerg', 'answerh', 'answeri', 'answerj'];
  for (const field of optionFields) {
    if (question[field]) processedQuestion[`_${field}Html`] = await replaceImgPlaceholdersWithAuthAdvanced(question[field], optImages);
  }
  const answerImages = question.answer_image ?? question.answerImage ?? '';
  if (question.answer) {
    processedQuestion._answerHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answer, answerImages);
  }
  const studentAns = question?.studentAnser ?? question?.studentAnswer ?? '';
  if (studentAns) processedQuestion._studentAnswerHtml = String(studentAns);

  // 题干附件图
  const attachedImg = question.attachedImage || question.attached_image;
  if (attachedImg) {
    try {
      const imgPath = Array.isArray(attachedImg) && attachedImg.length > 0
        ? (attachedImg[0].url || attachedImg[0])
        : attachedImg;
      if (typeof imgPath === 'string' && imgPath) {
        processedQuestion._attachedImageUrl = await fetchImageAsBlobUrl(imgPath);
      }
    } catch (e) {
      console.error('获取题干附件图失败:', e);
    }
  }

  // 答案附图：仅当答案正文不含 [img] 时单独展示
  const answerImg = question.answerImage || question.answer_image;
  if (answerImg) {
    try {
      const imgPath = Array.isArray(answerImg) && answerImg.length > 0
        ? (answerImg[0].url || answerImg[0])
        : answerImg;
      if (typeof imgPath === 'string' && imgPath) {
        processedQuestion._answerImageUrl = await fetchImageAsBlobUrl(imgPath);
      }
    } catch (e) {
      console.error('获取答案附图失败:', e);
    }
  }

  // 学生上传的附件（answerAttachmentUrl）
  const studentAttachment = question.answerAttachmentUrl;
  if (studentAttachment && typeof studentAttachment === 'string' && studentAttachment.trim()) {
    try {
      processedQuestion._studentAttachmentUrl = await fetchImageAsBlobUrl(studentAttachment.trim());
    } catch (e) {
      console.error('获取学生附件失败:', e);
      processedQuestion._studentAttachmentUrl = null;
    }
  }

  return processedQuestion;
};

const collectAndProcessQuestions = async () => {
  const details = props.examDetails;
  if (!details) {
    processedObjectiveQuestions.value = [];
    processedSubjectiveQuestions.value = [];
    return;
  }
  const objectiveList = [];
  const subjectiveList = [];
  const pushObjective = async (arr) => {
    if (!arr || !Array.isArray(arr)) return;
    const processed = await Promise.all(arr.map(q => processQuestionImagesForDisplayAsync(q)));
    objectiveList.push(...processed);
  };
  const pushSubjective = async (arr) => {
    if (!arr || !Array.isArray(arr)) return;
    const processed = await Promise.all(arr.map(q => processQuestionImagesForDisplayAsync(q)));
    subjectiveList.push(...processed);
  };
  if (typeof details === 'object' && !Array.isArray(details)) {
    await pushObjective(details.singleChoice);
    await pushObjective(details.multiChoice);
    await pushObjective(details.decide);
    await pushObjective(details.fillBank);
    await pushSubjective(details.shortAnswer);
    await pushSubjective(details.comprehensive);
  } else if (Array.isArray(details)) {
    const obj = details.filter(q => q.questionType === '0' || q.questionType === '1' || q.questionType === '2' || q.questionType === '3');
    const sub = details.filter(q => q.questionType === '4' || q.questionType === '5');
    await pushObjective(obj);
    await pushSubjective(sub);
  }
  processedObjectiveQuestions.value = objectiveList.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  processedSubjectiveQuestions.value = subjectiveList.sort((a, b) => (a.sort || 0) - (b.sort || 0));
};

watch(() => props.examDetails, () => { collectAndProcessQuestions(); }, { immediate: true });

const objectiveQuestions = computed(() => processedObjectiveQuestions.value);
const subjectiveQuestions = computed(() => processedSubjectiveQuestions.value);

// 是否存在可批量保存的主观题得分（已填写且有效的分数）
const hasSubjectiveScoreToSave = computed(() => {
  return subjectiveQuestions.value.some((q) => {
    const score = q.subjectiveScore;
    if (score === null || score === undefined || score < 0) return false;
    const maxScore = Number(q.questionScore) || 0;
    return score <= maxScore;
  });
});

// 计算客观题总分
const objectiveQuestionsTotalScore = computed(() => {
  const total = objectiveQuestions.value.reduce((sum, q) => sum + (Number(q.questionScore) || 0), 0)
  return total
});

// 计算主观题总分
const subjectiveQuestionsTotalScore = computed(() => {
  // 严格按接口字段 questionScore 统计
  const total = subjectiveQuestions.value.reduce((sum, q) => sum + (Number(q.questionScore) || 0), 0)
  return total
});

// 计算当前客观题得分
const currentObjectiveScore = computed(() => {
  return objectiveQuestions.value.reduce((total, question) => {
    if (isQuestionType(question, 'multiple')) {
      // 多选题：答案完全匹配才得分
      const studentAnswer = (question.studentAnser || '').split(',').map(opt => opt.trim()).sort().join(',');
      const correctAnswer = (question.answer || '').split(',').map(opt => opt.trim()).sort().join(',');
      return total + (studentAnswer === correctAnswer ? (Number(question.questionScore) || 0) : 0);
    } else {
      // 单选题、判断题、填空题：答案完全匹配才得分
      return total + (question.studentAnser === question.answer ? (Number(question.questionScore) || 0) : 0);
    }
  }, 0);
});

// 计算当前主观题得分
const currentSubjectiveScore = computed(() => {
  return subjectiveQuestions.value.reduce((total, question) => {
    // 主观题得分需要老师评分，这里暂时返回0
    return total + (question.subjectiveScore || question.originalScore || 0);
  }, 0);
});

// 计算总分：客观题得分 + 主观题得分
const totalScore = computed(() => {
  return currentObjectiveScore.value + currentSubjectiveScore.value;
});

// 获取题型名称
const getQuestionTypeName = questionType => {
  // 根据新的数据结构，questionType是字符串类型
  const typeMap = {
    '0': "填空题",
    '1': "单选题",
    '2': "多选题",
    '3': "判断题",
    '4': "简答题",
    '5': "综合题"
  };
  return typeMap[questionType] || "未知题型";
};

// 辅助函数：判断问题类型是否为指定类型（支持数字和字符串）
const isQuestionType = (question, type) => {
  const questionType = question.questionType;

  // 根据新的数据结构，questionType是字符串类型
  const typeMap = {
    'fillBlank': '0',
    'single': '1',
    'multiple': '2',
    'judge': '3',
    'essay': '4',
    'summary': '5'
  };

  return questionType === typeMap[type];
};

// 获取最大分数限制
const getMaxScore = question => Number(question.questionScore) || 0;

// 判断主观题是否已被判过分
// 使用专门的 isGraded 字段来判断（0-未判分，1-已判分）
const isQuestionGraded = (question) => {
  // 判断是否是主观题类型（简答题或综合题）
  const isSubjective = question.questionType === '4' || question.questionType === '5' 
    || question.questionType === '简答题' || question.questionType === '综合题'
    || question.questionSubType === 'essay' || question.questionSubType === 'summary';
  
  if (!isSubjective) {
    return false; // 客观题不需要这个判断
  }
  
  // 使用专门的 isGraded 字段判断（1表示已判分，0或null表示未判分）
  return question.isGraded === 1 || question.is_graded === 1;
};

// 获取学生答案原始值（接口返回 studentAnser，兼容 studentAnswer）
const getStudentAnswerRaw = (question) => {
  const v = question?.studentAnser ?? question?.studentAnswer ?? '';
  return (v !== null && v !== undefined) ? String(v).trim() : '';
};

// 是否有学生上传的附件（answerAttachmentUrl 为学生上传的附件）
const hasStudentAnswerAttachment = (question) => {
  const url = question?.answerAttachmentUrl ?? '';
  return typeof url === 'string' && url.trim() !== '';
};

// 是否有学生作答（文本或附件任一即可）
const hasStudentAnswer = (question) => getStudentAnswerRaw(question) || hasStudentAnswerAttachment(question);

// 判断选项是否被选中（用于多选题）
const isOptionSelected = (studentAnswer, option) => {
  if (!studentAnswer) return false;
  return studentAnswer.includes(option);
};

// 判断选项是否正确（用于多选题）
const isOptionCorrect = (correctAnswer, option) => {
  if (!correctAnswer) return false;
  return correctAnswer.includes(option);
};

// 判断选项是否错误（用于多选题）
const isOptionIncorrect = (studentAnswer, correctAnswer, option) => {
  if (!studentAnswer || !correctAnswer) return false;
  return studentAnswer.includes(option) && !correctAnswer.includes(option);
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

// 组件挂载时获取考核站列表
onMounted(async () => {
  await fetchExamStations();
});

// 返回按钮事件
const goBack = () => {
  emit('goBack');
};

// 重试获取题目
const retryFetchQuestions = () => {
  emit('retryFetchQuestions');
};



// 保存主观题分数
const handleSaveSubjectiveScore = async question => {
  if (!question.id || !props.currentStudent || !props.currentExam) {
    ElMessage.warning("无法保存分数，请检查题目、学生或考试信息");
    return;
  }

  const score = question.subjectiveScore;
  if (score === null || score === undefined || score < 0) {
    ElMessage.warning("分数不能为空或小于0");
    return;
  }

  // 检查分数是否超过限制
  const maxScore = getMaxScore(question);
  if (score > maxScore) {
    ElMessage.warning(`分数不能超过${maxScore}分`);
    return;
  }

  try {
    // 优先使用 examId，如果没有则使用 id（兼容性处理）
    const examId = props.currentExam.examId || props.currentExam.id;
    const params = {
      id: question.id,
      score: score,
      studentId: props.currentStudent.employeeId,
      examId: examId
    };

    const response = await saveSubjectiveScore(params);

    if (response && response.code === 200) {
      ElMessage.success("主观题分数保存成功");

      // 计算分数差值
      const oldScore = question.originalScore || 0; // 保存前的分数
      const scoreDiff = score - oldScore; // 分数差值

      // 更新题目分数
      question.subjectiveScore = score;
      question.originalScore = score; // 更新原始分数记录
      question.score = score; // 更新score字段
      // 设置已判分标记
      question.isGraded = 1;
      question.is_graded = 1; // 兼容下划线命名

      // 通知父组件更新总分
      emit('updateTotalScore', scoreDiff);
    } else {
      // 如果返回错误信息中包含"已被其他阅卷人判卷"的提示
      if (response && response.msg && response.msg.includes('已被其他阅卷人判卷')) {
        ElMessage.warning(response.msg || "该题目已被判卷");
        // 重新获取题目数据以获取最新的分数
        emit('retryFetchQuestions');
      } else {
        throw new Error(response?.msg || "保存主观题分数失败");
      }
    }
  } catch (err) {
    console.error("保存主观题分数失败:", err);
    ElMessage.error("保存失败，请重试");
  }
};

// 批量保存成绩（整份试题下方「保存成绩」按钮）
const handleBatchSaveScore = async () => {
  if (!props.currentStudent || !props.currentExam) {
    ElMessage.warning("无法保存成绩，请检查学生或考试信息");
    return;
  }
  const examId = props.currentExam.examId || props.currentExam.id;
  const studentId = props.currentStudent.employeeId;
  const list = [];
  for (const q of subjectiveQuestions.value) {
    const score = q.subjectiveScore;
    if (score === null || score === undefined || score < 0) continue;
    const maxScore = Number(q.questionScore) || 0;
    if (score > maxScore) continue;
    if (!q.id) continue;
    list.push({
      id: q.id,
      score: Number(score),
      studentId,
      examId: Number(examId),
    });
  }
  if (list.length === 0) {
    ElMessage.warning("请先填写要保存的主观题分数");
    return;
  }
  isBatchSaving.value = true;
  try {
    const response = await updateScoreBatch(list);
    if (response && response.code === 200) {
      let scoreDiff = 0;
      for (const item of list) {
        const q = subjectiveQuestions.value.find((x) => x.id === item.id);
        if (q) {
          const oldScore = q.originalScore || 0;
          scoreDiff += item.score - oldScore;
          q.subjectiveScore = item.score;
          q.originalScore = item.score;
          q.score = item.score;
          q.isGraded = 1;
          q.is_graded = 1;
        }
      }
      ElMessage.success("成绩保存成功");
      emit("updateTotalScore", scoreDiff);
    } else {
      if (response && response.msg && response.msg.includes("已被其他阅卷人判卷")) {
        ElMessage.warning(response.msg || "部分题目已被判卷");
        emit("retryFetchQuestions");
      } else {
        throw new Error(response?.msg || "批量保存成绩失败");
      }
    }
  } catch (err) {
    console.error("批量保存成绩失败:", err);
    ElMessage.error(err.message || "保存失败，请重试");
  } finally {
    isBatchSaving.value = false;
  }
};
</script>

<style scoped>
.content-container {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
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

/* 考试信息头部 */
.exam-info-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #eee;
  justify-content: space-between;
  align-items: center;
}

.info-section {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.student-info-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background-color: #f0f8ff;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.info-label {
  color: #666;
  margin-right: 5px;
}

.info-value {
  font-weight: 500;
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

/* 题目列表样式 */
.questions-container {
  padding: 15px;
}

.question-section {
  margin-bottom: 30px;
}

.section-title {
  color: #1890ff;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #1890ff;
}

.question-item {
  margin-bottom: 20px;
}

.question-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.question-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #1890ff;
  color: white;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 14px;
}

.question-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  padding: 2px 8px;
  margin-right: 10px;
  font-size: 12px;
}

.question-text {
  flex: 1;
  line-height: 1.5;
}

.question-score {
  background: #f0f0f0;
  color: #333;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #ddd;
  margin-left: 10px;
  white-space: nowrap;
}

.question-options {
  margin-left: 34px;
  margin-bottom: 10px;
}

.option {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 5px;
  border-radius: 4px;
}

.option.selected:not(.correct) {
  background-color: #fff1f0;
}

.option.selected.incorrect {
  background-color: #fff1f0;
}

.option.selected {
  background-color: #fff1f0;
}

.option.correct {
  background-color: #f6ffed;
}

.option.selected.correct {
  background-color: #d9f7be;
}

.option-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 10px;
  font-weight: 500;
}

.option.selected:not(.correct) .option-letter {
  background-color: #ff4d4f;
  color: white;
}

.option.selected .option-letter {
  background-color: #1890ff;
  color: white;
}

.option.correct .option-letter {
  background-color: #52c41a;
  color: white;
}

.fill-blank-answer,
.subjective-answer {
  margin-left: 34px;
  margin-bottom: 10px;
}

.answer-item {
  margin-bottom: 8px;
}

.answer-label {
  color: #666;
  font-weight: 500;
  margin-right: 8px;
}

.answer-value {
  color: #333;
}

.answer-content {
  margin-top: 5px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.question-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 15px 0;
}

.questions-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
  text-align: center;
}

.btn-save-all {
  background-color: #c70019;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 24px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-save-all:hover:not(:disabled) {
  background-color: #a30014;
}

.btn-save-all:disabled {
  background-color: #d9d9d9;
  color: #999;
  cursor: not-allowed;
}

.back-button-container {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 顶部返回按钮样式 */
.top-back-button {
  padding: 12px 16px;
  border-top: none;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border-color: #dcdfe6;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #ebebeb;
}

.btn-primary {
  background-color: #c70019;
  color: white;
}

.btn-primary:hover {
  background-color: #a7aaad;
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
  background-color: #c70019;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 30px 0;
}

.error-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 34px;
  margin-bottom: 10px;
  color: #ff4d4f;
  font-size: 14px;
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #ff4d4f;
  color: white;
  margin-right: 5px;
  font-size: 12px;
}

.student-answer-display {
  margin-left: 34px;
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
}

.question-attached-image {
  margin-top: 10px;
  margin-left: 34px;
}

.question-attached-image .attached-img,
.answer-attached-image .answer-img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.answer-attached-image {
  margin-top: 10px;
  margin-left: 34px;
}

.student-attachment-display {
  margin-top: 10px;
  margin-left: 34px;
}
.student-attachment-display .answer-img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}
.attachment-link {
  color: #409eff;
  text-decoration: none;
}
.attachment-link:hover {
  text-decoration: underline;
}

.answer-info {
  display: flex;
  align-items: center;
}

.answer-label {
  color: #666;
  font-weight: 500;
  margin-right: 8px;
}

.answer-value {
  color: #333;
}

.correct-answer {
  color: #52c41a;
  /* 绿色表示正确答案 */
  font-weight: 500;
}

.score-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #eee;
}

.score-input-group {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.score-label {
  font-size: 14px;
  color: #666;
}

.score-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.max-score {
  font-size: 14px;
  color: #999;
}

.save-score-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-score-btn:hover {
  background-color: #40a9ff;
}

.save-score-btn:disabled {
  background-color: #91d5ff;
  cursor: not-allowed;
  color: #fff;
}

.score-display {
  display: inline-block;
  width: 60px;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  color: #333;
  font-weight: 500;
}

.scored-status {
  font-size: 14px;
  color: #52c41a;
  font-weight: 500;
  margin-left: 10px;
}

.question-inline-image {
  display: inline-block;
  vertical-align: middle;
  max-width: 100%;
  height: auto;
  margin: 0 3px;
}
</style>
