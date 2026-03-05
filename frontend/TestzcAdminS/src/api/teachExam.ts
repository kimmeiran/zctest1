import request from "@/utils/request"
import { SearchInfo, Response } from './types'

// 组卷类型定义
export interface TeachExam {
  id?: number
  teachId?: string
  jobType: string // 工种
  level: string // 级别
  desc?: string // 描述
  status?: number
  startTime?: string
  endTime?: string
  passScore?: number | string
  consume?: string
  createId?: string
  updateId?: string
  createTime?: string
  updateTime?: string
  examType?: number // 组卷类型：1为自动组卷，2为手动组卷
  createAccount?: string // 创建人账号
  auditStatus?: number | null
  deleteAuditStatus?: number | null
  pageHeader?: string // 页眉
  mainTitle?: string // 主标题
  subTitle?: string // 副标题
}

// 更新组卷并重新设置题目 - 新接口
export interface TeachExamUpdateRequest {
  id: number
  teachId: string
  level: string
  jobType: string
  desc: string
  createTime: string
  questions: Array<{
    id: string
    score: number
  }>
}

// 派发组卷 - 更新为新的API接口
export interface DistributeExam {
  idList: number[]
  startTime: string
  endTime: string
  consume: string
}

// 学生成绩类型定义
export interface StudentScore {
  id?: number
  studentId: string
  baseScore: string
  majorScore: string
  consume: string
  totalScore: string
  teachId: number
  teachExamId: string
  tgrade?: string
  tmajor?: string
}

// 考试成绩汇总接口
export interface StudentsExamTotal {
  id?: number
  studentId?: string
  baseScore?: string
  majorScore?: string
  consume?: string
  totalScore?: number
  teachId?: string
  teachExamId?: string
  tgrade: string
  tmajor: string
  submitTime?: string
  subjectiveTotalScore?: number
  objectiveTotalScore?: number
}

// 考试成绩汇总响应接口
export interface ExamTotalResponse {
  code: number
  msg: string
  data: StudentsExamTotal
}

// 考试题目结果接口
export interface StudentsExamResult {
  questionType?: number
  questionName?: string
  questionContent?: string
  answera?: string
  answerb?: string
  answerc?: string
  answerd?: string
  answer?: string
  score?: number
  studentAnser?: string
  teachExamId?: string
  sort?: number
}

// 考试题目结果响应接口
export interface ExamDetailResponse {
  code: number
  msg: string
  data: StudentsExamResult[]
}

// 保存主观题分数接口
export interface SaveSubjectiveScoreParams {
  id: number; // 学生考试题答案id
  score: number; // 分数
  studentId: string; // 学生ID
  examId: number; // 考试ID（新考试表的examId）
}

// 自动组卷V3接口 - 根据前端传入的各题型及各领域数量和分数进行出题
export interface ConstructExamV3Params {
  jobType: string; // 工种
  level: string; // 级别
  desc: string; // 描述
  pageHeader?: string; // 页眉
  mainTitle?: string; // 主标题
  subTitle?: string; // 副标题
  questionTypes: Array<{
    type: number; // 题型类型：0填空 1单选 2多选 3判断 4简答 5综合
    count: number; // 该题型总题目数量
    score: number; // 该题型每题分值
    domains: Array<{
      domain: string; // 领域名称
      count: number; // 该领域题目数量
      percentage: number; // 该领域占比百分比
    }>;
  }>;
}

