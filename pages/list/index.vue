<template>
  <view class="list-container">
    <!-- 使用 z-paging 组件 -->
    <z-paging
      ref="pagingRef"
      v-model="transactions"
      @query="queryList"
      :default-page-size="pageSize"
      empty-text="暂无交易记录"
      empty-view-img="/static/empty.png"
      empty-view-text="暂无交易记录"
      empty-view-btn-text="去记账"
      @emptyViewClick="goRecord"
    >
      <!-- 顶部筛选栏插槽 -->
      <template #top>
        <view class="filter-bar">
          <view class="filter-item" @tap="showFilterPopup = true">
            <text class="filter-icon">🔍</text>
            <text class="filter-text">筛选</text>
          </view>
          <view class="filter-summary" v-if="hasActiveFilters">
            <text class="summary-text">{{ filterSummary }}</text>
            <text class="clear-btn" @tap="clearFilters">清除</text>
          </view>
        </view>
      </template>

      <!-- 分组列表 -->
      <view class="grouped-list" v-if="groupedTransactions.length > 0">
        <view
          class="date-group"
          v-for="group in groupedTransactions"
          :key="group.date"
        >
          <!-- 日期头部 -->
          <view class="date-header">
            <text class="date-text">{{ group.dateText }}</text>
            <text class="date-summary">
              收: ¥{{ formatMoney(group.income) }} | 支: ¥{{ formatMoney(group.expense) }}
            </text>
          </view>

          <!-- 交易项 -->
          <view
            class="transaction-item"
            v-for="item in group.transactions"
            :key="item._id"
            @tap="goDetail(item._id)"
          >
            <view class="item-left">
              <text class="item-icon">{{ getCategoryIcon(item) }}</text>
              <view class="item-info">
                <text class="item-category">{{ getCategoryName(item) }}</text>
                <text class="item-meta">{{ getAccountName(item) }} · {{ formatTime(item.transaction_date) }}</text>
              </view>
            </view>
            <view class="item-right">
              <text
                class="item-amount"
                :class="item.type === 'income' ? 'income' : 'expense'"
              >
                {{ item.type === 'income' ? '+' : '-' }}¥{{ formatMoney(item.amount) }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新建按钮 -->
    <view class="fab-add" @tap="goRecord">
      <text class="fab-icon">+</text>
    </view>

    <!-- 筛选弹窗 -->
    <view class="filter-mask" v-if="showFilterPopup" @tap="showFilterPopup = false">
      <view class="filter-popup" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">筛选条件</text>
          <text class="popup-close" @tap="showFilterPopup = false">✕</text>
        </view>

        <!-- 类型筛选 -->
        <view class="filter-section">
          <text class="section-label">交易类型</text>
          <view class="type-options">
            <view
              class="type-option"
              :class="{ active: filters.type === '' }"
              @tap="filters.type = ''"
            >
              <text class="option-text">全部</text>
            </view>
            <view
              class="type-option"
              :class="{ active: filters.type === 'expense' }"
              @tap="filters.type = 'expense'"
            >
              <text class="option-text">支出</text>
            </view>
            <view
              class="type-option"
              :class="{ active: filters.type === 'income' }"
              @tap="filters.type = 'income'"
            >
              <text class="option-text">收入</text>
            </view>
          </view>
        </view>

        <!-- 日期范围 -->
        <view class="filter-section">
          <text class="section-label">日期范围</text>
          <view class="date-range">
            <view class="date-input" @tap="showStartDatePicker = true">
              <text class="date-text">{{ filters.start_date || '开始日期' }}</text>
            </view>
            <text class="date-separator">至</text>
            <view class="date-input" @tap="showEndDatePicker = true">
              <text class="date-text">{{ filters.end_date || '结束日期' }}</text>
            </view>
          </view>
        </view>

        <!-- 分类筛选 -->
        <view class="filter-section">
          <text class="section-label">分类</text>
          <view class="category-select" @tap="showCategoryPicker = true">
            <text class="select-text">{{ selectedCategoryName || '全部分类' }}</text>
            <text class="select-arrow">›</text>
          </view>
        </view>

        <!-- 账户筛选 -->
        <view class="filter-section">
          <text class="section-label">账户</text>
          <view class="account-select" @tap="showAccountPicker = true">
            <text class="select-text">{{ selectedAccountName || '全部账户' }}</text>
            <text class="select-arrow">›</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="filter-actions">
          <button class="action-btn reset-btn" @tap="resetFilters">重置</button>
          <button class="action-btn confirm-btn" @tap="applyFilters">确定</button>
        </view>
      </view>
    </view>

    <!-- 分类选择弹窗 -->
    <view class="picker-mask" v-if="showCategoryPicker" @tap="showCategoryPicker = false">
      <view class="picker-content" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择分类</text>
          <text class="picker-close" @tap="showCategoryPicker = false">✕</text>
        </view>
        <scroll-view class="category-list" scroll-y>
          <view
            class="category-item"
            :class="{ selected: filters.category_id === '' }"
            @tap="selectCategory('')"
          >
            <text class="category-name">全部分类</text>
          </view>
          <view
            class="category-item"
            v-for="item in filterCategories"
            :key="item._id"
            :class="{ selected: filters.category_id === item._id }"
            @tap="selectCategory(item._id)"
          >
            <text class="category-icon">{{ item.icon || '📁' }}</text>
            <text class="category-name">{{ item.name }}</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 账户选择弹窗 -->
    <view class="picker-mask" v-if="showAccountPicker" @tap="showAccountPicker = false">
      <view class="picker-content" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择账户</text>
          <text class="picker-close" @tap="showAccountPicker = false">✕</text>
        </view>
        <scroll-view class="account-list" scroll-y>
          <view
            class="account-item"
            :class="{ selected: filters.account_id === '' }"
            @tap="selectAccount('')"
          >
            <text class="account-name">全部账户</text>
          </view>
          <view
            class="account-item"
            v-for="item in filterAccounts"
            :key="item._id"
            :class="{ selected: filters.account_id === item._id }"
            @tap="selectAccount(item._id)"
          >
            <text class="account-icon">{{ item.icon || '💳' }}</text>
            <text class="account-name">{{ item.name }}</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 日期选择器 -->
    <view class="picker-mask" v-if="showStartDatePicker || showEndDatePicker" @tap="closeDatePicker">
      <view class="picker-content small-content" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">{{ showStartDatePicker ? '选择开始日期' : '选择结束日期' }}</text>
          <text class="picker-close" @tap="closeDatePicker">✕</text>
        </view>
        <!-- @ts-ignore -->
        <picker-view class="date-picker" :value="datePickerValue" @change="onDateChange">
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
          <picker-view-column>
            <view v-for="(item, index) in days" :key="index" class="picker-item">
              {{ item }}日
            </view>
          </picker-view-column>
        </picker-view>
        <view class="date-actions">
          <button class="date-btn" @tap="confirmDate">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

// z-paging ref
const pagingRef = ref()

// 状态
const transactions = ref<any[]>([])

// 分页
const pageSize = 20

// 筛选
const showFilterPopup = ref(false)
const filters = ref({
  type: '',
  category_id: '',
  account_id: '',
  start_date: '',
  end_date: ''
})

// 选择器状态
const showCategoryPicker = ref(false)
const showAccountPicker = ref(false)
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)

