# PRD-9 · P8 知识库 + RAG 接通(67 案例 + 23 公式 + 23 元素 · pgvector)

> **版本** · v0.1(2026-05-11 · prd skill Assumptions 模式 · Opus 主对话)
> **PRD** · PRD-9 · 5 stories · 计划 1w(5-7 days daemon active)· risk=low(已有 pgvector 0.8.0 + 67/23/23 数据源已 PRD-5 in-memory · RAG 第一次完整启用)
> **依赖** · PRD-4(7 Specialist 真接 LLMGateway · ✓)+ PRD-5(67 案例 / 23 公式 / 23 元素 in-memory 常量 · ✓)+ PRD-7(D-046 Schema SoT 三处一致 · ✓)+ PRD-8(D-058 ContextAssembler 5 路并行 + EvolutionInsight 注入 · ✓)
> **战略地位** · ARCHITECTURE §9.10 P8 知识库 · `PRD-1 → PRD-2 → PRD-4 → PRD-5/6/7/8 → PRD-9` 关键路径 · **主应用 P0-P8 收官**(/guide 静态页 拆到 PRD-9.1 · 见 §3 Non-Goals)
> **预估** · 一轮通过率 80-90%(基于 PRD-8 retro Playbook P-1.1~P-2.3 + Skill diff Apply 后 · 反例库累计 + anti_patterns 注入 + audit-artifacts stale mtime fix)· reject 0-2 · 总耗时 5-7 days

---

## §0 引用清单(必读 · 实施前 3 min 全部过一遍)

### §0.1 上游 PRD 决策继承

- **D-001 ~ D-055**(PRD-1~8 累计 55 LD)· 全部继承 · 不重复
- 关键继承:
  - **D-001** LD-001 95/5 编排范式(RAG retrieve 是 5% Agent 范畴 · 不允许 retrieve 内 while/for 循环)
  - **D-005** BaseSpecialist 抽象(本期 11 生成型 Specialist 不改 · 仅 ContextAssembler 接通 RAG)
  - **D-006** 五层记忆(本期实施 L5 Knowledge / Trending 部分 RAG · L4 已 PRD-8 接通)
  - **D-007** ContextAssembler 唯一 prompt 注入入口(本期 RAG 走 _fetchRag 升级 · 不允许 specialist 自拼接)
  - **D-009** RLS + LD-009 双层防护(本期 /knowledge router 沿用)
  - **D-011** 30KB 常量 import + 6 类向量库 + **不引入独立向量库**(LD-011 锁 pgvector · 不引 Qdrant/ChromaDB/Pinecone)
  - **D-012** LLMGateway 唯一 LLM 调用入口(Embedding API 是 D-038 类例外 · 独立 worker 不走 LLMGateway · 同 STT/TTS 模式)
  - **D-020** Promise.allSettled 4 路 → 5 路并行(PRD-8 D-058 升级 · 本期 _fetchRag 升级真实 RAG · 不破坏 5 路结构)
  - **D-025** RAG 降级跑空(本期 D-025 升级 → 真 RAG · 新 D-058 锁定)
  - **D-038** ImageGen Worker 独立 · 不走 LLMGateway(本期 EmbeddingWorker 同模式 · 新 D-056 锁定)
  - **D-040** cost_log eventType(本期加 'embedding_call' 第 7 类 · 跨 PRD-8 6 类后)
  - **D-046** Schema SoT 三处一致原则(本期 KnowledgeChunkContent 严格遵循 · 详 §1.0 SoT 表)
  - **D-047** canonical 选择优先级 specialists > routers > packages/schemas(本期 RAG types 放 packages/schemas/src/rag/)
  - **D-049** 路径 B 自动触发(已部署)
  - **D-054** ContextAssembler 注入 11 生成型 Specialist(本期 RAG 注入仍走 ContextAssembler 单一入口)

### §0.2 ARCHITECTURE.md 引用

- **§3.6** RAG / 常量边界(A · 30KB 常量 · B · 6 类向量数据 · C · 选型 pgvector)· 本期完整落地 B 部分前 3 类(67 案例 / 23 公式 / 23 元素)
- **§9.10** P8 知识库 + 静态页(交付物 · RAG 第一次完整启用)
- **§6.4** ContextAssembler 接口(沿用 5 路并行 + L4 + L5 RAG)

### §0.3 PROMPTS.md 引用

- **§2** CopywritingAgent prompt(本期 RAG hit 后注入 few-shot 案例 · 不改 prompt 结构)
- **§4** TopicAgent prompt(本期 RAG 注入 23 元素心理学)
- **§9** PositioningAgent / BoomGenerator(本期看 5 个 Specialist 哪些 RAG 受益最大)

### §0.4 DATA-MODEL.md 引用

- **§6** 知识库表 schema(本期实施 KnowledgeChunk 单表 + pgvector embedding 字段)
- **§3.4.5** cost_log 表(本期加 eventType='embedding_call' 第 7 类)

