#!/usr/bin/env bash
# scripts/verify-prd-16.sh
# PRD-16 · 主应用前端对齐 aiipznt(Phase 1) · 9-section verification
# AC-2: PASS/FAIL counters + ok()/fail() + exit $FAIL

set -u
cd "$(dirname "$0")/.."

PASS=0
FAIL=0

ok()   { echo "  [PASS] $*"; PASS=$((PASS+1)); }
fail() { echo "  [FAIL] $*"; FAIL=$((FAIL+1)); }
section() { echo; echo "=== §$1: $2 ==="; }

# ─── §1 · Fonts in index.html ─────────────────────────────────────────────────
section 1 "Font links in apps/web/index.html"

for font in Orbitron Rajdhani; do
  if grep -q "$font" apps/web/index.html; then
    ok "index.html contains $font font link"
  else
    fail "index.html missing $font font link"
  fi
done
# Noto Sans SC may be URL-encoded as Noto+Sans+SC in the Google Fonts href
if grep -qE "Noto.Sans.SC" apps/web/index.html; then
  ok "index.html contains Noto Sans SC font link"
else
  fail "index.html missing Noto Sans SC font link"
fi

# ─── §2 · tailwind.config font families ───────────────────────────────────────
section 2 "tailwind.config display/label/cn font family"

TWCFG="apps/web/tailwind.config.js"
if grep -q "display:" "$TWCFG" && grep -q "'Orbitron'" "$TWCFG"; then
  ok "tailwind.config has display: Orbitron family"
else
  fail "tailwind.config missing display: Orbitron family"
fi

if grep -q "label:" "$TWCFG" && grep -q "'Rajdhani'" "$TWCFG"; then
  ok "tailwind.config has label: Rajdhani family"
else
  fail "tailwind.config missing label: Rajdhani family"
fi

if grep -q "cn:" "$TWCFG" && grep -q "'Noto Sans SC'" "$TWCFG"; then
  ok "tailwind.config has cn: Noto Sans SC family"
else
  fail "tailwind.config missing cn: Noto Sans SC family"
fi

# ─── §3 · aiipznt-motion.css exists + imported ────────────────────────────────
section 3 "aiipznt-motion.css exists + imported in main.tsx"

if [ -f apps/web/src/styles/aiipznt-motion.css ]; then
  ok "apps/web/src/styles/aiipznt-motion.css exists"
else
  fail "apps/web/src/styles/aiipznt-motion.css missing"
fi

if grep -q "aiipznt-motion.css" apps/web/src/main.tsx; then
  ok "main.tsx imports aiipznt-motion.css"
else
  fail "main.tsx does not import aiipznt-motion.css"
fi

# ─── §4 · No gold color tokens in apps/web/src/ ───────────────────────────────
section 4 "No gold color tokens in apps/web/src/"

