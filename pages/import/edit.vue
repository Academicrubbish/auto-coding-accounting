<template>
  <view class="edit-container">
    <!-- 统计栏 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-value">{{ stats.total }}</text>
        <text class="stat-label">总记录</text>
      </view>
      <view class="stat-item" @tap="filterByStatus('noCategory')">
        <text class="stat-value warn">{{ stats.noCategory }}</text>
        <text class="stat-label">待分类</text>
      </view>
      <view class="stat-item" @tap="filterByStatus('noAccount')">
        <text class="stat-value warn">{{ stats.noAccount }}</text>
        <text class="stat-label">待设账户</text>
      </view>
    </view>

    <!-- 批量操作区 -->
    <view class="batch-actions">
      <view class="batch-btn" @tap="showBatchCategoryPicker">
        <text class="batch-icon">🏷️</text>
        <text class="batch-text">批量设置分类</text>
      </view>
      <view class="batch-btn" @tap="showBatchAccountPicker">
        <text class="batch-icon">💳</text>
        <text class="batch-text">批量设置账户</text>
      </view>
      <view class="batch-btn danger" @tap="handleClearAll">
        <text class="batch-icon">🗑️</text>
        <text class="batch-text">清空全部</text>
      </view>
    </view>

    <!-- 记录列表 -->
    <view class="record-list">
      <z-paging
        ref="pagingRef"
        v-model="records"
        @query="queryRecords"
        :use-page-scroll="false"
        :show-default-empty-view="true"
        empty-view-text="暂无待导入数据"
      >
        <view
          class="record-item"
          v-for="item in records"
          :key="item._id"
          @tap="editRecord(item)"
        >
          <view class="record-left">
            <view
              class="record-checkbox"
              :class="{ checked: selectedIds.includes(item._id) }"
              @tap.stop="toggleSelect(item._id)"
            >
              <text v-if="selectedIds.includes(item._id)">✓</text>
            </view>
            <view class="record-info">
              <view class="record-main">
                <text class="record-type" :class="item.type">{{ item.type === 'expense' ? '支' : '收' }}</text>
                <text class="record-category">{{ item.category_name || '未分类' }}</text>
              </view>
              <view class="record-meta">
                <text class="record-date">{{ item.transaction_date }}</text>
                <text class="record-remark" v-if="item.remark">{{ item.remark }}</text>
              </view>
            </view>
          </view>
          <view class="record-right">
            <text class="record-amount" :class="item.type">
              {{ item.type === 'expense' ? '-' : '+' }}¥{{ formatMoney(item.amount) }}
            </text>
            <view class="record-status">
              <text class="status-tag" :class="{ set: item.category_id }">
                {{ item.category_id ? '已分类' : '待分类' }}
              </text>
              <text class="status-tag" :class="{ set: item.account_id }">
                {{ item.account_id ? '已设账户' : '待设账户' }}
              </text>
            </view>
          </view>
        </view>
      </z-paging>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-actions">
      <view class="selected-info" v-if="selectedIds.length > 0">
        <text class="selected-text">已选 {{ selectedIds.length }} 条</text>
        <text class="cancel-select" @tap="clearSelection">取消选择</text>
      </view>
      <button class="btn-clear" @tap="handleClearAll" v-if="selectedIds.length === 0">清空</button>
      <button class="btn-import" @tap="handleImport" :disabled="isImporting">
        {{ isImporting ? '导入中...' : `确认导入 ${stats.total} 条` }}
      </button>
    </view>

    <!-- 分类选择弹窗 -->
    <view class="picker-modal" v-if="showCategoryPicker" @tap="closeCategoryPicker">
      <view class="picker-content" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">{{ isBatchMode ? '批量设置分类' : '选择分类' }}</text>
          <text class="picker-close" @tap="closeCategoryPicker">✕</text>
        </view>
        <view class="picker-tabs">
          <view
            class="picker-tab"
            :class="{ active: categoryType === 'expense' }"
            @tap="categoryType = 'expense'"
          >支出</view>
          <view
            class="picker-tab"
            :class="{ active: categoryType === 'income' }"
            @tap="categoryType = 'income'"
          >收入</view>
        </view>
        <scroll-view class="picker-list" scroll-y>
          <view
            class="picker-item"
            v-for="cat in filteredCategories"
            :key="cat._id"
            @tap="selectCategory(cat)"
          >
            <text class="picker-item-icon">{{ cat.icon }}</text>
            <text class="picker-item-name">{{ cat.name }}</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 账户选择弹窗 -->
    <view class="picker-modal" v-if="showAccountPicker" @tap="closeAccountPicker">
      <view class="picker-content" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">{{ isBatchMode ? '批量设置账户' : '选择账户' }}</text>
          <text class="picker-close" @tap="closeAccountPicker">✕</text>
        </view>
        <scroll-view class="picker-list" scroll-y>
          <view
            class="picker-item"
            v-for="acc in accounts"
            :key="acc._id"
            @tap="selectAccount(acc)"
          >
            <text class="picker-item-icon">{{ acc.icon }}</text>
            <text class="picker-item-name">{{ acc.name }}</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 单条编辑弹窗 -->
    <view class="edit-modal" v-if="editingRecord" @tap="closeEditModal">
      <view class="edit-content" @tap.stop>
        <view class="edit-header">
          <text class="edit-title">编辑记录</text>
          <text class="edit-close" @tap="closeEditModal">✕</text>
        </view>

        <view class="edit-form">
          <!-- 收支类型 -->
          <view class="form-row">
            <text class="form-label">类型</text>
            <view class="type-switch">
              <view
                class="type-btn"
                :class="{ active: editForm.type === 'expense' }"
                @tap="editForm.type = 'expense'"
              >支出</view>
              <view
                class="type-btn"
                :class="{ active: editForm.type === 'income' }"
                @tap="editForm.type = 'income'"
              >收入</view>
            </view>
          </view>

          <!-- 金额 -->
          <view class="form-row">
            <text class="form-label">金额</text>
            <input
              class="form-input"
              type="digit"
              v-model="editForm.amount"
              placeholder="请输入金额"
            />
          </view>

          <!-- 日期 -->
          <view class="form-row">
            <text class="form-label">日期</text>
            <picker mode="date" :value="editForm.transaction_date" @change="onDateChange">
              <view class="form-picker">{{ editForm.transaction_date }}</view>
            </picker>
          </view>

          <!-- 分类 -->
          <view class="form-row" @tap="openCategoryPickerForEdit">
            <text class="form-label">分类</text>
            <view class="form-picker">
              {{ getSelectedCategoryName() || '请选择分类' }}
              <text class="picker-arrow">›</text>
            </view>
          </view>

          <!-- 账户 -->
          <view class="form-row" @tap="openAccountPickerForEdit">
            <text class="form-label">账户</text>
            <view class="form-picker">
              {{ getSelectedAccountName() || '请选择账户' }}
              <text class="picker-arrow">›</text>
            </view>
          </view>

          <!-- 备注 -->
          <view class="form-row">
            <text class="form-label">备注</text>
            <input
              class="form-input"
              v-model="editForm.remark"
              placeholder="请输入备注"
            />
          </view>
        </view>

        <view class="edit-actions">
          <button class="btn-delete" @tap="handleDeleteRecord">删除</button>
          <button class="btn-save" @tap="handleSaveRecord">保存</button>
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
const records = ref<any[]>([])
const stats = ref({ total: 0, noCategory: 0, noAccount: 0, totalExpense: 0, totalIncome: 0 })
const categories = ref<any[]>([])
const accounts = ref<any[]>([])
const selectedIds = ref<string[]>([])
const isImporting = ref(false)
const pagingRef = ref()

