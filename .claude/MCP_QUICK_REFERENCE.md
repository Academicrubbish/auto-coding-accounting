# MCP WeChat DevTools - Quick Reference

> Fast reference guide for WeChat Mini Program automation via MCP

---

## One-Page Summary

### Connection (Most Common)

```bash
# Terminal: Start automation service
"D:/Program Files/微信web开发者工具/cli.bat" auto --project="d:/mystudyspace/test/auto-coding-accounting/unpackage/dist/dev/mp-weixin" --auto-port=9420
```

```typescript
// MCP: Connect
connect_devtools({ strategy: "wsEndpoint", wsEndpoint: "ws://127.0.0.1:9420" })
```

### Prerequisites Checklist

| # | Item | Check |
|---|------|-------|
| 1 | DevTools installed | `cli.bat --version` |
| 2 | Project built | HBuilderX → 运行到小程序 |
| 3 | Service port enabled | 设置 → 安全设置 → 服务端口 → 开启 |
| 4 | DevTools open | With project loaded |
| 5 | No compile errors | Simulator shows app |
| 6 | Automation port free | `netstat -ano \| findstr :9420` |

### Common Issues

| Issue | Solution |
|-------|----------|
| Connection timeout | Run `cli auto --project=... --auto-port=9420` |
| spawn EINVAL (Windows) | Use wsEndpoint strategy |
| UID not displayed | Restart VSCode after MCP rebuild |
| Port 9420 in use | `taskkill /PID <PID> /F` |

### Tool Reference

```typescript
// Connection
connect_devtools({ strategy: "wsEndpoint", wsEndpoint: "ws://127.0.0.1:9420" })
get_connection_status({})

// Page operations
get_page_snapshot({ format: "compact" })
click({ uid: "button.submit" })
input_text({ uid: "input.amount", text: "99.99" })
get_value({ uid: "text.balance", property: "text" })
wait_for({ selector: ".result", state: "visible", timeout: 5000 })

// Navigation
navigate_to({ url: "pages/record/index" })
navigate_back({})
switch_tab({ url: "pages/list/index" })

// Assertions
assert_text({ uid: "text.title", text: "记账助手", matchType: "exact" })
assert_state({ uid: "button.submit", state: "enabled" })
```

### Port Information

- **HTTP Service Port**: 27902 (DevTools HTTP API)
- **Automation Port**: 9420 (miniprogram-automator WebSocket)
- These are **different services** - automation must be started manually

---

## Complete Workflow Example

```typescript
// 1. Start automation service (run in terminal)
// "D:/Program Files/微信web开发者工具/cli.bat" auto --project=..." --auto-port=9420

// 2. Connect
await connect_devtools({ strategy: "wsEndpoint", wsEndpoint: "ws://127.0.0.1:9420" })

// 3. Get current page
const page = await get_current_page({})
console.log("Current:", page.page)

// 4. Get snapshot to find UIDs
const snapshot = await get_page_snapshot({ format: "compact" })

// 5. Navigate to record page
await navigate_to({ url: "pages/record/index?type=expense" })

// 6. Wait for element
await wait_for({ selector: ".amount-input", state: "visible" })

// 7. Input amount
await input_text({ uid: "input.amount", text: "88.88" })

// 8. Click element
await click({ uid: "view.category-picker" })

// 9. Submit
await click({ uid: "button.submit" })

// 10. Verify result
await wait_for({ selector: ".transaction-list", state: "visible", timeout: 5000 })
```

---

## Windows-Specific Tips

### Path Format
Use forward slashes in JSON configs:
```json
{
  "args": [
    "d:/mystudyspace/test/temp/weixin-mcp/build/server.js",
    "--projectPath=D:/mystudyspace/test/auto-coding-accounting/unpackage/dist/dev/mp-weixin",
    "--cliPath=D:/Program Files/微信web开发者工具/cli.bat"
  ]
}
```

### CLI Location
Default: `C:\Program Files\微信web开发者工具\cli.bat`

### Spawn Bug Fix
Edit `d:/mystudyspace/test/temp/weixin-mcp/src/tools.ts` line 769:
```typescript
const process = spawn(cliPath, args, {
  shell: globalThis.process.platform === 'win32',  // ADD THIS
  stdio: ['ignore', 'pipe', 'pipe']
});
```

---

## Debug Commands

```bash
# Check port usage
netstat -ano | findstr :9420

# Kill process
taskkill /PID <PID> /F

# Test CLI
"D:/Program Files/微信web开发者工具/cli.bat" --version

# Start automation
"D:/Program Files/微信web开发者工具/cli.bat" auto --project="..." --auto-port=9420
```

---

## Global Config Location

File: `c:\Users\yuanc\.claude.json`

```json
{
  "mcpServers": {
    "weixin-devtools": {
      "type": "stdio",
      "command": "node",
      "args": [
        "d:/mystudyspace/test/temp/weixin-mcp/build/server.js",
        "--projectPath=D:/mystudyspace/test/auto-coding-accounting/unpackage/dist/dev/mp-weixin",
        "--cliPath=D:/Program Files/微信web开发者工具/cli.bat",
        "--port=27902",
        "--timeout=60000"
      ]
    }
  }
}
```

---

## MCP Server Location

Fixed version: `d:/mystudyspace/test/temp/weixin-mcp/`

Repository: https://github.com/wooter-s/weixin-devtools-mcp

---

## Tips

1. **Always start automation service first** - `cli auto --project=... --auto-port=9420`
2. **Use wsEndpoint strategy on Windows** - Avoids spawn bug
3. **Wait for elements** - Use `wait_for` before interaction
4. **Restart VSCode after MCP rebuild** - Required for changes to take effect
5. **Check connection status** - Use `get_connection_status` to verify
