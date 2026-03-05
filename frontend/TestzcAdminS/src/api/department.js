import request from "@/utils/request"

// 使用与user.ts相同的API基础路径配置

// 确保axios使用相对路径，不使用任何baseURL

// 获取部门树
export function getDepartmentTree(parentId = null) {
    const params = parentId !== null ? { parentId } : {}
    return request.get(`/api/department/tree`, {
        params,
        
    })
}

// 获取顶级部门
export function getTopLevelDepartments() {
    return request.get(`/api/department/top`)
}

// 根据父ID获取子部门
export function getChildrenDepartments(parentId) {
    return request.get(`/api/department/children/${parentId}`)
}

// 获取部门路径
export function getDepartmentPath(deptPath) {
    return request.get(`/api/department/path`, {
        params: { deptPath },
        
    })
}

// 获取部门列表
export function getDepartmentList(params) {
    return request.get(`/api/department/list`, {
        params,
        
    })
}

// 根据ID获取部门
export function getDepartmentById(id) {
    return request.get(`/api/department/${id}`)
}

// 新增部门
export function addDepartment(data) {
    return request.post(`/api/department/add`, data)
}

// 更新部门
export function updateDepartment(data) {
    return request.put(`/api/department/update`, data)
}

// 删除部门
export function deleteDepartment(id) {
    return request.delete(`/api/department/${id}`)
}

// 批量删除部门
export function deleteBatchDepartments(ids) {
    return request.delete(`/api/department/batch`, {
        data: ids,
        
    })
}

// 检查部门编码是否重复
export function checkDepartmentCode(deptCode, excludeId = null) {
    const params = { deptCode }
    if (excludeId !== null) {
        params.excludeId = excludeId
    }
    return request.get(`/api/department/checkCode`, {
        params,
        
    })
}
