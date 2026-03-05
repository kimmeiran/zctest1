import request from "@/utils/request"
import { Response } from './types'

// 上传文件接口
export const uploadFile = async (file: File): Promise<Response> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await request.post(`/api/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("上传文件失败:", error);
    throw error;
  }
};
// 下载文件接口
export const downloadFile = async (filePath: string): Promise<Blob> => {
  try {
    const response = await request.get(`/api/download`, {
      params: { filePath },
      responseType: 'blob',
      
    });
    return response.data;
  } catch (error) {
    console.error("下载文件失败:", error);
    throw error;
  }
};
