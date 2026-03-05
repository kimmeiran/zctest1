<template>
  <div class="student-score">
    <h2 class="page-title">查看成绩</h2>

    <!-- 第一级：考试列表 -->
    <div v-if="!showStudentList && !showQuestions && !showScoreAnalysis" class="content-container">
      <!-- 从成绩列表入口进入时显示面包屑，成绩列表可点击返回第一级简表页 -->
      <div v-if="fromScoreEntry" class="breadcrumb-row">
        <BreadcrumbNav :items="examListBreadcrumbItems" />
        <button type="button" class="btn-back" @click="goBackToScoreEntry">返回</button>
      </div>
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="error" class="error-message">
        {{ error }}
        <button class="btn btn-primary retry-btn" @click="fetchExams">重试</button>
      </div>

      <!-- 数据表格 -->
      <div v-else>
        <div class="filter-section">
          <div class="filter-bar">
            <label class="filter-label">名称筛选:</label>
            <input class="filter-input" type="text" v-model="searchWord" placeholder="请输入试卷名称关键字" />
            <label class="filter-label" style="margin-left: 12px;">起止日期:</label>
            <input class="filter-input" type="date" v-model="searchStartTime" />
            <span>至</span>
            <input class="filter-input" type="date" v-model="searchEndTime" />
            <label class="filter-label" style="margin-left: 12px;">考试模式:</label>
            <select class="filter-select" v-model="examMode">
              <option value="">全部</option>
              <option value="online">线上</option>
              <option value="offline">线下</option>
            </select>
            <label class="filter-label" style="margin-left: 12px;">技能等级:</label>
            <select class="filter-select" v-model="levelFilter">
              <option value="">全部</option>
              <option v-for="opt in levelOptions" :key="opt.id" :value="opt.name">{{ opt.name }}</option>
            </select>
            <label class="filter-label" style="margin-left: 12px;">工种:</label>
            <select class="filter-select" v-model="jobTypeFilter">
              <option value="">全部</option>
              <option v-for="opt in jobTypeOptions" :key="opt.id" :value="opt.name">{{ opt.name }}</option>
            </select>
          </div>
          <div class="filter-bar filter-bar-second">
            <label class="filter-label">报名人数:</label>
            <input class="filter-input filter-input-num" type="number" v-model.number="registrationCountMin" placeholder="下限" min="0" />
            <span>至</span>
            <input class="filter-input filter-input-num" type="number" v-model.number="registrationCountMax" placeholder="上限" min="0" />
            <label class="filter-label" style="margin-left: 12px;">通过人数:</label>
            <input class="filter-input filter-input-num" type="number" v-model.number="passCountMin" placeholder="下限" min="0" />
            <span>至</span>
            <input class="filter-input filter-input-num" type="number" v-model.number="passCountMax" placeholder="上限" min="0" />
            <label class="filter-label" style="margin-left: 12px;">考试时长(分钟):</label>
            <input class="filter-input filter-input-num" type="number" v-model.number="consumeMin" placeholder="下限" min="0" />
            <span>至</span>
            <input class="filter-input filter-input-num" type="number" v-model.number="consumeMax" placeholder="上限" min="0" />
            <div class="filter-actions">
              <button class="search-btn" @click="handleTopSearchClick">搜索</button>
              <button class="reset-btn" @click="handleResetFilters">重置</button>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>考试名称</th>
              <th>考核站</th>
              <th>考试模式</th>
              <th>报名人数</th>
              <th>通过人数</th>
              <th>考试时长（分钟）</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(exam, index) in paginatedExams" :key="exam.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ exam.examName }}</td>
              <td>{{ exam.stationName || getStationName(exam.stationId) }}</td>
              <td>
                <span v-if="exam.examType === 'online'" class="exam-mode-online">线上</span>
                <span v-else-if="exam.examType === 'offline'" class="exam-mode-offline">线下</span>
                <span v-else>-</span>
              </td>
              <td>{{ exam.totalRegistrationCount }}</td>
              <td>{{ (exam.passCount !== undefined && exam.passCount !== null) ? exam.passCount : '-' }}</td>
              <td>{{ exam.consume || '-' }}</td>
              <td>{{ formatDateTime(exam.startTime) }}</td>
              <td>{{ formatDateTime(exam.endTime) }}</td>
              <td class="operations">
                <button
                  :class="getExamOperationButtonClass(exam)"
                  @click="viewExamDetail(exam)"
                >
                  {{ getExamOperationButtonText(exam) }}
                </button>
                <button class="analysis-btn" @click="viewScoreAnalysis(exam)">成绩分析</button>
              </td>
            </tr>
            <tr v-if="paginatedExams.length === 0">
              <td colspan="10" class="no-data">暂无数据</td>
            </tr>
          </tbody>
          </table>
        </div>
      </div>

      <!-- 分页控件 -->
      <div class="pagination-container" v-if="!isLoading && !error && totalItems > 0">
        <div class="total-count">共 {{ totalItems }} 条</div>
        <div class="pagination">
          <a href="#" class="page-nav prev" @click.prevent="goToPage(currentPage - 1)"
            :class="{ disabled: currentPage === 1 }">&lt;</a>
          <template v-for="page in displayedPages" :key="page">
            <template v-if="page === '...'">
              <span class="ellipsis">...</span>
            </template>
            <template v-else>
              <a href="#" class="page-number" :class="{ active: page === currentPage }"
                @click.prevent="goToPage(page)">{{ page }}</a>
            </template>
          </template>
          <a href="#" class="page-nav next" @click.prevent="goToPage(currentPage + 1)"
            :class="{ disabled: currentPage === totalPages }">&gt;</a>
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
    </div>

    <!-- 第二级：员工列表 -->
    <div v-if="showStudentList && !showQuestions" class="content-container">
      <div class="breadcrumb-row">
        <BreadcrumbNav :items="studentListBreadcrumbItems" />
        <button type="button" class="btn-back" @click="goBackToExamList">返回</button>
      </div>
      <!-- 返回按钮区域 -->
      <div class="back-button-container top-back-button">
        <!-- 判分状态筛选（考核站管理员/审卷专家且线上考试时显示） -->
        <div v-if="(isGradingExpert || isReviewPaperExpert) && currentExam?.examType === 'online'"
          class="grading-filter-bar">
          <label class="filter-label">判分状态：</label>
          <select v-model="gradingStatusFilter" class="filter-select" @change="applyGradingStatusFilter">
            <option value="">全部</option>
            <option value="graded">已判</option>
            <option value="ungraded">未判</option>
          </select>
          <button class="btn btn-primary" @click="applyGradingStatusFilter">查询</button>
          <button class="btn btn-secondary" @click="resetGradingStatusFilter">重置</button>
        </div>
      </div>

      <!-- 考试信息展示 -->
      <div class="exam-info-header">
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">试卷名称:</span>
            <span class="info-value">{{ currentExam.examName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">报考技能等级:</span>
            <span class="info-value">{{ currentExam.examLevel }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">总报名人数:</span>
            <span class="info-value">{{ currentExam.totalRegistrationCount }}</span>
          </div>
        </div>
        <!-- 右上角批量导入/导出总分（仅线下考试且阅卷/审卷专家可见） -->
        <div
          class="download-btn-container"
          v-if="currentExam?.examType === 'offline' && (isGradingExpert || isReviewPaperExpert)"
        >
          <button class="download-btn" @click="exportOfflineScoreTemplate">
            导出总分模板
          </button>
          <button class="download-btn" style="margin-left: 8px;" @click="triggerBatchImport">
            导入总分
          </button>
          <input
            ref="batchImportInput"
            type="file"
            accept=".xlsx,.xls"
            style="display: none;"
            @change="handleBatchImportFile"
          />
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoadingStudents" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="studentError" class="error-message">
        {{ studentError }}
        <button class="btn btn-primary retry-btn" @click="fetchStudentScores">重试</button>
      </div>

      <!-- 员工列表表格 -->
      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>工号</th>
              <th>姓名</th>
              <th>职位</th>
              <th>考核站</th>
              <th v-if="currentExam?.examType === 'offline'">理论成绩</th>
              <th v-if="currentExam?.examType === 'offline'">实操成绩</th>
              <!-- 仅非线下考试显示考试过程相关字段 -->
              <th v-if="currentExam?.examType !== 'offline'">开始考试时间</th>
              <th v-if="currentExam?.examType !== 'offline'">交卷时间</th>
              <th v-if="currentExam?.examType !== 'offline'">用时</th>
              <!-- 线上考试展示客观/主观题总分和总分，线下（或未标记类型）考试只展示一个总分 -->
              <th v-if="currentExam?.examType === 'online'">客观题总分</th>
              <th v-if="currentExam?.examType === 'online'">主观题总分</th>
              <th>总分</th>
              <th>是否通过</th>
              <th v-if="currentExam?.examType !== 'offline'">考试状态</th>
              <th v-if="showStudentOperations">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(student, index) in paginatedStudents" :key="student.id">
              <td>{{ (studentCurrentPage - 1) * studentPageSize + index + 1 }}</td>
              <td>{{ student.employeeId }}</td>
              <td>{{ student.employeeName || '-' }}</td>
              <td>{{ student.position }}</td>
              <td>{{ getStationName(student.stationId) }}</td>
              <td v-if="currentExam?.examType === 'offline'">{{ student.theoryScore != null && student.theoryScore !== '' ? student.theoryScore : '-' }}</td>
              <td v-if="currentExam?.examType === 'offline'">{{ student.practiceScore != null && student.practiceScore !== '' ? student.practiceScore : '-' }}</td>
              <!-- 仅非线下考试显示考试过程相关字段 -->
              <td v-if="currentExam?.examType !== 'offline'">
                {{ student.examTime || '-' }}
              </td>
              <td v-if="currentExam?.examType !== 'offline'">
                {{ student.submitTime || '-' }}
              </td>
              <td v-if="currentExam?.examType !== 'offline'">
                {{ student.consume || '-' }}
              </td>
              <!-- 分数列：线上考试显示客观/主观总分和总分，线下或未标记类型考试显示总分 -->
              <td v-if="currentExam?.examType === 'online'">
                {{ student.objectiveTotalScore || '-' }}
              </td>
              <td v-if="currentExam?.examType === 'online'">
                {{ student.subjectiveTotalScore || '-' }}
              </td>
              <td>
                {{ getStudentTotalScore(student) }}
              </td>
              <td>
                <span :class="student.passStatus === 1 ? 'pass-status-text pass-yes' : 'pass-status-text pass-no'">
                  {{ student.passStatus === 1 ? '通过' : '未通过' }}
                </span>
              </td>
              <td v-if="currentExam?.examType !== 'offline'">
                {{ getStudentExamStatus(student) }}
              </td>
              <td v-if="showStudentOperations" class="operations">
                <!-- 管理员/考核站管理员：查看明细 -->
                <button
                  v-if="canViewScoreDetail(student)"
                  class="view-btn"
                  @click="viewStudentDetail(student)"
                >
                  查看
                </button>
                <!-- 线上考试：阅卷/审卷专家显示判分/未判/已判 -->
                <button
                  v-else-if="currentExam?.examType === 'online' && showScoreButtonForStudent(student)"
                  :class="['score-status-btn', isStudentGraded(student) ? 'score-status-graded' : 'score-status-ungraded']"
                  @click="viewStudentDetail(student)"
                >
                  {{ isStudentGraded(student) ? '已判' : '未判' }}
                </button>
                <!-- 线下考试：阅卷/审卷专家显示导入成绩 -->
                <button
                  v-else-if="(currentExam?.examType === 'offline' || !currentExam?.examType) && (isReviewPaperExpert || isGradingExpert)"
                  class="import-score-btn"
                  @click="openImportScoreModal(student)"
                >
                  导入成绩
                </button>
                <!-- 通过状态：职业认定/竞赛、线上/线下，阅卷/审卷专家均显示 -->
                <button
                  v-if="isReviewPaperExpert || isGradingExpert"
                  :class="['pass-status-btn', student.passStatus === 1 ? 'pass-status-yes' : 'pass-status-no']"
                  @click="handleSetPassStatus(student, student.passStatus === 1 ? 0 : 1)"
                >
                  {{ student.passStatus === 1 ? '取消通过' : '通过' }}
                </button>
              </td>
            </tr>
            <tr v-if="paginatedStudents.length === 0">
              <td :colspan="studentTableColumnCount" class="no-data">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页控件 -->
      <div class="pagination-container" v-if="!isLoadingStudents && !studentError && studentTotalItems > 0">
        <div class="total-count">共 {{ studentTotalItems }} 条</div>
        <div class="pagination">
          <a href="#" class="page-nav prev" @click.prevent="goToStudentPage(studentCurrentPage - 1)"
            :class="{ disabled: studentCurrentPage === 1 }">&lt;</a>
          <template v-for="page in studentDisplayedPages" :key="page">
            <template v-if="page === '...'">
              <span class="ellipsis">...</span>
            </template>
            <template v-else>
              <a href="#" class="page-number" :class="{ active: page === studentCurrentPage }"
                @click.prevent="goToStudentPage(page)">{{ page }}</a>
            </template>
          </template>
          <a href="#" class="page-nav next" @click.prevent="goToStudentPage(studentCurrentPage + 1)"
            :class="{ disabled: studentCurrentPage === studentTotalPages }">&gt;</a>
        </div>
        <div class="page-size-selector">
          <span>{{ studentPageSize }} 条/页</span>
          <select v-model="studentPageSize" @change="handleStudentPageSizeChange">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 导入成绩弹窗 -->
    <div v-if="isImportScoreVisible" class="modal-mask">
      <div class="modal-container">
        <div class="modal-header">
          <h3>导入成绩</h3>
          <button class="close-btn" @click="closeImportScoreModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>工号</label>
            <input v-model="scoreForm.employeeId" class="form-input" disabled />
          </div>
          <div class="form-item">
            <label>姓名</label>
            <input v-model="scoreForm.employeeName" class="form-input" disabled />
          </div>
          <!-- 职业认定(ruleType===0)：显示理论成绩、实操成绩，总成绩=理论+实操 -->
          <template v-if="isCareerExam">
            <div class="form-item">
              <label>理论成绩 <span style="color:#ff4d4f;">*</span></label>
              <input
                v-model.number="scoreForm.theoryScore"
                type="number"
                min="0"
                max="100"
                class="form-input"
                placeholder="0-100"
                @input="clampScoreInput('theoryScore', $event)"
              />
            </div>
            <div class="form-item">
              <label>实操成绩 <span style="color:#ff4d4f;">*</span></label>
              <input
                v-model.number="scoreForm.practiceScore"
                type="number"
                min="0"
                max="100"
                class="form-input"
                placeholder="0-100"
                @input="clampScoreInput('practiceScore', $event)"
              />
            </div>
            <div class="form-item">
              <label>总成绩</label>
              <input
                :value="computedTotalScore"
                class="form-input"
                readonly
                placeholder="理论+实操"
              />
            </div>
          </template>
          <div v-else class="form-item">
            <label>总成绩 <span style="color:#ff4d4f;">*</span></label>
            <input
              v-model="scoreForm.totalScore"
              type="number"
              class="form-input"
              placeholder="请输入总成绩"
            />
          </div>
          <!-- 仅非线下考试时展示时间与耗时字段；线下考试只需填写总成绩 -->
          <div
            class="form-item"
            v-if="currentExam?.examType !== 'offline'"
          >
            <label>考试时间</label>
            <el-date-picker
              v-model="scoreForm.examTime"
              type="datetime"
              placeholder="选择考试时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%;"
            />
          </div>
          <div
            class="form-item"
            v-if="currentExam?.examType !== 'offline'"
          >
            <label>提交时间</label>
            <el-date-picker
              v-model="scoreForm.submitTime"
              type="datetime"
              placeholder="选择提交时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%;"
            />
          </div>
          <div
            class="form-item"
            v-if="currentExam?.examType !== 'offline'"
          >
            <label>耗时(分钟)</label>
            <input
              v-model="scoreForm.consume"
              type="number"
              class="form-input"
              placeholder="请输入耗时（分钟）"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeImportScoreModal">
            取消
          </button>
          <button class="btn btn-primary" @click="submitImportScore">
            确认
          </button>
        </div>
      </div>
    </div>

    <!-- 第三级：员工答题详情页 -->
    <StudentDetail v-if="showQuestions" :current-student="currentStudent" :current-exam="currentExam"
      :exam-total="examTotal" :exam-details="examDetails" :is-loading-questions="isLoadingQuestions"
      :questions-error="questionsError" :read-only="isScoreDetailReadOnly"
      @go-back="goBackToStudentList"
      @retry-fetch-questions="() => fetchStudentQuestions(currentStudent.employeeId, currentExam.id)"
      @update-total-score="handleUpdateTotalScore" />

    <!-- 第四级：成绩分析页面 -->
    <div v-if="showScoreAnalysis" class="content-container">
      <!-- 返回按钮 -->
      <div class="back-button-container top-back-button">
        <button class="btn btn-secondary" @click="goBackToExamList">返回</button>
      </div>

      <!-- 考试信息展示 -->
      <div class="exam-info-header">
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">报考技能等级:</span>
            <span class="info-value">{{ currentExam.examLevel }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">人员管理总人数:</span>
            <span class="info-value">{{ currentExam.totalRegistrationCount ?? currentExam.registrationCount ?? 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 成绩分析组件 -->
      <ExamAnalysis :examId="currentExam.id" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  /** 是否从成绩列表入口页（简表）进入，为 true 时显示「返回」按钮可回到第一级 */
  fromScoreEntry: { type: Boolean, default: false },
  /** 从成绩列表第一页传入的 teachExamId，调用 /api/exam/list 时必传 */
  initialTeachExamId: { type: [Number, String], default: null }
});
const emit = defineEmits(["back-to-score-entry"]);
import * as XLSX from "xlsx";
import { ElMessage } from "element-plus";
import BreadcrumbNav from "@/components/BreadcrumbNav.vue";
import ExamAnalysis from "./ExamAnalysis.vue";
import StudentDetail from "./studentScore/StudentDetail.vue";
// Import the new getAllExams function instead of getExamList
import {
  getExamListForScore,
  getExamTotal,
  getExamDetail,
  exportScore,
  downloadFile, // 新增下载文件接口
  saveSubjectiveScore, // 新增保存主观题分数接口
  getDictionaryByType
} from "@/api/user";
import { getAllExamStations } from "@/api/examStation";
import { getApplicantsByExamId } from "@/api/exam";
import { updateOfflineExamScore, importOfflineScoreExcel, setPassStatus } from "@/api/studentsExamTotal.js";
import { getFullImageUrl, fetchImageAsBlobUrl, replaceImgPlaceholdersWithAuth } from '@/api/imageUpload.js';
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, ROLE_REVIEW_EXPERT, isRole, toRoleNumber } from '@/constants/role';

// 状态变量
const isLoading = ref(true);
const error = ref(null);
const isLoadingStudents = ref(false);
const studentError = ref(null);
const isLoadingQuestions = ref(false);
const questionsError = ref(null);

// 考核列表数据
const examList = ref([]);

// 学生成绩数据
const studentScores = ref([]);

// 学生考试总结数据
const examTotal = ref({
  employeeId: "",
  objectiveScore: "",
  position: "",
  employeeName: ""
});

// 学生考试详情数据
const examDetails = ref([]);

// 控制显示状态
const showStudentList = ref(false);
const showQuestions = ref(false);

// 考核站相关状态
const examStations = ref([]);
const loadingExamStations = ref(false);
const showScoreAnalysis = ref(false);
const currentExam = ref(null);
const currentStudent = ref(null);

// 获取当前用户信息
const currentUser = computed(() => {
  const userStr = sessionStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return {};
    }
  }
  return {};
});

const isReviewPaperExpert = computed(() => isRole(currentUser.value.role, ROLE_REVIEW_EXPERT));
const isGradingExpert = computed(() => {
  const r = toRoleNumber(currentUser.value.role);
  return r === ROLE_EXAM_STATION_ADMIN || r === 1; // 1 仅历史兼容
});
const isAdmin = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));
const isExamStationAdmin = computed(() => isRole(currentUser.value.role, ROLE_EXAM_STATION_ADMIN));

