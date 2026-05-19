# PRD-14 · P9.4 P2 高级域(3 域 · 15 US)

> **版本** · v0.1(2026-05-14)
> **范围** · admin P9.4 3 P2 高级域(⑭ A/B 测试管理 + ⑮ 知识库 / 静态常量管理 + ⑯ 系统配置中心)· 完整版本(per 用户决策 · 2w · 12-15 US 上限)
> **派生** · ADMIN-ARCHITECTURE.md §3.7 + §8.6 + DATA-MODEL.md §13.7(4 张 P2 占位表)+ ARCHITECTURE.md §6.5.1 (PRD-13 加 ContextAssembler 6 路 · 本 PRD 加第 7 路 _fetchActiveConstant)
> **依赖** · PRD-13(P9.3 健康度域全 12 US PASSED · 4 _xxxInTx 单点函数家族 + 8 LD-A 红线 + 协议锁机制)
> **预估** · 15 US · 14 LDs(D-102~D-115)· §7.5 协议锁 18+ entries · daemon cycle 12-15h · 落 PRD-13 retro §12.1 预测区间

---

## §0 · 引用清单(必读 · 启动 PRD-14 前)

### §0.1 战略骨架文档

| # | 文档 | 章节 | 用途 |
|:-:|---|---|---|
| 1 | [ADMIN-ARCHITECTURE.md](../ADMIN-ARCHITECTURE.md) | §3.7 P2 后续版本 3 域 | ⑭/⑮/⑯ 3 域核心能力定义 |
| 2 | [ADMIN-ARCHITECTURE.md](../ADMIN-ARCHITECTURE.md) | §8.6 P9.4 路线 | 1 周(用户改 2 周完整版)+ 退出条件 |
| 3 | [ARCHITECTURE.md](../ARCHITECTURE.md) | §6.5 LLMGateway + §6.5.1 ContextAssembler 6 路 | brownfield 加第 7 路 _fetchActiveConstant |
| 4 | [DATA-MODEL.md](../DATA-MODEL.md) | §13.7 P2 4 张占位表 | ab_experiments / ab_assignments / feature_flags / system_config |
| 5 | [AGENTS.md](../AGENTS.md) | §10.1 LD-A1~A8 + §10.2 R-A1~A6 | 7 闸链 + 8 LD-A + 6 R-A 严守 |

### §0.2 PRD-13 收官交付物(直接复用)

| 复用项 | 来源 | 用法 |
|---|---|---|
| approval_requests + dual approval + emergency + 24h post-review | PRD-13 US-002 | 本 PRD 高风险动作全走 |
| prompt_versions framework(版本化 + 灰度 + 回滚 + Monaco) | PRD-13 US-003/007/008 | 域 ⑮ 知识库版本化 1:1 fork pattern |
| Approval Gates UI(7 actionType ImpactEstimator) | PRD-13 US-011 | 域 ⑯ 紧急开关 + Approval 链复用 |
| _approveRequestInTx + 4 _xxxInTx 单点函数家族 | PRD-13 D-099/D-100/D-101 | 本 PRD 加 3 单点 → 4+3=7 单点家族 |
| LD-A6/A7/A8 + audit script grep + AGENTS §10.1 三方一致 | PRD-13 LD-A 红线模板 | 本 PRD 加 LD-A9/A10/A11 → 8+3=11 LD-A 总 |
| BullMQ delayed job + jobId dedup + 错峰 cron | PRD-13 US-005 quota-expiry | 域 ⑭ A/B 实验时间窗 + 域 ⑯ 紧急开关失效 |
| ContextAssembler 6 路并行 fetch + brownfield fallback | PRD-13 US-003 + ARCHITECTURE §6.5.1 | 域 ⑮ 加第 7 路 _fetchActiveConstant |
| D-077 isMock=true LLM Judge stub | PRD-13 全 3 处 | 域 ⑮ 常量改动触发 LLM Judge 跑分复用 |
| 8 Codebase Patterns(progress.txt · /prd-retro 已沉淀) | PRD-13 prd-retro §13 | ralph daemon dev 时全部继承 |

### §0.3 PRD-13 retro §11 Playbook 严格执行

**P-1 ~ P-9 必做项**(本 PRD 全部复用):
- P-1 · 7 闸链 adminProcedure(全 4 admin pages 复用)
- P-2 · DenseTable + Drawer + admin-routes:13 协议(全 4 page)
- P-3 · LD-A 红线 + audit script + AGENTS §10.1 三方一致(本 PRD 新加 LD-A9/A10/A11 同模板)
- P-4 · BullMQ cron tz=Asia/Shanghai + jobId dedup + 错峰(本 PRD 加 ab-experiment-stop-loss + emergency-switch-expiry)
- P-5 · D-077 isMock=true default(本 PRD 域 ⑮ LLM Judge 复用 PRD-13 US-003)
- P-6 · _xxxInTx 单点函数(本 PRD 加 3 新 · _startAbExperimentInTx + _publishConstantVersionInTx + _emergencySwitchInTx)
- P-7 · reject-examples.jsonl 注入(35 历史 + 7 PRD-13 新 + 本 PRD 5 新 = 47+)
- P-8 · 大 UI Story 拆 ≥ 2 子(域 ⑮ 知识库 5 US 拆 schema + import + 灰度 + UI×2)
- P-9 · Opus audit Diff-2 git stash double-validation

**N-1 ~ N-5 不做项**(避免):
- N-1 · 不滥用 foundation 档(本 PRD 限 ≤ 4 个 foundation · US-001/006/011 + 收官 US-015)
- N-2 · 不漏 LD-A 红线 metadata 三方一致(per PRD-13 TD-059 教训 · plan-check 2.6.17 自动 catch)
- N-3 · 不允许 large UI story file > 12(防 PATH-B 超时)
- N-4 · 不允许 architectural decision 漏建 PRD files_to_create 列的 test file(per plan-check 2.6.18 自动 catch)
- N-5 · 不让 self-fix 主动度 > 3/US

### §0.4 全局 Skill Diff(本 PRD 启动时已 apply · 跟 PRD-13 retro F 一致)

- **plan-check 2.6.17** · LD-A 红线三方一致性(audit script + AGENTS + 单点函数)
- **plan-check 2.6.18** · files_to_create test 覆盖率(防 ralph 漏建 test file)
- **plan-check 2.6.19** · audit grep 实测对齐(防字面 drift 假绿灯)
- **ralph SKILL · TD 主动清理 hint**(ralph 跑 verify 前 grep open TD · 顺手清重叠 TD)

本 PRD 启动 plan-check 时这 4 检查项自动跑 · 预计避免 TD-057/060/061 类反复。

---

## §1 · 15 User Stories(分 3 子域 + 1 收官)

### 🟦 域 ⑭ · A/B 测试管理(5 US · US-001~005)

★ **完整版**(用户决策)· Chi-square + Welch t-test 双显著性检验 · 多维分析(转化率 / 留存 / 成本)· 自动停损 cron(B 组指标恶化 > 30% 触发回滚 100% control)。复用 PRD-13 US-003 灰度策略 hash + Approval 链。

---

#### US-001 · ab_experiments + ab_assignments schema + service + Approval 触发 · foundation

**描述** · 作为 super_admin · 我需要 ab_experiments + ab_assignments 表 + service 落地 · 以便后续 5 子 US(显著性检验 + 自动停损 + admin UI)依赖。复用 PRD-13 US-002 approval_requests dual approval(actionType='start_ab_experiment' 走 dual)。

**Risk** · foundation(downstream = US-002/003/004/005/015 + 跨 4 下游 PRD)

**Acceptance Criteria(14 条)**:

[H schema]
- [ ] `prisma/schema.prisma` 确认 §13.7 占位 AbExperiment + AbAssignment 已写(line 3436-3464)· 若已有则 verify · 否则按 §13.7 加
- [ ] migration `pnpm prisma migrate dev --name prd-14-ab-experiments` 成功 · seed 0 row(空表)

[H service]
- [ ] `apps/api/src/services/admin/ab-experiment/ab-experiment.service.ts` 新建 · 核心导出:
  ```typescript
  export type AbVariant = 'control' | 'variant_a' | 'variant_b';

  export interface CreateAbExperimentParams {
    experimentKey: string;       // 全局唯一 · 'prompt_v18_canary' / 'pricing_button_color' 等
    name: string;
    description?: string;
    variantConfig: Record<AbVariant, unknown>;     // { control: {...}, variant_a: {...}, variant_b: {...} }
    trafficAllocation: Record<AbVariant, number>;  // { control: 50, variant_a: 25, variant_b: 25 } · sum=100
    createdByAdminId: number;
  }

  // ★ P-6 单点函数 · 唯一允许设 ab_experiments.status='running' / 'stopped'
  export async function _startAbExperimentInTx(
    tx: Prisma.TransactionClient,
    params: { experimentId: number; adminId: number; approvalRequestId: number }
  ): Promise<void>;

  export async function _stopAbExperimentInTx(
    tx: Prisma.TransactionClient,
    params: { experimentId: number; adminId: number; stopReason: 'manual' | 'auto_stop_loss'; resultSummary?: Prisma.InputJsonValue }
  ): Promise<void>;

  // 公开 API
  export async function createAbExperiment(params: CreateAbExperimentParams): Promise<AbExperiment>;
  export async function startAbExperiment(experimentId: number, adminId: number): Promise<{ approvalRequestId: number }>;
  // ↑ 走 dual approval · actionType='start_ab_experiment'

  export async function assignUserToVariant(experimentId: number, userId: number): Promise<AbVariant>;
  // ↑ deterministic hash · md5(userId:experimentKey).slice(0,8) % 100 < threshold → variant
  ```

[E ★ P-6 _startAbExperimentInTx 单点函数]
- [ ] `_startAbExperimentInTx` 单点 · 接 tx · 写 ab_experiments.status='running' + startedAt = now() · 写 admin_audit_log eventType='ab_experiment_start' eventCategory='high_risk_action'
- [ ] `_stopAbExperimentInTx` 单点 · 接 tx · 写 ab_experiments.status='stopped' + stoppedAt = now() + resultSummary · 写 admin_audit_log eventType='ab_experiment_stop' · 关联 stopReason payload

[E Deterministic 分流]
- [ ] `assignUserToVariant` 用 PRD-13 D-090 hash 算法 · `md5(${userId}:${experimentKey}).slice(0, 8)` · `bucketPct = parseInt(hash, 16) % 100` · 按 trafficAllocation 累积 threshold 分组(control 0-49 / variant_a 50-74 / variant_b 75-99)· 同 user × experiment 多次调结果一致(deterministic)
- [ ] AbAssignment upsert · 第一次分组写入 · 后续重复调用返已有 variant(不重新分组)

[H Approval 触发]
- [ ] `startAbExperiment` 内部强制经 `requestApproval({actionType:'start_ab_experiment', requireDualApproval:true})` · 不绕过
- [ ] `actionType='start_ab_experiment'` 加入 PRD-13 US-002 DUAL_APPROVAL_ACTION_TYPES set(brownfield 改造 approvalGateService.ts:32-41)

[H AGENTS §10.1 LD-A9 红线]
- [ ] AGENTS.md §10.1 加 LD-A9 节(模板参 LD-A6/A7/A8)· `ab_experiments.status='running'|'stopped'` 仅由 `_startAbExperimentInTx` / `_stopAbExperimentInTx` 修改 · grep 命令:
  ```bash
  # 期望 0 命中(ab-experiment.service.ts + ab-stop-loss.job.ts 合法源外)
  grep -rnE "(prisma|db|tx)\.abExperiment\.update.*(status|stoppedAt|startedAt)" \
    apps/api/src --include='*.ts' \
    | grep -v 'ab-experiment.service.ts' \
    | grep -v 'ab-stop-loss.job.ts' \
    | grep -v '.test.'
  ```
- [ ] `scripts/audit-redlines-admin.sh` 加 §LD-A9 段(line 137-155 LD-A8 之后)· grep 同 AGENTS · 9 LD-A 总检测

[P pre-existing 兼容]
- [ ] **不破坏** PRD-13 approvalGateService.ts 现有 8 dual actionType(加 'start_ab_experiment' 到 set 不影响其他)
- [ ] pnpm audit:redlines / audit:ld / audit:redlines-admin · 0 命中(尤其 plan-check 2.6.17 LD-A 三方一致性)
- [ ] pnpm test · ≥ 1730 pass(基线 1727 + 本 US ≥ 3 新 tests · 含 deterministic hash + Approval 集成 + 单点函数)· 0 fail
- [ ] pnpm typecheck · 0 errors

**files_to_create**:
- `apps/api/src/services/admin/ab-experiment/ab-experiment.service.ts`(~ 280 行)
- `apps/api/src/services/admin/ab-experiment/__tests__/ab-experiment.service.test.ts`(~ 220 行 · ≥ 10 it)

**files_to_modify**:
- `prisma/schema.prisma`(verify §13.7 AbExperiment + AbAssignment 在 + 加 index 若缺)
- `apps/api/src/services/admin/approval/approvalGateService.ts`(加 'start_ab_experiment' 到 DUAL_APPROVAL_ACTION_TYPES)
- `AGENTS.md`(加 LD-A9 节)
- `scripts/audit-redlines-admin.sh`(加 §LD-A9 grep)

**test_command** · `pnpm vitest run apps/api/src/services/admin/ab-experiment/__tests__/`

**size_hint** · medium

**risk_level** · foundation(downstream count 5 · schema + 协议锁 + LD-A9 + 跨子域)

**anti_patterns**(从 reject-examples.jsonl 注入):
- **lesson** · "_startAbExperimentInTx 接 tx · 不自起 $transaction"(同 PRD-13 US-002/003/004/005 教训) · **antipattern** · `await prisma.$transaction([abExperiment.update])` 内嵌 · **correct** · `await prisma.$transaction(async (tx) => { await _startAbExperimentInTx(tx, ...) })` · tx 接受
- **lesson** · "deterministic hash 同 PRD-13 D-090 · 不 random()" · **antipattern** · `Math.random() < threshold` · **correct** · `parseInt(md5(userId:experimentKey).slice(0,8), 16) % 100 < threshold`
- **lesson** · "AbAssignment upsert · 同 user × experiment 多次调返已分组 variant" · **antipattern** · 每次 assignUserToVariant 都 INSERT 新 row · **correct** · upsert + 优先返已有

---

#### US-002 · 显著性检验 service · Chi-square + Welch t-test + 多维分析(转化率/留存/成本)

**描述** · 作为 super_admin · 我需要 A/B 实验结果分析 service · 计算 Chi-square(分类型指标 · 转化率)+ Welch t-test(连续型指标 · 留存天数 / 成本)· 多维分析(同一实验 3 维度结果)· 输出 p-value + 显著性结论(p < 0.05 显著)+ 推荐(继续 / 停损)。

