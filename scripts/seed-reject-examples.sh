#!/bin/bash
# scripts/seed-reject-examples.sh
# 用途 · 把 PRD-MASTER.md §6.2 的 35 条 QuanQn 通用反例预填到 ~/.claude/playbooks/reject-examples.jsonl
#
# 派生自 · PRD-MASTER.md §6 PRD-anti-patterns 预填(★ 修复 P0-1 反例库空缺口)
# 用法   · bash scripts/seed-reject-examples.sh
# 触发时机 · PRD-1 启动前(本仓库 v0.1 → v0.2 启动前必跑一次)
# 注意   · reject-examples.jsonl 是 append-only · 重复跑会重复写 · 脚本带去重保护

set -e

# ─── 路径定位(脚本可从任意位置跑)─────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE="$PROJECT_ROOT/PRD-MASTER.md"
TARGET="$HOME/.claude/playbooks/reject-examples.jsonl"

# ─── 前置检查 ─────────────────────────────────────────────────
if [ ! -f "$SOURCE" ]; then
  echo "❌ 找不到 PRD-MASTER.md:$SOURCE"
  exit 1
fi

mkdir -p "$(dirname "$TARGET")"
touch "$TARGET"

# ─── 备份现有文件(如有内容)─────────────────────────────────────
if [ -s "$TARGET" ]; then
  BACKUP="${TARGET}.bak.$(date +%Y%m%d_%H%M%S)"
  cp "$TARGET" "$BACKUP"
  echo "ℹ️  已备份原 reject-examples.jsonl 到 $BACKUP"
fi

# ─── 提取 PRD-MASTER.md §6.2 的 35 条 JSON 反例 ────────────────────
# 匹配规则 · 以 {"id":"REJ- 开头的行
TMP="$(mktemp)"
grep -E '^\{"id":"REJ-' "$SOURCE" > "$TMP"

NEW_COUNT=$(wc -l < "$TMP" | tr -d ' ')

if [ "$NEW_COUNT" -lt 30 ]; then
  echo "❌ 异常 · PRD-MASTER §6.2 应有 ≥ 30 条反例 · 实际提取到 $NEW_COUNT 条"
  echo "   请检查 PRD-MASTER.md §6.2 是否完整"
  rm -f "$TMP"
  exit 1
fi

# ─── 去重写入(根据 id 字段去重)───────────────────────────────────
# 把现有 reject-examples.jsonl 已有的 id 提取出来
EXISTING_IDS="$(mktemp)"
if [ -s "$TARGET" ]; then
  grep -oE '"id":"REJ-[0-9]+"' "$TARGET" 2>/dev/null > "$EXISTING_IDS" || true
fi

ADDED=0
SKIPPED=0
while IFS= read -r line; do
  ID=$(echo "$line" | grep -oE '"id":"REJ-[0-9]+"')
  if grep -qF "$ID" "$EXISTING_IDS" 2>/dev/null; then
    SKIPPED=$((SKIPPED + 1))
  else
    echo "$line" >> "$TARGET"
    ADDED=$((ADDED + 1))
  fi
done < "$TMP"

rm -f "$TMP" "$EXISTING_IDS"

# ─── 验证 + 报告 ─────────────────────────────────────────────────
TOTAL_COUNT=$(wc -l < "$TARGET" | tr -d ' ')
echo ""
echo "✅ §6 反例预填完成"
echo "   新增 · $ADDED 条"
echo "   跳过 · $SKIPPED 条(已存在)"
echo "   总计 · $TOTAL_COUNT 条 in $TARGET"
echo ""
echo "下一步 · prd skill 转 prd.json 时可自动按关键词检索注入 anti_patterns(参全局 ~/.claude/CLAUDE.md L326)"
