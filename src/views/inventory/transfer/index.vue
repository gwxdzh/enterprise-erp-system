<template>
  <div class="transfer-container">
    <!-- 创建调拨按钮，表单未显示时可见 -->
    <div v-if="!showForm" style="margin-bottom: 16px; text-align: right">
      <el-button type="primary" :disabled="!hasInventoryEditPermission()" @click="showForm = true">创建调拨</el-button>
    </div>
    <!-- 调拨表单区域，默认隐藏 -->
    <div class="transfer-form-bar" v-show="showForm">
      <el-form :model="form" :inline="false" class="transfer-form" label-width="70px">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="调出仓库">
              <el-select v-model="form.fromWarehouseId" placeholder="请选择调出仓库" style="width: 150px">
                <el-option v-for="w in fromWarehouseOptions" :key="w.value" :label="w.label" :value="w.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="调入仓库">
              <el-select v-model="form.toWarehouseId" placeholder="请选择调入仓库" style="width: 150px">
                <el-option v-for="w in toWarehouseOptions" :key="w.value" :label="w.label" :value="w.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="原因">
              <el-select v-model="form.reason" placeholder="请选择或输入调拨原因" style="width: 180px" filterable allow-create default-first-option>
                <el-option v-for="item in reasonOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-table :data="form.details" border size="small" class="detail-table">
          <el-table-column label="商品" min-width="120">
            <template #default="scope">
              <el-select v-model="scope.row.productId" placeholder="请选择商品" filterable style="width: 140px">
                <el-option v-for="p in productOptions" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="批次" min-width="100">
            <template #default="scope">
              <el-select v-model="scope.row.batch" placeholder="批次号" style="width: 110px">
                <el-option v-for="b in batchOptions(scope.row.productId)" :key="b.value" :label="b.label" :value="b.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="数量" min-width="120">
            <template #default="scope">
              <el-input-number v-model="scope.row.quantity" :min="1" :max="99999" style="width: 120px" />
              <span v-if="scope.row.productId && scope.row.batch" style="color: #888; font-size: 12px; margin-left: 8px"> 剩余：{{ getRemainQty(scope.row) }} </span>
            </template>
          </el-table-column>
          <el-table-column v-if="form.details.length" label=" " min-width="90" align="right">
            <template #default="scope">
              <template v-if="scope.$index === form.details.length - 1">
                <el-tooltip content="添加明细" placement="top">
                  <el-button type="primary" circle size="small" @click="addDetail" class="add-row-btn">
                    <el-icon style="vertical-align: middle">
                      <Plus />
                    </el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="form.details.length > 1" content="删除明细" placement="top">
                  <el-button type="danger" circle size="small" @click="removeDetail(scope.$index)" class="add-row-btn" style="margin-left: 8px">
                    <el-icon style="vertical-align: middle">
                      <Minus />
                    </el-icon>
                  </el-button>
                </el-tooltip>
              </template>
            </template>
          </el-table-column>
        </el-table>
        <div class="detail-btns">
          <div class="right-btn">
            <el-button type="primary" size="default" @click="onCancel" style="margin-right: 8px">取消</el-button>
            <el-button type="primary" size="default" :disabled="!hasInventoryEditPermission()" @click="submitTransfer">提交调拨</el-button>
          </div>
        </div>
      </el-form>
    </div>
    <el-divider>调拨历史</el-divider>
    <el-table :data="pagedTransferList || []" border style="margin-bottom: 24px">
      <el-table-column prop="date" label="调拨日期" min-width="120" />
      <el-table-column prop="fromWarehouseName" label="调出仓库" min-width="100" />
      <el-table-column prop="toWarehouseName" label="调入仓库" min-width="100" />
      <el-table-column prop="reason" label="原因" min-width="120" />
      <el-table-column label="明细" min-width="200">
        <template #default="scope">
          <div v-for="(d, i) in scope.row.details" :key="i" style="font-size: 13px; margin-bottom: 2px">
            <span>{{ d.productName }} × {{ d.quantity }}（批次: {{ d.batch || '-' }}）</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="审批状态" min-width="100" />
      <el-table-column label="操作" min-width="200">
        <template #default="scope">
          <el-button v-if="scope.row.status === '待审批'" size="small" type="success" :disabled="!hasInventoryEditPermission()" @click="onApprove(scope.row)">审批通过</el-button>
          <el-button v-if="scope.row.status === '待审批'" size="small" type="danger" :disabled="!hasInventoryEditPermission()" @click="onReject(scope.row)">驳回</el-button>
          <el-button v-if="scope.row.status === '待执行'" size="small" type="primary" :disabled="!hasInventoryEditPermission()" @click="onExecute(scope.row)">执行调拨</el-button>
          <el-button v-if="scope.row.status === '已完成'" size="small" disabled>已完成</el-button>
          <el-button v-if="scope.row.status === '已驳回'" size="small" disabled>已驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination" style="margin-top: 16px; text-align: right">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="(allTransfers.value && allTransfers.value.length) || 0" :page-size="pageSize" v-model:current-page="currentPage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { allWarehouses } from '../../../stores/warehouseData'
