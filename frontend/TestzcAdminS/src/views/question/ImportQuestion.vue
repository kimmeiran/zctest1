<template>
  <div class="import-page">
    <div class="import-header">
      <div class="breadcrumb-row">
        <button type="button" class="btn-back" @click="$emit('back')">返回列表</button>
      </div>
      <div class="header-actions">
        <button class="preview-btn" @click="showPreviewModal" :disabled="!hasPreviewData">
          <span class="preview-icon">👁️</span> 预览试卷
        </button>
        <button class="submit-btn" @click="handleSubmit" :disabled="!canSubmit || isSubmitting">
          <span v-if="isSubmitting" class="loading-spinner"></span>
          <span v-else class="submit-icon">✓</span> 
          {{ isSubmitting ? '提交中...' : '提交' }}
        </button>
        <!-- 调试信息 -->
        <!-- <div class="debug-info">
          <div class="debug-item">
            <span class="debug-label">表单完成:</span>
            <span :class="['debug-value', formComplete ? 'debug-success' : 'debug-error']">
              {{ formComplete ? '✓' : '✗' }}
            </span>
          </div>
          <div class="debug-item">
            <span class="debug-label">题目导入:</span>
            <span :class="['debug-value', questionResult?.code === 200 ? 'debug-success' : 'debug-error']">
              {{ questionResult?.code === 200 ? '✓' : '✗' }}
            </span>
          </div>
          <div class="debug-item">
            <span class="debug-label">答案导入:</span>
            <span :class="['debug-value', answerResult?.code === 200 ? 'debug-success' : 'debug-error']">
              {{ answerResult?.code === 200 ? '✓' : '✗' }}
            </span>
          </div>
          <div class="debug-item">
            <span class="debug-label">可提交:</span>
            <span :class="['debug-value', canSubmit ? 'debug-success' : 'debug-error']">
              {{ canSubmit ? '✓' : '✗' }}
            </span>
          </div>
        </div> -->
      </div>
    </div>

    <!-- 表单信息 -->
    <div class="form-section">
      <h4>题库信息</h4>
      <div class="form-row">
        <!-- 题库名称 -->
        <div class="form-group">
          <label for="exam-name">题库名称 <span class="required">*</span></label>
          <input id="exam-name" type="text" class="form-input" v-model="formData.questionName"
            placeholder="请输入名称" />
        </div>
        <!-- 职业(工种) -->
        <div class="form-group">
          <label for="question-type">职业(工种) <span class="required">*</span></label>
          <select id="question-type" class="form-select" v-model="formData.questionType">
            <option value disabled selected>请选择职业(工种)</option>
            <option v-for="employeeType in employeeTypeOptions" :key="employeeType.id"
              :value="employeeType.name">
              {{ employeeType.name }}
            </option>
          </select>
        </div>
        <!-- 技能等级 -->
        <div class="form-group">
          <label for="difficulty">技能等级 <span class="required">*</span></label>
          <select id="difficulty" class="form-select" v-model="formData.difficulty">
            <option value disabled selected>请选择技能等级</option>
            <option v-for="level in levelOptions" :key="level.id" :value="level.name">{{ level.name }}
            </option>
          </select>
        </div>
        <!-- 题库类型：职业认定0/竞赛1/模拟考核2；考核站管理员不可选职业认定 -->
        <div class="form-group">
          <label for="question-bank-type">题库类型 <span class="required">*</span></label>
          <select id="question-bank-type" class="form-select" v-model.number="formData.questionBankType">
            <option :value="0" :disabled="isStationAdmin">职业认定</option>
            <option :value="1">竞赛</option>
            <option :value="2">模拟考核</option>
          </select>
        </div>
        <!-- 领域 -->
        <div class="form-group">
          <label for="domain">领域 <span class="required">*</span></label>
          <select id="domain" class="form-select" v-model="formData.domain">
            <option value disabled selected>请选择领域</option>
            <option :value="0">全部</option>
            <!-- <option :value="1">基础知识</option> -->
            <option :value="2">职业道德</option>
            <!-- <option :value="3">专业、相关知识</option> -->
          </select>
        </div>
      </div>
    </div>

    <div class="import-content">
      <!-- 左右分栏布局 -->
      <div class="import-sections">
        <!-- 左侧：上传题目 -->
        <div class="upload-section">
          <div class="section-header">
            <h4>上传题目</h4>
            <div class="section-actions">
              <button class="btn btn-download" @click="downloadQuestionTemplate">下载题目模板</button>
            </div>
          </div>

          <div class="upload-area" 
               :class="{ 'drag-over': isDragOverQuestions }"
               @drop="handleDropQuestions"
               @dragover="handleDragOverQuestions"
               @dragleave="handleDragLeaveQuestions"
               @click="triggerQuestionFileInput">
            <div class="upload-content">
              <div class="upload-icon">📁</div>
              <p class="upload-text">点击选择文件或拖拽文件到此处</p>
              <p class="upload-hint">支持 .docx, .doc 格式</p>
            </div>
            <input 
              ref="questionFileInput"
              type="file" 
              accept=".docx,.doc"
              @change="handleQuestionFileSelect"
              style="display: none"
            />
          </div>

          <div v-if="selectedQuestionFile" class="file-info">
            <div class="file-details">
              <span class="file-name">{{ selectedQuestionFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedQuestionFile.size) }}</span>
            </div>
            <button class="remove-file-btn" @click="removeQuestionFile">移除</button>
          </div>

          <div class="upload-actions">
            <button 
              class="btn btn-import-questions" 
              @click="handleImportQuestions"
              :disabled="!selectedQuestionFile || isImportingQuestions"
            >
              <span v-if="isImportingQuestions" class="loading-spinner"></span>
              {{ isImportingQuestions ? '导入中...' : '导入题目' }}
            </button>
          </div>

          <!-- 题目导入结果 -->
          <div v-if="questionResult" class="result-section">
            <h5>题目导入结果：</h5>
            <div class="result-content">
              <div v-if="questionResult.error" class="error-display">
                <p><strong>错误信息：</strong>{{ questionResult.message }}</p>
                <pre>{{ JSON.stringify(questionResult.details, null, 2) }}</pre>
              </div>
              <div v-else-if="questionResult.data && questionResult.data.parsedContent" class="parsed-content-display">
                <!-- 标题 -->
                <div class="content-title">
                  <h6>📋 {{ questionResult.data.parsedContent.title }}</h6>
                </div>
                
                <!-- 题型及问题 -->
                <div class="question-types-container">
                  <div v-for="(questionType, typeIndex) in questionResult.data.parsedContent.questionTypes" 
                       :key="typeIndex" 
                       class="question-type-section"
                       :class="getQuestionTypeClass(questionType.typeName)">
                    <div class="type-header">
                      <h6>{{ getChineseNumber(typeIndex + 1) }}、{{ questionType.typeName }} ({{ questionType.questions.length }}题)</h6>
                    </div>
                    
                    <div class="questions-list">
                      <div v-for="(question, qIndex) in questionType.questions" 
                           :key="qIndex" 
                           class="question-item">
                        <div class="question-number">{{ question.number }}.</div>
                        <div class="question-content">
                          <!-- questionContentImages：题目中间的图片，按 [img] 占位符顺序嵌入 -->
                          <div class="question-text">
                            <template v-for="(part, pIdx) in parseContentWithImages(question.content, question.questionContentImages)" :key="pIdx">
                              <template v-if="part.type === 'text'">{{ part.value }}</template>
                              <AuthImage v-else-if="part.type === 'img'" :path="part.path" :width="part.width" :height="part.height" alt="" img-class="content-img" />
                            </template>
                          </div>
                          <!-- attachedImage：题目下方的图片，如「补画下图的三视图」中的图 -->
                          <div v-if="question.attachedImage && question.attachedImage.length > 0" class="question-attached-images">
                            <AuthImage v-for="(img, imgIdx) in question.attachedImage"
                                       :key="imgIdx"
                                       :path="img.url"
                                       :width="img.width"
                                       :height="img.height"
                                       alt=""
                                       img-class="attached-img" />
                          </div>
                          <!-- 选择题选项 -->
                          <div v-if="question.options && question.options.length > 0" class="question-options">
                            <div v-for="(option, oIndex) in question.options" 
                                 :key="oIndex" 
                                 class="option-item">
                              {{ option }}
                            </div>
                          </div>
                          <!-- 题目标签 -->
                          <div class="question-tags">
                            <div class="tag-item">
                              <span class="tag-label">领域:</span>
                              <span class="tag-value">{{ getDomainText(question.domain) }}</span>
                            </div>
                            <div class="tag-item">
                              <span class="tag-label">难易程度:</span>
                              <span class="tag-value">{{ getDifficultyText(question.easeOrDifficulty) }}</span>
                            </div>
                            <div class="tag-item">
                              <span class="tag-label">重要程度:</span>
                              <span class="tag-value">{{ getImportanceText(question.importance) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="raw-json">
                <pre>{{ JSON.stringify(questionResult, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：上传答案 -->
        <div class="upload-section">
          <div class="section-header">
            <h4>上传答案</h4>
            <div class="section-actions">
              <button class="btn btn-download" @click="downloadAnswerTemplate">下载答案模板</button>
            </div>
          </div>

          <div class="upload-area" 
               :class="{ 'drag-over': isDragOverAnswers }"
               @drop="handleDropAnswers"
               @dragover="handleDragOverAnswers"
               @dragleave="handleDragLeaveAnswers"
               @click="triggerAnswerFileInput">
            <div class="upload-content">
              <div class="upload-icon">📁</div>
              <p class="upload-text">点击选择文件或拖拽文件到此处</p>
              <p class="upload-hint">支持 .docx, .doc 格式</p>
            </div>
            <input 
              ref="answerFileInput"
              type="file" 
              accept=".docx,.doc"
              @change="handleAnswerFileSelect"
              style="display: none"
            />
          </div>
           
          <div v-if="selectedAnswerFile" class="file-info">
            <div class="file-details">
              <span class="file-name">{{ selectedAnswerFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedAnswerFile.size) }}</span>
            </div>
            <button class="remove-file-btn" @click="removeAnswerFile">移除</button>
          </div>

          <div class="upload-actions">
            <button 
              class="btn btn-import-answers" 
              @click="handleImportAnswers"
              :disabled="!selectedAnswerFile || isImportingAnswers"
            >
              <span v-if="isImportingAnswers" class="loading-spinner"></span>
              {{ isImportingAnswers ? '导入中...' : '导入答案' }}
            </button>
          </div>

          <!-- 答案导入结果 -->
          <div v-if="answerResult" class="result-section">
            <h5>答案导入结果：</h5>
            <div class="result-content">
              <div v-if="answerResult.error" class="error-display">
                <p><strong>错误信息：</strong>{{ answerResult.message }}</p>
                <pre>{{ JSON.stringify(answerResult.details, null, 2) }}</pre>
              </div>
              <div v-else-if="answerResult.data && answerResult.data.parsedContent" class="parsed-content-display">
                <!-- 标题 -->
                <div class="content-title">
                  <h6>📋 {{ answerResult.data.parsedContent.title }}</h6>
                </div>
                
                <!-- 答案类型及答案 -->
                <div class="answer-types-container">
                  <div v-for="(answerType, typeIndex) in answerResult.data.parsedContent.answerTypes" 
                       :key="typeIndex" 
                       class="answer-type-section"
                       :class="getQuestionTypeClass(answerType.typeName)">
                    <div class="type-header">
                      <h6>{{ getChineseNumber(typeIndex + 1) }}、{{ answerType.typeName }} ({{ answerType.answers.length }}题)</h6>
                    </div>
                    
                    <div class="answers-list">
                      <div v-for="(answer, aIndex) in answerType.answers" 
                           :key="aIndex" 
                           class="answer-item">
                        <div class="answer-number">{{ answer.number }}.</div>
                        <div class="answer-content">
                          <!-- 答案中的 [img] 与 answerImage 与题目逻辑一致：parseContentWithImages + AuthImage -->
                          <div class="answer-text">
                            <template v-for="(part, pIdx) in parseContentWithImages(answer.answer, answer.answerImage)" :key="pIdx">
                              <template v-if="part.type === 'text'">{{ part.value }}</template>
                              <AuthImage v-else-if="part.type === 'img'" :path="part.path" :width="part.width" :height="part.height" alt="" img-class="content-img" />
                            </template>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="raw-json">
                <pre>{{ JSON.stringify(answerResult, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <PreviewModal 
      :visible="showPreview"
      :questionData="questionPreviewData"
      :answerData="answerPreviewData"
      @close="closePreviewModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { importQuestionBank, createQuestionBank } from '@/api/questionBank.js'
import { exportTemplate } from '@/api/questionBank.js'
import { getDictionaryByType } from '@/api/user.ts'
import { getFullImageUrl } from '@/api/imageUpload.js'
import { ROLE_EXAM_STATION_ADMIN, toRoleNumber } from '@/constants/role'
import AuthImage from '@/components/AuthImage.vue'
import PreviewModal from './PreviewModal.vue'

const emit = defineEmits(['back', 'import'])

// 题目相关
const questionFileInput = ref(null)
const selectedQuestionFile = ref(null)
const isDragOverQuestions = ref(false)
const isImportingQuestions = ref(false)
const questionResult = ref(null)

// 提交状态
const isSubmitting = ref(false)

// 答案相关
const answerFileInput = ref(null)
const selectedAnswerFile = ref(null)
const isDragOverAnswers = ref(false)
const isImportingAnswers = ref(false)
const answerResult = ref(null)

// 预览相关
const showPreview = ref(false)

const isStationAdmin = computed(() => {
  try {
    const userStr = sessionStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : {}
    return toRoleNumber(user.role) === ROLE_EXAM_STATION_ADMIN
  } catch {
    return false
  }
})

// 表单数据（题库类型：0职业认定 1竞赛 2模拟考核，默认0）
const formData = ref({
  questionName: '',
  questionType: '',
  difficulty: '',
  questionBankType: 0,
  domain: 0
})

// 职业(工种)选项
const employeeTypeOptions = ref([])

// 技能等级选项
const levelOptions = ref([])

// 加载选项数据
const loadOptions = async () => {
  try {
    // 加载职业(工种) (type: 0)
    const employeeTypesResponse = await getDictionaryByType({ type: 0 })
    if (employeeTypesResponse && employeeTypesResponse.code === 200) {
      employeeTypeOptions.value = employeeTypesResponse.data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code
      }))
    }
    
    // 加载技能等级 (type: 1)
    const levelsResponse = await getDictionaryByType({ type: 1 })
    if (levelsResponse && levelsResponse.code === 200) {
      levelOptions.value = levelsResponse.data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code
      }))
    }
  } catch (error) {
    console.error('加载选项数据失败:', error)
    ElMessage.error('加载选项数据失败')
  }
}

// 页面加载时获取选项数据
loadOptions()

// 考核站管理员不可选职业认定，若当前为 0 则重置为竞赛(1)
onMounted(() => {
  if (isStationAdmin.value && (formData.value.questionBankType === 0 || formData.value.questionBankType === '0')) {
    formData.value.questionBankType = 1
  }
})

// 提交题库数据
const submitQuestionBankData = async (formData, importResult) => {
  try {
    // 从导入结果中提取题目数据
    const questions = extractQuestionsFromImportResult(importResult)

    // 考核站管理员创建时传入 stationId；入参含 baseType（0=职业认定/1=竞赛/2=模拟考核）
    const userStr = sessionStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : {}
    const extra = {}
    extra.baseType = Number(formData.questionBankType)
    extra.questionBankType = Number(formData.questionBankType)
    if (user.stationId) extra.stationId = user.stationId

    // 调用创建题库接口
    const response = await createQuestionBank(
      formData.questionName,
      formData.questionType,
      formData.difficulty,
      formData.domain,
      questions,
      extra
    )

    // 正常 HTTP 200 响应，但业务 code 非 200 的情况
    if (!response?.data || response.data.code !== 200) {
      const msg = response?.data?.msg || '题库创建失败，请重试'
      console.error('题库创建失败（业务码非200）:', response?.data)
      // 提前给出错误提示
      ElMessage.error(msg)
      // 抛出错误让上层 catch 走失败分支，不再当成成功
      throw new Error(msg)
    }

    console.log('题库创建成功:', response.data)
    return response.data
  } catch (error) {
    console.error('提交题库数据失败:', error)

    // 处理 HTTP 400 等非 2xx 错误
    const backendMsg = error?.response?.data?.msg
    if (backendMsg) {
      // 如：题库已存在
      ElMessage.error(backendMsg)
      throw new Error(backendMsg)
    }

    throw error
  }
}

// 从导入结果中提取题目数据，合并题目与答案，按需添加图片字段（单选无图则不包含）
const extractQuestionsFromImportResult = (importResult) => {
  const questions = []

  try {
    const questionData = importResult.questionResult?.data?.parsedContent
    const answerData = importResult.answerResult?.data?.parsedContent

    // 必须有题目数据才能构建
    if (!questionData?.questionTypes) return questions

    questionData.questionTypes.forEach(questionType => {
      if (!questionType.questions) return
      questionType.questions.forEach(question => {
        const questionItem = {
          content: question.content ?? '',
          type: questionType.typeName,
          answer: '',
          options: Array.isArray(question.options) ? question.options : [],
          domain: question.domain ?? 1,
          easeOrDifficulty: question.easeOrDifficulty ?? '2',
          importance: question.importance ?? 'X',
          number: question.number ?? 0
        }

        // 合并答案
        if (answerData?.answerTypes) {
          const answerType = answerData.answerTypes.find(at => at.typeName === questionType.typeName)
          const answer = answerType?.answers?.find(a => a.number === question.number)
          if (answer) {
            questionItem.answer = answer.answer ?? ''
            // 答案图片 - 与 submitALLInput.json 一致，使用驼峰 answerImage
            const ansImg = answer.answerImage ?? answer.answer_image
            if (ansImg && Array.isArray(ansImg) && ansImg.length > 0) {
              questionItem.answerImage = ansImg.map(img => ({
                url: img.url ?? img,
                width: img.width,
                height: img.height
              }))
            }
          }
        }

        // 选项图片（有则添加）- 与 submitALLInput.json 一致，使用驼峰 optionImages
        const optImgs = question.optionImages ?? question.option_images
        if (optImgs) {
          const arr = Array.isArray(optImgs) ? optImgs : String(optImgs).split(',').map(s => s.trim()).filter(Boolean).map(url => ({ url }))
          if (arr.length > 0) {
            questionItem.optionImages = arr.map(img => (typeof img === 'object' && img !== null ? { url: img.url ?? img, width: img.width, height: img.height } : { url: String(img) }))
          }
        }

        // 题目下方图片 - 与 submitALLInput.json 一致，使用驼峰 attachedImage
        const attached = question.attachedImage ?? question.attached_image
        if (attached && Array.isArray(attached) && attached.length > 0) {
          questionItem.attachedImage = attached.map(img => ({
            url: img.url ?? img,
            width: img.width,
            height: img.height
          }))
        }

        // 题中 [img] 占位符对应图片 - 与 submitALLInput.json 一致，使用驼峰 questionContentImages
        const contentImgs = question.questionContentImages ?? question.question_content_images
        if (contentImgs && Array.isArray(contentImgs) && contentImgs.length > 0) {
          questionItem.questionContentImages = contentImgs.map(img => ({
            url: img.url ?? img,
            width: img.width,
            height: img.height
          }))
        }

        questions.push(questionItem)
      })
    })
  } catch (error) {
    console.error('提取题目数据失败:', error)
  }

  return questions
}

// 题目文件选择相关方法
const triggerQuestionFileInput = () => {
  questionFileInput.value?.click()
}

const handleQuestionFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedQuestionFile.value = file
  }
}

