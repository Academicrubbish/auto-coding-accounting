# 记账助手 - MCP 自动化调试工作流

## 项目状态概览

| 项目 | 状态 |
|-----|------|
| **开发进度** | 29/30 任务完成 (96.7%) |
| **核心功能** | ✅ 全部完成 |
| **剩余任务** | Task 23: 默认数据初始化（需手动操作） |
| **MCP工具** | ✅ weixin-devtools-mcp 已配置 |

---

## 工作流目的

本工作流专门用于使用 **MCP (Model Context Protocol)** 调试工具对微信小程序进行自动化测试和调试。

### 与原工作流的区别

| 特性 | 原开发工作流 (CLAUDE.md) | 本调试工作流 |
|-----|------------------------|-------------|
| 目的 | 功能开发 | 测试验证与调试 |
| 测试方式 | 手动测试 + 测试指南 | MCP 自动化测试 |
| 测试记录 | progress.txt | debug-report.md |
| 任务追踪 | task.json | debug-tasks.json |
| 执行模式 | 开发新功能 | 验证现有功能 |

---

## 前置准备清单

### 1. MCP 环境准备

- [ ] **微信开发者工具已安装**
  - 路径: `D:/Program Files/微信web开发者工具/cli.bat`
  - 版本: 支持 CLI 自动化

- [ ] **MCP 服务器已配置**
  - 配置文件: `c:\Users\yuanc\.claude.json`
  - 项目路径: `d:/mystudyspace/test/temp/weixin-mcp/build/server.js`
  - 修复状态: ✅ Windows spawn bug 已修复、UID显示已修复

- [ ] **自动化端口已确认**
  - HTTP 端口: 27902 (默认)
  - 自动化端口: 9420
  - 服务端口: ✅ 已在微信开发者工具中开启

### 2. 项目环境准备

- [ ] **项目已编译**
  - 构建目录: `unpackage/dist/dev/mp-weixin`
  - 状态: 最新代码已编译

- [ ] **云函数已部署**
  - login: ✅
  - account: ✅
  - category: ✅
  - transaction: ✅
  - statistics: ✅
  - common/check-auth: ✅

- [ ] **数据库 Schema 已上传**
  - users: ✅
  - accounts: ✅
  - categories: ✅
  - transactions: ✅

- [ ] **环境变量已配置**
  - MP_APP_ID: wx07932ea2cbbef4c2
  - MP_SECRET: (已配置)

### 3. 测试数据准备

- [ ] **系统默认数据已创建** (参考 default-data-guide.md)
  - 系统默认分类 (支出/收入)
  - 系统默认账户 (现金/支付宝/微信)

---

## MCP 调试工作流步骤

### Step 1: 启动自动化服务

**在终端中执行：**

```bash
"D:/Program Files/微信web开发者工具/cli.bat" auto --project="d:/mystudyspace/test/auto-coding-accounting/unpackage/dist/dev/mp-weixin" --auto-port=9420
```

**预期输出：**
```
✔ auto
```

**验证：**
```bash
netstat -ano | findstr :9420
```

---

### Step 2: 连接 MCP

**使用 MCP 工具连接：**

```typescript
await mcpCall("connect_devtools", {
  strategy: "wsEndpoint",
  wsEndpoint: "ws://127.0.0.1:9420"
})
```

**预期响应：**
```json
{
  "status": "connected"
}
```

**如果连接失败，参考 CLAUDE.md 的常见问题排查**

---

### Step 3: 获取当前页面

```typescript
await mcpCall("get_current_page", {})
```

**预期响应：**
```json
{
  "page": "pages/index/index",
  "query": {}
}
```

---

### Step 4: 获取页面快照

```typescript
await mcpCall("get_page_snapshot", { format: "compact" })
```

**预期响应：** 包含元素树和 UID 信息

---

## 测试用例设计

### 测试模块划分

