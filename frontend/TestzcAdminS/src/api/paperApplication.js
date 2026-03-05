import request from "@/utils/request"

/**
 * 试卷申请 API
 */


// 获取试卷申请列表
export function getPaperApplications(params) {
  return request.get(`/api/paper-applications`, {
    params,
    
  })
}

// 获取试卷申请详情
export function getPaperApplicationDetail(id) {
  return request.get(`/api/paper-applications/${id}`)
}

// 创建试卷申请（FormData 不设 Content-Type，使用自带 boundary，见 skill zcexam-paper-application）
export function createPaperApplication(data) {
  return request.post(`/api/paper-applications`, data)
}

// 删除试卷申请
export function deletePaperApplication(id) {
  return request.delete(`/api/paper-applications/${id}`)
}
