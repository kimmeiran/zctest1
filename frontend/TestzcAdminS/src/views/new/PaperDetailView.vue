<template>
    <div class="paper-detail-view">
        <div class="breadcrumb-row">
            <BreadcrumbNav :items="breadcrumbItems" />
            <button type="button" class="btn-back" @click="$emit('goBack')">返回</button>
        </div>
        <!-- 试卷基本信息 -->
        <div class="exam-info-header">
            <div class="info-section">
                <div class="info-item">
                    <span class="info-label">组卷名称:</span>
                    <span class="info-value">{{ examInfo?.level }} - {{ examInfo?.jobType }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">创建时间:</span>
                    <span class="info-value">{{ examInfo?.createTime }}</span>
                </div>
            </div>

            <!-- 题型统计信息 -->
            <div class="question-type-summary">
                <h4>题型统计</h4>
                <div class="summary-grid">
                    <div class="summary-item" v-for="(summary, index) in questionTypeSummary" :key="index">
                        <div class="summary-type">{{ summary.type }}</div>
                        <div class="summary-count">{{ summary.count }}题</div>
                        <div class="summary-score">{{ summary.totalScore }}分</div>
                    </div>
                </div>
                <div class="summary-total">
                    <span class="total-label">总计:</span>
                    <span class="total-count">{{ totalQuestionCount }}题</span>
                    <span class="total-score">{{ totalScore }}分</span>
                </div>
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
            <button class="btn btn-primary retry-btn" @click="loadQuestions">重试</button>
        </div>

        <!-- 题目列表 -->
        <div v-else class="questions-container">
            <!-- 填空题 -->
            <div class="question-section">
                <h3 class="section-title">填空题</h3>
                <template v-if="groupedQuestions.fillBlank.length > 0">
                    <div v-for="(q, idx) in groupedQuestions.fillBlank" :key="q.id" class="question-item">
                        <div class="question-header-inline">
                            <span class="question-number">{{ idx + 1 }}.</span>
                            <span class="question-text">
                                <span v-html="q._questionContentHtml || q.questionContent"></span>
                            </span>
                            <span class="question-score">({{ q.score || 0 }}分)</span>
                        </div>
                        <div v-if="q._attachedImageUrl" class="question-attached-image">
                            <img :src="q._attachedImageUrl" alt="题干附图" class="attached-img" />
                        </div>
                        <div class="question-answer">
                            <span class="answer-label">答案：</span>
                            <span class="answer-content" v-html="q._answerHtml || q.answer || '暂无答案'"></span>
                        </div>
                        <div v-if="q._answerImageUrl && !(q.answer && String(q.answer).includes('[img]'))" class="answer-attached-image">
                            <img :src="q._answerImageUrl" alt="答案附图" class="answer-img" />
                        </div>
                        <div class="question-divider"></div>
                    </div>
                </template>
                <template v-else>
                    <div class="no-data">暂无此类题目</div>
                </template>
            </div>

            <!-- 单选题 -->
            <div class="question-section">
                <h3 class="section-title">单项选择题</h3>
                <template v-if="groupedQuestions.singleChoice.length > 0">
                    <div v-for="(q, idx) in groupedQuestions.singleChoice" :key="q.id" class="question-item">
                        <div class="question-header-inline">
                            <span class="question-number">{{ idx + 1 }}.</span>
                            <span class="question-text">
                                <span v-html="q._questionContentHtml || q.questionContent"></span>
                            </span>
                            <span class="question-score">({{ q.score || 0 }}分)</span>
                        </div>
                        <div v-if="q._attachedImageUrl" class="question-attached-image">
                            <img :src="q._attachedImageUrl" alt="题干附图" class="attached-img" />
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
                        <div v-if="q._answerImageUrl && !(q.answer && String(q.answer).includes('[img]'))" class="answer-attached-image">
                            <img :src="q._answerImageUrl" alt="答案附图" class="answer-img" />
                        </div>
                        <div class="question-divider"></div>
                    </div>
                </template>
                <template v-else>
                    <div class="no-data">暂无此类题目</div>
                </template>
            </div>

            <!-- 多选题 -->
            <div class="question-section">
                <h3 class="section-title">多项选择题</h3>
                <template v-if="groupedQuestions.multiChoice.length > 0">
                    <div v-for="(q, idx) in groupedQuestions.multiChoice" :key="q.id" class="question-item">
                        <div class="question-header-inline">
                            <span class="question-number">{{ idx + 1 }}.</span>
                            <span class="question-text">
                                <span v-html="q._questionContentHtml || q.questionContent"></span>
                            </span>
                            <span class="question-score">({{ q.score || 0 }}分)</span>
                        </div>
                        <div v-if="q._attachedImageUrl" class="question-attached-image">
                            <img :src="q._attachedImageUrl" alt="题干附图" class="attached-img" />
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
                        <div v-if="q._answerImageUrl && !(q.answer && String(q.answer).includes('[img]'))" class="answer-attached-image">
                            <img :src="q._answerImageUrl" alt="答案附图" class="answer-img" />
                        </div>
                        <div class="question-divider"></div>
                    </div>
                </template>
                <template v-else>
                    <div class="no-data">暂无此类题目</div>
                </template>
            </div>

            <!-- 判断题 -->
            <div class="question-section">
                <h3 class="section-title">判断题</h3>
                <template v-if="groupedQuestions.decide.length > 0">
                    <div v-for="(q, idx) in groupedQuestions.decide" :key="q.id" class="question-item">
                        <div class="question-header-inline">
                            <span class="question-number">{{ idx + 1 }}.</span>
                            <span class="question-text">
                                <span v-html="q._questionContentHtml || q.questionContent"></span>
                            </span>
                            <span class="question-score">({{ q.score || 0 }}分)</span>
                        </div>
                        <div v-if="q._attachedImageUrl" class="question-attached-image">
                            <img :src="q._attachedImageUrl" alt="题干附图" class="attached-img" />
                        </div>
                        <div class="question-answer">
                            <span class="answer-label">答案：</span>
                            <span class="answer-content">{{ q.answer === '1' ? '正确' : q.answer === '0' ? '错误' :
                                (q._answerHtml || q.answer || '暂无答案') }}</span>
                        </div>
                        <div v-if="q._answerImageUrl && !(q.answer && String(q.answer).includes('[img]'))" class="answer-attached-image">
                            <img :src="q._answerImageUrl" alt="答案附图" class="answer-img" />
                        </div>
                        <div class="question-divider"></div>
                    </div>
                </template>
                <template v-else>
                    <div class="no-data">暂无此类题目</div>
                </template>
            </div>

            <!-- 简答题 -->
            <div class="question-section">
                <h3 class="section-title">简答题</h3>
                <template v-if="groupedQuestions.shortAnswer.length > 0">
                    <div v-for="(q, idx) in groupedQuestions.shortAnswer" :key="q.id" class="question-item">
                        <div class="question-header-inline">
                            <span class="question-number">{{ idx + 1 }}.</span>
                            <span class="question-text">
                                <span v-html="q._questionContentHtml || q.questionContent"></span>
                            </span>
                            <span class="question-score">({{ q.score || 0 }}分)</span>
                        </div>
                        <div v-if="q._attachedImageUrl" class="question-attached-image">
                            <img :src="q._attachedImageUrl" alt="题干附图" class="attached-img" />
                        </div>
                        <div class="question-answer">
                            <span class="answer-label">答案：</span>
                            <span class="answer-content" v-html="q._answerHtml || q.answer || '暂无答案'"></span>
                        </div>
                        <div v-if="q._answerImageUrl && !(q.answer && String(q.answer).includes('[img]'))" class="answer-attached-image">
                            <img :src="q._answerImageUrl" alt="答案附图" class="answer-img" />
                        </div>
                        <div class="question-divider"></div>
                    </div>
                </template>
                <template v-else>
                    <div class="no-data">暂无此类题目</div>
                </template>
            </div>

            <!-- 综合题 -->
            <div class="question-section">
                <h3 class="section-title">综合题</h3>
                <template v-if="groupedQuestions.comprehensive.length > 0">
                    <div v-for="(q, idx) in groupedQuestions.comprehensive" :key="q.id" class="question-item">
                        <div class="question-header-inline">
                            <span class="question-number">{{ idx + 1 }}.</span>
                            <span class="question-text">
                                <span v-html="q._questionContentHtml || q.questionContent"></span>
                            </span>
                            <span class="question-score">({{ q.score || 0 }}分)</span>
                        </div>
                        <div v-if="q._attachedImageUrl" class="question-attached-image">
                            <img :src="q._attachedImageUrl" alt="题干附图" class="attached-img" />
                        </div>
                        <div class="question-answer">
                            <span class="answer-label">答案：</span>
                            <span class="answer-content" v-html="q._answerHtml || q.answer || '暂无答案'"></span>
                        </div>
                        <div v-if="q._answerImageUrl && !(q.answer && String(q.answer).includes('[img]'))" class="answer-attached-image">
                            <img :src="q._answerImageUrl" alt="答案附图" class="answer-img" />
                        </div>
                        <div class="question-divider"></div>
                    </div>
                </template>
                <template v-else>
                    <div class="no-data">暂无此类题目</div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'
import { getAllExamPaperByExamPaper } from '@/api/user'
import { replaceImgPlaceholdersWithAuthAdvanced, fetchImageAsBlobUrl } from '@/api/imageUpload.js'

// 将接口返回的 JSON 字符串解析为数组（question_content_images、answer_image 可能为 "[{...}]" 字符串）
const parseImageField = (value) => {
    if (value == null) return value
    if (Array.isArray(value)) return value
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    if (!trimmed || !trimmed.startsWith('[')) return value
    try {
        const arr = JSON.parse(value)
        return Array.isArray(arr) ? arr : value
    } catch {
        return value
    }
}

// 归一化题目图片字段：JSON 字符串转为数组（含 attached_image），便于取 [0].url 及替换 [img]
const normalizeQuestionImageFields = (q) => {
    if (!q || typeof q !== 'object') return q
    const attachedImgs = parseImageField(q.attached_image ?? q.attachedImage)
    if (Array.isArray(attachedImgs)) {
        q.attached_image = attachedImgs
        q.attachedImage = attachedImgs
    } else if (!q.attachedImage && q.attached_image) {
        q.attachedImage = q.attached_image
    }
    const contentImgs = parseImageField(q.question_content_images ?? q.questionContentImages ?? q.questionImages)
    if (Array.isArray(contentImgs)) {
        q.question_content_images = contentImgs
    }
    const answerImgs = parseImageField(q.answer_image ?? q.answerImage)
    if (Array.isArray(answerImgs)) {
        q.answer_image = answerImgs
        q.answerImage = answerImgs
    } else if (!q.answerImage && q.answer_image) {
        q.answerImage = q.answer_image
    }
    return q
}

// 定义props
const props = defineProps({
    paperDetail: {
        type: Object,
        required: true
    }
})

// 定义emits
const emit = defineEmits(['goBack'])

// 面包屑：组卷管理 / 试卷列表 / 试卷详情
const breadcrumbItems = computed(() => [
  { label: '组卷管理' },
  { label: '试卷列表', onClick: () => emit('goBack') },
  { label: '试卷详情' }
])

// 组件内部状态
const questions = ref([])
const examInfo = ref(null)
const isLoading = ref(false)
const error = ref('')

// 图片请求使用 replaceImgPlaceholdersWithAuthAdvanced，支持 JSON 数组或 CSV，发请求时带 Authorization 头

// 处理题目中的图片占位符及题干附件图、答案附图（与 QuestionTable 一致，带 Authorization 请求）
const processQuestionImages = async (question) => {
  const processedQuestion = { ...question }

  const contentImages = question.question_content_images ?? question.questionContentImages ?? question.questionImages ?? ''
  if (question.questionContent) {
    processedQuestion._questionContentHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.questionContent, contentImages)
  }
  const optImages = question.option_images || question.optionImages || ''
  if (question.answera) processedQuestion._answeraHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answera, optImages)
  if (question.answerb) processedQuestion._answerbHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answerb, optImages)
  if (question.answerc) processedQuestion._answercHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answerc, optImages)
  if (question.answerd) processedQuestion._answerdHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answerd, optImages)
  if (question.answere) processedQuestion._answereHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answere, optImages)
  if (question.answerf) processedQuestion._answerfHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answerf, optImages)
  if (question.answerg) processedQuestion._answergHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answerg, optImages)

  const answerImages = question.answer_image ?? question.answerImage ?? ''
  if (question.answer) {
    processedQuestion._answerHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answer, answerImages)
  }

  // 题干附件图：取第一张的 url 请求为 blob 显示
  const attachedImg = question.attachedImage || question.attached_image
  if (attachedImg) {
    try {
      const imgPath = Array.isArray(attachedImg) && attachedImg.length > 0
        ? (attachedImg[0].url || attachedImg[0])
        : attachedImg
      if (typeof imgPath === 'string' && imgPath) {
        processedQuestion._attachedImageUrl = await fetchImageAsBlobUrl(imgPath)
      }
    } catch (e) {
      console.error('获取题干附件图失败:', e)
    }
  }

  // 答案附图：取第一张的 url；仅当答案正文不含 [img] 时在模板中单独展示，避免与 _answerHtml 内图重复
  const answerImg = question.answerImage || question.answer_image
  if (answerImg) {
    try {
      const imgPath = Array.isArray(answerImg) && answerImg.length > 0
        ? (answerImg[0].url || answerImg[0])
        : answerImg
      if (typeof imgPath === 'string' && imgPath) {
        processedQuestion._answerImageUrl = await fetchImageAsBlobUrl(imgPath)
      }
    } catch (e) {
      console.error('获取答案附图失败:', e)
    }
  }

  return processedQuestion
}