**Risk** · high(算法精度 · 计算 service 出错影响业务决策)

**Acceptance Criteria(15 条)**:

[H 显著性检验 算法 service]
- [ ] `apps/api/src/services/admin/ab-experiment/significance.service.ts` 新建 · 核心导出:
  ```typescript
  export interface SignificanceTestResult {
    metric: string;
    testType: 'chi_square' | 'welch_t_test';
    pValue: number;
    isSignificant: boolean;          // p < 0.05
    effect: number;                  // 相对变化 · variant vs control
    sampleSize: { control: number; variant: number };
    confidence: number;              // 95% CI · [lower, upper]
    recommendation: 'continue' | 'stop_winner' | 'stop_loser' | 'inconclusive';
  }

  // Chi-square test · 分类型 (转化率类)
  export function chiSquareTest(control: { converted: number; total: number }, variant: { converted: number; total: number }): SignificanceTestResult;

  // Welch t-test · 连续型 (留存天数 / 平均成本类)
  export function welchTTest(control: number[], variant: number[]): SignificanceTestResult;

  // 多维分析入口 · 同一实验跑 N 个 metric · 返 N 个结果
  export async function computeExperimentSignificance(
    experimentId: number,
    metrics: Array<{ key: string; type: 'conversion' | 'continuous'; query: (variant: AbVariant) => Promise<unknown> }>
  ): Promise<SignificanceTestResult[]>;
  ```

[E 数据源查询 · 多维指标]
- [ ] computeExperimentSignificance 内部 3 标准 metric:
  - **conversion**: 转化率(`completed_step_count >= 7 / total assignments`)· 用 stepData 表
  - **retention**: 7 日留存(`last_login_at >= assigned_at + 7d / total assignments`)· 用 users 表
  - **cost**: 平均 LLM 成本(`cost_log SUM(cost_usd) GROUP BY variant`)· 用 cost_log 表
- [ ] 支持 admin 自定义 metric(参数 `metrics` 数组传 SQL 查询函数 · service 异步执行)

[H 算法精度]
- [ ] Chi-square 实现严格按 statistical formula · degrees_of_freedom=1 · 用 simple statistics library(`npm add @stdlib/stats-base-dists-chisquare-cdf`)
- [ ] Welch t-test 实现严格按 formula · 用 `@stdlib/stats-base-dists-t-cdf` · pValue 双侧
- [ ] 单测覆盖标准 fixture(已知 control/variant 数据计算 expected pValue 对比)

[E SampleSize 校验]
- [ ] 当 control 或 variant sample size < 30 → `recommendation='inconclusive'`(样本不足)· 不计算 p-value
- [ ] 当 sample size ≥ 30 但 p-value > 0.05 → `isSignificant=false, recommendation='continue'`(继续观察)
- [ ] 当 p-value < 0.05 + variant 表现更好 → `recommendation='stop_winner'`
- [ ] 当 p-value < 0.05 + variant 表现更差(超 10% 恶化)→ `recommendation='stop_loser'`

[P pre-existing 兼容]
- [ ] **不破坏** PRD-1~13 数据查询路径 · 仅新加查询 · 复用 existing cost_log / stepData 表
- [ ] pnpm audit:redlines / audit:ld / audit:redlines-admin · 0 命中
- [ ] pnpm test · ≥ 1742 pass · 0 fail · pnpm typecheck · 0 errors

**files_to_create**:
- `apps/api/src/services/admin/ab-experiment/significance.service.ts`(~ 250 行 · Chi-square + Welch t-test + multi-metric)
- `apps/api/src/services/admin/ab-experiment/__tests__/significance.service.test.ts`(~ 280 行 · ≥ 12 it · 含标准 fixture)

**files_to_modify**:
- `apps/api/package.json`(+ `@stdlib/stats-base-dists-chisquare-cdf` + `@stdlib/stats-base-dists-t-cdf`)
- `pnpm-lock.yaml`

**test_command** · `pnpm vitest run apps/api/src/services/admin/ab-experiment/__tests__/significance.service.test.ts`

**size_hint** · medium

**risk_level** · high(算法精度 · 业务决策依赖)

**anti_patterns**:
- **lesson** · "统计计算用 @stdlib/stats · 不自己造 Chi-square / Welch t-test 公式" · **antipattern** · 手写 `function chiSquareCdf(x) {...}`(精度不可信) · **correct** · `import { cdf as chisquareCdf } from '@stdlib/stats-base-dists-chisquare-cdf'`
- **lesson** · "SampleSize < 30 必返 inconclusive" · **antipattern** · 直接算 p-value 不校验 sample size(假阳性高) · **correct** · 早返 `recommendation='inconclusive', isSignificant: false` · 不计算 p-value
- **lesson** · "多维 metric 异步并行查询" · **antipattern** · 顺序 await(慢) · **correct** · `await Promise.all(metrics.map(m => m.query(variant)))` · 并行 fetch

---

#### US-003 · 自动停损 cron + alert(B 组指标恶化 > 30% 触发回滚 100% control)

**描述** · 作为 super_admin · 我需要 BullMQ cron 自动跑 A/B 实验显著性检验 · 当 B 组(variant_a/variant_b)关键指标恶化超 30% → 自动停损(stop_loser)· 写 admin_audit_log + 钉钉告警(D-077 isMock 默认 · 真启 PRR)。

**Risk** · high(自动 prod 操作 · 失误回滚影响实验结论)

**Acceptance Criteria(13 条)**:

[H BullMQ cron · 错峰]
- [ ] `apps/api/src/jobs/admin/ab-stop-loss.job.ts` 新建 · BullMQ Queue + Worker · cron `'0 0 * * * *'` 每小时整点跑(Asia/Shanghai)· jobId='ab-stop-loss-recurring' · attempts=3 · D-096 错峰扩展(emergency 03:30 / quota 00:30 / anomaly 05:00 / cost 15分 / KPI 00:00 / violation 04:00 / compliance 06:00 / **ab-stop-loss 整点**)

[H 自动停损算法]
- [ ] `scanAbExperimentsForStopLoss(dingtalk = new DingtalkService())` 函数 · 扫所有 status='running' 实验:
  - 对每个实验跑 computeExperimentSignificance (US-002 显著性检验) · 3 标准 metric
  - 判断停损: 任一 metric `recommendation='stop_loser'` 且 effect < -30%(B 组超 30% 恶化) → 触发自动停损
  - 调 `_stopAbExperimentInTx(tx, { experimentId, adminId: 0, stopReason: 'auto_stop_loss', resultSummary: {...} })` · adminId=0 表示 system actor
  - 写 admin_audit_log eventType='ab_experiment_auto_stop_loss' · eventCategory='security_alert' · 必含 reasoning(哪个 metric / pValue / effect)
  - 钉钉通知 D-077 isMock 默认 · 真启 PRR

[H 紧急通道 super_admin override]
- [ ] super_admin 可在 admin UI 手动停止 + override 自动停损 cron(不重启 + 写 audit eventType='ab_experiment_manual_stop')
- [ ] 手动停损 vs auto_stop_loss 都走 `_stopAbExperimentInTx` 单点 · 不绕过

[H Dedupe]
- [ ] 同一实验 24h 内只触发 1 次自动停损(防 cron 重复扫 重复 stop) · adminAuditLog.findFirst({eventType:'ab_experiment_auto_stop_loss', payload.experimentId, createdAt: { gte: 24h ago }}) 校验

[E 单元 + integration 测试]
- [ ] `tests/unit/api/admin/ab-stop-loss.test.ts` 新建 · ≥ 8 it 覆盖:
  - cron schedule register · jobId dedup · attempts=3
  - 触发条件: variant_a effect=-35% + p < 0.05 → 触发停损
  - 不触发条件: effect=-20%(< 30%)→ 不触发
  - dedupe 校验
  - dingtalk isMock=true 默认
  - super_admin manual stop 同样走 _stopAbExperimentInTx
  - failed 兜底 attempts=3 写 emergency_post_review_cron_failed audit

[P pre-existing 兼容]
- [ ] **不破坏** PRD-12 violation-detection + PRD-13 emergency-post-review + quota-expiry cron(8 BullMQ cron 总 + 错峰)
- [ ] pnpm audit · 全 PASS · pnpm test · ≥ 1750 pass · 0 fail · pnpm typecheck 0 errors

**files_to_create**:
- `apps/api/src/jobs/admin/ab-stop-loss.job.ts`(~ 180 行)
- `tests/unit/api/admin/ab-stop-loss.test.ts`(~ 200 行)

**files_to_modify**:
- `apps/api/src/index.ts`(wire `scheduleAbStopLoss()` 启动时 · 跟 emergency-post-review / quota-expiry-cleanup 同 pattern)

**test_command** · `pnpm vitest run tests/unit/api/admin/ab-stop-loss.test.ts`

**size_hint** · medium

**risk_level** · high(自动 prod 操作)

**anti_patterns**:
- **lesson** · "Dedupe 同 PRD-12 violation-detection pattern · 必 24h findFirst 校验" · **antipattern** · cron 每 hour 扫无 dedupe · 同一实验多次 stop · **correct** · adminAuditLog.findFirst dedupe per experimentId per day
- **lesson** · "自动停损 stop_loser 校验 effect < -30%" · **antipattern** · 仅看 p-value < 0.05 触发 stop(可能 effect=-5% 但显著 · 不该停) · **correct** · 双条件 (pValue<0.05 AND effect<-30%)
- **lesson** · "stopReason='auto_stop_loss' vs 'manual' · payload 区分" · **antipattern** · 不区分 stopReason(audit 看不出来源) · **correct** · stopReason 字段 + audit eventType 区分(auto_stop_loss vs manual_stop)

---

#### US-004 · admin UI A/B 实验列表 + 配置 + 启动(走 dual approval)+ 一键停损

**描述** · 作为 super_admin · 我需要 admin `/admin/ab-experiments` 页 · 顶部 KPI(运行中实验数 / 平均 sample size / 自动停损率)+ 实验列表(状态 + variant 流量分配 + 当前 p-value)+ 详情 Drawer(配置 / 时间线 / 多维结果 chart)· 启动新实验走 dual approval · 一键停损按钮(super_admin only)。

**Risk** · medium(UI 复用 PRD-13 admin pattern · adminProcedure 7 闸链)

**Acceptance Criteria(14 条)**:

[H 路由 + admin-routes 协议]
- [ ] `apps/admin/src/lib/admin-routes.ts` 加 entry:
  ```typescript
  {
    path: '/admin/ab-experiments',
    label: 'A/B 实验',
    emoji: '🧪',
    prd: 14,
    sidebar: true,
    requiredRole: 'admin',  // super_admin 含启动/停损权限
    summary: 'A/B 测试实验管理 · 实验配置 + 多维结果 + 自动停损',
    group: 'p2-advanced',
  }
  ```
- [ ] `apps/admin/src/pages/abExperiments/AbExperimentsPage.tsx` 新建 · 顶部 4 KPI 卡片 + DenseTable 实验列表 + 行点开 Drawer

[H KPI 卡片 (复用 PRD-11 DenseStatCard)]
- [ ] 4 KPI: 运行中实验数 + 7 天新启动数 + 平均 sample size + 自动停损率(过去 30 天 auto_stop_loss / total stopped)
- [ ] 列表列: experimentKey / name / status (running/draft/stopped/completed) / variantCount / sampleSize / 当前 p-value (最显著 metric) / 操作(详情 / 停损 super_admin)

[H 实验列表 + 筛选]
- [ ] `<DenseTable>` 复用 PRD-11 · 筛选: status(4 enum) + createdByAdminId + dateRange · 排序: startedAt DESC 默认
- [ ] 分页 cursor-based · 20/page

[H 详情 Drawer]
- [ ] 点 row → `AbExperimentDrawer.tsx` 打开:
  - 顶部: 实验基本信息(experimentKey / name / description / status / startedAt / stoppedAt)
  - variant 配置 view(JSON 高亮 readonly)+ trafficAllocation pie chart(Recharts)
  - 实验时间线(每日 sample size 累积折线 · variant 分组)
  - **多维结果 chart**(3 metric × 3 variant 矩阵 · 表格 + bar chart · 含 pValue 显著性标签)
  - 操作: <Button> 详细分析(跑 computeExperimentSignificance refresh)+ <Button> 一键停损(super_admin only · 弹 ConfirmModal · 填 reason ≥ 10 字)

[H 启动实验流程]
- [ ] 顶部 `<Button>` 新建实验 → 弹 `CreateExperimentModal` · 6 字段表单(experimentKey / name / description / variantConfig JSON editor / trafficAllocation 滑块 sum=100 / 提交)
- [ ] 提交走 trpc `abExperiment.create.mutate` + `abExperiment.start.mutate`(后者触发 dual approval) · toast '已发起启动申请 #X · 等待 dual approval'

[H 一键停损按钮]
- [ ] super_admin only 显示(`{role === 'super_admin' && <Button>}`)· 跟 PRD-13 US-006 同 pattern
- [ ] 点击 → ConfirmModal 填 reason ≥ 20 字 → 调 `abExperiment.stop.mutate({reason})` · 直接 _stopAbExperimentInTx(stopReason='manual')· 不走 approval(super_admin 紧急操作)
- [ ] toast '实验已停止 · 已写 audit log'

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `/admin/ab-experiments`(super_admin 登录)
- [ ] 看到 4 KPI + 实验列表(若无数据 · 显示空状态)
- [ ] 点 row → Drawer 打开 · 显示 variant 配置 + 多维结果 chart + 一键停损按钮(super_admin)
- [ ] 新建实验 → 表单填值 → 提交 → toast 已发起申请

[P pre-existing 兼容]
- [ ] pnpm audit:redlines-admin · 0 命中(LD-A9 grep 单点严守)
- [ ] pnpm test · ≥ 1760 pass · 0 fail · pnpm typecheck · 0 errors

**files_to_create**:
- `apps/admin/src/pages/abExperiments/AbExperimentsPage.tsx`(~ 350 行)
- `apps/admin/src/pages/abExperiments/AbExperimentDrawer.tsx`(~ 280 行)
- `apps/admin/src/pages/abExperiments/components/CreateExperimentModal.tsx`(~ 200 行)
- `apps/admin/src/pages/abExperiments/components/MultiMetricChart.tsx`(~ 120 行 · Recharts bar chart)
- `apps/api/src/trpc/routers/admin/abExperiments.ts`(~ 200 行 · 6 procedure)
- `apps/api/src/trpc/routers/admin/__tests__/abExperiments.test.ts`(~ 250 行 · ≥ 14 it)
- `tests/unit/admin/abExperiments/AbExperimentsPage.test.tsx`(~ 150 行)
- `tests/unit/admin/abExperiments/AbExperimentDrawer.test.tsx`(~ 180 行)

