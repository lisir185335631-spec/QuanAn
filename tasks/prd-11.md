# PRD-11 · P9.1 6 P0 业务核心域

> **版本** · v0.1 seed(2026-05-12 · Coding 3.0 详细度优先 · 派生 ADMIN §3.2 + §3.3 + §4 + §5 + §6 + §7.6 + §8.3 + DATA-MODEL §13 + AGENTS §10)
> **范围** · 22 US · 6 P0 业务核心域(① NSM 仪表盘 · ② 用户管理 · ③ IP 账号管理 · ④ 成本仪表盘 · ⑤ 审计日志查询 · ⑥ 邀请码管理)+ 收官 1 US(packages/ui/admin DenseTable 真实现 + 16 placeholder 替换 + admin-routes 更新 + verify-prd-11.sh)
> **周期** · 3 周(ADMIN §8.3 · 6 域 × 0.5 周 = 3 周)
> **依赖** · PRD-10 P9.0 admin foundation 已 PASSED(commit 697b03e · 14 admin model + RLS DISABLE + 6 闸 middleware + admin_audit_log + Layout + 16 sidebar placeholder + admin-routes.ts metadata-driven · 全就位)
> **后续** · PRD-12 P9.2 2 内容审核域(⑦⑧)· PRD-13 P9.3 5 P1 健康度域(⑨⑩⑪⑫⑬)· PRD-14 P9.4 3 P2 高级域(⑭⑮⑯)
> **派生历史** · PRD-10 retro §10 Playbook P-1~P-7 必做 + N-1~N-3 不做 + E-1~E-3 实验

---

## §0 · 引用清单(必读 · 启动 PRD-11 前)

### §0.1 战略骨架文档

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 1 | `ARCHITECTURE.md` §3.2 业务模型 | 见 ARCHITECTURE | 6 业务核心域跟主应用业务模型对接关系 |
| 2 | `ARCHITECTURE.md` §9.12b 单用户成本估算 $0.45/D · NSM 阈值 | 见 ARCHITECTURE | 域 ④ 成本仪表盘异常告警阈值依据 |
| 3 | `ARCHITECTURE.md` §9.13b TrendingItem 合规方案 A/B | 见 ARCHITECTURE | 域 ⑦(留 PRD-12)铺路 · 本 PRD 不实现但要预留接口 |
| 4 | `ARCHITECTURE.md` §1.4b 主应用 + admin 边界 ADR-019 | 见 ARCHITECTURE | LD-A-1 主 / admin 不互引 |

### §0.2 ADMIN 架构必读章节(P9.1 核心)

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 5 | `ADMIN-ARCHITECTURE.md` §3.2 P0 业务核心 6 域全景 | 423-510 | 6 域字段定义 · 数据来源 / KPI / 鉴权 / UI 骨架 / Prisma 新表(权威源) |
| 6 | `ADMIN-ARCHITECTURE.md` §3.3 P0 核心域共性 | 491-510 | 共性 1 · 三个跨账号查询(②③⑤)走 RLS bypass · 共性 2 · 高风险操作(②⑥)走 Approval · 共性 3 · readonly_admin 2 子模式 |
| 7 | `ADMIN-ARCHITECTURE.md` §4 数据访问与隔离 | 660-917 | adminRLS bypass + 双轨 audit 设计 · admin_audit_log 4 类 eventType |
| 8 | `ADMIN-ARCHITECTURE.md` §5 接口契约 adminRouter | 917-1015 | adminRouter 6 子树(nsm/users/accounts/cost/audit/invites)+ 30+ procedure 签名 |
| 9 | `ADMIN-ARCHITECTURE.md` §6 前端架构 admin SPA | 1015-1269 | admin layout · 16 sidebar 域 · 业务页落位 · 密集模式 row 32px + font 13px |
| 10 | `ADMIN-ARCHITECTURE.md` §7.6 高风险动作清单 | 1269-1460 | 域 ②(改套餐/封禁)+ 域 ⑥(邀请码作废)+ 域 ③(强制冻结)走 Approval Gates trigger stub |
| 11 | `ADMIN-ARCHITECTURE.md` §8.3 P9.1 退出条件 | 1504-1513 | 6 个页面全部展示真实数据 · 改套餐/封禁/邀请码作废走 Approval · 财务导出月度 PDF · 法务 trace 反查 + 取证 |

### §0.3 数据层必读章节

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 12 | `DATA-MODEL.md` §13.1 admin 13 表概览 | 2861-2898 | 4 主表 + 9 辅助表分布(PRD-11 涉及 5 张:kpi_snapshots / ip_account_admin_notes / ip_account_anomaly_flags / invite_campaigns / quota_adjustment_log 一部分 + 6 处复用) |
| 13 | `DATA-MODEL.md` §13.2 admin_audit_log schema | 2899-2964 | PRD-10 已建表 · PRD-11 中间件继续写入 cross_account_query / high_risk_action / data_query 等 eventType |
| 14 | `DATA-MODEL.md` §13.3 approval_requests schema | 2966-3012 | PRD-10 已建表 · PRD-11 触发申请 stub(super_admin 直批 · PRD-13 升级完整审批 UI) |
| 15 | `DATA-MODEL.md` §13.6.A kpi_snapshots | 3155-3185 | 域 ① NSM 预聚合表 · cron 1h 写入 · 解决跨表聚合慢问题 |
| 16 | `DATA-MODEL.md` §13.6.B ip_account_admin_notes + ip_account_anomaly_flags | 3187-3222 | 域 ③ admin 内部备注 + 异常账号跑批标记 |
| 17 | `DATA-MODEL.md` §13.6.C invite_campaigns | 3224-3251 | 域 ⑥ 营销 campaign 元数据 · 关联 invite_codes.campaign tag |
| 18 | `DATA-MODEL.md` §9 RLS 策略集 | 2113-2319 | 主应用 18 表 RLS 强制开 + admin 13 表 RLS DISABLE · LD-A-2 |

### §0.4 设计约束必读章节

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 19 | `AGENTS.md` §3 18 LD | 209-426 | 18 锁定决策 · LD-001~018 全局约束 |
| 20 | `AGENTS.md` §5 17 R 红线 | 805-1175 | 17 红线 · 含 R-001(不暴露 BASE_LLM_URL)/ R-016(视觉违规) |
| 21 | `AGENTS.md` §10 admin 子系统 5 LD-A | 见 AGENTS §10 | LD-A-1 主 / admin 不互引 · LD-A-2 RLS DISABLE 仅 admin · LD-A-3 admin_audit_log append-only · LD-A-4 高风险走 Approval · LD-A-5 readonly_admin 2 子模式 |
| 22 | `AGENTS.md` §4 设计约束 + §6 编码规范 | 426-1175 | 命名约定 / 目录规范 / TypeScript strict / zod 边界校验 |

### §0.5 PRD-10 收官交付物(本 PRD 直接复用)

| # | PRD-10 产出 | 引用方式 |
|:-:|---|---|
| 23 | 14 admin model schema(prisma/schema.prisma)| US-005(users 加 lastLoginAt/lastLoginIp · 不动 admin 表)· US-009(新加 ip_account_admin_notes + ip_account_anomaly_flags 已建空表)· US-019(invite_campaigns 已建空表) |
| 24 | manual_admin_rls.sql 14 admin 表 RLS DISABLE | US-001/003/006/010/012/016/020 全 service 层走 adminRLS bypass(`$transaction + set_config('app.role','admin',true)`)|
| 25 | 6 闸 middleware(adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog)| US-003/006/010/012/016/020 所有 procedure 必经 6 闸 · 顺序硬约束 · 6 闸链 Codebase Pattern 复用 |
| 26 | admin_audit_log 中间件 + 4 eventType | US-003/006/010/012/016/020 procedure 写入 audit · payloadHash SHA-256 防篡改 · redact 敏感字段 · idempotent |
| 27 | apps/admin Layout + 16 sidebar placeholder + admin-routes.ts metadata-driven | US-004/007/011/013/017/021 业务页直接替换 placeholder.tsx · sidebar 不动 · admin-routes.ts metadata.prd 字段更新到 "PRD-11"(P-2 协议 · retro §10 E-1)|
| 28 | packages/ui/admin/{tokens.ts, DenseTable.tsx stub, index.ts}(US-005 建)| US-022 真实现 DenseTable + 业务页用 DenseTable + adminTokens(P-7 复用)|
| 29 | audit-redlines-admin.sh + audit-admin-rls.ts(AST)+ audit-approval-gates.ts + audit-self-test.sh | US-022 verify-prd-11.sh 全部包装(P-3 复用)|
| 30 | progress.txt 7 Codebase Patterns | 全部 US 复用(admin 4 维度隔离 / 6 闸链 / adminRLS LOCAL=true / OAuth multi-layer / audit append-only / 16 sidebar metadata / monorepo 10 步)(P-1 复用)|

---

## §1 · 22 User Stories(分 6 域 + 1 收官)

### 🟦 域 ① · NSM 仪表盘(4 US · US-001~004)

NSM(产品健康度生死线)· 4 大数字(NSM=7 天活跃账号 / 完成 9 步比例 / 反馈率 / 进化升级率)+ 漏斗 + 折线 + 3 饼图 + 告警栏。数据来自 feedback_log + step_data + evolution_profile + users + cost_log + ip_accounts(多表聚合)。架构挑战 · 跨表聚合 SQL 慢 → 必须 kpi_snapshots 预聚合 + cron 1h 写入。

---

#### US-001 · kpi_snapshots schema + 跨表聚合 SQL 设计

**risk_level** · `foundation`(downstream 6 stories · downstream PRD-12 NSM 扩展 + PRD-13 飞轮停滞告警接入 NSM)
**size_hint** · medium
**priority** · 1
**depends_on** · []

**描述** · 作为开发者 · 我需要 kpi_snapshots 表 + 跨表聚合 SQL · 这样 NSM 仪表盘的"4 大数字 + 漏斗 + 折线 + 3 饼图"能从预聚合表查 · 不每次跑跨 6 表 join(40+ s 慢查询)。

**AC**(H 类幸福路径 / E 类错误边界 / B 类后端 / P 类前端):

##### H 幸福路径
- [ ] H-1 · `prisma/schema.prisma` 新增 `model KpiSnapshot` · 字段严格按 DATA-MODEL §13.6.A 行 3155-3185:
  ```prisma
  model KpiSnapshot {
    id                  Int          @id @default(autoincrement())
    snapshotDate        DateTime     @db.Date
    granularity         String       // 'day' | 'week' | 'month'
    activeAccounts7d    Int          // NSM
    step9CompleteRate   Decimal      @db.Decimal(5, 4)
    feedbackRate        Decimal      @db.Decimal(5, 4)
    evolutionUpgradeRate Decimal     @db.Decimal(5, 4)
    d30Retention        Decimal      @db.Decimal(5, 4)
    userPersonaDistribution Json
    industryDistribution Json
    platformDistribution Json
    funnelData          Json
    computedAt          DateTime     @default(now())
    @@unique([snapshotDate, granularity])
    @@index([granularity, snapshotDate(sort: Desc)])
    @@map("kpi_snapshots")
  }
  ```
- [ ] H-2 · 跑 `pnpm prisma migrate dev --name add_kpi_snapshots` · migration 文件含 `CREATE TABLE kpi_snapshots ... + CREATE UNIQUE INDEX ... + CREATE INDEX ...` SQL
- [ ] H-3 · 跑 `pnpm prisma db push` · 表实际建到 `quanan` 数据库 · `psql -d quanan -c '\d kpi_snapshots'` 看到 13 字段 + 2 indexes
- [ ] H-4 · 在 `manual_admin_rls.sql` 加 `ALTER TABLE kpi_snapshots DISABLE ROW LEVEL SECURITY;`(跟其他 14 admin 表一致 · LD-A-2)· 跑 `psql -d quanan -f prisma/migrations/manual_admin_rls.sql`
- [ ] H-5 · 跑 `psql -d quanan -c "SELECT relname, relrowsecurity FROM pg_class WHERE relname='kpi_snapshots'"` · 返回 `kpi_snapshots | f`(RLS OFF · 跟 14 admin 表对齐)
- [ ] H-6 · 在 `apps/api/src/services/admin/nsm/kpi-snapshot.service.ts` 新建跨表聚合 SQL 函数 `computeSnapshot(date: Date, granularity: 'day'|'week'|'month'): Promise<KpiSnapshotData>` · 内部走 adminRLS bypass:
  ```typescript
  // apps/api/src/services/admin/nsm/kpi-snapshot.service.ts
  export async function computeSnapshot(
    date: Date,
    granularity: 'day' | 'week' | 'month',
  ): Promise<KpiSnapshotData> {
    return await prisma.$transaction(async (tx) => {
      // ★ 必经:set_config LOCAL=true · 跟 PRD-10 6 闸链 adminRLS pattern 对齐
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
      // 跨 6 表聚合查询(NSM / step9 / feedbackRate / upgradeRate / D30 / 3 distributions / funnel)
      // ... 实现见 H-7 ~ H-12
    });
  }
  ```
- [ ] H-7 · `computeSnapshot` 内 SQL · `activeAccounts7d`(NSM)· 7 天内 `ip_accounts.lastActiveAt > NOW() - INTERVAL '7 days'` + 该 account 有 ≥ 3 个 `step_data.status='done'` 的 step:
  ```sql
  SELECT COUNT(DISTINCT a.id)
  FROM ip_accounts a
  JOIN step_data s ON s.account_id = a.id
  WHERE a.last_active_at > NOW() - INTERVAL '7 days'
    AND s.status = 'done'
  GROUP BY a.id
  HAVING COUNT(DISTINCT s.step_no) >= 3
  ```
- [ ] H-8 · `step9CompleteRate` · 完成 9 步用户占总用户比例:
  ```sql
  SELECT
    COUNT(DISTINCT CASE WHEN s.step_no = 9 AND s.status = 'done' THEN s.user_id END)::decimal /
    NULLIF(COUNT(DISTINCT u.id), 0) AS rate
  FROM users u
  LEFT JOIN step_data s ON s.user_id = u.id
  ```
- [ ] H-9 · `feedbackRate` · 反馈率(👍/👎 点击 / 生成次数):
  ```sql
  SELECT
    COUNT(*) FILTER (WHERE reaction IN ('up','down'))::decimal /
    NULLIF(COUNT(*), 0) AS rate
  FROM feedback_log
  WHERE created_at > NOW() - INTERVAL '7 days'
  ```
- [ ] H-10 · `evolutionUpgradeRate` · 30 天内新用户升 L2 比例:
  ```sql
  SELECT
    COUNT(DISTINCT CASE WHEN ep.level >= 2 THEN u.id END)::decimal /
    NULLIF(COUNT(DISTINCT u.id), 0) AS rate
  FROM users u
  JOIN evolution_profile ep ON ep.user_id = u.id
  WHERE u.created_at > NOW() - INTERVAL '30 days'
  ```
- [ ] H-11 · `funnelData` · 漏斗 6 阶段 `[register, step1, step3, step3b, step7, feedback]` 数字数组 · 返回 `[N0, N1, N3, N3b, N7, Nfb]`
- [ ] H-12 · `industryDistribution` / `platformDistribution` / `userPersonaDistribution` · 都是 `{ [key]: count }` JSON · 行业 56 类 / 平台 5 类 / 画像 4 类
- [ ] H-13 · `computeSnapshot` 跑完后 `prisma.kpiSnapshot.upsert({ where: { snapshotDate_granularity }, ... })` · 落库 · `@@unique([snapshotDate, granularity])` 防重复

##### E 错误 / 边界
- [ ] E-1 · `date` 参数 > NOW() · 抛 `ValidationError("snapshotDate cannot be in the future")`
- [ ] E-2 · `granularity` 不在 `['day','week','month']` · 抛 `ValidationError("invalid granularity: ${value}, expected day|week|month")`
- [ ] E-3 · 该 `(snapshotDate, granularity)` 已存在 · upsert 走 UPDATE 而非 INSERT · 不抛 duplicate key error
- [ ] E-4 · feedback_log / step_data / evolution_profile 任一表为空 · 对应字段返回 `0.0000`(rate)或 `0`(count)· 不抛 division by zero
- [ ] E-5 · adminRLS bypass 失败(set_config 返回 false)· 抛 `AdminRLSBypassError("set_config app.role failed")` · 不静默跑下去查到 0 行假绿灯
- [ ] E-6 · 跨表聚合 SQL 超时(> 60s)· 抛 `SnapshotComputationTimeout("computeSnapshot exceeded 60s for date=${date}")` · cron 会重试一次

##### B 后端
- [ ] B-1 · `computeSnapshot` 函数标 `# $ money-critical: false`(不涉及金额 · 但要 grep 审计)· 内部 SQL 全用 `prisma.$queryRaw` 防注入 · 参数全用 `Prisma.sql\`...\${...}\``  template literal · **绝对不能**字符串拼接
- [ ] B-2 · `kpi-snapshot.service.ts` 写单元测试 `apps/api/src/services/admin/nsm/__tests__/kpi-snapshot.test.ts` · 覆盖:
  - test 1 · `computeSnapshot('2026-05-11', 'day')` 返回完整 13 字段
  - test 2 · 第二次 upsert 同 (date, granularity) · 返回 UPDATE 不抛 error
  - test 3 · empty feedback_log · `feedbackRate === 0`
  - test 4 · adminRLS bypass 真起作用(查 ip_accounts 全表 · 不受 RLS 限制)
- [ ] B-3 · `pnpm test apps/api/src/services/admin/nsm/__tests__/kpi-snapshot.test.ts` 全部通过(4 test 全绿)
- [ ] B-4 · `pnpm typecheck` · `apps/api/` 0 error · KpiSnapshotData type 严格定义 · 不允许 `any`
- [ ] B-5 · audit-admin-rls-tables.sh 列表新加 `"kpi_snapshots"` · `pnpm audit:admin-rls-tables` 实跑 · 看到 `kpi_snapshots | RLS OFF | ✓` (关 TD-039/042 类 audit drift)

##### P 前端
- [ ] P-1 · 本 US 无前端 · 但 packages/schemas 需补 zod schema `apps/api/src/schemas/admin/nsm.schema.ts`:
  ```typescript
  // apps/api/src/schemas/admin/nsm.schema.ts
  import { z } from 'zod';

  export const kpiSnapshotSchema = z.object({
    snapshotDate: z.date(),
    granularity: z.enum(['day', 'week', 'month']),
    activeAccounts7d: z.number().int().nonnegative(),
    step9CompleteRate: z.number().min(0).max(1),
    feedbackRate: z.number().min(0).max(1),
    evolutionUpgradeRate: z.number().min(0).max(1),
    d30Retention: z.number().min(0).max(1),
    userPersonaDistribution: z.record(z.string(), z.number().int()),
    industryDistribution: z.record(z.string(), z.number().int()),
    platformDistribution: z.record(z.string(), z.number().int()),
    funnelData: z.array(z.number().int()).length(6),
    computedAt: z.date(),
  });
  export type KpiSnapshotData = z.infer<typeof kpiSnapshotSchema>;
  ```
- [ ] P-2 · `pnpm prisma generate` 后 · `KpiSnapshot` 自动出现在 `node_modules/.prisma/client/index.d.ts` · `apps/api/src/services/admin/nsm/kpi-snapshot.service.ts` import 不报错
- [ ] P-3 · Typecheck 全过 · `pnpm typecheck` 0 error

**files_to_create** ·
- `prisma/migrations/2026XXXXXXXXXX_add_kpi_snapshots/migration.sql`
- `apps/api/src/services/admin/nsm/kpi-snapshot.service.ts`
- `apps/api/src/services/admin/nsm/__tests__/kpi-snapshot.test.ts`
- `apps/api/src/schemas/admin/nsm.schema.ts`

**files_to_modify** ·
- `prisma/schema.prisma`(+ KpiSnapshot model)
- `prisma/migrations/manual_admin_rls.sql`(+ ALTER TABLE kpi_snapshots DISABLE ROW LEVEL SECURITY)
- `scripts/audit-admin-rls-tables.sh`(+ "kpi_snapshots")

**anti_patterns**(注入 ralph dev prompt · 防 reject):
1. **adminRLS bypass 漏 LOCAL=true** · 反例 `tx.$executeRawUnsafe("SET app.role = 'admin'")`(global · 会泄漏到下次连接复用)· 正例 `tx.$executeRawUnsafe("SET LOCAL app.role = 'admin'")`(only this transaction · PRD-1 reject 案例 + PRD-10 US-003 reject 案例)
2. **跨表聚合 SQL 拼字符串** · 反例 `tx.$queryRawUnsafe(\`SELECT COUNT(*) FROM users WHERE id = ${userId}\`)` · 正例 `tx.$queryRaw\`SELECT COUNT(*) FROM users WHERE id = ${userId}\`` template literal · PRD-1 US-006 SQL 注入 reject 教训
3. **不写 audit-admin-rls-tables.sh 列表** · 漏加新表名 → 后续 PRD audit drift 累积 → TD-039/042 复现 · PRD-10 retro M-3 教训

---

#### US-002 · kpi-snapshot.service · cron 1h 聚合 + Bull queue

**risk_level** · medium
**size_hint** · medium
**priority** · 2
**depends_on** · ["US-001"]

