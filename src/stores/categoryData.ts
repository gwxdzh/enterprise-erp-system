import { ref } from 'vue'

// 定义分类接口
export interface Category {
  id: number;
  code: string; // 分类编码
  name: string; // 分类名称
  type: 'product' | 'customer' | 'supplier'; // 分类类型：商品/客户/供应商
  parentId: number | null; // 父分类ID，null表示顶级分类
  level: number; // 分类层级，1表示一级分类，2表示二级分类，以此类推
  description?: string; // 分类描述
}

// 商品分类数据
export const productCategories = ref<Category[]>([
  { id: 101, code: 'PC001', name: '电子产品', type: 'product', parentId: null, level: 1, description: '电子类商品' },
  { id: 102, code: 'PC002', name: '办公用品', type: 'product', parentId: null, level: 1, description: '办公类商品' },
  { id: 103, code: 'PC003', name: '耗材', type: 'product', parentId: null, level: 1, description: '耗材类商品' },
  { id: 104, code: 'PC004', name: '家具', type: 'product', parentId: null, level: 1, description: '家具类商品' },
  
  { id: 1001, code: 'PC00101', name: '笔记本电脑', type: 'product', parentId: 101, level: 2, description: '笔记本电脑' },
  { id: 1002, code: 'PC00102', name: '显示器', type: 'product', parentId: 101, level: 2, description: '显示器' },
  { id: 1003, code: 'PC00103', name: '键鼠设备', type: 'product', parentId: 101, level: 2, description: '键盘、鼠标等设备' },
  { id: 1004, code: 'PC00104', name: '打印设备', type: 'product', parentId: 101, level: 2, description: '打印机、扫描仪等' },
  
  { id: 1005, code: 'PC00201', name: '纸制品', type: 'product', parentId: 102, level: 2, description: '纸张、笔记本等' },
  { id: 1006, code: 'PC00202', name: '文具', type: 'product', parentId: 102, level: 2, description: '笔、尺子等文具' },
  
  { id: 1007, code: 'PC00301', name: '打印耗材', type: 'product', parentId: 103, level: 2, description: '墨盒、硒鼓等' },
  { id: 1008, code: 'PC00302', name: '包装耗材', type: 'product', parentId: 103, level: 2, description: '包装材料' },
  
  { id: 1009, code: 'PC00401', name: '办公桌椅', type: 'product', parentId: 104, level: 2, description: '办公桌椅' },
  { id: 1010, code: 'PC00402', name: '文件柜', type: 'product', parentId: 104, level: 2, description: '文件柜' }
]);

// 客户分类数据
export const customerCategories = ref<Category[]>([
  { id: 201, code: 'CC001', name: '企业客户', type: 'customer', parentId: null, level: 1, description: '企业客户' },
  { id: 202, code: 'CC002', name: '个人客户', type: 'customer', parentId: null, level: 1, description: '个人客户' },
  
  { id: 2001, code: 'CC00101', name: '大型企业', type: 'customer', parentId: 201, level: 2, description: '大型企业客户' },
  { id: 2002, code: 'CC00102', name: '中型企业', type: 'customer', parentId: 201, level: 2, description: '中型企业客户' },
  { id: 2003, code: 'CC00103', name: '小型企业', type: 'customer', parentId: 201, level: 2, description: '小型企业客户' },
  
  { id: 2004, code: 'CC00201', name: '个人采购', type: 'customer', parentId: 202, level: 2, description: '个人采购客户' },
  { id: 2005, code: 'CC00202', name: 'VIP客户', type: 'customer', parentId: 202, level: 2, description: 'VIP个人客户' }
]);

// 供应商分类数据
export const supplierCategories = ref<Category[]>([
  { id: 301, code: 'SC001', name: '办公用品', type: 'supplier', parentId: null, level: 1, description: '办公用品供应商' },
  { id: 302, code: 'SC002', name: '电子设备', type: 'supplier', parentId: null, level: 1, description: '电子设备供应商' },
  { id: 303, code: 'SC003', name: '原材料', type: 'supplier', parentId: null, level: 1, description: '原材料供应商' },
  { id: 304, code: 'SC004', name: '服务供应商', type: 'supplier', parentId: null, level: 1, description: '服务供应商' },
  
  { id: 3001, code: 'SC00101', name: '文具供应商', type: 'supplier', parentId: 301, level: 2, description: '文具供应商' },
  { id: 3002, code: 'SC00102', name: '办公家具供应商', type: 'supplier', parentId: 301, level: 2, description: '办公家具供应商' },
  
  { id: 3003, code: 'SC00201', name: '计算机设备供应商', type: 'supplier', parentId: 302, level: 2, description: '计算机设备供应商' },
  { id: 3004, code: 'SC00202', name: '网络设备供应商', type: 'supplier', parentId: 302, level: 2, description: '网络设备供应商' },
  
  { id: 3005, code: 'SC00301', name: '包装材料供应商', type: 'supplier', parentId: 303, level: 2, description: '包装材料供应商' },
  { id: 3006, code: 'SC00302', name: '生产原料供应商', type: 'supplier', parentId: 303, level: 2, description: '生产原料供应商' }
]);

// 定义递归类型，用于树形结构
interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

// 获取分类树结构
export function getCategoryTree(type: 'product' | 'customer' | 'supplier'): CategoryWithChildren[] {
  let categories: Category[] = [];
  
  switch (type) {
    case 'product':
      categories = [...productCategories.value];
      break;
    case 'customer':
      categories = [...customerCategories.value];
      break;
    case 'supplier':
      categories = [...supplierCategories.value];
      break;
  }
  
  // 找出所有顶级分类
  const topCategories = categories.filter(cat => cat.parentId === null);
  
  // 为每个顶级分类查找其子分类
  const result = topCategories.map(category => {
    return {
      ...category,
      children: findChildren(category.id, categories)
    };
  });
  
  return result;
}

// 递归查找子分类
function findChildren(parentId: number, categories: Category[]): CategoryWithChildren[] {
  const children = categories.filter(cat => cat.parentId === parentId);
  return children.map(child => {
    return {
      ...child,
      children: findChildren(child.id, categories)
    };
  });
}

// 获取分类名称
export function getCategoryName(type: 'product' | 'customer' | 'supplier', id: number): string {
  let categories: Category[] = [];
  
  switch (type) {
    case 'product':
      categories = productCategories.value;
      break;
    case 'customer':
      categories = customerCategories.value;
      break;
    case 'supplier':
      categories = supplierCategories.value;
      break;
  }
  
  const category = categories.find(cat => cat.id === id);
  return category ? category.name : '';
} 