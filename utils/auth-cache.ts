/**
 * 用户认证缓存工具
 * 实现类似 Web 端 token 缓存的功能，一段时间内不需要用户反复登录
 */

const CACHE_KEY = 'user_auth_cache'
const DEFAULT_EXPIRE_DAYS = 7 // 默认缓存 7 天

interface AuthCache {
  openid: string
  userData?: any
  expireTime: number
  createTime: number
}

/**
 * 获取缓存数据
 */
export function getAuthCache(): AuthCache | null {
  try {
    // @ts-ignore
    const cacheStr = uni.getStorageSync(CACHE_KEY)
    if (!cacheStr) {
      return null
    }
    const cache = JSON.parse(cacheStr) as AuthCache
    return cache
  } catch (e) {
    return null
  }
}

/**
 * 保存认证缓存（永久有效，除非用户退出登录）
 * @param openid 用户 openid
 * @param userData 用户数据
 */
export function setAuthCache(openid: string, userData?: any): boolean {
  try {
    const cache: AuthCache = {
      openid: openid,
      userData: userData,
      // 不设置过期时间，永久有效
      expireTime: 0,
      createTime: Date.now()
    }
    // @ts-ignore
    uni.setStorageSync(CACHE_KEY, JSON.stringify(cache))
    return true
  } catch (e) {
    console.error('[Auth Cache] 保存失败:', e)
    return false
  }
}

/**
 * 清除认证缓存
 */
export function clearAuthCache(): boolean {
  try {
    // @ts-ignore
    uni.removeStorageSync(CACHE_KEY)
    return true
  } catch (e) {
    return false
  }
}

/**
 * 检查缓存是否有效（永久有效，除非用户退出登录）
 */
export function isAuthCacheValid(): boolean {
  const cache = getAuthCache()
  if (!cache || !cache.openid) {
    return false
  }

  // 不检查过期时间，只要存在就有效
  return true
}

/**
 * 从缓存获取 openid
 */
export function getOpenidFromCache(): string | null {
  if (!isAuthCacheValid()) {
    return null
  }

  const cache = getAuthCache()
  return cache ? cache.openid : null
}

/**
 * 从缓存获取用户数据
 */
export function getUserDataFromCache(): any | null {
  if (!isAuthCacheValid()) {
    return null
  }

  const cache = getAuthCache()
  return cache?.userData || null
}

/**
 * 获取缓存剩余有效时间（毫秒）
 */
export function getCacheRemainingTime(): number {
  const cache = getAuthCache()
  if (!cache || !cache.expireTime) {
    return 0
  }

  const now = Date.now()
  const remaining = cache.expireTime - now
  return remaining > 0 ? remaining : 0
}