// 管理员/考核站管理员可查看成绩明细（只读）
const canViewScoreDetail = () => {
  return isAdmin.value || isExamStationAdmin.value;
};

// 线下考试 + 管理/总管理/考核站管理员：不显示操作列（直接隐藏）
const showStudentOperations = computed(() => {
  if (currentExam.value?.examType === 'offline' && (isAdmin.value || isExamStationAdmin.value)) {
    return false;
  }
  return true;
});

// 成绩明细页是否为只读（仅管理/总管理员只读；考核站管理员、审卷专家可判分）
const isScoreDetailReadOnly = computed(() => isAdmin.value);

// 学生考试状态
const getStudentExamStatus = (student) => {
  if (student.submitTime && String(student.submitTime).trim() !== "") {
    return "已考试";
  }
  return "未考试";
};

// 考试列表操作按钮文案：考核站管理员/审卷专家 线上→判分、线下→成绩导入；其他角色→查看
const getExamOperationButtonText = (exam) => {
  if (isGradingExpert.value || isReviewPaperExpert.value) {
    if (exam.examType === "online") return "判分";
    if (exam.examType === "offline") return "成绩导入";
  }
  return "查看";
};

// 考试列表操作按钮样式：判分/成绩导入用红色，查看用默认
const getExamOperationButtonClass = (exam) => {
  const text = getExamOperationButtonText(exam);
  if (text === "判分" || text === "成绩导入") return "view-btn view-btn-primary";
  return "view-btn";
};

