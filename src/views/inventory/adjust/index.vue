<template>
  <div class="inventory-adjust-container">
    <div class="header-bar">
      <el-button type="primary" :disabled="!hasInventoryEditPermission()" @click="openDialog">新增库存调整</el-button>
    </div>
    <el-table :data="pagedAdjustList" border style="margin-bottom: 24px">
      <el-table-column prop="id" label="调整单号" min-width="120" />
      <el-table-column prop="date" label="调整日期" min-width="120" />
      <el-table-column prop="warehouseName" label="仓库" min-width="120" />
      <el-table-column prop="productName" label="商品名称" min-width="120" />
      <el-table-column prop="type" label="调整类型" min-width="100">
        <template #default="scope">
          <el-tag :type="scope.row.type === '报损' ? 'danger' : 'success'" disable-transitions>
            {{ scope.row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="调整数量" min-width="100" />
      <el-table-column prop="reason" label="调整原因" min-width="160" />
      <el-table-column prop="result" label="调整结果" min-width="160" />
      <el-table-column label="操作" min-width="100">
        <template #default="scope">
          <el-button size="small" @click="viewDetail(scope.row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination" style="margin-top: 16px; text-align: right">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="adjustList.length ? adjustList.length : 0" :page-size="pageSize" v-model:current-page="currentPage" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="库存调整" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="仓库">
          <el-select v-model="form.warehouseId" placeholder="请选择仓库">
            <el-option v-for="w in warehouseOptions" :key="w.value" :label="w.label" :value="w.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品">
          <el-select v-model="form.productId" placeholder="请选择商品" filterable>
            <el-option v-for="p in productOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio label="报损" />
            <el-radio label="报溢" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="form.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="form.reason" placeholder="请输入调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!hasInventoryEditPermission()" @click="submitAdjust">提交</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="调整详情" width="400px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="调整单号">{{ detailRow?.id }}</el-descriptions-item>
        <el-descriptions-item label="调整日期">{{ detailRow?.date }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detailRow?.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="商品">{{ detailRow?.productName }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="detailRow?.type === '报损' ? 'danger' : 'success'" disable-transitions>
            {{ detailRow?.type }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="数量">{{ detailRow?.quantity }}</el-descriptions-item>
        <el-descriptions-item label="原因">{{ detailRow?.reason }}</el-descriptions-item>
        <el-descriptions-item label="结果">{{ detailRow?.result }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { allInventory } from '../../../stores/inventoryData'
import { allWarehouses } from '../../../stores/warehouseData'
import { allInventoryAdjusts, type InventoryAdjustRecord } from '../../../stores/inventoryAdjustData'
import { useUserStore } from '../../../stores/user'

// 获取用户store
const userStore = useUserStore()

// 检查是否有库存编辑权限
const hasInventoryEditPermission = () => {
  return userStore.hasPermission('inventory:edit')
}

const adjustList = ref(allInventoryAdjusts)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const detailRow = ref<InventoryAdjustRecord | null>(null)

const form = reactive({
  warehouseId: undefined as number | undefined,
  productId: undefined as number | undefined,
  type: '报损' as '报损' | '报溢',
  quantity: 1,
  reason: ''
})

const warehouseOptions = computed(() => allWarehouses.value.map(w => ({ label: w.name, value: w.id })))
const productOptions = computed(() => {
  if (!form.warehouseId) return []
  // 只显示该仓库下有库存的商品
  const products = allInventory.value.filter(i => i.warehouseId === form.warehouseId)
  // 去重
  const map = new Map()
  products.forEach(i => {
    if (!map.has(i.productId)) {
      map.set(i.productId, i.productName)
    }
  })
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})

const pageSize = 10
const currentPage = ref(1)
const pagedAdjustList = computed(() => {
  if (!adjustList.value) return []
  const start = (currentPage.value - 1) * pageSize
  return adjustList.value.slice(start, start + pageSize)
})

function openDialog() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限进行库存调整')
    return
  }

  form.warehouseId = undefined
  form.productId = undefined
  form.type = '报损'
  form.quantity = 1
  form.reason = ''
  dialogVisible.value = true
}

function submitAdjust() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限进行库存调整')
    return
  }

  if (!form.warehouseId || !form.productId || !form.quantity || !form.type) {
    ElMessage.warning('请填写完整信息')
    return
  }
  // 获取商品库存项
  const inv = allInventory.value.find(i => i.warehouseId === form.warehouseId && i.productId === form.productId)
  if (!inv) {
    ElMessage.error('未找到该商品库存')
    return
  }
  let result = ''
  if (form.type === '报损') {
    if (inv.quantity < form.quantity) {
      ElMessage.error('报损数量不能大于现有库存')
      return
    }
    inv.quantity -= form.quantity
    result = `报损${form.quantity}，库存减少至${inv.quantity}`
  } else {
    inv.quantity += form.quantity
    result = `报溢${form.quantity}，库存增加至${inv.quantity}`
  }
  const warehouse = allWarehouses.value.find(w => w.id === form.warehouseId)
  const record: InventoryAdjustRecord = {
    id: Date.now(),
    date: formatDate(new Date()),
    warehouseId: form.warehouseId,
    warehouseName: warehouse?.name || '',
    productId: form.productId,
    productName: inv.productName,
    type: form.type,
    quantity: form.quantity,
    reason: form.reason,
    result
  }
  allInventoryAdjusts.value.unshift(record)
  adjustList.value = allInventoryAdjusts.value
  console.log(adjustList.value)
  currentPage.value = 1
  dialogVisible.value = false
  ElMessage.success('库存调整成功')
}

function viewDetail(row: InventoryAdjustRecord) {
  detailRow.value = row
  detailDialogVisible.value = true
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
</script>

<style scoped>
.inventory-adjust-container {
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
