import request from "@/utils/request"

/**
 * 成绩查询第一页：试卷静态统计列表（按试卷维度汇总报名/通过人数）
 * @param {{ paperName?: string, offset: number, limit: number }} params
 */
export function getPapersStatic(params) {
  return request.post(`/api/students-exam-total/papersStatic`, params)
}

export function listStudentsExamTotal(params = {}) {
    return request.get(`/api/students-exam-total/list`, {
        params,
    })
}

export function addStudentsExamTotal(data) {
    return request.post(`/api/students-exam-total/add`, data)
}

export function deleteStudentsExamTotal(id) {
    return request.post(`/api/students-exam-total/delete/${id}`, null)
}

/**
 * 标记为已考/未考：将报名记录的考试状态改为已考试或未考试（后端根据当前状态处理）
 * @param {number} id - 报名记录 id（t_students_exam_total 主键）
 */
export function markExamined(id) {
    return request.post(`/api/students-exam-total/markExamined`, { id })
}

/**
 * 设置考试出席状态（线下修改已考/未考）
 * @param {number} id - 报名记录 id（t_students_exam_total 主键）
 * @param {number} attendedStatus - 0=未考，1=已考
 */
export function setAttendedStatus(id, attendedStatus) {
    return request.post(`/api/students-exam-total/setAttendedStatus`, { id, attendedStatus })
}

export function updateOfflineExamScore(data) {
    return request.post(`/api/students-exam-total/updateOfflineScore`, data)
}

/**
 * 设置成绩通过状态
 * @param {number} id - 报名记录 id（t_students_exam_total 主键）
 * @param {number} passStatus - 0=否 1=通过
 */
export function setPassStatus(id, passStatus) {
    return request.post(`/api/students-exam-total/setPassStatus`, { id, passStatus })
}

/**
 * 批量导入线下成绩（Excel）：服务端解析并写入数据库，同时将 Excel 保存到服务器
 * @param {File} file - 成绩 Excel 文件（.xlsx）
 * @param {number} examId - 考试 ID
 */
export function importOfflineScoreExcel(file, examId) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('examId', String(examId))
    return request.post(`/api/students-exam-total/importOfflineScore`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

/**
 * 批量导入报考人员（Excel）
 * @param {File} file - Excel 文件
 * @param {number} stationId - 考核站 ID
 * @param {number} examId - 考试 ID
 */
export function batchAddApplicants(file, stationId, examId) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('stationId', String(stationId))
    formData.append('examId', String(examId))
    return request.post(`/api/students-exam-total/batchAdd`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

/**
 * 下载报考人员导入模板（Excel）
 */
export function downloadApplicantsTemplate() {
    return request.get(`/api/students-exam-total/download`, {
        responseType: 'blob',
    })
}


