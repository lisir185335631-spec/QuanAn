# PRD-8 · P7 智能模块(3 L5 自治 Agent + 5 层记忆 + 反馈飞轮闭环)

> **版本** · v0.1(2026-05-11 · prd skill Questions 模式 · Opus 主对话)
> **PRD** · PRD-8 · 13-14 stories · 计划 2w(10-14 days daemon active)· risk=high(L5 自治 + 并发 + 跨 user state)
> **依赖** · PRD-4(7 Specialist 真接 LLMGateway · ✓)+ PRD-7(D-046~049 SoT 三处一致 · ✓)
> **战略地位** · ARCHITECTURE §9.9 P7 智能工具 · `PRD-1 → PRD-2 → PRD-4 → PRD-5/6/7/8 → PRD-9` 关键路径 · 进化飞轮闭环的最后一站
> **预估** · 一轮通过率 75-85%(if 遵循 retro §6 Playbook P-1~P-7)· reject 2-4 · 总耗时 10-14 days

---

## §0 引用清单(必读 · 实施前 5 min 全部过一遍)

### §0.1 上游 PRD 决策继承

- **D-001 ~ D-049**(PRD-1~7 累计)· 全部继承 · 不重复
- 关键继承:
  - **D-001** LD-001 95/5 编排范式(本期 3 L5 是 5% Agent 范畴 · 严禁内 while/for 循环)
  - **D-004** LD-004 + ADR-005 · 3 L5 走外部 orchestrator(BullMQ + node-cron + tRPC subscription)
  - **D-005** BaseSpecialist 抽象(本期 3 L5 仍**部分继承** BaseSpecialist · 但 execute() 内允许多次 LLM 调用)
  - **D-006** 五层记忆(本期实施 L1 Buffer + 接通 L4 Profile + 准备 L5 Trending Cache placeholder)
  - **D-007** ContextAssembler 唯一 prompt 注入入口(本期接通 EvolutionInsight 注入 · 全 11 生成型 Specialist)
  - **D-008** 反馈飞轮 5 阶段闭环(本期 Phase 4 跑批 + Phase 5 注入)
  - **D-009** RLS + LD-009 双层防护(本期所有 router 沿用)
  - **D-012** LLMGateway 唯一 LLM 调用入口(STT/TTS 是 image-gen 类例外 · 不走 LLMGateway · 同 D-038 模式)
  - **D-026** 不动既有 procedure · 新建变体(EvolutionAgent + ContextAssembler 改 systemPrompt 是扩展非破坏)
  - **D-028** 多 mode Specialist `_mode + outputSchema getter`(EvolutionAgent triggerType 是 enum · 不分 mode · 不适用)
  - **D-038** ImageGen Worker 独立 · 不走 LLMGateway(本期 STT/TTS Worker 同模式)
  - **D-040** cost_log eventType 3 类(本期加 'l5_agent' / 'stt_call' / 'tts_call' 第 4-6 类)
  - **D-046** Schema SoT 三处一致原则(本期严格遵循 · 详 §1.0 SoT 表)
  - **D-047** canonical 选择优先级 specialists > routers > packages/schemas
  - **D-049** 路径 B 自动触发(本期已部署 · 不需再实施)

### §0.2 ARCHITECTURE.md 引用

- §1.7 9 条偏离决策(本期实施第 5 条 进化机制自动注入 vs 手动)
- §4.4 3 L5 自治 Agent 特殊性(完整定义)
- §5 五层记忆体系 + 进化飞轮(完整理论)
- §6.12-14 VoiceChat / Evolution / DailyTask Specialist 定义
- §9.9 P7 智能工具 实施计划(10-12 stories 估)

### §0.3 PROMPTS.md 引用

- §12 VoiceChatAgent 完整 prompt + 5 工具 function calling 定义
- §13 EvolutionAgent 完整 prompt + 提炼规则(Rule 1-5 · 频次门槛 / 溯源 / 渐进更新 / 冲突检测 / 数量上限)
- §14 DailyTaskAgent 完整 prompt + 7 任务类型 + 冷启动模板

### §0.4 DATA-MODEL.md 引用

- §3 主应用 18 表(FeedbackLog / EvolutionProfile / EvolutionInsight / DeepLearningArchive / DailyTask 全已 prisma 实施 · PRD-2 落地)
- §3.4.5 cost_log 表(本期 eventType 新增 'l5_agent' / 'stt_call' / 'tts_call' 3 类 · 第 4-6)
- §6.3-4 EvolutionProfile + EvolutionInsight 完整字段

### §0.5 AGENTS.md 引用

- §1.4 1.0 不做(本期严守:不真实视频生成 / 无多人协作 / 无原生 App / 无第三方一键发布)
- §3 LD-001(95/5 · 本期不允许 L5 内循环)
- §3 LD-004(3 L5 走 ADR-018 外部 orchestrator)
- §3 LD-006(5 层记忆架构)
- §3 LD-007(ContextAssembler 唯一入口)
- §3 LD-008(反馈飞轮 5 阶段)
- §3 LD-016(测试金字塔 · 本期 vitest 750+ / judge 50+ / e2e 145+)
- §3 R-001(LLM key 不暴露前端 · 含 OpenAI Whisper/TTS key)
- §3 R-12(原子事务 · EvolutionAgent level 升级 + insight 写入同 transaction)

### §0.6 ADR.md 引用

- **ADR-005**(3 L5 自治 Agent · 外部 Orchestrator)· 完整决策
- **ADR-006**(五层记忆架构)
- **ADR-008**(反馈飞轮 5 阶段闭环)
- **ADR-018**(行业合规 · 不影响本期)

### §0.7 PRD-7 retro Playbook P-1~P-7(已内化 · 本期严格遵循)

- **P-1 沿用 anti_patterns 注入机制**(★ 跨 PRD 复利)· prd skill 转 prd.json 时按关键词检索 · 注入 PRD-7 R1 教训(type alias re-export 必写)
- **P-2 启 daemon 前必跑 health check**(perl alarm 25s)
- **P-3 Foundation 档严审 SoT**(沿用 D-046)· 写 L5 Agent persona / state schema 时三处一致
- **P-4 3 L5 Agent 必走 ADR-018 外部 orchestrator** · 严禁 LLM 内部 while/for 循环
- **P-5 必跑 /plan-check 7 项门禁** · 含跨 story 协议锁(L5 Agent 共享 EvolutionProfile / VoiceChat session)
- **P-6 reject feedback 必 < 3K 字符**
- **P-7 Monitor + watch-audit-gate 双联动**

### §0.8 PRD-7 反例库回灌(自动注入 anti_patterns)

`~/.claude/playbooks/reject-examples.jsonl` 已含:
- PRD-6 US-002 schema 字段不一致(关键词 schema/storyboard/字段/boundary/regex)
- PRD-6 US-004 header→key 错位(关键词 header/key/错位/13 列/固定列名)
- **(隐式)PRD-7 US-001 R1 type alias chain**(若未自动入库 · 通过 PRD-8 §1.0 SoT 表强制 explicit 防再现)

### §0.9 本 PRD 暂不做(详 §3 范围排除)

- ❌ EvolutionAgent 触发器仅"累计反馈阈值"(per 用户决策)· 不实施 ① 用户主动 ② 周 Cron ③ deepLearn 新样本触发 · 留 PRD-9 评估
- ❌ DailyTaskAgent 仅 /daily-tasks 页面(per 用户决策)· 不实施站内通知 / email 推送
- ❌ STT/TTS 国内备份 provider(阿里云)· 留 PRR 国内合规
- ❌ DeepLearnAgent 自动学习(本期 DeepLearningArchive 表已 PRD-2 落地 · 仅作为 EvolutionAgent 输入 · 不实施自动学习触发器)
- ❌ admin 任何代码(留 PRD-10~14)
- ❌ Trending Cache L5 真实施(本期 placeholder · 留 PRD-9 真接 trending API)

---

## §1.0 ★★★ Schema 字段 SoT 表(US-001 + US-002 共用 · TD-022 治本继承)

> **背景** · 沿用 PRD-7 §1.0 SoT 模式(D-046 三处一致原则)· 本期 4 个核心 schema(EvolutionInsight content / DailyTask tasks / VoiceChatTurn / L1 Buffer entry)严格锁定。
>
> **canonical 选择优先级**(D-047)· specialists inline > routers inline > packages/schemas

### §1.0.1 EvolutionInsight.content schema(US-001 + US-003 共用)

**canonical**: `apps/api/src/specialists/EvolutionAgent.ts` `EvolutionInsightContentSchema`(对齐 PROMPTS §13.2 输出)

```typescript
const InsightsSchema = z.object({
  preferredCatchphrases: z.array(z.string()).min(0).max(10),
  styleTone: z.string().min(1),
  avoidList: z.array(z.string()).min(0).max(10),
  strongPoints: z.array(z.string()).min(0).max(5),
  weakPoints: z.array(z.string()).min(0).max(5),
});

const EvolutionInsightContentSchema = z.object({
  direction: z.enum(['综合', '创意', '转化', '真实']),
  insights: InsightsSchema,
});

// triggerType union(本期仅累计反馈阈值 · per 用户决策)
const TriggerTypeSchema = z.union([
  z.literal('threshold:5'),
  z.literal('threshold:20'),
  z.literal('threshold:50'),
  z.literal('threshold:100'),
]);
```

**三处** ·
- `packages/schemas/src/specialist-io/evolution.schema.ts` 新建 · 1:1 与 canonical
- `apps/api/src/specialists/EvolutionAgent.ts` inline · canonical 源头
- `apps/api/src/trpc/routers/evolution.ts` import packages/schemas(不 inline)

### §1.0.2 DailyTask.tasks JSON schema(US-001 + US-007 共用)

**canonical**: `apps/api/src/specialists/DailyTaskAgent.ts` `DailyTaskOutputSchema`(对齐 PROMPTS §14.2 输出)

