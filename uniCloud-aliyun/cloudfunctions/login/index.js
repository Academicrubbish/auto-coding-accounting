'use strict';

/**
 * 微信授权登录云函数
 * 功能：通过微信 code 换取 openid，并查询或创建用户记录
 * 支持：login（登录）、verify（验证用户）两种操作
 */

exports.main = async (event, context) => {
  const { action, code, userInfo, openid } = event;

  // 验证用户操作（从缓存恢复登录时使用）
  if (action === 'verify') {
    return await verifyUser(openid);
  }

  // 默认执行登录操作
  if (!code) {
    return {
      code: -1,
      message: '缺少 code 参数',
      data: null
    };
  }

  try {
    // 1. 调用微信 API 换取 openid
    const appid = 'wx49fd391682f5ccc1';
    const secret = '733dd70d85dd5cbd36c905e022d54d84';
    const apiUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const res = await uniCloud.httpclient.request(apiUrl, {
      method: 'GET',
      dataType: 'json'
    });

    if (res.status !== 200 || res.data.errcode) {
      return {
        code: -1,
        message: '微信登录失败：' + (res.data.errmsg || '网络错误'),
        data: null
      };
    }

    const userOpenid = res.data.openid;
    const session_key = res.data.session_key;

    // 2. 查询用户是否已存在
    const db = uniCloud.database();
    const collection = db.collection('users');

    const userResult = await collection.where({ openid: userOpenid }).get();

    let userData;
    let isNewUser = false;

    if (userResult.data.length > 0) {
      // 用户已存在
      userData = userResult.data[0];

      // 更新用户信息（如果提供了新的用户信息）
      if (userInfo) {
        await collection.doc(userData._id).update({
          nickname: userInfo.nickName || userData.nickname,
          avatar: userInfo.avatarUrl || userData.avatar,
          updated_at: new Date()
        });
      }
    } else {
      // 新用户，创建用户记录
      isNewUser = true;

      const createData = {
        openid: userOpenid,
        nickname: userInfo?.nickName || '用户' + userOpenid.substring(-8),
        avatar: userInfo?.avatarUrl || '',
        created_at: new Date(),
        updated_at: new Date()
      };

      const createResult = await collection.add(createData);
      userData = {
        _id: createResult.id,
        ...createData
      };
    }

    // 3. 返回结果
    return {
      code: 0,
      message: '登录成功',
      data: {
        openid: userOpenid,
        userData: userData,
        isNewUser: isNewUser
      }
    };

  } catch (error) {
    console.error('登录云函数错误：', error);
    return {
      code: -1,
      message: '登录失败：' + error.message,
      data: null
    };
  }
};

/**
 * 验证用户信息
 */
async function verifyUser(openid) {
  if (!openid) {
    return {
      code: -1,
      message: '缺少 openid 参数',
      data: null
    };
  }

  try {
    const db = uniCloud.database();
    const collection = db.collection('users');

    const userResult = await collection.where({ openid }).get();

    if (userResult.data.length > 0) {
      return {
        code: 0,
        message: '验证成功',
        data: {
          userData: userResult.data[0]
        }
      };
    } else {
      return {
        code: -1,
        message: '用户不存在',
        data: null
      };
    }
  } catch (error) {
    console.error('验证用户错误：', error);
    return {
      code: -1,
      message: '验证失败：' + error.message,
      data: null
    };
  }
}
