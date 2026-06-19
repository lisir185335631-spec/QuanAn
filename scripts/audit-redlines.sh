#!/usr/bin/env bash
# QuanAn · 22 条红线检测 (R-1~17 + R-22 前后端分离 + R-21 RLS 缺口真检测)
# R-18/R-19/R-20 阶段6实装·暂未检测
# R-23 已删除（VoiceChatAgent 语音下线 2026-06-19）
# 派生自 AGENTS.md §5.6 + §8.5
# 任一命中 reject

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0
fail() { echo "❌ $1"; FAIL=1; }
pass() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  QuanAn · 22 红线检测"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "本脚本覆盖 grep 红线 ·"
echo "  R-1/2/3/4/5/9/10/11/15/16/17 + R-21 RLS 缺口 + R-22 前后端分离 + LD-011 + console禁用"
echo "  (R-23 已删除·VoiceChatAgent 语音下线 2026-06-19)"
echo "  (R-18~20 阶段6实装·暂未检测;R-9 trace_id 由 LD-013 schema 保证·非本脚本)"
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
# TD-052 fix: 排除 non-chat OpenAI SDK workers (image-gen/embedding/rag/tts/stt) · 这些非 LLM chat 不走 Gateway 是设计意图
# TD-061 fix: 正则收紧为 "new OpenAI(" / "new Anthropic("(带左括号)· 避免子串误匹配 worker 类名(如 new OpenAITtsWorker())
if grep -rn "new OpenAI(\|new Anthropic(\|@anthropic-ai/sdk\|from openai" \
    apps/api/src/ packages/*/src/ \
    --exclude-dir=llm-gateway --exclude-dir=node_modules \
    --exclude-dir=image-gen --exclude-dir=embedding --exclude-dir=rag \
    --exclude-dir=tts --exclude-dir=stt \
    --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "\.test\." | grep -v "\.judge\." \
    | grep -vE "trpc/routers/(app/)?tts\.ts|workers/(image-gen|embedding|rag|tts|stt)/" ; then
  fail "R-1 · 直接调 LLM SDK · 触犯 LD-012"
else pass "R-1 · LLM SDK 唯一入口 (LLMGateway · non-chat workers 豁免: image-gen/embedding/rag/tts/stt)"; fi

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
# TD-052 fix: 排除 apps/api/src/trpc/routers/admin/ (admin 跨账号查是 LD-A-3 设计意图 · RLS DISABLE)
LEAK_RAW=$(grep -rn -B 10 -A 5 "prisma\.\(stepData\|history\|topic\|asset\|diagnosisReport\|feedbackLog\|evolutionProfile\|evolutionInsight\|deepLearningArchive\|knowledgeFavorite\|knowledgeNote\|costLog\)\.\(findMany\|findFirst\|update\|delete\|deleteMany\|updateMany\)" \
    apps/api/src/ --include="*.ts" 2>/dev/null \
    | grep -v "\.test\." | grep -v "/admin/")
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
# TD-052 fix: 排除 admin 域 + system 级 rate-limit (lucia-admin session / image-gen rate-limit 不分 user account 是设计意图)
LEAK_RAW=$(grep -rn -A 1 "redis\.\(set\|get\)\|localStorage\.setItem\|localStorage\.getItem" \
    apps/api/src/ apps/web/src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "\.test\." | grep -v "compliance" | grep -v "ls-namespace" \
    | grep -vE "auth/lucia-admin|rate-limit/(image-gen|auth|system)")
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

# R-9(trace_id) 由 LD-013 schema 字段保证 + Validator 核,非本脚本 grep 范围
# console.log/debugger 禁用(coding-standards §6.9·非R-9)
if grep -rn "console\.log\|debugger" \
    apps/api/src/ apps/web/src/ apps/admin/src/ packages/*/src/ \
    --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "\.test\." | grep -v "\.judge\." \
    | grep -vE "^[^:]+:[0-9]+:\s*(//|\*|/\*)" \
    | grep -v "// eslint-disable" ; then
  fail "coding-standards §6.9 · 生产代码 console.log / debugger · 用 logger"
