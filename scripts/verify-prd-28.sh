#!/usr/bin/env bash
# verify-prd-28.sh — PRD-28 evaluation 完整化 · 7 sections · ≥ 25 checks
# Usage: bash scripts/verify-prd-28.sh
# Exit 0 if all checks PASS

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PASS=0; FAIL=0

check() {
  local label="$1"; local cmd="$2"
  if eval "$cmd" > /dev/null 2>&1; then
    echo "  ✅ PASS  $label"; PASS=$((PASS + 1))
  else
    echo "  ❌ FAIL  $label"; FAIL=$((FAIL + 1))
  fi
}

echo "========================================"
echo " PRD-28 Evaluation 完整化 · Verify Script"
echo "========================================"

# ──────────────────────────────────────────
# §1  21 judge file mock 拆除验证
# ──────────────────────────────────────────
echo ""
echo "§1  21 judge file mock 拆除验证"
echo "────────────────────────────────"

check "vi.mock llm-gateway = 0 across all judge files" \
  "[ \$(grep -rn 'vi.mock.*llm-gateway' tests/judge/ 2>/dev/null | wc -l) -eq 0 ]"

check "describe.skipIf ANTHROPIC_API_KEY ≥ 21 judge files" \
  "[ \$(grep -rn 'describe.skipIf.*ANTHROPIC_API_KEY' tests/judge/ 2>/dev/null | wc -l) -ge 21 ]"

check "tests/setup.ts exists (dotenv infra)" \
  "test -f tests/setup.ts"

check "vitest.judge.config.ts has setupFiles" \
  "grep -q 'setupFiles' vitest.judge.config.ts"

check "branding.judge.ts mock-free (batch 1 sample)" \
  "! grep -q 'vi.mock.*llm-gateway' tests/judge/branding.judge.ts"

check "voice-chat.judge.ts mock-free (batch 3 sample)" \
  "! grep -q 'vi.mock.*llm-gateway' tests/judge/voice-chat.judge.ts"

# ──────────────────────────────────────────
# §2  100 fixtures 文件 + count
# ──────────────────────────────────────────
echo ""
echo "§2  100 金标准 fixtures 验证"
echo "────────────────────────────────"

check "sally-30.json exists" \
  "test -f tests/fixtures/judge-goldens/sally-30.json"

check "custom-70.json exists" \
  "test -f tests/fixtures/judge-goldens/custom-70.json"

check "sally-30.json length = 30" \
  "[ \$(jq 'length' tests/fixtures/judge-goldens/sally-30.json) -eq 30 ]"

check "custom-70.json length = 70" \
  "[ \$(jq 'length' tests/fixtures/judge-goldens/custom-70.json) -eq 70 ]"

check "SCHEMA.md ≥ 50 lines" \
  "[ \$(wc -l < tests/fixtures/judge-goldens/SCHEMA.md) -ge 50 ]"

check "GoldenSample zod schema exported from packages/schemas" \
  "grep -q 'goldenSampleSchema\|GoldenSample' packages/schemas/src/index.ts"

# ──────────────────────────────────────────
# §3  evaluation 表 RLS DISABLE
# ──────────────────────────────────────────
echo ""
echo "§3  evaluation 表 RLS DISABLE 验证"
echo "────────────────────────────────"

check "prisma schema has EvaluationRun model" \
  "grep -q 'model EvaluationRun' prisma/schema.prisma"

check "prisma schema has EvaluationSample model" \
  "grep -q 'model EvaluationSample' prisma/schema.prisma"

check "evaluation_runs table exists in DB" \
  "psql postgresql://return@localhost:5432/quanqn -c '\\dt evaluation_runs' 2>/dev/null | grep -q evaluation_runs"

check "evaluation_samples table exists in DB" \
  "psql postgresql://return@localhost:5432/quanqn -c '\\dt evaluation_samples' 2>/dev/null | grep -q evaluation_samples"

check "evaluation_runs RLS disabled" \
  "psql postgresql://return@localhost:5432/quanqn -t -c \"SELECT relrowsecurity FROM pg_class WHERE relname='evaluation_runs';\" 2>/dev/null | grep -q 'f'"

check "evaluation_samples RLS disabled" \
  "psql postgresql://return@localhost:5432/quanqn -t -c \"SELECT relrowsecurity FROM pg_class WHERE relname='evaluation_samples';\" 2>/dev/null | grep -q 'f'"

# ──────────────────────────────────────────
# §4  eval-run CLI 可加载
# ──────────────────────────────────────────
echo ""
echo "§4  eval-run CLI 可加载验证"
echo "────────────────────────────────"

check "eval-run.ts exists" \
  "test -f apps/api/src/scripts/eval-run.ts"

check "evaluator.ts exists" \
  "test -f apps/api/src/evaluation/evaluator.ts"

