# PRD-5 · P4 创作模块(4 工具页 · 共享 Specialist 第一次验证 · /history 接入)

> **派生** · ARCHITECTURE §9.6 + §2.4 14 工具表 + §4.3 14 Specialist 共享逻辑 + spec.md §Ⅷ.8.1/8.3(4 工具页 UI + SOP) + PROMPTS.md §5(CopywritingAgent 4 mode)+ §9(AnalysisAgent 2 mode)
> **风险** · **high** · **依赖** · PRD-1 ✅ + PRD-2 ✅ + PRD-3 ✅ + PRD-4 ✅(7 Specialist + ContextAssembler + LLMGateway + isFallback + Judge 套件 全就位)· **预估** · 2 周 · 12 US
> **目标** · 4 工具页(/generate · /boom-generate · /analysis · /video-analysis)+ /history 接入 · 共享 Specialist 验证可行性(CopywritingAgent 解锁 free+boom mode · AnalysisAgent 全新建)
> **branch** · `ralph/prd-5-p4-creation-modules`

---

## §0 引用清单

| 维度 | 来源 |
|---|---|
| 业务规格 | `aiipznt-spec.md` §Ⅷ 14 个独立功能模块(line 1789-2120 · 4 工具页完整 UI + 操作 SOP)+ §Ⅷ.8.1.2 video-analysis + §Ⅷ.8.2.3 boom-generate + §Ⅷ.8.3.1 generate + §Ⅷ.8.3.2 analysis |
| 架构 | `ARCHITECTURE.md` §9.6 P4 创作模块退出条件(line 2848-2857)+ §2.4 14 工具表(line 423-450)+ §4.3 14 Specialist 切分(line 1003-1029)+ §4.7 五层配置(line 1192-1262)+ §6.4 ContextAssembler(line 1888-1920)+ §6.5 LLMGateway(line 1922-1957) |
| Prompt | `PROMPTS.md` §5 CopywritingAgent 4 mode(line 766-863 · 含 step7/free/boom/acquisition 完整 prompt + 反馈飞轮注入)+ §9 AnalysisAgent 2 mode(line 1272-1376 · viral/structural 完整 prompt) |
| 数据 | `DATA-MODEL.md` §History(content + agentId + agentMode + sourceType + scriptType + elements + isFallback + traceId)+ §CostLog(eventType 字段 PRD-4 已加 + target jsonb · 复用为 feedback_log) |
| Specialist 沉淀 | `AGENTS.md` §11.6 后端 Specialist 实施沉淀(v0.4 · 2026-05-09 新增) · §11.6.1 BaseSpecialist 模板方法 / §11.6.2 ContextAssembler / §11.6.3 多 mode + race window / §11.6.4 SSE meta chunk / §11.6.5 responseFormat 双 schema / §11.6.6 stepData.save 全 9 step / §11.6.7 LLM Judge 套件 |
| 前端沉淀 | `AGENTS.md` §11.1 路由架构 + §11.3 StepLayout 防重复 + §11.4 ScrollArea + §11.5 IP 账号切换 + §11.2 packages/clients/router-types.ts |
| 反例库 | `~/.claude/playbooks/reject-examples.jsonl` · 17+ 条全量(REJ-001~035 + PRD-4 US-007 model 硬编码)· 关键 REJ-001(Specialist 不直接调 SDK)/ REJ-002(不 while 循环)/ REJ-003(不硬编码 model · D-019)/ REJ-004(单实例 export)/ REJ-007(多 mode outputSchema getter)/ REJ-008/009/013(RLS / executeRaw / TraceId 命名分层)/ REJ-010/035(LS-first dual-write) |
| 基础设施 | LLMGateway PRD-2 + PRD-4 升级(`apps/api/src/workers/llm-gateway/index.ts`)· BaseSpecialist + ContextAssembler + 7 Specialist + isFallback + Judge 套件 全 PRD-4 已就位 · `packages/schemas/src/specialist-io/` 子目录已成型(TD-015 accepted) |
| 既有 mock router | `apps/api/src/trpc/routers/copywriting.ts`(122 行 · PRD-2 mock + PRD-4 US-009 step7 真接)· `videoAnalysis.ts`(72 行 · 2 mock procedure)· `boomGenerate.ts`(48 行 · 1 mock procedure)· `analysis.ts`(不存在 · 新建)· `history.ts`(不存在 · 新建) |
| 退出 | ARCHITECTURE.md §9.6 退出条件 · 4 个页面跑通 + CopywritingAgent 4 mode 输出符合预期 + 用户能 👍/👎(后者已 PRD-4 US-014 落地 · 本期复用) |
| 沉淀 | `.planning/retros/PRD-4-RETRO.md` · §3 Codebase Patterns(SSE meta chunk · responseFormat 双 schema · vi.hoisted · vitest config .tsx · vite resolve.dedupe · workers=1)· §6 L4→L5 应固化机制(M-1 协议锁双对账 · M-2 multi-mode race) |
| Assumptions | `.planning/prd-5-assumptions.md` · 用户已 review "全部确认"(2026-05-09)· 12 US + 8 维度假设 + 10 LD(D-026~D-035)+ 19 文件协议锁(0 重大冲突 · TD-016 顺手修)|
| 全局规则 | 全局 CLAUDE.md §5 质量第一不简化 + §5.4 升档(downstream count ≥ 3 → foundation)+ §9.1 5 步启 daemon SOP + §9.6 size 拆分硬规则 + AGENTS.md §11.6 模板复用 |

★ **继承 PRD-4** ·
- BaseSpecialist 模板方法已稳定(`abstract class BaseSpecialist<TIn, TOut>` · 模板 4 步 · 子类只填 4 项)· 本期 AnalysisAgent 直接继承 · CopywritingAgent 解锁新 mode 不动 BaseSpecialist
- ContextAssembler 4 路并行 + 5s timeout · L4/L5 降级跑空 · MethodologyQueryWorker 真接 · 本期加 `templates/analysis.ts`(新 1 模板)
- 多 mode Specialist 模板(`_mode + outputSchema getter`)· TD-014 race window 文档化 · 本期 5 处复用(CopywritingAgent free/boom + AnalysisAgent 2 mode + 已有 4 Specialist)· 不动接口 · 留 PRD-7+ 治理
- SSE Specialist 模式 · stream meta chunk(D-019 闭环)· 本期 CopywritingAgent free/boom mode 直接继承
- responseFormat 双 schema 策略 · refine 不能序列化 · 本期 4 schema 全用此模式
- isFallback 路径(US-015) · BaseSpecialist try-catch · 本期 Specialist 全自带 fallbackTemplate
- LLM Judge 套件(US-016) · vitest.judge.config.ts 独立 · 本期加 4 新 golden case(free/boom/viral/structural)
- TraceId 命名分层(generateSpecialistTraceId · REJ-017)· 本期 4 router 全用

★ **继承 PRD-2** ·
- LD-009 RLS 多账号隔离 · 4 工具页全走 protectedProcedure · ctx.activeAccountId 自动注入
- cost_log 表 schema 已加 eventType + target Json(PRD-4 US-014 migration)· 本期复用同表写 generate/boom/analysis/videoAnalysis 调用日志
- TraceId 命名分层(`generateHttpTraceId` HTTP layer / `generateSpecialistTraceId` Specialist layer · TD-008 已修)· 本期 Specialist 严格用 specialist 版

★ **继承 PRD-3** ·
- AGENTS.md §11 前端沉淀(34 路由 · StepLayout 防重复 · ScrollArea + h-N · 切账号 reload + 预热)
- 4 工具页占位(Generate.tsx / BoomGenerate.tsx / Analysis.tsx / VideoAnalysis.tsx 各 18 行 PRD-3 US-002 创建)· 本期替换为真功能
- /history 模块占位(PRD-3 US-003)· 本期替换为真表格

★ **本 PRD 暂不做(留 PRD-6/7/8/9)** ·
- PRD-6 视频模块(/video-production · /acquisition-video · /ai-video · /trending · VideoAgent production/acquisition/storyboard mode + ImageGen Worker + TrendingScraper Worker · CopywritingAgent acquisition mode)
- PRD-7 私域 + 变现(/monetization 独立工具 + /private-domain 6 stage + DiagnosisAgent + EvolutionAgent + DailyTaskAgent)
- PRD-8 智能工具(3 L5 自治 · /voice-chat + /deep-learning · VoiceChatAgent + DeepLearnAgent)
- PRD-9 知识库 + RAG 全启用(67 案例 + 22 元素 + 23 公式入 pgvector)
- /present-styles 静态页(留 PRD-9 静态化)

---

## §1 用户故事(US-001 ~ US-012)

> **risk_level 标注** · 按 AGENTS.md §1.4 + AUDIT-CHECKLIST §Z + 全局 CLAUDE.md §5.4 升档(downstream count ≥ 3 → foundation)
> **优先级 priority** · 数字小者先跑 · ralph.py wave 调度依此

---

### **US-001 · Foundation · TD-016 修 + 4 schema 重写 + ContextAssembler analysis 模板 + ToolForm/ToolResult 抽象**

> **risk_level** · `foundation`(downstream 10 · 升档自 medium · 全 11 后续 US 都 depends_on 此)
> **priority** · 1
> **depends_on** · []

**描述** · 作为 PRD-5 的协议锁前置,我需要集中处理 4 件事:(1) 修 TD-016(`copywriting.list` 的 `where: { agentId: 'copywriting' }` 与 generate 写入的 `agentId: 'CopywritingAgent'` 大小写不一致 · 现 list 永空 · 同步 7 router agentId 全用 Class name)· (2) 重写 4 schema(`copywriting.schema.ts` / `videoAnalysis.schema.ts` / `boomGenerate.schema.ts` 现是 PRD-2 mock 时期通用 schema · 不匹配真业务字段 · 本期重写 + 新建 `analysis.schema.ts` + `constants.ts` 含 HOT_ELEMENT_KEYS_22 / SCRIPT_TYPE_KEYS_20)· (3) ContextAssembler 加 `templates/analysis.ts` + `index.ts` 加 'analysis' 入口 · (4) 抽象 `ToolForm` + `ToolResult` wrapper(类似 StepForm/StepResult 但 LS namespace 不同 · 不强制 stepKey · 服务 4 工具页)。

**触发场景** · ralph 实施起步前置 · 后续 11 US 全 depends_on 此 · 本 US 失败 → 后续全 blocked。

**为什么 foundation** · 11 后续 US 都消费此 US 的协议锁 / schema / wrapper · 总下游 11 → 必升 foundation。Audit 必须按 OPUS-AUDIT-CHEATSHEET §F4 + §F5(协议锁与既有代码现状双对账 · PRD-4 US-001 教训)严审。

**files_to_create** ·
- `packages/schemas/src/specialist-io/analysis.schema.ts`(viral + structural 输入/输出 zod schemas)
- `packages/schemas/src/specialist-io/constants.ts`(HOT_ELEMENT_KEYS_22 + SCRIPT_TYPE_KEYS_20 · inline · 不 import apps/api · D-033)
- `apps/api/src/services/context-assembler/templates/analysis.ts`(persona + methodology 段 · ~10 行 · 同其他 7 模板)
- `apps/web/src/components/ToolForm/ToolForm.tsx`(~600 行 · useForm + zodResolver + LS-first dual-write + AbortController · D-030)
- `apps/web/src/components/ToolForm/ScriptTypeSelect.tsx`(20 脚本类型 dropdown + ScrollArea h-72)
- `apps/web/src/components/ToolForm/ElementsMultiSelect.tsx`(22 爆款元素 4 组分类 + checkbox + ScrollArea h-96)
- `apps/web/src/components/ToolResult/ToolResult.tsx`(~80 行 · switch by toolKey · `freeGenerate`/`boomGenerate`/`analysis`/`videoAnalysis`)
- `apps/web/src/components/ToolResult/FreeGenerateResult.tsx`(react-markdown + remark-gfm · 同 Step7Result)
- `apps/web/src/components/ToolResult/BoomGenerateResult.tsx`(grid md:grid-cols-2 · 5 篇候选 split('---') · copy button per card)
- `apps/web/src/components/ToolResult/AnalysisResult.tsx`(5 维度 progress bar + optimizations 列表 + rewriteSnippet)
- `apps/web/src/components/ToolResult/VideoAnalysisResult.tsx`(elements tag + insights 列表 + rewriteVersion 全文 react-markdown)
- `apps/web/src/lib/ls-namespace.ts` 加 `getToolLsKey(accountId, toolKey, suffix)` export(D-031)
- `tests/unit/schemas/specialist-io.test.ts`(8 zod 验证 · analysis viral/structural input + output · constants HOT_ELEMENT_KEYS_22 + SCRIPT_TYPE_KEYS_20 长度)
- `tests/unit/web/ToolForm.test.tsx`(8 unit · useForm + zodResolver + LS dual-write + AbortController)
- `tests/unit/web/ToolResult.test.tsx`(4 unit · switch by toolKey)

**files_to_modify** ·
- `packages/schemas/src/specialist-io/copywriting.schema.ts`(重写 · 加 mode 字段 + 真业务 input/output · Step1FreeOutputSchema + BoomOutputSchema · 保留 step7 schema 兼容 PRD-4)
- `packages/schemas/src/specialist-io/videoAnalysis.schema.ts`(重写 · 删除 URL-based · 改 `analyzeVideoInput = z.object({ lastTitle: z.string().optional(), lastCopy: z.string().min(10).max(3000) })`)
- `packages/schemas/src/specialist-io/boomGenerate.schema.ts`(重写 · 删除 stepKey-based · 改 `generateBoomInput = z.object({ elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)).min(1).max(8), industry: z.string().optional(), theme: z.string().optional() })`)
- `packages/schemas/src/specialist-io/index.ts`(加 analysis + constants barrel export)
- `apps/api/src/trpc/routers/copywriting.ts`(line 106 修 `where: { agentId: 'CopywritingAgent' }` · 大写 Class name 规范 · TD-016)
- `apps/api/src/services/context-assembler/templates/index.ts`(SPECIALIST_TEMPLATES 加 'analysis' 入口)

**test_command** · `pnpm test tests/unit/schemas/specialist-io.test.ts tests/unit/web/ToolForm.test.tsx tests/unit/web/ToolResult.test.tsx && pnpm typecheck`

---

### **US-002 · Foundation · CopywritingAgent 解锁 free+boom + AnalysisAgent 新建**

> **risk_level** · `foundation`(downstream 8 · 升档自 high · 全 4 工具后端 + 4 前端都 depends_on 此 Specialist 改动)
> **priority** · 2
> **depends_on** · [US-001]

**描述** · 解锁 CopywritingAgent free + boom mode(currently throw 'Not implemented · PRD-5')+ 全新 AnalysisAgent(2 mode viral/structural · model_tier='lightweight' · 不需 reasoning)。CopywritingAgent 改动 · outputSchema getter 4 mode 全 cover(step7 ✓ / free 新加 / boom 新加 / acquisition 改 throw 'PRD-6')· invokeLLM 分支 free/boom 各 SSE stream(继承 PRD-4 US-007 _consumeStream 模式)· fallbackTemplate 加 free/boom 兜底(满足 schema 长度约束)。AnalysisAgent 新建 · 继承 BaseSpecialist · 单实例 export · 2 mode 用 _mode + outputSchema getter(D-028)· non-SSE(短输出 < 3KB · 不需 stream)· model_tier='lightweight' · timeout_ms=30000。

