<template>
    <div>
        <div class="breadcrumb-line">
            <BreadcrumbNav :items="breadcrumbItems" />
        </div>
        <div class="action-row">
            <button
                v-if="(isQuestionExpert && canEditQuestions) || isAdminOrManager"
                class="btn-add"
                @click="openAddQuestionModal"
            >+ 新增题目</button>
            <button type="button" class="btn-back" @click="$emit('back')">返回</button>
        </div>
        <!-- 题目管理头部 -->
        <div class="question-manage-header">
            <div class="header-left">
                <div class="title-row">
                    <h3 style="margin:0;">题库：{{ examInfo.questionName }}</h3>
                    <!-- 统计信息展示（与题库同一排） -->
                    <div class="statistics-section statistics-inline">
                        <div class="statistics-grid">
                            <div class="stat-item">
                                <div class="stat-content">
                                    <span class="stat-label">基础知识</span>
                                    <span class="stat-value">{{ statistics.basicKnowledge }}</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-content">
                                    <span class="stat-label">职业道德</span>
                                    <span class="stat-value">{{ statistics.professionalEthics }}</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-content">
                                    <span class="stat-label">专业知识</span>
                                    <span class="stat-value">{{ statistics.professionalKnowledge }}</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-content">
                                    <span class="stat-label">相关知识</span>
                                    <span class="stat-value">{{ statistics.relatedKnowledge }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="header-sub">
                    <div style="color:#888;font-size:13px;">题目数量：{{ examInfo.questionCount }}，题库类型：{{ examInfo.questionBankType || '-' }}，创建时间：{{ examInfo.createTime }}</div>
                </div>
            </div>
        </div>

        <!-- 筛选条件 -->
        <div class="filter-section">
            <div class="filter-row">
                <div class="filter-item">
                    <label>关键字搜索：</label>
                    <input
                        type="text"
                        class="filter-input"
                        v-model.trim="filters.searchText"
                        placeholder="题目内容模糊搜索"
                    />
                </div>
                <div class="filter-item">
                    <label>题目类型：</label>
                    <select class="filter-select" v-model="filters.questionType">
                        <option value="">全部类型</option>
                        <option value="0">填空题</option>
                        <option value="1">单项选择题</option>
                        <option value="2">多项选择题</option>
                        <option value="3">判断题</option>
                        <option value="4">简答题</option>
                        <option value="5">综合题</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label>难易度：</label>
                    <select class="filter-select" v-model="filters.difficulty">
                        <option value="">全部难易度</option>
                        <option value="1">易</option>
                        <option value="2">较易</option>
                        <option value="3">中等</option>
                        <option value="4">较难</option>
                        <option value="5">难</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label>领域：</label>
                    <select class="filter-select" v-model="filters.domain">
                        <option value="">全部领域</option>
                        <option value="1">基础知识</option>
                        <option value="2">职业道德</option>
                        <option value="3">专业知识</option>
                        <option value="4">相关知识</option>
                        <option value="5">专业技能</option>
                        <option value="6">相关技能</option>
                    </select>
                </div>
                <div class="filter-item">
                    <button class="btn btn-primary" @click="applyFilter">查询</button>
                    <button class="btn btn-secondary" @click="clearFilter">清空</button>
                </div>
            </div>
        </div>

        <!-- 题目列表卡片式布局 -->
        <div class="questions-card-container">
            <div v-if="questions.length === 0" class="no-data">暂无题目</div>
            <div v-for="(question, index) in questions" :key="question.id" class="question-card-item">
                <div class="question-card-header">
                    <div class="question-card-meta">
                        <span class="question-number">序号: {{ (currentPage - 1) * pageSize + index + 1 }}</span>
                        <span class="question-type-badge">{{ formatQuestionType(question.questionType) }}</span>
                        <span class="question-difficulty-badge">{{ formatDifficulty(question.easeOrDifficulty) }}</span>
                        <span class="question-domain-badge">{{ formatDomain(question.domain) }}</span>
                        <span class="question-importance-badge">{{ formatImportance(question.importance) }}</span>
                        <span class="question-station-badge">{{ getStationName(question.stationId) }}</span>
                    </div>
                    <div class="question-card-actions">
                        <a href="#" v-if="canViewQuestions" @click.prevent="handleView(question)">查看</a>
                        <a href="#" v-if="(isQuestionExpert && canEditQuestions) || isAdminOrManager" @click.prevent="handleEdit(question)">编辑</a>
                        <a href="#" v-if="(isQuestionExpert && canEditQuestions) || isAdminOrManager" style="color:#ff4d4f;"
                            @click.prevent="handleDelete(question)">删除</a>
                    </div>
                </div>
                <div class="question-card-body">
                    <div class="question-content-section">
                        <div class="section-label">题目内容：</div>
                        <div class="question-text" v-html="question._questionContentHtml || question.questionContent || ''"></div>
                        <div v-if="question._attachedImageUrl" class="question-attached-image">
                            <el-image
                                :src="question._attachedImageUrl"
                                :preview-src-list="[question._attachedImageUrl]"
                                :initial-index="0"
                                fit="contain"
                                preview-teleported
                                style="max-width: 200px; max-height: 200px;"
                                alt="题目图片"
                            />
                        </div>
                    </div>
                    <div class="question-answer-section">
                        <div class="section-label">答案：</div>
                        <div class="answer-content">
                            <!-- 多项选择题显示选项 -->
                            <div
                                v-if="question.questionType === '2' || question.questionType === 2 || question.questionType === '多项选择题'">
                                <div class="answer-options">
                                    <div v-if="question.answera" class="option-item">
                                        <span class="option-letter">A.</span>
                                        <span v-html="question._answeraHtml || question.answera"></span>
                                    </div>
                                    <div v-if="question.answerb" class="option-item">
                                        <span class="option-letter">B.</span>
                                        <span v-html="question._answerbHtml || question.answerb"></span>
                                    </div>
                                    <div v-if="question.answerc" class="option-item">
                                        <span class="option-letter">C.</span>
                                        <span v-html="question._answercHtml || question.answerc"></span>
                                    </div>
                                    <div v-if="question.answerd" class="option-item">
                                        <span class="option-letter">D.</span>
                                        <span v-html="question._answerdHtml || question.answerd"></span>
                                    </div>
                                    <div v-if="question.answere" class="option-item">
                                        <span class="option-letter">E.</span>
                                        <span v-html="question._answereHtml || question.answere"></span>
                                    </div>
                                    <div v-if="question.answerf" class="option-item">
                                        <span class="option-letter">F.</span>
                                        <span v-html="question._answerfHtml || question.answerf"></span>
                                    </div>
                                    <div v-if="question.answerg" class="option-item">
                                        <span class="option-letter">G.</span>
                                        <span v-html="question._answergHtml || question.answerg"></span>
                                    </div>
                                    <div v-if="question.answerh" class="option-item">
                                        <span class="option-letter">H.</span>
                                        <span v-html="question._answerhHtml || question.answerh"></span>
                                    </div>
                                    <div v-if="question.answeri" class="option-item">
                                        <span class="option-letter">I.</span>
                                        <span v-html="question._answeriHtml || question.answeri"></span>
                                    </div>
                                    <div v-if="question.answerj" class="option-item">
                                        <span class="option-letter">J.</span>
                                        <span v-html="question._answerjHtml || question.answerj"></span>
                                    </div>
                                </div>
                                <div class="correct-answer">
                                    <strong>正确答案:</strong> {{ formatAnswer(question.answer, question.questionType) }}
                                </div>
                            </div>

                            <!-- 单选题显示选项 -->
                            <div
                                v-else-if="question.questionType === '1' || question.questionType === 1 || question.questionType === '单项选择题'">
                                <div class="answer-options">
                                    <div v-if="question.answera" class="option-item">
                                        <span class="option-letter">A.</span>
                                        <span v-html="question._answeraHtml || question.answera"></span>
                                    </div>
                                    <div v-if="question.answerb" class="option-item">
                                        <span class="option-letter">B.</span>
                                        <span v-html="question._answerbHtml || question.answerb"></span>
                                    </div>
                                    <div v-if="question.answerc" class="option-item">
                                        <span class="option-letter">C.</span>
                                        <span v-html="question._answercHtml || question.answerc"></span>
                                    </div>
                                    <div v-if="question.answerd" class="option-item">
                                        <span class="option-letter">D.</span>
                                        <span v-html="question._answerdHtml || question.answerd"></span>
                                    </div>
                                    <div v-if="question.answere" class="option-item">
                                        <span class="option-letter">E.</span>
                                        <span v-html="question._answereHtml || question.answere"></span>
                                    </div>
                                    <div v-if="question.answerf" class="option-item">
                                        <span class="option-letter">F.</span>
                                        <span v-html="question._answerfHtml || question.answerf"></span>
                                    </div>
                                    <div v-if="question.answerg" class="option-item">
                                        <span class="option-letter">G.</span>
                                        <span v-html="question._answergHtml || question.answerg"></span>
                                    </div>
                                    <div v-if="question.answerh" class="option-item">
                                        <span class="option-letter">H.</span>
                                        <span v-html="question._answerhHtml || question.answerh"></span>
                                    </div>
                                    <div v-if="question.answeri" class="option-item">
                                        <span class="option-letter">I.</span>
                                        <span v-html="question._answeriHtml || question.answeri"></span>
                                    </div>
                                    <div v-if="question.answerj" class="option-item">
                                        <span class="option-letter">J.</span>
                                        <span v-html="question._answerjHtml || question.answerj"></span>
                                    </div>
                                </div>
                                <div class="correct-answer">
                                    <strong>正确答案:</strong> {{ formatAnswer(question.answer, question.questionType) }}
                                </div>
                            </div>

                            <!-- 判断题显示选项 -->
                            <div
                                v-else-if="question.questionType === '3' || question.questionType === 3 || question.questionType === '判断题'">
                                <div class="answer-options">
                                    <div class="option-item">
                                        <span class="option-letter">A.</span>
                                        <span>√</span>
                                    </div>
                                    <div class="option-item">
                                        <span class="option-letter">B.</span>
                                        <span>✕</span>
                                    </div>
                                </div>
                                <div class="correct-answer">
                                    <strong>正确答案:</strong> {{ formatAnswer(question.answer, question.questionType) }}
                                </div>
                            </div>

                            <!-- 其他题型显示普通答案 -->
                            <div v-else>
                                <div v-html="question._answerHtml || question.answer || ''"></div>
                            </div>
                        </div>
                        <!-- 仅当答案正文中未含 [img] 时单独展示答案附图，避免与 _answerHtml 内已替换的图片重复 -->
                        <div v-if="question._answerImageUrl && !(question.answer && String(question.answer).includes('[img]'))" class="answer-attached-image">
                            <el-image
                                :src="question._answerImageUrl"
                                :preview-src-list="[question._answerImageUrl]"
                                :initial-index="0"
                                fit="contain"
                                preview-teleported
                                style="max-width: 200px; max-height: 200px;"
                                alt="答案图片"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 分页控件 -->
        <Pagination
            v-if="totalItems > 0"
            :total="totalItems"
            :current-page="currentPage"
            :page-size="pageSize"
            @change="handlePaginationChange"
        />

        <!-- 新增题目弹窗 -->
        <AddQuestionModal :visible="isAddQuestionModalVisible" :form="addQuestionForm" @close="closeAddQuestionModal"
            @submit="submitAddQuestion" />

        <!-- 编辑题目弹窗 -->
        <AddQuestionModal :visible="isQuestionModalVisible" :form="currentQuestion" :isEditMode="isEditQuestionMode"
            @close="closeQuestionModal" @submit="saveQuestion" />

        <!-- 查看题目弹窗（只读） -->
        <div class="modal-overlay" v-if="isViewModalVisible" @mousedown.self="closeViewModal">
            <div class="modal-container view-modal" @click.stop>
                <div class="modal-header">
                    <h3>查看题目</h3>
                    <button class="close-button" @click="closeViewModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="view-field"><strong>题目内容：</strong><span v-html="viewQuestion.questionContent || viewQuestion._questionContentHtml || ''"></span></div>
                    <div class="view-field" v-if="viewQuestion._attachedImageUrl">
                        <strong>图片：</strong>
                        <el-image :src="viewQuestion._attachedImageUrl" :preview-src-list="[viewQuestion._attachedImageUrl]" preview-teleported fit="contain" style="width:120px;height:120px;" />
                    </div>
                    <div class="view-field"><strong>答案：</strong><span v-html="viewQuestion.answer || viewQuestion._answerHtml || ''"></span></div>
                    <div class="view-field" v-if="viewQuestion._answerImageUrl">
                        <strong>答案图片：</strong>
                        <el-image :src="viewQuestion._answerImageUrl" :preview-src-list="[viewQuestion._answerImageUrl]" preview-teleported fit="contain" style="width:120px;height:120px;" />
                    </div>
                    <div class="view-field"><strong>题目类型：</strong>{{ formatQuestionType(viewQuestion.questionType) }}</div>
                    <div class="view-field"><strong>难易度：</strong>{{ formatDifficulty(viewQuestion.easeOrDifficulty) }}</div>
                    <div class="view-field"><strong>领域：</strong>{{ formatDomain(viewQuestion.domain) }}</div>
                    <div class="view-field"><strong>重要程度：</strong>{{ formatImportance(viewQuestion.importance) }}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" @click="closeViewModal">关闭</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AddQuestionModal from './AddQuestionModal.vue'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'
import Pagination from '@/components/Pagination.vue'
import { selectQuestionByBaseID, addQuestion, updateQuestion, deleteQuestion as deleteQuestionApi } from '@/api/user'
import { getFullImageUrl, fetchImageAsBlobUrl, replaceImgPlaceholdersWithAuthAdvanced } from '@/api/imageUpload.js'
import { getQuestionById, getDomainCountByQuestionBaseId } from '@/api/questionBank.js'
import { getAllExamStations } from '@/api/examStation'
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, toRoleNumber } from '@/constants/role'

