#!/usr/bin/env bash
# QuanAn · 18 LD + 5 复杂 R 检测 (TD-018 修 · 2026-05-09 新建 · 2026-06-18 R-14 扩展+fallbackTemplate 检测)
# 派生自 AGENTS.md §3 Locked Decisions + §5.6 红线
# audit-redlines.sh 已 cover 12 条简单 grep · 本脚本补 5 条复杂 + 18 LD 关键验证

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0
fail() { echo "❌ $1"; FAIL=1; }
pass() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  QuanAn · 18 LD + 5 复杂 R 检测"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# §1 · 18 Locked Decisions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "=== §1 · Locked Decisions (18 条) ==="

# LD-001 · 95/5 编排 (Workflow vs Agent · 不允许 Specialist 内多轮 LLM 循环)
# 已被 audit-redlines.sh R-3 覆盖 · 这里仅复检
# 精确匹配真实 LLM 调用模式(llmGateway/invokeLLM/.complete(/.stream()·非裸 stream 子串——
# 后者会误匹配 LivestreamAgent.ts 文件名里的 "stream"·把 PII 字段遍历的 for 当成 LLM 循环·假狼)
SPECIALIST_LOOPS=$(grep -rE "(for|while)\s*\(" apps/api/src/specialists/ --include="*.ts" 2>/dev/null \
    | grep -v "/__tests__/" | grep -vE "^[^:]+:[0-9]+:\s*(\*|//|/\*)" \
    | grep -iE "llmGateway|invokeLLM|\.complete\(|\.stream\(" | wc -l | tr -d ' ')
if [ "$SPECIALIST_LOOPS" -gt 0 ]; then fail "LD-001 · Specialist 内 ${SPECIALIST_LOOPS} 处 LLM 循环 · 触犯 95/5"
else pass "LD-001 · 95% Workflow + 5% Agent (Specialist 0 LLM 循环)"; fi

# LD-002 · 14 能力域 Specialist 切分 (上限 14，VoiceChatAgent 语音下线 2026-06-19)
# TD-061 fix: 数 "extends BaseSpecialist" 全量(12 step in specialists/ + 2 autonomous in agents/: Evolution·DailyTask)
#            与 audit-redlines.sh R-15 同口径
COUNT=$(grep -rl "extends BaseSpecialist" apps/api/src --include="*.ts" 2>/dev/null \
    | grep -v "\.test\." | wc -l | tr -d ' ')
if [ "$COUNT" -gt 14 ]; then fail "LD-002 · Specialist 数 ${COUNT} > 14"
else pass "LD-002 · 14 能力域 (实际 ${COUNT}/14 · 12 step + 2 autonomous)"; fi

# LD-004 · 2 L5 自治 Agent 走外部 orchestrator (ADR-005 + ADR-018)
# 关键设计意图: EvolutionAgent / DailyTaskAgent 不允许 LLM 自循环 (VoiceChatAgent 语音下线已删)
# 文件存在于 specialists/ 是合法的 (BaseSpecialist 单次 execute) · 由 bullmq queue / cron / user event 触发
# TD-052 fix: 旧 grep 用文件名匹配是错的 · 改为检测**文件内是否有自循环** (while/for 调 LLM)
# 已被 R-3 部分覆盖 · 这里专门 deep-check 2 个 L5 文件
# 路径修: 多候选目录 fallback + 找不到时 warn 暴露(不静默 continue)
L5_NAMES=(EvolutionAgent DailyTaskAgent)
L5_VIOLATION=""
for name in "${L5_NAMES[@]}"; do
  # 多路径 fallback: specialists/ / agents/evolution/ / agents/specialists/
  f=""
  for candidate in \
      "apps/api/src/specialists/${name}.ts" \
      "apps/api/src/agents/evolution/${name}.ts" \
      "apps/api/src/agents/specialists/${name}.ts"; do
    if [ -f "$candidate" ]; then
      f="$candidate"
      break
    fi
  done
  # 兜底: find 扫全 apps/api/src
  if [ -z "$f" ]; then
    found=$(find apps/api/src -name "${name}.ts" 2>/dev/null | grep -v "\.test\." | head -1)
    if [ -n "$found" ]; then
      f="$found"
    fi
  fi
  # 找不到: warn 暴露(不静默 continue)
  if [ -z "$f" ]; then
    warn "LD-004 · L5 agent ${name} 文件未找到 · 漏查已暴露 · 需手动确认路径"
    continue
  fi
  # 检测自循环: while/for + 行内或附近含 llm/invoke/complete/stream
  if grep -A 10 -E "^\s*(for|while)\s*\(" "$f" 2>/dev/null \
      | grep -iE "llm|invoke|complete|stream\.read" \
      | grep -vE "^\s*(\*|//|/\*)" \
      | head -1 | grep -q .; then
    L5_VIOLATION="${L5_VIOLATION}${name}.ts "
  fi
