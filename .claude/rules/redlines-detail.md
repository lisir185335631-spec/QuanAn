---
# 从 AGENTS.md §5 下沉（R7 2026-06-12），按需加载
# 触发场景：写任何代码前·提 PR 前·Opus 审计前
# 注意：红线语义完整保留。主文件 §5 是断言速查表；本文件是详细代码示例。
---

## 红线总则

17 条红线·任一触犯 = Opus 审计直接 reject (hard fail)。
检测入口：`pnpm audit:redlines`（调 `scripts/audit-redlines.sh`）+ `bash scripts/audit-ld.sh`

---

## §5.1 编排架构红线（R-1 ~ R-3）

### ❌ R-1 · 直接调 LLM SDK 跳过 LLMGateway（LD-012）

```typescript
// ❌ 在 Specialist 内直接调 SDK
import OpenAI from 'openai';
const r = await client.chat.completions.create({ model: 'gpt-4o', ... });

// ✅ 标准
const r = await llmGateway.complete({ model_tier: 'reasoning', ... });
```

检测：`grep -r "new OpenAI\|new Anthropic\|client\.messages\.create\|openai\.chat\.completions" src/ --exclude-dir=lib/llm-gateway` → 任一命中 reject
豁免：`src/workers/image-gen / embedding / rag / tts / stt`（非 LLM chat·设计意图）
豁免范围说明：旧版仅豁免 lib/llm-gateway 单文件；脚本现状额外豁免 image-gen/embedding/rag/tts/stt 五个非 chat worker 目录（2026-05 演化）——如需收紧，改脚本与本文件同步

---

### ❌ R-2 · Specialist 之间互相调用（LD-003）

```typescript
// ❌ 在 BrandingAgent 内
const result = await positioningAgent.run(input);

// ✅ 通过 ContextAssembler 共享 stepData（异步飞轮只写记忆·不直接调）
```

检测：`grep -rn "Agent\.run\|Agent\.invoke" src/server/agents/specialists/ | grep -v "this\."` → 命中 reject

---

### ❌ R-3 · 在 Specialist 内多轮 LLM 循环（LD-001）

```typescript
// ❌ Specialist 不允许循环调 LLM
async execute(input, ctx) {
  for (let i = 0; i < 5; i++) {
    result += await llmGateway.complete({...}); // 循环调!
  }
}

// ✅ 单次 LLM·如果真要多轮→该是 L5 自治 Agent
```

检测：`grep -A20 "execute(input" src/server/agents/specialists/*.ts | grep -E "for|while" | grep "llm"` → 命中 reject（流式 chunk 处理除外）

---

## §5.2 数据架构红线（R-4 ~ R-7）

### ❌ R-4 · 漏 account_id 的 DB 查询（LD-009）

```typescript
// ❌
const all = await prisma.stepData.findMany();
const found = await prisma.history.findFirst({ where: { id: 123 } });

// ✅
const all = await prisma.stepData.findMany({ where: { accountId: ctx.activeAccountId } });
```

检测：`grep -rn "prisma\.\(stepData\|history\|topic\|asset\|diagnosisReport\|feedbackLog\|evolutionProfile\|evolutionInsight\|deepLearningArchive\|knowledgeFavorite\|knowledgeNote\)\.\(findMany\|findFirst\|findUnique\|update\|delete\)" src/ | grep -v "accountId"` → 命中 reject

特殊豁免（aggregate/groupBy/count）：若 accountId 在变量中传入·必须加注释 `// RLS auto-filters: where.accountId enforces LD-009`（否则 grep 误判 reject·详见高频陷阱 #15）

---

### ❌ R-5 · 漏 account_id 的 Redis / LS 命名（LD-009）

```typescript
// ❌
redis.set('voice_chat:turns', ...);
localStorage.setItem('aiip_memory_step3', ...);

// ✅
redis.set(`voice_chat:acc_${accountId}:turns`, ...);
localStorage.setItem(getLsKey(accountId, 'step3'), ...);  // 必须用 ls-namespace.ts helper
```

