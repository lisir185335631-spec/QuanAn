# PRD-6 · P5 视频模块(VideoAgent 3 mode + CopywritingAgent acquisition + ImageGen Worker + 3 工具页)

> **版本** · v0.1(2026-05-09 · prd skill assumptions 模式 · Opus 主对话)
> **PRD** · PRD-6 · 14 stories · 计划 2 周 · risk=high(ImageGen 新领域 + BullMQ 异步队列)
> **依赖** · PRD-4(7 Specialist 真接 LLMGateway · 已完成 ✓)+ PRD-5(CopywritingAgent free/boom + AnalysisAgent + 4 工具页 + history · 已完成 ✓)
> **战略地位** · ARCHITECTURE §9.7 P5 视频模块 · `PRD-1 → PRD-2 → PRD-4 → PRD-5/6/8(任一)→ PRD-12` 关键路径上的下一站

---

## §0 引用清单(必读 · 实施前 5 min 全部过一遍)

### §0.1 上游 PRD 决策继承

- **D-001 ~ D-035**(PRD-1~5 累计)· 全部继承 · 不重复
- 关键继承:
  - **D-017** · LLM 调用唯一通过 LLMGateway(本期 ImageGen 是 image API · 不算 LLM · ★ 见 §7 D-038 解释)
  - **D-018** · Specialist 不直调 LLM SDK(REJ-001)
  - **D-026** · `copywriting.generate` 不动 · 新建 `copywriting.freeGenerate`(本期同模式新建 `copywriting.acquisitionGenerate`)
  - **D-028** · 多 mode Specialist 用 `_mode + outputSchema getter` · 不用 `z.discriminatedUnion`(本期 VideoAgent 第 4 处复用 · TD-014 文档化继承)
  - **D-029** · `history.list` 单 procedure + 各 router 自然写入(本期 3 router + acquisitionGenerate 写入)
  - **D-030** · 新建 ToolForm wrapper(本期 3 工具页复用)
  - **D-031** · LS namespace `acc_{id}_tool_{tool}_{suffix}`(本期 3 工具页继承)
  - **D-032** · boom 5 篇候选写 history 1 行(本期 storyboard mode 5-8 镜头写 history 1 行 · sceneImage 走 Asset 表)
  - **D-033** · 22 元素 + 20 脚本类型 inline `packages/schemas/.../constants.ts`(本期不动)
  - **D-034** · LLM Judge cost_log eventType='judge_call'(本期 ImageGen cost_log eventType='image_gen' · 第 3 类)
  - **D-035** · CopywritingAgent acquisition mode throw 'PRD-6'(本期 US-002 解锁 · 真接 LLM)

### §0.2 ARCHITECTURE.md 引用

- §1.4 14 工具页 · 视频域 4 工具(shooting / production / acquisition / storyboard)
- §6 14 Specialist · §6.6 VideoAgent 4 mode 完整定义
- §7 ImageGenWorker(异步队列 · DALL-E 3 / 文心一格 调用)
- §9.7 P5 视频模块 · 2 周计划 · 退出条件 8 项
- §11.6.4 多 mode Specialist 模式继承(TD-014 race window)

### §0.3 PROMPTS.md 引用

- §0.7 流式输出协议(VideoAgent storyboard mode 流式)
- §5 CopywritingAgent · 4 mode(本期 acquisition 解锁)
- §6 VideoAgent · 4 mode 完整 prompt 模板
- §6.1 Persona(视频导演 + 拍摄经验)
- §6.2 13 列分镜表(shooting / storyboard 必含)
- §6.3 storyboard mode · ImageGen prompt 协同(英文 prompt)
- §6.4 输入字段(production / acquisition / storyboard)

### §0.4 DATA-MODEL.md 引用

- §3 主应用 18 表 · `Asset` 表(本期 storyboard 写入 sceneImage)
- §3.4.5 cost_log 表(本期 image_gen eventType 第 3 类)
- §9 RLS 强制开启(Asset 表跟其他主表一致)

### §0.5 AGENTS.md 引用

- §1.4 1.0 不做(无 user upload video · 本 PRD 严格遵守)
- §3 LD-002(14 能力域 Specialist · 本期不增 Specialist · 复用 VideoAgent + CopywritingAgent)
- §3 LD-005(BaseSpecialist 抽象 · VideoAgent 解锁 3 mode 严格沿用)
- §3 LD-009(IpAccount 隔离 3 道闸 · 3 router 全 protectedProcedure + explicit accountId · TD-019 教训)
- §3 LD-012(LLM 调用唯一通过 LLMGateway · ★ ImageGen 不算 LLM · 单独 ImageGenWorker · 见 §7 D-038)
- §3 LD-013(zod schema + trace_id + 无 any 兜底 · 本期 3 工具新 schema)
- §3 LD-016(测试金字塔 · 本期 vitest 620+ / judge 30 / e2e 138)
- §3 LD-018(PII mask + 行业免责 · TD-016 PRD-5 已接线 · 本期 VideoAgent 自动继承)
- §3 R-001(不暴露 LLM API key 给前端 · 包含 OpenAI image API key)
- §3 R-A* admin 红线(本期不涉及)

### §0.6 PRD-5 retro 教训(避免重蹈)

- **L-1 RCA-003** · claude --print CLI 系统级 hang on ralph-template prompts · M-2 health check 已部署 · 但仍可能触发 · 建议每 5-7 stories 重启 daemon
- **L-2** · ralph daemon BLOCKED 后静默 exit COMPLETE · M-1 已修(写 audit-gate(needs_attention))
- **L-4** · ralph Validator 必落 5 stdout 产物(vitest/judge/e2e/typecheck/lint)· 本期收官 US-014 强制
- **L-7** · piiMask apply 顺序 bug 已修(PRD-5 retro)· 本期不需要再修

### §0.7 本 PRD 暂不做(详 §3 范围排除)

- 真 user upload video(.mp4 上传 · 留 PRD-9 P8 RAG)
- 文心一格 / 国内 image API(只做 DALL-E 3 · 留 PRD-9 PRR 申请国内 API key)
- VoiceChatAgent / EvolutionAgent / DailyTaskAgent(留 PRD-8 P7 智能 · 3 L5 自治)
- admin 任何代码(留 PRD-10~14 admin 子系统)
- 视频文件渲染(只做分镜 + sceneImage · 不组合成 mp4 · 留 PRD-9+ 第三方剪辑工具集成)

---

## §1 用户故事(US-001 ~ US-014)

### **US-001 · Foundation · 5 schema + ImageGen Worker 骨架 + Asset 表 sceneImage 字段**

> **risk_level** · `foundation`(downstream 11 stories · 数据契约层)
> **priority** · 1
> **depends_on** · []

**描述** · PRD-6 所有后续 stories 的数据契约前置 · 4 项:
1. **5 个 zod schema 重写/新建** · `packages/schemas/src/specialist-io/` 下:
   - `videoProduction.schema.ts`(新建 · production mode input/output)
   - `acquisitionVideo.schema.ts`(新建 · acquisition mode input/output)
   - `aiVideo.schema.ts`(新建 · storyboard mode input/output · 含 sceneImage url 数组)
   - `acquisitionCopywriting.schema.ts`(新建 · CopywritingAgent acquisition mode 用)
   - `imageGen.schema.ts`(新建 · ImageGen Worker queue payload + result)
2. **ImageGen Worker 骨架** · `apps/api/src/workers/image-gen/`:
   - `index.ts`(模板 + interface IImageGenWorker { generate(prompt, opts) → Promise<sceneImageUrl> })
   - `dall-e-3.ts`(DALL-E 3 SDK wrapper · OpenAI image API · 占位实现)
   - `queue.ts`(BullMQ Queue 定义 + Worker boot + Redis 连接配置)
   - 本期 stub 模式: 实际调用 throw 'PRD-6 US-009 真接' (US-009 解锁)
3. **Asset 表加 sceneImage 字段** · `prisma/schema.prisma` Asset model:
   - `sceneIndex` Int? (新增 · 1-based · storyboard 第几个镜头 · null 时不是 scene image)
   - 加 `@@index([accountId, relatedStepKey, sceneIndex])` 复合索引(scene image lookup 快)
   - migration: `prisma/migrations/2026_05_10_add_scene_index_to_assets/migration.sql`
4. **constants 扩展** · `apps/api/src/lib/constants/`:
   - `videoTypes.ts`(新建 · video type union: 'short_form' | 'long_form' · 复用 5 video formats per PROMPTS §6.4)
   - `videoDurations.ts`(新建 · 时长枚举: '15s' | '30s' | '60s' | '180s')
   - `imageStyles.ts`(新建 · DALL-E 3 style: 'vivid' | 'natural')

**触发场景** · ralph 跑 US-001 第一步 · 后续 13 stories 全等本 story 的 schema + Asset 字段 + worker 骨架。

**files_to_create** ·
- `packages/schemas/src/specialist-io/videoProduction.schema.ts`(~80 行)
- `packages/schemas/src/specialist-io/acquisitionVideo.schema.ts`(~70 行)
- `packages/schemas/src/specialist-io/aiVideo.schema.ts`(~90 行)
- `packages/schemas/src/specialist-io/acquisitionCopywriting.schema.ts`(~50 行)
- `packages/schemas/src/specialist-io/imageGen.schema.ts`(~40 行)
- `apps/api/src/workers/image-gen/index.ts`(~60 行 · interface + stub)
- `apps/api/src/workers/image-gen/dall-e-3.ts`(~30 行 · SDK wrapper 占位)
- `apps/api/src/workers/image-gen/queue.ts`(~40 行 · BullMQ Queue 定义)
- `apps/api/src/lib/constants/videoTypes.ts`(~20 行)
- `apps/api/src/lib/constants/videoDurations.ts`(~15 行)
- `apps/api/src/lib/constants/imageStyles.ts`(~15 行)
- `prisma/migrations/2026_05_10_add_scene_index_to_assets/migration.sql`(~10 行)
- `tests/unit/api/schemas/video-schemas.test.ts`(~80 行 · 5 schema validation)

**files_to_modify** ·
- `prisma/schema.prisma`(Asset model 加 sceneIndex Int? + index)
- `packages/schemas/src/index.ts`(barrel export 加 5 新 schema)

**test_command** · `pnpm test tests/unit/api/schemas/video-schemas.test.ts && pnpm typecheck && pnpm prisma migrate deploy`

---

### **US-002 · Foundation · VideoAgent 解锁 3 mode + CopywritingAgent acquisition + ContextAssembler 3 模板**

> **risk_level** · `foundation`(downstream 10 stories · Specialist 实施层)
> **priority** · 2
> **depends_on** · [US-001]

