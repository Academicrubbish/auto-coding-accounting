<template>
  <view class="stats-container">
    <!-- 月份选择 -->
    <view class="month-selector">
      <view class="selector-btn" @tap="changeMonth(-1)">
        <text class="btn-arrow">‹</text>
      </view>
      <view class="month-display" @tap="showMonthPicker = true">
        <text class="month-text">{{ currentYear }}年{{ currentMonth }}月</text>
        <text class="month-arrow">›</text>
      </view>
      <view class="selector-btn" @tap="changeMonth(1)" :class="{ disabled: isCurrentMonth }">
        <text class="btn-arrow">›</text>
      </view>
    </view>

    <!-- 收支概览 -->
    <view class="overview-section">
      <view class="overview-item income-item">
        <text class="overview-label">收入</text>
        <text class="overview-value income">¥{{ formatMoney(monthIncome) }}</text>
      </view>
      <view class="overview-item expense-item">
        <text class="overview-label">支出</text>
        <text class="overview-value expense">¥{{ formatMoney(monthExpense) }}</text>
      </view>
      <view class="overview-item balance-item">
        <text class="overview-label">结余</text>
        <text class="overview-value" :class="monthBalance >= 0 ? 'income' : 'expense'">
          ¥{{ formatMoney(monthBalance) }}
        </text>
      </view>
    </view>

    <!-- 收支比例环形图 -->
    <view class="chart-section">
      <view class="section-header">
        <text class="section-title">收支比例</text>
      </view>
      <view class="ring-chart-container" v-if="monthIncome > 0 || monthExpense > 0">
        <qiun-data-charts
          type="ring"
          :opts="ringOpts"
          :chartData="ringChartData"
          :canvas2d="true"
        />
      </view>
      <view class="chart-empty" v-else>
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无收支数据</text>
        <text class="empty-hint">记一笔后查看统计</text>
      </view>
    </view>

    <!-- 每日趋势折线图 -->
    <view class="chart-section">
      <view class="section-header">
        <text class="section-title">每日收支趋势</text>
        <view class="type-toggle">
          <view
            class="toggle-item"
            :class="{ active: trendType === 'all' }"
            @tap="trendType = 'all'"
          >
            <text class="toggle-text">全部</text>
          </view>
          <view
            class="toggle-item"
            :class="{ active: trendType === 'expense' }"
            @tap="trendType = 'expense'"
          >
            <text class="toggle-text">支出</text>
          </view>
          <view
            class="toggle-item"
            :class="{ active: trendType === 'income' }"
            @tap="trendType = 'income'"
          >
            <text class="toggle-text">收入</text>
          </view>
        </view>
      </view>
      <view class="line-chart-container" v-if="dailyData.length > 0">
        <qiun-data-charts
          type="line"
          :opts="lineOpts"
          :chartData="lineChartData"
          :canvas2d="true"
        />
      </view>
      <view class="chart-empty" v-else>
        <text class="empty-icon">📈</text>
        <text class="empty-text">暂无趋势数据</text>
        <text class="empty-hint">记一笔后查看趋势</text>
      </view>
    </view>

    <!-- 分类统计饼图 -->
    <view class="chart-section">
      <view class="section-header">
        <text class="section-title">分类统计</text>
        <view class="type-toggle">
          <view
            class="toggle-item"
            :class="{ active: categoryType === 'expense' }"
            @tap="switchCategoryType('expense')"
          >
            <text class="toggle-text">支出</text>
          </view>
          <view
            class="toggle-item"
            :class="{ active: categoryType === 'income' }"
            @tap="switchCategoryType('income')"
          >
            <text class="toggle-text">收入</text>
          </view>
        </view>
      </view>
      <view class="pie-chart-container" v-if="categoryData.length > 0">
        <qiun-data-charts
          type="pie"
          :opts="pieOpts"
          :chartData="pieChartData"
          :canvas2d="true"
        />
      </view>
      <view class="chart-empty" v-else>
        <text class="empty-icon">🏷️</text>
        <text class="empty-text">暂无{{ categoryType === 'expense' ? '支出' : '收入' }}分类数据</text>
        <text class="empty-hint">记一笔后查看分类统计</text>
      </view>
      <!-- 分类列表 -->
      <view class="category-list" v-if="categoryData.length > 0">
        <view
          class="category-item"
          v-for="(item, index) in categoryData"
          :key="item.category_id"
        >
          <view class="category-left">
            <text class="category-icon" :style="{ background: getCategoryColor(index) }">
              {{ item.categoryIcon || '📁' }}
            </text>
            <text class="category-name">{{ item.categoryName }}</text>
          </view>
          <view class="category-right">
            <text class="category-amount">¥{{ formatMoney(item.amount) }}</text>
            <text class="category-percent">{{ item.percentage }}%</text>
          </view>
        </view>
      </view>
      <view class="category-empty" v-else>
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无{{ categoryType === 'expense' ? '支出' : '收入' }}数据</text>
      </view>
    </view>

    <!-- 月份选择弹窗 -->
    <view class="picker-mask" v-if="showMonthPicker" @tap="showMonthPicker = false">
      <view class="picker-content small-content" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择月份</text>
          <text class="picker-close" @tap="showMonthPicker = false">✕</text>
        </view>
        <!-- @ts-ignore -->
        <picker-view class="date-picker" :value="monthPickerValue" @change="onMonthChange">
          <picker-view-column>
            <view v-for="(item, index) in years" :key="index" class="picker-item">
              {{ item }}年
            </view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="(item, index) in months" :key="index" class="picker-item">
              {{ item }}月
            </view>
          </picker-view-column>
        </picker-view>
        <view class="date-actions">
          <button class="date-btn" @tap="confirmMonth">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

