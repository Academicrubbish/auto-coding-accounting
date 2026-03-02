<template>
  <view class="edit-container">
    <view class="form-section">
      <!-- 账户名称 -->
      <view class="form-item">
        <text class="form-label">账户名称</text>
        <input
          class="form-input"
          v-model="formData.name"
          placeholder="如：招商银行、现金钱包"
          maxlength="20"
        />
      </view>

      <!-- 账户类型 -->
      <view class="form-item">
        <text class="form-label">账户类型</text>
        <view class="type-selector">
          <view
            class="type-option"
            :class="{ active: formData.type === 'cash' }"
            @tap="formData.type = 'cash'"
          >
            <text class="type-icon">💵</text>
            <text class="type-text">现金</text>
          </view>
          <view
            class="type-option"
            :class="{ active: formData.type === 'bank' }"
            @tap="formData.type = 'bank'"
          >
            <text class="type-icon">💳</text>
            <text class="type-text">银行卡</text>
          </view>
          <view
            class="type-option"
            :class="{ active: formData.type === 'credit' }"
            @tap="formData.type = 'credit'"
          >
            <text class="type-icon">💳</text>
            <text class="type-text">信用卡</text>
          </view>
          <view
            class="type-option"
            :class="{ active: formData.type === 'other' }"
            @tap="formData.type = 'other'"
          >
            <text class="type-icon">📦</text>
            <text class="type-text">其他</text>
          </view>
        </view>
      </view>

      <!-- 初始余额 -->
      <view class="form-item">
        <text class="form-label">{{ isEdit ? '当前余额' : '初始余额' }}</text>
        <view class="amount-input-wrapper">
          <text class="amount-symbol">¥</text>
          <input
            class="amount-input"
            type="digit"
            v-model="formData.balance"
            placeholder="0.00"
          />
        </view>
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

      <!-- 设为默认账户 -->
      <view class="form-item switch-item">
        <text class="form-label">设为默认账户</text>
        <switch
          :checked="formData.is_default"
          @change="formData.is_default = $event.detail.value"
          color="#667eea"
        />
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

    <!-- 删除按钮（编辑模式） -->
    <view class="delete-section" v-if="isEdit">
      <button class="delete-btn" @tap="handleDelete">
        <text class="delete-text">删除账户</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

// 状态
const accountId = ref('')
const isEdit = computed(() => !!accountId.value)
const isSubmitting = ref(false)

// 表单数据
const formData = ref({
  name: '',
  type: 'bank',
  balance: '0',
  icon: '💳',
  is_default: false
})

// 图标列表
const iconList = ['💳', '💵', '💰', '💎', '🏦', '📱', '💻', '🏠', '🚗', '✈️', '🛒']

/**
 * 格式化金额
 */
const formatMoney = (val: string) => {
  const num = parseFloat(val)
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

/**
 * 加载账户详情
 */
const loadAccount = async () => {
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
      const account = res.result.data.find((a: any) => a._id === accountId.value)
      if (account) {
        formData.value = {
          name: account.name || '',
          type: account.type || 'bank',
          balance: String(account.balance || 0),
          icon: account.icon || '💳',
          is_default: account.is_default || false
        }
      }
    }
  } catch (error) {
    console.error('加载账户失败：', error)
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
      title: '请输入账户名称',
      icon: 'none'
    })
    return
  }

  const balance = parseFloat(formData.value.balance)
  if (isNaN(balance) || balance < 0) {
    // @ts-ignore
    uni.showToast({
      title: '请输入有效余额',
      icon: 'none'
    })
    return
  }

  isSubmitting.value = true

  try {
    const action = isEdit.value ? 'update' : 'create'
    const data = {
      ...formData.value,
      balance: balance
    }

    if (isEdit.value) {
      data._id = accountId.value
    }

    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'account',
      data: { action, data, openid: userStore.openid }
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
 * 删除账户
 */
const handleDelete = () => {
  // @ts-ignore
  uni.showModal({
    title: '确认删除',
    content: `确定要删除账户"${formData.value.name}"吗？`,
    success: async (res: any) => {
      if (res.confirm) {
        try {
          // @ts-ignore
          const deleteRes = await uniCloud.callFunction({
            name: 'account',
            data: {
              action: 'delete',
              data: { _id: accountId.value },
              openid: userStore.openid
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

  if (options.id) {
    accountId.value = options.id
    loadAccount()
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

/* 类型选择器 */
.type-selector {
  display: flex;
  gap: 15rpx;
  flex-wrap: wrap;
}

.type-option {
  flex: 0 0 calc(50% - 7.5rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 20rpx;
  border-radius: 15rpx;
  background: #f5f5f5;
}

.type-option.active {
  background: rgba(102, 126, 234, 0.1);
  border: 2rpx solid #667eea;
}

.type-icon {
  font-size: 40rpx;
}

.type-text {
  font-size: 24rpx;
  color: #666666;
}

.type-option.active .type-text {
  color: #667eea;
}

/* 金额输入 */
.amount-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
}

.amount-symbol {
  font-size: 36rpx;
  color: #333333;
}

.amount-input {
  flex: 1;
  font-size: 36rpx;
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

/* 开关 */
.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
