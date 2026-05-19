# Codebase Concerns · QuanAn

**Analysis Date:** 2026-05-09
**Scope:** PRD-1 → PRD-5 完成期 · 12 stories PRD-5 全 PASSED · 准备进入 PRD-6/7
**Inputs:** AGENTS.md §3 (18 LD) + §4.7 (17 R 红线) · `.agents/tech-debt.json` (15 TD 条目) · `.agents/rca/` (RCA-001/002/003) · 实际代码 grep + file:line 实证

---

## §1 Security Boundaries

本节列出 6 道安全屏障 + file:line 实证。任一失效 = R 红线违规。

### §1.1 屏障 1 · tRPC `protectedProcedure` 强制鉴权

**Location:** `apps/api/src/trpc/middleware/account-isolation.ts:52`

```ts
export const protectedProcedure = publicProcedure.use(accountIsolationMiddleware);
```

**实证:**
- 全 18 routers grep `publicProcedure` 仅命中 `apps/api/src/trpc/routers/auth.ts:9` (auth.me 唯一允许 unauthenticated)
- 其余 17 routers 全部用 `protectedProcedure` 或 `globalProcedure`(`apps/api/src/trpc/routers/{analysis,boomGenerate,copywriting,costLog,deepLearning,diagnosis,evolution,history,invite,ipAccounts,knowledge,monetization,privateDomain,stepData,trending,videoAnalysis,videoProduction}.ts`)
- `globalProcedure` 仅 3 处:`ipAccounts.ts:57` (create) · `ipAccounts.ts:101` (switchActive) · `invite.ts:39` (redeem) · `trending.ts:42-56` (3 个 fetch/listByIndustry/listByStyle) — 全部对应 LD-009 全局表(User / InviteCode / TrendingItem)

**SHIELD 标记:** 多处 router 文件头注释明确写 `SHIELD REJ-013: protectedProcedure (non-publicProcedure)` 防回退

**风险等级:** 🟢 LOW · 强制覆盖 100% · grep 自动化检测可加入 CI(scripts/audit-redlines.sh 待修)

---

### §1.2 屏障 2 · `accountIsolationMiddleware` set_config 写 RLS context

**Location:** `apps/api/src/trpc/middleware/account-isolation.ts:19-46`

**核心逻辑:**
```ts
return ctx.prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SET LOCAL ROLE quanan_app`;                                                  // line 38
  await tx.$executeRaw`SELECT set_config('app.current_account_id', ${String(activeAccountId)}, true)`;  // line 39
  if (user?.id !== null && user?.id !== undefined) {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${String(user.id)}, true)`;        // line 41
  }
  return next({ ctx: { ...ctx, prisma: tx as unknown as PrismaClient } });                            // line 44
});
```

**关键设计:**
- `set_config(name, value, is_local=true)` = transaction-scoped(等价 `SET LOCAL`)· 事务结束自动清除
- `SET LOCAL ROLE quanan_app` 切换到非 superuser 角色(superuser 默认 BYPASSRLS)
- AC-6 `apps/api/src/trpc/middleware/account-isolation.ts:9` 注释明确:**整个 apps/api/src 仅此一处用 prisma.$executeRaw**(LD-009 R-009)

**FORBIDDEN 处理:**
- `apps/api/src/trpc/middleware/account-isolation.ts:30` activeAccountId 缺失 → `throw new TRPCError({ code: 'FORBIDDEN' })` + log `'no_active_account'`

**Meta `isGlobal` 跳过 RLS:**
- `apps/api/src/trpc/middleware/account-isolation.ts:21-23` meta?.isGlobal === true → 直接 `next()` 不入事务 · 不写 set_config
- `globalProcedure` 定义:`account-isolation.ts:58` = `publicProcedure.meta({ isGlobal: true })`

**风险等级:** 🟡 MEDIUM
- ⚠️ 事务 wrap 会增加 DB 连接占用 · 主体业务每次请求 +1 connection · 高 QPS 时 pool 可能耗尽
- ⚠️ `as unknown as PrismaClient` 类型断言隐藏潜在 bug(see §1.6)
- ✅ `quanan_app` 角色与 RLS 策略联动 · 在 RLS 测试中验证(`tests/integration/api/rls-isolation.test.ts:44-50`)

---

### §1.3 屏障 3 · Postgres RLS Policies(12 表)

**Location:** `prisma/migrations/manual_rls.sql`

**统计:**
- ENABLE RLS:**15 张表**(`grep -c "ENABLE ROW LEVEL SECURITY" manual_rls.sql` → 15)
  - `ip_accounts` · `step_data` · `histories` · `topics` · `assets` · `diagnosis_reports` · `feedback_logs` · `evolution_profiles` · `evolution_insights` · `deep_learning_archives` · `knowledge_favorites` · `knowledge_notes` · `daily_tasks` · `cost_log` (`manual_rls.sql:17-30`)
- 全局表显式不启用:`users` · `invite_codes` · `trending_items` · `audit_log` (`manual_rls.sql:32`)

**Policy 模板:**
```sql
CREATE POLICY <table>_account_isolation ON <table>
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);
```

**特殊 policy:**
- `ip_accounts` 用 `user_id` 隔离(不是 account_id) (`manual_rls.sql:38-41`) · 因为 ip_account 本身就是聚合根
- `TrendingItem` 写权限策略额外约束(只有 trending fetcher 可写)(`manual_rls.sql:160`)

**默认拒绝行为:**
- RLS 启用 + 缺 `app.current_account_id` → query 返回 0 行(测试验证 `tests/integration/api/rls-isolation.test.ts:8` AC-4)
- 注:`NULLIF(..., true)` true 参数表示找不到也不报错 · 配合 `::int` 转换 NULL 时返回 NULL · NULL = NULL 不成立 → 0 行

**测试覆盖:**
- `tests/integration/api/rls-isolation.test.ts` · 真 PG + 双账号 + 0 跨读验证

