#!/usr/bin/env bash
# QuanQn · 17 条红线 grep 检测 (TD-017 修 · 2026-05-09 monorepo 路径适配)
# 派生自 AGENTS.md §5.6 + §8.5
# 任一命中 reject

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0
fail() { echo "❌ $1"; FAIL=1; }
pass() { echo "✅ $1"; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  QuanQn · 17 红线检测"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "本脚本覆盖 12 条 grep 红线 ·"
echo "  R-1/2/3/4/5/9/10/11/15/16/17 + LD-011 + console禁用"
echo
echo "其他 5 条复杂红线由 audit-ld.sh 检测 ·"
echo "  R-6 新表 RLS · R-7 schema 漂移 · R-8 zod 缺失"
echo "  R-12 transaction · R-13 乐观锁 · R-14 PII/免责"
echo
echo "Monorepo source paths (TD-017 修 · 2026-05-09):"
echo "  apps/api/src/, apps/web/src/, apps/admin/src/, packages/*/src/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# R-1 · 直接调 LLM SDK 跳过 LLMGateway (LD-012)
# 排除 LLMGateway 自身 (basename: llm-gateway) + tests
if grep -rn "new OpenAI\|new Anthropic\|@anthropic-ai/sdk\|from openai" \
    apps/api/src/ packages/*/src/ \
    --exclude-dir=llm-gateway --exclude-dir=node_modules \
    --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "\.test\." | grep -v "\.judge\." ; then
  fail "R-1 · 直接调 LLM SDK · 触犯 LD-012"
else pass "R-1 · LLM SDK 唯一入口 (LLMGateway)"; fi

# R-2 · Specialist 互调 (LD-003 · 不允许 Specialist 内调别的 Specialist)
# 排除 JSDoc / line 注释 (` * ` / `//` 开头)
if grep -rn "Agent\.\(run\|invoke\|execute\)" apps/api/src/specialists/ 2>/dev/null \
    | grep -v "this\." | grep -v "\.test\." | grep -v "ContextAssembler" \
    | grep -vE "^[^:]+:[0-9]+:\s*(\*|//|/\*)" ; then
  fail "R-2 · Specialist 互调 · 触犯 LD-003"
else pass "R-2 · Specialist 不互调 (排除 JSDoc)"; fi

# R-3 · Specialist 内多轮 LLM (LD-001 · 95% Workflow + 5% Agent)
if grep -A 30 "execute(" apps/api/src/specialists/*.ts 2>/dev/null \
    | grep -E "^\s*(for|while)" | grep -i "llm\|invoke\|complete" ; then
  fail "R-3 · Specialist 内多轮 LLM 循环 · 触犯 LD-001"
else pass "R-3 · Specialist 单次 LLM"; fi

# R-4 · Prisma 查询漏 accountId (LD-009 · 多账号隔离)
# 注: grep 单行局限 · 排除合法模式 (跨多行 where 块 + by-id 在 protectedProcedure 内 RLS 自动)
# -B 2 看前面 2 行注释 · -A 3 看后面 3 行 where 块
LEAK_RAW=$(grep -rn -B 10 -A 5 "prisma\.\(stepData\|history\|topic\|asset\|diagnosisReport\|feedbackLog\|evolutionProfile\|evolutionInsight\|deepLearningArchive\|knowledgeFavorite\|knowledgeNote\|costLog\)\.\(findMany\|findFirst\|update\|delete\|deleteMany\|updateMany\)" \
    apps/api/src/ --include="*.ts" 2>/dev/null | grep -v "\.test\.")
# 把 -B 2 -A 3 输出按 -- 分组, 每组检查 (1) accountId · (2) by-id 单查 RLS 安全 · (3) "RLS auto-filters" 注释 design choice
LEAK=$(echo "$LEAK_RAW" | awk '
BEGIN { RS="--\n"; ORS=""; FS="\n" }
{
  block = $0
  if (block ~ /accountId/) next
  if (block ~ /where:[^{]*\{[^}]*id:/) next
  if (block ~ /RLS auto-filter/) next
  if (block ~ /No where:\{accountId\}/) next
  if (block ~ /^[[:space:]]*$/) next
  print block "\n--\n"
}' | grep -vE "^[^:]+:[0-9]+:\s*(//|\*|/\*)" | grep -v "^$" || true)
if [ -n "$LEAK" ]; then fail "R-4 · DB 查询漏 accountId · LD-009"; echo "$LEAK" | head -10; else pass "R-4 · DB 查询带 accountId (含 multi-line where 块 + by-id RLS 安全 + 'RLS auto-filters' 注释 design choice)"; fi

# R-5 · Redis/LS 漏 acc_ 命名空间 (LD-009 · LD-010)
# 白名单 helper 函数 (函数内已生成 acc_{id} 前缀 · 通过 ls-namespace.ts 集中管理)
# 跨多行 setItem/getItem 用 -A 1 看下一行
LEAK_RAW=$(grep -rn -A 1 "redis\.\(set\|get\)\|localStorage\.setItem\|localStorage\.getItem" \
    apps/api/src/ apps/web/src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "\.test\." | grep -v "compliance" | grep -v "ls-namespace")
LEAK=$(echo "$LEAK_RAW" | awk '
BEGIN { RS="--\n"; ORS=""; FS="\n" }
{
  block = $0
  if (block ~ /acc_/ || block ~ /active_account_id/) next
  if (block ~ /stepLsKey|getToolLsKey|evolutionLsKey|getLsKey/) next
  if (block ~ /^[[:space:]]*$/) next
  print block "\n--\n"
}' | grep -vE "^[^:]+:[0-9]+:\s*(//|\*|/\*)" | grep -v "^$" || true)
if [ -n "$LEAK" ]; then fail "R-5 · Redis/LS 漏 acc_ 命名空间 · LD-009"; echo "$LEAK" | head -10; else pass "R-5 · Redis/LS 命名空间 (helper 函数封装 acc_ 前缀)"; fi

# R-9 · console.log / debugger (AGENTS §6.9 · 用 logger)
if grep -rn "console\.log\|debugger" \
    apps/api/src/ apps/web/src/ apps/admin/src/ packages/*/src/ \
    --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "\.test\." | grep -v "\.judge\." \
    | grep -vE "^[^:]+:[0-9]+:\s*(//|\*|/\*)" \
    | grep -v "// eslint-disable" ; then
  fail "AGENTS §6.9 · 生产代码 console.log / debugger · 用 logger"
else pass "AGENTS §6.9 · 无 console.log / debugger"; fi

# R-10 · any 类型兜底 (LD-013)
if grep -rn ": any[^a-zA-Z]\|as any" \
    apps/api/src/ apps/web/src/ apps/admin/src/ packages/*/src/ \
    --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "\.test\." | grep -v "\.judge\." \
    | grep -v "// eslint-disable" ; then
  fail "R-10 · any type 兜底 · 触犯 LD-013"
else pass "R-10 · 无 any 兜底"; fi

# R-11 · Specialist 自拼 system prompt (LD-007 · ContextAssembler 唯一注入入口)
if grep -rn "systemPrompt\s*=\|system:\s*\`" apps/api/src/specialists/*.ts 2>/dev/null \
    | grep -v "\.test\." | grep -v "ctx\." | grep -v "assembled\." ; then
  fail "R-11 · Specialist 自拼 system prompt · 触犯 LD-007"
else pass "R-11 · prompt 走 ContextAssembler"; fi

# R-15 · Specialist 数量上限 14 (LD-002)
COUNT=$(ls apps/api/src/specialists/*.ts 2>/dev/null \
    | grep -v "\.test\." | grep -v "/base/" | grep -v "/__tests__/" | wc -l | tr -d ' ')
if [ "$COUNT" -gt 14 ]; then fail "R-15 · Specialist 数 ${COUNT} > 14 · 触犯 LD-002"
else pass "R-15 · Specialist ${COUNT}/14"; fi

# R-16 · 视觉违规 (LD-015 · Aurelian Dark · 禁 cyberpunk 配色 / 字体)
if grep -rn "#00e5ff\|cyan-\|Orbitron\|Rajdhani" \
    apps/web/src/ apps/admin/src/ packages/ui/src/ \
    --include="*.ts" --include="*.tsx" --include="*.css" 2>/dev/null \
    | grep -v "\.test\." | grep -v "// 禁用" ; then
  fail "R-16 · 视觉违规 · 触犯 LD-015"
else pass "R-16 · 视觉系统合规 (Aurelian Dark)"; fi

# R-17 · trending 自建爬虫 (LD-017 · 走第三方授权)
if grep -rn "puppeteer\|playwright" apps/api/src/workers/trending-scraper/ 2>/dev/null \
    | grep -v "tests/" ; then
  fail "R-17 · trending 自建爬虫 · 触犯 LD-017"
else pass "R-17 · trending 走第三方授权 (无 puppeteer/playwright)"; fi

# LD-011 · 不允许独立向量库依赖 (用 pgvector PostgreSQL 扩展)
if grep -E '"qdrant|"pinecone|"weaviate|"milvus|"chromadb' \
    package.json apps/*/package.json packages/*/package.json 2>/dev/null \
    | grep -v "node_modules" ; then
  fail "LD-011 · 独立向量库依赖 · 必须用 pgvector"
else pass "LD-011 · 仅 pgvector (PostgreSQL 扩展)"; fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "✅ 所有红线检测通过 · 0 命中"
  exit 0
else
  echo "❌ 红线检测失败 · 修复后再提"
  exit 1
fi
