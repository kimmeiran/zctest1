<template>
  <div>
    <div class="search-area">
      <div class="search-input-wrapper">
        <input type="text" class="search-input" placeholder="搜索题库名称" v-model="localSearchQuery" />
        <select class="search-select" v-model="localQuestionBankType">
          <option value="">全部类型</option>
          <option :value="0">职业认定</option>
          <option :value="1">竞赛</option>
          <option :value="2">模拟考核</option>
        </select>
        <button class="search-button" @click="emitSearch">搜索</button>
        <button class="reset-button" @click="emitReset">重置</button>
      </div>
    </div>

    <div class="action-buttons">
      <!-- <button class="btn btn-add" @click="$emit('add')">
        <span class="plus-icon">+</span> 新增
      </button> -->
      <button class="btn btn-import" v-if="isQuestionExpert || isExamStationAdmin" @click="$emit('import')">
        导入
      </button>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error-message">
      {{ error }}
      <button class="btn btn-primary retry-btn" @click="$emit('retry')">重试</button>
    </div>
    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>题库名称</th>
            <th>职业(工种)</th>
            <th>技能等级</th>
            <th>考核站</th>
            <th>管理人</th>
            <th>题库类型</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(exam, index) in items" :key="exam.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ exam.questionName }}</td>
            <td>{{ formatExamQuestionType(exam.questionType) }}</td>
            <td>{{ formatExamLevel(exam.level) }}</td>
            <td>{{ getStationName(exam.stationId) }}</td>
            <td>{{ exam.accountName || '-' }}</td>
            <td>{{ formatBaseType(exam.baseType) }}</td>
            <td>{{ exam.createTime }}</td>
            <td class="operations">
              <a href="#" class="view-link" @click.prevent="$emit('view', exam)">查看题目</a>
              <!-- 删除按钮：管理(5)/总管理员(6)/命题专家(2)/考核站管理员(4)竞赛题库 -->
              <a href="#" class="delete-link" 
                 v-if="canSubmitAudit" 
                 @click.prevent="$emit('delete', exam)">删除</a>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="9" class="no-data">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalItems > 0" class="pagination-container">
      <div class="total-count">共 {{ totalItems }} 条</div>
      <div class="pagination">
        <a href="#" class="page-nav prev" @click.prevent="goTo(currentPage - 1)"
          :class="{ disabled: currentPage === 1 }">&lt;</a>
        <template v-for="page in displayedPages" :key="page">
          <template v-if="page === '...'"><span class="ellipsis">...</span></template>
          <template v-else>
            <a href="#" class="page-number" :class="{ active: page === currentPage }" @click.prevent="goTo(page)">{{
              page }}</a>
          </template>
        </template>
        <a href="#" class="page-nav next" @click.prevent="goTo(currentPage + 1)"
          :class="{ disabled: currentPage === totalPages }">&gt;</a>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, toRoleNumber } from '@/constants/role'

