'use strict';

/**
 * 统计分析云函数
 * 功能：收支统计分析
 */

const checkAuth = require('check-auth');

exports.main = async (event, context) => {
  const { action, data, openid } = event;
  // 优先使用 context.OPENID（uni-id 认证），否则使用 event.openid（自定义认证）
  const userOpenid = context.OPENID || openid;

  const db = uniCloud.database();
  const collection = db.collection('transactions');
  const command = db.command;

  try {
    switch (action) {
      case 'monthly':
        return await getMonthlyStatistics(collection, command, userOpenid, data);
      case 'daily':
        return await getDailyStatistics(collection, command, userOpenid, data);
      case 'category':
        return await getCategoryStatistics(collection, command, userOpenid, data);
      case 'overview':
        return await getOverviewStatistics(collection, command, userOpenid, data);
      default:
        return {
          code: -1,
          message: '未知的操作类型',
          data: null
        };
    }
  } catch (error) {
    console.error('统计云函数错误：', error);
    return {
      code: -1,
      message: '操作失败：' + error.message,
      data: null
    };
  }
};

/**
 * 获取月度收支统计
 * 返回指定月份的收入、支出、结余
 */
async function getMonthlyStatistics(collection, command, openid, data) {
  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  // 验证参数
  const paramsError = checkAuth.validateParams(data, ['year', 'month']);
  if (paramsError) return paramsError;

  const { year, month } = data;

  // 计算月份起止日期 - 使用 Date 对象确保正确处理月份天数
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59); // month月0日 = month月最后一天

  // 使用数据库日期范围查询
  const res = await collection.where({
    user_id: openid,
    transaction_date: command.gte(startDate).and(command.lte(endDate))
  }).get();

  const transactions = res.data;

  // 计算总收入、总支出
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpense += t.amount;
    }
  });

  // 按日统计
  const dailyData = {};
  transactions.forEach(t => {
    const date = new Date(t.transaction_date);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { income: 0, expense: 0 };
    }

    if (t.type === 'income') {
      dailyData[dateKey].income += t.amount;
    } else if (t.type === 'expense') {
      dailyData[dateKey].expense += t.amount;
    }
  });

  // 转换为数组格式
  const dailyList = Object.keys(dailyData).map(date => ({
    date: date,
    ...dailyData[date]
  })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    code: 0,
    message: '获取成功',
    data: {
      year: year,
      month: month,
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      dailyList: dailyList
    }
  };
}

/**
 * 获取每日收支数据
 * 返回指定日期范围的每日收支
 */
async function getDailyStatistics(collection, command, openid, data) {
  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  // 验证参数
  const paramsError = checkAuth.validateParams(data, ['start_date', 'end_date']);
  if (paramsError) return paramsError;

  const { start_date, end_date } = data;

  const startDate = new Date(start_date);
  const endDate = new Date(end_date + ' 23:59:59');

  // 查询日期范围的交易
  const res = await collection.where({
    user_id: openid,
    transaction_date: command.gte(startDate).and(command.lte(endDate))
  }).orderBy('transaction_date', 'asc').get();

  const transactions = res.data;

  // 按日统计
  const dailyData = {};
  transactions.forEach(t => {
    const date = new Date(t.transaction_date);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        income: 0,
        expense: 0,
        count: 0
      };
    }

    if (t.type === 'income') {
      dailyData[dateKey].income += t.amount;
    } else if (t.type === 'expense') {
      dailyData[dateKey].expense += t.amount;
    }
    dailyData[dateKey].count++;
  });

  // 转换为数组并排序
  const dailyList = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

  return {
    code: 0,
    message: '获取成功',
    data: {
      dailyList: dailyList,
      totalDays: dailyList.length
    }
  };
}

/**
 * 获取分类占比统计
 * 返回指定时间范围内各分类的收支占比
 */
