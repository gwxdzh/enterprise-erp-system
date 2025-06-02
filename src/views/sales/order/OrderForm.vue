<template>
  <el-dialog :title="isEdit ? '编辑订单' : '新建订单'" v-model="visible" width="1050px" @close="handleCancel">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="客户" prop="customerName">
        <el-select v-model="form.customerName" placeholder="请选择客户">
          <el-option v-for="c in customerOptions" :key="c.name" :label="c.name" :value="c.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="下单日期" prop="orderDate">
        <el-date-picker v-model="form.orderDate" type="date" placeholder="选择日期" style="width: 100%" />
      </el-form-item>
      <el-form-item label="商品明细" required>
        <el-table :data="form.items" border style="width: 100%; margin-bottom: 10px">
          <el-table-column prop="productName" label="商品名称" min-width="200">
            <template #default="scope">
              <el-select v-model="scope.row.productName" placeholder="请选择商品" @change="onProductChange(scope.row)">
                <el-option v-for="p in productOptions" :key="p.name" :label="p.name" :value="p.name" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" min-width="200">
            <template #default="scope">
              <el-input-number v-model="scope.row.quantity" :min="1" @change="updateAmount(scope.row)" />
            </template>
          </el-table-column>
          <el-table-column prop="price" label="单价" min-width="200">
            <template #default="scope">
              <el-input-number v-model="scope.row.price" :min="0" :step="0.01" @change="updateAmount(scope.row)" />
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" min-width="100">
            <template #default="scope">
              <span>￥{{ scope.row.amount.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="warehouseName" label="发货仓库" min-width="200">
            <template #default="scope">
              <el-select v-model="scope.row.warehouseId" placeholder="请选择仓库" @change="onWarehouseChange(scope.row)">
                <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="scope">
              <el-button type="danger" size="small" icon="el-icon-delete" @click="removeItem(scope.$index)" :disabled="form.items.length === 1">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="primary" size="small" @click="addItem">添加商品</el-button>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="备注" />
      </el-form-item>
      <el-form-item label="总金额">
        <span style="font-weight: bold; color: #409eff">￥{{ totalAmount.toFixed(2) }}</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { allCustomers } from '../../../stores/customerData'
import { allProducts } from '../../../stores/productData'
import { allSalesOrders, type SalesOrder, type SalesOrderItem } from '../../../stores/salesOrderData'
import { allWarehouses } from '../../../stores/warehouseData'
import { allInventory } from '../../../stores/inventoryData'

const props = defineProps({
  visible: Boolean,
  order: {
    type: Object as () => SalesOrder | null,
    default: null
  },
  isEdit: Boolean
})
const emit = defineEmits(['update:visible', 'refresh'])

const visible = ref(props.visible)
watch(
  () => props.visible,
  v => (visible.value = v)
)
watch(visible, v => emit('update:visible', v))

const customerOptions = computed(() => allCustomers.value)
const productOptions = computed(() => allProducts.value)
const warehouseOptions = computed(() => allWarehouses.value)

const form = ref<SalesOrder>({
  id: null,
  orderNo: '',
  customerId: null,
  customerName: '',
  orderDate: new Date().toISOString().split('T')[0], // 默认当前日期
  items: [{ productId: 0, productName: '', quantity: 1, price: 0, amount: 0, warehouseId: null }],
  totalAmount: 0,
  status: '草稿',
  remark: ''
})
const formRef = ref()
const rules = {
  customerName: [{ required: true, message: '请选择客户', trigger: 'change' }],
  orderDate: [{ required: true, message: '请选择下单日期', trigger: 'change' }]
}

// 总金额自动计算
const totalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (item.amount || 0), 0)
})
watch(
  () => form.value.items,
  () => {
    form.value.totalAmount = totalAmount.value
  },
  { deep: true }
)

function updateAmount(row: SalesOrderItem) {
  row.amount = (row.quantity || 0) * (row.price || 0)

  // 检查库存是否足够
  if (row.productId && row.warehouseId && row.quantity) {
    checkInventory(row)
  }
}

