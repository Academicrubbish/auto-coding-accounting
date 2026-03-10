# 记账软件 - AI 自动编程工作流

这个目录包含了使用 AI 自动编程方式开发记账应用所需的所有工作流文件。

## 文件说明

| 文件 | 说明 |
|-----|------|
| [CLAUDE.md](CLAUDE.md) | AI Agent 工作流程定义（必读） |
| [architecture.md](architecture.md) | 记账软件架构设计文档 |
| [task.json](task.json) | 任务列表（30 个开发任务） |
| [progress.txt](progress.txt) | 开发进度记录 |
| [init.sh](init.sh) | 项目初始化脚本 |
| [README.md](README.md) | 本文件 |

## 快速开始

### 1. 确认环境

确保已安装：
- [HBuilderX](https://www.dcloud.io/hbuilderx.html) - uni-app 官方 IDE
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- Node.js 18+
- uniCloud 阿里云空间

### 2. 初始化项目

```bash
cd accounting-workflow
./init.sh
```

脚本会引导你：
1. 使用 HBuilderX 创建 uni-app 项目
2. 安装依赖（UnoCSS、Pinia 等）
3. 创建必要的配置文件

### 3. 开始 AI 自动编程

使用 Claude Code 或类似工具，让 AI 按照 [CLAUDE.md](CLAUDE.md) 中定义的工作流自动开发：

```
1. AI 读取 task.json 选择下一个任务
2. AI 实现任务
3. AI 测试验证
4. AI 更新 progress.txt
5. AI 提交 git commit
6. 重复以上步骤
```

## 项目技术栈

| 层级 | 技术选型 |
|-----|---------|
| 前端框架 | uni-app (Vue 3 + TypeScript) |
| UI 样式 | UnoCSS |
| 状态管理 | Pinia |
| 后端 | uniCloud 云函数 (阿里云) |
| 数据库 | uniCloud 云数据库 |
| 认证 | 微信小程序授权登录 |
| 目标平台 | 微信小程序 + H5 |

## 核心功能

- ✅ 微信授权登录
- ✅ 记账功能（收入/支出）
- ✅ 分类管理
- ✅ 账户管理
- ✅ 交易记录列表
- ✅ 基础统计分析

## 任务列表概览

| 阶段 | 任务数 | 内容 |
|-----|-------|------|
| 基础配置 | 5 | 项目初始化、uniCloud 配置、数据库设计 |
| 云函数开发 | 6 | 登录、账户、分类、交易、统计云函数 |
| 前端开发 | 17 | 登录、首页、记账、列表、统计、管理等页面 |
| 优化测试 | 2 | 错误处理、完整测试 |

查看 [task.json](task.json) 了解完整任务列表。

## 开发规范

### 代码风格
- TypeScript + Vue 3 Composition API
- 使用 `<script setup>` 语法
- UnoCSS 原子化 CSS
- Pinia 状态管理

### Git 提交规范
每个任务完成后，一次性提交所有更改：
```bash
git add .
git commit -m "[任务名称] - completed"
```

### 测试要求
- 小程序开发工具中测试
- H5 浏览器中测试
- 云函数在云端测试

## 注意事项

1. **微信小程序配置**
   - 需要在微信小程序后台配置 AppID 和 Secret
   - 需要在 uniCloud 控制台配置微信登录参数

2. **uniCloud 空间**
   - 需要创建阿里云 uniCloud 空间
   - 云函数需要上传到云端才能测试

3. **HBuilderX 使用**
   - 推荐使用 HBuilderX 开发 uni-app 项目
   - 可以直接在 HBuilderX 中上传云函数

## 进度追踪

所有开发进度记录在 [progress.txt](progress.txt) 中，包括：
- 每个任务的完成情况
- 测试结果
- 遇到的问题和解决方案

## 原理说明

这个工作流基于以下理念：
1. **任务驱动**：将复杂项目拆解为 30+ 个小任务
2. **自动化优先**：让 AI 完成大部分编码工作
3. **测试验证**：每个任务完成后必须测试验证
4. **可追溯**：所有工作内容都有记录

相关工作流灵感来自 [Anthropic 的文章](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)。

## 许可

本项目所有配置文件由 AI 生成，可自由使用和修改。
