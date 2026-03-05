import request from "@/utils/request";

/**
 * 创建审批申请
 * @param {Object} params - 申请参数
 * @param {number} params.approvalType - 审批类型: 1-考试申请, 2-专家分配申请, 3-操作审批
 * @param {string} params.content - 申请内容(JSON格式)
 * @returns {Promise<Response>}
 */
export const createApproval = async (params) => {
  const response = await request.post(`/api/approval/create`, params);
  return response.data;
};

/**
 * 审批申请
 * @param {Object} params - 审批参数
 * @param {number} params.id - 审批ID
 * @param {number} params.status - 审批状态: 1-审核通过, 2-审核拒绝
 * @param {string} params.remark - 审批意见
 * @returns {Promise<Response>}
 */
export const approveApproval = async (params) => {
  const response = await request.post(`/api/approval/approve`, params);
  return response.data;
};

/**
 * 查询审批列表
 * @param {Object} searchInfo - 搜索条件
 * @returns {Promise<Response>}
 */
export const searchApprovals = async (searchInfo) => {
  const response = await request.post(`/api/approval/search`, searchInfo);
  return response.data;
};

/**
 * 根据ID查询审批详情
 * @param {number} id - 审批ID
 * @returns {Promise<Response>}
 */
export const getApprovalById = async (id) => {
  const response = await request.get(`/api/approval/${id}`);
  return response.data;
};

/**
 * 提交审批（管理提交审批）
 * @param {number} id - 审批ID
 * @returns {Promise<Response>}
 */
export const submitApproval = async (id) => {
  const response = await request.post(`/api/approval/submit`, { id });
  return response.data;
};

/**
 * 更新申请内容（管理编辑申请）
 * @param {Object} params - 更新参数
 * @param {number} params.id - 审批ID
 * @param {string} params.content - 申请内容
 * @returns {Promise<Response>}
 */
export const updateApproval = async (params) => {
  const response = await request.post(`/api/approval/update`, params);
  return response.data;
};

/**
 * 删除审批申请
 * @param {number} id - 审批ID
 * @returns {Promise<Response>}
 */
export const deleteApproval = async (id) => {
  const response = await request.delete(`/api/approval/${id}`);
  return response.data;
};

