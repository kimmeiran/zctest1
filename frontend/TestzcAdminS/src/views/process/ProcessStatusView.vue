<template>
  <div class="process-status-view">
    <h2 class="page-title">流程状态</h2>

    <div class="status-cards">
      <div class="status-card">
        <div class="card-header">
          <h3>待审批申请</h3>
        </div>
        <div class="card-body">
          <div class="status-value">{{ status.pendingApprovals || 0 }}</div>
          <div class="status-label">条待处理</div>
        </div>
      </div>

      <div class="status-card">
        <div class="card-header">
          <h3>待审核题库</h3>
        </div>
        <div class="card-body">
          <div class="status-value">{{ status.pendingQuestionBases || 0 }}</div>
          <div class="status-label">个待审核</div>
        </div>
      </div>

      <div class="status-card">
        <div class="card-header">
          <h3>待审核试卷</h3>
        </div>
        <div class="card-body">
          <div class="status-value">{{ status.pendingExams || 0 }}</div>
          <div class="status-label">份待审核</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getProcessStatus } from '@/api/processStatus';

const status = ref({
  pendingApprovals: 0,
  pendingQuestionBases: 0,
  pendingExams: 0
});

const isLoading = ref(false);

const fetchStatus = async () => {
  isLoading.value = true;
  try {
    const response = await getProcessStatus();
    if (response.code === 200) {
      status.value = response.data || {};
    } else {
      ElMessage.error(response.msg || '查询失败');
    }
  } catch (error) {
    ElMessage.error('查询失败: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchStatus();
  // 每30秒刷新一次
  setInterval(fetchStatus, 30000);
});
</script>

<style scoped>
.process-status-view {
  padding: 20px;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 500;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.status-card {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.card-header {
  padding: 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.card-body {
  padding: 24px;
  text-align: center;
}

.status-value {
  font-size: 32px;
  font-weight: bold;
  color: #c70019;
  margin-bottom: 8px;
}

.status-label {
  font-size: 14px;
  color: #666;
}
</style>

