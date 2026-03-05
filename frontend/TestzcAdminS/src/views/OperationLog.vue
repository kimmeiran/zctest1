<template>
  <div class="log-page">
    <h2 class="title">日志监控</h2>

    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column prop="account" label="登录账号" width="140" />
      <el-table-column prop="operatorName" label="操作人" width="120" />
      <el-table-column prop="role" label="角色" width="140" />
      <el-table-column label="详情" width="120">
        <template #default="{ row }">
          <el-button type="primary" text @click="viewDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from "vue";
import { fetchOperators } from "@/api/logs";
import { ElMessage } from "element-plus";

const openLogDetail = inject<(account: string, operatorName?: string) => void>("openLogDetail");

const tableData = ref<any[]>([]);
const loading = ref(false);

const loadData = async () => {
  loading.value = true;
  try {
    const resp = await fetchOperators();
    const data = resp.data || {};
    if (data.code === 200) {
      tableData.value = data.data?.list || [];
    } else {
      ElMessage.error(data.msg || "查询失败");
    }
  } catch (err) {
    console.error(err);
    ElMessage.error("查询失败");
  } finally {
    loading.value = false;
  }
};

const viewDetail = (row: { account: string; operatorName: string; role: string }) => {
  openLogDetail?.(row.account, row.operatorName);
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.log-page {
  padding: 24px;
}
.title {
  margin-bottom: 12px;
}
</style>
