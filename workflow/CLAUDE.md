# 记账小程序 - 自动化 Debug 工作流

## 项目说明

这是一个**自动化 AI Debug 工作流项目**，基于 Anthropic 的《Effective Harnesses for Long-Running Agents》设计理念。

### 目标应用

**被测试应用**: 记账小程序
- **路径**: `D:/mystudyspace/test/auto-coding-accounting`
- **技术栈**: uni-app + Vue 3 + Pinia + uniCloud
- **平台**: 微信小程序 + H5 + App

### 工作流项目

**本项目**: 自动化 Debug 工作流
- **路径**: `D:/mystudyspace/test/accounting-workflow`
- **目的**: 使用 AI Agent 自动化测试和修复记账小程序的 Bug

---

## 设计理念（基于 Anthropic 研究）

### 核心问题

长运行的 AI Agent 面临以下挑战：

1. **上下文丢失** - 每次 Agent 会话没有之前工作的记忆
2. **过早声明完成** - Agent 倾向于一次性做太多，导致功能未完成
3. **缺少验证** - 代码变更后没有充分测试就标记完成
4. **状态混乱** - 每个 session 结束后留下未完成的代码

### 解决方案

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Agent 工作流架构                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  Initializer    │     │   Debug Agent   │     │   Debug Agent   │       │
│  │     Agent       │────▶│   Session 1     │────▶│   Session 2     │─────▶│
│  │                 │     │                 │     │                 │       │
│  │  首次运行        │     │  测试并修复      │     │  测试并修复      │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│           │                      │                        │                │
│           ▼                      ▼                        ▼                │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  创建 artifacts: │     │  读取 artifacts: │     │  读取 artifacts: │       │
│  │  - task.json    │     │  - progress.txt │     │  - progress.txt │       │
│  │  - init.sh      │     │  - task.json    │     │  - task.json    │       │
│  │  - progress.txt │     │  - git log      │     │  - git log      │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## MANDATORY: Debug Agent Workflow

### Initializer Agent（首次运行）

**运行条件**：首次运行或工作流目录为空时

**职责**：
1. 分析记账小程序的项目结构
2. 创建 `task.json` - 测试场景清单
3. 创建 `init.sh` - 环境初始化脚本
4. 创建 `progress.txt` - 进度追踪文件
5. 初始化 git 仓库

**重要**：`task.json` 一旦创建就**不可修改**（除了更新 `status` 字段）！

---

### Debug Agent（每次 Debug Session）

#### Step 1: 环境准备

```bash
# 确认工作目录
pwd

# 运行初始化脚本
./init.sh
```

`init.sh` 会：
- 切换到记账小程序项目目录
- 安装依赖（如需要）
- 启动开发服务器

#### Step 2: 了解当前状态

```bash
# 查看进度文件
cat progress.txt

# 查看测试场景
cat task.json

# 查看最近的 git 提交
git log --oneline -10
```

#### Step 3: 选择测试场景

从 `task.json` 中选择一个场景来测试：

**选择标准**：
1. 优先级：`critical` > `high` > `medium` > `low`
2. 状态：优先选择 `pending`，其次是 `in_progress`
3. 考虑依赖关系 - 基础功能优先

#### Step 4: 执行测试

**强制使用真实工具进行端到端测试！**

**微信小程序测试**（使用 weixin-devtools MCP）：
```javascript
// 1. 连接开发者工具
await connect_devtools({
  projectPath: "D:/mystudyspace/test/auto-coding-accounting/account-app",
  strategy: "auto"
})

// 2. 获取页面快照
const snapshot = await get_page_snapshot({ format: "compact" })

// 3. 执行操作
await click({ uid: "button-login" })
await input_text({ uid: "input-amount", text: "100" })

// 4. 验证结果
await assert_state({ uid: "user-avatar", visible: true })
await assert_text({ uid: "total-assets", textContains: "1000.00" })

// 5. 断开连接
await disconnect_devtools()
```

