# PRD-5 P4 创作模块 · Assumptions 清单(用户 review)

> **生成** · 2026-05-09 · prd skill Assumptions 模式 · Opus 主对话
> **目的** · 假设清单完整列出 · 用户只 review **哪些假设错** · 没纠错的视为正确 · 收到"全部正确"后 prd skill 写完整 PRD-5 文档(tasks/prd-5.md · 1500+ 行 · 不简化)
> **方法** · 8 维度假设 · 全 Anchored 在已 grep 的真实代码状态 · 不臆测

---

## 🎯 核心范围

```
PRD-5 P4 创作模块 · 2 周 · risk=high · branch=ralph/prd-5-p4-creation-modules
4 工具页(共享 Specialist 第一次验证)·
  · /generate(CopywritingAgent free mode · 中长文 400-1200 字)
  · /boom-generate(CopywritingAgent boom mode · 5 篇候选 各 200-500 字)
  · /analysis(AnalysisAgent structural mode · 5 维度评分 + 优化建议)
  · /video-analysis(AnalysisAgent viral mode · 22 元素拆解 + 1 篇仿写)
  · /history 接入(读 history 表 · 渲染列表 + 跳转预填到对应工具页)

Specialist 改动 ·
  · CopywritingAgent · 解锁 free + boom mode(currently throw 'Not implemented · PRD-5')· 保留 acquisition mode 仍 throw
  · AnalysisAgent · 全新建立(2 mode · z.discriminatedUnion · model_tier='lightweight')

依赖 ·
  · LLMGateway / BaseSpecialist / ContextAssembler / vitest.judge.config.ts / Aurelian Dark token / shadcn 12 组件 / packages/schemas/src/specialist-io · 全 PRD-1~PRD-4 已就位
```

---

## §1 技术假设(基于既有代码现状)

### A1.1 ✅ LLMGateway 已就位(PRD-2 US-007 + PRD-4 US-003 升级)

- 唯一入口 · `apps/api/src/workers/llm-gateway/index.ts` · `complete()` + `stream()` 两 API
- responseFormat 双模式 · Anthropic tool_use mode + OpenAI json_object mode(PRD-4 US-003)
- stream meta chunk 模式 · 首 chunk emit `{type:'meta', meta:{model:actualModel}}`(PRD-4 US-007 retry 1 落地)
- ratelimit · token bucket(Free 50/日 · Pro 500/日)
- cost-logger.ts metadata.eventType 穿透(PRD-4 US-016)

### A1.2 ✅ BaseSpecialist 已就位(PRD-4 US-001 / 003 / 015)

- `apps/api/src/specialists/base/BaseSpecialist.ts`(250 行)· 模板方法 4 步
- 子类只填 4 项(config + inputSchema + outputSchema + invokeLLM)
- isFallback 路径(US-015)· catch SchemaValidationError/LLMTimeoutError/5xx → fallbackTemplate?[mode] → status='fallback' + isFallback=true
- cost_log 写 7 字段(agentId/accountId/traceId/modelUsed/promptTokens/completionTokens/durationMs/callType='specialist_call'/eventType/target jsonb)
- TraceId 用 `generateSpecialistTraceId(accountId, agentId)`(REJ-017)

### A1.3 ✅ ContextAssembler 已就位(PRD-4 US-002)

- `apps/api/src/services/context-assembler/ContextAssembler.ts`(170 行)
- 4 路并行 Promise.allSettled + 各路 5s timeout(D-020)
- L2 stepData 真接 / L4 EvolutionProfile 降级 / L4 Samples 降级 / L5 RAG 降级跑空(D-025)
- MethodologyQueryWorker 真接(常量 industries / hotElements / scriptTypes)
- 7 Specialist 模板已就位(`templates/{positioning,branding,monetization,topic,video,copywriting,livestream}.ts`)
- ★ **PRD-5 需新增** · `templates/analysis.ts`(AnalysisAgent 模板)+ `SPECIALIST_TEMPLATES` barrel 加 'analysis' 入口

### A1.4 ✅ packages/schemas/src/specialist-io 子目录已成型(PRD-4 US-011 + TD-015 accepted)

- 现有 9 schema 文件 · `step-inputs.schema.ts` + `copywriting.schema.ts` + `videoAnalysis.schema.ts` + `boomGenerate.schema.ts` + `monetization.schema.ts` + `privateDomain.schema.ts` + `videoProduction.schema.ts` + `deepLearning.schema.ts` + `diagnosis.schema.ts` + `evolution.schema.ts` + `index.ts`
- ⚠️ **现有 schemas 偏简陋**(PRD-2 US-004 mock 时期产物)·
  - `copywriting.schema.ts` · 只有 generic `generateCopywritingInput`(stepKey + tone + length + context · 没 mode/elements/scriptType/topic 等真业务字段)+ 通用 `copywritingResultSchema`(id + content + agentId · 没真业务结构)
  - `videoAnalysis.schema.ts` · `analyzeVideoInput` 用 `videoUrl: z.string().url()`(URL 输入)· **但 PROMPTS.md §9.2 viral mode 是粘贴 lastCopy 文本**(非 URL)· schema 不匹配真业务
  - `boomGenerate.schema.ts` · 只有 generic `generateBoomInput`(stepKey + theme + tone + context · 没 elements 多选数组)
  - **analysis.schema.ts 不存在** · structural mode 无 schema
- ★ **PRD-5 需重写 4 schema** · 按 PROMPTS.md §5.4(boom 输出 5 篇 markdown 数组 · metadata.count=5)+ §9.2(viral 输出 analysis + insights + rewriteVersion)+ §9.3(structural 输出 scores 5 维度 + optimizations 3-5 + rewriteSnippet)+ §5.5(free 输出 markdown 长文 · metadata.scriptType/elements/structureSummary)

### A1.5 ✅ vitest.judge.config.ts 已就位(PRD-4 US-016)

- 独立 config + `package.json` test:judge script
- `tests/judge/judge-runner.ts` 共享 runJudge · model_tier='lightweight'
- 7 Specialist × 1-2 golden case = 14 tests pass
- ★ **PRD-5 新增** · `tests/judge/copywriting-free.judge.ts` + `copywriting-boom.judge.ts` + `analysis-viral.judge.ts` + `analysis-structural.judge.ts` 各 1-2 golden case

### A1.6 ✅ Aurelian Dark token + shadcn 12 已就位(PRD-1 US-004/005)

- `theme('colors.X')` 全 cover · LD-015 grep 0 hardcode hex
- shadcn 12 组件在 `apps/web/src/components/ui/`(PRD-1 US-005 · TD-005 留 P9.0 lift packages/ui)
- StepForm wrapper(PRD-4 US-011 · 595 行)+ StepResult wrapper(PRD-4 US-012)可借鉴

