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
          ¥{{ formatMoney(Math.abs(monthBalance)) }}
        </text>
      </view>
    </view>

    <!-- 每日趋势 -->
    <view class="trend-section">
      <view class="section-header">
        <text class="section-title">每日收支</text>
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

      <!-- 简单柱状图 -->
      <scroll-view class="trend-chart" scroll-x>
        <view class="chart-container" v-if="dailyData.length > 0">
          <view
            class="chart-bar"
            v-for="item in dailyData"
            :key="item.date"
          >
            <view class="bar-wrapper">
              <view
                class="bar income-bar"
                :style="{ height: getBarHeight(item.income, maxIncome) }"
                v-if="trendType === 'all' || trendType === 'income'"
              >
                <text class="bar-amount" v-if="item.income > 0">{{ formatMoney(item.income) }}</text>
              </view>
              <view
                class="bar expense-bar"
                :style="{ height: getBarHeight(item.expense, maxExpense) }"
                v-if="trendType === 'all' || trendType === 'expense'"
              >
                <text class="bar-amount" v-if="item.expense > 0">{{ formatMoney(item.expense) }}</text>
              </view>
            </view>
            <text class="bar-label">{{ formatDayLabel(item.date) }}</text>
          </view>
        </view>
        <view class="chart-empty" v-else>
          <text class="empty-text">暂无数据</text>
        </view>
      </scroll-view>
    </view>

    <!-- 分类统计 -->
    <view class="category-section">
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

      <!-- 分类列表 -->
      <view class="category-list" v-if="categoryData.length > 0">
        <view
          class="category-item"
          v-for="(item, index) in categoryData"
          :key="item.category_id"
        >
          <view class="category-left">
            <text class="category-icon" :style="{ background: getCategoryColor(index) }">
              {{ item.icon || '📁' }}
            </text>
            <text class="category-name">{{ item.name }}</text>
          </view>
          <view class="category-right">
            <text class="category-amount">¥{{ formatMoney(item.amount) }}</text>
            <view class="category-progress">
              <view
                class="progress-bar"
                :style="{ width: item.percentage + '%', background: getCategoryColor(index) }"
              ></view>
            </view>
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
import { ref, computed, onMounted } from 'vue'

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

// 日期选择器
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})
const months = computed(() => Array.from({ length: 12 }, (_, i) => i + 1))
const monthPickerValue = ref([2, new Date().getMonth() + 1])

// 计算最大值用于图表
const maxIncome = computed(() => {
  const max = Math.max(...dailyData.value.map(d => d.income))
  return max || 100
})
const maxExpense = computed(() => {
  const max = Math.max(...dailyData.value.map(d => d.expense))
  return max || 100
})

// 是否是当前月份
const isCurrentMonth = computed(() => {
  const now = new Date()
  return currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth() + 1
})

/**
 * 格式化金额
 */
const formatMoney = (val: number) => {
  return val.toFixed(2)
}

/**
 * 格式化日期标签
 */
const formatDayLabel = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * 获取柱状图高度
 */
const getBarHeight = (value: number, max: number) => {
  if (max === 0) return '0%'
  const height = (value / max) * 100
  return Math.max(height, 0) + '%'
}

/**
 * 获取分类颜色
 */
const getCategoryColor = (index: number) => {
  const colors = ['#667eea', '#51cf66', '#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#ff9f43', '#54a0ff']
  return colors[index % colors.length]
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
    // 计算月份起止日期
    const startDate = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-01`
    const endDate = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-31`

    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'statistics',
      data: {
        action: 'category',
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
</script>

<style scoped>
.stats-container {
  min-height: 100vh;
  background: #f5f5f5;
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
  background: #f5f5f5;
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
  background: #f5f5f5;
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

/* 趋势图 */
.trend-section {
  background: #ffffff;
  margin: 0 30rpx 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.type-toggle {
  display: flex;
  background: #f5f5f5;
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

.trend-chart {
  width: 100%;
}

.chart-container {
  display: flex;
  height: 300rpx;
  padding-top: 20rpx;
}

.chart-bar {
  flex: 0 0 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 10rpx;
}

.bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 4rpx;
}

.bar {
  width: 100%;
  min-height: 4rpx;
  border-radius: 4rpx 4rpx 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4rpx;
}

.income-bar {
  background: #51cf66;
}

.expense-bar {
  background: #ff6b6b;
}

.bar-amount {
  font-size: 16rpx;
  color: #ffffff;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.bar-label {
  font-size: 20rpx;
  color: #999999;
  margin-top: 8rpx;
}

.chart-empty {
  height: 300rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 24rpx;
  color: #cccccc;
}

/* 分类统计 */
.category-section {
  background: #ffffff;
  margin: 0 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.category-list {
  margin-top: 20rpx;
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
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 28rpx;
}

.category-name {
  font-size: 28rpx;
  color: #333333;
}

.category-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  margin-left: 30rpx;
}

.category-amount {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
}

.category-progress {
  width: 200rpx;
  height: 8rpx;
  background: #f5f5f5;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 4rpx;
}

.category-percent {
  font-size: 22rpx;
  color: #999999;
}

.category-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
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