const props = defineProps({
  items: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  searchQuery: { type: String, default: '' },
  questionBankType: { type: [Number, String], default: '' },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  totalItems: { type: Number, default: 0 },
  totalPages: { type: Number, default: 0 },
  displayedPages: { type: Array, default: () => [] },
  examStations: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:searchQuery', 'update:questionBankType', 'search', 'reset', 'add', 'import', 'retry', 'view', 'delete', 'goToPage'])

const localSearchQuery = ref(props.searchQuery)
const localQuestionBankType = ref(props.questionBankType)

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
const isExamStationAdmin = computed(() => toRoleNumber(currentUser.value.role) === ROLE_EXAM_STATION_ADMIN);
const canSubmitAudit = computed(() => {
  const r = toRoleNumber(currentUser.value.role);
  return r === ROLE_EXAM_STATION_ADMIN || r === ROLE_MANAGER;
});

watch(
  () => props.searchQuery,
  (v) => {
    if (v !== localSearchQuery.value) localSearchQuery.value = v
  }
)

watch(
  () => props.questionBankType,
  (v) => {
    if (v !== localQuestionBankType.value) localQuestionBankType.value = v
  }
)

function emitSearch() {
  emit('update:searchQuery', localSearchQuery.value)
  emit('update:questionBankType', localQuestionBankType.value)
  emit('search')
}
function emitReset() {
  localSearchQuery.value = ''
  localQuestionBankType.value = ''
  emit('update:searchQuery', '')
  emit('update:questionBankType', '')
  emit('reset')
}
function goTo(page) {
  emit('goToPage', page)
}

function formatExamQuestionType(type) {
  if (type === 1 || type === '1' || type === '填空题') return '填空题'
  if (type === 2 || type === '2' || type === '单项选择题') return '单项选择题'
  if (type === 3 || type === '3' || type === '多项选择题') return '多项选择题'
  if (type === 4 || type === '4' || type === '判断题') return '判断题'
  if (type === 5 || type === '5' || type === '简答题') return '简答题'
  if (type === 6 || type === '6' || type === '综合题') return '综合题'
  return type || '-'
}

function formatExamLevel(level) {
  if (level === 1 || level === '1' || level === '初级') return '初级'
  if (level === 2 || level === '2' || level === '中级') return '中级'
  if (level === 3 || level === '3' || level === '高级') return '高级'
  if (level === 4 || level === '4' || level === '技师') return '技师'
  if (level === 5 || level === '5' || level === '高级技师') return '高级技师'
  return level || '-'
}

function getStationName(stationId) {
  if (!stationId) return '-';
  const station = props.examStations.find(s => s.id === stationId);
  return station ? station.stationName : '未知考核站';
}

/** baseType: 题库类型 0=职业认定 1=竞赛 2=模拟考核 */
function formatBaseType(baseType) {
  if (baseType === 0 || baseType === '0') return '职业认定';
  if (baseType === 1 || baseType === '1') return '竞赛';
  if (baseType === 2 || baseType === '2') return '模拟考核';
  return baseType || '-';
}
</script>

<style scoped>
.search-area {
  margin-bottom: 20px;
}

.search-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 200px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.search-select {
  width: 140px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
}

.search-button,
.reset-button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-button {
  background-color: var(--color-primary-brand);
  color: white;
}

.reset-button {
  background-color: #f0f0f0;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: var(--color-primary-brand);
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-import {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: var(--color-primary);
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.plus-icon {
  font-weight: bold;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--color-primary-brand);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  text-align: center;
  color: #ff4d4f;
  padding: 20px;
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  margin-bottom: 20px;
}

.retry-btn {
  margin-top: 10px;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
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
}

.data-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.operations {
  display: flex;
  gap: 10px;
}

.view-link {
  color: var(--color-primary);
  text-decoration: none;
}

.submit-audit-link {
  color: var(--color-success);
  text-decoration: none;
}

.submit-audit-link:hover {
  color: #389e0d;
}

.delete-link {
  color: var(--color-danger);
  text-decoration: none;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-number,
.page-nav,
.ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 4px;
  font-size: 14px;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
}

.page-number:hover,
.page-nav:hover {
  background-color: #f0f0f0;
}

.page-number.active {
  background-color: var(--color-primary-brand);
  color: white;
}

.ellipsis {
  cursor: default;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* 审核状态样式 */
.audit-status-not-submitted {
  color: #d9d9d9;
  font-weight: 500;
}

.audit-status-pending {
  color: var(--color-warning);
  font-weight: 500;
}

.audit-status-approved {
  color: var(--color-success);
  font-weight: 500;
}

.audit-status-rejected {
  color: var(--color-danger);
  font-weight: 500;
}

.audit-status-unknown {
  color: #909399;
  font-weight: 500;
}

/* 审核操作按钮样式 */
.approve-link {
  color: var(--color-success);
  text-decoration: none;
}

.approve-link:hover {
  color: #389e0d;
}

.reject-link {
  color: var(--color-danger);
  text-decoration: none;
}

.reject-link:hover {
  color: #d9363e;
}
</style>
