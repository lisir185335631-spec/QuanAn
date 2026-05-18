#!/usr/bin/env bash
# verify-prd-17.sh · PRD-17 Step1/3/3b 可重复字面验收
# 运行: bash scripts/verify-prd-17.sh
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
echo " verify-prd-17.sh · PRD-17 Step1/3/3b 字面验收"
echo "======================================================"
echo ""

# §1 industries.ts 字面检查
echo "§1 industries.ts 字面锁"
check "§1.1 含 '全部行业'" \
  "grep -q '全部行业' '$PROJECT_ROOT/apps/web/src/lib/constants/industries.ts'"
check "§1.2 含 '确认并进入下一步'" \
  "grep -q '确认并进入下一步' '$PROJECT_ROOT/apps/web/src/lib/constants/industries.ts'"
echo ""

# §2 step3.ts 字面检查
echo "§2 step3.ts 字面锁"
check "§2.1 含 '📱 抖音'" \
  "grep -qF '📱 抖音' '$PROJECT_ROOT/apps/web/src/lib/constants/step3.ts'"
check "§2.2 含 '生成账号包装方案'" \
  "grep -q '生成账号包装方案' '$PROJECT_ROOT/apps/web/src/lib/constants/step3.ts'"
echo ""

# §3 step3b.ts 字面检查
echo "§3 step3b.ts 字面锁"
check "§3.1 含 '生成专属人设方案'" \
  "grep -q '生成专属人设方案' '$PROJECT_ROOT/apps/web/src/lib/constants/step3b.ts'"
check "§3.2 含 '核心身份定位'" \
  "grep -q '核心身份定位' '$PROJECT_ROOT/apps/web/src/lib/constants/step3b.ts'"
echo ""

# §4 三态组件文件存在
echo "§4 三态组件文件存在"
check "§4.1 LoadingState.tsx 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/components/states/LoadingState.tsx'"
check "§4.2 ErrorState.tsx 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/components/states/ErrorState.tsx'"
check "§4.3 EmptyState.tsx 存在" \
  "test -f '$PROJECT_ROOT/apps/web/src/components/states/EmptyState.tsx'"
echo ""

# §5 page 文件使用常量数组 import 验证
echo "§5 page 重写 — 常量数组 import"
check "§5.1 Step1.tsx uses STEP1_INDUSTRIES_56" \
  "grep -q 'STEP1_INDUSTRIES_56' '$PROJECT_ROOT/apps/web/src/pages/step/Step1.tsx'"
check "§5.2 Step3.tsx uses STEP3_PLATFORMS_5" \
  "grep -q 'STEP3_PLATFORMS_5' '$PROJECT_ROOT/apps/web/src/pages/step/Step3.tsx'"
check "§5.3 Step3b.tsx uses STEP3B_TEXTAREAS_3" \
  "grep -q 'STEP3B_TEXTAREAS_3' '$PROJECT_ROOT/apps/web/src/pages/step/Step3b.tsx'"
echo ""

echo "======================================================"
echo " 结果: ${PASS} 通过 · ${FAIL} 失败"
echo "======================================================"
if [ "$FAIL" -gt 0 ]; then
  echo "❌  FAIL — ${FAIL} 项检查未通过"
  exit 1
else
  echo "✅  ALL PASS — ${PASS}/12 项全部通过"
  exit 0
fi
