/**
 * 用户角色常量（仅三类：4考核站管理员 5总管理 8审卷专家）
 */
export const ROLE_EXAM_STATION_ADMIN = 4  // 考核站管理员
export const ROLE_MANAGER = 5             // 总管理
export const ROLE_REVIEW_EXPERT = 8       // 审卷专家

export const ROLE_IDS = [ROLE_EXAM_STATION_ADMIN, ROLE_MANAGER, ROLE_REVIEW_EXPERT]

export const ROLE_LABELS = {
  [ROLE_EXAM_STATION_ADMIN]: '考核站管理员',
  [ROLE_MANAGER]: '总管理',
  [ROLE_REVIEW_EXPERT]: '审卷专家'
}

/** 非规定角色仅用于展示 */
export const LEGACY_ROLE_LABELS = {
  1: '阅卷专家（历史）',
  2: '命题专家（历史）',
  3: '审题专家（历史）',
  6: '总管理员（历史）',
  7: '组卷专家（历史）'
}

/** 统一成数字，兼容后端返回字符串 */
export function toRoleNumber(role) {
  if (role === undefined || role === null) return NaN
  const n = Number(role)
  return Number.isNaN(n) ? NaN : n
}

/** 是否为指定角色（兼容 number/string） */
export function isRole(userRole, roleValue) {
  return toRoleNumber(userRole) === roleValue
}

/** 根据角色获取显示名（含历史角色） */
export function getRoleLabel(role) {
  const r = toRoleNumber(role)
  return ROLE_LABELS[r] || LEGACY_ROLE_LABELS[r] || '未知角色'
}