// 考试用途显示：0-职业认定，1-竞赛
const getExamPurposeDisplay = (exam) => {
  const rt = exam.ruleType;
  if (rt === 0 || rt === "0") return "职业认定";
  if (rt === 1 || rt === "1") return "竞赛";
  return "-";
};

// 是否展示某个学生的判分按钮：考核站管理员(4)、审卷专家(8)及历史阅卷专家(1)可见
const showScoreButtonForStudent = (student) => {
  return isGradingExpert.value || isReviewPaperExpert.value;
};

// 判断学生是否已判分：优先使用接口 /api/exam/{id}/applicants 返回的 subjectiveGraded
// subjectiveGraded: true 已判，false 未判；兼容旧接口无该字段时的回退逻辑
const isStudentGraded = (student) => {
  const sg = student.subjectiveGraded;
  if (sg === true || sg === "true") return true;
  if (sg === false || sg === "false") return false;
  // 兼容：接口未返回 subjectiveGraded 时回退到旧逻辑
  if (student.graded === 1 || student.isGraded === 1 || student.gradeStatus === 1) return true;
  if (student.graded === true || student.isGraded === true) return true;
  if (currentExam.value?.examType === "online" && student.submitTime) {
    const sub = student.subjectiveTotalScore;
    if (sub !== undefined && sub !== null && typeof sub === "number") return true;
  }
  return false;
};

// 判分状态筛选
const gradingStatusFilter = ref("");
const applyGradingStatusFilter = () => {
  studentCurrentPage.value = 1;
};
const resetGradingStatusFilter = () => {
  gradingStatusFilter.value = "";
  studentCurrentPage.value = 1;
};

// 获取学生总分（线下考试使用）：优先使用后端返回的 totalScore 字段
// 若没有 totalScore，则回退为客观题 + 主观题总分
const getStudentTotalScore = (student) => {
  if (student.totalScore !== undefined && student.totalScore !== null) {
    return student.totalScore;
  }
  const objective = Number(student.objectiveTotalScore || 0);
  const subjective = Number(student.subjectiveTotalScore || 0);
  const sum = objective + subjective;
  return sum ? sum : "-";
};

// 批量导入总分相关
const batchImportInput = ref(null);
const isBatchImporting = ref(false);

// 是否职业认定考试（0=职业认定，需填理论+实操）
const isCareerExam = computed(() => currentExam.value?.ruleType === 0 || currentExam.value?.ruleType === "0");

// 职业认定时总成绩=理论+实操（只读，随输入自动求和）
const computedTotalScore = computed(() => {
  const t = scoreForm.value.theoryScore;
  const p = scoreForm.value.practiceScore;
  const hasT = t != null && t !== "";
  const hasP = p != null && p !== "";
  if (!hasT && !hasP) return "";
  const a = hasT ? Number(t) : 0;
  const b = hasP ? Number(p) : 0;
  if (isNaN(a) || isNaN(b)) return "";
  return a + b;
});

