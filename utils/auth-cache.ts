/**
 * 认证缓存管理
 * 用于管理 token 和 openid 的本地缓存
 */

const CACHE_KEY_OPENID = 'openid'
const CACHE_KEY_USER_DATA = 'user_data'
const CACHE_KEY_TIMESTAMP = 'auth_timestamp'
const CACHE_EXPIRE_TIME = 30 * 24 * 60 * 60 * 1000 // 30天

export const setAuthCache = (openid: string, userData?: any) => {
  try {
    // @ts-ignore
    uni.setStorageSync(CACHE_KEY_OPENID, openid)
    if (userData) {
      // @ts-ignore
      uni.setStorageSync(CACHE_KEY_USER_DATA, JSON.stringify(userData))
    }
    // @ts-ignore
    uni.setStorageSync(CACHE_KEY_TIMESTAMP, Date.now())
  } catch (e) {
    console.error('保存认证缓存失败', e)
  }
}

export const getOpenidFromCache = () => {
  try {
    // @ts-ignore
    return uni.getStorageSync(CACHE_KEY_OPENID) || ''
  } catch (e) {
    return ''
  }
}

export const getUserDataFromCache = () => {
  try {
    // @ts-ignore
    const data = uni.getStorageSync(CACHE_KEY_USER_DATA)
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}

export const clearAuthCache = () => {
  try {
    // @ts-ignore
    uni.removeStorageSync(CACHE_KEY_OPENID)
    // @ts-ignore
    uni.removeStorageSync(CACHE_KEY_USER_DATA)
    // @ts-ignore
    uni.removeStorageSync(CACHE_KEY_TIMESTAMP)
  } catch (e) {
    console.error('清除认证缓存失败', e)
  }
}

export const isAuthCacheValid = () => {
  try {
    // @ts-ignore
    const timestamp = uni.getStorageSync(CACHE_KEY_TIMESTAMP)
    if (!timestamp) return false
    return Date.now() - timestamp < CACHE_EXPIRE_TIME
  } catch (e) {
    return false
  }
}
