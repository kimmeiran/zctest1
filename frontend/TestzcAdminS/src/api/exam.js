import request from "@/utils/request"

// 使用与user.ts相同的API_BASE_URL

/**
 * 新增考试
 */
export function addExam(exam) {
    return request.post(`/api/exam/add`, exam)
}

/**
 * 更新考试
 */
export function updateExam(exam) {
    return request.put(`/api/exam/update`, exam)
}

/**
 * 删除考试
 */
export function deleteExam(id) {
    return request.delete(`/api/exam/${id}`)
}

/**
 * 根据ID获取考试详情
 */
export function getExamById(id) {
    return request.get(`/api/exam/${id}`)
}

/**
 * 获取考试列表
 */
export function getExamList(searchInfo) {
    return request.post(`/api/exam/list`, searchInfo)
}

/**
 * 发布考试
 */
export function publishExam(id) {
    return request.post(`/api/exam/publish`, null, {
        params: { id },
        
    })
}

/**
 * 派发考试
 */
export function distributeExam(id, teachExamId) {
    return request.post(`/api/exam/distribute`, null, {
        params: { id, teachExamId },
        
    })
}

/**
 * 获取报名人数
 */
export function getRegistrationCount(id) {
    return request.get(`/api/exam/${id}/registration-count`)
}

/**
 * 根据考试ID获取报名人员列表
 */
export function getApplicantsByExamId(examId) {
    return request.get(`/api/exam/${examId}/applicants`)
}

/**
 * 根据考试ID获取该考试下通过（pass_status=1）的学生列表，供证书新增选择学生用
 */
export function getPassedApplicantsByExamId(examId) {
    return request.get(`/api/exam/${examId}/passedApplicants`)
}

/**
 * 批量导入报考人员
 * @param {number|string} examId - 考试ID
 * @param {File} file - Excel文件
 */
export function importExamApplicants(examId, file) {
    const formData = new FormData()
    formData.append('examId', examId)
    formData.append('file', file)
    return request.post(`/api/exam/${examId}/applicants/import`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 下载报考人员导入模板
 */
export function downloadExamApplicantsTemplate() {
    return request.get(`/api/exam/applicants/template`, {
        responseType: 'blob',
    })
}

