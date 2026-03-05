<template>
    <div v-if="modelValue" class="qbpm-overlay" @mousedown.self="close">
        <div class="qbpm-modal">
            <div class="qbpm-header">
                <h3>题库选题</h3>
                <div class="qbpm-actions">
                    <button class="btn btn-close" @click="close">关闭</button>
                </div>
            </div>

            <div class="qbpm-controls">
                <div class="bank-selection-row">
                    <div class="bank-select-group">
                        <label for="qbpm-bank-select">选择题库</label>
                        <select id="qbpm-bank-select" class="form-select-mini" v-model="selectedQuestionBank" @change="handleBankChanged">
                            <option value="" disabled selected>请选择</option>
                            <option v-for="bank in questionBankList" :key="bank.id" :value="bank.id">
                                {{ bank.questionName }}
                            </option>
                        </select>
                    </div>

                    <div class="bank-select-group">
                        <label for="qbpm-difficulty">难易度</label>
                        <select id="qbpm-difficulty" class="form-select-mini" v-model="selectedDifficulty">
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

            <div class="qbpm-filter" v-if="!filterByQuestionType">
                <div class="filter-buttons">
                    <button v-for="type in questionTypeList" :key="type.value" class="filter-btn"
                        :class="{ active: internalSelectedQuestionType === type.value }"
                        @click="internalSelectedQuestionType = type.value">
                        {{ type.label }}
                    </button>
                </div>
            </div>
            <div v-else class="qbpm-filter" style="padding: 12px 16px; background: #f0f9ff; border-radius: 4px;">
                <span style="color: #1890ff; font-weight: 500;">当前筛选：{{ getQuestionTypeLabel(filterByQuestionType) }}</span>
            </div>

            <div class="qbpm-list">
                <div class="questions-header">
                    <h4>{{ getQuestionTypeLabel(internalSelectedQuestionType) }}题目列表</h4>
                    <span class="question-count">共 {{ filteredQuestions.length }} 题</span>
                </div>

                <div class="questions-list">
                    <div v-for="question in filteredQuestions" :key="question.id" class="question-item"
                        :class="{ selected: isQuestionSelected(question) }" @click="toggleQuestionSelection(question)">
                        <div class="question-info">
                            <div class="question-header">
                                <input type="checkbox" :checked="isQuestionSelected(question)" class="question-checkbox"
                                    @click.stop @change="toggleQuestionSelection(question)" />
                                <span class="question-type">{{ question.questionType }}</span>
                            </div>
                            <div class="question-content">
                                <span v-html="question._questionContentHtml || question.questionContent"></span>
                            </div>
                            <div class="question-answer">
                                <span class="answer-label">答案:</span>
                                <span v-if="question._answerHtml" class="answer-content" v-html="question._answerHtml"></span>
                                <span v-else class="answer-content">{{ formatAnswer(question.answer, question.questionType) }}</span>
                            </div>
                            <div v-if="question._attachedImageUrl" class="question-attached-image">
                                <img :src="question._attachedImageUrl" alt="题干附图" class="attached-img" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="qbpm-footer">
                <div class="footer-left">
                    <div class="footer-tools">
                        <button class="btn btn-select-all" @click="selectAllQuestions">全选</button>
                        <button class="btn btn-clear" @click="clearSelection">清空</button>
                    </div>
                    <span class="selected-count">已选 {{ internalSelectedQuestions.length }} 题</span>
                </div>
                <div class="footer-actions">
                    <button class="btn btn-secondary" @click="close">取消</button>
                    <button class="btn btn-primary" @click="confirm">确定加入</button>
                </div>
            </div>
        </div>
    </div>
    
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { selectQuestionByBaseID } from '@/api/user';
import { getQuestionBankList } from '@/api/questionBank';
import { replaceImgPlaceholdersWithAuthAdvanced, fetchImageAsBlobUrl } from '@/api/imageUpload.js';

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    existingSelected: { type: Array, default: () => [] },
    filterByQuestionType: { type: String, default: null }, // 可选的题型筛选
});

