# Codebase Concerns · QuanQn

**Analysis Date:** 2026-05-11
**Scope:** PRD-1 → PRD-8 完成期 · 65 stories all approved · 准备进入 PRD-9
**Inputs:** AGENTS.md §3 (18 LD) + §4.7 (17 R 红线) + §10 admin (5 LD-A) · `.agents/tech-debt.json` (32 TD 条目 · 8 open / 24 resolved) · `.agents/rca/` (5 RCAs: 001-005) · 实际代码 grep + file:line 实证

---

## §1 Security Boundaries

本节列出 6 道安全屏障 + file:line 实证。PRD-5 §0 修复后 LD-018 PII/免责已生效。PRD-8 引入 STT/TTS Worker · D-038 OpenAI 音频 API 仅 worker 层 · R-001 边界完整。

### §1.1 屏障 1 · tRPC `protectedProcedure` 强制鉴权

**Location:** `apps/api/src/trpc/middleware/account-isolation.ts:52`

```ts
export const protectedProcedure = publicProcedure.use(accountIsolationMiddleware);
```

**实证(PRD-8 完成后 25 routers):**
- `apps/api/src/trpc/routers/` 25 routers · `publicProcedure` 仅命中 `auth.ts:9` (`auth.me` 唯一允许 unauthenticated)
- `globalProcedure` 命中 6 处 · 全部对应 LD-009 全局表:`ipAccounts.ts:57/101` (create/switchActive) · `invite.ts:39` (redeem) · `trending.ts:42-56` (3 fetch) · `dailyTasks.ts:146` (debugSeedTasks · e2e 截图用)
- 新增 PRD-8 routers · `stt.ts` / `tts.ts` / `voiceChat.ts` / `evolution.ts` / `dailyTasks.ts` 全部 `protectedProcedure`(SHIELD REJ-013 注释保留)

**风险等级:** 🟢 LOW · 强制覆盖 100% · audit-redlines.sh 已修(TD-017 resolved · PRD-5)实测可 grep 验证

---

### §1.2 屏障 2 · `accountIsolationMiddleware` set_config 写 RLS context

**Location:** `apps/api/src/trpc/middleware/account-isolation.ts:33-46`

**核心逻辑:**
```ts
return ctx.prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SET LOCAL ROLE quanqn_app`;                                           // L38
  await tx.$executeRaw`SELECT set_config('app.current_account_id', ${String(activeAccountId)}, true)`;  // L39
  if (user?.id !== null && user?.id !== undefined) {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${String(user.id)}, true)`;  // L41
  }
  return next({ ctx: { ...ctx, prisma: tx as unknown as PrismaClient } });                   // L44
});
```

**LD-009 双层防护(PRD-5 已闭环 · knowledge router 修):**
- 屏障 1 · RLS auto-filter (set_config 后所有 query 自动 WHERE account_id = current_account_id)
- 屏障 2 · 显式 `where: { accountId: activeAccountId! }` (LD-009 第二层 · 防 RLS 失效)

**风险等级:** 🟡 MEDIUM
- ⚠️ 每请求 wrap `$transaction` → +1 connection 占用 · 高 QPS 连接池可能耗尽(留 PRR)
- ⚠️ `as unknown as PrismaClient` 类型断言隐藏潜在 bug
- ✅ `quanqn_app` 非 superuser 角色与 RLS 策略联动 · RLS isolation test 覆盖

---

### §1.3 屏障 3 · Postgres RLS Policies(15 表)

**Location:** `prisma/migrations/manual_rls.sql`

**统计:**
- ENABLE RLS · **15 张表**(grep `ENABLE ROW LEVEL SECURITY` → 15 命中)
- 全局表不启用:`users` · `invite_codes` · `trending_items` · `audit_log`
- admin 13 表 · RLS DISABLE(LD-A-3 super_admin 跨账号查看 · admin 子系统未启动 · PRD-10+)

**Policy 模板:**
```sql
CREATE POLICY <table>_account_isolation ON <table>
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);
```

**风险等级:** 🟢 LOW
- ⚠️ `manual_rls.sql` 不在 prisma migrations 自动跑 · CI/CD 漏跑会丢屏障(注释明确 `必须在 prisma migrate 之后手动应用`)
- 验证脚本 `scripts/audit-redlines.sh` + `scripts/audit-ld.sh` 已修(TD-017/018 resolved)可自动 grep

---

### §1.4 屏障 4 · LLM API Key 仅服务端读取 + 不暴露给前端(R-001)

**Location:**
- `apps/api/src/workers/llm-gateway/index.ts:13-21` AC-7/AC-8 注释 `only this file in the entire codebase`(Anthropic + OpenAI chat completion)
- `apps/api/src/workers/stt/whisper.ts:10` AC OpenAI audio.transcriptions(D-038 STT 独占)
- `apps/api/src/workers/tts/openai-tts.ts:11` AC OpenAI audio.speech(D-038 TTS 独占)
- `apps/api/src/workers/image-gen/dall-e-3.ts:11` AC OpenAI images.generate(D-038 image 独占)

**实证:**
- `grep -rn "OPENAI_API_KEY" apps/web` → **0 命中** ✅
- `grep -rn "from '@anthropic-ai/sdk'\|from 'openai'" apps/web` → **0 命中** ✅
- `grep -rn "VITE_.*KEY\|VITE_.*SECRET" apps/web` → **0 命中** ✅
- `apps/api/src/workers/{stt/whisper,tts/openai-tts}.ts` `process.env.OPENAI_API_KEY` 读取 · throw `OPENAI_API_KEY not configured` 如缺失

**SDK 隔离(R-1):**
- `@anthropic-ai/sdk` import · 仅 `apps/api/src/workers/llm-gateway/index.ts:19` (1 命中)
- `openai` import · 仅 4 文件:llm-gateway/index.ts:21 · stt/whisper.ts:10 · tts/openai-tts.ts:11 · image-gen/dall-e-3.ts:11(D-038 全部 worker 层)
- `eslint-disable-next-line import/no-named-as-default` 标记每处

