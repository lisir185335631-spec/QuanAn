#!/bin/bash
# scripts/ralph/switch-prd.sh
# 用途 · 安全切换 14 PRD 中的下一份(参 PRD-MASTER §7.4 B)
#
# 用法:
#   bash scripts/ralph/switch-prd.sh prd-2

set -e
NEXT_PRD=$1  # 例:"prd-2"

if [ -z "$NEXT_PRD" ]; then
  echo "用法 · bash scripts/ralph/switch-prd.sh prd-2"
  exit 1
fi

cd "$(dirname "$0")/../.."

# 1. 检查当前 PRD 是否跑完(audit-gate.json 状态)
if [ -f scripts/ralph/audit-gate.json ]; then
  STATUS=$(jq -r '.status' scripts/ralph/audit-gate.json 2>/dev/null || echo "unknown")
  if [ "$STATUS" != "all_approved" ] && [ "$STATUS" != "all_completed" ]; then
    echo "⚠️ 当前 PRD 未完成(status=$STATUS)· 中止切换"
    exit 1
  fi
fi

# 2. 备份当前 PRD 为 prd-N.done.json
if [ -f scripts/ralph/prd.json ]; then
  CURRENT_NAME=$(jq -r '.name // .id // "unknown"' scripts/ralph/prd.json 2>/dev/null)
  cp scripts/ralph/prd.json "scripts/ralph/${CURRENT_NAME}.done.json"
  echo "✅ 已备份 ${CURRENT_NAME}.done.json"
fi

# 3. 反哺反例库(参 ralph-tools.py reject-export · 如有)
if [ -f scripts/ralph/ralph-tools.py ]; then
  python scripts/ralph/ralph-tools.py reject-export 2>/dev/null || true
fi

# 4. 清旧 audit-gate / lock(让 ralph.py 启动时不被旧状态干扰)
rm -f scripts/ralph/audit-gate.json scripts/ralph/ralph-lock.json

# 5. 复制新 PRD
if [ ! -f "scripts/ralph/${NEXT_PRD}.json" ]; then
  echo "❌ 找不到 scripts/ralph/${NEXT_PRD}.json"
  echo "   请先 ralph skill 把 tasks/${NEXT_PRD}.md 转成 ${NEXT_PRD}.json"
  exit 1
fi
cp "scripts/ralph/${NEXT_PRD}.json" scripts/ralph/prd.json

# 6. 备份新 PRD 启动前快照(给 /goal-verify 回查用)
cp scripts/ralph/prd.json "scripts/ralph/${NEXT_PRD}.start.json"

echo "✅ 已切换到 ${NEXT_PRD}"
echo "   下一步 · python scripts/ralph/ralph.py --model sonnet --daemon"