**files_to_modify**:
- `apps/admin/src/lib/admin-routes.ts`(加 entry)
- `apps/admin/src/router.tsx`(加 route)
- `apps/api/src/trpc/routers/admin/index.ts`(挂载 abExperiments)
- `packages/clients/src/admin-router-types.ts`(shadow router types)

**test_command** · `pnpm vitest run tests/unit/admin/abExperiments/ apps/api/src/trpc/routers/admin/__tests__/abExperiments.test.ts`

**size_hint** · large(8 files · 标准 UI + router + tests)

**risk_level** · high(downstream 收官 + 横切 dual approval 集成)

**anti_patterns**:
- **lesson** · "trafficAllocation sum=100 客户端 + 服务端双校验"(同 PRD-13 US-009 delta>500) · **antipattern** · 客户端 max=100 但服务端不校验 · **correct** · client `if (sum !== 100) setError('总和必须 = 100')` + service `if (sum !== 100) throw BAD_REQUEST`
- **lesson** · "一键停损 super_admin only 双层守护"(同 PRD-13 US-006) · **antipattern** · `<Button>停损</Button>` 客户端不藏 + 服务端不校验(用户可绕过) · **correct** · `{role === 'super_admin' && <Button>}` + service `adminProcedure.requireSuperAdmin`
- **lesson** · "实验时间线 sampling 分页 + 懒加载" · **antipattern** · 一次 fetch 全部 AbAssignment(可能上万条) · **correct** · 按日 GROUP BY · 最多 30 天 · 30 数据点

---

#### US-005 · admin UI 多维结果分析(转化/留存/成本 chart)+ 实验时间线

**描述** · 作为 super_admin · 我需要 admin `/admin/ab-experiments/:id` 详情页 · 展示多维分析结果(转化率 chart + 留存折线 + 成本柱状图)+ 实验运行时间线 + 显著性结论 + 操作建议。复用 US-002 displayed pValue + US-004 Drawer framework 升级独立页。

**Risk** · medium(UI 复杂 · 但复用 US-004 framework)

**Acceptance Criteria(12 条)**:

[H 详情路由]
- [ ] `apps/admin/src/router.tsx` 加 `/admin/ab-experiments/:experimentKey` route(独立页 · 不仅 Drawer)
- [ ] `apps/admin/src/pages/abExperiments/ExperimentDetailPage.tsx` 新建 · 单实验完整分析视图

[H 顶部状态卡片]
- [ ] 4 KPI: 当前 sample size + 当前 phase(收集中 / 显著 / 已停损)+ 推荐操作 + 距离自动停损阈值的距离
- [ ] 标签显示: 'control' / 'variant_a' / 'variant_b' + 流量占比 + sample size

[H 3 标准 metric chart]
- [ ] 转化率 chart(Recharts BarChart · 3 variant × 1 metric · 含 confidence interval error bar)
- [ ] 7 日留存 chart(Recharts LineChart · 3 variant × 7 天)
- [ ] 平均 LLM 成本 chart(Recharts BarChart · 3 variant × 1 metric · 含 sample size 标注)
- [ ] 每个 chart 下方显著性结论文字: "Variant A 转化率 23.5% vs Control 18.2% · p-value=0.003 · 显著 · 推荐: 升 Variant A 到 100%"

[H 实验时间线 (sample size 累积折线)]
- [ ] `<ExperimentTimeline />` · Recharts AreaChart · 横轴日期 / 纵轴累积 sample size / 3 variant 颜色区分
- [ ] 悬停 tooltip · 显示该日 sample size 增量

[H 操作面板]
- [ ] `<Button>` 升 winner 到 100%(若 metric 显著 + winner 明显)· 走 dual approval
- [ ] `<Button>` 一键停损(super_admin)· 同 US-004 Drawer
- [ ] `<Button>` 导出 PDF 报告(复用 PRD-13 US-010 @react-pdf/renderer · 模板含 4 节: 实验信息 + 多维结果 + 时间线 + 签名)

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `/admin/ab-experiments/prompt-v18-canary`
- [ ] 看到 4 KPI + 3 metric chart + 时间线 + 操作按钮
- [ ] 点导出 PDF · 浏览器下载 `ab-experiment-prompt-v18-canary-2026-05.pdf`

[P pre-existing 兼容]
- [ ] **不影响** US-004 列表页 + Drawer · 仅新加独立详情页
- [ ] pnpm audit · 全 PASS · pnpm test ≥ 1770 pass · 0 fail

**files_to_create**:
- `apps/admin/src/pages/abExperiments/ExperimentDetailPage.tsx`(~ 280 行)
- `apps/admin/src/pages/abExperiments/components/ExperimentTimeline.tsx`(~ 80 行)
- `apps/admin/src/pages/abExperiments/components/ExperimentReportPdf.tsx`(~ 250 行 · 4 节 PDF 模板)
- `tests/unit/admin/abExperiments/ExperimentDetailPage.test.tsx`(~ 150 行)

**files_to_modify**:
- `apps/admin/src/router.tsx`(加 `/admin/ab-experiments/:experimentKey` route)
- `apps/api/src/trpc/routers/admin/abExperiments.ts`(加 getExperimentDetail procedure · 含 multi-metric chart data)

**test_command** · `pnpm vitest run tests/unit/admin/abExperiments/ExperimentDetailPage.test.tsx`

**size_hint** · medium

**risk_level** · medium

**anti_patterns**:
- **lesson** · "PDF 复用 PRD-13 US-010 framework · 不重写"(继承 D-098) · **antipattern** · 新写 PDF 渲染 stack · **correct** · `import { Page, Text, View } from '@react-pdf/renderer'` 复用 4 节模板
- **lesson** · "Recharts BarChart confidence interval · 用 ErrorBar component" · **antipattern** · 手画 ConfidenceInterval line · **correct** · `<ErrorBar dataKey="ciLow" />` + `<ErrorBar dataKey="ciHigh" />` 内置组件

---

### 🟦 域 ⑮ · 知识库 / 常量管理 完整版本化(5 US · US-006~010)

★ **完整版本化**(用户决策)· 67 案例 + 23 公式 + 22 元素 全部走 prompt_versions framework(US-003 1:1 fork)· admin 改后入向量库 + 灰度发布 + 回滚 + LLM Judge stub 跑分 + 历史时间线。

---

#### US-006 · constant_versions + constant_canary_config schema + service + Approval 接入 · foundation

**描述** · 作为 super_admin · 我需要常量(67 案例 / 23 公式 / 22 元素)版本化基础设施 · 复用 PRD-13 US-003 prompt_versions framework 1:1 fork。建表 + service + _publishConstantVersionInTx 单点 + LD-A10 红线 + Approval 触发(actionType='publish_constant_version')。

**Risk** · foundation(downstream = US-007/008/009/010/015 · 复用 prompt-version.service.ts 全 280 行 framework)

**Acceptance Criteria(16 条)**:

[H schema]
- [ ] `prisma/schema.prisma` 加 ConstantVersion 模型(模板 1:1 fork PromptVersion · per DATA-MODEL §13.4 模式):
  ```prisma
  model ConstantVersion {
    id                  Int          @id @default(autoincrement())
    /// 常量分类
    constantType        String       // 'knowledge_case' | 'formula' | 'element'
    constantKey         String       // 常量唯一 key · e.g. 'case_xiaohongshu_001' / 'formula_aida' / 'element_persona'
    /// 版本
    version             Int
    content             String       @db.Text   // JSON 字符串 · 含 case/formula/element 完整内容
    contentHash         String       @db.VarChar(64)
    /// 状态
    status              String       // 'draft' | 'pending_review' | 'active' | 'archived'
    /// LLM Judge (D-091 阈值 4.0)
    judgeScore          Decimal?     @db.Decimal(3, 2)
    judgeRunId          String?
    judgeReportUrl      String?
    /// 操作人
    createdByAdminId    Int
    createdAt           DateTime     @default(now())
    approvedByAdminId   Int?
    approvedAt          DateTime?

    @@unique([constantType, constantKey, version])
    @@index([constantType, constantKey, status])
    @@index([status, createdAt(sort: Desc)])
    @@map("constant_versions")
  }

  model ConstantCanaryConfig {
    id                  Int          @id @default(autoincrement())
    constantType        String
    constantKey         String
    currentVersionId    Int
    nextVersionId       Int?
    canaryPct           Int          @default(0)  // 0/1/10/50/100
    strategy            String       @default("user_id_hash")
    canaryStartedAt     DateTime?
    canaryEndsAt        DateTime?
    updatedByAdminId    Int
    updatedAt           DateTime     @updatedAt

    @@unique([constantType, constantKey])
    @@index([canaryPct])
    @@map("constant_canary_config")
  }
  ```
- [ ] migration `pnpm prisma migrate dev --name prd-14-constant-versions` 成功

[H service · ★ P-6 _publishConstantVersionInTx 单点]
- [ ] `apps/api/src/services/admin/constant-version/constant-version.service.ts` 新建 · 1:1 fork prompt-version.service.ts(US-003 280 行)· 改 5 处:
  - import `ConstantVersion` 代 `PromptVersion`
  - 5 个 export function 名加 `Constant` 前缀(`_publishConstantVersionInTx` / `publishConstantVersion` / `rollbackConstant` / `updateCanaryConfig` / `getActiveConstantVersion`)
  - 校验 status='pending_review' + judgeScore >= 4.0(D-091 共用)
  - actionType='publish_constant_version' (新加到 DUAL_APPROVAL_ACTION_TYPES)
  - 单点函数同 prompt-version.service.ts pattern · 接 tx · 不自起 transaction

[H deterministic hash · D-090 复用]
- [ ] `getActiveConstantVersion(constantType, constantKey, userId)` · 用 PRD-13 D-090 hash 算法 · `md5(${userId}:${constantType}:${constantKey}).slice(0, 8) % 100 < canaryPct` → nextVersion : currentVersion

[H Approval 接入]
- [ ] `publishConstantVersion / rollbackConstant` 内部强制走 `requestApproval({actionType:'publish_constant_version', requireDualApproval:true})` · 不绕过
- [ ] approvalGateService.ts DUAL_APPROVAL_ACTION_TYPES set 加 'publish_constant_version' + 'rollback_constant'

[H AGENTS §10.1 LD-A10 红线]
- [ ] AGENTS.md §10.1 加 LD-A10 节(模板参 LD-A6) · `constant_versions.status='active'` 仅由 `_publishConstantVersionInTx` 修改 · grep:
  ```bash
  grep -rnE "(prisma|db|tx)\.constantVersion\.update.*(status|active)" \
    apps/api/src --include='*.ts' \
    | grep -v 'constant-version.service.ts' \
    | grep -v '.test.'
  ```
- [ ] `scripts/audit-redlines-admin.sh` 加 §LD-A10 段 · grep 同上 · 10 LD-A 总检测(plan-check 2.6.17 三方一致性验证)

[P pre-existing 兼容]
- [ ] **不破坏** PRD-13 prompt-version.service.ts(只 fork · 不动原文件)
- [ ] pnpm audit · 全 PASS(含 plan-check 2.6.17 LD-A 三方一致性 PASS · LD-A10 在 audit + AGENTS + 单点函数三处一致)
- [ ] pnpm test ≥ 1782 pass · 0 fail · pnpm typecheck 0 errors

**files_to_create**:
- `apps/api/src/services/admin/constant-version/constant-version.service.ts`(~ 290 行 · 1:1 fork US-003 + 5 处改动)
- `apps/api/src/services/admin/constant-version/__tests__/constant-version.service.test.ts`(~ 250 行 · ≥ 13 it · 含 deterministic + Approval 集成)

**files_to_modify**:
- `prisma/schema.prisma`(加 ConstantVersion + ConstantCanaryConfig 2 model)
- `apps/api/src/services/admin/approval/approvalGateService.ts`(加 publish_constant_version + rollback_constant 到 dual set)
- `AGENTS.md`(加 LD-A10 节)
- `scripts/audit-redlines-admin.sh`(加 §LD-A10 grep)

**test_command** · `pnpm vitest run apps/api/src/services/admin/constant-version/__tests__/`

**size_hint** · medium

**risk_level** · foundation(downstream 5 · schema + 协议锁 + LD-A10 + fork 复用)

**anti_patterns**:
- **lesson** · "1:1 fork prompt-version.service.ts · 不重写灰度算法"(per PRD-13 §13.2 P-7 framework 复用) · **antipattern** · 重写 hash 算法 + 重写 Approval 链 · **correct** · 复制 280 行 service + 改 5 处(import / 5 func name / actionType / hash key 加 constantType / migration name)
- **lesson** · "judgeScore = 4.0 阈值跟 D-091 共用 · 不分常量类型" · **antipattern** · 给 case/formula/element 分别 4.0/3.5/4.5 阈值(管理复杂) · **correct** · 全部 4.0 阈值 · 跟 prompt 同 standard
- **lesson** · "LD-A10 grep alternatives 含 (prisma|db|tx) prefix"(per PRD-13 retro M-2 TD-058 教训) · **antipattern** · 仅 `prisma.constantVersion.update` 字面 · **correct** · `(prisma|db|tx)\.constantVersion\.update` 三 prefix

---

#### US-007 · 67 案例 + 23 公式 + 22 元素 import service + 入向量库 embed 重跑

**描述** · 作为 super_admin · 我需要把 `apps/api/src/lib/constants/` 现有 67 知识案例 + 23 公式 + 22 元素 import 到 constant_versions 表(seed)· 同时改动时自动入向量库(knowledge_cases_vec / formulas_vec / elements_vec)embed 重跑。

**Risk** · medium(初始 import + 向量库 embed 重跑 · 数据量 67+23+22=112 entries)

**Acceptance Criteria(13 条)**:

[H 初始 seed 脚本]
- [ ] `prisma/seed.ts` 加 `seedConstantsToVersions()` 函数:
  - 读 `apps/api/src/lib/constants/knowledge-cases.ts`(67 案例)· 每条 INSERT constant_versions (constantType='knowledge_case', constantKey=case.id, version=1, content=JSON.stringify(case), status='active', createdByAdminId=0 system)
  - 读 `apps/api/src/lib/constants/formulas.ts`(23 公式)· 同上 (constantType='formula')
  - 读 `apps/api/src/lib/constants/elements.ts`(22 元素)· 同上 (constantType='element')
  - 同步插 ConstantCanaryConfig (currentVersionId=刚 INSERT 的 id · canaryPct=0)
- [ ] migration script seed 完成 · 112 row in constant_versions + 112 row in constant_canary_config