**描述** · 4 项:
1. **VideoAgent 解锁 production / acquisition / storyboard 3 mode** · `apps/api/src/specialists/VideoAgent.ts`:
   - 移除 `if (mode === 'production' | 'acquisition' | 'storyboard') throw 'PRD-6'`
   - 加 outputSchema getter 按 _mode 返回(沿用 PRD-5 D-028 模式)· 4 mode → 4 output schema
   - invokeLLM 内 _buildUserPrompt(mode) 按 mode 加 prompt 段(PROMPTS §6.4)
   - storyboard mode 输出含 `scenes: Array<{ index, description, imagePromptEn, duration }>` · 不含 sceneImage url(US-007 入队列后 US-009 worker 写)
2. **CopywritingAgent acquisition mode 解锁** · `apps/api/src/specialists/CopywritingAgent.ts`:
   - 移除 `if (mode === 'acquisition') throw 'PRD-6'`(D-035 落地)
   - 加 acquisition outputSchema(沿用 free/boom 模式 · markdown 字段)
   - invokeLLM 内 acquisition prompt(PROMPTS §5.4 acquisition · CTA 必含 · 200-500 字 · 转化导向)
3. **ContextAssembler 3 新模板** · `apps/api/src/services/context-assembler/templates/`:
   - `video-production.ts`(production mode persona + 提示词模板)
   - `acquisition-video.ts`(acquisition mode persona)
   - `ai-video.ts`(storyboard mode persona · 强调 imagePromptEn 必英文)
   - `index.ts` barrel 加 3 新模板
4. **VideoAgent + CopywritingAgent unit tests 扩展** · `tests/unit/specialists/`:
   - VideoAgent.test.ts 加 3 mode × 3 场景 = 9 新 unit
   - CopywritingAgent.test.ts 加 acquisition mode × 3 场景 = 3 新 unit
   - 每个 mode 验证 outputSchema getter + prompt 分支正确

**触发场景** · US-001 schema + worker 骨架就位后 · US-002 解锁 Specialist 真 LLM 调用能力。

**files_to_create** ·
- `apps/api/src/services/context-assembler/templates/video-production.ts`(~60 行)
- `apps/api/src/services/context-assembler/templates/acquisition-video.ts`(~50 行)
- `apps/api/src/services/context-assembler/templates/ai-video.ts`(~70 行)

**files_to_modify** ·
- `apps/api/src/specialists/VideoAgent.ts`(解锁 3 mode + outputSchema getter + invokeLLM 分支 · ~+200 行)
- `apps/api/src/specialists/CopywritingAgent.ts`(解锁 acquisition · ~+50 行)
- `apps/api/src/services/context-assembler/templates/index.ts`(barrel 加 3 入口)
- `tests/unit/specialists/VideoAgent.test.ts`(+9 unit · ~+150 行)
- `tests/unit/specialists/CopywritingAgent.test.ts`(+3 unit · ~+50 行)

**test_command** · `pnpm test tests/unit/specialists/VideoAgent.test.ts tests/unit/specialists/CopywritingAgent.test.ts && pnpm typecheck`

---

### **US-003 · Wave 1 · /video-production 后端 · videoProduction.generate procedure**

> **risk_level** · `high`(真 LLM 调用 · cost_log + history 写入)
> **priority** · 3
> **depends_on** · [US-002]

**描述** · 新建 `apps/api/src/trpc/routers/videoProduction.ts` 真接 VideoAgent production mode · 写 history 行 · cost_log 自动写。

**files_to_create** ·
- `apps/api/src/trpc/routers/videoProduction.ts`(~80 行 · generate procedure · protectedProcedure + explicit accountId)
- `tests/unit/api/video-production-router.test.ts`(~80 行 · 4 unit: happy / zod fail / Specialist throw / agentMode 写入)
- `tests/integration/api/video-production-llm.test.ts`(~120 行 · nock SDK + 真 DB cost_log + history)

**files_to_modify** ·
- `apps/api/src/trpc/routers/_app.ts`(注册 videoProduction: videoProductionRouter)
- `packages/clients/src/router-types.ts`(shadow router 加 videoProduction.generate)

**test_command** · `pnpm test tests/unit/api/video-production-router.test.ts tests/integration/api/video-production-llm.test.ts && pnpm typecheck`

---

### **US-004 · Wave 1 · /video-production 前端 · VideoProduction.tsx 真表单 + 拍摄方案渲染**

> **risk_level** · `medium`(UI 复用 PRD-5 ToolForm/ToolResult 抽象)
> **priority** · 4
> **depends_on** · [US-001, US-003]

**描述** · `apps/web/src/pages/tools/VideoProduction.tsx` 替换 PRD-2 占位 · 真表单(textarea sourceCopy + select videoType + select duration + textarea additional)+ submit → trpc.videoProduction.generate · 渲染 13 列分镜表 + 设备清单 + 排期(沿用 PRD-5 ToolResult 模式)。

**files_to_create** ·
- `apps/web/src/components/ToolResult/VideoProductionResult.tsx`(~120 行 · 13 列分镜 + 设备 + 排期)
- `tests/unit/web/pages/VideoProduction.test.tsx`(~100 行 · 5 unit: 表单 + zod + mutation + LS + history 预填)
- `tests/e2e/tool-video-production.spec.ts`(~80 行 · CI mock + 9 步 e2e 模式继承)

**files_to_modify** ·
- `apps/web/src/pages/tools/VideoProduction.tsx`(~250 行 · ToolForm + 字段 + result 渲染)
- `apps/web/src/components/ToolResult/ToolResult.tsx`(switch case 加 'video-production')

**test_command** · `pnpm test tests/unit/web/pages/VideoProduction.test.tsx && pnpm test:e2e tests/e2e/tool-video-production.spec.ts && pnpm typecheck`

---

### **US-005 · Wave 1 · /acquisition-video 后端 · acquisitionVideo.generate procedure**

> **risk_level** · `high`(真 LLM 调用 · 转化导向 prompt)
> **priority** · 5
> **depends_on** · [US-002]

**描述** · 新建 `apps/api/src/trpc/routers/acquisitionVideo.ts` 真接 VideoAgent acquisition mode。

**files_to_create** ·
- `apps/api/src/trpc/routers/acquisitionVideo.ts`(~80 行 · 同 US-003 模式)
- `tests/unit/api/acquisition-video-router.test.ts`(~80 行 · 4 unit)
- `tests/integration/api/acquisition-video-llm.test.ts`(~120 行 · nock SDK)

**files_to_modify** ·
- `apps/api/src/trpc/routers/_app.ts`(注册 acquisitionVideo)
- `packages/clients/src/router-types.ts`(shadow router)

**test_command** · 同 US-003 模式

---

### **US-006 · Wave 1 · /acquisition-video 前端 · AcquisitionVideo.tsx**

> **risk_level** · `medium`
> **priority** · 6
> **depends_on** · [US-001, US-005]

**描述** · `apps/web/src/pages/tools/AcquisitionVideo.tsx` 真表单(sourceCopy + 转化目标 + 平台 + duration)+ 渲染获客方案(13 列分镜 + CTA 强调 + 转化路径)。

**files_to_create** ·
- `apps/web/src/components/ToolResult/AcquisitionVideoResult.tsx`(~110 行)
- `tests/unit/web/pages/AcquisitionVideo.test.tsx`(~100 行 · 5 unit)
- `tests/e2e/tool-acquisition-video.spec.ts`(~80 行 · CI mock)

**files_to_modify** ·
- `apps/web/src/pages/tools/AcquisitionVideo.tsx`(~240 行)
- `apps/web/src/components/ToolResult/ToolResult.tsx`(switch case 加 'acquisition-video')

---

### **US-007 · Wave 2 · /ai-video 后端 · aiVideo.generateStoryboard + ImageGen 入队列**

> **risk_level** · `high`(★ 跨 Specialist + Worker · 异步队列 + jobId 返回)
> **priority** · 7
> **depends_on** · [US-002, US-009]

**描述** · 4 项:
1. **新建 `aiVideo.ts` router** · `generateStoryboard` procedure 真接 VideoAgent storyboard mode · 拿到 5-8 scenes 后,**为每个 scene 入 BullMQ 队列**(payload: { sceneIndex, imagePromptEn, accountId, traceId, historyId })
2. **返回 jobIds 数组**(不等图片完成 · 立即返回 history row · 含 storyboard scenes 但 sceneImageUrl 全 null + jobId 列表)
3. **rate limit 检查**(US-011 接线 · max 10 storyboard / user / day · 超额 throw RateLimitError)
4. **ImageGen Worker 接 queue 消息 + DALL-E 3 调用 + 写 Asset 表 + push history.scenes[i].sceneImageUrl(后台异步 · US-009)**

**files_to_create** ·
- `apps/api/src/trpc/routers/aiVideo.ts`(~120 行 · generateStoryboard + jobStatus query · protectedProcedure + RLS + rate limit check)
- `tests/unit/api/ai-video-router.test.ts`(~100 行 · 6 unit: storyboard happy / 5 scene queue insert / jobIds 返回 / rate limit 拦截 / accountId 隔离)
- `tests/integration/api/ai-video-flow.test.ts`(~150 行 · queue mock · storyboard → 入队列 → mock worker 完成 → 查 history 看 sceneImageUrl 已填)

**files_to_modify** ·
- `apps/api/src/trpc/routers/_app.ts`(注册 aiVideo)
- `packages/clients/src/router-types.ts`(shadow router 加 aiVideo.generateStoryboard + aiVideo.jobStatus)

---

### **US-008 · Wave 2 · /ai-video 前端 · AiVideo.tsx + 镜头列表 + sceneImage polling**

> **risk_level** · `high`(★ 异步 polling UX + 进度 + 失败重试)
> **priority** · 8
> **depends_on** · [US-001, US-007]

**描述** · 4 项:
1. **AiVideo.tsx 真表单** · sourceCopy + scenes 数(5/6/7/8 select)+ imageStyle(vivid/natural)+ submit → trpc.aiVideo.generateStoryboard
2. **拿到 historyId + jobIds 后** · 每 3s 轮询 `trpc.aiVideo.jobStatus.useQuery({ historyId })` · 服务端查 history.scenes 看 sceneImageUrl 是否填(已填 = 完成 · null = 进行中)
3. **UI 渲染** · 5-8 镜头卡片网格 · 每镜显示:
   - 头部: 镜头编号 + duration
   - 中间: sceneImageUrl(已完成)或 skeleton(进行中)+ 进度 spinner
   - 底部: scene description + imagePromptEn(可点开折叠)
4. **完成全部** · 顶部 banner "所有镜头已完成 · 查看历史" + 关闭 polling

**files_to_create** ·
- `apps/web/src/components/ToolResult/AiVideoResult.tsx`(~180 行 · 镜头卡片网格 + lazy image load + skeleton)
- `tests/unit/web/pages/AiVideo.test.tsx`(~120 行 · 7 unit: 表单 + zod + 入队列 mock + polling tick + scene 完成渲染 + 全完成 banner + 失败重试 UI)
- `tests/e2e/tool-ai-video.spec.ts`(~120 行 · CI mock · 表单 → 提交 → 立即 5 scene skeleton → mock 完成 push → 5 scene 渲染)

