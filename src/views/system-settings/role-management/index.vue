<template>
  <div class="role-management-container">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="openAddDialog">新增角色</el-button>
    </div>

    <!-- 角色列表 -->
    <el-table :data="roleList" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="角色名称" width="150" />
      <el-table-column prop="code" label="角色编码" width="120" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column label="权限" min-width="250">
        <template #default="scope">
          <el-tag v-if="scope.row.permissions.includes('*')" type="danger" effect="dark"> 所有权限 </el-tag>
          <template v-else>
            <el-popover placement="top" width="400" trigger="hover">
              <template #reference>
                <div class="permission-tag-container">
                  <el-tag v-for="(perm, index) in getDisplayPermissions(scope.row.permissions)" :key="index" class="permission-tag" size="small">
                    {{ getPermissionName(perm) }}
                  </el-tag>
                  <el-tag v-if="scope.row.permissions.length > 3" size="small" type="info"> +{{ scope.row.permissions.length - 3 }} 项 </el-tag>
                </div>
              </template>
              <div class="permission-list">
                <el-tag v-for="perm in scope.row.permissions" :key="perm" class="permission-tag-full" size="small">
                  {{ getPermissionName(perm) }}
                </el-tag>
              </div>
            </el-popover>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-popconfirm :title="`确定删除角色 ${scope.row.name} 吗？`" @confirm="handleDelete(scope.row.id)">
            <template #reference>
              <el-button size="small" type="danger" :disabled="scope.row.code === 'admin'"> 删除 </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog :title="dialogType === 'add' ? '新增角色' : '编辑角色'" v-model="dialogVisible" width="600px">
      <el-form :model="roleForm" :rules="roleFormRules" ref="roleFormRef" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="角色编码" prop="code">
          <el-select v-model="roleForm.code" placeholder="请选择角色编码" style="width: 100%" :disabled="dialogType === 'edit'">
            <el-option label="系统管理员" value="admin" :disabled="dialogType === 'add'" />
            <el-option label="部门经理" value="manager" />
            <el-option label="销售员" value="sales" />
            <el-option label="采购员" value="purchase" />
            <el-option label="财务专员" value="finance" />
            <el-option label="库存管理员" value="inventory" />
            <el-option label="质检员" value="qc" />
          </el-select>
        </el-form-item>

        <el-form-item label="角色描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" placeholder="请输入角色描述" :rows="2" />
        </el-form-item>

        <el-form-item label="角色权限" prop="permissions">
          <el-checkbox v-model="selectAllPermissions">全选</el-checkbox>

          <el-divider content-position="left">基础权限</el-divider>
          <el-checkbox-group v-model="roleForm.permissions">
            <el-checkbox label="*">所有权限</el-checkbox>
            <el-checkbox label="dashboard:view">仪表盘查看</el-checkbox>
          </el-checkbox-group>

          <el-divider content-position="left">采购模块权限</el-divider>
          <el-checkbox-group v-model="roleForm.permissions">
            <el-checkbox label="purchase:*">采购所有权限</el-checkbox>
            <el-checkbox label="purchase:view">采购查看</el-checkbox>
            <el-checkbox label="purchase:create">采购创建</el-checkbox>
            <el-checkbox label="purchase:edit">采购编辑</el-checkbox>
            <el-checkbox label="supplier:view">供应商查看</el-checkbox>
          </el-checkbox-group>

          <el-divider content-position="left">销售模块权限</el-divider>
          <el-checkbox-group v-model="roleForm.permissions">
            <el-checkbox label="sales:*">销售所有权限</el-checkbox>
            <el-checkbox label="sales:view">销售查看</el-checkbox>
            <el-checkbox label="sales:create">销售创建</el-checkbox>
            <el-checkbox label="sales:edit">销售编辑</el-checkbox>
            <el-checkbox label="customer:view">客户查看</el-checkbox>
          </el-checkbox-group>

          <el-divider content-position="left">财务模块权限</el-divider>
          <el-checkbox-group v-model="roleForm.permissions">
            <el-checkbox label="finance:*">财务所有权限</el-checkbox>
            <el-checkbox label="finance:view">财务查看</el-checkbox>
            <el-checkbox label="finance:edit">财务编辑</el-checkbox>
            <el-checkbox label="report:view">报表查看</el-checkbox>
          </el-checkbox-group>

          <el-divider content-position="left">库存模块权限</el-divider>
          <el-checkbox-group v-model="roleForm.permissions">
            <el-checkbox label="inventory:*">库存所有权限</el-checkbox>
            <el-checkbox label="inventory:view">库存查看</el-checkbox>
            <el-checkbox label="inventory:edit">库存编辑</el-checkbox>
            <el-checkbox label="product:view">商品查看</el-checkbox>
          </el-checkbox-group>

          <el-divider content-position="left">质检模块权限</el-divider>
          <el-checkbox-group v-model="roleForm.permissions">
            <el-checkbox label="qc:*">质检所有权限</el-checkbox>
            <el-checkbox label="qc:view">质检查看</el-checkbox>
            <el-checkbox label="qc:create">质检创建</el-checkbox>
            <el-checkbox label="qc:edit">质检编辑</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRoleForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useUserStore, type Role, type UserRole } from '../../../stores/user'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 获取用户 store