**Lazy-create 模式:**
- LLMGateway `_anthropicClient` / `_openaiClient` lazy `??=` 单例
- STT/TTS Worker 每次 invoke 创建 client(timeout/maxRetries 可配)· 单次 invoke pattern 不需要单例

**风险等级:** 🟢 LOW · 唯一入口设计有效 · 前端 0 引用 · PRD-8 STT/TTS 接入未破坏边界

---

### §1.5 屏障 5 · Lucia Session Cookie 安全配置

**Location:** `apps/api/src/lib/auth/lucia.ts:12-19` · `apps/api/src/index.ts:159-178`

**关键安全特性:**
- `name: 'app_session'` 与 admin 子系统的 `admin_session` 严格区分(LD-A-1 · admin 未启动)
- `httpOnly: true` 防 XSS 通过 `document.cookie` 读取 session
- `sameSite: 'Lax'` 防 CSRF
- `secure: isProduction` prod 仅 HTTPS
- OAuth CSRF Protection · `providers.ts:128-130` `requiresCsrfCheck()` mock 不需 · google 强制
- prod mock provider guard · `providers.ts:144-148` AC-15 `process.exit(1)` 若 prod + `OAUTH_PROVIDER=mock`
- Audit Log · `index.ts:117/169` 登录成功 + account.switch 写 `auditLog`(全局表 · 跨 PRD-1~8 一致)

**风险等级:** 🟢 LOW
- ⚠️ TD-007 残留 · `Header.tsx:65/229` `onClick={asyncFn}` no-misused-promises(low · 不影响安全 · scheduled)

---

### §1.6 屏障 6 · PII 脱敏 + 行业免责(LD-018 / R-14)— ★ PRD-5 已修复

**Location:**
- `apps/api/src/lib/compliance/pii-mask.ts` — 5 种 PII regex
- `apps/api/src/lib/compliance/disclaimer.ts` — 3 类敏感行业(medical/legal/finance)

**实证(PRD-5 §0 修复后 · TD-016 resolved):**
```bash
grep -rn "piiMask\|attachDisclaimerMeta\|appendDisclaimerIfSensitive" apps/api/src --include="*.ts" | grep -v "lib/compliance/"
```
命中 3 处:
- `apps/api/src/services/context-assembler/ContextAssembler.ts:197` · `const masked = piiMask(input)` _formatUserPrompt 接线
- `apps/api/src/specialists/base/BaseSpecialist.ts:210` · `appendDisclaimerIfSensitive(obj.markdown, industry)` 文案末尾追加
- `apps/api/src/specialists/base/BaseSpecialist.ts:212` · `attachDisclaimerMeta(obj, industry)` JSON 输出加 disclaimer 字段

**风险等级:** 🟢 LOW · 5 PRD 历史漏洞已闭环 · PRD-8 STT/TTS/VoiceChat 全部继承 BaseSpecialist 自动走该流程

---

### §1.7 屏障速查表

| # | 屏障 | 文件 | 关键行 | 状态 |
|:-:|---|---|---|:-:|
| 1 | tRPC protectedProcedure | `apps/api/src/trpc/middleware/account-isolation.ts` | L52 | 🟢 |
| 2 | set_config RLS context | `apps/api/src/trpc/middleware/account-isolation.ts` | L33-46 | 🟢 |
| 3 | Postgres RLS Policies(15 表) | `prisma/migrations/manual_rls.sql` | L17-30 | 🟢 (CI 漏跑风险) |
| 4 | LLM API Key 仅服务端(R-001) | `apps/api/src/workers/{llm-gateway,stt,tts,image-gen}/*.ts` | L91-100 / L69-77 / L46-50 | 🟢 |
| 5 | Lucia Session Cookie | `apps/api/src/lib/auth/lucia.ts` + `index.ts` | L12-19 / L159-178 | 🟢 |
| 6 | PII Mask + Disclaimer(LD-018) | `compliance/pii-mask.ts` + `compliance/disclaimer.ts` | ContextAssembler:197 + BaseSpecialist:210/212 | 🟢 (PRD-5 修) |

---

## §2 Performance Baselines

### §2.1 测试套件耗时(PRD-8 完成后)

| 套件 | 用例数 | 耗时 | 备注 |
|---|:-:|:-:|---|
| vitest unit + integration | 727+ | ~30 s | 真 PG + RLS 测试 + mock LLM(US-013 收官) |
| LLM judge | 20 | < 1 s | **18 mock pattern · evaluation 失效 · TD-027 high · PRR** |
| Playwright e2e | 27 spec | ~150 s | 含 voice-chat-flow.spec.ts smoke / daily-tasks / evolution UI |
| typecheck (6 ws incremental) | — | < 5 s | tsc -b |
| typecheck (6 ws cold) | — | ~30-60 s | 全量 |

**配置位置:**
- `vitest.config.ts:37-38` testTimeout=30000 · hookTimeout=60000
- `apps/api/package.json:11` lint = `eslint . --max-warnings=0` 0 warning 强制

### §2.2 ContextAssembler 5 路并行 fetch(PRD-8 新)

**Location:** `apps/api/src/services/context-assembler/ContextAssembler.ts:44-51`

```ts
await Promise.allSettled([
  withTimeout(this._fetchStepData(req.accountId), FETCH_TIMEOUT_MS),    // L2 step_data
  withTimeout(getLatestInsight(req.accountId), FETCH_TIMEOUT_MS),       // L4 EvolutionInsight (NEW)
  withTimeout(this._fetchSamples(req.accountId), FETCH_TIMEOUT_MS),     // L4 Samples (PRR)
  withTimeout(this._fetchRag(req), FETCH_TIMEOUT_MS),                   // L5 RAG (D-025 降级跑空)
  withTimeout(this._fetchConstants(), FETCH_TIMEOUT_MS),                // constants
]);
```

