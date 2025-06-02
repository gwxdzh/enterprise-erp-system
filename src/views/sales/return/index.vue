<template>
  <div class="return-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="退货单号">
        <el-input v-model="searchReturnNo" placeholder="退货单号" clearable @keyup.enter="fetchReturns" />
      </el-form-item>
      <el-form-item label="客户">
        <el-input v-model="searchCustomer" placeholder="客户名称" clearable @keyup.enter="fetchReturns" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchStatus" placeholder="退货状态" clearable @change="fetchReturns" style="width: 120px">
          <el-option label="草稿" value="草稿" />
          <el-option label="待审核" value="待审核" />
          <el-option label="已审核" value="已审核" />
          <el-option label="已驳回" value="已驳回" />
          <el-option label="已关闭" value="已关闭" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchReturns">搜索</el-button>
        <el-button @click="handleReset" style="margin-left: 4px">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <div class="table-toolbar">
      <el-button type="primary" :disabled="!hasSalesEditPermission()" @click="openAddDialog">新建退货单</el-button>
    </div>

    <!-- 退货单表格 -->
    <el-table :data="returnList" border stripe style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="returnNo" label="退货单号" min-width="120" />
      <el-table-column prop="orderNo" label="原订单号" min-width="120" />
      <el-table-column prop="customerName" label="客户" min-width="150" />
      <el-table-column prop="returnDate" label="退货日期" min-width="120" />
      <el-table-column prop="totalAmount" label="总金额" min-width="100">
        <template #default="scope">
          <span>￥{{ scope.row.totalAmount.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="scope">
          <el-tag class="custom-status-tag" :style="`color: ${returnStatusColor(scope.row.status)}; border-color: ${returnStatusColor(scope.row.status)}; background: #fff;`" effect="plain">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openViewDialog(scope.row)">查看</el-button>
          <el-button v-if="scope.row.status === '草稿'" size="small" type="primary" :disabled="!hasSalesEditPermission()" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button v-if="scope.row.status === '待审核'" size="small" type="success" :disabled="!hasSalesEditPermission()" @click="handleAudit(scope.row)">审核</el-button>
          <el-button v-if="scope.row.status === '已审核'" size="small" type="warning" :disabled="!hasSalesEditPermission()" @click="handleClose(scope.row)">关闭</el-button>
          <el-button v-if="scope.row.status === '已审核'" size="small" type="primary" :disabled="!hasSalesEditPermission()" @click="handleFinish(scope.row)">完成</el-button>
          <el-button v-if="scope.row.status === '草稿'" size="small" type="danger" :disabled="!hasSalesEditPermission()" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="fetchReturns" />
    </div>

    <!-- 新建/编辑/详情弹窗 -->
    <ReturnForm v-model:visible="dialogVisible" :returnOrder="currentReturn" @refresh="fetchReturns" />
    <ReturnDetail v-model:visible="detailVisible" :returnOrder="detailReturn" />

    <!-- 审核弹窗 -->
    <el-dialog title="退货单审核" v-model="auditDialogVisible" width="500px">
      <el-descriptions :column="1" border v-if="auditTarget">
        <el-descriptions-item label="退货单号">{{ auditTarget.returnNo }}</el-descriptions-item>
        <el-descriptions-item label="原订单号">{{ auditTarget.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ auditTarget.customerName }}</el-descriptions-item>
        <el-descriptions-item label="退货日期">{{ auditTarget.returnDate }}</el-descriptions-item>
        <el-descriptions-item label="退货金额"
          ><span style="color: #f56c6c; font-weight: bold">￥{{ auditTarget.totalAmount.toFixed(2) }}</span></el-descriptions-item
        >
        <el-descriptions-item label="退货原因"
          ><span style="color: #f56c6c; font-weight: bold">{{ auditTarget.reason }}</span></el-descriptions-item
        >
      </el-descriptions>
      <el-radio-group v-model="auditResult" style="margin: 16px 0">
        <el-radio label="pass">审核通过</el-radio>
        <el-radio label="reject">审核驳回</el-radio>
      </el-radio-group>
      <el-form v-if="auditResult === 'reject'" label-width="80px">
        <el-form-item label="驳回原因">
          <el-select v-model="rejectReason" placeholder="请选择驳回原因" style="width: 100%">
            <el-option v-for="r in rejectReasonOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAudit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 关闭弹窗 -->
    <el-dialog title="确认关闭退货单" v-model="closeDialogVisible" width="400px">
      <div style="margin: 24px 0">确定要关闭该退货单吗？</div>
      <template #footer>
        <el-button @click="closeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmClose">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { allSalesReturns, type SalesReturn } from '../../../stores/salesReturnData'
import { allSalesOrders } from '../../../stores/salesOrderData'
import { allInventory } from '../../../stores/inventoryData'
import { allWarehouses, type Location } from '../../../stores/warehouseData'
import { useUserStore } from '../../../stores/user'
import { ElMessage } from 'element-plus'

// 使用异步组件导入
const ReturnForm = defineAsyncComponent(() => import('./ReturnForm.vue'))
const ReturnDetail = defineAsyncComponent(() => import('./ReturnDetail.vue'))

// 获取用户store
const userStore = useUserStore()

// 检查是否有销售编辑权限
const hasSalesEditPermission = () => {
  return userStore.hasPermission('sales:edit')
}

const returnList = ref<SalesReturn[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

const searchReturnNo = ref('')
const searchCustomer = ref('')
const searchStatus = ref('')

const multipleSelection = ref<SalesReturn[]>([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const currentReturn = ref<SalesReturn | undefined>()
const detailReturn = ref<SalesReturn | undefined>()

// 审核弹窗
const auditDialogVisible = ref(false)
const auditTarget = ref<SalesReturn | null>(null)
const auditResult = ref<'pass' | 'reject'>('pass')
const rejectReason = ref('')
const rejectReasonOptions = ['客户信息不符', '退货原因不成立', '超出退货时效', '其他']

// 关闭弹窗
const closeDialogVisible = ref(false)
const closeTarget = ref<SalesReturn | null>(null)

function fetchReturns() {
  let list = allSalesReturns.value
  if (searchReturnNo.value) {
    list = list.filter(item => item.returnNo.includes(searchReturnNo.value.trim()))
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
  returnList.value = list.slice(startIndex, endIndex)
}

function handleReset() {
  searchReturnNo.value = ''
  searchCustomer.value = ''
  searchStatus.value = ''
  currentPage.value = 1
  fetchReturns()
}

function handleSelectionChange(val: SalesReturn[]) {
  multipleSelection.value = val
}

function openAddDialog() {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限创建退货单')
    return
  }
  currentReturn.value = undefined
  dialogVisible.value = true
}

function openEditDialog(row: SalesReturn) {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限编辑退货单')
    return
  }
  currentReturn.value = row
  dialogVisible.value = true
}

function openViewDialog(row: SalesReturn) {
  detailReturn.value = row
  detailVisible.value = true
}

// 审核
function handleAudit(row: SalesReturn) {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限审核退货单')
    return
  }
  auditTarget.value = row
  auditResult.value = 'pass'
  rejectReason.value = ''
  auditDialogVisible.value = true
}
function confirmAudit() {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限审核退货单')
    return
  }
  if (!auditTarget.value) return
  const returnOrder = allSalesReturns.value.find(r => r.id === auditTarget.value!.id)
  const order = allSalesOrders.value.find(o => o.orderNo === auditTarget.value!.orderNo)
  if (auditResult.value === 'pass') {
    if (returnOrder) {
      returnOrder.status = '已审核'
    }
    if (order) {
      order.status = '退货待处理'
      order.remark = '退货审核通过，等待完成'
      order.returnStatus = 'APPLYING'
    }
  } else {
    if (returnOrder) {
      returnOrder.status = '已驳回'
      returnOrder.remark = rejectReason.value
    }
    if (order) {
      order.status = order.prevStatus || order.status
      order.remark = '退货被驳回'
      order.returnStatus = 'REJECTED'
    }
  }
  auditDialogVisible.value = false
  fetchReturns()
}

// 关闭
function handleClose(row: SalesReturn) {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限关闭退货单')
    return
  }
  closeTarget.value = row
  closeDialogVisible.value = true
}
function confirmClose() {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限关闭退货单')
    return
  }
  if (!closeTarget.value) return
  const returnOrder = allSalesReturns.value.find(r => r.id === closeTarget.value!.id)
  const order = allSalesOrders.value.find(o => o.orderNo === closeTarget.value!.orderNo)
  if (returnOrder) {
    returnOrder.status = '已关闭'
  }
  if (order) {
    order.status = order.prevStatus || order.status
    order.remark = '退货已关闭'
    order.returnStatus = 'CLOSED'
  }
  closeDialogVisible.value = false
  fetchReturns()
}

