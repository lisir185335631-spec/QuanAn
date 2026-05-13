# Codebase Concerns — apps/api

**Analysis Date:** 2026-05-13
**Scope:** apps/api 后端事实性问题清单 · PRD-11 22 US 全过 + 6 admin 业务核心域落地后的代码层观察

## Tech Debt

**Approval Gate 真闭环未完工(PRD-13 placeholder):**
- Issue: `approvalGateCheck` middleware 仅 stub · `meta.requiresApproval=true` 时直接抛 `TRPCError NOT_IMPLEMENTED`
- Files: `apps/api/src/trpc/middleware/admin/approvalGateCheck.ts:33`
- 当前替代实现 · 业务 router 内手写 super_admin 分支(`auto_executed`)/ 普通 admin 分支(`pending` 创 approvalRequest 但不执行)
- 实例: `apps/api/src/trpc/routers/admin/users.ts:344-422`(changePlan)+ `users.ts:425-505`(banUser)+ `accounts.ts:303-396`(forceFreeze)+ `invites.ts:293-385`(invalidate)
- Impact: 14 高风险动作的 dual-approval / emergency-postReview / 24h 自动失效 全部未实现 · 见 AGENTS §10.3 D-1~D-4 + E-1~E-2
- Fix approach: PRD-13 · approvalGateCheck middleware 接管完整闭环 · 业务 router 删 super/admin 分支 stub · 改用 `meta.requiresApproval: true` 声明 · approval-resolver service 处理审批通过后的真执行

**admin router placeholder 占位(PRD-12/13/14 未落地):**
- Issue: adminRouter 注册了 7 个空 router(trending / deepLearn / prompts / quota / evolution / config / ab)
- Files: `apps/api/src/trpc/routers/admin/index.ts:17-23` `const trendingPlaceholder = adminTrpcRouter({})`
- Impact: 前端调这些 router 任意 procedure 都 404 · 但 router 暴露在 OpenAPI / tRPC type
- Fix approach: PRD-12/13/14 按域填实 · 与 §10.3 14 高风险动作清单逐条对应

**PRD-9 TODO 残留(主应用 · 不在 admin 范围):**
- Issue: `// TODO PRD-9 真接 trending API`
- Files: `apps/api/src/memory/l5-trending.ts:3, 21`(L5 trending 记忆层 stub)
- 主应用 trending 抓取流程未真接 · admin 仅有占位
- Impact: 主应用 ContextAssembler 拼上下文时 trending 部分用 mock
- Fix approach: PRD-9 后续 · `apps/api/src/workers/trending-scraper/` 完整化(目前仅一个 .gitkeep 占位 · LD-A5 review queue 也未实现)

**LD-A5 review queue 未实现:**
- Issue: TrendingScraper / FileParser 应该写 review queue 而不是直接写主表(AGENTS §10.1 LD-A5)
- Files: `apps/api/src/workers/trending-scraper/`(仅含 .gitkeep)· `apps/api/src/workers/file-parser/`(仅含 .gitkeep)
- Impact: 内容审核硬闸门未上线 · 一旦 trending 抓取 / 用户上传文件落地 · 会直接写主表绕过审核
- Fix approach: PRD-12 域 ⑥ ReviewQueue 落地 · 新建 `trendingReviewQueue` + `deepLearnReviewQueue` 表 + worker → queue → cron approved 检测 → embed

**主应用 Specialist 中 userId 占位(P1 TODO):**
- Issue: 7 个 Specialist 写死 `userId: 0`
- Files:
  - `apps/api/src/specialists/PositioningAgent.ts:150`
  - `apps/api/src/specialists/TopicAgent.ts:212`
  - `apps/api/src/specialists/MonetizationAgent.ts:169`
  - `apps/api/src/specialists/BrandingAgent.ts:223`
  - `apps/api/src/specialists/AnalysisAgent.ts:296`
  - `apps/api/src/specialists/LivestreamAgent.ts:129`
  - `apps/api/src/agents/specialists/CopywritingAgent.ts:129`(标的是 `historyId: 0 // TODO P3` · 不同问题)
- Impact: cost_log / audit_log 等表 userId 全 0 · 无法按用户聚合(admin cost router 部分功能不准)
- Fix approach: 在 `SpecialistRequest` 类型加 userId · BaseSpecialist 透传 · 涉及 14 Specialist 改动

