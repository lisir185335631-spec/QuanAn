# QuanAn · 架构决策记录(ADR.md)

> **版本** · v0.3(2026-05-06 创建 · 2026-05-07 v0.2 修订:加 ADR-019 monorepo / ADR-020 双 daemon / ADR-021 admin 独立部署 · 2026-05-23 v0.3 修订:加 ADR-022 OKLCH token 切换路 α)
> **角色** · 把 [AGENTS.md §3](AGENTS.md) 的 18 条 Locked Decisions 展开成完整决策记录（并补充 ADR-019~022，现共 22 条）
> **格式** · 每条 ADR 含 `Status / Context / Options / Decision / Consequences / Implementation / References`
> **配套** · [ARCHITECTURE.md](ARCHITECTURE.md) · [AGENTS.md](AGENTS.md) · [DATA-MODEL.md](DATA-MODEL.md) · [PROMPTS.md](PROMPTS.md)

---

## ADR 索引

| # | 标题 | 关联 LD | 范畴 | Status |
|:-:|---|:-:|:-:|:-:|
| ADR-001 | **编排范式 · 95% Workflow + 5% Agent** | LD-001 | 架构 | Accepted |
| ADR-002 | **三层编排架构 L4-L7 分层** | LD-001 | 架构 | Accepted |
| ADR-003 | **Specialist 切分按"能力域"+ BaseSpecialist 五层配置** | LD-002 / LD-005 | 架构 | Accepted |
| ADR-004 | **协作模式选 Centralized + 软 Supervisor** | LD-003 | 架构 | Accepted |
| ADR-005 | **3 个 L5 自治 Agent 走 ADR-018 外部 Orchestrator** | LD-004 | 架构 | Accepted |
| ADR-006 | **五层记忆 · 用 Trending Cache 替换 Summarizer/Portrait** | LD-006 | 记忆 | Accepted |
| ADR-007 | **ContextAssembler 是 prompt 注入唯一入口(Context 投影模式)** | LD-007 | 记忆 | Accepted |
| ADR-008 | **反馈飞轮 5 阶段闭环 · Issue Flywheel 范式** | LD-008 | 记忆 | Accepted |
| ADR-009 | **EvolutionProfile 账号级而非用户级** | LD-008 | 记忆 | Accepted |
| ADR-010 | **多账号数据隔离 3 道闸(ORM + RLS + 命名空间)** | LD-009 | 数据 | Accepted |
| ADR-011 | **LS↔DB 双写 4 规则 + 切账号 reload+预热** | LD-010 | 数据 | Accepted |
| ADR-012 | **RAG 边界 · 30KB 常量 import + pgvector 复用主库** | LD-011 | 数据 | Accepted |
| ADR-013 | **LLM Gateway 是唯一 LLM 调用入口(限流/熔断/降级/计费)** | LD-012 | 接口 | Accepted |
| ADR-014 | **zod 全栈校验 + trace_id 贯穿 + 类型严格 · 错误恢复 + 原子事务** | LD-013 / LD-014 | 接口 | Accepted |
| ADR-015 | **Aurelian Dark 设计系统 · YAML 权威 · 弃用 aiipznt 赛博青** | LD-015 | 视觉 | Accepted |
| ADR-016 | **测试金字塔 5 层 + LLM-as-Judge + 80% 覆盖率** | LD-016 | 质量 | Accepted |
| ADR-017 | **trending 抓取走第三方授权 · 严禁自建爬虫** | LD-017 | 法律 | Accepted |
| ADR-018 | **行业合规 + PII 脱敏(医疗/法律/金融自动免责)** | LD-018 | 合规 | Accepted |
| ADR-019 | **前后端分离 + monorepo workspace**(2026-05-07 v0.2 新增 · 对应 REVIEW P0-3 + P1-7) | — | 工程 | Accepted |
| ADR-020 | **Approval Gates 高风险操作两步审批**(2026-05-07 v0.2 新增 · 对应 REVIEW P1-4) | — | 安全 | Accepted |
| ADR-021 | **管理后台独立 first-class 子系统**(2026-05-07 v0.2 新增 · 对应 REVIEW P0-1 根因 + 硬约束#2 #3) | — | 拓扑 | Accepted |
| ADR-022 | **globals.css 全量 OKLCH token 切换路 α**(2026-05-23 · D4=B 推翻 · PRD-29 US-001a · commit 4dc30f2 · **实施完成** · PRD-29.6 button wiring 验证) | PRD-29/29.6 | 视觉 token | Accepted |

---

## ADR-001 · 编排范式 · 95% Workflow + 5% Agent

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-001
> **范畴** · 架构基础(顶层范式选择)
> **派生自** · [ARCHITECTURE.md §4.1](ARCHITECTURE.md) · [reference/PI-Agent设计哲学/03 Workflow与Agent二分法](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md)

### Context

QuanAn 是 AI 驱动的 IP 孵化平台 · 含 9 步主向导 / 14 工具页 / 6 新模块 / 反馈飞轮 共 ~30 个节点。每个节点要决定:

* 用户每次操作 LLM 调几次?
* LLM 自己决定下一步还是用户决定?
* 是单次输入→输出还是多轮交互?

业界两个典型范式(Anthropic 官方提出):
* **Workflow** · 预定义代码路径 · 用户主动推进 · 单次 LLM
* **Agent** · LLM 动态决策 · 多轮交互 · 自主选下一步

如果全用 Workflow · 简单但失去动态智能;如果全用 Agent · 复杂且 token 失控。**必须按节点分类决策**。

### Options

| 方案 | 范式分布 | 实现复杂度 | Token 成本 | 用户体验 |
|---|---|:-:|:-:|---|
| A · 全部 Workflow | 100% / 0% | 低 | 可控 | 一致(loading→出结果) |
| B · 全部 Agent | 0% / 100% | 极高 | 失控 | 流式 · 可能 confusing |
| C · 主流程 Workflow + 关键 Agent(本案) | 95% / 5% | 中 | 可控 | 主流程一致 + 自治节点流式 |
| D · 50/50 平衡 | 50% / 50% | 高 | 偏高 | 不一致 |

### Decision

**选 C · 95% Workflow + 5% Agent**。

判断依据(决策树见 [AGENTS.md §4.1](AGENTS.md)):
* **触发主体是用户** + **单次 LLM 完成** → Workflow(占 95%)
* **触发主体是系统/Cron/多轮** + **LLM 自主选下一步** → Agent(占 5%)

具体分类:
* 9 步向导 / 14 工具页 / 8 步诊断 / 反馈写入 = **Workflow**(用户主动 + 单次 LLM)
* VoiceChatAgent(用户驱动多轮)/ EvolutionAgent(Cron+反馈触发)/ DailyTaskAgent(0 点 Cron) = **Agent**(共 3 个 L5 自治)

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 实现复杂度 | 95% 节点是单次 LLM · 可用模板方法快速展开(BaseSpecialist) |
| ✅ Token 成本可控 | 单用户日均 < $0.5(详见 ARCHITECTURE §9.12b) |
| ✅ 测试简单 | Workflow 是 input→output · 单元测试快照对比即可 |
| ✅ 失败恢复简单 | Workflow 失败重试 1 次 · 不需要"续命循环" |
| ⚠️ Agent 节点要专门设计 | 3 个 L5 必须用 ADR-018 外部 orchestrator · 不能等 LLM 自循环 |
| ⚠️ 不能给"创意发散"节点用 Workflow | 如果产品后期想加"AI 自主优化人设"功能 · 必须开新 ADR 转 Agent |

### Implementation Notes

* Specialist `execute()` 方法**禁止**循环调 LLM(检测见 [AGENTS.md §8.4 LD-001](AGENTS.md))
* 唯三 L5 自治 Agent 必须由外部触发器(bullmq / Cron / 用户输入)启动 · 不允许 Specialist 主动唤醒自己
* 反馈飞轮虽然涉及多步(生成→反馈→跑批→注入)· 但每步是独立 Workflow · 不算 Agent

### References

* Anthropic Building Effective Agents · 2024 - 2025
* [reference/PI-Agent设计哲学/03 Workflow与Agent二分法](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md) §6.5 业务拆分 10 实例
* ADR-002(三层编排)· ADR-005(L5 自治)是本 ADR 的下游展开

---

## ADR-002 · 三层编排架构 L4-L7 分层

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-001(衍生)
> **范畴** · 架构基础(模块分层)
> **派生自** · [ARCHITECTURE.md §1.4 + §4.2](ARCHITECTURE.md) · [11/02 八 Agent 配置](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md)

### Context

ADR-001 决定了"95% Workflow + 5% Agent" · 但具体怎么落到代码层?需要回答:

* tRPC procedure / Specialist Agent / Worker 是同一层吗?
* 谁调谁?顺序?
* 测试边界在哪?

业界知识库参考:
* 11/02 八 Agent 是 Pipeline 模式(8 Agent 同层 + Pipeline 编排)
* 02 多 Agent 协作架构提了 Centralized / Pipeline / Star 等多种

QuanAn 不是 Pipeline(每用户操作只调 1 个 Specialist) · 但仍需明确层次。

### Options

| 方案 | 层数 | 特征 |
|---|:-:|---|
| A · 单层(全平铺) | 1 | 简单 · 但耦合严重 |
| B · 双层(API + Agent) | 2 | 不分 Agent 与 Worker · 工具调用混乱 |
| C · 三层(Workflow / Specialist / Worker) | 3 | 适合 11/02 类 Pipeline |
| D · 四层(本案) | 4 | L4-L7 · 加了 L5 自治层(独立于 L6 Specialist) |

### Decision

**选 D · 四层 L4-L7**:

```
L4 · Workflow Command(用户主动入口 · tRPC procedure)
L5 · Agent 自治(LLM 决策密集 · VoiceChat / Evolution / DailyTask)
L6 · Specialist(14 个能力域 · 单次 LLM)
L7 · Deterministic Worker(无 LLM 工具)
```

跟 ARCHITECTURE.md §1.4 9 层架构里的 L4-L7 完全对应。

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ Workflow 跟 Agent 分开 | L4 是用户主动 · L5 是系统/多轮 · 不混淆 |
| ✅ Specialist 跟 Worker 分开 | L6 含 LLM · L7 不含 · 测试和监控边界清楚 |
| ✅ 跨层调用单向 | L4 调 L5 调 L6 调 L7 · 反向禁止(详见 AGENTS §4.5) |
| ⚠️ 4 层比 3 层多 1 个边界 | 团队需要清楚 L5 vs L6 区别(用户驱动多轮 vs 单次) |
| ⚠️ 3 个 L5 Agent 需独立设计 | 不能复用 BaseSpecialist 模板 · 详见 ADR-005 |

### Implementation Notes

* `src/server/agents/` 下分 `base/` / `specialists/` / `autonomous/`(可选)三个子目录
* Specialist 文件命名严格(LD-002) · L5 文件名同样有命名约束(VoiceChatAgent / EvolutionAgent / DailyTaskAgent)
* L7 Worker 全部放 `src/server/workers/` · 不允许放在 agents/ 下

### References

* ADR-001(范式选择前置)
* ADR-003(Specialist 切分细节)
* ADR-005(L5 自治范式)
* [ARCHITECTURE.md §4.2](ARCHITECTURE.md)
* [11/02 八 Agent 配置 §3 BaseAgent](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md)

---

## ADR-003 · Specialist 切分 · 14 能力域 + BaseSpecialist 五层配置

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-002 · LD-005
> **范畴** · 架构基础(组件切分)
> **派生自** · [ARCHITECTURE.md §4.3 + §7.6](ARCHITECTURE.md) · [11/02 八 Agent](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md) · [05-vertical/02 爆款文案](../Ai_Agent/knowledge-base/05-vertical-solutions/02-viral-copywriting-agent/)

### Context

ADR-001 + ADR-002 定了"95% Workflow / L6 Specialist 是 LLM 调用核心" · 现在要决定:

* 14 工具 + 9 步 + 6 新模块 + 反馈飞轮 = ~30 个潜在切点 · 切多少个 Specialist?
* 怎么切?按 URL 一对一 / 按角色 / 按能力域?
* Specialist 接口怎么统一?

知识库 11/02 给了 8 Agent(细粒度 · 流水线工序) · Paperclip 给了 4 Agent(角色化 · 公司组织)。两者都不完美适配。

### Options

| 方案 | 数量 | 切分依据 | 共享性 | 维护成本 |
|---|:-:|---|---|:-:|
| A · URL 一对一 | 23+ | 每个页面 1 Specialist | 0% | **极高** · 23 个 prompt 模板 |
| B · 角色化(Paperclip 风格) | 4 | CEO/CMO/Engineer/Reviewer | 高 · 但模糊 | 中 |
| C · 流水线工序(11/02 风格) | 8 | 每个 Agent 干 1 件小事 | 0% · Pipeline 协作 | 中 |
| D · 能力域(本案) | **14** | 输入字段 + 输出物相似性归并 | **高** · 4 入口共享 1 Specialist | 中 |

### Decision

**选 D · 14 个能力域 Specialist**(11 生成型 + 3 自治型)· 详细清单见 [AGENTS.md §4.2](AGENTS.md)。

切分用 5 个原则(详见 ARCHITECTURE §7.6):
1. 输出物相似 → 归并(step7+generate+boom+acquisition → CopywritingAgent)
2. 输入字段重叠 ≥ 70% → 归并(step3+step3b → BrandingAgent)
3. 生成型 / 分析型 / 写记忆型 → 跨类型不归并
4. L5 自治型独立(VoiceChat / Evolution / DailyTask)
5. 纯 CRUD / 静态页 → 不算 Specialist

**统一接口** · 全部 14 Specialist 继承 `BaseSpecialist`(模板方法模式)· 必须声明 `SpecialistConfig`(persona / memory / knowledge / tools / execution 五层)。借鉴 11/02 §3 BaseAgent 模板 + §4 五层配置体系。

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 14 个 prompt 模板 · 维护可控 | 比 23 个少 39% · 比 4 个粒度更精 |
| ✅ 共享性高 · 改一处 4 入口都生效 | 例 · 改 CopywritingAgent prompt 立即影响 step7+generate+boom+acquisition |
| ✅ 五层配置统一 | 新 Specialist 加入只需填 config + execute() · 模板方法处理 trace / 日志 / 错误 |
| ⚠️ Mode 分支让 prompt 复杂 | CopywritingAgent 4 mode + 20 scriptType + 22 element 组合爆炸 · 需精心设计 |
| ⚠️ 14 是上限 | 加 15+ 必须开新 ADR 论证 · 否则维护成本指数上升 |

### Implementation Notes

* Specialist 文件命名严格 · 14 个文件名固定(对照 [AGENTS §4.2](AGENTS.md))
* 文件内必须 `extends BaseSpecialist` + `export const config: SpecialistConfig`
* Mode 分支用 `mode: 'free' | 'boom' | ...` 字段 · 不开新文件
* Prompt 模板放 `src/lib/prompts/<agent>/<mode>.ts` · 不放 Specialist 文件内(Specialist 单文件 ≤ 600 行)
* BaseSpecialist `run()` 模板方法处理 · 输入校验 / ContextAssembler 调用 / 异常捕获 / 耗时统计 / 日志
* 子类只需实现 `execute(input, ctx)`

### References

* ADR-001 / ADR-002(前置)
* ADR-005(L5 自治型怎么处理)
* [11/02 §3 BaseAgent + §4 五层配置](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md)
* [05-vertical/02 爆款文案](../Ai_Agent/knowledge-base/05-vertical-solutions/02-viral-copywriting-agent/)(同领域 · 不同流程 · 借知识不借形态)
* [ARCHITECTURE.md §7.6 14 是甜点](ARCHITECTURE.md)

---

## ADR-004 · 协作模式 · Centralized + 软 Supervisor

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-003
> **范畴** · 架构基础(Specialist 间协作)
> **派生自** · [ARCHITECTURE.md §4.6 + §7.3](ARCHITECTURE.md) · [02 多 Agent 协作架构](../Ai_Agent/knowledge-base/02-multi-agent-collaboration-architecture/)

### Context

ADR-003 决定了 14 个 Specialist · 但它们之间怎么协作?

知识库 02 列了 5 种协作模式:Centralized Supervisor · Decentralized Swarm · Hierarchical · Pipeline · Star。每种有适用场景。

QuanAn 的场景特征:
* 用户每次操作只触发 1 个 Specialist · 不需要"多 Agent 共同处理一个请求"
* Specialist 之间的"协作"实际是**通过共享 stepData**(L2 Core Memory)间接传递
* 9 步主线虽然有顺序依赖 · 但流转是用户主动控制(点按钮)· 不是 Agent 决定

那么是否还需要 Supervisor?

### Options

| 方案 | 协作模式 | Supervisor 角色 | 适配度 |
|---|---|---|:-:|
| A · 无 Supervisor · Specialist 自由互调 | Decentralized Swarm | 无 | ❌ 业务场景不需要 Specialist 互调 |
| B · LLM Supervisor 路由(11/02 风格) | Centralized + LLM | LLM 决策路由 | ❌ 用户已经驱动路由(点按钮)· LLM Supervisor 多余 |
| C · 软 Supervisor(本案) | Centralized + 确定性服务 | 无 LLM 服务(IPProgressService + ContextAssembler) | ✅ 用户驱动 · 软 Supervisor 处理上下文组装 |
| D · Pipeline 串行 | Pipeline | 静态编排器 | ❌ 用户不要"端到端一键跑" · 是工具集 |

### Decision

**选 C · Centralized + 软 Supervisor**:
* **0 个 LLM Supervisor** · 不在 Specialist 之间用 LLM 路由
* **2 个软 Supervisor**(无 LLM 的确定性服务):
  - **IPProgressService** · 跟踪 9 步进度 · 服务于 /ip-plan / /daily-tasks / /evolution
  - **ContextAssembler** · 调用前组装 prompt 上下文 · 是隐形协作枢纽
* **Specialist 间 0 直接调用** · 所有"协作"通过 ContextAssembler 共享 stepData / EvolutionProfile

详细论证见 [ARCHITECTURE.md §7.3](ARCHITECTURE.md)。

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 编排简单 | 用户驱动主流程 · 没有"Agent 决策错误导致流转混乱"的风险 |
| ✅ 测试简单 | Specialist 单元测试无需 mock 其他 Specialist |
| ✅ Token 成本可控 | 没有 LLM Supervisor 的额外调用 |
| ✅ ContextAssembler 是隐形枢纽 | 改一次 ContextAssembler 全部 14 Specialist 立即受益 |
| ⚠️ Specialist 互不知道 | 不能利用"另一个 Specialist 刚生成的内容" — 必须落到 stepData / history 才能跨 Specialist 共享 |
| ⚠️ 需要软 Supervisor 设计精度 | ContextAssembler 是单点 · 性能 + 正确性都要重点保障(详见 ADR-007) |

### Implementation Notes

* Specialist `execute()` 不允许 import 其他 Specialist(LD-003 / R-2 强制 grep 检测)
* IPProgressService 是纯算法 · 在 `src/server/agents/base/ip-progress-service.ts`
* ContextAssembler 是协作枢纽 · 详见 ADR-007
* 反馈飞轮虽涉及多个 Specialist 数据(history + feedback) · 但是异步通过 EvolutionAgent 聚合 · 不算 Specialist 互调

### References

* ADR-003(前置 · 14 切分)
* ADR-007(ContextAssembler 详细设计)
* ADR-008(反馈飞轮跨 Specialist 协作的另一条路径)
* [02 多 Agent 协作架构](../Ai_Agent/knowledge-base/02-multi-agent-collaboration-architecture/)(5 种模式对比)
* [ARCHITECTURE.md §7.3 + §1.5](ARCHITECTURE.md)

---

## ADR-005 · 3 L5 自治 Agent · 外部 Orchestrator

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-004
> **范畴** · 架构基础(L5 自治范式)
> **派生自** · [ARCHITECTURE.md §4.4](ARCHITECTURE.md) · [reference/PI-Agent设计哲学/03 第 4 节"LLM 不会自己循环"](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md) · 全局 ADR-018 外部 Orchestrator

### Context

ADR-001 把 5% 节点划为"Agent" · 共 3 个:
* **VoiceChatAgent** · 多轮对话 · 用户驱动
* **EvolutionAgent** · 反馈聚合 · Cron + 阈值触发
* **DailyTaskAgent** · 任务生成 · 0 点 Cron 跑批

这三个 Agent 跟 11 个 Specialist 不一样:它们不是"input→output 单次调" · 而是"持续运行 / 周期触发"。

知识库的关键判断(reference/PI/03 第 4 节):
> **LLM 不会自己循环**。必须由外部 orchestrator 通过事件 / Cron / 用户输入触发下一轮。

那么这 3 个 Agent 怎么"循环"?

### Options

| 方案 | 实现方式 | 风险 |
|---|---|---|
| A · LLM 自循环(`while(!done)`) | Specialist 内部 while 循环调 LLM 直到自己说"done" | ❌ Token 失控 · LLM 可能死循环 · 状态丢失 |
| B · 服务进程驻留 | 单独 Node 进程跑 EvolutionAgent · 自循环 | ❌ 故障恢复难 · 多账号并发难管理 |
| C · 外部 Orchestrator(本案) | bullmq 任务队列 + Cron + 用户事件触发 · 每次"唤醒"是新 Specialist 调用 | ✅ 跟全局 ADR-018 一致 · Coding 3.0 Ralph 同款 |
| D · LangGraph StateGraph | 用 LangGraph checkpointer + StateGraph | 重型 · 不需要;违反 §2 技术栈锁定 |

### Decision

**选 C · 外部 Orchestrator 模式** · 跟全局 ADR-018 完全一致(Ralph 续命也用此模式)。

每个 L5 自治 Agent 的"触发器":

| Agent | 触发器 | 状态持久化 |
|---|---|---|
| **VoiceChatAgent** | 用户每说一句(STT 转文字 → tRPC 流式调) | Redis L1 Buffer(turns list · TTL 30min) |
| **EvolutionAgent** | bullmq queue · 触发条件:① 累计反馈 ∈ {5/20/50/100} ② 用户主动点 ③ 周 Cron ④ deepLearn 上传新样本(可选) | DB · feedback_log · evolution_profile · evolution_insight |
| **DailyTaskAgent** | node-cron 每日 0:00 触发 · per-account fan-out | DB · daily_task 表(per-account · per-day) |

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 跟 Coding 3.0 哲学一致 | Ralph + 本架构都用外部 Orchestrator · 团队学一次概念 |
| ✅ 故障恢复简单 | 任务跑挂了 · bullmq 重试 · DB 状态保留 · 无需复杂 checkpoint |
| ✅ 多账号并发友好 | bullmq 自然分片 · 每个 account 独立任务 |
| ✅ 可观测 | 每次"唤醒"有独立 trace_id · 跟 Workflow 一致 |
| ⚠️ 不能保证完全实时 | EvolutionAgent 跑批是异步 · 用户点 👍 后到 prompt 注入有时延(秒级到分钟级) |
| ⚠️ Cron 失败需告警 | DailyTaskAgent 0 点没跑 → 用户看不到今日任务 → 需告警 + retry |

### Implementation Notes

* `src/server/cron/` 含 `evolution-runner.ts` + `daily-task-runner.ts`
* bullmq queue 命名 · `evolution-agent` · `daily-task-agent` · `voice-chat`(可选)
* VoiceChatAgent 是 tRPC subscription/observable · 不入 bullmq · 用户实时驱动
* 每个 L5 Agent 仍要继承 BaseSpecialist · 但 `execute()` 内部允许多次 LLM 调用(因为是"多轮"而非"循环")
* 失败处理:
  - EvolutionAgent dead-letter 累计 ≥3 触发告警 · ContextAssembler 降级用上一版(ARCHITECTURE §6.8)
  - DailyTaskAgent 0 点没跑 · 1 点重试 · 仍失败 toast 提示用户"今日任务延迟生成"

### References

* ADR-001 / ADR-002(前置)
* 全局 ADR-018 外部 Orchestrator(本 ADR 是其在本项目的应用)
* [reference/PI-Agent设计哲学/03 第 4 节 + 第 6.5 节 10 实例](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md)
* [ARCHITECTURE.md §4.4](ARCHITECTURE.md)
* bullmq · node-cron · Redis 文档

---

## ADR-006 · 五层记忆架构 · 替换 Summarizer/Portrait

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-006
> **范畴** · 记忆系统
> **派生自** · [ARCHITECTURE.md §5.1](ARCHITECTURE.md) · [11/04 五层记忆系统实现](../Ai_Agent/knowledge-base/11-implementation-case/04-五层记忆系统实现.md) · [reference/Agent 记忆系统设计](../Ai_Agent/knowledge-base/reference-materials/Agent记忆系统设计.md)

### Context

QuanAn 的记忆需求:
* **当前会话上下文**(VoiceChat 多轮)
* **账号核心档案**(9 步 stepData · 后续 Specialist 必读)
* **历史生成记录**(/history /my-topics 检索)
* **用户画像 + 进化档案**(反馈飞轮的产物)
* **全网爆款数据**(跨用户共享 · 高频读)

11/04 给了五层记忆模板:Buffer / Core / Recall / Summarizer / Portrait。直接照搬合不合适?

* **Summarizer**(定时摘要)· 11/04 是对话场景 · 需要 LLM 摘要长对话。本项目 9 步 stepData 是结构化数据 · 直接读 result · **不需要摘要**。
* **Portrait**(用户画像)· 跟本项目"进化档案"重合 · 而且本项目有反馈飞轮 · Portrait 应该升级为含 insights 的 Profile。
* **Trending Cache** · 本项目特色需求 · 11/04 没有(客服场景不需要全局爆款库)。

### Options

| 方案 | 5 层定义 |
|---|---|
| A · 完全照搬 11/04 | Buffer / Core / Recall / Summarizer / Portrait |
| B · 全自定义 | Working / Episodic / Semantic / Procedural / ...(认知科学派) |
| C · 11/04 + 项目特化(本案) | Buffer / Core / Recall / **Profile**(替 Portrait)/ **Trending Cache**(替 Summarizer) |

### Decision

**选 C · 11/04 + 项目特化**:

| 层 | 角色 | 存储 | 隔离 |
|:-:|---|---|:-:|
| **L1** Buffer | VoiceChat 对话短期上下文 | Redis(TTL 30min) | account |
| **L2** Core Memory | 9 步 stepData(账号核心档案) | Postgres + LS 双写 | account |
| **L3** Recall Memory | History 表(全部生成历史) | Postgres + pgvector(可选) | account |
| **L4** Profile | EvolutionProfile + DeepLearningArchive | Postgres + Redis 热缓存 | account |
| **L5** Trending Cache | 全网爆款滚动缓存 | Redis + pgvector | **全局** |

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ L1-L4 多账号严格隔离 | 跟 LD-009 数据隔离 3 道闸完全对齐 |
| ✅ L5 全局共享 | 节省抓取成本(参 ADR-017)· 多用户复用同一爆款库 |
| ✅ 没有 Summarizer | 9 步是结构化数据 · 不需要 LLM 摘要 · 节省 token |
| ✅ Profile 是反馈飞轮的载体 | 跟 ADR-008 直接对接 · 实现"越用越懂你" |
| ⚠️ 跟 11/04 命名不同 | 团队对 11/04 熟的人需要重新对照(见 [ARCHITECTURE §5.1 表格](ARCHITECTURE.md)) |
| ⚠️ L5 全局表跟 LD-009 隔离铁律有边界 | TrendingItem 是显式标 GLOBAL TABLE 的 3 个全局表之一 · 需 ADR 论证(本 ADR 即论证) |

### Implementation Notes

* `src/server/memory/` 下分 5 文件:`l1-buffer.ts` · `l2-core.ts` · `l3-recall.ts` · `l4-profile.ts` · `l5-trending.ts`
* L1 Buffer 用 Redis List(`LRANGE` 拉最近 N 条)
* L2 Core 用 Prisma + LS 双写(详见 ADR-011)
* L4 Profile 含 3 子结构:EvolutionProfile(latest)+ EvolutionInsight[](历史)+ DeepLearningArchive[](样本)
* L5 Trending 不带 account_id · 但所有读操作要 cache · TTL 1h

### References

* ADR-008(L4 Profile 怎么生成)
* ADR-009(L4 为什么账号级)
* ADR-010(数据隔离铁律)
* ADR-012(L5 用 pgvector)
* [11/04 五层记忆](../Ai_Agent/knowledge-base/11-implementation-case/04-五层记忆系统实现.md)
* [reference/Agent 记忆系统设计](../Ai_Agent/knowledge-base/reference-materials/Agent记忆系统设计.md)

---

## ADR-007 · ContextAssembler 是 prompt 注入唯一入口

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-007
> **范畴** · 记忆系统(Specialist ↔ Memory 桥梁)
> **派生自** · [ARCHITECTURE.md §4.6 + §5.5](ARCHITECTURE.md) · [reference/PI-Agent设计哲学/13 模式 1 Context 投影](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/13-Harness工程深度与5大模式.md)

### Context

ADR-006 定了 5 层记忆 · 但 14 个 Specialist 怎么"读"这些记忆?

天真做法 · 每个 Specialist 自己拉数据 + 拼 prompt:
```typescript
// ❌ 每个 Specialist 自己拉数据
async execute(input) {
  const stepData = await prisma.stepData.findMany({...});
  const profile = await prisma.evolutionProfile.findUnique({...});
  const samples = await pgvector.search({...});
  const sysPrompt = `你是 ${role}... ${stepData}... ${profile}... ${samples}...`;
  return llmGateway.complete({ systemPrompt: sysPrompt });
}
```

问题:
* **重复代码** · 14 个 Specialist 每个都拉一遍
* **不一致** · 不同 Specialist 拼 prompt 的格式不同 · 用户偏好段在 A 里 / 在 B 里没有
* **维护痛苦** · 改一次"用户偏好"段格式要改 14 处
* **调试难** · 看不到完整 prompt 时不知道哪段没拼对

### Options

| 方案 | 谁拼 prompt | 共享性 | 维护 |
|---|---|:-:|:-:|
| A · 每 Specialist 自己拼 | Specialist | 0% | 极痛 |
| B · 公共 utility 函数 | Specialist 调 helper | 部分 | 中 |
| C · 唯一入口 ContextAssembler(本案) | ContextAssembler | 100% | 低 |
| D · LLM Supervisor 拼 | LLM Supervisor | 100% | 中 + 多调一次 LLM |

### Decision

**选 C · ContextAssembler 是 prompt 注入唯一入口**。

* 所有 Specialist `execute()` 只接受 `(input, ctx)` · `ctx` 由 ContextAssembler 提供
* `ContextAssembler.assemble(req)` 负责:
  1. 拉 IpAccount 基础信息
  2. 拉 stepData.getAll(L2)
  3. 拉 EvolutionProfile + 历史 Insight(L4)
  4. 拉 DiagnosisReport latest(L4)
  5. 拉 DeepLearningArchive top-K 相似(L4)
  6. 查常量(MethodologyQuery)
  7. 拉 RAG(若需要)
  8. 拼成完整 system prompt(模板见 [ARCHITECTURE §5.5](ARCHITECTURE.md))

这就是 [reference/PI/13 §模式 1 Context 投影](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/13-Harness工程深度与5大模式.md) 在本项目的应用 — **把所有上下文聚合到 prompt 边界 · 让 Specialist 内部实现纯净**。

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 改一处全部生效 | 加新的 system prompt 段(如未来加 "今日热点")· 改一次 ContextAssembler · 14 Specialist 全部受益 |
| ✅ Specialist 实现纯净 | 单元测试 mock ContextAssembler 即可 · 不需要 mock DB / Redis / pgvector |
| ✅ 反馈飞轮注入容易 | 用户偏好段写在 ContextAssembler 里 · 飞轮升级用户进化档案后立即生效 |
| ✅ 调试可观测 | 完整 prompt 可一次性 log · 排错快 |
| ⚠️ ContextAssembler 是单点 · 性能要重点保 | 6 路并行拉数据 + EvolutionProfile Redis 热缓存 + React Query stepData 缓存 |
| ⚠️ Specialist 灵活度受限 | 想加 Specialist 特有的上下文(如 VideoAgent 想拉某种独特数据)· 必须改 ContextAssembler 加分支 |

### Implementation Notes

* `src/server/agents/base/context-assembler.ts` · 单文件
* `assemble()` 方法 6 路并行 + 后续拼 prompt(用 template literal)
* 单元测试必含:6 个冷启动场景(参 [ARCHITECTURE §4.4-D](ARCHITECTURE.md)) + 完整数据 = 7 用例
* Redis 热缓存 EvolutionProfile · TTL 5min · 失效后重读 DB
* React Query 缓存 stepData · 5min staleTime · 切账号 invalidate

### References

* ADR-005(L5 自治也走 ContextAssembler)
* ADR-006(5 层记忆 · ContextAssembler 是读取面)
* ADR-008(反馈飞轮如何注入)
* [ARCHITECTURE.md §5.5 注入模板](ARCHITECTURE.md)
* [reference/PI/13 5 大模式 §模式 1](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/13-Harness工程深度与5大模式.md)

---

## ADR-008 · 反馈飞轮 · 5 阶段闭环 + 内部分层 / Issue 飞轮混合范式

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-008
> **范畴** · 记忆系统(进化机制)
> **派生自** · [ARCHITECTURE.md §5.4](ARCHITECTURE.md) · [reference/AI-Agent 的两种记忆范式](../Ai_Agent/knowledge-base/reference-materials/AI-Agent的两种记忆范式-内部分层vs外部Issue飞轮.md) · 全局 ADR-018 外部 Orchestrator

### Context

QuanAn 产品定位 · "用得越多越懂你"。这需要某种"学习机制" · 让 Specialist 在用户用了 N 次之后输出更贴合用户偏好。

业界两种主流范式:
* **内部分层**(Mem0 / Letta 派) · LLM 内部 5 层记忆 · 程序化管理用户信息
* **外部 Issue 飞轮**(GitHub 派) · 反馈作为 Issue · 人机协作 · LLM 学习

QuanAn 应该选哪种?或者两者结合?

aiipznt 原版 · 5 级进化 + 累计反馈手动触发 · 但**进化结果是不是真的注入下次 prompt** · 实测看不到强证据。本架构应该把这个机制做实。

### Options

| 方案 | 实现 | 优势 | 劣势 |
|---|---|---|---|
| A · 纯内部分层 | Specialist 自动从 stepData / 历史输出推断用户偏好 | 不需用户参与 | 推断质量低 · 偏差大 |
| B · 纯 Issue 飞轮 | 全靠用户 👍/👎 反馈 + EvolutionAgent 聚合 | 反馈准确 | 冷启动期没数据 |
| C · 混合(本案) | 9 步 stepData 用内部分层(L2 Core)+ 用户满意度用 Issue 飞轮(feedback_log → Evolution) | 既有结构化输入又有反馈学习 | 复杂度中等 |

### Decision

**选 C · 内部分层 + Issue 飞轮混合范式**。

5 阶段闭环:

```
Phase 1 · 生成 + 标记 trace_id
   Specialist 输出 → 写 history(带 trace_id)

Phase 2 · 用户反馈
   👍/👎 → feedback_log + 原子 ++count

Phase 3 · 触发 EvolutionAgent
   累计 ∈ {5,20,50,100} 升级 · 或 Cron · 或手动 · 或 deepLearn 上传

Phase 4 · EvolutionAgent 跑批(LLM 自主聚合)
   读 feedback_log + DeepLearning samples + 上次 Insight + history
   生成 · {direction, insights{preferredCatchphrases, styleTone, avoidList, ...}, sourceFeedbackIds}
   写 EvolutionInsight + 更新 EvolutionProfile(原子事务 · ADR-014)

Phase 5 · 注入下次 Specialist
   ContextAssembler 读 EvolutionProfile · 拼到 system prompt "用户偏好" 段
```

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 真"越用越懂你" | Phase 5 注入是关键 · 用户能感知到生成内容跟自己反馈一致 |
| ✅ 冷启动有兜底 | L2 Core(9 步 stepData)给 Specialist 当上下文 · 即使没反馈也能输出符合行业的内容 |
| ✅ 反馈飞轮是异步 · 不阻断主流程 | EvolutionAgent 跑批失败用户主流程不受影响 |
| ✅ 跟全局 ADR-018 一致 | 外部 Orchestrator 模式 · Cron + bullmq |
| ⚠️ 反馈污染风险 | 用户反馈不一致(👍 一篇 / 👎 类似的另一篇)· EvolutionAgent 要做冲突检测 |
| ⚠️ Phase 4 失败处理 | dead-letter 累计 ≥3 触发告警 + ContextAssembler 降级用上一版 Insight(ARCHITECTURE §6.8) |
| ⚠️ 不能保证完全实时 | 用户点 👍 后到 prompt 注入有秒到分钟级时延 · 用户教育"进化是渐进的" |

### Implementation Notes

* `EvolutionAgent.execute()` 必须在 prisma `$transaction` 内完成 level + insight 写入(LD-014 R-12)
* feedback_log 表必有 `trace_id` 反查 history → 反查 prompt(ARCHITECTURE §6.9)
* EvolutionAgent system prompt 强调"基于实际反馈 · 不编造金句"(detail in PROMPTS.md)
* Phase 5 注入的 prompt 段格式见 [ARCHITECTURE §5.5 模板](ARCHITECTURE.md)

### References

* ADR-005(EvolutionAgent 是 L5 自治)
* ADR-007(ContextAssembler 是注入入口)
* ADR-009(为什么账号级)
* ADR-014(原子事务)
* [reference/AI-Agent 的两种记忆范式](../Ai_Agent/knowledge-base/reference-materials/AI-Agent的两种记忆范式-内部分层vs外部Issue飞轮.md)
* [ARCHITECTURE.md §5.4 + §5.9](ARCHITECTURE.md)

---

## ADR-009 · EvolutionProfile 账号级 · 不是用户级

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-008(衍生)
> **范畴** · 记忆系统(隔离粒度)
> **派生自** · [ARCHITECTURE.md §5.3 + §5.7](ARCHITECTURE.md)

### Context

ADR-008 决定了反馈飞轮的产物 — EvolutionProfile + EvolutionInsight。但这个进化档案的**隔离粒度**是什么?

两个选项:
* **用户级** · 一个 sally zhao 一份进化档案 · 跨账号共享
* **账号级** · 每个 IP 账号独立进化档案 · 同一用户的多账号互不影响

具体场景 · sally zhao 同时有:
* 「企业号」 · 卖 AI 智能体定制 · 严谨 + B 端口吻
* 「个人号」 · 分享 AI 创业故事 · 活泼 + 真实 + C 端口吻

如果用户级共享:
* 在企业号点 👎 "这条文案太活泼" · 个人号也会变严谨(❌ 不对)
* 在个人号点 👍 "用'宝子'这种称呼" · 企业号也会用(❌ 不对)

如果账号级独立:
* 两个账号有完全独立的金句库 / 风格 / 避忌(✅)
* 同一用户但不同 IP 不会污染(✅)

### Options

| 方案 | 隔离粒度 | 跨账号共享 |
|---|---|---|
| A · 用户级 | 1 用户 = 1 Profile | 强制共享 |
| B · 账号级(本案) | 1 IP 账号 = 1 Profile | 默认独立 + 可选用户主动勾选(L5 大师级专属) |
| C · 用户级 + Tag | 1 用户 = 1 Profile · 但带"行业 tag" 区分 | 复杂 · 容易出错 |

### Decision

**选 B · 账号级独立 + 跨账号共享需用户主动勾选**:

* `evolution_profile.account_id` 是必填字段 + 唯一索引
* 同一用户的不同账号有完全独立的进化路径
* L5 大师级账号(反馈累计 100+)可以"克隆档案"到新账号 · 但**默认关闭** · 用户在 /accounts 新建账号时勾选"继承 X 账号的进化档案"

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 多账号矩阵用户体验对 | MCN 用户矩阵 5 个账号 · 每个进化路径独立 |
| ✅ 跟 LD-009 数据隔离一致 | 90% 实体按 account_id 隔离 · EvolutionProfile 也按这个铁律 |
| ✅ L5 用户体验加分 | 大师级用户可手动决定要不要把已经训好的档案带到新账号 |
| ⚠️ 同一用户多账号冷启动多次 | 每个新账号都要从 L1 起步 · 累计反馈 5+ 才升 L2 |
| ⚠️ 用户教育成本 | 用户可能问"为什么我换个账号就不懂我了"· 需要在 onboarding 解释 |

### Implementation Notes

* prisma · `model EvolutionProfile { accountId Int @unique · ... }`
* `/accounts` 新建账号表单加可选项 "(可选)继承现有账号的进化档案" + L5 锁定提示
* 跨账号克隆操作必须显式 audit_log(防止误操作)
* 用户教育文案 · 写在 [/guide 使用说明](aiipznt-spec.md) 的 FAQ 里

### References

* ADR-008(反馈飞轮主体)
* ADR-010(数据隔离铁律 · EvolutionProfile 是按 account_id 隔离的样本)
* [ARCHITECTURE.md §5.3 + §5.7](ARCHITECTURE.md)

---

## ADR-010 · 多账号数据隔离 · 3 道闸铁律

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-009
> **范畴** · 数据架构(安全边界)
> **派生自** · [ARCHITECTURE.md §3.1 + §3.8](ARCHITECTURE.md) · [11/02 八 Agent §6 状态机](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md)

### Context

QuanAn 每用户可有多个 IP 账号(实测 sally zhao 多账号场景)· 90% 业务数据按 account_id 隔离。这是产品体验**最关键**的安全边界:

* **企业号 vs 个人号** · 数据完全独立(ADR-009 已论证)
* **MCN 矩阵** · 5+ 账号互不污染
* **测试账号** · 不能让真实数据混进去

如果隔离泄露(用户 A 看到 B 的 stepData / history / EvolutionProfile)· 会出**严重产品事故** · 用户对平台信任崩塌。

### Options

| 方案 | 隔离方式 | 漏配风险 |
|---|---|:-:|
| A · 仅 ORM `where: { accountId }` | 1 道闸 | 高 · 漏一处全跨 |
| B · ORM + 单元测试 | 1 道 + 测试 | 中 · 测试盖不全 |
| C · 3 道闸(本案 · 防御性深度) | ORM + Postgres RLS + 缓存命名空间 | **低** · 任一道挡住即可 |
| D · 多租户独立 DB | 每账号 1 个 DB | 极低 · 但成本高 + 改架构 |

### Decision

**选 C · 3 道闸防御性深度** · 任一道生效就能挡住 · 三道叠加几乎不会漏:

#### 闸 1 · 路由层(tRPC middleware)

```typescript
const accountIsolation = middleware(async ({ ctx, input, next }) => {
  const accountId = ctx.user.activeAccountId;
  const owns = await prisma.ipAccount.count({
    where: { id: accountId, userId: ctx.user.id }
  });
  if (owns === 0) throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx: { ...ctx, activeAccountId: accountId } });
});
```

所有 protected procedure 必 use 这个 middleware。

#### 闸 2 · 存储层(Postgres RLS)

```sql
ALTER TABLE step_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY step_data_account_isolation ON step_data
  FOR ALL USING (account_id = current_setting('app.current_account_id')::int);

-- 每请求开始
SET LOCAL app.current_account_id = '${ctx.activeAccountId}';
```

ORM 漏 `where: { accountId }` 时 RLS 兜底拒绝。

#### 闸 3 · 缓存层(命名空间)

```typescript
redis.set(`voice_chat:acc_${accountId}:turns`, ...);
localStorage.setItem(`aiip_memory_acc_${accountId}_${stepKey}`, ...);
pgvector.search({ namespace: `account_${accountId}`, ... });
```

漏命名空间也是 R-5 红线 · grep 检测。

#### 全局表清单(显式不带 account_id)

| 表 | 理由 |
|---|---|
| `users` | 用户本身就是隔离单位 |
| `invite_codes` | 跨用户共享(邀请码池) |
| `trending_items` | 全网爆款 · 跨用户共享 |

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 安全冗余高 | 任一闸失效另两道兜底 |
| ✅ 跟 LD-009 红线对应 | R-4 / R-5 / R-6 grep 全栈检测 |
| ✅ 测试明确 | 集成测试必含"用户 A 不能读 B 数据"用例 |
| ⚠️ RLS 增加 SQL 复杂度 | 调试时要记得 `SET LOCAL` · 错过会报"no rows" 难定位 |
| ⚠️ 全局表必须显式标注 | 代码注释 + ADR 论证 · 防止"忘记加 account_id" |

### Implementation Notes

* `src/server/trpc/middleware/account-isolation.ts`
* `prisma/migrations/000_rls.sql` 集中管理 RLS 策略
* 单元测试 · 每个 procedure 至少 1 个"跨账号试探"用例
* 集成测试 · `tests/integration/multi-account-isolation.test.ts` · 5+ 用例

### References

* ADR-009(EvolutionProfile 是按 account_id 隔离的样本)
* ADR-011(LS 命名空间)
* [ARCHITECTURE.md §3.1 + §3.8](ARCHITECTURE.md)
* [AGENTS.md §3 LD-009 + §5 R-4/5/6](AGENTS.md)
* Postgres RLS 文档 · Supabase RLS 实践

---

## ADR-011 · LS↔DB 双写 · 4 规则

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-010
> **范畴** · 数据架构(同步策略)
> **派生自** · [ARCHITECTURE.md §3.4](ARCHITECTURE.md) · spec.md §3.4 + §ⅩⅩⅩⅦ 实测

### Context

aiipznt 原版实测 · 18 个 LS keys 跟 DB 双写镜像。这种"乐观双写"设计的好处:

* 离线 / 网络抖动时用户仍可看见上次结果(读 LS 即时)
* 写入立即响应(LS 先写)+ 后台同步(DB)

但有问题需要决策:
* 写时先 LS 还是先 DB?
* 读时优先 LS 还是 DB?
* 切账号 / 多 tab / 网络分区时怎么协调?

### Options

| 方案 | 写顺序 | 读顺序 | 一致性 | 体验 |
|---|---|---|---|---|
| A · DB 优先(强一致) | DB 先 → LS | DB 先 | 强 | 慢 · 等待 DB 响应 |
| B · LS 优先(乐观 · 本案) | LS 先 → DB | LS 先 → 后台 invalidate | 最终一致 | 快 |
| C · 仅 DB(无 LS) | — | DB | 强 | 离线不可用 |
| D · 仅 LS(无 DB) | — | LS | 无跨设备 | 多设备失效 |

### Decision

**选 B · LS 优先的乐观双写** · 4 规则:

```
规则 1 · 写时:
   ① LS 先写(乐观)
   ② 触发 trpc.X.save.mutate
   ③ onError → 回滚 LS · toast 失败 · 30s 后自动重试

规则 2 · 读时:
   ① 同步返回 localStorage 值(立即渲染)
   ② 后台 trpc.X.get.query 拉 DB
   ③ 若 DB 比 LS 新 → 更新 LS + 软提示"已自动同步最新"

规则 3 · 切账号:
   ① localStorage.setItem('aiip_active_account_id', newId)
   ② 调 stepData.getAll(newId) 预热(并行 9 步)
   ③ window.location.reload()
   (原版只 reload · 本架构升级 · reload 前预热)

规则 4 · 7 个实体不入 LS(服务端为主):
   DiagnosisReport / EvolutionProfile / EvolutionInsight /
   FeedbackLog / DeepLearningArchive / KnowledgeFavorite / TrendingItem
   理由 · 数据量大 / 跨设备一致性需求 / 反馈飞轮要求
```

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 写入即时响应 | 用户点保存后立即看到 · 不等 DB |
| ✅ 离线友好 | 网络断时仍可看见上次结果 |
| ✅ 切账号体验顺 | reload + 预热 · 比纯 reload 快 |
| ⚠️ 多 tab 写覆盖风险 | 必须用乐观锁 version 字段(R-13)防覆盖 |
| ⚠️ LS 配额 5MB 限制 | 18 LS keys 总 ≤ 200KB 安全(实测 sally 数据 ~120KB) |
| ⚠️ 服务端为主的 7 实体不能离线读 | 用户教育"诊断报告 / 进化档案需要联网" |

### Implementation Notes

* `src/hooks/useStepData.ts` · 实现 4 规则
* 乐观锁 · `model StepData { version Int @default(0) · ... }` + 每次 update increment
* 客户端 React Query · 5min staleTime · 切账号 invalidate
* 服务端 stepData.save 必 increment version · 接受 oldVersion 参数

### References

* ADR-010(数据隔离 · LS 命名空间是闸 3)
* spec.md §3.4 + §ⅩⅩⅩⅦ 实测原版双写细节
* [ARCHITECTURE.md §3.4](ARCHITECTURE.md)

---

## ADR-012 · RAG 边界 · 30KB 常量 in-memory + pgvector 复用主库

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-011
> **范畴** · 数据架构(检索 / 知识层)
> **派生自** · [ARCHITECTURE.md §3.6](ARCHITECTURE.md) · [03 RAG 与向量数据库架构](../Ai_Agent/knowledge-base/03-rag-and-vectordb-architecture/) · [11/03 RAG 与 ChromaDB 落地](../Ai_Agent/knowledge-base/11-implementation-case/03-RAG与ChromaDB落地实践.md)

### Context

QuanAn 有大量"知识"需要在 LLM 调用时引用:

* 56 行业 / 22 元素 / 20 脚本 / 14 形式 / 6 阶段 ...(产品方法论数据)
* 67 实战案例 / 23 文案公式 / 22 元素心理学详解
* 全网爆款(trending)
* 用户上传的文案样本(DeepLearningArchive)
* 用户历史生成(history)

哪些数据走 RAG(向量库)?哪些走常量(直接 import)?

### Options

| 方案 | 边界 |
|---|---|
| A · 全部入向量库 | 简单一致 · 但小常量(几 KB)入库浪费 + 检索延迟 |
| B · 全部 in-memory | 大数据(trending 1k+ 条)爆内存 + 没有语义检索 |
| C · 按规模分(本案) | ≤ 30KB 常量直接 import · > 30KB 或需要语义检索的入向量库 |
| D · 按"是否结构化"分 | 跟 C 类似但维度不准 |

向量库选型(单独决策):
* 独立向量库 · Qdrant / Milvus / Pinecone / Weaviate
* PG 扩展 · pgvector(已有 PG · 复用)

### Decision

**选 C(规模分)+ pgvector(复用 PG)**:

#### 不入向量库(常量级 · 30KB 以内)

| 常量 | 大小 | 实现 |
|---|:-:|---|
| PLATFORMS(5) | <1KB | `lib/constants/platforms.ts` |
| INDUSTRIES(56 · 5 类) | ~5KB | `lib/constants/industries.ts` |
| HOT_ELEMENTS(22 · 4 组) | ~3KB | `lib/constants/hotElements.ts` |
| SCRIPT_TYPES(20)+ methodology | ~10KB | `lib/constants/scriptTypes.ts` |
| PRESENT_STYLES(14) | ~2KB | `lib/constants/presentStyles.ts` |
| PRIVATE_DOMAIN_STAGES(6) | <1KB | `lib/constants/privateDomain.ts` |
| STEPS(9) / EVOLUTION_LEVELS(5) / DIAGNOSIS_DIMENSIONS(8) | <1KB 各 | 同 |
| **合计** | **~30KB** | bundle 直接 import |

#### 入向量库(pgvector)

| 数据 | 量级 | namespace | 检索场景 |
|---|---|---|---|
| 67 实战案例 | ~67 行 | 全局 | CopywritingAgent · 按 scriptType+industry few-shot |
| 23 文案公式 | ~23 | 全局 | CopywritingAgent / BoomGenerator |
| 22 元素心理学 | ~22 | 全局 | CopywritingAgent 注入心理机制 |
| TrendingItem | 1k-10k 滚动 | 全局 | TopicAgent · 按 industry+platform |
| DeepLearningArchive | per-user | `account_${id}` | CopywritingAgent · 用户专属风格 |
| History(可选) | per-user | `account_${id}` | /my-topics · /history 模糊检索 |

#### 向量库选型 · pgvector

* **不引入独立向量库**(LD-011 红线 R-17)
* 复用 PG 主库 + pgvector 扩展
* embedding 模型 · OpenAI text-embedding-3-small(1536 维)
* 量级到 100k+ 后再评估迁移 Qdrant(开新 ADR)

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 30KB 常量 0 网络延迟 | 直接 bundle · LLM 调用前同步注入 |
| ✅ pgvector 复用主库 · 节省运维 | 一个 Postgres · 不需要独立向量库服务 |
| ✅ 跟 11/03 经验一致 | 实战验证 · ChromaDB 不如 pgvector 好维护 |
| ✅ 多账号隔离统一 | namespace 跟 LD-009 数据隔离对齐 |
| ⚠️ pgvector 性能上限 | 100k+ 向量后查询慢 · 需迁移(再开 ADR) |
| ⚠️ 30KB 边界是经验值 | 业务变化时(如新增 100 行业)要重新评估 |

### Implementation Notes

* `prisma/schema.prisma` 启用 `extensions = [pgvector]`
* embedding 字段 · `vector(1536)` 类型
* 索引 · `USING ivfflat` 或 `hnsw`(根据数据量)
* RAG 查询入口 · `src/server/memory/l5-trending.ts` + `l4-profile.ts`(deepLearn samples)
* 常量校验测试 · 每个常量文件 1 个 schema 校验测试(emoji 完整 · key 唯一 · count 对)

### References

* ADR-006(L4 / L5 都用向量库)
* ADR-010(向量库 namespace 隔离)
* [03 RAG 与向量数据库架构](../Ai_Agent/knowledge-base/03-rag-and-vectordb-architecture/)
* [11/03 RAG 与 ChromaDB 落地实践](../Ai_Agent/knowledge-base/11-implementation-case/03-RAG与ChromaDB落地实践.md)(借鉴 · 但本架构选 pgvector)
* [ARCHITECTURE.md §3.6](ARCHITECTURE.md)
* pgvector GitHub · Supabase pgvector 文档

---

## ADR-013 · LLM Gateway · 唯一 LLM 调用入口

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-012
> **范畴** · 接口 + 治理(基础设施)
> **派生自** · [ARCHITECTURE.md §6.5](ARCHITECTURE.md) · [11/05 工具系统与 LLM 网关](../Ai_Agent/knowledge-base/11-implementation-case/05-工具系统与LLM网关.md)

### Context

QuanAn 14 个 Specialist + 3 L5 Agent + ContextAssembler · 都需要调 LLM。如果每处直接 import OpenAI / Anthropic SDK:

* **失控**:某个 Specialist 没限流 · 用户狂点直接打爆 API 配额
* **不可观测**:看不到全栈 token 消耗 · 不知道哪个 Specialist 最贵
* **降级混乱**:某次 reasoning 模型不可用时 · 各 Specialist 各自处理(有的 fallback / 有的崩)
* **测试难**:14 处 mock SDK · 覆盖不全
* **多模型困难**:换 Claude Sonnet 4.6 → 4.7 时要改 14 处

业界经验(11/05 mini-program-agent 实战)· **LLM 网关是必需的基础设施**。

### Options

| 方案 | 实现 | 优势 | 劣势 |
|---|---|---|---|
| A · 各 Specialist 直接 SDK 调用 | `import OpenAI from 'openai'` | 简单 | 失控 + 不可观测 + 14 处维护 |
| B · 公共 utility 函数 | `helpers.callLLM()` | 部分共享 | 限流 / 熔断仍要每处实现 |
| C · LLM Gateway(本案) | 单点入口 + 限流 + 熔断 + 降级 + 计费 + Trace | 治理统一 | 单点风险(但内部高可用) |
| D · 第三方 Gateway(LiteLLM / Helicone) | 接入开源 / SaaS | 即插即用 | 多个外部依赖 + 学习成本 |

### Decision

**选 C · 自建 LLMGateway**:

```typescript
interface LLMGateway {
  complete(req: CompleteRequest): Promise<CompleteResponse>;
  stream(req: StreamRequest): AsyncIterable<StreamChunk>;
}

interface CompleteRequest {
  model_tier: 'reasoning' | 'lightweight';   // 应用代码不指定具体模型
  systemPrompt: string;
  userPrompt: string;
  tools?: ToolSchema[];
  responseFormat?: { type: 'text' } | { type: 'json_schema'; schema: ZodSchema };
  metadata: { trace_id; agentId; accountId; userId };
  timeout_ms?: number;
  retry?: number;
}

interface CompleteResponse {
  content: string | object;
  tokens: { prompt; completion; total };
  model: string;       // 实际用的模型(降级后可能跟 tier 不一致)
  duration_ms: number;
  trace_id: string;
  fallback?: { from; to; reason };
}
```

**5 大职责**:
1. **限流** · token bucket per user(Redis · Free 50/日 / Pro 500/日)+ 单用户并发 ≤ 3
2. **熔断** · 同模型连续 5 次 5xx → 切下一档(reasoning → lightweight)+ 5min 后恢复尝试
3. **降级** · reasoning 不可用 → lightweight · lightweight 不可用 → 返回 fallback 模板
4. **计费** · 每次调用记 `cost_log` 表(tokens × price)· 月度按用户 + 按 agent 聚合
5. **Trace 贯穿** · 每次调用必带 metadata.trace_id · 写 audit_log

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 单点治理 | 改一次 Gateway · 14 Specialist 全受益(加新模型 / 改限流 / 加监控) |
| ✅ 应用代码不耦合具体模型 | Specialist 只声明 `model_tier` · 切换 Sonnet 4.6 → 4.7 0 改动 |
| ✅ 降级路径自动 | reasoning 挂了自动 lightweight · Specialist 不需要写降级逻辑 |
| ✅ 成本可见 | 月底查 cost_log · 知道哪个 Specialist 最贵 · 优化方向明确 |
| ⚠️ 单点风险 | LLMGateway 自身要高可用 · 不能成为瓶颈 |
| ⚠️ 流式响应处理复杂 | SSE 流式 + 限流 + 熔断 + 降级 在流式场景下难写 |

### Implementation Notes

* `src/server/workers/llm-gateway/` 目录
* 实现文件 · `index.ts`(入口)· `rate-limit.ts` · `circuit-breaker.ts`(熔断)· `cost-tracker.ts` · `model-router.ts`(tier → 具体模型)
* 限流用 Upstash Ratelimit 或自建 token bucket on Redis
* 熔断用 `opossum` 库 或自建状态机
* 降级策略
  - reasoning Anthropic timeout → reasoning OpenAI fallback
  - reasoning 全挂 → lightweight 同提供商
  - lightweight 全挂 → 返回 fallback 模板(标 `is_fallback=true`)
* 单元测试必含 · 限流 / 熔断 / 降级 / 计费 / 重试 各 2-3 用例 = 12 用例
* 流式调用走 `tRPC observable` + 内部限流(每 chunk 不再额外限流 · 整次调用算一次)

### References

* ADR-014(zod schema 跟 LLMGateway 配合)
* [11/05 工具系统与 LLM 网关](../Ai_Agent/knowledge-base/11-implementation-case/05-工具系统与LLM网关.md)
* [ARCHITECTURE.md §6.5](ARCHITECTURE.md)
* Anthropic / OpenAI SDK 文档

---

## ADR-014 · zod 全栈校验 + trace_id 贯穿 + 类型严格 + 错误恢复

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-013 · LD-014
> **范畴** · 接口 + 护栏(质量基线)
> **派生自** · [ARCHITECTURE.md §6.3 + §6.8 + §6.9](ARCHITECTURE.md)

### Context

LLM 输出**本质上是不可信的**:
* 可能不返回 JSON · 返回 markdown 包 JSON
* 可能字段缺失 / 类型错(`number` 写成 `string`)
* 可能编造数据
* 可能超长被截断

如果 Specialist 直接 trust LLM 输出 + return:
* 用户看到 broken UI(undefined.toFixed())
* 渲染崩溃
* 后续依赖此数据的 Specialist 全失败

需要**统一的输出校验 + 错误恢复机制**。

类似 · 错误处理 / 类型严格度 / Trace 都跟"质量基线"相关 · 应该一起决策。

### Options

#### 输出校验

| 方案 | 实现 |
|---|---|
| A · 每 Specialist 自己 try/catch | 不统一 · 漏处理多 |
| B · 用 zod schema(本案) | 统一 + 类型派生 + 强约束 |
| C · 用 JSON Schema | 不如 zod 跟 TS 集成好 |

#### 错误恢复

| 方案 | 策略 |
|---|---|
| A · 失败抛 500 | 用户体验差 |
| B · 失败重试无限次 | token 失控 |
| C · 失败重试 1 次 → 降级 → fallback 模板(本案) | 平衡 |

#### Trace 贯穿

| 方案 | 实现 |
|---|---|
| A · 不做 | 排错灾难 |
| B · 部分日志 | 串不起来 |
| C · 全栈 trace_id(本案) | 一路追溯 |

### Decision

**选三个 C 组合**:

#### ① zod 全栈校验

* 所有 Specialist 输出过 `MyZodSchema.safeParse()` · 失败 → 重试 1 次 LLM · 仍失败 → 标 `is_fallback=true` 返回 fallback 模板
* zod schema 跟 prisma model + DATA-MODEL.md 文档 三者一致 · CI 跑 `schema:diff` 校验
* tRPC 用 zod 做 input/output 校验 · 客户端 / 服务端共享 schema 包

#### ② 错误恢复 4 类

| 失败位置 | 处理 |
|---|---|
| LLM timeout | 重试 1 次 → 降级 lightweight → fallback 模板 |
| zod 校验失败 | LLM 重试 1 次 → 标 fallback |
| stepData.save 失败 | 客户端回滚 LS · toast · 30s 自动重试 |
| stepData 并发冲突 | 乐观锁 · 第二次 save 失败 → toast "已被另一处修改 · 请刷新" |
| EvolutionAgent 升级 + insight 必须同事务 | prisma `$transaction` · 任一失败回滚 |
| EvolutionAgent 长期失败 | dead-letter ≥3 触发告警 + ContextAssembler 降级用上一版 |

#### ③ trace_id 全栈

```
trace_id 格式 · `tr_${accountId}_${agentId}_${timestamp}_${rand4}`
所有 DB 表必含 trace_id 字段 · 所有 LLM 调用 metadata 必带 · 所有日志必含
```

#### ④ 类型严格

```jsonc
// tsconfig.json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "exactOptionalPropertyTypes": true
}
```

* **不允许** `any` 兜底 · 用 `unknown` + narrow
* **不用 enum**(运行时膨胀)· 用 `as const`
* zod schema 是真理来源 · `type X = z.infer<typeof XSchema>`

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ LLM 输出可信 | zod 兜底 · 不会直接 broken UI |
| ✅ 排错快 | trace_id 一路从 frontend 追到 LLM Gateway |
| ✅ 类型安全 | TS strict + zod schema · 编译期挡住 90% bug |
| ✅ 失败优雅 | fallback 模板让用户感受到"系统繁忙"而不是崩溃 |
| ✅ 飞轮可靠 | EvolutionAgent 原子事务保证 level + insight 同步 |
| ⚠️ 写代码量增加 | 每个 Specialist 多 30% 代码量(zod schema + 错误处理) |
| ⚠️ Schema 三处同步成本 | prisma + DATA-MODEL.md + zod · 改一处要改三处 · 用 CI 强制对齐 |

### Implementation Notes

* `src/lib/schemas/` · zod schema 集中目录(按实体 / 按 Specialist)
* tRPC procedure 必带 `.input(XSchema).output(YSchema)`
* DB 表 prisma migration 必加 `trace_id String? @db.VarChar(64)`
* 错误恢复模板:
  ```typescript
  async execute(input, ctx) {
    const trace_id = input.trace_id ?? generateTraceId();
    try {
      const r = await llmGateway.complete({...});
      const parsed = MyZodSchema.safeParse(r.content);
      if (!parsed.success) {
        // 重试 1 次
        const r2 = await llmGateway.complete({...});
        const parsed2 = MyZodSchema.safeParse(r2.content);
        if (!parsed2.success) {
          return { ...fallback, is_fallback: true, trace_id };
        }
        return { result: parsed2.data, trace_id };
      }
      return { result: parsed.data, trace_id };
    } catch (err) {
      logger.error({ err, trace_id, agentId: input.agentId });
      return { ...fallback, is_fallback: true, trace_id };
    }
  }
  ```
* EvolutionAgent 必用 `prisma.$transaction()`(详见 R-12)
* stepData.save 必带 `version` 字段(详见 R-13)

### References

* ADR-013(LLM Gateway 是错误恢复的执行者)
* [ARCHITECTURE.md §6.3 + §6.8 + §6.9](ARCHITECTURE.md)
* [AGENTS.md §3 LD-013/14 · §5 R-7/8/9/10/12/13](AGENTS.md)
* zod / Prisma / OpenTelemetry 文档

---

## ADR-015 · Aurelian Dark 设计系统 · 弃用 aiipznt 赛博青

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-015
> **范畴** · 视觉(品牌定位)
> **派生自** · [ARCHITECTURE.md §1.7 + §8](ARCHITECTURE.md) · [QuanAn/ui/aurelian_dark/DESIGN.md](ui/aurelian_dark/DESIGN.md)

### Context

aiipznt 原版用赛博青色(`#00e5ff` + `Orbitron`)· 视觉风格强调"科技感 / 未来感"。

但 QuanAn 的目标用户(详见 ADR-001 + [AGENTS §1.3](AGENTS.md)):
* OPC 创业者(单人公司)· 客单价高(¥99/月 ~ ¥999/月)
* MCN / 品牌方矩阵
* 传统行业转型者(实体店主 · 培训师)

这群人**不是 18-25 极客 / 大学生** · 而是 **30-45 中高净值用户**。赛博青风格对他们不一定适合 · 反而"极简奢华"更有信任感。

QuanAn UI 阶段(60+ 设计稿)已经选定 Aurelian Dark 风格(Minimalist Luxury · 金 + 暗) · 本架构需要把这个决策正式 ADR 化。

### Options

| 方案 | 视觉风格 | 适配人群 |
|---|---|---|
| A · 沿用 aiipznt 赛博青 | 科技 + 未来 | 18-25 极客 |
| B · Aurelian Dark(本案) | Minimalist Luxury · 金 + 暗 | 30-45 中高净值 |
| C · 蓝色商务(LinkedIn 风) | 严肃 · 专业 | B 端企业 |
| D · 多主题切换 | 用户自选 | 任何 · 但开发成本高 |

### Decision

**选 B · Aurelian Dark**:

* **品牌哲学** · "Void and Gold" — 极深背景 + 稀疏金色高光
* **设计原则** · Tonal Layering(同色系深浅分层做层级) + Editorial Calm(像高端杂志)
* **3 字体** · Manrope(标题) · Plus Jakarta Sans(正文) · Inter(标签)
* **2 金色** · Primary `#f2ca50`(主交互) · Container `#d4af37`(容器)
* **设计真理来源** · `ui/aurelian_dark/DESIGN.md` 的 YAML frontmatter

注意 · DESIGN.md 同时存在 YAML(Material 风格 5 档)和文字段(Tailwind 风格 3 档)双重定义。**以 YAML 为权威** · 文字段是 hover/active 状态变体(详见 [ARCHITECTURE §8.1](ARCHITECTURE.md))。

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 跟目标用户匹配 | 中高净值用户感知到"专业 + 高端" · 提升 Pro/Enterprise 转化 |
| ✅ 设计稿已就绪 | 60+ 设计稿全 Aurelian Dark · 不需要重做 |
| ✅ 工程落地路径清晰 | DESIGN.md YAML → tailwind.config.js → shadcn/ui token |
| ⚠️ 跟 aiipznt 原版完全不同 | 老用户从 aiipznt 迁过来需重新适应 |
| ⚠️ DESIGN.md 双重定义需澄清 | 用 YAML 派生 tailwind config · 文字段当 hover/active 变体 |
| ⚠️ Manrope 中文不友好 | 必须搭配 Noto Sans SC(中文)· 标题英文用 Manrope · 中文用 Noto Sans SC |

### Implementation Notes

* `tailwind.config.js` 自动从 DESIGN.md YAML 派生(写脚本)
* `src/styles/globals.css` 设 CSS 变量(`--surface` `--primary` ...) · Tailwind 引用变量
* 字体走 `@fontsource/manrope` 等 · 自托管(不依赖 Google Fonts CDN)
* 严禁 hardcode 颜色 · 必须用 `theme('colors.primary')` 或 CSS 变量
* Lucide 图标 stroke 1.5/2px · 不用 filled(除非 active 状态)
* 视觉违规 grep 检测见 [AGENTS §5 R-16](AGENTS.md)

### References

* ADR-001(目标用户决定视觉风格)
* [QuanAn/ui/aurelian_dark/DESIGN.md](ui/aurelian_dark/DESIGN.md)
* [ARCHITECTURE.md §1.7 + §8](ARCHITECTURE.md)
* Material Design Tokens · Tailwind v3 主题文档

---

## ADR-016 · 测试金字塔 + LLM-as-Judge + 80% 覆盖率

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-016
> **范畴** · 质量(测试体系)
> **派生自** · [ARCHITECTURE.md §9.11-E](ARCHITECTURE.md) · [reference/Agent 测试与质量保障体系](../Ai_Agent/knowledge-base/reference-materials/Agent测试与质量保障体系.md) · [07 风险边界与验收标准](../Ai_Agent/knowledge-base/07-testing-and-evaluation/)

### Context

QuanAn 的"质量"包含两层:
* **代码质量** · 类型 / lint / 单元 / 集成 / E2E
* **AI 质量** · LLM 输出对不对 · 用户满意度

传统测试金字塔(单元 + 集成 + E2E)只能覆盖代码质量。AI 输出的"对不对"无法静态测试 · 因为同一 prompt 跑两次结果不完全一样。

业界经验(reference/Agent 测试体系):
* **静态校验**(zod schema)能管"格式对不对"
* **LLM-as-Judge** 能管"内容好不好"(用另一个 LLM 当评审)
* **人工评审 / Golden Dataset** 是最终保障

### Options

| 方案 | 层数 | 测 LLM 输出 | 覆盖率门槛 |
|---|:-:|:-:|---|
| A · 仅单元 + 集成 | 2 | ❌ | 80% |
| B · 4 层(+E2E) | 4 | ❌ | 80% |
| C · 5 层(+LLM Judge · 本案) | 5 | ✅ | 80% + Judge ≥4.0 |
| D · 仅 LLM Judge | 1 | ✅ | LLM Judge 全包 |

### Decision

**选 C · 5 层金字塔 + LLM Judge ≥4.0 + 整体覆盖率 80%**:

```
⑤ LLM Judge(100 金标准 · 评分 ≥ 4.0 · 夜跑 + PR 抽样)
④ E2E(8-10 关键旅程 · playwright)
③ 集成(40-60 用例 · supertest + testcontainers)
② 单元(200+ 用例 · vitest)
① 静态(tsc strict + eslint + schema diff)
```

**覆盖率门槛**:
* 整体 ≥ 80%
* `src/server/agents/` ≥ 90%(核心)
* `src/lib/` ≥ 95%(工具)

**LLM-as-Judge 配置**:
* Judge 模型 · GPT-4o(用不同模型避免自我验证)
* 5 维度评分 · 结构 / 相关 / 风格 / 实用 / 安全
* 通过阈值 · 4.0 / 5.0
* 任何 prompt 改动必跑回归(对比改动前后) · 不下降才允许合并

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 静态测不到的 LLM 输出有兜底 | Judge 评分 + 人工金标准 |
| ✅ 防止 prompt 退化 | 改 prompt 后回归测试 · 评分降了不让合并 |
| ✅ 跟 LD-013 zod schema 互补 | zod 管格式 · Judge 管内容 |
| ⚠️ Judge 跑批费 token | 100 金标准 × Judge GPT-4o ≈ $5 / 全跑 · 夜跑预算 |
| ⚠️ Golden Dataset 维护 | 100 用例需要人工标 · 每月 review 一次 |
| ⚠️ 80% 覆盖率不等于 LLM 质量 | 有覆盖率不意味着 LLM 输出好 · 5 层缺一不可 |

### Implementation Notes

* CI 完整跑时 ~1 小时(详见 [AGENTS §7.8 GitHub Actions](AGENTS.md))
* Golden Dataset 在 `tests/llm-judge/golden-dataset.ts`
* Judge 模板在 `tests/llm-judge/config.ts`
* PR 抽样 20 用例(快验) + 夜跑 100 用例(回归)
* 失败处理 · Slack 通知 + 自动回滚(可选)

### References

* ADR-013(LLM Gateway 是 Judge 调用底座)
* ADR-014(zod schema 是 ① 静态层)
* [reference/Agent 测试与质量保障体系](../Ai_Agent/knowledge-base/reference-materials/Agent测试与质量保障体系.md)
* [ARCHITECTURE.md §9.11-E](ARCHITECTURE.md)
* [AGENTS.md §7](AGENTS.md)

---

## ADR-017 · trending 抓取 · 第三方授权 · 严禁自建爬虫

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-017
> **范畴** · 法律 + 合规
> **派生自** · [ARCHITECTURE.md §9.13b](ARCHITECTURE.md) · [LD-017 红线 R-17](AGENTS.md)

### Context

`/trending` 模块 + TopicAgent 都需要"全网爆款"数据 · 5 平台(抖音 / 小红书 / 视频号 / 快手 / B 站)。

获取方式 3 种:
* **A · 官方 API** · 平台开放 API · 申请企业资质
* **B · 第三方授权数据** · 新榜 / 蝉妈妈 / 飞瓜数据等付费授权
* **C · 自建爬虫** · puppeteer / playwright + 代理 + UA spoof

C 方案的法律风险:
* 违反 robots.txt · 平台风控封 IP
* 部分平台明确诉讼(快手 / 抖音多次起诉爬虫数据公司)
* 等保合规风险
* 一旦被识别 · 损失远超授权费

### Options

| 方案 | 实施 | 优势 | 劣势 |
|---|---|---|---|
| A · 官方 API | 抖音开放平台 / 小红书企业 API / B 站 OpenAPI | 100% 合规 · 长期稳定 | 申请门槛(企业资质 · 部分仅蓝 V)+ 数据有限制 |
| B · 第三方授权(本案 MVP) | 新榜 / 蝉妈妈 / 飞瓜 API · 付费授权 | 合规 + 数据全 + 即开即用 | 月费 ¥5k-30k · 增成本 |
| C · 自建爬虫(❌ 严禁) | puppeteer + 代理 + UA spoof | 0 授权成本 | 法律风险高 · 不推荐 |

### Decision

**MVP 阶段(P5 上线时)选 B · 第三方授权** + **扩展期切换 A · 官方 API** · **严禁 C 方案**(LD-017 + R-17 红线 grep 检测)。

具体路径:
```
P5 上线 ·
   接入新榜 / 蝉妈妈 任一(月费 ¥5k-10k 起步) → trending 数据立即可用
扩展期(用户上量后) ·
   申请抖音 / 小红书 / 视频号 官方 API → 替换为官方源
长期 ·
   A 为主 · B 为补(部分 niche 平台无官方 API)
```

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 法律 0 风险 | 上线前法务确认 vendor 合同 |
| ✅ 即开即用 | 第三方授权 1-2 周接入 · 不延误 P5 |
| ⚠️ 月费成本 | ¥5k-30k · 影响商业模式(详见 [ARCHITECTURE §9.12b](ARCHITECTURE.md)) |
| ⚠️ 数据不一定最全 | 第三方覆盖可能不全 · 需评估 |
| ⚠️ 长期切换成本 | B → A 切换时 trending 数据格式可能变 |

### Implementation Notes

* `src/server/workers/trending-scraper/` 严禁出现 `puppeteer` / `playwright` 依赖(R-17 grep 检测)
* `package.json` dev/test 用的 `@playwright/test`(E2E 测试)允许 · 但 `playwright-core` 不允许
* vendor API 抽象成统一接口 · 后期切换不影响 TopicAgent 调用
* 法务文件 · `docs/legal/trending-vendor-contract.md` 留存合同条款摘要
* 抓取频率 · 本架构建议每 4 小时一次(参 [ARCHITECTURE §5.2 L5 注解](ARCHITECTURE.md)) · 实际跟 vendor 套餐协商

### References

* ADR-012(trending 数据入 pgvector)
* [ARCHITECTURE.md §9.13 + §9.13b](ARCHITECTURE.md)
* [AGENTS.md §3 LD-017 · §5 R-17](AGENTS.md)
* 平台开放文档 · 抖音开放平台 / 小红书企业服务 / 蝉妈妈 / 新榜

---

## ADR-018 · 行业合规 + PII 脱敏

> **Status** · Accepted · 2026-05-06
> **关联 LD** · LD-018
> **范畴** · 合规
> **派生自** · [ARCHITECTURE.md §9.11-D](ARCHITECTURE.md) · [reference/Agent 安全架构与合规指南](../Ai_Agent/knowledge-base/reference-materials/Agent安全架构与合规指南.md)

### Context

QuanAn 56 行业里 · 部分行业受**严格法规约束**:
* 医疗(/医疗健康 / 心理咨询 / 健康养生)· 不能出具体医疗建议
* 法律(法律咨询)· 不能出具体法条引用
* 金融(金融理财)· 不能预测具体收益

如果 LLM 直接生成内容 · 可能:
* 幻觉出"某药能治某病"(医疗事故)
* 编造"某条法律支持你"(误导)
* 预测"投资某品类年化 30%"(违规)

且 · 用户 PII(邮箱 / 手机 / 真实姓名)入 prompt 有合规风险:
* 跨境数据传输(发到 OpenAI 美国 API)
* GDPR / 个保法
* 用户授权问题

### Options

| 维度 | 方案 | 选择 |
|---|---|---|
| 行业内容免责 | A 不做 / B 关键词触发自动加底部声明 / C 全部加 | **B**(本案) |
| PII 脱敏 | A 不做 / B 输入端 mask / C 输出端检测 | **B**(本案 · 输入端 mask 更安全) |
| 跨境数据 | A 用 OpenAI 美国 / B 切阿里云国内 LLM 备选 / C 双栈 | **C**(本案 · 主用 Anthropic / 备选阿里云) |

### Decision

**3 个 B/C 组合**:

#### ① 行业内容免责(关键词触发)

* `src/lib/compliance/disclaimer.ts` 实现关键词检测
* 触发规则 · IpAccount.industry 命中 `health` / `psychology` / `medical` / `law` / `finance` 等敏感行业 → 输出末尾自动加底部免责
* 免责文案模板:
  - 医疗 · "本内容仅供参考 · 不构成医疗建议 · 具体诊疗请咨询执业医师"
  - 法律 · "本内容仅供参考 · 不构成法律意见 · 具体事项请咨询执业律师"
  - 金融 · "本内容仅供参考 · 不构成投资建议 · 投资有风险 · 决策需谨慎"

#### ② PII 输入端脱敏

* `src/lib/compliance/pii-mask.ts` 实现
* ContextAssembler 在拼 prompt 前必跑 PII mask
* 脱敏规则 · 邮箱 / 手机 / 真实姓名替换成 `<EMAIL>` `<PHONE>` `<NAME>` 占位符
* 用户 ID / 账号 ID 不脱敏(业务必需)

#### ③ 跨境数据双栈备选

* MVP 主用 Anthropic / OpenAI(美国 API)
* 备选 阿里云通义千问 / 腾讯混元(国内 API)· 由 LLMGateway 透明切换
* 用户协议明示"数据可能传输至境外"· 用户授权后才能用主 API

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 法律风险大幅降低 | 关键词触发免责 + PII 不入 prompt · 兜底了 90% 合规风险 |
| ✅ 跟 LLM Gateway 配合 | LLMGateway 接 metadata 调度国内 / 国外 API |
| ⚠️ 免责声明可能影响营销文案效果 | 用户可能想"我不要免责声明 · 干扰阅读" → 后续企业版可关闭(单独 ADR) |
| ⚠️ PII mask 误伤 | 用户输入"我叫王伟"被 mask 成 "我叫 \<NAME\>" · 上下文不全 |
| ⚠️ 国内 API 质量 | 阿里云通义 / 腾讯混元 中文 OK 但推理深度不如 Sonnet · 仅备选 |

### Implementation Notes

* `src/lib/compliance/disclaimer.ts` · 关键词 → 行业 → 模板映射
* `src/lib/compliance/pii-mask.ts` · 正则 + 自定义白名单
* ContextAssembler 内调 pii-mask 在拼 userPrompt 之前
* 业务输出后调 disclaimer · CopywritingAgent / VideoAgent 等内容产出 Specialist 必跑
* 单元测试 · disclaimer 6 行业 + pii-mask 3 类(邮箱/手机/姓名)= 9 用例
* 集成测试 · 含 PII 输入 → 验证不入 LLM 调用 · `audit_log` 检测

### References

* ADR-013(LLM Gateway 调度国内 / 国外 API)
* ADR-014(EvolutionAgent 也走 ContextAssembler · 受 PII mask 保护)
* [reference/Agent 安全架构与合规指南](../Ai_Agent/knowledge-base/reference-materials/Agent安全架构与合规指南.md)(OWASP LLM Top 10 / GDPR / 个保法)
* [ARCHITECTURE.md §9.11-D](ARCHITECTURE.md)
* [AGENTS.md §3 LD-018 · §5 R-14](AGENTS.md)

---

## 修订记录

- **2026-05-06 v0.1** · 创建骨架 + 18 ADR 全部填充
  - **批 1 · 架构基础**(5 ADR · 347 行)
    - ADR-001 编排范式 95/5
    - ADR-002 三层编排 L4-L7
    - ADR-003 Specialist 切分 + 五层配置
    - ADR-004 协作模式 Centralized + 软 Supervisor
    - ADR-005 3 L5 自治 · 外部 Orchestrator
  - **批 2 · 记忆 + 飞轮**(4 ADR · 307 行)
    - ADR-006 五层记忆架构(替换 Summarizer/Portrait)
    - ADR-007 ContextAssembler 唯一入口
    - ADR-008 反馈飞轮 5 阶段
    - ADR-009 EvolutionProfile 账号级
  - **批 3 · 数据架构**(3 ADR · 282 行)
    - ADR-010 多账号数据隔离 3 道闸
    - ADR-011 LS↔DB 双写 4 规则
    - ADR-012 RAG 边界 + pgvector 选型
  - **批 4 · 接口 + 护栏**(2 ADR · 246 行)
    - ADR-013 LLM Gateway 唯一入口
    - ADR-014 zod + trace_id + 错误恢复
  - **批 5 · 视觉 + 测试 + 合规**(4 ADR)
    - ADR-015 Aurelian Dark 设计系统
    - ADR-016 测试金字塔 + LLM Judge
    - ADR-017 trending 抓取 · 第三方授权
    - ADR-018 行业合规 + PII 脱敏

- **2026-05-07 v0.2** · 加 3 条 admin 子系统 ADR(对应 REVIEW P0-1 / P0-3 / P1-4 全链路修复)
  - **批 6 · admin 子系统**(3 ADR)
    - ADR-019 前后端分离 + monorepo workspace(对应 REVIEW P0-3 + P1-7)
    - ADR-020 Approval Gates 高风险操作两步审批(对应 REVIEW P1-4)
    - ADR-021 管理后台独立 first-class 子系统(对应 REVIEW P0-1 根因)

---

## ADR-019 · 前后端分离 + monorepo workspace

> **Status** · Accepted · 2026-05-07
> **关联 REVIEW** · P0-3(前后端分离边界声明缺位)+ P1-7(pnpm-workspace 强制)
> **范畴** · 工程结构(monorepo + 独立部署)
> **派生自** · [`ARCHITECTURE.md`](ARCHITECTURE.md) §1.4b · [`SCAFFOLD.md`](SCAFFOLD.md) §A · [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) §2

### Context

QuanAn 项目从 v0.1 起隐含了前后端分离意图(Vite + Hono + tRPC + 独立的 `pnpm dev` / `pnpm server` 命令)· 但在 v0.2 之前**没有显式架构边界声明**:
- ARCHITECTURE.md 没说"前端是单独部署还是同进程"
- SCAFFOLD.md 写 `pnpm-workspace.yaml(可选)` — 实际 src/ 下前后端混在一个包内
- 没有 ADR 把这个决策固化

REVIEW(2026-05-06)指出 · 这种"技术分离 ✓ · 边界声明 ✗"的状态会:
- 团队认知不一致(Ralph 执行 P0 时可能把 web + api + admin 全放一个包)
- 后续拆 admin 时大重构(参 ADR-021)
- 部署形态争论(Vercel 单部署 vs 多部署)

### Options

| 方案 | 结构 | 适用场景 |
|---|---|---|
| A · 单包 monolith | src/ 全部 · package.json 一个 | 小项目 · 1 个客户端 · 1 个团队 |
| B · 双包 client+server | apps/web + apps/api · 共享 packages/* | 单一客户端 · 标准前后端分离 |
| C · 多包 monorepo(本案)| apps/web + apps/admin + apps/api + packages/* | 多客户端 · 独立部署 · 独立故障域 |
| D · 多 repo polyrepo | quanan-web · quanan-admin · quanan-api 三个独立仓库 | 大团队 · 跨团队隔离 |

### Decision

**选 C · 多包 monorepo**:
- 三方独立部署单元:`apps/web`(www.quanan.com)+ `apps/admin`(admin.quanan.com)+ `apps/api`(api.quanan.com)
- 共享层:`packages/schemas`(zod 真理)+ `packages/ui/{base,admin}`(组件)+ `packages/clients`(tRPC client)
- 管理工具:**`pnpm-workspace.yaml` 强制启用**(从 SCAFFOLD v0.1 的"可选" → v0.2 的"强制")

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 部署独立性 | 三方独立 CI/CD · 改 web 不发 admin · admin 挂不影响 web |
| ✅ 故障域隔离 | 任一挂掉不影响其他 |
| ✅ 共享代码 | zod 改一处 · 三方自动同步 · 不复制粘贴 |
| ✅ 拆 admin 子系统的工程基础 | 直接接受 ADR-021(无需重构) |
| ⚠️ Workspace 学习成本 | pnpm workspace + 跨包依赖管理 · 团队需要培训(0.5 天)|
| ⚠️ Build 复杂度 | 三个独立 build pipeline · 需要 turborepo / nx 管理(可选)|
| ⚠️ TypeScript 配置复杂 | tsconfig.json 多个 · path mapping 需要规范 |

### Implementation Notes

- `pnpm-workspace.yaml` 写明 `apps/* + packages/*`
- 每个 `apps/*` 和 `packages/*` 各自 `package.json`
- 跨包依赖通过 `workspace:*` 协议(`"@quanan/schemas": "workspace:*"`)
- 根 `tsconfig.json` 用 path mapping(`"@quanan/schemas/*": ["packages/schemas/src/*"]`)
- CI/CD 用 GitHub Actions 路径触发(`paths: apps/web/**` → 只跑 web 部署)

### References

- [`SCAFFOLD.md`](SCAFFOLD.md) §A 强制 monorepo 改造(完整文件清单)
- [`ARCHITECTURE.md`](ARCHITECTURE.md) §1.4b · §2.5b
- [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) §2 部署形态
- ADR-021(管理后台独立子系统 · 是本 ADR 的下游展开)

---

## ADR-020 · Approval Gates 高风险操作两步审批

> **Status** · Accepted · 2026-05-07
> **关联 REVIEW** · P1-4(Approval Gates / HITL 流程缺位)
> **范畴** · 安全边界(高风险操作)
> **派生自** · [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) §4.4 + §7.6 · 知识库 ADR-016 Approval Gates

### Context

admin 后台子系统涉及大量"一步操作影响多个用户 / 多账号"的高风险动作:
- 改用户套餐 / 封禁用户
- 作废邀请码(批量)
- 强制重跑 EvolutionAgent(影响进化档案)
- 发布新 Prompt 版本(灰度 > 10%)
- 跨账号大批量改(≥ 100 账号)
- 紧急止损(停 trending / 停 EvolutionAgent / 启用降级 prompt)

如果**单 admin 一步操作**就生效:
- 误操作风险高(没第二道闸)
- admin 账号被盗 → 立即跨账号大规模数据泄露
- 法务取证困难(没"申请人 + 审批人"两段链路)

知识库 [ADR-016 Approval Gates](../Ai_Agent/knowledge-base/08-tech-decisions/) 给出标准范式 · 但 v0.1 版本 QuanAn ADR 18 条**没采纳这条**。

### Options

| 方案 | 实现 | 适用场景 |
|---|---|---|
| A · 不做(每个 admin 单步生效)| 简单 | 内部小团队 · 信任度极高 |
| B · 二次确认弹窗(UI 层)| 中 · UI 加 "确认" 按钮 | 防误点 · 不防恶意 |
| C · Approval Gates 两步审批(本案)| 高 · 申请 + 异步审批 + 执行 + 审计 | 防误操作 + 防账号被盗 + 法务取证 |
| D · 双人物理在场(super_admin + 另一 super_admin 同时在线)| 极高 · 实时联机 | 银行级别 · MVP 不必 |

### Decision

**选 C · Approval Gates 两步审批 + 紧急通道补充**:

**14 类高风险动作走标准两步审批**:
1. 改用户套餐(降级)
2. 封禁用户
3. 作废邀请码(批量 ≥ 10 条)
4. 自动审核规则配置变更
5. 强制重跑某账号 EvolutionAgent
6. 发布新 Prompt 版本(灰度 > 10%)
7. Prompt 一键回滚
8. 长期放配额(> 24h)
9. 修改套餐配额定义
10. 改免责模板
11. 启动 / 停止 A/B 实验
12. 修改静态常量
13. 改 feature flag(影响 ≥ 10% 用户)
14. 紧急关闭 trending / EvolutionAgent

**4 类二次审批**(需 2 人 · 申请人 ≠ 审批人):
1. 跨账号大批量改(≥ 100 账号)
2. 强制重跑 ≥ 10 账号
3. Prompt 版本 100% 灰度发布
4. 改 feature flag 影响 ≥ 50% 用户

**2 类紧急通道**(1 人快速批 + 后置 24h 复核):
1. 紧急止损(prod 报错)
2. 临时白名单(单账号 · 24h 自动失效)

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 安全边界 | 误操作 / 账号被盗造成的损失被两步审批拦截 |
| ✅ 法务取证 | approval_request 表 + admin_audit_log 双记录 · 完整可追溯 |
| ✅ 运营节奏 | admin 学习成本(必须申请 + 等审批) · 但符合内部团队规范 |
| ⚠️ 审批方负担 | super_admin 每天处理 N 条审批 · 需要钉钉 bot 帮忙 |
| ⚠️ 紧急场景兜底 | 紧急通道 1 人即可 · 但有后置复核 + 24h 自动失效 · 防滥用 |
| ⚠️ 实施复杂度 | 中间件 + 表 + 通知 + UI · 估计 P9.3 域 ⑬ 0.3 周(详见 ADMIN §8.5) |

### Implementation Notes

- 后端 · `approvalGateCheck` middleware 挂在每个高风险 procedure(参 ADMIN §7.6 代码示例)
- 数据 · `approval_requests` 表(参 ADMIN §4.4 完整 schema)
- 通知 · 钉钉 webhook + 站内信 + 邮件三方
- UI · admin SPA 域 ⑬ Approval Gates 工作流(参 ADMIN §3.5)
- 紧急通道 · `isEmergency=true` + `postReviewAt` 字段 + 24h cron 复核

### References

- [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) §4.4 14 类高风险动作清单 + §7.6 实现细节
- 知识库 [ADR-016 Approval Gates](../Ai_Agent/knowledge-base/08-tech-decisions/)
- ADR-021(管理后台子系统 · 是本 ADR 的应用场景)

---

## ADR-021 · 管理后台独立 first-class 子系统

> **Status** · Accepted · 2026-05-07
> **关联 REVIEW** · P0-1(根因 · 8 P0 中 7 个由本决策派生解决)+ 硬约束#2 + 硬约束#3
> **范畴** · 系统拓扑(双子系统)
> **派生自** · [`ARCHITECTURE-REVIEW.md`](ARCHITECTURE-REVIEW.md) §3 + §5 · [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) 全文

### Context

ARCHITECTURE.md v0.2 把管理后台当成主应用的"附属页面"(§2.5b 仅 15 行 / 占 0.5%):
- 走 `tRPC adminMiddleware` 嵌入主应用
- 仅 1 个 admin 路由(`/admin/invite-manage`)+ 2 个标"可选"
- 实施时机 · "延到 P8 之后(MVP 不需要)"

REVIEW 指出三个根因:
1. **复刻原版的简陋 admin 设计**(aiipznt-spec.md §16.3 实测原版自己也只是"推测后台功能")
2. **业务管理需求被埋在配套文档里 · 没浮到 ARCHITECTURE 主层面**(DATA-MODEL / AGENTS 实测 20+ 处 admin 需求 · ARCHITECTURE §2.5b 只 surface 了 3 个)
3. **"MVP 不做"的决策错过了架构窗口**(P8 后再仓促添加 = 大量返工)

用户硬约束:**前后端分离 + 独立的管理后台 + 管理后台 web 页面** — 当前 v0.2 严重违反。

### Options

| 方案 | 形态 | 工作量 | 长期成本 |
|---|---|:-:|:-:|
| A · 维持 v0.2 现状 | admin 嵌入主应用 + 1 路由 | 0 | **极高** · 后期返工 / 法律 / 合规风险 |
| B · 加几个 admin 路由 | 嵌入 + 5-10 admin 页 | 中 | 高 · 仍违反"独立"硬约束 |
| C · 独立子系统(本案)| 独立部署 + 独立 OAuth + 16 业务管理域 | 9 周(P9 系列)| 低 · 一次性投入 · 长期解耦 |
| D · 多 repo polyrepo | admin 独立仓库 | 极高 | 极低 · 但小团队管理成本高 |

### Decision

**选 C · 独立 first-class 子系统**:
- **部署独立** · admin.quanan.com / 独立 SPA(apps/admin)/ 独立 build / 独立 CI
- **认证独立** · 独立 OAuth client_id / 独立 Workspace 限制 / 独立 session
- **路由独立** · 13 路由组(对应 16 业务管理域)/ 独立 layout / 独立设计密度
- **后端隔离** · `adminRouter` 跟 `appRouter` 严格分离 · 6 闸鉴权链
- **数据隔离** · admin 通过 RLS bypass policy 跨账号查 + admin_audit_log 独立审计表
- **演进独立** · P9.0-P9.4 共 9 周 · 主应用 P0-P8 完成后启动(可与 P8 部分并行)

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 硬约束达成 | ① 前后端分离 70% → 100% / ② 独立管理后台 15% → 90% / ③ 管理后台 web 5% → 80% |
| ✅ 8 P0 修复(REVIEW §4) | 7 个 P0 由本决策派生解决(P0-1 根因 → 其他 7 个落 ADMIN-ARCHITECTURE.md 各域)|
| ✅ 法律 / 合规 / 运营三大风险 | TrendingItem 审核 / DeepLearning 审核 / 成本仪表盘 / 审计反查 / NSM 全部覆盖 |
| ✅ 长期演进 | admin 加功能不影响主应用 · 独立故障域 · 独立发版 |
| ⚠️ 9 周工作量 | P9 系列 5 阶段(详 ADMIN §8)· 主应用 P8 后启动 |
| ⚠️ 主应用埋点 | P1 / P5 / P7 共 4 项埋点(详 ARCHITECTURE §9.X)· 不阻塞主应用业务 |
| ⚠️ 团队认知 | 内部团队需理解"为什么访问 admin.quanan.com 而不是 www.quanan.com/admin"|
| ⚠️ 部署成本 | +1 独立部署目标(admin SPA · 但 Vercel/CF 静态托管几乎 0 边际成本)|

### Implementation Notes

- 主应用 v0.3 修订 6 处:§1.4 + §1.4b + §1.7 + §2.5b + §6.7 + §9.X(由本 ADR 触发)
- 配套 4 文档同步:ADR(加 ADR-019/020/021) · DATA-MODEL(加 13 张新表) · AGENTS(加 §10) · SCAFFOLD(强制 monorepo)
- 16 业务管理域全部规划完成(ADMIN §3) · 跑批 / 表 / UI / 鉴权 / Approval 闭环
- 实施按 P9.0(基础)→ P9.1(6 P0 业务核心)→ P9.2(2 P0 审核)→ P9.3(5 P1)→ P9.4(3 P2 后续)节奏

### References

- [`ARCHITECTURE-REVIEW.md`](ARCHITECTURE-REVIEW.md) §3 三条硬约束评估 + §5 ADMIN 9 章骨架建议
- [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) 全 9 章(本 ADR 的完整展开)
- ADR-019(monorepo 是本 ADR 的工程基础)
- ADR-020(Approval Gates 是本 ADR 的安全闸门)
- 知识库 [02 多 Agent 协作架构 §子系统拆分](../Ai_Agent/knowledge-base/02-multi-agent-collaboration-architecture/) · [reference/多租户SaaS化架构指南](../Ai_Agent/knowledge-base/reference-materials/多租户SaaS化架构指南.md)

---

## ADR-022 · globals.css 全量 OKLCH token 切换路 α(D4=B 推翻)

> **Status** · Accepted · 2026-05-22 · **实施完成 2026-05-23 · commit 4dc30f2 · visual diff 8.03%(form-state vs result-state · 预期内)**
> **PRD-29.6 补注** · 2026-05-24 · /step/3 全 button wiring 完成 · admin LLM Config 接入 · OKLCH token 系统在 button 交互层得到验证 · 全 5 e2e 用例通过
> **关联 PRD** · PRD-29 US-001a(Foundation · globals.css)
> **范畴** · 视觉 token 系统(CSS Custom Properties)
> **派生自** · PRD-29 D4=B 决策 · 路 α vs 路 β 权衡

### Context

PRD-29 目标是 1:1 复刻 aiipznt /step/3 页面，前提条件是把 QuanAn 的视觉 token 系统从 HSL 紫色系切换到 aiipznt 的金色 OKLCH 系。

D4=B 决策前评估了两条路径：
- **路 α** · 一次性全量替换 `apps/web/src/styles/globals.css` 的 168 CSS Custom Properties → aiipznt OKLCH 值 · 业务组件代码不动 · 所有 `var(--primary)` 等 token 用法自动跟切金色
- **路 β** · 保持 globals.css 不动 · 在每个业务组件 className 级别手工从 `text-violet-X` 改为 `text-amber-X / text-yellow-X`

路 β 在 PRD-21~27 已大量实践 · 存在以下问题：
1. **全局漏改风险** · 组件级改动 · 每次新增组件都要记得手工改 className · 容易漏
2. **语义错误** · `text-amber-X / text-yellow-X` 是 Tailwind 具名色 · 不是 design token · 违反 AGENTS.md R-xxx 约束
3. **维护成本高** · PRD-30~35 共 6 个 page · 路 β 需对每个新组件重复手工改
4. **视觉一致性** · 路 α token 级切换 · 100% 组件自动跟色

### Options

| 方案 | 改动点 | 一致性 | 维护成本 | 回滚风险 |
|---|---|:-:|:-:|:-:|
| 路 α · globals.css 全量 OKLCH(本案) | 1 个文件 · 168 vars | 100%(自动) | 低(一次搞定) | 低(单文件 revert) |
| 路 β · 组件级 className 修改 | N 个组件 · N×M classNames | ~85%(容易漏) | 高(每组件都改) | 高(散落各处) |
| 路 γ · Tailwind config primary color | tailwind.config.ts | 100% | 低 | 低 |

> 路 γ 被排除 · 原因: aiipznt 直接用 CSS Custom Properties OKLCH 语法 · Tailwind v4 config 映射方式不同 · 且 168 vars 中大量是非 Tailwind 内部变量(shadcn/ui tokens 等)· 直接替换 CSS 层更精确

### Decision

**选路 α**: 一次性全量替换 globals.css 168 CSS Custom Properties。

核心理由:
1. **最小改动面** · 1 文件 1 commit · 覆盖 100% 组件 · 符合"单点变更"原则
2. **自动一致性** · 所有 `var(--primary) / text-primary / bg-primary` 全部自动跟切 · 0 漏改
3. **PRD-30~35 收益** · Foundation 一次 · 6 个 page 全受益 · 无额外成本
4. **回滚安全** · 单文件 · `git revert` 一步搞定 · 零副作用
5. **aiipznt 1:1** · aiipznt 自身就是以 CSS Custom Properties 定义全套 token · 路 α 是原版最近路径

### Consequences

| 类别 | 影响 |
|---|---|
| ✅ 视觉一致性 100% | 所有 `var(--primary)` 等 token 自动跟切金色 OKLCH · 0 组件级漏改 |
| ✅ PRD-30~35 零成本 | Foundation 一次 · 后续 6 个 page 直接复用金色 token · 无额外 token 修改 |
| ✅ 跨 PRD 零回归 | US-001c verify-prd-27(33/33) + verify-prd-28(43/43) 全 pass · 1 pre-existing visual issue(prd24-evolution 非 CSS 变更) |
| ✅ 单文件 revert | 路 α 切换风险极低 · 任何时刻 git revert 4dc30f2 即可回退 |
| ⚠️ .dark block 同步 | aiipznt 是 dark-only 站 · :root 和 .dark 必须保持完全相同 · 任何后续改 globals.css 必须双改 |
| ⚠️ tw 内部 vars 保留 | 168 vars 含 --tw-* / --text-* 等 Tailwind v4 内部变量 · 在 Tailwind v3 项目里全放 :root 是安全的 · 但升级 Tailwind v4 时需 review |

### Implementation Notes

- 源数据: `docs/research/aiipznt/step-3/deeper/root-css-variables.json`(168 vars flat object) + `dark-css-variables.json`(nested · 值相同)
- 关键值: `--primary: oklch(82% .14 85)` / `--background: oklch(7% .005 75)` / `--foreground: oklch(92% .02 85)` / `--accent: oklch(72% .13 85)`
- `.dark block` 与 `:root` 完全相同 · aiipznt dark-only · 不允许 `.dark` 留 HSL 紫色
- 168 vars 分 4 组: design tokens / chart colors / sidebar colors / Tailwind utils
- 实施 story: PRD-29 US-001a · `4dc30f2` · `apps/web/src/styles/globals.css`(351 insertions / 21 deletions)
- visual diff: `scripts/diff-aiipznt-step-3-image.mjs` pixelmatch → 8.03%(form-state vs result-state · 预期内 · 非布局偏差)

### References

- [PRD-29 US-001a progress.txt entry](scripts/ralph/progress.txt)(2026-05-23 15:15)
- [.agents/verification/prd-29-step-3-foundation.md](.agents/verification/prd-29-step-3-foundation.md) §0.3 AGENTS.md 对账
- [.agents/retros/prd-29-vs-prd-28-retrospective.md](.agents/retros/prd-29-vs-prd-28-retrospective.md) §3.5 P-29-5 playbook
- ADR-019(monorepo 基础)· ADR-021(admin 子系统 · 本 ADR 不影响 admin token)