**风险等级:** 🟢 LOW
- ✅ admin 13 表显式不启用 RLS(DATA-MODEL §13.8) · super_admin 通过应用层审计 + audit_log 闸鉴权(本期不涉及)
- ⚠️ `manual_rls.sql` 是手工执行 · 不在 prisma migrations 自动跑(`manual_rls.sql:5` 注释:`必须在 prisma migrate 之后手动应用`) · CI/CD 漏跑会丢屏障(待 PRD-2 完整 e2e 时验证)

---

### §1.4 屏障 4 · LLM API Key 仅服务端读取 + 不暴露给前端(R-001)

**Location:** `apps/api/src/workers/llm-gateway/index.ts:91-100`

```ts
function getAnthropicClient(tier: string): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error(`ANTHROPIC_API_KEY missing for ${tier} tier`);
  return (_anthropicClient ??= new Anthropic({ apiKey: key }));
}

function getOpenAIClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing for fallback tier');
  return (_openaiClient ??= new OpenAI({ apiKey: key }));
}
```

**实证:**
- `grep -rn "ANTHROPIC_API_KEY\|OPENAI_API_KEY" apps/api/src --include="*.ts"` 仅命中 `workers/llm-gateway/index.ts:91, 97, 121`
- `grep -rn "ANTHROPIC_API_KEY\|OPENAI_API_KEY" apps/web --include="*.ts" --include="*.tsx"` → **0 命中** ✅
- `grep -rn "import\.meta\.env" apps/web` 仅 2 处:`hooks/useAuth.ts:11` 和 `lib/trpc.ts:44` 都是 `VITE_API_BASE_URL`(API 地址 · 非密钥)

**SDK 隔离(R-1):**
- `grep -rn "@anthropic-ai/sdk\|from 'openai'" apps --include="*.ts"` → 仅 `apps/api/src/workers/llm-gateway/index.ts:13-21` 命中
- `apps/api/src/workers/llm-gateway/index.ts:13-14` AC-7/AC-8 注释明确:`only this file in the entire codebase`
- `eslint-disable-next-line import/no-named-as-default` 配合 lint 规则强制 (`workers/llm-gateway/index.ts:18,20`)

**Lazy-create 模式:**
- `_anthropicClient` / `_openaiClient` lazy 创建 + ??= 单例 + AC-9 注释 `// Lazy-created SDK clients (API keys never logged)` (`index.ts:86-88`)
- `cost-logger.ts` 写日志时不入 systemPrompt 内容 · 不会泄密
- ContextAssembler `apps/api/src/services/context-assembler/ContextAssembler.ts:9` AC-10 注释:`systemPrompt 禁止包含 LLM 密钥或 API URL(R-001 安全红线)`

**风险等级:** 🟢 LOW · 唯一入口设计有效 · 前端 0 引用

---

### §1.5 屏障 5 · Lucia Session Cookie 安全配置

**Location:** `apps/api/src/lib/auth/lucia.ts:12-19` · `apps/api/src/index.ts:159-166`

```ts
// lucia.ts:12-19
export const lucia = new Lucia(prismaAdapter, {
  sessionCookie: {
    name: 'app_session',                                      // ← 区分 admin_session(LD-A-1)
    attributes: {
      secure: isProduction,                                   // ← prod 强制 HTTPS
      sameSite: 'lax',
    },
  },
  ...
});

// index.ts:159-166
const isProduction = process.env.NODE_ENV === 'production';
setCookie(c, sessionCookie.name, sessionCookie.value, {
  path: '/',
  httpOnly: true,                                             // ← 防 XSS 读 cookie
  maxAge: sessionCookie.attributes.maxAge,
  sameSite: 'Lax',                                            // ← 防 CSRF
  secure: isProduction,
});
```

**关键安全特性:**
- `httpOnly: true` 防 XSS 通过 `document.cookie` 读取 session
- `sameSite: 'Lax'` 防 CSRF(默认拒绝跨站 POST 携带 cookie)
- `secure: isProduction` prod 仅 HTTPS 传输
- `name: 'app_session'` 与 admin 子系统的 `admin_session` 严格区分(LD-A-1)

**OAuth CSRF Protection:**
- `apps/api/src/lib/auth/providers.ts:128-130` `requiresCsrfCheck()` mock 不需 CSRF · google 强制
- `apps/api/src/lib/auth/providers.ts:144-148` AC-15 prod 禁止 mock provider:
  ```ts
  if (process.env.NODE_ENV === 'production' && providerName === 'mock') {
    logger.error('OAUTH_PROVIDER=mock not allowed in production');
    process.exit(1);
  }
  ```

**Audit Log:**
- 登录成功时写 `audit_log` 表(`apps/api/src/index.ts:169-178`)· 含 userId/eventType/payload/traceId

**风险等级:** 🟢 LOW
- ⚠️ TD-007 前端 lint 残留:`apps/web/src/components/Header.tsx:65,229` `onClick={asyncFn}` no-misused-promises(LOW · 不影响安全 · 已计划修)

---

### §1.6 屏障 6 · PII 脱敏 + 行业免责(LD-018)— ★ 严重缺口

**Location:**
- `apps/api/src/lib/compliance/pii-mask.ts` (定义存在)
- `apps/api/src/lib/compliance/disclaimer.ts` (定义存在)

**定义验证:**

```ts
// pii-mask.ts:8-12 — 5 种 PII 模式
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE_CN = /\b1[3-9]\d{9}\b/g;
const PHONE_RE_INTL = /\b\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g;
const ID_CARD_RE = /\b[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g;
const BANK_CARD_RE = /\b\d{16,19}\b/g;

// disclaimer.ts:10-14 — 3 类敏感行业
const DISCLAIMERS = {
  medical: '...不构成医疗建议...',
  legal:   '...不构成法律意见...',
  finance: '...不构成投资建议...',
};
```

### 🔴 CRITICAL ISSUE · LD-018 / R-14 实际未生效

