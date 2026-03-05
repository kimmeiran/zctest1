<template>
  <div class="paper-application-container">
    <div class="add-view">
      <h2 class="page-title">试卷申请</h2>

      <div class="form-container">

        <div class="download-template-row">
          <button type="button" class="btn-submit" @click="downloadTemplate">下载模板</button>
        </div>

        <div class="upload-section">
          <div 
            class="upload-area" 
            :class="{ 'has-file': uploadedFile }"
            @dragover.prevent
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".docx,.doc,.pdf,.xlsx"
              @change="handleFileChange"
              style="display: none"
            />
            <div class="upload-content">
              <div class="upload-icon">📄</div>
              <div class="upload-title">上传考试列表</div>
              <div class="upload-desc">支持 xlsx、doc、docx、pdf 格式，最大 10MB</div>
              <div class="upload-hint">点击或拖拽文件到此处</div>
              <div v-if="uploadedFile" class="file-name">{{ uploadedFile.name }}</div>
            </div>
          </div>
        </div>

        <div class="remark-section">
          <label class="remark-label">备注说明</label>
          <textarea
            v-model="remark"
            class="remark-textarea"
            placeholder="请输入备注说明（可选，最多500字）"
            rows="4"
            maxlength="500"
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="btn-cancel" @click="resetForm">取消</button>
          <button class="btn-submit" @click="submitApplication" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交申请' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createPaperApplication } from '@/api/paperApplication'
import { downloadExamApplyTemplate } from '@/api/teachExam'

// 为 true 时本页不发起任何接口请求（仅做页面展示与交互）
const SKIP_API_CALL = false

// 表单数据
const uploadedFile = ref(null)
const remark = ref('')
const submitting = ref(false)

// 文件上传
const fileInput = ref(null)

// 当前用户信息
const currentUser = ref(JSON.parse(sessionStorage.getItem('currentUser') || '{}'))

// 重置表单（取消或提交成功后）
const resetForm = () => {
  uploadedFile.value = null
  remark.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

// 下载模板：调用 /api/teachExam/downloadTemplate
const downloadTemplate = async () => {
  try {
    const blob = await downloadExamApplyTemplate()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '试卷申请模板.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error(error?.response?.data?.msg || error?.message || '下载模板失败')
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

// 处理拖拽上传
const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

// 验证并设置文件（PRD：xlsx、xls、doc、docx、pdf，最大 10MB）
const validateAndSetFile = (file) => {
  const allowedExtensions = ['.docx', '.doc', '.pdf', '.xlsx']
  const fileName = file.name.toLowerCase()
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))

  if (!hasValidExtension) {
    ElMessage.error('附件格式错误，仅支持xlsx、doc、docx、pdf格式')
    return
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB
    ElMessage.error('附件过大，请压缩后上传')
    return
  }

  uploadedFile.value = file
  ElMessage.success('文件已选择')
}

// 提交申请
const submitApplication = async () => {
  if (!uploadedFile.value) {
    ElMessage.error('请上传考试列表文件')
    return
  }
  if (remark.value && remark.value.length > 500) {
    ElMessage.error('备注过长')
    return
  }

  if (SKIP_API_CALL) {
    ElMessage.info('接口暂未启用，未实际提交')
    return
  }

  submitting.value = true
  
  try {
    const formData = new FormData()
    formData.append('file', uploadedFile.value)
    formData.append('remark', remark.value || '')
    formData.append('year', new Date().getFullYear())
    
    if (currentUser.value.stationId) {
      formData.append('stationId', currentUser.value.stationId)
    }

    const response = await createPaperApplication(formData)
    const res = response.data || response
    
    if (res.code === 200) {
      ElMessage.success('申请提交成功')
      resetForm()
    } else {
      ElMessage.error(res.msg || res.message || '提交申请失败')
    }
  } catch (error) {
    console.error('提交申请失败:', error)
    const msg = error?.response?.data?.msg || error?.response?.data?.message || '提交申请失败'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

</script>

<style scoped>
.paper-application-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.add-view {
  background: white;
  border-radius: 4px;
  padding: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
}

/* 上传区域 */
.upload-section {
  margin-bottom: 24px;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #c70019;
  background: #fff;
}

.upload-area.has-file {
  border-color: #52c41a;
  background: #f6ffed;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.upload-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.upload-desc {
  font-size: 13px;
  color: #999;
}

.upload-hint {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.file-name {
  margin-top: 8px;
  padding: 8px 16px;
  background: white;
  border-radius: 4px;
  color: #52c41a;
  font-weight: 500;
}

/* 下载模板 */
.download-template-row {
  margin-bottom: 24px;
}

.download-template-row .btn-submit {
  margin: 0;
}

/* 备注区域 */
.remark-section {
  margin-bottom: 24px;
}

.remark-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.remark-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.remark-textarea:focus {
  outline: none;
  border-color: #c70019;
}

.remark-textarea::placeholder {
  color: #bfbfbf;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
}

.btn-cancel,
.btn-submit {
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: #c70019;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #a00015;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


</style>