**描述** · 作为运维 · 我需要 cron 每 1 小时跑 `computeSnapshot('today', 'day')` 自动聚合 · 这样 NSM 仪表盘加载时直接读 kpi_snapshots 表 · 不每次实时跑 6 表聚合(40s 慢查询)。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/jobs/admin/kpi-snapshot.job.ts` 新建 cron job 注册:
  ```typescript
  import { Queue, Worker } from 'bullmq';
  import { redis } from '../../shared/redis';
  import { computeSnapshot } from '../../services/admin/nsm/kpi-snapshot.service';

  export const kpiSnapshotQueue = new Queue('admin:kpi-snapshot', { connection: redis });

  export const kpiSnapshotWorker = new Worker('admin:kpi-snapshot', async (job) => {
    const { date, granularity } = job.data as { date: string; granularity: 'day' | 'week' | 'month' };
    await computeSnapshot(new Date(date), granularity);
  }, { connection: redis });

  // 每 1 小时跑当日 daily snapshot
  export async function scheduleDailySnapshot() {
    await kpiSnapshotQueue.add('compute-daily', {
      date: new Date().toISOString().slice(0, 10),
      granularity: 'day',
    }, {
      repeat: { pattern: '0 * * * *' }, // 每小时整点
      jobId: 'daily-snapshot-recurring',
    });
  }

  // 每周一 04:00 跑过去一周 weekly snapshot
  export async function scheduleWeeklySnapshot() {
    await kpiSnapshotQueue.add('compute-weekly', {
      date: new Date().toISOString().slice(0, 10),
      granularity: 'week',
    }, {
      repeat: { pattern: '0 4 * * 1' },
      jobId: 'weekly-snapshot-recurring',
    });
  }

  // 每月 1 号 04:00 跑过去一月 monthly snapshot
  export async function scheduleMonthlySnapshot() {
    await kpiSnapshotQueue.add('compute-monthly', {
      date: new Date().toISOString().slice(0, 10),
      granularity: 'month',
    }, {
      repeat: { pattern: '0 4 1 * *' },
      jobId: 'monthly-snapshot-recurring',
    });
  }
  ```
- [ ] H-2 · `apps/api/src/server.ts` 在启动时调用 `scheduleDailySnapshot()` + `scheduleWeeklySnapshot()` + `scheduleMonthlySnapshot()` 注册 cron(BullMQ 自动持久化)
- [ ] H-3 · 启动 api · `pnpm dev` · 看 log 包含 `[bullmq] admin:kpi-snapshot worker started` + `daily-snapshot-recurring registered`
- [ ] H-4 · `psql -d quanan -c "SELECT * FROM kpi_snapshots WHERE snapshot_date = CURRENT_DATE AND granularity='day'"` · 1h 后看到当日 snapshot(测试时可手动 `kpiSnapshotQueue.add('compute-daily', {...})` 立即跑)

##### E 错误 / 边界
- [ ] E-1 · cron 失败(SQL 超时 / DB 断连)· BullMQ `attempts: 3` 自动重试 3 次 · 第 3 次失败写 `failed` 队列 · admin_audit_log 记录 `eventCategory='system_alert', eventType='kpi_snapshot_failed'`
- [ ] E-2 · 重复触发(double-fire)· `jobId: 'daily-snapshot-recurring'` 唯一约束防重 · BullMQ 自动去重
- [ ] E-3 · Redis 断连(开发期常见)· worker 自动重连 + 当时丢失的触发由下一周期补
- [ ] E-4 · 单次跑超 60s · 抛 `SnapshotComputationTimeout` · 不阻塞后续 job

##### B 后端
- [ ] B-1 · 单元测试 `apps/api/src/jobs/admin/__tests__/kpi-snapshot.job.test.ts` · 覆盖:
  - test 1 · `scheduleDailySnapshot()` 注册成功 · `kpiSnapshotQueue.getRepeatableJobs()` 包含 daily-snapshot-recurring
  - test 2 · worker 处理 job 调 `computeSnapshot` · spy on computeSnapshot 被调一次
  - test 3 · job failed 3 次 后进 failed queue · `kpiSnapshotQueue.getFailed()` 返回该 job
- [ ] B-2 · `pnpm test apps/api/src/jobs/admin/__tests__/kpi-snapshot.job.test.ts` 全过
- [ ] B-3 · Typecheck 0 error
- [ ] B-4 · `pnpm audit:redlines-admin` 实跑 0 命中(adminRLS bypass · cron 不漏)

##### P 前端
- [ ] P-1 · 本 US 无前端 · 但要在 `apps/admin/src/pages/nsm/index.tsx`(US-004)读 kpi_snapshots · 此处略

**files_to_create** ·
- `apps/api/src/jobs/admin/kpi-snapshot.job.ts`
- `apps/api/src/jobs/admin/__tests__/kpi-snapshot.job.test.ts`

**files_to_modify** ·
- `apps/api/src/server.ts`(+ scheduleDailySnapshot / Weekly / Monthly 调用)

**anti_patterns**:
1. **cron pattern 漏写时区** · 反例 `pattern: '0 * * * *'`(默认 UTC · 中国凌晨 8 点 = UTC 0 点 = 16 个时区跨度乱)· 正例 `pattern: '0 * * * *', tz: 'Asia/Shanghai'`(显式时区)· PRD-9 US-018 reject 教训
2. **double-fire / 重复注册** · 漏 `jobId` 唯一约束 → server 重启时再注册 → 1h 跑 2 次 → kpi_snapshots 重复 upsert(虽 unique 约束防数据错 · 但 SQL 浪费)· 必须 `jobId` 显式

---

#### US-003 · adminRouter.nsm 5 procedure(getOverview / getFunnel / getDistributions / getAlerts / triggerSnapshot)

**risk_level** · high
**size_hint** · medium
**priority** · 3
**depends_on** · ["US-001", "US-002"]

**描述** · 作为前端开发者 · 我需要 adminRouter.nsm 子树 5 个 procedure · 能从 kpi_snapshots 读 NSM 仪表盘需要的所有数据(顶部 4 数字 / 漏斗 / 折线 / 3 饼图 / 告警栏)· 全部走 6 闸 middleware + audit append-only。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/trpc/routers/admin/nsm.ts` 新建 5 procedure:
  ```typescript
  import { z } from 'zod';
  import { router, publicAdminProcedure } from '../../core';
  import { prisma } from '../../../shared/prisma';

  export const nsmRouter = router({
    /**
     * 顶部 4 大数字 + d30 留存 + 1 日前后对比 · 用最新 daily snapshot
     */
    getOverview: publicAdminProcedure
      .input(z.object({
        granularity: z.enum(['day', 'week', 'month']).default('day'),
      }))
      .query(async ({ ctx, input }) => {
        return await prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
          const latest = await tx.kpiSnapshot.findFirst({
            where: { granularity: input.granularity },
            orderBy: { snapshotDate: 'desc' },
          });
          if (!latest) {
            return null;
          }
          const previous = await tx.kpiSnapshot.findFirst({
            where: {
              granularity: input.granularity,
              snapshotDate: { lt: latest.snapshotDate },
            },
            orderBy: { snapshotDate: 'desc' },
          });
          return {
            current: latest,
            previous,
          };
        });
      }),

    /**
     * 漏斗数据 · funnelData 数组(注册 → step1 → step3 → step3b → step7 → feedback)
     */
    getFunnel: publicAdminProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        granularity: z.enum(['day', 'week', 'month']),
      }))
      .query(async ({ ctx, input }) => { /* ... */ }),

    /**
     * 3 大饼图分布(行业 / 平台 / 用户画像)
     */
    getDistributions: publicAdminProcedure
      .input(z.object({
        date: z.string(),
        granularity: z.enum(['day', 'week', 'month']),
      }))
      .query(async ({ ctx, input }) => { /* ... */ }),

    /**
     * 告警栏 · 任一 NSM 指标连续 3 天恶化 → 钉钉推送列表
     */
    getAlerts: publicAdminProcedure
      .query(async ({ ctx }) => {
        return await prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
          // 查最近 3 天 daily snapshot · 看 NSM 是否连续恶化
          const last3 = await tx.kpiSnapshot.findMany({
            where: { granularity: 'day' },
            orderBy: { snapshotDate: 'desc' },
            take: 3,
          });
          // ... 算各指标 trending → 返回 [{metric, severity, deltaPct, ...}]
        });
      }),

    /**
     * 手动触发 snapshot 重算(super_admin 才能)
     */
    triggerSnapshot: publicAdminProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        granularity: z.enum(['day', 'week', 'month']),
      }))
      .mutation(async ({ ctx, input }) => {
        // 鉴权 · super_admin 才能手动触发
        if (ctx.session.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const { computeSnapshot } = await import('../../../services/admin/nsm/kpi-snapshot.service');
        await computeSnapshot(new Date(input.date), input.granularity);
        return { ok: true };
      }),
  });
  ```
- [ ] H-2 · `apps/api/src/trpc/routers/admin/index.ts` 把 `nsm: nsmRouter` 加到 adminRouter 子树
- [ ] H-3 · 6 闸 middleware 全经过:adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → auditLog(顺序不可调换 · 跟 PRD-10 6 闸链 pattern 对齐)
- [ ] H-4 · audit-redlines-admin.sh 跑过(0 命中):
  - 不暴露 `BASE_LLM_URL` / `LLM_API_KEY`(R-001)
  - 6 闸顺序检查:`adminAuth.*roleCheck.*ipWhitelist.*mfaCheck.*adminRLS.*auditLog`
  - admin_audit_log 写入 4 eventType 至少出现一次

##### E 错误 / 边界
- [ ] E-1 · 未登录 admin 调 procedure · 6 闸 adminAuth 拦截 · 返回 401 + audit 记录 `auth_failed`
- [ ] E-2 · 非 super_admin 调 triggerSnapshot · 返回 403 FORBIDDEN + audit 记录 `privilege_escalation_attempt`
- [ ] E-3 · `date` 不符 ISO date format · zod 校验返回 400 + 详细错误信息
- [ ] E-4 · kpi_snapshots 表为空(初次启动 · cron 未跑过)· getOverview 返回 `null` · 前端处理空状态
- [ ] E-5 · 跨 PRD 集成 · admin_audit_log 写入 payloadHash SHA-256(防篡改)+ redact `payload.password` / `payload.token` 等敏感字段(LD-A-3 admin 审计 append-only · 不能删 / 不能改 / 但可用 redact)

##### B 后端
- [ ] B-1 · 5 procedure 全部走 `publicAdminProcedure`(已含 6 闸 middleware · 跟 PRD-10 createCaller 对齐 · LD-A-2 / LD-A-3)
- [ ] B-2 · audit-admin-rls.ts(AST)跑过 · `npx tsx scripts/audit-admin-rls.ts` 返回 `Checked 10 procedures` ≥ 5 nsm procedure 全识别
- [ ] B-3 · 单元测试 `apps/api/src/trpc/routers/admin/__tests__/nsm.test.ts` 5 个 procedure 各覆盖:
  - test 1 · getOverview 返回最新 daily snapshot
  - test 2 · getFunnel 返回正确 funnelData 数组(长度 6)
  - test 3 · getDistributions 返回 3 个 distribution JSON
  - test 4 · getAlerts 连续 3 天恶化时返回 alert
  - test 5 · triggerSnapshot · super_admin 调成功 · admin 调返回 403
- [ ] B-4 · `pnpm test apps/api/src/trpc/routers/admin/__tests__/nsm.test.ts` 全过(5 test 全绿)
- [ ] B-5 · Typecheck 0 error · zod schema 输入 / 输出严格定义

##### P 前端
- [ ] P-1 · packages/clients/admin 导出 `trpc.admin.nsm.getOverview` 等 5 procedure type(自动通过 tRPC v11 inference)· 不需手写
- [ ] P-2 · 5 procedure 全部命中 packages/schemas zod 校验 · 前端不再二次校验

**files_to_create** ·
- `apps/api/src/trpc/routers/admin/nsm.ts`
- `apps/api/src/trpc/routers/admin/__tests__/nsm.test.ts`

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`(+ nsm: nsmRouter)

**anti_patterns**:
1. **6 闸顺序错** · 反例 `ipWhitelist → adminAuth`(顺序倒)· 正例 `adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → auditLog`(顺序硬约束 · PRD-10 US-003 reject 教训 · 6 闸链 Codebase Pattern)
2. **直接用 prisma.kpiSnapshot.findFirst 不走 transaction** · 反例直接查 → 漏 adminRLS bypass → RLS 限制返回 0 行(其实 kpi_snapshots 是 DISABLE RLS · 但 service 层统一模式 LD-A-2)· 正例 `$transaction` + `SET LOCAL app.role = 'admin'`
3. **audit 写入漏 redact 敏感字段** · 反例 payload 完整 dump · 正例 redact `password` / `token` / `apiKey` / `secret` 字段(LD-A-3 admin 审计 append-only · 但 redact 必做防 GDPR 泄漏)

---

#### US-004 · NSM UI page(4 数字 + 漏斗 + 折线 + 3 饼图 + 告警栏 · Recharts)

**risk_level** · high
**size_hint** · medium
**priority** · 4
**depends_on** · ["US-003"]

**描述** · 作为运营 / 财务 · 我需要打开 admin.quanan.com/nsm 看 4 大数字(NSM / 完成 9 步 / 反馈率 / 升级率)+ 漏斗图 + 分日折线 + 3 饼图(行业 / 平台 / 用户画像)+ 右侧告警栏 · 数据从 adminRouter.nsm 5 procedure 拿。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/admin/src/pages/nsm/index.tsx` 替换 PRD-10 US-007 建的 placeholder.tsx · 实现完整 NSM 仪表盘 page:
  ```tsx
  import { trpc } from '../../lib/trpc';
  import { NsmOverviewCards } from './NsmOverviewCards';
  import { NsmFunnel } from './NsmFunnel';
  import { NsmDistributions } from './NsmDistributions';
  import { NsmAlerts } from './NsmAlerts';

  export default function NsmDashboard() {
    const overview = trpc.admin.nsm.getOverview.useQuery({ granularity: 'day' });
    const distributions = trpc.admin.nsm.getDistributions.useQuery({
      date: new Date().toISOString().slice(0, 10),
      granularity: 'day',
    });
    const funnel = trpc.admin.nsm.getFunnel.useQuery({ ... });
    const alerts = trpc.admin.nsm.getAlerts.useQuery();

    return (
      <div className="grid grid-cols-[1fr_320px] gap-6 p-6">
        <div className="space-y-6">
          <NsmOverviewCards data={overview.data} loading={overview.isLoading} />
          <NsmFunnel data={funnel.data} loading={funnel.isLoading} />
          <NsmDistributions data={distributions.data} loading={distributions.isLoading} />
        </div>
        <NsmAlerts data={alerts.data} loading={alerts.isLoading} />
      </div>
    );
  }
  ```
- [ ] H-2 · `apps/admin/src/pages/nsm/NsmOverviewCards.tsx` 顶部 4 大数字卡片:NSM(7d 活跃账号)/ 完成 9 步比例 / 反馈率 / 进化升级率 · 每张卡片含 [数字 + 单位 + 上日比对 +/- N%]
- [ ] H-3 · `apps/admin/src/pages/nsm/NsmFunnel.tsx` 漏斗图(横向 6 阶段)· 用 Recharts `<FunnelChart>` 组件 · 6 阶段 [Register, Step1, Step3, Step3b, Step7, Feedback]
- [ ] H-4 · `apps/admin/src/pages/nsm/NsmDistributions.tsx` 3 饼图并排 · 行业(56 类 · 取 Top 10 + Other)/ 平台(5 类:抖音 / 小红书 / B 站 / 视频号 / 快手)/ 用户画像(4 类:IP 起号者 / OPC / 转型者 / MCN)
- [ ] H-5 · `apps/admin/src/pages/nsm/NsmAlerts.tsx` 右侧告警栏 · 显示连续 3 天恶化指标列表 · 每条 [metric, severity:high/medium/low, deltaPct, 操作:钉钉推送状态]
- [ ] H-6 · admin-routes.ts metadata 更新 · nsm 路由的 `prd` 字段从 `"PRD-10 placeholder"` 改成 `"PRD-11"`:
  ```typescript
  {
    path: '/nsm',
    label: 'NSM 仪表盘',
    icon: 'TrendingUp',
    pageId: 'nsm',
    metadata: { prd: 'PRD-11', priority: 'P0' },
  }
  ```

##### E 错误 / 边界
- [ ] E-1 · API 拉取失败(网络断 / 服务挂)· 显示 ErrorBoundary fallback "数据加载失败 · 点击重试" · 不白屏
- [ ] E-2 · kpi_snapshots 表为空(初次启动)· NsmOverviewCards 显示 skeleton placeholder + "等待首次聚合(每小时自动)" 提示文字 + super_admin 看到"手动触发" 按钮
- [ ] E-3 · 跨账号 cross_account_query 不在本页(NSM 只查 kpi_snapshots 一表 · 不涉及 user / account)· 但 admin_audit_log 仍记录 `eventType='data_query', targetEntity='kpi_snapshots'`
- [ ] E-4 · readonly_admin 财务模式查 NSM · 隐藏"手动触发" 按钮 · 只显示 [overview + cards + distributions]
- [ ] E-5 · 4 个 useQuery 并发 · React Query 自动 deduplication · 不重复发请求

##### B 后端
- [ ] B-1 · 本 US 无新后端代码 · 全部从 US-003 procedure 拿
- [ ] B-2 · admin_audit_log 写入(每次打开 NSM 页 trigger 4 procedure 调用 · 都会写 audit)· `pnpm audit:admin-rls-tables` 实跑 0 命中(kpi_snapshots / admin_audit_log RLS DISABLE 都对)

##### P 前端
- [ ] P-1 · `cd apps/admin && pnpm dev` 启动 · 浏览器打开 `http://localhost:5174/admin/nsm` · 用 agent-browser 访问:
  - 看到顶部 4 张数字卡片 + 单位 + 上日对比 (上下绿/红箭头)
  - 看到中部漏斗图(6 阶段)+ 数字标注每阶段流失率
  - 看到中下部 3 饼图并排(行业 / 平台 / 用户画像)· 每片 hover 显示数字 + 占比
  - 看到右侧告警栏(可能为空 · 显示"暂无告警")
- [ ] P-2 · 浏览器开发者工具 · Network tab 看到 4 个 tRPC 请求:`admin.nsm.getOverview` / `admin.nsm.getFunnel` / `admin.nsm.getDistributions` / `admin.nsm.getAlerts` · 全部 status 200
- [ ] P-3 · 浏览器 console 0 error / 0 warning(不容忍 React key warning · 不容忍 missing dependency 警告)
- [ ] P-4 · `getComputedStyle(document.documentElement).getPropertyValue('--bg-base')` 返回 Aurelian Dark 色值(非空字符串)· tokens.css 已 import
- [ ] P-5 · 密集模式 · 数字卡片用 13px font · row height 32px · 跟 PRD-10 packages/ui/admin/tokens.ts 一致
- [ ] P-6 · super_admin 切换 day / week / month granularity dropdown · NSM 数据自动刷新
- [ ] P-7 · 刷新页面后 · auth 状态保持(lucia-auth admin session 还在 · localStorage cookie 都 OK)· NSM 数据再次正确加载
- [ ] P-8 · agent-browser 截图 `apps/admin/screenshots/nsm-prd11.png`(给后续 PRD 对比 visual regression)

**files_to_create** ·
- `apps/admin/src/pages/nsm/NsmOverviewCards.tsx`
- `apps/admin/src/pages/nsm/NsmFunnel.tsx`
- `apps/admin/src/pages/nsm/NsmDistributions.tsx`
- `apps/admin/src/pages/nsm/NsmAlerts.tsx`
- `apps/admin/src/pages/nsm/index.tsx`(替换 placeholder)

**files_to_modify** ·
- `apps/admin/src/lib/admin-routes.ts`(更新 nsm 路由 metadata.prd = "PRD-11")
- 删 `apps/admin/src/pages/nsm/placeholder.tsx`(若存在 · PRD-10 US-007 建的 16 占位文件之一)

**anti_patterns**:
1. **Recharts <FunnelChart> 不显示数据** · 反例 `data` 数据格式错 · 正例 `[{ name: 'Register', value: N0, fill: 'var(--accent-purple)' }]` · 每条必含 `fill` color · PRD-6 US-025 reject 教训
2. **不更新 admin-routes.ts metadata.prd** · 反例 sidebar 标 "PRD-10 placeholder" · 正例改成 "PRD-11" · 影响后续 retro audit · PRD-10 E-1 协议
3. **删 placeholder.tsx 漏了** · 反例放任 placeholder.tsx + nsm/index.tsx 同存 · 正例显式删 placeholder.tsx · git diff 应该看到 1 个 delete 操作

---

### 🟦 域 ② · 用户管理(4 US · US-005~008)

用户管理是 admin 入口流量最大的页面。列表 + 详情 5 Tab(基本 / 活跃度 / 成本 / 审计 / 关联账号)+ 改套餐 / 封禁(走 Approval Gates stub)/ 重置密码 / 强制下线 / CSV 导出。共性 1 · 跨账号查询走 RLS bypass + 共性 2 · 改套餐 / 封禁走 Approval(LD-A-4)。

