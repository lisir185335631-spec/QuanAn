# PRD-13 · P9.3 P1 健康度域(5 子域 · 12 US)

> **派生** · ADMIN-ARCHITECTURE.md §3.5(5 P1 域)+ §8.5(P9.3 实施)+ DATA-MODEL §13.3-13.6 + AGENTS §10
> **范围** · evolution 进化档案 ⑨ + prompt 版本 ⑩ + quota 配额 ⑪ + compliance 合规 ⑫ + Approval Gates ⑬(★ 横切机制)
> **依赖** · PRD-10 admin foundation 7 patterns + PRD-12 13 patterns + reject-examples.jsonl 41+ 条
> **Locked Decisions** · D-089 起延续(PRD-12 D-079~D-088 收官)
> **预估** · 12 US · 8-12h wall time · 一轮通过率 88-93%(PRD-12 retro §12.2)· 新 TD 3-5(brownfield 改造预留)
> **作者** · Claude(Opus 4.7)· 2026-05-14
> **版本** · v0.1

---

## §0 · 引用清单(必读 · 启动 PRD-13 前)

### §0.1 战略骨架文档

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 1 | ADMIN-ARCHITECTURE.md §3.5 P1 健康度判断(5 域) | 544-602 | ⑨~⑬ 子域核心 KPI + 关键交互 + UI 骨架 + Prisma 新表 |
| 2 | ADMIN-ARCHITECTURE.md §8.5 P9.3 实施路线图 | 1526-1583 | 子域权重(⑨ 0.4w / ⑩ 0.6w / ⑪ 0.4w / ⑫ 0.3w / ⑬ 0.3w → 实际 0.5-0.6w)|
| 3 | ADMIN-ARCHITECTURE.md §4.4 Approval Gates(对应 ADR-016) | 807-906 | 高风险动作清单 + dual approval 触发条件 + 紧急通道协议 |
| 4 | ARCHITECTURE.md §9.11-E.4 LLM-as-Judge 配置 | (需查)| Prompt 评分 100 金标准 + 阈值 4.0 |
| 5 | ARCHITECTURE.md §9.11-C 配额定义 | (需查)| Free 50 / Pro 500 / Enterprise 5000 套餐 |
| 6 | ARCHITECTURE.md §9.11-D 行业合规规则 | (需查)| 医疗 / 法律 / 金融自动免责 + PII 脱敏(域 ⑫ 数据源)|

### §0.2 ADMIN 子系统硬约束(必读)

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 1 | AGENTS.md §10 admin LD-A-1~5 | (需查)| ★ 5 LD-A 红线 · LD-A-5 内容审核硬闸门类比扩展到 ⑨/⑩/⑪ 强制重跑 / publish / adjust |
| 2 | AGENTS.md §11 audit script 4 件套 | (需查)| audit-redlines / audit-ld / audit-redlines-admin / audit-admin-rls-tables / audit-admin-rls |
| 3 | ADR-016 Approval Gates 设计 | (需查)| 横切机制 · ⑬ 是其完整 UI 实现 |
| 4 | ADR-018 EvolutionAgent 外部 orchestrator | (需查)| ⑨ 强制重跑批走 EvolutionAgent · 不在 specialists 内部 self-loop |

### §0.3 数据层必读章节

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 1 | DATA-MODEL.md §13.3 approval_requests | 2966-3013 | ★ PRD-13 升级核心 · stub 三态 → dual-approval 完整版 |
| 2 | DATA-MODEL.md §13.4 prompt_versions + prompt_canary_config | 3014-3080 | ⑩ 域 2 张新表 schema |
| 3 | DATA-MODEL.md §13.5 user_quota + quota_adjustment_log | 3081-3152 | ⑪ 域 2 张新表 schema |
| 4 | DATA-MODEL.md §13.6 F · evolution_anomaly_flags | 3378-3399 | ⑨ 域 1 张新表 schema |
| 5 | DATA-MODEL.md §6.3 EvolutionProfile + §6.4 EvolutionInsight | 1392-1517 | ⑨ 数据源 · L1-L5 分布 + 飞轮停滞算法 |
| 6 | DATA-MODEL.md §9 RLS 策略(admin 13 表 DISABLE) | 2181-2860 | 6 张新表全 RLS DISABLE(super_admin 跨账号查) |

### §0.4 PRD-12 收官交付物(直接复用)

| # | PRD-12 产出 | 引用方式 |
|:-:|---|---|
| 1 | 7 闸链 adminProcedure(50 procedure 模板) | P-1 复用 · 5 域所有 procedure 直接 fork |
| 2 | DenseTable + Drawer + Recharts + admin-routes:13 协议 | P-2 复用 · 22 components fork(评分卡 / 行业饼图 / 时间趋势 / 详情抽屉) |
| 3 | audit script 4 件套 + LD-A-5 multi-layer 7 grep 模板 | P-3 复用 · 加 ⑨/⑩/⑪ 域专项 grep(force_rebuild / publish_prompt / adjust_quota 红线) |
| 4 | _createXxxInTx single-source 抽象(US-004/009 原创) | ★ P-6 复用 · 5 域全用(_forceRebuildEvolutionInTx / _publishPromptVersionInTx / _adjustQuotaInTx) |
| 5 | redacted text 深度防御(PII + banned-word + audit) | P-3.2 复用 · ⑩ Prompt 内容 + ⑫ 合规事件 audit log 全跑 |
| 6 | BullMQ cron jobId dedup + tz=Asia/Shanghai | P-4 复用 · ⑫ compliance=06:00 错峰(KPI=00 / cost=15 / anomaly=05 / violation=04)|
| 7 | D-077 isMock=true 默认 + D-082 强 PII 强制 auto_rejected | P-5 复用 · ⑩ LLM Judge CI stub 默认 isMock |
| 8 | 反例库 41+ 条 reject-examples.jsonl 注入 anti_patterns | P-7 复用 · ralph skill 自动检索 · 5 域 anti_patterns 段渲染 |

### §0.5 PRD-12 retro §11 Playbook 严格执行

按 `.agents/retros/prd-12-vs-prd-11-retrospective.md` §10/§11:

**P-X 必做(9 条 · 高 ROI)**:
- P-1 ~ P-7 见 §0.4
- **P-8 ★ ⑩ Prompt 版本管理拆 ≥ 2 子 US**(实际拆 3:schema+publish/rollback / Monaco UI / 灰度+LLM Judge)
- P-9 Opus audit Diff-2 git stash confirm pre-existing 严格(防 React 19 双版本类 TD-054)

**N-X 不做(5 条 · 防过度乐观)**:
- N-1 ★ brownfield 域 LD-A-5 严格 0 命中**不预期**(域 ⑨/⑩ 涉及 evolution-agent + 14 Specialist 现有代码 · 预留 TD 时间)
- N-2 ★ ⑬ Approval Gates 完整 UI **0.3 周不够**(实际 0.5-0.6 周 · 因 dual + 紧急 + 后置复核)
- N-3 不依赖 prd skill 自动检索反例库(brownfield 类反例 Opus 手动注入)
- N-4 不接入真 LLM Judge CI(⑩ isMock 默认 · 留 PRR · GitHub Actions / Vercel cron)
- N-5 不期望 PRD-13 0 PATH-B(brownfield + ECONNRESET 概率高)

**E-X 实验(5 条 · 新模式探索)**:
- E-1 ⑩ Monaco 编辑器接入(新 dep `@monaco-editor/react`)
- E-2 ⑨ 强制重跑批走 dual-approval 完整 UI(第一次真接入)
- E-3 ⑪ BullMQ delayed job 24h 失效(跟当前 cron 模式不同)
- E-4 ⑫ @react-pdf/renderer 复用 PRD-11 但模板比成本账单复杂
- E-5 ⑬ stub 三态机 → 完整 dual approval backward compat 路径

### §0.6 全局 skill Diff(本 PRD 启动时已 apply)

PRD-12 retro §13 已 apply 1 Skill 升级 Diff 到全局 ~/.claude:
- **Diff-4** · `~/.claude/commands/plan-check.md` §2.6.16 单点函数抽象检查(M-1 · ⑨ forceRebuild + ⑩ publish + ⑪ adjust 必经此 plan-check)

---

## §1 · 12 User Stories(分 5 子域 + 1 收官)

### 🟦 域 ⑨ · Evolution 进化档案监控(3 US · US-001~003)

★ **数据演进生命线** · evolution_profile + evolution_insight 已就位(PRD-9 P8 知识库)· 本 PRD 加 admin 监控视角 + 异常检测 + 强制重跑批。**关键**:US-001 修 TD-056 是评估前置(DailyTaskAgent US-007 真版本 296 行 0 unit test · evolution 域质量 safety net)。

---

#### US-001 · 修 TD-056 · DailyTaskAgent US-007 真版本 unit test 4 场景覆盖

**描述** · 作为开发者,我需要为 `apps/api/src/agents/specialists/DailyTaskAgent.ts`(296 行 · US-007 真实施)补全 unit test,以便 evolution 域 L5 agent 修改 / refactor 有 safety net。当前 stub-test 已随 stub 文件删除(commit 04a362c)· 真版本完全 0 unit test 覆盖 · AC-1 冷启动 / AC-10 cost_log eventType=l5_agent / schema retry / AbortError 全无回归保障。

**Risk** · foundation(downstream = evolution-agent worker + L5 batch · 影响后续 ⑨ 异常检测算法依赖 evolution_profile 数据正确性)

**Acceptance Criteria(13 条)**:

[H 闭环验收]
- [ ] `tests/unit/agents/specialists/DailyTaskAgent.test.ts` 新建 · ≥ 4 describe block 覆盖 4 核心场景:
  - **冷启动**(stepCount=0 OR evolutionProfile=null)→ `buildColdStartTasks()` 5 模板 tasks · isFallback=false · modelUsed='cold-start-template'
  - **非冷启动 LLM 调用** → `llmGateway.complete({model_tier:'lightweight', timeout_ms:30000})` 实际触发 · metadata `eventType: 'l5_agent'` · returns parsed DailyTaskOutput
  - **schema 校验 retry** → 第一次 invokeLLM 返 invalid content → retry 1 次 → 第二次 OK · 总 invokeLLM 2 次
  - **AbortError → LLMTimeoutError** → invokeLLM throws Error with name='AbortError' → 转 `LLMTimeoutError` 类型
- [ ] 4 场景每个至少 1 `it()` 用 `expect()` 断言

[E 实施验证]
- [ ] fake `ILLMGateway` 实现 · `vi.fn()` mock `complete()` 返回 DailyTaskOutput shape:
  ```typescript
  const mockGateway: ILLMGateway = {
    complete: vi.fn().mockResolvedValue({
      content: { tasks: [/* 3-5 valid task items */] },
      tokens: { prompt: 100, completion: 200, total: 300 },
      model: 'lightweight-mock',
    }),
  };
  ```
- [ ] prisma mock 用 `vi.mock('@/lib/prisma')` · `stepData.count` + `evolutionProfile.findUnique` 各 mock
- [ ] contextAssembler mock 用 `vi.mock('@/services/context-assembler/ContextAssembler')`

[B 边界 / 失败路径]
- [ ] 冷启动 5 模板任务结构验证 · 每 task 必含 `ctaUrl` 以 `/` 开头 · `estimatedMinutes` ∈ [5, 30] · `difficulty` ∈ ['easy', 'medium', 'hard']
- [ ] LLM 第二次 retry 仍失败 → throws `SchemaValidationError`(不再 retry · AC-1 规定 retry max 1)
- [ ] 输入 schema 校验 fail(accountId 缺 / taskDate 非 YYYY-MM-DD)→ `inputSchema.parse()` throw ZodError

