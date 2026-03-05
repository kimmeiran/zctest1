<template>
    <div class="modal-overlay" v-if="visible">
        <div class="import-result-modal">
            <div class="modal-header">
                <h3>导入结果</h3>
            </div>
            <div class="modal-body">
                <div v-if="importSuccess" class="import-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p>导入成功</p>
                    <div class="import-stats">
                        <p>新增题目: {{ importResult.newQuestions?.length || 0 }} 条</p>
                    </div>
                </div>
                <div v-else class="import-error">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p>导入失败</p>
                    <p class="error-message">{{ importError }}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" @click="handleClose">确定</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ImportResultModal',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        importSuccess: {
            type: Boolean,
            default: false
        },
        importResult: {
            type: Object,
            default: () => ({})
        },
        importError: {
            type: String,
            default: ''
        }
    },
    emits: ['close'],
    methods: {
        handleClose() {
            this.$emit('close')
        }
    }
}
</script>

<style scoped>
.modal-overlay {
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

.import-result-modal {
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
    text-align: center;
    margin-bottom: 20px;
}

.modal-header h3 {
    margin: 0;
    color: #333;
    font-size: 20px;
}

.modal-body {
    text-align: center;
    margin-bottom: 24px;
}

.import-success svg {
    color: #52c41a;
    margin-bottom: 16px;
}

.import-error svg {
    color: #ff4d4f;
    margin-bottom: 16px;
}

.import-success p,
.import-error p {
    margin: 8px 0;
    font-size: 16px;
    color: #333;
}

.import-stats {
    margin-top: 16px;
    padding: 12px;
    background-color: #f6ffed;
    border-radius: 6px;
    border: 1px solid #b7eb8f;
}

.import-stats p {
    margin: 4px 0;
    color: #52c41a;
    font-size: 14px;
}

.error-message {
    color: #ff4d4f !important;
    font-size: 14px;
    background-color: #fff2f0;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #ffccc7;
}

.modal-footer {
    text-align: center;
}

.btn {
    padding: 8px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-primary {
    background-color: #1890ff;
    color: white;
}

.btn-primary:hover {
    background-color: #40a9ff;
}
</style>
