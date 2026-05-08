# PRD-4 · P3 IP 主流程 9 步(7 Specialist 真接 LLMGateway · 告别 mock)

> **派生** · ARCHITECTURE §9.5 + §4.3 14 Specialist + §4.7 五层配置 + §6.4 ContextAssembler + §6.5 LLMGateway + §2.2 9 步表 + §2.3 9 步数据流
> **风险** · **high** · **依赖** · PRD-2 ✅ + PRD-3 ✅ · **预估** · 3 周 · 18 US
> **目标** · 9 步全跑通 · 7 Specialist 真接 LLMGateway · ContextAssembler 完整版 · feedback_log 替换占位 · LLM Judge 测试启动

---

## §0 引用清单

| 维度 | 来源 |
|---|---|
| 业务 | `aiipznt-spec.md` §Ⅶ IP 主流程 9 步 + ARCHITECTURE.md §2.2 9 步表(line 361-422) + §2.3 9 步数据流(line 385-422) |
| Specialist | ARCHITECTURE.md §4.3 14 Specialist 切分(line 1003-1029) + §4.4 L5 自治(line 1040-1126) + §4.7 五层配置(line 1192-1262) + §4.8 Agent 拓扑全图(line 1263-1311) |
| 接口契约 | ARCHITECTURE.md §6.4 ContextAssembler(line 1888-1920) + §6.5 LLMGateway(line 1922-1957) + §6.7 5 时序图(line 1972-2123) + §6.8 错误处理与降级 |
| 数据 | DATA-MODEL.md §4 StepData(line 509-655) · §4.3 输入 schema · §4.4 9 步输出 schema |
| 前端 | AGENTS.md §11 前端实施沉淀(PRD-3 沉淀 · §11.1 router / §11.3 StepLayout 防重复 / §11.4 ScrollArea / §11.5 Account 切换) |
| 反例库 | `~/.claude/playbooks/reject-examples.jsonl` · 36 条全量 · 关键 REJ-001(Specialist 不直接调 SDK)/ REJ-002(不 while 循环)/ REJ-003(不硬编码 model)/ REJ-008/009/013(RLS / executeRaw / TraceId 命名分层) |
| 基础设施 | LLMGateway PRD-2 US-007 已就位(`apps/api/src/workers/llm-gateway/index.ts`) · 17 router PRD-2 mock 全在 · stepData router(PRD-2 US-003) · feedback button(PRD-3 US-005) |
| 退出 | ARCHITECTURE.md §9.5 P3 退出条件 · 9 步全部能生成结果 + /ip-plan 显示完成度 + 切账号后数据隔离 |
| 沉淀 | `.planning/retros/PRD-3-RETRO.md` · §3 ScrollArea Pattern + 同模块 chunk + StepLayout 防重复(本 PRD 9 步表单可继承) |
| 全局规则 | 全局 CLAUDE.md §5.4 升档(downstream count ≥ 3 → foundation) · §5 质量第一 · 上下文不是借口 |

★ **继承 PRD-3** ·
- LLMGateway 已就位(R-1 唯一入口 · 4 模块 · cost-logger 真写)
- 14 specialist router 已 mock(本 PRD 改 9 个主线 router 真接)
- 9 步占位页就位(本 PRD 加表单 + result 渲染)
- stepData router(stepData.save / stepData.get / stepData.progress)就位 · 本 PRD 在 .save 之前先调 Specialist
- /ip-plan 0/9 + StepProgress(PRD-3 US-005)就位 · 本 PRD 接真 progress
- AGENTS.md §11 前端沉淀(router/StepLayout/ScrollArea)生效 · 本 PRD 9 步表单遵守

★ **继承 PRD-2** ·
- LD-009 RLS 多账号隔离 · 7 Specialist 全走 protectedProcedure · ctx.activeAccountId 自动注入
- cost_log 表 schema · 本 PRD 用同表写 prompt_tokens / completion_tokens / duration / model / trace_id · 加 event_type='good'/'bad' 兼容 feedback_log
- TraceId 命名分层(generateHttpTraceId / generateSpecialistTraceId) · 本 PRD Specialist 用 generateSpecialistTraceId

★ **本 PRD 暂不做(留 PRD-5/6/7/8/9)** ·
- PRD-5 创作模块 4 工具页(/generate / /analysis / /video-analysis / /boom-generate · CopywritingAgent + AnalysisAgent 多 mode)
- PRD-6 视频模块 4 工具页(/video-production / /acquisition-video / /ai-video / /trending · VideoAgent + TopicAgent 多 mode + ImageGen + TrendingScraper)
- PRD-7 私域 + 变现(/monetization / /private-domain · MonetizationAgent 第 2 调用点 + PrivateDomainAgent 6 stage)
- PRD-8 智能工具(3 L5 自治 · /voice-chat / /deep-learning / /evolution / /daily-tasks · DiagnosisAgent + DeepLearnAgent + VoiceChatAgent + EvolutionAgent + DailyTaskAgent)
- PRD-9 知识库 + RAG 全启用(67 案例 + 22 元素 + 23 公式入 pgvector)

---

## §1 用户故事(US-001 ~ US-018)

> **risk_level 标注** · 按 AGENTS.md §1.4 + AUDIT-CHECKLIST §Z + 全局 CLAUDE.md §5.4 升档(downstream count ≥ 3 → foundation)
> **优先级 priority** · 数字小者先跑 · ralph.py wave 调度依此

---

### **US-001 · BaseSpecialist 抽象 + 五层配置体系**

> **risk_level** · `foundation`(downstream 7+ · 升档自 medium)
> **priority** · 1
> **depends_on** · []

**描述** · 作为 7 个 Specialist 的统一抽象层,我需要 BaseSpecialist 类用模板方法 + 五层配置(persona / memory / knowledge / tools / execution),让子类只填配置 + 输出 zod schema,父类统一处理"装配 prompt → 调 LLMGateway → zod 校验 → 写 cost_log"流程。

**触发场景** · 任何 Specialist 子类 export 实例后,通过 `await specialist.execute({ accountId, mode, userInput, traceId })` 一句调用走完全流程。tRPC router 不直接接触 LLM,只调 Specialist。

**为什么 foundation** · US-004~US-010(7 Specialist 子类)全 depends_on 此抽象。如有 reject_reason 必须升档 high · 不允许 rubber-stamp(全局 CLAUDE.md §5.4 + AUDIT-CHECKLIST §Z)。

**files_to_create** ·
- `apps/api/src/specialists/base/BaseSpecialist.ts`(abstract class · ~150 行)
- `apps/api/src/specialists/base/types.ts`(`SpecialistConfig` / `SpecialistRequest<TIn>` / `SpecialistResponse<TOut>` 接口)
- `apps/api/src/specialists/base/errors.ts`(`SchemaValidationError` / `LLMTimeoutError` / `FallbackTriggeredError`)
- `tests/unit/specialists/base.test.ts`(≥ 8 unit tests)

**test_command** · `pnpm test tests/unit/specialists/base.test.ts && pnpm typecheck`

---

### **US-002 · ContextAssembler 完整实现**

> **risk_level** · `foundation`(downstream 7+9 · 升档自 high)
> **priority** · 2
> **depends_on** · [US-001]

**描述** · 作为 7 Specialist 的 prompt 装配中枢,我需要 ContextAssembler 类按 ARCHITECTURE §6.4 接口契约,内部并行 4 路 fetch:L2(stepData)/ L4(EvolutionProfile · 本期降级跑空)/ L4(Samples · 本期降级跑空)/ L5(RAG · 本期降级跑空)+ 常量(MethodologyQueryWorker · industries / hotElements / scriptTypes)。返回 `AssembledContext`(systemPrompt + userPrompt + tools + metadata)。各路 5s timeout · 缺数据降级注入空段 · 不阻断主流程。

**触发场景** · BaseSpecialist.execute() 内 `const ctx = await this.contextAssembler.assemble({ agentId, accountId, mode, userInput, needLayers, needRag });` 调用一次。

**为什么 foundation** · US-004~US-010 + US-013(/ip-plan stepData.progress 也用 ContextAssembler 部分能力 · 读 stepData 全量)都消费 AssembledContext · 总下游 ≥ 8。

**files_to_create** ·
- `apps/api/src/services/context-assembler/ContextAssembler.ts`(~200 行)
- `apps/api/src/services/context-assembler/types.ts`(`AssembleRequest` / `AssembledContext` 接口 · 完全对齐 ARCHITECTURE §6.4)
- `apps/api/src/services/context-assembler/templates/index.ts`(7 Specialist 各自 system prompt 模板片段 · 用模板字面量 + 占位符)
- `apps/api/src/services/context-assembler/templates/positioning.ts`(industry mode + execution mode)
- `apps/api/src/services/context-assembler/templates/branding.ts`(packaging mode + persona mode)
- `apps/api/src/services/context-assembler/templates/monetization.ts`
- `apps/api/src/services/context-assembler/templates/topic.ts`(5 category)
- `apps/api/src/services/context-assembler/templates/video.ts`(shooting mode)
- `apps/api/src/services/context-assembler/templates/copywriting.ts`(step7 mode)
- `apps/api/src/services/context-assembler/templates/livestream.ts`
- `tests/unit/services/context-assembler.test.ts`(≥ 10 tests)

**test_command** · `pnpm test tests/unit/services/context-assembler.test.ts && pnpm typecheck`

---

### **US-003 · LLMGateway 集成 BaseSpecialist + zod 校验 + cost_log 写入**

> **risk_level** · `foundation`(downstream 7 · 升档自 medium)
> **priority** · 3
> **depends_on** · [US-001, US-002]

**描述** · 在 BaseSpecialist.execute() 内集成 LLMGateway.complete() / .stream() · 用 `responseFormat: { type: 'json_schema', schema: outputSchema }` 强制 LLM 输出符合 zod schema · 校验失败 retry 1 次 · 二次失败 throw `SchemaValidationError` 触发 isFallback 路径(由 US-015 接管)· cost_log 写 prompt_tokens / completion_tokens / duration_ms / model_used / agent_id / trace_id / account_id。

**触发场景** · BaseSpecialist.execute() 装配完 prompt 后调 LLMGateway · 然后 zod 校验 → 写 stepData / history → cost_log。

**为什么 foundation** · 所有 Specialist 输出都走此路径 · cost_log 是 admin 后台 P9.1 域 ④(成本仪表盘)的数据源 · 跨 PRD 影响 PRD-11 admin。

**files_to_modify** ·
- `apps/api/src/specialists/base/BaseSpecialist.ts`(US-001 类内追加 `invokeLLM` / `validateOutput` / `writeCostLog` 私有方法 · ~100 行)
- `apps/api/src/workers/llm-gateway/index.ts`(若 PRD-2 未实现 `responseFormat: { type: 'json_schema' }` 则补上 · 校对 §6.5)

**files_to_create** ·
- `tests/unit/specialists/base.llm.test.ts`(≥ 6 tests · 校验通过 / 校验失败 retry / cost_log 写入)
- `tests/integration/api/specialist-llm.test.ts`(1 test · 真调 LLMGateway nock SDK · cost_log 真写 DB)

**test_command** · `pnpm test tests/unit/specialists tests/integration/api/specialist-llm.test.ts && pnpm typecheck`

---

### **US-004 · PositioningAgent(step1 industry mode + step4 execution mode)**

> **risk_level** · `high`(深度 LLM 调用 · 2 mode 分支 · markdown 长输出)
> **priority** · 4
> **depends_on** · [US-001, US-002, US-003]

**描述** · 实现 PositioningAgent · 服务 step1(行业选择 · industry mode)+ step4(执行计划 · execution mode)· 两个 mode 共用一个 Specialist 但 prompt 模板不同。step1 输出 `{ industry, marketAnalysis, competitionLevel, recommendation }` 结构化 JSON · step4 输出 16KB markdown 字符串(执行计划)· 因为 step4 是纯 markdown · zod schema 用 `z.string().min(1000)` + post-validate 检查必含 heading(`# 执行计划`)。

**触发场景** ·
- step1 · 用户在 `/step/1` 选行业 → 表单 submit → tRPC `stepData.save({ stepKey: 'step1', inputs })` mutation → router 内调 `positioningAgent.execute({ accountId, mode: 'industry', userInput: inputs })` → 写 stepData.result
- step4 · 用户在 `/step/4` 填粉丝量+目标 → 同上模式 mode='execution'

**files_to_create** ·
- `apps/api/src/specialists/PositioningAgent.ts`(继承 BaseSpecialist · ~150 行 · 含 2 mode 配置 + 2 outputSchema)
- `apps/api/src/specialists/__tests__/PositioningAgent.test.ts`(≥ 6 tests · 2 mode × 3 场景 = happy / fallback / cold start)

**files_to_modify** ·
- `apps/api/src/trpc/routers/stepData.ts`(`save` mutation 内 · stepKey='step1' / 'step4' 时调 PositioningAgent · 替换 mock)

**test_command** · `pnpm test tests/unit/specialists/__tests__/PositioningAgent.test.ts && pnpm typecheck`

---

### **US-005 · BrandingAgent(step3 packaging mode + step3b persona mode)**

> **risk_level** · `high`(2 mode · 输出大 8+6KB JSON · 嵌套深)
> **priority** · 5
> **depends_on** · [US-001, US-002, US-003]

**描述** · 实现 BrandingAgent · 服务 step3(账号包装 · packaging mode · 输出 8KB)+ step3b(人设定制 · persona mode · 输出 6KB)。两个 mode 共用一个 Specialist · prompt 模板不同 · output schema 也不同。

step3 输出 schema · `{ nickname[5], avatar{prompt+style}, background{prompt+platformVersions[3]}, bio[6 platforms], overallStrategy }`(架构 §2.2 实测确认)
step3b 输出 schema · `{ coreIdentity, thoughtSystem{coreBeliefs[3]+uniqueViews[2]+catchphrases[3]}, contentPersona{contentPillars[4]}, trustBuilding, personaRoadmap{phase1+phase2+phase3} }`

**触发场景** ·
- step3 · 用户在 `/step/3` 填平台 + 个人信息 + 受众 + 现有账号 → 表单 submit → router 调 `brandingAgent.execute({ accountId, mode: 'packaging', userInput })`
- step3b · `/step/3b` 填平台 + 个人信息 + 受众 + 优势 + 故事 → 调 `mode: 'persona'`

**files_to_create** ·
- `apps/api/src/specialists/BrandingAgent.ts`(~180 行 · 2 mode 配置 + 2 复杂嵌套 outputSchema)
- `apps/api/src/specialists/__tests__/BrandingAgent.test.ts`(≥ 6 tests)

