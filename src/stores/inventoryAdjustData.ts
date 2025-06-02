import { ref } from 'vue'

export interface InventoryAdjustRecord {
  id: number
  date: string
  warehouseId: number
  warehouseName: string
  productId: number
  productName: string
  type: '报损' | '报溢'
  quantity: number
  reason: string
  result: string
}

export const allInventoryAdjusts = ref<InventoryAdjustRecord[]>([
  
]) 