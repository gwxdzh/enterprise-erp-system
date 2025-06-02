<template>
  <div class="order-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="订单号">
        <el-input v-model="searchOrderNo" placeholder="订单号" clearable @keyup.enter="fetchOrders" style="width: 180px" />
      </el-form-item>
      <el-form-item label="供应商">
        <el-select v-model="searchSupplier" placeholder="选择供应商" clearable filterable @change="fetchOrders" style="width: 180px">
          <el-option v-for="supplier in allSuppliers" :key="supplier.id" :label="supplier.name" :value="supplier.name"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchStatus" placeholder="选择状态" clearable @change="fetchOrders" style="width: 120px">
          <el-option label="待审核" value="待审核" />
          <el-option label="待入库" value="待入库" />
          <el-option label="待支付" value="待支付" />
          <el-option label="已入库" value="已入库" />
          <el-option label="已取消" value="已取消" />
        </el-select>
      </el-form-item>
      <el-form-item label="下单日期">
        <el-date-picker v-model="searchDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" @change="fetchOrders" style="width: 260px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchOrders">搜索</el-button>
        <el-button @click="handleReset" style="margin-left: 4px">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格操作栏 -->
    <div class="table-toolbar">
      <el-button type="danger" :disabled="multipleSelection.length === 0" @click="handleBatchDelete">批量删除</el-button>
      <div class="toolbar-right">
        <el-button type="primary" @click="openAddDialog">新增采购订单</el-button>
      </div>
    </div>

    <!-- 采购订单表格 -->
    <el-table :data="orderList" border stripe style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="orderNo" label="订单号" min-width="140" />
      <el-table-column prop="supplier" label="供应商" min-width="140">
        <template #default="scope">
          <el-link type="primary" @click="goToSupplier(scope.row.supplier)">{{ scope.row.supplier }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="orderDate" label="下单日期" min-width="120">
        <template #default="scope">
          {{ formatDate(scope.row.orderDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="订单金额" min-width="100">
        <template #default="scope">
          {{ formatAmount(scope.row.amount) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openViewDialog(scope.row)">查看</el-button>
          <!-- 仅在待审核状态显示编辑、审核、取消按钮 -->
          <template v-if="scope.row.status === '待审核'">
            <el-button size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleApprove(scope.row)">审核</el-button>
            <el-button size="small" type="danger" @click="handleCancel(scope.row)">取消</el-button>
          </template>
          <!-- 仅在待入库状态显示入库按钮 -->
          <template v-else-if="scope.row.status === '待入库'">
            <el-button size="small" type="warning" @click="handleWarehousing(scope.row)">入库</el-button>
          </template>
          <!-- 仅在待付款状态显示付款按钮 -->
          <template v-else-if="scope.row.status === '待付款'">
            <el-button size="small" type="success" @click="handlePayment(scope.row)">付款</el-button>
          </template>
          <!-- 其他状态，如已完成、已取消、关联退款等，仅显示查看按钮（已在最前面） -->
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="fetchOrders" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="850px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="订单号" prop="orderNo">
          <el-input v-model="form.orderNo" disabled />
        </el-form-item>
        <el-form-item label="供应商分类" prop="supplierCategoryId">
          <el-cascader
            v-model="form.supplierCategoryId"
            :options="supplierCategoryOptions"
            :props="{ checkStrictly: true, label: 'name', value: 'id', emitPath: false }"
            placeholder="请选择供应商分类"
            clearable
            style="width: 100%"
            @change="handleSupplierCategoryChange"
            :disabled="dialogTitle === '编辑采购订单'"
          />
        </el-form-item>
        <el-form-item label="供应商" prop="supplier">
          <el-select v-model="form.supplier" placeholder="请选择供应商" filterable :disabled="dialogTitle === '编辑采购订单'" style="width: 100%">
            <el-option v-for="supplier in filteredSuppliers" :key="supplier.id" :label="supplier.name" :value="supplier.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单日期" prop="orderDate">
          <el-date-picker v-model="form.orderDate" type="date" style="width: 100%" :disabled="dialogTitle === '编辑采购订单' && form.status !== '待审核'" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" disabled>
            <el-option label="待审核" value="待审核" />
            <el-option label="待入库" value="待入库" />
            <el-option label="待付款" value="待付款" />
            <el-option label="已入库" value="已入库" />
            <el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>

        <el-form-item label="采购商品">
          <el-table :data="form.items" style="width: 100%" size="small" border>
            <el-table-column label="商品分类" min-width="120">
              <template #default="scope">
                <el-cascader v-model="scope.row.categoryId" :options="productCategoryOptions" :props="{ checkStrictly: true, label: 'name', value: 'id', emitPath: false }" placeholder="请选择分类" clearable style="width: 100%" @change="val => handleProductCategoryChange(val, scope.$index)" />
              </template>
            </el-table-column>
            <el-table-column label="商品名称" min-width="120">
              <template #default="scope">
                <el-select v-model="scope.row.productId" filterable placeholder="请选择商品" style="width: 100%" @change="val => handleProductChange(val, scope.$index)">
                  <el-option v-for="product in getFilteredProducts(scope.row.categoryId)" :key="product.id" :label="product.name" :value="product.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="spec" label="规格" min-width="80">
              <template #default="scope">
                <el-input v-model="scope.row.spec" placeholder="规格" />
              </template>
            </el-table-column>
            <el-table-column label="单位" min-width="60">
              <template #default="scope">
                <el-input v-model="scope.row.unit" placeholder="单位" disabled />
              </template>
            </el-table-column>
            <el-table-column prop="qty" label="数量" min-width="80">
              <template #default="scope">
                <el-input v-model.number="scope.row.qty" placeholder="数量" type="number" min="1" @change="calculateItemTotal(scope.$index)" />
              </template>
            </el-table-column>
            <el-table-column prop="price" label="单价" min-width="80">
              <template #default="scope">
                <el-input v-model.number="scope.row.price" placeholder="单价" type="number" min="0" @change="calculateItemTotal(scope.$index)" />
              </template>
            </el-table-column>
            <el-table-column label="小计" min-width="80">
              <template #default="scope">
                {{ (scope.row.qty * scope.row.price).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button type="danger" size="small" @click="removeItem(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" link @click="addItem">+ 添加商品</el-button>
        </el-form-item>

        <el-form-item label="订单总金额">
          <span style="font-weight: bold; color: #409eff">{{ formatAmount(totalAmount) }}</span>
        </el-form-item>

        <!-- 应付账款相关字段 -->
        <el-form-item label="已付金额" prop="paidAmount">
          <el-input v-model.number="form.paidAmount" placeholder="请输入已付金额" type="number" min="0" />
        </el-form-item>
        <el-form-item label="到期日" prop="dueDate">
          <el-date-picker v-model="form.dueDate" type="date" placeholder="请选择到期日" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最近支付日期" prop="paymentDate">
          <el-date-picker v-model="form.paymentDate" type="date" placeholder="请选择最近支付日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :disabled="form.status !== '待审核'">保存</el-button>
        <el-button type="success" @click="handleApprove(form)" v-if="dialogTitle === '编辑采购订单' && form.status === '待审核'">审核通过</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情弹窗 -->
    <el-dialog title="采购订单详情" v-model="viewDialogVisible" width="850px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订单号" label-width="120px">{{ viewData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商" label-width="120px">{{ viewData.supplier }}</el-descriptions-item>
        <el-descriptions-item label="下单日期" label-width="120px">{{ viewData.orderDate }}</el-descriptions-item>
        <el-descriptions-item label="订单金额" label-width="120px">{{ formatAmount(viewData.amount) }} </el-descriptions-item>
        <el-descriptions-item label="状态" label-width="120px">
          <el-tag :type="statusTagType(viewData.status)">{{ viewData.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="入库日期" label-width="120px">{{ viewData.warehousingDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入库数量" label-width="120px">{{ viewData.warehousedQty || '-' }}</el-descriptions-item>
        <el-descriptions-item label="质检结果" label-width="120px">
          <el-tag v-if="viewData.qcResult === '合格'" type="success">合格</el-tag>
          <el-tag v-else-if="viewData.qcResult === '不合格'" type="danger">不合格</el-tag>
          <el-tag v-else-if="viewData.qcResult === '未质检'" type="info">未质检</el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="质检员" label-width="120px">{{ viewData.qcUser || '-' }}</el-descriptions-item>

        <!-- 应付账款相关字段，在订单状态为已完成或已支付时显示 -->
        <template v-if="viewData.status === '已入库' || (viewData.paidAmount !== undefined && viewData.amount !== undefined && viewData.paidAmount >= viewData.amount)">
          <el-descriptions-item label="已付金额" label-width="120px">{{ formatAmount(viewData.paidAmount) }}</el-descriptions-item>
          <el-descriptions-item label="未付金额" label-width="120px">{{ formatAmount(viewData.unpaidAmount) }}</el-descriptions-item>
          <el-descriptions-item label="到期日" label-width="120px">{{ viewData.dueDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最近支付日期" label-width="120px">{{ viewData.paymentDate || '-' }}</el-descriptions-item>
        </template>

        <el-descriptions-item label="采购商品" label-width="120px">
          <el-table :data="viewData.items" style="width: 100%" size="small" border>
            <el-table-column prop="name" label="商品名称" min-width="120" />
            <el-table-column prop="spec" label="规格" min-width="80" />
            <el-table-column prop="unit" label="单位" min-width="60" />
            <el-table-column prop="qty" label="数量" min-width="70" />
            <el-table-column prop="price" label="单价" min-width="80" />
            <el-table-column label="小计" min-width="80">
              <template #default="scope">
                {{ (scope.row.qty * scope.row.price).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
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
import { allSuppliers, type Supplier } from '../../../stores/supplierData'
import { allOrders, type Order, type OrderItem, type OrderStatus, getProductUnitInfo } from '../../../stores/orderData'
import { allReturns, type PurchaseReturn } from '../../../stores/returnData'
import { allProducts, type Product } from '../../../stores/productData'
import { supplierCategories, productCategories, getCategoryTree } from '../../../stores/categoryData'
import { getUnitName } from '../../../stores/unitData'
import { useUserStore } from '../../../stores/user'

// 获取用户store
const userStore = useUserStore()

// 检查是否有采购编辑权限
const hasPurchaseEditPermission = () => {
  return userStore.hasPermission('purchase:edit')
}

// 扩展OrderItem接口以包含categoryId字段
interface ExtendedOrderItem extends OrderItem {
  categoryId?: number
  productId: number
}

const orderList = ref<Order[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// 搜索相关
const searchOrderNo = ref('')
const searchSupplier = ref('')
const searchStatus = ref<OrderStatus | ''>('')
const searchDateRange = ref<[Date, Date] | null>(null)

const multipleSelection = ref<Order[]>([])

// 分类选项
const supplierCategoryOptions = ref(getCategoryTree('supplier'))
const productCategoryOptions = ref(getCategoryTree('product'))

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive<Order & { supplierCategoryId?: number; items: ExtendedOrderItem[] }>({
  id: null,
  orderNo: generateOrderNo(),
  supplier: '',
  supplierCategoryId: undefined,
  orderDate: '',
  amount: 0,
  status: '待审核',
  items: [
    {
      productId: 0,
      categoryId: undefined,
      name: '',
      spec: '',
      unitId: 0,
      unit: '',
      qty: 0,
      price: 0
    }
  ],
  warehousingDate: undefined,
  warehousedQty: undefined,
  qcResult: undefined,
  qcUser: undefined,
  paidAmount: undefined,
  dueDate: undefined,
  paymentDate: undefined,
  paymentMethod: undefined,
  paymentChannel: undefined
})

// 根据选择的供应商分类筛选供应商
const filteredSuppliers = computed(() => {
  if (!form.supplierCategoryId) return allSuppliers.value
  return allSuppliers.value.filter(s => s.categoryId === form.supplierCategoryId)
})

// 根据商品分类过滤商品
function getFilteredProducts(categoryId?: number) {
  if (!categoryId) return allProducts.value
  return allProducts.value.filter(p => p.categoryId === categoryId)
}

// 处理供应商分类变更
function handleSupplierCategoryChange(categoryId: number) {
  form.supplier = '' // 清空已选择的供应商
}

// 处理商品分类变更
function handleProductCategoryChange(categoryId: number | undefined, index: number) {
  // 清空当前行的商品信息
  form.items[index].productId = 0
  form.items[index].name = ''
  form.items[index].spec = ''
  form.items[index].unitId = 0
  form.items[index].unit = ''
  form.items[index].price = 0
}

// 处理商品选择变更
function handleProductChange(productId: number, index: number) {
  const product = allProducts.value.find(p => p.id === productId)
  if (product) {
    // 获取商品单位信息
    const unitInfo = getProductUnitInfo(productId)

    // 更新表单中的商品信息
    form.items[index].name = product.name
    form.items[index].spec = product.spec || ''
    form.items[index].unitId = unitInfo.unitId
    form.items[index].unit = unitInfo.unitName
    form.items[index].price = product.price
  }
  calculateItemTotal(index)
}

// 计算单个商品项的总金额
function calculateItemTotal(index: number) {
  const item = form.items[index]
  if (item && item.qty && item.price) {
    calculateTotalAmount()
  }
}

const formRef = ref()
const rules = {
  supplier: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  orderDate: [{ required: true, message: '请选择下单日期', trigger: 'change' }],
  items: [{ type: 'array', required: true, message: '至少添加一个商品', trigger: 'change' }],
  dueDate: [
    { required: true, message: '请选择到期日', trigger: 'change' },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value || !form.orderDate) {
          callback() // 如果到期日或下单日期为空，不进行校验
          return
        }
        const orderDate = new Date(form.orderDate)
        const dueDate = new Date(value)
        const oneMonthLater = new Date(orderDate)
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

        if (dueDate > oneMonthLater) {
          callback(new Error('到期日不能超过下单日期一个月'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 详情弹窗
const viewDialogVisible = ref(false)
const viewData = reactive<Order>({
  id: null,
  orderNo: '',
  supplier: '',
  orderDate: '',
  amount: 0,
  status: '待审核',
  items: [],
  warehousingDate: undefined,
  warehousedQty: undefined,
  qcResult: undefined,
  qcUser: undefined,
  paidAmount: undefined,
  unpaidAmount: undefined,
  dueDate: undefined,
  paymentDate: undefined,
  paymentMethod: undefined,
  paymentChannel: undefined
})

const router = useRouter()
const route = useRoute()

// 计算订单总金额
const totalAmount = computed(() => {
  return (form.items || []).reduce((sum, item) => sum + item.qty * item.price, 0)
})

// 监听 form.items 变化，更新 totalAmount
watch(
  () => form.items,
  () => {
    calculateTotalAmount()
  },
  { deep: true }
)

// 自动生成订单号 (简单示例，实际应考虑并发和唯一性)
function generateOrderNo(): string {
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
  return `PO${year}${month}${day}${hour}${minute}${second}${random}`
}

// 判断订单是否应在列表中显示 (过滤掉关联退款状态的订单)
function shouldDisplayOrder(order: Order): boolean {
  return order.status !== '关联退款'
}

// 获取订单列表数据
function fetchOrders() {
  let list = allOrders.value.filter(shouldDisplayOrder)

  // 应用搜索筛选
  if (searchOrderNo.value) {
    list = list.filter(item => item.orderNo.includes(searchOrderNo.value.trim()))
  }
  if (searchSupplier.value) {
    list = list.filter(item => item.supplier === searchSupplier.value)
  }
  // 修改状态过滤逻辑，如果搜索状态不是 '关联退款' 才应用过滤
  if (searchStatus.value && searchStatus.value !== '关联退款') {
    list = list.filter(item => item.status === searchStatus.value)
  }
  if (searchDateRange.value && searchDateRange.value.length === 2) {
    const [start, end] = searchDateRange.value
    list = list.filter(item => {
      const orderDate = new Date(item.orderDate)
      return orderDate >= start && orderDate <= end
    })
  }

  total.value = list.length
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  orderList.value = list.slice(startIndex, endIndex)
}

// 重置搜索表单
function handleReset() {
  searchOrderNo.value = ''
  searchSupplier.value = ''
  searchStatus.value = ''
  searchDateRange.value = null
  currentPage.value = 1 // 重置到第一页
  fetchOrders()
}

function handleSelectionChange(val: Order[]) {
  multipleSelection.value = val
}

// 打开新增弹窗
function openAddDialog() {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限创建采购订单')
    return
  }
  dialogTitle.value = '新增采购订单'
  const today = new Date()
  const orderDate = today.toISOString().slice(0, 10)
  const dueDate = new Date(today)
  dueDate.setMonth(dueDate.getMonth() + 1)
  const dueDateString = dueDate.toISOString().slice(0, 10)

  Object.assign(form, {
    id: null,
    orderNo: generateOrderNo(),
    supplier: '',
    supplierCategoryId: undefined,
    orderDate: orderDate, // 默认为今天
    amount: 0,
    status: '待审核',
    items: [
      {
        productId: 0,
        categoryId: undefined,
        name: '',
        spec: '',
        unitId: 0,
        unit: '',
        qty: 0,
        price: 0
      }
    ] as ExtendedOrderItem[],
    warehousingDate: undefined,
    warehousedQty: undefined,
    qcResult: undefined,
    qcUser: undefined,
    paidAmount: undefined,
    dueDate: dueDateString, // 默认为下单日期一个月后
    paymentDate: undefined,
    paymentMethod: undefined,
    paymentChannel: undefined
  })
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 打开编辑弹窗
function openEditDialog(row: Order) {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限编辑采购订单')
    return
  }
  dialogTitle.value = '编辑采购订单'
  // 深拷贝，避免直接修改原始数据
  const orderData = JSON.parse(JSON.stringify(row))

  // 为每个商品项添加分类ID
  orderData.items = orderData.items.map((item: OrderItem) => {
    const extendedItem = item as ExtendedOrderItem
    const product = allProducts.value.find(p => p.name === item.name)
    if (product) {
      extendedItem.productId = product.id
      extendedItem.categoryId = product.categoryId
    }
    return extendedItem
  })

  // 找到供应商的分类ID
  const supplier = allSuppliers.value.find(s => s.name === orderData.supplier)
  if (supplier && supplier.categoryId) {
    orderData.supplierCategoryId = supplier.categoryId
  }

  Object.assign(form, orderData)
  dialogVisible.value = true
}

// 打开详情弹窗
function openViewDialog(row: Order) {
  Object.assign(viewData, row)
  viewDialogVisible.value = true
}

// 添加采购商品项
function addItem() {
  form.items.push({
    productId: 0,
    categoryId: undefined,
    name: '',
    spec: '',
    unitId: 0,
    unit: '',
    qty: 0,
    price: 0
  } as ExtendedOrderItem)
}

// 移除采购商品项
function removeItem(idx: number) {
  form.items.splice(idx, 1)
  calculateTotalAmount()
}

// 计算订单总金额
function calculateTotalAmount() {
  form.amount = (form.items || []).reduce((sum, item) => sum + item.qty * item.price, 0)
}

// 提交表单（新增/编辑）
function handleSubmit() {
  ;(formRef.value as any).validate((valid: boolean) => {
    if (!valid) return

    // 确保每个商品项都有有效的商品ID和名称
    for (const item of form.items) {
      if (!item.productId) {
        ElMessage.warning('请选择商品')
        return
      }
    }

    // 处理表单数据
    const formData = {
      ...form,
      items: form.items.map(
        item =>
          ({
            productId: item.productId,
            name: item.name,
            spec: item.spec,
            unitId: item.unitId,
            unit: item.unit,
            qty: item.qty,
            price: item.price
          } as OrderItem)
      )
    }

    // 从表单数据中删除supplierCategoryId字段，因为它不是Order类型的属性
    delete formData.supplierCategoryId

    if (form.id !== null) {
      // 编辑
      const idx = allOrders.value.findIndex(item => item.id === form.id)
      if (idx !== -1) {
        // 更新原始数据中的订单
        Object.assign(allOrders.value[idx], formData)
        ElMessage.success('编辑采购订单成功')
      }
    } else {
      // 新增
      // 为新增的订单生成唯一ID
      formData.id = allOrders.value.length > 0 ? Math.max(...allOrders.value.map(o => o.id || 0)) + 1 : 1
      allOrders.value.push(formData as Order)
      ElMessage.success('新增采购订单成功')
    }

    // 提交后刷新列表
    fetchOrders()
    dialogVisible.value = false
  })
}

// 处理审核通过
function handleApprove(row: Order) {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限审核采购订单')
    return
  }
  ElMessageBox.confirm('确定审核通过该订单吗？', '提示', { type: 'warning' })
    .then(() => {
      const orderToUpdate = allOrders.value.find(order => order.id === row.id)
      if (orderToUpdate) {
        orderToUpdate.status = '待入库'
        ElMessage.success('订单审核通过，状态更新为待入库')
        fetchOrders() // 刷新列表以反映状态变化
        if (dialogVisible.value) dialogVisible.value = false // 如果在弹窗中操作，关闭弹窗
      }
    })
    .catch(() => {
      ElMessage.info('已取消审核')
    })
}

// 处理入库
function handleWarehousing(row: Order) {
  // 弹窗确认后跳转到采购入库页面，并携带订单号
  ElMessageBox.confirm('确认对该订单进行入库操作吗？将跳转到采购入库页面。', '提示', { type: 'info' })
    .then(() => {
      router.push({ path: '/purchase/warehousing', query: { orderNo: row.orderNo } }) // 携带订单号进行跳转
      ElMessage.success('即将跳转到采购入库页面')
    })
    .catch(() => {
      ElMessage.info('已取消入库操作')
    })
}

// 处理取消订单
function handleCancel(row: Order) {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限取消采购订单')
    return
  }
  ElMessageBox.confirm('确定要取消该订单吗？', '提示', { type: 'warning' })
    .then(() => {
      const orderToUpdate = allOrders.value.find(order => order.id === row.id)
      if (orderToUpdate) {
        orderToUpdate.status = '已取消'
        ElMessage.success('订单已取消')
        fetchOrders() // 刷新列表
        if (dialogVisible.value) dialogVisible.value = false // 如果在弹窗中操作，关闭弹窗
      }
    })
    .catch(() => {
      ElMessage.info('已取消取消操作')
    })
}

// 处理批量删除
function handleBatchDelete() {
  if (!hasPurchaseEditPermission()) {
    ElMessage.warning('暂无权限删除采购订单')
    return
  }
  ElMessageBox.confirm(`确定删除选中的 ${multipleSelection.value.length} 条订单吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const selectedIds = multipleSelection.value.map(item => item.id)
      allOrders.value = allOrders.value.filter(item => !selectedIds.includes(item.id))
      ElMessage.success('批量删除成功！')
      fetchOrders() // 刷新列表
      multipleSelection.value = [] // 清空选中项
    })
    .catch(() => {
      ElMessage.info('已取消批量删除')
    })
}

// 处理付款 (跳转到应付账款页面并传递订单号)
function handlePayment(row: Order) {
  router.push({ path: '/purchase/payment', query: { orderNo: row.orderNo } })
  ElMessage.info(`即将跳转到应付账款页面处理订单 ${row.orderNo} 的付款`)
}

// 根据状态获取标签类型
function statusTagType(status: string) {
  switch (status) {
    case '待审核':
      return 'warning'
    case '待入库':
      return 'info'
    case '待付款':
      return 'primary'
    case '已入库':
      return 'success'
    case '已取消':
      return 'danger'
    case '关联退款': // 为关联退款状态添加标签类型
      return 'info'
    default:
      return ''
  }
}

// 格式化金额
function formatAmount(amount: number | undefined) {
  return amount !== undefined ? `¥${amount.toFixed(2)}` : '¥0.00'
}

// 跳转到供应商详情
function goToSupplier(supplierName: string) {
  // 可以在这里实现跳转到供应商详情页面的逻辑
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

// 格式化日期为 YYYY-MM-DD
function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 监听路由变化，用于从供应商页面跳转回来时加载数据 (如果需要)
watch(
  () => route.query.name,
  newName => {
    if (newName) {
      // 根据供应商名称加载相关订单数据或进行其他操作
      console.log('从供应商页面跳转回来，供应商名称:', newName)
      // 例如：searchSupplier.value = newName; fetchOrders();
    }
  }
)

// 页面加载时获取数据
onMounted(() => {
  // 检查路由参数，如果存在供应商名称，则按供应商筛选订单
  if (route.query.name) {
    searchSupplier.value = route.query.name as string
  }
  fetchOrders()
})
</script>

<style scoped>
.order-container {
  padding: 20px;
  /* background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); */
}

.search-form {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.search-form .el-form-item {
  margin-bottom: 10px;
  margin-right: 10px; /* 调整表单项之间的右边距 */
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.pagination {
  margin-top: 15px;
  text-align: right;
}

/* 调整弹窗内表单项的样式 */
.el-dialog__body .el-form-item {
  margin-bottom: 18px;
}

.el-dialog__body .el-form-item__content > .el-select,
.el-dialog__body .el-form-item__content > .el-input,
.el-dialog__body .el-form-item__content > .el-textarea {
  width: 100%; /* 让表单元素填充宽度 */
}

/* 调整必填星号对齐 */
.el-form-item.is-required:not(.is-no-asterisk).el-form-item--default .el-form-item__label::before {
  content: '' !important; /* 移除默认的星号 */
  color: var(--el-color-danger) !important;
  margin-right: 4px !important;
}

.el-form-item.is-required:not(.is-no-asterisk).el-form-item--default .el-form-item__label::after {
  content: '*' !important; /* 添加星号 */
  margin-left: 4px; /* 调整位置 */
  color: var(--el-color-danger) !important;
}

.el-form-item--default .el-form-item__label {
  line-height: normal;
  display: flex;
  align-items: center;
}
</style>
