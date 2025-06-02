<template>
  <div class="finance-report-container">
    <el-card>
      <!-- 时间筛选和刷新区域 -->
      <div class="filter-area">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="filterByDate" />
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon> 刷新数据
        </el-button>
        <el-switch v-model="autoRefresh" active-text="自动刷新" inactive-text="" @change="toggleAutoRefresh" />
      </div>

      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <!-- 利润表 -->
        <el-tab-pane label="利润表" name="profit">
          <div class="report-toolbar">
            <el-button type="primary" @click="exportReport('profit')" :disabled="!hasFinanceEditPermission()">导出</el-button>
            <el-button type="success" @click="printReport('profit')" :disabled="!hasFinanceEditPermission()">打印</el-button>
          </div>
          <el-table :data="profitTableData" border style="margin-top: 16px">
            <el-table-column prop="item" label="项目" min-width="180" />
            <el-table-column prop="amount" label="金额" min-width="120" />
          </el-table>
        </el-tab-pane>

        <!-- 资产负债表 -->
        <el-tab-pane label="资产负债表" name="balance">
          <div class="report-toolbar">
            <el-button type="primary" @click="exportReport('balance')" :disabled="!hasFinanceEditPermission()">导出</el-button>
            <el-button type="success" @click="printReport('balance')" :disabled="!hasFinanceEditPermission()">打印</el-button>
          </div>
          <el-table :data="balanceTableData" border style="margin-top: 16px">
            <el-table-column prop="item" label="项目" min-width="180" />
            <el-table-column prop="amount" label="金额" min-width="120" />
          </el-table>
        </el-tab-pane>

        <!-- 现金流量表 -->
        <el-tab-pane label="现金流量表" name="cash">
          <div class="report-toolbar">
            <el-button type="primary" @click="exportReport('cash')" :disabled="!hasFinanceEditPermission()">导出</el-button>
            <el-button type="success" @click="printReport('cash')" :disabled="!hasFinanceEditPermission()">打印</el-button>
          </div>
          <el-table :data="cashTableData" border style="margin-top: 16px">
            <el-table-column prop="item" label="项目" min-width="180" />
            <el-table-column prop="amount" label="金额" min-width="120" />
          </el-table>
        </el-tab-pane>

        <!-- 销售/采购趋势 -->
        <el-tab-pane label="业务趋势" name="trend">
          <div class="trend-toolbar">
            <div class="trend-tools-left">
              <el-radio-group v-model="trendType" size="small" @change="renderTrendChart">
                <el-radio-button label="sales">销售趋势</el-radio-button>
                <el-radio-button label="purchase">采购趋势</el-radio-button>
                <el-radio-button label="compare">对比分析</el-radio-button>
              </el-radio-group>
            </div>
            <div class="trend-tools-right">
              <el-button type="primary" @click="exportReport('trend')" :disabled="!hasFinanceEditPermission()">导出</el-button>
              <el-button type="success" @click="printReport('trend')" :disabled="!hasFinanceEditPermission()">打印</el-button>
            </div>
          </div>
          <div ref="trendChartRef" class="trend-chart-box"></div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    <div class="chart-area" v-if="activeTab !== 'trend'">
      <div class="chart-row">
        <div ref="chartRef" class="chart-box"></div>
        <div ref="pieChartRef" class="chart-box"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { Refresh } from '@element-plus/icons-vue'
import { allSalesOrders, type SalesOrder } from '../../../stores/salesOrderData'
import { allOrders, type Order } from '../../../stores/orderData'
import { allInventory, type InventoryItem } from '../../../stores/inventoryData'
import { allExpenses, type Expense } from '../../../stores/expenseData'
import { useUserStore } from '../../../stores/user'
import { ElMessage } from 'element-plus'

const activeTab = ref('profit')
const loading = ref(false)
const autoRefresh = ref(false)
const dateRange = ref<[string, string] | null>(null)
const trendType = ref('sales')
let refreshInterval: number | null = null