**FETCH_TIMEOUT_MS = 5_000ms** · 各路独立 · 任一失败 fallback null

**实测预期:**
- L2 step_data + L4 insight + constants 平均 < 200ms
- L4 samples / L5 RAG 当前 stub return [] (PRD-9 RAG 接通后再评估)
- 总耗时 cap 5s · 平均 < 800ms

**风险点:**
- 🟡 L5 RAG 接通后 pgvector ivfflat/hnsw 索引在 schema.prisma 不能声明 · 需手动 SQL(P5+ 真 RAG 时加)
- 🟢 `_fetchSamples` 当前空跑 · PRR 接通后须验证 fetch 时长 + index 覆盖

### §2.3 Database Index Coverage

**全局统计:**
- `grep -c "@@index\|@@unique" prisma/schema.prisma` → **134 个索引/唯一约束**
- `grep -c "model " prisma/schema.prisma` → **39 个模型**(主应用 18 + admin 13 + workers + auth)
- 平均 ~3.4 索引/模型(覆盖良好)

**关键 partial unique constraints:**
- `EvolutionInsight (accountId, isLatest)` 仅一行 isLatest=true(PRD-8 US-003)
- `Asset` audio/image 类型按 fingerprint dedup(PRD-7/8)

**pgvector 字段(4 处 · 1536 维 OpenAI text-embedding-3-small):**
- `History.contentEmbedding` (PRD-2 · ivfflat 注释掉 · MVP cost saving)
- `TrendingItem.contentEmbedding` (PRD-5 · ivfflat lists=100)
- `DeepLearningArchive.styleVector` (PRD-5 · ivfflat lists=316)
- **`KnowledgeChunk.embedding` (PRD-9 US-001 新加)** · **HNSW index** (`USING hnsw (embedding vector_cosine_ops)`) · 比 ivfflat 检索质量更好 · 适用 RAG 实时检索 · 113 总行(67 案例 + 23 公式 + 23 元素)

**HNSW vs ivfflat 选型** · HNSW recall@10 通常 > ivfflat · 但建索引耗时 + 内存占用更高 · 113 行小数据集 HNSW 完美 · 大数据集(>100K rows)再评估 ivfflat 切换。

### §2.4 BullMQ Worker Concurrency(PRD-8)

**Location:** `apps/api/src/workers/*/worker.ts`

| Worker | Concurrency | jobId 模式 | 串行保证 |
|---|:-:|---|---|
| evolution | 5 (全局) | `evo:{accountId}:{count}` | 同 account 靠 jobId dedup 串行 · 跨 account 并发 |
| daily-task | 5 (全局 AC-6) | `daily:{accountId}:{date}` | 同 account+date dedup |
| image-gen | 2 (全局) | 默认 | 跨 account 并发限流 |
| stt / tts | N/A | 同步 invoke(不入队) | 走 router 直接调 worker |

**风险点(TD-030 resolved 2026-05-11):**
- D-055 字面 `concurrency=1 per accountId` 已对齐实际 jobId dedup 实现
- ⚠️ jobId dedup 仅在 BullMQ in-memory · Redis 重启会丢失 in-flight job · 留 PRR

### §2.5 L1 Buffer Redis 配置(PRD-8 VoiceChat)

**Location:** `apps/api/src/memory/l1-buffer.ts:20-25`

```ts
await redis.lpush(key, serialized);
await redis.ltrim(key, 0, MAX_TURNS - 1);   // MAX_TURNS = 20
await redis.expire(key, 1800);               // 30 min TTL · AC-5
```

**Key pattern:** `voice_chat:acc_{accountId}:turns`
**串行操作:** 3 个独立 redis 命令 · 非原子(无 MULTI/EXEC)· 实际并发风险低(单 user 串行 voice chat)
**风险点:** 高并发 voice session 时 ltrim + expire 可能滞后 1 命令 · 不影响功能

### §2.6 Rate Limiting(PRD-8 新加 STT/TTS)

**Per-user daily limit(`apps/api/src/lib/rate-limit/{stt,tts,image-gen}.ts`):**
- STT · `STT_DAILY_LIMIT_PER_USER` 默认 50 calls/day(`.env.example:48`)
- TTS · `TTS_DAILY_LIMIT_PER_USER` 默认 100 calls/day(`.env.example:52`)
- ImageGen · `IMAGE_GEN_DAILY_LIMIT_PER_USER` 默认 10 calls/day

**LLM Gateway Token Bucket(`apps/api/src/workers/llm-gateway/rate-limiter.ts:25-29`):**
- `free: 50 / pro: 500 / enterprise: 5000` calls/day · Upstash Redis token bucket
- 缺 `UPSTASH_REDIS_REST_URL` 时 → log warn + pass through(本地 dev)

### §2.7 慢查询风险点

| Risk | 文件 | 描述 | 缓解 |
|---|---|---|---|
| 🟡 history.list N+1 | `routers/history.ts:77-83` | findMany 仅 select HISTORY_SELECT · feedbacks 不 include | ✅ 已 select · accountId 索引 |
| 🟡 ContextAssembler stepData findMany | `services/context-assembler/ContextAssembler.ts:98-103` | 全表扫(无 take limit)· 单 account 9 步 stepData < 9 行 · OK | ✅ accountId 索引 |
| 🟠 cost_log 双写(TD-013) | LLMGateway + BaseSpecialist | 同 trace_id 2 条 · 字段重叠 80% · PRD-11 admin 治理 | ⏭️ PRD-11 |
| 🟠 stepData.saveStream 长连接 | `routers/stepData.ts` | streaming write + DB 事务 · 高 QPS 连接池风险 | 🟡 待真实负载测试 |
| 🟠 STT/TTS base64 audio buffer | `routers/stt.ts:42` · `routers/tts.ts` | 整 audio buffer base64 一次性传输 · 非 streaming · 大文件占内存 | 🟡 PRR · OpenAI Whisper 限 25MB / TTS 限 4096 字符 |
| 🟢 specialist-llm-real 集成测 | `tests/integration/api/specialist-llm.test.ts` | 真 LLM 调用 · 5-30s · 不计入 vitest unit 主套件 | ✅ 隔离 |