function addItem() {
  const shanghai = warehouseOptions.value.find(w => w.name === '上海总仓')
  form.value.items.push({
    productId: 0,
    productName: '',
    quantity: 1,
    price: 0,
    amount: 0,
    warehouseId: shanghai?.id || null,
    warehouseName: shanghai?.name || ''
  })
}
function removeItem(idx: number) {
  if (form.value.items.length > 1) {
    form.value.items.splice(idx, 1)
  }
}

function onProductChange(item: SalesOrderItem) {
  const product = productOptions.value.find(p => p.name === item.productName)
  if (product) {
    item.productId = product.id
    item.price = product.price
    updateAmount(item)
    // 默认仓库
    const shanghai = warehouseOptions.value.find(w => w.name === '上海总仓')
    item.warehouseId = shanghai?.id || null
    item.warehouseName = shanghai?.name || ''

    // 检查默认仓库中是否有该商品库存
    checkInventory(item)
  }
}

function onWarehouseChange(row: SalesOrderItem) {
  const warehouse = warehouseOptions.value.find(w => w.id === row.warehouseId)
  if (warehouse) {
    row.warehouseName = warehouse.name
    // 切换仓库时，检查新仓库中是否有该商品的库存
    if (row.productId) {
      checkInventory(row)
    }
  }
}

// 检查库存是否足够
function checkInventory(item: SalesOrderItem) {
  if (!item.productId || !item.warehouseId) return

  // 查找该商品在指定仓库的所有库存记录
  const inventoryItems = allInventory.value.filter(inv => inv.productId === item.productId && inv.warehouseId === item.warehouseId)

  // 检查该商品是否存在于仓库中
  if (inventoryItems.length === 0) {
    ElMessage.warning(`商品 ${item.productName} 在 ${item.warehouseName} 中不存在库存记录`)
    return false
  }

  // 汇总该商品在该仓库的总库存
  const totalStock = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0)

  // 检查库存是否足够
  if (totalStock < item.quantity) {
    ElMessage.warning(`商品 ${item.productName} 在 ${item.warehouseName} 的库存不足，当前库存: ${totalStock}, 需求数量: ${item.quantity}`)
    return false
  }

  return true
}