### A1.7 ✅ 反例库自动注入(PRD-4 retro 落地)

- `~/.claude/playbooks/reject-examples.jsonl` 17 条反例(REJ-001~035 + 最新 US-007 model 硬编码)
- prd skill 转 prd.json 时关键词命中(specialist / llm / copywriting / sse / streaming / analysis / boom)自动注入 anti_patterns 字段

### A1.8 ✅ AGENTS.md §11.6 后端 Specialist 实施沉淀(v0.4 · 2026-05-09 新增)

- §11.6.1 BaseSpecialist 模板方法 / §11.6.2 ContextAssembler / §11.6.3 多 mode + race window / §11.6.4 SSE meta chunk / §11.6.5 responseFormat 双 schema / §11.6.6 stepData.save 全 9 step / §11.6.7 LLM Judge 套件
- 7 节复用模板可直接套(PRD-5 不重复发明)

---

## §2 范围假设(明确 IN / OUT)

### A2.1 ✅ IN(本期 5 项交付)

| # | URL | Specialist · Mode | 后端工作 | 前端工作 |
|:-:|---|---|---|---|
| 1 | `/generate` | CopywritingAgent · **free mode**(解锁) | copywritingAgent free outputSchema + free invokeLLM 分支 + 新增 `freeGenerate` procedure(或扩展 `generate` 按 input.mode 路由) | Generate.tsx 占位 → 真表单(脚本类型 + 元素多选 + 主题 textarea) |
| 2 | `/boom-generate` | CopywritingAgent · **boom mode**(解锁) | copywritingAgent boom outputSchema(5 篇 markdown 数组)+ boom invokeLLM 分支 + boomGenerate.ts 替换 mock(调 copywritingAgent mode='boom') | BoomGenerate.tsx 占位 → 真表单(元素多选 22 个 + 行业 + 主题方向) |
| 3 | `/analysis` | AnalysisAgent · **structural mode**(新建) | AnalysisAgent.ts 新建 + structural outputSchema(5 维度评分 + 优化 3-5 + rewriteSnippet)+ 新增 analysis.ts router(或扩 videoAnalysis.ts) | Analysis.tsx 占位 → 真表单(粘贴文案 textarea) |
| 4 | `/video-analysis` | AnalysisAgent · **viral mode**(新建) | AnalysisAgent.ts viral outputSchema(analysis + insights[] + rewriteVersion)+ viral invokeLLM 分支 + videoAnalysis.ts 替换 mock(调 analysisAgent mode='viral') | VideoAnalysis.tsx 占位 → 真表单(标题选填 + 文案 textarea) |
| 5 | `/history` | (无 Agent · 数据视图) | history router 单独建(history.list with filter by agentId/sourceType/dateRange)+ 替代各 router 的 list mock | History.tsx 替换占位 → 真表格(列表 + 筛选 + 跳转预填到对应工具页) |

### A2.2 ✅ OUT(本期不做 · 留 PRD-6+)

- ❌ **acquisition mode**(/acquisition-video) · 留 PRD-6 跟 VideoAgent acquisition 一起做 · CopywritingAgent acquisition mode 仍 throw('Not implemented · PRD-6')
- ❌ **/trending**(TopicAgent trending mode + TrendingScraper Worker) · 留 PRD-6 视频模块
- ❌ **/video-production**(VideoAgent production mode) · 留 PRD-6
- ❌ **/ai-video**(VideoAgent storyboard + ImageGen Worker) · 留 PRD-6
- ❌ **/private-domain**(PrivateDomainAgent 6 stage) · 留 PRD-7
- ❌ **/monetization**(独立工具版 · MonetizationAgent 复用 step4b) · 留 PRD-7(主流程 step4b 已 PRD-4 US-006 落地 · 独立工具留 PRD-7)
- ❌ **/voice-chat**(VoiceChatAgent L5 自治) · 留 PRD-7
- ❌ **/deep-learning**(DeepLearnAgent · 写记忆) · 留 PRD-7
- ❌ **/present-styles**(静态 14 呈现形式) · 不需 Specialist · 留 PRD-8 静态页
- ❌ **/knowledge**(知识库 + RAG) · 留 PRD-9
- ❌ **EvolutionProfile 真生成 / DailyTask** · 留 PRD-7+(本期 ContextAssembler L4 仍降级跑空)
- ❌ **L5 RAG 真接** · 留 PRD-9(本期 D-025 降级跑空)
- ❌ **admin 任何代码** · 留 PRD-10~14

---

## §3 实现假设(基于现有代码 · 协议锁前置)

### A3.1 ✅ CopywritingAgent 解锁 free + boom · 保留 acquisition throw

**当前状态**(grep 实测) · `apps/api/src/specialists/CopywritingAgent.ts:107-108` ·
```ts
if (this._mode === 'step7') return CopywritingOutputSchema;
throw new Error('Not implemented · PRD-5');  // free / boom / acquisition 全 throw
```

**PRD-5 改动** ·
- 加 `Step1FreeOutputSchema = z.object({ markdown: z.string().min(400).max(1500), metadata: z.object({ scriptType, elements[], structureSummary, estimatedDuration }) })`
- 加 `BoomOutputSchema = z.object({ candidates: z.array(z.string().min(200).max(500)).length(5), metadata: z.object({ count: z.literal(5), elements[] }) })`
- outputSchema getter 改 ·
  ```ts
  get outputSchema() {
    if (this._mode === 'step7') return CopywritingOutputSchema;
    if (this._mode === 'free') return Step1FreeOutputSchema;
    if (this._mode === 'boom') return BoomOutputSchema;
    if (this._mode === 'acquisition') throw new Error('Not implemented · PRD-6');  // ★ 注意改为 PRD-6
    throw new Error(`Unknown mode: ${this._mode}`);
  }
  ```
- invokeLLM 分支 · free/boom 各 SSE stream(继承 PRD-4 US-007 _consumeStream 模式)· acquisition 仍 throw('Not implemented · PRD-6')
- fallbackTemplate 加 free/boom 兜底 markdown(满足 schema 长度约束)
- ★ **TD-014 模式继承** · _mode instance state + outputSchema getter · race window 警示文档化(P3 单 user 串行安全 · 高并发治理留 PRD-7+)

**反例 grep**(PRD-5 收尾 audit)·
- `grep -E "claude-[0-9]\|gpt-[0-9]" apps/api/src/specialists/CopywritingAgent.ts | grep -v "test"` 应 0 命中(REJ-003 D-019)
- `grep "stream.meta.model" apps/api/src/specialists/CopywritingAgent.ts` 应 ≥ 2 命中(free + boom 都用 meta chunk)

