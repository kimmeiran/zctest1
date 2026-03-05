import request from "@/utils/request"
import { SearchInfo, Response } from './types'

// 题目类型定义（用于selectQuestionByBaseID等接口）
export interface Question {
  id: string; // 试题id
  questionBaseId: string; // 题库id
  questionContent: string; // 题干
  answera?: string; // 选项A
  answerb?: string; // 选项B
  answerc?: string; // 选项C
  answerd?: string; // 选项D
  answere?: string; // 选项E
  answerf?: string; // 选项F
  answerg?: string; // 选项G
  answer: string; // 正确答案
  questionType: string; // 题类型
  attachedImage?: string; // 附件base64
  question_content_images?: string; // 题目内容中插入的图片，以英文逗号分隔
  domain?: string; // 领域
  easeOrDifficulty: string; // 难易程度
  importance?: string; // 要素
  sort?: number; // 排序用序号
  answerImage?: string; // 答案图片base64
}

// selectQuestionByBaseID请求参数类型
export interface SelectQuestionByBaseIDRequest {
  questionBaseId: string;
  offset: number;
  limit: number;
  /** 题目关键字，用于按题目内容模糊筛选 */
  content?: string;
}

export interface SelectQuestionByBaseIDResponse {
  code: number;
  msg: string;
  data: {
    list: Question[];
    total: number;
  };
}

// Add the following function to get all base questions
export const getAllBaseQuestions = async (searchInfo: SearchInfo): Promise<Response> => {
  try {
    // Construct the request data according to the API requirements
    const requestData: Record<string, any> = {
      name: searchInfo.name || "",
    };

    if (typeof searchInfo.auditStatus !== "undefined") {
      requestData.auditStatus = searchInfo.auditStatus;
    }
    if (typeof searchInfo.stationId !== "undefined") {
      requestData.stationId = searchInfo.stationId;
    }
    if (typeof searchInfo.type !== "undefined") {
      requestData.type = searchInfo.type;
    }
    if (typeof searchInfo.questionBankType !== "undefined" && searchInfo.questionBankType !== "" && searchInfo.questionBankType != null) {
      requestData.questionBankType = searchInfo.questionBankType;
      requestData.baseType = searchInfo.questionBankType; // 后端 SearchInfo 使用 baseType 筛选
    }
    if (searchInfo.ruleType !== undefined && searchInfo.ruleType !== null && (searchInfo.ruleType === 0 || searchInfo.ruleType === 1 || searchInfo.ruleType === 2)) {
      requestData.ruleType = searchInfo.ruleType;
    }

    const response = await request.post(`/api/questions/getAllBase`, requestData)
    return response.data
  } catch (error) {
    console.error("获取基础题库列表失败:", error)
    throw error
  }
}

// Add the following function to import questions
export const importQuestions = async (
  questionBaseId: string | undefined,
  questionName: string,
  questionType: string, // 修改：改为string类型，支持汉字
  level: string, // 修改：改为string类型，支持汉字
  questionBankType: string, // 题库类型：竞赛/模拟考试/职业认定
  files: File[]
): Promise<Response> => {
  try {
    const formData = new FormData()
    files.forEach(file => {
      formData.append("files", file)
    })

    formData.append("questionName", questionName)
    formData.append("questionType", questionType) // 直接传递汉字，不需要toString()
    formData.append("questionBaseId", questionBaseId || "")
    formData.append("level", level) // 直接传递汉字，不需要toString()
    formData.append("questionBankType", questionBankType || "")

    const response = await request.post(`/api/questions/importWord`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error) {
    console.error("导入题目失败:", error)
    throw error
  }
}

// Add the following function to delete a question base
export const deleteQuestionBase = async (id: string): Promise<Response> => {
  try {
    const response = await request.delete(`/api/questions/deleteBase`, {
      params: { id },
      
    })
    return response.data
  } catch (error) {
    console.error("删除题库失败:", error)
    throw error
  }
}

// 提交题库审核
export const submitQuestionBaseForAudit = async (id: string): Promise<Response> => {
  try {
    const response = await request.post(`/api/questions/submitAudit`, null, {
      params: { id },
      
    })
    return response.data
  } catch (error) {
    console.error("提交题库审核失败:", error)
    throw error
  }
}

// 审核题库
export const auditQuestionBase = async (id: string, auditStatus: number, auditRemark?: string): Promise<Response> => {
  try {
    const params: any = { 
      id, 
      auditStatus // 1-审核通过，2-审核拒绝
    };
    if (auditRemark) {
      params.auditRemark = auditRemark;
    }
    const response = await request.post(`/api/questions/auditBase`, null, {
      params,
      
    })
    return response.data
  } catch (error) {
    console.error("审核题库失败:", error)
    throw error
  }
}

// 根据题库ID获取题目列表，出参为Question[]
export const selectQuestionByBaseID = async (params: SelectQuestionByBaseIDRequest): Promise<SelectQuestionByBaseIDResponse> => {
  try {
    const response = await request.post(`/api/questions/selectQuestionByBaseID`, params)
    return response.data
  } catch (error) {
    console.error("根据题库ID获取题目列表失败:", error)
    throw error
  }
}

// 新增题目
export const addQuestion = async (question: any): Promise<Response> => {
  try {
    const response = await request.post(`/api/questions/add`, question);
    return response.data;
  } catch (error) {
    console.error("新增题目失败:", error);
    throw error;
  }
};

// 编辑题目
export const updateQuestion = async (question: any): Promise<Response> => {
  try {
    const response = await request.post(`/api/questions/update`, question);
    return response.data;
  } catch (error) {
    console.error("编辑题目失败:", error);
    throw error;
  }
};

// 删除单个题目
export const deleteQuestion = async (id: string): Promise<Response> => {
  try {
    const response = await request.delete(`/api/questions/delete`, {
      params: { id },
      
    });
    return response.data;
  } catch (error) {
    console.error("删除题目失败:", error);
    throw error;
  }
};