GOLD_HITS=$(grep -rn '\-\-gold\|border-gold\|bg-gold\|text-gold' apps/web/src/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$GOLD_HITS" -eq 0 ]; then
  ok "0 gold token hits in apps/web/src/ (D4=B: primary gold lives in globals.css only)"
else
  fail "$GOLD_HITS gold token hits found in apps/web/src/ (expected 0)"
  grep -rn '\-\-gold\|border-gold\|bg-gold\|text-gold' apps/web/src/ | head -5
fi

# ─── §5 · Home.tsx — 5 function definitions ───────────────────────────────────
section 5 "Home.tsx has 5 function definitions"

HOME="apps/web/src/pages/Home.tsx"
for fn in HeroSection IpProgressSection FunctionMatrixSection WorkflowSection ReadyToStartSection; do
  if grep -q "function $fn" "$HOME"; then
    ok "Home.tsx defines function $fn"
  else
    fail "Home.tsx missing function $fn"
  fi
done

# ─── §6 · Header.tsx — HeaderNav + HEADER_NAV import + no old arrays ──────────
section 6 "Header.tsx: HeaderNav + HEADER_NAV import + no legacy arrays"

HEADER="apps/web/src/components/Header.tsx"
if grep -q "function HeaderNav" "$HEADER"; then
  ok "Header.tsx defines HeaderNav function"
else
  fail "Header.tsx missing HeaderNav function"
fi

if grep -q "HEADER_NAV" "$HEADER"; then
  ok "Header.tsx imports/uses HEADER_NAV"
else
  fail "Header.tsx does not reference HEADER_NAV"
fi

if grep -q "TOOLS_14" "$HEADER"; then
  fail "Header.tsx still contains deprecated TOOLS_14 array"
else
  ok "Header.tsx does not contain TOOLS_14 (removed)"
fi

if grep -q "NEW_MODULES_6" "$HEADER"; then
  fail "Header.tsx still contains deprecated NEW_MODULES_6 array"
else
  ok "Header.tsx does not contain NEW_MODULES_6 (removed)"
fi

# ─── §7 · Guide.tsx — GUIDE_MODULES(13) + FAQS(5) ───────────────────────────
section 7 "Guide.tsx: GUIDE_MODULES length=13 and FAQS length=5"

GUIDE_CONST="apps/web/src/lib/constants/guide.ts"
MODULES_COUNT=$(awk '/^export const GUIDE_MODULES/,/^export const FAQS/' "$GUIDE_CONST" | grep -c "icon:" || true)
if [ "$MODULES_COUNT" -eq 13 ]; then
  ok "GUIDE_MODULES has 13 entries (counted icon: fields)"
else
  fail "GUIDE_MODULES has $MODULES_COUNT entries (expected 13)"
fi

FAQS_COUNT=$(awk '/^export const FAQS/,0' "$GUIDE_CONST" | grep -c "q:" || true)
if [ "$FAQS_COUNT" -eq 5 ]; then
  ok "FAQS has 5 entries (counted q: fields)"
else
  fail "FAQS has $FAQS_COUNT entries (expected 5)"
fi

# ─── §8 · IpPlan.tsx — STEP_CARDS(9) + correct keys ─────────────────────────
section 8 "IpPlan.tsx: STEP_CARDS length=9 + keys ['1','3','3b','4','4b','5','6','7','8']"

IPPLAN="apps/web/src/pages/IpPlan.tsx"
STEP_COUNT=$(awk '/^const STEP_CARDS/,/^\] as const/' "$IPPLAN" | grep -c "key:" || true)
if [ "$STEP_COUNT" -eq 9 ]; then
  ok "STEP_CARDS has 9 entries"
else
  fail "STEP_CARDS has $STEP_COUNT entries (expected 9)"
fi

REQUIRED_KEYS=("'1'" "'3'" "'3b'" "'4'" "'4b'" "'5'" "'6'" "'7'" "'8'")
for k in "${REQUIRED_KEYS[@]}"; do
  if grep -q "key: $k," "$IPPLAN"; then
    ok "STEP_CARDS contains key $k"
  else
    fail "STEP_CARDS missing key $k"
  fi
done

# ─── §9 · Quality checks ──────────────────────────────────────────────────────
section 9 "Quality checks: typecheck + test + audit:redlines"

echo "  [RUN] cd apps/web && pnpm typecheck..."
if (cd apps/web && pnpm typecheck --noEmit 2>&1 | tail -3); then
  ok "pnpm typecheck PASS"
else
  fail "pnpm typecheck FAIL"
fi

echo "  [RUN] pnpm test..."
if pnpm --filter @quanan/web test 2>&1 | tail -3; then
  ok "pnpm test (apps/web) PASS"
else
  fail "pnpm test (apps/web) FAIL"
fi

echo "  [RUN] pnpm audit:redlines..."
if pnpm audit:redlines 2>&1 | tail -5; then
  ok "pnpm audit:redlines PASS"
else
  fail "pnpm audit:redlines FAIL"
fi

# ─── Result ───────────────────────────────────────────────────────────────────
echo
echo "══════════════════════════════════════════════════"
echo "Result: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════════════════"

exit $FAIL