禁止 3 反例（见高频陷阱 #1）：①缺 accountId②用 LS_PREFIX 变量拼接（grep 看不到字面 acc_）③直接拼接 acc_ 但未走 helper

检测：`grep -rE "localStorage\.(setItem|getItem|removeItem)" apps/web/src/ | grep -v "getLsKey\|getToolLsKey"` → 0 命中 = OK

---

### ❌ R-6 · 新表不带 RLS / 不带 account_id（LD-009）

```sql
-- ❌
CREATE TABLE my_new_table (id SERIAL PRIMARY KEY, data JSONB);

-- ✅
CREATE TABLE my_new_table (
  id SERIAL PRIMARY KEY,
  account_id INT NOT NULL REFERENCES ip_accounts(id),
  data JSONB,
  trace_id TEXT
);
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ON my_new_table FOR ALL USING (account_id = current_setting('app.current_account_id')::int);
```

例外：全局表（users/invite_codes/trending_items）显式标 `// GLOBAL TABLE` + 必须 ADR 论证

---

### ❌ R-7 · 编造 ARCHITECTURE / DATA-MODEL 没有的 schema（LD-013+§1.7）

错误：Ralph 自己加新字段/新表/新 Specialist·没回 ARCHITECTURE.md / DATA-MODEL.md 改源
正确：任何 schema 变更·**先**改 ARCHITECTURE / DATA-MODEL·**后**写代码
检测：prisma schema 跟 DATA-MODEL.md 跑 diff·不一致 reject

---

## §5.3 接口+类型红线（R-8 ~ R-11）

### ❌ R-8 · 跳过 zod 校验返回 LLM 结果（LD-013）

```typescript
// ❌
const r = await llmGateway.complete({...});
return r.content as MyType;

// ✅
const parsed = MyZodSchema.safeParse(r.content);
if (!parsed.success) return { ...fallback, is_fallback: true };
return parsed.data;
```

---

### ❌ R-9 · 不写 trace_id（LD-013）

```typescript
// ❌
await prisma.history.create({ data: { content, accountId } });
await llmGateway.complete({ systemPrompt, userPrompt });

// ✅
await prisma.history.create({ data: { content, accountId, traceId } });
await llmGateway.complete({ systemPrompt, userPrompt, metadata: { trace_id, agentId, accountId, userId } });
```

---

### ❌ R-10 · 用 `any` type 兜底（LD-013）

```typescript
// ❌
function process(input: any): any { ... }
const data = result as any;

// ✅
function process(input: unknown): MyType {
  if (typeof input !== 'object') throw new Error();
  // narrow 后再用
}
```

检测：`tsc --strict --noUncheckedIndexedAccess` 0 error·`grep -rn ": any" src/ --include="*.ts" | grep -v ".test.ts"` → 命中 reject

---

### ❌ R-11 · 自己拼 system prompt 跳过 ContextAssembler（LD-007）

```typescript
// ❌
const sysPrompt = `你是文案魔法师。当前账号 ${accountId} ...`;
const r = await llmGateway.complete({ systemPrompt: sysPrompt });

// ✅
const ctx = await contextAssembler.assemble({ agentId, accountId, ... });
const r = await llmGateway.complete({ systemPrompt: ctx.systemPrompt });
```

检测：`grep -rn 'systemPrompt\s*=\s*[` + "`" + `'"]' src/server/agents/specialists/` → 命中 reject

---

## §5.4 行为+流程红线（R-12 ~ R-14）

### ❌ R-12 · EvolutionAgent 升级 + insight 写入不在同事务（LD-014）

```typescript
// ❌
await prisma.evolutionProfile.update({ data: { level: 'L2' } });
await llmGateway.complete({...}); // 这里失败·level 已升但 insight 空

// ✅
await prisma.$transaction(async (tx) => {
  const insights = await llmGateway.complete({...});
  await tx.evolutionInsight.create({ data: insights });
  await tx.evolutionProfile.update({ data: { level: 'L2' } });
});
```

检测：EvolutionAgent 单元测试必含"transaction rollback"用例

---

### ❌ R-13 · stepData.save 不带 version（无乐观锁）（LD-014）