// 获取组卷列表 - 更新为匹配新的请求/响应格式
export const getExamList = async (searchInfo: SearchInfo): Promise<Response> => {
  try {
    // 构建符合API要求的请求参数（仅在前端选择时才传 examType）
    const requestData: any = {
      name: searchInfo.name || "",
      offset: searchInfo.offset || 0,
      limit: searchInfo.limit || 10,
    }
    if (searchInfo.examType !== undefined && searchInfo.examType !== null && searchInfo.examType !== ("" as any)) {
      requestData.examType = searchInfo.examType
    }
    if (searchInfo.status !== undefined && searchInfo.status !== null && searchInfo.status !== ("" as any)) {
      requestData.status = searchInfo.status
    }
    if (searchInfo.stationId !== undefined && searchInfo.stationId !== null) {
      requestData.stationId = searchInfo.stationId
    }
    // 审核状态：1-审核通过，仅在传入时才作为筛选条件
    if (
      searchInfo.auditStatus !== undefined &&
      searchInfo.auditStatus !== null &&
      searchInfo.auditStatus !== ("" as any)
    ) {
      requestData.auditStatus = searchInfo.auditStatus
    }
    // 职业(工种)、技能等级：与接口返回字段一致
    const jobTypeVal = searchInfo.jobType ?? (searchInfo as any).questionType
    if (jobTypeVal !== undefined && jobTypeVal !== null && jobTypeVal !== "") {
      requestData.jobType = jobTypeVal
    }
    if (searchInfo.level !== undefined && searchInfo.level !== null && searchInfo.level !== "") {
      requestData.level = searchInfo.level
    }
    // 创建时间（入参 createTimeEnd）
    if (searchInfo.createTimeEnd) {
      requestData.createTimeEnd = searchInfo.createTimeEnd
    }

    const response = await request.post(`/api/teachExam/getAll`, requestData)
    return response.data
  } catch (error) {
    console.error("获取组卷列表失败:", error)
    throw error
  }
}

// 根据ID获取组卷详情
export const getExamById = async (id: number): Promise<Response> => {
  try {
    const response = await request.get(`/api/teachExam/getById`, {
      params: { id },
      
    })
    return response.data
  } catch (error) {
    console.error("获取组卷详情失败:", error)
    throw error
  }
}

// 添加组卷 - 更新为新的API接口
export const constructExam = async (exam: TeachExam): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/construct`, exam)
    return response.data
  } catch (error) {
    console.error("组卷失败:", error)
    throw error
  }
}

// 自动组卷v2版本 - 根据技能等级自动获取题目数量
export const constructExamV2 = async (exam: TeachExam): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/constructV2`, exam)
    return response.data
  } catch (error) {
    console.error("自动组卷v2失败:", error)
    throw error
  }
}

// 自动组卷V3接口
export const constructExamV3 = async (params: ConstructExamV3Params): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/constructV3`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('自动组卷V3失败:', error);
    throw error;
  }
};

// 手动组卷 - 新增API接口
export const constructManualExam = async (exam: TeachExam): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/constructManual`, exam)
    return response.data
  } catch (error) {
    console.error("手动组卷失败:", error)
    throw error
  }
}

// 更新组卷 - 更新为新的API接口
export const updateExam = async (exam: TeachExam): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/update`, exam)
    return response.data
  } catch (error) {
    console.error("更新组卷失败:", error)
    throw error
  }
}

// ===== 组卷规则（t_question_group_rule）相关 =====
// 根据等级获取第一条规则。组卷管理/自动组卷调用时必须传 ruleType：0=职业认定 1=竞赛 2=模拟考核
export const getQuestionGroupRuleByLevel = async (params: string | number | { level: string | number, paperPurpose?: string, ruleType?: number | string }): Promise<Response> => {
  try {
    // 向后兼容：如果传入的是字符串/数字，作为level处理；如果是对象，直接使用
    const queryParams = typeof params === 'object' ? params : { level: params }
    const response = await request.get(`/api/questionGroupRule/getByLevel`, {
      params: queryParams,
      
    })
    return response.data
  } catch (error) {
    console.error("获取组卷规则失败:", error)
    throw error
  }
}

/** 从 t_teach_exam 表获取试卷用途（rule_type）去重列表，供"试卷用途"下拉字典项使用。返回 data 为 string[]（如 CAREER_CERTIFICATION/COMPETITION/MOCK_EXAM） */
export const getTeachExamRuleTypeOptions = async (): Promise<Response> => {
  try {
    const response = await request.get(`/api/teachExam/ruleTypeOptions`)
    return response.data
  } catch (error) {
    console.error("获取试卷用途字典失败:", error)
    throw error
  }
}

/** 考试记录用可选组卷列表。ruleType: 0-职业认定 1-竞赛；stationId 可选，职业认定可不传，竞赛必传（考核站ID，从缓存 user.stationId 取） */
export const listPapersForExamRecord = async (params: { ruleType: number; stationId?: number | null }): Promise<Response> => {
  const response = await request.post(`/api/teachExam/listPapersForExamRecord`, params)
  return response.data
}

// 规则列表（如果需要）
export const listQuestionGroupRules = async (): Promise<Response> => {
  try {
    const response = await request.get(`/api/questionGroupRule/list`)
    return response.data
  } catch (error) {
    console.error("获取组卷规则列表失败:", error)
    throw error
  }
}

export const updateExamWithQuestions = async (data: TeachExamUpdateRequest): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/updateWithQuestions`, data)
    return response.data
  } catch (error) {
    console.error("更新组卷题目失败:", error)
    throw error
  }
}

