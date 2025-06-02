<template>
  <div class="supplier-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item>
        <el-input v-model="searchKeyword" placeholder="搜索供应商名称/联系人/电话" clearable @keyup.enter="fetchSuppliers" style="width: 220px" />
      </el-form-item>
      <el-form-item>
        <el-cascader
          v-model="searchCategoryId"
          :options="categoryOptions"
          :props="{ checkStrictly: true, label: 'name', value: 'id', emitPath: false }"
          placeholder="请选择分类"
          clearable
          style="width: 220px"
          @change="fetchSuppliers"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchSuppliers">搜索</el-button>
        <el-button @click="handleReset" style="margin-left: 4px">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格操作栏 -->
    <div class="table-toolbar">
      <el-button type="danger" :disabled="!multipleSelection.length" @click="handleBatchDelete">批量删除</el-button>
      <div class="toolbar-right">
        <el-button type="primary" @click="openAddDialog">新增供应商</el-button>
      </div>
    </div>

    <!-- 供应商表格 -->
    <el-table :data="supplierList" border stripe style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="code" label="供应商号" min-width="110" />
      <el-table-column prop="name" label="供应商名称" min-width="150" />
      <el-table-column label="分类" min-width="120">
        <template #default="scope">
          <span>{{ getSupplierCategoryName(scope.row.id) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="contact" label="联系人" min-width="100" />
      <el-table-column prop="phone" label="联系电话" min-width="120" />
      <el-table-column prop="address" label="地址" min-width="180" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.status === '正常' ? 'success' : 'info'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="270">
        <template #default="scope">
          <el-button size="small" @click="openViewDialog(scope.row)">查看</el-button>
          <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="warning" :disabled="scope.row.status === '停用'" @click="handleDisable(scope.row)">禁用</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="fetchSuppliers" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="95px">
        <el-form-item label="供应商号" prop="code">
          <el-input v-model="form.code" disabled />
        </el-form-item>
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-cascader
            v-model="form.categoryId"
            :options="categoryOptions"
            :props="{ checkStrictly: true, label: 'name', value: 'id', emitPath: false }"
            placeholder="请选择分类"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status">
            <el-option label="正常" value="正常" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 供应商详情弹窗 -->
    <el-dialog title="供应商详情" v-model="viewDialogVisible" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="供应商号">{{ viewData.code }}</el-descriptions-item>
        <el-descriptions-item label="供应商名称">{{ viewData.name }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ getSupplierCategoryName(viewData.id) }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ viewData.contact }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ viewData.phone }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ viewData.address }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewData.status === '正常' ? 'success' : 'info'">{{ viewData.status }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { allSuppliers, type Supplier, getSupplierCategoryName } from '../../../stores/supplierData'
import { getCategoryTree } from '../../../stores/categoryData'

const supplierList = ref<Supplier[]>([])
const total = ref(3)
const pageSize = ref(10)
const currentPage = ref(1)
const searchKeyword = ref('')
const searchCategoryId = ref<number | undefined>(undefined)
const multipleSelection = ref<any[]>([])

// 分类选项
const categoryOptions = ref(getCategoryTree('supplier'))

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive<Supplier>({ id: null, code: '', name: '', category: '', categoryId: undefined, contact: '', phone: '', address: '', status: '正常' })
const formRef = ref()
const rules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }]
}

const viewDialogVisible = ref(false)
const viewData = reactive<Supplier>({ id: null, code: '', name: '', category: '', categoryId: undefined, contact: '', phone: '', address: '', status: '正常' })

const route = useRoute()

function fetchSuppliers() {
  // 关键词和分类筛选
  let list = allSuppliers.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.trim()
    list = list.filter(item => item.name.includes(kw) || item.contact.includes(kw) || item.phone.includes(kw))
  }
  if (searchCategoryId.value) {
    list = list.filter(item => item.categoryId === searchCategoryId.value)
  }
  supplierList.value = list
  total.value = list.length
}

function handleSelectionChange(val: any[]) {
  multipleSelection.value = val
}

