<template>
    <div class="paper-management">
        <!-- 手动组卷全页面模式 -->
        <ManualPaperPage v-if="showManualPaperPage" :positionOptions="positionOptions" :levelOptions="levelOptions"
            :isEditMode="isEditMode" :editPaperData="editPaperData" :editQuestions="editQuestions"
            @goBack="goBackToList" @paperSaved="handlePaperSaved" />

        <!-- 自动组卷模态框 -->
        <AutoPaperModal :visible="isAutoPaperModalVisible" :isEditMode="isEditMode" :editData="editPaperData"
            :positionOptions="positionOptions" :levelOptions="levelOptions" @close="closeAutoPaperModal"
            @saved="handleAutoPaperSaved" />

        <!-- 原有的组卷管理页面 -->
        <div v-if="!showManualPaperPage">
            <h2 class="page-title">组卷管理</h2>

            <template v-if="!showPaperDetail">
                <!-- 搜索和筛选区域 -->
                <div class="search-filter-section">
                    <div class="filter-controls">
                        <div class="filter-groups">
                            <div class="filter-group">
                                <label class="filter-label">组卷类型：</label>
                                <select v-model="selectedExamType" @change="handleExamTypeChange" class="filter-select">
                                    <option value="">全部</option>
                                    <option value="1">自动组卷</option>
                                    <option value="2">手动组卷</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">职业(工种)：</label>
                                <select v-model="selectedJobType" @change="handleJobTypeChange" class="filter-select">
                                    <option value="">全部</option>
                                    <option v-for="option in positionOptions" :key="option.id" :value="option.name">
                                        {{ option.name }}
                                    </option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">技能等级：</label>
                                <select v-model="selectedLevel" @change="handleLevelChange" class="filter-select">
                                    <option value="">全部</option>
                                    <option v-for="option in levelOptions" :key="option.id" :value="option.name">
                                        {{ option.name }}
                                    </option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">审核状态：</label>
                                <select v-model="selectedAuditStatus" @change="handleAuditStatusChange" class="filter-select">
                                    <option value="">全部</option>
                                    <option value="0">待审核</option>
                                    <option value="1">审核通过</option>
                                    <option value="2">审核驳回</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">派发状态：</label>
                                <select v-model="selectedStatus" @change="handleStatusChange" class="filter-select">
                                    <option value="">全部</option>
                                    <option value="0">未派发</option>
                                    <option value="1">已派发</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">创建时间：</label>
                                <input type="date" v-model="createTime" class="filter-input filter-date" />
                            </div>
                        </div>
                        <div class="filter-buttons">
                            <button class="btn btn-search" @click="applyFilters">查询</button>
                            <button class="btn btn-reset" @click="resetFilters">重置</button>
                        </div>
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="action-buttons">
                    <button class="btn btn-add" v-if="isQuestionExpert" @click="showAutoPaperModal">
                        <span class="plus-icon">+</span> 自动组卷
                    </button>
                    <button class="btn btn-manual" v-if="isQuestionExpert" @click="showManualAddModal">
                        <span class="plus-icon">+</span> 手动组卷
                    </button>
                    <button class="btn btn-dispatch" v-if="canBatchDispatch" @click="showMultiDispatchModal"
                        :disabled="selectedPapers.length === 0">
                        批量派发
                        <span v-if="selectedPapers.length > 0">({{ selectedPapers.length }})</span>
                    </button>
                </div>

                <!-- 加载状态 -->
                <div v-if="isLoading" class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>加载中...</p>
                </div>

                <!-- 错误信息 -->
                <div v-else-if="error" class="error-message">
                    {{ error }}
                    <button class="btn btn-primary retry-btn" @click="fetchPapers">重试</button>
                </div>

                <!-- 数据表格 -->
                <div v-else class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th width="40">
                                    <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll"
                                        class="checkbox" />
                                </th>
                                <th>序号</th>
                                <th>名称</th>
                                <th>考试ID</th>
                                <th>试卷用途</th>
                                <th>职业(工种)</th>
                                <th>技能等级</th>
                                <th>创建人</th>
                                <th>考核站</th>
                                <th>创建时间</th>
                                <th>审核状态</th>
                                <th>派发状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(paper, index) in paginatedPapers" :key="index">
                                <td>
                                    <input type="checkbox" :checked="isPaperSelected(paper)"
                                        @change="togglePaperSelection(paper)" class="checkbox" />
                                </td>
                                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                                <td>{{ paper.name }}</td>
                                <td>{{ paper.id }}</td>
                                <td>{{ formatRuleType(paper.ruleType ?? paper.paperPurpose) }}</td>
                                <td>{{ paper.jobType }}</td>
                                <td>{{ paper.level }}</td>
                                <td>{{ paper.createAccount || '—' }}</td>
                                <td>{{ getStationName(paper.stationId) }}</td>
                                <td>{{ formatDateTime(paper.createTime) }}</td>
                                <td>
                                    <span
                                        :class="[getAuditStatusClass(paper.auditStatus), { 'audit-status-clickable': canViewAuditRemark && (paper.auditStatus === 1 || paper.auditStatus === 2) }]"
                                        @click="canViewAuditRemark && (paper.auditStatus === 1 || paper.auditStatus === 2) ? handleAuditStatusClick(paper) : null"
                                    >{{ getAuditStatusText(paper.auditStatus) }}</span>
                                </td>
                                <td>
                                    <span :class="paper.status === 1 ? 'status-dispatched' : 'status-not-dispatched'">{{
                                        paper.status ===
                                            1
                                            ? '已派发' : '未派发' }}</span>
                                </td>
                                <td class="operations">
                                    <a href="#" class="view-link" @click.prevent="viewPaper(paper)">查看</a>
                                    <a href="#" class="download-link" v-if="canDownload" @click.prevent="showDownloadModal(paper)">下载</a>
                                    <a href="#" class="audit-link" v-if="isReviewExpert && paper.auditStatus === 0"
                                        @click.prevent="openAuditDialog(paper, 'approve')">审核</a>
                                    <a href="#" class="delete-link" v-if="isQuestionExpert && (paper.canDelete === true || paper.canDelete === 'true')" @click.prevent="deletePaper(paper)">删除</a>
                                </td>
                            </tr>
                            <tr v-if="paginatedPapers.length === 0">
                                <td colspan="12" class="no-data">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 分页控件 -->
                <Pagination
                    v-if="!isLoading && !error && totalItems > 0"
                    :total="totalItems"
                    :current-page="currentPage"
                    :page-size="pageSize"
                    @change="onPageChange"
                />
            </template>
            <template v-else>
                <!-- 使用PaperDetailView组件显示试卷详情 -->
                <PaperDetailView :paperDetail="currentPaperDetail" @goBack="goBackToPaperList" />
            </template>
        </div>

        <!-- 下载设置模态框 -->
        <el-dialog title="下载设置" v-model="isDownloadModalVisible" width="500px" :close-on-click-modal="false"
            :close-on-press-escape="false" :show-close="false" destroy-on-close>
            <div class="modal-body">
                <!-- 试卷大小选择（放在最上面） -->
                <div class="form-row">
                    <label>试卷大小</label>
                    <div class="form-control">
                        <div class="paper-size-simple">
                            <label class="size-option-simple">
                                <el-radio v-model="downloadSettings.paperSize" value="A4">A4 (答案卷)</el-radio>
                            </label>
                            <label class="size-option-simple">
                                <el-radio v-model="downloadSettings.paperSize" value="A3">A3 (考核卷)</el-radio>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Logo上传 -->
                <div class="form-row">
                    <label>试卷Logo</label>
                    <div class="form-control">
                        <div class="logo-upload-area" @click="triggerLogoInput" @drop="handleLogoDrop" @dragover.prevent
                            @dragenter.prevent :class="{ 'drag-over': isLogoDragOver }">
                            <div v-if="!downloadSettings.logoUrl" class="logo-upload-placeholder">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                                        stroke="currentColor" stroke-width="2" />
                                    <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" />
                                    <path d="M16 13H8" stroke="currentColor" stroke-width="2" />
                                    <path d="M16 17H8" stroke="currentColor" stroke-width="2" />
                                    <path d="M10 9H8" stroke="currentColor" stroke-width="2" />
                                </svg>
                                <p>点击或拖拽上传Logo</p>
                                <p class="logo-hint">支持 JPG、PNG 格式，建议尺寸 200x200px</p>
                            </div>
                            <div v-else class="logo-preview">
                                <img :src="downloadSettings.logoUrl" alt="Logo预览" />
                                <button class="remove-logo-btn" @click="removeLogo">&times;</button>
                            </div>
                            <input ref="logoInput" type="file" accept="image/*" @change="handleLogoSelect"
                                style="display: none" />
                        </div>
                    </div>
                </div>

                <!-- A3 时显示：试卷页眉（在 Logo 下面） -->
                <div class="form-row" v-if="downloadSettings.paperSize === 'A3'">
                    <label>试卷页眉 <span class="required">*</span></label>
                    <div class="form-control">
                        <el-input v-model="downloadSettings.header" placeholder="请输入试卷页眉" />
                    </div>
                </div>

                <!-- 试卷标题（选 A3 时为必填） -->
                <div class="form-row">
                    <label>试卷标题 <span class="required" v-if="downloadSettings.paperSize === 'A3'">*</span></label>
                    <div class="form-control">
                        <el-input v-model="downloadSettings.examTitle" placeholder="请输入试卷标题，如：2024年技能等级考试" />
                    </div>
                </div>

                <!-- A3 时显示：试卷副标题 -->
                <div class="form-row" v-if="downloadSettings.paperSize === 'A3'">
                    <label>试卷副标题 <span class="required">*</span></label>
                    <div class="form-control">
                        <el-input v-model="downloadSettings.subtitle" placeholder="请输入试卷副标题" />
                    </div>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="closeDownloadModal">取 消</el-button>
                    <el-button type="primary" @click="confirmDownload" :loading="isDownloading">
                        确 定
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 审核弹窗（审卷专家） -->
        <el-dialog :title="auditDialogTitle" v-model="auditDialogVisible" width="520px" :close-on-click-modal="false"
            :close-on-press-escape="false" destroy-on-close>
            <div class="audit-dialog">
                <div class="audit-mode">
                    <label>{{ auditDialogType === 'exam' ? '审核结果' : '删除审批结果' }}</label>
                    <el-radio-group v-model="auditDialogAction" size="default">
                        <el-radio label="approve">通过</el-radio>
                        <el-radio label="reject">驳回</el-radio>
                    </el-radio-group>
                </div>

                <div class="audit-remark-block">
                    <label>{{ auditRemarkLabel }}<span class="required" v-if="auditRemarkRequired">*</span></label>
                    <textarea class="audit-remark-input" v-model="auditRemark"
                        :placeholder="auditRemarkPlaceholder" rows="3"></textarea>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="closeAuditDialog">取 消</el-button>
                    <el-button type="primary" :loading="isAuditSubmitting" @click="confirmAuditAction">
                        确认提交
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 单个派发模态框 -->
        <div class="modal-overlay" v-if="isDispatchModalVisible" @mousedown.self="closeDispatchModal">
            <div class="modal-container" @click.stop>
                <div class="modal-header">
                    <h3>派发试卷</h3>
                    <button class="close-btn" @click="closeDispatchModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <label>考试日期</label>
                        <div class="date-time-inputs">
                            <div class="form-control" style="margin-right: 10px; min-width: 240px;">
                                <label class="small-label">考试题名</label>
                                <input type="text" class="form-input" v-model="dispatchData.name" placeholder="请输入考试题名" />
                            </div>
                            <div class="date-time-group">
                                <label class="small-label">开始日期</label>
                                <input type="datetime-local" class="form-input" v-model="dispatchData.startTime" />
                            </div>
                            <div class="date-time-group">
                                <label class="small-label">结束日期</label>
                                <input type="datetime-local" class="form-input"
                                    :class="{ 'input-error': dateValidationError }" v-model="dispatchData.endTime" />
                            </div>
                            <div v-if="dateValidationError" class="validation-error">{{ dateValidationError }}</div>
                        </div>
                    </div>

                    <div class="form-row">
                        <label>考试时长</label>
                        <div class="form-control number-input-container">
                            <input type="number" class="form-input number-input" v-model="dispatchData.duration" />
                            <span class="unit">分钟</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeDispatchModal">取消</button>
                    <button class="btn btn-primary" @click="dispatchPaper" :disabled="isDispatching">{{ isDispatching ?
                        '派发中...'
                        :
                        '确定' }}</button>
                </div>
            </div>
        </div>

        <!-- 批量派发模态框 -->
        <div class="modal-overlay" v-if="isMultiDispatchModalVisible" @mousedown.self="closeMultiDispatchModal">
            <div class="modal-container" @click.stop>
                <div class="modal-header">
                    <h3>批量派发试卷 ({{ selectedPapers.length }}份)</h3>
                    <button class="close-btn" @click="closeMultiDispatchModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="selected-papers-list">
                        <div class="selected-papers-header">已选试卷：</div>
                        <div class="selected-papers-container">
                            <div v-for="(paper, index) in selectedPapers" :key="index" class="selected-paper-item">
                                <span class="paper-info">{{ paper.jobType }} - {{ paper.level }}</span>
                                <span class="paper-status"
                                    :class="paper.status === 1 ? 'status-dispatched' : 'status-not-dispatched'">
                                    {{ paper.status === 1 ? '已派发' : '未派发' }}
                                </span>
                                <button class="remove-btn" @click="removePaperFromSelection(paper)">&times;</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-row" v-if="canBatchDispatch && !isExamStationAdmin">
                        <label class="required">考核站</label>
                        <el-select
                            v-model="multiDispatchData.stationId"
                            filterable
                            clearable
                            placeholder="请选择考核站（可搜索）"
                            class="dispatch-select-large"
                            popper-class="dispatch-select-popper"
                            @change="onMultiDispatchStationChange"
                        >
                            <el-option
                                v-for="s in examStations"
                                :key="s.id"
                                :label="s.stationName"
                                :value="s.id"
                            />
                        </el-select>
                    </div>
                    <div class="form-row">
                        <label class="required">试卷申请</label>
                        <el-select
                            v-model="multiDispatchData.batchApplicationId"
                            filterable
                            clearable
                            placeholder="请先选择考核站，再选择试卷申请（未派发）"
                            class="dispatch-select-large"
                            popper-class="dispatch-select-popper"
                            :disabled="!multiDispatchData.stationId"
                        >
                            <el-option
                                v-for="a in paperApplicationsForDispatch"
                                :key="a.id"
                                :label="'年度 ' + (a.year ?? a.applicationYear ?? '-') + (a.createTime ? ' (' + a.createTime + ')' : '')"
                                :value="String(a.id)"
                            />
                        </el-select>
                    </div>
                    <div class="form-row">
                        <label>考试时长</label>
                        <div class="form-control number-input-container">
                            <input type="number" class="form-input number-input" v-model="multiDispatchData.duration" />
                            <span class="unit">分钟</span>
                        </div>
                    </div>

                    <div class="form-row">
                        <label>考试日期</label>
                        <div class="date-time-inputs">
                            <div class="date-time-group">
                                <label class="small-label">开始日期</label>
                                <input type="datetime-local" class="form-input" v-model="multiDispatchData.startTime" />
                            </div>
                            <div class="date-time-group">
                                <label class="small-label">结束日期</label>
                                <input type="datetime-local" class="form-input"
                                    :class="{ 'input-error': multiDateValidationError }"
                                    v-model="multiDispatchData.endTime" />
                            </div>
                            <div v-if="multiDateValidationError" class="validation-error">{{ multiDateValidationError }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeMultiDispatchModal">取消</button>
                    <button class="btn btn-primary" @click="dispatchMultiplePapers" :disabled="isMultiDispatching">{{
                        isMultiDispatching ? '派发中...' : '确定' }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
    distributeExam,
    deleteExam,
    getExamList,
    getAllClasses,
    getDictionaryByType,
    exportExamWordNew,
    getExamById,
    exportExamWordA4Answer,
    exportExamWordA3,
    exportExamWordA3WithGutter,
    testA3Export as testA3ExportApi,
    submitExamForAudit,
    auditExam,
    submitExamDeleteApproval,
    auditExamDeleteApproval
} from "@/api/user";
import { getAllExamStations } from "@/api/examStation";
import { getPaperApplications } from "@/api/paperApplication";
import { batchDistribution } from "@/api/teachExam";
import { ElMessage, ElMessageBox } from "element-plus";
import Pagination from "@/components/Pagination.vue";
import ManualPaperPage from "./ManualPaperPage.vue";
import PaperDetailView from "./PaperDetailView.vue";
import AutoPaperModal from "./AutoPaperModal.vue";
import { ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, ROLE_REVIEW_EXPERT, isRole, toRoleNumber } from "@/constants/role";

// 从sessionStorage获取选项数据
const getOptionsFromStorage = (key, defaultOptions = []) => {
    try {
        const storedData = sessionStorage.getItem(key);
        return storedData ? JSON.parse(storedData) : defaultOptions;
    } catch (error) {
        console.error(`获取${key}数据失败:`, error);
        return defaultOptions;
    }
};

// 年级、专业和班级选项
const gradeOptions = ref(getOptionsFromStorage("gradeOptions", []));
const majorOptions = ref(getOptionsFromStorage("majorOptions", []));
const classOptions = ref(getOptionsFromStorage("classOptions", []));
const positionOptions = ref([]); // 职业(工种)
const levelOptions = ref([]); // 技能等级选项
const examStations = ref([]); // 考核站选项
const loadingExamStations = ref(false);

// 状态变量
const isSaving = ref(false);
const isDispatching = ref(false);
const isMultiDispatching = ref(false);
const isLoading = ref(true);
const error = ref(null);

// 获取当前用户信息
const getCurrentUser = () => {
  const userStr = sessionStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : {};
};

// 当前用户信息
const currentUser = ref(getCurrentUser());

const isExamStationAdmin = computed(() => isRole(currentUser.value.role, ROLE_EXAM_STATION_ADMIN));
const canBatchDispatch = computed(() => isRole(currentUser.value.role, ROLE_MANAGER));
const canDownload = computed(() => {
  const r = toRoleNumber(currentUser.value.role);
  return r === ROLE_EXAM_STATION_ADMIN || r === ROLE_MANAGER || r === ROLE_REVIEW_EXPERT;
});
const isQuestionExpert = computed(() => {
  const r = toRoleNumber(currentUser.value.role);
  return r === ROLE_EXAM_STATION_ADMIN || r === ROLE_MANAGER;
});
const isReviewExpert = computed(() => isRole(currentUser.value.role, ROLE_REVIEW_EXPERT));
const canViewAuditRemark = computed(() => {
  const r = toRoleNumber(currentUser.value.role);
  return r === ROLE_MANAGER || r === ROLE_REVIEW_EXPERT;
});

const selectedClassInfo = ref(null);

// 试卷数据
const papers = ref([]);

// 搜索和分页
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

// 筛选相关变量
const selectedExamType = ref(""); // 选中的组卷类型
const selectedJobType = ref(""); // 选中的职业(工种)
const selectedLevel = ref(""); // 选中的技能等级
const selectedAuditStatus = ref(""); // 审核状态：0待审核 1审核通过 2审核驳回
const selectedStatus = ref(""); // 派发状态：0未派发 1已派发
const createTime = ref(""); // 创建时间

// 题目详情二级页相关状态
const showPaperDetail = ref(false);
const currentPaperDetail = ref(null);

// 手动组卷全页面模式状态
const showManualPaperPage = ref(false);

// 模态框状态
const isEditMode = ref(false);
const isAutoPaperModalVisible = ref(false); // 新增：自动组卷模态框状态

// 编辑相关状态
const editPaperData = ref(null);
const editQuestions = ref([]);

// 当前编辑的试卷
const currentPaper = ref({
    id: null,
    teachId: "",
    level: null,
    jobType: "",
    desc: ""
});

// 下载设置模态框状态
const isDownloadModalVisible = ref(false);
const downloadSettings = ref({
    logoUrl: "",
    examTitle: "",
    paperSize: "A4",
    header: "",   // A3 时必填
    subtitle: ""  // A3 时必填
});
const currentDownloadPaper = ref(null);
const isDownloading = ref(false);
const isLogoDragOver = ref(false);
const logoInput = ref(null);

// 派发相关状态变量
const isDispatchModalVisible = ref(false);
const isMultiDispatchModalVisible = ref(false);
const currentDispatchPaper = ref(null);
const dispatchData = ref({
    name: "",
    startTime: "",
    endTime: "",
    duration: 60
});
const multiDispatchData = ref({
    stationId: "",
    batchApplicationId: "",
    startTime: "",
    endTime: "",
    duration: 60
});
const paperApplicationsForDispatch = ref([]);
const dateValidationError = ref("");
const multiDateValidationError = ref("");

// 审核 / 删除审批弹窗相关状态
const auditDialogVisible = ref(false);
// exam | delete
const auditDialogType = ref("exam");
// approve | reject
const auditDialogAction = ref("approve");
const auditRemark = ref("");
const isAuditSubmitting = ref(false);
const currentAuditPaper = ref(null);

const auditDialogTitle = computed(() => {
    return auditDialogType.value === "exam" ? "审核试卷" : "删除审批";
});
// 审核备注标签：试卷审核且驳回时显示「不通过原因」，否则「审核备注」/「删除审批备注」
const auditRemarkLabel = computed(() => {
    if (auditDialogType.value === "exam" && auditDialogAction.value === "reject") return "不通过原因";
    return auditDialogType.value === "exam" ? "审核备注" : "删除审批备注";
});
// 驳回时必填不通过原因，通过时选填；删除审批保持必填
const auditRemarkRequired = computed(() => {
    if (auditDialogType.value === "exam") return auditDialogAction.value === "reject";
    return true;
});
const auditRemarkPlaceholder = computed(() => {
    if (auditDialogType.value === "exam" && auditDialogAction.value === "reject") return "请输入不通过原因（必填）";
    if (auditDialogType.value === "exam") return "请输入审核备注（选填）";
    return "请输入删除审批备注（必填）";
});

// 选中的试卷
const selectedPapers = ref([]);

// 选中的题目
const selectedQuestions = ref([]);

// 题目分数
const questionScores = ref({});

// 题型配置
const questionTypes = ref([
    { name: "填空题", count: 0, score: 0 },
    { name: "单项选择题", count: 0, score: 0 },
    { name: "多项选择题", count: 0, score: 0 },
    { name: "判断题", count: 0, score: 0 },
    { name: "简答题", count: 0, score: 0 },
    { name: "综合题", count: 0, score: 0 }
]);

// 分页显示的试卷
const paginatedPapers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return papers.value.slice(start, end);
});