**files_to_modify** ·
- `apps/web/src/pages/tools/AiVideo.tsx`(~280 行)
- `apps/web/src/components/ToolResult/ToolResult.tsx`(switch case 加 'ai-video')

---

### **US-009 · Wave 2 · ImageGen Worker · DALL-E 3 SDK + cost_log image_gen**

> **risk_level** · `high`(★ 新模块 · 真 OpenAI image API · cost 控制)
> **priority** · 9
> **depends_on** · [US-001]

**描述** · 6 项:
1. **DALL-E 3 SDK wrapper** · `apps/api/src/workers/image-gen/dall-e-3.ts` · 真接 OpenAI SDK images.generate · 输入 imagePromptEn(英文)+ size '1024x1024' + style(vivid/natural)+ quality 'standard'(★ HD 太贵 · 留 PRR 升级)
2. **env 开关** · `IMAGE_GEN_ENABLED=true|false` · false 时返回 placeholder 灰图 url(无成本 dev mode)· `OPENAI_API_KEY` 必须配
3. **错误处理** · 网络失败 → max 3 次重试(exponential backoff)· 仍失败 → 返回 placeholder + flag 'failed' 给前端 UI 显示重试按钮
4. **cost_log 写入** · eventType='image_gen' + provider='openai' + modelUsed='dall-e-3' + costUsd= $0.04 ± · accountId 隔离(★ D-040 决策)
5. **Asset 表写入** · sceneImage 保存到 `Asset` 表(assetType='scene_image' · sceneIndex 填 · publicUrl=DALL-E 返回 url · generationPrompt=imagePromptEn · generationModel='dall-e-3')
6. **history 反写** · 写 Asset 后 update `history.scenes[sceneIndex].sceneImageUrl = asset.publicUrl`(JSON path update · prisma raw)

**files_to_create** ·
- `apps/api/src/workers/image-gen/dall-e-3.ts`(~100 行 · OpenAI SDK 调用 + 错误处理 + cost 计算)
- `apps/api/src/workers/image-gen/index.ts`(完善 · 入口 + 调度)
- `tests/unit/api/image-gen-dall-e-3.test.ts`(~100 行 · 6 unit: happy / network fail retry / placeholder / cost_log 写入 / Asset 写入 / history 反写)
- `tests/integration/api/image-gen-flow.test.ts`(~120 行 · mock OpenAI SDK · 全流程 input → DALL-E mock → Asset → history 反写)

**files_to_modify** ·
- `apps/api/src/lib/llm-gateway/index.ts`(★ ★ 不动 · ImageGen 不走 LLMGateway · 见 §7 D-038)
- `.env.example`(加 IMAGE_GEN_ENABLED + OPENAI_API_KEY 注释)
- `apps/api/src/workers/llm-gateway/cost-logger.ts`(eventType 加 'image_gen' allow list)

**test_command** · `pnpm test tests/unit/api/image-gen-dall-e-3.test.ts tests/integration/api/image-gen-flow.test.ts && pnpm typecheck`

---

### **US-010 · Wave 2 · BullMQ 异步队列 · Worker 进程 + Redis 配置 + 状态机**

> **risk_level** · `high`(★ 新基础设施 · BullMQ + Redis · 进程间通信)
> **priority** · 10
> **depends_on** · [US-009]

**描述** · 6 项:
1. **BullMQ Queue 实现** · `apps/api/src/workers/image-gen/queue.ts`:
   - Queue: 'image-gen' · concurrency=2(★ 控制并发 cost · 不一次跑 8 镜头烧钱)
   - Job payload: { sceneIndex, imagePromptEn, accountId, traceId, historyId, imageStyle }
   - Result: { sceneImageUrl, costUsd, durationMs } 或 { error, sceneImageUrl: placeholder }
2. **Worker 进程启动** · `apps/api/src/workers/image-gen/worker.ts`:
   - new Worker('image-gen', async job => imageGen(job.data))
   - 启动方式: pnpm script `worker:image-gen` 单独跑(或 pm2 / docker)
   - 本期 dev: 跟 api server 同进程启动(简化 · 留 PRR 拆独立)
3. **Redis 配置** · `apps/api/src/lib/redis.ts`(新建 · BullMQ 连接复用)
4. **rate limit 实施** · `apps/api/src/lib/rate-limit/image-gen.ts`(新建 · max 10 storyboard / user / day · Redis sliding window · key=`rate:image_gen:user:{accountId}:{date}`)
5. **status query** · `aiVideo.jobStatus(historyId)` 内部:
   - 查 history.scenes · 数 sceneImageUrl 已填的 vs 总数
   - 返回 { total, completed, pending, failed, scenes: [{ index, status, sceneImageUrl?, error? }] }
6. **失败 retry** · BullMQ jobs 配 retries=2 + backoff='exponential' + delay=5000

**files_to_create** ·
- `apps/api/src/workers/image-gen/queue.ts`(~80 行)
- `apps/api/src/workers/image-gen/worker.ts`(~60 行 · Worker 进程启动)
- `apps/api/src/lib/redis.ts`(~40 行 · ioredis client 单例)
- `apps/api/src/lib/rate-limit/image-gen.ts`(~80 行 · sliding window)
- `tests/unit/api/image-gen-queue.test.ts`(~120 行 · 8 unit: queue add · job complete · job retry · job fail · concurrency 限制 · status query · rate limit 命中 · accountId 隔离)
- `tests/integration/api/image-gen-bullmq.test.ts`(~100 行 · ★ 真 BullMQ + Redis(test DB) · 入栈 → 真 worker tick → 完成事件)

**files_to_modify** ·
- `apps/api/src/index.ts`(boot 加 worker 启动 · 仅 dev mode)
- `package.json`(scripts 加 `worker:image-gen`: `tsx apps/api/src/workers/image-gen/worker.ts`)

**test_command** · `pnpm test tests/unit/api/image-gen-queue.test.ts tests/integration/api/image-gen-bullmq.test.ts && pnpm typecheck`

---

### **US-011 · Wave 2 · Rate limit 集成 + cost 控制 + IMAGE_GEN_DAILY_LIMIT_PER_USER**

> **risk_level** · `medium`(★ 业务约束 · 防滥用 · cost 上线)
> **priority** · 11
> **depends_on** · [US-010]

**描述** · 4 项:
1. **rate limit middleware 接入** · `aiVideo.generateStoryboard` 内调 `checkImageGenRateLimit(accountId)` · 超额 throw `TRPCError({ code: 'TOO_MANY_REQUESTS' })`
2. **env 配置** · `IMAGE_GEN_DAILY_LIMIT_PER_USER=10`(默认 10 次/天)· `IMAGE_GEN_MAX_SCENES_PER_REQUEST=8`(防 1 次请求 100 镜头)
3. **前端 UX** · UI 显示用户今日剩余次数 · 超额时灰色按钮 + 提示 "今日已达上限 · 明日再来"
4. **cost log dashboard** · `cost_log` 表 daily aggregation by accountId + eventType='image_gen' · 留给 admin PRD-11 直接用

**files_to_create** ·
- `tests/unit/api/rate-limit-image-gen.test.ts`(~80 行 · 5 unit: 1st call OK · 10th call OK · 11th call rate-limited · cross-account 隔离 · day rollover reset)

**files_to_modify** ·
- `apps/api/src/trpc/routers/aiVideo.ts`(generateStoryboard 加 rate limit check · ~+30 行)
- `apps/web/src/pages/tools/AiVideo.tsx`(显示剩余次数 · ~+20 行)
- `.env.example`(加 IMAGE_GEN_DAILY_LIMIT_PER_USER + IMAGE_GEN_MAX_SCENES_PER_REQUEST)

---

### **US-012 · Wave 2 · /generate 后端扩展 · CopywritingAgent acquisition mode 接入**

> **risk_level** · `medium`(扩展现有 router · 模式继承 PRD-5)
> **priority** · 12
> **depends_on** · [US-002]

**描述** · `apps/api/src/trpc/routers/copywriting.ts` 加 `acquisitionGenerate` procedure · 真接 CopywritingAgent acquisition mode(D-035 落地 · 沿用 D-026 命名规则 · 不破坏 generate / freeGenerate)。前端 `/generate` 工具页 mode select 加 acquisition 选项(同 free/boom)。

**files_to_modify** ·
- `apps/api/src/trpc/routers/copywriting.ts`(加 acquisitionGenerate procedure · ~+40 行)
- `apps/web/src/pages/tools/Generate.tsx`(mode select 加 'acquisition' option · ~+30 行)
- `tests/unit/api/copywriting-acquisition.test.ts`(新建 · ~60 行 · 4 unit: happy / zod / mode='acquisition' 写入 / agentMode='acquisition')
- `packages/clients/src/router-types.ts`(shadow router 加 copywriting.acquisitionGenerate)

---

### **US-013 · Wave 2 · /history 接入扩展 · sceneImage 渲染 + 5 工具新条目类型**

> **risk_level** · `medium`(history 5 工具新条目 · sceneImage 列表渲染)
> **priority** · 13
> **depends_on** · [US-003, US-005, US-007, US-009, US-012]

**描述** · 4 项:
1. **history.list filter 扩展** · agentMode 加 5 新值('production' / 'acquisition' video / 'storyboard' / 'acquisition' copy)
2. **history.detail 返回 sceneImageUrls** · storyboard 类型 history 含 scenes 数组(从 Asset 表 join 查)
3. **History.tsx 渲染** · 5 工具新 badge + 点 storyboard row → 跳 `/ai-video?historyId=N` 预填 + 显示 5-8 镜头网格
4. **4 工具页 useEffect ?historyId** · production / acquisition / storyboard / acquisition-copy 各加 useEffect 读 detail 预填(沿用 PRD-5 模式)

**files_to_modify** ·
- `apps/api/src/trpc/routers/history.ts`(detail 加 scenes join · ~+30 行)
- `apps/web/src/pages/modules/History.tsx`(5 新 badge + 跳转路由表 · ~+50 行)
- `apps/web/src/pages/tools/{VideoProduction,AcquisitionVideo,AiVideo}.tsx`(各加 useEffect ?historyId · 各 ~+20 行)
- `tests/unit/api/history-router.test.ts`(扩展 · 加 5 工具 filter test · ~+40 行)

---

### **US-014 · 收官 · LLM Judge 4 mode + 4 工具 e2e + lint clean + typecheck + 全套绿灯**

> **risk_level** · `medium`(收官集成 · Judge 套件扩展 · 防 lint debt)
> **priority** · 14
> **depends_on** · [US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010, US-011, US-012, US-013]

