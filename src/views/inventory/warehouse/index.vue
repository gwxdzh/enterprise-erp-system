<template>
  <div class="warehouse-container">
    <!-- 上方仓库列表 -->
    <div class="warehouse-list">
      <div class="list-header" style="display: flex; justify-content: space-between; align-items: center">
        <span>仓库列表</span>
        <el-button type="primary" size="small" :disabled="!hasInventoryEditPermission()" @click="openWarehouseDialog()">新增仓库</el-button>
      </div>
      <el-table :data="warehouses" highlight-current-row @current-change="handleWarehouseSelect" :row-class-name="rowClassName" style="width: 100%">
        <el-table-column prop="name" label="仓库名称" min-width="120" />
        <el-table-column prop="address" label="地址" min-width="180" />
        <el-table-column prop="manager" label="负责人" min-width="100" />
        <el-table-column label="操作" width="140">
          <template #default="scope">
            <el-button size="small" :disabled="!hasInventoryEditPermission()" @click.stop="openWarehouseDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" :disabled="!hasInventoryEditPermission()" @click.stop="deleteWarehouse(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 下方平面图区域 -->
    <div class="layout-area">
      <div class="layout-toolbar">
        <el-button type="primary" size="small" :disabled="!selectedWarehouse || !hasInventoryEditPermission()" @click="openZoneDialog()">新增分区</el-button>
        <el-button type="primary" size="small" :disabled="!selectedWarehouse || !hasInventoryEditPermission()" @click="openLocationDialog()">新增库位</el-button>
      </div>
      <div v-if="selectedWarehouse" class="zones-wrap">
        <div v-for="zone in zones" :key="zone.zone" class="zone-block">
          <div class="zone-header">
            <div class="zone-header-left">
              <el-input v-model="zone.name" size="small" class="zone-title" :disabled="!hasInventoryEditPermission()" @change="renameZone(zone.zone, zone.name)" />
              <el-button size="small" type="danger" :disabled="!hasInventoryEditPermission()" @click="confirmDeleteZone(zone.zone, zone.name)" circle>
                <el-icon style="vertical-align: middle">
                  <Delete />
                </el-icon>
              </el-button>
            </div>
            <el-button type="primary" size="small" :disabled="!hasInventoryEditPermission()" @click="openLocationDialog(undefined, zone.zone)">新增库位</el-button>
          </div>
          <draggable v-model="zoneLocations[zone.zone]" group="locations" item-key="id" class="location-grid" @end="onDragEnd(zone.zone)">
            <template #item="{ element }">
              <div class="location-card" :style="{ borderColor: getLocationCapacityColor(element, selectedWarehouse.id) }" @mouseenter="activeLocationId = element.id" @mouseleave="activeLocationId = null" @click="activeLocationId = element.id">
                <div class="loc-title">{{ element.code }}</div>
                <div class="loc-name">{{ element.name }}</div>
                <div class="loc-remark" v-if="element.remark">{{ element.remark }}</div>
                <div class="loc-used">占用容量：{{ getLocationUsedCapacity(element, selectedWarehouse.id) }} / {{ element.capacity ?? '-' }}</div>
                <div class="loc-actions" v-if="activeLocationId === element.id">
                  <el-button size="mini" :disabled="!hasInventoryEditPermission()" @click.stop="openLocationDialog(element)">编辑</el-button>
                  <el-button size="mini" type="danger" :disabled="!hasInventoryEditPermission()" @click.stop="deleteLocation(element)">删除</el-button>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
      <div v-else class="empty-tip">请选择左侧仓库以管理库位布局</div>
    </div>
    <!-- 仓库弹窗 -->
    <el-dialog :title="warehouseDialogTitle" v-model="warehouseDialogVisible" width="400px">
      <el-form :model="warehouseForm" label-width="80px">
        <el-form-item label="仓库名称">
          <el-input v-model="warehouseForm.name" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="warehouseForm.address" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="warehouseForm.manager" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="warehouseDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!hasInventoryEditPermission()" @click="saveWarehouse">保存</el-button>
      </template>
    </el-dialog>
    <!-- 分区弹窗 -->
    <el-dialog title="新增分区" v-model="zoneDialogVisible" width="350px">
      <el-form :model="zoneForm" label-width="70px">
        <el-form-item label="分区标识">
          <el-input v-model="zoneForm.zone" placeholder="如A区、B区" />
        </el-form-item>
        <el-form-item label="分区名称">
          <el-input v-model="zoneForm.name" placeholder="如主通道区" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="zoneDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!hasInventoryEditPermission()" @click="saveZone">保存</el-button>
      </template>
    </el-dialog>
    <!-- 库位弹窗 -->
    <el-dialog :title="locationDialogTitle" v-model="locationDialogVisible" width="400px">
      <el-form :model="locationForm" label-width="80px">
        <el-form-item label="库位编码">
          <el-input v-model="locationForm.code" />
        </el-form-item>
        <el-form-item label="库位名称">
          <el-input v-model="locationForm.name" />
        </el-form-item>
        <el-form-item label="分区">
          <span>{{ locationForm.zone }}</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="locationForm.remark" />
        </el-form-item>
        <el-form-item label="库位容量">
          <el-input-number v-model="locationForm.capacity" :min="0" :max="999999" :step="1" controls-position="right" style="width: 100%" placeholder="请输入容量" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="locationDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!hasInventoryEditPermission()" @click="saveLocation">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { allWarehouses, type Warehouse, type Location } from '../../../stores/warehouseData'