**files_to_modify** ·
- `apps/api/src/trpc/routers/stepData.ts`(stepKey='step3' / 'step3b' 调 BrandingAgent)

**test_command** · `pnpm test tests/unit/specialists/__tests__/BrandingAgent.test.ts && pnpm typecheck`

---

### **US-006 · MonetizationAgent(step4b)**

> **risk_level** · `medium`(单 mode · 输出 8KB · 中等复杂度)
> **priority** · 6
> **depends_on** · [US-001, US-002, US-003]

**描述** · 实现 MonetizationAgent · 服务 step4b(变现路径)单 mode · 输出 8KB JSON `{ currentAnalysis, ladder[3], revenueStructure{primary+secondary[2]}, successCases[2] }`。注意 PRD-7 私域+变现期 MonetizationAgent 还会被 `/monetization` 工具页复用 · 本期只接 step4b · 复用 prompt 模板留 PRD-7。

**触发场景** · 用户在 `/step/4b` 填产品描述 + 受众 + IP 定位 + 当前营收 → 表单 submit → 调 `monetizationAgent.execute({ accountId, userInput })`。

**files_to_create** ·
- `apps/api/src/specialists/MonetizationAgent.ts`(~120 行)
- `apps/api/src/specialists/__tests__/MonetizationAgent.test.ts`(≥ 4 tests)

**files_to_modify** ·
- `apps/api/src/trpc/routers/stepData.ts`(stepKey='step4b')

**test_command** · `pnpm test tests/unit/specialists/__tests__/MonetizationAgent.test.ts && pnpm typecheck`

---

### **US-007 · TopicAgent(step5 · 22KB 输出 · 5 category SSE 流式)**

> **risk_level** · `high`(22KB 长输出 · 5 category 分支 · SSE 流式 · timeout 风险)
> **priority** · 7
> **depends_on** · [US-001, US-002, US-003]

**描述** · 实现 TopicAgent · 服务 step5(爆款选题)单 mode 5 category(`traffic` / `monetize` / `persona` / `cognition` / `case`)。每次调用生成 1 个 category 的 20 条选题 · 输出 schema · `{ [category]: 20 选题 × { title, hook, structure, formula, viralPotential } }`(单 category 约 4-5KB · 5 category 全跑约 22KB)。

**关键** · 走 SSE 流式(`llmGateway.stream()`)防 timeout · execution.timeout_ms = 60000 · execution.streaming = true。

**触发场景** · 用户在 `/step/5` 选行业 + 产品 + 选题类别(5 选 1)→ 表单 submit → 调 `topicAgent.execute({ accountId, mode: 'topic', userInput: { category, ... } })` · 前端用 `trpc.stepData.saveStream` 订阅 SSE 流。

**files_to_create** ·
- `apps/api/src/specialists/TopicAgent.ts`(~140 行 · 5 category 分支)
- `apps/api/src/specialists/__tests__/TopicAgent.test.ts`(≥ 7 tests · 5 category × 1 + 2 边缘)

**files_to_modify** ·
- `apps/api/src/trpc/routers/stepData.ts`(stepKey='step5' · 加 SSE subscription procedure)

**test_command** · `pnpm test tests/unit/specialists/__tests__/TopicAgent.test.ts && pnpm typecheck`

---

### **US-008 · VideoAgent(step6 shooting mode · 13 列分镜表)**

> **risk_level** · `medium`(单 mode · 13 列分镜表结构化 · 输出 5KB)
> **priority** · 8
> **depends_on** · [US-001, US-002, US-003]

**描述** · 实现 VideoAgent · 服务 step6(拍摄计划)shooting mode 单跑 · 输出 13 列分镜表 schema · `{ shotList: [{ scene, duration, action, dialogue, cameraAngle, prop, lighting, transition, sfx, voiceover, subtitle, costume, location }], equipment, schedule }`。

注意 PRD-6 视频模块 VideoAgent 还会被 production / acquisition / storyboard 3 mode 复用 · 本期只接 step6 shooting · 其他 mode 留 PRD-6。

**触发场景** · 用户在 `/step/6` 填文案源 → 调 `videoAgent.execute({ accountId, mode: 'shooting', userInput })`。

**files_to_create** ·
- `apps/api/src/specialists/VideoAgent.ts`(~130 行 · shooting mode 单 · 接口预留 4 mode)
- `apps/api/src/specialists/__tests__/VideoAgent.test.ts`(≥ 4 tests)

**files_to_modify** ·
- `apps/api/src/trpc/routers/stepData.ts`(stepKey='step6')

**test_command** · `pnpm test tests/unit/specialists/__tests__/VideoAgent.test.ts && pnpm typecheck`

---

### **US-009 · CopywritingAgent(step7 · markdown 长输出 · SSE)**

> **risk_level** · `high`(markdown 字符串 · zod 校验难 · 长输出 · SSE 流式)
> **priority** · 9
> **depends_on** · [US-001, US-002, US-003]

**描述** · 实现 CopywritingAgent · 服务 step7(爆款文案)step7 mode · 输出是**纯 markdown 字符串**(完整文案 · 数千字)+ 附加 `{ structure, hooks[], cta }`。

**关键** · markdown 字符串 zod 校验难 · 用 `z.object({ markdown: z.string().min(500), structure: z.string(), hooks: z.array(z.string()), cta: z.string() })` · post-validate 检查 markdown 必含 `# 标题` heading + 至少 3 段。走 SSE 流式 · timeout 60000。

注意 PRD-5 创作模块 CopywritingAgent 还会被 `/generate` / `/boom-generate` / `/acquisition-video` 文案部分复用 · 本期只接 step7 · 其他 mode 留 PRD-5。

**触发场景** · 用户在 `/step/7` 选脚本类型(20 选 1)+ 元素(22 选 N)+ 主题 → 表单 submit → 调 `copywritingAgent.execute({ accountId, mode: 'step7', userInput })` · SSE 流式渲染。

**files_to_create** ·
- `apps/api/src/specialists/CopywritingAgent.ts`(~150 行 · step7 mode 单 · 接口预留 4 mode)
- `apps/api/src/specialists/__tests__/CopywritingAgent.test.ts`(≥ 5 tests)

**files_to_modify** ·
- `apps/api/src/trpc/routers/stepData.ts`(stepKey='step7' · 加 SSE)
- `apps/api/src/trpc/routers/copywriting.ts`(把 `generate` mock 替换成调 CopywritingAgent · stepKey='step7')

**test_command** · `pnpm test tests/unit/specialists/__tests__/CopywritingAgent.test.ts && pnpm typecheck`

---

### **US-010 · LivestreamAgent(step8)**

> **risk_level** · `medium`(单 mode · 输出小)
> **priority** · 10
> **depends_on** · [US-001, US-002, US-003]

**描述** · 实现 LivestreamAgent · 服务 step8(直播话术)单 mode · 输出 `{ lastResult, lastOptimizedResult }`。两段直播话术 · `lastResult` 是常规版 · `lastOptimizedResult` 是优化版(同主题不同表达)。

**触发场景** · 用户在 `/step/8` 填平台 + 产品信息 + 受众 + 经验等级 → 表单 submit → 调 `livestreamAgent.execute({ accountId, userInput })`。

**files_to_create** ·
- `apps/api/src/specialists/LivestreamAgent.ts`(~100 行)
- `apps/api/src/specialists/__tests__/LivestreamAgent.test.ts`(≥ 4 tests)

**files_to_modify** ·
- `apps/api/src/trpc/routers/stepData.ts`(stepKey='step8')

**test_command** · `pnpm test tests/unit/specialists/__tests__/LivestreamAgent.test.ts && pnpm typecheck`

---

### **US-011 · 9 步前端表单组件(react-hook-form + zod resolver)**

> **risk_level** · `medium`(9 个 input schema · 跨页复用 · UI 一致性)
> **priority** · 11
> **depends_on** · [US-001](因为 input schema 由 packages/schemas/specialist-io.ts 共享)

**描述** · 实现 9 步表单组件 · 用 `react-hook-form` + `@hookform/resolvers/zod` · 各 step 表单复用通用 `<StepForm>` wrapper · 内部按 `stepKey` 渲染对应字段。所有 input schema 来自 `packages/schemas/specialist-io.ts`(单一真理源 · web/api 共用)。表单遵守 AGENTS.md §11.3 · 不要在 step 页内重复渲染 FeedbackButton(StepLayout 已渲染)。

**触发场景** · 用户进入 `/step/1` ~ `/step/8` 中的任一 · 看到对应字段表单 · 填写 → submit。submit 触发 `trpc.stepData.save` mutation · 后端调 Specialist。

**files_to_create** ·
- `packages/schemas/src/specialist-io.ts`(9 input schema 集中导出 · 跨包共用)
- `apps/web/src/components/StepForm/StepForm.tsx`(generic wrapper · ~100 行 · 用 `<form onSubmit={handleSubmit(onSubmit)}>`)
- `apps/web/src/components/StepForm/fields/IndustrySelect.tsx`(56 行业 select · step1 用)
- `apps/web/src/components/StepForm/fields/PlatformSelect.tsx`(5 平台 select · step3/4/8 用)
- `apps/web/src/components/StepForm/fields/CategorySelect.tsx`(step5 5 category select)
- `apps/web/src/components/StepForm/fields/TextareaField.tsx`(通用 textarea · 多 step 用)
- `apps/web/src/components/StepForm/index.ts`(barrel export)
- `tests/unit/web/StepForm.test.tsx`(≥ 5 tests · render / submit / zod 错误显示)

**files_to_modify** ·
- `apps/web/src/pages/step/Step1.tsx` ~ `Step9.tsx`(9 个 step 页 · 把占位 h1 + 占位卡片替换成 `<StepForm stepKey="stepN" />`)

**test_command** · `pnpm test tests/unit/web/StepForm.test.tsx && pnpm --filter @quanqn/web typecheck`

---

### **US-012 · 9 步 result 渲染(structured + markdown 双模式)**

> **risk_level** · `medium`(9 step output schema · 双模式渲染)
> **priority** · 12
> **depends_on** · [US-011]

**描述** · 实现 9 步 AI 输出 result 渲染组件 · 双模式 · structured 用 shadcn Card + 嵌套 Card 展示 JSON tree(step1/3/3b/4b/5/6/8) · markdown 用 `react-markdown` + remark-gfm 渲染长 markdown(step4 / step7)。所有渲染遵守 Aurelian Dark token(LD-015 0 hardcode color)。step5 长 list(20 选题 · 每个 20-50 字)套 ScrollArea + h-N(继承 AGENTS.md §11.4)。

**触发场景** · 用户提交 step 表单 → mutation 成功 → 页面显示 result 组件 · 用 `<StepResult stepKey="stepN" data={result} />`。

**files_to_create** ·
- `apps/web/src/components/StepResult/StepResult.tsx`(generic wrapper · ~80 行 · switch by stepKey)
- `apps/web/src/components/StepResult/Step1Result.tsx`(industry + analysis + recommendation)
- `apps/web/src/components/StepResult/Step3Result.tsx`(nickname[5] + avatar + background + bio[6] + strategy)
- `apps/web/src/components/StepResult/Step3bResult.tsx`(coreIdentity + thoughtSystem + ...)
- `apps/web/src/components/StepResult/Step4Result.tsx`(markdown · `react-markdown`)
- `apps/web/src/components/StepResult/Step4bResult.tsx`(currentAnalysis + ladder[3] + revenue + cases[2])
- `apps/web/src/components/StepResult/Step5Result.tsx`(20 选题 list 套 ScrollArea h-96)
- `apps/web/src/components/StepResult/Step6Result.tsx`(13 列分镜表 · 横向滚动 table)
- `apps/web/src/components/StepResult/Step7Result.tsx`(markdown · 同 Step4 + structure / hooks / cta 侧栏)
- `apps/web/src/components/StepResult/Step8Result.tsx`(2 段直播话术对比)
- `apps/web/src/components/StepResult/index.ts`(barrel)
- `tests/unit/web/StepResult.test.tsx`(≥ 9 tests · 每 step 1 个 render snapshot)

**files_to_modify** ·
- `apps/web/src/pages/step/Step1.tsx` ~ `Step9.tsx`(每页 submit 成功后渲染 `<StepResult />`)

**test_command** · `pnpm test tests/unit/web/StepResult.test.tsx && pnpm --filter @quanqn/web typecheck`

---

### **US-013 · /ip-plan 接 stepData.progress 真数据(替换 PRD-3 hardcoded 0/9)**

> **risk_level** · `medium`(切真 progress · stepData 全量计算 · 边缘场景)
> **priority** · 13
> **depends_on** · [US-004, US-005, US-006, US-007, US-008, US-009, US-010](因为 progress 计算依赖 7 Specialist 至少有 1 个跑成功 · 写入 stepData)

**描述** · 把 PRD-3 US-005 的 `/ip-plan` 占位逻辑(显示 hardcoded 0/9)替换成 `trpc.stepData.progress` 真实查询 · 后端 IPProgressService 计算 N/9(N = 当前账号 stepKey IN ('step1','step3','step3b','step4','step4b','step5','step6','step7','step8') 且 status='completed' 的行数 · 不计 step2 因为永远 404)。

**触发场景** · 用户进入 `/ip-plan` · StepProgress 组件渲染 · 用 `trpc.stepData.progress.useQuery({ accountId })` 拉真数据 · N/9 + 完成 step 高亮。

**files_to_modify** ·
- `apps/api/src/services/ip-progress/IPProgressService.ts`(PRD-3 US-005 占位 · 替换成查 stepData WHERE accountId AND stepKey IN ('step1','step3','step3b','step4','step4b','step5','step6','step7','step8') AND status='completed' · 返回 `{ completed: N, total: 9, completedSteps: ['step1', ...] }`)
- `apps/web/src/components/StepProgress.tsx`(PRD-3 US-005 已建 · 改 props 默认值 · 接真数据 · 移除 hardcoded mock)
- `apps/web/src/pages/IpPlan.tsx`(用 `useQuery` 拉真数据 · 显示 loading skeleton)

**files_to_create** ·
- `tests/unit/api/ip-progress.test.ts`(PRD-3 已建 · 加 ≥ 4 tests · stepData 真插入 0/3/9 行后查 progress 正确)
- `tests/integration/api/ip-progress-integration.test.ts`(1 test · 创建账号 → run 7 Specialist mock → 查 progress = 7/9)

