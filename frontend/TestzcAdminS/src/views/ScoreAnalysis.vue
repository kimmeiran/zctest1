<template>
  <div class="score-analysis-container">
    <div class="content-wrapper">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="main-title">成绩分析</h1>
        <p class="subtitle">按职业(工种)和技能等级分组的考试成绩统计分析</p>
        <div class="title-divider"></div>
      </div>

      <!-- 总体统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-icon blue-icon">
              <Users class="icon" />
            </div>
            <div class="stat-info">
              <p class="stat-label">参考总人数</p>
              <p class="stat-value">{{ totalParticipants }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-icon green-icon">
              <TrendingUp class="icon" />
            </div>
            <div class="stat-info">
              <p class="stat-label">平均分</p>
              <p class="stat-value">{{ averageScore }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orange-icon">
              <Award class="icon" />
            </div>
            <div class="stat-info">
              <p class="stat-label">最高分</p>
              <p class="stat-value">{{ highestScore }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-icon purple-icon">
              <Building2 class="icon" />
            </div>
            <div class="stat-info">
              <p class="stat-label">职业(工种)数</p>
              <p class="stat-value">{{ employeeCategories.length }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-icon red-icon">
              <Clock class="icon" />
            </div>
            <div class="stat-info">
              <p class="stat-label">平均用时</p>
              <p class="stat-value">{{ averageConsume }}分钟</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表选择控制 -->
      <div class="chart-controls-section">
        <div class="chart-type-selector">
          <button 
            @click="chartType = 'pie'" 
            :class="{ active: chartType === 'pie' }"
            class="chart-type-button"
          >
            <PieChart class="button-icon" />
            饼状图
          </button>
          <!-- <button 
            @click="chartType = 'bar'" 
            :class="{ active: chartType === 'bar' }"
            class="chart-type-button"
          >
            <BarChart3 class="button-icon" />
            柱状图
          </button> -->
          <button 
            @click="chartType = 'horizontal'" 
            :class="{ active: chartType === 'horizontal' }"
            class="chart-type-button"
          >
            <BarChart class="button-icon" />
            横向柱状图
          </button>
        </div>
      </div>

      <!-- 主要图表分析区域 -->
      <div class="main-chart-section">
        <div class="chart-card main-analysis">
          <div class="chart-header">
            <div class="chart-title-section">
              <h2 class="chart-title">职业(工种)·技能等级分析</h2>
              <p class="chart-subtitle">各职业(工种)·技能等级的人数和平均分数对比</p>
            </div>
            <div class="chart-controls">
              <div class="control-group">
                <label class="control-label">排序方式:</label>
                <select v-model="sortBy" class="control-select">
                  <option value="count">按人数排序</option>
                  <option value="avgScore">按平均分排序</option>
                  <option value="name">按名称排序</option>
                </select>
              </div>
              <div class="control-group">
                <label class="control-label">显示数量:</label>
                <select v-model="displayCount" class="control-select">
                  <option value="10">前10名</option>
                  <option value="15">前15名</option>
                  <option value="20">前20名</option>
                  <option value="all">全部显示</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 搜索框 -->
          <div class="search-section">
            <div class="search-box">
              <Search class="search-icon" />
              <input 
                v-model="searchKeyword" 
                type="text" 
                placeholder="搜索职业(工种)·技能等级..." 
                class="search-input"
              />
            </div>
          </div>

          <!-- 饼状图 -->
          <div v-if="chartType === 'pie'" class="pie-chart-container">
            <div class="pie-chart-wrapper">
              <div class="pie-chart" :style="{ background: pieChartGradient }"></div>
              <div class="pie-chart-center">
                <div class="pie-chart-total">{{ displayedCategories.reduce((sum, cat) => sum + cat.count, 0) }}</div>
                <div class="pie-chart-label">总人数</div>
              </div>
            </div>
            <div class="pie-legend">
              <div class="legend-header">
                <h4>职业(工种)·技能等级分布详情</h4>
                <p class="legend-desc">显示各职业(工种)·技能等级的人数分布情况</p>
              </div>
              <div v-for="(category, index) in displayedCategories" :key="category.name" class="legend-item">
                <div class="legend-color" :style="{ backgroundColor: getPieColor(index) }"></div>
                <div class="legend-info">
                  <div class="legend-name">{{ category.name }}</div>
                  <div class="legend-stats">
                    <span class="legend-count">{{ category.count }}人</span>
                    <span class="legend-ratio">占总数 {{ Math.round((category.count / totalParticipants) * 100) }}%</span>
                    <span class="legend-score">平均{{ category.avgScore }}分</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 垂直柱状图 -->
          <div v-if="chartType === 'bar'" class="bar-chart-container">
            <div class="chart-description">
              <p>蓝色柱子表示人数，绿色柱子表示平均分数。柱子越高表示数值越大。</p>
            </div>
            <div class="chart-metrics">
              <div class="metric-item">
                <span class="metric-label">人数</span>
                <div class="metric-bar people-bar"></div>
                <span class="metric-range">0 - {{ maxCategoryCount }}人</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">平均分</span>
                <div class="metric-bar score-bar"></div>
                <span class="metric-range">0 - 100分</span>
              </div>
            </div>
            <div class="bar-chart-wrapper">
              <div class="bar-chart-y-axis">
                <div class="y-axis-section">
                  <div class="y-axis-label">人数</div>
                  <div v-for="tick in yAxisTicks" :key="'count-' + tick" class="y-axis-tick">{{ tick }}</div>
                </div>
              </div>
              <div class="bar-chart-content">
                <div class="bar-chart-grid">
                  <div v-for="tick in yAxisTicks" :key="'grid-' + tick" class="grid-line"></div>
                </div>
                <div class="bars-container">
                  <div v-for="(category, index) in displayedCategories" :key="category.name" class="bar-item">
                    <div class="bar-columns">
                      <!-- 人数柱 -->
                      <div class="bar-column people-column">
                        <div 
                          class="bar-fill-vertical people-fill"
                          :style="{ 
                            height: (category.count / maxCategoryCount * 100) + '%',
                            animationDelay: index * 100 + 'ms'
                          }"
                        ></div>
                      </div>
                      <!-- 分数柱 -->
                      <div class="bar-column score-column">
                        <div 
                          class="bar-fill-vertical score-fill"
                          :style="{ 
                            height: (category.avgScore / 100 * 100) + '%',
                            animationDelay: (index * 100 + 50) + 'ms'
                          }"
                        ></div>
                      </div>
                    </div>
                    <div class="bar-label">{{ category.name.length > 6 ? category.name.substring(0, 6) + '...' : category.name }}</div>
                    <div class="bar-values">
                      <div class="bar-value people-value">{{ category.count }}人</div>
                      <div class="bar-value score-value">{{ category.avgScore }}分</div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 右侧分数Y轴 -->
              <div class="bar-chart-y-axis-right">
                <div class="y-axis-section">
                  <div class="y-axis-label">分数</div>
                  <div v-for="tick in scoreAxisTicks" :key="'score-' + tick" class="y-axis-tick">{{ tick }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 横向柱状图 -->
          <div v-if="chartType === 'horizontal'" class="horizontal-bar-container">
            <div class="horizontal-chart-header">
              <div class="chart-description">
                <p>每个类别显示两个指标：人数多少和平均分高低</p>
              </div>
              <div class="chart-legend">
                <div class="legend-item-horizontal">
                  <div class="legend-color-horizontal people-color"></div>
                  <span>人数对比（相对于最多的类别）</span>
                </div>
                <div class="legend-item-horizontal">
                  <div class="legend-color-horizontal score-color"></div>
                  <span>分数对比（满分100分）</span>
                </div>
              </div>
            </div>
            <div v-for="(category, index) in displayedCategories" :key="category.name" class="horizontal-bar-item">
              <div class="horizontal-bar-info">
                <div class="horizontal-bar-name">{{ category.name }}</div>
                <div class="horizontal-bar-stats">
                  <span class="bar-count">{{ category.count }}人</span>
                  <span class="bar-avg">{{ category.avgScore }}分</span>
                  <span class="bar-description">占总人数{{ Math.round((category.count / totalParticipants) * 100) }}%</span>
                </div>
              </div>
              <div class="horizontal-bar-charts">
                <!-- 人数对比条 -->
                <div class="horizontal-bar-row">
                  <span class="bar-row-label">人数</span>
                  <div class="horizontal-bar-track">
                    <div 
                      class="horizontal-bar-fill people-fill-horizontal"
                      :style="{ 
                        width: (category.count / maxCategoryCount * 100) + '%',
                        animationDelay: index * 50 + 'ms'
                      }"
                    ></div>
                  </div>
                  <span class="bar-row-value">{{ category.count }}人</span>
                  <span class="bar-row-desc">（最多{{ maxCategoryCount }}人）</span>
                </div>
                <!-- 分数对比条 -->
                <div class="horizontal-bar-row">
                  <span class="bar-row-label">分数</span>
                  <div class="horizontal-bar-track">
                    <div 
                      class="horizontal-bar-fill score-fill-horizontal"
                      :style="{ 
                        width: category.avgScore + '%',
                        animationDelay: (index * 50 + 25) + 'ms'
                      }"
                    ></div>
                  </div>
                  <span class="bar-row-value">{{ category.avgScore }}分</span>
                  <span class="bar-row-desc">（满分100分）</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 展开/收起按钮 -->
          <div v-if="filteredCategories.length > parseInt(displayCount) && displayCount !== 'all'" class="expand-section">
            <button @click="displayCount = 'all'" class="expand-button">
              <span>显示全部 {{ filteredCategories.length }} 个职业(工种)·技能等级</span>
              <ChevronDown class="expand-icon" />
            </button>
          </div>
        </div>
      </div>

      <!-- 详细统计表格 -->
      <div class="table-card">
        <div class="table-header">
          <div class="table-title-section">
            <h2 class="table-title">职业(工种)·技能等级详细统计</h2>
            <p class="table-subtitle">各职业(工种)·技能等级的具体人数、分数和占比情况</p>
          </div>
        </div>
        
        <div class="table-container">
          <table class="stats-table">
            <thead>
              <tr>
                <th @click="sortTable('name')" class="sortable-header">
                  职业(工种)·技能等级
                  <ChevronUp v-if="tableSortBy === 'name' && tableSortOrder === 'asc'" class="sort-icon" />
                  <ChevronDown v-if="tableSortBy === 'name' && tableSortOrder === 'desc'" class="sort-icon" />
                </th>
                <th @click="sortTable('count')" class="sortable-header">
                  人数
                  <ChevronUp v-if="tableSortBy === 'count' && tableSortOrder === 'asc'" class="sort-icon" />
                  <ChevronDown v-if="tableSortBy === 'count' && tableSortOrder === 'desc'" class="sort-icon" />
                </th>
                <th @click="sortTable('avgScore')" class="sortable-header">
                  平均分
                  <ChevronUp v-if="tableSortBy === 'avgScore' && tableSortOrder === 'asc'" class="sort-icon" />
                  <ChevronDown v-if="tableSortBy === 'avgScore' && tableSortOrder === 'desc'" class="sort-icon" />
                </th>
                <th @click="sortTable('avgConsume')" class="sortable-header">
                  平均用时
                  <ChevronUp v-if="tableSortBy === 'avgConsume' && tableSortOrder === 'asc'" class="sort-icon" />
                  <ChevronDown v-if="tableSortBy === 'avgConsume' && tableSortOrder === 'desc'" class="sort-icon" />
                </th>
                <th>占总人数比例</th>
                <th>人数排名</th>
                <th>分数等级</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(category, index) in paginatedTableData" :key="category.name" class="table-row">
                <td class="category-name-cell">
                  <span class="category-badge">{{ category.name }}</span>
                </td>
                <td class="number-cell">
                  <div class="number-display">
                    <span class="number-value">{{ category.count }}人</span>
                    <div class="number-bar">
                      <div 
                        class="number-bar-fill"
                        :style="{ width: (category.count / maxCategoryCount * 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="score-cell">
                  <div class="score-display">
                    <span class="score-number">{{ category.avgScore }}分</span>
                    <div class="score-bar-mini">
                      <div 
                        class="score-bar-mini-fill"
                        :class="getScoreBarColorClass(category.avgScore)"
                        :style="{ width: category.avgScore + '%' }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="consume-cell">
                  <div class="consume-display">
                    <span class="consume-number">{{ category.avgConsume }}分钟</span>
                  </div>
                </td>
                <td class="percentage-cell">
                  <div class="percentage-display">
                    <span class="percentage-value">{{ Math.round((category.count / totalParticipants) * 100) }}%</span>
                    <span class="percentage-desc">（{{ category.count }}/{{ totalParticipants }}）</span>
                  </div>
                </td>
                <td class="rank-cell">
                  <span class="rank-badge" :class="getRankClass(category.count)">
                    {{ getRankText(category.count) }}
                  </span>
                </td>
                <td class="grade-cell">
                  <span class="grade-badge" :class="getGradeClass(category.avgScore)">
                    {{ getGradeText(category.avgScore) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页控件 -->
        <div v-if="totalPages > 1" class="pagination-container">
        <div class="pagination">
          <button 
            @click="currentPage = 1" 
            :disabled="currentPage === 1"
            class="pagination-button"
          >
            首页
          </button>
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="pagination-button"
          >
            上一页
          </button>
          <span class="pagination-info">
            第 {{ currentPage }} 页，共 {{ totalPages }} 页
          </span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="pagination-button"
          >
            下一页
          </button>
          <button 
            @click="currentPage = totalPages" 
            :disabled="currentPage === totalPages"
            class="pagination-button"
          >
            末页
          </button>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Users, TrendingUp, Award, Building2, BarChart3, Search, ChevronDown, ChevronUp, PieChart, BarChart, Clock } from 'lucide-vue-next'
import { getExamAnalysis } from '@/api/user'

// 响应式数据
const searchKeyword = ref('')
const sortBy = ref('count')
const displayCount = ref('15')
const chartType = ref('pie')
const tableSortBy = ref('count')
const tableSortOrder = ref('desc')
const currentPage = ref(1)
const pageSize = ref(15)

// 接口数据
const totalParticipants = ref(0)
const rawStudentList = ref([])
const loading = ref(false)

// 获取成绩分析数据
const fetchAnalysis = async () => {
  loading.value = true
  try {
    // type参数可根据实际业务传递，这里假设为1
    const res = await getExamAnalysis(1)
    if (res.code === 200 && res.data) {
      rawStudentList.value = res.data || []
      totalParticipants.value = rawStudentList.value.length
    }
  } catch (e) {
    totalParticipants.value = 0
    rawStudentList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchAnalysis)

// 处理后的类别统计
const employeeCategories = computed(() => {
  // 按工种(jobType)分组统计
  const categoryMap = new Map()
  
  rawStudentList.value.forEach(student => {
    const jobType = student.jobType || '未知职业(工种)'
    const level = student.level || '未知技能等级'
    const categoryKey = `${jobType}-${level}`
    
    if (!categoryMap.has(categoryKey)) {
      categoryMap.set(categoryKey, {
        name: `${jobType}(${level})`,
        jobType: jobType,
        level: level,
        count: 0,
        totalScore: 0,
        scores: [],
        avgConsume: 0,
        totalConsume: 0
      })
    }
    
    const category = categoryMap.get(categoryKey)
    category.count++
    category.totalScore += student.totalScore || 0
    category.scores.push(student.totalScore || 0)
    category.totalConsume += parseInt(student.consume || 0)
  })
  
  // 转换为数组并计算平均值
  return Array.from(categoryMap.values()).map(category => ({
    name: category.name,
    count: category.count,
    avgScore: category.count ? Math.round(category.totalScore / category.count) : 0,
    maxScore: category.scores.length ? Math.max(...category.scores) : 0,
    minScore: category.scores.length ? Math.min(...category.scores) : 0,
    passRate: category.scores.length ? Math.round(category.scores.filter(s => s >= 60).length / category.scores.length * 100) : 0,
    avgConsume: category.count ? Math.round(category.totalConsume / category.count) : 0,
    scores: category.scores,
    jobType: category.jobType,
    level: category.level
  }))
})

// 全局统计
const averageScore = computed(() => {
  const allScores = rawStudentList.value.map(student => student.totalScore || 0)
  if (!allScores.length) return 0
  return Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
})

const highestScore = computed(() => {
  const allScores = rawStudentList.value.map(student => student.totalScore || 0)
  if (!allScores.length) return 0
  return Math.max(...allScores)
})

const averageConsume = computed(() => {
  const allConsumes = rawStudentList.value.map(student => parseInt(student.consume || 0))
  if (!allConsumes.length) return 0
  return Math.round(allConsumes.reduce((sum, c) => sum + c, 0) / allConsumes.length)
})

// 计算属性
const filteredCategories = computed(() => {
  let filtered = employeeCategories.value
  
  // 搜索过滤
  if (searchKeyword.value) {
    filtered = filtered.filter(category => 
      category.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'count':
        return b.count - a.count
      case 'avgScore':
        return b.avgScore - a.avgScore
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })
  
  return filtered
})

const displayedCategories = computed(() => {
  if (displayCount.value === 'all') {
    return filteredCategories.value
  }
  return filteredCategories.value.slice(0, parseInt(displayCount.value))
})

const maxCategoryCount = computed(() => {
  return Math.max(...employeeCategories.value.map(cat => cat.count))
})

const yAxisTicks = computed(() => {
  const max = maxCategoryCount.value
  const step = Math.ceil(max / 5)
  return Array.from({ length: 6 }, (_, i) => max - i * step).filter(v => v >= 0)
})

const scoreAxisTicks = computed(() => {
  return [100, 90, 80, 70, 60, 50]
})

// 饼状图渐变
const pieChartGradient = computed(() => {
  let angle = 0
  const gradientStops = []
  
  displayedCategories.value.forEach((category, index) => {
    const percentage = (category.count / displayedCategories.value.reduce((sum, cat) => sum + cat.count, 0)) * 100
    const color = getPieColor(index)
    
    gradientStops.push(`${color} ${angle}deg ${angle + (percentage * 3.6)}deg`)
    angle += percentage * 3.6
  })
  
  return `conic-gradient(${gradientStops.join(', ')})`
})

// 表格数据
const sortedTableData = computed(() => {
  const data = [...employeeCategories.value]
  data.sort((a, b) => {
    const multiplier = tableSortOrder.value === 'asc' ? 1 : -1
    if (tableSortBy.value === 'name') {
      return a.name.localeCompare(b.name) * multiplier
    }
    return (a[tableSortBy.value] - b[tableSortBy.value]) * multiplier
  })
  return data
})

const totalPages = computed(() => {
  return Math.ceil(sortedTableData.value.length / pageSize.value)
})

const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedTableData.value.slice(start, end)
})

// 方法
const sortTable = (field) => {
  if (tableSortBy.value === field) {
    tableSortOrder.value = tableSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    tableSortBy.value = field
    tableSortOrder.value = 'desc'
  }
  currentPage.value = 1
}

// 获取人数排名
const getRankText = (count) => {
  const sorted = employeeCategories.value.sort((a, b) => b.count - a.count)
  const rank = sorted.findIndex(cat => cat.count === count) + 1
  const total = sorted.length
  
  if (rank <= total * 0.2) return '人数很多'
  if (rank <= total * 0.4) return '人数较多'
  if (rank <= total * 0.6) return '人数中等'
  if (rank <= total * 0.8) return '人数较少'
  return '人数很少'
}

const getRankClass = (count) => {
  const sorted = employeeCategories.value.sort((a, b) => b.count - a.count)
  const rank = sorted.findIndex(cat => cat.count === count) + 1
  const total = sorted.length
  
  if (rank <= total * 0.2) return 'rank-high'
  if (rank <= total * 0.4) return 'rank-good'
  if (rank <= total * 0.6) return 'rank-medium'
  if (rank <= total * 0.8) return 'rank-low'
  return 'rank-very-low'
}

// 获取分数等级
const getGradeText = (score) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '不及格'
}