**H5 测试**（使用 Playwright MCP）：
```javascript
await browser_navigate({ url: "http://localhost:3000" })
await browser_snapshot()
await browser_click({ ref: "button-submit" })
```

#### Step 5: 处理测试结果

**如果测试通过**：
1. 更新 `task.json` 中场景的 `status` 为 `passed`
2. 在 `progress.txt` 中记录测试通过
3. Git commit

**如果发现 Bug**：
1. 在 `task.json` 中场景的 `bugs` 数组添加 bug 记录
2. 更新场景 `status` 为 `failed`
3. 分析 bug 原因
4. 修复代码
5. 重新测试
6. Bug 修复后，更新 bug 的 `status` 为 `fixed`

#### Step 6: 提交更改

```bash
git add .
git commit -m "[scenario-id] [scenario-name] - 测试通过 / 修复 Bug"
```

---

## 文件说明

### task.json（测试场景清单）

**重要规则**：
- ✅ 可以更新 `status` 字段
- ✅ 可以更新 `bugs` 数组
- ❌ 永远不要删除或修改场景描述
- ❌ 永远不要从列表中移除场景

**结构**：
```json
{
  "version": "1.0.0",
  "project": "accounting-app",
  "project_path": "完整路径",
  "generated_at": "生成时间",
  "scenarios": [
    {
      "id": "unique-id",
      "name": "场景名称",
      "category": "功能分类",
      "priority": "critical|high|medium|low",
      "description": "场景描述",
      "steps": ["步骤1", "步骤2", ...],
      "test_criteria": ["验证点1", "验证点2", ...],
      "status": "pending|in_progress|passed|failed|blocked",
      "bugs": [
        {
          "id": "bug-001",
          "title": "Bug 标题",
          "description": "详细描述",
          "severity": "critical|high|medium|low",
          "status": "open|fixed|verified",
          "found_at": "发现时间",
          "fixed_at": null
        }
      ]
    }
  ]
}
```

### progress.txt（进度追踪）

记录每次 Debug Session 的工作：

```markdown
# 记账小程序 - 自动化 Debug 进度追踪

## [Date] - 场景: [scenario-id] [scenario-name]

### 测试结果: ✅ 通过 / ❌ 失败

### Bug 发现:
- [Bug ID] [Bug 描述]

### 修复内容:
- [具体修改的文件和代码]

### 测试验证:
- [如何测试的，使用什么工具]

### Git Commit:
- [commit message]

### 技术笔记:
- [任何相关的技术说明，供后续 Agent 参考]

---

## 统计信息
- 总场景数: X
- 已测试: Y
- 通过: Z
- 失败/发现 Bug: W
- 阻塞: V
```

### init.sh（环境初始化）

```bash
#!/bin/bash
# 记账小程序 - 自动化 Debug 环境初始化脚本

set -e

PROJECT_DIR="D:/mystudyspace/test/auto-coding-accounting/account-app"

echo "🚀 初始化记账小程序测试环境..."

cd "$PROJECT_DIR"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🔧 启动开发服务器..."
npm run dev:mp-weixin &
DEV_SERVER_PID=$!

sleep 5

echo "✅ 初始化完成！"
echo "📝 开发服务器 PID: $DEV_SERVER_PID"
```

---

## 测试工具

### 微信开发者工具 MCP

**可用命令**：
- `connect_devtools()` - 连接开发者工具
- `get_page_snapshot()` - 获取页面快照
- `click()` - 点击元素
- `input_text()` - 输入文本
- `assert_state()` - 断言元素状态
- `assert_text()` - 断言文本内容
- `navigate_to()` - 页面导航
- `disconnect_devtools()` - 断开连接

### Playwright MCP（H5 测试）

**可用命令**：
- `browser_navigate()` - 导航到 URL
- `browser_snapshot()` - 获取页面快照
- `browser_click()` - 点击元素
- `browser_type()` - 输入文本

---

## Key Rules

