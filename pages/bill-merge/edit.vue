<template>
  <view class="edit-container">
    <!-- 顶部操作栏 -->
    <view class="top-actions">
      <button class="action-btn secondary" @tap="handleClear">
        <text class="btn-text">清空</text>
      </button>
      <button class="action-btn primary" @tap="handleImport" :disabled="!hasRecords">
        <text class="btn-text">导入 ({{ totalCount }})</text>
      </button>
    </view>

    <!-- 数据列表 -->
    <view class="records-section" v-if="records.length > 0">
      <z-paging
        ref="pagingRef"
        v-model="records"
        @query="queryList"
        :use-page-scroll="false"
        :show-default-empty-view="false"
      >
        <view
          v-for="record in records"
          :key="record._id"
          class="record-card"
          @tap="openEditModal(record)"
        >
          <view class="record-header">
            <text class="record-date">{{ record.transaction_time }}</text>
            <text class="record-source">{{ record.source }}</text>
          </view>
          <view class="record-body">
            <view class="record-amount-row">
              <text class="record-amount" :class="record.type === 'income' ? 'income' : 'expense'">
                {{ record.type === 'income' ? '+' : '-' }}{{ record.amount.toFixed(2) }}
              </text>
              <text class="record-party">{{ record.counterparty || record.description || '-' }}</text>
            </view>
            <view class="record-meta">
              <text class="meta-item" v-if="record.category_id">分类: {{ getCategoryName(record.category_id) }}</text>
              <text class="meta-item" v-if="record.account_id">账户: {{ getAccountName(record.account_id) }}</text>
            </view>
          </view>
          <view class="record-footer">
            <text class="edit-hint">点击编辑</text>
          </view>
        </view>
      </z-paging>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无合并数据</text>
      <text class="empty-hint">请先在合并页面上传文件并执行合并</text>
    </view>

    <!-- 编辑弹窗 -->
    <view class="modal-mask" v-if="showEditModal" @tap="closeEditModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">编辑记录</text>
          <text class="modal-close" @tap="closeEditModal">✕</text>
        </view>
        <view class="modal-body">
          <!-- 收支类型 -->
          <view class="form-item">
            <text class="form-label">收支类型</text>
            <view class="type-toggle">
              <view
                class="toggle-item"
                :class="{ active: editingRecord.type === 'expense' }"
                @tap="editingRecord.type = 'expense'"
              >
                <text class="toggle-text">支出</text>
              </view>
              <view
                class="toggle-item"
                :class="{ active: editingRecord.type === 'income' }"
                @tap="editingRecord.type = 'income'"
              >
                <text class="toggle-text">收入</text>
              </view>
            </view>
          </view>

          <!-- 金额 -->
          <view class="form-item">
            <text class="form-label">金额</text>
            <input
              class="form-input"
              v-model.number="editingRecord.amount"
              type="digit"
              placeholder="0.00"
            />
          </view>

          <!-- 日期 -->
          <view class="form-item">
            <text class="form-label">日期</text>
            <input
              class="form-input"
              v-model="editingRecord.transaction_time"
              placeholder="YYYY年MM月DD日"
            />
          </view>

          <!-- 分类 -->
          <view class="form-item">
            <text class="form-label">分类</text>
            <picker
              mode="selector"
              :range="categoryOptions"
              range-key="label"
              :value="categoryIndex"
              @change="onCategoryChange"
            >
              <view class="picker-input">
                <text :class="{ placeholder: !editingRecord.category_id }">
                  {{ getCategoryLabel(editingRecord.category_id) }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>

          <!-- 账户 -->
          <view class="form-item">
            <text class="form-label">账户</text>
            <picker
              mode="selector"
              :range="accountOptions"
              range-key="label"
              :value="accountIndex"
              @change="onAccountChange"
            >
              <view class="picker-input">
                <text :class="{ placeholder: !editingRecord.account_id }">
                  {{ getAccountLabel(editingRecord.account_id) }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>

          <!-- 备注 -->
          <view class="form-item">
            <text class="form-label">备注</text>
            <textarea
              class="form-textarea"
              v-model="editingRecord.remark"
              placeholder="备注信息"
              maxlength="200"
            />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" @tap="deleteRecord">删除</button>
          <button class="modal-btn primary" @tap="saveRecord">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const pagingRef = ref()

// 记录列表
const records = ref<any[]>([])
const totalCount = ref(0)

// 编辑弹窗
const showEditModal = ref(false)
const editingRecord = ref<any>({})
const editingId = ref('')

// 选项数据
const categories = ref<any[]>([])
const accounts = ref<any[]>([])

const categoryOptions = computed(() => {
  return categories.value.map(c => ({ value: c._id, label: c.name }))
})

const accountOptions = computed(() => {
  return accounts.value.map(a => ({ value: a._id, label: a.name }))
})

const categoryIndex = computed(() => {
  return categoryOptions.value.findIndex(c => c.value === editingRecord.value.category_id)
})

const accountIndex = computed(() => {
  return accountOptions.value.findIndex(a => a.value === editingRecord.value.account_id)
})

const hasRecords = computed(() => totalCount.value > 0)

/**
 * 加载分类和账户
 */
async function loadOptions() {
  try {
    // 加载分类
    // @ts-ignore
    const catResult = await uniCloud.callFunction({
      name: 'category',
      data: {
        action: 'list',
        data: {},
        openid: userStore.openid
      }
    })
    if (catResult.result.code === 0) {
      categories.value = catResult.result.data || []
    }

    // 加载账户
    // @ts-ignore
    const accResult = await uniCloud.callFunction({
      name: 'account',
      data: {
        action: 'list',
        openid: userStore.openid
      }
    })
    if (accResult.result.code === 0) {
      accounts.value = accResult.result.data || []
    }
  } catch (error) {
    console.error('加载选项失败：', error)
  }
}

/**
 * 查询列表
 */
async function queryList(page: number, pageSize: number) {
  try {
    // @ts-ignore
    const result = await uniCloud.callFunction({
      name: 'bill-merge',
      data: {
        action: 'list',
        openid: userStore.openid,
        data: { page, pageSize }
      }
    })

    if (result.result.code === 0) {
      const list = result.result.data.list || []
      totalCount.value = result.result.data.total

      // @ts-ignore
      pagingRef.value.complete(list)
    } else {
      // @ts-ignore
      pagingRef.value.complete([])
    }
  } catch (error) {
    console.error('加载列表失败：', error)
    // @ts-ignore
    pagingRef.value.complete([])
  }
}

/**
 * 获取分类名称
 */
function getCategoryName(id: string) {
  const cat = categories.value.find(c => c._id === id)
  return cat?.name || ''
}

/**
 * 获取账户名称
 */
function getAccountName(id: string) {
  const acc = accounts.value.find(a => a._id === id)
  return acc?.name || ''
}

/**
 * 获取分类标签
 */
function getCategoryLabel(id: string) {
  const name = getCategoryName(id)
  return name || '选择分类'
}

/**
 * 获取账户标签
 */
function getAccountLabel(id: string) {
  const name = getAccountName(id)
  return name || '选择账户'
}

/**
 * 打开编辑弹窗
 */
function openEditModal(record: any) {
  editingRecord.value = {
    _id: record._id,
    type: record.type || 'expense',
    amount: record.amount || 0,
    transaction_time: record.transaction_time || '',
    category_id: record.category_id || '',
    account_id: record.account_id || '',
    remark: record.remark || ''
  }
  editingId.value = record._id
  showEditModal.value = true
}

/**
 * 关闭编辑弹窗
 */
function closeEditModal() {
  showEditModal.value = false
  editingRecord.value = {}
  editingId.value = ''
}

/**
 * 分类变更
 */
function onCategoryChange(e: any) {
  const index = e.detail.value
  editingRecord.value.category_id = categoryOptions.value[index].value
}

/**
 * 账户变更
 */
function onAccountChange(e: any) {
  const index = e.detail.value
  editingRecord.value.account_id = accountOptions.value[index].value
}

/**
 * 保存记录
 */
async function saveRecord() {
  if (!editingRecord.value.amount || editingRecord.value.amount <= 0) {
    // @ts-ignore
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }

  if (!editingRecord.value.transaction_time) {
    // @ts-ignore
    uni.showToast({ title: '请输入日期', icon: 'none' })
    return
  }

  try {
    // @ts-ignore
    const result = await uniCloud.callFunction({
      name: 'bill-merge',
      data: {
        action: 'update',
        openid: userStore.openid,
        data: {
          id: editingId.value,
          updates: {
            type: editingRecord.value.type,
            amount: editingRecord.value.amount,
            transaction_time: editingRecord.value.transaction_time,
            category_id: editingRecord.value.category_id,
            account_id: editingRecord.value.account_id,
            remark: editingRecord.value.remark
          }
        }
      }
    })

    if (result.result.code === 0) {
      // @ts-ignore
      uni.showToast({ title: '保存成功', icon: 'success' })
      closeEditModal()
      // @ts-ignore
      pagingRef.value.reload()
    }
  } catch (error) {
    // @ts-ignore
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

/**
 * 删除记录
 */
async function deleteRecord() {
  // @ts-ignore
  uni.showModal({
    title: '提示',
    content: '确定删除这条记录吗？',
    success: async (res: any) => {
      if (res.confirm) {
        try {
          // @ts-ignore
          const result = await uniCloud.callFunction({
            name: 'bill-merge',
            data: {
              action: 'delete',
              openid: userStore.openid,
              data: { id: editingId.value }
            }
          })

          if (result.result.code === 0) {
            // @ts-ignore
            uni.showToast({ title: '删除成功', icon: 'success' })
            closeEditModal()
            // @ts-ignore
            pagingRef.value.reload()
          }
        } catch (error) {
          // @ts-ignore
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

/**
 * 清空所有记录
 */
function handleClear() {
  // @ts-ignore
  uni.showModal({
    title: '提示',
    content: '确定清空所有合并数据吗？此操作不可恢复！',
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
            // @ts-ignore
            uni.showToast({ title: '已清空', icon: 'success' })
            // @ts-ignore
            pagingRef.value.reload()
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
 * 导入到正式表
 */
async function handleImport() {
  if (!hasRecords.value) {
    // @ts-ignore
    uni.showToast({ title: '没有可导入的数据', icon: 'none' })
    return
  }

  // @ts-ignore
  uni.showModal({
    title: '确认导入',
    content: `确定将 ${totalCount.value} 条记录导入到账单表吗？`,
    success: async (res: any) => {
      if (res.confirm) {
        // @ts-ignore
        uni.showLoading({ title: '导入中...' })

        try {
          // @ts-ignore
          const result = await uniCloud.callFunction({
            name: 'bill-merge',
            data: {
              action: 'import',
              openid: userStore.openid
            }
          })

          // @ts-ignore
          uni.hideLoading()

          if (result.result.code === 0) {
            const { imported } = result.result.data
            // @ts-ignore
            uni.showModal({
              title: '导入成功',
              content: `已成功导入 ${imported} 条记录`,
              showCancel: false,
              success: () => {
                // @ts-ignore
                uni.navigateBack()
              }
            })
          }
        } catch (error) {
          // @ts-ignore
          uni.hideLoading()
          // @ts-ignore
          uni.showToast({ title: '导入失败', icon: 'none' })
        }
      }
    }
  })
}

onLoad((options: any) => {
  if (options.id) {
    // 从列表跳转过来，编辑单条
  }
  loadOptions()
})
</script>

<style scoped>
.edit-container {
  min-height: 100vh;
  background: #f7f8fa;
}

/* 顶部操作栏 */
.top-actions {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
  flex: 1;
  height: 70rpx;
  border-radius: 35rpx;
  font-size: 26rpx;
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

.action-btn[disabled] {
  background: #cccccc;
  color: #999999;
}

.btn-text {
  font-size: 26rpx;
}

/* 记录列表 */
.records-section {
  padding: 130rpx 30rpx 30rpx;
}

.record-card {
  background: #ffffff;
  border-radius: 15rpx;
  padding: 25rpx;
  margin-bottom: 20rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.record-date {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.record-source {
  font-size: 22rpx;
  color: #999999;
  padding: 5rpx 15rpx;
  background: #f7f8fa;
  border-radius: 10rpx;
}

.record-body {
  margin-bottom: 15rpx;
}

.record-amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.record-amount {
  font-size: 36rpx;
  font-weight: bold;
}

.record-amount.income {
  color: #51cf66;
}

.record-amount.expense {
  color: #333333;
}

.record-party {
  font-size: 24rpx;
  color: #666666;
}

.record-meta {
  display: flex;
  gap: 20rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #999999;
}

.record-footer {
  display: flex;
  justify-content: center;
  padding-top: 15rpx;
  border-top: 1rpx solid #f5f5f5;
}

.edit-hint {
  font-size: 22rpx;
  color: #667eea;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 10rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999999;
}

/* 编辑弹窗 */
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
  width: 90%;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
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

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  background: #f7f8fa;
  border-radius: 10rpx;
  padding: 15rpx 20rpx;
  font-size: 26rpx;
}

.type-toggle {
  display: flex;
  background: #f7f8fa;
  border-radius: 10rpx;
  padding: 5rpx;
}

.toggle-item {
  flex: 1;
  text-align: center;
  padding: 15rpx;
  border-radius: 8rpx;
}

.toggle-item.active {
  background: #667eea;
}

.toggle-text {
  font-size: 26rpx;
  color: #999999;
}

.toggle-item.active .toggle-text {
  color: #ffffff;
}

.picker-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70rpx;
  background: #f7f8fa;
  border-radius: 10rpx;
  padding: 0 20rpx;
}

.picker-input text.placeholder {
  color: #cccccc;
}

.picker-arrow {
  font-size: 40rpx;
  color: #cccccc;
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
