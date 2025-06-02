import { ref } from 'vue'

export interface Location {
  id: number;
  code: string; // 库位编码，如A-01-01
  name: string; // 库位名称
  zone: string; // 分区，如A区、B区
  order: number; // 区内排序
  remark?: string;
  capacity?: number; // 新增：货物容量
}

export interface WarehouseZone {
  zone: string; // 分区标识，如"A区"
  name: string; // 分区中文名，如"主通道区"
}

export interface Warehouse {
  id: number;
  name: string;
  address: string;
  manager: string;
  zones: WarehouseZone[]; // 新增分区名数组
  locations: Location[];
}

export const allWarehouses = ref<Warehouse[]>([
  {
    id: 1,
    name: '上海总仓',
    address: '上海市浦东新区张江高科技园区88号',
    manager: '王伟',
    zones: [
      { zone: 'A区', name: '主通道区' },
      { zone: 'B区', name: '高货架区' }
    ],
    locations: [
      { id: 1, code: 'A-01-01', name: 'A区1排1层', zone: 'A区', order: 1, remark: '主通道', capacity: 100 },
      { id: 2, code: 'A-01-02', name: 'A区1排2层', zone: 'A区', order: 2, capacity: 80 },
      { id: 3, code: 'B-02-01', name: 'B区2排1层', zone: 'B区', order: 1, capacity: 120 }
    ]
  },
  {
    id: 2,
    name: '北京分仓',
    address: '北京市朝阳区建国路88号',
    manager: '李明',
    zones: [
      { zone: 'C区', name: '常规区' }
    ],
    locations: [
      { id: 4, code: 'C-01-01', name: 'C区1排1层', zone: 'C区', order: 1, capacity: 60 },
      { id: 5, code: 'C-01-02', name: 'C区1排2层', zone: 'C区', order: 2, remark: '易碎品区', capacity: 40 }
    ]
  },
  {
    id: 3,
    name: '广州分仓',
    address: '广州市天河区体育西路88号',
    manager: '陈晨',
    zones: [
      { zone: 'D区', name: '普通区' }
    ],
    locations: [
      { id: 6, code: 'D-01-01', name: 'D区1排1层', zone: 'D区', order: 1, capacity: 90 }
    ]
  }
]) 