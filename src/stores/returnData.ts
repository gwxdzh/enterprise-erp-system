import { ref } from 'vue'
import { type OrderItem } from './orderData' // 导入 OrderItem 类型
import { allProducts, type Product } from './productData'

// 定义采购退货状态
export type PurchaseReturnStatus = '待处理' | '待审核' | '已完成' | '已取消';

export interface PurchaseReturnItem extends OrderItem {
  // PurchaseReturnItem 继承 OrderItem 的字段 (productId, name, spec, unit, qty, price)
  // 如果需要添加退货相关的独有字段，可以在这里添加，例如:
  // returnReason?: string; // 退货原因
}

export interface PurchaseReturn {
  id: number | null; // 退货记录ID
  returnNo: string; // 退货单号
  orderNo: string; // 关联的采购订单号
  supplier: string; // 供应商
  returnDate: string; // 申请日期 (YYYY-MM-DD)
  status: PurchaseReturnStatus; // 退货状态
  items: PurchaseReturnItem[]; // 退货商品列表
  amount: number; // 退货总金额
  applicant: string; // 申请人
  reason: string; // 退货原因
  auditUser?: string; // 审核人
  processUser?: string; // 处理人
  processDate?: string; // 处理日期 (YYYY-MM-DD)
}

// 模拟采购退货数据
export const allReturns = ref<PurchaseReturn[]>([
  // 示例退货数据
  {
    id: 1,
    returnNo: 'RT20251101001',
    orderNo: 'PO20251027001', // 关联的订单号
    supplier: '上海文具有限公司',
    returnDate: '2025-11-01',
    status: '已完成',
    items: [
      { productId: 102, name: '鼠标', spec: '无线', unit: '件', qty: 5, price: 80.00 }
    ],
    amount: 400.00, // 根据退货商品计算的总金额
    applicant: '采购员A',
    reason: '商品损坏',
    auditUser: '审核员B',
    processUser: '仓库管理员C',
    processDate: '2025-11-02',
  },
  // 为状态为 '关联退款' 的订单 PO20251108009 添加对应的退货记录
  {
    id: 2,
    returnNo: 'RT20251108002',
    orderNo: 'PO20251108009', // 关联的订单号
    supplier: '成都食品有限公司',
    returnDate: '2025-11-08',
    status: '已完成', // 关联退款的退货记录可以直接设置为已完成
    items: [
      { productId: 105, name: '打印机', spec: '激光', unit: '件', qty: 1, price: 2500.00 },
      { productId: 106, name: 'U盘', spec: '32G USB3.0', unit: '件', qty: 10, price: 30.00 }
    ],
    amount: 2800.00, // 总金额为 2500 + 300 = 2800
    applicant: '系统', // 或其他标识
    reason: '订单关联退款',
    auditUser: '系统',
    processUser: '系统',
    processDate: '2025-11-08',
  },
]); 