<template>
  <div class="score-list-entry">
    <h2 class="page-title">成绩列表</h2>
    <div class="content-container">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="error" class="error-message">
        {{ error }}
        <button class="btn btn-primary retry-btn" @click="fetchExams">重试</button>
      </div>
      <div v-else>
        <div class="filter-section">
          <div class="filter-bar">
            <label class="filter-label">名称筛选:</label>
            <input class="filter-input" type="text" v-model="searchWord" placeholder="请输入考试名称关键字" />
            <div class="filter-actions">
              <button class="search-btn" @click="handleSearch">搜索</button>
              <button class="reset-btn" @click="handleReset">重置</button>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>试卷名称</th>
                <th>考试用途</th>
                <th>试题技能等级</th>
                <th>总报名人数</th>
                <th>通过人数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(exam, index) in examList" :key="exam.id">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ exam.examName }}</td>
                <td>{{ getExamPurposeDisplay(exam) }}</td>
                <td>{{ exam.examLevel }}</td>
                <td>{{ exam.totalRegistrationCount }}</td>
                <td>{{ (exam.passCount !== undefined && exam.passCount !== null) ? exam.passCount : '-' }}</td>
                <td class="operations">
                  <button class="view-btn" @click="goToDetail(exam)">考试详情</button>
                </td>
              </tr>
              <tr v-if="examList.length === 0">
                <td colspan="7" class="no-data">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="pagination-container" v-if="!isLoading && !error && totalItems > 0">
        <div class="total-count">共 {{ totalItems }} 条</div>
        <div class="pagination">
          <a href="#" class="page-nav prev" @click.prevent="goToPage(currentPage - 1)"
            :class="{ disabled: currentPage === 1 }">&lt;</a>
          <template v-for="page in displayedPages" :key="page">
            <template v-if="page === '...'">
              <span class="ellipsis">...</span>
            </template>
            <template v-else>
              <a href="#" class="page-number" :class="{ active: page === currentPage }"
                @click.prevent="goToPage(page)">{{ page }}</a>
            </template>
          </template>
          <a href="#" class="page-nav next" @click.prevent="goToPage(currentPage + 1)"
            :class="{ disabled: currentPage === totalPages }">&gt;</a>
        </div>
        <div class="page-size-selector">
          <span>{{ pageSize }} 条/页</span>
          <select v-model="pageSize" @change="handlePageSizeChange">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getPapersStatic } from '@/api/studentsExamTotal.js';

const emit = defineEmits(['go-to-detail']);

const isLoading = ref(true);
const error = ref(null);
const examList = ref([]);
const totalItems = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchWord = ref('');

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));

const displayedPages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage.value - 1);
    let end = Math.min(totalPages.value - 1, start + maxVisible - 2);
    if (end - start + 1 < maxVisible - 2) start = Math.max(2, end - (maxVisible - 3));
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages.value - 1) pages.push('...');
    pages.push(totalPages.value);
  }
  return pages;
});

const getExamPurposeDisplay = (exam) => {
  const rt = exam.ruleType;
  if (rt === 0 || rt === '0') return '职业认定';
  if (rt === 1 || rt === '1') return '竞赛';
  return '-';
};

const fetchExams = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const params = {
      paperName: searchWord.value.trim() || undefined,
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
    };
    const response = await getPapersStatic(params);
    // axios 返回的是 { data: 接口体 }，接口体为 { code, msg, data: { list, total } }
    const res = response?.data ?? response;
    if (res && res.code === 200) {
      const list = res.data?.list ?? [];
      examList.value = list.map((item) => ({
        id: item.teachExamId,
        teachExamId: item.teachExamId,
        examName: item.paperName,
        ruleType: item.ruleType,
        examLevel: item.jobTypeLevel ?? '-',
        totalRegistrationCount: item.totalRegistrationCount ?? 0,
        passCount: item.totalPassCount ?? null
      }));
      totalItems.value = res.data?.total ?? 0;
    } else {
      throw new Error(res?.msg || '获取试卷统计列表失败');
    }
  } catch (err) {
    console.error('获取试卷统计列表失败:', err);
    error.value = err.message || '获取试卷统计列表失败，请稍后重试';
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchExams();
};

const handleReset = () => {
  searchWord.value = '';
  currentPage.value = 1;
  fetchExams();
};

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchExams();
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
  fetchExams();
};

const goToDetail = (exam) => {
  emit('go-to-detail', exam);
};

onMounted(() => {
  fetchExams();
});
</script>

<style scoped>
.score-list-entry {
  padding: 20px;
}
.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 500;
}
.content-container {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}
.loading-container,
.error-message {
  padding: 40px 20px;
  text-align: center;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-message {
  color: #ff4d4f;
}
.retry-btn {
  margin-top: 12px;
}
.filter-section {
  padding: 16px 20px;
  margin-bottom: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}
.filter-label {
  color: #666;
  font-size: 14px;
  min-width: 80px;
}
.filter-input {
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  min-width: 200px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
}
.filter-input:focus {
  border-color: #1890ff;
}
.filter-actions {
  margin-left: auto;
}
.search-btn {
  padding: 0 16px;
  height: 36px;
  line-height: 34px;
  border: none;
  border-radius: 4px;
  background: #1890ff;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
.search-btn:hover {
  background: #40a9ff;
}
.reset-btn {
  padding: 0 16px;
  height: 36px;
  line-height: 34px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  margin-left: 8px;
}
.reset-btn:hover {
  border-color: #40a9ff;
  color: #1890ff;
}
.table-responsive {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th,
.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
}
.data-table th {
  background: #fafafa;
  color: #666;
  font-weight: 500;
}
.data-table tr:nth-child(even) {
  background: #fafafa;
}
.data-table .no-data {
  text-align: center;
  color: #999;
  padding: 24px;
}
.operations .view-btn {
  padding: 4px 12px;
  border: 1px solid #c70019;
  border-radius: 4px;
  background: #c70019;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
.operations .view-btn:hover {
  background: #a80016;
  border-color: #a80016;
  color: #fff;
}
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}
.total-count {
  font-size: 14px;
  color: #666;
}
.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}
.pagination a,
.pagination .ellipsis {
  padding: 4px 10px;
  font-size: 14px;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
}
.pagination a:hover:not(.disabled) {
  background: #ffe6e6;
  color: #c70019;
}
.pagination a.active {
  background: #c70019;
  color: #fff;
}
.pagination a.disabled {
  color: #ccc;
  cursor: not-allowed;
}
.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}
.page-size-selector select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}
.btn-primary {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  background: #1890ff;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
</style>