**实证(grep 验证):**
- `grep -rn "import.*compliance\|from '@/lib/compliance" apps/api/src --include="*.ts"` → **0 命中**
- `grep -rn "piiMask\|maskString\|appendDisclaimerIfSensitive\|attachDisclaimerMeta" apps/api/src --include="*.ts" | grep -v "lib/compliance/"` → **0 命中**(除定义文件本身外)
- `find tests -name "*pii*" -o -name "*compliance*" -o -name "*disclaimer*"` → **0 文件**

**违规明细:**
1. **R-14(LD-018)PII 未脱敏** · ContextAssembler `apps/api/src/services/context-assembler/ContextAssembler.ts:75` `_composeSystemPrompt()` 直接拼 stepData/userInput 进 prompt · 用户邮箱 / 手机号 / 身份证 / 银行卡 全部原文进 LLM
   - AGENTS.md §3 LD-018 明文要求:`src/lib/compliance/pii-mask.ts 必存在 · ContextAssembler 必跑`
   - 现状:文件存在但 ContextAssembler 完全没 import
2. **R-14(LD-018)免责声明缺失** · 8 个 Specialist 全部不调 `appendDisclaimerIfSensitive()` · medical/legal/finance 行业生成内容无底部免责
   - AGENTS.md §3 LD-018:`CopywritingAgent / VideoAgent 输出必跑`
   - 现状:CopywritingAgent (`apps/api/src/specialists/CopywritingAgent.ts`) + VideoAgent (`VideoAgent.ts`) 无 disclaimer 调用
3. **0 测试覆盖** · `tests/` 目录下找不到任何 PII / disclaimer 测试

**为什么现在还没爆雷:**
- PRD-1~PRD-5 主要做基础设施 + 8 Specialist 接线 + 4 模块 e2e · LLM 测试都是 mock
- 真用户接入(P9 邀请制内测)前必须修
- `audit-redlines.sh:24` 注释明确 `R-14 PII/免责` 不在 grep 红线脚本中 · 留给 `audit-ld.sh` 但该脚本不存在(`find /Users/return/Desktop/QuanAn/scripts -name "audit-*.sh"` 仅 `audit-redlines.sh` 一个)

**风险等级:** 🔴 **CRITICAL** · 上线即合规违规
- 影响:可能被 cyberspace administration / 行业监管按数据保护法 + 行业准入条例处罚
- 紧迫度:**PRD-6/7/8 任一启动前必修**(P3-IP 流程后即用户真生成)

**修复建议:**
1. **新建 PRD 或 1 hot-fix story** · 把 piiMask 接进 `ContextAssembler._formatUserPrompt(input)` (`apps/api/src/services/context-assembler/ContextAssembler.ts:169`)
2. **BaseSpecialist 模板方法加 step 6 · disclaimer 注入** · 在 `BaseSpecialist.execute()` (`apps/api/src/specialists/base/BaseSpecialist.ts:67`) 返回前用 `attachDisclaimerMeta()` 处理
3. **测试** · 加 `tests/unit/compliance/pii-mask.test.ts` + `tests/unit/compliance/disclaimer.test.ts` + `tests/integration/api/specialist-llm-pii.test.ts` (真 PG + 真 specialist + 5 PII 类型 0 漏)
4. **audit-ld.sh** 新建脚本 · grep `piiMask` 必至少 1 处 import(ContextAssembler) · grep `attachDisclaimerMeta` 必至少 2 处 import(CopywritingAgent + VideoAgent)

---

### §1.7 屏障速查表

| # | 屏障 | 文件 | 关键行 | 状态 |
|:-:|---|---|---|:-:|
| 1 | tRPC protectedProcedure | `apps/api/src/trpc/middleware/account-isolation.ts` | L52 | 🟢 |
| 2 | set_config RLS context | `apps/api/src/trpc/middleware/account-isolation.ts` | L36-46 | 🟢 |
| 3 | Postgres RLS Policies(15 表) | `prisma/migrations/manual_rls.sql` | L17-30 | 🟢 (CI 漏跑风险) |
| 4 | LLM API Key 仅服务端 | `apps/api/src/workers/llm-gateway/index.ts` | L91-100 | 🟢 |
| 5 | Lucia Session Cookie | `apps/api/src/lib/auth/lucia.ts` + `index.ts` | L12-19 / L159-166 | 🟢 |
| 6 | PII Mask + Disclaimer | `apps/api/src/lib/compliance/{pii-mask,disclaimer}.ts` | 全文 | 🔴 **未生效** |

---

## §2 Performance Baselines

### §2.1 测试套件耗时(实测)

| 套件 | 用例数 | 耗时 | it/s | 备注 |
|---|:-:|:-:|:-:|---|
| vitest unit | 542 | 5.77 s | 26 it/s | mock + sqlite memory |
| vitest integration | ~30 (含 LLM mock) | ~10 s | ~3 it/s | 真 PG + RLS 测试 |
| LLM judge | 22 | 0.42 s | 52 it/s | mock LLM(零真 token) |
| Playwright e2e | 126 | 122 s | 1 it/s | 含真浏览器启动 |
| typecheck (6 ws incremental) | — | < 5 s | — | tsc -b incremental |
| typecheck (6 ws cold) | — | ~30-60 s | — | 全量 |

**配置位置:**
- `vitest.config.ts:37-38` testTimeout=30000 · hookTimeout=60000
- `vitest.config.ts:35` include 仅 `tests/unit/` + `tests/integration/`
- `apps/api/package.json:10` typecheck = `tsc --noEmit`
- `apps/api/package.json:11` lint = `eslint . --ext ts --max-warnings=0`(0 warning 强制)

### §2.2 Database Index Coverage

**History 表(`prisma/schema.prisma:205-241`):**
```prisma
@@index([accountId])
@@index([accountId, agentId])
@@index([accountId, scriptType])
@@index([accountId, createdAt(sort: Desc)])    // ← history.list 主索引
```

**全局索引统计:**
- `grep -c "@@index\|@@unique" prisma/schema.prisma` → **133 个索引/唯一约束**
- `grep -c "model " prisma/schema.prisma` → **39 个模型**
- 平均每模型 ~3.4 个索引(覆盖良好)

