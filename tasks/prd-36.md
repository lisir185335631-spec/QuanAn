# PRD-36 · R1 正确性四连修（重构战役第一执行批）

> 来源：REFACTOR-PLAN.md R1 批次（2026-06-11 用户批准，方案 A）。
> 背景：knowledge-base 四路机制级梳理实锤 4 个功能正确性问题——它们让平台的"进化飞轮/限流计费/RAG 向量"三大不变量部分失效。本 PRD 只修正确性，不改产品行为、不动 UI。
> Branch：`ralph/prd-36-correctness-quadfix`
> 锁定决策引用：ADR-013（LLMGateway 唯一出口）、LD-007/R-11（ContextAssembler 唯一注入入口）、ADR-010（RLS/隔离）。

## 问题事实（梳理证据）

1. **R-11 绕过**：DeepLearnAgent/PrivateDomainAgent/PresentationAgent/MonetizationAgent 的 `invokeLLM(_ctx, req)` 接收 AssembledContext 但忽略，自建 `_buildSystemPrompt()`——进化档案(L4)/RAG(L5) 对这 4 个 Specialist 无效（证据：apps/api/src/specialists/DeepLearnAgent.ts:107-128 等）。
2. **userId:0 穿透**：23 处 Specialist 调 `llmGateway.complete()` 传 `metadata.userId: 0`，限流桶全用户共享、成本归因失真（证据：PositioningAgent.ts:184 等，TODO 已标 P1）。
3. **embed() 占位**：`workers/llm-gateway/index.ts:249-252` 返回全零向量；真实实现在 workers/embedding 未接通。
4. **静默吞异常**：9 处 `catch(() => {})`（approvals.ts:322,379,414；feature-flag.service.ts:154,192,286,294；approvalGateService.ts:291,358）。

## User Stories（5 个，依赖顺序 US-001→US-002→US-003，US-004/005 收尾并行）

### US-001 SpecialistRequest 增 userId 透传（机械改，先行解锁）
- AC-1: `apps/api/src/agents/base/types.ts` SpecialistRequest 增 `userId: number`（required）
- AC-2: 全部 tRPC 调用处从 `ctx.user.id` 注入；BaseSpecialist.execute→invokeLLM 链路透传
- AC-3: `grep -rn "userId: 0" apps/api/src/specialists apps/api/src/agents` 命中数 = 0
- AC-4: rate-limiter 单测：两个不同 userId 各自独立配额（新增 tests/unit）
- AC-5: typecheck + 既有 unit/integration 全过

### US-002 ContextAssembler 接通 4 个绕过的 Specialist（核心）
- AC-1: DeepLearnAgent/PrivateDomainAgent/PresentationAgent/MonetizationAgent 的 invokeLLM 改为消费 `ctx`（AssembledContext）作为 systemPrompt 基底，模式对齐 CopywritingAgent 等合规实现；各自业务指令并入 assembler 的 specialist 段而非整体替换
- AC-2: 4 个文件中 `_ctx` 下划线弃用参数命名消失；`_buildSystemPrompt` 私有拼装函数删除或降级为 assembler 输入片段
- AC-3: 对应 4 个 judge 测试（tests/judge/）全过——输出质量不回退
- AC-4: 集成测试验证：EvolutionInsight 存在时，4 个 Specialist 的 prompt 中包含进化档案内容（新增断言）

### US-003 llmGateway.embed() 接通真实实现
- AC-1: `workers/llm-gateway/index.ts` embed() 调用 workers/embedding 的 OpenAI 实现（共享其 key 读取），删除全零向量占位
- AC-2: 单测：embed('测试文本') 返回非全零 1536 维向量（无 key 环境 skipIf）
- AC-3: 调用方（RAG 链路）集成测试不回归

### US-004 9 处静默吞异常补日志
- AC-1: 9 处 `catch(() => {})` 全部改为 `catch((e) => logger.warn(...))` 带 trace 上下文（沿用项目现有 logger）
- AC-2: `grep -rn "catch(() => {})" apps/api/src` 命中数 = 0；行为不变（仍不抛出）

### US-005 审计脚本增 R-11 绕过检测（防回潮）
- AC-1: `scripts/audit-redlines.sh` 新增检测：specialists/*.ts 中 `invokeLLM(_ctx` 弃用参数模式 → FAIL
- AC-2: 对修复后代码通过；对人为注入的违例样本 FAIL（脚本自测两个方向）
- AC-3: AGENTS.md §8 audit_commands 同步该检测说明（一行）

## 验收口径（PRD 级出门）
typecheck 全绿 · lint 不新增 error · unit/integration/judge 全过 · audit-redlines.sh（含新检测）通过 · 限流 per-user 人工实测一次。
