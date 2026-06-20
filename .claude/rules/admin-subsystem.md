---
# 从 AGENTS.md §10 下沉（R7 2026-06-12），按需加载
# 触发场景：在 apps/admin/ 或 apps/api/src/trpc/routers/admin/ 下写代码时必读
# 本章红线 LD-A/R-A 优先于 §3-§5 通用红线适用
---

## §10.0 执行边界

当 Ralph/Opus 在 `apps/admin/` 或 `apps/api/src/trpc/routers/admin/` 下写代码时，本章优先适用。
**§3-§9 通用约束仍有效**，但 admin 专属规则（如 6 闸鉴权、Approval Gates）在此覆盖通用规则。

---

## §10.1 admin 子系统的 11 条 LD（LD-A1 ~ LD-A11）

### LD-A1 · admin 子系统独立部署 + 独立 OAuth（对应 ADR-021）

- ✅ apps/admin 独立 build → admin.quanan.com
- ✅ 独立 OAuth client_id（QUANQN_ADMIN_CLIENT_ID）+ Workspace 限定 @quanan.com
- ✅ admin session 跟主应用 session 完全隔离（独立 Redis namespace `admin:session:*`）
- ❌ 复用主应用 OAuth client / session
- ❌ 部署到 www.quanan.com 子路径

检测：`grep "QUANQN_WEB_CLIENT" apps/admin/` → 0结果 · `grep "app:session:" apps/admin/` → 0结果

### LD-A2 · adminRouter 跟 appRouter 严格分离

- ✅ adminRouter 在 `apps/api/src/trpc/routers/admin/`（14 子树）
- ✅ appRouter 在 `apps/api/src/trpc/routers/app/`（13 子树）
- ✅ 每个 admin procedure 必经 6 闸鉴权链：adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck
- ❌ adminRouter 调 appRouter（反之亦然）
- ❌ admin procedure 不带 adminRLS middleware

检测：`grep "from.*'@/trpc/routers/app'" apps/api/src/trpc/routers/admin/` → 0结果

### LD-A3 · admin 跨账号查必走 RLS bypass + 必写 admin_audit_log

- ✅ 跨账号查走 `set_config('app.role', 'admin', true)`（由 adminRLS middleware 自动）
- ✅ 每次跨账号查自动写 `admin_audit_log` eventType='cross_account_query'
- ✅ 跨账号查必带显式 WHERE 过滤
- ❌ 直接用主应用 prismaClient 跨账号查（必须用 adminPrisma）
- ❌ admin procedure 不写 audit

### LD-A4 · 高风险操作必走 Approval Gates（对应 ADR-020）

- ✅ 14 类高风险动作必带 `meta.requiresApproval=true`
- ✅ 4 类二次审批必带 `meta.requireDualApproval=true` + 申请人≠审批人验证
- ✅ 2 类紧急通道必带 `meta.isEmergency=true` + `postReviewAt` 24h cron
- ❌ 高风险操作硬编码 `requiresApproval=false`

### LD-A5 · admin 内容审核 = 主应用 RAG 入库前的硬闸门

- ✅ TrendingScraper 抓回的内容进 `trending_review_queue` 表 status=pending（不直接写 trending_items）
- ✅ FileParser 解析的样本进 `deep_learn_review_queue` 表 status=pending
- ✅ status=approved 才允许 embed 入向量库（由 cron 异步触发）
- ❌ TrendingScraper/FileParser 直接 `.create({...})` 写主表

检测：`grep "prisma.trendingItem.create" apps/api/src/workers/trending-scraper/` → 0

### LD-A6 · prompt_versions.status='active' 仅由 _publishPromptVersionInTx 修改

```bash
# 期望 0 命中（prompt-version.service.ts 自身除外）
grep -rn "prompt_versions.*status.*active\|promptVersion.*update.*active" \
  apps/api/src --include='*.ts' \
  | grep -v '_publishPromptVersionInTx' \
  | grep -v 'prompt-version.service.ts' \
  | grep -v '.test.'
```

### LD-A7 · evolution_profile clear 仅由 _forceRebuildEvolutionInTx 修改

```bash
# PRD-13 retro M-2 修正（2026-05-14）
grep -rnE "(prisma|db|tx)\.evolutionProfile\.update.*(latestInsight|null)|(prisma|db|tx)\.evolutionInsight\.updateMany.*(isFallback|levelAfter|resolved)" \
  apps/api/src --include='*.ts' \
  | grep -v '_forceRebuildEvolutionInTx' \
  | grep -v 'evolution-rebuild.service.ts' \
  | grep -v '.test.' \
  | grep -v 'Parameters<typeof'
```

### LD-A8 · user_quota dailyQuota/monthlyQuota 仅由 _adjustQuotaInTx 修改

