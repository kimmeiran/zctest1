<template>
    <div class="modal-overlay" v-if="visible">
        <div class="modal-container" style="width:800px;max-width:95%;" @click.stop>
            <div class="modal-header">
                <h3>{{ isEditMode ? '编辑题目' : '新增题目' }}</h3>
            </div>
            <div class="modal-body">
                <div class="form-section">
                    <BaseInfoSelect :form="form" />
                </div>

                <div class="form-section">
                    <QuestionContent :form="form" @open-preview="openPreview" />
                </div>

                <div class="form-section">
                    <div class="form-group">
                    <label>答案</label>

                    <!-- 单选题和多选题显示选项输入框 -->
                    <div v-if="form.questionType === '1' || form.questionType === 1 ||
                        form.questionType === '2' || form.questionType === 2">
                        <div class="options-input-group">
                            <div class="option-input-item">
                                <label class="option-label">A.</label>
                                <textarea class="form-input option-input" v-model="form.answera" rows="2"
                                    placeholder="请输入选项A内容"></textarea>
                                <div class="image-upload-compact">
                                    <input type="file" accept="image/*" @change="(e)=>handleOptionImageChange(0,e)" style="display:none;"
                                        :ref="el => optionFileInputs[0] = el" />
                                    <div v-if="optionImagesPreview[0]" class="image-thumb" @click="openPreview(optionImagesPreview[0])">
                                        <img :src="optionImagesPreview[0]" alt="A选项图片" />
                                        <button class="image-remove-btn" @click.stop="removeOptionImage(0)">×</button>
                                    </div>
                                    <div v-else class="upload-square" @click="triggerOptionImage(0)">
                                        <span class="upload-plus">+</span>
                                    </div>
                                </div>
                            </div>
                            <div class="option-input-item">
                                <label class="option-label">B.</label>
                                <textarea class="form-input option-input" v-model="form.answerb" rows="2"
                                    placeholder="请输入选项B内容"></textarea>
                                <div class="image-upload-compact">
                                    <input type="file" accept="image/*" @change="(e)=>handleOptionImageChange(1,e)" style="display:none;"
                                        :ref="el => optionFileInputs[1] = el" />
                                    <div v-if="optionImagesPreview[1]" class="image-thumb" @click="openPreview(optionImagesPreview[1])">
                                        <img :src="optionImagesPreview[1]" alt="B选项图片" />
                                        <button class="image-remove-btn" @click.stop="removeOptionImage(1)">×</button>
                                    </div>
                                    <div v-else class="upload-square" @click="triggerOptionImage(1)">
                                        <span class="upload-plus">+</span>
                                    </div>
                                </div>
                            </div>
                            <div class="option-input-item">
                                <label class="option-label">C.</label>
                                <textarea class="form-input option-input" v-model="form.answerc" rows="2"
                                    placeholder="请输入选项C内容"></textarea>
                                <div class="image-upload-compact">
                                    <input type="file" accept="image/*" @change="(e)=>handleOptionImageChange(2,e)" style="display:none;"
                                        :ref="el => optionFileInputs[2] = el" />
                                    <div v-if="optionImagesPreview[2]" class="image-thumb" @click="openPreview(optionImagesPreview[2])">
                                        <img :src="optionImagesPreview[2]" alt="C选项图片" />
                                        <button class="image-remove-btn" @click.stop="removeOptionImage(2)">×</button>
                                    </div>
                                    <div v-else class="upload-square" @click="triggerOptionImage(2)">
                                        <span class="upload-plus">+</span>
                                    </div>
                                </div>
                            </div>
                            <div class="option-input-item">
                                <label class="option-label">D.</label>
                                <textarea class="form-input option-input" v-model="form.answerd" rows="2"
                                    placeholder="请输入选项D内容"></textarea>
                                <div class="image-upload-compact">
                                    <input type="file" accept="image/*" @change="(e)=>handleOptionImageChange(3,e)" style="display:none;"
                                        :ref="el => optionFileInputs[3] = el" />
                                    <div v-if="optionImagesPreview[3]" class="image-thumb" @click="openPreview(optionImagesPreview[3])">
                                        <img :src="optionImagesPreview[3]" alt="D选项图片" />
                                        <button class="image-remove-btn" @click.stop="removeOptionImage(3)">×</button>
                                    </div>
                                    <div v-else class="upload-square" @click="triggerOptionImage(3)">
                                        <span class="upload-plus">+</span>
                                    </div>
                                </div>
                            </div>
                            <div class="option-input-item">
                                <label class="option-label">E.</label>
                                <textarea class="form-input option-input" v-model="form.answere" rows="2"
                                    placeholder="请输入选项E内容"></textarea>
                                <div class="image-upload-compact">
                                    <input type="file" accept="image/*" @change="(e)=>handleOptionImageChange(4,e)" style="display:none;"
                                        :ref="el => optionFileInputs[4] = el" />
                                    <div v-if="optionImagesPreview[4]" class="image-thumb" @click="openPreview(optionImagesPreview[4])">
                                        <img :src="optionImagesPreview[4]" alt="E选项图片" />
                                        <button class="image-remove-btn" @click.stop="removeOptionImage(4)">×</button>
                                    </div>
                                    <div v-else class="upload-square" @click="triggerOptionImage(4)">
                                        <span class="upload-plus">+</span>
                                    </div>
                                </div>
                            </div>
                            <div class="option-input-item">
                                <label class="option-label">F.</label>
                                <textarea class="form-input option-input" v-model="form.answerf" rows="2"
                                    placeholder="请输入选项F内容"></textarea>
                                <div class="image-upload-compact">
                                    <input type="file" accept="image/*" @change="(e)=>handleOptionImageChange(5,e)" style="display:none;"
                                        :ref="el => optionFileInputs[5] = el" />
                                    <div v-if="optionImagesPreview[5]" class="image-thumb" @click="openPreview(optionImagesPreview[5])">
                                        <img :src="optionImagesPreview[5]" alt="F选项图片" />
                                        <button class="image-remove-btn" @click.stop="removeOptionImage(5)">×</button>
                                    </div>
                                    <div v-else class="upload-square" @click="triggerOptionImage(5)">
                                        <span class="upload-plus">+</span>
                                    </div>
                                </div>
                            </div>
                            <div class="option-input-item">
                                <label class="option-label">G.</label>
                                <textarea class="form-input option-input" v-model="form.answerg" rows="2"
                                    placeholder="请输入选项G内容"></textarea>
                                <div class="image-upload-compact">
                                    <input type="file" accept="image/*" @change="(e)=>handleOptionImageChange(6,e)" style="display:none;"
                                        :ref="el => optionFileInputs[6] = el" />
                                    <div v-if="optionImagesPreview[6]" class="image-thumb" @click="openPreview(optionImagesPreview[6])">
                                        <img :src="optionImagesPreview[6]" alt="G选项图片" />
                                        <button class="image-remove-btn" @click.stop="removeOptionImage(6)">×</button>
                                    </div>
                                    <div v-else class="upload-square" @click="triggerOptionImage(6)">
                                        <span class="upload-plus">+</span>
                                    </div>
                                </div>
                            </div>
                            <div class="option-input-item">
                                <label class="option-label">H.</label>
                                <textarea class="form-input option-input" v-model="form.answerh" rows="2"
                                    placeholder="请输入选项H内容"></textarea>
                                <div class="image-upload-compact">
                                    <input type="file" accept="image/*" @change="(e)=>handleOptionImageChange(7,e)" style="display:none;"
                                        :ref="el => optionFileInputs[7] = el" />
                                    <div v-if="optionImagesPreview[7]" class="image-thumb" @click="openPreview(optionImagesPreview[7])">
                                        <img :src="optionImagesPreview[7]" alt="H选项图片" />
                                        <button class="image-remove-btn" @click.stop="removeOptionImage(7)">×</button>
                                    </div>
                                    <div v-else class="upload-square" @click="triggerOptionImage(7)">
                                        <span class="upload-plus">+</span>
                                    </div>
                                </div>
                            </div>
                            <div class="option-input-item">
                                <label class="option-label">I.</label>
                                <textarea class="form-input option-input" v-model="form.answeri" rows="2"
                                    placeholder="请输入选项I内容"></textarea>
                                <div class="image-upload-compact">
                                    <input type="file" accept="image/*" @change="(e)=>handleOptionImageChange(8,e)" style="display:none;"
                                        :ref="el => optionFileInputs[8] = el" />
                                    <div v-if="optionImagesPreview[8]" class="image-thumb" @click="openPreview(optionImagesPreview[8])">
                                        <img :src="optionImagesPreview[8]" alt="I选项图片" />
                                        <button class="image-remove-btn" @click.stop="removeOptionImage(8)">×</button>
                                    </div>
                                    <div v-else class="upload-square" @click="triggerOptionImage(8)">
                                        <span class="upload-plus">+</span>
                                    </div>
                                </div>
                            </div>
                            <div class="option-input-item">
                                <label class="option-label">J.</label>
                                <textarea class="form-input option-input" v-model="form.answerj" rows="2"
                                    placeholder="请输入选项J内容"></textarea>
                                <div class="image-upload-compact">
                                    <input type="file" accept="image/*" @change="(e)=>handleOptionImageChange(9,e)" style="display:none;"
                                        :ref="el => optionFileInputs[9] = el" />
                                    <div v-if="optionImagesPreview[9]" class="image-thumb" @click="openPreview(optionImagesPreview[9])">
                                        <img :src="optionImagesPreview[9]" alt="J选项图片" />
                                        <button class="image-remove-btn" @click.stop="removeOptionImage(9)">×</button>
                                    </div>
                                    <div v-else class="upload-square" @click="triggerOptionImage(9)">
                                        <span class="upload-plus">+</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 正确答案输入 -->
                        <div class="correct-answer-input">
                            <label class="correct-answer-label">正确答案:</label>
                            <!-- 单选题使用下拉选择 -->
                            <select v-if="form.questionType === '1' || form.questionType === 1"
                                class="form-select correct-answer-field" v-model="form.answer">
                                <option value="">请选择正确答案</option>
                                <option v-for="opt in availableOptionLetters" :key="opt" :value="opt">{{ opt }}</option>
                            </select>
                            <!-- 多选题使用复选框多选 -->
                            <div v-else-if="form.questionType === '2' || form.questionType === 2" class="multi-correct-wrapper">
                                <div class="checkbox-group">
                                    <label class="checkbox-item" v-for="opt in availableOptionLetters" :key="opt">
                                        <input type="checkbox" :value="opt" v-model="multiSelectAnswers" />
                                        <span>{{ opt }}</span>
                                    </label>
                                </div>
                                <div class="selected-hint">已选: {{ multiSelectAnswers.join(',') || '未选择' }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 判断题显示选项（与列表统一：A=√ 正确，B=✕ 错误；后端 0/1 在加载时已映射为 B/A） -->
                    <div v-else-if="form.questionType === '3' || form.questionType === 3">
                        <div class="judge-options">
                            <div class="judge-option">
                                <span class="option-label">A. √</span>
                            </div>
                            <div class="judge-option">
                                <span class="option-label">B. ✕</span>
                            </div>
                        </div>
                        <div class="correct-answer-input">
                            <label class="correct-answer-label">正确答案:</label>
                            <select class="form-select correct-answer-field" v-model="form.answer">
                                <option value="">请选择正确答案</option>
                                <option value="A">A. √</option>
                                <option value="B">B. ✕</option>
                            </select>
                        </div>
                    </div>

                    <!-- 填空题显示多个填空输入框 -->
                    <div v-else-if="form.questionType === '0' || form.questionType === 0">
                        <div class="fill-blank-answers">
                            <div class="fill-blank-header">
                                <label>填空答案：</label>
                                <button type="button" class="btn btn-secondary btn-sm"
                                    @click="addFillBlank">添加填空</button>
                            </div>
                            <div class="fill-blank-list">
                                <div v-for="(blank, index) in fillBlankAnswers" :key="index" class="fill-blank-item">
                                    <span class="blank-number">{{ index + 1 }}.</span>
                                    <input type="text" class="form-input blank-input" v-model="fillBlankAnswers[index]"
                                        :placeholder="`第${index + 1}个填空的答案`" />
                                    <button type="button" class="btn btn-danger btn-sm" @click="removeFillBlank(index)"
                                        v-if="fillBlankAnswers.length > 1">删除</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 其他题型显示普通答案输入框 -->
                    <div v-else>
                        <textarea class="form-input" v-model="form.answer" rows="4" placeholder="请输入答案"></textarea>
                    </div>

                    <!-- 答案图片上传（支持多图，逗号分隔到 form.answer_image） -->
                    <div class="question-images-section">
                        <div class="question-images-header">
                            <label>答案图片 (支持多张)</label>
                            <div class="usage-tip">
                                <span class="tip-icon">📎</span>
                                <span class="tip-text">上传答案相关的辅助图片，显示在答案区域</span>
                            </div>
                        </div>
                        <div class="question-images-container">
                            <div 
                                v-for="(image, index) in answerImages" 
                                :key="index" 
                                class="question-image-item"
                            >
                                <div class="question-image-thumb" @click="openPreview(image.url)">
                                    <img 
                                        :src="image.url" 
                                        :alt="`答案图片${index + 1}`"
                                        :style="{ width: image.width ? `${image.width}px` : 'auto', height: image.height ? `${image.height}px` : 'auto' }"
                                    />
                                    <button class="image-remove-btn" @click.stop="removeAnswerImage(index)">×</button>
                                </div>
                                <div class="question-image-info">
                                    <span class="image-index">图片 {{ index + 1 }}</span>
                                    <span v-if="image.width && image.height" class="image-size">{{ image.width }}×{{ image.height }}</span>
                                </div>
                            </div>
                            <div class="upload-square" @click="addAnswerImage">
                                <span class="upload-plus">+</span>
                            </div>
                        </div>
                        <input type="file" accept="image/*" @change="handleAnswerImage" style="display:none;" ref="answerImagesInput" />
                    </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" @click="handleCancel">取消</button>
                <button class="btn btn-primary" @click="handleSubmit">{{ isEditMode ? '保存' : '新增' }}</button>
            </div>
        </div>
        <!-- 图片预览 -->
        <div v-if="previewVisible" class="image-preview-overlay" @click="closePreview">
            <img :src="previewSrc" alt="预览图片" class="image-preview" />
        </div>
    </div>
</template>

<script setup>
import BaseInfoSelect from '@/views/question/editQuestion/BaseInfoSelect.vue'
import QuestionContent from '@/views/question/editQuestion/QuestionContent.vue'
import { ref, watch, computed, nextTick } from 'vue'
import { uploadImage, getImageUrl, fetchImageAsBlobUrl, validateImageFile } from '@/api/imageUpload.js'

const props = defineProps({
    visible: { type: Boolean, default: false },
    form: { type: Object, required: true },
    isEditMode: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])

// 监听题目类型变化（放在依赖的变量声明之后）

const questionImageInput = ref(null)
const answerImageInput = ref(null) // 旧的单图输入保留以兼容
// 答案图片（多图，对齐 QuestionContent.vue 结构）
const answerImagesInput = ref(null)
// 形如：[{ path, url, index }]
const answerImages = ref([])
// 选项图片：10个位置（A-J）
const optionImages = ref(Array(10).fill('')) // 用于提交给后端的路径
const optionImagesPreview = ref(Array(10).fill('')) // 预览全路径
const optionFileInputs = ref([])
// 预览
const previewVisible = ref(false)
const previewSrc = ref('')
const openPreview = (src) => {
    previewSrc.value = src
    previewVisible.value = true
}
const closePreview = () => {
    previewVisible.value = false
    previewSrc.value = ''
}

// 单/多选题选项字母
const optionLetters = ['A','B','C','D','E','F','G','H','I','J']

// 多选题选中项
const multiSelectAnswers = ref([])

// 获取某个选项的内容
const getOptionContent = (letter) => {
    const map = {
        A: props.form.answera,
        B: props.form.answerb,
        C: props.form.answerc,
        D: props.form.answerd,
        E: props.form.answere,
        F: props.form.answerf,
        G: props.form.answerg,
        H: props.form.answerh,
        I: props.form.answeri,
        J: props.form.answerj,
    }
    return map[letter]
}

// 规范化图片路径：支持完整URL与相对路径（异步，使用 fetchImageAsBlobUrl 带 Authorization 请求头）
const normalizeImageUrl = async (val) => {
    if (!val) return ''
    const trimmed = String(val).trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed) || /^blob:/i.test(trimmed)) return trimmed
    return await fetchImageAsBlobUrl(trimmed)
}

