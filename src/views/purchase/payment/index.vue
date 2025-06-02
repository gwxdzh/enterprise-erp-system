<template>
  <div class="accounts-payable-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="关联订单号">
        <el-input v-model="searchOrderNo" placeholder="关联订单号" clearable @keyup.enter="fetchList" style="width: 180px" />
      </el-form-item>
      <el-form-item label="供应商">
        <el-input v-model="searchSupplier" placeholder="供应商名称" clearable @keyup.enter="fetchList" style="width: 180px" />
      </el-form-item>
      <el-form-item label="到期日">
        <el-date-picker v-model="searchDueDate" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" />
      </el-form-item>
      <el-form-item label="支付状态">
        <el-select v-model="searchStatus" placeholder="请选择状态" clearable style="width: 120px">
          <el-option label="待支付" value="待支付" />
          <el-option label="部分支付" value="部分支付" />
          <el-option label="已支付" value="已支付" />
          <el-option label="逾期" value="逾期" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchList">搜索</el-button>
        <el-button @click="handleReset" style="margin-left: 4px">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格操作栏 -->
    <div class="table-toolbar">
      <div></div>
      <div class="toolbar-right">
        <!-- <el-button type="primary" @click="openAddDialog">新增付款记录</el-button> -->
        <el-button @click="isChartView = !isChartView">{{ isChartView ? '查看表格' : '查看图表' }}</el-button>
        <el-button type="success" @click="handleGenerateReport">生成报表</el-button>
      </div>
    </div>

    <!-- 应付账款表格 -->
    <el-table v-if="!isChartView" :data="accountsPayableList" border stripe style="width: 100%">
      <el-table-column prop="orderNo" label="关联订单号" min-width="140" />
      <el-table-column prop="supplier" label="供应商" min-width="140" />
      <el-table-column prop="amount" label="订单金额" min-width="100">
        <template #default="scope">
          {{ formatAmount(scope.row.amount) }}
        </template>
      </el-table-column>
      <el-table-column prop="paidAmount" label="已付金额" min-width="100">
        <template #default="scope">
          {{ formatAmount(scope.row.paidAmount) }}
        </template>
      </el-table-column>
      <el-table-column prop="unpaidAmount" label="未付金额" min-width="100">
        <template #default="scope">
          {{ formatAmount(scope.row.unpaidAmount) }}
        </template>
      </el-table-column>
      <el-table-column prop="dueDate" label="到期日" min-width="120">
        <template #default="scope">
          <span :style="dueDateStyle(scope.row.dueDate)">
            {{ scope.row.dueDate }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="支付状态" min-width="100">
        <template #default="scope">
          <el-tag :type="paymentStatusTagType(scope.row.paidAmount || 0, scope.row.amount)">{{ getPaymentStatus(scope.row.paidAmount || 0, scope.row.amount) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button size="small" type="primary" v-if="(scope.row.paidAmount || 0) < scope.row.amount" :disabled="!hasPurchaseEditPermission()" @click="handlePaymentApplication(scope.row)">付款申请</el-button>
          <el-button size="small" @click="handleViewDetails(scope.row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination" v-if="!isChartView">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="fetchList" />
    </div>

    <!-- 图表统计区域 -->
    <div class="chart-view" v-if="isChartView">
      <h3>应付账款统计图表</h3>
      <div ref="chartContainer" style="width: 100%; height: 400px"></div>
      <div style="margin-top: 20px">
        <p><strong>待支付总金额：</strong> {{ formatAmount(totalUnpaidAmount) }}</p>
        <p><strong>逾期总金额：</strong> {{ formatAmount(totalOverdueAmount) }}</p>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog title="应付账款详情" v-model="viewDialogVisible" width="700px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="关联订单号" label-width="120px">{{ viewData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商" label-width="120px">{{ viewData.supplier }}</el-descriptions-item>
        <el-descriptions-item label="订单金额" label-width="120px">{{ formatAmount(viewData.amount) }}</el-descriptions-item>
        <el-descriptions-item label="已付金额" label-width="120px">{{ formatAmount(viewData.paidAmount) }}</el-descriptions-item>
        <el-descriptions-item label="未付金额" label-width="120px">{{ formatAmount(viewData.unpaidAmount) }}</el-descriptions-item>
        <el-descriptions-item label="到期日" label-width="120px">{{ viewData.dueDate }}</el-descriptions-item>
        <el-descriptions-item label="支付状态" label-width="120px">
          <el-tag :type="paymentStatusTagType(viewData.paidAmount || 0, viewData.amount)">{{ getPaymentStatus(viewData.paidAmount || 0, viewData.amount) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最近支付日期" label-width="120px">{{ viewData.paymentDate || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 支付弹窗 -->
    <el-dialog title="支付订单" v-model="paymentDialogVisible" width="700px">
      <el-form :model="paymentForm" :rules="paymentRules" ref="paymentFormRef" label-width="100px">
        <el-form-item label="订单号">
          <span>{{ currentOrderToPay?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="应付金额">
          <span>{{ formatAmount(currentOrderToPay?.unpaidAmount) }}</span>
        </el-form-item>
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="paymentForm.paymentMethod" placeholder="请选择支付方式">
            <el-option v-for="method in paymentMethods" :key="method" :label="method" :value="method" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付渠道" prop="paymentChannel">
          <el-select v-model="paymentForm.paymentChannel" placeholder="请选择支付渠道">
            <el-option v-for="channel in paymentChannels" :key="channel" :label="channel" :value="channel" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmPayment">确认支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { allOrders, type Order } from '../../../stores/orderData'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../../stores/user'
import * as echarts from 'echarts' // 导入 Echarts
import type { EChartsType } from 'echarts'

// 获取用户store
const userStore = useUserStore()

// 检查是否有采购编辑权限
const hasPurchaseEditPermission = () => {
  return userStore.hasPermission('purchase:edit')
}

// 视图切换状态
const isChartView = ref(false)

// Echarts 容器和实例
const chartContainer = ref<HTMLElement | null>(null)
const chartInstance = ref<EChartsType | null>(null)

// 搜索表单
const searchOrderNo = ref('')
const searchSupplier = ref('')
const searchDueDate = ref<[Date, Date] | null>(null)
const searchStatus = ref<string | ''>('') // 初始化为 ''

// 列表数据和分页
const accountsPayableList = ref<Order[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// 详情弹窗
const viewDialogVisible = ref(false)
const viewData = reactive<Order>({} as Order)

// 支付弹窗
const paymentDialogVisible = ref(false)
const currentOrderToPay = ref<Order | null>(null)
const paymentForm = reactive({
  paymentMethod: '',
  paymentChannel: ''
})

const paymentFormRef = ref() // 声明 paymentFormRef

const paymentRules = {
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  paymentChannel: [{ required: true, message: '请选择支付渠道', trigger: 'change' }]
}

const paymentMethods = ref(['银行转账', '支付宝', '微信支付', '现金'])
const paymentChannels = ref(['线上支付', '线下支付'])

const route = useRoute()
const router = useRouter() // 声明 router

// 获取列表数据
function fetchList() {
  // 从采购订单中筛选出待支付或已入库的订单
  let list: Order[] = JSON.parse(JSON.stringify(allOrders.value.filter(order => order.status === '待支付' || order.status === '已入库')))

  // 应用搜索过滤逻辑
  if (searchOrderNo.value) {
    list = list.filter(item => item.orderNo.includes(searchOrderNo.value.trim()))
  }
  if (searchSupplier.value) {
    list = list.filter(item => item.supplier.includes(searchSupplier.value.trim()))
  }
  if (searchDueDate.value && searchDueDate.value.length === 2) {
    const [start, end] = searchDueDate.value
    list = list.filter(item => {
      // 只有当 item.dueDate 不是空字符串或 undefined 时才进行日期比较
      if (!item.dueDate) return false

      const itemDate = new Date(item.dueDate)
      itemDate.setHours(0, 0, 0, 0)
      const startDate = new Date(start)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(end)
      endDate.setHours(23, 59, 59, 999)
      return itemDate >= startDate && itemDate <= endDate
    })
  }
  if (searchStatus.value) {
    // 根据 paidAmount 和 amount 计算支付状态进行过滤
    list = list.filter(item => getPaymentStatus(item.paidAmount || 0, item.amount) === searchStatus.value)
  }

  total.value = list.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  accountsPayableList.value = list.slice(start, end)

  // 检查路由参数，如果存在订单号，并且该订单在当前列表且状态为待支付，则自动打开支付弹窗
  const orderNoFromRoute = route.query.orderNo as string | undefined
  if (orderNoFromRoute) {
    const targetOrder = accountsPayableList.value.find(order => order.orderNo === orderNoFromRoute && order.status === '待支付') // 只对待支付状态的订单自动弹出
    if (targetOrder) {
      handlePaymentApplication(targetOrder)
    } else if (accountsPayableList.value.find(order => order.orderNo === orderNoFromRoute)) {
      // 如果订单存在但不是待支付状态，可以给用户一个提示
      ElMessage.info(`订单 ${orderNoFromRoute} 当前状态为 ${accountsPayableList.value.find(order => order.orderNo === orderNoFromRoute)?.status || ''}，无需在此页面支付。`)
    }
    // 清除路由参数，避免刷新后重复弹出
    router.replace({ query: {} })
  }
}

// 初始化并绘制 Echarts 图表
function initChart() {
  if (chartContainer.value) {
    // 销毁已有的图表实例，如果存在的话
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }

    chartInstance.value = echarts.init(chartContainer.value)
    const option = {
      title: {
        text: '应付账款统计',
        left: 'center'
      },
      tooltip: {},
      xAxis: {
        type: 'category',
        data: ['待支付总金额', '逾期总金额']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      series: [
        {
          name: '金额',
          type: 'bar',
          data: [totalUnpaidAmount.value, totalOverdueAmount.value]
        }
      ]
    }
    chartInstance.value.setOption(option)
  }
}

// 销毁 Echarts 图表实例
function disposeChart() {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
}

// 计算待支付总金额
const totalUnpaidAmount = computed(() => {
  return accountsPayableList.value.filter(order => getPaymentStatus(order.paidAmount || 0, order.amount) === '待支付' || getPaymentStatus(order.paidAmount || 0, order.amount) === '部分支付').reduce((sum, order) => sum + (order.unpaidAmount || 0), 0)
})

// 计算逾期总金额
const totalOverdueAmount = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return accountsPayableList.value
    .filter(order => {
      if (!order.dueDate || (order.paidAmount || 0) >= order.amount) return false // 过滤掉没有到期日或已付清的订单
      const due = new Date(order.dueDate)
      due.setHours(0, 0, 0, 0)
      const timeDiff = due.getTime() - today.getTime()
      const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
      return daysUntilDue < 0 // 筛选出逾期订单
    })
    .reduce((sum, order) => sum + (order.unpaidAmount || 0), 0)
})

// 重置搜索
function handleReset() {
  searchOrderNo.value = ''
  searchSupplier.value = ''
  searchDueDate.value = null
  searchStatus.value = ''
  currentPage.value = 1
  fetchList()
}

// 根据已付金额和总金额获取支付状态字符串
function getPaymentStatus(paid: number, total: number): string {
  if (paid >= total) {
    return '已支付'
  } else if (paid > 0 && paid < total) {
    return '部分支付'
  } else if (paid === 0 && total > 0) {
    // 需要判断是否逾期来区分 待支付 和 逾期
    // 假设到期日逻辑在 dueDateStyle 中处理，这里只区分支付状态
    return '待支付'
  } else {
    return '' // 默认或异常情况
  }
}

// 根据支付状态返回标签类型
function paymentStatusTagType(paid: number, total: number) {
  const status = getPaymentStatus(paid, total)
  switch (status) {
    case '待支付':
      return 'info'
    case '部分支付':
      return 'warning'
    case '已支付':
      return 'success'
    // 应付账款状态中没有直接的 '逾期'，逾期是根据到期日判断的
    // 如果需要根据逾期显示标签，需要额外的逻辑或字段
    default:
      return 'info'
  }
}

// 根据到期日返回样式
function dueDateStyle(dueDate: string | undefined) {
  if (!dueDate) return {} // 如果没有到期日，不应用样式
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const timeDiff = due.getTime() - today.getTime()
  const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

  if (daysUntilDue < 0) {
    return { color: 'red', fontWeight: 'bold' } // 逾期
  } else if (daysUntilDue <= 7) {
    return { color: 'orange', fontWeight: 'bold' } // 即将到期 (7天内)
  } else {
    return {} // 正常
  }
}

// 格式化金额
function formatAmount(amount: number | undefined) {
  return amount !== undefined ? `¥${amount.toFixed(2)}` : '¥0.00'
}

// 处理付款申请
function handlePaymentApplication(row: Order) {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限申请付款')
    return
  }
  
  currentOrderToPay.value = row
  // 重置支付表单
  Object.assign(paymentForm, { paymentMethod: '', paymentChannel: '' })
  paymentDialogVisible.value = true
}

// 处理确认支付
function handleConfirmPayment() {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限确认付款')
    return
  }

  ;(paymentFormRef.value as any).validate((valid: boolean) => {
    if (!valid) return

    if (currentOrderToPay.value) {
      const orderToUpdate = allOrders.value.find(order => order.id === currentOrderToPay.value?.id)
      if (orderToUpdate) {
        // 更新已付金额、支付日期、支付方式和渠道
        orderToUpdate.paidAmount = (orderToUpdate.paidAmount || 0) + (currentOrderToPay.value.unpaidAmount || 0) // 假设全额支付剩余未付金额
        orderToUpdate.unpaidAmount = 0 // 未付金额清零
        orderToUpdate.paymentDate = new Date().toISOString().slice(0, 10)
        orderToUpdate.paymentMethod = paymentForm.paymentMethod
        orderToUpdate.paymentChannel = paymentForm.paymentChannel

        // 更新订单状态为已入库 (根据新的状态流)
        orderToUpdate.status = '已入库'

        ElMessage.success(`订单 ${orderToUpdate.orderNo} 支付成功，状态更新为已入库`) // 更新提示信息
        fetchList() // 刷新列表
        paymentDialogVisible.value = false
      }
    }
  })
}

// 处理查看详情
function handleViewDetails(row: Order) {
  Object.assign(viewData, row)
  viewDialogVisible.value = true
}

// 处理生成报表
function handleGenerateReport() {
  const headers = ['关联订单号', '供应商', '订单金额', '已付金额', '未付金额', '到期日', '支付状态']
  const filename = '应付账款报表.csv'
  // 使用 accountsPayableList.value 来获取当前显示的数据
  exportToCsv(accountsPayableList.value, headers, filename)
}

// 辅助函数：将数据导出为 CSV
function exportToCsv(data: any[], headers: string[], filename: string = 'report.csv') {
  if (!data || data.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }

  const csvRows = []
  csvRows.push(headers.join(',')) // 添加表头

  for (const row of data) {
    const values = [
      `"${row.orderNo || ''}"`, // 使用引号包围可能包含逗号或特殊字符的字段
      `"${row.supplier || ''}"`,
      `"${formatAmount(row.amount)}"`, // 格式化金额
      `"${formatAmount(row.paidAmount)}"`, // 格式化金额
      `"${formatAmount(row.unpaidAmount)}"`, // 格式化金额
      `"${row.dueDate || '-'}"`, // 格式化日期或显示-
      `"${getPaymentStatus(row.paidAmount || 0, row.amount)}"` // 计算支付状态
    ]
    csvRows.push(values.join(','))
  }

  const csvString = csvRows.join('\n')
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' }) // 添加 BOM 防止中文乱码，使用正确的转义序列
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  ElMessage.success('报表生成成功！')
}

onMounted(() => {
  fetchList()
})

onUnmounted(() => {
  disposeChart()
})

// 监听视图切换，初始化或销毁图表
watch(isChartView, newValue => {
  if (newValue) {
    // 确保 DOM 元素已渲染
    nextTick(() => {
      initChart()
    })
  } else {
    disposeChart()
  }
})

// 监听待支付和逾期总金额变化，更新图表
watch([totalUnpaidAmount, totalOverdueAmount], () => {
  if (isChartView.value && chartInstance.value) {
    chartInstance.value.setOption({
      series: [
        {
          data: [totalUnpaidAmount.value, totalOverdueAmount.value]
        }
      ]
    })
  }
})
</script>

<style scoped>
.accounts-payable-container {
  padding: 20px;
  /* background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); */
}

.search-form {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.search-form .el-form-item {
  margin-bottom: 10px;
  margin-right: 10px; /* 调整表单项之间的右边距 */
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.pagination {
  margin-top: 15px;
  text-align: right;
}

/* 调整弹窗内表单项的样式 */
.el-dialog__body .el-form-item {
  margin-bottom: 18px;
}

.el-dialog__body .el-form-item__content > .el-select,
.el-dialog__body .el-form-item__content > .el-input,
.el-dialog__body .el-form-item__content > .el-textarea {
  width: 100%; /* 让表单元素填充宽度 */
}

/* 调整必填星号对齐 */
.el-form-item.is-required:not(.is-no-asterisk).el-form-item--default .el-form-item__label::before {
  content: '' !important; /* 移除默认的星号 */
  color: var(--el-color-danger) !important;
  margin-right: 4px !important;
}

.el-form-item.is-required:not(.is-no-asterisk).el-form-item--default .el-form-item__label::after {
  content: '*' !important; /* 添加星号 */
  margin-left: 4px; /* 调整位置 */
  color: var(--el-color-danger) !important;
}

.el-form-item--default .el-form-item__label {
  line-height: normal;
  display: flex;
  align-items: center;
}

.chart-view {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}
</style>
