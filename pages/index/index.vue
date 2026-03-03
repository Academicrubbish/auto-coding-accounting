<template>
  <view class="home-container">
    <!-- 使用 z-paging 组件 -->
    <z-paging
      ref="pagingRef"
      v-model="transactions"
      @query="queryList"
      :default-page-size="20"
      :use-page-scroll="false"
      :show-default-empty-view="false"
    >
      <!-- 顶部内容插槽 -->
      <template #top>
        <view>
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

          <!-- 近期交易标题 -->
          <view class="recent-header">
            <text class="section-title">近期交易</text>
            <text class="section-more" @tap="goList">查看全部</text>
          </view>
        </view>
      </template>

      <!-- 自定义空状态/错误状态 -->
      <template #empty>
        <view>
          <!-- 未登录状态 -->
          <view v-if="!isLoggedIn" class="custom-empty-container">
            <text class="empty-icon">🔐</text>
            <text class="empty-title">请先登录</text>
            <text class="empty-desc">登录后即可查看交易记录</text>
            <button class="empty-btn" @tap="goLogin">立即登录</button>
          </view>
          <!-- 加载失败状态 -->
          <view v-else-if="isLoadFailed" class="custom-empty-container">
            <text class="empty-icon">⚠️</text>
            <text class="empty-title">加载失败</text>
            <text class="empty-desc">请稍后重试</text>
            <button class="empty-btn" @tap="reloadData">重新加载</button>
          </view>
          <!-- 空数据状态 -->
          <view v-else class="custom-empty-container">
            <text class="empty-icon">📊</text>
            <text class="empty-title">暂无交易记录</text>
            <text class="empty-desc">点击上方按钮开始记账</text>
            <button class="empty-btn" @tap="goRecord('expense')">记一笔</button>
          </view>
        </view>
      </template>

      <!-- 交易列表 -->
      <view class="transaction-list">
        <view
          class="transaction-item"
          v-for="item in transactions"
          :key="item._id"
          @tap="goDetail(item._id)"
        >
          <view class="item-left">
            <text class="item-icon">{{ getCategoryIcon(item) }}</text>
            <view class="item-info">
              <text class="item-category">{{ getCategoryName(item) }}</text>
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
    </z-paging>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

// z-paging ref
const pagingRef = ref()

// 状态数据
const totalAssets = ref(0)
const monthIncome = ref(0)
const monthExpense = ref(0)
const transactions = ref<any[]>([])
const isLoadingStats = ref(false)
const isLoadFailed = ref(false)

// 是否已登录
const isLoggedIn = computed(() => !!userStore.openid)

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
const formatDate = (dateStr: any) => {
  let date: Date
  if (dateStr && typeof dateStr === 'object' && dateStr.$date) {
    date = new Date(dateStr.$date)
  } else {
    date = new Date(dateStr)
  }
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
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
 * 获取首页统计数据
 */
const loadStatsData = async () => {
  // 检查是否已登录
  if (!userStore.openid) {
    console.log('用户未登录，跳过加载统计数据')
    return
  }

  if (isLoadingStats.value) return
  isLoadingStats.value = true

  try {
    console.log('加载首页统计数据，openid:', userStore.openid)

    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'statistics',
      data: {
        action: 'overview',
        openid: userStore.openid
      }
    })

    console.log('首页统计数据返回:', res.result)

    if (res.result.code === 0) {
      const data = res.result.data
      totalAssets.value = data.totalAssets || 0
      monthIncome.value = data.monthIncome || 0
      monthExpense.value = data.monthExpense || 0
    } else {
      console.error('加载首页统计数据失败：', res.result.message)
    }
  } catch (error) {
    console.error('加载首页统计数据失败：', error)
  } finally {
    isLoadingStats.value = false
  }
}

/**
 * z-paging 分页查询交易列表
 */
const queryList = async (pageNo: number, pageSize: number) => {
  console.log('===== 首页 queryList 开始 =====')
  console.log('pageNo:', pageNo, 'pageSize:', pageSize)
  console.log('openid:', userStore.openid)
  console.log('是否已登录:', isLoggedIn.value)

  // 如果未登录，完成加载（显示未登录状态）
  if (!isLoggedIn.value) {
    pagingRef.value?.complete([])
    return
  }

  // 如果是第一页，同时加载统计数据
  if (pageNo === 1) {
    loadStatsData()
  }

  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'transaction',
      data: {
        action: 'list',
        openid: userStore.openid,
        data: {
          page: pageNo,
          pageSize: pageSize
        }
      }
    })

    console.log('云函数返回完整结果:', res.result)

    if (res.result.code === 0) {
      const result = res.result.data
      console.log('result.list:', result.list)
      // 将结果传给 z-paging
      pagingRef.value?.complete(result.list || [])
      isLoadFailed.value = false
    } else {
      console.error('云函数返回错误:', res.result.message)
      pagingRef.value?.complete(false)
      isLoadFailed.value = true
    }
  } catch (error) {
    console.error('加载交易列表失败：', error)
    pagingRef.value?.complete(false)
    isLoadFailed.value = true
  }
}

/**
 * 重新加载数据
 */
const reloadData = () => {
  isLoadFailed.value = false
  pagingRef.value?.reload()
}

/**
 * 跳转登录页面
 */
const goLogin = () => {
  // @ts-ignore
  uni.navigateTo({
    url: '/pages/login/index'
  })
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

// 监听登录状态变化
watch(() => userStore.openid, (newOpenid) => {
  if (newOpenid) {
    console.log('检测到 openid 变化，重新加载数据')
    pagingRef.value?.reload()
  }
})

// 生命周期
onMounted(() => {
  // 延迟加载，确保登录状态已恢复
  setTimeout(() => {
    if (userStore.openid) {
      loadStatsData()
    }
  }, 500)
})

// 页面显示时刷新数据
onShow(() => {
  console.log('首页 onShow 触发')
  // 刷新统计数据和交易列表
  if (userStore.openid) {
    loadStatsData()
    pagingRef.value?.reload()
  }
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
  padding: 30rpx;
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

/* 近期交易标题 */
.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
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

/* 交易列表 */
.transaction-list {
  background: #ffffff;
  margin: 0 30rpx 30rpx;
  border-radius: 0 0 20rpx 20rpx;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
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

/* 自定义空状态容器 */
.custom-empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 60rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.empty-title {
  font-size: 32rpx;
  color: #333333;
  margin-bottom: 15rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 50rpx;
}

.empty-btn {
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 50rpx;
  font-size: 28rpx;
  border: none;
}
</style>