import { allInventory } from '../../../stores/inventoryData'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import { useUserStore } from '../../../stores/user'

// 获取用户store
const userStore = useUserStore()

// 检查是否有库存编辑权限
const hasInventoryEditPermission = () => {
  return userStore.hasPermission('inventory:edit')
}

const warehouses = computed(() => allWarehouses.value)
const selectedWarehouse = ref<Warehouse | null>(warehouses.value[0] || null)

function handleWarehouseSelect(row: Warehouse) {
  selectedWarehouse.value = row
}
function rowClassName({ row }: { row: Warehouse }) {
  return selectedWarehouse.value && row.id === selectedWarehouse.value.id ? 'current-row' : ''
}

// 分区相关
const zones = computed(() => {
  if (!selectedWarehouse.value) return []
  return selectedWarehouse.value.zones
})
const zoneLocations = computed(() => {
  const res: Record<string, Location[]> = {}
  if (!selectedWarehouse.value) return res
  for (const z of zones.value) {
    res[z.zone] = selectedWarehouse.value.locations.filter(l => l.zone === z.zone).sort((a, b) => a.order - b.order)
  }
  return res
})
function renameZone(zoneKey: string, newName: string) {
  if (!selectedWarehouse.value) return
  const zoneObj = selectedWarehouse.value.zones.find(z => z.zone === zoneKey)
  if (zoneObj) zoneObj.name = newName
}
const zoneDialogVisible = ref(false)
const zoneForm = reactive({ zone: '', name: '' })
function openZoneDialog() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限管理仓库分区')
    return
  }
  // 自动补全分区标识（A区、B区...）
  if (selectedWarehouse.value) {
    const usedZones = selectedWarehouse.value.zones.map(z => z.zone)
    let autoZone = ''
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i) // A~Z
      const zoneStr = letter + '区'
      if (!usedZones.includes(zoneStr)) {
        autoZone = zoneStr
        break
      }
    }
    zoneForm.zone = autoZone
  } else {
    zoneForm.zone = ''
  }
  zoneForm.name = ''
  zoneDialogVisible.value = true
}
function saveZone() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限编辑仓库分区')
    return
  }
  if (!zoneForm.zone || !zoneForm.name) {
    ElMessage.warning('请输入分区标识和分区名')
    return
  }
  if (!selectedWarehouse.value) return
  if (selectedWarehouse.value.zones.some(z => z.zone === zoneForm.zone)) {
    ElMessage.warning('分区已存在')
    return
  }
  selectedWarehouse.value.zones.push({ zone: zoneForm.zone, name: zoneForm.name })
  zoneDialogVisible.value = false

  // 自动为新分区创建一个库位
  const zone = zoneForm.zone
  const locations = selectedWarehouse.value.locations
  const newId = Math.max(0, ...locations.map(l => l.id ?? 0)) + 1
  const code = getNextLocationCode(zone)
  const name = parseLocationName(code)
  const maxOrder = Math.max(0, ...locations.filter(l => l.zone === zone).map(l => l.order ?? 0))
  locations.push({
    id: newId,
    code,
    name,
    zone,
    order: maxOrder + 1,
    remark: ''
  })
}
function deleteZone(zoneKey: string) {
  if (!selectedWarehouse.value) return
  selectedWarehouse.value.locations = selectedWarehouse.value.locations.filter(l => l.zone !== zoneKey)
  selectedWarehouse.value.zones = selectedWarehouse.value.zones.filter(z => z.zone !== zoneKey)
}

