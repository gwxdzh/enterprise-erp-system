<template>
  <div class="payment-receipt-container">
    <div class="header-bar">
      <!-- 移除登记收付款按钮 -->
    </div>
    <!-- 筛选表单 -->
    <el-form :inline="true" :model="filters" class="filter-form">
      <el-form-item label="类型" style="width: 200px">
        <el-select v-model="filters.type" placeholder="全部" clearable>
          <el-option label="收款" value="收款" />
          <el-option label="付款" value="付款" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型" style="width: 200px">
        <el-select v-model="filters.businessType" placeholder="全部" clearable>
          <el-option label="采购" value="采购" />
          <el-option label="销售" value="销售" />
        </el-select>
      </el-form-item>
      <el-form-item label="单号">
        <el-input v-model="filters.relatedOrderNo" placeholder="请输入单号" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 明细表格 -->
    <el-table :data="pagedList" border style="margin-top: 20px">
      <el-table-column prop="date" label="日期" min-width="120" />
      <el-table-column prop="type" label="类型" min-width="80" />
      <el-table-column prop="businessType" label="业务类型" min-width="80" />
      <el-table-column prop="relatedOrderNo" label="关联单号" min-width="120" />
      <el-table-column prop="customerOrSupplier" label="客户/供应商" min-width="150" />
      <el-table-column prop="amount" label="金额" min-width="100" :formatter="moneyFormatter" />
      <el-table-column prop="paidAmount" label="已付/已收" min-width="100" :formatter="moneyFormatter" />
      <el-table-column prop="unpaidAmount" label="未付/未收" min-width="100" :formatter="moneyFormatter" />
      <el-table-column prop="method" label="支付方式" min-width="100" />
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120">
        <template #default="{ row }">
          <el-button size="small">查看</el-button>
          <el-button v-if="(row.type === '收款' && row.status === '已完成') || (row.type === '付款' && (row.status === '已入库' || row.status === '关联退款'))" size="small" type="primary" :disabled="!hasFinanceEditPermission()" @click="openExportDialog(row)">导出</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <div class="pagination" style="margin-top: 16px; text-align: right">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="filteredList.length" :page-size="pageSize" v-model:current-page="currentPage" />
    </div>
    <!-- 新增/编辑弹窗 -->
    <!-- 已移除登记收付款弹窗 -->
    <!-- 导出/打印弹窗 -->
    <el-dialog v-model="exportDialogVisible" title="收付款单导出" width="800px" :show-close="true">
      <PrintReceiptDetail v-if="exportRow" :receipt="exportRow" ref="printDetailRef" />
      <template #footer>
        <el-button @click="exportDialogVisible = false">关闭</el-button>
        <el-button type="primary" :disabled="!hasFinanceEditPermission()" @click="handlePrint">打印/导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, defineAsyncComponent } from 'vue'
import { allOrders } from '../../../stores/orderData'
import { allSalesOrders } from '../../../stores/salesOrderData'
import { useUserStore } from '../../../stores/user'
import { ElMessage } from 'element-plus'

// 使用异步组件导入
const PrintReceiptDetail = defineAsyncComponent(() => import('./PrintReceiptDetail.vue'))

// 获取用户store
const userStore = useUserStore()

// 检查是否有财务编辑权限
const hasFinanceEditPermission = () => {
  return userStore.hasPermission('finance:edit')
}

const dialogVisible = ref(false)
const filters = reactive({
  type: '',
  businessType: '',
  relatedOrderNo: ''
})
const pageSize = 10
const currentPage = ref(1)

// 打印/导出相关
const exportDialogVisible = ref(false)
const exportRow = ref<any>(null)
const printDetailRef = ref<any>(null)

function openExportDialog(row: any) {
  if (!hasFinanceEditPermission()) {
    ElMessage.warning('暂无权限导出收付款单')
    return
  }

  exportRow.value = row
  exportDialogVisible.value = true
}

function handlePrint() {
  if (!hasFinanceEditPermission()) {
    ElMessage.warning('暂无权限打印导出收付款单')
    return
  }

  nextTick(() => {
    const printArea = printDetailRef.value?.$el || printDetailRef.value?.printArea || null
    if (printArea) {
      const printContent = printArea.innerHTML
      const styleContent = `
        <style>
          body { font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif; font-size: 14px; color: #222; background: #fff; }
          .print-area { width: 700px; margin: 0 auto; font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif; font-size: 14px; color: #222; background: #fff; }
          .print-title { text-align: center; font-size: 22px; font-weight: bold; margin: 24px 0 18px 0; letter-spacing: 2px; }
          .barcode-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90px; margin-bottom: 10px; }
          .print-header-table { width: 100%; margin-bottom: 18px; border-collapse: collapse; }
          .print-header-table td { padding: 4px 12px; font-size: 14px; border: none; text-align: left; }
          .print-remark { margin: 8px 0 0 0; font-size: 14px; text-align: left; }
          .print-footer { display: flex; justify-content: space-between; margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 8px; }
          @media print {
            body { background: #fff !important; }
            .print-area { box-shadow: none !important; margin: 0 !important; width: 100% !important; }
            .barcode-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90px; margin-bottom: 10px; page-break-inside: avoid; }
          }
        </style>
      `
      const win = window.open('', '', 'width=800,height=600')
      if (!win) return
      win.document.write(`
        <html>
        <head>
          <title>收付款单导出</title>
          ${styleContent}
        </head>
        <body>${printContent}</body>
        </html>
      `)
      win.document.close()
      win.focus()
      win.print()
      win.close()
    }
  })
}