### §2.8 Connection Pool

**Prisma 配置(`apps/api/src/lib/prisma.ts`):**
- 单例 `prisma` · 默认 `num_physical_cpus * 2 + 1`(8 核 = 17 connections)
- accountIsolationMiddleware 每请求 wrap `$transaction` → 占用 1 connection 直到事务结束
- **风险:** 高 QPS (>50 req/s) 时 pool 可能耗尽 · prisma timeout 5s 报错

**缓解(留 PRR):**
- prisma `connection_limit` 加大到 50+
- connection pool monitoring(Datadog / Sentry / OTel)

### §2.9 Cost Tracking · cost_log eventType 7 类完整列表(PRD-9 收官时已 7 类全证)

`cost_log` 表跟踪所有 LLM / 外部 API 调用的成本 · 7 种 `eventType` 全部已落地(PRD-9 US-005 AC-7 验证):

| eventType | 引入 PRD | 文件命中数 | 用途 |
|---|:-:|:-:|---|
| `specialist_call` | PRD-2/3 | 24 files | 14 Specialist 各自调用 LLMGateway 时写入 |
| `judge_call` | PRD-5 | 13 files | LLM Judge 评估调用(TD-027 mock 中 · PRR 修)|
| `image_gen` | PRD-6 | 5 files | DALL-E 3 图像生成调用 |
| `l5_agent` | PRD-8 | 6 files | L5 真 Agent 调用(EvolutionAgent / DailyTaskAgent / VoiceChatAgent)|
| `stt_call` | PRD-8 | 3 files | Whisper-1 语音转文本 |
| `tts_call` | PRD-8 | 3 files | OpenAI TTS-1 文本转语音 |
| **`embedding_call`** | **PRD-9** | **2 files** | OpenAI text-embedding-3-small (1536 dim · RAG)|

**grep 全证命令** · `for et in specialist_call judge_call image_gen l5_agent stt_call tts_call embedding_call; do n=$(grep -rln "'$et'" apps/api/src/ tests/ | wc -l); echo "  $et: $n files"; done`

**未来新增** · PRD-10+ admin 子系统可能加 `admin_call`(audit log)· 不污染主应用 cost_log(LD-A-1 隔离)。

---

## §3 Known Tech Debt(5 open · `.agents/tech-debt.json` 36 条 · post PRD-9)

完整列表来自 `/Users/return/Desktop/QuanQn/.agents/tech-debt.json` · 20 resolved + 3 accepted + 3 closed + 5 open = 36 条 (post PRD-9 · 2026-05-12)。本节聚焦 5 open(按 severity 排序)· 详细 PRD-9 新加 TD-034/035 见 retro `.agents/retros/prd-9-vs-prd-8-retrospective.md`。

### §3.1 🔴 High Severity Open(2 条)

#### **TD-027** · LLM Judge tests project-wide mock llmGateway · evaluation 失效
- **severity:** high
- **status:** open · **fix_by:** PRR(Production Readiness Review)
- **evidence:** `grep -l 'vi.mock.*llm-gateway' tests/judge/ → 18 files`(全部 20 judge file 中 18 文件 mock)· `tests/judge/voice-chat.judge.ts:13` · 返 `{pass: true, score: 8, reason: 'mock judge: all criteria satisfied'}` 固定值 · LLM Judge 永远 PASS 不真 evaluate
- **affects_prd:** PRD-2 ~ PRD-8(7 PRD 影响)
- **impact:** Medium-High · LLM Judge 是项目质量评估关键 · 现 18 judge file 都不真 grade · 上线前必修否则 AC validation 形同虚设
- **fix_hint:** A) tests/setup.ts 加 dotenv · CI 注入真 ANTHROPIC_API_KEY(推荐) B) `it.skipIf(!process.env.ANTHROPIC_API_KEY)` 优雅 skip C) 本地 ollama deterministic

#### **TD-025** · audit-gate self-approve 异常(US-009 + US-010 跨 session)
- **severity:** high
- **status:** resolved(2026-05-11T16:00)· 但 RCA-005 follow-up 留 PRD-9 启动前 mitigation
- **evidence:** [RCA-005](.agents/rca/RCA-005-audit-gate-self-approve.md) · 前 Claude session PID 95773 跨日 16h 18min 未退出 · 孤儿 Monitor (PID 19054) 命中 PENDING_DETECTED 通知前 Claude · 前 Claude 按全局 CLAUDE.md Step 5.5 强制规则自动 approve
- **follow_up:** PRD-9 启动前 mitigation: 1) handoff 流程加 `退出前 session` 步骤 2) ralph-tools.py approve 加 caller PID 写入 ~/.claude/audit-log-{project}.jsonl 3) Claude Code handoff skill 自动 kill stale Monitor 4) 全局 CLAUDE.md Step 5.5 加 `Monitor 通知只在当前活跃 session 响应`

### §3.2 🟠 Medium Severity Open(2 条)

#### **TD-022** · packages/schemas video schemas 字段简化版 vs VideoAgent inline 13 字段不一致
- **severity:** Critical → resolved(PRD-7 US-001 commit d4e3da8 · 2026-05-11T00:50)
- **evidence:** 5 schema canonical SoT 三处 1:1 一致 · grep 验证 router inline output 0 命中 · videoProductionOutput shotList 13+7 字段三处一致