```typescript
const TaskTypeEnum = z.enum([
  'do_step',          // 完成 9 步主线某一步
  'optimize_content', // 优化既有 history
  'learn_methodology',// 学习方法论(知识库)
  'review_diagnosis', // 复盘诊断报告
  'upload_sample',    // 上传深度学习样本
  'set_goal',         // 设置 monthly goal
  'engage_community', // 互动评论(冷启动用)
]);

const TaskItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(500),
  type: TaskTypeEnum,
  ctaUrl: z.string().regex(/^\//, 'ctaUrl 必须以 / 开头 · 站内跳转'),
  ctaText: z.string().min(2).max(20),
  expectedOutcome: z.string().min(10).max(200),
  estimatedMinutes: z.number().int().min(1).max(120),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  completed: z.boolean().default(false),
});

const DailyTaskOutputSchema = z.object({
  tasks: z.array(TaskItemSchema).min(3).max(5),
});
```

### §1.0.3 VoiceChatTurn schema(US-001 + US-011 共用 · L1 Buffer 存)

**canonical**: `apps/api/src/specialists/VoiceChatAgent.ts` `VoiceChatTurnSchema`

```typescript
const VoiceChatRoleEnum = z.enum(['user', 'assistant', 'tool']);

const VoiceChatTurnSchema = z.object({
  turnId: z.string().uuid(),
  role: VoiceChatRoleEnum,
  content: z.string(),
  toolCalls: z.array(z.object({
    name: z.enum(['get_current_step', 'search_history', 'query_diagnosis', 'get_today_tasks', 'get_evolution_insights']),
    args: z.record(z.unknown()),
    result: z.string().optional(),
  })).optional(),
  audioUrl: z.string().url().optional(), // TTS 输出的临时 URL(15 min TTL)
  timestamp: z.number().int().positive(), // unix ms
});

// L1 Buffer 存储格式(Redis voice_chat:acc_{id}:turns List · max 20 turns · TTL 30min)
const VoiceChatBufferSchema = z.object({
  accountId: z.number().int().positive(),
  turns: z.array(VoiceChatTurnSchema).max(20),
  sessionId: z.string().uuid(),
  createdAt: z.number().int().positive(),
});
```

### §1.0.4 5 工具 function calling schema(US-002 + US-011 共用)

**canonical**: `apps/api/src/specialists/VoiceChatAgent.ts` `VOICE_CHAT_TOOLS`

```typescript
const VOICE_CHAT_TOOLS = [
  {
    name: 'get_current_step' as const,
    description: '查询当前 IP 账号 9 步主线的完成进度',
    parameters: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'search_history' as const,
    description: '在用户的历史生成内容中搜索 · 按关键词模糊匹配',
    parameters: {
      type: 'object' as const,
      properties: {
        keyword: { type: 'string', description: '搜索关键词' },
        limit: { type: 'number', default: 5 },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'query_diagnosis' as const,
    description: '查最新诊断报告(8 维度短板)',
    parameters: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_today_tasks' as const,
    description: '查今日 3-5 个推荐任务',
    parameters: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_evolution_insights' as const,
    description: '查当前 EvolutionProfile + 最新 insight',
    parameters: { type: 'object' as const, properties: {}, required: [] },
  },
];
```

### §1.0.5 SoT 一致性验证规则(US-001 + US-002 验收硬要求)

```bash
# 验 1: packages/schemas vs specialists inline 字段一致
diff <(grep -E "z\.(string|number|enum|array|object|union|literal)\(" packages/schemas/src/specialist-io/evolution.schema.ts) \
     <(grep -A 30 "EvolutionInsightContentSchema" apps/api/src/specialists/EvolutionAgent.ts)
# 期望: 字段类型序列完全一致

# 验 2: router inline 不再独立定义 output schema
grep -E "z\.object\(\{.*insights" apps/api/src/trpc/routers/evolution.ts
# 期望: 0 命中(import packages/schemas)

# 验 3: 5 工具 name 跨 3 处一致(VoiceChatAgent.ts + types + router)
grep -E "get_current_step|search_history|query_diagnosis|get_today_tasks|get_evolution_insights" apps/api/src/specialists/VoiceChatAgent.ts
# 期望: 每个 name 至少 3 次命中(define + dispatch + types)

# 验 4: DailyTask 7 task type 一致
grep -c "do_step\|optimize_content\|learn_methodology\|review_diagnosis\|upload_sample\|set_goal\|engage_community" apps/api/src/specialists/DailyTaskAgent.ts
# 期望: ≥ 7 命中

# 验 5: type alias chain(PRD-7 R1 教训)
grep "export type.*=.*Imported\|export type.*from '@quanan/schemas'" apps/api/src/specialists/EvolutionAgent.ts apps/api/src/specialists/DailyTaskAgent.ts apps/api/src/specialists/VoiceChatAgent.ts
# 期望: 每个文件至少 1 个 re-export · 保证下游 import 不破
```

---

## §1 用户故事(US-001 ~ US-014)

### **US-001 · ★★ Foundation · 5 层记忆 schema + types + ContextAssembler 协议升级**

> **risk_level** · `foundation`(downstream 13 stories · 全 PRD-8 后续基于此 schema)
> **priority** · 1
> **depends_on** · []

**描述** · PRD-8 全部后续 stories 的数据契约前置 · 5 项:

1. **5 层记忆 schema 实施**(L1/L2/L3/L4/L5):
   - L1 Buffer: `apps/api/src/memory/l1-buffer.ts` 真接 Redis(key pattern `voice_chat:acc_{id}:turns` · List 类型 · max 20 · TTL 30min)+ VoiceChatBufferSchema(详 §1.0.3)
   - L2 Core: 接 stepData(既有 · 不动 · 仅暴露 read interface)
   - L3 Recall: 接 History 表(既有 · 不动)
   - L4 Profile: 接 EvolutionProfile + DeepLearningArchive(既有 · 增 read helpers)
   - L5 Trending Cache: placeholder(Redis key pattern `trending:hot:7d` · 留 PRD-9 真接 trending API · 本期接口先定)

2. **EvolutionInsight content schema 锁定**(§1.0.1):
   - `packages/schemas/src/specialist-io/evolution.schema.ts` 新建 · 含 `EvolutionInsightContentSchema` + `TriggerTypeSchema`
   - `apps/api/src/specialists/EvolutionAgent.ts` inline canonical(本 story 仅写 schema · execute 留 US-003)
   - 严格遵循 D-046 三处一致

3. **DailyTask tasks JSON schema 锁定**(§1.0.2):
   - `packages/schemas/src/specialist-io/dailyTask.schema.ts` 新建
   - 7 TaskType enum + TaskItemSchema(uuid/title/description/type/ctaUrl/ctaText/expectedOutcome/estimatedMinutes/difficulty/completed)

4. **VoiceChatTurn schema 锁定**(§1.0.3 + §1.0.4):
   - `packages/schemas/src/specialist-io/voiceChat.schema.ts` 新建 · 含 VoiceChatTurnSchema + VoiceChatBufferSchema + VOICE_CHAT_TOOLS

5. **ContextAssembler 协议升级**:
   - `apps/api/src/services/context-assembler/types.ts` AssembledContext 加 `evolutionInsight?: EvolutionInsightContent | null` 字段(可空 · 用户首次无 insight)
   - `apps/api/src/services/context-assembler/ContextAssembler.ts` assemble() 内并行 fetch 加第 5 路(L4 EvolutionInsight latest · 5s timeout · 失败 fallback null)
   - 注:本 story 仅升级**协议** · 不动 11 Specialist 的 systemPrompt 注入(留 US-004)

**Acceptance Criteria** ·
- [ ] AC-1: `packages/schemas/src/specialist-io/evolution.schema.ts` 新建 · 含 EvolutionInsightContentSchema + InsightsSchema + TriggerTypeSchema · 跟 §1.0.1 100% 一致
- [ ] AC-2: `packages/schemas/src/specialist-io/dailyTask.schema.ts` 新建 · 含 DailyTaskOutputSchema + TaskItemSchema + TaskTypeEnum · 跟 §1.0.2 100% 一致
- [ ] AC-3: `packages/schemas/src/specialist-io/voiceChat.schema.ts` 新建 · 含 VoiceChatTurnSchema + VoiceChatBufferSchema + VOICE_CHAT_TOOLS · 跟 §1.0.3-4 100% 一致
- [ ] AC-4: `apps/api/src/memory/l1-buffer.ts` 真接 Redis · `pushTurn(accountId, turn)` / `getTurns(accountId, limit?)` / `clearBuffer(accountId)` 3 API + Redis key prefix `voice_chat:acc_${id}:turns` + max 20 + TTL 1800s
- [ ] AC-5: `apps/api/src/memory/l4-profile.ts` 加 helpers · `getLatestInsight(accountId): Promise<EvolutionInsightContent | null>` + `getDeepLearningSamples(accountId, limit=10)` (复用 existing prisma queries · 不重复定义)
- [ ] AC-6: `apps/api/src/memory/l5-trending.ts` placeholder · interface 定 `getHotTrending(category?: string, limit=20): Promise<TrendingItem[]>` · 实施返空数组 + TODO 注释 'PRD-9 真接 trending API'
- [ ] AC-7: `apps/api/src/services/context-assembler/types.ts` AssembledContext 加 `evolutionInsight?: EvolutionInsightContent | null` 字段
- [ ] AC-8: `apps/api/src/services/context-assembler/ContextAssembler.ts` assemble() 加第 5 路并行 fetch L4 latest insight · Promise.allSettled · 5s timeout · 失败 evolutionInsight=null
- [ ] AC-9: `packages/schemas/src/specialist-io/index.ts` barrel 加 3 新 export · grep `from './evolution.schema'` + `from './dailyTask.schema'` + `from './voiceChat.schema'` 命中 3
- [ ] AC-10: type alias re-export(PRD-7 R1 教训)· EvolutionAgent.ts / DailyTaskAgent.ts / VoiceChatAgent.ts(US-002 创建)预留 `export type { ... } from '@quanan/schemas/specialist-io'`
- [ ] AC-11: SoT 验 §1.0.5 验证 1-2-5 全过(其他 3-4 在 US-002/011 跑)
- [ ] AC-12: vitest unit · L1 Buffer 5 tests(push/get/clear/maxLimit/TTL)+ schema validation 8 tests(3 schemas × happy + reject)
- [ ] AC-13: pnpm typecheck 6 ws 0 error · pnpm lint --max-warnings=0 全过
- [ ] AC-14: pnpm test 既有 727 + 新 13 = 740 全过(零回归)