const getGradeClass = (score) => {
  if (score >= 90) return 'grade-excellent'
  if (score >= 80) return 'grade-good'
  if (score >= 70) return 'grade-medium'
  if (score >= 60) return 'grade-pass'
  return 'grade-fail'
}

// 颜色函数
const getPieColor = (index) => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
    '#14b8a6', '#eab308', '#dc2626', '#9333ea', '#0891b2',
    '#f43f5e', '#22c55e', '#a855f7', '#0ea5e9', '#65a30d'
  ]
  return colors[index % colors.length]
}

const getScoreColor = (score) => {
  if (score >= 90) return '#10b981'
  if (score >= 80) return '#3b82f6'
  if (score >= 70) return '#f59e0b'
  if (score >= 60) return '#f97316'
  return '#ef4444'
}

const getScoreBarColorClass = (score) => {
  if (score >= 90) return 'score-bar-green'
  if (score >= 80) return 'score-bar-blue'
  if (score >= 70) return 'score-bar-yellow'
  if (score >= 60) return 'score-bar-orange'
  return 'score-bar-red'
}
</script>

<style scoped>
/* 基础样式保持不变，添加新的样式 */
.score-analysis-container {
  min-height: 100vh;
  background: transparent;
  padding: 0;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面标题样式 */
.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.main-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 12px;
}