**LLM Gateway 流式 + embedding 未实现:**
- Issue: 两个 TODO P3
- Files:
  - `apps/api/src/workers/llm-gateway/index.ts:170`(`// TODO P3 · 真实流式实现`)
  - `apps/api/src/workers/llm-gateway/index.ts:176`(`// TODO P3 · OpenAI text-embedding-3-small · 1536 维`)
- Impact: VoiceChat 流式响应延迟回放 · RAG 向量召回 fallback 文本(精度差)
- Fix approach: PRD-未指定 · stream() 用 SSE / WebSocket · embed 直接调 OpenAI text-embedding-3-small API

**Evolution worker 告警 stub:**
- Issue: `// TODO P3: integrate with PagerDuty / Sentry alert`
- Files: `apps/api/src/workers/evolution/worker.ts:65`
- Impact: Evolution 重算失败仅落 pino log · 无告警通道
- Fix approach: 接 Sentry SDK · 或 admin 钉钉服务(DingtalkService 已存 · 可复用)

**resetPassword 临时密码用 console.log:**
- Issue: 临时 reset 后写 `console.log(`[ADMIN RESET PASSWORD] user=${userId} email=${user.email} tempPassword=${tempPassword}`)`
- Files: `apps/api/src/trpc/routers/admin/users.ts:523`
- Impact: 临时密码出现在生产日志 · 极高泄露风险 · pod log 可能被外部访问
- Fix approach: PRD-未指定 · 接邮件服务发 reset link(而非 plaintext 密码)· 或 redact + 仅写 audit hash

**嵌套同名目录 `apps/api/apps/api/`:**
- Issue: 检索出 `/Users/return/Desktop/QuanQn/apps/api/apps/api/src/trpc/routers/`(嵌套)
- Files: `apps/api/apps/api/src/`(完整 src 拷贝 · 残留)
- Impact: 双份代码 · IDE/grep 可能扫到旧版 · build / typecheck 可能 include 错误
- Fix approach: 直接 `rm -rf apps/api/apps/` · 确认无遗失文件后提交清理

**`apps/api/src/audit/` 空目录占位:**
- Issue: 仅含 `.gitkeep` · 业务代码已迁到 `services/admin/audit/`
- Files: `apps/api/src/audit/.gitkeep`
- Impact: 误导新人 · 以为 audit 业务在这里
- Fix approach: 删除目录 · 或迁回主 audit 业务(但 services/admin/audit 已有 forensic-pdf · 不必)

**`apps/api/src/notification/` 空目录占位:**
- Issue: 仅含 `.gitkeep` · 钉钉已在 `services/admin/notifications/`
- Files: `apps/api/src/notification/.gitkeep`
- Impact: 类似 audit/ · 误导
- Fix approach: 删除目录

**主应用 vs admin RLS 实现不一致:**
- Issue: 两种 RLS bypass 写法并存
  - admin: `tx.$executeRawUnsafe("SELECT set_config('app.role', 'admin', true)")`(`apps/api/src/trpc/middleware/admin/adminRLS.ts:11`)
  - 主应用: `tx.$executeRaw\`SET LOCAL ROLE quanqn_app\`` + `tx.$executeRaw\`SELECT set_config('app.current_account_id', ${...}, true)\``(`apps/api/src/trpc/middleware/account-isolation.ts:38-40`)
  - 部分 service 用 `await tx.$executeRawUnsafe("SET LOCAL app.role = 'admin'")`(`apps/api/src/services/admin/cost/detect-anomalies.service.ts:40`)
- Impact: 新人不知该用哪个 · 不一致影响 audit grep(R-A6 grep `$executeRawUnsafe` 红线触发)
- Fix approach: 统一为 `tx.$executeRaw\`SELECT set_config('app.role', 'admin', true)\``(无字符串拼接 · 避 R-A6 grep)

**Specialist 目录双份(`specialists/` vs `agents/specialists/`):**
- Issue: 两处都有 CopywritingAgent / DailyTaskAgent
- Files:
  - `apps/api/src/specialists/CopywritingAgent.ts`(643 行)
  - `apps/api/src/agents/specialists/CopywritingAgent.ts`(?)
  - 同理 DailyTaskAgent
