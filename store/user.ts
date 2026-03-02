import { defineStore } from 'pinia'

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
      if (wasGuest === true && isGuest === false) {
        this.authStateVersion += 1
      }
    },
    async RestoreFromCache() {
      try {
        // @ts-ignore
        const cachedOpenid = uni.getStorageSync('openid')
        if (cachedOpenid) {
          this.setOpenid(cachedOpenid)
          this.setIsGuest(false)
          return true
        }
      } catch (e) {
        console.error('恢复登录状态失败', e)
      }
      return false
    }
  }
})
