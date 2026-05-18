# Specialist Tuning Baseline · PRD-20

> **创建** · 2026-05-18  
> **目的** · PRD-21+ Specialist 优化的对照基线 — 模型选型、token 预算、成本估算、调优历史  
> **来源** · PRD-20 真 LLM 接入实施后归档(US-009 AC-2)  
> **更新规则** · 每次 Specialist 参数调整后追加"调优历史"记录，不覆盖历史行

---

## 模型层映射(LLMGateway MODEL_BY_TIER)

| tier | primary | fallback | cost per 1M tokens (USD) input/output |
|---|---|---|---|
| `reasoning` | `claude-sonnet-4-6` | `gpt-4o` | $3.00 / $15.00 |
| `lightweight` | `claude-haiku-4-5` | `gpt-4o-mini` | $0.25 / $1.25 |
| `fallback`(无 key) | N/A | N/A | $0.00 / $0.00 |

---

## 8 Specialist Baseline

### 1. AnalysisAgent

| 维度 | 值 |
|---|---|
| `agentId` | `AnalysisAgent` |
| `model_tier` | `lightweight` |
| `primary model` | `claude-haiku-4-5` |
| `streaming` | false |
| `timeout_ms` | 30,000 |
| `retry` | 1 |
| 输出特征 | 行业分析结构化 JSON · 短输出 · non-SSE |
| **avg input_tokens 估算** | ~1,500–2,500 tokens(含 system prompt + step1 data) |
| **avg output_tokens 估算** | ~800–1,500 tokens(分析结果 JSON) |
| **avg cost/call 估算** | ~$0.0007–$0.0012 USD |

**Fallback mock 输出对比**

| 维度 | Real LLM | Fallback mock |
|---|---|---|
| 输出格式 | 完整行业分析 JSON | 占位符 `{status: 'fallback', ...}` |
| token 消耗 | 有实际 token 计费 | 0 tokens · model='fallback' |
| cost_log | costUsd 真计算 | costUsd=0.000000 |

**调优历史**

- `2026-05-18` · PRD-20 初始接入 · model_tier=lightweight · 无真实跑数(无 API key 环境) · 基于 ARCHITECTURE.md §6 设计约束

---

### 2. BrandingAgent

| 维度 | 值 |
|---|---|
| `agentId` | `BrandingAgent` |
| `model_tier` | `reasoning` |
| `primary model` | `claude-sonnet-4-6` |
| `streaming` | false |
| `timeout_ms` | 60,000 |
| `retry` | 1 |
| 输出特征 | step3(包装) + step3b(人设) 多 mode · 结构化 JSON |
| **avg input_tokens 估算** | ~2,000–4,000 tokens(含人设/行业/平台上下文) |
| **avg output_tokens 估算** | ~1,500–3,000 tokens(packaging/persona JSON) |
| **avg cost/call 估算** | ~$0.006–$0.012 USD |

**Fallback mock 输出对比**

| 维度 | Real LLM | Fallback mock |
|---|---|---|
| packaging mode | 完整包装方案 5 维度 | `BrandingFallbackTemplate.packaging` 占位 |
| persona mode | 完整人设方案 4 维度 | `BrandingFallbackTemplate.persona` 占位 |
| cost_log | 真 token 计费 | tokens=0 · model='fallback' |

**调优历史**

- `2026-05-18` · PRD-20 US-004 真 LLM 接入 · commit `af17aae` · 首次 Opus 验收通过

---

### 3. CopywritingAgent

| 维度 | 值 |
|---|---|
| `agentId` | `CopywritingAgent` |
| `model_tier` | `reasoning` |
| `primary model` | `claude-sonnet-4-6` |
| `streaming` | true (SSE) |
| `timeout_ms` | 60,000 (SHIELD REJ-006 · 原 45s 超时) |
| `retry` | 1 |
| 输出特征 | step7 文案生成 · SSE 流式 · 长文案 |
| **avg input_tokens 估算** | ~3,000–5,000 tokens(含选题/人设/风格上下文) |
| **avg output_tokens 估算** | ~2,000–4,000 tokens(文案多维度) |
| **avg cost/call 估算** | ~$0.009–$0.019 USD |

