<template>
  <view class="mine-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-avatar">
        <text class="avatar-text">{{ userAvatar }}</text>
      </view>
      <view class="user-info">
        <text class="user-name">{{ userName }}</text>
        <text class="user-status" v-if="isGuest">游客模式</text>
        <text class="user-status" v-else>已登录</text>
      </view>
      <view class="login-btn" v-if="isGuest" @tap="goLogin">
        <text class="login-text">去登录</text>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card" v-if="!isGuest">
      <view class="stats-item">
        <text class="stats-value">{{ transactionCount }}</text>
        <text class="stats-label">交易笔数</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item">
        <text class="stats-value">{{ accountCount }}</text>
        <text class="stats-label">账户数量</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item">
        <text class="stats-value">{{ categoryCount }}</text>
        <text class="stats-label">分类数量</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="function-section">
      <view class="section-title">我的账户</view>
      <view class="function-list">
        <view class="function-item" @tap="goAccountManage">
          <view class="item-left">
            <text class="item-icon">💳</text>
            <text class="item-name">账户管理</text>
          </view>
          <view class="item-right">
            <text class="item-value">{{ totalAssets }}</text>
            <text class="item-arrow">›</text>
          </view>
        </view>

        <view class="function-item" @tap="goCategoryManage">
          <view class="item-left">
            <text class="item-icon">📁</text>
            <text class="item-name">分类管理</text>
          </view>
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 设置列表 -->
    <view class="function-section">
      <view class="section-title">设置</view>
      <view class="function-list">
        <view class="function-item" @tap="clearCache">
          <view class="item-left">
            <text class="item-icon">🧹</text>
            <text class="item-name">清除缓存</text>
          </view>
          <text class="item-arrow">›</text>
        </view>

        <view class="function-item" @tap="showAbout">
          <view class="item-left">
            <text class="item-icon">ℹ️</text>
            <text class="item-name">关于</text>
          </view>
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section" v-if="!isGuest">
      <button class="logout-btn" @tap="handleLogout">
        <text class="logout-text">退出登录</text>
      </button>
    </view>

    <!-- 关于弹窗 -->
    <view class="about-mask" v-if="showAboutPopup" @tap="showAboutPopup = false">
      <view class="about-popup" @tap.stop>
        <view class="about-header">
          <text class="about-title">关于记账助手</text>
          <text class="about-close" @tap="showAboutPopup = false">✕</text>
        </view>
        <view class="about-body">
          <text class="app-icon">💰</text>
          <text class="app-name">记账助手</text>
          <text class="app-version">版本 1.0.0</text>
          <view class="app-info">
            <text class="info-text">一款简洁易用的个人记账应用</text>
            <text class="info-text">基于 uni-app + uniCloud 开发</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

// 状态
const userName = ref('记账用户')
const transactionCount = ref(0)
const accountCount = ref(0)
const categoryCount = ref(0)
const totalAssets = ref('¥0.00')
const showAboutPopup = ref(false)

// 计算属性
const isGuest = computed(() => userStore.isGuest)
const userAvatar = computed(() => {
  const name = userName.value || '记'
  return name.substring(0, 1).toUpperCase()
})

/**
 * 格式化金额
 */
const formatMoney = (val: number) => {
  return '¥' + val.toFixed(2)
}

/**
 * 加载用户统计数据
 */
const loadUserStats = async () => {
  if (isGuest.value) return

  try {
    // 获取总资产
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'statistics',
      data: {
        action: 'overview',
        openid: userStore.openid
      }
    })

    if (res.result.code === 0) {
      const data = res.result.data
      totalAssets.value = formatMoney(data.totalAssets || 0)
      transactionCount.value = data.recentTransactions?.length || 0
    }

    // 获取账户数量
    // @ts-ignore
    const accRes = await uniCloud.callFunction({
      name: 'account',
      data: { action: 'list', openid: userStore.openid }
    })
    if (accRes.result.code === 0) {
      accountCount.value = accRes.result.data?.length || 0
    }

    // 获取分类数量
    // @ts-ignore
    const catRes = await uniCloud.callFunction({
      name: 'category',
      data: { action: 'list', data: {}, openid: userStore.openid }
    })
    if (catRes.result.code === 0) {
      categoryCount.value = catRes.result.data?.length || 0
    }
  } catch (error) {
    console.error('加载用户统计失败：', error)
  }
}

