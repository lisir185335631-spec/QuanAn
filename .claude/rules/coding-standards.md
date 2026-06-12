---
# 从 AGENTS.md §6 下沉（R7 2026-06-12），按需加载
# 触发场景：写代码/提PR/code review时加载
---

## §6.1 命名约定

| 对象 | 风格 | 示例 |
|---|---|---|
| 文件名（模块） | kebab-case | `step-data-router.ts` · `context-assembler.ts` |
| 文件名（React 组件） | PascalCase | `StepHeader.tsx` · `IndustryPicker.tsx` |
| 目录名 | kebab-case | `agents/` · `specialists/` · `llm-gateway/` |
| 变量/函数 | camelCase | `accountId` · `assemblePrompt()` |
| 常量（模块级） | SCREAMING_SNAKE_CASE | `MAX_TIMEOUT_MS` · `DEFAULT_MODEL_TIER` |
| 类型/接口 | PascalCase（无 `I` 前缀） | `SpecialistConfig` · `AssembledContext`（❌不用 `ISpecialistConfig`） |
| 类（包括 Specialist） | PascalCase + 必须含语义后缀 | `CopywritingAgent` · `ContextAssembler` · `LLMGateway` |
| zod schema | PascalCase + `Schema` 后缀 | `CopywritingSchema` · `IpAccountSchema` |
| React Hook | camelCase + `use` 前缀 | `useStepData` · `useActiveAccount` |
| tRPC procedure | camelCase 动词式 | `stepData.save` · `evolution.evolve` |
| DB 表名（prisma） | snake_case 复数 | `step_data` · `evolution_insights`（model 名是 PascalCase 单数 `StepData`） |
| DB 列名 | snake_case | `account_id` · `created_at` · `trace_id` |
| CSS 类（自定义） | kebab-case + 业务前缀 | `aip-card-glow` · `aip-step-header` |
| 测试文件 | `<原文件>.test.ts` | `CopywritingAgent.test.ts` |

## §6.2 Specialist Agent 命名规范（LD-002 强约束）

| 规则 | 例子 |
|---|---|
| 14 个 Specialist 文件名固定 | `src/server/agents/specialists/<Name>Agent.ts` |
| 文件名必匹配 §4.2 表 | ✅ `CopywritingAgent.ts` · ❌ `Step7Agent.ts` |
| 类名必匹配文件名 | `export class CopywritingAgent extends BaseSpecialist` |
| 模式分支用 `mode` 字段·不开新文件 | `mode: 'step7' \| 'free' \| 'boom' \| 'acquisition'` |

## §6.3 文件大小 + 函数大小约束

| 对象 | 上限 | 软建议 | 超出处理 |
|---|:-:|:-:|---|
| 单文件行数 | 500 | 300 | 拆分模块 |
| 单函数行数 | 80 | 40 | 提取子函数 |
| 单类方法数 | 15 | 8 | 拆分类 |
| 单 import 数 | 25 | 15 | 检查耦合 |

⚠️ Specialist 单文件可放宽到 600 行（prompt 模板长 + mode 分支多）·但 prompt 应**外部化到 PROMPTS.md / `src/lib/prompts/<agent>.ts`**

## §6.4 错误处理约定

4 类错误区分：

```typescript
// ① 用户输入错误（4xx）
throw new TRPCError({ code: 'BAD_REQUEST', message: '行业字段必须从 56 个预设中选择', cause: { trace_id } });

// ② 鉴权错误（401/403）
throw new TRPCError({ code: 'UNAUTHORIZED', cause: { trace_id } });
throw new TRPCError({ code: 'FORBIDDEN', cause: { trace_id } });

// ③ 系统错误（5xx）
logger.error({ err, trace_id, agentId }, 'LLM Gateway timeout');
throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '系统繁忙·请稍后再试', cause: { trace_id } });

// ④ Agent 执行降级（可恢复·不抛）
return { ...fallback, is_fallback: true, trace_id };
```

错误处理铁律：

| ✅ 必须 | ❌ 不允许 |
|---|---|
| 所有 catch 必带 trace_id 写日志 | `try { ... } catch {}` 静默吞错 |
| 用户看到的 message 是中文 + 友好 | 直接把 `err.stack` 暴露给用户 |
| 系统错误用 `logger.error` | 生产代码出现 `console.log` |
| Specialist 失败有 fallback 路径 | LLM 失败直接抛 500 |
| EvolutionAgent 失败异步重试 | EvolutionAgent 失败影响用户主流程 |

## §6.5 类型严格度（LD-013 强约束）

tsconfig 必含：

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

类型规则：