---

#### US-005 · users 表 lastLogin 字段 + 4 indexes

**risk_level** · medium
**size_hint** · small
**priority** · 5
**depends_on** · []

**描述** · 作为开发者 · 我需要 users 表加 `lastLoginAt` + `lastLoginIp` 字段 + 4 个 admin 用查询 index(role, plan, industry, lastLoginAt)· 这样用户管理 (US-007) 列表能高效筛选。

**AC**:

##### H 幸福路径
- [ ] H-1 · `prisma/schema.prisma` 在 `model User` 加 2 字段:
  ```prisma
  model User {
    // ... existing fields
    lastLoginAt   DateTime?
    lastLoginIp   String?   @db.VarChar(45)
    // ... existing fields

    @@index([role])
    @@index([plan])
    @@index([industry])
    @@index([lastLoginAt(sort: Desc)])
  }
  ```
- [ ] H-2 · `pnpm prisma migrate dev --name add_user_lastlogin_indexes` · migration 文件含 `ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP, ADD COLUMN last_login_ip VARCHAR(45);` + 4 个 `CREATE INDEX`
- [ ] H-3 · `psql -d quanan -c '\d users'` 看到新字段 + 4 indexes
- [ ] H-4 · 既有用户 · `last_login_at IS NULL` · 不抛 NOT NULL 约束(允许 nullable · 渐进采集)
- [ ] H-5 · users 表仍 RLS ON(主应用 18 表 RLS 强制 · LD-A-2)· 跑 `psql -d quanan -c "SELECT relname, relrowsecurity FROM pg_class WHERE relname='users'"` · 返回 `users | t`(RLS ON)
- [ ] H-6 · auth middleware 内每次成功登录 · 更新 `lastLoginAt = NOW()`, `lastLoginIp = ctx.req.ip`:
  ```typescript
  // apps/api/src/middleware/auth.ts(US-005 修改)
  if (loginSuccess) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ctx.req.ip },
    });
  }
  ```

##### E 错误 / 边界
- [ ] E-1 · 既有用户 lastLoginAt IS NULL · 在 users 列表中按 lastLoginAt 排序时显示"从未登录" · 不抛 null pointer
- [ ] E-2 · lastLoginIp 输入是 IPv6 · 长度 ≤ 45 · 不抛 SQL truncation
- [ ] E-3 · update 失败(用户已被删 / DB 断连)· auth middleware 不阻塞登录流程 · log warning + 继续

##### B 后端
- [ ] B-1 · 单元测试 `apps/api/src/middleware/__tests__/auth-lastlogin.test.ts`:
  - test 1 · login 成功 · lastLoginAt 更新
  - test 2 · login 失败 · lastLoginAt 不更新
  - test 3 · IPv4 ip 字符串写入正确
  - test 4 · IPv6 ip 字符串写入正确
- [ ] B-2 · `pnpm test apps/api/src/middleware/__tests__/auth-lastlogin.test.ts` 全过
- [ ] B-3 · `pnpm typecheck` 0 error · User type 加 lastLoginAt + lastLoginIp 字段(prisma generate 自动)
- [ ] B-4 · `pnpm audit:redlines-admin` 跑过 0 命中

##### P 前端
- [ ] P-1 · 本 US 无前端 · 但 packages/schemas/user.schema.ts 更新 zod schema 加 lastLoginAt / lastLoginIp(optional)

**files_to_modify** ·
- `prisma/schema.prisma`(+ 2 fields + 4 indexes on User)
- `apps/api/src/middleware/auth.ts`(+ 登录成功更新 lastLogin)
- `packages/schemas/user.schema.ts`(+ lastLoginAt / lastLoginIp optional)

**files_to_create** ·
- `prisma/migrations/2026XXXXXXXXXX_add_user_lastlogin_indexes/migration.sql`
- `apps/api/src/middleware/__tests__/auth-lastlogin.test.ts`

**anti_patterns**:
1. **lastLoginIp 字段不限长度** · 反例 `lastLoginIp String?`(无 db type · 默认 TEXT)· 正例 `lastLoginIp String? @db.VarChar(45)`(IPv6 最长 45 字符)· PRD-1 US-002 reject 案例
2. **auth update 失败阻塞登录** · 反例 `await prisma.user.update({...})` 没 try/catch · 正例 catch 后 log warning + continue · 用户体验优先

---

#### US-006 · adminRouter.users 5 procedure(list / detail / changePlan / banUser / resetPassword)

**risk_level** · high
**size_hint** · medium
**priority** · 6
**depends_on** · ["US-005"]

**描述** · 作为前端开发者 · 我需要 adminRouter.users 5 个 procedure · 列表(分页 + 搜索 + 多维筛选)+ 详情(5 Tab 数据并行拉)+ 改套餐(走 Approval stub)+ 封禁(走 Approval stub)+ 重置密码(自动生成 + 邮件发送 stub)。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/trpc/routers/admin/users.ts` 5 procedure 完整实现:
  ```typescript
  export const usersRouter = router({
    list: publicAdminProcedure
      .input(z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(50),
        search: z.string().optional(), // email / openId / userId
        roleFilter: z.enum(['user', 'admin', 'all']).optional(),
        planFilter: z.enum(['free', 'pro', 'enterprise', 'all']).optional(),
        industryFilter: z.string().optional(),
        sortBy: z.enum(['createdAt', 'lastLoginAt', 'plan']).default('createdAt'),
        sortDir: z.enum(['asc', 'desc']).default('desc'),
      }))
      .query(async ({ ctx, input }) => {
        return await prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
          // 跨账号查 users 表(走 RLS bypass · 共性 1)
          const where = buildWhere(input); // 解析 search / filters
          const [users, total] = await Promise.all([
            tx.user.findMany({ where, skip: (input.page - 1) * input.pageSize, take: input.pageSize, orderBy: { [input.sortBy]: input.sortDir } }),
            tx.user.count({ where }),
          ]);
          // 写 cross_account_query audit(共性 1)
          await writeAuditLog(ctx, {
            eventCategory: 'cross_account_query',
            eventType: 'list_users',
            targetEntity: 'users',
            payload: { filters: input, count: users.length },
          });
          return { users, total, page: input.page, pageSize: input.pageSize };
        });
      }),

    detail: publicAdminProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        return await prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
          // 5 Tab 数据并行拉:基本 + 活跃度 + 成本 + 审计 + 关联账号
          const [user, ipAccounts, recentCosts, recentAuditLogs, stepProgress] = await Promise.all([
            tx.user.findUnique({ where: { id: input.userId }, include: { evolutionProfile: true } }),
            tx.ipAccount.findMany({ where: { userId: input.userId } }),
            tx.costLog.aggregate({
              where: { userId: input.userId, createdAt: { gte: oneMonthAgo() } },
              _sum: { costUsd: true },
              _count: true,
            }),
            tx.auditLog.findMany({ where: { userId: input.userId }, orderBy: { createdAt: 'desc' }, take: 100 }),
            tx.stepData.findMany({ where: { userId: input.userId }, orderBy: { stepNo: 'asc' } }),
          ]);
          await writeAuditLog(ctx, {
            eventCategory: 'cross_account_query',
            eventType: 'view_user_detail',
            targetUserId: input.userId,
            payload: {},
          });
          return { user, ipAccounts, recentCosts, recentAuditLogs, stepProgress };
        });
      }),

    changePlan: publicAdminProcedure
      .input(z.object({
        userId: z.number().int().positive(),
        newPlan: z.enum(['free', 'pro', 'enterprise']),
        reason: z.string().min(10).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        // ★ 高风险动作 · 必走 Approval Gates(共性 2)
        // PRD-11 阶段 · super_admin 直批 stub · PRD-13 升级完整审批 UI
        if (ctx.session.role === 'super_admin') {
          // super_admin 直批 stub
          const updated = await prisma.user.update({ where: { id: input.userId }, data: { plan: input.newPlan } });
          // 写 approval_requests + audit
          const approval = await prisma.approvalRequest.create({
            data: {
              requesterAdminId: ctx.session.adminUserId,
              requesterRole: 'super_admin',
              actionType: 'change_user_plan',
              actionPayload: input,
              riskLevel: 'medium',
              requesterReason: input.reason,
              status: 'auto_executed', // super_admin 直批
              decisionReason: '[stub] super_admin auto-approve · PRD-13 升级完整审批 UI',
              approverAdminId: ctx.session.adminUserId,
              decidedAt: new Date(),
              executedAt: new Date(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30d
            },
          });
          await writeAuditLog(ctx, {
            eventCategory: 'high_risk_action',
            eventType: 'change_user_plan',
            targetUserId: input.userId,
            payload: { oldPlan: updated.plan, newPlan: input.newPlan, reason: input.reason },
            approvalRequestId: approval.id,
          });
          return { ok: true, approvalRequestId: approval.id };
        } else {
          // admin · 提申请 · 状态 pending
          const approval = await prisma.approvalRequest.create({
            data: {
              requesterAdminId: ctx.session.adminUserId,
              requesterRole: 'admin',
              actionType: 'change_user_plan',
              actionPayload: input,
              riskLevel: 'medium',
              requesterReason: input.reason,
              status: 'pending',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
            },
          });
          await writeAuditLog(ctx, {
            eventCategory: 'high_risk_action',
            eventType: 'request_change_user_plan',
            targetUserId: input.userId,
            payload: input,
            approvalRequestId: approval.id,
          });
          return { ok: true, approvalRequestId: approval.id, status: 'pending' };
        }
      }),

    banUser: publicAdminProcedure
      .input(z.object({
        userId: z.number().int().positive(),
        reason: z.string().min(10).max(500),
        durationDays: z.number().int().positive().max(365).optional(), // null = 永久
      }))
      .mutation(async ({ ctx, input }) => {
        // 同上 · 走 Approval Gates(super_admin 直批 stub)
        // riskLevel 'high'(封禁影响用户权益)· requireDualApproval=true(2 人审批)
        // PRD-11 阶段 stub · super_admin 单批 · PRD-13 升级 dual approval
        // ...
      }),

    resetPassword: publicAdminProcedure
      .input(z.object({
        userId: z.number().int().positive(),
        reason: z.string().min(10).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        // 生成临时密码 · 写 DB · 邮件 stub(log only)
        // 写 audit · medium 风险 · 不走 Approval(用户自己也能改)
        // ...
      }),
  });
  ```
- [ ] H-2 · `apps/api/src/trpc/routers/admin/index.ts` 把 `users: usersRouter` 加到 adminRouter 子树
- [ ] H-3 · `apps/api/src/services/admin/audit.service.ts` `writeAuditLog(ctx, params)` 写 admin_audit_log · 含 payloadHash SHA-256 + redact 敏感字段
- [ ] H-4 · `apps/api/src/services/admin/approval.service.ts` super_admin 直批 stub 流程封装

##### E 错误 / 边界
- [ ] E-1 · admin (非 super_admin) 改套餐 · 走申请 · 返回 `{ status: 'pending' }` · UI 显示"已提交 · 等审批"
- [ ] E-2 · readonly_admin 调 changePlan / banUser · 6 闸 roleCheck 拦截 · 返回 403 + audit 记录 privilege_escalation
- [ ] E-3 · 改套餐到当前已有套餐(plan 不变)· 抛 `ValidationError("user is already on plan ${plan}")`
- [ ] E-4 · banUser 用户已 banned · 抛 `ValidationError("user is already banned, use updateBanReason instead")`
- [ ] E-5 · resetPassword 给已被删除用户 · 抛 `NotFoundError("user not found")`
- [ ] E-6 · payloadHash SHA-256 防篡改 · 计算用 redact 后的 payload(密码 / token 等敏感字段 redact 后再 hash)

##### B 后端
- [ ] B-1 · 5 procedure 全部走 6 闸 middleware(顺序硬约束)
- [ ] B-2 · audit-approval-gates.ts AST 跑过 · 5 高风险 mutation(changePlan / banUser)全部识别为带 Approval Gates · 返回 `Checked 7 procedures with approval gate, 0 missing`(PRD-10 5 + PRD-11 新增 2)
- [ ] B-3 · 单元测试 `apps/api/src/trpc/routers/admin/__tests__/users.test.ts` 覆盖 25+ test case:
  - list · 分页 / 搜索 / 各 filter / 排序
  - detail · 5 Tab 数据并行
  - changePlan · super_admin 直批 / admin 提申请
  - banUser · 同上
  - resetPassword · 临时密码生成
  - 鉴权各边界(super_admin / admin / readonly_admin)
- [ ] B-4 · `pnpm test apps/api/src/trpc/routers/admin/__tests__/users.test.ts` 全过(25+ test 全绿)
- [ ] B-5 · Typecheck 0 error

##### P 前端
- [ ] P-1 · packages/clients/admin 导出 trpc.admin.users.list / detail / changePlan / banUser / resetPassword type(自动 inference)
- [ ] P-2 · 本 US 无 UI 改动 · UI 在 US-007 实现

**files_to_create** ·
- `apps/api/src/trpc/routers/admin/users.ts`
- `apps/api/src/trpc/routers/admin/__tests__/users.test.ts`
- `apps/api/src/services/admin/audit.service.ts`(若 PRD-10 没建 · audit-log 写入封装)
- `apps/api/src/services/admin/approval.service.ts`(super_admin 直批 stub 封装)

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`(+ users: usersRouter)
- `scripts/audit-approval-gates.ts`(+ users.changePlan / users.banUser EXCEPTION 列表)

**anti_patterns**:
1. **changePlan 不走 Approval** · 反例直接 `prisma.user.update({...})` · 正例必经 Approval Gates flow · 共性 2 LD-A-4 + ADR-016 · 高风险动作清单 §7.6
2. **audit 写入 payloadHash 漏 redact** · 反例 `JSON.stringify(payload)` 含原文 password · 正例 redact 后 hash · 防 admin_audit_log 泄漏 GDPR
3. **detail 5 Tab 串行查** · 反例 `await tx.user...; await tx.ipAccount...; ...`(5 次顺序查询 5s+)· 正例 `await Promise.all([...])` 并行(< 200ms)
4. **list 用 prisma 默认 RLS** · 反例不走 `$transaction + set_config` · 返回 0 行假绿灯(users 表 RLS ON · 主应用 user 视角看不到他人)· 正例必经 adminRLS bypass

---

#### US-007 · 用户管理 UI page(列表 + 5 Tab 详情抽屉 + Approval trigger UI)

**risk_level** · high
**size_hint** · medium
**priority** · 7
**depends_on** · ["US-006"]

**描述** · 作为运营 / 客服 · 我需要打开 admin.quanan.com/users 看用户列表(分页 + 搜索 + 多维筛选 + 排序 + CSV 导出按钮)+ 点用户行打开右侧抽屉看 5 Tab 详情(基本 / 活跃度 / 成本 / 审计 / 关联账号)+ 改套餐 / 封禁 / 重置密码按钮(走 Approval stub UI)。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/admin/src/pages/users/index.tsx` 替换 placeholder · 实现完整用户管理 page:
  ```tsx
  import { trpc } from '../../lib/trpc';
  import { DenseTable } from '@quanan/ui-admin';
  import { UserDetailDrawer } from './UserDetailDrawer';
  import { UserListFilters } from './UserListFilters';

  export default function UsersPage() {
    const [filters, setFilters] = useState<UsersListFilters>({ page: 1, pageSize: 50 });
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const list = trpc.admin.users.list.useQuery(filters);

    return (
      <div className="flex flex-col gap-4 p-6">
        <UsersOverviewCards data={list.data} />
        <UserListFilters value={filters} onChange={setFilters} />
        <DenseTable
          columns={[
            { key: 'id', label: 'ID', width: 80 },
            { key: 'email', label: '邮箱', width: 240 },
            { key: 'plan', label: '套餐', width: 100, render: (v) => <PlanBadge plan={v} /> },
            { key: 'industry', label: '行业', width: 140 },
            { key: 'lastLoginAt', label: '最近登录', width: 160, render: formatDate },
            { key: 'actions', label: '操作', render: (_, row) => <UserActions user={row} /> },
          ]}
          data={list.data?.users ?? []}
          loading={list.isLoading}
          onRowClick={(row) => setSelectedUserId(row.id)}
        />
        <UserDetailDrawer
          userId={selectedUserId}
          open={selectedUserId !== null}
          onClose={() => setSelectedUserId(null)}
        />
      </div>
    );
  }
  ```
- [ ] H-2 · `apps/admin/src/pages/users/UserListFilters.tsx` 多维筛选 · 角色 / 套餐 / 行业 / 注册时间 / 活跃度
- [ ] H-3 · `apps/admin/src/pages/users/UserDetailDrawer.tsx` 5 Tab 详情抽屉:
  - Tab 1 · 基本信息 · email / role / plan / createdAt / lastLoginAt / lastLoginIp / 邀请码来源
  - Tab 2 · 活跃度 · 9 步进度可视化(横向 bar)+ 反馈分布饼图 + 最近 30 天活跃日历
  - Tab 3 · 成本 · cost_log 月度图(分日折线)+ Top 5 Specialist 横向 bar
  - Tab 4 · 审计时间线 · audit_log 最近 100 条(分类高亮)
  - Tab 5 · 关联账号 · ip_accounts 列表(进化 level + stage + lastActiveAt)
- [ ] H-4 · `apps/admin/src/pages/users/ChangePlanDialog.tsx` 改套餐弹窗 · plan dropdown + reason 文本框 + 提交 → 调 trpc.admin.users.changePlan
- [ ] H-5 · `apps/admin/src/pages/users/BanUserDialog.tsx` 封禁弹窗 · reason 文本框 + durationDays 输入(可选 · 留空 = 永久)+ 提交 → 调 trpc.admin.users.banUser
- [ ] H-6 · `apps/admin/src/pages/users/ResetPasswordDialog.tsx` 重置密码弹窗 · reason + 提交 → 显示新密码(临时一次性)
- [ ] H-7 · admin-routes.ts metadata.prd 更新 users 路由 = "PRD-11"

##### E 错误 / 边界
- [ ] E-1 · 列表为空(filter 太严)· DenseTable 显示空状态 "未找到匹配用户 · 调整筛选条件"
- [ ] E-2 · API 拉取失败 · ErrorBoundary fallback · 不白屏
- [ ] E-3 · 改套餐到当前已有套餐 · 提交前禁用按钮 + 提示 "已在 ${plan} 套餐"
- [ ] E-4 · admin (非 super_admin) 改套餐 · 提交后显示 "已提交 · 等 super_admin 审批" + 跳转到 Approval 申请列表
- [ ] E-5 · readonly_admin 财务 / 法务模式 · 隐藏改套餐 / 封禁 / 重置密码按钮 · 只看列表 + 详情
- [ ] E-6 · 抽屉打开 5 Tab 并行加载 · React Query Suspense + skeleton placeholder

##### B 后端
- [ ] B-1 · 本 US 无新后端 · 全部从 US-006 procedure 拿

##### P 前端
- [ ] P-1 · `cd apps/admin && pnpm dev` 启动 · 浏览器 agent-browser 打开 `http://localhost:5174/admin/users`:
  - 看到顶部 [总用户 / 活跃 / 付费 / 风险] 4 张数字卡片
  - 看到列表表格(20+ 行 · 6 列)+ 分页器
  - 看到筛选栏 [搜索 + 5 dropdown]
- [ ] P-2 · 在搜索框输入 "test@" · 列表实时筛选 · API 请求 `admin.users.list` debounce 300ms
- [ ] P-3 · 点击某用户行 · 右侧抽屉打开 · 5 Tab 全部 visible(顶部 Tab 按钮)· 默认 Tab 1 基本信息
- [ ] P-4 · 切到 Tab 2 活跃度 · 看到 9 步 progress bar + 反馈饼图 + 30 天日历
- [ ] P-5 · 切到 Tab 3 成本 · 看到月度折线 + Top 5 Specialist
- [ ] P-6 · 切到 Tab 4 审计 · 看到时间线最近 100 条 audit
- [ ] P-7 · 切到 Tab 5 关联账号 · 看到 ip_accounts 列表
- [ ] P-8 · 点 [改套餐] 按钮 · 弹窗打开 · 选 "pro" + 输入 reason "本人申请升级" + 提交
- [ ] P-9 · 提交后 · toast 显示 "改套餐成功"(super_admin)或 "已提交等审批"(admin)
- [ ] P-10 · 再次打开抽屉看 Tab 1 · plan 字段已更新到 pro
- [ ] P-11 · 点 [封禁] 按钮 · 弹窗打开 · 输入 reason + 不输 durationDays · 提交
- [ ] P-12 · 提交后 · toast 显示 + 列表中用户状态 [banned] · plan badge 变红
- [ ] P-13 · 点 [重置密码] 按钮 · 弹窗确认 · 提交后显示新临时密码(可复制)
- [ ] P-14 · console 0 error · Network 看到 trpc 请求列表
- [ ] P-15 · 刷新页面 · 列表 + 抽屉状态恢复(URL params 保存 page / filters)
- [ ] P-16 · DenseTable virtualScroll(超过 50 行)· 滚动流畅 60fps · 用 packages/ui/admin DenseTable 真实现

**files_to_create** ·
- `apps/admin/src/pages/users/index.tsx`(替换 placeholder)
- `apps/admin/src/pages/users/UsersOverviewCards.tsx`
- `apps/admin/src/pages/users/UserListFilters.tsx`
- `apps/admin/src/pages/users/UserDetailDrawer.tsx`
- `apps/admin/src/pages/users/tabs/BasicTab.tsx`
- `apps/admin/src/pages/users/tabs/ActivityTab.tsx`
- `apps/admin/src/pages/users/tabs/CostTab.tsx`
- `apps/admin/src/pages/users/tabs/AuditTab.tsx`
- `apps/admin/src/pages/users/tabs/AccountsTab.tsx`
- `apps/admin/src/pages/users/ChangePlanDialog.tsx`
- `apps/admin/src/pages/users/BanUserDialog.tsx`
- `apps/admin/src/pages/users/ResetPasswordDialog.tsx`
- `apps/admin/src/pages/users/PlanBadge.tsx`

**files_to_modify** ·
- `apps/admin/src/lib/admin-routes.ts`(users metadata.prd = "PRD-11")
- 删 `apps/admin/src/pages/users/placeholder.tsx`(若存在)

**anti_patterns**:
1. **DenseTable 用 div 假 table** · 反例自己撸 div + grid layout · 正例用 packages/ui/admin DenseTable(虚拟滚动 + 列宽自定义 + 排序回调 一体)
2. **抽屉 5 Tab 内 useQuery 同步** · 反例 Tab 切换才发 query · 正例抽屉打开就并行发 5 个 query(React Query auto-dedupe)
3. **Approval 申请后不显示状态** · 反例 toast 显示 "成功" 误导 admin 以为已生效 · 正例显示 "已提交 · pending 审批" + 跳转到 申请列表

---

#### US-008 · users CSV export(stream + chunk · 防 100k 用户 OOM)

**risk_level** · medium
**size_hint** · small
**priority** · 8
**depends_on** · ["US-006"]

**描述** · 作为运营 · 我需要 [CSV 导出] 按钮 · 把当前筛选 后的用户列表(可能 100k+ 行)导出 CSV 文件 · 后端 stream + chunk 防 OOM。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/trpc/routers/admin/users.ts` 新增 mutation `exportCsv`:
  ```typescript
  exportCsv: publicAdminProcedure
    .input(z.object({
      filters: z.object({ /* 同 list */ }),
    }))
    .mutation(async function* ({ ctx, input }) {
      // 走 RLS bypass + 写 audit
      // 用 prisma stream + Node stream Pipe 到 client(content-type: text/csv)
      // ...
    }),
  ```
- [ ] H-2 · 前端 trigger · 点击 [导出 CSV] 按钮 · 调 trpc + 用 `fetch('/api/admin/users/export', {...})` 拿 stream · 触发浏览器 download
- [ ] H-3 · CSV header · `id,email,plan,industry,role,createdAt,lastLoginAt,banned`
- [ ] H-4 · 文件名 · `users-export-2026-05-12T15-30-00.csv`(ISO timestamp)
- [ ] H-5 · 100k+ 行 · 内存峰值 < 200MB(用 chunk size 1000 · 不一次性 load 全部)
- [ ] H-6 · 写 admin_audit_log · `eventCategory='export', eventType='export_users_csv', payload={filterSummary, rowCount}`

##### E 错误 / 边界
- [ ] E-1 · 导出 100 行(空 filter 极少结果)· CSV 正常生成 · 不抛 error
- [ ] E-2 · 导出 500k+ 行(超大数据)· 后端拒绝 + 返回 `ValidationError("export rows > 500000, please narrow filters")`(防 abuse)
- [ ] E-3 · 网络断开中途 · 浏览器自动 fail · 后端 stream 不锁定连接
- [ ] E-4 · readonly_admin 财务模式 · 允许导出
- [ ] E-5 · CSV 含特殊字符(逗号 / 引号 / 换行)· 自动 escape · `"value, with comma"`

##### B 后端
- [ ] B-1 · 单元测试 stream chunk 正确 + memory 控制
- [ ] B-2 · Typecheck 0 error
- [ ] B-3 · `pnpm audit:admin-rls-tables` 跑过 0 命中

##### P 前端
- [ ] P-1 · 浏览器 agent-browser 打开 users page · 点 [CSV 导出] 按钮
- [ ] P-2 · 浏览器自动 download `users-export-*.csv` · 文件可打开 + 内容正确
- [ ] P-3 · 导出过程中 · UI 显示 "导出中 · 100 / 5000 行" 进度提示(可选)
- [ ] P-4 · console 0 error

**files_to_create** ·
- `apps/api/src/trpc/routers/admin/__tests__/users-export.test.ts`

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/users.ts`(+ exportCsv procedure)
- `apps/admin/src/pages/users/index.tsx`(+ [CSV 导出] 按钮)

**anti_patterns**:
1. **不分 chunk 一次性 load 100k 行** · 反例 `prisma.user.findMany({})` 全 load → OOM · 正例 prisma stream + chunk size 1000
2. **CSV 字段不 escape 特殊字符** · 反例直接拼字符串 → 含逗号字段破坏列 · 正例 `papaparse` 库或手撸 escape

---

### 🟦 域 ③ · IP 账号管理(3 US · US-009~011)

跨账号搜索 + 行业/平台/阶段分布 + 异常账号识别后台跑批(连续 7 天活跃但 0 反馈 / 进化停滞 / 多账号同 user 频繁切换)+ 跨账号操作走 RLS bypass + 强制冻结走 Approval Gates。

---

#### US-009 · ip_account_admin_notes + ip_account_anomaly_flags schema + 异常跑批 service

**risk_level** · medium
**size_hint** · medium
**priority** · 9
**depends_on** · []

**描述** · 作为开发者 · 我需要 2 张 IP 账号管理辅助表(admin 备注 + 异常 flag)+ 异常跑批 service(每天凌晨 5:00 跑) · 这样 US-010/011 能复用。

**AC**:

##### H 幸福路径
- [ ] H-1 · `prisma/schema.prisma` 加 `IpAccountAdminNote` + `IpAccountAnomalyFlag` 2 model(严格按 DATA-MODEL §13.6.B):
  ```prisma
  model IpAccountAdminNote {
    id                  Int          @id @default(autoincrement())
    accountId           Int
    adminId             Int
    note                String       @db.Text
    visibleToOtherAdmin Boolean      @default(true)
    createdAt           DateTime     @default(now())
    @@index([accountId, createdAt(sort: Desc)])
    @@index([adminId])
    @@map("ip_account_admin_notes")
  }

  model IpAccountAnomalyFlag {
    id                  Int          @id @default(autoincrement())
    accountId           Int
    anomalyType         String       // 'inactive_no_feedback' | 'evolution_stalled' | 'frequent_account_switch' | 'cost_spike'
    detectedAt          DateTime     @default(now())
    severity            String       // 'low' | 'medium' | 'high'
    evidence            Json
    resolvedAt          DateTime?
    resolvedByAdminId   Int?
    resolution          String?      // 'false_positive' | 'admin_action' | 'auto_resolved'
    @@index([accountId])
    @@index([anomalyType, detectedAt(sort: Desc)])
    @@index([severity, resolvedAt])
    @@map("ip_account_anomaly_flags")
  }
  ```
- [ ] H-2 · `pnpm prisma migrate dev --name add_ip_account_admin_tables` · 2 表 + 5 indexes 全 create
- [ ] H-3 · `manual_admin_rls.sql` 加 `ALTER TABLE ip_account_admin_notes DISABLE ROW LEVEL SECURITY; ALTER TABLE ip_account_anomaly_flags DISABLE ROW LEVEL SECURITY;` 
- [ ] H-4 · `apps/api/src/services/admin/accounts/anomaly-detection.service.ts` 跑批 service:
  ```typescript
  export async function detectAccountAnomalies(): Promise<{ detected: number }> {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
      let detected = 0;

      // 1. inactive_no_feedback · 连续 7 天活跃但 0 反馈
      const inactiveAccounts = await tx.$queryRaw<Array<{ accountId: number }>>`
        SELECT a.id AS "accountId"
        FROM ip_accounts a
        WHERE a.last_active_at > NOW() - INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM feedback_log f
          WHERE f.account_id = a.id
          AND f.created_at > NOW() - INTERVAL '7 days'
        )
      `;
      for (const acc of inactiveAccounts) {
        await tx.ipAccountAnomalyFlag.create({
          data: {
            accountId: acc.accountId,
            anomalyType: 'inactive_no_feedback',
            severity: 'low',
            evidence: { detectedAt: new Date(), reason: '7 天活跃 0 反馈' },
          },
        });
        detected++;
      }

      // 2. evolution_stalled · 7 天无新 insight
      // 3. frequent_account_switch · 多账号同 user 频繁切换
      // 4. cost_spike · 单账号 cost 突增
      // ... 详见 implementation

      return { detected };
    });
  }
  ```