#### **TD-028** · US-012 VoiceChat 5/8 component inline 在 612 行单文件
- **severity:** medium
- **status:** open · **fix_by:** US-013 收官 OR PRD-9 polish OR PRR
- **evidence:** `apps/web/src/pages/tools/VoiceChat.tsx` 612 行单文件 · PRD-8 US-012 prd.json files_to_create 列 7 文件 · 实际 3 个 · 5 missing: components/voice-chat/{RecordButton,TurnList,AudioPlayer}.tsx + hooks/useVoiceRecorder.ts(全部 inline)+ tests/e2e/voice-chat.spec.ts(US-013 弥补为 voice-chat-flow.spec.ts smoke 而非完整闭环)
- **impact:** Modularity 下降 · 子组件不可复用 · 难单独测试 · e2e 缺失意味着 STT→VoiceChat→TTS 闭环没自动 regression
- **fix_hint:** A) US-013 收官 polish:拆 5 component file + 写 voice-chat.spec.ts e2e(WebRTC mock with happy-dom + nock STT/TTS) B) 接受 inline · e2e 留 manual QA

### §3.3 🟢 Low Severity Open(4 条)

| ID | 标题 | status | fix_by | 影响 |
|:-:|---|:-:|---|---|
| **TD-005** | shadcn 12 组件路径 apps/web/src/components/ui/ vs packages/ui/src/base/ | scheduled | P9.0 admin 启动前 | admin 复用必修 · 单 web 不影响 |
| **TD-007** | apps/web 3 lint errors(no-misused-promises × 2 + no-unsafe-assignment × 1) | scheduled | 下次 web changes | `Header.tsx:65/229` + `useAuth.ts:11` |
| **TD-008** | generateTraceId 同名 2 函数(scheduled · PRD-2 实施期已部分修) | scheduled | PRD-2 实施期重命名 | 已部分修(US-007 改 generateHttpTraceId / generateSpecialistTraceId) |
| **TD-013** | 双重 cost_log 写入(LLMGateway + BaseSpecialist) | scheduled | PRD-11 admin 治理 | 同 trace_id 2 条 · callType 区分 |
| **TD-014** | PositioningAgent _mode instance state · 高并发 race 风险 | scheduled | PRD-7+ 高并发场景治理 | 5 specialists 都有 instance state · 单 user 串行 9 step 不触 race |
| **TD-015** | specialist-io schema 子目录组织 vs 协议锁单一文件 | accepted | PRD-4 收官 retro 改协议锁 | 子目录组织更清晰 · 不影响功能 |
| **TD-024** | 双路径 EvolutionAgent + DailyTaskAgent (specialists/ re-export + agents/ impl) | accepted | AGENTS.md §11.6.8 白名单(2026-05-11) | L5 自治型 Agent 设计 pattern · 接受为 modeling pattern |
| **TD-031** | Non-Goal 字面违反 · apps/admin/src/index.ts 12 行 placeholder | open | PRD-10 admin 真实施 | monorepo workspace 拓扑需求 · 12 行纯 placeholder · 无破坏架构 |
| **TD-032** | .planning/codebase/ stale(本次刷新解决) | resolved by this run | — | 距 PRD-8 完成 2 days lag |

### §3.4 总览 by Severity(2026-05-11)

```
🔴 high:      2  (TD-027 · TD-025 resolved-with-follow-up)
🟠 medium:    1  (TD-028 VoiceChat modularity)
🟢 low:       4  (TD-005 · TD-007 · TD-013 · TD-014 · TD-031 · TD-032 resolved-this-run)
─────────────
总计 open:    8  (recently resolved 24 · including TD-009/010/011/016/017/018/019/020/021/022/023/026/029/030/032)
```

### §3.5 ★ 漏登记的隐性 TD(本次新发现)

以下问题在 `.agents/tech-debt.json` 中**未登记** · 但本次 codebase 扫描发现 · 建议补登。

#### TD-NEW-1 · 历史 `apps/api/src/agents/` 目录残留 🟢 LOW

**Evidence(2026-05-11):**
- `apps/api/src/agents/base/{BaseSpecialist,IPProgressService,types}.ts` — 历史 stub(PRD-2 US-007)· 仍提供 `generateSpecialistTraceId` + `SpecialistId` 类型给新 PRD-8 L5 文件 import
- `apps/api/src/agents/evolution/EvolutionAgent.ts:16-17` import `@/agents/base/types`(429 行 · L5 真实施)
- `apps/api/src/agents/specialists/{CopywritingAgent,DailyTaskAgent}.ts` 双路径模式 · TD-024 accepted

**Impact:** 仍 active(types/generateSpecialistTraceId 引用)· 不是 dead code · 但目录组织混乱
**Fix:** PRD-9+ 评估 · 选 A 合并 `agents/base/` 到 `specialists/base/` · 选 B 文档化 AGENTS.md §11.6.8 已加白名单
**Verification:** `grep -rn "from '@/agents/base" apps/api/src` 命中 ≥ 5 · 不是 0

#### TD-NEW-2 · `scripts/audit-all.sh` 不存在(package.json:32 引用断链)🟢 LOW

**Evidence:**
```bash
$ ls scripts/audit-all.sh
ls: scripts/audit-all.sh: No such file or directory

$ grep audit package.json
"audit:redlines": "bash scripts/audit-redlines.sh",
"audit:ld": "bash scripts/audit-ld.sh",
"audit:all": "bash scripts/audit-all.sh",      ← 文件缺失
```
**Impact:** `pnpm audit:all` 直接 fail · 一键 audit 不可用 · 必须分别跑 audit:redlines + audit:ld
**Fix:** 简单脚本:`#!/bin/bash; bash scripts/audit-redlines.sh && bash scripts/audit-ld.sh`(2 行)

