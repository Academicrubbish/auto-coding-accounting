<template>
  <view class="edit-container">
    <view class="form-section">
      <!-- 分类名称 -->
      <view class="form-item">
        <text class="form-label">分类名称</text>
        <input
          class="form-input"
          v-model="formData.name"
          placeholder="如：餐饮、交通、工资"
          maxlength="10"
        />
      </view>

      <!-- 图标选择 -->
      <view class="form-item">
        <text class="form-label">图标</text>
        <view class="icon-selector">
          <view
            class="icon-option"
            :class="{ active: formData.icon === item }"
            v-for="item in iconList"
            :key="item"
            @tap="formData.icon = item"
          >
            <text class="icon-emoji">{{ item }}</text>
          </view>
        </view>
      </view>

      <!-- 颜色选择 -->
      <view class="form-item">
        <text class="form-label">颜色</text>
        <view class="color-selector">
          <view
            class="color-option"
            :class="{ active: formData.color === item }"
            v-for="item in colorList"
            :key="item"
            :style="{ background: item }"
            @tap="formData.color = item"
          >
            <text class="color-check" v-if="formData.color === item">✓</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button
        class="submit-btn"
        @tap="handleSubmit"
        :disabled="isSubmitting"
      >
        <text v-if="isSubmitting">提交中...</text>
        <text v-else>{{ isEdit ? '保存' : '添加' }}</text>
      </button>
    </view>

    <!-- 删除按钮（编辑模式且非系统分类） -->
    <view class="delete-section" v-if="isEdit && !isSystem">
      <button class="delete-btn" @tap="handleDelete">
        <text class="delete-text">删除分类</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 状态
const categoryId = ref('')
const categoryType = ref<'expense' | 'income'>('expense')
const isEdit = computed(() => !!categoryId.value)
const isSystem = ref(false)
const isSubmitting = ref(false)

// 表单数据
const formData = ref({
  name: '',
  icon: '📁',
  color: '#667eea'
})

// 图标列表（根据类型区分）
const expenseIcons = ['🍜', '🛒', '🚕', '🏠', '💊', '📚', '🎮', '✈️', '🎬', '💇', '🏃', '🎁', '💸', '📱', '⚡', '🔧', '🏥']
const incomeIcons = ['💰', '💵', '💳', '📈', '💎', '🏦', '💼', '🏠', '🚗', '💻', '📱', '🎁']

const iconList = computed(() => {
  return categoryType.value === 'expense' ? expenseIcons : incomeIcons
})

// 颜色列表
const colorList = [
  '#667eea', '#51cf66', '#ff6b6b', '#ffd93d', '#6bcf7f',
  '#4ecdc4', '#ff9f43', '#54a0ff', '#5f27cd', '#00b894',
  '#fdcb6e', '#e17055', '#74b9ff', '#a29bfe', '#fab1a0'
]

/**
 * 加载分类详情
 */
const loadCategory = async () => {
  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'category',
      data: {
        action: 'list',
        data: {}
      }
    })

    if (res.result.code === 0) {
      const category = res.result.data.find((c: any) => c._id === categoryId.value)
      if (category) {
        formData.value = {
          name: category.name || '',
          icon: category.icon || '📁',
          color: category.color || '#667eea'
        }
        isSystem.value = category.create_by === ''
      }
    }
  } catch (error) {
    console.error('加载分类失败：', error)
  }
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (isSubmitting.value) return

  // 验证
  if (!formData.value.name.trim()) {
    // @ts-ignore
    uni.showToast({
      title: '请输入分类名称',
      icon: 'none'
    })
    return
  }

  isSubmitting.value = true

  try {
    const action = isEdit.value ? 'update' : 'create'
    const data = {
      ...formData.value,
      type: categoryType.value
    }

    if (isEdit.value) {
      data._id = categoryId.value
    }

    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'category',
      data: { action, data }
    })

    if (res.result.code === 0) {
      // @ts-ignore
      uni.showToast({
        title: isEdit.value ? '保存成功' : '添加成功',
        icon: 'success'
      })

      setTimeout(() => {
        // @ts-ignore
        uni.navigateBack()
      }, 500)
    } else {
      // @ts-ignore
      uni.showToast({
        title: res.result.message || '操作失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('提交失败：', error)
    // @ts-ignore
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'none'
    })
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 删除分类
 */
const handleDelete = () => {
  // @ts-ignore
  uni.showModal({
    title: '确认删除',
    content: `确定要删除分类"${formData.value.name}"吗？`,
    success: async (res: any) => {
      if (res.confirm) {
        try {
          // @ts-ignore
          const deleteRes = await uniCloud.callFunction({
            name: 'category',
            data: {
              action: 'delete',
              data: { _id: categoryId.value }
            }
          })

          if (deleteRes.result.code === 0) {
            // @ts-ignore
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })

            setTimeout(() => {
              // @ts-ignore
              uni.navigateBack()
            }, 500)
          } else {
            // @ts-ignore
            uni.showToast({
              title: deleteRes.result.message || '删除失败',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('删除失败：', error)
        }
      }
    }
  })
}

/**
 * 页面加载
 */
onMounted(() => {
  // @ts-ignore
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  if (options.type) {
    categoryType.value = options.type
  }

  if (options.id) {
    categoryId.value = options.id
    loadCategory()
  }
})
</script>

<style scoped>
.edit-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

/* 表单 */
.form-section {
  background: #ffffff;
  margin: 20rpx 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.form-item {
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 20rpx;
  display: block;
}

.form-input {
  width: 100%;
  font-size: 30rpx;
  color: #333333;
}

/* 图标选择器 */
.icon-selector {
  display: flex;
  gap: 15rpx;
  flex-wrap: wrap;
}

.icon-option {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15rpx;
  background: #f5f5f5;
}

.icon-option.active {
  background: rgba(102, 126, 234, 0.1);
  border: 2rpx solid #667eea;
}

.icon-emoji {
  font-size: 36rpx;
}

/* 颜色选择器 */
.color-selector {
  display: flex;
  gap: 15rpx;
  flex-wrap: wrap;
}

.color-option {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid transparent;
}

.color-option.active {
  border-color: #333333;
}

.color-check {
  font-size: 24rpx;
  color: #ffffff;
}

/* 提交按钮 */
.submit-section {
  padding: 30rpx;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
  border: none;
}

/* 删除按钮 */
.delete-section {
  padding: 0 30rpx;
}

.delete-btn {
  width: 100%;
  height: 80rpx;
  background: #ffffff;
  border-radius: 20rpx;
  border: 1rpx solid #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-text {
  font-size: 28rpx;
  color: #ff6b6b;
}
</style>