**test_command** · `pnpm test tests/unit/api/ip-progress.test.ts tests/integration/api/ip-progress-integration.test.ts && pnpm typecheck`

---

### **US-014 · FeedbackButton 真接 feedback_log(替换 PRD-3 audit_log 占位)**

> **risk_level** · `medium`(改 feedback 数据流向 · 跨 PRD 兼容)
> **priority** · 14
> **depends_on** · [US-004, ..., US-010](因为需要 stepData 已有数据可反馈)

**描述** · 把 PRD-3 US-005 的 FeedbackButton 点击行为(写 cost_log 占位 · stepKey + traceId)升级 · 写 feedback_log(用 cost_log 表 + event_type='good'/'bad' 区分 · D-024)· 关联 stepKey + agentId + traceId + accountId。本期仅 trace · 实 evolve 留 PRD-8 EvolutionAgent 消费。

**触发场景** · 用户在 step page 点击 👍 或 👎 → `trpc.costLog.logFeedback({ stepKey, type: 'good'|'bad', traceId? })` mutation · 写 cost_log 表(event_type='good'/'bad' · target={ stepKey, agentId, traceId, accountId })。

**files_to_modify** ·
- `apps/api/src/trpc/routers/costLog.ts`(`logFeedback` procedure · 已有 PRD-3 占位 · 升级 input schema 加 stepKey + 写 event_type + agentId)
- `apps/api/prisma/schema.prisma`(可能需加 cost_log.event_type / agent_id / target 字段 · 看 PRD-2 schema 现状)
- `apps/web/src/components/FeedbackButton.tsx`(PRD-3 已建 · props 加 stepKey + agentId · 调用 mutation 时传)
- `apps/web/src/layouts/StepLayout.tsx`(渲染 FeedbackButton 时传 stepKey · 从路由参数推导)

**files_to_create** ·
- `apps/api/prisma/migrations/<timestamp>_add_feedback_log_fields/migration.sql`(若 schema 改动)
- `tests/unit/api/feedback-log.test.ts`(≥ 4 tests · logFeedback 写入 / event_type 枚举 / RLS 隔离)
- `tests/e2e/feedback-log.spec.ts`(1 test · /step/1 点击 👍 · 查 cost_log 表有 event_type='good' 行)

**test_command** · `pnpm test tests/unit/api/feedback-log.test.ts && pnpm typecheck`

---

### **US-015 · isFallback 降级路径(LLM fail / zod fail → 模板返回)**

> **risk_level** · `medium`(7 Specialist 各自 fallback · 跨 Specialist 一致性)
> **priority** · 15
> **depends_on** · [US-003](LLMGateway 集成 + zod 校验) + US-004~US-010(7 Specialist)

**描述** · 实现 isFallback 降级路径 · 当 LLMGateway 调用失败(超时 / 5xx / 限流)或 zod 校验二次失败时 · BaseSpecialist 内部捕获 · 用预置模板返回 result · 标 isFallback=true · DB 写入 `step_data.is_fallback=true` · UI 标"系统繁忙生成的备用版本"。每个 Specialist 提供 `fallbackTemplate` 静态属性 · 含通用占位文案。

**触发场景** · LLM 调用失败 → BaseSpecialist 捕获 → 取子类 fallbackTemplate → 写 stepData(is_fallback=true) → 返回 SpecialistResponse(isFallback=true)。前端 StepResult 检测 isFallback=true → 显示警示 banner + "系统繁忙 · 此为备用版本 · 可重试"。

**files_to_modify** ·
- `apps/api/src/specialists/base/BaseSpecialist.ts`(execute 方法加 try-catch + fallback 路径)
- `apps/api/src/specialists/PositioningAgent.ts` 等 7 文件(添加 `static readonly fallbackTemplate: { industry?: ..., execution?: ... }`)
- `apps/web/src/components/StepResult/StepResult.tsx`(检测 isFallback prop · 加 `<FallbackBanner />` 组件)

**files_to_create** ·
- `apps/web/src/components/StepResult/FallbackBanner.tsx`(警示 banner + 重试按钮)
- `tests/unit/specialists/fallback.test.ts`(≥ 7 tests · 每 Specialist 1 个 fallback 路径)
- `tests/e2e/fallback.spec.ts`(1 test · mock LLMGateway 失败 · 验证 UI 显示 fallback banner)

**test_command** · `pnpm test tests/unit/specialists/fallback.test.ts && pnpm typecheck`

---

### **US-016 · LLM Judge 测试(7 Specialist 各 1 golden case)**

> **risk_level** · `medium`(LLM 测试 flaky · CI 集成 · 配额管控)
> **priority** · 16
> **depends_on** · [US-004, ..., US-010]

**描述** · 实现 LLM Judge 测试 · 用 lightweight tier(haiku / 4o-mini)做 judge · 每 Specialist 1 个 golden case(input + expected output 关键字段比对)。Judge prompt 含 strict criteria · 输出 JSON `{ pass: boolean, score: 0-10, reason: string }`。CI 跑 1 次 · 失败重跑 1 次再判(防 flaky)。本期 lightweight tier · 高质量 Opus judge 留 PRD-9。

**触发场景** · CI(github actions / 本地 pnpm test:judge)跑 7 个 judge case · 每个调真 LLMGateway · cost_log 记录(标 source='judge' 区分用户调用)。

**files_to_create** ·
- `tests/judge/positioning.judge.ts`(input · expected · judge prompt)
- `tests/judge/branding.judge.ts`
- `tests/judge/monetization.judge.ts`
- `tests/judge/topic.judge.ts`
- `tests/judge/video.judge.ts`
- `tests/judge/copywriting.judge.ts`
- `tests/judge/livestream.judge.ts`
- `tests/judge/judge-runner.ts`(共享 judge 调用逻辑 · LLMGateway lightweight tier + retry 1)
- `tests/judge/types.ts`(`JudgeCase` / `JudgeResult` 接口)
- `vitest.judge.config.ts`(独立 vitest config · 排除常规 unit · CI 单独跑)
- `package.json`(加 `test:judge` script · `vitest run --config vitest.judge.config.ts`)

**test_command** · `pnpm test:judge`

---

### **US-017 · 9 步 e2e 集成(创建账号 → 9 步全跑通 → /ip-plan 9/9)**

> **risk_level** · `high`(跨 7 Specialist · 真 LLM 调用 · 长链路 · 超时风险)
> **priority** · 17
> **depends_on** · [US-004, ..., US-014, US-015]

**描述** · 实现 PRD-4 退出条件 e2e · 创建新 IP 账号 → 跑 step1 → step3 → step3b → step4 → step4b → step5 → step6 → step7 → step8 → 进 /ip-plan 验证显示 9/9。playwright spec 真接 LLMGateway · 用 LIVE LLM 跑(非 nock) · CI 关闭(只 manual 跑) · 本地 dev 跑过即视为退出条件达成。

**触发场景** · `pnpm playwright test tests/e2e/ip-flow-9-steps.spec.ts --project=chromium` · 跑 1 个 e2e 走完 9 步 · 验证每步 result 渲染 · /ip-plan 9/9 高亮全部完成。

**files_to_create** ·
- `tests/e2e/ip-flow-9-steps.spec.ts`(1 e2e · ~200 行 · 走完整 9 步)
- `tests/e2e/ip-flow-account-isolation.spec.ts`(1 e2e · 切账号 fresh · 新账号 0/9)

**files_to_modify** ·
- `playwright.config.ts`(可能需加 e2e timeout 600000 · 因为真 LLM 调用慢)

**test_command** · `pnpm playwright test tests/e2e/ip-flow-9-steps.spec.ts tests/e2e/ip-flow-account-isolation.spec.ts --project=chromium`

---

### **US-018 · PRD-4 收官 · 集成测试 + LLM Judge + lint clean + typecheck**

> **risk_level** · `medium`(收尾 · 跨 ws lint + typecheck + 全套测试)
> **priority** · 18
> **depends_on** · [US-001, ..., US-017](全)

**描述** · 收官 · pnpm test 全套(unit + integration + judge)≥ 259 tests 全过 · pnpm test:e2e 含 PRD-2/3/4 全 e2e ≥ 104 tests 全过 · pnpm typecheck 全 6 ws 0 error · pnpm --filter @quanqn/web lint clean(--max-warnings=0) · 修任何残留 lint debt(参 PRD-3 Patterns 防 PRD-1 lint debt 重现)。

**触发场景** · 跑 `pnpm test && pnpm test:judge && pnpm test:e2e && pnpm typecheck && pnpm lint` · 全过即收官。

**files_to_modify** · 任何残留 lint / typecheck error 处(预期 0)

**files_to_create** ·
- (无新文件)

**test_command** · `pnpm test && pnpm test:judge && pnpm test:e2e && pnpm typecheck && pnpm lint`

---

## §1.5 跨 Story 协议锁

> **理由** · PRD-4 18 stories 跨 7 Specialist + 9 step + 跨包(web/api)· 命名歧义会导致 ralph 在不同 story 脑补不同名字。本节预先锁定 · 每条 AC 必须显式写出锁定命名。

### A · 类型 / 方法签名锁

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `abstract class BaseSpecialist<TIn, TOut>` | abstract class | US-001 | US-004~US-010 | 模板方法 `execute(req: SpecialistRequest<TIn>) => Promise<SpecialistResponse<TOut>>` |
| `interface SpecialistConfig` | interface | US-001 | US-004~US-010 | 五层 · `persona` / `memory` / `knowledge` / `tools` / `execution`(架构 §4.7) |
| `interface SpecialistRequest<TIn>` | interface | US-001 | US-004~US-010 + US-011(form) | `{ accountId: number, mode?: string, userInput: TIn, traceId?: string }` |
| `interface SpecialistResponse<TOut>` | interface | US-001 | US-004~US-010 + US-012(渲染) | `{ result: TOut, isFallback: boolean, durationMs: number, tokensUsed: number, modelUsed: string, traceId: string }` |
| `class SchemaValidationError extends Error` | error class | US-001 | US-003 + US-015 | `{ zodError: ZodError, llmRawOutput: string }` |
| `class FallbackTriggeredError extends Error` | error class | US-001 | US-015 | `{ originalError: Error, fallbackResult: unknown }` |
| `class ContextAssembler` | class | US-002 | US-001(BaseSpecialist 内调) | `assemble(req) => Promise<AssembledContext>`(架构 §6.4) |
| `interface AssembleRequest` | interface | US-002 | US-001 | `{ agentId: string, accountId: number, mode?: string, userInput: unknown, needLayers?: ('L2_step_data' \| 'L4_profile' \| 'L4_samples')[], needRag?: ('knowledge_cases' \| 'trending' \| 'user_samples' \| 'history')[] }` |
| `interface AssembledContext` | interface | US-002 | US-001 | `{ systemPrompt: string, userPrompt: string, tools: ToolSchema[], metadata: { contextTokens: number, layersUsed: string[], ragHits: { source: string, count: number }[] } }` |
| `LLMGateway.complete(req)` | method | (PRD-2 已建) | US-001 + US-003 | `complete(req: CompleteRequest) => Promise<CompleteResponse>`(架构 §6.5)· `responseFormat: { type: 'json_schema', schema: ZodSchema }` |
| `LLMGateway.stream(req)` | method | (PRD-2 已建) | US-001 + US-007/009 长输出 | `stream(req: StreamRequest) => AsyncIterable<StreamChunk>` |
| `model_tier: 'reasoning' \| 'lightweight'` | enum literal | (PRD-2 已建) | US-001 + US-003 + 7 Specialist | REJ-003 不硬编码 model 名 · 由 LLMGateway 决定具体 model |
| `IPProgressService.getProgress(accountId)` | method | US-013 | `/ip-plan` 页 + e2e | `(accountId: number) => Promise<{ completed: number, total: 9, completedSteps: string[] }>` |

### B · StepData result JSON shape 锁(7 Specialist 输出 schema)

| stepKey | result schema(精确 zod) | 定义 story | 消费 story |
|---|---|---|---|
| `step1` | `z.object({ industry: z.string(), marketAnalysis: z.string().min(50), competitionLevel: z.enum(['low','medium','high']), recommendation: z.string().min(50) })` | US-004 | US-012 (Step1Result) |
| `step3_account_v3` | `z.object({ nickname: z.array(z.string()).length(5), avatar: z.object({ prompt: z.string(), style: z.string() }), background: z.object({ prompt: z.string(), platformVersions: z.array(z.string()).length(3) }), bio: z.array(z.object({ platform: z.enum(['douyin','xiaohongshu','wechat','kuaishou','bilibili']), text: z.string() })).length(6), overallStrategy: z.string() })` | US-005 packaging | US-012 (Step3Result) |
| `step3b_persona` | `z.object({ coreIdentity: z.string(), thoughtSystem: z.object({ coreBeliefs: z.array(z.string()).length(3), uniqueViews: z.array(z.string()).length(2), catchphrases: z.array(z.string()).length(3) }), contentPersona: z.object({ contentPillars: z.array(z.string()).length(4) }), trustBuilding: z.string(), personaRoadmap: z.object({ phase1: z.string(), phase2: z.string(), phase3: z.string() }) })` | US-005 persona | US-012 (Step3bResult) |
| `step4_execution_v2` | `z.object({ markdown: z.string().min(1000) })` · post-validate 必含 `# 执行计划` heading | US-004 execution | US-012 (Step4Result · markdown 渲染) |
| `step4b_monetization` | `z.object({ currentAnalysis: z.string(), ladder: z.array(z.object({ stage: z.string(), revenue: z.string(), action: z.string() })).length(3), revenueStructure: z.object({ primary: z.string(), secondary: z.array(z.string()).length(2) }), successCases: z.array(z.object({ title: z.string(), summary: z.string() })).length(2) })` | US-006 | US-012 (Step4bResult) |
| `step5_topics_v2` | `z.object({ category: z.enum(['traffic','monetize','persona','cognition','case']), topics: z.array(z.object({ title: z.string(), hook: z.string(), structure: z.string(), formula: z.string(), viralPotential: z.enum(['low','medium','high']) })).length(20) })` | US-007 | US-012 (Step5Result · ScrollArea h-96) |
| `step6_shooting` | `z.object({ shotList: z.array(z.object({ scene: z.string(), duration: z.string(), action: z.string(), dialogue: z.string(), cameraAngle: z.string(), prop: z.string(), lighting: z.string(), transition: z.string(), sfx: z.string(), voiceover: z.string(), subtitle: z.string(), costume: z.string(), location: z.string() })), equipment: z.array(z.string()), schedule: z.string() })` | US-008 | US-012 (Step6Result · 横向滚动 table) |
| `step7_copywriting` | `z.object({ markdown: z.string().min(500), structure: z.string(), hooks: z.array(z.string()).min(1), cta: z.string() })` · post-validate markdown 必含 `# 标题` heading | US-009 | US-012 (Step7Result · markdown + sidebar) |
| `step8_livestream` | `z.object({ lastResult: z.string().min(200), lastOptimizedResult: z.string().min(200) })` | US-010 | US-012 (Step8Result · 2 段对比) |