**files_to_create** ·
- `packages/schemas/src/specialist-io/evolution.schema.ts`(~60 行)
- `packages/schemas/src/specialist-io/dailyTask.schema.ts`(~50 行)
- `packages/schemas/src/specialist-io/voiceChat.schema.ts`(~60 行)
- `apps/api/src/memory/l1-buffer.ts`(~80 行 · Redis ioredis client + 3 API)
- `apps/api/src/memory/l4-profile.ts`(~50 行 · 2 helpers)
- `apps/api/src/memory/l5-trending.ts`(~30 行 · placeholder)
- `apps/api/src/memory/index.ts`(~10 行 · barrel)
- `tests/unit/api/memory/l1-buffer.test.ts`(~80 行 · 5 tests)
- `tests/unit/api/schemas/l5-agent-schemas.test.ts`(~80 行 · 8 tests)

**files_to_modify** ·
- `packages/schemas/src/specialist-io/index.ts`(加 3 barrel export)
- `apps/api/src/services/context-assembler/types.ts`(AssembledContext 加 evolutionInsight)
- `apps/api/src/services/context-assembler/ContextAssembler.ts`(assemble 加第 5 路)

**test_command** · `pnpm typecheck && pnpm test && pnpm lint --max-warnings=0`

**anti_patterns** · PRD-6 US-002 schema 字段不一致(防 EvolutionInsight 字段漂移)+ PRD-7 US-001 R1 type alias re-export 漏写

---

### **US-002 · ★★ Foundation · 3 L5 Specialist 骨架 + ADR-018 外部 orchestrator 协议**

> **risk_level** · `foundation`(downstream 10 stories · L5 Agent 实施全基于此骨架)
> **priority** · 2
> **depends_on** · [US-001]

**描述** · 3 L5 Specialist 骨架 + 触发器协议铺路:

1. **3 L5 Specialist 骨架**(stub · execute 留对应 story):
   - `apps/api/src/specialists/EvolutionAgent.ts` 新建 · 继承 BaseSpecialist · execute() 本 story 仅占位 throw `'PRD-8 US-003 真接'` · outputSchema = EvolutionInsightContentSchema · model_tier='reasoning' · timeout_ms=60000
   - `apps/api/src/specialists/DailyTaskAgent.ts` 新建 · 继承 BaseSpecialist · execute() 留 US-007 · outputSchema = DailyTaskOutputSchema · model_tier='lightweight' · timeout_ms=30000
   - `apps/api/src/specialists/VoiceChatAgent.ts` 新建 · 继承 BaseSpecialist · execute() 留 US-011 · outputSchema = z.never()(因 streaming · 不走 safeParse · 用 SSE 流式)· model_tier='reasoning' · tools=['llm.stream', 'llm.tools']

2. **BullMQ 队列定义**:
   - `apps/api/src/workers/evolution/queue.ts` 新建 · `evolutionQueue = new Queue('evolution-agent', { connection: redis })` · BullMQ Worker 实施留 US-003
   - `apps/api/src/workers/daily-task/queue.ts` 新建 · 同上 · queue name 'daily-task-agent' · Worker 留 US-007

3. **5 工具 function calling 定义**:
   - `apps/api/src/specialists/VoiceChatAgent.ts` 顶部 export `VOICE_CHAT_TOOLS`(per §1.0.4)· 5 工具 schema 完整
   - Tool dispatcher 留 US-011

4. **node-cron 调度骨架**:
   - `apps/api/src/cron/daily-task-runner.ts` 新建 · `cron.schedule('0 0 * * *', ...)` · 主体 stub `console.log('TODO US-007')` · 真接留 US-007
   - 注:本 story 不启 cron(避免 stub 跑)· 仅定义文件 + import 注册留 US-007

5. **ContextAssembler 路由更新**:
   - `apps/api/src/services/context-assembler/templates/index.ts` 加 3 新 entry · evolutionAgent / dailyTaskAgent / voiceChatAgent
   - 3 templates 文件(`evolution-agent.ts` / `daily-task-agent.ts` / `voice-chat-agent.ts`)各 ~50 行 · 含 §0.3 PROMPTS prompt persona + 基础占位

**Acceptance Criteria** ·
- [ ] AC-1: EvolutionAgent.ts 继承 BaseSpecialist · agentId='EvolutionAgent' · outputSchema getter = EvolutionInsightContentSchema · model_tier='reasoning' · timeout_ms=60000 · execute() throw 'PRD-8 US-003 真接'
- [ ] AC-2: DailyTaskAgent.ts 继承 BaseSpecialist · agentId='DailyTaskAgent' · outputSchema = DailyTaskOutputSchema · model_tier='lightweight' · timeout_ms=30000 · execute() throw 'PRD-8 US-007 真接'
- [ ] AC-3: VoiceChatAgent.ts 继承 BaseSpecialist · agentId='VoiceChatAgent' · model_tier='reasoning' · tools=['llm.stream', 'llm.tools'] · execute() throw 'PRD-8 US-011 真接' · 顶部 export VOICE_CHAT_TOOLS(per §1.0.4 5 工具)
- [ ] AC-4: workers/evolution/queue.ts + workers/daily-task/queue.ts 新建 · BullMQ Queue + Redis connection · 不启 Worker
- [ ] AC-5: cron/daily-task-runner.ts 新建 · cron.schedule('0 0 * * *', ...) 定义但**不**调 cron.start()(避免 stub 跑)· 留 US-007 启动
- [ ] AC-6: 3 ContextAssembler templates 新建(evolution-agent / daily-task-agent / voice-chat-agent)· 各 ~50 行 prompt persona(参 PROMPTS §12.1/§13.1/§14.1)
- [ ] AC-7: services/context-assembler/templates/index.ts SPECIALIST_TEMPLATES 加 3 entries
- [ ] AC-8: type alias re-export(PRD-7 R1)· 每 Agent .ts 文件首部 `export type { ... } from '@quanan/schemas/specialist-io'` re-export 对应 types
- [ ] AC-9: SoT 验 §1.0.5 验证 3(5 工具 name 跨 3 处一致)+ 验证 4(7 task type)全过
- [ ] AC-10: unit test · 3 Specialist 骨架 happy path stub call should throw(各 1 test)+ schema getter 校验(各 1 test)= 6 tests
- [ ] AC-11: pnpm typecheck 0 error · pnpm lint --max-warnings=0 全过
- [ ] AC-12: pnpm test vitest 740 + 6 = 746 全过

**files_to_create** ·
- `apps/api/src/specialists/EvolutionAgent.ts`(~120 行 · 骨架 + persona + outputSchema + throw stub)
- `apps/api/src/specialists/DailyTaskAgent.ts`(~100 行)
- `apps/api/src/specialists/VoiceChatAgent.ts`(~150 行 · 含 VOICE_CHAT_TOOLS)
- `apps/api/src/workers/evolution/queue.ts`(~40 行)
- `apps/api/src/workers/evolution/index.ts`(~20 行 barrel)
- `apps/api/src/workers/daily-task/queue.ts`(~40 行)
- `apps/api/src/workers/daily-task/index.ts`(~20 行 barrel)
- `apps/api/src/cron/daily-task-runner.ts`(~40 行 stub)
- `apps/api/src/cron/index.ts`(~20 行 barrel + 注册)
- `apps/api/src/services/context-assembler/templates/evolution-agent.ts`(~60 行)
- `apps/api/src/services/context-assembler/templates/daily-task-agent.ts`(~60 行)
- `apps/api/src/services/context-assembler/templates/voice-chat-agent.ts`(~60 行)
- `tests/unit/specialists/EvolutionAgent.test.ts`(~40 行 · 2 tests)
- `tests/unit/specialists/DailyTaskAgent.test.ts`(~40 行 · 2 tests)
- `tests/unit/specialists/VoiceChatAgent.test.ts`(~50 行 · 2 tests)

**files_to_modify** ·
- `apps/api/src/services/context-assembler/templates/index.ts`(SPECIALIST_TEMPLATES 加 3 entries)

**test_command** · `pnpm typecheck && pnpm test && pnpm lint --max-warnings=0`

**anti_patterns** · PRD-7 R1 type alias re-export · PRD-6 多 mode Specialist outputSchema getter 模式(适用 VoiceChat tools 切换)

---

### **US-003 · ★ EvolutionAgent 真接 LLM + 累计反馈阈值触发器**

> **risk_level** · `high`(BullMQ async + 原子事务 + 累计计数器并发 race)
> **priority** · 3
> **depends_on** · [US-002]

**描述** · 反馈飞轮"大脑"实施 · 真接 LLM + BullMQ 累计反馈阈值触发:

1. **EvolutionAgent execute() 真接**:
   - 移除 throw 'PRD-8 US-003 真接'
   - invokeLLM 调 LLMGateway.complete(model_tier='reasoning' · responseFormat=EvolutionInsightContentSchema · timeout 60s)
   - input · ContextAssembler 注入 `recentFeedbacks` + `samples` + `previousInsight`(per PROMPTS §13.2)
   - output 严格 safeParse · 失败 fallback isFallback=true(用 previousInsight 降级)
   - 原子事务(R-12)· `prisma.$transaction([profile.update(level, satisfactionRate), insight.create(content)])`
   - 累积式 insight(Rule 3 渐进更新):若 previousInsight 存在 · merge preferredCatchphrases / avoidList 去重 top 10

2. **BullMQ Worker 实施**:
   - `apps/api/src/workers/evolution/worker.ts` 新建 · `new Worker('evolution-agent', async (job) => { ... evolutionAgent.execute(job.data) }, { connection })`
   - job.data 形 `{ accountId, triggerType: 'threshold:5'|...|'threshold:100', traceId }`
   - 并发 1(单 account 串行)· concurrency: 1