else pass "coding-standards §6.9 · 无 console.log / debugger"; fi

# R-10 · any 类型兜底 (LD-013)
# TD-051 fix: awk 识别 eslint-disable-next-line @typescript-eslint/no-explicit-any 注释 · 豁免接下来的 1 行
# 也豁免行尾 // eslint-disable-line @typescript-eslint/no-explicit-any 行内注释
ANY_HITS=$(find apps/api/src apps/web/src apps/admin/src packages -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null \
    | grep -v "\.test\." | grep -v "\.judge\." | grep -v "node_modules" \
    | xargs awk '
      /eslint-disable-next-line.*no-explicit-any/ { skip = NR + 1; next }
      /\bas any\b|: any[^a-zA-Z_]/ {
        if (NR == skip) next
        if ($0 ~ /eslint-disable-line.*no-explicit-any/) next
        if ($0 ~ /^[[:space:]]*(\/\/|\*|\/\*)/) next
        print FILENAME ":" NR ":" $0
      }
    ' 2>/dev/null)
if [ -n "$ANY_HITS" ]; then
  fail "R-10 · any type 兜底 · 触犯 LD-013"
  echo "$ANY_HITS" | head -10
else pass "R-10 · 无 any 兜底 (eslint-disable 注释豁免)"; fi

# R-11 · Specialist 自拼 system prompt 或 invokeLLM 旁路 ctx (LD-007 · ContextAssembler 唯一注入入口)
#   (a) systemPrompt= 自拼且不走 ctx/assembled
#   (b) US-005: invokeLLM 首参用废弃 _ctx(忽略 ContextAssembler 注入)· 排除 _build* 辅助方法的合法未用参数(如 TopicAgent._buildUserPrompt)
R11_A=$(grep -rn "systemPrompt\s*=\|system:\s*\`" apps/api/src/specialists/*.ts 2>/dev/null | grep -v "\.test\." | grep -v "ctx\." | grep -v "assembled\." || true)
R11_B=$(grep -rn "_ctx: AssembledContext" apps/api/src/specialists/*.ts 2>/dev/null | grep -v "\.test\." | grep -v "_build" || true)
if [ -n "$R11_A" ] || [ -n "$R11_B" ]; then
  [ -n "$R11_A" ] && echo "$R11_A"
  [ -n "$R11_B" ] && echo "$R11_B"
  fail "R-11 · Specialist 自拼 system prompt 或 invokeLLM(_ctx 旁路 ContextAssembler · 触犯 LD-007"
else pass "R-11 · prompt 走 ContextAssembler(无自拼 · 无 invokeLLM(_ctx 旁路)"; fi

# R-15 · Specialist 数量上限 15 (LD-002)
# TD-061 fix: 数 "extends BaseSpecialist" 全量(13 step in specialists/ + 2 autonomous in agents/: Evolution·DailyTask)
#            旧 "ls specialists/*.ts" 漏数 agents/ 下 2 个自治 Agent + 误数 registry.ts(假 14);grep 口径与 AGENTS §1 枚举的 15 一致
COUNT=$(grep -rl "extends BaseSpecialist" apps/api/src --include="*.ts" 2>/dev/null \
    | grep -v "\.test\." | wc -l | tr -d ' ')
if [ "$COUNT" -gt 14 ]; then fail "R-15 · Specialist 数 ${COUNT} > 14 · 触犯 LD-002(新增第 15 个须先开 ADR)"
else pass "R-15 · Specialist ${COUNT}/14 (12 step + 2 autonomous · 上限 14)"; fi

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

# R-21 · account_id 业务表漏 RLS (全量盘点 · 不限于新表)
# 原理: 从 prisma/schema.prisma 提取有 accountId 字段的 model → 映射真实表名(@@map)
# → 与 prisma/migrations/manual_rls.sql 中 ENABLE ROW LEVEL SECURITY 的表求差 → 缺 RLS 的报 fail
# 已知应抓出: trending_favorites (有 accountId 但 manual_rls.sql 未 ENABLE RLS)
# 排除: §8 运维表 + §13 admin 子系统 (注释标注"不开 RLS"/"DISABLE RLS" · 设计意图)
# 实现: 只扫 schema 中 §8 运维表注释行之前的业务表区段
if [ -f "prisma/schema.prisma" ] && [ -f "prisma/migrations/manual_rls.sql" ]; then
  # Step 1: 只取业务表区段 (§8运维表注释前) — 排除运维表和 admin 子系统表
  SCHEMA_BUSINESS_SECTION=$(awk '/§8.*运维表/{exit} {print}' prisma/schema.prisma 2>/dev/null)

  # Step 2: 在业务表区段中提取有 accountId 的 model 的真实表名(@@map)
  ACCOUNT_TABLES=$(echo "$SCHEMA_BUSINESS_SECTION" | awk '
    /^model [A-Za-z]/ {
      cur_model = $2
      has_account = 0
      table_name = ""
    }
    /^[[:space:]]+accountId[[:space:]]/ {
      has_account = 1
    }
    /@@map\("/ {
      t = $0
      sub(/.*@@map\("/, "", t)
      sub(/".*/, "", t)
      if (t != "") table_name = t
    }
    /^\}/ {
      if (cur_model != "" && has_account) {
        if (table_name != "") print table_name
      }
      cur_model = ""
      has_account = 0
      table_name = ""
    }
  ' 2>/dev/null | sort -u)

  # Step 2: 提取 manual_rls.sql 中已 ENABLE ROW LEVEL SECURITY 的表名
  RLS_ENABLED_TABLES=$(grep "ENABLE ROW LEVEL SECURITY" prisma/migrations/manual_rls.sql 2>/dev/null \
    | sed 's/ALTER TABLE //' | sed 's/ *ENABLE.*//' | tr -d ' ' | sort -u)

  # Step 3: 求差 — 有 accountId 但未在 manual_rls.sql ENABLE RLS
  MISSING_RLS_TABLES=""
  while IFS= read -r tbl; do
    [ -z "$tbl" ] && continue
    if ! printf '%s\n' "$RLS_ENABLED_TABLES" | grep -qxF "$tbl" 2>/dev/null; then
      MISSING_RLS_TABLES="${MISSING_RLS_TABLES}${tbl} "
    fi
  done <<< "$ACCOUNT_TABLES"

  if [ -n "$MISSING_RLS_TABLES" ]; then
    fail "R-21 · account_id 业务表漏 RLS · 以下表有 accountId 但未在 manual_rls.sql ENABLE ROW LEVEL SECURITY: ${MISSING_RLS_TABLES}"
  else
    pass "R-21 · 全部 account_id 业务表均有 RLS (manual_rls.sql 覆盖)"
  fi
else
  echo "⚠️  R-21 · prisma/schema.prisma 或 manual_rls.sql 不存在 · 跳过"
fi

# R-22 · 前后端分离:前端禁 import 后端 apps/api/src 内部(只经 packages)
if grep -rnE "from ['\"][^'\"]*apps/api/src" apps/web/src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "//.*Mirror"; then
  fail "R-22 · 前端 apps/web import 后端 apps/api/src 内部 · 只允许经 @quanan/clients + @quanan/schemas"
else pass "R-22 · 前后端分离(前端无 apps/api/src 内部 import)"; fi

# R-23 · 已删除（VoiceChatAgent 语音下线 2026-06-19）

echo
if [ "$FAIL" -eq 0 ]; then
  echo "✅ 所有红线检测通过 · 0 命中"
  exit 0
else
  echo "❌ 红线检测失败 · 修复后再提"
  exit 1
fi
