<template>
  <el-select
    :model-value="modelValue"
    filterable
    remote
    reserve-keyword
    clearable
    :remote-method="handleRemoteSearch"
    :loading="loading"
    :placeholder="placeholder"
    :disabled="disabled"
    style="width: 100%;"
    :popper-append-to-body="true"
    popper-class="student-select-popper"
    @update:model-value="emit('update:modelValue', $event)"
    @visible-change="handleVisibleChange"
  >
    <el-option
      v-for="stu in options"
      :key="stu.studentId"
      :label="`${stu.sname || stu.name || ''}（${stu.studentId}_${stu.stationName || ''}）`"
      :value="stu.studentId"
    >
      <div class="student-option-item">
        <span class="student-name">{{ stu.sname || stu.name || '未知' }}</span>
        <span class="student-id">（{{ stu.studentId }}{{ stu.stationName ? '_' + stu.stationName : '' }}）</span>
      </div>
    </el-option>
    <template #empty>
      <div class="student-select-empty">
        {{ emptyText }}
      </div>
    </template>
  </el-select>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getStudentList, getStudentsByStation } from '@/api/user'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    placeholder?: string
    disabled?: boolean
    /** 考核站ID，可选过滤 */
    stationId?: number | null
  }>(),
  {
    placeholder: '按职工名称检索',
    disabled: false,
    stationId: null
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | null): void
}>()

const loading = ref(false)
const options = ref<any[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null
const SEARCH_DEBOUNCE_MS = 300
const SEARCH_LIMIT = 30

const emptyText = ref('输入职工名称进行搜索')

/** 下拉展开时：若已选考核站且当前无选项，则按考核站查询全部职工 */
const handleVisibleChange = async (visible: boolean) => {
  if (!visible || props.stationId == null || options.value.length > 0) return
  loading.value = true
  emptyText.value = '加载中...'
  try {
    const res = await getStudentsByStation(Number(props.stationId), 0, 500)
    if (res && res.code === 200) {
      const list = res.data?.list || res.data || []
      options.value = Array.isArray(list) ? list : []
      emptyText.value = options.value.length === 0 ? '该考核站暂无职工' : ''
    } else {
      options.value = []
      emptyText.value = '加载失败，请重试'
    }
  } catch (e) {
    options.value = []
    emptyText.value = '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

const handleRemoteSearch = async (query: string) => {
  if (searchTimer) clearTimeout(searchTimer)
  
  const keyword = (query || '').trim()
  if (!keyword) {
    options.value = []
    emptyText.value = '输入职工名称进行搜索'
    return
  }

  searchTimer = setTimeout(async () => {
    searchTimer = null
    loading.value = true
    emptyText.value = '搜索中...'
    try {
      const params: Record<string, any> = {
        name: keyword,
        offset: 0,
        limit: SEARCH_LIMIT
      }
      if (props.stationId) {
        params.stationId = props.stationId
      }
      const res = await getStudentList(params)
      if (res && res.code === 200) {
        const list = res.data?.list || res.data || []
        options.value = Array.isArray(list) ? list : []
        emptyText.value = options.value.length === 0 ? '未找到匹配的人员' : ''
      } else {
        options.value = []
        emptyText.value = '搜索失败，请重试'
      }
    } catch (e) {
      options.value = []
      emptyText.value = '搜索失败，请重试'
    } finally {
      loading.value = false
    }
  }, SEARCH_DEBOUNCE_MS)
}
</script>

<style scoped>
.student-option-item {
  display: flex;
  align-items: baseline;
}
.student-name {
  font-weight: 500;
  margin-right: 4px;
}
.student-id {
  color: #909399;
  font-size: 13px;
}
.student-select-empty {
  padding: 12px;
  color: #909399;
  text-align: center;
  font-size: 14px;
}
</style>

<style>
/* 人很多时下拉列表优化：固定高度+滚动 */
.student-select-popper.el-select__popper {
  max-height: 320px;
}
.student-select-popper .el-select-dropdown__list {
  max-height: 280px;
}
</style>
