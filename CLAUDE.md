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


用户留：该文件作为AI对话要素重点记录文档，用于防止AI幻觉，重启AI的阅读文档。每次用户有对话更新，同时你也要更新当前文档要素重点，防止AI窗口关闭，上下文丢失
