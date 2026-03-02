'use strict';

/**
 * 统计分析云函数
 * 功能：收支统计分析
 */

const checkAuth = require('../common/check-auth');

exports.main = async (event, context) => {
  const { action, data } = event;
  const { OPENID } = context;

  const db = uniCloud.database();
  const collection = db.collection('transactions');
  const command = db.command;

  try {
    switch (action) {
      case 'monthly':
        return await getMonthlyStatistics(collection, command, OPENID, data);
      case 'daily':
        return await getDailyStatistics(collection, command, OPENID, data);
      case 'category':
        return await getCategoryStatistics(collection, command, OPENID, data);
      case 'overview':
        return await getOverviewStatistics(collection, command, OPENID, data);
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

  // 计算月份起止日期
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // 查询该月的所有交易
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

  // 转换为数组并计算占比
  const categoryList = Object.values(categoryData).map(item => ({
    ...item,
    percentage: totalAmount > 0 ? (item.amount / totalAmount * 100).toFixed(2) : 0
  })).sort((a, b) => b.amount - a.amount);

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

  return {
    code: 0,
    message: '获取成功',
    data: {
      totalAssets: totalAssets,
      monthIncome: monthIncome,
      monthExpense: monthExpense,
      monthBalance: monthIncome - monthExpense,
      recentTransactions: recentRes.data
    }
  };
}
