import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

// 用户角色类型
export type UserRole = 'admin' | 'manager' | 'sales' | 'purchase' | 'finance' | 'inventory' | 'qc';

// 用户类型定义
export interface User {
  id: number;
  username: string;
  password: string;
  realName: string;
  avatar?: string;
  email?: string;
  phone?: string;
  department?: string;
  roles: UserRole[];
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

// 权限定义
export interface Permission {
  id: number;
  name: string;
  code: string;
  description: string;
}

// 角色定义
export interface Role {
  id: number;
  name: string;
  code: UserRole;
  description: string;
  permissions: string[]; // 权限代码列表
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'));
  const userInfo = ref<User | null>(null);
  const permissions = ref<string[]>([]);
  const roleList = ref<Role[]>([
    {
      id: 1,
      name: '系统管理员',
      code: 'admin',
      description: '系统管理员，拥有所有权限',
      permissions: ['*'] // 所有权限
    },
    {
      id: 2,
      name: '销售员',
      code: 'sales',
      description: '负责销售订单管理',
      permissions: ['sales:view', 'sales:edit', 'customer:view', 'customer:edit', 'product:view']
    },
    {
      id: 3,
      name: '采购员',
      code: 'purchase',
      description: '负责采购订单管理',
      permissions: ['purchase:view', 'purchase:edit', 'supplier:view', 'supplier:edit', 'product:view']
    },
    {
      id: 4,
      name: '财务专员',
      code: 'finance',
      description: '负责财务管理',
      permissions: ['finance:view', 'finance:edit', 'report:view']
    },
    {
      id: 5,
      name: '仓库管理员',
      code: 'inventory',
      description: '负责库存管理',
      permissions: ['inventory:view', 'inventory:edit', 'product:view']
    },
    {
      id: 6,
      name: '质检员',
      code: 'qc',
      description: '负责质量检查',
      permissions: ['qc:view', 'qc:edit', 'inventory:view']
    }
  ]);

  // 用户列表
  const userList = ref<User[]>([
    {
      id: 1,
      username: 'admin',
      password: '123456',
      realName: '系统管理员',
      avatar: '',
      email: 'admin@example.com',
      phone: '13800000000',
      department: '管理部',
      roles: ['admin'],
      status: 'active',
      lastLogin: '2023-06-01 08:00:00',
      createdAt: '2023-01-01'
    },
    {
      id: 2,
      username: 'sales',
      password: '123456',
      realName: '张三',
      avatar: '',
      email: 'sales@example.com',
      phone: '13800000001',
      department: '销售部',
      roles: ['sales'],
      status: 'active',
      lastLogin: '2023-06-01 09:00:00',
      createdAt: '2023-01-02'
    },
    {
      id: 3,
      username: 'purchase',
      password: '123456',
      realName: '李四',
      avatar: '',
      email: 'purchase@example.com',
      phone: '13800000002',
      department: '采购部',
      roles: ['purchase'],
      status: 'active',
      lastLogin: '2023-06-01 10:00:00',
      createdAt: '2023-01-03'
    },
    {
      id: 4,
      username: 'finance',
      password: '123456',
      realName: '王五',
      avatar: '',
      email: 'finance@example.com',
      phone: '13800000003',
      department: '财务部',
      roles: ['finance'],
      status: 'active',
      lastLogin: '2023-06-01 11:00:00',
      createdAt: '2023-01-04'
    },
    {
      id: 5,
      username: 'inventory',
      password: '123456',
      realName: '赵六',
      avatar: '',
      email: 'inventory@example.com',
      phone: '13800000004',
      department: '仓储部',
      roles: ['inventory'],
      status: 'active',
      lastLogin: '2023-06-01 12:00:00',
      createdAt: '2023-01-05'
    },
    {
      id: 6,
      username: 'qc',
      password: '123456',
      realName: '钱七',
      avatar: '',
      email: 'qc@example.com',
      phone: '13800000005',
      department: '质检部',
      roles: ['qc'],
      status: 'active',
      lastLogin: '2023-06-01 13:00:00',
      createdAt: '2023-01-06'
    }
  ]);