**Fallback mock 输出对比**

| 维度 | Real LLM | Fallback mock |
|---|---|---|
| 输出 | SSE 流式多段文案 | `CopywritingFallbackTemplate.step7` 一次性返回 |
| streaming | 真 SSE delta chunks | status='fallback' 非流式 |
| cost_log | 真 token 计费 | tokens=0 · model='fallback' |

**调优历史**

- `2026-05-18` · PRD-20 US-007 真 LLM 接入 · commit `1568d70`
- SHIELD REJ-006: timeout 45s → 60s(长文案生成超时风险)

---

### 4. DiagnosisAgent

| 维度 | 值 |
|---|---|
| `agentId` | `DiagnosisAgent` |
| `model_tier` | `reasoning` |
| `primary model` | `claude-sonnet-4-6` |
| `streaming` | false |
| `timeout_ms` | 60,000 |
| `retry` | 1 |
| 输出特征 | IP 问题诊断 · 结构化 JSON · non-SSE |
| **avg input_tokens 估算** | ~2,500–4,000 tokens(含完整 IP 档案) |
| **avg output_tokens 估算** | ~1,000–2,000 tokens(诊断报告 JSON) |
| **avg cost/call 估算** | ~$0.007–$0.013 USD |

**Fallback mock 输出对比**

| 维度 | Real LLM | Fallback mock |
|---|---|---|
| 诊断报告 | 完整多维度诊断 | 占位符模板 |
| cost_log | 真 token 计费 | tokens=0 · model='fallback' |

**调优历史**

- `2026-05-18` · PRD-20 初始接入 · 无真实跑数(无 API key 环境) · 基于设计约束

---

### 5. LivestreamAgent

| 维度 | 值 |
|---|---|
| `agentId` | `LivestreamAgent` |
| `model_tier` | `reasoning` |
| `primary model` | `claude-sonnet-4-6` |
| `streaming` | false |
| `timeout_ms` | 30,000 |
| `retry` | 1 |
| 输出特征 | 直播方案生成(generate_plan / optimize_script 多 mode) |
| **avg input_tokens 估算** | ~2,000–3,500 tokens |
| **avg output_tokens 估算** | ~1,000–2,500 tokens |
| **avg cost/call 估算** | ~$0.006–$0.010 USD |

**Fallback mock 输出对比**

| 维度 | Real LLM | Fallback mock |
|---|---|---|
| generate_plan | 完整直播方案 | `LivestreamFallbackTemplate.generate_plan` |
| optimize_script | 优化脚本 | `LivestreamFallbackTemplate.optimize_script` |
| cost_log | 真 token 计费 | tokens=0 · model='fallback' |

**调优历史**

- `2026-05-18` · PRD-20 US-007 真 LLM 接入 · commit `1568d70`
- Fallback schema alignment tests: `LivestreamAgent.real-llm.test.ts` 3 mode 全覆盖

---

### 6. MonetizationAgent

| 维度 | 值 |
|---|---|
| `agentId` | `MonetizationAgent` |
| `model_tier` | `reasoning` |
| `primary model` | `claude-sonnet-4-6` |
| `streaming` | false |
| `timeout_ms` | 45,000 |
| `retry` | 1 |
| 输出特征 | step4b 变现策略 · 结构化 JSON |
| **avg input_tokens 估算** | ~2,000–3,500 tokens |
| **avg output_tokens 估算** | ~1,500–2,500 tokens |
| **avg cost/call 估算** | ~$0.006–$0.011 USD |

**Fallback mock 输出对比**

| 维度 | Real LLM | Fallback mock |
|---|---|---|
| 变现方案 | 完整多维度 | `MonetizationFallbackTemplate.default` |
| cost_log | 真 token 计费 | tokens=0 · model='fallback' |

**调优历史**