done
if [ -n "$L5_VIOLATION" ]; then fail "LD-004 · L5 Agent 自循环 · 必须用 ADR-018 外部 orchestrator: ${L5_VIOLATION}"
else pass "LD-004 · 2 L5 Agent 无自循环 (BaseSpecialist 单次 execute + 外部 orchestrator)"; fi

# LD-005 · BaseSpecialist 抽象 + 五层配置
# TD-052 fix: 排除 EvolutionAgent.ts re-export stub (D-007 · 真实实现在 @/agents/evolution/EvolutionAgent) · TD-024 dual path resolved
# stub 文件含 `export { EvolutionAgent } from '@/agents/...'` · 不是直接 class definition
SPECIALIST_FILES=$(ls apps/api/src/specialists/*.ts 2>/dev/null \
    | grep -v "/base/" | grep -v "\.test\." | grep -v "/__tests__/" \
    | grep -v "/registry\.ts" | grep -v "/index\.ts")  # TD-061: registry.ts/index.ts 非 Specialist 实现·排除避免误判"未 extends"
if [ -z "$SPECIALIST_FILES" ]; then warn "LD-005 · 0 Specialist 实现 · 跳过"
else
  MISSING=0
  for f in $SPECIALIST_FILES; do
    # 跳过 re-export stub (含 from '@/agents/' · 真实实现在 agents/ 目录 · D-007 + TD-024)
    # 用 grep 单独检测一行 `from '@/agents/`(multi-line export 块会在 `from` 行命中)
    if grep -qE "from\s*['\"]@/agents/" "$f" 2>/dev/null; then
      continue
    fi
    if ! grep -q "extends BaseSpecialist" "$f"; then
      echo "  ⚠️  $(basename $f) 未 extends BaseSpecialist"
      MISSING=$((MISSING + 1))
    fi
  done
  if [ "$MISSING" -gt 0 ]; then fail "LD-005 · ${MISSING} 个 Specialist 未 extends BaseSpecialist"
  else pass "LD-005 · 全 Specialist extends BaseSpecialist (re-export stub 豁免 · D-007 TD-024 resolved)"; fi
fi

# LD-007 · ContextAssembler 是 prompt 注入唯一入口 (R-11 自拼 prompt)
# audit-redlines.sh R-11 已 cover 自拼 systemPrompt · 这里验证 BaseSpecialist 必走 contextAssembler.assemble
if grep -q "contextAssembler.assemble\|_contextAssembler.assemble" apps/api/src/specialists/base/BaseSpecialist.ts 2>/dev/null; then
  pass "LD-007 · BaseSpecialist 走 contextAssembler.assemble (唯一 prompt 入口)"
else fail "LD-007 · BaseSpecialist 未走 contextAssembler · 触犯唯一入口"; fi

# LD-009 · IpAccount 多账号隔离 3 道闸
GATE_1=$(grep -rl "accountIsolationMiddleware\|protectedProcedure" apps/api/src/trpc/middleware/ 2>/dev/null | wc -l | tr -d ' ')
GATE_2=$(grep -rln "set_config.*account\|set_config.*current_account" apps/api/src/ 2>/dev/null | wc -l | tr -d ' ')
# TD-061 fix: 递归扫 routers/(真 router 在 routers/app·routers/admin 子目录)·旧 routers/*.ts 非递归只数顶层=0 误报
PROTECTED_ROUTERS=$(grep -rl "protectedProcedure" apps/api/src/trpc/routers/ --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
if [ "$GATE_1" -ge 1 ] && [ "$GATE_2" -ge 1 ] && [ "$PROTECTED_ROUTERS" -ge 5 ]; then
  pass "LD-009 · 3 道闸 (middleware ${GATE_1} · set_config ${GATE_2} · ${PROTECTED_ROUTERS} routers protectedProcedure)"
else fail "LD-009 · 3 道闸不全 (middleware=${GATE_1} · set_config=${GATE_2} · routers=${PROTECTED_ROUTERS})"; fi

# LD-010 · LS↔DB 双写 (前端 ls-namespace 集中管理)
if [ -f "apps/web/src/lib/ls-namespace.ts" ] && grep -q "stepLsKey\|getToolLsKey" apps/web/src/lib/ls-namespace.ts; then
  pass "LD-010 · LS↔DB 双写 (ls-namespace.ts 集中管理)"
else fail "LD-010 · ls-namespace.ts 缺失或无 helper · 触犯 LD-010"; fi

# LD-012 · 全部 LLM 调用走 LLMGateway (audit-redlines.sh R-1 已 cover)
if [ -d "apps/api/src/workers/llm-gateway" ] && [ -f "apps/api/src/workers/llm-gateway/index.ts" ]; then
  pass "LD-012 · LLMGateway 实现存在 (R-1 grep 已 cover)"
else fail "LD-012 · LLMGateway 实现缺失"; fi

# LD-013 · 强类型 + zod schema + 无 any (R-10 + tsconfig strict)
STRICT_COUNT=$(grep -l '"strict": true' apps/*/tsconfig.json packages/*/tsconfig.json tsconfig.base.json 2>/dev/null | wc -l | tr -d ' ')
ZOD_SCHEMAS=$(find packages/schemas/src -name "*.schema.ts" 2>/dev/null | wc -l | tr -d ' ')
if [ "$STRICT_COUNT" -ge 1 ] && [ "$ZOD_SCHEMAS" -ge 5 ]; then
  pass "LD-013 · strict tsconfig × ${STRICT_COUNT} + ${ZOD_SCHEMAS} zod schemas"
else fail "LD-013 · strict=${STRICT_COUNT} · schemas=${ZOD_SCHEMAS}"; fi

# LD-016 · 测试金字塔 + LLM Judge + Prompt 回归
JUDGE_FILES=$(ls tests/judge/*.judge.ts 2>/dev/null | wc -l | tr -d ' ')
UNIT_DIRS=$(find tests/unit -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l | tr -d ' ')
E2E_FILES=$(ls tests/e2e/*.spec.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$JUDGE_FILES" -ge 1 ] && [ "$UNIT_DIRS" -ge 5 ] && [ "$E2E_FILES" -ge 5 ]; then
  pass "LD-016 · 测试金字塔 (unit ${UNIT_DIRS} · judge ${JUDGE_FILES} · e2e ${E2E_FILES})"
else fail "LD-016 · 测试不全 (unit=${UNIT_DIRS} · judge=${JUDGE_FILES} · e2e=${E2E_FILES})"; fi

# LD-018 · PII mask + 行业免责 (R-14 详见 §2.1)
# 见下文 R-14

# LD-A-1 · admin 子系统独立部署 (admin 占位 + 主 web 不引用 admin)
if [ -d "apps/admin" ]; then
  CROSS_IMPORT=$(grep -rln "from '@quanan/admin\|from '../../admin\|from '../admin" apps/web/src 2>/dev/null | wc -l | tr -d ' ')
  if [ "$CROSS_IMPORT" -gt 0 ]; then fail "LD-A-1 · apps/web 引用 apps/admin · 触犯独立部署"
  else pass "LD-A-1 · apps/admin 独立部署 (apps/web 0 引用)"; fi
else warn "LD-A-1 · apps/admin 不存在 · 跳过"; fi

# LD-A-3 · admin 13 表 RLS DISABLE (本期未实施 admin · 跳过验证)
if grep -q "admin_audit_log\|admin_role" prisma/schema.prisma 2>/dev/null; then
  pass "LD-A-3 · admin schema 已存在 (RLS 验证留 PRD-10+)"
else warn "LD-A-3 · admin schema 未实施 (PRD-10+ 才有)"; fi

echo

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# §2 · 5 复杂红线 (R-6/7/8/12/13/14)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "=== §2 · 复杂红线 5 条 ==="

# R-6 · account 维度表 RLS 覆盖 —— 归口 R-21(避免维护两份易错逻辑)
# 历史教训(三轮 review 暴露):旧 R-6 前提错误——"所有 @@map model 都该在 manual_rls"。但全局/常量表
#   (audit_log/industries/invite_codes/knowledge_chunk/constant_* 等)无 accountId 字段、设计上本就不开 RLS;
#   逐个打补丁(路径→model 名→head 截断→admin 排除)始终误报全局表。根因是检测对象错(应只检"有 accountId 字段"的表)。
#   R-21(audit-redlines.sh)才做对了 accountId 字段过滤,只报真漏(trending_favorites)。故 R-6 不再重复实现,归口 R-21。
pass "R-6 · account 表 RLS 覆盖归口 R-21(audit-redlines.sh·按'有 accountId 字段但缺 RLS'精确检测·只报真漏);此处不重复实现"

# R-7 · prisma schema 漂移 (manual review · 跑 prisma migrate status)
warn "R-7 · schema 漂移检测需 manual: pnpm prisma migrate status"

# R-8 · zod schema 缺失 (tRPC procedure 必带 .input(zod))
PROCEDURE_NO_INPUT=$(grep -rB 1 "protectedProcedure" apps/api/src/trpc/routers/*.ts 2>/dev/null \
    | grep -A 1 "protectedProcedure$" | grep "^[^:]*--$" -B 1 \
    | grep -v "\.input\|\.query\|\.mutation\|^--" | head -5 || true)
if [ -n "$PROCEDURE_NO_INPUT" ]; then
  warn "R-8 · 可能缺 .input(zod) 的 procedure (manual review):"
  echo "$PROCEDURE_NO_INPUT" | head -5 | sed 's/^/    /'
else pass "R-8 · tRPC procedure .input(zod) 检测通过 (basic)"; fi

# R-12 · prisma.$transaction (manual review · 多写场景)
TX_COUNT=$(grep -rn 'prisma\.\$transaction' apps/api/src --include="*.ts" 2>/dev/null \
    | grep -v "\.test\." | wc -l | tr -d ' ')
pass "R-12 · prisma.\$transaction 实际使用 ${TX_COUNT} 处 (manual review 是否覆盖多写场景)"

# R-13 · 乐观锁 (manual review · update 必带 version 或 updatedAt 检查)
warn "R-13 · 乐观锁需 manual review (prisma update 必带 version 或 conditional updatedAt)"

# R-14 · PII mask + 行业免责 (TD-016 配套硬验证)
echo
echo "  --- R-14 PII / 免责 (LD-018 · TD-016 配套) ---"
PII_HOOK=$(grep -l "piiMask\|maskString" \
    apps/api/src/services/context-assembler/ContextAssembler.ts 2>/dev/null | wc -l | tr -d ' ')
DISCLAIMER_HOOK=$(grep -l "appendDisclaimerIfSensitive\|attachDisclaimerMeta" \
    apps/api/src/specialists/base/BaseSpecialist.ts 2>/dev/null | wc -l | tr -d ' ')
PII_TESTS=$(grep -rl "piiMask\|appendDisclaimerIfSensitive" tests/unit/ 2>/dev/null | wc -l | tr -d ' ')

if [ "$PII_HOOK" -ge 1 ] && [ "$DISCLAIMER_HOOK" -ge 1 ] && [ "$PII_TESTS" -ge 1 ]; then
  pass "R-14 · PII 接线 (ContextAssembler ${PII_HOOK} + BaseSpecialist ${DISCLAIMER_HOOK}) + ${PII_TESTS} test files"
else fail "R-14 · PII drift! ContextAssembler PII=${PII_HOOK} · BaseSpecialist disclaimer=${DISCLAIMER_HOOK} · tests=${PII_TESTS} (LD-018 R-14 违规)"; fi

# R-14 扩展 · Specialist._buildUserPrompt piiMask 覆盖 (警示级 · 非硬 fail)
# 为何 warn 非 fail (Opus 把关 · 防误报): "有 _buildUserPrompt 无 piiMask" ≠ 真泄漏——多数 Specialist 把【已脱敏的
#   ctx.userPrompt】作前缀, 是否泄漏取决于 _buildUserPrompt 是否插入【未脱敏的原始 req.userInput 字段】+ 该字段是否含 PII,
#   grep 无法精确判定 → 列警示供人工核。已坐实真漏洞 = PrivateDomainAgent (完全绕 ctx · 见 §13 G2 · 阶段6 修)。
# 排除: VoiceChatAgent 已删除 / test / base / registry
echo
echo "  --- R-14 扩展 · Specialist._buildUserPrompt piiMask 覆盖 (警示级 · 需人工核) ---"
PII_BYPASS_WARN=0
for f in apps/api/src/specialists/*.ts; do
  case "$f" in
    */__tests__/*|*/base/*|*/registry.ts) continue ;;
  esac
  if ! grep -qE "_buildUserPrompt|_buildPrompt" "$f" 2>/dev/null; then
    continue
  fi
  if echo "$f" | grep -q "VoiceChatAgent"; then
    continue
  fi
  if ! grep -qE "piiMask|maskString" "$f" 2>/dev/null; then
    warn "R-14 扩展 · $(basename $f) 有 _buildUserPrompt 无 piiMask → 人工核是否插入未脱敏原始字段 (PrivateDomainAgent 已坐实真漏洞·见 §13 G2)"
    PII_BYPASS_WARN=1
  fi
