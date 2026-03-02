/**
 * uniCloud 云函数调用封装
 * 使用延迟初始化避免 uniCloud 未就绪问题
 */

export const callCloudFunction = (name: string, data?: any) => {
  if (typeof uniCloud === 'undefined' || !uniCloud.callFunction) {
    return Promise.reject(new Error('uniCloud 未初始化'))
  }
  return uniCloud.callFunction({ name, data })
}

/**
 * 延迟初始化数据库连接
 */
export const getDb = () => {
  if (typeof uniCloud === 'undefined' || !uniCloud.database) {
    throw new Error('uniCloud 未初始化')
  }
  return uniCloud.database()
}

/**
 * 延迟初始化 collection
 */
export const getCollection = (name: string) => {
  return getDb().collection(name)
}
