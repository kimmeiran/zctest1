import request from "@/utils/request"
import { Response } from './types'

// 获取考试人员分页列表
export interface ExamPersonPageParams {
  page: number;
  pageSize: number;
  persionName?: string;
}

export interface ExamPersonItem {
  id: number;
  persionId: string;
  persionName: string | null;
  jobType: string;
  level: string;
  createUser: string | null;
  createTime: string;
}

export interface ExamPersonPageResponse {
  code: number;
  msg: string;
  data: {
    total: number;
    list: ExamPersonItem[];
  };
}

// /api/examPerson/page
export const getExamPersonPage = async (params: ExamPersonPageParams): Promise<ExamPersonPageResponse> => {
  try {
    const response = await request.post(`/api/examPerson/page`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('获取考试人员分页失败:', error);
    throw error;
  }
};

// 添加考试人员
export interface AddExamPersonParams {
  persionId: string;
  jobType: string;
  level: number;
}

export interface AddExamPersonResponse {
  code: number;
  msg: string;
}

export const addExamPerson = async (params: AddExamPersonParams): Promise<AddExamPersonResponse> => {
  try {
    const response = await request.post(`/api/examPerson/add`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('添加考试人员失败:', error);
    throw error;
  }
};

// 修改考试人员
export interface UpdateExamPersonParams {
  id: number;
  persionId: string;
  jobType: string;
  level: number;
}

export interface UpdateExamPersonResponse {
  code: number;
  msg: string;
}

export const updateExamPerson = async (params: UpdateExamPersonParams): Promise<UpdateExamPersonResponse> => {
  try {
    const response = await request.post(`/api/examPerson/update`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('修改考试人员失败:', error);
    throw error;
  }
};

// 删除考试人员
export interface DeleteExamPersonResponse {
  code: number;
  msg: string;
}

export const deleteExamPerson = async (id: number): Promise<DeleteExamPersonResponse> => {
  try {
    const response = await request.delete(`/api/examPerson/delete`, {
      params: { id },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('删除考试人员失败:', error);
    throw error;
  }
};

// 批量导入考试人员
export const importExamPersons = async (file: File): Promise<Response> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await request.post(`/api/examPerson/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('导入考试人员失败:', error);
    throw error;
  }
};

// 下载考试人员模板（CSV，Excel可打开）
export const downloadExamPersonTemplate = async (): Promise<{ blob: Blob; filename?: string }> => {
  try {
    const response = await request.get(`/api/examPerson/template`, {
      responseType: 'blob',
      
    });

    // 解析 Content-Disposition 获取文件名
    let filename: string | undefined
    const disposition = (response.headers as any)['content-disposition'] || (response.headers as any)['Content-Disposition']
    if (disposition) {
      const matchStar = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
      const matchNormal = /filename="?([^";]+)"?/i.exec(disposition)
      if (matchStar && matchStar[1]) {
        try { filename = decodeURIComponent(matchStar[1]) } catch { filename = matchStar[1] }
      } else if (matchNormal && matchNormal[1]) {
        filename = matchNormal[1]
      }
    }

    return { blob: response.data, filename }
  } catch (error) {
    console.error('下载考试人员模板失败:', error);
    throw error;
  }
};