3. **累计反馈阈值触发器**:
   - 新建 `apps/api/src/lib/evolution/trigger.ts` · `enqueueIfThresholdMet(accountId: number, traceId?: string)` 函数:
     - `await prisma.evolutionProfile.update({ where: { accountId }, data: { feedbackCountTotal: { increment: 1 } } })`
     - 检查 new count · 若 ∈ {5, 20, 50, 100} → `evolutionQueue.add('evolve', { accountId, triggerType: \`threshold:${count}\`, traceId })`
   - **原子性**:用 prisma `RETURNING` 拿到 update 后的 count(避免 read-then-write race)

4. **feedback router hook**:
   - 修改 `apps/api/src/trpc/routers/feedback.ts`(或 cost-log 中 logFeedback)· 在 feedback.create 后调 `enqueueIfThresholdMet(activeAccountId, traceId)`
   - 不破坏现有 feedback flow · 仅加 hook

**Acceptance Criteria** ·
- [ ] AC-1: EvolutionAgent.ts execute() 移除 throw · 真接 LLMGateway.complete(model_tier='reasoning') · responseFormat=EvolutionInsightContentSchema
- [ ] AC-2: invokeLLM 内 ContextAssembler 注 `recentFeedbacks`(feedback_log latest N=count/5)+ `samples`(DeepLearningArchive limit 10)+ `previousInsight`(L4.getLatestInsight)
- [ ] AC-3: 原子事务(R-12 · LD-008)· `prisma.$transaction([profile.update, insight.create])` 失败回滚 · grep `$transaction` 命中 1+
- [ ] AC-4: 累积式 insight(Rule 3)· previousInsight 存在时 · merge preferredCatchphrases ∪ 本次新 + 去重 + top 10 · avoidList 同样 · unit test 验证
- [ ] AC-5: fallback path · safeParse 失败 → isFallback=true · 用 previousInsight 降级 · 不重新写 insight(避免假数据)
- [ ] AC-6: BullMQ Worker `apps/api/src/workers/evolution/worker.ts` · concurrency: 1 per accountId · failure retry 3 次 + dead-letter(累计 ≥3 触发告警 stub)
- [ ] AC-7: `apps/api/src/lib/evolution/trigger.ts` enqueueIfThresholdMet · 用 prisma update RETURNING count · 严格只在 count ∈ {5,20,50,100} 时 enqueue · 否则 noop
- [ ] AC-8: feedback router(已有 cost-log.logFeedback)hook · feedback.create 后异步调 `enqueueIfThresholdMet(activeAccountId, traceId)` · 不阻塞 mutation
- [ ] AC-9: cost_log 写 'l5_agent' eventType 第 4 类(D-040 扩展)· grep `eventType.*l5_agent` 命中 1+
- [ ] AC-10: 并发 race test · 5 同 account feedback 并发 · 期望仅 1 次 enqueue(prisma update 原子保证)· integration test
- [ ] AC-11: Validator 实测 unit · 8 tests(happy / fallback / 阈值边界 5/19/20/49/50/99/100 / 累积合并)
- [ ] AC-12: pnpm typecheck 0 + lint 0 + test 全过
- [ ] AC-13: LLM Judge 1 case(EvolutionAgent reasoning 质量评分 ≥ 4.0/5)

**files_to_create** ·
- `apps/api/src/workers/evolution/worker.ts`(~120 行)
- `apps/api/src/lib/evolution/trigger.ts`(~60 行)
- `tests/unit/specialists/EvolutionAgent.test.ts`(扩展 · +8 tests · ~150 行)
- `tests/integration/api/evolution-threshold.test.ts`(~100 行 · 并发 race + 真 DB)
- `tests/judge/evolution-agent.judge.ts`(~80 行)

**files_to_modify** ·
- `apps/api/src/specialists/EvolutionAgent.ts`(execute() 真接 ~+150 行)
- `apps/api/src/trpc/routers/costLog.ts`(或 feedback router · logFeedback 加 hook ~+10 行)
- `apps/api/src/services/context-assembler/ContextAssembler.ts`(注入 recentFeedbacks/samples/previousInsight ~+30 行)

**test_command** · `pnpm test tests/unit/specialists/EvolutionAgent.test.ts tests/integration/api/evolution-threshold.test.ts && pnpm typecheck`

**anti_patterns** · PRD-3 网络异常 ECONNRESET(本 story BullMQ failure retry 3 次防误判)+ PRD-7 R1 type alias

---

### **US-004 · ★ ContextAssembler 接通 EvolutionInsight 注入(全 11 生成型 Specialist)**

> **risk_level** · `high`(跨 11 Specialist · 影响所有 generate prompt · prompt 改动 blast radius 大)
> **priority** · 4
> **depends_on** · [US-003]

**描述** · ContextAssembler 把 EvolutionInsight 注入到 11 生成型 Specialist systemPrompt 末尾 · 闭合进化飞轮 Phase 5:

1. **11 Specialist 模板**(PositioningAgent + BrandingAgent + MonetizationAgent + TopicAgent + CopywritingAgent + VideoAgent + LivestreamAgent + PrivateDomainAgent + AnalysisAgent + DiagnosisAgent + DeepLearnAgent)`apps/api/src/services/context-assembler/templates/*.ts` 各加 EvolutionInsight 注入逻辑:
   ```typescript
   // 模板末尾(已有 step / industry 等 context 后)加 ·
   if (evolutionInsight) {
     systemPrompt += `\n\n[Section 4] 用户偏好画像(基于历史反馈)·\n方向: ${evolutionInsight.direction}\n风格: ${evolutionInsight.insights.styleTone}\n`;
     if (preferredCatchphrases.length) systemPrompt += `偏好金句(从过往 👍 提炼) ·\n${preferredCatchphrases.map(p => `- ${p}`).join('\n')}\n`;
     if (avoidList.length) systemPrompt += `避忌表达(从过往 👎 提炼) ·\n${avoidList.map(a => `- ${a}`).join('\n')}\n`;
     if (strongPoints.length) systemPrompt += `认可角度 ·\n${strongPoints.map(s => `- ${s}`).join('\n')}\n`;
     if (weakPoints.length) systemPrompt += `避免角度 ·\n${weakPoints.map(w => `- ${w}`).join('\n')}\n`;
   }
   ```

2. **ContextAssembler.assemble()** 已在 US-001 加第 5 路 fetch latest insight · 本 story 验证注入逻辑生效

3. **注入位置一致性**(D-007 唯一入口):所有 11 Specialist 不允许自己拼接 EvolutionInsight · 必须经 ContextAssembler

**Acceptance Criteria** ·
- [ ] AC-1: 11 templates 各加 EvolutionInsight 注入逻辑(Section 4 · 模板末尾 · evolutionInsight=null 时跳过)
- [ ] AC-2: 注入字段完整 · direction / styleTone / preferredCatchphrases / avoidList / strongPoints / weakPoints 五字段
- [ ] AC-3: 字段为空时跳过对应行(条件渲染 · 不输出空标题)
- [ ] AC-4: grep `evolutionInsight` apps/api/src/specialists/ 应 0 命中(D-007 ContextAssembler 唯一入口)· 防 Specialist 内拼接
- [ ] AC-5: integration test · seed 1 个 account · 有 1 EvolutionInsight + 1 query · 调 PositioningAgent · capture LLMGateway invokeLLM call 的 systemPrompt · expect 含 '[Section 4] 用户偏好画像'
- [ ] AC-6: 11 Specialist × 1 case = 11 integration tests · mock LLMGateway 验证 systemPrompt 含 insight 注入
- [ ] AC-7: 单 negative case · evolutionInsight=null(新用户)· systemPrompt 不含 '[Section 4]' 段 · 不破坏既有 prompt
- [ ] AC-8: 既有 11 Specialist unit test 不破(回归)· vitest 全过
- [ ] AC-9: LLM Judge 2 case · PositioningAgent / CopywritingAgent 有 insight 注入 vs 无注入 · 质量评分 ≥ 4.0/5
- [ ] AC-10: pnpm typecheck 0 + lint 0 + test 全过

**files_to_modify** ·
- `apps/api/src/services/context-assembler/templates/positioning.ts`
- `apps/api/src/services/context-assembler/templates/branding.ts`
- `apps/api/src/services/context-assembler/templates/monetization.ts`
- `apps/api/src/services/context-assembler/templates/topic.ts`
- `apps/api/src/services/context-assembler/templates/copywriting.ts`
- `apps/api/src/services/context-assembler/templates/video.ts`(若已 PRD-6 改名 video-production)
- `apps/api/src/services/context-assembler/templates/livestream.ts`
- `apps/api/src/services/context-assembler/templates/private-domain.ts`(若 created PRD-6)
- `apps/api/src/services/context-assembler/templates/analysis.ts`
- `apps/api/src/services/context-assembler/templates/diagnosis.ts`(若 created)
- `apps/api/src/services/context-assembler/templates/deep-learn.ts`(若 created)
- `tests/integration/api/insight-injection.test.ts`(~200 行 · 11 Specialist × 1 case)
- `tests/judge/insight-injection.judge.ts`(~80 行 · 2 case)

**test_command** · `pnpm test tests/integration/api/insight-injection.test.ts && pnpm typecheck`

**anti_patterns** · PRD-7 R1 type alias chain · PRD-6 跨 Specialist 协议漂移(本 story 11 Specialist 注入逻辑必须 1:1 一致)

---

### **US-005 · evolution router + /evolution 前端页面**

> **risk_level** · `medium`(标准 router + 前端 · 无新基础设施)
> **priority** · 5
> **depends_on** · [US-003]

**描述** · `/evolution` 工具页 · 用户查看进化档案 + 反馈历史 + insight 详情:

1. **evolution router**(`apps/api/src/trpc/routers/evolution.ts`):
   - `getProfile`(query · 返 EvolutionProfile + latest insight)
   - `getInsightHistory`(query · 返最近 10 条 EvolutionInsight)
   - `getFeedbackTrend`(query · 最近 7 天 / 30 天 feedback rate 趋势 · group by day · 满意率)
   - `getModuleRanking`(query · 11 Specialist 按 👍 率排序 · 用 cost_log feedback 聚合)