// 加载题目数据
const loadQuestions = async () => {
    try {
        isLoading.value = true
        error.value = ''

        const response = await getAllExamPaperByExamPaper(props.paperDetail.id)

        if (response && response.code === 200 && response.data) {
            // API 返回的数据结构是 { exam: {...}, singleChoice: [...], multiChoice: [...], ... }
            const apiData = response.data

            // 保存试卷信息
            if (apiData.exam) {
                examInfo.value = apiData.exam
            }

            // 提取所有题目并合并到一个数组中
            const allQuestions = []

            // 归一化题目图片字段（JSON 字符串→数组）后处理 [img] 占位符与图片路径
            const processOne = async (q, questionType) => {
                const normalized = normalizeQuestionImageFields({ ...q, questionType })
                return processQuestionImages(normalized)
            }
            if (apiData.singleChoice && Array.isArray(apiData.singleChoice)) {
                const arr = await Promise.all(apiData.singleChoice.map(q => processOne(q, 'singleChoice')))
                allQuestions.push(...arr)
            }
            if (apiData.multiChoice && Array.isArray(apiData.multiChoice)) {
                const arr = await Promise.all(apiData.multiChoice.map(q => processOne(q, 'multiChoice')))
                allQuestions.push(...arr)
            }
            if (apiData.decide && Array.isArray(apiData.decide)) {
                const arr = await Promise.all(apiData.decide.map(q => processOne(q, 'decide')))
                allQuestions.push(...arr)
            }
            if (apiData.fillBlank && Array.isArray(apiData.fillBlank)) {
                const arr = await Promise.all(apiData.fillBlank.map(q => processOne(q, 'fillBlank')))
                allQuestions.push(...arr)
            }
            if (apiData.fillBank && Array.isArray(apiData.fillBank)) {
                const arr = await Promise.all(apiData.fillBank.map(q => processOne(q, 'fillBlank')))
                allQuestions.push(...arr)
            }
            if (apiData.shortAnswer && Array.isArray(apiData.shortAnswer)) {
                const arr = await Promise.all(apiData.shortAnswer.map(q => processOne(q, 'shortAnswer')))
                allQuestions.push(...arr)
            }
            if (apiData.comprehensive && Array.isArray(apiData.comprehensive)) {
                const arr = await Promise.all(apiData.comprehensive.map(q => processOne(q, 'comprehensive')))
                allQuestions.push(...arr)
            }

            questions.value = allQuestions
        } else {
            throw new Error(response?.msg || '获取试卷题目失败')
        }
    } catch (err) {
        error.value = err.message || '获取试卷题目失败，请稍后重试'
        questions.value = [] // 确保错误时设置为空数组
    } finally {
        isLoading.value = false
    }
}