const handleDropQuestions = (event) => {
  event.preventDefault()
  isDragOverQuestions.value = false
  
  const files = event.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]
    if (file.type.includes('document') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      selectedQuestionFile.value = file
    }
  }
}

const handleDragOverQuestions = (event) => {
  event.preventDefault()
  isDragOverQuestions.value = true
}

const handleDragLeaveQuestions = (event) => {
  event.preventDefault()
  isDragOverQuestions.value = false
}

const removeQuestionFile = () => {
  selectedQuestionFile.value = null
  questionResult.value = null
  if (questionFileInput.value) {
    questionFileInput.value.value = ''
  }
}

// 答案文件选择相关方法
const triggerAnswerFileInput = () => {
  answerFileInput.value?.click()
}

const handleAnswerFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedAnswerFile.value = file
  }
}

const handleDropAnswers = (event) => {
  event.preventDefault()
  isDragOverAnswers.value = false
  
  const files = event.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]
    if (file.type.includes('document') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      selectedAnswerFile.value = file
    }
  }
}

const handleDragOverAnswers = (event) => {
  event.preventDefault()
  isDragOverAnswers.value = true
}

const handleDragLeaveAnswers = (event) => {
  event.preventDefault()
  isDragOverAnswers.value = false
}

const removeAnswerFile = () => {
  selectedAnswerFile.value = null
  answerResult.value = null
  if (answerFileInput.value) {
    answerFileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 根据题型名称返回对应的CSS类名
const getQuestionTypeClass = (typeName) => {
  const typeMap = {
    '填空题': 'type-fill-blank',
    '单项选择题': 'type-single-choice',
    '多项选择题': 'type-multiple-choice',
    '判断题': 'type-judgment',
    '简答题': 'type-short-answer',
    '综合题': 'type-comprehensive'
  }
  return typeMap[typeName] || 'type-default'
}

// 预览相关方法
const hasPreviewData = computed(() => {
  const hasQuestionData = questionResult.value && questionResult.value.data && questionResult.value.data.parsedContent
  const hasAnswerData = answerResult.value && answerResult.value.data && answerResult.value.data.parsedContent
  
  console.log('预览数据检查:', {
    hasQuestionData,
    hasAnswerData,
    questionResult: questionResult.value,
    answerResult: answerResult.value,
    questionData: questionResult.value?.data,
    answerData: answerResult.value?.data
  })
  
  return hasQuestionData || hasAnswerData
})

const questionPreviewData = computed(() => {
  return questionResult.value?.data?.parsedContent || null
})

const answerPreviewData = computed(() => {
  return answerResult.value?.data?.parsedContent || null
})

// 表单是否完成
const formComplete = computed(() => {
  return formData.value.questionName && 
         formData.value.questionType && 
         formData.value.difficulty &&
         formData.value.domain !== null && formData.value.domain !== undefined
})

// 是否可以提交
const canSubmit = computed(() => {
  // 基本表单信息必须填写完整
  const formCompleteValue = formComplete.value
  
  // 至少要有题目或答案其中一项导入成功
  const hasValidImport = (questionResult.value && 
                         questionResult.value.code === 200) ||
                        (answerResult.value && 
                         answerResult.value.code === 200)
  
  // 调试信息
  if (!formCompleteValue) {
    console.log('表单未完成:', {
      questionName: !!formData.value.questionName,
      questionType: !!formData.value.questionType,
      difficulty: !!formData.value.difficulty,
      domain: !!formData.value.domain,
      formData: formData.value
    })
  }
  
  if (!hasValidImport) {
    console.log('导入未成功:', {
      questionResultCode: questionResult.value?.code,
      answerResultCode: answerResult.value?.code,
      questionResultExists: !!questionResult.value,
      answerResultExists: !!answerResult.value,
      questionResultFull: questionResult.value,
      answerResultFull: answerResult.value
    })
  }
  
  return formCompleteValue && hasValidImport
})

const showPreviewModal = () => {
  if (hasPreviewData.value) {
    showPreview.value = true
  }
}

const closePreviewModal = () => {
  showPreview.value = false
}

// 处理提交
const handleSubmit = async () => {
  // 防抖：如果正在提交，直接返回
  if (isSubmitting.value) {
    return
  }
  
  if (!canSubmit.value) {
    ElMessage.warning('请确保表单信息填写完整且至少导入题目或答案')
    return
  }
  
  isSubmitting.value = true
  
  try {
    // 调用提交接口
    await submitQuestionBankData(formData.value, {
      questionResult: questionResult.value,
      answerResult: answerResult.value
    })
    
    ElMessage.success('题库创建成功！')
    
    // 提交成功后返回列表页面
    emit('back')
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(error.message || '提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 处理导入题目
// 校验表单必填项
const validateFormFields = () => {
  if (!formData.value.questionName) {
    ElMessage.warning('请输入题库名称')
    return false
  }
  if (!formData.value.questionType) {
    ElMessage.warning('请选择职业(工种)')
    return false
  }
  if (!formData.value.difficulty) {
    ElMessage.warning('请选择技能等级')
    return false
  }
  if (formData.value.questionBankType === null || formData.value.questionBankType === undefined || formData.value.questionBankType === '') {
    ElMessage.warning('请选择题库类型')
    return false
  }
  if (formData.value.domain === null || formData.value.domain === undefined || formData.value.domain === '') {
    ElMessage.warning('请选择领域')
    return false
  }
  return true
}

const handleImportQuestions = async () => {
  console.log('开始导入题目...', {
    selectedFile: selectedQuestionFile.value?.name,
    formData: formData.value
  })
  
  // 先校验表单必填项
  if (!validateFormFields()) {
    return
  }
  
  if (!selectedQuestionFile.value) {
    ElMessage.warning('请先选择题目文件')
    return
  }
  
  isImportingQuestions.value = true
  
  try {
    console.log('调用导入接口...')
    // 调用导入接口
    const response = await importQuestionBank(selectedQuestionFile.value, 1) // 1代表题目
    
    console.log('导入接口响应:', response)
    
    // 直接显示返回的报文
    questionResult.value = response.data
    
    console.log('存储到questionResult:', questionResult.value)
    
    if (response.data && response.data.code === 200) {
      ElMessage.success('题目导入成功！')
    }
  } catch (error) {
    console.error('导入失败:', error)
    const errorMessage = error.response?.data?.msg || error.message || '导入失败，请重试'
    ElMessage.error(errorMessage)
    
    // 显示错误信息
    questionResult.value = {
      error: true,
      message: errorMessage,
      details: error.response?.data || error.message
    }
  } finally {
    isImportingQuestions.value = false
  }
}

// 处理导入答案
const handleImportAnswers = async () => {
  console.log('开始导入答案...', {
    selectedFile: selectedAnswerFile.value?.name,
    formData: formData.value
  })
  
  // 先校验表单必填项
  if (!validateFormFields()) {
    return
  }
  
  if (!selectedAnswerFile.value) {
    ElMessage.warning('请先选择答案文件')
    return
  }
  
  isImportingAnswers.value = true
  
  try {
    console.log('调用导入接口...')
    // 调用导入接口
    const response = await importQuestionBank(selectedAnswerFile.value, 2) // 2代表答案
    
    console.log('导入接口响应:', response)
    
    // 直接显示返回的报文
    answerResult.value = response.data
    
    console.log('存储到answerResult:', answerResult.value)
    
    if (response.data && response.data.code === 200) {
      ElMessage.success('答案导入成功！')
    }
  } catch (error) {
    console.error('导入失败:', error)
    const errorMessage = error.response?.data?.msg || error.message || '导入失败，请重试'
    ElMessage.error(errorMessage)
    
    // 显示错误信息
    answerResult.value = {
      error: true,
      message: errorMessage,
      details: error.response?.data || error.message
    }
  } finally {
    isImportingAnswers.value = false
  }
}

// 下载模板
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const downloadQuestionTemplate = async () => {
  try {
    const res = await exportTemplate(1)
    const filename = '题目模板.docx'
    downloadBlob(res.data, filename)
    ElMessage.success('题目模板开始下载')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || '下载题目模板失败')
  }
}

const downloadAnswerTemplate = async () => {
  try {
    const res = await exportTemplate(2)
    const filename = '答案模板.docx'
    downloadBlob(res.data, filename)
    ElMessage.success('答案模板开始下载')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || '下载答案模板失败')
  }
}

// 转换函数
const getDomainText = (domain) => {
  const domainMap = {
    1: '基础知识',
    2: '职业道德', 
    3: '专业知识',
    4: '相关知识',
    5: '专业技能',
    6: '相关技能'
  }
  return domainMap[domain] || '未设置'
}

const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    '1': '易',
    '2': '较易',
    '3': '中等',
    '4': '较难',
    '5': '难'
  }
  return difficultyMap[difficulty] || '未设置'
}

const getImportanceText = (importance) => {
  const importanceMap = {
    'X': '核心要素',
    'Y': '一般要素',
    'Z': '辅助要素'
  }
  return importanceMap[importance] || '未设置'
}

// 将数字转换为中文序号（一、二、三...）
const getChineseNumber = (num) => {
  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
  if (num >= 1 && num <= chineseNumbers.length) {
    return chineseNumbers[num - 1]
  }
  // 如果超过20，返回数字本身
  return num.toString()
}

// questionContentImages：题目中间的图片，[img] 占位符按顺序替换；用 path 供 AuthImage 发请求带 token
const parseContentWithImages = (content, questionContentImages) => {
  if (!content) return []
  const images = questionContentImages || []
  const parts = content.split(/\[img\]/g)
  const result = []
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) result.push({ type: 'text', value: parts[i] })
    if (i < parts.length - 1 && images[i]) {
      result.push({
        type: 'img',
        path: images[i].url,
        width: images[i].width || 80,
        height: images[i].height || 21
      })
    }
  }
  return result
}

