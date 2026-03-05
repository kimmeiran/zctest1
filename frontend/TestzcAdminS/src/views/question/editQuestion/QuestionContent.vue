<template>
    <div class="form-group">
        <label>题目内容</label>
        <textarea class="form-input content-input" v-model="form.questionContent" rows="3" placeholder="请输入题目内容"></textarea>
        
        <!-- 题目内容图片数组上传 -->
        <div class="content-images-section">
            <div class="content-images-header">
                <label>题目内容图片 (支持多张)</label>
                <div class="usage-tip">
                    <span class="tip-icon">💡</span>
                    <span class="tip-text">先上传图片，再在题目内容中使用 [img] 标签插入</span>
                </div>
            </div>
            
            <!-- 图片列表和上传区域 -->
            <div class="content-images-container">
                <!-- 图片列表 -->
                <div 
                    v-for="(image, index) in contentImages" 
                    :key="index" 
                    class="content-image-item"
                >
                    <div class="content-image-thumb" @click="emit('open-preview', image.url)">
                        <img 
                            :src="image.url" 
                            :alt="`内容图片${index + 1}`"
                            :style="{ width: image.width ? `${image.width}px` : 'auto', height: image.height ? `${image.height}px` : 'auto' }"
                        />
                        <button class="image-remove-btn" @click.stop="removeContentImage(index)">×</button>
                    </div>
                    <div class="content-image-info">
                        <span class="image-index">图片 {{ index + 1 }}</span>
                        <span v-if="image.width && image.height" class="image-size">{{ image.width }}×{{ image.height }}</span>
                    </div>
                </div>
                
                <!-- 上传正方形图标 -->
                <div class="upload-square" @click="addContentImage">
                    <span class="upload-plus">+</span>
                </div>
            </div>
            
            <!-- 图片数量校验提示 -->
            <div v-if="imageCountMismatch" class="validation-error">
                <span class="error-icon">⚠️</span>
                <span>题目内容中的[img]标签数量({{ imgTagCount }})与上传的图片数量({{ contentImages.length }})不一致，请检查！</span>
            </div>
        </div>


        <!-- 题目图片上传区域 -->
        <div class="question-images-section">
            <div class="question-images-header">
                <label>题目下方图片 (支持多张)</label>
                <div class="usage-tip">
                    <span class="tip-icon">📎</span>
                    <span class="tip-text">上传题目相关的辅助图片，显示在题目下方</span>
                </div>
            </div>
            
            <!-- 图片列表和上传区域 -->
            <div class="question-images-container">
                <!-- 图片列表 -->
                <div 
                    v-for="(image, index) in questionImages" 
                    :key="index" 
                    class="question-image-item"
                >
                    <div class="question-image-thumb" @click="emit('open-preview', image.url)">
                        <img 
                            :src="image.url" 
                            :alt="`题目图片${index + 1}`"
                            :style="{ width: image.width ? `${image.width}px` : 'auto', height: image.height ? `${image.height}px` : 'auto' }"
                        />
                        <button class="image-remove-btn" @click.stop="removeQuestionImage(index)">×</button>
                    </div>
                    <div class="question-image-info">
                        <span class="image-index">图片 {{ index + 1 }}</span>
                        <span v-if="image.width && image.height" class="image-size">{{ image.width }}×{{ image.height }}</span>
                    </div>
                </div>
                
                <!-- 上传正方形图标 -->
                <div class="upload-square" @click="addQuestionImage">
                    <span class="upload-plus">+</span>
                </div>
            </div>
        </div>
        
        <!-- 隐藏的文件输入框 -->
        <input type="file" accept="image/*" @change="handleContentImage" style="display:none;" ref="contentImageInput" />
        <input type="file" accept="image/*" @change="handleQuestionImage" style="display:none;" ref="questionImageInput" />
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { uploadImage, fetchImageAsBlobUrl, validateImageFile } from '@/api/imageUpload.js'

const props = defineProps({
    form: { type: Object, required: true }
})

const emit = defineEmits(['open-preview'])

const questionImageInput = ref(null)
const contentImageInput = ref(null)

// 题目图片数组
const questionImages = ref([])
// 题目内容图片数组
const contentImages = ref([])

// 计算题目内容中[img]标签的数量
const imgTagCount = computed(() => {
    if (!props.form.questionContent) return 0
    const matches = props.form.questionContent.match(/\[img\]/g)
    return matches ? matches.length : 0
})