// 是否全选
const isAllSelected = computed(() => {
    return paginatedPapers.value.length > 0 && selectedPapers.value.length === paginatedPapers.value.length;
});

// 显示的页码
const displayedPages = computed(() => {
    const pages = [];
    const total = totalPages.value;
    const current = currentPage.value;

    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    } else {
        if (current <= 4) {
            for (let i = 1; i <= 5; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(total);
        } else if (current >= total - 3) {
            pages.push(1);
            pages.push('...');
            for (let i = total - 4; i <= total; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            pages.push('...');
            for (let i = current - 1; i <= current + 1; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(total);
        }
    }

    return pages;
});

// 获取试卷列表
const fetchPapers = async () => {
    isLoading.value = true;
    error.value = null;

    try {
        const searchInfo = {
            name: "", // 可以添加搜索功能
            offset: (currentPage.value - 1) * pageSize.value, // 计算偏移量
            limit: pageSize.value,
            examType: selectedExamType.value || undefined,
            jobType: selectedJobType.value || undefined, // 职业(工种)，与接口返回字段一致
            level: selectedLevel.value || undefined, // 技能等级
            auditStatus: selectedAuditStatus.value !== "" ? Number(selectedAuditStatus.value) : undefined,
            status: selectedStatus.value !== "" ? Number(selectedStatus.value) : undefined,
            createTimeEnd: createTime.value || undefined,
            // 仅考核站管理员(4)按考核站过滤；审卷专家(8)不按考核站过滤，看全部
            stationId:
                isRole(currentUser.value.role, ROLE_EXAM_STATION_ADMIN) && currentUser.value.stationId
                    ? Number(currentUser.value.stationId)
                    : undefined
        };

        const response = await getExamList(searchInfo);

        if (response && response.code === 200) {
            papers.value = response.data.list || [];
            totalItems.value = response.data.total || 0;
        } else {
            throw new Error(response?.msg || "获取组卷列表失败");
        }
    } catch (err) {
        console.error("获取组卷列表失败:", err);
        error.value = err.message || "获取组卷列表失败，请稍后重试";
    } finally {
        isLoading.value = false;
    }
};

const onPageChange = (page, size) => {
    currentPage.value = page;
    pageSize.value = size;
    fetchPapers();
};

// 获取职位选项
const fetchPositionOptions = async () => {
    try {
        const response = await getDictionaryByType({ type: 0 }); // 参考 PaperManagement.vue，使用 type: 0
        if (response && response.code === 200 && response.data) {
            positionOptions.value = response.data.map(item => ({
                id: item.id,
                name: item.name,
                code: item.code
            }));
        } else {
            throw new Error(response?.msg || "获取职业(工种)数据失败");
        }
    } catch (err) {
        console.error("获取职业(工种)数据失败:", err);
        ElMessage.error("获取职业(工种)数据失败，请稍后重试");
    }
};

// 获取技能等级选项
const fetchLevelOptions = async () => {
    try {
        const response = await getDictionaryByType({ type: 1 }); // 参考 PaperManagement.vue，使用 type: 1
        if (response && response.code === 200 && response.data) {
            levelOptions.value = response.data
                .filter(item => item.name !== "职业道德")
                .map(item => ({
                    id: item.id,
                    name: item.name,
                    code: item.code
                }));
        } else {
            throw new Error(response?.msg || "获取技能等级数据失败");
        }
    } catch (err) {
        console.error("获取技能等级数据失败:", err);
        ElMessage.error("获取技能等级数据失败，请稍后重试");
    }
};

// 获取考核站选项
const fetchExamStations = async () => {
    loadingExamStations.value = true;
    try {
        const response = await getAllExamStations();
        console.log("考核站API响应:", response);
        
        // 检查响应结构
        if (response && response.data) {
            const responseData = response.data;
            if (responseData.code === 200 && responseData.data) {
                examStations.value = responseData.data;
            } else {
                throw new Error(responseData?.msg || "获取考核站数据失败");
            }
        } else {
            throw new Error("API响应格式错误");
        }
    } catch (err) {
        console.error("获取考核站数据失败:", err);
        ElMessage.error("获取考核站数据失败，请稍后重试");
    } finally {
        loadingExamStations.value = false;
    }
};

/** ruleType: 0=职业认定 1=竞赛 2=模拟考核 */
const formatRuleType = (v) => {
    if (v === 0 || v === '0') return '职业认定';
    if (v === 1 || v === '1') return '竞赛';
    if (v === 2 || v === '2') return '模拟考核';
    if (v === '职业认定' || v === 'CAREER_CERTIFICATION') return '职业认定';
    if (v === '竞赛' || v === 'COMPETITION') return '竞赛';
    if (v === '模拟考核' || v === '模拟考试' || v === 'MOCK_EXAM') return '模拟考核';
    return v || '-';
};

// 根据考核站ID获取考核站名称
const getStationName = (stationId) => {
    if (!stationId) return '未设置';
    const station = examStations.value.find(s => s.id === stationId);
    return station ? station.stationName : '未知考核站';
};

// 显示自动组卷模态框
const showAutoPaperModal = async () => {
    isEditMode.value = false;

    // 获取职位数据
    try {
        await Promise.all([fetchPositionOptions(), fetchLevelOptions()]);
    } catch (error) {
        console.error("加载选项数据失败:", error);
        ElMessage.error(`加载选项数据失败: ${error.message || "未知错误"}`);
    }

    isAutoPaperModalVisible.value = true;
};

// 关闭自动组卷模态框
const closeAutoPaperModal = () => {
    isAutoPaperModalVisible.value = false;
};

// 自动组卷保存成功回调
const handleAutoPaperSaved = () => {
    fetchPapers(); // 刷新试卷列表
};

// 显示手动组卷模态框
const showManualAddModal = async () => {
    isEditMode.value = false;
    currentPaper.value = {
        id: null,
        teachId: JSON.parse(sessionStorage.getItem("user") || "{}").id,
        level: null,
        jobType: "",
        desc: ""
    };
    selectedQuestions.value = [];
    questionScores.value = {};
    questionTypes.value.forEach(type => {
        type.count = 0;
        type.score = 0;
    });

    // 获取选项数据
    try {
        await Promise.all([fetchPositionOptions(), fetchLevelOptions()]);
    } catch (error) {
        console.error("加载选项数据失败:", error);
        ElMessage.error(`加载选项数据失败: ${error.message || "未知错误"}`);
    }

    // 显示手动组卷页面
    showManualPaperPage.value = true;
};

// 编辑试卷
const editPaper = async paper => {
    // 设置编辑模式
    isEditMode.value = true;

    // 获取职位数据
    try {
        ElMessage.info("正在加载选项数据...");
        await Promise.all([fetchPositionOptions(), fetchLevelOptions()]);
    } catch (error) {
        console.error("加载选项数据失败:", error);
        ElMessage.error(`加载选项数据失败: ${error.message || "未知错误"}`);
    }

    // 设置编辑数据
    const parseRuleType = (v) => {
        if (v === 0 || v === '0') return 0;
        if (v === 1 || v === '1') return 1;
        if (v === 2 || v === '2') return 2;
        if (v === '职业认定') return 0;
        if (v === '竞赛') return 1;
        if (v === '模拟考核' || v === '模拟考试') return 2;
        return paper.ruleType ?? paper.paperPurpose ?? '';
    };
    editPaperData.value = {
        id: paper.id,
        teachId: JSON.parse(sessionStorage.getItem("user") || "{}").id,
        level: paper.level || null,
        jobType: paper.jobType || "",
        ruleType: parseRuleType(paper.ruleType ?? paper.paperPurpose ?? ''),
        desc: paper.desc || ""
    };

    // 显示自动组卷模态框进行编辑
    isAutoPaperModalVisible.value = true;
};

// 返回列表页面
const goBackToList = () => {
    showManualPaperPage.value = false;
    showPaperDetail.value = false;
    selectedQuestions.value = [];
    questionScores.value = {};
    // 重置编辑状态
    isEditMode.value = false;
    editPaperData.value = null;
    editQuestions.value = [];
};

// 处理试卷保存成功
const handlePaperSaved = () => {
    showManualPaperPage.value = false;
    // 重置编辑状态
    isEditMode.value = false;
    editPaperData.value = null;
    editQuestions.value = [];
    fetchPapers(); // 刷新试卷列表
};

// 其他必要的方法
const viewPaper = async (paper) => {
    try {
        // 设置当前试卷详情
        currentPaperDetail.value = paper;
        // 显示试卷详情页面
        showPaperDetail.value = true;
    } catch (error) {
        console.error("显示试卷详情失败:", error);
        ElMessage.error("显示试卷详情失败，请稍后重试");
    }
};

// 处理Logo上传
const triggerLogoInput = () => {
    logoInput.value?.click();
};

const handleLogoDrop = (e) => {
    e.preventDefault();
    isLogoDragOver.value = false;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleLogoSelect({ target: { files } });
    }
};

const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            ElMessage.error('请选择图片文件');
            return;
        }

        // 验证文件大小 (2MB)
        if (file.size > 2 * 1024 * 1024) {
            ElMessage.error('图片大小不能超过2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            downloadSettings.value.logoUrl = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const removeLogo = () => {
    downloadSettings.value.logoUrl = "";
};

const showDownloadModal = async (paper) => {
    currentDownloadPaper.value = paper;
    // 列表接口返回的试卷页眉、试卷标题、试卷副标题，在下载（尤其 A3）时默认带入弹窗
    downloadSettings.value = {
        logoUrl: "",
        examTitle: paper.mainTitle ?? paper.examTitle ?? paper.name ?? "",
        paperSize: "A4",
        header: paper.pageHeader ?? paper.header ?? "",
        subtitle: paper.subTitle ?? paper.subtitle ?? ""
    };
    isDownloadModalVisible.value = true;
};



const confirmDownload = async () => {
    if (downloadSettings.value.paperSize === "A3") {
        if (!downloadSettings.value.examTitle?.trim()) {
            ElMessage.warning("请输入试卷标题");
            return;
        }
        if (!downloadSettings.value.header?.trim()) {
            ElMessage.warning("请输入试卷页眉");
            return;
        }
        if (!downloadSettings.value.subtitle?.trim()) {
            ElMessage.warning("请输入试卷副标题");
            return;
        }
    }
    isDownloading.value = true;
    try {
        // 调用下载API，传递设置参数
        const downloadParams = {
            paperId: currentDownloadPaper.value.id,
            logoUrl: downloadSettings.value.logoUrl,
            examTitle: downloadSettings.value.examTitle,
            paperSize: downloadSettings.value.paperSize
        };
        let blob;
        if (downloadSettings.value.paperSize === "A4") {
            // A4 使用带答案的新接口
            blob = await exportExamWordA4Answer({
                paperId: currentDownloadPaper.value.id,
                logoUrl: downloadSettings.value.logoUrl,
                examTitle: downloadSettings.value.examTitle
            });
        } else {
            // A3 使用 testA3Export 接口，与组卷接口一致传 pageHeader、mainTitle、subTitle
            blob = await testA3ExportApi({
                paperId: currentDownloadPaper.value.id,
                logoUrl: downloadSettings.value.logoUrl,
                pageHeader: downloadSettings.value.header,
                mainTitle: downloadSettings.value.examTitle,
                subTitle: downloadSettings.value.subtitle
            });
        }
        const fileName = `${downloadSettings.value.examTitle || '试卷'}-${currentDownloadPaper.value.jobType || ""}-${currentDownloadPaper.value.level || ""}.docx`;

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


// const confirmDownload = async () => {
//     isDownloading.value = true;
//     try {
//         // 调用下载API，传递设置参数
//         const downloadParams = {
//             paperId: currentDownloadPaper.value.id,
//             logoUrl: downloadSettings.value.logoUrl,
//             examTitle: downloadSettings.value.examTitle,
//             paperSize: downloadSettings.value.paperSize
//         };
//         let blob;
//         if (downloadSettings.value.paperSize === "A4") {
//             // A4 使用带答案的新接口
//             blob = await exportExamWordA4Answer({
//                 paperId: currentDownloadPaper.value.id,
//                 logoUrl: downloadSettings.value.logoUrl,
//                 examTitle: downloadSettings.value.examTitle
//             });
//         } else {
//             // 非A4（如A3）仍走原有接口
//             blob = await exportExamWordNew(downloadParams);
//         }
//         const fileName = `${downloadSettings.value.examTitle || '试卷'}-${currentDownloadPaper.value.jobType || ""}-${currentDownloadPaper.value.level || ""}.docx`;

//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.href = url;
//         link.setAttribute("download", fileName);
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(url);

//         ElMessage.success("试卷下载成功");
//         closeDownloadModal();
//     } catch (error) {
//         console.error("下载试卷失败:", error);
//         ElMessage.error("下载试卷失败，请稍后重试");
//     } finally {
//         isDownloading.value = false;
//     }
// };

// // 确认下载
// const confirmDownload = async () => {
//     isDownloading.value = true;
//     try {
//         // 调用下载API，传递设置参数
//         const downloadParams = {
//             paperId: currentDownloadPaper.value.id,
//             logoUrl: downloadSettings.value.logoUrl,
//             examTitle: downloadSettings.value.examTitle,
//             paperSize: downloadSettings.value.paperSize
//         };

//         const blob = await exportExamWordNew(downloadParams);
//         const fileName = `${downloadSettings.value.examTitle || '试卷'}-${currentDownloadPaper.value.jobType || ""}-${currentDownloadPaper.value.level || ""}.docx`;

//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.href = url;
//         link.setAttribute("download", fileName);
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(url);

//         ElMessage.success("试卷下载成功");
//         closeDownloadModal();
//     } catch (error) {
//         console.error("下载试卷失败:", error);
//         ElMessage.error("下载试卷失败，请稍后重试");
//     } finally {
//         isDownloading.value = false;
//     }
// };

const closeDownloadModal = () => {
    console.log('closeDownloadModal called');
    isDownloadModalVisible.value = false;
    currentDownloadPaper.value = null;
    console.log('isDownloadModalVisible set to:', isDownloadModalVisible.value);
};

// 测试A3导出接口
const testA3Export = async (paper, paperId) => {
    try {
        // 调用A3导出接口
        const testParams = {
            paperId: paperId ?? paper.id,
            logoUrl: "", // 不传logo
            examTitle: "A3横向装订线测试试卷",
            paperSize: "A3"
        };

        const blob = await exportExamWordA3WithGutter(testParams);

        // 创建下载链接
        const fileName = `A3横向装订线-${paper.jobType || ""}-${paper.level || ""}.docx`;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        ElMessage.success("A3横向装订线测试导出成功！");
    } catch (error) {
        console.error("A3测试导出失败:", error);
        ElMessage.error("A3横向装订线测试导出失败：" + (error.message || "未知错误"));
    }
};

// 派发相关方法
const showDispatchModal = async (paper) => {
    try {
        if (paper.auditStatus !== 1) {
            ElMessage.warning("仅审核通过的试卷可派发");
            return;
        }
        if (paper.status === 1) {
            ElMessage.warning("该试卷已经派发过了");
            return;
        }

        currentDispatchPaper.value = paper;

        // 设置默认开始时间为当前时间
        const now = new Date();
        const startTime = new Date(now);
        startTime.setMinutes(0); // 将分钟设为0
        startTime.setSeconds(0); // 将秒设为0

        // 设置默认结束时间为开始时间后24小时
        const endTime = new Date(startTime);
        endTime.setDate(endTime.getDate() + 1);

        // 格式化为datetime-local输入框所需的格式 (YYYY-MM-DDTHH:MM)
        dispatchData.value.startTime = formatDateForInput(startTime);
        dispatchData.value.endTime = formatDateForInput(endTime);
        dispatchData.value.duration = 60; // 默认60分钟

        isDispatchModalVisible.value = true;
    } catch (error) {
        console.error("显示派发模态框失败:", error);
        ElMessage.error("显示派发模态框失败，请稍后重试");
    }
};

const closeDispatchModal = () => {
    isDispatchModalVisible.value = false;
    currentDispatchPaper.value = null;
    dateValidationError.value = "";
};

const showMultiDispatchModal = async () => {
    try {
        if (selectedPapers.value.length === 0) {
            ElMessage.warning("请先选择要派发的试卷");
            return;
        }
        // 仅审核通过(auditStatus===1)的试卷可派发，其他状态不能派发
        const notApproved = selectedPapers.value.filter((p) => p.auditStatus !== 1);
        if (notApproved.length > 0) {
            ElMessage.warning("存在未审核通过的试卷，无法派发，请仅选择审核通过的试卷");
            return;
        }

        // 设置默认开始时间为当前时间
        const now = new Date();
        const startTime = new Date(now);
        startTime.setMinutes(0); // 将分钟设为0
        startTime.setSeconds(0); // 将秒设为0

        // 设置默认结束时间为开始时间后24小时
        const endTime = new Date(startTime);
        endTime.setDate(endTime.getDate() + 1);

        // 格式化为datetime-local输入框所需的格式 (YYYY-MM-DDTHH:MM)
        if (isExamStationAdmin.value && currentUser.value.stationId) {
            multiDispatchData.value.stationId = currentUser.value.stationId;
            await onMultiDispatchStationChange(currentUser.value.stationId);
        } else {
            multiDispatchData.value.stationId = "";
            paperApplicationsForDispatch.value = [];
        }
        multiDispatchData.value.batchApplicationId = "";
        multiDispatchData.value.startTime = formatDateForInput(startTime);
        multiDispatchData.value.endTime = formatDateForInput(endTime);
        multiDispatchData.value.duration = 60; // 默认60分钟

        isMultiDispatchModalVisible.value = true;
    } catch (error) {
        console.error("显示批量派发模态框失败:", error);
        ElMessage.error("显示批量派发模态框失败，请稍后重试");
    }
};

const closeMultiDispatchModal = () => {
    isMultiDispatchModalVisible.value = false;
    multiDateValidationError.value = "";
};

const onMultiDispatchStationChange = async (stationId) => {
    multiDispatchData.value.batchApplicationId = "";
    paperApplicationsForDispatch.value = [];
    if (!stationId) return;
    try {
        const res = await getPaperApplications({ stationId: Number(stationId) });
        const data = res?.data ?? res;
        const list = (data?.code === 200 && data?.data) ? data.data : (Array.isArray(data) ? data : []);
        paperApplicationsForDispatch.value = (Array.isArray(list) ? list : []).filter(
            (a) => a.applicationStatus === 0 || a.applicationStatus == null
        );
    } catch (e) {
        console.error("获取试卷申请列表失败", e);
        ElMessage.error("获取试卷申请列表失败");
    }
};

// 格式化日期为input[type="datetime-local"]所需的格式
const formatDateForInput = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// 格式化日期为API所需的格式 (YYYYMMDDHHmmss)
const formatDateForApi = dateString => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// 验证派发数据
const validateDispatchData = (data) => {
    if (!data.startTime) {
        return "请选择开始时间";
    }
    if (!data.endTime) {
        return "请选择结束时间";
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
        return "考试结束日期不能小于或等于开始日期";
    }

    return null;
};

// 派发单个试卷
const dispatchPaper = async () => {
    const validationError = validateDispatchData(dispatchData.value);
    if (validationError) {
        dateValidationError.value = validationError;
        ElMessage.warning(validationError);
        return;
    }

    isDispatching.value = true;
    dateValidationError.value = "";

    try {
        // 准备API请求数据
        const distributeData = {
            idList: [currentDispatchPaper.value.id],
            name: dispatchData.value.name || undefined,
            startTime: formatDateForApi(dispatchData.value.startTime),
            endTime: formatDateForApi(dispatchData.value.endTime),
            consume: dispatchData.value.duration.toString()
        };

        // 调用API
        const response = await distributeExam(distributeData);

        if (response && response.code === 200) {
            ElMessage.success("试卷派发成功");
            fetchPapers();
            closeDispatchModal();
        } else {
            throw new Error(response?.msg || "派发试卷失败");
        }
    } catch (error) {
        console.error("派发试卷失败:", error);
        ElMessage.error(error.message || "派发试卷失败，请稍后重试");
    } finally {
        isDispatching.value = false;
    }
};

// 批量派发试卷（考核站+试卷申请联动，调用 teachExam/batchDistribution）
const dispatchMultiplePapers = async () => {
    if (selectedPapers.value.length === 0) {
        ElMessage.warning("请先选择要派发的试卷");
        return;
    }
    // 仅审核通过(auditStatus===1)的试卷可派发，其他状态不能派发
    const notApproved = selectedPapers.value.filter((p) => p.auditStatus !== 1);
    if (notApproved.length > 0) {
        ElMessage.warning("存在未审核通过的试卷，无法派发");
        return;
    }
    if (!multiDispatchData.value.stationId) {
        ElMessage.warning("请选择考核站");
        return;
    }
    if (!multiDispatchData.value.batchApplicationId) {
        ElMessage.warning("请选择试卷申请（未派发）");
        return;
    }

    const user = currentUser.value;
    const role = isRole(user.role, ROLE_MANAGER) ? ROLE_EXAM_STATION_ADMIN : 3;
    const curAccount = user.account ?? user.username ?? user.userId ?? String(user.id ?? "");

    isMultiDispatching.value = true;
    multiDateValidationError.value = "";

    try {
        const response = await batchDistribution({
            batchId: String(multiDispatchData.value.batchApplicationId),
            paperIds: selectedPapers.value.map((paper) => paper.id),
            stationId: String(multiDispatchData.value.stationId),
            curAccount,
            role
        });

        if (response && response.code === 200) {
            ElMessage.success(`成功派发 ${selectedPapers.value.length} 份试卷！`);
            selectedPapers.value = [];
            fetchPapers();
            closeMultiDispatchModal();
        } else {
            throw new Error(response?.msg || "批量派发试卷失败");
        }
    } catch (error) {
        console.error("批量派发试卷失败:", error);
        ElMessage.error(error.message || "批量派发试卷失败，请稍后重试");
    } finally {
        isMultiDispatching.value = false;
    }
};

// 从选择中移除试卷
const removePaperFromSelection = (paper) => {
    const index = selectedPapers.value.findIndex(p => p.id === paper.id);
    if (index > -1) {
        selectedPapers.value.splice(index, 1);
    }
};

// 提交删除审批（考核站管理员/管理/总管理员）
const handleSubmitDeleteApproval = async (paper) => {
    try {
        if (!isQuestionExpert.value) {
            ElMessage.warning("仅考核站管理员、管理或总管理员可提交删除审批");
            return;
        }
        const confirmMessage = `确定要提交试卷"${paper.name || paper.desc || paper.id}"的删除审批吗？`;
        if (!confirm(confirmMessage)) {
            return;
        }
        const response = await submitExamDeleteApproval(paper.id);
        if (response && response.code === 200) {
            ElMessage.success("提交删除审批成功");
            fetchPapers();
        } else {
            throw new Error(response?.msg || "提交删除审批失败");
        }
    } catch (error) {
        console.error("提交删除审批失败:", error);
        ElMessage.error(error.message || "提交删除审批失败，请稍后重试");
    }
};

// 审卷专家：删除通过
const handleApproveDeleteApproval = async (paper) => {
    if (!paper) return;
    if (!isReviewExpert.value) {
        ElMessage.warning("仅审卷专家可审核删除申请");
        return;
    }
    openDeleteAuditDialog(paper, "approve");
};

// 审卷专家：删除拒绝
const handleRejectDeleteApproval = async (paper) => {
    if (!paper) return;
    if (!isReviewExpert.value) {
        ElMessage.warning("仅审卷专家可审核删除申请");
        return;
    }
    openDeleteAuditDialog(paper, "reject");
};

// 提交试卷审核
const handleSubmitExamAudit = async (paper) => {
    try {
        if (!isQuestionExpert.value) {
            ElMessage.warning("仅考核站管理员、管理或总管理员可提交审核");
            return;
        }
        // 二次确认
        const confirmMessage = `确定要提交试卷"${paper.name || paper.desc || paper.id}"进行审核吗？`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        const response = await submitExamForAudit(paper.id);
        if (response && response.code === 200) {
            ElMessage.success("提交审核成功");
            // 刷新试卷列表以更新审核状态
            fetchPapers();
        } else {
            throw new Error(response?.msg || "提交审核失败");
        }
    } catch (error) {
        console.error("提交试卷审核失败:", error);
        ElMessage.error(error.message || "提交审核失败，请稍后重试");
    }
};

// 打开审核弹窗（内容审核）
const openAuditDialog = async (paper, mode) => {
    currentAuditPaper.value = paper;
    auditDialogType.value = "exam";
    auditDialogAction.value = mode;
    auditRemark.value = mode === "reject" ? "" : (paper?.auditRemark || "");
    auditDialogVisible.value = true;
};

// 打开删除审批弹窗
const openDeleteAuditDialog = async (paper, mode) => {
    currentAuditPaper.value = paper;
    auditDialogType.value = "delete";
    auditDialogAction.value = mode;
    auditRemark.value = "";
    auditDialogVisible.value = true;
};

const closeAuditDialog = () => {
    auditDialogVisible.value = false;
    auditRemark.value = "";
    currentAuditPaper.value = null;
};

// 确认审核操作
const confirmAuditAction = async () => {
    if (!currentAuditPaper.value) {
        auditDialogVisible.value = false;
        return;
    }
    const isApprove = auditDialogAction.value === "approve";
    const remarkToSubmit = auditRemark.value ? auditRemark.value.trim() : "";

    // 试卷审核：驳回时必填不通过原因，通过时选填；删除审批两种都必填
    if (auditDialogType.value === "exam") {
        if (!isApprove && !remarkToSubmit) {
            ElMessage.warning("请填写不通过原因");
            return;
        }
    } else {
        if (!remarkToSubmit) {
            ElMessage.warning("请填写删除审批备注");
            return;
        }
    }

    isAuditSubmitting.value = true;
    try {
        if (auditDialogType.value === "exam") {
            const auditStatus = isApprove ? 1 : 2;
            const response = await auditExam(currentAuditPaper.value.id, auditStatus, remarkToSubmit || undefined);
            if (response && response.code === 200) {
                ElMessage.success(auditStatus === 1 ? "审核通过成功" : "审核驳回成功");
                fetchPapers();
                closeAuditDialog();
            } else {
                throw new Error(response?.msg || "审核失败");
            }
        } else {
            const deleteAuditStatus = isApprove ? 1 : 2;
            const response = await auditExamDeleteApproval(
                currentAuditPaper.value.id,
                deleteAuditStatus,
                remarkToSubmit || undefined
            );
            if (response && response.code === 200) {
                ElMessage.success(deleteAuditStatus === 1 ? "删除审批通过，试卷已删除" : "删除审批已驳回");
                fetchPapers();
                closeAuditDialog();
            } else {
                throw new Error(response?.msg || "删除审批失败");
            }
        }
    } catch (error) {
        console.error("审核操作失败:", error);
        ElMessage.error(error.message || "审核失败，请稍后重试");
    } finally {
        isAuditSubmitting.value = false;
    }
};

// 直接删除试卷（仅用于未审核通过的试卷；考核站管理员/管理/总管理员）
const deletePaper = async (paper) => {
    try {
        if (!isQuestionExpert.value) {
            ElMessage.warning("仅考核站管理员、管理或总管理员可删除试卷");
            return;
        }
        // 二次确认
        const confirmMessage = `确定要删除试卷"${paper.name || paper.desc || paper.id}"吗？此操作不可恢复。`;
        if (!confirm(confirmMessage)) {
            return;
        }

        const response = await deleteExam(paper.id);
        if (response && response.code === 200) {
            ElMessage.success("删除成功");
            fetchPapers();
        } else {
            throw new Error(response?.msg || "删除失败");
        }
    } catch (error) {
        console.error("删除试卷失败:", error);
        ElMessage.error(error.message || "删除失败，请稍后重试");
    }
};

const toggleSelectAll = () => {
    if (selectedPapers.value.length === paginatedPapers.value.length) {
        selectedPapers.value = [];
    } else {
        selectedPapers.value = [...paginatedPapers.value];
    }
};

const isPaperSelected = (paper) => {
    return selectedPapers.value.some(p => p.id === paper.id);
};

const togglePaperSelection = (paper) => {
    const index = selectedPapers.value.findIndex(p => p.id === paper.id);
    if (index > -1) {
        selectedPapers.value.splice(index, 1);
    } else {
        selectedPapers.value.push(paper);
    }
};

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};

const handlePageSizeChange = () => {
    currentPage.value = 1;
    fetchPapers();
};

// 查看审核备注
const handleAuditStatusClick = async (paper) => {
    if (!paper || !paper.auditRemark) {
        ElMessage.info("暂无审核备注");
        return;
    }
    await ElMessageBox.alert(paper.auditRemark, "审核备注", {
        confirmButtonText: "知道了"
    });
};

const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    try {
        const date = new Date(dateTime);
        return date.toLocaleString('zh-CN');
    } catch (error) {
        return dateTime;
    }
};

// 审核状态：null/undefined=未审核，0=待审核，1=审核通过，2=审核驳回
const getAuditStatusText = (auditStatus) => {
    if (auditStatus === null || auditStatus === undefined) {
        return '未审核';
    }
    const statusMap = {
        0: '待审核',
        1: '审核通过',
        2: '审核驳回'
    };
    return statusMap[auditStatus] ?? '未知状态';
};

// 获取审核状态样式类（未审核/待审核/审核通过/审核驳回）
const getAuditStatusClass = (auditStatus) => {
    if (auditStatus === null || auditStatus === undefined) {
        return 'audit-status-not-submitted'; // 未审核
    }
    const classMap = {
        0: 'audit-status-pending',
        1: 'audit-status-approved',
        2: 'audit-status-rejected'
    };
    return classMap[auditStatus] || 'audit-status-unknown';
};

// 删除审批状态文本
const getDeleteAuditStatusText = (status) => {
    if (status === null || status === undefined) {
        return '未提交';
    }
    const map = {
        0: '待审批',
        1: '删除通过',
        2: '删除拒绝'
    };
    return map[status] || '未知';
};

// 删除审批状态样式
const getDeleteAuditStatusClass = (status) => {
    if (status === null || status === undefined) {
        return 'delete-status-not-submitted';
    }
    const map = {
        0: 'delete-status-pending',
        1: 'delete-status-approved',
        2: 'delete-status-rejected'
    };
    return map[status] || 'delete-status-unknown';
};

// 查看删除审批备注
const handleDeleteAuditStatusClick = async (paper) => {
    if (!paper || !paper.deleteAuditRemark) {
        ElMessage.info("暂无删除审批备注");
        return;
    }
    await ElMessageBox.alert(paper.deleteAuditRemark, "删除审批备注", {
        confirmButtonText: "知道了"
    });
};

const goBackToPaperList = () => {
    showPaperDetail.value = false;
};

// 筛选相关函数
const handleExamTypeChange = () => {
    // 组卷类型改变时的处理逻辑
    console.log("组卷类型改变:", selectedExamType.value);
};

const handleJobTypeChange = () => {
    // 工种改变时的处理逻辑
    console.log("职业(工种)改变:", selectedJobType.value);
};

const handleLevelChange = () => {
    // 技能等级改变时的处理逻辑
};

const handleAuditStatusChange = () => {};
const handleStatusChange = () => {};

const applyFilters = () => {
    // 应用筛选条件
    currentPage.value = 1; // 重置到第一页
    fetchPapers();
};

const resetFilters = () => {
    // 重置所有筛选条件
    selectedExamType.value = "";
    selectedJobType.value = "";
    selectedLevel.value = "";
    selectedAuditStatus.value = "";
    selectedStatus.value = "";
    createTime.value = "";
    currentPage.value = 1; // 重置到第一页
    fetchPapers();
};

// 组件挂载时获取数据
onMounted(() => {
    fetchPapers();
    fetchPositionOptions();
    fetchLevelOptions();
    fetchExamStations();
});
</script>

<style scoped>
.paper-management {
    padding: 20px;
    background-color: #f5f5f5;
    min-height: 100vh;
}

.page-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
}

