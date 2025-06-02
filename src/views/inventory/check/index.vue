<template>
  <div class="inventory-check-container">
    <div class="header-bar">
      <el-button type="primary" :disabled="!hasInventoryEditPermission()" @click="openCreateDialog">创建盘点单</el-button>
    </div>
    <el-table :data="pagedCheckList.value || []" border style="margin-bottom: 24px">
      <el-table-column prop="id" label="盘点单号" min-width="120" />
      <el-table-column prop="date" label="盘点日期" min-width="120" />
      <el-table-column prop="warehouseName" label="仓库" min-width="120" />
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === '待盘点' ? 'info' : scope.row.status === '待处理' ? 'warning' : 'success'" disable-transitions>
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="180">
        <template #default="scope">
          <el-button size="small" @click="viewDetail(scope.row)">查看</el-button>
          <el-button size="small" type="primary" v-if="scope.row.status === '待盘点'" :disabled="!hasInventoryEditPermission()" @click="executeCheck(scope.row)">执行盘点</el-button>
          <el-button size="small" type="success" v-if="scope.row.status === '待处理'" :disabled="!hasInventoryEditPermission()" @click="handleDiff(scope.row)">处理差异</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination" style="margin-top: 16px; text-align: right">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="(checkList.value && checkList.value.length) || 0" :page-size="pageSize" v-model:current-page="currentPage" />
    </div>

    <!-- 盘点单明细弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="盘点单明细" width="800px">
      <el-table :data="currentDetail?.items || []" border>
        <el-table-column prop="productName" label="商品名称" min-width="120" />
        <el-table-column prop="location" label="库位" min-width="100" />
        <el-table-column prop="batch" label="批次" min-width="100" />
        <el-table-column prop="systemQty" label="系统数量" min-width="100" />
        <el-table-column prop="realQty" label="实盘数量" min-width="100" />
        <el-table-column prop="diff" label="差异" min-width="80" />
      </el-table>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 创建盘点单弹窗 -->
    <el-dialog v-model="createDialogVisible" title="创建盘点单" width="500px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="仓库">
          <el-select v-model="createForm.warehouseId" placeholder="请选择仓库">
            <el-option v-for="w in warehouseOptions" :key="w.value" :label="w.label" :value="w.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点日期">
          <el-date-picker v-model="createForm.date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!hasInventoryEditPermission()" @click="createCheck">创建</el-button>
      </template>
    </el-dialog>

    <!-- 盘点执行弹窗 -->
    <el-dialog v-model="checkDialogVisible" title="执行盘点" width="800px">
      <el-table :data="checkEditItems" border>
        <el-table-column prop="productName" label="商品名称" min-width="120" />
        <el-table-column prop="location" label="库位" min-width="100" />
        <el-table-column prop="batch" label="批次" min-width="100" />
        <el-table-column prop="systemQty" label="系统数量" min-width="100" />
        <el-table-column label="实盘数量" min-width="150">
          <template #default="scope">
            <el-input-number v-model="checkEditItems[scope.$index].realQty" :min="0" @change="(val: any) => updateDiff(scope.$index)" />
          </template>
        </el-table-column>
        <el-table-column label="差异" min-width="80">
          <template #default="scope">
            <span :style="{ color: checkEditItems[scope.$index].diff === 0 ? '#333' : checkEditItems[scope.$index].diff > 0 ? '#67C23A' : '#F56C6C' }">
              {{ checkEditItems[scope.$index].diff }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="checkDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!hasInventoryEditPermission()" @click="saveCheckEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 差异处理弹窗 -->
    <el-dialog v-model="diffDialogVisible" title="处理差异" width="800px">
      <el-table :data="diffEditItems" border>
        <el-table-column prop="productName" label="商品名称" min-width="120" />
        <el-table-column prop="location" label="库位" min-width="100" />
        <el-table-column prop="batch" label="批次" min-width="100" />
        <el-table-column prop="systemQty" label="系统数量" min-width="100" />
        <el-table-column prop="realQty" label="实盘数量" min-width="100" />
        <el-table-column prop="diff" label="差异" min-width="80" />
      </el-table>
      <template #footer>
        <el-button @click="diffDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!hasInventoryEditPermission()" @click="confirmDiffHandle">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { allInventoryChecks, type InventoryCheck, type InventoryCheckItem } from '../../../stores/inventoryCheckData'
import { allInventory } from '../../../stores/inventoryData'
import { useUserStore } from '../../../stores/user'

// 获取用户store
const userStore = useUserStore()

// 检查是否有库存编辑权限
const hasInventoryEditPermission = () => {
  return userStore.hasPermission('inventory:edit')
}

// 假数据与后续数据源
const checkList = allInventoryChecks
const detailDialogVisible = ref(false)
const createDialogVisible = ref(false)
const currentDetail = ref<any>(null)
const createForm = reactive({ warehouseId: undefined, date: '' })
const warehouseOptions = computed(() => [
  { label: '上海总仓', value: 1 },
  { label: '北京分仓', value: 2 },
  { label: '广州分仓', value: 3 }
])

// 盘点执行弹窗
const checkDialogVisible = ref(false)
const checkEditRow = ref<InventoryCheck | null>(null)
const checkEditItems = ref<InventoryCheckItem[]>([])

// 差异处理弹窗
const diffDialogVisible = ref(false)
const diffEditRow = ref<InventoryCheck | null>(null)
const diffEditItems = ref<InventoryCheckItem[]>([])

const pageSize = 10
const currentPage = ref(1)
const pagedCheckList = computed(() => {
  if (!checkList.value) return []
  const start = (currentPage.value - 1) * pageSize
  return checkList.value.slice(start, start + pageSize)
})

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function openCreateDialog() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限创建盘点单')
    return
  }
  createDialogVisible.value = true
}
function createCheck() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限创建盘点单')
    return
  }
  if (!createForm.warehouseId || !createForm.date) return
  // 获取仓库信息
  const warehouse = warehouseOptions.value.find(w => w.value === createForm.warehouseId)
  if (!warehouse) return
  // 获取该仓库所有库存商品
  const items = allInventory.value
    .filter(inv => inv.warehouseId === createForm.warehouseId)
    .map((inv, idx) => ({
      id: Date.now() + idx, // 简单唯一id
      productId: inv.productId,
      productName: inv.productName,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouseName,
      zone: inv.zone,
      location: inv.location,
      batch: inv.batch,
      systemQty: inv.quantity,
      realQty: 0,
      diff: 0
    }))
  if (items.length === 0) {
    // 没有库存商品不允许创建
    ElMessage.warning('该仓库暂无库存商品，无法创建盘点单')
    return
  }
  // 生成盘点单号：取现有最大id+1，最小1001
  const maxId = allInventoryChecks.value.reduce((max, c) => Math.max(max, typeof c.id === 'number' ? c.id : 1000), 1000)
  const newId = maxId + 1
  // 格式化日期
  const dateStr = formatDate(createForm.date)
  // 生成盘点单对象
  const newCheck: InventoryCheck = {
    id: newId,
    date: dateStr,
    warehouseId: createForm.warehouseId as number,
    warehouseName: warehouse.label,
    status: '待盘点',
    items
  }
  allInventoryChecks.value.unshift(newCheck)
  currentPage.value = 1
  createDialogVisible.value = false
  // 重置表单
  createForm.warehouseId = undefined
  createForm.date = ''
}
function viewDetail(row: InventoryCheck) {
  currentDetail.value = row
  detailDialogVisible.value = true
}
function executeCheck(row: InventoryCheck) {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限执行盘点操作')
    return
  }
  // 只允许待盘点
  if (row.status !== '待盘点') return
  checkEditRow.value = row
  // 深拷贝明细，避免直接修改原数据
  checkEditItems.value = row.items.map(item => ({ ...item }))
  checkDialogVisible.value = true
}
function saveCheckEdit() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限执行盘点操作')
    return
  }
  if (!checkEditRow.value) return
  // 更新明细的实盘数量和差异
  checkEditRow.value.items.forEach((item, idx) => {
    item.realQty = checkEditItems.value[idx].realQty
    item.diff = item.realQty - item.systemQty
  })
  checkEditRow.value.status = '待处理'
  checkDialogVisible.value = false
}
function handleDiff(row: InventoryCheck) {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限处理盘点差异')
    return
  }
  if (row.status !== '待处理') return
  diffEditRow.value = row
  // 只展示有差异的明细
  diffEditItems.value = row.items.filter(item => item.diff !== 0)
  diffDialogVisible.value = true
}
function confirmDiffHandle() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限处理盘点差异')
    return
  }
  if (!diffEditRow.value) return
  // 差异处理：同步调整库存
  diffEditRow.value.items.forEach(item => {
    if (item.diff !== 0) {
      // 找到对应库存项
      const inv = allInventory.value.find(inv => inv.productId === item.productId && inv.warehouseId === item.warehouseId && inv.zone === item.zone && inv.location === item.location && inv.batch === item.batch)
      if (inv) {
        inv.quantity += item.diff
      }
    }
  })
  diffEditRow.value.status = '已完成'
  diffDialogVisible.value = false
}
function updateDiff(idx: number) {
  const item = checkEditItems.value[idx]
  item.diff = item.realQty - item.systemQty
}
</script>

<style scoped>
.inventory-check-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 400px;
}
.header-bar {
  margin-bottom: 16px;
  text-align: right;
}
</style>