| 模块 | 页面 | 测试重点 |
|-----|------|---------|
| **M1: 登录模块** | pages/login/index | 授权登录、游客模式 |
| **M2: 首页模块** | pages/index/index | 数据加载、导航 |
| **M3: 记账模块** | pages/record/index | 表单提交、数据验证 |
| **M4: 列表模块** | pages/list/index | 分页、筛选、搜索 |
| **M5: 详情模块** | pages/detail/index | 数据显示、编辑、删除 |
| **M6: 统计模块** | pages/stats/index | 图表渲染、数据计算 |
| **M7: 账户模块** | pages/account/index + edit | CRUD 操作 |
| **M8: 分类模块** | pages/category/index + edit | CRUD 操作 |
| **M9: 个人中心** | pages/mine/index | 用户信息、退出登录 |
| **M10: 导航模块** | 所有页面 | 页面跳转、TabBar切换 |

---

## 详细测试用例

### M1: 登录模块测试

#### M1.1: 页面加载测试
```typescript
// 1. 导航到登录页
await mcpCall("navigate_to", { url: "pages/login/index" })

// 2. 等待页面加载
await mcpCall("wait_for", {
  selector: ".auth-button",
  state: "visible",
  timeout: 5000
})

// 3. 获取页面快照
const snapshot = await mcpCall("get_page_snapshot", { format: "compact" })

// 4. 验证元素存在
// 检查是否有: Logo、授权按钮、游客模式按钮
```

**预期结果：**
- ✅ 页面成功加载
- ✅ 显示应用名称 "记账助手"
- ✅ 显示微信授权按钮
- ✅ 显示游客模式按钮

#### M1.2: 游客模式测试
```typescript
// 1. 点击游客模式按钮
const elements = await mcpCall("query_selector", { selector: ".guest-mode-btn" })
await mcpCall("click", { uid: elements.uid })

// 2. 等待跳转到首页
await mcpCall("wait_for", {
  selector: ".home-container",
  state: "visible",
  timeout: 5000
})

// 3. 验证当前页面
const page = await mcpCall("get_current_page", {})
// page.page 应该是 "pages/index/index"
```

**预期结果：**
- ✅ 成功跳转到首页
- ✅ 首页显示空状态提示（无数据）

---

### M2: 首页模块测试

#### M2.1: 首页数据加载测试
```typescript
// 1. 确保在首页
await mcpCall("switch_tab", { url: "pages/index/index" })

// 2. 等待数据加载
await mcpCall("wait_for", {
  selector: ".total-asset-card",
  state: "visible",
  timeout: 10000
})

// 3. 获取总资产金额
const assetText = await mcpCall("get_value", {
  uid: "total-asset-amount",
  property: "text"
})

// 4. 验证快捷记账按钮存在
const quickBtns = await mcpCall("query_selector", { selector: ".quick-record-btn" })
// quickBtns.length 应该 >= 2 (记支出、记收入)
```

**预期结果：**
- ✅ 总资产卡片显示
- ✅ 金额显示格式正确 (如 "1,234.56")
- ✅ 本月收支统计显示
- ✅ 快捷记账按钮可点击

#### M2.2: 快捷记账导航测试
```typescript
// 1. 点击"记一笔"按钮
const expenseBtn = await mcpCall("query_selector", { selector: ".btn-expense" })
await mcpCall("click", { uid: expenseBtn.uid })

// 2. 验证跳转到记账页面
await mcpCall("wait_for", {
  selector: ".record-page",
  state: "visible",
  timeout: 5000
})

const page = await mcpCall("get_current_page", {})
// page.page 应该是 "pages/record/index"
```

---

### M3: 记账模块测试