// 筛选选项数据
const filterCategories = ref<any[]>([])
const filterAccounts = ref<any[]>([])
const selectedCategoryName = ref('')
const selectedAccountName = ref('')

// 日期选择器
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)
})
const months = computed(() => Array.from({ length: 12 }, (_, i) => i + 1))
const days = computed(() => {
  const year = datePickerValue.value[0]
  const month = datePickerValue.value[1]
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => i + 1)
})
const datePickerValue = ref([years.value[5], new Date().getMonth() + 1, new Date().getDate()])

/**
 * 是否有激活的筛选
 */
const hasActiveFilters = computed(() => {
  return filters.value.type !== '' ||
         filters.value.category_id !== '' ||
         filters.value.account_id !== '' ||
         filters.value.start_date !== '' ||
         filters.value.end_date !== ''
})

/**
 * 筛选摘要
 */
const filterSummary = computed(() => {
  const parts: string[] = []
  if (filters.value.type === 'expense') parts.push('支出')
  if (filters.value.type === 'income') parts.push('收入')
  if (selectedCategoryName.value) parts.push(selectedCategoryName.value)
  if (selectedAccountName.value) parts.push(selectedAccountName.value)
  return parts.join(' · ') || '全部'
})

/**
 * 按日期分组交易
 */
const groupedTransactions = computed(() => {
  const groups: Record<string, any> = {}

  transactions.value.forEach(t => {
    // 处理日期格式：支持 Date 对象、ISO 字符串、时间戳
    let date: Date
    if (t.transaction_date && t.transaction_date.$date) {
      // uniCloud Date 格式
      date = new Date(t.transaction_date.$date)
    } else {
      date = new Date(t.transaction_date)
    }

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无效的日期格式:', t.transaction_date)
      return
    }

    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    if (!groups[dateKey]) {
      // 计算日期显示
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let dateText = `${date.getMonth() + 1}月${date.getDate()}日`
      if (dateKey === formatDateKey(today)) {
        dateText = '今天'
      } else if (dateKey === formatDateKey(yesterday)) {
        dateText = '昨天'
      }

      groups[dateKey] = {
        date: dateKey,
        dateText: dateText,
        income: 0,
        expense: 0,
        transactions: []
      }
    }

    groups[dateKey].transactions.push(t)
    if (t.type === 'income') {
      groups[dateKey].income += t.amount
    } else {
      groups[dateKey].expense += t.amount
    }
  })

  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
})

