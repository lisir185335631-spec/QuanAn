# PRD-25 · LLM 真接入 · 10 page stub → 真 LLM useMutation 替换 + TD-090/091 重审 + TD-095 Validator dev server 配套

> **状态** · 待启动(2026-05-20 PRD-24 ship 后立即接续)
> **branch** · `ralph/prd-25-llm-integration`(待 daemon 启动时建)
> **依赖** · PRD-24 已 merge main(commit `495b78e Merge: PRD-24`)
> **范围分档** · 9 US(7 dev high/medium · 1 medium TD/Validator · 1 medium 收官)
> **预期 daemon** · 8-12h · Opus audit cycle 1-2h/US × 8 dev US ≈ 12-20h wall time · ≈ 1-1.5 天

---

## §0 引用清单 + 元数据 + 复刻定调

### §0.1 上游文档(8 份核心)

| # | 文档 | 用途 | 重点章节 |
|:-:|---|---|---|
| 1 | [aiipznt-spec.md](../aiipznt-spec.md) | 9192 行复刻基线 + LLM Gateway 设计 | §6.5 LLM Gateway · §7 14 Specialist · §8.4.2 /voice-chat streaming · §8.5.2 /daily-tasks · §8.5.3 /evolution · §X /diagnosis · §X /step/8 直播 |
| 2 | [tasks/prd-24.md](prd-24.md) | PRD-24 收官 · 1:1 视觉复刻达成 + LLM 接入 handoff | §6 PRD-25+ Handoff(/voice-chat streaming + /daily-tasks AI + /evolution AI · 7 PRD-23 完整化 page 真 LLM) |
| 3 | [.agents/retros/prd-24-vs-prd-23-retrospective.md](../.agents/retros/prd-24-vs-prd-23-retrospective.md) | PRD-21~24 4 PRD 复盘 + 32 baseline 收官 + 100% × 2 连续严格通过率 | §2.2 LLM 接入 handoff · §2.3 留 PRD-25+ TD |
| 4 | [.agents/verification/prd-22-visual-diff-vs-aiipznt.md](../.agents/verification/prd-22-visual-diff-vs-aiipznt.md) | Step D 量化数据 · QuanAn vs aiipznt 实拍 -30~-83% diff(根因 LLM 内容空) | TD-090/091 LLM 后重审决策依据 |
| 5 | [AGENTS.md](../AGENTS.md) | 18 LD + 17 R 红线 + §11 PRD 沉淀 · §11.7 真 LLM 接入沉淀(PRD-20)+ §11.6 后端 Specialist 沉淀(PRD-4)| §11.7.1 ENV validation + LLM client init · §11.6 BaseSpecialist 模板方法 · §11.6.4 SSE Specialist 模式 + stream meta chunk |
| 6 | [.agents/tech-debt.json](../.agents/tech-debt.json) | TD-090/091 deferred + TD-083/085 网络故障历史 · TD-027 LLM Judge tests project-wide mock 失效 | TD-090(baseline 命名 aiipznt 实拍编号 · 接 LLM 后重审)· TD-091(单列 vs 双栏 · 接 LLM 后重审)· TD-027(evaluation 失效) |
| 7 | `~/.claude/playbooks/prd-template-unit-test-sync.md` | 全局反哺 · D-233 unit test 同步机制化(继承 PRD-23/24 100% 严格一轮通过率证据) | useMutation hook 替换 stub 后 · 同步更新 `__tests__/*.test.tsx` 期望 |
| 8 | `~/.claude/playbooks/reject-examples.jsonl` | 跨 PRD 反例库 · 50+ 条(seed 35 + PRD-21~24 累积) · LLM 接入相关 · `R-001 不暴露 API_KEY` / `LLMGateway 用 model_tier 不硬编码` / `SSE streaming` / `network error retry 不消耗 retryCount` | anti_patterns 注入(每 high US ≤ 3 条 · medium 2 条) |

### §0.2 元数据

| 项 | 值 |
|---|---|
| **branchName** | `ralph/prd-25-llm-integration` |
| **Locked Decisions** | D-242 起延续(PRD-24 收尾在 D-241 · 总 10 D · D-242~D-251) |
| **风险分档** | **high × 4**(US-001 /diagnosis 7 维度 LLM 启用 + DiagnosisAgent invokeLLM 完整实施 · US-002 /voice-chat streaming subscription · US-003 /daily-tasks AI 任务 + BullMQ worker chain · US-004 /evolution AI 洞察生成 + evolve mutation) + **medium × 3**(US-005 /video-analysis + /analysis · US-006 /video-production + /acquisition-video · US-007 /step/8 + /accounts smartRecommend) + **medium × 2**(US-008 TD-090/091 重审 + TD-095 创建并修复 + AGENTS.md §11.16 沉淀 · US-009 收官) |
| **anti_patterns 注入** | 4 high US 必须从 reject-examples.jsonl 检索 ≤ 3 条 · 关键词:`'API_KEY 暴露'` / `'LLMGateway model_tier'` / `'BaseSpecialist 子类 invokeLLM'` / `'SSE streaming subscription'` / `'network error retry'` / `'LLM Judge mock 失效'` / `'cost_log 双写'` / `'isFallback 处理'` / `'tRPC useMutation onSuccess'` / `'unit test 同步'` |
| **依赖前置 PRD** | PRD-1~24 全部已 ship · 严格保留不动 · 重点:PRD-2 LLM Gateway · PRD-4 13 Specialist 骨架 · PRD-5/6/7/8 router 接 specialist · PRD-20 真 LLM 沉淀 §11.7 · PRD-22~24 visual baseline + stub 完整化 pattern |
| **下游 PRD** | PRD-26+ · admin 子系统启动 + 多用户压测 · evaluation 完整化(LLM Judge mock 失效 TD-027 解决)· 海外版 / 移动端 · PRR(production readiness review) |
| **失败回滚** | `git branch backup/before-prd-25 main` 待建(daemon 启动前) |
| **dev server 配套** | TD-095 新建 · daemon 启动时 fork pnpm dev 子进程 · Validator 浏览器自动化前 curl localhost:3000 健康检查 · 失败自动重试 ≤ 30s · 详 §3 US-008 |
| **DiagnosisAgent 状态** | apps/api/src/specialists/DiagnosisAgent.ts 87 行骨架(invokeLLM 已基础写到 llmGateway.complete) · diagnosis router L46-67 P1 mock 直接写 DiagnosisReport · PRD-25 US-001 启用真调 |
| **smart-recommend 状态** | ipAccounts router 无 smartRecommend procedure · PRD-25 US-007 新增 · 用 PositioningAgent / BrandingAgent 根据 industry → 推荐 platform / followersRange / ipPositioning |

### §0.3 复刻定调(D1=A + D4=B 严锁 · 继承 PRD-21~24 · 新增 D-242 LLM-A)

| 维度 | 切 / 不切 |
|---|:-:|
| 整体页面布局(layout / 区块顺序 / 区块尺寸 / 容器宽度 / padding 方向) | ✅ **切 1:1 对齐 aiipznt**(继承 PRD-21~24) |
| spacing scale / 字体 / motion / hover effect / glass-card / inline picker / DiagnosisStepCard pattern | ✅ 切(继承 PRD-22/23/24 utility) |
| **文字内容(title / 副标 / H1 / H2 / H3 / p / button 文字 / 自我介绍 / quick prompts / placeholder)** | ✅ **严格 1:1**(D1A 字面锁 · 继承 D-220/226/237/238/239) |
| **常量数据 1:1**(5 级进化字面 / 4 进化方向 / 4 指标 / 5 H3 模块 / 6 quick prompts / 3-5 stub 任务) | ✅ **严格 1:1**(constants 字面锁 · 继承 PRD-22~24) |
| 颜色 token / D4=B | ❌ **D4=B 锁 · 保留当前 HSL 43° 金色 token 不变**(继承) |
| **LLM 调用(D1=LLM-A · 本 PRD 新解锁 D-225/D-234)** | ✅ **接真 LLM** · 10 page stub → trpc useMutation 替换 · DiagnosisAgent 真启用 · /voice-chat streaming · /daily-tasks BullMQ worker 触达 · /evolution AI 洞察 + evolve trigger |
| **streaming(SSE)优先** | ✅ /voice-chat 用 subscription · delta chunks 实时渲染 · 其他 page 用 mutation(非 streaming · 1 次性 response) |
| **错误处理统一**(network error + LLM timeout + isFallback) | ✅ tRPC onError → toast.error 提示重试 · isFallback=true 时显示 fallback marker(灰色 hint 告知用户) · ECONNRESET 自动指数退避 retry(继承 PRD-5 TD-009 fix) |
| visual baseline 重审(TD-090/091) | 🟡 **US-008 数据驱动决策** · 跑 prd25-vs-aiipznt-diff 12-page LLM 后 diff · 决策切 aiipznt 实拍编号(选项 A · 严守 1:1)或保持 internal regression(选项 B · 接受 LLM stub data 差异) · 不预判 |

**D1=LLM-A 反例锁** · 防 ralph 字面解读"LLM 接入"为"直接 import OpenAI SDK 调用":
- ❌ NEVER `import OpenAI from 'openai'` in frontend
- ❌ NEVER `apiKey` in `apps/web/` · 仅 worker 层(R-001 红线)
- ✅ frontend 100% 通过 `trpc.{router}.{procedure}.useMutation()` / `useQuery()` / `useSubscription()` 调用
- ✅ backend specialist 通过 `this.llmGateway.complete()` / `.completeStream()` · 不直接 import SDK(继承 §11.7 沉淀)

**evaluation hooks 要求**:
- 每 LLM 接入 US 必须含 1-2 个 vitest LLM Judge test case(`vitest.judge.config.ts` 独立) · model_tier='lightweight'
- TD-027(project-wide mock llmGateway 导致 LLM Judge 失效)在 PRD-25 顺手关闭 · vitest.judge.config.ts setupFiles 排除 global mock

### §0.4 D-242 ~ D-251 Locked Decisions(本 PRD 新建)