#### M3.1: 记账表单测试
```typescript
// 1. 导航到记账页（支出类型）
await mcpCall("navigate_to", { url: "pages/record/index?type=expense" })

// 2. 等待表单加载
await mcpCall("wait_for", {
  selector: ".amount-input",
  state: "visible",
  timeout: 5000
})

// 3. 输入金额
await mcpCall("input_text", {
  uid: "amount-input",
  text: "88.88",
  replace: true
})

// 4. 点击分类选择器
await mcpCall("click", { uid: "category-picker" })

// 5. 选择第一个分类
await mcpCall("wait_for", { selector: ".category-list", state: "visible" })
const firstCategory = await mcpCall("query_selector", { selector: ".category-item:first-child" })
await mcpCall("click", { uid: firstCategory.uid })

// 6. 点击账户选择器
await mcpCall("click", { uid: "account-picker" })

// 7. 选择第一个账户
await mcpCall("wait_for", { selector: ".account-list", state: "visible" })
const firstAccount = await mcpCall("query_selector", { selector: ".account-item:first-child" })
await mcpCall("click", { uid: firstAccount.uid })

// 8. 输入备注
await mcpCall("input_text", {
  uid: "remark-input",
  text: "测试记账",
  replace: true
})

// 9. 提交表单
await mcpCall("click", { uid: "submit-btn" })

// 10. 等待提交成功
await mcpCall("wait_for", {
  selector: ".toast-success",
  state: "visible",
  timeout: 5000
})
```

**预期结果：**
- ✅ 金额输入成功
- ✅ 分类选择成功
- ✅ 账户选择成功
- ✅ 备注输入成功
- ✅ 提交成功，显示成功提示
- ✅ 自动返回上一页

#### M3.2: 收支类型切换测试
```typescript
// 1. 在记账页切换到收入
await mcpCall("click", { uid: "type-income" })

// 2. 验证分类列表更新为收入分类
const incomeCategories = await mcpCall("query_selector", { selector: ".category-item" })
// 验证分类是收入类型的分类
```

---

### M4: 列表模块测试

#### M4.1: 交易列表加载测试
```typescript
// 1. 导航到交易列表
await mcpCall("switch_tab", { url: "pages/list/index" })

// 2. 等待列表加载
await mcpCall("wait_for", {
  selector: ".transaction-list",
  state: "visible",
  timeout: 10000
})

// 3. 获取列表项数量
const items = await mcpCall("query_selector", {
  selector: ".transaction-item",
  single: false
})

// 4. 验证列表显示
// items.length > 0 表示有数据
```

#### M4.2: 下拉刷新测试
```typescript
// 1. 触发下拉刷新（需要模拟手势或调用刷新方法）
// 2. 等待刷新完成
await mcpCall("wait_for", {
  selector: ".transaction-list",
  state: "visible",
  timeout: 5000
})
```

#### M4.3: 筛选功能测试
```typescript
// 1. 点击筛选按钮
await mcpCall("click", { uid: "filter-btn" })

// 2. 等待筛选弹窗显示
await mcpCall("wait_for", {
  selector: ".filter-popup",
  state: "visible",
  timeout: 3000
})

// 3. 选择筛选条件
await mcpCall("click", { uid: "filter-type-expense" })

// 4. 确认筛选
await mcpCall("click", { uid: "filter-confirm" })

// 5. 验证列表更新
```

---

### M5: 详情模块测试

#### M5.1: 交易详情查看测试
```typescript
// 1. 从列表页点击第一条交易
const firstTx = await mcpCall("query_selector", { selector: ".transaction-item:first-child" })
await mcpCall("click", { uid: firstTx.uid })

// 2. 等待详情页加载
await mcpCall("wait_for", {
  selector: ".detail-page",
  state: "visible",
  timeout: 5000
})

// 3. 验证详情数据显示
const amount = await mcpCall("get_value", {
  uid: "detail-amount",
  property: "text"
})
const category = await mcpCall("get_value", {
  uid: "detail-category",
  property: "text"
})
const account = await mcpCall("get_value", {
  uid: "detail-account",
  property: "text"
})
```

**预期结果：**
- ✅ 金额正确显示
- ✅ 分类正确显示
- ✅ 账户正确显示
- ✅ 日期正确显示
- ✅ 备注正确显示

#### M5.2: 编辑功能测试
```typescript
// 1. 点击编辑按钮
await mcpCall("click", { uid: "edit-btn" })

// 2. 验证跳转到记账页并回填数据
await mcpCall("wait_for", {
  selector: ".record-page",
  state: "visible",
  timeout: 5000
})

// 3. 验证表单数据已回填
const currentAmount = await mcpCall("get_value", {
  uid: "amount-input",
  property: "value"
})
// currentAmount 应该等于原交易金额
```