// 弹窗状态
const showCategoryPicker = ref(false)
const showAccountPicker = ref(false)
const isBatchMode = ref(false)
const categoryType = ref('expense')
const editingRecord = ref<any>(null)
const editForm = ref({
  type: 'expense',
  amount: '',
  transaction_date: '',
  category_id: '',
  account_id: '',
  remark: ''
})

// 过滤后的分类
const filteredCategories = computed(() => {
  return categories.value.filter(c => c.type === categoryType.value)
})

/**
 * 格式化金额
 */
const formatMoney = (val: number) => {
  return val.toFixed(2)
}

/**
 * 获取选中分类名称
 */
const getSelectedCategoryName = () => {
  if (!editForm.value.category_id) return ''
  const cat = categories.value.find(c => c._id === editForm.value.category_id)
  return cat?.name || ''
}

/**
 * 获取选中账户名称
 */
const getSelectedAccountName = () => {
  if (!editForm.value.account_id) return ''
  const acc = accounts.value.find(a => a._id === editForm.value.account_id)
  return acc?.name || ''
}

/**
 * 加载统计数据
 */
const loadStats = async () => {
  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'import-data',
      data: {
        action: 'stats',
        openid: userStore.openid
      }
    })

    if (res.result.code === 0) {
      stats.value = res.result.data
    }
  } catch (error) {
    console.error('加载统计失败：', error)
  }
}