**描述** · PRD-6 收官 · 4 项:
1. **LLM Judge 套件扩展 +8 新** · `tests/judge/`:
   - `video-production.judge.ts`(2 golden case: 美妆 + 健身 · 13 列分镜检查)
   - `video-acquisition.judge.ts`(2 golden case: 理财 + 教育 · CTA 必含)
   - `video-storyboard.judge.ts`(2 golden case: 美食 + 旅游 · 5-8 scenes + imagePromptEn 英文)
   - `copywriting-acquisition.judge.ts`(2 golden case: 育儿 + 医美 · 200-500 字 + CTA)
   - 各调 `runJudge(case_)` · model_tier='lightweight' · cost_log eventType='judge_call'
   - **累计 30 judge tests**(22 PRD-5 + 8 新)
2. **4 工具页 e2e 集成** · `tests/e2e/video-tools-integration.spec.ts`(test.describe.serial · 创建账号 → 跑 4 视频工具 generate/acquisition/storyboard 各 1 次 + acquisition copywriting · 看 history 4-5 条 · 跳预填验证 · CI 用 mock LLM + mock ImageGen)
3. **lint clean** · `pnpm --filter @quanqn/web lint --max-warnings=0` 退出码 0 · `pnpm --filter @quanqn/api lint --max-warnings=0` 退出码 0
4. **全套绿灯门禁** · vitest ≥ 620 / 620(563 PRD-5 累计 + ≥ 60 新)· typecheck 6 ws 0 error · playwright ≥ 138 / 138(126 PRD-5 + ≥ 12 新 + 1 新收官 spec)· judge 30/30

**files_to_create** ·
- `tests/judge/video-production.judge.ts`(2 golden case · 调 videoAgent mode='production')
- `tests/judge/video-acquisition.judge.ts`(2 golden case · acquisition video)
- `tests/judge/video-storyboard.judge.ts`(2 golden case · storyboard + imagePromptEn 英文检查)
- `tests/judge/copywriting-acquisition.judge.ts`(2 golden case · CopywritingAgent acquisition)
- `tests/e2e/video-tools-integration.spec.ts`(收官集成 e2e · serial · CI mock · ~250 行)
- `scripts/ralph/verify-artifacts/US-014/manifest.json`(产物 · 同 PRD-5 US-012 manifest 模式)

**files_to_modify** ·
- `apps/web/eslint.config.js` 或修边缘 lint warnings(若 US-004/006/008 引入)
- `apps/api/eslint.config.js` 或修边缘 lint warnings(若 US-003/005/007/009/010 引入)

**test_command** · `pnpm typecheck && pnpm test && pnpm test:judge && pnpm test:e2e && pnpm --filter @quanqn/web lint --max-warnings=0 && pnpm --filter @quanqn/api lint --max-warnings=0`

---

## §1.5 跨 Story 协议锁

> **理由** · PRD-6 14 stories 跨 2 Specialist + 4 router + 3 前端工具页 + ImageGen Worker + BullMQ 队列 + history 接入 · 命名歧义会导致 ralph 在不同 story 脑补不同名字。本节预先锁定。
> **F5 既有代码现状双对账**(防 TD-012 类 · OPUS-AUDIT-CHEATSHEET §F5.1 · 沿用 PRD-5)· 见 §1.5.E。

### A · 类型 / 方法签名锁

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `VideoMode = 'shooting' \| 'production' \| 'acquisition' \| 'storyboard'` | type union | US-002(扩) | US-003 + US-005 + US-007 | VideoAgent 4 mode · shooting 已在 PRD-4 |
| `CopywritingMode = 'step7' \| 'free' \| 'boom' \| 'acquisition'` | type union | (PRD-5 D-035) | US-012 | acquisition 真接 LLM(PRD-5 throw 'PRD-6' 移除)|
| `class VideoAgent extends BaseSpecialist<VideoInput, VideoOutput>` | class | (PRD-4 已建)| US-003 + US-005 + US-007 | 单实例 export `videoAgent` · 沿用 PRD-4 |
| `outputSchema: ZodSchema` (getter) | getter | US-002(VideoAgent + Copywriting) | (BaseSpecialist 内调) | 按 _mode 返回对应 schema(D-028 模式继承)|
| `videoAgent.execute(req)` | single instance method | (PRD-4 已建)| US-003 + US-005 + US-007 | `req: { accountId, mode: VideoMode, userInput, traceId? }` |
| `aiVideoRouter.generateStoryboard(input)` | tRPC mutation | US-007 | AiVideo.tsx | `input: { sourceCopy, scenesCount: 5\|6\|7\|8, imageStyle: 'vivid'\|'natural' }` |
| `aiVideoRouter.jobStatus(input)` | tRPC query | US-007 | AiVideo.tsx polling | `input: { historyId: number }` · 返回 { total, completed, pending, failed, scenes } |
| `IImageGenWorker.generate(payload)` | interface method | US-001 + US-009 | US-010 BullMQ Worker | `payload: { sceneIndex, imagePromptEn, accountId, traceId, historyId, imageStyle }` · returns { sceneImageUrl, costUsd, durationMs } |
| `imageGenQueue` | BullMQ Queue instance | US-010 | US-007(入栈)| name='image-gen' · concurrency=2 |
| `checkImageGenRateLimit(accountId)` | function | US-010 | US-007 + US-011 | throws TRPCError if exceeded · 用 Redis sliding window |

### B · Specialist outputSchema 锁(VideoAgent 4 mode + CopywritingAgent acquisition · 5 输出 schema)

| Specialist · mode | outputSchema(精确 zod) | 定义 story | 消费 story |
|---|---|---|---|
| `VideoAgent · shooting` | (PRD-4 US-006 已建)`z.object({ shotList: z.array(13ColumnSchema).min(1), equipment, schedule })` | (PRD-4) | (本期不动) |
| `VideoAgent · production` | `z.object({ scriptOverview, shotList: z.array(13ColumnSchema).min(1), equipmentList, scheduleTable, totalDuration, productionCostEstimate })` | US-002 | US-003 + US-004(渲染)|
| `VideoAgent · acquisition` | `z.object({ scriptOverview, shotList: z.array(13ColumnSchema).min(1), ctaScript: z.string().min(20), conversionPath: z.array(z.string()).min(1), equipmentList })` | US-002 | US-005 + US-006(渲染) |
| `VideoAgent · storyboard` | `z.object({ scenes: z.array(z.object({ index: z.number().int().positive(), description: z.string().min(20), imagePromptEn: z.string().min(20).regex(/^[\\x00-\\x7F]+$/, "must be ASCII English"), duration: z.string() })).min(5).max(8), totalDuration: z.string() })` | US-002 | US-007 + US-008(渲染) |
| `CopywritingAgent · acquisition` | `z.object({ markdown: z.string().min(200).max(500), metadata: z.object({ scriptType: z.enum(SCRIPT_TYPE_KEYS_20), elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)), ctaPosition: z.enum(['top','middle','end']), conversionGoal: z.string() }) })` post-validate `# ` heading + 末尾 CTA 句 | US-002(扩) | US-012 + Generate.tsx 渲染 |

### C · history 表写入 + cost_log + Asset 表锁(D-040 落地)

| 命名 | 类型 | 定义 story | 说明 |
|---|---|---|---|
| `History.agentId` | varchar(64) | (PRD-5 已锁 PascalCase) | `'VideoAgent'` / `'CopywritingAgent'` · 不允许小写(TD-016 教训)|
| `History.agentMode` | varchar(32) | US-002 + 4 router | `'production'` / `'acquisition'`(video)/ `'storyboard'` / `'acquisition'`(copywriting · 同名但 agentId 区分)|
| `History.contentType` | varchar(16) | (PRD-2 已定) | `'json'` for video stories · `'markdown'` for acquisition copywriting |
| `History.scenes` | jsonb? | US-001(Asset 加 sceneIndex)+ US-007(history.scenes JSON 字段)| 仅 storyboard mode 写 · 含 `[{ index, description, imagePromptEn, sceneImageUrl?, status }]` |
| `Asset.sceneIndex` | Int? | US-001(prisma migration) | 1-based · null 时不是 scene image · 复合索引 `[accountId, relatedStepKey, sceneIndex]` |
| `Asset.assetType` | varchar(32) | (扩展现有)| `'scene_image'`(新增)· `'avatar_ai'`(PRD-2 已定)· 等 |
| `Asset.relatedHistoryId` | Int? | (现有)| storyboard scene image 的 historyId |
| `cost_log.eventType` | varchar(32) | US-009 + US-010 | `'image_gen'`(新增第 3 类)· 跟 `'specialist_call'` / `'judge_call'` 区分 · D-040 |
| `cost_log.modelUsed` | varchar(64) | US-009 | `'dall-e-3'` for image_gen · 跟 `'claude-haiku-4-5'` 等 LLM model 区分 |
| `cost_log.provider` | varchar(16) | US-009 | `'openai'` for DALL-E 3 · 跟 `'anthropic'` 区分 |

### D · 4 工具 router · procedure 命名锁(防 D-026 选项混淆)

| router | procedure | input | output | 定义 story | 备注 |
|---|---|---|---|---|---|
| `videoProduction` | `generate`(新建) | `{ sourceCopy: string min 10 max 3000, videoType?, duration?, additionalContext? }` | history row | US-003 | 调 videoAgent mode='production' |
| `acquisitionVideo` | `generate`(新建) | `{ sourceCopy, conversionGoal: string, platform?, duration? }` | history row | US-005 | 调 videoAgent mode='acquisition' |
| `aiVideo` | `generateStoryboard`(新建) | `{ sourceCopy, scenesCount: 5\|6\|7\|8 default 5, imageStyle: 'vivid'\|'natural' default 'natural' }` | `{ historyId, jobIds: string[], scenesPlaceholder: 5-8 array }` | US-007 | 调 videoAgent mode='storyboard' + 入 BullMQ 队列 |
| `aiVideo` | `jobStatus`(新建) | `{ historyId: number }` | `{ total, completed, pending, failed, scenes: [{ index, status, sceneImageUrl?, error? }] }` | US-007 | accountId RLS 自动 |
| `copywriting` | `acquisitionGenerate`(新建 · 沿用 D-026 命名规则) | `{ scriptType: enum SCRIPT_TYPE_KEYS_20, elements, conversionGoal: string, topic: string }` | history row | US-012 | 调 copywritingAgent mode='acquisition' · ★ 不破坏现有 generate / freeGenerate |
| `history` | `list` / `detail` / `delete` | (PRD-5 已锁) | (本期不变结构) | (PRD-5 US-011)| US-013 detail 加 scenes join |

### E · 既有代码现状对账(F5 防 TD-012 类 · 沿用 PRD-5 教训)

