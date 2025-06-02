<template>
  <el-dialog title="订单拆分" v-model="visible" width="600px" @close="handleCancel">
    <el-form>
      <el-table :data="order.items" border>
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="原订单数量" />
        <el-table-column label="拆分数量">
          <template #default="scope">
            <el-input-number v-model="splitQuantities[scope.$index]" :min="0" :max="scope.row.quantity" />
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSplit">确认拆分</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
const props = defineProps({ visible: Boolean, order: Object })
const emit = defineEmits(['update:visible', 'refresh'])
const visible = ref(props.visible)
const splitQuantities = ref<number[]>([])
watch(
  () => props.visible,
  v => (visible.value = v)
)
watch(
  () => props.order,
  val => {
    if (val && val.items) {
      splitQuantities.value = val.items.map((item: any) => 0)
    }
  },
  { immediate: true }
)
function handleSplit() {
  // 这里应提交拆分数据
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
