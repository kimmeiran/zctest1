<template>
    <div class="container">
        <div class="toolbar">
            <button class="btn btn-primary" @click="openEdit()">新增规则</button>
            <button class="btn" @click="fetchList(true)" :disabled="loading">刷新</button>
        </div>

        <div class="table-wrapper" v-loading="loading">
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>级别</th>
                    <th>规则类型</th>
                    <th>达标分数</th>
                    <th>是否默认</th>
                    <th>职业道德(填/单/多/判)</th>
                    <th>基础知识(填/单/多/判)</th>
                    <th>专业知识(填/单/多/判/简/综)</th>
                    <th>备注</th>
                    <!-- <th>难易度范围(基础/专业/简答/综合)</th> -->
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in list" :key="item.id">
                    <td>{{ item.id }}</td>
                    <td>{{ item.level }}</td>
                    <td>{{ formatRuleType(item.ruleType) }}</td>
                    <td>{{ (item.passScore ?? item.passingScore) != null ? (item.passScore ?? item.passingScore) : '-' }}</td>
                    <td>{{ item.isDefault ? '是' : '否' }}</td>
                    <td>{{ item.workEthics01 }}/{{ item.workEthics02 }}/{{ item.workEthics03 }}/{{ item.workEthics04 }}
                    </td>
                    <td>{{ item.base01 }}/{{ item.base02 }}/{{ item.base03 }}/{{ item.base04 }}</td>
                    <td>{{ item.expert01 }}/{{ item.expert02 }}/{{ item.expert03 }}/{{ item.expert04 }}/{{ item.expert05
                    }}/{{ item.expert06 }}</td>
                    <td>{{ item.remark || '-' }}</td>
                    <!-- <td>{{ item.baseEd }} / {{ item.expertEd }} / {{ item.fiveEd }} / {{ item.sixEd }}</td> -->
                    <td>
                        <button class="btn" @click="openEdit(item)">编辑</button>
                        <button class="btn btn-danger" @click="onDelete(item)">删除</button>
                    </td>
                </tr>
            </tbody>
        </table>
        </div>

        <RuleDialog :visible="showDialog" :form="form" @close="closeEdit" @submit="handleSubmit" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import RuleDialog from './RuleDialog.vue'

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || ''

interface RuleItem {
    id?: number
    level: string
    ruleType?: number | string  // 0=职业认定 1=竞赛 2=模拟考核
    passScore?: number
    passingScore?: number  // 兼容后端可能返回的字段名
    isDefault?: boolean
    workEthics01?: number
    workEthics02?: number
    workEthics03?: number
    workEthics04?: number
    base01?: number
    base02?: number
    base03?: number
    base04?: number
    expert01?: number
    expert02?: number
    expert03?: number
    expert04?: number
    expert05?: number
    expert06?: number
    competition01?: number
    competition02?: number
    competition03?: number
    competition04?: number
    competition05?: number
    competition06?: number
    baseEd?: string
    expertEd?: string
    fiveEd?: string
    sixEd?: string
    remark?: string
}

/** ruleType: 0=职业认定 1=竞赛 2=模拟考核 */
const formatRuleType = (v: number | string | undefined) => {
    if (v === 0 || v === '0') return '职业认定';
    if (v === 1 || v === '1') return '竞赛';
    if (v === 2 || v === '2') return '模拟考核';
    if (v === '职业认定' || v === 'CAREER_CERTIFICATION') return '职业认定';
    if (v === '竞赛' || v === 'COMPETITION') return '竞赛';
    if (v === '模拟考核' || v === '模拟考试' || v === 'MOCK_EXAM') return '模拟考核';
    return v || '-';
};

const list = ref<RuleItem[]>([])
const showDialog = ref(false)
const form = reactive<RuleItem>({ level: '初级' })
const loading = ref(false)

const fetchList = async (showSuccessMsg = false) => {
    loading.value = true
    try {
        const res = await axios.get(`${API_BASE_URL}/api/questionGroupRule/list`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        if (res.data && res.data.code === 200) {
            list.value = res.data.data || []
            if (showSuccessMsg) ElMessage.success('刷新成功')
        }
    } finally {
        loading.value = false
    }
}

const openEdit = (row?: RuleItem) => {
    if (row) {
        Object.assign(form, row)
    } else {
        Object.assign(form, { id: undefined, level: '初级', ruleType: 0, passScore: undefined, isDefault: true, workEthics01: undefined, workEthics02: undefined, workEthics03: undefined, workEthics04: undefined, base01: undefined, base02: undefined, base03: undefined, base04: undefined, expert01: undefined, expert02: undefined, expert03: undefined, expert04: undefined, expert05: undefined, expert06: undefined, competition01: undefined, competition02: undefined, competition03: undefined, competition04: undefined, competition05: undefined, competition06: undefined, baseEd: '', expertEd: '', fiveEd: '', sixEd: '', remark: '' })
    }
    showDialog.value = true
}

const closeEdit = () => {
    showDialog.value = false
}

const handleSubmit = async (submitForm: RuleItem) => {
    const url = submitForm.id ? `${API_BASE_URL}/api/questionGroupRule/update` : `${API_BASE_URL}/api/questionGroupRule/add`
    const res = await axios.post(url, submitForm, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    })
    if (res.data && res.data.code === 200) {
        showDialog.value = false
        await fetchList()
    }
}

const onDelete = async (row: RuleItem) => {
    if (!row.id) return
    const ok = window.confirm(`确定要删除规则【ID: ${row.id}，级别: ${row.level}】吗？此操作不可恢复。`)
    if (!ok) return
    const res = await axios.delete(`${API_BASE_URL}/api/questionGroupRule/delete`, {
        params: { id: row.id },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    if (res.data && res.data.code === 200) {
        await fetchList()
    }
}

onMounted(fetchList)
</script>

<style scoped>
.container {
    padding: 16px;
}

.toolbar {
    margin-bottom: 12px;
}

.btn {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
    margin-right: 8px;
}
.btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.btn-primary {
    background: #1890ff;
    color: #fff;
    border-color: #1890ff;
}

.btn-danger {
    background: #ff4d4f;
    color: #fff;
    border-color: #ff4d4f;
}

.table-wrapper {
    position: relative;
    min-height: 120px;
}
.table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
}

.table th,
.table td {
    border: 1px solid #f0f0f0;
    padding: 8px;
    font-size: 13px;
}

/* 弹窗样式已抽离到 RuleDialog.vue，这里移除避免重复样式影响 */

.row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.row-grid-4 {
    display: grid;
    grid-template-columns: 88px repeat(4, minmax(120px, 1fr));
    align-items: center;
    gap: 8px;
}

.row-grid-6 {
    display: grid;
    grid-template-columns: 88px repeat(6, minmax(120px, 1fr));
    align-items: center;
    gap: 8px;
}

.row label {
    flex: 0 0 88px;
    /* 固定宽度，避免被压缩导致换行 */
    text-align: right;
    color: #666;
    white-space: nowrap;
    /* 禁止换行，防止中文竖排 */
    word-break: keep-all;
    /* 不在中文字符间断行 */
}

input,
select {
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    padding: 6px 8px;
    min-width: 120px;
    /* 控制输入框统一宽度 */
}

.dialog-actions {
    text-align: right;
}
</style>
