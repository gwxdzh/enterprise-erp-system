import { ref } from 'vue'
import { allProducts, type Product } from './productData'

export interface SalesReturnItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  amount: number;
  warehouseId: number;
  warehouseName: string;
}

export type SalesReturnStatus = '草稿' | '待审核' | '已审核' | '已驳回' | '已关闭' | '已完成';

export interface SalesReturn {
  id: number;
  returnNo: string;
  orderNo: string;
  customerName: string;
  returnDate: string;
  items: SalesReturnItem[];
  totalAmount: number;
  status: SalesReturnStatus;
  reason: string;
  remark?: string;
}

export const allSalesReturns = ref<SalesReturn[]>([
  // 全部退货（已审核）
  {
    id: 1,
    returnNo: 'SR20250601001',
    orderNo: 'SO20250601007',
    customerName: '北京智联科技',
    returnDate: '2025-04-07',
    items: [
      { productId: 101, productName: '笔记本电脑', quantity: 1, price: 6000, amount: 6000, warehouseId: 2, warehouseName: '北京分仓' },
      { productId: 104, productName: '键盘', quantity: 2, price: 200, amount: 400, warehouseId: 2, warehouseName: '北京分仓' }
    ],
    totalAmount: 6400,
    status: '已审核',
    reason: '全部退货，客户终止项目',
    remark: '已全额退款'
  },
  // 退货申请中（待审核）
  {
    id: 2,
    returnNo: 'SR20250601002',
    orderNo: 'SO20250601008',
    customerName: '广州新视野',
    returnDate: '2025-04-08',
    items: [
      { productId: 105, productName: '打印机', quantity: 1, price: 2500, amount: 2500, warehouseId: 3, warehouseName: '广州分仓' },
      { productId: 102, productName: '鼠标', quantity: 5, price: 80, amount: 400, warehouseId: 3, warehouseName: '广州分仓' }
    ],
    totalAmount: 2900,
    status: '待审核',
    reason: '客户申请退货',
    remark: '待审核'
  },
  // 退货被驳回
  {
    id: 3,
    returnNo: 'SR20250601003',
    orderNo: 'SO20250601009',
    customerName: '南京云创',
    returnDate: '2025-04-09',
    items: [
      { productId: 101, productName: '笔记本电脑', quantity: 1, price: 6000, amount: 6000, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 6000,
    status: '已驳回',
    reason: '退货申请被驳回',
    remark: '不符合退货政策'
  },
  // 退货已关闭
  {
    id: 4,
    returnNo: 'SR20250601004',
    orderNo: 'SO20250601010',
    customerName: '成都数码港',
    returnDate: '2025-04-10',
    items: [
      { productId: 102, productName: '鼠标', quantity: 10, price: 80, amount: 800, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 800,
    status: '已关闭',
    reason: '退货流程已关闭',
    remark: '客户放弃退货'
  }
]); 