// 仓库弹窗
const warehouseDialogVisible = ref(false)
const warehouseDialogTitle = ref('')
const warehouseForm = reactive<Partial<Warehouse>>({})
let editingWarehouseId: number | null = null
function openWarehouseDialog(row?: Warehouse) {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限管理仓库')
    return
  }
  if (row) {
    warehouseDialogTitle.value = '编辑仓库'
    Object.assign(warehouseForm, row)
    editingWarehouseId = row.id
  } else {
    warehouseDialogTitle.value = '新增仓库'
    warehouseForm.name = ''
    warehouseForm.address = ''
    warehouseForm.manager = ''
    editingWarehouseId = null
  }
  warehouseDialogVisible.value = true
}
function saveWarehouse() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限编辑仓库')
    return
  }
  if (!warehouseForm.name || !warehouseForm.address || !warehouseForm.manager) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (editingWarehouseId) {
    // 编辑
    const idx = allWarehouses.value.findIndex(w => w.id === editingWarehouseId)
    if (idx !== -1) {
      allWarehouses.value[idx] = { ...allWarehouses.value[idx], ...warehouseForm }
      ElMessage.success('编辑成功')
    }
  } else {
    // 新增
    const newId = Math.max(0, ...allWarehouses.value.map(w => w.id)) + 1
    // 自动创建A区分区和一个库位
    const zone = 'A区'
    const zones = [{ zone, name: zone }]
    const code = getNextLocationCode(zone)
    const name = parseLocationName(code)
    const locations = [
      {
        id: 1,
        code,
        name,
        zone,
        order: 1,
        remark: ''
      }
    ]
    allWarehouses.value.push({
      id: newId,
      name: warehouseForm.name!,
      address: warehouseForm.address!,
      manager: warehouseForm.manager!,
      zones,
      locations
    })
    ElMessage.success('新增成功')
  }
  warehouseDialogVisible.value = false
}
function deleteWarehouse(row: Warehouse) {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限删除仓库')
    return
  }
  ElMessageBox.confirm(`确定删除仓库"${row.name}"吗？`, '提示', { type: 'warning' }).then(() => {
    allWarehouses.value = allWarehouses.value.filter(w => w.id !== row.id)
    if (selectedWarehouse.value?.id === row.id) {
      selectedWarehouse.value = allWarehouses.value[0] || null
    }
    ElMessage.success('删除成功')
  })
}

