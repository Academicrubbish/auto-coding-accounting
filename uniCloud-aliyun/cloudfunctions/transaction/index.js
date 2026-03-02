'use strict';

/**
 * 交易记录云函数
 * 功能：交易记录的增删改查
 * 特性：自动更新账户余额
 */

const checkAuth = require('../common/check-auth');

exports.main = async (event, context) => {
  const { action, data } = event;
  const { OPENID } = context;

  const db = uniCloud.database();
  const collection = db.collection('transactions');
  const accountCollection = db.collection('accounts');

  try {
    switch (action) {
      case 'list':
        return await listTransactions(collection, OPENID, data);
      case 'create':
        return await createTransaction(collection, accountCollection, OPENID, data);
      case 'update':
        return await updateTransaction(collection, accountCollection, OPENID, data);
      case 'delete':
        return await deleteTransaction(collection, accountCollection, OPENID, data);
      case 'getById':
        return await getTransactionById(collection, OPENID, data);
      default:
        return {
          code: -1,
          message: '未知的操作类型',
          data: null
        };
    }
  } catch (error) {
    console.error('交易云函数错误：', error);
    return {
      code: -1,
      message: '操作失败：' + error.message,
      data: null
    };
  }
};

/**
 * 获取交易列表
 * 支持分页、筛选、搜索
 * 需要登录
 */
