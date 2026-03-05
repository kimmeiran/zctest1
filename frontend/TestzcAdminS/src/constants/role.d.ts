export const ROLE_EXAM_STATION_ADMIN: number
export const ROLE_MANAGER: number
export const ROLE_REVIEW_EXPERT: number
export const ROLE_IDS: number[]
export const ROLE_LABELS: Record<number, string>
export const LEGACY_ROLE_LABELS: Record<number, string>
export function toRoleNumber(role: unknown): number
export function isRole(userRole: unknown, roleValue: number): boolean
export function getRoleLabel(role: unknown): string