**风险点:**
- 🟡 `History.contentEmbedding` (`prisma/schema.prisma:232`) `Unsupported("vector(1536)")` 字段 · pgvector ivfflat/hnsw 索引在 schema.prisma 不能声明 · 需要 RAG 期手动 SQL 加(P5+)

### §2.3 Specialist LLM 调用预期耗时

**配置(`apps/api/src/specialists/PositioningAgent.ts:76-81`):**
```ts
execution: {
  timeout_ms: 60_000,             // 60s 硬超时
  retry: 1,                       // gateway 内部重试 1 次
  model_tier: 'reasoning',        // claude-sonnet-4-6 / gpt-4o
  streaming: false,
},
```

**预期实际耗时(真 LLM 调用 · LLMGateway.complete):**
- `model_tier='reasoning'` (sonnet) · 3-8s · 大 prompt (10K+) 可达 15s
- `model_tier='lightweight'` (haiku) · 1-3s · 用于 LLM Judge
- `model_tier='reasoning'` 含 fallback 到 gpt-4o · 加 5-10s 网络延迟

**ContextAssembler 拼装耗时(`services/context-assembler/ContextAssembler.ts:19`):**
- `FETCH_TIMEOUT_MS = 5_000` 单路 hard timeout · 4 路并行 `Promise.allSettled` (`ContextAssembler.ts:41-47`)
- 实测预期 < 800ms (cap 5s · 平均数据库 < 200ms · L4/L5 当前空跑)
- L1/L4/L5 当前 stub(`ContextAssembler.ts:99-113` `_fetchEvolutionProfile/_fetchSamples/_fetchRag` 全部 return null/[])· P5+ 加 RAG 后实际耗时会上升

### §2.4 Rate Limiting

**Token Bucket(`apps/api/src/workers/llm-gateway/rate-limiter.ts:25-29`):**
```ts
const PLAN_LIMITS = {
  free: 50,         // 免费版 50 calls/天
  pro: 500,         // 付费 500 calls/天
  enterprise: 5000, // 企业 5000 calls/天
};
```

**关键设计:**
- `apps/api/src/workers/llm-gateway/rate-limiter.ts:46-48` Upstash Redis Ratelimit `tokenBucket(limit, '1 d', limit)` · 每天补满
- `apps/api/src/workers/llm-gateway/rate-limiter.ts:78-81` UPSTASH_REDIS_REST_URL 缺时 → log warn + pass through(本地 dev 模式)
- `apps/api/src/workers/llm-gateway/index.ts:116` `await checkRateLimit(userId)` 在 LLM 调用前强制
- 超限 → `RateLimitError` 含 `resetAfterMs`(`rate-limiter.ts:13-22`)

**风险点:**
- 🟡 LD-009 R-005 redis key 命名空间 · `prefix: 'quanan:rl:${plan}'` (`rate-limiter.ts:47`) 没带 `acc_${id}` 因为 rate limit 是 per-user · 不需要 per-account · 设计合理但偏离 R-5 字面要求 · 未来 audit 可能误报

### §2.5 慢查询风险点

| Risk | 文件 | 描述 | 缓解 |
|---|---|---|---|
| 🟡 history.list N+1 | `apps/api/src/trpc/routers/history.ts:77-83` | findMany 仅 select HISTORY_SELECT · 关联表 feedbacks 不 include · 不会 N+1 | ✅ 已 select(`history.ts:27-40`) |
| 🟡 ContextAssembler stepData 全表扫 | `apps/api/src/services/context-assembler/ContextAssembler.ts:89-95` | findMany without limit · 一个 account 9 步 stepData 数据量小(< 9 行) · OK | ✅ accountId 索引覆盖 |
| 🟠 cost_log 双写(TD-013) | `LLMGateway` + `BaseSpecialist` 各写 1 条 | 同 trace_id 2 条 · 字段重叠 80% · 不影响功能 · 仅查询时去重逻辑 | ⏭️ PRD-11 admin 时治理 |
| 🟠 `stepData.saveStream` 长连接 | `apps/api/src/trpc/routers/stepData.ts:305` | streaming write · 长连接 + DB 事务 · 高 QPS 时 connection pool 风险 | 🟡 待真实负载测试 |
| 🟢 specialist-llm-real 集成测 | `tests/integration/api/specialist-llm.test.ts` | 真 LLM 调用 · 单测可能耗时 5-30s · 不计入 vitest unit 主套件 | ✅ 隔离 |

### §2.6 Connection Pool

**Prisma 配置(`apps/api/src/lib/prisma.ts`):**
- 单例 `prisma` · 默认连接池 = `num_physical_cpus * 2 + 1`(8 核 = 17 connections)
- accountIsolationMiddleware (`account-isolation.ts:36`) 每请求 wrap `$transaction` → 每请求占用 1 connection 直到事务结束
- **风险:** 高 QPS(>50 req/s)时 pool 可能耗尽 · 错误 `prisma timeout 5s` 报错

**缓解建议(留 PRR):**
- prisma `connection_limit` 加大到 50+(P9 上线前)
- 加 connection pool monitoring(Datadog / Sentry / OTel)

---

## §3 Known Tech Debt(15 条 · `.agents/tech-debt.json`)

完整列表来自 `/Users/return/Desktop/QuanAn/.agents/tech-debt.json` · 按 status 排序。

### §3.1 已闭环(closed)

| ID | 标题 | 闭环 | 影响 |
|:-:|---|:-:|---|
| **TD-001** | tailwind.config.js 硬编码颜色违 LD-015 | US-004 (Aurelian Dark token 派生) | 视觉系统统一 · `grep '#[0-9a-f]{6}'` 命中 0 |
| **TD-002** | globals.css 硬编码颜色违 LD-015 | US-004 (改用 theme()) | `globals.css` 0 hardcode hex |
| **TD-012** | 双 base 目录冲突 (agents/base/ vs specialists/base/) | US-002 retry 1 (commit 4289068) | ContextAssembler 真实施 + import 路径修 + base.test.ts vi.mock 同步 |

