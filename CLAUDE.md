# Accounting App - Project Context

## Project Overview
- **Name**: 记账助手 (Accounting Assistant)
- **Framework**: uni-app (Vue 3 + TypeScript)
- **Cloud**: uniCloud (阿里云 Aliyun)
- **Platform**: WeChat Mini Program (微信小程序)
- **AppID**: wx07932ea2cbbef4c2

## Tech Stack

### Frontend
- **Vue 3**: Composition API with `<script setup lang="ts">`
- **Pinia**: State management (stores: user, account, category, transaction)
- **z-paging**: Pagination component for lists
- **uni-datetime-picker**: Date/time selection component

### Backend
- **Cloud Functions** (uniCloud-aliyun/cloudfunctions/):
  - `login` - WeChat login with openid
  - `transaction` - Transaction CRUD with auto balance updates
  - `account` - Account management
  - `category` - Category management (public + user categories)
  - `statistics` - Overview, monthly, category stats
  - `common/check-auth` - Authentication utilities

### Key Architecture Patterns

#### Vue3 Script Setup Pattern
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'  // uni-app lifecycle
```

#### z-paging Usage
```vue
<z-paging
  ref="pagingRef"
  v-model="transactions"
  @query="queryList"
  :use-page-scroll="false"
  :show-default-empty-view="false"
>
  <template #top><!-- Always visible --></template>
  <template #empty><!-- Custom empty state --></template>
  <!-- List content -->
</z-paging>
```

#### Cloud Function Call Pattern
```typescript
const res = await uniCloud.callFunction({
  name: 'transaction',
  data: {
    action: 'list',
    openid: userStore.openid,
    data: { page, pageSize }
  }
})
```

## Page Structure

| Page | Path | Purpose |
|------|------|---------|
| Home | `/pages/index/index` | Overview stats + recent transactions |
| List | `/pages/list/index` | Filterable transaction list |
| Record | `/pages/record/index` | Add transaction |
| Detail | `/pages/detail/index` | Transaction detail/edit/delete |
| Account | `/pages/account/index` | Account management |
| Account Edit | `/pages/account/edit` | Add/edit account |
| Category | `/pages/category/index` | Category management |
| Category Edit | `/pages/category/edit` | Add/edit category |
| Stats | `/pages/stats/index` | Monthly statistics & charts |
| Mine | `/pages/mine/index` | User profile |
| Settings | `/pages/settings/index` | Settings + export/import |
| Login | `/pages/login/index` | WeChat login |

## Authentication
- **Custom openid-based** (not uni-id)
- **Guest mode**: Visitors can browse with empty state prompts
- **Cache**: Uses `utils/auth-cache.ts` for persistence
- **Store**: `store/user.ts` with Pinia

## Data Models

### Transaction
- `_id`, `user_id`, `account_id`, `category_id`
- `type`: 'expense' | 'income' | 'transfer'
- `amount`, `remark`, `images`
- `transaction_date`, `created_at`, `updated_at`

### Account
- `_id`, `user_id`, `name`, `type` (cash/bank/credit/other)
- `balance`, `icon`, `sort_order`, `is_default`
- `create_by`: openid (owner)

### Category
- `_id`, `name`, `type` (expense/income)
- `icon`, `color`, `sort_order`, `is_default`
- `create_by`: openid OR 'common' (public categories)

## Recent Fixes
1. **Transaction cloud function**: Removed duplicate `categoryIds` declaration (line 129)
2. **App.vue**: Added `import { nextTick } from 'vue'`
3. **Pages**: Converted `slot=""` to `<template #>` syntax
4. **Pages**: Removed undefined `slotIsLoadFailed` variable

## Known Issues
- None currently

## Development Commands
- Build: HBuilderX → 运行 → 运行到小程序模拟器
- Cloud: uniCloud → 云端一体云函数上传部署

## File Locations
- Pages: `pages/*/index.vue`
- Store: `store/*.ts`
- Utils: `utils/*.ts`
- Cloud Functions: `uniCloud-aliyun/cloudfunctions/*/index.js`
- Components: `uni_modules/z-paging/`, `uni_modules/uni-datetime-picker/`
- Build Output: `unpackage/dist/dev/mp-weixin/` (WeChat DevTools opens this path)

## WeChat Mini Program MCP Debugging

### MCP Server: weixin-devtools-mcp (FIXED VERSION)