**触发场景** ·
- CopywritingAgent free mode · 用户在 `/generate` 工具页填表(scriptType + elements + topic) → submit → tRPC `copywriting.freeGenerate({ scriptType, elements, topic })` → router 调 `copywritingAgent.execute({ accountId, mode: 'free', userInput })`
- CopywritingAgent boom mode · 用户在 `/boom-generate` 工具页填表(elements + industry? + theme?) → submit → tRPC `boomGenerate.generate({ elements, industry, theme })` → router 调 `copywritingAgent.execute({ accountId, mode: 'boom', userInput })`
- AnalysisAgent viral mode · 用户在 `/video-analysis` 粘贴爆款文案 → submit → tRPC `videoAnalysis.analyze({ lastTitle?, lastCopy })` → router 调 `analysisAgent.execute({ accountId, mode: 'viral', userInput })`
- AnalysisAgent structural mode · 用户在 `/analysis` 粘贴自己的文案 → submit → tRPC `analysis.analyze({ copy })` → router 调 `analysisAgent.execute({ accountId, mode: 'structural', userInput })`

**为什么 foundation** · 4 工具后端 US(US-003/005/007/009) + 4 前端 US(US-004/006/008/010) 全 depends_on 这 2 Specialist · 总下游 8 → 必升 foundation。Audit 必须严审 multi-mode race(TD-014 文档化)+ acquisition throw 文案改 'PRD-6'(R4)+ stream meta chunk 模式继承(D-019)。

**files_to_create** ·
- `apps/api/src/specialists/AnalysisAgent.ts`(~250 行 · 2 mode · _mode getter · ViralOutputSchema + StructuralOutputSchema · invokeLLM 单 LLMGateway.complete · fallbackTemplate viral/structural · 单例 export `analysisAgent`)
- `tests/unit/specialists/__tests__/AnalysisAgent.test.ts`(≥ 8 unit · 2 mode × 4 场景 = happy / fallback / cold-start / config 验证 · vi.hoisted)

**files_to_modify** ·
- `apps/api/src/specialists/CopywritingAgent.ts`(line 107-108 outputSchema getter 改 4 mode 分支 · line 158-160 invokeLLM 内 mode check 改 acquisition throw 'PRD-6' · 加 free/boom mode invokeLLM 分支(SSE stream + _consumeStream 复用 step7 模式)· 加 free/boom fallbackTemplate)
- `tests/unit/specialists/__tests__/CopywritingAgent.test.ts`(加 free/boom 各 4 场景 = 8 新 tests · 现 9 + 8 = 17 tests)
- `apps/api/src/services/context-assembler/templates/copywriting.ts`(扩 4 mode persona + methodology 段 · 现仅 step7 · 加 free/boom 段)
- `apps/api/src/services/context-assembler/templates/analysis.ts`(US-001 创建 · 本 US 完善 viral/structural 模板内容)

**反例 grep**(US-002 audit 必跑)·
- `grep -rn "@anthropic-ai/sdk\|openai" apps/api/src/specialists/{Copywriting,Analysis}Agent.ts` 应 0 命中(REJ-001 D-018)
- `grep -rEn "for.*invokeLLM\|while.*invokeLLM" apps/api/src/specialists/{Copywriting,Analysis}Agent.ts` 应 0 命中(REJ-002)
- `grep -rEn "claude-[0-9]\|gpt-[0-9]" apps/api/src/specialists/{Copywriting,Analysis}Agent.ts | grep -v "test\|spec\|//"` 应 0 命中(REJ-003 D-019)
- `grep -E "stream.meta.model\|streamChunk.meta" apps/api/src/specialists/CopywritingAgent.ts` 应 ≥ 2 命中(free + boom 都用 meta chunk · D-019 闭环)
- `grep "Not implemented · PRD-5" apps/api/src/specialists/CopywritingAgent.ts` 应 0 命中(全替换为 'PRD-6' · D-035 R4)
- `grep "export const analysisAgent\b" apps/api/src/specialists/AnalysisAgent.ts` 应 1 命中(单实例 · REJ-004)

**test_command** · `pnpm test tests/unit/specialists/__tests__/{Copywriting,Analysis}Agent.test.ts && pnpm typecheck`

---

### **US-003 · Wave 1 · /generate 后端 · copywriting.freeGenerate procedure 真接 CopywritingAgent free mode**

> **risk_level** · `high`(真 LLM 调用 · SSE stream · cost_log 写入)
> **priority** · 3
> **depends_on** · [US-002]

**描述** · 在 `apps/api/src/trpc/routers/copywriting.ts` 新增 `freeGenerate` procedure(D-026 选项 B · 不动 generate)· 调 `copywritingAgent.execute({ accountId, mode: 'free', userInput: { scriptType, elements, topic } })` · 写 history 表(agentId='CopywritingAgent' · agentMode='free' · sourceType='user' · content=真 markdown · contentType='markdown' · scriptType + elements 填全 · isFallback / tokensUsed / modelUsed / durationMs / traceId 全填) · 返回 `{ id, content, agentId, traceId, createdAt }`。

**触发场景** · 用户在 `/generate` 工具页 submit 表单 → tRPC `copywriting.freeGenerate.useMutation({ scriptType, elements, topic })` → router 内调 `copywritingAgent.execute({ mode: 'free', userInput })` → SSE 流式输出累积 → 返回 history row。

**files_to_modify** ·
- `apps/api/src/trpc/routers/copywriting.ts`(加 `freeGenerate` procedure · ~50 行 · 用 `copywritingFreeGenerateInput` schema from packages/schemas)

**files_to_create** ·
- `tests/integration/api/copywriting-free-llm.test.ts`(1 integration test · nock SDK + 真 DB cost_log + history 写入 · 查 SQL 验证)
- `tests/unit/api/copywriting-router.test.ts`(若不存在新建 · 4 unit · freeGenerate happy + zod fail + Specialist throw → fallback + agentMode 字段填充)

**test_command** · `pnpm test tests/unit/api/copywriting-router.test.ts tests/integration/api/copywriting-free-llm.test.ts && pnpm typecheck`

---

### **US-004 · Wave 1 · /generate 前端 · Generate.tsx 真表单 + ToolForm 复用**

> **risk_level** · `medium`(前端表单 · LS dual-write · ToolResult 渲染)
> **priority** · 4
> **depends_on** · [US-001, US-003]

**描述** · 替换 `apps/web/src/pages/tools/Generate.tsx` PRD-3 占位 · 真表单(`<ToolForm toolKey="freeGenerate" schema={Step1FreeInputSchema}>` + ScriptTypeSelect 20 脚本 + ElementsMultiSelect 22 爆款元素 + topic textarea max 500 字)· submit 调 `trpc.copywriting.freeGenerate.useMutation` · onSuccess → setResult → 渲染 `<ToolResult toolKey="freeGenerate" data={result} isFallback={result.isFallback} />`(react-markdown + remark-gfm)· LS namespace `acc_{id}_tool_freeGenerate_input`(D-031)· LS-first dual-write(REJ-035) · AbortController on unmount。

**触发场景** · 用户访问 `/generate` → 看到表单(预填 LS 历史输入)→ 选脚本类型 + 选元素 + 填主题 → 点"生成文案" → loading → 看到 markdown 长文 → 可 👍/👎(FeedbackButton 复用 PRD-4)。

**files_to_modify** ·
- `apps/web/src/pages/tools/Generate.tsx`(替换占位 · 真表单)

**files_to_create** ·
- `tests/unit/web/pages/Generate.test.tsx`(≥ 5 unit · 表单 render + zod 校验 + mutation 成功 + mutation 失败 toast.error + LS 预填)
- `tests/e2e/tool-generate.spec.ts`(1 e2e · CI mock · 填表 → submit → 看结果出现 + isFallback false)

**test_command** · `pnpm test tests/unit/web/pages/Generate.test.tsx && pnpm typecheck && pnpm test:e2e tests/e2e/tool-generate.spec.ts`

---

### **US-005 · Wave 1 · /boom-generate 后端 · boomGenerate.generate 真接 CopywritingAgent boom mode**

> **risk_level** · `high`(真 LLM · 5 篇候选 markdown · cost_log)
> **priority** · 5
> **depends_on** · [US-002]

**描述** · 替换 `apps/api/src/trpc/routers/boomGenerate.ts` 现 mock · `generate` procedure 调 `copywritingAgent.execute({ accountId, mode: 'boom', userInput: { elements, industry?, theme? } })` · 写 history **1 行**(D-032 · content=5 篇 markdown 用 '---' 分隔 · agentId='CopywritingAgent' · agentMode='boom' · scriptType=null · elements 填全 · contentType='markdown')· 返回 history row。

**触发场景** · 用户在 `/boom-generate` 工具页 submit 表单 → tRPC `boomGenerate.generate.useMutation({ elements, industry, theme })` → router 调 boom mode → SSE 流式累积 → JSON.parse 5 篇候选数组 → join '---' 写 history → 返回。

**files_to_modify** ·
- `apps/api/src/trpc/routers/boomGenerate.ts`(改 generate · 调 copywritingAgent · 不再写 mock · 用 `generateBoomInput` schema from packages/schemas · 重写后)

**files_to_create** ·
- `tests/integration/api/boom-generate-llm.test.ts`(1 integration test · nock SDK + 5 篇候选 → 1 行 history 含 '---' 分隔 · cost_log 写入)
- `tests/unit/api/boom-generate-router.test.ts`(4 unit · happy + zod fail elements 空 + boom Specialist throw → fallback + agentMode='boom')

**test_command** · `pnpm test tests/unit/api/boom-generate-router.test.ts tests/integration/api/boom-generate-llm.test.ts && pnpm typecheck`

---

### **US-006 · Wave 1 · /boom-generate 前端 · BoomGenerate.tsx 真表单 + 5 篇候选渲染**

> **risk_level** · `medium`(前端 · grid 渲染 · split '---' 5 篇)
> **priority** · 6
> **depends_on** · [US-001, US-005]

**描述** · 替换 `apps/web/src/pages/tools/BoomGenerate.tsx` PRD-3 占位 · 真表单(`<ToolForm toolKey="boomGenerate" schema={GenerateBoomInputSchema}>` + ElementsMultiSelect 22 爆款元素 + industry input 默认当前账号 + theme input optional)· submit 调 `trpc.boomGenerate.generate` · onSuccess → setResult → 渲染 `<ToolResult toolKey="boomGenerate" data={result} />`(grid md:grid-cols-2 · split '---' 5 篇 · 每篇 Card + copy button + 字数统计)· LS namespace `acc_{id}_tool_boomGenerate_input`。

**触发场景** · 用户访问 `/boom-generate` → 多选爆款元素 → 选行业(默认当前账号 industry)→ 填主题方向(可选)→ 点"一键生成爆款文案" → loading → 看到 5 篇候选 grid · 每篇可单独复制。

**files_to_modify** ·
- `apps/web/src/pages/tools/BoomGenerate.tsx`(替换占位)

**files_to_create** ·
- `tests/unit/web/pages/BoomGenerate.test.tsx`(≥ 5 unit · 表单 render + 5 篇 split + copy button)
- `tests/e2e/tool-boom-generate.spec.ts`(1 e2e · CI mock 5 篇 · 选元素 → submit → 5 卡片渲染)

**test_command** · `pnpm test tests/unit/web/pages/BoomGenerate.test.tsx && pnpm typecheck && pnpm test:e2e tests/e2e/tool-boom-generate.spec.ts`

---

### **US-007 · Wave 1 · /analysis 后端 · 新建 analysis.ts router · analyze procedure 真接 AnalysisAgent structural mode**

> **risk_level** · `high`(全新 router · 真 LLM · 5 维度评分)
> **priority** · 7
> **depends_on** · [US-002]

**描述** · 新建 `apps/api/src/trpc/routers/analysis.ts` router · `analyze` procedure 调 `analysisAgent.execute({ accountId, mode: 'structural', userInput: { copy } })` · 写 history(agentId='AnalysisAgent' · agentMode='structural' · sourceType='user' · content=stringified `{ scores, optimizations, rewriteSnippet }` · contentType='json' · scriptType=null · elements=null) · 返回 history row。在 `_app.ts` 注册 `analysis: analysisRouter`。

**触发场景** · 用户在 `/analysis` 工具页粘贴自己的文案 → submit → tRPC `analysis.analyze.useMutation({ copy })` → router 调 structural mode → 单 LLMGateway.complete · short timeout 30s → 写 history → 返回。

**files_to_create** ·
- `apps/api/src/trpc/routers/analysis.ts`(~70 行 · `analyze` procedure)
- `tests/integration/api/analysis-structural-llm.test.ts`(1 integration · nock SDK + history 写入)
- `tests/unit/api/analysis-router.test.ts`(4 unit · happy + zod fail empty copy + Specialist throw → fallback + agentMode='structural')

**files_to_modify** ·
- `apps/api/src/trpc/_app.ts`(注册 `analysis: analysisRouter`)
- `packages/clients/src/router-types.ts`(shadow router 加 analysis · `analyze` query 含 input + output type)

**test_command** · `pnpm test tests/unit/api/analysis-router.test.ts tests/integration/api/analysis-structural-llm.test.ts && pnpm typecheck`

---

### **US-008 · Wave 1 · /analysis 前端 · Analysis.tsx 真表单 + 5 维度 progress bar 渲染**

> **risk_level** · `medium`(前端 · 评分可视化 · 优化列表)
> **priority** · 8
> **depends_on** · [US-001, US-007]

**描述** · 替换 `apps/web/src/pages/tools/Analysis.tsx` PRD-3 占位 · 真表单(`<ToolForm toolKey="analysis" schema={AnalysisStructuralInputSchema}>` + copy textarea min 10 + 字符计数)· submit 调 `trpc.analysis.analyze` · onSuccess → setResult → 渲染 `<ToolResult toolKey="analysis" data={result} />`(JSON.parse content → 5 维度 Progress bar 含 score · 颜色按 80+/60+/<60 红黄绿 · optimizations Card 列表 含 dimension+issue+suggestion · rewriteSnippet 高亮 Card)· LS namespace `acc_{id}_tool_analysis_input`。

**触发场景** · 用户访问 `/analysis` → 粘贴文案 → 点"开始分析" → loading → 看到 5 维度评分 + 3-5 优化建议 + rewriteSnippet。

**files_to_modify** ·
- `apps/web/src/pages/tools/Analysis.tsx`(替换占位)

**files_to_create** ·
- `tests/unit/web/pages/Analysis.test.tsx`(≥ 5 unit · 表单 render + 5 维度 Progress bar + 颜色逻辑)
- `tests/e2e/tool-analysis.spec.ts`(1 e2e · CI mock · 粘贴文案 → submit → 5 维度渲染)

**test_command** · `pnpm test tests/unit/web/pages/Analysis.test.tsx && pnpm typecheck && pnpm test:e2e tests/e2e/tool-analysis.spec.ts`