// 打开时确保根据 form.option_images 还原本地预览
const ensureOptionImagesPreview = async () => {
    const str = props.form.option_images || ''
    const arr = str.split(',')
    for (let i = 0; i < 10; i++) {
        const raw = arr[i] || ''
        const val = String(raw).trim()
        optionImages.value[i] = val
        optionImagesPreview.value[i] = await normalizeImageUrl(val)
    }
}

// 可用（已填写内容）的选项字母
const availableOptionLetters = computed(() => {
    return optionLetters.filter(l => {
        const v = getOptionContent(l)
        return v !== undefined && v !== null && String(v).trim() !== ''
    })
})

// 当选项内容发生变化时，清理不合法的已选答案
watch(() => [
    props.form.answera,
    props.form.answerb,
    props.form.answerc,
    props.form.answerd,
    props.form.answere,
    props.form.answerf,
    props.form.answerg,
    props.form.answerh,
    props.form.answeri,
    props.form.answerj,
], () => {
    const avail = new Set(availableOptionLetters.value)
    // 单选：若当前答案不在可用集合中，则清空
    if (props.form.questionType === '1' || props.form.questionType === 1) {
        if (props.form.answer && !avail.has(props.form.answer)) {
            props.form.answer = ''
        }
    }
    // 多选：过滤无效选项
    if (props.form.questionType === '2' || props.form.questionType === 2) {
        // 若当前多选未初始化但表单已有答案，优先用表单答案初始化勾选，避免覆盖为空
        const hasFormAnswer = typeof props.form.answer === 'string' && props.form.answer.trim() !== ''
        const hasAnySelected = Array.isArray(multiSelectAnswers.value) && multiSelectAnswers.value.length > 0

        if (!hasAnySelected && hasFormAnswer) {
            const parsed = (props.form.answer || '').split(',').map(s => s.trim()).filter(s => s && avail.has(s))
            multiSelectAnswers.value = parsed
            
            return
        }

        multiSelectAnswers.value = (multiSelectAnswers.value || []).filter(v => avail.has(v))
        if (Array.isArray(multiSelectAnswers.value) && multiSelectAnswers.value.length > 0) {
            props.form.answer = (multiSelectAnswers.value || []).join(',')
        }
    }
}, { immediate: true })

