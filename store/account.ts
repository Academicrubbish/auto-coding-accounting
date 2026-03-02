import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', {
  state: () => ({
    accounts: [] as any[],
    defaultAccountId: ''
  }),

  getters: {
    defaultAccount: (state) => {
      return state.accounts.find((a: any) => a._id === state.defaultAccountId) || state.accounts[0]
    },
    totalBalance: (state) => {
      return state.accounts.reduce((sum: number, a: any) => sum + (a.balance || 0), 0)
    }
  },

  actions: {
    setAccounts(accounts: any[]) {
      this.accounts = accounts
    },
    setDefaultAccountId(id: string) {
      this.defaultAccountId = id
    },
    addAccount(account: any) {
      this.accounts.push(account)
    },
    updateAccount(id: string, data: any) {
      const index = this.accounts.findIndex((a: any) => a._id === id)
      if (index !== -1) {
        this.accounts[index] = { ...this.accounts[index], ...data }
      }
    },
    deleteAccount(id: string) {
      this.accounts = this.accounts.filter((a: any) => a._id !== id)
    }
  }
})