// 保存每个标签页的图表实例状态
const chartInstances = ref<{
  profit: boolean
  balance: boolean
  cash: boolean
  trend: boolean
}>({
  profit: false,
  balance: false,
  cash: false,
  trend: false
})

// 获取用户store
const userStore = useUserStore()

// 检查是否有财务编辑权限
const hasFinanceEditPermission = () => {
  return userStore.hasPermission('finance:edit')
}

// 筛选数据
const filteredSalesOrders = computed(() => {
  if (!dateRange.value) return allSalesOrders.value
  const [start, end] = dateRange.value
  return allSalesOrders.value.filter(order => {
    const orderDate = order.orderDate
    return orderDate >= start && orderDate <= end
  })
})

const filteredPurchaseOrders = computed(() => {
  if (!dateRange.value) return allOrders.value
  const [start, end] = dateRange.value
  return allOrders.value.filter(order => {
    const orderDate = order.orderDate
    return orderDate >= start && orderDate <= end
  })
})

const filteredExpenses = computed(() => {
  if (!dateRange.value) return allExpenses.value
  const [start, end] = dateRange.value
  return allExpenses.value.filter(expense => {
    const expenseDate = expense.date
    return expenseDate >= start && expenseDate <= end
  })
})

// 利润表数据动态计算
const profitTableData = computed(() => {
  // 营业收入：所有已完成/待收款销售订单收入
  const salesIncome = filteredSalesOrders.value.filter((o: SalesOrder) => ['已完成', '待收款'].includes(o.status)).reduce((sum: number, o: SalesOrder) => sum + (o.totalAmount || 0), 0)

  // 营业成本：假设为所有销售订单商品数量*商品单价的50%
  const salesCost = allInventory.value.reduce((sum: number, i: InventoryItem) => sum + (i.cost || 0), 0)

  // 期间费用
  const expenseTotal = filteredExpenses.value.reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0)

  // 所得税费用（假设为利润的10%）
  const profit = salesIncome - salesCost - expenseTotal
  const tax = profit > 0 ? profit * 0.1 : 0

  // 净利润
  const netProfit = profit - tax

  return [
    { item: '营业收入', amount: formatAmount(salesIncome) },
    { item: '营业成本', amount: formatAmount(salesCost) },
    { item: '期间费用', amount: formatAmount(expenseTotal) },
    { item: '所得税费用', amount: formatAmount(tax) },
    { item: '净利润', amount: formatAmount(netProfit) }
  ]
})

// 资产负债表数据动态计算
const balanceTableData = computed(() => {
  // 货币资金：假设为所有已收销售款-已付采购款-已报销费用
  const received = filteredSalesOrders.value.filter((o: SalesOrder) => o.status === '已完成').reduce((sum: number, o: SalesOrder) => sum + (o.totalAmount || 0), 0)
  const paid = filteredPurchaseOrders.value.filter((o: Order) => o.paidAmount).reduce((sum: number, o: Order) => sum + (o.paidAmount || 0), 0)
  const expensePaid = filteredExpenses.value.filter((e: Expense) => e.status === '已报销').reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0)
  const cash = received - paid - expensePaid

  // 应收账款：所有待收款销售订单金额
  const ar = filteredSalesOrders.value.filter((o: SalesOrder) => o.status === '待收款').reduce((sum: number, o: SalesOrder) => sum + (o.totalAmount || 0), 0)

  // 应付账款：所有待支付采购订单金额
  const ap = filteredPurchaseOrders.value.filter((o: Order) => o.status === '待支付').reduce((sum: number, o: Order) => sum + (o.unpaidAmount || o.amount || 0), 0)

  // 存货：所有库存商品的cost总和
  const inventory = allInventory.value.reduce((sum: number, i: InventoryItem) => sum + (i.cost || 0), 0)

  // 所有者权益=资产-负债
  const asset = cash + ar + inventory
  const liability = ap
  const equity = asset - liability

  return [
    { item: '货币资金', amount: formatAmount(cash) },
    { item: '应收账款', amount: formatAmount(ar) },
    { item: '存货', amount: formatAmount(inventory) },
    { item: '资产总计', amount: formatAmount(asset) },
    { item: '应付账款', amount: formatAmount(ap) },
    { item: '负债总计', amount: formatAmount(liability) },
    { item: '所有者权益', amount: formatAmount(equity) }
  ]
})

