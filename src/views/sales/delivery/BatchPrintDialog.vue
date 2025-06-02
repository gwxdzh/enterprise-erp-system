<template>
  <el-dialog v-model="visible" width="900px" class="print-batch-dialog" :show-close="true" :close-on-click-modal="false">
    <div ref="printArea" class="print-batch-container">
      <div v-for="(delivery, idx) in list" :key="delivery.deliveryNo" class="print-delivery-item" style="overflow: hidden">
        <DeliveryDetail :delivery="delivery" :mini="true" />
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handlePrint">打印</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import DeliveryDetail from './DeliveryDetail.vue'
const props = defineProps<{ visible: boolean; list: any[] }>()
const emit = defineEmits(['update:visible', 'batch-print-success'])
const visible = ref(props.visible)
watch(
  () => props.visible,
  v => (visible.value = v)
)
watch(visible, v => emit('update:visible', v))
const printArea = ref<HTMLElement | null>(null)
function handlePrint() {
  nextTick(() => {
    if (printArea.value) {
      const printContent = printArea.value.innerHTML
      const win = window.open('', '', 'width=900,height=1200')
      if (!win) return
      win.document.write(`
        <html>
        <head>
          <title>批量打印出库单</title>
          <style>
            body { font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif; font-size: 14px; color: #222; background: #fff; }
            .print-batch-container { width: 800px; margin: 0 auto; }
            .print-delivery-item { height: 140mm; box-sizing: border-box; page-break-inside: avoid; padding: 24px 36px 12px 36px; background: #fff; display: flex; flex-direction: column; justify-content: flex-start; }
            @media print {
              body { background: #fff !important; }
              .el-dialog__header, .el-dialog__footer, .el-overlay, .el-button { display: none !important; }
              .print-batch-container { width: 100% !important; margin: 0 !important; }
              .print-delivery-item { height: 140mm !important; box-sizing: border-box; page-break-inside: avoid; }
              .print-delivery-item:nth-child(2n) { page-break-after: always; }
            }
            /* 表格美化 */
            .print-area table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            .print-area th, .print-area td { border: 1px solid #333; padding: 6px 0; text-align: center; font-size: 14px; }
            .print-area th { background: #f5f5f5; font-weight: bold; }
            .print-title { text-align: center; font-size: 22px; font-weight: bold; margin: 24px 0 18px 0; letter-spacing: 2px; }
            .barcode-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90px; margin-bottom: 10px; }
            .print-header-table td { padding: 4px 12px; font-size: 14px; border: none; }
            .print-total { text-align: right; font-weight: bold; margin: 10px 0 0 0; font-size: 15px; }
            .print-footer { display: flex; justify-content: space-between; margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 8px; }
            .print-area {
  width: 700px;
  margin: 0 auto;
  font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 14px;
  color: #222;
  background: #fff;
  position: relative;
}
.print-content-wrap {
  position: relative;
  min-height: 140mm;
}
.print-title {
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  margin: 24px 0 18px 0;
  letter-spacing: 2px;
}
.print-header-table {
  width: 100%;
  margin-bottom: 18px;
  border-collapse: collapse;
}
  .print-header-table tbody{
  display:block;
  width:100%;
  }
  .print-header-table tr{
  display:flex;
  width:80%;
  margin:0 auto;
  }
.print-header-table td {
width:50%;
text-align:left;
  padding: 4px 12px;
  font-size: 14px;
}
.print-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}
.print-table th,
.print-table td {
  border: 1px solid #333;
  padding: 6px 0;
  text-align: center;
  font-size: 14px;
}
.print-table th {
  background: #f5f5f5;
  font-weight: bold;
}
.print-total {
  text-align: right;
  font-weight: bold;
  margin: 10px 0 0 0;
  font-size: 15px;
}
.print-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  font-size: 12px;
  color: #888;
  border-top: 1px solid #eee;
  padding-top: 8px;
}
.print-stamp {
  display: block;
  position: absolute;
  right: 24px;
  bottom: 18px;
  width: 155px;
  height: 155px;
  opacity: 0.85;
  z-index: 10;
  pointer-events: none;
}
.barcode-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  margin-bottom: 10px;
  page-break-inside: avoid;
}
@media print {
  body {
    background: #fff !important;
  }
  .el-dialog__header,
  .el-dialog__footer,
  .el-overlay,
  .el-button {
    display: none !important;
  }
  .print-area {
    min-height: 100vh !important;
    height: 100vh !important;
    box-sizing: border-box;
    position: relative !important;
  }
  .print-stamp {
    display: block !important;
    position: absolute !important;
    right: 24px !important;
    bottom: 18px !important;
    width: 155px !important;
    height: 155px !important;
    opacity: 0.85 !important;
    z-index: 10 !important;
    pointer-events: none !important;
  }
  .print-area {
    width: 700px;
    margin: 0 auto;
    font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif;
    font-size: 14px;
    color: #222;
    background: #fff;
    position: relative;
  }
  .print-content-wrap {
    position: relative;
    min-height: 140mm;
  }
  .print-title {
    text-align: center;
    font-size: 22px;
    font-weight: bold;
    margin: 24px 0 18px 0;
    letter-spacing: 2px;
  }
  .print-header-table {
    width: 100%;
    margin-bottom: 18px;
    border-collapse: collapse;
  }
  .print-header-table td {
    padding: 4px 12px;
    font-size: 14px;
  }
  .print-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  .print-table th,
  .print-table td {
    border: 1px solid #333;
    padding: 6px 0;
    text-align: center;
    font-size: 14px;
  }
  .print-table th {
    background: #f5f5f5;
    font-weight: bold;
  }
  .print-total {
    text-align: right;
    font-weight: bold;
    margin: 10px 0 0 0;
    font-size: 15px;
  }
  .print-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
    font-size: 12px;
    color: #888;
    border-top: 1px solid #eee;
    padding-top: 8px;
  }
  .print-stamp {
    display: block;
    position: absolute;
    right: 24px;
    bottom: 18px;
    width: 155px;
    height: 155px;
    opacity: 0.85;
    z-index: 10;
    pointer-events: none;
  }
  .barcode-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
            </style>
        </head>
        <body>${printContent}</body>
        </html>
      `)
      win.document.close()
      win.focus()
      win.print()
      win.close()
      // 打印完成后，通知父组件所有已打印单据
      emit(
        'batch-print-success',
        props.list.map(item => item.orderNo)
      )
    }
  })
}
</script>
<style scoped>
.print-batch-container {
  width: 800px;
  margin: 0 auto;
}
.print-delivery-item {
  height: 140mm;
  box-sizing: border-box;
  page-break-inside: avoid;
  padding: 24px 36px 12px 36px;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  .el-dialog__header,
  .el-dialog__footer,
  .el-overlay,
  .el-button {
    display: none !important;
  }
  .print-batch-container {
    width: 100% !important;
    margin: 0 !important;
  }
  .print-delivery-item {
    height: 140mm !important;
    box-sizing: border-box;
    page-break-inside: avoid;
  }
  .print-delivery-item:nth-child(2n) {
    page-break-after: always;
  }
}
</style>
<style>
.print-area {
  width: 700px;
  margin: 0 auto;
  font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 14px;
  color: #222;
  background: #fff;
  position: relative;
}
.print-content-wrap {
  position: relative;
  min-height: 140mm;
}
.print-title {
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  margin: 24px 0 18px 0;
  letter-spacing: 2px;
}
.print-header-table {
  width: 100%;
  margin-bottom: 18px;
  border-collapse: collapse;
}
.print-header-table tbody {
  display: block;
  width: 100%;
}
.print-header-table tr {
  display: flex;
  width: 80%;
  margin: 0 auto;
}
.print-header-table td {
  width: 50%;
  text-align: left;
  padding: 4px 12px;
  font-size: 14px;
}
.print-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}
.print-table th,
.print-table td {
  border: 1px solid #333;
  padding: 6px 0;
  text-align: center;
  font-size: 14px;
}
.print-table th {
  background: #f5f5f5;
  font-weight: bold;
}
.print-total {
  text-align: right;
  font-weight: bold;
  margin: 10px 0 0 0;
  font-size: 15px;
}
.print-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  font-size: 12px;
  color: #888;
  border-top: 1px solid #eee;
  padding-top: 8px;
}
.print-stamp {
  display: block;
  position: absolute;
  right: 24px;
  bottom: 18px;
  width: 155px;
  height: 155px;
  opacity: 0.85;
  z-index: 10;
  pointer-events: none;
}
.barcode-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  margin-bottom: 10px;
  page-break-inside: avoid;
}
@media print {
  .el-dialog__header,
  .el-dialog__footer,
  .el-overlay,
  .el-button {
    display: none !important;
  }
  .print-area {
    min-height: 100vh !important;
    height: 100vh !important;
    box-sizing: border-box;
    position: relative !important;
  }
  .print-stamp {
    display: block !important;
    position: absolute !important;
    right: 24px !important;
    bottom: 18px !important;
    width: 155px !important;
    height: 155px !important;
    opacity: 0.85 !important;
    z-index: 10 !important;
    pointer-events: none !important;
  }
  .print-area {
    width: 700px;
    margin: 0 auto;
    font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif;
    font-size: 14px;
    color: #222;
    background: #fff;
    position: relative;
  }
  .print-content-wrap {
    position: relative;
    min-height: 140mm;
  }
  .print-title {
    text-align: center;
    font-size: 22px;
    font-weight: bold;
    margin: 24px 0 18px 0;
    letter-spacing: 2px;
  }
  .print-header-table {
    width: 100%;
    margin-bottom: 18px;
    border-collapse: collapse;
  }
  .print-header-table td {
    padding: 4px 12px;
    font-size: 14px;
  }
  .print-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  .print-table th,
  .print-table td {
    border: 1px solid #333;
    padding: 6px 0;
    text-align: center;
    font-size: 14px;
  }
  .print-table th {
    background: #f5f5f5;
    font-weight: bold;
  }
  .print-total {
    text-align: right;
    font-weight: bold;
    margin: 10px 0 0 0;
    font-size: 15px;
  }
  .print-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
    font-size: 12px;
    color: #888;
    border-top: 1px solid #eee;
    padding-top: 8px;
  }
  .print-stamp {
    display: block;
    position: absolute;
    right: 24px;
    bottom: 18px;
    width: 155px;
    height: 155px;
    opacity: 0.85;
    z-index: 10;
    pointer-events: none;
  }
  .barcode-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
}
</style>
