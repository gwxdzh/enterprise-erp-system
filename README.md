# 智云ERP系统 (Smart Cloud ERP)

一个基于Vue 3的综合企业资源规划(ERP)系统前端实现，包含销售、采购、库存、财务等核心业务模块，提供完整权限控制和跨模块数据交互能力。

## 技术栈

- **前端框架**：Vue 3 + TypeScript + Vite
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **UI框架**：Element Plus
- **图表库**：ECharts
- **工具库**：
  - Axios（HTTP请求）
  - Mitt（事件总线）
  - JSBarcode（条形码生成）
  - VueDraggable（拖拽功能）

## 项目内容

该ERP系统是一个全面的企业管理解决方案，包含以下核心功能模块：

1. **销售管理**：客户管理、销售订单、销售发货、销售收款和销售退货
2. **采购管理**：供应商管理、采购订单、采购入库、采购付款和采购退货
3. **库存管理**：仓库管理、库存调整、库存盘点、库存调拨和库存查询
4. **财务管理**：费用申请、收付款管理和财务报表
5. **报表中心**：销售分析、采购分析和库存分析
6. **系统设置**：用户管理和角色权限管理

## 项目亮点

### 1. 完善的权限控制系统

- **基于角色的访问控制 (RBAC)**：用户通过角色关联到权限
- **精细化权限管理**：按模块和操作类型（查看/编辑）划分权限
- **权限验证机制**：
  - 路由级权限控制（使用Vue Router守卫）
  - 按钮级权限控制（通过`hasPermission`方法）
  - 操作级权限控制（API调用前检查）
- **权限UI反馈**：无权限时自动禁用按钮并提供友好提示

### 2. 模块间无缝数据交互

- **事件总线**：基于Mitt实现松耦合的模块间通信
- **数据流转**：采购入库数据自动流转到库存，销售发货自动扣减库存
- **数据一致性**：通过统一状态管理保证跨模块数据一致性
- **业务流程联动**：
  - 采购订单→入库→付款→财务记录
  - 销售订单→发货→收款→财务记录
  - 库存调拨→自动检查容量→更新库存

### 3. 多维度数据分析

- **实时图表**：使用ECharts提供多维度数据可视化
- **动态报表**：财务、销售、采购、库存等多维度数据分析
- **数据导出**：支持报表和单据的导出和打印功能

### 4. 设计特点

- **组件化开发**：高度组件化设计，提高代码复用率
- **响应式界面**：适配不同设备屏幕大小
- **单位换算系统**：支持不同计量单位间的智能换算
- **批次管理**：库存支持批次管理，确保先进先出
- **状态跟踪**：完整的业务状态流转管理

## 安装与使用

### 前置条件

- Node.js 16.0+
- npm 7.0+ 或 yarn 1.22+

### 安装步骤

1. 克隆仓库
```bash
git clone <repository-url>
cd frontend
```

2. 安装依赖
```bash
npm install
# 或使用 yarn
yarn
```

3. 启动开发服务器
```bash
npm run dev
# 或使用 yarn
yarn dev
```

4. 构建生产版本
```bash
npm run build
# 或使用 yarn
yarn build
```

5. 预览生产版本
```bash
npm run preview
# 或使用 yarn
yarn preview
```

### 默认登录账户

- **管理员账户**：admin / 123456
- **销售账户**：sales / 123456
- **采购账户**：purchase / 123456
- **财务账户**：finance / 123456
- **库存账户**：inventory / 123456

## 贡献指南

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件
