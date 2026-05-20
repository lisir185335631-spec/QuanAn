# PRD-25 vs PRD-21~24 跨 5 PRD 复盘

> **PRD-25** · LLM 真接入 · 10 page stub → 真 LLM useMutation 替换 + TD-090/091 重审 + TD-095 Validator dev server 配套
> **复盘范围** · PRD-21~25 视觉对齐征程(4 PRD)→ LLM 接入征程(1 PRD)
> **Branch** · `ralph/prd-25-llm-integration`
> **Daemon cycle** · 2026-05-20 BJT
> **Retrospective** · Opus 4.7 · 2026-05-20

---

## §0 数据总览

### §0.1 PRD-21~25 严格一轮通过率趋势(视觉对齐 → LLM 接入征程)

| PRD | 严格一轮 % | 通过/总(dev) | Opus reject | retry | TD 净增 | verify checks | 里程碑 |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| PRD-21 | —(不计收官) | 7/7 | — | 4 | +3 | 45 | 视觉征程起点 |
| PRD-22 | 82% | 9/11 | 2 | 0 | +5 | 52 | 13 baselines |
| PRD-23 | 100% | 9/9 | 0 | 0 | 0(净减) | 58 | 28 baselines · 100% 首次 |
| PRD-24 | 100% | 3/3 | 0 | 0 | 0 | 51 | **32 baselines 达成** |
| **PRD-25** | **100%** | **8/8** | **0** | **0** | **-2** | **40** | **LLM 接入 10 pages 全达成** |

**关键数据点**:
- 🟢 **PRD-25 严格一轮通过率: 100% (8/8 dev US · 0 retry · 0 Opus reject)**
- 🟢 **连续 3 PRD 100% 严格一轮通过率** (PRD-23 + PRD-24 + PRD-25)
- 🟢 **PRD-25 TD 净变化: -2** (关 4 · TD-027/090/091/095 · 开 2 · TD-096/097 design-drift low)
- 🟢 **LLM 接入 10 pages 全达成** · 视觉对齐征程 → LLM 接入征程 完美切换
- 🟢 **DiagnosisAgent 真启用** · 7 维度评分 · isFallback 降级 · AGENTS §11.16 沉淀

### §0.2 PRD-25 8 dev US + 1 收官 详细分布

| US | risk | size | retryCount | Opus reject | 状态 | 核心内容 |
|:-:|:-:|:-:|:-:|:-:|:-:|---|
| US-001 | high | medium | 0 | 0 | ✅ 1iter PASS | DiagnosisAgent 真 LLM 7 维度 |
| US-002 | high | medium | 0 | 0 | ✅ 1iter PASS | VoiceChat subscription streaming |
| US-003 | high | medium | 0 | 0 | ✅ 1iter PASS | DailyTasks AI 任务全套 |
| US-004 | high | medium | 0 | 0 | ✅ 1iter PASS | Evolution AI 洞察 + evolve |
| US-005 | medium | medium | 0 | 0 | ✅ 1iter PASS | AnalysisAgent viral/structural |
| US-006 | medium | medium | 0 | 0 | ✅ 1iter PASS | VideoAgent production/acquisition |
| US-007 | medium | medium | 0 | 0 | ✅ 1iter PASS | LivestreamAgent step8 + smartRecommend |
| US-008 | medium | medium | 0 | 0 | ✅ 1iter PASS | TD-090/091/027/095 重审 + AGENTS §11.16 |
| US-009 | medium | medium | — | — | 收官(本次 retro) | verify + retro + handoff |

**严格一轮通过率**: 8/8 dev US = **100%** — 与 PRD-23/24 并列历史最高 · 但 PRD-25 是 high risk × 4 的 LLM PRD · 含义更重

---

## §1 PRD-25 为什么能 100% 一轮通过？

### §1.1 anti_patterns 注入从"偶发有效"变为"系统有效"

PRD-24 retro 的预测得到验证:

| 注入反例 | 命中 story | 效果 |
|---|---|---|
| `tRPC useMutation onSuccess: () => void utils.xxx.invalidate()` | US-003/004/005/006 | ralph 默认 void 防 unhandled rejection · 0 Opus remind |
| `BaseSpecialist 子类必须实现 invokeLLM` | US-001/005/006/007 | 所有 specialist 1 iter PASS · 无遗忘 invokeLLM |
| `isFallback=true → fallback-banner data-testid` | US-001/003 | Diagnosis/DailyTasks 全有 data-testid=fallback-banner |
| `LLMGateway 用 model_tier 不硬编码` | US-001~007 | 所有 agent 严守 model_tier=lightweight/reasoning · 无硬编码 |
| `SSE streaming: useSubscription 不能用 useMutation` | US-002 | VoiceChat 正确用 useSubscription · 不混用 |