/* 搜索和筛选区域样式 */
.search-filter-section {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.filter-groups {
    display: flex;
    gap: 30px;
    flex: 1;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.filter-label {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    white-space: nowrap;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    min-width: 120px;
    background-color: white;
    transition: border-color 0.3s ease;
}

.filter-select:focus {
    outline: none;
    border-color: #409eff;
}

.filter-input {
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    outline: none;
}

.filter-input:focus {
    border-color: #409eff;
}

.filter-date {
    min-width: 130px;
}

.filter-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
}

.btn-search {
    background-color: #409eff;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    white-space: nowrap;
}

.btn-search:hover {
    background-color: #337ecc;
}

.btn-reset {
    background-color: #909399;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    white-space: nowrap;
}

.btn-reset:hover {
    background-color: #73767a;
}

.action-buttons {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    justify-content: flex-start;
}

.btn {
    padding: 10px 20px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
}

.btn-add {
    background-color: #67c23a;
    color: white;
    border: 1px solid #67c23a;
    box-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);
}

.btn-add:hover {
    background-color: #85ce61;
    border-color: #85ce61;
    box-shadow: 0 4px 8px rgba(103, 194, 58, 0.3);
    transform: translateY(-1px);
}

.btn-add:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);
}

.btn-manual {
    background-color: #409eff;
    color: white;
    border: 1px solid #409eff;
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.btn-manual:hover {
    background-color: #66b1ff;
    border-color: #66b1ff;
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
    transform: translateY(-1px);
}

.btn-manual:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.btn-dispatch {
    background-color: #c70019;
    color: white;
    border: 1px solid #c70019;
    box-shadow: 0 2px 4px rgba(199, 0, 25, 0.2);
}

.btn-dispatch:disabled {
    background-color: #c0c4cc;
    border-color: #c0c4cc;
    cursor: not-allowed;
    box-shadow: none;
}

.btn-dispatch:not(:disabled):hover {
    background-color: #a80015;
    border-color: #a80015;
    box-shadow: 0 4px 8px rgba(199, 0, 25, 0.3);
    transform: translateY(-1px);
}

.btn-dispatch:not(:disabled):active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(199, 0, 25, 0.2);
}