// 库位弹窗
const locationDialogVisible = ref(false)
const locationDialogTitle = ref('新增库位')
const locationForm = reactive<Partial<Location>>({})
let editingLocationId: number | null = null
let isAddingLocation = false
const activeLocationId = ref<number | null>(null)
function getNextLocationCode(zone: string) {
  if (!selectedWarehouse.value) return ''
  // 找到该分区下所有编码
  const codes = selectedWarehouse.value.locations.filter(l => l.zone === zone).map(l => l.code)
  // 匹配最大编号
  let maxNo = 0
  codes.forEach(code => {
    const match = code.match(/-(\d{2})$/)
    if (match) {
      const no = parseInt(match[1], 10)
      if (no > maxNo) maxNo = no
    }
  })
  const nextNo = (maxNo + 1).toString().padStart(2, '0')
  // 默认排为01
  return `${zone[0]}-01-${nextNo}`
}
function parseLocationName(code: string) {
  // 例：B-02-01 → B区2排一层
  const match = code.match(/^([A-Z])-?(\d{2})-?(\d{2})$/i)
  if (match) {
    const zone = match[1].toUpperCase() + '区'
    const row = parseInt(match[2], 10) + '排'
    const layer = parseInt(match[3], 10) + '层'
    return `${zone}${row}${numToChinese(parseInt(match[3], 10))}层`
  }
  return ''
}
function numToChinese(num: number) {
  // 1→一，2→二，3→三...
  const arr = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (num >= 1 && num <= 10) return arr[num]
  return num + ''
}
function parseZoneFromCode(code: string) {
  // B-02-01 → B区
  const match = code.match(/^([A-Z])/i)
  if (match) return match[1].toUpperCase() + '区'
  return ''
}
function openLocationDialog(row?: Location, zoneParam?: string) {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限管理库位')
    return
  }
  if (!selectedWarehouse.value) return
  if (row) {
    locationDialogTitle.value = '编辑库位'
    Object.assign(locationForm, row)
    editingLocationId = row.id
    isAddingLocation = false
  } else {
    locationDialogTitle.value = '新增库位'
    locationForm.zone = zoneParam || zones.value[0]?.zone || ''
    locationForm.code = getNextLocationCode(locationForm.zone || '')
    locationForm.name = parseLocationName(locationForm.code || '')
    locationForm.remark = ''
    editingLocationId = null
    isAddingLocation = true
  }
  locationDialogVisible.value = true
}
watch(
  () => locationForm.code,
  val => {
    if (!val) return
    locationForm.name = parseLocationName(val)
    const zone = parseZoneFromCode(val)
    if (zone && zones.value.some(z => z.zone === zone)) {
      locationForm.zone = zone
    }
  }
)
watch(
  () => locationForm.zone,
  (val, oldVal) => {
    if (!val || !isAddingLocation) return
    // 只有分区真的变化才更新
    if (val !== oldVal) {
      locationForm.code = getNextLocationCode(val)
      locationForm.name = parseLocationName(locationForm.code || '')
    }
  }
)
function saveLocation() {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限编辑库位')
    return
  }
  if (!selectedWarehouse.value) return
  if (!locationForm.code || !locationForm.name || !locationForm.zone) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (editingLocationId) {
    // 编辑
    const idx = selectedWarehouse.value.locations.findIndex(l => l.id === editingLocationId)
    if (idx !== -1) {
      selectedWarehouse.value.locations[idx] = {
        ...selectedWarehouse.value.locations[idx],
        ...locationForm,
        capacity: locationForm.capacity // 确保capacity被写入
      }
      ElMessage.success('编辑成功')
    }
  } else {
    // 新增
    const newId = Math.max(0, ...selectedWarehouse.value.locations.map(l => l.id)) + 1
    const maxOrder = Math.max(0, ...selectedWarehouse.value.locations.filter(l => l.zone === locationForm.zone).map(l => l.order))
    selectedWarehouse.value.locations.push({
      id: newId,
      code: locationForm.code!,
      name: locationForm.name!,
      zone: locationForm.zone!,
      order: maxOrder + 1,
      remark: locationForm.remark,
      capacity: locationForm.capacity // 新增时也写入capacity
    })
    ElMessage.success('新增成功')
  }
  locationDialogVisible.value = false
}
function deleteLocation(row: Location) {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限删除库位')
    return
  }
  if (!selectedWarehouse.value) return
  ElMessageBox.confirm(`确定删除库位"${row.name}"吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger'
  })
    .then(() => {
      selectedWarehouse.value!.locations = selectedWarehouse.value!.locations.filter(l => l.id !== row.id)
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}
function onDragEnd(zone: string) {
  if (!selectedWarehouse.value) return
  // 重新排序order
  const locs = zoneLocations.value[zone]
  locs.forEach((l, idx) => {
    const real = selectedWarehouse.value!.locations.find(x => x.id === l.id)
    if (real) real.order = idx + 1
  })
}

// 新增分区删除确认方法
function confirmDeleteZone(zoneKey: string, zoneName: string) {
  if (!hasInventoryEditPermission()) {
    ElMessage.warning('暂无权限删除仓库分区')
    return
  }
  ElMessageBox.confirm(`确定删除分区"${zoneName}"及其下所有库位吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger'
  })
    .then(() => {
      deleteZone(zoneKey)
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

// 计算库位已用容量和剩余容量
function getLocationUsedCapacity(location: Location, warehouseId: number) {
  // 统计该库位所有库存数量总和
  return allInventory.value.filter(item => item.warehouseId === warehouseId && item.zone === location.zone && item.location === location.name).reduce((sum, item) => sum + item.quantity, 0)
}
function getLocationRemainCapacity(location: Location, warehouseId: number) {
  const used = getLocationUsedCapacity(location, warehouseId)
  return (location.capacity ?? 0) - used
}
function getLocationCapacityColor(location: Location, warehouseId: number) {
  const capacity = location.capacity ?? 0
  if (!capacity) return '#e4e7ed' // 默认灰色
  const remain = getLocationRemainCapacity(location, warehouseId)
  const ratio = remain / capacity
  if (ratio > 0.5) return '#67c23a' // 绿色
  if (ratio > 0.2) return '#e6a23c' // 橙色
  return '#f56c6c' // 红色
}
</script>

<style scoped>
.warehouse-container {
  padding: 20px;
}
.warehouse-list {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 16px;
  margin-bottom: 24px;
}
.layout-area {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 16px;
}
.layout-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.zones-wrap {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  align-items: stretch;
}
.zone-block {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  min-width: 320px;
  min-height: 340px;
  height: 340px;
  flex: 1 1 320px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-sizing: border-box;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.zone-block::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Webkit */
}
.zone-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.zone-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.zone-title {
  font-weight: bold;
  font-size: 16px;
  width: 120px;
}
.location-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 24px;
  align-items: flex-start;
  justify-content: flex-start;
}
.location-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 10px 12px;
  width: 170px;
  height: 150px;
  min-height: 150px;
  max-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid #e4e7ed;
  transition: box-shadow 0.2s, transform 0.2s;
  overflow: hidden;
  border-width: 2px;
}
.location-card:hover {
  box-shadow: 0 6px 18px rgba(64, 158, 255, 0.15);
  transform: scale(1.04);
}
.loc-title {
  font-weight: bold;
  color: #409eff;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
.loc-name {
  font-size: 13px;
  margin: 2px 0 4px 0;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
.loc-remark {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
.loc-used {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.loc-capacity {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.loc-actions {
  margin-top: auto;
  display: flex;
  gap: 13px;
  width: 100%;
  justify-content: flex-end;
}
.empty-tip {
  color: #bbb;
  text-align: center;
  padding: 40px 0;
}
.current-row {
  background: #e6f7ff !important;
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
</style>
