#!/bin/bash

# 记账软件 - 项目初始化脚本
# 此脚本将初始化 uni-app 项目并配置开发环境

set -e  # 遇到错误时退出

PROJECT_NAME="account-app"
UNICLOUD_DIR="uniCloud-aliyun"

echo "========================================"
echo "  记账软件 - 项目初始化"
echo "========================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "task.json" ]; then
    echo "❌ 错误：请先 cd 到 accounting-workflow 目录"
    exit 1
fi

# 检查 uni-app 是否已存在
if [ -d "$PROJECT_NAME" ]; then
    echo "⚠️  项目目录 $PROJECT_NAME 已存在"
    read -p "是否删除并重新创建？(y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  删除旧项目..."
        rm -rf "$PROJECT_NAME"
        rm -rf "$UNICLOUD_DIR"
    else
        echo "✅ 保留现有项目，跳过创建步骤"
        cd "$PROJECT_NAME"
        echo ""
        echo "🚀 启动开发服务器..."
        echo ""
        echo "提示："
        echo "  小程序开发：npm run dev:mp-weixin"
        echo "  H5 开发：   npm run dev:h5"
        echo ""
        exit 0
    fi
fi

echo "📦 创建 uni-app 项目..."
echo ""

# 方式1：使用 HBuilderX 创建（推荐）
echo "========================================"
echo "  请使用 HBuilderX 创建项目"
echo "========================================"
echo ""
echo "步骤："
echo "  1. 打开 HBuilderX"
echo "  2. 文件 → 新建 → 项目"
echo "  3. 选择 uni-app 项目"
echo "  4. 项目名称：$PROJECT_NAME"
echo "  5. 模板：Vue 3 + TypeScript"
echo "  6. 点击创建"
echo ""
read -p "创建完成后按回车继续..."

# 检查项目是否创建成功
if [ ! -d "$PROJECT_NAME" ]; then
    echo "❌ 错误：未找到项目目录 $PROJECT_NAME"
    echo "   请确认已使用 HBuilderX 创建项目"
    exit 1
fi

cd "$PROJECT_NAME"

echo ""
echo "📥 安装依赖..."
echo ""

# 安装基础依赖
echo "安装 UnoCSS..."
npm install -D unocss

echo "安装 Pinia..."
npm install pinia

echo "安装 uCharts（图表库）..."
npm install @qiun/ucharts-uarts uni-modules

echo ""
echo "✅ 依赖安装完成"
echo ""

# 创建 uniCloud 目录
echo "📁 创建 uniCloud 目录结构..."
cd ..
mkdir -p "$UNICLOUD_DIR/cloudfunctions"
mkdir -p "$UNICLOUD_DIR/database"
echo "✅ uniCloud 目录结构已创建"
echo ""

# 创建必要的配置文件
echo "📝 创建配置文件..."

cd "$PROJECT_NAME"

# 创建 unocss.config.ts
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

# 创建 .env 模板
cat > .env.example << 'EOF'
# uniCloud 配置
VITE_UNICLOUD_SPACE_ID=your_space_id
VITE_UNICLOUD_CLIENT_SECRET=your_client_secret

# 微信小程序配置
MP_APP_ID=your_mini_program_appid
MP_SECRET=your_mini_program_secret
EOF

echo "✅ 配置文件已创建"
echo ""

# 修改 main.ts 引入 UnoCSS 和 Pinia
if [ -f "main.ts" ]; then
    if ! grep -q "unocss" main.ts; then
        echo "配置 main.ts..."

        # 创建 main.ts 新文件
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

  return {
    app
  }
}
EOF
        echo "✅ main.ts 已配置"
    fi
fi

# 创建 Pinia store 目录结构
echo "创建 Pinia store 目录..."
mkdir -p store
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
echo "✅ Pinia store 已创建"

echo ""
echo "========================================"
echo "  初始化完成！"
echo "========================================"
echo ""
echo "下一步："
echo "  1. 在 HBuilderX 中关联 uniCloud 空间"
echo "  2. 配置 .env 文件"
echo "  3. 运行 npm run dev:mp-weixin 启动开发"
echo ""
echo "开发命令："
echo "  小程序开发：npm run dev:mp-weixin"
echo "  H5 开发：   npm run dev:h5"
echo "  小程序构建：npm run build:mp-weixin"
echo "  H5 构建：   npm run build:h5"
echo ""