- Impact: 不清谁是 source of truth · import 可能错 · 也容易二改不一致
- Fix approach: 确认 `specialists/` 为主 · 删 `agents/specialists/` · 改 import

## Known Bugs

**audit middleware 写 cross_account_query 失败的边缘 case:**
- Symptoms: 当 ctx.activeAdminUser=null 但 ctx.crossAccountAccessed=true(理论不应发生但代码不阻止)· auditLog middleware 跳过写
- Files: `apps/api/src/trpc/middleware/admin/auditLog.ts:30` `if (ctx.activeAdminUser)`
- Trigger: 假数据 · 不会自然发生
- Workaround: 已正确 · 因为 adminAuth 闸先抛 UNAUTHORIZED · ctx.activeAdminUser 不可能 null 走到 audit

**MFA verify 30 天窗口计算可能边界错误:**
- Symptoms: `staleMs = Date.now() - mfaVerifiedAt.getTime()` · 比 `MFA_STALE_MS` 大才抛 · 等于时 next() 通过(可能想反)
- Files: `apps/api/src/trpc/middleware/admin/mfaCheck.ts:18-21`
- Impact: 边界 1ms 不影响业务 · 但语义上 "30 天有效期" 应该 `staleMs >= MFA_STALE_MS` 抛(strict)
- Fix approach: 改 `>` 为 `>=` · 或文档化语义

**daily-task cron 时区可能错(formatDateYMD 用本机时区):**
- Symptoms: `apps/api/src/cron/daily-task-runner.ts:16-22` formatDateYMD 用 `new Date().getFullYear()` 等本机时区方法
- Impact: server 在非 Asia/Shanghai 时区 · scheduledDate 跟 cron 触发日期不一致
- Files: `apps/api/src/cron/daily-task-runner.ts:16`
- Fix approach: 用 Intl.DateTimeFormat with timeZone 显式 Asia/Shanghai · 或 luxon

**Lucia DatabaseUser 双 cast 用 unknown(类型擦除):**
- Symptoms: `lucia-admin.ts:49` `attributes: adminAttrs as unknown as DatabaseUser['attributes']`
- Impact: 编译期不报错但运行时 luciaAdmin 跟主 lucia Register 类型不一致 · 任何泛函数处理 `lucia.User` 不知它是 admin 还是 main · 拿错字段可能 undefined
- Files: `apps/api/src/lib/auth/lucia-admin.ts:49, 169-176`
- Fix approach: 在 lucia v3 GitHub Issue 跟 · 或重写 admin 不复用 lucia(自管 session)

## Security Considerations

**admin 6 闸顺序硬约束依赖人记:**
- Risk: 新增 middleware 时插错位置 · 顺序破坏即权限漏洞(如把 auditLog 插到 adminRLS 之前 · cross_account_query 检测失效)
- Files: `apps/api/src/trpc/procedures/admin.ts:14-21`(单一定义点)
- Current mitigation: 文件头注释强调 LD-A-chain · 6 middleware 全部 import 自 `@/trpc/middleware/admin`
- Recommendations: 加 AST audit script(AGENTS §10.4.1 提到 `scripts/audit-admin-rls.ts` · 实际未在 `apps/api/scripts/` 找到)

**adminRLS 写 SET LOCAL 用 $executeRawUnsafe:**
- Risk: AGENTS R-A6 红线 grep `$executeRawUnsafe` 应该 0 结果 · 但 admin RLS bypass 必须用
- Files:
  - `apps/api/src/trpc/middleware/admin/adminRLS.ts:11`(cast trick: `tx as unknown as { $executeRawUnsafe: ... }`)
  - `apps/api/src/services/admin/cost/detect-anomalies.service.ts:40`
  - `apps/api/src/services/admin/accounts/anomaly-detection.service.ts:19`
  - `apps/api/src/services/admin/invites/campaign.service.ts:117`
  - `apps/api/src/services/admin/nsm/kpi-snapshot.service.ts:309`
- Current mitigation: 字符串硬编码常量 · 不接受用户输入 · SHIELD 注释标识
- Recommendations: 改为 `tx.$executeRaw\`SELECT set_config('app.role', 'admin', true)\``(template literal 等价 · 不触发 R-A6 grep)· 已在 adminRLS 改了一处但 service 层未改 · 需要扫描统一

