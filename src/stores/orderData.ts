import { ref } from 'vue'
import { allProducts } from './productData'
import { getUnitName } from './unitData'

export type OrderStatus = '待审核' | '待入库' | '已入库' | '已取消' | '关联退款' | '待支付'; // 移除 '待付款'

export interface OrderItem {
  productId: number; // 商品ID
  name: string; // 商品名称
  spec: string; // 规格
  unitId: number; // 单位ID
  unit: string; // 单位名称
  qty: number; // 数量
  price: number; // 单价
}

export interface Order {
  id: number | null; // 订单ID
  orderNo: string; // 订单号
  supplier: string; // 供应商名称
  orderDate: string; // 下单日期 (YYYY-MM-DD)
  amount: number; // 订单总金额
  status: OrderStatus; // 订单状态
  items: OrderItem[]; // 采购商品列表
  // 可选字段，用于入库、质检等后续流程
  warehousingDate?: string; // 入库日期 (YYYY-MM-DD)
  warehousedQty?: number; // 已入库数量
  qcResult?: '合格' | '不合格' | '未质检'; // 质检结果
  qcUser?: string; // 质检员
  // 应付账款相关字段
  paidAmount?: number; // 已付金额
  unpaidAmount?: number; // 未付金额
  dueDate?: string; // 到期日 (YYYY-MM-DD)
  paymentDate?: string; // 最近支付日期 (YYYY-MM-DD)
  paymentMethod?: string; // 支付方式
  paymentChannel?: string; // 支付渠道
}

// 获取商品单位信息
export function getProductUnitInfo(productId: number): { unitId: number, unitName: string } {
  const product = allProducts.value.find(p => p.id === productId);
  if (!product || !product.unitId) {
    return { unitId: 1, unitName: '个' }; // 默认值
  }
  return { 
    unitId: product.unitId,
    unitName: getUnitName(product.unitId) 
  };
}

