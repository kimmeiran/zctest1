<template>
    <div class="modal-overlay" v-if="visible" @mousedown.self="handleClose">
        <div class="modal-container" @click.stop>
            <div class="modal-header">
                <h3>{{ isEditMode ? "编辑试卷" : "自动组卷" }}</h3>
                <button class="close-btn" @click="handleClose">&times;</button>
            </div>
            <div class="modal-body">
                <!-- 基本信息选择 -->
                <div class="form-row form-row--inline form-row--full">
                    <div class="form-group">
                        <label for="paper-header">试卷页眉 <span class="required">*</span></label>
                        <div class="form-control">
                            <input
                                id="paper-header"
                                type="text"
                                class="form-input"
                                v-model="paperData.header"
                                placeholder="请输入试卷页眉"
                            />
                        </div>
                    </div>
                </div>
                <div class="form-row form-row--inline form-row--full">
                    <div class="form-group">
                        <label for="paper-name">试卷标题 <span class="required">*</span></label>
                        <div class="form-control">
                            <input
                                id="paper-name"
                                type="text"
                                class="form-input"
                                v-model="paperData.name"
                                placeholder="请输入试卷标题"
                            />
                        </div>
                    </div>
                </div>
                <div class="form-row form-row--inline form-row--full">
                    <div class="form-group">
                        <label for="paper-subtitle">试卷副标题 <span class="required">*</span></label>
                        <div class="form-control">
                            <input
                                id="paper-subtitle"
                                type="text"
                                class="form-input"
                                v-model="paperData.subtitle"
                                placeholder="请输入试卷副标题"
                            />
                        </div>
                    </div>
                </div>

                <div class="form-row form-row--inline">
                    <div class="form-group">
                        <label for="paper-purpose">试卷用途 <span class="required">*</span></label>
                        <div class="form-control">
                            <select id="paper-purpose" class="form-select" v-model.number="paperData.ruleType">
                                <option value="">请选择试卷用途</option>
                                <option :value="0" :disabled="!canCreateCareerPaper">职业认定</option>
                                <option :value="1" :disabled="!canCreateCareerPaper">竞赛</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-row form-row--inline">
                    <div class="form-group">
                        <label for="position-select">职业(工种) <span class="required">*</span></label>
                        <div class="form-control" @mousedown.capture="onTrySelectJobType">
                            <select id="position-select" class="form-select" v-model="paperData.jobType">
                                <option value="" disabled selected>请选择职业(工种)</option>
                                <option v-for="position in positionOptions" :key="position.id" :value="position.name">
                                    {{ position.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="exam-level">技能等级 <span class="required">*</span></label>
                        <div class="form-control" @mousedown.capture="onTrySelectLevel">
                            <select id="exam-level" class="form-select" v-model="paperData.level">
                                <option value="" disabled>请选择技能等级</option>
                                <option v-for="level in levelOptions" :key="level.id" :value="level.name">
                                    {{ level.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="exam-difficulty">难易度 <span class="required">*</span></label>
                        <!-- <div class="form-control" @mousedown.capture="onTrySelectDifficulty"> -->
                        <div class="form-control">
                            <select id="exam-difficulty" class="form-select" v-model="paperData.ease_or_difficulty">
                                <option value="" disabled>请选择难易度</option>
                                <option value="0">全部</option>
                                <option value="1">易</option>
                                <option value="2">较易</option>
                                <option value="3">中等</option>
                                <option value="4">较难</option>
                                <option value="5">难</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 规则提示（根据所选等级自动拉取） -->
                <div class="rule-hint" v-if="rule && typeof rule === 'object'">
                    <div class="rule-hint__title">当前规则（百分比）</div>
                    <div class="rule-hint__rows">
                        <div class="rule-row">
                            <div class="rule-label">职业道德</div>
                            <div class="rule-percentages">
                                <template v-if="paperData.ruleType === 1">单选 {{ (rule.workEthics02 || rule.work_ethics_02 || 0) }}% · 多选 {{ (rule.workEthics03 || rule.work_ethics_03 || 0) }}% · 判断 {{ (rule.workEthics04 || rule.work_ethics_04 || 0) }}%</template>
                                <template v-else>填空 {{ (rule.workEthics01 || rule.work_ethics_01 || 0) }}% · 单选 {{ (rule.workEthics02 || rule.work_ethics_02 || 0) }}% · 多选 {{ (rule.workEthics03 || rule.work_ethics_03 || 0) }}% · 判断 {{ (rule.workEthics04 || rule.work_ethics_04 || 0) }}%</template>
                            </div>
                            <div class="rule-select">
                                <div class="rule-select-inner" @mousedown.capture="onTryFocusRuleSection">
                                <el-select
                                    v-model="selectedBaseIds.domain1_question_base_id"
                                    placeholder="请选择职业道德"
                                    filterable
                                    remote
                                    clearable
                                    :remote-method="(query) => handleRemoteSearch('workEthics', query)"
                                    :loading="loading.workEthics"
                                    style="width: 200px"
                                >
                                    <el-option
                                        v-for="item in filteredOptions.workEthics"
                                        :key="item.id"
                                        :label="item.questionName"
                                        :value="item.id"
                                    />
                                </el-select>
                                </div>
                            </div>
                        </div>
                        <div class="rule-row">
                            <div class="rule-label">基础知识</div>
                            <div class="rule-percentages">
                                <template v-if="paperData.ruleType === 1">单选 {{ (rule.base02 || 0) }}% · 多选 {{ (rule.base03 || 0) }}% · 判断 {{ (rule.base04 || 0) }}%</template>
                                <template v-else>填空 {{ (rule.base01 || 0) }}% · 单选 {{ (rule.base02 || 0) }}% · 多选 {{ (rule.base03 || 0) }}% · 判断 {{ (rule.base04 || 0) }}%</template>
                            </div>
                            <div class="rule-select">
                                <div class="rule-select-inner" @mousedown.capture="onTryFocusRuleSection">
                                <el-select
                                    v-model="selectedBaseIds.domain2_question_base_id"
                                    placeholder="请选择基础知识"
                                    filterable
                                    remote
                                    clearable
                                    :remote-method="(query) => handleRemoteSearch('baseKnowledge', query)"
                                    :loading="loading.baseKnowledge"
                                    style="width: 200px"
                                >
                                    <el-option
                                        v-for="item in filteredOptions.baseKnowledge"
                                        :key="item.id"
                                        :label="item.questionName"
                                        :value="item.id"
                                    />
                                </el-select>
                                </div>
                            </div>
                        </div>
                        <div class="rule-row">
                            <div class="rule-label">专业、相关知识</div>
                            <div class="rule-percentages">
                                <template v-if="paperData.ruleType === 1">单选 {{ (rule.expert02 || 0) }}% · 多选 {{ (rule.expert03 || 0) }}% · 判断 {{ (rule.expert04 || 0) }}%</template>
                                <template v-else>填空 {{ (rule.expert01 || 0) }}% · 单选 {{ (rule.expert02 || 0) }}% · 多选 {{ (rule.expert03 || 0) }}% · 判断 {{ (rule.expert04 || 0) }}% · 简答 {{ (rule.expert05 || 0) }}% · 综合 {{ (rule.expert06 || 0) }}%</template>
                            </div>
                            <div class="rule-select">
                                <div class="rule-select-inner" @mousedown.capture="onTryFocusRuleSection">
                                <el-select
                                    v-model="selectedBaseIds.domain3_question_base_id"
                                    placeholder="请选择专业、相关知识"
                                    filterable
                                    remote
                                    clearable
                                    :remote-method="(query) => handleRemoteSearch('professionalKnowledge', query)"
                                    :loading="loading.professionalKnowledge"
                                    style="width: 200px"
                                >
                                    <el-option
                                        v-for="item in filteredOptions.professionalKnowledge"
                                        :key="item.id"
                                        :label="item.questionName"
                                        :value="item.id"
                                    />
                                </el-select>
                                </div>
                            </div>
                        </div>
                        <div v-if="paperData.ruleType === 1" class="rule-row rule-row--sub">
                            <div class="rule-label">竞赛</div>
                            <div class="rule-percentages">
                                单选 {{ (rule.competition02 || 0) }}% · 多选 {{ (rule.competition03 || 0) }}% · 判断 {{ (rule.competition04 || 0) }}%
                            </div>
                            <div class="rule-select">
                                <div class="rule-select-inner" @mousedown.capture="onTryFocusRuleSection">
                                <el-select
                                    v-model="selectedBaseIds.domain4_question_base_id"
                                    placeholder="请选择竞赛题库"
                                    filterable
                                    remote
                                    clearable
                                    :remote-method="(query) => handleRemoteSearch('competition', query)"
                                    :loading="loading.competition"
                                    style="width: 200px"
                                >
                                    <el-option
                                        v-for="item in filteredOptions.competition"
                                        :key="item.id"
                                        :label="item.questionName"
                                        :value="item.id"
                                    />
                                </el-select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="rule-hint" v-else>
                    <div class="rule-hint__title">当前规则（百分比）</div>
                    <div class="rule-row"><span>状态</span><span>尚未选择技能等级，或未匹配到规则</span></div>
                </div>

                <!-- 题型配置（与当前规则同显隐：仅在选择工种/等级且匹配到规则时显示） -->
                <div class="question-type-config" v-if="rule && typeof rule === 'object'">
                    <h4>题型配置</h4>
                    <div class="config-hint">
                        <p>💡 提示：您可以调整每题分值，系统会自动重新计算各领域题目数量以保持该题型总分不变</p>
                    </div>
                    <div class="question-type-items">
                        <div class="question-type-item" v-for="(item, i) in displayQuestionTypes" :key="item.realIndex">
                            <div class="question-type-header">
                                <span class="question-type-name">{{ item.type.name }}</span>
                                <span class="question-type-percentage">比例: {{ getTypePercentage(item.type.name) }}%</span>
                            </div>
                            <div class="question-type-details">
                                <div class="question-type-inline">
                                    <div class="input-group">
                                        <label>题目数量:</label>
                                        <input type="number" v-model="item.type.count" min="0" max="100" disabled
                                            class="form-input question-count-input" @input="onCountChange(item.realIndex)" />
                                    </div>
                                    <div class="input-group">
                                        <label>每题分值:</label>
                                        <input type="number" v-model="item.type.score" min="0" max="100" step="1"
                                            class="form-input question-score-input"
                                            @mousedown.capture="onTryFocusRuleSection"
                                            @input="onScoreChange(item.realIndex)" />
                                    </div>
                                </div>
                                <small v-if="rule" class="type-hint" :key="item.type._hintUpdated || item.realIndex">{{
                                    getTypeHint(item.type.name) }}</small>
                                <small class="score-hint">可用分值：{{ getValidScoreOptions(getOriginalCount(item.realIndex) *
                                    getOriginalScore(item.realIndex), item.realIndex) }}</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 描述 -->
                <div class="form-row">
                    <label for="paper-desc">描述</label>
                    <div class="form-control">
                        <textarea id="paper-desc" class="form-textarea" v-model="paperData.desc"
                            placeholder="请输入描述"></textarea>
                    </div>
                </div>
            </div>

            <!-- 规则选择对话框（点击蒙层不关闭） -->
            <div v-if="showRuleSelectDialog" class="rule-select-dialog-overlay">
                <div class="rule-select-dialog" @click.stop>
                    <div class="rule-select-dialog-header">
                        <h4>选择组卷规则</h4>
                        <button class="close-btn" @click="cancelRuleSelect">&times;</button>
                    </div>
                    <div class="rule-select-dialog-body">
                        <p class="rule-select-tip">当前技能等级存在多条规则，请选择要使用的规则：</p>
                        <div class="rule-select-list">
                            <div 
                                v-for="r in ruleList" 
                                :key="r.id" 
                                class="rule-select-item"
                                :class="{ active: selectedRuleId === r.id }"
                                @click="selectedRuleId = r.id"
                            >
                                <div class="rule-select-item-header">
                                    <input type="radio" :value="r.id" v-model="selectedRuleId" />
                                    <span class="rule-id">规则 ID: {{ r.id }}</span>
                                    <span class="rule-remark" v-if="r.remark">{{ r.remark }}</span>
                                </div>
                                <div class="rule-select-item-content">
                                    <div class="rule-detail-row">
                                        <span class="rule-detail-label">职业道德:</span>
                                        <span>{{ r.workEthics01 || 0 }}/{{ r.workEthics02 || 0 }}/{{ r.workEthics03 || 0 }}/{{ r.workEthics04 || 0 }}</span>
                                    </div>
                                    <div class="rule-detail-row">
                                        <span class="rule-detail-label">基础知识:</span>
                                        <span>{{ r.base01 || 0 }}/{{ r.base02 || 0 }}/{{ r.base03 || 0 }}/{{ r.base04 || 0 }}</span>
                                    </div>
                                    <div class="rule-detail-row">
                                        <span class="rule-detail-label">专业知识:</span>
                                        <span>{{ r.expert01 || 0 }}/{{ r.expert02 || 0 }}/{{ r.expert03 || 0 }}/{{ r.expert04 || 0 }}/{{ r.expert05 || 0 }}/{{ r.expert06 || 0 }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="rule-select-dialog-footer">
                        <button class="btn btn-secondary" @click="cancelRuleSelect">取消</button>
                        <button class="btn btn-primary" @click="selectRule">确定</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <!-- 总分显示在左下角 -->
                <div class="total-score-left">
                    <span>总分：{{ totalScore }} 分</span>
                </div>
                <!-- 总题目数量显示在总分旁边 -->
                <div class="total-questions-left">
                    <span>总题目数量：{{ totalQuestions }} 道</span>
                </div>
                <!-- 按钮在右侧 -->
                <div class="footer-buttons">
                    <button class="btn btn-secondary" @click="handleClose">取消</button>
                    <button class="btn btn-primary" @click="handleSave" :disabled="isSaving">
                        {{ isSaving ? '保存中...' : '确定' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { constructExam, constructExamV3, updateExam, getQuestionGroupRuleByLevel, getAllBaseQuestions } from '@/api/user'
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, toRoleNumber } from '@/constants/role'

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    editData: {
        type: Object,
        default: () => ({})
    },
    positionOptions: {
        type: Array,
        default: () => []
    },
    levelOptions: {
        type: Array,
        default: () => []
    }
})

// Emits
const emit = defineEmits(['close', 'saved'])

// 响应式数据
const isSaving = ref(false)
const paperData = ref({
    id: null,
    name: '',
    subtitle: '',   // 试卷副标题
    header: '',     // 试卷页眉
    ruleType: '', // 0=职业认定 1=竞赛 2=模拟考核
    questionBankType: 'resource', // 题库选择：resource=资源题库，competition=竞赛题库（仅竞赛时可选）
    jobType: '',
    level: '',
    desc: '',
    ease_or_difficulty: ''
})

const canCreateCareerPaper = computed(() => {
    const r = toRoleNumber(getCurrentUser().role)
    return r === ROLE_MANAGER
})
const canCreateCompetitionPaper = computed(() => {
    const r = toRoleNumber(getCurrentUser().role)
    return r === ROLE_EXAM_STATION_ADMIN || r === ROLE_MANAGER
})

// 按必填项顺序，逐步解锁：职业(工种) 需先填 试卷页眉、试卷标题、试卷副标题、试卷用途
const canEditJobType = computed(() =>
    !!paperData.value.header?.trim() &&
    !!paperData.value.name &&
    !!paperData.value.subtitle?.trim() &&
    (paperData.value.ruleType === 0 || paperData.value.ruleType === 1 || paperData.value.ruleType === 2)
)
// 技能等级 需先填 职业(工种)
const canEditLevel = computed(() => canEditJobType.value && !!paperData.value.jobType)
// 难易度 需先填 技能等级
const canEditDifficulty = computed(() => canEditLevel.value && !!paperData.value.level)
// 规则选择、题型配置 需先填 难易度，且有规则数据
const canEditRuleSection = computed(() => canEditDifficulty.value && rule.value)

// 友好提示：前置未填时点击/聚焦给出提示，不直接禁用
const onTrySelectJobType = (e) => {
    if (!canEditJobType.value) {
        e.preventDefault()
        e.stopPropagation()
        ElMessage.warning('请先填写试卷页眉、试卷标题、试卷副标题和试卷用途')
    }
}
const onTrySelectLevel = (e) => {
    if (!canEditLevel.value) {
        e.preventDefault()
        e.stopPropagation()
        ElMessage.warning('请先选择职业(工种)')
    }
}
const onTrySelectDifficulty = (e) => {
    if (!canEditDifficulty.value) {
        e.preventDefault()
        e.stopPropagation()
        ElMessage.warning('请先选择技能等级')
    }
}
const onTryFocusRuleSection = (e) => {
    if (!canEditRuleSection.value) {
        e.preventDefault()
        e.stopPropagation()
        ElMessage.warning('请先完成上方必填项：职业(工种)、技能等级、难易度')
    }
}

// ruleType: 0=职业认定 1=竞赛 2=模拟考核（静态选项）

// 当前用户及考核站
const getCurrentUser = () => {
    try {
        const stored = sessionStorage.getItem("user")
        return stored ? JSON.parse(stored) : {}
    } catch (error) {
        console.warn("解析用户信息失败:", error)
        return {}
    }
}

const currentUser = ref(getCurrentUser())
const currentStationId = computed(() => {
    const station = currentUser.value?.stationId
    if (station === null || station === undefined || station === '') {
        return undefined
    }
    const num = Number(station)
    return Number.isNaN(num) ? undefined : num
})

// 基础数据选项
const baseOptions = ref({
    workEthics: [], // 职业道德选项
    baseKnowledge: [], // 基础知识选项
    professionalKnowledge: [], // 专业、相关知识选项
    competition: [] // 竞赛题库选项（仅当试卷用途为竞赛时显示）
})

// 选中的基础数据ID
const selectedBaseIds = ref({
    domain1_question_base_id: null,
    domain2_question_base_id: null,
    domain3_question_base_id: null,
    domain4_question_base_id: null // 竞赛题库（仅当试卷用途为竞赛时显示）
})

// 搜索关键词
const searchKeywords = ref({
    workEthics: '',
    baseKnowledge: '',
    professionalKnowledge: ''
})

// 过滤后的选项
const filteredOptions = ref({
    workEthics: [],
    baseKnowledge: [],
    professionalKnowledge: [],
    competition: []
})

// 加载状态
const loading = ref({
    workEthics: false,
    baseKnowledge: false,
    professionalKnowledge: false,
    competition: false
})


// 题型配置
const questionTypes = ref([
    // { name: "填空题", count: 5, score: 2 },
    // { name: "单项选择题", count: 10, score: 2 },
    // { name: "多项选择题", count: 5, score: 4 },
    // { name: "判断题", count: 10, score: 1 },
    // { name: "简答题", count: 3, score: 5 },
    // { name: "综合题", count: 2, score: 10 }
])

// 每题分值变化前各题型的上一分值（用于无规则数据时反算题数）
const lastScoreByTypeIndex = ref({})

// 重置为默认题型配置
const resetQuestionTypesToDefault = () => {
    // questionTypes.value = [
    //     { name: '填空题', count: 5, score: 2 },
    //     { name: '单项选择题', count: 10, score: 2 },
    //     { name: '多项选择题', count: 5, score: 4 },
    //     { name: '判断题', count: 10, score: 1 },
    //     { name: '简答题', count: 3, score: 5 },
    //     { name: '综合题', count: 2, score: 10 }
    // ]
    questionTypes.value.forEach((t, i) => { lastScoreByTypeIndex.value[i] = t.score })
}

// 获取基础数据（选择试卷用途后按 ruleType 拉取：0=职业认定 1=竞赛）
// 竞赛时：前三个题库用 ruleType=0（职业评定题库），竞赛题库用 ruleType=1（竞赛题库）
const fetchBaseData = async () => {
    try {
        const params = {}
        if (typeof currentStationId.value !== 'undefined') {
            params.stationId = currentStationId.value
        }
        const rt = paperData.value.ruleType
        // 前三个下拉（职业道德、基础知识、专业相关知识）：竞赛时用 ruleType=0，否则用当前试卷用途
        const firstThreeRuleType = (rt === 1) ? 0 : rt
        if (firstThreeRuleType === 0 || firstThreeRuleType === 1 || firstThreeRuleType === 2) {
            params.ruleType = firstThreeRuleType
        }

        const response = await getAllBaseQuestions(params)
        const list = response && response.code === 200 && response.data && Array.isArray(response.data.list)
            ? response.data.list
            : []

        // 三个下拉框使用相同的数据（职业评定题库）
        baseOptions.value.workEthics = [...list]
        baseOptions.value.baseKnowledge = [...list]
        baseOptions.value.professionalKnowledge = [...list]

        filteredOptions.value.workEthics = [...list]
        filteredOptions.value.baseKnowledge = [...list]
        filteredOptions.value.professionalKnowledge = [...list]

        // 当试卷用途为竞赛时，获取竞赛题库选项（ruleType=1）
        if (paperData.value.ruleType === 1) {
            const compParams = { ...params, ruleType: 1 }
            const compRes = await getAllBaseQuestions(compParams)
            const compList = compRes && compRes.code === 200 && compRes.data && Array.isArray(compRes.data.list)
                ? compRes.data.list
                : []
            baseOptions.value.competition = [...compList]
            filteredOptions.value.competition = [...compList]
        } else {
            baseOptions.value.competition = []
            filteredOptions.value.competition = []
        }
    } catch (error) {
        console.error('获取基础数据失败:', error)
        ElMessage.error('获取基础数据失败')
    }
}

// 过滤选项
const filterOptions = (type, query) => {
    if (!query) {
        return baseOptions.value[type]
    }
    return baseOptions.value[type].filter(item => 
        item.questionName.toLowerCase().includes(query.toLowerCase())
    )
}

// 处理下拉选择框焦点事件
const handleSelectFocus = (type) => {
    // 当焦点进入时，确保显示所有选项
    filteredOptions.value[type] = baseOptions.value[type]
}

// 处理过滤变化事件
const handleFilterChange = (type, query) => {
    if (!query) {
        filteredOptions.value[type] = baseOptions.value[type]
    } else {
        filteredOptions.value[type] = baseOptions.value[type].filter(item => 
            item.questionName.toLowerCase().includes(query.toLowerCase())
        )
    }
}

// 防抖函数
const debounce = (func, delay) => {
    let timeoutId
    return (...args) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
}

// 远程搜索方法
const handleRemoteSearch = debounce(async (type, query) => {
    if (!query) {
        // 如果查询为空，显示所有选项
        filteredOptions.value[type] = [...baseOptions.value[type]]
        return
    }
    
    loading.value[type] = true
    try {
        const searchParams = {
            name: query
        }
        if (typeof currentStationId.value !== 'undefined') {
            searchParams.stationId = currentStationId.value
        }
        // 竞赛时：前三个用 ruleType=0，竞赛用 ruleType=1；非竞赛用当前试卷用途
        const rt = paperData.value.ruleType
        const isCompetition = rt === 1
        const searchRuleType = isCompetition
            ? (type === 'competition' ? 1 : 0)
            : rt
        if (searchRuleType === 0 || searchRuleType === 1 || searchRuleType === 2) {
            searchParams.ruleType = searchRuleType
        }
        
        const response = await getAllBaseQuestions(searchParams)
        if (response && response.code === 200 && response.data) {
            const list = Array.isArray(response.data.list) ? response.data.list : []
            filteredOptions.value[type] = list
        }
    } catch (error) {
        console.error('搜索基础数据失败:', error)
        ElMessage.error('搜索失败')
    } finally {
        loading.value[type] = false
    }
}, 300)

// 从后端 rule 字段回显题型数量与分值（题数 = rule 内 domain 之和）
const updateQuestionTypesFromRule = () => {
    const data = rule.value
    if (!data || typeof data !== 'object') return
    const r = data.rule || {}

    const getScore = (i) => {
        const v = r[`question_type_${i}_score`]
        return typeof v === 'number' ? v : Number(v || 0)
    }
    const getCount = (i) => {
        const obj = r[`question_type_${i}`] || {}
        // 兼容 domain_1 为对象或数字；现版本要求为数字
        const d1 = obj.domain_1 != null
            ? (typeof obj.domain_1 === 'number' ? obj.domain_1 : Number(obj.domain_1 || 0))
            : Number(obj.domain_1_num || 0)
        const d2 = Number(obj.domain_2_num || 0)
        const d3 = Number(obj.domain_3_num || 0)
        const d4 = Number(obj.domain_4_num || 0)
        return (d1 || 0) + (d2 || 0) + (d3 || 0) + (d4 || 0)
    }

    const mapping = [
        { name: '填空题', idx: 0 },
        { name: '单项选择题', idx: 1 },
        { name: '多项选择题', idx: 2 },
        { name: '判断题', idx: 3 },
        { name: '简答题', idx: 4 },
        { name: '综合题', idx: 5 },
    ]

    questionTypes.value = mapping.map(m => ({
        name: m.name,
        count: getCount(m.idx),
        score: getScore(m.idx)
    }))
    questionTypes.value.forEach((t, i) => { lastScoreByTypeIndex.value[i] = t.score })
}

// 是否显示竞赛规则（试卷用途为竞赛且规则包含竞赛字段）
const hasCompetitionRule = computed(() => {
    if (paperData.value.ruleType !== 1 || !rule.value) return false
    const r = rule.value
    return r.competition01 != null || r.competition02 != null || r.competition03 != null ||
        r.competition04 != null || r.competition05 != null || r.competition06 != null
})

// 规则数据
const rule = ref(null)
const ruleList = ref([]) // 多条规则列表
const showRuleSelectDialog = ref(false) // 是否显示规则选择对话框
const selectedRuleId = ref(null) // 选中的规则ID
// 原始规则快照（用于保持百分比恒定）
const originalRule = ref(null)
const totalScore = computed(() => {
    const data = rule.value
    if (!data || typeof data !== 'object') return 0
    const r = data.rule || {}
    const getScore = (i) => {
        const v = r[`question_type_${i}_score`]
        return typeof v === 'number' ? v : Number(v || 0)
    }
    const getCount = (i) => {
        const obj = r[`question_type_${i}`] || {}
        const d1 = obj.domain_1 != null
            ? (typeof obj.domain_1 === 'number' ? obj.domain_1 : Number(obj.domain_1 || 0))
            : Number(obj.domain_1_num || 0)
        const d2 = Number(obj.domain_2_num || 0)
        const d3 = Number(obj.domain_3_num || 0)
        const d4 = Number(obj.domain_4_num || 0)
        return (d1 || 0) + (d2 || 0) + (d3 || 0) + (d4 || 0)
    }
    let sum = 0
    for (let i = 0; i <= 5; i++) {
        sum += getCount(i) * getScore(i)
    }
    return sum
})

// 计算总题目数量（各题型题目数量之和）；竞赛时只计单选、多选、判断
const totalQuestions = computed(() => {
    try {
        const list = Array.isArray(questionTypes.value) ? questionTypes.value : []
        if (paperData.value.ruleType === 1) {
            const idx = [1, 2, 3]
            return idx.reduce((sum, i) => sum + Number(list[i] && list[i].count ? list[i].count : 0), 0)
        }
        return list.reduce((sum, t) => sum + Number(t && t.count ? t.count : 0), 0)
    } catch (e) {
        return 0
    }
})

// 题型配置展示列表：竞赛时只展示单选、多选、判断（对应 questionTypes 下标 1,2,3）
const displayQuestionTypes = computed(() => {
    const list = Array.isArray(questionTypes.value) ? questionTypes.value : []
    const isCompetition = paperData.value.ruleType === 1
    const indices = isCompetition ? [1, 2, 3] : [0, 1, 2, 3, 4, 5]
    return indices.map(i => ({ type: list[i], realIndex: i })).filter(item => item.type != null)
})

// 将UI等级映射为后端level编码
const levelToCode = (val) => {
    const s = String(val || '').trim()
    if (!s) return ''
    // 直接数字
    if (/^[1-5]$/.test(s)) return s
    if (/^[0-4]$/.test(s)) return String(Number(s) + 1)
    // 中文兼容：初级/中级/高级/技师/高级技师 + 带“工”后缀的文案
    if (/高级技师/.test(s)) return '5'
    if (/技师/.test(s)) return '4'
    if (/高级|高工/.test(s)) return '3'
    if (/中级|中工/.test(s)) return '2'
    if (/初级|初工/.test(s)) return '1'
    return ''
}

// 获取并设置规则（按编码；每次调用都传 ruleType：0=职业认定 1=竞赛 2=模拟考核）
const fetchRuleByCode = async (code) => {
    if (!code) {
        rule.value = null;
        originalRule.value = null;
        ruleList.value = [];
        // 清空为默认
        resetQuestionTypesToDefault()
        return
    }
    try {
        const rt = paperData.value.ruleType
        const params = {
            level: code,
            ruleType: rt === 0 || rt === 1 || rt === 2 ? rt : undefined
        }
        const res = await getQuestionGroupRuleByLevel(params)
        if (res && res.code === 200) {
            // 判断返回的是数组还是单个对象
            if (Array.isArray(res.data)) {
                // 多条规则，显示选择对话框
                ruleList.value = res.data
                showRuleSelectDialog.value = true
                // 默认选择第一条题目数量
                if (res.data.length > 0) {
                    selectedRuleId.value = res.data[0].id
                }
            } else {
                // 单条规则，直接使用
                rule.value = res.data || null
                ruleList.value = []
                // 保存原始规则快照（仅取内部的rule结构）
                originalRule.value = rule.value && rule.value.rule
                    ? JSON.parse(JSON.stringify(rule.value.rule))
                    : null
                // 根据后端返回的 rule 字段，自动回显题目数量与每题分值
                updateQuestionTypesFromRule()
            }
        } else {
            rule.value = null
            originalRule.value = null
            ruleList.value = []
            resetQuestionTypesToDefault()
        }
    } catch (e) {
        console.error('获取规则失败', e)
        rule.value = null
        originalRule.value = null
        ruleList.value = []
        resetQuestionTypesToDefault()
    }
}

// 选择规则
const selectRule = () => {
    if (!selectedRuleId.value) {
        ElMessage.warning('请选择一个规则')
        return
    }
    const selectedRule = ruleList.value.find(r => r.id === selectedRuleId.value)
    if (selectedRule) {
        rule.value = selectedRule
        // 保存原始规则快照
        originalRule.value = rule.value && rule.value.rule
            ? JSON.parse(JSON.stringify(rule.value.rule))
            : null
        // 根据后端返回的 rule 字段，自动回显题目数量与每题分值
        updateQuestionTypesFromRule()
        showRuleSelectDialog.value = false
    }
}

// 取消选择规则
const cancelRuleSelect = () => {
    showRuleSelectDialog.value = false
    ruleList.value = []
    selectedRuleId.value = null
    // 重置为默认
    rule.value = null
    originalRule.value = null
    resetQuestionTypesToDefault()
}

// 统一通过编码触发
const levelCode = computed(() => levelToCode(paperData.value.level))
watch(levelCode, (code) => {
    fetchRuleByCode(code)
}, { immediate: true })

// 移除重复的onLevelChange函数，避免重复调用接口
// const onLevelChange = (e) => {
//     const target = e && e.target ? e.target : null
//     const val = target ? target.value : paperData.value.level
//     const code = levelToCode(val)
//     fetchRuleByCode(code)
// }



// 更新题型提示显示
const updateTypeHint = (index) => {
    // 强制重新渲染提示
    const type = questionTypes.value[index];
    if (type) {
        type._hintUpdated = Date.now(); // 添加时间戳触发重新渲染
    }
};

// 根据题型名称生成提示文本（百分比与「当前规则」一致用顶层 workEthics/base/expert/competition；题数用 rule 内层 domain_1/2/3/4）
const getTypeHint = (name) => {
    if (!rule.value) return '';
    const r = rule.value || {};
    const rr = (originalRule.value) || {};
    const q = (idx) => rr[`question_type_${idx}`] || {};

    // 题数：用 rule 内层 domain
    const d1o = (idx) => Number(q(idx).domain_1 ?? 0);
    const d2o = (idx) => Number(q(idx).domain_2_num ?? 0);
    const d3o = (idx) => Number(q(idx).domain_3_num ?? 0);
    const d4o = (idx) => Number(q(idx).domain_4_num ?? 0);

    const mapping = {
        '填空题': 0,
        '单项选择题': 1,
        '多项选择题': 2,
        '判断题': 3,
        '简答题': 4,
        '综合题': 5,
    };
    const idx = mapping[name];
    if (idx === undefined) return '';

    const totalOrig = d1o(idx) + d2o(idx) + d3o(idx) + d4o(idx);
    const isCompetition = paperData.value.ruleType === 1 && hasCompetitionRule.value;

    if (idx === 4 || idx === 5) {
        const p3 = Number(idx === 4 ? (r.expert05 ?? 0) : (r.expert06 ?? 0));
        const c3 = d3o(idx);
        return `专业、相关知识 ${p3}% (${c3}题)`;
    }

    // 百分比：与「当前规则」一致，用顶层 workEthics02/base02/expert02/competition02 等（单选=02、多选=03、判断=04）
    const suffix = String(idx + 1).padStart(2, '0'); // "02"|"03"|"04"
    const p1 = Number(r[`workEthics${suffix}`] ?? r[`work_ethics_${suffix}`] ?? 0);
    const p2 = Number(r[`base${suffix}`] ?? 0);
    const p3 = Number(r[`expert${suffix}`] ?? 0);

    // 题数：用 rule 内层 domain_1、domain_2_num、domain_3_num
    const c1 = d1o(idx);
    const c2 = d2o(idx);
    const c3 = d3o(idx);

    let hint = `职业道德 ${p1}% (${c1}题) · 基础 ${p2}% (${c2}题) · 专业、相关知识 ${p3}% (${c3}题)`;
    if (isCompetition && idx >= 1 && idx <= 3) {
        const pComp = Number(r[`competition${suffix}`] ?? 0);
        const cComp = d4o(idx);
        hint += ` · 竞赛 ${pComp}% (${cComp}题)`;
    }
    return hint;
};

// 联动：切换选择时，下方部分默认清空
const clearFieldsBelowPurpose = () => {
    paperData.value.jobType = ''
    paperData.value.level = ''
    paperData.value.ease_or_difficulty = ''
    selectedBaseIds.value = {
        domain1_question_base_id: null,
        domain2_question_base_id: null,
        domain3_question_base_id: null,
        domain4_question_base_id: null
    }
    // questionTypes.value = [
    //     { name: "填空题", count: 5, score: 2 },
    //     { name: "单项选择题", count: 10, score: 2 },
    //     { name: "多项选择题", count: 5, score: 4 },
    //     { name: "判断题", count: 10, score: 1 },
    //     { name: "简答题", count: 3, score: 5 },
    //     { name: "综合题", count: 2, score: 10 }
    // ]
}
const clearFieldsBelowJobType = () => {
    paperData.value.level = ''
    paperData.value.ease_or_difficulty = ''
    selectedBaseIds.value = {
        domain1_question_base_id: null,
        domain2_question_base_id: null,
        domain3_question_base_id: null,
        domain4_question_base_id: null
    }
    // questionTypes.value = [
    //     { name: "填空题", count: 5, score: 2 },
    //     { name: "单项选择题", count: 10, score: 2 },
    //     { name: "多项选择题", count: 5, score: 4 },
    //     { name: "判断题", count: 10, score: 1 },
    //     { name: "简答题", count: 3, score: 5 },
    //     { name: "综合题", count: 2, score: 10 }
    // ]
}
const clearFieldsBelowLevel = () => {
    paperData.value.ease_or_difficulty = ''
    selectedBaseIds.value = {
        domain1_question_base_id: null,
        domain2_question_base_id: null,
        domain3_question_base_id: null,
        domain4_question_base_id: null
    }
    // questionTypes.value = [
    //     { name: "填空题", count: 5, score: 2 },
    //     { name: "单项选择题", count: 10, score: 2 },
    //     { name: "多项选择题", count: 5, score: 4 },
    //     { name: "判断题", count: 10, score: 1 },
    //     { name: "简答题", count: 3, score: 5 },
    //     { name: "综合题", count: 2, score: 10 }
    // ]
}
const clearFieldsBelowDifficulty = () => {
    selectedBaseIds.value = {
        domain1_question_base_id: null,
        domain2_question_base_id: null,
        domain3_question_base_id: null,
        domain4_question_base_id: null
    }
    // questionTypes.value = [
    //     { name: "填空题", count: 5, score: 2 },
    //     { name: "单项选择题", count: 10, score: 2 },
    //     { name: "多项选择题", count: 5, score: 4 },
    //     { name: "判断题", count: 10, score: 1 },
    //     { name: "简答题", count: 3, score: 5 },
    //     { name: "综合题", count: 2, score: 10 }
    // ]
}

const _skipClearFromEdit = ref(false)

// 试卷用途(ruleType)变更：清空下方所有字段，并按新用途重新拉取题库（职业认定/竞赛带 ruleType）
watch(() => paperData.value.ruleType, (newVal) => {
    if (_skipClearFromEdit.value) {
        _skipClearFromEdit.value = false
        if (newVal === 1) {
            paperData.value.questionBankType = 'competition'
            if (props.visible) fetchBaseData()
        } else {
            paperData.value.questionBankType = 'resource'
            baseOptions.value.competition = []
            filteredOptions.value.competition = []
            if (props.visible && (newVal === 0 || newVal === 2)) fetchBaseData()
        }
        return
    }
    _skipClearFromEdit.value = true
    clearFieldsBelowPurpose()
    _skipClearFromEdit.value = false
    if (newVal === 1) {
        paperData.value.questionBankType = 'competition'
        if (props.visible) fetchBaseData()
    } else {
        paperData.value.questionBankType = 'resource'
        baseOptions.value.competition = []
        filteredOptions.value.competition = []
        if (props.visible && (newVal === 0 || newVal === 2)) fetchBaseData()
    }
})

// 职业(工种)变更：清空下方字段
watch(() => paperData.value.jobType, () => {
    if (_skipClearFromEdit.value) return
    _skipClearFromEdit.value = true
    clearFieldsBelowJobType()
    _skipClearFromEdit.value = false
})

// 技能等级变更：清空下方字段
watch(() => paperData.value.level, () => {
    if (_skipClearFromEdit.value) return
    _skipClearFromEdit.value = true
    clearFieldsBelowLevel()
    _skipClearFromEdit.value = false
})

// 难易度变更：清空下方字段
watch(() => paperData.value.ease_or_difficulty, () => {
    if (_skipClearFromEdit.value) return
    _skipClearFromEdit.value = true
    clearFieldsBelowDifficulty()
    _skipClearFromEdit.value = false
})

// 监听编辑数据变化（加载时跳过联动清空）
const parseRuleType = (v) => {
    if (v === 0 || v === '0') return 0
    if (v === 1 || v === '1') return 1
    if (v === 2 || v === '2') return 2
    if (v === '职业认定') return 0
    if (v === '竞赛') return 1
    if (v === '模拟考核' || v === '模拟考试') return 2
    return ''
}
watch(() => props.editData, (newData) => {
    if (newData && Object.keys(newData).length > 0) {
        _skipClearFromEdit.value = true
        const rt = parseRuleType(newData.ruleType ?? newData.paperPurpose ?? '')
        paperData.value = {
            id: newData.id || null,
            name: newData.name || '',
            subtitle: newData.subtitle ?? newData.paperSubtitle ?? '',
            header: newData.header ?? newData.paperHeader ?? '',
            ruleType: rt,
            questionBankType: rt === 1 ? 'competition' : (newData.questionBankType || 'resource'),
            jobType: newData.jobType || '',
            level: newData.level || '',
            desc: newData.desc || '',
            ease_or_difficulty: newData.ease_or_difficulty ?? newData.easeOrDifficulty ?? ''
        }
    }
}, { immediate: true })

// 监听模态框显示状态
watch(() => props.visible, (newVisible) => {
    if (newVisible && !props.isEditMode) {
        // 新增模式，重置数据
        resetForm()
    }
    // 仅在选择试卷用途后再拉取题库，不在一进页面默认调用
    if (newVisible) {
        const rt = paperData.value.ruleType
        if (rt === 0 || rt === 1 || rt === 2) fetchBaseData()
    }
})

// 重置表单（试卷用途默认：考核站管理员=竞赛，管理/总管理=职业认定）
const resetForm = () => {
    const r = toRoleNumber(currentUser.value?.role)
    const defaultRuleType = r === ROLE_EXAM_STATION_ADMIN ? 1 : (r === ROLE_MANAGER ? 0 : '')
paperData.value = {
    id: null,
    name: '',
    subtitle: '',
    header: '',
    ruleType: defaultRuleType, // 0=职业认定 1=竞赛；考核站管理员默认1，管理/总管理默认0
    questionBankType: 'resource',
    jobType: '',
    level: '',
    desc: '',
    ease_or_difficulty: ''
}

    // 重置选中的基础数据ID
    selectedBaseIds.value = {
        domain1_question_base_id: null,
        domain2_question_base_id: null,
        domain3_question_base_id: null,
        domain4_question_base_id: null
    }

    // 重置题型配置为默认值
    // questionTypes.value = [
    //     { name: "填空题", count: 5, score: 2 },
    //     { name: "单项选择题", count: 10, score: 2 },
    //     { name: "多项选择题", count: 5, score: 4 },
    //     { name: "判断题", count: 10, score: 1 },
    //     { name: "简答题", count: 3, score: 5 },
    //     { name: "综合题", count: 2, score: 10 }
    // ]
    questionTypes.value.forEach((t, i) => { lastScoreByTypeIndex.value[i] = t.score })
}

// 关闭模态框
const handleClose = () => {
    emit('close')
}

// 保存试卷
const handleSave = async () => {
    // 验证表单
    if (!paperData.value.header?.trim()) {
        ElMessage.warning("请输入试卷页眉")
        return
    }
    if (!paperData.value.name) {
        ElMessage.warning("请输入试卷标题")
        return
    }
    if (!paperData.value.subtitle?.trim()) {
        ElMessage.warning("请输入试卷副标题")
        return
    }
    if (paperData.value.ruleType !== 0 && paperData.value.ruleType !== 1 && paperData.value.ruleType !== 2) {
        ElMessage.warning("请选择试卷用途")
        return
    }
    if (!paperData.value.jobType) {
        ElMessage.warning("请选择职业(工种)")
        return
    }
    if (!paperData.value.level) {
        ElMessage.warning("请选择技能等级")
        return
    }
    if (!paperData.value.ease_or_difficulty) {
        ElMessage.warning("请选择难易度")
        return
    }

    // 验证题型配置
    const validTypes = questionTypes.value.filter(type => type.count > 0)
    if (validTypes.length === 0) {
        ElMessage.warning("请至少为一种题型设置题目数量")
        return
    }

    // 验证每种题型的数量
    for (const type of questionTypes.value) {
        if (type.count > 0 && (!type.score || type.score <= 0)) {
            ElMessage.warning(`请为${type.name}设置每题分值`)
            return
        }
    }

    isSaving.value = true

    try {
        let response
        if (props.isEditMode) {
            // 编辑现有试卷
            const apiData = {
                id: paperData.value.id,
                pageHeader: paperData.value.header,
                mainTitle: paperData.value.name,
                subTitle: paperData.value.subtitle,
                name: paperData.value.name,
                subtitle: paperData.value.subtitle,
                header: paperData.value.header,
                ruleType: paperData.value.ruleType,
                questionBankType: paperData.value.questionBankType || 'resource',
                jobType: paperData.value.jobType,
                level: paperData.value.level,
                desc: paperData.value.desc,
                ease_or_difficulty: paperData.value.ease_or_difficulty
            }
            response = await updateExam(apiData)
        } else {
            // 添加新试卷 - 使用constructExamV3 API（组卷规则只能各用各的，不可混搭，仅使用所选的一条规则）
            const apiData = {
                pageHeader: paperData.value.header,
                mainTitle: paperData.value.name,
                subTitle: paperData.value.subtitle,
                name: paperData.value.name,
                subtitle: paperData.value.subtitle,
                header: paperData.value.header,
                ruleType: paperData.value.ruleType,
                questionBankType: paperData.value.questionBankType || 'resource', // 题库选择：资源题库/竞赛题库
                jobType: paperData.value.jobType,
                level: paperData.value.level,
                desc: paperData.value.desc,
                ease_or_difficulty: paperData.value.ease_or_difficulty,
                // 组卷规则ID：仅使用所选的一条规则，不混搭
                ruleId: rule.value && rule.value.id ? rule.value.id : undefined,
                // 添加基础数据ID
                domain1_question_base_id: selectedBaseIds.value.domain1_question_base_id,
                domain2_question_base_id: selectedBaseIds.value.domain2_question_base_id,
                domain3_question_base_id: selectedBaseIds.value.domain3_question_base_id,
                ...(paperData.value.ruleType === 1 ? { domain4_question_base_id: selectedBaseIds.value.domain4_question_base_id } : {}),
                // 添加题型配置，包含各领域数量和分数
                questionTypes: validTypes.map(type => {
                    const typeConfig = {
                        type: type.name,
                        count: type.count,
                        score: type.score,
                        domains: []
                    }

                    // 根据题型名称和规则生成各领域配置
                    if (rule.value && rule.value.rule) {
                        const r = rule.value.rule;
                        const mapping = {
                            '填空题': 0,
                            '单项选择题': 1,
                            '多项选择题': 2,
                            '判断题': 3,
                            '简答题': 4,
                            '综合题': 5,
                        };
                        const idx = mapping[type.name];

                        if (idx !== undefined) {
                            const q = r[`question_type_${idx}`] || {};
                            const d1Orig = Number(q.domain_1 ?? 0);
                            const d2Orig = Number(q.domain_2_num ?? 0);
                            const d3Orig = Number(q.domain_3_num ?? 0);
                            const totalOrig = d1Orig + d2Orig + d3Orig;

                            // 简答/综合：仅专业领域，数量=当前表单数量
                            if (idx === 4 || idx === 5) {
                                if (type.count > 0) {
                                    typeConfig.domains.push({
                                        domain: '专业知识',
                                        count: type.count,
                                        percentage: 100
                                    });
                                }
                            } else if (totalOrig > 0 && type.count > 0) {
                                // 其他题型：按原始占比缩放到当前表单的总数
                                const targets = [
                                    { name: '职业道德', orig: d1Orig },
                                    { name: '基础知识', orig: d2Orig },
                                    { name: '专业知识', orig: d3Orig },
                                ];
                                // 先计算未经修正的浮点目标
                                const raw = targets.map(t => ({
                                    name: t.name,
                                    value: (t.orig / totalOrig) * type.count
                                }));
                                // 四舍五入得到初始整数，并统计差额
                                let ints = raw.map(rw => Math.round(rw.value));
                                let sum = ints.reduce((a, b) => a + b, 0);
                                let diff = type.count - sum; // >0 需要补；<0 需要减

                                // 根据小数部分从大到小分配/回收，确保总和等于type.count
                                const fracIdx = raw
                                    .map((rw, i) => ({ i, frac: rw.value - Math.floor(rw.value) }))
                                    .sort((a, b) => b.frac - a.frac)
                                    .map(x => x.i);
                                let cursor = 0;
                                while (diff !== 0 && cursor < fracIdx.length) {
                                    const i = fracIdx[cursor];
                                    if (diff > 0) { ints[i] += 1; diff -= 1; }
                                    else if (diff < 0 && ints[i] > 0) { ints[i] -= 1; diff += 1; }
                                    cursor = (cursor + 1) % fracIdx.length;
                                }
                                // 写入结果（仅添加大于0的领域）
                                targets.forEach((t, i) => {
                                    if (ints[i] > 0) {
                                        typeConfig.domains.push({
                                            domain: t.name,
                                            count: ints[i],
                                            percentage: Math.round((ints[i] / type.count) * 100)
                                        });
                                    }
                                });
                            }
                        }
                    }

                    // 将题型名称映射为数字
                    const typeMapping = {
                        '填空题': 0,
                        '单项选择题': 1,
                        '多项选择题': 2,
                        '判断题': 3,
                        '简答题': 4,
                        '综合题': 5,
                    };
                    typeConfig.type = typeMapping[type.name] || 0;

                    return typeConfig;
                })
            }
            response = await constructExamV3(apiData)
        }

        if (response && response.code === 200) {
            // 使用弹窗显示成功信息
            ElMessageBox.alert(
                props.isEditMode ? "试卷更新成功！" : "自动组卷成功！",
                '操作成功',
                {
                    type: 'success',
                    confirmButtonText: '确定',
                    customClass: 'success-message-box'
                }
            ).then(() => {
                emit('saved')
                handleClose()
            })
        } else {
            throw new Error(
                response?.msg || (props.isEditMode ? "更新试卷失败" : "自动组卷失败")
            )
        }
    } catch (error) {
        console.error(props.isEditMode ? "更新试卷失败:" : "自动组卷失败:", error)
        const errorMessage = error.message || (props.isEditMode ? "更新试卷失败，请稍后重试" : "自动组卷失败，请稍后重试")

        // 使用弹窗显示错误信息
        ElMessageBox.alert(errorMessage, '操作失败', {
            type: 'error',
            confirmButtonText: '确定',
            customClass: 'error-message-box'
        })
    } finally {
        isSaving.value = false
    }
}

// 当每题分值变化时，自动调整题目数量以保持该题型总分不变
const onScoreChange = (index) => {
    const type = questionTypes.value[index];
    const originalCount = getOriginalCount(index);
    const originalScore = getOriginalScore(index);

    // 无规则数据时：用当前题数 × 上一分值 作为总分，再按新分值反算题数（type.score 已是新值）
    if (originalCount === 0 && type.count > 0 && type.score > 0) {
        const oldScore = (lastScoreByTypeIndex.value[index] ?? getOriginalScore(index)) || 1;
        const total = type.count * oldScore;
        const newCount = Math.round(total / type.score);
        if (newCount > 0 && total === newCount * type.score) {
            type.count = newCount;
            lastScoreByTypeIndex.value[index] = type.score;
            updateTypeHint(index);
            questionTypes.value = [...questionTypes.value];
        }
        return;
    }

    if (originalCount > 0 && type.score > 0) {
        // 保持该题型总分不变：原始数量 × 原始分值 = 新数量 × 新分值
        const originalTotal = originalCount * originalScore;
        const newCount = originalTotal / type.score;

        // 检查是否出现小数
        if (newCount !== Math.floor(newCount)) {
            // 出现小数，弹窗提示并恢复原值
            ElMessageBox.alert(
                `调整每题分值为 ${type.score} 分会导致题目数量出现小数 (${newCount.toFixed(2)})，这是不允许的。\n\n原始配置：${originalCount}题 × ${originalScore}分 = ${originalTotal}分\n\n建议选择能整除 ${originalTotal} 的分值。\n\n可用的分值选项：${getValidScoreOptions(originalTotal, index)}`,
                '分值调整失败',
                {
                    type: 'warning',
                    confirmButtonText: '确定',
                    customClass: 'warning-message-box'
                }
            );
            // 恢复原值
            type.score = originalScore;
            return;
        }

        // 检查是否会导致某个领域完全没有题目
        const rr = (originalRule.value) || {};
        const q = rr[`question_type_${index}`] || {};
        const d1o = Number(q.domain_1 ?? 0);
        const d2o = Number(q.domain_2_num ?? 0);
        const d3o = Number(q.domain_3_num ?? 0);
        const d4o = Number(q.domain_4_num ?? 0);

        const d1New = Math.round(newCount * (d1o / originalCount));
        const d2New = Math.round(newCount * (d2o / originalCount));
        const d3New = Math.round(newCount * (d3o / originalCount));
        const d4New = Math.round(newCount * (d4o / originalCount));

        if ((d1o > 0 && d1New === 0) ||
            (d2o > 0 && d2New === 0) ||
            (d3o > 0 && d3New === 0) ||
            (d4o > 0 && d4New === 0)) {

            // 某个领域会失去所有题目，阻止修改
            const domainNames = [];
            if (d1o > 0 && d1New === 0) domainNames.push('职业道德');
            if (d2o > 0 && d2New === 0) domainNames.push('基础');
            if (d3o > 0 && d3New === 0) domainNames.push('专业、相关知识');
            if (d4o > 0 && d4New === 0) domainNames.push('相关内容');

            ElMessageBox.alert(
                `调整每题分值为 ${type.score} 分会导致以下领域完全没有题目：${domainNames.join('、')}\n\n这是不允许的，每个领域必须至少保留1题。\n\n建议选择其他分值，确保所有领域都有题目。\n\n可用的分值选项：${getValidScoreOptions(originalTotal, index)}`,
                '分值调整失败',
                {
                    type: 'warning',
                    confirmButtonText: '确定',
                    customClass: 'warning-message-box'
                }
            );
            // 恢复原值
            type.score = originalScore;
            return;
        }

        // 检查各领域之间的比例关系是否保持一致
        let proportionChanged = false;
        let proportionDetails = [];

        // 检查职业道德与基础的比例
        if (d1o > 0 && d2o > 0) {
            const originalRatio = d1o / d2o;
            const newRatio = d1New / d2New;
            if (Math.abs(originalRatio - newRatio) > 0.01) { // 允许0.01的误差
                proportionChanged = true;
                proportionDetails.push(`职业道德:基础 从 ${d1o}:${d2o} 变为 ${d1New}:${d2New}`);
            }
        }

        // 检查职业道德与专业的比例
        if (d1o > 0 && d3o > 0) {
            const originalRatio = d1o / d3o;
            const newRatio = d1New / d3New;
            if (Math.abs(originalRatio - newRatio) > 0.01) {
                proportionChanged = true;
                proportionDetails.push(`职业道德:专业 从 ${d1o}:${d3o} 变为 ${d1New}:${d3New}`);
            }
        }

        // 检查基础与专业的比例
        if (d2o > 0 && d3o > 0) {
            const originalRatio = d2o / d3o;
            const newRatio = d2New / d3New;
            if (Math.abs(originalRatio - newRatio) > 0.01) {
                proportionChanged = true;
                proportionDetails.push(`基础:专业 从 ${d2o}:${d3o} 变为 ${d2New}:${d3New}`);
            }
        }

        if (proportionChanged) {
            ElMessageBox.alert(
                `调整每题分值为 ${type.score} 分会破坏各领域之间的比例关系：\n\n${proportionDetails.join('\n')}\n\n这是不允许的，必须保持原始的领域比例关系。\n\n建议选择其他分值，确保比例关系不变。\n\n可用的分值选项：${getValidScoreOptions(originalTotal, index)}`,
                '分值调整失败',
                {
                    type: 'warning',
                    confirmButtonText: '确定',
                    customClass: 'warning-message-box'
                }
            );
            // 恢复原值
            type.score = originalScore;
            return;
        }

        // 更新题目数量并刷新提示（百分比保持来自originalRule），并刷新列表引用使题数立即更新
        type.count = newCount;
        lastScoreByTypeIndex.value[index] = type.score;
        updateTypeHint(index);
        questionTypes.value = [...questionTypes.value];
    }
};

// 当题目数量变化时，自动调整每题分值以保持该题型总分不变
const onCountChange = (index) => {
    const type = questionTypes.value[index];
    const originalCount = getOriginalCount(index);
    const originalScore = getOriginalScore(index);

    if (type.count > 0 && originalCount > 0 && originalScore > 0) {
        // 保持该题型总分不变：原始数量 × 原始分值 = 新数量 × 新分值
        const originalTotal = originalCount * originalScore;
        const newScore = originalTotal / type.count;

        // 检查是否出现小数
        if (newScore !== Math.floor(newScore)) {
            // 出现小数，弹窗提示并恢复原值
            ElMessageBox.alert(
                `调整题目数量为 ${type.count} 会导致每题分值出现小数 (${newScore.toFixed(2)})，这是不允许的。\n\n原始配置：${originalCount}题 × ${originalScore}分 = ${originalTotal}分\n\n建议选择能整除 ${originalTotal} 的数量。`,
                '数量调整失败',
                {
                    type: 'warning',
                    confirmButtonText: '确定',
                    customClass: 'warning-message-box'
                }
            );
            // 恢复原值
            type.count = originalCount;
            return;
        }

        // 更新每题分值并刷新提示
        type.score = newScore;
        updateTypeHint(index);
    }
};

// 重新计算各领域的题目数量（仅用于提示展示，百分比始终取原始规则）
const recalculateDomainCounts = (index, newTotalCount) => {
    // 不再修改 rule.rule，提示展示时根据 originalRule + 当前总题数动态计算
    updateTypeHint(index);
};

// 获取原始题目数量（从规则中读取）
const getOriginalCount = (index) => {
    const data = rule.value;
    if (!data || typeof data !== 'object') return 0;
    const r = data.rule || {};
    const obj = r[`question_type_${index}`] || {};
    const d1 = obj.domain_1 != null ? Number(obj.domain_1 || 0) : 0;
    const d2 = Number(obj.domain_2_num || 0);
    const d3 = Number(obj.domain_3_num || 0);
    const d4 = Number(obj.domain_4_num || 0);
    return d1 + d2 + d3 + d4;
};

// 获取原始每题分值（从规则中读取）
const getOriginalScore = (index) => {
    const data = rule.value;
    if (!data || typeof data !== 'object') return 1;
    const r = data.rule || {};
    const score = r[`question_type_${index}_score`];
    return typeof score === 'number' ? score : Number(score || 1);
};

// 获取题型百分比（展示用，取 rule 内该题型四域题数之和）
const getTypePercentage = (name) => {
    if (!rule.value) return 0;
    const rr = (originalRule.value) || {};
    const q = (idx) => rr[`question_type_${idx}`] || {};

    const mapping = {
        '填空题': 0,
        '单项选择题': 1,
        '多项选择题': 2,
        '判断题': 3,
        '简答题': 4,
        '综合题': 5,
    };
    const idx = mapping[name];
    if (idx === undefined) return 0;

    const d1o = Number(q(idx).domain_1 ?? 0);
    const d2o = Number(q(idx).domain_2_num ?? 0);
    const d3o = Number(q(idx).domain_3_num ?? 0);
    const d4o = Number(q(idx).domain_4_num ?? 0);
    return d1o + d2o + d3o + d4o;
};

// 获取可用的分值选项（能整除原始总分的分值，且保证每个领域至少1题，且保持比例关系）
const getValidScoreOptions = (total, index) => {
    const options = [];
    const rr = (originalRule.value) || {};
    const q = rr[`question_type_${index}`] || {};

    // 获取原始各领域数量
    const d1o = Number(q.domain_1 ?? 0);
    const d2o = Number(q.domain_2_num ?? 0);
    const d3o = Number(q.domain_3_num ?? 0);
    const d4o = Number(q.domain_4_num ?? 0);

    for (let i = 1; i <= total; i++) {
        if (total % i === 0) {
            // 检查这个分值是否会导致某个领域没有题目
            const newCount = total / i;
            const d1New = Math.round(newCount * (d1o / total));
            const d2New = Math.round(newCount * (d2o / total));
            const d3New = Math.round(newCount * (d3o / total));
            const d4New = Math.round(newCount * (d4o / total));

            // 如果原始有题目但调整后没有题目，则跳过这个分值
            if ((d1o > 0 && d1New === 0) ||
                (d2o > 0 && d2New === 0) ||
                (d3o > 0 && d3New === 0) ||
                (d4o > 0 && d4New === 0)) {
                continue;
            }

            // 检查各领域之间的比例关系是否保持一致
            let proportionValid = true;

            // 检查职业道德与基础的比例
            if (d1o > 0 && d2o > 0) {
                const originalRatio = d1o / d2o;
                const newRatio = d1New / d2New;
                if (Math.abs(originalRatio - newRatio) > 0.01) {
                    proportionValid = false;
                }
            }

            // 检查职业道德与专业的比例
            if (d1o > 0 && d3o > 0) {
                const originalRatio = d1o / d3o;
                const newRatio = d1New / d3New;
                if (Math.abs(originalRatio - newRatio) > 0.01) {
                    proportionValid = false;
                }
            }

            // 检查基础与专业的比例
            if (d2o > 0 && d3o > 0) {
                const originalRatio = d2o / d3o;
                const newRatio = d2New / d3New;
                if (Math.abs(originalRatio - newRatio) > 0.01) {
                    proportionValid = false;
                }
            }

            // 如果比例关系被破坏，跳过这个分值
            if (!proportionValid) {
                continue;
            }

            options.push(i);
        }
    }
    return options.length > 0 ? options.join('、') : '无';
};
</script>

<style scoped>
/* 错误弹窗样式 */
:deep(.error-message-box) {
    border-radius: 8px;
}

:deep(.error-message-box .el-message-box__header) {
    background-color: #fef0f0;
    border-bottom: 1px solid #fde2e2;
}

:deep(.error-message-box .el-message-box__title) {
    color: #f56c6c;
    font-weight: 600;
}

:deep(.error-message-box .el-message-box__content) {
    padding: 20px;
    color: #606266;
    line-height: 1.6;
}

/* v2版本样式 */
.v2-note {
    color: #409eff;
    font-size: 0.8em;
    font-weight: normal;
}

.v2-info {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 16px;
    font-size: 14px;
    line-height: 1.5;
}

.v2-info p {
    margin: 4px 0;
    color: #0369a1;
}

.v2-info strong {
    color: #1e40af;
}

.config-hint {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 12px;
    font-size: 13px;
    line-height: 1.4;
}

.config-hint p {
    margin: 0;
    color: #0369a1;
}

/* 成功弹窗样式 */
:deep(.success-message-box) {
    border-radius: 8px;
}

:deep(.success-message-box .el-message-box__header) {
    background-color: #f0f9ff;
    border-bottom: 1px solid #bae6fd;
}

:deep(.success-message-box .el-message-box__title) {
    color: #67c23a;
    font-weight: 600;
}

:deep(.success-message-box .el-message-box__content) {
    padding: 20px;
    color: #606266;
    line-height: 1.6;
}

:deep(.success-message-box .el-button--primary) {
    background-color: #67c23a;
    border-color: #67c23a;
}

:deep(.success-message-box .el-button--primary:hover) {
    background-color: #85ce61;
    border-color: #85ce61;
}

/* 警告弹窗样式 */
:deep(.warning-message-box) {
    border-radius: 8px;
}

:deep(.warning-message-box .el-message-box__header) {
    background-color: #fef9e7;
    border-bottom: 1px solid #fdebd0;
}

:deep(.warning-message-box .el-message-box__title) {
    color: #f39c12;
    font-weight: 600;
}

:deep(.warning-message-box .el-message-box__content) {
    padding: 20px;
    color: #606266;
    line-height: 1.6;
}

/* 弹窗容器布局 */
.modal-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 900px;
    max-width: 95%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
}

.modal-body {
    padding: 16px 24px;
    flex: 1;
    overflow-y: auto;
}

/* 弹窗底部布局 */
.modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: white;
    border-radius: 0 0 8px 8px;
}

/* 左下角总分显示 */
.total-score-left {
    font-size: 16px;
    font-weight: 600;
    color: #409eff;
    padding: 8px 12px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
}

.total-score-left span {
    margin: 0;
}

/* 右侧按钮组 */
.footer-buttons {
    display: flex;
    gap: 12px;
}

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

.modal-header {
    padding: 16px 24px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #999;
}

.form-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.form-row--inline {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
    align-items: start;
}

.form-row--full {
    grid-template-columns: 1fr;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.form-row label {
    width: 80px;
    color: #666;
    font-size: 14px;
    flex-shrink: 0;
}

.form-group label {
    width: auto;
    color: #666;
    font-size: 14px;
    font-weight: 500;
}

.form-group label .required {
    color: #c70019;
    margin-left: 2px;
}

.form-control {
    flex: 1;
}

.form-select,
.form-input,
.form-textarea {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.form-input {
    min-height: 40px;
    padding: 10px 14px;
    font-size: 14px;
}

.form-textarea {
    resize: vertical;
    min-height: 80px;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: #409eff;
}

.question-type-config {
    margin-bottom: 16px;
}

.question-type-items {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.question-type-config h4 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
}

.question-type-item {
    margin-bottom: 0;
    padding: 12px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    background-color: #f8f9fa;
    height: fit-content;
}

.question-type-header {
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.question-type-name {
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.question-type-percentage {
    font-size: 12px;
    color: #909399;
    font-weight: 500;
}

.question-type-details {
    padding: 8px;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #dee2e6;
}

.question-type-inline {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: nowrap;
}

.question-type-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.input-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
}

.input-group label {
    white-space: nowrap;
    font-size: 12px;
    color: #606266;
    min-width: 56px;
    flex-shrink: 0;
}

.rule-hint {
    background: #f9fafb;
    border: 1px solid #eef1f5;
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 12px;
}

.rule-hint__title {
    font-size: 13px;
    color: #333;
    font-weight: 600;
    margin-bottom: 6px;
}

.rule-row--sub .rule-label {
    padding-left: 16px;
    color: #8c8c8c;
}

.rule-row {
    display: grid;
    grid-template-columns: 120px 1fr 200px;
    gap: 16px;
    font-size: 12px;
    color: #606266;
    padding: 8px 0;
    align-items: center;
}

.rule-label {
    font-size: 12px;
    color: #909399;
    font-weight: 500;
    flex-shrink: 0;
}

.rule-percentages {
    font-size: 12px;
    color: #606266;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 8px;
}

.rule-select {
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
}

.type-hint {
    font-size: 11px;
    color: #909399;
    line-height: 1.3;
    margin-top: 2px;
}

.rule-row span:first-child {
    width: 120px;
    color: #909399;
}

.type-hint {
    color: #909399;
    font-size: 12px;
}

.score-hint {
    color: #67c23a;
    font-size: 11px;
    font-style: italic;
    margin-top: 2px;
    display: block;
}

/* 移除重复的样式定义 */

.question-count-input,
.question-score-input {
    width: 70px;
    text-align: center;
    padding: 6px 4px;
    flex-shrink: 0;
}

.btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    border: none;
    transition: all 0.3s ease;
}

.btn-secondary {
    background-color: #f5f5f5;
    color: #666;
}

.btn-secondary:hover {
    background-color: #e8e8e8;
}

.btn-primary {
    background-color: #409eff;
    color: white;
}

.btn-primary:hover {
    background-color: #337ecc;
}

.btn-primary:disabled {
    background-color: #c0c4cc;
    cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .modal-container {
        width: 95%;
        margin: 20px;
    }

    .form-row {
        flex-direction: column;
        align-items: flex-start;
    }

    .form-row label {
        width: 100%;
        margin-bottom: 8px;
    }

    .question-type-row {
        flex-direction: column;
        gap: 15px;
    }
}

/* 规则选择对话框样式 */
.rule-select-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.rule-select-dialog {
    background: #fff;
    border-radius: 8px;
    width: 600px;
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.rule-select-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e4e7ed;
}

.rule-select-dialog-header h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.rule-select-dialog-header .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #909399;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    line-height: 24px;
}

.rule-select-dialog-header .close-btn:hover {
    color: #303133;
}

.rule-select-dialog-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.rule-select-tip {
    margin: 0 0 16px 0;
    color: #606266;
    font-size: 14px;
}

.rule-select-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.rule-select-item {
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s;
}

.rule-select-item:hover {
    border-color: #409eff;
    background-color: #ecf5ff;
}

.rule-select-item.active {
    border-color: #409eff;
    background-color: #ecf5ff;
}

.rule-select-item-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.rule-select-item-header input[type="radio"] {
    cursor: pointer;
}

.rule-id {
    font-weight: 600;
    color: #303133;
    font-size: 14px;
}

.rule-remark {
    color: #909399;
    font-size: 12px;
    margin-left: auto;
}

.rule-select-item-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-left: 24px;
}

.rule-detail-row {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: #606266;
}

.rule-detail-label {
    font-weight: 500;
    min-width: 80px;
    color: #909399;
}

.rule-select-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e4e7ed;
}
</style>
