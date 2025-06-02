import { ref } from 'vue'
import { getCategoryName } from './categoryData'

export type Supplier = {
  id: number | null; // 供应商ID
  code: string; // 供应商号
  name: string; // 供应商名称
  category: string; // 供应商分类（旧字段，保持向后兼容）
  categoryId?: number; // 供应商分类ID
  contact: string; // 联系人
  phone: string; // 联系电话
  address: string; // 联系地址
  status: string; // 状态
}

export const allSuppliers = ref<Supplier[]>([
  { id: 1, code: 'S00001', name: '上海文具有限公司', category: '办公用品', categoryId: 3001, contact: '张三', phone: '13800000001', address: '上海市浦东新区', status: '正常' },
  { id: 2, code: 'S00002', name: '广州纸业集团', category: '原材料', categoryId: 3005, contact: '李四', phone: '13900000002', address: '广州市天河区', status: '正常' },
  { id: 3, code: 'S00003', name: '北京办公设备', category: '设备', categoryId: 3002, contact: '王五', phone: '13700000003', address: '北京市朝阳区', status: '停用' },
  { id: 4, code: 'S00004', name: '深圳电子科技', category: '电子元件', categoryId: 3003, contact: '王小明', phone: '13612345678', address: '深圳市福田区', status: '正常' },
  { id: 5, code: 'S00005', name: '杭州服装厂', category: '服装', categoryId: 3006, contact: '陈丽', phone: '13587654321', address: '杭州市西湖区', status: '正常' },
  { id: 6, code: 'S00006', name: '成都食品有限公司', category: '食品', categoryId: 3006, contact: '赵强', phone: '13998765432', address: '成都市武侯区', status: '正常' },
  { id: 7, code: 'S00007', name: '武汉化工材料', category: '原材料', categoryId: 3006, contact: '钱进', phone: '13321098765', address: '武汉市江汉区', status: '停用' },
  { id: 8, code: 'S00008', name: '南京机械设备', category: '设备', categoryId: 3002, contact: '孙涛', phone: '18812345678', address: '南京市玄武区', status: '正常' },
  { id: 9, code: 'S00009', name: '重庆汽配公司', category: '汽车配件', categoryId: 3006, contact: '周伟', phone: '19900001111', address: '重庆市渝中区', status: '正常' },
  { id: 10, code: 'S00010', name: '苏州纺织品', category: '原材料', categoryId: 3005, contact: '吴芳', phone: '18765432109', address: '苏州市姑苏区', status: '正常' },
])

// 获取供应商分类名称
export function getSupplierCategoryName(supplierId: number | null): string {
  if (supplierId === null) return '';
  
  const supplier = allSuppliers.value.find(s => s.id === supplierId);
  if (!supplier || !supplier.categoryId) return supplier?.category || '';
  
  return getCategoryName('supplier', supplier.categoryId);
} 