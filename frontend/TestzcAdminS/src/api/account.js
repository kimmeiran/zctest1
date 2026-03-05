import request from "@/utils/request"

// 使用与其他API相同的基础路径配置

// 确保axios使用相对路径，不使用任何baseURL

/**
 * 搜索管理员列表
 * @param {object} params - 搜索参数
 * @param {string} [params.name] - 名称/账号
 * @param {number} [params.role] - 角色类型（5为考核站管理员）
 * @param {number} [params.status] - 状态
 * @param {number} params.offset - 偏移量
 * @param {number} params.limit - 每页数量
 * @returns {Promise<object>} 响应数据
 */
export function searchAccounts(params) {
  return request.post(`/api/account/search`, params)
}

/**
 * 添加管理员
 * @param {object} account - 管理员信息
 * @param {string} account.account - 登录账号
 * @param {string} account.displayName - 管理员姓名
 * @param {string} account.passwordHash - 密码
 * @param {number} account.role - 角色
 * @param {number} account.status - 状态
 * @returns {Promise<object>} 响应数据
 */
export function addAccount(account) {
  return request.post(`/api/account/add`, account)
}

/**
 * 更新管理员信息
 * @param {object} account - 管理员信息
 * @param {number} account.id - 管理员ID
 * @param {string} account.account - 登录账号
 * @param {string} account.displayName - 管理员姓名
 * @param {string} [account.passwordHash] - 密码（可选，不修改则不传）
 * @param {number} account.role - 角色
 * @param {number} account.status - 状态
 * @returns {Promise<object>} 响应数据
 */
export function updateAccount(account) {
  return request.put(`/api/account/update`, account)
}

/**
 * 删除管理员
 * @param {number} id - 管理员ID
 * @returns {Promise<object>} 响应数据
 */
export function deleteAccount(id) {
  return request.delete(`/api/account/${id}`)
}

/**
 * 根据ID获取管理员信息
 * @param {number} id - 管理员ID
 * @returns {Promise<object>} 响应数据
 */
export function getAccountById(id) {
  return request.get(`/api/account/${id}`)
}

/**
 * 根据账号获取管理员信息
 * @param {string} account - 登录账号
 * @returns {Promise<object>} 响应数据
 */
export function getAccountByAccount(account) {
  return request.get(`/api/account/byAccount`, {
    params: { account },
    
  })
}