/**
 * 格式化日期key
 */
const formatDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * 格式化金额
 */
const formatMoney = (val: number) => {
  return val.toFixed(2)
}

/**
 * 格式化时间
 */
const formatTime = (dateStr: any) => {
  let date: Date
  if (dateStr && dateStr.$date) {
    // uniCloud Date 格式
    date = new Date(dateStr.$date)
  } else {
    date = new Date(dateStr)
  }
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/**
 * 获取分类图标
 */
const getCategoryIcon = (item: any) => {
  return item.categoryIcon || (item.type === 'income' ? '💰' : '💸')
}

/**
 * 获取分类名称
 */
const getCategoryName = (item: any) => {
  return item.categoryName || item.remark || '未分类'
}

/**
 * 获取账户名称
 */
const getAccountName = (item: any) => {
  return item.accountName || '未知账户'
}

/**
 * z-paging 分页查询
 */
const queryList = async (pageNo: number, pageSize: number) => {
  console.log('===== queryList 开始 =====')
  console.log('pageNo:', pageNo, 'pageSize:', pageSize)
  console.log('openid:', userStore.openid)
  console.log('调用云函数名称: transaction')

  try {
    const functionName = 'transaction'
    console.log('准备调用云函数:', functionName)

    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: functionName,
      data: {
        action: 'list',
        openid: userStore.openid,
        data: {
          page: pageNo,
          pageSize: pageSize,
          ...filters.value
        }
      }
    })

    console.log('云函数返回完整结果:', res.result)
    console.log('返回的数据列表:', res.result?.data?.list)

    if (res.result.code === 0) {
      const result = res.result.data
      console.log('result.list:', result.list)
      console.log('result.list 长度:', result.list?.length)
      // 将结果传给 z-paging，它会自动处理分页和数据拼接
      pagingRef.value?.complete(result.list || [])
    } else {
      console.error('云函数返回错误:', res.result.message)
      // 请求失败，传递 false 告知 z-paging
      pagingRef.value?.complete(false)
    }
  } catch (error) {
    console.error('加载交易列表失败：', error)
    // 请求失败，传递 false 告知 z-paging
    pagingRef.value?.complete(false)
  }
}

/**
 * 跳转详情
 */
const goDetail = (id: string) => {
  // @ts-ignore
  uni.navigateTo({
    url: `/pages/detail/index?id=${id}`
  })
}

/**
 * 跳转记账
 */
const goRecord = () => {
  // @ts-ignore
  uni.navigateTo({
    url: '/pages/record/index'
  })
}

/**
 * 清除筛选
 */
const clearFilters = () => {
  filters.value = {
    type: '',
    category_id: '',
    account_id: '',
    start_date: '',
    end_date: ''
  }
  selectedCategoryName.value = ''
  selectedAccountName.value = ''
  // 刷新列表
  pagingRef.value?.reload()
}

/**
 * 应用筛选
 */
const applyFilters = () => {
  showFilterPopup.value = false
  // 刷新列表
  pagingRef.value?.reload()
}

/**
 * 重置筛选
 */
const resetFilters = () => {
  filters.value = {
    type: '',
    category_id: '',
    account_id: '',
    start_date: '',
    end_date: ''
  }
  selectedCategoryName.value = ''
  selectedAccountName.value = ''
}

/**
 * 选择分类
 */
const selectCategory = (id: string) => {
  filters.value.category_id = id
  const category = filterCategories.value.find((c: any) => c._id === id)
  selectedCategoryName.value = category ? category.name : ''
  showCategoryPicker.value = false
}

/**
 * 选择账户
 */
const selectAccount = (id: string) => {
  filters.value.account_id = id
  const account = filterAccounts.value.find((a: any) => a._id === id)
  selectedAccountName.value = account ? account.name : ''
  showAccountPicker.value = false
}

/**
 * 日期变化
 */
const onDateChange = (e: any) => {
  datePickerValue.value = e.detail.value
}

/**
 * 确认日期
 */
const confirmDate = () => {
  const [year, month, day] = datePickerValue.value
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  if (showStartDatePicker.value) {
    filters.value.start_date = dateStr
    showStartDatePicker.value = false
  } else if (showEndDatePicker.value) {
    filters.value.end_date = dateStr
    showEndDatePicker.value = false
  }
}

/**
 * 关闭日期选择器
 */
