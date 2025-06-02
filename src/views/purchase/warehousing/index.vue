<template>
  <div class="warehousing-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item>
        <el-input v-model="searchOrderNo" placeholder="订单号" clearable @keyup.enter="fetchList" style="width: 180px" />
      </el-form-item>
      <el-form-item>
        <el-input v-model="searchSupplier" placeholder="供应商名称" clearable @keyup.enter="fetchList" style="width: 180px" />
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="searchDate" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" />
      </el-form-item>
      <el-form-item>
        <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 120px">
          <el-option label="待质检" value="待质检" />
          <el-option label="待入库" value="待入库" />
          <el-option label="已入库" value="已入库" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchList">搜索</el-button>
        <el-button @click="handleReset" style="margin-left: 4px">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="list" border stripe style="width: 100%">
      <el-table-column prop="orderNo" label="订单号" min-width="140">
        <template #default="scope">
          <el-link type="primary" @click="goToOrder(scope.row.orderNo)">{{ scope.row.orderNo }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="supplier" label="供应商" min-width="140">
        <template #default="scope">
          <el-link type="primary" @click="goToSupplier(scope.row.supplier)">{{ scope.row.supplier }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="warehousingDate" label="入库日期" min-width="120" />
      <el-table-column prop="warehousedQty" label="入库数量" min-width="100" />
      <el-table-column prop="amount" label="入库金额" min-width="120">
        <template #default="scope">
          {{ formatAmount(scope.row.amount) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === '已入库' ? 'success' : 'info'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="qcResult" label="质检结果" min-width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.qcResult === '合格'" type="success">合格</el-tag>
          <el-tag v-else-if="scope.row.qcResult === '不合格'" type="danger">不合格</el-tag>
          <el-tag v-else type="info">未质检</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="qcUser" label="质检员" min-width="100">
        <template #default="scope">
          {{ scope.row.qcUser || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openViewDialog(scope.row)">详情</el-button>
          <!-- 待入库状态，根据质检结果显示不同按钮 -->
          <template v-if="scope.row.status === '待入库'">
            <el-button size="small" type="primary" v-if="scope.row.qcResult !== '合格' && scope.row.qcResult !== '不合格'" :disabled="!hasPurchaseEditPermission()" @click="openQcDialog(scope.row)">质检</el-button>
            <el-button size="small" type="danger" v-if="scope.row.qcResult === '不合格'" :disabled="!hasPurchaseEditPermission()" @click="handleReturn(scope.row)">退货</el-button>
            <el-button size="small" type="success" v-if="scope.row.qcResult === '合格'" :disabled="!hasPurchaseEditPermission()" @click="openWarehousingDialog(scope.row)">入库</el-button>
          </template>
          <!-- 已入库状态只显示详情 -->
          <template v-if="scope.row.status === '已入库'">
            <!-- 仅查看按钮已在外层 -->
          </template>
          <!-- 已取消状态只显示详情 -->
          <template v-if="scope.row.status === '已取消'">
            <!-- 仅查看按钮已在外层 -->
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="fetchList" />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog title="入库详情" v-model="viewDialogVisible" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订单号">{{ viewData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ viewData.supplier }}</el-descriptions-item>
        <el-descriptions-item label="入库日期">{{ viewData.warehousingDate }}</el-descriptions-item>
        <el-descriptions-item label="入库数量">{{ viewData.warehousedQty }}</el-descriptions-item>
        <el-descriptions-item label="入库金额">{{ formatAmount(viewData.amount) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewData.status === '已入库' ? 'success' : 'info'">{{ viewData.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="质检结果">
          <el-tag v-if="viewData.qcResult === '合格'" type="success">合格</el-tag>
          <el-tag v-else-if="viewData.qcResult === '不合格'" type="danger">不合格</el-tag>
          <el-tag v-else type="info">未质检</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="质检员">{{ viewData.qcUser || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 质检弹窗 -->
    <el-dialog title="质检操作" v-model="qcDialogVisible" width="400px">
      <el-form label-width="80px">
        <el-form-item label="订单号">
          <el-input v-model="qcData.orderNo" disabled />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="qcData.supplier" disabled />
        </el-form-item>
        <el-form-item label="质检员">
          <el-input v-model="qcUser" placeholder="请输入质检员姓名" disabled />
        </el-form-item>
        <el-form-item label="质检结果">
          <el-radio-group v-model="qcResult">
            <el-radio label="合格">合格</el-radio>
            <el-radio label="不合格">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="qcDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleQcConfirm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 入库规划弹窗 -->
    <el-dialog title="入库规划" v-model="warehousingDialogVisible" width="1000px">
      <el-form :model="warehousingForm" label-width="100px">
        <el-form-item label="订单号">
          <el-input v-model="warehousingForm.orderNo" disabled />
        </el-form-item>

        <el-table :data="warehousingForm.items" border style="width: 100%; margin-bottom: 10px">
          <el-table-column prop="name" label="商品名称" min-width="120" />
          <el-table-column prop="spec" label="规格" min-width="100" />
          <el-table-column prop="qty" label="数量" min-width="80" />
          <el-table-column prop="warehouseId" label="入库仓库" min-width="140">
            <template #default="scope">
              <el-select v-model="scope.row.warehouseId" placeholder="选择仓库" @change="onWarehouseChange(scope.row)">
                <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="zone" label="仓库分区" min-width="140">
            <template #default="scope">
              <el-select v-model="scope.row.zone" placeholder="选择分区" @change="onZoneChange(scope.row)" :disabled="!scope.row.warehouseId">
                <el-option v-for="z in getZoneOptions(scope.row.warehouseId)" :key="z.zone" :label="z.name" :value="z.zone" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="库位" min-width="140">
            <template #default="scope">
              <el-select v-model="scope.row.location" placeholder="选择库位" :disabled="!scope.row.warehouseId || !scope.row.zone">
                <el-option v-for="l in getLocationOptions(scope.row.warehouseId, scope.row.zone, scope.row.qty)" :key="l.id" :label="l.name + ' (剩余容量: ' + getAvailableCapacity(l, scope.row.warehouseId) + ')'" :value="l.name" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>

        <el-form-item label="批次号">
          <el-input v-model="warehousingForm.batch" placeholder="请输入批次号，默认为当前年月">
            <template #append>
              <el-button @click="generateBatch">生成批次号</el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="warehousingForm.remark" type="textarea" placeholder="入库备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="warehousingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleWarehousingConfirm">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { allOrders, type Order, type OrderItem, type OrderStatus } from '../../../stores/orderData'
import { allWarehouses, type Warehouse, type Location, type WarehouseZone } from '../../../stores/warehouseData'
import { allInventory, type InventoryItem } from '../../../stores/inventoryData'
import { useUserStore } from '../../../stores/user'

const list = ref<Order[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const searchOrderNo = ref('')
const searchSupplier = ref('')
const searchDate = ref<[Date, Date] | null>(null)
const searchStatus = ref<OrderStatus | ''>('')

const viewDialogVisible = ref(false)
const viewData = reactive<Order>({ id: null, orderNo: '', supplier: '', orderDate: '', amount: 0, status: '待审核', items: [], warehousingDate: undefined, warehousedQty: undefined, qcResult: undefined, qcUser: undefined })

// 质检相关数据
const qcDialogVisible = ref(false)
const qcData = reactive<Order>({ id: null, orderNo: '', supplier: '', orderDate: '', amount: 0, status: '待审核', items: [], warehousingDate: undefined, warehousedQty: undefined, qcResult: '未质检', qcUser: undefined })
const qcResult = ref<'合格' | '不合格' | '未质检'>('合格')
const qcUser = ref('')

// 新增入库规划相关变量
const warehousingDialogVisible = ref(false)
const warehouseOptions = computed(() => allWarehouses.value)

interface WarehousingItem extends OrderItem {
  warehouseId?: number
  warehouseName?: string
  zone?: string
  location?: string
}

interface WarehousingFormData {
  orderId: number | null
  orderNo: string
  supplier: string
  items: WarehousingItem[]
  batch: string
  remark: string
}

const warehousingForm = reactive<WarehousingFormData>({
  orderId: null,
  orderNo: '',
  supplier: '',
  items: [],
  batch: '',
  remark: ''
})

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 检查是否有采购编辑权限
const hasPurchaseEditPermission = () => {
  return userStore.hasPermission('purchase:edit')
}

function shouldDisplayWarehousingOrder(order: Order): boolean {
  return order.status !== '关联退款' && order.status !== '待审核'
}

function fetchList() {
  const orderNoFromRoute = route.query.orderNo as string | undefined

  // 过滤出状态为 '待入库' 的订单
  let l = allOrders.value.filter(order => order.status === '待入库')

  if (searchOrderNo.value) {
    l = l.filter(item => item.orderNo.includes(searchOrderNo.value.trim()))
  }
  if (searchSupplier.value) {
    l = l.filter(item => item.supplier.includes(searchSupplier.value.trim()))
  }
  if (searchDate.value && searchDate.value.length === 2) {
    const [start, end] = searchDate.value
    l = l.filter(item => {
      const d = new Date(item.orderDate)
      d.setHours(0, 0, 0, 0)
      const s = new Date(start)
      s.setHours(0, 0, 0, 0)
      const e = new Date(end)
      e.setHours(0, 0, 0, 0)
      return d >= s && d <= e
    })
  }

  if (orderNoFromRoute) {
    l = l.filter(item => item.orderNo === orderNoFromRoute)
  }

  list.value = l
  total.value = l.length
}

function handleReset() {
  searchOrderNo.value = ''
  searchSupplier.value = ''
  searchDate.value = null
  searchStatus.value = ''
  fetchList()
}

function goToOrder(orderNo: string) {
  router.push({ path: '/purchase/order', query: { orderNo, showDetail: 1 } })
}

function goToSupplier(supplierName: string) {
  router.push({ path: '/purchase/supplier', query: { name: supplierName } })
}

function openViewDialog(row: Order) {
  Object.assign(viewData, row)
  viewDialogVisible.value = true
}

function openQcDialog(row: Order) {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限执行质检操作')
    return
  }

  Object.assign(qcData, row)
  qcResult.value = row.qcResult === '合格' || row.qcResult === '不合格' ? row.qcResult : '合格'
  qcUser.value = userStore.userInfo ? userStore.userInfo.realName : ''
  qcDialogVisible.value = true
}

function handleQcConfirm() {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限执行质检操作')
    return
  }

  const idx = allOrders.value.findIndex(item => item.id === qcData.id)
  if (idx > -1) {
    allOrders.value[idx].qcResult = qcResult.value
    allOrders.value[idx].qcUser = qcUser.value
  }
  qcDialogVisible.value = false
  fetchList()
}

function handleReturn(row: Order) {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限执行退货操作')
    return
  }

  ElMessageBox.confirm('确认对该订单进行退货处理吗？将跳转到采购退货页面。', '提示', { type: 'info' })
    .then(() => {
      router.push({ path: '/purchase/return', query: { orderNo: row.orderNo, returnAll: 1 } })
      ElMessage.success('即将跳转到采购退货页面')
    })
    .catch(() => {
      ElMessage.info('已取消退货操作')
    })
}

// 新增函数：打开入库规划弹窗
function openWarehousingDialog(row: Order) {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限执行入库操作')
    return
  }

  warehousingForm.orderId = row.id
  warehousingForm.orderNo = row.orderNo
  warehousingForm.supplier = row.supplier

  // 为每个商品项准备入库信息
  warehousingForm.items = row.items.map(item => ({
    ...item,
    warehouseId: undefined,
    warehouseName: '',
    zone: '',
    location: ''
  }))

  // 生成默认批次号
  generateBatch()

  warehousingDialogVisible.value = true
}

// 生成批次号，格式为 "B" + 当前年月
function generateBatch() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  warehousingForm.batch = `B${year}${month}`
}

// 根据仓库ID获取分区选项
function getZoneOptions(warehouseId: number | undefined): WarehouseZone[] {
  if (!warehouseId) return []
  const warehouse = allWarehouses.value.find(w => w.id === warehouseId)
  return warehouse ? warehouse.zones : []
}

// 仓库变更处理
function onWarehouseChange(item: WarehousingItem) {
  // 重置分区和库位
  item.zone = ''
  item.location = ''

  // 设置仓库名称
  const warehouse = allWarehouses.value.find(w => w.id === item.warehouseId)
  if (warehouse) {
    item.warehouseName = warehouse.name
  }
}

// 分区变更处理
function onZoneChange(item: WarehousingItem) {
  // 重置库位
  item.location = ''
}

// 根据仓库ID和分区获取库位选项，并过滤掉容量不足的库位
function getLocationOptions(warehouseId: number | undefined, zone: string | undefined, requiredCapacity: number): Location[] {
  if (!warehouseId || !zone) return []

  const warehouse = allWarehouses.value.find(w => w.id === warehouseId)
  if (!warehouse) return []

  return warehouse.locations
    .filter(loc => loc.zone === zone)
    .filter(loc => {
      const availableCapacity = getAvailableCapacity(loc, warehouseId)
      return availableCapacity >= requiredCapacity
    })
}

// 获取库位的可用容量
function getAvailableCapacity(location: Location, warehouseId: number): number {
  // 获取该库位的总容量
  const totalCapacity = location.capacity || 0

  // 计算该库位已用容量
  const usedCapacity = allInventory.value.filter(inv => inv.warehouseId === warehouseId && inv.location === location.name).reduce((sum, inv) => sum + inv.quantity, 0)

  return Math.max(0, totalCapacity - usedCapacity)
}

// 入库确认处理
function handleWarehousingConfirm() {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限执行入库操作')
    return
  }

  // 检查所有商品是否都选择了仓库、分区和库位
  const allItemsValid = warehousingForm.items.every(item => item.warehouseId && item.zone && item.location)

  if (!allItemsValid) {
    ElMessage.warning('请为所有商品选择完整的入库位置信息')
    return
  }

  // 确认入库
  ElMessageBox.confirm('确认按照当前规划方案入库吗？', '确认入库', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 1. 更新采购订单状态
      const orderToUpdate = allOrders.value.find(order => order.id === warehousingForm.orderId)
      if (orderToUpdate) {
        orderToUpdate.status = '待支付' // 入库后状态改为待支付
        orderToUpdate.warehousingDate = new Date().toISOString().slice(0, 10) // 记录入库日期
        orderToUpdate.warehousedQty = orderToUpdate.items.reduce((sum, item) => sum + item.qty, 0) // 入库数量

        // 设置应付账款相关字段
        orderToUpdate.paidAmount = 0 // 初始已付金额为 0
        orderToUpdate.unpaidAmount = orderToUpdate.amount // 初始未付金额等于订单总金额

        // 2. 更新库存信息
        const batch = warehousingForm.batch || `B${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`

        // 为每个商品创建库存记录
        warehousingForm.items.forEach(item => {
          if (!item.warehouseId || !item.zone || !item.location || !item.productId) return

          // 查找是否已有该商品在该位置的库存
          const existingInventory = allInventory.value.find(inv => inv.productId === item.productId && inv.warehouseId === item.warehouseId && inv.location === item.location && inv.batch === batch)

          if (existingInventory) {
            // 如果已有库存记录，则更新数量
            existingInventory.quantity += item.qty
            existingInventory.cost += (item.price || 0) * item.qty
          } else {
            // 如果没有库存记录，则创建新记录
            const newInventoryId = Math.max(0, ...allInventory.value.map(inv => inv.id)) + 1
            allInventory.value.push({
              id: newInventoryId,
              productId: item.productId,
              productName: item.name, // OrderItem中商品名称字段为name而非productName
              warehouseId: item.warehouseId,
              warehouseName: item.warehouseName || '',
              zone: item.zone,
              location: item.location,
              batch: batch,
              quantity: item.qty,
              cost: (item.price || 0) * item.qty
            })
          }
        })

        ElMessage.success(`订单 ${orderToUpdate.orderNo} 已成功入库，状态更新为待支付`)
        warehousingDialogVisible.value = false
        fetchList() // 刷新列表
      }
    })
    .catch(() => {
      ElMessage.info('已取消入库操作')
    })
}

function formatAmount(val: number | undefined) {
  if (val === undefined) return '¥0.00'
  const num = typeof val === 'number' ? val : Number(val)
  return `¥${num.toFixed(2)}`
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.warehousing-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.search-form {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.pagination {
  margin: 18px 0 0 0;
  text-align: right;
}
</style>
