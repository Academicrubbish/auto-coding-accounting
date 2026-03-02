import { defineStore } from 'pinia'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    expenseCategories: [] as any[],
    incomeCategories: [] as any[]
  }),

  getters: {
    getCategoriesByType: (state) => (type: 'expense' | 'income') => {
      return type === 'expense' ? state.expenseCategories : state.incomeCategories
    }
  },

  actions: {
    setExpenseCategories(categories: any[]) {
      this.expenseCategories = categories
    },
    setIncomeCategories(categories: any[]) {
      this.incomeCategories = categories
    },
    addCategory(category: any) {
      if (category.type === 'expense') {
        this.expenseCategories.push(category)
      } else {
        this.incomeCategories.push(category)
      }
    },
    updateCategory(id: string, data: any) {
      const list = data.type === 'expense' ? this.expenseCategories : this.incomeCategories
      const index = list.findIndex((c: any) => c._id === id)
      if (index !== -1) {
        list[index] = { ...list[index], ...data }
      }
    },
    deleteCategory(id: string, type: 'expense' | 'income') {
      if (type === 'expense') {
        this.expenseCategories = this.expenseCategories.filter((c: any) => c._id !== id)
      } else {
        this.incomeCategories = this.incomeCategories.filter((c: any) => c._id !== id)
      }
    }
  }
})
