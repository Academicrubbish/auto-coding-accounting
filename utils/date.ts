/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 获取今天的日期字符串
 */
export const getToday = (): string => {
  return formatDate(new Date())
}

/**
 * 获取本周一的日期
 */
export const getMondayOfWeek = (): string => {
  const now = new Date()
  const day = now.getDay() || 7
  const diff = now.getDate() - day + 1
  const monday = new Date(now.setDate(diff))
  return formatDate(monday)
}

/**
 * 获取本月第一天
 */
export const getFirstDayOfMonth = (): string => {
  const now = new Date()
  return formatDate(new Date(now.getFullYear(), now.getMonth(), 1))
}

/**
 * 获取本月最后一天
 */
export const getLastDayOfMonth = (): string => {
  const now = new Date()
  return formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
}
