<template>
  <view class="category-container">
    <!-- 类型切换 -->
    <view class="type-switch">
      <view
        class="type-item"
        :class="{ active: currentType === 'expense' }"
        @tap="switchType('expense')"
      >
        <text class="type-text">支出</text>
      </view>
      <view
        class="type-item"
        :class="{ active: currentType === 'income' }"
        @tap="switchType('income')"
      >
        <text class="type-text">收入</text>
      </view>
    </view>

    <!-- 分类列表 -->
    <view class="category-list" v-if="categories.length > 0">
      <view
        class="category-item"
        v-for="item in categories"
        :key="item._id"
        @tap="handleEdit(item)"
      >
        <view class="item-left">
          <text class="category-icon" :style="{ background: item.color || '#667eea' }">
            {{ item.icon || '📁' }}
          </text>
          <view class="category-info">
            <text class="category-name">{{ item.name }}</text>
            <text class="category-count">{{ item.transactionCount || 0 }} 笔</text>
          </view>
        </view>
        <view class="item-right" v-if="item.create_by !== ''">
          <text class="item-badge">系统</text>
        </view>
        <text class="item-arrow">›</text>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!isLoading">
      <text class="empty-icon">📁</text>
      <text class="empty-text">暂无{{ currentType === 'expense' ? '支出' : '收入' }}分类</text>
      <text class="empty-hint">点击右下角按钮添加分类</text>
    </view>

    <!-- 添加按钮 -->
    <view class="fab-add" @tap="handleAdd">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 状态
const currentType = ref<'expense' | 'income'>('expense')
const categories = ref<any[]>([])
const isLoading = ref(false)

/**
 * 切换类型
 */
const switchType = (type: 'expense' | 'income') => {
  currentType.value = type
  loadCategories()
}

/**
 * 加载分类列表
 */
const loadCategories = async () => {
  isLoading.value = true

  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'category',
      data: {
        action: 'list',
        data: { type: currentType.value }
      }
    })

    if (res.result.code === 0) {
      categories.value = res.result.data || []
    }
  } catch (error) {
    console.error('加载分类失败：', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 添加分类
 */
const handleAdd = () => {
  // @ts-ignore
  uni.navigateTo({
    url: `/pages/category/edit?type=${currentType.value}`
  })
}

/**
 * 编辑分类
 */
const handleEdit = (item: any) => {
  // 系统默认分类不能编辑
  if (item.create_by === '') {
    // @ts-ignore
    uni.showToast({
      title: '系统默认分类不能编辑',
      icon: 'none'
    })
    return
  }

  // @ts-ignore
  uni.navigateTo({
    url: `/pages/category/edit?id=${item._id}&type=${currentType.value}`
  })
}

/**
 * 页面加载
 */
onMounted(() => {
  loadCategories()
})

/**
 * 页面显示时刷新
 */
// @ts-ignore
const onShow = () => {
  loadCategories()
}

defineExpose({
  onShow
})
</script>

<style scoped>
.category-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

/* 类型切换 */
.type-switch {
  display: flex;
  background: #ffffff;
  padding: 20rpx 30rpx;
  gap: 20rpx;
  margin-bottom: 20rpx;
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

.type-text {
  font-size: 28rpx;
  color: #999999;
}

.type-item.active .type-text {
  color: #ffffff;
}

/* 分类列表 */
.category-list {
  padding: 0 30rpx;
}

.category-item {
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
  flex: 1;
}

.category-icon {
  font-size: 40rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #667eea;
  border-radius: 50%;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.category-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333333;
}

.category-count {
  font-size: 24rpx;
  color: #999999;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.item-badge {
  font-size: 20rpx;
  color: #667eea;
  padding: 4rpx 12rpx;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8rpx;
}

.item-arrow {
  font-size: 40rpx;
  color: #cccccc;
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
