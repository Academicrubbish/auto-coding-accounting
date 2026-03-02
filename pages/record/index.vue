<template>
  <view class="record-container">
    <!-- 类型切换 -->
    <view class="type-switch">
      <view
        class="type-item"
        :class="{ active: recordType === 'expense' }"
        @tap="switchType('expense')"
      >
        <text class="type-text">支出</text>
      </view>
      <view
        class="type-item"
        :class="{ active: recordType === 'income' }"
        @tap="switchType('income')"
      >
        <text class="type-text">收入</text>
      </view>
    </view>

    <!-- 金额输入 -->
    <view class="amount-section">
      <text class="amount-label">金额</text>
      <view class="amount-input-wrapper">
        <text class="amount-symbol">¥</text>
        <input
          class="amount-input"
          type="digit"
          v-model="amount"
          placeholder="0.00"
          @input="onAmountInput"
        />
      </view>
    </view>

    <!-- 分类选择 -->
    <view class="form-section">
      <view class="form-item" @tap="showCategoryPicker = true">
        <view class="form-label">
          <text class="label-icon">{{ selectedCategoryIcon }}</text>
          <text class="label-text">分类</text>
        </view>
        <view class="form-value">
          <text class="value-text">{{ selectedCategoryName || '请选择' }}</text>
          <text class="value-arrow">›</text>
        </view>
      </view>

      <!-- 账户选择 -->
      <view class="form-item" @tap="showAccountPicker = true">
        <view class="form-label">
          <text class="label-icon">💳</text>
          <text class="label-text">账户</text>
        </view>
        <view class="form-value">
          <text class="value-text">{{ selectedAccountName || '请选择' }}</text>
          <text class="value-arrow">›</text>
        </view>
      </view>

      <!-- 日期选择 -->
      <view class="form-item" @tap="showDatePicker = true">
        <view class="form-label">
          <text class="label-icon">📅</text>
          <text class="label-text">日期</text>
        </view>
        <view class="form-value">
          <text class="value-text">{{ formatDateDisplay(transactionDate) }}</text>
          <text class="value-arrow">›</text>
        </view>
      </view>

      <!-- 备注输入 -->
      <view class="form-item remark-item">
        <view class="form-label">
          <text class="label-icon">📝</text>
          <text class="label-text">备注</text>
        </view>
        <input
          class="remark-input"
          v-model="remark"
          placeholder="添加备注（可选）"
          maxlength="50"
        />
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button
        class="submit-btn"
        :class="{ 'expense-btn': recordType === 'expense', 'income-btn': recordType === 'income' }"
        @tap="handleSubmit"
        :disabled="isSubmitting"
      >
        <text v-if="isSubmitting">提交中...</text>
        <text v-else>确认记账</text>
      </button>
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
            v-for="item in categories"
            :key="item._id"
            :class="{ selected: selectedCategoryId === item._id }"
            @tap="selectCategory(item)"
          >
            <text class="category-icon">{{ item.icon || '📁' }}</text>
            <text class="category-name">{{ item.name }}</text>
            <text class="category-check" v-if="selectedCategoryId === item._id">✓</text>
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
            v-for="item in accounts"
            :key="item._id"
            :class="{ selected: selectedAccountId === item._id }"
            @tap="selectAccount(item)"
          >
            <text class="account-icon">{{ item.icon || '💳' }}</text>
            <view class="account-info">
              <text class="account-name">{{ item.name }}</text>
              <text class="account-balance">¥{{ formatMoney(item.balance) }}</text>
            </view>
            <text class="account-check" v-if="selectedAccountId === item._id">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 日期选择弹窗 -->
    <view class="picker-mask" v-if="showDatePicker" @tap="showDatePicker = false">
      <view class="picker-content small-content" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择日期</text>
          <text class="picker-close" @tap="showDatePicker = false">✕</text>
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
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

// 从页面参数获取类型
const props = defineProps<{
  type?: string
}>()

// 状态
const recordType = ref<'expense' | 'income'>('expense')
const amount = ref('')
const selectedCategoryId = ref('')
const selectedCategoryName = ref('')
const selectedCategoryIcon = ref('📁')
const selectedAccountId = ref('')
const selectedAccountName = ref('')
const remark = ref('')
const transactionDate = ref(new Date())
const isSubmitting = ref(false)

// 弹窗状态
const showCategoryPicker = ref(false)
const showAccountPicker = ref(false)
const showDatePicker = ref(false)

// 数据列表
const categories = ref<any[]>([])
const accounts = ref<any[]>([])

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
 * 格式化金额
 */
const formatMoney = (val: number) => {
  return val.toFixed(2)
}

/**
 * 格式化日期显示
 */
const formatDateDisplay = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 切换收支类型
 */
const switchType = (type: 'expense' | 'income') => {
  recordType.value = type
  // 重置分类选择
  selectedCategoryId.value = ''
  selectedCategoryName.value = ''
  selectedCategoryIcon.value = '📁'
  // 重新加载分类
  loadCategories()
}

/**
 * 金额输入
 */
const onAmountInput = (e: any) => {
  let value = e.detail.value
  // 限制两位小数
  if (value.includes('.')) {
    const parts = value.split('.')
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2)
      amount.value = value
    }
  }
}

/**
 * 加载分类列表
 */
const loadCategories = async () => {
  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'category',
      data: {
        action: 'list',
        data: { type: recordType.value },
        openid: userStore.openid
      }
    })

    if (res.result.code === 0) {
      categories.value = res.result.data || []
    }
  } catch (error) {
    console.error('加载分类失败：', error)
  }
}

/**
 * 加载账户列表
 */