```typescript
// ❌
await prisma.stepData.upsert({ where: { ... }, update: { result: newResult } });

// ✅
const r = await prisma.stepData.update({
  where: { id, version: oldVersion },  // 乐观锁
  data: { result: newResult, version: { increment: 1 } }
});
// 失败说明被另一处改过·客户端 toast 提示刷新
```

---

### ❌ R-14 · 跳过免责声明 / PII 不脱敏（LD-018）

```typescript
// ❌
const ctx = { systemPrompt: `... ${user.email} ${user.phone} ...` }; // PII 入 prompt!
return result; // 医疗行业内容无免责

// ✅
const masked = piiMask(input);
const ctx = await contextAssembler.assemble({...}); // ContextAssembler 内已 mask
return appendDisclaimerIfSensitive(result, account.industry);
```

检测：`src/lib/compliance/disclaimer.ts` + `pii-mask.ts` 必存在·ContextAssembler 单元测试必跑 PII 检测

---

## §5.5 切分+视觉+法律红线（R-15 ~ R-17）

### ❌ R-15 · 给每个 URL 写独立 Specialist（LD-002）

错误：在 `src/server/agents/specialists/` 创建 `Step7Agent.ts` / `GenerateAgent.ts` / `BoomGenerateAgent.ts`（同一 Specialist 职责）
正确：都归到 `CopywritingAgent.ts`·用 `mode: 'step7' | 'free' | 'boom'` 分支
检测：`ls src/server/agents/specialists/*.ts | wc -l` ≤ 14

---

### ❌ R-16 · 用赛博青 / Orbitron / aiipznt 原版视觉（LD-015）

```css
/* ❌ */
color: #00e5ff;
font-family: Orbitron, sans-serif;

/* ✅ Aurelian Dark */
color: theme('colors.primary');  /* #f2ca50 from DESIGN.md YAML */
font-family: theme('fontFamily.display');  /* Manrope */
```

例外：D1=A（pixel-level 复刻）模式下 Orbitron/Rajdhani 字体放在 `index.html` 内联 `<style>` 中（不放 `src/styles/`·避 grep 误报）。

检测：`grep -rn "#00e5ff\|Orbitron\|Rajdhani" src/ --include="*.ts" --include="*.tsx" --include="*.css"` → reject（注释/文档除外）

---

### ❌ R-17 · trending 自建爬虫 + 技术栈未经 ADR 变更（LD-017+§2）

```typescript
// ❌ 自建爬虫
import puppeteer from 'puppeteer';
page.setExtraHTTPHeaders({ 'User-Agent': 'spoofed' });

// ❌ 自由切技术栈（未开 ADR）
"qdrant-client": "^1.0.0"  // LD-011 禁止
```

正确：trending 用第三方授权（新榜/蝉妈妈/飞瓜 API）·技术栈变更先开 ADR
检测：`grep -rn "puppeteer" src/server/workers/trending/` → reject·`package.json` diff 检查锁定包版本

---

## §5.6 红线速跑（Opus 审计）

```bash
pnpm audit:redlines             # 调 scripts/audit-redlines.sh · 12 条 grep 红线
bash scripts/audit-ld.sh        # 18 LD 检测 + 5 条复杂红线（R-6/R-7/R-8/R-12/R-13）

# 快速单项检查
grep -r "new OpenAI\|new Anthropic" src/ --exclude-dir=lib/llm-gateway       # R-1
grep -rn "Agent\.run" src/server/agents/specialists/ | grep -v "this\."      # R-2
grep -rn "prisma\.\w\+\.findMany" src/ | grep -v "accountId"                 # R-4
grep -rn "redis\.set\|localStorage\.setItem" src/ | grep -v "acc_"           # R-5
grep -rn ": any" src/ --include="*.ts" | grep -v ".test.ts"                  # R-10
grep -rn 'systemPrompt\s*=' src/server/agents/specialists/                   # R-11
grep -rn "#00e5ff\|Orbitron" src/                                            # R-16
grep -rn "puppeteer" src/server/workers/                                     # R-17
```

17 条红线·任一命中 → reject。Ralph 提交 PR 前应先跑一遍。