### §0.5 AGENTS.md 引用

- **§1.4** 1.0 不做(本期严守:仅 67/23/23 全局向量库 · 不做 per-user namespace · 不做 Trending 全局 RAG)
- **§3** LD-001(95/5 · 本期 RAG retrieve 不允许循环)
- **§3** LD-007(ContextAssembler 唯一入口)
- **§3** LD-011(不引独立向量库 · 走 pgvector)
- **§3** LD-016(测试金字塔 · 本期 vitest 870+ / judge 54+ / e2e 159+)
- **§3** R-001(LLM key 不暴露前端 · 含 OpenAI embedding key)
- **§5** R-12(原子事务 · seed ingest 批量 + chunk insert 同 transaction)
- **§11.6.7** LLM Judge 测试套件(本期加 3 case · 沿用 judge-runner.ts)
- **§11.6.8** L5 自治 Agent 双路径白名单(本期 EmbeddingWorker 走 D-038 独立 worker 模式 · 不触发双路径)

### §0.6 ADR.md 引用

- **ADR-015** RAG 选型(可能存在 · 若不存在或写 ChromaDB 需修订)
- **ADR-018** 外部 orchestrator(本期 RAG retrieve 是同步 fetch · 不走 BullMQ)

### §0.7 PRD-8 retro 教训(必读 · `.agents/retros/prd-8-vs-prd-7-retrospective.md`)

- **P-1.1** kill 前 session 残留 Monitor(RCA-005 配套 · 新 Step 5.0 SOP)
- **P-1.2** every high risk story 注入 ≥ 1 anti_pattern(本期 US-001/003 已注入 from PRD-6/8)
- **P-1.3** large 前端 story 加 `enforce_component_split: true`(本期 US-004 medium · 不触发)
- **P-2.2** PENDING_DETECTED 收到时 cross-check `audit-status` timestamp(防 < 60s self-approve)
- **L4 Skill diff Apply**(2026-05-11 已 apply):
  - Diff-1: CLAUDE.md Step 5.0 stale session 清理 SOP
  - Diff-2: ralph-tools.py approve 加 caller PID audit log
  - Diff-3: /plan-check §2.6.13 anti_patterns 注入覆盖率检查

---

## §1.0 ★★★ Schema 字段 SoT 表(US-001 + US-003 共用 · D-046 三处一致)

> **背景** · 沿用 PRD-7 §1.0 + PRD-8 §1.0 SoT 模式(D-046 三处一致原则)· 本期 1 个核心 schema(KnowledgeChunk content + embedding)严格锁定。

### §1.0.1 KnowledgeChunk Schema(单表 · type discriminator)

| 字段 | 类型 | 约束 | 用途 |
|---|---|---|---|
| `id` | Int | @id @default(autoincrement()) | 主键 |
| `type` | String | @db.VarChar(16) | 'case' / 'formula' / 'element'(D-057 discriminator) |
| `title` | String | @db.VarChar(255) | 案例/公式/元素 标题 |
| `content` | String | @db.Text | 完整内容(案例文案 / 公式公式 / 元素心理学详解) |
| `metadata` | Json | @db.JsonB | 类型特定 metadata(case: scriptType+industry · formula: category · element: psychologyTag) |
| `embedding` | vector(1536) | not null | OpenAI text-embedding-3-small 1536 dim |
| `tokens` | Int | @default(0) | embedding 时实际 tokens(用 cost_log) |
| `createdAt` | DateTime | @default(now()) | seed 时间 |
| `updatedAt` | DateTime | @updatedAt | 最后更新 |

**Prisma model**:
```prisma
model KnowledgeChunk {
  id        Int      @id @default(autoincrement())
  type      String   @db.VarChar(16)
  title     String   @db.VarChar(255)
  content   String   @db.Text
  metadata  Json     @db.JsonB
  embedding Unsupported("vector(1536)")  // pgvector
  tokens    Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@index([type])
  @@index([type, createdAt])
  // pgvector HNSW index (SQL migration 单独写):
  // CREATE INDEX knowledge_chunk_embedding_hnsw ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);
  @@map("knowledge_chunk")
}
```

### §1.0.2 KnowledgeChunkContent zod schema(packages/schemas/src/rag/)

