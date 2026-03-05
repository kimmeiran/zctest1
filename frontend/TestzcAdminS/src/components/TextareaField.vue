<template>
  <div class="textarea-field">
    <label>{{ label }}</label>
    <el-input
      v-model="textValue"
      type="textarea"
      :rows="4"
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
  drag?: string
}>()

const textValue = ref('')
</script>

<style scoped>
.textarea-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.textarea-field label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

:deep(.el-textarea__inner) {
  border-radius: var(--size-radius-200, 8px);
  min-height: 120px;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #409EFF inset;
}

.default {
  /* 默认状态的样式 */
}
</style> 