/**
 * 加载分类列表
 */
const loadCategories = async () => {
  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'category',
      data: {
        action: 'list',
        openid: userStore.openid
      }
    })

    if (res.result.code === 0) {
      categories.value = res.result.data || []
    }
  } catch (error) {
    console.error('加载分类失败：', error)
  }
}

/**
 * 加载账户列表
 */
const loadAccounts = async () => {
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
  }
}

/**
 * 查询记录列表
 */
const queryRecords = async (page: number, pageSize: number) => {
  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'import-data',
      data: {
        action: 'list',
        openid: userStore.openid,
        data: { page, pageSize }
      }
    })

    if (res.result.code === 0) {
      pagingRef.value?.complete(res.result.data.list)
    } else {
      pagingRef.value?.complete([])
    }
  } catch (error) {
    console.error('查询记录失败：', error)
    pagingRef.value?.complete([])
  }
}

/**
 * 切换选择
 */
const toggleSelect = (id: string) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

/**
 * 清除选择
 */
const clearSelection = () => {
  selectedIds.value = []
}

/**
 * 显示批量分类选择
 */
const showBatchCategoryPicker = () => {
  isBatchMode.value = true
  showCategoryPicker.value = true
}

/**
 * 显示批量账户选择
 */
const showBatchAccountPicker = () => {
  isBatchMode.value = true
  showAccountPicker.value = true
}

/**
 * 关闭分类选择
 */
const closeCategoryPicker = () => {
  showCategoryPicker.value = false
  isBatchMode.value = false
}

/**
 * 关闭账户选择
 */
const closeAccountPicker = () => {
  showAccountPicker.value = false
  isBatchMode.value = false
}

/**
 * 选择分类
 */
const selectCategory = async (cat: any) => {
  if (isBatchMode.value) {
    // 批量设置
    const ids = selectedIds.value.length > 0 ? selectedIds.value : records.value.map(r => r._id)

    // @ts-ignore
    uni.showLoading({ title: '设置中...' })

    try {
      // @ts-ignore
      const res = await uniCloud.callFunction({
        name: 'import-data',
        data: {
          action: 'batchUpdate',
          openid: userStore.openid,
          data: { ids, field: 'category_id', value: cat._id }
        }
      })

      // @ts-ignore
      uni.hideLoading()

      if (res.result.code === 0) {
        // @ts-ignore
        uni.showToast({ title: '设置成功', icon: 'success' })
        closeCategoryPicker()
        clearSelection()
        pagingRef.value?.reload()
        loadStats()
      }
    } catch (error) {
      // @ts-ignore
      uni.hideLoading()
      // @ts-ignore
      uni.showToast({ title: '设置失败', icon: 'none' })
    }
  } else {
    // 单条编辑
    editForm.value.category_id = cat._id
    closeCategoryPicker()
  }
}