### A3.2 ✅ AnalysisAgent 全新建立(2 mode · model_tier='lightweight')

**协议锁** · `apps/api/src/specialists/AnalysisAgent.ts`(新建 · ~250 行预估)

**结构** ·
- type AnalysisMode = 'viral' | 'structural'
- private _mode: AnalysisMode = 'viral'
- config 五层 · model_tier='lightweight' · timeout_ms=30000(分析快) · streaming=false(短输出 · 不需 SSE)
- ViralOutputSchema = z.object({ analysis: { elements: z.array(z.enum(HOT_ELEMENT_KEYS)), structure, hookType, viralFormula }, insights: z.array(z.object({ element, explanation, impact: z.enum(['高','中','低']) })).min(3), rewriteVersion: z.string().min(50) })
- StructuralOutputSchema = z.object({ scores: { hook: z.number().min(0).max(100), structure, emotion, specificity, cta, overall }, optimizations: z.array(z.object({ dimension, issue, suggestion })).min(3).max(5), rewriteSnippet: z.string().min(50).max(200) })
- outputSchema getter 按 _mode
- invokeLLM 单 LLMGateway.complete()(non-SSE · 短输出)
- fallbackTemplate viral/structural 各兜底
- 单例 export `analysisAgent`

**ContextAssembler 模板** · `apps/api/src/services/context-assembler/templates/analysis.ts`(新建 · ~10 行 · 同其他 7 模板 persona + methodology 段)+ `templates/index.ts` SPECIALIST_TEMPLATES 加 'analysis'

**反例 grep** · 同 §A3.1

### A3.3 ⚠️ 既有 router 现状 · 协议锁前置(防 TD-012 类)

**Grep 实测** ·

| router | 行数 | 当前实施 | PRD-5 处理 |
|---|:-:|---|---|
| `copywriting.ts` | 122 行 | `generate`(真接 CopywritingAgent step7 · PRD-4 US-009 写)/ `optimize`(mock)/ `list`(mock · ⚠️ filter `agentId='copywriting'` 但 generate 写入 `agentId='CopywritingAgent'` · 大小写不一致 · 现 list 永远空)/ `delete`(直接 history.delete) | ⚠️ **冲突** · 现 generate 服务 /step/7(input.stepKey='step7') · PRD-5 /generate 工具页是 free mode · 同名 procedure 同时服务两个语义 |
| `videoAnalysis.ts` | 72 行 | `analyze`(mock)/ `rewrite`(mock) · ★ **schema 错** · `analyzeVideoInput.videoUrl: z.string().url()` 但 PROMPTS.md §9.2 viral mode 输入是粘贴 lastCopy 文本非 URL | 改 schema · `analyze` 真接 analysisAgent(mode='viral')+ `rewrite` 删除(viral 已含 rewriteVersion 字段)或转为 follow-up 工具 |
| `boomGenerate.ts` | 48 行 | `generate`(mock)· schema 用 `generateBoomInput.stepKey` 但 boom 是工具不是 step | 改 schema · `generate` 真接 copywritingAgent(mode='boom')· 输入 elements[] + theme 不带 stepKey |
| `analysis.ts` | **不存在** | — | **新建** `analysis.ts` · `analyze` procedure 调 analysisAgent(mode='structural')|
| `history.ts` | **不存在** | history 写入分散到 7 router(stepData / monetization / videoProduction / boomGenerate / copywriting / videoAnalysis / privateDomain)· 但**无 history.list** | **新建** `history.ts` · `list` query(filter by agentId/sourceType/dateRange + RLS 自动)+ `delete` mutation · 替代各 router 的 list/delete 重复 |

**A3.3.1 ⚠️ 协议锁冲突 1 · `copywriting.generate` 同名服务两个语义**

当前 `copywriting.generate` 接 `input.stepKey='step7'` → CopywritingAgent step7 mode(PRD-4 US-009 用)。PRD-5 `/generate` 工具页是 free mode · 不应用 stepKey。

**选项 A** · 扩展 `copywriting.generate` 按 `input.mode` 路由(stepKey='step7' → step7 mode · mode='free' → free mode)· 兼容现 PRD-4 调用
**选项 B** · 新建 `copywriting.freeGenerate` procedure 独立 · `/step/7` 仍调 `copywriting.generate`(step7 mode)· `/generate` 调 `copywriting.freeGenerate`(free mode)· 命名清晰
**选项 C**(推荐) · 重命名 `copywriting.generate` → `copywriting.step7Generate`(PRD-4 stepData router 同步改调用)· 新建 `copywriting.freeGenerate`(free mode)· 命名最清晰但要改 stepData.ts

**假设 D-026** · 选**选项 B**(新建 freeGenerate 不动 generate)· 兼容 PRD-4 既有调用 · 不破坏 stepData router · 命名清晰

**A3.3.2 ⚠️ 协议锁冲突 2 · `copywriting.list` agentId 大小写**

当前 line 106 · `where: { agentId: 'copywriting' }` · 但 generate(line 70)写入 `agentId: 'CopywritingAgent'` · list 永远返回 0 行(只查 mock optimize 写的小写 agentId)。

**TD-016 候选**(PRD-5 启动前修)· copywriting.list 改 `agentId: 'CopywritingAgent'`(大写 · 跟 specialists/ 单实例命名一致)· 同 boomGenerate / videoAnalysis 等 future router 统一规范

**假设** · PRD-5 US-001 第一步修 TD-016 + 全 router agentId 大小写规范(CopywritingAgent / AnalysisAgent / VideoAgent / etc · class name 一致)

**A3.3.3 ⚠️ 协议锁冲突 3 · 4 schema 文件需重写**

PRD-2 US-004 mock 时期写的 `copywriting.schema.ts` / `videoAnalysis.schema.ts` / `boomGenerate.schema.ts` schemas 不匹配真业务字段(详 §A1.4)。

**假设** · PRD-5 US-001 同步重写 schema · 加 mode 字段 + 真业务输入(elements/topic/scriptType/lastCopy/lastTitle 等)+ 真业务输出(5 篇候选 markdown 数组 / 22 元素拆解 / 5 维度评分 / etc)

### A3.4 ✅ 4 工具页前端实施(替换 PRD-3 占位)

**当前状态** · `apps/web/src/pages/tools/{Generate,Analysis,VideoAnalysis,BoomGenerate}.tsx` 各 18 行占位(`<h1>` + `<Card>` 占位)

**PRD-5 改动** ·