.plus-icon {
    font-size: 16px;
    font-weight: bold;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #409eff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
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
    background-color: #fef0f0;
    border: 1px solid #fbc4c4;
    color: #f56c6c;
    padding: 16px;
    border-radius: 6px;
    text-align: center;
    margin-bottom: 20px;
}

.retry-btn {
    background-color: #f56c6c;
    color: white;
    margin-left: 16px;
}

.retry-btn:hover {
    background-color: #f78989;
}

.table-responsive {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.data-table th {
    background-color: #fafafa;
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 1px solid #e8e8e8;
}

.data-table td {
    padding: 16px 12px;
    border-bottom: 1px solid #f0f0f0;
    color: #666;
}

.data-table tbody tr:hover {
    background-color: #f5f7fa;
}

.checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.operations {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.operations a {
    color: #409eff;
    text-decoration: none;
    font-size: 13px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.operations a:hover {
    background-color: #ecf5ff;
}

.view-link {
    color: #409eff;
}

.download-link {
    color: #67c23a;
}

.audit-link {
    color: #409eff;
}

.test-link {
    color: #9c27b0;
}

.edit-link {
    color: #e6a23c;
}

.dispatch-link {
    color: #909399;
}

.submit-audit-link {
    color: #52c41a;
    text-decoration: none;
}

.submit-audit-link:hover {
    color: #389e0d;
}

/* 审核操作按钮样式 */
.approve-link {
    color: #52c41a;
    text-decoration: none;
}

.approve-link:hover {
    color: #389e0d;
}

.reject-link {
    color: #ff4d4f;
    text-decoration: none;
}

.reject-link:hover {
    color: #d9363e;
}

.delete-link {
    color: #f56c6c;
}

.status-dispatched {
    color: #67c23a;
    font-weight: 500;
}

.status-not-dispatched {
    color: #909399;
    font-weight: 500;
}

/* 审核状态样式 */
.audit-status-not-submitted {
    color: #d9d9d9;
    font-weight: 500;
}

.audit-status-pending {
    color: #faad14;
    font-weight: 500;
}

.audit-status-approved {
    color: #52c41a;
    font-weight: 500;
}

.audit-status-rejected {
    color: #ff4d4f;
    font-weight: 500;
}

.audit-status-unknown {
    color: #909399;
    font-weight: 500;
}

.audit-status-clickable {
    cursor: pointer;
    text-decoration: underline;
}

/* 删除审批状态样式 */
.delete-status-not-submitted {
    color: #d9d9d9;
    font-weight: 500;
}

.delete-status-pending {
    color: #faad14;
    font-weight: 500;
}

.delete-status-approved {
    color: #f5222d;
    font-weight: 500;
}

.delete-status-rejected {
    color: #1890ff;
    font-weight: 500;
}

.delete-status-unknown {
    color: #909399;
    font-weight: 500;
}

.no-data {
    text-align: center;
    color: #909399;
    font-style: italic;
    padding: 40px;
}

.pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.total-count {
    color: #666;
    font-size: 14px;
}

.pagination {
    display: flex;
    gap: 8px;
    align-items: center;
}

.page-nav,
.page-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    color: #666;
    text-decoration: none;
    transition: all 0.3s ease;
    cursor: pointer;
}

.page-nav:hover,
.page-number:hover {
    border-color: #409eff;
    color: #409eff;
}

.page-nav.disabled {
    color: #c0c4cc;
    cursor: not-allowed;
    border-color: #e4e7ed;
}

.page-nav.disabled:hover {
    border-color: #e4e7ed;
    color: #c0c4cc;
}

.page-number.active {
    background-color: #409eff;
    border-color: #409eff;
    color: white;
}

.ellipsis {
    color: #666;
    padding: 0 8px;
}

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
}

.page-size-selector select:focus {
    outline: none;
    border-color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .paper-management {
        padding: 10px;
    }

    .action-buttons {
        flex-direction: column;
        gap: 10px;
    }

    .btn {
        width: 100%;
        justify-content: center;
    }

    .table-responsive {
        overflow-x: auto;
    }

    .data-table th,
    .data-table td {
        padding: 12px 8px;
        font-size: 13px;
    }

    .operations {
        flex-direction: column;
        gap: 8px;
    }

    .pagination-container {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
    }

    .pagination {
        justify-content: center;
    }
}

/* Logo上传相关样式 */
.modal-body {
    padding: 20px;
}

.form-row {
    margin-bottom: 20px;
}

.form-row label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
}