import { allInventory } from '../../../stores/inventoryData'
import { allProducts } from '../../../stores/productData'
import { allTransfers, executeTransfer, type TransferOrder, type TransferDetail } from '../../../stores/transferData'
import { useUserStore } from '../../../stores/user'
import { ref as vueRef } from 'vue'

// 获取用户store
const userStore = useUserStore()

// 检查是否有库存编辑权限
const hasInventoryEditPermission = () => {
  return userStore.hasPermission('inventory:edit')
}

// 仓库下拉（互斥）
const warehouseOptions = computed(() => allWarehouses.value.map(w => ({ label: w.name, value: w.id })))
const fromWarehouseOptions = computed(() => allWarehouses.value.filter(w => w.id !== form.toWarehouseId).map(w => ({ label: w.name, value: w.id })))
const toWarehouseOptions = computed(() => allWarehouses.value.filter(w => w.id !== form.fromWarehouseId).map(w => ({ label: w.name, value: w.id })))

// 商品下拉（调出仓库选定后，显示该仓库有库存的商品）
const productOptions = computed(() => {
  if (!form.fromWarehouseId) return []
  const items = allInventory.value.filter(i => i.warehouseId === form.fromWarehouseId && i.quantity > 0)
  const unique = Array.from(new Set(items.map(i => i.productId)))
  return unique.map(pid => {
    const prod = allProducts.value.find(p => p.id === pid)
    return prod ? { label: prod.name, value: prod.id } : { label: pid + '', value: pid }
  })
})

// 批次下拉（调出仓库+商品选定后，显示该商品的所有批次）
function batchOptions(productId: number) {
  if (!form.fromWarehouseId || !productId) return []
  const items = allInventory.value.filter(i => i.warehouseId === form.fromWarehouseId && i.productId === productId && i.quantity > 0)
  return Array.from(new Set(items.map(i => i.batch))).map(b => ({ label: b, value: b }))
}

// 获取某明细的剩余库存
function getRemainQty(detail) {
  if (!form.fromWarehouseId || !detail.productId || !detail.batch) return ''
  const inv = allInventory.value.find(i => i.warehouseId === form.fromWarehouseId && i.productId === detail.productId && i.batch === detail.batch)
  // 只减去"待审批"和"待执行"状态的调拨单
  const allocated = allTransfers.value
    .filter(t => (t.status === '待审批' || t.status === '待执行') && t.fromWarehouseId === form.fromWarehouseId)
    .flatMap(t => t.details)
    .filter(item => item.productId === detail.productId && item.batch === detail.batch)
    .reduce((sum, item) => sum + item.quantity, 0)
  return inv ? inv.quantity - allocated : 0
}

const form = reactive({
  fromWarehouseId: undefined as number | undefined,
  toWarehouseId: undefined as number | undefined,
  reason: '',
  details: [{ productId: undefined as number | undefined, quantity: 1, batch: '' }]
})

// 常用调拨原因
const reasonOptions = ['库存均衡', '紧急补货', '临时调剂', '客户需求', '仓库调整', '其他']

function addDetail() {
  form.details.push({ productId: undefined, quantity: 1, batch: '' })
}
function removeDetail(idx: number) {
  if (form.details.length > 1) form.details.splice(idx, 1)
}

function resetForm() {
  form.fromWarehouseId = undefined
  form.toWarehouseId = undefined
  form.reason = ''
  form.details = [{ productId: undefined, quantity: 1, batch: '' }]
}

// 控制表单显示
const showForm = vueRef(false)

function onCancel() {
  showForm.value = false
  resetForm()
}

// 检查目标仓库容量
function checkTargetCapacity(details, toWarehouseId) {
  const warehouse = allWarehouses.value.find(w => w.id === toWarehouseId)
  if (!warehouse) return { ok: false, msg: '目标仓库不存在' }
  for (const detail of details) {
    // 找到有容量的库位
    const loc = warehouse.locations.find(l => (l.capacity ?? 0) - getLocationUsed(l, warehouse.id, l) >= detail.quantity)
    if (!loc) {
      // 计算所有库位剩余容量
      const remainArr = warehouse.locations.map(l => `${l.name}: ${(l.capacity ?? 0) - getLocationUsed(l, warehouse.id, l)}`)
      return { ok: false, msg: `目标仓库【${warehouse.name}】无足够容量存放商品【${detail.productName}】，各库位剩余容量：${remainArr.join('，')}` }
    }
  }
  return { ok: true }
}

