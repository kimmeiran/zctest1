import request from "@/utils/request"

// 使用与user.ts相同的API基础路径配置

// 确保axios使用相对路径，不使用任何baseURL

// 获取所有考核站
export const getAllExamStations = () => {
  return request.get(`/api/examStation/all`)
}

// 搜索考核站
export const searchExamStations = (searchInfo) => {
  return request.post(`/api/examStation/search`, searchInfo)
}

// 根据ID获取考核站
export const getExamStationById = (id) => {
  return request.get(`/api/examStation/${id}`)
}

// 新增考核站
export const addExamStation = (examStation) => {
  return request.post(`/api/examStation/add`, examStation)
}

// 更新考核站
export const updateExamStation = (examStation) => {
  return request.put(`/api/examStation/update`, examStation)
}

// 删除考核站
export const deleteExamStation = (id) => {
  return request.delete(`/api/examStation/${id}`)
}

// 绑定管理员到考核站
export const bindAdminToStation = (stationId, accountId) => {
  return request.post(`/api/examStation/bind-admin`, null, {
    params: {
      stationId,
      accountId
    },
    
  })
}

// 设置考核站考试状态
export const setExamStationStatus = (stationId, examStatus) => {
  return request.post(`/api/examStation/exam-status`, null, {
    params: {
      stationId,
      examStatus
    },
    
  })
}
