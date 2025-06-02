import { ref } from 'vue'
import { allProducts } from './productData'

export interface DeliveryItem {
  productId: number;
  productName: string;
  quantity: number;
  warehouseId: number;
  warehouseName: string;
}

export interface SalesDelivery {
  id: number;
  deliveryNo: string;
  orderNo: string;
  customerName: string;
  deliveryDate: string;
  items: DeliveryItem[];
  operator: string;
  remark?: string;
}

export const allSalesDeliveries = ref<SalesDelivery[]>([
  {
    id: 1,
    deliveryNo: 'SD20250601001',
    orderNo: 'SO20250601003',
    customerName: '深圳市新视界传媒',
    deliveryDate: '2025-04-02',
    items: [
      { productId: 103, productName: '显示器', quantity: 5, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    operator: '张三',
    remark: '待发货订单出库'
  },
  {
    id: 2,
    deliveryNo: 'SD20250601002',
    orderNo: 'SO20250601005',
    customerName: '杭州云帆网络有限公司',
    deliveryDate: '2025-04-03',
    items: [
      { productId: 105, productName: '打印机', quantity: 2, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    operator: '李四',
    remark: '已完成订单出库记录'
  },
  {
    id: 3,
    deliveryNo: 'SD20250601003',
    orderNo: 'SO20250601011',
    customerName: '苏州微电子',
    deliveryDate: '2025-04-06',
    items: [
      { productId: 105, productName: '打印机', quantity: 3, warehouseId: 1, warehouseName: '上海总仓' },
      { productId: 106, productName: 'U盘', quantity: 20, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    operator: '王五',
    remark: '多商品出库单'
  }
]); 