// 组件挂载时加载数据
onMounted(() => {
    loadQuestions()
})

// 获取题目子类型
const getQuestionSubType = (q) => {
    // 如果题目类型是字符串，直接返回
    if (typeof q.questionType === "string") {
        switch (q.questionType) {
            case "singleChoice":
                return "singleChoice";
            case "multiChoice":
                return "multiChoice";
            case "decide":
                return "decide";
            case "fillBlank":
                return "fillBlank";
            case "fillBank":
                return "fillBlank";
            case "shortAnswer":
                return "shortAnswer";
            case "comprehensive":
                return "comprehensive";
        }
    }

    // 兼容数字类型的题目类型（如果还有的话）
    switch (q.questionType) {
        case 0:
            return "singleChoice";
        case 1:
            return "multiChoice";
        case 2:
            return "decide";
        case 3:
            return "fillBlank";
        case 4:
            return "shortAnswer";
        case 5:
            return "comprehensive";
        default:
            return "singleChoice";
    }
}

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

    // 确保 questions.value 是一个数组
    if (!Array.isArray(questions.value)) {
        return groups;
    }

    questions.value.forEach((q, index) => {
        const type = getQuestionSubType(q);
        if (groups[type]) {
            groups[type].push(q);
        }
    });

    return groups;
});