### §3.2 已接受 / 已计划(accepted / scheduled)

| ID | 标题 | 严重 | status | fix_by | 影响 |
|:-:|---|:-:|:-:|---|---|
| **TD-003** | audit-artifacts.py manifest 缺 exit_code | low | open | PRD-2 实施期 | TS 项目 Validator 产物模板兼容(已自然修 US-003) |
| **TD-004** | PRD-1 US-003 跑 init migration 38 表 baseline 越界 | medium | accepted | PRD-2 §0 引用清单标注 | 必需 for prisma client 集成测 · 不重复 |
| **TD-005** | shadcn 12 组件路径偏差 (apps/web/src/components/ui/ vs packages/ui/src/base/) | medium | scheduled | P9.0 admin 启动前 lift | admin 复用必修 · 单 web 不影响 |
| **TD-008** | generateTraceId 同名 2 函数(不同 layer) | low | scheduled | PRD-2 实施期 重命名 | 命名混淆 · 已部分修(US-007 改 generateHttpTraceId / generateSpecialistTraceId · `trpc.ts:25` 和 `agents/base/types.ts` 各一) |
| **TD-007** | apps/web 3 lint errors (no-misused-promises × 2 + no-unsafe-assignment × 1) | low | scheduled | 下次 web changes | `Header.tsx:65/229` `onClick={asyncFn}` + `useAuth.ts:11` 类型断言 |
| **TD-011** | AccountDropdown ScrollArea h-60 (240px) 在 N=1-3 时空旷 | low | open | PRD-4 UI polish | UX 体感 · `apps/web/src/components/Header.tsx:143,188` `<ScrollArea h-60>` 邀请制内测期典型 1-3 accounts |
| **TD-013** | 双重 cost_log 写入(LLMGateway + BaseSpecialist) | low | scheduled | PRD-11 admin ④ 成本仪表盘 | 同 trace_id 2 条 · callType 区分 · 字段重叠 80% · 不是 bug 是双层 logging 设计 |
| **TD-014** | PositioningAgent _mode instance state · 高并发 race 风险 | low | scheduled | PRD-7+ 高并发场景治理 | `apps/api/src/specialists/{Positioning,Branding,Analysis,Video,Copywriting}Agent.ts` 5 个 specialist 都有 `private _mode` instance state · 单 user 串行 9 step 不触 race · 真高并发场景需治理 |
| **TD-015** | specialist-io schema 子目录 vs 协议锁单一文件路径 | low | accepted | PRD-4 收官 retro 时改协议锁文档 | 子目录组织更清晰 · 不影响功能 |

### §3.3 流程层 / RCA 派生(process-gap)

| ID | 标题 | 严重 | status | RCA | 影响 |
|:-:|---|:-:|:-:|---|---|
| **TD-006** | ralph daemon 重启时未 detect ralph round 9 已 commit | low | open | RCA(2026-05-07 复盘) | Opus fail-over 流程缺 git log 检查 → 项目 CLAUDE.md §9.6.5 0 步加固 |
| **TD-009** | ralph.py 网络故障(ECONNRESET / 503)消耗 retryCount | medium | open | PRD-3 US-006 + RCA-003 | 30+ min 浪费 · 等价无效重试 · ralph.py 不区分网络故障 vs 代码失败 |
| **TD-010** | Validator notes 推测原因 vs 事实未区分 | medium | open | PRD-3 US-006 复盘 | 误导后续 dev round · 死循环到 retryCount=5 · 待 VALIDATOR.md 升级 |

### §3.4 总览 by Severity

```
🔴 critical:  0
🟠 medium:    4 (TD-004, TD-005, TD-009, TD-010)
🟢 low:      11
─────────────
总计:         15 (closed: 3 · open: 5 · scheduled: 6 · accepted: 1)
```

### §3.5 ★ 漏登记的隐性 TD(本次新发现)

> 以下问题在 `.agents/tech-debt.json` 中未登记 · 但本次 codebase 扫描发现 · 建议补登。

#### TD-NEW-1 · LD-018 PII/免责未生效 🔴 CRITICAL

详 §1.6 · 应**立即**新建 hot-fix story 修补 + 加 audit-ld.sh

#### TD-NEW-2 · audit-redlines.sh 路径过期 🟠 MEDIUM

**Evidence:** `scripts/audit-redlines.sh:28-82` 全部 grep 路径用 `src/` `src/server/agents/specialists/` · 但 monorepo 改造后正确路径是 `apps/api/src/specialists/`
**Impact:** 17 红线 grep 检测**全部 0 命中**(因为路径不存在)· 给假绿灯
**Fix:** 改 `src/` → `apps/api/src/` · 改 `src/server/agents/specialists/` → `apps/api/src/specialists/`
**Verification:** `bash scripts/audit-redlines.sh` 当前会全部 ✅(假阳)· 修后能真正检测违规

#### TD-NEW-3 · 历史 dead code · `apps/api/src/agents/` 目录残留 🟢 LOW

**Evidence:**
- `apps/api/src/agents/specialists/CopywritingAgent.ts` (PRD-2 老示例 · 0 引用)
- `apps/api/src/agents/base/IPProgressService.ts` (老服务 · `tests/unit/api/ip-progress.test.ts` 才用 · 主代码已迁到 `services/ip-progress/IPProgressService.ts`)
- `apps/api/src/agents/base/BaseSpecialist.ts` (老 stub · 0 import 引用)
- 仍在用:`apps/api/src/agents/base/types.ts` `SpecialistId`/`ModelTier` (5 处 import)
**Impact:** 类型仍在用 · 但代码 dead · 容易混淆 ralph 找错文件
**Fix:** 把 `types.ts` 内容迁到 `apps/api/src/specialists/base/types.ts` · 删 `agents/` 目录 · 留 1 文件类型定义 · 待重构 PRD

#### TD-NEW-4 · `audit-ld.sh` 脚本不存在 🟠 MEDIUM