// 删除组卷
export const deleteExam = async (id: string): Promise<Response> => {
  try {
    const response = await request.delete(`/api/teachExam/delete`, {
      params: { id },
      
    })
    return response.data
  } catch (error) {
    console.error("删除组卷失败:", error)
    throw error
  }
}

// 批量删除组卷 - 新增API接口
export const deleteBatchExam = async (idList: number[]): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/deleteBatch`, idList)
    return response.data
  } catch (error) {
    console.error("批量删除组卷失败:", error)
    throw error
  }
}

export const distributeExam = async (distributeData: DistributeExam): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/distribute`, distributeData)
    return response.data
  } catch (error) {
    console.error("派发组卷失败:", error)
    throw error
  }
}

/** 批量派发（考核站+试卷申请联动）：batchId=试卷申请id, paperIds=试卷id列表, stationId, curAccount, role */
export const batchDistribution = async (data: {
  batchId: string
  paperIds: number[]
  stationId: string
  curAccount: string
  role: number
}): Promise<any> => {
  const response = await request.post(`/api/teachExam/batchDistribution`, data)
  return response.data
}

/** 试卷申请模板下载：GET，无参数，返回模板文件 blob */
export const downloadExamApplyTemplate = async (): Promise<Blob> => {
  const response = await request.get(`/api/teachExam/downloadTemplate`, {
    responseType: 'blob'
  })
  return response.data as Blob
}

/** 下载派发 zip（返回 blob 与文件名，文件名一般为考核站名称+年度.zip） */
export const downloadDispatchZip = async (batchApplicationId: string): Promise<{ blob: Blob; filename: string }> => {
  const response = await request.get(`/api/teachExam/downloadZip`, {
    params: { batchApplicationId },
    responseType: 'blob'
  })
  const blob = response.data as Blob
  let filename = '派发_' + batchApplicationId + '.zip'
  const disp = response.headers?.['content-disposition']
  const m = disp && disp.match(/filename\*=UTF-8''(.+?)(?:;|$)/)
  if (m && m[1]) {
    try {
      filename = decodeURIComponent(m[1].trim())
    } catch (_) {}
  }
  return { blob, filename }
}

/** 获取派发 zip 内试卷名称列表 */
export const getDispatchZipPaperNames = async (batchApplicationId: string): Promise<string[]> => {
  const response = await request.get(`/api/teachExam/dispatchZipPaperNames`, {
    params: { batchApplicationId }
  })
  const data = response?.data
  if (data?.code === 200 && Array.isArray(data?.data)) return data.data
  return []
}

