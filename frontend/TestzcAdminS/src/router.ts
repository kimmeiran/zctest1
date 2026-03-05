import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

/** 白名单：未登录也可访问 */
const PUBLIC_PATHS = ["/login", "/preview"];
/** 带动态段的预览/派发页（未登录可能也允许，按需可加入白名单） */
const isPublicPath = (path: string) =>
  PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

/** 校验登录态：token 或 sessionStorage 中的 user */
function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  if (token) return true;
  const user = sessionStorage.getItem("user");
  return !!user;
}

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("./views/Login.vue"),
  },
  {
    path: "/home",
    name: "Main",
    component: () => import("./views/Main.vue"),
    redirect: "/home/account/workers",
    children: [
      {
        path: "account/workers",
        name: "HomeWorkers",
        component: () => import("./views/student/index.vue"),
        meta: { view: "student" },
      },
      {
        path: "account/teachers",
        name: "HomeTeachers",
        component: () => import("./views/account/index.vue"),
        meta: { view: "teacherList" },
      },
      {
        path: "question-bank",
        name: "HomeQuestionBank",
        component: () => import("./views/BasicExamManage.vue"),
        meta: { view: "资源题库", title: "资源题库" },
        props: (route) => ({ title: (route.meta?.title as string) || "资源题库" }),
      },
      {
        path: "paper-manage",
        name: "HomePaperManage",
        component: () => import("./views/new/PaperManagement2.vue"),
        meta: { view: "手动组卷" },
      },
      {
        path: "paper-rule",
        name: "HomePaperRule",
        component: () => import("./views/questionGroupRule/QuestionGroupRule.vue"),
        meta: { view: "组卷规则" },
      },
      {
        path: "exam",
        name: "HomeExam",
        component: () => import("./views/exam/ExamManagement.vue"),
        meta: { view: "考试管理" },
      },
      {
        path: "exam/applicants/:examId",
        name: "HomeExamApplicants",
        component: () => import("./views/teachExam/ExamPapers.vue"),
        meta: { view: "考试管理", applicants: true },
      },
      {
        path: "paper-apply",
        name: "HomePaperApply",
        component: () => import("./views/paperApplication/PaperApplication.vue"),
        meta: { view: "试卷申请" },
      },
      {
        path: "score",
        name: "HomeScore",
        component: () => import("./views/studentScore/ScoreListEntry.vue"),
        meta: { view: "查看成绩" },
      },
      {
        path: "certificate",
        name: "HomeCertificate",
        component: () => import("./views/certificate/CertificateManagement.vue"),
        meta: { view: "证书管理" },
      },
      {
        path: "skill-exam",
        name: "HomeSkillExam",
        component: () => import("./views/SkillExam.vue"),
        meta: { view: "技能考核" },
      },
      {
        path: "station",
        name: "HomeStation",
        component: () => import("./views/examStation/index.vue"),
        meta: { view: "考核站管理" },
      },
      {
        path: "dictionary",
        name: "HomeDictionary",
        component: () => import("./views/DictionaryManagement.vue"),
        meta: { view: "字典管理" },
      },
      {
        path: "log",
        name: "HomeLog",
        component: () => import("./views/OperationLog.vue"),
        meta: { view: "日志监控" },
      },
      {
        path: "log-detail",
        name: "HomeLogDetail",
        component: () => import("./views/LogDetail.vue"),
        meta: { view: "日志详情" },
      },
    ],
  },
  {
    path: "/preview",
    name: "FilePreview",
    component: () => import("./views/FilePreview.vue"),
  },
  {
    path: "/exam-distribute/:examId",
    name: "ExamDistribute",
    component: () => import("./views/exam/ExamDistributePage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 2.2 全局路由守卫：校验 token/登录态，未登录重定向 /login
router.beforeEach((to, _from, next) => {
  if (isPublicPath(to.path)) {
    next();
    return;
  }
  if (!isAuthenticated()) {
    next({ path: "/login", query: to.path !== "/" ? { redirect: to.fullPath } : undefined });
    return;
  }
  next();
});

export default router;

/** 视图名 -> 路由 name，供 Main 内 setActiveView 使用 */
export const VIEW_ROUTE_NAMES: Record<string, string> = {
  student: "HomeWorkers",
  teacherList: "HomeTeachers",
  资源题库: "HomeQuestionBank",
  手动组卷: "HomePaperManage",
  组卷规则: "HomePaperRule",
  考试管理: "HomeExam",
  试卷申请: "HomePaperApply",
  查看成绩: "HomeScore",
  证书管理: "HomeCertificate",
  技能考核: "HomeSkillExam",
  考核站管理: "HomeStation",
  字典管理: "HomeDictionary",
  日志监控: "HomeLog",
  日志详情: "HomeLogDetail",
};
