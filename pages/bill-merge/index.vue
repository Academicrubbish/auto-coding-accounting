<template>
  <view class="merge-container">
    <!-- 文件上传区域 -->
    <view class="upload-section">
      <view class="section-title">📁 上传账单文件</view>

      <!-- 微信账单 -->
      <view class="upload-item" @tap="chooseWeChatFile">
        <view class="upload-left">
          <text class="upload-icon">💬</text>
          <view class="upload-info">
            <text class="upload-name">微信账单</text>
            <text class="upload-desc">.xlsx 格式</text>
          </view>
        </view>
        <view class="upload-status">
          <text v-if="wxFile" class="status-text uploaded">{{ wxFile.name }}</text>
          <text v-else class="status-text">未选择</text>
        </view>
      </view>

      <!-- 支付宝账单 -->
      <view class="upload-item" @tap="chooseAlipayFile">
        <view class="upload-left">
          <text class="upload-icon">💰</text>
          <view class="upload-info">
            <text class="upload-name">支付宝账单</text>
            <text class="upload-desc">.csv 格式</text>
          </view>
        </view>
        <view class="upload-status">
          <text v-if="zfbFile" class="status-text uploaded">{{ zfbFile.name }}</text>
          <text v-else class="status-text">未选择</text>
        </view>
      </view>

      <!-- 银行卡流水 -->
      <view class="bank-section">
        <view class="bank-header">
          <text class="bank-title">银行卡流水</text>
          <text class="bank-desc">（可选，最多3张）</text>
        </view>

        <view class="bank-list">
          <view
            v-for="(bank, index) in bankCards"
            :key="index"
            class="bank-item"
          >
            <view class="bank-info" @tap="chooseBankFile(index)">
              <text class="bank-icon">🏦</text>
              <view class="bank-details">
                <text class="bank-name">{{ bank.bankName || '未命名' }}</text>
                <text class="bank-suffix">{{ bank.cardSuffix || '----' }}</text>
              </view>
              <text class="bank-file">{{ bank.file ? bank.file.name : '选择文件' }}</text>
            </view>
            <view class="bank-actions" v-if="bankCards.length > 0">
              <text class="bank-delete" @tap.stop="removeBankCard(index)">删除</text>
            </view>
          </view>
        </view>

        <view
          v-if="bankCards.length < 3"
          class="add-bank-btn"
          @tap="addBankCard"
        >
          <text class="add-text">+ 添加银行卡</text>
        </view>
      </view>

      <!-- 执行合并按钮 -->
      <button
        class="merge-btn"
        @tap="executeMerge"
        :disabled="isMerging || !wxFile || !zfbFile"
      >
        <text v-if="isMerging">解析中...</text>
        <text v-else>执行合并</text>
      </button>
    </view>

    <!-- 合并结果列表 -->
    <view class="result-section" v-if="hasResults">
      <view class="section-header">
        <text class="section-title">📊 合并结果 ({{ totalCount }}条)</text>
        <view class="result-summary">
          <text class="summary-item">微信: {{ summary.wechat }}</text>
          <text class="summary-item">支付宝: {{ summary.alipay }}</text>
          <text class="summary-item">银行卡: {{ summary.bank }}</text>
        </view>
      </view>

      <view class="result-list" v-if="tempRecords.length > 0">
        <view
          v-for="record in tempRecords"
          :key="record._id"
          class="result-item"
          @tap="goToEdit(record._id)"
        >
          <view class="result-left">
            <text class="result-date">{{ record.transaction_time }}</text>
            <text class="result-amount">{{ record.type === 'income' ? '+' : '-' }}{{ record.amount.toFixed(2) }}</text>
          </view>
          <view class="result-center">
            <text class="result-source">{{ record.source }}</text>
            <text class="result-party">{{ record.counterparty || record.description || '-' }}</text>
          </view>
          <view class="result-right">
            <text class="result-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="result-empty" v-else>
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无数据，请先执行合并</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-actions" v-if="tempRecords.length > 0">
      <button class="action-btn secondary" @tap="clearRecords">清空</button>
      <button class="action-btn primary" @tap="goToEditList">查看/编辑</button>
    </view>

    <!-- 添加银行卡弹窗 -->
    <view class="modal-mask" v-if="showBankModal" @tap="showBankModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">添加银行卡</text>
          <text class="modal-close" @tap="showBankModal = false">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">银行名称</text>
            <input
              class="form-input"
              v-model="newBank.bankName"
              placeholder="如：建设银行、招商银行"
            />
          </view>
          <view class="form-item">
            <text class="form-label">卡号后四位</text>
            <input
              class="form-input"
              v-model="newBank.cardSuffix"
              placeholder="如：9351"
              type="number"
              maxlength="4"
            />
          </view>
          <view class="form-item">
            <text class="form-label">上传流水文件</text>
            <view class="file-btn" @tap="chooseNewBankFile">
              <text v-if="newBank.file">{{ newBank.file.name }}</text>
              <text v-else class="file-btn-text">选择文件 (.xlsx)</text>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" @tap="showBankModal = false">取消</button>
          <button class="modal-btn primary" @tap="confirmAddBank">确定</button>
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

