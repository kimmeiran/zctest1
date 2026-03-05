<template>
    <div class="department-management">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-button type="primary" size="small" @click="showAddDialog(0)">
          新增部门
        </el-button>
      </div>

      <div style="height: 10px;"></div>
  
      <!-- 部门表格 -->
      <el-table
        :key="tableKey"
        :data="departmentTree"
        v-loading="loading"
        row-key="id"
        border
        :tree-props="treeProps"
        :indent="20"
        :expand-row-keys="expandedKeys"
        :lazy="true"
        :load="loadChildren"
        :render-after-expand="false"
      >
        <el-table-column prop="deptCode" label="部门编码" width="160" />
        <el-table-column prop="deptName" label="部门名称" min-width="200" />
        <el-table-column prop="deptLevel" label="层级" width="80" align="center" />
        <el-table-column prop="deptOrder" label="排序" width="80" align="center" />
        <el-table-column prop="deptStatus" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.deptStatus === 1 ? 'success' : 'danger'" size="small">
              {{ row.deptStatus === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="showAddDialog(row.id)">
              新增
            </el-button>
            <el-button size="small" type="warning" @click="showEditDialog(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
  
      <!-- 新增部门对话框 -->
      <el-dialog v-model="dialogVisible" title="新增部门" width="460px" @close="resetAddForm">
        <el-form :model="addForm" label-width="90px">
          <el-form-item label="上级部门">
            <span v-if="addForm.parentId === 0">顶级部门</span>
            <span v-else>{{ getDeptNameById(addForm.parentId) || ('ID ' + addForm.parentId) }}</span>
          </el-form-item>
          <el-form-item label="部门编码">
            <el-input v-model="addForm.deptCode" placeholder="请输入部门编码" />
          </el-form-item>
          <el-form-item label="部门名称">
            <el-input v-model="addForm.deptName" placeholder="请输入部门名称" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="addForm.deptOrder" :min="0" :max="999" />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="addForm.deptStatus">
              <el-radio :label="1">启用</el-radio>
              <el-radio :label="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="addForm.deptDesc" type="textarea" :rows="3" placeholder="请输入描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitAdd">确定</el-button>
        </template>
      </el-dialog>

      <!-- 编辑部门对话框 -->
      <el-dialog v-model="editDialogVisible" title="编辑部门" width="460px" @close="resetEditForm">
        <el-form :model="editForm" label-width="90px">
          <el-form-item label="上级部门">
            <span v-if="editForm.parentId === 0">顶级部门</span>
            <span v-else>{{ getDeptNameById(editForm.parentId) || ('ID ' + editForm.parentId) }}</span>
          </el-form-item>
          <el-form-item label="部门编码">
            <el-input v-model="editForm.deptCode" placeholder="请输入部门编码" />
          </el-form-item>
          <el-form-item label="部门名称">
            <el-input v-model="editForm.deptName" placeholder="请输入部门名称" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="editForm.deptOrder" :min="0" :max="999" />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="editForm.deptStatus">
              <el-radio :label="1">启用</el-radio>
              <el-radio :label="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="editForm.deptDesc" type="textarea" :rows="3" placeholder="请输入描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitEdit">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, nextTick } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { getDepartmentTree, deleteDepartment, addDepartment, updateDepartment } from '@/api/department'
  
  export default {
    name: 'DepartmentManagement',
    setup() {
      const loading = ref(false)
      const departmentTree = ref([])
      const expandedKeys = ref([])
      const dialogVisible = ref(false)
      const editDialogVisible = ref(false)
      const submitting = ref(false)
      const tableKey = ref(0) // 强制刷新表格用
  
      const addForm = ref({
        parentId: 0,
        deptCode: '',
        deptName: '',
        deptOrder: 0,
        deptStatus: 1,
        deptDesc: ''
      })

      const editForm = ref({
        id: 0,
        parentId: 0,
        deptCode: '',
        deptName: '',
        deptOrder: 0,
        deptStatus: 1,
        deptDesc: ''
      })
  
      // 树配置
      const treeProps = {
        children: 'children',
        label: 'deptName',
        value: 'id',
        hasChildren: 'hasChildren'
      }
  
      // 递归规范化树数据
      const normalizeTreeData = (nodes) => {
        return (nodes || []).map((n) => {
          const childrenArr = Array.isArray(n.children) ? n.children : []
          const normalizedChildren = childrenArr.length ? normalizeTreeData(childrenArr) : []
          const hasChildren = normalizedChildren.length > 0 || Number(n.childrenCount) > 0
          return { ...n, children: normalizedChildren, hasChildren }
        })
      }
  
      // 辅助函数：树中是否存在指定 id
      const findNodeById = (nodes, id) => {
        for (const n of nodes || []) {
          if (n.id === id) return true
          if (findNodeById(n.children, id)) return true
        }
        return false
      }
  
      // 获取当前展开节点 ID
      const getExpandedIds = () => [...expandedKeys.value]
  
      // 拉取树（保留展开状态）
      const loadDepartmentTree = async () => {
        const currentExpandedIds = getExpandedIds() // 保存当前展开
        try {
          loading.value = true
          const res = await getDepartmentTree()
          if (res?.data?.code === 200) {
            const data = normalizeTreeData(res.data.data || [])
            departmentTree.value = [...data] // 新引用触发刷新
            tableKey.value++ // 强制刷新表格
  
            await nextTick()
            // 恢复展开
            expandedKeys.value = currentExpandedIds.filter(id => findNodeById(data, id))
          } else {
            ElMessage.error(res?.data?.msg || '获取部门失败')
          }
        } catch (e) {
          ElMessage.error('加载失败')
        } finally {
          loading.value = false
        }
      }
  
      // 懒加载签名必须是 (row, treeNode, resolve)
      const loadChildren = (row, treeNode, resolve) => {
        resolve(Array.isArray(row.children) ? row.children : [])
      }
  
      // 删除部门
      const handleDelete = async (dept) => {
        try {
          await ElMessageBox.confirm(`确定要删除部门"${dept.deptName}"吗？`, '确认删除', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          })
          const res = await deleteDepartment(dept.id)
          if (res?.data?.code === 200) {
            ElMessage.success('删除成功')
            await loadDepartmentTree() // 保持展开
          } else {
            ElMessage.error(res?.data?.msg || '删除失败')
          }
        } catch (err) {
          if (err !== 'cancel') ElMessage.error('删除失败')
        }
      }
  
      // 新增对话框 & 表单
      const showAddDialog = (parentId = 0) => {
        addForm.value = { parentId, deptCode: '', deptName: '', deptOrder: 0, deptStatus: 1, deptDesc: '' }
        dialogVisible.value = true
      }
      const resetAddForm = () => {
        addForm.value = { parentId: 0, deptCode: '', deptName: '', deptOrder: 0, deptStatus: 1, deptDesc: '' }
      }
      const getDeptNameById = (id) => {
        const dfs = (nodes) => {
          for (const n of nodes || []) {
            if (n.id === id) return n.deptName
            const found = dfs(n.children)
            if (found) return found
          }
          return ''
        }
        return dfs(departmentTree.value)
      }
      const submitAdd = async () => {
        if (!addForm.value.deptCode?.trim()) {
          ElMessage.error('请输入部门编码')
          return
        }
        if (!addForm.value.deptName?.trim()) {
          ElMessage.error('请输入部门名称')
          return
        }
        try {
          submitting.value = true
          const res = await addDepartment({ ...addForm.value })
          if (res?.data?.code === 200) {
            ElMessage.success('新增成功')
            dialogVisible.value = false
            await loadDepartmentTree() // 保持展开
          } else {
            ElMessage.error(res?.data?.msg || '新增失败')
          }
        } catch (e) {
          ElMessage.error('新增失败')
        } finally {
          submitting.value = false
        }
      }

      // 编辑对话框 & 表单
      const showEditDialog = (row) => {
        editForm.value = {
          id: row.id,
          parentId: row.parentId ?? 0,
          deptCode: row.deptCode || '',
          deptName: row.deptName || '',
          deptOrder: row.deptOrder ?? 0,
          deptStatus: row.deptStatus ?? 1,
          deptDesc: row.deptDesc || ''
        }
        editDialogVisible.value = true
      }
      const resetEditForm = () => {
        editForm.value = { id: 0, parentId: 0, deptCode: '', deptName: '', deptOrder: 0, deptStatus: 1, deptDesc: '' }
      }
      const submitEdit = async () => {
        if (!editForm.value.deptCode?.trim()) {
          ElMessage.error('请输入部门编码')
          return
        }
        if (!editForm.value.deptName?.trim()) {
          ElMessage.error('请输入部门名称')
          return
        }
        try {
          submitting.value = true
          const res = await updateDepartment({ ...editForm.value })
          if (res?.data?.code === 200) {
            ElMessage.success('保存成功')
            editDialogVisible.value = false
            await loadDepartmentTree() // 保持展开
          } else {
            ElMessage.error(res?.data?.msg || '保存失败')
          }
        } catch (e) {
          ElMessage.error('保存失败')
        } finally {
          submitting.value = false
        }
      }
  
      onMounted(loadDepartmentTree)
  
      return {
        loading,
        departmentTree,
        expandedKeys,
        treeProps,
        loadChildren,
        tableKey,
        dialogVisible,
        editDialogVisible,
        addForm,
        editForm,
        submitting,
        showAddDialog,
        resetAddForm,
        submitAdd,
        showEditDialog,
        resetEditForm,
        submitEdit,
        getDeptNameById,
        handleDelete
      }
    }
  }
  </script>
  
  <style scoped>
  .department-management {
    padding: 12px;
    background: #fff;
  }
  </style>