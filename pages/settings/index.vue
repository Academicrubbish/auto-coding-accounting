<template>
  <view class="settings-container">
    <!-- 数据管理 -->
    <view class="settings-section">
      <view class="section-title">数据管理</view>
      <view class="settings-list">
        <view class="settings-item" @tap="exportData">
          <view class="item-left">
            <text class="item-icon">📤</text>
            <view class="item-info">
              <text class="item-name">导出数据</text>
              <text class="item-desc">导出交易记录为CSV格式</text>
            </view>
          </view>
          <text class="item-arrow">›</text>
        </view>

        <view class="settings-item" @tap="importData">
          <view class="item-left">
            <text class="item-icon">📥</text>
            <view class="item-info">
              <text class="item-name">导入数据</text>
              <text class="item-desc">从CSV文件导入交易记录</text>
            </view>
          </view>
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 系统设置 -->
    <view class="settings-section">
      <view class="section-title">系统设置</view>
      <view class="settings-list">
        <view class="settings-item" @tap="clearCache">
          <view class="item-left">
            <text class="item-icon">🧹</text>
            <text class="item-name">清除缓存</text>
          </view>
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 账户操作 -->
    <view class="logout-section" v-if="!isGuest">
      <button class="logout-btn" @tap="handleLogout">
        <text class="logout-text">退出登录</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const isExporting = ref(false)
const isImporting = ref(false)

// 计算属性
const isGuest = computed(() => userStore.isGuest)

/**
 * 导出数据为CSV格式
 */
