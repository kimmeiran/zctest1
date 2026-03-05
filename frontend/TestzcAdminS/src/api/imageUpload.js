/**
 * 图片上传相关API
 */
import request from "@/utils/request"

/**
 * 上传图片文件（新接口返回 url + width + height）
 * @param {File} file 图片文件
 * @returns {Promise<{success: boolean, data: string, url: string, width: number, height: number, message: string}>} 上传结果
 */
export const uploadImage = async (file) => {
    try {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            throw new Error('请选择图片文件')
        }

        // 检查文件大小（限制为5MB）
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('图片文件大小不能超过5MB')
        }

        // 创建FormData对象
        const formData = new FormData()
        formData.append('file', file)

        // 调用后端图片上传接口（/api/uploadQuestionImage，返回 {url, width, height}）
        const response = await request.post(`/api/uploadQuestionImage`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        const result = response.data

        if (result.code === 200 && result.data) {
            // 新接口返回 data: { url, width, height }
            const { url, width, height } = result.data
            return {
                success: true,
                data: url,  // 兼容旧调用方（期望 result.data 为路径字符串）
                url: url,
                width: width || null,
                height: height || null,
                message: result.msg || '上传成功'
            }
        } else {
            throw new Error(result.msg || result.message || '上传失败')
        }
    } catch (error) {
        console.error('图片上传错误:', error)
        return {
            success: false,
            message: error.message || '图片上传失败，请重试'
        }
    }
}

/**
 * 获取图片下载URL
 * @param {string} filePath 服务器文件路径
 * @returns {string} 图片下载URL
 */
export const getImageUrl = (filePath) => {
    if (!filePath) return ''
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""
    return `${API_BASE_URL}/api/download?filePath=${encodeURIComponent(filePath)}`
}

/**
 * 获取当前登录 token（与 user.ts 一致，存于 localStorage）
 */
const getToken = () => {
    if (typeof window === 'undefined' || !window.localStorage) return ''
    return window.localStorage.getItem('token') || ''
}

/**
 * 从多种格式中提取图片路径。后端可能返回：
 * - 纯路径字符串: "/path/to/img.svg"
 * - JSON 字符串: "[{\"url\":\"/path\",\"width\":96}]" 或 "{\"url\":\"/path\"}"
 * - 对象/数组: {url:"/path"} 或 [{url:"/path"}]
 * 避免将 JSON 或 JSON 片段当作 fileName 传给 /api/getImage 导致 404
 */
const extractImagePath = (val) => {
    if (val == null) return ''
    if (typeof val === 'string') {
        const t = val.trim()
        if (!t) return ''
        if (t.startsWith('{') || t.startsWith('[')) {
            try {
                const parsed = JSON.parse(t)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const first = parsed[0]
                    if (first && typeof first === 'object' && first.url) return String(first.url).trim()
                }
                if (parsed && typeof parsed === 'object' && parsed.url) return String(parsed.url).trim()
            } catch (e) { }
            return ''
        }
        return t
    }
    if (Array.isArray(val) && val.length > 0) {
        const first = val[0]
        if (first && typeof first === 'object' && first.url) return String(first.url).trim()
        if (typeof first === 'string') return first.trim()
    }
    if (val && typeof val === 'object' && val.url) return String(val.url).trim()
    return ''
}

/** 获取 getImage 请求 URL（不含 token，用于 fetch 时在请求头带 Authorization） */
const getImageRequestUrl = (imageUrl) => {
    const path = extractImagePath(imageUrl)
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) return path

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : ''
    const apiOrigin = ((typeof import.meta !== 'undefined') && import.meta.env && import.meta.env.VITE_API_ORIGIN) || origin
    const base = apiOrigin ? `${apiOrigin}${API_BASE_URL}` : API_BASE_URL
    return `${base}/api/getImage?fileName=${encodeURIComponent(path)}`
}

/**
 * 使用 Authorization 头请求图片，返回 blob URL（供 <img src> 使用，请求会带 token）
 * 发请求时在请求头带上 Authorization，与其它接口一致。
 * @param {string} imageUrl 图片路径
 * @returns {Promise<string>} blob URL，失败返回空字符串
 */
export const fetchImageAsBlobUrl = async (imageUrl) => {
    const path = extractImagePath(imageUrl)
    if (!path) return ''
    if (path.startsWith('blob:') || path.startsWith('data:')) return path
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const url = getImageRequestUrl(path)
    
    try {
        const res = await request.get(url, {
            responseType: 'blob'
        })
        
        let blob = res.data
        const contentType = res.headers['content-type'] || ''
        const isSvgByPath = path.toLowerCase().endsWith('.svg')
        const isSvgByContentType = contentType.includes('svg') || contentType.includes('xml')
        if ((isSvgByPath || isSvgByContentType) && !blob.type.includes('svg')) {
            const text = await blob.text()
            blob = new Blob([text], { type: 'image/svg+xml' })
        }
        return URL.createObjectURL(blob)
    } catch {
        return ''
    }
}