const emit = defineEmits(['update:modelValue', 'confirm']);

// ---------- 图片显示逻辑（与资源题库-查看题目一致，见 getImageRule/资源题库-查看题目-图片显示逻辑.md） ----------
const parseImageField = (value) => {
    if (value == null) return value;
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return value;
    const trimmed = String(value).trim();
    if (!trimmed || !trimmed.startsWith('[')) return value;
    try {
        const arr = JSON.parse(value);
        return Array.isArray(arr) ? arr : value;
    } catch {
        return value;
    }
};

const normalizeQuestionFields = (q) => {
    if (!q || typeof q !== 'object') return q;
    if (!q.attachedImage && q.attached_image) q.attachedImage = q.attached_image;
    if (!q.option_images && q.optionImages) q.option_images = q.optionImages;
    const contentImgs = parseImageField(q.question_content_images ?? q.questionContentImages);
    if (Array.isArray(contentImgs)) {
        q.question_content_images = contentImgs;
        q.questionContentImages = contentImgs;
    } else if (!q.question_content_images && q.questionContentImages) {
        q.question_content_images = q.questionContentImages;
    }
    const answerImgs = parseImageField(q.answer_image ?? q.answerImage);
    if (Array.isArray(answerImgs)) {
        q.answer_image = answerImgs;
        q.answerImage = answerImgs;
    } else if (!q.answerImage && q.answer_image) {
        q.answerImage = q.answer_image;
    }
    return q;
};

/** 题干/答案中 [img] 占位符替换为带鉴权图片（与 QuestionTable 一致） */
const processQuestionImagesForDisplayAsync = async (question) => {
    const processed = { ...question };
    const contentImgs = question.question_content_images || question.questionContentImages || '';
    if (question.questionContent) {
        processed._questionContentHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.questionContent, contentImgs);
    }
    const answerImgs = question.answer_image || question.answerImage || '';
    if (question.answer) {
        processed._answerHtml = await replaceImgPlaceholdersWithAuthAdvanced(question.answer, answerImgs);
    }
    if (question.attachedImage || question.attached_image) {
        const path = question.attachedImage || question.attached_image;
        processed._attachedImageUrl = await fetchImageAsBlobUrl(path);
    }
    return processed;
};

// ---------- 业务状态 ----------
const questionBankList = ref([]);
const selectedQuestionBank = ref('');
const questionList = ref([]);
const internalSelectedQuestions = ref([]);
const internalSelectedQuestionType = ref('填空题');
const selectedDifficulty = ref('0');

const questionTypeList = ref([
    { value: '填空题', label: '填空题' },
    { value: '单项选择题', label: '单项选择题' },
    { value: '多项选择题', label: '多项选择题' },
    { value: '判断题', label: '判断题' },
    { value: '简答题', label: '简答题' },
    { value: '综合题', label: '综合题' }
]);

const filteredQuestions = computed(() => {
    let list = questionList.value;
    
    // 如果传入了filterByQuestionType，则只显示该题型的题目
    if (props.filterByQuestionType) {
        list = list.filter(q => q.questionType === props.filterByQuestionType);
        // 当有筛选时，自动设置internalSelectedQuestionType为筛选类型
        if (internalSelectedQuestionType.value !== props.filterByQuestionType) {
            internalSelectedQuestionType.value = props.filterByQuestionType;
        }
    } else {
        // 没有筛选时，按用户选择的题型过滤
        list = list.filter(q => q.questionType === internalSelectedQuestionType.value);
    }
    
    // 按难度筛选
    if (selectedDifficulty.value === '0') return list;
    // 支持 difficulty / ease_or_difficulty / easeOrDifficulty 三种字段名
    return list.filter(q => {
        const val = q.difficulty ?? q.ease_or_difficulty ?? q.easeOrDifficulty ?? '';
        return String(val) === String(selectedDifficulty.value);
    });
});