**有效率**: 5/5 关键注入 = 100% · ralph dev 在 SHIELD 段提示下自动避开历史坑

**对比 PRD-22**: 同级别 high risk US · 2 Opus reject(LD-009 + unit test 漏建) → PRD-25 0 reject
**结论**: reject-examples.jsonl 跨 PRD 累积到 50+ 条后 · SHIELD 注入已经改变 ralph 的默认行为

### §1.2 SSE subscription 模式已成熟

US-002(VoiceChat streaming)是 PRD-25 风险最高的 US:
- tRPC subscription 与普通 mutation 是完全不同的调用方式
- 需要 delta chunks 实时渲染 + meta chunk 首发 + done footer
- splitLink 按 op.type==='subscription' 路由(非 httpBatchStreamLink)

**结果**: 1 iter PASS · 0 retry · 0 reject

**关键成功因素**: 
1. AGENTS.md §11.6.4 SSE Specialist 模式已有 PRD-5~20 沉淀
2. VoiceChatAgent.ts 的 `*executeStream()` 生成器协议在 PRD-20 已建立
3. PRD-25 US-002 只需 wire up frontend(useSubscription) · 不需重设计 backend

### §1.3 "小 story 定律"在 LLM PRD 继续有效

PRD-9.6 建立的 large story 禁止规则 + size_hint=medium 最大化:
- PRD-25 全部 8 dev US 都是 medium · 无 large
- 每个 US 专注 1 page 或 1 个明确功能边界
- 最复杂的 US-001(DiagnosisAgent 7维度 + 完整 react wire) 也在 1 iter 完成

**教训延伸**: 即使是 LLM 接入(高风险)·只要 story 粒度控制好 · 1 iter 成功率依然可维持 100%

---

## §2 视觉对齐征程 → LLM 接入征程 转向

### §2.1 里程碑对比

| 阶段 | PRD | 核心成果 | 里程碑 |
|---|:-:|---|:-:|
| 视觉对齐起点 | PRD-21 | aiipznt 克隆 + 导航壳 · 4 baselines | 🟡 |
| 视觉对齐发展 | PRD-22 | 21 page inline refactor · 13 baselines | 🟡 |
| 视觉对齐冲刺 | PRD-23 | 4 工具 stub · 28 baselines · 100% 首次 | 🟢 |
| 视觉对齐收官 | PRD-24 | 3 module 完整化 · **32 baselines 目标达成** | ✅ |
| **LLM 接入** | **PRD-25** | **10 pages 真 LLM · 8 Specialist 解锁 · dev server SOP** | **✅** |

**征程转向标志**:
- 从"stub → 1:1 aiipznt 视觉" → "stub → 真 LLM AI 驱动"
- 视觉层不变 · AI 内容层解锁
- PRD-22 的 TD-090/091(baseline 命名 vs LLM content 差异)在 PRD-25 以数据驱动方式解决

### §2.2 TD-090/091 数据驱动决策价值

PRD-25 US-008 先跑 `prd25-vs-aiipznt-llm.md` 12 page diff 再决策:
- **TD-090**(baseline 命名): 保持内部回归(选项B) · AI 内容差异 > naming 差异
- **TD-091**(单列 vs 双栏): 保留单列 · LLM 接入后内容差异远大于 layout 差异

**教训**: TD 数据驱动决策(先看实测数据再 approve/reject)比直觉判断更准确 · 避免了 "照搬 aiipznt layout"后内容对不上的尴尬

---

## §3 TD 净变化分析

### §3.1 PRD-25 关闭的 4 个 TD

| TD | 类别 | 关闭方式 | 关闭证据 |
|---|---|---|---|
| TD-027 | process-gap | tests/judge/voice-chat.judge.ts mock 修复 | @vitest/llm-mock 模式替代 full import |
| TD-090 | design-drift | 数据驱动决策: baseline 保持内部回归 | prd25-vs-aiipznt-llm.md §3 决策 |
| TD-091 | design-drift | 数据驱动决策: 单列布局保留 | prd25-vs-aiipznt-llm.md §4 决策 |
| TD-095 | process-gap | ralph.py _spawn_dev_server + VALIDATOR.md §X | scripts/ralph/ralph.py + VALIDATOR.md 到位 |