/**
 * 选择账户
 */
const selectAccount = async (acc: any) => {
  if (isBatchMode.value) {
    // 批量设置
    const ids = selectedIds.value.length > 0 ? selectedIds.value : records.value.map(r => r._id)

    // @ts-ignore
    uni.showLoading({ title: '设置中...' })

    try {
      // @ts-ignore
      const res = await uniCloud.callFunction({
        name: 'import-data',
        data: {
          action: 'batchUpdate',
          openid: userStore.openid,
          data: { ids, field: 'account_id', value: acc._id }
        }
      })

      // @ts-ignore
      uni.hideLoading()

      if (res.result.code === 0) {
        // @ts-ignore
        uni.showToast({ title: '设置成功', icon: 'success' })
        closeAccountPicker()
        clearSelection()
        pagingRef.value?.reload()
        loadStats()
      }
    } catch (error) {
      // @ts-ignore
      uni.hideLoading()
      // @ts-ignore
      uni.showToast({ title: '设置失败', icon: 'none' })
    }
  } else {
    // 单条编辑
    editForm.value.account_id = acc._id
    closeAccountPicker()
  }
}

/**
 * 编辑记录
 */
const editRecord = (item: any) => {
  editingRecord.value = item
  editForm.value = {
    type: item.type,
    amount: String(item.amount),
    transaction_date: item.transaction_date,
    category_id: item.category_id || '',
    account_id: item.account_id || '',
    remark: item.remark || ''
  }
  categoryType.value = item.type
}

/**
 * 关闭编辑弹窗
 */
const closeEditModal = () => {
  editingRecord.value = null
}

/**
 * 打开分类选择（单条编辑模式）
 */
const openCategoryPickerForEdit = () => {
  isBatchMode.value = false
  showCategoryPicker.value = true
}

/**
 * 打开账户选择（单条编辑模式）
 */
const openAccountPickerForEdit = () => {
  isBatchMode.value = false
  showAccountPicker.value = true
}

/**
 * 日期变更
 */
const onDateChange = (e: any) => {
  editForm.value.transaction_date = e.detail.value
}

/**
 * 保存记录
 */