// 文件状态
const wxFile = ref<any>(null)
const zfbFile = ref<any>(null)
const bankCards = ref<any[]>([])
const isMerging = ref(false)

// 银行卡弹窗
const showBankModal = ref(false)
const newBank = ref({
  bankName: '',
  cardSuffix: '',
  file: null as any
})
const currentEditBankIndex = ref(-1)

// 临时记录
const tempRecords = ref<any[]>([])
const summary = ref({
  total: 0,
  wechat: 0,
  alipay: 0,
  bank: 0
})

const hasResults = computed(() => tempRecords.value.length > 0)
const totalCount = computed(() => tempRecords.value.length)

/**
 * 将 ArrayBuffer 转换为 Base64
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
 * 读取文件并转为 Base64
 */
function readFileAsBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'binary',
      success: (res: any) => {
        const binaryString = res.data
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        resolve(arrayBufferToBase64(bytes.buffer))
      },
      fail: reject
    })
  })
}

/**
 * 选择微信账单
 */
const chooseWeChatFile = () => {
  // @ts-ignore
  const chooseMessageFile = wx.chooseMessageFile || uni.chooseMessageFile
  if (typeof chooseMessageFile !== 'function') {
    // @ts-ignore
    uni.showToast({ title: '当前环境不支持文件选择', icon: 'none' })
    return
  }

  chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['xlsx'],
    success: async (res: any) => {
      if (res.tempFiles && res.tempFiles.length > 0) {
        const file = res.tempFiles[0]
        if (!file.name.endsWith('.xlsx')) {
          // @ts-ignore
          uni.showToast({ title: '请选择Excel文件', icon: 'none' })
          return
        }
        const filePath = file.path || file.tempFilePath || file.filePath
        if (filePath) {
          try {
            const content = await readFileAsBase64(filePath)
            wxFile.value = { name: file.name, content }
          } catch (e) {
            // @ts-ignore
            uni.showToast({ title: '文件读取失败', icon: 'none' })
          }
        }
      }
    }
  })
}

/**
 * 选择支付宝账单
 */
const chooseAlipayFile = () => {
  // @ts-ignore
  const chooseMessageFile = wx.chooseMessageFile || uni.chooseMessageFile
  if (typeof chooseMessageFile !== 'function') {
    // @ts-ignore
    uni.showToast({ title: '当前环境不支持文件选择', icon: 'none' })
    return
  }

  chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['csv'],
    success: async (res: any) => {
      if (res.tempFiles && res.tempFiles.length > 0) {
        const file = res.tempFiles[0]
        if (!file.name.endsWith('.csv')) {
          // @ts-ignore
          uni.showToast({ title: '请选择CSV文件', icon: 'none' })
          return
        }
        const filePath = file.path || file.tempFilePath || file.filePath
        if (filePath) {
          try {
            const content = await readFileAsBase64(filePath)
            zfbFile.value = { name: file.name, content }
          } catch (e) {
            // @ts-ignore
            uni.showToast({ title: '文件读取失败', icon: 'none' })
          }
        }
      }
    }
  })
}

/**
 * 添加银行卡
 */
const addBankCard = () => {
  newBank.value = { bankName: '', cardSuffix: '', file: null }
  currentEditBankIndex.value = -1
  showBankModal.value = true
}

/**
 * 选择新银行卡文件
 */
const chooseNewBankFile = () => {
  // @ts-ignore
  const chooseMessageFile = wx.chooseMessageFile || uni.chooseMessageFile
  if (typeof chooseMessageFile !== 'function') return

  chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['xlsx'],
    success: async (res: any) => {
      if (res.tempFiles && res.tempFiles.length > 0) {
        const file = res.tempFiles[0]
        if (!file.name.endsWith('.xlsx')) {
          // @ts-ignore
          uni.showToast({ title: '请选择Excel文件', icon: 'none' })
          return
        }
        const filePath = file.path || file.tempFilePath || file.filePath
        if (filePath) {
          try {
            const content = await readFileAsBase64(filePath)
            newBank.value.file = { name: file.name, content }
          } catch (e) {
            // @ts-ignore
            uni.showToast({ title: '文件读取失败', icon: 'none' })
          }
        }
      }
    }
  })
}

/**
 * 确认添加银行卡
 */