#### TD-NEW-3 · `verify-artifacts/` 跨 PRD 累积污染 🟢 LOW

**Evidence(`scripts/ralph/verify-artifacts/`):**
- 20 个 US-XXX 子目录(US-001 ~ US-018 + 旧版本 US-005-retry2 + US-001-prd3)· 累计 7.2 MB
- TD-020 ralph.py 启动期 cleanup_stale_verify_artifacts 已加(2026-05-11 PRD-7 US-002)· 但仅清 mtime > 24h · 历史目录仍累积

**Impact:** 磁盘累积 · audit-artifacts.py 误判 mtime span(TD-020 resolved 但残留目录大)
**Fix:** PRD 完成 retro 时清理过期 US-XXX 目录 · 或 ralph.py 加 strict mode 清同名 US-XXX

#### TD-NEW-4 · pgvector 字段重复声明 🟢 LOW

**Evidence:** `prisma/schema.prisma` `content_embedding` 出现 2 次:
- L109 `History.contentEmbedding Unsupported("vector(1536)")?`
- L232 重复声明(疑 schema 重复定义)

**Impact:** prisma generate 可能 warning · pgvector index 应用难
**Fix:** 核对是否两个不同 model · 或 schema 重复 bug · 必修

#### TD-NEW-5 · STT/TTS audio base64 一次性传输 · 无 streaming 🟡 MEDIUM(PRR)

**Evidence:**
- `apps/api/src/trpc/routers/stt.ts:42` `const audioBuffer = Buffer.from(input.audioBase64, 'base64');`
- `apps/api/src/workers/tts/openai-tts.ts:82` `await prisma.asset.create({ ... data: base64 ... })`
- 整 audio buffer base64 一次性传输 · 非 streaming

**Impact:** 大 audio file (>10MB) 占内存 · tRPC over HTTP 不支持 streaming binary · OpenAI Whisper 限 25MB / TTS 限 4096 字符 · 当前限额下 OK · 但用户连续录音 30s 接近 5MB
**Fix:** PRR · 改 multipart upload + chunked response · 或 SSE streaming(留 P9 上线前评估)

#### TD-NEW-6 · 5 layer memory 仅 3 层文件 · 2 层 stub 🟢 LOW

**Evidence:** `apps/api/src/memory/` 仅 3 文件:
- `l1-buffer.ts` (38 行 · PRD-8 VoiceChat L1 真接)
- `l4-profile.ts` (35 行 · PRD-8 EvolutionInsight L4 真接)
- `l5-trending.ts` (23 行 · L5 RAG stub · `TODO PRD-9 真接 trending API`)
- **L2 step_data** · 走 prisma 不单独抽象(已 OK)
- **L3 history** · 走 prisma 不单独抽象(已 OK)

**Impact:** 命名不一致 · L1/L4 是模块 · L2/L3 在 prisma 直查 · L5 stub
**Fix:** PRD-9 RAG 启动时 · 评估是否抽 `memory/l2-step-data.ts` + `memory/l3-history.ts` 模块化(可选)

---

## §4 Operational Concerns

### §4.1 Ralph Daemon 状态机(PRD-8 完成期升级)

**核心文件:**
- `scripts/ralph/ralph.py` (主 daemon · ~1700+ 行 · PRD-7 多次升级:audit-gate path B + verify-artifacts cleanup)
- `scripts/ralph/ralph-tools.py` (CLI · approve/reject/audit-status/check-risk)
- `scripts/ralph/watch-audit-gate.py` (audit-gate 系统通知)
- `scripts/ralph/audit-artifacts.py` (PRD-7 升级 · exit_code 强制 + zero_regression skip + mtime stale check)

**3 阶段 cycle:**
```
Developer (max 30 min)
   ↓ commit
Validator (max 60 min · 含 retry · 必产 pytest-full.xml/stdout.txt · TD-023 resolved)
   ↓ pass
Audit Gate (max 3 hr · 等 Opus approve)
   ↓ approve
下一 story
```

**Timeout 配置(`scripts/ralph/ralph.py:49-53`):**
- TIMEOUT_SECONDS = 30 * 60 (Developer 30 min)
- VALIDATOR_TIMEOUT_SECONDS = 60 * 60 (Validator 60 min)
- AUDIT_TIMEOUT_SECONDS = 10800 (Audit Gate 3 hr)
- HEALTH_CHECK_TIMEOUT = 20 (PRD-7 US-005 RCA-004 修 5→20)

**状态文件:**
- `scripts/ralph/audit-gate.json` (pending/approved/rejected · needs_attention)
- `scripts/ralph/ralph-lock.json` (进程锁)
- `scripts/ralph/cost-log.jsonl` (每 iter 耗时 + 模型 cost)
- `scripts/ralph/agent-logs/` (每 iter 完整 stdout)

### §4.2 RCA 总结(5 个跨 PRD)

| RCA | 触发 | 根因 | 修复 |
|:-:|---|---|---|
| **RCA-001** | PRD-3 US-001 audit 31 min 空窗 | Monitor session-only · 系统通知没到 Opus | 项目 CLAUDE.md §9.1 5 步 SOP + watch-audit-gate fork |
| **RCA-002** | PRD-3 US-005 large story 90 min 超时 | size_hint=large + prompt > 12K · stdout 8KB block-buffered | 项目 CLAUDE.md §9.6 拆分硬规则 + size_hint 决策表 |
| **RCA-003** | PRD-5 US-012 ECONNRESET | claude --print 网络故障消耗 retryCount | TD-009 resolved · ralph.py 加 net_attempt loop · 网络错误不消耗 retry |
| **RCA-004** | PRD-6 启动 health-check timeout 5s | _check_claude_health timeout 太短 · CPU 21% 5s 被杀 | PRD-7 US-005 修 5→20 · 全局 sync |
| **RCA-005** | PRD-8 US-009/010 self-approve | 前 Claude session 残留 Monitor 自动响应通知 | kill 前 Monitor · TD-025 follow-up PRD-9 启动前 |