- [ ] H-5 · `apps/api/src/jobs/admin/anomaly-detection.job.ts` cron 注册每天 05:00:
  ```typescript
  await accountAnomalyQueue.add('detect-anomalies', {}, {
    repeat: { pattern: '0 5 * * *', tz: 'Asia/Shanghai' },
    jobId: 'anomaly-detection-recurring',
  });
  ```
- [ ] H-6 · 启动 api · 启动后看 log `[bullmq] admin:account-anomaly worker started`

##### E 错误 / 边界
- [ ] E-1 · 重复跑批同一天 · `ip_account_anomaly_flags` 去重(per accountId × anomalyType × 当日)· 不抛 duplicate
- [ ] E-2 · 已 resolved 的 anomaly · 不再 detect(WHERE resolvedAt IS NULL)
- [ ] E-3 · 跑批 service 跑超 60s · 抛 timeout · 不阻塞 cron 下次

##### B 后端
- [ ] B-1 · 单元测试 4 种 anomaly type · 各 detect 正确
- [ ] B-2 · `pnpm test` 全过
- [ ] B-3 · `pnpm audit:admin-rls-tables` 加 ip_account_admin_notes + ip_account_anomaly_flags · 0 命中

##### P 前端
- [ ] P-1 · 无前端 · UI 在 US-011

**files_to_create** ·
- `apps/api/src/services/admin/accounts/anomaly-detection.service.ts`
- `apps/api/src/services/admin/accounts/__tests__/anomaly-detection.test.ts`
- `apps/api/src/jobs/admin/anomaly-detection.job.ts`
- `prisma/migrations/2026XXXXXXXXXX_add_ip_account_admin_tables/migration.sql`

**files_to_modify** ·
- `prisma/schema.prisma`(+ 2 model)
- `prisma/migrations/manual_admin_rls.sql`(+ 2 ALTER TABLE)
- `apps/api/src/server.ts`(+ scheduleAnomalyDetection())
- `scripts/audit-admin-rls-tables.sh`(+ 2 表名)

**anti_patterns**:
1. **detect 重复跑 dedupe 漏** · 反例每天跑批每天插一遍 · 正例 unique key 去重(accountId + type + dateOfDay)
2. **跑批 service 不走 transaction** · 反例 多条插入不在事务 · 部分成功部分失败 · 正例全包 transaction

---

#### US-010 · adminRouter.accounts 6 procedure(list / detail / flag / unflag / addNote / forceFreeze)

**risk_level** · high
**size_hint** · medium
**priority** · 10
**depends_on** · ["US-009"]