// 填空题答案数组
const fillBlankAnswers = ref([''])

// 题目图片上传逻辑已迁移至 QuestionContent 子组件

// 触发答案图片上传（旧单图，保留兼容，不在模板中使用）
const triggerAnswerImageLegacy = () => {
    answerImageInput.value?.click()
}

// 处理答案图片上传（旧单图，保留兼容，不在模板中使用）
const handleAnswerImageLegacy = async (event) => {
    const file = event.target.files[0]
    if (file) {
        // 验证文件
        const validation = validateImageFile(file)
        if (!validation.valid) {
            alert(validation.message)
            return
        }

        // 上传图片
        const result = await uploadImage(file)
        if (result.success) {
            // 上传成功，设置图片URL和路径
            const fullImageUrl = getFullImageUrl(result.data)
            props.form._answerImageUrl = fullImageUrl // 使用完整的图片URL
            props.form.answerImagePath = result.data // 保存原始URL路径
            // 提交给后端的字段
            props.form.answerImage = result.data
            console.log('答案图片上传成功:', result.data)
            console.log('完整图片URL:', fullImageUrl)
        } else {
            alert(result.message)
        }
    }
}

// 移除答案图片（旧单图，保留兼容，不在模板中使用）
const removeAnswerImageLegacy = () => {
    props.form._answerImageUrl = null
    props.form.answerImagePath = null // 清除服务器路径
    props.form.answerImage = ""
    if (answerImageInput.value) {
        answerImageInput.value.value = ''
    }
}