const confirmAddBank = () => {
  if (!newBank.value.bankName) {
    // @ts-ignore
    uni.showToast({ title: '请输入银行名称', icon: 'none' })
    return
  }
  if (!newBank.value.cardSuffix || newBank.value.cardSuffix.length !== 4) {
    // @ts-ignore
    uni.showToast({ title: '请输入4位卡号后四位', icon: 'none' })
    return
  }
  if (!newBank.value.file) {
    // @ts-ignore
    uni.showToast({ title: '请选择流水文件', icon: 'none' })
    return
  }

  bankCards.value.push({
    bankName: newBank.value.bankName,
    cardSuffix: newBank.value.cardSuffix,
    file: newBank.value.file
  })

  showBankModal.value = false
}

/**
 * 选择已有银行卡的文件
 */
const chooseBankFile = (index: number) => {
  // @ts-ignore
  const chooseMessageFile = wx.chooseMessageFile || uni.chooseMessageFile
  if (typeof chooseMessageFile !== 'function') return

  chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['xlsx'],
    success: async (res: any) => {
      if (res.tempFiles && res.tempFiles.length > 0) {
        const file = res.tempFiles[0]
        if (!file.name.endsWith('.xlsx')) {
          // @ts-ignore
          uni.showToast({ title: '请选择Excel文件', icon: 'none' })
          return
        }
        const filePath = file.path || file.tempFilePath || file.filePath
        if (filePath) {
          try {
            const content = await readFileAsBase64(filePath)
            bankCards.value[index].file = { name: file.name, content }
          } catch (e) {
            // @ts-ignore
            uni.showToast({ title: '文件读取失败', icon: 'none' })
          }
        }
      }
    }
  })
}

/**
 * 删除银行卡
 */
const removeBankCard = (index: number) => {
  // @ts-ignore
  uni.showModal({
    title: '提示',
    content: '确定删除这张银行卡吗？',
    success: (res: any) => {
      if (res.confirm) {
        bankCards.value.splice(index, 1)
      }
    }
  })
}

/**
 * 执行合并
 */
const executeMerge = async () => {
  if (!wxFile.value || !zfbFile.value) {
    // @ts-ignore
    uni.showToast({ title: '请先上传微信和支付宝账单', icon: 'none' })
    return
  }

  isMerging.value = true
  // @ts-ignore
  uni.showLoading({ title: '解析中...' })

  try {
    // 准备银行卡数据
    const bankData = bankCards.value.map(card => ({
      bankName: card.bankName,
      cardSuffix: card.cardSuffix,
      file: card.file
    }))

    // 调用云函数解析
    // @ts-ignore
    const result = await uniCloud.callFunction({
      name: 'bill-merge',
      data: {
        action: 'parse',
        data: {
          wxFile: wxFile.value,
          zfbFile: zfbFile.value,
          bankCards: bankData
        }
      }
    })

    // @ts-ignore
    uni.hideLoading()

    if (result.result.code === 0) {
      const { records, summary: sum } = result.result.data

      // 保存到临时表
      // @ts-ignore
      const saveResult = await uniCloud.callFunction({
        name: 'bill-merge',
        data: {
          action: 'save',
          openid: userStore.openid,
          data: { records }
        }
      })

      if (saveResult.result.code === 0) {
        summary.value = sum
        // @ts-ignore
        uni.showToast({
          title: `合并成功，共 ${records.length} 条`,
          icon: 'success'
        })
        // 重新加载列表
        loadTempRecords()
      }
    } else {
      // @ts-ignore
      uni.showToast({
        title: result.result.message || '解析失败',
        icon: 'none'
      })
    }
  } catch (error) {
    // @ts-ignore
    uni.hideLoading()
    console.error('合并失败：', error)
    // @ts-ignore
    uni.showToast({ title: '合并失败', icon: 'none' })
  } finally {
    isMerging.value = false
  }
}

/**
 * 加载临时记录
 */
const loadTempRecords = async () => {
  try {
    // @ts-ignore
    const result = await uniCloud.callFunction({
      name: 'bill-merge',
      data: {
        action: 'list',
        openid: userStore.openid,
        data: { page: 1, pageSize: 100 }
      }
    })

    if (result.result.code === 0) {
      tempRecords.value = result.result.data.list
      summary.value.total = result.result.data.total
    }
  } catch (error) {
    console.error('加载记录失败：', error)
  }
}

/**
 * 清空记录
 */
const clearRecords = () => {
  // @ts-ignore
  uni.showModal({
    title: '提示',
    content: '确定清空所有合并数据吗？',
    success: async (res: any) => {
      if (res.confirm) {
        try {
          // @ts-ignore
          const result = await uniCloud.callFunction({
            name: 'bill-merge',
            data: {
              action: 'clear',
              openid: userStore.openid
            }
          })

          if (result.result.code === 0) {
            tempRecords.value = []
            summary.value = { total: 0, wechat: 0, alipay: 0, bank: 0 }
            // @ts-ignore
            uni.showToast({ title: '已清空', icon: 'success' })
          }
        } catch (error) {
          // @ts-ignore
          uni.showToast({ title: '清空失败', icon: 'none' })
        }
      }
    }
  })
}