done
if [ "$PII_BYPASS_WARN" -eq 0 ]; then
  pass "R-14 扩展 · 全 Specialist _buildUserPrompt 均有 piiMask 覆盖 (VoiceChatAgent 豁免)"
fi

# fallbackTemplate 覆盖检测 (警示级 · 非硬 fail)
# 原理: Specialist 若无 fallbackTemplate → LLM 失败时无兜底返回 · 前端 skeleton 死挂
# 排除: VoiceChatAgent (override execute · streaming 不走 fallbackTemplate 路径)
echo
echo "  --- fallbackTemplate 覆盖检测 (警示级 · 非 fail) ---"
for f in apps/api/src/specialists/*.ts; do
  case "$f" in
    */__tests__/*|*/base/*|*/registry.ts) continue ;;
  esac
  # VoiceChatAgent 已删除（语音下线）
  if echo "$f" | grep -q "VoiceChatAgent"; then
    continue
  fi
  if ! grep -q "fallbackTemplate" "$f" 2>/dev/null; then
    warn "fallbackTemplate · $(basename $f) 未声明 fallbackTemplate · LLM 失败时无兜底 (建议补充)"
  fi
done

echo
if [ "$FAIL" -eq 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ✅ LD + 复杂红线检测通过 · 0 fail"
  echo "  (warn 是 manual review 提示 · 不阻断)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ❌ LD + 复杂红线检测失败 · 修复后再提"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