### C · feedback_log 接入锁(D-024 落地)

| 命名 | 类型 | 定义 story | 说明 |
|---|---|---|---|
| `feedback_log` 表 | DB table | US-014 | 复用 `cost_log` 表 + `event_type` 字段区分 · `event_type IN ('good','bad','specialist_call','judge_call')` · 不新建表(D-024) |
| `cost_log.event_type` | enum string | US-014 | `'good' \| 'bad' \| 'specialist_call' \| 'judge_call'`(扩展 PRD-2 schema · 加 migration) |
| `cost_log.target` | JSON column | US-014 | `{ stepKey, agentId, traceId }` · 给 PRD-8 EvolutionAgent 消费 |
| `cost_log.agent_id` | varchar(64) | US-014 | 'PositioningAgent' / 'BrandingAgent' / ... |
| `costLog.logFeedback(input)` procedure | tRPC mutation | US-014 | `input: { stepKey: string, agentId: string, type: 'good'\|'bad', traceId?: string }` · 写 cost_log(event_type=type · target={stepKey,agentId,traceId}) |
| `costLog.logSpecialistCall(input)` procedure | (内部 · 由 BaseSpecialist 调) | US-003 | `input: { stepKey, agentId, promptTokens, completionTokens, durationMs, modelUsed, traceId }` · 写 cost_log(event_type='specialist_call') |

### D · IPProgressService 锁

| 命名 | 类型 | 定义 story | 说明 |
|---|---|---|---|
| `IPProgressService.getProgress(accountId)` | method | US-013 | 返回 `{ completed: number, total: 9, completedSteps: string[] }` · 不计 step2(永远 404) |
| `STEP_KEYS_9` 常量 | readonly array | US-013 | `['step1','step3','step3b','step4','step4b','step5','step6','step7','step8']` as const · 长度 9 |

### E · 编号锁

- 定义 story 的 priority **必须小于**消费 story · ralph wave 调度依此
- 每条被引用的 AC **必须显式写出** `BaseSpecialist.execute` / `ContextAssembler.assemble` / `LLMGateway.complete` / `costLog.logFeedback` 等命名 · 不允许"通过 Specialist 抽象调"之类模糊表述
- AC 涉及 zod schema 时 · **必须嵌入完整 zod 表达式**(参表 B)· 不允许"按 step1 输出 schema 校验"模糊表述

---

## §2 验收标准(每 US 4 类 · H/E/B/P)

> **AC 类型说明** · `H` = Happy Path 主路径 · `E` = Edge Case 边缘 · `B` = Business 业务规则 · `P` = Performance 性能

---

### **AC-001 · BaseSpecialist 抽象 + 五层配置**(US-001 · foundation)

#### H · 主路径

- [ ] `apps/api/src/specialists/base/BaseSpecialist.ts` 导出 abstract class:
  ```typescript
  export abstract class BaseSpecialist<TIn = unknown, TOut = unknown> {
    protected abstract readonly config: SpecialistConfig;
    protected abstract readonly inputSchema: ZodSchema<TIn>;
    protected abstract readonly outputSchema: ZodSchema<TOut>;

    constructor(
      protected readonly contextAssembler: ContextAssembler,
      protected readonly llmGateway: LLMGateway,
      protected readonly prisma: PrismaClient,
    ) {}

    /** 模板方法 · 子类不重写 · 由父类组合 4 步 */
    async execute(req: SpecialistRequest<TIn>): Promise<SpecialistResponse<TOut>> {
      const t0 = Date.now();
      this.inputSchema.parse(req.userInput); // throw if invalid
      const ctx = await this.contextAssembler.assemble({
        agentId: this.config.persona.role,
        accountId: req.accountId,
        mode: req.mode,
        userInput: req.userInput,
        needLayers: this.config.memory.l2_read,
        needRag: this.config.knowledge.rag,
      });
      const llmResp = await this.invokeLLM(ctx);
      const validated = this.outputSchema.safeParse(llmResp.content);
      if (!validated.success) throw new SchemaValidationError(validated.error, llmResp.content);
      await this.writeCostLog({ ...llmResp, accountId: req.accountId, traceId: req.traceId, agentId: this.config.persona.role });
      return {
        result: validated.data,
        isFallback: false,
        durationMs: Date.now() - t0,
        tokensUsed: llmResp.tokens.total,
        modelUsed: llmResp.model,
        traceId: req.traceId ?? llmResp.trace_id,
      };
    }

    protected abstract invokeLLM(ctx: AssembledContext): Promise<CompleteResponse>;
  }
  ```
- [ ] `apps/api/src/specialists/base/types.ts` 导出 `SpecialistConfig` / `SpecialistRequest<TIn>` / `SpecialistResponse<TOut>` 接口 · 完全对齐 §1.5 表 A
- [ ] `apps/api/src/specialists/base/errors.ts` 导出 `SchemaValidationError` / `LLMTimeoutError` / `FallbackTriggeredError` 三个错误类
- [ ] 子类只需提供 `config: SpecialistConfig` + `inputSchema` + `outputSchema` + `invokeLLM` 4 项即可(测试用 `class TestSpecialist extends BaseSpecialist<X, Y>` 5 行验证)

#### E · 边缘

- [ ] `inputSchema.parse(req.userInput)` 失败 → throw ZodError(由 tRPC 转 BAD_REQUEST · 用户看 toast)· 不进入 LLM 调用
- [ ] `outputSchema.safeParse` 失败 → throw `SchemaValidationError(zodError, llmRawOutput)`(由 US-015 fallback 路径接管 retry)
- [ ] config 字段缺失(persona / memory / knowledge / tools / execution)→ tsc 编译期失败(类型 abstract readonly + Required<SpecialistConfig> 强制)
- [ ] `req.userInput` 类型跟 `inputSchema` 不匹配 → tsc 编译期失败(`SpecialistRequest<TIn>` 泛型)

#### B · 业务

- [ ] 五层配置完整 · `persona` / `memory` / `knowledge` / `tools` / `execution` 缺一不可(架构 §4.7)
- [ ] `execute()` 是**单次** LLM 调用(REJ-002 · D-017)· grep `for|while.*invokeLLM\|for|while.*llmGateway` 在 `apps/api/src/specialists/` 下命中 0(audit 必跑)
- [ ] 子类**不直接** import `@anthropic-ai/sdk` / `openai`(REJ-001 · D-018)· grep `from '@anthropic-ai/sdk'\|from 'openai'` 在 `apps/api/src/specialists/` 下命中 0
- [ ] 子类**不硬编码 model 名**(REJ-003 · D-019)· 通过 `this.config.execution.model_tier` 间接 · grep `'claude-\|'gpt-` 在 `apps/api/src/specialists/` 下命中 0
- [ ] writeCostLog 写完整字段(D-023)· `prompt_tokens`, `completion_tokens`, `duration_ms`, `model_used`, `agent_id`, `trace_id`, `account_id` 全填

#### P · 性能

- [ ] 类初始化(`new TestSpecialist(mockCtxAsm, mockGw, mockPrisma)`)< 5ms
- [ ] 不带 LLM 的 mock test 跑 100 次(用 mock LLMGateway 立即 resolve)< 1s
- [ ] tests/unit/specialists/base.test.ts ≥ 8 tests · 覆盖 input/output schema 校验 / 模板方法 4 步 / 错误降级 / 五层配置完整性 / mock 注入 / cost_log 写入
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-002 · ContextAssembler 完整实现**(US-002 · foundation)

#### H · 主路径

- [ ] `apps/api/src/services/context-assembler/ContextAssembler.ts` 导出 class:
  ```typescript
  export class ContextAssembler {
    constructor(
      private readonly prisma: PrismaClient,
      private readonly methodologyQuery: MethodologyQueryWorker,
    ) {}

    async assemble(req: AssembleRequest): Promise<AssembledContext> {
      const t0 = Date.now();
      const layers = req.needLayers ?? [];
      const rags = req.needRag ?? [];

      // 4 路并行 fetch · 各 5s timeout · allSettled 不阻断
      const [stepDataResult, profileResult, samplesResult, ragResult] = await Promise.allSettled([
        layers.includes('L2_step_data') ? this.fetchStepData(req.accountId) : Promise.resolve(null),
        layers.includes('L4_profile') ? this.fetchEvolutionProfile(req.accountId) : Promise.resolve(null),
        layers.includes('L4_samples') ? this.fetchSamples(req.accountId, req.userInput) : Promise.resolve(null),
        rags.length > 0 ? this.fetchRag(rags, req.userInput) : Promise.resolve([]),
      ].map(p => Promise.race([p, this.timeout(5000)])));

      // 拼 system prompt · 缺数据降级注入空段
      const template = await this.loadTemplate(req.agentId, req.mode);
      const systemPrompt = this.fillTemplate(template, {
        stepData: stepDataResult.status === 'fulfilled' ? stepDataResult.value : null,
        profile: profileResult.status === 'fulfilled' ? profileResult.value : null,
        samples: samplesResult.status === 'fulfilled' ? samplesResult.value : null,
        rag: ragResult.status === 'fulfilled' ? ragResult.value : [],
        constants: await this.methodologyQuery.get(this.config.knowledge.constants),
      });

      const userPrompt = this.formatUserInput(req.userInput, req.mode);

      return {
        systemPrompt,
        userPrompt,
        tools: [],  // 本 PRD 不含 L5 自治 · tools 留 PRD-8
        metadata: {
          contextTokens: this.estimateTokens(systemPrompt) + this.estimateTokens(userPrompt),
          layersUsed: layers.filter((_, i) => [stepDataResult, profileResult, samplesResult][i].status === 'fulfilled'),
          ragHits: rags.map((source, i) => ({ source, count: ragResult.status === 'fulfilled' ? (ragResult.value[i]?.length ?? 0) : 0 })),
        },
      };
    }

    private timeout(ms: number) { return new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), ms)); }
    // ...
  }
  ```
- [ ] 接口完全对齐 ARCHITECTURE §6.4(line 1888-1920)
- [ ] 7 Specialist 模板片段在 `templates/` · 每个文件 export `default function buildSystemPrompt(ctx): string`
- [ ] `MethodologyQueryWorker` 真接(PRD-2 worker 已建)· 拉常量(industries / hotElements / scriptTypes)

#### E · 边缘

- [ ] L2 stepData fetch 失败(DB 错)→ `stepDataResult.status='rejected'` → systemPrompt 用 `[新用户 · 暂无 step 数据]` 占位
- [ ] L4 EvolutionProfile fetch 返回 null(本期 PRD-8 才填) → systemPrompt 用 `[L1 阶段 · 暂无进化档案]` 占位(冷启动 §4.4 D · CS-2)
- [ ] L4 Samples fetch 返回 null → 跳过 samples 段 · 不报错
- [ ] L5 RAG · 本期 D-025 降级跑空 · ragResult 总返回 []
- [ ] 全部并行 fetch 都 reject(DB 全挂)→ systemPrompt 仍能拼接(降级模板 + userPrompt)· 不 throw
- [ ] req.agentId 不在 7 Specialist 名单(本期范围)→ throw `Error('Unknown agentId')`

#### B · 业务

- [ ] 4 路并行用 `Promise.allSettled` 不用 `Promise.all`(防一路 fail 拖死全部)
- [ ] 各路独立 5s timeout · `Promise.race([fetch, timeout(5000)])`
- [ ] `metadata.layersUsed` 真实反映哪些层 fetched 成功(给 audit 用)
- [ ] `metadata.contextTokens` 用 tiktoken / 简单字符数估算(本期可粗算 · 字符数 / 4)
- [ ] 系统 prompt 不允许包含 LLM key / API URL(LD-A-1 · R-001 · grep audit)

#### P · 性能

- [ ] 总 assemble 耗时 ≤ 800ms(并行 4 路 · cap 5s 但平均应 < 800ms · 给 LLM 留时间)
- [ ] tests/unit/services/context-assembler.test.ts ≥ 10 tests · 覆盖 4 路 fetch 各自 / 任一 timeout / 全 timeout / cold start 全空 / 7 Specialist agentId 合法 / 模板加载 / token 估算 / metadata 准确性
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-003 · LLMGateway 集成 BaseSpecialist + zod 校验 + cost_log**(US-003 · foundation)

#### H · 主路径

- [ ] BaseSpecialist 内 `invokeLLM` 抽象方法 · 子类按 streaming 与否实现 · 例 ·
  ```typescript
  protected async invokeLLM(ctx: AssembledContext): Promise<CompleteResponse> {
    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: ctx.userPrompt,
      responseFormat: { type: 'json_schema', schema: this.outputSchema },
      metadata: { trace_id: this.req.traceId, agentId: this.config.persona.role, accountId: this.req.accountId, userId: 0 },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });
  }
  ```
- [ ] `LLMGateway.complete` 已支持 `responseFormat: { type: 'json_schema', schema: ZodSchema }` · 若 PRD-2 未实现则在 `apps/api/src/workers/llm-gateway/index.ts` 补上(用 anthropic 的 tool_use mode 或 openai 的 json_schema mode)
- [ ] zod 校验 · `outputSchema.safeParse(llmResp.content)` · 失败时 BaseSpecialist 内 retry 1 次 · 二次失败 throw `SchemaValidationError(zodError, llmRawOutput)`
- [ ] cost_log 写入 · 完整字段 ·
  ```sql
  INSERT INTO cost_log (
    account_id, agent_id, event_type,
    prompt_tokens, completion_tokens, duration_ms, model_used,
    trace_id, target, created_at
  ) VALUES (
    $1, $2, 'specialist_call',
    $3, $4, $5, $6,
    $7, $8::jsonb, NOW()
  )
  ```
  其中 `target = '{"stepKey":"...","agentId":"..."}'::jsonb`(单一真理源 · 给 PRD-8 / PRD-11 消费)

#### E · 边缘