const handleSaveRecord = async () => {
  if (!editingRecord.value) return

  // @ts-ignore
  uni.showLoading({ title: '保存中...' })

  try {
    // @ts-ignore
    const res = await uniCloud.callFunction({
      name: 'import-data',
      data: {
        action: 'update',
        openid: userStore.openid,
        data: {
          id: editingRecord.value._id,
          updates: {
            type: editForm.value.type,
            amount: parseFloat(editForm.value.amount) || 0,
            transaction_date: editForm.value.transaction_date,
            category_id: editForm.value.category_id,
            account_id: editForm.value.account_id,
            remark: editForm.value.remark
          }
        }
      }
    })

    // @ts-ignore
    uni.hideLoading()

    if (res.result.code === 0) {
      // @ts-ignore
      uni.showToast({ title: '保存成功', icon: 'success' })
      closeEditModal()
      pagingRef.value?.reload()
      loadStats()
    } else {
      // @ts-ignore
      uni.showToast({ title: res.result.message || '保存失败', icon: 'none' })
    }
  } catch (error) {
    // @ts-ignore
    uni.hideLoading()
    // @ts-ignore
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

/**
 * 删除记录
 */
const handleDeleteRecord = async () => {
  if (!editingRecord.value) return

  // @ts-ignore
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res: any) => {
      if (res.confirm) {
        // @ts-ignore
        uni.showLoading({ title: '删除中...' })

        try {
          // @ts-ignore
          const deleteRes = await uniCloud.callFunction({
            name: 'import-data',
            data: {
              action: 'delete',
              openid: userStore.openid,
              data: { id: editingRecord.value._id }
            }
          })

          // @ts-ignore
          uni.hideLoading()

          if (deleteRes.result.code === 0) {
            // @ts-ignore
            uni.showToast({ title: '删除成功', icon: 'success' })
            closeEditModal()
            pagingRef.value?.reload()
            loadStats()
          }
        } catch (error) {
          // @ts-ignore
          uni.hideLoading()
          // @ts-ignore
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

/**
 * 清空全部
 */
const handleClearAll = () => {
  // @ts-ignore
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有待导入数据吗？此操作不可恢复',
    success: async (res: any) => {
      if (res.confirm) {
        // @ts-ignore
        uni.showLoading({ title: '清空中...' })

        try {
          // @ts-ignore
          const clearRes = await uniCloud.callFunction({
            name: 'import-data',
            data: {
              action: 'clear',
              openid: userStore.openid
            }
          })

          // @ts-ignore
          uni.hideLoading()

          if (clearRes.result.code === 0) {
            // @ts-ignore
            uni.showToast({ title: '已清空', icon: 'success' })
            records.value = []
            stats.value = { total: 0, noCategory: 0, noAccount: 0, totalExpense: 0, totalIncome: 0 }

            // 返回上一页
            setTimeout(() => {
              // @ts-ignore
              uni.navigateBack()
            }, 500)
          }
        } catch (error) {
          // @ts-ignore
          uni.hideLoading()
          // @ts-ignore
          uni.showToast({ title: '清空失败', icon: 'none' })
        }
      }
    }
  })
}

/**
 * 确认导入
 */
const handleImport = async () => {
  if (isImporting.value) return

  // @ts-ignore
  uni.showModal({
    title: '确认导入',
    content: `确定要将 ${stats.value.total} 条记录导入到交易记录吗？导入后不可撤销`,
    success: async (res: any) => {
      if (res.confirm) {
        isImporting.value = true
        // @ts-ignore
        uni.showLoading({ title: '导入中...' })

        try {
          // @ts-ignore
          const importRes = await uniCloud.callFunction({
            name: 'import-data',
            data: {
              action: 'import',
              openid: userStore.openid
            }
          })

          // @ts-ignore
          uni.hideLoading()

          if (importRes.result.code === 0) {
            // @ts-ignore
            uni.showToast({
              title: `成功导入 ${importRes.result.data.imported} 条`,
              icon: 'success'
            })

            // 返回上一页
            setTimeout(() => {
              // @ts-ignore
              uni.navigateBack()
            }, 1000)
          } else {
            // @ts-ignore
            uni.showToast({
              title: importRes.result.message || '导入失败',
              icon: 'none'
            })
          }
        } catch (error) {
          // @ts-ignore
          uni.hideLoading()
          // @ts-ignore
          uni.showToast({ title: '导入失败', icon: 'none' })
        } finally {
          isImporting.value = false
        }
      }
    }
  })
}

/**
 * 筛选状态
 */
const filterByStatus = (status: string) => {
  // TODO: 实现筛选功能
  // @ts-ignore
  uni.showToast({
    title: '筛选功能开发中',
    icon: 'none'
  })
}

/**
 * 页面加载
 */
onMounted(() => {
  loadCategories()
  loadAccounts()
  loadStats()
})

onShow(() => {
  loadStats()
})
</script>

<style scoped>
.edit-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 140rpx;
}

/* 统计栏 */
.stats-bar {
  display: flex;
  justify-content: space-around;
  background: #ffffff;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
}

.stat-value.warn {
  color: #ff9500;
}

.stat-label {
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
}

/* 批量操作区 */
.batch-actions {
  display: flex;
  padding: 20rpx 30rpx;
  gap: 20rpx;
  background: #ffffff;
  margin-bottom: 20rpx;
}

.batch-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  background: #f7f8fa;
  border-radius: 12rpx;
}

.batch-btn.danger {
  background: #fff5f5;
}

.batch-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.batch-text {
  font-size: 22rpx;
  color: #666666;
}

.batch-btn.danger .batch-text {
  color: #ff6b6b;
}

/* 记录列表 */
.record-list {
  margin: 0 30rpx;
}

.record-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 25rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.record-checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #dddddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #ffffff;
}

