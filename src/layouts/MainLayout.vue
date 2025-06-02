<template>
  <div class="app-wrapper">
    <!-- 侧边栏 -->
    <div class="sidebar-container" :class="{ collapsed: isCollapse }">
      <div class="logo-container">
        <img v-if="isCollapse" src="/logo.png" alt="Logo" class="logo-img" />
        <img v-else src="/logo_name.png" alt="Logo" class="logo-img-full" />
      </div>

      <!-- 菜单 -->
      <el-menu :default-active="activeMenu" :collapse="isCollapse" :unique-opened="true" background-color="#304156" text-color="#bfcbd9" active-text-color="#409EFF" router>
        <!-- 首页菜单项 -->
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <template v-for="(route, index) in permittedRoutes" :key="index">
          <!-- 有子菜单的情况 -->
          <el-sub-menu v-if="route.children && route.children.length > 1" :index="route.path">
            <template #title>
              <el-icon>
                <component :is="route.meta?.icon" />
              </el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>

            <el-menu-item v-for="child in filterPermittedChildren(route)" :key="child.path" :index="route.path + '/' + child.path" class="submenu-item">
              <span>{{ child.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 没有子菜单的情况 -->
          <el-menu-item v-else-if="route.children && route.children.length === 1" :index="route.path + '/' + route.children[0].path">
            <el-icon>
              <component :is="route.meta?.icon" />
            </el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </div>

    <!-- 主体内容 -->
    <div class="main-container">
      <!-- 头部 -->
      <div class="navbar">
        <div class="left-area">
          <el-button type="text" @click="toggleSidebar">
            <el-icon :size="20">
              <component :is="isCollapse ? 'Expand' : 'Fold'" />
            </el-icon>
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta?.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="right-menu">
          <el-dropdown trigger="click">
            <div class="avatar-container">
              <el-avatar :size="30" :src="userInfo?.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'"></el-avatar>
              <span class="username">{{ userInfo?.username || '用户' }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="app-main">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { HomeFilled, Fold, Expand } from '@element-plus/icons-vue'
import type { RouteRecordRaw } from 'vue-router'

// 获取路由
const route = useRoute()
const router = useRouter()
// 获取用户store
const userStore = useUserStore()

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 侧边栏收起状态
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 检查用户是否拥有给定路由所需的权限
const hasRoutePermission = (route: RouteRecordRaw) => {
  if (!route.meta || !route.meta.permissions) {
    return true
  }

  const requiredPermissions = route.meta.permissions as string[]
  return requiredPermissions.some(permission => userStore.hasPermission(permission))
}

// 过滤有权限的子路由
const filterPermittedChildren = (route: RouteRecordRaw) => {
  return route.children?.filter(child => hasRoutePermission(child)) || []
}

// 过滤路由数据，只保留用户有权限访问的路由
const permittedRoutes = computed(() => {
  return router.options.routes
    .filter(route => {
      // 过滤掉登录页、404页面和首页(/)，因为首页单独放在菜单最上方
      if (route.path === '/login' || route.path === '/404' || route.path === '/:pathMatch(.*)' || route.path === '/') {
        return false
      }
      // 检查用户是否对父路由有权限
      return hasRoutePermission(route)
    })
    .filter(route => {
      // 过滤掉所有子路由都没有权限的路由
      if (route.children && route.children.length > 0) {
        const hasPermittedChild = route.children.some(child => hasRoutePermission(child))
        return hasPermittedChild
      }
      return true
    })
})

// 切换侧边栏收起状态
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  // 页面加载时检查登录状态
  if (!userStore.token) {
    router.push('/login')
  }
})
</script>

<style scoped>
.app-wrapper {
  display: flex;
  height: 100vh;
  width: 100%;
}

.sidebar-container {
  width: 210px;
  height: 100%;
  background: #304156;
  transition: width 0.28s;
  overflow-x: hidden;
  overflow-y: auto;
}

.sidebar-container.collapsed {
  width: 64px;
}

.logo-container {
  height: 50px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3649;
  overflow: hidden;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-img-full {
  height: 60px;
  max-width: 100%;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.navbar {
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  background-color: #fff;
}

.left-area {
  display: flex;
  align-items: center;
}

.right-menu {
  display: flex;
  align-items: center;
}

.avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
  font-size: 14px;
}

.app-main {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background-color: #f0f2f5;
}

/* 优化菜单样式 */
:deep(.el-menu) {
  border-right: none;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #263445 !important;
}

:deep(.el-menu-item:hover) {
  background-color: #263445 !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #263445 !important;
  border-left: 4px solid #409eff;
  color: #ffffff !important;
}

:deep(.el-sub-menu.is-active .el-sub-menu__title) {
  color: #f4f4f5 !important;
}

/* 子菜单项样式 */
:deep(.submenu-item) {
  padding-left: 50px !important;
}

/* 增加层次感 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
  margin: 2px 0;
}
</style>