const closeDatePicker = () => {
  showStartDatePicker.value = false
  showEndDatePicker.value = false
}

/**
 * 加载筛选选项
 */
const loadFilterOptions = async () => {
  // 加载分类
  try {
    // @ts-ignore
    const catRes = await uniCloud.callFunction({
      name: 'category',
      data: { action: 'list', openid: userStore.openid, data: {} }
    })
    if (catRes.result.code === 0) {
      filterCategories.value = catRes.result.data || []
    }
  } catch (error) {
    console.error('加载分类失败：', error)
  }

  // 加载账户
  try {
    // @ts-ignore
    const accRes = await uniCloud.callFunction({
      name: 'account',
      data: { action: 'list', openid: userStore.openid }
    })
    if (accRes.result.code === 0) {
      filterAccounts.value = accRes.result.data || []
    }
  } catch (error) {
    console.error('加载账户失败：', error)
  }
}

/**
 * 页面加载
 */
onMounted(() => {
  loadFilterOptions()
})

/**
 * 页面显示时刷新数据
 */
const onShow = () => {
  // 刷新列表
  pagingRef.value?.reload()
}

// 暴露 onShow 供 uni-app 调用
defineExpose({
  onShow
})
</script>

<style scoped>
.list-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  background: #f5f5f5;
}

.filter-icon {
  font-size: 28rpx;
}

.filter-text {
  font-size: 26rpx;
  color: #666666;
}

.filter-summary {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-text {
  font-size: 24rpx;
  color: #999999;
  flex: 1;
}

.clear-btn {
  font-size: 24rpx;
  color: #667eea;
  margin-left: 10rpx;
}

/* 分组列表 */
.grouped-list {
  padding-bottom: 120rpx;
}

.date-group {
  margin-bottom: 20rpx;
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #f5f5f5;
}

.date-text {
  font-size: 26rpx;
  color: #666666;
}

.date-summary {
  font-size: 24rpx;
  color: #999999;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.item-icon {
  font-size: 40rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.item-category {
  font-size: 30rpx;
  color: #333333;
}

.item-meta {
  font-size: 24rpx;
  color: #999999;
}

.item-amount {
  font-size: 32rpx;
  font-weight: 500;
}

.item-amount.income {
  color: #51cf66;
}

.item-amount.expense {
  color: #333333;
}

/* 悬浮按钮 */
.fab-add {
  position: fixed;
  right: 40rpx;
  bottom: 120rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.4);
  z-index: 100;
}

.fab-icon {
  font-size: 50rpx;
  color: #ffffff;
  font-weight: 300;
}

/* 筛选弹窗 */
.filter-mask {
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

.filter-popup {
  width: 100%;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 30rpx 30rpx 0 0;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  background: #ffffff;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.popup-close {
  font-size: 40rpx;
  color: #999999;
}

.filter-section {
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.section-label {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 20rpx;
  display: block;
}

.type-options {
  display: flex;
  gap: 20rpx;
}

.type-option {
  flex: 1;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30rpx;
  background: #f5f5f5;
}

.type-option.active {
  background: #667eea;
}

.option-text {
  font-size: 26rpx;
  color: #999999;
}

.type-option.active .option-text {
  color: #ffffff;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.date-input {
  flex: 1;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10rpx;
  background: #f5f5f5;
}

.date-text {
  font-size: 26rpx;
  color: #333333;
}

.date-separator {
  font-size: 24rpx;
  color: #999999;
}

.category-select,
.account-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60rpx;
  padding: 0 20rpx;
  border-radius: 10rpx;
  background: #f5f5f5;
}

.select-text {
  font-size: 26rpx;
  color: #333333;
}

.select-arrow {
  font-size: 40rpx;
  color: #cccccc;
}

.filter-actions {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
  position: sticky;
  bottom: 0;
  background: #ffffff;
}

.action-btn {
  flex: 1;
  height: 70rpx;
  border-radius: 35rpx;
  font-size: 28rpx;
  border: none;
}

.reset-btn {
  background: #f5f5f5;
  color: #666666;
}

.confirm-btn {
  background: #667eea;
  color: #ffffff;
}

/* 选择器弹窗 */
.picker-content {
  width: 100%;
  max-height: 50vh;
  background: #ffffff;
  border-radius: 30rpx 30rpx 0 0;
  overflow: hidden;
}

.small-content {
  max-height: 40vh;
}

.picker-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.category-list,
.account-list {
  height: 40vh;
}

.category-item,
.account-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.category-item.selected,
.account-item.selected {
  background: #f0f7ff;
}

.category-icon,
.account-icon {
  font-size: 36rpx;
  margin-right: 15rpx;
}

.category-name,
.account-name {
  font-size: 28rpx;
  color: #333333;
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