```bash
# 期望 0 命中（quota-adjustment.service.ts + quota-expiry.job.ts 合法源外）
grep -rnE "(prisma|db|tx)\.userQuota\.(update|updateMany|upsert|create)" \
  apps/api/src --include='*.ts' \
  | grep -v 'quota-adjustment.service.ts' \
  | grep -v 'quota-expiry.job.ts' \
  | grep -v '.test.'
```

### LD-A9 · ab_experiments 状态迁移仅由 _startAbExperimentInTx / _stopAbExperimentInTx 修改

```bash
grep -rnE "(prisma|db|tx)\.abExperiment\.update.*(status|stoppedAt|startedAt)" \
  apps/api/src --include='*.ts' \
  | grep -v 'ab-experiment.service.ts' \
  | grep -v 'ab-stop-loss.job.ts' \
  | grep -v '.test.'
```

### LD-A10 · constant_versions.status='active' 仅由 _publishConstantVersionInTx 修改

```bash
grep -rnE "(prisma|db|tx)\.constantVersion\.update.*(status|active)" \
  apps/api/src --include='*.ts' \
  | grep -v '_publishConstantVersionInTx' \
  | grep -v 'constant-version.service.ts' \
  | grep -v '.test.'
```

### LD-A11 · feature_flags / system_config 写操作单点保护

- ✅ feature_flags 修改必须经由 `_toggleFeatureFlagInTx(tx, ...)`
- ✅ system_config 修改必须经由 `_updateSystemConfigInTx(tx, ...)`

```bash
grep -rnE "(prisma|db|tx)\.(featureFlag|systemConfig)\.(update|upsert|create)" \
  apps/api/src --include='*.ts' \
  | grep -v 'feature-flag\.service\.ts' \
  | grep -v '\.test\.' | grep -v 'spec\.'
```

---

## §10.2 admin 子系统的 6 条红线（R-A1 ~ R-A6）

### R-A1 · 不允许 apps/web 跟 apps/admin 互相 import 业务代码

```bash
! grep -rn "from '@quanan/admin\|from '\.\./admin'" apps/web/src/
! grep -rn "from '@quanan/web\|from '\.\./web'" apps/admin/src/
```

