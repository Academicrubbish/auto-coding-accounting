<template>
  <view class="home-container">
    <!-- 顶部总资产卡片 -->
    <view class="asset-card">
      <view class="asset-header">
        <text class="asset-label">总资产</text>
        <text class="asset-value">¥{{ formatMoney(totalAssets) }}</text>
      </view>
      <view class="asset-detail">
        <view class="detail-item">
          <text class="detail-label">本月收入</text>
          <text class="detail-value income">+¥{{ formatMoney(monthIncome) }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">本月支出</text>
          <text class="detail-value expense">-¥{{ formatMoney(monthExpense) }}</text>
        </view>
      </view>
    </view>

    <!-- 快捷记账按钮 -->
    <view class="quick-actions">
      <button class="action-btn expense-btn" @tap="goRecord('expense')">
        <text class="action-icon">💸</text>
        <text class="action-text">记支出</text>
      </button>
      <button class="action-btn income-btn" @tap="goRecord('income')">
        <text class="action-icon">💰</text>
        <text class="action-text">记收入</text>
      </button>
    </view>

    <!-- 近期交易 -->
    <view class="recent-section">
      <view class="section-header">
        <text class="section-title">近期交易</text>
        <text class="section-more" @tap="goList">查看全部</text>
      </view>
      <view class="transaction-list" v-if="recentTransactions.length > 0">
        <view
          class="transaction-item"
          v-for="item in recentTransactions"
          :key="item._id"
          @tap="goDetail(item._id)"
        >
          <view class="item-left">
            <text class="item-icon">{{ item.categoryIcon || '📝' }}</text>
            <view class="item-info">
              <text class="item-category">{{ item.categoryName || '未分类' }}</text>
              <text class="item-date">{{ formatDate(item.transaction_date) }}</text>
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
      <view class="empty-state" v-else>
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无交易记录</text>
        <text class="empty-hint">点击上方按钮开始记账</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

// 状态数据
const totalAssets = ref(0)
const monthIncome = ref(0)
const monthExpense = ref(0)
const recentTransactions = ref<any[]>([])
const isLoading = ref(false)

/**
 * 格式化金额
 */
const formatMoney = (amount: number) => {
  if (isNaN(amount)) return '0.00'
  return amount.toFixed(2)
}

/**
 * 格式化日期
 */
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

/**
 * 获取首页统计数据
 */
const loadHomeData = async () => {
  if (isLoading.value) return
  isLoading.value = true

  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'statistics',
      data: {
        action: 'overview',
        openid: userStore.openid  // 传递用户 openid
      }
    })

    if (res.result.code === 0) {
      const data = res.result.data
      totalAssets.value = data.totalAssets || 0
      monthIncome.value = data.monthIncome || 0
      monthExpense.value = data.monthExpense || 0
      recentTransactions.value = (data.recentTransactions || []).map((t: any) => {
        // 这里需要关联查询分类名称，暂时使用占位符
        return {
          ...t,
          categoryIcon: t.type === 'income' ? '💰' : '💸',
          categoryName: t.remark || '交易'
        }
      })
    } else {
      console.error('加载首页数据失败：', res.result.message)
    }
  } catch (error) {
    console.error('加载首页数据失败：', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 跳转记账页面
 */
const goRecord = (type: string) => {
  // @ts-ignore
  uni.navigateTo({
    url: `/pages/record/index?type=${type}`
  })
}

/**
 * 跳转交易列表
 */
const goList = () => {
  // @ts-ignore
  uni.navigateTo({
    url: '/pages/list/index'
  })
}

/**
 * 跳转交易详情
 */
const goDetail = (id: string) => {
  // @ts-ignore
  uni.navigateTo({
    url: `/pages/detail/index?id=${id}`
  })
}

/**
 * 页面显示时刷新数据
 */
const onShow = () => {
  loadHomeData()
}

// 生命周期
onMounted(() => {
  loadHomeData()
})

// 暴露 onShow 供 uni-app 调用
defineExpose({
  onShow
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100rpx;
}

/* 总资产卡片 */
.asset-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx 40rpx;
  margin-bottom: 20rpx;
}

.asset-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.asset-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10rpx;
}

.asset-value {
  font-size: 64rpx;
  font-weight: bold;
  color: #ffffff;
}

.asset-detail {
  display: flex;
  justify-content: space-around;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8rpx;
}

.detail-value {
  font-size: 32rpx;
  font-weight: 500;
  color: #ffffff;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 20rpx;
  padding: 0 30rpx 30rpx;
}

.action-btn {
  flex: 1;
  height: 100rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border: none;
  font-size: 28rpx;
}

.expense-btn {
  background: #ff6b6b;
  color: #ffffff;
}

.income-btn {
  background: #51cf66;
  color: #ffffff;
}

.action-icon {
  font-size: 36rpx;
}

.action-text {
  font-size: 28rpx;
  font-weight: 500;
}

/* 近期交易 */
.recent-section {
  background: #ffffff;
  margin: 0 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.section-more {
  font-size: 26rpx;
  color: #999999;
}

.transaction-list {
  padding: 0 30rpx;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.transaction-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
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

.item-date {
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

/* 空状态 */
.empty-state {
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
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 10rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #cccccc;
}
</style>
