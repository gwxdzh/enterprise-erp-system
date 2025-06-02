<template>
  <div class="user-management-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="openAddDialog">新增用户</el-button>
    </div>

    <!-- 筛选区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="用户名">
        <el-input v-model="searchUsername" placeholder="用户名" clearable @keyup.enter="fetchUsers" />
      </el-form-item>
      <el-form-item label="部门">
        <el-input v-model="searchDepartment" placeholder="部门" clearable @keyup.enter="fetchUsers" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="searchRole" placeholder="选择角色" clearable>
          <el-option v-for="role in userStore.roleList" :key="role.id" :label="role.name" :value="role.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchStatus" placeholder="状态" clearable>
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchUsers">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 用户列表 -->
    <el-table :data="userList" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="realName" label="姓名" width="120" />
      <el-table-column prop="department" label="部门" width="120" />
      <el-table-column label="角色" min-width="150">
        <template #default="scope">
          <el-tag v-for="role in scope.row.roles" :key="role" class="role-tag" :type="getRoleTagType(role)">
            {{ getRoleName(role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="phone" label="电话" width="130" />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
            {{ scope.row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastLogin" label="最后登录时间" width="180">
        <template #default="scope">
          {{ scope.row.lastLogin ? formatDateTime(scope.row.lastLogin) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" :type="scope.row.status === 'active' ? 'danger' : 'success'" @click="toggleStatus(scope.row)">
            {{ scope.row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
          <el-popconfirm :title="`确定删除用户 ${scope.row.username} 吗？`" @confirm="deleteUserHandler(scope.row.id)">
            <template #reference>
              <el-button size="small" type="danger" :disabled="scope.row.username === 'admin'">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="pageSize" :current-page="currentPage" @current-change="handleCurrentChange" />
    </div>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog :title="dialogType === 'add' ? '新增用户' : '编辑用户'" v-model="dialogVisible" width="600px">
      <el-form :model="userForm" :rules="userFormRules" ref="userFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="dialogType === 'edit'" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="userForm.password" placeholder="请输入密码" type="password" show-password />
          <div class="form-tip" v-if="dialogType === 'edit'">不填则不修改密码</div>
        </el-form-item>

        <el-form-item label="姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请输入姓名" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="电话" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="部门" prop="department">
          <el-input v-model="userForm.department" placeholder="请输入部门" />
        </el-form-item>

        <el-form-item label="角色" prop="roles">
          <el-select v-model="userForm.roles" multiple placeholder="请选择角色" style="width: 100%">
            <el-option v-for="role in userStore.roleList" :key="role.id" :label="role.name" :value="role.code" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="userForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUserForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore, type User, type UserRole } from '../../../stores/user'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

// 获取用户 store
const userStore = useUserStore()

// 列表相关
const userList = ref<User[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// 筛选相关
const searchUsername = ref('')
const searchDepartment = ref('')
const searchRole = ref('')
const searchStatus = ref('')

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const userForm = reactive<Partial<User>>({
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  department: '',
  roles: [],
  status: 'active'
})
const userFormRef = ref<FormInstance>()
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: (form: any) => dialogType.value === 'add', message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  roles: [{ required: true, message: '请选择角色', trigger: 'change', type: 'array' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 获取用户列表
const fetchUsers = () => {
  // 从 store 中获取用户数据并应用过滤
  let users = [...userStore.userList]

  // 应用过滤条件
  if (searchUsername.value) {
    users = users.filter(u => u.username.includes(searchUsername.value))
  }
  if (searchDepartment.value) {
    users = users.filter(u => u.department && u.department.includes(searchDepartment.value))
  }
  if (searchRole.value) {
    users = users.filter(u => u.roles.includes(searchRole.value as UserRole))
  }
  if (searchStatus.value) {
    users = users.filter(u => u.status === searchStatus.value)
  }

  // 计算总数
  total.value = users.length

  // 分页
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = Math.min(startIndex + pageSize.value, total.value)
  userList.value = users.slice(startIndex, endIndex)
}

// 重置筛选条件
const resetSearch = () => {
  searchUsername.value = ''
  searchDepartment.value = ''
  searchRole.value = ''
  searchStatus.value = ''
  currentPage.value = 1
  fetchUsers()
}

// 分页处理
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchUsers()
}

// 打开新增用户弹窗
const openAddDialog = () => {
  dialogType.value = 'add'
  userForm.username = ''
  userForm.password = ''
  userForm.realName = ''
  userForm.email = ''
  userForm.phone = ''
  userForm.department = ''
  userForm.roles = []
  userForm.status = 'active'
  dialogVisible.value = true
}

// 打开编辑用户弹窗
const openEditDialog = (user: User) => {
  dialogType.value = 'edit'
  Object.assign(userForm, {
    id: user.id,
    username: user.username,
    password: '', // 不显示密码
    realName: user.realName,
    email: user.email,
    phone: user.phone,
    department: user.department,
    roles: [...user.roles],
    status: user.status
  })
  dialogVisible.value = true
}

// 提交用户表单
const submitUserForm = async () => {
  if (!userFormRef.value) return

  await userFormRef.value.validate(valid => {
    if (valid) {
      if (dialogType.value === 'add') {
        // 新增用户
        const newUser = userStore.addUser({
          username: userForm.username!,
          password: userForm.password!,
          realName: userForm.realName!,
          email: userForm.email,
          phone: userForm.phone,
          department: userForm.department,
          roles: userForm.roles as UserRole[],
          status: userForm.status as 'active' | 'inactive'
        })
        ElMessage.success(`用户 ${newUser.username} 添加成功`)
      } else {
        // 编辑用户
        const updateData: Partial<User> = {
          realName: userForm.realName,
          email: userForm.email,
          phone: userForm.phone,
          department: userForm.department,
          roles: userForm.roles as UserRole[],
          status: userForm.status as 'active' | 'inactive'
        }

        // 如果提供了新密码，则更新密码
        if (userForm.password) {
          updateData.password = userForm.password
        }

        userStore.updateUser(userForm.id!, updateData)
        ElMessage.success(`用户 ${userForm.username} 更新成功`)
      }

      dialogVisible.value = false
      fetchUsers()
    }
  })
}

// 切换用户状态
const toggleStatus = (user: User) => {
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  userStore.updateUser(user.id, { status: newStatus })
  ElMessage.success(`用户 ${user.username} 已${newStatus === 'active' ? '启用' : '禁用'}`)
  fetchUsers()
}

// 删除用户
const deleteUserHandler = (id: number) => {
  userStore.deleteUser(id)
  ElMessage.success('用户删除成功')
  fetchUsers()
}

// 获取角色名称
const getRoleName = (code: string): string => {
  const role = userStore.roleList.find(r => r.code === code)
  return role ? role.name : code
}

// 获取角色标签类型
const getRoleTagType = (code: string): '' | 'success' | 'info' | 'warning' | 'danger' => {
  switch (code) {
    case 'admin':
      return 'danger'
    case 'manager':
      return 'warning'
    case 'sales':
    case 'purchase':
    case 'finance':
    case 'inventory':
      return 'success'
    case 'qc':
      return 'info'
    default:
      return ''
  }
}

// 格式化日期时间
const formatDateTime = (dateTime: string): string => {
  try {
    const date = new Date(dateTime)
    return date.toLocaleString()
  } catch {
    return dateTime
  }
}

// 页面初始化时获取用户列表
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.role-tag {
  margin-right: 5px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
