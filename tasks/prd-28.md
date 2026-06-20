# PRD-28 · evaluation 完整化 · LLM Judge 真闭环 + 100 金标准 + admin UI + /goal-verify 集成

> **状态** · 待启动(2026-05-22 PRD-27 ship 后立即接续)
> **branch** · `ralph/prd-28-evaluation`(已建)
> **依赖** · PRD-27 已 merge main(commit `4e54052 Merge: PRD-27 · 1:1 复刻完成 100%`)
> **范围分档** · 6 US(1 foundation US-001 + 1 high US-003 + 4 medium)
> **预期 daemon** · 14-20h · Opus audit cycle 1.5-2h/US × 5 dev US + 1 收官 ≈ 14-16h wall time · ≈ 2 天
> **关键意义** · **解决 TD-027 跨 8 PRD 历史欠债** · LLM Judge 从"全 mock 永远 pass"转"真闭环 grade" · PRD-MASTER §4.4 100 金标准延迟交付补做

---

## §0 引用清单 + 元数据 + evaluation 定调

### §0.1 上游文档(10 份核心)

| # | 文档 | 用途 | 重点章节 |
|:-:|---|---|---|
| 1 | [PRD-MASTER.md](../PRD-MASTER.md) | 14 PRD 总纲 + §4.4 LLM Judge 100 金标准准备规范(双轨制 sally 30 + 自造 70) | §4.4 100 金标准 · §4.5 测试配额(foundation/high ≥ 5 Judge)· §6 anti-patterns |
| 2 | [ARCHITECTURE.md](../ARCHITECTURE.md) §9.11-E.4 | LLM Judge 配置完整 · GPT-4o Judge / 100 金标准 / 阈值 4.0 · 4 维度评分(结构/内容/风格/进化/回归)| §9.11-E.4 评分维度 + 阈值 |
| 3 | [DATA-MODEL.md](../DATA-MODEL.md) | prompt_versions 已有 judgeScore/judgeRunId/judgeReportUrl 字段(L3057-3060) · 新增 evaluation_runs + evaluation_samples 表 | L3050+ prompt_versions · §6 多表 |
| 4 | [tasks/prd-27.md](prd-27.md) | PRD-27 LLM 接入收官 · §9.1 PRD-28 evaluation 完整化 handoff | §9.1 4 目标 · §11 跨 PRD 协议锁 |
| 5 | [.agents/retros/prd-27-vs-prd-26-retrospective.md](../.agents/retros/prd-27-vs-prd-26-retrospective.md) | PRD-27 retro · §3.2 TD-027 "open · 留 PRD-28 evaluation 完整化" · §5 P-27 Playbook 沉淀 | §3.2 TD-027 + §5 playbook |
| 6 | [AGENTS.md](../AGENTS.md) §11.18 | PRD-27 1:1 复刻收官沉淀 · BullMQ 状态机 + LLM 接入收官 + ModelTier 跨文件 + visual baseline npm script + 14 specialist 完整拓扑 | §11.18.1~5 5 sub-section |
| 7 | [.agents/tech-debt.json](../.agents/tech-debt.json) | TD-027 跨 8 PRD(PRD-2~PRD-8 affects)· status='resolved' 是 PRD-25 US-008 单文件 voice-chat 修复 · 实际 21/21 judge file 仍 mock | TD-027 evidence + fix_hint 三选(A 真调 / B skipIf / C ollama) |
| 8 | `~/.claude/playbooks/reject-examples.jsonl` | 跨 PRD 反例库 · 54 条(seed 35 + PRD-21~27 累积 19) | anti_patterns 注入(1 foundation + 1 high · medium 各 2-3 条) |
| 9 | `~/.claude/commands/plan-check.md` | §2.6.26 LLM 接入 AC 双 review(M-3)+ §2.6.28/29 BullMQ + ModelTier 跨文件同步(PRD-27 新增) | 本 PRD plan-check 必跑 |
| 10 | tests/judge/ 21 files + judge-runner.ts | 当前 mock 实现(21 file vi.mock('@/workers/llm-gateway') + mockComplete.mockResolvedValue 固定值)· judge-runner 已 lightweight tier + judge_call eventType + retry=1 + timeout=10s 就位 | 21 file 全 mock · 改造范围 |

### §0.2 元数据

| 项 | 值 |
|---|---|
| **branchName** | `ralph/prd-28-evaluation`(已建 · from main HEAD 4e54052) |
| **Locked Decisions** | D-265 起延续(PRD-27 收尾在 D-264 · 本 PRD 8 D · D-265~D-272) |
| **风险分档** | **foundation × 1**(US-001 21 judge file mock 拆除 + describe.skipIf · downstream count=5 · 被 US-002/003/004/005/006 全部依赖)+ **high × 1**(US-003 evaluation pipeline · prisma schema 加 + CLI 跑 100 sample + 4 维度评分)+ **medium × 4**(US-002 dataset · US-004 admin UI · US-005 inter-rater · US-006 收官)|
| **anti_patterns 注入** | foundation US-001 + high US-003 必须从 reject-examples.jsonl 检索 ≤ 3 条 · 关键词: `'vi.mock 固定值 mock 永远 pass'`(TD-027 self-ref) / `'ANTHROPIC_API_KEY env'` / `'describe.skipIf 优雅 skip'` / `'真调 LLM 成本控制'` / `'prisma migration 顺序'` / `'admin RLS DISABLE 区分'` / `'foundation 档 downstream count 升档'` / `'ROOT scope vitest 跑'`(M-2 PRD-27 US-005 教训) |
| **依赖前置 PRD** | PRD-1~27 全部已 ship · 严格保留不动 · 重点: PRD-2 LLM Gateway · PRD-25 LLM 接入征程(8 specialist 真 LLM)· PRD-26 admin polish + L4 进化 · PRD-27 1:1 复刻收官 |
| **下游 PRD** | PRD-29+ · 多用户压测 · 移动端 polish · 海外版 · OAuth 流式 · PRR |
| **失败回滚** | `git branch backup/before-prd-28 main` 待建(daemon 启动前必跑) |
| **dev server 配套** | TD-095 已在 PRD-25 落地 · ralph.py `--daemon` 自动 fork pnpm dev · admin 测试 e2e 自动健康检查继承 |
| **TD-027 当前状态** | tech-debt.json status='resolved'(2026-05-20 PRD-25 US-008)· 实际 grep 验证 19/19 有效 judge file 仍 `vi.mock('@/workers/llm-gateway')` *(voice-chat + video-acquisition 已删 · 不计入)* · PRD-28 重开 status='open' + 真闭环修复(19 有效 file) [重构删: voice-chat.judge.ts vi.hoisted()+beforeEach 模式] |
| **21 judge file 清单** (本轮重构删 voice-chat + video-acquisition · 实际改造 19 file) | analysis-structural · analysis-viral · branding · copywriting · copywriting-acquisition · copywriting-boom · copywriting-free · daily-task-agent · evolution-agent · feedback-evolution-loop · insight-injection · livestream · monetization · positioning · rag-injection · topic · video · video-production · video-storyboard(共 19 有效 · judge-runner.ts 不计) [重构删: video-acquisition · voice-chat]|
| **100 金标准来源(双轨)** | 轨 1 sally 实测样本 30(/tmp/aiipznt-clone-research/api/api-probe-results.json 等抓自 sally step3/3b/4b/5/7)· 轨 2 自造 70(团队人工写覆盖 14 specialist · 每 specialist ~5 条) |
| **CLI 跑批策略** | `pnpm eval:run --specialist=all --samples=100`(新增 script)· 走 LLMGateway lightweight tier · 写 prisma evaluation_runs + evaluation_samples · 单次跑 ≈ 20-30 min · cost ≈ $0.5-1 |
| **inter-rater agreement** | 30 sample subset · 用户在 admin /admin/evaluation/inter-rater 页面手工评 0-10 分 · 跟 LLM Judge 同 sample 评分对比 · 计算 Cohen's kappa + Pearson correlation · 阈值 κ≥0.6(2026-06-20 对齐 KB eval-suite gate；原 PRD 0.4 为历史) |
| **PRD-MASTER §4.4 补做定位** | PRD-MASTER C 项原写"PRD-13 启动前 · 100 条全部跑完" · 实际 PRD-13 跑完时未做 · PRD-28 是补做 · 不算流程违规 · 是延迟交付 |

### §0.3 evaluation 定调(D-265 · 真闭环锁)

| 维度 | 切 / 不切 |
|---|:-:|
| LLM Judge mock 拆除(21 file 全部移除 vi.mock('@/workers/llm-gateway'))| ✅ **必拆**(TD-027 真闭环 · 不再 mockResolvedValue 固定 pass)|
| describe.skipIf(!process.env.ANTHROPIC_API_KEY)(无 KEY 优雅 skip)| ✅ **必加**(防 CI/dev 无 KEY 时 hard fail) |
| ANTHROPIC_API_KEY 注入路径(dotenv 自动 + .env.example 文档)| ✅ **必加**(tests/setup.ts 加 dotenv config) |
| 跨 PRD 历史 judge tests 删除 vs 改造 | ❌ **不删 改造**(21 file 含 specialistId/mode/criteria 元数据是金子 · 全部 keep · 仅替换 mock 路径) |
| evaluation_runs + evaluation_samples 表新增(prisma migration)| ✅ 切(主应用 RLS · LD-009 双层防护 explicit accountId · 系统级 evaluation 用 admin_user_id=0 系统账号) |
| admin /admin/evaluation UI 评分历史 + 跨 specialist × 场景对比矩阵 | ✅ 切(新 page · 走 packages/ui/admin 模式继承 PRD-26) |
| inter-rater agreement Cohen's kappa 计算(30 sample subset)| ✅ 切(必做 · 算法用 simple-statistics npm package 或 inline 实现) |
| 4 维度评分维度全做(结构 zod + 内容 LLM Judge + 风格 embedding + 回归)| 🟡 **部分** · 必做结构 + 内容 · 风格 embedding 留 PRR(成本敏感)· 回归留 PRD-29 多用户压测期 |
| /goal-verify §evaluation 维度集成(Step 7 收官跑评估)| ✅ 切(verify-prd-28.sh + .agents/verification/prd-28-evaluation.md) |
| 数据集存储位置 | tests/fixtures/judge-goldens/{sally-30,custom-70}.json(版本化随 git)· 内含 100 条 {specialistId, mode, input, expectedOutputPattern, criteria, expectedKeyFields, source: 'sally' \| 'custom'} |
| CLI 脚本 tooling | `apps/api/src/scripts/eval-run.ts`(新建)· 命令 `pnpm --filter @quanan/api eval:run` · 读 fixtures · 调 specialist.execute · 调 runJudge · 写 evaluation_samples |