// ===== 答案图片（多图）逻辑（参考 QuestionContent.vue） =====
const addAnswerImage = () => {
    answerImagesInput.value?.click()
}

const handleAnswerImage = async (event) => {
    const file = event?.target?.files?.[0]
    if (file) {
        const validation = validateImageFile(file)
        if (!validation.valid) {
            alert(validation.message)
            // 清理 input 值，避免多次选择同一文件无效
            if (answerImagesInput.value) answerImagesInput.value.value = ''
            return
        }
        try {
            const result = await uploadImage(file)
            if (result.success) {
                const blobUrl = await fetchImageAsBlobUrl(result.data)
                answerImages.value.push({
                    path: result.data,
                    url: blobUrl,
                    width: result.width || null,
                    height: result.height || null,
                    index: answerImages.value.length
                })
            } else {
                alert(result.message)
            }
        } catch (e) {
            console.error('上传答案图片失败:', e)
            alert('上传失败，请重试')
        }
    }
    if (answerImagesInput.value) answerImagesInput.value.value = ''
}

const removeAnswerImage = (index) => {
    answerImages.value.splice(index, 1)
    // 重排索引
    answerImages.value.forEach((img, idx) => {
        img.index = idx
    })
}

// 将答案图片数组同步到表单字段（JSON 数组字符串，含 url/width/height）
watch(answerImages, (newImages) => {
    const imageArray = (newImages || []).map(img => ({ url: img.path, width: img.width, height: img.height }))
    props.form.answer_image = JSON.stringify(imageArray)
}, { deep: true })