```typescript
// packages/schemas/src/rag/index.ts (新建)
import { z } from 'zod';

export const knowledgeChunkTypeSchema = z.enum(['case', 'formula', 'element']);
export type KnowledgeChunkType = z.infer<typeof knowledgeChunkTypeSchema>;

export const caseMetadataSchema = z.object({
  scriptType: z.string(),       // '矛盾冲突' / '反差' / 等 20 类
  industry: z.string(),         // '美妆' / '健身' / 等 56 类
  sourceUrl: z.string().optional(),
});

export const formulaMetadataSchema = z.object({
  category: z.string(),         // 'AIDA' / 'PAS' / 等 23 公式分类
});

export const elementMetadataSchema = z.object({
  psychologyTag: z.string(),    // '稀缺性' / '从众' / 等 23 元素心理学
  group: z.number().int().min(1).max(4),  // 4 组
});

export const knowledgeChunkContentSchema = z.object({
  id: z.number().int(),
  type: knowledgeChunkTypeSchema,
  title: z.string(),
  content: z.string(),
  metadata: z.union([caseMetadataSchema, formulaMetadataSchema, elementMetadataSchema]),
  similarity: z.number().min(0).max(1).optional(),  // RAG retrieve 时返
});
export type KnowledgeChunkContent = z.infer<typeof knowledgeChunkContentSchema>;

export const ragRetrieveParamsSchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().min(1).max(20).default(5),
  type: knowledgeChunkTypeSchema.optional(),
  metadataFilter: z.record(z.unknown()).optional(),
});
export type RagRetrieveParams = z.infer<typeof ragRetrieveParamsSchema>;
```

### §1.0.3 cost_log eventType 第 7 类

```typescript
// 沿用 PRD-8 6 类 + 本期新加 'embedding_call':
// specialist_call / judge_call / image_gen / l5_agent / stt_call / tts_call / embedding_call (NEW)
```

---

## §1 用户故事(US-001 ~ US-005)

### **US-001 · ★ Foundation · pgvector schema + RagRetrieveWorker + cost_log 第 7 类**

> **risk_level**: medium(foundation 候选 · 4 downstream depends_on)
> **size_hint**: medium
> **priority**: 1
> **anti_patterns 注入**(per PRD-8 retro Diff-3 §2.6.13):
> - PRD-6 D-038 ImageGen Worker 模式(独立 wrapper · 不走 LLMGateway · 错误:走 LLMGateway · 正确:OpenAI SDK 直接调 audio.transcriptions / images.generate / embeddings.create)
> - PRD-8 US-004 双路径教训(specialist/agents 分离 · 防 ContextAssembler grep 命中)

**描述** · 作为 RAG 系统的 foundation · 我需要建立 pgvector 表 schema + RagRetrieveWorker 独立 worker + EmbeddingWorker 调 OpenAI embedding API · 以便 US-002 seed + US-003 ContextAssembler 接通 + US-004 前端检索都能基于稳定 schema。

**触发场景** · 实施 RAG 第一次完整启用(D-025 from placeholder → 真 RAG)

**Acceptance Criteria**:
- [ ] AC-1: prisma schema 加 KnowledgeChunk 表 + pgvector embedding 字段(per §1.0.1)· prisma migrate 成功 + pgvector extension 已启用
- [ ] AC-2: 新 SQL migration 创建 HNSW index: `CREATE INDEX knowledge_chunk_embedding_hnsw ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops)`(in `prisma/migrations/<TIMESTAMP>_add_knowledge_chunk_hnsw/migration.sql`)
- [ ] AC-3: packages/schemas/src/rag/index.ts 新建 zod schema(per §1.0.2)· export `KnowledgeChunkContent` + `RagRetrieveParams`(D-047 canonical 优先级 schemas > specialists > routers)
- [ ] AC-4: `apps/api/src/workers/embedding/openai-embedding.ts` 新 worker · D-038 模式(不走 LLMGateway)· 调 `client.embeddings.create({ model: 'text-embedding-3-small', input: text })` · 返 1536 dim vector
- [ ] AC-5: cost_log eventType='embedding_call' · provider='openai' · modelUsed='text-embedding-3-small' · costUsd = ceil(tokens / 1000) * 0.00002 (per OpenAI 定价)· promptTokens = embedding 实际 tokens
- [ ] AC-6: `apps/api/src/workers/rag/retrieve.ts` 新 worker · 接 `RagRetrieveParams` → 调 EmbeddingWorker 算 query embedding → pgvector `<=>` cosine 距离 top-K → 返 `KnowledgeChunkContent[]`(含 similarity)
- [ ] AC-7: rate limit `EMBEDDING_DAILY_LIMIT_PER_USER`(env default 100 · per user per UTC day)· sliding window 同 PRD-6 image-gen / PRD-8 STT/TTS pattern · 错误路径 TRPCError TOO_MANY_REQUESTS
- [ ] AC-8: R-001 检查 · grep `OPENAI_API_KEY` apps/web 应 0 命中(embedding worker 独占 backend)
- [ ] AC-9: unit test · `tests/unit/api/workers/embedding.test.ts` 5 tests(happy / oversize 8192 token / API error / rate-limit / cost_log 写入正确)· nock OpenAI mock
- [ ] AC-10: pnpm typecheck 0 + pnpm lint --max-warnings=0 + 全套测试通过
- [ ] Typecheck passes
- [ ] Tests pass

