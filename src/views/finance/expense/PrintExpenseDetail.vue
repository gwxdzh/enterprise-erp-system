<template>
  <div class="print-area" ref="printArea">
    <div class="print-title">
      {{ mode === 'audit' ? '费用审核申请单' : '费用报销申请单' }}
    </div>
    <div class="barcode-center">
      <Barcode :value="expense.expenseNo" :height="50" :width="2" />
      <div style="margin-top: 4px; font-size: 16px; letter-spacing: 2px">{{ expense.expenseNo }}</div>
    </div>
    <table class="print-header-table">
      <tbody>
        <tr>
          <td>申请单号：{{ expense.expenseNo }}</td>
          <td>申请人：{{ expense.applicant }}</td>
        </tr>
        <tr>
          <td>费用类型：{{ expense.type }}</td>
          <td>申请日期：{{ expense.date }}</td>
        </tr>
        <tr>
          <td>金额：￥{{ formatAmount(expense.amount) }}</td>
          <td>状态：{{ expense.status }}</td>
        </tr>
        <tr v-if="mode === 'reimburse' && expense.reimburseUser">
          <td>报销人：{{ expense.reimburseUser }}</td>
          <td>报销日期：{{ expense.reimburseDate }}</td>
        </tr>
        <tr v-if="expense.auditUser">
          <td>审核人：{{ expense.auditUser }}</td>
          <td>审核日期：{{ expense.auditDate }}</td>
        </tr>
      </tbody>
    </table>
    <div class="print-remark">说明：{{ expense.remark || '无' }}</div>
    <div class="print-remark" v-if="expense.auditRemark">审核意见：{{ expense.auditRemark }}</div>
    <div class="print-remark" v-if="expense.attachments && expense.attachments.length">附件：{{ expense.attachments.length }} 个</div>

    <!-- 公章区域，单独一行，右对齐 -->
    <div class="print-stamp-row">
      <div class="print-stamp-area">
        <div class="stamp-label">（公章）</div>
        <div class="stamp-box"></div>
      </div>
    </div>

    <div class="print-footer">
      <span>公司名称：智云科技有限公司 地址：上海市浦东新区88号 电话：021-12345678</span>
      <span>第 1 页 / 共 1 页</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import Barcode from '@/components/common/Barcode.vue'
const props = defineProps<{ expense: any; mode: 'audit' | 'reimburse' }>()
function formatAmount(val: number) {
  if (typeof val !== 'number') return val
  return val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}
</script>
<style scoped>
.print-area {
  width: 700px;
  margin: 32px auto 0 auto;
  font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 14px;
  color: #222;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.08);
  min-height: 900px;
  padding: 32px 36px 24px 36px;
  box-sizing: border-box;
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
.print-stamp-row {
  display: flex;
  justify-content: flex-end;
  margin: 32px 0 0 0;
}
.print-stamp-area {
  width: 180px;
  text-align: right;
}
.stamp-label {
  font-size: 15px;
  color: #888;
  margin-bottom: 8px;
}
.stamp-box {
  width: 120px;
  height: 60px;
  border: 1.5px dashed #bbb;
  border-radius: 8px;
  display: inline-block;
  background: #fff;
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
  .print-area {
    box-shadow: none !important;
    border-radius: 0 !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 0 0 0 !important;
    min-height: 0 !important;
    width: 100% !important;
  }
}
</style>