const ensureAnswerImagesPreview = async () => {
    const raw = String(props.form.answer_image || '').trim()
    if (!raw) { answerImages.value = []; return }
    let items = []
    if (raw.startsWith('[')) {
        try {
            const arr = JSON.parse(raw)
            const paths = arr.map(item => item.url || item.path || item)
            const urls = await Promise.all(paths.map(p => fetchImageAsBlobUrl(p)))
            items = arr.map((item, idx) => ({
                path: item.url || item.path || item,
                url: urls[idx] || '',
                width: item.width || null,
                height: item.height || null,
                index: idx
            }))
        } catch {
            const paths = raw.split(',').filter(p => p.trim()).map(p => p.trim())
            const urls = await Promise.all(paths.map(p => fetchImageAsBlobUrl(p)))
            items = paths.map((p, idx) => ({
                path: p,
                url: urls[idx] || '',
                width: null,
                height: null,
                index: idx
            }))
        }
    } else {
        const paths = raw.split(',').filter(p => p.trim()).map(p => p.trim())
        const urls = await Promise.all(paths.map(p => fetchImageAsBlobUrl(p)))
        items = paths.map((p, idx) => ({
            path: p,
            url: urls[idx] || '',
            width: null,
            height: null,
            index: idx
        }))
    }
    answerImages.value = items
}

// 触发某个选项图片上传
const triggerOptionImage = (idx) => {
    const input = optionFileInputs.value?.[idx]
    if (input && typeof input.click === 'function') input.click()
}