**files_to_create**:
- `apps/api/src/workers/embedding/openai-embedding.ts`
- `apps/api/src/workers/embedding/index.ts`(barrel · IEmbeddingWorker interface)
- `apps/api/src/workers/rag/retrieve.ts`
- `apps/api/src/workers/rag/index.ts`(barrel · IRagWorker interface)
- `apps/api/src/lib/constants/ragLimits.ts`(EMBEDDING_MAX_TOKENS=8192 / EMBEDDING_COST_USD_PER_1K=0.00002 / EMBEDDING_DAILY_LIMIT_DEFAULT=100 / EMBEDDING_TIMEOUT_MS=30000)
- `apps/api/src/lib/rate-limit/embedding.ts`
- `packages/schemas/src/rag/index.ts`
- `prisma/migrations/<TIMESTAMP>_add_knowledge_chunk/migration.sql`(prisma migrate dev 生成)
- `prisma/migrations/<TIMESTAMP>_add_knowledge_chunk_hnsw/migration.sql`(手写 · HNSW index)
- `tests/unit/api/workers/embedding.test.ts`
- `tests/unit/api/workers/rag-retrieve.test.ts`

**files_to_modify**:
- `prisma/schema.prisma`(加 KnowledgeChunk model · 第 §1.0.1)
- `.env.example`(加 EMBEDDING_DAILY_LIMIT_PER_USER=100)

---

### **US-002 · 67 案例 + 23 公式 + 23 元素 seed ingest**

> **risk_level**: low
> **size_hint**: small
> **priority**: 2
> **depends_on**: US-001
> **anti_patterns**: 沿用 PRD-5 67 案例 in-memory 模式(已 PRD-5 引入 lib/constants · 本期搬到 KnowledgeChunk pgvector)

**描述** · 作为 RAG 系统的数据源 · 我需要把 PRD-5 引入的 67 案例 + 23 公式 + 23 元素心理学(in-memory constants)批量 ingest 到 KnowledgeChunk 表 · 每条调 EmbeddingWorker 算 1536 dim embedding 入库 · 以便 US-003 真 RAG retrieve。

**触发场景** · 新部署 / migration 后 · admin 跑一次性 seed 命令(npx prisma db seed 或 dedicated script)

**Acceptance Criteria**:
- [ ] AC-1: 新 seed script `apps/api/scripts/seed-knowledge-chunk.ts` · 从 PRD-5 既有 `apps/api/src/lib/constants/{cases,formulas,elements}.ts`(若不存在则从 `references/05-vertical/02-爆款文案` 数据源)读 67/23/23 项
- [ ] AC-2: 每条调 EmbeddingWorker 算 embedding · prisma.knowledgeChunk.upsert by (type, title) 幂等(re-run safe)· 累计 67+23+23 = **113 行**
- [ ] AC-3: cost_log eventType='embedding_call' 每条 1 行 · 总 113 行 cost · 单次 seed 总 cost ≤ $0.005(113 chunks × ~100 tokens × $0.00002/1K)
- [ ] AC-4: seed script 加 `--dry-run` 选项 · 输出 chunk count + embedding tokens 估算 · 不真调 OpenAI API
- [ ] AC-5: package.json 加 `"seed:knowledge": "tsx apps/api/scripts/seed-knowledge-chunk.ts"` script
- [ ] AC-6: 完整 e2e: 跑 `pnpm seed:knowledge --dry-run` 后跑 `pnpm seed:knowledge` · psql `SELECT type, count(*) FROM knowledge_chunk GROUP BY type` 返:case=67 / formula=23 / element=23
- [ ] AC-7: integration test · `tests/integration/api/seed-knowledge-chunk.test.ts` 跑 dry-run + 验证 chunk count + 第 2 次跑(idempotent · upsert 不重复插)
- [ ] AC-8: pnpm typecheck 0 + 全套测试通过
- [ ] Typecheck passes
- [ ] Tests pass

**files_to_create**:
- `apps/api/scripts/seed-knowledge-chunk.ts`
- `tests/integration/api/seed-knowledge-chunk.test.ts`

**files_to_modify**:
- `package.json`(加 seed:knowledge script · seed config)
- `apps/api/src/lib/constants/cases.ts`(若不存在 · seed 时数据源)· 已有则不动

---

### **US-003 · ContextAssembler RAG 接通(D-025 升级 · 11 生成型 Specialist 受益)**

> **risk_level**: medium(影响 11 生成型 Specialist 注入路径)
> **size_hint**: medium
> **priority**: 3
> **depends_on**: US-001, US-002
> **anti_patterns 注入**:
> - PRD-8 US-004 教训(specialist 内不允许自拼接 evolutionInsight · 同理 RAG 也只走 ContextAssembler 单一入口)
> - PRD-6 D-038 ImageGen pattern(独立 worker)

**描述** · 作为 11 生成型 Specialist 的输入提供方 · ContextAssembler.assemble() 现 _fetchRag 返 `[]`(D-025 placeholder)· 升级真 RAG · 调 RagRetrieveWorker 按 query (userInput.userMessage 或 lastDescription)+ specialist 类型选择 retrieve · 注入 systemPrompt 第 6 部分([Section 6] RAG 知识库参考)。