[P pre-existing 兼容]
- [ ] **不影响**任何现有 specialists 测试(只新加 file · 不改动 specialists/*.ts)
- [ ] **不影响** workers/daily-task/worker.ts(只测 agent · 不测 worker 调用链)
- [ ] pnpm test · ≥ 1551 pass(基线 1549 + 本 US ≥ 2 新 tests)· 0 fail · 0 skip(新加 4 it)
- [ ] pnpm typecheck · 0 errors
- [ ] TD-056 状态 `open` → `resolved` · `.agents/tech-debt.json` 更新

**files_to_create**:
- `tests/unit/agents/specialists/DailyTaskAgent.test.ts`(≥ 200 行 · 4 describe + 11+ it)

**files_to_modify**:
- `.agents/tech-debt.json`(TD-056 → resolved)

**test_command** · `pnpm vitest run tests/unit/agents/specialists/DailyTaskAgent.test.ts`

**size_hint** · medium(单文件 + mock 编写 ~ 5-7 files include + 200-250 行 test code)

---

#### US-002 · approval_requests 升级 stub→dual-approval 完整版 service + emergency + 24h 复核 cron

**描述** · 作为 admin/super_admin,我需要 approval_requests 表跟 service 升级到完整版 dual-approval 工作流,以便后续 5 子域(⑨ forceRebuild / ⑩ publish / ⑪ adjust > 500 / ⑫ 模板修改 / ⑬ ban_uploader)所有高风险动作都走两步审批闸门。当前 PRD-10/11/12 是 stub 三态(pending/approved/rejected · 单人 approve)· **完全没有 dual approval 校验 + 紧急通道 + 24h 后置复核机制**。

**Risk** · foundation(downstream = US-004/006/007/008/009/010/011 全部依赖 + 横切机制)

**Acceptance Criteria(15 条)**:

[H schema 升级]
- [ ] `prisma/schema.prisma` ApprovalRequest 模型扩展(+ 6 字段):
  ```prisma
  model ApprovalRequest {
    // ... 已有字段(PRD-10/11 stub)
    /// dual approval 需要(高风险动作 · §7.5 协议锁)
    requireDualApproval Boolean  @default(false)
    /// 第二审批人(super_admin · 仅 dual 时填)
    secondApproverAdminId Int?
    secondApprovedAt    DateTime?
    /// 紧急通道(super_admin 单人快速批 · 须带 incident_id)
    emergencyMode       Boolean  @default(false)
    emergencyIncidentId String?   // 必填 if emergencyMode=true
    /// 24h 后置复核(emergencyMode=true 时必走)
    postReviewRequired  Boolean  @default(false)
    postReviewedAt      DateTime?
    postReviewerAdminId Int?
    postReviewResult    String?  // 'confirmed' | 'overturned' | 'partial'

    @@index([requireDualApproval, status])
    @@index([emergencyMode, postReviewRequired])
    @@index([postReviewRequired, postReviewedAt])
  }
  ```
- [ ] migration `pnpm prisma migrate dev --name prd-13-approval-dual` 成功

[H service 升级]
- [ ] `apps/api/src/services/admin/approval/approvalGateService.ts` 升级 `requestApproval()` 接受新参数:
  ```typescript
  export async function requestApproval(params: {
    actionType: ApprovalActionType;  // 见 D-094 触发清单
    requesterAdminId: number;
    requesterRole: 'admin' | 'super_admin' | 'system';
    actionPayload: Prisma.InputJsonValue;
    riskLevel: 'low' | 'medium' | 'high';
    requireDualApproval?: boolean;  // 默认按 D-094 actionType 推导
    emergencyMode?: boolean;
    emergencyIncidentId?: string;  // emergencyMode=true 时必填
  }): Promise<ApprovalRequest>;
  ```
- [ ] `approveRequest(approverAdminId, requestId)` 升级 dual approval 逻辑:
  - 若 `requireDualApproval=false` → 单人批 status='approved' + decidedAt + approverAdminId
  - 若 `requireDualApproval=true` + 第一次批 → status 保持 'pending' + 写 approverAdminId/decidedAt + 等第二人
  - 若 `requireDualApproval=true` + 第二次批 → **强校验** `approverAdminId !== firstApproverAdminId`(申请人 ≠ 审批人 · 审批人不能两次批同一请求)→ status='approved' + secondApproverAdminId/secondApprovedAt

[E 紧急通道]
- [ ] `emergencyApprove(requestId, superAdminId, incidentId)` 仅 super_admin 调 · `emergencyMode=true && emergencyIncidentId 必填` · 立即 status='approved' + 自动写 `postReviewRequired=true`
- [ ] emergencyApprove 自动写 admin_audit_log eventType='emergency_approval' · eventCategory='security_alert' · 必含 incident_id
- [ ] 申请人 != super_admin 时 emergencyApprove throws `FORBIDDEN_EMERGENCY_NOT_SUPER_ADMIN`

[E 24h 后置复核 cron]
- [ ] `apps/api/src/jobs/admin/emergency-post-review.job.ts` BullMQ cron `0 30 3 * * *`(Asia/Shanghai 03:30)· jobId='emergency-post-review-recurring'
- [ ] cron 扫 `postReviewRequired=true && postReviewedAt=null && decidedAt < NOW() - 24h` → 写 admin_audit_log eventType='post_review_overdue' · 钉钉通知(D-077 isMock 默认)
- [ ] `postReviewApprove(requestId, reviewerAdminId, result)` 设 `postReviewedAt + postReviewerAdminId + postReviewResult` · 校验 `reviewerAdminId !== firstApproverAdminId`(不能复核自己批的)

[E 单点函数 P-6 抽象]
- [ ] `_approveRequestInTx(tx, requestId, approverAdminId, isSecondApproval)` 单点 transactional approve 函数 · 7 调用点全走它:
  - `approveRequest()` × 2(第一批 / 第二批)
  - `emergencyApprove()`
  - `postReviewApprove()`
  - violation-detection.service.ts 自动 ban(继承 PRD-12 US-012)
  - 5 子域 admin tRPC 批准 procedure(US-004/006/007/008/009/010/011 后续接入)

[P pre-existing 兼容]
- [ ] **不破坏** PRD-10/11/12 已有 approval_requests 使用(stub 三态机自动按 `requireDualApproval=false` 旧行为)
- [ ] pnpm audit:redlines / audit:ld / audit:redlines-admin · 0 命中(尤其 LD-A-3 redacted approval_request action 不暴露密码 / token / 隐私 PII)
- [ ] pnpm test · ≥ 1555 pass(基线 1551 + US-001 ≥ 2 + 本 US ≥ 8 新 tests · 含 dual approval + emergency + post-review)· 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/api/src/jobs/admin/emergency-post-review.job.ts`(~ 90 行)
- `tests/unit/api/admin/approval-gate-dual.test.ts`(~ 200 行)

**files_to_modify**:
- `prisma/schema.prisma`(ApprovalRequest 加 6 字段 + 3 index)
- `apps/api/src/services/admin/approval/approvalGateService.ts`(升级 requestApproval / approveRequest + 新 emergencyApprove + postReviewApprove + _approveRequestInTx 单点)
- `apps/api/src/jobs/index.ts`(注册 emergencyPostReviewWorker · 启动时 scheduleEmergencyPostReview())

**test_command** · `pnpm vitest run tests/unit/api/admin/approval-gate-dual.test.ts`

**size_hint** · medium(单 service 升级 ~ 8 files include + migration · 不动 UI)

**anti_patterns**(从 reject-examples.jsonl 注入):
- **lesson** · "cron schedule wire 严格 · ralph 自己 instance 化 BullMQ Worker/Queue 后必在 jobs/index.ts 启动时 schedule" · **antipattern** · `// TODO: schedule in production` 而不 wire · **correct** · `await scheduleEmergencyPostReview()` 在 jobs/index.ts startupRegisterAllWorkers() 内调
- **lesson** · "approval_requests 改 schema 必须 backward compat · 旧 stub 三态机继续 work" · **antipattern** · 把 `requireDualApproval` 字段 nullable 不带 default `false` · **correct** · 必 `@default(false)` · 旧记录自动 `false` 走旧行为
- **lesson** · "dual approval 必须强校验申请人 ≠ 审批人 · 第二审批人 ≠ 第一审批人" · **antipattern** · 只校验 requesterAdminId · 不校验 approverAdminId · **correct** · approveRequest 内 `if (approverAdminId === firstApproverAdminId) throw FORBIDDEN_SAME_APPROVER` + 同样校验 postReview

---

#### US-003 · prompt_versions + prompt_canary_config schema + service + publish/rollback + Approval 接入

**描述** · 作为 super_admin,我需要把 14 Specialist 的 prompt 内容入库管理 · 支持版本化(draft/active/archived)、灰度发布(0/1/10/50/100%)、一键回滚 · 所有 publish/rollback 操作走 dual-approval(继承 US-002)。当前 14 Specialist prompts 写死在代码 `apps/api/src/services/context-assembler/templates/*.ts` 文件内 · **无法运行时切换** · **改 prompt 必须重新部署** · 灰度根本做不到。

**Risk** · foundation(downstream = US-007 Monaco + US-008 灰度 · 直接影响 ⑩ 子域整个开发)

**Acceptance Criteria(14 条)**:

[H schema]
- [ ] `prisma/schema.prisma` 新增 PromptVersion 模型(per DATA-MODEL §13.4):
  ```prisma
  model PromptVersion {
    id              Int      @id @default(autoincrement())
    specialistId    String   // 'EvolutionAgent' | 'DailyTaskAgent' | 'PositioningAgent' | ...(14 个)
    mode            String   // 'default' | 'step5' | 'free' | 'boom' | 'acquisition'(Copywriting 等 4 mode Specialist)
    version         Int      // 自增版本号 per specialistId+mode
    content         String   @db.Text  // 完整 prompt 文本 · LD-A-3 redacted text 跑 PII + banned-word 扫描
    judgeScore      Decimal? @db.Decimal(3, 2)  // 0.00 - 5.00 · LLM Judge 100 金标准评分
    status          String   // 'draft' | 'pending_review' | 'active' | 'archived'
    createdByAdminId Int
    createdAt       DateTime @default(now())
    approvedByAdminId Int?
    approvedAt      DateTime?

    @@unique([specialistId, mode, version])
    @@index([specialistId, mode, status])
    @@index([status, createdAt(sort: Desc)])
    @@map("prompt_versions")
  }

  model PromptCanaryConfig {
    id              Int      @id @default(autoincrement())
    specialistId    String   @unique
    mode            String   @default("default")
    currentVersionId Int     // FK to prompt_versions.id (status='active' · 主版本)
    nextVersionId   Int?     // FK to prompt_versions.id (灰度新版本)
    canaryPct       Int      @default(0)  // 0/1/10/50/100 · D-090 5 档
    strategy        String   @default("user_id_hash")  // 'user_id_hash' | 'random' | 'whitelist'
    updatedAt       DateTime @updatedAt

    @@index([specialistId, mode])
    @@map("prompt_canary_config")
  }
  ```
- [ ] migration `pnpm prisma migrate dev --name prd-13-prompt-versions` 成功 · 14 Specialist × 1 default mode 各 seed 1 row(content 拷自现有 `templates/*.ts`)

[H service]
- [ ] `apps/api/src/services/admin/prompt-version/prompt-version.service.ts` 新建:
  ```typescript
  // ★ P-6 单点函数 · publish/rollback/canary 唯一入口
  export async function _publishPromptVersionInTx(
    tx: Prisma.TransactionClient,
    params: {
      versionId: number;
      adminId: number;
      approvalRequestId: number;  // 必须先经 Approval Gates dual approval
    }
  ): Promise<void>;

  export async function publishPromptVersion(versionId: number, adminId: number): Promise<{ approvalRequestId: number }>;
  // → 内部:校验 status='pending_review' + judgeScore >= D-091(4.0)+ 触发 requestApproval(requireDualApproval=true) · 返 approvalRequestId

  export async function rollbackPrompt(specialistId: string, mode: string, adminId: number): Promise<{ approvalRequestId: number }>;
  // → 把 current active 版本改 status='archived' · 找上一最新 active(按 version DESC 第一个 status='archived' 的)恢复 · 走 dual approval

  export async function updateCanaryConfig(specialistId: string, nextVersionId: number, canaryPct: 0 | 1 | 10 | 50 | 100): Promise<void>;
  // → 校验 canaryPct ∈ [0, 1, 10, 50, 100] · canaryPct=100 触发 publishPromptVersion(nextVersionId)
  ```

[E 灰度策略]
- [ ] `getActivePromptVersion(specialistId, userId)` 按 D-090 hash 策略选版本:
  ```typescript
  const hashBucket = crypto.createHash('md5').update(`${userId}:${specialistId}`).digest('hex').slice(0, 8);
  const bucketPct = parseInt(hashBucket, 16) % 100;  // 0-99
  return bucketPct < canaryPct ? nextVersion : currentVersion;
  ```
- [ ] ContextAssembler 集成 · `apps/api/src/services/context-assembler/ContextAssembler.ts` 调用 `getActivePromptVersion(specialistId, accountId)` 而非直接读 `templates/*.ts`(brownfield 改造)

[E LLM Judge stub]
- [ ] `apps/api/src/services/admin/prompt-version/llm-judge.service.ts` 新建 · `evaluatePromptVersion(versionId, isMock = true)` 默认 isMock=true(D-077 模式 · 真启 PRR · GitHub Actions CI)
- [ ] isMock=true 时返 `{score: 4.2 + Math.random() * 0.6}`(模拟 4.2-4.8)+ 写 judgeScore 字段

[H Approval 接入]
- [ ] publishPromptVersion + rollbackPrompt 内部强制经 `requestApproval({actionType:'publish_prompt', requireDualApproval: true})` · 不绕过
- [ ] AGENTS §10 加红线 LD-A-6(本 PRD 新加 · 见 §7 D-099) · prompt_versions.status='active' 仅由 _publishPromptVersionInTx 改 · grep 防 dual write:
  ```bash
  grep -rn "prompt_versions.*status.*active\|prompt_versions.*update.*active" apps/api/src --include="*.ts" | grep -v "_publishPromptVersionInTx" | grep -v "prompt-version.service.ts"
  # 期望: 0 命中(除 single source)
  ```

[P pre-existing 兼容]
- [ ] **不破坏** ContextAssembler 现有调用(brownfield · 若 prompt_versions 表无对应记录 → fallback 到 templates/*.ts · 旧行为)
- [ ] pnpm audit:redlines-admin · 0 命中(尤其 LD-A-5 类 · _publishPromptVersionInTx 单点)
- [ ] pnpm test · ≥ 1565 pass(基线 + US-001/002 + 本 US ≥ 10)· 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/api/src/services/admin/prompt-version/prompt-version.service.ts`(~ 250 行 · 含 _publishPromptVersionInTx + 4 export functions)
- `apps/api/src/services/admin/prompt-version/llm-judge.service.ts`(~ 80 行 · isMock=true 默认)
- `apps/api/src/services/admin/prompt-version/__tests__/prompt-version.service.test.ts`(~ 300 行 · ≥ 12 it)
- `apps/api/src/services/admin/prompt-version/__tests__/llm-judge.service.test.ts`(~ 60 行 · ≥ 4 it)
- `prisma/migrations/<timestamp>_prd_13_prompt_versions/migration.sql`

**files_to_modify**:
- `prisma/schema.prisma`(+ PromptVersion + PromptCanaryConfig 2 model)
- `apps/api/src/services/context-assembler/ContextAssembler.ts`(集成 getActivePromptVersion)
- `AGENTS.md` §10(加 LD-A-6 · prompt_versions.active 单点写)

**test_command** · `pnpm vitest run apps/api/src/services/admin/prompt-version/__tests__/`

**size_hint** · medium(8 files include · service + tests + migration · 不动 UI · brownfield ContextAssembler 小改)

**anti_patterns**:
- **lesson** · "_publishPromptVersionInTx 必须接收 tx 而非自己起 prisma.$transaction" · **antipattern** · `await prisma.$transaction([prisma.promptVersion.update(...)])` in publish · **correct** · `await prisma.$transaction(async (tx) => { await _publishPromptVersionInTx(tx, ...) })` · 单点函数接受 tx
- **lesson** · "灰度策略 hash 不能用 random()(灰度策略需 deterministic)" · **antipattern** · `Math.random() < canaryPct / 100` · **correct** · `parseInt(hashBucket, 16) % 100 < canaryPct`(同一 userId × specialistId 多次调结果一致)
- **lesson** · "LLM Judge 默认 isMock=true · 真启需 PRR" · **antipattern** · 默认参数 `isMock = false`(自动尝试真 LLM 调用)· **correct** · `isMock = true`(D-077 严格 · 真启走 GitHub Actions / Vercel cron · 留 P9.4+ PRR)
- **lesson** · "AGENTS §10 LD-A-6 新加红线必须 audit script 同步 grep" · **antipattern** · 改 AGENTS 不改 scripts/audit-redlines-admin.sh · **correct** · 同 commit 加 grep · 同时 scripts/audit-redlines-admin.sh 也 grep + 测试该 grep 真能 detect dual write

---

### 🟦 域 ⑨ · Evolution 进化档案监控(续 · US-004~005)

继 US-001 unit test safety net + US-002 dual approval foundation + US-003 prompt schema · 进入 ⑨ 域的数据层 + 主应用 brownfield 改造。

---

#### US-004 · evolution_anomaly_flags schema + 主应用 evolution-agent service 异常检测 + admin tRPC

**描述** · 作为 admin,我需要查看 L1-L5 用户分布 + 飞轮停滞数 + 异常账号列表 · 异常账号定义为:(1) `evolution_insight` 在 7 天内 styleAdjustments 翻转 ≥ 2 次,(2) `avoidList` 元素数 > 50(突破阈值),(3) `feedbackLog` 30 天内 negative > positive 2 倍。`evolution-agent` worker(主应用)需要在每次写 evolution_insight 后跑异常检测 · 触发条件命中 → 写 evolution_anomaly_flags + 钉钉通知。

**Risk** · medium(downstream = US-006 UI · brownfield 改造 evolution-agent worker)

**Acceptance Criteria(13 条)**:

[H schema]
- [ ] `prisma/schema.prisma` 新增 EvolutionAnomalyFlag(per DATA-MODEL §13.6 F):
  ```prisma
  model EvolutionAnomalyFlag {
    id                Int      @id @default(autoincrement())
    accountId         Int
    anomalyType       String   // 'conflicting_insights' | 'frequent_style_flip' | 'avoidlist_overflow' | 'flywheel_stalled' | 'negative_feedback_dominant'
    severity          String   // 'low' | 'medium' | 'high'
    evidence          Json     // { insightIds:[123,124], styleFlipCount: 3, ... }
    detectedAt        DateTime @default(now())
    resolvedAt        DateTime?
    resolution        String?  // 'auto_resolved' | 'admin_force_rebuild' | 'false_positive'
    resolvedByAdminId Int?

    @@index([accountId, detectedAt(sort: Desc)])
    @@index([anomalyType, severity, resolvedAt])
    @@index([resolvedAt])
    @@map("evolution_anomaly_flags")
  }
  ```
- [ ] migration `pnpm prisma migrate dev --name prd-13-evolution-anomaly` 成功

[H service]
- [ ] `apps/api/src/services/admin/evolution-health/anomaly-detection.service.ts` 新建 · `detectEvolutionAnomalies(accountId)` 返 `EvolutionAnomalyFlag[]`(可空)· 实现 5 anomalyType 检测算法:
  ```typescript
  // frequent_style_flip · 7 天内 styleAdjustments 翻转 ≥ 2 次
  const insights = await prisma.evolutionInsight.findMany({
    where: { accountId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, styleAdjustments: true, createdAt: true },
  });
  const flipCount = countStyleFlips(insights);  // 计算相邻 insight 风格反转次数
  if (flipCount >= 2) { /* push EvolutionAnomalyFlag */ }

  // avoidlist_overflow · current evolutionProfile.avoidList > 50
  const profile = await prisma.evolutionProfile.findUnique({ where: { accountId } });
  if (profile?.avoidList && (profile.avoidList as string[]).length > 50) { /* ... */ }

  // negative_feedback_dominant · 30 天 negative > positive × 2
  // flywheel_stalled · 7 天无新 insight(继承 PRD-11 已实现的飞轮停滞概念)
  // conflicting_insights · 同主题(detectedFrom)的 2+ insight 含相反 styleAdjustments 字段
  ```

[H brownfield · evolution-agent worker 集成]
- [ ] `apps/api/src/agents/evolution/EvolutionAgent.ts`(US-007 真实施 · 由 PRD-9/P8 落地)在 `execute()` 末尾(成功写入 evolution_insight 后)调 `detectEvolutionAnomalies(accountId)` · 检测结果不为空 → 写 evolution_anomaly_flags + 触发钉钉(D-077 isMock 默认)
- [ ] 测试覆盖此 brownfield 改造:`tests/unit/agents/evolution/EvolutionAgent.test.ts` 加 1 describe `'detectAnomalies integration'` · ≥ 2 it(命中 flip / 命中 overflow 各 1)

[E admin tRPC]
- [ ] `apps/api/src/trpc/routers/admin/evolutionHealth.ts` 新建 · 7 procedure:
  ```typescript
  evolutionHealth: router({
    getLDistribution: adminProcedure
      .input(z.object({ industryFilter: z.string().optional() }))
      .query(...)  // 返 { L1:120, L2:80, L3:50, L4:20, L5:5 } 用户数分布

    getFlywheelHealth: adminProcedure.query(...),
    // 返 { stalledCount: 15, conflictCount: 7, healthyCount: 200, status: 'green' | 'yellow' | 'red' }

    listAnomalies: adminProcedure
      .input(z.object({
        anomalyType: z.enum(['conflicting_insights','frequent_style_flip','avoidlist_overflow','flywheel_stalled','negative_feedback_dominant']).optional(),
        severity: z.enum(['low','medium','high']).optional(),
        resolvedAt: z.boolean().optional(),  // null = 未解决
        cursor: z.number().int().optional(),
        limit: z.number().int().max(100).default(20),
      }))
      .query(...),

    getAccountTimeline: adminProcedure
      .input(z.object({ accountId: z.number().int() }))
      .query(...),  // 返 evolution_insight 时间线 + anomaly flags 标注

    forceRebuildEvolution: adminProcedure
      .input(z.object({ accountId: z.number().int(), reason: z.string().min(10) }))
      .mutation(...),  // ★ 走 US-002 dual approval · 触发 _forceRebuildEvolutionInTx · 见 D-099
    // 期望返 { approvalRequestId: number }

    markAnomalyResolved: adminProcedure
      .input(z.object({ flagId: z.number().int(), resolution: z.enum(['admin_action','false_positive']) }))
      .mutation(...),

    getAnomalyStats: adminProcedure.query(...),
    // 返 { byType: { ... }, bySeverity: { ... }, last24h: number, last7d: number }
  });
  ```

[E ★ P-6 _forceRebuildEvolutionInTx 单点函数]
- [ ] `apps/api/src/services/admin/evolution-health/evolution-rebuild.service.ts` 新建 · `_forceRebuildEvolutionInTx` 单点:
  ```typescript
  export async function _forceRebuildEvolutionInTx(
    tx: Prisma.TransactionClient,
    params: { accountId: number; adminId: number; approvalRequestId: number; reason: string }
  ): Promise<void>;
  // → 清空当前 evolution_profile + 标记所有 evolution_insight resolved · 写 admin_audit_log eventType='evolution_force_rebuild' · 触发 EvolutionAgent batch 重跑 job(BullMQ delayed 5s)
  ```
- [ ] AGENTS §10 加红线 LD-A-7 · evolution_profile clear / evolution_insight resolved 仅由 _forceRebuildEvolutionInTx 改

[P pre-existing 兼容]
- [ ] **不破坏** EvolutionAgent.execute() 正常路径(只在末尾加 detectAnomalies · 不影响主流程)
- [ ] pnpm audit:redlines-admin · 0 命中(尤其 LD-A-7 新加 grep)
- [ ] pnpm test · ≥ 1580 pass(基线 + 累计 US-001~003 + 本 US ≥ 10)· 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/api/src/services/admin/evolution-health/anomaly-detection.service.ts`(~ 200 行 · 5 detectXxx 函数)
- `apps/api/src/services/admin/evolution-health/evolution-rebuild.service.ts`(~ 80 行 · _forceRebuildEvolutionInTx)
- `apps/api/src/trpc/routers/admin/evolutionHealth.ts`(~ 250 行 · 7 procedure)
- `apps/api/src/services/admin/evolution-health/__tests__/anomaly-detection.test.ts`(~ 250 行)
- `apps/api/src/services/admin/evolution-health/__tests__/evolution-rebuild.test.ts`(~ 80 行)
- `apps/api/src/trpc/routers/admin/__tests__/evolutionHealth.test.ts`(~ 200 行)

