<template>
  <div class="expense-container">
    <!-- 筛选表单 -->
    <el-form :inline="true" :model="filters" class="filter-form">
      <el-form-item label="费用类型" style="width: 150px">
        <el-select v-model="filters.type" placeholder="全部" clearable>
          <el-option label="差旅费" value="差旅费" />
          <el-option label="办公费" value="办公费" />
          <el-option label="招待费" value="招待费" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="申请人" style="width: 180px">
        <el-input v-model="filters.applicant" placeholder="请输入申请人" clearable />
      </el-form-item>
      <el-form-item label="状态" style="width: 150px">
        <el-select v-model="filters.status" placeholder="全部" clearable>
          <el-option label="待审核" value="待审核" />
          <el-option label="已通过" value="已通过" />
          <el-option label="已驳回" value="已驳回" />
          <el-option label="已报销" value="已报销" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期" style="width: 300px">
        <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>
    <div class="header-bar">
      <el-button type="primary" @click="openDialog" :disabled="!hasFinanceEditPermission()">新建费用申请</el-button>
      <el-button type="success" @click="batchExportAudit" :disabled="!hasFinanceEditPermission()" style="margin-left: 8px">批量导出审核申请</el-button>
      <el-button type="warning" @click="batchExportReimburse" :disabled="!hasFinanceEditPermission()" style="margin-left: 8px">批量导出报销申请</el-button>
    </div>
    <!-- 费用申请表格 -->
    <el-table :data="pagedList" border style="margin-top: 20px" :header-cell-style="{ background: '#fafbfc' }" :max-height="500" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" fixed="left" />
      <el-table-column prop="expenseNo" label="申请单号" min-width="140" fixed="left" />
      <el-table-column prop="type" label="费用类型" min-width="100" />
      <el-table-column prop="amount" label="金额" min-width="100" />
      <el-table-column prop="applicant" label="申请人" min-width="100" />
      <el-table-column prop="date" label="申请日期" min-width="120" />
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" disable-transitions>{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="说明" min-width="120" />
      <el-table-column prop="attachments" label="附件" min-width="90">
        <template #default="{ row }">
          <span v-if="row.attachments && row.attachments.length">{{ row.attachments.length }} 个附件</span>
          <span v-else>无</span>
        </template>
      </el-table-column>
      <el-table-column label="审核信息" min-width="180">
        <template #default="{ row }">
          <div v-if="row.auditUser" class="audit-info-cell">
            <div style="margin-bottom: 2px">
              <el-icon style="vertical-align: middle; margin-right: 2px"><User /></el-icon><b>{{ row.auditUser }}</b>
            </div>
            <div style="margin-bottom: 2px">
              <el-icon style="vertical-align: middle; margin-right: 2px"><Calendar /></el-icon>{{ row.auditDate }}
            </div>
            <div style="color: #888; font-size: 13px">意见：{{ row.auditRemark || '-' }}</div>
          </div>
          <div v-else>--</div>
        </template>
      </el-table-column>
      <el-table-column label="报销信息" min-width="180">
        <template #default="{ row }">
          <div v-if="row.reimburseUser">报销人：{{ row.reimburseUser }}<br />报销日期：{{ row.reimburseDate }}</div>
          <div v-else>--</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">查看</el-button>
          <el-button v-if="row.status === '待审核'" size="small" type="primary" @click="openAuditDialog(row)" :disabled="!hasFinanceEditPermission()">审核</el-button>
          <el-button v-if="row.status === '已通过'" size="small" type="success" @click="openReimburseDialog(row)" :disabled="!hasFinanceEditPermission()">报销</el-button>
          <el-button v-if="row.status === '待审核' || row.status === '已通过'" size="small" @click="openExportDialog(row)" :disabled="!hasFinanceEditPermission()">导出</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <div class="pagination" style="margin-top: 16px; text-align: right">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="filteredList.length" :page-size="pageSize" v-model:current-page="currentPage" />
    </div>
    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="新建费用申请" width="500px">
      <el-form :model="form">
        <el-form-item label="费用类型">
          <el-select v-model="form.type" placeholder="请选择">
            <el-option label="差旅费" value="差旅费" />
            <el-option label="办公费" value="办公费" />
            <el-option label="招待费" value="招待费" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input v-model="form.amount" type="number" placeholder="请输入金额" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入说明" />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false">
            <el-button>上传附件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary">保存</el-button>
      </template>
    </el-dialog>
    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="费用申请详情" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="申请单号">{{ detailRow?.expenseNo }}</el-descriptions-item>
        <el-descriptions-item label="费用类型">{{ detailRow?.type }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ detailRow?.amount }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detailRow?.applicant }}</el-descriptions-item>
        <el-descriptions-item label="申请日期">{{ detailRow?.date }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailRow?.status }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ detailRow?.remark }}</el-descriptions-item>
        <el-descriptions-item label="附件">
          <span v-if="detailRow?.attachments && detailRow.attachments.length">{{ detailRow.attachments.length }} 个附件</span>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="审核信息">
          <div v-if="detailRow?.auditUser" class="audit-info-cell">
            <div style="margin-bottom: 2px">
              <el-icon style="vertical-align: middle; margin-right: 2px"><User /></el-icon><b>{{ detailRow.auditUser }}</b>
            </div>
            <div style="margin-bottom: 2px">
              <el-icon style="vertical-align: middle; margin-right: 2px"><Calendar /></el-icon>{{ detailRow.auditDate }}
            </div>
            <div style="color: #888; font-size: 13px">意见：{{ detailRow.auditRemark || '-' }}</div>
          </div>
          <div v-else>--</div>
        </el-descriptions-item>
        <el-descriptions-item label="报销信息">
          <div v-if="detailRow?.reimburseUser">
            <div style="margin-bottom: 2px">
              <el-icon style="vertical-align: middle; margin-right: 2px"><User /></el-icon><b>{{ detailRow.reimburseUser }}</b>
            </div>
            <div style="margin-bottom: 2px">
              <el-icon style="vertical-align: middle; margin-right: 2px"><Calendar /></el-icon>{{ detailRow.reimburseDate }}
            </div>
          </div>
          <div v-else>--</div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    <!-- 审核弹窗 -->
    <el-dialog v-model="auditDialogVisible" title="费用审核" width="400px">
      <el-radio-group v-model="auditResult">
        <el-radio label="已通过">通过</el-radio>
        <el-radio label="已驳回">驳回</el-radio>
      </el-radio-group>
      <el-form-item label="审核附件">
        <el-upload action="#" :auto-upload="false" multiple :file-list="auditFileList" :on-change="handleAuditFileChange" list-type="picture-card">
          <el-icon><Plus /></el-icon>
        </el-upload>
        <div v-if="detailRow?.attachments && detailRow.attachments.length" style="margin-top: 4px; color: #888; font-size: 13px">已上传：{{ detailRow.attachments.length }} 个</div>
      </el-form-item>
      <el-form-item label="审核意见">
        <el-input v-model="auditRemark" type="textarea" placeholder="审核意见" style="margin-top: 12px" />
      </el-form-item>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">提交</el-button>
      </template>
    </el-dialog>
    <!-- 报销弹窗 -->
    <el-dialog v-model="reimburseDialogVisible" title="费用报销" width="400px">
      <el-form>
        <el-form-item label="报销人">
          <el-input v-model="reimburseUser" placeholder="请输入报销人" />
        </el-form-item>
        <el-form-item label="报销日期">
          <el-date-picker v-model="reimburseDate" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="报销附件">
          <el-upload action="#" :auto-upload="false" multiple :file-list="reimburseFileList" :on-change="handleReimburseFileChange" list-type="picture-card">
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div v-if="detailRow?.reimburseAttachments && detailRow.reimburseAttachments.length" style="margin-top: 4px; color: #888; font-size: 13px">已上传：{{ detailRow.reimburseAttachments.length }} 个</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reimburseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReimburse">确认报销</el-button>
      </template>
    </el-dialog>
    <!-- 导出/打印弹窗 -->
    <el-dialog v-model="exportDialogVisible" :title="exportTitle" width="800px" :show-close="true">
      <PrintExpenseDetail v-if="exportRow" :expense="exportRow" :mode="exportMode" ref="printDetailRef" />
      <template #footer>
        <el-button @click="exportDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handlePrint">打印/导出</el-button>
      </template>
    </el-dialog>
    <!-- 批量导出/打印弹窗 -->
    <el-dialog v-model="batchExportDialogVisible" :title="batchExportTitle" width="900px" :show-close="true">
      <div ref="batchPrintArea" class="print-batch-container">
        <div v-for="(row, idx) in batchExportRows" :key="row.expenseNo" class="print-batch-item" :style="{ borderBottom: idx !== batchExportRows.length - 1 ? '1px dashed #888' : 'none' }">
          <PrintExpenseDetail :expense="row" :mode="batchExportMode" />
        </div>
      </div>
      <template #footer>
        <el-button @click="batchExportDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleBatchPrint">打印/导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { allExpenses } from '../../../stores/expenseData'
