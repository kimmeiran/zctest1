<template>
  <div v-if="visible" class="preview-modal-overlay" @mousedown.self="handleOverlayClick">
    <div class="preview-modal" @click.stop>
      <div class="preview-header">
        <h3>试卷预览</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="preview-content">
        <!-- 组合预览：按题型显示题目和对应答案 -->
        <div v-if="hasData" class="preview-section">
          <h4>📋 {{ getPreviewTitle() }}</h4>
          <div class="preview-combined">
            <div v-for="(questionType, typeIndex) in combinedData" 
                 :key="typeIndex" 
                 class="preview-question-type">
              <h5>{{ questionType.typeName }}</h5>
              <div class="preview-questions-list">
                <div v-for="(question, qIndex) in questionType.questions" 
                     :key="qIndex" 
                     class="preview-question-item">
                  <div class="question-content">
                    <div class="question-text-row">
                      <span class="question-num">{{ question.number }}.</span>
                      <!-- questionContentImages：题目中间的图片，按 [img] 占位符顺序嵌入 -->
                      <span class="question-text">
                        <template v-for="(part, pIdx) in parseContentWithImages(question.content, question.questionContentImages)" :key="pIdx">
                          <template v-if="part.type === 'text'">{{ part.value }}</template>
                          <AuthImage v-else-if="part.type === 'img'" :path="part.path" :width="part.width" :height="part.height" alt="" img-class="content-img" />
                        </template>
                      </span>
                    </div>
                    <!-- attachedImage：题目下方的图片，显示在题目文字下方 -->
                    <div v-if="question.attachedImage && question.attachedImage.length > 0" class="question-attached-images">
                      <AuthImage v-for="(img, imgIdx) in question.attachedImage"
                                :key="imgIdx"
                                :path="img.url"
                                :width="img.width"
                                :height="img.height"
                                alt=""
                                img-class="attached-img" />
                    </div>
                  </div>
                  <!-- 显示选项（如果有） -->
                  <div v-if="question.options && question.options.length > 0" class="question-options">
                    <div v-for="(option, optIndex) in question.options" 
                         :key="optIndex" 
                         class="option-item">
                      {{ option }}
                    </div>
                  </div>
                  <!-- 显示答案（如果有） -->
                  <div v-if="question.answer" class="question-answer">
                    <span class="answer-label">答案：</span>
                    <span class="answer-text">{{ question.answer }}</span>
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
        
        <!-- 无数据提示 -->
        <div v-if="!hasData" class="no-preview-data">
          <p>请先导入题目或答案后再预览</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getFullImageUrl } from '@/api/imageUpload.js'
import AuthImage from '@/components/AuthImage.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  questionData: {
    type: Object,
    default: null
  },
  answerData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const hasData = computed(() => {
  return props.questionData || props.answerData
})

// 组合题目和答案数据
const combinedData = computed(() => {
  const questionTypes = props.questionData?.questionTypes || []
  const answerTypes = props.answerData?.answerTypes || []
  
  // 创建答案映射，按题型和题目编号索引
  const answerMap = new Map()
  answerTypes.forEach(answerType => {
    answerType.answers.forEach(answer => {
      const key = `${answerType.typeName}_${answer.number}`
      answerMap.set(key, answer.answer)
    })
  })
  
  // 组合数据：以题目数据为主，添加对应的答案
  return questionTypes.map(questionType => {
    const questionsWithAnswers = questionType.questions.map(question => {
      const answerKey = `${questionType.typeName}_${question.number}`
      const answer = answerMap.get(answerKey)
      
      return {
        ...question,
        answer: answer || null
      }
    })
    
    return {
      ...questionType,
      questions: questionsWithAnswers
    }
  })
})

// 获取预览标题
const getPreviewTitle = () => {
  if (props.questionData?.title) {
    return props.questionData.title
  }
  if (props.answerData?.title) {
    return props.answerData.title
  }
  return '试卷预览'
}

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  emit('close')
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

// questionContentImages：题目中间的图片，content 中 [img] 占位符按顺序替换；用 path 供 AuthImage 发请求带 token
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
/* 预览弹窗样式 */
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.preview-modal {
  background: white;
  border-radius: 8px;
  width: 95%;
  max-width: 1100px;
  max-height: 92vh;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  background-color: #fafafa;
  border-radius: 8px 8px 0 0;
}

.preview-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.preview-content {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
  font-size: 15px;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  padding-bottom: 8px;
  border-bottom: 2px solid #e6f7ff;
}

.preview-combined {
  margin-top: 16px;
}

.preview-question-type {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.preview-question-type h5 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.preview-questions-list {
  margin-top: 8px;
}

.preview-question-item {
  margin-bottom: 20px;
  padding: 16px 18px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.preview-question-item:last-child {
  margin-bottom: 0;
}

.question-content {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.question-text-row {
  display: flex;
  align-items: flex-start;
}

.question-num {
  flex-shrink: 0;
  width: 28px;
  font-weight: 600;
  font-size: 15px;
  color: #1890ff;
  margin-right: 8px;
}

.question-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  word-break: break-word;
}

.question-text .content-img {
  vertical-align: middle;
  margin: 0 2px;
}

/* 题目下方的图片，单独一行显示在题目文字下面 */
.question-attached-images {
  margin-top: 12px;
  margin-left: 36px;
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
  margin: 8px 0 8px 32px;
}

.option-item {
  font-size: 13px;
  line-height: 1.4;
  color: #666;
  margin-bottom: 4px;
  padding-left: 8px;
}

.question-answer {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #1890ff;
}

.answer-label {
  font-weight: 600;
  color: #1890ff;
  margin-right: 8px;
}

.answer-text {
  font-size: 13px;
  color: #333;
  font-weight: 500;
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

.no-preview-data {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-preview-data p {
  margin: 0;
  font-size: 14px;
}
</style>