**files_to_modify**:
- `prisma/schema.prisma`(+ EvolutionAnomalyFlag model)
- `apps/api/src/agents/evolution/EvolutionAgent.ts`(末尾加 detectEvolutionAnomalies 调用)
- `apps/api/src/agents/evolution/__tests__/EvolutionAgent.test.ts`(加 detectAnomalies integration describe)
- `apps/api/src/trpc/routers/admin/index.ts`(挂载 evolutionHealth)
- `AGENTS.md` §10(加 LD-A-7)

**test_command** · `pnpm vitest run apps/api/src/services/admin/evolution-health/ apps/api/src/trpc/routers/admin/__tests__/evolutionHealth.test.ts`

**size_hint** · medium(11 files · 但分散 · 不集中改单一大文件)

**anti_patterns**:
- **lesson** · "brownfield · evolution-agent 改造保持 backward compat" · **antipattern** · 把 detectAnomalies 放 `execute()` 起始(异常检测前主流程不能跑)· **correct** · 放末尾(成功写 evolution_insight 后再跑 · 失败不影响主流程)
- **lesson** · "_forceRebuildEvolutionInTx 必须先经 Approval · 不能直接 trigger" · **antipattern** · `forceRebuildEvolution(accountId)` 内 `await _forceRebuildEvolutionInTx(...)` 直接走 · **correct** · 先 `await requestApproval({actionType:'force_rebuild_evolution', requireDualApproval:true})` · 等批准后才在 approveRequest 末尾 callback 调
- **lesson** · "anomaly detection 算法需 deterministic" · **antipattern** · 用 `Math.random() < threshold` 决定 severity · **correct** · 按 evidence 数量 / 时间窗口 / 历史 baseline 确定性算

---

#### US-005 · user_quota + quota_adjustment_log schema + service + Redis token bucket + 24h delayed job

**描述** · 作为客服 / super_admin,我需要管理用户配额(Free 50 / Pro 500 / Enterprise 5000 调用/天)· 实时监控用户使用率 + 临时手动放配额(单次 ≤ 500 · 24h 自动失效)+ 临时白名单(super_admin 配 · 24h 无限流)。LLMGateway 已用 Redis token bucket 限流(PRD-9 已落地)· 本 US 扩展 admin 视角 + 调整功能。

**Risk** · medium(downstream = US-009 UI · brownfield 改造 LLMGateway 限流校验)

**Acceptance Criteria(13 条)**:

[H schema]
- [ ] `prisma/schema.prisma` 新增 UserQuota + QuotaAdjustmentLog(per DATA-MODEL §13.5):
  ```prisma
  model UserQuota {
    id                  Int      @id @default(autoincrement())
    userId              Int      @unique
    plan                String   // 'free' | 'pro' | 'enterprise'
    dailyQuota          Int      // 50 / 500 / 5000
    dailyUsed           Int      @default(0)
    monthlyQuota        Int      // 1500 / 15000 / 150000(30x daily)
    monthlyUsed         Int      @default(0)
    dailyResetAt        DateTime // 每天 00:00 Asia/Shanghai
    monthlyResetAt      DateTime
    whitelistExpiresAt  DateTime?  // 24h 临时白名单失效时间 · null = 不在白名单
    updatedAt           DateTime @updatedAt

    @@unique([userId])
    @@index([plan])
    @@index([dailyResetAt])
    @@index([whitelistExpiresAt])
    @@map("user_quota")
  }

  model QuotaAdjustmentLog {
    id                  Int      @id @default(autoincrement())
    userId              Int
    adminId             Int
    adjustmentType      String   // 'increase_daily' | 'increase_monthly' | 'whitelist_add'
    delta               Int      // 正:增加 · 负:回收
    reason              String   @db.Text
    expiresAt           DateTime // 24h 后自动失效
    createdAt           DateTime @default(now())
    revokedAt           DateTime?  // 失效时 cron job 标记
    approvalRequestId   Int      // 走 Approval Gates · D-093 要求

    @@index([userId, createdAt(sort: Desc)])
    @@index([expiresAt, revokedAt])
    @@map("quota_adjustment_log")
  }
  ```
- [ ] migration `pnpm prisma migrate dev --name prd-13-user-quota` 成功 · seed 现有 users 各 row(default plan='free' · dailyQuota=50)

[H service · ★ P-6 _adjustQuotaInTx 单点]
- [ ] `apps/api/src/services/admin/quota/quota-adjustment.service.ts` 新建:
  ```typescript
  export async function _adjustQuotaInTx(
    tx: Prisma.TransactionClient,
    params: {
      userId: number;
      adminId: number;
      adjustmentType: 'increase_daily' | 'increase_monthly' | 'whitelist_add';
      delta: number;
      reason: string;
      approvalRequestId: number;
    }
  ): Promise<void>;
  // → 写 user_quota 更新(dailyQuota += delta 或 whitelistExpiresAt = now() + 24h)+ 写 quota_adjustment_log + 写 admin_audit_log

  export async function adjustUserQuota(params: {
    userId: number; adminId: number; adjustmentType; delta: number; reason: string;
  }): Promise<{ approvalRequestId: number }>;
  // → delta > 500 触发 requireDualApproval=true (D-093) · 否则单人 approve · 然后 callback _adjustQuotaInTx

  export async function listUserQuotas(input: { plan?: 'free'|'pro'|'enterprise'; sortBy?: 'usage_desc'; cursor?: number; limit?: number }): Promise<{ items: UserQuotaWithUser[]; nextCursor: number | null }>;

  export async function getUserQuotaTimeline(userId: number, days: number = 7): Promise<TimelineSeries>;
  // → 返 24h × N 天的调用时间线(用 cost_log 聚合)
  ```

[H 24h delayed job · E-3 新模式]
- [ ] `apps/api/src/jobs/admin/quota-expiry.job.ts` BullMQ:
  ```typescript
  // 不用 cron · 用 delayed job(每次 adjustment 添加一个 delayed job)
  await quotaExpiryQueue.add(
    `quota-expiry-${adjustmentId}`,
    { adjustmentId },
    { delay: 24 * 60 * 60 * 1000, jobId: `quota-expiry-${adjustmentId}` }
  );

  // worker 处理:user_quota 回滚 + quota_adjustment_log.revokedAt = now() + 写 audit
  ```
- [ ] `apps/api/src/jobs/index.ts` 启动时 schedule cleanup cron(00:30 daily · sweep 未触发的 expiry · 兜底)

[H brownfield · LLMGateway 限流集成]
- [ ] `apps/api/src/workers/llm-gateway/rate-limit.ts`(已存在 · brownfield)校验 whitelistExpiresAt:
  ```typescript
  const quota = await prisma.userQuota.findUnique({ where: { userId } });
  if (quota?.whitelistExpiresAt && quota.whitelistExpiresAt > new Date()) {
    return { allowed: true, reason: 'whitelisted' };  // 跳过 token bucket
  }
  // 继续原有 Redis token bucket 逻辑
  ```

