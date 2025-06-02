<template>
  <div class="product-manage-container">
    <!-- 查询表单 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="searchForm" class="filter-form">
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.name" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="searchForm.spec" placeholder="请输入规格" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-cascader v-model="searchForm.categoryId" :options="categoryOptions" :props="{ checkStrictly: true, label: 'name', value: 'id', emitPath: false }" placeholder="请选择分类" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="库存状态" style="width: 200px">
          <el-select v-model="searchForm.stockStatus" placeholder="请选择库存状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="库存充足" value="sufficient" />
            <el-option label="库存紧张" value="warning" />
            <el-option label="库存告罄" value="empty" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="header-bar">
      <el-button type="primary" @click="openAddDialog">新增商品</el-button>
    </div>
    <el-table :data="pagedProductList" border style="margin-bottom: 24px">
      <el-table-column prop="id" label="商品ID" min-width="80" />
      <el-table-column prop="name" label="商品名称" min-width="120" />
      <el-table-column prop="spec" label="规格" min-width="100" />
      <el-table-column label="分类" min-width="120">
        <template #default="scope">
          <span>{{ getProductCategoryName(scope.row.categoryId) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" min-width="100" sortable>
        <template #default="scope">
          <span>¥{{ scope.row.price.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单位" min-width="80">
        <template #default="scope">
          <span>{{ getUnitName(scope.row.unitId) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="stockQuantity" label="库存数量" min-width="100" sortable />
      <el-table-column label="库存状态" min-width="100">
        <template #default="scope">
          <el-tag :type="getStockStatusType(scope.row)" effect="light">
            {{ getStockStatusText(scope.row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="barcode" label="条形码" min-width="120">
        <template #default="scope">
          <el-image :src="getBarcodeUrl(scope.row)" style="height: 40px" />
        </template>
      </el-table-column>
      <el-table-column prop="image" label="图片" min-width="100">
        <template #default="scope">
          <el-image v-if="scope.row.image" :src="scope.row.image" style="height: 40px" />
          <span v-else style="color: #bbb">无</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120">
        <template #default="scope">
          <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteProduct(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="filteredProductList.length" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </div>
    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="商品ID">
          <el-input v-model="form.id" placeholder="自动生成" :disabled="true" />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-cascader v-model="form.categoryId" :options="categoryOptions" :props="{ checkStrictly: true, label: 'name', value: 'id', emitPath: false }" placeholder="请选择分类" clearable style="width: 100%" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="form.spec" />
        </el-form-item>
        <el-form-item label="单位">
          <el-select v-model="form.unitId" placeholder="请选择单位" style="width: 100%">
            <el-option v-for="unit in allUnits" :key="unit.id" :label="unit.name" :value="unit.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload class="avatar-uploader" action="" :show-file-list="false" :before-upload="handleBeforeUpload">
            <img v-if="form.image" :src="form.image" class="avatar" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item label="条形码">
          <el-image :src="getBarcodeUrl(form)" style="height: 40px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { allProducts } from '../../../stores/productData'
import { allInventory } from '../../../stores/inventoryData'
import { getCategoryTree, getCategoryName } from '../../../stores/categoryData'
import { allUnits, getUnitName } from '../../../stores/unitData'
import { ElMessage } from 'element-plus'
import type { Product } from '../../../stores/productData'

interface ProductWithStock extends Product {
  stockQuantity: number
  image: string
  barcode: string
  stockStatus?: 'sufficient' | 'warning' | 'empty'
}

// 查询表单
const searchForm = ref({
  name: '',
  spec: '',
  categoryId: undefined as number | undefined,
  stockStatus: ''
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 商品列表（带库存数量）
const productList = ref<ProductWithStock[]>([])

// 分类选项
const categoryOptions = ref(getCategoryTree('product'))

// 库存状态阈值常量定义处
// 库存状态阈值 - 用于判断商品库存状态
const STOCK_EMPTY_THRESHOLD = 0 // 等于0为库存告罄
const STOCK_WARNING_THRESHOLD = 10 // 小于等于10为库存紧张

// 获取库存状态类型
function getStockStatusType(product: ProductWithStock): '' | 'success' | 'warning' | 'danger' {
  if (product.stockQuantity <= STOCK_EMPTY_THRESHOLD) {
    return 'danger'
  } else if (product.stockQuantity <= STOCK_WARNING_THRESHOLD) {
    return 'warning'
  } else {
    return 'success'
  }
}

// 获取库存状态文本
function getStockStatusText(product: ProductWithStock): string {
  if (product.stockQuantity <= STOCK_EMPTY_THRESHOLD) {
    return '库存告罄'
  } else if (product.stockQuantity <= STOCK_WARNING_THRESHOLD) {
    return '库存紧张'
  } else {
    return '库存充足'
  }
}

// 获取商品分类名称
function getProductCategoryName(categoryId?: number): string {
  if (!categoryId) return '未分类'
  return getCategoryName('product', categoryId)
}

// 从productData和inventoryData获取数据并合并
function loadProductsWithStock() {
  // 基于allProducts创建新的列表以添加库存数量
  productList.value = allProducts.value.map(product => {
    // 复制基础商品信息
    const productWithStock: ProductWithStock = {
      ...product,
      stockQuantity: 0,
      image: '',
      barcode: `${product.id}_${product.name}` // 使用ID和名称作为条形码
    }

    // 计算该商品的总库存
    const stockItems = allInventory.value.filter(item => item.productId === product.id)
    productWithStock.stockQuantity = stockItems.reduce((total, item) => total + item.quantity, 0)

    // 确定库存状态
    if (productWithStock.stockQuantity <= STOCK_EMPTY_THRESHOLD) {
      productWithStock.stockStatus = 'empty'
    } else if (productWithStock.stockQuantity <= STOCK_WARNING_THRESHOLD) {
      productWithStock.stockStatus = 'warning'
    } else {
      productWithStock.stockStatus = 'sufficient'
    }

    return productWithStock
  })
}

// 监听allProducts和allInventory的变化，重新计算数据
watch(
  [allProducts, allInventory],
  () => {
    loadProductsWithStock()
  },
  { deep: true }
)

// 在组件挂载时加载数据
onMounted(() => {
  loadProductsWithStock()
})

// 在筛选逻辑中添加注释
// 筛选后的商品列表
const filteredProductList = computed(() => {
  return productList.value.filter(product => {
    const nameMatch = searchForm.value.name ? product.name.includes(searchForm.value.name) : true
    const specMatch = searchForm.value.spec ? (product.spec || '').includes(searchForm.value.spec) : true
    // 根据选择的库存状态进行筛选
    const statusMatch = searchForm.value.stockStatus ? product.stockStatus === searchForm.value.stockStatus : true
    // 根据选择的分类进行筛选
    const categoryMatch = searchForm.value.categoryId ? product.categoryId === searchForm.value.categoryId : true
    return nameMatch && specMatch && statusMatch && categoryMatch
  })
})

// 分页后的商品列表
const pagedProductList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProductList.value.slice(start, end)
})

// 搜索和重置搜索
function handleSearch() {
  currentPage.value = 1
}

function resetSearch() {
  searchForm.value.name = ''
  searchForm.value.spec = ''
  searchForm.value.categoryId = undefined
  searchForm.value.stockStatus = ''
  currentPage.value = 1
}

// 分页处理函数
function handleSizeChange(val: number) {
  pageSize.value = val
  currentPage.value = 1
}

function handleCurrentChange(val: number) {
  currentPage.value = val
}

// 条形码生成
function getBarcodeUrl(row: ProductWithStock) {
  const barcodeText = row.barcode || `${row.id || 'new'}_${row.name || ''}`
  return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcodeText)}&scale=2&height=10&includetext`
}

// 新增/编辑弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = ref<ProductWithStock>({
  id: 0,
  name: '',
  spec: '',
  price: 0,
  unitId: 1,
  categoryId: undefined,
  image: '',
  barcode: '',
  stockQuantity: 0
})

// 在openAddDialog函数中添加注释
function openAddDialog() {
  dialogTitle.value = '新增商品'
  // 生成新的商品ID：取当前最大ID+1，确保ID不重复
  const newId = Math.max(0, ...allProducts.value.map(p => p.id)) + 1
  form.value = {
    id: newId, // 自动填充新生成的商品ID
    name: '',
    spec: '',
    price: 0,
    unitId: 1,
    categoryId: undefined,
    image: '',
    barcode: '',
    stockQuantity: 0,
    stockStatus: 'empty' // 设置初始库存状态为空
  }
  dialogVisible.value = true
}

function openEditDialog(row: ProductWithStock) {
  dialogTitle.value = '编辑商品'
  form.value = { ...row }
  dialogVisible.value = true
}

function saveProduct() {
  if (!form.value.name || !form.value.price) {
    ElMessage.warning('请填写完整信息')
    return
  }

  // 更新条形码
  form.value.barcode = `${form.value.id}_${form.value.name}`

  if (dialogTitle.value === '新增商品') {
    // 检查是否已存在相同ID或名称的商品
    const existingById = allProducts.value.find(p => p.id === form.value.id)
    if (existingById) {
      ElMessage.error('该商品ID已存在')
      return
    }

    // 添加到全局商品列表
    allProducts.value.push({
      id: form.value.id,
      name: form.value.name,
      price: form.value.price,
      spec: form.value.spec,
      unitId: form.value.unitId,
      categoryId: form.value.categoryId
    })

    // 同时更新本地商品列表
    productList.value.push({
      ...form.value,
      stockQuantity: 0
    })

    ElMessage.success('新增成功')
  } else {
    // 编辑现有商品
    const productIndex = allProducts.value.findIndex(p => p.id === form.value.id)
    if (productIndex !== -1) {
      // 更新全局商品列表
      allProducts.value[productIndex] = {
        id: form.value.id,
        name: form.value.name,
        price: form.value.price,
        spec: form.value.spec,
        unitId: form.value.unitId,
        categoryId: form.value.categoryId
      }

      // 更新本地商品列表
      const localIndex = productList.value.findIndex(p => p.id === form.value.id)
      if (localIndex !== -1) {
        const stockQuantity = productList.value[localIndex].stockQuantity
        productList.value[localIndex] = {
          ...form.value,
          stockQuantity
        }
      }

      ElMessage.success('编辑成功')
    }
  }

  dialogVisible.value = false
}

function deleteProduct(row: ProductWithStock) {
  // 从全局商品列表中删除
  const productIndex = allProducts.value.findIndex(p => p.id === row.id)
  if (productIndex !== -1) {
    allProducts.value.splice(productIndex, 1)
  }

  // 从本地商品列表中删除
  const localIndex = productList.value.findIndex(p => p.id === row.id)
  if (localIndex !== -1) {
    productList.value.splice(localIndex, 1)
  }

  ElMessage.success('删除成功')
}

// 图片上传
function handleBeforeUpload(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      form.value.image = e.target?.result as string
      resolve(false)
    }
    reader.readAsDataURL(file)
  })
}
</script>

<style scoped>
.product-manage-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 400px;
}
.filter-bar {
  margin-bottom: 16px;
}
.header-bar {
  margin-bottom: 16px;
  text-align: right;
}
.pagination-container {
  margin-top: 16px;
  text-align: right;
}
.avatar-uploader {
  display: inline-block;
}
.avatar {
  width: 60px;
  height: 60px;
  display: block;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 60px;
  height: 60px;
  line-height: 60px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}
</style>
