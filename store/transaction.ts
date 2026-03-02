import { defineStore } from 'pinia'

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    transactions: [] as any[],
    filter: {
      startDate: '',
      endDate: '',
      categoryId: '',
      accountId: '',
      keyword: ''
    }
  }),

  getters: {
    filteredTransactions: (state) => {
      return state.transactions.filter((t: any) => {
        if (state.filter.categoryId && t.category_id !== state.filter.categoryId) return false
        if (state.filter.accountId && t.account_id !== state.filter.accountId) return false
        if (state.filter.keyword && !t.remark?.includes(state.filter.keyword)) return false
        return true
      })
    }
  },

  actions: {
    setTransactions(transactions: any[]) {
      this.transactions = transactions
    },
    addTransaction(transaction: any) {
      this.transactions.unshift(transaction)
    },
    updateTransaction(id: string, data: any) {
      const index = this.transactions.findIndex((t: any) => t._id === id)
      if (index !== -1) {
        this.transactions[index] = { ...this.transactions[index], ...data }
      }
    },
    deleteTransaction(id: string) {
      this.transactions = this.transactions.filter((t: any) => t._id !== id)
    },
    setFilter(filter: any) {
      this.filter = { ...this.filter, ...filter }
    }
  }
})
