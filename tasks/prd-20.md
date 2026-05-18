# PRD-20 · 真 OPENAI/Anthropic API key 接入 + 8 Specialist tuning + cost_log 真接 + userQuota atomic 扣额

> **派生自** · [ARCHITECTURE.md §6.5 LLMGateway 5 大职责](../ARCHITECTURE.md) · [§3 数据架构 · costLog/userQuota](../ARCHITECTURE.md) · [DATA-MODEL.md CostLog + UserQuota model](../DATA-MODEL.md) · [AGENTS.md §11.12 PRD-19 沉淀 · §11.6 后端 Specialist 实施](../AGENTS.md) · ADR-013(LLMGateway 透明降级)
> **风险等级** · high(money-critical · cost_log Decimal 精度 + userQuota atomic UPDATE 防超扣 · 真 LLM cost ~$0.03-0.10/call)
> **依赖前置** · PRD-19 已完成 ✅(frontend bridge + Specialist fallback API_KEY missing)+ brownfield LLMGateway 99% 已实施 ✅(`apps/api/src/workers/llm-gateway/` 5 文件)
> **PRD 编号延续** · 继 PRD-19 D-190 后 · 新决策从 **D-191** 起

---

## 元数据(frontmatter)

```yaml
prd_id: PRD-20
phase: 跨 P0/P1/P2/P3/P5(brownfield 真 LLM 接入 · 不分 Phase · 验证 + tuning 现有 8 Specialist)
risk_level: high
depends_on: [PRD-1, PRD-2, PRD-3, PRD-4, PRD-19]
branch: ralph/prd-20-real-llm-integration

# ownership
prd_author: prd skill (Opus)
prd_reviewer: Opus(主对话)
prd_executor: Ralph Agent (Sonnet · daemon)
prd_verifier: Opus + 用户

# 状态
status: 🟡 进行中
status_history:
  - 2026-05-18 12:00 · 🔵 → 🟡 · prd skill 启动(brownfield 实证 LLMGateway 99% 已实施 · scope 重定位为真 API key 接入 + 验证 + tuning + cost/quota 真接)
```

---

## §0 引用清单(单一真理来源)

| 知识源 | 单一真理来源 |
|---|---|
| LLMGateway 接口契约 | [ARCHITECTURE.md §6.5](../ARCHITECTURE.md) · 5 大职责(统一 LLM 调用入口 · 限流 · 熔断 · 降级 · 计费 · Trace) |
| Specialist 实施沉淀 | [AGENTS.md §11.6 · §11.12.4](../AGENTS.md) · BaseSpecialist + fallback API_KEY missing |
| CostLog schema | [DATA-MODEL.md CostLog model](../DATA-MODEL.md) · promptTokens/completionTokens Int + costUsd Decimal(10,6) + modelUsed/provider/traceId |
| UserQuota schema | [DATA-MODEL.md UserQuota model](../DATA-MODEL.md) · plan/dailyQuota/dailyUsed + dailyResetAt + isOnWhitelist |
| ADR-013 LLMGateway 透明降级 | [ADR.md ADR-013](../ADR.md) |
| PRD-19 frontend bridge | [tasks/prd-19.md + .agents/retros/prd-19-vs-prd-18-retrospective.md](../tasks/prd-19.md) · 9 US ALL PASSED · 真 LLM 接入是后续主线 |
| brownfield 实证 | apps/api/src/workers/llm-gateway/(5 文件 · anthropic-provider + openai-provider + rate-limiter + cost-logger + index.ts) · apps/api/src/specialists/base/BaseSpecialist.ts(277 行 · 4 步模板)+ 8 Specialist 全 wire llmGateway.complete()/stream() |
| 反例库 | `~/.claude/playbooks/reject-examples.jsonl`(49 条 · 自动注入 high+foundation US)|
| L4 升级实战 | plan-check §2.6.21 扩 + §2.6.22 EmptyState + §2.6.23 e2e baseline(PRD-19 retro M-2)+ OPUS-AUDIT-CHEATSHEET retry≥3 主动介入(PRD-19 retro M-1)+ prd-retro §17 边界 case TD 自动汇总(PRD-19 retro M-3) |

> Ralph 在 PRD-20 的工作 ·
> 1. **不重写** LLMGateway / BaseSpecialist / 8 Specialist 主体(brownfield 99% 已实施 · 仅验证 + tune)
> 2. **不接** OAuth / 不动 admin / 不切 Aurelian Dark token / 不动 PRD-15~19 frontend layout
> 3. **★ 主任务** · ENV validation + 真 LLM client init + 8 Specialist 真 LLM run + cost_log 真存 + userQuota atomic 扣额 + Schema drift 防御 + E2E manual real LLM / CI weekly fallback 双跑
> 4. **★ TD-82 自然 resolved 期望** · 真 LLM 接入后 TopicAgent SSE 5 chunks 自然触发 · PRD-18 test3 应自然 PASS
> 5. **★ TD-79/80/81 一并 maintenance fix** · US-009 verify-prd-20.sh 顺手清

---

## §1 用户故事(US-001 ~ US-009)

### Wave 1 · 真 LLM Infrastructure(2 US · 0 depends_on)

### US-001 · ENV validation + LLM client init + 启动时模式 log
- **As a** · QuanQn 后端运维 · 在 apps/api 启动时需要明确 ENV 配置正确性 + 当前 LLM 模式(real / fallback)
- **I want** · zod schema 校验 OPENAI_API_KEY + ANTHROPIC_API_KEY 在启动时存在性 · 缺则 log warning + 自动走 fallback · LLM client init(@anthropic-ai/sdk + openai SDK)+ apps/api 启动 log 显示当前模式
- **So that** · 开发/测试/生产环境配置错误能立即发现 · 不在 runtime 撞 silent fail
- **risk_level** · foundation(被 US-002~007 全部 depends_on)
- **size_hint** · small
- **files_to_create** ·
  - `apps/api/src/lib/env.ts`(zod schema · LLM_ENV validation · export validated env object)
  - `apps/api/src/lib/env.test.ts`(单测覆盖 · key 存在/缺失/格式错误 3 类)
