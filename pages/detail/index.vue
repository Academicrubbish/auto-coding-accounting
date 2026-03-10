<template>
  <view class="detail-container">
    <view class="detail-card" v-if="transaction">
      <!-- 金额卡片 -->
      <view class="amount-card" :class="transaction.type === 'income' ? 'income' : 'expense'">
        <text class="amount-type">{{ transaction.type === 'income' ? '收入' : '支出' }}</text>
        <text class="amount-value">{{ transaction.type === 'income' ? '+' : '-' }}¥{{ formatMoney(transaction.amount) }}</text>
      </view>

      <!-- 详细信息 -->
      <view class="info-section">
        <view class="info-item">
          <text class="info-label">分类</text>
          <view class="info-value">
            <text class="info-icon">{{ getCategoryIcon(transaction) }}</text>
            <text class="info-text">{{ getCategoryName(transaction) }}</text>
          </view>
        </view>

        <view class="info-item">
          <text class="info-label">账户</text>
          <view class="info-value">
            <text class="info-icon">💳</text>
            <text class="info-text">{{ getAccountName(transaction) }}</text>
          </view>
        </view>

        <view class="info-item">
          <text class="info-label">日期</text>
          <text class="info-text">{{ formatDateTime(transaction.transaction_date) }}</text>
        </view>

        <view class="info-item" v-if="transaction.remark">
          <text class="info-label">备注</text>
          <text class="info-text remark-text">{{ transaction.remark }}</text>
        </view>

        <view class="info-item">
          <text class="info-label">创建时间</text>
          <text class="info-text">{{ formatDateTime(transaction.created_at) }}</text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-else-if="isLoading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view class="error-state" v-else>
      <text class="error-icon">⚠️</text>
      <text class="error-text">加载失败</text>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section" v-if="transaction">
      <button class="action-btn edit-btn" @tap="handleEdit">
        <text class="btn-icon">✏️</text>
        <text class="btn-text">编辑</text>
      </button>
      <button class="action-btn delete-btn" @tap="handleDelete">
        <text class="btn-icon">🗑️</text>
        <text class="btn-text">删除</text>
      </button>
    </view>

    <!-- 删除确认弹窗 -->
    <view class="confirm-mask" v-if="showDeleteConfirm" @tap="showDeleteConfirm = false">
      <view class="confirm-popup" @tap.stop>
        <view class="confirm-header">
          <text class="confirm-title">确认删除</text>
        </view>
        <view class="confirm-body">
          <text class="confirm-message">确定要删除这条交易记录吗？</text>
          <text class="confirm-hint">删除后将恢复账户余额，此操作不可撤销</text>
        </view>
        <view class="confirm-actions">
          <button class="confirm-btn cancel-btn" @tap="showDeleteConfirm = false">取消</button>
          <button class="confirm-btn ok-btn" @tap="confirmDelete" :disabled="isDeleting">
            <text v-if="isDeleting">删除中...</text>
            <text v-else>确定</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

// 从页面参数获取交易ID
const transactionId = ref('')
const transaction = ref<any>(null)
const isLoading = ref(true)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)

/**
 * 格式化金额
 */
const formatMoney = (val: number) => {
  return val.toFixed(2)
}

/**
 * 格式化日期时间
 */
const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

/**
 * 获取分类图标
 */
const getCategoryIcon = (item: any) => {
  return item.categoryIcon || (item.type === 'income' ? '💰' : '💸')
}

/**
 * 获取分类名称（优先显示备注，无备注则显示分类名称）
 */
const getCategoryName = (item: any) => {
  return item.categoryName || '未分类'
}

/**
 * 获取账户名称
 */
const getAccountName = (item: any) => {
  return item.accountName || '未知账户'
}

/**
 * 加载交易详情
 */
const loadTransaction = async () => {
  if (!transactionId.value) return

  isLoading.value = true

  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'transaction',
      data: {
        action: 'getById',
        openid: userStore.openid,
        data: { _id: transactionId.value }
      }
    })

    if (res.result.code === 0) {
      transaction.value = res.result.data
    } else {
      // @ts-ignore
      uni.showToast({
        title: res.result.message || '加载失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('加载交易详情失败：', error)
    // @ts-ignore
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

/**
 * 编辑交易
 */
const handleEdit = () => {
  // 跳转到记账页面，传递交易ID用于编辑模式
  // @ts-ignore
  uni.navigateTo({
    url: `/pages/record/index?id=${transactionId.value}&mode=edit`
  })
}

/**
 * 删除交易
 */
const handleDelete = () => {
  showDeleteConfirm.value = true
}

/**
 * 确认删除
 */
const confirmDelete = async () => {
  if (isDeleting.value) return

  isDeleting.value = true

  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'transaction',
      data: {
        action: 'delete',
        openid: userStore.openid,
        data: { _id: transactionId.value }
      }
    })

    if (res.result.code === 0) {
      // @ts-ignore
      uni.showToast({
        title: '删除成功',
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
        title: res.result.message || '删除失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('删除交易失败：', error)
    // @ts-ignore
    uni.showToast({
      title: '删除失败，请重试',
      icon: 'none'
    })
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

/**
 * 页面加载
 */
onMounted(() => {
  // @ts-ignore
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  if (options.id) {
    transactionId.value = options.id
    loadTransaction()
  }
})

/**
 * 页面显示时刷新数据（从编辑页返回时会触发）
 */
onShow(() => {
  // 如果已经有transactionId，说明是返回操作，需要刷新数据
  if (transactionId.value) {
    loadTransaction()
  }
})
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

/* 详情卡片 */
.detail-card {
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 100rpx;
}

/* 金额卡片 */
.amount-card {
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.amount-card.income {
  background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
}

.amount-card.expense {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
}

.amount-type {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 15rpx;
}

.amount-value {
  font-size: 64rpx;
  font-weight: bold;
  color: #ffffff;
}

/* 详细信息 */
.info-section {
  padding: 0 40rpx 40rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #999999;
}

.info-value {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.info-icon {
  font-size: 32rpx;
}

.info-text {
  font-size: 28rpx;
  color: #333333;
  text-align: right;
}

.remark-text {
  max-width: 400rpx;
  word-break: break-all;
}

/* 加载状态 */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 200rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999999;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
}

.error-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.error-text {
  font-size: 28rpx;
  color: #999999;
}

/* 操作按钮 */
.action-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  font-size: 28rpx;
  border: none;
}

.edit-btn {
  background: #667eea;
  color: #ffffff;
}

.delete-btn {
  background: #f5f5f5;
  color: #ff6b6b;
}

.btn-icon {
  font-size: 32rpx;
}

.btn-text {
  font-size: 28rpx;
  font-weight: 500;
}

/* 删除确认弹窗 */
.confirm-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-popup {
  width: 600rpx;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.confirm-header {
  padding: 30rpx;
  text-align: center;
  border-bottom: 1rpx solid #f0f0f0;
}

.confirm-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.confirm-body {
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
}

.confirm-message {
  font-size: 30rpx;
  color: #333333;
}

.confirm-hint {
  font-size: 24rpx;
  color: #999999;
}

.confirm-actions {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.confirm-btn {
  flex: 1;
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  border: none;
  background: transparent;
}

.cancel-btn {
  color: #666666;
  border-right: 1rpx solid #f0f0f0;
}

.ok-btn {
  color: #ff6b6b;
  font-weight: bold;
}
</style>