[H 向量库 embed 重跑 service]
- [ ] `apps/api/src/services/admin/constant-version/constant-embed.service.ts` 新建:
  ```typescript
  // 改动 constant_versions 后触发 · 调 LLMGateway embed + 写入对应 vec 表
  export async function rebuildConstantVectorIndex(
    constantType: 'knowledge_case' | 'formula' | 'element',
    constantKey: string,
    newContent: string,
    versionId: number,
  ): Promise<{ embeddingTokens: number }>;
  // 内部:
  // 1. 算 newContent 的 embedding · 用 LLMGateway.embed (model='openai-text-embedding-3-small' 1536d)
  // 2. UPSERT 对应 vec 表(knowledge_cases_vec / formulas_vec / elements_vec)
  //    · item_key=constantKey · content=newContent · embedding=新向量 · metadata={versionId, updatedAt}
  // 3. 写 cost_log · eventType='constant_embed_rebuild' · isMock 默认 false(真要算 cost)
  ```

[H Approval 接入]
- [ ] `_publishConstantVersionInTx` 内部成功后 · 触发 BullMQ delayed job(5s)· 跑 `rebuildConstantVectorIndex` · 异步 embed 重跑 · 不阻塞 approval flow

[E LLM Judge 触发(D-091 4.0 阈值)]
- [ ] `publishConstantVersion` 内部触发 LLMGateway.evaluatePromptVersion(versionId, isMock=true)· 复用 PRD-13 US-003 LLM Judge stub · 写 judgeScore · 跟 prompt 同 standard

[E 单元测试]
- [ ] `apps/api/src/services/admin/constant-version/__tests__/constant-embed.service.test.ts` 新建 · ≥ 6 it:
  - rebuildConstantVectorIndex 触发 embed + 写入 vec 表
  - 不同 constantType 路由不同 vec 表
  - 失败 ApiError 时不写 cost_log + 写 logger.error
  - mock LLMGateway · fake embedding [0.1, 0.2, ...] 1536d

[P pre-existing 兼容]
- [ ] **不破坏** `apps/api/src/lib/constants/*.ts` 原文件(seed 时读取 · 不删除 · brownfield 保留 fallback)
- [ ] pnpm audit · 全 PASS · pnpm test ≥ 1790 pass · 0 fail · pnpm typecheck 0 errors

**files_to_create**:
- `apps/api/src/services/admin/constant-version/constant-embed.service.ts`(~ 200 行)
- `apps/api/src/services/admin/constant-version/__tests__/constant-embed.service.test.ts`(~ 180 行)
- `apps/api/src/jobs/admin/constant-embed-rebuild.job.ts`(~ 100 行 · BullMQ delayed job + jobId dedup)

**files_to_modify**:
- `prisma/seed.ts`(加 seedConstantsToVersions · 112 row import)
- `apps/api/src/services/admin/constant-version/constant-version.service.ts`(_publishConstantVersionInTx 加 BullMQ embed 触发)
- `apps/api/src/index.ts`(wire constantEmbedWorker)

**test_command** · `pnpm vitest run apps/api/src/services/admin/constant-version/__tests__/constant-embed.service.test.ts`

**size_hint** · medium

**risk_level** · medium