#### M5.3: 删除功能测试
```typescript
// 1. 在详情页点击删除按钮
await mcpCall("click", { uid: "delete-btn" })

// 2. 等待确认弹窗
await mcpCall("wait_for", {
  selector: ".confirm-modal",
  state: "visible",
  timeout: 3000
})

// 3. 确认删除
await mcpCall("click", { uid: "confirm-delete-btn" })

// 4. 等待删除成功提示
await mcpCall("wait_for", {
  selector: ".toast-success",
  state: "visible",
  timeout: 5000
})

// 5. 验证返回列表页
const page = await mcpCall("get_current_page", {})
// page.page 应该是 "pages/list/index"
```

---

### M6: 统计模块测试

#### M6.1: 月度统计加载测试
```typescript
// 1. 切换到统计标签
await mcpCall("switch_tab", { url: "pages/stats/index" })

// 2. 等待统计数据加载
await mcpCall("wait_for", {
  selector: ".stats-container",
  state: "visible",
  timeout: 10000
})

// 3. 验证月度收支显示
const totalIncome = await mcpCall("get_value", {
  uid: "total-income",
  property: "text"
})
const totalExpense = await mcpCall("get_value", {
  uid: "total-expense",
  property: "text"
})
const balance = await mcpCall("get_value", {
  uid: "balance",
  property: "text"
})
```

**预期结果：**
- ✅ 总收入显示正确
- ✅ 总支出显示正确
- ✅ 结余计算正确

#### M6.2: 分类占比测试
```typescript
// 1. 切换到分类占比视图
await mcpCall("click", { uid: "category-stats-tab" })

// 2. 等待分类列表加载
await mcpCall("wait_for", {
  selector: ".category-stats-list",
  state: "visible",
  timeout: 3000
})

// 3. 验证分类占比显示
const categoryItems = await mcpCall("query_selector", {
  selector: ".category-stat-item",
  single: false
})

// 验证每个分类项有: 名称、金额、占比、进度条
```

---

### M7: 账户管理测试

#### M7.1: 账户列表测试
```typescript
// 1. 导航到账户管理页
await mcpCall("navigate_to", { url: "pages/account/index" })

// 2. 等待列表加载
await mcpCall("wait_for", {
  selector: ".account-list",
  state: "visible",
  timeout: 5000
})

// 3. 验证账户显示
const accounts = await mcpCall("query_selector", {
  selector: ".account-item",
  single: false
})

// 4. 验证总资产显示
const totalAsset = await mcpCall("get_value", {
  uid: "total-asset",
  property: "text"
})
```

#### M7.2: 创建账户测试
```typescript
// 1. 点击添加账户按钮
await mcpCall("click", { uid: "add-account-btn" })

// 2. 等待编辑页加载
await mcpCall("wait_for", {
  selector: ".account-edit-page",
  state: "visible",
  timeout: 5000
})

// 3. 输入账户名称
await mcpCall("input_text", {
  uid: "account-name-input",
  text: "测试账户",
  replace: true
})

// 4. 选择账户类型
await mcpCall("click", { uid: "account-type-cash" })

// 5. 输入初始余额
await mcpCall("input_text", {
  uid: "account-balance-input",
  text: "1000",
  replace: true
})

// 6. 提交
await mcpCall("click", { uid: "save-btn" })

// 7. 等待成功提示
await mcpCall("wait_for", {
  selector: ".toast-success",
  state: "visible",
  timeout: 5000
})

// 8. 验证返回列表页并显示新账户
```

#### M7.3: 编辑账户测试
```typescript
// 1. 在列表页点击编辑按钮
const editBtn = await mcpCall("query_selector", { selector: ".account-item:first-child .edit-btn" })
await mcpCall("click", { uid: editBtn.uid })

// 2. 修改账户信息
await mcpCall("input_text", {
  uid: "account-name-input",
  text: "修改后的账户名",
  replace: true
})

// 3. 保存
await mcpCall("click", { uid: "save-btn" })

// 4. 验证保存成功
```

