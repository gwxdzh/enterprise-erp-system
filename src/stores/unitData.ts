import { ref } from 'vue'

// 单位基础信息
export interface Unit {
  id: number;
  code: string; // 单位编码
  name: string; // 单位名称
  symbol: string; // 单位符号
  isBase: boolean; // 是否为基础单位
  description?: string; // 单位描述
}

// 单位换算关系
export interface UnitConversion {
  id: number;
  sourceUnitId: number; // 源单位ID
  sourceUnitName: string; // 源单位名称
  targetUnitId: number; // 目标单位ID
  targetUnitName: string; // 目标单位名称
  rate: number; // 换算比率: 1个源单位 = rate个目标单位
  formula?: string; // 换算公式（可选，用于复杂换算）
}

// 单位数据存储
export const allUnits = ref<Unit[]>([
  { id: 1, code: 'PCS', name: '个', symbol: '个', isBase: true, description: '基础计数单位' },
  { id: 2, code: 'BOX', name: '盒', symbol: '盒', isBase: false, description: '包装单位' },
  { id: 3, code: 'CTN', name: '箱', symbol: '箱', isBase: false, description: '包装单位' },
  { id: 4, code: 'KG', name: '千克', symbol: 'kg', isBase: true, description: '基础重量单位' },
  { id: 5, code: 'G', name: '克', symbol: 'g', isBase: false, description: '重量单位' },
  { id: 6, code: 'L', name: '升', symbol: 'L', isBase: true, description: '基础体积单位' },
  { id: 7, code: 'ML', name: '毫升', symbol: 'ml', isBase: false, description: '体积单位' },
  { id: 8, code: 'M', name: '米', symbol: 'm', isBase: true, description: '基础长度单位' },
  { id: 9, code: 'CM', name: '厘米', symbol: 'cm', isBase: false, description: '长度单位' }
]);

// 单位换算关系存储
export const allUnitConversions = ref<UnitConversion[]>([
  { id: 1, sourceUnitId: 3, sourceUnitName: '箱', targetUnitId: 2, targetUnitName: '盒', rate: 10, formula: 'targetValue = sourceValue * 10' },
  { id: 2, sourceUnitId: 2, sourceUnitName: '盒', targetUnitId: 1, targetUnitName: '个', rate: 20, formula: 'targetValue = sourceValue * 20' },
  { id: 3, sourceUnitId: 4, sourceUnitName: '千克', targetUnitId: 5, targetUnitName: '克', rate: 1000, formula: 'targetValue = sourceValue * 1000' },
  { id: 4, sourceUnitId: 6, sourceUnitName: '升', targetUnitId: 7, targetUnitName: '毫升', rate: 1000, formula: 'targetValue = sourceValue * 1000' },
  { id: 5, sourceUnitId: 8, sourceUnitName: '米', targetUnitId: 9, targetUnitName: '厘米', rate: 100, formula: 'targetValue = sourceValue * 100' }
]);

// 获取单位名称
export function getUnitName(unitId: number): string {
  const unit = allUnits.value.find(u => u.id === unitId);
  return unit ? unit.name : '';
}

// 计算单位换算
export function convertUnit(value: number, fromUnitId: number, toUnitId: number): number {
  // 相同单位无需换算
  if (fromUnitId === toUnitId) return value;

  // 直接换算
  const directConversion = allUnitConversions.value.find(
    conv => conv.sourceUnitId === fromUnitId && conv.targetUnitId === toUnitId
  );
  if (directConversion) {
    return value * directConversion.rate;
  }

  // 反向换算
  const reverseConversion = allUnitConversions.value.find(
    conv => conv.sourceUnitId === toUnitId && conv.targetUnitId === fromUnitId
  );
  if (reverseConversion) {
    return value / reverseConversion.rate;
  }

  // 二级换算（通过中间单位）
  for (const conv1 of allUnitConversions.value) {
    if (conv1.sourceUnitId === fromUnitId) {
      const intermediateUnitId = conv1.targetUnitId;
      const conv2 = allUnitConversions.value.find(
        conv => conv.sourceUnitId === intermediateUnitId && conv.targetUnitId === toUnitId
      );
      if (conv2) {
        const intermediateValue = value * conv1.rate;
        return intermediateValue * conv2.rate;
      }
    }
  }

  // 无法换算
  console.warn(`无法将单位 ${fromUnitId} 换算为单位 ${toUnitId}`);
  return value;
} 