// 状态
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const monthIncome = ref(0)
const monthExpense = ref(0)
const monthBalance = ref(0)
const dailyData = ref<any[]>([])
const categoryData = ref<any[]>([])

const trendType = ref('all')
const categoryType = ref('expense')
const showMonthPicker = ref(false)

// 图表颜色
const chartColors = ['#667eea', '#51cf66', '#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#ff9f43', '#54a0ff']

// 日期选择器
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})
const months = computed(() => Array.from({ length: 12 }, (_, i) => i + 1))
const monthPickerValue = ref([2, new Date().getMonth() + 1])

// 是否是当前月份
const isCurrentMonth = computed(() => {
  const now = new Date()
  return currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth() + 1
})

/**
 * 环形图配置 - 收支比例
 */
const ringOpts = computed(() => ({
  color: chartColors,
  padding: [5, 5, 5, 5],
  enableScroll: false,
  legend: {
    show: true,
    position: 'right',
    itemGap: 16,
    fontSize: 26,
  },
  extra: {
    ring: {
      ringWidth: 30,
      activeOpacity: 0.5,
      activeRadius: 10,
      offsetAngle: 0,
      labelWidth: 10,
      border: true,
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }
  },
  dataLabel: false,
  dataPointShape: false
}))

const ringChartData = computed(() => {
  if (monthIncome.value === 0 && monthExpense.value === 0) {
    return { series: [] }
  }
  // 格式化数字，避免浮点数精度问题
  return {
    series: [{
      data: [
        { name: '收入', value: Number(monthIncome.value.toFixed(2)) },
        { name: '支出', value: Number(monthExpense.value.toFixed(2)) }
      ]
    }]
  }
})

/**
 * 折线图配置 - 每日趋势
 */
const lineOpts = computed(() => ({
  color: chartColors,
  padding: [15, 10, 0, 15],
  enableScroll: false,
  legend: {
    show: trendType.value === 'all'
  },
  xAxis: {
    disableGrid: true
  },
  yAxis: {
    gridType: 'dash',
    dashLength: 2,
    data: [{ min: 0 }]
  },
  extra: {
    line: {
      type: 'curve',
      width: 2,
      activeType: 'hollow'
    }
  }
}))