// 现金流量表数据动态计算
const cashTableData = computed(() => {
  // 经营活动现金流：已收销售款-已付采购款-已报销费用
  const received = filteredSalesOrders.value.filter((o: SalesOrder) => o.status === '已完成').reduce((sum: number, o: SalesOrder) => sum + (o.totalAmount || 0), 0)
  const paid = filteredPurchaseOrders.value.filter((o: Order) => o.paidAmount).reduce((sum: number, o: Order) => sum + (o.paidAmount || 0), 0)
  const expensePaid = filteredExpenses.value.filter((e: Expense) => e.status === '已报销').reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0)
  const opCash = received - paid - expensePaid

  // 投资、筹资活动现金流暂为0
  const investCash = 0
  const financeCash = 0

  // 现金及现金等价物净增加额
  const netCash = opCash + investCash + financeCash

  return [
    { item: '经营活动现金流', amount: formatAmount(opCash) },
    { item: '投资活动现金流', amount: formatAmount(investCash) },
    { item: '筹资活动现金流', amount: formatAmount(financeCash) },
    { item: '现金及现金等价物净增加额', amount: formatAmount(netCash) }
  ]
})

function formatAmount(val: number) {
  if (typeof val !== 'number') return val
  return val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

// 处理日期筛选
function filterByDate() {
  refreshData()
}

// 刷新数据
function refreshData() {
  loading.value = true
  setTimeout(() => {
    renderCurrentTabCharts()
    loading.value = false
  }, 500)
}

// 切换自动刷新
function toggleAutoRefresh() {
  if (autoRefresh.value) {
    refreshInterval = window.setInterval(() => {
      refreshData()
    }, 30000) // 30秒自动刷新一次
  } else if (refreshInterval !== null) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

function exportReport(type: string) {
  if (!hasFinanceEditPermission()) {
    ElMessage.warning('暂无权限导出财务报表')
    return
  }

  // 导出当前Tab表格为CSV
  let csv = ''
  let data: { item: string; amount: string }[] = []
  let title = '智云科技有限公司—'

  if (type === 'profit') {
    title += '利润表'
    data = profitTableData.value
  } else if (type === 'balance') {
    title += '资产负债表'
    data = balanceTableData.value
  } else if (type === 'cash') {
    title += '现金流量表'
    data = cashTableData.value
  } else if (type === 'trend') {
    title += '业务趋势分析'
    // 导出趋势分析数据，可以根据trendType生成不同的数据
    const trendData = getTrendData()
    csv += `${title}\n日期,销售额,采购额\n`
    Object.keys(trendData).forEach(date => {
      csv += `${date},${trendData[date].sales},${trendData[date].purchase}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.csv`
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  csv += `${title}\n项目,金额\n`
  data.forEach(row => {
    csv += `${row.item},${row.amount}\n`
  })

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function printReport(type: string) {
  if (!hasFinanceEditPermission()) {
    ElMessage.warning('暂无权限打印财务报表')
    return
  }

  // 打印当前Tab表格
  let data: { item: string; amount: string }[] = []
  let title = '智云科技有限公司—'
  let chartImg = ''
  let pieChartImg = ''
  let trendChartImg = ''

  if (type === 'profit') {
    title += '利润表'
    data = profitTableData.value
    if (chart) chartImg = chart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })
    if (pieChart) pieChartImg = pieChart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })
  } else if (type === 'balance') {
    title += '资产负债表'
    data = balanceTableData.value
    if (chart) chartImg = chart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })
    if (pieChart) pieChartImg = pieChart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })
  } else if (type === 'cash') {
    title += '现金流量表'
    data = cashTableData.value
    if (chart) chartImg = chart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })
    if (pieChart) pieChartImg = pieChart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })
  } else if (type === 'trend') {
    title += '业务趋势分析'
    if (trendChart) trendChartImg = trendChart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })

    // 打印趋势图
    const tableHtml = `
      <div class="print-title">${title}</div>
      <div class="print-chart-area"><img src='${trendChartImg}' style='display:block;margin:24px auto 0 auto;max-width:700px;width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.04);background:#fff;'/></div>
      <img id="print-stamp" src="/zhang.png" class="print-stamp"/>
      <div class="print-footer">
        <span>公司名称：智云科技有限公司 地址：上海市浦东新区88号 电话：021-12345678</span>
        <span>第 1 页 / 共 1 页</span>
      </div>
    `

    printContent(title, tableHtml)
    return
  }

  const tableHtml = `
    <div class="print-title">${title}</div>
    <div class="print-table-wrap">
      <table class="print-table">
        <thead>
          <tr><th>项目</th><th>金额</th></tr>
        </thead>
        <tbody>
          ${data.map(row => `<tr><td class='center-cell'>${row.item}</td><td class='center-cell'>${row.amount}</td></tr>`).join('')}
        </tbody>
      </table>
      <img id="print-stamp" src="/zhang.png" class="print-stamp"/>
    </div>
    
    <div class="print-chart-area">
      <div style="display:flex;justify-content:space-between;margin-top:24px;">
        <img src='${chartImg}' style='width:48%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.04);background:#fff;'/>
        <img src='${pieChartImg}' style='width:48%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.04);background:#fff;'/>
      </div>
    </div>
    <div class="print-footer">
      <span>公司名称：智云科技有限公司 地址：上海市浦东新区88号 电话：021-12345678</span>
      <span>第 1 页 / 共 1 页</span>
    </div>
  `

  printContent(title, tableHtml)
}