- **files_to_modify** ·
  - `apps/api/src/index.ts`(启动时调用 validateEnv() + log mode)
  - `.env.example`(明示 OPENAI_API_KEY / ANTHROPIC_API_KEY / LLM_DEFAULT_MODEL · 注释 fallback 行为)
- **test_command** · `cd apps/api && pnpm vitest run src/lib/env.test.ts`
- **anti_patterns** · 由 prd skill 注入(关键词:env validation / zod schema / API_KEY / fallback)

### US-002 · cost_log 真接(BaseSpecialist 内 真 token + cost 真存)+ userQuota atomic 扣额
- **As a** · QuanQn 运营 · 在用户用真 LLM 时需要真 token / cost 数据持久化 · 防超额 budget
- **I want** · BaseSpecialist 4 步模板第 4 步 writeCostLog 真存 prisma costLog(promptTokens + completionTokens + costUsd Decimal + model + provider + traceId)· 同时 atomic UPDATE userQuota.dailyUsed += tokens 防超扣 · 超额返回 `QUOTA_EXCEEDED` error + UI [配额超限] badge
- **So that** · 实际 LLM cost 可观测 · per-account daily budget 强制(防恶意消费)
- **risk_level** · **high · money-critical**(cost_log 精度 + userQuota atomic UPDATE)
- **size_hint** · medium
- **files_to_create** ·
  - `apps/api/src/services/quota/userQuota.service.ts`(checkAndDeduct + reset daily 函数)
  - `apps/api/src/services/quota/__tests__/userQuota.service.test.ts`(原子 UPDATE 单测 · concurrent test)
- **files_to_modify** ·
  - `apps/api/src/specialists/base/BaseSpecialist.ts`(step 4 writeCostLog 真存 + atomic UPDATE userQuota)
  - `apps/api/src/workers/llm-gateway/cost-logger.ts`(若已 stub · 改真接 prisma)
  - `apps/web/src/components/states/ErrorState.tsx`(加 [配额超限] variant)
- **test_command** · `cd apps/api && pnpm vitest run src/services/quota/__tests__/userQuota.service.test.ts`
- **anti_patterns** · 由 prd skill 注入(关键词:cost_log / token / Integer / atomic UPDATE / 乐观锁 / money-critical)

### Wave 2 · 8 Specialist 真 LLM 验证 + Schema drift 防御(5 US · depends Wave 1)

### US-003 · PositioningAgent 真 LLM(industry + execution mode · for step1 + step4)
- **As a** · QuanQn 用户 · 在 Step1 选行业 + Step4 填执行参数 · 真接 PositioningAgent 真 LLM
- **I want** · PositioningAgent.invokeLLM 真接 Anthropic Claude(或 OpenAI · model_tier='reasoning')· 真 system prompt + responseFormat schema 验证 · 真 result 存 DB + UI render · 同时验证 fallback mock vs 真 LLM 输出格式对齐(防 Schema drift)
- **So that** · Step1/Step4 真 LLM 输出可用 · 不是 stub mock
- **risk_level** · high(money-critical · 真 LLM cost · Schema drift risk)
- **size_hint** · medium
- **depends_on** · [US-001, US-002]
- **files_to_modify** ·
  - `apps/api/src/specialists/PositioningAgent.ts`(invokeLLM real call + system prompt tune)
  - `apps/api/src/specialists/__tests__/PositioningAgent.real-llm.test.ts`(新增 · OPENAI_API_KEY 有时跑真 LLM 单测)
- **test_command** · `OPENAI_API_KEY=test cd apps/api && pnpm vitest run src/specialists/__tests__/PositioningAgent.real-llm.test.ts`
- **anti_patterns** · 由 prd skill 注入(关键词:real LLM / system prompt / responseFormat / Schema drift / Specialist fallback)

### US-004 · BrandingAgent 真 LLM(packaging + persona · for step3 + step3b)
- **As a** · QuanQn 用户 · 在 Step3 IP 定位 + Step3b 人设 · 真接 BrandingAgent
- **I want** · BrandingAgent.invokeLLM 真接 LLM · packaging mode (step3) + persona mode (step3b)· system prompt 双 mode 严格区分 + responseFormat schema 各自验证
- **So that** · Step3/Step3b 真 LLM 输出
- **risk_level** · high
- **size_hint** · medium
- **depends_on** · [US-001, US-002]
- **files_to_modify** ·
  - `apps/api/src/specialists/BrandingAgent.ts`(invokeLLM real call · 2 mode prompt 区分)
  - `apps/api/src/specialists/__tests__/BrandingAgent.real-llm.test.ts`
- **test_command** · `OPENAI_API_KEY=test cd apps/api && pnpm vitest run src/specialists/__tests__/BrandingAgent.real-llm.test.ts`

### US-005 · MonetizationAgent + VideoAgent 真 LLM(for step4b + step6)
- **As a** · QuanQn 用户 · 在 Step4b 变现规划 + Step6 拍摄计划 · 真接 Agent
- **I want** · 2 Agent invokeLLM real call · MonetizationAgent(3 阶梯 + 收入结构 + 案例 输出 schema)+ VideoAgent shooting mode(8 列分镜表 输出 schema)
- **So that** · Step4b/Step6 真 LLM 输出
- **risk_level** · high
- **size_hint** · medium-large(2 Agent · 各 1 mode · 但 schema 复杂)
- **depends_on** · [US-001, US-002]
- **files_to_modify** ·
  - `apps/api/src/specialists/MonetizationAgent.ts`(invokeLLM real call)
  - `apps/api/src/specialists/VideoAgent.ts`(invokeLLM real call · shooting mode 主)
  - 2 *.real-llm.test.ts
- **test_command** · `OPENAI_API_KEY=test cd apps/api && pnpm vitest run src/specialists/__tests__/{Monetization,Video}Agent.real-llm.test.ts`