// 完成
function handleFinish(row: SalesReturn) {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限完成退货单')
    return
  }
  // 1. 将退回商品加回到原仓库的空闲容量位置
  const itemsUpdated = updateInventoryForReturn(row)

  if (!itemsUpdated) {
    ElMessage.error('退货商品入库失败，请检查仓库容量')
    return
  }

  // 2. 订单状态改为退货成功
  const order = allSalesOrders.value.find(o => o.orderNo === row.orderNo)
  if (order) {
    order.status = '退货成功'
    order.remark = '全部退货'
    order.returnStatus = 'SUCCESS'
    order.prevStatus = '退货待处理'
  }

  // 3. 更新退货单状态（假设需要保留记录，如果确实需要删除则保留原逻辑）
  const idx = allSalesReturns.value.findIndex(r => r.id === row.id)
  if (idx !== -1) allSalesReturns.value.splice(idx, 1)

  ElMessage.success('退货完成，商品已加回库存')
  fetchReturns()
}

// 处理退货商品入库
function updateInventoryForReturn(returnOrder: SalesReturn): boolean {
  if (!returnOrder || !returnOrder.items || returnOrder.items.length === 0) return false

  try {
    // 为每个退回的商品生成批次号（使用当前年月）
    const now = new Date()
    const batch = `B${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

    // 遍历退货单中的商品
    for (const item of returnOrder.items) {
      const { productId, productName, quantity, warehouseId, warehouseName } = item

      // 查找该仓库
      const warehouse = allWarehouses.value.find(w => w.id === warehouseId)
      if (!warehouse) {
        ElMessage.warning(`找不到仓库：${warehouseName}`)
        continue
      }

      // 查找该商品在该仓库的现有库存
      const existingInventory = allInventory.value.find(inv => inv.productId === productId && inv.warehouseId === warehouseId && inv.batch === batch)

      if (existingInventory) {
        // 如果已存在该商品库存，直接增加数量
        existingInventory.quantity += quantity
        existingInventory.cost += item.price * quantity // 更新成本
      } else {
        // 查找最适合存放的库位（有足够容量的库位）
        let suitableLocation: Location | undefined

        if (warehouse.zones && warehouse.zones.length > 0) {
          // 遍历仓库中的所有区域和库位
          for (const zoneInfo of warehouse.zones) {
            // 获取当前区域的所有库位
            const zoneLocations = warehouse.locations.filter(loc => loc.zone === zoneInfo.zone)

            // 按剩余容量从大到小排序
            zoneLocations.sort((a, b) => {
              const aUsed = allInventory.value.filter(inv => inv.warehouseId === warehouseId && inv.location === a.name).reduce((sum, inv) => sum + inv.quantity, 0)

              const bUsed = allInventory.value.filter(inv => inv.warehouseId === warehouseId && inv.location === b.name).reduce((sum, inv) => sum + inv.quantity, 0)

              const aRemaining = (a.capacity || 0) - aUsed
              const bRemaining = (b.capacity || 0) - bUsed

              return bRemaining - aRemaining // 从大到小排序
            })

            // 找到第一个有足够容量的库位
            suitableLocation = zoneLocations.find(loc => {
              const usedCapacity = allInventory.value.filter(inv => inv.warehouseId === warehouseId && inv.location === loc.name).reduce((sum, inv) => sum + inv.quantity, 0)

              return (loc.capacity || 0) - usedCapacity >= quantity
            })

            // 找到后跳出循环
            if (suitableLocation) break
          }
        }

        // 如果找不到合适的库位，使用第一个库位（可能会超出容量）
        if (!suitableLocation && warehouse.locations.length > 0) {
          suitableLocation = warehouse.locations[0]
          ElMessage.warning(`仓库 ${warehouseName} 中没有足够容量的库位，已放入 ${suitableLocation.name}，可能会超出容量限制`)
        }

        if (suitableLocation) {
          // 创建新库存记录
          const newInventoryId = Math.max(0, ...allInventory.value.map(inv => inv.id)) + 1
          allInventory.value.push({
            id: newInventoryId,
            productId,
            productName,
            warehouseId,
            warehouseName,
            zone: suitableLocation.zone,
            location: suitableLocation.name,
            batch,
            quantity,
            cost: item.price * quantity
          })
        } else {
          ElMessage.error(`仓库 ${warehouseName} 中没有可用库位`)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('更新库存时发生错误:', error)
    ElMessage.error('更新库存时发生错误')
    return false
  }
}

function handleDelete(row: SalesReturn) {
  if (!hasSalesEditPermission()) {
    ElMessage.warning('暂无权限删除退货单')
    return
  }

  // 原有代码...
}

function returnStatusColor(status: string) {
  switch (status) {
    case '草稿':
      return '#909399'
    case '待审核':
      return '#409EFF'
    case '已审核':
      return '#67C23A'
    case '已驳回':
      return '#F56C6C'
    case '已关闭':
      return '#909399'
    default:
      return '#909399'
  }
}

onMounted(() => {
  fetchReturns()
})
</script>

<style scoped>
.return-container {
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
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 15px;
  gap: 8px;
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
