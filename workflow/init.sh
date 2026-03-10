#!/bin/bash
# ==============================================
# 记账小程序 - 自动化 Debug 工作流初始化脚本
# ==============================================
# 基于 Anthropic "Effective Harnesses for Long-Running Agents" 设计理念
#
# 用途：初始化测试环境，验证被测试应用存在
# ==============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目路径配置
WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACCOUNT_APP_DIR="D:/mystudyspace/test/auto-coding-accounting/account-app"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  记账小程序 - 自动化 Debug 工作流${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Step 1: 确认工作目录
echo -e "${GREEN}[1/5]${NC} 确认工作目录..."
pwd
echo ""

# Step 2: 验证被测试应用存在
echo -e "${GREEN}[2/5]${NC} 验证被测试应用..."
if [ ! -d "$ACCOUNT_APP_DIR" ]; then
    echo -e "${RED}❌ 错误: 被测试应用目录不存在${NC}"
    echo -e "   路径: $ACCOUNT_APP_DIR"
    exit 1
fi
echo -e "${GREEN}✓${NC} 被测试应用目录存在"
echo ""

# Step 3: 切换到应用目录
echo -e "${GREEN}[3/5]${NC} 切换到应用目录..."
cd "$ACCOUNT_APP_DIR"
echo -e "${GREEN}✓${NC} 当前目录: $(pwd)"
echo ""

# Step 4: 安装依赖（如需要）
echo -e "${GREEN}[4/5]${NC} 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm install
    echo -e "${GREEN}✓${NC} 依赖安装完成"
else
    echo -e "${GREEN}✓${NC} 依赖已存在，跳过安装"
fi
echo ""

# Step 5: 检查必要文件
echo -e "${GREEN}[5/5]${NC} 检查工作流文件..."
cd "$WORKFLOW_DIR"

WORKFLOW_FILES=("task.json" "CLAUDE.md" "progress.txt")
ALL_FILES_EXIST=true

for file in "${WORKFLOW_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠${NC}  文件不存在: $file"
        ALL_FILES_EXIST=false
    fi
done

if [ "$ALL_FILES_EXIST" = true ]; then
    echo -e "${GREEN}✓${NC} 所有工作流文件已就绪"
else
    echo -e "${YELLOW}⚠${NC}  部分工作流文件缺失，请运行 Initializer Agent"
fi
echo ""

# 完成
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✅ 初始化完成！${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}📝 下一步操作：${NC}"
echo -e "   1. 阅读 CLAUDE.md 了解工作流程"
echo -e "   2. 查看 task.json 选择测试场景"
echo -e "   3. 查看 progress.txt 了解当前进度"
echo -e "   4. 启动 Debug Agent 开始测试"
echo ""
echo -e "${YELLOW}🔧 启动开发服务器：${NC}"
echo -e "   cd $ACCOUNT_APP_DIR"
echo -e "   npm run dev:mp-weixin  # 小程序"
echo -e "   npm run dev:h5         # H5"
echo ""
