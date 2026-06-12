---
# 从 AGENTS.md §4 下沉（R7 2026-06-12），按需加载
# 触发场景：写 Specialist / 加表 / 改数据隔离逻辑时加载
---

## §4.1 Workflow vs Agent 判断规则（决策树）

派生 LD-001：

```
新功能 → Q1 触发主体是谁?
  用户主动（点按钮/填表）→ Q2 需要多轮 LLM 决策吗?
    否（单次 LLM）→ ✅ L4 Workflow
    是 → ⚠️ 警告·多轮+用户主动通常是错误设计·考虑改成多步 Workflow
  系统主动（Cron/事件/多轮对话）→ Q3 LLM 自主决定流程吗?
    是 → ✅ L5 Agent
    否 → ⚠️ 警告·系统主动+单次·应该改成 Cron+Workflow
```

**实操规则**：
- 9 步主向导 / 14 工具页 / 8 步诊断 / 反馈写入 → 全部 L4 Workflow
- VoiceChat / Evolution / DailyTask → 唯三 L5 Agent
- 新功能不在以上清单 → **默认 L4 Workflow**·想用 L5 必须先开 ADR

## §4.2 Specialist 切分 5 原则

派生 LD-002：

```
新 URL / 新模式来了，怎么放?
① 输出物跟现有 Specialist 相似? → Yes → 加 mode 分支
② 输入字段跟现有 Specialist 重叠 ≥70%? → Yes → 加 mode 分支
③ 是生成型/分析型/写记忆型? → 跨类型 → 必须独立
④ 是用户驱动循环/Heartbeat/系统主动? → Yes → L5 自治型（独立）
⑤ 都不是 → 才允许新增第 15 个（必须先开 ADR·给"为什么 14 不够"的论证）
```

**当前 14 Specialist 能力域归属**

| 输入特征 | 输出物 | 归属 |
|---|---|---|
| `industry + personalInfo + goals` | 行业分析/执行计划 | **PositioningAgent** |
| `platform + personalInfo + targetAudience` | 昵称/头像/简介/人设 | **BrandingAgent** |
| `productDesc + currentRevenue` | 阶梯/收入结构/案例 | **MonetizationAgent** |
| `industry + product + category` | 选题列表 | **TopicAgent** |
| `scriptType + elements + topic + mode` | markdown 文案 | **CopywritingAgent** |
| `sourceCopy / videoType` | 分镜/拍摄方案/场景图 prompt | **VideoAgent** |
| `platform + productInfo + experience` | 直播话术 | **LivestreamAgent** |
| `stage + product + targetUser` | 私域话术 | **PrivateDomainAgent** |
| `copy / title` | 结构分析/评分 | **AnalysisAgent** |
| `8 步问卷 answers` | 7 维度报告 | **DiagnosisAgent** |
| `sample(text/file)` | 风格向量（写记忆） | **DeepLearnAgent** |
| `audio stream` | 流式回复 | **VoiceChatAgent** ★L5 |
| `feedback_log + samples` | insights（自治产物） | **EvolutionAgent** ★L5 |
| `progress + diagnosis + history` | 今日 3-5 任务 | **DailyTaskAgent** ★L5 |

## §4.3 数据隔离 3 道闸（铁律）

派生 LD-009：

### 闸 1 · 路由层（tRPC middleware）

```typescript
const accountIsolation = middleware(async ({ ctx, input, next }) => {
  const accountId = ctx.user.activeAccountId;
  const owns = await prisma.ipAccount.count({
    where: { id: accountId, userId: ctx.user.id }
  });
  if (owns === 0) throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx: { ...ctx, activeAccountId: accountId } });
});
// 所有 protected procedure 必须 use 这个 middleware
```

### 闸 2 · 存储层（Prisma + Postgres RLS）

```sql
ALTER TABLE step_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY step_data_account_isolation ON step_data
  FOR ALL
  USING (account_id = current_setting('app.current_account_id')::int);
-- 每个请求开始时设：
SET LOCAL app.current_account_id = '${ctx.activeAccountId}';
```

`prisma.stepData.findMany()` 不带 `where: { accountId }` → Opus 审计 grep 检测 reject。

### 闸 3 · 缓存层（命名空间）

```typescript
// ✅ 正确
const key = `voice_chat:acc_${accountId}:turns`;
localStorage.setItem(getLsKey(accountId, 'step3'), ...);      // 用集中 helper
pgvector.search({ namespace: `account_${accountId}`, ... });

// ❌ 错误（漏 account_id）
const key = `voice_chat:turns`;
localStorage.setItem(`aiip_memory_${stepKey}`, ...);
```

**全局表**（显式不带 account_id · 必须标 `// GLOBAL TABLE` 注释 + ADR 论证）：users / invite_codes / trending_items

## §4.4 接口契约规范

