<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditMode ? "编辑" : "新增" }}</h3>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <!-- 登录账号 -->
        <div class="form-group">
          <label for="teacher-account" class="required">登录账号</label>
          <input
            id="teacher-account"
            type="text"
            class="form-input"
            v-model="teacherData.account"
            placeholder="请输入登录账号"
            />
            <!-- :disabled="isEditMode" -->
        </div>

        <!-- 管理员姓名 -->
        <div class="form-group">
          <label for="teacher-name" class="required">管理员姓名</label>
          <input
            id="teacher-name"
            type="text"
            class="form-input"
            v-model="teacherData.displayName"
            placeholder="请输入管理员姓名"
          />
        </div>

        <!-- 密码 - 按原型：编辑时显示「修改密码」+ 新密码/确认新密码；新增时显示「密码」 -->
        <div class="form-group">
          <label for="teacher-password">{{ isEditMode ? "修改密码" : "密码" }}</label>
          <input
            id="teacher-password"
            type="password"
            class="form-input"
            v-model="teacherData.password"
            :placeholder="isEditMode ? '请输入新密码' : '请输入密码'"
          />
          <input
            v-if="showPasswordConfirm"
            id="teacher-password-confirm"
            type="password"
            class="form-input"
            v-model="passwordConfirm"
            :placeholder="isEditMode ? '请确认新密码' : '请确认密码'"
            style="margin-top: 8px;"
          />
          <div class="input-help">
            {{ isEditMode ? "不修改密码请留空" : "默认密码: Aa123456，未修改则使用默认" }}
          </div>
        </div>

        <!-- 角色（仅限四类：考核站管理员、管理、总管理员、审卷专家） -->
        <div class="form-group">
          <label class="required">角色</label>
          <div class="select-wrapper">
            <select class="form-select" v-model="teacherData.role">
              <option value="">请选择角色</option>
              <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>

        <!-- 考核站选择 - 除了总管理员和管理角色外都需要选择 -->
        <div class="form-group" v-if="teacherData.role && teacherData.role !== ROLE_MANAGER">
          <label class="required">考核站</label>
          <div class="select-wrapper">
            <el-select
              v-model="teacherData.stationId"
              placeholder="请选择考核站（可搜索）"
              style="width: 100%"
              :disabled="loadingExamStations"
              filterable
              clearable
            >
              <el-option
                v-for="station in examStations"
                :key="station.id"
                :label="station.stationName"
                :value="station.id"
              />
            </el-select>
          </div>
          <div v-if="loadingExamStations" class="input-help">加载考核站列表中...</div>
          <div v-else class="input-help">当前选择: {{ teacherData.stationId }} ({{ getExamStationName(teacherData.stationId) }})</div>
        </div>

        <!-- 考核站标签 - 仅管理角色显示，支持多选 -->
        <div class="form-group" v-if="isManagerRole">
          <label>考核站标签</label>
          <div class="station-select-row">
            <el-select
              v-model="selectedStationIds"
              multiple
              placeholder="请选择考核站（可多选、可搜索）"
              style="width: 100%"
              :disabled="loadingExamStations"
              filterable
              clearable
            >
              <el-option
                v-for="station in examStations"
                :key="station.id"
                :label="station.stationName"
                :value="station.id"
              />
            </el-select>
            <div class="station-quick-actions">
              <button type="button" class="btn-link" @click="selectAllStations" :disabled="loadingExamStations || examStations.length === 0">全选</button>
              <span class="action-divider">|</span>
              <button type="button" class="btn-link" @click="clearAllStations" :disabled="loadingExamStations || selectedStationIds.length === 0">清空</button>
            </div>
          </div>
          <div v-if="loadingExamStations" class="input-help">加载考核站列表中...</div>
          <div v-else class="input-help">已选择 {{ selectedStationIds.length }} 个考核站</div>
        </div>

        <!-- 状态 -->
        <div class="form-group">
          <label class="required">状态</label>
          <div class="radio-group">
            <label class="radio-label">
              <input
                type="radio"
                name="status"
                :value="1"
                v-model="teacherData.status"
              />
              正常
            </label>
            <label class="radio-label">
              <input
                type="radio"
                name="status"
                :value="0"
                v-model="teacherData.status"
              />
              禁用
            </label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="closeModal"
          :disabled="saving"
        >
          取消
        </button>
        <button
          class="btn btn-primary"
          @click="saveTeacher"
          :disabled="saving"
        >
          {{ saving ? "保存中..." : "确认" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  ROLE_EXAM_STATION_ADMIN,
  ROLE_MANAGER,
  ROLE_REVIEW_EXPERT,
  ROLE_LABELS,
  ROLE_IDS,
  isRole
} from '@/constants/role';
import { getAllExamStations } from '@/api/examStation';

// 仅三类角色：5总管理、4考核站管理员、8审卷专家（6已合并到5）
const ALLOWED_ROLES = [
  { value: ROLE_MANAGER, label: ROLE_LABELS[ROLE_MANAGER] },
  { value: ROLE_EXAM_STATION_ADMIN, label: ROLE_LABELS[ROLE_EXAM_STATION_ADMIN] },
  { value: ROLE_REVIEW_EXPERT, label: ROLE_LABELS[ROLE_REVIEW_EXPERT] }
];

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  teacher: {
    type: Object,
    default: () => ({
      account: '',
      displayName: '',
      password: '',
      role: ROLE_EXAM_STATION_ADMIN,
      status: 1,
      stationId: null
    })
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  saving: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'save', 'close']);

