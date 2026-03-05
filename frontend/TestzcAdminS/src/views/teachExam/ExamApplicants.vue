<template>
  <div class="exam-applicants">
    <div v-if="!embedInModal" class="breadcrumb-row">
      <BreadcrumbNav :items="breadcrumbItems" />
      <button type="button" class="btn-back" @click="$emit('goBack')">返回</button>
    </div>
    <div class="applicants-card">
    <div class="question-manage-header">
      <div class="header-info">
        <h3 style="margin:0;">报考人员管理</h3>
        <div style="color:#888;font-size:13px;">考试ID：{{ examId }}{{ examName ? ` - ${examName}` : '' }}</div>
      </div>
      <div class="header-actions">
        <button class="btn btn-import" @click="openImportModal">导入</button>
        <button class="btn btn-primary" @click="openAddModal">新增</button>
        <button class="btn btn-download" @click="downloadTemplate">下载模板</button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">工号</label>
          <input type="text" class="filter-input" v-model="searchWorkerCode" placeholder="请输入工号" />
        </div>
        <div class="filter-group">
          <label class="filter-label">姓名</label>
          <input type="text" class="filter-input" v-model="searchWorkerName" placeholder="请输入姓名" />
        </div>
        <div class="filter-group">
          <label class="filter-label">考试状态</label>
          <select v-model="examStatusFilter" class="filter-select" @change="handleFilterChange">
            <option value="">全部</option>
            <option value="examined">已考试</option>
            <option value="not-examined">未考试</option>
          </select>
        </div>
        <div class="filter-buttons">
          <button type="button" class="btn btn-query" @click="handleFilterChange">查询</button>
          <button type="button" class="btn btn-reset" @click="resetFilters">重置</button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="table-responsive applicants-table">
      <table class="data-table">
        <thead>
          <tr>
            <th>工号</th>
            <th>姓名</th>
            <th>考核站</th>
            <!-- <th>职位</th> -->
            <th>职业(工种)</th>
            <th>技能等级</th>
            <th>报名时间</th>
            <th>考试状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="person in paginatedList" :key="person.id">
            <td>{{ person.studentId || person.persionId }}</td>
            <td>{{ person.studentName || person.persionName || '-' }}</td>
            <td>{{ person.stationName || '-' }}</td>
            <td>{{ person.jobType || '-' }}</td>
            <td>{{ person.titleLevel || '-' }}</td>
            <td>{{ formatDateTime(person.createTime || person.registerTime) }}</td>
            <td>
              <span :class="getExamStatusClass(person)">
                {{ getExamStatus(person) }}
              </span>
            </td>
            <td>
              <a href="#" class="op-link op-link-not-examined" @click.prevent="handleMarkNotExamined(person)" v-if="isExamined(person) && !hideNotExaminedOp">未考</a>
              <a href="#" class="op-link op-link-examined" @click.prevent="handleMarkExamined(person)" v-if="!isExamined(person) && !hideNotExaminedOp">已考</a>
              <a href="#" style="color:#ff4d4f;" @click.prevent="handleDelete(person)" :class="{ disabled: !person.id }">删除</a>
            </td>
          </tr>
          <tr v-if="paginatedList.length === 0">
            <td colspan="8" class="no-data">暂无报名信息</td>
          </tr>
        </tbody>
      </table>
      
      <!-- 统计信息 -->
      <div class="statistics-section" v-if="!isLoading && !error && list.length > 0">
        <div class="stat-item">
          <span class="stat-label">总报名人数：</span>
          <span class="stat-value">{{ list.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已考试人数：</span>
          <span class="stat-value stat-examined">{{ examinedCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">未考试人数：</span>
          <span class="stat-value stat-not-examined">{{ notExaminedCount }}</span>
        </div>
      </div>
    </div>

    <Pagination
      v-if="!isLoading && !error && totalItems > 0"
      :total="totalItems"
      :current-page="currentPage"
      :page-size="pageSize"
      @change="onPageChange"
    />
    </div>
    <!-- 新增弹窗：先选择考核站，再联动选择当前考核站的职工 -->
    <div v-if="isAddVisible" class="modal-mask">
      <div class="modal-container">
        <div class="modal-header">
          <h3>新增报名人</h3>
          <button class="close-btn" @click="closeAddModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label :class="{ required: isSuperAdmin }">所属考核站</label>
            <select
              v-if="isSuperAdmin"
              v-model="selectedAddStationId"
              class="filter-select"
              style="width:100%;padding:8px 12px;"
              @change="form.student_id = ''"
            >
              <option :value="null">请先选择考核站</option>
              <option v-for="s in examStationListForAdd" :key="s.id" :value="s.id">{{ s.stationName || s.name }}</option>
            </select>
            <p v-else-if="isStationAdmin" class="form-hint" style="margin:0;">当前考核站（考核站管理员）</p>
          </div>
          <div class="form-item">
            <label>报名人员</label>
            <StudentSelect
              v-model="form.student_id"
              placeholder="从职工管理选择，按职工名称检索"
              :station-id="addFormStationId"
              :disabled="isSuperAdmin && (selectedAddStationId == null || selectedAddStationId === '')"
            />
            <p v-if="isSuperAdmin && (selectedAddStationId == null || selectedAddStationId === '')" class="form-hint" style="margin:4px 0 0;">请先选择考核站后再选择职工</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAddModal">取消</button>
          <button class="btn btn-secondary" @click="submitAdd">确认</button>
        </div>
      </div>
    </div>

    <!-- 批量导入弹窗 -->
    <div v-if="isImportModalVisible" class="modal-mask" @click="closeImportModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>批量导入报考人员</h3>
          <button class="close-btn" @click="closeImportModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="isSuperAdmin" class="form-item">
            <label class="required">所属考核站</label>
            <select v-model="selectedStationIdForImport" class="filter-select" style="width:100%;padding:8px 12px;">
              <option :value="null">请选择考核站</option>
              <option v-for="s in examStationList" :key="s.id" :value="s.id">{{ s.stationName || s.name }}</option>
            </select>
          </div>
          <div v-else-if="isStationAdmin" class="form-item">
            <label>所属考核站</label>
            <p class="form-hint" style="margin:0;">当前考核站（考核站管理员默认）</p>
          </div>
          <div class="form-item">
            <label>导入文件</label>
            <div class="file-upload-box" @click="triggerImportFileInput">
              <input type="file" ref="importFileInput" class="file-input-hidden" accept=".xlsx,.xls" @change="handleImportFileChange" />
              <span v-if="selectedImportFile">{{ selectedImportFile.name }}</span>
              <span v-else>点击选择Excel文件</span>
            </div>
            <p class="form-hint">导入人员必须在职工列表中存在，根据职工编号判断。支持 .xlsx、.xls 格式。</p>
          </div>
          <div v-if="importResult" class="import-result">
            <p>导入完成：成功 {{ importResult.success || 0 }} 条，失败 {{ importResult.fail || 0 }} 条</p>
            <p v-if="importResult.failDetails && importResult.failDetails.length" class="fail-details">{{ importResult.failDetails.join('；') }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeImportModal">取消</button>
          <button class="btn btn-primary" @click="handleImport" :disabled="importConfirmDisabled || isImporting">
            {{ isImporting ? '导入中...' : '确认导入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'
import StudentSelect from '@/components/StudentSelect.vue'
import Pagination from '@/components/Pagination.vue'
import { getAllStudentsScore } from '@/api/user'
import { getApplicantsByExamId, getExamById } from '@/api/exam'
import { addStudentsExamTotal, deleteStudentsExamTotal, batchAddApplicants, downloadApplicantsTemplate, setAttendedStatus } from '@/api/studentsExamTotal.js'
import { getAllExamStations } from '@/api/examStation.js'
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, toRoleNumber } from '@/constants/role'

const props = defineProps({
  examId: { type: [String, Number], default: null },
  examName: { type: String, default: '' },
  examType: { type: String, default: '' }, // 考试类型：online-线上，offline-线下
  ruleType: { type: [Number, String], default: null }, // 考试用途：0-职业认定，1-竞赛
  useExamId: { type: Boolean, default: false }, // 是否使用 examId 查询（新接口）
  embedInModal: { type: Boolean, default: false } // 是否嵌入弹窗（隐藏面包屑与返回）
})

const emit = defineEmits(['goBack'])

// 面包屑：考试管理 / 报考人员管理
const breadcrumbItems = computed(() => [
  { label: '考试管理', onClick: () => emit('goBack') },
  { label: '报考人员管理' }
])

const isLoading = ref(true)
const error = ref('')
const list = ref([])
const filteredList = ref([])

// 考试类型（从 props 或 sessionStorage 获取）
const examType = ref('')
// 考试用途（从 props 或 sessionStorage 或 API 获取）：0-职业认定，1-竞赛
const ruleType = ref(null)

// 当前用户与考核站信息（用于写入 stationId）
const getCurrentUser = () => {
  try {
    const stored = sessionStorage.getItem('user')
    return stored ? JSON.parse(stored) : {}
  } catch (e) {
    console.warn('解析用户信息失败:', e)
    return {}
  }
}
const currentUser = ref(getCurrentUser())
const currentStationId = computed(() => {
  const station = currentUser.value?.stationId
  if (station === null || station === undefined || station === '') return undefined
  const num = Number(station)
  return Number.isNaN(num) ? undefined : num
})
const isSuperAdmin = computed(() => {
  const r = toRoleNumber(currentUser.value?.role)
  return r === ROLE_MANAGER
})
const isStationAdmin = computed(() => toRoleNumber(currentUser.value?.role) === ROLE_EXAM_STATION_ADMIN)

// 判断是否为线上考试（线上考试不显示导入成绩按钮）
const isOnlineExam = computed(() => examType.value === 'online')

// 竞赛且线上时隐藏「未考」操作
const hideNotExaminedOp = computed(() => {
  const rt = Number(ruleType.value)
  return rt === 1 && examType.value === 'online'
})

// 工号、姓名筛选
const searchWorkerCode = ref('')
const searchWorkerName = ref('')
// 考试状态筛选，默认「已考试」
const examStatusFilter = ref('')

const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

const displayedPages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push('...')
    pages.push(total)
  } else if (current >= total - 3) {
    pages.push(1)
    pages.push('...')
    for (let i = total - 4; i <= total; i++) pages.push(i)
  }
  return pages
})

const formatDateTime = (dt) => {
  if (!dt) return ''
  try { return new Date(dt).toLocaleString('zh-CN') } catch { return dt }
}

// 获取出席状态：优先 attendedStatus（0=未考 1=已考），兼容 passStatus
const getAttendedStatus = (person) => {
  if (person?.attendedStatus !== undefined && person?.attendedStatus !== null) {
    return Number(person.attendedStatus)
  }
  return Number(person?.passStatus)
}

// 考试状态：attendedStatus 0=未考 1=已考
const getExamStatus = (person) => {
  return getAttendedStatus(person) === 1 ? '已考试' : '未考试'
}

// 获取考试状态样式类
const getExamStatusClass = (person) => {
  return getAttendedStatus(person) === 1 ? 'status-examined' : 'status-not-examined'
}

// 是否已考试（用于是否显示「未考」/「已考」按钮）
const isExamined = (person) => getAttendedStatus(person) === 1

// 点击「未考」：调用 setAttendedStatus 设置 attendedStatus=0
const handleMarkNotExamined = async (person) => {
  if (!person?.id) {
    ElMessage.warning('无法操作：缺少记录ID')
    return
  }
  if (!isExamined(person)) {
    ElMessage.info('该人员已是未考状态')
    return
  }
  try {
    const res = await setAttendedStatus(person.id, 0)
    const data = res?.data || res
    if (data?.code === 200) {
      ElMessage.success('已标记为未考试')
      fetchApplicants()
    } else {
      ElMessage.error(data?.msg || '操作失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || '操作失败')
  }
}

// 点击「已考」：调用 setAttendedStatus 设置 attendedStatus=1（线下修改）
const handleMarkExamined = async (person) => {
  if (!person?.id) {
    ElMessage.warning('无法操作：缺少记录ID')
    return
  }
  if (isExamined(person)) {
    ElMessage.info('该人员已是已考状态')
    return
  }
  try {
    const res = await setAttendedStatus(person.id, 1)
    const data = res?.data || res
    if (data?.code === 200) {
      ElMessage.success('已标记为已考试')
      fetchApplicants()
    } else {
      ElMessage.error(data?.msg || '操作失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || '操作失败')
  }
}

// 筛选列表（工号、姓名、考试状态）
const applyFilters = () => {
  let result = list.value
  const code = (searchWorkerCode.value || '').trim()
  const name = (searchWorkerName.value || '').trim()
  if (code) {
    result = result.filter(p => {
      const pid = String(p.studentId || p.persionId || '').toLowerCase()
      return pid.includes(code.toLowerCase())
    })
  }
  if (name) {
    result = result.filter(p => {
      const pname = String(p.studentName || p.persionName || '').toLowerCase()
      return pname.includes(name.toLowerCase())
    })
  }
  if (examStatusFilter.value === 'examined') {
    result = result.filter(p => getAttendedStatus(p) === 1)
  } else if (examStatusFilter.value === 'not-examined') {
    result = result.filter(p => getAttendedStatus(p) !== 1)
  }
  filteredList.value = result
  totalItems.value = filteredList.value.length
  currentPage.value = 1
}

const handleFilterChange = () => {
  applyFilters()
}

const resetFilters = () => {
  searchWorkerCode.value = ''
  searchWorkerName.value = ''
  examStatusFilter.value = ''
  applyFilters()
}

// 计算已考试和未考试人数（基于原始列表，attendedStatus：0=未考 1=已考）
const examinedCount = computed(() => {
  return list.value.filter(person => getAttendedStatus(person) === 1).length
})

const notExaminedCount = computed(() => {
  return list.value.filter(person => getAttendedStatus(person) !== 1).length
})

const fetchApplicants = async () => {
  if (!props.examId) {
    error.value = '缺少考试ID'
    isLoading.value = false
    return
  }
  
  isLoading.value = true
  error.value = ''
  try {
    // 优先尝试新接口（按 examId）
    let res
    try {
      const response = await getApplicantsByExamId(props.examId)
      res = response?.data || response
    } catch (e) {
      res = null
    }

    // 如果新接口失败或未返回成功码，回退旧接口（teachExamId）
    if (!res || res.code !== 200) {
      res = await getAllStudentsScore(undefined, props.examId)
    }
    
    if (res && res.code === 200) {
      list.value = res.data || []
      applyFilters() // 应用筛选
    } else {
      error.value = res?.msg || '获取报名人列表失败'
    }
  } catch (e) {
    error.value = e.message || '获取报名人列表失败'
  } finally {
    isLoading.value = false
  }
}

// 获取考试类型与考试用途
const fetchExamType = async () => {
  // 优先从 props 获取
  if (props.examType) {
    examType.value = props.examType
  }
  if (props.ruleType !== null && props.ruleType !== undefined && props.ruleType !== '') {
    ruleType.value = props.ruleType
  }

  // 从 sessionStorage 获取（从考试管理页面跳转时）
  try {
    const params = sessionStorage.getItem('applicantsParams')
    if (params) {
      const parsed = JSON.parse(params)
      if (parsed.examType) examType.value = parsed.examType
      if (parsed.ruleType !== null && parsed.ruleType !== undefined && parsed.ruleType !== '') {
        ruleType.value = parsed.ruleType
      }
    }
  } catch (e) {
    console.error('解析 sessionStorage 参数失败:', e)
  }

  // 如果 useExamId 为 true，通过 API 获取考试信息
  if (props.useExamId && props.examId) {
    try {
      const res = await getExamById(props.examId)
      if (res && res.data) {
        const data = res.data.code === 200 ? res.data.data : res.data
        if (data) {
          if (!examType.value && data.examType) examType.value = data.examType
          if ((ruleType.value === null || ruleType.value === undefined) && (data.ruleType !== null && data.ruleType !== undefined)) {
            ruleType.value = data.ruleType
          }
        }
      }
    } catch (e) {
      console.error('获取考试信息失败:', e)
    }
  }
}

watch(() => props.examId, () => { 
  currentPage.value = 1
  fetchExamType()
  fetchApplicants() 
})

watch(() => props.examType, (newVal) => {
  if (newVal) examType.value = newVal
})
watch(() => props.ruleType, (newVal) => {
  if (newVal !== null && newVal !== undefined && newVal !== '') ruleType.value = newVal
})

onMounted(() => {
  fetchExamType()
  fetchApplicants()
})

const onPageChange = (page, size) => {
  currentPage.value = page
  pageSize.value = size
}
const goToPage = (p) => { if (p >= 1 && p <= totalPages.value) currentPage.value = p }
const handlePageSizeChange = () => { currentPage.value = 1 }

// 新增/删除逻辑：先选考核站，再联动选职工
const isAddVisible = ref(false)
const examStationListForAdd = ref([])
const selectedAddStationId = ref(null)
const addFormStationId = computed(() => {
  if (isSuperAdmin.value) return selectedAddStationId.value != null && selectedAddStationId.value !== '' ? Number(selectedAddStationId.value) : null
  return currentStationId.value
})
const form = ref({
  teachExamId: '',
  student_id: ''
})

// 表单提交时生成当前报名时间
const getCurrentDateTimeString = () => {
  const now = new Date()
  const pad = (num) => String(num).padStart(2, '0')
  const y = now.getFullYear()
  const m = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  const hh = pad(now.getHours())
  const mm = pad(now.getMinutes())
  const ss = pad(now.getSeconds())
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

// 远程学生搜索
const toggleBodyScroll = (lock) => {
  document.body.style.overflow = lock ? 'hidden' : ''
}

const openAddModal = async () => {
  form.value = {
    teachExamId: String(props.examId || ''),
    student_id: ''
  }
  selectedAddStationId.value = isStationAdmin.value ? currentStationId.value : null
  isAddVisible.value = true
  toggleBodyScroll(true)
  if (isSuperAdmin.value) {
    try {
      const res = await getAllExamStations()
      const data = res?.data || res
      if (data?.code === 200 && Array.isArray(data?.data)) {
        examStationListForAdd.value = data.data
      } else if (Array.isArray(data)) {
        examStationListForAdd.value = data
      } else {
        examStationListForAdd.value = []
      }
    } catch (e) {
      examStationListForAdd.value = []
    }
  }
}
const closeAddModal = () => {
  isAddVisible.value = false
  selectedAddStationId.value = null
  toggleBodyScroll(false)
}
const submitAdd = async () => {
  if (!form.value.student_id) { ElMessage.warning('请选择报名人员'); return }
  const stationId = addFormStationId.value
  if (stationId == null || stationId === undefined) {
    ElMessage.warning('请先选择考核站')
    return
  }
  try {
    const registerTime = getCurrentDateTimeString()
    const payload = {
      teachExamId: form.value.teachExamId,
      examId: form.value.teachExamId, // 确保按 examId 维度也能查询到
      studentId: form.value.student_id,
      stationId: Number(stationId),
      registerTime
    }
    const res = await addStudentsExamTotal(payload)
    if (res) {
      ElMessage.success('新增成功')
      isAddVisible.value = false
      fetchApplicants()
    }
  } catch (e) {
  }
}

// 批量导入
const isImportModalVisible = ref(false)
const selectedImportFile = ref(null)
const importFileInput = ref(null)
const isImporting = ref(false)
const importResult = ref(null)
const examStationList = ref([])
const selectedStationIdForImport = ref(null)

const importConfirmDisabled = computed(() => {
  if (!selectedImportFile.value || isImporting.value) return true
  if (isSuperAdmin.value && (selectedStationIdForImport.value == null || selectedStationIdForImport.value === '')) return true
  return false
})

const openImportModal = async () => {
  selectedImportFile.value = null
  importResult.value = null
  selectedStationIdForImport.value = null
  isImportModalVisible.value = true
  if (isSuperAdmin.value) {
    try {
      const res = await getAllExamStations()
      const data = res?.data || res
      if (data?.code === 200 && Array.isArray(data?.data)) {
        examStationList.value = data.data
      } else if (Array.isArray(data)) {
        examStationList.value = data
      } else {
        examStationList.value = []
      }
    } catch (e) {
      examStationList.value = []
    }
  }
}
const closeImportModal = () => {
  isImportModalVisible.value = false
  selectedImportFile.value = null
  importResult.value = null
}
const triggerImportFileInput = () => {
  importFileInput.value?.click()
}
const handleImportFileChange = (e) => {
  const file = e.target?.files?.[0]
  selectedImportFile.value = file || null
  e.target.value = ''
}

const handleImport = async () => {
  if (!selectedImportFile.value || !props.examId) {
    ElMessage.warning('请选择导入文件')
    return
  }
  let stationId = null
  if (isSuperAdmin.value) {
    stationId = selectedStationIdForImport.value
    if (stationId == null || stationId === '') {
      ElMessage.warning('请选择考核站')
      return
    }
  } else {
    stationId = currentStationId.value
    if (stationId == null || stationId === undefined) {
      ElMessage.warning('无法获取考核站信息，请重新登录或联系管理员')
      return
    }
  }
  isImporting.value = true
  importResult.value = null
  try {
    const res = await batchAddApplicants(selectedImportFile.value, Number(stationId), props.examId)
    const data = res?.data || res
    if (data?.code === 200) {
      const result = data.data || data
      importResult.value = {
        success: result.successCount ?? 0,
        fail: result.failCount ?? 0,
        failDetails: result.failDetails || []
      }
      ElMessage.success('导入完成')
      fetchApplicants()
    } else {
      ElMessage.error(data?.msg || '导入失败')
    }
  } catch (e) {
    const msg = e?.response?.data?.msg || e?.message || '导入失败'
    ElMessage.error(msg)
  } finally {
    isImporting.value = false
  }
}

const downloadTemplate = async () => {
  try {
    const res = await downloadApplicantsTemplate()
    const blob = res?.data || res
    if (!blob || !(blob instanceof Blob)) {
      ElMessage.error('下载失败，未获取到文件')
      return
    }
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '报名人导入模板.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || '下载失败，请确认接口可用')
  }
}

const handleDelete = async (person) => {
  if (!person?.id) {
    ElMessage.warning('无法删除：缺少记录ID')
    return
  }
  
  try {
    // 二次确认
    await ElMessageBox.confirm(
      `确定要删除报名人"${person.studentName || person.persionName || person.studentId || person.persionId}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 用户确认后执行删除
    await deleteStudentsExamTotal(person.id)
    ElMessage.success('删除成功')
    fetchApplicants()
  } catch (e) {
    // 用户取消删除时，ElMessageBox.confirm 会抛出错误，这里忽略
    if (e !== 'cancel') {
      console.error('删除失败:', e)
      ElMessage.error('删除失败')
    }
  }
}

</script>

<style scoped>
.exam-applicants { padding: 0px; background: #f5f5f5; min-height: 100vh; }

.breadcrumb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.btn-back {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 14px;
}

.btn-back:hover {
  color: #c70019;
  border-color: #c70019;
}

/* 外层卡片，控制与其他页面卡片对齐 */
.applicants-card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; padding: 20px; }

/* 头部样式，参考 QuestionTable.vue */
.question-manage-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.header-info h3 { margin: 0; }
.header-actions { display: flex; gap: 8px; }
.btn { padding: 8px 16px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; cursor: pointer; transition: all 0.2s ease; }
.btn-primary { background-color: #c70019; color: #fff; border-color: #c70019; }
.btn-secondary { background: #f5f5f5; color: #333; border-color: #dcdfe6; }
.btn-secondary:hover:not(:disabled) { background: #ebebeb; }

.loading, .error { background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.table-responsive { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th { background: #fafafa; padding: 12px 16px; text-align: left; font-weight: 600; color: #333; border-bottom: 1px solid #e8e8e8; }
.data-table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; color: #666; }
.no-data { text-align: center; color: #909399; padding: 20px; }
.pagination-container { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
.total-count { color: #666; font-size: 14px; }
.pagination { display: flex; align-items: center; gap: 4px; }
.page-nav, .page-number { display: inline-block; padding: 6px 12px; text-decoration: none; color: #333; border: 1px solid #d9d9d9; border-radius: 4px; transition: all 0.3s; }
.page-nav:hover, .page-number:hover { border-color: #c70019; color: #c70019; }
.page-nav.disabled { color: #ccc; cursor: not-allowed; border-color: #f0f0f0; }
.page-nav.disabled:hover { border-color: #f0f0f0; color: #ccc; }
.page-number.active { background-color: #c70019; border-color: #c70019; color: white; }
.ellipsis { padding: 6px 12px; color: #999; }

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.page-size-selector select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
}

.page-size-selector select:focus {
  outline: none;
  border-color: #c70019;
}

/* 筛选区域样式 */
.filter-section {
  margin-bottom: 20px;
  padding: 18px 20px;
  background: linear-gradient(to bottom, #fafbfc, #f4f6f8);
  border: 1px solid #e8eaed;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
  line-height: 1.4;
}

.filter-select {
  padding: 9px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  min-width: 140px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-select:hover {
  border-color: #c0c4cc;
}

.filter-select:focus {
  outline: none;
  border-color: #c70019;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.1);
}

.filter-input {
  padding: 9px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  min-width: 160px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-input:hover {
  border-color: #c0c4cc;
}

.filter-input::placeholder {
  color: #a8abb2;
}

.filter-input:focus {
  outline: none;
  border-color: #c70019;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.1);
}

.filter-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 4px;
}

.btn-query {
  padding: 9px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: #c70019;
  border: 1px solid #c70019;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.btn-query:hover {
  background: #a80016;
  border-color: #a80016;
}

.btn-reset {
  padding: 9px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.btn-reset:hover {
  color: #c70019;
  border-color: #c70019;
  background: #fff7f7;
}

.btn-import { background-color: #409eff; color: #fff; border-color: #409eff; }
.btn-download { background: #f5f5f5; color: #333; border-color: #dcdfe6; }
.btn-sm { padding: 6px 12px; font-size: 13px; }

.file-upload-box {
  padding: 12px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  background: #fafafa;
}
.file-upload-box:hover { border-color: #c70019; background: #fff7f7; }
.file-input-hidden { display: none; }
.form-hint { margin-top: 8px; font-size: 12px; color: #909399; }
.import-result { margin-top: 12px; padding: 8px; background: #f0f9ff; border-radius: 4px; font-size: 13px; }
.fail-details { color: #e6a23c; margin-top: 4px; font-size: 12px; }

/* 考试状态样式 */
.status-examined {
  color: #67c23a;
  font-weight: 500;
}

.status-not-examined {
  color: #909399;
  font-weight: 500;
}

.op-link {
  text-decoration: none;
  margin-right: 10px;
}
.op-link-examined {
  color: #67c23a;
}
.op-link-examined:hover {
  text-decoration: underline;
}
.op-link-not-examined {
  color: #e6a23c;
}
.op-link-not-examined:hover {
  text-decoration: underline;
}

/* 统计信息样式 */
.statistics-section {
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  gap: 30px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stat-examined {
  color: #67c23a;
}

.stat-not-examined {
  color: #909399;
}

/* 简易模态框样式 */
.modal-mask { position: fixed; z-index: 2000; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; }
.modal-container { background: #fff; width: 520px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #eee; }
.modal-body { padding: 16px; }
.modal-footer { padding: 12px 16px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 8px; }
.close-btn { border: none; background: transparent; font-size: 18px; cursor: pointer; color: #999; }
.form-item { margin-bottom: 12px; }
.form-item label { display: block; margin-bottom: 6px; color: #333; }
.form-input { width: 100%; padding: 8px 10px; border: 1px solid #d9d9d9; border-radius: 4px; }
</style>

