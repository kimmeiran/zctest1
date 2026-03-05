import request from "@/utils/request"

// 与其它API保持一致

/**
 * 从技能考核 item.url（如 /api/image/1739123456789_试卷.pdf）中取出文件名
 * 供查看/下载使用 GET /api/file?fileName=xxx
 */
export function getSkillExamFileName(item) {
    if (!item?.url || typeof item.url !== 'string') return ''
    const u = item.url.trim()
    if (!u) return ''
    const segs = u.split('/').filter(Boolean)
    return segs.length ? segs[segs.length - 1] : ''
}

/**
 * 技能考核：预览/下载使用 GET /api/file?fileName=xxx（与后端 CommonController getRawFiles 一致）
 * 返回带查询参数的路径，与当前页同源，走 Vite 代理
 */
export function getSkillExamFileRawPath(item) {
    const fileName = getSkillExamFileName(item)
    if (!fileName) return ''
    return '/api/file?fileName=' + encodeURIComponent(fileName)
}

/** 获取文件访问完整 URL（用于预览/下载，可带 token） */
export function getFileFullUrl(path) {
    if (!path || typeof path !== 'string') return ''
    const trimmed = path.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    const origin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : ''
    const url = origin + (trimmed.startsWith('/') ? '' : '/') + trimmed
    const token = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('token') : ''
    return token ? `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : url
}

// 获取文件详情
export function getFileById(id) {
    return request.get(`/api/file/getById`, {
        params: { id },
    })
}

// 获取文件列表（GET，技能考核等使用；返回 { code, msg, data: [...] }）
export function getFileList(params = {}) {
    return request.get(`/api/file/list`, {
        params,
    })
}

// 获取文件列表（支持分页/筛选，POST 方式）
export function listFiles(params = {}) {
    return request.post(`/api/file/list`, params)
}

// 新增文件（通常由上传接口完成，这里保留）
export function addFile(data) {
    return request.post(`/api/file/add`, data)
}

// 更新文件信息
export function updateFile(data) {
    return request.post(`/api/file/update`, data)
}

// 删除单个
export function deleteFileById(id) {
    return request.delete(`/api/file/delete`, {
        params: { id },
    })
}

// 批量删除
export function deleteFilesBatch(ids = []) {
    return request.delete(`/api/file/deleteBatch`, {
        data: ids,
        
    })
}

// 上传文件，支持进度回调（不设 Content-Type，使用 FormData 自带 boundary，见 skill zcexam-skill-exam-upload-adjust）
export function uploadFileApi(file, config = {}) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/api/file/upload`, formData, {
    onUploadProgress: config.onUploadProgress
  })
}