---

### **US-009 · Wave 1 · /video-analysis 后端 · videoAnalysis.analyze 真接 AnalysisAgent viral mode + 删 rewrite mock**

> **risk_level** · `high`(替换 mock · schema 重写 · 真 LLM)
> **priority** · 9
> **depends_on** · [US-002]

**描述** · 替换 `apps/api/src/trpc/routers/videoAnalysis.ts` 现 mock · `analyze` procedure 用重写后的 schema(US-001 已重写 · `lastCopy + lastTitle?` 非 URL)· 调 `analysisAgent.execute({ accountId, mode: 'viral', userInput: { lastCopy, lastTitle } })` · 写 history(agentId='AnalysisAgent' · agentMode='viral' · sourceType='user' · content=stringified `{ analysis, insights, rewriteVersion }` · contentType='json' · elements=analysis.elements 数组 · scriptType=null) · 返回 history row。**删除 `rewrite` procedure**(D-028 · viral mode 已含 rewriteVersion · 不需独立 procedure · 减少表面积)· 同步删 packages/clients/src/router-types.ts shadow rewrite。

**触发场景** · 用户在 `/video-analysis` 粘贴爆款文案 + 标题(选填) → submit → tRPC `videoAnalysis.analyze.useMutation({ lastTitle, lastCopy })` → router 调 viral mode → 单 LLMGateway.complete → 写 history → 返回。

**files_to_modify** ·
- `apps/api/src/trpc/routers/videoAnalysis.ts`(改 analyze · 调 analysisAgent · 删 rewrite procedure · ~70 → ~50 行)
- `packages/clients/src/router-types.ts`(shadow router 改 videoAnalysis.analyze input/output · 删 rewrite)

**files_to_create** ·
- `tests/integration/api/video-analysis-viral-llm.test.ts`(1 integration · nock SDK + history 写入 + elements 字段验证)
- `tests/unit/api/video-analysis-router.test.ts`(4 unit · happy + zod fail empty lastCopy + Specialist throw → fallback + elements 数组传递)

**test_command** · `pnpm test tests/unit/api/video-analysis-router.test.ts tests/integration/api/video-analysis-viral-llm.test.ts && pnpm typecheck`

---

### **US-010 · Wave 1 · /video-analysis 前端 · VideoAnalysis.tsx 真表单 + 22 元素 tag + 仿写渲染**

> **risk_level** · `medium`(前端 · elements tag · insights 列表 · rewriteVersion react-markdown)
> **priority** · 10
> **depends_on** · [US-001, US-009]

**描述** · 替换 `apps/web/src/pages/tools/VideoAnalysis.tsx` PRD-3 占位 · 真表单(`<ToolForm toolKey="videoAnalysis" schema={AnalyzeVideoInputSchema}>` + lastTitle input optional + lastCopy textarea min 10)· submit 调 `trpc.videoAnalysis.analyze` · onSuccess → setResult → 渲染 `<ToolResult toolKey="videoAnalysis" data={result} />`(JSON.parse content → analysis.elements 渲染为 Badge tag 列表(对照 HOT_ELEMENT_KEYS_22 中文映射)· insights 列表 Card 含 element+explanation+impact 高/中/低色标 · rewriteVersion 长文 react-markdown + remark-gfm)· LS namespace `acc_{id}_tool_videoAnalysis_input`。

**触发场景** · 用户访问 `/video-analysis` → 粘贴爆款文案 + 标题(选填) → 点"开始深度解析" → loading → 看到 22 元素 tag + 3+ insights + rewriteVersion 全文。

**files_to_modify** ·
- `apps/web/src/pages/tools/VideoAnalysis.tsx`(替换占位)

**files_to_create** ·
- `tests/unit/web/pages/VideoAnalysis.test.tsx`(≥ 5 unit · 表单 render + elements tag 渲染 + insights 列表 + rewriteVersion markdown)
- `tests/e2e/tool-video-analysis.spec.ts`(1 e2e · CI mock · 粘贴 → submit → tag + 仿写渲染)

**test_command** · `pnpm test tests/unit/web/pages/VideoAnalysis.test.tsx && pnpm typecheck && pnpm test:e2e tests/e2e/tool-video-analysis.spec.ts`

---

### **US-011 · Wave 2 · /history 接入 · 新建 history.ts router + History.tsx 真表格 + 跳转预填**

> **risk_level** · `medium`(history router 跨 7+ writer · 表格筛选 · 跳转预填)
> **priority** · 11
> **depends_on** · [US-003, US-005, US-007, US-009]

**描述** · 新建 `apps/api/src/trpc/routers/history.ts` router · `list` query(filter by agentId / agentMode / sourceType / dateRange · pagination limit max 100 default 20 + offset · orderBy createdAt desc · accountId 自动 RLS)· `detail` query(by id · 返回完整 history row)· `delete` mutation(by id · accountId RLS check)· 替代各工具 router 的 list/delete 重复(D-029)。前端替换 `apps/web/src/pages/modules/History.tsx` 占位 · 真表格(列 · 时间 / Agent + Mode badge / 输入摘要 / 内容预览 / 操作)+ 筛选(全部 / Generate / Boom / Analysis / Video Analysis · time range last 7d / 30d / all)+ 跳转(点行 → 跳到对应工具页 + URL `?historyId=N` · 工具页 useEffect 读 detail 预填表单)。

**触发场景** ·
- 用户访问 `/history` → 看到表格(自己账号下 PRD-4 step7 + PRD-5 generate/boom/analysis/videoAnalysis 全部历史)
- 用户筛选"Boom" + last 7d → 表格仅显示符合行
- 用户点某行 → 跳到 `/boom-generate?historyId=42` → 工具页 useEffect 调 `trpc.history.detail.useQuery({ id: 42 })` → 表单预填(elements + theme + industry)+ 结果区显示历史 content

**files_to_create** ·
- `apps/api/src/trpc/routers/history.ts`(~120 行 · `list` + `detail` + `delete` procedures · zod input schemas + RLS)
- `tests/unit/api/history-router.test.ts`(≥ 6 unit · list filter by agentId / agentMode / sourceType / dateRange / pagination + detail RLS + delete RLS)
- `tests/e2e/history-flow.spec.ts`(1 e2e · CI mock · generate → 跳 /history → 点 row → 跳回 /generate 预填 → 看结果)

**files_to_modify** ·
- `apps/api/src/trpc/_app.ts`(注册 `history: historyRouter`)
- `packages/clients/src/router-types.ts`(shadow router 加 history.list / detail / delete)
- `apps/web/src/pages/modules/History.tsx`(替换占位 · ~250 行 · Table + 筛选 + 跳转)
- `apps/web/src/pages/tools/{Generate,BoomGenerate,Analysis,VideoAnalysis}.tsx`(各加 useEffect 读 `?historyId=N` 预填表单 · ~10 行 each · 复用 ToolForm 的 defaultValues prop)

**test_command** · `pnpm test tests/unit/api/history-router.test.ts && pnpm typecheck && pnpm test:e2e tests/e2e/history-flow.spec.ts`

---

### **US-012 · 收官 · LLM Judge 4 mode 各 1-2 golden + 4 工具页 e2e 集成 + lint clean + typecheck**

> **risk_level** · `medium`(收官集成 · Judge 套件扩展 · 防 lint debt)
> **priority** · 12
> **depends_on** · [US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010, US-011]

**描述** · PRD-5 收官 · 4 项 ·
1. **LLM Judge 套件扩展** · 新增 4 文件 · `tests/judge/copywriting-free.judge.ts`(医美自媒体 · 健身教练 2 golden)· `copywriting-boom.judge.ts`(育儿博主 · 理财博主 2 golden 5 篇候选)· `analysis-viral.judge.ts`(美妆 · 美食 2 golden 22 元素拆解)· `analysis-structural.judge.ts`(减肥 · 育儿 2 golden 5 维度评分)· 各调 `runJudge(case_)` · model_tier='lightweight' · cost_log eventType='judge_call'(D-034)· **累计 22 judge tests**(14 PRD-4 + 8 新)
2. **4 工具页 e2e 集成** · 复用 PRD-4 9 步 e2e 模式 · `tests/e2e/tools-integration.spec.ts`(test.describe.serial · 创建账号 → 跑通 4 工具 generate/boom/analysis/videoAnalysis → 看 history 4 条 → 点 row 预填验证 · CI 用 mock LLM)
3. **lint clean** · `pnpm --filter @quanqn/web lint --max-warnings=0` 退出码 0(防 PRD-1 lint debt 重现)· `pnpm --filter @quanqn/api lint --max-warnings=0` 退出码 0
4. **全套绿灯门禁** · vitest ≥ 393 / 393(343 PRD-4 累计 + ≥ 50 新)· typecheck 6 ws 0 error · playwright ≥ 111 / 111(106 PRD-4 + 5 新)· judge 22 / 22

**触发场景** · ralph 完成 US-001~011 后跑收官 · 全套绿灯才 PASSED。

**files_to_create** ·
- `tests/judge/copywriting-free.judge.ts`(2 golden case · 调 copywritingAgent mode='free')
- `tests/judge/copywriting-boom.judge.ts`(2 golden case · 调 copywritingAgent mode='boom')
- `tests/judge/analysis-viral.judge.ts`(2 golden case · 调 analysisAgent mode='viral')
- `tests/judge/analysis-structural.judge.ts`(2 golden case · 调 analysisAgent mode='structural')
- `tests/e2e/tools-integration.spec.ts`(收官集成 e2e · serial · CI mock)

**files_to_modify** ·
- `apps/web/eslint.config.js` 或修边缘 lint warnings(若 US-004/006/008/010/011 引入)
- `apps/api/eslint.config.js` 或修边缘 lint warnings(若 US-003/005/007/009/011 引入)
- `scripts/ralph/verify-artifacts/US-012/manifest.json`(产物 · 同 PRD-4 US-018 模式)

**test_command** · `pnpm typecheck && pnpm test && pnpm test:judge && pnpm test:e2e && pnpm --filter @quanqn/web lint --max-warnings=0 && pnpm --filter @quanqn/api lint --max-warnings=0`

---

## §1.5 跨 Story 协议锁

> **理由** · PRD-5 12 stories 跨 2 Specialist + 4 router + 4 前端工具页 + history 接入 · 命名歧义会导致 ralph 在不同 story 脑补不同名字。本节预先锁定 · 每条 AC 必须显式写出锁定命名。
> **F5 既有代码现状双对账**(防 TD-012 类 · OPUS-AUDIT-CHEATSHEET §F5.1 · 2026-05-09 新增) · 见 §1.5.E。

### A · 类型 / 方法签名锁

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `AnalysisMode = 'viral' \| 'structural'` | type union | US-002 | US-007 + US-009 | AnalysisAgent 私有 _mode 类型 |
| `class AnalysisAgent extends BaseSpecialist<AnalysisInput, AnalysisOutput>` | class | US-002 | US-007 + US-009 | 单实例 export `analysisAgent`(REJ-004) |
| `CopywritingMode = 'step7' \| 'free' \| 'boom' \| 'acquisition'` | type union | US-002(扩) | US-003 + US-005 + (PRD-4 US-009 step7) | CopywritingAgent 私有 _mode 类型 · acquisition 仍 throw 'PRD-6' |
| `outputSchema: ZodSchema` (getter) | getter | US-002 | (BaseSpecialist 内调) | 按 _mode 返回对应 schema(REJ-007 防多 mode 共用 · D-028) |
| `copywritingAgent.execute(req)` | single instance method | (PRD-4 US-001 已建)| US-003 + US-005 | `req: { accountId, mode: CopywritingMode, userInput, traceId? }` |
| `analysisAgent.execute(req)` | single instance method | US-002 | US-007 + US-009 | `req: { accountId, mode: AnalysisMode, userInput, traceId? }` |
| `IPProgressService.getProgress(accountId)` | (PRD-4 US-013 已建) | (无变化) | (本期不动) | — |
| `historyRouter.list(input)` | tRPC query | US-011 | History.tsx + 4 工具页(useEffect 预填) | `input: { agentId?: string, agentMode?: string, sourceType?: string, dateRange?: 'last_7d' \| 'last_30d' \| 'all', limit, offset }` |
| `historyRouter.detail(input)` | tRPC query | US-011 | 工具页 useEffect 预填 | `input: { id: number }` · 返回完整 history row(含 input 字段从 inputSummary 推) |
| `historyRouter.delete(input)` | tRPC mutation | US-011 | History.tsx delete button | `input: { id: number }` · accountId RLS auto |
| `getToolLsKey(accountId, toolKey, suffix)` | function | US-001 | 4 工具页 LS read/write | `'aiip_memory_acc_{accountId}_tool_{toolKey}_{suffix}'`(D-031) |
| `<ToolForm toolKey={...} schema={...} defaultValues={...}>` | React component | US-001 | 4 工具页 | 类似 StepForm 但 LS namespace 不同 + 不强制 stepKey |
| `<ToolResult toolKey={...} data={...} isFallback={...}>` | React component | US-001 | 4 工具页 | switch by toolKey · 渲染对应 4 子组件 |

### B · Specialist outputSchema 锁(2 Specialist × 6 mode = 6 输出 schema)

| Specialist · mode | outputSchema(精确 zod) | 定义 story | 消费 story |
|---|---|---|---|
| `CopywritingAgent · step7` | (PRD-4 US-009 已建)`z.object({ markdown: z.string().min(500), structure: z.string(), hooks: z.array(z.string()).min(1), cta: z.string() })` post-validate `# 标题` heading | (PRD-4 US-009) | (本期不动)|
| `CopywritingAgent · free` | `z.object({ markdown: z.string().min(400).max(1500), metadata: z.object({ scriptType: z.enum(SCRIPT_TYPE_KEYS_20), elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)), structureSummary: z.string(), estimatedDuration: z.string() }) })` post-validate `# ` heading | US-002 | US-003 + US-004(渲染) |
| `CopywritingAgent · boom` | `z.object({ candidates: z.array(z.string().min(200).max(500)).length(5), metadata: z.object({ count: z.literal(5), elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)) }) })` | US-002 | US-005 + US-006(渲染 5 篇 split '---') |
| `CopywritingAgent · acquisition` | (本期 throw 'Not implemented · PRD-6' · D-035) | US-002 | (PRD-6) |
| `AnalysisAgent · viral` | `z.object({ analysis: z.object({ elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)), structure: z.string(), hookType: z.string(), viralFormula: z.string() }), insights: z.array(z.object({ element: z.enum(HOT_ELEMENT_KEYS_22), explanation: z.string().min(20), impact: z.enum(['高','中','低']) })).min(3), rewriteVersion: z.string().min(50) })` | US-002 | US-009 + US-010(渲染) |
| `AnalysisAgent · structural` | `z.object({ scores: z.object({ hook: z.number().int().min(0).max(100), structure: z.number().int().min(0).max(100), emotion: z.number().int().min(0).max(100), specificity: z.number().int().min(0).max(100), cta: z.number().int().min(0).max(100), overall: z.number().int().min(0).max(100) }), optimizations: z.array(z.object({ dimension: z.enum(['hook','structure','emotion','specificity','cta']), issue: z.string().min(10), suggestion: z.string().min(20) })).min(3).max(5), rewriteSnippet: z.string().min(50).max(200) })` | US-002 | US-007 + US-008(渲染) |

