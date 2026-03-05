<template>
  <div class="input-field">
    <label>{{ label }}</label>
    <el-input
      v-model="inputValue"
      :placeholder="value"
      :class="state"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  label: string
  state: string
  value: string
  valueType: string
}>()

const inputValue = ref('')
</script>

<style scoped>
.input-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.input-field label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

:deep(.el-input__wrapper) {
  border-radius: var(--size-radius-200, 8px);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409EFF inset;
}

.default {
  /* 默认状态的样式 */
}
</style> 