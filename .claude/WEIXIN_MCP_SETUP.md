# 微信小程序 MCP 调试工具配置说明

## 已配置文件

`.claude/mcp_config.json` 已创建，配置了 `weixin-devtools-mcp` 服务。

## 使用步骤

### 1. 确认微信开发者工具 CLI 路径

在 Windows 上，微信开发者工具 CLI 的常见路径：
- `C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat`
- 自定义安装位置

**查找 CLI 路径的方法：**
```powershell
# 在 PowerShell 或 CMD 中运行
where cli.bat
# 或在 Git Bash 中运行
ls "/c/Program Files (x86)/Tencent/微信web开发者工具/"
```

### 2. 启动微信开发者工具

在启动 MCP 连接之前，需要先在微信开发者工具中打开项目：

1. 打开微信开发者工具
2. 导入项目：选择 `unpackage/dist/dev/mp-weixin` 目录
3. 确保项目可以正常编译运行
4. **重要**：打开"服务端口"（设置 → 安全设置 → 服务端口 → 开启）

### 3. 启用 MCP 服务

MCP 配置已添加到项目中的 `.claude/mcp_config.json`。

**Claude Code 扩展会自动读取这个配置。**

重启 VSCode 或重新加载 Claude Code 扩展以加载 MCP 配置。

## MCP 工具列表

配置成功后，可使用以下工具（共 27 个）：

### 连接工具
- `mp_ensureConnection` - 确保自动化会话已准备就绪

### 导航工具
- `mp_navigate` - 在小程序内导航（支持 navigateTo, redirectTo, reLaunch, switchTab, navigateBack）

### 截图与调试工具
- `mp_screenshot` - 捕获并返回/保存截图
- `mp_getLogs` - 获取控制台日志（可选择获取后清空）

### API 工具
- `mp_callWx` - 调用微信小程序 API 方法（如 wx.showToast）

### 页面工具
- `page_getElement` - 通过选择器获取页面元素
- `page_waitElement` - 等待元素出现
- `page_waitTimeout` - 等待指定毫秒数
- `page_getData` - 获取当前页面数据对象
- `page_setData` - 使用 setData 更新页面数据
- `page_callMethod` - 调用页面实例上暴露的方法

### 网络监控
- 自动监控 wx.request, wx.uploadFile, wx.downloadFile

### 断言工具
- 元素存在性、可见性、文本、属性、状态断言

## 配置参数说明

| 参数 | 值 | 说明 |
|------|-----|------|
| `--projectPath` | `D:\mystudyspace\test\auto-coding-accounting\unpackage\dist\dev\mp-weixin` | 小程序项目路径（编译输出目录）|
| `--port` | `9420` | WebSocket 端口号 |
| `--timeout` | `60000` | 连接超时时间（毫秒）|

## 高级配置

如果需要指定微信开发者工具 CLI 路径，可以添加 `--cliPath` 参数：

```json
{
  "mcpServers": {
    "weixin-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "weixin-devtools-mcp",
        "--projectPath=D:\\mystudyspace\\test\\auto-coding-accounting\\unpackage\\dist\\dev\\mp-weixin",
        "--cliPath=C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat",
        "--port=9420",
        "--timeout=60000"
      ]
    }
  }
}
```

## 测试 MCP 连接

配置完成后，在 Claude Code 中尝试调用：

```
请确保与微信小程序的自动化连接已建立
```

或

```
请截取当前小程序页面的屏幕截图
```

## 项目信息

- **AppID**: wx07932ea2cbbef4c2
- **项目名**: Accounting
- **编译输出**: unpackage/dist/dev/mp-weixin/

## 参考资源

- [wooter-s/weixin-devtools-mcp](https://github.com/wooter-s/weixin-devtools-mcp)
- [微信小程序自动化官方文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/automator.html)