const isManagerRole = computed(() => isRole(teacherData.value.role, ROLE_MANAGER));

// 角色选项：仅三类 4考核站管理员、5总管理、8审卷专家，不保留历史兼容
const roleOptions = computed(() => [...ALLOWED_ROLES]);

// 考核站相关状态
const examStations = ref([]);
const loadingExamStations = ref(false);
const selectedStationIds = ref([]); // 多选考核站的ID数组

// 默认密码（新增时使用）
const DEFAULT_PASSWORD = 'Aa123456';

// 确认密码（用于新密码/确认新密码校验）
const passwordConfirm = ref('');

// 是否显示确认密码框（新增和编辑都显示）
const showPasswordConfirm = true;

// 创建本地数据副本，避免直接修改props（新增时角色默认空，编辑时用原值）
const teacherData = ref({
  ...props.teacher,
  role: props.teacher.role != null && props.teacher.role !== '' ? Number(props.teacher.role) : '',
  stationId: props.teacher.stationId ? Number(props.teacher.stationId) : null,
  stationIdsLabel: props.teacher.stationIdsLabel || ''
});

// 仅在弹窗打开时从 props 同步数据，避免覆盖用户在表单中的选择
watch(() => props.visible, (visible) => {
  if (visible) {
    const t = props.teacher;
    let role = props.isEditMode && t.role != null && t.role !== '' ? Number(t.role) : '';
    // 仅三类角色 4、5、8；若原为其他值（如 6）按总管理(5) 显示
    if (role !== '' && !ROLE_IDS.includes(role)) role = ROLE_MANAGER;
    teacherData.value = {
      ...t,
      password: props.isEditMode ? (t.password || '') : (t.password || DEFAULT_PASSWORD),
      role,
      stationId: t.stationId ? Number(t.stationId) : null,
      stationIdsLabel: t.stationIdsLabel || ''
    };
    // 新增时默认密码和确认密码都为 Aa123456；编辑时确认密码为空
    passwordConfirm.value = props.isEditMode ? '' : DEFAULT_PASSWORD;
    if (isRole(t.role, ROLE_MANAGER) && t.stationIdsLabel) {
      const names = t.stationIdsLabel.split(',').map(s => s.trim());
      selectedStationIds.value = examStations.value
        .filter(s => names.includes(s.stationName))
        .map(s => s.id);
    } else {
      selectedStationIds.value = [];
    }
  }
}, { immediate: true });

// 监听角色变化，清空考核站选择
watch(() => teacherData.value.role, (newRole) => {
  const r = Number(newRole);
  if (r === ROLE_MANAGER) {
    // 切换到管理角色，清空单选考核站
    teacherData.value.stationId = null;
  } else {
    // 切换到其他角色，清空多选考核站
    selectedStationIds.value = [];
    teacherData.value.stationIdsLabel = '';
  }
});

// 监听多选考核站变化，更新 stationIdsLabel
watch(selectedStationIds, (newIds) => {
  if (isRole(teacherData.value.role, ROLE_MANAGER)) {
    const selectedStations = examStations.value.filter(s => newIds.includes(s.id));
    teacherData.value.stationIdsLabel = selectedStations.map(s => s.stationName).join(',');
  }
}, { deep: true });

// 全选考核站
const selectAllStations = () => {
  selectedStationIds.value = examStations.value.map(s => s.id);
};
// 清空考核站
const clearAllStations = () => {
  selectedStationIds.value = [];
};

