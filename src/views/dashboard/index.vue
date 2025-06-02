<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon blue">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">今日销售额</div>
              <div class="stat-value">¥ 12,345.00</div>
              <div class="stat-compare">
                  <span class="up"><el-icon><CaretTop /></el-icon> 12.5%</span>
                  <span class="compare-text">同比昨日</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-card-content">
            <div class="stat-icon orange">
              <el-icon><ShoppingBag /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">今日订单数</div>
              <div class="stat-value">125</div>
              <div class="stat-compare">
                  <span class="up"><el-icon><CaretTop /></el-icon> 8.2%</span>
                  <span class="compare-text">同比昨日</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-card-content">
            <div class="stat-icon green">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">新增客户</div>
              <div class="stat-value">26</div>
              <div class="stat-compare">
                  <span class="down"><el-icon><CaretBottom /></el-icon> 4.5%</span>
                  <span class="compare-text">同比昨日</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-card-content">
            <div class="stat-icon purple">
              <el-icon><Goods /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">库存预警</div>
              <div class="stat-value">8</div>
              <div class="stat-compare">
                  <span class="link"><el-icon><View /></el-icon> 查看详情</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="chart-container">
      <el-row :gutter="20">
        <!-- 销售趋势图 -->
        <el-col :xs="24" :lg="16">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>销售趋势</span>
                <el-radio-group v-model="salesTrendTimeRange" size="small">
                  <el-radio-button label="week">本周</el-radio-button>
                  <el-radio-button label="month">本月</el-radio-button>
                  <el-radio-button label="year">全年</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div ref="salesTrendChart" class="chart"></div>
          </el-card>
        </el-col>

        <!-- 商品分类占比 -->
        <el-col :xs="24" :lg="8">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>商品分类占比</span>
              </div>
            </template>
            <div ref="categoryPieChart" class="chart pie-chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 待办事项和最近活动 -->
    <div class="bottom-container">
      <el-row :gutter="20">
        <!-- 待办事项 -->
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="todo-card">
            <template #header>
              <div class="card-header">
                <span>待办事项</span>
                <el-button type="primary" size="small" plain>查看全部</el-button>
              </div>
            </template>
            <el-table :data="todoList" style="width: 100%" :show-header="false">
              <el-table-column width="40">
                <template #default="scope">
                  <el-checkbox v-model="scope.row.done"></el-checkbox>
                </template>
              </el-table-column>
              <el-table-column prop="content">
                <template #default="scope">
                  <span :class="{ 'todo-done': scope.row.done }">{{ scope.row.content }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="type" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.tagType" size="small">{{ scope.row.type }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <!-- 最近活动 -->
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="activity-card">
            <template #header>
              <div class="card-header">
                <span>最近活动</span>
              </div>
            </template>
            <div class="activity-list">
              <el-timeline>
                <el-timeline-item v-for="(activity, index) in activityList" :key="index" :type="activity.type" :timestamp="activity.timestamp">
                  {{ activity.content }}
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { CaretTop, CaretBottom, View } from '@element-plus/icons-vue'

// 销售趋势时间范围
const salesTrendTimeRange = ref('month')

// 图表DOM引用
const salesTrendChart = ref<HTMLElement>()
const categoryPieChart = ref<HTMLElement>()

// 图表实例
let salesTrendInstance: echarts.ECharts
let categoryPieInstance: echarts.ECharts

// 待办事项数据
const todoList = ref([
  { content: '审批采购订单 #PO-20230512-001', type: '审批', tagType: 'danger', done: false },
  { content: '处理库存预警商品', type: '库存', tagType: 'warning', done: false },
  { content: '确认销售订单 #SO-20230511-008', type: '销售', tagType: 'success', done: true },
  { content: '回复客户询价单', type: '客户', tagType: 'info', done: false },
  { content: '准备月度销售报表', type: '报表', tagType: 'primary', done: false }
])

// 最近活动数据
const activityList = ref([
  { content: '李经理审批了采购订单 #PO-20230512-002', timestamp: '10分钟前', type: 'primary' },
  { content: '系统发出库存预警：商品"A4打印纸"低于安全库存', timestamp: '30分钟前', type: 'warning' },
  { content: '张三创建了新的销售订单 #SO-20230512-005', timestamp: '1小时前', type: 'success' },
  { content: '系统备份完成', timestamp: '2小时前', type: 'info' },
  { content: '王经理更新了价格策略', timestamp: '昨天', type: '' }
])

// 初始化销售趋势图表
const initSalesTrendChart = () => {
  if (!salesTrendChart.value) return

  salesTrendInstance = echarts.init(salesTrendChart.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['销售额', '订单数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额',
        position: 'left',
        axisLabel: {
          formatter: '{value} 元'
        }
      },
      {
        type: 'value',
        name: '订单数',
        position: 'right',
        axisLabel: {
          formatter: '{value} 单'
        }
      }
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        data: [5200, 4900, 7000, 6500, 9500, 8200, 7800],
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: [30, 25, 38, 35, 45, 42, 40],
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }

  salesTrendInstance.setOption(option)
}

// 初始化商品分类占比图表
const initCategoryPieChart = () => {
  if (!categoryPieChart.value) return

  categoryPieInstance = echarts.init(categoryPieChart.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['办公用品', '电子设备', '家具', '耗材', '其他']
    },
    series: [
      {
        name: '商品分类',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: '办公用品' },
          { value: 25, name: '电子设备' },
          { value: 20, name: '家具' },
          { value: 15, name: '耗材' },
          { value: 5, name: '其他' }
        ]
      }
    ]
  }

  categoryPieInstance.setOption(option)
}

// 监听窗口大小变化，重绘图表
const handleResize = () => {
  salesTrendInstance && salesTrendInstance.resize()
  categoryPieInstance && categoryPieInstance.resize()
}

onMounted(() => {
  // 初始化图表
  initSalesTrendChart()
  initCategoryPieChart()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

/* 统计卡片样式 */
.stat-cards {
  margin-bottom: 24px;
}

.stat-card {
  height: 130px;
  margin-bottom: 20px;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-card-content {
  display: flex;
  height: 100%;
  padding: 5px;
  align-items: center;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
  color: white;
  font-size: 28px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.stat-icon.blue {
  background: linear-gradient(135deg, #409eff, #2980b9);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #e6a23c, #d35400);
}

.stat-icon.green {
  background: linear-gradient(135deg, #67c23a, #27ae60);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.stat-compare {
  font-size: 12px;
  display: flex;
  align-items: center;
}

.compare-text {
  color: #909399;
  margin-left: 5px;
}

.up {
  color: #67c23a;
  display: flex;
  align-items: center;
}

.down {
  color: #f56c6c;
  display: flex;
  align-items: center;
}

.link {
  color: #409eff;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.up .el-icon, .down .el-icon, .link .el-icon {
  margin-right: 2px;
  font-size: 12px;
}

/* 图表样式 */
.chart-container {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  height: 350px;
}

.pie-chart {
  height: 350px;
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 待办事项样式 */
.todo-done {
  text-decoration: line-through;
  color: #999;
}

/* 活动列表样式 */
.activity-list {
  padding: 0 10px;
}
</style>
