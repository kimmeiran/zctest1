<template>
  <div class="exam-papers">
    <h2 class="page-title">考试试卷</h2>

    <template v-if="!showApplicants">
    <!-- 筛选区域（简化，接口一致） -->
    <div class="search-filter-section">
      <div class="filter-controls">
        <div class="filter-groups">
          <div class="filter-group">
            <label class="filter-label">组卷类型：</label>
            <select v-model="selectedExamType" class="filter-select">
              <option value="">全部</option>
              <option value="1">自动组卷</option>
              <option value="2">手动组卷</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">职业(工种)：</label>
            <select v-model="selectedJobType" class="filter-select">
              <option value="">全部</option>
              <option v-for="option in positionOptions" :key="option.id" :value="option.name">{{ option.name }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">级别：</label>
            <select v-model="selectedLevel" class="filter-select">
              <option value="">全部</option>
              <option v-for="option in levelOptions" :key="option.id" :value="option.name">{{ option.name }}</option>
            </select>
          </div>
        </div>
        <div class="filter-buttons">
          <button class="btn btn-search" @click="applyFilters">查询</button>
          <button class="btn btn-reset" @click="resetFilters">重置</button>
        </div>
      </div>
    </div>

    <!-- 加载与错误 -->
    <div v-if="isLoading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- 列表表格 -->
    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <!-- <th>序号</th> -->
            <th>考试ID</th>
            <th>名字</th>
            <th>职业(工种)</th>
            <th>技能等级</th>
            <!-- <th>该级别总人数</th> -->
            <th>总报名人数</th>
            <!-- <th>创建时间</th> -->
            <th>考试时长(分钟)</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="paper in paginatedPapers" :key="paper.id">
            <!-- <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td> -->
            <td>{{ paper.id }}</td>
            <td>{{ paper.name }}</td>
            <td>{{ paper.jobType }}</td>
            <td>{{ paper.level }}</td>
            <!-- <td>{{ paper.personCount ?? 0 }}</td> -->
            <td>{{ paper.totalRegistrationCount ?? 0 }}</td>
            <!-- <td>{{ formatDateTime(paper.createTime) }}</td> -->
            <td>{{ paper.consume }}</td>
            <td>{{ formatDateTime(paper.startTime) }}</td>
            <td>{{ formatDateTime(paper.endTime) }}</td>
            <td class="operations">
              <a href="#" class="people-link" @click.prevent="openApplicants(paper)">报名人列表</a>
              <!-- <a href="#" class="view-link" @click.prevent="viewPaper(paper)">查看</a>
              <a href="#" class="download-link" @click.prevent="showDownloadModal(paper)">下载</a> -->
            </td>
          </tr>
          <tr v-if="paginatedPapers.length === 0">
            <td colspan="10" class="no-data">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="!isLoading && !error && totalItems > 0">
      <div class="total-count">共 {{ totalItems }} 条</div>
      <div class="pagination">
        <a href="#" class="page-nav prev" @click.prevent="goToPage(currentPage - 1)" :class="{ disabled: currentPage === 1 }">&lt;</a>
        <template v-for="page in displayedPages" :key="page">
          <template v-if="page === '...'"><span class="ellipsis">...</span></template>
          <template v-else>
            <a href="#" class="page-number" :class="{ active: page === currentPage }" @click.prevent="goToPage(page)">{{ page }}</a>
          </template>
        </template>
        <a href="#" class="page-nav next" @click.prevent="goToPage(currentPage + 1)" :class="{ disabled: currentPage === totalPages }">&gt;</a>
      </div>
      <div class="page-size-selector">
        <span>{{ pageSize }} 条/页</span>
        <select v-model="pageSize" @change="handlePageSizeChange">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
        </select>
      </div>
    </div>

    </template>

    <!-- 二级页：报名人列表 -->
    <ExamApplicants 
      v-if="showApplicants" 
      :exam-id="currentExamId" 
      :exam-name="currentExamName"
      :use-exam-id="isFromExamManagement"
      @goBack="handleGoBackFromApplicants" 
    />

    <!-- 下载设置弹窗（沿用接口） -->
    <el-dialog title="下载设置" v-model="isDownloadModalVisible" width="500px" destroy-on-close>
      <div class="modal-body">
        <div class="form-row">
          <label>考试题名</label>
          <div class="form-control">
            <el-input v-model="downloadSettings.examTitle" placeholder="请输入考试题名" />
          </div>
        </div>
        <div class="form-row">
          <label>试卷大小</label>
          <div class="form-control">
            <label class="size-option-simple"><el-radio v-model="downloadSettings.paperSize" value="A4">A4 (答案卷)</el-radio></label>
            <label class="size-option-simple"><el-radio v-model="downloadSettings.paperSize" value="A3">A3 (考核卷)</el-radio></label>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDownloadModal">取 消</el-button>
          <el-button type="primary" @click="confirmDownload" :loading="isDownloading">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAllExams, getDictionaryByType, exportExamWordA4Answer, testA3Export } from '@/api/user'
