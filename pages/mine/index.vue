<template>
  <view class="mine-container">
    <!-- 登录引导区 - 未登录时显示 -->
    <view class="auth-guide" v-if="isGuest">
      <view class="guide-card">
        <view class="guide-icon-wrapper">
          <text class="guide-icon">🔐</text>
        </view>
        <text class="guide-title">登录后同步数据</text>
        <text class="guide-desc">登录可保护您的记账数据，多设备同步</text>
        <view class="guide-btn" @tap="goLogin">
          <text class="guide-btn-text">立即登录</text>
        </view>
      </view>
    </view>

    <!-- 功能区域 -->
    <view class="section-title">我的功能</view>
    <view class="function-section">
      <view class="function-list">
        <view class="function-item" @tap="goAccountManage">
          <view class="item-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <text class="item-icon">💳</text>
          </view>
          <view class="item-info">
            <text class="item-name">账户管理</text>
            <text class="item-desc" v-if="!isGuest">管理您的收支账户</text>
          </view>
          <text class="item-arrow">›</text>
        </view>

        <view class="function-item" @tap="goCategoryManage">
          <view class="item-icon-wrapper" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <text class="item-icon">📁</text>
          </view>
          <view class="item-info">
            <text class="item-name">分类管理</text>
            <text class="item-desc">自定义收支分类</text>
          </view>
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 更多设置 -->
    <view class="section-title">更多</view>
    <view class="function-section">
      <view class="function-list">
        <view class="function-item" @tap="goSettings">
          <view class="item-icon-wrapper" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
            <text class="item-icon">⚙️</text>
          </view>
          <view class="item-info">
            <text class="item-name">设置</text>
            <text class="item-desc">应用设置与数据管理</text>
          </view>
          <text class="item-arrow">›</text>
        </view>

        <view class="function-item" @tap="showAbout">
          <view class="item-icon-wrapper" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
            <text class="item-icon">ℹ️</text>
          </view>
          <view class="item-info">
            <text class="item-name">关于</text>
            <text class="item-desc">版本信息</text>
          </view>
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 底部状态信息 -->
    <view class="footer-status">
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
          <view class="app-icon-wrapper">
            <text class="app-icon">💰</text>
          </view>
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
const showAboutPopup = ref(false)

// 计算属性
const isGuest = computed(() => userStore.isGuest)

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
  // 页面加载
})

// 页面显示时刷新
onShow(() => {
  // 页面显示
})
</script>

<style scoped>
.mine-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 20rpx;
}

/* 登录引导区 */
.auth-guide {
  padding: 30rpx 0;
}

.guide-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0 10rpx;
  border-radius: 24rpx;
  padding: 50rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
}

.guide-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guide-icon {
  font-size: 60rpx;
}

.guide-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #ffffff;
}

.guide-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.guide-btn {
  margin-top: 10rpx;
  padding: 18rpx 50rpx;
  background: #ffffff;
  border-radius: 40rpx;
}

.guide-btn-text {
  font-size: 28rpx;
  color: #667eea;
  font-weight: 600;
}

/* 分组标题 */
.section-title {
  padding: 30rpx 20rpx 16rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #999999;
}

/* 功能区域 */
.function-section {
  background: #ffffff;
  margin: 0 10rpx 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.function-list {
  padding: 0 10rpx;
}

.function-item {
  display: flex;
  align-items: center;
  padding: 28rpx 10rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.function-item:last-child {
  border-bottom: none;
}

.item-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon {
  font-size: 40rpx;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin-left: 20rpx;
}

.item-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333333;
}

.item-desc {
  font-size: 24rpx;
  color: #999999;
}

.item-arrow {
  font-size: 36rpx;
  color: #cccccc;
  margin-right: 10rpx;
}

/* 底部状态信息 */
.footer-status {
  padding: 40rpx 0 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.version-info {
  font-size: 24rpx;
  color: #cccccc;
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
  width: 520rpx;
  background: #ffffff;
  border-radius: 24rpx;
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
  font-weight: 600;
  color: #333333;
}

.about-close {
  font-size: 40rpx;
  color: #999999;
}

.about-body {
  padding: 50rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.app-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-icon {
  font-size: 60rpx;
}

.app-name {
  font-size: 32rpx;
  font-weight: 600;
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
  gap: 6rpx;
  margin-top: 20rpx;
}

.info-text {
  font-size: 24rpx;
  color: #999999;
}
</style>