### C · history 表写入 + cost_log 锁(D-024 / D-029 落地)

| 命名 | 类型 | 定义 story | 说明 |
|---|---|---|---|
| `History.agentId` | varchar(64) | US-001 修(同步 7 router) | **必用 Class name 大写** · `'CopywritingAgent'` / `'AnalysisAgent'` / `'PositioningAgent'` / etc · 不允许小写(TD-016 修) |
| `History.agentMode` | varchar(32) | US-002 + 4 router | `'free'` / `'boom'` / `'viral'` / `'structural'` / `'step7'`(PRD-4) / `'industry'` / `'execution'` / `'packaging'` / `'persona'` / `'shooting'` |
| `History.sourceType` | varchar(32) | (PRD-2 已定) | `'user'`(用户主动调)/ `'auto'`(LLM 触发 · 留 PRD-7+ EvolutionAgent) |
| `History.contentType` | varchar(16) | (PRD-2 已定) | `'markdown'` / `'json'` · /generate /boom-generate 用 markdown · /analysis /video-analysis 用 json(stringified) |
| `History.scriptType` | varchar(32)? | (PRD-2 已定) | 仅 free/boom mode 写入(枚举 SCRIPT_TYPE_KEYS_20 之一)· analysis 域留空 |
| `History.elements` | text[] | (PRD-2 已定) | free/boom/viral mode 写入(枚举 HOT_ELEMENT_KEYS_22 子集)· structural 域留空 |
| `History.isFallback` | boolean | (PRD-4 US-013 已加) | 来自 SpecialistResponse.isFallback · 显示 FallbackBanner 用 |
| `History.tokensUsed` / `modelUsed` / `durationMs` / `traceId` | mixed | (PRD-2 + PRD-4 US-003 已加) | BaseSpecialist 写 cost_log 同时写 history 这 4 字段 |
| `cost_log.eventType` | varchar(32) | (PRD-4 US-014 已加) | `'specialist_call'`(BaseSpecialist 内自动写)· `'good'/'bad'`(FeedbackButton 写)· `'judge_call'`(Judge 套件 metadata 穿透) |
| `cost_log.callType` | varchar(32) | (PRD-2 已加) | `'complete'`(LLMGateway 内写)· `'specialist_call'`(BaseSpecialist 写)· `'feedback'`(logFeedback procedure 写) · 双层 logging(TD-013 留 PRD-11) |

### D · 4 工具 router · procedure 命名锁(防 D-026 选项混淆)

| router | procedure | input | output | 定义 story | 备注 |
|---|---|---|---|---|---|
| `copywriting` | `generate`(PRD-4 已建)| `{ stepKey: 'step7', tone?, length?, context? }` | history row | (PRD-4 US-009) | 服务 /step/7 · 本期不动 |
| `copywriting` | `freeGenerate`(新建 · D-026 选项 B)| `{ scriptType: enum SCRIPT_TYPE_KEYS_20, elements: enum HOT_ELEMENT_KEYS_22 array min 1 max 8, topic: string min 1 max 500 }` | history row | US-003 | 服务 /generate · 调 copywritingAgent mode='free' |
| `copywriting` | `optimize`(PRD-2 mock)| `{ historyId, instruction }` | history row | (PRD-2 mock) | 本期保留 mock(留 PRD-7+) |
| `copywriting` | `list` / `delete` | (US-001 修 agentId='CopywritingAgent') | (PRD-2 已建) | (PRD-2)| 本期 US-001 修 list filter agentId 大小写 + 复用 |
| `boomGenerate` | `generate` | `{ elements: enum HOT_ELEMENT_KEYS_22 array min 1 max 8, industry?, theme? }` | history row | US-005 | 调 copywritingAgent mode='boom' |
| `analysis` | `analyze`(新建)| `{ copy: string min 10 max 3000 }` | history row | US-007 | 调 analysisAgent mode='structural' · _app.ts 注册 |
| `videoAnalysis` | `analyze`(改 schema)| `{ lastTitle?: string max 200, lastCopy: string min 10 max 3000 }` | history row | US-009 | 调 analysisAgent mode='viral' · 不再用 videoUrl |
| `videoAnalysis` | `rewrite`(删除 · D-028)| — | — | (US-009 删) | viral mode 已含 rewriteVersion · 减表面积 |
| `history` | `list`(新建)| `{ agentId?, agentMode?, sourceType?, dateRange?, limit, offset }` | history row[] | US-011 | accountId RLS 自动 |
| `history` | `detail`(新建)| `{ id: number }` | history row | US-011 | accountId RLS 自动 |
| `history` | `delete`(新建)| `{ id: number }` | `{ ok: true }` | US-011 | accountId RLS 自动 |

### E · 既有代码现状对账(F5 防 TD-012 类 · 2026-05-09 新增)

| 协议锁路径(PRD-5 拟用) | 既有状态(grep 实测) | 处理 |
|---|---|---|
| `apps/api/src/specialists/AnalysisAgent.ts` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/api/src/specialists/CopywritingAgent.ts` | 存在(259 行 · PRD-4 US-009)· step7 mode + free/boom/acquisition throw 'PRD-5' | 改 · 解锁 free/boom · acquisition throw 改 'PRD-6'(D-035)· 不破坏 step7 |
| `apps/api/src/services/context-assembler/templates/analysis.ts` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/api/src/services/context-assembler/templates/index.ts` | 存在(SPECIALIST_TEMPLATES barrel · 7 入口)| 加 'analysis' 入口 · 不破坏 |
| `apps/api/src/trpc/routers/analysis.ts` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/api/src/trpc/routers/history.ts` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/api/src/trpc/routers/copywriting.ts` | 存在(122 行 · PRD-2 mock + PRD-4 US-009 真接 step7)· `generate`(step7) / `optimize`(mock) / `list`(⚠️ TD-016 agentId 'copywriting' 小写) / `delete` | 加 `freeGenerate` procedure(D-026 选项 B)· 修 list agentId 大小写(TD-016 · 同步 PRD-4 写入大写)· `optimize` 留 mock(PRD-7+) |
| `apps/api/src/trpc/routers/videoAnalysis.ts` | 存在(72 行 · `analyze` mock URL-based / `rewrite` mock) | 改 `analyze` 真接 viral mode · schema 重写(lastCopy 文本 · 非 URL)· 删 `rewrite`(D-028) |
| `apps/api/src/trpc/routers/boomGenerate.ts` | 存在(48 行 · `generate` mock stepKey-based) | 改 `generate` 真接 boom mode · schema 重写(elements 数组 · 非 stepKey) |
| `packages/schemas/src/specialist-io/copywriting.schema.ts` | 存在(generic mock schema · 不含 mode/elements/scriptType) | 重写 · 加 mode + 真业务 input/output schemas(Step1FreeOutputSchema + BoomOutputSchema · 保留 step7 schema 兼容 PRD-4) |
| `packages/schemas/src/specialist-io/videoAnalysis.schema.ts` | 存在(URL schema · 错业务) | 重写 · 改 lastCopy + lastTitle |
| `packages/schemas/src/specialist-io/boomGenerate.schema.ts` | 存在(stepKey schema · 错业务) | 重写 · 改 elements + theme |
| `packages/schemas/src/specialist-io/analysis.schema.ts` | **不存在** | 新建 · 无冲突 ✓ |
| `packages/schemas/src/specialist-io/constants.ts` | **不存在** | 新建 · HOT_ELEMENT_KEYS_22 + SCRIPT_TYPE_KEYS_20 inline(D-033) |
| `apps/web/src/components/ToolForm/ToolForm.tsx` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/web/src/components/ToolForm/ScriptTypeSelect.tsx` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/web/src/components/ToolForm/ElementsMultiSelect.tsx` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/web/src/components/ToolResult/ToolResult.tsx` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/web/src/components/ToolResult/{Free,Boom,Analysis,VideoAnalysis}Result.tsx` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/web/src/pages/tools/{Generate,Analysis,VideoAnalysis,BoomGenerate}.tsx` | 存在(各 18 行占位) | 替换 · 不破坏(占位无业务) |
| `apps/web/src/pages/modules/History.tsx` | 存在(占位 · PRD-3 US-003) | 替换 · 不破坏 |
| `apps/web/src/lib/ls-namespace.ts` | 存在(getStepLsKey + clearLsNamespace) | 加 `getToolLsKey(accountId, toolKey, suffix)` export(D-031)· 不破坏 |

**结论 · 0 重大冲突 · 4 schema 重写(backward compat keep step7)+ TD-016 顺手修(US-001 修)+ 6 新建文件 + 16 文件改动 + 1 ts 注册改动(_app.ts)**

### F · 编号锁

- 定义 story 的 priority **必须小于**消费 story · ralph wave 调度依此(US-001 < US-002 < US-003~012)
- 每条被引用的 AC **必须显式写出** `copywritingAgent.execute({mode: 'free' \| 'boom'})` / `analysisAgent.execute({mode: 'viral' \| 'structural'})` / `historyRouter.list({...})` / `getToolLsKey(...)` / `<ToolForm>` / `<ToolResult>` 等命名 · 不允许"通过 Specialist 抽象调"之类模糊表述
- AC 涉及 zod schema 时 · **必须嵌入完整 zod 表达式**(参表 B)· 不允许"按 free 输出 schema 校验"模糊表述

---

## §2 验收标准(每 US 4 类 · H/E/B/P)

> **AC 类型说明** · `H` = Happy Path 主路径 · `E` = Edge Case 边缘 · `B` = Business 业务规则 · `P` = Performance 性能

---

### **AC-001 · Foundation · TD-016 修 + 4 schema 重写 + ToolForm/ToolResult 抽象**(US-001 · foundation)

#### H · 主路径

- [ ] `packages/schemas/src/specialist-io/constants.ts` 新建 · 导出 ·
  ```typescript
  export const HOT_ELEMENT_KEYS_22 = [
    'fear', 'desire', 'curiosity', 'surprise',           // 心理唤起组(4)
    'social_proof', 'authority', 'scarcity', 'reciprocity', 'commitment', 'liking',  // 社会心理组(6)
    'contrast', 'metaphor', 'pun', 'rhetorical', 'enumeration', 'narrative',  // 修辞结构组(6)
    'data', 'case', 'authority_quote', 'list', 'comparison', 'qa',  // 信息密度组(6)
  ] as const;
  export const SCRIPT_TYPE_KEYS_20 = [
    'tutorial', 'review', 'case_study', 'pov', 'monologue', 'debate', 'list_pop',
    'before_after', 'street_interview', 'qa_short', 'reaction', 'mixcut', 'screen_record',
    'animation', 'vlog', 'plot', 'voice_only', 'comparison', 'storytelling', 'duo_chat',
  ] as const;
  export type HotElementKey = typeof HOT_ELEMENT_KEYS_22[number];
  export type ScriptTypeKey = typeof SCRIPT_TYPE_KEYS_20[number];
  ```
- [ ] `packages/schemas/src/specialist-io/analysis.schema.ts` 新建 · 导出 ·
  ```typescript
  import { z } from 'zod';
  import { HOT_ELEMENT_KEYS_22 } from './constants';
  export const analysisStructuralInput = z.object({ copy: z.string().min(10).max(3000) });
  export const analysisViralInput = z.object({
    lastTitle: z.string().max(200).optional(),
    lastCopy: z.string().min(10).max(3000),
  });
  export const analysisStructuralOutput = z.object({
    scores: z.object({
      hook: z.number().int().min(0).max(100),
      structure: z.number().int().min(0).max(100),
      emotion: z.number().int().min(0).max(100),
      specificity: z.number().int().min(0).max(100),
      cta: z.number().int().min(0).max(100),
      overall: z.number().int().min(0).max(100),
    }),
    optimizations: z.array(z.object({
      dimension: z.enum(['hook','structure','emotion','specificity','cta']),
      issue: z.string().min(10),
      suggestion: z.string().min(20),
    })).min(3).max(5),
    rewriteSnippet: z.string().min(50).max(200),
  });
  export const analysisViralOutput = z.object({
    analysis: z.object({
      elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)),
      structure: z.string(),
      hookType: z.string(),
      viralFormula: z.string(),
    }),
    insights: z.array(z.object({
      element: z.enum(HOT_ELEMENT_KEYS_22),
      explanation: z.string().min(20),
      impact: z.enum(['高','中','低']),
    })).min(3),
    rewriteVersion: z.string().min(50),
  });
  ```
- [ ] `packages/schemas/src/specialist-io/copywriting.schema.ts` 重写 · 保留 PRD-4 step7 schema · 新加 free + boom · 导出 ·
  ```typescript
  import { z } from 'zod';
  import { HOT_ELEMENT_KEYS_22, SCRIPT_TYPE_KEYS_20 } from './constants';
  // free mode (新)
  export const copywritingFreeGenerateInput = z.object({
    scriptType: z.enum(SCRIPT_TYPE_KEYS_20),
    elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)).min(1).max(8),
    topic: z.string().min(1).max(500),
  });
  export const copywritingFreeOutput = z.object({
    markdown: z.string().min(400).max(1500),
    metadata: z.object({
      scriptType: z.enum(SCRIPT_TYPE_KEYS_20),
      elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)),
      structureSummary: z.string(),
      estimatedDuration: z.string(),
    }),
  });
  // (PRD-4 step7 + optimize/list/delete schemas 保留 · backward compat)
  ```
- [ ] `packages/schemas/src/specialist-io/boomGenerate.schema.ts` 重写 ·
  ```typescript
  import { z } from 'zod';
  import { HOT_ELEMENT_KEYS_22 } from './constants';
  export const generateBoomInput = z.object({
    elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)).min(1).max(8),
    industry: z.string().max(64).optional(),
    theme: z.string().max(200).optional(),
  });
  export const boomOutput = z.object({
    candidates: z.array(z.string().min(200).max(500)).length(5),
    metadata: z.object({
      count: z.literal(5),
      elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)),
    }),
  });
  ```
- [ ] `packages/schemas/src/specialist-io/videoAnalysis.schema.ts` 重写 ·
  ```typescript
  import { z } from 'zod';
  export const analyzeVideoInput = z.object({
    lastTitle: z.string().max(200).optional(),
    lastCopy: z.string().min(10).max(3000),
  });
  // analysis viral output 走 analysis.schema.ts(共享 AnalysisAgent)
  ```
- [ ] `apps/api/src/services/context-assembler/templates/analysis.ts` 新建(persona + methodology 段 · 同其他 7 模板)
- [ ] `apps/api/src/services/context-assembler/templates/index.ts` SPECIALIST_TEMPLATES 加 `analysis: analysisTemplate` 入口
- [ ] `apps/web/src/components/ToolForm/ToolForm.tsx` 新建 · 含 `useForm + zodResolver + LS-first dual-write + AbortController on unmount`(类似 StepForm 但 LS namespace 用 `getToolLsKey(accountId, toolKey, 'input')` · D-031)· 接受 `defaultValues` prop 给 history 跳转预填用
- [ ] `apps/web/src/components/ToolForm/ScriptTypeSelect.tsx`(20 脚本类型 dropdown + ScrollArea h-72 · AGENTS §11.4 + §11.6.7 模式)
- [ ] `apps/web/src/components/ToolForm/ElementsMultiSelect.tsx`(22 爆款元素 4 组分类 + checkbox + ScrollArea h-96)
- [ ] `apps/web/src/components/ToolResult/ToolResult.tsx` 新建 · `switch(toolKey)` 渲染对应子组件 · 4 子组件:`FreeGenerateResult` / `BoomGenerateResult` / `AnalysisResult` / `VideoAnalysisResult`
- [ ] `apps/web/src/lib/ls-namespace.ts` 加 export ·
  ```typescript
  export function getToolLsKey(accountId: number, toolKey: string, suffix: string): string {
    return `aiip_memory_acc_${accountId}_tool_${toolKey}_${suffix}`;
  }
  ```
- [ ] `apps/api/src/trpc/routers/copywriting.ts` line 106 修 · `where: { agentId: 'CopywritingAgent' }`(大写 · TD-016 修)+ 同步检查其他 router 写入是否大写一致(grep `agentId: '[a-z]` 在 7+ router 应 0 命中)

