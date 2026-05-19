#!/bin/bash
#
# ╔══════════════════════════════════════════════════════╗
# ║              个人快捷助手 - 一键启动脚本              ║
# ╚══════════════════════════════════════════════════════╝
#
# 使用方法:
#   ./个人快捷助手.sh             启动服务
#   ./个人快捷助手.sh --help      显示此帮助
#
# 功能说明:
#   1. 自动检测可用端口（从 5173 开始，遇冲突自动递增）
#   2. 自动安装依赖（node_modules 缺失时自动 npm install）
#   3. 启动 Vite 开发服务器
#   4. 服务就绪后自动打开默认浏览器
#
# 前置条件:
#   - Node.js >= 18（推荐 20+）
#   - npm（随 Node.js 一起安装）
#
# 注意事项:
#   - 按 Ctrl+C 可停止服务
#   - 修改代码后浏览器会自动热更新，无需手动刷新
#   - 如端口被占用，脚本会自动递增寻找可用端口
#

set -e

# ─── 显示帮助 ────────────────────────────────────────────
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  head -25 "$0" | sed 's/^# //; s/^#$//'
  exit 0
fi

# ─── 自动切换到脚本所在目录 ──────────────────────────────
cd "$(dirname "$0")" || {
  echo "❌ 错误：无法切换到脚本所在目录"
  exit 1
}

PROJECT_DIR=$(pwd)
echo "📂 项目目录: $PROJECT_DIR"
echo ""

# ─── 检测 Node.js ────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "❌ 错误：未检测到 Node.js"
  echo "   请先安装 Node.js (>= 18): https://nodejs.org"
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "❌ 错误：Node.js 版本过低（当前 $(node -v)，需要 >= 18）"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# ─── 检测 npm ────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
  echo "❌ 错误：未检测到 npm"
  exit 1
fi
echo "✅ npm $(npm -v)"
echo ""

# ─── 安装依赖（如需要）───────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "📦 正在安装依赖..."
  npm install
  echo "✅ 依赖安装完成"
  echo ""
fi

# ─── 检测可用端口 ────────────────────────────────────────
BASE_PORT=5173
PORT=$BASE_PORT

while lsof -i:"$PORT" &>/dev/null 2>&1; do
  echo "⚠️  端口 $PORT 已被占用，尝试 $((PORT + 1))..."
  PORT=$((PORT + 1))
done

echo "🔌 使用端口: $PORT"
echo ""

# ─── 启动服务并等待就绪 ──────────────────────────────────
echo "🚀 正在启动前端服务..."
echo ""

# 启动 Vite，指定端口，--open 参数让 Vite 自动打开浏览器
npx vite --port "$PORT" --open

# ─── 服务退出后 ──────────────────────────────────────────
echo ""
echo "👋 服务已停止"