| 协议锁路径(PRD-6 拟用) | 既有状态(grep 实测) | 处理 |
|---|---|---|
| `apps/api/src/specialists/VideoAgent.ts` | 存在(309 行 · PRD-4)· shooting mode + 3 mode throw 'PRD-6' | 改 · 解锁 3 mode · 不破坏 shooting · ★ |
| `apps/api/src/specialists/CopywritingAgent.ts` | 存在(PRD-5 解锁 free/boom)· acquisition throw 'PRD-6' | 改 · 解锁 acquisition · 不破坏现有 4 mode |
| `apps/api/src/services/context-assembler/templates/{video-production,acquisition-video,ai-video}.ts` | **不存在** | 新建 3 文件 · 无冲突 ✓ |
| `apps/api/src/trpc/routers/{videoProduction,acquisitionVideo,aiVideo}.ts` | **不存在** | 新建 3 文件 · 无冲突 ✓ |
| `apps/api/src/trpc/routers/copywriting.ts` | 存在(PRD-5)· generate / freeGenerate / optimize / list / delete | 加 `acquisitionGenerate` procedure · 不破坏 |
| `apps/api/src/workers/image-gen/` | 存在但只有空目录 | 新建 4 文件(index/dall-e-3/queue/worker)· 无冲突 ✓ |
| `apps/api/src/lib/redis.ts` | **不存在** | 新建 · ioredis 单例 |
| `apps/api/src/lib/rate-limit/image-gen.ts` | **不存在**(rate-limit/ 目录无)| 新建 |
| `packages/schemas/src/specialist-io/{videoProduction,acquisitionVideo,aiVideo,acquisitionCopywriting,imageGen}.schema.ts` | **不存在** | 新建 5 文件 · 无冲突 ✓ |
| `packages/schemas/src/index.ts` | 存在(barrel) | 加 5 export · 不破坏 |
| `apps/web/src/pages/tools/{VideoProduction,AcquisitionVideo,AiVideo}.tsx` | 存在(PRD-2 占位 · ~50 行 stub) | 重写真表单 + result 渲染(沿用 PRD-5 ToolForm/ToolResult)|
| `apps/web/src/components/ToolResult/{VideoProductionResult,AcquisitionVideoResult,AiVideoResult}.tsx` | **不存在** | 新建 3 文件 · 无冲突 ✓ |
| `apps/web/src/components/ToolResult/ToolResult.tsx` | 存在(PRD-5)· switch by toolKey | 加 3 case · 不破坏 |
| `prisma/schema.prisma` Asset model | 存在(PRD-2)· 含 assetType / generationPrompt / generationModel | 加 sceneIndex Int? + 复合索引 · 走 migration · 不破坏 |
| `apps/api/src/lib/constants/{videoTypes,videoDurations,imageStyles}.ts` | **不存在**(constants/ 目录有别的)| 新建 3 文件 · 无冲突 ✓ |
| `apps/api/src/index.ts` | 存在(boot)| 加 worker 启动(dev mode)· 不破坏 |
| `package.json` | 存在 · bullmq + ioredis declared 但 unused | 加 scripts `worker:image-gen` · 不破坏 |

### F · 编号锁(跨 PRD 编号延续)

- **Locked Decisions** · D-001 ~ D-035(PRD-1~5)· PRD-6 从 **D-036** 起 · 不重置(详 §7)
- **TD 编号** · TD-001 ~ TD-019(PRD-1~5)· PRD-6 新发现从 **TD-020** 起
- **RCA 编号** · RCA-001 ~ RCA-003(PRD-1~5)· PRD-6 新发现从 **RCA-004** 起

---

## §2 验收标准(每 US 4 类 · H/E/B/P)

> **AC 编号规则** · 每个 US 各 4 类 AC: H(Happy)+ E(Error)+ B(Boundary)+ P(Performance)· 4-8 条 / story · 总 ~80 AC
> **AC 代码嵌入规则** · 涉及 schema / SQL / 函数签名时 inline 完整代码(沿用 PRD-5 模式)
> **AC 闭环验收硬规则** · UI / 多步流程 story 必含 4 行最小集 + 失败路径(PRD-5 D-026 起的硬规则继承)

### **AC-001 · Foundation · 5 schema + ImageGen 骨架 + Asset sceneIndex**(US-001 · foundation)

H · Happy:
- [ ] `pnpm test tests/unit/api/schemas/video-schemas.test.ts` 退出码 0 · 5 schema 全部 zod parse 通过 happy case
- [ ] `pnpm prisma migrate deploy` 退出码 0 · Asset 表 sceneIndex 字段 + 复合索引建成 · `\d assets` 看新字段
- [ ] `apps/api/src/workers/image-gen/{index,dall-e-3,queue}.ts` 创建 + tsc 通过 + interface IImageGenWorker 含 `generate(payload) → Promise<sceneImageUrl>`

E · Error:
- [ ] videoProductionInput zod fail · sourceCopy 长度 < 10 → BAD_REQUEST 中文 message "原始文案至少 10 字符"
- [ ] aiVideoInput scenesCount 超出 5-8 → BAD_REQUEST 中文 message "镜头数应在 5-8 之间"

B · Boundary:
- [ ] storyboard scene description 边界 · min(20) max(500) · 边界值 zod 边界 test
- [ ] imagePromptEn 必含纯 ASCII(英文)· 中文 fail · `imagePromptEn: "美女吃饭"` → zod fail "必须是英文"

P · Performance:
- [ ] 5 schema parse 总耗时 < 50ms(vitest 跑 100 次平均)
- [ ] migration 跑通 < 5s(本地 PG · 单条 alter table 加字段)

### **AC-002 · Foundation · VideoAgent 解锁 3 mode + Copywriting acquisition + 3 ContextAssembler 模板**(US-002 · foundation)

H · Happy:
- [ ] VideoAgent mode='production' · invokeLLM 返回 production schema 数据 · outputSchema.parse 通过
- [ ] VideoAgent mode='acquisition' · 输出含 ctaScript + conversionPath · outputSchema.parse 通过
- [ ] VideoAgent mode='storyboard' · 输出 5 scenes · 每 scene imagePromptEn 全 ASCII · outputSchema.parse 通过
- [ ] CopywritingAgent mode='acquisition' · 输出 markdown 200-500 字 + metadata.ctaPosition · outputSchema.parse 通过
- [ ] ContextAssembler 加 video-production / acquisition-video / ai-video 3 模板 · SPECIALIST_TEMPLATES barrel 含 3 入口

E · Error:
- [ ] VideoAgent invokeLLM 返回不符 schema(如 storyboard scenes 长度 4)· retry 1 次 · 仍失败 throw SchemaValidationError
- [ ] CopywritingAgent acquisition mode markdown 缺 CTA · post-validate fail
- [ ] storyboard mode scene imagePromptEn 含中文 · post-validate 拦截 + retry 1

B · Boundary:
- [ ] storyboard scenes 数 = 5 边界 · 6 / 7 / 8 边界 · zod 通过
- [ ] acquisition copywriting markdown 200 字边界(min)· 500 字边界(max)· 边界外 fail

P · Performance:
- [ ] VideoAgent mode='production' invokeLLM 真调 LLM(integration test nock)< 3s
- [ ] VideoAgent unit test(mock LLM)总 9 unit 跑 < 100ms
- [ ] CopywritingAgent unit test(mock LLM)总 3 unit 跑 < 50ms

### **AC-003 · Wave 1 · /video-production 后端 · videoProduction.generate procedure**(US-003 · high)

H · Happy:
- [ ] `videoProduction.generate({ sourceCopy: '今天分享一段减脂经历...300字...', videoType: 'short_form', duration: '60s' })` 返回 history row · agentId='VideoAgent' · agentMode='production'
- [ ] cost_log 写入 1 行 · callType='specialist_call' · modelUsed 含 'claude' · accountId 隔离

E · Error:
- [ ] sourceCopy 长度 < 10 → BAD_REQUEST 中文 "原始文案至少 10 字符"
- [ ] VideoAgent invokeLLM throw LLMTimeoutError · BaseSpecialist fallback path 触发 · 返回 fallback 模板 + isFallback=true
- [ ] cross-account 调 → accountId RLS 自动隔离(LD-009)· 返回别人的 row 不可能

B · Boundary:
- [ ] sourceCopy 长度 = 10(min)边界 · 跑通
- [ ] sourceCopy 长度 = 3000(max)边界 · 跑通
- [ ] sourceCopy 长度 = 3001 · zod fail

P · Performance:
- [ ] integration test mock SDK · 总耗时 < 5s
- [ ] history.list filter agentId='VideoAgent' agentMode='production' · 返回时间 < 200ms(单 account 100 行)

### **AC-004 · Wave 1 · /video-production 前端 · VideoProduction.tsx**(US-004 · medium)

H · Happy:
- [ ] 使用 agent-browser 打开 `/video-production` · 看到表单 · 填 sourceCopy + select videoType='short_form' + duration='60s' · 点 "生成方案" 按钮
- [ ] 提交后 toast 显示 "生成中..." · 1-3s 后 ToolResult 区显示完整方案 · 13 列分镜表 + 设备清单 + 排期
- [ ] 表单字段持久到 LS(`acc_{id}_tool_video-production_input`)· 刷新页面后保留

E · Error:
- [ ] sourceCopy 留空 · zod 中文 message "原始文案至少 10 字符" · 不允许提交
- [ ] 后端 throw → toast 显示中文错误 · UI 不崩
- [ ] history 跳转预填: `/video-production?historyId=N` · 表单字段填入历史值 + 结果区显示历史方案

B · Boundary:
- [ ] sourceCopy 长度 = 10(min)· 提交通过
- [ ] sourceCopy 长度 = 3000(max)· 提交通过 · UI 不卡

P · Performance:
- [ ] 13 列分镜表 100+ 行 render < 100ms
- [ ] 表单 input + LS 写入 < 50ms

### **AC-005 · Wave 1 · /acquisition-video 后端 · acquisitionVideo.generate**(US-005 · high)

(同 AC-003 模式 · acquisition mode 特定字段:conversionGoal + ctaScript)

H · Happy:
- [ ] `acquisitionVideo.generate({ sourceCopy, conversionGoal: '引流公众号', platform: 'douyin' })` 返回 history row · agentId='VideoAgent' · agentMode='acquisition' · 输出含 ctaScript + conversionPath
- [ ] CTA 在 ctaScript 字段含明确转化指令(grep "关注 / 私信 / 点击" 任一)

E + B + P · 同 AC-003 模式

### **AC-006 · Wave 1 · /acquisition-video 前端 · AcquisitionVideo.tsx**(US-006 · medium)

(同 AC-004 模式 · 加 conversionGoal + CTA 强调 UI)

H · Happy:
- [ ] 使用 agent-browser 打开 `/acquisition-video` · 表单 + 提交 · 渲染 13 分镜 + ★ CTA 区高亮 ★ + 转化路径列表

E + B + P · 同 AC-004 模式

### **AC-007 · Wave 2 · /ai-video 后端 · aiVideo.generateStoryboard + jobStatus**(US-007 · high)