  // 权限列表
  const permissionList = ref<Permission[]>([
    { id: 1, code: 'sales:view', name: '查看销售', description: '查看销售订单和客户信息' },
    { id: 2, code: 'sales:edit', name: '编辑销售', description: '创建和修改销售订单' },
    { id: 3, code: 'customer:view', name: '查看客户', description: '查看客户信息' },
    { id: 4, code: 'customer:edit', name: '编辑客户', description: '创建和修改客户信息' },
    { id: 5, code: 'purchase:view', name: '查看采购', description: '查看采购订单和供应商信息' },
    { id: 6, code: 'purchase:edit', name: '编辑采购', description: '创建和修改采购订单' },
    { id: 7, code: 'supplier:view', name: '查看供应商', description: '查看供应商信息' },
    { id: 8, code: 'supplier:edit', name: '编辑供应商', description: '创建和修改供应商信息' },
    { id: 9, code: 'inventory:view', name: '查看库存', description: '查看库存信息' },
    { id: 10, code: 'inventory:edit', name: '编辑库存', description: '创建和修改库存信息' },
    { id: 11, code: 'product:view', name: '查看商品', description: '查看商品信息' },
    { id: 12, code: 'product:edit', name: '编辑商品', description: '创建和修改商品信息' },
    { id: 13, code: 'finance:view', name: '查看财务', description: '查看财务信息' },
    { id: 14, code: 'finance:edit', name: '编辑财务', description: '创建和修改财务信息' },
    { id: 15, code: 'report:view', name: '查看报表', description: '查看报表信息' },
    { id: 16, code: 'qc:view', name: '查看质检', description: '查看质检信息' },
    { id: 17, code: 'qc:edit', name: '编辑质检', description: '创建和修改质检信息' },
    { id: 18, code: '*', name: '所有权限', description: '系统所有权限' }
  ]);

  // 登录
  function login(username: string, password: string) {
    // 模拟登录验证
    const user = userList.value.find(u => u.username === username && u.password === password);
    
    if (user) {
      // 生成token（实际项目中应该由后端生成）
      const newToken = `${username}-token-${Date.now()}`;
      
      // 更新状态
      token.value = newToken;
      userInfo.value = { ...user };
      
      // 存储token
      localStorage.setItem('token', newToken);
      
      // 获取用户权限
      getUserPermissions();
      
      return { success: true };
    }
    
    return { success: false, message: '用户名或密码错误' };
  }

  // 登出
  function logout() {
    token.value = null;
    userInfo.value = null;
    permissions.value = [];
    localStorage.removeItem('token');
  }

  // 获取用户权限
  function getUserPermissions() {
    if (!userInfo.value) return [];
    
    const userRoles = userInfo.value.roles;
    const userRoleList = roleList.value.filter(role => userRoles.includes(role.code));
    
    // 收集所有权限
    const allPermissions: string[] = [];
    userRoleList.forEach(role => {
      role.permissions.forEach(permission => {
        if (!allPermissions.includes(permission)) {
          allPermissions.push(permission);
        }
      });
    });
    
    permissions.value = allPermissions;
    return allPermissions;
  }

  // 检查是否有某个权限
  function hasPermission(permission: string) {
    // 如果有通配符权限，直接返回true
    if (permissions.value.includes('*')) {
      return true;
    }
    
    return permissions.value.includes(permission);
  }

  // 添加用户
  function addUser(user: Omit<User, 'id' | 'createdAt'>) {
    const newUser: User = {
      ...user,
      id: userList.value.length + 1,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    userList.value.push(newUser);
    return newUser;
  }

  // 更新用户
  function updateUser(id: number, userData: Partial<User>) {
    const index = userList.value.findIndex(u => u.id === id);
    if (index !== -1) {
      userList.value[index] = { ...userList.value[index], ...userData };
      return userList.value[index];
    }
    return null;
  }

  // 删除用户
  function deleteUser(id: number) {
    const index = userList.value.findIndex(u => u.id === id);
    if (index !== -1) {
      userList.value.splice(index, 1);
      return true;
    }
    return false;
  }

  // 添加角色
  function addRole(role: Omit<Role, 'id'>) {
    const newRole: Role = {
      ...role,
      id: roleList.value.length + 1
    };
    
    roleList.value.push(newRole);
    return newRole;
  }

  // 更新角色
  function updateRole(id: number, roleData: Partial<Role>) {
    const index = roleList.value.findIndex(r => r.id === id);
    if (index !== -1) {
      roleList.value[index] = { ...roleList.value[index], ...roleData };
      return roleList.value[index];
    }
    return null;
  }

  // 删除角色
  function deleteRole(id: number) {
    const index = roleList.value.findIndex(r => r.id === id);
    if (index !== -1) {
      roleList.value.splice(index, 1);
      return true;
    }
    return false;
  }

  return {
    token,
    userInfo,
    permissions,
    userList,
    roleList,
    permissionList,
    login,
    logout,
    getUserPermissions,
    hasPermission,
    addUser,
    updateUser,
    deleteUser,
    addRole,
    updateRole,
    deleteRole
  };
}); 