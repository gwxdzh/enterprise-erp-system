import { ref } from 'vue'
import { allProducts, type Product } from './productData'

export interface SalesOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  amount: number;
  warehouseId?: number | null;
  warehouseName?: string;
}

export type SalesOrderStatus = '草稿' | '待审核' | '待发货' | '部分发货' | '待收款' | '已完成' | '已关闭' | '退货待处理' | '退货成功' | '退货待审核' | '退货已驳回';

export type SalesOrderReturnStatus = 'SUCCESS' | 'NONE' | 'APPLYING' | 'REJECTED' | 'CLOSED';

export interface SalesOrder {
  id: number | null;
  orderNo: string;
  customerId: number | null;
  customerName: string;
  orderDate: string;
  items: SalesOrderItem[];
  totalAmount: number;
  status: SalesOrderStatus;
  remark?: string;
  returnStatus?: SalesOrderReturnStatus;
  prevStatus?: SalesOrderStatus;
}

// 获取所有的商品ID列表，用于筛选有效商品
const validProductIds = allProducts.value.map(product => product.id);

// 从商品ID获取商品名称和价格
function getProductInfo(productId: number): { name: string, price: number } {
  const product = allProducts.value.find(p => p.id === productId);
  if (product) {
    return { name: product.name, price: product.price };
  }
  return { name: '未知商品', price: 0 };
}

// 模拟销售订单数据
export const allSalesOrders = ref<SalesOrder[]>([
  {
    id: 1,
    orderNo: 'SO20250601001',
    customerId: 1,
    customerName: '上海华信科技有限公司',
    orderDate: '2025-04-01',
    items: [
      { productId: 101, productName: '笔记本电脑', quantity: 2, price: 6000, amount: 12000, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 12000,
    status: '待审核',
    remark: '加急发货'
  },
  {
    id: 2,
    orderNo: 'SO20250601002',
    customerId: 2,
    customerName: '李明',
    orderDate: '2025-04-01',
    items: [
      { productId: 102, productName: '鼠标', quantity: 10, price: 80, amount: 800, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 800,
    status: '草稿'
  },
  {
    id: 3,
    orderNo: 'SO20250601003',
    customerId: 3,
    customerName: '深圳市新视界传媒',
    orderDate: '2025-04-02',
    items: [
      { productId: 103, productName: '显示器', quantity: 5, price: 700, amount: 3500, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 3500,
    status: '待发货'
  },
  {
    id: 4,
    orderNo: 'SO20250601004',
    customerId: 4,
    customerName: '赵静',
    orderDate: '2025-04-02',
    items: [
      { productId: 104, productName: '键盘', quantity: 6, price: 200, amount: 1200, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 1200,
    status: '待收款'
  },
  {
    id: 5,
    orderNo: 'SO20250601005',
    customerId: 5,
    customerName: '杭州云帆网络有限公司',
    orderDate: '2025-04-03',
    items: [
      { productId: 105, productName: '打印机', quantity: 2, price: 2500, amount: 5000, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 5000,
    status: '已完成'
  },
  {
    id: 6,
    orderNo: 'SO20250601006',
    customerId: 6,
    customerName: '王芳',
    orderDate: '2025-04-03',
    items: [
      { productId: 106, productName: 'U盘', quantity: 30, price: 30, amount: 900, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 900,
    status: '已关闭'
  },
  {
    id: 7,
    orderNo: 'SO20250601007',
    customerId: 7,
    customerName: '北京智联科技',
    orderDate: '2025-04-04',
    items: [
      { productId: 101, productName: '笔记本电脑', quantity: 1, price: 6000, amount: 6000, warehouseId: 2, warehouseName: '北京分仓' },
      { productId: 104, productName: '键盘', quantity: 2, price: 200, amount: 400, warehouseId: 2, warehouseName: '北京分仓' }
    ],
    totalAmount: 6400,
    status: '退货成功',
    remark: '全部退货',
    returnStatus: 'SUCCESS',
    prevStatus: '待收款'
  },
  {
    id: 8,
    orderNo: 'SO20250601008',
    customerId: 8,
    customerName: '广州新视野',
    orderDate: '2025-04-04',
    items: [
      { productId: 105, productName: '打印机', quantity: 1, price: 2500, amount: 2500, warehouseId: 3, warehouseName: '广州分仓' },
      { productId: 102, productName: '鼠标', quantity: 5, price: 80, amount: 400, warehouseId: 3, warehouseName: '广州分仓' }
    ],
    totalAmount: 2900,
    status: '退货待审核',
    remark: '退货申请中',
    returnStatus: 'APPLYING',
    prevStatus: '待收款'
  },
  {
    id: 9,
    orderNo: 'SO20250601009',
    customerId: 9,
    customerName: '南京云创',
    orderDate: '2025-04-05',
    items: [
      { productId: 101, productName: '笔记本电脑', quantity: 2, price: 6000, amount: 12000, warehouseId: 1, warehouseName: '上海总仓' },
      { productId: 103, productName: '显示器', quantity: 2, price: 700, amount: 1400, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 13400,
    status: '待收款',
    remark: '退货被驳回',
    returnStatus: 'REJECTED',
    prevStatus: '待收款'
  },
  {
    id: 10,
    orderNo: 'SO20250601010',
    customerId: 10,
    customerName: '成都数码港',
    orderDate: '2025-04-05',
    items: [
      { productId: 102, productName: '鼠标', quantity: 10, price: 80, amount: 800, warehouseId: 1, warehouseName: '上海总仓' },
      { productId: 104, productName: '键盘', quantity: 5, price: 200, amount: 1000, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 1800,
    status: '待收款',
    remark: '退货已关闭',
    returnStatus: 'CLOSED',
    prevStatus: '待收款'
  },
  {
    id: 11,
    orderNo: 'SO20250601011',
    customerId: 11,
    customerName: '苏州微电子',
    orderDate: '2025-04-06',
    items: [
      { productId: 105, productName: '打印机', quantity: 3, price: 2500, amount: 7500, warehouseId: 1, warehouseName: '上海总仓' },
      { productId: 106, productName: 'U盘', quantity: 20, price: 30, amount: 600, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 8100,
    status: '已完成',
    remark: '无退货',
    returnStatus: 'NONE'
  },
  {
    id: 12,
    orderNo: 'SO20250601012',
    customerId: 12,
    customerName: '天津启明星',
    orderDate: '2025-04-06',
    items: [
      { productId: 103, productName: '显示器', quantity: 4, price: 700, amount: 2800, warehouseId: 1, warehouseName: '上海总仓' },
      { productId: 102, productName: '鼠标', quantity: 8, price: 80, amount: 640, warehouseId: 1, warehouseName: '上海总仓' }
    ],
    totalAmount: 3440,
    status: '已完成',
    remark: '无退货',
    returnStatus: 'NONE'
  }
]); 