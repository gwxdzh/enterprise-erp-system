<template>
  <el-dialog
    title="出库单详情"
    v-model="dialogVisible"
    width="800px"
    :before-close="handleClose"
  >
    <div class="delivery-detail">
      <div class="print-container" ref="printArea">
        <div class="header">
          <h2>销售出库单</h2>
          <div class="barcode">{{ delivery?.deliveryNo }}</div>
        </div>
        
        <div class="info-section">
          <table class="info-table">
            <tbody>
              <tr>
                <td class="label">出库单号：</td>
                <td class="value">{{ delivery?.deliveryNo }}</td>
                <td class="label">销售订单号：</td>
                <td class="value">{{ delivery?.orderNo }}</td>
              </tr>
              <tr>
                <td class="label">客户名称：</td>
                <td class="value">{{ delivery?.customerName }}</td>
                <td class="label">出库日期：</td>
                <td class="value">{{ delivery?.deliveryDate }}</td>
              </tr>
              <tr>
                <td class="label">操作人：</td>
                <td class="value">{{ delivery?.operator }}</td>
                <td class="label">备注：</td>
                <td class="value">{{ delivery?.remark || '无' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="items-section">
          <h3>商品明细</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>商品名称</th>
                <th>数量</th>
                <th>出库仓库</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in delivery?.items" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.productName }}</td>
                <td>{{ item.deliveryQty || item.quantity }}</td>
                <td>{{ item.warehouseName }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <div class="signatures">
            <div class="signature-item">
              <span>仓库管理员：____________</span>
            </div>
            <div class="signature-item">
              <span>配送员：____________</span>
            </div>
            <div class="signature-item">
              <span>客户签收：____________</span>
            </div>
          </div>
          
          <div class="company-info">
            <p>企业进销存ERP管理系统</p>
            <p>地址：上海市浦东新区张江高科技园区</p>
            <p>电话：021-12345678</p>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handlePrint">打印</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'

// 定义props和emits
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  delivery: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'print-success'])

// 对话框可见状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 打印区域引用
const printArea = ref<HTMLElement | null>(null)

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 打印出库单
const handlePrint = () => {
  if (!printArea.value) {
    ElMessage.warning('打印区域不存在')
    return
  }

  // 获取打印内容
  const printContent = printArea.value.innerHTML
  
  // 创建打印窗口
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('无法创建打印窗口，请检查是否被浏览器阻止')
    return
  }
  
  // 写入打印内容
  printWindow.document.open()
  printWindow.document.write(`
    <html>
      <head>
        <title>出库单 - ${props.delivery?.deliveryNo}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .header h2 {
            margin: 0;
            font-size: 24px;
          }
          .barcode {
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            text-align: center;
            margin-top: 10px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .info-table td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          .label {
            font-weight: bold;
            width: 100px;
            background-color: #f5f5f5;
          }
          .items-section h3 {
            margin: 10px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th, .items-table td {
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .footer {
            margin-top: 50px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-bottom: 50px;
          }
          .signature-item {
            flex: 1;
          }
          .company-info {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
          .company-info p {
            margin: 5px 0;
          }
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `)
  printWindow.document.close()
  
  // 延迟打印，确保内容已加载
  setTimeout(() => {
    printWindow.print()
    // 打印后通知父组件
    if (props.delivery?.orderNo) {
      emit('print-success', props.delivery.orderNo)
    }
  }, 500)
}

// 确保组件有默认导出
defineExpose({
  dialogVisible
})
</script>

<style scoped>
.delivery-detail {
  padding: 0 20px;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.barcode {
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}

.info-section {
  margin-bottom: 20px;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
}

.info-table td {
  padding: 8px;
  border: 1px solid #ddd;
}

.label {
  font-weight: bold;
  width: 100px;
  background-color: #f5f5f5;
}

.items-section h3 {
  margin: 10px 0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
}

.items-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.footer {
  margin-top: 30px;
}

.signatures {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.signature-item {
  flex: 1;
}

.company-info {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-top: 30px;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.company-info p {
  margin: 5px 0;
}
</style>