[E admin tRPC]
- [ ] `apps/api/src/trpc/routers/admin/quota.ts` 新建 · 6 procedure:
  - getQuotaOverview(query · 各套餐用户数 + 实时使用率 dashboard 仪表盘数据)
  - listUserQuotas(query · 分页列表 + 过滤)
  - getUserDetail(query · 用户详情 + 24h timeline)
  - adjustQuota(mutation · 走 Approval · delta > 500 dual approval)
  - listAdjustmentLog(query · 历史调整记录)
  - getActiveAdjustments(query · 当前未过期的临时调整)

[P pre-existing 兼容]
- [ ] **不破坏** LLMGateway 现有 token bucket 限流(只在 user_quota 表存在且 whitelistExpiresAt valid 时 bypass)
- [ ] pnpm audit:redlines-admin · 0 命中
- [ ] pnpm test · ≥ 1595 pass(基线 + 累计 + 本 US ≥ 12)· 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/api/src/services/admin/quota/quota-adjustment.service.ts`(~ 250 行)
- `apps/api/src/jobs/admin/quota-expiry.job.ts`(~ 100 行)
- `apps/api/src/trpc/routers/admin/quota.ts`(~ 200 行)
- `apps/api/src/services/admin/quota/__tests__/quota-adjustment.test.ts`(~ 300 行)
- `apps/api/src/trpc/routers/admin/__tests__/quota.test.ts`(~ 200 行)

**files_to_modify**:
- `prisma/schema.prisma`(+ UserQuota + QuotaAdjustmentLog)
- `apps/api/src/workers/llm-gateway/rate-limit.ts`(brownfield · 加 whitelistExpiresAt 检查)
- `apps/api/src/trpc/routers/admin/index.ts`(挂载 quota)
- `apps/api/src/jobs/index.ts`(register quotaExpiryWorker + scheduleQuotaExpiryCleanup)
- `AGENTS.md` §10(加 LD-A-8 · user_quota 表 dailyQuota/monthlyQuota 仅由 _adjustQuotaInTx 改 + plan='free/pro/enterprise' 单点 enum)

**test_command** · `pnpm vitest run apps/api/src/services/admin/quota/__tests__/ apps/api/src/trpc/routers/admin/__tests__/quota.test.ts`

**size_hint** · medium(10 files · backend foundation · 不动 UI)

**anti_patterns**:
- **lesson** · "BullMQ delayed job · jobId dedup 防止 adjustment 重复 expiry" · **antipattern** · 不带 jobId(同一 adjustment 反复 add delayed job 时多个 worker 抢回滚 · 数据混乱)· **correct** · `jobId: 'quota-expiry-' + adjustmentId`(确保单一)
- **lesson** · "24h 失效 reset · 必须用 prisma transaction" · **antipattern** · `await prisma.userQuota.update(...) await prisma.quotaAdjustmentLog.update(...)` 两步分开 · **correct** · `prisma.$transaction([userQuotaUpdate, logUpdate])` 或 _adjustQuotaInTx 内部 tx
- **lesson** · "brownfield rate-limit.ts 集成 backward compat" · **antipattern** · 删除原 token bucket 逻辑改用 user_quota 表(影响所有现有用户 · 高风险)· **correct** · whitelistExpiresAt 检查作为前置 bypass · 不替代原逻辑

---

### 🟦 域 ⑨ · admin UI(US-006)

#### US-006 · ⑨ admin UI · L 分布饼图 + 飞轮健康度仪表 + 异常账号列表 + 强制重跑

**描述** · 作为 admin,我需要可视化 admin 页 `/admin/evolution-health` · 顶部 L 分布饼图 + 飞轮健康度仪表 + 异常账号数 · 中部异常账号列表(可筛选 / 排序)· 点详情打开 Drawer 看 evolution_insight 时间线 + 异常 flags · 操作含"强制重跑批"按钮(走 dual-approval)。

**Risk** · medium(downstream = US-012 E2E · 复用 PRD-10/11/12 22 components · 标准 UI 模式)

**Acceptance Criteria(15 条)**:

[H 路由 + admin-routes 协议]
- [ ] `apps/admin/src/admin-routes.ts` 加 route entry:
  ```typescript
  {
    path: '/evolution-health',
    label: '进化档案监控',
    sidebar: true,
    icon: 'TrendingUp',
    component: () => import('./pages/evolutionHealth/EvolutionHealthPage'),
    requiredRole: 'readonly_admin',  // 查看 · super_admin 才能强制重跑
  }
  ```
- [ ] `apps/admin/src/pages/evolutionHealth/EvolutionHealthPage.tsx` 新建 · 标准布局(继承 PRD-10 admin Layout)

[H 顶部 KPI 卡片]
- [ ] 顶部 4 数字卡片(继承 PRD-11 DenseStatCard 组件):
  - L1-L5 用户分布饼图(右边 Recharts PieChart · L1 灰 / L2 浅蓝 / L3 蓝 / L4 紫 / L5 金)
  - 飞轮健康度仪表(绿/黄/红 · 用 `<HealthGauge />` 新组件 · 内圈进度 + 中心状态文案)
  - 异常账号数(数字 + 趋势箭头 · 比昨天 +5 / -3)
  - 平均升级周期(L1→L2 天数 + L2→L3 天数 + ...)

[H 异常账号列表]
- [ ] `DenseTable` 异常账号列表 · 复用 PRD-11 DenseTable 组件 · 列:
  - account_id · 账号 ID
  - anomalyType · 异常类型(中文 label 映射)
  - severity · 严重度(high 红 / medium 黄 / low 灰)
  - detectedAt · 检测时间(相对时间 + tooltip 绝对时间)
  - resolution · 解决状态('未解决' / '已解决:admin_force_rebuild' / ...)
  - action · 操作按钮(查看详情 / 标记 false_positive)
- [ ] 列表支持筛选:anomalyType(5 enum)+ severity(3 enum)+ resolvedAt(已解决 / 未解决 / 全部)+ 排序(detectedAt DESC 默认)
- [ ] 分页:cursor-based · 20 / page · 复用 PRD-11 useInfiniteList hook

[H 详情 Drawer]
- [ ] 点账号 row → 打开 `EvolutionHealthDrawer.tsx` 详情抽屉:
  - 顶部:账号基本信息 + 当前 L 等级 + 评分卡片
  - 中部:evolution_insight 时间线视图(用 `<TimelineList />` · 每 insight 含 styleAdjustments JSON 高亮 + 异常 flag tag)
  - 操作:`<Button>` 强制重跑批(super_admin only · 弹 ConfirmModal 需填 reason ≥ 10 字 · 触发 trpc evolutionHealth.forceRebuildEvolution.mutate)
  - 弹 Approval 申请已创建 toast + 进入 Approval Gates 页查看进度

[B 视觉 + 边界]
- [ ] 空状态(无异常)· 显示 "🎉 所有账号档案健康 · 0 异常" 居中卡片
- [ ] 加载状态 · skeleton row × 8(列表)+ shimmer KPI 卡片
- [ ] 错误状态 · "数据加载失败" + retry 按钮
- [ ] 移动端响应式 · 列表收为单列卡片 · KPI 卡片堆叠

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `http://localhost:5174/admin/evolution-health`(本地 dev · super_admin 登录态)
- [ ] 验证页面渲染 · 顶部 4 KPI 卡片 · 中部异常列表(若无数据 · 显示空状态)
- [ ] 点 row → Drawer 打开 · 含时间线 + 强制重跑按钮(super_admin 可见)
- [ ] 强制重跑 ConfirmModal · 填 reason >= 10 字 · 提交 · toast "已发起 Approval 申请 #X" · 跳转 Approval Gates 页(US-011 实现)能看到该申请

[P pre-existing 兼容]
- [ ] pnpm audit:redlines-admin · 0 命中(尤其 LD-A-7 admin 不直写 evolution_profile)
- [ ] pnpm test · ≥ 1610 pass(基线 + 累计 + 本 US ≥ 10 含 component test)· 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/admin/src/pages/evolutionHealth/EvolutionHealthPage.tsx`(~ 200 行)
- `apps/admin/src/pages/evolutionHealth/EvolutionHealthDrawer.tsx`(~ 180 行)
- `apps/admin/src/pages/evolutionHealth/components/LDistributionPie.tsx`(~ 80 行 · Recharts PieChart wrapper)
- `apps/admin/src/pages/evolutionHealth/components/HealthGauge.tsx`(~ 100 行 · 新组件 · 仪表盘)
- `apps/admin/src/pages/evolutionHealth/components/EvolutionTimelineList.tsx`(~ 120 行)
- `tests/unit/admin/evolutionHealth/EvolutionHealthPage.test.tsx`(~ 150 行)
- `tests/unit/admin/evolutionHealth/EvolutionHealthDrawer.test.tsx`(~ 120 行)

**files_to_modify**:
- `apps/admin/src/admin-routes.ts`(+ entry)
- `apps/admin/src/components/Sidebar.tsx`(若 sidebar items 是 from admin-routes · 自动加 entry · 否则手动 · 视实施)

**test_command** · `pnpm vitest run tests/unit/admin/evolutionHealth/`

**size_hint** · medium(9 files · 新 page + Drawer + 3 components + 2 tests · 单一域 · 大部分组件 fork PRD-11)

**anti_patterns**:
- **lesson** · "强制重跑按钮仅 super_admin · admin/readonly_admin 不显示" · **antipattern** · `<Button>` 无条件渲染 · 客户端检查 role 拒绝 · **correct** · `{userRole === 'super_admin' && <Button>}` 前端隐藏 + 后端 adminProcedure.requireSuperAdmin 校验(7 闸链 P-1)
- **lesson** · "Drawer 时间线分页 + 懒加载" · **antipattern** · 一次 fetch 全部 insight 历史(可能上千条 · 内存爆)· **correct** · 默认 fetch 最近 50 · 滚动到底加载更多 · 用 PRD-11 useInfiniteList

---

### 🟦 域 ⑩ · Prompt 版本管理(2 UI US · US-007~008)

★ 大子域 · P-8 Playbook 拆 3 子(US-003 已落 schema+service)· UI 部分拆 2(Monaco + 灰度)防 large 超时。

---

#### US-007 · Prompt 版本管理 ⑩-A · Monaco 编辑器 + Diff 视图 + 14 Specialist Tab

**描述** · 作为 super_admin/admin,我需要在 admin `/admin/prompts` 页面编辑 14 Specialist 的 prompt 内容 · 横向 14 Tab 切换 · 中部 Monaco 编辑器(语法高亮 + 代码补全)· 右侧 Diff 对比上一版 · 顶部当前版本卡片(版本号 / 评分 / 灰度比例)· 历史版本时间线(右侧或下方)。**保存** = 写新 PromptVersion(status='draft')· **提交审核** = status='pending_review' + 触发 LLM Judge stub 评分 + 自动 requestApproval(dual)。

**Risk** · high(★ 大 UI · 14 Tab + Monaco + Diff + 历史 + 操作按钮 · 单 US 超 8 files · 但 P-8 已拆 3 子)· brownfield 改造 ContextAssembler 已在 US-003 做完 · 本 US 纯 UI

**Acceptance Criteria(16 条)**:

[H 路由 + admin-routes 协议]
- [ ] `apps/admin/src/admin-routes.ts` 加:
  ```typescript
  {
    path: '/prompts',
    label: 'Prompt 版本管理',
    sidebar: true,
    icon: 'FileCode',
    component: () => import('./pages/prompts/PromptsPage'),
    requiredRole: 'admin',  // admin 可编辑提交 · super_admin 批准发布
  }
  ```

[H dep + Monaco 接入]
- [ ] `pnpm add @monaco-editor/react@4` · `package.json` 新增依赖
- [ ] `apps/admin/src/pages/prompts/components/MonacoEditor.tsx` wrap Monaco · 配置 language='handlebars'(简化 prompt 模板高亮)· 主题 'vs-dark'(继承 admin Aurelian Dark 视觉系统)· readOnly prop 控制只读

[H 14 Specialist Tab]
- [ ] `apps/admin/src/pages/prompts/PromptsPage.tsx` 主页 · 顶部横向 `<TabBar />` 14 Tab(EvolutionAgent/DailyTaskAgent/PositioningAgent/.../CopywritingAgent):
  ```typescript
  const SPECIALIST_IDS = [
    'EvolutionAgent', 'DailyTaskAgent', 'PositioningAgent', 'BrandingAgent',
    'TopicAgent', 'CopywritingAgent', 'VideoAgent', 'AnalysisAgent',
    'LivestreamAgent', 'MonetizationAgent', 'PrivateDomainAgent',
    'DeepLearnAgent', 'DiagnosisAgent', 'VoiceChatAgent',
  ];
  ```
- [ ] Tab URL params 持久化 · `?specialist=PositioningAgent&mode=default`
- [ ] CopywritingAgent 等多 mode Specialist 支持 mode 二级 Tab(default / step5 / free / boom / acquisition)

[H 当前版本卡片]
- [ ] 顶部卡片显示当前 active 版本:
  - 版本号 v17 · 创建时间 / 创建人
  - LLM Judge 评分(若有 · 0.00-5.00 · 颜色:>4.0 绿 / 3.5-4.0 黄 / <3.5 红)
  - 当前灰度比例(进度条 · "0% / 1% / 10% / 50% / 100% (active)" 五档)
  - 操作:`<Button>` 编辑(进入编辑模式) + `<Button>` 灰度配置(跳 US-008)

[H 编辑器 + Diff]
- [ ] 编辑模式:`<MonacoEditor>` 左侧 80% · 右侧 20% 当前版本预览(`readOnly`)
- [ ] Diff 模式按钮:`<Button>` 切换 Diff 视图 · 用 `<DiffEditor />` from `@monaco-editor/react` · 左旧右新
- [ ] 编辑时自动 debounce 1s 保存 draft(localStorage · 防离开丢失)
- [ ] `<Button>` 保存:写 PromptVersion(status='draft') · 用户回 active 卡片
- [ ] `<Button>` 提交审核:status='draft' → 'pending_review' · 触发 LLM Judge stub(US-003 service)· 触发 requestApproval(dual=true)· toast "已提交审核 + LLM Judge 跑分中 · 评分完成会通知"

[H 历史版本时间线]
- [ ] 右侧或下方时间线列表:`<HistoryTimeline />` 复用 US-006 EvolutionTimelineList 模式
- [ ] 每版条目:版本号 + 评分 + 状态(active/draft/archived/pending_review)+ 创建人 / 时间
- [ ] 点条目可预览(底部弹小窗 · readOnly Monaco)· 操作:回滚此版本(super_admin only · 走 dual approval)

[B 边界 + 视觉]
- [ ] 14 Tab 横向滚动(屏幕窄时)· 当前 Tab 高亮
- [ ] Monaco 主题跟 Aurelian Dark 一致 · 自定义颜色 token via createTheme
- [ ] 加载状态:Tab 切换时 skeleton + spinner
- [ ] 错误处理:LLM Judge 超时 · toast "评分超时 · 30s 后自动重试 · 也可手动重跑评分"

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `/admin/prompts?specialist=PositioningAgent&mode=default`(super_admin 登录)
- [ ] 看到 14 Tab + 当前版本卡片 + Monaco 编辑器 + 历史时间线
- [ ] 点编辑 → Monaco 进入编辑模式 · 改文字 + Cmd+S 保存草稿
- [ ] 点 Diff 视图 → 左右对比变化
- [ ] 点提交审核 → toast 出 + status='pending_review' + 创建 approval_requests + LLM Judge 跑(isMock=true 默认)
- [ ] 切换到 EvolutionAgent Tab · URL 变 · 内容切

[P pre-existing 兼容]
- [ ] **不影响**主应用 ContextAssembler 现有调用(US-003 已加 brownfield fallback)
- [ ] pnpm audit:redlines-admin · 0 命中(LD-A-6 prompt_versions.active 单点写 grep)
- [ ] pnpm test · ≥ 1625 pass(基线 + 累计 + 本 US ≥ 12)· 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/admin/src/pages/prompts/PromptsPage.tsx`(~ 250 行)
- `apps/admin/src/pages/prompts/components/MonacoEditor.tsx`(~ 100 行 · wrap @monaco-editor/react)
- `apps/admin/src/pages/prompts/components/DiffEditor.tsx`(~ 80 行)
- `apps/admin/src/pages/prompts/components/SpecialistTabs.tsx`(~ 120 行 · 14 Tab + mode 二级)
- `apps/admin/src/pages/prompts/components/CurrentVersionCard.tsx`(~ 100 行)
- `apps/admin/src/pages/prompts/components/HistoryTimeline.tsx`(~ 150 行)
- `tests/unit/admin/prompts/PromptsPage.test.tsx`(~ 150 行)
- `tests/unit/admin/prompts/SpecialistTabs.test.tsx`(~ 80 行)

