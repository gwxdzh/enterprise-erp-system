<template>
  <div class="print-area">
    <div class="print-title">收付款单</div>
    <div class="barcode-center" v-if="receipt?.relatedOrderNo">
      <Barcode :value="receipt.relatedOrderNo" :height="50" :width="2" />
      <div style="margin-top: 4px; font-size: 16px; letter-spacing: 2px">{{ receipt.relatedOrderNo }}</div>
    </div>
    <table class="print-header-table">
      <tbody>
        <tr>
          <td>单据类型：{{ receipt?.type }}</td>
          <td>业务类型：{{ receipt?.businessType }}</td>
        </tr>
        <tr>
          <td>单号：{{ receipt?.relatedOrderNo }}</td>
          <td>日期：{{ receipt?.date }}</td>
        </tr>
        <tr>
          <td>客户/供应商：{{ receipt?.customerOrSupplier }}</td>
          <td>状态：{{ receipt?.status }}</td>
        </tr>
        <tr>
          <td>金额：{{ moneyFormatter(receipt?.amount) }}</td>
          <td>支付方式：{{ receipt?.method }}</td>
        </tr>
        <tr>
          <td>已付/已收：{{ moneyFormatter(receipt?.paidAmount) }}</td>
          <td>未付/未收：{{ moneyFormatter(receipt?.unpaidAmount) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="print-remark">备注：{{ receipt?.remark || '-' }}</div>
    <div class="print-footer">
      <span>公司名称：智云科技有限公司 地址：上海市浦东新区88号 电话：021-12345678</span>
      <span>第 1 页 / 共 1 页</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import Barcode from '@/components/common/Barcode.vue'
const props = defineProps<{ receipt: any }>()
function moneyFormatter(val: number) {
  if (typeof val !== 'number') return val
  return '￥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
<style scoped>
.print-area {
  width: 700px;
  margin: 0 auto;
  font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 14px;
  color: #222;
  background: #fff;
}
.print-title {
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  margin: 24px 0 18px 0;
  letter-spacing: 2px;
}
.barcode-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  margin-bottom: 10px;
}
.print-header-table {
  width: 100%;
  margin-bottom: 18px;
  border-collapse: collapse;
}
.print-header-table td {
  padding: 4px 12px;
  font-size: 14px;
  border: none;
  text-align: left;
}
.print-remark {
  margin: 8px 0 0 0;
  font-size: 14px;
  text-align: left;
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
@media print {
  body {
    background: #fff !important;
  }
  .print-area {
    box-shadow: none !important;
    margin: 0 !important;
    width: 100% !important;
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