// 导入成绩相关
const isImportScoreVisible = ref(false);
const scoreForm = ref({
  employeeId: "",
  employeeName: "",
  teachExamId: "",
  totalScore: "",
  theoryScore: null,
  practiceScore: null,
  examTime: "",
  submitTime: "",
  consume: ""
});

// 设置通过状态（0否 1通过）
const handleSetPassStatus = async (student, passStatus) => {
  if (!student?.id) return;
  try {
    const res = await setPassStatus(student.id, passStatus);
    const resData = res?.data ?? res;
    if (resData?.code === 200) {
      ElMessage.success(resData.msg || (passStatus === 1 ? "已标记为通过" : "已取消通过"));
      await fetchStudentScores();
    } else {
      ElMessage.error(resData?.msg || "操作失败");
    }
  } catch (e) {
    console.error("设置通过状态失败:", e);
    ElMessage.error("设置通过状态失败");
  }
};

const openImportScoreModal = (student) => {
  scoreForm.value = {
    employeeId: student.employeeId || "",
    employeeName: student.employeeName || "",
    teachExamId: String(student.teachExamId || currentExam.value?.teachExamId || currentExam.value?.id || ""),
    totalScore: student.totalScore ?? student.objectiveTotalScore ?? "",
    theoryScore: student.theoryScore != null ? student.theoryScore : null,
    practiceScore: student.practiceScore != null ? student.practiceScore : null,
    examTime: student.examTime || "",
    submitTime: student.submitTime || "",
    consume: student.consume || ""
  };
  isImportScoreVisible.value = true;
};

const closeImportScoreModal = () => {
  isImportScoreVisible.value = false;
  scoreForm.value = {
    employeeId: "",
    employeeName: "",
    teachExamId: "",
    totalScore: "",
    theoryScore: null,
    practiceScore: null,
    examTime: "",
    submitTime: "",
    consume: ""
  };
};

// 理论/实操成绩：禁止负数，输入时自动修正并提示
const clampScoreInput = (field, event) => {
  const raw = event.target?.value;
  if (raw === "" || raw === null || raw === undefined) return;
  const n = Number(raw);
  if (Number.isNaN(n)) return;
  if (n < 0) {
    scoreForm.value[field] = 0;
    event.target.value = "0";
    ElMessage.warning("理论成绩和实操成绩不能输入负数");
  } else if (n > 100) {
    scoreForm.value[field] = 100;
    event.target.value = "100";
  }
};

const submitImportScore = async () => {
  if (!scoreForm.value.employeeId) {
    ElMessage.warning("工号不能为空");
    return;
  }
  if (!currentExam.value || !currentExam.value.id) {
    ElMessage.warning("无法获取考试信息");
    return;
  }

  if (isCareerExam.value) {
    const t = scoreForm.value.theoryScore;
    const p = scoreForm.value.practiceScore;
    if (t == null || t === "" || p == null || p === "") {
      ElMessage.warning("请填写理论成绩和实操成绩");
      return;
    }
    const tn = Number(t), pn = Number(p);
    if (tn < 0 || tn > 100 || pn < 0 || pn > 100) {
      ElMessage.warning("理论成绩和实操成绩须在0-100之间");
      return;
    }
  } else {
    if (!scoreForm.value.totalScore || scoreForm.value.totalScore === "") {
      ElMessage.warning("请输入总成绩");
      return;
    }
  }

  try {
    const payload = {
      studentId: scoreForm.value.employeeId,
      examId: parseInt(String(currentExam.value.id), 10),
      examTime: scoreForm.value.examTime || null,
      submitTime: scoreForm.value.submitTime || null,
      consume: scoreForm.value.consume || null
    };
    if (isCareerExam.value) {
      payload.theoryScore = Number(scoreForm.value.theoryScore);
      payload.practiceScore = Number(scoreForm.value.practiceScore);
      payload.totalScore = Number(scoreForm.value.theoryScore) + Number(scoreForm.value.practiceScore);
    } else {
      payload.totalScore = parseInt(scoreForm.value.totalScore, 10);
    }
    const res = await updateOfflineExamScore(payload);
    const resData = res?.data || res;
    if (resData && resData.code === 200) {
      ElMessage.success(resData.msg || "导入成绩成功");
      isImportScoreVisible.value = false;
      // 重新加载当前考试的学生成绩列表
      await fetchStudentScores();
    } else {
      ElMessage.error(resData?.msg || "导入成绩失败");
    }
  } catch (e) {
    console.error("导入成绩失败:", e);
    ElMessage.error("导入成绩失败");
  }
};

// 批量导出线下考试总分模板
const exportOfflineScoreTemplate = () => {
  if (!currentExam.value || !currentExam.value.id) {
    ElMessage.warning("无法获取考试信息");
    return;
  }
  if (!studentScores.value.length) {
    ElMessage.warning("暂无报名人员，无法导出");
    return;
  }

  try {
    const isCareer = currentExam.value?.ruleType === 0 || currentExam.value?.ruleType === "0";
    const data = studentScores.value.map((student, index) => {
      const row = {
        序号: index + 1,
        职工编号: student.employeeId,
        姓名: student.employeeName || "-",
        职位: student.position || "-",
        考核站: getStationName(student.stationId)
      };
      if (isCareer) {
        // 模板最后三列：理论分、实操分、总分（导入时总分由前两列自动加和）
        row["理论分"] = student.theoryScore != null ? student.theoryScore : "";
        row["实操分"] = student.practiceScore != null ? student.practiceScore : "";
        row["总分"] = getStudentTotalScore(student) === "-" ? "" : getStudentTotalScore(student);
      } else {
        row["总分"] = getStudentTotalScore(student) === "-" ? "" : getStudentTotalScore(student);
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = [
      { wch: 6 }, // 序号
      { wch: 14 }, // 职工编号
      { wch: 12 }, // 姓名
      { wch: 15 }, // 职位
      { wch: 16 } // 考核站
    ];
    if (isCareer) {
      colWidths.push({ wch: 10 }, { wch: 10 }, { wch: 8 }); // 理论分 实操分 总分
    } else {
      colWidths.push({ wch: 8 }); // 总分
    }
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "线下考试总分");

    const fileName = `${currentExam.value.examName || "线下考试"}-总分模板.xlsx`;
    XLSX.writeFile(wb, fileName);
    ElMessage.success("总分模板导出成功");
  } catch (error) {
    console.error("导出总分模板失败:", error);
    ElMessage.error("导出总分模板失败，请稍后重试");
  }
};

// 触发批量导入
const triggerBatchImport = () => {
  if (isBatchImporting.value) return;
  batchImportInput.value && batchImportInput.value.click();
};

// 处理批量导入文件：上传 Excel 到服务端，服务端解析并写入数据库，同时将 Excel 保存到服务器
const handleBatchImportFile = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    ElMessage.error("请上传 .xlsx 格式的 Excel 文件");
    return;
  }

  if (!currentExam.value?.id) {
    ElMessage.warning("无法获取当前考试信息");
    return;
  }

  if (!studentScores.value.length) {
    ElMessage.warning("当前考试暂无报名人员，无法导入");
    return;
  }

  isBatchImporting.value = true;
  try {
    const res = await importOfflineScoreExcel(file, currentExam.value.id);
    const resData = res?.data ?? res;
    const code = resData?.code ?? res?.code;
    const data = resData?.data ?? resData;

    if (code === 200 && data) {
      const successCount = data.successCount ?? 0;
      const failCount = data.failCount ?? 0;
      if (successCount > 0) await fetchStudentScores();
      if (failCount === 0) {
        ElMessage.success(`导入完成，共成功 ${successCount} 条，Excel 已保存到服务器`);
      } else {
        ElMessage.warning(`导入完成，成功 ${successCount} 条，失败 ${failCount} 条`);
        if (data.errors) console.warn("导入失败详情:", data.errors);
      }
    } else {
      ElMessage.error(resData?.msg ?? "导入失败，请检查文件格式后重试");
    }
  } catch (err) {
    console.error("批量导入总分失败:", err);
    ElMessage.error("批量导入总分失败，请检查文件格式后重试");
  } finally {
    isBatchImporting.value = false;
  }
};