// 采购付款账单
const purchaseBills = computed(() =>
  allOrders.value.map(order => ({
    date: order.orderDate,
    type: '付款',
    businessType: '采购',
    relatedOrderNo: order.orderNo,
    customerOrSupplier: order.supplier,
    amount: order.amount,
    paidAmount: order.paidAmount ?? 0,
    unpaidAmount: order.unpaidAmount ?? order.amount - (order.paidAmount ?? 0),
    method: order.paymentMethod || '-',
    status: order.status
  }))
)
// 销售收款账单
const salesBills = computed(() =>
  allSalesOrders.value.map(order => ({
    date: order.orderDate,
    type: '收款',
    businessType: '销售',
    relatedOrderNo: order.orderNo,
    customerOrSupplier: order.customerName,
    amount: order.totalAmount,
    paidAmount: order.status === '已完成' ? order.totalAmount : 0,
    unpaidAmount: order.status === '待收款' ? order.totalAmount : 0,
    method: '-',
    status: order.status
  }))
)
// 合并账单
const allBills = computed(() => [...purchaseBills.value, ...salesBills.value])

// 筛选
const filteredList = computed(() => {
  return allBills.value.filter(item => {
    const matchType = !filters.type || item.type === filters.type
    const matchBiz = !filters.businessType || item.businessType === filters.businessType
    const matchOrder = !filters.relatedOrderNo || (item.relatedOrderNo && item.relatedOrderNo.includes(filters.relatedOrderNo))
    return matchType && matchBiz && matchOrder
  })
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

function openDialog() {
  dialogVisible.value = true
}
function resetFilters() {
  filters.type = ''
  filters.businessType = ''
  filters.relatedOrderNo = ''
  currentPage.value = 1
}
function fetchList() {
  currentPage.value = 1
}
// 千分位金额格式化
function moneyFormatter(row: any, column: any, cellValue: number) {
  if (typeof cellValue !== 'number') return cellValue
  return '￥' + cellValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
// 状态tag颜色（每种状态唯一颜色）
function statusTagType(row: any) {
  if (row.type === '收款') {
    if (row.status === '已完成') return 'success' // 绿色
    if (row.status === '待收款') return 'warning' // 橙色
    if (row.status === '已关闭') return 'info' // 蓝灰
    if (row.status === '已驳回') return 'danger' // 红
    if (row.status === '退货待审核') return 'primary' // 蓝
    if (row.status === '退货成功') return 'default' // 灰
    if (row.status === '退货已驳回') return 'danger' // 红（如需更细可自定义class）
    return 'default'
  } else if (row.type === '付款') {
    if (row.status === '已入库') return 'success' // 绿色
    if (row.status === '关联退款') return 'primary' // 蓝
    if (row.status === '待支付') return 'warning' // 橙色
    if (row.status === '已取消') return 'danger' // 红
    if (row.status === '已审核') return 'info' // 蓝灰
    if (row.status === '已完成') return 'default' // 灰
    if (row.status === '已驳回') return 'danger' // 红
    return 'default'
  }
  return 'default'
}
</script>

<style scoped>
.payment-receipt-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 400px;
}
.header-bar {
  margin-bottom: 16px;
  text-align: right;
}
.filter-form {
  margin-bottom: 16px;
}
.print-area {
  width: 700px;
  margin: 0 auto;
  font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 14px;
  color: #222;
  background: #fff;
}
.print-title {
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  margin: 24px 0 18px 0;
  letter-spacing: 2px;
}
.barcode-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  margin-bottom: 10px;
}
.print-header-table {
  width: 100%;
  margin-bottom: 18px;
  border-collapse: collapse;
}
.print-header-table td {
  padding: 4px 12px;
  font-size: 14px;
  border: none;
  text-align: left;
}
.print-remark {
  margin: 8px 0 0 0;
  font-size: 14px;
  text-align: left;
}
.print-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  font-size: 12px;
  color: #888;
  border-top: 1px solid #eee;
  padding-top: 8px;
}
@media print {
  body {
    background: #fff !important;
  }
  .el-dialog__header,
  .el-dialog__footer,
  .el-overlay,
  .el-button {
    display: none !important;
  }
  .print-area {
    box-shadow: none !important;
    margin: 0 !important;
    width: 100% !important;
  }
  .barcode-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
}
</style>
