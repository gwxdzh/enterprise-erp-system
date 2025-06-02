import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useUserStore } from '../stores/user';

// 布局组件
const Layout = () => import('@/layouts/MainLayout.vue');

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '控制台', icon: 'HomeFilled' }
      }
    ]
  },
  // 采购管理
  {
    path: '/purchase',
    component: Layout,
    redirect: '/purchase/supplier',
    name: 'Purchase',
    meta: { title: '采购管理', icon: 'ShoppingCartFull', permissions: ['purchase:view'] },
    children: [
      {
        path: 'supplier',
        name: 'Supplier',
        component: () => import('@/views/purchase/supplier/index.vue'),
        meta: { title: '供应商管理', permissions: ['supplier:view'] }
      },
      {
        path: 'order',
        name: 'PurchaseOrder',
        component: () => import('@/views/purchase/order/index.vue'),
        meta: { title: '采购订单', permissions: ['purchase:view'] }
      },
      {
        path: 'warehousing',
        name: 'Warehousing',
        component: () => import('@/views/purchase/warehousing/index.vue'),
        meta: { title: '采购入库', permissions: ['purchase:view', 'inventory:view'] }
      },
      {
        path: 'return',
        name: 'PurchaseReturn',
        component: () => import('@/views/purchase/return/index.vue'),
        meta: { title: '采购退货', permissions: ['purchase:view'] }
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('@/views/purchase/payment/index.vue'),
        meta: { title: '应付账款', permissions: ['purchase:view', 'finance:view'] }
      }
    ]
  }, 
  // 销售管理
  {
    path: '/sales',
    component: Layout,
    redirect: '/sales/customer',
    name: 'Sales',
    meta: { title: '销售管理', icon: 'Goods', permissions: ['sales:view'] },
    children: [
      {
        path: 'customer',
        name: 'Customer',
        component: () => import('@/views/sales/customer/index.vue'),
        meta: { title: '客户管理', permissions: ['customer:view'] }
      },
      {
        path: 'order',
        name: 'SalesOrder',
        component: () => import('@/views/sales/order/index.vue'),
        meta: { title: '销售订单', permissions: ['sales:view'] }
      },
      {
        path: 'delivery',
        name: 'Delivery',
        component: () => import('@/views/sales/delivery/index.vue'),
        meta: { title: '销售出库', permissions: ['sales:view', 'inventory:view'] }
      },
      {
        path: 'return',
        name: 'SalesReturn',
        component: () => import('@/views/sales/return/index.vue'),
        meta: { title: '销售退货', permissions: ['sales:view'] }
      },
      {
        path: 'receipt',
        name: 'Receipt',
        component: () => import('@/views/sales/receipt/index.vue'),
        meta: { title: '应收账款', permissions: ['sales:view', 'finance:view'] }
      },
    ]
  },
  // 库存管理
  {
    path: '/inventory',
    component: Layout,
    redirect: '/inventory/warehouse',
    name: 'Inventory',
    meta: { title: '库存管理', icon: 'Management', permissions: ['inventory:view'] },
    children: [
      {
        path: 'warehouse',
        name: 'Warehouse',
        component: () => import('@/views/inventory/warehouse/index.vue'),
        meta: { title: '仓库管理', permissions: ['inventory:view'] }
      },
      {
        path: 'query',
        name: 'InventoryQuery',
        component: () => import('@/views/inventory/query/index.vue'),
        meta: { title: '库存查询', permissions: ['inventory:view'] }
      },
      {
        path: 'transfer',
        name: 'Transfer',
        component: () => import('@/views/inventory/transfer/index.vue'),
        meta: { title: '库存调拨', permissions: ['inventory:edit'] }
      },
      {
        path: 'check',
        name: 'InventoryCheck',
        component: () => import('@/views/inventory/check/index.vue'),
        meta: { title: '库存盘点', permissions: ['inventory:edit'] }
      },
      {
        path: 'adjust',
        name: 'InventoryAdjust',
        component: () => import('@/views/inventory/adjust/index.vue'),
        meta: { title: '库存调整', permissions: ['inventory:edit'] }
      }
    ]
  },
  // 财务管理
  {
    path: '/finance',
    component: Layout,
    redirect: '/finance/payment-receipt',
    name: 'Finance',
    meta: { title: '财务管理', icon: 'Money', permissions: ['finance:view'] },
    children: [
      {
        path: 'payment-receipt',
        name: 'PaymentReceipt',
        component: () => import('@/views/finance/payment-receipt/index.vue'),
        meta: { title: '收付款管理', permissions: ['finance:view'] }
      },
      {
        path: 'expense',
        name: 'FinanceExpense',
        component: () => import('@/views/finance/expense/index.vue'),
        meta: { title: '费用管理', permissions: ['finance:view'] }
      },
      {
        path: 'report',
        name: 'FinanceReport',
        component: () => import('@/views/finance/report/index.vue'),
        meta: { title: '财务报表', icon: 'Document', permissions: ['finance:view', 'report:view'] }
      }
    ]
  },
  // 基础数据
  {
    path: '/base-data',
    component: Layout,
    redirect: '/base-data/product',
    name: 'BaseData',
    meta: { title: '基础数据', icon: 'DataAnalysis', permissions: ['product:view'] },
    children: [
      {
        path: 'product',
        name: 'Product',
        component: () => import('@/views/base-data/product/index.vue'),
        meta: { title: '商品管理', permissions: ['product:view'] }
      },
      {
        path: 'unit',
        name: 'Unit',
        component: () => import('@/views/base-data/unit/index.vue'),
        meta: { title: '单位管理', permissions: ['product:view'] }
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import('@/views/base-data/category/index.vue'),
        meta: { title: '分类管理', permissions: ['product:view'] }
      }
    ]
  },
  // 系统设置
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    name: 'System',
    meta: { title: '系统设置', icon: 'Setting', permissions: ['*'] },
    children: [
      {
        path: 'user',
        name: 'UserManagement',
        component: () => import('@/views/system-settings/user-management/index.vue'),
        meta: { title: '用户管理', permissions: ['*'] }
      },
      {
        path: 'role',
        name: 'RoleManagement',
        component: () => import('@/views/system-settings/role-management/index.vue'),
        meta: { title: '角色管理', permissions: ['*'] }
      }
    ]
  },
  // 登录注册
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - ERP系统` : 'ERP系统';
  
  // 判断是否登录
  const token = localStorage.getItem('token');
  if (to.path === '/login') {
    if (token) {
      next('/');
      return;
    }
    next();
    return;
  }
  
  if (!token) {
    next('/login');
    return;
  }
  
  // 获取用户信息和权限
  const userStore = useUserStore();
  if (!userStore.permissions.length) {
    userStore.getUserPermissions();
  }
  
  // 检查权限
  if (to.meta && to.meta.permissions) {
    const requiredPermissions = to.meta.permissions as string[];
    // 检查用户是否有所需权限
    const hasPermission = requiredPermissions.some(permission => 
      userStore.hasPermission(permission)
    );
    
    if (!hasPermission) {
      next('/404');
      return;
    }
  }
  
  next();
});

export default router; 