#### E · 边缘

- [ ] HOT_ELEMENT_KEYS_22 长度恰好 22 · SCRIPT_TYPE_KEYS_20 长度恰好 20 · `expect(HOT_ELEMENT_KEYS_22.length).toBe(22)` 单测 PASS
- [ ] z.enum(HOT_ELEMENT_KEYS_22) 在 packages/schemas 内 inline · 不 import apps/api(D-033 · grep `from '@/'\|from '../../apps'` in packages/schemas 应 0 命中)
- [ ] `getToolLsKey(1, 'freeGenerate', 'input')` 返回 `'aiip_memory_acc_1_tool_freeGenerate_input'`(单测验证)
- [ ] ToolForm 的 LS dual-write · DB 写失败时 LS 不回滚 + toast.error(REJ-035 · 同 StepForm 模式)
- [ ] copywriting.list 修 agentId 大小写后 · grep `agentId: 'copywriting'` 在 apps/api/src 应 0 命中(全替换为 'CopywritingAgent')
- [ ] 7 router(stepData/monetization/videoProduction/boomGenerate/copywriting/videoAnalysis/privateDomain)的 history.create 写入 agentId 检查 · 应全 Class name 大写规范

#### B · 业务

- [ ] HOT_ELEMENT_KEYS_22 4 组分类 · 心理唤起(4)+ 社会心理(6)+ 修辞结构(6)+ 信息密度(6)= 22 · ElementsMultiSelect 渲染按此分组(每组 collapsible)
- [ ] SCRIPT_TYPE_KEYS_20 与 spec.md §Ⅷ.8.1.3 14 呈现形式 + 6 衍生类型对应 · 实施时跟 `apps/api/src/lib/constants/scriptTypes.ts` 手动同步(audit grep diff)
- [ ] ToolForm 与 StepForm 共享 useForm + zodResolver 模式但 LS namespace 不同 · 不复用 StepForm(D-030 · 关注点分离)
- [ ] ContextAssembler analysis 模板内 persona = "你是文案分析师" · methodology = "22 元素心理学 + 67 RAG 案例对照"(PROMPTS.md §9.1)

#### P · 性能

- [ ] schemas zod parse < 1ms(constants 是 const literal · enum 编译期优化)
- [ ] ToolForm useForm initial render < 50ms(同 StepForm 性能)
- [ ] ScriptTypeSelect / ElementsMultiSelect dropdown open < 100ms

#### Common(All US)

- [ ] Tests pass(`pnpm test tests/unit/schemas tests/unit/web/ToolForm.test.tsx tests/unit/web/ToolResult.test.tsx`)
- [ ] Typecheck passes(`pnpm typecheck` · 6 ws · 0 errors)

---

### **AC-002 · Foundation · CopywritingAgent 解锁 free+boom + AnalysisAgent 新建**(US-002 · foundation)

#### H · 主路径

- [ ] `apps/api/src/specialists/AnalysisAgent.ts` 新建 · 继承 BaseSpecialist ·
  ```typescript
  import { BaseSpecialist } from './base/BaseSpecialist';
  import { analysisStructuralOutput, analysisViralOutput, analysisStructuralInput, analysisViralInput } from '@quanqn/schemas/specialist-io';
  
  export type AnalysisMode = 'viral' | 'structural';
  
  class AnalysisAgent extends BaseSpecialist<unknown, unknown> {
    private _mode: AnalysisMode = 'viral';
    
    protected readonly config = {
      persona: { role: 'AnalysisAgent', goal: '...', boundaries: '...' },
      memory: { l2_read: ['stepData'], l2_write: ['history'] },
      knowledge: { constants: ['hotElements'], rag: [] },
      tools: ['llm.complete'],
      execution: { model_tier: 'lightweight' as const, timeout_ms: 30000, retry: 1, streaming: false },
    };
    
    get inputSchema() {
      if (this._mode === 'viral') return analysisViralInput;
      return analysisStructuralInput;
    }
    
    get outputSchema() {
      if (this._mode === 'viral') return analysisViralOutput;
      if (this._mode === 'structural') return analysisStructuralOutput;
      throw new Error(`Unknown mode: ${this._mode}`);
    }
    
    static readonly fallbackTemplate: Record<AnalysisMode, unknown> = {
      viral: { /* 满足 analysisViralOutput min 约束的兜底 */ },
      structural: { /* 满足 analysisStructuralOutput min 约束的兜底 */ },
    };
    
    protected async invokeLLM(ctx) {
      const mode = (this.req.mode ?? 'viral') as AnalysisMode;
      this._mode = mode;
      // single LLMGateway.complete (non-SSE · short output)
      return this.llmGateway.complete({ /* responseFormat: this.outputSchema · model_tier: 'lightweight' */ });
    }
  }
  
  export const analysisAgent = new AnalysisAgent(/* DI */);
  ```
- [ ] `apps/api/src/specialists/CopywritingAgent.ts` outputSchema getter 改 4 mode 全 cover ·
  ```typescript
  get outputSchema() {
    if (this._mode === 'step7') return CopywritingStep7Output;
    if (this._mode === 'free') return copywritingFreeOutput;
    if (this._mode === 'boom') return boomOutput;
    if (this._mode === 'acquisition') throw new Error('Not implemented · PRD-6');
    throw new Error(`Unknown mode: ${this._mode}`);
  }
  ```
- [ ] CopywritingAgent invokeLLM 加 free / boom 分支(SSE stream + _consumeStream 复用 step7 模式 · stream.meta.model 接收真 model · cost_log.modelUsed 反映)
- [ ] CopywritingAgent fallbackTemplate 加 free / boom 兜底(满足 schema 长度约束 · 中文字符 .repeat(N) 才能稳定 ≥ 阈值 · LivestreamAgent 经验)
- [ ] `apps/api/src/services/context-assembler/templates/copywriting.ts` 扩 4 mode persona + methodology 段(从 PROMPTS.md §5.1 + §5.3-§5.5 复制)
- [ ] `apps/api/src/services/context-assembler/templates/analysis.ts` 完善 viral/structural 模板内容(PROMPTS.md §9.1 + §9.2 + §9.3)
- [ ] `tests/unit/specialists/__tests__/AnalysisAgent.test.ts` 8+ unit · 2 mode × 4 场景(happy / fallback / cold-start / config 验证)
- [ ] `tests/unit/specialists/__tests__/CopywritingAgent.test.ts` 加 free/boom 8+ 新 unit(原 9 → 17)

#### E · 边缘

- [ ] free mode invokeLLM 内部 _consumeStream 失败 → 返回 `{ content: null, isFallback: true }` 让 BaseSpecialist Step 4 safeParse 失败触发 retry(AGENTS §11.6.4 模式)
- [ ] boom mode candidates 数组长度 ≠ 5 → schema validate 失败 → retry 1 → 二次失败 fallback
- [ ] viral mode insights 数组长度 < 3 → schema validate 失败 → retry → 二次失败 fallback
- [ ] structural mode scores.overall 字段缺失 → schema fail → retry
- [ ] mode 不在 ['step7','free','boom','acquisition'](Copywriting)/ ['viral','structural'](Analysis) → outputSchema getter throw 'Unknown mode: ...'(防漏 case 静默失败)
- [ ] grep `'Not implemented · PRD-5'` 在 CopywritingAgent.ts 应 0 命中(D-035 · 全替换为 'PRD-6')

#### B · 业务

- [ ] AnalysisAgent model_tier='lightweight'(haiku / 4o-mini)· 不用 reasoning(分析任务 · cost 控制)
- [ ] CopywritingAgent free/boom mode timeout_ms=60000(同 step7 reasoning)· acquisition 仍 throw
- [ ] AnalysisAgent timeout_ms=30000(short output · 不需长 timeout)
- [ ] AnalysisAgent _mode race window 警示文档化(AGENTS §11.6.3 · TD-014 模式继承 · 第 5 处复用 · 留 PRD-7+ 治理)
- [ ] ContextAssembler analysis 模板 L4 EvolutionProfile / L5 RAG 本期降级跑空(同 PRD-4 D-025)
- [ ] CopywritingAgent acquisition mode throw 文案改 'PRD-6'(从 'PRD-5' · D-035)· grep 验证

#### P · 性能

- [ ] AnalysisAgent execute · structural mode < 5s(lightweight · short output · 简单评分)
- [ ] AnalysisAgent execute · viral mode < 8s(22 元素拆解 · 仿写 · 稍长)
- [ ] CopywritingAgent free mode execute < 30s(reasoning · markdown 长输出)
- [ ] CopywritingAgent boom mode execute < 45s(reasoning · 5 篇候选 · SSE 流式)
- [ ] mock 测试 100 次 < 2s(无 LLM · 单元 fast)

#### Common

- [ ] Tests pass(`pnpm test tests/unit/specialists/__tests__/{Copywriting,Analysis}Agent.test.ts`)
- [ ] Typecheck passes
- [ ] 反例 grep · 见 §1 US-002 末尾 6 项 grep 全 0 命中(REJ-001/002/003/007/004 + D-019 + D-035)

---

### **AC-003 · Wave 1 · /generate 后端 · copywriting.freeGenerate procedure**(US-003 · high)

#### H · 主路径

- [ ] `apps/api/src/trpc/routers/copywriting.ts` 加 `freeGenerate` procedure ·
  ```typescript
  freeGenerate: protectedProcedure
    .input(copywritingFreeGenerateInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const agentRes = await copywritingAgent.execute({
        accountId: activeAccountId!,
        mode: 'free',
        userInput: input,  // { scriptType, elements, topic }
        traceId: traceId ?? undefined,
      });
      const { markdown, metadata } = agentRes.result;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'CopywritingAgent',
          agentMode: 'free',
          sourceType: 'user',
          inputSummary: input.topic.substring(0, 100),
          content: markdown,
          contentType: 'markdown',
          scriptType: input.scriptType,
          elements: input.elements,
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),
  ```
- [ ] `tests/integration/api/copywriting-free-llm.test.ts` 1 integration · nock SDK + 真 DB cost_log 查 SQL + history 写入完整字段
- [ ] `tests/unit/api/copywriting-router.test.ts` 4 unit(若不存在新建)· freeGenerate happy + zod fail empty topic + Specialist throw → fallback path + agentMode='free' 字段填充

#### E · 边缘

- [ ] zod input fail(elements 空 / scriptType 不在 enum / topic 超 500 字)→ TRPCError BAD_REQUEST 返前端
- [ ] copywritingAgent.execute throw SchemaValidationError(LLM 输出不符 schema)→ 触发 fallback 路径(BaseSpecialist 内 catch · agentRes.isFallback=true · markdown=fallbackTemplate.free)
- [ ] copywritingAgent.execute throw LLMTimeoutError(60s 超)→ 同上 fallback
- [ ] 写入 history 失败(DB error)→ TRPCError INTERNAL_SERVER_ERROR · log error · 不影响 cost_log 写入(BaseSpecialist 已写)
- [ ] traceId 未提供(从 ctx 读 null)→ history.traceId=null 但不阻断

#### B · 业务

- [ ] history.agentId='CopywritingAgent'(Class name 大写 · TD-016 一致)
- [ ] history.agentMode='free'(D-027 · 区分 step7/free/boom)
- [ ] history.contentType='markdown'(react-markdown 渲染 · 同 step7)
- [ ] history.scriptType + history.elements 填全(D-029 · /history 筛选支持)
- [ ] cost_log 写入由 BaseSpecialist.execute 自动完成(eventType='specialist_call' · target.stepKey=null target.agentId='CopywritingAgent' target.agentMode='free')
- [ ] 不动 generate procedure(D-026 选项 B · 兼容 PRD-4 stepData 调用)

#### P · 性能

- [ ] `copywriting.freeGenerate` mutation 服务端处理 < 60s(含 LLM 调用)· P95 < 45s
- [ ] history.create < 50ms(单行写入)
- [ ] 服务端 zod parse < 5ms

#### Common

- [ ] Tests pass(`pnpm test tests/unit/api/copywriting-router.test.ts tests/integration/api/copywriting-free-llm.test.ts`)
- [ ] Typecheck passes

---

### **AC-004 · Wave 1 · /generate 前端 · Generate.tsx 真表单 + ToolForm 复用**(US-004 · medium)

#### H · 主路径

- [ ] `apps/web/src/pages/tools/Generate.tsx` 替换 PRD-3 占位 ·
  ```tsx
  import { ToolForm } from '@/components/ToolForm/ToolForm';
  import { ToolResult } from '@/components/ToolResult/ToolResult';
  import { copywritingFreeGenerateInput } from '@quanqn/schemas/specialist-io';
  import { useState, useEffect } from 'react';
  import { useSearchParams } from 'react-router-dom';
  import { trpc } from '@/lib/trpc';
  
  export default function Generate() {
    const [searchParams] = useSearchParams();
    const historyId = searchParams.get('historyId');
    const [result, setResult] = useState(null);
    const [defaultValues, setDefaultValues] = useState({});
    
    // history 跳转预填(US-011)
    const { data: historyData } = trpc.history.detail.useQuery(
      { id: Number(historyId) },
      { enabled: !!historyId }
    );
    useEffect(() => {
      if (historyData) {
        setDefaultValues({ scriptType: historyData.scriptType, elements: historyData.elements, topic: historyData.inputSummary });
        setResult({ /* 显示历史 content */ });
      }
    }, [historyData]);
    
    return (
      <main>
        <h1>AI 智能生成</h1>
        <ToolForm
          toolKey="freeGenerate"
          schema={copywritingFreeGenerateInput}
          defaultValues={defaultValues}
          onSubmit={async (input) => {
            const res = await trpc.copywriting.freeGenerate.mutate(input);
            setResult(res);
          }}
        >
          <ScriptTypeSelect name="scriptType" />
          <ElementsMultiSelect name="elements" />
          <TextareaField name="topic" maxLength={500} />
        </ToolForm>
        {result && <ToolResult toolKey="freeGenerate" data={result} isFallback={result.isFallback} />}
      </main>
    );
  }
  ```