// 考试列表分页
const currentPage = ref(1);
const pageSize = ref(10);
const searchWord = ref("");
const name = ref("");
const searchStartTime = ref(""); // 起始日期，格式为 YYYY-MM-DD
const searchEndTime = ref(""); // 截止日期，格式为 YYYY-MM-DD
const examMode = ref("");
const levelFilter = ref("");
const jobTypeFilter = ref("");
const levelOptions = ref([]);
const jobTypeOptions = ref([]);
const registrationCountMin = ref(undefined);
const registrationCountMax = ref(undefined);
const passCountMin = ref(undefined);
const passCountMax = ref(undefined);
const consumeMin = ref(undefined);
const consumeMax = ref(undefined);
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

// 学生列表分页
const studentCurrentPage = ref(1);
const studentPageSize = ref(10);
// 按判分状态筛选后的学生列表
const filteredStudentScores = computed(() => {
  const list = studentScores.value;
  const filter = gradingStatusFilter.value;
  if (!filter || currentExam.value?.examType !== "online") return list;
  return list.filter((s) => {
    const graded = isStudentGraded(s);
    if (filter === "graded") return graded;
    if (filter === "ungraded") return !graded;
    return true;
  });
});
const studentTotalItems = computed(() => filteredStudentScores.value.length);
const studentTotalPages = computed(() =>
  Math.ceil(studentTotalItems.value / studentPageSize.value)
);

// 时间格式化
const formatDateTime = (dt) => {
  if (!dt) return "-";
  try {
    const d = typeof dt === "string" || typeof dt === "number" ? new Date(dt) : dt;
    return d.toLocaleString("zh-CN");
  } catch (e) {
    return String(dt);
  }
};



// 使用基于 t_exam 的接口获取考试列表（用于查看成绩）
const fetchExams = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const toNum = (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : undefined);
    const searchInfo = {
      offset: currentPage.value - 1,
      limit: pageSize.value,
      searchWord: searchWord.value.trim() || undefined,
      name: name.value.trim() || undefined,
      searchStartTime: searchStartTime.value || undefined,
      searchEndTime: searchEndTime.value || undefined,
      examMode: examMode.value || undefined,
      level: levelFilter.value || undefined,
      jobType: jobTypeFilter.value || undefined,
      registrationCountMin: toNum(registrationCountMin.value),
      registrationCountMax: toNum(registrationCountMax.value),
      passCountMin: toNum(passCountMin.value),
      passCountMax: toNum(passCountMax.value),
      consumeMin: toNum(consumeMin.value),
      consumeMax: toNum(consumeMax.value),
      teachExamId: props.initialTeachExamId != null ? Number(props.initialTeachExamId) : undefined
    };
    const response = await getExamListForScore(searchInfo);

    if (response && response.code === 200) {
      // 转换数据格式，添加报考等级和报考人数（基于 t_exam）
      examList.value = (response.data.list || []).map(exam => ({
        ...exam,
        // 考核站（列表展示用）：接口返回 stationName 时优先使用
        stationId: exam.stationId ?? exam.station_id ?? null,
        stationName: exam.stationName ?? null,
        // 职称等级显示仍沿用“等级 + 工种”
        examLevel: `${exam.level}级${exam.jobType}`,
        // 试卷用途：0=职业认定 1=竞赛 2=模拟考核（用于成绩导入时显示理论/实操）
        ruleType: exam.ruleType,
        // 报考人数：按工种 + 等级在 t_exam_person 中统计
        applicantCount: exam.personCount || 0,
        // 总报名人数：默认使用 t_students_exam_total 中按 exam_id 统计的总数
        totalRegistrationCount: exam.registrationCount || 0,
        passCount: exam.passCount,
        // 考试时长（分钟）
        duration: exam.consume || exam.period || exam.duration || exam.examDuration,
        // 开始/结束时间直接来自 t_exam
        startTime: exam.startTime,
        endTime: exam.endTime
      }));

      // 如果当前用户是考核站管理员（role=4），则总报名人数显示“当前考核站”的报名人数
      const userRole = currentUser.value.role;
      if (userRole === 4 && examList.value.length > 0) {
        try {
          const updatedExams = await Promise.all(
            examList.value.map(async exam => {
              try {
                const res = await getApplicantsByExamId(exam.id);
                const resData = res.data || res;
                if (
                  resData &&
                  resData.code === 200 &&
                  Array.isArray(resData.data)
                ) {
                  return {
                    ...exam,
                    // 按接口返回的报名列表长度作为当前考核站报名人数
                    totalRegistrationCount: resData.data.length
                  };
                }
              } catch (e) {
                console.error("按考核站统计报名人数失败:", e);
              }
              return exam;
            })
          );
          examList.value = updatedExams;
        } catch (stationErr) {
          console.error("更新考核站报名人数失败:", stationErr);
        }
      }
      totalItems.value = response.data.total || 0;
    } else {
      throw new Error(response?.msg || "获取考试列表失败");
    }
  } catch (err) {
    console.error("获取考试列表失败:", err);
    error.value = err.message || "获取考试列表失败，请稍后重试";
  } finally {
    isLoading.value = false;
  }
};

// 获取学生成绩列表（基于报名记录 t_students_exam_total）
const fetchStudentScores = async () => {
  if (!currentExam.value || !currentExam.value.id) {
    return;
  }

  isLoadingStudents.value = true;
  studentError.value = null;

  try {
    const response = await getApplicantsByExamId(currentExam.value.id);
    const responseData = response.data || response; // axios 可能包了一层 data

    if (responseData && responseData.code === 200) {
      // 转换数据格式，添加员工信息
      studentScores.value = (responseData.data || []).map(student => ({
        ...student,
        employeeId: student.studentId || student.persionId,
        employeeName: student.studentName || student.persionName,
        position: student.position || student.tmajor || student.titleLevel || student.jobType || "-",
        stationId: student.stationId,
        registerTime: student.registerTime || student.createTime,
        examTime: student.examTime,
        submitTime: student.submitTime,
        consume: student.consume,
        objectiveScore: student.baseScore || student.totalScore,
        objectiveTotalScore:
          student.objectiveTotalScore || student.totalScore || 0,
        subjectiveTotalScore: student.subjectiveTotalScore || 0,
        teachExamId: student.teachExamId || currentExam.value.teachExamId, // 保留原始的teachExamId字段
        theoryScore: student.theoryScore,
        practiceScore: student.practiceScore,
        passStatus: student.passStatus ?? 0
      }));
    } else {
      throw new Error(responseData?.msg || "获取员工成绩列表失败");
    }
  } catch (err) {
    console.error("获取员工成绩列表失败:", err);
    studentError.value = err.message || "获取员工成绩列表失败，请稍后重试";
  } finally {
    isLoadingStudents.value = false;
  }
};

// 获取学生考试总结数据
const fetchExamTotal = async (employeeId, examId, teachExamId) => {
  if (!employeeId) {
    return;
  }

  isLoadingQuestions.value = true;
  questionsError.value = null;

  try {
    const response = await getExamTotal(employeeId, examId, teachExamId);

    if (response && response.data && response.data.code === 200) {
      const data = response.data.data || {};
      examTotal.value = {
        employeeId: employeeId,
        objectiveScore: data.baseScore || data.totalScore || 0,
        position: currentStudent.value.position,
        employeeName: currentStudent.value.employeeName
      };
    } else {
      throw new Error(response?.data?.msg || "获取员工考试总结数据失败");
    }
  } catch (err) {
    console.error("获取员工考试总结数据失败:", err);
    questionsError.value =
      err.message || "获取员工考试总结数据失败，请稍后重试";
  }
};

