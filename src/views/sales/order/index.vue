<template>
  <div class="order-container">
    <!-- 筛选区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="订单编号">
        <el-input v-model="searchOrderNo" placeholder="订单编号" clearable @keyup.enter="fetchOrders" />
      </el-form-item>
      <el-form-item label="客户">
        <el-input v-model="searchCustomer" placeholder="客户名称" clearable @keyup.enter="fetchOrders" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchStatus" placeholder="订单状态" clearable @change="fetchOrders" style="width: 120px">
          <el-option label="草稿" value="草稿" />
          <el-option label="待审核" value="待审核" />
          <el-option label="待发货" value="待发货" />
          <el-option label="部分发货" value="部分发货" />
          <el-option label="待收款" value="待收款" />
          <el-option label="已完成" value="已完成" />
          <el-option label="已关闭" value="已关闭" />
          <el-option label="退货待处理" value="退货待处理" />
          <el-option label="退货成功" value="退货成功" />
          <el-option label="退货待审核" value="退货待审核" />
          <el-option label="退货已驳回" value="退货已驳回" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchOrders">搜索</el-button>
        <el-button @click="handleReset" style="margin-left: 4px">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <div class="table-toolbar">
      <el-button type="primary" @click="openAddDialog">新建订单</el-button>
    </div>

    <!-- 订单表格 -->
    <el-table :data="orderList" border stripe style="width: 100%">
      <el-table-column prop="orderNo" label="订单编号" min-width="120" />
      <el-table-column prop="customerName" label="客户" min-width="150" />
      <el-table-column prop="orderDate" label="下单日期" min-width="120" />
      <el-table-column prop="totalAmount" label="总金额" min-width="100">
        <template #default="scope">
          <span>￥{{ scope.row.totalAmount.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="scope">
          <el-tag class="custom-status-tag" :style="`color: ${orderStatusColor(scope.row.status)}; border-color: ${orderStatusColor(scope.row.status)}; background: #fff;`" effect="plain">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openViewDialog(scope.row)">查看</el-button>
          <el-button v-if="scope.row.status === '草稿'" size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button v-if="scope.row.status === '草稿' || scope.row.status === '待审核'" size="small" type="success" @click="handleAudit(scope.row)">审核</el-button>
          <el-button v-if="scope.row.status === '待发货' || scope.row.status === '部分发货'" size="small" type="warning" @click="handleDeliver(scope.row)">发货</el-button>
          <el-button v-if="scope.row.status === '待收款'" size="small" type="info" @click="handleReceive(scope.row)">收款</el-button>
          <el-button v-if="scope.row.status === '草稿'" size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="fetchOrders" />
    </div>

    <!-- 新建/编辑订单弹窗 -->
    <OrderForm v-model:visible="dialogVisible" :order="currentOrder" :is-edit="isEdit" @refresh="fetchOrders" />

    <OrderDetail v-model:visible="detailVisible" :order="detailOrder" @refresh="fetchOrders" @split="openSplitDialog" @merge="openMergeDialog" />
    <SplitOrder v-model:visible="splitVisible" :order="splitOrder" @refresh="fetchOrders" />
    <MergeOrder v-model:visible="mergeVisible" :orders="mergeOrders" @refresh="fetchOrders" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import type { LocationQueryRaw } from 'vue-router'
import { useUserStore } from '../../../stores/user'
import OrderForm from './OrderForm.vue'
import OrderDetail from './OrderDetail.vue'
import SplitOrder from './SplitOrder.vue'
import MergeOrder from './MergeOrder.vue'
import { allSalesOrders, type SalesOrder } from '../../../stores/salesOrderData'
import { allSalesDeliveries } from '../../../stores/salesDeliveryData'

// 获取路由实例
const router = useRouter()
// 获取用户store
const userStore = useUserStore()

// 检查是否有销售编辑权限
const hasSalesEditPermission = () => {
  return userStore.hasPermission('sales:edit')
}

// 数据类型统一
type OrderItem = SalesOrder

const orderList = ref<SalesOrder[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// 筛选相关
const searchOrderNo = ref('')
const searchCustomer = ref('')
const searchStatus = ref('')

// 弹窗相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentOrder = ref<SalesOrder | null>(null)
const detailVisible = ref(false)
const detailOrder = ref<SalesOrder | null>(null)
const splitVisible = ref(false)
const splitOrder = ref<SalesOrder | null>(null)
const mergeVisible = ref(false)
const mergeOrders = ref<SalesOrder[]>([])

// 状态标签类型
function orderStatusColor(status: string) {
  switch (status) {
    case '草稿':
      return '#909399' // 灰
    case '待审核':
      return '#409EFF' // 蓝
    case '待发货':
      return '#E6A23C' // 橙
    case '部分发货':
      return '#E6A23C' // 橙
    case '待收款':
      return '#0052D9' // 深蓝
    case '已完成':
      return '#67C23A' // 绿
    case '已关闭':
      return '#F56C6C' // 红
    case '退货待处理':
      return '#E6A23C' // 橙
    case '退货成功':
      return '#67C23A' // 绿
    case '退货待审核':
      return '#409EFF' // 蓝
    case '退货已驳回':
      return '#F56C6C' // 红
    default:
      return '#909399'
  }
}

// 获取订单列表
function fetchOrders() {
  let list = allSalesOrders.value
  if (searchOrderNo.value) {
    list = list.filter(item => item.orderNo.includes(searchOrderNo.value.trim()))
  }
  if (searchCustomer.value) {
    list = list.filter(item => item.customerName.includes(searchCustomer.value.trim()))
  }
  if (searchStatus.value) {
    list = list.filter(item => item.status === searchStatus.value)
  }
  total.value = list.length
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  orderList.value = list.slice(startIndex, endIndex)
}

function handleReset() {
  searchOrderNo.value = ''
  searchCustomer.value = ''
  searchStatus.value = ''
  currentPage.value = 1
  fetchOrders()
}

function openAddDialog() {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限创建销售订单')
    return
  }
  isEdit.value = false
  currentOrder.value = null
  dialogVisible.value = true
}

function openEditDialog(row: SalesOrder) {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限编辑销售订单')
    return
  }
  isEdit.value = true
  currentOrder.value = { ...row }
  dialogVisible.value = true
}

function openViewDialog(row: SalesOrder) {
  detailOrder.value = row
  detailVisible.value = true
}

function handleAudit(row: SalesOrder) {
  if (row.status === '待审核' || row.status === '草稿') {
    row.status = '待发货'
    // 随机备注
    const remarks = ['优先发货', '请尽快处理', '正常出库', '注意包装', '客户催单', '无特殊要求']
    const remark = remarks[Math.floor(Math.random() * remarks.length)]
    // 生成出库单
    const nextId = allSalesDeliveries.value.length > 0 ? Math.max(...allSalesDeliveries.value.map(d => d.id)) + 1 : 1
    const date = new Date()
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const deliveryNo = `SD${y}${m}${d}${String(nextId).padStart(3, '0')}`
    allSalesDeliveries.value.push({
      id: nextId,
      deliveryNo,
      orderNo: row.orderNo,
      customerName: row.customerName,
      deliveryDate: row.orderDate,
      items: row.items
        .filter(item => item.productId !== null)
        .map(item => ({
          productId: item.productId as number,
          productName: item.productName,
          quantity: item.quantity,
          warehouseId: item.warehouseId || 1,
          warehouseName: item.warehouseName || '上海总仓'
        })),
      operator: '张三',
      remark
    })
    ElMessage.success('审核通过，状态已变为待发货，已生成出库单')
    fetchOrders()
  }
}

function handleDeliver(row: SalesOrder) {
  if (row.status === '待发货' || row.status === '部分发货') {
    // 跳转到销售出库页面并传递订单信息
    const query: LocationQueryRaw = {
      orderNo: row.orderNo,
      showDetail: '1' // 标记需要显示详情弹窗
    }
    router.push({
      path: '/sales/delivery',
      query
    })
    ElMessage.info(`正在跳转到销售出库页面处理订单 ${row.orderNo}`)
  }
}

function handleReceive(row: SalesOrder) {
  if (row.status === '待收款') {
    // 设置本地存储，以便销售收款页面获取
    localStorage.setItem('pending_receipt_order', JSON.stringify(row))

    // 跳转到销售收款页面
    router.push({
      path: '/sales/receipt',
      query: {
        openVerifyDialog: 'true',
        orderNo: row.orderNo
      }
    })
  }
}

function handleDelete(row: SalesOrder) {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限删除销售订单')
    return
  }
  ElMessageBox.confirm(`确定删除订单 ${row.orderNo} 吗？`, '提示', { type: 'warning' }).then(() => {
    allSalesOrders.value = allSalesOrders.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
    fetchOrders()
  })
}

function openSplitDialog(order: SalesOrder) {
  splitOrder.value = order
  splitVisible.value = true
}

function openMergeDialog(order: SalesOrder) {
  // 可合并订单：同客户、草稿状态
  mergeOrders.value = orderList.value.filter(o => o.customerName === order.customerName && o.status === '草稿')
  mergeVisible.value = true
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.order-container {
  padding: 20px;
}
.search-form {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.table-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 15px;
}
.pagination {
  margin-top: 15px;
  text-align: right;
}
.custom-status-tag {
  font-weight: 500;
  border-width: 1.5px;
}
</style>