/**
 * 跳转登录
 */
const goLogin = () => {
  // @ts-ignore
  uni.navigateTo({
    url: '/pages/login/index'
  })
}

/**
 * 跳转账户管理
 */
const goAccountManage = () => {
  if (isGuest.value) {
    // @ts-ignore
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }
  // @ts-ignore
  uni.navigateTo({
    url: '/pages/account/index'
  })
}

/**
 * 跳转分类管理
 */
const goCategoryManage = () => {
  if (isGuest.value) {
    // @ts-ignore
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }
  // @ts-ignore
  uni.navigateTo({
    url: '/pages/category/index'
  })
}

/**
 * 清除缓存
 */
const clearCache = () => {
  // @ts-ignore
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: (res: any) => {
      if (res.confirm) {
        try {
          // @ts-ignore
          uni.clearStorageSync()
          // @ts-ignore
          uni.showToast({
            title: '缓存已清除',
            icon: 'success'
          })
        } catch (error) {
          // @ts-ignore
          uni.showToast({
            title: '清除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

/**
 * 显示关于
 */
const showAbout = () => {
  showAboutPopup.value = true
}

/**
 * 退出登录
 */
const handleLogout = () => {
  // @ts-ignore
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？退出后可以继续使用游客模式浏览',
    success: (res: any) => {
      if (res.confirm) {
        // 清除登录状态
        const { clearAuthCache } = require('@/utils/auth-cache')
        clearAuthCache()

        // @ts-ignore
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        })

        // 重载页面
        setTimeout(() => {
          // @ts-ignore
          uni.reLaunch({
            url: '/pages/index/index'
          })
        }, 500)
      }
    }
  })
}

/**
 * 页面加载
 */
onMounted(() => {
  // 更新用户名
  if (userStore.userData?.nickname) {
    userName.value = userStore.userData.nickname
  }

  loadUserStats()
})

/**
 * 页面显示时刷新
 */
// @ts-ignore
const onShow = () => {
  loadUserStats()
}

defineExpose({
  onShow
})
</script>

<style scoped>
.mine-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
  margin-bottom: 20rpx;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.avatar-text {
  font-size: 50rpx;
  font-weight: bold;
  color: #ffffff;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.user-status {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  padding: 4rpx 16rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  width: fit-content;
}

.login-btn {
  padding: 16rpx 32rpx;
  background: #ffffff;
  border-radius: 30rpx;
}

.login-text {
  font-size: 26rpx;
  color: #667eea;
  font-weight: 500;
}

/* 统计卡片 */
.stats-card {
  background: #ffffff;
  margin: 0 30rpx 20rpx;
  border-radius: 20rpx;
  display: flex;
  padding: 40rpx 0;
}

.stats-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.stats-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
}

.stats-label {
  font-size: 24rpx;
  color: #999999;
}

.stats-divider {
  width: 1rpx;
  background: #f0f0f0;
}

/* 功能区域 */
.function-section {
  background: #ffffff;
  margin: 0 30rpx 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.section-title {
  padding: 30rpx 30rpx 20rpx;
  font-size: 28rpx;
  color: #999999;
}

.function-list {
  padding: 0 30rpx;
}

.function-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.function-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.item-icon {
  font-size: 40rpx;
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
}

.item-name {
  font-size: 30rpx;
  color: #333333;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.item-value {
  font-size: 26rpx;
  color: #999999;
}

.item-arrow {
  font-size: 40rpx;
  color: #cccccc;
}

/* 退出登录 */
.logout-section {
  padding: 0 30rpx;
}

.logout-btn {
  width: 100%;
  height: 80rpx;
  background: #ffffff;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.logout-text {
  font-size: 30rpx;
  color: #ff6b6b;
}

/* 关于弹窗 */
.about-mask {
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

.about-popup {
  width: 500rpx;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.about-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.about-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.about-close {
  font-size: 40rpx;
  color: #999999;
}

.about-body {
  padding: 60rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
}

.app-icon {
  font-size: 100rpx;
}

.app-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.app-version {
  font-size: 24rpx;
  color: #999999;
}

.app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  margin-top: 20rpx;
}

.info-text {
  font-size: 24rpx;
  color: #999999;
}
</style>