### A · BaseSpecialist 用法

```typescript
// ✅ 标准模板
export class CopywritingAgent extends BaseSpecialist {
  config: SpecialistConfig = {
    persona: { role: '文案魔法师', goal: '生成爆款文案', boundaries: [...] },
    memory: { l1_readonly: ['account'], l2_read: ['stepData'], l2_write: ['history'] },
    knowledge: { constants: ['scriptTypes', 'hotElements'], rag: ['knowledge_cases'], refresh_interval_sec: 600 },
    tools: ['llm.stream'],
    execution: { timeout_ms: 60000, retry: 1, model_tier: 'reasoning', streaming: true }
  };
  protected async execute(input, ctx): Promise<SpecialistOutput> {
    // 走 llmGateway.stream·不直接 import OpenAI/Anthropic
  }
}

// ✅ 单实例 export（REJ-004）
export const copywritingAgent = new CopywritingAgent();

// ❌ 错误·不继承 BaseSpecialist·直接调 LLM
export async function generateCopy(input) {
  const r = await openai.chat.completions.create({...}); // 触犯 R-1
}
```

### B · ContextAssembler 调用规范

```typescript
// ✅ 标准
const ctx = await contextAssembler.assemble({ agentId, accountId, mode, userInput, needRag });
// ❌ 错误·自己拼 prompt（触犯 R-11）
const systemPrompt = `你是文案魔法师 ... ${stepData} ... ${profile}`;
```

### C · LLMGateway 调用规范

```typescript
// ✅ 标准
const resp = await llmGateway.complete({
  model_tier: 'reasoning',
  systemPrompt: ctx.systemPrompt,
  userPrompt: ctx.userPrompt,
  responseFormat: { type: 'json_schema', schema: CopywritingSchema },
  metadata: { trace_id, agentId, accountId, userId },
  timeout_ms: 60000
});
// ❌ 错误·直接调 SDK（触犯 R-1）
const resp = await anthropic.messages.create({ model: 'claude-sonnet-4-6', ... });
```

### D · Worker 调用规范（异步队列）

```typescript
// ✅ 标准·异步队列（图像/文件/trending）
await imageGenQueue.add('generate-avatar', { prompt, size: '1024x1024', accountId, trace_id });
// ❌ 错误·同步阻塞调用慢工具（阻塞 30s 用户主流程）
const url = await dalle.generate({...});
```

## §4.5 模块依赖方向（单向·不可绕过）

```
L1 · UI(React 组件) ← 顶层
    ↓
L2 · Hooks(useXxx)
    ↓
L3 · tRPC Client
────── 网络分割线 ──────
    ↓
L4 · tRPC Router(server)
    ↓
L5 · Specialist Agents
    ↓
L6 · ContextAssembler · LLMGateway
    ↓
L7 · Workers(DALL-E / STT 等) ← 底层
```

禁止跨层跳调（例如 L1 UI 直接 import L5 Specialist·必须通过 L3 tRPC）。

## §4.6 标准目录树（文件放置规范）

```
QuanAn/
├── ARCHITECTURE.md
├── AGENTS.md（本文件·→ AGENTS.md.r7 瘦身版）
├── ADR.md
├── DATA-MODEL.md
├── PROMPTS.md
├── prisma/schema.prisma
├── apps/
│   ├── web/src/
│   │   ├── pages/           # 34 路由页面
│   │   ├── components/ui/   # shadcn 基础组件
│   │   ├── hooks/           # useStepData / useActiveAccount / useEvolution / useFeedback
│   │   └── lib/
│   │       ├── constants/   # 30KB 常量
│   │       ├── compliance/  # disclaimer.ts · pii-mask.ts
│   │       └── ls-namespace.ts  # LS 集中 helper（高频陷阱 #1）
│   ├── api/src/
│   │   ├── trpc/routers/app/   # 主应用 routers
│   │   ├── trpc/routers/admin/ # admin routers（6 闸鉴权）
│   │   ├── specialists/        # 14 个 Specialist 文件
│   │   ├── agents/            # 3 L5 自治 Agent 真实现
│   │   ├── workers/           # LLMGateway / image-gen / stt / tts
│   │   └── jobs/              # BullMQ 异步任务
│   └── admin/src/             # admin SPA（独立部署）
├── packages/
│   ├── clients/router-types.ts # 跨包 AppRouter type shadow
│   └── ui/src/admin/          # 共享 UI 组件（高频陷阱 #10）
├── tests/
│   ├── unit/ ·  integration/ · e2e/ · judge/
│   └── judge/judge-runner.ts   # LLM Judge 共享 runner
└── scripts/
    ├── audit-ld.sh
    ├── audit-redlines.sh
    └── audit-redlines-admin.sh
```

新文件创建前先回这棵树查应该放哪。不允许新建顶级目录。
