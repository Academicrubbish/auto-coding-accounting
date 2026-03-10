# 微信开发者工具 MCP 连接流程完整指南

**文档用途**: 本文档用于在 Claude AI 窗口关闭后重新打开时，快速学习如何连接微信开发者工具 MCP 进行自动化测试。

**最后更新**: 2026-03-06
**测试环境**: Windows 11, 微信开发者工具 CLI, weixin-devtools-mcp

---

## 📋 目录

1. [快速开始](#快速开始)
2. [环境准备](#环境准备)
3. [连接步骤](#连接步骤)
4. [验证连接](#验证连接)
5. [常用操作](#常用操作)
6. [常见问题排查](#常见问题排查)
7. [完整测试示例](#完整测试示例)

---

## 🚀 快速开始

### 最简连接流程（3步完成）

```bash
# Step 1: 启动自动化服务
start "" "D:/Program Files/微信web开发者工具/cli.bat" auto --project="d:/mystudyspace/test/auto-coding-accounting/unpackage/dist/dev/mp-weixin" --auto-port=9420

# Step 2: 等待3-5秒后验证端口
netstat -ano | findstr :9420
# 应该看到: TCP    0.0.0.0:9420    LISTENING    [PID]

# Step 3: 通过 MCP 连接（在 Claude 中使用工具）
mcp__weixin-devtools__connect_devtools({
  strategy: "wsEndpoint",
  wsEndpoint: "ws://127.0.0.1:9420"
})
```

**预期成功输出**:
```
✅ 连接成功
连接ID: conn_xxx
策略: wsEndpoint
连接状态: connected
健康检查: healthy
当前页面: pages/index/index
```

---

## 🛠️ 环境准备

### 前置条件检查清单

| 检查项 | 验证命令/方法 | 预期结果 |
|-------|-------------|---------|
| 微信开发者工具已安装 | `dir "D:/Program Files/微信web开发者工具/cli.bat"` | 文件存在 |
| 项目已编译 | 检查 `unpackage/dist/dev/mp-weixin/` 目录 | 包含 app.json |
| 服务端口已开启 | 微信开发者工具 → 设置 → 安全设置 | 服务端口: 开启 |
| MCP 工具可用 | Claude 中检查可用工具列表 | mcp__weixin-devtools__* 存在 |
| 端口 9420 空闲 | `netstat -ano \| findstr :9420` | 无输出或无 LISTENING |

### 微信开发者工具配置

**必须开启服务端口**：

1. 打开微信开发者工具
2. 顶部菜单 → **设置**
3. **安全设置** 标签页
4. 找到 **服务端口**
5. 切换为 **开启**

```
⚠️ 如果服务端口未开启，所有自动化操作将失败
```

### 项目路径配置

本项目使用的路径：

```bash
# 微信开发者工具 CLI 路径
D:/Program Files/微信web开发者工具/cli.bat

# 项目编译输出路径
d:/mystudyspace/test/auto-coding-accounting/unpackage/dist/dev/mp-weixin

# 自动化端口（可自定义，建议使用 9420）
9420

# HTTP 服务端口（固定，不可更改）
27902
```

---

## 🔗 连接步骤

### Step 1: 启动自动化服务

**方法 A: 后台启动（推荐）**

```bash
# Windows
start "" "D:/Program Files/微信web开发者工具/cli.bat" auto --project="d:/mystudyspace/test/auto-coding-accounting/unpackage/dist/dev/mp-weixin" --auto-port=9420
```

**方法 B: 前台启动（用于调试）**

```bash
"D:/Program Files/微信web开发者工具/cli.bat" auto --project="d:/mystudyspace/test/auto-coding-accounting/unpackage/dist/dev/mp-weixin" --auto-port=9420
```

**命令参数说明**:

| 参数 | 说明 | 示例值 |
|-----|------|--------|
| `auto` | 启动自动化模式 | 固定值 |
| `--project` | 小程序项目路径 | 完整路径，使用正斜杠 |
| `--auto-port` | 自动化服务端口 | 9420（默认不自动启动） |

**预期输出**:
```
✔ auto
```

### Step 2: 验证服务启动

等待 3-5 秒后检查端口：

```bash
netstat -ano | findstr :9420
```

**成功输出示例**:
```
TCP    0.0.0.0:9420           0.0.0.0:0              LISTENING       7500
TCP    [::]:9420              [::]:0                 LISTENING       7500
```

**输出说明**:
- `0.0.0.0:9420` - IPv4 监听
- `[::]:9420` - IPv6 监听
- `LISTENING` - 端口正在监听
- `7500` - 进程 ID（可用于终止进程）

### Step 3: 通过 MCP 连接

在 Claude 中使用 MCP 工具：

```typescript
// 使用 WebSocket 端点连接（推荐）
await mcp__weixin-devtools__connect_devtools({
  strategy: "wsEndpoint",
  wsEndpoint: "ws://127.0.0.1:9420"
})
```

**连接策略对比**:

| 策略 | 适用场景 | 成功率 | 备注 |
|-----|---------|-------|------|
| `wsEndpoint` | Windows 推荐 | ⭐⭐⭐⭐⭐ | 需要先手动启动自动化服务 |
| `auto` | 首次连接 | ⭐⭐⭐ | Windows 可能有 spawn 问题 |
| `connect` | 已运行的开发工具 | ⭐⭐⭐⭐ | 需要开发工具已打开项目 |
| `launch` | 启动新实例 | ⭐⭐ | Windows 可能有 spawn 问题 |

### Step 4: 验证连接成功

连接成功后会返回：

```json
{
  "status": "connected",
  "connectionId": "conn_1772766139035_w56e7xsx",
  "strategy": "wsEndpoint",
  "healthCheck": "healthy",
  "currentPage": "pages/index/index"
}
```

---

## ✅ 验证连接

### 基础验证

**1. 获取当前页面**

```typescript
await mcp__weixin-devtools__get_current_page({})
```

**预期输出**:
```json
{
  "page": "pages/index/index",
  "query": {}
}
```

**2. 获取页面快照**

```typescript
await mcp__weixin-devtools__get_page_snapshot({
  format: "compact"
})
```

**预期输出**:
```
📊 页面快照获取成功
   页面路径: pages/index/index
   元素数量: 49
   输出格式: compact

# Page: pages/index/index
# Elements: 49

uid=view.home-container_总资产000本月 view "总资产\n¥0.00\n...
uid=text.asset-label_总资产 text "总资产" pos=[174,31] size=[42x18]
uid=button.action-btn_记支出 button "💸\n记支出" pos=[15,193] size=[175x52]
...
```

**3. 检查连接状态**

```typescript
await mcp__weixin-devtools__get_connection_status({})
```

**预期输出**:
```json
{
  "status": "connected"
}
```

### 完整验证测试

```typescript
// 完整验证流程
async function verifyConnection() {
  // 1. 检查连接状态
  const status = await mcp__weixin-devtools__get_connection_status({})
  console.log("连接状态:", status.status)
  // 应该输出: connected

  // 2. 获取当前页面
  const page = await mcp__weixin-devtools__get_current_page({})
  console.log("当前页面:", page.page)
  // 应该输出类似: pages/index/index

  // 3. 获取页面快照
  const snapshot = await mcp__weixin-devtools__get_page_snapshot({
    format: "compact"
  })
  console.log("元素数量:", snapshot.snapshot.elementCount)
  // 应该输出一个数字，如: 49

  console.log("✅ MCP 连接验证通过!")
}
```

---

## 🎮 常用操作

### 页面导航

**跳转到新页面**

```typescript
await mcp__weixin-devtools__navigate_to({
  url: "pages/record/index?type=expense"
})
```

**返回上一页**

```typescript
await mcp__weixin-devtools__navigate_back({})
```

**切换 TabBar**

```typescript
await mcp__weixin-devtools__switch_tab({
  url: "pages/stats/index"
})
```

**重新启动应用**

```typescript
await mcp__weixin-devtools__relaunch({
  url: "pages/index/index"
})
```

### 元素操作

**查找元素**

```typescript
// 查找单个元素
const elements = await mcp__weixin-devtools__query_selector({
  selector: ".submit-btn",
  single: true
})

// 查找多个元素
const allButtons = await mcp__weixin-devtools__query_selector({
  selector: "button",
  single: false
})
```

**点击元素**

```typescript
await mcp__weixin-devtools__click({
  uid: "button.action-btn_记支出",
  waitAfter: 500  // 点击后等待 500ms
})
```

**输入文本**

```typescript
await mcp__weixin-devtools__input_text({
  uid: "input.amount",
  text: "99.99",
  replace: true  // 替换现有文本
})
```

**获取元素值**

```typescript
const value = await mcp__weixin-devtools__get_value({
  uid: "text.asset-value_000",
  property: "text"  // 或 "value" 用于输入框
})
```

### 等待操作

**等待元素状态**

```typescript
await mcp__weixin-devtools__wait_for({
  selector: ".submit-btn",
  state: "visible",  // visible, enabled, hidden, disabled
  timeout: 5000  // 5秒超时
})
```

### 脚本执行

**执行 JavaScript**

```typescript
const result = await mcp__weixin-devtools__evaluate_script({
  script: "return wx.getStorageSync('user')"
})
```

---

## 🧪 完整测试示例

### 示例 1: 登录流程测试

```typescript
async function testLoginFlow() {
  console.log("开始测试登录流程...")

  // 1. 获取当前页面
  const page = await mcp__weixin-devtools__get_current_page({})
  console.log("当前页面:", page.page)

  // 2. 获取页面快照
  const snapshot = await mcp__weixin-devtools__get_page_snapshot({
    format: "compact"
  })
  console.log("页面元素数量:", snapshot.snapshot.elementCount)

  // 3. 查找登录按钮
  const loginBtn = await mcp__weixin-devtools__query_selector({
    selector: ".empty-btn",
    single: true
  })

  if (loginBtn.structuredContent.text) {
    const uid = loginBtn.structuredContent.text.match(/uid=([^\s]+)/)[1]
    console.log("找到登录按钮:", uid)

    // 4. 点击登录按钮
    await mcp__weixin-devtools__click({
      uid: uid,
      waitAfter: 1000
    })

    // 5. 等待跳转
    await mcp__weixin-devtools__wait_for({
      selector: ".login-container",
      state: "visible",
      timeout: 5000
    })

    // 6. 验证当前页面
    const newPage = await mcp__weixin-devtools__get_current_page({})
    console.log("跳转后页面:", newPage.page)
    // 应该输出: pages/login/index
  }

  console.log("✅ 登录流程测试完成")
}
```

### 示例 2: TabBar 切换测试

```typescript
async function testTabBarSwitch() {
  console.log("开始测试 TabBar 切换...")

  const tabs = [
    { url: "pages/index/index", name: "首页" },
    { url: "pages/stats/index", name: "统计" },
    { url: "pages/mine/index", name: "我的" }
  ]

  for (const tab of tabs) {
    console.log(`切换到 ${tab.name}...`)

    // 切换 Tab
    await mcp__weixin-devtools__switch_tab({
      url: tab.url
    })

    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 验证当前页面
    const page = await mcp__weixin-devtools__get_current_page({})
    console.log(`  当前页面: ${page.page}`)

    if (page.page === tab.url) {
      console.log(`  ✅ ${tab.name} 切换成功`)
    } else {
      console.log(`  ❌ ${tab.name} 切换失败`)
    }
  }

  console.log("✅ TabBar 切换测试完成")
}
```

### 示例 3: 记账功能测试

```typescript
async function testRecordTransaction() {
  console.log("开始测试记账功能...")

  // 1. 导航到记账页
  await mcp__weixin-devtools__navigate_to({
    url: "pages/record/index?type=expense"
  })

  // 2. 等待页面加载
  await mcp__weixin-devtools__wait_for({
    selector: ".amount-input",
    state: "visible",
    timeout: 5000
  })

  // 3. 获取页面快照查找输入框
  const snapshot = await mcp__weixin-devtools__get_page_snapshot({
    format: "compact"
  })

  // 4. 输入金额（假设找到了金额输入框的 UID）
  // await mcp__weixin-devtools__input_text({
  //   uid: "input.amount",
  //   text: "88.88",
  //   replace: true
  // })

  console.log("✅ 记账功能测试完成")
}
```

---

## 🔍 常见问题排查

### 问题 1: 端口 9420 未监听

**症状**:
```bash
netstat -ano | findstr :9420
# 无输出
```

**原因**: 自动化服务未启动或启动失败

**解决方案**:

1. 检查项目路径是否正确
2. 确保微信开发者工具已安装
3. 手动启动服务并查看错误信息：
```bash
"D:/Program Files/微信web开发者工具/cli.bat" auto --project="d:/mystudyspace/test/auto-coding-accounting/unpackage/dist/dev/mp-weixin" --auto-port=9420
```

### 问题 2: MCP 连接超时

**症状**:
```
WebSocket服务启动超时，端口: 9420
```

**解决方案**:

1. 确认自动化服务已启动
2. 检查端口是否正确：
```bash
netstat -ano | findstr :9420
```

3. 尝试更换端口：
```bash
# 终止现有服务
taskkill /PID [进程ID] /F

# 使用新端口启动
start "" "D:/Program Files/微信web开发者工具/cli.bat" auto --project="..." --auto-port=9421

# 连接到新端口
mcp__weixin-devtools__connect_devtools({
  strategy: "wsEndpoint",
  wsEndpoint: "ws://127.0.0.1:9421"
})
```

### 问题 3: 页面快照无 UID 信息

**症状**:
```
get_page_snapshot 返回的元素没有 uid
```

**原因**: MCP 服务器版本问题

**解决方案**:

确保使用修复版的 MCP 服务器：
1. 检查本地修复版本路径
2. 确认 `server.ts` 中包含 UID 显示修复
3. 重新构建 MCP 服务器

### 问题 4: 点击操作无响应

**症状**:
```typescript
await mcp__weixin-devtools__click({ uid: "..." })
// 返回成功，但页面无变化
```

**解决方案**:

1. 验证 UID 是否正确：
```typescript
const snapshot = await mcp__weixin-devtools__get_page_snapshot({
  format: "compact"
})
// 检查 UID 是否在快照中
```

2. 等待元素可点击：
```typescript
await mcp__weixin-devtools__wait_for({
  selector: ".target-element",
  state: "enabled",
  timeout: 5000
})
```

3. 增加点击后等待时间：
```typescript
await mcp__weixin-devtools__click({
  uid: "...",
  waitAfter: 1000  // 等待 1 秒
})
```

### 问题 5: 连接断开

**症状**:
```
{"status": "disconnected"}
```

**解决方案**:

1. 重新连接：
```typescript
await mcp__weixin-devtools__reconnect_devtools({})
```

2. 如果重新连接失败，重新启动自动化服务并连接：
```bash
# 终止旧服务
taskkill /PID [进程ID] /F

# 启动新服务
start "" "D:/Program Files/微信web开发者工具/cli.bat" auto --project="..." --auto-port=9420

# 重新连接
await mcp__weixin-devtools__connect_devtools({
  strategy: "wsEndpoint",
  wsEndpoint: "ws://127.0.0.1:9420"
})
```

---

## 📊 操作速查表

### 连接相关

| 操作 | 工具 | 参数 |
|-----|------|------|
| 连接 | `connect_devtools` | `{strategy, wsEndpoint}` |
| 断开 | `disconnect_devtools` | `{}` |
| 重新连接 | `reconnect_devtools` | `{}` |
| 连接状态 | `get_connection_status` | `{}` |

### 页面操作

| 操作 | 工具 | 参数 |
|-----|------|------|
| 获取当前页 | `get_current_page` | `{}` |
| 获取快照 | `get_page_snapshot` | `{format}` |
| 导航 | `navigate_to` | `{url}` |
| 返回 | `navigate_back` | `{}` |
| 切换 Tab | `switch_tab` | `{url}` |
| 重启 | `relaunch` | `{url}` |

### 元素操作

| 操作 | 工具 | 参数 |
|-----|------|------|
| 查找元素 | `query_selector` | `{selector, single}` |
| 点击 | `click` | `{uid, waitAfter}` |
| 输入 | `input_text` | `{uid, text, replace}` |
| 获取值 | `get_value` | `{uid, property}` |
| 等待 | `wait_for` | `{selector, state, timeout}` |
| 执行脚本 | `evaluate_script` | `{script}` |

### 断言操作

| 操作 | 工具 | 参数 |
|-----|------|------|
| 文本断言 | `assert_text` | `{uid, text, matchType}` |
| 属性断言 | `assert_attribute` | `{uid, attribute, value}` |
| 状态断言 | `assert_state` | `{uid, state}` |

---

## 📝 最佳实践

### 1. 连接管理

```typescript
// 每次会话开始时建立连接
async function initConnection() {
  // 检查连接状态
  const status = await mcp__weixin-devtools__get_connection_status({})

  if (status.status !== "connected") {
    // 重新连接
    await mcp__weixin-devtools__connect_devtools({
      strategy: "wsEndpoint",
      wsEndpoint: "ws://127.0.0.1:9420"
    })
  }

  console.log("✅ MCP 连接已就绪")
}
```

### 2. 错误处理

```typescript
async function safeClick(uid) {
  try {
    await mcp__weixin-devtools__click({ uid })
    return true
  } catch (error) {
    console.error("点击失败:", error.message)
    return false
  }
}
```

### 3. 等待模式

```typescript
// 使用 wait_for 确保元素就绪
async function clickWhenReady(selector) {
  await mcp__weixin-devtools__wait_for({
    selector,
    state: "visible",
    timeout: 5000
  })

  const elements = await mcp__weixin-devtools__query_selector({
    selector,
    single: true
  })

  await mcp__weixin-devtools__click({
    uid: elements.uid,
    waitAfter: 500
  })
}
```

---

## 🎯 总结

### 快速检查清单

使用 MCP 前确保：

- [ ] 微信开发者工具服务端口已开启
- [ ] 项目已编译到 `unpackage/dist/dev/mp-weixin`
- [ ] 自动化服务已启动（端口 9420 监听中）
- [ ] MCP 工具在 Claude 中可用

### 连接流程总结

```
1. 启动自动化服务 (CLI auto 命令)
   ↓
2. 验证端口监听 (netstat 检查)
   ↓
3. MCP 连接 (connect_devtools)
   ↓
4. 验证连接 (get_current_page + get_page_snapshot)
   ↓
5. 开始自动化测试
```

---

## 📚 相关文档

- [MCP 调试工作流](./debug-workflow.md) - 完整的测试用例和工作流程
- [调试报告](./debug-report.md) - 历史测试结果和问题修复记录
- [CLAUDE.md](../CLAUDE.md) - 项目上下文和技术文档

---

**文档维护**: 本文档应随着 MCP 工具更新和项目变化保持同步。
**问题反馈**: 如遇到文档未覆盖的问题，请记录到 `progress.txt`。