function printContent(title: string, content: string) {
  const win = window.open('', '', 'width=800,height=900')
  if (!win) return
  win.document.write(`
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif; font-size: 15px; color: #222; background: #fff; border: 1px solid transparent; }
        .print-title { text-align: center; font-size: 22px; font-weight: bold; margin: 50px 0 50px 0; letter-spacing: 2px; }
        .print-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .print-table th, .print-table td { border: 1px solid #333; padding: 10px 0; font-size: 15px; text-align: center; vertical-align: middle; }
        .print-table th { background: #f5f5f5; font-weight: bold; }
        .center-cell { text-align: center; vertical-align: middle; }
        .print-company { margin-top: 18px; font-size: 14px; color: #444; text-align: left; }
        .print-chart-area { margin-top: 18px; text-align: center; }
        .print-footer { width:100%; margin-top: 10px; font-size: 13px; color: #888; border-top: 1px solid #eee; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; flex-direction: row;position:absolute;bottom:25px; }
        .print-footer span { display:block;width:auto;height:100%;padding:0 20px; }
        .print-stamp { position: absolute; right: 24px; bottom: 200px; width: 155px; height: 155px; opacity: 0.85; z-index: 10; pointer-events: none; }
        @media print {
          body { background: #fff !important; }
          .print-title { margin-top: 0; }
          .print-stamp { display: block; }
        }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `)
  win.document.close()

  // 关键：等待图片加载后再打印
  win.onload = function () {
    const img = win.document.getElementById('print-stamp') as HTMLImageElement | null
    if (img && img.complete) {
      win.focus()
      win.print()
      win.close()
    } else if (img) {
      img.onload = function () {
        setTimeout(() => {
          win.focus()
          win.print()
          win.close()
        }, 100)
      }
      img.onerror = function () {
        win.focus()
        win.print()
        win.close()
      }
    } else {
      win.focus()
      win.print()
      win.close()
    }
  }
}

