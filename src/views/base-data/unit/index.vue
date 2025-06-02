<template>
  <div class="unit-manage-container">
    <el-tabs v-model="activeTab">
      <!-- 单位列表 -->
      <el-tab-pane label="单位列表" name="units">
        <div class="header-bar">
          <el-button type="primary" @click="openAddUnitDialog">新增单位</el-button>
        </div>

        <el-table :data="allUnits" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="code" label="单位编码" width="120" />
          <el-table-column prop="name" label="单位名称" width="120" />
          <el-table-column prop="symbol" label="单位符号" width="100" />
          <el-table-column label="基础单位" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.isBase ? 'success' : 'info'">
                {{ scope.row.isBase ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="180" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="openEditUnitDialog(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteUnit(scope.row)" :disabled="hasUnitConversions(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 单位换算关系 -->
      <el-tab-pane label="单位换算关系" name="conversions">
        <div class="header-bar">
          <el-button type="primary" @click="openAddConversionDialog">添加换算关系</el-button>
        </div>

        <el-table :data="allUnitConversions" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="换算关系" min-width="200">
            <template #default="scope">
              <div class="conversion-info">
                <span>1 {{ scope.row.sourceUnitName }}({{ getUnitSymbol(scope.row.sourceUnitId) }}) = {{ scope.row.rate }} {{ scope.row.targetUnitName }}({{ getUnitSymbol(scope.row.targetUnitId) }})</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="formula" label="换算公式" min-width="180" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="openEditConversionDialog(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteConversion(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 换算计算器 -->
      <el-tab-pane label="换算计算器" name="calculator">
        <div class="calculator-container">
          <el-card class="calculator-card">
            <div class="calculator-form">
              <el-form :inline="true" :model="calculator" label-position="top" class="calculator-form-inner">
                <el-form-item label="数量">
                  <el-input-number v-model="calculator.value" :min="0" :precision="1" :step="1" />
                </el-form-item>
                <el-form-item label="从单位" style="width: 100px">
                  <el-select v-model="calculator.fromUnitId" placeholder="选择单位">
                    <el-option v-for="unit in allUnits" :key="unit.id" :label="unit.name" :value="unit.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="到单位" style="width: 100px">
                  <el-select v-model="calculator.toUnitId" placeholder="选择单位">
                    <el-option v-for="unit in allUnits" :key="unit.id" :label="unit.name" :value="unit.id" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="calculateConversion">换算</el-button>
                </el-form-item>
              </el-form>
            </div>
            <div class="calculator-result" v-if="calculator.result !== null">
              <el-alert :title="`换算结果: ${calculator.value} ${getUnitName(calculator.fromUnitId)} = ${calculator.result} ${getUnitName(calculator.toUnitId)}`" type="success" :closable="false" />
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 单位编辑弹窗 -->
    <el-dialog v-model="unitDialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="unitForm" label-width="100px" :rules="unitRules" ref="unitFormRef">
        <el-form-item label="单位编码" prop="code">
          <el-input v-model="unitForm.code" />
        </el-form-item>
        <el-form-item label="单位名称" prop="name">
          <el-input v-model="unitForm.name" />
        </el-form-item>
        <el-form-item label="单位符号" prop="symbol">
          <el-input v-model="unitForm.symbol" />
        </el-form-item>
        <el-form-item label="是否基础单位">
          <el-switch v-model="unitForm.isBase" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="unitForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="unitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUnit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 单位换算关系弹窗 -->
    <el-dialog v-model="conversionDialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="conversionForm" label-width="100px" :rules="conversionRules" ref="conversionFormRef">
        <el-form-item label="源单位" prop="sourceUnitId">
          <el-select v-model="conversionForm.sourceUnitId" placeholder="选择源单位" @change="updateSourceUnitName">
            <el-option v-for="unit in allUnits" :key="unit.id" :label="unit.name" :value="unit.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标单位" prop="targetUnitId">
          <el-select v-model="conversionForm.targetUnitId" placeholder="选择目标单位" @change="updateTargetUnitName">
            <el-option v-for="unit in allUnits.filter(u => u.id !== conversionForm.sourceUnitId)" :key="unit.id" :label="unit.name" :value="unit.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="换算比率" prop="rate">
          <el-input-number v-model="conversionForm.rate" :min="0.000001" :precision="6" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="换算公式">
          <el-input v-model="conversionForm.formula" placeholder="例如: targetValue = sourceValue * 10" />
        </el-form-item>
        <div class="preview-box">
          <p>预览: 1 {{ getUnitName(conversionForm.sourceUnitId) }} = {{ conversionForm.rate }} {{ getUnitName(conversionForm.targetUnitId) }}</p>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="conversionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConversion">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { allUnits, allUnitConversions, getUnitName, convertUnit } from '@/stores/unitData'
import type { Unit, UnitConversion } from '@/stores/unitData'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 当前选中的标签页
const activeTab = ref('units')

// 单位弹窗
const unitDialogVisible = ref(false)
const dialogTitle = ref('')
const unitFormRef = ref<FormInstance>()
const unitForm = ref<Unit>({
  id: 0,
  code: '',
  name: '',
  symbol: '',
  isBase: false,
  description: ''
})

// 表单验证规则
const unitRules = ref<FormRules>({
  code: [
    { required: true, message: '请输入单位编码', trigger: 'blur' },
    { min: 1, max: 10, message: '长度在 1 到 10 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入单位名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  symbol: [{ required: true, message: '请输入单位符号', trigger: 'blur' }]
})

// 单位换算关系弹窗
const conversionDialogVisible = ref(false)
const conversionFormRef = ref<FormInstance>()
const conversionForm = ref<UnitConversion>({
  id: 0,
  sourceUnitId: 0,
  sourceUnitName: '',
  targetUnitId: 0,
  targetUnitName: '',
  rate: 1,
  formula: ''
})

// 换算关系验证规则
const conversionRules = ref<FormRules>({
  sourceUnitId: [{ required: true, message: '请选择源单位', trigger: 'change' }],
  targetUnitId: [{ required: true, message: '请选择目标单位', trigger: 'change' }],
  rate: [
    { required: true, message: '请输入换算比率', trigger: 'blur' },
    { type: 'number', min: 0.000001, message: '比率必须大于0', trigger: 'blur' }
  ]
})

// 换算计算器
const calculator = ref({
  value: 1,
  fromUnitId: 0,
  toUnitId: 0,
  result: null as number | null
})

// 打开新增单位弹窗
function openAddUnitDialog() {
  dialogTitle.value = '新增单位'
  unitForm.value = {
    id: generateNewUnitId(),
    code: '',
    name: '',
    symbol: '',
    isBase: false,
    description: ''
  }
  unitDialogVisible.value = true
}

// 打开编辑单位弹窗
function openEditUnitDialog(unit: Unit) {
  dialogTitle.value = '编辑单位'
  unitForm.value = { ...unit }
  unitDialogVisible.value = true
}

// 保存单位
function saveUnit() {
  unitFormRef.value?.validate(valid => {
    if (!valid) return

    // 检查编码和名称是否重复
    const existingUnit = allUnits.value.find(u => u.id !== unitForm.value.id && (u.code === unitForm.value.code || u.name === unitForm.value.name))
    if (existingUnit) {
      ElMessage.error('单位编码或名称已存在')
      return
    }

    if (dialogTitle.value === '新增单位') {
      allUnits.value.push({ ...unitForm.value })
      ElMessage.success('新增单位成功')
    } else {
      const index = allUnits.value.findIndex(u => u.id === unitForm.value.id)
      if (index !== -1) {
        allUnits.value[index] = { ...unitForm.value }
        ElMessage.success('更新单位成功')
      }
    }
    unitDialogVisible.value = false
  })
}

// 删除单位
function deleteUnit(unit: Unit) {
  ElMessageBox.confirm(`确定要删除单位 "${unit.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = allUnits.value.findIndex(u => u.id === unit.id)
      if (index !== -1) {
        allUnits.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 获取单位符号
function getUnitSymbol(unitId: number): string {
  const unit = allUnits.value.find(u => u.id === unitId)
  return unit ? unit.symbol : ''
}

// 检查单位是否有关联的换算关系
function hasUnitConversions(unitId: number): boolean {
  return allUnitConversions.value.some(c => c.sourceUnitId === unitId || c.targetUnitId === unitId)
}

// 打开新增换算关系弹窗
function openAddConversionDialog() {
  dialogTitle.value = '新增换算关系'
  conversionForm.value = {
    id: generateNewConversionId(),
    sourceUnitId: allUnits.value[0]?.id || 0,
    sourceUnitName: allUnits.value[0]?.name || '',
    targetUnitId: 0,
    targetUnitName: '',
    rate: 1,
    formula: ''
  }
  conversionDialogVisible.value = true
}

// 打开编辑换算关系弹窗
function openEditConversionDialog(conversion: UnitConversion) {
  dialogTitle.value = '编辑换算关系'
  conversionForm.value = { ...conversion }
  conversionDialogVisible.value = true
}

// 更新源单位名称
function updateSourceUnitName() {
  const unit = allUnits.value.find(u => u.id === conversionForm.value.sourceUnitId)
  if (unit) {
    conversionForm.value.sourceUnitName = unit.name
  }
}

// 更新目标单位名称
function updateTargetUnitName() {
  const unit = allUnits.value.find(u => u.id === conversionForm.value.targetUnitId)
  if (unit) {
    conversionForm.value.targetUnitName = unit.name
  }
}

// 保存换算关系
function saveConversion() {
  conversionFormRef.value?.validate(valid => {
    if (!valid) return

    // 检查源单位和目标单位是否相同
    if (conversionForm.value.sourceUnitId === conversionForm.value.targetUnitId) {
      ElMessage.error('源单位和目标单位不能相同')
      return
    }

    // 检查是否已存在相同的换算关系
    const existingConversion = allUnitConversions.value.find(c => c.id !== conversionForm.value.id && c.sourceUnitId === conversionForm.value.sourceUnitId && c.targetUnitId === conversionForm.value.targetUnitId)
    if (existingConversion) {
      ElMessage.error('已存在相同的换算关系')
      return
    }

    // 更新源单位名称和目标单位名称
    updateSourceUnitName()
    updateTargetUnitName()

    // 如果没有设置换算公式，则自动生成
    if (!conversionForm.value.formula) {
      conversionForm.value.formula = `targetValue = sourceValue * ${conversionForm.value.rate}`
    }

    if (dialogTitle.value === '新增换算关系') {
      allUnitConversions.value.push({ ...conversionForm.value })
      ElMessage.success('新增换算关系成功')
    } else {
      const index = allUnitConversions.value.findIndex(c => c.id === conversionForm.value.id)
      if (index !== -1) {
        allUnitConversions.value[index] = { ...conversionForm.value }
        ElMessage.success('更新换算关系成功')
      }
    }
    conversionDialogVisible.value = false
  })
}

// 删除换算关系
function deleteConversion(conversion: UnitConversion) {
  ElMessageBox.confirm(`确定要删除该换算关系吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = allUnitConversions.value.findIndex(c => c.id === conversion.id)
      if (index !== -1) {
        allUnitConversions.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 计算换算结果
function calculateConversion() {
  if (!calculator.value.fromUnitId || !calculator.value.toUnitId) {
    ElMessage.warning('请选择源单位和目标单位')
    return
  }

  calculator.value.result = convertUnit(calculator.value.value, calculator.value.fromUnitId, calculator.value.toUnitId)
}

// 生成新的单位ID
function generateNewUnitId(): number {
  return Math.max(0, ...allUnits.value.map(u => u.id)) + 1
}

// 生成新的换算关系ID
function generateNewConversionId(): number {
  return Math.max(0, ...allUnitConversions.value.map(c => c.id)) + 1
}

// 初始化
onMounted(() => {
  // 初始化换算计算器
  if (allUnits.value.length > 0) {
    calculator.value.fromUnitId = allUnits.value[0].id
    calculator.value.toUnitId = allUnits.value.length > 1 ? allUnits.value[1].id : allUnits.value[0].id
  }
})
</script>

<style scoped>
.unit-manage-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 400px;
}
.header-bar {
  margin-bottom: 16px;
  text-align: right;
}
.conversion-info {
  display: flex;
  align-items: center;
}
.preview-box {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}
.calculator-container {
  max-width: 800px;
  margin: 0 auto;
}
.calculator-card {
  margin-top: 20px;
}
.calculator-form {
  margin-bottom: 20px;
}
.calculator-form-inner {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}
.calculator-result {
  margin-top: 20px;
}
</style>
