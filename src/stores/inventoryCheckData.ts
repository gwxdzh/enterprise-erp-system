import { ref } from 'vue'

// 盘点单明细项
export interface InventoryCheckItem {
  id: number;
  productId: number;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  zone: string;
  location: string;
  batch: string;
  systemQty: number; // 系统数量
  realQty: number;   // 实盘数量
  diff: number;      // 差异
}

// 盘点单
export interface InventoryCheck {
  id: number;
  date: string;
  warehouseId: number;
  warehouseName: string;
  status: '待盘点' | '待处理' | '已完成';
  items: InventoryCheckItem[];
}

export const allInventoryChecks = ref<InventoryCheck[]>([
  {
    id: 1001,
    date: '2024-06-01',
    warehouseId: 1,
    warehouseName: '上海总仓',
    status: '待盘点',
    items: [
      {
        id: 1, productId: 101, productName: '笔记本电脑', warehouseId: 1, warehouseName: '上海总仓', zone: 'A区', location: 'A区1排1层', batch: 'B202401', systemQty: 40, realQty: 0, diff: 0
      },
      {
        id: 2, productId: 105, productName: '打印机', warehouseId: 1, warehouseName: '上海总仓', zone: 'A区', location: 'A区1排2层', batch: 'B202405', systemQty: 20, realQty: 0, diff: 0
      }
    ]
  },
  {
    id: 1002,
    date: '2024-06-02',
    warehouseId: 2,
    warehouseName: '北京分仓',
    status: '待处理',
    items: [
      {
        id: 3, productId: 102, productName: '鼠标', warehouseId: 2, warehouseName: '北京分仓', zone: 'C区', location: 'C区1排1层', batch: 'B202402', systemQty: 60, realQty: 58, diff: -2
      },
      {
        id: 4, productId: 101, productName: '笔记本电脑', warehouseId: 2, warehouseName: '北京分仓', zone: 'C区', location: 'C区1排1层', batch: 'B202401', systemQty: 10, realQty: 10, diff: 0
      }
    ]
  },
  {
    id: 1003,
    date: '2024-06-03',
    warehouseId: 3,
    warehouseName: '广州分仓',
    status: '已完成',
    items: [
      {
        id: 5, productId: 104, productName: '键盘', warehouseId: 3, warehouseName: '广州分仓', zone: 'D区', location: 'D区1排1层', batch: 'B202404', systemQty: 80, realQty: 80, diff: 0
      }
    ]
  }
]) 