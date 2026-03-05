import request from "@/utils/request"
import { Response } from './types'

// 字典项类型定义
export interface Dictionary {
  id?: number;
  code: string;
  name: string;
  type: number; // 0: 学院, 1: 专业, 2: 班级
  parentId?: number; // 专业的父级学院ID
  createTime?: string;
  updateTime?: string;
}
export interface DictionaryRequest {
  type: number;
  parentId?: number;
}

// 根据类型获取字典项
export const getDictionaryByType = async (params: DictionaryRequest): Promise<Response> => {
  try {
    const response = await request.post(`/api/dictionary/getByType`, params);
    return response.data;
  } catch (error) {
    console.error("获取字典列表失败:", error);
    throw error;
  }
}

// 添加字典项
export const addDictionary = async (dictionary: Dictionary): Promise<Response> => {
  try {
    const response = await request.post(`/api/dictionary/add`, dictionary)
    return response.data
  } catch (error) {
    console.error("添加字典项失败:", error)
    throw error
  }
}

// 更新字典项
export const updateDictionary = async (dictionary: Dictionary): Promise<Response> => {
  try {
    const response = await request.post(`/api/dictionary/update`, dictionary)
    return response.data
  } catch (error) {
    console.error("更新字典项失败:", error)
    throw error
  }
}

// 删除字典项
export const deleteDictionary = async (id: number): Promise<Response> => {
  try {
    const response = await request.delete(`/api/dictionary/delete`, {
      params: { id },
      
    })
    return response.data
  } catch (error) {
    console.error("删除字典项失败:", error)
    throw error
  }
}