- [ ] `tests/unit/web/pages/Generate.test.tsx` ≥ 5 unit · 表单 render + zod 校验 + mutation success + mutation error toast.error + LS 预填
- [ ] `tests/e2e/tool-generate.spec.ts` 1 e2e · CI 用 mock LLM · 流程 · 创建账号 → 跳 /generate → 选 scriptType + elements + topic → submit → 看结果出现 + isFallback=false

#### E · 边缘

- [ ] zod fail · scriptType 未选 → 表单 highlight + Chinese error message "脚本类型必填"
- [ ] zod fail · elements < 1 → "请至少选 1 个爆款元素"
- [ ] zod fail · topic 超 500 字 → "主题最长 500 字"
- [ ] mutation onError → toast.error('生成失败 · 请稍后重试') + 不清空 LS(用户可重试)
- [ ] AbortController on unmount(组件卸载时取消 in-flight mutation · 防 race · 同 StepForm 模式)
- [ ] history 跳转 · `?historyId=N` 不存在 → trpc.history.detail.useQuery enabled=false · 不报错

#### B · 业务

- [ ] LS namespace `aiip_memory_acc_{accountId}_tool_freeGenerate_input`(D-031)· grep `aiip_memory_acc_.+_tool_` 验证
- [ ] LS-first dual-write · 表单字段变化先写 LS(throttle 500ms)· submit 后写 DB · DB 失败 LS 不回滚(REJ-035)
- [ ] FeedbackButton 已 PRD-4 US-014 落地 · 本 US 复用(content 渲染区下方)
- [ ] LD-015 0 hardcode color · grep `#[0-9a-fA-F]{6}` 在 Generate.tsx + ToolForm + ToolResult 应 0 命中

#### P · 性能

- [ ] Generate.tsx initial render < 100ms
- [ ] ScriptTypeSelect 20 项 dropdown open < 50ms
- [ ] ElementsMultiSelect 22 项 ScrollArea + checkbox · 滚动流畅(60fps)
- [ ] mutation submit → result render < 65s(含 LLM · 同 US-003 P95)

#### Common

- [ ] Tests pass(`pnpm test tests/unit/web/pages/Generate.test.tsx`)
- [ ] Typecheck passes
- [ ] e2e pass(`pnpm test:e2e tests/e2e/tool-generate.spec.ts`)
- [ ] **使用 agent-browser 在浏览器中验证** · 打开 `/generate` · 选 scriptType=tutorial + elements=[fear, social_proof] + topic="为什么有的人 30 岁就财富自由" · 点"生成文案" · 看到 markdown 长文 + 字数统计 + 无控制台错误

---

### **AC-005 · Wave 1 · /boom-generate 后端 · boomGenerate.generate 真接 boom mode**(US-005 · high)

#### H · 主路径

- [ ] `apps/api/src/trpc/routers/boomGenerate.ts` 改 generate ·
  ```typescript
  generate: protectedProcedure
    .input(generateBoomInput)  // { elements, industry?, theme? }
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const agentRes = await copywritingAgent.execute({
        accountId: activeAccountId!,
        mode: 'boom',
        userInput: input,
        traceId: traceId ?? undefined,
      });
      const { candidates, metadata } = agentRes.result;
      const content = candidates.join('\n\n---\n\n');  // D-032 · 1 行 + '---' 分隔
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'CopywritingAgent',
          agentMode: 'boom',
          sourceType: 'user',
          inputSummary: (input.theme ?? input.industry ?? 'boom').substring(0, 100),
          content,
          contentType: 'markdown',
          scriptType: null,
          elements: input.elements,
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),
  ```
- [ ] `tests/integration/api/boom-generate-llm.test.ts` 1 integration · nock SDK + 5 篇候选 → 1 行 history 含 '---' 分隔 + cost_log 写入
- [ ] `tests/unit/api/boom-generate-router.test.ts` 4 unit · happy + zod fail elements 空 + Specialist throw → fallback + agentMode='boom'

#### E · 边缘

- [ ] zod input fail(elements 空 / industry > 64 / theme > 200)→ TRPCError BAD_REQUEST
- [ ] boom mode candidates 数组 ≠ 5 → schema fail → fallback(BaseSpecialist 自动)
- [ ] industry 未提供 → 用户账号 industry 默认(从 ctx.activeAccount.industry 读 · 实施时检查 ctx 是否含 account 数据 · 否则前端必填)

#### B · 业务

- [ ] history.agentId='CopywritingAgent' · agentMode='boom' · contentType='markdown'(5 篇 markdown 用 '---' 分隔 · D-032)
- [ ] history.scriptType=null(boom 不限 scriptType · 用户选 elements 而非 scriptType)
- [ ] history.elements=input.elements(D-024 · /history 筛选支持)
- [ ] cost_log 写入由 BaseSpecialist 自动(同 US-003)

#### P · 性能

- [ ] `boomGenerate.generate` < 60s(含 LLM · 5 篇候选 SSE 流式)· P95 < 50s
- [ ] history.create < 50ms

#### Common

- [ ] Tests pass + typecheck

---

### **AC-006 · Wave 1 · /boom-generate 前端 · BoomGenerate.tsx 真表单 + 5 篇渲染**(US-006 · medium)

#### H · 主路径

- [ ] `apps/web/src/pages/tools/BoomGenerate.tsx` 替换 PRD-3 占位 · ToolForm + ElementsMultiSelect 22 + industry input default account.industry + theme input optional · submit 调 `trpc.boomGenerate.generate` · onSuccess → setResult → `<ToolResult toolKey="boomGenerate" data={result} />`
- [ ] `<BoomGenerateResult>` 子组件 · `data.content.split(/\n*---\n*/)` → 5 篇候选 · grid md:grid-cols-2 · 每篇 Card + react-markdown 渲染 + 字数统计 + copy button(navigator.clipboard.writeText + toast.success)
- [ ] `tests/unit/web/pages/BoomGenerate.test.tsx` ≥ 5 unit · 表单 render + 5 篇 split 渲染 + copy button + LS 预填
- [ ] `tests/e2e/tool-boom-generate.spec.ts` 1 e2e · CI mock 5 篇 · 选 elements → submit → 5 卡片渲染

#### E · 边缘

- [ ] elements 空提交 · zod fail → 'elements 至少 1 项'
- [ ] elements 超 8 个 · zod fail → 'elements 最多 8 项'(防 LLM context 太长)
- [ ] split '---' 后篇数 ≠ 5 → 提示"输出格式异常"+ 显示原始 content(防止 5 篇结构被破坏时无法渲染)
- [ ] copy button 点击 → navigator.clipboard 失败(权限拒)→ toast.error('复制失败 · 请手动')

#### B · 业务

- [ ] LS namespace `aiip_memory_acc_{accountId}_tool_boomGenerate_input`
- [ ] industry default 用 useActiveAccount 读 active account industry · 用户可手动覆盖
- [ ] FeedbackButton 复用(content 渲染区下方)

#### P · 性能

- [ ] BoomGenerate.tsx initial render < 100ms
- [ ] split + 5 卡片 render < 30ms
- [ ] copy button 点击 < 100ms feedback

#### Common

- [ ] Tests pass + typecheck + e2e pass
- [ ] **使用 agent-browser 在浏览器中验证** · 打开 `/boom-generate` · 选 elements=[fear, scarcity, narrative] + theme="减肥" · 点"一键生成爆款文案" · 看到 5 卡片 grid + 每篇可复制 + 无控制台错误

---

### **AC-007 · Wave 1 · /analysis 后端 · 新建 analysis.ts router**(US-007 · high)

#### H · 主路径

- [ ] `apps/api/src/trpc/routers/analysis.ts` 新建 ·
  ```typescript
  import { z } from 'zod';
  import type { Prisma } from '@prisma/client';
  import { router } from '@/trpc/trpc';
  import { protectedProcedure } from '@/trpc/middleware/account-isolation';
  import { analysisAgent } from '@/specialists/AnalysisAgent';
  import { analysisStructuralInput } from '@quanqn/schemas/specialist-io';
  
  const HISTORY_SELECT = { id: true, content: true, agentId: true, traceId: true, createdAt: true } satisfies Prisma.HistorySelect;
  
  export const analysisRouter = router({
    analyze: protectedProcedure
      .input(analysisStructuralInput)  // { copy }
      .mutation(async ({ ctx, input }) => {
        const { prisma, activeAccountId, traceId } = ctx;
        const agentRes = await analysisAgent.execute({
          accountId: activeAccountId!,
          mode: 'structural',
          userInput: input,
          traceId: traceId ?? undefined,
        });
        const row = await prisma.history.create({
          data: {
            accountId: activeAccountId!,
            agentId: 'AnalysisAgent',
            agentMode: 'structural',
            sourceType: 'user',
            inputSummary: input.copy.substring(0, 100),
            content: JSON.stringify(agentRes.result),
            contentType: 'json',
            scriptType: null,
            elements: [],
            isFallback: agentRes.isFallback,
            tokensUsed: agentRes.tokensUsed,
            modelUsed: agentRes.modelUsed,
            durationMs: agentRes.durationMs,
            traceId: traceId ?? null,
          },
          select: HISTORY_SELECT,
        });
        return row;
      }),
  });
  ```
- [ ] `apps/api/src/trpc/_app.ts` 注册 `analysis: analysisRouter`
- [ ] `packages/clients/src/router-types.ts` shadow router 加 `analysis: { analyze: ... }`(input + output type)
- [ ] `tests/integration/api/analysis-structural-llm.test.ts` 1 integration · nock SDK + history 写入 + cost_log
- [ ] `tests/unit/api/analysis-router.test.ts` 4 unit

#### E · 边缘

- [ ] copy < 10 字 → zod fail → BAD_REQUEST
- [ ] copy > 3000 字 → zod fail
- [ ] analysisAgent throw SchemaValidationError(scores 不全)→ fallback path

#### B · 业务

- [ ] history.agentId='AnalysisAgent' · agentMode='structural' · contentType='json'(JSON.stringify scores+optimizations+rewriteSnippet)
- [ ] history.scriptType=null · elements=[](structural 不涉及 scripts/elements)
- [ ] cost_log 写入 eventType='specialist_call'(BaseSpecialist 自动)

#### P · 性能

- [ ] `analysis.analyze` < 10s(含 LLM lightweight · short output)· P95 < 8s

#### Common

- [ ] Tests pass + typecheck

---

### **AC-008 · Wave 1 · /analysis 前端 · 5 维度 progress bar 渲染**(US-008 · medium)

#### H · 主路径

- [ ] `apps/web/src/pages/tools/Analysis.tsx` 替换 PRD-3 占位 · ToolForm + copy textarea min 10 + 字符计数(react-hook-form watch) · submit 调 `trpc.analysis.analyze` · onSuccess → setResult → `<ToolResult toolKey="analysis" data={result} />`
- [ ] `<AnalysisResult>` 子组件 · `JSON.parse(data.content)` → 5 维度 Progress bar(shadcn Progress)· 颜色:overall>=80 绿 / >=60 黄 / <60 红 · optimizations Card 列表 含 dimension+issue+suggestion · rewriteSnippet 高亮 Card
- [ ] `tests/unit/web/pages/Analysis.test.tsx` ≥ 5 unit
- [ ] `tests/e2e/tool-analysis.spec.ts` 1 e2e · CI mock

#### E · 边缘

- [ ] copy 不足 10 字 → zod fail Chinese error
- [ ] JSON.parse 失败(content 非合法 json)→ catch + 显示 "解析失败 · 请重试"
- [ ] scores.overall 字段缺失 → Progress bar 显示 N/A

#### B · 业务

- [ ] LS namespace `aiip_memory_acc_{accountId}_tool_analysis_input`
- [ ] FeedbackButton 复用
- [ ] LD-015 0 hardcode color · Progress 颜色用 theme('colors.X') 或 Tailwind 语义类(bg-green-500 / bg-yellow-500 / bg-red-500 也可 · 实施时统一)

#### P · 性能

- [ ] Analysis.tsx initial render < 100ms
- [ ] Progress 5 个 < 10ms render

#### Common

- [ ] Tests pass + typecheck + e2e pass
- [ ] **使用 agent-browser 在浏览器中验证** · 打开 `/analysis` · 粘贴一段 200 字文案 · 点"开始分析" · 看到 5 维度 progress bar + 3+ 优化建议 + rewriteSnippet + 无控制台错误

---

### **AC-009 · Wave 1 · /video-analysis 后端 · viral mode + 删 rewrite**(US-009 · high)

#### H · 主路径

- [ ] `apps/api/src/trpc/routers/videoAnalysis.ts` 改 analyze ·
  ```typescript
  analyze: protectedProcedure
    .input(analyzeVideoInput)  // { lastTitle?, lastCopy } 重写后
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const agentRes = await analysisAgent.execute({
        accountId: activeAccountId!,
        mode: 'viral',
        userInput: input,
        traceId: traceId ?? undefined,
      });
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'AnalysisAgent',
          agentMode: 'viral',
          sourceType: 'user',
          inputSummary: (input.lastTitle ?? input.lastCopy.substring(0, 100)),
          content: JSON.stringify(agentRes.result),
          contentType: 'json',
          scriptType: null,
          elements: agentRes.result.analysis.elements,
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),
  ```
- [ ] **删除 `rewrite` procedure**(D-028 · viral mode 已含 rewriteVersion · 减表面积)
- [ ] `packages/clients/src/router-types.ts` shadow router 改 `videoAnalysis.analyze` input/output · 删 `rewrite`
- [ ] `tests/integration/api/video-analysis-viral-llm.test.ts` 1 integration
- [ ] `tests/unit/api/video-analysis-router.test.ts` 4 unit

#### E · 边缘

- [ ] lastCopy < 10 字 → zod fail
- [ ] lastCopy > 3000 字 → zod fail
- [ ] viral mode insights < 3 → schema fail → fallback
- [ ] elements 字段为空数组 → history.elements=[] OK(LLM 无识别 · 不阻断)

#### B · 业务

- [ ] history.agentId='AnalysisAgent' · agentMode='viral' · contentType='json'
- [ ] history.elements=analysis.elements(D-024 · /history 筛选支持)
- [ ] cost_log eventType='specialist_call'

#### P · 性能

- [ ] `videoAnalysis.analyze` < 15s(viral 含 22 元素拆解 + 仿写 · 稍长)· P95 < 12s

#### Common

- [ ] Tests pass + typecheck

---

### **AC-010 · Wave 1 · /video-analysis 前端 · 22 元素 tag + 仿写渲染**(US-010 · medium)

#### H · 主路径

- [ ] `apps/web/src/pages/tools/VideoAnalysis.tsx` 替换 PRD-3 占位 · ToolForm + lastTitle input optional + lastCopy textarea min 10 · submit 调 `trpc.videoAnalysis.analyze` · onSuccess → setResult → `<ToolResult toolKey="videoAnalysis" data={result} />`
- [ ] `<VideoAnalysisResult>` 子组件 · `JSON.parse(data.content)` → analysis.elements 渲染为 Badge tag 列表(对照 HOT_ELEMENT_KEYS_22 中文映射 · 例 · `'fear' → '恐惧'`)· insights 列表 Card 含 element+explanation+impact 高/中/低色标 · rewriteVersion 长文 react-markdown
- [ ] `tests/unit/web/pages/VideoAnalysis.test.tsx` ≥ 5 unit
- [ ] `tests/e2e/tool-video-analysis.spec.ts` 1 e2e · CI mock

