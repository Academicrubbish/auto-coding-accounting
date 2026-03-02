# 记账软件 - 自动 AI 编程工作流

## 项目说明

这是一个使用 **uni-app + uniCloud** 技术栈的记账应用，通过 AI 自动编程的方式开发。

### 技术栈

| 层级 | 技术选型 |
|-----|---------|
| 前端框架 | uni-app (Vue 3) |
| UI 样式 | UnoCSS |
| 状态管理 | Pinia |
| 后端 | uniCloud 云函数 |
| 数据库 | uniCloud 云数据库 |
| 认证 | 微信授权登录 |
| 目标平台 | 微信小程序 + H5 + App |

---

## MANDATORY: Agent Workflow

每个新的 Agent 会话必须遵循此工作流：

### Step 1: 初始化环境

```bash
./init.sh
```

这将会：
- 创建 uni-app 项目（如果不存在）
- 安装所有依赖
- 配置 uniCloud
- 启动开发服务器

**不要跳过这一步。** 确保服务器正常运行后再继续。

### Step 2: 选择下一个任务

读取 `task.json` 并选择**一个**任务来处理。

选择标准（按优先级）：
1. 选择 `passes: false` 的任务
2. 考虑依赖关系 - 基础功能应该先完成
3. 选择最高优先级的未完成任务

### Step 3: 实现任务

- 仔细阅读任务描述和步骤
- 实现功能以满足所有步骤
- 遵循现有的代码模式和规范

### Step 4: 测试验证

实现后，验证任务中的**所有步骤**：

**强制测试要求（Testing Requirements - MANDATORY）：**

1. **大幅度页面修改**（新建页面、重写组件、修改核心交互）：
   - **必须在浏览器/小程序开发工具中测试！**
   - 验证页面能正确加载和渲染
   - 验证表单提交、按钮点击等交互功能
   - 截图确认 UI 正确显示

2. **云函数修改**：
   - 使用 uniCloud Web 控制台测试
   - 或在 HBuilderX 中本地调试云函数
   - 验证返回数据格式正确

3. **小幅度代码修改**（修复 bug、调整样式、添加辅助函数）：
   - 可以使用 lint/build 验证
   - 如有疑虑，仍建议实际测试

4. **所有修改必须通过**：
   - `npm run lint` 无错误（如果配置了）
   - `npm run build:mp-weixin` 小程序构建成功
   - `npm run build:h5` H5 构建成功
   - 实际测试验证功能正常

**测试清单：**
- [ ] 代码没有 TypeScript/Vue 编译错误
- [ ] lint 通过
- [ ] 小程序/H5 构建成功
- [ ] 功能在小程序开发工具中正常工作
- [ ] 云函数在云端测试正常

### Step 5: 更新进度

将工作记录到 `progress.txt`：

```
## [Date] - Task: [task description]

### What was done:
- [specific changes made]

### Testing:
- [how it was tested]

### Notes:
- [any relevant notes for future agents]
```

### Step 6: 提交更改（包含 task.json 更新）

**IMPORTANT: 所有更改必须在同一个 commit 中提交，包括 task.json 的更新！**

流程：
1. 更新 `task.json`，将任务的 `passes` 从 `false` 改为 `true`
2. 更新 `progress.txt` 记录工作内容
3. 一次性提交所有更改：

```bash
git add .
git commit -m "[task description] - completed"
```

**规则:**
- 只有在所有步骤都验证通过后才标记 `passes: true`
- 永远不要删除或修改任务描述
- 永远不要从列表中移除任务
- **一个 task 的所有内容（代码、progress.txt、task.json）必须在同一个 commit 中提交**

---

## ⚠️ 阻塞处理（Blocking Issues）

**如果任务无法完成测试或需要人工介入，必须遵循以下规则：**

### 需要停止任务并请求人工帮助的情况：

1. **缺少环境配置**：
   - 微信小程序 AppID 和 Secret 需要申请
   - uniCloud 空间需要创建和配置
   - 云函数需要上传到阿里云

2. **外部依赖不可用**：
   - 第三方 API 服务宕机
   - 需要人工授权的 OAuth 流程
   - 需要付费升级的服务

3. **测试无法进行**：
   - 微信登录需要真实的小程序环境
   - 功能依赖外部系统尚未部署
   - 需要特定硬件环境

### 阻塞时的正确操作：

**DO NOT（禁止）：**
- ❌ 提交 git commit
- ❌ 将 task.json 的 passes 设为 true
- ❌ 假装任务已完成

**DO（必须）：**
- ✅ 在 progress.txt 中记录当前进度和阻塞原因
- ✅ 输出清晰的阻塞信息，说明需要人工做什么
- ✅ 停止任务，等待人工介入

### 阻塞信息格式：

```
🚫 任务阻塞 - 需要人工介入

**当前任务**: [任务名称]

**已完成的工作**:
- [已完成的代码/配置]

**阻塞原因**:
- [具体说明为什么无法继续]

**需要人工帮助**:
1. [具体的步骤 1]
2. [具体的步骤 2]
...

**解除阻塞后**:
- 运行 [命令] 继续任务
```

---

## 项目结构