| 页面 | 表单字段(基于 spec.md §Ⅷ) | 提交 → router | 结果展示(StepResult 模式) |
|---|---|---|---|
| Generate.tsx | scriptType(20 选 1)+ elements(22 多选)+ topic(textarea max 500)| `copywriting.freeGenerate` | markdown 长文(react-markdown + remark-gfm · 同 Step7Result 模式)|
| BoomGenerate.tsx | elements(22 多选)+ industry(可选)+ theme(可选)| `boomGenerate.generate` | 5 篇候选 markdown(grid md:grid-cols-2 + 每篇可复制 · 同 Step8Result 双段对比模式)|
| Analysis.tsx | copy(textarea min 10) | `analysis.analyze` | 5 维度评分(progress bar)+ 优化建议列表 + rewriteSnippet |
| VideoAnalysis.tsx | lastTitle(选填)+ lastCopy(textarea min 10) | `videoAnalysis.analyze` | analysis 元素 tag · insights 列表 · rewriteVersion 全文 |

**复用模板**(PRD-4 US-011/012 · AGENTS §11.6) ·
- StepForm wrapper(useForm + zodResolver + LS-first dual-write + AbortController)→ **新建 ToolForm wrapper**(类似 StepForm 但不强制 stepKey · LS namespace 不同)
- StepResult wrapper switch by stepKey → **新建 ToolResult wrapper**(switch by toolKey · `freeGenerate` / `boomGenerate` / `analysis` / `videoAnalysis`)
- IndustrySelect / CategorySelect / TextareaField · 直接复用
- 新增 ScriptTypeSelect(20 脚本类型) + ElementsMultiSelect(22 爆款元素 4 组分类)

### A3.5 ✅ /history 接入

**当前状态** · `apps/web/src/pages/modules/History.tsx` 占位(PRD-3 US-003 创建 · 18 行)

**PRD-5 改动** ·
- 新建 `history.ts` router · `list` query(filter by agentId / sourceType / dateRange + pagination)· `delete` mutation
- History.tsx 替换占位 · 表格(列 · 时间 / Agent / 输入摘要 / 内容预览 / 操作)+ 筛选(全部/Copywriting/Analysis/Boom · time range)+ 跳转(点行 → 跳到对应工具页 + 预填 input)
- StepResult 模式 · 历史详情可展开(react-markdown 渲染 content)

**预填策略** · 跳转 URL 含 `?historyId=N` · 工具页 `useEffect` 读 `trpc.history.detail.query({ id })` 预填表单 · 不持久(用户提交才覆盖 LS)

### A3.6 ✅ ContextAssembler 加 analysis 模板

**当前状态** · `apps/api/src/services/context-assembler/templates/{positioning,branding,monetization,topic,video,copywriting,livestream}.ts` 7 模板 + `index.ts` SPECIALIST_TEMPLATES barrel

**PRD-5 改动** · 加 `templates/analysis.ts`(persona + methodology 段 · ~10 行 · 同其他模板)+ `index.ts` 加 'analysis' 入口

---

## §4 US 切分假设(8-12 US · 推荐 11)

### A4.1 ✅ Foundation 档(US-001~002 · risk=foundation)

| US | risk | scope | depends_on | 拆分理由 |
|---|:-:|---|---|---|
| US-001 | foundation | TD-016 修(copywriting.list agentId 规范) + 4 schema 重写(copywriting/boomGenerate/videoAnalysis + 新建 analysis schema)+ ContextAssembler 加 analysis 模板 + ToolForm/ToolResult wrapper 抽象基类 | [] | 集中修协议锁 · 4 schema + 1 模板 + 1 抽象 · 是 PRD-5 后续 4 工具页 + 4 router 的共同前置 · downstream=10(US-002~011 全继承)→ Foundation 升档 |
| US-002 | foundation | CopywritingAgent 解锁 free + boom mode(outputSchema getter 4 mode 全 cover · invokeLLM 分支 · fallbackTemplate · acquisition 仍 throw 'PRD-6')+ AnalysisAgent 新建(2 mode · z.discriminatedUnion · model_tier='lightweight')· 含 6+ 各 unit test(配置 · happy · fallback · cold-start · 4/2 mode 各场景) | [US-001] | Specialist 改动是后续 4 router 的前置 · downstream=8(US-003~010 全继承)→ Foundation 升档 |

### A4.2 ✅ Wave 1 · 4 工具后端 + 前端(US-003~010 · risk=high × 2 + medium × 6)

| US | risk | scope | depends_on |
|---|:-:|---|---|
| US-003 | high | `/generate` 后端 · 新建 `copywriting.freeGenerate` procedure(调 copywritingAgent mode='free')· 写 history(agentId='CopywritingAgent' agentMode='free' content=真 markdown contentType='markdown' scriptType + elements 填全)· integration test nock SDK + 真 DB cost_log 查 SQL · ≥ 4 unit | [US-002] |
| US-004 | medium | `/generate` 前端 · Generate.tsx 真表单(ToolForm + ScriptTypeSelect + ElementsMultiSelect + topic textarea + LS-first dual-write)+ ToolResult 渲染(react-markdown + remark-gfm)· ≥ 5 unit + 1 e2e(基本路径) | [US-001, US-003] |
| US-005 | high | `/boom-generate` 后端 · `boomGenerate.generate` 替换 mock(调 copywritingAgent mode='boom')· 写 history × 5(每篇候选独立一行 · 或 1 行 content 含全部 5 篇 · D-027 决定)· integration test · ≥ 4 unit | [US-002] |
| US-006 | medium | `/boom-generate` 前端 · BoomGenerate.tsx 真表单(ElementsMultiSelect + industry + theme)+ ToolResult 渲染 5 篇候选(grid md:grid-cols-2 + 每篇 copy button)· ≥ 5 unit + 1 e2e | [US-001, US-005] |
| US-007 | high | `/analysis` 后端 · 新建 `analysis.ts` router · `analyze` procedure 调 analysisAgent(mode='structural')· 写 history(agentId='AnalysisAgent' agentMode='structural' content=stringified scores+optimizations)· integration test · ≥ 4 unit | [US-002] |
| US-008 | medium | `/analysis` 前端 · Analysis.tsx 真表单(copy textarea min 10)+ ToolResult 渲染(5 维度 progress bar + optimizations 列表 + rewriteSnippet)· ≥ 5 unit + 1 e2e | [US-001, US-007] |
| US-009 | high | `/video-analysis` 后端 · `videoAnalysis.analyze` 替换 mock(调 analysisAgent mode='viral')· 重写 schema(lastCopy + lastTitle 非 URL)· `videoAnalysis.rewrite` 删除(viral 已含 rewriteVersion · D-028)· 写 history(agentId='AnalysisAgent' agentMode='viral')· integration test · ≥ 4 unit | [US-002] |
| US-010 | medium | `/video-analysis` 前端 · VideoAnalysis.tsx 真表单(lastTitle 选填 + lastCopy textarea)+ ToolResult 渲染(elements tag · insights 列表 · rewriteVersion 全文)· ≥ 5 unit + 1 e2e | [US-001, US-009] |