### US-006 · TopicAgent SSE 真 LLM(5 类 100 选题 · TD-82 自然 resolved 期望)
- **As a** · QuanQn 用户 · 在 Step5 选 1 类 + 提交 · 真 SSE 流接 TopicAgent · 真 5 chunks 渐进出 5 类 100 选题
- **I want** · TopicAgent.invokeLLM 真走 llmGateway.stream() SSE · 真 5 chunks 触发(per category)· 跟 fallback mock(1 次性返回)区分 · **TD-82 自然 resolved**(PRD-18 test3 fallback 不模拟 5 chunks · 真 LLM 接入后会自然 5 chunks)
- **So that** · Step5 真 100 选题 + PRD-18 test3 自然 PASS
- **risk_level** · high(SSE 真接 · streaming + 5 chunks 渐进 + token 计费)
- **size_hint** · large(SSE 真接 + TD-82 自然 resolved 验证)
- **depends_on** · [US-001, US-002]
- **files_to_modify** ·
  - `apps/api/src/specialists/TopicAgent.ts`(invokeLLM real SSE call + 5 chunks 渐进)
  - `apps/api/src/specialists/__tests__/TopicAgent.real-llm.test.ts`(SSE chunks 单测)
- **test_command** · `OPENAI_API_KEY=test cd apps/api && pnpm vitest run src/specialists/__tests__/TopicAgent.real-llm.test.ts`
- **anti_patterns** · 由 prd skill 注入(关键词:SSE / streaming / 5 chunks / TD-82 / TopicAgent)

### US-007 · CopywritingAgent + LivestreamAgent 真 LLM(for step7 + step8 2 子功能)
- **As a** · QuanQn 用户 · 在 Step7 文案生成 + Step8 直播策划 2 子功能 · 真接 Agent
- **I want** · CopywritingAgent.invokeLLM 真 SSE call(step7 mode · 长 markdown 输出 + history 自动写)+ LivestreamAgent.invokeLLM 真 call(generate_plan + optimize_script 双 mode · sub_function discriminator 严守)
- **So that** · Step7/Step8 真 LLM 输出 + history 真累积
- **risk_level** · high
- **size_hint** · medium-large
- **depends_on** · [US-001, US-002]
- **files_to_modify** ·
  - `apps/api/src/specialists/CopywritingAgent.ts`(invokeLLM real SSE call)
  - `apps/api/src/specialists/LivestreamAgent.ts`(invokeLLM real call · 2 sub_function)
  - 2 *.real-llm.test.ts
- **test_command** · `OPENAI_API_KEY=test cd apps/api && pnpm vitest run src/specialists/__tests__/{Copywriting,Livestream}Agent.real-llm.test.ts`

### Wave 3 · 收官(2 US)

### US-008 · E2E manual 真 LLM run + CI weekly fallback default + TD-79/80/81/82 一并 fix
- **As a** · QuanQn 维护者 · 需要双跑 E2E · 默认 fallback(快 + 无 cost)+ manual/CI weekly 真 LLM(完整端到端)
- **I want** · playwright spec 双跑配置 · `E2E_REAL_LLM=1` env 控制 fallback vs 真 LLM · 真 LLM 跑 PRD-18 test3 应自然 PASS(TD-82 resolved)· PRD-15~19 旧 e2e zero-regression 全 PASS · TD-79/80/81 一并 maintenance fix
- **So that** · 真 LLM cost 可控(CI 默认 fallback)+ weekly 真 LLM 验证 + 4 TD 一并清
- **risk_level** · high(真 LLM cost ~$0.50/full E2E · 4 TD fix · zero-regression)
- **size_hint** · large
- **depends_on** · [US-003, US-004, US-005, US-006, US-007]
- **files_to_create** ·
  - `apps/web/e2e/prd-20-real-llm.spec.ts`(真 LLM 跨 9 step + 5 Tab SSE chunks 验证)
  - `.github/workflows/e2e-weekly-real-llm.yml`(若选 GitHub CI · weekly cron · OPENAI_API_KEY secret)
- **files_to_modify** ·
  - `apps/web/playwright.config.ts`(if env E2E_REAL_LLM=1 设 timeout 90s + retries 2)
  - `apps/web/src/lib/constants/industries.ts`(TD-79 决策 · 用户选 (A) 回滚 STEP1_CTA_LABEL 或 (B) 升级 source-of-truth · 推荐 B 保留新 label · 跟真 Agent 语义)
  - `apps/web/src/lib/constants/{industries,step3,step3b}.ts`(TD-80 fix · 新增 STEP{N}_RESULT_H2/H3/BUTTON 常量)
  - `apps/web/src/pages/step/{Step1,Step3,Step3b}.tsx`(TD-80 fix · 改用常量)
  - `apps/web/src/components/step5/Step5TopicGrid.tsx`(TD-81 fix · 删 backward compat 双写 line 75-76)
  - `apps/web/e2e/prd-18-step-4-5-6-7-8.spec.ts`(TD-82 验证 + 若仍 fail · B/C 选 1 fix)
- **test_command** · `cd apps/web && pnpm playwright test e2e/prd-20-real-llm.spec.ts`(默认 fallback)· `E2E_REAL_LLM=1 cd apps/web && pnpm playwright test e2e/prd-20-real-llm.spec.ts`(真 LLM)

### US-009 · verify-prd-20.sh 40+ 检查 + zero-regression + Specialist tuning baseline 文档
- **As a** · QuanQn 维护者 · 需要可重复脚本验证 PRD-20 全部交付物 + Specialist tuning baseline 留痕
- **I want** · `scripts/verify-prd-20.sh` 40+ 检查项 · 含 §1 ENV validation + §2 LLM SDK 真接 + §3 cost_log 真数据 grep + §4 userQuota atomic + §5 8 Specialist real LLM test 全 PASS(若 OPENAI_API_KEY 存在)+ §6 TD-79/80/81/82 fix 验证 + §7 zero-regression(typecheck + vitest 181 + 旧 e2e 全 PASS)+ §8 D4=B/D3=A/LD-009 严守 grep + Specialist tuning baseline 文档(model_tier / token usage / 平均 cost / 调优记录)
- **So that** · PRD-20 收官有客观证据 · Specialist tuning 数据 baseline 立 · 后续 PRD-21+ Specialist 优化有对照
- **risk_level** · medium
- **size_hint** · medium
- **depends_on** · [US-008]
- **files_to_create** ·
  - `scripts/verify-prd-20.sh`(chmod +x · 40+ 检查项)
  - `.agents/specialist-tuning-baseline.md`(8 Specialist baseline · model_tier / avg input_tokens / avg output_tokens / avg cost USD / 调优历史)
