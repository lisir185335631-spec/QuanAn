#!/usr/bin/env bash
# scripts/verify-prd-21.sh
# PRD-21 Visual Alignment Foundation — CI gate
# Usage: bash scripts/verify-prd-21.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PASS=0
FAIL=0
SKIP=0

ok()   { echo "  ✅ ok   $*"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ FAIL $*"; FAIL=$((FAIL + 1)); }

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  PRD-21 Visual Alignment Foundation — verify script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────
# §1  Visual diff infrastructure
# ─────────────────────────────────────────────────────────────
echo "§1  Visual diff infrastructure"
echo "─────────────────────────────────────────────────────────────"

# 1.1  visual-diff.ts exists
if [ -f "apps/web/scripts/visual-diff.ts" ]; then
  ok "1.1  apps/web/scripts/visual-diff.ts exists"
else
  fail "1.1  apps/web/scripts/visual-diff.ts missing"
fi

# 1.2  expectVisualMatch exported
if grep -q "export async function expectVisualMatch" "apps/web/scripts/visual-diff.ts" 2>/dev/null; then
  ok "1.2  expectVisualMatch exported from visual-diff.ts"
else
  fail "1.2  expectVisualMatch not exported in visual-diff.ts"
fi

# 1.3  spec exists
if [ -f "tests/e2e/prd21-visual-baseline.spec.ts" ]; then
  ok "1.3  tests/e2e/prd21-visual-baseline.spec.ts exists"
else
  fail "1.3  tests/e2e/prd21-visual-baseline.spec.ts missing"
fi

# 1.4  expectVisualMatch calls >= 4
CALL_COUNT=$(grep -c "expectVisualMatch(" "tests/e2e/prd21-visual-baseline.spec.ts" 2>/dev/null || echo "0")
if [ "$CALL_COUNT" -ge 4 ]; then
  ok "1.4  expectVisualMatch calls: $CALL_COUNT (>= 4)"
else
  fail "1.4  expectVisualMatch calls: $CALL_COUNT (need >= 4)"
fi

# 1.5  maxDiffPixelRatio 0.05 locked (D-206)
if grep -qE "maxDiffPixelRatio.*0\.05|0\.05.*maxDiffPixelRatio" "apps/web/scripts/visual-diff.ts" 2>/dev/null || \
   grep -qE "maxDiffPixelRatio.*0\.05|0\.05.*maxDiffPixelRatio" "apps/web/playwright.config.ts" 2>/dev/null; then
  ok "1.5  maxDiffPixelRatio: 0.05 locked (D-206)"
else
  fail "1.5  maxDiffPixelRatio 0.05 not found in visual-diff.ts or playwright.config.ts"
fi

# 1.6  baseline directory exists
BASELINE_DIR="/tmp/aiipznt-clone-research/screenshots"
if [ -d "$BASELINE_DIR" ]; then
  ok "1.6  baseline dir exists: $BASELINE_DIR"
else
  fail "1.6  baseline dir missing: $BASELINE_DIR"
fi

# 1.7  baseline PNG >= 32
PNG_COUNT=0
if [ -d "$BASELINE_DIR" ]; then
  PNG_COUNT=$(ls "$BASELINE_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
fi
if [ "$PNG_COUNT" -ge 32 ]; then
  ok "1.7  baseline PNG count: $PNG_COUNT (>= 32)"
else
  fail "1.7  baseline PNG count: $PNG_COUNT (need >= 32)"
fi

# 1.8  animations:disabled in apps/web/playwright.config.ts
if grep -qE "animations.*disabled|animations: 'disabled'" "apps/web/playwright.config.ts" 2>/dev/null; then
  ok "1.8  animations:disabled configured in apps/web/playwright.config.ts"
else
  fail "1.8  animations:disabled not found in apps/web/playwright.config.ts"
fi

# ─────────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────────────"
TOTAL=$((PASS + FAIL + SKIP))
echo "  §1 结果: $PASS 通过 · $FAIL 失败 · $SKIP 跳过 (共 $TOTAL 项)"
echo "─────────────────────────────────────────────────────────────"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "❌ PRD-21 §1 CI gate FAILED ($FAIL 检查项不通过)"
  exit 1
else
  echo ""
  echo "✅ PRD-21 §1 CI gate PASSED"
  exit 0
fi