check "apps/api package.json has eval:run script" \
  "jq -e '.scripts[\"eval:run\"]' apps/api/package.json > /dev/null"

check "evaluator.test.ts ≥ 4 tests" \
  "[ \$(grep -c \"it('\" tests/unit/api/evaluation/evaluator.test.ts 2>/dev/null || echo 0) -ge 4 ]"

check "eval-run.test.ts exists" \
  "test -f tests/unit/api/evaluation/eval-run.test.ts"

# ──────────────────────────────────────────
# §5  admin 3 路由 + visual baseline
# ──────────────────────────────────────────
echo ""
echo "§5  admin 3 路由 + visual baseline 验证"
echo "────────────────────────────────"

check "EvaluationPage.tsx exists (list view)" \
  "test -f apps/admin/src/pages/evaluation/EvaluationPage.tsx"

check "EvaluationDetailPage.tsx exists (drill-down)" \
  "test -f apps/admin/src/pages/evaluation/EvaluationDetailPage.tsx"

check "InterRaterPage.tsx exists (hand-scoring UI)" \
  "test -f apps/admin/src/pages/evaluation/InterRaterPage.tsx"

check "3 evaluation routes in admin router.tsx" \
  "[ \$(grep -c 'evaluation' apps/admin/src/router.tsx) -ge 3 ]"

check "prd28-evaluation-baseline.spec.ts exists" \
  "test -f tests/e2e/admin/prd28-evaluation-baseline.spec.ts"

check "package.json has test:visual:prd28 script" \
  "jq -e '.scripts[\"test:visual:prd28\"]' package.json > /dev/null"

# ──────────────────────────────────────────
# §6  inter-rater Cohen's kappa unit tests
# ──────────────────────────────────────────
echo ""
echo "§6  inter-rater Cohen's kappa unit tests"
echo "────────────────────────────────"

check "inter-rater.ts exists" \
  "test -f apps/api/src/lib/evaluation/inter-rater.ts"

check "inter-rater.test.ts exists" \
  "test -f apps/api/src/lib/evaluation/__tests__/inter-rater.test.ts"

check "cohenKappa function implemented" \
  "grep -q 'export function cohenKappa' apps/api/src/lib/evaluation/inter-rater.ts"

check "pearsonCorrelation function implemented" \
  "grep -q 'export function pearsonCorrelation' apps/api/src/lib/evaluation/inter-rater.ts"

check "listInterRaterSubset uses mulberry32 PRNG" \
  "grep -q 'mulberry32' apps/api/src/lib/evaluation/inter-rater.ts"

check "inter-rater.test.ts ≥ 4 unit tests" \
  "[ \$(grep -c \"it('\" apps/api/src/lib/evaluation/__tests__/inter-rater.test.ts 2>/dev/null || echo 0) -ge 4 ]"

check "kappa perfect agreement test present" \
  "grep -q 'agree perfectly\|κ = 1\|kappa.*1\|perfect' apps/api/src/lib/evaluation/__tests__/inter-rater.test.ts"

# ──────────────────────────────────────────
# §7  /goal-verify §evaluation 集成 + retro
# ──────────────────────────────────────────
echo ""
echo "§7  /goal-verify §evaluation 集成 + retro 验证"
echo "────────────────────────────────"

check "prd-28-evaluation.md verification doc exists" \
  "test -f .agents/verification/prd-28-evaluation.md"

check "prd-28-evaluation.md ≥ 200 lines" \
  "[ \$(wc -l < .agents/verification/prd-28-evaluation.md) -ge 200 ]"

check "prd-28-vs-prd-27-retrospective.md retro exists" \
  "test -f .agents/retros/prd-28-vs-prd-27-retrospective.md"

check "prd-28-vs-prd-27-retrospective.md ≥ 250 lines" \
  "[ \$(wc -l < .agents/retros/prd-28-vs-prd-27-retrospective.md) -ge 250 ]"

check "AGENTS.md §11.19 PRD-28 evaluation沉淀 added" \
  "grep -q '§11.19' AGENTS.md"

check "tech-debt.json TD-027 has PRD-28 evidence" \
  "python3 -c \"import json; data=json.load(open('.agents/tech-debt.json')); td=next(x for x in data['items'] if x['id']=='TD-027'); assert 'PRD-28' in str(td.get('prd28_close_evidence',''))\""

check "goal-verify.md has evaluation dimension section" \
  "grep -qi 'evaluation' ~/.claude/commands/goal-verify.md"

# ──────────────────────────────────────────
# Summary
# ──────────────────────────────────────────
echo ""
echo "========================================"
TOTAL=$(( PASS + FAIL ))
echo " Summary: $PASS / $TOTAL PASS  |  $FAIL FAIL"
echo "========================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo " ALL PASS — PRD-28 verification complete"
exit 0