async function listTransactions(collection, openid, data) {
  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  const {
    page = 1,
    pageSize = 20,
    type,
    account_id,
    category_id,
    start_date,
    end_date,
    keyword
  } = data || {};

  // 构建查询条件
  let whereCondition = { user_id: openid };

  // 类型筛选
  if (type && (type === 'expense' || type === 'income' || type === 'transfer')) {
    whereCondition.type = type;
  }

  // 账户筛选
  if (account_id) {
    whereCondition.account_id = account_id;
  }

  // 分类筛选
  if (category_id) {
    whereCondition.category_id = category_id;
  }

  // 日期范围筛选
  if (start_date || end_date) {
    whereCondition.transaction_date = {};
    if (start_date) {
      whereCondition.transaction_date.$gte = new Date(start_date);
    }
    if (end_date) {
      whereCondition.transaction_date.$lte = new Date(end_date + ' 23:59:59');
    }
  }

  // 关键词搜索（备注）
  if (keyword) {
    whereCondition.remark = new RegExp(keyword, 'i');
  }

  // 计算分页
  const skip = (page - 1) * pageSize;

  // 查询总数
  const countResult = await collection.where(whereCondition).count();
  const total = countResult.total;

  // 查询数据
  const res = await collection.where(whereCondition)
    .orderBy('transaction_date', 'desc')
    .orderBy('created_at', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get();

  return {
    code: 0,
    message: '获取成功',
    data: {
      list: res.data,
      total: total,
      page: page,
      pageSize: pageSize,
      hasMore: skip + res.data.length < total
    }
  };
}

/**
 * 获取单条交易详情
 */
async function getTransactionById(collection, openid, data) {
  const { _id } = data;

  // 验证参数
  const paramsError = checkAuth.validateParams(data, ['_id']);
  if (paramsError) return paramsError;

  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  const res = await collection.doc(_id).get();

  if (res.data.length === 0) {
    return {
      code: -1,
      message: '交易不存在',
      data: null
    };
  }

  const transaction = res.data[0];

  // 权限验证
  const ownershipError = checkAuth.checkOwnership(res.data, openid);
  if (ownershipError) return ownershipError;

  return {
    code: 0,
    message: '获取成功',
    data: transaction
  };
}

/**
 * 创建交易
 * 自动更新账户余额
 */
async function createTransaction(collection, accountCollection, openid, data) {
  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  // 验证必填参数
  const paramsError = checkAuth.validateParams(data, ['account_id', 'category_id', 'type', 'amount']);
  if (paramsError) return paramsError;

  const { account_id, category_id, type, amount, remark, images, transaction_date } = data;

  // 验证交易类型
  const typeError = checkAuth.validateTransactionType(type);
  if (typeError) return typeError;

  // 验证金额
  const amountError = checkAuth.validateAmount(amount);
  if (amountError) return amountError;

  // 验证账户所有权
  const accountError = await checkAuth.checkAccountOwnership(accountCollection, account_id, openid);
  if (accountError) return accountError;

  const accountRes = await accountCollection.doc(account_id).get();
  const account = accountRes.data[0];

  // 验证分类可用性
  const categoryCollection = uniCloud.database().collection('categories');
  const categoryError = await checkAuth.checkCategoryAvailable(categoryCollection, category_id, openid);
  if (categoryError) return categoryError;

  // 计算账户余额变化
  let balanceChange = 0;
  if (type === 'income') {
    balanceChange = parseFloat(amount);
  } else if (type === 'expense') {
    balanceChange = -parseFloat(amount);
  }

  // 创建交易记录
  const createData = {
    user_id: openid,
    account_id: account_id,
    category_id: category_id,
    type: type,
    amount: parseFloat(amount),
    remark: remark || '',
    images: images || [],
    transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
    created_at: new Date(),
    updated_at: new Date()
  };

  const createRes = await collection.add(createData);

  // 更新账户余额
  await accountCollection.doc(account_id).update({
    balance: account.balance + balanceChange,
    updated_at: new Date()
  });

  return {
    code: 0,
    message: '创建成功',
    data: {
      _id: createRes.id,
      ...createData
    }
  };
}

/**
 * 更新交易
 * 重新计算账户余额（需要回退原交易对余额的影响，再应用新交易）
 */
async function updateTransaction(collection, accountCollection, openid, data) {
  const { _id, account_id, category_id, type, amount, remark, images, transaction_date } = data;

  // 验证参数
  const paramsError = checkAuth.validateParams(data, ['_id']);
  if (paramsError) return paramsError;

  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  // 获取原交易记录
  const oldRes = await collection.doc(_id).get();
  if (oldRes.data.length === 0) {
    return {
      code: -1,
      message: '交易不存在',
      data: null
    };
  }
  const oldTransaction = oldRes.data[0];

  // 权限验证
  const ownershipError = checkAuth.checkOwnership(oldRes.data, openid);
  if (ownershipError) return ownershipError;

  // 解析新数据
  const newAccountId = account_id !== undefined ? account_id : oldTransaction.account_id;
  const newType = type !== undefined ? type : oldTransaction.type;
  const newAmount = amount !== undefined ? parseFloat(amount) : oldTransaction.amount;

  // 验证新数据
  if (type !== undefined) {
    const typeError = checkAuth.validateTransactionType(newType);
    if (typeError) return typeError;
  }

  if (amount !== undefined) {
    const amountError = checkAuth.validateAmount(newAmount);
    if (amountError) return amountError;
  }

  // 计算原账户余额变化（回退）
  let oldBalanceChange = 0;
  if (oldTransaction.type === 'income') {
    oldBalanceChange = -oldTransaction.amount;
  } else if (oldTransaction.type === 'expense') {
    oldBalanceChange = oldTransaction.amount;
  }

  // 计算新账户余额变化
  let newBalanceChange = 0;
  if (newType === 'income') {
    newBalanceChange = newAmount;
  } else if (newType === 'expense') {
    newBalanceChange = -newAmount;
  }

  // 构建更新数据
  const updateData = {
    updated_at: new Date()
  };

  if (account_id !== undefined) updateData.account_id = account_id;
  if (category_id !== undefined) updateData.category_id = category_id;
  if (type !== undefined) updateData.type = type;
  if (amount !== undefined) updateData.amount = newAmount;
  if (remark !== undefined) updateData.remark = remark;
  if (images !== undefined) updateData.images = images;
  if (transaction_date !== undefined) updateData.transaction_date = new Date(transaction_date);

  // 更新交易记录
  await collection.doc(_id).update(updateData);

  // 更新账户余额
  const db = uniCloud.database();
  if (newAccountId === oldTransaction.account_id) {
    // 同一账户：应用余额差值
    const netChange = oldBalanceChange + newBalanceChange;
    await accountCollection.doc(newAccountId).update({
      balance: db.command.inc(netChange),
      updated_at: new Date()
    });
  } else {
    // 不同账户：回退原账户余额，更新新账户余额
    await accountCollection.doc(oldTransaction.account_id).update({
      balance: db.command.inc(oldBalanceChange),
      updated_at: new Date()
    });

    const newAccountRes = await accountCollection.doc(newAccountId).get();
    const newAccount = newAccountRes.data[0];
    await accountCollection.doc(newAccountId).update({
      balance: newAccount.balance + newBalanceChange,
      updated_at: new Date()
    });
  }

  return {
    code: 0,
    message: '更新成功',
    data: {
      _id: _id,
      ...updateData
    }
  };
}

/**
 * 删除交易
 * 恢复账户余额
 */
async function deleteTransaction(collection, accountCollection, openid, data) {
  const { _id } = data;

  // 验证参数
  const paramsError = checkAuth.validateParams(data, ['_id']);
  if (paramsError) return paramsError;

  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  // 获取交易记录
  const res = await collection.doc(_id).get();
  if (res.data.length === 0) {
    return {
      code: -1,
      message: '交易不存在',
      data: null
    };
  }
  const transaction = res.data[0];

  // 权限验证
  const ownershipError = checkAuth.checkOwnership(res.data, openid);
  if (ownershipError) return ownershipError;

  // 计算余额恢复值
  let balanceRestore = 0;
  if (transaction.type === 'income') {
    balanceRestore = -transaction.amount;
  } else if (transaction.type === 'expense') {
    balanceRestore = transaction.amount;
  }

  // 获取账户信息
  const accountRes = await accountCollection.doc(transaction.account_id).get();
  const account = accountRes.data[0];

  // 删除交易记录
  await collection.doc(_id).remove();

  // 恢复账户余额
  await accountCollection.doc(transaction.account_id).update({
    balance: account.balance + balanceRestore,
    updated_at: new Date()
  });

  return {
    code: 0,
    message: '删除成功',
    data: {
      _id: _id
    }
  };
}