**CSV 导出无 Rate Limit:**
- Risk: `/admin/export/users` 流式 500k 行 · 任何 admin role 都可访问 · 无频率限制
- Files: `apps/api/src/trpc/routers/admin/users.ts:156-253` `handleExportUsersCSV`
- Current mitigation: 行数 ≤ 500k 上限 + audit 写
- Recommendations: 加 Upstash ratelimit per-admin · 防 readonly_admin 频繁拉数据集训练外部模型

**OAuth state cookie sameSite='Lax' 不够严格:**
- Risk: 跨站重定向时 state cookie 可被读
- Files: `apps/api/src/index.ts:125, 133` `sameSite: 'Lax'`
- Current mitigation: HttpOnly + secure(prod)+ maxAge 600s
- Recommendations: 改 `'Strict'` 因为 OAuth callback 是回到 同 origin · 不需要跨站发 cookie

**钉钉 webhook URL 不验证 HTTPS:**
- Risk: DINGTALK_WEBHOOK_URL 配 http:// 也接受 · 中间人攻击可篡改告警内容
- Files: `apps/api/src/services/admin/notifications/dingtalk.service.ts:53`
- Current mitigation: 钉钉官方只发 HTTPS · 实际不太可能 · 但代码未校验
- Recommendations: 校验 URL `startsWith('https://')` 在构造函数

**临时 password reset 弱熵:**
- Risk: `randomBytes(8).toString('hex')` = 16 hex chars = 64 bits 熵
- Files: `apps/api/src/trpc/routers/admin/users.ts:517`
- Current mitigation: 用户应该立即改 · 一次性
- Recommendations: 改 32 hex chars(128 bits)· 加过期时间 → password_reset_tokens 表 + 24h expiry

**makePayloadHash 二次实现不一致:**
- Risk: 两个文件分别实现 `makePayloadHash`(`apps/api/src/services/admin/admin-audit-service.ts:31` `apps/api/src/trpc/routers/admin/users.ts:28`)· 后者用于密码 hash(应该 bcrypt!)
- Files: `apps/api/src/trpc/routers/admin/users.ts:518-520` 用 sha256 hash 临时密码作为 passwordHash 存表
- 严重 · 密码 hash 应该用 bcrypt / argon2 · sha256 单向但暴力破解快
- Recommendations: 引入 bcrypt 或 argon2 · 严禁 sha256 当密码 hash

## Performance Bottlenecks

**anomaly-detection.service 内 N+1 query:**
- Problem: 4 类异常检测的每一类都 forEach + `tx.ipAccountAnomalyFlag.findFirst` 串行查 dedupe
- Files: `apps/api/src/services/admin/accounts/anomaly-detection.service.ts:38-61, 78-100, 117-139, 170-196`
- Cause: 单账号粒度去重 · 没 batch 查 / upsert
- 实际影响 · 假设 1000 active accounts × 4 类 = 4000 串行 query · prisma 连接 1 · 单 query ~10ms · 总 40s · 触 60s vitest 超时风险
- Improvement path: 改 `tx.ipAccountAnomalyFlag.findMany({ where: { accountId: { in: [...] }, anomalyType, ... } })` 批量预查 + Set 内存判断

**kpi-snapshot 7 SQL 并行但每条全表扫:**
- Problem: 每 cron 触发都 COUNT(DISTINCT ia.id) FROM ip_accounts · 没 partial index / materialized view
- Files: `apps/api/src/services/admin/nsm/kpi-snapshot.service.ts:79-280`
- Cause: 7 个 $queryRaw 都按 active=true 全表(可能百万行级别)
- 实际影响 · 1k 行级别无感 · 1M 行级别 ~10s 触 60s timeout
- Improvement path: PG materialized view + refresh concurrently · 或冷数据归档

**admin invite batchImport 单行串行 create:**
- Problem: `for (let i ...)` for (let j ...) 内 await `db.inviteCode.create()` 单条插
- Files: `apps/api/src/trpc/routers/admin/invites.ts:228-268`
- Cause: 10000 行 · 单条 ~5ms · 总 50s · vitest 60s 超时风险 + prod 用户等待感
- Improvement path: 用 `db.inviteCode.createMany({ data: [...], skipDuplicates: true })` 批量(prisma 5.x 支持)· 但 createMany 不返每行 id · 错误处理改 unique violation post-hoc 查