import ExamApplicants from './ExamApplicants.vue'

const route = useRoute()
const router = useRouter()
const props = defineProps({
  directTeachExamId: { type: [String, Number], default: null }
})

// 从路由进入报名人员页时（/home/exam/applicants/:examId）优先用路由 params
const examIdFromRoute = computed(() =>
  route.name === 'HomeExamApplicants' && route.params.examId ? route.params.examId : null
)

const isLoading = ref(true)
const error = ref('')
const papers = ref([])

const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

const selectedExamType = ref('')
const selectedJobType = ref('')
const selectedLevel = ref('')

const positionOptions = ref([])
const levelOptions = ref([])

const paginatedPapers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return papers.value.slice(start, end)
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

const fetchPapers = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const searchInfo = {
      offset: currentPage.value - 1,
      limit: pageSize.value
    }
    const res = await getAllExams(searchInfo)
    if (res && res.code === 200) {
      papers.value = res.data.list || []
      totalItems.value = res.data.total || 0
    }
  } catch (e) {
    error.value = e.message || '获取考试试卷失败'
  } finally {
    isLoading.value = false
  }
}

const fetchPositionOptions = async () => {
  try {
    const res = await getDictionaryByType({ type: 0 })
    if (res && res.code === 200 && res.data) {
      positionOptions.value = res.data.map((i) => ({ id: i.id, name: i.name, code: i.code }))
    }
  } catch {}
}

const fetchLevelOptions = async () => {
  try {
    const res = await getDictionaryByType({ type: 1 })
    if (res && res.code === 200 && res.data) {
      levelOptions.value = res.data.filter((i) => i.name !== '职业道德').map((i) => ({ id: i.id, name: i.name, code: i.code }))
    }
  } catch {}
}

const goToPage = (page) => { if (page >= 1 && page <= totalPages.value) currentPage.value = page }
const handlePageSizeChange = () => { currentPage.value = 1; fetchPapers() }
const applyFilters = () => { currentPage.value = 1; fetchPapers() }
const resetFilters = () => { selectedExamType.value = ''; selectedJobType.value = ''; selectedLevel.value = ''; currentPage.value = 1; fetchPapers() }

const formatDateTime = (dt) => {
  if (!dt) return ''
  try { return new Date(dt).toLocaleString('zh-CN') } catch { return dt }
}

// 报名人列表二级页
const showApplicants = ref(false)
const currentExamId = ref(null)
const currentExamName = ref('')
const isFromExamManagement = ref(false)

const openApplicants = (paper) => { 
  currentExamId.value = paper.id
  currentExamName.value = paper.name || ''
  isFromExamManagement.value = false
  showApplicants.value = true 
}

const handleGoBackFromApplicants = () => { 
  const isFromExam = sessionStorage.getItem('fromExamManagement') === 'true' || isFromExamManagement.value
  
  showApplicants.value = false
  currentExamId.value = null
  currentExamName.value = ''
  isFromExamManagement.value = false
  
  if (isFromExam) {
    sessionStorage.removeItem('fromExamManagement')
    sessionStorage.removeItem('applicantsParams')
    sessionStorage.removeItem('showApplicantsFromExam')
    if (route.name === 'HomeExamApplicants') {
      router.push({ name: 'HomeExam' })
    } else {
      window.dispatchEvent(new CustomEvent('navigateToExamManagement'))
    }
  }
}

// 优先从路由 params 进入报名人员列表（/home/exam/applicants/:examId）
watch(examIdFromRoute, (id) => {
  if (id) {
    currentExamId.value = id
    currentExamName.value = (() => {
      try {
        const p = sessionStorage.getItem('applicantsParams')
        return p ? JSON.parse(p).examName || '' : ''
      } catch { return '' }
    })()
    isFromExamManagement.value = true
    showApplicants.value = true
  }
}, { immediate: true })