- [ ] LLMGateway timeout(超 execution.timeout_ms · 30000-120000)→ throw `LLMTimeoutError` → US-015 fallback
- [ ] LLMGateway 5xx / 限流 · LLMGateway 内已自动降级 reasoning → lightweight · 若仍失败 throw → US-015 fallback
- [ ] zod 校验失败第 1 次 → BaseSpecialist 重发(retry 1 · 同 prompt + `responseFormat` strict)· 第 2 次失败 throw
- [ ] cost_log 写失败(DB 错) → log error 但不影响主返回(用户已拿到 LLM 输出)· 监控告警留 PRD-11

#### B · 业务

- [ ] cost_log 字段完整(D-023)· prompt_tokens / completion_tokens / duration_ms / model_used / trace_id / agent_id / account_id 全填
- [ ] cost_log.event_type 默认 'specialist_call' · 区分 PRD-3 占位的 'audit_log'(已迁移)和 US-014 'good'/'bad'(用户反馈)
- [ ] 每次 LLM 调用 `trace_id` 用 `generateSpecialistTraceId(accountId, agentId)`(PRD-2 TraceId 命名分层 · 不要用 generateHttpTraceId)

#### P · 性能

- [ ] LLMGateway.complete 单次 < 30s(reasoning tier · timeout 默认 30000)· 长输出 step5/step7 用 stream
- [ ] cost_log 写入 < 50ms(单条 INSERT)
- [ ] tests/unit/specialists/base.llm.test.ts ≥ 6 tests · 覆盖 校验通过 / 校验失败 retry / cost_log 写入字段完整 / TraceId 用 specialist 不用 http
- [ ] tests/integration/api/specialist-llm.test.ts ≥ 1 test · 真调 LLMGateway nock SDK · cost_log 真写 DB · 查 SQL 返回数据
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-004 · PositioningAgent(step1 industry mode + step4 execution mode)**(US-004 · high)

#### H · 主路径

- [ ] `apps/api/src/specialists/PositioningAgent.ts` 继承 BaseSpecialist · 2 mode ·
  ```typescript
  export class PositioningAgent extends BaseSpecialist<Step1Input | Step4Input, Step1Output | Step4Output> {
    protected readonly config: SpecialistConfig = {
      persona: { role: 'PositioningAgent', goal: '行业洞察 + IP 定位', boundaries: ['不编造行业数据','基于 56 行业知识库'] },
      memory: { l1_readonly: ['account','currentStep'], l2_read: ['stepData'], l2_write: ['stepData'] },
      knowledge: { constants: ['industries'], rag: [], refresh_interval_sec: 600 },
      tools: ['llm.complete'],
      execution: { timeout_ms: 60000, retry: 1, model_tier: 'reasoning', streaming: false },
    };

    protected get inputSchema() {
      return z.union([
        Step1InputSchema,  // mode='industry'
        Step4InputSchema,  // mode='execution'
      ]);
    }

    protected get outputSchema() {
      // 按 mode 分支 · 用 z.discriminatedUnion 也可
      return this.req.mode === 'industry' ? Step1OutputSchema : Step4OutputSchema;
    }

    protected async invokeLLM(ctx: AssembledContext): Promise<CompleteResponse> {
      // execution mode · 长 markdown · 不走 stream(PRD-4 简化处理 · 等用户主动启 SSE)
      return super.invokeLLM(ctx);  // 父类已实现 · 子类不重写
    }
  }
  ```
- [ ] step1 输出 schema · 完整 zod(§1.5 表 B) ·
  ```typescript
  const Step1OutputSchema = z.object({
    industry: z.string(),
    marketAnalysis: z.string().min(50),
    competitionLevel: z.enum(['low', 'medium', 'high']),
    recommendation: z.string().min(50),
  });
  ```
- [ ] step4 输出 schema · markdown ·
  ```typescript
  const Step4OutputSchema = z.object({
    markdown: z.string().min(1000),
  }).refine((v) => /^# 执行计划/.test(v.markdown.trim()), { message: '必含 # 执行计划 heading' });
  ```
- [ ] `apps/api/src/trpc/routers/stepData.ts` `save` mutation 内 ·
  ```typescript
  if (input.stepKey === 'step1') {
    const resp = await positioningAgent.execute({ accountId: ctx.activeAccountId!, mode: 'industry', userInput: input.inputs, traceId: ctx.traceId });
    // 写 stepData
  } else if (input.stepKey === 'step4') {
    const resp = await positioningAgent.execute({ accountId: ctx.activeAccountId!, mode: 'execution', userInput: input.inputs, traceId: ctx.traceId });
    // 写 stepData
  }
  ```

#### E · 边缘