2. **前端 /evolution 页面**(`apps/web/src/pages/Evolution.tsx`):
   - 顶部 Hero · 当前 level(L1-L5)+ 满意率 + 已聚合反馈数
   - Section 1 · 最新 Insight 卡片(preferredCatchphrases / avoidList / styleTone)
   - Section 2 · 反馈趋势 chart(Recharts line · 7 天)
   - Section 3 · Module ranking table(11 Specialist 按 👍 率)
   - Section 4 · Insight 历史 list(最近 10 条 + 各自 triggerType 标签)

3. **设计一致性** · 沿用 Aurelian Dark · 既有 ToolForm/ToolResult/Card 组件复用

**Acceptance Criteria** ·
- [ ] AC-1: evolution router 4 procedures · protectedProcedure + LD-009 双层防护(activeAccountId)
- [ ] AC-2: getProfile 返 `{ level, feedbackCountGood/Bad/Total, satisfactionRate, currentDirection, latestInsight: EvolutionInsightContent | null, lastEvolvedAt, lastUpgradedAt }`
- [ ] AC-3: getInsightHistory 返 array<EvolutionInsight> · max 10 · order by createdAt desc
- [ ] AC-4: getFeedbackTrend 用 prisma groupBy 按日聚合 feedback_log · 返 `{ date, total, good, satisfactionRate }[]`
- [ ] AC-5: getModuleRanking 用 cost_log + feedback_log join · 按 agentId 分组 · 计算 👍 率 + 调用次数
- [ ] AC-6: 前端 /evolution 页面渲染 4 sections · 用 Recharts line chart 渲染 trend
- [ ] AC-7: 用 agent-browser 打开 http://localhost:5173/evolution(已登录 dev@local.test)· 截图保存 verify-artifacts/US-005/screenshot.png
- [ ] AC-8: 用 agent-browser 实测 · level=L1 + 0 insight 时显示"暂无 insight · 等累计 5 条反馈后自动生成" cold-start UI
- [ ] AC-9: pnpm typecheck 0 + lint 0 + test 全过(unit + integration + e2e)
- [ ] AC-10: LD-009 双层防护 grep · grep `accountId.*activeAccountId` apps/api/src/trpc/routers/evolution.ts 至少 4 处(每 procedure 1)

**files_to_create** ·
- `apps/api/src/trpc/routers/evolution.ts`(~150 行)
- `apps/web/src/pages/Evolution.tsx`(~250 行)
- `apps/web/src/components/charts/FeedbackTrendChart.tsx`(~80 行)
- `tests/unit/api/evolution-router.test.ts`(~100 行)
- `tests/e2e/evolution.spec.ts`(~80 行)

**files_to_modify** ·
- `apps/api/src/trpc/routers/_app.ts`(注册 evolution router · 若未注册)
- `apps/web/src/router.tsx`(若 /evolution 路由未注册)
- `packages/clients/src/router-types.ts`(shadow router)

**test_command** · `pnpm test tests/unit/api/evolution-router.test.ts tests/e2e/evolution.spec.ts && pnpm typecheck`

**anti_patterns** · PRD-3 ScrollArea 30+ items viewport overflow(本 story Module ranking 11 项 · 不触发)+ PRD-7 R1 type alias

---

### **US-006 · 加分:feedback router 写入接 EvolutionAgent 触发器**(可选 · 已在 US-003 含)

> **risk_level** · `low`(本 story 仅做 sanity check + 文档化)
> **priority** · 6
> **depends_on** · [US-003]

**描述** · US-003 已在 logFeedback 加 hook · 本 story 仅:
1. 实测 feedback create flow → trigger enqueue → BullMQ worker pick up → EvolutionAgent execute → DB write
2. 加 1 个 e2e 测试覆盖完整闭环

**Acceptance Criteria** ·
- [ ] AC-1: e2e test · seed 4 既有 feedback · 第 5 个 feedback create → 期望 BullMQ queue 收到 1 job
- [ ] AC-2: 同 test · poll evolution worker 完成(最多 30s)→ 期望 EvolutionInsight 表多 1 行 + EvolutionProfile.level 升级 L1→L2(若达 L2 阈值)
- [ ] AC-3: pnpm typecheck 0 + test 全过
- [ ] AC-4: cost_log 写入 'l5_agent' eventType 验证

**files_to_create** ·
- `tests/e2e/feedback-evolution-loop.spec.ts`(~120 行)

**test_command** · `pnpm test:e2e tests/e2e/feedback-evolution-loop.spec.ts`

---

### **US-007 · DailyTaskAgent 真接 + node-cron 0 点触发 + per-account fan-out**

> **risk_level** · `high`(cron 幂等 + per-account fan-out 并发 + 跨 user state)
> **priority** · 7
> **depends_on** · [US-002]

**描述** · 每日 0 点 cron 触发 + per-account 生成今日任务:

1. **DailyTaskAgent execute() 真接**:
   - LLMGateway.complete(model_tier='lightweight')
   - input · stepData progress + latestDiagnosis + recentHistory(7 天)+ evolutionLevel + yesterdayTasks(去重)+ daysSinceLastVisit
   - output safeParse DailyTaskOutputSchema(3-5 tasks · 7 type enum)
   - 冷启动 · 用户首次或 progress=0 时 · 走模板任务(不调 LLM · 提供 5 个固定 onboarding tasks)

2. **node-cron 0 点触发**:
   - `apps/api/src/cron/daily-task-runner.ts` 实施 · cron.schedule('0 0 * * *', runForAllActiveAccounts)
   - per-account fan-out · query 7 天内活跃的 ipAccount(`updatedAt > now - 7d`)· 串行 enqueue BullMQ(避免一次 LLM 风暴)
   - **幂等性**:DailyTask 表 @@unique([accountId, taskDate])保证 1 day 1 row · cron 重复跑不重复创

3. **BullMQ Worker**(`apps/api/src/workers/daily-task/worker.ts`):
   - concurrency 5(同时跑 5 个 account · 平衡速度 vs LLM 限流)
   - 失败 retry 3 + dead-letter
   - 整 batch 跑完 ≤ 10 min(假设 < 1000 active accounts)

4. **Manual trigger**(可选):
   - `dailyTasks.regenerateToday` mutation · 用户主动重新生成(冷启动 + debug 用)

**Acceptance Criteria** ·
- [ ] AC-1: DailyTaskAgent.ts execute() 真接 LLMGateway.complete(model_tier='lightweight')· responseFormat=DailyTaskOutputSchema · timeout 30s
- [ ] AC-2: 冷启动判定 · stepData progress=0 OR EvolutionProfile null → 走 5 个模板 onboarding tasks(不调 LLM · 标 isFallback=false · modelUsed='cold-start-template')
- [ ] AC-3: cron/daily-task-runner.ts cron.schedule('0 0 * * *', ...) · cron.start() 在 app boot 时调(主入口 apps/api/src/index.ts 加 import)
- [ ] AC-4: runForAllActiveAccounts 函数 · prisma.ipAccount.findMany(where: { updatedAt: { gt: subDays(7) } }) · forEach enqueue 'daily-task' job
- [ ] AC-5: DailyTask 表 @@unique([accountId, taskDate]) · BullMQ Worker 内 prisma.dailyTask.upsert(避免重复)· 验证 cron 跑 2 次同日不重复创
- [ ] AC-6: BullMQ Worker concurrency: 5 · failure retry 3 · dead-letter 告警 stub
- [ ] AC-7: dailyTasks.regenerateToday mutation · 用户主动触发 · throw if active count 已达今日上限(若有)
- [ ] AC-8: unit test 10 tests(冷启动 / LLM 真接 / fallback / 跨日去重 / yesterdayTasks 去重 / 模板 cold-start / cron schedule string / fan-out 5 account / worker concurrency / 失败 retry)
- [ ] AC-9: integration test · seed 3 active accounts · 手动调 runForAllActiveAccounts · 期望 3 jobs enqueued · 全部 finished 后 DailyTask 表多 3 行
- [ ] AC-10: cost_log 写 'l5_agent' eventType + modelUsed
- [ ] AC-11: pnpm typecheck 0 + lint 0 + test 全过
- [ ] AC-12: LLM Judge 2 case(LLM 真接 vs cold-start · DailyTaskAgent 评分 ≥ 4.0/5)

**files_to_create** ·
- `apps/api/src/workers/daily-task/worker.ts`(~120 行)
- `tests/unit/specialists/DailyTaskAgent.test.ts`(扩展 · +10 tests)
- `tests/integration/api/daily-task-fanout.test.ts`(~120 行)
- `tests/judge/daily-task.judge.ts`(~80 行)

**files_to_modify** ·
- `apps/api/src/specialists/DailyTaskAgent.ts`(execute() 真接 ~+150 行 · cold-start 模板内联)
- `apps/api/src/cron/daily-task-runner.ts`(stub → 真 schedule + runForAllActiveAccounts)
- `apps/api/src/index.ts`(boot 加 cron.start())

**test_command** · `pnpm test tests/unit/specialists/DailyTaskAgent.test.ts tests/integration/api/daily-task-fanout.test.ts`

**anti_patterns** · PRD-7 R1 type alias · PRD-6 跨 PRD residue 误报(本 story cron 幂等设计避免)

---

### **US-008 · dailyTasks router + /daily-tasks 前端页面**

> **risk_level** · `medium`(标准 router + 前端)
> **priority** · 8
> **depends_on** · [US-007]

**描述** · `/daily-tasks` 工具页 · 用户查看今日任务 + 历史 + 完成情况:

1. **dailyTasks router**:
   - `getToday`(query · 返 DailyTask 表今日 row · 含 tasks JSON)
   - `markCompleted`(mutation · accountId + taskId · update DailyTask.tasks[i].completed=true · 重算 completedCount)
   - `getHistory`(query · 最近 7 / 30 天 DailyTask + completion 统计)
   - `regenerateToday`(mutation · 触发 US-007 manual trigger)

