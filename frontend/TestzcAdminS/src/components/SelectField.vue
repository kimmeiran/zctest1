<template>
  <div class="select-field">
    <label>{{ label }}</label>
    <el-select
      v-model="selectedValue"
      :placeholder="value"
      :class="state"
      class="select-input"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  label: string
  state: string
  value: string
  valueType: string
  options?: Array<{ label: string; value: string }>
}>()

const selectedValue = ref('')
</script>

<style scoped>
.select-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.select-field label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.select-input {
  width: 100%;
}

:deep(.el-input__wrapper) {
  border-radius: var(--size-radius-200, 8px);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409EFF inset !important;
}

:deep(.el-select-dropdown__item.selected) {
  color: #409EFF;
}

.default {
  /* 默认状态的样式 */
}
</style> 