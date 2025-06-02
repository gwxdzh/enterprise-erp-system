<template>
  <div class="receipt-container">
    <!-- 筛选区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="客户">
        <el-input v-model="searchCustomer" placeholder="客户名称" clearable @keyup.enter="fetchReceipts" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchStatus" placeholder="订单状态" clearable @change="fetchReceipts" style="width: 120px">
          <el-option label="待收款" value="待收款" />
          <el-option label="已完成" value="已完成" />
        </el-select>
      </el-form-item>
      <el-form-item label="下单日期">
        <el-date-picker v-model="searchDate" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" @change="fetchReceipts" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchReceipts">搜索</el-button>
        <el-button @click="handleReset" style="margin-left: 4px">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格右上方操作栏 -->
    <div class="table-toolbar">
      <el-button type="success" @click="exportReport">导出报表</el-button>
      <el-button type="primary" v-if="!showChart" @click="showChart = true">展示图表</el-button>
      <el-button type="primary" v-else @click="showChart = false">返回表格</el-button>
    </div>

    <!-- 表格区域 -->
    <div v-show="!showChart">
      <el-table :data="receiptList" border stripe style="width: 100%" @selection-change="handleSelectionChange" row-key="orderNo">
        <el-table-column prop="orderNo" label="订单编号" min-width="120">
          <template #default="scope">
            <span :data-order-no="scope.row.orderNo">{{ scope.row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" min-width="150" />
        <el-table-column prop="orderDate" label="下单日期" min-width="120" />
        <el-table-column prop="totalAmount" label="总金额" min-width="100">
          <template #default="scope">
            <span>￥{{ scope.row.totalAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已收金额" min-width="100">
          <template #default="scope">
            <span>￥{{ getPaidAmount(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="未收金额" min-width="100">
          <template #default="scope">
            <span>￥{{ getUnpaidAmount(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '待收款' ? 'warning' : 'success'">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账龄" min-width="100">
          <template #default="scope">
            <span>{{ getAging(scope.row) }} 天</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openViewDialog(scope.row)">查看</el-button>
            <el-button v-if="scope.row.status === '待收款'" size="small" type="success" :disabled="!hasSalesEditPermission()" @click="remind(scope.row)">收款提醒</el-button>
            <el-button v-if="scope.row.status === '待收款'" size="small" type="primary" :disabled="!hasSalesEditPermission()" @click="openVerifyDialog(scope.row)">收款核销</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="fetchReceipts" />
      </div>
    </div>

    <!-- 图表区域 -->
    <div v-show="showChart" class="chart-area">
      <div class="chart-cards">
        <div class="chart-card">
          <div ref="lineChartRef" class="chart-box"></div>
        </div>
        <div class="chart-card">
          <div ref="pieChartRef" class="chart-box"></div>
        </div>
        <div class="chart-card">
          <div ref="barChartRef" class="chart-box"></div>
        </div>
      </div>
    </div>

    <!-- 收款核销弹窗 -->
    <el-dialog title="收款核销" v-model="verifyDialogVisible" width="400px">
      <el-form :model="verifyForm" label-width="80px">
        <el-form-item label="订单编号">
          <el-input v-model="verifyForm.orderNo" disabled />
        </el-form-item>
        <el-form-item label="客户">
          <el-input v-model="verifyForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="收款金额">
          <el-input-number v-model="verifyForm.amount" :min="0" :max="verifyForm.unpaid" style="width: 200px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmVerify">确认核销</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情弹窗 -->
    <el-dialog title="应收账款详情" v-model="viewDialogVisible" width="600px">
      <el-descriptions :column="2" border v-if="viewOrder">
        <el-descriptions-item label="订单编号">{{ viewOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ viewOrder.customerName }}</el-descriptions-item>
        <el-descriptions-item label="下单日期">{{ viewOrder.orderDate }}</el-descriptions-item>
        <el-descriptions-item label="总金额">￥{{ viewOrder.totalAmount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewOrder.status }}</el-descriptions-item>
        <el-descriptions-item label="备注" v-if="viewOrder.remark">{{ viewOrder.remark }}</el-descriptions-item>
        <el-descriptions-item label="账龄">{{ getAging(viewOrder) }} 天</el-descriptions-item>
      </el-descriptions>
      <el-table :data="viewOrder?.items || []" border size="small" style="margin-top: 16px">
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="price" label="单价" />
        <el-table-column prop="amount" label="金额" />
      </el-table>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { allSalesOrders, type SalesOrder } from '../../../stores/salesOrderData'
import { useUserStore } from '../../../stores/user'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { useRoute } from 'vue-router'

const route = useRoute()

const userStore = useUserStore()

const receiptList = ref<SalesOrder[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

const searchCustomer = ref('')
const searchStatus = ref('')
const searchDate = ref<string[] | null>(null)

const multipleSelection = ref<SalesOrder[]>([])
const verifyDialogVisible = ref(false)
const verifyForm = ref({ orderNo: '', customerName: '', amount: 0, unpaid: 0 })
const viewDialogVisible = ref(false)
const viewOrder = ref<SalesOrder | null>(null)
const showChart = ref(false)
const lineChartRef = ref<HTMLDivElement | null>(null)
const pieChartRef = ref<HTMLDivElement | null>(null)
const barChartRef = ref<HTMLDivElement | null>(null)
let lineChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
const remindTimers = new Map<string, ReturnType<typeof setTimeout>>()

function fetchReceipts() {
  let list = allSalesOrders.value.filter(item => item.status === '待收款' || item.status === '已完成')
  if (searchCustomer.value) {
    list = list.filter(item => item.customerName.includes(searchCustomer.value.trim()))
  }
  if (searchStatus.value) {
    list = list.filter(item => item.status === searchStatus.value)
  }
  if (searchDate.value && searchDate.value.length === 2) {
    const [start, end] = searchDate.value
    const startDate = new Date(start)
    const endDate = new Date(end)
    list = list.filter(item => {
      const orderDate = new Date(item.orderDate)
      return orderDate >= startDate && orderDate <= endDate
    })
  }
  total.value = list.length
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  receiptList.value = list.slice(startIndex, endIndex)
}

function handleReset() {
  searchCustomer.value = ''
  searchStatus.value = ''
  searchDate.value = null
  currentPage.value = 1
  fetchReceipts()
}

function handleSelectionChange(val: SalesOrder[]) {
  multipleSelection.value = val
}

function getPaidAmount(order: SalesOrder) {
  // 假设已收金额为已完成订单全额，待收款订单为0，可根据实际业务调整
  return order.status === '已完成' ? order.totalAmount.toFixed(2) : '0.00'
}
function getUnpaidAmount(order: SalesOrder) {
  return order.status === '待收款' ? order.totalAmount.toFixed(2) : '0.00'
}
function getAging(order: SalesOrder) {
  // 账龄=今天-下单日期
  const today = new Date()
  const orderDate = new Date(order.orderDate)
  const diff = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
  return diff >= 0 ? diff : 0
}

function openVerifyDialog(order: SalesOrder) {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限执行收款核销操作')
    return
  }

  verifyForm.value = {
    orderNo: order.orderNo,
    customerName: order.customerName,
    amount: order.totalAmount,
    unpaid: order.status === '待收款' ? order.totalAmount : 0
  }
  verifyDialogVisible.value = true
}
function confirmVerify() {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限执行收款核销操作')
    return
  }

  // 实际业务应提交核销数据，这里仅做演示
  const order = allSalesOrders.value.find(o => o.orderNo === verifyForm.value.orderNo)
  if (order) {
    order.status = '已完成'
  }
  ElMessage.success('收款核销成功！')
  verifyDialogVisible.value = false
  fetchReceipts()
}
function remind(order: SalesOrder) {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限发送收款提醒')
    return
  }

  const key = order.orderNo
  if (remindTimers.has(key)) {
    ElMessage.warning('请勿频繁提醒！')
    return
  }
  ElMessage.info(`已向客户【${order.customerName}】发送收款提醒`)
  const timer = setTimeout(() => {
    remindTimers.delete(key)
  }, 2000)
  remindTimers.set(key, timer)
}

function openViewDialog(order: SalesOrder) {
  viewOrder.value = order
  viewDialogVisible.value = true
}

function getChartData() {
  // 按日期分组统计金额
  const all = allSalesOrders.value.filter(item => item.status === '待收款' || item.status === '已完成')
  const dateMap: Record<string, { paid: number; unpaid: number }> = {}
  let totalPaid = 0
  let totalUnpaid = 0
  all.forEach(item => {
    if (!dateMap[item.orderDate]) dateMap[item.orderDate] = { paid: 0, unpaid: 0 }
    if (item.status === '已完成') {
      dateMap[item.orderDate].paid += item.totalAmount
      totalPaid += item.totalAmount
    } else {
      dateMap[item.orderDate].unpaid += item.totalAmount
      totalUnpaid += item.totalAmount
    }
  })
  const dates = Object.keys(dateMap).sort()
  const paidArr = dates.map(d => dateMap[d].paid)
  const unpaidArr = dates.map(d => dateMap[d].unpaid)

  // 客户应收账款排行
  const customerMap: Record<string, number> = {}
  all.forEach(item => {
    if (!customerMap[item.customerName]) customerMap[item.customerName] = 0
    if (item.status === '待收款') {
      customerMap[item.customerName] += item.totalAmount
    }
  })
  const customerNames = Object.keys(customerMap)
  const customerAmounts = customerNames.map(n => customerMap[n])

  return { dates, paidArr, unpaidArr, totalPaid, totalUnpaid, customerNames, customerAmounts }
}

function renderCharts() {
  const { dates, paidArr, unpaidArr, totalPaid, totalUnpaid, customerNames, customerAmounts } = getChartData()
  // 折线图
  if (lineChartRef.value) {
    if (!lineChart) lineChart = echarts.init(lineChartRef.value)
    const option = {
      title: { text: '账单时间分布', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['已收金额', '待收款金额'], top: 30 },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [
        { name: '已收金额', type: 'line', data: paidArr, smooth: true, color: '#67C23A' },
        { name: '待收款金额', type: 'line', data: unpaidArr, smooth: true, color: '#E6A23C' }
      ]
    }
    lineChart.setOption(option)
  }
  // 饼图
  if (pieChartRef.value) {
    if (!pieChart) pieChart = echarts.init(pieChartRef.value)
    const option = {
      title: { text: '收款结构', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          name: '收款结构',
          type: 'pie',
          radius: '60%',
          data: [
            { value: totalPaid, name: '已收金额' },
            { value: totalUnpaid, name: '待收款金额' }
          ],
          label: { formatter: '{b}: {d}%' }
        }
      ]
    }
    pieChart.setOption(option)
  }
  // 柱状图
  if (barChartRef.value) {
    if (!barChart) barChart = echarts.init(barChartRef.value)
    const option = {
      title: { text: '客户应收账款排行', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: customerNames },
      yAxis: { type: 'value' },
      series: [{ name: '应收账款', type: 'bar', data: customerAmounts, itemStyle: { color: '#409EFF' } }]
    }
    barChart.setOption(option)
  }
}

function initCharts() {
  if (showChart.value) {
    setTimeout(() => {
      renderCharts()
    }, 100)
  }
}

// 监听showChart变量
watch(showChart, v => {
  if (v) {
    initCharts()
  }
})

function exportReport() {
  // 简单导出为CSV
  let csv = '订单编号,客户,下单日期,总金额,已收金额,未收金额,状态,账龄\n'
  allSalesOrders.value
    .filter(item => item.status === '待收款' || item.status === '已完成')
    .forEach(item => {
      csv += `${item.orderNo},${item.customerName},${item.orderDate},${item.totalAmount},${getPaidAmount(item)},${getUnpaidAmount(item)},${item.status},${getAging(item)}\n`
    })
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '应收账款报表.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function hasSalesEditPermission() {
  return userStore.hasPermission('sales:edit')
}

onMounted(() => {
  fetchReceipts()
  initCharts()

  if (route.query.openVerifyDialog === 'true' && route.query.orderNo) {
    const orderNo = route.query.orderNo as string
    const order = allSalesOrders.value.find(o => o.orderNo === orderNo)
    if (order) {
      openVerifyDialog(order)
      setTimeout(() => {
        const orderElement = document.querySelector(`[data-order-no="${orderNo}"]`)
        if (orderElement) {
          orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
    } else {
      ElMessage.warning('未找到对应的待收款订单')
    }
  }

  const pendingOrder = localStorage.getItem('pending_receipt_order')
  if (pendingOrder && !verifyDialogVisible.value) {
    try {
      const orderData = JSON.parse(pendingOrder) as SalesOrder
      if (orderData && orderData.status === '待收款') {
        if (route.query.openVerifyDialog !== 'true') {
          openVerifyDialog(orderData)
        }
      }
      localStorage.removeItem('pending_receipt_order')
    } catch (error) {
      console.error('解析订单数据失败', error)
    }
  }
})
</script>

<style scoped>
.receipt-container {
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
  gap: 8px;
}
.pagination {
  margin-top: 15px;
  text-align: right;
}
.chart-area {
  margin-top: 10px;
}
.chart-cards {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.chart-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 16px;
  flex: 1 1 320px;
  min-width: 320px;
  min-height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.chart-box {
  width: 100%;
  height: 300px;
}
</style>
