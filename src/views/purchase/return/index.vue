<template>
  <div class="return-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="退货单号">
        <el-input v-model="searchReturnNo" placeholder="退货单号" clearable @keyup.enter="fetchList" style="width: 180px" />
      </el-form-item>
      <el-form-item label="关联订单号">
        <el-input v-model="searchOrderNo" placeholder="关联订单号" clearable @keyup.enter="fetchList" style="width: 180px" />
      </el-form-item>
      <el-form-item label="供应商">
        <el-input v-model="searchSupplier" placeholder="供应商名称" clearable @keyup.enter="fetchList" style="width: 180px" />
      </el-form-item>
      <el-form-item label="申请日期">
        <el-date-picker v-model="searchDate" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchStatus" placeholder="请选择状态" clearable style="width: 120px">
          <el-option label="待处理" value="待处理" />
          <el-option label="待审核" value="待审核" />
          <el-option label="已完成" value="已完成" />
          <el-option label="已取消" value="已取消" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchList">搜索</el-button>
        <el-button @click="handleReset" style="margin-left: 4px">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格操作栏 -->
    <div class="table-toolbar">
      <div class="toolbar-right">
        <el-button type="primary" :disabled="!hasPurchaseEditPermission()" @click="openAddDialog">新增退货申请</el-button>
      </div>
    </div>

    <!-- 采购退货表格 -->
    <el-table :data="returnList" border stripe style="width: 100%">
      <el-table-column prop="returnNo" label="退货单号" min-width="140" />
      <el-table-column prop="orderNo" label="关联订单号" min-width="140" />
      <el-table-column prop="supplier" label="供应商" min-width="140">
        <template #default="scope">
          <el-link type="primary" @click="goToSupplier(scope.row.supplier)">{{ scope.row.supplier }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="returnDate" label="申请日期" min-width="120" />
      <el-table-column prop="amount" label="退货总金额" min-width="100">
        <template #default="scope">
          {{ formatAmount(scope.row.amount) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="90">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openViewDialog(scope.row)">查看</el-button>
          <el-button size="small" type="primary" :disabled="(scope.row.status !== '待处理' && scope.row.status !== '待审核') || !hasPurchaseEditPermission()" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" :disabled="(scope.row.status !== '待处理' && scope.row.status !== '已取消') || !hasPurchaseEditPermission()" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="fetchList" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="850px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="退货单号" prop="returnNo">
          <el-input v-model="form.returnNo" disabled />
        </el-form-item>
        <el-form-item label="关联订单号" prop="orderNo">
          <el-select v-model="form.orderNo" placeholder="请选择关联的采购订单" @change="handleOrderSelect" :disabled="dialogTitle === '编辑退货申请'">
            <el-option v-for="order in availableOrders" :key="order.orderNo" :label="order.orderNo + ' (' + order.supplier + ')'" :value="order.orderNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="supplier">
          <el-input v-model="form.supplier" placeholder="请输入供应商名称" disabled />
        </el-form-item>
        <el-form-item label="申请日期" prop="returnDate">
          <el-date-picker v-model="form.returnDate" type="date" style="width: 100%" :disabled="dialogTitle === '编辑退货申请' && form.status !== '待处理'" />
        </el-form-item>
        <el-form-item label="申请人" prop="applicant">
          <el-input v-model="form.applicant" placeholder="请输入申请人姓名" :disabled="dialogTitle === '编辑退货申请' && form.status !== '待处理'" />
        </el-form-item>
        <el-form-item label="退货原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" placeholder="请输入退货原因" :disabled="dialogTitle === '编辑退货申请' && form.status !== '待处理'" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" disabled>
            <el-option label="待处理" value="待处理" />
            <el-option label="待审核" value="待审核" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>

        <el-form-item label="退货商品">
          <el-table :data="form.items" style="width: 100%" size="small" border>
            <el-table-column prop="name" label="商品名称" min-width="120" />
            <el-table-column prop="spec" label="规格" min-width="80" />
            <el-table-column prop="unit" label="单位" min-width="60" />
            <el-table-column prop="qty" label="数量" min-width="80">
              <template #default="scope">
                <el-input v-model.number="scope.row.qty" placeholder="数量" type="number" min="1" :disabled="dialogTitle === '编辑退货申请' && form.status !== '待处理'" />
              </template>
            </el-table-column>
            <el-table-column prop="price" label="单价" min-width="80" />
            <el-table-column label="小计" min-width="80">
              <template #default="scope">
                {{ (scope.row.qty * scope.row.price).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="danger" size="small" @click="removeItem(scope.$index)" :disabled="dialogTitle === '编辑退货申请' && form.status !== '待处理'">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item label="退货总金额">
          <span style="font-weight: bold; color: #409eff">{{ formatAmount(totalAmount) }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="(form.status !== '待处理' && form.status !== '待审核') || !hasPurchaseEditPermission()" @click="handleSubmit">保存</el-button>
        <el-button type="success" :disabled="!hasPurchaseEditPermission()" @click="handleAudit" v-if="dialogTitle === '编辑退货申请' && form.status === '待审核'">审核通过</el-button>
        <el-button type="warning" :disabled="!hasPurchaseEditPermission()" @click="handleProcess" v-if="dialogTitle === '编辑退货申请' && form.status === '已完成'">处理完成</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 (显示 PurchaseReturn 类型数据) -->
    <el-dialog title="退货详情" v-model="viewDialogVisible" width="850px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="退货单号" label-width="120px">{{ viewData.returnNo }}</el-descriptions-item>
        <el-descriptions-item label="关联订单号" label-width="120px">{{ viewData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商" label-width="120px">{{ viewData.supplier }}</el-descriptions-item>
        <el-descriptions-item label="申请日期" label-width="120px">{{ viewData.returnDate }}</el-descriptions-item>
        <el-descriptions-item label="申请人" label-width="120px">{{ viewData.applicant }}</el-descriptions-item>
        <el-descriptions-item label="退货原因" label-width="120px">
          <span style="color: red; font-weight: bold">{{ viewData.reason }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态" label-width="120px">
          <el-tag :type="statusTagType(viewData.status)">{{ viewData.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核人" label-width="120px">{{ viewData.auditUser || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理人" label-width="120px">{{ viewData.processUser || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理日期" label-width="120px">{{ viewData.processDate || '-' }}</el-descriptions-item>

        <el-descriptions-item label="退货商品" label-width="120px">
          <el-table :data="viewData.items" style="width: 100%" size="small" border>
            <el-table-column prop="name" label="商品名称" min-width="120" />
            <el-table-column prop="spec" label="规格" min-width="80" />
            <el-table-column prop="unit" label="单位" min-width="60" />
            <el-table-column prop="qty" label="退货数量" min-width="70" />
            <el-table-column prop="price" label="单价" min-width="80" />
            <el-table-column label="小计" min-width="80">
              <template #default="scope">
                {{ (scope.row.qty * scope.row.price).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </el-descriptions-item>
        <el-descriptions-item label="退货总金额" label-width="120px">
          <span style="color: red; font-weight: bold">{{ formatAmount(viewData.amount) }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { allOrders, type Order, type OrderItem } from '../../../stores/orderData' // 导入 allOrders 和 Order 类型
import { allReturns, type PurchaseReturn, type PurchaseReturnItem } from '../../../stores/returnData' // 导入 allReturns and PurchaseReturn 类型
import { allSuppliers, type Supplier } from '../../../stores/supplierData' // 导入 allSuppliers 和 Supplier 类型
import { useUserStore } from '../../../stores/user'

// 获取用户store
const userStore = useUserStore()

// 检查是否有采购编辑权限
const hasPurchaseEditPermission = () => {
  return userStore.hasPermission('purchase:edit')
}

// 列表数据和分页
const returnList = ref<PurchaseReturn[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// 搜索表单
const searchReturnNo = ref('')
const searchOrderNo = ref('')
const searchSupplier = ref('')
const searchDate = ref<[Date, Date] | null>(null)
const searchStatus = ref('')

// 新增/编辑弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive<PurchaseReturn>({
  id: null,
  returnNo: generateReturnNo(), // 生成退货单号
  orderNo: '',
  supplier: '',
  returnDate: '',
  status: '待处理',
  items: [],
  amount: 0,
  applicant: '',
  reason: '',
  auditUser: undefined,
  processUser: undefined,
  processDate: undefined
})

const formRef = ref()
const rules = {
  orderNo: [{ required: true, message: '请选择关联的采购订单', trigger: 'change' }],
  returnDate: [{ required: true, message: '请选择申请日期', trigger: 'change' }],
  applicant: [{ required: true, message: '请输入申请人', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入退货原因', trigger: 'blur' }]
}

// 详情弹窗
const viewDialogVisible = ref(false)
const viewData = reactive<PurchaseReturn>({ id: null, returnNo: '', orderNo: '', supplier: '', returnDate: '', status: '待处理', items: [], amount: 0, applicant: '', reason: '', auditUser: undefined, processUser: undefined, processDate: undefined })

// 路由
const router = useRouter()
const route = useRoute()

// 可关联的采购订单列表 (已入库或待付款)
const availableOrders = computed(() => {
  return allOrders.value.filter(order => order.status === '已入库' || order.status === '待付款')
})

// 计算退货总金额
const totalAmount = computed(() => {
  return (form.items || []).reduce((sum, item) => sum + item.qty * item.price, 0)
})

// 监听 items 变化，更新 totalAmount
watch(
  () => form.items,
  () => {
    calculateTotalAmount()
  },
  { deep: true }
)

// 生成退货单号
function generateReturnNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hour = now.getHours().toString().padStart(2, '0')
  const minute = now.getMinutes().toString().padStart(2, '0')
  const second = now.getSeconds().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `RT${year}${month}${day}${hour}${minute}${second}${random}`
}

// 获取列表数据
function fetchList() {
  let list: PurchaseReturn[] = JSON.parse(JSON.stringify(allReturns.value))

  if (searchReturnNo.value) {
    list = list.filter(item => item.returnNo.includes(searchReturnNo.value.trim()))
  }
  if (searchOrderNo.value) {
    list = list.filter(item => item.orderNo.includes(searchOrderNo.value.trim()))
  }
  if (searchSupplier.value) {
    list = list.filter(item => item.supplier.includes(searchSupplier.value.trim()))
  }
  if (searchDate.value && searchDate.value.length === 2) {
    const [start, end] = searchDate.value
    list = list.filter(item => {
      const itemDate = new Date(item.returnDate)
      return itemDate >= start && itemDate <= end
    })
  }
  if (searchStatus.value) {
    list = list.filter(item => item.status === searchStatus.value)
  }

  total.value = list.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  returnList.value = list.slice(start, end)
}

// 重置搜索
function handleReset() {
  searchReturnNo.value = ''
  searchOrderNo.value = ''
  searchSupplier.value = ''
  searchDate.value = null
  searchStatus.value = '' // 显式赋值空字符串
  currentPage.value = 1
  fetchList()
}

// 打开新增弹窗
function openAddDialog() {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限创建退货申请')
    return
  }

  dialogTitle.value = '新增退货申请'
  // 重置表单
  Object.assign(form, {
    id: null,
    returnNo: generateReturnNo(), // 生成新的退货单号
    orderNo: '',
    supplier: '',
    returnDate: '',
    status: '待处理',
    items: [],
    amount: 0,
    applicant: '',
    reason: '',
    auditUser: undefined,
    processUser: undefined,
    processDate: undefined
  })
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 打开编辑弹窗
function openEditDialog(row: PurchaseReturn) {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限编辑退货申请')
    return
  }

  dialogTitle.value = '编辑退货申请'
  Object.assign(form, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}

// 打开详情弹窗
function openViewDialog(row: PurchaseReturn) {
  Object.assign(viewData, JSON.parse(JSON.stringify(row)))
  viewDialogVisible.value = true
}

// 处理关联订单选择
function handleOrderSelect(orderNo: string) {
  const selectedOrder = availableOrders.value.find(order => order.orderNo === orderNo)
  if (selectedOrder) {
    form.supplier = selectedOrder.supplier
    // 复制订单商品到退货商品，并初始化退货数量和单价
    form.items = selectedOrder.items.map(item => ({
      ...item,
      qty: item.qty // 初始化退货数量为订单数量
      // price: item.price // 退货单价使用原订单单价
    }))
    calculateTotalAmount() // 计算总金额
  } else {
    form.supplier = ''
    form.items = []
    form.amount = 0
  }
}

// 移除退货商品行
function removeItem(index: number) {
  form.items.splice(index, 1)
  calculateTotalAmount() // 计算总金额
}

// 计算退货总金额
function calculateTotalAmount() {
  form.amount = form.items.reduce((sum, item) => sum + item.qty * item.price, 0)
}

// 提交保存
function handleSubmit() {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限提交退货申请')
    return
  }

  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (form.id === null) {
        // 新增
        form.id = allReturns.value.length > 0 ? Math.max(...allReturns.value.map(r => r.id || 0)) + 1 : 1
        allReturns.value.push(JSON.parse(JSON.stringify(form)))
        ElMessage.success('新增退货申请成功！')
      } else {
        // 编辑
        const index = allReturns.value.findIndex(r => r.id === form.id)
        if (index !== -1) {
          Object.assign(allReturns.value[index], JSON.parse(JSON.stringify(form)))
          ElMessage.success('更新退货申请成功！')
        }
      }
      dialogVisible.value = false
      fetchList()
    } else {
      console.log('表单验证失败')
      return false
    }
  })
}

// 处理删除
function handleDelete(row: PurchaseReturn) {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限删除退货申请')
    return
  }

  ElMessageBox.confirm(`确定删除退货单号为 ${row.returnNo} 的退货申请吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = allReturns.value.findIndex(r => r.id === row.id)
      if (index !== -1) {
        allReturns.value.splice(index, 1)
        ElMessage.success('删除成功！')
        fetchList()
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 处理审核通过
function handleAudit() {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限审核退货申请')
    return
  }

  ElMessageBox.confirm(`确定审核通过退货单号为 ${form.returnNo} 的退货申请吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      form.status = '已完成' // 简化流程，直接到已完成
      form.auditUser = '当前用户' // TODO: 获取当前登录用户
      handleSubmit()
      ElMessage.success('审核通过！')
    })
    .catch(() => {
      ElMessage.info('已取消审核')
    })
}

// 处理处理完成
function handleProcess() {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限处理退货申请')
    return
  }

  ElMessageBox.confirm(`确定处理完成退货单号为 ${form.returnNo} 的退货申请吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      form.processUser = '当前用户' // TODO: 获取当前登录用户
      form.processDate = new Date().toISOString().slice(0, 10) // 记录处理日期
      handleSubmit()
      ElMessage.success('处理完成！')
    })
    .catch(() => {
      ElMessage.info('已取消处理')
    })
}

// 根据状态返回标签类型
function statusTagType(status: string) {
  switch (status) {
    case '待处理':
      return 'info'
    case '待审核':
      return 'warning'
    case '已完成':
      return 'success'
    case '已取消':
      return 'danger'
    default:
      return 'info'
  }
}

// 格式化金额
function formatAmount(amount: number | undefined) {
  return amount !== undefined ? `¥${amount.toFixed(2)}` : '¥0.00'
}

// 跳转到供应商详情
function goToSupplier(supplierName: string) {
  const supplier = allSuppliers.value.find(s => s.name === supplierName)
  if (supplier) {
    router.push({
      path: '/purchase/supplier',
      query: { name: supplierName } // 传递供应商名称作为查询参数
    })
  } else {
    ElMessage.warning(`未找到供应商 ${supplierName} 的信息。`)
  }
}

// 监听路由变化，用于从供应商页面跳转回来时加载数据 (如果需要)
// watch(() => route.query.name, (newName) => {
//   if (newName) {
//     // 根据供应商名称加载相关退货数据或进行其他操作
//     console.log('从供应商页面跳转回来，供应商名称:', newName);
//     // 例如：fetchList({ supplier: newName });
//   }
// });

// 页面加载时获取数据
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.return-container {
  padding: 20px;
}

.search-form el-form-item {
  margin-bottom: 10px;
  margin-right: 10px;
}

.table-toolbar {
  margin-bottom: 15px;
}

.pagination {
  margin-top: 15px;
  text-align: right;
}

.el-form-item__content > .el-select,
.el-form-item__content > .el-input,
.el-form-item__content > .el-textarea {
  width: 100%;
}
</style>