**Acceptance Criteria**:
- [ ] AC-1: `ContextAssembler._fetchRag(req)` 升级真 RAG · 调 `ragRetrieveWorker.retrieve({query, topK: 5, type: 推断类型})` · 11 生成型 Specialist 推断规则:
  - CopywritingAgent → type='case' (3 case) + type='formula' (1 formula) + type='element' (1 element) = 5 chunks
  - TopicAgent / BoomGenerator → type='element' (top 3) + type='case' (top 2) = 5 chunks
  - 其他 8 Specialist → type='case' (top 3) + type='element' (top 2) = 5 chunks
  - 非生成型 (DiagnosisAgent / DeepLearnAgent / EvolutionAgent) → 跳过 RAG retrieve(返 [])
- [ ] AC-2: `_composeSystemPrompt` 加第 6 段注入 ragChunks · 注入 strict format:
  ```
  [Section 6] RAG 知识库参考(top-{N} 相似案例 · 仅供生成参考 · 不抄)
  ─ 案例 1: {title} (相似度 {similarity})· {content first 200 chars}
  ─ 案例 2: ...
  ```
- [ ] AC-3: ContextAssembler 5 路 Promise.allSettled 沿用(stepData + L4 + samples + _fetchRag 升级 + methodology)· 各路独立 5s timeout · RAG 失败降级注入空段
- [ ] AC-4: AssembledContext.metadata.layersUsed 真实反映:有 RAG hit → 加 `'L5_rag'`(D-006 五层记忆完整 · L5 第一次实施)
- [ ] AC-5: grep `evolutionInsight\|ragChunks` apps/api/src/specialists/ 应 0 命中(D-007 单一入口 · 同 PRD-8 D-054 检查)
- [ ] AC-6: unit test · `tests/unit/services/context-assembler-rag.test.ts` 5 tests(CopywritingAgent RAG hit 5 chunks / TopicAgent RAG hit 5 chunks / DiagnosisAgent skip / RAG retrieve 失败降级空段 / contextTokens 含 RAG chunks 字符)
- [ ] AC-7: integration test · `tests/integration/api/rag-injection.test.ts` 3 tests(seed knowledge + ContextAssembler.assemble PositioningAgent → systemPrompt 含 '[Section 6]' + 至少 1 个案例 title / 切 CopywritingAgent 看 case+formula 双类型 / DiagnosisAgent 跳过 RAG)
- [ ] AC-8: LLM Judge 1 case · `tests/judge/rag-injection.judge.ts`(CopywritingAgent 输出含案例引用 · 评分 ≥ 4.0/5 · 沿用 18/18 judge mock pattern · TD-027 PRR 修)
- [ ] AC-9: pnpm typecheck 0 + lint 0 + 全套测试通过
- [ ] Typecheck passes
- [ ] Tests pass

**files_to_modify**:
- `apps/api/src/services/context-assembler/ContextAssembler.ts`(_fetchRag 升级 + _composeSystemPrompt 加 [Section 6])

**files_to_create**:
- `tests/unit/services/context-assembler-rag.test.ts`
- `tests/integration/api/rag-injection.test.ts`
- `tests/judge/rag-injection.judge.ts`

---

### **US-004 · /knowledge 前端页面 · 案例 / 公式 / 元素 list + 语义检索**

> **risk_level**: low
> **size_hint**: medium
> **priority**: 4
> **depends_on**: US-001, US-002

**描述** · 作为用户 · 我想在 /knowledge 页面看到 67 案例 / 23 公式 / 23 元素心理学的完整列表 + 输入关键词做语义检索 · 帮我学习内容创作方法论。

**触发场景** · 用户在 /knowledge 路径打开页面 · 浏览案例 / 公式 / 元素 · 或输入 query 检索相似内容

**Acceptance Criteria**:
- [ ] AC-1: 新 tRPC router `knowledgeRouter` · 3 procedures:
  - `knowledge.list({ type?, limit?, offset? })` query · 返 KnowledgeChunkContent[] (无 embedding 字段 · public · 不需 protectedProcedure)
  - `knowledge.search({ query, topK?, type? })` mutation · 调 ragRetrieveWorker · 返 with similarity
  - `knowledge.getById({ id })` query · 单条详情
