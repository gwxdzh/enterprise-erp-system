import { ref } from 'vue'

export type ExpenseStatus = '待审核' | '已通过' | '已驳回' | '已报销'

export interface Expense {
  expenseNo: string
  type: string
  amount: number
  applicant: string
  date: string
  status: ExpenseStatus
  remark?: string
  attachments?: string[]
  auditUser?: string
  auditDate?: string
  auditRemark?: string
  reimburseUser?: string
  reimburseDate?: string
}

export const allExpenses = ref<Expense[]>([
  {
    expenseNo: 'EX20250601001',
    type: '差旅费',
    amount: 1200,
    applicant: '张三',
    date: '2025-06-01',
    status: '待审核',
    remark: '出差上海',
    attachments: [],
  },
  {
    expenseNo: 'EX20250602002',
    type: '办公费',
    amount: 300,
    applicant: '李四',
    date: '2025-06-02',
    status: '已通过',
    remark: '购买办公用品',
    attachments: [],
    auditUser: '王主管',
    auditDate: '2025-06-03',
    auditRemark: '同意报销',
  },
  {
    expenseNo: 'EX20250603003',
    type: '招待费',
    amount: 800,
    applicant: '王五',
    date: '2025-06-03',
    status: '已报销',
    remark: '客户招待',
    attachments: [],
    auditUser: '王主管',
    auditDate: '2025-06-04',
    auditRemark: '同意',
    reimburseUser: '财务A',
    reimburseDate: '2025-06-05',
  },
  {
    expenseNo: 'EX20250604004',
    type: '差旅费',
    amount: 1500,
    applicant: '赵丽颖',
    date: '2025-06-04',
    status: '待审核',
    remark: '北京出差',
    attachments: [],
  },
  {
    expenseNo: 'EX20250605005',
    type: '办公费',
    amount: 450,
    applicant: '刘强',
    date: '2025-06-05',
    status: '已通过',
    remark: '采购打印纸',
    attachments: [],
    auditUser: '李主管',
    auditDate: '2025-06-06',
    auditRemark: '同意报销',
  },
  {
    expenseNo: 'EX20250606006',
    type: '差旅费',
    amount: 980,
    applicant: '孙悦',
    date: '2025-06-06',
    status: '已驳回',
    remark: '广州出差',
    attachments: [],
    auditUser: '王主管',
    auditDate: '2025-06-07',
    auditRemark: '报销资料不全',
  },
  {
    expenseNo: 'EX20250607007',
    type: '招待费',
    amount: 1200,
    applicant: '周杰伦',
    date: '2025-06-07',
    status: '待审核',
    remark: '客户聚餐',
    attachments: [],
  },
  {
    expenseNo: 'EX20250608008',
    type: '办公费',
    amount: 600,
    applicant: '王芳',
    date: '2025-06-08',
    status: '已通过',
    remark: '购买办公桌椅',
    attachments: [],
    auditUser: '赵主管',
    auditDate: '2025-06-09',
    auditRemark: '同意报销',
  },
  {
    expenseNo: 'EX20250609009',
    type: '差旅费',
    amount: 2100,
    applicant: '李娜',
    date: '2025-06-09',
    status: '已报销',
    remark: '深圳出差',
    attachments: [],
    auditUser: '钱主管',
    auditDate: '2025-06-10',
    auditRemark: '同意',
    reimburseUser: '财务B',
    reimburseDate: '2025-06-11',
  },
  {
    expenseNo: 'EX20250610010',
    type: '招待费',
    amount: 500,
    applicant: '陈伟',
    date: '2025-06-10',
    status: '待审核',
    remark: '客户拜访',
    attachments: [],
  },
  {
    expenseNo: 'EX20250611011',
    type: '办公费',
    amount: 350,
    applicant: '杨洋',
    date: '2025-06-11',
    status: '已通过',
    remark: '采购文具',
    attachments: [],
    auditUser: '孙主管',
    auditDate: '2025-06-12',
    auditRemark: '同意报销',
  },
  {
    expenseNo: 'EX20250612012',
    type: '差旅费',
    amount: 1800,
    applicant: '吴昊',
    date: '2025-06-12',
    status: '已报销',
    remark: '成都出差',
    attachments: [],
    auditUser: '李主管',
    auditDate: '2025-06-13',
    auditRemark: '同意',
    reimburseUser: '财务C',
    reimburseDate: '2025-06-14',
  },
]) 