function formatDateTime(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

// 图表渲染相关
const chartRef = ref<HTMLDivElement | null>(null)
const pieChartRef = ref<HTMLDivElement | null>(null)
const trendChartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

// 处理标签页切换
function handleTabClick() {
  nextTick(() => {
    renderCurrentTabCharts()
  })
}

// 渲染当前标签页的图表
function renderCurrentTabCharts() {
  if (activeTab.value === 'trend') {
    renderTrendChart()
  } else {
    renderChart()
    renderPieChart()
  }
}

function renderChart() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  let option: echarts.EChartsOption = {}

  if (activeTab.value === 'profit') {
    // 利润表柱状图
    option = {
      title: { text: '利润表结构', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: profitTableData.value.map(i => i.item) },
      yAxis: { type: 'value' },
      series: [
        {
          name: '金额',
          type: 'bar',
          data: profitTableData.value.map(i => Number(i.amount.replace(/,/g, ''))),
          itemStyle: { color: '#409EFF' },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            fontSize: 12
          }
        }
      ]
    }
    chartInstances.value.profit = true
  } else if (activeTab.value === 'balance') {
    // 资产负债表条形图
    option = {
      title: { text: '资产负债结构', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: balanceTableData.value.map(i => i.item) },
      series: [
        {
          name: '金额',
          type: 'bar',
          data: balanceTableData.value.map(i => Number(i.amount.replace(/,/g, ''))),
          itemStyle: { color: '#67C23A' },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}',
            fontSize: 12
          }
        }
      ]
    }
    chartInstances.value.balance = true
  } else if (activeTab.value === 'cash') {
    // 现金流量表折线图
    option = {
      title: { text: '现金流量结构', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: cashTableData.value.map(i => i.item) },
      yAxis: { type: 'value' },
      series: [
        {
          name: '金额',
          type: 'line',
          data: cashTableData.value.map(i => Number(i.amount.replace(/,/g, ''))),
          itemStyle: { color: '#E6A23C' },
          lineStyle: { width: 3 },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            fontSize: 12
          }
        }
      ]
    }
    chartInstances.value.cash = true
  }

  chart.setOption(option)
  chart.resize()
}

// 渲染饼图
function renderPieChart() {
  if (!pieChartRef.value) return
  if (!pieChart) pieChart = echarts.init(pieChartRef.value)
  let option: echarts.EChartsOption = {}

  if (activeTab.value === 'profit') {
    // 利润表饼图
    const profitData = profitTableData.value.filter(i => i.item !== '净利润' && Number(i.amount.replace(/,/g, '')) > 0).map(i => ({ value: Number(i.amount.replace(/,/g, '')), name: i.item }))

    option = {
      title: { text: '成本费用结构', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '5%', left: 'center' },
      series: [
        {
          name: '金额',
          type: 'pie',
          radius: '60%',
          data: profitData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}: {c} ({d}%)',
            fontSize: 12
          }
        }
      ]
    }
  } else if (activeTab.value === 'balance') {
    // 资产负债表饼图
    const assetData = balanceTableData.value.filter(i => i.item !== '资产总计' && i.item !== '负债总计' && i.item !== '所有者权益').map(i => ({ value: Number(i.amount.replace(/,/g, '')), name: i.item }))

    option = {
      title: { text: '资产结构', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '5%', left: 'center' },
      series: [
        {
          name: '金额',
          type: 'pie',
          radius: '60%',
          data: assetData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}: {c} ({d}%)',
            fontSize: 12
          }
        }
      ]
    }
  } else if (activeTab.value === 'cash') {
    // 现金流量表饼图
    const cashData = cashTableData.value.filter(i => i.item !== '现金及现金等价物净增加额' && Number(i.amount.replace(/,/g, '')) !== 0).map(i => ({ value: Math.abs(Number(i.amount.replace(/,/g, ''))), name: i.item }))

    option = {
      title: { text: '现金流量构成', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '5%', left: 'center' },
      series: [
        {
          name: '金额',
          type: 'pie',
          radius: '60%',
          data: cashData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}: {c} ({d}%)',
            fontSize: 12
          }
        }
      ]
    }
  }

  pieChart.setOption(option)
  pieChart.resize()
}