// 题型统计信息
const questionTypeSummary = computed(() => {
    const summary = [];
    const typeMap = {
        singleChoice: "单项选择题",
        multiChoice: "多项选择题",
        decide: "判断题",
        fillBlank: "填空题",
        shortAnswer: "简答题",
        comprehensive: "综合题"
    };

    Object.entries(groupedQuestions.value).forEach(([key, questionList]) => {
        if (questionList.length > 0) {
            // 计算实际分数，如果题目有score字段则使用，否则使用默认分值
            const totalScore = questionList.reduce((sum, q) => sum + (q.score || 0), 0);
            summary.push({
                type: typeMap[key],
                count: questionList.length,
                totalScore: totalScore
            });
        }
    });

    return summary;
});

// 总题目数和总分
const totalQuestionCount = computed(() => {
    return questionTypeSummary.value.reduce((total, item) => total + item.count, 0);
});

const totalScore = computed(() => {
    return questionTypeSummary.value.reduce((total, item) => total + item.totalScore, 0);
});
</script>

<style scoped>
.paper-detail-view {
    padding: 20px;
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

.back-button-container {
    padding: 16px;
    border-top: 1px solid #f0f0f0;
}

.top-back-button {
    padding: 12px 16px;
    border-top: none;
    border-bottom: 1px solid #f0f0f0;
    background-color: #fafafa;
}

/* 优化返回按钮样式，使其更明显 */
.top-back-button .btn-secondary {
    background-color: #ffffff;
    color: #c70019;
    border: 2px solid #c70019;
    font-weight: 500;
    padding: 10px 20px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(199, 0, 25, 0.1);
}

.top-back-button .btn-secondary:hover:not(:disabled) {
    background-color: #c70019;
    color: #ffffff;
    box-shadow: 0 4px 8px rgba(199, 0, 25, 0.2);
    transform: translateY(-1px);
}

.btn {
    padding: 8px 16px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.btn-secondary {
    background-color: #f5f5f5;
    color: #333;
    border-color: #dcdfe6;
}

.btn-primary {
    background-color: #c70019;
    color: white;
}

.btn-primary:hover {
    background-color: #66b1ff;
}

.exam-info-header {
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border: 1px solid #ebeef5;
}

.info-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.info-item {
    display: flex;
    margin-bottom: 8px;
}

.info-label {
    width: 100px;
    color: #606266;
    font-weight: 500;
}

.info-value {
    color: #303133;
    font-weight: 500;
}

.question-type-summary {
    margin-top: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.question-type-summary h4 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
}

.summary-item {
    background-color: white;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #dee2e6;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-type {
    font-weight: 600;
    color: #333;
    font-size: 14px;
    margin-bottom: 8px;
}

.summary-count,
.summary-score {
    font-size: 13px;
    color: #666;
    margin: 2px 0;
}

.summary-score {
    color: #28a745;
    font-weight: 500;
}

.summary-total {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    padding: 12px;
    background-color: #e9ecef;
    border-radius: 4px;
    border: 1px solid #ced4da;
}

.total-label {
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.total-count,
.total-score {
    font-size: 14px;
    color: #666;
    font-weight: 500;
}

.total-score {
    color: #28a745;
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
    border-top: 4px solid #c70019;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
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
    padding: 40px;
    color: #ff4d4f;
}

.retry-btn {
    margin-top: 10px;
}

.questions-container {
    margin-bottom: 20px;
}

.question-section {
    margin-bottom: 30px;
}

.section-title {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
    padding: 10px 0;
    border-bottom: 2px solid #e9ecef;
}

.question-item {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    background-color: #fafafa;
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

.question-attached-image {
    margin-top: 10px;
}
.question-attached-image .attached-img,
.answer-attached-image .answer-img {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
    vertical-align: middle;
}
.answer-attached-image {
    margin-top: 10px;
}

.question-divider {
    height: 1px;
    background-color: #e8e8e8;
    margin-top: 15px;
}

.no-data {
    text-align: center;
    color: #999;
    padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .paper-detail-view {
        padding: 15px;
    }

    .info-section {
        flex-direction: column;
        align-items: flex-start;
    }

    .summary-grid {
        grid-template-columns: 1fr;
    }

    .summary-total {
        flex-direction: column;
        gap: 10px;
    }
}

.question-inline-image {
    display: inline-block;
    vertical-align: middle;
    max-width: 100%;
    height: auto;
    margin: 0 3px;
}
</style>