```
/
├── CLAUDE.md          # 本文件 - 工作流说明
├── task.json          # 任务定义（真实来源）
├── progress.txt       # 每个会话的进度日志
├── init.sh            # 初始化脚本
└── account-app/       # uni-app 应用
    ├── pages/         # 页面
    ├── components/    # 组件
    ├── store/         # Pinia 状态
    ├── utils/         # 工具函数
    ├── uni_modules/   # uniCloud 前端 SDK
    ├── manifest.json  # uni-app 配置
    ├── pages.json     # 页面路由配置
    └── uni.scss       # 全局样式
```

```
└── uniCloud-aliyun/   # uniCloud 后端
    ├── cloudfunctions/    # 云函数
    │   ├── login/         # 微信登录
    │   ├── account/       # 账户管理
    │   ├── category/      # 分类管理
    │   ├── transaction/   # 记账相关
    │   └── statistics/    # 统计分析
    └── database/          # 数据库 Schema
        └── uni-id-co.json # uni-id 配置
```

## 命令

```bash
# 在 account-app/ 中
npm run dev:mp-weixin   # 启动小程序开发
npm run dev:h5          # 启动 H5 开发
npm run build:mp-weixin # 小程序生产构建
npm run build:h5        # H5 生产构建
npm run lint            # 运行 linter
```

## 编码规范

- TypeScript + Vue 3 Composition API
- 使用 `<script setup>` 语法
- UnoCSS 原子化 CSS
- 使用 Pinia 管理状态
- 为新功能编写测试

---

## Key Rules

1. **One task per session** - 每次会话专注于完成一个任务
2. **Test before marking complete** - 所有步骤必须通过测试
3. **Browser/DevTools testing for UI changes** - 新建或大幅修改页面必须在小程序开发工具或浏览器中测试
4. **Document in progress.txt** - 帮助未来的 Agent 了解你的工作
5. **One commit per task** - 所有更改（代码、progress.txt、task.json）必须在同一个 commit 中提交
6. **Never remove tasks** - 只将 `passes: false` 改为 `true`
7. **Stop if blocked** - 需要人工介入时，不要提交，输出阻塞信息并停止

---

## uniCloud 特殊说明

### ⚠️ 云函数开发流程

1. 在 `uniCloud-aliyun/cloudfunctions/` 中创建云函数目录
2. 编写 `index.js`，使用 `exports.main = async (event, context) => {}` 入口
3. **必须创建 `package.json` 文件**，配置云函数名称和依赖
4. 在 HBuilderX 中右键云函数 → "上传部署" → 上传到阿里云
5. 使用 `uniCloud.callFunction()` 测试

**云函数 package.json 模板：**
```json
{
  "name": "functionName",
  "version": "1.0.0",
  "description": "云函数描述",
  "main": "index.js",
  "dependencies": {}
}
```

### ⚠️ 云数据库操作

**重要：延迟初始化数据库连接**
```javascript
// ❌ 错误：模块顶层直接调用（uniCloud 可能未就绪）
const db = uniCloud.database()

// ✅ 正确：使用函数延迟初始化
const getDb = () => {
  if (typeof uniCloud === 'undefined' || !uniCloud.database) {
    throw new Error('uniCloud 未初始化')
  }
  return uniCloud.database()
}
```

**数据隔离设计（createBy 模式）：**
- 用户私有数据：`createBy: user.openid`
- 系统/公共数据：`createBy: ''`（空字符串）
- 查询时使用 `db.command.or()` 合并用户数据和公共数据

```javascript
// 查询用户数据 + 公共数据
collection().where(
  db.command.or([
    { createBy: userOpenid },  // 用户私有数据
    { createBy: '' }           // 公共数据
  ])
)
```

### ⚠️ 微信登录流程

1. 小程序端调用 `uni.login()` 获取 code
2. 云函数使用 `uniCloud.httpclient.request()` 调用微信 API
3. 查询或创建 users 集合记录
4. 返回 openid 和用户信息给前端
5. 前端将 openid 存储到 Pinia + 本地缓存

**云函数调用微信 API 示例：**
```javascript
const apiUrl = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + appid +
               '&secret=' + secret + '&js_code=' + event.code + '&grant_type=authorization_code'
const res = await uniCloud.httpclient.request(apiUrl, {
  method: 'GET',
  dataType: 'json'
})
```

### ⚠️ 游客模式设计

- 新用户首次进入为游客状态（`isGuest: true`）
- 游客可以查看系统默认数据和示例数据
- 记账等写操作需要触发登录授权
- 登录后自动刷新页面数据，显示用户私有数据

### ⚠️ 权限封装设计

**使用 withAuth 高阶函数包装需要登录的 API：**
```javascript
// utils/api-auth.js
export function withAuth(apiFunction, store, options = {}) {
  return async function(...args) {
    const isLoggedIn = await checkLoginBeforeRequest(store, options)
    if (!isLoggedIn) {
      return Promise.reject(new Error('用户未授权'))
    }
    return apiFunction.apply(this, args)
  }
}

// 使用示例
export const addTransaction = withAuth(function(data) {
  return createTransaction(data)
}, store)
```

### ⚠️ 分页处理

uniCloud 使用 `skip()` + `limit()` 进行分页：
```javascript
function convertPagination(pageSize, pageNum) {
  return {
    skip: (pageNum - 1) * pageSize,
    limit: pageSize
  }
}

collection().skip(skip).limit(limit).get()
```