.form-control {
    width: 100%;
}

.form-hint {
    font-size: 12px;
    color: #999;
    margin-top: 6px;
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

.logo-upload-placeholder svg {
    margin-bottom: 8px;
    color: #999;
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
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-preview img {
    max-width: 100%;
    max-height: 100px;
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

.paper-size-simple {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.size-option-simple {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.size-option-simple .el-radio {
    margin-right: 8px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 审核弹窗样式 */
.audit-dialog {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.audit-target {
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    background: #f8f9fb;
}

.audit-target .label {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
}

.audit-target .value {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    word-break: break-word;
}

.audit-mode {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.audit-mode > label {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

/* 审核结果：通过/驳回 单选框样式 */
.audit-mode :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 24px;
}

.audit-mode :deep(.el-radio) {
    margin-right: 0;
}

.audit-mode :deep(.el-radio__label) {
    font-size: 14px;
    color: #606266;
}

.audit-mode :deep(.el-radio.is-checked .el-radio__label) {
    color: #303133;
}

/* 通过：选中时圆圈为绿色 */
.audit-mode :deep(.el-radio:first-child.is-checked .el-radio__input .el-radio__inner) {
    border-color: #67c23a;
    background: #67c23a;
}

/* 驳回：选中时圆圈为红色 */
.audit-mode :deep(.el-radio:last-child.is-checked .el-radio__input .el-radio__inner) {
    border-color: #f56c6c;
    background: #f56c6c;
}

.audit-remark-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.audit-remark-input {
    width: 100%;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    padding: 10px 12px;
    resize: vertical;
    min-height: 88px;
    font-size: 13px;
    color: #303133;
}

.audit-remark-input:focus {
    outline: none;
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

.required {
    color: #ff4d4f;
    margin-left: 4px;
}

/* 派发模态框样式 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 0 20px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 15px;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.close-btn:hover {
    background-color: #f5f5f5;
    color: #666;
}

.modal-body {
    padding: 20px;
}

.form-row {
    margin-bottom: 20px;
}

.form-row label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
}

.form-control {
    width: 100%;
}

.form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.3s ease;
}

.form-input:focus {
    outline: none;
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-input.input-error {
    border-color: #ff4d4f;
}

.validation-error {
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 4px;
}

.date-time-inputs {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.date-time-group {
    display: flex;
    flex-direction: column;
}

.small-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
}

.number-input-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.number-input {
    width: 80px;
    text-align: center;
}

.unit {
    color: #666;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 0 20px 20px 20px;
    border-top: 1px solid #f0f0f0;
    padding-top: 15px;
}

.btn-primary {
    background-color: #409eff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
    background-color: #337ecc;
}

.btn-primary:disabled {
    background-color: #c0c4cc;
    cursor: not-allowed;
}

.btn-secondary {
    background-color: #f5f5f5;
    color: #666;
    border: 1px solid #d9d9d9;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary:hover {
    background-color: #e8e8e8;
    border-color: #c0c4cc;
}

/* 批量派发选择框：大尺寸 + 下拉可搜索 */
.dispatch-select-large {
    width: 100%;
    min-height: 40px;
}
.dispatch-select-large :deep(.el-input__wrapper) {
    min-height: 40px;
    padding: 8px 12px;
}

/* 已选试卷列表样式 */
.selected-papers-list {
    margin-bottom: 20px;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    padding: 12px;
}

.selected-papers-header {
    font-weight: 500;
    margin-bottom: 8px;
    color: #333;
}

.selected-papers-container {
    max-height: 150px;
    overflow-y: auto;
}

.selected-paper-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #f0f0f0;
}

.selected-paper-item:last-child {
    border-bottom: none;
}

.paper-info {
    font-size: 14px;
    flex: 1;
}

.paper-status {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 3px;
    margin: 0 8px;
}

.status-dispatched {
    background-color: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
}

.status-not-dispatched {
    background-color: #fff7e6;
    color: #faad14;
    border: 1px solid #ffd591;
}

.remove-btn {
    background: none;
    border: none;
    color: #ff4d4f;
    cursor: pointer;
    font-size: 16px;
    padding: 0 4px;
    border-radius: 2px;
    transition: all 0.3s ease;
}

.remove-btn:hover {
    background-color: #fff1f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .modal-container {
        width: 95%;
        margin: 10px;
    }

    .modal-header,
    .modal-body,
    .modal-footer {
        padding-left: 15px;
        padding-right: 15px;
    }

    .date-time-inputs {
        gap: 8px;
    }

    .form-row {
        margin-bottom: 15px;
    }

    .filter-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 15px;
    }

    .filter-groups {
        flex-direction: column;
        gap: 15px;
    }

    .filter-group {
        align-items: stretch;
    }

    .filter-select {
        min-width: auto;
        width: 100%;
    }

    .filter-input.filter-date {
        min-width: auto;
        width: 100%;
    }

    .filter-buttons {
        justify-content: center;
    }

    .search-filter-section {
        padding: 15px;
    }
}
</style>

<style>
/* 批量派发下拉框：大尺寸、可滚动（选项多时） */
.dispatch-select-popper.el-select__popper {
    min-width: 280px;
}
.dispatch-select-popper .el-select-dropdown__list {
    max-height: 280px;
}
</style>