**CSV export skip 分页:**
- Problem: `db.user.findMany({ skip, take: 1000 })` 用 OFFSET 分页 · 500k 行最后一页 skip=499000 → seq scan
- Files: `apps/api/src/trpc/routers/admin/users.ts:210-231` 主 + `apps/api/src/trpc/routers/admin/cost.ts:330-364` 也是
- Cause: OFFSET 在大表上 N^2 复杂度
- Improvement path: 改 cursor-based pagination(`orderBy: { id: 'asc' }, take: 1000, where: { id: { gt: lastId } }`)

**$transaction 默认超时 + 大 callback:**
- Problem: anomaly-detection 的 $transaction 内跑 4 类检测 · 单 callback 可能 30s+
- Files: `apps/api/src/services/admin/accounts/anomaly-detection.service.ts:17`
- Cause: prisma $transaction 默认 5s timeout(maxWait)+ 5s timeout(timeout)· 可能因长事务 abort
- Improvement path: `prisma.$transaction(cb, { maxWait: 10000, timeout: 120000 })` 显式设 · 或拆 4 个独立 transaction

## Fragile Areas

**`apps/api/src/trpc/procedures/admin.ts`(6 闸顺序锁):**
- Files: 单文件 14 行 · 极简但 LOAD-BEARING(承载 LD-A2 全部 admin 安全)
- Why fragile: 顺序错 1 个 middleware 即权限漏洞 · 缺一个 middleware 即合规漏洞 · 加新 middleware 必须确认位置
- Safe modification: 必须配合 audit script(AGENTS §10.4.1 提到的 `audit-admin-rls.ts` · 当前缺失)· 任何修改强制走 Opus audit Step 5 闸门
- Test coverage: 集成测试 `tests/integration/admin/middleware-chain.test.ts`(推断 · 实际未确认存在 · 需补)

**`apps/api/src/lib/admin/audit-helpers.ts:redactSensitiveFields`:**
- Files: 单文件 + 复用度极高(`admin-audit-service.ts` / `pdf-bill.service.ts` / `pdf-forensic.service.ts`)
- Why fragile: SENSITIVE_SUBSTRINGS 数组写死(`password, token, apikey, secret, credential, authorization`)· 漏一个就泄露 · 例: `'apikey'` 但实际字段名常是 `'api_key'`(下划线变体)· 当前 isSensitiveKey 用 `.includes` 所以 'api_key' / 'apiKey' 都命中 'apikey' substring
- Safe modification: 加新 substring 时跑全 grep 确认无 false positive(如不想 redact 字段名含 'secret' 但不是 secret)
- Test coverage: 隐式测在 `audit.test.ts` 和 `pdf-bill.test.ts` · 没有专门 audit-helpers.test.ts

**`apps/api/src/services/admin/admin-audit-service.ts:logAdminAction`(LD-A3 唯一入口):**
- Files: 73 行 · 全 admin 业务调
- Why fragile: 幂等检查用 `findFirst({ traceId, eventType })` · 如果同 traceId 内业务先后调 2 次同 eventType(理论不应发生)· 第二次 skip
  - 例: changePlan super_admin 路径同 traceId 调 logAdminAction 两次(eventType=change_user_plan + approval_request_create)· 第二次因 eventType 不同所以仍写 · 但若调代码错写两次 change_user_plan · 第二次静默吞
- Safe modification: 任何调用方加 logAdminAction 前确认 eventType 唯一性 · 或加 (traceId, eventType, payloadHash) 三元组幂等
- Test coverage: 没有专门测幂等行为(同 traceId 重调 skip)

**`apps/api/src/index.ts:start()`(双双 worker spawn + cron register 序):**
- Files: 第 291-331 行
- Why fragile: dev 模式 spawn image-gen + daily-task worker · cron register 必须在 serve 之前(否则 race · serve 接请求时 cron 还没 ready)
- Safe modification: 加新 cron 必须 await 在 `serve()` 之前
- Test coverage: 整 start 流程无独立测试(集成测试 spawn server 兜底)

## Scaling Limits

**Lucia session(admin idle TTL 30min Redis):**
- Current capacity: 取决于 Redis 内存 · 单 admin session ~50 bytes key + value · 1000 admin = 50KB(可忽略)
- Limit: 实际是 active admin user 数(< 100 in 1.0 PRD)
- Scaling path: 不需要扩

