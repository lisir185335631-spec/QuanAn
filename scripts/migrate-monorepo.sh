#!/usr/bin/env bash
# scripts/migrate-monorepo.sh
# SCAFFOLD §A.3 10-step monorepo migration protocol
# One-time script — QuanAn src/ single-package → apps/* + packages/* monorepo
# Each step is idempotent and can be committed independently.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "QuanAn Monorepo Migration — SCAFFOLD §A.3"
echo "Root: $ROOT"
echo ""

# ── Step 1: Verify pnpm-workspace.yaml ──────────────────────────────────────
echo "[1/10] Verify pnpm-workspace.yaml has apps/* + packages/*"
if ! grep -q "'apps/\*'" "$ROOT/pnpm-workspace.yaml" && ! grep -q '"apps/\*"' "$ROOT/pnpm-workspace.yaml"; then
  echo "ERROR: pnpm-workspace.yaml missing apps/*"
  exit 1
fi
echo "  ✓ pnpm-workspace.yaml OK"

# ── Step 2: Verify workspace packages exist ──────────────────────────────────
echo "[2/10] Verify 5 workspace packages exist"
for pkg in "apps/web" "apps/admin" "apps/api" "packages/schemas" "packages/ui" "packages/clients"; do
  if [[ ! -d "$ROOT/$pkg" ]]; then
    echo "ERROR: $ROOT/$pkg missing"
    exit 1
  fi
  echo "  ✓ $pkg"
done

# ── Step 3: Verify apps/web has src/ ────────────────────────────────────────
echo "[3/10] Verify apps/web/src exists (main app frontend)"
if [[ ! -d "$ROOT/apps/web/src" ]]; then
  echo "ERROR: apps/web/src missing"
  exit 1
fi
echo "  ✓ apps/web/src OK ($(ls "$ROOT/apps/web/src" | wc -l) entries)"

# ── Step 4: Verify apps/api/src exists ──────────────────────────────────────
echo "[4/10] Verify apps/api/src exists (backend)"
if [[ ! -d "$ROOT/apps/api/src" ]]; then
  echo "ERROR: apps/api/src missing"
  exit 1
fi
echo "  ✓ apps/api/src OK"

# ── Step 5: Verify apps/admin Vite skeleton ──────────────────────────────────
echo "[5/10] Verify apps/admin Vite SPA skeleton (6 files)"
for f in "vite.config.ts" "package.json" "tsconfig.json" "index.html" "src/main.tsx" "src/App.tsx"; do
  if [[ ! -f "$ROOT/apps/admin/$f" ]]; then
    echo "ERROR: apps/admin/$f missing"
    exit 1
  fi
  echo "  ✓ apps/admin/$f"
done

# ── Step 6: Verify prisma schema has admin models ────────────────────────────
echo "[6/10] Verify 13+ admin models in prisma/schema.prisma"
ADMIN_MODELS=(AdminAuditLog ApprovalRequest AdminUser AdminSession PromptVersion PromptCanaryConfig UserQuota QuotaAdjustmentLog TrendingReviewQueue DeepLearnReviewQueue AdminInviteCampaign AdminConstants AdminConfig AdminAbExperiment)
for model in "${ADMIN_MODELS[@]}"; do
  if ! grep -q "^model ${model} " "$ROOT/prisma/schema.prisma"; then
    echo "ERROR: model $model not found in schema.prisma"
    exit 1
  fi
  echo "  ✓ model $model"
done

# ── Step 7: Verify manual_admin_rls.sql ─────────────────────────────────────
echo "[7/10] Verify manual_admin_rls.sql has 14 DISABLE statements"
COUNT=$(grep -c "DISABLE ROW LEVEL SECURITY" "$ROOT/prisma/migrations/manual_admin_rls.sql" || true)
if [[ $COUNT -lt 14 ]]; then
  echo "ERROR: manual_admin_rls.sql has only $COUNT DISABLE statements (need ≥ 14)"
  exit 1
fi
echo "  ✓ $COUNT DISABLE RLS statements found"

# ── Step 8: Verify middleware stubs ─────────────────────────────────────────
echo "[8/10] Verify 7 admin middleware stubs"
for f in adminAuth roleCheck ipWhitelist mfaCheck adminRLS approvalGateCheck auditLog; do
  path="$ROOT/apps/api/src/trpc/middleware/admin/${f}.ts"
  if [[ ! -f "$path" ]]; then
    echo "ERROR: $path missing"
    exit 1
  fi
  echo "  ✓ $f.ts"
done

# ── Step 9: Verify admin router + lib ────────────────────────────────────────
echo "[9/10] Verify admin router + lib files"
for f in \
  "apps/api/src/trpc/routers/admin/index.ts" \
  "apps/api/src/lib/admin/constants.ts" \
  "apps/api/src/lib/admin/types.ts"
do
  if [[ ! -f "$ROOT/$f" ]]; then
    echo "ERROR: $f missing"
    exit 1
  fi
  echo "  ✓ $f"
done

# ── Step 10: Verify RLS states ───────────────────────────────────────────────
echo "[10/10] Verify RLS states (runs audit-admin-rls-tables.sh)"
bash "$ROOT/scripts/audit-admin-rls-tables.sh"

echo ""
echo "✅ All 10 migration steps passed — monorepo ready"