### A4.3 ✅ Wave 2 · /history 接入(US-011 · risk=medium)

| US | risk | scope | depends_on |
|---|:-:|---|---|
| US-011 | medium | `/history` 接入 · 新建 `history.ts` router(`list` + `detail` + `delete` · filter by agentId/sourceType/dateRange · pagination)· History.tsx 替换占位 · 真表格 + 筛选 + 跳转预填 · 各工具页加 `useEffect(? historyId)` 预填 · ≥ 6 unit + 1 e2e(generate → 跳 history → 点 row 跳回工具页预填) | [US-003, US-005, US-007, US-009] |

### A4.4 ✅ 收官(US-012 · risk=medium)

| US | risk | scope | depends_on |
|---|:-:|---|---|
| US-012 | medium | PRD-5 收官 · LLM Judge 4 mode 各 1-2 golden case(`tests/judge/{copywriting-free,copywriting-boom,analysis-viral,analysis-structural}.judge.ts`)· 累计 ≥ 22 judge tests pass(原 14 + 新 8)· 4 工具页 e2e 收官集成(create account → 跑通 4 工具 → 看 history)· lint clean(--max-warnings=0)+ typecheck 6 ws 0 + vitest 全过(超 PRD-4 343 + ≥ 50 新)| [US-001, ..., US-011] |

**总计** · **12 US**(2 foundation + 8 Wave 1 + 1 Wave 2 + 1 收官)· 介于 8-12 区间 · 偏向 12(因 4 工具页 × 后端 1 + 前端 1 模式分拆 + history 单独 + 收官 + 2 foundation)

**替代方案 · 8-10 US**(更紧凑) ·
- 选项 X · 4 工具页后端 + 前端合并(US-003 = generate 全栈 · US-004 = boom 全栈 · US-005 = analysis 全栈 · US-006 = video-analysis 全栈)+ history(US-007)+ 收官(US-008)= 8 US
- ⚠️ **风险** · 全栈 1 US 可能 size_hint=large 触发 §9.6 拆分硬规则(prompt > 12K)· 不推荐

**假设 D-027 候选** · 用 12 US 切分(后端 + 前端分开)· 每 US prompt < 8K 安全区 · 平均 size_hint=medium · 0 large

---

## §5 风险假设

### A5.1 ✅ R1 · mode 分支让 prompt 复杂 · 测试用例量翻倍(架构 §9.6 警示)

- CopywritingAgent 4 mode(step7 既有 · free/boom 解锁 · acquisition throw)+ AnalysisAgent 2 mode = 6 mode 总
- 每 mode prompt 模板独立 · 测试 happy + fallback + cold-start 至少 3 场景
- **缓解** · ContextAssembler 模板 + Specialist persona 共享 95% · mode 分支只在 invokeLLM 内部(_buildUserPrompt 按 mode)· prompt 复杂度可控

### A5.2 ⚠️ R2 · CopywritingAgent _mode race 模式继承(TD-014)

- PRD-4 已登记 TD-014 · 单 user 串行场景安全(P3 主流程)
- PRD-5 解锁 free/boom 时 _mode 继续是 instance state · race window 同模式继承
- **缓解** · 工具页是独立调用(用户串行点 generate / boom)· 不并发 · race 概率仍低 · TD-014 文档化(AGENTS §11.6.3 已警示)
- ★ **不修** · 留 PRD-7+ 高并发场景治理(选项 A · outputSchema 改 method · 选项 B · AsyncLocalStorage)

### A5.3 ⚠️ R3 · /history 跨 router 写入 cross-cut(7+ router 写 history · 一致性靠 audit)

- history 写入分散到 7 router(stepData / monetization / videoProduction / boomGenerate / copywriting / videoAnalysis / privateDomain)
- PRD-5 加 4 个新写入(freeGenerate / boomGenerate / analysis / videoAnalysis)
- agentId 命名规范不统一(PRD-2 mock 用小写 'copywriting' · PRD-4 真实施用 'CopywritingAgent' Class name)→ TD-016 修
- **缓解** · US-001 同步 7 router agentId 全改 Class name(CopywritingAgent / AnalysisAgent / etc)· history.list filter 统一 by Class name
- audit grep · `grep -E "agentId: '[a-z]" apps/api/src/trpc/routers/` 应 0 命中(全大写 Class name)

### A5.4 ⚠️ R4 · acquisition mode 漏写 throw('PRD-6')(PRD-4 时 throw 'PRD-5' · 现要更新)

- PRD-4 US-009 写的 throw('Not implemented · PRD-5')· PRD-5 解锁 free/boom 后必须改 acquisition 的 throw 为 'PRD-6'(否则 ralph 实施时撞 'PRD-5' 已开放但 acquisition 仍 throw 的逻辑死循环)
- **缓解** · US-002 outputSchema getter 改时同步改 acquisition 的 throw 文案 · audit grep `grep "Not implemented · PRD-5" apps/api/src/specialists/CopywritingAgent.ts` 应 0 命中(全替换为 'PRD-6')

### A5.5 ⚠️ R5 · LLM Judge 套件成本累加(8 新 golden + 14 既有 = 22 tests · lightweight model 每月预算)

- 14 既有 judge tests + 8 新(free/boom/viral/structural × 1-2)= 22 judge tests
- lightweight model · cost ~$0.001/test · 每天 1 次 CI = $0.022/天 = $0.66/月 · 完全可控
- **缓解** · CI cron 每天 1 次 · PR-only 不跑(`if: github.event_name == 'push'`)

### A5.6 ⚠️ R6 · history.list 性能(单 account 历史可能 1000+ 行)

- 邀请制内测期典型用户 50-200 history rows · 但 dev e2e 用户累积 1000+(PRD-3 教训)
- **缓解** · history.list pagination(limit max 100 · default 20)+ 索引 `@@index([accountId, createdAt(sort: Desc)])`(已在 PRD-1 schema)
- 前端 React Query infinite scroll 或分页

### A5.7 ⚠️ R7 · 22 元素 + 20 脚本类型常量同步(packages/schemas vs apps/api/src/lib/constants)