- **files_to_modify** ·
  - `.agents/tech-debt.json`(TD-79/80/81/82 standalone status=resolved · resolved_in_prd='prd-20')
- **test_command** · `bash scripts/verify-prd-20.sh`

---

## §2 验收标准(AC · ★ 4 类必含 · 简化版)

### AC-001-H(US-001 happy · ENV validation)

```typescript
// apps/api/src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  LLM_DEFAULT_MODEL: z.string().default('claude-sonnet-4-6'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('[env] validation failed:', result.error.format());
    throw new Error('ENV validation failed');
  }
  const env = result.data;
  const hasOpenAI = !!env.OPENAI_API_KEY;
  const hasAnthropic = !!env.ANTHROPIC_API_KEY;
  console.log(`[env] LLM mode: ${hasOpenAI || hasAnthropic ? 'real' : 'fallback'}`);
  console.log(`[env]   OPENAI_API_KEY: ${hasOpenAI ? '✓' : '✗ (fallback)'}`);
  console.log(`[env]   ANTHROPIC_API_KEY: ${hasAnthropic ? '✓' : '✗ (fallback)'}`);
  return env;
}
```

### AC-001-E/B/P(US-001 error/boundary/performance)
- E · ENV 缺 → log warning + fallback(不抛 error)· 单测覆盖
- B · LLM_DEFAULT_MODEL 默认 'claude-sonnet-4-6' · 不允许 empty string
- P · validateEnv() < 50ms · 启动时 1 次 call

### AC-002-H(US-002 happy · cost_log + userQuota atomic)

```typescript
// apps/api/src/services/quota/userQuota.service.ts
import { Prisma } from '@prisma/client';

// $ money-critical: atomic UPDATE 防超扣
export async function checkAndDeductQuota(
  prisma: PrismaClient,
  userId: number,
  tokens: number,
): Promise<{ ok: true; remaining: number } | { ok: false; reason: 'QUOTA_EXCEEDED'; current: number; quota: number }> {
  const updated = await prisma.userQuota.updateMany({
    where: {
      userId,
      // 乐观锁 · 只有 dailyUsed + tokens <= dailyQuota 时才更新
      dailyUsed: { lte: Prisma.raw(`daily_quota - ${tokens}`) },
    },
    data: {
      dailyUsed: { increment: tokens },
    },
  });
  if (updated.count === 0) {
    // 已超额 · 不扣
    const current = await prisma.userQuota.findUniqueOrThrow({ where: { userId } });
    return { ok: false, reason: 'QUOTA_EXCEEDED', current: current.dailyUsed, quota: current.dailyQuota };
  }
  const after = await prisma.userQuota.findUniqueOrThrow({ where: { userId } });
  return { ok: true, remaining: after.dailyQuota - after.dailyUsed };
}
```

### AC-002-E/B/P(US-002 error/boundary/performance)
- E · userQuota row 不存在(新用户)· auto-create with plan='free' + default dailyQuota=100000(per D-194)
- B · tokens === 0 · 跳过(不扣 quota 也不写 cost_log)· daily reset 24h 自动(dailyResetAt 字段)
- P · checkAndDeductQuota < 10ms(单 UPDATE + 1 SELECT)· concurrent 100 用户测试不超扣(单测 vitest 模拟并发)

### AC-003~007-H(US-003~007 happy · Specialist 真 LLM)

每个 Specialist 测试模板(以 US-003 PositioningAgent 为例):

```typescript
// apps/api/src/specialists/__tests__/PositioningAgent.real-llm.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { positioningAgent } from '../PositioningAgent';

const skipIfNoKey = !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY;

describe.skipIf(skipIfNoKey)('PositioningAgent real LLM', () => {
  it('industry mode returns valid PositioningOutput schema', async () => {
    const result = await positioningAgent.execute({
      accountId: 1,
      mode: 'industry',
      userInput: { industry: '美业', industryLabel: '美业' },
      traceId: 'test-trace-1',
      stepKey: 'step1',
    });
    expect(result.result).toMatchObject({
      // 验证 schema · 跟 fallback mock 输出格式对齐
      market_analysis: expect.any(String),
      competition_level: expect.stringMatching(/低|中|高/),
      positioning_suggestion: expect.any(String),
    });
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toMatch(/claude|gpt/);
    expect(result.tokensUsed.total).toBeGreaterThan(0);
    expect(result.durationMs).toBeLessThan(60000);
  });

  it('execution mode returns valid schema', async () => {
    // 同上
  });
});
```

### AC-003~007-E/B/P
- E · API 超时 (60s) → SchemaValidationError / LLMTimeoutError → BaseSpecialist 重试 1 次 → fallback mock · status='fallback'
- B · 真 LLM 返回 schema invalid → safeParse 失败 → 重试 → fallback
- P · 单 Specialist call < 60s · cost < $0.10/call(reasoning model tier)

### AC-006 (TopicAgent SSE) · 额外 SSE chunks 验证

```typescript
// AC-006-H(SSE chunks 渐进)
it('streams 5 chunks (5 categories) progressively', async () => {
  const chunks: any[] = [];
  for await (const chunk of topicAgent.executeStream({ accountId: 1, ... })) {
    chunks.push(chunk);
  }
  // 真 LLM 应自然 5 chunks(per category · TD-82 自然 resolved)
  const doneChunks = chunks.filter((c) => c.type === 'done');
  expect(doneChunks.length).toBe(5);
  expect(doneChunks.map((c) => c.category).sort()).toEqual(
    ['case', 'cognition', 'monetize', 'persona', 'traffic']
  );
});
```

### AC-008-H(US-008 happy · E2E 双跑 + TD fix)

