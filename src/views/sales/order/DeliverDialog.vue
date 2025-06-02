<template>
  <el-dialog title="发货" v-model="visible" width="500px" @close="handleCancel">
    <el-form>
      <el-table :data="order.items" border>
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="订单数量" />
        <el-table-column label="本次发货">
          <template #default="scope">
            <el-input-number v-model="deliverQuantities[scope.$index]" :min="0" :max="scope.row.quantity" />
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleDeliver">确认发货</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
const props = defineProps({ visible: Boolean, order: Object })
const emit = defineEmits(['update:visible', 'refresh'])
const visible = ref(props.visible)
const deliverQuantities = ref<number[]>([])
watch(
  () => props.visible,
  v => (visible.value = v)
)
watch(
  () => props.order,
  val => {
    if (val && val.items) {
      deliverQuantities.value = val.items.map((item: any) => item.quantity)
    }
  },
  { immediate: true }
)
function handleDeliver() {
  // 这里应提交发货数据
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