const props = defineProps({
    examInfo: { type: Object, required: true }
})

const emit = defineEmits(['back'])

// 面包屑：资源题库 / 题库列表 / 查看题目
const breadcrumbItems = computed(() => [
  { label: '资源题库' },
  { label: '题库列表', onClick: () => emit('back') },
  { label: '查看题目' }
])

// 获取当前用户信息
const getCurrentUser = () => {
  const userStr = sessionStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : {};
};

const currentUser = ref(getCurrentUser());

const isQuestionExpert = computed(() => {
  const r = toRoleNumber(currentUser.value.role);
  return r === ROLE_EXAM_STATION_ADMIN || r === ROLE_MANAGER;
});
const isAdminOrManager = computed(() => {
  const r = toRoleNumber(currentUser.value.role);
  return r === ROLE_MANAGER;
});

// 题目数据
const questions = ref([])
const questionsContentHtmlList = ref([])
const isLoading = ref(false)
const error = ref(null)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// 筛选相关
const filters = ref({
    questionType: '',
    difficulty: '',
    domain: '',
    searchText: ''
})
const originalQuestions = ref([])

// 统计数据
const statistics = ref({
    basicKnowledge: 0,
    professionalEthics: 0,
    professionalKnowledge: 0,
    relatedKnowledge: 0
})