// 考核站映射函数
const getExamStationName = (stationId) => {
  if (!stationId) return '-';
  const station = examStations.value.find(s => s.id === stationId);
  return station ? station.stationName : '未知考核站';
};

// 获取考核站列表
const fetchExamStations = async () => {
  if (examStations.value.length > 0) {
    // 如果已经加载过，但当前是编辑模式且是管理角色，需要解析 stationIdsLabel
    if (props.isEditMode && isRole(props.teacher.role, ROLE_MANAGER) && props.teacher.stationIdsLabel) {
      const stationNames = props.teacher.stationIdsLabel.split(',').map(s => s.trim());
      selectedStationIds.value = examStations.value
        .filter(s => stationNames.includes(s.stationName))
        .map(s => s.id);
    }
    return;
  }
  
  loadingExamStations.value = true;
  try {
    const response = await getAllExamStations();
    const responseData = response.data || {};
    
    if (responseData && responseData.code === 200) {
      examStations.value = responseData.data || [];
      
      // 如果是编辑模式且是管理角色，解析 stationIdsLabel 为ID数组
      if (props.isEditMode && isRole(props.teacher.role, ROLE_MANAGER) && props.teacher.stationIdsLabel) {
        const stationNames = props.teacher.stationIdsLabel.split(',').map(s => s.trim());
        selectedStationIds.value = examStations.value
          .filter(s => stationNames.includes(s.stationName))
          .map(s => s.id);
      }
    } else {
      console.error('获取考核站列表失败:', responseData?.msg);
    }
  } catch (error) {
    console.error('获取考核站列表失败:', error);
  } finally {
    loadingExamStations.value = false;
  }
};

// 关闭模态框
const closeModal = () => {
  emit('close');
  emit('update:visible', false);
};

// 保存教师信息
const saveTeacher = () => {
  // 在组件内部进行表单验证
  if (!teacherData.value.account || teacherData.value.account.trim() === '') {
    emit('validation-error', '请输入登录账号');
    return;
  }
  if (!teacherData.value.displayName || teacherData.value.displayName.trim() === '') {
    emit('validation-error', '请输入管理员姓名');
    return;
  }
  if (!teacherData.value.role && teacherData.value.role !== 0) {
    emit('validation-error', '请选择角色');
    return;
  }
  // 密码校验：两者都为 Aa123456（未改动）→ 使用默认密码；任意一方有修改 → 两次输入须一致
  const pwd = (teacherData.value.password || '').trim();
  const pwdConfirm = (passwordConfirm.value || '').trim();
  if (pwd === DEFAULT_PASSWORD && pwdConfirm === DEFAULT_PASSWORD) {
    teacherData.value.password = DEFAULT_PASSWORD; // 使用默认密码
  } else if (pwd !== pwdConfirm) {
    emit('validation-error', '两次输入的密码不一致');
    return;
  } else {
    teacherData.value.password = pwd || (props.isEditMode ? '' : DEFAULT_PASSWORD);
  }

  // 除了总管理员和管理角色外，需要选择考核站
  const roleNum = Number(teacherData.value.role);
  if (roleNum !== 6 && roleNum !== 5) {
    if (!teacherData.value.stationId || teacherData.value.stationId === '') {
      emit('validation-error', '请选择考核站');
      return;
    }
  }
  
  // 如果是管理角色，确保 stationIdsLabel 已设置
  if (roleNum === 5) {
    if (selectedStationIds.value.length === 0) {
      teacherData.value.stationIdsLabel = '';
    } else {
      const selectedStations = examStations.value.filter(s => selectedStationIds.value.includes(s.id));
      teacherData.value.stationIdsLabel = selectedStations.map(s => s.stationName).join(',');
    }
  }
  teacherData.value.role = roleNum;
  emit('save', teacherData.value);
};

// 组件挂载时获取考核站列表
onMounted(() => {
  fetchExamStations();
});
</script>

<style scoped>
/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 4px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.required::before {
  content: "* ";
  color: #ff4d4f;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-sizing: border-box;
}

.input-help {
  margin-top: 5px;
  font-size: 12px;
  color: #999;
}

.station-select-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.station-quick-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.station-quick-actions .btn-link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #409eff;
}
.station-quick-actions .btn-link:hover:not(:disabled) {
  text-decoration: underline;
}
.station-quick-actions .btn-link:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}
.station-quick-actions .action-divider {
  color: #dcdfe6;
}

.select-wrapper {
  position: relative;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.modal-footer {
  padding: 10px 24px;
  text-align: right;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #c70019;
  color: white;
}

.btn-primary:hover {
  background-color: #a30014;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>