- [ ] step1 industry 不在 56 enum(用户自定义) → `INDUSTRY_KEYS` 兜底 · LLM 走通用 prompt(常量段注入 industries · LLM 自行处理自定义)
- [ ] step4 markdown 不含 `# 执行计划` heading → zod refine 失败 → retry 1 → 二次失败转 fallback
- [ ] mode 不在 ['industry', 'execution'] → tsc 编译期(`SpecialistRequest.mode: 'industry' | 'execution'`)+ runtime check(`if (!['industry','execution'].includes(mode)) throw new Error)
- [ ] cold start(account 无任何 stepData)→ ContextAssembler 注入 `[新用户 · 行业首次输入]` · LLM 走基础 prompt 不假设有 step3 等数据

#### B · 业务

- [ ] persona role = 'PositioningAgent' · 写入 cost_log.agent_id
- [ ] memory.l2_read = ['stepData'] · ContextAssembler 拉当前账号全部 stepData 注入 prompt
- [ ] knowledge.constants = ['industries'] · ContextAssembler 通过 MethodologyQueryWorker 注入 56 行业列表
- [ ] knowledge.rag = [] · 本 PRD D-025 不接 RAG
- [ ] tools = ['llm.complete'] · 不调 stream(step1 短 / step4 markdown 但本 PRD 不流式 · 留后续优化)
- [ ] execution.timeout_ms = 60000(step4 markdown 长 · 留余量)
- [ ] execution.model_tier = 'reasoning'(reasoning 输出更佳)
- [ ] step1/step4 是同一 Specialist 但 system prompt 不同 · ContextAssembler.templates/positioning.ts 按 mode 切换

#### P · 性能

- [ ] step1 reasoning · LLM 调用 < 30s(短输出)
- [ ] step4 reasoning · markdown 长输出 < 60s
- [ ] tests/unit/specialists/__tests__/PositioningAgent.test.ts ≥ 6 tests · 2 mode × 3 场景(happy / fallback / cold start)
- [ ] cost_log 写入(specialist_call · agent_id='PositioningAgent')每次都写
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-005 · BrandingAgent(step3 packaging + step3b persona)**(US-005 · high)

#### H · 主路径

- [ ] `apps/api/src/specialists/BrandingAgent.ts` 继承 BaseSpecialist · 2 mode + 2 复杂嵌套 outputSchema(§1.5 表 B step3_account_v3 + step3b_persona)
- [ ] step3 输出 schema 8KB · `nickname[5]` 数组长度 5 · `bio[6 platforms]` 数组长度 6 · `background.platformVersions[3]` 数组长度 3 · 全用 `z.array(...).length(N)` 强制
- [ ] step3b 输出 schema 6KB · `thoughtSystem.coreBeliefs[3]` / `uniqueViews[2]` / `catchphrases[3]` / `contentPersona.contentPillars[4]` 全 length 强制 · `personaRoadmap` 三阶段 phase1/phase2/phase3
- [ ] router stepData.save 内 stepKey='step3' / 'step3b' 调 brandingAgent.execute(mode='packaging' / 'persona')

#### E · 边缘

- [ ] step3 nickname LLM 输出 4 个(应 5)→ zod length(5) 失败 → retry 1 → 二次失败 fallback
- [ ] step3 bio 平台键不在 ['douyin','xiaohongshu','wechat','kuaishou','bilibili'] → enum 拒 → retry
- [ ] step3b coreBeliefs 输出 5 条(应 3) → length(3) 失败 → retry · 系统 prompt 强调"必须正好 3 条"
- [ ] mode 不在 ['packaging','persona'] → throw

#### B · 业务

- [ ] persona role = 'BrandingAgent'
- [ ] step3 / step3b 是**同一 Specialist 不同 mode** · 不要拆成 2 Specialist(REJ-002 防伪 Agent 行为 · 模板分支不是循环)
- [ ] memory.l2_read = ['stepData'] · ContextAssembler 注入历史 step1(行业)给 BrandingAgent 参考
- [ ] knowledge.constants = ['industries']
- [ ] execution.model_tier = 'reasoning'(嵌套深 / 输出大)
- [ ] execution.timeout_ms = 60000

#### P · 性能

- [ ] step3 reasoning · 8KB 输出 < 60s
- [ ] step3b reasoning · 6KB 输出 < 45s
- [ ] tests/unit/specialists/__tests__/BrandingAgent.test.ts ≥ 6 tests · 2 mode × 3 场景
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-006 · MonetizationAgent(step4b)**(US-006 · medium)

#### H · 主路径

- [ ] `apps/api/src/specialists/MonetizationAgent.ts` 继承 BaseSpecialist · 单 mode · 输出 8KB(§1.5 表 B step4b_monetization)
- [ ] outputSchema · ladder 长度 3 / successCases 长度 2 强制 zod
- [ ] router stepData.save · stepKey='step4b' 调 monetizationAgent.execute({ userInput })

#### E · 边缘

- [ ] ladder 输出 4 阶梯(应 3) → zod length(3) 失败 → retry → fallback
- [ ] currentRevenue 字段缺失(用户跳过) → input zod 加 `.optional()` · ContextAssembler 注入 "用户未填当前营收 · 按零基础推断"
- [ ] cold start(无 step1/step3) → ContextAssembler 注入 `[首次接触变现 · 暂无 IP 定位上下文]`

#### B · 业务

- [ ] persona role = 'MonetizationAgent'
- [ ] memory.l2_read = ['stepData'] · 注入 step1(行业)+ step3(账号)+ step4(执行)给 MonetizationAgent 推 ladder
- [ ] knowledge.constants = ['industries'] · 注入行业变现模式参考
- [ ] execution.model_tier = 'reasoning'
- [ ] execution.timeout_ms = 45000

#### P · 性能

- [ ] reasoning · 8KB 输出 < 45s
- [ ] tests/unit/specialists/__tests__/MonetizationAgent.test.ts ≥ 4 tests · happy / fallback / 边缘 / cold start
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-007 · TopicAgent(step5 · 22KB · 5 category SSE)**(US-007 · high)

#### H · 主路径

- [ ] `apps/api/src/specialists/TopicAgent.ts` 继承 BaseSpecialist · 单 mode 5 category · outputSchema 用 z.discriminatedUnion('category', ...) 5 路 · 每路 topics 长度 20 强制
- [ ] **走 SSE 流式** · 重写 invokeLLM ·
  ```typescript
  protected async invokeLLM(ctx: AssembledContext): Promise<CompleteResponse> {
    let accumulated = '';
    let finalTokens = { prompt: 0, completion: 0, total: 0 };
    let finalModel = '';
    for await (const chunk of this.llmGateway.stream({ ...this.buildStreamReq(ctx) })) {
      if (chunk.delta) accumulated += chunk.delta;
      if (chunk.final) {
        finalTokens = chunk.final.tokens;
        finalModel = chunk.final.model;
      }
    }
    return { content: JSON.parse(accumulated), tokens: finalTokens, model: finalModel, duration_ms: 0, trace_id: '' };
  }
  ```
- [ ] router stepData.saveStream procedure(新加 SSE subscription)· stepKey='step5' 时调 topicAgent.execute · 流式回前端

#### E · 边缘

- [ ] category 不在 5 enum → input zod 拒
- [ ] topics 输出 19 条(应 20) → zod length(20) 失败 → retry · 系统 prompt 强调"必须正好 20 条选题"
- [ ] viralPotential 不在 ['low','medium','high'] → enum 拒
- [ ] 流式断流(network 中断)→ accumulated 不完整 → JSON.parse 失败 → catch + retry 1 → fallback

#### B · 业务

- [ ] persona role = 'TopicAgent'
- [ ] memory.l2_read = ['stepData'] · 注入 step1(行业)+ step3b(人设)给 TopicAgent
- [ ] knowledge.constants = ['hotElements','scriptTypes'] · 22 元素 + 20 脚本类型
- [ ] knowledge.rag = ['knowledge_cases','trending'](本期 D-025 降级跑空)
- [ ] tools = ['llm.stream']
- [ ] execution.streaming = true · execution.timeout_ms = 60000

#### P · 性能

- [ ] reasoning + stream · 单 category 22KB 输出 < 60s
- [ ] 首 chunk < 3s(用户体验)
- [ ] tests/unit/specialists/__tests__/TopicAgent.test.ts ≥ 7 tests · 5 category × 1 + 2 边缘(断流 / length 失败)
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-008 · VideoAgent(step6 shooting · 13 列分镜表)**(US-008 · medium)

#### H · 主路径

- [ ] `apps/api/src/specialists/VideoAgent.ts` 继承 BaseSpecialist · shooting mode 单跑(其他 3 mode 留 PRD-6)· outputSchema 13 列分镜表(§1.5 表 B step6_shooting)
- [ ] shotList 数组 · 每元素 13 字段全填 · zod object 强制
- [ ] router stepData.save · stepKey='step6' 调 videoAgent.execute(mode='shooting')
- [ ] 接口预留 4 mode · `type VideoAgentMode = 'shooting' | 'production' | 'acquisition' | 'storyboard'` · 本期实现 shooting · 其他 mode `default: throw new Error('Not implemented · PRD-6')`

#### E · 边缘

- [ ] shotList 输出空数组 → zod min(1) 强制(至少 1 个分镜)
- [ ] mode='production' / 'acquisition' / 'storyboard' → throw `'Not implemented · PRD-6'`
- [ ] 用户 sourceCopy 字段超 5000 字符 → input zod 拒(防 token 爆)

#### B · 业务

- [ ] persona role = 'VideoAgent'
- [ ] memory.l2_read = ['stepData'] · 注入 step7 文案(若有)给 VideoAgent 拍摄方案
- [ ] knowledge.constants = ['hotElements'] · 22 元素辅助
- [ ] tools = ['llm.complete']
- [ ] execution.model_tier = 'reasoning'
- [ ] execution.timeout_ms = 45000

#### P · 性能

- [ ] reasoning · 5KB 输出 < 45s
- [ ] tests/unit/specialists/__tests__/VideoAgent.test.ts ≥ 4 tests · happy / fallback / 边缘 / 4 mode 接口预留
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-009 · CopywritingAgent(step7 · markdown 长 · SSE)**(US-009 · high)

#### H · 主路径

- [ ] `apps/api/src/specialists/CopywritingAgent.ts` 继承 BaseSpecialist · step7 mode 单(其他 3 mode 留 PRD-5)
- [ ] outputSchema(§1.5 表 B step7_copywriting) · markdown + structure + hooks[] + cta · post-validate 必含 `# 标题` heading + 至少 3 段
- [ ] **走 SSE 流式**(同 US-007 模式)· streaming=true / timeout_ms=60000
- [ ] router stepData.saveStream / copywriting.generate · stepKey='step7' 调 copywritingAgent.execute(mode='step7')
- [ ] `apps/api/src/trpc/routers/copywriting.ts` `generate` mock 替换 · 改调 copywritingAgent · 但保留 `optimize` / `list` / `delete` 现有 mock(留 PRD-5 升级)

#### E · 边缘

- [ ] markdown 不含 `# 标题` heading → refine 失败 → retry → fallback
- [ ] hooks 数组空 → min(1) 失败 → retry · 系统 prompt 强调"至少 1 个 hook"
- [ ] 流式断流 → 同 US-007 处理
- [ ] mode='free' / 'boom' / 'acquisition' → throw `'Not implemented · PRD-5'`

#### B · 业务

- [ ] persona role = 'CopywritingAgent'
- [ ] memory.l2_read = ['stepData'] · 注入 step1(行业)+ step3b(人设)+ step5(选题)给 CopywritingAgent
- [ ] memory.l2_write = ['history'] · 写 history 表(给 /history 页 PRD-3 用)
- [ ] knowledge.constants = ['hotElements','scriptTypes']
- [ ] knowledge.rag = ['knowledge_cases','formulas','user_samples'](本期 D-025 降级)
- [ ] tools = ['llm.stream']
- [ ] execution.streaming = true · execution.timeout_ms = 60000

#### P · 性能

- [ ] reasoning + stream · markdown 长输出 < 60s · 首 chunk < 3s
- [ ] tests/unit/specialists/__tests__/CopywritingAgent.test.ts ≥ 5 tests · happy / fallback / 流式断流 / heading 校验 / hooks 校验
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-010 · LivestreamAgent(step8)**(US-010 · medium)

#### H · 主路径

- [ ] `apps/api/src/specialists/LivestreamAgent.ts` 继承 BaseSpecialist · 单 mode · outputSchema(§1.5 表 B step8_livestream) · 2 段直播话术 lastResult / lastOptimizedResult
- [ ] router stepData.save · stepKey='step8' 调 livestreamAgent.execute({ userInput })

#### E · 边缘

- [ ] lastResult / lastOptimizedResult 长度 < 200 → zod min(200) 失败 → retry
- [ ] 用户 experience 字段(经验等级)不在 ['新手','中级','高级'] → input zod 拒

#### B · 业务

- [ ] persona role = 'LivestreamAgent'
- [ ] memory.l2_read = ['stepData'] · 注入 step1 + step3 给 LivestreamAgent
- [ ] knowledge.constants = ['industries']
- [ ] execution.model_tier = 'reasoning'
- [ ] execution.timeout_ms = 30000

#### P · 性能

- [ ] reasoning · 短输出 < 30s
- [ ] tests/unit/specialists/__tests__/LivestreamAgent.test.ts ≥ 4 tests · happy / fallback / 边缘 / cold start
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-011 · 9 步前端表单组件**(US-011 · medium)

#### H · 主路径

- [ ] `packages/schemas/src/specialist-io.ts` 导出 9 input schemas · 跨包共用 · 例 ·
  ```typescript
  export const Step1InputSchema = z.object({
    lastIndustry: z.enum(INDUSTRY_KEYS).or(z.string()),
  });
  export const Step3InputSchema = z.object({
    lastPlatform: z.enum(PLATFORM_KEYS),
    lastPersonalInfo: z.string().min(20).max(500),
    lastTargetAudience: z.string().min(5).max(200),
    lastCurrentAccount: z.string().max(50).default('新账号'),
  });
  // ... 其他 7 schemas(完全对齐 DATA-MODEL §4.3)
  ```
- [ ] `apps/web/src/components/StepForm/StepForm.tsx` generic wrapper ·
  ```tsx
  export function StepForm<TIn>({ stepKey, schema }: { stepKey: string, schema: ZodSchema<TIn> }) {
    const { register, handleSubmit, formState: { errors } } = useForm<TIn>({ resolver: zodResolver(schema) });
    const saveMutation = trpc.stepData.save.useMutation();
    const onSubmit = async (inputs: TIn) => {
      await saveMutation.mutateAsync({ stepKey, inputs });
    };
    return <form onSubmit={handleSubmit(onSubmit)}>{/* 按 stepKey 渲染字段 */}</form>;
  }
  ```
- [ ] 字段组件 · `IndustrySelect` / `PlatformSelect` / `CategorySelect` / `TextareaField` 等通用化 · web/admin 跨包共用
- [ ] 9 个 step 页(`apps/web/src/pages/step/Step1.tsx` ~ `Step9.tsx`)替换占位 h1 + 占位卡片 → `<StepForm stepKey="stepN" schema={StepNInputSchema} />`
- [ ] **闭环验收硬规则**(SKILL · UI Story 必须展开):
  - [ ] 使用 agent-browser 打开 `/step/1`
  - [ ] 选行业 'medical' → submit
  - [ ] 页面显示 "提交成功" + result 渲染(US-012)
  - [ ] 无控制台错误

#### E · 边缘

- [ ] zod 校验失败(必填字段空)→ formState.errors 显示 inline error · 不发请求
- [ ] mutation 失败(后端 LLM 错)→ toast.error('生成失败 · 请重试')
- [ ] 用户离开页面(unmount)中途 → AbortController 取消请求 · 不污染 saveMutation state
- [ ] 大表单(step3b 5 字段 · 总输入 < 1500 字符)→ 性能正常 · 无 lag

#### B · 业务

- [ ] **不在 step 页内重复渲染 FeedbackButton**(AGENTS.md §11.3 · StepLayout 已渲染)· grep `FeedbackButton` 在 `apps/web/src/pages/step/` 0 命中
- [ ] schema 单一真理源 · `packages/schemas/src/specialist-io.ts` web/api 共用 · web 不允许 inline 重复定义
- [ ] zod resolver · 错误信息中文(`message: '行业必填'` 不是英文)
- [ ] LD-015 · 0 hardcode color · grep `#[0-9a-fA-F]{6}` 在 `apps/web/src/components/StepForm/` 命中 0

#### P · 性能

- [ ] 表单首屏渲染 < 50ms
- [ ] mutation 提交后 loading state 立即显示(< 16ms · 无 lag)
- [ ] tests/unit/web/StepForm.test.tsx ≥ 5 tests · render / submit happy / zod fail inline error / mutation success / mutation error toast
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-012 · 9 步 result 渲染**(US-012 · medium)

#### H · 主路径

- [ ] `apps/web/src/components/StepResult/StepResult.tsx` generic ·
  ```tsx
  export function StepResult({ stepKey, data, isFallback }: { stepKey: string, data: unknown, isFallback: boolean }) {
    return (
      <div data-testid={`step-result-${stepKey}`}>
        {isFallback && <FallbackBanner />}
        {stepKey === 'step1' && <Step1Result data={data as Step1Output} />}
        {stepKey === 'step3' && <Step3Result data={data as Step3Output} />}
        {/* ... 9 路 switch */}
      </div>
    );
  }
  ```
- [ ] 9 个具体 Result 组件 · 各自渲染对应 schema · structured 用 shadcn Card · markdown 用 `react-markdown` + `remark-gfm` · step5 套 ScrollArea h-96(继承 AGENTS.md §11.4 · 防 viewport overflow)· step6 13 列 table 横向滚动
- [ ] **闭环验收硬规则**:
  - [ ] 使用 agent-browser 打开 `/step/1`
  - [ ] 选行业 'medical' → submit → 等待 LLM 响应
  - [ ] 页面显示 industry + marketAnalysis + competitionLevel + recommendation 4 段
  - [ ] 无控制台错误
- [ ] 9 个 step 页 submit 成功后渲染 `<StepResult stepKey={stepKey} data={result} isFallback={isFallback} />`

#### E · 边缘

- [ ] data 为 null(未生成)→ skeleton 占位
- [ ] data 字段缺失(LLM 输出 partial · zod 校验过但缺非必字段)→ 各 sub field 用 `??` 默认值兜底
- [ ] markdown 含 XSS 代码 → react-markdown 默认 sanitize · 不允许 `dangerouslySetInnerHTML`(audit grep)
- [ ] step5 20 选题 list 渲染 > 1000 行 DOM 节点 → ScrollArea h-96 + virtualize(可选 · 本期不强求)

#### B · 业务

- [ ] LD-015 · 0 hardcode color · grep 在 `apps/web/src/components/StepResult/` 命中 0
- [ ] AGENTS.md §11.4 · step5 list 套 ScrollArea + h-96 · 防 viewport overflow
- [ ] AGENTS.md §11.3 · 不重复渲染共享组件(FeedbackButton 由 StepLayout 渲染)
- [ ] react-markdown 不允许 dangerouslySetInnerHTML(LD-013 strict)
- [ ] data-testid 命名规范 · `step-result-{stepKey}`(给 e2e 用)

#### P · 性能

- [ ] 单 page render < 16ms(structured)/ < 100ms(markdown 长)
- [ ] 切 step 页时 result lazy load(用 React.lazy + Suspense)
- [ ] tests/unit/web/StepResult.test.tsx ≥ 9 tests · 每 step 1 个 render snapshot
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-013 · /ip-plan 接 stepData.progress 真数据**(US-013 · medium)

#### H · 主路径

- [ ] `apps/api/src/services/ip-progress/IPProgressService.ts` 替换 PRD-3 占位 ·
  ```typescript
  const STEP_KEYS_9 = ['step1','step3','step3b','step4','step4b','step5','step6','step7','step8'] as const;

  export async function getProgress(prisma: PrismaClient, accountId: number) {
    const completed = await prisma.stepData.findMany({
      where: { accountId, stepKey: { in: STEP_KEYS_9 }, status: 'completed' },
      select: { stepKey: true },
    });
    return {
      completed: completed.length,
      total: 9,
      completedSteps: completed.map(s => s.stepKey),
    };
  }
  ```
- [ ] `apps/api/src/trpc/routers/stepData.ts` · `progress` procedure · `protectedProcedure.input(...).query(({ ctx }) => getProgress(ctx.prisma, ctx.activeAccountId!))`
- [ ] `apps/web/src/components/StepProgress.tsx` 改用 `trpc.stepData.progress.useQuery()` 拉真数据 · 删 hardcoded `data: { completed: 0, total: 9 }` mock
- [ ] `apps/web/src/pages/IpPlan.tsx` 渲染 `<StepProgress />` · loading state 显示 skeleton
- [ ] **闭环验收硬规则**:
  - [ ] 使用 agent-browser 打开 `/ip-plan`(无 stepData 数据)→ 显示 0/9 + 9 个 pending step
  - [ ] 模拟创建 step1 stepData(直接调 trpc.stepData.save mock 或 e2e fixture) → 刷新 → 显示 1/9 + step1 高亮 'completed'
  - [ ] 创建 7 个 stepData(step1/3/3b/4/4b/5/6) → 刷新 → 7/9 + 7 高亮
  - [ ] 创建全 9 → 9/9 + 全高亮
  - [ ] 无控制台错误

#### E · 边缘

- [ ] 切账号(useActiveAccount.switchTo)→ React Query 失效 + reload(AGENTS.md §11.5)→ /ip-plan 重新拉新账号 progress(可能 0/9)
- [ ] step2 永远不计入(STEP_KEYS_9 长度 9 不含 step2)
- [ ] stepData status='in_progress' / 'failed' 不计入 completed
- [ ] 网络 fail · useQuery error → 显示 error skeleton 不 crash

#### B · 业务

- [ ] STEP_KEYS_9 是 readonly array · 长度 9 · 不含 step2 · 顺序固定(给 e2e 用)
- [ ] 走 protectedProcedure(LD-009 RLS · activeAccountId 自动注入)
- [ ] 不计 step9 复盘(spec.md §ⅩⅦ 路由注册但 UI 未上线)

#### P · 性能

- [ ] getProgress 单查询 < 50ms(单 SQL · 索引 [accountId, status])
- [ ] /ip-plan 首屏 < 1s(架构 §9.5 退出 · PRD-3 已达成)
- [ ] tests/unit/api/ip-progress.test.ts ≥ 4 新 tests · 0/9 / 3/9 / 9/9 / 切账号
- [ ] tests/integration/api/ip-progress-integration.test.ts ≥ 1 test · 创建账号 → 真插入 7 stepData → 查 progress = 7/9
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-014 · FeedbackButton 真接 feedback_log**(US-014 · medium)

#### H · 主路径

- [ ] `apps/api/prisma/schema.prisma` cost_log 表加 ·
  ```prisma
  model CostLog {
    // ... 现有字段
    eventType   String   @default("specialist_call") @db.VarChar(32) @map("event_type")
    // 'specialist_call' | 'good' | 'bad' | 'judge_call'
    agentId     String?  @db.VarChar(64) @map("agent_id")
    target      Json?    // { stepKey, agentId, traceId, accountId }
  }
  ```
- [ ] migration `<timestamp>_add_feedback_log_fields/migration.sql` 加上述 3 字段
- [ ] `apps/api/src/trpc/routers/costLog.ts` `logFeedback` procedure 升级 ·
  ```typescript
  logFeedback: protectedProcedure
    .input(z.object({ stepKey: z.string(), agentId: z.string(), type: z.enum(['good','bad']), traceId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.costLog.create({
        data: {
          accountId: ctx.activeAccountId!,
          eventType: input.type,
          agentId: input.agentId,
          target: { stepKey: input.stepKey, agentId: input.agentId, traceId: input.traceId },
          traceId: input.traceId ?? generateHttpTraceId(),
        },
      });
    }),
  ```
- [ ] `apps/web/src/components/FeedbackButton.tsx` props 加 `stepKey: string` + `agentId: string` · 调 `trpc.costLog.logFeedback.mutate({ stepKey, agentId, type })`
- [ ] `apps/web/src/layouts/StepLayout.tsx` 渲染 FeedbackButton 时传 stepKey(从 useParams 推导)+ agentId(从 stepKey → agentId 映射常量)
- [ ] **闭环验收硬规则**:
  - [ ] 使用 agent-browser 打开 `/step/1`
  - [ ] 点击 thumbs-up → mutation 发出 → 成功
  - [ ] 查 cost_log 表(testing fixture)→ 有 1 行 event_type='good' / agent_id='PositioningAgent' / target.stepKey='step1'
  - [ ] 无控制台错误

#### E · 边缘

- [ ] type 不在 ['good','bad'] → input zod 拒
- [ ] traceId 为空 → 用 generateHttpTraceId 生成兜底(防 trace 丢失)
- [ ] mutation 失败(DB 错)→ toast.error('反馈失败 · 请稍后') · 不阻断 UX
- [ ] 同一 stepKey 反复点击 → 允许多次记录(给 PRD-8 EvolutionAgent 看反馈密度 · 不去重)

#### B · 业务

- [ ] cost_log.event_type 默认 'specialist_call' · 用户反馈是 'good' / 'bad' · audit 'audit_log'(PRD-3 已迁移)· judge 'judge_call'(US-016)
- [ ] target JSON 字段含 stepKey + agentId + traceId · 给 PRD-8 EvolutionAgent 用 stepKey 索引 reduce
- [ ] LD-009 RLS · cost_log 跟 protectedProcedure · 跨账号查 admin 走 globalProcedure(P9.1)
- [ ] FeedbackButton 在 StepLayout 单点(不重复渲染 · AGENTS.md §11.3)

#### P · 性能

- [ ] logFeedback < 50ms(单 INSERT)
- [ ] tests/unit/api/feedback-log.test.ts ≥ 4 tests · logFeedback / event_type 枚举 / RLS 隔离 / target JSON 完整
- [ ] tests/e2e/feedback-log.spec.ts ≥ 1 test(/step/1 点击 → 查 DB)
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-015 · isFallback 降级路径**(US-015 · medium)

#### H · 主路径

- [ ] BaseSpecialist.execute() 加 try-catch ·
  ```typescript
  async execute(req: SpecialistRequest<TIn>): Promise<SpecialistResponse<TOut>> {
    try {
      // ... 主路径(US-001 + US-003)
    } catch (err) {
      if (err instanceof SchemaValidationError || err instanceof LLMTimeoutError || err.message?.includes('5xx')) {
        const fallback = (this.constructor as typeof BaseSpecialist).fallbackTemplate?.[req.mode ?? 'default'];
        if (!fallback) throw err; // 无模板 · 真错
        await this.prisma.stepData.create({ data: { /* ... */, isFallback: true, status: 'fallback' } });
        return { result: fallback as TOut, isFallback: true, durationMs: Date.now() - t0, tokensUsed: 0, modelUsed: 'fallback', traceId: req.traceId };
      }
      throw err;
    }
  }
  ```
- [ ] 7 Specialist 各加 `static readonly fallbackTemplate: { [mode: string]: SomeOutput }` · 包含通用占位文案
- [ ] `apps/web/src/components/StepResult/StepResult.tsx` 检测 isFallback prop → 渲染 `<FallbackBanner />` 警示 + "可重试"按钮
- [ ] FallbackBanner 含 "系统繁忙 · 此为备用版本" 文案 + 重试 button → 调 saveMutation.mutate(同 input)再试
- [ ] **闭环验收硬规则**:
  - [ ] 使用 agent-browser mock LLMGateway 失败(injection · 测试环境)→ 调 step1 → 后端返回 isFallback=true + fallbackTemplate
  - [ ] UI 显示 FallbackBanner + 重试按钮
  - [ ] 点重试 → 重新 mutation → 成功(LLMGateway mock 重置)→ banner 消失 · 显示真 result
  - [ ] 无控制台错误

#### E · 边缘

- [ ] 子类未提供 fallbackTemplate → catch 内 throw err(让用户看真错 · 不静默)
- [ ] fallbackTemplate 不符 outputSchema(开发疏忽)→ 静态 type guard + 测试断言
- [ ] DB 写 isFallback 失败 → log error · 不影响主返回(用户拿到 fallback)

#### B · 业务

- [ ] isFallback=true 时 stepData.status='fallback'(非 'completed')· /ip-plan progress **不计入 completed**(用户能看到差异)
- [ ] cost_log 写 event_type='specialist_call' + tokens_used=0 + model_used='fallback'(标识降级)
- [ ] FallbackBanner 必含"重试"按钮(用户可主动恢复)

#### P · 性能

- [ ] fallback 路径 < 100ms(无 LLM)
- [ ] tests/unit/specialists/fallback.test.ts ≥ 7 tests(每 Specialist 1 个 fallback 路径)
- [ ] tests/e2e/fallback.spec.ts ≥ 1 test(mock LLM fail · 验证 banner 显示 + 重试恢复)
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

### **AC-016 · LLM Judge 测试**(US-016 · medium)

#### H · 主路径

- [ ] `tests/judge/judge-runner.ts` 共享 ·
  ```typescript
  export async function runJudge(case_: JudgeCase): Promise<JudgeResult> {
    const llmGateway = new LLMGateway();
    const judgePrompt = `你是评测 AI · 严格按 criteria 判断 · 输出 JSON ...`;
    const userPrompt = `Input: ${JSON.stringify(case_.input)}\nActual: ${JSON.stringify(case_.actualOutput)}\nCriteria: ${case_.criteria}`;
    const resp = await llmGateway.complete({ model_tier: 'lightweight', systemPrompt: judgePrompt, userPrompt, responseFormat: { type: 'json_schema', schema: JudgeResultSchema }, metadata: { trace_id: '', agentId: 'judge', accountId: 0, userId: 0 }, retry: 1 });
    return resp.content as JudgeResult;
  }
  ```
- [ ] 7 个 judge case 文件 · `tests/judge/{positioning,branding,monetization,topic,video,copywriting,livestream}.judge.ts` · 每个含 input + expectedKeyFields + criteria
- [ ] `vitest.judge.config.ts` 独立 config · 排除常规 unit · CI 单独跑
- [ ] `package.json` 加 `"test:judge": "vitest run --config vitest.judge.config.ts"` script
- [ ] cost_log 写 event_type='judge_call' 区分

#### E · 边缘

- [ ] LLM judge flaky · 失败重跑 1 次再判(judge-runner 内置 retry 1)
- [ ] judge prompt 含 strict criteria · 输出 score 跟 pass 不一致 → 测试断言两者
- [ ] 7 case 中任 1 失败 → 整批 fail · CI 显示具体哪个

#### B · 业务

- [ ] judge 用 lightweight tier(haiku / 4o-mini)· 成本敏感
- [ ] cost_log event_type='judge_call' 区分 · admin 后台可统计
- [ ] golden case input 用真实场景(行业='medical' / 平台='douyin' 等)
- [ ] criteria 必须可量化("含至少 3 段 markdown" 不是 "看起来好")
- [ ] CI 跑 `pnpm test:judge` · 1 次 · 失败重跑 1 次

#### P · 性能

- [ ] 单 judge 跑(lightweight)< 10s
- [ ] 7 case 全跑 < 70s
- [ ] tests/judge/*.judge.ts 7 个 case 文件全在
- [ ] Typecheck passes
- [ ] Tests pass(judge 套独立)

---

### **AC-017 · 9 步 e2e 集成**(US-017 · high)

#### H · 主路径

- [ ] `tests/e2e/ip-flow-9-steps.spec.ts` ≥ 200 行 · 真接 LLMGateway · 走完整 9 步 · 验证每步 result + /ip-plan 9/9
- [ ] **闭环验收硬规则**(完整流程):
  - [ ] 使用 agent-browser 打开 `/`
  - [ ] 创建新 IP 账号(`trpc.ipAccounts.create`)
  - [ ] 切换到新账号(`trpc.ipAccounts.switchActive`)+ reload + clearLsNamespace(AGENTS.md §11.5)
  - [ ] 进 `/step/1` · 选行业 'medical' · submit · 等 LLM(< 60s) · 显示 result
  - [ ] 进 `/step/3` · 填平台 + 个人信息 + 受众 + 现有账号 · submit · 等 LLM(< 60s) · 显示 result
  - [ ] 进 `/step/3b` · 填平台 + 个人信息 + 受众 + 优势 + 故事 · submit · 等 LLM(< 45s) · 显示 result
  - [ ] 进 `/step/4` · 填平台 + 粉丝 + 目标 · submit · 等 LLM(< 60s) · 显示 markdown result
  - [ ] 进 `/step/4b` · 填产品 + 受众 + IP 定位 + 营收 · submit · 等 LLM(< 45s) · 显示 result
  - [ ] 进 `/step/5` · 选行业 + 产品 + category='traffic' · submit · 等 LLM 流式(< 60s) · 显示 20 选题
  - [ ] 进 `/step/6` · 填文案源 · submit · 等 LLM(< 45s) · 显示 13 列分镜表
  - [ ] 进 `/step/7` · 选脚本类型 + 元素 + 主题 · submit · 等 LLM 流式(< 60s) · 显示 markdown 文案
  - [ ] 进 `/step/8` · 填平台 + 产品 + 受众 + 经验 · submit · 等 LLM(< 30s) · 显示 2 段直播话术
  - [ ] 进 `/ip-plan` · 显示 9/9 + 9 个 step 全高亮
  - [ ] 无控制台错误
- [ ] `tests/e2e/ip-flow-account-isolation.spec.ts` 1 e2e · 切到 acc2(无 stepData)· /ip-plan 显示 0/9
- [ ] `playwright.config.ts` e2e timeout 600000(10 min · 真 LLM 调用慢)

#### E · 边缘

- [ ] 任 step LLM 失败(超时)→ fallback path → ip-plan 该 step 不计 completed · 9/9 不达标 → e2e fail
- [ ] 9 步顺序非强制(架构 §2.3 强依赖少)· 但本 e2e 按 step1→step3→...→step8 顺序跑 · 简化测试
- [ ] CI 关闭 · 仅 manual `pnpm playwright test ... --project=chromium` 本地跑 · 因为真 LLM cost 不可控

#### B · 业务

- [ ] e2e 标 `test.describe.serial` · 串行(防并发污染 DB)
- [ ] CI 关闭(playwright.config.ts 加 `--grep-invert "ip-flow-9-steps"`)· 本地 manual 跑
- [ ] 完整 9 步真 LLM cost 可能 $0.5-$1 / run · 接受 · 留 retro 评估归档结果
- [ ] 切账号 e2e 验证 LD-009 RLS · acc2 看不到 acc1 stepData

#### P · 性能

- [ ] 9 步全跑 < 10 min(7 reasoning + 2 lightweight · 平均 60s/step)
- [ ] /ip-plan 切换 < 1s
- [ ] tests/e2e/ip-flow-9-steps.spec.ts ≥ 200 行 · 1 e2e
- [ ] tests/e2e/ip-flow-account-isolation.spec.ts ≥ 50 行 · 1 e2e
- [ ] Typecheck passes
- [ ] Tests pass(playwright)

---

### **AC-018 · PRD-4 收官 · 集成测试 + LLM Judge + lint clean + typecheck**(US-018 · medium)

#### H · 主路径

- [ ] `pnpm test` 全套 ≥ 259 tests pass(PRD-3 累积 201 + PRD-4 新增 ≥ 58 = 259)
- [ ] `pnpm test:judge` 7 case pass(US-016)
- [ ] `pnpm test:e2e` ≥ 104 tests pass(PRD-3 累积 100 + PRD-4 新增 4 = 104 · chromium 52 + mobile 52)
- [ ] `pnpm typecheck` 全 6 ws 0 error
- [ ] `pnpm --filter @quanqn/web lint` 0 warnings(--max-warnings=0)
- [ ] **闭环验收硬规则**:
  - [ ] 跑 `pnpm test && pnpm test:judge && pnpm test:e2e && pnpm typecheck && pnpm lint`
  - [ ] 全过(exit code 0)
  - [ ] 每步耗时 + pass count 输出到 verify-artifacts/US-018/

#### E · 边缘

- [ ] 任 1 测试 fail → 整体 fail · 修后重跑
- [ ] lint 残留(PRD-3 防 PRD-1 lint debt 重现 · 本 PRD 防同类) → 修
- [ ] typecheck 跨 ws 任 1 error → 修

#### B · 业务

- [ ] 用同 SOP test_command(`pnpm test && pnpm test:e2e && pnpm typecheck && pnpm lint`)+ judge tier(独立)
- [ ] retro `prd-4-vs-prd-3-retrospective.md` 后续生成(/prd-retro 步骤)
- [ ] 跨 PRD 累积测试数 grep `tests passed` ≥ 259

#### P · 性能

- [ ] 全套 vitest < 5s(单元)+ < 30s(integration)= < 1min
- [ ] 全套 e2e < 30s(playwright fast)+ < 10min(ip-flow-9-steps 真 LLM)= < 11min
- [ ] judge 套 < 70s
- [ ] typecheck < 30s
- [ ] lint < 10s
- [ ] 总收尾 < 15min
- [ ] Typecheck passes
- [ ] Tests pass(全套)

---

## §3 范围排除

| # | 不做 | 理由 |
|:-:|---|---|
| 1 | DiagnosisAgent / AnalysisAgent / PrivateDomainAgent / DeepLearnAgent / VoiceChatAgent / EvolutionAgent / DailyTaskAgent(7 Specialist)| 留 PRD-5(创作)/ PRD-6(视频)/ PRD-7(私域+变现)/ PRD-8(L5 智能工具)分批实施 · 本期 7 主线 Specialist 已是最大 risk |
| 2 | 14 工具页(/generate / /analysis / /trending / /knowledge / /private-domain / /monetization 等)真接 Specialist | 留 PRD-5/6/7 · PRD-4 仅 9 步主线 · 14 工具页保留 PRD-3 mock(stepData router 改 + Specialist router 各自留 mock) |
| 3 | RAG 真启用(pgvector 检索 67 案例 / 22 元素 / trending) | 留 PRD-9 知识库 · ContextAssembler.needRag 字段先实现接口 · 内部降级跑空 · D-025 |
| 4 | EvolutionProfile / DeepLearningArchive 真写入 | 留 PRD-8 · 本期 ContextAssembler 读 EvolutionProfile 全降级跑空 + cold start 模板 · 写入留 PRD-8 EvolutionAgent |
| 5 | DailyTaskAgent 0 点 Cron / EvolutionAgent Heartbeat / VoiceChatAgent 多轮 | L5 自治 Agent 全留 PRD-8 · 本期不动 |
| 6 | step6 production / acquisition / storyboard mode + step5 trending mode | VideoAgent 仅 shooting · TopicAgent 仅 step5 5 category · 其他 mode 留 PRD-6 视频模块 |
| 7 | step7 boom / acquisition / free mode | CopywritingAgent 仅 step7 mode · 其他 mode 留 PRD-5 创作模块 |
| 8 | LLM Judge 真接 Opus 当 judge | 本期 lightweight tier(haiku / 4o-mini)· 成本敏感 · 高质量 judge 留 PRD-9 |
| 9 | feedback_log 触发 EvolutionAgent | 本期 feedback_log 仅 trace · 实 evolve 留 PRD-8 EvolutionAgent · D-024 |
| 10 | /step/2 永远不实施 · /step/9 复盘 UI | spec.md §ⅩⅦ 实测确认 · step2 路由 404 · step9 路由注册但 UI 未上线 · 留 PRD-8 评估 |
| 11 | admin 任何代码 | LD-A-1 严格分离 · admin 留 P9.0+ |
| 12 | TrendingScraper / ImageGen / FileParser / STT / TTS Worker 改造 | Worker 接口已建(PRD-2 stub)· 本 PRD 不动 · 留 PRD-6/8 用到时改造 |
| 13 | 多账号矩阵切换 reload 机制改造 | PRD-3 US-004 已实施 · clearLsNamespace + reload + 预热(AGENTS §11.5)· 本 PRD 不动 |
| 14 | step5 流式 SSE 端到端真接 React Query 订阅 | 本期 router stepData.saveStream procedure 加 SSE 接口 · 但前端订阅留 US-011 简化(用 mutation + loading state)· 真流式渲染留 PRD-5(同 CopywritingAgent SSE 升级时一起做) |

---

## §4 风险 + 缓解

| # | 风险 | 严重度 | 缓解 | 验证 |
|:-:|---|:-:|---|---|
| 1 | step5(22KB)/ step7(markdown 长) LLM 输出超 timeout | high | execution.timeout_ms 60000-120000 + SSE 流式(.stream) + retry 1 次 + execution.streaming=true | US-007 / US-009 单测 mock 长输出 + integration nock SSE 断流 / 完整 |
| 2 | LLM 输出不符 zod schema(REJ · 历史多次 mock 输出 partial fields) | high | response_format json_schema 强制 + 二次 retry + 失败转 isFallback 模板(US-015) | US-003 单测 zod fail → retry / US-015 fallback 路径 7 Specialist × 1 case |
| 3 | ContextAssembler 4 路并行慢 / 任一卡住阻塞 | medium | Promise.allSettled + 各路独立 5s timeout + 降级注入空段 · 不阻断主流程 | US-002 单测 timeout 模拟 / cold start 全空降级 / metadata.layersUsed 准确性 |
| 4 | TopicAgent 5 category 切分 prompt 复杂度高 · 模板分支多 | medium | 一个 Specialist 内部 mode + category 双分支 · 用 system prompt 模板 if-else · zod schema discriminatedUnion 各 category 独立 | US-007 单测 5 category 各跑一次 / 输出 schema 严格 length(20) |
| 5 | step4 / step7 是 markdown 字符串 · zod 校验难 | medium | step4/step7 outputSchema = `z.object({ markdown: z.string().min(N) })` + post-validate refine 检查必含 heading(`# `) · 不强求 JSON 结构 | US-009 / US-004 markdown 长度 + 必含字段(`# 标题`) |
| 6 | cost_log 累积爆炸(N 用户 × 9 步 × 每步 5K-22K tokens) | low | LLMGateway 已有 cost-logger · 本期仅追加用 · 不做归档 · 留 PRD-11 admin 成本仪表盘统计 + 报警 | US-003 单测 写入 / integration 7 Specialist × 1 跑一次写 cost_log · audit 跑 cost_log 行数 vs 调用次数 |
| 7 | TD-009 ralph.py 网络故障 ECONNRESET 消耗 retryCount(PRD-3 实证)| **high** | TD-010 已通过 Diff-1 apply ✓(VALIDATOR.md SUSPECTED/CONFIRMED 区分)· TD-009 留全局 v3 · 本 PRD high risk story(US-007/009/017)期间手动监控 · 撞 ECONNRESET 立即 reset retryCount(参 §9.6.5 SOP)| Opus audit 时跑 §0 4 项实测 + 监控 ralph-output.log ECONNRESET 关键词 |
| 8 | LLM 输出含 PII(用户隐私误泄)· LD-018 行业合规 | medium | LLMGateway responseInterceptor 加 PII 脱敏(已 PRD-2 mock · PRD-4 真启)· 输入也脱敏 · grep 输出含 11 位手机号 / 身份证号 0 命中 | US-003 集成测试 PII 输入(手机号 / 身份证)→ output 不含原文 · audit grep |
| 9 | 9 步表单 input schema 改动后 ralph 漏 update zod / TS 类型 | medium | DATA-MODEL §4.3 input schema 是单一真理来源 · packages/schemas/specialist-io.ts 共用 · web/api 都 import · grep 跨包重复定义 0 命中 | US-011 单测 schema 兼容 · typecheck 兜底 |
| 10 | LLM Judge 测试 flaky(LLM 输出非确定) | medium | Judge 用 lightweight tier · prompt 含 strict criteria + 多次跑取一致 · 失败重跑 1 次再判 · CI 关闭 manual 跑 | US-016 集成测试 7 Specialist × 1 golden case · CI 允许 1 次重试 |
| 11 | StepData 双写 LS+DB 顺序错乱(切账号期间)| medium | PRD-2 ADR-010 已锁定 LS 先写 · DB 后写 · 切账号时 useActiveAccount.switchTo 先 clearLsNamespace 再 reload(AGENTS §11.5)· 本 PRD 不动该机制 | US-013 e2e 切账号 fresh state · /ip-plan 显示新账号 0/9 |
| 12 | 9 步前端表单 + result 渲染 跨 PRD 兼容(PRD-3 占位代码不兼容新表单)| medium | 直接替换 PRD-3 占位 h1 + 占位卡片 · 用新 `<StepForm />` + `<StepResult />` · 删除 PRD-3 mock 静态文本 | US-011 + US-012 单测 + e2e |
| 13 | LLMGateway responseFormat json_schema 不支持 anthropic SDK 全部 zod 类型(如 z.refine)| medium | 用 anthropic 的 tool_use mode 或 openai 的 json_schema mode · 复杂 refine 移到 BaseSpecialist post-validate(在 zod safeParse 之后) | US-003 集成测试覆盖各种 schema 类型 |
| 14 | 7 Specialist 实施工作量大(7 × ~150 行 ~= 1000 行 + 7 × prompt 模板 ~= 1500 行) · 单 PRD 风险 | high | 7 Specialist 共用 BaseSpecialist · 子类只填配置(~150 行/子类)· prompt 模板独立文件 · 增量交付(US-004 → US-005 → ... → US-010)· 任一失败不阻断其他 | US-001~003 foundation 先稳 · 7 Specialist 平行可跑 · ralph wave 调度 |

---

## §5 测试配额(对齐 LD-016 + 架构 §7)

| 类型 | 期望 | 实施 | 累积 |
|---|:-:|---|:-:|
| 单元 | ≥ 30 | BaseSpecialist 8 + ContextAssembler 10 + 7 Specialist × 4-7 = 30-50 + StepForm 5 + StepResult 9 + ip-progress 4 + feedback-log 4 + fallback 7 = 77+ | 201(PRD-3)+ 77 = **278** |
| 集成 | ≥ 8 | 7 Specialist × 1(nock SDK)+ ContextAssembler 1(真 DB 7 路 fetch) | 8 |
| E2E | ≥ 4 | ip-flow-9-steps + ip-flow-account-isolation + feedback-log + fallback = 4 | 100(PRD-3)+ 4 = **104** |
| LLM Judge | ≥ 7 | 7 Specialist 各 1 golden case · lightweight tier | 7 |
| **合计** | ≥ **49 新** | | **397+** |

---

## §6 退出条件

ARCHITECTURE.md §9.5 P3 退出条件 ·
- ✅ 9 步全部能生成结果(7 Specialist 真接 LLMGateway · 不再 mock)· 验证 = US-017 e2e ip-flow-9-steps
- ✅ /ip-plan 显示完成度(stepData.progress 真数据 · 替换 PRD-3 hardcoded 0/9)· 验证 = US-013 + US-017
- ✅ 切账号后数据隔离(切到 acc2 · /ip-plan 显示 acc2 自己的 N/9 · 不串)· 验证 = US-017 ip-flow-account-isolation

加 ·
- ✅ ContextAssembler 完整版上线(L2 stepData / L4 EvolutionProfile 降级 / L4 Samples 降级 / L5 RAG 降级 / 常量真接)· 验证 = US-002 单测 + 集成
- ✅ LLM 输出 zod 校验全过 · 失败走 isFallback · 验证 = US-003 + US-015
- ✅ feedback_log 写入(替换 PRD-3 audit_log 占位 · P0 trace · 实 evolve 留 PRD-8)· 验证 = US-014
- ✅ cost_log 写 prompt_tokens / completion_tokens / duration_ms / model_used / agent_id / trace_id / account_id · 验证 = US-003 + audit grep
- ✅ LLM Judge 测试 7 case 全过(lightweight tier · golden output 比对)· 验证 = US-016
- ✅ pnpm typecheck 全 6 ws 0 error · 验证 = US-018
- ✅ pnpm --filter @quanqn/web lint clean(--max-warnings=0)· 验证 = US-018(防 PRD-1 lint debt 重现)
- ✅ Tests pass · 单元 ≥ 278 + 集成 ≥ 8 + e2e ≥ 104 + judge 7 = ≥ 397+ · 验证 = US-018

---

## §7 修订

- v0.1 · 2026-05-08 23:00 · prd skill (Opus) · **完整版**(无简化 · 用户"质量第一"指令 · §0 引用 + §1 全 18 US + §1.5 跨 Story 协议锁 + §2 全 18 AC × 4 类 + §3 范围 + §4 风险 + §5 测试 + §6 退出 + Locked Decisions D-016~D-025)· 1500+ 行

---

## Locked Decisions

> **跨 PRD 编号延续** · PRD-1/2/3 已用到 D-015 · PRD-4 从 D-016 起 · 不重置(SKILL 步骤 1C 强制规则)

- **D-016 · BaseSpecialist 用五层配置统一抽象** · 7 Specialist 子类只填 `config: SpecialistConfig` + `inputSchema` + `outputSchema` + `invokeLLM` 4 项 · 不重写 execute() 模板方法 · 五层 = persona/memory/knowledge/tools/execution(架构 §4.7 + 11/02 八 Agent 案例)
  - 原因 · 14 Specialist 维护成本 · 配置驱动 vs 各自实现 · 减少代码重复 · 跨 Specialist 行为一致 · 测试可注入 mock LLMGateway

- **D-017 · Specialist execute() 是单次 LLM 调用** · 95% Workflow + 5% Agent(留 L5 PRD-8)· grep `for|while.*invokeLLM\|llmGateway` 在 `apps/api/src/specialists/` 下命中 0 必 reject(REJ-002 + audit 必跑)
  - 原因 · 防伪 Agent 行为 · 多轮留 L5 PRD-8(VoiceChat/Evolution/DailyTask)· Workflow 可控 / Agent 难调试

- **D-018 · Specialist 不直接 import `@anthropic-ai/sdk` / `openai`** · grep 仅 `apps/api/src/workers/llm-gateway/index.ts` 1 处合法 · 其他 0 命中(REJ-001)
  - 原因 · R-1 唯一入口 · 限流/降级/计费/审计集中 · 模型迭代影响最小化 · LLD-012 红线

- **D-019 · Specialist 不硬编码 model 名** · 用 `model_tier: 'reasoning' | 'lightweight'` 通过 `this.config.execution.model_tier` 间接 · LLMGateway 决定具体 model · 降级集中处理(REJ-003)
  - 原因 · 模型迭代影响最小化 · cost 敏感 · 降级策略不分散

- **D-020 · ContextAssembler 4 路并行 fetch** · `Promise.allSettled` + 各路独立 5s timeout · 任一失败降级注入空段不阻断 · L2 stepData / L4 EvolutionProfile / L4 Samples / L5 RAG + 常量
  - 原因 · 数据源多 · 容错 · 架构 §4.4 D 冷启动场景全集要求安全降级 · 不让用户看 500 报错

- **D-021 · 长输出走 SSE 流式** · LLMGateway.stream() · step5(22KB)/ step7(markdown 长)用 stream · execution.streaming = true 配置 · 首 chunk < 3s
  - 原因 · 防 timeout · 用户体验首字节快 · 大输出分批渲染

- **D-022 · zod schema 校验 LLM 输出** · response_format json_schema 强制 + 失败 retry 1 次 · 二次失败转 isFallback 模板(US-015)
  - 原因 · LLM 输出不可预测 · 防垃圾数据落 DB · 用户能看到一致格式 · isFallback 兜底 UX

- **D-023 · cost_log 写完整字段** · `prompt_tokens` / `completion_tokens` / `duration_ms` / `model_used` / `agent_id` / `trace_id` / `account_id` 全填 · event_type 'specialist_call' / 'good' / 'bad' / 'judge_call' 区分
  - 原因 · 数据完整性 · 给 PRD-11 admin 域 ④(成本仪表盘)消费 · 给 PRD-8 EvolutionAgent 看 stepKey + agentId

- **D-024 · feedback_log 用 cost_log 表 + event_type='good'/'bad'** · 替换 PRD-3 audit_log 占位 · 复用 PRD-2 cost_log schema · 本期仅 trace · 实 evolve 留 PRD-8 EvolutionAgent
  - 原因 · 不重复建表 · 跨 PRD 数据可追溯 · 单一真理源给 admin / EvolutionAgent

- **D-025 · PRD-4 不实施 RAG** · ContextAssembler.needRag 字段保留接口 · 内部降级跑空(返回空数组)· 真接留 PRD-9 知识库
  - 原因 · RAG 全量启用依赖 67 案例 / 22 元素 / 23 公式入向量库 · 工程量大 · 留专属 PRD · 本期不阻断主流程

---

> **由 Opus 4.7(claude-opus-4-7[1m])在 PRD-3 收官后写 · 2026-05-08 23:00 · 严格按用户"质量第一 · 上下文不是借口"指令 · 完整版无简化 · 1500+ 行 · 18 US 全 4 类 AC · D-016~D-025 跨 PRD 延续 · 协议锁全填 · 反例库已注入。**
