'use strict';

/**
 * 分类管理云函数
 * 功能：分类的增删改查
 * 支持：游客查看系统默认分类，登录用户管理自己的分类
 */

const checkAuth = require('check-auth');

exports.main = async (event, context) => {
  const { action, data, openid } = event;
  // 优先使用 context.OPENID（uni-id 认证），否则使用 event.openid（自定义认证）
  const userOpenid = context.OPENID || openid;

  const db = uniCloud.database();
  const collection = db.collection('categories');
  const command = db.command;

  try {
    switch (action) {
      case 'list':
        return await listCategories(collection, command, userOpenid, data);
      case 'create':
        return await createCategory(collection, userOpenid, data);
      case 'update':
        return await updateCategory(collection, userOpenid, data);
      case 'delete':
        return await deleteCategory(collection, userOpenid, data);
      default:
        return {
          code: -1,
          message: '未知的操作类型',
          data: null
        };
    }
  } catch (error) {
    console.error('分类云函数错误：', error);
    return {
      code: -1,
      message: '操作失败：' + error.message,
      data: null
    };
  }
};

/**
 * 获取分类列表
 * 游客：只返回系统默认分类（create_by == ''）
 * 登录用户：返回用户自己的分类 + 系统默认分类
 * 支持按类型筛选（支出/收入）
 */
async function listCategories(collection, command, openid, data) {
  const { type } = data || {};

  // 构建查询条件
  let whereCondition = {};

  if (!openid) {
    // 游客：只返回系统默认分类
    whereCondition = { create_by: '' };
  } else {
    // 登录用户：返回用户分类 + 系统默认分类
    whereCondition = command.or(
      { user_id: openid },
      { create_by: '' }
    );
  }

  // 如果指定了类型，添加类型筛选
  if (type && (type === 'expense' || type === 'income')) {
    if (!openid) {
      whereCondition.type = type;
    } else {
      whereCondition = command.and(
        whereCondition,
        { type: type }
      );
    }
  }

  const res = await collection.where(whereCondition)
    .orderBy('sort_order', 'asc')
    .get();

  return {
    code: 0,
    message: '获取成功',
    data: res.data
  };
}

/**
 * 创建分类
 * 需要登录
 * 自动设置 create_by 为用户 openid
 */
async function createCategory(collection, openid, data) {
  // 验证登录
  const loginError = checkAuth.checkLogin(openid);
  if (loginError) return loginError;

  // 验证必填参数
  const paramsError = checkAuth.validateParams(data, ['name', 'type']);
  if (paramsError) return paramsError;

  // 验证分类类型
  const typeError = checkAuth.validateCategoryType(data.type);
  if (typeError) return typeError;

  const { name, type, icon, color, sort_order, is_default } = data;

  const createData = {
    user_id: openid,
    name: name,
    type: type,
    icon: icon || '',
    color: color || '#667eea',
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
 * 更新分类
 * 只能更新自己创建的分类
 * 不能修改系统默认分类
 */
async function updateCategory(collection, openid, data) {
  const { _id, name, type, icon, color, sort_order, is_default } = data;

  // 验证登录和权限
  const permissionError = await checkAuth.checkCategoryPermission(collection, _id, openid, 'update');
  if (permissionError) return permissionError;

  // 构建更新数据（只更新提供的字段）
  const updateData = {
    updated_at: new Date()
  };

  if (name !== undefined) updateData.name = name;
  if (type !== undefined) {
    const typeError = checkAuth.validateCategoryType(type);
    if (typeError) return typeError;
    updateData.type = type;
  }
  if (icon !== undefined) updateData.icon = icon;
  if (color !== undefined) updateData.color = color;
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
 * 删除分类
 * 只能删除自己创建的分类
 * 不能删除系统默认分类
 */
async function deleteCategory(collection, openid, data) {
  const { _id } = data;

  // 验证登录和权限
  const permissionError = await checkAuth.checkCategoryPermission(collection, _id, openid, 'delete');
  if (permissionError) return permissionError;

  // 检查是否有交易记录使用了此分类
  const db = uniCloud.database();
  const transactionCollection = db.collection('transactions');
  const transactionCheck = await transactionCollection.where({
    category_id: _id
  }).count();

  if (transactionCheck.total > 0) {
    return {
      code: -1,
      message: `该分类下还有 ${transactionCheck.total} 条交易记录，无法删除`,
      data: null
    };
  }

  await collection.doc(_id).remove();

  return {
    code: 0,
    message: '删除成功',
    data: {
      _id: _id
    }
  };
}