// 获取学生考试详情数据
const fetchStudentQuestions = async (employeeId, examId, teachExamId) => {
  if (!employeeId) {
    return;
  }

  isLoadingQuestions.value = true;
  questionsError.value = null;

  try {
    const response = await getExamDetail(employeeId, examId, teachExamId);

    if (response && response.data && response.data.code === 200) {
      // 处理新的数据结构：将分组数据转换为扁平数组
      const groupedData = response.data.data || {};
      const allQuestions = [];

      // 处理单选题
      if (groupedData.singleChoice && Array.isArray(groupedData.singleChoice)) {
        groupedData.singleChoice.forEach(question => {
          allQuestions.push({
            ...question,
            questionSubType: "single"
          });
        });
      }

      // 处理多选题
      if (groupedData.multiChoice && Array.isArray(groupedData.multiChoice)) {
        groupedData.multiChoice.forEach(question => {
          allQuestions.push({
            ...question,
            questionSubType: "multiple"
          });
        });
      }

      // 处理判断题
      if (groupedData.decide && Array.isArray(groupedData.decide)) {
        groupedData.decide.forEach(question => {
          allQuestions.push({
            ...question,
            questionSubType: "judge"
          });
        });
      }

      // 处理填空题
      if (groupedData.fillBank && Array.isArray(groupedData.fillBank)) {
        groupedData.fillBank.forEach(question => {
          allQuestions.push({
            ...question,
            questionSubType: "fillBlank"
          });
        });
      }

      // 处理简答题
      if (groupedData.shortAnswer && Array.isArray(groupedData.shortAnswer)) {
        groupedData.shortAnswer.forEach(question => {
          const initialScore =
            question.score || question.subjectiveScore || null;
          allQuestions.push({
            ...question,
            questionSubType: "essay",
            subjectiveScore: initialScore, // 优先使用score字段，如果没有则使用subjectiveScore
            originalScore: initialScore || 0, // 记录原始分数，用于计算差值
            isGraded: question.isGraded || question.is_graded || 0 // 保存是否已判分标记
          });
        });
      }

      // 处理综合题
      if (
        groupedData.comprehensive &&
        Array.isArray(groupedData.comprehensive)
      ) {
        groupedData.comprehensive.forEach(question => {
          const initialScore =
            question.score || question.subjectiveScore || null;
          allQuestions.push({
            ...question,
            questionSubType: "summary",
            subjectiveScore: initialScore, // 优先使用score字段，如果没有则使用subjectiveScore
            originalScore: initialScore || 0, // 记录原始分数，用于计算差值
            isGraded: question.isGraded || question.is_graded || 0 // 保存是否已判分标记
          });
        });
      }

      // 按sort字段排序
      allQuestions.sort((a, b) => (a.sort || 0) - (b.sort || 0));

      examDetails.value = allQuestions;

      // 处理题目和选项中的图片
      await processQuestionImages(examDetails.value);
    } else {
      throw new Error(response?.data?.msg || "获取员工考试详情数据失败");
    }
  } catch (err) {
    console.error("获取员工考试详情数据失败:", err);
    questionsError.value =
      err.message || "获取员工考试详情数据失败，请稍后重试";
  } finally {
    isLoadingQuestions.value = false;
  }
};

// 根据题目类型和内容判断具体的题型
const getQuestionSubType = (questionType, questionContent) => {
  // 根据questionType字段判断题型
  // 根据接口返回的数据结构，questionType应该对应不同的题型
  // 0: 单选题, 1: 多选题, 2: 判断题, 3: 填空题, 4: 简答题, 5: 综合题

  if (questionType === 0) {
    return "single"; // 单选题
  } else if (questionType === 1) {
    return "multiple"; // 多选题
  } else if (questionType === 2) {
    return "judge"; // 判断题
  } else if (questionType === 3) {
    return "fillBlank"; // 填空题
  } else if (questionType === 4) {
    return "essay"; // 简答题
  } else if (questionType === 5) {
    return "summary"; // 综合题
  } else {
    // 如果questionType为null或未知值，根据内容判断
    if (questionContent.includes("_____") || questionContent.includes("填空")) {
      return "fillBlank";
    } else if (
      questionContent.includes("正确") &&
      questionContent.includes("错误")
    ) {
      return "judge";
    } else if (
      questionContent.includes("哪些") ||
      questionContent.includes("多选")
    ) {
      return "multiple";
    } else {
      return "single";
    }
  }
};

// 获取图片 URL：发请求时带 Authorization 头，返回 blob URL
const getImageUrl = async src => {
  if (!src) return null;
  if (/^https?:\/\//.test(src) || /^data:image\//.test(src) || /^blob:/.test(src)) return src;
  return fetchImageAsBlobUrl(src);
};

// 考核站映射函数
const getStationName = (stationId) => {
  if (!stationId) return '-';
  const station = examStations.value.find(s => s.id === stationId);
  return station ? station.stationName : '未知考核站';
};

// 获取考核站列表
const fetchExamStations = async () => {
  if (examStations.value.length > 0) return; // 已经加载过了
  
  loadingExamStations.value = true;
  try {
    const response = await getAllExamStations();
    const responseData = response.data || {};
    
    if (responseData && responseData.code === 200) {
      examStations.value = responseData.data || [];
    } else {
      console.error('获取考核站列表失败:', responseData?.msg);
    }
  } catch (error) {
    console.error('获取考核站列表失败:', error);
  } finally {
    loadingExamStations.value = false;
  }
};

// 图片请求使用 replaceImgPlaceholdersWithAuth / fetchImageAsBlobUrl，发请求时带 Authorization 头

// 处理题目内容中已存在的 <img> 标签：用 fetch 带 token 请求后替换为 blob URL
const renderQuestionContent = async content => {
  if (!content) return content;
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  let match;
  let processedContent = content;
  while ((match = imgRegex.exec(content)) !== null) {
    const imgTag = match[0];
    const imgSrc = match[1];
    try {
      const imageUrl = await fetchImageAsBlobUrl(imgSrc);
      if (imageUrl) {
        const newImgTag = imgTag.replace(/src="[^"]+"/, `src="${imageUrl}"`);
        processedContent = processedContent.replace(imgTag, newImgTag);
      }
    } catch (e) {
      console.error("处理图片失败:", e);
    }
  }
  return processedContent;
};

// 处理题目和选项图片（[img] 用 replaceImgPlaceholdersWithAuth，请求带 token）
const processQuestionImages = async questions => {
  try {
    await Promise.all(
      questions.map(async q => {
        const optCsv = () => q.option_images || q.optionImages || "";
        if (q.questionContent) {
          const imagesCsv = q.question_content_images || q.questionContentImages || q.questionImages || "";
          let processedContent = await replaceImgPlaceholdersWithAuth(q.questionContent, imagesCsv);
          processedContent = await renderQuestionContent(processedContent);
          q._questionContentHtml = processedContent !== q.questionContent ? processedContent : q._questionContentHtml;
        }
        const optionFields = ["answera", "answerb", "answerc", "answerd", "answere", "answerf", "answerg", "answerh"];
        for (const field of optionFields) {
          if (q[field]) {
            let processedContent = await replaceImgPlaceholdersWithAuth(q[field], optCsv());
            processedContent = await renderQuestionContent(processedContent);
            if (processedContent !== q[field]) q[`_${field}Html`] = processedContent;
          }
        }
        if (q.answer) {
          const imagesCsv = q.answer_image || q.answerImage || "";
          let processedContent = await replaceImgPlaceholdersWithAuth(q.answer, imagesCsv);
          processedContent = await renderQuestionContent(processedContent);
          if (processedContent !== q.answer) q._answerHtml = processedContent;
        }
      })
    );
  } catch (error) {
    console.error("处理题目图片失败:", error);
  }
};

// 当前页显示的考试数据（服务端筛选后直接展示）
const paginatedExams = computed(() => examList.value);

// 当前页显示的学生数据
const paginatedStudents = computed(() => {
  const start = (studentCurrentPage.value - 1) * studentPageSize.value;
  const end = start + studentPageSize.value;
  return filteredStudentScores.value.slice(start, end);
});

// 根据考试类型和操作列显示状态计算学生表格列数（用于"暂无数据"行的 colspan）
const studentTableColumnCount = computed(() => {
  // 线上：15 列（不含理论成绩、实操成绩）；线下：11 列，线下+隐藏操作时 10 列
  if (currentExam.value?.examType === "online") return 15;
  return showStudentOperations.value ? 11 : 10;
});

// 计算显示哪些页码 - 考试列表
const displayedPages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    let startPage = Math.max(
      2,
      currentPage.value - Math.floor((maxVisiblePages - 3) / 2)
    );
    let endPage = Math.min(
      totalPages.value - 1,
      startPage + maxVisiblePages - 4
    );

    if (endPage - startPage + 1 < maxVisiblePages - 3) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 4) + 1);
    }

    if (startPage > 2) {
      pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages.value - 1) {
      pages.push("...");
    }

    pages.push(totalPages.value);
  }

  return pages;
});

