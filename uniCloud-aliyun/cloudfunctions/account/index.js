'use strict';

/**
 * 账户管理云函数
 * 功能：账户的增删改查
 * 需要登录才能使用
 */

const checkAuth = require('check-auth');

exports.main = async (event, context) => {
  const { action, data, openid } = event;
  // 优先使用 context.OPENID（uni-id 认证），否则使用 event.openid（自定义认证）
  const userOpenid = context.OPENID || openid;

  const db = uniCloud.database();
  const collection = db.collection('accounts');

  try {
    switch (action) {
      case 'list':
        return await listAccounts(collection, userOpenid);
      case 'create':
        return await createAccount(collection, userOpenid, data);
      case 'update':
        return await updateAccount(collection, userOpenid, data);
      case 'delete':
        return await deleteAccount(collection, userOpenid, data);
      default:
        return {
          code: -1,
          message: '未知的操作类型',
          data: null
        };
    }
  } catch (error) {
    console.error('账户云函数错误：', error);
    return {
      code: -1,
      message: '操作失败：' + error.message,
      data: null
    };
  }
};

/**
 * 获取账户列表
 * 需要登录，只返回用户自己的账户
 */
async function listAccounts(collection, openid) {
  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  const res = await collection.where({
    user_id: openid
  }).orderBy('sort_order', 'asc').get();

  return {
    code: 0,
    message: '获取成功',
    data: res.data
  };
}

/**
 * 创建账户
 * 需要登录
 * 自动设置 create_by 为用户 openid
 */
async function createAccount(collection, openid, data) {
  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  // 验证必填参数
  const paramsError = checkAuth.validateParams(data, ['name', 'type', 'balance']);
  if (paramsError) return paramsError;

  // 验证账户类型
  const typeError = checkAuth.validateAccountType(data.type);
  if (typeError) return typeError;

  const { name, type, balance, icon, sort_order, is_default } = data;

  const createData = {
    user_id: openid,
    name: name,
    type: type,
    balance: parseFloat(balance) || 0,
    icon: icon || '',
    sort_order: sort_order || 0,
    is_default: is_default || false,
    create_by: openid,
    created_at: new Date(),
    updated_at: new Date()
  };

  const res = await collection.add(createData);

  return {
    code: 0,
    message: '创建成功',
    data: {
      _id: res.id,
      ...createData
    }
  };
}

/**
 * 更新账户
 * 只能更新自己创建的账户
 * 支持余额调整
 */
async function updateAccount(collection, openid, data) {
  const { _id, name, type, balance, icon, sort_order, is_default } = data;

  // 验证登录和权限
  const permissionError = await checkAuth.checkAccountPermission(collection, _id, openid, 'update');
  if (permissionError) return permissionError;

  // 构建更新数据（只更新提供的字段）
  const updateData = {
    updated_at: new Date()
  };

  if (name !== undefined) updateData.name = name;
  if (type !== undefined) {
    const typeError = checkAuth.validateAccountType(type);
    if (typeError) return typeError;
    updateData.type = type;
  }
  if (balance !== undefined) updateData.balance = parseFloat(balance);
  if (icon !== undefined) updateData.icon = icon;
  if (sort_order !== undefined) updateData.sort_order = sort_order;
  if (is_default !== undefined) updateData.is_default = is_default;

  await collection.doc(_id).update(updateData);

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
 * 删除账户
 * 只能删除自己创建的账户
 */
async function deleteAccount(collection, openid, data) {
  const { _id } = data;

  // 验证登录和权限
  const permissionError = await checkAuth.checkAccountPermission(collection, _id, openid, 'delete');
  if (permissionError) return permissionError;

  await collection.doc(_id).remove();

  return {
    code: 0,
    message: '删除成功',
    data: {
      _id: _id
    }
  };
}