- `2026-05-18` · PRD-20 US-005 真 LLM 接入 · commit `cf75399`

---

### 7. PositioningAgent

| 维度 | 值 |
|---|---|
| `agentId` | `PositioningAgent` |
| `model_tier` | `reasoning` |
| `primary model` | `claude-sonnet-4-6` |
| `streaming` | false |
| `timeout_ms` | 60,000 |
| `retry` | 1 |
| 输出特征 | step1 行业定位分析 · 结构化 JSON |
| **avg input_tokens 估算** | ~2,500–4,000 tokens |
| **avg output_tokens 估算** | ~1,500–2,500 tokens |
| **avg cost/call 估算** | ~$0.007–$0.012 USD |

**Fallback mock 输出对比**

| 维度 | Real LLM | Fallback mock |
|---|---|---|
| 定位分析 | 完整行业/执行双 mode | `PositioningFallbackTemplate.industry / execution` |
| cost_log | 真 token 计费 | tokens=0 · model='fallback' |

**调优历史**

- `2026-05-18` · PRD-20 US-003 真 LLM 接入 · commit `b9fc739`

---

### 8. TopicAgent

| 维度 | 值 |
|---|---|
| `agentId` | `TopicAgent` |
| `model_tier` | `reasoning` |
| `primary model` | `claude-sonnet-4-6` |
| `streaming` | true (SSE · 5 categories 渐进流出) |
| `timeout_ms` | 60,000 |
| `retry` | 1 |
| 输出特征 | step5 爆款选题 · 5 category × 20 topics · SSE 流式 |
| **avg input_tokens 估算** | ~3,000–5,000 tokens(含 hotElements + scriptTypes 常量 + step1+3b 数据) |
| **avg output_tokens 估算** | ~4,000–8,000 tokens(5 × 20 topics 完整字段) |
| **avg cost/call 估算** | ~$0.018–$0.033 USD (最高成本 Agent · streaming 长输出) |

**Fallback mock 输出对比**

| 维度 | Real LLM | Fallback mock |
|---|---|---|
| 输出 | 5 SSE chunks · 每 chunk 1 category 20 topics | 1 chunk · 仅 traffic category 20 topics · TD-82 根因 |
| streaming | 真 SSE 5 个 delta events | 单次返回(无真 SSE) |
| cost_log | 真 token 计费 | tokens=0 · model='fallback' |
| 5 tab 渐进显示 | ✅ 可测(e2e prd-18 test3) | ❌ 只出 1 tab(TD-82 场景) |

**调优历史**

- `2026-05-18` · PRD-20 US-006 真 LLM 接入 · commit `f968b46`
- TD-82: prd-18 test3(5 tab SSE)加 `test.skip(!HAS_OPENAI_KEY)` · fallback 只出 1 category 是已知限制

---

## PRD-21+ 优化方向参考

| 优先级 | Agent | 建议 | 理由 |
|:-:|---|---|---|
| P1 | TopicAgent | 增加 streaming token 预算监控 | avg cost 最高 · $0.018–0.033/call · 5 categories 长流 |
| P1 | CopywritingAgent | timeout 合理性监控 | 60s 接近边界 · SHIELD REJ-006 历史超时 |
| P2 | AnalysisAgent | 考虑 prompt 缓存 | lightweight tier · 高频调用 · system prompt 可缓存 |
| P2 | BrandingAgent | packaging/persona prompt 分离 | 两 mode 共享 invokeLLM · prompt 过大时考虑拆分 |
| P3 | 全部 | 建立真实 token 分布监控 | 本文档估算均为理论值 · 接入 Sentry/OTel 后用真实 p50/p95 |

---

> **维护说明** · 每次 Specialist 参数变更(model_tier/timeout_ms/retry)后更新对应 Agent 的"调优历史"行 · 追加不覆盖  
> **数据说明** · avg input/output tokens 均为估算值(基于 prompt 模板分析) · 无真实 API key 运行数据 · PRD-21+ 真实跑数后更新
