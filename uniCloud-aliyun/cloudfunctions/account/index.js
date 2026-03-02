'use strict';

/**
 * 账户管理云函数
 * 功能：账户的增删改查
 * 支持：游客查看系统默认账户，登录用户管理自己的账户
 */

const checkAuth = require('../common/check-auth');

exports.main = async (event, context) => {
  const { action, data } = event;
  const { OPENID } = context;

  const db = uniCloud.database();
  const collection = db.collection('accounts');
  const command = db.command;

  try {
    switch (action) {
      case 'list':
        return await listAccounts(collection, command, OPENID);
      case 'create':
        return await createAccount(collection, OPENID, data);
      case 'update':
        return await updateAccount(collection, OPENID, data);
      case 'delete':
        return await deleteAccount(collection, OPENID, data);
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
 * 游客：只返回系统默认账户（create_by == ''）
 * 登录用户：返回用户自己的账户 + 系统默认账户
 */
async function listAccounts(collection, command, openid) {
  if (!openid) {
    // 游客：只返回系统默认账户
    const res = await collection.where({
      create_by: ''
    }).orderBy('sort_order', 'asc').get();

    return {
      code: 0,
      message: '获取成功',
      data: res.data
    };
  }

  // 登录用户：返回用户账户 + 系统默认账户
  const res = await collection.where(command.or({
    user_id: openid
  }, {
    create_by: ''
  })).orderBy('sort_order', 'asc').get();

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
 * 不能删除系统默认账户
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