**D-265 真闭环反例锁**:
- ❌ NEVER 保留 `vi.mock('@/workers/llm-gateway')` · 21 file 全部移除
- ❌ NEVER `mockResolvedValue({pass:true,score:8})` 固定值 mock
- ❌ NEVER ANTHROPIC_API_KEY 硬编码在 source code(走 process.env)
- ✅ Judge tests 走 `describe.skipIf(!process.env.ANTHROPIC_API_KEY)` · 无 KEY 跳过 · 有 KEY 真调
- ✅ Eval CLI 跑批使用 `apps/api/src/scripts/eval-run.ts` 独立脚本 · 不在默认 `pnpm test` 路径
- ✅ ANTHROPIC_API_KEY 从 .env(已 .gitignore)读 · .env.example 加 placeholder

---

## §1 介绍/概述

### §1.1 范围(scope)

PRD-28 是 **解决 TD-027 跨 8 PRD 历史欠债的补做 PRD** · 让 LLM Judge 从 "永远 pass 的 fake test" 转 "真调 LLM grade output" · 同时补做 PRD-MASTER §4.4 规定的 100 金标准数据集 + admin /admin/evaluation UI + /goal-verify 集成。

**核心交付**:
1. **19 有效 judge file mock 拆除 + 真闭环** *(21→19 · voice-chat + video-acquisition 已删 · 不改造)*(US-001 foundation · 19 file `vi.mock('@/workers/llm-gateway')` 全部移除 · 加 `describe.skipIf(!process.env.ANTHROPIC_API_KEY)` 优雅 skip · ANTHROPIC_API_KEY 注入路径建立)
2. **100 金标准数据集准备**(US-002 medium · tests/fixtures/judge-goldens/sally-30.json + custom-70.json · 双轨制 sally 30 + 自造 70 · 14 specialist 配额按 PRD-MASTER §4.4-B)
3. **evaluation pipeline + prisma schema + CLI 跑批**(US-003 high · 新增 evaluation_runs + evaluation_samples 表 + `pnpm eval:run` CLI · 跑 100 sample 真调 · 写 4 维度评分 · 结构 zod schema 验证 + 内容 LLM Judge 评分 + 通过率统计)
4. **admin /admin/evaluation UI**(US-004 medium · 评分历史列表 + 多 specialist × 场景对比矩阵 + drill-down 单 sample 详情)
5. **inter-rater agreement**(US-005 medium · 30 sample subset · admin /admin/evaluation/inter-rater 用户手工评 0-10 分 UI + Cohen's kappa + Pearson correlation 计算)
6. **/goal-verify §evaluation 集成 + 收官**(US-006 medium · verify-prd-28.sh 7 sections + retro)

### §1.2 不在范围(out of scope · D-266 字面锁)

- ❌ **风格一致性 cosine embedding 评分**(留 PRR · 需要 reference output embedding baseline · 成本敏感)
- ❌ **回归保护 CI 自动跑批**(留 PRD-29 多用户压测期一并接 CI · 本 PRD 只做 CLI 手动跑)
- ❌ **GPT-4o Judge**(PRD-MASTER 写 GPT-4o · 实际项目用 Anthropic claude-haiku-4-5 lightweight tier · 不改这个决策 · 走 LLMGateway 抽象层)
- ❌ **进化有效性维度评分**(EvolutionAgent 改 prompt 前/后 LLM Judge 评分对比 · 留 PRD-29+)
- ❌ **prompt_versions 表自动绑定 judgeScore**(PRD-13 admin Prompt 版本管理已有字段 · PRD-28 只在 evaluation_runs 写分 · prompt_versions.judgeScore 写入留 PRD-29+)
- ❌ **正式 staging server 部署**(本地 dev + 真 ANTHROPIC_API_KEY 即"staging" · 远程部署留 PRR)
- ❌ **多用户压测 / 性能 baseline**(留 PRD-29)
- ❌ **移动端响应式 polish**(留 PRD-30)
- ❌ **i18n / 海外版**(留 PRD-31)
- ❌ **OAuth + Streamdown AI 流式完整化**(留 PRD-32)

### §1.3 关键决策(D-265 ~ D-272 · 8 锁)

| Decision | 内容 | 反例 |
|:-:|---|---|
| **D-265** | **TD-027 真闭环锁** · 19 有效 judge file `vi.mock('@/workers/llm-gateway')` + mockComplete 全部移除 *(21→19 · voice-chat + video-acquisition 已删 · 不改造这两个文件)* · judge-runner.ts 直接调真 LLMGateway · `describe.skipIf(!process.env.ANTHROPIC_API_KEY)` 无 KEY 优雅 skip · 有 KEY 真调 claude-haiku-4-5 lightweight tier · pnpm test:judge 真 grade(0 KEY 时 skip 19 file · 有 KEY 时跑 19 file × N case · cost ≈ $0.1-0.2/run · time ≈ 5-8 min) | ralph 误把 mock 改成 `mockResolvedValue({pass:true})` 但用 `vi.hoisted()`(像 voice-chat.judge.ts 那样)· 仍是 fake-pass · 必须**完全移除 vi.mock 调用**(0 命中 grep `vi.mock.*llm-gateway` in tests/judge/ 有效 19 file)·  |
| **D-266** | **100 金标准 dataset 锁** · `tests/fixtures/judge-goldens/sally-30.json`(轨 1 · 30 条 · 从 /tmp/aiipznt-clone-research/api/api-probe-results.json + knowledge-cases-full.json 抓取 sally step3/3b/4b/5/7 实测样本)+ `custom-70.json`(轨 2 · 自造 70 条覆盖 14 specialist · 配额按 PRD-MASTER §4.4-B: CopywritingAgent 12 + BrandingAgent 10 + TopicAgent 8 + PositioningAgent 6 + MonetizationAgent 6 + VideoAgent 8 + AnalysisAgent 6 + 其他 7 specialist 44 · 总 100)· schema: `{id: 'sally-001' \| 'custom-001', specialistId, mode?, input: object, expectedOutputPattern: object \| null(LLM 自由生成时 null), criteria: string[], expectedKeyFields: string[], source: 'sally' \| 'custom', tags?: string[]}` | ralph 误把 sally 实测当"标准答案" · 实际是参考基线(spec §4.4-A "不是答案 · LLM Judge 用来理解原版输出风格")· criteria 字段是核心 · expectedOutputPattern 可以 null(LLM 自由生成时不锁 output) |
| **D-267** | **evaluation_runs + evaluation_samples 表 schema 锁(prisma 新增 · LD-009 双层防护)** · `model EvaluationRun { id, runId(UUID), startedAt, finishedAt?, totalSamples, passedSamples, failedSamples, skippedSamples, avgScore Decimal, modelTier, model String, totalTokens, totalCostUsd Decimal, status: 'running' \| 'completed' \| 'failed', metadata Json? }` · `model EvaluationSample { id, runId(FK), goldenId, specialistId, mode?, input Json, actualOutput Json, judgeScore Int(0-10), judgePass Boolean, judgeReason String, structurePass Boolean(zod schema check), durationMs Int, tokensUsed Int, costUsd Decimal, createdAt }` · 系统级表 · 不挂 accountId · RLS DISABLE(走 admin RBAC) · index: runId / specialistId / createdAt(sort DESC) | ralph 误加 `accountId` 字段 · evaluation 是系统级评估 · 不是用户数据 · RLS DISABLE; 同样误加 `userId` 字段 · 不需要 |
| **D-268** | **eval-run.ts CLI 跑批锁** · `apps/api/src/scripts/eval-run.ts` 新建 · 命令 `pnpm --filter @quanan/api eval:run [--specialist=<all\|id>] [--samples=<N>] [--source=<all\|sally\|custom>]` · 流程: (1) 读 fixtures → (2) 创建 evaluation_runs row · status='running' → (3) 对每 sample · 跑 specialist.execute(LLM 真调)· 拿 actualOutput → (4) 跑 specialist.outputSchema.safeParse(actualOutput) · 取 structurePass → (5) 跑 runJudge({specialistId, input, actualOutput, criteria, expectedKeyFields}) · 拿 judgeScore/judgePass/reason → (6) 写 evaluation_samples row → (7) 更新 evaluation_runs aggregate(totalSamples + passedSamples + avgScore + totalTokens + totalCostUsd)→ status='completed' / 'failed' · console.log 进度 + 最终摘要 | ralph 误把 eval-run.ts 写在 apps/api/src/lib/ · 必须在 scripts/(独立 CLI · 不进 worker / router)· script 内部走 prisma 直连(无 RLS ctx)· 不能假设有 trpc ctx |
| **D-269** | **admin /admin/evaluation UI 路由锁** · `apps/admin/src/pages/evaluation/` 新建目录 · `EvaluationPage.tsx`(评分历史列表 + 跨 specialist × 场景对比矩阵)+ `EvaluationDetailPage.tsx`(单 run drill-down · 100 sample 详情 + score 分布柱状图)· router 加 `<Route path="/evaluation" element={<EvaluationPage />} />` + `/evaluation/:runId` · admin nav 加 evaluation entry · admin trpc router 加 `admin.evaluation.{listRuns, getRun, listSamples}` 3 procedures · 全部 require role=ops 或 admin(走 PRD-13 RBAC) | ralph 误把 evaluation UI 写在 apps/web · 必须在 apps/admin(LD-A-1 admin/web 严格隔离 · R-001 不暴露内部数据)· UI 走 packages/ui/admin 共享组件(Table / Card / Chart)· 不重写 |
| **D-270** | **inter-rater agreement subset 锁(30 sample)** · `evaluation_runs.inter_rater_subset_id String?` 字段 + `EvaluationSample.humanScore Int?(0-10) + humanScoreBy Int?(admin_user_id) + humanScoredAt DateTime?` · admin /admin/evaluation/inter-rater/:runId 页面 · 列 30 sample(从 evaluation_samples 按 runId 随机取 30 条 · seed 固定为 runId hash · 保证 reproducible)· 每 sample 显示 input + actualOutput + criteria + LLM Judge score · 用户点 0-10 评分 + 注释 · 提交后写 humanScore · 30 sample 全评完后自动计算 Cohen's kappa(LLM Judge score 转 categorical 0-5 fail / 6-10 pass · vs humanScore 转同)+ Pearson correlation(continuous 0-10 vs 0-10) · 显示在 /admin/evaluation/:runId 页面 | ralph 误把 inter-rater UI 写在 apps/web · 必须在 apps/admin · 同 D-269; 同样误把 Cohen's kappa 公式写错 · 用 simple-statistics npm package 或手写 · 公式: κ = (Po - Pe) / (1 - Pe) · Po=observed agreement · Pe=expected by chance · 阈值 κ ≥ 0.4 moderate / ≥ 0.6 substantial / ≥ 0.8 almost perfect |
| **D-271** | **/goal-verify §evaluation 集成锁** · `~/.claude/commands/goal-verify.md` 加 §evaluation 维度(可选 · Step 7 收官时跑)· 流程: (1) 检测 evaluation_runs 表是否有 status='completed' run → (2) 若有 · 读最新 run → (3) 取 4 维度: total/pass/avgScore/inter_rater_kappa → (4) 阈值: avgScore ≥ 6.0 + passRate ≥ 70% + kappa ≥ 0.4 → (5) 写入 .agents/verification/prd-N-goal-backward.md §evaluation 段 · 全 PASS / 部分 PASS / 不 PASS · /goal-verify 报告 evaluation 摘要 · 不阻塞 verification PASS(evaluation 仅是辅助维度)| ralph 误把 evaluation 维度作为 verify 阻塞条件 · 必须仅是辅助维度(不达标 WARN 不 FAIL) · /goal-verify §1+ Goal-backward 仍是主链路 |
| **D-272** | **PRD-28 收官达 TD-027 真闭环 + 100 金标准就位 + admin /admin/evaluation UI MVP 验证锁** · verify-prd-28.sh 7 sections: §1 19 有效 judge file mock 拆除 grep 验证 *(21→19 · voice-chat + video-acquisition 已删)*(vi.mock.*llm-gateway 在 tests/judge/ 必须 0 命中) · §2 100 金标准 fixtures 文件存在 + count=100 · §3 evaluation_runs/evaluation_samples 表存在(prisma db pull)· §4 eval-run.ts CLI 可跑(`pnpm --filter @quanan/api eval:run --samples=5` smoke test)· §5 admin /admin/evaluation 3 路由(/evaluation + /:runId + /inter-rater/:runId)visual baseline 存在 · §6 prisma migration 已 apply · §7 /goal-verify §evaluation 集成 + retro · ≥ 25 checks · 全 PASS | ralph 误把 verify-prd-28.sh §1 grep 写成 `tests/judge/ vi.mock` 不带 quote · 必须 quote 防 shell expand · 同样 §4 smoke test 不该跑真 LLM(无 KEY 时会 hard fail · 应该用 --skip-llm 或者只验证 CLI 加载不报错) |

---

## §2 目标

### §2.1 主要目标

**解决 TD-027 跨 8 PRD 历史欠债** · 让 LLM Judge 真闭环 grade output · 同时补做 PRD-MASTER §4.4 规定的 100 金标准数据集 + admin /admin/evaluation UI MVP + /goal-verify 集成 · 为 PRD-29+ 多用户压测 + PRR 上线奠定 evaluation 基础。

### §2.2 量化指标

| 指标 | 当前 | 目标 |
|---|:-:|:-:|
| 19 有效 judge file mock 拆除 *(21→19 · voice-chat + video-acquisition 已删)* | 19/19 仍 vi.mock | **0/19 vi.mock**(grep `vi.mock.*llm-gateway` in tests/judge/ 命中 0)|
| 100 金标准 dataset 准备 | 0/100 | **100/100**(30 sally + 70 custom)|
| evaluation_runs / evaluation_samples 表 | 不存在 | 存在 · prisma migration applied |
| eval-run.ts CLI 跑批可跑 | 不存在 | **可跑 + 写库**(实测 5 sample smoke test) |
| admin /admin/evaluation UI 3 路由 | 不存在 | **存在 + visual baseline**(/evaluation · /:runId · /inter-rater/:runId)|
| inter-rater Cohen's kappa 计算 | 不存在 | **可计算 + 阈值 ≥ 0.6**(LLM Judge vs human 30 sample subset；κ≥0.6 2026-06-20 对齐 KB eval-suite gate；原 PRD 0.4 为历史)|
| /goal-verify §evaluation 集成 | 不存在 | **集成 + verify-prd-28.sh § 25 checks** |
| pnpm test:judge 真闭环 | mock 永远 pass | **真 grade · skipIf 优雅**(无 KEY skip · 有 KEY 跑 56 sample) |
| TD-027 status | 'resolved'(假)| **'resolved'(真闭环)**(2026-05-22 PRD-28 重新关闭)|

### §2.3 验收锚点(Goal-Backward 验证 · /goal-verify §1+ 必查)

1. ✅ `grep -rn "vi.mock.*llm-gateway" tests/judge/` 命中 0(19 有效 file 全拆除 · voice-chat + video-acquisition 已删不计)
2. ✅ tests/fixtures/judge-goldens/sally-30.json + custom-70.json 存在 · count 验证 30 + 70 = 100
3. ✅ prisma migration 加 evaluation_runs + evaluation_samples 表 · `prisma db pull` 验证 schema
4. ✅ `pnpm --filter @quanan/api eval:run --samples=5` 可跑 · 写库验证 5 row in evaluation_samples
5. ✅ admin /admin/evaluation 3 路由可加载 · visual baseline 存在 · admin RBAC 限制(role=ops/admin)
6. ✅ 30 sample inter-rater subset 评分 UI 可跑 · Cohen's kappa 计算逻辑 unit test passed
7. ✅ /goal-verify §evaluation 维度报告 · 阈值 avgScore ≥ 6.0 + passRate ≥ 70% + kappa ≥ 0.4
8. ✅ verify-prd-28.sh ≥ 25 checks ALL PASS
9. ✅ /prd-retro PRD-28 vs PRD-27 复盘 · 跨 PRD-21~28 8 PRD 趋势对比
10. ✅ AGENTS.md §11.19 PRD-28 evaluation 完整化沉淀
11. ✅ TD-027 status='resolved'(真闭环)· tech-debt.json 加 close_evidence 跟 PRD-25 假闭环区分

---

## §3 User Stories(6)

> **总计** · 6 US · 1 foundation(US-001)+ 1 high(US-003)+ 4 medium

### US-001 foundation · 19 有效 judge file mock 拆除 + describe.skipIf + ANTHROPIC_API_KEY 注入(D-265 字面锁)

**As** Coding 3.0 项目 · **I want** 19 有效 tests/judge/*.judge.ts 全部移除 `vi.mock('@/workers/llm-gateway')` + 加 `describe.skipIf(!process.env.ANTHROPIC_API_KEY)` + tests/setup.ts 加 dotenv 注入 · **so that** `pnpm test:judge` 在无 KEY 时优雅 skip(19 file 全 skipped)· 有 KEY 时真调 claude-haiku-4-5 grade(56 sample · 5-8 min · cost ≈ $0.1-0.2)· TD-027 真闭环 · 不再 fake-pass。[重构删:voice-chat + video-acquisition 已删,21→19 有效 file]

**risk_level** · **foundation**(downstream count=5 · 被 US-002 dataset + US-003 evaluation pipeline + US-004 admin UI + US-005 inter-rater + US-006 收官全部依赖 · 升档 foundation)

**size_hint** · medium(19 有效 file 改造但模式重复 *(21→19 · voice-chat + video-acquisition 已删)* · 单 file ~5 分钟 · 总 ~30 分钟 · 加 tests/setup.ts + .env.example + plan-check 校验 · 估时 4-6h dev iter · 1 round 可完成)

**files_to_modify**:
- `tests/judge/analysis-structural.judge.ts` (移除 vi.mock + 加 describe.skipIf)
- `tests/judge/analysis-viral.judge.ts` (同)
- `tests/judge/branding.judge.ts` (同)
- `tests/judge/copywriting-acquisition.judge.ts` (同)
- `tests/judge/copywriting-boom.judge.ts` (同)
- `tests/judge/copywriting-free.judge.ts` (同)
- `tests/judge/copywriting.judge.ts` (同)
- `tests/judge/daily-task-agent.judge.ts` (同)
- `tests/judge/evolution-agent.judge.ts` (同)
- `tests/judge/feedback-evolution-loop.judge.ts` (同)
- `tests/judge/insight-injection.judge.ts` (同)
- `tests/judge/livestream.judge.ts` (同)
- `tests/judge/monetization.judge.ts` (同)
- `tests/judge/positioning.judge.ts` (同)
- `tests/judge/rag-injection.judge.ts` (同)
- `tests/judge/topic.judge.ts` (同)
- `tests/judge/video-production.judge.ts` (同)
- `tests/judge/video-storyboard.judge.ts` (同)
- `tests/judge/video.judge.ts` (同)
- `tests/judge/judge-runner.ts` (不动 · 真调路径已就位)
- `tests/setup.ts` (新建或修改 · 加 `import * as dotenv from 'dotenv'; dotenv.config({path: '.env'});`)
- `.env.example` (加 `ANTHROPIC_API_KEY=REDACTED key for pnpm test:judge real-call mode)`)
- `vitest.judge.config.ts` (确认 setupFiles 含 tests/setup.ts · 若无加)
- `package.json` (确认 test:judge script 不动)

**Acceptance Criteria**:
- AC-1 · 19 有效 tests/judge/*.judge.ts 全部移除 `vi.mock('@/workers/llm-gateway', () => (...))` 调用 *(voice-chat.judge.ts + video-acquisition.judge.ts 不改造 · 已删功能)* · grep 验证: `grep -rn "vi.mock.*llm-gateway" tests/judge/` 命中 **0**
- AC-2 · 19 有效 tests/judge/*.judge.ts 全部移除 `mockComplete`/`mockResolvedValue` 等 mock 助手 · grep 验证: `grep -rn "mockComplete\|mockResolvedValue.*pass" tests/judge/` 命中 **0**
- AC-3 · 19 有效 tests/judge/*.judge.ts 全部在 describe 最外层加 `describe.skipIf(!process.env.ANTHROPIC_API_KEY)` 限定: `describe.skipIf(!process.env.ANTHROPIC_API_KEY)('XYZ LLM Judge', () => {...})` · grep 验证: `grep -rn "describe.skipIf.*ANTHROPIC_API_KEY" tests/judge/ | wc -l` ≥ 19 *(voice-chat + video-acquisition 已删 · 不计入)*
- AC-4 · tests/setup.ts 存在 · 内含 `import * as dotenv from 'dotenv'; dotenv.config();` 或等价 ESM import · 验证: `head -10 tests/setup.ts` 含 dotenv
- AC-5 · .env.example 加 `ANTHROPIC_API_KEY=REDACTED 行(带注释 "# PRD-28 LLM Judge real-call mode") · 验证: `grep "ANTHROPIC_API_KEY" .env.example` 命中
- AC-6 · vitest.judge.config.ts setupFiles 含 'tests/setup.ts'(若已含 PASS · 若无加)· 验证: `grep "setupFiles" vitest.judge.config.ts` 含 setup.ts
- AC-7 · 在**无 ANTHROPIC_API_KEY env**条件下 · `pnpm test:judge` 输出 19 有效 file `skipped`(无 hard fail · 0 test 跑 · voice-chat + video-acquisition 已删不计)· 验证: `unset ANTHROPIC_API_KEY && pnpm test:judge 2>&1 | tail -10` 含 "19 skipped" 或等价
- AC-8 · 在**有 ANTHROPIC_API_KEY env**条件下(用户 export 真 KEY)· `pnpm test:judge` 跑 19 有效 file 真调 LLM · 全 pass(score ≥ 6 + JSON schema valid) · 验证: `pnpm test:judge 2>&1 | tail -20` 含 "19 passed" + 时长 ≥ 60s(真 LLM call latency) *(voice-chat + video-acquisition 已删 · 21→19)*
- AC-9 · ROOT scope `pnpm test`(不是 apps/api scope)· 零回归 · 1925 passed + 118 skipped(baseline 2026-05-22)· 验证: `pnpm test 2>&1 | tail -10` 含 "1925 passed | 118 skipped"(±5 容忍)· 注意必须 ROOT 跑(M-2 PRD-27 US-005 60 min 救火教训 · 类比扩展到 vitest)
- AC-10 · `pnpm typecheck` 6 workspace 全 Done · 0 error · 验证 `pnpm typecheck 2>&1 | tail -5` 含 "Done" × 6
- AC-11 · `pnpm lint --max-warnings=0` 0 warning · 验证 lint clean
- AC-COMMON · ROOT scope vitest 必跑(M-2 PRD-27 US-005 教训)· 不是 apps/api scope · 不是 packages/* scope · 是项目根目录 `pnpm test`

**测试要求**(foundation 档 · PRD-MASTER §4.5-B):
- 单元 ≥ 15(21 judge file 各 ≥ 0 但 tests/setup.ts + dotenv 路径需 ≥ 3 inline test)
- 集成 0(纯 test infra)
- E2E 0
- LLM Judge 0(本 US 不跑 Judge · US-003 才跑)

---

### US-002 medium · 100 金标准 dataset 准备(双轨 sally 30 + custom 70 · D-266 字面锁)

**As** Coding 3.0 项目 · **I want** `tests/fixtures/judge-goldens/sally-30.json` + `custom-70.json` 准备好 · 总 100 条 · 14 specialist 按 PRD-MASTER §4.4-B 配额 · **so that** US-003 evaluation pipeline 有真数据集可跑 · 100 sample 评估覆盖 14 specialist 全主流 mode。

**risk_level** · medium

**size_hint** · medium

**files_to_create**:
- `tests/fixtures/judge-goldens/sally-30.json` (新建 · 30 条 · 从 /tmp/aiipznt-clone-research/api/api-probe-results.json + api-probe-v3.json + api-probe-v4.json + knowledge-cases-full.json 抓 sally 实测 step3/3b/4b/5/7 样本 · 每步 5-7 条 · 总 30)
- `tests/fixtures/judge-goldens/custom-70.json` (新建 · 70 条 · 自造 · 14 specialist 配额: CopywritingAgent 12 + BrandingAgent 10 + TopicAgent 8 + PositioningAgent 6 + MonetizationAgent 6 + VideoAgent 8 *(仅 video-production mode · acquisition mode 已删)* + AnalysisAgent 6 + DiagnosisAgent 4 + LivestreamAgent 4 + EvolutionAgent 4 + DailyTaskAgent 4 + PrivateDomainAgent 4 + PresentationAgent 4 + DeepLearnAgent 4 · 总 70) [重构删: VoiceChatAgent · 语音对话已删 · voice-chat.judge.ts 不改造]
- `tests/fixtures/judge-goldens/SCHEMA.md` (新建 · 含 dataset entry schema 文档 · TypeScript interface + JSON example · ~50 行)
- `tests/fixtures/judge-goldens/__tests__/dataset-validation.test.ts` (新建 · 验证 schema · count · specialistId 合法 · ≥ 4 tests)
- `packages/schemas/src/judge-golden.schema.ts` (新建 · zod schema · GoldenSample · GoldenDataset)

**Acceptance Criteria**:
- AC-1 · `tests/fixtures/judge-goldens/sally-30.json` 存在 · valid JSON array · length=30 · 验证 `cat tests/fixtures/judge-goldens/sally-30.json | jq 'length'` → 30
- AC-2 · `tests/fixtures/judge-goldens/custom-70.json` 存在 · valid JSON array · length=70 · 验证 `cat tests/fixtures/judge-goldens/custom-70.json | jq 'length'` → 70
- AC-3 · 100 条 entry 全部符合 schema · zod safeParse 验证: `GoldenSample = z.object({id: z.string().regex(/^(sally|custom)-\d{3}$/), specialistId: z.enum([14个具体id]), mode: z.string().optional(), input: z.record(z.unknown()), expectedOutputPattern: z.record(z.unknown()).nullable(), criteria: z.array(z.string()).min(2), expectedKeyFields: z.array(z.string()).min(1), source: z.enum(['sally','custom']), tags: z.array(z.string()).optional()})` · `pnpm vitest run tests/fixtures/judge-goldens/__tests__/dataset-validation.test.ts` 全 pass
- AC-4 · 14 specialist 配额验证(custom-70.json) · CopywritingAgent ≥ 12 · BrandingAgent ≥ 10 · TopicAgent ≥ 8 · 其他按 D-266 表 · 验证: `cat custom-70.json | jq '[.[] | .specialistId] | group_by(.) | map({key: .[0], count: length})'` 命中所有 14 specialist · 总 70
- AC-5 · sally-30.json 来源真实 · 含 source='sally' 标记 · 每条 input 是真 sally 步骤 input(从 /tmp/aiipznt-clone-research 抓)· 验证: `cat sally-30.json | jq '.[] | select(.source != "sally")'` 命中 0
- AC-6 · packages/schemas/src/judge-golden.schema.ts 导出 GoldenSample + GoldenDataset · 含 z.infer<typeof GoldenSample> 类型导出 · packages/schemas barrel export 加 entry
- AC-7 · SCHEMA.md 含 GoldenSample TypeScript interface + 2 JSON example(1 sally + 1 custom) · ≥ 50 行
- AC-8 · `pnpm typecheck` 6 workspace 全 Done · 0 error
- AC-9 · `pnpm test tests/fixtures/judge-goldens/__tests__/dataset-validation.test.ts` ≥ 4 test all pass
- AC-10 · 新建 tests/fixtures/judge-goldens/__tests__/dataset-validation.test.ts · ≥ 4 tests · schema 验证 / count 验证 / specialistId 合法验证 / source 标记验证 · pnpm test 全 pass
- AC-COMMON · ROOT scope vitest 必跑(`pnpm test` 1925+118 baseline ±5)· 零回归

**测试要求**(medium 档):
- 单元 ≥ 8(dataset-validation + zod schema 各 ≥ 4)
- 集成 0
- E2E 0
- LLM Judge 0

---

### US-003 high · evaluation pipeline · prisma schema + eval-run.ts CLI + 4 维度评分(D-267 + D-268 字面锁)

**As** ops/admin · **I want** `pnpm --filter @quanan/api eval:run` CLI 命令跑 100 sample 真调 specialist · 写库 + 4 维度评分(结构 zod + 内容 LLM Judge + duration + cost)· **so that** evaluation_runs + evaluation_samples 表持久化每次跑批结果 · 为 admin UI + inter-rater + /goal-verify 提供数据基础。

**risk_level** · **high**(prisma migration · LLM 真调成本敏感 · 异步进度 + 写库 + 4 维度评分 + RLS DISABLE)

**size_hint** · medium(prisma migration + CLI script + 4 维度评分逻辑 · 估时 8-12h dev iter · 可能 2 round)

**files_to_create**:
- `prisma/migrations/[timestamp]_add_evaluation_tables/migration.sql` (新建 · 加 evaluation_runs + evaluation_samples · 索引)
- `prisma/schema.prisma` (修改 · 加 EvaluationRun + EvaluationSample model)
- `apps/api/src/scripts/eval-run.ts` (新建 · ~300 行 · CLI 入口 · 命令行参数解析 + 流程 7 步 + 进度日志 + 错误处理)
- `apps/api/src/scripts/__tests__/eval-run.test.ts` (新建 · ≥ 6 tests · CLI 参数解析 / dataset 加载 / 写库 / 4 维度评分 / 错误处理)
- `apps/api/src/lib/evaluation/evaluator.ts` (新建 · ~150 行 · runSampleEvaluation(sample): {structurePass, judgeScore, judgePass, durationMs, tokensUsed, costUsd})
- `apps/api/src/lib/evaluation/__tests__/evaluator.test.ts` (新建 · ≥ 4 tests)
- `apps/api/package.json` (改 scripts 加 `"eval:run": "tsx src/scripts/eval-run.ts"`)
- `package.json` (改 root scripts 加 `"eval:run": "pnpm --filter @quanan/api eval:run"` 方便顶层调用)

**Acceptance Criteria**:
- AC-1 · prisma/schema.prisma 加 EvaluationRun model · 字段严格按 D-267 · `model EvaluationRun { id Int @id @default(autoincrement()), runId String @unique @db.VarChar(36)(UUID), startedAt DateTime @default(now()), finishedAt DateTime?, totalSamples Int @default(0), passedSamples Int @default(0), failedSamples Int @default(0), skippedSamples Int @default(0), avgScore Decimal? @db.Decimal(3,2), modelTier String @default("lightweight"), model String, totalTokens Int @default(0), totalCostUsd Decimal @default(0) @db.Decimal(8,4), status String @default("running"), metadata Json?, samples EvaluationSample[] @@index([startedAt(sort: Desc)]) @@map("evaluation_runs") }` · 验证 `grep "model EvaluationRun" prisma/schema.prisma` 命中
- AC-2 · prisma/schema.prisma 加 EvaluationSample model · `model EvaluationSample { id Int @id @default(autoincrement()), runId String @db.VarChar(36), goldenId String @db.VarChar(20)(e.g., 'sally-001'/'custom-001'), specialistId String, mode String?, input Json, actualOutput Json, judgeScore Int @db.SmallInt(0-10), judgePass Boolean, judgeReason String @db.Text, structurePass Boolean, durationMs Int, tokensUsed Int, costUsd Decimal @db.Decimal(8,6), humanScore Int? @db.SmallInt, humanScoreBy Int?, humanScoredAt DateTime?, createdAt DateTime @default(now()), run EvaluationRun @relation(fields: [runId], references: [runId]) @@index([runId]) @@index([specialistId]) @@index([createdAt(sort: Desc)]) @@map("evaluation_samples") }` · 验证 grep 命中
- AC-3 · prisma migration 生成 + applied · `pnpm prisma migrate dev --name add_evaluation_tables` 成功 · `psql -d quanqn -c "\dt evaluation_*"` 命中 2 表
- AC-4 · evaluation_runs + evaluation_samples 表 **RLS DISABLE**(LD-A-1 区分主应用 RLS · admin/系统级表 RLS 关)· 验证 `psql -d quanqn -c "SELECT relrowsecurity FROM pg_class WHERE relname IN ('evaluation_runs','evaluation_samples')"` 全 false
- AC-5 · `pnpm --filter @quanan/api eval:run --samples=5` smoke 跑(取 5 sample 真调)· 无 KEY 时优雅 fail 提示 "ANTHROPIC_API_KEY required" exit 1 · 有 KEY 时跑通 · 写 1 row evaluation_runs(status='completed') + 5 row evaluation_samples · 验证: `psql -d quanqn -c "SELECT count(*) FROM evaluation_samples WHERE run_id = '<uuid>'"` = 5
- AC-6 · `pnpm --filter @quanan/api eval:run --specialist=PositioningAgent --samples=10` 取 10 PositioningAgent sample · 跑批 · 验证 evaluation_samples.specialist_id 全 'PositioningAgent'
- AC-7 · `pnpm --filter @quanan/api eval:run --source=sally` 仅跑 sally-30 dataset · 不跑 custom-70 · 验证 evaluation_samples.goldenId 全 'sally-*'
- AC-8 · 4 维度评分逻辑 · evaluator.ts runSampleEvaluation 返回 {structurePass, judgeScore, judgePass, durationMs, tokensUsed, costUsd} · structurePass=specialist.outputSchema.safeParse(actualOutput).success · judgeScore=runJudge() · judgePass=score≥6 · durationMs=execute end-start · tokensUsed=specialist result tokens · costUsd 按 modelTier 估算 · 验证 evaluator.test.ts ≥ 4 case
- AC-9 · eval-run.ts CLI 错误处理 · ANTHROPIC_API_KEY 缺失 → exit 1 + 提示 · LLM call 单 sample 失败 → 写 evaluation_samples judgePass=false structurePass=false + judgeReason='LLM call failed: <reason>' · 不阻塞整 run · 整 run 全失败 → status='failed'
- AC-10 · `pnpm typecheck` 6 workspace 全 Done · 0 error
- AC-11 · `pnpm lint --max-warnings=0` 0 warning
- AC-12 · ROOT scope `pnpm test` baseline 维持 1925+118(±10 · 加新 test 增加 passed count · skipped 不变)· 零回归
- AC-13 · eval-run.test.ts ≥ 6 tests · 单元覆盖 CLI 参数解析 / dataset 加载 / 写库流程 / 错误处理 · 全 pass
- AC-14 · evaluator.test.ts ≥ 4 tests · 单元覆盖 4 维度评分 / structurePass / judgeScore / cost 计算 · 全 pass
- AC-COMMON · ROOT scope vitest 必跑(M-2 PRD-27 US-005 教训)· prisma migration 必须先 apply 再跑 test(integration test 走真 DB)

**测试要求**(high 档 · PRD-MASTER §4.5-B):
- 单元 ≥ 12(eval-run.test.ts + evaluator.test.ts 各 6 + 4 · 加边缘 case 共 ≥ 12)
- 集成 ≥ 4(走真 PG + 真 LLM mock · 端到端跑批 + 写库验证)
- E2E ≥ 1(`pnpm eval:run --samples=2` smoke 必走通)
- LLM Judge 0(本 US 不跑 Judge · US-005 inter-rater 才跑 · 但 evaluator.ts 写好 runJudge 调用路径)

---

### US-004 medium · admin /admin/evaluation UI 评分历史 + 跨 specialist × 场景对比矩阵(D-269 字面锁)

**As** ops/admin · **I want** /admin/evaluation 页面看 evaluation runs 历史列表 + drill-down 单 run 详情 + 跨 specialist × 场景对比矩阵 · **so that** 直观查看 LLM Judge 评分质量 · 识别哪些 specialist 表现差 · 哪些 mode 不达标。

**risk_level** · medium

**size_hint** · medium

**files_to_create**:
- `apps/admin/src/pages/evaluation/EvaluationPage.tsx` (新建 · 评分历史列表 · ~200 行)
- `apps/admin/src/pages/evaluation/EvaluationDetailPage.tsx` (新建 · 单 run drill-down · 100 sample 详情 · score 分布柱状图 · ~250 行)
- `apps/admin/src/pages/evaluation/components/EvaluationMatrixChart.tsx` (新建 · 跨 specialist × mode 对比矩阵热力图 · ~150 行)
- `apps/admin/src/pages/evaluation/components/SampleDetailDrawer.tsx` (新建 · 单 sample 详情侧拉抽屉 · 显示 input/actualOutput/criteria/judgeScore/reason · ~120 行)
- `apps/admin/src/pages/evaluation/__tests__/EvaluationPage.test.tsx` (新建 · ≥ 5 tests)
- `apps/admin/src/pages/evaluation/__tests__/EvaluationDetailPage.test.tsx` (新建 · ≥ 4 tests)
- `apps/admin/src/router.tsx` (修改 · 加 3 个 lazy load route)
- `apps/admin/src/layouts/AdminLayout.tsx` (修改 · nav 加 evaluation entry)
- `apps/api/src/trpc/routers/admin/evaluation.ts` (新建 · admin.evaluation trpc router · listRuns / getRun / listSamples 3 procedures · ~150 行)
- `apps/api/src/trpc/routers/admin/__tests__/evaluation.test.ts` (新建 · ≥ 5 tests · 含 RBAC role=ops|admin 限制)
- `apps/api/src/trpc/routers/admin/index.ts` (修改 · 加 evaluation router 注册)
- `tests/e2e/admin/prd28-evaluation-baseline.spec.ts` (新建 · visual baseline + smoke test · 3 路由各 1)

**Acceptance Criteria**:
- AC-1 · `apps/admin/src/pages/evaluation/EvaluationPage.tsx` 存在 · 显示 evaluation_runs 列表(分页 · 每页 20)· 列: runId / startedAt / status / totalSamples / passedSamples / avgScore / totalCostUsd · 点 row 跳 /evaluation/:runId · 验证 routes 命中
- AC-2 · EvaluationDetailPage.tsx 单 run 详情 · 100 sample 列表(分页 · 每页 50)· 列: goldenId / specialistId / mode / structurePass / judgeScore / judgePass / durationMs · 点 row 弹 SampleDetailDrawer · 验证 routes 命中
- AC-3 · EvaluationMatrixChart.tsx 跨 specialist × mode 矩阵热力图 · X 轴 specialist 14 · Y 轴 mode(平均 4-5 mode)· cell 显示 avgScore (color: red < 4 / yellow 4-6 / green 6-8 / blue > 8)· 验证 chart 渲染
- AC-4 · admin trpc router `admin.evaluation.{listRuns, getRun, listSamples}` 3 procedures · listRuns({page,pageSize})→ {runs, total} · getRun({runId})→ run + summary · listSamples({runId, page, pageSize, filterSpecialist?})→ {samples, total} · 全部 require ctx.adminUser.role IN ['ops','admin'](LD-A-1 RBAC 闸 · 走 PRD-13 adminProtectedProcedure)· 验证 unit test
- AC-5 · admin layout nav 加 'Evaluation' entry · href='/evaluation' · icon='chart-bar' (lucide-react · 现有 icon)· role 限制(ops|admin 可见)· 验证 layout 渲染
- AC-6 · 3 路由 lazy load · React.lazy + webpackChunkName='admin-evaluation' · 跟 PRD-26 lazy load 模式一致 · 验证 chunk 拆分
- AC-7 · admin /admin/evaluation 页面用 packages/ui/admin 现有 Table / Card / Pagination 组件 · 不重写 base 组件(LD-A-1 admin/web 共享 ui 包)· 验证 import 路径
- AC-8 · visual baseline 3 张 · /admin/evaluation 列表 + /admin/evaluation/:runId 详情 + /admin/evaluation/:runId 矩阵 chart · tests/e2e/admin/prd28-evaluation-baseline.spec.ts 跑过 `pnpm test:visual:prd28` 生成 baseline
- AC-9 · package.json 加两条 scripts(继承 P-27-005 · visual baseline npm script 入口规范): `"test:visual:prd28": "playwright test --project=chromium tests/e2e/admin/prd28-evaluation-baseline.spec.ts --update-snapshots"` + `"test:visual:prd28:check": "playwright test --project=chromium tests/e2e/admin/prd28-evaluation-baseline.spec.ts"`
- AC-10 · admin /admin/evaluation 全部 role=ops/admin 可访问 · role=reviewer/finance/super_admin 走 PRD-13 RBAC 表(super_admin 通常也可访问)· 验证 e2e test 使用 ops/admin role auth
- AC-11 · `pnpm typecheck` 6 workspace 全 Done · 0 error
- AC-12 · `pnpm lint --max-warnings=0` 0 warning
- AC-13 · ROOT scope `pnpm test` baseline 维持(M-2 教训)
- AC-COMMON · ROOT scope vitest 必跑 · admin RLS DISABLE 验证(继承 PRD-13 LD-A-1)

**测试要求**(medium 档):
- 单元 ≥ 9(EvaluationPage 5 + EvaluationDetailPage 4)
- 集成 ≥ 2(admin trpc evaluation router 走真 PG)
- E2E ≥ 1(prd28-evaluation-baseline.spec.ts · admin smoke + visual)
- LLM Judge 0

---

### US-005 medium · inter-rater agreement subset(30 sample)· 用户 spot-check 评分 UI + Cohen's kappa(D-270 字面锁)

**As** ops/admin · **I want** /admin/evaluation/inter-rater/:runId 页面手工评 0-10 分 30 sample(从 evaluation_samples 按 runId hash seed 固定取 30)· 提交后自动计算 Cohen's kappa + Pearson correlation · **so that** 评估 LLM Judge 评分 vs 人工评分一致性 · 阈值 κ≥0.6(2026-06-20 对齐 KB eval-suite gate；原 PRD 0.4 为历史) · 通过 → LLM Judge 可信。

**risk_level** · medium

**size_hint** · medium

**files_to_create**:
- `apps/admin/src/pages/evaluation/InterRaterPage.tsx` (新建 · 30 sample 评分 UI · 单 sample 卡片显示 input/actualOutput/criteria + LLM judge score + 0-10 用户评分 slider · ~180 行)
- `apps/admin/src/pages/evaluation/__tests__/InterRaterPage.test.tsx` (新建 · ≥ 4 tests)
- `apps/api/src/lib/evaluation/inter-rater.ts` (新建 · Cohen's kappa + Pearson correlation 计算 · ~80 行 · 简单 inline 实现 · 不依赖 simple-statistics npm)
- `apps/api/src/lib/evaluation/__tests__/inter-rater.test.ts` (新建 · ≥ 4 tests · kappa = 0 / 0.5 / 1 / negative)
- `apps/api/src/trpc/routers/admin/evaluation.ts` (修改 · 加 listInterRaterSubset / submitHumanScore / computeAgreement 3 procedures)

**Acceptance Criteria**:
- AC-1 · InterRaterPage 显示 30 sample(seeded random by runId · 同一 runId 永远取同 30 · reproducible)· 每 sample 卡片含 input(JSON pretty)/ actualOutput(JSON pretty)/ criteria(列表)/ LLM judge score & reason / 0-10 评分 slider + 注释 textarea
- AC-2 · 用户评完单 sample · 点"提交" · trpc admin.evaluation.submitHumanScore({sampleId, humanScore: 0-10, humanComment?}) · 写 EvaluationSample.humanScore + humanScoreBy(当前 adminUserId)+ humanScoredAt · 验证 unit test
- AC-3 · 30 sample 全评完后 · 页面自动计算 Cohen's kappa(分类型 · LLM Judge score 0-5→fail 6-10→pass vs humanScore 同分类)+ Pearson correlation(连续型 0-10 vs 0-10)· 调 trpc admin.evaluation.computeAgreement({runId}) 返 {kappa, pearson, interpretation: 'almost-perfect' | 'substantial' | 'moderate' | 'fair' | 'slight' | 'poor'}
- AC-4 · inter-rater.ts Cohen's kappa 实现正确 · κ = (Po - Pe) / (1 - Pe) · Po 是 observed agreement 比例 · Pe 是 expected by chance · 单元测试覆盖: 全一致→κ=1 / 完全随机→κ=0 / 完全反向→κ=负 · 验证 inter-rater.test.ts ≥ 4 case
- AC-5 · 30 sample subset 选择算法 · seeded random by runId hash · 用 `Math.sin(seed) * 10000 % 1` 或 mulberry32 PRNG · 同 runId 永远取同 30 · 验证 listInterRaterSubset 调 2 次返同 30 sample ids
- AC-6 · admin /admin/evaluation/:runId 详情页加 "Inter-rater agreement" 子区域 · 显示 kappa + pearson + interpretation · 若未评完显示进度("12/30 评完") + 链接到 /admin/evaluation/inter-rater/:runId
- AC-7 · admin /admin/evaluation/inter-rater/:runId 路由加 + nav 不显示(只能 click-through from detail page)· 验证 routes 命中
- AC-8 · `pnpm typecheck` 6 workspace 全 Done · 0 error
- AC-9 · `pnpm lint --max-warnings=0` 0 warning
- AC-10 · ROOT scope `pnpm test` baseline 维持(M-2 教训)
- AC-11 · inter-rater.test.ts ≥ 4 case · kappa = 1 / kappa = 0.5(moderate)/ kappa ≈ 0(random)/ kappa < 0(negative agreement)全 verify expected
- AC-COMMON · ROOT scope vitest 必跑

**测试要求**(medium 档):
- 单元 ≥ 8(InterRaterPage 4 + inter-rater Cohen's kappa 4)
- 集成 ≥ 2(走真 PG + admin RBAC)
- E2E 0
- LLM Judge 0

---

### US-006 medium · /goal-verify §evaluation 集成 + verify-prd-28.sh + retro 收官(D-271 + D-272 字面锁)

**As** Coding 3.0 项目 · **I want** /goal-verify §evaluation 维度集成(Step 7 收官跑评估)+ verify-prd-28.sh 7 sections ≥ 25 checks 全 PASS + /prd-retro 跨 PRD-21~28 8 PRD 趋势 + AGENTS.md §11.19 沉淀 + tech-debt.json TD-027 真闭环关闭 · **so that** PRD-28 evaluation 完整化收官 · 移交 PRD-29 多用户压测。

**risk_level** · medium

**size_hint** · medium

**files_to_create**:
- `scripts/verify-prd-28.sh` (新建 · ~400 行 · 7 sections · ≥ 25 checks · chmod +x)
- `.agents/verification/prd-28-evaluation.md` (新建 · /goal-verify §0+§1+§evaluation 报告)
- `.agents/retros/prd-28-vs-prd-27-retrospective.md` (新建 · 跨 PRD-21~28 8 PRD 复盘 · §10 sections)
- `AGENTS.md` (修改 · 加 §11.19 PRD-28 evaluation 完整化沉淀)
- `.agents/tech-debt.json` (修改 · TD-027 重新关闭 · close_evidence 跟 PRD-25 假闭环区分 · 加 PRD-28 close_evidence)
- `~/.claude/commands/goal-verify.md` (修改 · 全局 · 加 §evaluation 维度规约)
- `scripts/ralph/progress.txt` (追加 · US-006 完成 + [PRD-28 retro] 摘要)

**Acceptance Criteria**:
- AC-1 · `scripts/verify-prd-28.sh` chmod +x · 7 sections · ≥ 25 checks:
  - §1 19 有效 judge file mock 拆除验证 *(21→19 · voice-chat + video-acquisition 已删)*(grep `vi.mock.*llm-gateway` tests/judge/ 命中 0)· ≥ 3 checks
  - §2 100 金标准 fixtures 文件 + count(sally-30.json count=30 · custom-70.json count=70 · SCHEMA.md 存在)· ≥ 4 checks
  - §3 prisma evaluation_runs + evaluation_samples 表存在(psql \dt)· RLS DISABLE 验证 · ≥ 3 checks
  - §4 eval-run.ts CLI 可加载(node -e "require('./apps/api/src/scripts/eval-run.ts')" smoke · 无 LLM 调)· ≥ 3 checks
  - §5 admin /admin/evaluation 3 路由 visual baseline 存在(playwright 跑 prd28-baseline check)· ≥ 4 checks
  - §6 inter-rater Cohen's kappa unit test passed · ≥ 4 checks
  - §7 /goal-verify §evaluation 集成 + retro · ≥ 4 checks
- AC-2 · `.agents/verification/prd-28-evaluation.md` ≥ 200 行 · §0 GSD codebase mapper 事实层对账 + §1+ Goal-backward 11 验收锚点全 PASS + §evaluation 维度报告
- AC-3 · `.agents/retros/prd-28-vs-prd-27-retrospective.md` ≥ 250 行 · 跨 PRD-21~28 8 PRD 趋势对比 · §2.A 双指标统计(audit 1iter / dev 1iter)· §5 Playbook ≥ 5 条新提炼 · §7 PRD-29+ 建议
- AC-4 · AGENTS.md 加 §11.19 PRD-28 evaluation 完整化沉淀 · ≥ 5 sub-sections(judge mock 真闭环 + 100 金标准双轨 + evaluation pipeline + admin evaluation UI + inter-rater Cohen's kappa)
- AC-5 · tech-debt.json TD-027 status='resolved' 加 PRD-28 close_evidence + 区分 PRD-25 假闭环(2026-05-20 PRD-25 US-008 只改 voice-chat.judge.ts 一个文件 · 模式升级但仍是 mock · 2026-05-22 PRD-28 真闭环 · 21 file 全部移除 mock · 真调 LLM grade)
- AC-6 · `~/.claude/commands/goal-verify.md` 修改 · 加 §evaluation 维度规约 · 集成 evaluation pipeline 检测逻辑
- AC-7 · `pnpm typecheck` 6 workspace 全 Done · 0 error
- AC-8 · `pnpm lint --max-warnings=0` 0 warning
- AC-9 · ROOT scope `pnpm test` 1925+118 baseline 维持(M-2 教训)
- AC-10 · `bash scripts/verify-prd-28.sh` ≥ 25 checks ALL PASS · 退出码 0
- AC-11 · progress.txt 追加 [PRD-28 retro] 摘要 · 含 audit 1iter rate + dev 1iter rate 双指标 + TD 净变化 + Playbook ≥ 5 条
- AC-COMMON · ROOT scope vitest 必跑

**测试要求**(medium 档 · 收官):
- 单元 0(收官 US · 文档驱动)
- 集成 0
- E2E 0
- LLM Judge 0(实测维度由 US-001~005 已 cover)

---

## §4 Functional Requirements

- **FR-1** · 19 有效 tests/judge/*.judge.ts 全部移除 `vi.mock('@/workers/llm-gateway')` *(21→19 · voice-chat + video-acquisition 已删 · 不改造)* · 走真 LLMGateway · grep 验证 0 命中
- **FR-2** · `describe.skipIf(!process.env.ANTHROPIC_API_KEY)` 必须存在每个 judge file · 无 KEY 优雅 skip · 有 KEY 真调
- **FR-3** · tests/setup.ts 加 dotenv config · 自动加载 .env · ANTHROPIC_API_KEY 可从 .env 注入
- **FR-4** · tests/fixtures/judge-goldens/sally-30.json + custom-70.json 总 100 条 · schema 严守 GoldenSample · 14 specialist 配额按 PRD-MASTER §4.4-B
- **FR-5** · prisma 新增 evaluation_runs + evaluation_samples 表 · RLS DISABLE · 索引按 D-267
- **FR-6** · `pnpm --filter @quanan/api eval:run` CLI 可跑 100 sample 真调 · 写库 + 4 维度评分(结构 zod + 内容 LLM Judge + duration + cost)
- **FR-7** · 4 维度评分阈值 · avgScore ≥ 6.0(LLM Judge) + passRate ≥ 70% + Cohen's kappa ≥ 0.6(inter-rater；κ≥0.6 2026-06-20 对齐 KB eval-suite gate；原 PRD 0.4 为历史)
- **FR-8** · admin /admin/evaluation 3 路由(/evaluation + /:runId + /inter-rater/:runId)RBAC role=ops/admin 限制
- **FR-9** · inter-rater 30 sample subset · seeded random by runId hash · reproducible · Cohen's kappa + Pearson 计算
- **FR-10** · /goal-verify §evaluation 维度集成 · 阈值不达标 WARN 不 FAIL(仅辅助维度)
- **FR-11** · verify-prd-28.sh ≥ 25 checks 全 PASS · 7 sections
- **FR-12** · tech-debt.json TD-027 真闭环关闭 · 区分 PRD-25 假闭环 + PRD-28 真闭环 · 两个 close_evidence

---

## §5 Non-Goals(超出范围 · D-266 字面锁)

- ❌ 风格一致性 cosine embedding 评分(留 PRR · 成本敏感)
- ❌ 回归保护 CI 自动跑批(留 PRD-29 多用户压测期一并接 CI)
- ❌ 进化有效性维度评分(EvolutionAgent 改 prompt 前/后对比 · 留 PRD-29+)
- ❌ prompt_versions 表 judgeScore 字段自动绑定(PRD-13 字段已有 · 写入留 PRD-29+)
- ❌ 正式 staging server 部署(本地 dev + 真 KEY 即"staging" · 远程部署留 PRR)
- ❌ 多用户压测 / 性能 baseline(留 PRD-29)
- ❌ 移动端响应式 polish(留 PRD-30)
- ❌ i18n / 海外版(留 PRD-31)
- ❌ OAuth + Streamdown AI 流式(留 PRD-32)
- ❌ 域名 / ICP / 法务 / 部署(留 PRR)
- ❌ 修改主应用任何 specialist 代码(本 PRD 仅 evaluation 基础设施 · 不动业务逻辑)
- ❌ 修改 PRD-26 admin polish 后的现有 admin pages(本 PRD 只加 evaluation 新 page)
- ❌ 改 LLMGateway 抽象层(已就位 · 不动)
- ❌ 改 judge-runner.ts 真调路径(已就位 · 不动)

---

## §6 Design Considerations

### §6.1 admin /admin/evaluation UI 视觉(D-269 锁)

- 走 packages/ui/admin 现有组件(Table / Card / Pagination / Tabs / Drawer)
- 矩阵热力图用 lucide-react SVG icon + Tailwind grid 实现(不引 chart 库 · 防 bundle bloat)
- 颜色方案 · red < 4 / yellow 4-6 / green 6-8 / blue > 8 · Tailwind utility(bg-red-300 / bg-yellow-300 / bg-green-300 / bg-blue-300)
- D1=A admin 视觉锁(继承 PRD-26)· 整体 layout 1:1 对齐 packages/ui/admin 现有 page · spacing scale / 字体 / motion 全切

### §6.2 inter-rater 评分 UI(D-270 锁)

- 单 sample 卡片 · 左侧 input/output JSON pretty(syntax highlight 用 prismjs 已就位 PRD-13)· 右侧 0-10 slider + 注释 textarea
- 30 sample 进度条 · "X/30 已评" · 完成后跳详情页 Cohen's kappa 报告
- 提交单 sample 自动跳下一个 · keyboard shortcut · ← / → 上一/下一 sample

### §6.3 evaluation matrix chart(US-004)

- X 轴 14 specialist · Y 轴 mode(平均 4-5 mode · 总 ~60 cell)
- cell 显示 avgScore 数字 + 背景色 · hover 显示 sample count + tooltip "click for drill-down"
- click cell 跳 SampleDetailDrawer · 显示该 specialist+mode 所有 sample 详情

---

## §7 Technical Considerations

### §7.1 已知约束

- **prisma schema RLS 区分** · 主应用 18 表 RLS 强制(LD-009)· admin 13 表 RLS DISABLE(LD-A-1)· evaluation 新加 2 表属于系统级 · **RLS DISABLE**(继承 admin 模式)
- **ANTHROPIC_API_KEY 注入** · 本地 dev .env 文件 · CI 用 secret 注入 · 不进 git · .env.example 文档化
- **LLM 调用成本** · 100 sample × ~500 token avg × claude-haiku-4-5 pricing = ~$0.5-1 / run · 可控
- **evaluation 跑批耗时** · 100 sample × 3-5s/sample = 5-8 min / run · 可异步后台跑

### §7.2 与现有系统集成点

- LLMGateway · 不改 · 复用 lightweight tier 真调
- judge-runner · 不改 · 复用 runJudge / PASS_SCORE_THRESHOLD
- prisma · 加 2 表 + 1 migration
- packages/schemas · 加 judge-golden.schema.ts · 不动其他
- admin trpc · 加 admin.evaluation router · 不动其他
- packages/ui/admin · 复用现有 Table/Card/Pagination · 不加新组件
- /goal-verify command · 加 §evaluation 段 · 不动 §0+§1+

### §7.3 Performance 要求

- admin /admin/evaluation 列表分页 20/页 · listRuns trpc procedure < 200ms(走 evaluation_runs index)
- admin /admin/evaluation/:runId 100 sample 分页 50/页 · listSamples < 300ms
- eval-run CLI 跑批 100 sample · 5-8 min(LLM latency 主导)
- inter-rater Cohen's kappa 计算 · 30 sample · < 50ms(纯 in-memory 算)

---

## §7.5 跨 Story 协议锁(Coding 3.0 新增 · story 数 ≥ 5 必填)

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `GoldenSample` | zod schema (packages/schemas/src/judge-golden.schema.ts) | US-002 | US-003, US-004 | 100 金标准 entry schema · {id, specialistId, mode?, input, expectedOutputPattern?, criteria[], expectedKeyFields[], source, tags?} |
| `GoldenDataset` | `GoldenSample[]` | US-002 | US-003 | 100 条数组 · sally-30 + custom-70 加载结果 |
| `EvaluationRun` | prisma model | US-003 | US-004, US-005, US-006 | runs 表 · 字段严格按 D-267 |
| `EvaluationSample` | prisma model | US-003 | US-004, US-005, US-006 | samples 表 · 含 humanScore/humanScoreBy/humanScoredAt 字段(US-005 写入)|
| `runJudge(case_)` | function | judge-runner.ts(已就位)| US-003 | 不动 · 复用 |
| `runSampleEvaluation(sample)` | function (apps/api/src/lib/evaluation/evaluator.ts) | US-003 | US-006 verify | 返 {structurePass, judgeScore, judgePass, durationMs, tokensUsed, costUsd} |
| `pnpm eval:run` | CLI script | US-003 | US-006 verify | `pnpm --filter @quanan/api eval:run [--specialist=<all\|id>] [--samples=<N>] [--source=<all\|sally\|custom>]` |
| `admin.evaluation.listRuns` | trpc procedure | US-004 | US-006 verify | 分页 · adminProtectedProcedure role=ops/admin |
| `admin.evaluation.getRun(runId)` | trpc procedure | US-004 | US-005 inter-rater | 单 run 详情 + summary aggregate |
| `admin.evaluation.listSamples({runId, page, pageSize, filterSpecialist?})` | trpc procedure | US-004 | US-005 | 分页 100 sample 列表 |
| `admin.evaluation.listInterRaterSubset(runId)` | trpc procedure | US-005 | US-006 verify | seeded random by runId hash · 取 30 sample |
| `admin.evaluation.submitHumanScore({sampleId, humanScore, humanComment?})` | trpc procedure | US-005 | — | 写 EvaluationSample.humanScore + humanScoreBy + humanScoredAt |
| `admin.evaluation.computeAgreement(runId)` | trpc procedure | US-005 | US-006 verify | 返 {kappa, pearson, interpretation} |
| `computeCohenKappa(llmScores, humanScores)` | function (apps/api/src/lib/evaluation/inter-rater.ts) | US-005 | US-006 verify | inline 实现 · κ = (Po - Pe) / (1 - Pe) |
| `INTER_RATER_THRESHOLD_KAPPA` | const | US-005 | US-006 verify | = 0.4 (moderate agreement) · /goal-verify 阈值 |
| `EVAL_AVG_SCORE_THRESHOLD` | const | US-003 | US-006 verify | = 6.0(score 6-10 → pass) |
| `EVAL_PASS_RATE_THRESHOLD` | const | US-003 | US-006 verify | = 0.7(70% passed) |

定义 story 的 priority 必须**小于**消费 story · US-001 → US-002 → US-003 → US-004/005 → US-006。

---

## §8 Success Metrics

- **19 有效 judge file mock 拆除率** *(21→19 · voice-chat + video-acquisition 已删)* · 100%(grep `vi.mock.*llm-gateway` in tests/judge/ 命中 0)
- **100 金标准 dataset 准备率** · 100%(30 sally + 70 custom = 100)
- **evaluation_runs / evaluation_samples 表存在率** · 100%(prisma db pull 命中)
- **eval-run.ts CLI 可跑率** · 100%(smoke 5 sample 写库验证)
- **admin /admin/evaluation 3 路由可加载率** · 100%(visual baseline + smoke test)
- **inter-rater Cohen's kappa 计算正确率** · 100%(unit test 4 case · kappa=1/0.5/0/negative)
- **TD-027 真闭环关闭率** · 100%(tech-debt.json status='resolved' 含 PRD-28 close_evidence)
- **verify-prd-28.sh 全 PASS 率** · 100%(≥ 25 checks · 退出码 0)
- **跨 PRD-21~28 8 PRD audit 1iter 趋势** · ≥ 100%(连续 6 PRD 100% audit 1iter)

---

## §9 PRD-28 → PRD-29+ Handoff(US-006 收官填写 · 2026-05-23+)

### §9.1 PRD-29 · 多用户压测 + 性能 baseline + evaluation CI 集成
- 100/1k 并发 · LLM Gateway 限流测试 · BullMQ 饱和
- DB 连接池 · Redis 容量
- Sentry + OTel 接入(用于压测期间监控)
- 性能 baseline · FCP / LCP / TTI 数据
- **evaluation CI 集成**(继承 PRD-28)· 夜跑 pnpm eval:run 100 sample · 写库 · 阈值 alert
- 回归保护维度 · 改 prompt 后跑 eval-run 对比 avgScore 不降

### §9.2 PRD-30 · 移动端响应式 polish
- apps/web 全 32 page 响应式 audit
- mobile touch interaction polish
- mobile 视觉 baseline(US-005 已修 mobile config · 全 mobile baseline 留 PRD-30)

### §9.3 PRD-31 · 海外版 / i18n
- 英文版切换框架
- 多供应商海外节点
- aiipznt 中文文案 → EN 翻译
- 14 specialist 多语言 prompt template

### §9.4 PRD-32 · OAuth + Streamdown AI 流式完整化
- OAuth 流程对齐 spec §XLIII
- Streamdown SSE 流式 vs 模拟切换

### §9.5 PRR · 法务 / 部署 prep
- 域名 quanan.com · ICP 备案 · 增值电信经营许可证
- Google OAuth / 微信 OAuth 应用申请
- Vercel / Railway / 阿里云 RDS 部署
- Sentry / OTel / Plausible 监控接入
- 隐私政策 / 用户协议
- 商标 / 版权
- 内容审核员招聘
- 客服 / 工单 / 支付集成
- 应急 / 灾备 SOP
- **evaluation 风格一致性 cosine embedding**(继承 PRD-28 留 PRR)
- **回归保护 + 进化有效性维度**(继承 PRD-28 留 PRR)

### §9.6 路线图总览

| PRD | 主题 | 优先级 | 估时 | 关键意义 |
|:-:|---|:-:|:-:|:-:|
| **PRD-28** | **evaluation 完整化** | **P1** | 2 day | **TD-027 真闭环 + 质量门禁** |
| PRD-29 | 多用户压测 + evaluation CI | P2 | 1.5 day | 容量规划 + CI |
| PRD-30 | 移动端 polish | P2 | 1 day | 移动覆盖 |
| PRD-31 | 海外版 / i18n | P3 | 2 day | 国际化 |
| PRD-32 | OAuth + AI 流式 | P3 | 1.5 day | 体验 |
| PRR | 法务 + 部署 + evaluation 全维度 | P3 | 等 | 上线 |

---

## §10 Locked Decisions

- **D-265**: TD-027 真闭环锁 · 21 judge file vi.mock 全部移除 + describe.skipIf + 真调路径
- **D-266**: 100 金标准 dataset 双轨锁 · sally-30.json + custom-70.json + 14 specialist 配额按 PRD-MASTER §4.4-B
- **D-267**: evaluation_runs + evaluation_samples 表 schema 锁 · RLS DISABLE · 索引完整
- **D-268**: eval-run.ts CLI 跑批锁 · `pnpm --filter @quanan/api eval:run` 命令 · 7 步流程
- **D-269**: admin /admin/evaluation UI 路由锁 · 3 路由 + admin trpc 3 procedures + RBAC role=ops/admin
- **D-270**: inter-rater agreement subset 锁(30 sample seeded by runId hash · Cohen's kappa + Pearson 计算)
- **D-271**: /goal-verify §evaluation 集成锁 · 阈值不达标 WARN 不 FAIL · 仅辅助维度
- **D-272**: PRD-28 收官达 TD-027 真闭环 + 100 金标准就位 + admin /admin/evaluation UI MVP 验证锁 · verify-prd-28.sh 7 sections ≥ 25 checks

---

## §11 跨 PRD 协议锁(继承 PRD-1~27)

| 命名 | 来源 | 本 PRD 引用 |
|---|---|---|
| LLMGateway lightweight tier | PRD-2 LD-012 | US-003 evaluator.ts 复用 |
| LD-009 双层防护(RLS + explicit accountId) | PRD-3 | US-003 evaluation 表 RLS DISABLE 区分 |
| LD-A-1 admin/web 严格隔离 | ADR-019 | US-004 admin trpc + UI |
| LD-A-3 audit 表 append-only | LD-A-3 | evaluation_runs/samples 是系统级 · 非 audit · 可 UPDATE/DELETE |
| BaseSpecialist 模板方法 | PRD-4 §11.6.1 | US-003 specialist.execute 真调 |
| ModelTier 跨文件同步 | PRD-27 §11.18.3 | US-003 evaluator.ts modelTier='lightweight' 一致 |
| BullMQ 异步任务状态机 | PRD-27 §11.18.1 | 不引(本 PRD CLI 同步跑 · 不用 BullMQ) |
| visual baseline npm script 入口规范 | PRD-27 §11.18.4 | US-004 加 test:visual:prd28 + :check |
| LLM 接入收官 7-section verify 模式 | PRD-27 §11.18.2 | US-006 verify-prd-28.sh 沿用 |
| M-Y 双指标统计(audit 1iter vs dev 1iter)| PRD-27 §11.18.2 | US-006 retro 沿用 |

---

## §12 retro(待 US-006 收官填写)

(待填 · 由 /prd-retro 跨 PRD-21~28 8 PRD 复盘时产出)

---

> **本文件由 Claude(Opus 4.7)在 PRD-28 启动前写 · 2026-05-22 · 基于 PRD-27 retro §3.2 TD-027 handoff + PRD-MASTER §4.4 100 金标准规范 + tech-debt.json TD-027 真实状态(21/21 file 仍 mock)**
