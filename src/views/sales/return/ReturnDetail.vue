<template>
  <el-dialog title="退货单详情" v-model="visible" width="600px">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="退货单号">{{ order?.returnNo }}</el-descriptions-item>
      <el-descriptions-item label="原订单号">{{ order?.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="客户">{{ order?.customerName }}</el-descriptions-item>
      <el-descriptions-item label="退货日期">{{ order?.returnDate }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ order?.status }}</el-descriptions-item>
      <el-descriptions-item label="总金额">
        <span style="color: #F56C6C; font-weight: bold;">￥{{ order?.totalAmount.toFixed(2) }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="退货商品">
        <el-table :data="order?.items || []" border size="small">
          <el-table-column prop="productName" label="商品名称" />
          <el-table-column prop="quantity" label="数量" />
          <el-table-column prop="price" label="单价" />
          <el-table-column prop="amount" label="金额" />
        </el-table>
      </el-descriptions-item>
      <el-descriptions-item label="原因">
        <span style="color: #F56C6C; font-weight: bold;">{{ order?.reason }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="备注">{{ order?.remark }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SalesReturn } from '@/stores/salesReturnData'
const props = defineProps<{ visible: boolean, returnOrder?: SalesReturn }>()
const emit = defineEmits(['update:visible'])
const visible = ref(props.visible)
watch(() => props.visible, v => visible.value = v)
watch(visible, v => emit('update:visible', v))
const order = ref(props.returnOrder)
watch(() => props.returnOrder, v => order.value = v)
</script> 