```typescript
// ✅ 用 unknown + narrow
function process(input: unknown): MyType {
  if (typeof input !== 'object' || input === null) throw new Error('Invalid input');
  // narrow 后再用
}

// ✅ 用 const + as const（代替 enum）
export const PLATFORMS = ['douyin', 'xiaohongshu', 'shipinhao', 'kuaishou', 'bilibili'] as const;
export type Platform = typeof PLATFORMS[number];

// ✅ zod schema 是真理来源·不重复定义类型
export const StepDataSchema = z.object({...});
export type StepData = z.infer<typeof StepDataSchema>;

// ❌ 不用 TS enum（运行时膨胀 + 难 tree-shake）
enum Platform { Douyin, Xiaohongshu, ... }

// ❌ 不重复定义同一个 type
interface StepData { ... }  // 跟 zod schema 不同步 → bug
```

## §6.6 注释规则（默认 0 注释）

**只在以下情况注释**：
1. 违反默认规则的 hack/workaround（说明绕过原因）
2. 安全约束/业务边界（让下次改的人不踩坑）
3. 跨模块的隐含依赖
4. 性能 hot path 的不直觉优化

**必含注释**：
- `// GLOBAL TABLE`：任何不带 `account_id` 的表
- `// PII`：任何处理 PII 的代码块
- `// RLS auto-filters: where.accountId enforces LD-009`：aggregate/groupBy/count 调用且 accountId 在变量中

```typescript
// ✅ 好注释 WHY
// 必须 reload 整页（不是 invalidate）·因为账号切换涉及 LS namespace 切换·soft 切换会有竞态
window.location.reload();

// ❌ 废注释
// 调用 API
const data = await trpc.stepData.get.query({...});
```

## §6.7 Git Commit 规范（Conventional Commits）

```
<type>(<scope>): <subject>
<body 可选>
<footer 可选·含 trace_id / breaking>
```

| Type | 含义 |
|---|---|
| `feat` | 新功能 |
| `fix` | bug 修复 |
| `refactor` | 不改行为重构 |
| `test` | 加/改测试 |
| `docs` | 文档 |
| `chore` | 构建/依赖升级 |
| `perf` | 性能优化 |

Scope：`agents` · `workflows` · `memory` · `compliance` · `ui` · `hooks` · `lib` · `db` · `cron` · `tests` · `infra`

```
✅ feat(agents): add CopywritingAgent boom mode
✅ fix(memory): plug L4 EvolutionProfile race condition
❌ "update code"  ❌ "WIP"  ❌ "fix bug"
```

一个 commit 一件事：单 commit ≤10 文件·单 PR ≤5 commits·重构 commit 不混 feat/fix

## §6.8 import 顺序（eslint-plugin-import 强制）

```typescript
// 1. Node 标准库
import path from 'node:path';

// 2. 第三方库（按字母）
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

// 3. 别名 import（@/...）
import { llmGateway } from '@/server/workers/llm-gateway';

// 4. 相对 import（../../）
import { BaseSpecialist } from '../base/BaseSpecialist';

// 5. 类型 import（用 import type）
import type { SpecialistInput, SpecialistOutput } from '../base/types';
```

## §6.9 console / debugger 禁用

生产代码禁止 `console.log` / `console.error` / `debugger`。用 `pino logger`：

```typescript
import { logger } from '@/lib/logger';
logger.info({ trace_id, agentId }, 'Specialist started');
logger.error({ trace_id, err }, 'LLM call failed');
```

CI 检测：`grep -rn "console\.\|debugger" src/ --exclude='*.test.ts'` → 命中 reject

## §6.10 魔法数字/字符串

```typescript
// ❌
if (count > 5) { ... }
setTimeout(fn, 30000);

// ✅
const FEEDBACK_THRESHOLD_L2 = 5;
const STEP_DATA_TIMEOUT_MS = 30 * 1000;
if (count > FEEDBACK_THRESHOLD_L2) { ... }
setTimeout(fn, STEP_DATA_TIMEOUT_MS);
```

## §6.11 PR 流程

提 PR 前 Ralph 必跑：

```bash
pnpm typecheck      # tsc 0 error
pnpm lint           # eslint 0 error
pnpm test:unit      # 100% 通过 + 覆盖率 ≥80%
pnpm test:integration
pnpm audit:redlines # §5.6 17 条红线 grep
```

Opus 审计 reject 的 hard fail：

| 失败 | reject 类别 |
|---|:-:|
| §5 任一红线触犯 | hard fail |
| typecheck/lint 失败 | hard fail |
| 单元覆盖率 < 80% | hard fail |
| LLM Judge 评分 < 4.0 | hard fail |
| Schema 跟 ARCHITECTURE/DATA-MODEL 不一致 | hard fail |
| 缺 trace_id 字段 | hard fail |
| Specialist 数 > 14 / 文件名不匹配 | hard fail |
