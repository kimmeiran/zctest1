import request from "@/utils/request";

export interface LogQueryParams {
  role?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  keyword?: string;
  startTime?: string;
  endTime?: string;
  offset?: number;
  limit?: number;
  actorId?: string;
}

export const fetchLogs = (params: LogQueryParams) => {
  return request.get(`/api/logs`, { params });
};

/** 获取操作人列表（日志监控首页） */
export const fetchOperators = () => {
  return request.get(`/api/logs/operators`);
};

/** 按登录账号查询日志列表 */
export const fetchLogsByAccount = (account: string, offset = 0, limit = 20) => {
  return request.get(`/api/logs/by-account`, {
    params: { account, offset, limit }
  });
};