const loadAccounts = async () => {
  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'account',
      data: {
        action: 'list',
        openid: userStore.openid
      }
    })

    if (res.result.code === 0) {
      accounts.value = res.result.data || []
      // 设置默认账户
      const defaultAccount = accounts.value.find((a: any) => a.is_default)
      if (defaultAccount) {
        selectedAccountId.value = defaultAccount._id
        selectedAccountName.value = defaultAccount.name
      }
    }
  } catch (error) {
    console.error('加载账户失败：', error)
  }
}

/**
 * 选择分类
 */
const selectCategory = (item: any) => {
  selectedCategoryId.value = item._id
  selectedCategoryName.value = item.name
  selectedCategoryIcon.value = item.icon || '📁'
  showCategoryPicker.value = false
}

/**
 * 选择账户
 */
const selectAccount = (item: any) => {
  selectedAccountId.value = item._id
  selectedAccountName.value = item.name
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
  transactionDate.value = new Date(year, month - 1, day)
  showDatePicker.value = false
}

/**
 * 提交记账
 */
const handleSubmit = async () => {
  if (isSubmitting.value) return

  // 验证
  const numAmount = parseFloat(amount.value)
  if (!amount.value || isNaN(numAmount) || numAmount <= 0) {
    // @ts-ignore
    uni.showToast({
      title: '请输入有效金额',
      icon: 'none'
    })
    return
  }

  if (!selectedCategoryId.value) {
    // @ts-ignore
    uni.showToast({
      title: '请选择分类',
      icon: 'none'
    })
    return
  }

  if (!selectedAccountId.value) {
    // @ts-ignore
    uni.showToast({
      title: '请选择账户',
      icon: 'none'
    })
    return
  }

  isSubmitting.value = true

  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'transaction',
      data: {
        action: 'create',
        data: {
          account_id: selectedAccountId.value,
          category_id: selectedCategoryId.value,
          type: recordType.value,
          amount: numAmount,
          remark: remark.value,
          transaction_date: transactionDate.value
        },
        openid: userStore.openid
      }
    })

    if (res.result.code === 0) {
      // @ts-ignore
      uni.showToast({
        title: '记账成功',
        icon: 'success'
      })

      // 延迟返回
      setTimeout(() => {
        // @ts-ignore
        uni.navigateBack()
      }, 500)
    } else {
      // @ts-ignore
      uni.showToast({
        title: res.result.message || '记账失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('记账失败：', error)
    // @ts-ignore
    uni.showToast({
      title: '记账失败，请重试',
      icon: 'none'
    })
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 页面加载
 */
onMounted(() => {
  // 从参数获取类型
  // @ts-ignore
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  if (options.type && (options.type === 'income' || options.type === 'expense')) {
    recordType.value = options.type
  }

  loadCategories()
  loadAccounts()
})
</script>

<style scoped>
.record-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 类型切换 */
.type-switch {
  display: flex;
  background: #ffffff;
  padding: 20rpx 30rpx;
  gap: 20rpx;
}

.type-item {
  flex: 1;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 35rpx;
  background: #f5f5f5;
  transition: all 0.3s;
}

.type-item.active {
  background: #667eea;
}

.type-item.active .type-text {
  color: #ffffff;
}

.type-text {
  font-size: 30rpx;
  color: #999999;
}

/* 金额输入 */
.amount-section {
  background: #ffffff;
  margin: 20rpx 30rpx;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
}

.amount-label {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 20rpx;
}

.amount-input-wrapper {
  display: flex;
  align-items: baseline;
}

.amount-symbol {
  font-size: 60rpx;
  font-weight: bold;
  color: #333333;
  margin-right: 10rpx;
}

.amount-input {
  flex: 1;
  font-size: 80rpx;
  font-weight: bold;
  color: #333333;
}

/* 表单 */
.form-section {
  background: #ffffff;
  margin: 0 30rpx 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.form-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.label-icon {
  font-size: 36rpx;
}

.label-text {
  font-size: 30rpx;
  color: #333333;
}

.form-value {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.value-text {
  font-size: 28rpx;
  color: #666666;
}

.value-arrow {
  font-size: 40rpx;
  color: #cccccc;
}

.remark-item {
  display: block;
}

.remark-input {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #333333;
}

/* 提交按钮 */
.submit-section {
  padding: 30rpx;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
  border: none;
}

.submit-btn.expense-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
}

.submit-btn.income-btn {
  background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
}

/* 弹窗 */
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
  max-height: 70vh;
  background: #ffffff;
  border-radius: 30rpx 30rpx 0 0;
  overflow: hidden;
}

.small-content {
  max-height: 50vh;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.picker-close {
  font-size: 40rpx;
  color: #999999;
}

/* 分类列表 */
.category-list {
  height: 50vh;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.category-item.selected {
  background: #f0f7ff;
}

.category-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.category-name {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
}

.category-check {
  font-size: 32rpx;
  color: #667eea;
}

/* 账户列表 */
.account-list {
  height: 50vh;
}

.account-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.account-item.selected {
  background: #f0f7ff;
}

.account-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.account-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.account-name {
  font-size: 30rpx;
  color: #333333;
}

.account-balance {
  font-size: 24rpx;
  color: #999999;
}

.account-check {
  font-size: 32rpx;
  color: #667eea;
}

/* 日期选择器 */
.date-picker {
  height: 400rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
}

.date-actions {
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.date-btn {
  width: 100%;
  height: 80rpx;
  background: #667eea;
  color: #ffffff;
  border-radius: 40rpx;
  font-size: 30rpx;
  border: none;
}
</style>
