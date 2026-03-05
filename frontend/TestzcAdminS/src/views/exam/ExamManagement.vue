<template>
  <div class="exam-management">
    <div class="page-header-with-tabs">
      <h2 class="page-title">考试管理/{{ activeTab === 'list' ? '考试列表' : '派发记录' }}</h2>
      <div class="tabs tabs-top-left">
        <span
          class="tab-item"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >考试列表</span>
        <span
          class="tab-item"
          :class="{ active: activeTab === 'dispatch' }"
          @click="activeTab = 'dispatch'"
        >派发记录</span>
      </div>
    </div>

    <!-- 派发页面 -->
    <ExamDispatchPage v-if="activeTab === 'dispatch'" />

    <!-- 考试列表 -->
    <template v-if="activeTab === 'list'">
    <!-- 新增考试按钮（与搜索栏保持间距） -->
    <div class="add-exam-row">
      <button class="btn btn-add" @click="showAddModal">
        <span class="plus-icon">+</span> 新增考试
      </button>
    </div>
    <!-- 搜索区域 -->
    <div class="search-area-wrap">
      <div class="search-area">
        <div class="search-group">
          <label>考试名称</label>
          <input
            type="text"
            class="search-input"
            placeholder="请输入考试名称"
            v-model="searchInfo.searchWord"
          />
        </div>
        <div class="search-group">
          <label>派发状态</label>
          <select class="form-select" v-model="searchInfo.publishStatus">
            <option :value="null">全部</option>
            <option :value="0">未派发</option>
            <option :value="3">已派发</option>
          </select>
        </div>
        <div class="search-buttons">
          <button class="btn btn-primary" @click="search" :disabled="isLoading">查询</button>
          <button class="btn btn-secondary" @click="reset" :disabled="isLoading">重置</button>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>考试名称</th>
            <th>职业(工种)</th>
            <th>技能等级</th>
            <th>关联试卷名称</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>考试时长（分钟）</th>
            <th>考试模式</th>
            <th>考试类型</th>
            <th>派发状态</th>
            <th>考试人数（点击数字查看名单）</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(exam, index) in examList" :key="exam.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ exam.examName }}</td>
            <td>{{ exam.jobType || '-' }}</td>
            <td>{{ exam.level || '-' }}</td>
            <td>{{ getTeachExamName(exam) }}</td>
            <td>{{ exam.startTime || '-' }}</td>
            <td>{{ exam.endTime || '-' }}</td>
            <td>{{ exam.consume || '-' }}</td>
            <td>
              <span v-if="exam.examType === 'online'">线上</span>
              <span v-else-if="exam.examType === 'offline'">
                线下<span v-if="exam.location" class="location-text">（{{ exam.location }}）</span>
              </span>
              <span v-else>-</span>
            </td>
            <td>{{ getExamPurposeDisplay(exam) }}</td>
            <td>
              <span :class="getDispatchStatusClass(exam)">
                {{ getDispatchStatusName(exam) }}
              </span>
            </td>
            <td class="exam-count-cell">
              <a
                href="#"
                @click.prevent="goToApplicants(exam)"
                title="点击查看报名人员列表"
                class="exam-count-link"
              >
                {{ exam.registrationCount || 0 }}
              </a>
            </td>
            <td class="operations">
              <a href="#" class="edit-link" @click.prevent="showEditModal(exam)">编辑</a>
              <a
                v-if="exam.examType === 'online' && exam.publishStatus !== 3 && (isExamStationAdmin || isAdminOrManager)"
                href="#"
                class="distribute-link"
                @click.prevent="handleDistribute(exam)"
              >派发</a>
              <a href="#" class="delete-link" @click.prevent="showDeleteModal(exam)">删除</a>
            </td>
          </tr>
          <tr v-if="!isLoading && examList.length === 0">
            <td colspan="13" class="no-data">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <Pagination
      v-if="totalItems > 0"
      :total="totalItems"
      :current-page="currentPage"
      :page-size="pageSize"
      @change="onPageChange"
    />

    </template>

    <!-- 新增/编辑模态框 -->
    <div class="modal-overlay" v-if="isModalVisible">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditMode ? '编辑考试' : '新增考试' }}</h3>
          <button class="close-button" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="required">考试名称</label>
            <input
              type="text"
              class="form-input"
              v-model="currentExam.examName"
              placeholder="请输入考试名称"
            />
          </div>
          <div class="form-group">
            <label class="required">职业(工种)</label>
            <select class="form-select" v-model="currentExam.jobType" :disabled="isEditMode">
              <option value="">请选择职业(工种)</option>
              <option v-for="option in jobTypeOptions" :key="option.id" :value="option.name">
                {{ option.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="required">技能等级</label>
            <select class="form-select" v-model="currentExam.level" :disabled="isEditMode">
              <option value="">请选择技能等级</option>
              <option v-for="option in levelOptions" :key="option.id" :value="option.name">
                {{ option.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="required">考试用途</label>
            <select class="form-select" v-model.number="currentExam.ruleType" @change="onRuleTypeChange">
              <option :value="null">请选择</option>
              <option :value="0">职业认定</option>
              <option :value="1">竞赛</option>
            </select>
          </div>
          <div class="form-group">
            <label class="required">考试类型</label>
            <select class="form-select" v-model="currentExam.examType" :disabled="isEditMode">
              <option value="">请选择考试类型</option>
              <option value="online">线上</option>
              <option value="offline">线下</option>
            </select>
          </div>
          <div class="form-group" v-if="isAdminOrManager">
            <label class="required">所属考核站</label>
            <select class="form-select" v-model.number="currentExam.stationId" @change="onStationChange">
              <option :value="null">请选择考核站</option>
              <option v-for="s in examStations" :key="s.id" :value="s.id">{{ s.stationName || s.name }}</option>
            </select>
          </div>
          <div class="form-group" v-if="currentExam.examType === 'offline'">
            <label>考试地点</label>
            <input
              type="text"
              class="form-input"
              v-model="currentExam.location"
              placeholder="请输入考试地点"
              :disabled="isEditMode"
            />
          </div>
          <div class="form-group">
            <label class="required">试卷名称</label>
            <select class="form-select" v-model.number="currentExam.teachExamId" :disabled="isAdminOrManager && (currentExam.stationId == null || currentExam.stationId === '')">
              <option :value="null">请选择试卷</option>
              <option v-for="p in paperNameOptions" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
            <p v-if="isAdminOrManager && (currentExam.stationId == null || currentExam.stationId === '')" class="form-hint" style="margin:4px 0 0;">请先选择考核站后再选择试卷</p>
          </div>
          <div class="form-group">
            <label>开始时间</label>
            <input
              type="datetime-local"
              class="form-input"
              v-model="currentExam.startTime"
              :disabled="isEditMode"
            />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input
              type="datetime-local"
              class="form-input"
              v-model="currentExam.endTime"
              :disabled="isEditMode"
            />
          </div>
          <div class="form-group">
            <label>考试时长（分钟）</label>
            <input
              type="number"
              class="form-input"
              v-model.number="currentExam.consume"
              placeholder="请输入考试时长"
              :disabled="isEditMode"
            />
          </div>
          <div class="form-group">
            <label>考试描述</label>
            <textarea
              class="form-input"
              v-model="currentExam.description"
              placeholder="请输入考试描述"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal" :disabled="isSaving">取消</button>
          <button class="btn btn-primary" @click="saveExam" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div class="modal-overlay" v-if="isDeleteModalVisible" @mousedown.self="closeDeleteModal">
      <div class="modal-container delete-modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="close-button" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除考试 "{{ examToDelete?.examName }}" 吗？</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteModal" :disabled="isDeleting">取消</button>
          <button class="btn btn-danger" @click="deleteExamConfirmed" :disabled="isDeleting">
            {{ isDeleting ? '删除中...' : '删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 派发选择试卷模态框 -->
    <div class="modal-overlay" v-if="isDistributeModalVisible" @mousedown.self="closeDistributeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ examToDistribute?.examType === 'offline' ? '关联试卷' : '派发考试' }}</h3>
          <button class="close-button" @click="closeDistributeModal">&times;</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 15px;">{{ examToDistribute?.examType === 'offline' ? '确定要关联试卷到考试 "' : '确定要派发考试 "' }}{{ examToDistribute?.examName }}" 吗？{{ examToDistribute?.examType === 'offline' ? '关联后可以下载试卷。' : '派发后所有学生可开始考试。' }}</p>
          <div class="form-group" v-if="examToDistribute?.examType === 'offline'">
            <label class="required">选择试卷</label>
            <select class="form-select" v-model.number="selectedTeachExamId">
              <option :value="null">请选择试卷</option>
              <option v-for="paper in teachExamOptions" :key="paper.id" :value="paper.id">
                {{ paper.name || `试卷ID: ${paper.id}` }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDistributeModal" :disabled="isDistributing">取消</button>
          <button class="btn btn-primary" @click="confirmDistribute" :disabled="isDistributing">
            {{ isDistributing ? (examToDistribute?.examType === 'offline' ? '关联中...' : '派发中...') : (examToDistribute?.examType === 'offline' ? '确认关联' : '确认派发') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 下载试卷模态框 -->
    <div class="modal-overlay" v-if="isDownloadModalVisible" @mousedown.self="closeDownloadModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>下载试卷</h3>
          <button class="close-button" @click="closeDownloadModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>试卷Logo</label>
            <div
              class="logo-upload-area"
              @click="triggerLogoInput"
              @dragover.prevent
              @dragenter.prevent="isLogoDragOver = true"
              @dragleave.prevent="isLogoDragOver = false"
              @drop="handleLogoDrop"
              :class="{ 'drag-over': isLogoDragOver }"
            >
              <div v-if="!downloadSettings.logoUrl" class="logo-upload-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" />
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" />
                  <path d="M16 13H8" stroke="currentColor" stroke-width="2" />
                  <path d="M16 17H8" stroke="currentColor" stroke-width="2" />
                  <path d="M10 9H8" stroke="currentColor" stroke-width="2" />
                </svg>
                <p>点击或拖拽上传Logo</p>
                <p class="logo-hint">支持 JPG、PNG，建议尺寸 200x200px</p>
              </div>
              <div v-else class="logo-preview">
                <img :src="downloadSettings.logoUrl" alt="Logo预览" />
                <button class="remove-logo-btn" @click.stop="removeLogo">&times;</button>
              </div>
              <input ref="logoInput" type="file" accept="image/*" @change="handleLogoSelect" style="display: none" />
            </div>
          </div>
          <div class="form-group">
            <label>考试题名</label>
            <input
              type="text"
              class="form-input"
              v-model="downloadSettings.examTitle"
              placeholder="用于显示在试卷页眉及文件名"
            />
          </div>
          <div class="form-group">
            <label>试卷大小</label>
            <select class="form-select" v-model="downloadSettings.paperSize">
              <option value="A4">A4（含答案）</option>
              <option value="A3">A3（考核卷）</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDownloadModal" :disabled="isDownloading">取消</button>
          <button class="btn btn-primary" @click="confirmDownload" :disabled="isDownloading">
            {{ isDownloading ? '下载中...' : '确认下载' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 考试人员管理弹窗 -->
    <div class="modal-overlay" v-if="showApplicantsModal" @mousedown.self="closeApplicantsModal">
      <div class="modal-container modal-container--large" @click.stop>
        <div class="modal-header">
          <h3>考试人员管理 - {{ examForApplicants?.examName || '' }}</h3>
          <button class="close-button" @click="closeApplicantsModal">&times;</button>
        </div>
        <div class="modal-body modal-body--no-padding">
          <ExamApplicants
            v-if="examForApplicants?.id"
            :exam-id="examForApplicants.id"
            :exam-name="examForApplicants.examName"
            :exam-type="examForApplicants.examType"
            :rule-type="examForApplicants.ruleType"
            :embed-in-modal="true"
            :use-exam-id="true"
            @go-back="closeApplicantsModal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import ExamDispatchPage from "./ExamDispatchPage.vue";
import ExamApplicants from "@/views/teachExam/ExamApplicants.vue";
import Pagination from "@/components/Pagination.vue";
import {
  addExam,
  updateExam,
  deleteExam,
  getExamList,
  publishExam,
  distributeExam,
  getApplicantsByExamId,
} from "@/api/exam";
import { getDictionaryByType, getExamList as getTeachExamList, listPapersForExamRecord, exportExamWordA4Answer, exportExamWordA3WithGutter } from "@/api/user";
import { getAllExamStations } from "@/api/examStation";
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, isRole } from "@/constants/role";

const router = useRouter();

// 获取用户信息
const users = sessionStorage.getItem("user")
  ? JSON.parse(sessionStorage.getItem("user") || "{}")
  : {};

const isExamStationAdmin = computed(() => isRole(users.role, ROLE_EXAM_STATION_ADMIN));
const isAdminOrManager = computed(() => isRole(users.role, ROLE_MANAGER));

// 状态变量
const activeTab = ref("list"); // "list" | "dispatch"
const examList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const error = ref(null);

// 搜索参数
const searchInfo = ref({
  searchWord: "",
  publishStatus: null,
  offset: 0,
  limit: 10,
});

// 模态框状态
const isModalVisible = ref(false);
const isDeleteModalVisible = ref(false);
const isEditMode = ref(false);
const examToDelete = ref(null);
const currentExam = ref({
  examName: "",
  jobType: "",
  level: "",
  startTime: "",
  endTime: "",
  consume: null,
  description: "",
  examType: "offline", // 默认线下
  location: "",
  teachExamId: null,
  ruleType: null, // 考试用途：0-职业认定，1-竞赛
  stationId: null, // 所属考核站（仅管理/总管理新增或编辑时必填，Long）
});

// 考核站列表（管理/总管理新增或编辑考试时选择）
const examStations = ref([]);

// 新增/编辑考试时的试卷名称下拉选项（由 listPapersForExamRecord 接口加载）
const paperNameOptions = ref([]);

// 派发相关状态
const isDistributeModalVisible = ref(false);
const examToDistribute = ref(null);
const selectedTeachExamId = ref(null);
const isDistributing = ref(false);

// 下载相关状态
const isDownloadModalVisible = ref(false);
const examToDownload = ref(null);
const isDownloading = ref(false);
const downloadSettings = ref({
  examTitle: "",
  paperSize: "A4",
  logoUrl: "",
});
const isLogoDragOver = ref(false);
const logoInput = ref(null);

// 考试人员管理弹窗
const showApplicantsModal = ref(false);
const examForApplicants = ref(null);
const openApplicantsModal = (exam) => {
  examForApplicants.value = exam;
  showApplicantsModal.value = true;
};
const closeApplicantsModal = () => {
  showApplicantsModal.value = false;
  examForApplicants.value = null;
};

// 下拉选项数据
const jobTypeOptions = ref([]); // 职业(工种)选项
const levelOptions = ref([]); // 技能等级选项
const teachExamOptions = ref([]); // 试卷选项

// 方法
const fetchExamList = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    searchInfo.value.offset = (currentPage.value - 1) * pageSize.value;
    searchInfo.value.limit = pageSize.value;
    // 构建查询参数：如果是考核站管理员，则按考核站过滤
    const params = {
      ...searchInfo.value,
    };
    if (isExamStationAdmin.value && users.stationId) {
      params.stationId = users.stationId;
    }

    const response = await getExamList(params);
    // axios 返回的数据结构：response.data 是接口返回的 JSON
    // 根据控制台日志，数据结构是：response.data.data.list
    if (response.data && response.data.code === 200) {
      const data = response.data.data;
      if (data && data.list) {
        const rawList = Array.isArray(data.list) ? data.list : [];
        // 统一处理报名人数字段，默认使用后端聚合的 registrationCount
        let mappedList = rawList.map((exam) => ({
          ...exam,
          registrationCount:
            typeof exam.registrationCount === "number"
              ? exam.registrationCount
              : 0,
        }));

        // 如果是考核站管理员（role=4），则报名人数参考“考核成绩”里的总报名人数：
        // 按当前考核站在 t_students_exam_total 中的报名记录数量统计
        if (isExamStationAdmin.value && mappedList.length > 0) {
          try {
            const updatedList = await Promise.all(
              mappedList.map(async (exam) => {
                if (!exam.id) return exam;
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
                      registrationCount: resData.data.length,
                    };
                  }
                } catch (e) {
                  console.error(
                    "按考核站统计报名人数失败:",
                    exam.id,
                    e
                  );
                }
                return exam;
              })
            );
            mappedList = updatedList;
          } catch (stationErr) {
            console.error("更新考核站报名人数失败:", stationErr);
          }
        }

        examList.value = mappedList;
        totalItems.value = data.total || mappedList.length;
      } else {
        examList.value = [];
        totalItems.value = 0;
      }
    } else {
      ElMessage.error(response.data?.msg || "查询失败");
      examList.value = [];
      totalItems.value = 0;
    }
  } catch (err) {
    console.error('获取考试列表失败:', err);
    error.value = "查询失败: " + (err.message || "未知错误");
    ElMessage.error(error.value);
    examList.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
  }
};

const onPageChange = (page, size) => {
  currentPage.value = page;
  pageSize.value = size;
  fetchExamList();
};

const search = () => {
  currentPage.value = 1;
  fetchExamList();
};

const reset = () => {
  searchInfo.value = {
    searchWord: "",
    publishStatus: null,
    offset: 0,
    limit: 10,
  };
  currentPage.value = 1;
  fetchExamList();
};

const showAddModal = () => {
  isEditMode.value = false;
  currentExam.value = {
    examName: "",
    jobType: "",
    level: "",
    startTime: "",
    endTime: "",
    consume: null,
    description: "",
    examType: "offline",
    location: "",
    ruleType: null,
    teachExamId: null,
    stationId: null,
  };
  paperNameOptions.value = [];
  isModalVisible.value = true;
};

const showEditModal = async (exam) => {
  isEditMode.value = true;
  currentExam.value = {
    ...exam,
    stationId: exam.stationId != null ? Number(exam.stationId) : null,
  };
  // 转换时间格式为 datetime-local 格式
  if (currentExam.value.startTime) {
    currentExam.value.startTime = currentExam.value.startTime.replace(' ', 'T').substring(0, 16);
  }
  if (currentExam.value.endTime) {
    currentExam.value.endTime = currentExam.value.endTime.replace(' ', 'T').substring(0, 16);
  }
  isModalVisible.value = true;
  // 根据考试用途加载试卷列表，编辑时保留已选试卷
  await fetchPaperNameOptions(false);
};

const closeModal = () => {
  isModalVisible.value = false;
};

const saveExam = async () => {
  if (currentExam.value.ruleType !== 0 && currentExam.value.ruleType !== 1) {
    ElMessage.warning("请选择考试用途");
    return;
  }
  if (!currentExam.value.examType) {
    ElMessage.warning("请选择考试类型");
    return;
  }
  if (!currentExam.value.teachExamId) {
    ElMessage.warning("请选择试卷名称");
    return;
  }
  if (!currentExam.value.examName) {
    ElMessage.warning("请输入考试名称");
    return;
  }
  if (!currentExam.value.jobType) {
    ElMessage.warning("请选择职业(工种)");
    return;
  }
  if (!currentExam.value.level) {
    ElMessage.warning("请选择技能等级");
    return;
  }
  if (isAdminOrManager && (currentExam.value.stationId == null || currentExam.value.stationId === '')) {
    ElMessage.warning("请选择考核站");
    return;
  }

  isSaving.value = true;
  try {
    // 转换时间格式，并排除teachExamId字段（新增和编辑时不设置关联试卷）
    const examData = { ...currentExam.value };
    // 仅管理/总管理提交 stationId（Long）
    if (isAdminOrManager && examData.stationId != null && examData.stationId !== '') {
      examData.stationId = Number(examData.stationId);
    } else {
      delete examData.stationId;
    }
    // 试卷名称选中的 teachExamId 会一并提交；未选则传 null
    if (examData.startTime) {
      examData.startTime = examData.startTime.replace('T', ' ');
    }
    if (examData.endTime) {
      examData.endTime = examData.endTime.replace('T', ' ');
    }
    delete examData.registrationDeadline; // 已移除报名截止时间，提交时不传

    const response = isEditMode.value
      ? await updateExam(examData)
      : await addExam(examData);
    
    if (response.data.code === 200) {
      ElMessage.success(isEditMode.value ? "更新成功" : "新增成功");
      closeModal();
      fetchExamList();
    } else {
      ElMessage.error(response.data.msg || "保存失败");
    }
  } catch (err) {
    ElMessage.error("保存失败: " + (err.message || "未知错误"));
  } finally {
    isSaving.value = false;
  }
};

const showDeleteModal = (exam) => {
  examToDelete.value = exam;
  isDeleteModalVisible.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalVisible.value = false;
  examToDelete.value = null;
};

const deleteExamConfirmed = async () => {
  if (!examToDelete.value) return;
  
  isDeleting.value = true;
  try {
    const response = await deleteExam(examToDelete.value.id);
    if (response.data.code === 200) {
      ElMessage.success("删除成功");
      closeDeleteModal();
      fetchExamList();
    } else {
      ElMessage.error(response.data.msg || "删除失败");
    }
  } catch (err) {
    ElMessage.error("删除失败: " + (err.message || "未知错误"));
  } finally {
    isDeleting.value = false;
  }
};

const handlePublish = async (id) => {
  try {
    const response = await publishExam(id);
    if (response.data.code === 200) {
      ElMessage.success("发布成功");
      fetchExamList();
    } else {
      ElMessage.error(response.data.msg || "发布失败");
    }
  } catch (err) {
    ElMessage.error("发布失败: " + (err.message || "未知错误"));
  }
};

const handleDistribute = async (exam) => {
  // 管理员派发（role=5/6，status=1）：显示确认对话框后调用 API
  if (isRole(users.role, ROLE_MANAGER) && exam.publishStatus === 1) {
    try {
      await ElMessageBox.confirm(
        `确定要派发考试 "${exam.examName}" 吗？派发后等待考核站管理员进行最终派发。`,
        '管理员派发',
        {
          confirmButtonText: '确认派发',
          cancelButtonText: '取消',
          type: 'warning',
        }
      );
      // 用户确认后，调用 API
      const response = await distributeExam(exam.id, null);
      if (response.data.code === 200) {
        ElMessage.success(response.data.msg || "派发成功");
        fetchExamList();
      } else {
        ElMessage.error(response.data.msg || "派发失败");
      }
    } catch (err) {
      // 用户取消或 API 调用失败
      if (err === 'cancel') {
        // 用户取消，不显示错误
        return;
      }
      ElMessage.error("派发失败: " + (err.message || "未知错误"));
    }
    return;
  }
  
  // 考核站派发（role=4，status=2）：跳转到试卷选择和替换页面
  if (isExamStationAdmin.value && exam.publishStatus === 2) {
    // 跳转到试卷派发页面，传递考试信息
    router.push({
      path: `/exam-distribute/${exam.id}`,
      query: {
        examName: exam.examName,
        jobType: exam.jobType,
        level: exam.level,
      }
    });
    return;
  }
  
  // 其他情况（关联试卷）：显示模态框选择试卷
  examToDistribute.value = exam;
  selectedTeachExamId.value = null;
  isDistributeModalVisible.value = true;
};

const closeDistributeModal = () => {
  isDistributeModalVisible.value = false;
  examToDistribute.value = null;
  selectedTeachExamId.value = null;
};

const confirmDistribute = async () => {
  if (!examToDistribute.value) {
    return;
  }
  // 线下需选择试卷，线上使用新增时已选的试卷
  const teachExamId = examToDistribute.value.examType === 'offline'
    ? selectedTeachExamId.value
    : examToDistribute.value.teachExamId;
  if (examToDistribute.value.examType === 'offline' && !teachExamId) {
    ElMessage.warning("请选择试卷");
    return;
  }

  isDistributing.value = true;
  try {
    const response = await distributeExam(examToDistribute.value.id, teachExamId);
    if (response.data.code === 200) {
      ElMessage.success(response.data.msg || "派发成功");
      closeDistributeModal();
      fetchExamList();
    } else {
      ElMessage.error(response.data.msg || "派发失败");
    }
  } catch (err) {
    ElMessage.error("派发失败: " + (err.message || "未知错误"));
  } finally {
    isDistributing.value = false;
  }
};

// 下载相关逻辑
const showDownloadModal = (exam) => {
  if (!exam.teachExamId) {
    ElMessage.warning("请先派发并关联试卷后再下载");
    return;
  }
  examToDownload.value = exam;
  downloadSettings.value = {
    examTitle: exam.examName || "",
    paperSize: "A4",
    logoUrl: "",
  };
  isDownloadModalVisible.value = true;
};

const closeDownloadModal = () => {
  isDownloadModalVisible.value = false;
  examToDownload.value = null;
};

const confirmDownload = async () => {
  if (!examToDownload.value?.teachExamId) {
    ElMessage.warning("缺少关联试卷，无法下载");
    return;
  }
  isDownloading.value = true;
  try {
    const params = {
      paperId: examToDownload.value.teachExamId,
      logoUrl: downloadSettings.value.logoUrl || undefined,
      examTitle: downloadSettings.value.examTitle || examToDownload.value.examName || undefined,
    };
    const blob = downloadSettings.value.paperSize === "A4"
      ? await exportExamWordA4Answer(params)
      : await exportExamWordA3WithGutter({ ...params, paperSize: "A3" });

    const fileName = `${downloadSettings.value.examTitle || examToDownload.value.examName || "试卷"}-${examToDownload.value.jobType || ""}-${examToDownload.value.level || ""}.docx`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success("试卷下载成功");
    closeDownloadModal();
  } catch (error) {
    console.error("下载试卷失败:", error);
    ElMessage.error("下载试卷失败，请稍后重试");
  } finally {
    isDownloading.value = false;
  }
};

const triggerLogoInput = () => {
  logoInput.value?.click();
};

const handleLogoSelect = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    ElMessage.error("请选择图片文件");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error("图片大小不能超过2MB");
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    downloadSettings.value.logoUrl = event.target?.result || "";
  };
  reader.readAsDataURL(file);
};

const handleLogoDrop = (e) => {
  e.preventDefault();
  isLogoDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    handleLogoSelect({ target: { files: [file] } });
  }
};

const removeLogo = () => {
  downloadSettings.value.logoUrl = "";
};

const goToApplicants = (exam) => {
  // 跳转到报名人员管理页面，传递 examId
  if (!exam.id) {
    ElMessage.warning("缺少考试ID，无法查看报名人员");
    return;
  }
  console.log('点击报名人数，考试ID:', exam.id);
  // 通过 sessionStorage 传递参数，然后触发父组件跳转
  const params = {
    examId: exam.id,
    examName: exam.examName,
    examType: exam.examType,
    ruleType: exam.ruleType, // 考试用途：0-职业认定，1-竞赛
    fromExamManagement: true
  };
  sessionStorage.setItem('applicantsParams', JSON.stringify(params));
  // 单独设置标记，方便返回时检查
  sessionStorage.setItem('fromExamManagement', 'true');
  sessionStorage.setItem('showApplicantsFromExam', 'true');
  console.log('设置参数:', params);
  // 触发自定义事件通知 Main.vue 跳转
  const event = new CustomEvent('navigateToApplicants');
  console.log('触发事件: navigateToApplicants');
  window.dispatchEvent(event);
};

// 派发状态：publishStatus=3 已派发，其余未派发
const getDispatchStatusName = (exam) => {
  return exam.publishStatus === 3 ? "已派发" : "未派发";
};

const getDispatchStatusClass = (exam) => {
  const name = getDispatchStatusName(exam);
  return name === "已派发" ? "status-distributed" : "status-inactive";
};

const getStatusName = (status) => {
  const statusMap = {
    0: "未发布",
    1: "已发布",
    2: "已派发",
  };
  return statusMap[status] || "未知";
};

const getStatusClass = (status) => {
  const classMap = {
    0: "status-inactive",
    1: "status-active",
    2: "status-distributed",
  };
  return classMap[status] || "";
};

// 考试用途显示：0-职业认定，1-竞赛（优先 ruleType，兼容 examPurpose/paperPurpose）
const getExamPurposeDisplay = (exam) => {
  const rt = exam.ruleType;
  if (rt === 0 || rt === "0") return "职业认定";
  if (rt === 1 || rt === "1") return "竞赛";
  return exam.examPurpose || exam.paperPurpose || "-";
};

// 获取试卷名称：优先使用后端返回的名称，其次从试卷列表中匹配，不显示ID
const getTeachExamName = (exam) => {
  if (!exam || !exam.teachExamId) {
    return "-";
  }
  // 后端如果已经返回了名称字段，直接用
  if (exam.teachExamName) {
    return exam.teachExamName;
  }
  // 否则从试卷下拉选项中匹配（兼容 id 数字/字符串）
  const examId = Number(exam.teachExamId);
  const paper = teachExamOptions.value.find(
    (p) => Number(p.id) === examId
  );
  if (paper && (paper.name || paper.examTitle)) {
    return paper.name || paper.examTitle || "-";
  }
  return "-";
};

// 获取职业(工种)选项
const fetchJobTypeOptions = async () => {
  try {
    const response = await getDictionaryByType({ type: 0 });
    if (response && response.code === 200 && response.data) {
      jobTypeOptions.value = response.data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code
      }));
    }
  } catch (err) {
    console.error("获取职业(工种)选项失败:", err);
  }
};