// 计算显示哪些页码 - 学生列表
const studentDisplayedPages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;

  if (studentTotalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= studentTotalPages.value; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    let startPage = Math.max(
      2,
      studentCurrentPage.value - Math.floor((maxVisiblePages - 3) / 2)
    );
    let endPage = Math.min(
      studentTotalPages.value - 1,
      startPage + maxVisiblePages - 4
    );

    if (endPage - startPage + 1 < maxVisiblePages - 3) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 4) + 1);
    }

    if (startPage > 2) {
      pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < studentTotalPages.value - 1) {
      pages.push("...");
    }

    pages.push(studentTotalPages.value);
  }

  return pages;
});

// 方法
const goToPage = page => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchExams();
};

const goToStudentPage = page => {
  if (page < 1 || page > studentTotalPages.value) return;
  studentCurrentPage.value = page;
};

const handlePageSizeChange = () => {
  currentPage.value = 1; // 改变每页显示数量后回到第一页
  fetchExams();
};

const handleStudentPageSizeChange = () => {
  studentCurrentPage.value = 1; // 改变每页显示数量后回到第一页
};

// 顶部搜索：点击触发接口
const handleTopSearchClick = () => {
  const start = searchStartTime.value?.trim();
  const end = searchEndTime.value?.trim();
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate > endDate) {
      ElMessage.warning("开始时间不能大于结束时间");
      return;
    }
  }
  currentPage.value = 1;
  fetchExams();
};

const handleResetFilters = () => {
  searchWord.value = "";
  searchStartTime.value = "";
  searchEndTime.value = "";
  examMode.value = "";
  levelFilter.value = "";
  jobTypeFilter.value = "";
  registrationCountMin.value = undefined;
  registrationCountMax.value = undefined;
  passCountMin.value = undefined;
  passCountMax.value = undefined;
  consumeMin.value = undefined;
  consumeMax.value = undefined;
  currentPage.value = 1;
  fetchExams();
};

// 第一级到第二级：查看考试详情（学生列表）
const viewExamDetail = exam => {
  currentExam.value = exam;
  showStudentList.value = true;
  studentCurrentPage.value = 1; // 重置学生列表分页
  fetchStudentScores(); // 获取学生成绩列表
};

// 第一级到第四级：查看成绩分析
const viewScoreAnalysis = exam => {
  currentExam.value = exam;
  showScoreAnalysis.value = true;
  showStudentList.value = false;
  showQuestions.value = false;
};

// 第二级到第三级：查看学生详情（题目和答案）
const viewStudentDetail = async student => {
  currentStudent.value = student;

  const examId = student.examId || currentExam.value?.id;
  const teachExamId = student.teachExamId || currentExam.value?.teachExamId;

  // 获取学生考试总结数据
  await fetchExamTotal(student.employeeId, examId, teachExamId);

  // 获取学生考试详情数据
  await fetchStudentQuestions(student.employeeId, examId, teachExamId);

  showQuestions.value = true;
};

// 从第二级返回第一级：学生列表返回考试列表
const goBackToExamList = () => {
  showStudentList.value = false;
  showScoreAnalysis.value = false;
  currentExam.value = null;
  studentScores.value = [];
  gradingStatusFilter.value = "";
};

// 从考试详情页返回第一级简表（成绩列表入口）
const goBackToScoreEntry = () => {
  emit("back-to-score-entry");
};

// 第一级考试列表页面包屑：考核成绩 / 成绩列表(可点回简表) / 考试详情列表
const examListBreadcrumbItems = computed(() => [
  { label: '考核成绩' },
  { label: '成绩列表', onClick: goBackToScoreEntry },
  { label: '考试详情列表' }
]);

// 面包屑：考核成绩 / 成绩列表 / 考试详情列表（与第一级入口页对齐）
const studentListBreadcrumbItems = computed(() => [
  { label: '考核成绩' },
  { label: '考试详情列表', onClick: goBackToExamList },
  { label: '考试学生列表' }
])

// 从第三级返回第二级：题目详情返回学生列表
const goBackToStudentList = async () => {
  showQuestions.value = false;
  currentStudent.value = null;
  examTotal.value = {};
  examDetails.value = [];
  // 返回时刷新学生成绩列表，以便显示最新的评分结果
  await fetchStudentScores();
};

// 处理总分更新
const handleUpdateTotalScore = (scoreDiff) => {
  // 更新总分
  const currentTotal = parseFloat(examTotal.value.objectiveScore) || 0;
  examTotal.value.objectiveScore = (currentTotal + scoreDiff).toFixed(1);
};