import { User, Calendar, Plus } from '@element-plus/icons-vue'
import { defineAsyncComponent } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../../stores/user'

// 获取用户store
const userStore = useUserStore()

// 检查是否有财务编辑权限
const hasFinanceEditPermission = () => {
  return userStore.hasPermission('finance:edit')
}

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const auditDialogVisible = ref(false)
const reimburseDialogVisible = ref(false)
const exportDialogVisible = ref(false)
const filters = reactive({ type: '', applicant: '', status: '', dateRange: [] as string[] })
const pageSize = 10
const currentPage = ref(1)
const form = reactive({ type: '', amount: '', remark: '' })
const detailRow = ref<any>(null)
const auditResult = ref('已通过')
const auditRemark = ref('')
const reimburseUser = ref('')
const reimburseDate = ref('')
const exportRow = ref<any>(null)
const exportMode = ref<'audit' | 'reimburse'>('audit')
const exportTitle = computed(() => (exportMode.value === 'audit' ? '费用审核申请单导出' : '费用报销申请单导出'))
const printDetailRef = ref<any>(null)
const multipleSelection = ref<any[]>([])
const auditFileList = ref<any[]>([])
const reimburseFileList = ref<any[]>([])

// 使用异步组件导入
const PrintExpenseDetail = defineAsyncComponent(() => import('./PrintExpenseDetail.vue'))