const userStore = useUserStore()

// 角色列表
const roleList = ref<Role[]>([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const roleForm = reactive<Partial<Role>>({
  name: '',
  code: 'admin' as UserRole,
  description: '',
  permissions: []
})
const roleFormRef = ref<FormInstance>()
const roleFormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请选择角色编码', trigger: 'change' }],
  description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }],
  permissions: [{ required: true, message: '请选择权限', trigger: 'change', type: 'array' }]
}

// 全选权限
const selectAllPermissions = ref(false)
// 所有权限列表
const allPermissions = computed(() => {
  return userStore.permissionList.map(p => p.code)
})

// 监听全选按钮变化
watch(selectAllPermissions, val => {
  if (val) {
    // 当点击全选时，选择所有权限
    roleForm.permissions = [...allPermissions.value]
  } else {
    // 当取消全选时，清空所有权限
    roleForm.permissions = []
  }
})

// 监听权限列表变化，更新全选按钮状态
watch(
  () => roleForm.permissions,
  val => {
    // 如果包含 * 权限，则视为全选
    if (val && val.includes('*')) {
      selectAllPermissions.value = true
      return
    }

    // 判断是否所有权限都已选中
    selectAllPermissions.value = val && allPermissions.value.length > 0 && val.length === allPermissions.value.length && allPermissions.value.every(p => val.includes(p))
  },
  { deep: true }
)

// 获取角色列表
const fetchRoles = () => {
  roleList.value = [...userStore.roleList]
}

// 打开新增角色弹窗
const openAddDialog = () => {
  dialogType.value = 'add'
  roleForm.name = ''
  roleForm.code = 'admin' as UserRole
  roleForm.description = ''
  roleForm.permissions = []
  selectAllPermissions.value = false
  dialogVisible.value = true
}

// 打开编辑角色弹窗
const openEditDialog = (role: Role) => {
  dialogType.value = 'edit'
  roleForm.id = role.id
  roleForm.name = role.name
  roleForm.code = role.code
  roleForm.description = role.description
  roleForm.permissions = [...role.permissions]
  dialogVisible.value = true
}

// 提交角色表单
const submitRoleForm = async () => {
  if (!roleFormRef.value) return

  await roleFormRef.value.validate(valid => {
    if (valid) {
      if (dialogType.value === 'add') {
        // 检查角色编码是否已存在
        const existingRole = userStore.roleList.find(r => r.code === roleForm.code)
        if (existingRole) {
          ElMessage.error(`角色编码 ${roleForm.code} 已存在`)
          return
        }

        // 新增角色
        const newRole = userStore.addRole({
          name: roleForm.name!,
          code: roleForm.code as any,
          description: roleForm.description!,
          permissions: roleForm.permissions!
        })
        ElMessage.success(`角色 ${newRole.name} 添加成功`)
      } else {
        // 编辑角色
        userStore.updateRole(roleForm.id!, {
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions
        })
        ElMessage.success(`角色 ${roleForm.name} 更新成功`)
      }

      dialogVisible.value = false
      fetchRoles()
    }
  })
}

// 删除角色
const handleDelete = (id: number) => {
  const result = userStore.deleteRole(id)
  if (result.success) {
    ElMessage.success('角色删除成功')
    fetchRoles()
  } else {
    ElMessage.error(result.message)
  }
}

// 获取权限名称
const getPermissionName = (code: string): string => {
  const permission = userStore.permissionList.find(p => p.code === code)
  return permission ? permission.name : code
}

// 获取用于显示的权限列表（最多3个）
const getDisplayPermissions = (permissions: string[]): string[] => {
  if (permissions.includes('*')) {
    return ['*']
  }
  return permissions.slice(0, 3)
}

// 页面初始化时获取角色列表
onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.role-management-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.permission-tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
}

.permission-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.permission-tag-full {
  margin: 2px;
}

.permission-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
}
</style>