**Evidence:** `package.json:24` `"audit:ld": "bash scripts/audit-ld.sh"` 但 `find scripts -name "audit-*.sh"` 仅 `audit-redlines.sh` 一个 · `audit-ld.sh` + `audit-all.sh` 都不存在
**Impact:** `pnpm audit:ld` / `pnpm audit:all` 直接失败 · 没有 LD 级别的自动化检测
**Fix:** 补 `scripts/audit-ld.sh`(R-6 RLS / R-7 schema 漂移 / R-8 zod 缺失 / R-12 transaction / R-13 乐观锁 / R-14 PII)
**配套:** 之前 `scripts/audit-redlines.sh:24` 注释明确写 "其他 5 条复杂红线由 audit-ld.sh 检测" 但这脚本没建 · 隐患长期存在

#### TD-NEW-5 · `prisma generate` 期 client 输出不在 .gitignore 完整覆盖 🟢 LOW

**Evidence:** `git status` 显示 100+ generated TypeScript files in modified state · prisma client 输出污染工作树
**Impact:** 提交时容易把 generated 代码当 source 改动提进去
**Fix:** 检查 `.gitignore` 是否漏 `node_modules/.prisma/` 或 `apps/api/node_modules/@prisma/client/` 等

---

## §4 Operational Concerns

### §4.1 Ralph Daemon 状态机

**核心文件:**
- `scripts/ralph/ralph.py` (主 daemon · ~1400 行)
- `scripts/ralph/ralph-tools.py` (CLI 工具 · approve/reject/audit-status)
- `scripts/ralph/watch-audit-gate.py` (audit-gate 监听 · 系统通知)
- `scripts/ralph/CLAUDE.md` / `VALIDATOR.md` (Agent 指令)

**3 阶段 cycle:**
```
Developer (dev iter, max 30 min)
   ↓ commit
Validator (max 60 min · 含 retry)
   ↓ pass
Audit Gate (max 3 hr · 等 Opus approve)
   ↓ approve
下一 story
```

**Timeout 配置(`scripts/ralph/ralph.py:49-53`):**
```python
TIMEOUT_SECONDS = 30 * 60          # Developer 30 min
VALIDATOR_TIMEOUT_SECONDS = 60 * 60  # Validator 60 min
AUDIT_TIMEOUT_SECONDS = 10800      # Audit Gate 3 hr
```

**状态文件:**
- `scripts/ralph/audit-gate.json` (运行时 · pending/approved/rejected)
- `scripts/ralph/ralph-lock.json` (进程锁 · 防多实例)
- `scripts/ralph/cost-log.jsonl` (每 iter 耗时 + 模型 cost)
- `scripts/ralph/agent-logs/` (每 iter 完整 stdout · 调试用)

### §4.2 RCA-003 · `claude --print` ECONNRESET 系统级风险

**事故详:** `.agents/rca/RCA-003-us012-econnreset.md` (2026-05-09 17:47-18:59 · 73 min 5 次 retry · daemon 自然退出)

**核心结论:**
- US-012 prompt 10.7K 字节(没超 12K · 不是 large story 问题)
- 5 次 retry 全部 `API Error: Unable to connect to API (ECONNRESET)` · Anthropic 后端 8 min 内 3 次抖动
- daemon 触 BLOCKED + max retry → 自然 exit + Monitor 静默 → 用户人工介入恢复

**未修补隐患:**
1. **TD-009 ralph.py 不区分网络故障 vs 代码失败** · 网络抖动消耗 retryCount → 等价无效重试
2. **daemon 自然退出文案误导** · `[OK] 所有任务已完成（部分可能 BLOCKED）!` 实际是失败 · 需要响铃通知 not 静默 exit
3. **0 bytes + 30 min timeout 模式** · 几乎 100% 是网络问题(不是任务太大) · 应提前 5 min kill + 不计 retryCount

**修复路径(TD-009 fix_hint):**
- ralph.py iter loop 加 stderr grep `ECONNRESET|Unable to connect|503` → 不消耗 retryCount + 指数退避(time.sleep(min(2**attempt, 60)))
- 单独"网络重试" max=10 vs 普通失败 max=5
- BLOCKED 时不退出 · 写 `audit-gate.json(needs_attention)` 让 Monitor 响铃

**Workaround:** 项目 CLAUDE.md §9.6.5 已加"失败 → 拆分 → 重启" 5 步 SOP(20 min 内完成)

### §4.3 RCA-001 · Audit Monitor session-only 风险

**事故详:** `.agents/rca/RCA-001-audit-delay.md` (US-001 audit-gate pending 31 分钟空窗)

**根因:** Monitor 工具是 session-only · Opus 主对话不接收 OS 级系统通知 · `tail -F ralph-output.log | grep PENDING_DETECTED` Monitor 没启 → 链路断

**修复(项目 CLAUDE.md §9.1):** 5 步 SOP 必须按顺序
```
1. 确认 prd.json 就位
2. ★ 先启 Monitor (persistent=true)
3. 启 ralph daemon (--model sonnet --daemon)
4. 等 Monitor 通知 PENDING_DETECTED:US-XXX
5. 审完 ralph-tools.py approve / reject
```

**配套设施(全局 CLAUDE.md 2026-05-04 升级 SOL-3):**
- `watch-audit-gate.py --daemon` 启动时自动 fork · poll audit-gate.json · 检测 pending → macOS osascript+say / Linux notify-send / Windows beep
- 不再依赖会话内 Monitor · 但仍需 OPUS 主对话 Monitor 工具兜底(双保险)

**残留风险:**
- 🟡 跨项目教训 · "PRD-3 US-001 案例教训(2026-04-20)" 同类问题 2 年前已发生 · 这次又犯 → 全局 CLAUDE.md 警告级别需要升级到红线 enforce(待 v3 评估)

### §4.4 RCA-002 · Large Story 拆分硬规则

**事故详:** `.agents/rca/RCA-002-developer-timeout.md` (US-005 size=large 3 次 30 min 超时 · 90 min 0 输出)

