'use strict';

/**
 * 权限验证公共模块
 * 提供统一的权限验证函数，供所有云函数使用
 */

/**
 * 验证用户是否登录
 * @param {string} openid - 用户 openid
 * @returns {Object|null} 返回 null 表示验证通过，否则返回错误对象
 */
function checkLogin(openid) {
  if (!openid) {
    return {
      code: -1,
      message: '请先登录',
      data: null
    };
  }
  return null;
}

/**
 * 验证数据所有权
 * @param {Object} data - 数据记录
 * @param {string} openid - 用户 openid
 * @param {string} [userIdField='user_id'] - 用户ID字段名
 * @returns {Object|null} 返回 null 表示验证通过，否则返回错误对象
 */
function checkOwnership(data, openid, userIdField = 'user_id') {
  if (!data || data.length === 0) {
    return {
      code: -1,
      message: '数据不存在',
      data: null
    };
  }

  const record = Array.isArray(data) ? data[0] : data;

  if (record[userIdField] !== openid) {
    return {
      code: -1,
      message: '无权操作此数据',
      data: null
    };
  }

  return null;
}

/**
 * 验证是否可以操作系统默认数据
 * @param {Object} data - 数据记录
 * @param {string} operation - 操作类型：create, update, delete
 * @returns {Object|null} 返回 null 表示验证通过，否则返回错误对象
 */
function checkSystemData(data, operation = 'update') {
  if (!data || data.length === 0) {
    return {
      code: -1,
      message: '数据不存在',
      data: null
    };
  }

  const record = Array.isArray(data) ? data[0] : data;

  // 系统默认数据（create_by 为空字符串）不能被修改或删除
  if (record.create_by === '' && (operation === 'update' || operation === 'delete')) {
    const operationText = operation === 'update' ? '修改' : '删除';
    return {
      code: -1,
      message: `不能${operationText}系统默认数据`,
      data: null
    };
  }

  return null;
}

/**
 * 完整的数据操作权限验证
 * 验证：登录状态 + 数据所有权 + 系统数据保护
 * @param {string} openid - 用户 openid
 * @param {Object} data - 数据记录
 * @param {string} operation - 操作类型：create, update, delete
 * @param {string} [userIdField='user_id'] - 用户ID字段名
 * @returns {Object|null} 返回 null 表示验证通过，否则返回错误对象
 */
function checkPermission(openid, data, operation, userIdField = 'user_id') {
  // 1. 验证登录状态
  const loginError = checkLogin(openid);
  if (loginError) {
    return loginError;
  }

  // 2. 对于 update 和 delete 操作，验证所有权
  if (operation === 'update' || operation === 'delete') {
    const ownershipError = checkOwnership(data, openid, userIdField);
    if (ownershipError) {
      return ownershipError;
    }

    // 3. 验证系统数据保护
    const systemDataError = checkSystemData(data, operation);
    if (systemDataError) {
      return systemDataError;
    }
  }

  return null;
}

/**
 * 验证账户权限
 * @param {Object} collection - 数据库集合对象
 * @param {string} accountId - 账户 ID
 * @param {string} openid - 用户 openid
 * @param {string} operation - 操作类型：create, update, delete
 * @returns {Promise<Object|null>} 返回 null 表示验证通过，否则返回错误对象
 */
async function checkAccountPermission(collection, accountId, openid, operation) {
  const loginError = checkLogin(openid);
  if (loginError) {
    return loginError;
  }

  if (!accountId) {
    return {
      code: -1,
      message: '缺少账户ID',
      data: null
    };
  }

  const checkRes = await collection.doc(accountId).get();
  if (checkRes.data.length === 0) {
    return {
      code: -1,
      message: '账户不存在',
      data: null
    };
  }

  return checkPermission(openid, checkRes.data, operation);
}

/**
 * 验证分类权限
 * @param {Object} collection - 数据库集合对象
 * @param {string} categoryId - 分类 ID
 * @param {string} openid - 用户 openid
 * @param {string} operation - 操作类型：create, update, delete
 * @returns {Promise<Object|null>} 返回 null 表示验证通过，否则返回错误对象
 */
async function checkCategoryPermission(collection, categoryId, openid, operation) {
  const loginError = checkLogin(openid);
  if (loginError) {
    return loginError;
  }

  if (!categoryId) {
    return {
      code: -1,
      message: '缺少分类ID',
      data: null
    };
  }

  const checkRes = await collection.doc(categoryId).get();
  if (checkRes.data.length === 0) {
    return {
      code: -1,
      message: '分类不存在',
      data: null
    };
  }

  return checkPermission(openid, checkRes.data, operation);
}

