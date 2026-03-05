<template>
  <div class="button-group" :class="{ 'justify': align === 'justify' }">
    <el-button 
      type="primary" 
      :class="{ 'button-start': buttonStart === 'true' }"
    >
      {{ buttonLabel }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  align?: string
  buttonLabel: string
  buttonStart: string
}>()
</script>

<style scoped>
.button-group {
  display: flex;
  width: 100%;
  justify-content: stretch;
}

.button-group.justify {
  justify-content: stretch;
}

.button-start {
  align-self: flex-start;
}

:deep(.el-button--primary) {
  background-color:rgb(255, 179, 64);
  border-color: rgb(255, 179, 64);
  border-radius: var(--size-radius-200, 8px);
  padding: 12px 24px;
  font-weight: 500;
  height: 40px;
  font-size: 14px;
  width: 100%;
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

:deep(.el-button--primary:active) {
  background-color: #3a8ee6;
  border-color: #3a8ee6;
  transform: translateY(0);
}
</style> 