#### M7.4: 删除账户测试
```typescript
// 1. 在列表页点击删除按钮
const deleteBtn = await mcpCall("query_selector", { selector: ".account-item:first-child .delete-btn" })
await mcpCall("click", { uid: deleteBtn.uid })

// 2. 确认删除
await mcpCall("wait_for", {
  selector: ".confirm-modal",
  state: "visible",
  timeout: 3000
})
await mcpCall("click", { uid: "confirm-delete-btn" })

// 3. 验证删除成功
```

---

### M8: 分类管理测试

#### M8.1: 分类列表测试
```typescript
// 1. 导航到分类管理页
await mcpCall("navigate_to", { url: "pages/category/index" })

// 2. 等待列表加载
await mcpCall("wait_for", {
  selector: ".category-list",
  state: "visible",
  timeout: 5000
})

// 3. 验证支出分类显示
const expenseCategories = await mcpCall("query_selector", {
  selector: ".category-item",
  single: false
})

// 4. 切换到收入分类
await mcpCall("click", { uid: "type-income-tab" })

// 5. 验证收入分类显示
```

#### M8.2: 创建分类测试
```typescript
// 1. 点击添加分类按钮
await mcpCall("click", { uid: "add-category-btn" })

// 2. 等待编辑页加载
await mcpCall("wait_for", {
  selector: ".category-edit-page",
  state: "visible",
  timeout: 5000
})

// 3. 输入分类名称
await mcpCall("input_text", {
  uid: "category-name-input",
  text: "测试分类",
  replace: true
})

// 4. 选择图标
await mcpCall("click", { uid: "icon-item-food" })

// 5. 选择颜色
await mcpCall("click", { uid: "color-item-red" })

// 6. 提交
await mcpCall("click", { uid: "save-btn" })

// 7. 验证保存成功
```

---

### M9: 个人中心测试

#### M9.1: 个人中心显示测试
```typescript
// 1. 切换到我的标签
await mcpCall("switch_tab", { url: "pages/mine/index" })

// 2. 等待页面加载
await mcpCall("wait_for", {
  selector: ".mine-container",
  state: "visible",
  timeout: 5000
})

// 3. 验证用户信息显示
const userInfo = await mcpCall("get_value", {
  uid: "user-nickname",
  property: "text"
})

// 4. 验证统计数据
const txCount = await mcpCall("get_value", {
  uid: "stat-tx-count",
  property: "text"
})
const accountCount = await mcpCall("get_value", {
  uid: "stat-account-count",
  property: "text"
})
const categoryCount = await mcpCall("get_value", {
  uid: "stat-category-count",
  property: "text"
})
```

#### M9.2: 功能入口测试
```typescript
// 1. 点击账户管理入口
await mcpCall("click", { uid: "entry-account" })

// 2. 验证跳转到账户管理页
const page = await mcpCall("get_current_page", {})
// page.page 应该是 "pages/account/index"

// 3. 返回
await mcpCall("navigate_back", {})

// 4. 点击分类管理入口
await mcpCall("click", { uid: "entry-category" })

// 5. 验证跳转到分类管理页
```

#### M9.3: 退出登录测试
```typescript
// 1. 点击退出登录按钮
await mcpCall("click", { uid: "logout-btn" })

// 2. 等待确认弹窗
await mcpCall("wait_for", {
  selector: ".confirm-modal",
  state: "visible",
  timeout: 3000
})

// 3. 确认退出
await mcpCall("click", { uid: "confirm-logout-btn" })

// 4. 验证跳转到登录页
const page = await mcpCall("get_current_page", {})
// page.page 应该是 "pages/login/index"
```

---

### M10: 导航模块测试