1. **One scenario per session** - 每次会话专注于测试一个场景
2. **Real tools for testing** - 必须使用真实工具进行端到端测试
3. **Never skip testing** - 不要跳过测试步骤
4. **Document everything** - 在 progress.txt 中记录所有工作
5. **One commit per session** - 每次会话结束时 git commit
6. **Clean state before leaving** - 确保代码状态干净可提交
7. **Never modify scenario descriptions** - 只更新 status 和 bugs 字段

---

## 被测试应用项目结构

```
D:/mystudyspace/test/auto-coding-accounting/
├── account-app/                    # uni-app 应用
│   ├── pages/                      # 页面
│   ├── components/                 # 组件
│   ├── store/                      # Pinia 状态
│   ├── utils/                      # 工具函数
│   ├── api/                        # API 封装
│   ├── App.vue
│   ├── main.ts
│   ├── manifest.json
│   └── pages.json
│
└── uniCloud-aliyun/                # uniCloud 后端
    ├── cloudfunctions/             # 云函数
    │   ├── login/                  # 微信登录
    │   ├── account/                # 账户管理
    │   ├── category/               # 分类管理
    │   ├── transaction/            # 交易记录
    │   └── statistics/             # 统计分析
    └── database/                   # 数据库 Schema
```

---

## 测试场景分类

### 按功能分类

| 分类 | 场景 ID 范围 | 描述 |
|-----|-------------|------|
| user-auth | init-001, auth-001~003 | 用户认证、登录、权限 |
| home | home-001~004 | 首页功能 |
| transaction | record-001~005 | 记账功能 |
| transaction-list | list-001~004 | 交易列表 |
| transaction-detail | detail-001~003 | 交易详情 |
| account | account-001~005 | 账户管理 |
| category | category-001~005 | 分类管理 |
| statistics | stats-001~003 | 统计分析 |
| balance | balance-001~004 | 余额计算 |
| data | data-001~002 | 数据隔离和同步 |
| cloud | cloud-001~005 | 云函数测试 |
| error | error-001~002 | 异常处理 |
| performance | perf-001 | 性能测试 |

### 按优先级分类

| 优先级 | 数量 | 描述 |
|-------|------|------|
| critical | ~15 | 核心功能，影响用户体验 |
| high | ~20 | 重要功能，频繁使用 |
| medium | ~15 | 辅助功能 |
| low | ~5 | 可选功能 |

---

## 阻塞处理

### 需要停止任务的情况：

1. **环境问题**：
   - 微信开发者工具无法连接
   - uniCloud 服务不可用
   - 开发服务器无法启动

2. **依赖问题**：
   - 需要真实的微信 AppID 和 Secret
   - 需要人工授权的 OAuth 流程
   - 需要付费的服务

3. **测试限制**：
   - 功能需要真实硬件环境
   - 功能依赖外部系统

### 阻塞时的操作：

**DO NOT（禁止）**：
- ❌ 提交 git commit
- ❌ 将场景 status 设为 passed
- ❌ 假装测试通过

**DO（必须）**：
- ✅ 在 progress.txt 中记录阻塞原因
- ✅ 输出清晰的阻塞信息
- ✅ 更新场景 status 为 `blocked`
- ✅ 停止任务

---

## 参考文档

详细的功能模块清单和测试场景设计请参考：

- `docs/功能模块清单.md` - 完整的业务功能模块说明
- `docs/自动化Debug工作流设计.md` - 工作流设计文档

---

## 初始运行提示

如果是第一次运行此工作流：

1. **确认被测试应用存在**
   ```bash
   ls "D:/mystudyspace/test/auto-coding-accounting"
   ```

2. **运行 Initializer Agent**
   - 创建 `task.json` 测试场景清单
   - 创建 `init.sh` 初始化脚本
   - 创建 `progress.txt` 进度文件

3. **开始第一次 Debug Session**
   - 运行 `./init.sh`
   - 选择第一个测试场景
   - 使用微信开发者工具 MCP 执行测试
