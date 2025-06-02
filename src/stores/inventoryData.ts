import { ref } from 'vue'
import { allProducts } from './productData'

export interface InventoryItem {
  id: number;
  productId: number;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  zone: string;
  location: string;
  batch: string;
  quantity: number;
  cost: number;
}

export const allInventory = ref<InventoryItem[]>([
  // 示例数据，仓库信息与warehouseData.ts一致
  { id: 1, productId: 101, productName: '笔记本电脑', warehouseId: 1, warehouseName: '上海总仓', zone: 'A区', location: 'A区1排1层', batch: 'B202401', quantity: 40, cost: 240000 },
  { id: 2, productId: 102, productName: '鼠标', warehouseId: 2, warehouseName: '北京分仓', zone: 'C区', location: 'C区1排1层', batch: 'B202402', quantity: 60, cost: 9600 },
  { id: 3, productId: 103, productName: '显示器', warehouseId: 1, warehouseName: '上海总仓', zone: 'B区', location: 'B区2排1层', batch: 'B202403', quantity: 30, cost: 21000 },
  { id: 4, productId: 104, productName: '键盘', warehouseId: 3, warehouseName: '广州分仓', zone: 'D区', location: 'D区1排1层', batch: 'B202404', quantity: 80, cost: 16000 },
  { id: 5, productId: 105, productName: '打印机', warehouseId: 1, warehouseName: '上海总仓', zone: 'A区', location: 'A区1排2层', batch: 'B202405', quantity: 20, cost: 50000 },
  { id: 6, productId: 106, productName: 'U盘', warehouseId: 1, warehouseName: '上海总仓', zone: 'A区', location: 'A区1排3层', batch: 'B202406', quantity: 150, cost: 4500 },
  // 北京分仓笔记本电脑，反映已完成调拨
  { id: 7, productId: 101, productName: '笔记本电脑', warehouseId: 2, warehouseName: '北京分仓', zone: 'C区', location: 'C区1排1层', batch: 'B202401', quantity: 10, cost: 60000 }
]) 