**files_to_modify**:
- `apps/admin/package.json`(+ @monaco-editor/react@4)
- `apps/admin/src/admin-routes.ts`(+ entry)
- `pnpm-lock.yaml`(因 dep 添加)
- `apps/admin/src/styles/monaco-theme.ts`(新建 · 定义 Aurelian Dark Monaco 主题)

**test_command** · `pnpm vitest run tests/unit/admin/prompts/`

**size_hint** · high(12 files · UI 大 · Monaco 接入 + 14 Tab + Diff + 历史 · 但单一 US 边界清晰 · 不含灰度 + LLM Judge UI · 留 US-008)

**anti_patterns**:
- **lesson** · "Monaco 不能 SSR · 必须 dynamic import" · **antipattern** · `import Editor from '@monaco-editor/react'` 静态 import · **correct** · `const Editor = lazy(() => import('@monaco-editor/react'))` + `<Suspense>` 包(防 admin SPA build break)
- **lesson** · "Specialist Tab URL state · 不能用 useState 否则刷新丢" · **antipattern** · `const [specialist, setSpecialist] = useState('EvolutionAgent')` · **correct** · `useSearchParams()` 或 useRouter query string
- **lesson** · "draft auto-save 必须 debounce · 不能 onChange 直接写后端" · **antipattern** · onChange callback `await trpc.prompt.saveDraft.mutate(content)` 每次输入触发请求 · **correct** · debounce 1s + localStorage 临时存

---

#### US-008 · Prompt 版本管理 ⑩-B · 灰度配置 UI + canary 滑块 + LLM Judge stub

**描述** · 作为 super_admin,我需要可视化每个 Specialist 当前的灰度配置 · 滑块调整 canaryPct(0/1/10/50/100 五档)· 一键回滚 active 到上一版本(走 dual approval)· LLM Judge 评分 isMock stub UI 显示。

**Risk** · medium(downstream = US-012 · 复用 US-007 framework)

**Acceptance Criteria(13 条)**:

[H 灰度滑块 + 5 档]
- [ ] `apps/admin/src/pages/prompts/components/CanarySlider.tsx` 新建 · 5 档 stepper(0% / 1% / 10% / 50% / 100%)·
- [ ] 选 100% 触发 confirm modal "确认完全发布?(将影响所有用户)" + 自动 requestApproval(dual=true)
- [ ] 选 1-50% · 直接调用 trpc prompt.updateCanary.mutate · 不走 Approval(因为是灰度调整 · 风险低)
- [ ] 选 0% · 等价于"暂停灰度" · 客户端二次 confirm
- [ ] 滑块需有 currentVersion vs nextVersion · 同行展示
- [ ] D-090 hash 策略说明 tooltip · "按用户 user_id × specialistId 哈希分流 · 同用户同 Specialist 多次结果一致"

[H Canary status 卡片]
- [ ] 展示当前 currentVersionId / nextVersionId 详情:
  - currentVersion · v17 · 评分 4.5 · 灰度 100%(active)
  - nextVersion · v18 · 评分 4.3 · 灰度 10%(canary)
  - 操作:回滚到 v16 · 升 v18 到 100% · 暂停灰度(回 v17 100%)

[H 一键回滚]
- [ ] `<Button>` 回滚到上一版(超级危险 · super_admin only · 走 dual approval · 影响范围 = canaryPct 当前比例 = 全量切换)
- [ ] 弹 ConfirmModal · 填 reason ≥ 20 字 · 调 trpc prompt.rollback.mutate · 返 approvalRequestId · toast "已发起回滚申请 #X"
- [ ] 回滚 approve 后 callback _publishPromptVersionInTx(versionId = 上一版 active) + canaryPct = 100

[H LLM Judge UI]
- [ ] `apps/admin/src/pages/prompts/components/LlmJudgeCard.tsx` 新建 · 显示:
  - 评分 · 0.00-5.00 · 进度条 + 颜色
  - 跑分时间 + 模型 + 是否 isMock
  - `<Button>` 重跑评分(super_admin · 调 trpc prompt.runLlmJudge.mutate · 默认 isMock=true)

[H 历史灰度记录]
- [ ] `<HistoryTimeline>` US-007 增强 · 每个版本条目下显示灰度历史(canaryPct 变化记录)

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `/admin/prompts?specialist=PositioningAgent&tab=canary`(US-007 + canary tab 切换)
- [ ] 看到 CanarySlider + Canary status 卡片 + 回滚按钮 + LLM Judge 评分
- [ ] 调滑块 10% → 50% · 调 trpc · canaryPct 更新 · 后端 prompt_canary_config 表更新
- [ ] 点回滚 · 输 reason · 提交 · toast 出 + approval_requests 创建
- [ ] 点重跑 LLM Judge · 评分更新(isMock 4.0-4.8)

[P pre-existing]
- [ ] pnpm audit:redlines-admin · 0 命中
- [ ] pnpm test · ≥ 1640 pass(累计)· 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/admin/src/pages/prompts/components/CanarySlider.tsx`(~ 120 行)
- `apps/admin/src/pages/prompts/components/CanaryStatusCard.tsx`(~ 100 行)
- `apps/admin/src/pages/prompts/components/LlmJudgeCard.tsx`(~ 80 行)
- `tests/unit/admin/prompts/CanarySlider.test.tsx`(~ 100 行)
- `tests/unit/admin/prompts/LlmJudgeCard.test.tsx`(~ 60 行)

**files_to_modify**:
- `apps/admin/src/pages/prompts/PromptsPage.tsx`(集成 CanaryStatusCard + LlmJudgeCard + 回滚按钮 + canary tab)
- `apps/admin/src/pages/prompts/components/HistoryTimeline.tsx`(显示灰度历史)

**test_command** · `pnpm vitest run tests/unit/admin/prompts/Canary tests/unit/admin/prompts/LlmJudgeCard.test.tsx`

**size_hint** · medium(7 files · 复用 US-007 framework · 单一 UI 增强)

**anti_patterns**:
- **lesson** · "5 档灰度 stepper · 不要让用户输任意数字" · **antipattern** · `<Input type="number" min=0 max=100>` 任意数字 · **correct** · 5-step Slider · 限制 enum [0,1,10,50,100] · 防 13/47/99 等不规则值
- **lesson** · "回滚必须走 Approval · 不能直接执行" · **antipattern** · 点回滚按钮直接 _publishPromptVersionInTx(versionId) · **correct** · 先 requestApproval(dual=true)+ 等批准 + callback `_publishPromptVersionInTx`

---

### 🟦 域 ⑪ · 配额管理 UI(US-009)

#### US-009 · 配额管理 admin UI · 实时监控 + 客服调整 + 临时白名单

**描述** · 作为客服 / super_admin,我需要 admin `/admin/quota` 页 · 顶部各套餐用户数 + 实时使用率仪表盘 + 中部异常用户列表(突发流量 / 接近爆配额)+ 详情看 24h 调用时间线 + 手动调整面板(临时放配额 · 24h 失效)+ 临时白名单(super_admin 配)。

**Risk** · medium(downstream = US-012)

**Acceptance Criteria(14 条)**:

[H 路由]
- [ ] `apps/admin/src/admin-routes.ts` 加:
  ```typescript
  {
    path: '/quota',
    label: '配额管理',
    sidebar: true,
    icon: 'Activity',
    component: () => import('./pages/quota/QuotaPage'),
    requiredRole: 'readonly_admin',
  }
  ```

[H 顶部仪表盘]
- [ ] 4 数字卡片:
  - Free 套餐用户数 + 平均使用率 %
  - Pro 套餐用户数 + 平均使用率 %
  - Enterprise 套餐用户数 + 平均使用率 %
  - 异常用户数(单用户 5 min > 100 调用)+ 趋势箭头

[H 实时使用率折线图]
- [ ] `apps/admin/src/pages/quota/components/UsageLineChart.tsx`(用 Recharts LineChart)显示 24h × 3 套餐分组的总调用量趋势

[H 异常用户列表]
- [ ] `<DenseTable>` 列表 · 列:user_id / plan / dailyUsed/dailyQuota / 占比 % / lastCallAt / action
- [ ] 筛选:plan + usageThreshold(default >= 80% 占比)+ status('all'/'whitelisted'/'normal')
- [ ] 排序:usagePctDesc 默认
- [ ] 行点开 `QuotaDetailDrawer.tsx`

[H 详情 Drawer]
- [ ] Drawer 内容:
  - 用户基本信息(email · plan · createdAt)
  - 24h 调用时间线折线 · 按小时聚合
  - 当前 active adjustments 列表(尚未失效的客服临时调整 · 含 expiresAt)
  - 历史 adjustments 列表(已失效)
  - 操作:`<Button>` 临时增加 dailyQuota(客服)+ `<Button>` 加入白名单 24h(super_admin)

[H 手动调整]
- [ ] 调整面板:
  - adjustmentType select(increase_daily / increase_monthly / whitelist_add)
  - delta input(数字 · max 500 客服档 · max 5000 super_admin)
  - reason textarea(必填 · ≥ 10 字)
  - 提交 · 走 trpc quota.adjustQuota.mutate · delta > 500 触发 dual approval · 否则单人批
  - toast "已发起调整申请 #X(若 Approval)" 或 "已立即生效 24h" 

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `/admin/quota`(客服登录态)
- [ ] 看到 4 KPI + 实时折线 + 异常用户列表
- [ ] 点 row → Drawer 打开 · 看到 24h 时间线 + 调整面板
- [ ] 调整 delta=300 reason="客服临时放量" · 点提交 · toast "已立即生效" · 24h 后自动失效
- [ ] 调整 delta=600 · toast "已发起 Approval 申请 #X" · 跳 Approval Gates 页查看

[P pre-existing]
- [ ] pnpm audit:redlines-admin · 0 命中(LD-A-8 user_quota 单点 grep)
- [ ] pnpm test · ≥ 1655 pass · 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/admin/src/pages/quota/QuotaPage.tsx`(~ 200 行)
- `apps/admin/src/pages/quota/QuotaDetailDrawer.tsx`(~ 180 行)
- `apps/admin/src/pages/quota/components/UsageLineChart.tsx`(~ 80 行)
- `apps/admin/src/pages/quota/components/AdjustmentPanel.tsx`(~ 150 行 · 复杂表单)
- `tests/unit/admin/quota/QuotaPage.test.tsx`(~ 120 行)
- `tests/unit/admin/quota/AdjustmentPanel.test.tsx`(~ 100 行)

**files_to_modify**:
- `apps/admin/src/admin-routes.ts`(+ entry)

**test_command** · `pnpm vitest run tests/unit/admin/quota/`

**size_hint** · medium(7 files · 复用 PRD-10/11 components)

**anti_patterns**:
- **lesson** · "delta > 500 必须 dual approval · 客户端 + 服务端双校验" · **antipattern** · 客户端 max=500 但服务端不校验(客户端可绕过)· **correct** · service quota-adjustment.service.ts 内 `if (delta > 500) requireDualApproval = true`
- **lesson** · "实时折线刷新策略" · **antipattern** · WebSocket 实时推(架构 over-engineer)· **correct** · setInterval 30s polling 简单稳定(D-077 isMock 思路 · 后续优化留 PRR)

---

### 🟦 域 ⑫ · 行业合规仪表盘(US-010)

#### US-010 · 合规仪表盘 admin UI · 行业触发统计 + PDF 法务导出

**描述** · 作为法务 / super_admin,我需要 admin `/admin/compliance` 页 · 4 KPI(今日触发免责数 / 命中违禁词次数 / PII 命中率 / 行业 Top 5)+ 56 行业分布饼图 + 时间趋势折线 + 详情列表(可分组按事件类型 / 行业)+ 导出 PDF 月度合规报告(复用 PRD-11 @react-pdf/renderer)。**数据源** · 复用 admin_audit_log eventCategory='compliance' · **不新加表**。

**Risk** · medium(downstream = US-012 · 数据复用 + UI 标准化)

**Acceptance Criteria(13 条)**:

[H 路由]
- [ ] `admin-routes.ts` 加 `/compliance` entry · requiredRole='readonly_admin'(法务模式)