2. **前端 /daily-tasks 页面**:
   - 今日任务卡片 list · 每张含 title / description / type icon / estimatedMinutes / difficulty pill / CTA button(跳 ctaUrl)
   - Completed checkbox(本地交互 + 异步 markCompleted)
   - "今日完成 N/M" 进度条
   - Section · 历史完成率 chart(Recharts bar · 7 / 30 天)
   - Empty state · "今日任务还没生成 · 点击重生成"(冷启动 / cron 没跑)

**Acceptance Criteria** ·
- [ ] AC-1: dailyTasks router 4 procedures · LD-009 双层防护
- [ ] AC-2: 前端 /daily-tasks 页面渲染 today + history + completion bar
- [ ] AC-3: markCompleted optimistic update(local first · 然后 await mutation)· toast 失败回滚
- [ ] AC-4: regenerateToday 显示 loading 30s 内 polling DailyTask 表(refetchInterval)直至 completedCount 完成或 timeout
- [ ] AC-5: 用 agent-browser 打开 /daily-tasks · 截图(N=0 empty / N=3 normal / N=5 max)· 3 张
- [ ] AC-6: 无控制台错误 · markCompleted 后 UI immediate response
- [ ] AC-7: pnpm typecheck 0 + lint 0 + test 全过

**files_to_create** ·
- `apps/api/src/trpc/routers/dailyTasks.ts`(~120 行)
- `apps/web/src/pages/DailyTasks.tsx`(~250 行)
- `apps/web/src/components/charts/CompletionRateChart.tsx`(~60 行)
- `tests/unit/api/daily-tasks-router.test.ts`(~80 行)
- `tests/e2e/daily-tasks.spec.ts`(~80 行)

**files_to_modify** ·
- `apps/api/src/trpc/routers/_app.ts`
- `apps/web/src/router.tsx`
- `packages/clients/src/router-types.ts`

**test_command** · `pnpm test tests/unit/api/daily-tasks-router.test.ts tests/e2e/daily-tasks.spec.ts`

---

### **US-009 · STTWorker · OpenAI Whisper-1**

> **risk_level** · `high`(OpenAI API · audio handling · cost 控制 · 错误处理)
> **priority** · 9
> **depends_on** · [US-002]

**描述** · STT(Speech-to-Text)Worker · 真接 OpenAI Whisper-1:

1. **STTWorker 实施**(`apps/api/src/workers/stt/`):
   - `whisper.ts` 主入口 · OpenAI SDK whisper-1 API
   - 输入 · audio blob(webm/mp3 · max 25MB · 30s max duration)
   - 输出 · `{ text, durationMs, costUsd }`
   - cost · whisper-1 = $0.006/min(D-040 eventType='stt_call' · 第 5 类)
   - 限流 · IMAGE_GEN_DAILY_LIMIT_PER_USER 同模式 · STT_DAILY_LIMIT_PER_USER=50(每人每天最多 50 次 STT)

2. **stt router** `transcribe` mutation:
   - input `{ audioBlob: base64String, mimeType: 'webm'|'mp3' }`(本 story 测试用 · US-012 改 multipart upload)
   - protectedProcedure + rate limit check + cost_log 写入

3. **错误处理**:
   - OpenAI API timeout 30s
   - audio too large(> 25MB)→ 客户端 400
   - rate limit exceeded → TOO_MANY_REQUESTS
   - OpenAI 500 → fallback 'STT 失败 · 请重试'

**Acceptance Criteria** ·
- [ ] AC-1: workers/stt/whisper.ts 真接 OpenAI SDK whisper-1 · model='whisper-1' · response_format='text' · language='zh'
- [ ] AC-2: 25MB max size 校验 + 30s max duration 校验(audio metadata 解析)
- [ ] AC-3: cost_log eventType='stt_call' · provider='openai' · modelUsed='whisper-1' · costUsd 按 duration 计算($0.006/min)
- [ ] AC-4: STT_DAILY_LIMIT_PER_USER=50 · sliding window 同 image-gen pattern
- [ ] AC-5: stt.transcribe mutation · protectedProcedure + rate limit check + Whisper 调用 + cost_log
- [ ] AC-6: 错误路径 · timeout / oversize / rate-limit / API error 各 1 unit
- [ ] AC-7: unit test · nock OpenAI mock · 5 tests(happy / oversize / timeout / rate-limit / API error)
- [ ] AC-8: integration test · 真 OpenAI 调用(env OPENAI_API_KEY 存在时) · 跑 1 个 5s 中文音频 · expect 文本含关键词
- [ ] AC-9: R-001 不暴露 OpenAI key 给前端 · grep `OPENAI_API_KEY` apps/web 应 0 命中
- [ ] AC-10: pnpm typecheck 0 + test 全过

**files_to_create** ·
- `apps/api/src/workers/stt/whisper.ts`(~150 行)
- `apps/api/src/workers/stt/index.ts`(barrel)
- `apps/api/src/lib/rate-limit/stt.ts`(~80 行)
- `apps/api/src/trpc/routers/stt.ts`(~80 行)
- `tests/unit/api/workers/stt.test.ts`(~120 行 · 5 tests)
- `tests/integration/api/stt-whisper.test.ts`(~80 行 · 真 OpenAI 调用 · CI skip)

**files_to_modify** ·
- `apps/api/src/trpc/routers/_app.ts`
- `apps/api/src/lib/constants/sttLimits.ts`(新建 STT_DAILY_LIMIT_PER_USER=50)
- `.env.example`(加 OPENAI_API_KEY 注释)

**test_command** · `pnpm test tests/unit/api/workers/stt.test.ts`

**anti_patterns** · PRD-6 ImageGen Worker 模式继承(同 D-038 模式 · 不走 LLMGateway)· PRD-7 R1 type alias

---

### **US-010 · TTSWorker · OpenAI TTS-1**

> **risk_level** · `high`(OpenAI API · audio streaming · cost 控制)
> **priority** · 10
> **depends_on** · [US-002]

**描述** · TTS(Text-to-Speech)Worker · 真接 OpenAI TTS-1:

1. **TTSWorker 实施**(`apps/api/src/workers/tts/`):
   - `openai-tts.ts` 主入口 · OpenAI SDK TTS-1 API
   - 输入 · `{ text, voice: 'alloy'|'echo'|'fable'|'onyx'|'nova'|'shimmer' }`(默认 nova · 中文友好)
   - 输出 · `{ audioBuffer: Buffer (mp3), durationMs, costUsd }`
   - cost · tts-1 = $15.00/1M chars(D-040 eventType='tts_call' · 第 6 类)
   - 限流 · TTS_DAILY_LIMIT_PER_USER=100

2. **tts router** `synthesize` mutation:
   - input `{ text: string, voice?: enum }`(max 4000 chars)
   - 输出 · `{ audioUrl: string }`(临时 URL · upload 到 Asset 表 + S3 · TTL 15min)
   - protectedProcedure + rate limit + cost_log

3. **错误处理**:
   - text 太长(> 4000 chars)→ 客户端 400
   - rate limit → TOO_MANY_REQUESTS
   - OpenAI 错误 → fallback empty + toast

**Acceptance Criteria** ·
- [ ] AC-1: workers/tts/openai-tts.ts 真接 OpenAI SDK TTS-1 · model='tts-1' · voice='nova' default
- [ ] AC-2: 4000 chars max 校验
- [ ] AC-3: 输出 mp3 buffer → upload to Asset(per existing PRD-6 ImageGen pattern · accountId 双层防护)+ 返 publicUrl
- [ ] AC-4: cost_log eventType='tts_call' · costUsd = ceil(text.length / 1000) * 0.015
- [ ] AC-5: TTS_DAILY_LIMIT_PER_USER=100 · sliding window
- [ ] AC-6: tts.synthesize mutation · protectedProcedure + rate limit + 调用 + Asset 写入
- [ ] AC-7: 错误路径 · oversize / timeout / rate-limit / API error 各 1 unit
- [ ] AC-8: unit test 5 tests · integration 1 真 OpenAI 调用(CI skip)
- [ ] AC-9: Asset.publicUrl 返回 · TTL 15min(若需配 S3 signed URL · 否则 placeholder · 留 PRR 评估)
- [ ] AC-10: pnpm typecheck 0 + test 全过

**files_to_create** ·
- `apps/api/src/workers/tts/openai-tts.ts`(~150 行)
- `apps/api/src/workers/tts/index.ts`(barrel)
- `apps/api/src/lib/rate-limit/tts.ts`(~80 行)
- `apps/api/src/trpc/routers/tts.ts`(~100 行)
- `tests/unit/api/workers/tts.test.ts`(~120 行)
- `tests/integration/api/tts-openai.test.ts`(~80 行 · CI skip)

**files_to_modify** ·
- `apps/api/src/trpc/routers/_app.ts`
- `apps/api/src/lib/constants/ttsLimits.ts`(新建)

**test_command** · `pnpm test tests/unit/api/workers/tts.test.ts`

**anti_patterns** · 同 US-009(ImageGen Worker 模式)

---

### **US-011 · VoiceChatAgent 真接 LLM + 5 tools function calling + L1 Buffer**

> **risk_level** · `high`(多轮状态 + tools dispatch + L1 Buffer 并发 + tRPC subscription)
> **priority** · 11
> **depends_on** · [US-001, US-002, US-009, US-010]

**描述** · VoiceChatAgent 真接 + 5 工具 dispatch + L1 Buffer 状态:

1. **VoiceChatAgent execute() 真接**:
   - LLMGateway.stream() · tools=[VOICE_CHAT_TOOLS] · streaming=true · timeout=30s/turn
   - input · `{ text, accountId, sessionId? }`(text 来自 STT)
   - output · streaming SSE · `{ type: 'delta', text }` / `{ type: 'tool_call', name, args }` / `{ type: 'tool_result', name, result }` / `{ type: 'done', tokens }`
   - 每轮 ≤ 30s · ≤ 80 字(PROMPTS §12.1 边界约束)

2. **5 工具 dispatcher**(`apps/api/src/lib/voice-chat/tools-dispatcher.ts`):
   - 5 工具映射到 prisma queries · 通过 prismaCtx + accountId 拿 stepData / history / diagnosis / dailyTasks / evolutionInsight
   - each tool ≤ 2s · 失败 fallback message