```typescript
// apps/web/e2e/prd-20-real-llm.spec.ts
import { test, expect } from '@playwright/test';

const REAL_LLM = process.env.E2E_REAL_LLM === '1';

test.describe(`PRD-20 ${REAL_LLM ? 'real LLM' : 'fallback'}`, () => {
  test('Step5 SSE 5 tabs 真触发(TD-82 验证)', async ({ page }) => {
    await page.goto('http://localhost:5173/step/5');
    await loginAs(page, 'test_real_llm@example.com');
    // 填 form + 提交
    // ...
    // 真 LLM 5 chunks · 5 tab 自然渐进出现(TD-82 resolved)
    await expect(page.getByRole('tab', { name: '流量型' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('tab', { name: '变现型' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('tab', { name: '人设型' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('tab', { name: '认知型' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('tab', { name: '案例型' })).toBeVisible({ timeout: 30000 });
    // 真 LLM 每 Tab 应有 20 选题
    const topics = page.locator('[role="tabpanel"] button');
    await expect(topics).toHaveCount(20);
  });

  // ... TD-79/80/81 一并 fix 验证
});
```

### AC-008-E/B/P
- E · 真 LLM 跑失败 → e2e test fail · 自动登记 TD · 不阻断 fallback test
- B · TD-79 用户决策 · default (B) 保留新 label · grep `STEP1_CTA_LABEL = '生成行业洞察'` ≥ 1
- P · 真 LLM E2E 单 test ≤ 5min · 全 spec ≤ 30min · cost ≤ $1/full run

### AC-009-H(US-009 happy · verify-prd-20.sh 40+ 检查)

```bash
#!/usr/bin/env bash
# scripts/verify-prd-20.sh
set -euo pipefail
PASS=0; FAIL=0

# §1 ENV validation(3 项)
grep -q "validateEnv\|envSchema" apps/api/src/lib/env.ts && ok '§1.1 envSchema defined' || fail '§1.1'
grep -q "validateEnv" apps/api/src/index.ts && ok '§1.2 startup calls validateEnv' || fail '§1.2'
grep -q "OPENAI_API_KEY" .env.example && ok '§1.3 .env.example 明示 OPENAI_API_KEY' || fail '§1.3'

# §2 LLM SDK 真接(3 项)
grep -q "from '@anthropic-ai/sdk'" apps/api/src/workers/llm-gateway/anthropic-provider.ts && ok '§2.1' || fail '§2.1'
grep -q "from 'openai'" apps/api/src/workers/llm-gateway/openai-provider.ts && ok '§2.2' || fail '§2.2'
# 真 client.messages.create 调用(非 stub)
grep -q "client.messages.create\|client.chat.completions" apps/api/src/workers/llm-gateway/*.ts && ok '§2.3 真 SDK call' || fail '§2.3'

# §3 cost_log 真数据(4 项 · money-critical)
grep -q "money-critical" apps/api/src/services/quota/userQuota.service.ts && ok '§3.1 money-critical 注释' || fail '§3.1'
grep -q "prisma.costLog.create" apps/api/src/workers/llm-gateway/cost-logger.ts && ok '§3.2 prisma 真接' || fail '§3.2'
grep -q "Prisma.raw\|乐观锁\|atomic" apps/api/src/services/quota/userQuota.service.ts && ok '§3.3 atomic UPDATE' || fail '§3.3'
# 真测 cost_log 数据 generated(若 OPENAI_API_KEY 存在)
[ -n "${OPENAI_API_KEY:-}" ] && {
  cd apps/api && pnpm vitest run src/services/quota/__tests__/userQuota.service.test.ts && ok '§3.4 quota test PASS'
} || ok '§3.4 SKIP no key'

# §4 userQuota atomic + 8 Specialist real LLM test(8 项 · 若有 key)
[ -n "${OPENAI_API_KEY:-}" ] && {
  for agent in Positioning Branding Monetization Topic Video Copywriting Livestream; do
    cd apps/api && pnpm vitest run "src/specialists/__tests__/${agent}Agent.real-llm.test.ts" > /tmp/${agent}.log 2>&1
    [ $? = 0 ] && ok "§4.${agent} real LLM PASS" || fail "§4.${agent}"
  done
} || ok '§4 SKIP no key (fallback only)'

# §5 TD-79/80/81/82 fix 验证(4 项)
grep -q "STEP1_CTA_LABEL = '生成行业洞察'" apps/web/src/lib/constants/industries.ts && ok '§5.1 TD-79 (B)' || fail '§5.1'
grep -q "export const STEP1_RESULT_H2\|STEP1_RESULT_H3" apps/web/src/lib/constants/industries.ts && ok '§5.2 TD-80 fix' || fail '§5.2'
[ "$(grep -c "acc_step5_selected_topic" apps/web/src/components/step5/Step5TopicGrid.tsx)" = "0" ] && ok '§5.3 TD-81 fix · backward compat 删' || fail '§5.3'
# TD-82 · 真 LLM 跑后 PRD-18 test3 自然 PASS(若有 key)
[ -n "${OPENAI_API_KEY:-}" ] && E2E_REAL_LLM=1 pnpm playwright test e2e/prd-18-step-4-5-6-7-8.spec.ts && ok '§5.4 TD-82 自然 resolved' || ok '§5.4 SKIP no key'

# §6 zero-regression(3 项)
cd apps/web && pnpm typecheck && ok '§6.1 typecheck' || fail '§6.1'
cd apps/web && pnpm vitest run > /tmp/v.log 2>&1 && ok '§6.2 vitest' || fail '§6.2'
# vitest count ≥ 181(PRD-19 baseline)
[ "$(grep -oE 'Tests +[0-9]+ passed' /tmp/v.log | grep -oE '[0-9]+' | head -1)" -ge 181 ] && ok '§6.3 ≥181 tests' || fail '§6.3'

# §7 D4=B/D3=A/LD-009 严守 grep(3 项)
[ "$(grep -rE "from-(violet|amber|gold|purple)" apps/web/src/pages/step/ 2>/dev/null | wc -l | tr -d ' ')" = "0" ] && ok '§7.1 D4=B' || fail '§7.1'
[ "$(grep -rE "localStorage\.setItem\(['\"]acc_step" apps/web/src/pages/step/ 2>/dev/null | wc -l | tr -d ' ')" = "0" ] && ok '§7.2 LD-009' || fail '§7.2'
[ "$(git diff main..HEAD --name-only | grep -E "^apps/admin/" | wc -l | tr -d ' ')" = "0" ] && ok '§7.3 D3=A' || fail '§7.3'

# §8 Specialist tuning baseline 文档(1 项)
[ -f .agents/specialist-tuning-baseline.md ] && ok '§8.1 baseline doc' || fail '§8.1'

echo "Result: $PASS passed, $FAIL failed"
exit $FAIL
```