// 提交试卷审核
export const submitExamForAudit = async (id: number): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/submitAudit`, null, {
      params: { id },
      
    })
    return response.data
  } catch (error) {
    console.error("提交试卷审核失败:", error)
    throw error
  }
}

// 审核试卷
export const auditExam = async (id: number, auditStatus: number, auditRemark?: string): Promise<Response> => {
  try {
    const params: any = { 
      id, 
      auditStatus // 1-审核通过，2-审核拒绝
    };
    if (auditRemark !== undefined) {
      params.auditRemark = auditRemark;
    }
    const response = await request.post(`/api/teachExam/audit`, null, {
      params,
      
    })
    return response.data
  } catch (error) {
    console.error("审核试卷失败:", error)
    throw error
  }
}

// 提交试卷删除审批（组卷专家）
export const submitExamDeleteApproval = async (id: number): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/submitDeleteApproval`, null, {
      params: { id },
      
    })
    return response.data
  } catch (error) {
    console.error("提交试卷删除审批失败:", error)
    throw error
  }
}

// 审核试卷删除申请（审卷专家）
export const auditExamDeleteApproval = async (
  id: number,
  deleteAuditStatus: number,
  deleteAuditRemark?: string
): Promise<Response> => {
  try {
    const params: any = {
      id,
      deleteAuditStatus, // 1-删除通过，2-删除拒绝
    }
    if (deleteAuditRemark !== undefined) {
      params.deleteAuditRemark = deleteAuditRemark
    }
    const response = await request.post(`/api/teachExam/auditDeleteApproval`, null, {
      params,
      
    })
    return response.data
  } catch (error) {
    console.error("审核试卷删除申请失败:", error)
    throw error
  }
}

// 获取组卷所有题目（分组）
export const getAllExamPaper = async (teachExamId: string | number): Promise<any> => {
  try {
    const response = await request.get(`/api/teachExam/getAllExamPaper`, {
      params: { teachExamId },
      
    });
    return response.data;
  } catch (error) {
    console.error("获取组卷所有题目失败:", error);
    throw error;
  }
};

// 获取组卷所有题目（分组）
export const getAllExamPaperByExamPaper = async (teachExamId: string | number): Promise<any> => {
  try {
    const response = await request.get(`/api/teachExam/getAllExamPaperByExamPaper`, {
      params: { teachExamId },
      
    });
    return response.data;
  } catch (error) {
    console.error("获取组卷所有题目失败:", error);
    throw error;
  }
};

// 导出组卷PDF
export const exportExamPdf = async (teachExamId: string | number): Promise<Blob> => {
  try {
    const response = await request.get(`/api/teachExam/exportExamPdf`, {
      params: { teachExamId },
      responseType: "blob",
      
    });
    return response.data;
  } catch (error) {
    console.error("导出组卷PDF失败:", error);
    throw error;
  }
};

// 导出组卷Word文档
export const exportExamWord = async (teachExamId: string | number, additionalParams?: any): Promise<Blob> => {
  try {
    const params = { teachExamId, ...additionalParams };
    const response = await request.get(`/api/teachExam/exportExamWord`, {
      params: params,
      responseType: 'blob', // 设置响应类型为blob
      
    });
    return response.data; // 直接返回blob数据
  } catch (error) {
    console.error("导出组卷Word失败:", error);
    throw error;
  }
};

