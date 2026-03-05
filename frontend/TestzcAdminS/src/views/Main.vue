<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="logo">中国中车考核管理工具</div>
      <div class="user-actions">
        <span class="user-role">{{ userRoleName }}</span>
        <span class="user-station" v-if="userStationName">{{ userStationName }}</span>
        <a href="#" class="user-link" @click.prevent="showPersonalCenter">
          <span class="icon">个人中心</span>
        </a>
        <a href="#" class="user-link">
          <span class="icon">{{ user }}</span>
        </a>
      </div>
    </header>

    <div class="main-container">
      <!-- 左侧菜单 -->
      <aside class="sidebar">
        <ul class="menu">
          <!-- 审卷专家(8)：仅显示组卷管理菜单 -->
          <template v-if="isReviewPaperExpert">
            <li class="menu-item" :class="{ active: activeView === '手动组卷' }">
              <a href="#" @click.prevent="setActiveView('手动组卷')">
                <span class="menu-text">组卷管理</span>
              </a>
            </li>
          </template>

          <!-- 考核站管理员(4):按业务流程（人员→申请→竞赛题库/组卷→考试→成绩→证书），含原阅卷专家权限 -->
          <template v-else-if="isExamStationAdmin">
            <li class="menu-item" :class="{ active: activeView === 'student' }">
              <a href="#" @click.prevent="setActiveView('student')">
                <span class="menu-text">职工列表</span>
              </a>
            </li>
            <li class="menu-item" :class="{ active: activeView === '试卷申请' }">
              <a href="#" @click.prevent="setActiveView('试卷申请')">
                <span class="menu-text">试卷申请</span>
              </a>
            </li>
            <li class="menu-item" :class="{ active: activeView === '组卷规则' }">
              <a href="#" @click.prevent="setActiveView('组卷规则')">
                <span class="menu-text">组卷规则</span>
              </a>
            </li>
            <li class="menu-item" :class="{ active: activeView === '考试管理' }">
              <a href="#" @click.prevent="setActiveView('考试管理')">
                <span class="menu-text">考试管理</span>
              </a>
            </li>
            <li class="menu-item" :class="{ active: activeMenu === '考核成绩' && isSubmenuView }">
              <a href="#" @click.prevent="toggleSubmenu('考核成绩')">
                <span class="menu-text">考核成绩</span>
                <span class="menu-arrow" :class="{ 'arrow-down': activeMenu === '考核成绩' }"></span>
              </a>
              <ul class="submenu" v-show="activeMenu === '考核成绩'">
                <li class="submenu-item" :class="{ active: activeView === '查看成绩' }">
                  <a href="#" @click.prevent="setActiveView('查看成绩')">成绩列表</a>
                </li>
              </ul>
            </li>
            <li class="menu-item" :class="{ active: activeView === '证书管理' }">
              <a href="#" @click.prevent="setActiveView('证书管理')">
                <span class="menu-text">证书管理</span>
              </a>
            </li>
            <li class="menu-item" :class="{ active: activeView === '技能考核' }">
              <a href="#" @click.prevent="setActiveView('技能考核')">
                <span class="menu-text">技能考核</span>
              </a>
            </li>
          </template>

          <!-- 管理(5)、总管理员(6)：完整菜单 -->
          <template v-else>
            <!-- ========== 一、基础配置 ========== -->
            <li class="menu-item" :class="{ active: activeMenu === '账号管理' && isSubmenuView }">
              <a href="#" @click.prevent="toggleSubmenu('账号管理')">
                <span class="menu-text">账号管理</span>
                <span class="menu-arrow" :class="{ 'arrow-down': activeMenu === '账号管理' }"></span>
              </a>
              <ul class="submenu" v-show="activeMenu === '账号管理'">
                <li v-if="isAdmin || isManager" class="submenu-item" :class="{ active: activeView === 'teacherList' }">
                  <a href="#" @click.prevent="setActiveView('teacherList')">管理员列表</a>
                </li>
                <li class="submenu-item" :class="{ active: activeView === 'student' }">
                  <a href="#" @click.prevent="setActiveView('student')">职工列表</a>
                </li>
              </ul>
            </li>
            <li class="menu-item" :class="{ active: activeView === '考核站管理' }">
              <a href="#" @click.prevent="setActiveView('考核站管理')">
                <span class="menu-text">考核站管理</span>
              </a>
            </li>
            <li class="menu-item" :class="{ active: activeView === '字典管理' }">
              <a href="#" @click.prevent="setActiveView('字典管理')">
                <span class="menu-text">字典管理</span>
              </a>
            </li>

            <!-- ========== 二、内容准备（组卷规则→题库→组卷） ========== -->
            <li class="menu-item" :class="{ active: activeView === '组卷规则' }">
              <a href="#" @click.prevent="setActiveView('组卷规则')">
                <span class="menu-text">组卷规则</span>
              </a>
            </li>
            <li class="menu-item" :class="{ active: activeMenu === '资源题库' }">
              <a href="#" @click.prevent="setActiveView('资源题库')">
                <span class="menu-text">资源题库</span>
              </a>
            </li>
            <li class="menu-item" :class="{ active: activeView === '手动组卷' }">
              <a href="#" @click.prevent="setActiveView('手动组卷')">
                <span class="menu-text">组卷管理</span>
              </a>
            </li>

            <!-- ========== 三、考试与派发 ========== -->
            <li v-if="isAdmin || isManager" class="menu-item" :class="{ active: activeView === '考试管理' }">
              <a href="#" @click.prevent="setActiveView('考试管理')">
                <span class="menu-text">考试管理</span>
              </a>
            </li>
            <li v-if="isAdmin || isManager" class="menu-item" :class="{ active: activeView === '试卷申请' }">
              <a href="#" @click.prevent="setActiveView('试卷申请')">
                <span class="menu-text">试卷申请</span>
              </a>
            </li>

            <!-- ========== 四、结果与证书 ========== -->
            <li class="menu-item" :class="{ active: activeMenu === '考核成绩' && isSubmenuView }">
              <a href="#" @click.prevent="toggleSubmenu('考核成绩')">
                <span class="menu-text">考核成绩</span>
                <span class="menu-arrow" :class="{ 'arrow-down': activeMenu === '考核成绩' }"></span>
              </a>
              <ul class="submenu" v-show="activeMenu === '考核成绩'">
                <li class="submenu-item" :class="{ active: activeView === '查看成绩' }">
                  <a href="#" @click.prevent="setActiveView('查看成绩')">成绩列表</a>
                </li>
              </ul>
            </li>
            <li v-if="isAdmin || isManager" class="menu-item" :class="{ active: activeView === '证书管理' }">
              <a href="#" @click.prevent="setActiveView('证书管理')">
                <span class="menu-text">证书管理</span>
              </a>
            </li>
            <li v-if="isAdmin || isManager" class="menu-item" :class="{ active: activeView === '技能考核' }">
              <a href="#" @click.prevent="setActiveView('技能考核')">
                <span class="menu-text">技能考核</span>
              </a>
            </li>

            <!-- ========== 六、系统监控 ========== -->
            <li v-if="isAdmin || isManager" class="menu-item" :class="{ active: activeView === '日志监控' || activeView === '日志详情' }">
              <a href="#" @click.prevent="setActiveView('日志监控')">
                <span class="menu-text">日志监控</span>
              </a>
            </li>

            <!-- 考试人员管理 -->
            <!-- <li class="menu-item" :class="{ active: activeView === '考试人员管理' }">
              <a href="#" @click.prevent="setActiveView('考试人员管理')">
                <span class="menu-text">考试人员管理</span>
              </a>
            </li> -->


            <!-- 考试试卷 - 已隐藏，通过点击报名人数进入 -->
            <!-- <li class="menu-item" :class="{ active: activeView === '考试试卷' }">
            <a href="#" @click.prevent="setActiveView('考试试卷')">
              <span class="menu-text">报名人员管理</span>
            </a>
          </li> -->
          </template>
        </ul>
      </aside>

      <!-- 主内容区域 - 根据选择的视图显示不同组件 -->
      <main class="content">
        <!-- 面包屑导航 -->
        <div class="breadcrumb" v-if="activeView">
          <span>{{ getBreadcrumbText() }}</span>
        </div>
        
        <!-- 组件显示区域：由路由驱动，子页面懒加载；成绩详情仍由本地状态控制 -->
        <StudentScore
          v-if="route && route.name === 'HomeScore' && showScoreDetail"
          :from-score-entry="true"
          :initial-teach-exam-id="selectedTeachExamIdForScore"
          @back-to-score-entry="handleBackToScoreEntry"
        />
        <router-view v-else @go-to-detail="handleGoToScoreDetail" />
      </main>
    </div>

    <!-- 个人中心对话框 -->
    <div class="modal-overlay" v-if="isPersonalCenterVisible" @mousedown.self="closePersonalCenter">
      <div class="modal-container" @click.stop>
        <div class="modal-body">
          <div class="form-group">
            <label>账号</label>
            <input type="text" class="form-input" v-model="userAccount" disabled />
          </div>

          <div class="form-group">
            <label>密码</label>
            <input type="password" class="form-input" v-model="currentPassword" disabled />
          </div>

          <div class="form-group">
            <label>新密码</label>
            <input type="password" class="form-input" v-model="newPassword" placeholder="输入新密码" />
            <div class="input-help">是否需要更换密码?</div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closePersonalCenter">取消</button>
            <button class="btn btn-primary" @click="savePersonalInfo">确定</button>
          </div>

          <div class="logout-button-container">
            <button class="btn btn-logout" @click="logout">退出账号</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, provide } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { updatePassword, logout as logoutApi } from "@/api/user";