// 考核站相关状态
const examStations = ref([])
const loadingExamStations = ref(false)

// 模态框状态
const isAddQuestionModalVisible = ref(false)
const isQuestionModalVisible = ref(false)
const isEditQuestionMode = ref(false)

// 表单数据
const addQuestionForm = ref({
    questionContent: "",
    answer: "",
    questionType: "",
    easeOrDifficulty: "",
    domain: "",
    importance: "",
    attachedImage: "",
    answerImage: "",
    question_content_images: "", // 题目内容中插入的图片，以英文逗号分隔
    _attachedImageUrl: "",
    _answerImageUrl: "",
    option_images: "",
    answera: "",
    answerb: "",
    answerc: "",
    answerd: "",
    answere: "",
    answerf: "",
    answerg: "",
    answerh: "",
    answeri: "",
    answerj: ""
})

const currentQuestion = ref({
    questionContent: "",
    answer: "",
    questionType: "",
    easeOrDifficulty: "",
    domain: "",
    importance: "",
    attachedImage: "",
    answerImage: "",
    question_content_images: "", // 题目内容中插入的图片，以英文逗号分隔
    _attachedImageUrl: "",
    _answerImageUrl: "",
    option_images: "",
    answera: "",
    answerb: "",
    answerc: "",
    answerd: "",
    answere: "",
    answerf: "",
    answerg: "",
    answerh: "",
    answeri: "",
    answerj: ""
})

// 查看弹窗状态
const isViewModalVisible = ref(false)
const viewQuestion = ref({})

// 图片URL缓存（可选，不再下载，保留占位避免大改）
const imageUrlCache = new Map()

// 计算总页数
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

// 是否允许编辑题库（未提交或审核拒绝时可以编辑）
const canEditQuestions = computed(() => {
  const status = props.examInfo?.auditStatus
  return status === null || typeof status === 'undefined' || status === 2
})

// 是否显示查看按钮（待审核或审核通过时显示，审核拒绝时不显示）
const canViewQuestions = computed(() => {
  const status = props.examInfo?.auditStatus
  return status === 0 || status === 1
})

// 获取统计数据
const fetchStatistics = async () => {
    if (!props.examInfo?.id) {
        console.log("没有题库ID，跳过统计数据获取")
        return
    }

    console.log("开始获取统计数据，题库ID:", props.examInfo.id)
    
    try {
        const response = await getDomainCountByQuestionBaseId(props.examInfo.id)
        console.log("统计数据接口响应:", response)
        
        if (response.data && response.data.code === 200 && response.data.data) {
            // 根据接口返回的数据结构更新统计数据
            const newStats = {
                basicKnowledge: response.data.data["基础知识"] || 0,
                professionalEthics: response.data.data["职业道德"] || 0,
                professionalKnowledge: response.data.data["专业知识"] || 0,
                relatedKnowledge: response.data.data["相关知识"] || 0
            }
            console.log("更新统计数据:", newStats)
            statistics.value = newStats
        } else {
            console.log("接口返回失败，使用本地计算")
            // 如果接口调用失败，使用本地计算作为备选方案
            statistics.value = calculateStatistics(originalQuestions.value)
        }
    } catch (error) {
        console.error("获取统计数据失败:", error)
        // 接口调用失败时，使用本地计算作为备选方案
        statistics.value = calculateStatistics(originalQuestions.value)
    }
}

// 处理查看题目（按照文档要求：查看弹窗中题目内容应使用 _questionContentHtml）
async function handleView(question) {
    // 确保题目已经处理过图片占位符
    let processedQuestion = question
    if (!question._questionContentHtml && question.questionContent) {
        // 如果还没有处理过，先处理
        processedQuestion = await processQuestionImagesForDisplayAsync(question)
    }
    
    viewQuestion.value = { 
        ...processedQuestion,
        // 确保查看弹窗使用处理后的 HTML
        questionContent: processedQuestion._questionContentHtml || processedQuestion.questionContent,
        answer: processedQuestion._answerHtml || processedQuestion.answer
    }
    
    // 处理附件图片和答案图片 URL（使用 fetchImageAsBlobUrl，在请求头中携带 Authorization token）
    const attachedImg = processedQuestion.attachedImage || processedQuestion.attached_image
    if (attachedImg) {
        try {
            const imgPath = Array.isArray(attachedImg) && attachedImg.length > 0
                ? (attachedImg[0].url || attachedImg[0])
                : attachedImg
            if (typeof imgPath === 'string' && imgPath) {
                viewQuestion.value._attachedImageUrl = await fetchImageAsBlobUrl(imgPath)
            }
        } catch (error) {
            console.error("获取查看弹窗题干附件图片失败:", error)
        }
    }
    
    const answerImg = processedQuestion.answerImage || processedQuestion.answer_image
    if (answerImg) {
        try {
            const imgPath = Array.isArray(answerImg) && answerImg.length > 0
                ? (answerImg[0].url || answerImg[0])
                : answerImg
            if (typeof imgPath === 'string' && imgPath) {
                viewQuestion.value._answerImageUrl = await fetchImageAsBlobUrl(imgPath)
            }
        } catch (error) {
            console.error("获取查看弹窗答案图片失败:", error)
        }
    }
    
    isViewModalVisible.value = true
}

function closeViewModal() {
    isViewModalVisible.value = false
    viewQuestion.value = {}
}