**描述** · 作为前端开发者 · 我需要 6 个 procedure 实现跨账号搜索 + 详情 + 异常 flag 操作 + 强制冻结(走 Approval Gates stub)+ 备注管理。模式参考 US-006 · 跨账号查询 + 6 闸 + audit 写入。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/trpc/routers/admin/accounts.ts` `list` procedure:
  ```typescript
  list: publicAdminProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(100).default(50),
      search: z.string().optional(), // industry / platform / level / userId / accountId
      industryFilter: z.string().optional(),
      platformFilter: z.enum(['douyin', 'xiaohongshu', 'bilibili', 'shipinhao', 'kuaishou', 'all']).optional(),
      levelFilter: z.number().int().min(1).max(5).optional(),
      stageFilter: z.string().optional(),
      anomalyOnly: z.boolean().default(false),
      sortBy: z.enum(['lastActiveAt', 'createdAt', 'level']).default('lastActiveAt'),
      sortDir: z.enum(['asc', 'desc']).default('desc'),
    }))
    .query(async ({ ctx, input }) => {
      return await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        const where = buildAccountWhere(input); // ★ 共性 1 · 跨账号 RLS bypass
        const [accounts, total] = await Promise.all([
          tx.ipAccount.findMany({
            where,
            skip: (input.page - 1) * input.pageSize,
            take: input.pageSize,
            orderBy: { [input.sortBy]: input.sortDir },
            include: {
              evolutionProfile: { select: { level: true, stage: true } },
              user: { select: { id: true, email: true, plan: true } },
              _count: { select: { anomalyFlags: { where: { resolvedAt: null } } } },
            },
          }),
          tx.ipAccount.count({ where }),
        ]);
        // ★ 共性 1 · cross_account_query audit
        await writeAuditLog(ctx, {
          eventCategory: 'cross_account_query',
          eventType: 'list_ip_accounts',
          targetEntity: 'ip_accounts',
          payload: { filters: input, count: accounts.length },
        });
        return { accounts, total, page: input.page, pageSize: input.pageSize };
      });
    })
  ```
- [ ] H-2 · `detail` procedure · 6 表并行查(Promise.all)· 含 9 步进度 + 进化档案 + 最近 history + 关联用户 + admin_notes + anomaly_flags:
  ```typescript
  detail: publicAdminProcedure
    .input(z.object({ accountId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        const [account, stepProgress, evolutionProfile, recentHistory, adminNotes, anomalyFlags] = await Promise.all([
          tx.ipAccount.findUnique({ where: { id: input.accountId }, include: { user: true } }),
          tx.stepData.findMany({ where: { accountId: input.accountId }, orderBy: { stepNo: 'asc' } }),
          tx.evolutionProfile.findUnique({ where: { accountId: input.accountId }, include: { insights: { take: 20, orderBy: { createdAt: 'desc' } } } }),
          tx.history.findMany({ where: { accountId: input.accountId }, orderBy: { createdAt: 'desc' }, take: 50 }),
          tx.ipAccountAdminNote.findMany({ where: { accountId: input.accountId }, orderBy: { createdAt: 'desc' }, include: { admin: { select: { email: true } } } }),
          tx.ipAccountAnomalyFlag.findMany({ where: { accountId: input.accountId, resolvedAt: null }, orderBy: { detectedAt: 'desc' } }),
        ]);
        await writeAuditLog(ctx, {
          eventCategory: 'cross_account_query',
          eventType: 'view_ip_account_detail',
          targetAccountId: input.accountId,
          payload: {},
        });
        return { account, stepProgress, evolutionProfile, recentHistory, adminNotes, anomalyFlags };
      });
    })
  ```
- [ ] H-3 · `flag` procedure · admin 手动标记异常 · 写 `ip_account_anomaly_flags` + medium 风险 audit · 不走 Approval(reviewer 模式即可)
- [ ] H-4 · `unflag` procedure · admin 解决 anomaly · 更新 `resolvedAt = NOW()` + `resolvedByAdminId` + `resolution in ['false_positive', 'admin_action', 'auto_resolved']` + medium 风险 audit
- [ ] H-5 · `addNote` procedure · 写 `ip_account_admin_notes` · visibleToOtherAdmin 字段(默认 true · 防 internal-only 备注)· low 风险 audit
- [ ] H-6 · `forceFreeze` procedure ★ · 高风险动作 · 走 Approval Gates stub(super_admin 直批 · 同 US-006 changePlan 模式)· 写 approval_requests `actionType='force_freeze_account'` + audit `eventCategory='high_risk_action'`:
  ```typescript
  forceFreeze: publicAdminProcedure
    .input(z.object({
      accountId: z.number().int().positive(),
      reason: z.string().min(10).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const account = await prisma.ipAccount.findUnique({ where: { id: input.accountId } });
      if (!account) throw new TRPCError({ code: 'NOT_FOUND' });
      if (account.frozenAt) throw new ValidationError('account already frozen');
      if (ctx.session.role === 'super_admin') {
        // super_admin 直批 stub · 同 US-006 模式
        const approval = await prisma.approvalRequest.create({ data: { /* ... auto_executed */ } });
        await prisma.ipAccount.update({ where: { id: input.accountId }, data: { frozenAt: new Date(), frozenByAdminId: ctx.session.adminUserId, freezeReason: input.reason } });
        await writeAuditLog(ctx, { eventCategory: 'high_risk_action', eventType: 'force_freeze_account', targetAccountId: input.accountId, payload: { reason: input.reason }, approvalRequestId: approval.id });
        return { ok: true, approvalRequestId: approval.id };
      } else {
        // admin 提申请 · pending 状态 · 等 super_admin 审
        const approval = await prisma.approvalRequest.create({ data: { /* ... pending */ } });
        return { ok: true, approvalRequestId: approval.id, status: 'pending' };
      }
    })
  ```
- [ ] H-7 · 6 procedure 全部走 6 闸 middleware(顺序 adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → auditLog · 跟 PRD-10 一致)
- [ ] H-8 · audit-approval-gates.ts EXCEPTION 列表加 `accounts.forceFreeze` · 跑 `pnpm audit:approval-gates` · `Checked 8 high-risk procedures, 0 missing approval gate`(PRD-10 5 + PRD-11 + 3 新 = 8)

##### E 错误 / 边界
- [ ] E-1 · 已冻结账号再 forceFreeze · 抛 `ValidationError("account already frozen")` + audit 记录 `freeze_attempt_on_frozen_account`
- [ ] E-2 · admin (非 super_admin) forceFreeze · 走申请 + 返回 `{ status: 'pending' }` · UI 显示 "已提交 · 等 super_admin 审批"
- [ ] E-3 · readonly_admin 调 flag / unflag / addNote / forceFreeze · 6 闸 roleCheck 拦截 · 返回 403 + audit 记录 privilege_escalation_attempt
- [ ] E-4 · `accountId` 不存在 · 6 procedure 全部抛 `NotFoundError("account not found: id=${id}")` · 不 silent 返回 null
- [ ] E-5 · `flag` 重复标同 `(accountId, anomalyType)` 当日 · 检测 unique(accountId + anomalyType + DATE(detectedAt))· 抛 `ValidationError("anomaly already flagged for this account today")`
- [ ] E-6 · `unflag` 给已 resolved 的 anomaly · 抛 `ValidationError("anomaly already resolved")` · 防重复操作

##### B 后端
- [ ] B-1 · 6 procedure 全部走 `publicAdminProcedure`(已含 6 闸 + adminRLS bypass · 跟 US-006 pattern 一致)
- [ ] B-2 · audit-admin-rls.ts AST 跑过 · `npx tsx scripts/audit-admin-rls.ts` 返回 `Checked 16+ procedures` ≥ PRD-10 5 nsm + PRD-11 5 users + 6 accounts 全识别
- [ ] B-3 · 单元测试 `apps/api/src/trpc/routers/admin/__tests__/accounts.test.ts` 覆盖 30+ test case:
  - list · 各 filter 组合 · 跨账号查 RLS bypass 真起作用
  - detail · 6 表并行 + 关联 include 正确
  - flag / unflag · 重复 dedupe + 已 resolved 拒绝
  - addNote · visibleToOtherAdmin 字段
  - forceFreeze · super_admin 直批 / admin 提申请
  - readonly_admin / non-admin 各边界
- [ ] B-4 · `pnpm test apps/api/src/trpc/routers/admin/__tests__/accounts.test.ts` 全过(30+ test 全绿)
- [ ] B-5 · `pnpm typecheck` 0 error · zod schema 输入 / 输出严格定义 · 不允许 any

##### P 前端
- [ ] P-1 · 本 US 无前端代码 · UI 在 US-011 实现
- [ ] P-2 · packages/clients/admin 自动导出 `trpc.admin.accounts.list / detail / flag / unflag / addNote / forceFreeze` type(tRPC v11 inference)

**files_to_create** ·
- `apps/api/src/trpc/routers/admin/accounts.ts`
- `apps/api/src/trpc/routers/admin/__tests__/accounts.test.ts`

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`(+ accounts: accountsRouter)
- `scripts/audit-approval-gates.ts`(+ accounts.forceFreeze EXCEPTION)
- `prisma/schema.prisma`(+ IpAccount.frozenAt / frozenByAdminId / freezeReason 3 字段 · 若 PRD-10 没建)

**anti_patterns**:
1. **forceFreeze 漏 Approval Gates** · 反例直接 `prisma.ipAccount.update({frozenAt: NOW()})` · 漏 approval_requests + audit · 正例必经 approval.service.ts stub · LD-A-4
2. **detail 6 关联查串行** · 反例 `await tx.ipAccount.findUnique(); await tx.stepData.findMany(); ...` 顺序 5s+ · 正例 Promise.all 并行 < 300ms
3. **list 漏 RLS bypass** · 反例 `prisma.ipAccount.findMany({})` 不走 transaction → RLS 限制返回 0 行(主应用 user 视角看不到他人 account)· 正例必经 `$transaction + SET LOCAL`
4. **flag 重复 dedupe 漏** · 反例 admin 短时间内点 2 次 → 同 (accountId, anomalyType) 双记录 · 正例 unique key 检测 + 提示
5. **forceFreeze frozenAt 字段缺** · 反例只看 isBanned bool · 正例加 frozenAt + frozenByAdminId + freezeReason 3 字段 · 审计回溯依据

---

#### US-011 · IP 账号管理 UI page(大表格 + 详情抽屉 + 异常 Tab)

**risk_level** · high
**size_hint** · medium
**priority** · 11
**depends_on** · ["US-010"]

**描述** · 作为运营 / 客服 · 我需要打开 admin.quanan.com/accounts 看 IP 账号列表 + 行业/平台/阶段分布 + 异常账号专属 Tab + 详情抽屉。

**AC**(简化模式同 US-007):

##### H 幸福路径
- [ ] H-1 · `apps/admin/src/pages/accounts/index.tsx` 替换 placeholder
- [ ] H-2 · 顶部 [总账号 / 活跃 / 异常 / Top 3 行业] 数字卡片 + 行业/平台 2 饼图
- [ ] H-3 · 中部 DenseTable · 跨账号列表 · 列(accountId / industry / platform / level / stage / lastActiveAt / 操作)
- [ ] H-4 · 异常账号专属 Tab · DenseTable · 列(accountId / anomalyType / severity / detectedAt / 操作:resolve / falsePositive)
- [ ] H-5 · 右侧抽屉详情 · 9 步进度图 + 进化档案 + 历史时间线 + admin 备注 + 异常 flag 列表
- [ ] H-6 · 强制冻结按钮 → ForceFreezeDialog(同 US-007 ChangePlanDialog 模式)
- [ ] H-7 · admin-routes.ts metadata.prd = "PRD-11"

##### E 错误 / 边界
- [ ] E-1 · readonly_admin 隐藏 [强制冻结 / 标记异常] 按钮
- [ ] E-2 · 列表空 · 显示 "未找到匹配账号"
- [ ] E-3 · 详情抽屉关联表数据缺 · 用 skeleton 占位

##### B 后端
- [ ] B-1 · 无新后端代码

##### P 前端
- [ ] P-1 · 浏览器 agent-browser 打开 accounts page · 看到顶部 + 列表 + 异常 Tab
- [ ] P-2 · 点账号行 → 抽屉打开 · 9 步进度 + 进化档案 visible
- [ ] P-3 · 点 [强制冻结] · 弹窗 + 提交 → toast + 列表状态更新
- [ ] P-4 · 切异常 Tab · 看异常账号列表 · 点 [resolve] → 异常消失
- [ ] P-5 · console 0 error

**files_to_create** ·
- `apps/admin/src/pages/accounts/index.tsx`
- `apps/admin/src/pages/accounts/AccountListFilters.tsx`
- `apps/admin/src/pages/accounts/AccountDetailDrawer.tsx`
- `apps/admin/src/pages/accounts/AnomalyTab.tsx`
- `apps/admin/src/pages/accounts/ForceFreezeDialog.tsx`
- `apps/admin/src/pages/accounts/StepProgressChart.tsx`

**files_to_modify** ·
- `apps/admin/src/lib/admin-routes.ts`(accounts metadata.prd = "PRD-11")
- 删 `apps/admin/src/pages/accounts/placeholder.tsx`

**anti_patterns**:
1. **9 步进度图 SVG hardcode** · 反例 hardcode 9 个 rect · 正例用 Recharts BarChart 或自定义 SVG component 复用
2. **异常 Tab 跟主表共用一个 query** · 反例 N+1 · 正例分开 2 个 useQuery

---

### 🟦 域 ④ · 成本仪表盘(4 US · US-012~015)

财务生命线 · 月度总成本 + Top 10 + 多维切换(用户 / Specialist / 模型 / Provider)+ 单用户日均(对照 $0.45 估算)+ 异常告警(单用户日 > $5)+ PDF 月度账单导出(法务 / 财务用 + payloadHash 防篡改 footer)。

---

#### US-012 · adminRouter.cost 5 procedure(aggregate / top10 / specialistBreakdown / alerts / exportCsv)

**risk_level** · high
**size_hint** · medium
**priority** · 12
**depends_on** · []

**描述** · 作为前端开发者 · 我需要 5 个 cost procedure · 聚合查 cost_log(已有 6 admin index · DATA-MODEL:2351)。

**AC**(简化模式):

##### H 幸福路径
- [ ] H-1 · `apps/api/src/trpc/routers/admin/cost.ts` `aggregate` procedure · 时间范围 + 维度聚合 · 走 adminRLS bypass:
  ```typescript
  // # $ money-critical: true · 涉及成本聚合 · 全部 Decimal 类型(LD-008)
  aggregate: publicAdminProcedure
    .input(z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      dimension: z.enum(['user', 'specialist', 'model', 'provider']),
      groupBy: z.enum(['day', 'week', 'month']).default('day'),
    }))
    .query(async ({ ctx, input }) => {
      return await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        // 跨账号查 cost_log(全表 · LD-A-2)· 已有 6 admin index(DATA-MODEL:2351)
        const groupColumn = { user: 'user_id', specialist: 'specialist_id', model: 'model', provider: 'provider' }[input.dimension];
        const timeColumn = { day: "DATE_TRUNC('day', created_at)", week: "DATE_TRUNC('week', created_at)", month: "DATE_TRUNC('month', created_at)" }[input.groupBy];
        // ★ Prisma.sql template literal 防注入(不用 $queryRawUnsafe)
        const result = await tx.$queryRaw<Array<{ group: string; period: Date; total: Prisma.Decimal; count: bigint }>>`
          SELECT ${Prisma.raw(groupColumn)} AS "group",
                 ${Prisma.raw(timeColumn)} AS "period",
                 SUM(cost_usd) AS "total",
                 COUNT(*) AS "count"
          FROM cost_log
          WHERE created_at BETWEEN ${input.startDate}::date AND ${input.endDate}::date
          GROUP BY ${Prisma.raw(groupColumn)}, ${Prisma.raw(timeColumn)}
          ORDER BY period ASC
        `;
        await writeAuditLog(ctx, {
          eventCategory: 'data_query',
          eventType: 'cost_aggregate',
          payload: { startDate: input.startDate, endDate: input.endDate, dimension: input.dimension },
        });
        return {
          aggregations: result.map(r => ({ ...r, total: r.total.toNumber(), count: Number(r.count) })),
          summary: { totalCost: result.reduce((acc, r) => acc + r.total.toNumber(), 0) },
        };
      });
    })
  ```
- [ ] H-2 · `top10` procedure · 按月 Top 10 成本用户 + Top 10 账号 · 用 `prisma.costLog.groupBy({ by, _sum, orderBy: { _sum: { costUsd: 'desc' } }, take: 10 })`
- [ ] H-3 · `specialistBreakdown` procedure · 14 Specialist 分项 + 3 自治型 · 返回 `[{specialistId, totalCost, callCount, avgCostPerCall}]` 数组 · 给 US-013 横向 bar 图
- [ ] H-4 · `alerts` procedure · 查最近 24h · 单用户 sum > $5 异常列表 · 返回 `[{userId, email, dailySpent, threshold, severity}]` · 阈值 hardcode $5(对应 ARCHITECTURE §9.12b 估算 $0.45/D · 10x 阈值)
- [ ] H-5 · `exportCsv` procedure · 财务月度对账 · stream + chunk 1000 · CSV header `timestamp,userId,email,specialistId,model,provider,costUsd,traceId` · 防 OOM(同 US-008 pattern)
- [ ] H-6 · 5 procedure 全部走 6 闸 middleware(顺序硬约束 · adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → auditLog)+ 写 admin_audit_log
- [ ] H-7 · 5 procedure 全部标 `# $ money-critical: true` 注释(全局 CLAUDE.md money-critical grep 审计)· cost_log.costUsd 是 Decimal 类型(LD-008 锁定)· service 层用 Prisma.Decimal · **绝对不能** 转 number 后再聚合(精度丢失)

##### E 错误 / 边界
- [ ] E-1 · `startDate > endDate` · zod custom validator 抛 `ValidationError("startDate must be ≤ endDate")`
- [ ] E-2 · 时间范围超 1 年(防 abuse · 大查询)· 抛 `ValidationError("date range too large, max 365 days")`
- [ ] E-3 · `dimension` 不在 enum · zod 自动返回 400 + 详细错误
- [ ] E-4 · 数据空(无 cost_log)· `aggregate` 返回 `{ aggregations: [], summary: { totalCost: 0 } }` · 不抛 division by zero
- [ ] E-5 · `top10` 返回 < 10 行(用户少)· 不补零行 · 返回实际数量
- [ ] E-6 · `exportCsv` 行数 > 500k · 抛 `ValidationError("export rows > 500000, please narrow filters")`(同 US-008)
- [ ] E-7 · `alerts` 阈值 0(异常配置)· 用 default $5 + log warning · 不报错

##### B 后端
- [ ] B-1 · 5 procedure 全部走 `publicAdminProcedure`(已含 6 闸 + adminRLS bypass)
- [ ] B-2 · audit-redlines-admin.sh 跑过 0 命中 · 含 cost.ts money-critical grep 检查:
  ```bash
  grep -rE "money-critical.*true" apps/api/src/trpc/routers/admin/cost.ts | wc -l
  # 期望 ≥ 5(5 procedure 全标)
  ```
- [ ] B-3 · audit-admin-rls.ts AST 识别 5 cost procedure · `Checked 21+ procedures` 含 cost.aggregate / top10 / specialistBreakdown / alerts / exportCsv
- [ ] B-4 · 单元测试 `apps/api/src/trpc/routers/admin/__tests__/cost.test.ts` 覆盖 25+ test:
  - aggregate · 4 dimension × 3 groupBy = 12 case
  - top10 · 用户 / 账号 / 时间范围
  - specialistBreakdown · 14 Specialist 数据完整
  - alerts · 阈值边界(刚 $5 / $5.01 / 0 异常)
  - exportCsv · stream chunk + 大数据集
  - 鉴权各边界(readonly_admin 财务模式允许 / 法务模式只查不导出)
- [ ] B-5 · `pnpm test apps/api/src/trpc/routers/admin/__tests__/cost.test.ts` 全过(25+ test 全绿)
- [ ] B-6 · `pnpm typecheck` 0 error · Prisma.Decimal 类型保留 · 不用 number 替换

##### P 前端
- [ ] P-1 · 本 US 无前端代码 · UI 在 US-013 实现
- [ ] P-2 · packages/clients/admin 自动导出 5 procedure type · cost 数字类型用 string(避免 JS Number 精度丢失 64bit limit · 大金额场景)

**files_to_create** ·
- `apps/api/src/trpc/routers/admin/cost.ts`
- `apps/api/src/trpc/routers/admin/__tests__/cost.test.ts`

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`(+ cost: costRouter)

**anti_patterns**:
1. **成本字段用 Float** · 反例 `costUsd: Float`(浮点 0.1 + 0.2 = 0.30000000000000004)· 正例 `cost_log.costUsd` Decimal(已 DATA-MODEL 锁定 LD-008)+ service 层用 Prisma.Decimal · PRD-2 US-035 reject 案例
2. **money-critical 注释漏写** · 反例 cost 字段无 grep 标记 → 后续 audit 漏 catch · 正例 `# $ money-critical: true` 注释 + audit-redlines-admin.sh grep 验证 · 全局 CLAUDE.md money-critical 规则
3. **聚合 SQL 字符串拼接** · 反例 `$queryRawUnsafe(\`SELECT SUM(cost) FROM ${tableName}\`)` SQL 注入风险 · 正例 `Prisma.raw(groupColumn)` 限制白名单 + 参数 template literal · PRD-1 US-006 reject 教训
4. **Decimal 转 number 后再 SUM** · 反例 `result.map(r => r.total.toNumber()).reduce(...)` JS Number 64bit 精度丢失 · 正例 service 层全程 Decimal.add() · 最后返前端再 toString()
5. **alerts 阈值 hardcode 错** · 反例 hardcode $0.45(估算值 = 阈值)· 触发太频繁 · 正例阈值 = 10x 估算(给 buffer)· ARCHITECTURE §9.12b 估算 + 阈值分离

---

#### US-013 · 成本仪表盘 UI page(月度 + Top 10 + 多维切换 + Recharts)

**risk_level** · high
**size_hint** · medium
**priority** · 13
**depends_on** · ["US-012"]

**描述** · 作为运营 / 财务 · 我需要打开 admin.quanan.com/cost 看月度成本(同比/环比)+ Top 10 用户 + 多维切换 + 异常告警栏。

**AC**(简化):

##### H 幸福路径
- [ ] H-1 · `apps/admin/src/pages/cost/index.tsx` 替换 placeholder
- [ ] H-2 · 顶部 · 月度总成本 + 同比 + 环比 + Top 10 用户横向 bar
- [ ] H-3 · 中部 · 多线折线(分模型 / Specialist · 可切换)+ 饼图(分项)
- [ ] H-4 · 底部 · 详细表格(可分组 + 排序 + 导出 CSV 按钮)
- [ ] H-5 · 右侧 · 异常告警栏
- [ ] H-6 · admin-routes.ts cost metadata.prd = "PRD-11"

##### E 错误 / 边界
- [ ] E-1 · readonly_admin 财务模式 · 可看全部 + 导出
- [ ] E-2 · 时间范围 dropdown · 本月 / 上月 / 本季度 / 本年 / 自定义
- [ ] E-3 · 多维切换 · 不重发请求(React Query cache)

##### B 后端
- [ ] B-1 · 无新

##### P 前端
- [ ] P-1 · 浏览器打开 cost page · 看到顶部数字 + Top 10 + 折线 + 饼图
- [ ] P-2 · 切维度 · 数据自动刷新
- [ ] P-3 · 切时间范围 · 数据自动刷新
- [ ] P-4 · 点 [CSV 导出] · 浏览器 download
- [ ] P-5 · console 0 error

**files_to_create** ·
- `apps/admin/src/pages/cost/index.tsx`
- `apps/admin/src/pages/cost/CostOverviewCards.tsx`
- `apps/admin/src/pages/cost/CostTopUsersChart.tsx`
- `apps/admin/src/pages/cost/CostBreakdownChart.tsx`
- `apps/admin/src/pages/cost/CostAlertsPanel.tsx`

**files_to_modify** ·
- `apps/admin/src/lib/admin-routes.ts`(cost metadata.prd = "PRD-11")
- 删 `apps/admin/src/pages/cost/placeholder.tsx`

**anti_patterns**:
1. **Recharts 多线折线 X 轴时间格式错** · 反例 raw timestamp · 正例 `format(timestamp, 'MM-dd')`
2. **成本数字格式化** · 反例 raw float · 正例 `$ {cost.toFixed(2)}` 美元 2 位小数

---

#### US-014 · 成本月度账单 PDF 导出(@react-pdf/renderer · 法务签名页)

**risk_level** · medium
**size_hint** · medium
**priority** · 14
**depends_on** · ["US-012"]

**描述** · 作为财务 · 我需要点击 [月度账单 PDF] 导出当月成本汇总报告 · 含分项明细 + 签名页 + payloadHash 防篡改 footer。

**AC**:

##### H 幸福路径
- [ ] H-1 · `packages/ui/admin/` 加 `@react-pdf/renderer` 依赖 · pnpm add
- [ ] H-2 · `apps/api/src/services/admin/cost/pdf-bill.service.ts` PDF 生成 service:
  ```typescript
  import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
  // ... PDF template:头(月份 / 公司 logo)+ 总成本表 + 分项表 + 签名页 + payloadHash footer
  ```
- [ ] H-3 · `apps/api/src/trpc/routers/admin/cost.ts` 加 `exportMonthlyPdf` mutation
- [ ] H-4 · 前端 trigger · 点 [月度账单 PDF] → 后端生成 → 浏览器 download
- [ ] H-5 · PDF footer 含 `Hash: {SHA-256 payload}` 防篡改 + admin actorId + 生成时间

##### E 错误 / 边界
- [ ] E-1 · 月份无数据 · PDF 生成空账单 · 不抛 error
- [ ] E-2 · PDF 生成失败(@react-pdf 错)· 返回 500 + audit 记录失败

##### B 后端
- [ ] B-1 · 单元测试 PDF 生成 + 内容验证
- [ ] B-2 · audit-redlines-admin.sh 跑过

##### P 前端
- [ ] P-1 · 点 [月度账单 PDF] · download `cost-bill-2026-05.pdf`
- [ ] P-2 · 打开 PDF · 看到完整表格 + 签名页 + footer hash
- [ ] P-3 · console 0 error

**files_to_create** ·
- `apps/api/src/services/admin/cost/pdf-bill.service.ts`
- `apps/api/src/services/admin/cost/__tests__/pdf-bill.test.ts`
- `packages/ui/admin/PdfBillTemplate.tsx`(可选 · React PDF 组件)

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/cost.ts`(+ exportMonthlyPdf)
- `apps/admin/src/pages/cost/index.tsx`(+ [PDF 导出] 按钮)
- `packages/ui/admin/package.json`(+ @react-pdf/renderer dep)

**anti_patterns**:
1. **PDF 大数据 OOM** · 反例一次性 render 100k 行 · 正例分页 PDF(每页 50 行 · 100 页)
2. **footer hash 漏算 redact** · 反例 hash 含 password · 正例 redact 后 hash

---

#### US-015 · cost 异常告警 cron + 钉钉 webhook stub

**risk_level** · medium
**size_hint** · small
**priority** · 15
**depends_on** · ["US-012"]

**描述** · 作为运维 · 我需要每小时跑 cron 检测 [单用户日 > $5] 异常 + 钉钉 webhook 推送(stub · 真启用留 PRR)。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/jobs/admin/cost-anomaly.job.ts` 注册 cron · 每小时跑 detectCostAnomalies · 显式时区 `tz: 'Asia/Shanghai'`(D-070):
  ```typescript
  await costAnomalyQueue.add('detect-cost-anomaly', {}, {
    repeat: { pattern: '15 * * * *', tz: 'Asia/Shanghai' }, // 每小时 15 分跑(错开 kpi-snapshot 整点)
    jobId: 'cost-anomaly-recurring',
  });
  ```
- [ ] H-2 · `detectCostAnomalies` service:
  ```typescript
  // # $ money-critical: true · 涉及成本告警
  export async function detectCostAnomalies(): Promise<{ detected: number; skipped: number }> {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
      // 查最近 24h · 单 user sum > $5
      const anomalies = await tx.$queryRaw<Array<{ userId: number; email: string; dailySpent: string }>>`
        SELECT cl.user_id AS "userId",
               u.email,
               SUM(cl.cost_usd)::text AS "dailySpent"
        FROM cost_log cl
        JOIN users u ON u.id = cl.user_id
        WHERE cl.created_at > NOW() - INTERVAL '24 hours'
        GROUP BY cl.user_id, u.email
        HAVING SUM(cl.cost_usd) > 5
      `;
      let detected = 0;
      let skipped = 0;
      for (const anom of anomalies) {
        // dedupe · 同 user 同日只告警 1 次
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const existing = await tx.adminAuditLog.findFirst({
          where: {
            eventType: 'cost_anomaly_detected',
            targetUserId: anom.userId,
            createdAt: { gte: todayStart },
          },
        });
        if (existing) { skipped++; continue; }
        await writeAuditLog(tx, {
          eventCategory: 'security_alert',
          eventType: 'cost_anomaly_detected',
          targetUserId: anom.userId,
          payload: { dailySpent: anom.dailySpent, threshold: '5.00', email: anom.email },
        });
        // 推钉钉(stub)
        await dingtalkService.send({
          title: `[Cost Anomaly] User ${anom.email} spent $${anom.dailySpent} in 24h`,
          severity: 'medium',
          payload: { userId: anom.userId, dailySpent: anom.dailySpent },
        });
        detected++;
      }
      return { detected, skipped };
    });
  }
  ```
- [ ] H-3 · 钉钉 webhook stub · `apps/api/src/services/admin/notifications/dingtalk.service.ts`:
  ```typescript
  export class DingtalkService {
    constructor(
      private readonly webhookUrl: string | undefined = process.env.DINGTALK_WEBHOOK_URL,
      private readonly isMock: boolean = process.env.DINGTALK_ENABLE !== 'true', // ★ 默认 mock · D-077
    ) {}

    async send(msg: { title: string; severity: 'low' | 'medium' | 'high'; payload: Record<string, unknown> }) {
      if (this.isMock || !this.webhookUrl) {
        logger.warn('[dingtalk-mock] webhook would send:', msg);
        return { ok: true, mock: true };
      }
      // 真启路径(PRR 启用)
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msgtype: 'text', text: { content: msg.title } }),
      });
      return { ok: response.ok, mock: false };
    }
  }

  export const dingtalkService = new DingtalkService();
  ```
- [ ] H-4 · audit 写入 `eventCategory='security_alert', eventType='cost_anomaly_detected'` · payload 含 userId / dailySpent / threshold · payloadHash SHA-256(D-073)
- [ ] H-5 · `apps/api/src/server.ts` 启动时 `await scheduleCostAnomalyDetection()` · 启动 log 含 `[bullmq] admin:cost-anomaly worker started` + `cost-anomaly-recurring registered`

##### E 错误 / 边界
- [ ] E-1 · `DINGTALK_ENABLE !== 'true'`(默认 / dev / staging)· isMock=true · log warning + return mock=true · 不真发 webhook(D-077)
- [ ] E-2 · cron 跑过程出错(SQL 超时 / DB 断)· BullMQ `attempts: 3` 自动重试 · 第 3 次失败进 `failed` queue + 写 admin_audit_log `eventCategory='system_alert', eventType='cron_failed', payload={jobName: 'cost-anomaly'}`
- [ ] E-3 · 同一 user 同一日多次 detect · 通过 `adminAuditLog.findFirst({where: {eventType: 'cost_anomaly_detected', targetUserId, createdAt: {gte: todayStart}}})` 检测 · 第 N 次 skip · skipped++ 计数
- [ ] E-4 · webhookUrl 为空 + isMock=false(误配 PRR)· 抛 `ConfigurationError("DINGTALK_WEBHOOK_URL is required when DINGTALK_ENABLE=true")` · 服务启动 fail-fast
- [ ] E-5 · 24h 内 0 anomaly · `detected=0, skipped=0` · 不抛 error · log debug
- [ ] E-6 · cron 跑超 30s · 抛 `JobTimeout` · 不阻塞下一周期

##### B 后端
- [ ] B-1 · 单元测试 `apps/api/src/services/admin/notifications/__tests__/dingtalk.test.ts`:
  - test 1 · isMock=true · log warning + mock=true return
  - test 2 · isMock=false + webhookUrl 空 · 抛 ConfigurationError
  - test 3 · isMock=false + webhookUrl 有 · fetch mock 调用一次
  - test 4 · payload structure 符合钉钉 API spec
- [ ] B-2 · 单元测试 `apps/api/src/jobs/admin/__tests__/cost-anomaly.test.ts`:
  - test 1 · 0 anomaly · detected=0
  - test 2 · 1 anomaly($5.01)· detected=1 + audit 写入
  - test 3 · 同 user 同日 2 次跑 · 第 2 次 skipped=1
  - test 4 · cron failure 3 次进 failed queue
- [ ] B-3 · `pnpm test apps/api/src/{services,jobs}/admin/**/__tests__/*.test.ts` 全过(8 test 全绿)
- [ ] B-4 · `pnpm audit:redlines-admin` 跑过 0 命中 · 含 cost-anomaly money-critical 注释 grep 验证
- [ ] B-5 · `pnpm typecheck` 0 error · DingtalkService 强类型 · isMock / webhookUrl 显式

##### P 前端
- [ ] P-1 · 本 US 无 UI 改动 · 异常显示在 US-013 [告警栏](通过 trpc.admin.cost.alerts 查 admin_audit_log)

**files_to_create** ·
- `apps/api/src/jobs/admin/cost-anomaly.job.ts`
- `apps/api/src/jobs/admin/__tests__/cost-anomaly.test.ts`
- `apps/api/src/services/admin/notifications/dingtalk.service.ts`
- `apps/api/src/services/admin/notifications/__tests__/dingtalk.test.ts`
- `apps/api/src/services/admin/cost/detect-anomalies.service.ts`

**files_to_modify** ·
- `apps/api/src/server.ts`(+ scheduleCostAnomalyDetection())
- `.env.example`(+ DINGTALK_WEBHOOK_URL + DINGTALK_ENABLE 注释)

**anti_patterns**:
1. **钉钉 webhook 直接连真 URL** · 反例 dev / staging hardcode 真 webhook URL · 误发到真运维群 · 正例 `isMock = process.env.DINGTALK_ENABLE !== 'true'`(默认 mock)+ .env.production 显式启 · D-077 + 跟 PRD-10 OAuth multi-layer 模式对齐
2. **alerts 重复推** · 反例 cron 跑 24 次 / day · 同一 user 推 24 次告警 · 运维炸 · 正例 dedupe via adminAuditLog.findFirst per user per day
3. **cron pattern 漏时区** · 反例 `pattern: '15 * * * *'` 默认 UTC · 中国时间凌晨乱触发 · 正例 `tz: 'Asia/Shanghai'`(D-070)
4. **cron 跟其他整点 cron 撞** · 反例 kpi-snapshot 00:00 + cost-anomaly 00:00 → 同时挤 SQL · 正例错开(cost-anomaly 在 15 分)· 防 thundering herd
5. **dingtalk service 不抽 class** · 反例直接 fetch + 写死 url · 难 unit test · 正例 class + DI(webhookUrl + isMock 注入)

---

### 🟦 域 ⑤ · 审计日志查询(3 US · US-016~018)

法务取证生命线 · trace_id 全栈反查 + 用户操作时间线 + admin 操作审计 + 法务 PDF 取证导出(含 payloadHash 防篡改)。

---

#### US-016 · adminRouter.audit 5 procedure(byTraceId / byUserId / byAdminId / search / exportPdf)

**risk_level** · high
**size_hint** · medium
**priority** · 16
**depends_on** · []

**描述** · 作为前端开发者 · 我需要 5 个 audit procedure · 实现 trace_id 反查 + 用户操作时间线 + admin 操作审计 + 法务取证导出。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/trpc/routers/admin/audit.ts` `byTraceId` procedure · 跨 4 表 trace_id 反查 · Promise.all 并行:
  ```typescript
  byTraceId: publicAdminProcedure
    .input(z.object({ traceId: z.string().min(8).max(64) }))
    .query(async ({ ctx, input }) => {
      return await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        // ★ Promise.all 并行 4 表查询 · 防串行 5s+
        const [userAudit, adminAudit, costs, feedback] = await Promise.all([
          tx.auditLog.findMany({ where: { traceId: input.traceId }, orderBy: { createdAt: 'asc' } }),
          tx.adminAuditLog.findMany({ where: { traceId: input.traceId }, orderBy: { createdAt: 'asc' } }),
          tx.costLog.findMany({ where: { traceId: input.traceId }, orderBy: { createdAt: 'asc' } }),
          tx.feedbackLog.findMany({ where: { traceId: input.traceId }, orderBy: { createdAt: 'asc' } }),
        ]);
        // 跨表合并 + 按 createdAt 升序
        const timeline = [
          ...userAudit.map(e => ({ ...e, source: 'audit_log' as const })),
          ...adminAudit.map(e => ({ ...e, source: 'admin_audit_log' as const })),
          ...costs.map(e => ({ ...e, source: 'cost_log' as const })),
          ...feedback.map(e => ({ ...e, source: 'feedback_log' as const })),
        ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        // ★ 查 audit 本身也写 audit(LD-A-3 append-only)
        await writeAuditLog(ctx, {
          eventCategory: 'cross_account_query',
          eventType: 'view_trace_timeline',
          payload: { traceId: input.traceId, eventCount: timeline.length },
        });
        return { timeline, summary: { traceId: input.traceId, eventCount: timeline.length, spanMs: timeline.length > 0 ? timeline[timeline.length-1].createdAt.getTime() - timeline[0].createdAt.getTime() : 0 } };
      });
    })
  ```
- [ ] H-2 · `byUserId` procedure · 输入 userId · 时间线 audit_log · 分页(50 / page)· 按 eventCategory 分类高亮(auth / data_query / data_mutation / cross_account_query / compliance / security_alert):
  ```typescript
  byUserId: publicAdminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(100).default(50),
      eventCategoryFilter: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        const where = { userId: input.userId, ...buildDateWhere(input), ...(input.eventCategoryFilter && { eventCategory: input.eventCategoryFilter }) };
        const [logs, total] = await Promise.all([
          tx.auditLog.findMany({ where, skip: (input.page - 1) * input.pageSize, take: input.pageSize, orderBy: { createdAt: 'desc' } }),
          tx.auditLog.count({ where }),
        ]);
        await writeAuditLog(ctx, {
          eventCategory: 'cross_account_query',
          eventType: 'view_user_audit_timeline',
          targetUserId: input.userId,
          payload: { filters: input, count: logs.length },
        });
        return { logs, total, page: input.page };
      });
    })
  ```
- [ ] H-3 · `byAdminId` procedure · 输入 adminUserId · 时间线 admin_audit_log · 高风险事件高亮(eventCategory in ['high_risk_action', 'security_alert', 'cross_account_query'])· 仅 super_admin / readonly_admin 法务模式可查
- [ ] H-4 · `search` procedure · 按 eventType / 时间范围 / 关键词搜索 · ★ 关键词用 prisma `contains` 防 SQL 注入(不用 $queryRawUnsafe):
  ```typescript
  search: publicAdminProcedure
    .input(z.object({
      keyword: z.string().min(2).max(100),
      eventCategory: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      target: z.enum(['user_audit', 'admin_audit', 'both']).default('both'),
    }))
    .query(async ({ ctx, input }) => {
      return await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        const where = {
          OR: [
            { eventType: { contains: input.keyword, mode: 'insensitive' as const } },
            { errorMessage: { contains: input.keyword, mode: 'insensitive' as const } },
          ],
          ...buildDateWhere(input),
        };
        // 用 prisma contains(自动 escape · 防注入)· **绝对不能** $queryRawUnsafe
        const [userResults, adminResults] = await Promise.all([
          input.target !== 'admin_audit' ? tx.auditLog.findMany({ where, take: 200, orderBy: { createdAt: 'desc' } }) : [],
          input.target !== 'user_audit' ? tx.adminAuditLog.findMany({ where, take: 200, orderBy: { createdAt: 'desc' } }) : [],
        ]);
        return { userResults, adminResults };
      });
    })
  ```
- [ ] H-5 · `exportPdf` procedure · 法务取证 PDF · 输入 traceId · 调 byTraceId + 用 pdf-forensic.service(US-018)生成 PDF · 返回 binary stream
- [ ] H-6 · 5 procedure 全部走 6 闸 middleware + 写 admin_audit_log(查 audit 本身也写 audit · LD-A-3 append-only · 跨账号查 trigger cross_account_query)
- [ ] H-7 · readonly_admin 法务模式 · 全权 5 procedure(rolecheck 通过)· 其他 admin 受限

##### E 错误 / 边界
- [ ] E-1 · trace_id 不存在(4 表都查不到)· `byTraceId` 返回 `{ timeline: [], summary: { eventCount: 0, spanMs: 0 } }` + UI 显示 "未找到匹配记录 · 检查 trace_id 是否完整"
- [ ] E-2 · admin (非 super_admin / readonly_admin 法务) 调 `byAdminId` · 6 闸 roleCheck 拦截 + 返回 403 + audit 记录 privilege_escalation_attempt
- [ ] E-3 · `search` 关键词含 SQL 特殊字符 `'`, `"`, `;`, `--`, `;DROP TABLE` · prisma `contains` 自动 escape · 不抛 error · 返回 0 结果(因为字符不在 eventType 中)
- [ ] E-4 · `userId` / `adminUserId` 不存在 · 返回 `{ logs: [], total: 0 }` · 不抛 NotFoundError(允许查询不存在的 ID 看历史)
- [ ] E-5 · `byTraceId` traceId 格式不符(< 8 字符)· zod 自动返回 400 + 详细错误
- [ ] E-6 · `search` 关键词 < 2 字符 · zod min(2) 拒绝 · 防全表扫
- [ ] E-7 · `exportPdf` traceId 不存在 · PDF 仍生成 + footer 标 "无匹配记录" · 不报错(法务取证场景需要"证据空"的记录)
- [ ] E-8 · 时间范围超 1 年 + 关键词模糊 · 可能返回 10k+ 行 · `take: 200` 限制 · UI 提示 "结果已截断 · 缩小时间范围"

