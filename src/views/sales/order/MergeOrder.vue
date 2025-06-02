<template>
  <el-dialog title="订单合并" v-model="visible" width="600px" @close="handleCancel">
    <el-form>
      <el-table :data="orders" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="orderNo" label="订单编号" />
        <el-table-column prop="customerName" label="客户" />
        <el-table-column prop="orderDate" label="下单日期" />
        <el-table-column prop="totalAmount" label="总金额" />
        <el-table-column prop="status" label="状态" />
      </el-table>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleMerge">确认合并</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
const props = defineProps({ visible: Boolean, orders: Array })
const emit = defineEmits(['update:visible', 'refresh'])
const visible = ref(props.visible)
const selectedOrders = ref<any[]>([])
function handleSelectionChange(val: any[]) {
  selectedOrders.value = val
}
function handleMerge() {
  // 这里应提交合并数据
  emit('update:visible', false)
  emit('refresh')
}
function handleCancel() {
  emit('update:visible', false)
}
</script>

<script lang="ts">
export default {}
</script>

<style scoped></style>