| ID | 决策 | Why |
|---|---|---|
| **D-242** | **D-225/D-234 解锁** · 本 PRD 起接真 LLM · 10 page stub → trpc useMutation 替换 · DiagnosisAgent 真启用 · 错误处理统一(isFallback 灰色 hint + ECONNRESET 指数退避) | PRD-22/23/24 D-225/D-234"不接 LLM"决策延续到 PRD-25 解锁 · spec §6.5 LLM Gateway 完整设计早建 · PRD-2/4/5/6/7/8 后端 router 全部已接 specialist · 缺前端 wire up |
| **D-243** | **/diagnosis 7 维度评分 prompt 锁** · DiagnosisAgent invokeLLM 完整 system prompt · 输入 8 答案(dimension/score 0-10/comment)→ 输出 7 维度 dimensionResultSchema(score 0-10 + issues array + suggestions array) + overallScore 0-100 + priority array · model_tier='reasoning' timeout_ms=60_000 retry=1 | spec §X /diagnosis 7 维度 + DiagnosisAgent.ts L41-53 config 已锁(reasoning + 60s + retry=1) · invokeLLM L66-86 骨架待完整实施 |
| **D-244** | **/voice-chat subscription protocol 锁** · trpc.voiceChat.start subscription · yield chunks 类型:`{type:'meta', meta:{model}}` / `{type:'delta', text}` / `{type:'tool_call', name, args}` / `{type:'tool_result', name, result}` / `{type:'done', tokensUsed, durationMs}` · 前端累积 delta → 实时渲染 message bubble · meta chunk 首发(D-019 闭环 · §11.6.4 SSE Specialist 沉淀) | spec §8.4.2 + apps/api/src/trpc/routers/voiceChat.ts L23-52 已建 · 前端 wire up 是 PRD-25 范围 |
| **D-245** | **/daily-tasks BullMQ regenerateToday 触达** · 前端"重新生成" button → trpc.dailyTasks.regenerateToday.useMutation → BullMQ daily-task job · 异步 · worker 处理 → DailyTaskAgent.execute → upsert DailyTask 表 · 前端轮询 trpc.dailyTasks.getToday.useQuery 看新数据(staleTime 5s · refetchInterval 触发后 8s 内) | spec §8.5.2 · dailyTasks router L80-106 regenerateToday 已建 · 前端 wire up + 轮询策略是 PRD-25 范围 |
| **D-246** | **/evolution 真 evolve mutation 触达** · 触发进化 button → trpc.evolution.evolve.useMutation({rating:'good', agentId:'EvolutionAgent', rateableType:'manual_trigger', rateableId:0}) · 异步触发 evolution worker · 前端轮询 getProfile / getInsightHistory 看 latestInsight 更新 · profile.level / feedbackCountGood 实时反映 | spec §8.5.3 · evolution router L101-130 evolve 已建(P1 mock 异步 enqueueIfThresholdMet)· 前端 stubLevel='L2' → profile.level wire up |
| **D-247** | **4 内容创作工具 LLM 输出渲染** · /video-analysis(AnalysisAgent mode='viral' · 5 H3 结构拆解/节奏/爆款/评分/建议)· /analysis(AnalysisAgent mode='structural' · 5 H3 同名复用)· /video-production(VideoAgent mode='production' · 4 H3 分镜脚本/拍摄方案/口播提词器/剪辑指导)· /acquisition-video(VideoAgent mode='acquisition' · 3 方案 × 4 H4)· 全部 trpc.{router}.{action}.useMutation · isFallback=true 时显示灰色 fallback marker · history 写入 with agentMode | 4 router L46-80 全部已接 specialist · 前端 setSubmitted(true) → useMutation wire up |
| **D-248** | **/step/8 LivestreamAgent sub_function 锁** · Step8GeneratePlan → trpc.stepData.save({stepKey:'step8', sub_function:'generate_plan'}) → 6 模块(opening/warmup/product/conversion/faq/closing) · Step8OptimizeScript → ({sub_function:'optimize_script'}) → 2 InfoCard(optimized_text + optimization_notes) · stepData router L269-280 已建分支 | apps/api/src/trpc/routers/stepData.ts L269-280 stepKey='step8' branch 已建 · 前端 Step8GeneratePlan + Step8OptimizeScript 子组件 wire up |
| **D-249** | **/accounts smartRecommend procedure 新增** · trpc.ipAccounts.smartRecommend({industry:string}) → 用 PositioningAgent · execute · 输入 industry → 输出 {platform, followersRange, ipPositioning, rationale string} 推荐 · 前端"智能推荐"button(在 CreateAccountModal 内)point click 调用 · 自动填充 industry 后字段 | ipAccounts router 0 smart-recommend procedure · 需新建 + PositioningAgent 已有 execute method · 接入低风险 |
| **D-250** | **TD-095 创建 + dev server 配套 SOP** · ralph.py daemon 启动时新增 `--with-dev-server` flag(默认开启)· 启动时 fork `pnpm dev` 子进程(detached · 写 dev-server.pid · output redirect dev-server.log) · daemon 退出时 SIGTERM dev server · Validator(VALIDATOR.md)在调浏览器 / e2e 测试前必须 curl http://localhost:3000 健康检查 · 失败时 sleep 5s retry ≤ 6 次 · 都失败抛 SUSPECTED:dev_server_unavailable · 完整 SOP 写入 ~/.claude/scripts/ralph/CLAUDE.md + scripts/ralph/CLAUDE.md(项目副本) | TD-083(integration tests fetch localhost:3000 ECONNREFUSED · no dev server skip)历史 · PRD-22 RCA 类似 · 一次性根除 · TD-095 完整生命周期管理 |
| **D-251** | **PRD-25 收官 verify-prd-25.sh ALL CHECKS PASSED + AGENTS.md §11.16** · 含 PRD-25 内 ≥ 35 checks · 10 page LLM 接入验证 · DiagnosisAgent 真启用验证 · smartRecommend procedure 存在验证 · dev server SOP 写入文档验证 · 全 vitest tests pass(含 LLM Judge test case 14+/14+ pass · TD-027 解决) | 历史可追溯 · PRR 准备就绪 |

---

## §1 介绍/概述

PRD-21~24 累计 ship main(commit `495b78e Merge: PRD-24`)· 严格一轮通过率 PRD-22 82% → PRD-23 100% → PRD-24 100% · 连续 2 PRD 100% · 32 page 全 visual baseline · 1:1 视觉复刻达成里程碑。

**Step D 量化数据**(.agents/verification/prd-22-visual-diff-vs-aiipznt.md)显示 · QuanAn vs aiipznt 实拍 -30~-83% diff · 根因明确:**LLM 内容空** · aiipznt 实拍含登录态 + LLM 已生成数据 · QuanAn 当前 10 page 是 stub 骨架(本地 state + setTimeout / setSubmitted)。