### §3.2 PRD-25 新增的 2 个 TD

| TD | 类别 | 严重性 | 原因 |
|---|---|---|---|
| TD-096 | design-drift | low | apps-web .planning/codebase/ 事实层从未建立 |
| TD-097 | design-drift | low | apps-api 事实层 2026-05-13 快照 · PRD-25 后 stale |

**净变化**: **-2 TD** · 说明 PRD-25 的 TD 清理速度(4 close)快于新 TD 产生速度(2 new)

---

## §4 反例库注入有效率分析

### §4.1 命中统计

PRD-25 US-001~007 high/medium stories 的 anti_patterns 注入:
- **注入总数**: ~15 条(高风险 US ≤ 3 条 · 中风险 US 2 条)
- **有效命中**: 5 大类注入全部在 ralph 实现中体现 · 0 Opus 因注入点 reject

### §4.2 有效率判定标准

| 判定 | 标准 | PRD-25 数据 |
|---|---|---|
| 命中(positive) | ralph 实现符合注入期望 · Opus 不需 remind | 5/5 关键注入点 |
| 未命中(negative) | Opus 因注入点 reject · ralph 重做 | 0 件 |
| 中性 | 注入点 ralph 没遇到 · 无法判断 | - |

**有效率**: 5/5 = **100%** (based on observable hits) — 但绝对数量小 · 需持续跨 PRD 验证

### §4.3 reject-examples.jsonl 状态

- PRD-25 前: ~50 条(seed 35 + PRD-21~24 累积 ~15)
- PRD-25 后: ~50 条(PRD-25 0 reject · 无新反例入库)
- **含义**: PRD-25 质量足够高 · 无新反例产生 → 反例库的预防价值体现

---

## §5 Playbook 提炼(≥ 3 条 · 跨 PRD 可迁移)

### Playbook-P25-001: LLM 接入三层隔离原则

**背景**: PRD-25 10 pages LLM 接入全部成功 · 核心是三层隔离严守

**原则**:
```
前端层: trpc.{router}.{procedure}.useMutation() / useQuery() / useSubscription()
         ↓ tRPC schema 隔离
后端 router 层: ctx.prisma / {agent}.execute() / isFallback 降级
         ↓ BaseSpecialist 接口隔离
Specialist 层: this.llmGateway.complete() / .completeStream() · 不 import SDK
```

**规则**:
- 前端永远不知道 LLM provider · 只知道 tRPC procedure 名字
- router 永远通过 agent.execute() · 不直接调 llmGateway
- specialist 永远通过 this.llmGateway · 不 import openai SDK
- 违反任意一层 → R-001 红线 · 即时 Opus reject

**PRD-26+ 应用**: 每个新 LLM feature 都走三层隔离 · Opus audit D1=A 检查三层是否严守

### Playbook-P25-002: isFallback 降级模式标准范式

**背景**: PRD-25 建立了 DiagnosisAgent + DailyTasks 的 isFallback 处理模式

**范式**:
```tsx
// 前端: isFallback=true 时显示 fallback hint banner · 不 throw · 不 error toast
{data.isFallback && (
  <div data-testid="fallback-banner" className="...">
    AI 分析暂时不可用 · 已显示预估结果
  </div>
)}
```

**规则**:
- `isFallback=true` 必须显示 data-testid=fallback-banner · 不能静默忽略
- fallback 时 UI 正常渲染 stub/default 数据 · 不 hide · 不 error state
- Opus audit MUST 检查 data-testid=fallback-banner 是否存在
- 每个调 specialist.execute() 的 page 都需要 isFallback 处理

**AGENTS §11.16.2 沉淀**: 已写入 AGENTS.md 作为 PRD-26+ 红线

### Playbook-P25-003: dev server 生命周期管理

**背景**: TD-095(RCA-004 配套) · 2026-05-20 · Validator 浏览器测试频繁 connect refused

**范式**:
```bash
# ralph daemon 启动: 自动 fork pnpm dev
python3 scripts/ralph/ralph.py --model sonnet --daemon
# (--with-dev-server 默认开启 · pid 写 dev-server.pid · atexit SIGTERM)

# Validator 调 browse/playwright 前: 必先 curl 健康检查
curl -s http://localhost:5173 > /dev/null && echo "ok" || echo "NOT READY"
```