// 模拟采购订单数据
export const allOrders = ref<Order[]>([
  { 
    id: 1, 
    orderNo: 'PO20251027001', 
    supplier: '上海文具有限公司', 
    orderDate: '2025-10-27', 
    amount: 12400.00, 
    status: '已入库', 
    items: [
      { productId: 106, name: 'U盘', spec: '32G USB3.0', unitId: 1, unit: '个', qty: 100, price: 30.00 },
      { productId: 102, name: '鼠标', spec: '无线', unitId: 1, unit: '个', qty: 80, price: 80.00 }
    ], 
    qcResult: '合格', 
    qcUser: '质检员X', 
    warehousingDate: '2025-10-27', 
    warehousedQty: 180, 
    paidAmount: 12400.00, 
    unpaidAmount: 0, 
    dueDate: '2025-11-26', 
    paymentDate: '2025-11-20', 
    paymentMethod: '支付宝', 
    paymentChannel: '在线支付' 
  },
  { 
    id: 2, 
    orderNo: 'PO20251028002', 
    supplier: '广州纸业集团', 
    orderDate: '2025-10-28', 
    amount: 5000.00, 
    status: '待支付', 
    items: [
      { productId: 105, name: '打印机', spec: '激光', unitId: 1, unit: '个', qty: 2, price: 2500.00 }
    ], 
    qcResult: '合格', 
    qcUser: '质检员Y', 
    warehousingDate: '2025-10-28', 
    warehousedQty: 2, 
    paidAmount: 0, 
    unpaidAmount: 5000.00, 
    dueDate: '2025-11-27', 
    paymentDate: undefined 
  },
  { 
    id: 3, 
    orderNo: 'PO20251029003', 
    supplier: '北京办公设备', 
    orderDate: '2025-10-29', 
    amount: 30000.00, 
    status: '待入库', 
    items: [
      { productId: 101, name: '笔记本电脑', spec: '15.6寸 i5 16G', unitId: 1, unit: '个', qty: 5, price: 6000.00 }
    ], 
    qcResult: '合格', 
    qcUser: '质检员Z', 
    paidAmount: 0, 
    unpaidAmount: 30000.00, 
    dueDate: undefined, 
    paymentDate: undefined 
  },
  { 
    id: 4, 
    orderNo: 'PO20251030004', 
    supplier: '上海文具有限公司', 
    orderDate: '2025-10-30', 
    amount: 16000.00, 
    status: '待审核', 
    items: [
      { productId: 104, name: '键盘', spec: '机械', unitId: 1, unit: '个', qty: 80, price: 200.00 }
    ], 
    qcResult: '未质检', 
    paidAmount: 0, 
    unpaidAmount: 16000.00, 
    dueDate: undefined, 
    paymentDate: undefined 
  },
  { 
    id: 5, 
    orderNo: 'PO20251101005', 
    supplier: '广州纸业集团', 
    orderDate: '2025-11-01', 
    amount: 21000.00, 
    status: '已取消', 
    items: [
      { productId: 103, name: '显示器', spec: '24寸 IPS', unitId: 1, unit: '个', qty: 30, price: 700.00 }
    ], 
    qcResult: '未质检', 
    paidAmount: 0, 
    unpaidAmount: 0, 
    dueDate: undefined, 
    paymentDate: undefined 
  },
  { 
    id: 6, 
    orderNo: 'PO20251102006', 
    supplier: '北京办公设备', 
    orderDate: '2025-11-02', 
    amount: 6000.00, 
    status: '已入库', 
    items: [
      { productId: 103, name: '显示器', spec: '24寸 IPS', unitId: 1, unit: '个', qty: 5, price: 700.00 },
      { productId: 102, name: '鼠标', spec: '无线', unitId: 1, unit: '个', qty: 50, price: 80.00 }
    ], 
    qcResult: '合格', 
    qcUser: '质检员A', 
    warehousingDate: '2025-11-05', 
    warehousedQty: 55, 
    paidAmount: 0, 
    unpaidAmount: 6000.00, 
    dueDate: '2025-12-02', 
    paymentDate: undefined 
  },
  { 
    id: 7, 
    orderNo: 'PO20251106007', 
    supplier: '深圳电子科技', 
    orderDate: '2025-11-06', 
    amount: 3600.00, 
    status: '待审核', 
    items: [
      { productId: 104, name: '键盘', spec: '机械', unitId: 1, unit: '个', qty: 18, price: 200.00 }
    ], 
    qcResult: '未质检', 
    paidAmount: 0, 
    unpaidAmount: 3600.00, 
    dueDate: undefined, 
    paymentDate: undefined 
  },
  { 
    id: 8, 
    orderNo: 'PO20251107008', 
    supplier: '杭州服装厂', 
    orderDate: '2025-11-07', 
    amount: 24000.00, 
    status: '待入库', 
    items: [
      { productId: 101, name: '笔记本电脑', spec: '15.6寸 i5 16G', unitId: 1, unit: '个', qty: 4, price: 6000.00 }
    ], 
    qcResult: '合格', 
    qcUser: '质检员B', 
    paidAmount: 0, 
    unpaidAmount: 24000.00, 
    dueDate: undefined, 
    paymentDate: undefined 
  },
  { 
    id: 9, 
    orderNo: 'PO20251108009', 
    supplier: '成都食品有限公司', 
    orderDate: '2025-11-08', 
    amount: 6000.00, 
    status: '关联退款', 
    items: [
      { productId: 105, name: '打印机', spec: '激光', unitId: 1, unit: '个', qty: 2, price: 2500.00 },
      { productId: 106, name: 'U盘', spec: '32G USB3.0', unitId: 1, unit: '个', qty: 30, price: 30.00 }
    ], 
    qcResult: '未质检', 
    paidAmount: 6000.00, 
    unpaidAmount: 0, 
    dueDate: '2025-11-08', 
    paymentDate: '2025-11-08', 
    paymentMethod: '微信支付', 
    paymentChannel: '在线支付' 
  }
]); 