**事实层验证**(本 PRD 起草时跑):
- ✅ 后端 13 Specialist 全建(apps/api/src/specialists/* · BaseSpecialist + 12 实例 · DiagnosisAgent 87 行骨架待完整实施)
- ✅ 后端 LLM Gateway 全建(apps/api/src/workers/llm-gateway/* · anthropic-provider + openai-provider + cost-logger + rate-limiter)
- ✅ 后端 router 大部分已接 specialist:
  - /analysis(AnalysisAgent mode='structural') ✅
  - /video-analysis(AnalysisAgent mode='viral') ✅
  - /video-production(VideoAgent mode='production') ✅
  - /acquisition-video(VideoAgent mode='acquisition') ✅
  - /step8(stepData.save sub_function='generate_plan'/'optimize_script') ✅ via LivestreamAgent
  - /voice-chat(voiceChatAgent.executeStream subscription) ✅
  - /daily-tasks(dailyTaskQueue worker → DailyTaskAgent) ✅
  - /evolution(getProfile + evolve via enqueueIfThresholdMet) ✅
  - /diagnosis(❌ P1 mock · diagnosisAgent 骨架待启用)
  - /accounts(✅ list 接 trpc · ❌ smartRecommend 待新增)
- ❌ 前端 10 page 全部 stub:DailyTasks `setTimeout(800)` + Evolution `stubLevel='L2'` + VoiceChat `answer='功能 PRD-25+ 接 LLM'` + Diagnosis `stubScore(hash)` + 4 工具 `setSubmitted(true)` + Step8GeneratePlan/Step8OptimizeScript stub + Accounts 无 smart-recommend button

PRD-25 完成 **10 page 前端 stub → 真 LLM useMutation 替换 + DiagnosisAgent 真启用 + smartRecommend procedure 新增 + TD-090/091 数据驱动重审 + TD-095 dev server 配套创建并修复**:

### 1.1 4 high US LLM 接入(核心)

| Page | 当前 stub | PRD-25 目标 |
|---|---|---|
| /diagnosis | `stubScore(dimensionId)` hash-based 60-95 | DiagnosisAgent.invokeLLM 完整实施 · diagnosis router 启用真调 · 前端 trpc.diagnosis.generate.useMutation · 7 维度真评分 + issues + suggestions + priority |
| /voice-chat | `answer='功能 PRD-25+ 接 LLM'` | trpc.voiceChat.start subscription wire up · delta chunks 实时渲染 · tool_call/tool_result chunk 显示 · 错误处理 + isFallback + retry button |
| /daily-tasks | `setTimeout(800)` + DAILY_TASKS_STUB | trpc.dailyTasks.getToday.useQuery + regenerateToday.useMutation + markCompleted.useMutation · BullMQ 触达 · 轮询新数据 |
| /evolution | `stubLevel='L2'` + EVOLUTION_METRICS_STUB | trpc.evolution.getProfile.useQuery wire up · evolve mutation 触发 · getInsightHistory 显示 latestInsight |

### 1.2 3 medium US LLM 接入(工具 page + step/8 + 智能推荐)

| Page | 当前 stub | PRD-25 目标 |
|---|---|---|
| /video-analysis | `setSubmitted(true)` | trpc.videoAnalysis.analyze.useMutation · 渲染 viral output 5 H3 块 |
| /analysis | `setSubmitted(true)` | trpc.analysis.analyze.useMutation · 渲染 structural output 5 H3 块 |
| /video-production | `setSubmitted(true)` | trpc.videoProduction.generate.useMutation · 渲染 production output 4 H3 块 |
| /acquisition-video | `setSubmitted(true)` | trpc.acquisitionVideo.generate.useMutation · 渲染 acquisition output 3 方案 × 4 H4 |
| /step/8 | Step8GeneratePlan/Step8OptimizeScript stub | trpc.stepData.save({stepKey:'step8', sub_function}) · 6 模块 / 2 InfoCard 渲染 |
| /accounts | 无 smartRecommend button | ipAccounts.smartRecommend procedure 新增(PositioningAgent) · CreateAccountModal 加"智能推荐"button → 自动填字段 |

### 1.3 1 medium US TD 处理 + Validator 配套(US-008)

- **TD-090 重审** · LLM 接入后跑 prd25-vs-aiipznt-diff.spec.ts 12 page 实际 pixel diff · 数据驱动决策:切 aiipznt 实拍编号 baseline(选项 A)或保持 internal regression(选项 B) · 不预判
- **TD-091 重审** · 单列 vs 双栏 layout 决策(同上)
- **TD-095 创建** · Validator dev server 配套 SOP · daemon 启动时 fork pnpm dev · Validator curl 健康检查 · 完整文档化
- **TD-027 顺手关闭** · vitest.judge.config.ts setupFiles 排除 global mock(LLM Judge 真调 lightweight)
- **AGENTS.md §11.16 沉淀** · PRD-25 LLM 接入沉淀 · DiagnosisAgent 启用 · smartRecommend pattern · dev server SOP

### 1.4 1 medium US 收官(US-009)

verify-prd-25.sh ALL CHECKS PASSED + /goal-verify §0 codebase 同步 + /prd-retro 跨 PRD-21~25 5 PRD 复盘 + AGENTS.md §11.16 PRD-25 沉淀 + handoff PRD-26+(admin 子系统 + 多用户压测 + evaluation 完整化 + PRR)。

完成后 · **10 page 全 LLM 真接入 + DiagnosisAgent 真启用 + smartRecommend 新增 + TD-090/091/095 关闭 + TD-027 关闭** · PRD-21~24 视觉对齐 → PRD-25 LLM 接入完整闭环 · 准备 PRR + PRD-26+(admin 启动 / evaluation / 多用户压测 / 移动端)。

---

## §2 目标

- ✅ /diagnosis 接 DiagnosisAgent 真 LLM 7 维度评分(后端启用 + 前端 wire up + isFallback 处理) · 跟 spec /diagnosis 1:1
- ✅ /voice-chat 接 voiceChatAgent.executeStream subscription wire up · streaming delta chunks 实时渲染 · tool_call/tool_result/meta chunk 处理(D-244 锁) · 跟 spec §8.4.2 1:1
- ✅ /daily-tasks 接 trpc.dailyTasks 全套(getToday + regenerateToday + markCompleted · BullMQ 触达 + 轮询)· 跟 spec §8.5.2 1:1
- ✅ /evolution 接 trpc.evolution 全套(getProfile + evolve + getInsightHistory · profile.level 替换 stubLevel · 4 指标真数据)· 跟 spec §8.5.3 1:1
- ✅ 4 内容创作工具(/video-analysis · /analysis · /video-production · /acquisition-video)全部 useMutation 替换 setSubmitted(true) · isFallback 灰色 marker · history 写入
- ✅ /step/8 Step8GeneratePlan + Step8OptimizeScript wire up trpc.stepData.save(sub_function) · 6 模块 / 2 InfoCard
- ✅ /accounts ipAccounts.smartRecommend procedure 新增(PositioningAgent) · CreateAccountModal "智能推荐"button
- ✅ TD-090/091 数据驱动重审决策(prd25-vs-aiipznt-diff 12-page · pixel diff 数据 + 决策报告写入 .agents/verification/prd-25-vs-aiipznt-llm.md)
- ✅ TD-095 Validator dev server 配套 SOP 创建并修复(ralph.py --with-dev-server flag + Validator 健康检查 + 完整文档化 ~/.claude/scripts/ralph/CLAUDE.md + 项目副本 + AGENTS.md §11.16)
- ✅ TD-027 vitest.judge.config.ts setupFiles 排除 global mock · LLM Judge 14+/14+ pass(真调 lightweight)
- ✅ verify-prd-25.sh ALL CHECKS PASSED(≥ 35 checks) · /goal-verify + /prd-retro 跨 5 PRD 复盘 · AGENTS.md §11.16 沉淀
- ✅ 9 US 全 audit approved(Opus 4 维度 + risk_level 分档) · D-233 unit test 同步严守(继承 PRD-23/24) · 反例库注入 4 high US

---

## §3 User Stories(9)

### US-001 high · /diagnosis 接 DiagnosisAgent 真 LLM 7 维度评分(后端启用 + 前端 wire up · D-243 字面锁严守)

**风险分档** · 🔴 **high**(DiagnosisAgent invokeLLM 完整实施 · diagnosis router 改 P1 mock → 真调 · 前端 stubScore → useMutation · isFallback 处理 · 涉及前后端 + Specialist + Schema 多个 layer)

**Story 大小** · medium(单次 ralph 迭代可完成 · 6-8 文件创建/修改 · ~280 LOC 新增 + ~40 LOC 删除 stubScore)

**downstream count** · 0(US-001~007 独立) · risk_level=high

**前置依赖** · DiagnosisAgent.ts L66-86 骨架(invokeLLM 已基础写到 llmGateway.complete · 但 system prompt + parsing 待完整实施) · diagnosis router L46-67 P1 mock(answers → 写 mock DiagnosisReport) · /diagnosis page 已建(`apps/web/src/pages/modules/Diagnosis.tsx` · stubScore hash-based)

**用户故事** ·
作为 QuanAn 用户 · 当我在 /diagnosis 完成 8 步问卷 · 点击"生成诊断报告" button · 我看到 loading 状态(Loader2 spinner + "AI 分析中...") · 8s 内显示 LLM 真生成的 7 维度报告(每个维度 score 0-10 + issues 列表 + suggestions 列表) + 整体评分 overallScore 0-100 + 优先级 priority 列表(spec /diagnosis 7 维度匹配)。如果 LLM 错误(timeout / fallback) · 显示灰色 fallback marker "AI 暂未生成深度分析 · 显示规则评分(可点击重试)" + retry button · 不阻塞流程。

**验收标准** ·

- **AC-1** · DiagnosisAgent.ts invokeLLM 完整实施 · system prompt 中文专业 IP 顾问 prompt 至少 800 字符 · 含 7 维度定义(参考 DIAGNOSIS_DIMENSIONS_8 排除 1 项作为"综合")· user prompt 含 8 答案 JSON · model_tier='reasoning' · responseFormat='json' · 返回 {dimensions:{...}, overallScore, priority:[...]}
- **AC-2** · DiagnosisAgent outputSchema 严守 `apps/api/src/specialists/DiagnosisAgent.ts` L25-35 · 7 维度结构 `Record<string, {score, issues:string[], suggestions:string[]}>` + overallScore 0-100 + priority array · LLM 返回 schema 不匹配时 BaseSpecialist 自动 fallback(isFallback=true · 返回 mock data)
- **AC-3** · diagnosis router L46-67 改 P1 mock → 真调 · `const agentRes = await diagnosisAgent.execute({accountId:activeAccountId!, userInput:{answers:input.answers}, traceId})` · 写 DiagnosisReport with real dimensions(agentRes.result.dimensions) + overallScore + topPriority(agentRes.result.priority[0]) + recommendedSteps(agentRes.result.priority) + isFallback(agentRes.isFallback) + tokensUsed + modelUsed + durationMs
- **AC-4** · 前端 Diagnosis.tsx 替换 stubScore(dimensionId) · 新建 useMutation hook → trpc.diagnosis.generate.useMutation · onSuccess 把 result 存 useState <DiagnosisReport | null>(null) · onError 设 `setError('AI 暂未生成 · 显示规则评分')` · loading 时显示 Loader2 spinner + "AI 分析中..."
- **AC-5** · 7 维度报告渲染 · REPORT_DIMENSIONS_7 → 用 report.dimensions[dim.id]?.score 替换 stubScore · 每维度卡内显示 issues list + suggestions list(从 dimensions[dim.id].issues / .suggestions) · 整体评分 report.overallScore 替换硬编码 · priority list 渲染
- **AC-6** · isFallback=true 时 · 报告顶部显示灰色 hint banner "AI 暂未生成深度分析 · 显示规则评分(可点击 retry button 重新生成)" · `bg-muted/30 border border-border/40 rounded-lg p-3` · retry button onClick → mutation.mutate(同 payload)
- **AC-7** · 错误处理 · onError 抛 toast.error("生成报告失败 · 请稍后再试") + retry button 显示 · network error(ECONNRESET / timeout)由 BaseSpecialist 内部指数退避自动 retry(继承 PRD-5 TD-009 fix · 不消耗 retryCount) · ralph 不需要前端实现 retry 逻辑(已在 base layer)
- **AC-8** · TypeScript typecheck · `pnpm typecheck` 0 errors · apps/api + apps/web 全 ws · DiagnosisOutput 类型签名 propagate 到 router output(trpc inferRouterOutputs<typeof appRouter>['diagnosis']['generate'])
- **AC-9** · unit test 同步 · `apps/web/src/pages/modules/__tests__/Diagnosis.test.tsx` 新增 ≥ 5 test cases · mock trpc.diagnosis.generate · 验证 (a) AC-4 generate.useMutation 在 finish button click 触发 (b) AC-5 dimensions[dim.id].score 渲染 (c) AC-6 isFallback=true 时显示 hint banner (d) AC-7 error 时显示 retry button (e) AC-8 loading 状态显示 spinner
- **AC-10** · unit test for DiagnosisAgent invokeLLM · `apps/api/src/specialists/__tests__/DiagnosisAgent.test.ts` 新增 ≥ 3 test cases · mock LLMGateway · 验证 (a) prompt 含 7 维度定义关键字 (b) outputSchema 严守 (c) responseFormat='json'
- **AC-11** · LLM Judge test for DiagnosisAgent · `apps/api/src/specialists/__tests__/DiagnosisAgent.judge.test.ts` 新增 ≥ 1 golden case · `vitest.judge.config.ts` 跑(eventType='judge_call' · model_tier='lightweight')· 验证真 LLM 调用返回 schema-conformant output
- **AC-12** · e2e 集成 · `tests/e2e/prd25-diagnosis-llm-flow.spec.ts` 1 fixture · GET /auth/dev-login(D-244 e2e auth bypass) · 跑 8 step 完成 → 看 report 渲染(允许 isFallback=true 路径) · 不强求真 LLM(测试环境无 OPENAI_API_KEY 也跑 isFallback) · ≥ 5 assertions
- **AC-13** · visual diff baseline · `tests/e2e/prd25-visual-baseline.spec.ts` 追加 `prd25-diagnosis-report.png` baseline · 跑 8 步完成 → 看 report 区域 fullPage(可能 fallback hint 在画面内)
- **AC-14** · cost_log 写入 · 验证 db.costLog 有 1 条新记录 · eventType='specialist_call' · agentId='DiagnosisAgent' · target.stepKey?='diagnosis' · isFallback=true/false 真实反映
- **AC-15** · agent-browser 验证 · 跑 dev server + 浏览器跑 /diagnosis 8 step · 截图 1 张 verify-artifacts/US-001/diagnosis-final-report.png · 验证 isFallback 路径或真 LLM 路径任一显示

**files_to_create / modify** ·
- modify · `apps/api/src/specialists/DiagnosisAgent.ts`(invokeLLM 完整 system prompt + JSON parse)
- modify · `apps/api/src/trpc/routers/diagnosis.ts`(L46-67 P1 mock → 真调 diagnosisAgent.execute)
- create · `apps/api/src/specialists/__tests__/DiagnosisAgent.test.ts`(≥ 3 unit test)
- create · `apps/api/src/specialists/__tests__/DiagnosisAgent.judge.test.ts`(≥ 1 LLM Judge test)
- modify · `apps/web/src/pages/modules/Diagnosis.tsx`(stubScore → useMutation + isFallback hint)
- modify · `apps/web/src/pages/modules/__tests__/Diagnosis.test.tsx`(同步更新 ≥ 5 test cases · mock useMutation)
- create · `tests/e2e/prd25-diagnosis-llm-flow.spec.ts`(1 fixture · ≥ 5 assertions)
- modify · `tests/e2e/prd25-visual-baseline.spec.ts`(prd25-diagnosis-report.png 新建 + --update-snapshots)

**anti_patterns 注入** ·
- ❌ NEVER `import OpenAI` 在前端 / 前端读 API_KEY(R-001 红线)
- ❌ NEVER `apiKey` 出现在 `apps/web/` 任何文件
- ❌ NEVER 直接 fetch LLM API · 必须通过 trpc.diagnosis.generate.useMutation
- ❌ NEVER 硬编码 model name(如 'claude-sonnet-4-5') · 必须 model_tier='reasoning'(LLMGateway 内部决定)
- ❌ NEVER mock llmGateway 在 vitest.config.ts global setupFiles · 仅在 specific test file vi.mock(TD-027 警示)

---

### US-002 high · /voice-chat 接 voiceChatAgent.executeStream subscription wire up + delta chunks 实时渲染(D-244 字面锁严守)

**风险分档** · 🔴 **high**(streaming subscription · delta chunks 累积逻辑 · tool_call/tool_result chunk 处理 · meta chunk 首发 · 错误处理 + retry + cancel button · SSE 是技术复杂度高)

**Story 大小** · medium(单次 ralph 迭代可完成 · 5-7 文件创建/修改 · ~250 LOC 新增 + ~40 LOC 删除 stub answer)

**downstream count** · 0(US-001~007 独立) · risk_level=high

**前置依赖** · voiceChat router L23-52 已建 subscription · voiceChatAgent.executeStream 已实施(§11.6.4 SSE Specialist 沉淀) · /voice-chat page 已建(`apps/web/src/pages/tools/VoiceChat.tsx` · stub answer='功能 PRD-25+ 接 LLM')

**用户故事** ·
作为 QuanAn 用户 · 当我在 /voice-chat 点击 quick prompt 或输入文字 + 发送 · LLM 实时流式返回回答 · 我看到 message bubble 实时增长(delta chunks) · 显示当前 model 标识(从 meta chunk) · 如果触发 tool_call(如查 ipAccount 信息) · 显示工具调用过程 hint 文字"调用工具: get_account_info..." · tool_result 后继续生成 · 完成后 done chunk 显示 tokensUsed + durationMs · 历史记录 localStorage `acc_{accountId}_voice_chat_history`(继承 PRD-24 D-239)。

**验收标准** ·

- **AC-1** · VoiceChat.tsx handleSend 替换 stub answer · 新建 useSubscription hook → trpc.voiceChat.start.useSubscription({userMessage:q, sessionId}, {onData:(chunk)=>{...}, onError:(err)=>{...}, onComplete:()=>{...}}) · sessionId 用 uuid 每次 send 生成 · enabled 为 input.trim() 长度 ≥ 1
- **AC-2** · chunk 类型处理 · `{type:'meta', meta:{model}}` 显示 model 标识(灰色 hint "由 {model} 生成")· `{type:'delta', text}` 累积到 currentAnswer state · `{type:'tool_call', name, args}` 显示 hint "调用工具: {name}..." · `{type:'tool_result', name, result}` 继续 generate · `{type:'done', tokensUsed, durationMs}` 收尾 + 写 history + setIsStreaming(false)
- **AC-3** · 实时渲染 · message bubble 含 currentAnswer state · subscribe 期间显示 typing indicator(...)(spinner.io style 3 个 dot animation) · done 后 typing 隐藏 + 显示 tokensUsed + durationMs 灰色 footer
- **AC-4** · 历史记录 · done chunk 后 entry = {id, question:q, answer:currentAnswer, timestamp:Date.now()} push history · localStorage.setItem(getLsKey(accountId, 'voice_chat_history'), JSON.stringify(history)) · 继承 PRD-24 ls-namespace 模式 · 多账号隔离
- **AC-5** · 错误处理 · onError(err) · toast.error("AI 暂未响应 · 请稍后再试") · 显示 retry button(re-trigger 同 q 的 subscription)· network error 自动指数退避(trpc 内部) · cancel button(显式 cleanup subscription · setIsStreaming(false))
- **AC-6** · cancel button · 流式进行中显示 "取消" button(替换 mic/speaker icon) · onClick 调 subscription.cancel() · 取消后保留已生成内容到 history 但标记 partial=true(灰色 hint "已取消 · 部分生成")
- **AC-7** · 6 quick prompts(VOICE_CHAT_QUICK_PROMPTS_6 字面锁 D-239 继承)行为不变 · click → setInput(prompt)(不直接发送 · 继承 D-239)
- **AC-8** · TypeScript typecheck · 0 errors · subscription onData 类型签名 inferProcedureOutput<typeof voiceChat.start> 严守 chunk types
- **AC-9** · unit test 同步 · `apps/web/src/pages/tools/__tests__/VoiceChat.test.tsx` 更新 ≥ 7 test cases(继承 PRD-24 8 个 + 新增 streaming · cancel · error · history append) · mock trpc.voiceChat.start.useSubscription(模拟 onData chunks 序列)· 验证 (a) delta 累积 (b) tool_call hint 显示 (c) done 后 history append (d) error 后 retry button (e) cancel 后 partial=true hint
- **AC-10** · e2e 集成 · `tests/e2e/prd25-voice-chat-streaming-flow.spec.ts` 1 fixture · GET /auth/dev-login · 点 quick prompt + 发送 → 等流式完成 → 验证 history 写入 localStorage · 真 LLM 路径或 isFallback 路径任一通过 · ≥ 6 assertions
- **AC-11** · visual diff baseline · `tests/e2e/prd25-visual-baseline.spec.ts` 追加 `prd25-voice-chat-streaming.png` baseline · 流式完成后截图(含 message bubble + 历史 list)
- **AC-12** · cost_log 写入 · 验证 db.costLog 有 1 条新记录 · eventType='specialist_call' · agentId='VoiceChatAgent' · streaming=true · tokensUsed.total > 0(真 LLM 路径)
- **AC-13** · agent-browser 验证 · 跑 dev server + 浏览器跑 /voice-chat · 点 quick prompt 1 + 发送 + 等 stream 完成 + 截图 verify-artifacts/US-002/voice-chat-streamed.png · 验证 message bubble + tokens footer

**files_to_create / modify** ·
- modify · `apps/web/src/pages/tools/VoiceChat.tsx`(stub answer → useSubscription + delta chunks 累积 + cancel button)
- modify · `apps/web/src/pages/tools/__tests__/VoiceChat.test.tsx`(同步更新 ≥ 7 test cases)
- create · `tests/e2e/prd25-voice-chat-streaming-flow.spec.ts`(1 fixture · ≥ 6 assertions)
- modify · `tests/e2e/prd25-visual-baseline.spec.ts`(prd25-voice-chat-streaming.png 新建)

**anti_patterns 注入** ·
- ❌ NEVER 跳过 cancel cleanup · subscription.cancel() 必须在 unmount + cancel button click 双触发
- ❌ NEVER 累积 delta 到 history 立即 setHistory(每 chunk re-render 性能爆炸) · 用 ref + done chunk 后批量更新
- ❌ NEVER tool_call hint 渲染为 user message · 必须用 SystemHint 组件(灰色背景 + italic)区分

---

### US-003 high · /daily-tasks 接 trpc.dailyTasks 全套(getToday + regenerateToday + markCompleted · BullMQ 触达 + 轮询 D-245)

**风险分档** · 🔴 **high**(BullMQ async 链路 · regenerateToday → worker → DailyTaskAgent 异步触达 · 前端轮询策略 · markCompleted optimistic UI · 错误处理多场景)

**Story 大小** · medium(单次 ralph 迭代可完成 · 5-7 文件创建/修改 · ~230 LOC 新增 + ~30 LOC 删除 stub)

**downstream count** · 0(US-001~007 独立) · risk_level=high

**前置依赖** · dailyTasks router 完整建(getToday + regenerateToday → dailyTaskQueue.add · BullMQ worker → DailyTaskAgent.execute · markCompleted upsert) · /daily-tasks page 已建(`apps/web/src/pages/modules/DailyTasks.tsx` · stub setTimeout(800) + DAILY_TASKS_STUB)

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /daily-tasks · loading 状态 · 数据加载完成显示今日任务 · 任务不存在时显示 EmptyState "AI 暂未生成今日任务 · 点击「生成」" + button → 触发 regenerateToday mutation · BullMQ 异步处理(8-30s) · 前端轮询 getToday(refetchInterval 3s · maxRetry 10 次) · 新数据返回后停止轮询 · 完成打卡 button 走 markCompleted.useMutation(optimistic UI · 立即灰色任务卡 + 撤销 if mutation fail)。

**验收标准** ·

- **AC-1** · DailyTasks.tsx 替换 setTimeout(800) stub · 新建 useQuery hook → trpc.dailyTasks.getToday.useQuery(undefined, {refetchInterval: data => data === null ? 3000 : false, refetchIntervalInBackground: false}) · null 时持续轮询 · 有 data 时停轮询
- **AC-2** · 任务卡渲染 · 替换 DAILY_TASKS_STUB.map 为 data?.tasks.map(JsonValue · cast to Array<{id, title, type, description, ctaUrl, ctaText, completed, expectedOutcome, difficulty, estimatedMinutes}>) · TaskCard 字段适配(title / hint=description / link=ctaUrl) · completed 状态从 task.completed 来 · 不再从 localStorage 独立维护
- **AC-3** · "重新生成" button · onClick → trpc.dailyTasks.regenerateToday.useMutation · onSuccess 后 invalidateQueries(['dailyTasks', 'getToday']) · 触发轮询(refetchInterval kicks in) · loading state 显示 spinner + "AI 老师正在为你制定今日任务..."(继承 D-236 文案)
- **AC-4** · 完成打卡 · TaskCard onComplete → trpc.dailyTasks.markCompleted.useMutation({dailyTaskId:data.id, taskId:task.id}) · optimistic UI(立即灰色 + completed=true 状态) · onError 撤销 + toast.error("打卡失败 · 请稍后再试")
- **AC-5** · 无 active account 显示 EmptyState(继承 PRD-24)+ "添加账号" CTA → 跳 /accounts(D-236 字面锁继承)
- **AC-6** · 无今日任务且未在轮询中 · 显示 EmptyState "AI 暂未生成今日任务 · 点击「生成」"+ "生成今日任务" button · onClick → regenerateToday mutation
- **AC-7** · ls-namespace 兼容 · `acc_{accountId}_daily_tasks_completed` 历史 localStorage 继承(PRD-24 完成打卡走 LS)· PRD-25 完成打卡 source-of-truth 从 server data(task.completed) · LS 仅作为离线兜底(network down 时仍能 mark · 下次 online sync 时优先 server)
- **AC-8** · isFallback hint · data.isFallback=true 时顶部显示灰色 banner "AI 暂未生成 · 显示规则建议"(类似 US-001)· 不阻塞任务展示
- **AC-9** · TypeScript typecheck · 0 errors · trpc 输出类型 inferRouterOutputs propagate
- **AC-10** · unit test 同步 · `apps/web/src/pages/__tests__/DailyTasks.test.tsx` 更新 ≥ 7 test cases(继承 PRD-24 + 新增 useQuery / mutation / optimistic UI) · mock trpc.dailyTasks 全套 · 验证 (a) AC-1 轮询启停 (b) AC-2 任务卡 server data 渲染 (c) AC-3 regenerate button (d) AC-4 markCompleted optimistic (e) AC-6 EmptyState 无任务 (f) AC-8 isFallback hint
- **AC-11** · e2e 集成 · `tests/e2e/prd25-daily-tasks-llm-flow.spec.ts` 1 fixture · GET /auth/dev-login + debugSeedTasks(3 任务) → /daily-tasks → 看任务卡渲染 + click "完成打卡"→ 验证 markCompleted optimistic UI · ≥ 6 assertions
- **AC-12** · visual diff baseline · `tests/e2e/prd25-visual-baseline.spec.ts` 追加 `prd25-daily-tasks-with-tasks.png` baseline(含 3 任务 server data 渲染状态)
- **AC-13** · agent-browser 验证 · 跑 dev server + 浏览器跑 /daily-tasks(seed 3 task 后) · 截图 verify-artifacts/US-003/daily-tasks-loaded.png · 验证任务卡渲染

**files_to_create / modify** ·
- modify · `apps/web/src/pages/modules/DailyTasks.tsx`(setTimeout → useQuery + regenerateToday + markCompleted + EmptyState 无任务 + isFallback hint)
- modify · `apps/web/src/pages/__tests__/DailyTasks.test.tsx`(同步更新 ≥ 7 test cases · mock trpc)
- create · `tests/e2e/prd25-daily-tasks-llm-flow.spec.ts`(1 fixture · ≥ 6 assertions)
- modify · `tests/e2e/prd25-visual-baseline.spec.ts`(prd25-daily-tasks-with-tasks.png 新建)

**anti_patterns 注入** ·
- ❌ NEVER 直接 fetch dailyTask BullMQ status · 用 useQuery refetchInterval 轮询 trpc · 保持 RLS 边界
- ❌ NEVER optimistic UI 没有 onError 撤销 · markCompleted 失败必须 setCompleted(prev) 回滚
- ❌ NEVER refetchInterval 永不停 · null 时启 / 有 data 时 false · 节省 server 负载

---

### US-004 high · /evolution 接 trpc.evolution 全套(getProfile + evolve + getInsightHistory · D-246 字面锁严守)

**风险分档** · 🔴 **high**(getProfile · evolve mutation 异步 enqueueIfThresholdMet · level 5 档动态显示 · 4 指标真数据 · evolution worker chain 历史 LD-009 多账号 LS 隔离)

**Story 大小** · medium(单次 ralph 迭代可完成 · 5-7 文件创建/修改 · ~240 LOC 新增 + ~40 LOC 删除 stub)

**downstream count** · 0(US-001~007 独立) · risk_level=high

**前置依赖** · evolution router 完整建(getProfile + evolve + getInsightHistory + getFeedbackTrend + getModuleRanking) · /evolution page 已建(`apps/web/src/pages/modules/Evolution.tsx` · stubLevel='L2' + EVOLUTION_METRICS_STUB)

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /evolution · loading 状态 · profile 数据加载完成显示当前 level(L1~L5 高亮 · 字面锁 D-237 继承)· 4 指标真数据(profile.feedbackCountGood + needsImprovement + learningArchive + satisfactionRate)· 触发进化 button → evolve mutation(异步) · profile.latestInsight 显示在"进化洞察"模块 · 进化方向(D-238 继承)选择走 ls-namespace 不变。

**验收标准** ·

- **AC-1** · Evolution.tsx 替换 stubLevel + EVOLUTION_METRICS_STUB · 新建 useQuery hook → trpc.evolution.getProfile.useQuery() · loading 显示 spinner · error 显示 toast 提示 · 数据 null(无 profile · 新用户)显示 EmptyState "新用户 · 暂无进化数据 · 跑任意 specialist 后生成"
- **AC-2** · LevelBadgeRow activeId · `profile?.level ?? 'L1'` 替换硬编码 stubLevel='L2'(D-237 5 级字面锁继承 · activeId 必须是 'L1'/'L2'/'L3'/'L4'/'L5' 之一 · profile.level 是 enum)
- **AC-3** · 4 指标真数据 · MetricCard 用 profile.feedbackCountGood / profile.feedbackCountTotal - profile.feedbackCountGood / profile.deepLearningCount / profile.satisfactionRate · 替换 EVOLUTION_METRICS_STUB 4 字段
- **AC-4** · "触发进化" button · onClick → trpc.evolution.evolve.useMutation({rating:'good', agentId:'EvolutionAgent', rateableType:'manual_trigger', rateableId:0}) · onSuccess 后 invalidateQueries(['evolution', 'getProfile']) · toast.success("进化触发成功 · 5+ 反馈后自动生成洞察")
- **AC-5** · "生成洞察" button · profile.feedbackCountTotal < 5 时 disabled + tooltip "需 ≥ 5 反馈" · ≥ 5 时启用 · onClick → trpc.evolution.evolve.useMutation(同 AC-4 但 rateableType='insight_trigger') · 异步触发 evolution worker · onSuccess invalidate · 用户看 latestInsight 字段刷新
- **AC-6** · 进化洞察模块显示 · profile.latestInsight ?? "暂无洞察 · 累计 5+ 反馈后自动生成偏好画像洞察"(D-237 module 2 字面锁继承)· 真有 insight 时 truncate 200 字 + "查看完整" button → /evolution/insights(留 PRD-26+)
- **AC-7** · "新增学习" button onClick → toast.info("新增学习功能 · 跑任意 specialist 后自动加入档案")· profile.deepLearningCount 真数据显示 · 不再 PRD-25+ toast
- **AC-8** · 进化方向 radio(D-238 字面锁继承)· ls-namespace `acc_{accountId}_evolution_settings` 不变(PRD-24 实现 OK)· 但 currentDirection 与 profile.currentDirection 同步:加载时优先 profile.currentDirection(server)· 用户选择后调 trpc.evolution.updateConfig({currentDirection:dir}) 持久化 · LS 仅作为离线兜底
- **AC-9** · TypeScript typecheck · 0 errors
- **AC-10** · unit test 同步 · `apps/web/src/pages/__tests__/Evolution.test.tsx` 更新 ≥ 8 test cases(继承 PRD-24 + 新增 useQuery / evolve / latestInsight / direction sync) · mock trpc.evolution.getProfile 全字段 · 验证 (a) AC-2 level 正确 (b) AC-3 4 指标真数据 (c) AC-4 evolve mutation (d) AC-5 disabled 条件 (e) AC-6 latestInsight 显示 (f) AC-8 direction server-source-of-truth
- **AC-11** · e2e 集成 · `tests/e2e/prd25-evolution-llm-flow.spec.ts` 1 fixture · GET /auth/dev-login + seed profile(level='L2', feedbackCountGood=6) → /evolution → 验证 level badge + 4 指标 + 触发进化 button · ≥ 6 assertions
- **AC-12** · visual diff baseline · `tests/e2e/prd25-visual-baseline.spec.ts` 追加 `prd25-evolution-with-profile.png` baseline(含 profile 数据 + L2 active state)
- **AC-13** · agent-browser 验证 · 跑 dev server + 浏览器 /evolution · 截图 verify-artifacts/US-004/evolution-with-profile.png

**files_to_create / modify** ·
- modify · `apps/web/src/pages/modules/Evolution.tsx`(stubLevel/EVOLUTION_METRICS_STUB → useQuery + evolve mutation + direction sync)
- modify · `apps/web/src/pages/__tests__/Evolution.test.tsx`(同步更新 ≥ 8 test cases · mock trpc)
- create · `tests/e2e/prd25-evolution-llm-flow.spec.ts`(1 fixture · ≥ 6 assertions)
- modify · `tests/e2e/prd25-visual-baseline.spec.ts`(prd25-evolution-with-profile.png 新建)

**anti_patterns 注入** ·
- ❌ NEVER stubLevel hardcoded · 必须 profile.level
- ❌ NEVER 4 指标硬编码 · 必须 profile 字段
- ❌ NEVER direction 仅依赖 LS · 必须 server-source-of-truth(profile.currentDirection)+ LS 离线兜底

---

### US-005 medium · /video-analysis + /analysis 接 AnalysisAgent 真 LLM(viral + structural mode · D-247 部分锁)

**风险分档** · 🟡 **medium**(2 page 同一 agent · viral / structural 两个 mode · output schema 不同 · history 写入 + isFallback 处理)

**Story 大小** · medium(单次 ralph 迭代可完成 · 4-6 文件修改 · ~200 LOC 新增 + ~30 LOC 删除 stub · 2 page 结构相似复用)

**downstream count** · 0 · risk_level=medium

**前置依赖** · analysis router 已接 analysisAgent(mode='structural') · videoAnalysis router 已接 analysisAgent(mode='viral') · 2 page stub local state(VideoAnalysis.tsx + Analysis.tsx · setSubmitted(true))

**用户故事** ·
作为 QuanAn 用户 · 当我在 /video-analysis 粘贴爆款视频文案 + 标题(optional)· 点击"开始深度解析" button · 看到 loading + 8s 内 5 H3 区块真 LLM 生成内容(viral output:结构拆解 / 节奏分析 / 爆款元素识别 / 多维评分 / 优化建议)+ "一键仿写" button → /generate 带参 navigate · 同理 /analysis 用 structural mode 同 5 H3。

**验收标准** ·

- **AC-1** · VideoAnalysis.tsx 替换 setSubmitted(true) · 新建 useMutation hook → trpc.videoAnalysis.analyze.useMutation · onSuccess 把 result 存 useState <AnalysisViralOutput | null> · loading 显示 spinner + "AI 深度解析中..."
- **AC-2** · viral output 5 H3 渲染 · structure_breakdown / pacing_analysis / viral_elements / multi_dim_score / optimization_suggestions(具体字段名以 AnalysisAgent.ts 定义为准 · ralph 应 grep 确认)· 渲染到 5 H3 块内 · 显示真 LLM 内容
- **AC-3** · "一键仿写" button onClick → useNavigate('/generate', {state:{title:input.title, copy:input.copy}}) · /generate 接收 state(已有逻辑 · PRD-22 沉淀)
- **AC-4** · Analysis.tsx 替换 setSubmitted(true) · 同 AC-1 但 trpc.analysis.analyze.useMutation · structural output 5 H3 渲染 · 字段名以 AnalysisAgent structural mode 定义为准
- **AC-5** · isFallback hint · result.isFallback=true 时顶部显示灰色 banner "AI 暂未生成深度分析 · 显示规则评分"+ retry button
- **AC-6** · 错误处理 · onError toast.error("解析失败 · 请稍后再试") + retry button · network error 自动指数退避(trpc 内部)
- **AC-7** · TypeScript typecheck · 0 errors
- **AC-8** · unit test 同步 · `apps/web/src/pages/tools/__tests__/VideoAnalysis.test.tsx` 更新 ≥ 5 test cases(继承 PRD-23 + 新增 mutation / viral output) + `Analysis.test.tsx` 同 ≥ 5 test cases · mock trpc · 验证 H3 渲染真数据
- **AC-9** · e2e 集成 · `tests/e2e/prd25-content-tools-flow.spec.ts` 1 fixture · GET /auth/dev-login · 跑 /video-analysis + /analysis 各 1 次 · 真 LLM 或 fallback 路径任一通过 · ≥ 8 assertions
- **AC-10** · visual diff baseline · `tests/e2e/prd25-visual-baseline.spec.ts` 追加 `prd25-video-analysis-with-result.png` + `prd25-analysis-with-result.png` 2 baselines
- **AC-11** · cost_log 写入 · 验证 db.costLog ≥ 2 条新记录 · agentId='AnalysisAgent' · agentMode='viral' / 'structural'
- **AC-12** · agent-browser 验证 · 跑 dev server + 浏览器跑 /video-analysis + /analysis 各 1 次 · 截图 2 张 verify-artifacts/US-005/

**files_to_create / modify** ·
- modify · `apps/web/src/pages/tools/VideoAnalysis.tsx`(stub → useMutation)
- modify · `apps/web/src/pages/tools/Analysis.tsx`(stub → useMutation)
- modify · `apps/web/src/pages/tools/__tests__/VideoAnalysis.test.tsx`(同步更新 ≥ 5 test cases)
- modify · `apps/web/src/pages/tools/__tests__/Analysis.test.tsx`(同步更新 ≥ 5 test cases)
- create · `tests/e2e/prd25-content-tools-flow.spec.ts`(1 fixture · ≥ 8 assertions)
- modify · `tests/e2e/prd25-visual-baseline.spec.ts`(2 baselines 新建)

**anti_patterns 注入** ·
- ❌ NEVER 2 page 复制粘贴整段 · 抽 SharedAnalysisResultRender component(packages/ui 复用)
- ❌ NEVER 跳过 isFallback hint · 用户感知必须有

---

### US-006 medium · /video-production + /acquisition-video 接 VideoAgent 真 LLM(production + acquisition mode · D-247 部分锁)

**风险分档** · 🟡 **medium**(2 page 同一 agent · production / acquisition 两个 mode · acquisition mode 多套方案 grid · history 写入)

**Story 大小** · medium(单次 ralph 迭代可完成 · 4-6 文件修改 · ~210 LOC 新增 + ~30 LOC 删除 stub · 2 page 结构相似复用)

**downstream count** · 0 · risk_level=medium

**前置依赖** · videoProduction router 已接 videoAgent(mode='production') · acquisitionVideo router 已接 videoAgent(mode='acquisition') · 2 page stub local state(VideoProduction.tsx + AcquisitionVideo.tsx)

**用户故事** ·
作为 QuanAn 用户 · 当我在 /video-production 粘贴文案 + 点击 "生成制作方案" button · 看到 loading + 8s 内 4 H3 区块真 LLM 生成(分镜脚本 + 拍摄方案 + 口播提词器 + 剪辑指导)· 同理 /acquisition-video 输入文案 + 选目标受众 → 3 方案 grid(每方案 4 H4:主题角度 / 钩子 / 内容结构 / CTA)。

**验收标准** ·

- **AC-1** · VideoProduction.tsx 替换 setSubmitted(true) · 新建 useMutation hook → trpc.videoProduction.generate.useMutation · onSuccess 把 result 存 state · loading 显示 spinner
- **AC-2** · production output 4 H3 渲染 · storyboard_script / shooting_plan / voiceover_prompter / editing_guide(字段名以 VideoAgent.ts production mode 定义为准 · ralph 应 grep 确认)· 渲染到 4 H3 块内
- **AC-3** · AcquisitionVideo.tsx 替换 setSubmitted(true) · 新建 useMutation → trpc.acquisitionVideo.generate.useMutation · 3 方案 grid 渲染 · 每方案 4 H4
- **AC-4** · acquisition output 字段映射 · `plans:[{theme_angle, hook, content_structure, cta}, ...]` 3 plan · 每 plan 4 H4(以 VideoAgent.ts acquisition mode 定义为准)
- **AC-5** · isFallback hint · 同 US-005 AC-5
- **AC-6** · 错误处理 · 同 US-005 AC-6
- **AC-7** · TypeScript typecheck · 0 errors
- **AC-8** · unit test 同步 · `apps/web/src/pages/tools/__tests__/VideoProduction.test.tsx` 更新 ≥ 5 + `AcquisitionVideo.test.tsx` ≥ 5 · mock trpc · 验证渲染真数据
- **AC-9** · e2e 集成 · `tests/e2e/prd25-content-tools-flow.spec.ts` 追加(同 US-005 文件)· /video-production + /acquisition-video 各 1 次 · ≥ 6 additional assertions
- **AC-10** · visual diff baseline · `tests/e2e/prd25-visual-baseline.spec.ts` 追加 `prd25-video-production-with-result.png` + `prd25-acquisition-video-with-plans.png` 2 baselines
- **AC-11** · cost_log 写入 · 验证 db.costLog ≥ 2 条新记录 · agentId='VideoAgent' · agentMode='production' / 'acquisition'
- **AC-12** · agent-browser 验证 · 跑 dev server + 浏览器跑 2 page · 截图 2 张

**files_to_create / modify** ·
- modify · `apps/web/src/pages/tools/VideoProduction.tsx`(stub → useMutation)
- modify · `apps/web/src/pages/tools/AcquisitionVideo.tsx`(stub → useMutation + 3 plan grid)
- modify · `apps/web/src/pages/tools/__tests__/VideoProduction.test.tsx`(同步更新 ≥ 5 test cases)
- modify · `apps/web/src/pages/tools/__tests__/AcquisitionVideo.test.tsx`(同步更新 ≥ 5 test cases)
- modify · `tests/e2e/prd25-content-tools-flow.spec.ts`(追加 ≥ 6 assertions)
- modify · `tests/e2e/prd25-visual-baseline.spec.ts`(2 baselines 新建)

**anti_patterns 注入** ·
- ❌ NEVER acquisition 3 方案硬编码数量 · 必须 result.plans.map(取真数组长度)
- ❌ NEVER 跳过 isFallback hint(继承 US-005)

---

### US-007 medium · /step/8 接 LivestreamAgent + /accounts smartRecommend procedure 新增(D-248 + D-249 字面锁严守)

**风险分档** · 🟡 **medium**(LivestreamAgent 2 sub_function · stepData router branch 已建 · accounts smartRecommend 新增 procedure + PositioningAgent execute · 涉及前端 2 page + 1 modal + 1 router)

**Story 大小** · medium(单次 ralph 迭代可完成 · 6-9 文件修改 · ~280 LOC 新增 + ~50 LOC 删除 stub)

**downstream count** · 0 · risk_level=medium

**前置依赖** · LivestreamAgent 完整建(generate_plan + optimize_script sub_function) · stepData router L269-280 已建 step8 branch · ipAccounts router 无 smartRecommend procedure 需新增 · Step8GeneratePlan + Step8OptimizeScript 子组件 stub · Accounts.tsx + CreateAccountModal 已建

**用户故事** ·
作为 QuanAn 用户 · 当我在 /step/8 "生成直播方案" tab 输入参数 + 提交 · 看到 loading + 30s 内 6 模块输出(opening + warmup + product + conversion + faq + closing) · 同 tab "AI 优化话术" 输入原话术 + 提交 · 看到 2 InfoCard(optimized_text + optimization_notes)· 在 /accounts 创建账号 modal 内 · 选 industry 后点"智能推荐" button → LLM 自动填充 platform / followersRange / ipPositioning + rationale 显示 hint。

**验收标准** ·

- **AC-1** · Step8GeneratePlan.tsx 替换 stub · 新建 useMutation → trpc.stepData.save.useMutation · payload `{stepKey:'step8', sub_function:'generate_plan', inputs:{...}}` · onSuccess 把 result 存 state · loading "AI 生成直播方案中..."
- **AC-2** · 6 模块渲染(继承 D-248) · result.opening / .warmup / .product / .conversion / .faq / .closing · 各模块 H3 + content body
- **AC-3** · Step8OptimizeScript.tsx 替换 stub · 同 AC-1 但 sub_function='optimize_script' · 2 InfoCard 渲染(optimized_text + optimization_notes)
- **AC-4** · 错误处理 + isFallback hint · 同 US-001/005 模式
- **AC-5** · ipAccounts router 新增 smartRecommend procedure · 输入 `{industry:string}` · 输出 `{platform:string, followersRange:string, ipPositioning:string, rationale:string}` · 内部调 positioningAgent.execute({mode:'recommend', userInput:{industry}, accountId, traceId}) · 或如 positioningAgent 不支持 recommend mode · 用 brandingAgent / 改 PositioningAgent 加 recommend mode(ralph 决策 · 优先 PositioningAgent 已有 mode)
- **AC-6** · PositioningAgent 加 recommend mode(如未有)· system prompt "根据用户提供的 industry · 推荐最适合的 platform(douyin/xiaohongshu/kuaishou)+ followersRange(0-1k/1k-10k/10k+)+ ipPositioning(ip-creator/opc-founder/traditional-transform/mcn-manager/demo)+ rationale(中文 100-200 字)" · model_tier='lightweight' · timeout 15s
- **AC-7** · CreateAccountModal 加"智能推荐" button(在 industry select 旁边)· industry 选定后点击 → trpc.ipAccounts.smartRecommend.useMutation · onSuccess 自动填 platform/followersRange/ipPositioning + 显示 rationale hint(灰色)
- **AC-8** · TypeScript typecheck · 0 errors
- **AC-9** · unit test 同步 · Step8GeneratePlan.test.tsx + Step8OptimizeScript.test.tsx(new files · ≥ 5 each)· CreateAccountModal.test.tsx 更新加 smartRecommend test(≥ 3 cases)· mock trpc 全套
- **AC-10** · backend test · PositioningAgent recommend mode unit test · ipAccounts.smartRecommend router test · 各 ≥ 3 cases
- **AC-11** · e2e 集成 · `tests/e2e/prd25-step8-smart-recommend-flow.spec.ts` 1 fixture · GET /auth/dev-login · 跑 /step/8 generate_plan + optimize_script 各 1 次 + /accounts 智能推荐 1 次 · ≥ 9 assertions
- **AC-12** · visual diff baseline · `tests/e2e/prd25-visual-baseline.spec.ts` 追加 `prd25-step8-generate-plan-result.png` + `prd25-step8-optimize-script-result.png` + `prd25-accounts-smart-recommend.png` 3 baselines
- **AC-13** · agent-browser 验证 · 跑 dev server + 浏览器跑 3 场景 · 截图 3 张

**files_to_create / modify** ·
- modify · `apps/web/src/components/step8/Step8GeneratePlan.tsx`(stub → useMutation)
- modify · `apps/web/src/components/step8/Step8OptimizeScript.tsx`(stub → useMutation)
- modify · `apps/api/src/specialists/PositioningAgent.ts`(加 recommend mode if needed · 注意 outputSchema getter 模式严守 §11.6.3)
- modify · `apps/api/src/trpc/routers/ipAccounts.ts`(加 smartRecommend procedure)
- modify · `apps/web/src/components/accounts/CreateAccountModal.tsx`(加智能推荐 button · 自动填字段)
- create · `apps/web/src/components/step8/__tests__/Step8GeneratePlan.test.tsx`(≥ 5)
- create · `apps/web/src/components/step8/__tests__/Step8OptimizeScript.test.tsx`(≥ 5)
- modify · `apps/web/src/components/accounts/__tests__/CreateAccountModal.test.tsx`(加 ≥ 3 smartRecommend tests)
- create · `apps/api/src/specialists/__tests__/PositioningAgent.recommend.test.ts`(≥ 3 if recommend mode 新加)
- create · `apps/api/src/trpc/routers/__tests__/ipAccounts.smartRecommend.test.ts`(≥ 3)
- create · `tests/e2e/prd25-step8-smart-recommend-flow.spec.ts`(1 fixture · ≥ 9 assertions)
- modify · `tests/e2e/prd25-visual-baseline.spec.ts`(3 baselines 新建)

**anti_patterns 注入** ·
- ❌ NEVER PositioningAgent recommend mode outputSchema hardcoded · 必须 outputSchema getter 按 mode 切换(§11.6.3 沉淀)
- ❌ NEVER smartRecommend 暴露给非 protectedProcedure · 必须 trpc.protectedProcedure + activeAccountId 上下文(用户认证)

---

### US-008 medium · TD-090/091 数据驱动重审 + TD-095 创建并修复(dev server 配套 SOP) + TD-027 关闭 + AGENTS.md §11.16 沉淀

**风险分档** · 🟡 **medium**(TD 处理 + 文档化 · 不动业务代码 · 但涉及 ralph.py + Validator + scripts/ralph/CLAUDE.md + 全局 sync · 跨多个 ops 文件)

**Story 大小** · medium(单次 ralph 迭代可完成 · 5-8 文件修改 · 4 个 TD 处理 + 1 AGENTS 沉淀)

**downstream count** · 0 · risk_level=medium

**前置依赖** · US-001~007 完成(10 page LLM 接入完毕)· TD-090/091 deferred 现状(visual baseline 命名 + 单列/双栏 layout) · TD-027 open(LLM Judge mock 失效) · TD-095 不存在需创建 · ralph.py 现有 daemon 启动 lifecycle · AGENTS.md §11.15 PRD-24 沉淀

**用户故事** ·
作为项目维护者 · 我需要在 LLM 接入完成后(US-001~007 ship 后)· 数据驱动决策 TD-090/091(切 aiipznt 实拍编号 baseline / 单列 vs 双栏 layout)· 修复 TD-095(daemon 启 dev server + Validator 健康检查)· 修复 TD-027(LLM Judge mock 失效)· AGENTS.md §11.16 沉淀 PRD-25 经验。

**验收标准** ·

- **AC-1** · TD-090 重审 · 创建 `tests/e2e/prd25-vs-aiipznt-llm-diff.spec.ts` 跑 12 page(对应 PRD-22 Step D 12 page · 含 LLM 内容 seed)· 模式 maxDiffPixelRatio=0.5(初始高容忍 · 收数据)· 对比 aiipznt 实拍编号 baseline · 跑完后输出 12-page pixel diff 表格 · 写入 `.agents/verification/prd-25-vs-aiipznt-llm.md`
- **AC-2** · TD-090 决策报告 · 基于 AC-1 数据 · 在 `.agents/verification/prd-25-vs-aiipznt-llm.md` 写"选项 A 切 aiipznt 编号"/ "选项 B 保持 internal regression"决策 · 含每 page 具体决策理由 · 更新 TD-090 状态(`resolved` 含完整 close_evidence)
- **AC-3** · TD-091 决策 · 同 AC-2 模式 · 单列 vs 双栏 layout 决策 · 5 inline page(/generate / /boom-generate / /knowledge 等)是否要重做双栏 · 数据驱动决策 · 更新 TD-091 状态
- **AC-4** · TD-095 创建 · `.agents/tech-debt.json` 新增 TD-095 entry · category='process-gap' · severity='medium' · title='Validator browse 前 dev server 健康检查 + daemon 启动配套' · evidence/root_cause/scheduled_fix_in/fix_hint 完整 · 后续 AC-5/6 解决并标 resolved
- **AC-5** · TD-095 修复 · ralph.py daemon 启动时 fork pnpm dev 子进程(detached · pid 写 dev-server.pid · output redirect dev-server.log)· daemon 退出时 SIGTERM dev server(优雅退出 + atexit hook)· `--with-dev-server` flag 默认开启 · `--no-dev-server` 显式禁用(纯测试场景)· 完整代码 + 测试
- **AC-6** · TD-095 Validator 配套 · `~/.claude/scripts/ralph/VALIDATOR.md` 加 §X dev server 健康检查 SOP · "Validator 调浏览器 / e2e 测试前 · 必须 `curl -s http://localhost:3000 > /dev/null && echo ok || (sleep 5 && retry ≤ 6 次)` · 都失败抛 SUSPECTED:dev_server_unavailable · 不浪费 audit cycle" · 项目副本 `scripts/ralph/VALIDATOR.md` 同步
- **AC-7** · TD-027 关闭 · `vitest.judge.config.ts` setupFiles 加 unMock 或 setupFiles 列表排除 global mock · LLM Judge test 真调 lightweight model · 跑 `pnpm test:judge` 14+/14+ pass · 更新 TD-027 状态 + close_evidence
- **AC-8** · AGENTS.md §11.16 沉淀 · 加 §11.16 PRD-25 LLM 接入沉淀 · 至少 5 子节(LLM 接入 useMutation 模式 + isFallback 处理 + DiagnosisAgent 启用经验 + smartRecommend 模式 + dev server 配套 SOP)
- **AC-9** · 全局 sync · `~/.claude/scripts/ralph/sync-to-project.sh` 跑成功 · ralph.py 改动同步到全局 · 项目副本 + 全局副本 diff=0
- **AC-10** · TypeScript typecheck · 0 errors · vitest tests pass(含 LLM Judge 14+/14+ pass)
- **AC-11** · 文档化 · 在 `scripts/ralph/CLAUDE.md` 加 dev server 启动说明 + Validator 调用 SOP · 项目本地副本完整

**files_to_create / modify** ·
- create · `tests/e2e/prd25-vs-aiipznt-llm-diff.spec.ts`(12 page · maxDiffPixelRatio=0.5)
- create · `.agents/verification/prd-25-vs-aiipznt-llm.md`(决策报告 + 12-page diff 表)
- modify · `.agents/tech-debt.json`(TD-090/091 close · TD-095 创建 + resolve · TD-027 close)
- modify · `~/.claude/scripts/ralph/ralph.py`(daemon 启 dev server lifecycle)
- modify · `scripts/ralph/ralph.py`(项目副本同步)
- modify · `~/.claude/scripts/ralph/VALIDATOR.md`(加 §X dev server 健康检查 SOP)
- modify · `scripts/ralph/VALIDATOR.md`(项目副本同步)
- modify · `~/.claude/scripts/ralph/CLAUDE.md`(加 dev server 说明)
- modify · `scripts/ralph/CLAUDE.md`(项目副本同步)
- modify · `vitest.judge.config.ts`(setupFiles 排除 global mock)
- modify · `AGENTS.md`(§11.16 PRD-25 沉淀 + 修订记录)

**anti_patterns 注入** ·
- ❌ NEVER 改 ~/.claude/ 不 sync 项目副本 · 必须 sync-to-project.sh 跑过
- ❌ NEVER 删 TD entry · 必须改 status='resolved' + close_evidence(继承全局)
- ❌ NEVER 跳过 12 page diff 跑 · 数据驱动决策不能拍脑袋

---

### US-009 收官 · verify-prd-25.sh ALL CHECKS PASSED + /goal-verify + /prd-retro 跨 5 PRD 复盘 + handoff PRD-26+

**风险分档** · 🟡 **medium**(收官 · verify script ≥ 35 checks · /goal-verify §0 codebase 同步 + /prd-retro 跨 5 PRD · 不动业务代码 · 但需要 ralph 写一致的 verify 脚本)

**Story 大小** · medium(单次 ralph 迭代可完成 · 4-5 文件修改 · 收官产物 + retro)

**downstream count** · 0 · risk_level=medium

**前置依赖** · US-001~008 完成 · 10 page LLM 接入 + DiagnosisAgent 启用 + smartRecommend 新增 + 4 TD 关闭 + AGENTS.md §11.16 沉淀

**用户故事** ·
作为项目维护者 · 我需要在 PRD-25 完成时 · 跑一键 verify-prd-25.sh 看 ALL CHECKS PASSED · /goal-verify §0 跑 /gsd-map-codebase × 6 (6 个子项目:apps/web + apps/api + apps/admin + packages/* 等)同步事实层 + 对账 AGENTS.md 设计约束 + 偏差登记 TD · /prd-retro 跨 PRD-21~25 5 PRD 复盘提炼 playbook 回传 progress.txt · 准备 PRR + PRD-26 handoff(admin / evaluation / 移动端)。

**验收标准** ·

- **AC-1** · `scripts/verify-prd-25.sh` 创建 · ≥ 35 checks(LLM 接入验证 10 + DiagnosisAgent 真启用 5 + smartRecommend 5 + dev server SOP 5 + LLM Judge 5 + visual baseline 5)· exit 0 时 echo "ALL CHECKS PASSED"
- **AC-2** · verify-prd-25.sh 跑通 · 所有 checks pass · 输出格式跟 verify-prd-24.sh 一致
- **AC-3** · /goal-verify §0 跑 · 6 子项目跑 /gsd-map-codebase 生成 .planning/codebase/ 7 files × 6 = 42 files(apps/web · apps/api · apps/admin · packages/ui · packages/schemas · packages/clients · 实际数以 monorepo 实情决定)· 偏差登记 TD(category='design-drift')
- **AC-4** · /goal-verify §1+ Goal-backward 验证 · 对比 PRD-25 §2 目标 vs 实际实现 · 写入 `.agents/verification/prd-25-goal-backward.md`
- **AC-5** · /prd-retro 跨 PRD-21~25 5 PRD 复盘 · 写入 `.agents/retros/prd-25-vs-prd-24-retrospective.md` · 至少含 (a) 严格一轮通过率(目标 ≥ 80% · PRD-25 LLM 接入挑战更高)(b) 视觉对齐征程 → LLM 接入征程 转向 (c) TD 净变化 (d) 反例库注入有效率 (e) Playbook 提炼 ≥ 3 条
- **AC-6** · progress.txt 追加 · `[PRD-25 retro] 5-PRD 复盘 · 严格一轮通过率 X% · TD 净 +/-N · Playbook +M 条 · LLM 接入 10 page 完成 · DiagnosisAgent 真启用 · smartRecommend 新增 · 4 TD 关闭 (TD-090/091/095/027) · AGENTS.md §11.16 沉淀`
- **AC-7** · handoff PRD-26+ · `tasks/prd-25.md §6 PRD-26+ Handoff` 写明:admin 子系统启动(PRD-10~14 已完成 admin core · PRD-26 启 admin UI MVP) · evaluation 完整化(LLM Judge cross-cut + 多 agent 跨场景测试) · 多用户压测(100/1k 用户) · 移动端响应式 polish · 海外版评估 · PRR
- **AC-8** · TypeScript typecheck · 0 errors · vitest tests pass(含 LLM Judge)· pnpm lint 0 errors
- **AC-9** · git 状态干净 · 仅本 US 改 4-5 文件 + retro · 不动业务代码

**files_to_create / modify** ·
- create · `scripts/verify-prd-25.sh`(≥ 35 checks · chmod +x)
- create · `.agents/verification/prd-25-goal-backward.md`(/goal-verify §1+ 报告)
- create · `.agents/retros/prd-25-vs-prd-24-retrospective.md`(5 PRD 复盘)
- modify · `tasks/prd-25.md`(§6 PRD-26+ Handoff section)
- modify · `progress.txt`(追加 retro 摘要)
- create 多个 · `.planning/codebase/`(/goal-verify §0 跑 gsd-map-codebase 自动生成 · 路径以 monorepo 实情)

**anti_patterns 注入** ·
- ❌ NEVER 收官跳过 /goal-verify(继承全局 SOP)
- ❌ NEVER retro 写"全部 1 iter PASS"假设(即便真 100% 也要数据驱动 · ralph 跑前看实际)

---

## §4 验收标准摘要(plan-check 友好格式)

### §4.1 10 page LLM 接入 + 2 新增 + 4 TD 处理矩阵

| US | risk | size | page/TD | trpc procedure | sub_function/mode | output schema |
|---|:-:|:-:|---|---|:-:|---|
| US-001 | high | medium | /diagnosis | trpc.diagnosis.generate | n/a | DiagnosisOutput(dimensions:Record + overallScore + priority) |
| US-002 | high | medium | /voice-chat | trpc.voiceChat.start | n/a (subscription) | chunk types (meta/delta/tool_call/tool_result/done) |
| US-003 | high | medium | /daily-tasks | trpc.dailyTasks.{getToday,regenerateToday,markCompleted} | n/a (BullMQ async) | DailyTask record(tasks JSON) |
| US-004 | high | medium | /evolution | trpc.evolution.{getProfile,evolve,updateConfig} | n/a | EvolutionProfile + FeedbackLog |
| US-005 | medium | medium | /video-analysis + /analysis | trpc.{videoAnalysis,analysis}.analyze | viral / structural | AnalysisViralOutput / AnalysisStructuralOutput |
| US-006 | medium | medium | /video-production + /acquisition-video | trpc.{videoProduction,acquisitionVideo}.generate | production / acquisition | ProductionOutput / VideoAcquisitionOutput |
| US-007 | medium | medium | /step/8 + /accounts | trpc.stepData.save + ipAccounts.smartRecommend | generate_plan / optimize_script + recommend | LivestreamOutput + AccountRecommendation |
| US-008 | medium | medium | TD-090/091 重审 + TD-095 创建 + TD-027 关闭 + AGENTS.md §11.16 | n/a (ops) | n/a | n/a |
| US-009 | medium | medium | 收官 verify + retro + handoff | n/a | n/a | n/a |

### §4.2 共享 AC(全 9 US)

- **AC-COMMON-1** · TypeScript typecheck 0 errors(`pnpm typecheck` 全 ws)
- **AC-COMMON-2** · unit test 同步 + pass(`pnpm test` · 含 LLM Judge `pnpm test:judge`)
- **AC-COMMON-3** · e2e test 含 GET /auth/dev-login bypass(继承 PRD-24 D-244 e2e auth 内化)
- **AC-COMMON-4** · 各 LLM 接入 US 必须含 isFallback hint UI(灰色 banner + retry button)
- **AC-COMMON-5** · 各 LLM 接入 US 必须 grep `apiKey` 在 `apps/web/` 0 命中(R-001)
- **AC-COMMON-6** · 各 LLM 接入 US 必须 grep `import OpenAI` 在 `apps/web/` 0 命中
- **AC-COMMON-7** · cost_log 写入验证(grep db.costLog · agentId+target+eventType 字段 propagate · isFallback 真实反映)
- **AC-COMMON-8** · visual diff baseline 每 LLM 接入 page +1 baseline · `tests/e2e/prd25-visual-baseline.spec.ts`
- **AC-COMMON-9** · `pnpm lint` 0 errors · 不留 hardcoded color / 未使用 import / no-misused-promises
- **AC-COMMON-10** · 各 US 收尾 commit message `feat: [US-XXX] <topic> · …` · ralph 自动 commit

### §4.3 跨 US 集成 AC

- **AC-CROSS-1** · 所有 10 page useMutation/useQuery/useSubscription 集中走 `apps/web/src/lib/trpc.ts` 客户端 · 不 inline import
- **AC-CROSS-2** · isFallback hint UI 抽 SharedFallbackBanner component(可复用 · packages/ui 或 apps/web/src/components/llm/) · 10 page 全用同组件
- **AC-CROSS-3** · 错误处理统一(toast.error + retry button)抽 useLLMMutation custom hook(可选 · 优先 ralph 自主判断是否抽)
- **AC-CROSS-4** · LLM Judge config 修复(TD-027)在 US-008 前完成 · 但所有 LLM 接入 US 的 `*.judge.test.ts` 文件按 §11.6.7 模式新建
- **AC-CROSS-5** · `verify-prd-25.sh` 在 US-009 创建 · 整合前 8 US 全部 acceptance · 跑前必须看 verify-prd-24.sh 通过(继承)

---

## §5 风险红线(自我把控)

### §5.1 不变红线(继承 PRD-15~24)

- **R-A** · 不动 backend 已 ship · 限制:DiagnosisAgent.ts L66-86 invokeLLM 完整重写允许 · diagnosis router 改 P1 mock → 真调 允许 · ipAccounts.smartRecommend 新增 procedure 允许 · 其他 router / agent 不动
- **R-B** · 不动 admin · /admin/* 完全 hands-off(继承 PRD-15~24 + AGENTS §10)
- **R-C** · 不动测试基础设施 · vitest.config.ts 不改(仅 vitest.judge.config.ts setupFiles 排除 mock)· playwright.config 不改 · e2e 路径继承 tests/e2e/
- **R-D** · 不动 PRD-21~24 visual baseline · 不改 expectVisualMatch helper · 仅新增 prd25-XXX baselines
- **R-E** · 不动 globalProcedure / dev-login 中间件(继承 PRD-23/24 TD-094 已内化)
- **R-F** · R-001 红线严守 · `apiKey` / `import OpenAI` / `import Anthropic` 在 `apps/web/` 0 命中
- **R-G** · LD-009 多账号 LS 隔离严守 · 继承 ls-namespace `acc_{accountId}_*` 前缀
- **R-H** · D-233 unit test 同步硬规则(继承 PRD-23/24 100% 严格一轮通过率)· 每 US 重写 page 必同步更新 `__tests__/*.test.tsx`
- **R-I** · 字面锁严守(D-237/238/239 继承 + D-242~D-251 新加)· constants 文件不改字面 · JSX 不写字面

### §5.2 PRD-25 新加红线

- **R-25-A** · 不直接 fetch LLM API · 必须通过 trpc.{router}.{procedure}.useMutation/useQuery/useSubscription · 0 fetch('https://api.anthropic.com/...') 在 apps/web/
- **R-25-B** · model_tier 严守 LLMGateway 内部决定 · NEVER 前端硬编码 model name · trpc 输入参数不含 model 字段(除非 admin 后台)
- **R-25-C** · cost_log 不双写 · 继承 PRD-4 TD-013(LLMGateway + BaseSpecialist 各写一条已记录 · 不在 PRD-25 治理 · 留 PRD-26+ admin 域 ④)
- **R-25-D** · LLM Judge mock 排除 ONLY 在 vitest.judge.config.ts setupFiles · 不动 vitest.config.ts(主 config)防误伤其他 unit test
- **R-25-E** · dev server SOP 不允许 pnpm dev 多实例并发 · ralph.py 启动前 pgrep 检查 · 有残留 SIGTERM + 重启
- **R-25-F** · isFallback hint 不阻塞主流程 · 灰色 banner + retry button 即可 · 不 throw / 不 blocking modal

---

## §6 失败回滚 + 拆 story 协议

### §6.1 backup branch

`git branch backup/before-prd-25 main` 待建(daemon 启动前 30 min 内由 Opus 主对话或 ralph 启动 hook 创建)

### §6.2 拆 story 触发(继承全局 §9.6)

- prompt 字节 > 12K · 强制拆(本 PRD 9 US 估 ralph prompt 各 7-10K · 安全区)
- files_to_create > 12 · 强制拆
- size_hint=large · 强制拆(本 PRD 0 large story · 全 medium)
- 单 US round ≥ 6(异常)· 触发 §9.6.4 失败 → 拆分 → 重启 流程

### §6.3 PRD-25 预测拆分点

| US | size | 拆分预期 |
|:-:|:-:|---|
| US-001 | medium | 不拆(DiagnosisAgent + router + frontend 6-8 file 都在 prompt 7-9K) |
| US-002 | medium | 不拆(subscription wire up · 5-7 file) |
| US-003 | medium | 不拆(useQuery + 3 mutation · 5-7 file) |
| US-004 | medium | 不拆(useQuery + evolve · 5-7 file) |
| US-005 | medium | 警戒(2 page · 4-6 file · 8-10K prompt)· 如果 ralph round ≥ 3 同 reject · 拆 2 US |
| US-006 | medium | 同 US-005 警戒 |
| US-007 | medium | 警戒(6-9 file · /step8 子组件 + smartRecommend 新增)· 如果 ralph round ≥ 3 · 拆 2 US(/step8 + /accounts 各一) |
| US-008 | medium | 不拆(TD 处理 + AGENTS 沉淀 · 5-8 file) |
| US-009 | medium | 不拆(收官 verify + retro) |

### §6.4 拆分预备 prd-25-split.json

若 US-005/006/007 触发拆分 · 预先准备:
- US-005-a · /video-analysis 接 LLM
- US-005-b · /analysis 接 LLM
- US-006-a · /video-production 接 LLM
- US-006-b · /acquisition-video 接 LLM
- US-007-a · /step/8 接 LLM(Step8GeneratePlan + Step8OptimizeScript)
- US-007-b · /accounts smartRecommend 新增 procedure + button

---

## §7 依赖图谱

### §7.1 前置 PRD(严格保留不动)

- **PRD-1~14**(项目基础 + admin core + Specialist 全建 + LLM Gateway + dailyTaskQueue + evolution worker)
- **PRD-15**(8 page 完整化基线 + LocalStorage acc_ 前缀反例)
- **PRD-16~20**(设计系统 + 9 step page + 14 工具基础 + 真 LLM 接入 sentinel(§11.7) · 5 子节 commit 事实驱动)
- **PRD-21**(visual-diff infra + expectVisualMatch helper)
- **PRD-22**(3 inline picker utility + 13 visual baseline + glass-card.tsx + FadeInWrapper polish)
- **PRD-23**(7 stub 完整化 + 16 visual baseline + DiagnosisStepCard pattern + ls-namespace helper + dev-login + globalProcedure)
- **PRD-24**(3 modules 完整化 + 32 page visual baseline 收官 + 1:1 视觉复刻达成里程碑 + D-237/238/239 字面锁严守)

### §7.2 US 依赖

```
US-001 (high) /diagnosis  ← 独立 · DiagnosisAgent 启用 + diagnosis router 真调 + 前端 useMutation
US-002 (high) /voice-chat ← 独立 · subscription wire up + delta chunks
US-003 (high) /daily-tasks ← 独立 · getToday + regenerateToday + markCompleted + 轮询
US-004 (high) /evolution  ← 独立 · getProfile + evolve + latestInsight

US-005 (medium) /video-analysis + /analysis ← 独立 · AnalysisAgent 接入
US-006 (medium) /video-production + /acquisition-video ← 独立 · VideoAgent 接入
US-007 (medium) /step/8 + /accounts ← 独立 · LivestreamAgent + smartRecommend

US-008 (medium) TD-090/091/095/027 + AGENTS.md §11.16 ← US-001~007 完成后跑(数据驱动需 LLM 接入)
US-009 (medium 收官) ← US-001~008 全部
```

**关键** · US-008 必须等 US-001~007 完成(LLM 数据驱动 TD-090/091 决策依赖真 LLM 接入数据 + dev server SOP 修复需要 7 US 跑过 ralph 验证 + LLM Judge 14+/14+ pass 需要 7 US LLM 接入完成)。

### §7.3 下游 PRD

- **PRD-26**(候选)· admin 子系统启动 + admin UI MVP(继承 PRD-10~14 admin core)
- **PRD-27**(候选)· evaluation 完整化(LLM Judge cross-cut + 多 agent 跨场景测试)
- **PRD-28**(候选)· 多用户压测(100/1k 用户 · 性能基线 + 容量规划)
- **PRD-29**(候选)· 移动端响应式 polish + native App 评估
- **PRD-30**(候选)· 海外版评估(英文版 + 多供应商海外节点)
- **PRR**(production readiness review)· 全 PRD-1~25 综合体检 + 上线 SOP

---

## §8 进度跟踪

### §8.1 daemon 命令

```bash
cd /Users/return/Desktop/QuanAn

# 1. 复制 prd-25.json 到 prd.json 运行时副本
ls scripts/ralph/prd-25.json && cp scripts/ralph/prd-25.json scripts/ralph/prd.json
python3 scripts/ralph/ralph-tools.py status

# 2. 备份分支
git branch backup/before-prd-25 main

# 3. Monitor(必先于 daemon · 全局 §9.1 5 步 SOP)
# Monitor(command="tail -n 0 -F scripts/ralph/ralph-output.log 2>/dev/null | grep -E --line-buffered 'PENDING_DETECTED|审计门禁已激活|APPROVED|REJECTED|所有任务已完成|All stories resolved|非零退出码|最大重试次数|级联阻断|通过 Opus 质量审查|⛔|Traceback|Error:'", persistent=true, timeout_ms=3600000)

# 4. Daemon(US-008 修复 TD-095 后 daemon 自动启 pnpm dev · 当前先手动启)
# 手动 pnpm dev 后台跑(US-001~007 期间需要):
nohup pnpm dev > dev-server.log 2>&1 &
echo $! > dev-server.pid

/Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon
```

### §8.2 预期时间线

| US | risk | 预期 ralph 时间 | 预期 Opus audit 时间 | 累计 |
|---|:-:|:-:|:-:|:-:|
| US-001 high | high | 45-70 min(DiagnosisAgent 完整 + router + frontend) | 12-15 min(深审 · prompt 完整性 + isFallback 路径) | 1.5h |
| US-002 high | high | 50-75 min(subscription wire up + chunk 类型 + cancel) | 12-15 min(深审 · streaming 健壮性) | 3h |
| US-003 high | high | 40-60 min(useQuery + 3 mutation + 轮询 + optimistic UI) | 10-12 min | 4.5h |
| US-004 high | high | 40-55 min(useQuery + evolve + latestInsight) | 10-12 min | 5.75h |
| US-005 medium | medium | 30-45 min(2 page 复用) | 8-10 min | 6.75h |
| US-006 medium | medium | 30-45 min(2 page 复用) | 8-10 min | 7.75h |
| US-007 medium | medium | 50-70 min(/step8 + /accounts smartRecommend 多文件) | 10-12 min | 9.5h |
| US-008 medium | medium | 50-75 min(4 TD 处理 + AGENTS 沉淀) | 10-15 min | 11.25h |
| US-009 medium | medium | 40-55 min(verify + retro + handoff) | 8-10 min | 12.25h |
| **累计** | — | **6-9h daemon** | **88-111 min Opus audit** | **12-14h wall time** |

### §8.3 跨 PRD-25 大门禁

1. ✅ US-001 完成 = /diagnosis 真 LLM 7 维度评分 · DiagnosisAgent invokeLLM 完整 + isFallback 路径稳
2. ✅ US-002 完成 = /voice-chat streaming wire up · delta chunks 实时 + cancel button + history append
3. ✅ US-003 完成 = /daily-tasks BullMQ 触达 + 轮询 + markCompleted optimistic UI
4. ✅ US-004 完成 = /evolution profile 真数据 + evolve mutation + latestInsight 显示
5. ✅ US-005 完成 = /video-analysis + /analysis 2 工具 page LLM 接入
6. ✅ US-006 完成 = /video-production + /acquisition-video 2 工具 page LLM 接入
7. ✅ US-007 完成 = /step/8 真直播方案(LivestreamAgent) + /accounts 智能推荐(smartRecommend 新增)
8. ✅ US-008 完成 = TD-090/091 数据驱动决策 + TD-095 创建并修复(dev server SOP) + TD-027 关闭(LLM Judge mock 修复) + AGENTS.md §11.16 沉淀
9. ✅ US-009 完成 = PRD-25 ship · verify-prd-25.sh ALL CHECKS PASSED + /goal-verify + /prd-retro 跨 5 PRD · 准备 PRR + PRD-26+ handoff

---

## §9 PRD-25 → PRD-26+ Handoff

> **写入时间** · 2026-05-20 · PRD-25 US-009 收官 · verify-prd-25.sh ALL CHECKS PASSED
> **当前状态** · PRD-25 branch `ralph/prd-25-llm-integration` · 10 pages LLM 接入完成 · 准备 merge + PRR

### §9.1 PRD-25 交付成果摘要

| 成果 | 数据 |
|---|---|
| LLM 接入 pages | 10 pages(diagnosis/voice-chat/daily-tasks/evolution/video-analysis/analysis/video-production/acquisition-video/step8/accounts) |
| 严格一轮通过率 | 100%(8/8 dev US · 0 retry · 0 Opus reject) |
| verify-prd-25.sh | 40/40 checks PASS |
| TypeScript | web 0 errors + api 0 errors |
| vitest | 382 tests pass |
| TD 净变化 | -2(关 4 · TD-027/090/091/095 · 开 2 · TD-096/097 low) |
| AGENTS.md 沉淀 | §11.16(5 子节 LLM 接入全链路) |
| visual baselines | 32 pages(继承 PRD-24 · 本 PRD 不新增 baseline · 内容由 stub→LLM) |

### §9.2 PRD-26 优先级建议

**admin 子系统完整化(优先)**:
- PRD-10~14 建立了 admin 后端(13 admin 表 + 6 闸鉴权) · 但 admin 前端 UI 未完整化
- evaluation 功能(LLM Judge · TD-027 已修复)可在 PRD-26 完整化
- admin 用户管理 / 审计日志 / 权限管理 UI 需要 Polish
- admin 子系统是运营 QuanAn 1.0 内测的必要工具

**PRD-26 建议范围**:
1. admin evaluation 完整化(LLM Judge 全套 · 12 个 judge 测试实际跑通)
2. admin 邀请码管理 UI 完整化(支持内测邀请发放)
3. admin 用户管理完整化(查看用户 · IP 账号 · 使用量)
4. admin KPI 仪表盘(本月新增 / 活跃用户 / LLM 成本追踪)

### §9.3 PRD-27+ 中优先级建议

**多用户压测**:
- LLM 接入后并发场景未测 · 需 k6/artillery 压力测试
- 重点: DiagnosisAgent(高 CPU reasoning model) + VoiceChat subscription 并发连接
- BullMQ DailyTask 并发队列 · worker 数量 vs 请求量

**移动端响应式 polish**:
- LLM 内容(AI 生成文本)在 mobile 视图断行 / 溢出 / 卡片高度未测
- voice-chat streaming 在 mobile 的 delta 渲染性能
- 建议: 专门的 mobile QA PRD

**evaluation 完整化**:
- 12 个 LLM Judge 测试(tests/judge/)覆盖所有 14 specialist
- 目前 PRD-20 real-llm tests 仅少数 specialist 有 real LLM e2e judge
- 需要系统性 judge 测试 PRD · 建立 evaluation dashboard

### §9.4 PRD-28+ 低优先级(留 PRR 前)

**海外版评估**:
- 目前 1.0 仅中文 · 未来可能需要英文版
- 技术路径: i18n(react-i18next) + 多语言 LLM prompt(当前 prompt 全中文)
- 域名 · CDN · 内容合规(海外版不需要 ICP)

**PRR(Production Readiness Review)**:
14 PRD 全部完成后的上线前检查清单:
- [ ] 域名 quanan.com + DNS 配置
- [ ] ICP 备案 + 增值电信经营许可证(ICP-VAS)
- [ ] Google OAuth / 微信 OAuth 正式应用申请
- [ ] 生产 LLM API Key 配置(Vercel env / Railway env)
- [ ] PostgreSQL 生产环境迁移(Railway PostgreSQL 或 阿里云 RDS)
- [ ] Redis 生产环境(Upstash 或 自建)
- [ ] Sentry 错误监控接入
- [ ] OTel 分布式追踪接入
- [ ] Plausible / PostHog 用户分析
- [ ] CDN 静态资产(Cloudflare / CloudFront)
- [ ] 灾备 SOP + 备份策略
- [ ] 隐私政策 + 用户协议 文案(律师审核)
- [ ] 商标注册(QuanAn · 全安)
- [ ] 内容审核员招聘(P9.2 启动前)
- [ ] 客服 / 工单 / 支付集成(邀请制结束后)
- [ ] Trending 第三方授权(新榜 / 蝉妈妈 / 飞瓜 · P5 启动前)

### §9.5 PRD-26 技术债务清单(需处理)

PRD-25 后尚存 29 open TD · PRD-26 建议优先处理:

| 优先级 | TD | 标题 | 建议处理时机 |
|:-:|---|---|---|
| 🔴 High | TD-037 | router 平铺 vs routers/app/ 子目录 | PRD-26 规划时 · admin router 扩展前 |
| 🟡 Med | TD-096 | apps-web .planning/codebase/ 缺失 | PRD-26 /goal-verify §0 |
| 🟡 Med | TD-097 | apps-api 事实层 stale | PRD-26 /goal-verify §0 |
| 🟢 Low | TD-049 | admin UI primitives 跨页重复 | admin UI PRD |
| 🟢 Low | TD-086 | App.tsx 死代码 | 任意 web cleanup PRD |

### §9.6 Playbook 提炼(回传 progress.txt)

5 条可迁移 Playbook(详见 .agents/retros/prd-25-vs-prd-24-retrospective.md §5):

1. **P25-001** · LLM 接入三层隔离原则(前端 tRPC · router · specialist this.llmGateway)
2. **P25-002** · isFallback 降级范式(data-testid=fallback-banner · 不 throw · 不 error state)
3. **P25-003** · dev server 生命周期管理(ralph.py _spawn_dev_server + VALIDATOR.md §X SOP)
4. **P25-004** · tRPC subscription splitLink 配置(httpSubscriptionLink vs httpBatchStreamLink)
5. **P25-005** · 数据驱动 TD 决策(先收集 before/after 实测数据 · 再 approve/reject TD)

---

> **本 PRD 由 Claude(Opus 4.7)在 PRD-25 启动期写 · 2026-05-20 · 跟 PRD-24 互补使用 · 待 prd skill 转 prd-25.json 后启 daemon · 9 US · LLM 接入征程开启 · 质量第一不走捷径。**
> **US-009 收官补充(2026-05-20)**: verify-prd-25.sh 40/40 PASS · 100% 严格通过率 · 10 pages LLM 接入完成 · §9 PRD-26+ Handoff 写入 · PRD-25 征程结束。