H · Happy:
- [ ] `aiVideo.generateStoryboard({ sourceCopy, scenesCount: 5, imageStyle: 'natural' })` 立即返回 `{ historyId: 123, jobIds: [...], scenesPlaceholder: 5 array }` · 不等图片完成
- [ ] history row 写入 · agentMode='storyboard' · scenes JSON 含 5 scenes · 全部 sceneImageUrl=null + jobId 填
- [ ] 5 BullMQ jobs 入栈成功 · queue.count() = 5

E · Error:
- [ ] rate limit 触 · 第 11 次调用同一 user · throw `TRPCError({ code: 'TOO_MANY_REQUESTS' })` · 不入栈
- [ ] scenesCount = 9 · zod fail "镜头数应在 5-8 之间"
- [ ] storyboard mode imagePromptEn 含中文 · post-validate 拦截 + LLM retry 1

B · Boundary:
- [ ] scenesCount = 5(min)· 入 5 jobs
- [ ] scenesCount = 8(max)· 入 8 jobs

P · Performance:
- [ ] generateStoryboard 总响应时间 < 5s(包含 LLM 调用 + 入栈)
- [ ] jobStatus 查询 < 100ms

### **AC-008 · Wave 2 · /ai-video 前端 · AiVideo.tsx + 镜头网格 + polling**(US-008 · high)

H · Happy:
- [ ] 使用 agent-browser 打开 `/ai-video` · 填 sourceCopy + scenesCount=5 + style='natural' · 点 "生成 AI 视频"
- [ ] 立即跳到结果页 · 5 镜头卡片网格 · 每镜显示 skeleton + spinner
- [ ] 每 3s polling jobStatus · scene 完成 push sceneImageUrl · 镜头卡片 skeleton → 真图渲染
- [ ] 5 镜头全完成 · 顶部 banner "生成完成" + polling 关闭
- [ ] 失败 scene · 显示 placeholder + "重试" 按钮

E · Error:
- [ ] sourceCopy 留空 · zod 中文 message · 不允许提交
- [ ] rate limit 触 · 显示 "今日已达上限 · 明日再来" + 灰色按钮
- [ ] polling 5 次仍 0 scene 完成 · 显示 "图片生成中..." + 提示用户可关闭页面
- [ ] history 跳转预填: `/ai-video?historyId=N` · 表单 + 5-8 历史镜头网格 + 完成状态

B · Boundary:
- [ ] scenesCount = 5(min)5 镜头格
- [ ] scenesCount = 8(max)8 镜头格

P · Performance:
- [ ] 5 镜头 lazy load · 总 5 × 1024×1024 = 5MB · 首屏 < 3s 全显示
- [ ] polling 每 3s · 1 query < 100ms

### **AC-009 · Wave 2 · ImageGen Worker · DALL-E 3 + cost_log**(US-009 · high)

H · Happy:
- [ ] IMAGE_GEN_ENABLED=true + OPENAI_API_KEY 配置 · imageGen.generate({ imagePromptEn: 'A young woman jogging in park, sunset', accountId: 1, sceneIndex: 1, ... }) 返回 sceneImageUrl(.png · DALL-E 3 cdn url)
- [ ] cost_log 写 1 行 · eventType='image_gen' · provider='openai' · modelUsed='dall-e-3' · costUsd ≈ 0.04
- [ ] Asset 表写 1 行 · assetType='scene_image' · sceneIndex=1 · publicUrl=DALL-E url · generationPrompt=imagePromptEn · generationModel='dall-e-3'
- [ ] history.scenes[0].sceneImageUrl 反写为 DALL-E url

E · Error:
- [ ] IMAGE_GEN_ENABLED=false · 返回 placeholder url(`/static/placeholder-1024x1024.png`)· 不调 OpenAI · 不写 cost_log
- [ ] OpenAI API 网络失败 · max 3 次重试(exponential backoff 1s/2s/4s)· 仍失败 · 返回 placeholder + 写 history scene status='failed'
- [ ] OpenAI API 返回 invalid response · 返回 placeholder + 标记失败

B · Boundary:
- [ ] DALL-E 3 size='1024x1024' · style='natural' / 'vivid' · quality='standard'(★ 不用 HD · 太贵)
- [ ] imagePromptEn 长度 边界(< 1000 字 OpenAI 限制)

P · Performance:
- [ ] 1 镜头 DALL-E 3 调用 · 平均 8-15s(OpenAI 真实延迟)· timeout 30s 硬上限
- [ ] cost_log 写入 < 50ms

### **AC-010 · Wave 2 · BullMQ 队列 + Redis + Worker**(US-010 · high)

H · Happy:
- [ ] BullMQ Queue 'image-gen' 在 Redis 启动 · `redis-cli KEYS bull:image-gen:*` 看到 queue keys
- [ ] Worker 进程跑 · `pnpm worker:image-gen` 命令启动 · ★ 或 dev mode 跟 api 同进程
- [ ] 入 5 jobs · concurrency=2 · 同时跑 2 个 · 排队 3 个
- [ ] 每 job 完成 push 'completed' event · history.scenes[i].sceneImageUrl 反写

E · Error:
- [ ] Job fail · BullMQ retries=2 + backoff='exponential' · 自动重试 2 次
- [ ] 重试仍失败 · 最终 status='failed' + history.scenes[i].status='failed'
- [ ] Redis 连不上(unreachable)· Queue.add() throw · 上游 catch + 返回 5xx · 用户看 "生成失败 · 请稍后再试"

B · Boundary:
- [ ] concurrency = 2 · 第 3 个 job 等队列空位才跑
- [ ] queue 满(★ 没硬上限 · 但 cost 控制由 rate limit 限制)

P · Performance:
- [ ] queue.add() < 50ms(同步入栈)
- [ ] Worker spawn → start processing < 200ms

### **AC-011 · Wave 2 · Rate limit + IMAGE_GEN_DAILY_LIMIT_PER_USER**(US-011 · medium)

H · Happy:
- [ ] IMAGE_GEN_DAILY_LIMIT_PER_USER=10 · 单 user 1 天内调 1-10 次都 OK
- [ ] 第 11 次调用 · throw `TRPCError({ code: 'TOO_MANY_REQUESTS', message: '今日生成已达上限...' })`
- [ ] 第二天(date rollover)· 计数归零 · 重新 10 次

E · Error:
- [ ] 跨 account 隔离 · accountId=1 跑 10 次 · accountId=2 仍可跑 10 次

B · Boundary:
- [ ] 第 10 次成功 · 第 11 次拦截 · 边界精准
- [ ] day rollover 时间(本地时区 / UTC?)· ★ D-044 决策(用 UTC)

P · Performance:
- [ ] rate limit check Redis sliding window query < 10ms
- [ ] 1000 个并发 user 各自 rate limit 独立 · Redis 吞吐扛得住(本地测)

### **AC-012 · Wave 2 · /generate 后端 · CopywritingAgent acquisition mode 接入**(US-012 · medium)

H · Happy:
- [ ] `copywriting.acquisitionGenerate({ scriptType: 'tutorial', elements: ['fear'], conversionGoal: '关注公众号', topic: '理财干货' })` 返回 history row · agentId='CopywritingAgent' · agentMode='acquisition'
- [ ] 输出 markdown 200-500 字 · 末尾含 CTA(grep "关注 / 私信 / 点击")
- [ ] cost_log 写 1 行 · callType='specialist_call'

E · Error:
- [ ] conversionGoal 留空 · zod fail "转化目标必填"
- [ ] CopywritingAgent acquisition invokeLLM 返回 markdown 缺 CTA · post-validate retry 1
- [ ] (同前 PRD-5 freeGenerate 模式)

B · Boundary:
- [ ] markdown 200(min)/ 500(max)· 边界值
- [ ] elements 1-8 个 · 边界

P · Performance:
- [ ] integration test < 5s

### **AC-013 · Wave 2 · /history 接入扩展 · sceneImage + 5 工具新条目**(US-013 · medium)

H · Happy:
- [ ] history.list filter agentMode='production' / 'acquisition' / 'storyboard' / acquisition-copy 都正常返回
- [ ] history.detail 含 storyboard 的 row · scenes 数组完整 · 每 scene 含 sceneImageUrl
- [ ] History.tsx 5 工具新 badge 显示 · 'production' = 蓝 · 'acquisition' = 红 · 'storyboard' = 紫 · 'acquisition'(copy) = 绿
- [ ] 点 storyboard row · 跳 `/ai-video?historyId=N` · 5-8 镜头网格预填渲染
- [ ] 点 acquisition video row · 跳 `/acquisition-video?historyId=N` · 表单 + 13 分镜 + CTA 区预填

E · Error:
- [ ] 跨 account 调 detail · accountId RLS 自动 NOT_FOUND
- [ ] storyboard scenes 含 sceneImageUrl=null(进行中)· UI 显示 skeleton

B · Boundary:
- [ ] history filter agentMode 5 新 enum · zod 边界

P · Performance:
- [ ] history.detail 含 scenes JSON 8 镜头 + Asset join · < 200ms
- [ ] History.tsx Table 100 行 · render < 100ms

### **AC-014 · 收官 · LLM Judge 4 mode + 4 工具 e2e + lint clean + typecheck**(US-014 · medium)

H · Happy:
- [ ] tests/judge/video-production.judge.ts 新建 · 2 golden case(美妆 + 健身 · 13 分镜)pass
- [ ] tests/judge/video-acquisition.judge.ts 新建 · 2 golden case(理财 + 教育 · CTA 必含)pass
- [ ] tests/judge/video-storyboard.judge.ts 新建 · 2 golden case(美食 + 旅游 · 5-8 scenes + imagePromptEn 全英文)pass
- [ ] tests/judge/copywriting-acquisition.judge.ts 新建 · 2 golden case(育儿 + 医美 · 200-500 字 + CTA)pass
- [ ] `pnpm test:judge` 退出码 0 · **30/30 pass**(22 PRD-5 + 8 新)
- [ ] tests/e2e/video-tools-integration.spec.ts 新建 · 收官 e2e · serial · 创账号 → 跑 4 视频工具 → history 5 条 → 跳预填 · CI mock LLM + ImageGen
- [ ] `pnpm --filter @quanqn/web lint --max-warnings=0` 退出码 0
- [ ] `pnpm --filter @quanqn/api lint --max-warnings=0` 退出码 0
- [ ] `pnpm typecheck` 6 ws 0 error
- [ ] `pnpm test` ≥ 620 / ≥ 620(563 PRD-5 + ≥ 60 新)
- [ ] `pnpm test:e2e` ≥ 138 / ≥ 138(126 PRD-5 + 5 工具 e2e + 1 收官 spec + 6 各 spec)
- [ ] scripts/ralph/verify-artifacts/US-014/manifest.json 写入全套测试结果(同 PRD-5 US-012 manifest 模式)

