<template>
  <div class="pagination-wrapper" v-if="total > 0">
    <el-pagination
      background
      layout="total, prev, pager, next, sizes"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      :page-sizes="pageSizes"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    total: number
    currentPage: number
    pageSize: number
    pageSizes?: number[]
  }>(),
  {
    pageSizes: () => [5, 10, 20]
  }
)

const emit = defineEmits<{
  (e: 'update:currentPage', val: number): void
  (e: 'update:pageSize', val: number): void
  (e: 'change', page: number, size: number): void
}>()

const handleCurrentChange = (page: number) => {
  emit('update:currentPage', page)
  emit('change', page, props.pageSize)
}

const handleSizeChange = (size: number) => {
  emit('update:pageSize', size)
  emit('update:currentPage', 1)
  emit('change', 1, size)
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
}
.pagination-wrapper :deep(.el-pagination) {
  justify-content: center;
}
.pagination-wrapper :deep(.el-pagination.is-background .btn-next),
.pagination-wrapper :deep(.el-pagination.is-background .btn-prev),
.pagination-wrapper :deep(.el-pagination.is-background .el-pager li) {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}
.pagination-wrapper :deep(.el-pagination.is-background .el-pager li.is-active) {
  background: #c70019;
  border-color: #c70019;
  color: #fff;
}
.pagination-wrapper :deep(.el-pagination.is-background .el-pager li:hover) {
  color: #c70019;
  border-color: #c70019;
}
</style>