const lineChartData = computed(() => {
  if (dailyData.value.length === 0) {
    return { categories: [], series: [] }
  }

  const categories = dailyData.value.map(d => {
    const date = new Date(d.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  // 格式化数字，避免浮点数精度问题
  const formatNum = (num: number) => Number(num.toFixed(2))

  const series: any[] = []

  if (trendType.value === 'all' || trendType.value === 'income') {
    series.push({
      name: '收入',
      data: dailyData.value.map(d => formatNum(d.income))
    })
  }

  if (trendType.value === 'all' || trendType.value === 'expense') {
    series.push({
      name: '支出',
      data: dailyData.value.map(d => formatNum(d.expense))
    })
  }

  return { categories, series }
})

/**
 * 饼图配置 - 分类统计
 */
const pieOpts = computed(() => ({
  color: chartColors,
  padding: [5, 5, 5, 5],
  enableScroll: false,
  extra: {
    pie: {
      activeOpacity: 0.5,
      activeRadius: 10,
      offsetAngle: 0,
      labelWidth: 10,
      ringWidth: 30,
      border: true,
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }
  },
  dataLabel: false,
  dataPointShape: false
}))

const pieChartData = computed(() => {
  if (categoryData.value.length === 0) {
    return { series: [] }
  }
  // 格式化数字，避免浮点数精度问题
  return {
    series: [{
      data: categoryData.value.map(item => ({
        name: item.categoryName,
        value: Number(item.amount.toFixed(2))
      }))
    }]
  }
})

/**
 * 格式化金额
 */
const formatMoney = (val: number) => {
  return val.toFixed(2)
}

/**
 * 获取分类颜色
 */
const getCategoryColor = (index: number) => {
  return chartColors[index % chartColors.length]
}

/**
 * 切换月份
 */
const changeMonth = (delta: number) => {
  let newMonth = currentMonth.value + delta
  let newYear = currentYear.value

  if (newMonth > 12) {
    newMonth = 1
    newYear++
  } else if (newMonth < 1) {
    newMonth = 12
    newYear--
  }

  // 不能选择未来月份
  const now = new Date()
  if (newYear > now.getFullYear() || (newYear === now.getFullYear() && newMonth > now.getMonth() + 1)) {
    return
  }

  currentYear.value = newYear
  currentMonth.value = newMonth
  loadMonthlyData()
}

/**
 * 月份变化
 */
const onMonthChange = (e: any) => {
  monthPickerValue.value = e.detail.value
}

/**
 * 确认月份
 */
const confirmMonth = () => {
  const [yearIndex, month] = monthPickerValue.value
  const year = years.value[yearIndex]

  // 不能选择未来月份
  const now = new Date()
  if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)) {
    // @ts-ignore
    uni.showToast({
      title: '不能选择未来月份',
      icon: 'none'
    })
    return
  }

  currentYear.value = year
  currentMonth.value = month
  showMonthPicker.value = false
  loadMonthlyData()
}

/**
 * 切换分类类型
 */
const switchCategoryType = (type: 'expense' | 'income') => {
  categoryType.value = type
  loadCategoryData()
}

/**
 * 加载月度数据
 */
const loadMonthlyData = async () => {
  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'statistics',
      data: {
        action: 'monthly',
        openid: userStore.openid,
        data: {
          year: currentYear.value,
          month: currentMonth.value
        }
      }
    })

    if (res.result.code === 0) {
      const data = res.result.data
      monthIncome.value = data.totalIncome || 0
      monthExpense.value = data.totalExpense || 0
      monthBalance.value = data.balance || 0
      dailyData.value = data.dailyList || []
    }
  } catch (error) {
    console.error('加载月度数据失败：', error)
  }

  // 同时加载分类数据
  loadCategoryData()
}

/**
 * 加载分类数据
 */
