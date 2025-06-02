<template>
  <div class="customer-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="客户编号">
        <el-input v-model="searchCode" placeholder="客户编号" clearable @keyup.enter="fetchCustomers" />
      </el-form-item>
      <el-form-item label="客户名称">
        <el-input v-model="searchName" placeholder="客户名称" clearable @keyup.enter="fetchCustomers" />
      </el-form-item>
      <el-form-item label="客户分类">
        <el-cascader v-model="searchCategoryId" :options="categoryOptions" :props="{ checkStrictly: true, label: 'name', value: 'id', emitPath: false }" placeholder="请选择分类" clearable style="width: 220px" @change="fetchCustomers" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchCustomers">搜索</el-button>
        <el-button @click="handleReset" style="margin-left: 4px">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格操作栏 -->
    <div class="table-toolbar">
      <el-button type="danger" :disabled="multipleSelection.length === 0" @click="handleBatchDelete">批量删除</el-button>
      <div class="toolbar-right">
        <el-button type="primary" @click="openAddDialog">新增客户</el-button>
      </div>
    </div>

    <!-- 客户表格 -->
    <el-table :data="customerList" border stripe style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="code" label="客户编号" min-width="100" />
      <el-table-column prop="name" label="客户名称" min-width="150" />
      <el-table-column label="客户分类" min-width="120">
        <template #default="scope">
          <span>{{ getCustomerCategoryName(scope.row.id) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="contactPerson" label="联系人" min-width="100" />
      <el-table-column prop="phoneNumber" label="联系电话" min-width="120" class="phone-cell">
        <template #default="scope">
          <span>{{ desensitizePhoneNumber(scope.row.phoneNumber) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="address" label="联系地址" min-width="200" />
      <el-table-column prop="creditRating" label="信用评级" min-width="100">
        <template #default="scope">
          <el-tag :type="creditRatingTagType(scope.row.creditRating)">{{ scope.row.creditRating }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openViewDialog(scope.row)">查看</el-button>
          <el-button size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="fetchCustomers" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="客户编号" prop="code">
          <el-input v-model="form.code" :disabled="dialogTitle === '编辑客户'" />
        </el-form-item>
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="客户分类" prop="categoryId">
          <el-cascader v-model="form.categoryId" :options="categoryOptions" :props="{ checkStrictly: true, label: 'name', value: 'id', emitPath: false }" placeholder="请选择分类" clearable style="width: 100%" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="form.contactPerson" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phoneNumber">
          <el-input v-model="form.phoneNumber" />
        </el-form-item>
        <el-form-item label="联系地址" prop="address">
          <el-input v-model="form.address" type="textarea" />
        </el-form-item>
        <el-form-item label="信用评级" prop="creditRating">
          <el-select v-model="form.creditRating" placeholder="请选择信用评级">
            <el-option label="优秀" value="优秀" />
            <el-option label="良好" value="良好" />
            <el-option label="一般" value="一般" />
            <el-option label="风险" value="风险" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 客户详情弹窗 -->
    <el-dialog title="客户详情" v-model="viewDialogVisible" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="客户编号" label-width="100px">{{ viewData.code }}</el-descriptions-item>
        <el-descriptions-item label="客户名称" label-width="100px">{{ viewData.name }}</el-descriptions-item>
        <el-descriptions-item label="客户分类" label-width="100px">{{ getCustomerCategoryName(viewData.id) }}</el-descriptions-item>
        <el-descriptions-item label="联系人" label-width="100px">{{ viewData.contactPerson }}</el-descriptions-item>
        <el-descriptions-item label="联系电话" label-width="100px">{{ viewData.phoneNumber }}</el-descriptions-item>
        <el-descriptions-item label="联系地址" label-width="100px">{{ viewData.address }}</el-descriptions-item>
        <el-descriptions-item label="信用评级" label-width="100px">
          <el-tag :type="creditRatingTagType(viewData.creditRating)">{{ viewData.creditRating }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { allCustomers, type Customer, getCustomerCategoryName } from '../../../stores/customerData'
import { getCategoryTree } from '../../../stores/categoryData'

// 在 Customer 接口基础上扩展，用于表格显示状态
interface CustomerWithStatus extends Customer {
  showFullPhone?: boolean // 控制是否显示完整电话号码
}

const customerList = ref<CustomerWithStatus[]>([]) // 使用扩展后的类型
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// 搜索相关
const searchCode = ref('')
const searchName = ref('')
const searchCategoryId = ref<number | undefined>(undefined)

// 分类选项
const categoryOptions = ref(getCategoryTree('customer'))

const multipleSelection = ref<Customer[]>([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = reactive<Customer>({
  id: null,
  code: '',
  name: '',
  category: '',
  categoryId: undefined,
  contactPerson: '',
  phoneNumber: '',
  address: '',
  creditRating: '良好' // 默认信用评级
})
const formRef = ref()
const rules = {
  code: [{ required: true, message: '请输入客户编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择客户分类', trigger: 'change' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phoneNumber: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  address: [{ required: true, message: '请输入联系地址', trigger: 'blur' }],
  creditRating: [{ required: true, message: '请选择信用评级', trigger: 'change' }]
}

// 详情弹窗
const viewDialogVisible = ref(false)
const viewData = reactive<Customer>({
  id: null,
  code: '',
  name: '',
  category: '',
  categoryId: undefined,
  contactPerson: '',
  phoneNumber: '',
  address: '',
  creditRating: '良好'
})

// 获取客户列表数据
function fetchCustomers() {
  let list = allCustomers.value

  // 应用搜索筛选
  if (searchCode.value) {
    list = list.filter(item => item.code.includes(searchCode.value.trim()))
  }
  if (searchName.value) {
    list = list.filter(item => item.name.includes(searchName.value.trim()))
  }
  if (searchCategoryId.value) {
    list = list.filter(item => item.categoryId === searchCategoryId.value)
  }

  total.value = list.length
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  // 添加 showFullPhone 属性，默认为 false
  customerList.value = list.slice(startIndex, endIndex).map(item => ({
    ...item,
    showFullPhone: false
  }))
}

// 重置搜索表单
function handleReset() {
  searchCode.value = ''
  searchName.value = ''
  searchCategoryId.value = undefined
  currentPage.value = 1 // 重置到第一页
  fetchCustomers()
}

function handleSelectionChange(val: Customer[]) {
  multipleSelection.value = val
}

// 打开新增弹窗
function openAddDialog() {
  dialogTitle.value = '新增客户'
  Object.assign(form, {
    id: null,
    code: getNextCustomerCode(),
    name: '',
    category: '',
    categoryId: undefined,
    contactPerson: '',
    phoneNumber: '',
    address: '',
    creditRating: '良好'
  })
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 打开编辑弹窗
function openEditDialog(row: Customer) {
  dialogTitle.value = '编辑客户'
  // 深拷贝，避免直接修改原始数据
  Object.assign(form, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}

// 打开详情弹窗
function openViewDialog(row: Customer) {
  Object.assign(viewData, row)
  viewDialogVisible.value = true
}

// 获取下一个客户编号
function getNextCustomerCode() {
  const codes = allCustomers.value.map(c => c.code)
  let maxNum = 0
  codes.forEach(code => {
    const match = code.match(/^C(\d{3})$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const nextNum = (maxNum + 1).toString().padStart(3, '0')
  return `C${nextNum}`
}

// 提交表单
function handleSubmit() {
  formRef.value.validate((valid: boolean) => {
    if (!valid) return

    // 根据分类ID设置分类名称
    if (form.categoryId) {
      form.category = getCustomerCategoryName(form.id)
    }

    if (form.id === null) {
      // 新增
      form.id = Date.now()
      allCustomers.value.push({ ...form })
      ElMessage.success('新增成功')
    } else {
      // 编辑
      const index = allCustomers.value.findIndex(item => item.id === form.id)
      if (index !== -1) {
        allCustomers.value[index] = { ...form }
        ElMessage.success('编辑成功')
      }
    }
    fetchCustomers()
    dialogVisible.value = false
  })
}

// 删除客户
function handleDelete(row: Customer) {
  ElMessageBox.confirm('确定要删除该客户吗？', '提示', { type: 'warning' }).then(() => {
    allCustomers.value = allCustomers.value.filter(item => item.id !== row.id)
    fetchCustomers()
    ElMessage.success('删除成功')
  })
}

// 批量删除
function handleBatchDelete() {
  if (multipleSelection.value.length === 0) return
  ElMessageBox.confirm(`确定要删除选中的 ${multipleSelection.value.length} 条数据吗？`, '提示', { type: 'warning' }).then(() => {
    const ids = multipleSelection.value.map(item => item.id)
    allCustomers.value = allCustomers.value.filter(item => !ids.includes(item.id))
    fetchCustomers()
    ElMessage.success('批量删除成功')
  })
}

// 电话号码脱敏显示
function desensitizePhoneNumber(phone: string): string {
  if (!phone) return ''
  if (phone.length <= 7) return phone
  return phone.replace(/(\d{3})\d*(\d{4})/, '$1****$2')
}

// 信用评级标签类型
function creditRatingTagType(rating: string): 'success' | 'warning' | 'info' | 'danger' {
  switch (rating) {
    case '优秀':
      return 'success'
    case '良好':
      return 'info'
    case '一般':
      return 'warning'
    case '风险':
      return 'danger'
    default:
      return 'info'
  }
}

onMounted(() => {
  fetchCustomers()
})
</script>

<style scoped>
.customer-container {
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
.phone-cell {
  font-family: monospace;
}
</style>