**BullMQ admin-kpi-snapshot Queue:**
- Current capacity: concurrency=1 · 每小时一次 daily snapshot
- Limit: kpi-snapshot service 70s timeout → 60s · 单次 ~10s · 容量足
- Scaling path: 若 ip_accounts 表 > 10M · 改增量 / materialized view

**Admin CSV export 500k 行硬上限:**
- Current capacity: `CSV_MAX_EXPORT_ROWS = 500_000`(`apps/api/src/trpc/routers/admin/users.ts:93`)+ `COST_CSV_MAX_ROWS = 500_000`(`apps/api/src/trpc/routers/admin/cost.ts:18`)
- Limit: 内存 streaming 但 OFFSET 分页 → 大 OFFSET N^2 慢
- Scaling path: cursor-based pagination · 或导出预生成异步 job(advanced: 后台跑 + S3 url 返回)

**Prisma 连接池(默认 num_connections=DB_POOL_SIZE 或 5):**
- Current capacity: dev 单进程 ~5 connection
- Limit: 多 BullMQ worker(concurrency=2 image-gen + cron + 用户 tRPC)同时跑可能耗尽连接 · 卡顿
- Scaling path: prod 设 `?connection_limit=20` query param · 或 PgBouncer

**audit_log / admin_audit_log 写吞吐:**
- Current capacity: 单 INSERT ~1ms · prisma 单 connection 上限 ~1000 writes/s
- Limit: cross_account_query 每 admin query 1-2 条 audit · 100 admin × 10 query/min = 1000 写 / min(轻松)
- Scaling path: 1.0 不需要 · 2.0 加 Kafka / outbox pattern

## Dependencies at Risk

**@trpc/server ^11.0.0-rc.0(预发布版本):**
- Risk: 11 版本 release candidate · API 可能变(尤其 fetch adapter / meta 类型)
- Impact: 升级 rc 时全部 router 类型重检
- Migration plan: 锁版本到具体 rc · 等 11.0 stable 后再 bump

**@trpc/server 跟主应用版本:**
- Risk: 主应用 + admin 共用同一 @trpc/server · 两个 initTRPC 实例都依赖
- Impact: 一旦升级 · 同时影响双系统
- Migration plan: 保持 lockstep · CI 跑双系统 typecheck

**bullmq 5.x ↔ ioredis 5.x ↔ Redis ≥ 6.2(getex 命令):**
- Risk: lucia-admin 用 `redis.getex` 需要 Redis ≥ 6.2 · 已用 8.6(本地)· prod 必须确保
- Impact: 旧 Redis (< 6.2) 部署即 fail
- Migration plan: prod ensurance + docker-compose ping version check

**arctic 3.x:**
- Risk: 仍在 active development · API 可能变
- Files: `apps/api/src/lib/auth/providers.ts`
- Impact: OAuth flow 重写
- Migration plan: 锁版本 ^3.7.0 · 升级走 changelog 检查 PKCE / state 接口

**@react-pdf/renderer 4.x:**
- Risk: React PDF 跟 React 18 + react-pdf 4 适配 · 服务端渲染 + Buffer 输出
- Files: `apps/api/src/services/admin/cost/pdf-bill.service.ts:9` + `services/admin/audit/pdf-forensic.service.ts:9`
- Impact: 升级到 5.x 时 renderToBuffer signature 可能变(类型 cast as any 已经在用 · 见 pdf-bill.service.ts:152)
- Migration plan: 锁 ^4.5.1 · 不主动升

## Missing Critical Features

**ApprovalGate 真闭环(PRD-13):**
- Problem: 全部 14 高风险 + 4 dual + 2 emergency 都靠业务 router 手写 stub · middleware 仅 NOT_IMPLEMENTED
- Blocks: 上线时无 approver 二审 / 紧急通道 24h 自动复核
- Recommendations: PRD-13 优先级 P0

**Trending / DeepLearn / Prompts / Quota / Evolution / Config / AB 7 个 admin router:**
- Problem: 全部 placeholder · `adminTrpcRouter({})` 空对象
- Blocks: PRD-12/13/14 业务全部空缺(域 ⑦~⑭ 占 admin 一半)
- Recommendations: PRD-12 落地域 ⑥ ReviewQueue + ⑦ Trending · PRD-13 域 ⑧~⑪ Approval + Prompts + AB · PRD-14 配置 + Emergency

