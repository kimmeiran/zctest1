<template>
    <div class="manual-paper-page">
        <div class="breadcrumb-row">
            <BreadcrumbNav :items="breadcrumbItems" />
            <button type="button" class="btn-back" @click="$emit('goBack')">返回列表</button>
        </div>
        <!-- 页面头部 -->
        <div class="header-left">
            <h2 class="page-title">{{ props.isEditMode ? '编辑试卷' : '手动组卷' }}</h2>
        </div>

        <!-- 试卷基本信息和题库选择 - 超紧凑布局 -->
        <div class="paper-basic-section">
            <div class="basic-info-compact">
                <h4>试卷基本信息</h4>
                <div class="compact-form">
                    <div class="form-row-inline form-row-inline--full">
                        <div class="form-group-inline">
                            <label for="manual-paper-header">试卷页眉 <span class="required">*</span></label>
                            <input
                                id="manual-paper-header"
                                type="text"
                                class="form-select-inline form-input-inline"
                                v-model="currentPaper.header"
                                placeholder="请输入试卷页眉"
                            />
                        </div>
                    </div>
                    <div class="form-row-inline form-row-inline--full">
                        <div class="form-group-inline">
                            <label for="manual-paper-name">试卷标题 <span class="required">*</span></label>
                            <input
                                id="manual-paper-name"
                                type="text"
                                class="form-select-inline form-input-inline"
                                v-model="currentPaper.name"
                                placeholder="请输入试卷标题"
                            />
                        </div>
                    </div>
                    <div class="form-row-inline form-row-inline--full">
                        <div class="form-group-inline">
                            <label for="manual-paper-subtitle">试卷副标题 <span class="required">*</span></label>
                            <input
                                id="manual-paper-subtitle"
                                type="text"
                                class="form-select-inline form-input-inline"
                                v-model="currentPaper.subtitle"
                                placeholder="请输入试卷副标题"
                            />
                        </div>
                    </div>
                    <div class="form-row-inline">
                        <div class="form-group-inline">
                            <label for="manual-paper-purpose">试卷用途 <span class="required">*</span></label>
                            <select id="manual-paper-purpose" class="form-select-inline"
                                v-model.number="currentPaper.ruleType">
                                <option value="">请选择</option>
                                <option :value="0" :disabled="!canCreateCareerPaper">职业认定</option>
                                <option :value="1" :disabled="!canCreateCareerPaper">竞赛</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row-inline">
                        <div class="form-group-inline">
                            <label for="manual-position-select">职业(工种) <span class="required">*</span></label>
                            <select id="manual-position-select" class="form-select-inline"
                                v-model="currentPaper.jobType">
                                <option value="" disabled selected>请选择</option>
                                <option v-for="position in positionOptions" :key="position.id" :value="position.name">
                                    {{ position.name }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group-inline">
                            <label for="manual-exam-level">技能等级 <span class="required">*</span></label>
                            <select id="manual-exam-level" class="form-select-inline" v-model="currentPaper.level">
                                <option value="" disabled selected>请选择</option>
                                <option v-for="level in levelOptions" :key="level.id" :value="level.name">
                                    {{ level.name }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <!-- <div class="form-row-inline">
                        <div class="form-group-inline">
                            <label for="manual-paper-desc">试卷描述</label>
                            <textarea id="manual-paper-desc" class="form-textarea-inline" v-model="currentPaper.desc"
                                placeholder="请输入试卷描述"></textarea>
                        </div>
                    </div> -->

                    <!-- 各题型每题分数设置 -->
                    <div class="form-row-inline type-score-settings">
                        <div class="form-group-inline" v-for="t in questionTypeList" :key="t.value">
                            <label>每题分数（{{ t.label }}）</label>
                            <input type="number" class="form-select-inline" min="1" max="100"
                                v-model.number="defaultScores[t.value]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 题目预览区域 -->
        <div class="question-selection-preview-area">

            <!-- 右侧试卷预览区域 -->
            <div class="paper-preview-right">
                <div class="preview-header">
                    <h3>试卷预览</h3>
                    <div class="preview-meta">
                        <span class="preview-count">已选 {{ selectedQuestions.length }} 题</span>
                        <span class="preview-summary">总分: {{ totalScore }} 分</span>
                    </div>
                    <div class="preview-actions">
                        <button class="btn btn-primary-mini" @click="openPicker = true">题库选题</button>
                        <button class="btn btn-clear" @click="clearSelection">清空</button>
                    </div>
                </div>

                <!-- 预览题型筛选 -->
                <div class="preview-type-filter" v-if="selectedQuestions.length > 0">
                    <div class="filter-buttons">
                        <button v-for="type in previewTypeList" :key="type.value" class="filter-btn"
                            :class="{ active: selectedPreviewType === type.value }"
                            @click="selectPreviewType(type.value)">
                            {{ type.label }} ({{ getPreviewTypeCount(type.value) }})
                        </button>
                    </div>
                </div>

                <div class="preview-content">
                    <div v-if="selectedQuestions.length === 0" class="preview-empty">
                        <div class="empty-icon">📝</div>
                        <p>请点击上方「题库选题」添加题目</p>
                        <p>添加后将在此处预览试卷内容</p>
                    </div>

                    <div v-else class="preview-paper">
                        <div class="paper-questions">
                            <!-- 直接显示筛选后的题目列表 -->
                            <div v-for="(question, index) in filteredPreviewQuestions" :key="question.id"
                                class="preview-question">
                                <div class="question-meta">
                                    <span class="badge badge-type">{{ question.questionType }}</span>
                                    <span class="badge badge-score">{{ getDefaultScore(question.questionType) }} 分</span>
                                </div>
                                <div class="question-number">{{ index + 1 }}.</div>
                                <div class="question-content-preview">
                                    <div class="question-text"
                                        v-html="question._questionContentHtml || question.questionContent"></div>
                                    <div v-if="question._attachedImageUrl" class="question-attached-image">
                                        <img :src="question._attachedImageUrl" alt="题干附图" class="attached-img" />
                                    </div>
                                    <div class="question-options"
                                        v-if="question.questionType !== '填空题' && question.questionType !== '简答题' && question.questionType !== '综合题'">
                                        <div v-if="question.answera" class="option">A. <span
                                                v-html="question._answeraHtml || question.answera"></span></div>
                                        <div v-if="question.answerb" class="option">B. <span
                                                v-html="question._answerbHtml || question.answerb"></span></div>
                                        <div v-if="question.answerc" class="option">C. <span
                                                v-html="question._answercHtml || question.answerc"></span></div>
                                        <div v-if="question.answerd" class="option">D. <span
                                                v-html="question._answerdHtml || question.answerd"></span></div>
                                        <div v-if="question.answere" class="option">E. <span
                                                v-html="question._answereHtml || question.answere"></span></div>
                                        <div v-if="question.answerf" class="option">F. <span
                                                v-html="question._answerfHtml || question.answerf"></span></div>
                                        <div v-if="question.answerg" class="option">G. <span
                                                v-html="question._answergHtml || question.answerg"></span></div>
                                    </div>
                                    <div class="question-answer-preview">
                                        <strong>答案:</strong>
                                        <span v-if="question._answerHtml" v-html="question._answerHtml"></span>
                                        <span v-else>{{ formatAnswer(question.answer, question.questionType) }}</span>
                                    </div>
                                    <div v-if="question._answerImageUrl && !(question.answer && String(question.answer).includes('[img]'))"
                                        class="answer-attached-image">
                                        <img :src="question._answerImageUrl" alt="答案附图" class="answer-img" />
                                    </div>
                                    <button class="btn btn-clear btn-remove" @click="removePreviewQuestion(question.id)">删除</button>
                                </div>
                            </div>
                        </div>

                        
                    </div>
                </div>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="page-actions">
            <button class="btn btn-secondary" @click="goBack">取消</button>
            <button class="btn btn-primary" @click="saveManualPaper" :disabled="isSaving">
                {{ isSaving ? '保存中...' : (props.isEditMode ? '更新试卷' : '保存试卷') }}
            </button>
        </div>
        <QuestionBankPickerModal v-model="openPicker" :existingSelected="selectedQuestions" @confirm="handlePickerConfirm" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import BreadcrumbNav from "@/components/BreadcrumbNav.vue";
import QuestionBankPickerModal from "./manualPaper/QuestionBankPickerModal.vue";
import {
    getDictionaryByType,
    constructManualExam,
    updateExamWithQuestions,
    selectQuestionByBaseID,
    downloadFile
} from "@/api/user";
import { replaceImgPlaceholdersWithAuthAdvanced, fetchImageAsBlobUrl } from '@/api/imageUpload.js';
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, toRoleNumber } from '@/constants/role';
// import { getQuestionBankList, getQuestionsByBankId } from "@/api/questionBank";

// Props
const props = defineProps({
    positionOptions: {
        type: Array,
        default: () => []
    },
    levelOptions: {
        type: Array,
        default: () => []
    },
    // 编辑模式相关
    isEditMode: {
        type: Boolean,
        default: false
    },
    editPaperData: {
        type: Object,
        default: () => ({})
    },
    editQuestions: {
        type: Array,
        default: () => []
    }
});

// Emits
const emit = defineEmits(['goBack', 'paperSaved']);

// 面包屑：组卷管理 / 试卷列表 / 手动组卷（或编辑试卷）
const breadcrumbItems = computed(() => [
  { label: '组卷管理' },
  { label: '试卷列表', onClick: () => emit('goBack') },
]);

// 响应式数据
const currentPaper = ref({
    id: null,
    teachId: "",
    level: null,
    jobType: "",
    name: "",
    header: "",   // 试卷页眉
    subtitle: "", // 试卷副标题
    ruleType: "", // 0=职业认定 1=竞赛 2=模拟考核
    desc: "",
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
});

// 试卷用途权限
const getCurrentUser = () => {
    try {
        return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
};
const canCreateCareerPaper = computed(() => {
    const r = toRoleNumber(getCurrentUser().role);
    return r === ROLE_MANAGER;
});
const canCreateCompetitionPaper = computed(() => {
    const r = toRoleNumber(getCurrentUser().role);
    return r === ROLE_EXAM_STATION_ADMIN || r === ROLE_MANAGER;
});

// ruleType: 0=职业认定 1=竞赛 2=模拟考核（静态选项）

const selectedQuestionBank = ref("");
const questionBankList = ref([]);
const questionList = ref([]);
const selectedQuestions = ref([]);
const questionScores = ref({});
const selectedQuestionType = ref("填空题");
const selectedPreviewType = ref("全部");
const isSaving = ref(false);
const openPicker = ref(false);

// 题目详情富文本HTML（每题一项）
const questionContentHtmlList = ref([]);

// 题型分组映射
const questionTypeMap = {
    singleChoice: "单项选择题",
    multiChoice: "多项选择题",
    decide: "判断题",
    fillBlank: "填空题",
    shortAnswer: "简答题",
    comprehensive: "综合题"
};

// 题型列表 - 按照数据库映射关系排序
const questionTypeList = ref([
    { value: "填空题", label: "填空题" },
    { value: "单项选择题", label: "单项选择题" },
    { value: "多项选择题", label: "多项选择题" },
    { value: "判断题", label: "判断题" },
    { value: "简答题", label: "简答题" },
    { value: "综合题", label: "综合题" }
]);

// 预览题型列表（包含全部选项）
const previewTypeList = ref([
    { value: "全部", label: "全部" },
    { value: "填空题", label: "填空题" },
    { value: "单项选择题", label: "单项选择题" },
    { value: "多项选择题", label: "多项选择题" },
    { value: "判断题", label: "判断题" },
    { value: "简答题", label: "简答题" },
    { value: "综合题", label: "综合题" }
]);

// 各题型默认分数字典（可在页面维护）
const defaultScores = ref({
    "填空题": 1,
    "单项选择题": 1,
    "多项选择题": 1,
    "判断题": 1,
    "简答题": 5,
    "综合题": 10
});

const persistTypeScores = () => {
    try {
        localStorage.setItem("manualPaperDefaultScores", JSON.stringify(defaultScores.value));
    } catch (_) {}
};

// 计算属性
const filteredQuestions = computed(() => {
    return questionList.value.filter(question => question.questionType === selectedQuestionType.value);
});

// 试卷预览相关计算属性
const totalScore = computed(() => {
    return selectedQuestions.value.reduce((total, question) => {
        return total + getDefaultScore(question.questionType);
    }, 0);
});

// 题型统计信息（仅用于题库选择模式）
const questionTypeSummary = computed(() => {
    if (selectedQuestions.value.length > 0) {
        const summary = {};
        selectedQuestions.value.forEach(question => {
            const type = question.questionType;
            if (!summary[type]) {
                summary[type] = { count: 0, totalScore: 0 };
            }
            summary[type].count++;
            summary[type].totalScore += questionScores.value[question.id] || question.score || 0;
        });
        return summary;
    }
    return {};
});

const questionTypeDistribution = computed(() => {
    const distribution = {};
    selectedQuestions.value.forEach(question => {
        const type = question.questionType;
        distribution[type] = (distribution[type] || 0) + 1;
    });
    return Object.entries(distribution)
        .map(([type, count]) => `${type}${count}题`)
        .join(', ');
});

// 按题型分组的选中题目
const groupedSelectedQuestions = computed(() => {
    const grouped = {};
    selectedQuestions.value.forEach(question => {
        const type = question.questionType;
        if (!grouped[type]) {
            grouped[type] = [];
        }
        grouped[type].push(question);
    });
    return grouped;
});

// 筛选后的预览题目（按题型分组）
const filteredGroupedSelectedQuestions = computed(() => {
    if (selectedPreviewType.value === "全部") {
        return groupedSelectedQuestions.value;
    }

    const filtered = {};
    selectedQuestions.value.forEach(question => {
        if (question.questionType === selectedPreviewType.value) {
            const type = question.questionType;
            if (!filtered[type]) {
                filtered[type] = [];
            }
            filtered[type].push(question);
        }
    });
    return filtered;
});

// 筛选后的预览题目列表（直接显示）
const filteredPreviewQuestions = computed(() => {
    if (selectedPreviewType.value === "全部") {
        return selectedQuestions.value;
    }
    return selectedQuestions.value.filter(question => question.questionType === selectedPreviewType.value);
});

const getPreviewTypeCount = (type) => {
    if (type === '全部') return selectedQuestions.value.length;
    return selectedQuestions.value.filter(q => q.questionType === type).length;
};

// 获取题目序号（按题型分组后的序号）
const getQuestionNumber = (question) => {
    let number = 1;
    for (const [type, questions] of Object.entries(groupedSelectedQuestions.value)) {
        if (type === question.questionType) {
            const index = questions.findIndex(q => q.id === question.id);
            if (index !== -1) {
                return number + index;
            }
        }
        number += questions.length;
    }
    return 1;
};

// 获取题目分数（实时更新）
const getQuestionScore = (question) => {
    return questionScores.value[question.id] || getDefaultScore(question.questionType);
};

// 方法
const goBack = () => {
    emit('goBack');
};

// 题库列表由弹窗组件内部加载

const isQuestionSelected = question => {
    return selectedQuestions.value.some(q => q.id === question.id);
};

const selectAllQuestions = () => {
    const currentTypeQuestions = filteredQuestions.value;
    selectedQuestions.value = [...currentTypeQuestions];
    currentTypeQuestions.forEach(question => {
        questionScores.value[question.id] = question.score || 2;
    });
};

const clearSelection = () => {
    selectedQuestions.value = [];
    questionScores.value = {};
};

const toggleQuestionSelection = question => {
    const index = selectedQuestions.value.findIndex(q => q.id === question.id);

    if (index !== -1) {
        // 已选中，取消选择
        selectedQuestions.value.splice(index, 1);
        delete questionScores.value[question.id];
    } else {
        // 未选中，添加到选择列表
        selectedQuestions.value.push({ ...question });
        questionScores.value[question.id] = question.score || 2;
    }
};

// 从预览/已选列表中移除题目
const removePreviewQuestion = (questionId) => {
    const index = selectedQuestions.value.findIndex(q => q.id === questionId);
    if (index !== -1) {
        selectedQuestions.value.splice(index, 1);
        delete questionScores.value[questionId];
    }
};

// 选择题目用于预览
const selectQuestionForPreview = question => {
    // 这个方法可以用于在预览区域高亮显示当前选中的题目
    // 目前只是切换选择状态
    toggleQuestionSelection(question);
};

const selectQuestionType = type => {
    selectedQuestionType.value = type;
};

const selectPreviewType = type => {
    selectedPreviewType.value = type;
};

const getQuestionTypeLabel = (type) => {
    const typeMap = {
        "填空题": "填空题",
        "单项选择题": "单项选择题",
        "多项选择题": "多项选择题",
        "判断题": "判断题",
        "简答题": "简答题",
        "综合题": "综合题"
    };
    return typeMap[type] || type;
};

const getDefaultScore = (questionType) => {
    return defaultScores.value[questionType] ?? 2;
};

const formatAnswer = (answer, questionType) => {
    if (questionType === "判断题") {
        return answer === "A" ? "正确" : "错误";
    }
    return answer;
};

// 根据数字获取题目类型
const getQuestionTypeFromNumber = (typeNumber) => {
    const typeMap = {
        "0": "填空题",
        "1": "单项选择题",
        "2": "多项选择题",
        "3": "判断题",
        "4": "简答题",
        "5": "综合题"
    };
    return typeMap[typeNumber] || "单项选择题";
};

const loadQuestionsFromBank = async () => {
    try {
        if (!selectedQuestionBank.value) {
            ElMessage.warning("请先选择题库");
            return;
        }

        // 使用selectQuestionByBaseID接口
        const response = await selectQuestionByBaseID({
            questionBaseId: selectedQuestionBank.value,
            offset: 0,
            limit: 1000 // 获取所有题目
        });

        if (response && response.code === 200) {
            const questions = response.data?.list || [];
            // 转换题目数据格式
            questionList.value = questions.map(q => ({
                id: q.id,
                questionType: getQuestionTypeFromNumber(q.questionType),
                questionContent: q.questionContent,
                answera: q.answera,
                answerb: q.answerb,
                answerc: q.answerc,
                answerd: q.answerd,
                answere: q.answere,
                answerf: q.answerf,
                answerg: q.answerg,
                answer: q.answer,
                score: getDefaultScore(getQuestionTypeFromNumber(q.questionType))
            }));
            ElMessage.success(`成功加载 ${questionList.value.length} 道题目`);
        } else {
            throw new Error(response?.msg || "加载题库题目失败");
        }
    } catch (error) {
        console.error("加载题库题目失败:", error);
        ElMessage.error("加载题库题目失败，使用默认数据");
        // 使用默认数据
        questionList.value = [
            {
                id: "1",
                questionType: "填空题",
                questionContent: "钻头的切削刃对称于()分布,径向切削力相互抵消,所以钻头不易弯曲。",
                answer: "轴线",
                score: 2
            },
            {
                id: "2",
                questionType: "单项选择题",
                questionContent: "刀具的前角、主后角和楔角之和(    )。",
                answer: "A",
                score: 2
            },
            {
                id: "3",
                questionType: "单项选择题",
                questionContent: "有一把游标卡尺，其尺身每一小格为1mm，游标刻线总长为19mm并均分20格，则此游标卡尺的读数精度为(    )mm。",
                answer: "B",
                score: 2
            },
            {
                id: "4",
                questionType: "多项选择题",
                questionContent: "为减轻刮削这种繁重的体力劳动，在粗刮之前的机械加工要达到一定的(    )。",
                answer: "A,B,C",
                score: 4
            },
            {
                id: "5",
                questionType: "判断题",
                questionContent: "螺纹的螺距越小,则螺纹的精度越高。()",
                answer: "A",
                score: 1
            },
            {
                id: "6",
                questionType: "简答题",
                questionContent: "简述切削加工的基本原理。",
                answer: "切削加工是利用刀具从工件上切除多余材料，以获得所需形状、尺寸和表面质量的加工方法。",
                score: 5
            },
            {
                id: "7",
                questionType: "综合题",
                questionContent: "分析影响切削加工质量的主要因素，并说明如何提高加工质量。",
                answer: "影响切削加工质量的主要因素包括：1.刀具几何参数；2.切削用量；3.工件材料；4.机床精度；5.切削液。提高加工质量的方法：1.合理选择刀具；2.优化切削参数；3.使用合适的切削液；4.保证机床精度。",
                score: 10
            }
        ];
    }
};



const saveManualPaper = async () => {
    if (selectedQuestions.value.length === 0) {
        ElMessage.warning("请至少选择一道题目");
        return;
    }

    if (!currentPaper.value.header?.trim()) {
        ElMessage.warning("请输入试卷页眉");
        return;
    }
    if (!currentPaper.value.name) {
        ElMessage.warning("请输入试卷标题");
        return;
    }
    if (!currentPaper.value.subtitle?.trim()) {
        ElMessage.warning("请输入试卷副标题");
        return;
    }
    if (currentPaper.value.ruleType !== 0 && currentPaper.value.ruleType !== 1 && currentPaper.value.ruleType !== 2) {
        ElMessage.warning("请选择试卷用途");
        return;
    }
    if (!currentPaper.value.jobType || !currentPaper.value.level) {
        ElMessage.warning("请填写职业(工种)和技能等级");
        return;
    }

    // 校验总分是否为100
    if (totalScore.value !== 100) {
        ElMessage.warning(`当前总分为 ${totalScore.value} 分，请调整为 100 分`);
        return;
    }

    isSaving.value = true;

    try {
        // 准备试卷数据（页眉、主标题、副标题传给后端字段 pageHeader、mainTitle、subTitle）
        const paperData = {
            ...currentPaper.value,
            pageHeader: currentPaper.value.header,
            mainTitle: currentPaper.value.name,
            subTitle: currentPaper.value.subtitle,
            questions: selectedQuestions.value.map(q => ({
                id: q.id,
                score: getDefaultScore(q.questionType)
            }))
        };

        let response;
        if (props.isEditMode) {
            // 编辑模式：更新试卷和题目
            const updateData = {
                id: currentPaper.value.id,
                teachId: currentPaper.value.teachId,
                level: currentPaper.value.level,
                jobType: currentPaper.value.jobType,
                name: currentPaper.value.name,
                header: currentPaper.value.header,
                subtitle: currentPaper.value.subtitle,
                pageHeader: currentPaper.value.header,
                mainTitle: currentPaper.value.name,
                subTitle: currentPaper.value.subtitle,
                ruleType: currentPaper.value.ruleType,
                desc: currentPaper.value.desc,
                questions: selectedQuestions.value.map(q => ({
                    id: q.id,
                    score: getDefaultScore(q.questionType)
                }))
            };
            response = await updateExamWithQuestions(updateData);
        } else {
            // 新建模式：创建试卷（手动组卷接口）
            response = await constructManualExam(paperData);
        }

        if (response && response.code === 200) {
            ElMessage.success(props.isEditMode ? "试卷更新成功" : "手动组卷成功");
            emit('paperSaved');
            goBack();
        } else {
            throw new Error(response?.msg || (props.isEditMode ? "更新试卷失败" : "手动组卷失败"));
        }
    } catch (error) {
        console.error(props.isEditMode ? "更新试卷失败:" : "手动组卷失败:", error);
        ElMessage.error(error.message || (props.isEditMode ? "更新试卷失败，请稍后重试" : "手动组卷失败，请稍后重试"));
    } finally {
        isSaving.value = false;
    }
};

// 组件挂载时初始化（试卷用途默认：考核站管理员=竞赛，管理/总管理=职业认定）
onMounted(async () => {
    // 获取用户信息
    const users = JSON.parse(sessionStorage.getItem("user") || "{}");
    currentPaper.value.teachId = users.id;

    if (!props.isEditMode) {
        const r = toRoleNumber(users.role);
        if (r === ROLE_EXAM_STATION_ADMIN) currentPaper.value.ruleType = 1;
        else if (r === ROLE_MANAGER) currentPaper.value.ruleType = 0;
    }

    // 如果是编辑模式，初始化编辑数据
    if (props.isEditMode && props.editPaperData) {
        const edit = props.editPaperData;
        const parseRuleType = (v) => {
            if (v === 0 || v === '0') return 0;
            if (v === 1 || v === '1') return 1;
            if (v === 2 || v === '2') return 2;
            if (v === '职业认定') return 0;
            if (v === '竞赛') return 1;
            if (v === '模拟考核' || v === '模拟考试') return 2;
            return '';
        };
        const rt = parseRuleType(edit.ruleType ?? edit.paperPurpose ?? '');
        currentPaper.value = {
            ...currentPaper.value,
            ...edit,
            header: edit.header ?? edit.paperHeader ?? currentPaper.value.header ?? '',
            subtitle: edit.subtitle ?? edit.paperSubtitle ?? currentPaper.value.subtitle ?? '',
            ruleType: rt !== '' ? rt : edit.ruleType ?? edit.paperPurpose ?? ''
        };

        // 如果有已选题目，初始化题目数据
        if (props.editQuestions && props.editQuestions.length > 0) {
            selectedQuestions.value = [...props.editQuestions];
            // 初始化题目分数
            props.editQuestions.forEach(question => {
                questionScores.value[question.id] = question.score || getDefaultScore(question.questionType);
            });
            // 处理题目图片
            await processQuestionImages(selectedQuestions.value);
        }
    }

    // 读取本地默认分数配置
    try {
        const saved = localStorage.getItem("manualPaperDefaultScores");
        if (saved) {
            const parsed = JSON.parse(saved);
            defaultScores.value = { ...defaultScores.value, ...parsed };
        }
    } catch (_) {}

    // 题库列表改为弹窗内部加载
});

// 弹窗事件处理
const handlePickerConfirm = async (picked) => {
    const map = new Map();
    [...selectedQuestions.value, ...picked].forEach(q => {
        map.set(q.id, q);
        questionScores.value[q.id] = q.score || getDefaultScore(q.questionType);
    });
    const merged = Array.from(map.values());
    selectedQuestions.value = merged;
    // 处理题目图片（题干/选项/答案中的 [img] 占位符及题干附图、答案附图）
    await processQuestionImages(merged);
};

// 处理题目中的图片占位符及题干附件图、答案附图（与 PaperDetailView、QuestionTable 一致）
const processQuestionImages = async (questions) => {
    if (!questions || questions.length === 0) return;
    try {
        await Promise.all(
            questions.map(async (q) => {
                const contentImages = q.question_content_images ?? q.questionContentImages ?? q.questionImages ?? '';
                if (q.questionContent) {
                    q._questionContentHtml = await replaceImgPlaceholdersWithAuthAdvanced(q.questionContent, contentImages);
                }
                const optImages = q.option_images || q.optionImages || '';
                const optionFields = ['answera', 'answerb', 'answerc', 'answerd', 'answere', 'answerf', 'answerg', 'answerh', 'answeri', 'answerj'];
                for (const field of optionFields) {
                    if (q[field]) {
                        q[`_${field}Html`] = await replaceImgPlaceholdersWithAuthAdvanced(q[field], optImages);
                    }
                }
                const answerImages = q.answer_image ?? q.answerImage ?? '';
                if (q.answer) {
                    q._answerHtml = await replaceImgPlaceholdersWithAuthAdvanced(q.answer, answerImages);
                }
                // 题干附件图
                const attachedImg = q.attachedImage || q.attached_image;
                if (attachedImg) {
                    try {
                        const imgPath = Array.isArray(attachedImg) && attachedImg.length > 0
                            ? (attachedImg[0].url || attachedImg[0])
                            : attachedImg;
                        if (typeof imgPath === 'string' && imgPath) {
                            q._attachedImageUrl = await fetchImageAsBlobUrl(imgPath);
                        }
                    } catch (e) {
                        console.error('获取题干附件图失败:', e);
                    }
                }
                // 答案附图：仅当答案正文不含 [img] 时单独展示
                const answerImg = q.answerImage || q.answer_image;
                if (answerImg) {
                    try {
                        const imgPath = Array.isArray(answerImg) && answerImg.length > 0
                            ? (answerImg[0].url || answerImg[0])
                            : answerImg;
                        if (typeof imgPath === 'string' && imgPath) {
                            q._answerImageUrl = await fetchImageAsBlobUrl(imgPath);
                        }
                    } catch (e) {
                        console.error('获取答案附图失败:', e);
                    }
                }
            })
        );
        questionContentHtmlList.value = questions.map(q => q._questionContentHtml || q.questionContent || '');
    } catch (error) {
        console.error('处理题目图片失败:', error);
    }
};
</script>

<style scoped>
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
  color: var(--color-primary-brand);
  border-color: var(--color-primary-brand);
}

.manual-paper-page {
    padding: 20px;
}

.header-left {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
}

.page-title {
    margin: 0;
    color: #333;
    font-size: 24px;
    font-weight: 600;
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

.paper-basic-section,
.question-selection-preview-area {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    background-color: #fafafa;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.basic-info-compact {
    flex: 1;
    padding: 0;
}

.compact-form {
    padding: 0;
}

.form-row-horizontal {
    display: flex;
    gap: 15px;
    margin-bottom: 12px;
    align-items: flex-end;
}

.form-group-mini {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.form-group-mini label {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
    font-weight: 500;
}

.form-select-mini {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    background-color: white;
}

.form-select-mini:focus {
  outline: none;
  border-color: var(--color-primary-hover);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-textarea-mini {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.form-textarea-mini:focus {
  outline: none;
  border-color: var(--color-primary-hover);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.btn-primary-mini {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  background-color: var(--color-primary);
  color: white;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary-mini:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-primary-mini:disabled {
    background-color: #d9d9d9;
    cursor: not-allowed;
    transform: none;
}

/* 内联表单样式 */
.form-row-inline {
    display: flex;
    gap: 15px;
    margin-bottom: 12px;
    align-items: flex-end;
}

.form-row-inline--full {
    display: block;
}
.form-row-inline--full .form-group-inline {
    max-width: none;
    width: 100%;
}

.form-input-inline {
    min-height: 40px;
    padding: 10px 14px;
    font-size: 14px;
}

/* 统一标签宽度，使所有输入框左对齐 */
.compact-form .form-group-inline label {
    width: 100px;
    min-width: 100px;
    flex-shrink: 0;
}

.form-group-inline {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.form-group-inline label {
    font-size: 13px;
    color: #333;
    font-weight: 500;
    white-space: nowrap;
}

/* 必填项标识更明显 */
.compact-form .form-group-inline label .required {
    color: #c00;
    font-weight: 700;
    margin-left: 2px;
    font-size: 14px;
}

.form-select-inline {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    background-color: white;
}

.form-select-inline:focus {
  outline: none;
  border-color: var(--color-primary-hover);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-textarea-inline {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.form-textarea-inline:focus {
  outline: none;
  border-color: var(--color-primary-hover);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 每题分数设置样式 - 左右布局，标签加宽避免文字被遮挡 */
.type-score-settings {
    display: grid;
    grid-template-columns: repeat(3, minmax(220px, 1fr));
    gap: 12px 20px;
    margin-top: 12px;
}
.type-score-settings .form-group-inline {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    min-width: 0;
}
.type-score-settings .form-group-inline label {
    flex-shrink: 0;
    min-width: 140px;
    font-size: 13px;
    color: #333;
    white-space: nowrap;
    overflow: visible;
}
.type-score-settings .form-select-inline {
    width: 70px;
    min-width: 70px;
    flex-shrink: 0;
}

.question-selection-left {
    flex: 1;
    height: 1000px;
    display: flex;
    flex-direction: column;
}

.paper-preview-right {
    flex: 1;
    padding-left: 20px;
    height: 1000px;
    display: flex;
    flex-direction: column;
}

.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.preview-actions { display: flex; align-items: center; gap: 8px; }
.preview-actions .btn { padding: 6px 12px; font-size: 12px; border-radius: 4px; }
.preview-meta { display: flex; align-items: center; gap: 12px; }
.preview-summary { color: #666; font-size: 12px; }

.preview-header h3 {
    margin: 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
}

.preview-count {
    color: #666;
    font-size: 12px;
}

.preview-content {
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    background-color: #fafafa;
    padding: 15px;
    flex: 1;
    overflow-y: auto;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 0;
    color: #999;
    font-size: 18px;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.preview-paper {
    padding: 20px;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    background-color: white;
}

.paper-title {
    margin-bottom: 15px;
}

.paper-title h2 {
    margin-top: 0;
    margin-bottom: 5px;
    color: #333;
    font-size: 18px;
}

.paper-desc {
    color: #666;
    font-size: 14px;
    margin-bottom: 15px;
}

.paper-questions {
    margin-bottom: 20px;
}

.question-type-section {
    margin-bottom: 20px;
}

.question-type-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  padding: 8px 12px;
  background-color: var(--color-primary-bg);
  border-left: 3px solid var(--color-primary);
  border-radius: 4px;
}

.preview-question {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  margin-bottom: 8px;
  background-color: white;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.preview-question { position: relative; }
.question-meta { position: absolute; right: 12px; top: 8px; display: flex; gap: 8px; }
.badge { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 12px; }
.badge-type { background: var(--color-primary-bg); color: var(--color-primary); }
.badge-score { background: var(--color-warning-bg); color: var(--color-warning); }

.preview-question:hover {
  background-color: var(--color-primary-bg);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.question-number {
  width: 30px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  margin-right: 15px;
}

.question-content-preview {
    flex: 1;
    margin-right: 15px;
}

.question-text {
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    margin-bottom: 8px;
}

.question-options {
    font-size: 13px;
    color: #555;
    margin-bottom: 8px;
}

.option {
    margin-left: 20px;
    margin-bottom: 5px;
}

.question-answer-preview {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.question-attached-image {
  margin-top: 8px;
}
.question-attached-image .attached-img,
.answer-attached-image .answer-img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  vertical-align: middle;
}
.answer-attached-image {
  margin-top: 8px;
  margin-bottom: 8px;
}

.question-score-preview {
    font-size: 13px;
    color: #666;
}

/* 删除按钮样式（预览卡片右下角） */
.btn-remove { 
    position: absolute; 
    right: 12px; 
    bottom: 12px; 
    padding: 4px 10px; 
    font-size: 12px; 
}

.paper-summary {
    display: flex;
    justify-content: space-around;
    padding-top: 15px;
    border-top: 1px solid #e8e8e8;
}

.title-summary {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
}

.summary-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.summary-item span:first-child {
    font-size: 14px;
    color: #666;
}

.summary-item span:last-child {
    font-size: 14px;
    font-weight: 600;
    color: #333;
}

.page-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e8e8e8;
}

/* 题目选择区域样式 */
.selection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.selection-actions {
    display: flex;
    gap: 10px;
}

.question-bank-controls {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e8e8e8;
}

.bank-selection-row {
    display: flex;
    gap: 15px;
    align-items: flex-end;
}

.bank-select-group {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.bank-select-group label {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
    font-weight: 500;
}

.question-type-filter {
    margin-bottom: 20px;
}

.question-type-filter h4 {
    margin-bottom: 15px;
    color: #333;
    font-size: 14px;
    font-weight: 600;
}

.preview-type-filter {
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e8e8e8;
}

.filter-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.filter-btn {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background-color: white;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
    font-weight: 500;
}

.filter-btn:hover {
  background-color: var(--color-primary-bg);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.filter-btn.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
}

.questions-container {
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    background-color: white;
    padding: 20px;
    flex: 1;
    overflow-y: auto;
}

.questions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.questions-header h4 {
    margin: 0;
    color: #333;
    font-size: 14px;
    font-weight: 600;
}

.question-count {
    color: #666;
    font-size: 12px;
}

.questions-list {
    max-height: 400px;
    overflow-y: auto;
}

.question-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    margin-bottom: 8px;
    background-color: white;
    transition: all 0.2s;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.question-item:hover {
  background-color: var(--color-primary-bg);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.question-item.selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary-bg);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.question-info {
    flex: 1;
}

.question-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.question-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.question-id {
    color: #666;
    font-size: 12px;
}

.question-type {
  color: var(--color-primary);
  font-size: 12px;
  padding: 2px 6px;
  background-color: var(--color-primary-bg);
  border-radius: 3px;
}

.question-content {
    margin-bottom: 8px;
    line-height: 1.5;
    color: #333;
}

.question-answer {
    font-size: 12px;
    color: #666;
}

.answer-label {
    font-weight: 500;
    margin-right: 5px;
}

.question-score {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 20px;
}

.question-score label {
    font-size: 12px;
    color: #666;
    margin: 0;
    width: auto;
}

.score-input {
    width: 60px;
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 3px;
    text-align: center;
    font-size: 12px;
}

.btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    border: none;
}

.btn-secondary {
    background-color: #f5f5f5;
    color: #666;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-select-all,
.btn-clear {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-select-all {
  background-color: var(--color-success);
  color: white;
}

.btn-clear {
  background-color: var(--color-danger);
  color: white;
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
}
</style>