- [ ] AC-2: `apps/web/src/pages/tools/Knowledge.tsx` 新页面 · status bar + 3 tab(案例 / 公式 / 元素)+ list view + search input
- [ ] AC-3: search input debounce 300ms · 输入 ≥ 2 字符触发 `knowledge.search` · 结果 highlight 关键词
- [ ] AC-4: 案例 card 显示 · title + scriptType badge + industry badge + content 前 100 字预览 · 点击展开全文
- [ ] AC-5: 公式 card 显示 · title + category badge + content 全文(公式短)
- [ ] AC-6: 元素 card 显示 · title + psychologyTag badge + content 全文
- [ ] AC-7: search empty state · "暂无匹配结果 · 试试 '矛盾冲突' / 'AIDA' / '稀缺性' 等关键词"
- [ ] AC-8: router 注册 `/knowledge` · lazy import (tools chunk · 同 /voice-chat pattern)
- [ ] AC-9: 使用 agent-browser 打开 `/knowledge` · 验证 page load + 3 tabs visible + search input visible + 0 console error + 截图存 verify-artifacts/US-004/knowledge-page.png
- [ ] AC-10: 使用 agent-browser 输入 '矛盾冲突' 触发 search · 验证 results 非空 + 至少 1 个 case card 含 '矛盾' 字
- [ ] AC-11: unit test · `tests/unit/web/pages/Knowledge.test.tsx` 15 tests(3 tab 切换 / search debounce / card render / empty state / list pagination)
- [ ] AC-12: pnpm typecheck 0 + lint 0 + 全套测试通过
- [ ] Typecheck passes
- [ ] Tests pass

**files_to_create**:
- `apps/api/src/trpc/routers/knowledge.ts`
- `apps/web/src/pages/tools/Knowledge.tsx`
- `tests/unit/web/pages/Knowledge.test.tsx`

**files_to_modify**:
- `apps/api/src/trpc/routers/_app.ts`(注册 knowledgeRouter)
- `apps/web/src/router.tsx`(加 /knowledge lazy import)
- `packages/clients/src/router-types.ts`(加 knowledge shadow types · 同 PRD-8 evolution pattern)

---

### **US-005 · 收官 · LLM Judge + e2e + lint clean + 全套绿灯**

> **risk_level**: medium(收官 · 全套绿灯门禁)
> **size_hint**: medium
> **priority**: 5
> **depends_on**: US-001, US-002, US-003, US-004

**描述** · 全套绿灯门禁 + LLM Judge 扩展到 54+ case + 1 新 e2e 集成 spec + lint clean + cost_log 第 7 类 grep + RAG hit 跨 Specialist 验证 · 主应用 P0-P8 收官标志。

**Acceptance Criteria**:
- [ ] AC-1: judge 54+ 全过(原 51 PRD-8 + 3 new · rag-injection 1 + knowledge-search 1 + cross-specialist-rag 1)
- [ ] AC-2: vitest 870+ 全过(零回归 · 估 PRD-8 base 861 + US-001 5 + US-002 3 + US-003 5 + US-004 15 = 889+)
- [ ] AC-3: pnpm typecheck 6 ws 0 error
- [ ] AC-4: pnpm lint --max-warnings=0 全过
- [ ] AC-5: e2e 159+ 全过(原 158 + 1 new `tests/e2e/knowledge-rag-loop.spec.ts`)
- [ ] AC-6: 1 new e2e spec workers=1 + fullyParallel=false 沿用 PRD-5/6/7/8 教训 · 验证用户在 /knowledge 搜索 + AI 生成调用时 RAG hit 注入 prompt(用 debugAssembleSystemPrompt 同 PRD-8 US-006 模式)
- [ ] AC-7: cost_log eventType 7 类 grep 全命中:`for et in specialist_call judge_call image_gen l5_agent stt_call tts_call embedding_call; do grep -rln "'$et'" apps/api/src/ tests/ | wc -l; done` · 每类 ≥ 1 file
- [ ] AC-8: BullMQ queues 4 个 grep + 新 EmbeddingWorker / RagRetrieveWorker 都是同步调用(不走 BullMQ · 同 D-038 STT/TTS pattern)· grep `queueName.*embedding\|queueName.*rag` 应 0 命中
- [ ] AC-9: pgvector 启用确认 · psql `SELECT extname FROM pg_extension WHERE extname = 'vector'` 返 1 行
- [ ] AC-10: KnowledgeChunk 表 row count `SELECT type, count(*) FROM knowledge_chunk GROUP BY type` 返 case=67 / formula=23 / element=23
- [ ] AC-11: ContextAssembler RAG 注入 grep · `grep -rn 'ragChunks\|\\[Section 6\\]' apps/api/src/services/context-assembler/` 应命中 1+(D-054 + D-058 单一入口)
- [ ] AC-12: 11 生成型 Specialist 0 自拼接 RAG · `grep -rn 'ragRetrieveWorker\|knowledge_chunk' apps/api/src/specialists/` 应 0 命中(D-007 单一入口)
- [ ] AC-13: browser 验证 · /knowledge 工具页 load + 3 tab + search 工作 + 0 ErrorBoundary · 截图 verify-artifacts/US-005/knowledge-page.png
- [ ] AC-14: D-001~D-055 (PRD-1~8)+ D-056~D-058 (本 PRD) Locked Decisions 全落实(grep 命中各 D-NN 关键字)
- [ ] AC-15: 本期新增 patterns 已通过 progress.txt 回传准备(retro stage)
- [ ] Typecheck passes
- [ ] Tests pass

**files_to_create**:
- `tests/e2e/knowledge-rag-loop.spec.ts`