const getQuestionTypeLabel = (type) => {
    const typeMap = {
        '填空题': '填空题',
        '单项选择题': '单项选择题',
        '多项选择题': '多项选择题',
        '判断题': '判断题',
        '简答题': '简答题',
        '综合题': '综合题',
    };
    return typeMap[type] || type;
};

// 切换题库时清空当前已选题目，避免跨题库混选
watch(selectedQuestionBank, () => {
    internalSelectedQuestions.value = [];
});

// 不再将父级已选题目同步为弹窗内的默认选中，确保每次打开为干净状态

const close = () => {
    // 关闭时清空本次在弹窗内选择的题目
    internalSelectedQuestions.value = [];
    emit('update:modelValue', false);
};

const isQuestionSelected = (question) => internalSelectedQuestions.value.some(q => q.id === question.id);

const toggleQuestionSelection = (question) => {
    const idx = internalSelectedQuestions.value.findIndex(q => q.id === question.id);
    if (idx !== -1) {
        internalSelectedQuestions.value.splice(idx, 1);
    } else {
        internalSelectedQuestions.value.push({ ...question });
    }
};

const selectAllQuestions = () => {
    const list = filteredQuestions.value;
    internalSelectedQuestions.value = [...list];
};

const clearSelection = () => {
    internalSelectedQuestions.value = [];
};

const getDefaultScore = (questionType) => {
    const scoreMap = { '填空题': 2, '单项选择题': 2, '多项选择题': 4, '判断题': 1, '简答题': 5, '综合题': 10 };
    return scoreMap[questionType] || 2;
};

const formatAnswer = (answer, questionType) => {
    if (questionType === '判断题') {
        const isCorrect = answer === 'A' || answer === '1' || answer === 1;
        return isCorrect ? 'A. √' : 'B. ✕';
    }
    return answer;
};

const getQuestionTypeFromNumber = (typeNumber) => {
    const typeMap = { '0': '填空题', '1': '单项选择题', '2': '多项选择题', '3': '判断题', '4': '简答题', '5': '综合题' };
    return typeMap[typeNumber] || '单项选择题';
};

const loadQuestionBankList = async () => {
    try {
        const response = await getQuestionBankList();
        if (response && response.data && response.data.code === 200) {
            const banks = response.data.data || [];
            // 无审批流程，显示全部题库
            questionBankList.value = banks.map(bank => ({
                id: bank.id,
                questionName: bank.questionName || bank.baseName || bank.name || bank.questionType
            }));
            // 不在此处自动加载，等弹窗打开后再处理
        } else {
            throw new Error(response?.data?.msg || '加载题库列表失败');
        }
    } catch (e) {
        questionBankList.value = [];
    }
};

const loadQuestionsFromBank = async () => {
    if (!selectedQuestionBank.value) {
        ElMessage.warning('请先选择题库');
        return;
    }
    try {
        const response = await selectQuestionByBaseID({ questionBaseId: selectedQuestionBank.value, offset: 0, limit: 1000 });
        if (response && response.code === 200) {
            const rawList = response.data?.list || [];
            const normalized = rawList.map(q => normalizeQuestionFields({ ...q }));
            const processed = await Promise.all(normalized.map(q => processQuestionImagesForDisplayAsync(q)));
            questionList.value = processed.map(q => ({
                ...q,
                questionType: getQuestionTypeFromNumber(q.questionType),
                difficulty: q.difficulty ?? q.ease_or_difficulty ?? q.easeOrDifficulty ?? '',
                score: getDefaultScore(getQuestionTypeFromNumber(q.questionType))
            }));
            ElMessage.success(`成功加载 ${questionList.value.length} 道题目`);
        } else {
            throw new Error(response?.msg || '加载题库题目失败');
        }
    } catch (e) {
        ElMessage.error('加载题库题目失败');
    }
};

const handleBankChanged = async () => {
    if (!selectedQuestionBank.value) return;
    await loadQuestionsFromBank();
};