import {
  ROLE_EXAM_STATION_ADMIN,
  ROLE_MANAGER,
  ROLE_REVIEW_EXPERT,
  toRoleNumber,
  isRole,
  getRoleLabel
} from "@/constants/role";
import { VIEW_ROUTE_NAMES } from "@/router";
import StudentScore from "./StudentScore.vue";

export default {
  components: { StudentScore },
  setup() {
    const router = useRouter();
    const route = useRoute();
    // 当前激活的菜单（仅用于侧栏展开状态，视图由路由驱动）
    const activeMenu = ref("");
    const logDetailAccount = ref("");
    const logDetailOperatorName = ref("");
    // 成绩列表内：是否显示详情页（仍用本地状态，不占路由）
    const showScoreDetail = ref(false);
    // 从成绩列表第一页点击「考试详情」传入的 teachExamId，用于第二页 /api/exam/list 必填条件
    const selectedTeachExamIdForScore = ref(null);

    // 2.3 地址与视图同步：由路由 path/meta 驱动 activeView
    const activeView = computed(() => {
      const view = route.meta?.view != null ? String(route.meta.view) : "";
      if (route.name === "HomeExamApplicants") return "考试管理";
      return view;
    });
    const showApplicantsFromExam = computed(() => route.name === "HomeExamApplicants");
    const directTeachExamId = computed(() =>
      route.name === "HomeExamApplicants" ? route.params.examId ?? null : null
    );
    // 路由变化时同步侧栏展开状态（便于刷新或直接打开链接时菜单正确）
    watch(
      () => activeView.value,
      (view) => {
        if (view === "student" || view === "teacherList") activeMenu.value = "账号管理";
        else if (view === "查看成绩" || view === "成绩分析") activeMenu.value = "考核成绩";
        else if (view === "自动组卷" || view === "手动组卷" || view === "历史手动组卷") activeMenu.value = "组卷管理";
        else if (view === "资源题库") activeMenu.value = "资源题库";
        else if (view !== "日志详情") activeMenu.value = "";
      },
      { immediate: true }
    );

    // 按角色可访问的视图（仅四类角色）
    const getAllowedViewsByRole = (role) => {
      const r = toRoleNumber(role);
      if (r === ROLE_MANAGER) return null; // 总管理：不限制
      if (r === ROLE_EXAM_STATION_ADMIN) return ['student', '试卷申请', '组卷规则', '考试管理', '查看成绩', '证书管理', '技能考核'];
      if (r === ROLE_REVIEW_EXPERT) return ['手动组卷'];
      return [];
    };

    const canAccessView = (view) => {
      const userStr = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('user') : null;
      const role = userStr ? (JSON.parse(userStr || '{}').role) : undefined;
      const allowed = getAllowedViewsByRole(role);
      if (allowed === null) return true; // 管理/总管理
      if (view === "日志详情") return allowed === null; // 与日志监控同权（仅管理/总管理）
      return Array.isArray(allowed) && allowed.includes(view);
    };

    // 仅恢复侧栏展开状态；当前视图由 URL 驱动，不再从 localStorage 恢复
    const restoreState = () => {
      const savedMenu = localStorage.getItem("activeMenu");
      if (savedMenu) activeMenu.value = savedMenu;
    };

    // 保存侧栏状态；activeView 由路由同步到 URL，可选保存便于兼容
    const saveState = () => {
      localStorage.setItem("activeMenu", activeMenu.value);
      if (activeView.value) localStorage.setItem("activeView", activeView.value);
    };

    // 设置一个标记，用于区分页面刷新和关闭
    const setPageRefreshFlag = () => {
      sessionStorage.setItem("pageRefreshFlag", "true");
    };

    // 检查用户是否已登录
    const checkUserAuthentication = () => {
      // 检查是否是页面刷新
      const isPageRefresh =
        sessionStorage.getItem("pageRefreshFlag") === "true";

      // 如果是页面刷新，清除标记并继续
      if (isPageRefresh) {
        sessionStorage.removeItem("pageRefreshFlag");
        return true;
      }

      // 如果不是页面刷新，检查用户是否已登录
      const userStr = sessionStorage.getItem("user");
      if (!userStr) {
        // 如果没有用户信息，重定向到登录页面
        router.push("/login");
        return false;
      }
      return true;
    };

    // 初始化用户信息
    const users = sessionStorage.getItem("user")
      ? JSON.parse(sessionStorage.getItem("user") || "{}")
      : {};
    const user = users.teachName || "";

    const isAdmin = computed(() => isRole(users.role, ROLE_MANAGER));
    const isManager = computed(() => isRole(users.role, ROLE_MANAGER));
    const isReviewPaperExpert = computed(() => isRole(users.role, ROLE_REVIEW_EXPERT));
    const isExamStationAdmin = computed(() => isRole(users.role, ROLE_EXAM_STATION_ADMIN));
    const getRoleName = (role) => getRoleLabel(role);

    // 当前用户角色名称
    const userRoleName = computed(() => {
      return getRoleName(users.role);
    });

    // 当前用户考核站名称
    const userStationName = computed(() => {
      return users.stationName || '';
    });

    // 个人中心相关
    const isPersonalCenterVisible = ref(false);
    const userAccount = ref(users.account || "");
    const currentPassword = ref("Aa123456"); // 默认密码
    const newPassword = ref("");

    // 计算属性：判断当前视图是否属于子菜单
    const isSubmenuView = computed(() => {
      return ["teacherList", "student", "查看成绩", "成绩分析", "自动组卷", "手动组卷"].includes(
        activeView.value
      );
    });

    const defaultView = ref(
      isAdmin.value ? "teacherList" :
      isReviewPaperExpert.value ? "手动组卷" :
      isExamStationAdmin.value ? "student" :
      "student"
    );

    // 切换子菜单显示状态
    const toggleSubmenu = menu => {
      // 如果点击的是当前已激活的菜单，则关闭它
      if (activeMenu.value === menu) {
        activeMenu.value = "";
        saveState(); // 保存状态
        return;
      }

      // 否则，打开点击的菜单
      activeMenu.value = menu;

      // 根据选择的菜单设置默认视图
      switch (menu) {
        case "账号管理":
          // 如果是管理员或管理角色，默认显示管理员列表，否则显示职工列表
          if (isAdmin.value || isManager.value) {
            setActiveView("teacherList");
          } else {
            setActiveView("student");
          }
          break;
        case "考核成绩":
          setActiveView("查看成绩");
          break;
        case "组卷管理":
          setActiveView(isReviewPaperExpert.value ? "手动组卷" : "自动组卷");
          break;
          // case "历史组卷管理":
          //   setActiveView("自动组卷");
          break;
        default:
          // 其他菜单暂时没有默认视图
          break;
      }
      
      saveState(); // 保存状态
    };

    // 日志详情：通过路由 query 传递 account/operatorName，便于刷新、分享
    const openLogDetail = (account, operatorName) => {
      logDetailAccount.value = account || "";
      logDetailOperatorName.value = operatorName || "";
      router.push({
        name: "HomeLogDetail",
        query: { account: logDetailAccount.value, operatorName: logDetailOperatorName.value },
      });
      activeMenu.value = "";
      saveState();
    };
    provide("openLogDetail", openLogDetail);

    // 成绩列表第一页点「考试详情」：传入 teachExamId，第二页 exam/list 必填
    const handleGoToScoreDetail = (exam) => {
      selectedTeachExamIdForScore.value = exam?.teachExamId ?? exam?.id ?? null;
      showScoreDetail.value = true;
    };
    const handleBackToScoreEntry = () => {
      selectedTeachExamIdForScore.value = null;
      showScoreDetail.value = false;
    };

    // 2.3 用路由驱动视图：菜单点击时 router.push，URL 与视图同步
    const setActiveView = (view) => {
      if (!canAccessView(view)) {
        ElMessage.warning("无权限访问该页面");
        return;
      }
      if (view === "查看成绩") showScoreDetail.value = false;
      if (view === "考试管理") {
        sessionStorage.removeItem("showApplicantsFromExam");
        sessionStorage.removeItem("applicantsParams");
        sessionStorage.removeItem("fromExamManagement");
      }
      const name = VIEW_ROUTE_NAMES[view];
      if (name) router.push({ name });

      if (view === "student" || view === "teacherList") activeMenu.value = "账号管理";
      else if (view === "查看成绩" || view === "成绩分析") activeMenu.value = "考核成绩";
      else if (view === "日志详情") activeMenu.value = "";
      else if (view === "自动组卷" || view === "手动组卷" || view === "历史手动组卷") activeMenu.value = "组卷管理";
      else if (view === "资源题库") activeMenu.value = "资源题库";
      else activeMenu.value = "";
      saveState();
    };

    // 从考试管理跳转报名人员：改为路由跳转，URL 带 examId，刷新不丢失
    const handleNavigateToApplicants = () => {
      const params = sessionStorage.getItem("applicantsParams");
      if (params) {
        try {
          const parsed = JSON.parse(params);
          const examId = parsed.examId;
          if (parsed.fromExamManagement && examId) {
            router.push({ name: "HomeExamApplicants", params: { examId: String(examId) } });
            activeMenu.value = "";
            saveState();
          } else {
            setActiveView("考试试卷");
          }
        } catch (e) {
          console.error("解析报名人员参数失败:", e);
          setActiveView("考试试卷");
        }
      } else {
        setActiveView("考试试卷");
      }
    };

    // 获取面包屑文本
    const getBreadcrumbText = () => {
      if (activeView.value === "手动组卷") {
        return "组卷管理";
      }
      let breadcrumb = "";

      // 添加父级菜单（如果有）
      if (activeMenu.value && isSubmenuView.value) {
        breadcrumb += `${activeMenu.value} / `;
      }

      // 添加当前视图
      switch (activeView.value) {
        case "student":
          breadcrumb += "职工列表";
          break;
        case "teacherList":
          breadcrumb += "管理员列表";
          break;
        case "资源题库":
          breadcrumb += "资源题库";
          break;
        case "自动组卷":
          breadcrumb += "自动组卷";
          break;
        case "手动组卷":
          breadcrumb += "手动组卷";
          break;
        case "历史手动组卷":
          breadcrumb += "历史手动组卷";
          break;
        case "考试试卷":
          // 如果是从考试管理页面进入的，显示"考试管理"
          if (showApplicantsFromExam.value) {
            breadcrumb += "考试管理";
          } else {
            breadcrumb += "考试试卷";
          }
          break;
        case "查看成绩":
          breadcrumb += "成绩列表";
          break;
        case "成绩分析":
          breadcrumb += "成绩分析";
          break;
        case "考试人员管理":
          breadcrumb += "考试人员管理";
          break;
        case "字典管理":
          breadcrumb += "字典管理";
          break;
        case "考核站管理":
          breadcrumb += "考核站管理";
          break;
        case "证书管理":
          breadcrumb += "证书管理";
          break;
        case "日志监控":
          breadcrumb += "日志监控";
          break;
        case "日志详情":
          breadcrumb += "日志监控 / 日志详情";
          break;
        case "考试管理":
          breadcrumb += "考试管理";
          break;
        case "组卷规则":
          breadcrumb += "组卷规则";
          break;
        case "技能考核":
          breadcrumb += "技能考核";
          break;
        default:
          breadcrumb += "";
      }

      return breadcrumb;
    };

    // 显示个人中心对话框
    const showPersonalCenter = () => {
      isPersonalCenterVisible.value = true;
    };

    // 关闭个人中心对话框
    const closePersonalCenter = () => {
      isPersonalCenterVisible.value = false;
      newPassword.value = ""; // 清空新密码输入
    };

    // 保存个人信息
    const savePersonalInfo = async () => {
      if (!newPassword.value || newPassword.value.trim() === "") {
        ElMessage.warning("请输入新密码");
        return;
      }
      try {
        const response = await updatePassword(newPassword.value.trim());
        if (response && response.code === 200) {
          ElMessage.success(response.msg || "密码修改成功，请重新登录");
          closePersonalCenter();
          // 修改密码后默认退出，清除登录状态并跳转登录页
          try {
            await logoutApi();
          } catch (e) {
            console.error("退出登录接口调用失败:", e);
          }
          sessionStorage.removeItem("isAuthenticated");
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("majorOptions");
          sessionStorage.removeItem("classOptions");
          sessionStorage.removeItem("gradeOptions");
          sessionStorage.removeItem("pageRefreshFlag");
          localStorage.removeItem("token");
          localStorage.removeItem("activeMenu");
          localStorage.removeItem("activeView");
          router.push("/login");
        } else {
          ElMessage.error(response?.msg || "密码修改失败");
        }
      } catch (error) {
        console.error("密码修改失败:", error);
        ElMessage.error("密码修改失败，请稍后重试");
      }
    };

    // 退出登录
    const logout = () => {
      ElMessageBox.confirm("确定要退出登录吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          // 调用退出登录接口，记录日志信息
          try {
            await logoutApi();
          } catch (error) {
            console.error("退出登录接口调用失败:", error);
          }
          // 清除本地存储
          sessionStorage.removeItem("isAuthenticated");
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("majorOptions");
          sessionStorage.removeItem("classOptions");
          sessionStorage.removeItem("gradeOptions");
          sessionStorage.removeItem("pageRefreshFlag");
          localStorage.removeItem("token");
          // 清除保存的组件状态
          localStorage.removeItem("activeMenu");
          localStorage.removeItem("activeView");
          router.push("/login");
        })
        .catch(() => {
          // 用户点击了取消
          console.log("取消退出");
        });
    };

    // 处理页面关闭事件
    const handleBeforeUnload = () => {
      // 在页面刷新前设置标记
      setPageRefreshFlag();
    };

    // 组件挂载时：恢复侧栏状态，审卷专家默认到组卷管理
    onMounted(() => {
      if (!checkUserAuthentication()) return;
      restoreState();
      // 审卷专家从 /home 进入时默认到组卷管理（当前 redirect 到 workers，这里再替换）
      if (route.name === "HomeWorkers" && isReviewPaperExpert.value) {
        router.replace({ name: "HomePaperManage" });
      }
      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("navigateToApplicants", handleNavigateToApplicants);
      const handleNavigateToExamManagement = () => {
        router.push({ name: "HomeExam" });
      };
      window.addEventListener("navigateToExamManagement", handleNavigateToExamManagement);
      window._handleNavigateToExamManagement = handleNavigateToExamManagement;
    });

    // 处理页面可见性变化
    const handleVisibilityChange = () => {
      // 当页面隐藏时（可能是关闭或切换到其他标签）
      if (document.visibilityState === "hidden") {
        // 移除刷新标记，这样如果用户关闭页面后再次打开，将被视为新会话
        sessionStorage.removeItem("pageRefreshFlag");
      }
    };

    // 组件卸载时移除事件监听器
    onUnmounted(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("navigateToApplicants", handleNavigateToApplicants);
      if (window._handleNavigateToExamManagement) {
        window.removeEventListener("navigateToExamManagement", window._handleNavigateToExamManagement);
        delete window._handleNavigateToExamManagement;
      }
    });

    return {
      route,
      activeMenu,
      activeView,
      router,
      user,
      isAdmin,
      isManager,
      isReviewPaperExpert,
      isExamStationAdmin,
      userRoleName,
      userStationName,
      isPersonalCenterVisible,
      userAccount,
      currentPassword,
      newPassword,
      isSubmenuView,
      defaultView,
      toggleSubmenu,
      setActiveView,
      getBreadcrumbText,
      showPersonalCenter,
      closePersonalCenter,
      savePersonalInfo,
      logout,
      directTeachExamId,
      showApplicantsFromExam,
      showScoreDetail,
      selectedTeachExamIdForScore,
      logDetailAccount,
      logDetailOperatorName,
      handleGoToScoreDetail,
      handleBackToScoreEntry
    };
  }
};
</script>