**anti_patterns**:
- **lesson** · "BullMQ delayed job jobId dedup · 防同一 versionId 重复 embed"(per PRD-13 US-005 TD-058 教训) · **antipattern** · `quotaExpiryQueue.add(name, payload)` 不带 jobId · **correct** · `jobId: 'constant-embed-' + versionId` 确保单一
- **lesson** · "Embed cost_log 写真实 cost · 不 isMock"(per D-077 isMock 仅 LLM Judge / dingtalk · embed cost 真要算) · **antipattern** · embed 也 isMock 默认(数据丢失) · **correct** · embed 真调 LLMGateway · 写真实 cost_log · 不 stub
- **lesson** · "seed 加 fallback · 即使 constants 表空 · 主应用 RAG fallback to lib/constants/" · **antipattern** · 删除 lib/constants/*.ts(brownfield 破坏) · **correct** · 保留 lib/constants 作为 fallback 源 · ContextAssembler 第 7 路 _fetchActiveConstant 返 null → fallback

---

#### US-008 · 灰度配置 service + LLM Judge 集成(复用 PRD-13 US-008 framework)

**描述** · 作为 super_admin · 我需要常量灰度配置 service · 5 档 stepper [0, 1, 10, 50, 100] · canaryPct=100 触发 publishConstantVersion 走 dual approval · 回滚走 dual approval · LLM Judge stub 跑分(isMock=true 默认 · D-077)。

**Risk** · medium(复用 US-006 fork framework + PRD-13 US-008 灰度 service pattern)

**Acceptance Criteria(11 条)**:

[H 灰度 service]
- [ ] `constant-version.service.ts` 加 `updateCanaryConfig(constantType, constantKey, nextVersionId, canaryPct)` · enum 校验 [0,1,10,50,100] · canaryPct=100 触发 `publishConstantVersion`(走 dual approval)
- [ ] 1-50% 直接 upsert ConstantCanaryConfig · 不走 Approval(灰度调整低风险)
- [ ] 0% 等价"暂停灰度"· upsert canaryPct=0 + nextVersionId=null

[H 回滚 service]
- [ ] `rollbackConstant(constantType, constantKey, adminId)` · 找 prev archived 版本 · 走 dual approval · 触发 _publishConstantVersionInTx(versionId=prev) · canaryPct=100

[H LLM Judge stub]
- [ ] `evaluateConstantVersion(versionId, isMock=true)` 复用 PRD-13 US-003 llm-judge.service.ts pattern · 改 prompt_versions → constant_versions · 跟 prompt 同 standard

[H ContextAssembler 第 7 路]
- [ ] ARCHITECTURE §6.5.1 ContextAssembler 加第 7 路 `_fetchActiveConstants(req)` · 并行 Promise.allSettled · 6→7 路:
  ```typescript
  const [stepData, evolutionInsight, samples, ragChunks, constants, activePromptContent, activeConstantsContent]
    = await Promise.allSettled([...原 6 路, withTimeout(this._fetchActiveConstants(req), 5000)]);
  ```
- [ ] `_fetchActiveConstants(req)` 内部按当前 9 步 stepConfig 关心的常量(行业 / 案例 / 公式 / 元素)· 并发查 constant_canary_config + 按 deterministic hash 选 currentVersion or nextVersion · 返 content map
- [ ] **brownfield fallback** · constant_versions 表空(seed 前)→ fallback to lib/constants/*.ts 旧路径

[P pre-existing 兼容]
- [ ] **不破坏** PRD-13 US-003 ContextAssembler 6 路 + brownfield fallback(只加第 7 路 · 不动前 6)
- [ ] pnpm audit · 全 PASS · pnpm test ≥ 1800 pass · 0 fail · pnpm typecheck 0 errors

**files_to_create**:
- `apps/api/src/services/admin/constant-version/llm-judge-constant.service.ts`(~ 50 行 · fork PRD-13 llm-judge.service.ts)
- `apps/api/src/services/admin/constant-version/__tests__/llm-judge-constant.test.ts`(~ 60 行)

**files_to_modify**:
- `apps/api/src/services/admin/constant-version/constant-version.service.ts`(加 updateCanaryConfig + rollbackConstant)
- `apps/api/src/services/context-assembler/ContextAssembler.ts`(加第 7 路 _fetchActiveConstants + 改 _composeSystemPrompt 签名)
- `apps/api/src/services/admin/approval/approvalGateService.ts`(加 'rollback_constant' actionType)

**test_command** · `pnpm vitest run apps/api/src/services/admin/constant-version/__tests__/`

**size_hint** · medium

**risk_level** · medium

**anti_patterns**:
- **lesson** · "5 档 enum 校验"(同 PRD-13 US-008 灰度) · **antipattern** · `<Input type='number' max=100>` · **correct** · 5-step Slider · 限制 enum [0,1,10,50,100]
- **lesson** · "ContextAssembler 第 7 路 fallback · constant_versions 表空时不 crash"(同 PRD-13 US-003 brownfield) · **antipattern** · 删除 lib/constants 强用 DB · **correct** · `_fetchActiveConstants` 返 null → ContextAssembler 用 SPECIALIST_TEMPLATES + lib/constants 旧路径
- **lesson** · "rollback super_admin only" · **antipattern** · 任 admin 都可触发 rollback · **correct** · adminProcedure.requireSuperAdmin + 客户端 disabled if !super_admin

---

#### US-009 · admin UI 67 案例 / 23 公式 / 22 元素 管理(Monaco 复用 US-007)

**描述** · 作为 super_admin · 我需要 admin `/admin/constants` 页 · 顶部 3 Tab(知识案例 / 公式 / 元素)· 每 Tab 内顶部当前 active 版本卡片 + Monaco 编辑器 + 灰度配置按钮 + 历史时间线。复用 PRD-13 US-007 Monaco framework 1:1。

**Risk** · high(大 UI · 复用 US-007 framework · 但 Tab 数从 14 变 3 + 多 constantKey 维度)

**Acceptance Criteria(15 条)**:

[H 路由]
- [ ] `admin-routes.ts` 加 `/admin/constants` entry · label='知识库管理' · emoji='📚' · prd=14 · requiredRole='admin' · group='p2-advanced'

[H 3 类常量 Tab]
- [ ] `apps/admin/src/pages/constants/ConstantsPage.tsx` 顶部横向 `<TabBar />` 3 Tab(KnowledgeCases / Formulas / Elements)+ URL state useSearchParams (反例 #2 PRD-13 守护)
- [ ] 每 Tab 内 · 顶部下拉框选 constantKey(67 / 23 / 22 选项)· 选中后展示该 constantKey 当前 active 版本

[H 当前版本卡片]
- [ ] 顶部卡片显示 active 版本 · 版本号 / 创建时间 / 创建人 / LLM Judge 评分 / 当前灰度比例
- [ ] 操作: <Button> 编辑 + <Button> 灰度配置(跳 US-010)

[H Monaco 编辑器 + Diff]
- [ ] 复用 PRD-13 US-007 `MonacoEditor.tsx` 组件(lazy import 守护)· language='json'(knowledge_case/formula/element 内容是 JSON)
- [ ] Diff 模式按钮 · 复用 `DiffEditor` 切换 · 左旧右新

[H 提交审核 + 保存草稿]
- [ ] debounce 1s 自动保存 draft to localStorage · key `constant_draft_${constantType}_${constantKey}`(反例 #3 PRD-13)
- [ ] <Button> 保存 · 写 ConstantVersion(status='draft')
- [ ] <Button> 提交审核 · status='draft' → 'pending_review' + LLM Judge stub + requestApproval(dual)

[H 历史版本时间线]
- [ ] 右侧 / 下方 `<HistoryTimeline />` · 复用 PRD-13 US-007 组件 · 每版条目 · 版本号 + 评分 + 状态 + 创建人 + 创建时间
- [ ] 操作: 回滚到此版本(super_admin · 走 dual approval)

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `/admin/constants?type=knowledge_case&key=case_xiaohongshu_001`
- [ ] 看到 3 Tab + constantKey 下拉 + 当前版本卡片 + Monaco 编辑器
- [ ] 编辑 + Cmd+S 保存草稿 · 提交审核 · toast '已提交审核 + LLM Judge 跑分中'
- [ ] 切换 Tab(Knowledge → Formula → Element) · URL 变 · 内容切换

[P pre-existing 兼容]
- [ ] **不影响**主应用 ContextAssembler 现有调用(US-008 已加 brownfield fallback)
- [ ] pnpm audit · 全 PASS · pnpm test ≥ 1812 pass · 0 fail · pnpm typecheck 0 errors

**files_to_create**:
- `apps/admin/src/pages/constants/ConstantsPage.tsx`(~ 600 行 · 3 Tab + constantKey 下拉 + Monaco + 历史)
- `apps/admin/src/pages/constants/components/ConstantKeyDropdown.tsx`(~ 80 行 · 按 type 加载选项)
- `apps/admin/src/pages/constants/components/HistoryTimeline.tsx`(~ 150 行 · 复用 PRD-13 US-007 pattern)
- `apps/api/src/trpc/routers/admin/constants.ts`(~ 200 行 · 8 procedure · CRUD + canary + judge)
- `apps/api/src/trpc/routers/admin/__tests__/constants.test.ts`(~ 280 行 · ≥ 14 it)
- `tests/unit/admin/constants/ConstantsPage.test.tsx`(~ 200 行)
- `tests/unit/admin/constants/ConstantKeyDropdown.test.tsx`(~ 80 行)

**files_to_modify**:
- `apps/admin/src/lib/admin-routes.ts`(加 entry)
- `apps/admin/src/router.tsx`(加 route)
- `apps/api/src/trpc/routers/admin/index.ts`(挂载 constants)

**test_command** · `pnpm vitest run tests/unit/admin/constants/ apps/api/src/trpc/routers/admin/__tests__/constants.test.ts`

**size_hint** · large(7 files · UI 大 · 但复用 US-007 framework · 主要工程是 3 Tab + constantKey 维度)

**risk_level** · high(downstream US-010/015 · 大 UI 复用 framework)

**anti_patterns**:
- **lesson** · "Monaco SSR dynamic import"(PRD-13 US-007 反例 #1) · **antipattern** · static import · **correct** · `lazy(() => import('@monaco-editor/react'))` + `<Suspense>`
- **lesson** · "Tab + constantKey URL state useSearchParams"(PRD-13 US-007 反例 #2 升级 · 多维度) · **antipattern** · `useState({type, key})` · **correct** · `useSearchParams()` · URL 持久化 · 支持深链
- **lesson** · "draft debounce 1s · 不 onChange→backend"(PRD-13 US-007 反例 #3) · **antipattern** · onChange 直接 saveDraft.mutate · **correct** · debounce 1s + localStorage 临时

---

#### US-010 · admin UI 灰度配置 + LLM Judge UI + 回滚(复用 PRD-13 US-008)

**描述** · 作为 super_admin · 我需要常量灰度配置 UI(5 档 stepper + 回滚按钮 + LLM Judge 评分卡片)· 复用 PRD-13 US-008 灰度 framework 1:1。

**Risk** · medium(复用 US-008 framework · 改 prompt_canary_config → constant_canary_config)

**Acceptance Criteria(11 条)**:

[H 灰度 UI]
- [ ] `apps/admin/src/pages/constants/components/CanarySlider.tsx` 新建 · 1:1 fork PRD-13 US-008 CanarySlider · 改:
  - import constantApi 代 promptApi
  - actionType 'publish_constant_version' / 'rollback_constant' 代 'publish_prompt' / 'rollback_prompt'
  - URL state constantType + constantKey 代 specialistId + mode

[H 100% 走 dual approval]
- [ ] 选 100% → ConfirmModal '确认完全发布?(将影响所有用户)' + 走 dual approval · 不直接 publish
- [ ] 1-50% 直接调 trpc constant.updateCanary.mutate · 灰度调整低风险不走 approval
- [ ] 0% 客户端二次 confirm

[H Canary status 卡片]
- [ ] 复用 PRD-13 US-008 status 卡片 · 显示 currentVersion v17 + nextVersion v18 + 灰度 10% + 操作(回滚 / 升 100% / 暂停)

[H 一键回滚 (super_admin)]
- [ ] super_admin only 显示 · ConfirmModal 填 reason ≥ 20 字 · 走 dual approval · toast '已发起回滚申请 #X'

[H LLM Judge UI]
- [ ] `apps/admin/src/pages/constants/components/LlmJudgeCard.tsx` 复用 PRD-13 US-008 LlmJudgeCard · 显示 0.00-5.00 评分 + 跑分时间 + isMock badge + 重跑评分按钮

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `/admin/constants?type=knowledge_case&key=case_xiaohongshu_001&tab=canary`
- [ ] 看到 CanarySlider + Canary status + 回滚按钮 + LLM Judge 评分
- [ ] 调滑块 10% → 50% · trpc 触发 · canaryPct 更新
- [ ] 点回滚 · 输 reason · 提交 · toast 出 + approval_requests 创建

[P pre-existing 兼容]
- [ ] pnpm audit · 全 PASS(LD-A10 grep 严守)
- [ ] pnpm test ≥ 1822 pass · 0 fail · pnpm typecheck 0 errors

**files_to_create**:
- `apps/admin/src/pages/constants/components/CanarySlider.tsx`(~ 400 行 · 1:1 fork PRD-13 US-008)
- `apps/admin/src/pages/constants/components/LlmJudgeCard.tsx`(~ 150 行 · fork PRD-13 US-008)
- `tests/unit/admin/constants/CanarySlider.test.tsx`(~ 100 行)
- `tests/unit/admin/constants/LlmJudgeCard.test.tsx`(~ 60 行)

**files_to_modify**:
- `apps/admin/src/pages/constants/ConstantsPage.tsx`(集成 CanarySlider + LlmJudgeCard)

**test_command** · `pnpm vitest run tests/unit/admin/constants/CanarySlider.test.tsx tests/unit/admin/constants/LlmJudgeCard.test.tsx`

**size_hint** · medium

**risk_level** · medium

**anti_patterns**:
- **lesson** · "5 档 enum 守护 · 不允许任意数字"(PRD-13 US-008 反例 #1) · **antipattern** · `<Input type='number'>` · **correct** · 5-step Slider · enum [0,1,10,50,100]
- **lesson** · "回滚必走 Approval"(PRD-13 US-008 反例 #2) · **antipattern** · 点回滚直接 _publishConstantVersionInTx · **correct** · 先 requestApproval(dual=true) · 等批准 · callback 单点函数

---

### 🟦 域 ⑯ · 系统配置中心 完整版(4 US · US-011~014 · 5+ 紧急开关)

★ **完整版**(用户决策)· 3 关键紧急开关(停 trending / 停 EvolutionAgent / 启用降级 prompt)+ 套餐/行业灰度 + 用户白名单 + 任意 future feature_flag。轻 Approval(1 人即可触发 + 24h 后置复核)。

---

#### US-011 · feature_flags + system_config schema + service + _toggleFeatureFlagInTx 单点 + LD-A11 · foundation

**描述** · 作为 super_admin · 我需要系统配置中心基础设施 · feature_flags + system_config 表 + 单点函数 _toggleFeatureFlagInTx + _updateSystemConfigInTx + LD-A11 红线 + 轻 Approval(1 人 + 24h 后置复核 · 复用 PRD-13 US-002 emergency 通道)。

**Risk** · foundation(downstream = US-012/013/014/015 · 跨横切机制)

**Acceptance Criteria(14 条)**:

[H schema]
- [ ] `prisma/schema.prisma` 确认 §13.7 占位 FeatureFlag + SystemConfig 已写(line 3467-3493)· verify 字段齐 · 加 index 若缺
- [ ] migration `pnpm prisma migrate dev --name prd-14-feature-flags` 成功
- [ ] seed 3 关键紧急开关 system_config(`stop_trending_scraper` / `stop_evolution_agent` / `enable_fallback_prompt`)· defaultValue=false · isEmergency=true

[H service · ★ P-6 单点函数]
- [ ] `apps/api/src/services/admin/feature-flag/feature-flag.service.ts` 新建:
  ```typescript
  // ★ P-6 单点函数 1
  export async function _toggleFeatureFlagInTx(
    tx: Prisma.TransactionClient,
    params: { flagKey: string; enabled: boolean; rolloutConfig?: Prisma.InputJsonValue; adminId: number; approvalRequestId?: number }
  ): Promise<FeatureFlag>;

  // ★ P-6 单点函数 2
  export async function _updateSystemConfigInTx(
    tx: Prisma.TransactionClient,
    params: { configKey: string; configValue: Prisma.InputJsonValue; adminId: number; approvalRequestId: number }
  ): Promise<SystemConfig>;

  // 公开 API
  export async function toggleFeatureFlag(flagKey: string, enabled: boolean, adminId: number): Promise<{ approvalRequestId: number }>;
  // ↑ 走 dual approval (actionType='toggle_feature_flag')

  export async function emergencyToggleSystemConfig(configKey: string, configValue: unknown, superAdminId: number, incidentId: string): Promise<SystemConfig>;
  // ↑ 紧急通道 · super_admin 1 人 · 复用 PRD-13 US-002 emergencyApprove pattern · 自动 postReviewRequired=true · 24h 后置复核

  export async function getFeatureFlagValue(flagKey: string, userId?: number, plan?: string): Promise<unknown>;
  // ↑ 按 rolloutConfig 决定值: boolean / percentage (md5 hash 分流) / targeted (target_users / target_plans)
  ```

[H Approval 接入]
- [ ] approvalGateService.ts DUAL_APPROVAL_ACTION_TYPES 加 'toggle_feature_flag' + 'update_system_config'
- [ ] `emergencyToggleSystemConfig` 内部强制走 `emergencyApprove(...)` · super_admin + incidentId 必填 · 自动 postReviewRequired=true

[H AGENTS §10.1 LD-A11 红线]
- [ ] AGENTS.md §10.1 加 LD-A11 节(模板参 LD-A8) · `feature_flags.enabled / rolloutConfig` + `system_config.configValue` 仅由 `_toggleFeatureFlagInTx` / `_updateSystemConfigInTx` 修改 · grep:
  ```bash
  grep -rnE "(prisma|db|tx)\.(featureFlag|systemConfig)\.(update|upsert|create)" \
    apps/api/src --include='*.ts' \
    | grep -v 'feature-flag.service.ts' \
    | grep -v '.test.'
  ```
- [ ] `scripts/audit-redlines-admin.sh` 加 §LD-A11 段 · 11 LD-A 总检测

[P pre-existing 兼容]
- [ ] **不破坏** PRD-13 8 LD-A audit + approval flow
- [ ] pnpm audit · 全 PASS(plan-check 2.6.17 LD-A 三方一致性 · 11 LD-A 全过)
- [ ] pnpm test ≥ 1830 pass · 0 fail · pnpm typecheck 0 errors

**files_to_create**:
- `apps/api/src/services/admin/feature-flag/feature-flag.service.ts`(~ 280 行 · 2 单点 + 3 public + getFeatureFlagValue)
- `apps/api/src/services/admin/feature-flag/__tests__/feature-flag.service.test.ts`(~ 280 行 · ≥ 14 it)

**files_to_modify**:
- `prisma/schema.prisma`(verify §13.7 · 加 index 若缺)
- `prisma/seed.ts`(加 3 关键紧急开关 seed)
- `apps/api/src/services/admin/approval/approvalGateService.ts`(加 'toggle_feature_flag' + 'update_system_config' 到 dual set)
- `AGENTS.md`(加 LD-A11 节)
- `scripts/audit-redlines-admin.sh`(加 §LD-A11 grep)

**test_command** · `pnpm vitest run apps/api/src/services/admin/feature-flag/__tests__/`

**size_hint** · medium

**risk_level** · foundation(downstream 4 · schema + 单点 + LD-A11)

**anti_patterns**:
- **lesson** · "2 单点函数(_toggle + _update) 分开 · 不合并"(防字段语义混淆) · **antipattern** · `_changeConfigInTx` 一统(flag 跟 system_config 字段不同) · **correct** · 分 _toggleFeatureFlagInTx 改 feature_flags + _updateSystemConfigInTx 改 system_config
- **lesson** · "紧急通道复用 PRD-13 US-002 emergencyApprove · 不重写"(per P-7) · **antipattern** · `emergencyToggleSystemConfig` 重写 emergency 逻辑 · **correct** · 直接调 `emergencyApprove(requestId, superAdminId, incidentId)` · 复用 US-002 pattern
- **lesson** · "getFeatureFlagValue · 3 类型路由"(per ADMIN §3.7 域 ⑯ 3 flagType) · **antipattern** · 只支持 boolean (其他类型 throw) · **correct** · `flagType === 'percentage' → md5 hash 分流` · `flagType === 'targeted' → 检查 userId in target_users OR plan in target_plans`

---

#### US-012 · 3 关键紧急开关 service · 停 trending / 停 EvolutionAgent / 启用降级 prompt

**描述** · 作为 super_admin · 我需要 3 关键紧急开关 service · 1 click 即可触发(轻 Approval 单人 super_admin)· 自动 postReviewRequired=true · 影响主应用关键 worker / agent / RAG · 写紧急通道审计。

**Risk** · high(prod 救命操作 · 失误影响所有用户)

**Acceptance Criteria(13 条)**:

[H 3 紧急开关定义]
- [ ] system_config 3 关键开关已 seed(US-011):
  - `stop_trending_scraper` (boolean · default false) → 停 P5/P9.2 TrendingScraper Worker
  - `stop_evolution_agent` (boolean · default false) → 停 P8/P9.3 EvolutionAgent execute
  - `enable_fallback_prompt` (boolean · default false) → ContextAssembler 强制使用 SPECIALIST_TEMPLATES + 跳过 prompt_versions / constant_versions

[H Worker / Agent / ContextAssembler 集成]
- [ ] `apps/api/src/workers/trending-scraper/index.ts` brownfield · 启动前调 `getFeatureFlagValue('stop_trending_scraper')` · 若 true → logger.warn + 直接 return(不跑抓取)
- [ ] `apps/api/src/agents/evolution/EvolutionAgent.ts` brownfield · execute() 起始检查 `getSystemConfigValue('stop_evolution_agent')` · 若 true → return { isFallback: true, modelUsed: 'emergency-disabled' }(不真跑 LLM)
- [ ] `apps/api/src/services/context-assembler/ContextAssembler.ts` brownfield · `_fetchActivePrompt` + `_fetchActiveConstants` 前检查 `getSystemConfigValue('enable_fallback_prompt')` · 若 true → 跳过 DB 查询 · 直接 fallback to templates/*.ts + lib/constants/*.ts

[H 紧急触发流程]
- [ ] super_admin 在 admin UI 一键触发 · 调 trpc `featureFlag.emergencyToggle.mutate({configKey, configValue: true, incidentId})`
- [ ] service 内部:
  - 写 `_updateSystemConfigInTx({configKey, configValue: true, adminId, approvalRequestId})` 单点(approvalRequestId 来自下一步)
  - 同时走 `emergencyApprove(requestId, superAdminId, incidentId)` · 自动 postReviewRequired=true
  - 写 admin_audit_log eventType='emergency_switch_triggered' · eventCategory='security_alert' · 必含 configKey + incidentId
  - 钉钉告警(D-077 isMock=true 默认)

[H 24h 后置复核 cron]
- [ ] 复用 PRD-13 US-002 emergency-post-review.job · 已 cover 紧急开关 24h overdue 检测 · 不重新写 cron · 仅扩 audit eventType 兼容

[E 单元测试]
- [ ] `tests/unit/api/admin/emergency-switch.test.ts` 新建 · ≥ 8 it:
  - 3 关键开关 toggle 后 worker/agent/contextAssembler 正确 bypass
  - emergencyApprove 触发 postReviewRequired=true
  - getFeatureFlagValue cache 5s TTL(防 hot path 频繁查 DB)
  - boolean / percentage / targeted 3 flagType 路由
  - 钉钉告警 isMock=true 默认

[P pre-existing 兼容]
- [ ] **不破坏** PRD-5 TrendingScraper Worker / PRD-9 EvolutionAgent / PRD-13 ContextAssembler 主流程(仅加 brownfield 前置 bypass · 不替代)
- [ ] pnpm audit · 全 PASS · pnpm test ≥ 1838 pass · 0 fail · pnpm typecheck 0 errors

**files_to_create**:
- `tests/unit/api/admin/emergency-switch.test.ts`(~ 240 行)

**files_to_modify**:
- `apps/api/src/workers/trending-scraper/index.ts`(brownfield · 加 stop_trending_scraper bypass)
- `apps/api/src/agents/evolution/EvolutionAgent.ts`(brownfield · 加 stop_evolution_agent bypass)
- `apps/api/src/services/context-assembler/ContextAssembler.ts`(brownfield · 加 enable_fallback_prompt bypass)
- `apps/api/src/services/admin/feature-flag/feature-flag.service.ts`(加 getSystemConfigValue + 5s TTL cache)
- `apps/api/src/trpc/routers/admin/featureFlags.ts`(暂创 · US-014 完整加)

**test_command** · `pnpm vitest run tests/unit/api/admin/emergency-switch.test.ts`

**size_hint** · medium

**risk_level** · high(prod 救命操作 + brownfield 3 处)

**anti_patterns**:
- **lesson** · "brownfield 加前置 bypass · 不替代主流程"(同 PRD-13 US-005 rate-limit) · **antipattern** · 删除原 worker / agent / contextAssembler 主逻辑 · **correct** · 起始 1 行 `if (await getSystemConfigValue('stop_X')) return;` · brownfield 不破坏
- **lesson** · "getFeatureFlagValue 5s TTL cache · 防 hot path 频繁查 DB" · **antipattern** · 每次调用直查 DB(大并发崩溃) · **correct** · Map + setInterval clear · 5s TTL · 短缓存
- **lesson** · "紧急触发必带 incidentId · super_admin only"(同 PRD-13 US-002) · **antipattern** · 客户端 toggle 不传 incidentId · **correct** · client 必填 input + service `throw if !incidentId.trim()`

---

#### US-013 · 套餐/行业灰度 + 用户白名单 + 任意 future feature_flag

**描述** · 作为 super_admin · 我需要扩展 feature_flags 支持 3 复杂 flagType · percentage(灰度) / targeted(套餐/行业/用户名单)/ 任意 future flag。每个 flag 修改走 dual approval。

**Risk** · medium(复用 US-011 单点函数 + 3 路由扩展)

**Acceptance Criteria(11 条)**:

[H flagType=percentage 灰度路由]
- [ ] `getFeatureFlagValue(flagKey, userId)` 当 flagType='percentage' · 用 PRD-13 D-090 hash 算法 · `md5(${userId}:${flagKey}).slice(0,8) % 100 < rolloutConfig.percentage` → enabled : !enabled
- [ ] deterministic · 同 user × flag 多次调结果一致

[H flagType=targeted 路由]
- [ ] `getFeatureFlagValue(flagKey, userId, plan)` 当 flagType='targeted':
  - 检查 `userId in rolloutConfig.target_users` → enabled
  - OR `plan in rolloutConfig.target_plans` → enabled
  - 否则 disabled

[H rolloutConfig schema 校验]
- [ ] zod schema:
  ```typescript
  const rolloutConfigSchema = z.discriminatedUnion('flagType', [
    z.object({ flagType: z.literal('boolean') }),
    z.object({ flagType: z.literal('percentage'), percentage: z.number().int().min(0).max(100) }),
    z.object({ flagType: z.literal('targeted'), target_users: z.array(z.number().int()).optional(), target_plans: z.array(z.enum(['free','pro','enterprise'])).optional() }),
  ]);
  ```

[H 任意 future flag]
- [ ] `toggleFeatureFlag(flagKey, enabled, rolloutConfig, adminId)` 支持任意 flagKey · 即使 seed 时不存在 · upsert 创建 + 走 dual approval

[E 单元测试]
- [ ] `tests/unit/api/admin/feature-flag-routing.test.ts` 新建 · ≥ 8 it:
  - percentage flagType 0% → 全 false / 50% → ~50% true / 100% → 全 true
  - targeted user_id list · 匹配返 true · 不匹配返 false
  - targeted plan list · 'free' user 匹配返 true
  - boolean flagType 简单 toggle
  - 未知 flagKey upsert + dual approval

[P pre-existing 兼容]
- [ ] **不破坏** US-012 3 关键紧急开关行为(都是 boolean flagType)
- [ ] pnpm audit · 全 PASS · pnpm test ≥ 1846 pass · 0 fail · pnpm typecheck 0 errors

**files_to_create**:
- `tests/unit/api/admin/feature-flag-routing.test.ts`(~ 200 行)
- `apps/api/src/services/admin/feature-flag/__tests__/feature-flag-rollout.test.ts`(~ 180 行 · zod 校验 + hash 分流)

**files_to_modify**:
- `apps/api/src/services/admin/feature-flag/feature-flag.service.ts`(加 percentage + targeted 路由)

**test_command** · `pnpm vitest run tests/unit/api/admin/feature-flag-routing.test.ts apps/api/src/services/admin/feature-flag/__tests__/feature-flag-rollout.test.ts`

**size_hint** · medium

**risk_level** · medium

**anti_patterns**:
- **lesson** · "deterministic hash 同 PRD-13 D-090 + US-001 + US-006 复用" · **antipattern** · `Math.random() < percentage/100` · **correct** · `parseInt(md5(userId:flagKey).slice(0,8), 16) % 100 < percentage`
- **lesson** · "rolloutConfig zod discriminated union 严格校验"(防服务端接收任意 JSON) · **antipattern** · accept `Record<string, unknown>` 任意 JSON · **correct** · z.discriminatedUnion('flagType', [...]) 按 flagType 严格分支

---

#### US-014 · admin UI 配置中心 + 紧急开关 1 click + 后置复核 Tab

**描述** · 作为 super_admin · 我需要 admin `/admin/feature-flags` 页 · 顶部 KPI(总 flag 数 / 启用数 / 7 天变更次数 / 紧急开关激活数)+ 3 Tab(紧急开关 / 通用 flags / 系统配置)· 每 Tab 内 DenseTable 列表 + 1 click 触发紧急开关 + 后置复核 Tab(super_admin 24h 内复核 emergency 变更)。

**Risk** · high(横切 prod 救命 UI · 大 UI 复用 US-011 + PRD-13 US-011 Approval Gates UI)

**Acceptance Criteria(15 条)**:

[H 路由]
- [ ] `admin-routes.ts` 加 `/admin/feature-flags` entry · label='配置中心' · emoji='⚙️' · prd=14 · requiredRole='admin'(super_admin 含紧急触发权限)

[H 3 Tab]
- [ ] `apps/admin/src/pages/featureFlags/FeatureFlagsPage.tsx` 顶部 3 Tab(紧急开关 / 通用 flags / 系统配置)+ URL state useSearchParams

[H 紧急开关 Tab]
- [ ] DenseTable 列出 isEmergency=true 的 system_config 条目(默认 3 关键)
- [ ] 列: configKey · 当前 configValue(JSON) · 上次变更人 / 时间 · 操作 (1 click 触发)
- [ ] 1 click 触发: super_admin 弹 `EmergencyTriggerModal` · 必填 incidentId + 决策理由 · 提交走 `featureFlag.emergencyToggle.mutate` · toast '已紧急触发 + 24h 后置复核已激活'
- [ ] readonly_admin/admin 看可见但操作 disabled + tooltip '需 super_admin 权限'

[H 通用 flags Tab]
- [ ] DenseTable 列出 feature_flags · 列: flagKey · flagType (boolean/percentage/targeted badge) · enabled · rolloutConfig 摘要 · 上次变更人 / 时间 · 操作 (编辑)
- [ ] 编辑弹 `EditFlagModal` · zod 校验 rolloutConfig · 提交走 `featureFlag.toggle.mutate` · 走 dual approval · toast '已发起 Approval #X'

[H 系统配置 Tab]
- [ ] DenseTable 列出 system_config(非 isEmergency 的)· 列: configKey / configValue (JSON) / 操作 (编辑)
- [ ] 编辑弹 `EditConfigModal` · JSON editor (Monaco 复用 PRD-13 US-007 lazy import) · 提交走 dual approval

[H 后置复核 Tab]
- [ ] 第 4 Tab '后置复核' (super_admin only)· 列出 postReviewRequired=true && postReviewedAt=null && decidedAt > 6h ago && actionType IN ('emergency_switch_triggered')
- [ ] 复用 PRD-13 US-011 Approval Gates UI PostReviewTab + 路由 actionType 'emergency_switch_triggered'

[H KPI 卡片]
- [ ] 顶部 4 KPI: 总 flag 数 / 启用 flag 数 / 7 天变更次数 / 紧急开关激活数(stop_trending / stop_evolution / enable_fallback)

[B 浏览器验收]
- [ ] 使用 agent-browser 打开 `/admin/feature-flags`(super_admin 登录)
- [ ] 4 KPI + 3 Tab + 4 Tab(后置复核 super_admin only)
- [ ] 切换到紧急开关 Tab · 点 stop_trending 1 click · 弹 modal · 填 incidentId='INCIDENT-2026-05-15-001' + reason · 提交 · toast '已紧急触发'
- [ ] 切换到后置复核 Tab · 看到刚才的 emergency 申请 · 6h 后可复核

[P pre-existing 兼容]
- [ ] **不影响** PRD-13 US-011 Approval Gates UI(只复用 PostReviewTab + actionType 路由扩展)
- [ ] pnpm audit · 全 PASS(LD-A11 grep + 7 闸链 adminProcedure)
- [ ] pnpm test ≥ 1860 pass · 0 fail · pnpm typecheck 0 errors

**files_to_create**:
- `apps/admin/src/pages/featureFlags/FeatureFlagsPage.tsx`(~ 450 行)
- `apps/admin/src/pages/featureFlags/components/EmergencyTriggerModal.tsx`(~ 180 行 · incidentId 必填)
- `apps/admin/src/pages/featureFlags/components/EditFlagModal.tsx`(~ 220 行 · zod 校验)
- `apps/admin/src/pages/featureFlags/components/EditConfigModal.tsx`(~ 180 行 · Monaco JSON editor)
- `apps/api/src/trpc/routers/admin/featureFlags.ts`(~ 250 行 · 8 procedure)
- `apps/api/src/trpc/routers/admin/__tests__/featureFlags.test.ts`(~ 280 行 · ≥ 15 it)
- `tests/unit/admin/featureFlags/FeatureFlagsPage.test.tsx`(~ 180 行)
- `tests/unit/admin/featureFlags/EmergencyTriggerModal.test.tsx`(~ 100 行)

**files_to_modify**:
- `apps/admin/src/lib/admin-routes.ts`(加 entry)
- `apps/admin/src/router.tsx`(加 route)
- `apps/api/src/trpc/routers/admin/index.ts`(挂载 featureFlags)

**test_command** · `pnpm vitest run tests/unit/admin/featureFlags/ apps/api/src/trpc/routers/admin/__tests__/featureFlags.test.ts`

**size_hint** · large(8 files · 大 UI · 复用 PRD-13 US-007/US-011 framework)

**risk_level** · high(prod 救命 + Approval Gates 集成 + brownfield 3 worker/agent/assembler)

**anti_patterns**:
- **lesson** · "紧急开关 super_admin only 双层守护"(同 PRD-13 US-006/US-011 反例 #1) · **antipattern** · admin 也能触发紧急 · **correct** · `{role === 'super_admin' && <Button>}` + service `adminProcedure.requireSuperAdmin`
- **lesson** · "incidentId 必填客户端 + 服务端双校验"(同 PRD-13 US-011 反例 #2) · **antipattern** · 客户端校验过 · 服务端不查(用户可绕过) · **correct** · client `if (!incidentId.trim()) setError` + service `if (!incidentId) throw BAD_REQUEST`
- **lesson** · "后置复核 reviewerAdminId !== firstApprover"(同 PRD-13 US-002 FORBIDDEN_SAME_APPROVER) · **antipattern** · 触发紧急的 super_admin 自己复核(自己复核自己 · 等于无复核) · **correct** · service `if (reviewerAdminId === firstApproverAdminId) throw FORBIDDEN_SAME_APPROVER` 双层守护

---

### 🟦 收官(1 US · US-015)

#### US-015 · verify-prd-14.sh + 4 E2E flows(A/B 启动停损 / 知识库版本化 / 紧急开关触发 / 后置复核)

**描述** · 作为 PRD 验证者 · 我需要 `scripts/verify-prd-14.sh` 可重复执行验收 + 4 E2E 完整流程走通 · 跨 14 US 集成 · 4 _xxxInTx 单点函数 + 11 LD-A 红线全过 + 17 procedure 调用通。

**Risk** · high(收官 · 跨 14 US + 横切 emergency + 3 brownfield)

**Acceptance Criteria(15 条)**:

[H verify-prd-14.sh 9 sections]
- [ ] `scripts/verify-prd-14.sh` 新建 · ≥ 9 section:
  - §1 静态 audit-redlines-admin grep 11 LD-A (8 PRD-13 + 3 PRD-14 新加 A9/A10/A11) 全过
  - §2 静态 4 张新表 schema (ab_experiments + ab_assignments + constant_versions + feature_flags · system_config seed 3 关键开关)
  - §3 静态 7 _xxxInTx 单点函数存在 (_approveRequest + _publishPromptVersion + _forceRebuildEvolution + _adjustQuota + _startAbExperiment + _publishConstantVersion + _toggleFeatureFlag/_updateSystemConfig)
  - §4 静态 plan-check 2.6.17 LD-A 三方一致性 PASS (audit script + AGENTS 11 LD-A 编号集相等)
  - §5 静态 ContextAssembler 7 路并行 fetch + brownfield fallback (PRD-13 US-003 6 路 + PRD-14 US-008 第 7 路)
  - §6 静态 BullMQ 9 cron worker registered (PRD-13 7 + PRD-14 2 新: ab-stop-loss + constant-embed-rebuild)
  - §7 静态 17 admin tRPC procedure (PRD-13 50+ + PRD-14 abExperiments/constants/featureFlags 17 新)
  - §8 静态 4 admin pages (ab-experiments/constants/feature-flags + 1 详情 ExperimentDetailPage)
  - §9 E2E 4 flows fixture stub(实际不真启 dev server · 用 vitest + supertest + 真 Prisma 跑)

[H E2E 1 · A/B 实验启动 + 自动停损完整 flow]
- [ ] `tests/e2e/admin/prd14-ab-experiment-e2e.test.ts` 新建 ≥ 10 step:
  - Setup: seed super_admin × 2 + admin × 1 + control vs variant 用户 100 + 50 各
  - Step 1: admin createAbExperiment · variantConfig + trafficAllocation
  - Step 2: admin startAbExperiment · 走 dual approval · 触发 approvalRequest pending
  - Step 3: super_admin#1 approveRequest · status='first_approved'(dual)
  - Step 4: super_admin#1 同人尝试再批 → throw FORBIDDEN_SAME_APPROVER · expect rejects
  - Step 5: super_admin#2 approveRequest · status='approved' + callback _startAbExperimentInTx · ab_experiments.status='running'
  - Step 6: 模拟 100 control + 50 variant_a 用户分配 + 跑 80% 完成 (control 转化率 80% / variant_a 20% · effect -75%)
  - Step 7: 触发 ab-stop-loss cron · 跑 scanAbExperimentsForStopLoss
  - Step 8: assert auto_stop_loss 触发 · _stopAbExperimentInTx · ab_experiments.status='stopped' + stoppedAt + resultSummary
  - Step 9: assert admin_audit_log eventType='ab_experiment_auto_stop_loss' · payload 含 reasoning
  - Step 10: assert 第二次跑 cron 不重复触发(dedupe 校验)

[H E2E 2 · 知识库 publishConstantVersion 完整 dual approval flow]
- [ ] `tests/e2e/admin/prd14-constant-version-e2e.test.ts` 新建 ≥ 6 step:
  - Setup: seed constant_versions (knowledge_case 1 case v1 active + v2 draft + judgeScore=4.5)
  - Step 1: admin submitForReview(v2) · status='pending_review' + requestApproval(dual)
  - Step 2: super_admin#1 + #2 双批 · callback _publishConstantVersionInTx
  - Step 3: assert v1 status='archived' + v2 status='active' + canaryPct=0
  - Step 4: 触发 BullMQ delayed embed job (5s) · rebuildConstantVectorIndex
  - Step 5: assert knowledge_cases_vec 表 updated · item_key=case_xxx · embedding 新值 · metadata.versionId=v2
  - Step 6: assert cost_log 写 embed cost · ContextAssembler getActiveConstantVersion(userId) 返 v2 content

[H E2E 3 · 紧急开关触发 + 24h 后置复核 flow]
- [ ] `tests/e2e/admin/prd14-emergency-switch-e2e.test.ts` 新建 ≥ 7 step:
  - Setup: seed super_admin × 2 + system_config stop_trending_scraper (default false)
  - Step 1: super_admin#1 emergencyToggleSystemConfig('stop_trending_scraper', true, incidentId='INC-001')
  - Step 2: assert system_config.configValue=true + emergencyApprove 走通 · postReviewRequired=true
  - Step 3: assert TrendingScraper Worker brownfield bypass · 跑 1 个 worker iter · skip(getSystemConfigValue('stop_trending_scraper')=true)
  - Step 4: 12h 后 cron 跑(fake-timers)· < 24h · 不告警
  - Step 5: 24h+ 后 cron 跑 · 告警 + admin_audit_log eventType='post_review_overdue'
  - Step 6: super_admin#2 postReviewApprove · result='confirmed' · 校验 reviewerAdminId !== firstApprover
  - Step 7: assert system_config 仍 true + audit log 含完整 incident chain

[H E2E 4 · 完整跨域横切 (constant + emergency + Approval)]
- [ ] `tests/e2e/admin/prd14-cross-domain-e2e.test.ts` 新建 ≥ 6 step:
  - Setup: seed all PRD-13/14 admin tables
  - Step 1: super_admin emergencyToggle('enable_fallback_prompt', true, 'INC-002') · 主应用 ContextAssembler 强制 fallback
  - Step 2: 同时 admin publishConstantVersion(case_xxx v3) · 走 dual approval
  - Step 3: 在 fallback 模式下 · ContextAssembler 不查 constant_versions · 直接 lib/constants
  - Step 4: super_admin emergencyToggle('enable_fallback_prompt', false, 'INC-002') · 恢复正常
  - Step 5: ContextAssembler 重新查 constant_versions · 返 v3 (假设已批准)
  - Step 6: assert 完整跨域 admin_audit_log 链 · 3 emergency_switch_triggered + 2 dual_approval_completed + 1 post_review_overdue 等

[H 5 audit + zero regression]
- [ ] pnpm audit:redlines / audit:ld / audit:redlines-admin / audit:admin-rls-tables / audit:admin-rls 5/5 ALL PASS · 0 命中
- [ ] pnpm test ≥ 1875 pass(基线 1727 + US-001~014 累计 + 收官 E2E ≥ 30 新 tests)· 0 fail
- [ ] pnpm typecheck 0 errors all 6 workspace packages
- [ ] bash scripts/verify-prd-14.sh · 0 failures · 9 sections all PASS

**files_to_create**:
- `scripts/verify-prd-14.sh`(~ 450 行 · 9 section)
- `tests/e2e/admin/prd14-ab-experiment-e2e.test.ts`(~ 280 行)
- `tests/e2e/admin/prd14-constant-version-e2e.test.ts`(~ 220 行)
- `tests/e2e/admin/prd14-emergency-switch-e2e.test.ts`(~ 230 行)
- `tests/e2e/admin/prd14-cross-domain-e2e.test.ts`(~ 200 行)

**test_command** · `bash scripts/verify-prd-14.sh && pnpm vitest run tests/e2e/admin/prd14-*.test.ts`

**size_hint** · large(5 files · 但收官 · 跨 14 US E2E)

**risk_level** · high(★ 收官 · 跨 14 US · 横切 emergency + brownfield 3 worker)

**anti_patterns**:
- **lesson** · "E2E 真 Prisma + 真 DB (D-080 模式)"(同 PRD-13 US-012) · **antipattern** · mock prisma 全部 · **correct** · 用 quanan_test DB · beforeEach truncate
- **lesson** · "fake-timers 模拟 24h"(同 PRD-13 US-012) · **antipattern** · `await new Promise(r => setTimeout(r, 24*60*60*1000))` 真等 · **correct** · `vi.useFakeTimers() + vi.advanceTimersByTime(24*60*60*1000)`
- **lesson** · "FORBIDDEN_SAME_APPROVER 跨 4 调用点全测"(同 PRD-13 US-002) · **antipattern** · 仅测 dual approval 第二批 · 不测 post-review 同 approver · **correct** · 测 approveRequest 第二批 + postReviewApprove + emergencyApprove 全 3 处

---

## §2 · Acceptance Criteria 4 类总览

继承 PRD-12/13 严格 4 类(H/E/B/P)· 每 US ≥ 11 AC · seed 标准。

| 类别 | 全称 | 含义 |
|:-:|---|---|
| **H** | Hard 闭环验收 | 主路径必跑通 · schema/service/UI/E2E 完整闭环 |
| **E** | Extended 扩展验收 | 单点函数 P-6 · brownfield 兼容 · 紧急/特殊路径 |
| **B** | Boundary 边界 + UI | 边界情况 + 视觉 + 浏览器 agent-browser 验证 |
| **P** | Pre-existing 兼容 | typecheck / test / audit 不破坏 · pnpm pass count 严格递增 |

---

## §3 · 范围排除(Non-Goals)

**不在 PRD-14 范围**:
1. **真 LLM Judge CI 接入**(继承 PRD-13 isMock=true 默认 · 真启 GitHub Actions / Vercel cron 留 PRR)
2. **真 Google OAuth 接入**(继承 PRD-10 mock OAuth · 留 PRR)
3. **AB 实验真接前端 SDK**(本 PRD 仅 service + admin UI · 不改前端 useAbVariant hook · 留 PRD-15+)
4. **常量版本化 67+23+22 = 112 entry 完整测试覆盖**(seed 时 import · 但单独 vec 表 embed 重跑测试仅 fixture 1-2 个 · 不全跑)
5. **emergency switch 真启钉钉告警**(D-077 isMock=true 默认 · 留 PRR)
6. **完整 ChannelABTest 多 channel(WeChat/抖音/小红书)分流**(本 PRD 仅按 userId 分流 · 留 PRR)
7. **多语言 / i18n**(继承 PRD-10~13 仅中文)
8. **移动端 admin UI**(继承 P9.X 仅响应式桌面)
9. **WAF / IP 白名单 / MFA 真启**(继承 PRD-10 mock · 留 PRR)
10. **超大流量 prod 压测**(emergency switch / cron 频率 / 单点函数并发 · 留 PRR)

---

## §4 · 风险

### §4.1 高风险点

1. **★ ab-stop-loss cron 自动 prod 操作**(US-003)· B 组指标恶化判断算法 + 24h dedupe + 钉钉告警 · 失误回滚影响实验结论 · 需要严格单测覆盖
2. **★ Chi-square + Welch t-test 算法精度**(US-002)· 业务决策依赖 · 必用 @stdlib/stats 库 + 标准 fixture 验证
3. **★ brownfield 3 worker/agent/assembler 集成**(US-012)· TrendingScraper / EvolutionAgent / ContextAssembler · 加 bypass 不破坏主流程
4. **★ 收官 E2E 4 flows 跨域复杂**(US-015)· fake-timers + 真 Prisma + 跨 4 _xxxInTx 单点 + 横切 Approval/emergency
5. **★ 常量版本化 1:1 fork prompt-version.service**(US-006)· 改 5 处 · 必严格 LD-A10 grep 三方一致

### §4.2 中风险点

1. **3 LD-A 新加守护**(LD-A9/A10/A11)· plan-check 2.6.17 自动 catch 三方一致性 · 但仍需严格写
2. **Monaco JSON editor brownfield**(US-009)· admin 改 constant content 必校验 JSON schema(防瞎写 break ContextAssembler)
3. **ContextAssembler 6→7 路并行**(US-008)· Promise.allSettled 各路 5s timeout · brownfield 兼容
4. **3 admin pages 大 UI**(US-004/US-009/US-014)· 8-13 files / 文件 ≥ 500 行 · component 合并 architectural decision

### §4.3 低风险点

1. ab_experiments + ab_assignments + constant_versions + constant_canary_config + feature_flags + system_config 6 表 schema 都已在 DATA-MODEL §13.7 占位 ready
2. Approval 链复用 PRD-13 US-002 完整 service · 仅加 5 新 actionType 到 set
3. PDF 导出复用 PRD-13 US-010 @react-pdf/renderer 4.5.1 framework
4. LLM Judge stub 1:1 复用 PRD-13 US-003 llm-judge.service.ts

---

## §5 · 配额(预计)

| 资源 | 预计 |
|---|---|
| **Story 数** | 15 |
| **新表数** | 4(ab_experiments + ab_assignments + constant_versions + constant_canary_config + feature_flags + system_config = 6 张 · 但 4 张已 §13.7 占位 · 2 张新加 constant_versions/constant_canary_config)|
| **新 service** | 8(ab-experiment + significance + ab-stop-loss.job + constant-version + constant-embed + llm-judge-constant + feature-flag + emergency-switch 集成)|
| **新 admin tRPC procedure** | 17-20 |
| **新 admin page** | 4(/admin/ab-experiments + /admin/ab-experiments/:key + /admin/constants + /admin/feature-flags)|
| **新依赖** | 2(@stdlib/stats-base-dists-chisquare-cdf + @stdlib/stats-base-dists-t-cdf)|
| **新 BullMQ Worker** | 2(ab-stop-loss + constant-embed-rebuild)|
| **新 cron schedule** | 1(ab-stop-loss '0 0 * * * *' hourly Asia/Shanghai)+ constant-embed 是 delayed job(per-event)|
| **预估文件改/新** | 100-130 |
| **预估测试新** | ~ 200 it 跨 15 US |
| **Wall time** | 12-15h · daemon 自跑 · 含 Opus audit |
| **新 TD** | 2-4(brownfield N-1 预留 + 1:1 fork architectural decision)|
| **预估一轮通过率** | 88-93%(参 PRD-13 retro §12.1 预测)|

---

## §6 · 退出条件

PRD-14 P9.4 收官条件(All must PASS):
1. ✅ 15 US 全 PASSED(passes=true)
2. ✅ 6 张表 schema 落地(2 张新 constant_versions/constant_canary_config + 4 张激活 §13.7 占位)
3. ✅ 4 个新 admin pages 可访问 + 浏览器 agent-browser 验收完整
4. ✅ verify-prd-14.sh 9 section 全 PASS
5. ✅ pnpm test ≥ 1875 pass / 0 fail / typecheck 0 errors
6. ✅ pnpm audit:redlines / audit:ld / audit:redlines-admin (11 LD-A) / audit:admin-rls-tables / audit:admin-rls 5/5 全过
7. ✅ plan-check 2.6.17 LD-A 三方一致性 · 11 LD-A 编号集 audit script = AGENTS = 实际单点函数
8. ✅ 4 E2E flows 全 PASS(A/B 启动停损 + 常量版本化 + 紧急开关触发 + 跨域横切)
9. ✅ ContextAssembler 7 路并行 fetch + brownfield fallback 验证(US-008)
10. ✅ Locked Decisions D-102~D-115 全在 PRD 末尾详述

---

## §7 · Locked Decisions(D-102~D-115 · 14 LDs)

### D-102 · A/B 实验显著性检验算法选择

- **分类型指标(转化率类)** · Chi-square test · degrees_of_freedom=1 · 用 @stdlib/stats-base-dists-chisquare-cdf
- **连续型指标(留存天数 / 成本类)** · Welch t-test(允许方差不等)· 用 @stdlib/stats-base-dists-t-cdf
- **p-value 阈值** · 0.05 · 双侧检验
- **sample size 下限** · 30(< 30 强制 inconclusive · 不计算 p-value)
- **理由** · vs 自手写公式 · @stdlib 精度可信 · 业务决策依赖

### D-103 · A/B 实验自动停损规则

- **触发条件** · 任一 metric `recommendation='stop_loser'` AND effect < -30%(B 组超 30% 恶化)
- **dedupe** · 同一实验 24h 内只触发 1 次(防 cron 每小时重复)
- **cron schedule** · `0 0 * * * *` hourly Asia/Shanghai(整点 · 错峰避其他 cron)
- **手动 override** · super_admin 可在 admin UI 一键停损 + 同样走 _stopAbExperimentInTx 单点

### D-104 · A/B 实验 deterministic 分流(继承 PRD-13 D-090)

- **算法** · `bucketPct = parseInt(md5(${userId}:${experimentKey}).slice(0, 8), 16) % 100`
- **threshold 累积** · trafficAllocation control:50 / variant_a:25 / variant_b:25 → 0-49 control / 50-74 variant_a / 75-99 variant_b
- **upsert** · 同 user × experiment 第一次分组 INSERT · 后续重复调返已分组(deterministic)
- **理由** · 同用户多次访问体验稳定 · 不今天 variant_a 明天 control

### D-105 · 知识库 67 案例 + 23 公式 + 22 元素版本化策略(用户决策完整版)

- **存储** · 全部入 constant_versions 表 · seed 时从 lib/constants/*.ts import(112 entry)
- **修改路径** · admin UI 改 → 写 constant_versions(status='draft' → 'pending_review')→ requestApproval(dual)→ 批准 → _publishConstantVersionInTx → 自动 BullMQ embed 重跑 vec 表
- **灰度** · 5 档 [0,1,10,50,100] · 同 prompt_versions D-090
- **回滚** · super_admin 一键 · 走 dual approval
- **brownfield fallback** · constant_versions 表空时 ContextAssembler 第 7 路返 null → fallback to lib/constants/*.ts(不破坏 PRD-1~13)

### D-106 · ContextAssembler 7 路并行 fetch(PRD-13 6 路 + 本 PRD 加第 7 路 _fetchActiveConstants)

- **新加路** · `_fetchActiveConstants(req)` · 按当前 9 步 stepConfig 关心的常量并发查 constant_canary_config
- **timeout** · 5s 各路(同其他 6 路)· Promise.allSettled 不阻断
- **fallback** · 返 null → ContextAssembler 用 SPECIALIST_TEMPLATES + lib/constants/*.ts 旧路径
- **理由** · 跟 US-003 第 6 路 _fetchActivePrompt 同 pattern · architectural consistency

### D-107 · LLM Judge 阈值 4.0(继承 PRD-13 D-091)

- **阈值** · 评分 ≥ 4.0(0-5 量尺)· prompt + constant 共用同 standard
- **isMock 默认** · true · 返 4.2-4.8 模拟 + 写 judgeScore · 真启 PRR
- **理由** · 跟 prompt 同 quality bar · 不分常量类型(简化管理)

### D-108 · feature_flags 3 flagType 路由策略

- **boolean** · 直接 enabled true/false · 简单 toggle
- **percentage** · `bucketPct = md5(${userId}:${flagKey}).slice(0,8) % 100` < rolloutConfig.percentage → enabled · deterministic hash
- **targeted** · `userId in target_users` OR `plan in target_plans` → enabled · 显式名单
- **理由** · 3 flagType 覆盖 80% 灰度场景 · 简单 stack(boolean 简单 + percentage 自动灰度 + targeted 精准)

### D-109 · 3 关键紧急开关定义

- **stop_trending_scraper** · 停 P5/P9.2 TrendingScraper Worker · 救命场景:抓取被风控 / 平台 429
- **stop_evolution_agent** · 停 P8/P9.3 EvolutionAgent execute · 救命场景:LLM API 大面积 5xx / 成本失控
- **enable_fallback_prompt** · ContextAssembler 强制使用 SPECIALIST_TEMPLATES + 跳 prompt/constant DB · 救命场景:DB 慢查询 / Migration 失败
- **轻 Approval** · super_admin 1 人 + 自动 postReviewRequired=true · 24h 后置复核
- **跟 PRD-13 US-002 emergency 区别** · emergencyApprove 是高风险通用 dual approval 快速通道 · 本 PRD 紧急开关是 prod 救命 1-click 操作

### D-110 · 紧急开关 24h 后置复核 cron schedule(继承 PRD-13 US-002)

- **schedule** · 复用 PRD-13 US-002 `emergency-post-review.job.ts` cron `0 30 3 * * *`(Asia/Shanghai 03:30)
- **扩展** · 加 actionType='emergency_switch_triggered' 到扫描范围(原仅扫 'emergency_approval')
- **复用** · 不重写 cron · 仅扩 audit eventType 兼容
- **复核人** · super_admin · reviewerAdminId !== firstApprover 严格校验

### D-111 · _startAbExperimentInTx 单点函数(LD-A9)

- **签名** · `(tx, { experimentId, adminId, approvalRequestId }) => Promise<void>`
- **唯一入口** · ab_experiments.status='running' 设值 + startedAt = now()
- **AGENTS §10 LD-A9 红线** · grep `(prisma|db|tx)\.abExperiment\.update.*(status|stoppedAt|startedAt)` 排除 service + stop-loss job 自身 → 0 命中
- **调用点** · 1(approveRequest callback when actionType='start_ab_experiment')

### D-112 · _stopAbExperimentInTx 单点函数(LD-A9 守护)

- **签名** · `(tx, { experimentId, adminId, stopReason: 'manual' | 'auto_stop_loss', resultSummary? }) => Promise<void>`
- **唯一入口** · ab_experiments.status='stopped' 设值 + stoppedAt + resultSummary
- **调用点** · 2(ab-stop-loss.job auto + admin UI manual stop)

### D-113 · _publishConstantVersionInTx 单点函数(LD-A10)

- **签名** · `(tx, { versionId, adminId, approvalRequestId }) => Promise<void>`
- **唯一入口** · constant_versions.status='active' + archive prev + upsert canary
- **AGENTS §10 LD-A10 红线** · grep `(prisma|db|tx)\.constantVersion\.update.*(status|active)` 排除该函数本身 → 0 命中
- **调用点** · 2(approveRequest callback for publishConstantVersion + rollbackConstant)
- **1:1 fork** · PRD-13 US-003 `_publishPromptVersionInTx` 模板 · 改 5 处

### D-114 · _toggleFeatureFlagInTx + _updateSystemConfigInTx 双单点函数(LD-A11)

- **2 单点** · feature_flag 跟 system_config 字段不同 · 分开单点函数
- **唯一入口** ·
  - `_toggleFeatureFlagInTx` · feature_flags.enabled + rolloutConfig 改
  - `_updateSystemConfigInTx` · system_config.configValue 改
- **AGENTS §10 LD-A11 红线** · grep `(prisma|db|tx)\.(featureFlag|systemConfig)\.(update|upsert|create)` 排除 service 自身 → 0 命中
- **调用点** · `_toggleFeatureFlagInTx` 2(toggle + emergencyToggle)· `_updateSystemConfigInTx` 2(updateConfig + emergencyToggle)

### D-115 · 11 LD-A 红线最终清单(本 PRD 收官时整体 audit)

| LD-A | 守护 | 单点函数 | 来源 PRD |
|:-:|---|---|:-:|
| LD-A1 | admin OAuth 独立 | - | PRD-10 |
| LD-A2 | adminRouter / appRouter 分离 | - | PRD-10 |
| LD-A3 | admin 跨账号查 RLS bypass + 审计 | - | PRD-10 |
| LD-A4 | 高风险走 Approval Gates | - | PRD-10 |
| LD-A5 | admin 内容审核硬闸门 | _createTrendingItemInTx + _createDeepLearningArchiveInTx | PRD-12 |
| LD-A6 | prompt_versions.status='active' | _publishPromptVersionInTx | PRD-13 |
| LD-A7 | evolution_profile clear / insight resolved | _forceRebuildEvolutionInTx | PRD-13 |
| LD-A8 | user_quota dailyQuota/whitelistExpiresAt | _adjustQuotaInTx | PRD-13 |
| **LD-A9** | ab_experiments.status / stoppedAt | **_startAbExperimentInTx + _stopAbExperimentInTx** | PRD-14 |
| **LD-A10** | constant_versions.status='active' | **_publishConstantVersionInTx** | PRD-14 |
| **LD-A11** | feature_flags + system_config | **_toggleFeatureFlagInTx + _updateSystemConfigInTx** | PRD-14 |

plan-check 2.6.17 自动验证 11 LD-A 三方一致性 · 编号集 audit script = AGENTS = 单点函数。

---

## §7.5 · 跨 Story 协议锁(强制 · 3 域 15 US 跨 story 数据传递)

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `approvalRequest.actionType` enum 加 5 新 | string | US-001/006/011/013 | approvalGateService.ts | 'start_ab_experiment' + 'publish_constant_version' + 'rollback_constant' + 'toggle_feature_flag' + 'update_system_config' |
| `_startAbExperimentInTx(tx, {experimentId, adminId, approvalRequestId})` | function | US-001 | US-004 callback | P-6 单点 LD-A9 守护 |
| `_stopAbExperimentInTx(tx, {experimentId, adminId, stopReason, resultSummary?})` | function | US-001 | US-003 cron auto + US-004 manual | P-6 单点 LD-A9 守护 |
| `_publishConstantVersionInTx(tx, {versionId, adminId, approvalRequestId})` | function | US-006 | US-009 callback + US-010 rollback callback | P-6 单点 LD-A10 守护 · 1:1 fork PRD-13 US-003 |
| `_toggleFeatureFlagInTx(tx, {flagKey, enabled, rolloutConfig?, adminId, approvalRequestId?})` | function | US-011 | US-012 emergency + US-013 normal | P-6 单点 LD-A11 守护 |
| `_updateSystemConfigInTx(tx, {configKey, configValue, adminId, approvalRequestId})` | function | US-011 | US-012 emergency | P-6 单点 LD-A11 守护 |
| `getActiveConstantVersion(constantType, constantKey, userId)` | function | US-006 | US-008 ContextAssembler 第 7 路 | brownfield 集成入口 |
| `getFeatureFlagValue(flagKey, userId?, plan?)` | function | US-011 | US-012/013/014 + workers brownfield | 5s TTL cache · 3 flagType 路由 |
| `getSystemConfigValue(configKey)` | function | US-011 | US-012 brownfield 3 处(worker/agent/assembler) | hot path 5s TTL cache |
| `AbVariant` enum | string union | US-001 | US-002/003/004/005 | 'control' \| 'variant_a' \| 'variant_b' |
| `SignificanceTestResult` interface | object | US-002 | US-003/005 | { metric, testType, pValue, isSignificant, effect, sampleSize, confidence, recommendation } |
| `AB_STOP_LOSS_THRESHOLD` const | -0.3 (即 -30%) | US-003 | US-003 cron | 自动停损 effect 阈值 |
| `AB_STOP_LOSS_CRON` const | `'0 0 * * * *'` | US-003 | US-003 worker | hourly Asia/Shanghai |
| `CONSTANT_TYPES` const | readonly ['knowledge_case', 'formula', 'element'] | US-006 | US-007/008/009/010 | 3 类常量枚举 |
| `EMERGENCY_SWITCH_KEYS` const | readonly ['stop_trending_scraper', 'stop_evolution_agent', 'enable_fallback_prompt'] | US-011 | US-012/014 | 3 关键紧急开关 |
| `MIN_AB_SAMPLE_SIZE` const | 30 | US-002 | US-002/004 | sample size 下限 |
| `LLM_JUDGE_THRESHOLD` const | 4.0 | US-003 PRD-13 | US-006/008 复用 | D-091 共用阈值 |
| `MAX_CONSTANT_CONTENT_BYTES` const | 32000 (~32KB) | US-006 | US-009 Monaco | 单常量 content 上限 |

定义 story 的 priority 必须**小于**消费 story · 每条被引用的 AC 必须显式写出此命名。

---

## §8 · 反例库注入(anti_patterns · 47+ entries · 35 历史 + 7 PRD-13 + 5 本 PRD 新增)

### §8.1 关键词命中清单

| 子域 | 关键词集合 | reject-examples 推估命中条数 |
|---|---|:-:|
| ⑭ A/B | 'ab', 'experiment', 'variant', 'chi-square', 't-test', 'significance', 'stop-loss', 'rollout' | 3-5 |
| ⑮ knowledge | 'constant', 'knowledge', 'formula', 'element', 'embed', 'rebuild', 'vec', 'version' | 4-6 |
| ⑯ feature flags | 'feature flag', 'config', 'emergency', 'switch', 'rollout', 'percentage', 'targeted' | 4-6 |
| common | 'transaction', 'prisma', 'tx', '_xxxInTx', 'single source', 'brownfield', 'fallback' | 5-8 |
| **总计 -dedup** | | **27-39 条** |

### §8.2 本 PRD 新增 5 条反例(沉淀到 reject-examples.jsonl)

1. **lesson** · "Chi-square + Welch t-test 用 @stdlib/stats · 不自手写" · **antipattern** · `function chiSquareCdf(x) {...}` 自实现 · **correct** · `import { cdf as chisquareCdf } from '@stdlib/stats-base-dists-chisquare-cdf'`
2. **lesson** · "AB 自动停损 dedupe per experimentId per day" · **antipattern** · cron 每 hour 扫无 dedupe · **correct** · adminAuditLog.findFirst({eventType:'ab_experiment_auto_stop_loss', payload.experimentId, createdAt:{gte:24h_ago}})
3. **lesson** · "常量版本化 1:1 fork prompt-version.service · 不重写灰度" · **antipattern** · 重写 hash 算法 + Approval 链 · **correct** · 复制 280 行 + 改 5 处(import/func name/actionType/hash key/migration)
4. **lesson** · "ContextAssembler 第 7 路 brownfield fallback" · **antipattern** · 删除 lib/constants 强用 DB · **correct** · `_fetchActiveConstants` 返 null → fallback to lib/constants/*.ts 旧路径
5. **lesson** · "getFeatureFlagValue 5s TTL cache · 防 hot path 频繁查 DB" · **antipattern** · 每次调用直查 DB(大并发崩溃)· **correct** · Map + setInterval clear · 5s TTL · 短缓存

---

## §9 · 修订记录

| 版本 | 日期 | 作者 | 改动摘要 |
|---|---|---|---|
| v0.1 | 2026-05-14 | Claude (Opus 4.7) | 初版 · 15 US · D-102~D-115 · 反例 32+ 注入 · 复用 PRD-13 8 patterns + 4 _xxxInTx 家族 · 跟 PRD-14 retro §12.1 预测对齐 |

---

## §10 · Coding 3.0 协同

### §10.1 上游 PRD-13 收官交付物(全 8 patterns 继承)

1. P9.3 健康度域 5 子域横切机制 → 本 PRD 域 ⑭/⑯ 复用 emergency 横切
2. LD-A 红线 + audit script + AGENTS 三方一致(已 plan-check 2.6.17 自动 catch)
3. dual approval + emergency + post-review 三态闭环 → 本 PRD 5 新 actionType 全走
4. BullMQ delayed job + jobId dedup → 本 PRD ab-stop-loss + constant-embed-rebuild 复用
5. admin UI architectural · component 合并到 page → 本 PRD 4 admin page 同 pattern
6. ContextAssembler N 路并行 + brownfield fallback → 本 PRD 加第 7 路
7. LLM Judge stub isMock=true 默认(D-077 强化)→ 本 PRD 常量 LLM Judge 复用
8. TD 主动清理 hint(ralph SKILL.md 已固化)→ ralph daemon 跑前 grep open TD

### §10.2 全局 Skill Diff 已 apply(由 PRD-13 retro F 落地 · 2026-05-14)

- plan-check 2.6.17 · LD-A 三方一致性 → 自动 catch LD-A9/A10/A11 编号集差异
- plan-check 2.6.18 · files_to_create test 覆盖率 → 自动 catch ralph 漏建 test file
- plan-check 2.6.19 · audit grep 实测对齐 → 自动 catch LD-A11 grep 字面 drift
- ralph SKILL · TD 主动清理 hint → ralph dev 跑前 grep open TD

### §10.3 下游(PRD-14 后续 P9.5+ / 上线 PRR)接入预备

- 域 ⑭ A/B 框架 → 上线后真接前端 useAbVariant hook(留 PRR)
- 域 ⑮ 常量 → 真接 LLM Judge CI(GitHub Actions / Vercel cron · 留 PRR)
- 域 ⑯ 紧急开关 → 真启钉钉告警 + Sentry / OTel 集成(留 PRR)

---

## §11 · PRD 后续接入预备

| PRD-14 沉淀的 pattern | 后续复用方式 |
|---|---|
| _startAbExperimentInTx + _stopAbExperimentInTx + _publishConstantVersionInTx + _toggleFeatureFlagInTx + _updateSystemConfigInTx 5 单点 | 4+5=9 _xxxInTx 单点函数家族 · 后续高级域复用 |
| LD-A9/A10/A11 红线 + audit script + AGENTS §10.1 三方一致 | 11 LD-A 总 · 模板成熟 |
| @stdlib/stats Chi-square + Welch t-test | 后续高级 admin / 业务分析复用 |
| 5s TTL cache (getFeatureFlagValue) hot path 优化 | 高频查询场景模板 |
| ContextAssembler 7 路并行 + brownfield fallback | 后续加新数据源同 pattern |
| BullMQ ab-stop-loss + constant-embed-rebuild | 9 BullMQ cron 总 · 错峰模板 |

PRD-14 启动前必读 §0 引用清单 + PRD-13 retro §11 Playbook 最关键 3 条。

---

> **本 PRD 由 Claude (Opus 4.7) 在 2026-05-14 撰写 · 2000+ 行 · 15 US · 3 子域 · seed 文档级详细度标准 · 严格继承 PRD-13 8 patterns + 4 Skill Diff · 启动前必读 §0 引用清单**
