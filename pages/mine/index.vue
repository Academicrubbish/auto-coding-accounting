<template>
  <view class="mine-container">
    <!-- 登录引导区 - 未登录时显示 -->
    <view class="auth-guide" v-if="isGuest">
      <view class="guide-icon">🔐</view>
      <text class="guide-title">登录后同步数据</text>
      <text class="guide-desc">登录可保护您的记账数据，多设备同步</text>
      <view class="guide-btn" @tap="goLogin">
        <text class="guide-btn-text">立即登录</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="function-section">
      <view class="function-list">
        <view class="function-item" @tap="goAccountManage">
          <view class="item-left">
            <text class="item-icon">💳</text>
            <text class="item-name">账户管理</text>
          </view>
          <view class="item-right">
            <text class="item-value" v-if="!isGuest">{{ totalAssets }}</text>
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

        <view class="function-item" @tap="goStats">
          <view class="item-left">
            <text class="item-icon">📊</text>
            <text class="item-name">统计分析</text>
          </view>
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 设置列表 -->
    <view class="function-section">
      <view class="function-list">
        <view class="function-item" @tap="goSettings">
          <view class="item-left">
            <text class="item-icon">⚙️</text>
            <text class="item-name">设置</text>
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

    <!-- 底部状态信息 -->
    <view class="footer-status">
      <view class="status-info">
        <text class="status-text" v-if="isGuest">未登录</text>
        <template v-else>
          <text class="status-dot">●</text>
          <text class="status-text">已登录</text>
        </template>
      </view>
      <view class="version-info">记账助手 v1.0.0</view>
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
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

// 状态
const totalAssets = ref('¥0.00')
const showAboutPopup = ref(false)

// 计算属性
const isGuest = computed(() => userStore.isGuest)

/**
 * 格式化金额
 */
const formatMoney = (val: number) => {
  return '¥' + val.toFixed(2)
}

/**
 * 加载用户总资产
 */
const loadUserStats = async () => {
  if (!userStore.openid) {
    return
  }

  try {
    // 获取总资产
    // @ts-ignore
    const statsRes = await uniCloud.callFunction({
      name: 'statistics',
      data: {
        action: 'overview',
        openid: userStore.openid
      }
    })
    if (statsRes.result.code === 0) {
      const assets = statsRes.result.data.totalAssets || 0
      totalAssets.value = formatMoney(assets)
    }
  } catch (error) {
    console.error('加载总资产失败：', error)
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
 * 跳转统计分析
 */
const goStats = () => {
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
    url: '/pages/stats/index'
  })
}

/**
 * 跳转设置页面
 */
const goSettings = () => {
  // @ts-ignore
  uni.navigateTo({
    url: '/pages/settings/index'
  })
}

/**
 * 显示关于
 */
const showAbout = () => {
  showAboutPopup.value = true
}

/**
 * 页面加载
 */
onMounted(() => {
  setTimeout(() => {
    loadUserStats()
  }, 500)
})

// 页面显示时刷新
onShow(() => {
  loadUserStats()
})
</script>

<style scoped>
.mine-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx 20rpx 60rpx
}

/* 登录引导区 */
.auth-guide {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  margin: 30rpx;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  text-align: center;
}

.guide-icon {
  font-size: 80rpx;
  opacity: 0.8;
}

.guide-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333333;
}

.guide-desc {
  font-size: 26rpx;
  color: #888888;
  line-height: 1.6;
}

.guide-btn {
  margin-top: 10rpx;
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 40rpx;
}

.guide-btn-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}

/* 功能区域 */
.function-section {
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.function-list {
  padding: 0 10rpx;
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
  gap: 8rpx;
  margin-right: -5rpx;
}

.item-value {
  font-size: 26rpx;
  color: #999999;
}

.item-arrow {
  font-size: 40rpx;
  color: #cccccc;
  flex-shrink: 0;
}

/* 底部状态信息 */
.footer-status {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.status-dot {
  font-size: 20rpx;
  color: #52c41a;
}

.status-text {
  font-size: 24rpx;
  color: #999999;
}

.version-info {
  font-size: 24rpx;
  color: #bbbbbb;
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
