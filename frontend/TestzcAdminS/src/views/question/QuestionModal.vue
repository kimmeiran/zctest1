<template>
    <div class="modal-overlay" v-if="visible" @mousedown.self="$emit('close')">
        <div class="modal-container" @click.stop>
            <div class="modal-header">
                <h3>{{ isEditMode ? "编辑" : "新建" }}</h3>
            </div>
            <div class="modal-body">
                <!-- 题库名称 -->
                <div class="form-group">
                    <label for="exam-name">题库名称</label>
                    <input id="exam-name" type="text" class="form-input" v-model="localExam.questionName"
                        placeholder="请输入名称" />
                </div>
                <!-- 新增的职业(工种) -->
                <div class="form-group">
                    <label for="question-type">职业(工种)</label>
                    <select id="question-type" class="form-select" v-model="localExam.questionType">
                        <option value disabled selected>请选择职业(工种)</option>
                        <option v-for="employeeType in employeeTypeOptions" :key="employeeType.id"
                            :value="employeeType.name">
                            {{ employeeType.name }}
                        </option>
                    </select>
                </div>

                <!-- 新增的难度等级 -->
                <div class="form-group">
                    <label for="difficulty">技能等级</label>
                    <select id="difficulty" class="form-select" v-model="localExam.difficulty">
                        <option value disabled selected>请选择技能等级</option>
                        <option v-for="level in levelOptions" :key="level.id" :value="level.name">{{ level.name }}
                        </option>
                    </select>
                </div>

                <!-- 题库类型（竞赛/模拟考试/职业认定） -->
                <div class="form-group">
                    <label for="question-bank-type">题库类型 <span class="required">*</span></label>
                    <select id="question-bank-type" class="form-select" v-model="localExam.questionBankType">
                        <option value="">请选择题库类型</option>
                        <option value="竞赛">竞赛</option>
                        <option value="模拟考试">模拟考试</option>
                        <option value="职业认定">职业认定</option>
                    </select>
                </div>

                <!-- 导入 -->
                <div class="form-group">
                    <label>导入题目文件</label>
                    <div class="file-upload-wrapper" @click="triggerQuestionFileInput">
                        <input type="file" ref="questionFileInput" class="file-input" @change="handleQuestionFileChange"
                            accept=".doc, .docx" style="display: none" />
                        <div class="file-upload-box">
                            <span class="upload-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </span>
                            <span v-if="selectedQuestionFile">{{ selectedQuestionFile.name }}</span>
                            <span v-else>点击选择题目文件</span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>导入答案文件</label>
                    <div class="file-upload-wrapper" @click="triggerAnswerFileInput">
                        <input type="file" ref="answerFileInput" class="file-input" @change="handleAnswerFileChange"
                            accept=".doc, .docx" style="display: none" />
                        <div class="file-upload-box">
                            <span class="upload-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </span>
                            <span v-if="selectedAnswerFile">{{ selectedAnswerFile.name }}</span>
                            <span v-else>点击选择答案文件</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" @click="$emit('close')">取消</button>
                <button class="btn btn-primary" @click="handleSave" :disabled="isSaving">
                    {{ isSaving ? '保存中...' : '确认' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    isEditMode: { type: Boolean, default: false },
    exam: { type: Object, default: () => ({}) },
    employeeTypeOptions: { type: Array, default: () => [] },
    levelOptions: { type: Array, default: () => [] },
    isSaving: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'save'])

const localExam = ref({})
const selectedQuestionFile = ref(null)
const selectedAnswerFile = ref(null)
const questionFileInput = ref(null)
const answerFileInput = ref(null)

// 监听 exam 变化，同步到本地状态
watch(
    () => props.exam,
    (newExam) => {
        if (newExam) {
            localExam.value = { ...newExam }
        }
    },
    { immediate: true }
)

// 监听 visible 变化，重置状态
watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            if (!props.isEditMode) {
                // 新增模式，重置表单
                localExam.value = {
                    questionName: '',
                    questionType: '',
                    difficulty: '',
                    questionBankType: ''
                }
                selectedQuestionFile.value = null
                selectedAnswerFile.value = null
            }
        }
    }
)

// 触发文件选择
const triggerQuestionFileInput = () => {
    questionFileInput.value?.click()
}

const handleQuestionFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
        selectedQuestionFile.value = file
    }
}

const triggerAnswerFileInput = () => {
    answerFileInput.value?.click()
}

const handleAnswerFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
        selectedAnswerFile.value = file
    }
}

// 保存
const handleSave = () => {
    emit('save', {
        exam: localExam.value,
        questionFile: selectedQuestionFile.value,
        answerFile: selectedAnswerFile.value
    })
}
</script>

<style scoped>
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

.form-group .required {
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

.upload-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-footer {
    padding: 10px 24px;
    text-align: right;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: center;
    gap: 8px;
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
</style>