.record-checkbox.checked {
  background: #667eea;
  border-color: #667eea;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.record-main {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.record-type {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: bold;
  color: #ffffff;
}

.record-type.expense {
  background: #ff6b6b;
}

.record-type.income {
  background: #4caf50;
}

.record-category {
  font-size: 28rpx;
  color: #333333;
}

.record-meta {
  display: flex;
  gap: 16rpx;
}

.record-date {
  font-size: 22rpx;
  color: #999999;
}

.record-remark {
  font-size: 22rpx;
  color: #999999;
  max-width: 200rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
}

.record-amount {
  font-size: 32rpx;
  font-weight: bold;
}

.record-amount.expense {
  color: #ff6b6b;
}

.record-amount.income {
  color: #4caf50;
}

.record-status {
  display: flex;
  gap: 10rpx;
}

.status-tag {
  font-size: 20rpx;
  padding: 4rpx 10rpx;
  background: #fff5f5;
  color: #ff9500;
  border-radius: 6rpx;
}

.status-tag.set {
  background: #f0fff0;
  color: #4caf50;
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
  align-items: center;
}

.selected-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.selected-text {
  font-size: 28rpx;
  color: #667eea;
}

.cancel-select {
  font-size: 24rpx;
  color: #999999;
}

.btn-clear {
  flex: 1;
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 44rpx;
  font-size: 30rpx;
  color: #666666;
  border: none;
}

.btn-import {
  flex: 2;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 44rpx;
  font-size: 30rpx;
  color: #ffffff;
  border: none;
}

.btn-import[disabled] {
  opacity: 0.6;
}

/* 弹窗 */
.picker-modal,
.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.picker-content,
.edit-content {
  width: 100%;
  background: #ffffff;
  border-radius: 30rpx 30rpx 0 0;
  max-height: 70vh;
}

.picker-header,
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-title,
.edit-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.picker-close,
.edit-close {
  font-size: 36rpx;
  color: #999999;
  padding: 10rpx;
}

.picker-tabs {
  display: flex;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-tab {
  flex: 1;
  text-align: center;
  padding: 25rpx;
  font-size: 28rpx;
  color: #666666;
  position: relative;
}

.picker-tab.active {
  color: #667eea;
  font-weight: bold;
}

.picker-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: #667eea;
  border-radius: 2rpx;
}

.picker-list {
  max-height: 50vh;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.picker-item-icon {
  font-size: 40rpx;
}

.picker-item-name {
  font-size: 28rpx;
  color: #333333;
}

/* 编辑表单 */
.edit-form {
  padding: 20rpx 30rpx;
  max-height: 50vh;
  overflow-y: auto;
}

.form-row {
  display: flex;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.form-label {
  width: 140rpx;
  font-size: 28rpx;
  color: #666666;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  text-align: right;
}

.form-picker {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.picker-arrow {
  margin-left: 10rpx;
  color: #cccccc;
}

.type-switch {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.type-btn {
  padding: 10rpx 30rpx;
  font-size: 26rpx;
  border-radius: 30rpx;
  background: #f5f5f5;
  color: #666666;
}

.type-btn.active {
  background: #667eea;
  color: #ffffff;
}

.edit-actions {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-delete {
  flex: 1;
  height: 88rpx;
  background: #fff5f5;
  border-radius: 44rpx;
  font-size: 30rpx;
  color: #ff6b6b;
  border: none;
}

.btn-save {
  flex: 2;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 44rpx;
  font-size: 30rpx;
  color: #ffffff;
  border: none;
}
</style>