3. **L1 Buffer 接通**:
   - `pushTurn` 每轮 user + assistant 各一条
   - `getTurns` 用于 LLM 注入历史(最近 10 turns · 防超 context)
   - 30 min TTL · 用户挂掉后自动清

4. **tRPC subscription**:
   - `voiceChat.start` subscription · 输入 `{ accountId, text, sessionId }` · 输出 observable<VoiceChatChunk>
   - 客户端 useSubscription · 流式 onData

**Acceptance Criteria** ·
- [ ] AC-1: VoiceChatAgent execute() 真接 LLMGateway.stream() · model_tier='reasoning' · tools=VOICE_CHAT_TOOLS · timeout 30s
- [ ] AC-2: tools-dispatcher.ts 5 工具映射 · 每个工具调对应 prisma query(get_current_step → stepData / search_history → history.findMany / etc)· 各 ≤ 2s
- [ ] AC-3: L1 Buffer pushTurn 每轮 user + assistant 入 buffer · getTurns 取最近 10 注入下次 LLM 调用
- [ ] AC-4: tRPC subscription voiceChat.start · 流式输出 type='delta'/'tool_call'/'tool_result'/'done' chunks
- [ ] AC-5: 30 min TTL · grep `EXPIRE.*1800` apps/api/src/memory/l1-buffer.ts 命中 1+
- [ ] AC-6: cost_log 写 'l5_agent' eventType + agentMode=null + modelUsed
- [ ] AC-7: 每轮 ≤ 80 字校验 prompt 规则 · LLM 真生超 80 字时 prompt 提示截断(post-validate)
- [ ] AC-8: 工具 dispatcher 并发安全 · 同 accountId 单 thread(LRU lock?)防 race
- [ ] AC-9: unit test 12 tests(每工具 dispatch / L1 push/get/clear / subscription 3 chunks / tool call dispatch / fallback / timeout)
- [ ] AC-10: integration test · seed account · 模拟 3 turn 对话 · 验证 L1 Buffer 3 个 user + 3 个 assistant turns
- [ ] AC-11: pnpm typecheck 0 + lint 0 + test 全过
- [ ] AC-12: LLM Judge 3 case · VoiceChatAgent 1 工具 / 2 工具 / 0 工具 评分 ≥ 4.0/5

**files_to_create** ·
- `apps/api/src/lib/voice-chat/tools-dispatcher.ts`(~200 行 · 5 工具映射)
- `apps/api/src/trpc/routers/voiceChat.ts`(~150 行 · subscription)
- `tests/unit/specialists/VoiceChatAgent.test.ts`(扩展 · +12 tests)
- `tests/integration/api/voice-chat-flow.test.ts`(~150 行)
- `tests/judge/voice-chat.judge.ts`(~100 行 · 3 case)

**files_to_modify** ·
- `apps/api/src/specialists/VoiceChatAgent.ts`(execute() 真接 + tools handling ~+200 行)
- `apps/api/src/trpc/routers/_app.ts`
- `apps/api/src/services/context-assembler/templates/voice-chat-agent.ts`(US-002 stub → 真 persona)

**test_command** · `pnpm test tests/unit/specialists/VoiceChatAgent.test.ts tests/integration/api/voice-chat-flow.test.ts`

**anti_patterns** · PRD-7 R1 type alias · PRD-6 多 mode outputSchema(本 story tools 切换不分 mode · 用 single schema + tools array)

---

### **US-012 · /voice-chat 前端页面 · WebRTC 录音 + audio player**

> **risk_level** · `high`(WebRTC 浏览器兼容性 + audio recording + subscription 客户端管理)
> **priority** · 12
> **depends_on** · [US-009, US-010, US-011]

**描述** · /voice-chat 工具页 · 用户语音多轮对话 UI:

1. **WebRTC 录音**:
   - `navigator.mediaDevices.getUserMedia({ audio: true })` · 权限请求 + 错误处理
   - MediaRecorder · webm/opus codec · 30s max recording
   - 上传 audio blob → stt.transcribe → text → voiceChat.start subscription

2. **Audio player**:
   - subscription onData type='done' → 调 tts.synthesize → audioUrl → HTML5 audio play

3. **多轮对话 UI**:
   - turn list(user message bubble · assistant message bubble · tool call card)
   - 录音按钮(按住录 · 松开发送)
   - 沉默检测(stop after 30s silence · 主动问"还想聊什么吗?")
   - 退出 · 按"挂掉"按钮 · 清 L1 Buffer + 显示总结

4. **错误处理**:
   - mic 权限拒绝 → "请允许麦克风权限" toast
   - STT 失败 → "听不清 · 请重说" toast
   - VoiceChat error → toast + 保留 buffer

**Acceptance Criteria** ·
- [ ] AC-1: /voice-chat 页面渲染 · 录音按钮 + turn list + audio player + status bar
- [ ] AC-2: MediaRecorder 录 webm/opus · max 30s · 按住录 + 松开发
- [ ] AC-3: STT → text shown in user bubble → voiceChat.start subscription → assistant bubble 流式 typing
- [ ] AC-4: done event → tts.synthesize → audio play(autoplay · 浏览器策略允许)
- [ ] AC-5: 5 工具 call card 渲染(name + args + result)· 折叠展开
- [ ] AC-6: 30s silence detection · 主动问"还想聊什么吗?"
- [ ] AC-7: 挂掉按钮 → clearBuffer + 显示总结("本次对话 N 轮 · 用时 X 分钟")
- [ ] AC-8: 用 agent-browser mock mic + 跑 1 轮对话 · 截图保存 verify-artifacts/US-012/(限制:webrtc mock 复杂 · 可降级跑 unit + manual visual verify)
- [ ] AC-9: 无 console error · 无未 release media stream(leak)
- [ ] AC-10: pnpm typecheck 0 + lint 0 + test 全过

**files_to_create** ·
- `apps/web/src/pages/VoiceChat.tsx`(~350 行)
- `apps/web/src/components/voice-chat/RecordButton.tsx`(~80 行)
- `apps/web/src/components/voice-chat/TurnList.tsx`(~80 行)
- `apps/web/src/components/voice-chat/AudioPlayer.tsx`(~60 行)
- `apps/web/src/hooks/useVoiceRecorder.ts`(~120 行)
- `tests/unit/web/pages/VoiceChat.test.tsx`(~100 行 · 主要测 UI · WebRTC mock)
- `tests/e2e/voice-chat.spec.ts`(~80 行 · 降级测 · 仅页面 load + 录音按钮存在)

**files_to_modify** ·
- `apps/web/src/router.tsx`

**test_command** · `pnpm test tests/unit/web/pages/VoiceChat.test.tsx && pnpm typecheck`

**anti_patterns** · PRD-3 Header 30 accounts ScrollArea(本 story turn list 无类似 · 但 audio player 多 instances 需 cleanup hook)

---

### **US-013 · 收官 · LLM Judge + e2e + lint clean + 全套绿灯**

> **risk_level** · `medium · large`(18 AC · 类似 PRD-6 US-014 收官模式)
> **priority** · 13
> **depends_on** · [US-001 ~ US-012]

**描述** · 全套绿灯门禁 + LLM Judge 扩展 + e2e 集成 + lint clean:

1. **LLM Judge +6 case**:
   - EvolutionAgent.judge.ts(已 US-003 加 1)+ insight-injection.judge.ts(已 US-004 加 2)
   - 本 story +6 case · DailyTaskAgent 2 case(LLM 真接 + cold-start)+ VoiceChatAgent 3 case(1/2/0 工具)+ feedback-evolution-loop 1 case
   - 总 LLM Judge 50+ case(PRD-6 39 + 本 PRD 8+)

2. **e2e 集成 spec**:
   - evolution-loop.spec.ts · feedback → trigger → EvolutionInsight 写入 → 下次 generate prompt 含注入
   - daily-task-flow.spec.ts · cron mock + DailyTask 生成 + UI 渲染 + markCompleted
   - voice-chat-flow.spec.ts(降级)· /voice-chat 页面 load + 录音按钮 + tools area visible
   - 3 个 spec + workers=1 + fullyParallel=false 沿用 PRD-5/6 教训

3. **lint clean + typecheck + 全套测试**:
   - vitest 750+(原 727 + 23 新)
   - pnpm typecheck 6 ws 0 error
   - pnpm lint --max-warnings=0 全过
   - judge 50+(原 39 + 11 新)
   - e2e 145+(原 142 + 3 新)

4. **cost_log eventType 3 新类 grep**:
   - 'l5_agent' · grep apps/api/src 命中 ≥3
   - 'stt_call' · grep 命中 1
   - 'tts_call' · grep 命中 1

**Acceptance Criteria** ·
- [ ] AC-1: judge 50+ 全过(原 39 + 11 new)
- [ ] AC-2: vitest 750+ 全过(零回归)
- [ ] AC-3: pnpm typecheck 6 ws 0 error
- [ ] AC-4: pnpm lint --max-warnings=0 全过
- [ ] AC-5: e2e 145+ 全过(原 142 + 3 new)
- [ ] AC-6: 3 e2e spec(evolution-loop + daily-task-flow + voice-chat-flow)workers=1 + fullyParallel=false
- [ ] AC-7: cost_log eventType 6 类 grep 全命中(specialist_call / judge_call / image_gen / l5_agent / stt_call / tts_call)
- [ ] AC-8: BullMQ queues 4 个 grep(image-gen + evolution-agent + daily-task-agent + voice-chat?)
- [ ] AC-9: cron schedules grep('0 0 \\* \\* \\*') 命中 1+(DailyTaskAgent)
- [ ] AC-10: L1 Buffer Redis key grep('voice_chat:acc') 命中 1+
- [ ] AC-11: ContextAssembler.assemble() 第 5 路 fetch grep · 命中 1
- [ ] AC-12: 11 Specialist templates 全含 evolutionInsight 注入 · grep `evolutionInsight` 命中 ≥11
- [ ] AC-13: VOICE_CHAT_TOOLS 5 工具 name 跨 3 处一致 · grep 验证
- [ ] AC-14: Agent specialists count = 14 · ls apps/api/src/specialists/*.ts 应 14(原 11 + 3 L5)
- [ ] AC-15: workers count = 6 · ls apps/api/src/workers/*/ 应 6(原 4 image-gen/llm-gateway/file-parser/methodology-query + stt + tts + evolution + daily-task = 8 实际)
- [ ] AC-16: browser 验证 3 工具页 · /evolution + /daily-tasks + /voice-chat load + form visible + 0 ErrorBoundary + 0 console error
- [ ] AC-17: D-046~D-049(PRD-7)+ D-050~?(本 PRD)Locked Decisions 全落实
- [ ] AC-18: 本期新增 patterns 已通过 progress.txt 回传准备(retro stage)