// 处理选项图片上传
const handleOptionImageChange = async (idx, event) => {
    const file = event?.target?.files?.[0]
    if (!file) return
    const validation = validateImageFile(file)
    if (!validation.valid) {
        alert(validation.message)
        return
    }
    const result = await uploadImage(file)
    if (result.success) {
        const blobUrl = await fetchImageAsBlobUrl(result.data)
        // 存储路径、预览 URL、以及尺寸（供后续 JSON 序列化）
        optionImages.value[idx] = result.data || ''
        optionImagesPreview.value[idx] = blobUrl || ''
        // 同步到表单字符串字段（以逗号分隔，保持空位；选项图片暂不存 width/height，仅路径）
        syncOptionImagesToForm()
    } else {
        alert(result.message)
    }
}

// 移除某个选项图片
const removeOptionImage = (idx) => {
    optionImages.value[idx] = ''
    optionImagesPreview.value[idx] = ''
    const input = optionFileInputs.value?.[idx]
    if (input) input.value = ''
    syncOptionImagesToForm()
}

// 工具：检测是否存在非空图片
const hasNonEmptyImage = (str) => {
    if (!str) return false
    return str.split(',').some(s => String(s).trim() !== '')
}
const arrayHasNonEmptyImage = (arr) => {
    if (!Array.isArray(arr)) return false
    return arr.some(s => String(s || '').trim() !== '')
}

// 将 optionImages 数组同步到 form.option_images 字段
const syncOptionImagesToForm = () => {
    // 只在单选/多选时生效
    if (props.form.questionType === '1' || props.form.questionType === 1 || props.form.questionType === '2' || props.form.questionType === 2) {
        // 若当前本地数组全空，但表单里已有非空的服务器值，避免覆盖（等待回显初始化）
        if (!arrayHasNonEmptyImage(optionImages.value) && hasNonEmptyImage(props.form.option_images)) {
            console.log('[AddQuestionModal] skip writing option_images to avoid overwriting server value')
            return
        }
        // 与A-J对齐，数组长度固定10，空位保持空字符串
        const arr = (optionImages.value || []).slice(0, 10)
        while (arr.length < 10) arr.push('')
        props.form.option_images = arr.join(',')
    }
}

// 当题型、选项内容变化时，同步或重置图片数组长度
watch(() => props.form.questionType, () => {
    // 切换题型时，同步一次
    syncOptionImagesToForm()
}, { immediate: true })

// 当关闭或重置时，由外层控制，本组件在提交/取消不做清空以避免编辑态丢失。

// 添加填空
const addFillBlank = () => {
    fillBlankAnswers.value.push('')
}

// 删除填空
const removeFillBlank = (index) => {
    fillBlankAnswers.value.splice(index, 1)
}

// 处理填空题答案
const processFillBlankAnswer = () => {
    if (props.form.questionType === '0' || props.form.questionType === 0) {
        // 过滤空答案，并用逗号连接
        const validAnswers = fillBlankAnswers.value.filter(answer => answer.trim() !== '')
        props.form.answer = validAnswers.join(',')
    }
}

// 处理多选题答案
const processMultiSelectAnswer = () => {
    if (props.form.questionType === '2' || props.form.questionType === 2) {
        const selected = Array.isArray(multiSelectAnswers.value) ? multiSelectAnswers.value : []
        props.form.answer = selected.join(',')
    }
}

// 同步：当勾选项变化时，实时更新 form.answer（仅多选题）
watch(multiSelectAnswers, (val) => {
    if (props.form.questionType === '2' || props.form.questionType === 2) {
        props.form.answer = (val || []).join(',')
    }
}, { deep: true })

// 清空表单与本地缓存
const resetFormState = () => {
    // 基础信息
    props.form.questionType = ''
    props.form.domain = ''
    props.form.easeOrDifficulty = ''
    props.form.importance = ''

    // 题目内容
    props.form.questionContent = ''
    props.form.question_content_images = '' // 重置题目内容图片

    // 题目图片
    props.form._attachedImageUrl = null
    props.form.attachedImagePath = null
    props.form.attachedImage = ''
    if (questionImageInput.value) questionImageInput.value.value = ''

    // 答案图片
    props.form._answerImageUrl = null
    props.form.answerImagePath = null
    props.form.answerImage = ''
    if (answerImageInput.value) answerImageInput.value.value = ''
    // 新增：多图答案图片
    props.form.answer_image = ''
    answerImages.value = []
    if (answerImagesInput.value) answerImagesInput.value.value = ''

    // 选项内容 A-J
    props.form.answera = ''
    props.form.answerb = ''
    props.form.answerc = ''
    props.form.answerd = ''
    props.form.answere = ''
    props.form.answerf = ''
    props.form.answerg = ''
    props.form.answerh = ''
    props.form.answeri = ''
    props.form.answerj = ''

    // 选项图片缓存与表单映射
    for (let i = 0; i < 10; i++) {
        optionImages.value[i] = ''
        optionImagesPreview.value[i] = ''
        const input = optionFileInputs.value?.[i]
        if (input) input.value = ''
    }
    props.form.option_images = ''

    // 答案与中间态
    props.form.answer = ''
    multiSelectAnswers.value = []
    fillBlankAnswers.value = ['']
}