### §4.3 多代理协调机制

**Workflow:**
```
prd.json (13 stories) → ralph daemon
  ├─ Sonnet (Developer) → 写代码 + commit
  ├─ Sonnet (Validator) → 跑 tests + 验 AC + 写 manifest (含 zero_regression + pytest-full)
  └─ Audit Gate → 等 Opus approve
                 ↓ Opus
                 → 下一 story
```

**Reject Examples Library(全局 · 跨 PRD 跨项目):**
- `~/.claude/playbooks/reject-examples.jsonl` · 35 条 seed + 跨 PRD 累加
- `scripts/seed-reject-examples.sh` 项目本地 seed
- prd skill 转 prd.json 时按关键词 match · ≤3 条 reject 注入到 `anti_patterns` 字段
- ralph.py `build_developer_prompt` 渲染成 [SHIELD] 段落

### §4.4 Cost & Quality Visibility

**Cost Log 双层(TD-013):**
- Layer 1 · `LLMGateway.writeCostLog(callType='complete')` · LLM 调用维度
- Layer 2 · `BaseSpecialist.prisma.costLog.create(callType='specialist_call')` · 含 target.stepKey
- 同 trace_id 2 条 · PRD-11 admin 治理

**LLM Judge Quality Gate(★ TD-027 失效中):**
- `tests/judge/judge-runner.ts` · 20 judge case · `score >= 6 → pass`
- **18/20 judge mock llmGateway 返固定 pass=true · evaluation 失效 · PRR 必修**
- 仅 2 judge 真接 LLM(待 grep 复核)

**Coverage Thresholds(`vitest.config.ts:20-25`):**
- global 80% · `src/server/agents/**` 90%(路径过期 monorepo 改造)
- `src/lib/**` 95%(路径过期)
- 实际 monorepo 路径应为 `apps/api/src/specialists/**` + `apps/api/src/lib/**`

### §4.5 verify-artifacts 累积清理(TD-020 resolved)

**位置:** `scripts/ralph/verify-artifacts/`(7.2 MB · 20 US-XXX 目录)

**Cleanup(PRD-7 US-002 commit 1699296):**
- `ralph.py:1404` `_cleanup_stale_verify_artifacts(threshold_hours=24)` daemon 启动期调用
- 仅清 mtime > 24h 文件 · 历史目录保留

**残留风险:**
- US-005-retry2 / US-001-prd3 等历史目录占空间 · 不影响功能
- PRD-9 启动前可手动清

---

## §5 Critical Action Items

按紧迫度排序 · 给下一 PRD/story planning 参考。

### 🔴 P0 · PRR 上线前必修(预计 1-2 stories · 5-10 hours)

1. **TD-027 LLM Judge mock 全 project-wide 失效**(§3.1 · 18/20 judge file)
   - 影响:LLM Judge 评估机制形同虚设 · 跨 PRD-2~PRD-8 共 7 PRD 字面 pass 实际 0 grade
   - 1 story · tests/setup.ts 加 dotenv + 18 judge file 去 mock OR skipIf 优雅 skip + CI 注入真 KEY
   - 验证:`grep -rn "vi.mock.*llm-gateway" tests/judge/` 命中应 < 5(不是 18)

2. **TD-025 跨 session audit-gate self-approve follow-up**(RCA-005)
   - 1 story · ralph-tools.py approve 加 caller PID 写入 audit-log-{project}.jsonl + Claude Code handoff skill 加 kill stale Monitor + 全局 CLAUDE.md Step 5.5 加 `Monitor 通知只在当前活跃 session 响应`

### 🟠 P1 · PRD-9 启动期 polish(预计 1-2 stories · 4-8 hours)

3. **TD-028 VoiceChat 612 行单文件拆 5 component file + 补 voice-chat.spec.ts e2e**(§3.2)
   - 1 story · 拆 RecordButton/TurnList/AudioPlayer.tsx + useVoiceRecorder.ts + WebRTC mock e2e

4. **TD-NEW-2 scripts/audit-all.sh 补全**(2 行脚本)
5. **TD-NEW-4 schema.prisma content_embedding 重复声明核对**(疑 bug)

### 🟢 P2 · Architecture 健康度(预计 PRD-10+ 治理)

6. **TD-005 shadcn 12 组件 lift apps/web → packages/ui**(P9.0 admin 启动前)
7. **TD-013 双重 cost_log**(PRD-11 admin 仪表盘)
8. **TD-014 PositioningAgent _mode race window**(5 specialists)
9. **TD-031 apps/admin placeholder 移除**(PRD-10 真实施时直接覆盖)
10. **TD-NEW-5 STT/TTS audio streaming**(PRR · 当前 25MB / 4096 字符限额下 OK)

---

## §6 Audit Verification Commands

下次 PRD 启动前 / Opus audit 时跑(PRD-8 完成后基线):