- packages/schemas 不能 import apps/api/src/constants(PRD-4 US-011 教训)· INDUSTRY_KEYS 等需 inline
- HOT_ELEMENT_KEYS(22)+ SCRIPT_TYPE_KEYS(20)需在 packages/schemas/src/specialist-io 新增独立常量
- **缓解** · US-001 重写 schema 时同步加 HOT_ELEMENT_KEYS_22 + SCRIPT_TYPE_KEYS_20 常量到 packages/schemas/src/specialist-io/constants.ts(新建)· 跟 apps/api/src/lib/constants/hotElements.ts + scriptTypes.ts 手动保持同步(audit grep diff)

---

## §6 测试配额假设

### A6.1 ✅ 单元测试 ≥ 70 新

| 来源 | 数量 |
|---|:-:|
| AnalysisAgent.test.ts(2 mode × happy/fallback/cold-start/edge + config) | 8 |
| CopywritingAgent free/boom mode 新增测试(2 mode × 4 场景) | 8 |
| 4 router unit(freeGenerate / boomGenerate / analysis / videoAnalysis · 各 6+) | 24 |
| 4 工具页 unit(Generate/BoomGenerate/Analysis/VideoAnalysis · 各 5-7) | 24 |
| ToolForm + ToolResult wrapper unit | 8 |
| history router unit(list filter / detail / delete / pagination) | 6 |
| schemas unit(4 重写 schema · 各 2 zod 验证) | 8 |
| **小计** | **86 新** |

### A6.2 ✅ 集成测试 ≥ 4 新

| 文件 | 内容 |
|---|---|
| `tests/integration/api/copywriting-free-llm.test.ts` | nock SDK + 真 DB cost_log + history 写入 |
| `tests/integration/api/boom-generate-llm.test.ts` | nock SDK + 5 篇候选写入 history(D-028 决定 1 行 vs 5 行) |
| `tests/integration/api/analysis-structural-llm.test.ts` | nock SDK + 5 维度评分写入 history |
| `tests/integration/api/video-analysis-viral-llm.test.ts` | nock SDK + 22 元素拆解写入 history |

### A6.3 ✅ Judge 测试 ≥ 8 新(累计 22)

| 文件 | golden case |
|---|---|
| `tests/judge/copywriting-free.judge.ts` | 1-2 golden(医美自媒体 · 健身教练) |
| `tests/judge/copywriting-boom.judge.ts` | 1-2 golden(育儿博主 5 篇候选) |
| `tests/judge/analysis-viral.judge.ts` | 1-2 golden(粘贴美妆爆款 · 拆解 + 仿写) |
| `tests/judge/analysis-structural.judge.ts` | 1-2 golden(用户写的减肥文案 · 评分 + 优化) |

### A6.4 ✅ E2E ≥ 5 新

| 文件 | 路径 |
|---|---|
| `tests/e2e/tool-generate.spec.ts` | /generate 基本路径(填表 → submit → 看结果 · CI mock) |
| `tests/e2e/tool-boom-generate.spec.ts` | /boom-generate 基本路径(选元素 → submit → 5 篇渲染 · CI mock) |
| `tests/e2e/tool-analysis.spec.ts` | /analysis 基本路径 |
| `tests/e2e/tool-video-analysis.spec.ts` | /video-analysis 基本路径 |
| `tests/e2e/history-flow.spec.ts` | history 跳转 · generate → 跳 /history → 点 row 回工具页预填 |
| `tests/e2e/tool-real-llm.spec.ts`(可选 · skip CI · RUN_LIVE_TESTS=1 manual) | 4 工具真 LLM 跑通 |

### A6.5 ✅ 全套绿灯门禁(US-012 收官硬门禁)

```
vitest:        ≥ 393 / ≥ 393 ✓ (343 PRD-4 累计 + ≥ 50 新)
test:judge:    22 / 22 ✓ (14 PRD-4 + 8 新)
playwright:    ≥ 111 / ≥ 111 ✓ (106 PRD-4 + 5 新)
typecheck:     6 ws · 0 error ✓
lint:          0 warnings (--max-warnings=0) ✓ (防 lint debt 重现)
```

---

## §7 Locked Decisions 假设(D-026 起延续)

### A7.1 ⚠️ D-026 · `copywriting.generate` 不动 + 新建 `copywriting.freeGenerate`

- **理由** · 兼容 PRD-4 stepData router 现有调用 · 命名清晰 · 0 破坏
- **替代** · 选项 A 扩展 generate 按 input.mode 路由(混乱)· 选项 C 重命名 generate → step7Generate(改 stepData 调用 · 多 1 处改动)
- **决策** · 选项 B(新建 freeGenerate)

### A7.2 ⚠️ D-027 · CopywritingAgent free/boom mode prompt 模板复用 PROMPTS.md §5.4/§5.5

- **理由** · PROMPTS.md §5.4 boom · §5.5 free 已写好 · 不重新设计
- **决策** · 直接 inline 到 CopywritingAgent.ts `_buildUserPrompt(mode)` 内 · 不抽到 templates/(因为是 user prompt 不是 system prompt · ContextAssembler.templates/copywriting.ts 已是 system persona)

### A7.3 ⚠️ D-028 · AnalysisAgent 2 mode 用 `_mode + outputSchema getter`(同 PRD-4 模式)

- **理由** · 跟 PositioningAgent / BrandingAgent / VideoAgent / CopywritingAgent 4 个多 mode Specialist 一致(TD-014 模式继承)
- **替代** · `z.discriminatedUnion('mode', [...])` 是另一种(stateless 安全 · 但跟现 4 Specialist 模式不一致 · 一致性优先)
- **决策** · `_mode + outputSchema getter` · TD-014 race window 文档化(AGENTS §11.6.3 已记)

### A7.4 ⚠️ D-029 · /history 接入策略 · 单一 history.list procedure + 各 router 写入(分散写 · 集中读)

- **理由** · 写入由各工具自然完成(generate / boom / analysis / etc)· 读取统一 history.list filter by agentId/sourceType/dateRange · 单一真理源
- **决策** · 新建 `history.ts` router · 不重命名各 router 的写入(保持职责清晰)

### A7.5 ⚠️ D-030 · 工具页表单模板 · 新建 ToolForm wrapper(不复用 StepForm)

- **理由** · StepForm 强制 stepKey + LS namespace `acc_{id}_step_{key}` · 工具页 LS namespace 不同(`acc_{id}_tool_{tool}`)· stepKey 不必填 · 抽离 ToolForm 更清晰
- **替代** · StepForm 加 optional toolKey · stepKey/toolKey 二选一(API 复杂)· 不推荐
- **决策** · 新建 `apps/web/src/components/ToolForm/ToolForm.tsx` 类似 StepForm 600 行 · LS namespace 不同 · zod resolver / dual-write / AbortController 全继承模式