**根因:**
- Story 粒度过大(9 AC + 17 files + shadcn 12 组件 + Header + e2e 三大件)
- claude --print stdout file-redirect 是 block-buffered(8KB) · 不是 line-buffered · kill 时 buffer 丢失 → log 0 bytes
- ralph.py 5 min no-output 仅 WARN · 30 min 才 kill · 浪费时间

**项目 CLAUDE.md §9.6 硬规则:**
1. **size_hint 决策表** · files_to_create > 12 必拆 · "+ 多组件" / "schema+impl+UI 同 story" 必拆
2. **prompt 字节阈值** · `< 7K` 正常(US-001~004 实测) · `7-10K` 监控 · `10-12K` 警告 · `> 12K` 拒启 daemon
3. **失败响应 SOP** · ralph 5 min no-output 立即 kill + 拆 story · 不要让 ralph 跑到 max retry 5

**预算:**
- 单 story dev iter < 15 min
- 单 round 总耗时 < 60 min(dev 15 + validator 5 + audit 10 + buffer)

### §4.5 多代理协调机制

**Workflow:**
```
prd.json (12 stories) → ralph daemon
  ├─ Sonnet (Developer) → 写代码 + commit
  ├─ Sonnet (Validator) → 跑 tests + 验 AC + 写 manifest
  └─ Audit Gate → 等 Opus
                 ↓ Opus approve
                 → 下一 story
```

**Reject Examples Library(全局 · 跨 PRD 跨项目):**
- 路径:`~/.claude/playbooks/reject-examples.jsonl`
- 项目本地 seed:`scripts/seed-reject-examples.sh` 已 chmod +x · 已 seed 35 条
- prd skill 转 prd.json 时按关键词 match · ≤3 条相关 reject 反例注入到 `anti_patterns` 字段
- ralph.py `build_developer_prompt` 渲染成 [SHIELD] 段落注入 Developer prompt
- 历史教训跨 PRD 累加(全局 CLAUDE.md SOL-2)

### §4.6 Cost & Quality Visibility

**Cost Log 双层(TD-013):**
- Layer 1 · `LLMGateway` `apps/api/src/workers/llm-gateway/cost-logger.ts` writeCostLog(callType='complete') · LLM 调用维度
- Layer 2 · `BaseSpecialist` `apps/api/src/specialists/base/BaseSpecialist.ts:228-250` prisma.costLog.create(callType='specialist_call') · 含 target.stepKey
- 同一 Specialist 调用 → 2 条记录 · trace_id 相同
- PRD-11 admin 仪表盘启动时治理(选项 A 维度区分 / B 合并)

**LLM Judge Quality Gate:**
- `tests/judge/judge-runner.ts:68` `model_tier='lightweight'` (haiku) · `timeout_ms=10_000` · `retry=1`
- AC-7 `score >= 6 → pass=true` · `score < 6 → pass=false` · 阈值在 `judge-runner.ts:37` `PASS_SCORE_THRESHOLD = 6`
- AGENTS.md §3 LD-016 要求 LLM Judge 评分 ≥ 4.0/5.0(scale 不一致 · LD-016 是 5 分制 · judge-runner 是 10 分制 · 待统一)
- 12 judge cases:positioning / branding / monetization / topic / copywriting (boom/free) / video / livestream / analysis (structural/viral)

**Coverage Thresholds(`vitest.config.ts:20-25`):**
```ts
thresholds: {
  global: { lines: 80, functions: 80, branches: 75, statements: 80 },
  'src/server/agents/**': { lines: 90, functions: 90, branches: 85, statements: 90 },  // ← 路径过期
  'src/lib/**': { lines: 95, functions: 95, branches: 90, statements: 95 },             // ← 路径过期
}
```

**风险:** 路径 `src/server/agents/**` `src/lib/**` 在 monorepo 不存在 · coverage 阈值实际只跑 global 80% · 没有 90% 严格门禁 · 配合 TD-NEW-2 audit-redlines.sh 路径过期 · monorepo 改造后多项 audit 失效

### §4.7 Configuration Drift 风险

**配置文件位置:**
- `tsconfig.base.json` ✅ 全局严格 (strict + noUncheckedIndexedAccess + 6 strict 子项 · L17-29)
- `apps/api/package.json:11` `eslint . --max-warnings=0` ✅ 0 warning 强制
- `apps/web/vitest.config.ts` 独立 · 注意与 root vitest.config.ts 同步

**已知漂移:**
- coverage thresholds 路径过期(§4.6)
- audit-redlines.sh 路径过期(TD-NEW-2)
- audit-ld.sh 完全不存在(TD-NEW-4)

---

## §5 Critical Action Items

按紧迫度排序 · 给下一个 PRD/story planning 参考。

### 🔴 P0 · 上线前必修(预计 2-3 stories · 8-15 hours)

1. **PII Mask + Disclaimer 接线** (§1.6 / TD-NEW-1)
   - 1 story · 修 ContextAssembler `_formatUserPrompt` + BaseSpecialist `execute` step 6
   - + 3 个 unit test · 1 个 integration test
   - 验证:`grep -rn "piiMask\|attachDisclaimerMeta" apps/api/src --include="*.ts"` 应至少 3 处 import

2. **audit-redlines.sh 路径修复 + audit-ld.sh 补全** (TD-NEW-2 / TD-NEW-4)
   - 1 story · 改 src/ → apps/api/src/ · 新建 audit-ld.sh(R-6/7/8/12/13/14)
   - 验证:`pnpm audit:redlines` + `pnpm audit:ld` 全部 ✅

### 🟠 P1 · PRD-6/7 规划期处理(预计 1-2 stories · 4-8 hours)

3. **vitest coverage thresholds 路径修复** (§4.6)
   - 路径改成 `apps/api/src/specialists/**` + `apps/api/src/lib/**`
   - 验证:跑 `pnpm test --coverage` · 看 90%/95% 严格门禁是否生效