**files_to_create** ·
- `tests/judge/daily-task.judge.ts`(扩展 · US-007 已 80 行 · 加 case)
- `tests/judge/voice-chat.judge.ts`(扩展 · US-011 已 100 行 · 加 case)
- `tests/e2e/evolution-loop.spec.ts`(~150 行)
- `tests/e2e/daily-task-flow.spec.ts`(~120 行)
- `tests/e2e/voice-chat-flow.spec.ts`(~80 行 · 降级测)

**files_to_modify** · 无(仅扩展既有 · 不动 source)

**test_command** · `pnpm test && pnpm typecheck && pnpm lint --max-warnings=0 && pnpm test:judge && pnpm test:e2e`

---

## §2 Functional Requirements

- **FR-1**: 3 L5 自治 Agent(VoiceChat + Evolution + DailyTask)走 ADR-018 外部 orchestrator · 严禁 LLM 内 while/for 循环
- **FR-2**: EvolutionAgent 累计反馈阈值触发器 · count ∈ {5, 20, 50, 100} · BullMQ async + 原子事务
- **FR-3**: ContextAssembler 注入 EvolutionInsight 到全 11 生成型 Specialist systemPrompt · 无 insight 时跳过
- **FR-4**: DailyTaskAgent 0 点 cron 触发 + per-account fan-out · DailyTask 表 @@unique(accountId, taskDate) 保证幂等
- **FR-5**: VoiceChatAgent 流式 + 5 工具 function calling + L1 Buffer Redis(max 20 turns · TTL 30min)
- **FR-6**: STT/TTS Worker 真接 OpenAI Whisper-1 + TTS-1 · cost_log 写新 eventType('stt_call', 'tts_call')
- **FR-7**: 5 层记忆完整实施(L1 Buffer + L2 stepData + L3 History + L4 EvolutionProfile + L5 Trending placeholder)
- **FR-8**: rate limit · STT 50/user/day · TTS 100/user/day · sliding window 同 image-gen pattern

## §3 范围排除(Non-Goals)

- ❌ EvolutionAgent 触发器:不实施 ① 用户主动 ② 周 Cron ③ deepLearn 新样本(per 用户决策 · 仅累计反馈阈值)
- ❌ DailyTaskAgent 推送:不站内通知 / email · 仅 /daily-tasks 页面
- ❌ DeepLearnAgent 自动学习触发器(本期 DeepLearningArchive 仅作 EvolutionAgent 输入)
- ❌ Trending Cache L5 真实施(placeholder · 留 PRD-9)
- ❌ admin 任何代码
- ❌ 国内 STT/TTS 备份 provider · OpenAI only(PRR 评估国内合规)
- ❌ 移动端 App / 原生 SDK

## §4 Design Considerations

- 沿用 Aurelian Dark · 复用 ToolForm / ToolResult / Card / Button
- 新 charts 用 Recharts(已 PRD-6 引入)
- 3 工具页(/evolution / /daily-tasks / /voice-chat)按 PRD-MASTER §5.3 设计稿占位 · 主要业务逻辑驱动 · 视觉细节留 design polish(可 PRR)

## §5 Technical Considerations

- 严守 LD-001(95/5)· LD-006(5 层记忆)· LD-007(ContextAssembler 唯一入口)· LD-008(飞轮 5 阶段)· R-12(原子事务)
- BullMQ Worker 并发控制 · evolution=1 · daily-task=5(平衡 LLM 限流 + 速度)
- cron 幂等 · DailyTask 表 @@unique([accountId, taskDate]) + Worker upsert
- L1 Buffer Redis key prefix + TTL · 防内存泄漏
- OpenAI API 限流 · per-org TPM (token per minute) + RPM · 留 PRR 评估 enterprise account 升级时机

## §6 跨 Story 协议锁

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `EvolutionInsightContentSchema` | `z.ZodObject` | US-001 | US-003, US-004 | 5 字段 direction/insights{...} |
| `TriggerTypeSchema` | `z.union` 4 literal | US-001 | US-003 | 仅 'threshold:5/20/50/100' |
| `DailyTaskOutputSchema` | `z.ZodObject` | US-001 | US-007, US-008 | tasks[3-5] + TaskItemSchema |
| `VoiceChatTurnSchema` | `z.ZodObject` | US-001 | US-011 | role/content/toolCalls/audioUrl |
| `VOICE_CHAT_TOOLS` | `as const` array 5 entries | US-002 | US-011 | 5 工具 function calling |
| `evolutionQueue` | `Queue('evolution-agent')` | US-002 | US-003 | BullMQ |
| `dailyTaskQueue` | `Queue('daily-task-agent')` | US-002 | US-007 | BullMQ |
| `_cleanup_stale_verify_artifacts` | function in ralph.py | PRD-7 US-002 | (本 PRD daemon 启动时跑)| 跨 PRD 残留清理 |
| `enqueueIfThresholdMet(accountId, traceId)` | `(number, string?) => Promise<void>` | US-003 | US-006(feedback hook) | 阈值触发 |
| `runForAllActiveAccounts()` | `() => Promise<void>` | US-007 | (cron 主调用) | per-account fan-out |
| `cost_log.eventType` | enum 'l5_agent'/'stt_call'/'tts_call' | US-003/009/010 | US-013 grep | 新 3 类(D-040 扩展) |
| `tools-dispatcher.dispatch(name, args)` | `(string, Record<string, unknown>) => Promise<string>` | US-011 | (内部消费)| 5 工具 dispatch |

定义 story priority < 消费 story priority(全 PRD 拓扑正确 · 无循环依赖)。

## §7 Locked Decisions(D-050 ~ D-055)

> 本 PRD 锁 6 个新决策 · 跨 PRD 后续不变。

- **D-050**(EvolutionAgent 触发器仅累计反馈阈值 · per 用户决策):
  - 本期实施仅 `threshold:5/20/50/100` 4 个 trigger
  - 不实施 user-manual / weekly-cron / deep-learn-trigger(留 PRD-9 评估)
  - 违规检测 · grep `triggerType.*manual\|cron_weekly\|deep_learn_added` apps/api 应 0 命中(本期)

- **D-051**(DailyTask 仅 /daily-tasks 页面渠道):
  - 不实施站内通知 banner / email push
  - 留 PRR 阶段评估推送渠道

- **D-052**(STT/TTS 仅 OpenAI provider):
  - 本期仅 Whisper-1 + TTS-1 · 不引入国内 provider(阿里云 / 火山引擎)
  - 留 PRR 国内合规评估

- **D-053**(L1 Buffer Redis key prefix + TTL):
  - `voice_chat:acc_{id}:turns` List 类型 · max 20 · TTL 1800s
  - 不引入 RedisJSON / Stream(复杂度太高)

- **D-054**(ContextAssembler 注入 EvolutionInsight 到全 11 生成型 Specialist):
  - 11 templates 全接通(D-007 单一入口)
  - Specialist 内不允许自己拼接 EvolutionInsight

- **D-055**(BullMQ Worker concurrency · 2026-05-11 TD-030 字面更新匹配实现):
  - EvolutionAgent: worker concurrency=5 + jobId `evo:{accountId}:{count}` 去重 → 同 account 严格串行(BullMQ 同 jobId dedup)· 不同 account 可并发(速度优化)
    - 等价于 PRD v0.1 原写"1 per accountId" · 但 BullMQ concurrency 是全局 worker 级别 · 不支持 per-key · 用 jobId dedup 实现 per-account 串行
  - DailyTaskAgent: concurrency=5(per-account fan-out 跑 5 个 account 同时 · 平衡速度 vs LLM 限流)

## §8 Success Metrics

- 3 L5 Agent 全部 PASS(VoiceChat / Evolution / DailyTask)
- 反馈飞轮闭环 · 第 5 个 feedback create → BullMQ trigger → EvolutionInsight 写入 → 下次 PositioningAgent prompt 含注入(e2e 验)
- DailyTaskAgent · 0 点 cron 跑 1 次 · DailyTask 表多 N 行(N=active accounts 7d)
- VoiceChatAgent · 1 轮对话 ≤ 30s · 5 工具任一触发 ≤ 2s
- vitest 750+ / typecheck 0 / lint 0 / judge 50+ / e2e 145+
- cost_log 6 eventType 全命中

## §9 Open Questions

- **Q-1** · EvolutionAgent dead-letter 告警渠道?(钉钉 webhook / Sentry / 仅日志)· 本期仅 log + 留 PRR
- **Q-2** · TTS 输出 audioUrl TTL 15min 是否需 S3 signed URL?· 本期 Asset.publicUrl placeholder · 留 PRR
- **Q-3** · VoiceChatAgent 多用户会话隔离粒度?· accountId 隔离 · 但同 account 多 device 是否互通?(本期不互通 · sessionId 隔离)
- **Q-4** · cron 失败告警 SOP?· 本期 log only · 留 PRR 接 Sentry

---

> **本 PRD 由 Claude(Opus 4.7)在 PRD-7 完整收官后写 · 2026-05-11 · 含 PRD-7 retro Playbook P-1~P-7 内化 · §1.0 SoT 表沿用 D-046 三处一致原则 · anti_patterns 注入 PRD-6 + PRD-7 教训。**
> **3 L5 自治 Agent + 5 层记忆 + 反馈飞轮闭环 · P7 智能模块 = QuanAn 项目最有创意的设计落地。**
