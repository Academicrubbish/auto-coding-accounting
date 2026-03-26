<template>
  <view class="preview-container">
    <!-- 上传区域 -->
    <view class="upload-section" v-if="!parsedData">
      <view class="upload-area" @tap="chooseFile">
        <text class="upload-icon">📄</text>
        <text class="upload-text">点击选择 CSV 文件</text>
        <text class="upload-hint">支持本软件导出、钱迹等格式</text>
      </view>
    </view>

    <!-- 解析结果 -->
    <view class="result-section" v-else>
      <!-- 统计卡片 -->
      <view class="stats-card">
        <view class="stats-row">
          <view class="stats-item">
            <text class="stats-value">{{ parsedData.stats.total }}</text>
            <text class="stats-label">总记录</text>
          </view>
          <view class="stats-item">
            <text class="stats-value expense">{{ parsedData.stats.expense }}</text>
            <text class="stats-label">支出</text>
          </view>
          <view class="stats-item">
            <text class="stats-value income">{{ parsedData.stats.income }}</text>
            <text class="stats-label">收入</text>
          </view>
        </view>
        <view class="stats-row">
          <view class="stats-item">
            <text class="stats-value">¥{{ formatMoney(parsedData.stats.totalExpense) }}</text>
            <text class="stats-label">总支出</text>
          </view>
          <view class="stats-item">
            <text class="stats-value">¥{{ formatMoney(parsedData.stats.totalIncome) }}</text>
            <text class="stats-label">总收入</text>
          </view>
        </view>
        <view class="format-info">
          <text class="format-tag">{{ formatLabel }}</text>
        </view>
      </view>

      <!-- 预览列表 -->
      <view class="preview-list">
        <view class="list-header">
          <text class="list-title">数据预览（前10条）</text>
        </view>
        <view class="record-item" v-for="(item, index) in previewRecords" :key="index">
          <view class="record-left">
            <text class="record-type" :class="item.type">{{ item.type === 'expense' ? '支' : '收' }}</text>
            <view class="record-info">
              <text class="record-category">{{ item.category_name || '未分类' }}</text>
              <text class="record-date">{{ item.transaction_date }}</text>
            </view>
          </view>
          <view class="record-right">
            <text class="record-amount" :class="item.type">
              {{ item.type === 'expense' ? '-' : '+' }}¥{{ formatMoney(item.amount) }}
            </text>
            <text class="record-account">{{ item.account_name || '未设置账户' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-actions" v-if="parsedData">
      <button class="btn-cancel" @tap="handleCancel">取消</button>
      <button class="btn-confirm" @tap="handleConfirm" :disabled="isSaving">
        {{ isSaving ? '保存中...' : '确认暂存' }}
      </button>
    </view>

    <!-- 加载中 -->
    <view class="loading-mask" v-if="isParsing">
      <text class="loading-text">正在解析文件...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

// 状态
const parsedData = ref<any>(null)
const isParsing = ref(false)
const isSaving = ref(false)

// 格式标签
const formatLabel = computed(() => {
  if (!parsedData.value) return ''
  const formatMap: Record<string, string> = {
    'standard': '本软件导出',
    'qianji': '钱迹',
    'unknown': '通用CSV'
  }
  return formatMap[parsedData.value.format] || '通用CSV'
})

// 预览记录（最多10条）
const previewRecords = computed(() => {
  if (!parsedData.value) return []
  return parsedData.value.records.slice(0, 10)
})

/**
 * 格式化金额
 */
const formatMoney = (val: number) => {
  return val.toFixed(2)
}

/**
 * 选择文件
 */
const chooseFile = () => {
  // @ts-ignore
  const chooseMessageFile = wx.chooseMessageFile || uni.chooseMessageFile

  if (typeof chooseMessageFile !== 'function') {
    // @ts-ignore
    uni.showToast({
      title: '当前环境不支持文件选择',
      icon: 'none'
    })
    return
  }

  chooseMessageFile({
    count: 1,
    type: 'file',
    success: (res: any) => {
      if (res.tempFiles && res.tempFiles.length > 0) {
        const file = res.tempFiles[0]
        const fileName = file.name || ''

        if (fileName.endsWith('.csv')) {
          const filePath = file.path || file.tempFilePath || file.filePath
          if (filePath) {
            parseFile(filePath)
          } else {
            // @ts-ignore
            uni.showToast({
              title: '文件路径获取失败',
              icon: 'none'
            })
          }
        } else {
          // @ts-ignore
          uni.showToast({
            title: '请选择 CSV 文件',
            icon: 'none'
          })
        }
      }
    },
    fail: (err: any) => {
      if (err.errMsg && err.errMsg.includes('cancel')) {
        return
      }
      console.error('选择文件失败：', err)
      // @ts-ignore
      uni.showToast({
        title: '选择文件失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 解析文件
 */
const parseFile = async (filePath: string) => {
  isParsing.value = true

  try {
    // @ts-ignore
    const fs = uni.getFileSystemManager()

    // 读取文件为 binary
    fs.readFile({
      filePath: filePath,
      encoding: 'binary',
      success: async (res: any) => {
        try {
          // 转换为 base64
          const binaryString = res.data
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const base64Content = arrayBufferToBase64(bytes.buffer)

          // 调用云函数解析
          // @ts-ignore
          const result = await uniCloud.callFunction({
            name: 'import-data',
            data: {
              action: 'parse',
              data: {
                content: base64Content
              }
            }
          })

          if (result.result.code === 0) {
            parsedData.value = result.result.data
            // @ts-ignore
            uni.showToast({
              title: `解析成功，共 ${result.result.data.stats.total} 条`,
              icon: 'success'
            })
          } else {
            // @ts-ignore
            uni.showToast({
              title: result.result.message || '解析失败',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('解析失败：', error)
          // @ts-ignore
          uni.showToast({
            title: '解析失败',
            icon: 'none'
          })
        } finally {
          isParsing.value = false
        }
      },
      fail: (err: any) => {
        isParsing.value = false
        console.error('读取文件失败：', err)
        // @ts-ignore
        uni.showToast({
          title: '读取文件失败',
          icon: 'none'
        })
      }
    })
  } catch (error) {
    isParsing.value = false
    console.error('解析失败：', error)
    // @ts-ignore
    uni.showToast({
      title: '解析失败',
      icon: 'none'
    })
  }
}

/**
 * ArrayBuffer 转 Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  let result = ''
  let i = 0

  while (i < len) {
    const a = bytes[i++]
    const b = i < len ? bytes[i++] : 0
    const c = i < len ? bytes[i++] : 0

    const bitmap = (a << 16) | (b << 8) | c

    result += base64Chars.charAt((bitmap >> 18) & 63)
    result += base64Chars.charAt((bitmap >> 12) & 63)
    result += base64Chars.charAt((bitmap >> 6) & 63)
    result += base64Chars.charAt(bitmap & 63)

    if (i > len) {
      result = result.substring(0, result.length - ((i - len) + 1)) + '='.repeat((i - len) + 1)
    }
  }

  return result
}

/**
 * 取消
 */
const handleCancel = () => {
  parsedData.value = null
}

/**
 * 确认暂存
 */
const handleConfirm = async () => {
  if (!parsedData.value || isSaving.value) return

  isSaving.value = true
  // @ts-ignore
  uni.showLoading({ title: '保存中...' })

  try {
    // @ts-ignore
    const result = await uniCloud.callFunction({
      name: 'import-data',
      data: {
        action: 'save',
        openid: userStore.openid,
        data: {
          records: parsedData.value.records,
          source: formatLabel.value
        }
      }
    })

    // @ts-ignore
    uni.hideLoading()

    if (result.result.code === 0) {
      // @ts-ignore
      uni.showToast({
        title: '暂存成功',
        icon: 'success'
      })

      // 跳转到编辑页
      setTimeout(() => {
        // @ts-ignore
        uni.navigateTo({
          url: '/pages/import/edit'
        })
      }, 500)
    } else {
      // @ts-ignore
      uni.showToast({
        title: result.result.message || '保存失败',
        icon: 'none'
      })
    }
  } catch (error) {
    // @ts-ignore
    uni.hideLoading()
    console.error('保存失败：', error)
    // @ts-ignore
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.preview-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 140rpx;
}

/* 上传区域 */
.upload-section {
  padding: 60rpx 30rpx;
}

.upload-area {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx dashed #dddddd;
}

.upload-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.upload-text {
  font-size: 32rpx;
  color: #333333;
  margin-bottom: 15rpx;
}

.upload-hint {
  font-size: 24rpx;
  color: #999999;
}

/* 统计卡片 */
.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
  margin: 30rpx;
  border-radius: 20rpx;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20rpx;
}

.stats-row:last-child {
  margin-bottom: 0;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
}

.stats-value.expense {
  color: #ff6b6b;
}

.stats-value.income {
  color: #4caf50;
}

.stats-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.format-info {
  display: flex;
  justify-content: center;
  margin-top: 20rpx;
}

.format-tag {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
  padding: 6rpx 16rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
}

/* 预览列表 */
.preview-list {
  margin: 0 30rpx;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.list-header {
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.list-title {
  font-size: 28rpx;
  color: #666666;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.record-type {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  color: #ffffff;
}

.record-type.expense {
  background: #ff6b6b;
}

.record-type.income {
  background: #4caf50;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.record-category {
  font-size: 28rpx;
  color: #333333;
}

.record-date {
  font-size: 22rpx;
  color: #999999;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
}

.record-amount {
  font-size: 30rpx;
  font-weight: bold;
}

.record-amount.expense {
  color: #ff6b6b;
}

.record-amount.income {
  color: #4caf50;
}

.record-account {
  font-size: 22rpx;
  color: #999999;
}

/* 底部按钮 */
.bottom-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  background: #ffffff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.btn-cancel {
  flex: 1;
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 44rpx;
  font-size: 30rpx;
  color: #666666;
  border: none;
}

.btn-confirm {
  flex: 2;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 44rpx;
  font-size: 30rpx;
  color: #ffffff;
  border: none;
}

.btn-confirm[disabled] {
  opacity: 0.6;
}

/* 加载中 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.loading-text {
  font-size: 28rpx;
  color: #ffffff;
  padding: 30rpx 50rpx;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 10rpx;
}
</style>