function formatDateStr(date: any) {
  if (!date) return ''
  if (typeof date === 'string') return date.slice(0, 10)
  // Date对象
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
const filteredList = computed(() => {
  return allExpenses.value.filter(item => {
    const matchType = !filters.type || item.type === filters.type
    const matchApplicant = !filters.applicant || item.applicant.includes(filters.applicant)
    const matchStatus = !filters.status || item.status === filters.status
    let matchDate = true
    if (Array.isArray(filters.dateRange) && filters.dateRange.length === 2 && filters.dateRange[0] && filters.dateRange[1]) {
      const start = formatDateStr(filters.dateRange[0])
      const end = formatDateStr(filters.dateRange[1])
      const cur = formatDateStr(item.date)
      matchDate = cur >= start && cur <= end
    }
    return matchType && matchApplicant && matchStatus && matchDate
  })
})
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})
function openDialog() {
  if (!hasFinanceEditPermission()) {
    ElMessage.warning('暂无权限创建费用申请')
    return
  }
  dialogVisible.value = true
}
function resetFilters() {
  filters.type = ''
  filters.applicant = ''
  filters.status = ''
  filters.dateRange = []
  currentPage.value = 1
}
function viewDetail(row: any) {
  detailRow.value = row
  detailDialogVisible.value = true
}
function openAuditDialog(row: any) {
  if (!hasFinanceEditPermission()) {
    ElMessage.warning('暂无权限审核费用申请')
    return
  }
  detailRow.value = row
  auditDialogVisible.value = true
  auditResult.value = '已通过'
  auditRemark.value = '同意报销'
}
function openReimburseDialog(row: any) {
  if (!hasFinanceEditPermission()) {
    ElMessage.warning('暂无权限进行费用报销')
    return
  }
  detailRow.value = row
  reimburseDialogVisible.value = true
  reimburseDate.value = formatDate(new Date())
}
function openExportDialog(row: any) {
  if (!hasFinanceEditPermission()) {
    ElMessage.warning('暂无权限导出费用单')
    return
  }
  exportRow.value = row
  exportMode.value = row.status === '待审核' ? 'audit' : 'reimburse'
  exportDialogVisible.value = true
}
function handlePrint() {
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
          .print-stamp-row { display: flex; justify-content: flex-end; margin: 32px 0 0 0; }
          .print-stamp-area { width: 180px; text-align: right; }
          .stamp-label { font-size: 15px; color: #888; margin-bottom: 8px; }
          .stamp-box { width: 120px; height: 60px; border: 1.5px dashed #bbb; border-radius: 8px; display: inline-block; background: #fff; }
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
          <title>${exportTitle.value}</title>
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
function statusTagType(status: string) {
  if (status === '待审核') return 'warning'
  if (status === '已通过') return 'success'
  if (status === '已驳回') return 'danger'
  if (status === '已报销') return 'info'
  return 'default'
}
function submitAudit() {
  if (!detailRow.value) return
  detailRow.value.status = auditResult.value
  detailRow.value.auditUser = '当前用户' // 可替换为实际登录用户
  detailRow.value.auditDate = formatDate(new Date())
  detailRow.value.auditRemark = auditRemark.value
  auditDialogVisible.value = false
  auditRemark.value = ''
}
function submitReimburse() {
  if (!detailRow.value) return
  detailRow.value.status = '已报销'
  detailRow.value.reimburseUser = reimburseUser.value || '当前用户'
  detailRow.value.reimburseDate = reimburseDate.value || formatDate(new Date())
  reimburseDialogVisible.value = false
  reimburseUser.value = ''
  reimburseDate.value = ''
}
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
// 审核结果切换时自动填充意见
watch(auditResult, val => {
  if (val === '已通过') {
    auditRemark.value = '同意报销'
  } else if (val === '已驳回') {
    auditRemark.value = '驳回申请'
  }
})
function handleSelectionChange(val: any[]) {
  multipleSelection.value = val
}
const batchExportDialogVisible = ref(false)
const batchExportRows = ref<any[]>([])
const batchExportMode = ref<'audit' | 'reimburse'>('audit')
const batchExportTitle = computed(() => (batchExportMode.value === 'audit' ? '批量导出费用审核申请单' : '批量导出费用报销申请单'))
const batchPrintArea = ref<HTMLElement | null>(null)
function batchExportAudit() {
  if (!hasFinanceEditPermission()) {
    ElMessage.warning('暂无权限批量导出审核申请')
    return
  }
  // 自动勾选所有待审核
  const rows = pagedList.value.filter(row => row.status === '待审核')
  batchExportRows.value = rows
  batchExportMode.value = 'audit'
  batchExportDialogVisible.value = true
}
function batchExportReimburse() {
  if (!hasFinanceEditPermission()) {
    ElMessage.warning('暂无权限批量导出报销申请')
    return
  }
  // 自动勾选所有已通过
  const rows = pagedList.value.filter(row => row.status === '已通过')
  batchExportRows.value = rows
  batchExportMode.value = 'reimburse'
  batchExportDialogVisible.value = true
}
function handleBatchPrint() {
  nextTick(() => {
    if (!batchPrintArea.value) return
    const printContent = batchPrintArea.value.innerHTML
    const styleContent = `
      <style>
        body { font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif; font-size: 14px; color: #222; background: #fff; }
        .print-batch-container { width: 800px; margin: 0 auto; }
        .print-batch-item { min-height: 140mm; box-sizing: border-box; page-break-inside: avoid; padding: 24px 36px 12px 36px; background: #fff; display: flex; flex-direction: column; justify-content: flex-start; }
        .print-batch-item:not(:last-child) { border-bottom: 1px dashed #888; }
        .print-area { width: 700px; margin: 0 auto; font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif; font-size: 14px; color: #222; background: #fff; }
        .print-title { text-align: center; font-size: 22px; font-weight: bold; margin: 24px 0 18px 0; letter-spacing: 2px; }
        .barcode-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90px; margin-bottom: 10px; }
        .print-header-table { width: 100%; margin-bottom: 18px; border-collapse: collapse; }
        .print-header-table td { padding: 4px 12px; font-size: 14px; border: none; text-align: left; }
        .print-remark { margin: 8px 0 0 0; font-size: 14px; text-align: left; }
        .print-stamp-row { display: flex; justify-content: flex-end; margin: 32px 0 0 0; }
        .print-stamp-area { width: 180px; text-align: right; }
        .stamp-label { font-size: 15px; color: #888; margin-bottom: 8px; }
        .stamp-box { width: 120px; height: 60px; border: 1.5px dashed #bbb; border-radius: 8px; display: inline-block; background: #fff; }
        .print-footer { display: flex; justify-content: space-between; margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 8px; }
        @media print {
          body { background: #fff !important; }
          .el-dialog__header, .el-dialog__footer, .el-overlay, .el-button { display: none !important; }
          .print-batch-container { width: 100% !important; margin: 0 !important; }
          .print-batch-item { min-height: 140mm !important; box-sizing: border-box; page-break-inside: avoid; }
          .print-batch-item:nth-child(2n) { page-break-after: always; }
          .print-batch-item:last-child { page-break-after: auto !important; }
          .print-area { box-shadow: none !important; margin: 0 !important; width: 100% !important; }
          .barcode-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90px; margin-bottom: 10px; page-break-inside: avoid; }
        }
      </style>
    `
    const win = window.open('', '', 'width=900,height=1200')
    if (!win) return
    win.document.write(`
      <html>
      <head>
        <title>${batchExportTitle.value}</title>
        ${styleContent}
      </head>
      <body>${printContent}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  })
}
function handleAuditFileChange(file, fileList) {
  auditFileList.value = fileList
  if (detailRow.value) {
    if (!detailRow.value.attachments) detailRow.value.attachments = []
    detailRow.value.attachments = fileList.map(f => f.name)
  }
}
function handleReimburseFileChange(file, fileList) {
  reimburseFileList.value = fileList
  if (detailRow.value) {
    if (!detailRow.value.reimburseAttachments) detailRow.value.reimburseAttachments = []
    detailRow.value.reimburseAttachments = fileList.map(f => f.name)
  }
}
</script>
<style scoped>
.expense-container {
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
.audit-info-cell {
  line-height: 1.6;
  padding: 2px 0;
}
</style>
