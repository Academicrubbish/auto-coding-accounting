/**
 * 金额格式化工具函数
 */

/**
 * 格式化金额显示（带千分位）
 */
export const formatMoney = (amount: number): string => {
  if (isNaN(amount)) return '0.00'
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化金额为中文表示（收入/支出）
 */
export const formatAmount = (amount: number, type: 'expense' | 'income' = 'expense'): string => {
  const formatted = formatMoney(Math.abs(amount))
  if (type === 'expense') {
    return `-${formatted}`
  }
  return `+${formatted}`
}

/**
 * 解析金额字符串为数字
 */
export const parseMoney = (str: string): number => {
  return parseFloat(str.replace(/,/g, '')) || 0
}
