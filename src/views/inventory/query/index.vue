<template>
  <div class="inventory-query-container">
    <div class="filter-bar">
      <el-form :inline="true" :model="filters" class="filter-form" label-width="50px">
        <el-form-item label="商品" class="filter-item">
          <el-input v-model="filters.product" placeholder="请输入商品名称/编号" clearable size="small" />
        </el-form-item>
        <el-form-item label="仓库" class="filter-item" style="width: 150px">
          <el-select v-model="filters.warehouse" placeholder="请选择仓库" clearable size="small">
            <el-option v-for="w in warehouseOptions" :key="w.value" :label="w.label" :value="w.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="批次" class="filter-item">
          <el-input v-model="filters.batch" placeholder="请输入批次号" clearable size="small" />
        </el-form-item>
        <el-form-item class="filter-item filter-btns">
          <el-button type="primary" size="small">查询</el-button>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="table-toolbar" style="display: flex; justify-content: flex-end; margin-bottom: 8px">
      <el-button type="success" @click="exportReport">导出报表</el-button>
    </div>
    <el-table :data="pagedData" style="width: 100%; margin-top: 20px">
      <el-table-column prop="productName" label="商品名称" min-width="120" />
      <el-table-column prop="warehouseName" label="仓库" min-width="100" />
      <el-table-column prop="zone" label="仓库分区" min-width="100" />
      <el-table-column prop="location" label="分区库位" min-width="120" />
      <el-table-column prop="batch" label="批次" min-width="100" />
      <el-table-column prop="quantity" label="库存数量" min-width="100" />
      <el-table-column prop="cost" label="库存成本" min-width="100" :formatter="({ cost }) => formatThousand(cost)" />
    </el-table>
    <div class="pagination" style="margin-top: 16px; text-align: right">
      <el-pagination background layout="total, prev, pager, next, jumper" :total="(tableData.value && tableData.value.length) || 0" :page-size="pageSize" v-model:current-page="currentPage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { allInventory } from '@/stores/inventoryData'

const filters = reactive({
  product: '',
  warehouse: '',
  batch: ''
})

const warehouseOptions = ref([
  { label: '上海总仓', value: '上海总仓' },
  { label: '北京分仓', value: '北京分仓' },
  { label: '广州分仓', value: '广州分仓' }
])

const pageSize = 10
const currentPage = ref(1)

// 计算筛选后的库存数据
const tableData = computed(() => {
  if (!Array.isArray(allInventory.value)) return []
  return allInventory.value.filter(item => {
    const matchProduct = !filters.product || item.productName.includes(filters.product) || String(item.productId).includes(filters.product)
    const matchWarehouse = !filters.warehouse || item.warehouseName === filters.warehouse
    const matchBatch = !filters.batch || item.batch.includes(filters.batch)
    return matchProduct && matchWarehouse && matchBatch
  })
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return tableData.value.slice(start, start + pageSize)
})

function resetFilters() {
  filters.product = ''
  filters.warehouse = ''
  filters.batch = ''
  currentPage.value = 1
}

function formatThousand(val: number) {
  if (typeof val !== 'number') return val
  return val.toLocaleString('zh-CN')
}

function exportReport() {
  let csv = '商品名称,商品编号,仓库,分区,库位,批次,库存数量,库存成本\n'
  tableData.value.forEach(item => {
    csv += `${item.productName},${item.productId},${item.warehouseName},${item.zone},${item.location},${item.batch},${item.quantity},${item.cost}\n`
  })
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '库存报表.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.inventory-query-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 400px;
}
.filter-bar {
  margin-bottom: 16px;
}
.filter-form {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.filter-item {
  margin-bottom: 0 !important;
  margin-right: 8px;
}
.filter-btns .el-button {
  min-width: 70px;
  margin-right: 4px;
}
</style>
