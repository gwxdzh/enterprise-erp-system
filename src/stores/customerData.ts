import { ref } from 'vue'
import { getCategoryName } from './categoryData'

export interface Customer {
  id: number | null;
  code: string; // 客户编号
  name: string; // 客户名称
  category: string; // 客户分类（旧字段，保持向后兼容）
  categoryId?: number; // 客户分类ID
  contactPerson: string; // 联系人
  phoneNumber: string; // 联系电话
  address: string; // 联系地址
  creditRating: '优秀' | '良好' | '一般' | '风险'; // 信用评级
  // 可以根据需要添加更多字段，如交易数据、信用额度等
}

export const allCustomers = ref<Customer[]>([
  { id: 1, code: 'C001', name: '上海华信科技有限公司', category: '企业客户', categoryId: 2001, contactPerson: '王伟', phoneNumber: '13811112222', address: '上海市浦东新区张江高科技园区', creditRating: '优秀' },
  { id: 2, code: 'C002', name: '李明', category: '个人客户', categoryId: 2004, contactPerson: '李明', phoneNumber: '13933334444', address: '北京市朝阳区建国路88号', creditRating: '良好' },
  { id: 3, code: 'C003', name: '深圳市新视界传媒', category: '企业客户', categoryId: 2002, contactPerson: '陈晨', phoneNumber: '13055556666', address: '深圳市南山区科技园', creditRating: '一般' },
  { id: 4, code: 'C004', name: '赵静', category: '个人客户', categoryId: 2004, contactPerson: '赵静', phoneNumber: '13177778888', address: '广州市天河区体育西路', creditRating: '风险' },
  { id: 5, code: 'C005', name: '杭州云帆网络有限公司', category: '企业客户', categoryId: 2001, contactPerson: '周强', phoneNumber: '13299990000', address: '杭州市西湖区文三路', creditRating: '优秀' },
  { id: 6, code: 'C006', name: '王芳', category: '个人客户', categoryId: 2004, contactPerson: '王芳', phoneNumber: '13788887777', address: '南京市鼓楼区中山北路', creditRating: '良好' },
  { id: 7, code: 'C007', name: '成都智联电子有限公司', category: '企业客户', categoryId: 2003, contactPerson: '刘洋', phoneNumber: '13666665555', address: '成都市高新区天府大道', creditRating: '一般' },
  { id: 8, code: 'C008', name: '孙磊', category: '个人客户', categoryId: 2004, contactPerson: '孙磊', phoneNumber: '13544443333', address: '重庆市渝中区解放碑', creditRating: '良好' },
  { id: 9, code: 'C009', name: '天津市盛世广告', category: '企业客户', categoryId: 2002, contactPerson: '马超', phoneNumber: '13422221111', address: '天津市和平区南京路', creditRating: '风险' },
  { id: 10, code: 'C010', name: '刘婷', category: '个人客户', categoryId: 2005, contactPerson: '刘婷', phoneNumber: '13311110000', address: '苏州市工业园区星湖街', creditRating: '优秀' },
  { id: 11, code: 'C011', name: '武汉光谷软件园', category: '企业客户', categoryId: 2001, contactPerson: '杨帆', phoneNumber: '13922223333', address: '武汉市东湖高新区光谷大道', creditRating: '良好' },
  { id: 12, code: 'C012', name: '郑州新动力科技', category: '企业客户', categoryId: 2002, contactPerson: '宋健', phoneNumber: '13833334444', address: '郑州市金水区花园路', creditRating: '一般' },
  { id: 13, code: 'C013', name: '陈雪', category: '个人客户', categoryId: 2004, contactPerson: '陈雪', phoneNumber: '13722225555', address: '青岛市市南区香港中路', creditRating: '良好' },
  { id: 14, code: 'C014', name: '福州海纳百川贸易', category: '企业客户', categoryId: 2003, contactPerson: '林峰', phoneNumber: '13611112222', address: '福州市鼓楼区五四路', creditRating: '优秀' },
  { id: 15, code: 'C015', name: '杨洋', category: '个人客户', categoryId: 2004, contactPerson: '杨洋', phoneNumber: '13599998888', address: '长沙市岳麓区麓谷大道', creditRating: '一般' }
]); 

// 获取客户分类名称
export function getCustomerCategoryName(customerId: number | null): string {
  if (customerId === null) return '';
  
  const customer = allCustomers.value.find(c => c.id === customerId);
  if (!customer || !customer.categoryId) return customer?.category || '';
  
  return getCategoryName('customer', customer.categoryId);
} 