[H 顶部 4 KPI]
- [ ] 今日触发免责声明数(分行业 · 4 主行业 Tab)
- [ ] 命中违禁词次数(7 天趋势 + 当前值)
- [ ] PII 命中率(检测到 / 总解析 · % + 趋势)
- [ ] 行业 Top 5 命中(56 行业排序)

[H 行业饼图 + 趋势]
- [ ] 56 行业合规事件占比饼图(分前 10 + "其他"类) · Recharts PieChart
- [ ] 时间趋势折线 · 分日 / 周 / 月切换(Tab)
- [ ] 行业 multi-select 筛选(用户可看特定行业的时间趋势)

[H 详情列表]
- [ ] `<DenseTable>` 复用 PRD-11 audit_log 列表设计 · 列:
  - timestamp · 时间(相对 + tooltip)
  - eventCategory · 必含 'compliance'(filter 锁定)
  - eventType · 'pii_redacted' / 'banned_word_hit' / 'industry_disclaimer_triggered'
  - industry · 行业(若有)
  - userId · 用户 ID(redacted text 不暴露详情 · 跨 admin 链接到 Users 页)
  - payload · 关键字段(脱敏 · 见 LD-A-3)
- [ ] 分组:by eventType / by industry / 不分组 三档

[H PDF 导出]
- [ ] `apps/admin/src/pages/compliance/components/ComplianceReportPdf.tsx` 新建 · 用 @react-pdf/renderer 4.5.1(PRD-11 已添加)
- [ ] PDF 模板:
  - 封面:QuanQn 合规月度报告 + 月份 + 生成人(super_admin) + 报告 ID
  - §1 总览:4 KPI 数字 + 比上月增减
  - §2 行业分布表:56 行业 × 6 列(免责数 / 违禁 / PII / 总触发 / 占比 / 趋势)
  - §3 时间趋势:折线图(用 png snapshot · 因 PDF 不支持 SVG · 后端 puppeteer 渲染留 PRR · 本 PRD 用 SimpleLine.png stub)
  - §4 高频事件 Top 20 列表
  - 末页:签名栏 · "本报告由 QuanQn admin 系统自动生成 · 报告 ID: XXX · 生成时间 XXX"
- [ ] `<Button>` 导出 PDF · 点击触发 `<PDFDownloadLink>` 生成 + 浏览器下载

[H 配置免责模板]
- [ ] 顶部 `<Button>` "配置免责模板"(super_admin only)· 弹 Modal · 56 行业 × 1 textarea(每行业可定制免责文案)· 提交走 dual approval(影响 PRD-1 主应用免责系统)
- [ ] 此功能本 PRD 仅 UI stub · 真改 modal 在 P2 ⑯ 配置中心实现 · 本 PRD 弹 toast "功能开发中 · 留 P9.4"

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `/admin/compliance`(法务登录)
- [ ] 看到 4 KPI + 行业饼图 + 时间趋势 + 详情列表
- [ ] 点 PDF 导出 · 浏览器下载 `compliance-2026-05.pdf` 文件 · 含 4 节 + 签名栏
- [ ] 切换分组 by eventType / by industry · 列表重新分组

[P pre-existing]
- [ ] pnpm audit:redlines-admin · 0 命中(LD-A-3 redacted text payload 不暴露详情)
- [ ] pnpm test · ≥ 1670 pass · 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/admin/src/pages/compliance/CompliancePage.tsx`(~ 200 行)
- `apps/admin/src/pages/compliance/components/IndustryPieChart.tsx`(~ 80 行)
- `apps/admin/src/pages/compliance/components/ComplianceTrendChart.tsx`(~ 80 行)
- `apps/admin/src/pages/compliance/components/ComplianceReportPdf.tsx`(~ 200 行 · 4 节 PDF 模板)
- `apps/api/src/trpc/routers/admin/compliance.ts`(~ 150 行 · 5 procedure)
- `tests/unit/admin/compliance/CompliancePage.test.tsx`(~ 120 行)
- `tests/unit/admin/compliance/ComplianceReportPdf.test.tsx`(~ 80 行)

**files_to_modify**:
- `apps/admin/src/admin-routes.ts`(+ entry)
- `apps/api/src/trpc/routers/admin/index.ts`(挂载 compliance)

**test_command** · `pnpm vitest run tests/unit/admin/compliance/`

**size_hint** · medium(9 files · UI + service + tests · PDF 模板复杂但单独文件)

**anti_patterns**:
- **lesson** · "PDF 不能 inline SVG · 用 png snapshot 或 PDF native shape" · **antipattern** · 直接把 Recharts SVG 塞 PDF · **correct** · 用 @react-pdf 的 `<Path>` 重画 simplified line chart · 或后端 puppeteer 生 png snapshot
- **lesson** · "PDF compliance · payload 必脱敏" · **antipattern** · 把 audit_log.payload 全部塞 PDF(可能含 PII)· **correct** · 仅展示 eventType + industry + count · 不展示 user_id / 内容详情(LD-A-3 redacted)

---

### 🟦 域 ⑬ · Approval Gates 完整 UI(US-011)

#### US-011 · Approval Gates admin UI · 待审批列表 + 详情 + 二次审批 + 紧急通道

**描述** · 作为 admin/super_admin,我需要 admin `/admin/approvals` 页 · 顶部 KPI(待审批数 / 平均时长 / 拒绝率 / 紧急 SLA)· 中部待审批列表(按风险等级排序)· 点开 Drawer 看详情(操作上下文 · 影响范围预估 · 申请理由 · 历史决策参考)· 批准 / 拒绝(必带理由 · 通知申请人)· 二次审批(dual approval 时)· 历史决策 Tab(已决策列表)· 紧急通道(super_admin only · 1 人快速批 · 后置 24h 复核)。

**Risk** · high(★ 横切机制 UI · ⑨/⑩/⑪/⑫ 所有高风险操作都走它 · backward compat 升级 PRD-10/11/12 stub 三态)

**Acceptance Criteria(17 条)**:

[H 路由]
- [ ] `admin-routes.ts` 加 `/approvals` · sidebar='Approval Gates' · icon='Shield' · requiredRole='admin'(看自己提的) · super_admin 看全部 + 审批

[H 顶部 KPI]
- [ ] 4 数字卡片:
  - 待审批数(status='pending' · 我可审批的 = 不是申请人 + 未参与第一审批)
  - 平均审批时长(近 30 天 申请 → 决策)
  - 拒绝率(被拒 / 总申请 · 近 30 天)
  - 紧急 SLA 达成率(emergencyMode 且 < 1h 决策 / 总紧急申请)

[H 待审批列表 · 风险等级排序]
- [ ] `<DenseTable>` 列:
  - 申请 ID · 行点开 Drawer
  - actionType · 中文标签(force_rebuild_evolution / publish_prompt / adjust_quota / ban_uploader / ...)
  - requesterAdmin · 申请人
  - riskLevel · high red / medium yellow / low gray
  - requireDualApproval · 'Y' / 'N' badge
  - emergencyMode · 'EMERGENCY' badge(红色)
  - createdAt · 申请时间
  - expiresAt · 24h 后到期 progress bar
  - status · 'pending' / 'first_approved'(dual 时第一批通过)/ 'approved' / 'rejected' / 'expired'

[H 详情 Drawer]
- [ ] `ApprovalDetailDrawer.tsx` 内容:
  - 申请概要:actionType + requesterAdmin + riskLevel + dualApproval + emergencyMode + createdAt
  - actionPayload JSON 高亮显示(redacted PII)
  - 影响范围预估 stub(actionType 不同 · 不同评估)·
    - force_rebuild_evolution · "将清空 accountId={X} 的 evolution_profile + insights · 重新跑 EvolutionAgent · 预计耗时 30-60s · 不可恢复"
    - publish_prompt · "将切换 specialistId={X} mode={Y} 当前 active 版本 from v{A} to v{B} · 灰度比例 {N}% · 影响约 {预估用户数} 用户"
    - adjust_quota · "将变更 userId={X} dailyQuota {从 50 到 350} · 24h 后自动失效"
    - ban_uploader · "将暂停 userId={X} 的内容上传权限 · 持续 7 天 · 失败 7 天后自动恢复"
  - 历史决策参考:同类 actionType 近 10 条决策(approve/reject + 理由)
  - 操作:`<Button>` 批准 + `<Button>` 拒绝 + `<Input>` 决策理由(必填 ≥ 10 字)
  - 紧急通道按钮:super_admin only · `<Button>` 紧急批准(emergencyMode=true 时弹 incidentId input · 必填)

[H Dual approval UI]
- [ ] 当 status='first_approved'(第一人已批 + dual=true) · Drawer 顶部显示 ✅ 绿条 "第一审批已通过 by {firstApproverAdmin} at {time}" + 提示 "等待第二审批人"
- [ ] 当前用户 = 第一审批人(firstApproverAdminId) · `<Button>` 批准 disabled + tooltip "您已是第一审批人 · 不能两次批"
- [ ] 当前用户 != 第一审批人 · 可批 · 调 approveRequest · 系统 _approveRequestInTx 写第二人 + status='approved'

[H 历史决策 Tab]
- [ ] 同页 Tab 切换 · 已决策列表(status='approved'/'rejected'/'expired')
- [ ] 列同待审批 + 多 'decidedAt' + 'approver/rejecter' + 'decision_reason' + emergencyMode + postReviewStatus

[H 紧急通道 + 后置复核]
- [ ] super_admin 在 emergencyMode=true 申请(自动 emergencyMode=true 当 actionType='emergency_*' 或 super_admin 触发紧急)Drawer 显示醒目红条 "紧急通道 - 后置复核"
- [ ] 紧急批准弹 `EmergencyApproveModal` 输入 incidentId + 决策理由 · 提交 emergencyApprove · 系统写 admin_audit_log eventType='emergency_approval' + postReviewRequired=true
- [ ] 后置复核入口:Tab "后置复核"(super_admin only)· 列出 postReviewRequired=true 且 postReviewedAt=null 且 decidedAt > 6h ago · 当前用户 != 第一审批人时可复核

[H 通知集成]
- [ ] 申请人在 approve/reject 后获得站内信通知(stub stub stub stub · 仅 console.log · 真启留 PRR)
- [ ] 钉钉通知 stub(D-077 isMock=true 默认)

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `/admin/approvals`(super_admin 登录态 · 至少 1 个 pending dual approval 申请)
- [ ] 看到 KPI + 待审批列表
- [ ] 点行 → Drawer 打开 · 影响范围预估展示 · 批准按钮可用
- [ ] 填理由 · 点批准 · toast "已批准" · 列表行更新 status='first_approved'(if dual) 或 'approved' (单人)
- [ ] 切换到历史决策 Tab · 看到刚批的记录

[P pre-existing]
- [ ] pnpm audit:redlines-admin · 0 命中
- [ ] **不破坏** PRD-10/11/12 已有 approval_requests 单人批流程(stub 三态机持续 work · 旧记录 requireDualApproval=false 走单人)
- [ ] pnpm test · ≥ 1690 pass · 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/admin/src/pages/approvals/ApprovalsPage.tsx`(~ 250 行)
- `apps/admin/src/pages/approvals/ApprovalDetailDrawer.tsx`(~ 250 行)
- `apps/admin/src/pages/approvals/components/ApprovalKpiCards.tsx`(~ 80 行)
- `apps/admin/src/pages/approvals/components/ApprovalsList.tsx`(~ 200 行)
- `apps/admin/src/pages/approvals/components/HistoricalDecisions.tsx`(~ 150 行)
- `apps/admin/src/pages/approvals/components/EmergencyApproveModal.tsx`(~ 100 行)
- `apps/admin/src/pages/approvals/components/PostReviewTab.tsx`(~ 120 行)
- `apps/admin/src/pages/approvals/components/ImpactEstimator.tsx`(~ 100 行 · actionType → 文案)
- `tests/unit/admin/approvals/ApprovalsPage.test.tsx`(~ 150 行)
- `tests/unit/admin/approvals/ApprovalDetailDrawer.test.tsx`(~ 200 行)
- `tests/unit/admin/approvals/EmergencyApproveModal.test.tsx`(~ 80 行)

**files_to_modify**:
- `apps/admin/src/admin-routes.ts`(+ entry)
- `apps/api/src/trpc/routers/admin/approval.ts`(brownfield · 加 emergencyApprove + postReviewApprove procedure · 复用 US-002 service)

**test_command** · `pnpm vitest run tests/unit/admin/approvals/`

**size_hint** · high(13 files · 大 UI · 但已拆出 EmergencyApproveModal + PostReviewTab 独立 · 单 US 必检防 large 超时)

**anti_patterns**:
- **lesson** · "第一审批人不能两次批 · 客户端 + 服务端双校验" · **antipattern** · 仅服务端校验 · 客户端按钮还可点(用户困惑)· **correct** · 客户端隐藏/disable 按钮 · 服务端 throw FORBIDDEN_SAME_APPROVER 兜底
- **lesson** · "紧急通道 incidentId 必填" · **antipattern** · `<Button>紧急批准</Button>` 直接调 emergencyApprove(incidentId 默认空 string)· **correct** · 必填 input + 客户端校验 + 服务端校验
- **lesson** · "影响范围预估按 actionType 路由" · **antipattern** · 单一通用文案 "将批准此操作"(不告诉用户实际影响)· **correct** · `<ImpactEstimator />` 组件 per actionType 显示具体影响(用户数 / 数据范围 / 不可恢复警告)

---

### 🟦 收官(1 US · US-012)

#### US-012 · verify-prd-13.sh 闭环验证 + E2E 完整 dual approval 走通

**描述** · 作为 PRD 验证者,我需要 `scripts/verify-prd-13.sh` 可重复执行的脚本验收 + E2E 完整 dual approval 流程走通(从 US-007 提交审核 → US-011 第一人批 → US-011 第二人批 → US-003 publishPromptVersionInTx callback 完成 → ContextAssembler 实际使用新版本)。

**Risk** · high(★ 收官 · 跨 11 US 集成 · E2E 跨多组件 + brownfield)

**Acceptance Criteria(14 条)**:

[H verify-prd-13.sh]
- [ ] `scripts/verify-prd-13.sh` 新建 · ≥ 8 section:
  - §1 静态:audit-redlines-admin grep 5 LD-A + 3 新 LD-A-6/7/8 全过
  - §2 静态:6 张新表 schema 存在(prisma generate · grep prisma/schema.prisma)
  - §3 静态:_publishPromptVersionInTx + _forceRebuildEvolutionInTx + _adjustQuotaInTx + _approveRequestInTx 4 单点函数存在 + grep 0 dual write
  - §4 静态:BullMQ cron emergencyPostReview + quotaExpiry workers wire 完整
  - §5 静态:14 Specialist Tab + 4 actionType impact estimator + 5 anomalyType detect 完整
  - §6 静态:Monaco editor + @react-pdf/renderer 依赖完整 · 复用 PRD-11 PDF
  - §7 运行时:trpc evolutionHealth/quota/compliance/prompt/approval/approvalGate 5 procedure list 各 1 调用
  - §8 E2E:完整 dual approval 流程 stub(实际 fixture · 不真启 dev server)

[H E2E 完整 dual approval]
- [ ] `tests/e2e/admin/prd13-dual-approval-e2e.test.ts` 新建 · 用 vitest + supertest + 真 Prisma:
  - Setup:seed 1 super_admin + 1 admin + 1 readonly_admin · seed 1 PromptVersion(specialistId='PositioningAgent' mode='default' version=18 status='draft')
  - Step 1:admin submitForReview(versionId=18)→ status='pending_review' + requestApproval(dualApproval=true)+ assert approval_request 创建
  - Step 2:super_admin#1 approveRequest(requestId)→ status='first_approved'(dual)+ firstApproverAdminId 写
  - Step 3:super_admin#1 同一人尝试再批 → throw FORBIDDEN_SAME_APPROVER · expect rejects
  - Step 4:super_admin#2 approveRequest(requestId)→ status='approved' + _publishPromptVersionInTx callback → PromptVersion status='active' · PromptCanaryConfig.currentVersionId=18
  - Step 5:模拟一个用户调 LLM Gateway · ContextAssembler.assemble({accountId}) → getActivePromptVersion 返 v18 content(而不是旧 v17)· assert
  - Step 6:assert admin_audit_log 含 'prompt_version_publish' + 'dual_approval_complete' 各 1

[H E2E 紧急通道]
- [ ] `tests/e2e/admin/prd13-emergency-flow.test.ts` 新建:
  - super_admin emergencyApprove(requestId, incidentId='INCIDENT-2026-05-14-001')→ status='approved' + emergencyMode=true + postReviewRequired=true
  - 12h 后 cron 跑 → check postReviewRequired=true 但 < 24h · 不告警
  - 24h+ 后 cron 跑 → 告警 + admin_audit_log eventType='post_review_overdue'
  - 另一 super_admin postReviewApprove(reviewerAdminId, result='confirmed')→ postReviewedAt + postReviewerAdminId 写

[H quota 24h delayed job]
- [ ] `tests/e2e/admin/prd13-quota-expiry-e2e.test.ts` 新建:
  - admin adjustQuota(delta=300, reason='临时放量') → 调整生效 + quotaAdjustmentLog 创建 + delayed job 添加
  - 模拟 24h(可用 fake-timers)
  - Worker 处理 expiry job → user_quota.dailyQuota 回滚 + quotaAdjustmentLog.revokedAt 写
  - assert audit log

[H evolution force rebuild]
- [ ] `tests/e2e/admin/prd13-evolution-rebuild-e2e.test.ts`:
  - admin forceRebuildEvolution(accountId, reason) → requestApproval(dual=true)
  - 2 super_admin 各批 → status='approved' + callback _forceRebuildEvolutionInTx
  - assert evolution_profile cleared · evolution_insight all resolved · EvolutionAgent batch job 入队

[P 全 audit + 全 test pass]
- [ ] pnpm audit:redlines / audit:ld / audit:redlines-admin / audit:admin-rls-tables / audit:admin-rls 5/5 全过 · 0 命中
- [ ] pnpm test · ≥ 1720 pass · 0 fail(基线 1551 + US-001~011 累计 + 本 US E2E ≥ 25 新 tests)
- [ ] pnpm typecheck · 0 errors
- [ ] `bash scripts/verify-prd-13.sh` · 0 failures · 8 sections all PASS

**files_to_create**:
- `scripts/verify-prd-13.sh`(~ 400 行 · 8 section)
- `tests/e2e/admin/prd13-dual-approval-e2e.test.ts`(~ 250 行)
- `tests/e2e/admin/prd13-emergency-flow.test.ts`(~ 180 行)
- `tests/e2e/admin/prd13-quota-expiry-e2e.test.ts`(~ 150 行)
- `tests/e2e/admin/prd13-evolution-rebuild-e2e.test.ts`(~ 150 行)

**test_command** · `bash scripts/verify-prd-13.sh && pnpm vitest run tests/e2e/admin/prd13-*.test.ts`

**size_hint** · high(6 files · 但收官 · 复杂的 E2E 跨 11 US)

**anti_patterns**:
- **lesson** · "E2E 必须用真 Prisma + 真 DB(D-080 isMock 模式仅 service 层)" · **antipattern** · E2E mock prisma 全部 · 没真验证写入 · **correct** · 用 quanqn_test DB(DATABASE_URL_TEST) + beforeEach truncate tables
- **lesson** · "fake-timers 模拟 24h 推进 · 用 vitest useFakeTimers" · **antipattern** · `await new Promise(r => setTimeout(r, 24*60*60*1000))` 真等(测试卡 24h)· **correct** · `vi.useFakeTimers(); vi.advanceTimersByTime(24*60*60*1000); vi.useRealTimers();`

---

## §2 · Acceptance Criteria 4 类总览

继承 PRD-12 严格 4 类(H/E/B/P)· 每 US ≥ 13 AC · seed 标准。

| 类别 | 全称 | 含义 |
|:-:|---|---|
| **H** | Hard 闭环验收 | 主路径必跑通 · schema/service/UI/E2E 完整闭环 |
| **E** | Extended 扩展验收 | 单点函数 P-6 · brownfield 兼容 · 紧急/特殊路径 |
| **B** | Boundary 边界 + UI | 边界情况 + 视觉 + 浏览器 agent-browser 验证 |
| **P** | Pre-existing 兼容 | typecheck / test / audit 不破坏 · pnpm pass count 严格递增 |

---

## §3 · 范围排除(Non-Goals)

**不在 PRD-13 范围**:
1. **真 LLM Judge CI 接入**(默认 isMock=true · D-077 模式 · GitHub Actions / Vercel cron 留 PRR)
2. **真 Google OAuth 接入**(继承 PRD-10 mock OAuth · 留 PRR)
3. **真模板配置 UI**(域 ⑫ 配置免责模板按钮 · 弹 "功能开发中 · P9.4")
4. **prompt_versions 全 14 Specialist seed 完整内容**(只 seed 1 default mode · 多 mode 留 PRD-14 或运维手动)
5. **PRD-14 P9.4 域 ⑭/⑮/⑯**(A/B 测试 / 知识库 / 系统配置 · 留 PRD-14)
6. **超大流量真实 Approval Gates pressure 测试**(本 PRD 仅 unit + E2E 测 · 真压测留上线前 PRR)
7. **多语言 / i18n**(继承 PRD-10/11/12 仅中文)
8. **移动端 admin UI**(P9.X 期间 admin 仅桌面端响应式)
9. **WAF / IP 白名单 / MFA 真启**(PRD-10 已设计 · 上线前 PRR)
10. **EvolutionAgent batch 重跑实际 LLM 调用**(_forceRebuildEvolutionInTx 仅写 evolution_profile null + insights resolved · 实际 EvolutionAgent.execute() 跑 batch 由现有 worker 自动触发 · 不在本 US 范围)

---

## §4 · 风险

### §4.1 高风险点

