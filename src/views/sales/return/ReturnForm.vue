<template>
  <el-dialog :title="isEdit ? '编辑退货单' : '新建退货单'" v-model="visible" width="600px">
    <el-form :model="form" label-width="90px" :rules="rules" ref="formRef">
      <el-form-item label="关联订单" prop="orderNo">
        <el-select v-model="form.orderNo" placeholder="请选择订单" :disabled="isEdit" filterable @change="handleOrderChange">
          <el-option v-for="order in orderOptions" :key="order.orderNo" :label="order.orderNo + ' - ' + order.customerName" :value="order.orderNo" />
        </el-select>
      </el-form-item>
      <el-form-item label="退货单号" prop="returnNo">
        <el-input v-model="form.returnNo" :disabled="true" />
      </el-form-item>
      <el-form-item label="客户" prop="customerName">
        <el-input v-model="form.customerName" disabled />
      </el-form-item>
      <el-form-item label="退货日期" prop="returnDate">
        <el-date-picker v-model="form.returnDate" type="date" style="width: 100%" />
      </el-form-item>
      <el-form-item label="退货商品">
        <el-table :data="form.items" border size="small">
          <el-table-column prop="productName" label="商品名称" />
          <el-table-column prop="quantity" label="数量" />
          <el-table-column prop="price" label="单价" />
          <el-table-column prop="amount" label="金额" />
        </el-table>
      </el-form-item>
      <el-form-item label="总金额">
        <el-input v-model="form.totalAmount" disabled />
      </el-form-item>
      <el-form-item label="原因" prop="reason">
        <el-select v-model="form.reason" placeholder="请选择或输入退货原因" filterable allow-create style="width: 100%">
          <el-option label="客户终止项目" value="客户终止项目" />
          <el-option label="商品不符" value="商品不符" />
          <el-option label="质量问题" value="质量问题" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" />
      </el-form-item>
      <el-form-item v-if="form.status === '已审核' && selectedOrder && selectedOrder.status === '已完成'" label="退款">
        <el-tag type="success">该订单可退款</el-tag>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { SalesReturn } from '@/stores/salesReturnData'
import { allSalesOrders, type SalesOrder } from '@/stores/salesOrderData'
import { allSalesReturns } from '@/stores/salesReturnData'
const props = defineProps<{ visible: boolean; returnOrder?: SalesReturn }>()
const emit = defineEmits(['update:visible', 'refresh'])
const visible = ref(props.visible)
watch(
  () => props.visible,
  v => (visible.value = v)
)
watch(visible, v => emit('update:visible', v))
const isEdit = computed(() => !!props.returnOrder)
const formRef = ref()
const orderOptions = computed(() => allSalesOrders.value.filter(o => ['待发货', '待收款', '已完成'].includes(o.status) && (!('returnStatus' in o) || o.returnStatus === 'NONE')))
const selectedOrder = ref<SalesOrder | null>(null)
function generateReturnNo() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const base = `SR${y}${m}${d}`
  // 简单序号生成
  const count = Math.floor(Math.random() * 90 + 10)
  return base + count
}
function getToday() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
const form = ref<SalesReturn>({
  id: props.returnOrder?.id || 0,
  returnNo: props.returnOrder?.returnNo || generateReturnNo(),
  orderNo: props.returnOrder?.orderNo || '',
  customerName: props.returnOrder?.customerName || '',
  returnDate: props.returnOrder?.returnDate || getToday(),
  items: props.returnOrder?.items ? JSON.parse(JSON.stringify(props.returnOrder.items)) : [],
  totalAmount: props.returnOrder?.totalAmount || 0,
  status: props.returnOrder?.status || '草稿',
  reason: props.returnOrder?.reason || '',
  remark: props.returnOrder?.remark || ''
})
watch(
  () => form.value.orderNo,
  orderNo => {
    if (!orderNo) return
    const order = allSalesOrders.value.find(o => o.orderNo === orderNo)
    if (order) {
      selectedOrder.value = order
      form.value.customerName = order.customerName
      form.value.items = order.items.map(i => ({
        productId: i.productId!,
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
        amount: i.amount,
        warehouseId: i.warehouseId!,
        warehouseName: i.warehouseName!
      }))
      form.value.totalAmount = order.totalAmount
    }
  }
)
function handleOrderChange(orderNo: string) {
  form.value.orderNo = orderNo
}
const rules = {
  orderNo: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
  returnNo: [{ required: true, message: '请输入退货单号', trigger: 'blur' }],
  returnDate: [{ required: true, message: '请选择退货日期', trigger: 'change' }],
  reason: [{ required: true, message: '请输入退货原因', trigger: 'blur' }]
}
function handleSubmit() {
  formRef.value.validate((valid: boolean) => {
    if (!valid) return
    // 更新订单状态
    const order = allSalesOrders.value.find(o => o.orderNo === form.value.orderNo)
    if (order) {
      order.prevStatus = order.status
      order.status = '退货待审核'
      order.remark = '退货申请中'
      order.returnStatus = 'APPLYING'
    }
    // 新增退货单
    const newId = allSalesReturns.value.length > 0 ? Math.max(...allSalesReturns.value.map(r => r.id)) + 1 : 1
    allSalesReturns.value.push({
      ...form.value,
      id: newId,
      status: '待审核'
    })
    emit('refresh')
    visible.value = false
  })
}
</script>