```bash
# 1. 屏障 1 验证 · publicProcedure 仅在 auth router
grep -rn "publicProcedure" apps/api/src/trpc/routers/ --include="*.ts" | grep -v "SHIELD\|//.*publicProcedure" | grep -v "auth.ts"
# 期望:0 命中

# 2. 屏障 4 验证 · R-001 LLM API key 仅服务端
grep -rn "ANTHROPIC_API_KEY\|OPENAI_API_KEY" apps/web --include="*.ts" --include="*.tsx"
# 期望:0 命中

# 3. R-1 验证 · SDK 仅 worker 层(4 文件)
grep -rn "from '@anthropic-ai/sdk'\|from 'openai'" apps --include="*.ts" | grep -v "test\|spec"
# 期望:5 命中(llm-gateway × 2 + stt + tts + image-gen · D-038)

# 4. § 1.6 PII/Disclaimer 验证(PRD-5 修复后)
grep -rn "piiMask\|attachDisclaimerMeta\|appendDisclaimerIfSensitive" apps/api/src --include="*.ts" | grep -v "lib/compliance/"
# 期望:≥ 3 命中(ContextAssembler + BaseSpecialist × 2)

# 5. R-10 验证 · 无 any
grep -rn ": any[^a-zA-Z]\|as any" apps/api/src --include="*.ts" | grep -v "test\|spec\|eslint-disable\|as unknown as"
# 期望:0 命中

# 6. RLS 表数 验证
grep -c "ENABLE ROW LEVEL SECURITY" prisma/migrations/manual_rls.sql
# 期望:15

# 7. tech-debt.json 校验
python3 -c "import json; d=json.load(open('.agents/tech-debt.json')); print('total:', len(d['items']), 'open:', len([i for i in d['items'] if i.get('status')=='open']), 'resolved:', len([i for i in d['items'] if i.get('status')=='resolved']))"
# 期望:total 32 · open 4-8 · resolved 23+

# 8. RCA 数量
ls .agents/rca/ | wc -l
# 期望:5 (RCA-001~005)

# 9. 双路径 EvolutionAgent + DailyTaskAgent (TD-024 accepted)
grep -rn "from '@/agents/evolution\|from '@/agents/specialists" apps/api/src --include="*.ts" | head -5
# 期望:≥ 2 命中 (re-export + worker 直 import)

# 10. Specialist 数量(LD-002 = 14 上限 · 当前 14 含 3 L5)
ls apps/api/src/specialists/*.ts 2>&1 | grep -v "/base" | wc -l
# 期望:14 (11 生成型 + 3 L5: Evolution/DailyTask/VoiceChat)

# 11. LLM Judge mock 检测(TD-027)
grep -l "vi.mock.*llm-gateway" tests/judge/*.judge.ts | wc -l
# 当前:18 (问题) · 修后期望:0 (推荐) 或 ≤ 3 (部分迁移)

# 12. 5 layer memory 模块
ls apps/api/src/memory/*.ts | wc -l
# 期望:3 (l1-buffer · l4-profile · l5-trending)

# 13. BullMQ Worker 数(P3 + L5)
ls -d apps/api/src/workers/*/ | wc -l
# 期望:9 (daily-task · evolution · file-parser · image-gen · llm-gateway · methodology-query · stt · trending-scraper · tts)

# 14. STT/TTS Daily limit env example
grep "STT_DAILY_LIMIT\|TTS_DAILY_LIMIT" .env.example
# 期望:2 命中 (TD-026 resolved)

# 15. audit script 文件完整性
ls scripts/audit-*.sh
# 当前:2 (audit-redlines.sh · audit-ld.sh)
# TD-NEW-2 expected:3 (+audit-all.sh)
```

---

## §7 Concerns Summary Matrix(2026-05-11)

| 类别 | 严重 | 计数 | 状态 |
|---|:-:|:-:|---|
| 🔴 High · LLM Judge mock 失效(7 PRD) | HIGH | 1 | TD-027 open · PRR 必修 |
| 🔴 High · audit-gate self-approve follow-up | HIGH | 1 | TD-025 resolved · RCA-005 follow-up PRD-9 |
| 🟠 Medium · VoiceChat 612 行 modularity | MEDIUM | 1 | TD-028 open · US-013 polish |
| 🟡 Medium · STT/TTS audio 无 streaming | MEDIUM | 1 | TD-NEW-5 PRR |
| 🟢 Low · 各类设计 drift + 流程加固 | LOW | 6 | TD-005/007/013/014/031 + TD-NEW-1/2/4/6 |

**总览(PRD-8 完成时):**
- 65 stories 跨 8 PRD 全 approved
- 0 critical functional bug
- 1 high evaluation gap(TD-027 LLM Judge mock · 跨 PRD-2~8)
- 1 high process follow-up(TD-025 audit-gate · RCA-005)
- 1 medium modularity drift(TD-028 VoiceChat)
- 5 RCA 派生流程加固已落地(RCA-001~005 · 跨 PRD-3~8)
- D-038 STT/TTS Worker R-001 边界完整 · LD-009 双层防护(PRD-5 修)· LD-018 PII/免责(PRD-5 修)闭环

---

## §8 References

- **AGENTS.md** §3 18 Locked Decisions + §4.7 17 Red Lines + §10 5 LD-A admin + §11.6.8 EvolutionAgent + DailyTaskAgent 白名单
- **ARCHITECTURE.md** §6.4 ContextAssembler 5 路 + §6.6 11 生成型 Specialist + §6.8 3 L5 自治型
- **ADMIN-ARCHITECTURE.md** v0.2 admin 子系统(PRD-10/11/12/13/14 启动后常读)
- **DATA-MODEL.md** §9 RLS 策略 + §13.8 admin RLS DISABLE + §13 admin 13 表
- **PRD-MASTER.md** 14 PRD 总纲(本扫描覆盖 PRD-1~PRD-8)
- **`.agents/tech-debt.json`** 32 TD 完整列表(8 open · 24 resolved)
- **`.agents/rca/RCA-{001,002,003,004,005}.md`** 5 流程级 RCA(本文 §4.2 总结)
- **`scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md`** Opus audit § 0 必跑 4 项 + § Z 风险分档
- **项目 CLAUDE.md §9** Ralph daemon SOP + §9.6 large story 拆分硬规则
- **全局 ~/.claude/CLAUDE.md** Coding 3.0 12 步 + 反例库注入机制(2026-05-04)

---

*Concerns audit: 2026-05-11 · QuanQn PRD-1~PRD-8 完成期 · 65 stories all approved · 8 open TD · 准备进入 PRD-9*
