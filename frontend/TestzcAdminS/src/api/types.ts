export interface SearchInfo {
  offset?: number // 第几页
  limit?: number // 每页显示几条
  searchWord?: string // 考试列表搜索关键字（姓名/级别关键字）
  name?: string // 用于搜索的名称
  searchTime?: string // 仅日期 YYYY-MM-DD
  searchStartTime?: string // 起始日期 YYYY-MM-DD
  searchEndTime?: string // 截止日期 YYYY-MM-DD
  account?: string // 账号
  teachName?: string // 教师姓名
  teachId?: number // 教师ID
  sgrage?: string
  smajor?: string
  sclass?: string
  content?: string
  type?: number
  id?: number
  examType?: number // 组卷类型：1为自动组卷，2为手动组卷
  status?: number // 组卷派发状态：1为已派发
  stationId?: number // 考核站ID
  auditStatus?: number // 审核状态
  createTimeEnd?: string // 创建时间（入参名 createTimeEnd）YYYY-MM-DD
  jobType?: string // 职业(工种)，与接口返回字段一致
  level?: string // 技能等级
  examMode?: string // 考试模式：online/offline，对应 t_exam.exam_type
  registrationCountMin?: number // 总报名人数下限
  registrationCountMax?: number // 总报名人数上限
  passCountMin?: number // 通过人数下限
  passCountMax?: number // 通过人数上限
  consumeMin?: number // 考试时长下限（分钟）
  consumeMax?: number // 考试时长上限（分钟）
  domain?: number // 题库领域
  questionBankType?: string // 题库类型：resource/competition 等
  ruleType?: number // 试卷用途：0=职业认定 1=竞赛 2=模拟考核（getAllBaseQuestions 按用途筛题库）
}

export interface Response {
  code: number
  msg: string
  data?: any
}
