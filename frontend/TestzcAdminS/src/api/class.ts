import request from "@/utils/request"
import { Response } from './types'

// 班级类型定义
export interface ClassManager {
  id?: number
  teachName: string
  gradeName: string
  majorName: string
  className: string
  teachId?: string
  createId?: string
  createTime?: string
  updateId?: string
  updateTime?: string
}

// 获取所有班级
export const getAllClasses = async (): Promise<Response> => {
  try {
    const response = await request.get(`/api/classManager/getAll`)
    return response.data
  } catch (error) {
    console.error("获取班级列表失败:", error)
    throw error
  }
}

// 管理班级获取所有老师信息
export const getAllTeachers = async (): Promise<Response> => {
  try {
    const response = await request.get(`/api/teach/getAllTeach`)
    return response.data
  } catch (error) {
    console.error("获取教师列表失败:", error)
    throw error
  }
}

// 添加班级
export const addClass = async (classManager: ClassManager): Promise<Response> => {
  try {
    const response = await request.post(`/api/classManager/add`, classManager)
    return response.data
  } catch (error) {
    console.error("添加班级失败:", error)
    throw error
  }
}

// 更新班级
export const updateClass = async (classManager: ClassManager): Promise<Response> => {
  try {
    const response = await request.post(`/api/classManager/update`, classManager)
    return response.data
  } catch (error) {
    console.error("更新班级失败:", error)
    throw error
  }
}

// 删除班级
export const deleteClass = async (id: string): Promise<Response> => {
  try {
    const response = await request.delete(`/api/classManager/delete`, {
      params: { id },
      
    })
    return response.data
  } catch (error) {
    console.error("删除班级失败:", error)
    throw error
  }
}