const confirm = () => {
    // 仅返回题目列表，不在弹窗内携带分数
    emit('confirm', [...internalSelectedQuestions.value]);
    close();
};

onMounted(() => {});
// 弹窗每次打开时，如果有题库且未选择，自动默认到第一个并加载
watch(() => props.modelValue, async (open) => {
    if (open) {
        // 每次打开弹窗时清空内部选中状态
        internalSelectedQuestions.value = [];
        if (questionBankList.value.length === 0) {
            await loadQuestionBankList();
        }
        if (!selectedQuestionBank.value && questionBankList.value.length > 0) {
            selectedQuestionBank.value = questionBankList.value[0].id;
            await loadQuestionsFromBank();
        }
    } else {
        // 弹窗关闭后也清空所选题目，确保下次打开为干净状态
        internalSelectedQuestions.value = [];
    }
});
</script>

<style scoped>
.qbpm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.qbpm-modal { width: 1080px; max-height: 80vh; background: #fff; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
.qbpm-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #eee; }
.qbpm-actions { display: flex; gap: 8px; }
.qbpm-controls { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; background: #fafafa; }
.qbpm-filter { padding: 12px 16px; }
.qbpm-list { padding: 12px 16px; flex: 1; overflow: auto; }
.qbpm-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid #eee; }
.footer-left { display: flex; align-items: center; gap: 12px; }
.footer-tools { display: flex; gap: 8px; }
.selected-count { color: #666; font-size: 13px; }

/* 复用样式命名，保证视觉统一 */
.form-select-mini { width: 100%; max-width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; background-color: white; }
.bank-selection-row { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
.bank-select-group { flex: 1 1 360px; display: flex; flex-direction: row; align-items: center; gap: 8px; min-width: 300px; }
.bank-select-group label { font-size: 12px; color: #666; margin-bottom: 4px; font-weight: 500; min-width: 64px; white-space: nowrap; }
/* 让选择框占据剩余空间，避免与 label 相加溢出 */
.bank-select-group .form-select-mini { flex: 1; width: auto; }
.filter-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
.filter-btn { padding: 6px 12px; border: 1px solid #ddd; border-radius: 6px; background-color: white; cursor: pointer; font-size: 12px; transition: all 0.2s; font-weight: 500; }
.filter-btn.active { background-color: #1890ff; color: white; border-color: #1890ff; box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3); }
.questions-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.questions-list { max-height: 480px; overflow-y: auto; }
.question-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px; border: 1px solid #e8e8e8; border-radius: 6px; margin-bottom: 8px; background-color: white; transition: all 0.2s; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.question-item.selected { border-color: #1890ff; background-color: #f0f8ff; box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2); }
.question-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.question-type { color: #1890ff; font-size: 12px; padding: 2px 6px; background-color: #f0f8ff; border-radius: 3px; }
.question-content { margin-bottom: 8px; line-height: 1.5; color: #333; }
.question-answer { font-size: 12px; color: #666; }
.answer-label { font-weight: 500; margin-right: 5px; }
.question-attached-image { margin-top: 8px; }
.question-attached-image .attached-img { max-width: 200px; max-height: 120px; object-fit: contain; vertical-align: middle; }
.question-content :deep(.question-inline-image) { height: 25px; width: auto; max-width: 100%; vertical-align: middle; margin: 0 3px; }
.answer-content :deep(.question-inline-image) { height: 22px; width: auto; max-width: 100%; vertical-align: middle; margin: 0 2px; }
/* 移除分数输入样式 */
.btn { padding: 8px 16px; border-radius: 4px; font-size: 14px; cursor: pointer; border: none; }
.btn-primary { background-color: #1890ff; color: #fff; }
.btn-secondary { background-color: #f5f5f5; color: #666; }
.btn-select-all { background-color: #52c41a; color: #fff; padding: 6px 12px; font-size: 12px; }
.btn-clear { background-color: #ff4d4f; color: #fff; padding: 6px 12px; font-size: 12px; }
.btn-close { background: #f0f0f0; color: #333; }
</style>