#### M10.1: TabBar 切换测试
```typescript
// 测试底部 TabBar 切换
const tabs = [
  { url: "pages/index/index", name: "首页" },
  { url: "pages/stats/index", name: "统计" },
  { url: "pages/mine/index", name: "我的" }
]

for (const tab of tabs) {
  await mcpCall("switch_tab", { url: tab.url })
  await mcpCall("wait_for", {
    selector: ".page-container",
    state: "visible",
    timeout: 5000
  })

  const page = await mcpCall("get_current_page", {})
  console.log(`切换到 ${tab.name}: ${page.page}`)
}
```

#### M10.2: 页面跳转测试
```typescript
// 测试所有页面路由
const pages = [
  "pages/login/index",
  "pages/index/index",
  "pages/list/index",
  "pages/record/index",
  "pages/detail/index",
  "pages/stats/index",
  "pages/mine/index",
  "pages/account/index",
  "pages/account/edit",
  "pages/category/index",
  "pages/category/edit"
]

for (const pageUrl of pages) {
  try {
    await mcpCall("navigate_to", { url: pageUrl })
    await mcpCall("wait_for", {
      selector: ".page-container",
      state: "visible",
      timeout: 5000
    })
    console.log(`✅ ${pageUrl} 加载成功`)
    await mcpCall("navigate_back", {})
  } catch (error) {
    console.log(`❌ ${pageUrl} 加载失败: ${error.message}`)
  }
}
```

#### M10.3: 返回导航测试
```typescript
// 1. 从首页 -> 记账页
await mcpCall("navigate_to", { url: "pages/record/index" })

// 2. 返回
await mcpCall("navigate_back", {})

// 3. 验证返回到首页
const page = await mcpCall("get_current_page", {})
// page.page 应该是 "pages/index/index"
```

---

## 测试报告格式

### 测试结果记录模板

```markdown
## [日期] - MCP 自动化测试报告

### 测试环境
- 测试时间: YYYY-MM-DD HH:mm:ss
- 测试人员: AI Agent
- 微信开发者工具: 已连接 (端口 9420)
- 项目构建: unpackage/dist/dev/mp-weixin

### 测试结果概览
| 模块 | 通过 | 失败 | 阻塞 | 通过率 |
|-----|-----|-----|-----|-------|
| M1: 登录模块 | | | | |
| M2: 首页模块 | | | | |
| M3: 记账模块 | | | | |
| M4: 列表模块 | | | | |
| M5: 详情模块 | | | | |
| M6: 统计模块 | | | | |
| M7: 账户模块 | | | | |
| M8: 分类模块 | | | | |
| M9: 个人中心 | | | | |
| M10: 导航模块 | | | | |
| **总计** | | | | |

### 详细测试记录

#### M1: 登录模块
- ✅ M1.1: 页面加载测试 - 通过
- ✅ M1.2: 游客模式测试 - 通过

#### M2: 首页模块
- ✅ M2.1: 首页数据加载测试 - 通过
- ✅ M2.2: 快捷记账导航测试 - 通过

... (其他模块)

### 失败用例详情

| 用例ID | 用例名称 | 预期结果 | 实际结果 | 错误信息 |
|-------|---------|---------|---------|---------|
| | | | | |

### 问题汇总

#### P1: 严重问题
- 无

#### P2: 一般问题
- 无

#### P3: 轻微问题
- 无

### 建议
- 无

### 下一步
- 继续监控已知问题
- 计划回归测试时间
```

---

## 常见调试技巧

### 1. 元素定位技巧

```typescript
// 当类名不确定时，使用更通用的选择器
const buttons = await mcpCall("query_selector", {
  selector: "button",
  single: false
})

// 使用属性选择器
const submitBtn = await mcpCall("query_selector", {
  selector: "[type='submit']"
})
```

### 2. 等待技巧

```typescript
// 使用更长的超时时间
await mcpCall("wait_for", {
  selector: ".data-loaded",
  state: "visible",
  timeout: 15000  // 15秒
})

// 等待多个可能的状态
try {
  await mcpCall("wait_for", { selector: ".success", state: "visible", timeout: 5000 })
} catch {
  await mcpCall("wait_for", { selector: ".error", state: "visible", timeout: 1000 })
}
```

