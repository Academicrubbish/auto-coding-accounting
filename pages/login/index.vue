<template>
  <view class="login-container">
    <view class="login-content">
      <!-- Logo 区域 -->
      <view class="logo-section">
        <text class="logo-icon">💰</text>
        <text class="logo-title">记账助手</text>
        <text class="logo-subtitle">轻松记录每一笔收支</text>
      </view>

      <!-- 授权说明 -->
      <view class="auth-info">
        <text class="info-text">登录后可保存您的记账数据</text>
        <text class="info-desc">我们不会收集您的隐私信息</text>
      </view>

      <!-- 登录按钮 -->
      <button
        class="login-btn"
        @tap="handleLogin"
        :disabled="isLoading"
      >
        <text v-if="isLoading" class="loading-text">登录中...</text>
        <text v-else class="btn-text">微信授权登录</text>
      </button>

      <!-- 游客模式提示 -->
      <view class="guest-tip">
        <text class="tip-text">您可以先以游客模式浏览</text>
        <text class="tip-text">点击下方按钮跳转首页</text>
      </view>

      <!-- 跳转首页按钮 -->
      <button class="guest-btn" @tap="goHome">
        <text class="btn-text">游客模式</text>
      </button>

      <!-- 用户协议 -->
      <view class="agreement">
        <text class="agreement-text">登录即表示同意</text>
        <text class="agreement-link">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../../store/user'
import { setAuthCache } from '../../utils/auth-cache'

const userStore = useUserStore()
const isLoading = ref(false)

/**
 * 微信授权登录
 */
const handleLogin = async () => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    // 获取微信登录 code
    // @ts-ignore
    const loginRes = await uni.login({
      provider: 'weixin'
    })

    if (!loginRes.code) {
      // @ts-ignore
      uni.showToast({
        title: '获取登录信息失败',
        icon: 'none'
      })
      isLoading.value = false
      return
    }

    const code = loginRes.code

    // 调用登录云函数
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'login',
      data: { code }
    })

    if (res.result.code === 0) {
      const { openid, userData, isNewUser } = res.result.data

      // 保存到 store
      userStore.setOpenid(openid)
      userStore.setUserData(userData)
      userStore.setIsGuest(false)

      // 保存到本地缓存
      setAuthCache(openid, userData)

      // @ts-ignore
      uni.showToast({
        title: isNewUser ? '注册成功' : '登录成功',
        icon: 'success'
      })

      // 跳转到首页
      setTimeout(() => {
        // @ts-ignore
        uni.switchTab({
          url: '/pages/index/index'
        })
      }, 500)
    } else {
      // @ts-ignore
      uni.showToast({
        title: res.result.message || '登录失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('登录失败：', error)
    // @ts-ignore
    uni.showToast({
      title: '登录失败，请重试',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

/**
 * 游客模式 - 跳转首页
 */
const goHome = () => {
  // @ts-ignore
  uni.switchTab({
    url: '/pages/index/index'
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.login-content {
  width: 100%;
  max-width: 600rpx;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.logo-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10rpx;
}

.logo-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.auth-info {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-text {
  font-size: 28rpx;
  color: #ffffff;
  margin-bottom: 10rpx;
}

.info-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.login-btn {
  width: 100%;
  height: 88rpx;
  background: #ffffff;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  margin-bottom: 30rpx;
}

.login-btn[disabled] {
  opacity: 0.6;
}

.btn-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
}

.loading-text {
  font-size: 28rpx;
  color: #999999;
}

.guest-tip {
  text-align: center;
  margin-bottom: 20rpx;
}

.tip-text {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5rpx;
}

.guest-btn {
  width: 100%;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  margin-bottom: 60rpx;
}

.guest-btn::after {
  border: none;
}

.agreement {
  text-align: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5rpx;
}

.agreement-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
}

.agreement-link {
  font-size: 22rpx;
  color: #ffd700;
  text-decoration: underline;
}
</style>
