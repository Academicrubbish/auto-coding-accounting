import { defineStore } from 'pinia'
import { getOpenidFromCache, getUserDataFromCache, isAuthCacheValid, clearAuthCache } from '@/utils/auth-cache'

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

        // 验证 openid 仍然有效（尝试获取用户信息）
        this.verifyUserInfo()
          .then((isValid) => {
            if (isValid) {
              // 验证成功，设置为已登录状态
              this.setIsGuest(false)
              resolve(true)
            } else {
              // 验证失败，清除缓存
              clearAuthCache()
              this.setOpenid('')
              this.setUserData({})
              this.setIsGuest(true)
              resolve(false)
            }
          })
          .catch(() => {
            // 验证出错，清除缓存
            clearAuthCache()
            this.setOpenid('')
            this.setUserData({})
            this.setIsGuest(true)
            resolve(false)
          })
      })
    },

    /**
     * 验证用户信息（通过云函数查询）
     */
    async verifyUserInfo(): Promise<boolean> {
      if (!this.openid) {
        return false
      }

      try {
        // @ts-ignore
        const res = await uniCloud.callFunction({
          name: 'login',
          data: {
            action: 'verify',
            openid: this.openid
          }
        })

        if (res.result && res.result.code === 0) {
          // 更新用户数据
          if (res.result.data.userData) {
            this.setUserData(res.result.data.userData)
          }
          return true
        }
        return false
      } catch (error) {
        console.error('验证用户信息失败', error)
        return false
      }
    }
  }
})