### 3. 调试输出

```typescript
// 打印当前页面状态
const page = await mcpCall("get_current_page", {})
console.log("当前页面:", page.page, page.query)

// 打印元素快照
const snapshot = await mcpCall("get_page_snapshot", { format: "compact" })
console.log("页面元素:", snapshot.structuredContent.text)
```

### 4. 错误处理

```typescript
// 使用 try-catch 包裹可能失败的操作
try {
  await mcpCall("click", { uid: "some-button" })
} catch (error) {
  console.log("点击失败:", error.message)
  // 尝试备用方案
}
```

---

## 回归测试流程

### 完整回归测试步骤

1. **环境准备** (5分钟)
   - 启动自动化服务
   - 连接 MCP
   - 验证连接状态

2. **快速冒烟测试** (10分钟)
   - 执行 M1-M10 的核心用例
   - 每个模块选择1-2个关键用例

3. **完整功能测试** (30分钟)
   - 执行所有测试用例
   - 记录测试结果

4. **报告生成** (5分钟)
   - 汇总测试结果
   - 分析失败用例
   - 生成测试报告

### 持续集成建议

```bash
# 可以创建自动化测试脚本
# workflow/run-debug-tests.sh

#!/bin/bash
# 启动自动化服务
"D:/Program Files/微信web开发者工具/cli.bat" auto \
  --project="unpackage/dist/dev/mp-weixin" \
  --auto-port=9420

# 等待服务启动
sleep 5

# 运行测试 (通过 MCP Agent 调用)
# ...

# 测试完成后关闭服务
# (可选: 保持服务运行供后续调试)
```

---

## 与 CLAUDE.md 配合使用

### 何时使用本调试工作流

- ✅ 功能开发完成，需要全面测试
- ✅ 代码修改后，需要验证功能
- ✅ 发布前，需要回归测试
- ✅ 发现 bug，需要复现和定位

### 何时使用原开发工作流

- ✅ 开发新功能
- ✅ 修改现有功能
- ✅ 重构代码

---

## 附录

### A. MCP 工具快速参考

| 工具 | 用途 | 示例 |
|-----|------|-----|
| connect_devtools | 连接微信开发者工具 | `{ strategy: "wsEndpoint", wsEndpoint: "ws://127.0.0.1:9420" }` |
| disconnect_devtools | 断开连接 | `{}` |
| get_current_page | 获取当前页面 | `{}` |
| get_page_snapshot | 获取页面快照 | `{ format: "compact" }` |
| query_selector | 查找元素 | `{ selector: ".btn", single: true }` |
| click | 点击元素 | `{ uid: "button-uid" }` |
| input_text | 输入文本 | `{ uid: "input-uid", text: "hello" }` |
| get_value | 获取值 | `{ uid: "text-uid", property: "text" }` |
| navigate_to | 导航到页面 | `{ url: "pages/record/index" }` |
| navigate_back | 返回上一页 | `{}` |
| switch_tab | 切换 TabBar | `{ url: "pages/index/index" }` |
| wait_for | 等待元素状态 | `{ selector: ".btn", state: "visible", timeout: 5000 }` |
| evaluate_script | 执行脚本 | `{ script: "return wx.getStorageSync('user')" }` |

### B. 常用选择器

| 选择器 | 说明 |
|-------|------|
| `.class` | 类选择器 |
| `#id` | ID 选择器 |
| `element` | 元素选择器 |
| `[attr=value]` | 属性选择器 |
| `:first-child` | 第一个子元素 |
| `:last-child` | 最后一个子元素 |
| `:nth-child(n)` | 第 n 个子元素 |

### C. 状态值

| 状态 | 说明 |
|-----|------|
| `visible` | 可见 |
| `hidden` | 隐藏 |
| `enabled` | 启用 |
| `disabled` | 禁用 |
| `focused` | 聚焦 |
| `checked` | 选中 |

---

**文档版本**: 1.0
**最后更新**: 2026-03-06
**维护者**: AI Agent
