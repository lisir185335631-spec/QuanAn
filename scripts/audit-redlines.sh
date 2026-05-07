#!/usr/bin/env bash
# QuanQn · 17 条红线 grep 检测
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
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# R-1 · 直接调 LLM SDK 跳过 LLMGateway
if grep -rn "new OpenAI\|new Anthropic" src/ --exclude-dir=lib/llm-gateway --exclude-dir=workers/llm-gateway 2>/dev/null; then
  fail "R-1 · 直接调 LLM SDK · 触犯 LD-012"
else pass "R-1 · LLM SDK 唯一入口"; fi

# R-2 · Specialist 互调
if grep -rn "Agent\.\(run\|invoke\)" src/server/agents/specialists/ 2>/dev/null | grep -v "this\." | grep -v "\.test\.ts"; then
  fail "R-2 · Specialist 互调 · 触犯 LD-003"
else pass "R-2 · Specialist 不互调"; fi

# R-3 · Specialist 内多轮 LLM
if grep -A30 "execute(input" src/server/agents/specialists/*.ts 2>/dev/null | grep -E "^\s*(for|while)" | grep -i llm; then
  fail "R-3 · Specialist 内多轮 LLM · 触犯 LD-001"
else pass "R-3 · Specialist 单次 LLM"; fi

# R-4 · 漏 account_id 的 Prisma 查询(排除注释行)
LEAK=$(grep -rn "prisma\.\(stepData\|history\|topic\|asset\|diagnosisReport\|feedbackLog\|evolutionProfile\|evolutionInsight\|deepLearningArchive\|knowledgeFavorite\|knowledgeNote\)\.\(findMany\|findFirst\|update\|delete\)" src/ 2>/dev/null | grep -v "accountId" | grep -v "\.test\." | grep -vE "^[^:]+:[0-9]+:\s*(//|\*|/\*)" || true)
if [ -n "$LEAK" ]; then fail "R-4 · DB 查询漏 accountId · LD-009"; echo "$LEAK"; else pass "R-4 · DB 查询带 accountId"; fi

# R-5 · 漏 acc_ 命名空间
LEAK=$(grep -rn "redis\.\(set\|get\)\|localStorage\.setItem" src/ 2>/dev/null | grep -v "acc_" | grep -v "active_account_id" | grep -v "\.test\." | grep -v "compliance" || true)
if [ -n "$LEAK" ]; then fail "R-5 · Redis/LS 漏 acc_ 命名空间 · LD-009"; else pass "R-5 · Redis/LS 命名空间"; fi

# R-10 · any 类型
if grep -rn ": any[^a-zA-Z]\|as any" src/ --include="*.ts" 2>/dev/null | grep -v "\.test\." | grep -v "// eslint-disable"; then
  fail "R-10 · any type 兜底 · LD-013"
else pass "R-10 · 无 any 兜底"; fi

# R-11 · 自拼 system prompt
if grep -rn "systemPrompt\s*=" src/server/agents/specialists/*.ts 2>/dev/null | grep -v "\.test\." | grep -v "ctx\." ; then
  fail "R-11 · Specialist 自拼 prompt · LD-007"
else pass "R-11 · prompt 走 ContextAssembler"; fi

# R-15 · Specialist 数量上限 14
COUNT=$(ls src/server/agents/specialists/*.ts 2>/dev/null | grep -v "\.test\." | wc -l | tr -d ' ')
if [ "$COUNT" -gt 14 ]; then fail "R-15 · Specialist 数 ${COUNT} > 14 · LD-002"; else pass "R-15 · Specialist ${COUNT}/14"; fi

# R-16 · 视觉违规
if grep -rn "#00e5ff\|cyan-\|Orbitron\|Rajdhani" src/ --include="*.ts" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v "\.test\." | grep -v "// 禁用"; then
  fail "R-16 · 视觉违规 · LD-015"
else pass "R-16 · 视觉系统合规"; fi

# R-17 · trending 自建爬虫
if grep -rn "puppeteer" src/server/workers/trending-scraper/ 2>/dev/null; then
  fail "R-17 · 自建爬虫 · LD-017"
else pass "R-17 · trending 走第三方授权"; fi

# package.json 不允许独立向量库
if grep -E '"qdrant|"pinecone|"weaviate|"milvus|"chromadb' package.json 2>/dev/null; then
  fail "LD-011 · 独立向量库依赖 · 必须用 pgvector"
else pass "LD-011 · 仅 pgvector(主库扩展)"; fi

# R-9 · console / debugger(排除注释行)
if grep -rn "console\.log\|debugger" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "\.test\." | grep -vE "^[^:]+:[0-9]+:\s*(//|\*|/\*)"; then
  fail "AGENTS §6.9 · 生产代码 console / debugger · 用 logger"
else pass "AGENTS §6.9 · 无 console / debugger"; fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "✅ 所有红线检测通过 · 0 命中"
  exit 0
else
  echo "❌ 红线检测失败 · 修复后再提"
  exit 1
fi
