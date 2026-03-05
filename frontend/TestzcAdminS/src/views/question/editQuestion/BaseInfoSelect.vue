<template>
    <div class="form-row form-row-4">
        <div class="form-group form-col">
            <label>题目类型</label>
            <select class="form-select" v-model="form.questionType">
                <option value disabled>请选择题目类型</option>
                <option value="0">填空题</option>
                <option value="1">单项选择题</option>
                <option value="2">多项选择题</option>
                <option value="3">判断题</option>
                <option value="4">简答题</option>
                <option value="5">综合题</option>
            </select>
        </div>

        <div class="form-group form-col">
            <label>行为领域</label>
            <select class="form-select" v-model="form.domain">
                <option value disabled>请选择行为领域</option>
                <option value="1">基础知识</option>
                <option value="2">职业道德</option>
                <option value="3">专业知识</option>
                <option value="4">相关知识</option>
                <!-- <option value="5">专业技能</option>
                <option value="6">相关技能</option> -->
            </select>
        </div>
        <div class="form-group form-col">
            <label>难易度</label>
            <select class="form-select" v-model="form.easeOrDifficulty">
                <option value disabled>请选择难易度</option>
                <option value="1">易</option>
                <option value="2">较易</option>
                <option value="3">中等</option>
                <option value="4">较难</option>
                <option value="5">难</option>
            </select>
        </div>
        <div class="form-group form-col">
            <label>重要程度</label>
            <select class="form-select" v-model="form.importance">
                <option value disabled>请选择重要程度</option>
                <option value="X">核心要素</option>
                <option value="Y">一般要素</option>
                <option value="Z">辅助要素</option>
            </select>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    form: { type: Object, required: true }
})
</script>

<style scoped>
.form-group {
    margin-bottom: 0;
}

.form-row {
    display: flex;
    gap: 8px;
    margin-bottom: 0;
}

/* 4 列布局 */
.form-row-4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px 16px;
}

.form-col {
    flex: 1;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.form-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    box-sizing: border-box;
    font-size: 14px;
    background-color: #fff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-select:focus {
    outline: none;
    border-color: #c70019;
    box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.1);
}

.form-select:hover {
    border-color: #bfbfbf;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .form-row-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 12px;
    }
}

@media (max-width: 480px) {
    .form-row-4 {
        grid-template-columns: 1fr;
        gap: 8px;
    }
    
    .form-group label {
        font-size: 13px;
    }
    
    .form-select {
        padding: 8px 10px;
        font-size: 13px;
    }
}
</style>