// 兼容：从 Main 通过 props/sessionStorage 传入时显示报名人员列表
watch(() => props.directTeachExamId, (newVal, oldVal) => {
  if (examIdFromRoute.value) return
  if (newVal && newVal !== oldVal) {
    const params = sessionStorage.getItem('applicantsParams')
    const fromExam = sessionStorage.getItem('showApplicantsFromExam') === 'true'
    if (params && fromExam) {
      try {
        const parsed = JSON.parse(params)
        currentExamId.value = parsed.examId || newVal
        currentExamName.value = parsed.examName || ''
        isFromExamManagement.value = parsed.fromExamManagement || false
        showApplicants.value = true
      } catch (e) {
        currentExamId.value = newVal
        currentExamName.value = ''
        isFromExamManagement.value = false
        showApplicants.value = true
      }
    } else {
      showApplicants.value = false
    }
  } else if (!newVal && oldVal) {
    showApplicants.value = false
    currentExamId.value = null
    currentExamName.value = ''
    isFromExamManagement.value = false
  }
})

// 下载
const isDownloadModalVisible = ref(false)
const downloadSettings = ref({ examTitle: '', paperSize: 'A4' })
const currentDownloadPaper = ref(null)
const isDownloading = ref(false)

const showDownloadModal = (paper) => {
  currentDownloadPaper.value = paper
  downloadSettings.value = { examTitle: '', paperSize: 'A4' }
  isDownloadModalVisible.value = true
}
const closeDownloadModal = () => { isDownloadModalVisible.value = false; currentDownloadPaper.value = null }
const confirmDownload = async () => {
  isDownloading.value = true
  try {
    let blob
    if (downloadSettings.value.paperSize === 'A4') {
      blob = await exportExamWordA4Answer({ paperId: currentDownloadPaper.value.id, examTitle: downloadSettings.value.examTitle })
    }
    const fileName = `${downloadSettings.value.examTitle || '试卷'}-${currentDownloadPaper.value.jobType || ''}-${currentDownloadPaper.value.level || ''}.docx`
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('试卷下载成功')
    closeDownloadModal()
  } catch (e) {
    ElMessage.error('下载失败')
  } finally { isDownloading.value = false }
}

const viewPaper = (paper) => {
  ElMessage.info(`查看试卷 ${paper.id}`)
}

onMounted(() => { 
  if (examIdFromRoute.value) {
    currentExamId.value = examIdFromRoute.value
    isFromExamManagement.value = true
    showApplicants.value = true
  } else if (props.directTeachExamId) {
    const params = sessionStorage.getItem('applicantsParams')
    const fromExam = sessionStorage.getItem('showApplicantsFromExam') === 'true'
    if (params && fromExam) {
      try {
        const parsed = JSON.parse(params)
        currentExamId.value = parsed.examId || props.directTeachExamId
        currentExamName.value = parsed.examName || ''
        isFromExamManagement.value = parsed.fromExamManagement || false
        showApplicants.value = true
      } catch (e) {
        showApplicants.value = false
      }
    } else {
      showApplicants.value = false
    }
  } else {
    showApplicants.value = false
  }
  if (!showApplicants.value) fetchPapers()
  fetchPositionOptions()
  fetchLevelOptions()
})
</script>

<style scoped>
.exam-papers { padding: 20px; background-color: #f5f5f5; min-height: 100vh; }
.page-title { font-size: 24px; font-weight: 600; color: #333; margin-bottom: 20px; }
.search-filter-section { background-color: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.filter-controls { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.filter-groups { display: flex; gap: 30px; flex: 1; }
.filter-group { display: flex; align-items: center; gap: 8px; }
.filter-label { font-size: 14px; font-weight: 500; color: #333; white-space: nowrap; }
.filter-select { padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; min-width: 120px; background: #fff; }
.filter-buttons { display: flex; gap: 12px; align-items: center; }
.btn { padding: 8px 16px; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; }
.btn-search { background-color: #409eff; color: #fff; }
.btn-reset { background-color: #909399; color: #fff; }
.loading, .error { background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
.table-responsive { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th { background: #fafafa; padding: 12px; text-align: left; font-weight: 600; color: #333; border-bottom: 1px solid #e8e8e8; }
.data-table td { padding: 12px; border-bottom: 1px solid #f0f0f0; color: #666; }
.operations { display: flex; gap: 10px; flex-wrap: wrap; }
.operations a { color: #409eff; text-decoration: none; font-size: 13px; padding: 4px 8px; border-radius: 4px; }
.operations a:hover { background: #ecf5ff; }
.status-dispatched { color: #67c23a; font-weight: 500; }
.status-not-dispatched { color: #909399; font-weight: 500; }
.no-data { text-align: center; color: #909399; font-style: italic; padding: 20px; }
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
.people-table { max-height: 60vh; overflow: auto; }
</style>

