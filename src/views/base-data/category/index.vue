<template>
  <div class="category-manage-container">
    <!-- 类型切换 -->
    <el-radio-group v-model="categoryType" class="category-type-selector">
      <el-radio-button label="product">商品分类</el-radio-button>
      <el-radio-button label="customer">客户分类</el-radio-button>
      <el-radio-button label="supplier">供应商分类</el-radio-button>
    </el-radio-group>

    <div class="main-content">
      <!-- 左侧分类树 -->
      <div class="category-tree-container">
        <div class="tree-header">
          <h3>分类列表</h3>
          <el-button type="primary" size="small" @click="addTopCategory">添加一级分类</el-button>
        </div>
        <el-input v-model="filterText" placeholder="输入关键字过滤" class="filter-input" />
        <el-tree ref="categoryTreeRef" :data="categoryTree" :props="defaultProps" :filter-node-method="filterNode" node-key="id" highlight-current default-expand-all @node-click="handleNodeClick">
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <span>{{ data.name }}</span>
              <span class="node-actions">
                <el-button type="primary" size="small" @click.stop="addChildCategory(data)">添加</el-button>
                <el-button type="warning" size="small" @click.stop="editCategory(data)">编辑</el-button>
                <el-button type="danger" size="small" @click.stop="deleteCategory(node, data)">删除</el-button>
              </span>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- 右侧详情 -->
      <div class="category-detail-container">
        <h3>{{ currentCategory ? '分类详情' : '请选择分类' }}</h3>
        <template v-if="currentCategory">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="分类ID">{{ currentCategory.id }}</el-descriptions-item>
            <el-descriptions-item label="分类编码">{{ currentCategory.code }}</el-descriptions-item>
            <el-descriptions-item label="分类名称">{{ currentCategory.name }}</el-descriptions-item>
            <el-descriptions-item label="分类类型">
              {{ getCategoryTypeName(currentCategory.type) }}
            </el-descriptions-item>
            <el-descriptions-item label="上级分类">
              {{ currentCategory.parentId ? getCategoryName(categoryType, currentCategory.parentId) : '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="分类层级">{{ currentCategory.level }}级</el-descriptions-item>
            <el-descriptions-item label="分类描述">{{ currentCategory.description || '无' }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <div v-else class="placeholder">
          <el-empty description="请从左侧选择分类" />
        </div>
      </div>
    </div>

    <!-- 新增/编辑分类弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="form.code" :placeholder="generateCategoryCode()" />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="上级分类" v-if="isEditingChildCategory">
          <el-cascader v-model="form.parentId" :options="categoryTreeForSelect" :props="{ checkStrictly: true, label: 'name', value: 'id', emitPath: false }" clearable placeholder="请选择上级分类" @change="handleParentChange" />
        </el-form-item>
        <el-form-item label="分类描述">
          <el-input v-model="form.description" type="textarea" placeholder="请输入分类描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import { productCategories, customerCategories, supplierCategories, getCategoryTree, getCategoryName, type Category } from '../../../stores/categoryData'

// 当前选择的分类类型
const categoryType = ref<'product' | 'customer' | 'supplier'>('product')

// 树形结构数据
const categoryTree = ref<any[]>([])
const defaultProps = {
  children: 'children',
  label: 'name'
}

// 选中的分类
const currentCategory = ref<Category | null>(null)
const categoryTreeRef = ref<InstanceType<typeof ElTree> | null>(null)
const filterText = ref('')

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = ref<Partial<Category>>({
  code: '',
  name: '',
  type: 'product',
  parentId: null,
  level: 1,
  description: ''
})
const formRef = ref()
const isEditingChildCategory = ref(false)

// 表单校验规则
const rules = {
  code: [
    { required: true, message: '请输入分类编码', trigger: 'blur' },
    { pattern: /^[A-Z0-9]+$/, message: '编码只能包含大写字母和数字', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

// 监听分类类型变化
watch(
  () => categoryType.value,
  newType => {
    loadCategoryTree()
    form.value.type = newType
    currentCategory.value = null
  }
)

// 监听过滤文本变化
watch(filterText, val => {
  categoryTreeRef.value?.filter(val)
})

// 树节点过滤方法
const filterNode = (value: string, data: Category) => {
  if (!value) return true
  return data.name.includes(value) || data.code.includes(value)
}

// 加载分类树
const loadCategoryTree = () => {
  categoryTree.value = getCategoryTree(categoryType.value)
}

// 为级联选择器准备的树形数据
const categoryTreeForSelect = computed(() => {
  const processNode = (node: any): any => {
    const { children, ...rest } = node
    return {
      ...rest,
      children: children?.map(processNode) || []
    }
  }
  return categoryTree.value.map(processNode)
})

// 获取分类类型中文名称
const getCategoryTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    product: '商品分类',
    customer: '客户分类',
    supplier: '供应商分类'
  }
  return typeMap[type] || type
}

// 生成分类编码
const generateCategoryCode = () => {
  let prefix = ''
  switch (categoryType.value) {
    case 'product':
      prefix = 'PC'
      break
    case 'customer':
      prefix = 'CC'
      break
    case 'supplier':
      prefix = 'SC'
      break
  }

  let categories: Category[]
  switch (categoryType.value) {
    case 'product':
      categories = productCategories.value
      break
    case 'customer':
      categories = customerCategories.value
      break
    case 'supplier':
      categories = supplierCategories.value
      break
    default:
      categories = []
  }

  // 找出最大编码
  const maxCode = categories.reduce((max, cat) => {
    if (cat.code.startsWith(prefix) && cat.code > max) return cat.code
    return max
  }, prefix + '000')

  // 提取编号并加1
  const codeNum = parseInt(maxCode.substring(prefix.length)) || 0
  const newCodeNum = codeNum + 1
  return prefix + newCodeNum.toString().padStart(3, '0')
}

// 处理节点点击事件
const handleNodeClick = (data: Category) => {
  currentCategory.value = data
}

// 添加顶级分类
const addTopCategory = () => {
  dialogTitle.value = '添加顶级分类'
  isEditingChildCategory.value = false
  form.value = {
    code: generateCategoryCode(),
    name: '',
    type: categoryType.value,
    parentId: null,
    level: 1,
    description: ''
  }
  dialogVisible.value = true
}

// 添加子分类
const addChildCategory = (parentCategory: Category) => {
  dialogTitle.value = '添加子分类'
  isEditingChildCategory.value = true
  form.value = {
    code: generateCategoryCode(),
    name: '',
    type: categoryType.value,
    parentId: parentCategory.id,
    level: parentCategory.level + 1,
    description: ''
  }
  dialogVisible.value = true
}

// 编辑分类
const editCategory = (category: Category) => {
  dialogTitle.value = '编辑分类'
  isEditingChildCategory.value = category.parentId !== null
  form.value = { ...category }
  dialogVisible.value = true
}

// 删除分类
const deleteCategory = (node: any, data: Category) => {
  // 检查是否有子节点
  if (node.childNodes && node.childNodes.length > 0) {
    ElMessage.warning('该分类下有子分类，不能删除')
    return
  }

  ElMessageBox.confirm(`确定要删除分类"${data.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      let categories: Category[]
      switch (categoryType.value) {
        case 'product':
          categories = productCategories.value
          break
        case 'customer':
          categories = customerCategories.value
          break
        case 'supplier':
          categories = supplierCategories.value
          break
      }

      const index = categories.findIndex(item => item.id === data.id)
      if (index !== -1) {
        categories.splice(index, 1)
        loadCategoryTree()
        currentCategory.value = null
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

// 处理父分类变更
const handleParentChange = (value: number | null) => {
  if (value === null) {
    form.value.level = 1
    return
  }

  let categories: Category[]
  switch (categoryType.value) {
    case 'product':
      categories = productCategories.value
      break
    case 'customer':
      categories = customerCategories.value
      break
    case 'supplier':
      categories = supplierCategories.value
      break
  }

  const parentCategory = categories.find(item => item.id === value)
  if (parentCategory) {
    form.value.level = parentCategory.level + 1
  }
}

// 表单提交
const handleSubmit = () => {
  formRef.value.validate((valid: boolean) => {
    if (!valid) return

    let categories: Category[]
    switch (categoryType.value) {
      case 'product':
        categories = productCategories.value
        break
      case 'customer':
        categories = customerCategories.value
        break
      case 'supplier':
        categories = supplierCategories.value
        break
    }

    const isEdit = form.value.id !== undefined

    if (isEdit) {
      // 编辑现有分类
      const index = categories.findIndex(item => item.id === form.value.id)
      if (index !== -1) {
        categories[index] = { ...categories[index], ...form.value } as Category
        ElMessage.success('更新成功')
      }
    } else {
      // 添加新分类
      const newId = Math.max(0, ...categories.map(item => item.id)) + 1
      categories.push({
        id: newId,
        code: form.value.code || generateCategoryCode(),
        name: form.value.name!,
        type: categoryType.value,
        parentId: form.value.parentId,
        level: form.value.level!,
        description: form.value.description
      })
      ElMessage.success('添加成功')
    }

    loadCategoryTree()
    dialogVisible.value = false
  })
}

onMounted(() => {
  loadCategoryTree()
})
</script>

<style scoped>
.category-manage-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.category-type-selector {
  margin-bottom: 20px;
}

.main-content {
  display: flex;
  gap: 20px;
  min-height: 600px;
  margin-top: 20px;
}

.category-tree-container {
  width: 45%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
}

.category-detail-container {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filter-input {
  margin-bottom: 15px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}

.node-actions {
  margin-left: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.custom-tree-node:hover .node-actions {
  opacity: 1;
}

.node-actions .el-button {
  padding: 2px 6px;
  font-size: 12px;
}

.placeholder {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

h3 {
  margin: 0;
  margin-bottom: 15px;
  color: #303133;
  font-weight: 500;
}

.el-descriptions {
  margin-top: 20px;
}
</style>