// 计算统计数据（作为备选方案）
const calculateStatistics = (questions) => {
    const stats = {
        basicKnowledge: 0,
        professionalEthics: 0,
        professionalKnowledge: 0,
        relatedKnowledge: 0
    }
    
    questions.forEach(question => {
        switch(question.domain) {
            case '1':
                stats.basicKnowledge++
                break
            case '2':
                stats.professionalEthics++
                break
            case '3':
                stats.professionalKnowledge++
                break
            case '4':
                stats.relatedKnowledge++
                break
        }
    })
    
    return stats
}

// 计算显示哪些页码
const displayedPages = computed(() => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages.value <= maxVisiblePages) {
        for (let i = 1; i <= totalPages.value; i++) {
            pages.push(i)
        }
    } else {
        pages.push(1)
        let startPage = Math.max(2, currentPage.value - Math.floor((maxVisiblePages - 3) / 2))
        let endPage = Math.min(totalPages.value - 1, startPage + maxVisiblePages - 4)

        if (endPage - startPage < maxVisiblePages - 4) {
            startPage = Math.max(2, endPage - maxVisiblePages + 4)
        }

        if (startPage > 2) {
            pages.push("...")
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i)
        }

        if (endPage < totalPages.value - 1) {
            pages.push("...")
        }
        pages.push(totalPages.value)
    }

    return pages
})

// 图片请求使用 replaceImgPlaceholdersWithAuthAdvanced / fetchImageAsBlobUrl，发请求时带 Authorization 头

// 处理题目中的图片占位符（异步，请求图片时带 token）
const processQuestionImagesForDisplayAsync = async (question) => {
  const processedQuestion = { ...question };
  const optCsv = () => question.option_images || question.optionImages || "";
  if (question.questionContent) {
    const imagesCsv = question.question_content_images || question.questionContentImages || question.questionImages || "";
    processedQuestion._questionContentHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.questionContent, imagesCsv);
  }
  const optionFields = ['answera', 'answerb', 'answerc', 'answerd', 'answere', 'answerf', 'answerg', 'answerh', 'answeri', 'answerj'];
  for (const field of optionFields) {
    if (question[field]) processedQuestion[`_${field}Html`] = await replaceImgPlaceholdersWithAuthAdvanced(question[field], optCsv());
  }
  if (question.answer) {
    const imagesCsv = question.answer_image || question.answerImage || "";
    processedQuestion._answerHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answer, imagesCsv);
  }
  return processedQuestion;
};

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

// 将图片数组转为 JSON 数组字符串（编辑表单期望 JSON 格式以保留 url/width/height）
const imageArrayToJson = (val) => {
    if (val == null) return ''
    if (typeof val === 'string') return val  // 已是字符串（JSON 或 CSV），原样返回
    if (!Array.isArray(val)) return ''
    const arr = val.map((item) => {
        if (typeof item === 'object' && item && item.url) {
            return { url: item.url, width: item.width || null, height: item.height || null }
        }
        return { url: String(item || ''), width: null, height: null }
    }).filter(i => i.url)
    return JSON.stringify(arr)
}

// 归一化后端返回的题目字段（兼容下划线命名，并将图片字段的 JSON 字符串转为数组以便取 [0].url 等）
const normalizeQuestionFields = (q) => {
    if (!q || typeof q !== 'object') return q
    if (!q.option_images && q.optionImages) q.option_images = q.optionImages
    // 题干附件图：接口可能返回 JSON 字符串 "[{...}]" 或 [0]，需解析为数组
    const attachedImgs = parseImageField(q.attached_image ?? q.attachedImage)
    if (Array.isArray(attachedImgs)) {
        q.attached_image = attachedImgs
        q.attachedImage = attachedImgs
    } else if (!q.attachedImage && q.attached_image) {
        q.attachedImage = q.attached_image
    }
    // 题目中 [img] 占位符对应图片：接口可能返回 JSON 字符串，需解析为数组以按顺序显示
    const contentImgs = parseImageField(q.question_content_images ?? q.questionContentImages)
    if (Array.isArray(contentImgs)) {
        q.question_content_images = contentImgs
        q.questionContentImages = contentImgs
    } else if (!q.question_content_images && q.questionContentImages) {
        q.question_content_images = q.questionContentImages
    }
    // 答案中 [img] 占位符对应图片：同上
    const answerImgs = parseImageField(q.answer_image ?? q.answerImage)
    if (Array.isArray(answerImgs)) {
        q.answer_image = answerImgs
        q.answerImage = answerImgs
    } else if (!q.answerImage && q.answer_image) {
        q.answerImage = q.answer_image
    }
    return q
}

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

