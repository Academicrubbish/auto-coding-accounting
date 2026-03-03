/**
 * uniCloud 云函数调用封装
 * 使用延迟初始化避免 uniCloud 未就绪问题
 * 自动附加用户 openid
 */
import { useUserStore } from '../store/user'

export const callCloudFunction = (name: string, data?: any) => {
  if (typeof uniCloud === 'undefined' || !uniCloud.callFunction) {
    return Promise.reject(new Error('uniCloud 未初始化'))
  }

  // 自动附加 openid（如果用户已登录）
  const requestData = data || {}
  if (name !== 'login') { // 登录接口不需要附加 openid
    try {
      // @ts-ignore
      const app = getApp()
      if (app?.globalData?.store) {
        const userStore = app.globalData.store._s.get(useUserStore)
        const openid = userStore.openid
        if (openid) {
          requestData.openid = openid
        }
      }
    } catch (e) {
      // 如果获取 store 失败，继续执行（可能是游客模式）
      console.warn('获取 openid 失败:', e)
    }
  }

  return uniCloud.callFunction({ name, data: requestData })
}

/**
 * 延迟初始化数据库连接
 */
export const getDb = () => {
  if (typeof uniCloud === 'undefined' || !uniCloud.database) {
    throw new Error('uniCloud 未初始化')
  }
  return uniCloud.database()
}

/**
 * 延迟初始化 collection
 */
export const getCollection = (name: string) => {
  return getDb().collection(name)
}