/**
 * 验证交易权限
 * @param {Object} collection - 数据库集合对象
 * @param {string} transactionId - 交易 ID
 * @param {string} openid - 用户 openid
 * @param {string} operation - 操作类型：create, update, delete, get
 * @returns {Promise<Object|null>} 返回 null 表示验证通过，否则返回错误对象
 */
async function checkTransactionPermission(collection, transactionId, openid, operation) {
  const loginError = checkLogin(openid);
  if (loginError) {
    return loginError;
  }

  if (!transactionId) {
    return {
      code: -1,
      message: '缺少交易ID',
      data: null
    };
  }

  const checkRes = await collection.doc(transactionId).get();
  if (checkRes.data.length === 0) {
    return {
      code: -1,
      message: '交易不存在',
      data: null
    };
  }

  // 交易没有 create_by 系统数据概念，只验证所有权
  return checkPermission(openid, checkRes.data, operation);
}

/**
 * 验证账户是否属于当前用户（用于交易创建时验证）
 * @param {Object} collection - 数据库集合对象
 * @param {string} accountId - 账户 ID
 * @param {string} openid - 用户 openid
 * @returns {Promise<Object|null>} 返回 null 表示验证通过，否则返回错误对象
 */
async function checkAccountOwnership(collection, accountId, openid) {
  const accountRes = await collection.doc(accountId).get();
  if (accountRes.data.length === 0) {
    return {
      code: -1,
      message: '账户不存在',
      data: null
    };
  }

  return checkOwnership(accountRes.data, openid);
}

/**
 * 验证分类是否可用（属于用户或是系统默认）
 * @param {Object} collection - 数据库集合对象
 * @param {string} categoryId - 分类 ID
 * @param {string} openid - 用户 openid
 * @returns {Promise<Object|null>} 返回 null 表示验证通过，否则返回错误对象
 */
async function checkCategoryAvailable(collection, categoryId, openid) {
  const categoryRes = await collection.doc(categoryId).get();
  if (categoryRes.data.length === 0) {
    return {
      code: -1,
      message: '分类不存在',
      data: null
    };
  }

  const category = categoryRes.data[0];
  // 用户自己的分类或系统默认分类都可以使用
  if (category.user_id !== openid && category.create_by !== '') {
    return {
      code: -1,
      message: '无权使用此分类',
      data: null
    };
  }

  return null;
}

/**
 * 参数验证辅助函数
 * @param {Object} params - 参数对象 { key: value }
 * @param {Array<string>} requiredFields - 必填字段列表
 * @returns {Object|null} 返回 null 表示验证通过，否则返回错误对象
 */
function validateParams(params, requiredFields) {
  if (!params) {
    return {
      code: -1,
      message: '缺少参数',
      data: null
    };
  }

  for (const field of requiredFields) {
    if (params[field] === undefined || params[field] === null || params[field] === '') {
      return {
        code: -1,
        message: `缺少必填参数（${field}）`,
        data: null
      };
    }
  }

  return null;
}

/**
 * 验证交易类型
 * @param {string} type - 交易类型
 * @returns {Object|null} 返回 null 表示验证通过，否则返回错误对象
 */
function validateTransactionType(type) {
  const validTypes = ['expense', 'income', 'transfer'];
  if (!validTypes.includes(type)) {
    return {
      code: -1,
      message: '无效的交易类型',
      data: null
    };
  }
  return null;
}

/**
 * 验证分类类型
 * @param {string} type - 分类类型
 * @returns {Object|null} 返回 null 表示验证通过，否则返回错误对象
 */
function validateCategoryType(type) {
  if (type !== 'expense' && type !== 'income') {
    return {
      code: -1,
      message: '无效的分类类型，必须是 expense 或 income',
      data: null
    };
  }
  return null;
}

/**
 * 验证账户类型
 * @param {string} type - 账户类型
 * @returns {Object|null} 返回 null 表示验证通过，否则返回错误对象
 */
function validateAccountType(type) {
  const validTypes = ['cash', 'bank', 'credit', 'other'];
  if (!validTypes.includes(type)) {
    return {
      code: -1,
      message: '无效的账户类型',
      data: null
    };
  }
  return null;
}

/**
 * 验证金额
 * @param {number} amount - 金额
 * @returns {Object|null} 返回 null 表示验证通过，否则返回错误对象
 */
function validateAmount(amount) {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    return {
      code: -1,
      message: '无效的金额',
      data: null
    };
  }
  return null;
}

module.exports = {
  // 基础验证
  checkLogin,
  checkOwnership,
  checkSystemData,
  checkPermission,

  // 特定资源权限验证
  checkAccountPermission,
  checkCategoryPermission,
  checkTransactionPermission,
  checkAccountOwnership,
  checkCategoryAvailable,

  // 参数和值验证
  validateParams,
  validateTransactionType,
  validateCategoryType,
  validateAccountType,
  validateAmount
};