// 取消
const handleCancel = () => {
    resetFormState()
    emit('close')
}

// 提交
const handleSubmit = () => {
    // 处理填空题答案
    processFillBlankAnswer()
    // 处理多选题答案
    processMultiSelectAnswer()
    // 确保将路径字段赋值到提交字段
    if (props.form.attachedImagePath && !props.form.attachedImage) {
        props.form.attachedImage = props.form.attachedImagePath
    }
    if (props.form.answerImagePath && !props.form.answerImage) {
        props.form.answerImage = props.form.answerImagePath
    }
    // 多图答案图片由 watch(answerImages) 实时同步，无需额外处理
    // 最终再同步一次选项图片串
    syncOptionImagesToForm()
    emit('submit')
}

// 放在依赖声明之后再注册题型监听，避免未初始化变量报错
watch(() => props.form.questionType, (newType) => {
    // 判断题：后端可能为 0/1，统一映射为 A/B 以便与列表展示一致（A=√正确，B=✕错误）
    if (newType === '3' || newType === 3) {
        const a = props.form.answer
        if (a === 0 || a === '0') props.form.answer = 'B'
        else if (a === 1 || a === '1') props.form.answer = 'A'
    }
    if (newType === '0' || newType === 0) {
        if (props.form.answer && props.form.answer.includes(',')) {
            fillBlankAnswers.value = props.form.answer.split(',').filter(answer => answer.trim() !== '')
        } else if (props.form.answer) {
            fillBlankAnswers.value = [props.form.answer]
        } else {
            fillBlankAnswers.value = ['']
        }
    } else if (newType === '2' || newType === 2) {
        if (props.form.answer && typeof props.form.answer === 'string') {
            multiSelectAnswers.value = props.form.answer.split(',').map(s => s.trim()).filter(Boolean)
            
        } else if (Array.isArray(props.form.answer)) {
            multiSelectAnswers.value = props.form.answer
            
        } else {
            multiSelectAnswers.value = []
            
        }
    }

    if (newType === '1' || newType === 1 || newType === '2' || newType === 2) {
        const str = props.form.option_images || ''
        const arr = str.split(',')
        for (let i = 0; i < 10; i++) {
            const val = arr[i] || ''
            optionImages.value[i] = val
            optionImagesPreview.value[i] = val ? getFullImageUrl(val) : ''
        }
        syncOptionImagesToForm()
    } else {
        for (let i = 0; i < 10; i++) {
            optionImages.value[i] = ''
            optionImagesPreview.value[i] = ''
        }
        // 非单/多选时不强制清空后端传入的 form.option_images，避免覆盖回显
    }
}, { immediate: true })

// 监听弹窗可见性，打开时初始化选项图片预览
watch(() => props.visible, async (val) => {
    if (val) {
        // 判断题：后端可能为 0/1，统一映射为 A/B（A=√，B=✕）
        if (props.form.questionType === '3' || props.form.questionType === 3) {
            const a = props.form.answer
            if (a === 0 || a === '0') props.form.answer = 'B'
            else if (a === 1 || a === '1') props.form.answer = 'A'
        }
        // 优先从后端传入的 form.option_images 初始化
        ensureOptionImagesPreview()
        await nextTick()
        ensureOptionImagesPreview()
        // 回显答案图片（多图）
        ensureAnswerImagesPreview()
        // 若是多选题，确保根据 answer 初始化多选选中项
        if (props.form.questionType === '2' || props.form.questionType === 2) {
            if (props.form.answer && typeof props.form.answer === 'string') {
                multiSelectAnswers.value = props.form.answer.split(',').map(s => s.trim()).filter(Boolean)
            } else if (Array.isArray(props.form.answer)) {
                multiSelectAnswers.value = props.form.answer
            } else {
                multiSelectAnswers.value = []
            }
            
        }
    }
})

// 当父层把 option_images 赋进来时，立即解析预览（防止时序导致的空串）
watch(() => props.form.option_images, () => {
    ensureOptionImagesPreview()
})

// 监听 answer_image 变化，重新加载答案图片（用于编辑模式切换题目）
watch(() => props.form.answer_image, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        ensureAnswerImagesPreview()
    }
})
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
    max-height: 90vh;
    display: flex;
    flex-direction: column;
}

.modal-header {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
}

.modal-body {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
}

/* 表单区域样式 - 创建整体感 */
.form-section {
    background: #fafafa;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
}

.form-section:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
    border-color: #d9d9d9;
}

