import { ref } from 'vue'
import { allWarehouses } from './warehouseData'
import { allInventory } from './inventoryData'

export type TransferStatus = '待审批' | '已驳回' | '待执行' | '已完成'

export interface TransferDetail {
  productId: number;
  productName: string;
  quantity: number;
  batch: string;
}

export interface TransferOrder {
  id: number;
  date: string;
  fromWarehouseId: number;
  fromWarehouseName: string;
  toWarehouseId: number;
  toWarehouseName: string;
  reason: string;
  status: TransferStatus;
  details: TransferDetail[];
}

export const allTransfers = ref<TransferOrder[]>([])

// 调拨执行时校验库存和容量
export function executeTransfer(order: TransferOrder): string {
  // 1. 检查调出仓库库存是否足够
  for (const detail of order.details) {
    const inv = allInventory.value.find(
      i => i.warehouseId === order.fromWarehouseId && i.productId === detail.productId && i.batch === detail.batch
    )
    if (!inv || inv.quantity < detail.quantity) {
      return `调出仓库【${order.fromWarehouseName}】商品【${detail.productName}】批次【${detail.batch}】库存不足`;
    }
  }
  // 2. 检查调入仓库库位容量（假设同商品同批次放第一个有容量的库位）
  for (const detail of order.details) {
    const warehouse = allWarehouses.value.find(w => w.id === order.toWarehouseId)
    if (!warehouse) return `调入仓库不存在`;
    // 找到有容量的库位
    const loc = warehouse.locations.find(l => (l.capacity ?? 0) - getLocationUsed(l, warehouse.id) >= detail.quantity)
    if (!loc) {
      return `调入仓库【${order.toWarehouseName}】无足够容量存放商品【${detail.productName}】`;
    }
  }
  // 3. 扣减调出仓库库存，增加调入仓库库存
  for (const detail of order.details) {
    // 扣减调出
    const outInv = allInventory.value.find(
      i => i.warehouseId === order.fromWarehouseId && i.productId === detail.productId && i.batch === detail.batch
    )
    if (outInv) {
      outInv.quantity -= detail.quantity
      // 如果扣减后为0，删除该库存记录
      if (outInv.quantity <= 0) {
        const idx = allInventory.value.findIndex(i => i === outInv)
        if (idx !== -1) allInventory.value.splice(idx, 1)
      }
    }
    // 增加调入（放第一个有容量的库位）
    const warehouse = allWarehouses.value.find(w => w.id === order.toWarehouseId)
    if (!warehouse) continue
    const loc = warehouse.locations.find(l => (l.capacity ?? 0) - getLocationUsed(l, warehouse.id) >= detail.quantity)
    if (loc) {
      // 查找是否已有该商品该批次库存
      let inInv = allInventory.value.find(
        i => i.warehouseId === order.toWarehouseId && i.productId === detail.productId && i.batch === detail.batch && i.location === loc.name
      )
      if (inInv) {
        inInv.quantity += detail.quantity
      } else {
        allInventory.value.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          productId: detail.productId,
          productName: detail.productName,
          warehouseId: order.toWarehouseId,
          warehouseName: order.toWarehouseName,
          zone: loc.zone,
          location: loc.name,
          batch: detail.batch,
          quantity: detail.quantity,
          cost: 0 // 可根据实际业务补充
        })
      }
    }
  }
  order.status = '已完成'
  return '调拨成功，库存已更新';
}

// 获取库位已用容量
function getLocationUsed(location, warehouseId) {
  return allInventory.value.filter(i => i.warehouseId === warehouseId && i.zone === location.zone && i.location === location.name).reduce((sum, i) => sum + i.quantity, 0)
} 