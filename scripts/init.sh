#!/usr/bin/env bash
# scripts/init.sh — QuanAn session 初始化
# 用法: bash scripts/init.sh
# 作用: 安装依赖、生成 Prisma client、校验必要 env 变量

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ── 1. env 文件检查 ───────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo "[init] 未找到 .env 文件。" >&2
    if [ -f ".env.example" ]; then
        echo "[init] 请先复制模板并填入真实值:" >&2
        echo "       cp .env.example .env" >&2
    fi
    exit 1
fi

# 关键 env 变量检查（缺失或仍为占位值则提示）
check_env() {
    local key="$1"
    local val
    val="$(grep -E "^${key}=" .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d ' \r')"
    if [ -z "$val" ] || echo "$val" | grep -qE '^(your-|sk-\.\.\.|)$'; then
        echo "[init] 警告: ${key} 未设置或仍为占位值，请在 .env 中填入真实值。" >&2
    fi
}

check_env "DATABASE_URL"
check_env "ANTHROPIC_API_KEY"

# ── 2. 安装依赖 ───────────────────────────────────────────────────────────────
echo "[init] 安装依赖 (pnpm install --frozen-lockfile)..."
pnpm install --frozen-lockfile

# ── 3. 生成 Prisma client ─────────────────────────────────────────────────────
echo "[init] 生成 Prisma client (pnpm db:generate)..."
pnpm db:generate

echo "[init] 初始化完成。"