#### E · 边缘

- [ ] lastCopy 不足 10 字 → zod fail
- [ ] JSON.parse 失败 → 显示 "解析失败"
- [ ] elements 空数组 → tag 区显示 "无识别元素"
- [ ] insights 数组 < 3 → 已 schema 兜底 + fallback · 前端只显示有的

#### B · 业务

- [ ] LS namespace `aiip_memory_acc_{accountId}_tool_videoAnalysis_input`
- [ ] HOT_ELEMENT_KEYS_22 中文映射 · `apps/web/src/lib/constants/hotElementsZh.ts` 新建(`fear: '恐惧' / scarcity: '稀缺'` 等 22 项)· 跟 packages/schemas constants.ts 手动同步
- [ ] FeedbackButton 复用

#### P · 性能

- [ ] VideoAnalysis.tsx initial render < 100ms
- [ ] tag + insights + rewriteVersion 全 render < 50ms

#### Common

- [ ] Tests pass + typecheck + e2e pass
- [ ] **使用 agent-browser 在浏览器中验证** · 打开 `/video-analysis` · 粘贴爆款文案 200+ 字 · 点"开始深度解析" · 看到 elements tag + 3+ insights + rewriteVersion 全文 + 无控制台错误

---

### **AC-011 · Wave 2 · /history 接入**(US-011 · medium)

#### H · 主路径

- [ ] `apps/api/src/trpc/routers/history.ts` 新建 ·
  ```typescript
  export const historyRouter = router({
    list: protectedProcedure
      .input(z.object({
        agentId: z.string().max(64).optional(),
        agentMode: z.string().max(32).optional(),
        sourceType: z.string().max(32).optional(),
        dateRange: z.enum(['last_7d', 'last_30d', 'all']).default('all'),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        const { prisma } = ctx;
        const where: Prisma.HistoryWhereInput = {};
        if (input.agentId) where.agentId = input.agentId;
        if (input.agentMode) where.agentMode = input.agentMode;
        if (input.sourceType) where.sourceType = input.sourceType;
        if (input.dateRange === 'last_7d') where.createdAt = { gte: new Date(Date.now() - 7*86400000) };
        if (input.dateRange === 'last_30d') where.createdAt = { gte: new Date(Date.now() - 30*86400000) };
        return prisma.history.findMany({
          where, orderBy: { createdAt: 'desc' },
          take: input.limit, skip: input.offset,
          select: { id: true, agentId: true, agentMode: true, sourceType: true, inputSummary: true, content: true, contentType: true, scriptType: true, elements: true, isFallback: true, traceId: true, createdAt: true },
        });
      }),
    detail: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        return ctx.prisma.history.findUniqueOrThrow({ where: { id: input.id } });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.prisma.history.delete({ where: { id: input.id } });
        return { ok: true };
      }),
  });
  ```
- [ ] `apps/api/src/trpc/_app.ts` 注册 `history: historyRouter`
- [ ] `packages/clients/src/router-types.ts` shadow router 加 history.list/detail/delete
- [ ] `apps/web/src/pages/modules/History.tsx` 替换占位 · ~250 行 · Table + 筛选 + 跳转
- [ ] 4 工具页(Generate / BoomGenerate / Analysis / VideoAnalysis)各加 useEffect 读 `?historyId=N` 预填表单
- [ ] `tests/unit/api/history-router.test.ts` ≥ 6 unit
- [ ] `tests/e2e/history-flow.spec.ts` 1 e2e

#### E · 边缘

- [ ] limit > 100 → 强制 100(zod max)
- [ ] dateRange 不在 enum → zod fail BAD_REQUEST
- [ ] history.detail.id 不存在 → findUniqueOrThrow 抛 NOT_FOUND
- [ ] history.delete 跨 account · accountId RLS 自动拦截(LD-009)
- [ ] 历史 1000+ 行 · pagination 切片正确(skip + take)
- [ ] 跳转 URL `?historyId=invalid` → Number(invalid)=NaN → trpc.history.detail.useQuery enabled=false · 不报错

#### B · 业务

- [ ] history.list 走 protectedProcedure(REJ-013 · accountIsolation middleware 自动 RLS)
- [ ] 跳转预填策略 · 4 工具页各 useEffect read `?historyId=N` → trpc.history.detail.useQuery → 预填 ToolForm.defaultValues + setResult(显示历史 content)
- [ ] 不持久(用户改表单 + submit 才覆盖 LS)
- [ ] dateRange 用枚举(last_7d / last_30d / all)而非自由日期(简化前端 · 留下个 PRD 加自定义)
- [ ] inputSummary 是 substring(0, 100)(各 router 写入时已截断)· 表格预览不超 100 字

#### P · 性能

- [ ] `history.list` < 200ms(单 account 200 行 + 索引 `@@index([accountId, createdAt(sort: Desc)])` 已建)· P95 < 100ms
- [ ] `history.detail` < 50ms(by id · primary key)
- [ ] `history.delete` < 50ms
- [ ] History.tsx Table render 100 行 < 100ms

#### Common

- [ ] Tests pass + typecheck + e2e pass
- [ ] **使用 agent-browser 在浏览器中验证** · 打开 `/history` · 看到表格 · 筛选 "Boom" · 点某行 · 跳到 `/boom-generate?historyId=N` · 表单预填 + 结果区显示历史 content + 无控制台错误

---

### **AC-012 · 收官 · LLM Judge 4 mode + 4 工具 e2e + lint clean + typecheck**(US-012 · medium)

#### H · 主路径

- [ ] `tests/judge/copywriting-free.judge.ts` 新建 · 2 golden case ·
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { runJudge } from './judge-runner';
  import { copywritingAgent } from '@/specialists/CopywritingAgent';
  
  describe('CopywritingAgent · free mode · LLM Judge', () => {
    it('医美自媒体 · 主题 "熬夜也能皮肤好"', async () => {
      const result = await copywritingAgent.execute({
        accountId: 1,
        mode: 'free',
        userInput: { scriptType: 'tutorial', elements: ['fear', 'data'], topic: '熬夜也能皮肤好' },
      });
      const judgment = await runJudge({
        case_: '检查 markdown 是否含 hook + 干货 + cta + 0 编造数据',
        output: result.result.markdown,
      });
      expect(judgment.passed).toBe(true);
    });
    it('健身教练 · 主题 "30 天减脂"', async () => { /* ... */ });
  });
  ```
- [ ] `tests/judge/copywriting-boom.judge.ts` 新建 · 2 golden case(育儿 + 理财 · 各 5 篇候选)
- [ ] `tests/judge/analysis-viral.judge.ts` 新建 · 2 golden case(美妆 + 美食 · 22 元素拆解 · 检查 elements 数组非空 + insights ≥ 3)
- [ ] `tests/judge/analysis-structural.judge.ts` 新建 · 2 golden case(减肥 + 育儿 · 5 维度评分 · 检查 overall = 5 维度均分附近)
- [ ] `pnpm test:judge` 退出码 0 · 22 / 22 pass
- [ ] `tests/e2e/tools-integration.spec.ts` 新建 · 收官 e2e · test.describe.serial · 创建账号 → 跑通 4 工具 → 看 history 4 条 → 点 row 预填验证 · CI 用 mock LLM
- [ ] `pnpm --filter @quanqn/web lint --max-warnings=0` 退出码 0
- [ ] `pnpm --filter @quanqn/api lint --max-warnings=0` 退出码 0
- [ ] `pnpm typecheck` 6 ws 0 error
- [ ] `pnpm test` ≥ 393 / ≥ 393(343 PRD-4 + ≥ 50 新)
- [ ] `pnpm test:e2e` ≥ 111 / ≥ 111(106 PRD-4 + 5 新)
- [ ] `scripts/ralph/verify-artifacts/US-012/manifest.json` 写入全套测试结果(同 PRD-4 US-018 manifest 模式)

#### E · 边缘

- [ ] LLM Judge 某 case 失败 · runJudge.passed=false → vitest fail · 反馈 LLM 输出哪条不符要求(retry 1 内置)
- [ ] e2e 跑 mock LLM 时 · 4 工具页 mutation onError 触发 toast.error · 不假成功
- [ ] lint warning(--max-warnings=0)→ 退出码 1 → ralph fail-over 修边缘 lint(同 US-018 PRD-4 模式)

#### B · 业务

- [ ] cost_log eventType='judge_call'(D-034)· 区分 specialist_call · 不污染产品数据
- [ ] e2e 用 dev@local.test 共享 user · workers=1 + fullyParallel=false 序列化(继承 PRD-4 US-018 教训)
- [ ] LLM Judge 用 lightweight model · cost ~$0.001/test · 22 tests/day = $0.66/月 · 完全可控

#### P · 性能

- [ ] judge 22 tests 总耗时 < 5min(lightweight · 串行)
- [ ] e2e 5 新 spec 总耗时 < 60s(CI mock LLM)
- [ ] typecheck < 5s(增量)
- [ ] lint < 5s

#### Common

- [ ] **全套绿灯** · vitest 393+/393+ ✓ + judge 22/22 ✓ + e2e 111+/111+ ✓ + typecheck 0 ✓ + lint 0 warnings ✓
- [ ] verify-artifacts 完整(同 PRD-4 US-018 模式)
- [ ] **使用 agent-browser 收官验证** · 创建测试账号 → /generate /boom-generate /analysis /video-analysis 4 工具各跑 1 次 → /history 看到 4 条 → 点任一行 → 预填验证 · 0 控制台错误

---

## §3 范围排除(11 项 · 详 §0 「本 PRD 暂不做」+ Assumptions §A2.2)

| # | 排除项 | 留 PRD | 理由 |
|:-:|---|:-:|---|
| 1 | CopywritingAgent acquisition mode + /acquisition-video 工具页 | PRD-6 | 跟 VideoAgent acquisition mode 一起做 · 视频获客类 · 输出含 CTA |
| 2 | TopicAgent trending mode + /trending 工具页 + TrendingScraper Worker | PRD-6 | 抓取合规风险 · 留 P5 启动前法务确认(详 ARCHITECTURE §9.13b)|
| 3 | VideoAgent production / acquisition / storyboard mode + 3 工具页 + ImageGen Worker | PRD-6 | 视频深度模块 · ImageGen 异步队列复杂 |
| 4 | MonetizationAgent 独立工具版 + /monetization | PRD-7 | step4b 已 PRD-4 落地 · 独立工具版复用模板留 PRD-7 |
| 5 | PrivateDomainAgent 6 stage + /private-domain | PRD-7 | 6 stage tabs 切换状态机复杂 |
| 6 | DiagnosisAgent + /diagnosis(8 步问卷)| PRD-7 | 独立第三方流程 · 不属 9 步 |
| 7 | DeepLearnAgent + /deep-learning | PRD-7 | 写记忆 · 不直接生成 · L4 Samples 相关 |
| 8 | VoiceChatAgent + /voice-chat(L5 自治)| PRD-7 | 多轮对话 + STT/TTS Worker 复杂 |
| 9 | EvolutionAgent + /evolution + DailyTaskAgent + /daily-tasks | PRD-7 | 反馈飞轮真接 + Heartbeat 0 点跑批 |
| 10 | RAG 真接 + /knowledge | PRD-9 | pgvector 入库 + 67 案例 + 22 元素 + 23 公式 |
| 11 | /present-styles 静态页 + 反馈飞轮 EvolutionProfile 真生成 | PRD-9 | 14 呈现形式静态化 + EvolutionProfile 留 PRD-7+ |
| 12 | admin 任何代码 | PRD-10~14 | 独立子系统 · 不在主应用 P0-P9 范围 |

---

## §4 风险 + 缓解(7 项 · 详 Assumptions §A5)

| # | 风险 | 缓解 |
|:-:|---|---|
| R1 | mode 分支让 prompt 复杂 · 测试用例量翻倍 · 6 mode total(Copywriting 4 + Analysis 2)| ContextAssembler 模板 + Specialist persona 共享 95% · mode 分支只在 invokeLLM 内部 _buildUserPrompt(mode) · prompt 复杂度可控 |
| R2 | CopywritingAgent + AnalysisAgent _mode race(TD-014 模式继承 · 第 5 处复用)| 工具页是独立调用 · 用户串行点 generate / boom · 不并发 · race 概率仍低 · TD-014 文档化 · 不修留 PRD-7+ |
| R3 | /history 跨 router 写入 cross-cut(7+ router 写)· agentId 命名规范不一致(TD-016)| US-001 同步 7 router agentId 全用 Class name 大写 · history.list filter 统一 by Class name · audit grep `agentId: '[a-z]` 在 apps/api/src 应 0 命中 |
| R4 | acquisition mode 漏改 throw 文案(PRD-4 时 'PRD-5' · 现要 'PRD-6')| US-002 outputSchema getter + invokeLLM 同步改 acquisition throw 'PRD-6' · audit grep `'Not implemented · PRD-5' apps/api/src/specialists/CopywritingAgent.ts` 应 0 命中(全替换)|
| R5 | LLM Judge 套件成本累加(8 新 + 14 既有 = 22 tests · lightweight model)| ~$0.66/月 · 完全可控 · CI cron 每天 1 次 · PR-only 不跑 |
| R6 | /history 性能(单 account 历史可能 1000+ 行)| pagination(limit max 100 default 20)+ 索引 `@@index([accountId, createdAt(sort: Desc)])` 已建 · React Query infinite scroll 或分页 |
| R7 | 22 元素 + 20 脚本类型常量同步(packages/schemas vs apps/api/src/lib/constants)| US-001 重写 schema 时 inline 到 packages/schemas/src/specialist-io/constants.ts · 跟 apps/api/src/lib/constants/{hotElements,scriptTypes}.ts 手动同步(audit grep diff · 防漂移)|

---

## §5 测试配额(对齐 LD-016 + 架构 §7)

### §5.1 单元测试配额

| 来源 | 数量 |
|---|:-:|
| US-001 schemas 验证(analysis viral/structural input + output · constants 长度 · ToolForm useForm + zodResolver + LS dual-write + AbortController · ToolResult switch by toolKey)| 16 |
| US-002 AnalysisAgent.test.ts(2 mode × 4 场景)+ CopywritingAgent.test.ts 加 free/boom 8 新 | 16 |
| US-003 copywriting-router.test.ts(freeGenerate happy + zod fail + Specialist throw + agentMode)| 4 |
| US-004 Generate.test.tsx(表单 + zod + mutation + LS)| 5 |
| US-005 boom-generate-router.test.ts | 4 |
| US-006 BoomGenerate.test.tsx(5 篇 split + copy)| 5 |
| US-007 analysis-router.test.ts | 4 |
| US-008 Analysis.test.tsx(5 维度 progress)| 5 |
| US-009 video-analysis-router.test.ts(elements 字段传递)| 4 |
| US-010 VideoAnalysis.test.tsx(tag + insights)| 5 |
| US-011 history-router.test.ts(list filter / detail RLS / delete RLS / pagination)| 6 |
| US-012(LLM Judge 不算 unit · 算 judge)| 0 |
| **小计** | **74 新** |

