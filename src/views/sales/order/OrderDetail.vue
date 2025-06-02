<template>
  <el-dialog :title="'订单详情'" :model-value="visible" width="800px" @close="handleClose" @update:model-value="emit('update:visible', $event)">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="订单编号">{{ order?.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="客户">{{ order?.customerName }}</el-descriptions-item>
      <el-descriptions-item label="下单日期">{{ order?.orderDate }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="orderStatusTagType(order?.status)">{{ order?.status }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item v-if="order?.remark" label="备注">{{ order?.remark }}</el-descriptions-item>
      <el-descriptions-item v-if="order?.returnStatus" label="退货状态">{{ returnStatusText(order?.returnStatus) }}</el-descriptions-item>
      <el-descriptions-item label="总金额" :span="2">
        <span style="font-weight: bold; color: #409eff">￥{{ order?.totalAmount?.toFixed(2) }}</span>
      </el-descriptions-item>
    </el-descriptions>
    <el-table :data="order?.items || []" border style="margin: 20px 0">
      <el-table-column prop="productName" label="商品名称" />
      <el-table-column prop="quantity" label="数量" />
      <el-table-column prop="price" label="单价" />
      <el-table-column prop="amount" label="金额" />
    </el-table>
    <!-- 操作按钮区 -->
    <div style="text-align: right">
      <el-button v-if="order?.status === '待审核'" type="primary" @click="handleAudit">审核</el-button>
      <el-button v-if="order?.status === '待发货' || order?.status === '部分发货'" type="warning" @click="deliverDialogVisible = true">发货</el-button>
      <el-button v-if="order?.status === '待收款'" type="success" @click="receiveDialogVisible = true">收款</el-button>
      <el-button v-if="order?.status === '待发货' || order?.status === '部分发货'" @click="emit('split', order)">拆分</el-button>
      <el-button v-if="order?.status === '草稿'" @click="emit('merge', order)">合并</el-button>
      <el-button @click="handleClose">关闭</el-button>
    </div>
    <!-- 发货弹窗 -->
    <DeliverDialog v-model:visible="deliverDialogVisible" :order="order" @refresh="emit('refresh')" />
    <!-- 收款弹窗 -->
    <ReceiveDialog v-model:visible="receiveDialogVisible" :order="order" @refresh="emit('refresh')" />
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import DeliverDialog from './DeliverDialog.vue'
import ReceiveDialog from './ReceiveDialog.vue'
import type { SalesOrder } from '@/stores/salesOrderData'
const props = defineProps<{ visible: boolean; order?: SalesOrder }>()
const emit = defineEmits(['update:visible', 'refresh', 'split', 'merge'])
const deliverDialogVisible = ref(false)
const receiveDialogVisible = ref(false)
function handleClose() {
  emit('update:visible', false)
}
function handleAudit() {
  emit('refresh')
  emit('update:visible', false)
}
function orderStatusTagType(status: string) {
  switch (status) {
    case '草稿':
      return 'info'
    case '待审核':
      return 'primary'
    case '待发货':
      return 'warning'
    case '部分发货':
      return 'warning'
    case '待收款':
      return 'success'
    case '已完成':
      return 'success'
    case '已关闭':
      return 'danger'
    default:
      return 'info'
  }
}
function returnStatusText(status) {
  switch (status) {
    case 'SUCCESS':
      return '全部退货成功'
    case 'PARTIAL':
      return '部分退货'
    case 'APPLYING':
      return '退货申请中'
    case 'REJECTED':
      return '退货被驳回'
    case 'NONE':
      return '无退货'
    default:
      return status || '-'
  }
}
</script>

<script lang="ts">
export default {}
</script>

<style scoped></style>
