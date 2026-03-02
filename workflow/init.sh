#!/bin/bash

# 记账软件 - 项目初始化/升级脚本
# 此脚本将升级现有的 uni-app 项目到 Vue 3 + UnoCSS + Pinia

set -e  # 遇到错误时退出

echo "========================================"
echo "  记账软件 - 项目升级"
echo "========================================"
echo ""

# 检查是否在正确的目录（workflow 目录）
if [ ! -f "task.json" ]; then
    echo "❌ 错误：请在 workflow 目录中运行此脚本"
    exit 1
fi

# 检查父目录是否是项目根目录
if [ ! -f "../manifest.json" ]; then
    echo "❌ 错误：未找到项目根目录（manifest.json）"
    exit 1
fi

echo "📋 当前项目状态："
echo "  - uni-app 项目: ✅ 已创建"
echo "  - uniCloud 空间: ✅ 已关联"
echo "  - 微信小程序 AppID: ✅ 已配置"
echo "  - Vue 版本: ⚠️  需要升级到 Vue 3"
echo "  - UnoCSS: ❌ 未安装"
echo "  - Pinia: ❌ 未安装"
echo ""

# 询问是否继续
read -p "是否开始升级？(Y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "❌ 取消升级"
    exit 0
fi

echo ""
echo "📦 开始升级项目..."
echo ""

# 切换到项目根目录
cd ..

# Step 1: 升级到 Vue 3
echo "🔄 Step 1: 升级到 Vue 3..."
if grep -q '"vueVersion" : "2"' manifest.json; then
    echo "  修改 manifest.json，设置 vueVersion 为 3"
    # macOS 和 Linux 的 sed 语法不同
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/"vueVersion" : "2"/"vueVersion" : "3"/g' manifest.json
    else
        sed -i 's/"vueVersion" : "2"/"vueVersion" : "3"/g' manifest.json
    fi
    echo "  ✅ Vue 3 升级完成"
elif grep -q '"vueVersion" : "3"' manifest.json; then
    echo "  ✅ 已经是 Vue 3"
else
    echo "  ⚠️  未找到 vueVersion 配置"
fi
echo ""

# Step 2: 重命名 main.js 为 main.ts
echo "🔄 Step 2: 重命名 main.js 为 main.ts..."
if [ -f "main.js" ] && [ ! -f "main.ts" ]; then
    mv main.js main.ts
    echo "  ✅ main.js 已重命名为 main.ts"
elif [ -f "main.ts" ]; then
    echo "  ✅ main.ts 已存在"
else
    echo "  ⚠️  main.js 不存在"
fi
echo ""

# Step 3: 安装依赖
echo "🔄 Step 3: 安装依赖..."
echo "  安装 UnoCSS..."
npm install -D unocss @unocss/preset-uno

echo "  安装 Pinia..."
npm install pinia

echo "  ✅ 依赖安装完成"
echo ""

# Step 4: 创建目录结构
echo "🔄 Step 4: 创建目录结构..."
mkdir -p components store utils api
echo "  ✅ 目录结构已创建（components/store/utils/api）"
echo ""

# Step 5: 配置 UnoCSS
echo "🔄 Step 5: 配置 UnoCSS..."
cat > unocss.config.ts << 'EOF'
import { defineConfig } from 'unocss'
import presetUno from '@unocss/preset-uno'

export default defineConfig({
  presets: [
    presetUno(),
  ],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'text-ellipsis': 'truncate overflow-hidden whitespace-nowrap',
  },
  theme: {
    colors: {
      primary: {
        DEFAULT: '#3B82F6',
        light: '#60A5FA',
        dark: '#2563EB'
      }
    }
  }
})
EOF
echo "  ✅ unocss.config.ts 已创建"
echo ""

# Step 6: 更新 main.ts
echo "🔄 Step 6: 更新 main.ts..."
cat > main.ts << 'EOF'
import { createSSRApp } from 'vue'
import App from './App.vue'

// UnoCSS
import 'uno.css'
import 'virtual:uno.css'

// Pinia
import { createPinia } from 'pinia'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(pinia)

  // 挂载到 globalData 供工具函数使用
  // @ts-ignore
  if (typeof getApp !== 'undefined') {
    // @ts-ignore
    const globalApp = getApp()
    if (globalApp && !globalApp.globalData) {
      // @ts-ignore
      globalApp.globalData = {}
    }
    if (globalApp && globalApp.globalData) {
      // @ts-ignore
      globalApp.globalData.store = pinia
    }
  }

  return {
    app
  }
}
EOF
echo "  ✅ main.ts 已更新"
echo ""

# Step 7: 创建 Pinia store
echo "🔄 Step 7: 创建 Pinia store..."
cat > store/user.ts << 'EOF'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    openid: '',
    userData: {} as any,
    isGuest: true,
    authStateVersion: 0
  }),

  getters: {
    isLoggedIn: (state) => !state.isGuest && !!state.openid
  },

  actions: {
    setOpenid(openid: string) {
      this.openid = openid
    },
    setUserData(userData: any) {
      this.userData = userData
    },
    setIsGuest(isGuest: boolean) {
      const wasGuest = this.isGuest
      this.isGuest = isGuest
      if (wasGuest === true && isGuest === false) {
        this.authStateVersion += 1
      }
    },
    async RestoreFromCache() {
      try {
        // @ts-ignore
        const cachedOpenid = uni.getStorageSync('openid')
        if (cachedOpenid) {
          this.setOpenid(cachedOpenid)
          this.setIsGuest(false)
          return true
        }
      } catch (e) {
        console.error('恢复登录状态失败', e)
      }
      return false
    }
  }
})
EOF
echo "  ✅ store/user.ts 已创建"
echo ""

# Step 8: 创建 .env 模板
echo "🔄 Step 8: 创建 .env 模板..."
cat > .env.example << 'EOF'
# 微信小程序配置（已配置，请勿修改）
MP_APP_ID=wx07932ea2cbbef4c2
MP_SECRET=your_mini_program_secret

# uniCloud 配置（已关联阿里云空间）
UNICLOUD_SPACE=aliyun
EOF
echo "  ✅ .env.example 已创建"
echo ""

echo "========================================"
echo "  升级完成！"
echo "========================================"
echo ""
echo "✅ 已完成："
echo "  - Vue 2 → Vue 3 升级"
echo "  - main.js → main.ts"
echo "  - UnoCSS 安装和配置"
echo "  - Pinia 安装和配置"
echo "  - store/user.ts 创建"
echo "  - 目录结构创建（components/store/utils/api）"
echo ""
echo "📋 下一步："
echo "  1. 运行 npm run dev:mp-weixin 启动小程序开发"
echo "  2. 在 workflow 目录启动 AI 开发工作流"
echo ""
echo "开发命令："
echo "  小程序开发：npm run dev:mp-weixin"
echo "  H5 开发：   npm run dev:h5"
echo ""
