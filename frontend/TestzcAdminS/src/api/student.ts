import request from "@/utils/request"
import { SearchInfo, Response } from './types'

// 学生类型定义
export interface Student {
  id?: string | number
  sname: string
  sex?: string
  studentId: string
  dept?: string
  jobType?: string
  titleLevel?: string
  status: string | number
  stationId?: number | null
  stationName?: string // 考核站名称（职工选择器展示 工号_考核站 用）
  password?: string // 密码字段（可选，用于修改密码）
  createTime?: string
  updateTime?: string
  createId?: string
  updateId?: string
}

// 获取用户信息
export interface StudentUpdate {
  sname: string
  studentId: string
  gender: string
  smajor: string
  sgrade: string
  sclass: string
  status: string
}

// 获取学生列表 - 使用新的getAllStudent接口
// searchInfo.name 支持模糊查询姓名和学号（后端需支持）
export const getStudentList = async (searchInfo: SearchInfo): Promise<Response> => {
  try {
    const response = await request.post(`/api/teach/getAllStudent`, searchInfo, {
      
      withCredentials: true, // 确保发送和接收 session cookies
    })
    return response.data
  } catch (error) {
    console.error("获取学生列表失败:", error)
    throw error
  }
}

/**
 * 根据考核站查询该站下所有职工（用于考试人员管理-新增报名人联动选择）
 * @param stationId 考核站ID
 * @param offset 分页偏移，默认0
 * @param limit 每页条数，默认500
 */
export const getStudentsByStation = async (
  stationId: number,
  offset = 0,
  limit = 500
): Promise<Response> => {
  try {
    const response = await request.get(`/api/teach/studentsByStation`, {
      params: { stationId, offset, limit },
      withCredentials: true,
    })
    return response.data
  } catch (error) {
    console.error("根据考核站获取职工列表失败:", error)
    throw error
  }
}

// 根据学号获取学生信息
export const getStudentById = async (studentId: string): Promise<Response> => {
  try {
    const response = await request.get(`/api/students/getByStudentId`, {
      params: { studentId },
      
    })
    return response.data
  } catch (error) {
    console.error("获取学生信息失败:", error)
    throw error
  }
}

// 添加学生 - 更新为新的API接口
export const addStudent = async (student: Student): Promise<Response> => {
  try {
    const requestData = {
      studentId: student.studentId,
      sname: student.sname,
      dept: student.dept,
      jobType: student.jobType,
      titleLevel: student.titleLevel,
      status: student.status,
      sex: student.sex,
      stationId: student.stationId
    }
    const response = await request.post(`/api/teach/addStudent`, requestData)
    return response.data
  } catch (error) {
    console.error("添加学生失败:", error)
    throw error
  }
}

// 更新学生 - 更新为新的API接口
export const updateStudent = async (student: Student): Promise<Response> => {
  try {
    const requestData: any = {
      studentId: student.studentId,
      sname: student.sname,
      dept: student.dept,
      jobType: student.jobType,
      titleLevel: student.titleLevel,
      status: student.status,
      sex: student.sex,
      stationId: student.stationId
    }
    
    // 如果密码字段存在且不为空，则添加到请求中
    if (student.password !== undefined && student.password !== null && student.password.trim() !== '') {
      requestData.password = student.password.trim();
    }
    
    const response = await request.post(`/api/teach/updateStudent`, requestData)
    return response.data
  } catch (error) {
    console.error("更新学生失败:", error)
    throw error
  }
}

// 删除学生 - 更新为新的API接口
export const deleteStudent = async (studentIds: string): Promise<Response> => {
  try {
    const response = await request.delete(`/api/teach/deleteStudents`, {
      data: studentIds,
      
    })
    return response.data
  } catch (error) {
    console.error("删除学生失败:", error)
    throw error
  }
}

// 导入学生 - 更新为新的API接口
export const importStudents = async (file: File): Promise<Response> => {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await request.post(`/api/teach/importStudents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error) {
    console.error("导入学生失败:", error)
    throw error
  }
}

// 下载学生导入模板
export const downloadStudentTemplate = async (): Promise<Blob> => {
  try {
    const response = await request.get(`/api/students/template`, {
      responseType: "blob",
      
    })
    return response.data
  } catch (error) {
    console.error("下载学生导入模板失败:", error)
    throw error
  }
}

// 批量下载学生数据
export const exportStudents = async (params?: {
  name?: string
  grade?: string
  major?: string
}): Promise<Blob> => {
  try {
    const response = await request.get(`/api/students/export`, {
      params,
      responseType: "blob",
      
    })
    return response.data
  } catch (error) {
    console.error("批量下载学生数据失败:", error)
    throw error
  }
}

// 获取用户信息
export const getUserInfo = async (studentId: string) => {
  try {
    const response = await request.get(`/api/student/info`, {
      params: { studentId },
      
    })
    return response
  } catch (error) {
    console.error("获取用户信息失败:", error)
    throw error
  }
}

// 更新用户信息
export const updateUserInfo = async (studentInfo: StudentUpdate) => {
  try {
    const response = await request.post(`/api/student/update`, studentInfo)
    return response
  } catch (error) {
    console.error("更新用户信息失败:", error)
    throw error
  }
}
