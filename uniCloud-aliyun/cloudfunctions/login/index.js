'use strict';

/**
 * 微信授权登录云函数
 * 功能：通过微信 code 换取 openid，并查询或创建用户记录
 */

exports.main = async (event, context) => {
  const { code, userInfo } = event;

  if (!code) {
    return {
      code: -1,
      message: '缺少 code 参数',
      data: null
    };
  }

  try {
    // 1. 调用微信 API 换取 openid
    const appid = 'wx07932ea2cbbef4c2';
    const secret = '9de5b734431f096da9ebcbc7f1e70bbb';
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

    const openid = res.data.openid;
    const session_key = res.data.session_key;

    // 2. 查询用户是否已存在
    const db = uniCloud.database();
    const collection = db.collection('users');

    const userResult = await collection.where({ openid }).get();

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
        openid: openid,
        nickname: userInfo?.nickName || '用户' + openid.substring(-8),
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
        openid: openid,
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