// 获取趋势数据
function getTrendData() {
  // 按日期汇总销售订单金额和采购订单金额
  const trendData: Record<string, { sales: number; purchase: number }> = {}

  // 处理销售订单
  filteredSalesOrders.value.forEach(order => {
    const date = order.orderDate
    if (!trendData[date]) {
      trendData[date] = { sales: 0, purchase: 0 }
    }
    trendData[date].sales += order.totalAmount
  })

  // 处理采购订单
  filteredPurchaseOrders.value.forEach(order => {
    const date = order.orderDate
    if (!trendData[date]) {
      trendData[date] = { sales: 0, purchase: 0 }
    }
    trendData[date].purchase += order.amount
  })

  return trendData
}

// 渲染趋势图表
function renderTrendChart() {
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)

  const trendData = getTrendData()
  const dates = Object.keys(trendData).sort()
  const salesData = dates.map(date => trendData[date].sales)
  const purchaseData = dates.map(date => trendData[date].purchase)

  let option: echarts.EChartsOption = {}

  if (trendType.value === 'sales') {
    // 销售趋势图
    option = {
      title: { text: '销售趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates, axisLabel: { interval: 0, rotate: 30 } },
      yAxis: { type: 'value' },
      series: [
        {
          name: '销售额',
          type: 'line',
          data: salesData,
          itemStyle: { color: '#409EFF' },
          areaStyle: { opacity: 0.3 },
          smooth: true,
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            fontSize: 12
          }
        }
      ]
    }
  } else if (trendType.value === 'purchase') {
    // 采购趋势图
    option = {
      title: { text: '采购趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates, axisLabel: { interval: 0, rotate: 30 } },
      yAxis: { type: 'value' },
      series: [
        {
          name: '采购额',
          type: 'line',
          data: purchaseData,
          itemStyle: { color: '#67C23A' },
          areaStyle: { opacity: 0.3 },
          smooth: true,
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            fontSize: 12
          }
        }
      ]
    }
  } else if (trendType.value === 'compare') {
    // 销售采购对比图
    option = {
      title: { text: '销售与采购对比', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['销售额', '采购额'], bottom: 10 },
      xAxis: { type: 'category', data: dates, axisLabel: { interval: 0, rotate: 30 } },
      yAxis: { type: 'value' },
      series: [
        {
          name: '销售额',
          type: 'bar',
          data: salesData,
          itemStyle: { color: '#409EFF' },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            fontSize: 12
          }
        },
        {
          name: '采购额',
          type: 'bar',
          data: purchaseData,
          itemStyle: { color: '#67C23A' },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            fontSize: 12
          }
        }
      ]
    }
  }

  trendChart.setOption(option)
  trendChart.resize()
  chartInstances.value.trend = true
}

watch([profitTableData, balanceTableData, cashTableData], () => {
  nextTick(() => {
    if (activeTab.value !== 'trend') {
      renderChart()
      renderPieChart()
    }
  })
})

onMounted(() => {
  nextTick(() => {
    renderCurrentTabCharts()
  })

  window.addEventListener('resize', () => {
    chart && chart.resize()
    pieChart && pieChart.resize()
    trendChart && trendChart.resize()
  })
})

onUnmounted(() => {
  if (refreshInterval !== null) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }

  window.removeEventListener('resize', () => {
    chart && chart.resize()
    pieChart && pieChart.resize()
    trendChart && trendChart.resize()
  })

  // 销毁图表实例
  chart?.dispose()
  pieChart?.dispose()
  trendChart?.dispose()
})
</script>
<style scoped>
.finance-report-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 400px;
}
.filter-area {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}
.report-toolbar {
  margin-bottom: 8px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}
/* 新增业务趋势工具栏样式 */
.trend-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.trend-tools-left {
  display: flex;
  align-items: center;
}
.trend-tools-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.chart-area {
  margin-top: 24px;
  width: 100%;
}
.chart-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
}
.chart-box {
  flex: 1;
  min-height: 340px;
  height: 340px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.trend-chart-box {
  width: 100%;
  height: 400px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
</style>