// 获取技能等级选项
const fetchLevelOptions = async () => {
  try {
    const response = await getDictionaryByType({ type: 1 });
    if (response && response.code === 200 && response.data) {
      levelOptions.value = response.data
        .filter(item => item.name !== "职业道德")
        .map(item => ({
          id: item.id,
          name: item.name,
          code: item.code
        }));
    }
  } catch (err) {
    console.error("获取技能等级选项失败:", err);
  }
};

// 获取试卷列表（仅显示审核通过的试卷，用于派发弹框等）
const fetchTeachExamOptions = async () => {
  try {
    const searchInfo = {
      offset: 0,
      limit: 1000, // 获取足够多的试卷
      auditStatus: 1, // 只查询审核通过的试卷
    };
    const response = await getTeachExamList(searchInfo);
    if (response && response.code === 200 && response.data) {
      const list = response.data.list || [];
      // 再次在前端做一层保护性过滤，确保只展示审核通过的试卷
      teachExamOptions.value = list.filter(
        (paper) => paper.auditStatus === 1
      );
    }
  } catch (err) {
    console.error("获取试卷列表失败:", err);
  }
};

// 根据考试用途获取新增/编辑考试时的试卷列表（listPapersForExamRecord）
// 管理/总管理：须先选考核站，stationId 用表单所选 currentExam.stationId；其他角色竞赛时用 user.stationId
// clearTeachExamId: 为 true 时清空已选试卷（用户切换考试用途/考核站时），编辑回显时为 false
const fetchPaperNameOptions = async (clearTeachExamId = true) => {
  const rt = currentExam.value.ruleType;
  if (rt !== 0 && rt !== 1) {
    paperNameOptions.value = [];
    if (clearTeachExamId) currentExam.value.teachExamId = null;
    return;
  }
  const params = { ruleType: rt };
  if (isAdminOrManager) {
    const sid = currentExam.value.stationId;
    if (sid == null || sid === "" || sid === undefined) {
      paperNameOptions.value = [];
      if (clearTeachExamId) currentExam.value.teachExamId = null;
      return;
    }
    params.stationId = Number(sid);
  } else if (rt === 1) {
    const sid = users.stationId;
    if (sid == null || sid === "" || sid === undefined) {
      ElMessage.warning("当前用户未关联考核站，无法加载竞赛试卷");
      paperNameOptions.value = [];
      if (clearTeachExamId) currentExam.value.teachExamId = null;
      return;
    }
    params.stationId = Number(sid);
  }
  try {
    const response = await listPapersForExamRecord(params);
    if (response && response.code === 200 && response.data) {
      const list = Array.isArray(response.data) ? response.data : (response.data?.list || []);
      paperNameOptions.value = list.map((p) => ({ id: p.id, name: p.name || p.examTitle || `试卷${p.id}` }));
    } else {
      paperNameOptions.value = [];
    }
    if (clearTeachExamId) currentExam.value.teachExamId = null;
  } catch (err) {
    console.error("获取试卷列表失败:", err);
    paperNameOptions.value = [];
    if (clearTeachExamId) currentExam.value.teachExamId = null;
  }
};