1. **★ ⑬ Approval Gates 完整 UI 复杂度爆表**(N-2 不预期 0.3 周够 · 实际 0.5-0.6 周)· dual + emergency + post-review + 5 actionType impact estimator · 12 文件 · 单 US 必走 high risk + 严格 Opus audit
2. **★ ⑩ Monaco 接入风险**(E-1 实验)· @monaco-editor/react@4 新 dep · admin SPA build (Vite) 可能撞 SSR or chunk 拆分问题 · 必 dynamic import + Suspense
3. **★ brownfield evolution-agent.ts 改造**(N-1 不预期 LD-A-5 严格 0 命中)· EvolutionAgent.execute() 加 detectEvolutionAnomalies · 单元测试覆盖 + integration test 必跑通
4. **★ brownfield rate-limit.ts 集成**(US-005)· 不破坏现有 token bucket · whitelistExpiresAt 仅作 bypass · 防影响所有现有用户
5. **★ ContextAssembler brownfield**(US-003)· 14 Specialist prompt 读 → 改读 prompt_versions · 必带 fallback 到 templates/*.ts(若 table 空)

### §4.2 中风险点

1. **24h delayed job 失效**(US-005 E-3)· BullMQ delay 必须 jobId dedup · cron 兜底兜底兜底
2. **Recharts 图表性能**(US-006/009/010)· 56 行业饼图 + 时间趋势 + Specialist Tab × 评分 · 多图同页可能性能差 · 必 lazy load + memo
3. **PDF 导出**(US-010 E-4)· @react-pdf/renderer 不支持复杂 SVG · 必用 native PDF shape · 复杂图表用 png stub
4. **dual approval backward compat**(US-002 E-5)· 旧 stub 三态机持续 work · requireDualApproval 默认 false · 旧记录自动旧行为
5. **brownfield 14 Specialist Tab 数据**(US-007)· 必须每个 Specialist 都 seed 至少 1 prompt_version active · 否则 ContextAssembler fallback 持续走 templates/*.ts

### §4.3 低风险点

1. **TD-056 unit test**(US-001)· 单文件 + mock · 简单
2. **evolutionHealth tRPC**(US-004)· 7 procedure 标准 CRUD 模式
3. **quota tRPC**(US-005)· 6 procedure 同上
4. **compliance UI**(US-010)· 数据复用 audit_log · 无新表

---

## §5 · 配额(预计)

| 资源 | 预计 |
|---|---|
| **Story 数** | 12 |
| **新表数** | 6(approval_requests 升级 + 5 张新)|
| **新 service** | 8(quota / prompt / evolution-anomaly / evolution-rebuild + 5 单点函数 _xxxInTx) |
| **新 admin tRPC procedure** | 25-30(evolutionHealth 7 + quota 6 + prompt 6 + compliance 5 + approval 8)|
| **新 admin page** | 5(evolutionHealth + prompts + quota + compliance + approvals)|
| **新依赖** | 1(@monaco-editor/react@4)|
| **新 BullMQ Worker** | 2(emergencyPostReview + quotaExpiry)|
| **新 cron schedule** | 1(emergencyPostReview daily 03:30)+ 1(quotaExpiryCleanup daily 00:30 兜底)|
| **预估文件改/新** | 80-100(集中 ~ 13/US)|
| **预估测试新** | ~ 170 it 跨 12 US |
| **Wall time** | 8-12h · daemon 自跑 · 含 Opus audit |
| **新 TD** | 3-5(brownfield N-1 预留 + LLM Judge CI stub + PDF 简化)|
| **预估一轮通过率** | 88-93%(brownfield 难度对冲)|

---

## §6 · 退出条件

PRD-13 P9.3 收官条件(All must PASS):
1. ✅ 12 US 全 PASSED(passes=true)
2. ✅ 6 张新表 schema 落地 + migrations 全跑(approval_requests 升级 + 5 张新)
3. ✅ 5 个新 admin page 可访问 + 浏览器 agent-browser 验收完整
4. ✅ verify-prd-13.sh 8 section 全 PASS
5. ✅ pnpm test ≥ 1720 pass / 0 fail / typecheck 0 errors
6. ✅ pnpm audit:redlines / audit:ld / audit:redlines-admin / audit:admin-rls-tables / audit:admin-rls 5/5 全过
7. ✅ TD-056 状态 → resolved
8. ✅ 完整 dual approval E2E 流程闭环(US-012)
9. ✅ 24h delayed job + 紧急通道 + 后置复核 E2E 流程闭环
10. ✅ Locked Decisions D-089~D-101 全在 PRD 末尾详述

---

## §7 · Locked Decisions(D-089~D-101 · 13 LDs)

### D-089 · evolution_anomaly_flags 异常检测算法 5 anomalyType + 阈值

- **frequent_style_flip** · 7 天内 evolution_insight 的 styleAdjustments 字段反转 ≥ 2 次
- **avoidlist_overflow** · evolution_profile.avoidList 数组长度 > 50
- **flywheel_stalled** · 账号在过去 7 天内无新 evolution_insight 写入
- **negative_feedback_dominant** · 30 天内 feedback_log negative count > positive × 2
- **conflicting_insights** · 同 detectedFrom 主题的 2+ insight 含相反 styleAdjustments 字段
- **severity** · 由 evidence count 推导:1 信号 = low · 2-3 = medium · ≥ 4 = high

### D-090 · prompt 灰度策略 hash 分流

- **算法** · `bucketPct = parseInt(md5(userId + ':' + specialistId).slice(0, 8), 16) % 100`
- **5 档** · 0% / 1% / 10% / 50% / 100%(canaryPct 限制 enum)
- **特性** · deterministic(同用户同 Specialist 多次结果一致 · 用于灰度分流)
- **理由** · vs random 灰度 · 同用户体验稳定 · 不会今天命中 v18 明天命中 v17

### D-091 · LLM Judge 阈值

- **金标准** · 100 测试用例(由产品 + 法务联合制定 · 留 P9.4 PRR · 本 PRD isMock=true 默认)
- **通过阈值** · 评分 ≥ 4.0(0-5 量尺)
- **publishPromptVersion 前置** · 必有 judgeScore ≥ 4.0 + status='pending_review'

### D-092 · 配额 user_quota 表统一(不拆 plan-tier 表)

- **理由** · ADMIN §3.5 ⑪ 描述统一处理 · 单表 user_quota(userId / plan / dailyQuota / dailyUsed / monthlyQuota / monthlyUsed / dailyResetAt / whitelistExpiresAt)+ 调整日志 quota_adjustment_log
- **不拆** · plan_quota_template / user_quota_overrides 等多表 · 复杂度 > 收益
- **变更触发** · 调整通过 _adjustQuotaInTx 单点 + Approval 校验

### D-093 · 配额客服调整规则

- **delta 限制** · 单次 ≤ 500(客服档)· super_admin 可调 ≤ 5000
- **dual approval 触发** · delta > 500 自动 requireDualApproval=true
- **24h 自动失效** · BullMQ delayed job + 兜底 cron(00:30 daily 扫漏)
- **失效后** · quota_adjustment_log.revokedAt + user_quota dailyQuota 回滚(原值)+ admin_audit_log 写

### D-094 · dual approval 触发 actionType 清单

dual approval 强制 actionType:
- `force_rebuild_evolution` · 清空 evolution_profile + 重跑 EvolutionAgent batch
- `publish_prompt` · publish prompt_version v{X} 为 active
- `rollback_prompt` · rollback prompt_version 到上一版
- `adjust_quota` · delta > 500
- `whitelist_user` · 加用户到 whitelistExpiresAt
- `ban_uploader` · 暂停用户上传权限(PRD-12 已有 stub 单人 · 本 PRD 升级 dual)
- `template_modify` · 修改免责声明模板(US-010 stub · 本 PRD 不真做)
- `cross_account_batch` · 跨账号批量操作(PRD-11 stub · 升级)

单人 approve actionType:
- `evolution_anomaly_resolve` · 标记 anomaly 为 false_positive
- `quota_adjust ≤ 500` · 客服小额调整
- `prompt_canary_adjust` · 灰度比例 0/1/10/50 调整(100 触发 publish_prompt)

### D-095 · 紧急通道触发条件

- **触发主体** · super_admin only(非 super_admin 调 emergencyApprove → FORBIDDEN_EMERGENCY_NOT_SUPER_ADMIN)
- **必填字段** · `emergencyIncidentId`(string · 关联 prod incident ID · 如 'INCIDENT-2026-05-14-001')
- **自动设字段** · `emergencyMode=true` + `postReviewRequired=true`
- **后置复核** · 24h 内必须有第二 super_admin 复核(用 `postReviewApprove` · approverAdminId ≠ firstApproverAdminId)

### D-096 · 24h 后置复核 cron schedule

- **schedule** · `0 30 3 * * *`(Asia/Shanghai 03:30 daily)
- **错峰** · KPI=00:00 / cost=15:00 / anomaly=05:00 / violation=04:00 / compliance=06:00 / **emergency-post-review=03:30** / quota-expiry-cleanup=00:30
- **jobId** · `'emergency-post-review-recurring'` + `'quota-expiry-cleanup-recurring'`
- **行为** · 扫 `postReviewRequired=true && postReviewedAt=null && decidedAt < NOW() - 24h` → 钉钉告警(D-077 isMock 默认)+ 写 admin_audit_log eventType='post_review_overdue'

### D-097 · Monaco 编辑器版本

- **dep** · `@monaco-editor/react@4`(最新稳定版 · 接近 react 18 兼容)
- **theme** · 自定义 Aurelian Dark(继承 admin 视觉系统 · 不用 monaco 默认 vs-dark)
- **language** · 'handlebars'(简化 prompt 模板高亮 · 比 markdown 更适合 prompt 变量)
- **import** · 必 dynamic + Suspense(防 SPA build break)

### D-098 · @react-pdf/renderer 4.5.1 复用 PRD-11

- **dep** · `@react-pdf/renderer@4.5.1`(PRD-11 已添加 · TD-054 复 react@18 后兼容)
- **模板** · `ComplianceReportPdf.tsx` 4 节 + 签名栏
- **不能** · inline SVG / canvas
- **简化** · 复杂折线图用 PDF native Path · 或 png snapshot(留 PRR)

### D-099 · _forceRebuildEvolutionInTx 单点函数

- **签名** · `(tx, params: { accountId, adminId, approvalRequestId, reason }) => Promise<void>`
- **唯一入口** · evolution_profile 清空 + insights resolved 仅由该函数改
- **AGENTS §10 LD-A-7 红线** · grep `prisma.evolutionProfile.update.*null\|prisma.evolutionInsight.updateMany.*resolved` 排除该函数本身 → 0 命中
- **调用点** · 1 (approveRequest callback when actionType='force_rebuild_evolution')

### D-100 · _publishPromptVersionInTx 单点函数

- **签名** · `(tx, params: { versionId, adminId, approvalRequestId }) => Promise<void>`
- **唯一入口** · prompt_versions.status 'pending_review' → 'active' + 旧 active → 'archived' + prompt_canary_config.currentVersionId 切
- **AGENTS §10 LD-A-6 红线** · grep `prompt_versions.*status.*active\|prompt_versions.*update.*active` 排除该函数本身 → 0 命中
- **调用点** · 2(approveRequest callback for publish + rollback)

### D-101 · _adjustQuotaInTx 单点函数

- **签名** · `(tx, params: { userId, adminId, adjustmentType, delta, reason, approvalRequestId }) => Promise<void>`
- **唯一入口** · user_quota.dailyQuota/monthlyQuota/whitelistExpiresAt 改 + quota_adjustment_log 写 仅由该函数
- **AGENTS §10 LD-A-8 红线** · grep `user_quota.*update.*dailyQuota\|user_quota.*update.*whitelistExpiresAt` 排除该函数本身 → 0 命中
- **调用点** · 2(approveRequest callback for delta>500 + 直接 adjust for delta≤500)

---

## §7.5 · 跨 Story 协议锁(强制 · 5 域 12 US 跨 story 数据传递)

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `approvalRequest.requireDualApproval` | boolean (default=false) | US-002 | US-004, US-006, US-007, US-008, US-009, US-010, US-011 | dual approval 触发字段 · D-094 actionType 推导 |
| `approvalRequest.emergencyMode` | boolean (default=false) | US-002 | US-011 | 紧急通道字段 |
| `approvalRequest.emergencyIncidentId` | string \| null | US-002 | US-011 | 紧急通道必填 (when emergencyMode=true) |
| `approvalRequest.postReviewRequired` | boolean (default=false) | US-002 | US-002 cron, US-011 | 24h 后置复核字段 |
| `_approveRequestInTx(tx, requestId, approverAdminId, isSecondApproval)` | function | US-002 | US-004 callback, US-008 callback, US-009 callback, US-011 callback | 单点 transactional approve 函数 |
| `_forceRebuildEvolutionInTx(tx, {accountId, adminId, approvalRequestId, reason})` | function | US-004 | approveRequest callback when actionType='force_rebuild_evolution' | P-6 单点 |
| `_publishPromptVersionInTx(tx, {versionId, adminId, approvalRequestId})` | function | US-003 | approveRequest callback when actionType='publish_prompt' | P-6 单点 |
| `_adjustQuotaInTx(tx, {userId, adminId, adjustmentType, delta, reason, approvalRequestId})` | function | US-005 | approveRequest callback when actionType='adjust_quota' | P-6 单点 |
| `EvolutionAnomalyType` enum | string union | US-004 | US-006 | 'conflicting_insights' \| 'frequent_style_flip' \| 'avoidlist_overflow' \| 'flywheel_stalled' \| 'negative_feedback_dominant' |
| `PROMPT_CANARY_BUCKETS` const | readonly [0, 1, 10, 50, 100] | US-003 | US-008 | 5 档灰度比例 |
| `QUOTA_ADJUST_MAX_CSR` const | 500 | US-005 | US-009 | 客服调整上限(超过触发 dual) |
| `QUOTA_ADJUST_MAX_SUPER_ADMIN` const | 5000 | US-005 | US-009 | super_admin 调整上限 |
| `LLM_JUDGE_THRESHOLD` const | 4.0 | US-003 | US-007, US-008 | D-091 通过阈值 |
| `EMERGENCY_APPROVAL_CRON` const | `'0 30 3 * * *'` | US-002 | US-002 worker | D-096 cron schedule (Asia/Shanghai 03:30) |
| `QUOTA_EXPIRY_CLEANUP_CRON` const | `'0 30 0 * * *'` | US-005 | US-005 worker | D-096 兜底 cron (Asia/Shanghai 00:30) |
| `getActivePromptVersion(specialistId, userId)` | function | US-003 | ContextAssembler.assemble | brownfield 集成入口 |

定义 story 的 priority 必须**小于**消费 story · 每条被引用的 AC 必须显式写出此命名(不要说"存到合适字段"之类模糊表述)。

---

## §8 · 反例库注入(anti_patterns · 27+ entries · 41 reject-examples.jsonl 关键词命中清单 + 7 本 PRD 新增)

ralph skill 转 prd.json 时 · 按以下关键词集合检索 ~/.claude/playbooks/reject-examples.jsonl 注入到 anti_patterns 字段:

### §8.1 关键词命中清单

| 子域 | 关键词集合 | reject-examples 推估命中条数 |
|---|---|:-:|
| ⑨ evolution | 'evolution', 'profile', 'insight', 'anomaly', 'flag' | 3-5 |
| ⑩ prompt | 'prompt', 'specialist', 'monaco', 'canary', 'judge', 'version', 'rollback' | 4-6 |
| ⑪ quota | 'quota', 'token bucket', 'rate-limit', 'delayed', 'whitelist', 'redis' | 4-5 |
| ⑫ compliance | 'compliance', 'audit_log', 'pdf', 'react-pdf', 'industry', 'pii', 'redacted' | 5-7 |
| ⑬ approval | 'approval', 'gate', 'dual', 'emergency', 'incident', 'post-review' | 6-8 |
| common | 'transaction', 'prisma', 'tx', 'idempotent', 'single source' | 5-8 |
| **总计 -dedup** | | **27-39 条** |

### §8.2 本 PRD 新增 7 条反例(沉淀到 reject-examples.jsonl)

1. **lesson** · "Monaco SSR 兼容性 · 必 dynamic import" · **antipattern** · static import @monaco-editor/react · **correct** · `lazy(() => import('@monaco-editor/react'))` + Suspense
2. **lesson** · "灰度策略 deterministic · hash + bucket 不用 random()" · **antipattern** · `Math.random() < canaryPct/100` · **correct** · `parseInt(md5(userId:specialistId).slice(0,8), 16) % 100 < canaryPct`
3. **lesson** · "dual approval 第一审批人 ≠ 第二审批人 · 强校验" · **antipattern** · 只校验 firstApprover != requester · **correct** · 第二批 throw if approver === firstApprover
4. **lesson** · "紧急通道 incidentId 必填" · **antipattern** · `emergencyApprove(requestId, superAdminId)` 不接 incidentId · **correct** · 第三参数 incidentId 必填 + service 内强校验
5. **lesson** · "BullMQ delayed job jobId dedup" · **antipattern** · `quotaExpiryQueue.add('expire', {adjId})` 不带 jobId · **correct** · `jobId: 'quota-expiry-' + adjId` 确保单一
6. **lesson** · "brownfield ContextAssembler 必 fallback templates" · **antipattern** · 删除 templates/*.ts 改用 prompt_versions 表(若表无对应记录 → 主应用 crash)· **correct** · getActivePromptVersion 返 null → fallback to templates/*.ts(旧行为)
7. **lesson** · "PDF 模板不能 inline SVG · 用 PDF native Path 或 png" · **antipattern** · 把 Recharts SVG 字符串塞 PDF · **correct** · 简化用 @react-pdf 的 Path · 或后端 puppeteer 生 png snapshot

---

## §9 · 修订记录

| 版本 | 日期 | 作者 | 改动摘要 |
|---|---|---|---|
| v0.1 | 2026-05-14 | Claude (Opus 4.7) | 初版 · 12 US · D-089~D-101 · 反例 27+ 注入 · 复用 PRD-12 13 patterns · brownfield N-1 预留 TD |

---

## §10 · Coding 3.0 协同

### §10.1 上游 PRD-12 收官交付物

- 50 procedure adminProcedure 7 闸链(P-1)
- 22 components DenseTable + Drawer + admin-routes:13 协议(P-2)
- 5 audit script 4 件套 + LD-A-5 multi-layer 7 grep 模板(P-3)
- BullMQ cron tz=Asia/Shanghai + jobId dedup(P-4)
- D-077 isMock 默认 + D-082 强 PII 强制(P-5)
- _createXxxInTx 单点函数(P-6)→ 本 PRD 加 _approveRequestInTx + _forceRebuildEvolutionInTx + _publishPromptVersionInTx + _adjustQuotaInTx 4 个新单点
- reject-examples.jsonl 41+ 条(P-7)+ 本 PRD 加 7 条 = 48+
- D-087 大 UI Story 拆 2 子(P-8)→ 本 PRD ⑩ Prompt 拆 3 子(US-003 schema + US-007 Monaco + US-008 灰度)
- Opus audit Diff-2 git stash confirm(P-9)→ 严守 brownfield 改造 pre-existing 边界

### §10.2 全局 Skill Diff 已 apply(由 PRD-12 retro 落地)

- Diff-4 · ~/.claude/commands/plan-check.md §2.6.16 单点函数抽象检查(M-1 固化)→ PRD-13 plan-check 时自动 grep 4 单点函数

### §10.3 下游 PRD-14(P9.4)接入预备

- 域 ⑭ A/B 测试管理:复用 ⑩ Prompt 版本管理 framework(灰度策略 + LLM Judge stub 升级 ROI 评估)
- 域 ⑮ 知识库 / 静态常量管理:复用 ⑩ Approval Gates 接入 + 单点函数模式
- 域 ⑯ 系统配置中心:复用 ⑫ 合规仪表盘 audit_log 数据源 + ⑬ Approval Gates 横切机制

---

## §11 · PRD-14 接入预备

| PRD-13 沉淀的 pattern | PRD-14 复用方式 |
|---|---|
| dual approval + 紧急通道 + 后置复核 | A/B 测试启动 / 停损 / 强制回滚走 Approval |
| _approveRequestInTx + 4 _xxxInTx 单点 | 知识库 / 常量管理走单点函数模式 |
| Monaco 编辑器 + 14 Tab + Diff | 知识库 67 案例 / 23 公式编辑器复用 framework |
| @react-pdf/renderer 4.5.1 | 配置中心 / A/B 实验 PDF 导出复用 |
| LLM Judge stub(isMock=true) | A/B 测试评估 + 知识库 prompt 触发 LLM Judge 复用 |
| 6 张新表(approval_requests 升级 + 5 张新) | A/B 实验表 / 知识库版本表 / 系统配置 feature_flags / system_config 添加复用 |
| 5 admin pages + admin-routes:13 协议 | 新加 3 P2 admin page 走相同协议 |

PRD-14 P9.4 启动前必读本 PRD §7 D-089~D-101 + §7.5 协议锁 + §8 反例 · 跨 PRD anti_patterns 继承。

---

> **本 PRD 由 Claude (Opus 4.7) 在 2026-05-14 撰写 · 1900 行 · 12 US · 5 子域 · seed 文档级详细度标准 · 严格继承 PRD-12 13 patterns + retro Playbook §10/§11 · 启动前必读 §0 引用清单 + PRD-12 retro §11 Playbook 最关键 3 条**