例外：packages/* 三方共享层不算违反（zod/UI base/tRPC client config 共享）。

### R-A2 · 不允许在主应用前端暴露 admin 入口

```bash
! grep -rn "role === 'admin'.*navigate" apps/web/src/
! grep -rn "/admin" apps/web/src/
```

admin 用户必须主动访问 admin.quanan.com·主应用不暴露 admin 入口。

### R-A3 · 不允许 admin SPA 不带 IP 白名单 / MFA 直接上线

```bash
test -f infra/cloudflare-waf-admin.yaml
grep -q "MFA_REQUIRED.*true" apps/admin/.env.production
```

### R-A4 · 不允许 admin procedure 不写 admin_audit_log

AST 检测（scripts/audit-admin-audit.ts）。例外：仅查的 procedure 由 middleware 统一写。

### R-A5 · 不允许 admin 直接调主应用 LLM Gateway / Specialist

```bash
! grep -rn "import.*LLMGateway" apps/admin/src/
! grep -rn "import.*Specialist" apps/admin/src/
! grep -rn "llmGateway.complete\|llmGateway.stream" apps/api/src/trpc/routers/admin/
```

例外：域⑩ Prompt 版本管理"试运行 Prompt 跑 LLM Judge"必须通过专门的 admin-llm-judge worker。

### R-A6 · 不允许 admin 操作绕过 admin_audit_log + Approval

```bash
! grep -rn "\$executeRawUnsafe\|\$queryRawUnsafe" apps/api/src/trpc/routers/admin/
! grep -rn "approvalRequestId.*'mock'\|approvalRequestId.*'bypass'" apps/api/src/
```

---

## §10.3 14 类高风险动作清单（LD-A4 + ADR-020）

| # | 动作 | requiresApproval | requireDualApproval | isEmergency |
|:-:|---|:-:|:-:|:-:|
| 1 | admin.users.changePlan（降级） | ✅ | — | — |
| 2 | admin.users.banUser | ✅ | — | — |
| 3 | admin.invites.batchInvalidate（≥10 条） | ✅ | — | — |
| 4 | admin.reviewTrending.updateRules | ✅ | — | — |
| 5 | admin.evolution.forceRebuild | ✅ | — | — |
| 6 | admin.prompts.publishCanary（>10%） | ✅ | — | — |
| 7 | admin.prompts.rollback | ✅ | — | — |
| 8 | admin.quota.adjustLong（>24h） | ✅ | — | — |
| 9 | admin.quota.changePlanQuota | ✅ | — | — |
| 10 | admin.compliance.changeDisclaimer | ✅ | — | — |
| 11 | admin.ab.startStop | ✅ | — | — |
| 12 | admin.knowledge.changeConstants | ✅ | — | — |
| 13 | admin.config.changeFeatureFlag（≥10%） | ✅ | — | — |
| 14 | admin.config.emergencyStop | ✅ | — | ✅ |
| **D-1** | admin.accounts.batchUpdate（≥100） | ✅ | ✅ | — |
| **D-2** | admin.evolution.batchRebuild（≥10） | ✅ | ✅ | — |
| **D-3** | admin.prompts.publishCanary（=100%） | ✅ | ✅ | — |
| **D-4** | admin.config.changeFeatureFlag（≥50%） | ✅ | ✅ | — |
| **E-1** | admin.config.emergencyStop（prod 报错） | ✅ | — | ✅ |
| **E-2** | admin.quota.tempWhitelist（24h 自动失效） | ✅ | — | ✅ |

---

## §10.4 admin 专属 audit_commands

```bash
# LD-A 检测
! grep -rn "QUANQN_WEB_CLIENT" apps/admin/                        # LD-A1
! grep -rn "from.*routers/app" apps/api/src/trpc/routers/admin/   # LD-A2
node scripts/audit-admin-rls.ts                                    # LD-A3（AST 检测）
node scripts/audit-approval-gates.ts                               # LD-A4

# R-A 红线检测
bash scripts/audit-redlines-admin.sh    # 6 条 R-A 红线一键 grep

# admin 集成测试
pnpm --filter @quanan/api test:admin
pnpm --filter @quanan/api test:admin-integration
pnpm test:e2e:admin

# admin 审计闭环
node scripts/audit-cross-account-query.ts
node scripts/audit-approval-link.ts
node scripts/audit-emergency-postreview.ts

# 部署前 gate（admin SPA 上 prod 前必检）
test -f infra/cloudflare-waf-admin.yaml || exit 1
grep -q "MFA_REQUIRED.*true" apps/admin/.env.production || exit 1
grep -q "QUANQN_ADMIN_CLIENT_ID" apps/admin/.env.production || exit 1
```

---

## §10.5 admin 测试要求

| 测试类别 | 主应用要求 | admin 增量 |
|---|---|---|
| 单元 | Specialist 200+ | + admin Service 单元 50+（13 业务管理域） |
| 集成 | tRPC procedure 50+ | + admin procedure 60+（14 router·平均 4.3 用例） |
| E2E | 主链路 8-10 | + admin 主链路 8（登录/MFA/跨账号查/Approval/审核/导出/封禁/紧急止损） |
| LLM Judge | Specialist 100 金标准 | + admin 域⑩ Prompt 版本灰度 LLM Judge |
| **★ Approval 闭环** | （主应用无） | **必须 100%**·14 类高风险 + 4 类二次 + 2 类紧急全闭环测试 |

---

## §10.6 admin chunk 命名约定（P-26-004）

`apps/admin/vite.config.ts` manualChunks 4 chunk groups：
- `p0-core`（6 page）：核心管理页
- `p0-review`（2 page）：内容审核
- `p1-health`（5 page）：健康度/运维
- `p2-advanced`（4 page）：高级配置

规则：命名 `p<priority>-<theme>`·priority ∈ {0,1,2}·新 admin 页面归入对应 chunk·不创建新 chunk（除非重要性独立）。

---

## §10.7 packages/ui 跨包抽组件 checklist（P-26-003·红线级）

新组件从 `apps/admin/src/components/admin/` lift 到 `packages/ui/src/admin/` 时必须满足 6 项（违反任意一条 = LD-A-1 reject）：

1. `packages/ui/package.json` 不加 trpc 依赖（LD-A-1 隔离）
2. 组件接受 props 不内部 `useQuery`·trpc 调用留 AdminLayout 层
3. `AdminLayout` 保留 `adminTrpc`·传 props 给 ui components
4. `packages/ui/src/admin/index.ts` 只 re-export 不 import 业务 hook
5. `apps/admin/package.json` `@quanan/ui` 已在 dependencies（workspace dep）
6. `vite.config.ts` alias 映射 `@quanan/ui/admin → packages/ui/src/admin/index.ts`

反例：`import { trpc } from '@quanan/clients';` in `packages/ui/src/admin/*.tsx` → 立即 reject。

---

## §10.8 跨 story 函数路由规则（TD-069 固化·红线级）

emergency switch/config 类查询函数必须按表区分：

- **`getSystemConfigValue(configKey)`**：查 **system_config** 表（isEmergency=true 的 3 关键开关 + 全局参数）
- **`getFeatureFlagValue(flagKey, userId?, plan?)`**：查 **feature_flags** 表（percentage/targeted/boolean 3 flagType）
- **永不混用**：否则 emergency stop 失效（TD-069 实证·trending-scraper 用错 `getFeatureFlagValue('stop_trending_scraper')` → 失效）

---

## §10.9 一句话总结

§3-§9 是主应用宪法·§10（本文件）是 admin 子系统宪法。
在 `apps/admin/` 或 `apps/api/src/trpc/routers/admin/` 下写代码时：
- 本章 11 LD-A + 6 R-A **优先于** §3-§5 通用红线适用
- 配套 §10.4 audit_commands 5 类 admin 专属检测
- Approval 闭环 100% 是硬约束