// 检查图片数量是否匹配
const imageCountMismatch = computed(() => {
    return contentImages.value.length > 0 && imgTagCount.value !== contentImages.value.length
})

// 解析图片字段（兼容 JSON 数组字符串、CSV、数组）的通用函数（异步，使用 fetchImageAsBlobUrl 带 Authorization 请求头）
const parseImageField = async (val) => {
    if (!val) return []
    let items = []
    const processArr = (arr) => {
        const paths = arr.map((item) => (typeof item === 'object' && item && (item.url || item.path)) ? (item.url || item.path) : String(item || ''))
        return Promise.all(paths.map(p => fetchImageAsBlobUrl(p))).then(urls =>
            arr.map((item, index) => ({
                path: (typeof item === 'object' && item && (item.url || item.path)) ? (item.url || item.path) : String(item || ''),
                url: urls[index] || '',
                width: (typeof item === 'object' && item && item.width) ? item.width : null,
                height: (typeof item === 'object' && item && item.height) ? item.height : null,
                index
            }))
        )
    }
    if (Array.isArray(val) && val.length > 0) {
        items = await processArr(val)
    } else if (typeof val === 'string' && val.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(val)
            items = Array.isArray(arr) ? await processArr(arr) : []
        } catch {
            const paths = val.split(',').filter(p => p.trim()).map(p => p.trim())
            const urls = await Promise.all(paths.map(p => fetchImageAsBlobUrl(p)))
            items = paths.map((path, index) => ({ path, url: urls[index] || '', width: null, height: null, index }))
        }
    } else if (typeof val === 'string') {
        const paths = val.split(',').filter(p => p.trim()).map(p => p.trim())
        const urls = await Promise.all(paths.map(p => fetchImageAsBlobUrl(p)))
        items = paths.map((path, index) => ({ path, url: urls[index] || '', width: null, height: null, index }))
    }
    return items
}

// 加载题目图片（attached_image）
const loadQuestionImages = async () => {
    questionImages.value = await parseImageField(props.form.attached_image)
}

// 加载题目内容图片（question_content_images）
const loadContentImages = async () => {
    contentImages.value = await parseImageField(props.form.question_content_images)
}

// 初始化加载
loadQuestionImages()
loadContentImages()

// 监听表单字段变化，重新加载图片（用于编辑模式切换题目）
watch(() => props.form.attached_image, (newVal, oldVal) => {
    // 仅当外部赋值时重新加载（避免自己 watch 触发的循环）
    if (newVal !== oldVal && newVal !== JSON.stringify(questionImages.value.map(img => ({ url: img.path, width: img.width, height: img.height })))) {
        loadQuestionImages()
    }
})

watch(() => props.form.question_content_images, (newVal, oldVal) => {
    if (newVal !== oldVal && newVal !== JSON.stringify(contentImages.value.map(img => ({ url: img.path, width: img.width, height: img.height })))) {
        loadContentImages()
    }
})

// 监听题目图片数组变化，同步更新到表单的attached_image字段（JSON 数组字符串，含 url/width/height）
watch(questionImages, (newImages) => {
    const imageArray = newImages.map(img => ({ url: img.path, width: img.width, height: img.height }))
    props.form.attached_image = JSON.stringify(imageArray)
}, { deep: true })

// 监听题目内容图片变化，同步更新到表单（JSON 数组字符串，含 url/width/height）
watch(contentImages, (newImages) => {
    const imageArray = newImages.map(img => ({ url: img.path, width: img.width, height: img.height }))
    props.form.question_content_images = JSON.stringify(imageArray)
}, { deep: true })

// 添加题目图片
const addQuestionImage = () => {
    questionImageInput.value?.click()
}

// 处理题目图片上传（新接口返回 url + width + height）
const handleQuestionImage = async (event) => {
    const file = event.target.files[0]
    if (file) {
        const validation = validateImageFile(file)
        if (!validation.valid) {
            alert(validation.message)
            return
        }
        
        try {
            const result = await uploadImage(file)
            if (result.success) {
                const blobUrl = await fetchImageAsBlobUrl(result.data)
                questionImages.value.push({
                    path: result.data,
                    url: blobUrl,
                    width: result.width || null,
                    height: result.height || null,
                    index: questionImages.value.length
                })
            } else {
                alert(result.message)
            }
        } catch (error) {
            console.error('上传题目图片失败:', error)
            alert('上传失败，请重试')
        }
    }
    
    // 清空input值，允许重复选择同一文件
    if (questionImageInput.value) {
        questionImageInput.value.value = ''
    }
}

