<template>
  <view class="account-container">
    <!-- 总资产卡片 -->
    <view class="total-assets-card">
      <text class="assets-label">总资产</text>
      <text class="assets-value">¥{{ formatMoney(totalAssets) }}</text>
    </view>

    <!-- 账户列表 -->
    <view class="account-list" v-if="accounts.length > 0">
      <view
        class="account-item"
        v-for="item in accounts"
        :key="item._id"
      >
        <view class="item-left">
          <text class="account-icon">{{ item.icon || '💳' }}</text>
          <view class="account-info">
            <text class="account-name">{{ item.name }}</text>
            <view class="account-meta">
              <text class="account-type">{{ getTypeName(item.type) }}</text>
              <text class="account-default" v-if="item.is_default">默认</text>
            </view>
          </view>
        </view>
        <view class="item-right">
          <text class="account-balance">¥{{ formatMoney(item.balance) }}</text>
          <view class="item-actions">
            <text class="action-btn" @tap="handleEdit(item)">编辑</text>
            <text class="action-btn delete" @tap="handleDelete(item)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!isLoading">
      <text class="empty-icon">💳</text>
      <text class="empty-text">暂无账户</text>
      <text class="empty-hint">点击右下角按钮添加账户</text>
    </view>

    <!-- 添加按钮 -->
    <view class="fab-add" @tap="handleAdd">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

// 状态
const accounts = ref<any[]>([])
const isLoading = ref(false)

// 账户类型映射
const typeMap: Record<string, string> = {
  cash: '现金',
  bank: '银行卡',
  credit: '信用卡',
  other: '其他'
}

/**
 * 格式化金额
 */
const formatMoney = (val: number) => {
  return val.toFixed(2)
}

/**
 * 获取类型名称
 */
const getTypeName = (type: string) => {
  return typeMap[type] || '其他'
}

/**
 * 计算总资产
 */
const totalAssets = computed(() => {
  return accounts.value.reduce((sum, item) => sum + (item.balance || 0), 0)
})

/**
 * 加载账户列表
 */
const loadAccounts = async () => {
  isLoading.value = true

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
    }
  } catch (error) {
    console.error('加载账户失败：', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 添加账户
 */
const handleAdd = () => {
  // @ts-ignore
  uni.navigateTo({
    url: '/pages/account/edit'
  })
}

/**
 * 编辑账户
 */
const handleEdit = (item: any) => {
  // @ts-ignore
  uni.navigateTo({
    url: `/pages/account/edit?id=${item._id}`
  })
}

/**
 * 删除账户
 */
const handleDelete = (item: any) => {
  // @ts-ignore
  uni.showModal({
    title: '确认删除',
    content: `确定要删除账户"${item.name}"吗？删除后不可恢复`,
    success: async (res: any) => {
      if (res.confirm) {
        try {
          // @ts-ignore
          const deleteRes = await uniCloud.callFunction({
            name: 'account',
            data: {
              action: 'delete',
              data: { _id: item._id },
              openid: userStore.openid
            }
          })

          if (deleteRes.result.code === 0) {
            // @ts-ignore
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
            loadAccounts()
          } else {
            // @ts-ignore
            uni.showToast({
              title: deleteRes.result.message || '删除失败',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('删除账户失败：', error)
          // @ts-ignore
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

/**
 * 页面加载
 */
onMounted(() => {
  loadAccounts()
})

// 页面显示时刷新
onShow(() => {
  loadAccounts()
})
</script>

<style scoped>
.account-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

/* 总资产卡片 */
.total-assets-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
  margin-bottom: 20rpx;
}

.assets-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10rpx;
  display: block;
}

.assets-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #ffffff;
}

/* 账户列表 */
.account-list {
  padding: 0 30rpx;
}

.account-item {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.account-icon {
  font-size: 48rpx;
  width: 90rpx;
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.account-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333333;
}

.account-meta {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.account-type {
  font-size: 24rpx;
  color: #999999;
}

.account-default {
  font-size: 20rpx;
  color: #667eea;
  padding: 2rpx 8rpx;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8rpx;
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 15rpx;
}

.account-balance {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
}

.item-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  font-size: 24rpx;
  color: #667eea;
}

.action-btn.delete {
  color: #ff6b6b;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 150rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #999999;
  margin-bottom: 10rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #cccccc;
}

/* 悬浮按钮 */
.fab-add {
  position: fixed;
  right: 40rpx;
  bottom: 120rpx;
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.4);
  z-index: 100;
}

.fab-icon {
  font-size: 55rpx;
  color: #ffffff;
  font-weight: 300;
}
</style>