E · Error + B + P:
- [ ] cost_log eventType='judge_call' / 'image_gen' / 'specialist_call' 3 类区分(D-040 落地)· grep 验证
- [ ] e2e 用 dev@local.test 共享 user · workers=1 + fullyParallel=false 序列化(继承 PRD-5 US-012 教训)
- [ ] judge 30 tests 总耗时 < 5min(lightweight · 串行)
- [ ] e2e 6 新 spec 总耗时 < 90s(CI mock LLM + ImageGen)
- [ ] typecheck < 5s 增量 · lint < 5s
- [ ] **使用 agent-browser 收官验证** · 创建测试账号 → /video-production /acquisition-video /ai-video /generate(acquisition mode)4 工具各跑 1 次 → /history 看到 4 条 → 点任一行 → 预填验证 · 0 控制台错误
- [ ] verify-artifacts 完整(同 PRD-5 US-012 模式)

---

## §3 范围排除(7 项 · 详 §0.7 「本 PRD 暂不做」+ Assumptions §A8)

| # | 排除项 | 留 PRD | 理由 |
|:-:|---|:-:|---|
| 1 | 真 user upload video(.mp4 / .mov 上传)| PRD-9 P8 | RAG 入库 / 视频解析需 FileParser Worker · 大文件 + 转码 · 复杂 |
| 2 | 文心一格 / 国内 image API | PRD-9 P8 PRR | 国内 API key 申请(百度智能云审批 1-2 天)· 留上线前(项目 §7) |
| 3 | DALL-E 3 HD quality | PRD-9 PRR | HD $0.08/张 是 standard $0.04 的 2x · 现 standard 够用 · 真上线再升级 |
| 4 | VoiceChatAgent / EvolutionAgent / DailyTaskAgent(3 L5 自治) | PRD-8 P7 智能 | 多轮对话 + 反馈飞轮 + Heartbeat · 复杂 |
| 5 | RAG 真接 + /knowledge 工具页 | PRD-9 P8 知识库 | pgvector 入库 + 67 案例 + 22 元素 + 23 公式 |
| 6 | admin 任何代码(13 admin 表 / portal API)| PRD-10~14 | 独立子系统 · 不在主应用 P0-P9 范围 |
| 7 | 视频文件渲染(组合 sceneImage 成 mp4)| PRD-9+ | 需第三方剪辑工具(剪映 / FFmpeg)集成 · 复杂 · 留 PRR |

---

## §4 风险 + 缓解(7 项 · 详 Assumptions A20)

| # | 风险 | 缓解 |
|:-:|---|---|
| R1 | ★ ImageGen 新模块 · 第一次接 OpenAI image API · cost 控制 + 异步队列 + 重试 | env 开关 IMAGE_GEN_ENABLED=false 默认 · dev 跑 stub · prod 开关再上 · BullMQ retry=2 + exponential backoff · cost_log 严格记录 · admin PRD-11 后看 daily aggregation |
| R2 | 5-8 镜头 × 10s = 50-80s 用户等待 · UX 不好 | UI 进度条 + spinner + scene-by-scene 出图 · 用户可关闭页面后台等 · 完成时浏览器通知(可选) |
| R3 | VideoAgent 多 mode race(继承 TD-014 · 5 mode 共存)| AGENTS §11.6.3 文档化 · 单 user 串行调用安全 · 高并发治理留 PRD-7+ |
| R4 | DALL-E 3 prompt 必英文 · 中文 prompt 命中率低 | VideoAgent storyboard mode prompt 强制 imagePromptEn 字段 ASCII · zod regex 拦截 · post-validate retry 1 · 用户看到生成中文图就退回 |
| R5 | ralph daemon 长跑(14 stories)claude CLI hang 风险(继承 PRD-5 RCA-003)| M-2 health check 已部署 · 建议每 5-7 stories 重启 daemon(US-001~007 + US-008~014 拆 2 batch)· daemon hang 时 Opus 路径 B 接管 audit |
| R6 | history sceneImage 渲染 · 8 镜头 × 1024×1024 = 8 MB 总 size | lazy load(intersection observer)· thumbnails 256×256(★ 留 PRD-9 PRR · 现 1024 直接 lazy)· browser cache CDN |
| R7 | cost 烧钱 · 没付费体系 · 用户随便点 = 月 $1000+ | env IMAGE_GEN_ENABLED=false 默认 · dev 跑 stub · prod 开前加付费/credit 体系(留 PRD-9 PRR)· daily limit per user 兜底 · cost_log dashboard admin 监控 |

---

## §5 测试配额(对齐 LD-016 + 架构 §7)

### §5.1 单元测试配额

| 来源 | 数量 |
|---|:-:|
| US-001 schemas 验证(5 schema · ImageGen Worker interface · Asset migration)| 8 |
| US-002 VideoAgent.test.ts 加 9 unit(3 mode × 3 场景)+ CopywritingAgent.test.ts 加 3 unit(acquisition × 3)| 12 |
| US-003 video-production-router.test.ts(happy + zod fail + Specialist throw + agentMode)| 4 |
| US-004 VideoProduction.test.tsx(表单 + zod + mutation + LS + history 预填)| 5 |
| US-005 acquisition-video-router.test.ts | 4 |
| US-006 AcquisitionVideo.test.tsx | 5 |
| US-007 ai-video-router.test.ts(storyboard + jobIds + queue mock + rate limit + accountId)| 6 |
| US-008 AiVideo.test.tsx(表单 + 入栈 + polling + scene 完成 + 全完成 + 失败重试 + 跳预填)| 7 |
| US-009 image-gen-dall-e-3.test.ts(happy + retry + placeholder + cost_log + Asset + history 反写)| 6 |
| US-010 image-gen-queue.test.ts(8 unit · queue + concurrency + status + rate limit + accountId)| 8 |
| US-011 rate-limit-image-gen.test.ts(5 unit · 1st/10th/11th + cross-account + day rollover)| 5 |
| US-012 copywriting-acquisition.test.ts | 4 |
| US-013 history-router.test.ts 扩展(5 工具 filter)| 4 |
| US-014(LLM Judge 不算 unit · 算 judge)| 0 |
| **小计** | **78 新** |

### §5.2 集成测试配额

| 文件 | 内容 |
|---|---|
| `tests/integration/api/video-production-llm.test.ts`(US-003)| nock SDK + 真 DB cost_log + history |
| `tests/integration/api/acquisition-video-llm.test.ts`(US-005)| nock SDK |
| `tests/integration/api/ai-video-flow.test.ts`(US-007)| storyboard → 入队列 mock → mock worker 完成 → 查 history 看 sceneImageUrl |
| `tests/integration/api/image-gen-flow.test.ts`(US-009)| mock OpenAI SDK · 全流程 input → DALL-E mock → Asset → history 反写 |
| `tests/integration/api/image-gen-bullmq.test.ts`(US-010 · ★ 真 BullMQ + Redis test DB)| 入栈 → 真 worker tick → 完成事件 |
| **小计 5 新** | |

### §5.3 LLM Judge 测试配额

| 文件 | golden case |
|---|---|
| `tests/judge/video-production.judge.ts`(US-014)| 2(美妆 + 健身)|
| `tests/judge/video-acquisition.judge.ts`(US-014)| 2(理财 + 教育)|
| `tests/judge/video-storyboard.judge.ts`(US-014)| 2(美食 + 旅游 · imagePromptEn 全英文检查)|
| `tests/judge/copywriting-acquisition.judge.ts`(US-014)| 2(育儿 + 医美)|
| **小计 8 新 · 累计 30**(22 PRD-5 + 8 新)| |

### §5.4 E2E 配额

| 文件 | 路径 |
|---|---|
| `tests/e2e/tool-video-production.spec.ts`(US-004)| /video-production 基本路径(CI mock)|
| `tests/e2e/tool-acquisition-video.spec.ts`(US-006)| /acquisition-video 基本路径 |
| `tests/e2e/tool-ai-video.spec.ts`(US-008)| /ai-video 基本路径 + polling mock |
| `tests/e2e/copywriting-acquisition.spec.ts`(US-012)| /generate?mode=acquisition 基本路径(扩展现有)|
| `tests/e2e/image-gen-rate-limit.spec.ts`(US-011)| 11th call 拦截 + 提示 |
| `tests/e2e/video-tools-integration.spec.ts`(US-014)| 收官 serial · 创建账号 → 跑 4 视频工具 → 看 history 5 条 → 跳预填 |
| **小计 6 新 · 累计 ≥ 132**(126 PRD-5 + 6 新)| |

> 实际目标 138 · 加 mobile project 各 spec 镜像 = 132 × 2 / 2 + 收官 = 138 · 跟 AC-014 一致。

### §5.5 全套绿灯门禁(US-014 收官硬门禁)

```
vitest:        ≥ 620 / ≥ 620 ✓ (563 PRD-5 累计 + ≥ 60 新)
test:judge:    30 / 30 ✓ (22 PRD-5 + 8 新)
playwright:    ≥ 138 / ≥ 138 ✓ (126 PRD-5 + 12 新 chromium+mobile)
typecheck:     6 ws · 0 error ✓
lint:          0 warnings (--max-warnings=0) ✓ (防 PRD-1 lint debt 重现)
```

---

## §6 退出条件(8 项 · 对齐 ARCHITECTURE §9.7)

| # | 退出条件 | 验证 |
|:-:|---|---|
| 1 | /video-production 工具页跑通(VideoAgent production mode 真接 LLMGateway · 输出 13 分镜 + 设备 + 排期) | tests/e2e/tool-video-production.spec.ts(CI mock)+ tests/integration/api/video-production-llm.test.ts(nock SDK)+ agent-browser 实测 |
| 2 | /acquisition-video 工具页跑通(VideoAgent acquisition mode · 13 分镜 + CTA 区高亮 + 转化路径) | 同上模式 |
| 3 | /ai-video 工具页跑通(VideoAgent storyboard mode · 5-8 scenes + imagePromptEn 英文 + ImageGen 异步入栈 + polling 渲染 sceneImage) | tests/e2e/tool-ai-video.spec.ts + tests/integration/api/image-gen-bullmq.test.ts + agent-browser 实测 |
| 4 | /generate 工具页 acquisition mode 跑通(CopywritingAgent acquisition · markdown 200-500 字 + CTA) | tests/e2e/copywriting-acquisition.spec.ts |
| 5 | /history 跑通(读 history 表 + 5 工具新 badge + 跳转预填到对应工具页 · 4 工具页 useEffect 读 ?historyId 预填)| tests/e2e/video-tools-integration.spec.ts + agent-browser 实测 |
| 6 | LLM Judge 套件 30 tests pass(22 既有 + 8 新)· `pnpm test:judge` 退出码 0 | US-014 manifest.json |
| 7 | ImageGen Worker 跑通(BullMQ + Redis · DALL-E 3 真调 dev mode 1 次 + stub mode default · cost_log image_gen 写入)| tests/integration/api/image-gen-bullmq.test.ts + IMAGE_GEN_ENABLED=true dev test 1 次 |
| 8 | lint clean(--max-warnings=0)+ typecheck 0(6 ws)+ vitest 620+ + e2e 138+ | US-014 收官 manifest.json |

