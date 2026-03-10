import { defineStore } from 'pinia'
import { getOpenidFromCache, getUserDataFromCache, isAuthCacheValid, clearAuthCache, setAuthCache } from '../utils/auth-cache'

export const useUserStore = defineStore('user', {
  state: () => ({
    openid: '',
    userData: {} as any,
    isGuest: true,
    authStateVersion: 0
  }),

  getters: {
    isLoggedIn: (state) => !state.isGuest && !!state.openid
  },

  actions: {
    setOpenid(openid: string) {
      this.openid = openid
    },
    setUserData(userData: any) {
      this.userData = userData
    },
    setIsGuest(isGuest: boolean) {
      const wasGuest = this.isGuest
      this.isGuest = isGuest
      // 从游客变为已登录，递增版本号
      if (wasGuest === true && isGuest === false) {
        this.authStateVersion += 1
      }
      // 从已登录变为游客，清除缓存
      if (wasGuest === false && isGuest === true) {
        clearAuthCache()
      }
    },

    /**
     * 从缓存恢复登录状态
     * 返回 true 表示恢复成功，false 表示恢复失败
     * 注意：不再进行云函数验证，直接信任本地缓存
     */
    async RestoreFromCache(): Promise<boolean> {
      return new Promise((resolve) => {
        if (!isAuthCacheValid()) {
          resolve(false)
          return
        }

        const cachedOpenid = getOpenidFromCache()
        const cachedUserData = getUserDataFromCache()

        if (!cachedOpenid) {
          resolve(false)
          return
        }

        // 恢复 openid 和 userData 到 state
        this.setOpenid(cachedOpenid)
        if (cachedUserData) {
          this.setUserData(cachedUserData)
        }

        // 直接设置为已登录状态，不再进行云函数验证
        this.setIsGuest(false)
        resolve(true)
      })
    },

    /**
     * 退出登录
     */
    logout(): void {
      // 清除本地缓存
      clearAuthCache()
      // 清除 store 状态
      this.setOpenid('')
      this.setUserData({})
      this.setIsGuest(true)
    },

    /**
     * 验证用户信息（通过云函数查询）
     * 注意：此函数已废弃，保留用于可能的后续扩展
     */
    async verifyUserInfo(): Promise<boolean> {
      // 不再需要验证，直接返回 true
      return true
    }
  }
})
