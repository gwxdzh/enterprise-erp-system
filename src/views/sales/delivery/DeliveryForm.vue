<template>
  <el-dialog title="创建出库单" v-model="dialogVisible" width="800px" :before-close="handleClose">
    <el-form :model="formData" label-width="100px" ref="formRef">
      <el-form-item label="销售订单号">
        <el-select v-model="formData.orderNo" placeholder="选择销售订单" style="width: 100%">
          <el-option v-for="order in availableOrders" :key="order.orderNo" :label="`${order.orderNo} - ${order.customerName}`" :value="order.orderNo" />
        </el-select>
      </el-form-item>

      <el-form-item label="客户">
        <el-input v-model="formData.customerName" disabled />
      </el-form-item>

      <el-form-item label="出库日期">
        <el-date-picker v-model="formData.deliveryDate" type="date" placeholder="选择日期" style="width: 100%" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
      </el-form-item>

      <el-form-item label="操作人">
        <el-input v-model="formData.operator" />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="formData.remark" type="textarea" rows="3" />
      </el-form-item>

      <el-divider content-position="left">商品明细</el-divider>

      <el-table :data="formData.items" border style="width: 100%">
        <el-table-column prop="productName" label="商品名称" min-width="150" />
        <el-table-column prop="orderQty" label="订单数量" width="100" />
        <el-table-column prop="deliveryQty" label="出库数量" width="150">
          <template #default="scope">
            <el-input-number v-model="scope.row.deliveryQty" :min="0" :max="scope.row.orderQty" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="warehouseName" label="出库仓库" width="150">
          <template #default="scope">
            <el-select v-model="scope.row.warehouseId" placeholder="选择仓库" size="small">
              <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { allSalesOrders } from '../../../stores/salesOrderData'
import { allSalesDeliveries } from '../../../stores/salesDeliveryData'
import { allWarehouses } from '../../../stores/warehouseData'
import { useUserStore } from '../../../stores/user'

// 定义props和emits
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  order: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'refresh'])

// 用户store
const userStore = useUserStore()

// 对话框可见状态
const dialogVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val)
})

// 表单数据
const formData = reactive({
  deliveryNo: '',
  orderNo: '',
  customerName: '',
  deliveryDate: new Date().toISOString().split('T')[0],
  operator: userStore.userInfo?.realName || '',
  remark: '',
  items: []
})

// 表单引用
const formRef = ref()

// 获取可用的销售订单（待发货状态）
const availableOrders = computed(() => {
  return allSalesOrders.value.filter(order => order.status === '待发货' || order.status === '部分发货')
})

// 仓库列表
const warehouses = computed(() => allWarehouses.value)

// 监听订单号变化，自动填充客户信息和商品明细
watch(
  () => formData.orderNo,
  newVal => {
    if (newVal) {
      const selectedOrder = allSalesOrders.value.find(order => order.orderNo === newVal)
      if (selectedOrder) {
        formData.customerName = selectedOrder.customerName
        // 复制订单商品明细，添加出库数量字段
        formData.items = selectedOrder.items.map(item => ({
          ...item,
          deliveryQty: item.quantity, // 默认出库数量等于订单数量
          orderQty: item.quantity,
          warehouseId: item.warehouseId || null
        }))
      }
    } else {
      formData.customerName = ''
      formData.items = []
    }
  }
)

// 监听props.order变化，如果有值，则填充表单
watch(
  () => props.order,
  newVal => {
    if (newVal) {
      formData.orderNo = newVal.orderNo
      formData.customerName = newVal.customerName
      // 其他字段填充...
    }
  }
)

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  formData.deliveryNo = ''
  formData.orderNo = ''
  formData.customerName = ''
  formData.deliveryDate = new Date().toISOString().split('T')[0]
  formData.operator = userStore.userInfo?.realName || ''
  formData.remark = ''
  formData.items = []
}

// 提交表单
const handleSubmit = () => {
  // 表单验证
  if (!formData.orderNo) {
    ElMessage.warning('请选择销售订单')
    return
  }

  if (!formData.deliveryDate) {
    ElMessage.warning('请选择出库日期')
    return
  }

  if (!formData.operator) {
    ElMessage.warning('请填写操作人')
    return
  }

  // 检查是否有商品明细
  if (formData.items.length === 0) {
    ElMessage.warning('没有可出库的商品明细')
    return
  }

  // 检查是否选择了仓库
  const noWarehouse = formData.items.some(item => !item.warehouseId && item.deliveryQty > 0)
  if (noWarehouse) {
    ElMessage.warning('请为所有出库商品选择仓库')
    return
  }

  // 生成出库单号
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  formData.deliveryNo = `DO-${dateStr}-${String(allSalesDeliveries.value.length + 1).padStart(3, '0')}`

  // 创建新出库单
  const newDelivery = {
    id: allSalesDeliveries.value.length + 1,
    deliveryNo: formData.deliveryNo,
    orderNo: formData.orderNo,
    customerName: formData.customerName,
    deliveryDate: formData.deliveryDate,
    operator: formData.operator,
    remark: formData.remark,
    items: formData.items
      .filter(item => item.deliveryQty > 0)
      .map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.deliveryQty,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName || '未指定仓库'
      }))
  }

  // 添加到出库单列表
  allSalesDeliveries.value.push(newDelivery)

  // 更新销售订单状态
  const orderIndex = allSalesOrders.value.findIndex(order => order.orderNo === formData.orderNo)
  if (orderIndex !== -1) {
    // 检查是否所有商品都已完全出库
    const allItemsDelivered = formData.items.every(item => item.deliveryQty >= item.orderQty)

    if (allItemsDelivered) {
      allSalesOrders.value[orderIndex].status = '待收款'
    } else {
      allSalesOrders.value[orderIndex].status = '部分发货'
    }
  }

  ElMessage.success('出库单创建成功')
  emit('refresh')
  handleClose()
}

// 确保组件有默认导出
defineExpose({
  dialogVisible,
  formData
})
</script>

<style scoped>
.el-divider {
  margin: 16px 0;
}
</style>