<style scoped>
.app-container {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #050505;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
}

/* 顶部导航栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #2c3e50;
  color: white;
}

.logo {
  font-size: 18px;
  font-weight: bold;
}

.user-actions {
  display: flex;
  gap: 20px;
}

.user-link {
  color: white;
  text-decoration: none;
}

.user-role {
  color: white;
  font-weight: 500;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 14px;
}

.user-station {
  color: white;
  font-weight: 400;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-size: 13px;
  margin-left: 8px;
}

/* 主容器 */
.main-container {
  display: flex;
  flex: 1;
}

/* 侧边栏 */
.sidebar {
  width: 180px;
  min-width: 180px;
  background-color: #f5f7fa;
  border-right: 1px solid #eee;
}

.menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  padding: 0;
  border-bottom: 1px solid #eee;
}

.menu-item>a {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: #333;
  text-decoration: none;
  transition: background-color 0.3s;
  font-weight: 500;
}

.menu-icon {
  margin-right: 8px;
}

.menu-text {
  flex: 1;
}

.menu-arrow {
  font-size: 12px;
  transition: transform 0.3s;
}

.arrow-down {
  transform: rotate(90deg);
}

.menu-item>a:hover {
  background-color: #e6f7ff;
}

.menu-item.active>a {
  background-color: var(--color-primary-brand);
  color: white;
}

.submenu {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: var(--color-bg-light);
}

.submenu-item {
  padding: 0;
}

.submenu-item a {
  display: block;
  padding: 10px 20px 10px 40px;
  color: var(--color-text-primary);
  text-decoration: none;
  transition: background-color 0.3s;
  font-size: 14px;
}

.submenu-item a:hover {
  background-color: var(--color-primary-bg);
}

.submenu-item.active a {
  color: var(--color-primary-brand);
  background-color: #fbfdfd;
  border-right: 3px solid var(--color-primary-brand);
}

/* 内容区域 */
.content {
  flex: 1;
  background-color: #fff;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* 面包屑导航 */
.breadcrumb {
  padding: 16px 24px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #666;
}

/* 个人中心模态框 */
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
  width: 400px;
  max-width: 90%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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

.form-input {
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

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.logout-button-container {
  margin-top: 20px;
  text-align: center;
}

.btn-logout {
  background-color: var(--color-primary);
  color: white;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #eee;
  }

  .submenu-item a {
    padding-left: 30px;
  }
}
</style>