##### B 后端
- [ ] B-1 · 5 procedure 全部走 `publicAdminProcedure`(已含 6 闸 + adminRLS bypass)
- [ ] B-2 · audit-redlines-admin.sh + audit-admin-rls.ts AST + audit-approval-gates.ts 三件全过 · `Checked 26+ procedures`(PRD-10 5 nsm + PRD-11 累计 21 + 5 audit = 31)
- [ ] B-3 · 单元测试 `apps/api/src/trpc/routers/admin/__tests__/audit.test.ts` 25+ test case:
  - byTraceId · 4 表全有数据 / 部分有 / 全无
  - byUserId · 分页 + filter + 时间范围
  - byAdminId · super_admin / readonly_admin 法务 vs admin 鉴权
  - search · 关键词 SQL 注入测试(各种 special char) + 大小写不敏感
  - exportPdf · 调用链 + binary stream return
- [ ] B-4 · `pnpm test apps/api/src/trpc/routers/admin/__tests__/audit.test.ts` 全过(25+ test 全绿)
- [ ] B-5 · `pnpm typecheck` 0 error · timeline 联合类型严格

##### P 前端
- [ ] P-1 · 本 US 无前端代码 · UI 在 US-017 实现
- [ ] P-2 · packages/clients/admin 自动导出 5 procedure type

