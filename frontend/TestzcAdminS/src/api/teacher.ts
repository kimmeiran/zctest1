import request from "@/utils/request"
import { SearchInfo, Response } from './types'

// 教师类型定义
export interface Teacher {
  teachId?: number // 教师ID
  account: string // 账号
  teachName: string | number // 教师姓名
  password?: string | number // 密码
  status?: number // 状态
  createTime?: string // 创建时间
}

// 获取教师列表 - 更新为匹配新的请求/响应格式
export const getTeacherList = async (searchInfo: SearchInfo): Promise<Response> => {
  try {
    // 构建符合API要求的请求参数
    const requestData = {
      name: searchInfo.name || "",
      offset: searchInfo.offset || 0,
      limit: searchInfo.limit || 10,
    }
    const response = await request.post(`/api/teach/getAll`, requestData)
    return response.data
  } catch (error) {
    console.error("获取教师列表失败:", error)
    throw error
  }
}

// 添加教师 - 更新为匹配新的请求/响应格式
export const addTeacher = async (teacher: Teacher): Promise<Response> => {
  try {
    // 构建符合API要求的请求参数
    const requestData = {
      account: teacher.account,
      teachName: teacher.teachName,
      password: teacher.password,
      status: teacher.status,
    }

    const response = await request.post(`/api/teach/addTeach`, requestData)
    return response.data
  } catch (error) {
    console.error("添加教师失败:", error)
    throw error
  }
}

// 更新教师 - 更新为匹配新的请求/响应格式
export const updateTeacher = async (teacher: Teacher): Promise<Response> => {
  try {
    // 构建符合API要求的请求参数
    const requestData = {
      teachId: teacher.teachId,
      account: teacher.account,
      teachName: teacher.teachName,
      password: teacher.password,
      status: teacher.status,
    }

    const response = await request.post(`/api/teach/updateTeach`, requestData)
    return response.data
  } catch (error) {
    console.error("更新教师失败:", error)
    throw error
  }
}

// 删除教师 - 更新为匹配新的请求/响应格式
export const deleteTeacher = async (teachId: number): Promise<Response> => {
  try {
    const response = await request.delete(`/api/teach/deleteTeach`, {
      data: { id: String(teachId) },
      
    })
    return response.data
  } catch (error) {
    console.error("删除教师失败:", error)
    throw error
  }
}
