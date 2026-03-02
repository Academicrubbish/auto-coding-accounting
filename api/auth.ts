/**
 * 认证相关 API
 */

import { callCloudFunction } from '@/utils/request'
import type { useUserStore } from '@/store/user'

/**
 * 微信登录
 */
export const login = (code: string) => {
  return callCloudFunction('login', { code })
}

/**
 * 检查登录状态
 */
export const isLoggedIn = (userStore: ReturnType<typeof useUserStore>) => {
  return !userStore.isGuest && !!userStore.openid
}

/**
 * 退出登录
 */
export const logout = () => {
  const { clearAuthCache } = require('@/utils/auth-cache')
  clearAuthCache()
  // @ts-ignore
  uni.reLaunch({ url: '/pages/index/index' })
}