const loadCategoryData = async () => {
  try {
    // 计算月份起止日期 - 使用正确的最后一天计算
    const lastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
    const startDate = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-01`
    const endDate = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'statistics',
      data: {
        action: 'category',
        openid: userStore.openid,
        data: {
          type: categoryType.value,
          start_date: startDate,
          end_date: endDate
        }
      }
    })

    if (res.result.code === 0) {
      const list = res.result.data.categoryList || []
      categoryData.value = list.map((item: any) => ({
        ...item,
        percentage: parseFloat(item.percentage)
      }))
    }
  } catch (error) {
    console.error('加载分类数据失败：', error)
  }
}

/**
 * 页面加载
 */
onMounted(() => {
  loadMonthlyData()
})

// 页面显示时检查登录状态并刷新数据
onShow(() => {
  if (!userStore.openid) {
    // 未登录，清空数据
    monthIncome.value = 0
    monthExpense.value = 0
    monthBalance.value = 0
    dailyData.value = []
    categoryData.value = []
  } else {
    // 已登录，刷新数据
    loadMonthlyData()
  }
})

// 监听登录状态变化
watch(() => userStore.openid, (newOpenid) => {
  if (newOpenid) {
    // 已登录，加载数据
    loadMonthlyData()
  } else {
    // 退出登录，清空数据
    monthIncome.value = 0
    monthExpense.value = 0
    monthBalance.value = 0
    dailyData.value = []
    categoryData.value = []
  }
})

// 监听登录状态版本变化
watch(() => userStore.authStateVersion, () => {
  if (!userStore.openid) {
    monthIncome.value = 0
    monthExpense.value = 0
    monthBalance.value = 0
    dailyData.value = []
    categoryData.value = []
  }
})
</script>

<style scoped>
.stats-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 40rpx;
}

/* 月份选择器 */
.month-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
}

.selector-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  border-radius: 50%;
}

.selector-btn.disabled {
  opacity: 0.3;
}

.btn-arrow {
  font-size: 40rpx;
  color: #333333;
}

.month-display {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 30rpx;
  background: #f7f8fa;
  border-radius: 30rpx;
}

.month-text {
  font-size: 28rpx;
  color: #333333;
}

.month-arrow {
  font-size: 24rpx;
  color: #999999;
}

/* 收支概览 */
.overview-section {
  display: flex;
  background: #ffffff;
  margin: 0 30rpx 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.overview-item {
  flex: 1;
  padding: 30rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1rpx solid #f5f5f5;
}

.overview-item:last-child {
  border-right: none;
}

.overview-label {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 10rpx;
}

.overview-value {
  font-size: 32rpx;
  font-weight: bold;
}

.overview-value.income {
  color: #51cf66;
}

.overview-value.expense {
  color: #333333;
}

/* 图表区域 */
.chart-section {
  background: #ffffff;
  margin: 0 30rpx 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.type-toggle {
  display: flex;
  background: #f7f8fa;
  border-radius: 20rpx;
  padding: 4rpx;
}

.toggle-item {
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
}

.toggle-item.active {
  background: #ffffff;
}

.toggle-text {
  font-size: 24rpx;
  color: #999999;
}

.toggle-item.active .toggle-text {
  color: #333333;
}

.ring-chart-container,
.line-chart-container,
.pie-chart-container {
  width: 100%;
  height: 400rpx;
}

/* 图表空状态 */
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.chart-empty .empty-icon {
  font-size: 80rpx;
  margin-bottom: 15rpx;
  opacity: 0.5;
}

.chart-empty .empty-text {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 5rpx;
}

.chart-empty .empty-hint {
  font-size: 22rpx;
  color: #cccccc;
}

/* 分类列表 */
.category-list {
  margin-top: 30rpx;
  border-top: 1rpx solid #f5f5f5;
  padding-top: 20rpx;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.category-item:last-child {
  border-bottom: none;
}

.category-left {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.category-icon {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 28rpx;
  color: #ffffff;
}

.category-name {
  font-size: 28rpx;
  color: #333333;
}

.category-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.category-amount {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
}

.category-percent {
  font-size: 24rpx;
  color: #999999;
}

.category-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #999999;
}

/* 选择器弹窗 */
.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.picker-content {
  width: 100%;
  background: #ffffff;
  border-radius: 30rpx 30rpx 0 0;
  overflow: hidden;
}

.small-content {
  max-height: 40vh;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.picker-close {
  font-size: 40rpx;
  color: #999999;
}

.date-picker {
  height: 350rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70rpx;
  font-size: 28rpx;
}

.date-actions {
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.date-btn {
  width: 100%;
  height: 70rpx;
  background: #667eea;
  color: #ffffff;
  border-radius: 35rpx;
  font-size: 28rpx;
  border: none;
}
</style>
