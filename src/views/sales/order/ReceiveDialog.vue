<template>
  <el-dialog title="收款核销" v-model="visible" width="450px">
    <el-form :model="form" label-width="100px">
      <el-form-item label="订单编号">
        <el-input v-model="form.orderNo" disabled />
      </el-form-item>
      <el-form-item label="客户名称">
        <el-input v-model="form.customerName" disabled />
      </el-form-item>
      <el-form-item label="总金额">
        <el-input v-model="form.totalAmount" disabled>
          <template #prepend>￥</template>
        </el-input>
      </el-form-item>
      <el-form-item label="收款金额">
        <el-input-number v-model="form.receivedAmount" :min="0" :max="form.totalAmount" :precision="2" :step="10" style="width: 200px" />
      </el-form-item>
      <el-form-item label="收款方式">
        <el-select v-model="form.paymentMethod" placeholder="请选择收款方式" style="width: 200px">
          <el-option label="微信支付" value="微信支付" />
          <el-option label="支付宝" value="支付宝" />
          <el-option label="银行转账" value="银行转账" />
          <el-option label="现金" value="现金" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认收款</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { allSalesOrders, type SalesOrder } from '../../../stores/salesOrderData'

const props = defineProps<{
  visible: boolean
  orderData?: SalesOrder | null
}>()

const emit = defineEmits(['update:visible', 'success'])

const visible = ref(props.visible)
const form = ref({
  orderNo: '',
  customerName: '',
  totalAmount: 0,
  receivedAmount: 0,
  paymentMethod: '微信支付',
  remark: ''
})

watch(() => props.visible, val => {
  visible.value = val
})

watch(visible, val => {
  emit('update:visible', val)
})

watch(() => props.orderData, val => {
  if (val) {
    form.value = {
      orderNo: val.orderNo || '',
      customerName: val.customerName || '',
      totalAmount: val.totalAmount || 0,
      receivedAmount: val.totalAmount || 0,  // 默认收款全额
      paymentMethod: '微信支付',
      remark: ''
    }
  }
}, { immediate: true })

const handleCancel = () => {
  visible.value = false
}

const handleConfirm = () => {
  if (!form.value.receivedAmount) {
    ElMessage.warning('请输入收款金额')
    return
  }
  
  if (!form.value.paymentMethod) {
    ElMessage.warning('请选择收款方式')
    return
  }

  // 更新订单状态
  const order = allSalesOrders.value.find(o => o.orderNo === form.value.orderNo)
  if (order) {
    // 如果收款金额等于总金额，状态为已完成，否则保持待收款
    if (form.value.receivedAmount === form.value.totalAmount) {
      order.status = '已完成'
    }
    
    // 在实际应用中，还应该记录收款记录，更新订单的已收款金额等信息
    // 这里只是演示，所以简化处理
  }

  ElMessage.success('收款核销成功')
  visible.value = false
  emit('success')
}
</script>

<style scoped>
/* 收款弹窗样式 */
</style>
