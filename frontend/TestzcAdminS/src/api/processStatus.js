import request from "@/utils/request";

/**
 * 查询各模块流程状态
 * @returns {Promise<Response>}
 */
export const getProcessStatus = async () => {
  const response = await request.get(`/api/processStatus/status`);
  return response.data;
};