// 导出组卷Word文档
export const exportExamWordNew = async (params: {
  paperId: string | number;
  logoUrl?: string;
  examTitle?: string;
  paperSize?: string;
}): Promise<Blob> => {
  try {
    const form = new URLSearchParams();
    form.append('paperId', String(params.paperId));
    if (params.logoUrl) form.append('logoUrl', params.logoUrl);
    if (params.examTitle) form.append('examTitle', params.examTitle);
    if (params.paperSize) form.append('paperSize', params.paperSize);

    const response = await request.post(`/api/teachExam/exportExamWordNew`, form, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data; // 直接返回blob数据
  } catch (error) {
    console.error("导出组卷Word失败:", error);
    throw error;
  }
};

// 导出A4含答案的Word文档
export const exportExamWordA4Answer = async (params: {
  paperId: string | number;
  logoUrl?: string;
  examTitle?: string;
}): Promise<Blob> => {
  try {
    const response = await request.post(`/api/examAnswer/exportExamWordA4Answer`, params, {
      responseType: 'blob',
      
    });
    return response.data;
  } catch (error) {
    console.error("导出A4含答案Word失败:", error);
    throw error;
  }
};

// 导出A3格式Word文档 - ExamWordA3ExportController接口
export const exportExamWordA3 = async (params: {
  paperId: string | number;
  logoUrl?: string;
  examTitle?: string;
  paperSize?: string;
}): Promise<Blob> => {
  try {
    const form = new URLSearchParams();
    form.append('paperId', String(params.paperId));
    if (params.logoUrl) form.append('logoUrl', params.logoUrl);
    if (params.examTitle) form.append('examTitle', params.examTitle);
    if (params.paperSize) form.append('paperSize', params.paperSize);

    const response = await request.post(`/api/ExamWordA3ExportController/exportA3`, form, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data; // 直接返回blob数据
  } catch (error) {
    console.error("导出A3格式Word失败:", error);
    throw error;
  }
};

// 导出A3横向装订线Word文档 - ExamWordA3ExportV2Controller接口
export const exportExamWordA3WithGutter = async (params: {
  paperId: string | number;
  logoUrl?: string;
  examTitle?: string;
  paperSize?: string;
}): Promise<Blob> => {
  try {
    const form = new URLSearchParams();
    form.append('paperId', String(params.paperId));
    if (params.logoUrl) form.append('logoUrl', params.logoUrl);
    if (params.examTitle) form.append('examTitle', params.examTitle);
    if (params.paperSize) form.append('paperSize', params.paperSize);

    const response = await request.post(`/api/ExamWordA3ExportV2Controller/exportA3V2`, form, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data; // 直接返回blob数据
  } catch (error) {
    console.error("导出A3横向装订线Word失败:", error);
    throw error;
  }
};

// A3 导出接口：与组卷接口一致，使用 pageHeader、mainTitle、subTitle
export const testA3Export = async (params: {
  paperId: string | number;
  logoUrl?: string;
  pageHeader?: string;
  mainTitle?: string;
  subTitle?: string;
}): Promise<Blob> => {
  try {
    const form = new URLSearchParams();
    form.append('paperId', String(params.paperId));
    if (params.logoUrl) form.append('logoUrl', params.logoUrl);
    if (params.pageHeader != null) form.append('pageHeader', params.pageHeader);
    if (params.mainTitle != null) form.append('mainTitle', params.mainTitle);
    if (params.subTitle != null) form.append('subTitle', params.subTitle);

    const response = await request.post(`/api/ExamWordA3ExportV2Controller/exportA3V2`, form, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error) {
    console.error("A3测试导出失败:", error);
    throw error;
  }
};

// 获取考试分析接口
export const getExamAnalysis = async (type: number): Promise<Response> => {
  try {
    const response = await request.get(`/api/teachExam/getStatic`, {
      params: { type },
      
    })
    return response.data
  } catch (error) {
    console.error("获取考试分析失败:", error)
    throw error
  }
}

// 获取成绩列表
export const getAllStudentsScore = async (examId?: number, teachExamId?: string | number): Promise<Response> => {
  try {
    const params: any = {}
    if (examId) {
      params.examId = examId
    }
    if (teachExamId) {
      params.teachExamId = teachExamId
    }
    const response = await request.get(`/api/teachExam/getAllStdentsScore`, {
      params,
      
    })
    return response.data
  } catch (error) {
    console.error("获取成绩列表失败:", error)
    throw error
  }
}

// 导出考试成绩
export const exportScore = async (teachId: string, teachExamId: string | number): Promise<Blob> => {
  try {
    const response = await request.get(`/api/teachExam/exportScorePdf`, {
      params: { teachId, teachExamId },
      responseType: "blob",
      
    })
    return response.data
  } catch (error) {
    console.error("导出成绩失败:", error)
    throw error
  }
}

// 获取所有考试列表（基于 t_teach_exam，原成绩页面使用）
export const getAllExams = async (searchInfo: SearchInfo): Promise<Response> => {
  try {
    // Construct the request data according to the API requirements
    const requestData: any = {
      offset: searchInfo.offset || 0,
      limit: searchInfo.limit || 10,
      searchWord: searchInfo.searchWord || '',
      searchTime: searchInfo.searchTime || undefined
    };

    // 可选：起止日期一起传递（如果后端支持）
    if (searchInfo.searchStartTime) {
      requestData.searchStartTime = searchInfo.searchStartTime;
    }
    if (searchInfo.searchEndTime) {
      requestData.searchEndTime = searchInfo.searchEndTime;
    }

    const response = await request.post(`/api/teachExam/getAllExams`, requestData);
    return response.data;
  } catch (error) {
    console.error("获取考试列表失败:", error);
    throw error;
  }
};

// 获取考试列表（基于 t_exam，用于“查看成绩”页）
export const getExamListForScore = async (searchInfo: SearchInfo): Promise<Response> => {
  try {
    const requestData: any = {
      offset: searchInfo.offset || 0,
      limit: searchInfo.limit || 10,
      searchWord: searchInfo.searchWord || "",
    };

    if (searchInfo.searchStartTime) requestData.searchStartTime = searchInfo.searchStartTime;
    if (searchInfo.searchEndTime) requestData.searchEndTime = searchInfo.searchEndTime;
    if (searchInfo.examMode) requestData.examMode = searchInfo.examMode;
    if (searchInfo.registrationCountMin != null) requestData.registrationCountMin = searchInfo.registrationCountMin;
    if (searchInfo.registrationCountMax != null) requestData.registrationCountMax = searchInfo.registrationCountMax;
    if (searchInfo.passCountMin != null) requestData.passCountMin = searchInfo.passCountMin;
    if (searchInfo.passCountMax != null) requestData.passCountMax = searchInfo.passCountMax;
    if (searchInfo.consumeMin != null) requestData.consumeMin = searchInfo.consumeMin;
    if (searchInfo.consumeMax != null) requestData.consumeMax = searchInfo.consumeMax;
    if (searchInfo.level) requestData.level = searchInfo.level;
    if (searchInfo.jobType) requestData.jobType = searchInfo.jobType;
    // 从成绩列表入口进入时必传：按教考(试卷)维度筛选 t_exam 列表
    if ((searchInfo as any).teachExamId != null) requestData.teachExamId = (searchInfo as any).teachExamId;

    const response = await request.post(`/api/exam/list`, requestData);
    return response.data;
  } catch (error) {
    console.error("获取考试列表（基于 t_exam）失败:", error);
    throw error;
  }
};

// 获取考试成绩汇总
export const getExamTotal = (studentId: string, examId: number, teachExamId?: string) => {
  return request.get<ExamTotalResponse>(`/api/teach/getExamTotal`, {
    headers: {
      'Content-Type': 'application/json',

    },
    params: { 
      studentId,
      examId,
      ...(teachExamId ? { teachExamId } : {})
    },
  })
}

// 获取考试题目详情（优先使用 examId，其次 teachExamId，兼容旧逻辑）
export const getExamDetail = (
  studentId: string,
  examId?: number | string,
  teachExamId?: string
) => {
  return request.get<ExamDetailResponse>(`/api/students/getExamDetail`, {
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      studentId,
      ...(examId !== undefined && examId !== null ? { examId } : {}),
      ...(teachExamId ? { teachExamId } : {}),
    },
  })
}

export const saveSubjectiveScore = async (params: SaveSubjectiveScoreParams): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/updateScore`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('保存主观题分数失败:', error);
    throw error;
  }
};

/** 批量保存主观题分数 */
export const updateScoreBatch = async (
  list: Array<{ id: number; score: number; studentId: string; examId: number }>
): Promise<Response> => {
  try {
    const response = await request.post(`/api/teachExam/updateScoreBatch`, list, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('批量保存成绩失败:', error);
    throw error;
  }
};