**files_to_modify**:
- `tests/judge/rag-injection.judge.ts`(US-003 已建 · 本期加 cross-specialist 维度)

---

## §2 Functional Requirements

- **FR-1**: pgvector 扩展启用 + KnowledgeChunk 单表(D-057)+ HNSW cosine index · 支持 1536 dim embedding · 67/23/23 数据完整 ingest
- **FR-2**: EmbeddingWorker 独立 worker(D-056 · D-038 模式)· 调 OpenAI text-embedding-3-small · cost_log eventType='embedding_call'
- **FR-3**: RagRetrieveWorker 同步 fetch · 接 RagRetrieveParams → returns KnowledgeChunkContent[] with similarity · pgvector `<=>` cosine 距离
- **FR-4**: ContextAssembler._fetchRag 升级真 RAG(D-058 · D-025 from placeholder → 真 RAG)· 11 生成型 Specialist 按类型推断 retrieve 策略
- **FR-5**: /knowledge 前端页面 · 67 案例 / 23 公式 / 23 元素 list + 语义搜索 + 公开访问(无 auth)
- **FR-6**: rate limit `EMBEDDING_DAILY_LIMIT_PER_USER=100` · sliding window · UTC date key(D-044 沿用)
- **FR-7**: 测试覆盖 · vitest 870+ / judge 54+ / e2e 159+ / typecheck 0 / lint 0(收官 5 项全套绿灯)

---

## §3 范围排除(Non-Goals)

- ❌ **`/guide` 静态页面**(13 模块详解 + FAQ)· 拆到 PRD-9.1 / PRD-10 admin · 原因:`/guide` 是纯静态文档 · 不依赖 RAG · 跟 PRD-9 核心目标弱耦合
- ❌ **DeepLearningArchive RAG**(per-user namespace)· 留 PRD-11 admin 审核闭环
- ❌ **History RAG**(per-user namespace)· 留 PRD-9.1+
- ❌ **TrendingItem 全局 RAG**(全网爆款)· 留 PRD-12 admin 内容审核域 ⑦
- ❌ **国内 embedding provider**(阿里云 / 火山引擎)· 本期仅 OpenAI(同 D-052 STT/TTS only OpenAI · PRR 国内合规评估)
- ❌ **chunking 复杂策略**(67 案例 / 23 公式 / 23 元素 都是单条 1-2KB · 不需切分 · 留 PRD-12+ 大文档时)
- ❌ **Re-ranking / Hybrid search**(BM25 + dense)· 本期纯 cosine · 留 PRR 优化
- ❌ **Vector compression / Quantization**(IVFFlat / PQ)· 本期 HNSW · 量级 ~113 行 · 不需

---

## §4 Design Considerations

- 沿用 Aurelian Dark · 复用 ToolForm / ToolResult / Card / Button / Tabs(已 PRD-3/4 引入 shadcn ui Tabs)
- /knowledge 页面 layout · 沿用 /voice-chat /daily-tasks 相同 container(max-w-2xl py-4)· 3 tab 切换
- search input · 沿用 Input + debounce hook(已 PRD-5 引入 useDebouncedValue)
- card · 沿用 Card + Badge (variants by type)
- empty state · 沿用 ScrollArea 内 placeholder pattern

---

## §5 Technical Considerations

- **pgvector 0.8.0**(2026-05-07 已装 · brew install pgvector + CREATE EXTENSION)· 不需新安装
- **OpenAI text-embedding-3-small** · 1536 dim · cost $0.00002/1K tokens · 比 ada-002 便宜 5×
- **HNSW index** · pgvector 0.5.0+ 支持 · cosine vector_cosine_ops · build params m=16 ef_construction=64(default)
- **严守 LD-001**(95/5 RAG retrieve 不允许循环)· **LD-007**(ContextAssembler 唯一入口)· **LD-011**(不引独立向量库)· **R-12**(原子事务)
- 测试 RAG 时 · 必须 mock OpenAI embedding API(nock pattern 沿用 PRD-8 US-009/010)
- pgvector 测试 dev `quanqn` + test `quanqn_test` 都需启用 extension
- 67 案例 / 23 公式 / 23 元素 数据源:**优先**从 `apps/api/src/lib/constants/{cases,formulas,elements}.ts`(PRD-5 引入)· 若不存在 · 从 `references/05-vertical/02-爆款文案` 重写为 TS const(PRD-5 应该做了但需验证)
- AC-12 grep 例外白名单 · EvolutionAgent + DailyTaskAgent 双路径(per AGENTS §11.6.8)· 但本 PRD 不动 L5 自治 Agent

---