### A7.6 ⚠️ D-031 · LS namespace 策略 · 工具页独立 namespace `acc_{id}_tool_{tool}`

- **理由** · 防工具页之间 LS key 冲突(`acc_1_tool_generate_input` vs `acc_1_tool_boom_input`)
- **决策** · `apps/web/src/lib/ls-namespace.ts` 加 `getToolLsKey(accountId, toolKey, suffix)` · 同 step namespace 模式

### A7.7 ⚠️ D-032 · boom mode 5 篇候选写 history 1 行(content=5 篇 markdown 用 '---' 分隔)

- **理由** · PROMPTS.md §5.4 boom 输出 `result: string`(用 '---' 分隔的 markdown)· 单一 history 行
- **替代** · 写 5 行(每篇独立)· 列表渲染更直观但破坏 history 模型(1 次调用 = 1 行)
- **决策** · 1 行 + content 含 '---' 分隔 · 前端 ToolResult split('---').map() 渲染 5 篇

### A7.8 ⚠️ D-033 · 22 爆款元素 + 20 脚本类型常量在 packages/schemas/src/specialist-io/constants.ts inline

- **理由** · packages/schemas 不能 import apps/api(PRD-4 US-011 教训)· 必须 inline
- **决策** · 新建 `packages/schemas/src/specialist-io/constants.ts` · 含 `HOT_ELEMENT_KEYS_22 = [...] as const` + `SCRIPT_TYPE_KEYS_20 = [...] as const` · 跟 apps/api/src/lib/constants/{hotElements,scriptTypes}.ts 手动同步(audit grep diff)

### A7.9 ⚠️ D-034 · LLM Judge 各新 golden case 复用 PROMPTS.md 给的真实场景

- **理由** · PROMPTS.md §5/§9 各 mode 已含示例 input/output · 不重新发明
- **决策** · `tests/judge/copywriting-free.judge.ts` golden case 用医美 + 健身 · `tests/judge/copywriting-boom.judge.ts` 用育儿 + 理财 · `tests/judge/analysis-viral.judge.ts` 用美妆 + 美食 · `tests/judge/analysis-structural.judge.ts` 用减肥 + 育儿

### A7.10 ⚠️ D-035 · CopywritingAgent acquisition mode throw 文案改 'PRD-6'(从 'PRD-5')

- **理由** · PRD-5 解锁 free/boom 后 acquisition 继续不实施 · 现 throw 'Not implemented · PRD-5' 会让 ralph 实施时撞死循环 · 必须改文案
- **决策** · US-002 outputSchema getter + invokeLLM 内 acquisition 分支同步改 throw `'Not implemented · PRD-6'` · audit grep `grep "PRD-5" apps/api/src/specialists/CopywritingAgent.ts | grep "Not implemented"` 应 0 命中

---

## §8 协议锁假设(防 TD-012 类 · 既有代码现状双对账)

### A8.1 ✅ 既有代码扫描结果(grep 实测 · 2026-05-09)

| 协议锁路径(PRD-5 拟用) | 既有状态 | 处理 |
|---|---|---|
| `apps/api/src/specialists/AnalysisAgent.ts` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/api/src/specialists/CopywritingAgent.ts` | 存在(259 行 · PRD-4 US-009)· step7 mode + free/boom/acquisition throw | 改 · 解锁 free/boom · 不破坏 step7 |
| `apps/api/src/services/context-assembler/templates/analysis.ts` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/api/src/services/context-assembler/templates/index.ts` | 存在(SPECIALIST_TEMPLATES barrel)| 加 'analysis' 入口 · 不破坏 |
| `apps/api/src/trpc/routers/analysis.ts` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/api/src/trpc/routers/history.ts` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/api/src/trpc/routers/copywriting.ts` | 存在(122 行 · PRD-2 mock + PRD-4 US-009 真接 step7)· generate(step7)/ optimize(mock)/ list(⚠️ agentId 不匹配 bug)/ delete | 加 freeGenerate procedure(D-026 选项 B)· 修 list agentId 大小写 bug(TD-016)· optimize 暂留 mock(留 PRD-7+) |
| `apps/api/src/trpc/routers/videoAnalysis.ts` | 存在(72 行 · 2 mock procedure)· schema URL-based 不匹配真业务 | 改 · analyze 真接(mode='viral')· schema 重写(lastCopy 文本)· rewrite 删除(D-028) |
| `apps/api/src/trpc/routers/boomGenerate.ts` | 存在(48 行 · 1 mock procedure)· schema stepKey-based 不匹配工具语义 | 改 · generate 真接(mode='boom')· schema 重写 |
| `packages/schemas/src/specialist-io/copywriting.schema.ts` | 存在(generic schema · 不含 mode/elements/scriptType)| 重写 · 加 mode + 真业务 input/output schemas |
| `packages/schemas/src/specialist-io/videoAnalysis.schema.ts` | 存在(URL schema · 错业务)| 重写 · 改 lastCopy + lastTitle |
| `packages/schemas/src/specialist-io/boomGenerate.schema.ts` | 存在(stepKey schema · 错业务)| 重写 · 改 elements + theme |
| `packages/schemas/src/specialist-io/analysis.schema.ts` | **不存在** | 新建 · 无冲突 ✓ |
| `packages/schemas/src/specialist-io/constants.ts` | **不存在** | 新建 · HOT_ELEMENT_KEYS_22 + SCRIPT_TYPE_KEYS_20 · 无冲突 ✓ |
| `apps/web/src/components/ToolForm/ToolForm.tsx` | **不存在** | 新建(D-030)· 无冲突 ✓ |
| `apps/web/src/components/ToolForm/ScriptTypeSelect.tsx` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/web/src/components/ToolForm/ElementsMultiSelect.tsx` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/web/src/components/ToolResult/ToolResult.tsx` | **不存在** | 新建 · 无冲突 ✓ |
| `apps/web/src/pages/tools/{Generate,Analysis,VideoAnalysis,BoomGenerate}.tsx` | 存在(各 18 行占位)| 替换 · 不破坏(占位无业务) |
| `apps/web/src/pages/modules/History.tsx` | 存在(占位 · PRD-3 US-003)| 替换 · 不破坏 |
| `apps/web/src/lib/ls-namespace.ts` | 存在(getStepLsKey)| 加 getToolLsKey(D-031)· 不破坏 |

### A8.2 ✅ 协议锁结论 · 0 重大冲突 · 1 schema 重写 + 1 既有 list bug 同步修

