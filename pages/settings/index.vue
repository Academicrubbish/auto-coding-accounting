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
 * 将 ArrayBuffer 转换为 Base64 字符串
 * 兼容微信小程序环境（没有 btoa）
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

    // 处理填充
    if (i > len) {
      result = result.substring(0, result.length - ((i - len) + 1)) + '='.repeat((i - len) + 1)
    }
  }

  return result
}

/**
 * 解析并导入CSV
 * CSV格式: 日期、收支类型、类别、账户、金额、备注
 * 日期格式: YYYY/MM/DD
 * 收支类型: 收入 / 支出
 */
const parseAndImportCSV = (filePath: string) => {
  isImporting.value = true
  // @ts-ignore
  uni.showLoading({ title: '导入中...' })

  // @ts-ignore
  const fs = uni.getFileSystemManager()

  // 先以 binary 编码读取，然后通过云函数进行编码检测和转换
  fs.readFile({
    filePath: filePath,
    encoding: 'binary',
    success: async (res: any) => {
      try {
        // 在微信小程序中，binary 编码返回的是字符串，需要转换为 Uint8Array
        const binaryString = res.data
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const base64Content = arrayBufferToBase64(bytes.buffer)

        // 调用云函数进行编码检测和转换
        // @ts-ignore
        const encodeResult = await uniCloud.callFunction({
          name: 'encoding',
          data: {
            action: 'convert',
            data: {
              content: base64Content,
              encoding: 'auto'
            }
          }
        })

        if (encodeResult.result.code !== 0) {
          throw new Error(encodeResult.result.message || '编码转换失败')
        }

        const { content, detectedEncoding, converted } = encodeResult.result.data
        console.log('检测到文件编码：', detectedEncoding, '是否转换：', converted)

        const lines = content.split('\n').filter((line: string) => line.trim())

        if (lines.length < 2) {
          throw new Error('CSV文件格式错误')
        }

        // 解析数据行（跳过表头）
        const transactions = []
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          // CSV解析（处理引号内的逗号）
          const matches = line.match(/("([^"]*)"|[^,]+)/g)
          if (matches) {
            const values = matches.map((v: string) => v.replace(/"/g, '').trim())

            // CSV列顺序: 日期、收支类型、类别、账户、金额、备注
            const dateStr = values[0] || ''
            const typeText = values[1] || ''
            const categoryName = values[2] || ''
            const accountName = values[3] || ''
            const amountStr = values[4] || '0'
            const remark = values[5] || ''

            // 转换日期格式，支持多种格式
            let formattedDate = dateStr

            // 格式1: YYYY年MM月DD日 (shayujizhang.csv 格式)
            const chineseDateMatch = dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日/)
            if (chineseDateMatch) {
              const year = chineseDateMatch[1]
              const month = chineseDateMatch[2].padStart(2, '0')
              const day = chineseDateMatch[3].padStart(2, '0')
              formattedDate = `${year}-${month}-${day}`
            }
            // 格式2: YYYY/MM/DD
            else if (dateStr.includes('/')) {
              const parts = dateStr.split('/')
              if (parts.length === 3) {
                const year = parts[0]
                const month = parts[1].padStart(2, '0')
                const day = parts[2].padStart(2, '0')
                formattedDate = `${year}-${month}-${day}`
              }
            }
            // 格式3: YYYY-MM-DD (已经是标准格式)
            else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
              const parts = dateStr.split('-')
              const year = parts[0]
              const month = parts[1].padStart(2, '0')
              const day = parts[2].padStart(2, '0')
              formattedDate = `${year}-${month}-${day}`
            }

            // 验证日期格式是否有效
            const dateTest = new Date(formattedDate)
            if (isNaN(dateTest.getTime())) {
              console.log('跳过无效日期的记录：', dateStr)
              continue
            }

            transactions.push({
              date: formattedDate,
              type: typeText,
              category: categoryName,
              account: accountName,
              amount: parseFloat(amountStr) || 0,
              remark: remark
            })
          }
        }

        console.log('解析到交易记录：', transactions.length)

        // 获取账户和分类映射
        const accountsMap = await getAccountsMap()
        const categoriesMap = await getCategoriesMap()

        // 获取默认账户
        const accountsList = Object.values(accountsMap)
        const defaultAccount = accountsList.find((a: any) => a.is_default) || accountsList[0]

        // 获取"其他"分类
        const categoriesList = Object.values(categoriesMap)
        const getOtherCategory = (type: string) => {
          return categoriesList.find((c: any) => c.name === '其他' && c.type === type)
        }

        // 导入到数据库
        let successCount = 0
        let failCount = 0

        for (const trans of transactions) {
          try {
            // 转换收支类型
            let type = 'expense'
            if (trans.type === '收入') type = 'income'
            else if (trans.type === '支出') type = 'expense'

            // 查找账户（全字匹配 ===）
            const account = accountsList.find((a: any) => a.name === trans.account) || defaultAccount
            if (!account) {
              console.log('未找到账户且无默认账户：', trans.account)
              failCount++
              continue
            }

            // 查找分类（全字匹配 ===）
            let category = categoriesList.find((c: any) => c.name === trans.category && c.type === type)
            if (!category) {
              console.log('未找到分类，使用"其他"：', trans.category)
              category = getOtherCategory(type)
              if (!category) {
                console.log('没有可用的"其他"分类，跳过')
                failCount++
                continue
              }
            }

            // 调用云函数创建交易
            // @ts-ignore
            const result = await uniCloud.callFunction({
              name: 'transaction',
              data: {
                action: 'create',
                openid: userStore.openid,
                data: {
                  account_id: account._id,
                  category_id: category._id,
                  type: type,
                  amount: trans.amount,
                  remark: trans.remark,
                  transaction_date: trans.date
                }
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
      } catch (error: any) {
        // @ts-ignore
        uni.hideLoading()
        console.error('解析CSV失败：', error)

        // 显示详细的错误信息
        const errorMsg = error?.message || '解析失败'
        // @ts-ignore
        uni.showModal({
          title: '导入失败',
          content: errorMsg,
          showCancel: false
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