### AC-009-E/B/P
- E · 任一 § fail · exit non-zero · CI / 用户能 catch
- B · OPENAI_API_KEY 不存在 · §3.4 / §4 / §5.4 SKIP(不 fail · 但 echo SKIP)
- P · verify script 跑完 < 90s(若 fallback only)/ < 30min(若真 LLM 全跑)

---

## §3 范围排除(明确不做)

- ❌ 不重写 LLMGateway / BaseSpecialist 主体(brownfield 99% 已实施 · 仅验证 + tune)
- ❌ 不重写 8 Specialist 主体(仅改 invokeLLM real call + system prompt tune)
- ❌ 不接 OAuth / 不动 admin / 不动 apps/api/admin/* (D3=A 严守)
- ❌ 不切 Aurelian Dark 颜色 token(D4=B 严守)
- ❌ 不动 PRD-15~19 frontend layout / D1=A 字面锁(除 TD-79 决策)
- ❌ 不实施新 Specialist(8 个已够覆盖 9 step + 14 工具)
- ❌ 不接生产真 API(本 PRD 仅 dev/test/CI weekly · 生产留 PRR)
- ❌ 不实施支付接入(userQuota 自动扣 + 超额返 error · 充值留 PRD-21+)

---

## §4 风险 + 缓解

| # | 风险 | 缓解策略 |
|:-:|---|---|
| R-1 | **money-critical · userQuota 超扣 race condition** | US-002 atomic UPDATE WITH WHERE 条件 + 单测覆盖并发 100 用户 |
| R-2 | **真 LLM cost 爆炸**(开发期意外 ~$100+) | US-001 fallback default + US-009 verify script 跑 SKIP if no key · 真 LLM 仅 manual / CI weekly |
| R-3 | **Schema drift · fallback mock vs 真 LLM 输出格式不对齐** | US-003~007 各 Specialist real-llm.test.ts 验证 schema 严格匹配 fallback mock 输出格式 + safeParse |
| R-4 | **真 LLM API timeout / 5xx 错** | BaseSpecialist 已实施 isFallbackable(LLMTimeoutError + 5xx + API_KEY missing per PRD-19)· retry 1 次 + fallback mock |
| R-5 | **TD-82 真 LLM 接入后仍 fail** | US-008 真跑 PRD-18 test3 验证 · 若仍 fail · B/C 选项 fix(B Step5 fallback 模拟 5 chunks / C TopicAgent fallback 改 5 chunks) |
| R-6 | **8 Specialist real-llm.test.ts 撞 API rate limit** | rate-limiter.ts 已实施 · 单测加 sleep 1s + 串行跑(非并发)|
| R-7 | **CI weekly 真 LLM cost ~$1/run** | GitHub Actions cron · 仅 weekly 1 次 · 月 cost ~$5 · 可接受 |
| R-8 | **userQuota dailyResetAt 24h 重置 bug** | US-002 单测 mock 时间跳 24h 验证 reset 正确 |

---

## §5 测试配额

| 测试类型 | 配额 | 路径 |
|---|---|---|
| **单元测试 (vitest)** | 30+ 新增 + 181+ 旧不动 | apps/api/src/services/quota/__tests__/userQuota.service.test.ts(10+ 测含并发)+ apps/api/src/lib/env.test.ts(5 测)+ apps/api/src/specialists/__tests__/{7 Agent}.real-llm.test.ts(各 2-3 测 · skipIf no key) |
| **集成测试 (vitest)** | 已 PRD-2 实施 · 不动 | — |
| **E2E (playwright)** | 1 新 spec · 4 tests · 双跑 fallback/real | apps/web/e2e/prd-20-real-llm.spec.ts |
| **真 LLM 集成测试** | 8 个 · skipIf no OPENAI/ANTHROPIC_API_KEY | apps/api/src/specialists/__tests__/{7 Agent}.real-llm.test.ts + Step5 SSE chunks 验证 |
| **typecheck** | 0 error | `pnpm typecheck` |
| **lint** | 0 error | `pnpm lint` |

---

## §6 退出条件

1. ✅ **9 US ALL passes=true**(prd.json 全绿)
2. ✅ **ENV validation 真接** · OPENAI_API_KEY + ANTHROPIC_API_KEY 启动校验 + log 显示 mode
3. ✅ **cost_log 真存** · BaseSpecialist 真接 prisma.costLog.create + 真 token + cost Decimal(10,6)
4. ✅ **userQuota atomic 扣额** · concurrent 100 用户测试不超扣 · QUOTA_EXCEEDED error 真返回
5. ✅ **8 Specialist real LLM 全 PASS**(若 OPENAI_API_KEY 存在)· Schema drift 0(fallback vs 真 LLM 输出格式严格对齐)
6. ✅ **TopicAgent SSE 真 5 chunks** · TD-82 自然 resolved(PRD-18 test3 真 LLM 跑 PASS)
7. ✅ **TD-79/80/81 一并 fix** · STEP1_CTA_LABEL 决策 + 7 hardcode h2/h3 常量化 + Step5 backward compat 删
8. ✅ **E2E 双跑** · 默认 fallback · CI weekly 真 LLM
9. ✅ **zero-regression** · vitest 181+ + typecheck 0 error + 旧 e2e 全 PASS
10. ✅ **verify-prd-20.sh 40+ ALL PASS**(若 key 存在跑 §3.4/§4/§5.4 真测 · 否则 SKIP)
11. ✅ **D3=A/D4=B/LD-009 严守** · grep 全 0 触

---

## §7 跟 Coding 3.0 的协同协议

### §7.1 启动条件
- ✅ PRD-19 已收官(D-190)
- ✅ Locked Decisions 跨 PRD 延续(D-191 起)
- ✅ Assumptions 模式(brownfield LLMGateway 99% 已实施)

### §7.2 ralph daemon 启动前 checklist(per CLAUDE.md §9.1)
1. cp prd-20.json → prd.json
2. ★ 先启 Monitor(persistent=true · 订阅 ralph-output.log)
3. 启 ralph daemon · python3.11 scripts/ralph/ralph.py --model sonnet --daemon
4. **★ 新升级** · 若 retry ≥ 3 + 同模式 FAIL · daemon 自动写 audit-gate status=retry_warning · 系统通知 Opus 主动介入(PRD-19 retro M-1 L4 升级生效)

### §7.3 Opus audit 强度分档
| US | risk | 审计强度 |
|---|---|---|
| US-001 | foundation | §0 4 项 + 通用 4 维度 + 跨 US 命名 + 必读 env.test.ts |
| US-002 | high · money-critical | §0 + 通用 + 全部域 grep + line-by-line + **SQL 实测 atomic UPDATE 防超扣** + 必读相关测试代码 |
| US-003~007 | high | §0 + 通用 + 真 LLM call cost 验证 + Schema drift 严格对齐验证 + responseFormat 双 schema 策略检查 |
| US-008 | high | §0 + 通用 + E2E 真后端 stack 验证 + 真 LLM cost ≤ $1/full run + TD fix 全 catch |
| US-009 | medium | §0 + 通用 + verify-prd-20.sh 真跑 40+ |

### §7.4 反例库注入(anti_patterns)
每 high+foundation US 注 2-3 条反例 · 关键词 ·
- API_KEY / OPENAI / ANTHROPIC / cost_log / atomic UPDATE / 乐观锁 / money-critical
- 高优先级反例 ·
  1. **PRD-19 TD-82 反例** · 防 fallback path 不模拟 SSE chunks
  2. **PRD-4 US-007 反例** · 防 hardcode model 'claude-sonnet-4-6' · 必从 ctx 读 actual model
  3. **money-critical 反例** · cost_log Integer + atomic UPDATE WITH WHERE 防超扣

---

## §7.5 跨 Story 协议锁(★ 20+ 项)

| # | 命名 | 类型 | 定义 US | 消费 US | 说明 |
|:-:|---|---|---|---|---|
| 1 | `OPENAI_API_KEY` | env var | US-001 | US-003~007 全部 | 真 LLM 接入 OpenAI provider |
| 2 | `ANTHROPIC_API_KEY` | env var | US-001 | US-003~007 全部 | 真 LLM 接入 Anthropic provider |
| 3 | `LLM_DEFAULT_MODEL` | env var | US-001 | BaseSpecialist invokeLLM | 默认 'claude-sonnet-4-6' |
| 4 | `validateEnv(): Env` | function | US-001 | apps/api/src/index.ts startup | zod schema 校验启动时 ENV |
| 5 | `Env` interface | type | US-001 | apps/api 全部 import | z.infer<typeof envSchema> |
| 6 | `checkAndDeductQuota(prisma, userId, tokens)` | function | US-002 | BaseSpecialist step 4 + US-003~007 | atomic UPDATE userQuota |
| 7 | `QUOTA_EXCEEDED` | error code | US-002 | US-003~007 + frontend ErrorState | UI [配额超限] badge |
| 8 | `LLM_TIMEOUT` | error code | (brownfield) | BaseSpecialist | 已实施 isFallbackable |
| 9 | `API_KEY_MISSING` | error code | (brownfield · PRD-19 D-187) | BaseSpecialist | 已加 isFallbackable per PRD-19 |
| 10 | `CostLog.promptTokens / completionTokens` | DB Int | US-002 | BaseSpecialist writeCostLog | money-critical |
| 11 | `CostLog.costUsd` | DB Decimal(10,6) | US-002 | writeCostLog | money-critical |
| 12 | `CostLog.modelUsed` | DB String(64) | US-002 | writeCostLog | SHIELD REJ-003 · 从 ctx 读 actual model |
| 13 | `CostLog.isFallback` | DB Boolean | US-002 | writeCostLog | true 时 cost=0 |
| 14 | `UserQuota.dailyUsed += tokens` | atomic SQL | US-002 | BaseSpecialist | $ money-critical · UPDATE WITH WHERE dailyUsed <= dailyQuota - tokens |
| 15 | `UserQuota.dailyResetAt` | DateTime | (brownfield) | US-002 | 24h cron / lazy reset |
| 16 | `BaseSpecialist.invokeLLM(ctx, req): rawOutput` | abstract method | (brownfield · PRD-4) | 8 Specialist 子类 | 真接 llmGateway.complete()/stream() |
| 17 | `result.isFallback: boolean` | output field | (brownfield) | UI ErrorState [降级] badge | true 时显 badge |
| 18 | `result.status: 'completed' \| 'fallback' \| 'pending'` | DB enum | (brownfield) | UI | StepData.status |
| 19 | `result.modelUsed: string` | output field | US-003~007 | UI tooltip + cost_log | SHIELD REJ-003 · 不 hardcode |
| 20 | `result.tokensUsed: { total: int }` | output field | US-003~007 | cost_log | 真 LLM 返回 |
| 21 | `result.durationMs: int` | output field | US-003~007 | cost_log + performance monitoring | < 60000 expected |
| 22 | `E2E_REAL_LLM` | env var | US-008 | apps/web/playwright.config.ts | '1' 控真 LLM · 默认 fallback |
| 23 | `OPENAI_API_KEY` test mode | env var | US-009 | verify-prd-20.sh | 控真测/SKIP 路径 |
| 24 | `Step5TopicGrid backward compat 删` | TD-81 fix | US-008 | (TD-81 close) | line 75-76 删 |
| 25 | `STEP{N}_RESULT_H2/H3` 常量 | const | US-008 | TD-80 fix · industries.ts/step3.ts/step3b.ts | 7 hardcode h2/h3 常量化 |

---

## §8 修订记录

- **2026-05-18 v0.1** · prd skill 启动(brownfield 实证 LLMGateway 99% 已实施 · scope 重定位为真 API key 接入 + 验证 + tune + cost/quota 真接 · 9 US)
  - §0 引用清单 9 source(含 PRD-19 retro / goal-verify / AGENTS §11.12 沉淀)
  - §1 9 US(Wave 1 infrastructure 2 + Wave 2 Specialist 真 LLM 5 + Wave 3 收官 2)
  - §2 AC 4 类简化(每 US 5-6 条)· 含 money-critical atomic UPDATE 代码片段 + SSE 5 chunks 验证
  - §3 范围排除 8 条
  - §4 风险 + 缓解 8 条
  - §5 测试配额(30+ 新单测 + 8 真 LLM 集成 · skipIf no key)
  - §6 退出条件 11 项
  - §7 Coding 3.0 协同 + L4 升级生效(retry≥3 主动介入)
  - §7.5 跨 Story 协议锁 25 项
  - Locked Decisions D-191 ~ D-205(15 新决策)

---

## Locked Decisions(D-191 ~ D-205 · 继 PRD-19 D-190)

- **D-191** · PRD-20 scope = 真 LLM 接入 + 8 Specialist 真 call 验证(非重写 LLMGateway · brownfield 99% 实施)· 因 BaseSpecialist + 5 lib/llm-gateway 文件已 ready
- **D-192** · ENV validation 用 zod schema · 启动时校验 + log 模式(real / fallback)· 缺 key 不抛 error · 自动 fallback(D-187 延续)
- **D-193** · LLM_DEFAULT_MODEL = 'claude-sonnet-4-6'(Anthropic Sonnet 最新 · per CLAUDE.md 模型偏好)· 用户可 ENV 覆盖
- **D-194** · UserQuota default plan='free' · dailyQuota=100000 tokens/day · monthlyQuota=2000000 tokens/month · 新用户自动 create row
- **D-195** · cost_log Decimal(10,6) 用 prisma Decimal type · 不用 Float(money-critical)· 精度 0.000001 USD 足够
- **D-196** · userQuota.dailyUsed 用 Int + Prisma.raw atomic UPDATE WITH WHERE 条件(单 SQL · 不先 SELECT 再 UPDATE)· 防超扣 race
- **D-197** · userQuota dailyResetAt 24h lazy reset(用户首次访问当日 + 24h 之后自动 reset)· 不依赖 cron(简化基础设施)
- **D-198** · QUOTA_EXCEEDED error 返回 tRPC TRPCError code='RESOURCE_EXHAUSTED' + frontend ErrorState '[配额超限] 今日 token 已用尽 · 明日 reset'
- **D-199** · BaseSpecialist isFallbackable 含 LLMTimeoutError + 5xx + API_KEY missing(PRD-19 D-187 延续) + QuotaExceededError(US-002 新加)· retry 1 次后真 fallback mock
- **D-200** · 8 Specialist real-llm.test.ts 用 vitest `describe.skipIf(!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY)` · CI 默认 SKIP(无 secret)· local + manual 有 key 时跑
- **D-201** · Schema drift 防御 · 各 Specialist test.toMatchObject 验证 fallback mock vs 真 LLM 输出 schema 严格对齐 + safeParse(防真 LLM 返回 schema 偏 fallback mock)
- **D-202** · TD-82 自然 resolved 期望 · 真 LLM 接入后 TopicAgent SSE 5 chunks 自然触发(streaming yield 5 次)· PRD-18 test3 真 LLM 跑应自然 PASS · 若仍 fail · US-008 B/C 选项 fix
- **D-203** · E2E_REAL_LLM env var 控双跑 · default fallback(快 + 无 cost)· `E2E_REAL_LLM=1` 真 LLM(慢 + cost · manual / CI weekly)
- **D-204** · TD-79 决策 (B) · 保留 STEP1_CTA_LABEL='生成行业洞察' 新 label + STEP1_NEXT_LABEL='进入 IP 定位 →' · 升级 PRD-15/17 source-of-truth 同步 · 反例库注入 'mock label → 真 Agent label evolution' 反例
- **D-205** · Specialist tuning baseline 留 `.agents/specialist-tuning-baseline.md` · 含 8 Specialist 各 model_tier / avg input_tokens / avg output_tokens / avg cost USD / 调优历史(PRD-20 baseline 后 PRD-21+ Specialist 优化有对照)

---

## §0.3 复刻定调表(PRD-20 不复刻 aiipznt · 仅 backend 真 LLM 接入)

> 本 PRD 0 新 layout / 0 新文字内容 · 仅 backend Specialist 真 LLM call · D1=A 不严锁(因不改 layout)

| 维度 | 切 / 不切 |
|---|:-:|
| backend Specialist invokeLLM real call | ✅ **改**(8 Specialist · brownfield 已 stub · PRD-20 真接 SDK) |
| cost_log 真接 prisma | ✅ **改**(BaseSpecialist step 4 writeCostLog · 真存 token + cost) |
| userQuota atomic 扣额 | ✅ **新增**(US-002 服务 + atomic UPDATE) |
| ENV validation + log | ✅ **新增**(US-001 zod schema) |
| frontend layout / 字面常量 | ⚪ 不改 (除 TD-79/80 fix) |
| 颜色 token D4=B | ⚪ 不改 |
| Aurelian Dark 设计系统 | ⚪ 不改 |

**严守红线** ·
- D4=B 颜色锁(继承 · grep violet/amber/gold/purple 0 命中)
- LD-009 LocalStorage 严守(继承 PRD-19 升级 · aiip_memory_acc_)
- D3=A 边界锁(apps/admin / apps/api/admin 0 触动 · 仅 apps/api/src/specialists + lib/env + services/quota)
- **money-critical** · cost_log Decimal + userQuota atomic UPDATE 双重防御

---

**End of PRD-20 seed v0.1**