- **0 双路径风险** · 全新建文件路径无冲突 · 现有文件改动 backward compatible
- **既有 bug TD-016**(copywriting.list agentId 大小写不一致)· US-001 同步修 · 不留 PRD-5 后期发现

---

## §9 已知 TD 增量假设

### A9.1 ⚠️ TD-016(候选)· copywriting.list 等 router list 的 agentId 大小写不一致

- **现状** · `copywriting.list where: { agentId: 'copywriting' }` · 但 generate 写 `agentId: 'CopywritingAgent'`(Class name)· list 永远 0 行
- **scope** · copywriting / boomGenerate / videoAnalysis / monetization / privateDomain / videoProduction 等 7 router 都可能撞同问题
- **修期** · PRD-5 US-001(随手修 · 同步 7 router 全用 Class name 大写规范)
- **TD 状态** · 候选(实施时如发现可豁免再决定)

### A9.2 ⚠️ TD-013 双重 cost_log(PRD-11 治理 · 不动)

- PRD-4 已登记 · LLMGateway callType='complete' + Specialist callType='specialist_call' 双写
- PRD-5 不动 · PRD-11 admin 域 ④ 治理

### A9.3 ⚠️ TD-014 _mode race(PRD-7+ 治理 · 不动)

- PRD-4 已登记 · 4 Specialist 同模式 · PRD-5 第 5 处复用(CopywritingAgent free/boom)· 不动

### A9.4 ⚠️ TD-015 specialist-io 子目录 vs 协议锁单一文件(已 accepted)

- PRD-4 已 accepted · PRD-5 加 4 schema(rewrite 3 + new analysis)在子目录组织 · 同模式继承

---

## §10 给 prd skill 写完整 PRD 时的提示

### A10.1 PRD-5 完整文档应至少包含

1. **§0 引用清单** · 同 PRD-4 §0 · 列 ARCHITECTURE.md / PROMPTS.md / aiipznt-spec.md / AGENTS.md / DATA-MODEL.md / 各 file:line 引用
2. **§1 stories 详细描述**(12 US · 每 US 含 H/E/B/P 4 类 AC · 平均 10-15 AC)· 引用 file:line + grep 证据
3. **§1.5 协议锁**(表 A 文件路径 + 表 B 命名规范 + 表 C 字段定义)· 含 §A8.1 的协议锁表
4. **§2 退出条件 · 7 项**(对齐 ARCHITECTURE §9.6)
5. **§3 范围排除 · 列 §A2.2 全部 11 项**
6. **§4 风险 · 列 §A5 全部 7 项 + 缓解措施**
7. **§5 测试配额 · 列 §A6 全部数字**
8. **§6 Locked Decisions D-026 ~ D-035 · 含 §A7 全部决策 + 理由 + 替代选项**
9. **§7 既有代码现状对账 · §A8.1 表 + 修补清单**
10. **§8 反例库注入 · 列 ralph skill 转 prd.json 时关键词命中清单**(specialist / llm / copywriting / analysis / sse / streaming / boom / viral / structural)

### A10.2 不要在 PRD 里做的事

- ❌ 不重新设计 prompt(直接引用 PROMPTS.md §5.4/§5.5/§9.2/§9.3)
- ❌ 不重新发明 schema 字段(直接引用 PROMPTS.md 给的输出格式)
- ❌ 不写 admin 任何东西
- ❌ 不写 acquisition mode / trending / video-production / 其他 OUT 项

---

## §11 总结 · 给用户 review

### A11.1 假设清单总览

| § | 维度 | 假设数 | 关键假设 |
|:-:|---|:-:|---|
| §1 | 技术 | 8 | LLMGateway / BaseSpecialist / ContextAssembler / schemas / Judge / Aurelian / 反例库 / AGENTS §11.6 全就位 |
| §2 | 范围 | 5 IN + 11 OUT | 4 工具页 + /history 接入(IN) · acquisition / trending / video-production / private-domain / monetization / voice-chat / deep-learning / present-styles / knowledge / EvolutionProfile / RAG(OUT) |
| §3 | 实现 | 6 | CopywritingAgent 解锁 free+boom · AnalysisAgent 新建 · 4 router 改/新建 · 4 schema 重写 · 4 工具页前端 · /history 接入 |
| §4 | US 切分 | 12 US | 2 foundation + 8 Wave 1 + 1 Wave 2 + 1 收官 · 每 US prompt < 8K |
| §5 | 风险 | 7 | mode 复杂 · _mode race · history cross-cut · acquisition throw 文案 · Judge 成本 · history 性能 · 22+20 常量同步 |
| §6 | 测试 | 86 unit + 4 integration + 8 judge + 5 e2e | 全套门禁 vitest 393+ / judge 22 / e2e 111+ |
| §7 | Locked Decisions | 10(D-026~035)| copywriting.generate 不动新建 freeGenerate · CopywritingAgent prompt 复用 PROMPTS · AnalysisAgent _mode 模式 · history 集中读分散写 · ToolForm 新建 · 工具 LS namespace · boom 1 行 · 常量 inline · Judge golden case · acquisition throw 'PRD-6' |
| §8 | 协议锁 | 19 文件 | 0 重大冲突 · 4 schema 重写 + 1 既有 bug(TD-016)|
| §9 | TD 增量 | 1 新(TD-016)+ 3 继承(TD-013/014/015 不动)| TD-016 PRD-5 启动前修(随手 US-001 改)|

### A11.2 Review 流程

> ⚠️ **请用户 review** · 只告诉我**哪些假设错** · 没纠错的视为正确 · 格式 ·
> - A1.4 ❌ schemas 不重写 · 直接扩充字段
> - D-026 ❌ 选选项 C 重命名 generate → step7Generate
> - A4.1 ❌ US-001 拆 2 个 · TD-016 修单独成 US
> - 等
>
> 没提到的视为正确(默认接受)。
>
> **回复格式建议** · 直接 reply "全部正确" 或者列纠错(用 A 前缀 + 编号 · 同上格式)。

### A11.3 收到"全部正确"后下一步

1. prd skill 写完整 `tasks/prd-5.md`(基于本 assumptions 文档展开 · 1500+ 行 · 不简化)
2. ralph skill 转 prd.json + prd-5.json + prd-5.start.json(按 §1.5 协议锁 + anti_patterns 注入 + risk_level + foundation 升档)
3. /plan-check 7 项门禁
4. SOP §9.1 5 步启 daemon · git checkout -b ralph/prd-5-p4-creation-modules · 启 Monitor persistent · 启 ralph daemon

---

> **本文件由 prd skill Assumptions 模式生成 · 等用户 review · 收到"全部正确"前不会写 tasks/prd-5.md**