// 用户手动切换考试用途时，重新拉取试卷列表并清空已选试卷
const onRuleTypeChange = () => {
  fetchPaperNameOptions(true);
};

// 管理/总管理切换所属考核站时，重新拉取试卷列表并清空已选试卷
const onStationChange = () => {
  fetchPaperNameOptions(true);
};

// 获取考核站列表（管理/总管理新增或编辑考试时使用）
const fetchExamStations = async () => {
  if (!isAdminOrManager) return;
  try {
    const res = await getAllExamStations();
    const data = res?.data;
    if (data && data.code === 200 && data.data) {
      examStations.value = Array.isArray(data.data) ? data.data : (data.data.list || []);
    } else {
      examStations.value = [];
    }
  } catch (err) {
    console.error("获取考核站列表失败:", err);
    examStations.value = [];
  }
};

// 生命周期
onMounted(() => {
  fetchExamList();
  fetchJobTypeOptions();
  fetchLevelOptions();
  fetchTeachExamOptions();
  fetchExamStations();
});
</script>

<style scoped>
.exam-management {
  padding: 20px;
}

.page-header-with-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header-with-tabs .page-title {
  margin: 0;
}

.tabs {
  display: flex;
  gap: 8px;
}

/* 考试列表、派发按钮固定在右上角（红色框区域） */
.tabs-top-right {
  margin-left: auto;
}