---

## §7 Locked Decisions(D-036 ~ D-045 · 跨 PRD 编号延续)

> **跨 PRD 编号延续规则** · D-001~D-035 已用(PRD-1~5)· PRD-6 从 D-036 起 · 不重置。

| 编号 | 决策 | 理由 | 替代选项(为什么不选)|
|:-:|---|---|---|
| **D-036** | VideoAgent 4 mode prompt 模板 inline 在 `_buildUserPrompt(mode)` · 不抽到 `templates/video-{mode}.ts`(只 system persona 段抽到 templates) | 沿用 PRD-5 D-027 · ContextAssembler templates 是 system persona · _buildUserPrompt 是 user prompt 段 · 职责分离 | 抽 4 文件 增加耦合 · prompt 改一处要改 4 文件 |
| **D-037** | 3 新 router(videoProduction / acquisitionVideo / aiVideo)各自独立文件 · 不合并到 video.ts | 沿用 PRD-5 D-026 · 命名清晰 + 0 破坏 + URL path 一对一(/video-production / /acquisition-video / /ai-video) | 合并 video.ts 含 3 procedure · 命名混淆 + URL 跟 router file 不一致 |
| **D-038** | ★ ImageGen 不走 LLMGateway · 单独 ImageGenWorker · 因为不是 text completion · 不算 LD-012 范围 | LD-012 锁定的是 LLM(text generation)· image diffusion 是不同 modality · LLMGateway 不该膨胀加 generateImage method · 单独 Worker 职责清晰 | 扩 LLMGateway 加 generateImage(违反 SRP)· 或 BrandingAgent 直调 OpenAI(违反 R-001 不暴露 key)|
| **D-039** | ImageGen 用 BullMQ 异步队列(★ A10 用户决策完整版)· 不是同步 await | A10 完整版 · UX 好 · 用户立刻返回 jobId · 后台跑 · 5-8 镜头 × 10s = 50-80s 同步 UX 差 · 异步 50-80s 但用户可关闭页面 | 同步 await · UX 差(80s 卡住)· dev 简化但 prod 不接受 |
| **D-040** | cost_log eventType 第 3 类 = 'image_gen'(D-034 第 2 类是 'judge_call' · 第 1 类是 'specialist_call')| 区分 admin 域 ④ 数据准确 · LLM 调用 vs 测试调用 vs image 调用 3 类独立 stats | 全合并 'specialist_call' · admin 看不出 cost 分布 |
| **D-041** | DALL-E 3 only(★ A9 用户决策简化版)· 不做文心一格 / 国内 API | A9 简化 · 国内 API key 申请审批 1-2 天 · 留 PRR · 现 OpenAI API key 已有可用 | 文心一格 · 申请审批延后 PRD-6 启动 · 不可接受 |
| **D-042** | DALL-E 3 quality='standard' · 不用 HD($0.08/张)| HD 2x cost · 标准够用 · 留 PRR 升级 · cost 控制 | HD · cost 翻倍 |
| **D-043** | scene 数 5-8 范围 · 不允许 1-4 或 9+ | 5-8 是常规短视频镜头数 · 5 是 min(故事完整)· 8 是 max(cost $0.32 上限可接受)· 9+ cost 失控 | 不限 · cost 失控风险 |
| **D-044** | rate limit 用 UTC 计算 day rollover(★ A11 完整版)· 不用本地时区 | UTC 简单一致 · 跨时区用户也是同 day · Redis sliding window 用 UTC date 做 key | 本地时区 · 复杂 + 测试难 |
| **D-045** | rate limit max 10 storyboard / user / day(★ A11 完整版)· env IMAGE_GEN_DAILY_LIMIT_PER_USER 可调 | A11 完整 · 1 user 最多 $0.32 × 10 = $3.2/day · 100 user max $320/月 · cost 可控 | 不限 · 月底账单失控 · 30+ user 1 day 烧光 |

### §7.1 继承前序 LD(不重复 · 仅引用)

- **继承 D-005**(BaseSpecialist 抽象 + 五层配置)· VideoAgent 4 mode 严格沿用
- **继承 D-007**(ContextAssembler 唯一 prompt 入口)· 3 新模板沿用
- **继承 D-009**(IpAccount 多账号隔离 3 道闸)· 4 router 全 protectedProcedure + explicit accountId(LD-009 双层防护 · TD-019 教训)
- **继承 D-013**(zod schema + trace_id + 无 any 兜底)· 5 新 schema 严格
- **继承 D-016**(测试金字塔 + LLM Judge + Prompt 回归)· vitest 620+ / judge 30 / e2e 138
- **继承 D-018**(Specialist 不直调 LLM SDK · REJ-001)· VideoAgent + CopywritingAgent 通过 LLMGateway
- **继承 D-019**(cost_log.modelUsed 反映 LLMGateway 真选 model · stream meta chunk)· VideoAgent SSE 继承
- **继承 D-020**(ContextAssembler 4 路并行 + 5s timeout + 降级跑空)· 3 新模板继承
- **继承 D-023**(cost_log 完整字段 · prompt_tokens/completion_tokens/duration/model/agent_id/trace_id/account_id + target jsonb)· 4 router 调 BaseSpecialist 自动写
- **继承 D-024**(feedback_log 复用 cost_log + eventType 字段区分)· image_gen 第 3 类
- **继承 D-026**(procedure 命名规则 · 不破坏现有)· acquisitionGenerate / videoProduction.generate / etc
- **继承 D-028**(多 mode Specialist `_mode + outputSchema getter`)· VideoAgent 4 mode + Copywriting 4 mode
- **继承 D-031**(LS namespace `acc_{id}_tool_{tool}_{suffix}`)· 3 新工具页继承
- **继承 D-032**(boom 5 篇候选写 history 1 行)· storyboard 5-8 scenes 写 history 1 行(scenes JSON 字段)
- **继承 D-035**(acquisition mode throw 'PRD-6')· 本期 US-002 + US-012 落地

---

## §8 反例库自动注入(ralph skill 转 prd.json 时关键词命中)

> **机制** · ~/.claude/scripts/ralph/ralph.py + ralph-tools.py reject 自动入库 · prd skill 转 prd.json 时按关键词检索 · 注入到 anti_patterns 字段

### §8.1 关键词命中清单(PRD-6 US 全继承 17+ 反例 + 新增 video / image / queue)

| 关键词 | 命中 reject 反例(数) |
|---|:-:|
| `specialist` | REJ-001(SDK 直调)+ REJ-002(while 循环)+ REJ-003(model 硬编码 D-019)+ REJ-004(单实例 export)+ REJ-007(多 mode outputSchema getter)+ REJ-005(Specialist 不自己拼 prompt)+ REJ-006(Specialist 必设 timeout)= 7 |
| `llm` / `gateway` / `complete` / `stream` | REJ-001(SDK)+ REJ-003(model)+ REJ-006(timeout)+ REJ-033(zod 校验失败 retry · 不 throw)+ REJ-017(cost_log 必带 traceId)= 5 |
| `video` / `acquisition` / `production` / `storyboard` | REJ-007(多 mode schema)+ REJ-005(prompt 装配)+ REJ-013(protectedProcedure)= 3 |
| `image` / `dall-e` / `openai` | REJ-001(SDK · ★ 但 D-038 ImageGen 不走 LLMGateway · 例外!)+ REJ-017(cost_log 必带 traceId)= 2 |
| `queue` / `bullmq` / `worker` / `redis` | REJ-009(executeRaw 仅 middleware)+ REJ-008(prisma 必带 accountId)= 2 |
| `rate-limit` / `throttle` | REJ-008(accountId)+ REJ-013(protectedProcedure)= 2 |
| `history` / `cost_log` | REJ-008(prisma 必带 accountId)+ REJ-009(executeRaw 仅 middleware)+ REJ-013(protectedProcedure)+ REJ-017(traceId)= 4 |
| `tool` / `form` | REJ-010(LS namespace)+ REJ-035(LS-first DB 失败不回滚)= 2 |
| `prisma` / `schema` / `migration` | REJ-008 + REJ-009 + REJ-013 = 3 |

### §8.2 anti_patterns 注入示例(US-007 内会自动注入)

```json
{
  "id": "US-007",
  "anti_patterns": [
    { "source_prd": "QuanQn-base", "source_story": "REJ-013 (protectedProcedure)", "lesson": "tRPC procedure 不经 accountIsolation middleware", "antipattern": "❌ aiVideo router 用 publicProcedure · 不验证用户实际所属", "correct": "✅ 必用 protectedProcedure · accountIsolationMiddleware 自动 set_config + RLS · LD-009 双层防护 explicit accountId(TD-019 PRD-5 教训)" },
    { "source_prd": "QuanQn-PRD-5", "source_story": "TD-019 (knowledge.ts 修)", "lesson": "RLS-only 单层防护 不算双层", "antipattern": "❌ where: { historyId } 不带 accountId · 只靠 RLS auto filter", "correct": "✅ where: { accountId: activeAccountId!, historyId } · explicit + RLS 双层" },
    { "source_prd": "QuanQn-base", "source_story": "REJ-009 (executeRaw 仅 middleware)", "lesson": "Worker 直调 prisma.$queryRaw / executeRaw 跳过 RLS", "antipattern": "❌ ImageGen Worker 用 prisma.$queryRaw('UPDATE history...')", "correct": "✅ Worker 用 prisma.history.update + Worker context set_config(via Worker level RLS · 留 R-12 manual review)" }
  ]
}
```

---

## §9 修订记录

- **2026-05-09 v0.1** · 初稿(prd skill 写完整版 · 1500+ 行 · 不简化 · 跟 PRD-5 同详细度)· Opus 主对话 · Assumptions 模式 · 用户已 review 19 条 assumptions(A9 简化 + A10/A11 完整版)
- 章节统计 · §0(60 行) · §1(620 行 · 14 stories)· §1.5(180 行)· §2(380 行 · 14 AC × 4 类)· §3(15 行)· §4(20 行)· §5(70 行)· §6(15 行)· §7(75 行)· §8(40 行)· §9(本节 5 行)= 总 ~1480 行

---

> **本文件由 prd skill 在 Assumptions 模式经用户确认后写出 · 完整版 · 不简化 · 等 ralph skill 转 prd.json + /plan-check 7 项门禁 + SOP §9.1 5 步启 daemon。**
> **★ ralph daemon 启动建议** · 14 stories 分 2 batch(US-001~007 + US-008~014)· 每 batch 后重启 daemon(防 claude CLI hang · PRD-5 RCA-003 教训)。