// 修改提交调拨逻辑
function submitTransfer() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限创建库存调拨')
    return
  }

  // 校验
  if (!form.fromWarehouseId || !form.toWarehouseId) {
    ElMessage.warning('请选择调出/调入仓库')
    return
  }
  if (form.fromWarehouseId === form.toWarehouseId) {
    ElMessage.warning('调出仓库和调入仓库不能相同')
    return
  }
  if (!form.reason || !form.reason.trim()) {
    ElMessage.warning('请选择或输入调拨原因')
    return
  }
  for (const d of form.details) {
    if (!d.productId || !d.quantity || !d.batch) {
      ElMessage.warning('请填写完整商品明细')
      return
    }
    // 校验调出仓库有该商品/批次且库存足够
    const inv = allInventory.value.find(i => i.warehouseId === form.fromWarehouseId && i.productId === d.productId && i.batch === d.batch)
    // 只减去"待审批"和"待执行"状态的调拨单
    const allocated = allTransfers.value
      .filter(t => (t.status === '待审批' || t.status === '待执行') && t.fromWarehouseId === form.fromWarehouseId)
      .flatMap(t => t.details)
      .filter(item => item.productId === d.productId && item.batch === d.batch)
      .reduce((sum, item) => sum + item.quantity, 0)
    const remain = inv ? inv.quantity - allocated : 0
    if (!inv || remain < d.quantity) {
      ElMessage.error('调出仓库无足够库存：' + (allProducts.value.find(p => p.id === d.productId)?.name || d.productId) + ' 批次:' + d.batch + '，可用数量：' + remain)
      return
    }
  }
  // 校验调入仓库有足够容量（提前校验）
  const fromWarehouse = allWarehouses.value.find(w => w.id === form.fromWarehouseId)
  const toWarehouse = allWarehouses.value.find(w => w.id === form.toWarehouseId)
  if (!fromWarehouse || !toWarehouse) {
    ElMessage.error('仓库信息异常')
    return
  }
  const details = form.details.map(d => ({
    productId: d.productId!,
    productName: allProducts.value.find(p => p.id === d.productId)?.name || '',
    quantity: d.quantity,
    batch: d.batch
  }))
  const capCheck = checkTargetCapacity(details, toWarehouse.id)
  if (!capCheck.ok) {
    ElMessage.error(capCheck.msg)
    return
  }
  // 组装调拨单
  const order = {
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    fromWarehouseId: fromWarehouse.id,
    fromWarehouseName: fromWarehouse.name,
    toWarehouseId: toWarehouse.id,
    toWarehouseName: toWarehouse.name,
    reason: form.reason,
    status: '待审批',
    details
  }
  allTransfers.value.unshift(order)
  ElMessage.success('调拨申请已提交，待审批')
  resetForm()
}

function onApprove(row: TransferOrder) {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限审批库存调拨')
    return
  }

  row.status = '待执行'
  ElMessage.success('审批通过，可执行调拨')
}
function onReject(row: TransferOrder) {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限驳回库存调拨')
    return
  }

  row.status = '已驳回'
  ElMessage.warning('调拨单已驳回')
}
function onExecute(row: TransferOrder) {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限执行库存调拨')
    return
  }

  const msg = executeTransfer(row)
  if (msg.startsWith('调拨成功')) {
    ElMessage.success(msg)
  } else {
    ElMessage.error(msg)
  }
}

// getLocationUsed 增加 location 参数
function getLocationUsed(location, warehouseId, locObj) {
  // locObj 兼容传入 location 对象
  const zone = locObj?.zone || location.zone
  const name = locObj?.name || location.name
  return allInventory.value.filter(i => i.warehouseId === warehouseId && i.zone === zone && i.location === name).reduce((sum, i) => sum + i.quantity, 0)
}

const pageSize = 10
const currentPage = ref(1)
const pagedTransferList = computed(() => {
  if (!allTransfers.value) return []
  const start = (currentPage.value - 1) * pageSize
  return allTransfers.value.slice(start, start + pageSize)
})

function createTransfer() {
  // ... existing code ...
  allTransfers.value.unshift(newTransfer)
  currentPage.value = 1
  createDialogVisible.value = false
  // ...
}
</script>

<style scoped>
.transfer-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 400px;
  margin: 0 auto;
}
.transfer-form-bar {
  margin-bottom: 18px;
}
.transfer-form {
  width: 100%;
  background: #fafbfc;
  border-radius: 8px;
  padding: 18px 24px 10px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.detail-table {
  margin: 10px 0 0 0;
  background: #fff;
}
.detail-btns {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  margin-bottom: 0;
}
.right-btn {
  flex-shrink: 0;
}
.add-row-btn {
  vertical-align: middle;
  margin-left: 8px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);
  transition: box-shadow 0.2s;
}
.add-row-btn:hover {
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.18);
}
</style>
