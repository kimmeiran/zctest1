import request from "@/utils/request"

// 使用与user.ts相同的API_BASE_URL

/**
 * 获取题库列表
 */
export function getQuestionBankList() {
    return request.get(`/api/questionBank/list`)
}

/**
 * 根据ID获取问题详情
 */
export function getQuestionById(id) {
    return request.get(`/api/questions/getById?id=${id}`)
}

/**
 * 根据题库ID获取题目列表
 */
export function getQuestionsByBankId(questionBaseId) {
    return request.post(`/api/questions/getByQuestionBaseId`, {
        questionBaseId: questionBaseId,
        offset: 0,
        limit: 1000
    })
}

/**
 * 根据题库ID获取领域统计数据
 */
export function getDomainCountByQuestionBaseId(questionBaseId) {
    return request.get(`/api/questions/getDomainCountByQuestionBaseId`, {
        params: {
            questionBaseId: questionBaseId
        },
        
    })
}

/**
 * 导入题目文件
 * @param {File} file - 上传的文件
 * @param {number} type - 类型：1代表题目，2代表答案
 */
export function importQuestionBank(file, type = 1) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    return request.post(`/api/questionBank/import`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 分钟（见 skill zcexam-import-timeout-fix）
    })
}

/**
 * 创建题库
 * @param {String} questionName - 题库名称
 * @param {String} questionType - 职业(工种)
 * @param {String} level - 技能等级
 * @param {Number} domain - 领域
 * @param {Array} questions - 题目列表
 * @param {Object} extra - 可选：{ questionBankType, stationId }
 */
export function createQuestionBank(questionName, questionType, level, domain, questions = [], extra = {}) {
    const requestData = {
        questionName: questionName,
        questionType: questionType,
        level: level,
        domain: domain,
        questions: questions,
        ...extra
    }

    return request.post(`/api/questionBank/create`, requestData)
}

// 新增：导出题目/答案模板
export function exportTemplate(type = 1) {
    return request.get(`/api/questionBank/exportTemplate`, {
        params: { type },
        
        responseType: 'blob'
    })
} 