async function getCategoryStatistics(collection, command, openid, data) {
  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  // 验证参数
  const paramsError = checkAuth.validateParams(data, ['type']);
  if (paramsError) return paramsError;

  // 验证分类类型
  const typeError = checkAuth.validateCategoryType(data.type);
  if (typeError) return typeError;

  const { type, start_date, end_date } = data;

  // 构建查询条件
  let whereCondition = {
    user_id: openid,
    type: type
  };

  if (start_date || end_date) {
    const startDate = start_date ? new Date(start_date) : null;
    const endDate = end_date ? new Date(end_date + ' 23:59:59') : null;

    if (startDate && endDate) {
      whereCondition.transaction_date = command.gte(startDate).and(command.lte(endDate));
    } else if (startDate) {
      whereCondition.transaction_date = command.gte(startDate);
    } else if (endDate) {
      whereCondition.transaction_date = command.lte(endDate);
    }
  }

  // 查询交易记录
  const res = await collection.where(whereCondition).get();

  const transactions = res.data;

  // 按分类统计
  const categoryData = {};
  let totalAmount = 0;

  transactions.forEach(t => {
    const categoryId = t.category_id;
    if (!categoryData[categoryId]) {
      categoryData[categoryId] = {
        category_id: categoryId,
        amount: 0,
        count: 0
      };
    }
    categoryData[categoryId].amount += t.amount;
    categoryData[categoryId].count++;
    totalAmount += t.amount;
  });

  // 获取分类信息
  const categoryIds = Object.keys(categoryData);
  const db = uniCloud.database();
  const categoryCollection = db.collection('categories');
  const categoriesRes = await categoryCollection.where({
    _id: command.in(categoryIds)
  }).get();

  const categoriesMap = {};
  categoriesRes.data.forEach(cat => {
    categoriesMap[cat._id] = cat;
  });

  // 转换为数组并计算占比，同时添加分类名称和图标
  const categoryList = Object.values(categoryData).map(item => {
    const category = categoriesMap[item.category_id];
    return {
      ...item,
      categoryName: category ? category.name : '未分类',
      categoryIcon: category ? category.icon : '',
      categoryColor: category ? category.color : '#667eea',
      percentage: totalAmount > 0 ? (item.amount / totalAmount * 100).toFixed(2) : 0
    };
  }).sort((a, b) => b.amount - a.amount);

  return {
    code: 0,
    message: '获取成功',
    data: {
      type: type,
      totalAmount: totalAmount,
      categoryList: categoryList
    }
  };
}

/**
 * 获取概览统计
 * 返回总资产、本月收支、近期交易
 */
async function getOverviewStatistics(collection, command, openid, data) {
  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 获取本月起止日期
  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  // 查询本月交易
  const monthRes = await collection.where({
    user_id: openid,
    transaction_date: command.gte(monthStart).and(command.lte(monthEnd))
  }).get();

  // 计算本月收支
  let monthIncome = 0;
  let monthExpense = 0;

  monthRes.data.forEach(t => {
    if (t.type === 'income') {
      monthIncome += t.amount;
    } else if (t.type === 'expense') {
      monthExpense += t.amount;
    }
  });

  // 获取总资产（从所有账户余额计算）
  const db = uniCloud.database();
  const accountCollection = db.collection('accounts');
  const accountRes = await accountCollection.where({
    user_id: openid
  }).get();

  let totalAssets = 0;
  accountRes.data.forEach(account => {
    totalAssets += account.balance;
  });

  // 获取最近5条交易
  const recentRes = await collection.where({
    user_id: openid
  }).orderBy('transaction_date', 'desc')
    .orderBy('created_at', 'desc')
    .limit(5)
    .get();

  // 关联查询账户和分类信息
  const categoryCollection = db.collection('categories');

  // 获取所有相关的账户ID和分类ID
  const accountIds = [...new Set(recentRes.data.map(t => t.account_id).filter(id => id))];
  const categoryIds = [...new Set(recentRes.data.map(t => t.category_id).filter(id => id))];

  // 批量查询账户和分类
  let accountsMap = {};
  let categoriesMap = {};

  if (accountIds.length > 0) {
    const accountsRes = await accountCollection.where({
      _id: command.in(accountIds)
    }).get();
    accountsRes.data.forEach(acc => {
      accountsMap[acc._id] = acc;
    });
  }

  if (categoryIds.length > 0) {
    const categoriesRes = await categoryCollection.where({
      _id: command.in(categoryIds)
    }).get();
    categoriesRes.data.forEach(cat => {
      categoriesMap[cat._id] = cat;
    });
  }

  // 合并数据
  const recentTransactions = recentRes.data.map(t => {
    const account = accountsMap[t.account_id];
    const category = categoriesMap[t.category_id];
    return {
      ...t,
      accountName: account ? account.name : '未知账户',
      accountIcon: account ? account.icon : '',
      categoryName: category ? category.name : '未分类',
      categoryIcon: category ? category.icon : ''
    };
  });

  return {
    code: 0,
    message: '获取成功',
    data: {
      totalAssets: totalAssets,
      monthIncome: monthIncome,
      monthExpense: monthExpense,
      monthBalance: monthIncome - monthExpense,
      recentTransactions: recentTransactions
    }
  };
}