### §5.2 集成测试配额

| 文件 | 内容 |
|---|---|
| `tests/integration/api/copywriting-free-llm.test.ts`(US-003)| nock SDK + 真 DB cost_log + history 写入 |
| `tests/integration/api/boom-generate-llm.test.ts`(US-005)| nock SDK + 5 篇候选 split '---' 写 1 行 history |
| `tests/integration/api/analysis-structural-llm.test.ts`(US-007)| nock SDK + structural scores + history 写入 |
| `tests/integration/api/video-analysis-viral-llm.test.ts`(US-009)| nock SDK + viral elements + history 写入 |
| **小计 4 新** | |

### §5.3 LLM Judge 测试配额

| 文件 | golden case |
|---|---|
| `tests/judge/copywriting-free.judge.ts`(US-012)| 2(医美 + 健身)|
| `tests/judge/copywriting-boom.judge.ts`(US-012)| 2(育儿 + 理财)|
| `tests/judge/analysis-viral.judge.ts`(US-012)| 2(美妆 + 美食)|
| `tests/judge/analysis-structural.judge.ts`(US-012)| 2(减肥 + 育儿)|
| **小计 8 新 · 累计 22**(14 PRD-4 + 8 新)| |

### §5.4 E2E 配额

| 文件 | 路径 |
|---|---|
| `tests/e2e/tool-generate.spec.ts`(US-004)| /generate 基本路径(CI mock)|
| `tests/e2e/tool-boom-generate.spec.ts`(US-006)| /boom-generate 基本路径 |
| `tests/e2e/tool-analysis.spec.ts`(US-008)| /analysis 基本路径 |
| `tests/e2e/tool-video-analysis.spec.ts`(US-010)| /video-analysis 基本路径 |
| `tests/e2e/history-flow.spec.ts`(US-011)| history 跳转 · generate → /history → row → 跳回工具页预填 |
| `tests/e2e/tools-integration.spec.ts`(US-012)| 收官 serial · 创建账号 → 跑 4 工具 → 看 history 4 条 → 跳预填 |
| **小计 6 新 · 累计 ≥ 112**(106 PRD-4 + 6 新)| |

### §5.5 全套绿灯门禁(US-012 收官硬门禁)

```
vitest:        ≥ 393 / ≥ 393 ✓ (343 PRD-4 累计 + ≥ 50 新)
test:judge:    22 / 22 ✓ (14 PRD-4 + 8 新)
playwright:    ≥ 111 / ≥ 111 ✓ (106 PRD-4 + 5 新)
typecheck:     6 ws · 0 error ✓
lint:          0 warnings (--max-warnings=0) ✓ (防 PRD-1 lint debt 重现)
```

---

## §6 退出条件(7 项 · 对齐 ARCHITECTURE §9.6 · 详 Assumptions §2)

| # | 退出条件 | 验证 |
|:-:|---|---|
| 1 | /generate 工具页跑通(CopywritingAgent free mode 真接 LLMGateway · 输出 markdown 长文 400-1200 字) | tests/e2e/tool-generate.spec.ts(CI mock)+ tests/integration/api/copywriting-free-llm.test.ts(nock SDK)+ agent-browser 实测 |
| 2 | /boom-generate 工具页跑通(CopywritingAgent boom mode · 5 篇候选 各 200-500 字 · split '---' 渲染) | 同上模式 |
| 3 | /analysis 工具页跑通(AnalysisAgent structural mode · 5 维度评分 + 优化 + rewriteSnippet) | 同上模式 |
| 4 | /video-analysis 工具页跑通(AnalysisAgent viral mode · 22 元素拆解 + insights + rewriteVersion) | 同上模式 |
| 5 | /history 跑通(读 history 表 + 筛选 + 跳转预填到对应工具页 · 4 工具页 useEffect 读 ?historyId 预填)| tests/e2e/history-flow.spec.ts + agent-browser 实测 |
| 6 | LLM Judge 套件 22 tests pass(7 既有 + 4 mode × 1-2 = 8 新)| `pnpm test:judge` 退出码 0 |
| 7 | lint clean(--max-warnings=0)+ typecheck 0(6 ws)+ vitest 393+ + e2e 111+ | US-012 收官 manifest.json |

---

## §7 Locked Decisions(D-026 ~ D-035 · 跨 PRD 编号延续)

> **跨 PRD 编号延续规则** · D-001~D-025 已用(PRD-1~4)· PRD-5 从 D-026 起 · 不重置。

| 编号 | 决策 | 理由 | 替代选项(为什么不选)|
|:-:|---|---|---|
| **D-026** | `copywriting.generate` procedure 不动 · 新建 `copywriting.freeGenerate` procedure 服务 /generate 工具页 | 兼容 PRD-4 stepData router 现有调用(generate 服务 /step/7)· 命名清晰 · 0 破坏 | 选项 A 扩展 generate 按 input.mode 路由(混乱 · 同名 procedure 服务两个语义)· 选项 C 重命名 generate → step7Generate(改 stepData 调用 · 多 1 处改动 · 风险)|
| **D-027** | CopywritingAgent free/boom mode prompt 模板复用 PROMPTS.md §5.4 / §5.5 · 直接 inline 到 _buildUserPrompt(mode)内 · 不抽到 templates/ | PROMPTS.md 已写好 · 不重新设计 · ContextAssembler.templates/copywriting.ts 是 system persona 段 · _buildUserPrompt 是 user prompt 段 · 职责分离 | 抽到 templates/ 多 4 文件(per mode)· 增加耦合 |
| **D-028** | AnalysisAgent 2 mode 用 `_mode + outputSchema getter`(同 PRD-4 既有 4 Specialist 模式)· **不用** `z.discriminatedUnion('mode', [...])` | 跟 PositioningAgent / BrandingAgent / VideoAgent / CopywritingAgent 4 个多 mode Specialist 一致(TD-014 模式继承 · AGENTS §11.6.3 文档化)· 一致性优先 | discriminatedUnion 是 stateless 安全 · 但跟现 4 Specialist 模式不一致 · 一致性优先 |
| **D-029** | /history 接入策略 · 单一 `history.list` procedure + 各 router 写入(分散写 · 集中读) · 新建 `history.ts` router · 不重命名各 router 的写入 | 写入由各工具自然完成(generate / boom / analysis / etc)· 读取统一 history.list filter by agentId / sourceType / dateRange · 单一真理源 · 职责清晰 | 每 router 各自 list(copywriting.list / boomGenerate.list / etc)· 前端 /history 页面调多个 · 复杂度爆炸 |
| **D-030** | 工具页表单模板 · **新建** `ToolForm` wrapper · **不复用** PRD-4 StepForm | StepForm 强制 stepKey + LS namespace `acc_{id}_step_{key}` · 工具页 LS namespace 不同(`acc_{id}_tool_{tool}`)· stepKey 不必填 · 抽离 ToolForm 更清晰 | StepForm 加 optional toolKey · stepKey/toolKey 二选一(API 复杂)· 不推荐 |
| **D-031** | LS namespace 策略 · 工具页独立 namespace `acc_{id}_tool_{tool}` · `getToolLsKey(accountId, toolKey, suffix)` export from ls-namespace.ts | 防工具页之间 LS key 冲突(`acc_1_tool_generate_input` vs `acc_1_tool_boom_input`)· 同 step namespace 模式 | 共享 acc_{id} 前缀 + tool_{tool} 嵌入 suffix(混乱) |
| **D-032** | boom mode 5 篇候选写 history **1 行**(content=5 篇 markdown 用 '---' 分隔)| PROMPTS.md §5.4 boom 输出 `result: string`(用 '---' 分隔的 markdown)· 单一 history 行 · 1 次调用 = 1 行(history 模型一致性)· 前端 ToolResult split('---').map() 渲染 5 篇 | 写 5 行(每篇独立)· 列表渲染更直观但破坏 history 模型(1 次调用 = 1 行) |
| **D-033** | 22 爆款元素 + 20 脚本类型常量 inline 到 `packages/schemas/src/specialist-io/constants.ts` · **不 import** apps/api | packages/schemas 不能 import apps/api(PRD-4 US-011 教训)· 必须 inline · 跟 apps/api/src/lib/constants/{hotElements,scriptTypes}.ts 手动同步(audit grep diff) | 把常量从 packages/schemas import apps/api(monorepo 跨包 cycle 风险) |
| **D-034** | LLM Judge 各新 golden case 复用 PROMPTS.md §5/§9 给的真实场景 · cost_log eventType='judge_call' 区分 specialist_call | PROMPTS.md 已含示例 input/output · 不重新发明 · cost_log 区分让 PRD-11 admin 域 ④ 数据准确(specialist_call 是产品调用 · judge_call 是测试调用) | 重新设计 golden case(浪费时间) |
| **D-035** | CopywritingAgent acquisition mode throw 文案改 'PRD-6'(从现 'PRD-5')· US-002 同步改 outputSchema getter + invokeLLM 内 acquisition 分支 | PRD-5 解锁 free/boom 后 acquisition 继续不实施 · 现 throw 'Not implemented · PRD-5' 会让 ralph 实施时撞死循环(PRD-5 已 IN 但 acquisition 仍不实施)· 必须改文案防混淆 | 不改文案(违反语义 · 撞死循环) |

### §7.1 继承前序 LD(不重复 · 仅引用)

- **继承 D-017**(LLM 调用唯一通过 LLMGateway)· PRD-5 4 工具全走 BaseSpecialist + LLMGateway · 不直接 import @anthropic-ai/sdk
- **继承 D-018**(Specialist 不直调 LLM SDK · REJ-001)· §1 US-002 反例 grep 验证
- **继承 D-019**(cost_log.modelUsed 反映 LLMGateway 真选 model · stream meta chunk 模式)· PRD-5 SSE Specialist(free/boom)继承
- **继承 D-020**(ContextAssembler 4 路并行 + 5s timeout + 降级跑空)· PRD-5 不动 ContextAssembler 主结构 · 仅加 analysis 模板
- **继承 D-022**(IPProgressService status='completed' 才计 · fallback 不计)· PRD-5 不动 IPProgressService(本期不影响 9 步进度)
- **继承 D-023**(cost_log 写完整字段 · prompt_tokens/completion_tokens/duration/model/agent_id/trace_id/account_id + target jsonb)· PRD-5 4 router 调 BaseSpecialist 自动写
- **继承 D-024**(feedback_log 复用 cost_log + eventType 字段区分 · 不新建表)· PRD-5 不动 FeedbackButton(已 PRD-4 落地)
- **继承 D-025**(L5 RAG 本期降级跑空)· PRD-5 ContextAssembler analysis 模板 L5 RAG 同样降级

---

## §8 反例库自动注入(ralph skill 转 prd.json 时关键词命中)

> **机制** · ~/.claude/scripts/ralph/ralph.py + ralph-tools.py reject 自动入库 · prd skill 转 prd.json 时按关键词检索 · 注入到 anti_patterns 字段

### §8.1 关键词命中清单(PRD-5 US 全继承 17+ 反例)

| 关键词 | 命中 reject 反例(数) |
|---|:-:|
| `specialist` | REJ-001(SDK 直调)+ REJ-002(while 循环)+ REJ-003(model 硬编码 D-019)+ REJ-004(单实例 export)+ REJ-007(多 mode outputSchema getter)+ REJ-005(Specialist 不自己拼 prompt)+ REJ-006(Specialist 必设 timeout)= 7 |
| `llm` / `gateway` / `complete` / `stream` | REJ-001(SDK)+ REJ-003(model)+ REJ-006(timeout)+ REJ-033(zod 校验失败 retry · 不 throw)+ REJ-017(cost_log 必带 traceId)= 5 |
| `copywriting` | REJ-007(多 mode schema)+ REJ-005(prompt 装配)+ REJ-035(LS-first dual-write)+ REJ-010(LS namespace)= 4 |
| `analysis` / `viral` / `structural` | REJ-007 + REJ-013(stepData/feedbackLog 走 protectedProcedure)= 2 |
| `boom` | REJ-007 + REJ-005 = 2 |
| `sse` / `streaming` | REJ-002(不 while)+ REJ-003(model 硬编码 · stream meta chunk · D-019)= 2 |
| `history` / `cost_log` | REJ-008(prisma 必带 accountId)+ REJ-009(executeRaw 仅 middleware)+ REJ-013(protectedProcedure)+ REJ-017(traceId)= 4 |
| `tool` / `form` | REJ-010(LS namespace)+ REJ-035(LS-first DB 失败不回滚)= 2 |
| `prisma` / `schema` / `migration` | REJ-008 + REJ-009 + REJ-013 = 3 |

### §8.2 anti_patterns 注入示例(US-002 内会自动注入)

```json
{
  "id": "US-002",
  "anti_patterns": [
    { "source_prd": "QuanQn-base", "source_story": "REJ-001", "lesson": "Specialist execute() 不允许直接调 anthropic / openai SDK", "antipattern": "❌ import Anthropic from '@anthropic-ai/sdk' 直接在 AnalysisAgent.ts 内", "correct": "✅ 通过 this.llmGateway · grep '@anthropic-ai/sdk' 在 specialists/ 0 命中" },
    { "source_prd": "QuanQn-base", "source_story": "REJ-007", "lesson": "多 mode 共用一个 outputSchema", "antipattern": "❌ outputSchema 不区分 viral vs structural · 用同一个 schema", "correct": "✅ outputSchema getter · 按 this._mode 返回 ViralOutputSchema 或 StructuralOutputSchema" },
    { "source_prd": "QuanQn-base", "source_story": "REJ-003-D019", "lesson": "Specialist 不硬编码 model 名", "antipattern": "❌ const model = 'claude-sonnet-4-6'; this.llmGateway.complete({ model });", "correct": "✅ this.llmGateway.complete({ model_tier: 'lightweight' }) · LLMGateway 决定具体 model · cost_log.modelUsed 反映真选 model" },
    { "source_prd": "QuanQn-PRD-4", "source_story": "TD-014", "lesson": "Multi-mode Specialist _mode race window", "antipattern": "❌ 不文档化 race window · 高并发场景未来撞 race", "correct": "✅ AGENTS §11.6.3 文档化 · P3 单 user 串行安全 · 高并发治理留 PRD-7+" }
  ]
}
```

---

## §9 修订记录

- **2026-05-09 v0.1** · 初稿(prd skill 写完整版 · 1500+ 行 · 不简化)· Opus 主对话 · 用户已 review `.planning/prd-5-assumptions.md` "全部确认"
- 章节统计 · §0(45 行) · §1(440 行)· §1.5(190 行)· §2(800 行)· §3(20 行)· §4(20 行)· §5(80 行)· §6(15 行)· §7(60 行)· §8(50 行)· §9(本节)= 总 ~1720 行

---

> **本文件由 prd skill 在 Assumptions 模式经用户确认后写出 · 完整版 · 不简化 · 等 ralph skill 转 prd.json + /plan-check 7 项门禁 + SOP §9.1 5 步启 daemon。**