</script>

<style scoped>
/* 导入页面样式 */
.import-page {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.import-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.import-header :deep(.breadcrumb-nav) {
  margin-bottom: 0;
}

.breadcrumb-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
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
  color: var(--color-primary-brand);
  border-color: var(--color-primary-brand);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 调试信息样式 */
.debug-info {
  display: flex;
  gap: 16px;
  margin-left: 20px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 12px;
}

.debug-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.debug-label {
  color: #666;
  font-weight: 500;
}

.debug-value {
  font-weight: bold;
  font-size: 14px;
}

.debug-success {
  color: #52c41a;
}

.debug-error {
  color: #ff4d4f;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 16px;
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

.import-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.preview-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: #722ed1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  min-width: 100px;
  height: 36px;
}

.preview-btn:hover:not(:disabled) {
  background-color: #9254de;
}

.preview-btn:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.preview-icon {
  font-size: 16px;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: var(--color-success);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  min-width: 100px;
  height: 36px;
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--color-success-hover);
}

.submit-btn:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.submit-icon {
  font-size: 16px;
}

.import-content {
  width: 100%;
  max-width: none;
}

/* 表单样式 */
.form-section {
  margin-bottom: 24px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.form-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;
}

.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group label .required {
  color: var(--color-danger);
  margin-left: 2px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  background-color: white;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-input::placeholder {
  color: #999;
}

.form-select option {
  padding: 8px;
}

.import-sections {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.upload-section {
  flex: 1;
  min-width: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-actions {
  display: flex;
  align-items: center;
}

.upload-actions {
  margin-top: 16px;
  text-align: center;
}

.result-section {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.result-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.result-content {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  /* 移除固定高度，让内容自然流展示 */
}

.result-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 解析内容显示样式 */
.parsed-content-display {
  font-size: 14px;
}

.content-title {
  margin-bottom: 20px;
  padding: 12px;
  background-color: var(--color-primary-bg);
  border-radius: 6px;
  border-left: 4px solid var(--color-primary);
}

.content-title h6 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

/* 移除固定高度，让内容自然流展示 */

.question-type-section {
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

/* 答案类型样式 */
.answer-type-section {
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.answer-item {
  display: flex;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.answer-item:hover {
  background-color: #fafafa;
}

.answer-item:last-child {
  border-bottom: none;
}

.answer-number {
  flex-shrink: 0;
  width: 30px;
  font-weight: 600;
  color: var(--color-primary);
  margin-right: 10px;
}

.answer-content {
  flex: 1;
  min-width: 0;
}

.answer-text {
  line-height: 1.5;
  color: #333;
  font-weight: 500;
  padding: 4px 8px;
  background-color: var(--color-primary-bg);
  border-radius: 4px;
  border-left: 3px solid var(--color-primary);
}

/* 不同题型的颜色主题 */
.type-fill-blank {
  border-left: 4px solid var(--color-success);
}

.type-fill-blank .type-header {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

/* 答案类型也使用相同的颜色主题 */
.answer-type-section.type-fill-blank {
  border-left: 4px solid var(--color-success);
}

.answer-type-section.type-fill-blank .type-header {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.type-single-choice {
  border-left: 4px solid var(--color-primary);
}

.type-single-choice .type-header {
  background-color: var(--color-primary-bg);
  color: var(--color-primary);
}

.answer-type-section.type-single-choice {
  border-left: 4px solid var(--color-primary);
}

.answer-type-section.type-single-choice .type-header {
  background-color: var(--color-primary-bg);
  color: var(--color-primary);
}

.type-multiple-choice {
  border-left: 4px solid #722ed1;
}

.type-multiple-choice .type-header {
  background-color: #f9f0ff;
  color: #722ed1;
}

.answer-type-section.type-multiple-choice {
  border-left: 4px solid #722ed1;
}

.answer-type-section.type-multiple-choice .type-header {
  background-color: #f9f0ff;
  color: #722ed1;
}

.type-judgment {
  border-left: 4px solid var(--color-warning);
}

.type-judgment .type-header {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

.answer-type-section.type-judgment {
  border-left: 4px solid var(--color-warning);
}

.answer-type-section.type-judgment .type-header {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

.type-short-answer {
  border-left: 4px solid #13c2c2;
}

.type-short-answer .type-header {
  background-color: #e6fffb;
  color: #13c2c2;
}

.answer-type-section.type-short-answer {
  border-left: 4px solid #13c2c2;
}

.answer-type-section.type-short-answer .type-header {
  background-color: #e6fffb;
  color: #13c2c2;
}

.type-comprehensive {
  border-left: 4px solid #eb2f96;
}

.type-comprehensive .type-header {
  background-color: #fff0f6;
  color: #eb2f96;
}

.answer-type-section.type-comprehensive {
  border-left: 4px solid #eb2f96;
}

.answer-type-section.type-comprehensive .type-header {
  background-color: #fff0f6;
  color: #eb2f96;
}

.type-default {
  border-left: 4px solid #8c8c8c;
}

.type-default .type-header {
  background-color: #f5f5f5;
  color: #8c8c8c;
}

.answer-type-section.type-default {
  border-left: 4px solid #8c8c8c;
}

.answer-type-section.type-default .type-header {
  background-color: #f5f5f5;
  color: #8c8c8c;
}

.type-header {
  padding: 10px 15px;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
}

.type-header h6 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 移除固定高度，让内容自然流展示 */

.question-item {
  display: flex;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.question-item:hover {
  background-color: #fafafa;
}

.question-item:last-child {
  border-bottom: none;
}

.question-number {
  flex-shrink: 0;
  width: 30px;
  font-weight: 600;
  color: var(--color-primary);
  margin-right: 10px;
}

.question-content {
  flex: 1;
  min-width: 0;
}

.question-text {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #333;
}

.question-text .content-img {
  vertical-align: middle;
  margin: 0 2px;
}

.question-attached-images {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.question-attached-images .attached-img {
  max-width: 100%;
  height: auto;
  display: block;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.question-options {
  margin-top: 8px;
}

.option-item {
  margin: 4px 0;
  padding: 4px 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  border-left: 3px solid #d9d9d9;
}

/* 题目标签样式 */
.question-tags {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.tag-value {
  font-size: 12px;
  color: #333;
  background-color: #e3f2fd;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #bbdefb;
}

.error-display {
  color: #ff4d4f;
}

.error-display p {
  margin: 0 0 10px 0;
  font-weight: 600;
}

.raw-json {
  font-size: 12px;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--color-primary);
  background-color: var(--color-primary-bg);
}

.upload-content {
  pointer-events: none;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #333;
  margin: 0 0 8px 0;
}

.upload-hint {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f6f8fa;
  border-radius: 6px;
  margin-top: 16px;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 500;
  color: #333;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.remove-file-btn {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
}

.remove-file-btn:hover {
  background-color: #fff1f0;
  border-radius: 4px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
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

.btn-import-questions {
  background-color: var(--color-primary);
  color: white;
  width: 100%;
  padding: 10px 16px;
}

.btn-import-questions:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-import-questions:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.btn-import-answers {
  background-color: var(--color-success);
  color: white;
  width: 100%;
  padding: 10px 16px;
}

.btn-import-answers:hover:not(:disabled) {
  background-color: var(--color-success-hover);
}

.btn-import-answers:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>