// 删除题目图片
const removeQuestionImage = (index) => {
    questionImages.value.splice(index, 1)
    // 重新设置索引
    questionImages.value.forEach((img, idx) => {
        img.index = idx
    })
}

// 添加题目内容图片
const addContentImage = () => {
    contentImageInput.value?.click()
}

// 处理题目内容图片上传（新接口返回 url + width + height）
const handleContentImage = async (event) => {
    const file = event.target.files[0]
    if (file) {
        const validation = validateImageFile(file)
        if (!validation.valid) {
            alert(validation.message)
            return
        }
        
        try {
            const result = await uploadImage(file)
            if (result.success) {
                const blobUrl = await fetchImageAsBlobUrl(result.data)
                contentImages.value.push({
                    path: result.data,
                    url: blobUrl,
                    width: result.width || null,
                    height: result.height || null,
                    index: contentImages.value.length
                })
            } else {
                alert(result.message)
            }
        } catch (error) {
            console.error('上传题目内容图片失败:', error)
            alert('上传失败，请重试')
        }
    }
    
    // 清空input值，允许重复选择同一文件
    if (contentImageInput.value) {
        contentImageInput.value.value = ''
    }
}

// 删除题目内容图片
const removeContentImage = (index) => {
    contentImages.value.splice(index, 1)
    // 重新设置索引
    contentImages.value.forEach((img, idx) => {
        img.index = idx
    })
}
</script>

<style scoped>
.form-group {
    margin-bottom: 0;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

/* 题目图片相关样式 */
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


.image-actions {
    display: flex;
    gap: 6px;
}

.image-thumb {
    width: 80px;
    height: 80px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    flex: 0 0 auto;
    position: relative;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
}

.image-thumb:hover {
    transform: scale(1.02);
}

.image-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.image-remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    line-height: 18px;
    border: none;
    border-radius: 50%;
    background: rgba(0,0,0,0.6);
    color: #fff;
    cursor: pointer;
    padding: 0;
    font-size: 12px;
    transition: background-color 0.2s ease;
}

.image-remove-btn:hover {
    background: rgba(0,0,0,0.8);
}

.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
}

/* 从父组件同步必要样式，确保子组件独立可用 */
.form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    box-sizing: border-box;
    font-size: 14px;
    background-color: #fff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    resize: vertical;
}

.form-input:focus {
    outline: none;
    border-color: #c70019;
    box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.1);
}

.form-input:hover {
    border-color: #bfbfbf;
}

.content-input {
    min-height: 80px;
    flex: 1;
}

.upload-square {
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

.upload-square:hover {
    border-color: #c70019;
    color: #c70019;
    background-color: #fff5f5;
}

.upload-plus {
    font-size: 28px;
    line-height: 1;
    font-weight: 300;
}

.btn {
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.btn-secondary {
    background-color: #f0f0f0;
    color: #333;
}

/* 题目内容图片相关样式 */
.content-images-section {
    margin-top: 15px;
    padding: 15px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    background-color: #fafafa;
}

.content-images-header {
    margin-bottom: 12px;
}

.content-images-header label {
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

.content-images-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
}

.content-image-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.content-image-thumb {
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

.content-image-thumb:hover {
    transform: scale(1.02);
}

.content-image-thumb img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
}

.content-image-info {
    text-align: center;
    font-size: 12px;
    color: #666;
}

.content-image-info .image-size {
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


.validation-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #dc2626;
    font-size: 14px;
    margin-top: 10px;
}

.error-icon {
    font-size: 16px;
    flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .content-input {
        min-height: 100px;
    }
    
    .usage-tip {
        font-size: 12px;
        padding: 6px 10px;
    }
    
    .tip-text {
        font-size: 12px;
    }
    
    .question-images-container,
    .content-images-container {
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .image-thumb,
    .upload-square,
    .question-image-thumb,
    .content-image-thumb {
        width: 60px;
        height: 60px;
    }
    
    .upload-plus {
        font-size: 20px;
    }
    
    .form-group label {
        font-size: 13px;
    }
    
    .form-input {
        padding: 8px 10px;
        font-size: 13px;
    }
    
    .question-images-section,
    .content-images-section {
        padding: 10px;
    }
    
}
</style>


