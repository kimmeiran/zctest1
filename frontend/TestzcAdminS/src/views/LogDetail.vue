<template>
  <div class="log-detail-page">
    <div class="header-row">
      <h2 class="title">日志详情</h2>
      <button class="back-btn" @click="goBack">返回</button>
    </div>
    <div class="subtitle" v-if="displayOperatorName || displayAccount">
      {{ displayOperatorName || '' }}{{ displayAccount ? ` (${displayAccount})` : '' }}
    </div>
    <el-table :data="list" style="width: 100%" v-loading="loading">
      <el-table-column prop="time" label="时间" width="180" />
      <el-table-column prop="action" label="动作" min-width="200" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchLogsByAccount } from "@/api/logs";
import { ElMessage } from "element-plus";

const props = defineProps<{
  account?: string;
  operatorName?: string;
}>();

defineEmits<{ (e: "back"): void }>();

const route = useRoute();
const router = useRouter();
const list = ref<{ time: string; action: string }[]>([]);
const loading = ref(false);

// 支持由路由 query 传入（从 OperationLog 打开时）
const displayAccount = computed(() => (route.query.account as string) || props.account || "");
const displayOperatorName = computed(() => (route.query.operatorName as string) || props.operatorName || "");

const goBack = () => {
  router.push({ name: "HomeLog" });
};

const loadData = async () => {
  const account = displayAccount.value;
  if (!account) return;
  loading.value = true;
  try {
    const resp = await fetchLogsByAccount(account, 0, 100);
    const data = resp.data || {};
    if (data.code === 200) {
      list.value = data.data?.list || [];
    } else {
      ElMessage.error(data.msg || "获取日志失败");
    }
  } catch (err) {
    console.error(err);
    ElMessage.error("获取日志失败");
  } finally {
    loading.value = false;
  }
};

watch(displayAccount, loadData, { immediate: true });
onMounted(() => {
  if (displayAccount.value) loadData();
});
</script>

<style scoped>
.log-detail-page {
  padding: 24px;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.title {
  margin: 0;
  font-size: 18px;
}
.subtitle {
  margin-bottom: 16px;
  color: #666;
  font-size: 14px;
}
.back-btn {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}
.back-btn:hover {
  border-color: #40a9ff;
  color: #1890ff;
}
</style>
