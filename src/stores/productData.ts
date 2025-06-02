import { ref } from 'vue'
import { getUnitName } from './unitData'
import { getCategoryName } from './categoryData'

export interface Product {
  id: number
  name: string
  price: number
  spec?: string
  unitId?: number // 商品单位ID
  categoryId?: number // 商品分类ID
}

export const allProducts = ref<Product[]>([
  { id: 101, name: '笔记本电脑', price: 6000, spec: '15.6寸 i5 16G', unitId: 1, categoryId: 1001 },
  { id: 102, name: '鼠标', price: 80, spec: '无线', unitId: 1, categoryId: 1003 },
  { id: 103, name: '显示器', price: 700, spec: '24寸 IPS', unitId: 1, categoryId: 1002 },
  { id: 104, name: '键盘', price: 200, spec: '机械', unitId: 1, categoryId: 1003 },
  { id: 105, name: '打印机', price: 2500, spec: '激光', unitId: 1, categoryId: 1004 },
  { id: 106, name: 'U盘', price: 30, spec: '32G USB3.0', unitId: 1, categoryId: 101 }
]) 

// 获取商品名称
export function getProductName(productId: number): string {
  const product = allProducts.value.find(p => p.id === productId)
  return product ? product.name : ''
}

// 获取商品单位名称
export function getProductUnitName(productId: number): string {
  const product = allProducts.value.find(p => p.id === productId)
  if (!product || !product.unitId) return ''
  return getUnitName(product.unitId)
}

// 获取商品分类名称
export function getProductCategoryName(productId: number): string {
  const product = allProducts.value.find(p => p.id === productId)
  if (!product || !product.categoryId) return ''
  return getCategoryName('product', product.categoryId)
} 