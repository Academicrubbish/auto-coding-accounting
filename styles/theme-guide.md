# 记账助手 - 简约清新风样式指南

## 已创建的文件

1. **styles/theme.css** - 全局样式变量
2. **styles/common.css** - 通用样式类

## 在页面中使用样式变量

### 方式一：直接使用变量值（推荐用于主要页面）

```css
/* 颜色 */
background: #f7f8fa;          /* 页面背景 */
background: #ffffff;          /* 卡片背景 */
color: #333333;               /* 主文字 */
color: #999999;               /* 次文字 */
color: #51cf66;               /* 收入绿 */
color: #ff6b6b;               /* 支出红 */

/* 主色渐变 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 尺寸 */
border-radius: 20rpx;         /* 标准圆角 */
padding: 30rpx;               /* 标准间距 */
font-size: 28rpx;             /* 标准字号 */
font-weight: 600;             /* 加粗 */

/* 阴影 */
box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.15);
```

### 方式二：使用通用类（推荐用于简单页面）

```html
<view class="flex items-center gap-md">
  <text class="text-primary font-bold">标题</text>
</view>

<view class="card shadow-md p-lg">
  内容
</view>

<button class="btn btn-primary">确认</button>
```

## 需要更新的页面清单

- [x] 首页 (index/index.vue) - 已更新
- [ ] 列表页 (list/index.vue)
- [ ] 统计页 (stats/index.vue)
- [ ] 我的页 (mine/index.vue)
- [ ] 设置页 (settings/index.vue)
- [ ] 分类管理 (category/index.vue)
- [ ] 账户管理 (account/index.vue)
- [ ] 记账页 (record/index.vue)
- [ ] 详情页 (detail/index.vue)
- [ ] 登录页 (login/index.vue)

## 快速替换指南

### 颜色替换
| 旧值 | 新值 |
|------|------|
| background: #f5f5f5 | background: #f7f8fa |
| background: #f0f0f0 | background: #f5f5f5 |
| color: #666666 | color: #666666 (保持) |
| font-weight: bold | font-weight: 600 |

### 圆角统一
| 类型 | 值 |
|------|-----|
| 按钮/卡片 | 20rpx |
| 小卡片/标签 | 12rpx |
| 大卡片 | 24rpx |
| 圆形 | 50% |

### 间距统一
| 类型 | 值 |
|------|-----|
| 小间距 | 16rpx |
| 标准间距 | 20rpx |
| 大间距 | 30rpx |
| 超大间距 | 40rpx |