function openAddDialog() {
  dialogTitle.value = '新增供应商'
  Object.assign(form, { id: null, code: getNextSupplierCode(), name: '', category: '', categoryId: undefined, contact: '', phone: '', address: '', status: '正常' })
  dialogVisible.value = true
}

function getNextSupplierCode() {
  // 找到当前最大code，自动递增
  const codes = allSuppliers.value.map(s => s.code)
  let maxNum = 0
  codes.forEach(code => {
    const match = code.match(/^S(\d{5})$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const nextNum = (maxNum + 1).toString().padStart(5, '0')
  return `S${nextNum}`
}

function openEditDialog(row: any) {
  dialogTitle.value = '编辑供应商'
  Object.assign(form, row)
  dialogVisible.value = true
}

function handleSubmit() {
  formRef.value.validate((valid: boolean) => {
    if (!valid) return
    
    // 根据分类ID设置分类名称
    if (form.categoryId) {
      form.category = getSupplierCategoryName(form.id)
    }
    
    if (form.id !== null) {
      // 编辑
      const idx = allSuppliers.value.findIndex(item => item.id === form.id)
      if (idx !== -1) allSuppliers.value[idx] = { ...form }
      ElMessage.success('编辑成功')
    } else {
      // 新增
      form.id = Date.now()
      allSuppliers.value.push({ ...form })
      ElMessage.success('新增成功')
    }
    fetchSuppliers()
    dialogVisible.value = false
  })
}

function handleDelete(row: any) {
  ElMessageBox.confirm('确定要删除该供应商吗？', '提示', { type: 'warning' }).then(() => {
    allSuppliers.value = allSuppliers.value.filter(item => item.id !== row.id)
    fetchSuppliers()
    ElMessage.success('删除成功')
  })
}

function handleBatchDelete() {
  ElMessageBox.confirm('确定要批量删除选中的供应商吗？', '提示', { type: 'warning' }).then(() => {
    const ids = multipleSelection.value.map(item => item.id)
    allSuppliers.value = allSuppliers.value.filter(item => !ids.includes(item.id))
    fetchSuppliers()
    ElMessage.success('批量删除成功')
    multipleSelection.value = []
  })
}

function openViewDialog(row: Supplier) {
  Object.assign(viewData, row)
  viewDialogVisible.value = true
}

function handleDisable(row: Supplier) {
  if (row.status === '停用') return
  ElMessageBox.confirm('确定要禁用该供应商吗？', '提示', { type: 'warning' }).then(() => {
    row.status = '停用'
    ElMessage.success('已禁用')
  })
}

function handleReset() {
  searchKeyword.value = ''
  searchCategoryId.value = undefined
  fetchSuppliers()
}

onMounted(() => {
  fetchSuppliers()
  // 路由带name参数时自动弹窗
  if (route.query.name) {
    const supplier = allSuppliers.value.find(s => s.name === route.query.name)
    if (supplier) {
      openViewDialog(supplier)
    }
  }
})

// 若路由参数变化也自动弹窗
watch(
  () => route.query.name,
  newName => {
    if (newName) {
      const supplier = allSuppliers.value.find(s => s.name === newName)
      if (supplier) {
        openViewDialog(supplier)
      }
    }
  }
)
</script>

<style scoped>
.supplier-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.search-form {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pagination {
  margin: 18px 0 0 0;
  text-align: right;
}
.el-dialog__body {
  padding-left: 32px;
  padding-right: 32px;
}
.el-form {
  margin-top: 8px;
}
.el-form-item {
  margin-bottom: 22px;
}
.el-form-item__label {
  font-weight: 500;
  color: #606266;
  letter-spacing: 1px;
}
.el-input,
.el-select {
  width: 100%;
}
.el-form-item.is-required .el-form-item__label:before {
  margin-right: 4px;
  color: #f56c6c;
  font-size: 14px;
  position: relative;
  top: 1px;
}
.el-descriptions {
  margin: 10px 0 0 0;
}
.el-descriptions__label {
  width: 95px !important;
  font-weight: 500;
  color: #606266;
}
.el-descriptions__content {
  color: #303133;
}
</style>
