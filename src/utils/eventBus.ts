import mitt from 'mitt';

// 创建事件发射器
const emitter = mitt();

// 事件类型
export const EventType = {
  // 采购相关事件
  PURCHASE_ORDER_UPDATED: 'purchase-order-updated',
  WAREHOUSING_COMPLETED: 'warehousing-completed',
  PAYMENT_COMPLETED: 'payment-completed',
  RETURN_COMPLETED: 'return-completed'
};

// 导出事件总线
export default emitter; 