# 默认数据初始化指南

本文档说明如何在 uniCloud 数据库中创建系统默认分类和账户数据。

## 系统默认数据设计

系统默认数据通过 `create_by` 字段标识：
- `create_by == ''` (空字符串)：系统默认数据，所有用户可见但不可编辑删除
- `create_by == user.openid`：用户自定义数据，只有创建者可编辑删除

## 创建系统默认分类

在 uniCloud 控制台操作：

1. 进入 **云数据库** -> **categories** 集合

2. 点击 **添加记录**，插入以下支出分类：

```json
{
  "name": "餐饮",
  "type": "expense",
  "icon": "🍜",
  "color": "#ff6b6b",
  "sort_order": 1,
  "is_default": false,
  "create_by": "",
  "created_at": {
    "$date": "2024-01-01T00:00:00.000Z"
  },
  "updated_at": {
    "$date": "2024-01-01T00:00:00.000Z"
  }
}
```

继续添加其他支出分类：

| 分类名称 | 图标 | 颜色 | 排序 |
|---------|------|------|------|
| 交通 | 🚕 | #54a0ff | 2 |
| 购物 | 🛒 | #ff9f43 | 3 |
| 居住 | 🏠 | #51cf66 | 4 |
| 娱乐 | 🎮 | #a29bfe | 5 |
| 医疗 | 💊 | #00b894 | 6 |
| 教育 | 📚 | #fdcb6e | 7 |
| 通讯 | 📱 | #74b9ff | 8 |
| 其他 | 📦 | #9ca3af | 9 |
| 工资 | 💸 | #ffd93d | 10 |
| 奖金 | 🎁 | #fab1a0 | 11 |

3. 插入收入分类：

| 分类名称 | 图标 | 颜色 | 排序 |
|---------|------|------|------|
| 工资 | 💰 | #51cf66 | 1 |
| 奖金 | 🎁 | #ff9f43 | 2 |
| 理财 | 📈 | #54a0ff | 3 |
| 兼职 | 💼 | #a29bfe | 4 |
| 其他 | 💵 | #74b9ff | 5 |

## 创建系统默认账户

在 uniCloud 控制台操作：

1. 进入 **云数据库** -> **accounts** 集合

2. 点击 **添加记录**，插入以下默认账户：

```json
{
  "name": "现金",
  "type": "cash",
  "balance": 0,
  "icon": "💵",
  "sort_order": 1,
  "is_default": true,
  "create_by": "",
  "created_at": {
    "$date": "2024-01-01T00:00:00.000Z"
  },
  "updated_at": {
    "$date": "2024-01-01T00:00:00.000Z"
  }
}
```

继续添加其他账户：

| 账户名称 | 类型 | 余额 | 图标 | 排序 | 默认 |
|---------|------|------|------|------|------|
| 支付宝 | other | 0 | 💳 | 2 | false |
| 微信 | other | 0 | 💳 | 3 | false |
| 招商银行 | bank | 0 | 🏦 | 4 | false |
| 建设银行 | bank | 0 | 🏦 | 5 | false |

## 数据验证

创建完成后，可以通过以下方式验证：

1. 在 categories 集合查询 `create_by == ""` 的记录数
2. 在 accounts 集合查询 `create_by == ""` 的记录数
3. 在前端应用中查看分类和账户列表是否显示系统默认数据

## 注意事项

1. **create_by 必须为空字符串**，不能是 null 或省略
2. **user_id 字段**：对于系统默认数据，user_id 可以设为空字符串或不设置
3. **sort_order**：用于控制显示顺序，数字越小越靠前
4. **日期字段**：使用 `$date` 操作符插入 ISO 8601 格式的日期

## 前端使用

系统默认数据会自动与用户数据合并显示：

```javascript
// 获取账户列表
const res = await uniCloud.callFunction({
  name: 'account',
  data: { action: 'list' }
})

// 返回结果包含：
// 1. 用户自己创建的账户（create_by == user.openid）
// 2. 系统默认账户（create_by == ''）
```

```javascript
// 获取分类列表
const res = await uniCloud.callFunction({
  name: 'category',
  data: {
    action: 'list',
    data: { type: 'expense' }
  }
})

// 返回结果包含：
// 1. 用户自己创建的分类（create_by == user.openid）
// 2. 系统默认分类（create_by == ''）
```