.title-divider {
  width: 60px;
  height: 3px;
  background: #c70019;
  margin: 0 auto;
  border-radius: 2px;
}

/* 统计卡片样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  padding: 12px;
  border-radius: 12px;
  margin-right: 16px;
}

.blue-icon { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); }
.green-icon { background: linear-gradient(135deg, #34d399 0%, #10b981 100%); }
.orange-icon { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); }
.purple-icon { background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%); }
.red-icon { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }

.icon {
  width: 32px;
  height: 32px;
  color: white;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

/* 图表类型选择器 */
.chart-controls-section {
  margin-bottom: 32px;
}

.chart-type-selector {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.chart-type-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-type-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.chart-type-button.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.button-icon {
  width: 20px;
  height: 20px;
}

/* 主要图表区域 */
.main-chart-section {
  margin-bottom: 40px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.main-analysis {
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.chart-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.chart-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
}

.chart-controls {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.control-select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

/* 图表说明 */
.chart-description {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.chart-description p {
  margin: 0;
  color: #0369a1;
  font-size: 0.875rem;
}

.legend-desc {
  color: #6b7280;
  font-size: 0.75rem;
  margin: 0;
}

/* 搜索框 */
.search-section {
  margin-bottom: 24px;
}

.search-box {
  position: relative;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 44px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 饼状图样式 */
.pie-chart-container {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.pie-chart-wrapper {
  position: relative;
  flex-shrink: 0;
}

.pie-chart {
  width: 350px;
  height: 350px;
  border-radius: 50%;
  position: relative;
}

.pie-chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pie-chart-total {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1f2937;
}

.pie-chart-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.pie-legend {
  flex: 1;
  max-height: 350px;
  overflow-y: auto;
}

.legend-header {
  margin-bottom: 16px;
}

.legend-header h4 {
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.legend-item:hover {
  background-color: #f9fafb;
}

.legend-color {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-info {
  flex: 1;
}

.legend-name {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.legend-stats {
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.legend-count {
  font-weight: 500;
  color: #3b82f6;
}

.legend-ratio {
  color: #f59e0b;
}

.legend-score {
  color: #10b981;
}

/* 垂直柱状图样式 */
.bar-chart-container {
  height: 450px;
}

.chart-metrics {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  justify-content: center;
  align-items: center;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.metric-bar {
  width: 20px;
  height: 4px;
  border-radius: 2px;
}

.people-bar {
  background: #3b82f6;
}

.score-bar {
  background: #10b981;
}

.metric-range {
  font-size: 0.75rem;
  color: #9ca3af;
}

.bar-chart-wrapper {
  display: flex;
  height: 100%;
  gap: 16px;
}

.bar-chart-y-axis,
.bar-chart-y-axis-right {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 0;
  width: 50px;
}

.y-axis-section {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.y-axis-label {
  font-size: 0.75rem;
  color: #374151;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
}

.bar-chart-y-axis-right .y-axis-label {
  color: #10b981;
}

.bar-chart-y-axis .y-axis-label {
  color: #3b82f6;
}

.y-axis-tick {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: right;
}

.bar-chart-y-axis-right .y-axis-tick {
  text-align: left;
}

.bars-container {
  display: flex;
  align-items: flex-end;
  height: 100%;
  gap: 12px;
  padding: 20px 0 80px 0;
  overflow-x: auto;
}

.bar-columns {
  display: flex;
  gap: 4px;
  height: 320px;
  align-items: flex-end;
  margin-bottom: 8px;
}

.bar-column {
  width: 24px;
  display: flex;
  align-items: flex-end;
}

.bar-fill-vertical {
  width: 100%;
  border-radius: 3px 3px 0 0;
  animation: growUp 1s ease-out forwards;
  transform-origin: bottom;
  min-height: 2px;
}

@keyframes growUp {
  from { 
    transform: scaleY(0);
  }
  to { 
    transform: scaleY(1);
  }
}

.people-fill {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
}

.score-fill {
  background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
}

/* 横向柱状图样式 */
.horizontal-bar-container {
  max-height: 600px;
  overflow-y: auto;
}

.horizontal-chart-header {
  margin-bottom: 20px;
}

.chart-legend {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-top: 12px;
}

.legend-item-horizontal {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #6b7280;
}

.legend-color-horizontal {
  width: 16px;
  height: 4px;
  border-radius: 2px;
}

.people-color {
  background: #3b82f6;
}

.score-color {
  background: #10b981;
}

.horizontal-bar-item {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 12px;
  transition: background-color 0.2s ease;
  border: 1px solid #f3f4f6;
}

.horizontal-bar-item:hover {
  background-color: #f9fafb;
  border-color: #e5e7eb;
}

.horizontal-bar-info {
  width: 200px;
  flex-shrink: 0;
}

.horizontal-bar-name {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 6px;
}

.horizontal-bar-stats {
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bar-count {
  color: #3b82f6;
  font-weight: 500;
}

.bar-avg {
  color: #10b981;
  font-weight: 500;
}

.bar-description {
  color: #f59e0b;
  font-weight: 500;
}

.horizontal-bar-charts {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.horizontal-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-row-label {
  width: 40px;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.horizontal-bar-track {
  flex: 1;
  height: 12px;
  background-color: #f3f4f6;
  border-radius: 6px;
  overflow: hidden;
}

.horizontal-bar-fill {
  height: 100%;
  border-radius: 6px;
  animation: growRight 1s ease-out;
  min-width: 2px;
}

.people-fill-horizontal {
  background: #3b82f6;
}

.score-fill-horizontal {
  background: #10b981;
}

@keyframes growRight {
  from { width: 0; }
  to { width: var(--final-width); }
}

.bar-row-value {
  width: 50px;
  font-size: 0.75rem;
  color: #374151;
  font-weight: 600;
  text-align: right;
}

.bar-row-desc {
  width: 80px;
  font-size: 0.7rem;
  color: #9ca3af;
}

/* 展开按钮 */
.expand-section {
  margin-top: 24px;
  text-align: center;
}

.expand-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.expand-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.expand-icon {
  width: 16px;
  height: 16px;
}

/* 表格样式 */
.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  background: #f8fafc;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.table-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.table-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
}

.table-container {
  overflow-x: auto;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th {
  background-color: #f9fafb;
  padding: 16px 20px;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.sortable-header:hover {
  background-color: #f3f4f6;
}

.sort-icon {
  width: 14px;
  height: 14px;
  margin-left: 4px;
  display: inline-block;
}

.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f0f9ff;
}

.stats-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.category-name-cell .category-badge {
  display: inline-flex;
  padding: 6px 12px;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 20px;
  background-color: #dbeafe;
  color: #1e40af;
}

.number-cell .number-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.number-value {
  font-weight: 600;
  color: #1f2937;
  min-width: 50px;
}

.number-bar {
  width: 60px;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.number-bar-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.score-cell .score-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-number {
  font-weight: bold;
  color: #1f2937;
  min-width: 50px;
}

.score-bar-mini {
  width: 60px;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.score-bar-mini-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.score-bar-green { background-color: #10b981; }
.score-bar-blue { background-color: #3b82f6; }
.score-bar-yellow { background-color: #f59e0b; }
.score-bar-orange { background-color: #f97316; }
.score-bar-red { background-color: #ef4444; }

.consume-cell .consume-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.consume-number {
  font-weight: 600;
  color: #1f2937;
  min-width: 60px;
  text-align: center;
  padding: 4px 8px;
  background-color: #fef3c7;
  border-radius: 12px;
  font-size: 0.875rem;
}

.percentage-cell .percentage-display {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.percentage-value {
  font-weight: 600;
  color: #1f2937;
}

.percentage-desc {
  font-size: 0.75rem;
  color: #6b7280;
}

/* 排名和等级样式 */
.rank-cell, .grade-cell {
  text-align: center;
}

.rank-badge, .grade-badge {
  display: inline-flex;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 12px;
}

.rank-high { background-color: #dcfce7; color: #166534; }
.rank-good { background-color: #dbeafe; color: #1e40af; }
.rank-medium { background-color: #fef3c7; color: #92400e; }
.rank-low { background-color: #fed7aa; color: #9a3412; }
.rank-very-low { background-color: #fecaca; color: #991b1b; }

.grade-excellent { background-color: #dcfce7; color: #166534; }
.grade-good { background-color: #dbeafe; color: #1e40af; }
.grade-medium { background-color: #fef3c7; color: #92400e; }
.grade-pass { background-color: #fed7aa; color: #9a3412; }
.grade-fail { background-color: #fecaca; color: #991b1b; }

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.pagination-button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #6b7280;
  font-size: 0.875rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .pie-chart-container {
    flex-direction: column;
    align-items: center;
  }
  
  .pie-chart {
    width: 300px;
    height: 300px;
  }
  
  .pie-chart-center {
    width: 120px;
    height: 120px;
  }
}

@media (max-width: 768px) {
  .score-analysis-container {
    padding: 16px;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .chart-card {
    padding: 20px;
  }
  
  .chart-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  .table-header {
    padding: 20px;
  }
  
  .stats-table th,
  .stats-table td {
    padding: 12px 16px;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .horizontal-bar-info {
    width: 150px;
  }
  
  .horizontal-bar-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}
</style>