4. **TD-009 ralph.py 网络故障识别** (RCA-003)
   - 在 `~/.claude/scripts/ralph/ralph.py` 加 ECONNRESET/503 识别 + 不消耗 retryCount + 指数退避
   - 同步到所有 Coding 3.0 项目

### 🟢 P2 · Architecture 健康度(预计 PRD-7+ 治理)

5. **TD-014 PositioningAgent _mode race window** (5 specialists 都有)
   - 选项 A · BaseSpecialist 接口改 `outputSchema(req)` method (~200 行 · 7 specialist + base + tests)
   - 选项 B · AsyncLocalStorage 隔离 _mode

6. **TD-013 双重 cost_log** (PRD-11 admin)
   - 选项 A · UI 按 callType 区分 vs 选项 B · 合并到 LLMGateway 单写

7. **TD-005 shadcn 12 组件 lift** (P9.0 admin 启动前)
   - apps/web/src/components/ui/ → packages/ui/src/base/

8. **TD-NEW-3 历史 agents/ 目录清理**
   - 把 types 迁到 specialists/base/ · 删 agents/

---

## §6 Audit Verification Commands

下次 PRD 启动前 / Opus audit 时跑:

```bash
# 1. 屏障 1 验证 · publicProcedure 仅在 auth router
grep -rn "publicProcedure" apps/api/src/trpc/routers/ --include="*.ts" | grep -v "auth.ts" | grep -v "//.*publicProcedure"
# 期望:0 命中(只 auth.ts:9 命中 · 已被 grep -v 过滤)

# 2. 屏障 4 验证 · LLM API key 仅服务端
grep -rn "ANTHROPIC_API_KEY\|OPENAI_API_KEY" apps/web --include="*.ts" --include="*.tsx"
# 期望:0 命中

# 3. R-1 验证 · SDK 仅 LLMGateway 引用
grep -rn "@anthropic-ai/sdk\|from 'openai'" apps --include="*.ts" --include="*.tsx" | grep -v "llm-gateway/index.ts"
# 期望:0 命中

# 4. § 1.6 PII/Disclaimer 验证(★ 期望 0 但应该 ≥ 3)
grep -rn "piiMask\|appendDisclaimerIfSensitive\|attachDisclaimerMeta" apps/api/src --include="*.ts" | grep -v "lib/compliance/"
# 当前:0 命中(R-14 违规)
# 修后期望:≥ 3 命中(ContextAssembler + CopywritingAgent + VideoAgent)

# 5. R-10 验证 · 无 any
grep -rn ": any[^a-zA-Z]\|as any" apps/api/src --include="*.ts" | grep -v "test\|spec\|eslint-disable"
# 期望:0 命中

# 6. RLS 表数 验证
grep -c "ENABLE ROW LEVEL SECURITY" prisma/migrations/manual_rls.sql
# 期望:15

# 7. tech-debt.json schema 验证
python3 -c "import json; d=json.load(open('.agents/tech-debt.json')); print('items:', len(d['items']), 'open:', len([i for i in d['items'] if i['status']=='open']))"

# 8. RCA 数量
ls .agents/rca/ | wc -l
# 当前:3 (RCA-001/002/003)

# 9. 历史 agents/ 目录残留
find apps/api/src/agents -name "*.ts" 2>&1 | wc -l
# 当前:4 文件 · 期望(清理后):≤ 1(types.ts 迁走后 0)

# 10. Specialist 数量(LD-002 = 14 上限 · 当前 8)
ls apps/api/src/specialists/*.ts 2>&1 | grep -v "/base" | wc -l
# 当前:8 (PRD-4 完成 8 specialist · PrivateDomain/Diagnosis/DeepLearn/VoiceChat/Evolution/DailyTask 留 PRD-6+)
# 期望:≤ 14
```

---

## §7 Concerns Summary Matrix

| 类别 | 严重 | 计数 | 影响 |
|---|:-:|:-:|---|
| 🔴 Critical · LD-018 PII/免责未生效 | CRITICAL | 1 | 上线即合规违规 · §1.6 |
| 🟠 Medium · audit script 路径过期 | MEDIUM | 2 | TD-NEW-2 + TD-NEW-4 假阳红线检测 |
| 🟡 Medium · 网络故障消耗 retry | MEDIUM | 1 | TD-009 + RCA-003 跨 PRD 影响 |
| 🟡 Medium · Validator notes 推测 | MEDIUM | 1 | TD-010 死循环风险 |
| 🟡 Medium · scope-creep migration | MEDIUM | 1 | TD-004 已 accepted |
| 🟡 Medium · shadcn 组件路径 | MEDIUM | 1 | TD-005 P9.0 admin lift |
| 🟢 Low · 各类设计 drift | LOW | 9 | 见 §3.2 / §3.5 |

**总览:** PRD-1~PRD-5 闭环 12 stories 全 pass · 0 critical bug · 1 critical compliance gap(PII/免责) · 4 medium tech debt + 9 low 设计 drift · 3 RCA 派生流程加固已落地。

---

## §8 References

- **AGENTS.md** §3 18 Locked Decisions + §4.7 17 Red Lines · 决策权威
- **DATA-MODEL.md** §9 RLS 策略 + §13.8 admin RLS DISABLE 例外
- **PRD-MASTER.md** 14 PRD 总纲(本扫描覆盖 PRD-1~PRD-5)
- **`.agents/tech-debt.json`** 15 TD 完整列表(本文 §3 完整复述)
- **`.agents/rca/RCA-{001,002,003}.md`** 3 流程级 RCA(本文 §4.2-4.4 总结)
- **`scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md`** Opus audit § 0 必跑 4 项 + § Z 风险分档
- **项目 CLAUDE.md §9** Ralph daemon SOP + §9.6 large story 拆分硬规则
- **全局 ~/.claude/CLAUDE.md** Coding 3.0 12 步 + 反例库注入机制(2026-05-04)

---

*Concerns audit: 2026-05-09 · QuanAn PRD-1~PRD-5 完成期 · 12 stories PRD-5 PASSED*