**files_to_create** ·
- `apps/api/src/trpc/routers/admin/audit.ts`
- `apps/api/src/trpc/routers/admin/__tests__/audit.test.ts`

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`(+ audit: auditRouter)

**anti_patterns**:
1. **search SQL 注入** · 反例 `$queryRawUnsafe(\`SELECT * WHERE event_type LIKE '%${kw}%'\`)` 直接拼字符串 · 攻击者输入 `'; DROP TABLE audit_log; --` 全删 · 正例 prisma `contains: { mode: 'insensitive' }` 自动 escape · PRD-1 US-006 教训
2. **byTraceId 4 表查串行** · 反例 `await tx.auditLog.findMany(...); await tx.adminAuditLog.findMany(...); ...` 顺序 4s+ · 正例 Promise.all 并行 < 500ms · PRD-3 US-018 教训
3. **byAdminId 鉴权漏 readonly_admin 法务子模式判断** · 反例只判 super_admin · 法务 readonly_admin 也拒绝 · 正例 actorMode='legal' 也允许 · D-074 + LD-A-5
4. **查 audit 本身漏写 audit** · 反例 byTraceId 不写 admin_audit_log → 法务取证查 audit 历史时看不到谁查过 · 正例每次查 audit 也写 audit · LD-A-3 append-only
5. **search 不限 take** · 反例无 take 限制 → 10k+ 结果一次返 → 浏览器卡 · 正例 `take: 200` + UI 截断提示

---

#### US-017 · 审计日志 UI page(trace 反查 + 时间线 + 详情抽屉)

**risk_level** · high
**size_hint** · medium
**priority** · 17
**depends_on** · ["US-016"]

**描述** · 作为法务 / super_admin · 我需要打开 admin.quanan.com/audit 看 trace_id 反查输入框 + 用户 / admin 操作时间线 + 详情抽屉。

**AC**(简化):

##### H 幸福路径
- [ ] H-1 · `apps/admin/src/pages/audit/index.tsx` 替换 placeholder
- [ ] H-2 · 顶部 · [日操作量 / cross_account_query / 异常事件] 3 数字
- [ ] H-3 · 中部 · trace_id 反查输入框(submit 后跳详情)+ 用户 / admin 切换 Tab
- [ ] H-4 · 时间线视图 · 按 eventCategory 分类高亮(auth/data_query/cross_account/high_risk/security_alert)
- [ ] H-5 · 详情抽屉 · prompt + response + context(可折叠)+ payloadHash 显示
- [ ] H-6 · 底部 · [PDF 取证导出] 按钮
- [ ] H-7 · admin-routes.ts audit metadata.prd = "PRD-11"

##### E 错误 / 边界
- [ ] E-1 · readonly_admin 法务模式 · 全权
- [ ] E-2 · trace_id 不存在 · 显示 "未找到匹配 · 检查 trace_id 是否完整"

##### B 后端
- [ ] B-1 · 无新

##### P 前端
- [ ] P-1 · 浏览器打开 audit page · 看到顶部数字 + 输入框
- [ ] P-2 · 输入 trace_id 提交 → 看到时间线
- [ ] P-3 · 切换 [用户 / admin] Tab · 时间线刷新
- [ ] P-4 · 点时间线条目 → 抽屉详情(prompt + response 可折叠)
- [ ] P-5 · 点 [PDF 取证导出] · download

**files_to_create** ·
- `apps/admin/src/pages/audit/index.tsx`
- `apps/admin/src/pages/audit/TraceLookupInput.tsx`
- `apps/admin/src/pages/audit/AuditTimeline.tsx`
- `apps/admin/src/pages/audit/AuditDetailDrawer.tsx`

**files_to_modify** ·
- `apps/admin/src/lib/admin-routes.ts`(audit metadata.prd = "PRD-11")
- 删 `apps/admin/src/pages/audit/placeholder.tsx`

**anti_patterns**:
1. **时间线 30k+ 条不分页** · 反例一次 render 全部 · 正例 virtual scroll
2. **payloadHash 不显示** · 反例只显示 payload · 正例 hash 也显示(法务取证用)

---

#### US-018 · 审计 PDF 取证导出(payloadHash 防篡改 footer)

**risk_level** · medium
**size_hint** · small
**priority** · 18
**depends_on** · ["US-016"]

**描述** · 作为法务 · 我需要点击 [PDF 取证导出] 生成法务级别 PDF 含完整 trace 链路 + payloadHash + 操作人签名页。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/services/admin/audit/pdf-forensic.service.ts` PDF 生成 service · 用 `@react-pdf/renderer`(同 US-014):
  ```typescript
  import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
  import { createHash } from 'crypto';

  export async function generateForensicPdf(params: {
    traceId: string;
    timeline: TimelineEvent[];
    requesterAdminId: number;
    requesterEmail: string;
    requesterRole: string;
    caseNumber?: string;
  }): Promise<Buffer> {
    const generatedAt = new Date();
    // 计算整份 PDF 内容的 SHA-256 hash · footer 防篡改
    const contentHash = createHash('sha256')
      .update(JSON.stringify({ traceId: params.traceId, timeline: params.timeline, generatedAt }))
      .digest('hex');
    // ... React PDF Document template
    return await ReactPDF.renderToBuffer(<ForensicPdfTemplate ... />);
  }
  ```
- [ ] H-2 · PDF 内容结构(法务标准):
  - 头页 · 案件号(可选 · admin 输入) + 取证时间 + admin 信息(email / role / 取证理由) + traceId
  - 时间线页 · 跨表 timeline 按时间排序 · 每条 [时间 + source + eventCategory + eventType + payload 摘要 + payloadHash(防伪)]
  - 详情页(每条 1 页 · 可选)· prompt + response + context · 折叠展示
  - 签名页 · admin 取证签名占位(后续手签 + 司法盖章) + 取证机构占位 + 时间戳
  - footer 每页 · `Content-Hash: SHA-256 = ${contentHash}` + 分页(N/M) + 取证时间
- [ ] H-3 · `apps/api/src/trpc/routers/admin/audit.ts` 加 `exportPdf` mutation(对应 US-016 H-5):
  ```typescript
  exportPdf: publicAdminProcedure
    .input(z.object({
      traceId: z.string().min(8).max(64),
      caseNumber: z.string().optional(),
      reason: z.string().min(10).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. 查 timeline · 复用 byTraceId procedure 逻辑
      const timelineData = await getTimelineByTraceId(input.traceId);
      // 2. 生成 PDF
      const pdfBuffer = await generateForensicPdf({
        traceId: input.traceId,
        timeline: timelineData.timeline,
        requesterAdminId: ctx.session.adminUserId,
        requesterEmail: ctx.session.email,
        requesterRole: ctx.session.role,
        caseNumber: input.caseNumber,
      });
      // 3. 写 audit(取证操作必记录)
      await writeAuditLog(ctx, {
        eventCategory: 'export',
        eventType: 'export_audit_forensic_pdf',
        payload: {
          traceId: input.traceId,
          caseNumber: input.caseNumber,
          reason: input.reason,
          eventCount: timelineData.timeline.length,
          pdfHash: createHash('sha256').update(pdfBuffer).digest('hex'),
        },
      });
      // 4. 返回 binary stream · 前端 trigger download
      return {
        filename: `audit-forensic-${input.traceId.slice(0, 12)}-${Date.now()}.pdf`,
        contentType: 'application/pdf',
        size: pdfBuffer.length,
        data: pdfBuffer.toString('base64'),
      };
    })
  ```
- [ ] H-4 · 前端 `apps/admin/src/pages/audit/index.tsx` 加 [PDF 取证导出] 按钮 · 点击触发 mutation + 浏览器 download `audit-forensic-{traceId}-{ts}.pdf`
- [ ] H-5 · 单 PDF 文件 ≤ 10MB(普通 trace 通常 ≤ 100 条 · 100KB-1MB)

##### E 错误 / 边界
- [ ] E-1 · 单 trace 数据量 > 1000 条 · PDF 分页(每页 50 条 · 共 20 页)· 不一次性 render 1000 条 OOM
- [ ] E-2 · traceId 不存在(timeline 空)· PDF 仍生成 + 头页标 "无匹配记录" + 时间线页空 · 法务取证场景需要"证据空"的记录(防 admin 删 audit 后说"没记录")
- [ ] E-3 · admin (非 super_admin / readonly_admin 法务) 调 exportPdf · 6 闸 roleCheck 拦截 403 + audit 记录
- [ ] E-4 · `reason` < 10 字符 · zod 拒绝(防 admin 随意取证不记理由)
- [ ] E-5 · PDF 生成失败(@react-pdf 错 / OOM)· 返回 500 + audit 记录 `eventType='export_failed'`
- [ ] E-6 · PDF 单文件 > 50MB · 拒绝生成 + 提示 "数据量过大 · 缩小时间范围或分批导出"

##### B 后端
- [ ] B-1 · 单元测试 `apps/api/src/services/admin/audit/__tests__/pdf-forensic.test.ts`:
  - test 1 · 普通 timeline(10 条)生成 PDF · 验证内容含 traceId + 时间线 + footer hash
  - test 2 · 空 timeline · PDF 仍生成 + 标 "无匹配记录"
  - test 3 · 大 timeline(1000 条)· 分页正确
  - test 4 · footer hash 计算正确(可重算验证)
  - test 5 · admin info 填入正确(email / role / reason)
- [ ] B-2 · 单元测试 `apps/api/src/trpc/routers/admin/__tests__/audit-export.test.ts`:
  - test 1 · exportPdf 调用 → audit 写入 → base64 binary 返回
  - test 2 · readonly_admin 法务模式允许 / 其他 admin 拒绝
- [ ] B-3 · `pnpm test` 全过(7+ test 全绿)
- [ ] B-4 · `pnpm audit:redlines-admin` 跑过 0 命中(PDF 不暴露敏感字段 · payload redact 应用)
- [ ] B-5 · `pnpm typecheck` 0 error · @react-pdf 类型严格

##### P 前端
- [ ] P-1 · 浏览器 agent-browser 打开 audit page · 先调 byTraceId 拿到 timeline · 点 [PDF 取证导出] 按钮
- [ ] P-2 · 弹出 reason 输入对话框 · 输入 "案件 2026-CIVIL-001 取证" + 案件号 "2026-CIVIL-001" + 提交
- [ ] P-3 · 浏览器自动 download `audit-forensic-{traceId}-{ts}.pdf` · 文件可打开
- [ ] P-4 · 打开 PDF 验证:
  - 头页含案件号 + 取证 admin 信息 + 取证时间
  - 时间线页按时序排列 · 含 source 标记(audit_log / admin_audit_log / cost_log / feedback_log)
  - 签名页含 admin 签名占位 + 司法盖章位
  - 每页 footer 含 `Content-Hash: SHA-256 = ...` + 分页号
- [ ] P-5 · console 0 error / Network 看到 mutation 200

**files_to_create** ·
- `apps/api/src/services/admin/audit/pdf-forensic.service.ts`
- `apps/api/src/services/admin/audit/__tests__/pdf-forensic.test.ts`
- `apps/api/src/trpc/routers/admin/__tests__/audit-export.test.ts`
- `packages/ui/admin/ForensicPdfTemplate.tsx`(React PDF 模板组件 · 可选)

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/audit.ts`(+ exportPdf mutation)
- `apps/admin/src/pages/audit/index.tsx`(+ [PDF 取证] 按钮 + reason 弹窗)

**anti_patterns**:
1. **签名页 hardcode 个人名** · 反例 hardcode "张三 admin" · 不通用 · 正例从 ctx.session 取 email + role 自动填 · PRD-7 US-013 reject 案例
2. **PDF 缺 hash footer** · 反例只导出明文 · 法务对方不知 PDF 是否被改 · 正例 footer 必须含 SHA-256 hash + 可重算验证 · LD-A-3 防篡改延伸
3. **PDF 1000+ 条不分页** · 反例 try render 1000 entry on 1 page · OOM 或 PDF 完全无法打开 · 正例分页 每页 50 条
4. **traceId 无匹配 throw error** · 反例返 404 · 法务取证需要"证据空"的记录(防 admin 删 audit 后证明 traceId 确实查不到)· 正例仍生成 PDF + 标 "无匹配"
5. **PDF 含敏感字段未 redact** · 反例 payload 完整 dump 含 password · 正例先 redact 再写 PDF + footer hash 用 redact 后数据 · LD-A-3 admin 审计 + GDPR
6. **reason 字段 < 10 char 不限制** · 反例 admin 输入 "test" 随意取证 · 正例 zod min(10) 强制写理由 + 法务合规

---

### 🟦 域 ⑥ · 邀请码管理(3 US · US-019~021)

营销 campaign + 转化漏斗 + 创建(单 / 批量 CSV)+ 失效(走 Approval)+ campaign 分组转化分析。

---

#### US-019 · invite_campaigns schema + service

**risk_level** · medium
**size_hint** · small
**priority** · 19
**depends_on** · []

**描述** · 作为开发者 · 我需要 invite_campaigns 表 + service · 关联 invite_codes.campaign tag。

**AC**:

##### H 幸福路径
- [ ] H-1 · `prisma/schema.prisma` 加 `InviteCampaign`(按 DATA-MODEL §13.6.C)
- [ ] H-2 · migration 应用 · `psql` 看到表 + indexes
- [ ] H-3 · manual_admin_rls.sql 加 DISABLE RLS
- [ ] H-4 · `apps/api/src/services/admin/invites/campaign.service.ts` CRUD + 转化漏斗计算
- [ ] H-5 · audit-admin-rls-tables.sh 加 invite_campaigns

##### E 错误 / 边界
- [ ] E-1 · campaignKey 重复 · unique 约束抛
- [ ] E-2 · totalQuota = 0 · 抛 ValidationError
- [ ] E-3 · endsAt < startsAt · 抛 ValidationError

##### B 后端
- [ ] B-1 · 单元测试 8+
- [ ] B-2 · Typecheck 0 error

##### P 前端
- [ ] P-1 · 无 UI(US-021)

**files_to_create** ·
- `apps/api/src/services/admin/invites/campaign.service.ts`
- `apps/api/src/services/admin/invites/__tests__/campaign.test.ts`

**files_to_modify** ·
- `prisma/schema.prisma`
- `prisma/migrations/manual_admin_rls.sql`
- `scripts/audit-admin-rls-tables.sh`

**anti_patterns**:
1. **campaignKey 不 unique** · 反例多个 campaign 同 key · 正例 `@unique` 约束 + service 层 try/catch

---

#### US-020 · adminRouter.invites 6 procedure(list / create / batchImport / invalidate / detail / campaignFunnel)

**risk_level** · high
**size_hint** · medium
**priority** · 20
**depends_on** · ["US-019"]

**描述** · 作为前端开发者 · 我需要 6 个 invites procedure · 含 invalidate 走 Approval Gates。

**AC**(简化):

##### H 幸福路径
- [ ] H-1 · `apps/api/src/trpc/routers/admin/invites.ts` 6 procedure
- [ ] H-2 · `invalidate` 走 Approval Gates(super_admin 直批 stub)· 同 US-006 模式
- [ ] H-3 · `batchImport` · CSV 解析 + 批量插入(chunk 100 行)
- [ ] H-4 · `campaignFunnel` · 注册 → 激活 → 9 步完成 → D30 留存 全漏斗数据
- [ ] H-5 · 全 6 闸 middleware + audit

##### E 错误 / 边界
- [ ] E-1 · invalidate 已失效邀请码 · 抛 ValidationError
- [ ] E-2 · batchImport CSV 含重复 code · 抛 + 返回第 N 行错
- [ ] E-3 · batchImport 100k+ 行 · 限制 ≤ 10000 防 abuse

##### B 后端
- [ ] B-1 · 单元测试 20+ test
- [ ] B-2 · audit-approval-gates.ts 跑过 · invalidate 识别

##### P 前端
- [ ] P-1 · 无 UI(US-021)

**files_to_create** ·
- `apps/api/src/trpc/routers/admin/invites.ts`
- `apps/api/src/trpc/routers/admin/__tests__/invites.test.ts`

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`
- `scripts/audit-approval-gates.ts`(+ invites.invalidate)

**anti_patterns**:
1. **invalidate 不走 Approval** · 反例直接 update · 正例 super_admin 直批 stub · 同 US-006
2. **batchImport 无 chunk** · 反例 10k 行一次 insert · 正例 chunk 100

---

#### US-021 · 邀请码管理 UI page(列表 + 创建模态 + campaign Tab + 漏斗图)

**risk_level** · medium
**size_hint** · medium
**priority** · 21
**depends_on** · ["US-020"]

**描述** · 作为运营 · 我需要打开 admin.quanan.com/invites 看邀请码列表 + 创建按钮 + campaign 分组 Tab + 漏斗图。

**AC**(简化):

##### H 幸福路径
- [ ] H-1 · `apps/admin/src/pages/invites/index.tsx` 替换 placeholder
- [ ] H-2 · 顶部 · [待激活 / 转化率 / 各 campaign] 数字
- [ ] H-3 · 操作栏 · [创建] + [批量导入 CSV] + [导出]
- [ ] H-4 · 中部 · DenseTable 邀请码列表(可筛选 / 排序)
- [ ] H-5 · campaign 分组 Tab · 每 campaign 漏斗图
- [ ] H-6 · 详情抽屉 · 激活历史 + 用户 9 步进度
- [ ] H-7 · admin-routes.ts invites metadata.prd = "PRD-11"

##### E 错误 / 边界
- [ ] E-1 · 列表空 · 显示 "暂无邀请码 · 点击创建"
- [ ] E-2 · 批量导入 · 显示进度条 + 第 N 行错跳过

##### B 后端
- [ ] B-1 · 无新

##### P 前端
- [ ] P-1 · 浏览器打开 invites page · 看到列表 + 创建按钮
- [ ] P-2 · 点 [创建] · 模态 + 提交 → 列表新增
- [ ] P-3 · 点 [批量导入] · 文件选 + 提交 → 列表多行新增
- [ ] P-4 · 切 campaign Tab · 看到分组列表 + 漏斗图
- [ ] P-5 · 点邀请码 → 抽屉详情(激活历史)
- [ ] P-6 · console 0 error

**files_to_create** ·
- `apps/admin/src/pages/invites/index.tsx`
- `apps/admin/src/pages/invites/CreateInviteDialog.tsx`
- `apps/admin/src/pages/invites/BatchImportDialog.tsx`
- `apps/admin/src/pages/invites/CampaignFunnelChart.tsx`
- `apps/admin/src/pages/invites/InviteDetailDrawer.tsx`

**files_to_modify** ·
- `apps/admin/src/lib/admin-routes.ts`(invites metadata.prd = "PRD-11")
- 删 `apps/admin/src/pages/invites/placeholder.tsx`

**anti_patterns**:
1. **漏斗图 hardcode 4 阶段** · 反例 hardcode · 正例从 procedure 返回的 stages 数组渲染
2. **批量导入 progress 阻塞 UI** · 反例 主线程 parse 5s · 正例 Web Worker 或后端分 chunk

---

### 🟦 收官(1 US · US-022)

DenseTable.tsx 真实现 + admin-routes.ts metadata 更新到 PRD-11 + 6 placeholder 替换确认 + verify-prd-11.sh 全套包装。

---

#### US-022 · packages/ui/admin DenseTable 真实现 + admin-routes 更新 + verify-prd-11.sh

**risk_level** · high
**size_hint** · medium
**priority** · 22
**depends_on** · ["US-004", "US-007", "US-011", "US-013", "US-017", "US-021"]

**描述** · 作为开发者 · 我需要 1) DenseTable.tsx 真实现(虚拟滚动 + 列宽自定义 + 排序回调 + 行点击)· 2) 删 6 placeholder.tsx · 3) admin-routes.ts metadata.prd 全 PRD-11 更新 · 4) verify-prd-11.sh 包装 4 件套 audit + e2e。

**AC**:

##### H 幸福路径
- [ ] H-1 · `packages/ui/admin/DenseTable.tsx` 真实现(替换 PRD-10 stub):
  ```tsx
  import { useVirtualizer } from '@tanstack/react-virtual';
  import { type ReactNode } from 'react';

  export interface DenseTableColumn<T> {
    key: keyof T | 'actions';
    label: string;
    width?: number;
    sortable?: boolean;
    render?: (value: unknown, row: T) => ReactNode;
  }

  export interface DenseTableProps<T> {
    columns: DenseTableColumn<T>[];
    data: T[];
    loading?: boolean;
    onRowClick?: (row: T) => void;
    onSort?: (key: keyof T, dir: 'asc' | 'desc') => void;
  }

  export function DenseTable<T extends { id: number | string }>({ columns, data, loading, onRowClick, onSort }: DenseTableProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
      count: data.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 32, // dense mode row height
    });

    return (
      <div ref={parentRef} className="dense-table-container">
        {/* header + virtualized rows + loading skeleton */}
      </div>
    );
  }
  ```
- [ ] H-2 · `packages/ui/admin/package.json` add `@tanstack/react-virtual` dep + bump version
- [ ] H-3 · `packages/ui/admin/index.ts` export DenseTable + types
- [ ] H-4 · 删 6 placeholder.tsx(若仍存在):
  - `apps/admin/src/pages/nsm/placeholder.tsx`
  - `apps/admin/src/pages/users/placeholder.tsx`
  - `apps/admin/src/pages/accounts/placeholder.tsx`
  - `apps/admin/src/pages/cost/placeholder.tsx`
  - `apps/admin/src/pages/audit/placeholder.tsx`
  - `apps/admin/src/pages/invites/placeholder.tsx`
- [ ] H-5 · `apps/admin/src/lib/admin-routes.ts` 6 路由 metadata.prd 全部 = "PRD-11":
  ```typescript
  // 之前(PRD-10)
  { path: '/nsm', metadata: { prd: 'PRD-10 placeholder', priority: 'P0' } },
  // 之后(PRD-11)
  { path: '/nsm', metadata: { prd: 'PRD-11', priority: 'P0' } },
  ```
- [ ] H-6 · `scripts/verify-prd-11.sh` 新建 · 9 段 self-test(参考 PRD-10 verify-prd-10.sh):
  ```bash
  #!/usr/bin/env bash
  set -uo pipefail
  PASS=0; FAIL=0
  # 1. workspace check(pnpm-workspace.yaml)
  # 2. RLS 双向 check
  # 3. audit-redlines-admin.sh
  # 4. audit-admin-rls.ts AST
  # 5. 文件存在 check(6 业务页 / 5 dialog / 13+ component)
  # 6. 16 placeholder check(原 16 个 placeholder.tsx · 6 个已替换)
  # 7. 反例 grep check
  # 8. admin-integration check(/nsm /users /accounts /cost /audit /invites 6 URL 都 200)
  # 9. typecheck / lint check
  ```
- [ ] H-7 · chmod +x scripts/verify-prd-11.sh
- [ ] H-8 · 跑 `bash scripts/verify-prd-11.sh` · 看到 ≥ 25 PASS / 0 WARN / 0 FAIL

##### E 错误 / 边界
- [ ] E-1 · DenseTable 数据空 · 显示 "无数据"
- [ ] E-2 · DenseTable loading=true · 显示 5 行 skeleton
- [ ] E-3 · placeholder.tsx 已不存在(US-004/007/011/013/017/021 已删)· verify-prd-11.sh 不报错
- [ ] E-4 · admin-routes.ts metadata.prd 字段错(误改 prd-12 等)· verify 脚本 catch

##### B 后端
- [ ] B-1 · 无新后端 · 验证已有

##### P 前端
- [ ] P-1 · 浏览器打开 6 业务页 · 全部用 DenseTable · 列表大数据(1000+ 行)虚拟滚动流畅 60fps
- [ ] P-2 · DenseTable 排序回调 · 点列头 → 调 onSort → procedure 重发请求
- [ ] P-3 · DenseTable 行点击 · 调 onRowClick → 抽屉打开
- [ ] P-4 · 6 业务页 console 0 error
- [ ] P-5 · agent-browser 6 业务页截图全部保存

**files_to_create** ·
- `scripts/verify-prd-11.sh`

**files_to_modify** ·
- `packages/ui/admin/DenseTable.tsx`(真实现)
- `packages/ui/admin/index.ts`(+ DenseTable export)
- `packages/ui/admin/package.json`(+ @tanstack/react-virtual)
- `apps/admin/src/lib/admin-routes.ts`(6 路由 metadata.prd = "PRD-11")
- 删 6 个 placeholder.tsx

**anti_patterns**:
1. **DenseTable 不用虚拟滚动** · 反例 1000+ 行全 DOM 渲染 → 卡顿 · 正例 @tanstack/react-virtual
2. **admin-routes.ts metadata.prd 漏改** · 反例 1 路由忘改 · verify catch · PRD-10 E-1 协议
3. **verify-prd-11.sh skip 模式滥用** · 反例 fast mode skip 全部 · 正例 fast mode 仅 skip 慢的 e2e · keep 全部 静态 audit

---

## §2 · Acceptance Criteria 4 类总览

每个 US 必含 4 类 AC(不漏)· 这是 Coding 3.0 plan-check 2.6.11 闭环验收硬规则的直接落地:

### §2.1 H 幸福路径(Happy Path)

正常 input · 正常环境 · 预期结果 · 6 闸全经过 · audit 写入 · UI 真实展示。每 US 必须 ≥ 5 条 H AC。

### §2.2 E 错误 / 边界(Error / Edge)

异常 input · 越权 · 数据缺失 · 重复操作 · 边界值 · 自定义 Error 类型 · 不 silent 掉。每 US 必须 ≥ 3 条 E AC。

### §2.3 B 后端(Backend Tests + Audit Scripts)

单元测试覆盖率 ≥ 80% 核心 / ≥ 60% 整体 · audit script 跑过 0 命中 · typecheck 0 error · adminRLS bypass 用 `$transaction + SET LOCAL` pattern。每 US 必须 ≥ 3 条 B AC。

### §2.4 P 前端(Playwright / agent-browser)

仅 UI stories 必含 · agent-browser 真打开浏览器 · 验证 5 闭环要素:
1. URL 可达
2. 操作可发(点击 / 输入 / submit)
3. 运行时状态可观察(localStorage / DB / URL)
4. 刷新后状态保持
5. 错误路径明确断言

每 UI US 必须 ≥ 5 条 P AC。

---

## §3 · 范围排除(Non-Goals)

### §3.1 留 PRD-12 P9.2 内容审核

- 域 ⑦ TrendingItem 审核
- 域 ⑧ DeepLearning 审核

### §3.2 留 PRD-13 P9.3 健康度

- 域 ⑨ 进化档案监控
- 域 ⑩ Specialist Prompt 版本管理
- 域 ⑪ 配额 / 限流管理(UI · 现 PRD-11 仅建 user_quota 表关联)
- 域 ⑫ 行业合规仪表盘
- 域 ⑬ Approval Gates 完整闭环 UI(PRD-11 仅 stub super_admin 直批)

### §3.3 留 PRD-14 P9.4 高级域

- 域 ⑭ A/B 测试管理
- 域 ⑮ 知识库 / 静态常量管理
- 域 ⑯ 系统配置中心

### §3.4 留 PRR(Pre-Release Readiness)

- WAF Cloudflare 真启 · IP 白名单生产配置(PRD-11 仅 stub)
- MFA TOTP 真启 · super_admin 强制(PRD-11 仅 stub)
- 钉钉 webhook 真启 URL(PRD-11 仅 log)
- 邮件服务 SMTP 真启(PRD-11 reset password 仅 log)
- prod 部署 · 域名 admin.quanan.com · DNS / TLS / ICP 备案

### §3.5 1.0 不做

- 多租户 / 团队协作
- admin 自带 LLM Key
- 移动端 admin app
- 海外版 admin
- 公开 API 给 3rd party

---

## §4 · 风险

### §4.1 NSM 跨表聚合 SQL 慢(High)

**问题** · NSM 仪表盘需要 6 表 join(users / ip_accounts / step_data / feedback_log / evolution_profile / cost_log)· 实时跑 > 40s。
**缓解** · kpi_snapshots 预聚合表 + cron 1h(US-001/US-002)· 前端直接读 snapshot · 不实时跑。
**残余风险** · 数据延迟 1h(可接受 · NSM 是趋势指标 · 不需实时)。

### §4.2 详情抽屉 5 Tab 并发拉数据(Medium)

**问题** · 用户详情抽屉打开 · 5 Tab 数据(基本 / 活跃度 / 成本 / 审计 / 关联账号)· 串行 5s+ · 并行 200ms。
**缓解** · React Query parallel + Promise.all · 后端 procedure 一次返 5 个数据集 · 防 N+1。
**残余风险** · 抽屉打开 1 procedure 包含 5 表查 · 单 procedure 200ms-500ms 可接受。

### §4.3 CSV / PDF 导出大数据集 OOM(Medium)

**问题** · 100k+ 用户导出 / 5000+ trace 取证 PDF · 一次性 load → OOM。
**缓解** · CSV stream + chunk(US-008)· PDF 分页(US-014/US-018)· 后端限制 ≤ 500k 行 / ≤ 10k PDF 条目。
**残余风险** · 极端场景超大数据 · 显式 ValidationError 拒绝。

### §4.4 Approval Gates stub flow 漏审(High)

**问题** · PRD-11 阶段 super_admin 直批 stub · 实际只走 1 人 · LD-A-4 高风险 dual approval 待 PRD-13 升级。
**缓解** · stub 流程仍写 approval_requests + admin_audit_log · status='auto_executed' · PRD-13 可追溯。
**残余风险** · PRD-11~PRD-12 之间约 2 周窗口期 · super_admin 滥用风险 · 必须 super_admin 是可信角色(1 人或极少人)。

### §4.5 audit script coverage drift(Medium · 关 TD-039/042 教训)

**问题** · PRD-10 retro 发现 audit-admin-rls-tables.sh 漏验 8 admin model · 新加表后忘加 audit list → audit 假绿灯。
**缓解** · scripts/audit-self-test.sh(US-022 跑过)+ verify-prd-11.sh §1 显式 check(US-022 跑过)。
**残余风险** · 全机制化前仍需人工 review · 但 audit-self-test 已 catch 80%+ 漂移。

### §4.6 跨账号查询性能(Medium)

**问题** · users.list / accounts.list 跨账号查全表 · 5 万行 + filter → 500ms。
**缓解** · users / ip_accounts 已有 4+ admin index(US-005 + DATA-MODEL §1.10)· 必要时加更多 index。
**残余风险** · 50 万行可能需要 cursor pagination · 当前 limit/offset 仍 OK。

### §4.7 React Query cache 失效(Low)

**问题** · 改套餐后 detail 抽屉显示旧 plan · cache 不及时刷。
**缓解** · mutation `onSuccess` 调 `queryClient.invalidateQueries(['admin.users.detail', userId])` · 强制刷新。
**残余风险** · 抽屉关闭重开自动刷 · 不强求实时。

---

## §5 · 配额(预计)

### §5.1 22 US 总耗时估算

| US | 域 | 估时(daemon) |
|:-:|---|:-:|
| US-001 | ① NSM schema + SQL | 30-45 min |
| US-002 | ① cron job | 20-30 min |
| US-003 | ① 5 procedure | 35-50 min |
| US-004 | ① UI page | 50-70 min |
| US-005 | ② users 字段 | 15-25 min |
| US-006 | ② 5 procedure | 40-60 min |
| US-007 | ② UI page + drawer | 70-90 min |
| US-008 | ② CSV export | 20-30 min |
| US-009 | ③ schema + anomaly | 30-45 min |
| US-010 | ③ 6 procedure | 40-55 min |
| US-011 | ③ UI page | 55-75 min |
| US-012 | ④ 5 procedure | 35-50 min |
| US-013 | ④ UI page | 55-75 min |
| US-014 | ④ PDF export | 25-40 min |
| US-015 | ④ cost cron | 15-25 min |
| US-016 | ⑤ 5 procedure | 35-50 min |
| US-017 | ⑤ UI page | 55-70 min |
| US-018 | ⑤ PDF forensic | 25-35 min |
| US-019 | ⑥ schema | 15-25 min |
| US-020 | ⑥ 6 procedure | 35-50 min |
| US-021 | ⑥ UI page | 50-65 min |
| US-022 | 收官 DenseTable + verify | 50-65 min |
| **合计** |  | **800-1100 min(13-18h daemon time)** |

### §5.2 实际配置

- ralph daemon 总 token 估 ~600M(Sonnet · 22 US × 27M avg)
- audit 估 ~150M(Opus · 22 audit × 7M avg)
- 总 ~750M token · 估费用 ~$1500-$2000(per CLAUDE.md 全局成本追踪 cost-log.jsonl)
- 时间 · 13-18h daemon + 2-3h audit + 1-2h retry buffer = **18-24h 总 wall time**(分 3-5 日跑)

---

## §6 · 退出条件

### §6.1 ADMIN §8.3 P9.1 退出条件(权威源 · 行 1513)

- ✅ 6 个页面全部能展示真实数据(NSM / users / accounts / cost / audit / invites)
- ✅ 改套餐 + 封禁 + 邀请码作废全部走 Approval(stub 流程 · super_admin 直批)
- ✅ 财务能导出月度账单 PDF
- ✅ 法务能 trace 反查 + 取证 PDF 导出

### §6.2 Coding 3.0 流程退出条件

- ✅ 22 US 全部 `passes=true`(prd.json)· 0 blocked
- ✅ `pnpm typecheck` 0 error · `pnpm lint` 0 warning
- ✅ `pnpm test` 全过 · 覆盖率 ≥ 60% 整体 + ≥ 80% admin services
- ✅ `pnpm audit:redlines-admin` + `pnpm audit:admin-rls-tables` + `pnpm audit:admin-rls` + `pnpm audit:approval-gates` + `pnpm audit:self-test` **5 audit 全 0 命中**
- ✅ `bash scripts/verify-prd-11.sh` ≥ 25 PASS / 0 FAIL
- ✅ /goal-verify §0 GSD codebase mapper 跑 N 子项目(apps/web + apps/admin + apps/api + packages/{schemas,ui,clients})· 生成 .planning/codebase/ · 与 AGENTS §10 LD-A-1~5 对账 · 0 偏差(若有偏差登记 TD)
- ✅ /goal-verify §1+ Goal-backward 验证 · PRD-11 22 US 全 PASS · 覆盖率 100%
- ✅ /prd-retro 生成 §10 PRD-12 Playbook(P-X / N-X / E-X)
- ✅ 反例库 ~/.claude/playbooks/reject-examples.jsonl 新增条目(若 reject 发生)

### §6.3 git + branch 状态

- branch · `ralph/prd-11-p9.1-business-core-domains`
- 22 个 `feat: [US-NNN]` commit(每 US 一个 · ralph 自动)
- 1 个收官 `docs: [PRD-11] retro 收官 ...` commit
- main 不合并 · 等 PRD-12~14 收尾后整批合并(per ADMIN §8.7 严格串行方案 A)

---

## §7 · Locked Decisions(D-069 ~ D-078 · 10 LDs)

> **延续编号** · PRD-10 已用到 D-068 · PRD-11 从 **D-069** 起。

### D-069 · NSM 仪表盘走预聚合表 kpi_snapshots(不实时跑)

**理由** · 6 表 join 实时 > 40s · 用户体验差。
**实现** · `model KpiSnapshot @@unique([snapshotDate, granularity])` · cron 1h 写入。
**影响** · 数据延迟 1h(可接受 NSM 趋势)· 5 procedure 全部读 snapshot · 不跨 6 表。
**反例** · 不允许 `tx.user.count() + tx.ipAccount.count()` 实时聚合(US-003 reject 案例预防)。

### D-070 · cron pattern 显式时区(`tz: 'Asia/Shanghai'`)

**理由** · default UTC 跟中国凌晨混乱 · 1h vs daily 触发不对。
**实现** · BullMQ repeat 必含 `tz` 字段。
**影响** · 4 个 cron(kpi-snapshot daily/weekly/monthly + anomaly-detection + cost-anomaly)全显式。
**反例** · 不允许只写 `pattern: '0 * * * *'` 漏 tz。

### D-071 · 6 业务 procedure 全经 6 闸 + adminRLS bypass(`SET LOCAL`)

**理由** · LD-A-2 admin RLS DISABLE + 跨账号查询必经 RLS bypass · 防主应用 user 视角看不到他人。
**实现** · 每 procedure 内 `prisma.$transaction + executeRawUnsafe('SET LOCAL app.role = \\'admin\\'')`。
**影响** · 22 个 service 函数全模式 · 不允许直接 `prisma.user.findMany({})`。
**反例** · 不允许 `SET app.role = 'admin'`(global 泄漏)· 必须 `SET LOCAL`。

### D-072 · 高风险动作 Approval Gates stub(super_admin 直批)· PRD-13 升级完整

**理由** · LD-A-4 高风险必经审批 · 但 dual approval UI 留 PRD-13 完整实现。
**实现** · super_admin 直批 stub · 写 approval_requests `status='auto_executed'` + audit · admin 提申请 `status='pending'`。
**影响** · 5 mutation(changePlan / banUser / forceFreeze / invalidateInviteCode / 等)全 stub 模式。
**反例** · 不允许直接 mutate(漏 approval_requests 记录)。

### D-073 · admin_audit_log 写入 payloadHash SHA-256 防篡改

**理由** · LD-A-3 admin 审计 append-only · payloadHash 是法务取证防伪关键。
**实现** · `payloadHash = SHA-256(JSON.stringify(redact(payload)))` · redact 后 hash · 防 GDPR + 防篡改。
**影响** · 所有 audit 写入(US-003/006/010/012/016/020)· 6 procedure × 5+ mutation 全模式。
**反例** · 不允许只存原 payload 不 hash · 不允许 redact 前 hash(密码被 hash 进去违反 GDPR)。

### D-074 · readonly_admin 2 子模式(财务 + 法务)· 共享角色 + 不同 UI

**理由** · §3.3 共性 3 + LD-A-5 · readonly_admin 不是单角色 · 是 2 子模式。
**实现** · `actorMode in ['cs', 'reviewer', 'finance', 'legal']` 字段(admin_audit_log)· UI 按 mode 显隐功能。
**影响** · 6 UI page 全部 mode-aware · 财务模式隐藏改套餐 / 法务模式只看 audit + cost。
**反例** · 不允许 hardcode role check · 必须 mode 字段。

### D-075 · DenseTable 用 @tanstack/react-virtual(packages/ui/admin)

**理由** · 1000+ 行表格 DOM 全渲染卡顿 · virtual scroll 60fps。
**实现** · `useVirtualizer({count, getScrollElement, estimateSize: 32})`(dense mode row height 32px)。
**影响** · 6 业务 UI 全用 DenseTable · 不自己撸 div 假表格。
**反例** · 不允许 `data.map(row => <tr>...)` 全渲染。

### D-076 · CSV / PDF export 走 stream + chunk(防 OOM)

**理由** · 100k+ 用户 / 5000+ trace 一次 load 直接 OOM。
**实现** · CSV node stream + chunk 1000 · PDF 分页 50 条 / 页。
**影响** · users / cost / audit 3 大 export procedure 全模式。
**反例** · 不允许 `JSON.stringify(allData)` 全 load。

### D-077 · 钉钉 webhook / SMTP 默认 isMock=true · 真启走 .env.production

**理由** · 防 dev / staging 误发到真 prod webhook · 生产前必须显式配置。
**实现** · `service.isMock = process.env.DINGTALK_ENABLE !== 'true'` · log warning + 不真发。
**影响** · 钉钉(US-015 + ⑨ 进化告警留 PRD-13)+ SMTP(US-006 reset password)+ 未来 OAuth refresh。
**反例** · 不允许 hardcode webhook URL · 跟 PRD-10 OAuth multi-layer 一致。

### D-078 · admin-routes.ts metadata.prd 字段必更新(P-2 协议)

**理由** · 业务页落地协议 · sidebar 不动 + admin-routes 更新 + placeholder 删 三件事。
**实现** · 每 UI US AC 必含 H-7/H-6 `admin-routes.ts metadata.prd = "PRD-11"`。
**影响** · 6 UI US(US-004/007/011/013/017/021)+ 收官 US-022 verify。
**反例** · 不允许保留 "PRD-10 placeholder" 字符串 · verify-prd-11.sh §5 catch。

---

## §8 · 反例库注入(anti_patterns · 21+ entries · 6 类)

> **来源** · ~/.claude/playbooks/reject-examples.jsonl(全局反例库 · 跨 PRD)+ PRD-10 retro §8 反例库 + PRD-1~9 真案例。
> **注入流程** · ralph skill 转 prd-11.json 时按关键词 grep + 注入到对应 US 的 `anti_patterns` 字段(per SKILL.md anti_patterns 段)。

### §8.1 类别 1 · adminRLS bypass 漏 LOCAL=true(5 entries)

**关键词** · adminRLS · set_config · transaction · LOCAL · app.role
**注入到** · US-001 / US-003 / US-006 / US-010 / US-012 / US-016 / US-020(8 个 service / procedure 创建 US)
**核心反例** · `tx.$executeRawUnsafe("SET app.role = 'admin'")` 漏 LOCAL → 泄漏到下次连接 → 5% 后续主应用 user 也 bypass RLS → 数据泄漏。
**正例** · `tx.$executeRawUnsafe("SET LOCAL app.role = 'admin'")` · transaction 结束自动 reset。
**源** · PRD-1 US-006 reject + PRD-10 US-003 reject。

### §8.2 类别 2 · 6 闸 middleware 顺序错(3 entries)

**关键词** · 6 闸 · adminAuth · roleCheck · ipWhitelist · mfaCheck · approvalGateCheck · auditLog
**注入到** · US-003 / US-006 / US-010 / US-012 / US-016 / US-020
**核心反例** · 把 `ipWhitelist → adminAuth` 顺序倒(没鉴 admin 身份就过 IP 白名单 · 实际 IP 攻击者能绕)。
**正例** · `adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → auditLog`(顺序硬约束)。
**源** · PRD-10 US-003 reject + ADMIN §7.1 6 闸链 spec。

### §8.3 类别 3 · audit 写入漏 redact 敏感字段(3 entries)

**关键词** · audit · payload · password · token · apiKey · redact · GDPR
**注入到** · US-003 / US-006 / US-010 / US-012 / US-016 / US-020(audit 写入 5 procedure)
**核心反例** · `payload: JSON.stringify(input)` 直接 dump 含 password → admin_audit_log 永久存 → GDPR 违规。
**正例** · `payload: redact(input, ['password', 'token', 'apiKey', 'secret']) + payloadHash = SHA-256(redacted)`。
**源** · PRD-9 US-014 reject + LD-A-3 admin 审计 append-only 但 redact 必做。

### §8.4 类别 4 · Approval Gates 漏触发 / 漏记录(3 entries)

**关键词** · Approval · changePlan · banUser · forceFreeze · invalidate · high_risk_action
**注入到** · US-006 / US-010 / US-020
**核心反例** · changePlan / banUser 直接 `prisma.user.update({})` · 漏写 approval_requests · LD-A-4 违反。
**正例** · 全部走 approval.service.ts · super_admin 直批 stub 仍写 approval_requests `status='auto_executed'`。
**源** · ADMIN §7.6 高风险动作清单 + ADR-016 Approval Gates。

### §8.5 类别 5 · Recharts UI 渲染问题(3 entries)

**关键词** · Recharts · FunnelChart · BarChart · PieChart · fill · color · var
**注入到** · US-004 / US-011 / US-013
**核心反例** · 漏 `fill: 'var(--accent-purple)'` · Recharts 默认色乱 / 不符 Aurelian Dark · CSS Var 未定义(`var(--accent-violet)` 未定义)。
**正例** · 每条 data 含 fill: `var(--xxx)`(tokens.css 已定义)· 见 packages/ui/admin/tokens.ts。
**源** · PRD-6 US-025 reject + plan-check 2.6.7 CSS Var 对齐。

### §8.6 类别 6 · 跨表查询性能 / 防 OOM(4 entries)

**关键词** · N+1 · Promise.all · chunk · stream · OOM · pagination
**注入到** · US-006(detail 5 Tab)/ US-008(CSV)/ US-014(PDF)/ US-016(audit byTraceId)
**核心反例 1** · `for user of users: await prisma.ipAccount.findMany(...)` N+1 查询 · 5s+。
**正例 1** · `await Promise.all(users.map(u => prisma.ipAccount.findMany({where: u.id})))` 或 `prisma.user.findMany({include: {ipAccounts}})`。
**核心反例 2** · `await prisma.user.findMany({})` 100k 行 → OOM。
**正例 2** · prisma stream + chunk 1000。
**源** · PRD-3 US-018 reject + [重构:PRD-8 语音 US 已删,N+1 反例上下文参考历史]。

---

## §9 · 修订记录

| 版本 | 日期 | 修订人 | 内容 |
|:-:|---|---|---|
| v0.1 | 2026-05-12 | Claude(Opus 4.7)| seed 文档 · 22 US · 6 P0 业务核心域 + 1 收官 · D-069~078 10 LD · 21+ anti_patterns 6 类 |

---

## §10 · Coding 3.0 协同(本 PRD 跟全局工作流的交接点)

### §10.1 启动前置(Coding 3.0 Step 5 之前)

1. **prd skill** · 已写本文(seed 详细度优先)· tasks/prd-11.md
2. **ralph skill** · 转 prd.json · 注入 anti_patterns(21+ entries)+ depends_on 严格按 §1 declarations + risk_level 升档(US-001 foundation · downstream 6 stories)
3. **/plan-check** · 验证 prd-11.json · 7 项门禁(结构 + AC 4 类 + W-patches 预埋 + anti_patterns 覆盖率 + audit script self-test + admin-routes.ts metadata 协议)
4. **scripts/audit-self-test.sh** · PRD-11 启动前跑过 · 0 FAIL(或 explicit 接受 known issues)

### §10.2 启动 SOP(项目 CLAUDE.md §9.1 5 步)

```bash
# Step 1 · 确认 prd.json + status
ls scripts/ralph/prd-11.json
python3 scripts/ralph/ralph-tools.py status

