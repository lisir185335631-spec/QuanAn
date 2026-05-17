#!/usr/bin/env bash
# verify-prd-18.sh · PRD-18 Step4/4b/5/6/7/8 字面验收
# 运行: bash scripts/verify-prd-18.sh
# 退出码: 0 = ALL PASS · 1 = FAIL

set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0

check() {
  local desc="$1"
  local cmd="$2"
  if eval "$cmd" &>/dev/null; then
    echo "✅  $desc"
    PASS=$((PASS + 1))
  else
    echo "❌  $desc"
    FAIL=$((FAIL + 1))
  fi
}

echo "======================================================"
echo " verify-prd-18.sh · PRD-18 Step4/4b/5/6/7/8 字面验收"
echo "======================================================"
echo ""

# §1 六个 constants 文件存在
echo "§1 constants 文件存在 (#1-6)"
check "#1 step4.ts 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/lib/constants/step4.ts'"
check "#2 step4b.ts 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/lib/constants/step4b.ts'"
check "#3 step5.ts 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/lib/constants/step5.ts'"
check "#4 step6.ts 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/lib/constants/step6.ts'"
check "#5 step7.ts 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/lib/constants/step7.ts'"
check "#6 step8.ts 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/lib/constants/step8.ts'"
echo ""

# §2 六个 Step page 文件存在
echo "§2 Step page 文件存在 (#7-12)"
check "#7  Step4.tsx 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/pages/step/Step4.tsx'"
check "#8  Step4b.tsx 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/pages/step/Step4b.tsx'"
check "#9  Step5.tsx 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/pages/step/Step5.tsx'"
check "#10 Step6.tsx 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/pages/step/Step6.tsx'"
check "#11 Step7.tsx 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/pages/step/Step7.tsx'"
check "#12 Step8.tsx 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/pages/step/Step8.tsx'"
echo ""

# §3 字面常量 grep (#13)
echo "§3 字面常量 grep (#13)"
check "#13a STEP4_SUBTITLE_TEMPLATE 存在" \
  "grep -qF 'STEP4_SUBTITLE_TEMPLATE' '$PROJECT_ROOT/apps/web/src/lib/constants/step4.ts'"
check "#13b STEP4B_THREE_STAGES 存在" \
  "grep -qF 'STEP4B_THREE_STAGES' '$PROJECT_ROOT/apps/web/src/lib/constants/step4b.ts'"
check "#13c STEP5_CATEGORIES_5 存在" \
  "grep -qF 'STEP5_CATEGORIES_5' '$PROJECT_ROOT/apps/web/src/lib/constants/step5.ts'"
check "#13d STEP7_SCRIPT_TYPES_20 存在" \
  "grep -qF 'STEP7_SCRIPT_TYPES_20' '$PROJECT_ROOT/apps/web/src/lib/constants/step7.ts'"
check "#13e STEP8_SUBFUNCTIONS_2 存在" \
  "grep -qF 'STEP8_SUBFUNCTIONS_2' '$PROJECT_ROOT/apps/web/src/lib/constants/step8.ts'"
echo ""

# §4 D4=B grep — 严禁 violet/amber 渐变颜色(#14)
echo "§4 D4=B grep · 严禁 violet/amber 渐变颜色 (#14)"
check "#14 from-violet/from-amber/text-violet/bg-amber 0 命中" \
  "! grep -rEq 'from-violet|from-amber|text-violet|bg-amber' \
    '$PROJECT_ROOT/apps/web/src/pages/step/' \
    '$PROJECT_ROOT/apps/web/src/components/step4b' \
    '$PROJECT_ROOT/apps/web/src/components/step5' \
    '$PROJECT_ROOT/apps/web/src/components/step7' \
    '$PROJECT_ROOT/apps/web/src/components/step8' \
    2>/dev/null"
echo ""

# §5 D3=A grep — 仅主应用 · admin/api/packages 0 改动 (#15)
echo "§5 D3=A grep · admin/api/packages 0 改动 (#15)"
check "#15 git diff main..HEAD 不含 apps/admin/ apps/api/ packages/ 变更" \
  "! git -C '$PROJECT_ROOT' diff main..HEAD --name-only 2>/dev/null | grep -qE '^(apps/admin|apps/api|packages)/'"
echo ""

# §6 跨 step localStorage key grep (#16)
echo "§6 跨 step localStorage key grep (#16)"
check "#16a acc_step4 在 Step4.tsx" \
  "grep -lF 'acc_step4' '$PROJECT_ROOT/apps/web/src/pages/step/Step4.tsx'"
check "#16b acc_step4b 在 Step4b.tsx" \
  "grep -lF 'acc_step4b' '$PROJECT_ROOT/apps/web/src/pages/step/Step4b.tsx'"
check "#16c acc_step5 在 Step5.tsx" \
  "grep -lF 'acc_step5' '$PROJECT_ROOT/apps/web/src/pages/step/Step5.tsx'"
check "#16d acc_step5_selected_topic 在 step5/ 组件" \
  "grep -rlF 'acc_step5_selected_topic' '$PROJECT_ROOT/apps/web/src/components/step5/'"
check "#16e acc_step6 在 Step6.tsx" \
  "grep -lF 'acc_step6' '$PROJECT_ROOT/apps/web/src/pages/step/Step6.tsx'"
check "#16f acc_step7 在 Step7.tsx" \
  "grep -lF 'acc_step7' '$PROJECT_ROOT/apps/web/src/pages/step/Step7.tsx'"
check "#16g acc_step8 在 step8/ 组件" \
  "grep -rlF 'acc_step8' '$PROJECT_ROOT/apps/web/src/components/step8/'"
echo ""

TOTAL=$((PASS + FAIL))
echo "======================================================"
echo " 结果: ${PASS} 通过 · ${FAIL} 失败 · 共 ${TOTAL} 项"
echo "======================================================"
if [ "$FAIL" -gt 0 ]; then
  echo "❌  FAIL — ${FAIL}/${TOTAL} 项检查未通过"
  exit 1
else
  echo "✅  ${PASS}/${TOTAL} ALL PASS"
  exit 0
fi