const exportData = async () => {
  if (isGuest.value) {
    // @ts-ignore
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  if (isExporting.value) return

  // @ts-ignore
  uni.showModal({
    title: '导出数据',
    content: '确定要导出交易记录吗？',
    success: async (res: any) => {
      if (res.confirm) {
        isExporting.value = true
        // @ts-ignore
        uni.showLoading({ title: '导出中...' })

        try {
          // 调用云函数获取所有交易记录
          // @ts-ignore
          const result = await uniCloud.callFunction({
            name: 'transaction',
            data: {
              action: 'list',
              openid: userStore.openid,
              page: 1,
              pageSize: 10000  // 获取所有数据
            }
          })

          if (result.result.code === 0) {
            const transactions = result.result.data.list || []

            // 获取账户和分类映射
            const accountsMap = await getAccountsMap()
            const categoriesMap = await getCategoriesMap()

            // 生成CSV内容
            const csvContent = generateCSV(transactions, accountsMap, categoriesMap)

            // 保存文件
            // @ts-ignore
            const fs = uni.getFileSystemManager()
            const fileName = `transactions_${Date.now()}.csv`
            const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`

            fs.writeFile({
              filePath: filePath,
              data: csvContent,
              encoding: 'utf-8',
              success: () => {
                // @ts-ignore
                uni.hideLoading()
                // @ts-ignore
                uni.showModal({
                  title: '导出成功',
                  content: `已导出 ${transactions.length} 条交易记录`,
                  showCancel: false,
                  success: () => {
                    // 在小程序中，可以通过分享或查看文件来访问
                    // 这里简化处理，提示用户文件已保存
                  }
                })
              },
              fail: (err: any) => {
                // @ts-ignore
                uni.hideLoading()
                console.error('保存文件失败：', err)
                // @ts-ignore
                uni.showToast({
                  title: '保存失败',
                  icon: 'none'
                })
              }
            })
          } else {
            // @ts-ignore
            uni.hideLoading()
            // @ts-ignore
            uni.showToast({
              title: result.result.message || '导出失败',
              icon: 'none'
            })
          }
        } catch (error) {
          // @ts-ignore
          uni.hideLoading()
          console.error('导出失败：', error)
          // @ts-ignore
          uni.showToast({
            title: '导出失败',
            icon: 'none'
          })
        } finally {
          isExporting.value = false
        }
      }
    }
  })
}

/**
 * 生成CSV内容
 */
const generateCSV = (transactions: any[], accountsMap: Record<string, any>, categoriesMap: Record<string, any>) => {
  // CSV表头
  const headers = ['日期', '收支类型', '类别', '账户', '金额', '备注']

  // CSV内容
  const rows = transactions.map(t => {
    const date = formatDate(t.transaction_date)
    const type = t.type === 'income' ? '收入' : t.type === 'expense' ? '支出' : '转账'
    const category = categoriesMap[t.category_id]?.name || '未分类'
    const account = accountsMap[t.account_id]?.name || '未知账户'
    const amount = t.amount.toFixed(2)
    const remark = t.remark || ''

    return `"${date}","${type}","${category}","${account}","${amount}","${remark}"`
  })

  // 添加BOM以支持中文
  return '\uFEFF' + headers.join(',') + '\n' + rows.join('\n')
}

/**
 * 格式化日期
 */
const formatDate = (dateStr: any) => {
  let date: Date
  if (dateStr && typeof dateStr === 'object' && dateStr.$date) {
    date = new Date(dateStr.$date)
  } else {
    date = new Date(dateStr)
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取账户映射
 */
const getAccountsMap = async () => {
  try {
    // @ts-ignore
    const result = await uniCloud.callFunction({
      name: 'account',
      data: {
        action: 'list',
        openid: userStore.openid
      }
    })
    if (result.result.code === 0) {
      const accounts = result.result.data || []
      const map: Record<string, any> = {}
      accounts.forEach((acc: any) => {
        map[acc._id] = acc
      })
      return map
    }
  } catch (error) {
    console.error('获取账户列表失败：', error)
  }
  return {}
}

/**
 * 获取分类映射
 */
const getCategoriesMap = async () => {
  try {
    // @ts-ignore
    const result = await uniCloud.callFunction({
      name: 'category',
      data: {
        action: 'list',
        data: {},
        openid: userStore.openid
      }
    })
    if (result.result.code === 0) {
      const categories = result.result.data || []
      const map: Record<string, any> = {}
      categories.forEach((cat: any) => {
        map[cat._id] = cat
      })
      return map
    }
  } catch (error) {
    console.error('获取分类列表失败：', error)
  }
  return {}
}

/**
 * 导入数据
 */
const importData = () => {
  if (isGuest.value) {
    // @ts-ignore
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  if (isImporting.value) return

  // 使用 fallback 模式，兼容不同环境
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

  // 选择文件
  chooseMessageFile({
    count: 1,
    type: 'file',
    success: (res: any) => {
      if (res.tempFiles && res.tempFiles.length > 0) {
        const file = res.tempFiles[0]
        const fileName = file.name || ''

        // 验证文件扩展名
        if (fileName.endsWith('.csv')) {
          // 使用 fallback 获取文件路径
          const filePath = file.path || file.tempFilePath || file.filePath
          if (filePath) {
            parseAndImportCSV(filePath)
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
            title: '请选择CSV文件',
            icon: 'none'
          })
        }
      }
    },
    fail: (err: any) => {
      // 用户取消选择文件，不显示错误提示
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
 * 解析并导入CSV
 */
const parseAndImportCSV = (filePath: string) => {
  isImporting.value = true
  // @ts-ignore
  uni.showLoading({ title: '导入中...' })

  // @ts-ignore
  const fs = uni.getFileSystemManager()

  fs.readFile({
    filePath: filePath,
    encoding: 'utf-8',
    success: async (res: any) => {
      try {
        const content = res.data
        const lines = content.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
          throw new Error('CSV文件格式错误')
        }

        // 解析表头
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

        // 解析数据行
        const transactions = []
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          // 简单的CSV解析（处理引号内的逗号）
          const matches = line.match(/("([^"]*)"|[^,]+)/g)
          if (matches) {
            const values = matches.map(v => v.replace(/"/g, '').trim())

            // 映射到交易数据
            const transaction = {
              date: values[0] || '',
              type: values[1] || '',
              category: values[2] || '',
              account: values[3] || '',
              amount: parseFloat(values[4]) || 0,
              remark: values[5] || ''
            }

            transactions.push(transaction)
          }
        }

        console.log('解析到交易记录：', transactions.length)

        // 获取账户和分类映射
        const accountsMap = await getAccountsMap()
        const categoriesMap = await getCategoriesMap()

        // 导入到数据库
        let successCount = 0
        let failCount = 0

        for (const trans of transactions) {
          try {
            // 查找账户ID
            const account = Object.values(accountsMap).find((a: any) => a.name === trans.account)
            if (!account) {
              console.log('未找到账户：', trans.account)
              failCount++
              continue
            }

            // 查找分类ID
            const category = Object.values(categoriesMap).find((c: any) => c.name === trans.category)
            if (!category) {
              console.log('未找到分类：', trans.category)
              failCount++
              continue
            }

            // 转换类型
            let type = 'expense'
            if (trans.type === '收入') type = 'income'
            else if (trans.type === '支出') type = 'expense'

            // 调用云函数创建交易
            // @ts-ignore
            const result = await uniCloud.callFunction({
              name: 'transaction',
              data: {
                action: 'create',
                openid: userStore.openid,
                account_id: account._id,
                category_id: category._id,
                type: type,
                amount: trans.amount,
                remark: trans.remark,
                transaction_date: trans.date
              }
            })

            if (result.result.code === 0) {
              successCount++
            } else {
              console.log('导入失败：', result.result.message)
              failCount++
            }
          } catch (error) {
            console.error('导入交易失败：', error)
            failCount++
          }
        }

        // @ts-ignore
        uni.hideLoading()

        // @ts-ignore
        uni.showModal({
          title: '导入完成',
          content: `成功导入 ${successCount} 条，失败 ${failCount} 条`,
          showCancel: false
        })
      } catch (error) {
        // @ts-ignore
        uni.hideLoading()
        console.error('解析CSV失败：', error)
        // @ts-ignore
        uni.showToast({
          title: '解析失败',
          icon: 'none'
        })
      } finally {
        isImporting.value = false
      }
    },
    fail: (err: any) => {
      // @ts-ignore
      uni.hideLoading()
      console.error('读取文件失败：', err)
      // @ts-ignore
      uni.showToast({
        title: '读取失败',
        icon: 'none'
      })
      isImporting.value = false
    }
  })
}

/**
 * 清除缓存
 */
const clearCache = () => {
  // @ts-ignore
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: (res: any) => {
      if (res.confirm) {
        try {
          // @ts-ignore
          uni.clearStorageSync()
          // @ts-ignore
          uni.showToast({
            title: '缓存已清除',
            icon: 'success'
          })
        } catch (error) {
          // @ts-ignore
          uni.showToast({
            title: '清除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

/**
 * 退出登录
 */
const handleLogout = () => {
  // @ts-ignore
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？退出后可以继续使用游客模式浏览',
    success: (res: any) => {
      if (res.confirm) {
        // 使用 userStore 的 logout 方法
        userStore.logout()

        // @ts-ignore
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        })

        // 重载页面
        setTimeout(() => {
          // @ts-ignore
          uni.reLaunch({
            url: '/pages/index/index'
          })
        }, 500)
      }
    }
  })
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 40rpx;
}

/* 设置区域 */
.settings-section {
  background: #ffffff;
  margin: 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.section-title {
  padding: 30rpx 30rpx 20rpx;
  font-size: 28rpx;
  color: #999999;
}

.settings-list {
  padding: 0 30rpx;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.settings-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.item-icon {
  font-size: 40rpx;
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  border-radius: 50%;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
}

.item-name {
  font-size: 30rpx;
  color: #333333;
}

.item-desc {
  font-size: 24rpx;
  color: #999999;
}

.item-arrow {
  font-size: 40rpx;
  color: #cccccc;
}

/* 退出登录 */
.logout-section {
  padding: 0 30rpx;
  margin-top: 30rpx;
}

.logout-btn {
  width: 100%;
  height: 80rpx;
  background: #ffffff;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.logout-text {
  font-size: 30rpx;
  color: #ff6b6b;
}
</style>
