import request from "@/utils/request";

/**
 * 创建证书（录入证书号）
 * @param {Object} params - 证书参数
 * @param {string} params.certificateNumber - 证书号
 * @param {string} params.studentId - 学生ID
 * @param {number} params.examId - 考试ID
 * @param {string} params.remark - 备注（可选）
 * @returns {Promise<Response>}
 */
export const createCertificate = async (params) => {
  const response = await request.post(`/api/certificate/create`, params);
  return response.data;
};

/**
 * 查询证书列表
 * @param {Object} searchInfo - 搜索条件
 * @param {number} searchInfo.offset - 偏移量
 * @param {number} searchInfo.limit - 每页数量
 * @param {string} searchInfo.certificateNumber - 证书号（可选）
 * @param {string} searchInfo.studentId - 学生ID（可选）
 * @param {string} searchInfo.studentName - 学生姓名（可选）
 * @param {number} searchInfo.examId - 考试ID（可选）
 * @param {number} searchInfo.status - 状态（可选）
 * @param {number} searchInfo.stationId - 考核站ID（可选，考核站管理员使用）
 * @returns {Promise<Response>}
 */
export const getCertificateList = async (searchInfo) => {
  const response = await request.post(`/api/certificate/list`, searchInfo);
  return response.data;
};

/**
 * 根据ID获取证书详情
 * @param {number} id - 证书ID
 * @returns {Promise<Response>}
 */
export const getCertificateById = async (id) => {
  const response = await request.get(`/api/certificate/${id}`);
  return response.data;
};

/**
 * 更新证书状态（标记为已邮寄）
 * @param {Object} params - 更新参数
 * @param {number} params.id - 证书ID
 * @param {string} params.mailTrackingNumber - 快递单号
 * @param {string} params.mailTime - 邮寄时间（可选）
 * @param {string} params.remark - 备注（可选）
 * @returns {Promise<Response>}
 */
export const markAsMailed = async (params) => {
  const response = await request.post(`/api/certificate/markAsMailed`, params);
  return response.data;
};

/**
 * 更新证书状态（确认收到）
 * @param {number} id - 证书ID
 * @returns {Promise<Response>}
 */
export const confirmReceived = async (id) => {
  const response = await request.post(`/api/certificate/confirmReceived`, { id });
  return response.data;
};

/**
 * 更新证书信息
 * @param {Object} params - 更新参数
 * @param {number} params.id - 证书ID
 * @param {string} params.certificateNumber - 证书号（可选）
 * @param {string} params.remark - 备注（可选）
 * @returns {Promise<Response>}
 */
export const updateCertificate = async (params) => {
  const response = await request.post(`/api/certificate/update`, params);
  return response.data;
};

/**
 * 删除证书
 * @param {number} id - 证书ID
 * @returns {Promise<Response>}
 */
export const deleteCertificate = async (id) => {
  const response = await request.delete(`/api/certificate/${id}`);
  return response.data;
};