.tabs .tab-item {
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

.tabs .tab-item:hover {
  color: #c70019;
}

.tabs .tab-item.active {
  color: #c70019;
  font-weight: 500;
  background: #fff1f0;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.add-exam-row {
  margin-bottom: 20px;
}

.search-area-wrap {
  margin-bottom: 20px;
}

.search-area {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-group label {
  min-width: 80px;
}

.search-input,
.form-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
}

.search-buttons {
  display: flex;
  gap: 10px;
}


.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #409eff;
  color: white;
}

.btn-secondary {
  background-color: #909399;
  color: white;
}

.btn-add {
  background-color: #67c23a;
  color: white;
}

.btn-danger {
  background-color: #f56c6c;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f5f7fa;
  font-weight: bold;
}

.operations {
  white-space: nowrap;
}

.operations a {
  margin-right: 10px;
  color: #409eff;
  text-decoration: none;
}

.operations a:hover {
  text-decoration: underline;
}

.delete-link {
  color: #f56c6c !important;
}

.download-link {
  color: #67c23a !important;
}

.logo-upload-area {
  position: relative;
  width: 100%;
  min-height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.logo-upload-area:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.logo-upload-area.drag-over {
  border-color: #409eff;
  background-color: #e6f7ff;
}

.logo-upload-placeholder {
  text-align: center;
  color: #666;
}

.logo-upload-placeholder p {
  margin: 4px 0;
  font-size: 14px;
}

.logo-hint {
  font-size: 12px;
  color: #999;
}

.logo-preview {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-preview img {
  max-width: 100%;
  max-height: 120px;
  border-radius: 4px;
}

.remove-logo-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background-color: #ff4d4f;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-logo-btn:hover {
  background-color: #ff7875;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 15px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-container--large {
  max-width: 95%;
  width: 95%;
  max-height: 90vh;
}

.modal-body--no-padding {
  padding: 0;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group label.required::after {
  content: " *";
  color: red;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #409eff;
}

.status-active {
  color: #67c23a;
}

.status-inactive {
  color: #909399;
}

.status-distributed {
  color: #409eff;
}

.location-text {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

.data-table td.exam-count-cell {
  text-align: center;
}

.exam-count-link {
  color: #409eff;
  text-decoration: none;
}

.exam-count-link:hover {
  text-decoration: underline;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #909399;
}
</style>