// 根据订单更新库存数量
function updateInventoryByOrder(order: SalesOrder, operation: 'decrease' | 'increase') {
  if (!order || !order.items || order.items.length === 0) return false

  // 遍历订单中的商品
  for (const item of order.items) {
    if (!item.productId || !item.warehouseId || !item.quantity) continue

    // 查找该商品在指定仓库的库存记录
    const inventoryItems = allInventory.value.filter(inv => inv.productId === item.productId && inv.warehouseId === item.warehouseId)

    // 如果库存不存在且是增加操作，创建新的库存记录
    if (inventoryItems.length === 0 && operation === 'increase') {
      // 获取商品和仓库信息
      const product = allProducts.value.find(p => p.id === item.productId)
      const warehouse = allWarehouses.value.find(w => w.id === item.warehouseId)

      if (product && warehouse) {
        // 创建新的库存记录
        const newInventoryId = Math.max(0, ...allInventory.value.map(inv => inv.id)) + 1
        allInventory.value.push({
          id: newInventoryId,
          productId: item.productId,
          productName: product.name,
          warehouseId: item.warehouseId,
          warehouseName: warehouse.name,
          zone: warehouse.zones[0]?.zone || '默认区',
          location: warehouse.locations[0]?.name || '默认位置',
          batch: `B${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          quantity: item.quantity,
          cost: product.price * item.quantity
        })
        continue // 已创建新库存，跳过后续处理
      } else {
        ElMessage.warning(`无法找到商品或仓库信息，无法更新库存`)
        return false
      }
    }

    // 库存不存在且是减少操作，无法执行
    if (inventoryItems.length === 0 && operation === 'decrease') {
      ElMessage.error(`商品 ${item.productName} 在 ${item.warehouseName} 中不存在库存记录，无法扣减库存`)
      return false
    }

    // 计算需要调整的库存数量总和
    let remainingQty = item.quantity

    // 遍历库存记录并更新数量
    for (const inv of inventoryItems) {
      if (remainingQty <= 0) break

      if (operation === 'decrease') {
        // 减少库存
        const deductQty = Math.min(inv.quantity, remainingQty)
        inv.quantity -= deductQty
        remainingQty -= deductQty

        // 如果库存数量为0，删除该记录
        if (inv.quantity === 0) {
          const deleteIndex = allInventory.value.findIndex(item => item.id === inv.id)
          if (deleteIndex !== -1) {
            allInventory.value.splice(deleteIndex, 1)
          }
        }
      } else {
        // 增加库存
        inv.quantity += remainingQty
        remainingQty = 0
        break
      }
    }

    // 如果还有剩余数量需要处理（针对减少操作）
    if (remainingQty > 0 && operation === 'decrease') {
      ElMessage.error(`商品 ${item.productName} 在 ${item.warehouseName} 的库存不足，无法完成扣减`)
      return false
    }
  }

  return true
}

function getNextOrderNo() {
  const maxId = Math.max(0, ...allSalesOrders.value.map(o => o.id || 0))
  const nextId = maxId + 1
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `SO${y}${m}${d}${String(nextId).padStart(3, '0')}`
}

// 格式化日期为 YYYY-MM-DD 格式
function formatDate(date: Date | string): string {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 重置表单为初始状态
function resetForm() {
  form.value = {
    id: null,
    orderNo: '',
    customerId: null,
    customerName: '',
    orderDate: formatDate(new Date()), // 重置为当前日期
    items: [{ productId: 0, productName: '', quantity: 1, price: 0, amount: 0, warehouseId: null }],
    totalAmount: 0,
    status: '草稿',
    remark: ''
  }

  // 为第一个商品项设置默认仓库
  const shanghai = warehouseOptions.value.find(w => w.name === '上海总仓')
  if (form.value.items[0] && shanghai) {
    form.value.items[0].warehouseId = shanghai.id
    form.value.items[0].warehouseName = shanghai.name
  }
}

function handleSubmit() {
  ;(formRef.value as any).validate((valid: boolean) => {
    if (!valid) return

    // 检查所有商品库存是否足够
    const allItemsValid = form.value.items.every(item => checkInventory(item))
    if (!allItemsValid) {
      return // 如果有库存不足的情况，不提交订单
    }

    // 格式化下单日期
    form.value.orderDate = formatDate(form.value.orderDate)

    if (props.isEdit && form.value.id != null) {
      // 编辑
      const idx = allSalesOrders.value.findIndex(o => o.id === form.value.id)
      if (idx !== -1) {
        const oldOrder = allSalesOrders.value[idx]
        const newOrder = JSON.parse(JSON.stringify(form.value))

        // 比较状态变化，判断是否需要更新库存
        if (oldOrder.status !== newOrder.status) {
          // 如果状态变成"已关闭"或"退货成功"，恢复库存
          if (newOrder.status === '已关闭' || newOrder.status === '退货成功') {
            updateInventoryByOrder(newOrder, 'increase')
          }
          // 如果从"已关闭"或"退货成功"变为其他状态，重新扣减库存
          else if (oldOrder.status === '已关闭' || oldOrder.status === '退货成功') {
            updateInventoryByOrder(newOrder, 'decrease')
          }
        }

        // 更新订单
        allSalesOrders.value[idx] = newOrder
        ElMessage.success('编辑订单成功')
      }
    } else {
      // 新增
      form.value.id = Math.max(0, ...allSalesOrders.value.map(o => o.id || 0)) + 1
      form.value.orderNo = getNextOrderNo()

      const newOrder = JSON.parse(JSON.stringify(form.value))
      allSalesOrders.value.push(newOrder)

      // 新增订单成功后扣减库存
      if (updateInventoryByOrder(newOrder, 'decrease')) {
        ElMessage.success('新增订单成功，库存已更新')
      } else {
        ElMessage.warning('新增订单成功，但库存更新失败')
      }

      // 新增成功后重置表单
      resetForm()
    }
    emit('update:visible', false)
    emit('refresh')
  })
}

function handleCancel() {
  emit('update:visible', false)

  // 如果是新增模式，取消时也重置表单
  if (!props.isEdit) {
    resetForm()
  }
}

// 编辑时回显
watch(
  () => props.order,
  val => {
    if (val) {
      Object.assign(form.value, JSON.parse(JSON.stringify(val)))
    } else {
      resetForm() // 使用封装的重置函数
    }
  },
  { immediate: true }
)
</script>

<script lang="ts">
export default {}
</script>

<style scoped></style>