// 获取图片 URL：按照文档要求使用 getFullImageUrl（统一使用 /api/getImage?fileName= 方式显示）
// 注意：如果后端只接受 Authorization 请求头，应使用 fetchImageAsBlobUrl
const getImageUrl = (src) => {
    if (!src) return ""
    if (/^https?:\/\//.test(src)) return src
    if (/^data:image\//.test(src)) return src
    if (/^blob:/.test(src)) return src
    return getFullImageUrl(src)
}

// 富文本题干图片处理（不再用于题干渲染，仅用于选项内容里的图片URL替换）
const renderQuestionContent = async (content) => {
    if (!content) return ""
    const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi
    let match
    let result = content
    const promises = []
    const srcList = []
    while ((match = imgRegex.exec(content)) !== null) {
        const src = match[1]
        if (!/^https?:\/\//.test(src) && !/^data:image\//.test(src)) {
            srcList.push(src)
            promises.push(getImageUrl(src))
        }
    }
    if (promises.length === 0) return content
    const urlList = await Promise.all(promises)
    srcList.forEach((src, idx) => {
        result = result.replace(
            new RegExp(
                `<img([^>]*?)src=["']${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
                "i"
            ),
            `<img$1src="${urlList[idx]}"`
        )
    })
    return result
}

// 处理题目和答案图片（按照文档要求：使用 fetchImageAsBlobUrl，在请求头中携带 Authorization token）
const processQuestionImages = async () => {
    try {
        await Promise.all(
            questions.value.map(async (q) => {
                // 处理题干附件图片（attachedImage / attached_image）
                const attachedImg = q.attachedImage || q.attached_image
                if (attachedImg) {
                    try {
                        // 如果是数组格式，取第一个元素的 url
                        const imgPath = Array.isArray(attachedImg) && attachedImg.length > 0
                            ? (attachedImg[0].url || attachedImg[0])
                            : attachedImg
                        if (typeof imgPath === 'string' && imgPath) {
                            q._attachedImageUrl = await fetchImageAsBlobUrl(imgPath)
                        }
                    } catch (error) {
                        console.error("获取题干附件图片失败:", error)
                    }
                }

                // 处理答案图片（answerImage / answer_image）
                const answerImg = q.answerImage || q.answer_image
                if (answerImg) {
                    try {
                        // 如果是数组格式，取第一个元素的 url
                        const imgPath = Array.isArray(answerImg) && answerImg.length > 0
                            ? (answerImg[0].url || answerImg[0])
                            : answerImg
                        if (typeof imgPath === 'string' && imgPath) {
                            q._answerImageUrl = await fetchImageAsBlobUrl(imgPath)
                        }
                    } catch (error) {
                        console.error("获取答案图片失败:", error)
                    }
                }

                // 处理选项图片（选项中的图片通过 replaceImgPlaceholdersWithAuthAdvanced 已处理）
                // 这里不再需要额外处理
            })
        )
    } catch (error) {
        console.error("处理题目图片失败:", error)
    }
}

// 获取题目列表
const fetchQuestions = async () => {
    if (!props.examInfo?.id) return

    isLoading.value = true
    error.value = null
    try {
        // 统一走真实接口，确保查看题目显示该题库真实题目（见 skill zcexam-question-bank-list-fix）
        const params = {
            questionBaseId: props.examInfo.id,
            offset: (currentPage.value - 1) * pageSize.value,
            limit: pageSize.value
        }

        // 添加筛选参数
        if (filters.value.questionType) {
            params.questionType = filters.value.questionType
        }
        if (filters.value.difficulty) {
            params.easeOrDifficulty = filters.value.difficulty
        }
        if (filters.value.domain) {
            params.domain = filters.value.domain
        }
        if (filters.value.searchText) {
            params.content = filters.value.searchText
        }

        const response = await selectQuestionByBaseID(params)
        if (response.code === 200 && response.data) {
            const list = (response.data.list || []).map(item => normalizeQuestionFields(item))
            originalQuestions.value = await Promise.all(list.map(q => processQuestionImagesForDisplayAsync(q)))
            questions.value = originalQuestions.value.map(item => ({ ...item }))
            totalItems.value = response.data.total || 0
            
            // 获取统计数据
            await fetchStatistics()
            
            await processQuestionImages()
        } else {
            throw new Error(response.msg || "获取题目列表失败")
        }
    } catch (err) {
        console.error("获取题目列表失败:", err)
        error.value = err.message || "获取题目列表失败，请稍后重试"
    } finally {
        isLoading.value = false
    }
}

// 组件挂载时获取考核站列表
onMounted(async () => {
    await fetchExamStations();
});

// 监听题库信息变化
watch(() => props.examInfo, () => {
    if (props.examInfo?.id) {
        currentPage.value = 1
        fetchQuestions()
    }
}, { immediate: true })

// 处理编辑
const handleEdit = async (question) => {
    isEditQuestionMode.value = true

    try {
        const resp = await getQuestionById(question.id)
        const payload = resp?.data ?? resp
        if (payload && payload.code === 200 && payload.data) {
            const detail = normalizeQuestionFields(payload.data || {})
            const processed = await processQuestionImagesForDisplayAsync(detail)
            currentQuestion.value = JSON.parse(JSON.stringify(processed))

            // 兼容不同字段命名：option_images / optionImages（确保传入字符串类型）
            const imagesStr = ((processed && (processed.option_images || processed.optionImages)) || '') + ''
            currentQuestion.value.option_images = imagesStr

            // 编辑表单期望 question_content_images / answer_image / attached_image 为 JSON 数组字符串（含 url/width/height）
            currentQuestion.value.question_content_images = imageArrayToJson(processed.question_content_images ?? processed.questionContentImages)
            currentQuestion.value.answer_image = imageArrayToJson(processed.answer_image ?? processed.answerImage)
            currentQuestion.value.attached_image = imageArrayToJson(processed.attachedImage ?? processed.attached_image)

            // 题干附件图第一张用于查看区域 _attachedImageUrl
            const attachedImg = processed.attachedImage || processed.attached_image
            if (attachedImg) {
                try {
                    const imgPath = Array.isArray(attachedImg) && attachedImg.length > 0
                        ? (attachedImg[0].url || attachedImg[0])
                        : (typeof attachedImg === 'string' ? attachedImg : '')
                    if (typeof imgPath === 'string' && imgPath) {
                        currentQuestion.value._attachedImageUrl = await fetchImageAsBlobUrl(imgPath)
                    } else {
                        currentQuestion.value._attachedImageUrl = ""
                    }
                } catch (error) {
                    console.error("获取编辑弹窗题干附件图片失败:", error)
                    currentQuestion.value._attachedImageUrl = ""
                }
            } else {
                currentQuestion.value._attachedImageUrl = ""
            }

            // 处理答案图片URL（按照文档要求使用 fetchImageAsBlobUrl，在请求头中携带 Authorization token）
            const answerImg = processed.answerImage || processed.answer_image
            if (answerImg) {
                try {
                    const imgPath = Array.isArray(answerImg) && answerImg.length > 0
                        ? (answerImg[0].url || answerImg[0])
                        : answerImg
                    if (typeof imgPath === 'string' && imgPath) {
                        currentQuestion.value._answerImageUrl = await fetchImageAsBlobUrl(imgPath)
                        currentQuestion.value.answerImage = imgPath
                    } else {
                        currentQuestion.value._answerImageUrl = ""
                        currentQuestion.value.answerImage = ""
                    }
                } catch (error) {
                    console.error("获取编辑弹窗答案图片失败:", error)
                    currentQuestion.value._answerImageUrl = ""
                    currentQuestion.value.answerImage = ""
                }
            } else {
                currentQuestion.value._answerImageUrl = ""
                currentQuestion.value.answerImage = ""
            }
        } else {
            // 回退：使用列表项打开编辑（带图片鉴权处理）
            const norm = normalizeQuestionFields(question) || {}
            const processed = await processQuestionImagesForDisplayAsync(norm)
            currentQuestion.value = JSON.parse(JSON.stringify(processed))
            const imagesStr = ((processed && (processed.option_images || processed.optionImages)) || '') + ''
            currentQuestion.value.option_images = imagesStr
            currentQuestion.value.question_content_images = imageArrayToJson(processed.question_content_images ?? processed.questionContentImages)
            currentQuestion.value.answer_image = imageArrayToJson(processed.answer_image ?? processed.answerImage)
            currentQuestion.value.attached_image = imageArrayToJson(processed.attachedImage ?? processed.attached_image)
            const attachedImg = processed.attachedImage || processed.attached_image
            if (attachedImg) {
                try {
                    const imgPath = Array.isArray(attachedImg) && attachedImg.length > 0
                        ? (attachedImg[0].url || attachedImg[0])
                        : (typeof attachedImg === 'string' ? attachedImg : '')
                    if (typeof imgPath === 'string' && imgPath) {
                        currentQuestion.value._attachedImageUrl = await fetchImageAsBlobUrl(imgPath)
                    } else {
                        currentQuestion.value._attachedImageUrl = ""
                    }
                } catch (error) {
                    console.error("获取编辑弹窗题干附件图片失败:", error)
                    currentQuestion.value._attachedImageUrl = ""
                }
            } else {
                currentQuestion.value._attachedImageUrl = ""
            }
            const answerImg = processed.answerImage || processed.answer_image
            if (answerImg) {
                try {
                    const imgPath = Array.isArray(answerImg) && answerImg.length > 0
                        ? (answerImg[0].url || answerImg[0])
                        : answerImg
                    if (typeof imgPath === 'string' && imgPath) {
                        currentQuestion.value._answerImageUrl = await fetchImageAsBlobUrl(imgPath)
                        currentQuestion.value.answerImage = imgPath
                    } else {
                        currentQuestion.value._answerImageUrl = ""
                        currentQuestion.value.answerImage = ""
                    }
                } catch (error) {
                    console.error("获取编辑弹窗答案图片失败:", error)
                    currentQuestion.value._answerImageUrl = ""
                    currentQuestion.value.answerImage = ""
                }
            } else {
                currentQuestion.value._answerImageUrl = ""
                currentQuestion.value.answerImage = ""
            }
        }
    } catch (e) {
        const norm = normalizeQuestionFields(question) || {}
        const processed = await processQuestionImagesForDisplayAsync(norm)
        currentQuestion.value = JSON.parse(JSON.stringify(processed))
        currentQuestion.value.option_images = ((processed && (processed.option_images || processed.optionImages)) || '') + ''
        currentQuestion.value.question_content_images = imageArrayToJson(processed.question_content_images ?? processed.questionContentImages)
        currentQuestion.value.answer_image = imageArrayToJson(processed.answer_image ?? processed.answerImage)
        currentQuestion.value.attached_image = imageArrayToJson(processed.attachedImage ?? processed.attached_image)
        const attachedImg = processed.attachedImage || processed.attached_image
        if (attachedImg) {
            try {
                const imgPath = Array.isArray(attachedImg) && attachedImg.length > 0
                    ? (attachedImg[0].url || attachedImg[0])
                    : (typeof attachedImg === 'string' ? attachedImg : '')
                if (typeof imgPath === 'string' && imgPath) {
                    currentQuestion.value._attachedImageUrl = await fetchImageAsBlobUrl(imgPath)
                } else {
                    currentQuestion.value._attachedImageUrl = ""
                }
            } catch (error) {
                console.error("获取编辑弹窗题干附件图片失败:", error)
                currentQuestion.value._attachedImageUrl = ""
            }
        } else {
            currentQuestion.value._attachedImageUrl = ""
        }
        const answerImg = processed.answerImage || processed.answer_image
        if (answerImg) {
            try {
                const imgPath = Array.isArray(answerImg) && answerImg.length > 0
                    ? (answerImg[0].url || answerImg[0])
                    : answerImg
                if (typeof imgPath === 'string' && imgPath) {
                    currentQuestion.value._answerImageUrl = await fetchImageAsBlobUrl(imgPath)
                    currentQuestion.value.answerImage = imgPath
                } else {
                    currentQuestion.value._answerImageUrl = ""
                    currentQuestion.value.answerImage = ""
                }
            } catch (error) {
                console.error("获取编辑弹窗答案图片失败:", error)
                currentQuestion.value._answerImageUrl = ""
                currentQuestion.value.answerImage = ""
            }
        } else {
            currentQuestion.value._answerImageUrl = ""
            currentQuestion.value.answerImage = ""
        }
    }

    isQuestionModalVisible.value = true
}

// 处理删除
const handleDelete = (question) => {
    ElMessageBox.confirm(`确定要删除该题目吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
    })
        .then(async () => {
            try {
                const res = await deleteQuestionApi(question.id)
                if (res.code === 200) {
                    ElMessage.success("题目删除成功")
                    fetchQuestions()
                } else {
                    throw new Error(res.msg || "删除题目失败")
                }
            } catch (err) {
                ElMessage.error(err.message || "删除题目失败")
            }
        })
        .catch(() => { })
}

// 处理分页（Pagination 组件 @change 传入 page, size，必须在 script 中处理避免模板里 ref 被解包导致报错）
const handlePaginationChange = (page, size) => {
    currentPage.value = page
    pageSize.value = size
    fetchQuestions()
}

const handlePageChange = (page) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    fetchQuestions()
}

const handlePageSizeChange = () => {
    currentPage.value = 1
    fetchQuestions()
}

// 新增题目
const openAddQuestionModal = () => {
    isAddQuestionModalVisible.value = true
    addQuestionForm.value = {
        questionContent: "",
        answer: "",
        questionType: "",
        easeOrDifficulty: "",
        domain: "",
        importance: "",
        attachedImage: "",
        answerImage: "",
        _attachedImageUrl: "",
        _answerImageUrl: "",
        answera: "",
        answerb: "",
        answerc: "",
        answerd: "",
        answere: "",
        answerf: "",
        answerg: "",
        answerh: "",
        answeri: "",
        answerj: ""
    }
}

// 关闭新增题目弹窗
const closeAddQuestionModal = () => {
    isAddQuestionModalVisible.value = false
    fetchQuestions()
}

// 提交新增题目
const submitAddQuestion = async () => {
    if (!addQuestionForm.value.questionContent) {
        ElMessage.warning("请输入题目内容")
        return
    }
    // 综合题、简答题：仅当答案文本为空且无答案图片时校验失败
    const qtAdd = addQuestionForm.value.questionType
    const isShortOrCompAdd = qtAdd === '4' || qtAdd === 4 || qtAdd === '5' || qtAdd === 5 || qtAdd === '简答题' || qtAdd === '综合题'
    if (isShortOrCompAdd) {
        const hasAnswerText = addQuestionForm.value.answer && String(addQuestionForm.value.answer).trim()
        const ai = addQuestionForm.value.answer_image ?? addQuestionForm.value.answerImage ?? ''
        const hasAnswerImgs = !!(Array.isArray(ai) && ai.length > 0) || (typeof ai === 'string' && ai.trim() && ai.trim() !== '[]')
        if (!hasAnswerText && !hasAnswerImgs) {
            ElMessage.warning("请填写答案或上传答案图片")
            return
        }
    } else if (!addQuestionForm.value.answer) {
        ElMessage.warning("请输入答案")
        return
    }
    if (!addQuestionForm.value.questionType) {
        ElMessage.warning("请选择题目类型")
        return
    }
    if (!addQuestionForm.value.easeOrDifficulty) {
        ElMessage.warning("请选择难易度")
        return
    }
    if (!addQuestionForm.value.domain) {
        ElMessage.warning("请选择行为领域")
        return
    }
    if (!addQuestionForm.value.importance) {
        ElMessage.warning("请选择重要程度")
        return
    }

    // 验证单选题和多选题的选项
    if (
        addQuestionForm.value.questionType === '1' || addQuestionForm.value.questionType === 1 ||
        addQuestionForm.value.questionType === '2' || addQuestionForm.value.questionType === 2 ||
        addQuestionForm.value.questionType === '单项选择题' || addQuestionForm.value.questionType === '多项选择题'
    ) {
        const hasOptions = addQuestionForm.value.answera || addQuestionForm.value.answerb ||
            addQuestionForm.value.answerc || addQuestionForm.value.answerd
        if (!hasOptions) {
            ElMessage.warning("请至少填写A、B、C、D四个选项")
            return
        }
    }

    // 验证单项选择题的答案格式
    if (
        addQuestionForm.value.questionType === '1' || addQuestionForm.value.questionType === 1 ||
        addQuestionForm.value.questionType === '单项选择题'
    ) {
        debugger
        const answer = addQuestionForm.value.answer
        if (!/^[A-J]$/.test(answer)) {
            ElMessage.warning("单项选择题的答案只能是A-J中的单个字母")
            return
        }
    }

    // 验证多项选择题的答案格式
    if (
        addQuestionForm.value.questionType === '2' || addQuestionForm.value.questionType === 2 ||
        addQuestionForm.value.questionType === '多项选择题'
    ) {
        const answer = addQuestionForm.value.answer
        if (!/^[A-J](,[A-J])*$/.test(answer)) {
            ElMessage.warning("多项选择题的答案格式应为A,B,C（多个字母用逗号分隔）")
            return
        }
    }

    // 组装参数
    const params = {
        ...addQuestionForm.value,
        questionBaseId: props.examInfo.id
    }
    try {
        const res = await addQuestion(params)
        if (res.code === 200) {
            ElMessage.success("题目新增成功")
            closeAddQuestionModal()
            fetchQuestions()
        } else {
            throw new Error(res.msg || "新增题目失败")
        }
    } catch (err) {
        ElMessage.error(err.message || "新增题目失败")
    }
}

// 关闭编辑题目弹窗
const closeQuestionModal = () => {
    isQuestionModalVisible.value = false
    isEditQuestionMode.value = false
    fetchQuestions()
}

// 保存题目
const saveQuestion = async () => {
    if (!currentQuestion.value.questionContent) {
        ElMessage.warning("请输入题目内容")
        return
    }
    // 综合题、简答题：仅当答案文本为空且无答案图片时校验失败
    const qt = currentQuestion.value.questionType
    const isShortOrComp = qt === '4' || qt === 4 || qt === '5' || qt === 5 || qt === '简答题' || qt === '综合题'
    if (isShortOrComp) {
        const hasAnswerText = currentQuestion.value.answer && String(currentQuestion.value.answer).trim()
        const ai = currentQuestion.value.answer_image ?? currentQuestion.value.answerImage ?? ''
        const hasAnswerImgs = !!(Array.isArray(ai) && ai.length > 0) || (typeof ai === 'string' && ai.trim() && ai.trim() !== '[]')
        if (!hasAnswerText && !hasAnswerImgs) {
            ElMessage.warning("请填写答案或上传答案图片")
            return
        }
    } else if (!currentQuestion.value.answer) {
        ElMessage.warning("请输入答案")
        return
    }
    if (!currentQuestion.value.questionType) {
        ElMessage.warning("请选择题目类型")
        return
    }
    if (!currentQuestion.value.easeOrDifficulty) {
        ElMessage.warning("请选择难易度")
        return
    }
    if (!currentQuestion.value.domain) {
        ElMessage.warning("请选择行为领域")
        return
    }
    if (!currentQuestion.value.importance) {
        ElMessage.warning("请选择重要程度")
        return
    }

    // 验证单选题和多选题的选项
    if (currentQuestion.value.questionType === '1' || currentQuestion.value.questionType === 1 ||
        currentQuestion.value.questionType === '2' || currentQuestion.value.questionType === 2 ||
        currentQuestion.value.questionType === '单项选择题' || currentQuestion.value.questionType === '多项选择题') {
        const hasOptions = currentQuestion.value.answera || currentQuestion.value.answerb ||
            currentQuestion.value.answerc || currentQuestion.value.answerd
        if (!hasOptions) {
            ElMessage.warning("请至少填写A、B、C、D四个选项")
            return
        }
    }

    // 验证单项选择题的答案格式
    if (currentQuestion.value.questionType === '1' || currentQuestion.value.questionType === 1 ||
        currentQuestion.value.questionType === '单项选择题') {
        const answer = currentQuestion.value.answer
        if (!/^[A-J]$/.test(answer)) {
            ElMessage.warning("单项选择题的答案只能是A-J中的单个字母")
            return
        }
    }

    // 验证多项选择题的答案格式
    if (currentQuestion.value.questionType === '2' || currentQuestion.value.questionType === 2 ||
        currentQuestion.value.questionType === '多项选择题') {
        const answer = currentQuestion.value.answer
        if (!/^[A-J](,[A-J])*$/.test(answer)) {
            ElMessage.warning("多项选择题的答案格式应为A,B,C（多个字母用逗号分隔）")
            return
        }
    }

    try {
        if (isEditQuestionMode.value) {
            const res = await updateQuestion(currentQuestion.value)
            if (res.code === 200) {
                ElMessage.success("题目编辑成功")
                isQuestionModalVisible.value = false
                fetchQuestions()
            } else {
                throw new Error(res.msg || "编辑题目失败")
            }
        } else {
            const res = await addQuestion(currentQuestion.value)
            if (res.code === 200) {
                ElMessage.success("题目新增成功")
                isQuestionModalVisible.value = false
                fetchQuestions()
            } else {
                throw new Error(res.msg || "新增题目失败")
            }
        }
    } catch (err) {
        ElMessage.error(err.message || "操作失败")
    }
}

// 返回题库列表
const backToExamList = () => {
    emit('back')
}

// 筛选函数
const applyFilters = (questions) => {
    return questions.filter(question => {
        // 题目类型筛选
        if (filters.value.questionType && question.questionType !== filters.value.questionType) {
            return false
        }
        
        // 难易度筛选
        if (filters.value.difficulty && question.easeOrDifficulty !== filters.value.difficulty) {
            return false
        }
        
        // 领域筛选
        if (filters.value.domain && question.domain !== filters.value.domain) {
            return false
        }
        
        // 重要程度筛选已移除
        
        // 搜索文本筛选
        if (filters.value.searchText) {
            const searchText = filters.value.searchText.toLowerCase()
            const questionContent = (question.questionContent || '').toLowerCase()
            if (!questionContent.includes(searchText)) {
                return false
            }
        }
        
        return true
    })
}


// 应用筛选
const applyFilter = () => {
    currentPage.value = 1
    fetchQuestions()
}

// 清空筛选
const clearFilter = () => {
    filters.value = {
        questionType: '',
        difficulty: '',
        domain: '',
        searchText: ''
    }
    currentPage.value = 1
    fetchQuestions()
}

// 格式化答案（判断题统一显示 A.√ / B.✕，支持后端返回 A/B 或 0/1）
const formatAnswer = (answer, questionType) => {
    if (!answer && answer !== 0) return ''

    if (questionType === '3' || questionType === 3 || questionType === '判断题') {
        const isCorrect = answer === 'A' || answer === '1' || answer === 1
        return isCorrect ? 'A. √' : 'B. ✕'
    }

    return answer
}

// 格式化题目类型
const formatQuestionType = (questionType) => {
    const typeMap = {
        '0': '填空题',
        '1': '单项选择题',
        '2': '多项选择题',
        '3': '判断题',
        '4': '简答题',
        '5': '综合题',
        '单项选择题': '单项选择题',
        '多选选择题': '多选选择题',
        '判断题': '判断题',
        '填空题': '填空题',
        '简答题': '简答题',
        '综合题': '综合题'
    }
    return typeMap[questionType] || questionType
}

// 格式化难易度
const formatDifficulty = (difficulty) => {
    const difficultyMap = {
        '1': '易',
        '2': '较易',
        '3': '中等',
        '4': '较难',
        '5': '难'
    }
    return difficultyMap[difficulty] || difficulty
}

// 格式化行为领域
const formatDomain = (domain) => {
    const domainMap = {
        '1': '基础知识',
        '2': '职业道德',
        '3': '专业知识',
        '4': '相关知识',
        '5': '专业技能',
        '6': '相关技能'
    }
    return domainMap[domain] || domain
}

// 格式化重要程度
const formatImportance = (importance) => {
    const importanceMap = {
        'X': '核心要素',
        'Y': '一般要素',
        'Z': '辅助要素'
    }
    return importanceMap[importance] || importance
}
</script>

<style scoped>
.breadcrumb-line {
    margin-bottom: 12px;
}

.action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
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

.btn-add {
    background: #c70019;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
}

.btn-add:hover {
    background: #a00015;
}

.question-manage-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 20px;
}

.header-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* 统计信息样式 */
.statistics-section {
    padding: 6px 8px;
    background: #fff7f7;
    border: 1px solid #ffb3b3;
    border-radius: 6px;
}

/* 放在标题同排时的紧凑样式 */
.statistics-inline { margin-left: 12px; }

.title-row {
    display: flex;
    align-items: center;
}

.header-sub {
    margin-top: 4px;
}

.statistics-grid { display: flex; gap: 12px; flex-wrap: wrap; }

.stat-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: #fff;
    border-radius: 4px;
    border: 1px solid #f0d6d6;
    min-width: 120px;
}

.stat-item:hover { border-color: #ffa6a6; }

/* 去掉图标后的占位样式删除 */

.stat-content { display: flex; flex-direction: row; gap: 8px; align-items: baseline; }

.stat-label { font-weight: 500; color: #666; font-size: 12px; line-height: 1.1; }

.stat-value { font-weight: 700; color: #ff4d4f; font-size: 16px; line-height: 1.1; }

/* 筛选条件样式 */
.filter-section {
    margin-bottom: 16px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.filter-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    flex-wrap: wrap;
}

.filter-row:last-child {
    margin-bottom: 0;
}

.filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.filter-item label {
    font-weight: 500;
    color: #333;
    white-space: nowrap;
}

.filter-select {
    padding: 6px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    background-color: white;
    min-width: 120px;
}

.filter-input {
    padding: 6px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    background-color: white;
    min-width: 200px;
    flex: 1;
}

.search-item {
    flex: 1;
    min-width: 300px;
}


.header-info h3 {
    margin: 0;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.btn {
    padding: 8px 15px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
}

.btn-primary {
    background-color: #c70019;
    color: white;
}

.btn-secondary {
    background-color: #f5f5f5;
    color: #333;
    border-color: #dcdfe6;
}

.btn-secondary:hover:not(:disabled) {
    background-color: #ebebeb;
}

.table-responsive {
    overflow-x: auto;
    margin-bottom: 20px;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
    color: #333;
}

.data-table tbody tr:hover {
    background-color: #f5f5f5;
}

.question-content {
    max-width: 300px;
    word-wrap: break-word;
}

.answer-content {
    max-width: 300px;
    word-wrap: break-word;
}

.question-image,
.answer-image {
    margin-top: 8px;
}

.answer-options {
    margin-bottom: 8px;
}

.option-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 4px;
}

.option-letter {
    min-width: 20px;
    font-weight: 500;
    margin-right: 8px;
}

.correct-answer {
    margin-top: 8px;
    font-weight: 500;
}

.no-data {
    text-align: center;
    color: #999;
    padding: 40px 0;
}

/* 分页样式由全局 pagination.css 统一提供 */

/* 查看题目弹窗样式 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.view-modal {
    width: 800px;
    max-width: 90vw;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
}

.view-modal .modal-header,
.view-modal .modal-footer {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #f0f0f0;
}

.view-modal .modal-footer {
    border-top: 1px solid #f0f0f0;
    border-bottom: none;
}

.view-modal .modal-body {
    max-height: 70vh;
    overflow-y: auto;
    padding: 16px 20px;
}

.view-field {
    margin-bottom: 12px;
    line-height: 1.6;
    word-break: break-word;
}

.view-field strong {
    margin-right: 6px;
}
/* 查看题目弹窗样式 */
.view-modal .modal-body {
    max-height: 70vh;
    overflow-y: auto;
}

.view-field {
    margin-bottom: 12px;
    line-height: 1.6;
}

.view-field strong {
    margin-right: 6px;
}

/* 卡片式布局样式 */
.questions-card-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
}

.question-card-item {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
}

.question-card-item:hover {
    border-color: #409eff;
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.15);
}

.question-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
}

.question-card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.question-number {
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.question-type-badge,
.question-difficulty-badge,
.question-domain-badge,
.question-importance-badge,
.question-station-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    background-color: #f0f9ff;
    color: #0369a1;
    border: 1px solid #bae6fd;
}

.question-card-actions {
    display: flex;
    gap: 12px;
}

.question-card-actions a {
    color: #409eff;
    text-decoration: none;
    font-size: 14px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
}

.question-card-actions a:hover {
    background-color: #ecf5ff;
}

.question-card-actions a[style*="color:#ff4d4f"] {
    color: #ff4d4f !important;
}

.question-card-actions a[style*="color:#ff4d4f"]:hover {
    background-color: #fef2f2;
}

.question-card-body {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.question-content-section,
.question-answer-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.section-label {
    font-weight: 600;
    color: #333;
    font-size: 14px;
    margin-bottom: 4px;
}

.question-text {
    color: #333;
    line-height: 1.6;
    word-wrap: break-word;
}

.answer-content {
    color: #333;
    line-height: 1.6;
    word-wrap: break-word;
}

.question-attached-image,
.answer-attached-image {
    margin-top: 10px;
}

.question-inline-image {
    display: inline-block;
    vertical-align: middle;
    max-width: 100%;
    height: auto;
    margin: 0 3px;
}

.answer-options {
    margin-top: 8px;
    padding-left: 20px;
}

.option-item {
    margin-bottom: 6px;
    display: flex;
    align-items: flex-start;
    line-height: 1.5;
}

.option-letter {
    font-weight: 500;
    margin-right: 8px;
    flex-shrink: 0;
    color: #1890ff;
}

.correct-answer {
    margin-top: 10px;
    padding: 8px 12px;
    background: #f0f9ff;
    border-left: 3px solid #409eff;
    border-radius: 4px;
    font-size: 14px;
    color: #555;
}

.correct-answer strong {
    color: #409eff;
    margin-right: 6px;
}
</style>