// 下载所有学生成绩
const downloadAllScores = async () => {
  if (!currentExam.value || !currentExam.value.id) {
    ElMessage.warning("无法获取考试信息");
    return;
  }

  try {
    const teachId = localStorage.getItem("teachId") || "1"; // 默认值为1

    // 调用API下载成绩，返回的是二进制数据
    const response = await exportScore(teachId, currentExam.value.id);

    // 创建Blob对象，指定类型为zip
    const blob = new Blob([response], { type: "application/zip" });

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentExam.value.examLevel}_成绩.zip`;
    document.body.appendChild(a);
    a.click();

    // 清理URL对象
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    ElMessage.success("成绩表下载成功");
  } catch (error) {
    console.error("下载成绩表失败:", error);
    ElMessage.error("下载失败，请重试");
  }
};

// 下载单个学生成绩
const downloadStudentScore = () => {
  if (!currentExam.value || !currentStudent.value) {
    ElMessage.warning("无法获取考试或员工信息");
    return;
  }

  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Create student information worksheet
    const studentInfo = [
      {
        工号: currentStudent.value.employeeId,
        姓名: currentStudent.value.employeeName || "-",
        职位: currentStudent.value.position,
        客观题得分: examTotal.value.objectiveScore
      }
    ];
    const infoWs = XLSX.utils.json_to_sheet(studentInfo);

    // Set column widths for student info
    infoWs["!cols"] = [
      { wch: 12 }, // 工号
      { wch: 12 }, // 姓名
      { wch: 15 }, // 职位
      { wch: 12 } // 客观题得分
    ];

    // Add student info worksheet to workbook
    XLSX.utils.book_append_sheet(wb, infoWs, "员工信息");

    // Create answer details worksheet
    const answerData = examDetails.value.map((question, index) => {
      const questionData = {
        题号: index + 1,
        题目类型: question.questionType === 0 ? "客观题" : "主观题",
        具体类型: getQuestionTypeName(question.questionSubType),
        题目内容: question.questionContent,
        学生答案: question.studentAnser || "未作答",
        分值: question.score || 2
      };

      // 只有客观题显示选项和正确性判断
      if (
        question.questionType === 0 &&
        question.questionSubType !== "fillBlank"
      ) {
        questionData.选项A = question.answera;
        questionData.选项B = question.answerb;
        questionData.选项C = question.answerc;
        questionData.选项D = question.answerd;
        questionData.是否正确 =
          question.studentAnser === question.answer ? "✓" : "✗";
      }

      return questionData;
    });
    const answerWs = XLSX.utils.json_to_sheet(answerData);

    // Set column widths for answer details
    answerWs["!cols"] = [
      { wch: 6 }, // 题号
      { wch: 10 }, // 题目类型
      { wch: 10 }, // 具体类型
      { wch: 50 }, // 题目内容
      { wch: 30 }, // 学生答案
      { wch: 6 }, // 分值
      { wch: 20 }, // 选项A
      { wch: 20 }, // 选项B
      { wch: 20 }, // 选项C
      { wch: 20 }, // 选项D
      { wch: 10 } // 是否正确
    ];

    // Add answer details worksheet to workbook
    XLSX.utils.book_append_sheet(wb, answerWs, "答题详情");

    // Generate filename
    const fileName = `${currentStudent.value.employeeId}_${currentStudent.value
      .employeeName || ""}_成绩和题目.xlsx`;

    // Write and download the Excel file
    XLSX.writeFile(wb, fileName);

    ElMessage.success("成绩详情已下载为Excel文件");
  } catch (error) {
    console.error("下载员工成绩失败:", error);
    ElMessage.error("下载失败，请重试");
  }
};



const loadFilterOptions = async () => {
  try {
    const [jobRes, levelRes] = await Promise.all([
      getDictionaryByType({ type: 0 }),
      getDictionaryByType({ type: 1 })
    ]);
    if (jobRes?.code === 200 && jobRes?.data) {
      jobTypeOptions.value = (Array.isArray(jobRes.data) ? jobRes.data : []).map(item => ({
        id: item.id,
        name: item.name || item.label
      }));
    }
    if (levelRes?.code === 200 && levelRes?.data) {
      levelOptions.value = (Array.isArray(levelRes.data) ? levelRes.data : []).map(item => ({
        id: item.id,
        name: item.name || item.label
      }));
    }
  } catch (e) {
    console.warn("加载筛选选项失败:", e);
  }
};

// 组件挂载时获取考试列表
onMounted(async () => {
  await fetchExamStations(); // 先获取考核站列表
  await loadFilterOptions();
  fetchExams();
});
</script>

<style scoped>
.student-score {
  padding: 20px;
}

.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 500;
}

.content-container {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

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
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #f5f7fa;
  color: #000;
  cursor: pointer;
  font-size: 14px;
}

.btn-back:hover {
  background: #eef0f4;
  border-color: #dcdfe6;
  color: #000;
}

.breadcrumb-text {
  font-size: 14px;
  color: #666;
}

/* 顶部筛选栏 */
.filter-section {
  padding: 16px 20px;
  margin-bottom: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.filter-bar-second {
  margin-bottom: 0;
  align-items: center;
}
.filter-input-num {
  width: 120px;
  min-width: 120px;
}
.reset-btn {
  padding: 0 16px;
  height: 36px;
  line-height: 34px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}
.reset-btn:hover {
  border-color: #40a9ff;
  color: #1890ff;
}

.filter-label {
  color: #666;
  font-size: 14px;
  min-width: 80px;
}

.filter-input {
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  min-width: 200px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 判分状态筛选栏 */
.grading-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grading-filter-bar .btn {
  height: 30px;
  padding: 0 14px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.filter-select {
  height: 36px;
  min-width: 200px;
  padding: 0 28px 0 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
  font-size: 14px;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  cursor: pointer;
}

.filter-select:hover {
  border-color: #40a9ff;
}

.filter-select:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.filter-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-btn {
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  height: 36px;
  padding: 0 16px;
  cursor: pointer;
}

.search-btn:hover {
  background-color: #40a9ff;
}

/* 考试信息头部 */
.exam-info-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #eee;
  justify-content: space-between;
  align-items: center;
}

.info-section {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.download-btn-container {
  margin-left: auto;
}

.download-btn {
  background-color: #c70019;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.download-btn:hover {
  background-color: #c7cccf;
}

.student-info-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background-color: #f0f8ff;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.info-label {
  color: #666;
  margin-right: 5px;
}

.info-value {
  font-weight: 500;
}

.action-buttons {
  margin-left: auto;
}

/* 表格样式 */
.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background-color: #fafafa;
  font-weight: 500;
}

.data-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.operations {
  display: flex;
  gap: 10px;
}

.import-score-btn {
  background-color: #19a7e8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
}

.import-score-btn:hover {
  background-color: #33b7f3;
}

.pass-status-btn {
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 13px;
  margin-left: 6px;
}
.pass-status-no {
  background-color: #52c41a;
  color: white;
}
.pass-status-no:hover {
  background-color: #73d13d;
}
.pass-status-yes {
  background-color: #faad14;
  color: white;
}
.pass-status-yes:hover {
  background-color: #ffc53d;
}

/* 是否通过列文本样式 */
.pass-status-text.pass-yes {
  color: #52c41a;
}
.pass-status-text.pass-no {
  color: #909399;
}

.view-btn {
  background-color: #c70019;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
}

.view-btn:hover {
  background-color: #c0c1c2;
}

/* 判分状态按钮：未判-红色，已判-蓝色 */
.score-status-btn {
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 13px;
}
.score-status-ungraded {
  background-color: #ff4d4f;
  color: white;
}
.score-status-ungraded:hover {
  background-color: #ff7875;
}
.score-status-graded {
  background-color: #1890ff;
  color: white;
}
.score-status-graded:hover {
  background-color: #40a9ff;
}

.analysis-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
}

.analysis-btn:hover {
  background-color: #40a9ff;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-number,
.page-nav,
.ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 4px;
  font-size: 14px;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
}

.page-number:hover,
.page-nav:hover {
  background-color: #f0f0f0;
}

.page-number.active {
  background-color: #c70019;
  color: white;
}

.ellipsis {
  cursor: default;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-size-selector select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

/* 题目列表样式 */
.questions-container {
  padding: 15px;
}

.question-section {
  margin-bottom: 30px;
}

.section-title {
  color: #1890ff;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #1890ff;
}

.question-item {
  margin-bottom: 20px;
}

.question-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.question-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #1890ff;
  color: white;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 14px;
}

.question-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  padding: 2px 8px;
  margin-right: 10px;
  font-size: 12px;
}

.question-text {
  flex: 1;
  line-height: 1.5;
}

.question-options {
  margin-left: 34px;
  margin-bottom: 10px;
}

.option {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 5px;
  border-radius: 4px;
}

.option.selected:not(.correct) {
  background-color: #fff1f0;
}

.option.selected.incorrect {
  background-color: #fff1f0;
}

.option.selected {
  background-color: #fff1f0;
}

.option.correct {
  background-color: #f6ffed;
}

.option.selected.correct {
  background-color: #d9f7be;
}

.option-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 10px;
  font-weight: 500;
}

.option.selected:not(.correct) .option-letter {
  background-color: #ff4d4f;
  color: white;
}

.option.selected .option-letter {
  background-color: #1890ff;
  color: white;
}

.option.correct .option-letter {
  background-color: #52c41a;
  color: white;
}

.fill-blank-answer,
.subjective-answer {
  margin-left: 34px;
  margin-bottom: 10px;
}

.answer-item {
  margin-bottom: 8px;
}

.answer-label {
  color: #666;
  font-weight: 500;
  margin-right: 8px;
}

.answer-value {
  color: #333;
}

.answer-content {
  margin-top: 5px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.question-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 15px 0;
}

.back-button-container {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 顶部返回按钮样式 */
.top-back-button {
  padding: 12px 16px;
  border-top: none;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border-color: #dcdfe6;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #ebebeb;
}

.btn-primary {
  background-color: #c70019;
  color: white;
}

.btn-primary:hover {
  background-color: #a7aaad;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #c70019;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  text-align: center;
  color: #ff4d4f;
  padding: 20px;
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  margin-bottom: 20px;
}

.retry-btn {
  margin-top: 10px;
  background-color: #c70019;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* 简易模态框样式（复用报名人管理风格） */
.modal-mask {
  position: fixed;
  z-index: 2000;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-container {
  background: #fff;
  width: 520px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #999;
}

.form-item {
  margin-bottom: 12px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 30px 0;
}

.error-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 34px;
  margin-bottom: 10px;
  color: #ff4d4f;
  font-size: 14px;
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #ff4d4f;
  color: white;
  margin-right: 5px;
  font-size: 12px;
}

.student-answer-display {
  margin-left: 34px;
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
}

.answer-info {
  display: flex;
  align-items: center;
}

.answer-label {
  color: #666;
  font-weight: 500;
  margin-right: 8px;
}

.answer-value {
  color: #333;
}

.correct-answer {
  color: #52c41a;
  /* 绿色表示正确答案 */
  font-weight: 500;
}

.score-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #eee;
}

.score-input-group {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.score-label {
  font-size: 14px;
  color: #666;
}

.score-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.max-score {
  font-size: 14px;
  color: #999;
}

.save-score-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-score-btn:hover {
  background-color: #40a9ff;
}

.save-score-btn:disabled {
  background-color: #91d5ff;
  cursor: not-allowed;
  color: #fff;
}

.score-display {
  display: inline-block;
  width: 60px;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  color: #333;
  font-weight: 500;
}

.scored-status {
  font-size: 14px;
  color: #52c41a;
  font-weight: 500;
  margin-left: 10px;
}
.question-inline-image {
  display: inline-block;
  vertical-align: middle;
  max-width: 100%;
  height: auto;
  margin: 0 3px;
}
</style>