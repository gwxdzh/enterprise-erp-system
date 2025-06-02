<template>
  <div class="delivery-container">
    <!-- 筛选区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="销售订单号">
        <el-input v-model="searchOrderNo" placeholder="销售订单号" clearable @keyup.enter="fetchDeliveries" />
      </el-form-item>
      <el-form-item label="客户">
        <el-input v-model="searchCustomer" placeholder="客户名称" clearable @keyup.enter="fetchDeliveries" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchDeliveries">搜索</el-button>
        <el-button @click="handleReset" style="margin-left: 4px">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <div class="table-toolbar">
      <el-button type="success" :disabled="multipleSelection.length === 0 || !hasSalesEditPermission()" @click="handleBatchDeliver"> 批量发货 </el-button>
      <el-button type="primary" :disabled="multipleSelection.length === 0 || !hasSalesEditPermission()" @click="openBatchPrintDialog">批量打印</el-button>
      <el-button type="primary" :disabled="!hasSalesEditPermission()" @click="openAddDialog">新建出库单</el-button>
    </div>

    <!-- 待发货订单表格 -->
    <el-table :data="deliveryList" border stripe style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="deliveryNo" label="出库单号" min-width="120" />
      <el-table-column prop="orderNo" label="销售订单号" min-width="120" />
      <el-table-column prop="customerName" label="客户" min-width="150" />
      <el-table-column prop="deliveryDate" label="出库日期" min-width="120" />
      <el-table-column prop="operator" label="操作人" min-width="100" />
      <el-table-column label="状态" min-width="100">
        <template #default>
          <el-tag type="warning">待发货</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openViewDialog(scope.row)">查看</el-button>
          <el-button v-if="printedOrderNos.includes(scope.row.orderNo)" size="small" type="success" :disabled="!hasSalesEditPermission()" @click="handleDeliver(scope.row)">发货</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="fetchDeliveries" />
    </div>

    <!-- 新建/编辑出库单弹窗 -->
    <DeliveryForm v-model:visible="dialogVisible" :order="editOrder" @refresh="onFormRefresh" />
    <!-- 出库单详情弹窗 -->
    <DeliveryDetail v-model:visible="detailVisible" :delivery="currentOrder" @print-success="onPrintSuccess" />
    <BatchPrintDialog v-model:visible="batchPrintVisible" :list="multipleSelection" @batch-print-success="onBatchPrintSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { allSalesDeliveries } from '../../../stores/salesDeliveryData'
import { allSalesOrders } from '../../../stores/salesOrderData'
import { useUserStore } from '../../../stores/user'
import { ElMessage } from 'element-plus'

// 使用异步组件导入解决导入错误
const DeliveryForm = defineAsyncComponent(() => import('./DeliveryForm.vue'))
const DeliveryDetail = defineAsyncComponent(() => import('./DeliveryDetail.vue'))
const BatchPrintDialog = defineAsyncComponent(() => import('./BatchPrintDialog.vue'))

const deliveryList = ref<any[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

const searchOrderNo = ref('')
const searchCustomer = ref('')

const dialogVisible = ref(false)
const detailVisible = ref(false)
const currentOrder = ref<any>(null)
const printedOrderNos = ref<string[]>([])
const editOrder = ref<any>(null)
const multipleSelection = ref<any[]>([])
const batchPrintVisible = ref(false)

// 获取路由参数
const route = useRoute()

// 获取用户store
const userStore = useUserStore()

// 检查是否有销售编辑权限
const hasSalesEditPermission = () => {
  return userStore.hasPermission('sales:edit')
}

function orderStatusTagType(status: string) {
  switch (status) {
    case '草稿':
      return 'info'
    case '待审核':
      return 'primary'
    case '待发货':
      return 'warning'
    case '部分发货':
      return 'warning'
    case '待收款':
      return 'success'
    case '已完成':
      return 'success'
    case '已关闭':
      return 'danger'
    default:
      return 'info'
  }
}

function fetchDeliveries() {
  let list = allSalesDeliveries.value
  total.value = list.length
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  deliveryList.value = list.slice(startIndex, endIndex)
}

function handleReset() {
  searchOrderNo.value = ''
  searchCustomer.value = ''
  currentPage.value = 1
  fetchDeliveries()
}

function openAddDialog() {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限创建出库单')
    return
  }
  dialogVisible.value = true
}

function openViewDialog(row: any) {
  currentOrder.value = row
  detailVisible.value = true
}

function handlePrint(row: any) {
  currentOrder.value = row
  detailVisible.value = true
}

function onPrintSuccess(orderNo: string) {
  if (!printedOrderNos.value.includes(orderNo)) {
    printedOrderNos.value.push(orderNo)
  }
}

function handleDeliver(row: any) {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限执行发货操作')
    return
  }

  // 删除出库单记录
  const idx = allSalesDeliveries.value.findIndex(d => d.deliveryNo === row.deliveryNo)
  if (idx !== -1) {
    allSalesDeliveries.value.splice(idx, 1)
  }
  // 同步修改销售订单状态
  const orderIdx = allSalesOrders.value.findIndex((o: any) => o.orderNo === row.orderNo)
  if (orderIdx !== -1) {
    allSalesOrders.value[orderIdx].status = '待收款'
  }
  fetchDeliveries()
}

function onFormRefresh() {
  fetchDeliveries()
}

function handleSelectionChange(val: any[]) {
  multipleSelection.value = val
}

function openBatchPrintDialog() {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限执行批量打印操作')
    return
  }

  batchPrintVisible.value = true
}

function onBatchPrintSuccess(orderNos: string[]) {
  orderNos.forEach(no => {
    if (!printedOrderNos.value.includes(no)) {
      printedOrderNos.value.push(no)
    }
  })
}

function handleBatchDeliver() {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限执行批量发货操作')
    return
  }

  if (multipleSelection.value.length === 0) return
  // 只保留已打印的
  const canDeliver = multipleSelection.value.filter(row => printedOrderNos.value.includes(row.orderNo))
  const cannotDeliver = multipleSelection.value.filter(row => !printedOrderNos.value.includes(row.orderNo))
  if (cannotDeliver.length > 0) {
    multipleSelection.value = canDeliver
    ElMessage.warning('未打印的出库单已取消选中，请先打印后再发货')
    if (canDeliver.length === 0) return
  }
  canDeliver.forEach(row => {
    const idx = allSalesDeliveries.value.findIndex(d => d.deliveryNo === row.deliveryNo)
    if (idx !== -1) {
      allSalesDeliveries.value.splice(idx, 1)
    }
    const orderIdx = allSalesOrders.value.findIndex(o => o.orderNo === row.orderNo)
    if (orderIdx !== -1) {
      allSalesOrders.value[orderIdx].status = '待收款'
    }
  })
  fetchDeliveries()
}

// 监听路由参数变化
watch(
  () => route.query,
  query => {
    if (query.orderNo && query.showDetail === '1') {
      // 根据订单号查找相应的出库单
      const orderNo = query.orderNo as string
      const deliveryRecord = allSalesDeliveries.value.find(d => d.orderNo === orderNo)

      if (deliveryRecord) {
        // 打开详情弹窗
        currentOrder.value = deliveryRecord
        detailVisible.value = true
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  fetchDeliveries()
})

// 确保组件有默认导出
DeliveryForm.__name = 'DeliveryForm'
DeliveryDetail.__name = 'DeliveryDetail'
BatchPrintDialog.__name = 'BatchPrintDialog'
</script>

<style scoped>
.delivery-container {
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
</style>