**规则**:
- Validator 调 browse 前 **必须** curl localhost:5173 健康检查
- 未就绪 retry ≤6 次 · 彻底失败写 SUSPECTED:dev_server_unavailable
- 不允许 Validator 直接 goto URL 不检查 · 会导致 connect refused 浪费 iter
- `--no-dev-server` 仅在已有 dev server 时使用 · 长跑 daemon 默认开启

**PRD-26+ 应用**: 所有含 e2e/browse 的 story 都遵循此 SOP

### Playbook-P25-004: tRPC subscription splitLink 配置

**背景**: VoiceChat streaming 实现发现 · `httpBatchStreamLink` 不支持 subscription

**范式**:
```ts
// apps/web/src/lib/trpc.ts — splitLink 配置
splitLink({
  condition: (op) => op.type === 'subscription',
  true: httpSubscriptionLink({ url: `${API_URL}/trpc` }),
  false: httpBatchStreamLink({ url: `${API_URL}/trpc` }),
})
```

**规则**:
- subscription 必须走 httpSubscriptionLink · 不能用 httpBatchStreamLink
- splitLink 按 op.type==='subscription' 路由 · 其余走 batch
- frontend useSubscription hook 对应 backend `*async generator` procedure
- 测试 subscription: 需 mock 整个 useSubscription · 不能用 useMutation mock 替代

**AGENTS §11.6.4 沉淀**: 已写入 SSE Specialist 模式 § (PRD-5~25 积累)

### Playbook-P25-005: 数据驱动 TD 决策(TD-090/091 经验)

**背景**: PRD-22 遗留 TD-090/091 · 等到 LLM 接入后(PRD-25)才有足够数据决策

**范式**:
```
1. 不在遗留 TD 上"猜"正确方案
2. 等到有实测数据时(LLM 接入后 diff 实验)再决策
3. 先跑 verify-prd-25-vs-aiipznt-llm.sh 12 page diff
4. 看数据: AI 内容差异 >> layout 差异 → 保留单列(选项 B 数据驱动)
5. 写决策报告 .agents/verification/prd-25-vs-aiipznt-llm.md
```

**规则**:
- "数据驱动 TD" 类: 先收集 before/after 数据 · 再 approve/reject
- 不要凭直觉 resolve design TD · 等有实测数据
- 决策报告写明: 选项 A/B/C + 数据依据 + 最终选择 + 理由

---

## §6 下一步建议 (PRD-26+)

### §6.1 admin 子系统优先级

**PRD-26** 应该是 admin 子系统启动:
- PRD-10~14 建立的 admin 基础 · 但前端 admin 未做视觉完整化
- admin evaluation 功能(LLM Judge)在 PRD-25 TD-027 fix 后可完整化
- admin 用户管理 · 权限 · 审计日志 UI 需完善

**建议**: PRD-26 = admin evaluation 完整化 + admin UI 视觉补齐

### §6.2 多用户压测

LLM 接入后的并发场景未测:
- 多用户同时调 DiagnosisAgent(高 CPU · model_tier=reasoning)
- VoiceChat subscription 并发 SSE 连接数限制
- BullMQ DailyTask 并发队列处理

### §6.3 移动端响应式 polish

PRD-25 前端在 mobile 视图的 LLM 结果展示可能有断行/溢出问题 · 未专门测

### §6.4 PRR(Production Readiness Review)

主开发完成后需:
- 域名 quanan.com + ICP 备案
- Google OAuth / 微信 OAuth 正式申请
- 生产 LLM API Key 配置
- Sentry / OTel 监控接入
- 压力测试(k6 / artillery)

---

## §7 本次 retro 的 3 大收获

1. **100% 连续 3 PRD** 是历史性成就 · 对于 LLM 接入 PRD(high risk × 4)维持 100% 说明整个 Coding 3.0 流程已达到工程成熟度
2. **反例库注入 100% 有效** · ralph 的"默认行为"因 50+ 反例积累已经质变 · 不再需要 Opus remind 基础 pattern
3. **视觉 → LLM 征程切换完美** · 32 baselines 是视觉质量锁 · LLM 接入是 AI 功能锁 · 两者并行维持 · 为 PRD-26+ admin/评估阶段奠定基础