## §6 跨 Story 协议锁

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `KnowledgeChunkContent` | Type | US-001 | US-002, US-003, US-004 | RAG chunk 数据结构 · packages/schemas/src/rag/ |
| `KnowledgeChunkType` | Type | US-001 | US-002, US-003, US-004 | enum 'case' / 'formula' / 'element' |
| `RagRetrieveParams` | Type | US-001 | US-003, US-004 | retrieve 参数(query / topK / type / metadataFilter)|
| `ragRetrieveWorker.retrieve(params)` | 函数签名 | US-001 | US-003 | sync fetch · returns KnowledgeChunkContent[] with similarity |
| `embeddingWorker.embed(text)` | 函数签名 | US-001 | US-002, US-001 自用 | OpenAI text-embedding-3-small · returns 1536 dim vector |
| `cost_log.eventType='embedding_call'` | enum | US-001 | US-002 | 第 7 类 cost_log · 跨 PRD-8 6 类 |
| `[Section 6] RAG 知识库参考` | systemPrompt 段 | US-003 | US-005 (LLM Judge 验证) | ContextAssembler._composeSystemPrompt 新增 |
| `EMBEDDING_DAILY_LIMIT_PER_USER` | env var | US-001 | 全 RAG 调用 | default 100 · UTC date key |
| `EMBEDDING_MAX_TOKENS=8192` | const | US-001 | US-002 | OpenAI hard limit |
| `EMBEDDING_COST_USD_PER_1K=0.00002` | const | US-001 | US-002 | 定价常量 |

---

## §7 Locked Decisions(D-056 ~ D-058)

> 本 PRD 锁 3 个新决策 · 跨 PRD 后续不变。

- **D-056**(RAG = pgvector · per ARCHITECTURE §3.6 C 推荐 · LD-011 不引独立向量库):
  - 本期实施 pgvector 0.8.0 + HNSW index + vector(1536)
  - 不引入 Qdrant / ChromaDB / Pinecone(违 LD-011)
  - 100k+ 量级再评估迁移(per §3.6 C)· 当前 ~113 行 cosine 适用

- **D-057**(KnowledgeChunk 单表 + type discriminator):
  - 不拆 KnowledgeCase + KnowledgeFormula + KnowledgeElement 3 表
  - 原因:统一 schema · 单一 RAG retrieve API · D-046 三处一致更简单 · type 字段 enum 限制 'case'/'formula'/'element'

- **D-058**(ContextAssembler RAG 启用 · D-025 升级 · 11 生成型 Specialist 受益):
  - D-025 from placeholder `return []` → 真 RAG retrieve
  - 11 生成型 Specialist 按类型推断 retrieve 策略(per US-003 AC-1)
  - 非生成型(DiagnosisAgent / DeepLearnAgent / EvolutionAgent)跳过 RAG
  - D-007 ContextAssembler 单一入口(specialist 不允许自拼接)

---

## §8 Success Metrics

- 5 stories 全 PASS(US-001~005)
- pgvector 0.8.0 + HNSW index + 113 chunks ingest 完整(case=67 / formula=23 / element=23)
- ContextAssembler RAG 真接通 · CopywritingAgent 调用时 systemPrompt 含 [Section 6] + 至少 1 个案例(e2e knowledge-rag-loop.spec.ts 验)
- vitest 870+ / typecheck 0 / lint 0 / judge 54+ / e2e 159+
- cost_log 7 eventType 全命中(PRD-8 6 类 + 新 embedding_call)
- /knowledge 页面 load + 3 tab + search debounce 工作 + 截图

---

## §9 Open Questions

- **Q-1** · 67 案例 / 23 公式 / 23 元素 数据源是否在 PRD-5 真的入了 `apps/api/src/lib/constants/{cases,formulas,elements}.ts`?(实施前 ralph 必须 grep 确认 · 若没有需从 references/ 重新提取 TS const)
- **Q-2** · /knowledge 是否需要登录?(本 PRD 假设公开 · 但若 admin 后续 deepLearning 审核闭环要权限 · 留 PRD-11)
- **Q-3** · seed-knowledge 是 prisma db seed 一次性 · 还是 PRD-10/11 admin 后续 trigger 更新?(本 PRD 一次性 · 留 PRD-11 admin 设审核 + re-ingest UI)
- **Q-4** · RAG 命中后是否需要 cost_log 记录 retrieve cost?(retrieve 本身 + embedding query)· 本期是 · 用 eventType='embedding_call' 同步记录

---

## §10 修订记录

- **2026-05-11 v0.1** · prd skill Assumptions 模式生成 · Opus 主对话 · 用户 1 个 A0 决策修正(RAG 选型 ChromaDB → pgvector per §3.6)· 跨 PRD D-NN 编号延续 D-055 → D-056~058

---

**ownership** · prd_author: prd skill (Opus) · prd_reviewer: Opus 主对话 · prd_executor: Ralph Agent (Sonnet · daemon) · prd_verifier: Opus + 用户

**status**: 🟡 进行中(prd skill 完成 · 待 /plan-check + ralph skill 转 prd-9.json)
**status_history**:
  - 2026-05-11 19:00 · 🔵 → 🟡 · prd skill 启动(Assumptions 模式)
  - 2026-05-11 19:15 · prd skill 完成 v0.1 · 等 /plan-check + ralph skill