# Step 2 · ★ 先启 Monitor(persistent · session-only · 必先于 daemon)
# 命令模板 · 详项目 CLAUDE.md §9.1.2

# Step 3 · cp prd-11.json → prd.json + 启 daemon
cp scripts/ralph/prd-11.json scripts/ralph/prd.json
/Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon

# Step 4 · 等 Monitor 通知 PENDING_DETECTED:US-NNN

# Step 5 · 审完 → approve / reject → ralph 自动继续
```

### §10.3 审计 SOP(Step 5.5)

每个 PENDING_DETECTED:US-NNN · Opus 主对话:
1. 读 `~/.claude/scripts/ralph/OPUS-AUDIT-CHEATSHEET.md`(5 步)
2. 按 risk_level 分档:
   - **foundation** (US-001) · §0 4 实测 + 通用 4 维度 + 全部域 grep + 跨 story 命名核对 + 下游 AC 依赖检查
   - **high** (US-003/004/006/007/010/011/012/013/016/017/020/022)· §0 + 通用 + 全部域 grep + line-by-line + SQL 实测
   - **medium** (US-002/005/008/009/014/015/018/019/021)· §0 + 通用 + 3-5 grep
   - **low** (无)
3. approve / reject · 用 REJECT-TEMPLATE 含 ★ 反例 + 验证方式
4. cross-check `ralph-tools.py audit-status` timestamp 防 stale session(RCA-005)

### §10.4 收官(Coding 3.0 Step 7~8)

1. **/goal-verify** · §0 GSD codebase mapper 跑 N 子项目 · 与 AGENTS §10 对账 · 偏差登记 TD · §1+ Goal-backward · ADMIN §8.3 退出条件对账
2. **/prd-retro** · 16 章节 · §10 PRD-12 Playbook · §11 归因占比 · §13 Skill 升级 diff(若有)
3. **commit** · `docs: [PRD-11] retro 收官 · 22/22 US · ...`

### §10.5 反例库回流

`/prd-retro` §11 文档回流 · 把 PRD-11 实际产生的反例(若 reject)写到 `~/.claude/playbooks/reject-examples.jsonl` · 跨 PRD 跨项目复用。
若 0 reject · 仍写本 PRD 7+ 新 Codebase Patterns 到 `~/.claude/playbooks/codebase-patterns.jsonl`(若全局有此机制 · 或仅 progress.txt 累加)。

---

## §11 · PRD-12~14 接入预备

### §11.1 PRD-12 P9.2(2 内容审核域 · 2 周)

**域 ⑦ TrendingItem 审核** · 入库前 review_queue + 违禁词 + 5 平台监控 + 抽样人审。
**域 ⑧ DeepLearning 审核** · 上传前 review_queue + PII + 抽样 + 用户违规累计。

**PRD-11 → PRD-12 接入点**:
- admin_audit_log 中间件 · 复用 PRD-10 写入逻辑 + PRD-11 4 eventType(扩展加 `trending_review` / `deep_learn_review`)
- 6 闸 middleware · 复用 + 加 `roleCheck.reviewerMode`
- DenseTable · 复用 packages/ui/admin
- ApprovalGates · super_admin 直批 stub · 同 PRD-11 模式
- 反例库 · PRD-11 6 类反例继承 + 加内容审核类(PII 误伤 / 抽样比例 / 违禁词库管理)

### §11.2 PRD-13 P9.3(5 健康度域 · 2 周)

**域 ⑨~⑬** · 进化 + Prompt 版本 + 配额 + 合规 + Approval Gates 完整 UI。

**PRD-13 关键 · Approval Gates 完整 UI 升级**:
- PRD-11 stub super_admin 直批 → PRD-13 完整 dual approval UI + 待审批列表 + 详情抽屉 + 二次审批 + 紧急通道 + 后置 24h 复核 cron
- PRD-11 5 mutation 触发 trigger 全部 enabled · 不需改 trigger 代码 · 只补 UI

**PRD-13 关键 · Prompt 版本管理(域 ⑩)是 P9.3 最复杂域**:
- Monaco 编辑器 / Diff 视图 / LLM Judge CI 集成 / canary 分流(按 user_id hash)
- 接 LLM Gateway 灰度逻辑(主应用 PRD-1~9 实现)

### §11.3 PRD-14 P9.4(3 高级域 · 1 周)

**域 ⑭⑮⑯** · A/B 测试 + 知识库 + 系统配置中心。

**PRD-14 是 P2** · 可压后续版本 · 1.0 上线后单独评估。

---

> **本 PRD 由 Claude(Opus 4.7)在 PRD-11 启动期写 · 2026-05-12 · 跟全局 CLAUDE.md + 项目 CLAUDE.md + ADMIN-ARCHITECTURE.md + DATA-MODEL.md + AGENTS.md 互补使用。**
> **下一步** · 用户 review PRD-11 → ralph skill 转 prd-11.json → /plan-check → 启 daemon。