/**
 * 跳转到编辑页
 */
const goToEdit = (id: string) => {
  // @ts-ignore
  uni.navigateTo({
    url: `/pages/bill-merge/edit?id=${id}`
  })
}

/**
 * 跳转到编辑列表页
 */
const goToEditList = () => {
  // @ts-ignore
  uni.navigateTo({
    url: '/pages/bill-merge/edit'
  })
}

onMounted(() => {
  loadTempRecords()
})

onShow(() => {
  loadTempRecords()
})
</script>

<style scoped>
.merge-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 120rpx;
}

/* 上传区域 */
.upload-section {
  background: #ffffff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.upload-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx;
  background: #f7f8fa;
  border-radius: 15rpx;
  margin-bottom: 20rpx;
}

.upload-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.upload-icon {
  font-size: 40rpx;
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 50%;
}

.upload-info {
  display: flex;
  flex-direction: column;
  gap: 5rpx;
}

.upload-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.upload-desc {
  font-size: 24rpx;
  color: #999999;
}

.upload-status .status-text {
  font-size: 24rpx;
  color: #cccccc;
}

.upload-status .status-text.uploaded {
  color: #51cf66;
}

/* 银行卡区域 */
.bank-section {
  margin-top: 30rpx;
}

.bank-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 20rpx;
}

.bank-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
}

.bank-desc {
  font-size: 24rpx;
  color: #999999;
}

.bank-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f7f8fa;
  border-radius: 15rpx;
  margin-bottom: 15rpx;
}

.bank-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.bank-icon {
  font-size: 36rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 50%;
}

.bank-details {
  display: flex;
  flex-direction: column;
  gap: 5rpx;
}

.bank-name {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}

.bank-suffix {
  font-size: 22rpx;
  color: #999999;
}

.bank-file {
  font-size: 24rpx;
  color: #667eea;
  margin-left: auto;
}

.bank-delete {
  font-size: 24rpx;
  color: #ff6b6b;
  padding: 10rpx;
}

.add-bank-btn {
  padding: 25rpx;
  background: #f0f0f0;
  border-radius: 15rpx;
  text-align: center;
  border: 2rpx dashed #cccccc;
}

.add-text {
  font-size: 26rpx;
  color: #999999;
}

/* 合并按钮 */
.merge-btn {
  width: 100%;
  height: 80rpx;
  background: #667eea;
  color: #ffffff;
  border-radius: 40rpx;
  font-size: 30rpx;
  border: none;
  margin-top: 30rpx;
}

.merge-btn[disabled] {
  background: #cccccc;
}

/* 结果区域 */
.result-section {
  background: #ffffff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
  gap: 10rpx;
}

.result-summary {
  display: flex;
  gap: 15rpx;
}

.summary-item {
  font-size: 22rpx;
  color: #999999;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f7f8fa;
  border-radius: 15rpx;
}

.result-left {
  display: flex;
  flex-direction: column;
  gap: 5rpx;
}

.result-date {
  font-size: 26rpx;
  color: #333333;
}

.result-amount {
  font-size: 28rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.result-amount[seudo*="+"] {
  color: #51cf66;
}

.result-center {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 5rpx;
}

.result-source {
  font-size: 22rpx;
  color: #999999;
}

.result-party {
  font-size: 24rpx;
  color: #666666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-right {
  margin-left: 10rpx;
}

.result-arrow {
  font-size: 40rpx;
  color: #cccccc;
}

.result-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 15rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 26rpx;
  color: #999999;
}

/* 底部操作栏 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}

.action-btn.secondary {
  background: #f7f8fa;
  color: #333333;
}

.action-btn.primary {
  background: #667eea;
  color: #ffffff;
}

/* 弹窗 */
.modal-mask {
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

.modal-content {
  width: 85%;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.modal-close {
  font-size: 40rpx;
  color: #999999;
}

.modal-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 25rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #333333;
  margin-bottom: 10rpx;
}

.form-input {
  width: 100%;
  height: 70rpx;
  background: #f7f8fa;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
}

.file-btn {
  height: 70rpx;
  background: #f7f8fa;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-btn-text {
  font-size: 26rpx;
  color: #667eea;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  height: 70rpx;
  border-radius: 35rpx;
  font-size: 26rpx;
  border: none;
}

.modal-btn.secondary {
  background: #f7f8fa;
  color: #333333;
}

.modal-btn.primary {
  background: #667eea;
  color: #ffffff;
}
</style>