**邮件服务接入(reset password):**
- Problem: 临时密码 console.log · 用户拿不到
- Blocks: admin resetPassword 不可用(只是 print 到 log)
- Recommendations: 1.0 内必接 · 否则 admin 调 resetPassword 等于装样子

**对象存储(S3 / OSS · 头像 + 文件 + PDF 持久化):**
- Problem: PDF export 仅 base64 返回前端 · 不存盘
- Blocks: 长期 audit 取证 PDF 链 + 头像上传 + 用户文件
- Recommendations: PRR 范围(per project CLAUDE.md §7)

**多语言 i18n(中文 only · 但日志和 error 也是中文):**
- Problem: TRPCError message 'unauthenticated' 是英文 · 但 `'请求过大'`(`pdf-forensic.service.ts:157`)是中文 · 不统一
- Blocks: 1.0 仅中文 · 不阻塞 · 但代码字符串中英混杂
- Recommendations: 统一 i18n key + 前端翻译

## Test Coverage Gaps

**集成测试 6 闸 chain 端到端:**
- What's not tested: 真 PG + 真 Lucia + 完整 6 middleware chain · 模拟 ipWhitelist=true + mfaCheck stale 等场景
- Files: 根 `tests/integration/admin/`(实际位置)· apps/api 内未有
- Risk: 单元测试全 mock · 顺序错 / middleware 接口变 不一定被捕捉
- Priority: High

**ipWhitelist middleware 测试稀疏:**
- What's not tested: IPv4-mapped IPv6 归一(`::ffff:192.168.1.1` → `192.168.1.1`)· 多个 CIDR 取交集 · x-forwarded-for 多 hop 取首位
- Files: `apps/api/src/trpc/middleware/admin/ipWhitelist.ts` 没有独立测试文件
- Risk: 实际部署在 CDN 后 · x-forwarded-for 含多 hop · 取错可能漏过 IP
- Priority: High

**mfaCheck 30 天滑动窗口:**
- What's not tested: 边界情况 · mfaVerifiedAt=29d59m → 通过 · 30d1s → 抛
- Files: `apps/api/src/trpc/middleware/admin/mfaCheck.ts` 没有独立测试
- Risk: 时钟漂移 / 时区错乱 · 用户体验差
- Priority: Medium

**Approval Gate stub 行为测试:**
- What's not tested: super_admin 走 auto_executed 路径 vs 普通 admin pending 路径 · approvalRequest 表行内容
- Files: `apps/api/src/trpc/routers/admin/__tests__/users.test.ts`(可能测了 changePlan/banUser · 实际未验证)· accounts.test.ts / invites.test.ts(同)
- Risk: PRD-13 接管 middleware 时业务 router 删 stub · 若 stub 测试缺 · regression 发现晚
- Priority: Medium

**aiVideo / boomGenerate / voiceChat / videoProduction(主应用 router):**
- What's not tested: 24 个主应用 router 中大部分无 __tests__ · 测试集中在 admin
- Files: `apps/api/src/trpc/routers/{aiVideo,boomGenerate,voiceChat,videoProduction,...}.ts`
- Risk: 主应用 24 router · 测试覆盖很低 · 14 Specialist 没有 router-level 测试 · 业务回归靠 e2e
- Priority: Medium(per PRD 主应用域单独 PRD)

**workers integration 测试:**
- What's not tested: BullMQ Queue → Worker → 业务执行端到端 · daily-task fan-out 含多 account
- Files: `apps/api/src/workers/{daily-task,image-gen,llm-gateway,...}/` 无对应 __tests__
- Risk: cron / job 失败兜底逻辑(`worker.on('failed')`)未真测过
- Priority: Medium

**OAuth callback CSRF state mismatch + audit:**
- What's not tested: state cookie 缺失 / 不匹配时 audit 写入 security_alert/oauth_state_mismatch
- Files: `apps/api/src/index.ts:159-177`
- Risk: 静默吞掉 CSRF 检查 audit · 法务取证缺
- Priority: High(安全相关)

---

*Concerns audit: 2026-05-13*