/** 将 imagesData 标准化为 {url, width?, height?}[]，支持 CSV、JSON 字符串、对象/数组 */
const normalizeImagesData = (imagesData) => {
    if (!imagesData) return []
    if (Array.isArray(imagesData) && imagesData.length > 0) {
        return imagesData.map((item) => {
            if (typeof item === 'object' && item && item.url) return { url: extractImagePath(item) || item.url, width: item.width, height: item.height }
            if (typeof item === 'string') return { url: extractImagePath(item) || item.trim(), width: null, height: null }
            return null
        }).filter(it => it && it.url)
    }
    if (typeof imagesData === 'string' && imagesData.trim()) {
        const t = imagesData.trim()
        if (t.startsWith('[') || t.startsWith('{')) {
            try {
                const parsed = JSON.parse(t)
                if (Array.isArray(parsed)) {
                    return parsed.map((item) => {
                        if (typeof item === 'object' && item && item.url) return { url: extractImagePath(item) || item.url, width: item.width, height: item.height }
                        return null
                    }).filter(Boolean)
                }
                if (parsed && parsed.url) return [{ url: extractImagePath(parsed) || parsed.url, width: parsed.width, height: parsed.height }]
            } catch (e) { }
        }
        return imagesData.split(',').map(u => {
            const path = extractImagePath(u.trim())
            return path ? { url: path, width: null, height: null } : null
        }).filter(Boolean)
    }
    return []
}

/**
 * 异步将 content 中的 [img] 占位符替换为带鉴权的图片（发请求时带 Authorization 头）
 * @param {string} content 含 [img] 的文本
 * @param {string|Array|Object} imagesCsv 图片路径 CSV 或 JSON 字符串或对象/数组
 * @returns {Promise<string>} 替换后的 HTML 字符串
 */
export const replaceImgPlaceholdersWithAuth = async (content, imagesCsv) => {
    if (!content) return content
    if (!content.includes('[img]')) return content
    const imageList = normalizeImagesData(imagesCsv)
    const imageUrls = imageList.map(it => it.url)
    if (imageUrls.length === 0) return content
    const matches = content.match(/\[img\]/g) || []
    let index = 0
    const urlList = matches.map(() => {
        const url = imageUrls[index] ?? imageUrls[imageUrls.length - 1] ?? ''
        index = Math.min(index + 1, imageUrls.length)
        return url
    })
    const blobUrls = await Promise.all(urlList.map(u => (u ? fetchImageAsBlobUrl(u) : Promise.resolve(''))))
    let i = 0
    return content.replace(/\[img\]/g, () => {
        const blobUrl = blobUrls[i++] || ''
        return blobUrl ? `<img src="${blobUrl}" alt="question image" class="question-inline-image" style="height:25px;width:auto;max-width:100%;vertical-align:middle;margin:0 3px;" />` : ''
    })
}

/**
 * 异步替换 [img]（支持 imagesData 为 CSV 或 {url, width?, height?}[]），发请求时带 Authorization 头
 * @param {string} content 含 [img] 的文本
 * @param {string|Array<{url: string, width?: string|number, height?: string|number}>} imagesData
 * @returns {Promise<string>}
 */
export const replaceImgPlaceholdersWithAuthAdvanced = async (content, imagesData) => {
    if (!content || !content.includes('[img]')) return content
    const imageList = normalizeImagesData(imagesData)
    if (imageList.length === 0) return content
    const matches = content.match(/\[img\]/g) || []
    let index = 0
    const itemList = matches.map(() => {
        const item = imageList[index] ?? imageList[imageList.length - 1]
        index = Math.min(index + 1, imageList.length)
        return item
    })
    const blobUrls = await Promise.all(itemList.map(it => (it && it.url ? fetchImageAsBlobUrl(it.url) : Promise.resolve(''))))
    let i = 0
    return content.replace(/\[img\]/g, () => {
        const blobUrl = blobUrls[i] || ''
        const item = itemList[i++] || {}
        if (!blobUrl) return ''
        const w = item.width ? `width="${item.width}"` : ''
        const h = item.height ? `height="${item.height}"` : ''
        const style = (item.width || item.height) ? `height:${item.height || 25}px;width:${item.width || 'auto'}px;` : 'height:25px;width:auto;max-width:100%;'
        return `<img src="${blobUrl}" ${w} ${h} alt="question image" class="question-inline-image" style="${style}vertical-align:middle;margin:0 3px;" />`
    })
}

/**
 * 获取图片直接访问URL（统一使用 /api/getImage?fileName= 方式显示，带 token 查询参数）
 * 注意：<img src="此URL"> 的请求由浏览器发起，无法带 Authorization 头。需带请求头时请用 fetchImageAsBlobUrl 或 replaceImgPlaceholdersWithAuth。
 * @param {string} imageUrl 图片路径（服务器文件路径）
 * @returns {string} 完整 URL（含 token 查询参数，后端若只认请求头则需用 fetchImageAsBlobUrl）
 */
export const getFullImageUrl = (imageUrl) => {
    const path = extractImagePath(imageUrl)
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('blob:') || path.startsWith('data:')) return path

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : ''
    const apiOrigin = ((typeof import.meta !== 'undefined') && import.meta.env && import.meta.env.VITE_API_ORIGIN) || origin
    const base = apiOrigin ? `${apiOrigin}${API_BASE_URL}` : API_BASE_URL
    const url = `${base}/api/getImage?fileName=${encodeURIComponent(path)}`
    const token = getToken()
    return token ? `${url}&token=${encodeURIComponent(token)}` : url
}

/**
 * 验证图片文件
 * @param {File} file 图片文件
 * @returns {Object} 验证结果
 */
export const validateImageFile = (file) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        return {
            valid: false,
            message: '请选择图片文件'
        }
    }

    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
        return {
            valid: false,
            message: '图片文件大小不能超过5MB'
        }
    }

    // 检查文件扩展名
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    const fileName = file.name.toLowerCase()
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension) {
        return {
            valid: false,
            message: '不支持的图片格式，请选择JPG、PNG、GIF、BMP或WebP格式的图片'
        }
    }

    return {
        valid: true,
        message: '文件验证通过'
    }
}