.form-section:last-child {
    margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .modal-container {
        width: 95% !important;
        margin: 10px;
    }
    
    .form-section {
        padding: 16px;
        margin-bottom: 12px;
    }
    
    .modal-body {
        padding: 12px;
    }
}

.form-group {
    margin-bottom: 12px;
}

.form-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

/* 4 列布局 */
.form-row-4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px 12px;
}

.form-col {
    flex: 1;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
}

.form-input,
.form-select {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    box-sizing: border-box;
}

.options-input-group {
    margin-bottom: 16px;
}

.option-input-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.option-label {
    min-width: 20px;
    font-weight: 500;
    margin-top: 0;
}

.option-input {
    flex: 1;
    min-height: 72px;
}

.correct-answer-input {
    margin-top: 16px;
}

.correct-answer-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
}

.correct-answer-field {
    width: 100%;
}

/* 多选正确答案样式优化 */
.multi-correct-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.checkbox-group {
    display: grid;
    grid-template-columns: repeat(5, minmax(40px, 1fr));
    gap: 8px 12px;
}

.checkbox-item {
    display: flex;
    align-items: center;
    gap: 0px;
    user-select: none;
}

/* 兜底：确保复选框与文字有间距（即便浏览器不支持 flex-gap） */
.checkbox-item input[type="checkbox"] {
    margin-right: 8px;
}

.checkbox-item .checkbox-text {
    margin-left: 4px;
}

.selected-hint {
    color: #666;
    font-size: 12px;
}

.judge-options {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
}

.judge-option {
    padding: 8px 16px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    background-color: #f9f9f9;
}

.fill-blank-answers {
    margin-top: 16px;
}

.fill-blank-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.fill-blank-header label {
    font-weight: 500;
    margin: 0;
}

.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
}

.btn-danger {
    background-color: #ff4d4f;
    color: white;
}

.btn-danger:hover {
    background-color: #ff7875;
}

.fill-blank-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.fill-blank-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.blank-number {
    min-width: 24px;
    font-weight: 500;
    color: #666;
}

.blank-input {
    flex: 1;
    min-width: 0;
}

.modal-footer {
    padding: 10px 24px;
    text-align: right;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: center;
    gap: 8px;
    position: sticky;
    bottom: 0;
    background: #fff;
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

/* 答案图片区域样式（对齐 QuestionContent.vue） */
.question-images-section {
    margin-top: 15px;
    padding: 15px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    background-color: #fafafa;
}

.question-images-header {
    margin-bottom: 12px;
}

.question-images-header label {
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
    display: block;
}

.usage-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    font-size: 13px;
    color: #0369a1;
}

.tip-icon {
    font-size: 14px;
    flex-shrink: 0;
}

.tip-text {
    line-height: 1.4;
}

.question-images-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
}

.question-image-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.question-image-thumb {
    max-width: 200px;
    max-height: 150px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9f9f9;
}

.question-image-thumb:hover {
    transform: scale(1.02);
}

.question-image-thumb img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
}

.question-image-info {
    text-align: center;
    font-size: 12px;
    color: #666;
}

.question-image-info .image-size {
    display: block;
    color: #999;
    font-size: 11px;
    margin-top: 2px;
}

.image-index {
    font-size: 12px;
    color: #666;
    font-weight: 500;
}

/* 覆盖仅用于答案图片区域的上传方块与删除按钮，保持与 QuestionContent.vue 一致 */
.question-images-section .upload-square {
    width: 80px;
    height: 80px;
    border: 2px dashed #c0c4cc;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #fafafa;
}

.question-images-section .upload-square:hover {
    border-color: #c70019;
    color: #c70019;
    background-color: #fff5f5;
}

.question-image-thumb .image-remove-btn {
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    line-height: 18px;
    background: rgba(0,0,0,0.6);
    font-size: 12px;
}

.question-images-section .upload-plus {
    font-size: 28px;
    line-height: 1;
    font-weight: 300;
}

/* 紧凑图片上传区域 */
.image-upload-compact {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
}

.image-actions {
    display: flex;
    gap: 6px;
}

.image-thumb {
    width: 72px;
    height: 72px;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    flex: 0 0 auto;
    position: relative;
}

.image-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.image-remove-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    line-height: 16px;
    border: none;
    border-radius: 50%;
    background: rgba(0,0,0,0.55);
    color: #fff;
    cursor: pointer;
    padding: 0;
}

.upload-square {
    width: 72px;
    height: 72px;
    border: 1px dashed #c0c4cc;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    cursor: pointer;
}

.upload-square:hover {
    border-color: #c70019;
    color: #c70019;
}

.upload-plus {
    font-size: 24px;
    line-height: 1;
}

/* 图片预览遮罩 */
.image-preview-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
}

.image-preview {
    max-width: 90vw;
    max-height: 90vh;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    border-radius: 4px;
}
</style>