**Repository**: [wooter-s/weixin-devtools-mcp](https://github.com/wooter-s/weixin-devtools-mcp)

**Local Fixed Version**: `d:/mystudyspace/test/temp/weixin-mcp/`

**Fix Applied**: Added `shell: globalThis.process.platform === 'win32'` to spawn() call in `src/tools.ts` line 769

**Configuration File**: `c:\Users\yuanc\.claude.json` (global)

**Current Config (Updated 2026-03-05)**:
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

### Prerequisites for MCP Connection
1. WeChat DevTools must be **OPEN** with project loaded
2. **Service Port must be ENABLED**: 设置 → 安全设置 → 服务端口 → 开启
3. Mini program must be **RUNNING** (not compile error state)
4. **Automation service must be started**: Run `cli auto` command first

### Connection Steps

#### Step 1: Start Automation Service
```bash
"D:/Program Files/微信web开发者工具/cli.bat" auto --project="d:/mystudyspace/test/auto-coding-accounting/unpackage/dist/dev/mp-weixin" --auto-port=9420
```

This will:
- Start automation service on port 9420
- Open a new DevTools window if needed
- Output: `✔ auto`

#### Step 2: Connect via MCP
```json
{
  "strategy": "wsEndpoint",
  "wsEndpoint": "ws://127.0.0.1:9420"
}
```

### Available MCP Tools (20 tools - core profile)

**Connection**:
- `connect_devtools` - Connect to WeChat DevTools
- `disconnect_devtools` - Disconnect from DevTools
- `get_connection_status` - Get current connection status
- `get_current_page` - Get current page info
- `reconnect_devtools` - Reconnect with previous settings

**Page Operations**:
- `get_page_snapshot` - Get page element snapshot
- `click` - Click element by uid
- `input_text` - Input text into element
- `get_value` - Get element value/text
- `set_form_control` - Set form control value (picker/switch/slider)
- `evaluate_script` - Execute JavaScript in mini-program context

**Navigation**:
- `navigate_to` - Navigate to page
- `navigate_back` - Go back to previous page
- `switch_tab` - Switch to tab page
- `relaunch` - Relaunch to specified page

**Assertions**:
- `assert_text` - Assert element text content
- `assert_attribute` - Assert element attribute value
- `assert_state` - Assert element state (visible/enabled/checked/focused)

### Usage Example
```
1. Run: cli auto --project=... --auto-port=9420
2. Connect: { strategy: "wsEndpoint", wsEndpoint: "ws://127.0.0.1:9420" }
3. Get snapshot: get_page_snapshot({ format: "compact" })
4. Click element: click({ uid: "button.submit" })
```

### Port Information
- **HTTP Service Port**: 27902 (for DevTools HTTP API)
- **Automation Port**: 9420 (for miniprogram-automator WebSocket)
- These are **different ports** - automation uses a separate WebSocket connection


用户留：该文件作为AI对话要素重点记录文档，用于防止AI幻觉，重启AI的阅读文档。每次用户有对话更新，同时你也要更新当前文档要素重点，防止AI窗口关闭，上下文丢失

---

## Session History

### 2026-03-05: MCP Setup & Screenshot Testing (SUCCESS ✅)

**Task**: Test WeChat Mini Program screenshot functionality via MCP

**Problem Identified**: Windows-specific `spawn EINVAL` bug in `weixin-devtools-mcp`
- Root cause: Node.js `child_process.spawn()` on Windows requires `shell: true` option for `.bat` files
- Error occurred when MCP tool tried to spawn WeChat DevTools CLI

**Solution Implemented**:
1. Cloned weixin-devtools-mcp repository to `d:/mystudyspace/test/temp/weixin-mcp/`
2. Modified `src/tools.ts` line 768-769:
   ```typescript
   const process = spawn(cliPath, args, {
     shell: globalThis.process.platform === 'win32',  // ADDED
     stdio: ['ignore', 'pipe', 'pipe']
   });
   ```
3. Rebuilt project: `npm run build`
4. Updated global MCP config to use local fixed version

**Connection Success**:
- ✅ CLI spawn issue resolved
- ✅ Automation service starts on port 9420
- ✅ MCP connection successful via `wsEndpoint` strategy
- ✅ Page snapshot retrieved: pages/index/index (45 elements)

**Connection Steps**:
1. Start automation: `cli auto --project=... --auto-port=9420`
2. Connect: `{ strategy: "wsEndpoint", wsEndpoint: "ws://127.0.0.1:9420" }`
3. Get snapshot: `get_page_snapshot({ format: "compact" })`

**Files Modified**:
- `d:/mystudyspace/test/temp/weixin-mcp/src/tools.ts` - Added `shell: true` for Windows
- `c:\Users\yuanc\.claude.json` - Updated to use local fixed version
- `d:\mystudyspace\test\auto-coding-accounting\.claude\mcp_config.json` - Added projectPath/cliPath
- `d:\mystudyspace\test\auto-coding-accounting\CLAUDE.md` - Updated documentation

**Next Steps**:
- Test screenshot functionality
- Test element interaction (click, input)
- Test navigation between pages
- Report Windows bug to upstream repository
