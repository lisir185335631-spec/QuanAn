# QuanAn · ARCHITECTURE.md 深度 Review 报告

> **日期** · 2026-05-06
> **Reviewer** · Claude(Opus 4.7)· 基于 `knowledge-base/`(115 文档 / 3.4MB)设计标准
> **主 Review 对象** · [`ARCHITECTURE.md`](ARCHITECTURE.md)(v0.2 · 9 章 / 3022 行 / 181KB)
> **参考输入**(三方资源)
> ① `~/Desktop/aiipznt-clone-research/`(130 文件 · aiipznt.vip 逆向研究 · 复刻基线)
> ② `~/Desktop/QuanAn/`(178 文件 · 项目本仓库 · 含 6 份核心文档 + 脚手架)
> ③ `~/Desktop/Ai_Agent/knowledge-base/`(115 文档 · 设计标准 + 实战案例)
> **硬约束**(本次 review 必须纳入评估)
> ① 前后端分离架构
> ② 独立的管理后台(独立服务,不嵌入主应用)
> ③ 管理后台 web 页面(完整管理端 UI)

---

## 文档地图

| § | 章节 | 一句话 |
|:-:|---|---|
| §0 | 执行摘要 | 7 维度按维度评分 + 一句话结论 |
| §1 | 资源盘点 | 三方资源是什么 / 体量 / 关系 |
| §2 | 整体架构判断 | 8 大亮点 + 总体质量基线 + 知识库契合度 |
| §3 | **三条硬约束覆盖度评估 ★** | 前后端分离 / 独立管理后台 / 管理后台 web 各自评分 |
| §4 | 多维度问题清单 | P0 必修 / P1 应修 / P2 可优化 |
| §5 | 改进建议 | 管理后台独立架构方案 + 业务管理域扩展 + 部署形态 |
| §6 | 与知识库的更紧融合点 | 哪些 ADR 可借鉴 / 哪些章节可深化 |
| §7 | 下一步建议 | 改架构走什么流程 / Coding 3.0 协同 |

---

## §0 执行摘要

### 0.1 整体健康度(按维度看 · 不汇总总分)

> ⚠️ **不汇总总分** · 本仓库 `knowledge-base/12-knowledge-management/03` §2 已经吸取教训:维度权重因人而异,强行求和会误导。**按维度看 · 找你最在意的那项**。

| 维度 | 评级 | 一句话 |
|---|:-:|---|
| **整体架构清晰度** | ✅ 强 | 9 层 + 4 层编排 + 14 Specialist + 5 层记忆 + 飞轮 5 阶段 — 拓扑透明 · 边界清晰 |
| **与知识库标准契合度** | ✅ 强 | 显式引用了 7 个 ADR + 11/02、11/04、11/05 实战 + PI/03 + 安全/测试体系 — 范式落地到位 |
| **与 aiipznt 复刻完整度** | ✅ 强 | 9 步 + 14 工具 + 6 新模块 + 18 LS keys + 13 router 全部对齐 spec.md 实测 |
| **前后端分离架构** | 🟡 中(技术分离 ✓ 边界分离 ✗) | tRPC 类型安全 + Vite/Hono 拆分到位,**但管理后台没有"独立服务边界"** |
| **独立管理后台设计** | 🔴 弱(❗硬约束未达成) | §2.5b 仅 15 行 / 占 0.5% · 走 `role middleware` 嵌入主应用 · 与硬约束#2 有结构性差距 |
| **管理后台 web 页面** | 🔴 弱(❗硬约束未达成) | 全文档只有 1 个 `admin/InviteManage.tsx`(AGENTS:717)· 无独立布局/导航/dashboard/13 个必备业务管理域 |
| **Coding 3.0 协同就绪度** | ✅ 强 | §9.12 + AGENTS / ADR / DATA-MODEL / PROMPTS / SCAFFOLD 5 件套齐 · 可直接进 P0 |

### 0.2 一句话结论

> **ARCHITECTURE.md v0.2 是一份高质量的"主应用架构骨架"** —— **业务侧(9 步主线 + 14 工具 + 5 层记忆 + 进化飞轮)的设计深度和知识库对齐度都达到了 ✅ 级**。
>
> **但作为"前后端分离 + 独立管理后台 + 管理后台 web"项目的架构文档,它有一个 P0 级的结构性缺口** —— **管理后台被当作主应用的一个"附属页面"(15/3022 行 = 0.5% 篇幅)而不是 first-class 子系统**,继承了 aiipznt 原版的简陋 admin 设计(spec §16.3 实测原版只有 1 个 `/invite-manage` 且自己也标注"推测后台功能")。
>
> 解法不是改 ARCHITECTURE.md 局部,而是 —— **新建一份 `ADMIN-ARCHITECTURE.md`** 把管理后台升级为独立子系统(独立部署 / 独立 SPA / 独立路由 / 独立 tRPC 命名空间 / 13 个业务管理域全覆盖)。详细方案见 §5。

### 0.3 三条硬约束达成度速读

| 硬约束 | 达成度 | 关键证据 | 修复路径 |
|---|:-:|---|---|
| ① 前后端分离 | 🟡 70% | tRPC + Vite + Hono 已分(README:38-46)· 但**未明确是"两套独立部署"还是"同一进程**" | 在 ARCHITECTURE §1.4 + §9 显式声明部署边界 + .env 双前端配置 |
| ② 独立管理后台 | 🔴 15% | §2.5b(ARCHITECTURE:362-376)只列 3 个 admin 路由 · 走 `tRPC adminMiddleware`(DATA-MODEL:2195)· 嵌入主应用 | **新建 ADMIN-ARCHITECTURE.md** + 拆出独立 `apps/admin/` workspace |
| ③ 管理后台 web 页面 | 🔴 5% | 全仓库仅 1 个 admin 页面(AGENTS:717 `admin/{InviteManage}.tsx`) · 无 layout / nav / dashboard | 设计 13+ 业务管理域 web 页面(详见 §5.2) |

---

## §1 资源盘点

### 1.1 输入边界:三方资源是什么关系

```
                  ┌──────────────────────────┐
                  │  aiipznt.vip(线上目标)  │   ← 复刻原型
                  └─────────────┬────────────┘
                                │ 逆向(2026-05-05 · 3 轮 · 98% 完成度)
                                ▼
                ┌────────────────────────────────────┐
                │ aiipznt-clone-research/(130 文件)  │
                │ · 27 raw HTML · 32 dynamic JSON   │
                │ · API bundle 反编译(50+ tRPC)    │
                │ · 18 LS schema 实测                │
                │ · TECH-STACK + ROUTES 推断         │
                └────────────────┬──────────────────┘
                                 │ 提炼成 spec
                                 ▼
                  ┌──────────────────────────────┐
                  │ aiipznt-spec.md(322KB · 50 章)│   ← 复刻蓝图
                  └──────────────┬───────────────┘
                                 │ 项目化
                                 ▼
            ┌─────────────────────────────────────────┐
            │ QuanAn/(178 文件 · 项目本仓库)            │
            │                                         │
            │ ┌─ 5 份核心文档(总 537KB)──────────┐     │
            │ │ · ARCHITECTURE.md  181KB  ★主对象 │     │
            │ │ · DATA-MODEL.md    114KB         │     │
            │ │ · AGENTS.md         99KB         │     │
            │ │ · PROMPTS.md        80KB         │     │
            │ │ · ADR.md            70KB         │     │
            │ │ · aiipznt-spec.md  322KB(嵌入)  │     │
            │ │ · SCAFFOLD/README/SCAFFOLD-COMP  │     │
            │ └──────────────────────────────────┘    │
            │ ┌─ 脚手架就绪 ───────────────────────┐  │
            │ │ src/server/index.ts · src/lib/...  │  │
            │ │ prisma/schema.prisma + RLS + IVF   │  │
            │ │ vite/tsconfig/eslint/prettier 全套 │  │
            │ │ ui/ 60+ 设计稿(Aurelian Dark)    │  │
            │ └────────────────────────────────────┘  │
            └─────────────────────┬──────────────────┘
                                  │ 借鉴
                                  ▼
              ┌──────────────────────────────────┐
              │ knowledge-base/(115 文档 · 3.4MB)│
              │ · 4 层架构(理论/工程/业务/工具)│
              │ · PI Agent 设计哲学 13 篇         │
              │ · 11/01-11.5 双案例对标实战       │
              │ · 22 ADR + 41 reference 篇        │
              └──────────────────────────────────┘
```

### 1.2 aiipznt-clone-research 角色定位

| 项 | 值 |
|---|---|
| 文件总数 | 130 |
| 抓取完成度 | ≈ 98%(README:5)· 剩 2% 是 AI 生成结果范例 + 截图 |
| 关键产出 | `docs/TECH-STACK.md`(技术栈推断)· `docs/ROUTES.md`(34 路由)· `schema/localStorage-full.json`(142KB · 18 keys) · `api/bundle.js`(2.2MB · 反编译查 50+ tRPC) |
| 27 raw HTML 页面 | 完整 outerHTML · 复刻视觉的"地基" |
| 32 dynamic JSON | 4 一级菜单 + 5 IP 切换 + Sonner toast + 错误状态 + voice-chat 气泡 + 进度模块 ... |

**对 review 的价值** · 是**事实层"对标基准"** · 验证 ARCHITECTURE.md 是否覆盖了原版所有功能 · 也是发现"原版有什么 QuanAn 没设计"的最直接证据。

### 1.3 QuanAn 角色定位

| 项 | 值 |
|---|---|
| 文件总数 | 178 |
| 项目阶段 | v0.1 · 架构骨架就绪 · 脚手架就绪 · **未进入业务实现** |
| 文档体量 | 5 核心文档(537KB)+ 1 嵌入复刻蓝图(322KB)= **总 859KB 设计文档** |
| 已就绪代码 | 11 根配置文件 + Prisma schema + RLS + IVF · src/server/index.ts + src/lib/logger.ts(脚手架占位) |
| 未就绪 | 14 Specialist 实现 / 13 tRPC router 实装 / 34 页面 UI / **管理后台**(下面 §3 详谈) |

**对 review 的价值** · 是**评估对象本身** · 5 份 + 1 份核心文档之间相互强依赖,review 不能只盯 ARCHITECTURE 看,要把它放到这 6 份文档的关系网里看。

### 1.4 ARCHITECTURE.md 自身概况

| 项 | 值 |
|---|---|
| 章节数 | 9 章(§1 系统总览 → §9 实施路线图) |
| 行数 / 字节 | 3022 行 / 181KB |
| 自我定位(L1) | "在其上叠加知识库 Agent 范式形成「骨架」" |
| 引用 knowledge-base 的次数 | ≥ 11 处(§7.7 借鉴清单) — 3 ADR + 4 实战案例 + 4 reference 专题 |
| v0.2 修订记录(L3003-3022) | 16 处问题(2 P0 + 5 P1 + 9 P2)全部修复 — **质量已经过一轮 self-review** |

### 1.5 配套文档的角色与质量

| 文档 | 行数 | 角色 | 与 ARCHITECTURE 的关系 | 本 review 引用度 |
|---|:-:|---|---|:-:|
| AGENTS.md | 2324 | 代码层 LD / 红线 / audit_commands(Coding 3.0 必读) | "怎么做 / 不能做"(代码侧约束) | ⭐⭐⭐ |
| ADR.md | 1546 | 22 ADR 完整决策记录 | LD 展开版(架构侧理由) | ⭐⭐⭐ |
| DATA-MODEL.md | 2868 | 18 实体 Prisma schema + RLS + 索引 | §3 数据架构的具体落地 | ⭐⭐⭐(找 admin 时关键)|
| PROMPTS.md | 2340 | 14 Specialist system prompt 模板 | §4 Agent 编排的具体落地 | ⭐ |
| SCAFFOLD.md | 242 | src/ 80 文件目录索引 | 工程组织(非设计) | ⭐⭐(找 admin 文件) |
| aiipznt-spec.md | 9192 | 复刻蓝图(L1 输入边界) | "做什么"的事实层来源 | ⭐⭐(找 admin §16) |

> **6 份文档之间的版本一致性**已经过一轮 v0.2 修订(ARCHITECTURE:3003-3022 列了 16 处)· 但 admin 后台的"系统级缺位"是**贯穿 6 份文档**的同质问题 — 不是某个文档的 bug,是**整体设计哲学**没把 admin 当作 first-class 子系统。

### 1.6 资源盘点小结

本节答 4 件事:
1. 三方资源是"线上原型(aiipznt) → 逆向研究 → 复刻蓝图 → 项目本仓库"的提炼链
2. ARCHITECTURE.md 体量 181KB / 9 章 / 已自审一轮(v0.2)· 是 5 文档体系的核心
3. 知识库 115 文档作为评估基准 · ARCHITECTURE 已显式引用 11+ 次
4. 配套 5 份文档跟 ARCHITECTURE 是**互锁的设计同心圆** · review 不能只看 ARCHITECTURE 一份

下一节(§2)进入整体架构判断 · 列亮点和总体质量基线。

---

## §2 整体架构判断

> 本节回答 · "ARCHITECTURE.md 的整体设计水平怎么样"。先列亮点(为什么是 ✅ 级)· 再说基线(踩在什么 baseline 上)· 最后说哪些"看起来好但藏隐患"。
>
> ⚠️ **本节的肯定不抵消 §3 的硬约束缺口** — 主应用架构再优秀,也不代表管理后台架构就好。这是两件事。

### 2.1 八大亮点(为什么主应用部分是 ✅ 级)

#### 亮点 1 · Workflow + Agent 二分法落地准确

`§4.1`(ARCHITECTURE:722-783)按 Anthropic 官方二分法把 30+ 节点判定为"95% Workflow + 5% Agent",**只有 3 个真正自治节点**(VoiceChat / Evolution / DailyTask)走 ADR-018 外部 orchestrator。

* 🟢 **正确判断**:9 步主向导 / 14 工具页 / 反馈点击 = **用户主动 + 单次 LLM** = Workflow,不需要"LLM 自己决定下一步"
* 🟢 **跟知识库一致**:[`reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md`](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md) §6.5 "10 个业务拆分实例" 实测过这种判断方式
* 🟢 **避坑**:LangGraph 鼓励"每个 step 都是 Agent",这套设计明确**反对**这种过度抽象 — token 失控 + 测试地狱

#### 亮点 2 · Specialist 切分按"能力域"是甜点

`§4.3 + §7.6`(ARCHITECTURE:839-2206)从 23 个潜在 URL 节点合并到 14 个能力域 Specialist · 比 11/02 八 Agent(细)粗一档,比 Paperclip 4 角色(粗)细一档。

* 🟢 **共享性强**:`step7 + /generate + /boom-generate + /acquisition-video` **共享 CopywritingAgent**(只是 mode 分支)— 4 个入口共维护 1 个 prompt
* 🟢 **省维护**:23 prompt → 14 prompt(节省 39%)
* 🟢 **跟 11/02 借接口、不借粒度**:BaseAgent / AgentResult / 五层配置 / trace_id **直接搬**(§7.2-C),但 Pipeline 不搬

#### 亮点 3 · ContextAssembler 是隐形枢纽(Context 投影模式落地)

`§4.6 + §6.4`(ARCHITECTURE:1006-1755)把"prompt 注入"统一收口到 `ContextAssembler` · 每次 Specialist 调用前并行拉 6 路上下文(stepData / EvolutionProfile / DeepLearn / 常量 / RAG / L1 Buffer)。

* 🟢 **直接对应** `reference-materials/PI-Agent设计哲学/13-Harness工程深度与5大模式.md` §模式 1 Context 投影
* 🟢 **避免散点维护** · 所有 Specialist 不直接读各处数据 · 统一进出口
* 🟢 **冷启动降级清晰**(ARCHITECTURE:941-963 · 6 个冷启动场景全集 · v0.2 新增) — 这是 v0.2 review 主动补的高质量内容

#### 亮点 4 · 五层记忆 + 反馈飞轮闭环(理论高度)

`§5`(ARCHITECTURE:1163+)把 11/04 五层记忆改造为 **Buffer / Core / Recall / Profile / Trending**(用 Trending 替换原版 Summarizer/Portrait · 更适配本场景)· 飞轮 5 阶段 SQL 链路在 DATA-MODEL §6.5 完整实测。

* 🟢 **进化档案是「账号级」而非「用户级」**(ADR-009 / DATA-MODEL §6.3) — 这是**罕见的细颗粒度判断**(同一用户的企业号 vs 个人号有不同进化方向)
* 🟢 **Issue Flywheel 范式**(reference/AI-Agent的两种记忆范式)落地为 EvolutionAgent + EvolutionInsight + EvolutionProfile 三表
* 🟢 **5 级阈值定义清楚**(L1=0-4 / L2=5-19 / L3=20-49 / L4=50-99 / L5=100+)· 不是"看起来有"

#### 亮点 5 · 多账号隔离的 3 道闸(安全边界铁律)

`§3.8 + DATA-MODEL §9`(ARCHITECTURE:674-700 + DATA-MODEL:2150+)定义了**ORM + Postgres RLS + 命名空间**三道闸,是知识库 11/02 案例的 ★ 同款做法。

* 🟢 **RLS 不是嘴上说**:DATA-MODEL §9.2 给了完整 SQL policy · §9.6 给了集成测试用例(L2253+) · §9.7 谈了性能影响(可能加 5-10% 开销)
* 🟢 **admin role 走单独 policy**(DATA-MODEL §9.3 · L2181-2206) — 这是 admin 跨账号查的标准做法 · 但 ARCHITECTURE.md 主文件没把这个能力 surface 到 §2.5b(详见 §3 + §5)

#### 亮点 6 · LLMGateway 是真"治理"层 · 不是简单包装

`§6.5`(ARCHITECTURE:1758-1793)定义的 LLMGateway 包含 **限流 / 熔断 / 降级 / 计费 / 审计** 5 个能力,严格继承 11/05 工具系统与 LLM 网关。

* 🟢 **应用代码不直接选模型**(`model_tier: 'reasoning' | 'lightweight'`) — 解耦正确
* 🟢 **降级策略可观测**(`fallback?: { from, to, reason }`) — 不是黑盒
* 🟢 **计费写 cost_log**(DATA-MODEL §G · L1808+) — 这恰恰是**管理后台必需要看的数据**(详见 §3.3)

#### 亮点 7 · 文档同心圆完整 · Coding 3.0 协同已就绪

`§9.12` + AGENTS / ADR / DATA-MODEL / PROMPTS / SCAFFOLD 5 件套 · 直接对应 Coding 3.0 流程的 `/prime + /create-rules + prd + ralph + Opus audit` 步骤。

* 🟢 **AGENTS.md 是 ARCHITECTURE 派生**(AGENTS:2-7 显式声明)— 不是各写各的
* 🟢 **ADR.md 是 LD 展开**(ADR:5-7) — 决策可追溯
* 🟢 **审计闭环就位**:`scripts/audit-redlines.sh`(SCAFFOLD:23 · 已存在文件实测)+ AGENTS §8 audit_commands

#### 亮点 8 · v0.2 自审已修 16 处(质量已经过一轮过滤)

ARCHITECTURE:3003-3022 列出 v0.2 修复的 16 处:**2 P0 事实硬伤 + 5 P1 重要遗漏 + 9 P2 润色** · 包括:
* 路由组数 13 → 13+2=15(加 trending + invite)
* 实体数 12 → 15(其中 12 按 account_id 隔离)
* 加了 6 个冷启动场景全集 + 测试金字塔 + trending 抓取 3 合规方案 + 成本量级估算

> 🟢 **这种自审能力本身**就是文档质量的护栏 — 跟 knowledge-base v1→v6 的演化模式是同构的(参 [`knowledge-base/log.md`](../Ai_Agent/knowledge-base/log.md) v6 元洞察)。

### 2.2 总体质量基线(踩在什么 baseline 上)

| 对照项 | ARCHITECTURE.md v0.2 | knowledge-base 同类标杆 | 差距 |
|---|:-:|:-:|:-:|
| 章节数 | 9 | 11/02 八 Agent 8 章 / 02 多 Agent 协作 12 章 | 接近标杆 |
| 篇幅 | 181KB | 01 Agent 编排 119KB / 02 多 Agent 64KB | 略大 · 因为含业务上下文 |
| ADR 引用 | 11+ 处 | 11/01 项目总览 ~5 处 | 高于标杆 |
| 端到端时序图 | 5 条(§6.7) | 04 端到端链路 8 条 | 近似 |
| 测试金字塔 | 4 层 + LLM Judge(§9.11-E) | reference/Agent 测试 4 层 | 完全对齐 |
| 风险/护栏章节 | 5 类(§9.11) | 07 风险边界 10 类 | **少 5 类**(本架构合理 · 因为是项目级而非通用) |
| 成本估算 | 单/100/1k/10k 用户 4 档(§9.12b) | 08 成本估算 3 档 | 完全对齐 |

**结论**:**ARCHITECTURE.md 的"业务侧"质量已经在 knowledge-base ✅ 级文档的水平**。

### 2.3 看起来好但藏隐患的 3 处(过渡到 §3)

#### 隐患 1 · "前后端分离"概念是隐式的,没有显式声明

`§1.4 9 层架构图`(ARCHITECTURE:98-137)+ `§9.2 P0 部署`(ARCHITECTURE:2596-2602)隐含了前后端分离(L1 Vite + L3 Hono+tRPC),但**没有任何一句话明确**:
* 前端是单独部署?和后端同一个进程?
* 多个 SPA 还是单个 SPA?(主应用 SPA + admin SPA 是分离还是合并?)
* `Vercel + Railway` 是怎么协同的?是否一致 .env 跨环境?

> 🟡 **这就是为什么 §0 的硬约束#1 评 70% 而不是 100%** — 实现侧已经分了,但**"边界声明"在文档里是缺位的**。

#### 隐患 2 · `/admin/*` 路由跟主应用混在同一个 SPA bundle

AGENTS:717 写明 `src/pages/admin/{InviteManage}.tsx` — 跟 `src/pages/Home.tsx`、`src/pages/steps/*`、`src/pages/tools/*` **同 layout 同 bundle 同 router**。

`§2.5b 实施时机`(ARCHITECTURE:372)甚至明确:**"具体页面延到 P8 之后(MVP 不需要)"** — 这等于说"管理后台不是 MVP 的一部分"。

> 🔴 **这跟硬约束#2"独立的管理后台"是结构性冲突** — 如果用户的需求是"管理后台是独立产品 / 给运营 / 有自己的产品迭代节奏",那"嵌入主应用 + 延到 P8 后"是不可接受的。

#### 隐患 3 · 13 个业务管理域全部失踪(详见 §3.3)

ARCHITECTURE.md / AGENTS.md 提了大量"管理后台理应能看到"的数据(成本仪表盘 / 反馈监控 / 进化档案审计 / TrendingItem 内容审核 / DeepLearningArchive 审核 / 跨账号 audit_log 反查 / 配额管理 / Approval Gates / ...)· 但 **§2.5b 只列了 3 个**(invite-manage 必 · users 可选 · models 可选)· **缺 10+ 业务管理域**。

> 🔴 **这是从硬约束#3"管理后台 web 页面"派生的最大缺口** — 详见 §3.3 + §5.2。

### 2.4 整体架构判断小结

本节答 3 件事:
1. **主应用架构(亮点 1-8)是 ✅ 级**,质量基线踩在 knowledge-base 同类标杆之上
2. **ARCHITECTURE.md v0.2 已经过一轮 self-review**(16 处修复) — 这本身是质量护栏
3. **3 处隐患都集中在"管理后台 + 部署边界"** — 不是局部 bug,是哲学性缺位 — 用 §3 + §5 系统性补

下一节(§3)进入本 review 的核心 · 三条硬约束逐一打分 + 取证。

---

## §3 三条硬约束覆盖度评估 ★ 本 Review 核心

> 本节是 Review 报告的"产权核心"。每条硬约束都按"**理想形态 → 当前文档证据 → 差距分析 → 影响范围**"四段式逐一评估,带 file:line 取证。
>
> **评分原则** · 不汇总总分,按维度看(参 §0 注脚)· 每条硬约束独立打分。

### §3.1 硬约束 ① · 前后端分离 — 评级 🟡 70%(技术分离 ✓ · 边界声明 ✗)

#### 3.1.1 理想形态(我对"前后端分离"硬约束的理解)

```
理想形态包含 4 个维度:
  ① 进程分离 · 前端 SPA 进程 / 后端 API 进程独立运行
  ② 部署分离 · 前端可以单独部署到 CDN / 静态托管 · 后端独立伸缩
  ③ 仓库 / Workspace 分离 · 至少 monorepo 内有清晰的 apps/web + apps/api 边界
  ④ 类型契约分离但共享 · 前后端通过 zod schema / OpenAPI / tRPC 类型同步
                                  ↓
  最终能做到 ·
    · 前端可以换实现(从 React 改 Vue 不影响后端)
    · 后端可以加端(给 mobile / admin / open API 多个客户端共用)
    · 各自独立 CI/CD + 独立故障隔离
```

#### 3.1.2 当前文档证据(评估)

| 维度 | 证据 | 达成度 |
|---|---|:-:|
| ① 进程分离 | README:38-46 给了 `pnpm dev`(前端 5173)+ `pnpm server`(后端 3000)分别启动命令 | ✅ 已分 |
| ② 部署分离 | AGENTS:172-181 写明 Vercel(前端)+ Railway/Fly.io(后端)分别托管 | ✅ 已分 |
| ③ 仓库/Workspace 分离 | SCAFFOLD:32 提了 `pnpm-workspace.yaml(可选)` · 但**实际 src/ 下前端 + 后端混在一个包内**(src/pages + src/server 同根)| 🟡 部分 |
| ④ 类型契约共享 | AGENTS:127 + ARCHITECTURE §6.1-6.5 明确 zod 是"全栈唯一真理来源" + tRPC 端到端类型 | ✅ 完全 |

**关键缺位** · **没有任何一句话**在 ARCHITECTURE.md / AGENTS.md / ADR.md 里明确写"前后端是两个独立部署单元 + 仓库结构是 monorepo workspace"。

* 🟢 实测:`grep -E "前后端分离|前后端拆|monorepo workspace|apps/web|apps/api"` 在全部 5 文档里命中 = 0
* 🟡 隐式信号:tRPC + Vite + Hono 的组合 + `pnpm dev / pnpm server` 双命令暗示了分离意图
* 🔴 没说清的:多 SPA 形态(主应用 SPA + admin SPA)?统一一个 SPA 通过 role gate?这是硬约束#2 决定的连带问题

#### 3.1.3 差距分析

| 差距 | 严重度 | 修复成本 | 影响 |
|---|:-:|:-:|---|
| ARCHITECTURE.md 没有 §1.X 显式声明部署边界 | 🟡 P1 | 低(写 1 节) | 团队认知不一致 · 后续争论 |
| SCAFFOLD.md 没有 monorepo workspace 树 | 🟡 P1 | 低 | 影响 Ralph 执行时的代码组织 |
| `package.json` `pnpm-workspace.yaml` 是 (可选) | 🟡 P2 | 中(改包结构)| 现在还能 last-call,P0 启动后再改成本翻倍 |
| 没有显式的"前端 build 产物 → 静态部署 / 后端 API → 容器部署"分发图 | 🟡 P2 | 低 | DEPLOY.md 后续补 |

#### 3.1.4 修复路径(P1)

```
方案 A · 最小补丁(推荐 · 1 天)
  ① ARCHITECTURE.md 加 §1.4b "前后端分离边界声明"
     · 显式写"两套独立部署单元"
     · 显式画前端 → CDN / 后端 → 容器 / 共享 zod 包 三方关系
  ② SCAFFOLD.md 加 "Workspace 推荐结构"
     · apps/web(主应用 SPA)
     · apps/admin(独立管理后台 SPA · 见硬约束#2)
     · apps/api(后端 + tRPC + agents + workers)
     · packages/schemas(zod 真理 · web + admin + api 共享)
     · packages/ui(shadcn 组件 · web + admin 共享)
     · packages/clients(tRPC client config · 含 admin client)
  ③ ADR.md 加 ADR-019 "前后端分离 + monorepo workspace 结构"
```

> 🟢 修复后从 70% → 100% · 也是 §3.2(独立管理后台)的工程基础

---

### §3.2 硬约束 ② · 独立的管理后台 — 评级 🔴 15%(❗严重缺位)

#### 3.2.1 理想形态(我对"独立管理后台"硬约束的理解)

```
"独立的管理后台" 至少包含 5 个维度:
  ① 部署独立 · 独立子域名(admin.quanan.com)/ 独立 build / 独立 CI
  ② 进程独立 · 独立的 tRPC 客户端 / 独立的 SPA bundle / 独立路由
  ③ 命名空间独立 · 后端 tRPC 有独立的 admin router 树(adminRouter)
  ④ 鉴权独立 · admin 走单独 session / 单独 OAuth 应用 / 单独审计链路
  ⑤ 演进独立 · 可独立迭代 / 独立发布 / 独立故障域 / 独立测试套件
                                  ↓
  最终能做到 ·
    · 主应用挂了不影响 admin · admin 挂了不影响主应用
    · 运营不需要装客户端 / 改 host · 直接 admin.quanan.com 登录即用
    · admin 上线不需要主应用一起发版
    · 给 admin 加新页面不会影响主应用 bundle 大小
```

#### 3.2.2 当前文档证据(评估)

| 维度 | 证据 | 达成度 |
|---|---|:-:|
| ① 部署独立 | **0 处提及** · 默认是主应用同一部署 | ❌ 0% |
| ② 进程独立 | AGENTS:717 写 `src/pages/admin/{InviteManage}.tsx` — 跟主应用同一个 SPA | ❌ 0% |
| ③ 命名空间独立 | DATA-MODEL:2195 写 `adminMiddleware` — 散落在普通 router 里走 middleware 拦截 · 不是独立 router 树 | 🔴 10% |
| ④ 鉴权独立 | DATA-MODEL:180 写 `role: 'user' \| 'admin'` — 跟普通用户共用 OAuth + Session · 只是 role 字段区分 | 🟡 30% |
| ⑤ 演进独立 | ARCHITECTURE:372 写 "具体页面延到 P8 之后(MVP 不需要)" — admin 功能跟主应用版本绑死 | ❌ 0% |

**最关键的证据**(ARCHITECTURE:362-376 完整 §2.5b 全文 15 行):

```markdown
### §2.5b 第四组 · 管理后台(/admin/invite-manage)★ 补充

> spec.md §3.1 + §ⅩⅦ 实测注册了 admin 路由 · 主要为邀请码管理。本架构需要支持但不在主流程。

| 模块 | URL | 角色 | 功能 |
|---|---|---|---|
| **邀请码管理** | `/admin/invite-manage` | role='admin' 限制 | 创建邀请码 · ... |
| **(可选)用户管理** | `/admin/users` | role='admin' | 列用户 · 改套餐 · 封禁 |
| **(可选)模型仪表盘** | `/admin/models` | role='admin' | LLM 调用量 · 成本 · 限流状态 |

**实施时机**:可在 P0 - P1 接入认证时**预留 role 判断**,具体页面延到 P8 之后(MVP 不需要)。
**安全要求**:
- tRPC middleware 检查 `ctx.user.role === 'admin'`
- 前端路由 wrapper 检查 + 返回 403
- 审计日志:所有 admin 操作必写 audit_log
```

🔴 **这就是 ARCHITECTURE.md 关于"管理后台"的全部内容** —— 15 行 / 占 3022 行的 0.5% / 1 必做 + 2 可选。

#### 3.2.3 差距根因分析

为什么会出现这种"管理后台被严重低估"?**三个根因**:

**根因 1 · 复刻原版的简陋 admin 设计**

aiipznt-spec.md L4065-4080 实测原版 admin:
```
## 16.3 管理员后台 `/invite-manage`
仅 `role: 'admin'` 用户可访问,普通用户看到:仅管理员可管理邀请码

推测后台功能:           ← 注意"推测",原版自己也没抓到
- 创建邀请码
- 查看激活历史
- 批量发码

复刻方:建议建 `/admin/*` 子路由 + middleware 校验 role  ← 原版给的复刻建议是嵌入式
```

🟢 **原版 aiipznt 自己的 admin 就是简陋的**(只有 1 个邀请码管理)+ aiipznt 自己也只是"推测后台功能"(没有真实抓到 admin 内部 UI)+ 给的"复刻建议"是 middleware-only 嵌入式方案。

🔴 **QuanAn ARCHITECTURE 直接照搬这个"嵌入式 + 简陋"的设计** — 但这正是用户要求"独立管理后台"的反向(用户不想复刻原版的弱点)。

**根因 2 · 业务管理需求被埋在配套文档里 · 没浮到 ARCHITECTURE 主层面**

DATA-MODEL.md / AGENTS.md 实测有 **20+ 处 admin 相关业务能力**(详见 §3.3 完整列表),但 ARCHITECTURE.md §2.5b 只 surface 了 3 个。结果是:数据层有 / 主架构没看到 / 落地时容易遗漏。

**根因 3 · "MVP 不做"的决策错过了架构窗口**

`§2.5b 实施时机`明确说"延到 P8 之后(MVP 不需要)" + `§9.10 P8`(ARCHITECTURE:2680-2688)P8 章节描述里**完全没提 admin** · 实质上是**整个 9 阶段路线图都没安排管理后台的实施**。

🔴 **如果按原架构走,管理后台永远不会被独立设计** — 它会以"P0 加个 role middleware → P8 后再说"的状态拖到上线后,然后被仓促添加。

#### 3.2.4 影响范围

| 影响层 | 具体影响 |
|---|---|
| **运营层** | 没有专属后台 · 运营要登主应用 + 切角色 · 体验差 |
| **业务层** | 13+ 业务管理域(§3.3)无法实施 · 内容审核 / 成本监控 / 反馈分析 都缺位 |
| **技术层** | admin bundle 跟主应用一起膨胀 · admin 上线必须主应用发版 |
| **安全层** | admin 跟用户共用 OAuth · 没有 IP 白名单 / MFA / 独立审计的标准做法 |
| **演进层** | admin 加功能 = 改主仓库 · 无法独立迭代 |
| **合规层** | 跨账号 query / cross-account audit log 没有专属 UI · 法务审计困难 |

#### 3.2.5 修复路径(P0)

```
方案 · 新建 ADMIN-ARCHITECTURE.md(推荐 · 详见 §5.1)
  把"管理后台"升级为 first-class 子系统:
  ① 新建独立 SPA · apps/admin(monorepo workspace)
  ② 独立子域名 · admin.quanan.com
  ③ 独立 tRPC 命名空间 · adminRouter(跟用户 router 树并列)
  ④ 独立鉴权 · admin OAuth 应用 / 独立 session / IP 白名单 / 可选 MFA
  ⑤ 独立路由集 · 13+ 业务管理域(§3.3 + §5.2)
  ⑥ 独立 P9 阶段 · 在 P0 之后开 P9-admin · 不依赖主应用 P8
```

> 🟢 修复后从 15% → 90% · 详细方案见 §5.1

---

### §3.3 硬约束 ③ · 管理后台 web 页面 — 评级 🔴 5%(❗严重缺位)

#### 3.3.1 理想形态(我对"管理后台 web 页面"硬约束的理解)

```
"管理后台 web 页面" 不是"加几个 admin 路由"那么轻 · 是:
  ① 完整的 admin 应用骨架 · layout / sidebar / topbar / breadcrumb
  ② 全局仪表盘 · NSM 指标 + 子指标 + 漏斗 + 实时活跃
  ③ 业务管理域全覆盖 · 用户 / 账号 / 内容 / 反馈 / 进化 / 成本 / 合规 / 配额 / 审计 / 邀请 / Prompt / 知识库 / Trending(13+)
  ④ 数据可视化 · 折线图 / 漏斗图 / 热力图 / 桑基图 / 表格筛选导出
  ⑤ 运维操作 · 用户封禁 / 配额调整 / 内容审核(批准/驳回/打回)/ 强制升级 / 审计 trace 反查
  ⑥ 协作能力 · 操作日志 / 备注 / 多 admin 协同
                                  ↓
  最终能做到 ·
    · 运营每天打开 admin 就能掌握 NSM
    · 出问题时 admin 能 2 步内 trace 到 prompt + 上下文
    · 审计 / 法务 / 财务能从 admin 各自取数 · 不需要 SQL 直连
```

#### 3.3.2 当前文档证据(实测全网清点)

🟢 **全仓库 admin 相关 web 页面文件清单**(实测 grep):

```
src/pages/admin/{InviteManage}.tsx     ← 唯一 1 个 admin 页面骨架(AGENTS:717)
```

**就这 1 个**。没有 layout / 没有 sidebar / 没有 dashboard / 没有其他业务管理域页面。

#### 3.3.3 13+ 业务管理域:实测应该有但没设计的清单

> 这是本 review 最大的发现:**ARCHITECTURE / AGENTS / DATA-MODEL 实测有大量"理应进 admin"的数据,但管理后台 UI 完全没规划**。
> 下面是从 6 文档里 grep + 推导出的 13+ 业务管理域,每个都列**数据来源(已有)**+ **应有的 admin 页面**(缺位):

| # | 业务管理域 | 数据来源(已有) | 应有的 admin 页面(缺位)| 严重度 |
|:-:|---|---|---|:-:|
| 1 | **邀请码管理** | InviteCode 表(DATA-MODEL §2.2)| ✅ 已规划 `/admin/invite-manage` | ✅ 已有 |
| 2 | **用户管理** | User 表(DATA-MODEL §2.1) | ⚠️ "(可选)" 未承诺 — 改套餐 / 封禁 / 重置密码 / 跨账号查 | 🔴 P0 |
| 3 | **IP 账号管理** | IpAccount 表(DATA-MODEL §3.1)+ `[industry]` `[platform]` admin 索引(DATA-MODEL:420-421)| ❌ 完全缺 — 跨账号检索 / 行业分布 / 平台分布 / 异常账号识别 | 🔴 P0 |
| 4 | **成本仪表盘** | cost_log 表(DATA-MODEL §G L1808+)+ 全套索引(DATA-MODEL:2351)| ❌ 完全缺 — 月度账单 / 单用户成本 / Specialist 成本 / 模型用量趋势 | 🔴 P0 |
| 5 | **审计日志查询** | audit_log 表(DATA-MODEL §G)+ trace_id 全栈贯穿(ARCHITECTURE:1929)| ❌ 完全缺 — trace 反查 / 用户操作时间线 / cross_account_query 法务取证 | 🔴 P0 |
| 6 | **反馈数据看板** | FeedbackLog 表(DATA-MODEL §6.2)+ AGENTS §1.2 NSM 子指标(反馈率)| ❌ 完全缺 — 系统级 👍/👎 分布 / Specialist 评分 / 差评归因 | 🔴 P0 |
| 7 | **进化档案监控** | EvolutionProfile + EvolutionInsight(DATA-MODEL §6.3-6.4)+ `[level]` admin 索引(DATA-MODEL:1439) | ❌ 完全缺 — L5 用户分布 / 进化健康度 / 飞轮停滞告警 | 🟠 P1 |
| 8 | **TrendingItem 内容审核** | TrendingItem 表(DATA-MODEL §2.3)+ AGENTS §1.4 限制 / ADR-017 trending 合规 | ❌ 完全缺 — 入库前审核 / 违规内容标记 / 来源平台监控 | 🔴 P0(法律) |
| 9 | **DeepLearningArchive 审核** | DeepLearningArchive 表(DATA-MODEL §7.1)+ AGENTS 合规 | ❌ 完全缺 — 用户上传样本审核 / PII 二次扫描 / 违规内容下架 | 🔴 P0(合规) |
| 10 | **Specialist Prompt 版本管理** | PROMPTS.md 14 模板 + AGENTS §7 测试金字塔 | ❌ 完全缺 — Prompt 版本 / 灰度发布 / A/B 评分 / 回滚 | 🟠 P1 |
| 11 | **配额 / 限流管理** | LLMGateway 限流(ARCHITECTURE:1787)+ AGENTS §1.4 配额 + Free/Pro/Enterprise(ARCHITECTURE:2717)| ❌ 完全缺 — 用户配额 / 实时使用 / 异常告警 / 手动调整 | 🟠 P1 |
| 12 | **知识库 / 静态常量管理** | 9 类常量 + 67 案例 / 23 公式 / 22 元素(ARCHITECTURE §3.6)| ❌ 完全缺 — 案例 CRUD / 入向量库 / 行业更新 | 🟡 P2 |
| 13 | **行业合规检查仪表盘** | AGENTS §1.4 + 9.11-D 医疗/法律/金融免责 + PII 脱敏 | ❌ 完全缺 — 触发免责次数 / 命中违禁词 / PII 命中率 | 🟠 P1 |
| 14 | **Approval Gates / HITL** | knowledge-base ADR-016 + AGENTS § 红线 | ❌ 完全缺 — 等待人工审批 / 操作授权 / 高风险操作两步审批 | 🟠 P1 |
| 15 | **A/B 测试管理** | ARCHITECTURE §2.5 暗示 / 05-vertical/05 启发 | ❌ 完全缺 — 灰度发布 / 漏斗对比 / 显著性检验 | 🟡 P2 |
| 16 | **运营 NSM 仪表盘** | AGENTS §1.2 4 个 NSM + 北极星 | ❌ 完全缺 — 7 天活跃 / 9 步完成率 / D30 留存 / 进化升级率 | 🔴 P0(运营核心) |

> 🔴 **3 个 P0(法律 / 合规 / 运营)**:不做的话产品上线就有事故风险
> 🟠 **5 个 P1**:不做会让产品迭代和健康度判断失明
> 🟡 **2 个 P2**:可以排到后续版本

#### 3.3.4 影响范围(每个管理域缺位的具体后果)

| 缺位的页面 | 缺了会发生什么(实战场景) |
|---|---|
| 成本仪表盘 | 月底发现 LLM 账单超预算 5x · 没有任何工具能快速定位是哪个 Specialist 出问题 |
| 审计日志查询 | 用户投诉"AI 给我胡说八道" · 没法 2 步反查到 trace_id → prompt → 上下文 |
| TrendingItem 审核 | 抓回的爆款里有违规内容直接进了 RAG · 用户搜索时被推荐 · 法律风险 |
| DeepLearning 审核 | 用户上传了 PII / 违法内容到自己样本库 · 注入 prompt 污染输出 · 合规事故 |
| 进化档案监控 | L5 用户的进化档案被污染(冲突反馈)· 发现时已经污染数千账号 |
| 运营 NSM 仪表盘 | 不知道产品到底有没有人用 · 不知道 9 步完成率是 5% 还是 30% · 决策瞎拍 |

#### 3.3.5 修复路径(P0)

```
方案 · 在 ADMIN-ARCHITECTURE.md 完整规划 13+ 业务管理域(详见 §5.2)
  按"P0 法律/合规/运营 → P1 健康度判断 → P2 高级功能"分批落地
  每个管理域给:
    · 数据来源(已有 SQL)
    · 关键 KPI / 视图
    · 核心交互(查询 / 导出 / 操作)
    · 鉴权策略(super_admin / admin / readonly_admin)
    · UI 草图(列表 / 详情 / 仪表盘)
```

---

### §3.4 三条硬约束评估小结

| 硬约束 | 评级 | 修复成本 | 修复后评级 |
|---|:-:|:-:|:-:|
| ① 前后端分离 | 🟡 70% | 1 天(写 §1.4b + ADR-019)| ✅ 100% |
| ② 独立管理后台 | 🔴 15% | 5-7 天(写 ADMIN-ARCHITECTURE.md + 调 SCAFFOLD)| 🟢 90% |
| ③ 管理后台 web 页面 | 🔴 5% | 跟随②(规划阶段)+ 后续每个域 1-3 天实现 | 🟢 80% |

> **核心结论** · 三条硬约束**不是平行问题**,是层层递进:① 是基础(部署边界) · ② 是结构(独立子系统) · ③ 是内容(13+ 业务管理域)。**一份 `ADMIN-ARCHITECTURE.md` + ADR-019 一次性解决全部三条**。

下一节(§4)进入多维度问题清单 · 把 §2 + §3 发现的全部问题按 P0/P1/P2 分级列清单。

---

## §4 多维度问题清单(P0 / P1 / P2)

> 本节把 §2 + §3 的发现展开成一份**可执行问题清单** · 每条带:
> · 证据(file:line)
> · 影响(为什么是这个优先级)
> · 修复动作(具体改什么)
> · 修复参考(对应知识库 ADR / 章节)

### §4.1 P0 必修(8 项 · 涉及硬约束 / 法律 / 合规 / 运营核心)

#### P0-1 · 管理后台被当"嵌入页面"而非独立子系统(根因)

| 项 | 内容 |
|---|---|
| **证据** | ARCHITECTURE.md:362-376(§2.5b 全文 15 行)+ AGENTS:717(`src/pages/admin/{InviteManage}.tsx`)+ DATA-MODEL:2195(`adminMiddleware`)|
| **影响** | 直接违反硬约束#2 + #3 · 后续 13+ 业务管理域无法独立演进 · admin bundle 跟主应用绑死 · 安全边界模糊 |
| **修复动作** | **新建 `ADMIN-ARCHITECTURE.md`** 把管理后台升级为 first-class 子系统 · 详细方案见 §5.1 |
| **修复参考** | knowledge-base/02-multi-agent-collaboration §Centralized 多 agent · knowledge-base/04-system-architecture/三大核心架构关系说明 §子系统拆分 |

#### P0-2 · 13+ 业务管理域全部缺位(派生)

| 项 | 内容 |
|---|---|
| **证据** | §3.3.3 完整清单:用户管理 / IP 账号管理 / 成本仪表盘 / 审计日志查询 / 反馈数据看板 / TrendingItem 审核 / DeepLearning 审核 / 运营 NSM 仪表盘 等 16 项 |
| **影响** | 法律 / 合规 / 运营三大风险一起爆 · 详见 §3.3.4 影响场景 |
| **修复动作** | 在 ADMIN-ARCHITECTURE.md 给每个管理域规划:数据来源 + KPI + 关键交互 + 鉴权策略 + UI 骨架 · 详见 §5.2 |
| **修复参考** | knowledge-base/reference-materials/Agent运营数据分析框架 · knowledge-base/05-vertical-solutions/05-intelligent-marketing-agent §KPI 仪表盘 |

#### P0-3 · 前后端分离的"边界声明"在文档里完全缺位

| 项 | 内容 |
|---|---|
| **证据** | grep `前后端分离\|monorepo workspace\|apps/web\|apps/api` 在 6 文档里命中 0 处 |
| **影响** | 团队认知不一致 · Ralph 执行 P0 时可能把 web + api + admin 全放在一个包里 · 后续重构成本翻倍 |
| **修复动作** | ARCHITECTURE.md 加 §1.4b "前后端分离边界声明"+ SCAFFOLD.md 加 monorepo workspace 树 + ADR.md 加 ADR-019 |
| **修复参考** | knowledge-base/05-module-design/模块职责与边界定义 §模块切分 · knowledge-base/09-deployment §Docker Compose / K8s 拆分 |

#### P0-4 · trending 抓取的合规方案在 ARCHITECTURE 已列但 admin 内容审核完全缺位

| 项 | 内容 |
|---|---|
| **证据** | ARCHITECTURE §9.13b 已列 3 个合规方案(官方 API / 第三方授权 / 自建爬虫) · 但**没有任何"入库前审核"或"违规内容下架"的 admin 流程**。一旦走 B 第三方授权,数据进 RAG 后无人复核,违规内容会直接被 Specialist 引用 |
| **影响** | 法律风险 · 平台诉讼 / 内容投诉 / 商业声誉 |
| **修复动作** | ADMIN-ARCHITECTURE 加 "TrendingItem 内容审核域":入库前队列 / 违规标记 / 来源平台监控 / 自动下架规则 + 触发 admin 强制人工复审 |
| **修复参考** | knowledge-base/reference-materials/Agent安全架构与合规指南 §内容审核 + Approval Gates · ADR-017 trending 抓取合规 |

#### P0-5 · DeepLearningArchive 用户上传内容审核完全缺位

| 项 | 内容 |
|---|---|
| **证据** | DATA-MODEL §7.1 + ARCHITECTURE §4.5 FileParserWorker · 用户可上传 PDF/Word/CSV/MD/TXT(≤20MB) · 这些内容会被 DeepLearnAgent 解析 + 写 vector store + 注入 CopywritingAgent prompt · **全程无人工审核步骤** |
| **影响** | 合规事故 · 用户上传 PII / 暴恐 / 违法内容 → 注入 prompt → AI 输出包含违规内容 → 合规事故 + 平台下架 |
| **修复动作** | ADMIN-ARCHITECTURE 加 "DeepLearning 审核域":上传后排队 → 自动 PII 扫描 + 违禁词扫描 + 抽样人工审核 → 通过才入向量库 |
| **修复参考** | AGENTS §1.4 不做事项 · ARCHITECTURE §9.11-A 输入护栏 · knowledge-base/reference-materials/Agent安全架构与合规指南 §PII 处理 |

#### P0-6 · 运营 NSM 仪表盘缺位 · 产品健康度无法监控

| 项 | 内容 |
|---|---|
| **证据** | AGENTS §1.2 定义了 4 个 NSM 子指标(完成 9 步比例 > 30% / 反馈率 > 40% / 进化升级率 > 60% / D30 留存 > 25%) · 但**没有任何 admin 页面消费这些指标** |
| **影响** | 产品上线后无人能告诉团队"用户在用吗、用得好吗" · 决策瞎拍 |
| **修复动作** | ADMIN-ARCHITECTURE 加 "运营 NSM 仪表盘域":4 个 NSM 子指标 + 漏斗(注册 → step1 → step3 → step7 → 反馈)+ 分日 / 分周 / 分月 + 分用户画像(4 类用户)分布 |
| **修复参考** | AGENTS §1.2 + knowledge-base/reference-materials/Agent运营数据分析框架 |

#### P0-7 · 成本仪表盘缺位 · LLM 账单失控风险

| 项 | 内容 |
|---|---|
| **证据** | DATA-MODEL §G cost_log 表已设计完整(双冗余 userId/accountId · 6 个 admin 索引 · DATA-MODEL:2351) · ARCHITECTURE §9.12b 估算"单用户月均 $13.5" · 但**没有任何页面让 admin 看实时成本** |
| **影响** | 上线后某个用户跑爆配额 / 某个 Specialist prompt 失控 / 某个模型涨价 — 月底才在账单看到 · 损失千美元到万美元级 |
| **修复动作** | ADMIN-ARCHITECTURE 加 "成本仪表盘域":月度账单 / Top 10 用户成本 / Specialist 分项 / 模型分项 / 实时告警(单用户日 > $5 触发) |
| **修复参考** | DATA-MODEL §G + knowledge-base/08-tech-decisions/基础设施成本估算 |

#### P0-8 · admin 鉴权和安全边界仍是"role middleware 单层"

| 项 | 内容 |
|---|---|
| **证据** | ARCHITECTURE:373-376 安全要求只列 3 条(role middleware + 前端 wrapper + audit_log) · 没有 IP 白名单 / 二次验证(MFA)/ 独立审计链路 / 操作前确认 / 高风险操作两人审批 / 异常登录告警 |
| **影响** | admin 账号被盗 → 跨账号查全量用户数据 → 数据泄露事故 |
| **修复动作** | ADMIN-ARCHITECTURE 加 "admin 安全设计章":独立 OAuth + IP 白名单 + 强制 MFA + Approval Gates(高风险操作)+ 异常登录告警(钉钉/Slack)|
| **修复参考** | knowledge-base/08-tech-decisions/架构决策记录 ADR-016 Approval Gates · knowledge-base/reference-materials/Agent安全架构与合规指南 §鉴权 |

---

### §4.2 P1 应修(7 项 · 影响产品健康度 / 演进能力)

#### P1-1 · 进化档案监控缺位

| 项 | 内容 |
|---|---|
| **证据** | EvolutionProfile + EvolutionInsight + `[level]` admin 索引(DATA-MODEL:1439)已就位 · 但 admin 看不到 |
| **影响** | L5 大用户进化档案被冲突反馈污染 → 发现时已数千账号被影响 |
| **修复动作** | ADMIN-ARCHITECTURE 加 "进化档案监控域":L1-L5 用户分布 / 飞轮停滞告警(7 天无新 insight)/ 异常档案标记(insights 矛盾)|
| **修复参考** | DATA-MODEL §6.3-6.4 · knowledge-base/reference-materials/AI-Agent的两种记忆范式 |

#### P1-2 · Specialist Prompt 版本管理缺位

| 项 | 内容 |
|---|---|
| **证据** | PROMPTS.md 14 模板 · ARCHITECTURE §9.11-E.4 LLM-as-Judge 持续运行 · 但**没有 admin 改 prompt → 灰度 → 评分 → 回滚的工作流** |
| **影响** | 改 prompt 必须改代码 + 发版 · 节奏慢 + 误改风险 + 无法 A/B |
| **修复动作** | ADMIN-ARCHITECTURE 加 "Prompt 版本管理域":Prompt 版本表 + 灰度策略 + 自动跑 LLM Judge + 一键回滚 |
| **修复参考** | knowledge-base/reference-materials/LLMOps与团队协作指南 §Prompt 版本管理 |

#### P1-3 · 配额 / 限流的运行时调整缺位

| 项 | 内容 |
|---|---|
| **证据** | ARCHITECTURE §9.11-C 写了 Free 50 / Pro 500 / Enterprise 5000 · LLMGateway:1787 限流就位 · 但 admin **没有运行时调整能力**(用户出问题手动放配额 / 异常用户压配额) |
| **影响** | 客服处理用户投诉时无法手动放配额 · 被异常用户跑爆时无法实时压配额 |
| **修复动作** | ADMIN-ARCHITECTURE 加 "配额管理域":用户配额表 / 实时使用 / 异常告警 / 手动调整 / 临时白名单 |
| **修复参考** | knowledge-base/reference-materials/多租户SaaS化架构指南 §计费计量 |

#### P1-4 · Approval Gates / HITL 流程缺位

| 项 | 内容 |
|---|---|
| **证据** | knowledge-base ADR-016 Approval Gates 已是知识库标准 · QuanAn ADR.md 22 条 ADR 没采纳这条 · 高风险操作(封禁用户 / 删除账号 / 手动改进化档案 / 强制下架内容)无两人审批机制 |
| **影响** | 单 admin 误操作 / 恶意操作没有第二道闸 |
| **修复动作** | ADMIN-ARCHITECTURE 加 "Approval Gates 流程"(对应高风险动作清单)+ ADR.md 加 ADR-020 |
| **修复参考** | knowledge-base/08-tech-decisions/架构决策记录 ADR-016 |

#### P1-5 · 行业合规仪表盘缺位

| 项 | 内容 |
|---|---|
| **证据** | AGENTS §1.4 + 9.11-D 写了医疗/法律/金融自动免责 · PII 脱敏 · 但 admin 看不到"今日触发免责次数 / 命中违禁词 / PII 命中率" |
| **影响** | 合规问题没有早期信号 · 出事故时才发现"原来这个月触发了 1000 次违禁词" |
| **修复动作** | ADMIN-ARCHITECTURE 加 "合规仪表盘域":免责触发统计 / 违禁词命中率 / PII 命中率 / 行业分布 |
| **修复参考** | AGENTS §9.11-D · knowledge-base/reference-materials/Agent安全架构与合规指南 |

#### P1-6 · ARCHITECTURE.md 没有"演进路线图章节涵盖 admin"

| 项 | 内容 |
|---|---|
| **证据** | §9.1-9.10 P0-P8 9 阶段路线图 · admin 完全缺位 · §9.10 P8 只描述 /knowledge / /guide / /present-styles 静态页 · 没提 admin |
| **影响** | 路线图视而不见 · 即使 ADMIN-ARCHITECTURE 写了,主路线图不收录 → 实施会被忽略 |
| **修复动作** | ARCHITECTURE.md 加 §9.X "P9 · admin 后台"(独立阶段 · 可与 P3-P8 并行)+ 标注 admin 启动时机不依赖主应用 P8 |
| **修复参考** | knowledge-base/04-system-architecture/端到端链路设计说明 |

#### P1-7 · pnpm-workspace 是"可选" · 应锁定为强制

| 项 | 内容 |
|---|---|
| **证据** | SCAFFOLD.md:32 写 `pnpm-workspace.yaml(可选)` · 实际 src/ 下前后端混在一个包内 |
| **影响** | 前后端 + admin 三方都在 src/ 同根包 · 拆 admin 时要大重构 |
| **修复动作** | SCAFFOLD.md 改为强制 monorepo workspace · 拆分:`apps/web` / `apps/admin` / `apps/api` / `packages/schemas` / `packages/ui` / `packages/clients` |
| **修复参考** | knowledge-base/05-module-design/模块职责与边界定义 |

---

### §4.3 P2 可优化(6 项 · 不影响硬约束 / 但提升健康度)

#### P2-1 · A/B 测试管理缺位(后续可加)

ARCHITECTURE §2.5 暗示了 step_04b_1~6 / step_08_1~7 多变体 · 但无 A/B 测试基础设施。后续 admin 可加 A/B 平台。

#### P2-2 · 知识库 / 静态常量管理缺位

9 类常量 + 67 案例 / 23 公式 / 22 元素都是常量层(`lib/constants/`) · admin 后台无法 CRUD · 改动只能改代码发版。后续可加"常量管理域"。

#### P2-3 · §1.4 9 层架构图未把 admin 标出独立子系统

ARCHITECTURE.md L98-137 9 层架构图只画主应用 · admin 完全不可见。修复 P0-1 后,这张图也应更新成"主应用 + admin 双子系统"。

#### P2-4 · §1.7 与 aiipznt 原版的差异化决策表 8 项 · 漏了 admin

ARCHITECTURE:191-204 列了 8 个偏离决策(视觉 / Agent 拓扑 / 文案生成 / 记忆 / 进化 / 流式 / 多账号 / 透明度) · **没有"管理后台"这条偏离** · 实际原版 admin 简陋 + QuanAn 应该升级 · 这是第 9 条偏离决策应该写。

#### P2-5 · §6.7 五条端到端时序图未含任何 admin 流

ARCHITECTURE:1808+ 5 条时序图都是主应用流(9 步 / 工具 / 诊断 / 飞轮 / 多轮)· 没有"admin 跨账号查 / 内容审核 / 配额调整"的时序。这是 admin 落地前的关键参考缺位。

#### P2-6 · 跨子系统的 audit_log 设计未明确 admin 视角

DATA-MODEL §G audit_log 已设计 · 但**没说"admin 自己的操作怎么写 audit"**(eventCategory='admin' 已列但没展开)+ admin 操作要不要写到独立的 admin_audit_log。建议在 ADMIN-ARCHITECTURE 明确。

---

### §4.4 问题清单小结

| 优先级 | 数量 | 类型分布 |
|:-:|:-:|---|
| 🔴 **P0 必修** | **8** | 1 根因(P0-1)+ 1 派生(P0-2)+ 6 业务管理域 / 安全 / 边界 |
| 🟠 **P1 应修** | **7** | 5 业务管理域 + 1 路线图 + 1 工程结构 |
| 🟡 **P2 可优化** | **6** | 1 后续基础设施 + 1 常量 + 4 文档完善 |
| **合计** | **21** | — |

> **重要观察** · **8 个 P0 中,有 7 个是 P0-1 的派生** — 修了根因(把 admin 升级为独立子系统),其他 7 个 P0 自然落到 ADMIN-ARCHITECTURE.md 各章节里 · **不是 8 个独立改动 · 是 1 个系统性补完**。

下一节(§5)给出系统性改进建议 · 主体是 ADMIN-ARCHITECTURE.md 的章节骨架建议 + 13+ 业务管理域的逐域设计大纲 + 部署形态推荐。

---

## §5 改进建议

> §3 + §4 列出了"什么有问题",本节给"怎么修"。
> **核心建议** · **新建一份 `ADMIN-ARCHITECTURE.md`**(独立设计文档 · 跟 ARCHITECTURE.md 平级) · 把管理后台升级为 first-class 子系统 · 所有 P0/P1 问题汇入这一份。

### §5.1 ADMIN-ARCHITECTURE.md 章节骨架(建议结构)

> 篇幅预估 · 60-80KB / 1500-2000 行(略小于 ARCHITECTURE.md · 因为不重复主应用业务模型)

```
ADMIN-ARCHITECTURE.md(建议结构 · 9 章)

§1 · 系统总览
  1.1 admin 子系统定位(为什么独立 · 不嵌入主应用)
  1.2 跟主应用的关系(共享什么 / 不共享什么)
  1.3 服务对象(super_admin / admin / readonly_admin / 财务 / 法务)
  1.4 admin 子系统 9 层架构图(类比主应用 · 但服务侧不同)
  1.5 与 aiipznt 原版的差异(原版 1 个 invite-manage → 本架构 13+ 业务管理域)

§2 · 部署形态(详见 §5.3)
  2.1 独立子域名 · admin.quanan.com
  2.2 独立 SPA bundle · apps/admin
  2.3 独立 OAuth 应用 · 不复用主应用 OAuth
  2.4 独立 IP 白名单 + MFA + 强制审计
  2.5 独立 CI/CD · 可独立发版

§3 · 业务管理域全景(★ 核心 · 详见 §5.2)
  3.1 全景图 · 13+ 业务管理域的关系
  3.2 P0 域 · 6 个(运营 NSM / 用户 / 账号 / 成本 / 审计 / 邀请)
  3.3 P0 域 · 2 个(内容审核 · TrendingItem + DeepLearning)
  3.4 P1 域 · 5 个(进化档案 / Prompt 版本 / 配额 / 合规 / Approval)
  3.5 P2 域 · 2 个(A/B 测试 / 常量管理)

§4 · 数据访问与隔离(跟主应用的安全边界)
  4.1 admin 跨账号查询走单独 RLS policy(对应 DATA-MODEL §9.3)
  4.2 admin 操作必写 admin_audit_log(独立审计表 / 跟用户 audit_log 分开)
  4.3 admin 角色三档:super_admin / admin / readonly_admin
  4.4 高风险操作走 Approval Gates(知识库 ADR-016)

§5 · 接口契约(adminRouter 树)
  5.1 adminRouter · 跟 appRouter(用户)并列的 tRPC 树
  5.2 命名规范 · admin.<domain>.<action>(如 admin.users.banUser)
  5.3 鉴权链 · adminAuth → roleCheck → ipWhitelist → mfaCheck → auditLog
  5.4 跟主应用 router 的关系 · 不复用 / 不互调

§6 · 前端架构(apps/admin SPA)
  6.1 设计系统 · 复用 Aurelian Dark 但加 admin 专属(更密集 / 表格化 / 数据可视化)
  6.2 layout · sidebar(13 业务管理域)+ topbar(切换 admin 角色)+ breadcrumb + audit log drawer
  6.3 13 路由组(对应业务管理域)
  6.4 数据可视化栈 · recharts / ECharts / antv g2(选 1)
  6.5 表格 · TanStack Table(虚拟滚动 + 列筛选 + 导出 CSV/Excel)

§7 · 鉴权 + 审计 + 安全
  7.1 admin OAuth 应用(独立 client_id · 跟主应用分离)
  7.2 IP 白名单(office network + VPN)
  7.3 强制 MFA(TOTP / WebAuthn)
  7.4 异常登录告警(钉钉 / Slack)
  7.5 admin_audit_log(全量记录 · trace_id 贯穿 · 跨账号查必记 cross_account_query)
  7.6 高风险动作清单(封禁 / 删除 / 强制改进化档案 / 强制下架)走 Approval Gates

§8 · 实施路线图(P9 系列 · 跟主应用 P0-P8 并行)
  8.1 P9.0 · 基础设施(独立部署 + OAuth + 鉴权链)· 1 周
  8.2 P9.1 · 6 个 P0 业务管理域(NSM / 用户 / 账号 / 成本 / 审计 / 邀请)· 3 周
  8.3 P9.2 · 2 个 P0 内容审核域(TrendingItem + DeepLearning)· 2 周
  8.4 P9.3 · 5 个 P1 域 · 2 周
  8.5 P9.4 · 2 个 P2 域 · 1 周(后续版本)
  ────
  P9 总周期 · 9 周(可与主应用 P3-P8 并行 · 不阻塞)

§9 · 与主应用的协同
  9.1 共享:zod schemas / Aurelian Dark base tokens / 数据库 / 监控系统
  9.2 不共享:OAuth / SPA bundle / 路由 / 部署 / 鉴权链
  9.3 跨子系统的事件总线(可选 · 后期):用户被封禁 → 主应用 session 失效
```

### §5.2 13+ 业务管理域逐域设计大纲

> 每个域只列 6 字段:`数据来源 / KPI / 关键交互 / 鉴权 / UI 骨架 / 优先级`。详细设计放进 ADMIN-ARCHITECTURE.md §3。

#### 域 1 · 运营 NSM 仪表盘 ★ P0(运营核心)

| 字段 | 内容 |
|---|---|
| 数据来源 | feedback_log / step_data / evolution_profile / users / cost_log 多表聚合 |
| KPI | 7 天活跃 IP 账号数(NSM)+ 9 步完成率 + 反馈率 + 进化升级率 + D30 留存 |
| 关键交互 | 时间维度切换(日/周/月)+ 用户画像分布(4 类用户)+ 漏斗钻取(注册 → step1 → step3 → step7 → 反馈)|
| 鉴权 | super_admin / admin / readonly_admin(财务可看)|
| UI 骨架 | 顶部 4 大数字卡片 + 中间漏斗图 + 底部分日折线 + 右侧告警(指标恶化) |
| 优先级 | 🔴 P0(产品健康度生死线) |

#### 域 2 · 用户管理 ★ P0

| 字段 | 内容 |
|---|---|
| 数据来源 | users 表 + 关联 ipAccount / cost_log / audit_log |
| KPI | 总用户 / 活跃用户 / 付费用户 / 风险用户 |
| 关键交互 | 用户列表(分页 + 搜索 + 筛选 role / 套餐 / 行业)+ 详情(基本信息 + 活跃度 + 成本 + 审计时间线 + 关联账号)+ 操作(封禁 / 改套餐 / 重置密码 / 强制下线)|
| 鉴权 | super_admin(全)/ admin(改套餐+封禁,走 Approval)/ readonly_admin(只读)|
| UI 骨架 | 列表 + 详情抽屉 · 详情含 Tab(基本/活跃/成本/审计/账号)|
| 优先级 | 🔴 P0 |

#### 域 3 · IP 账号管理 ★ P0

| 字段 | 内容 |
|---|---|
| 数据来源 | ip_accounts + step_data progress + evolution_profile + history |
| KPI | 总账号 / 活跃账号 / 各行业分布 / 各平台分布 / 各阶段分布 |
| 关键交互 | 跨账号搜索(industry / platform / level / userId)+ 详情(9 步进度 / 进化档案 / 最近 history)+ 异常账号识别(连续 7 天活跃但 0 反馈 / 进化停滞)|
| 鉴权 | super_admin / admin(只读 + 标记)/ readonly_admin |
| UI 骨架 | 大表格 + 多维筛选 + 详情侧栏 + 行业/平台分布饼图 |
| 优先级 | 🔴 P0 |

#### 域 4 · 成本仪表盘 ★ P0

| 字段 | 内容 |
|---|---|
| 数据来源 | cost_log(双冗余 userId/accountId · 6 admin 索引已就位)|
| KPI | 月度总成本 / Top 10 成本用户 / Specialist 分项 / 模型分项 / 单用户日均 |
| 关键交互 | 时间范围选择 + 维度切换(用户/Specialist/模型/provider)+ 异常告警(单用户日 > $5)+ 导出 CSV(给财务)|
| 鉴权 | super_admin / admin / readonly_admin(财务必备)|
| UI 骨架 | 顶部成本数字 + 中间多线折线(分模型)+ 底部 Top 10 表格 + 异常告警区 |
| 优先级 | 🔴 P0 |

#### 域 5 · 审计日志查询 ★ P0(法务取证)

| 字段 | 内容 |
|---|---|
| 数据来源 | audit_log + cost_log + feedback_log + history(全部带 trace_id)|
| KPI | 日操作量 / cross_account_query 次数 / 异常事件 |
| 关键交互 | trace_id 反查(输入 trace_id → 一路追溯 prompt + 上下文 + 数据)+ 用户操作时间线 + 法务取证导出 |
| 鉴权 | super_admin(全)/ admin(只读)/ readonly_admin(只读 + 法务模式)|
| UI 骨架 | trace 反查输入框 + 时间线视图 + 详情(prompt / response / context)+ PDF 取证导出 |
| 优先级 | 🔴 P0(合规生命线) |

#### 域 6 · 邀请码管理(已部分规划)

| 字段 | 内容 |
|---|---|
| 数据来源 | invite_codes 表(DATA-MODEL §2.2)|
| KPI | 待激活邀请码数 / 转化率 / 各 campaign 效果 |
| 关键交互 | 创建(单条/批量)+ 列表(筛选 + 导出)+ 激活历史 + 失效设置 + campaign 分组 |
| 鉴权 | super_admin / admin |
| UI 骨架 | 顶部创建按钮 + 表格(批量操作)+ campaign 分组 Tab + 转化漏斗 |
| 优先级 | 🟡 P1(已规划 · 但需扩展功能) |

#### 域 7 · TrendingItem 内容审核 ★ P0(法律)

| 字段 | 内容 |
|---|---|
| 数据来源 | trending_items 表(全局共享 · 无 RLS)+ TrendingScraper 入库队列 |
| KPI | 入库审核中数 / 已批准 / 已驳回 / 命中违禁词次数 |
| 关键交互 | 入库前队列(排队等审核)+ 自动违禁词扫描 + 抽样人工审核 + 批量批准/驳回 + 来源平台监控 + 自动下架规则配置 |
| 鉴权 | super_admin / admin(审核员)|
| UI 骨架 | 待审核列表 + 详情(原内容 + 命中违禁词高亮)+ 批量按钮 + 自动规则配置面板 |
| 优先级 | 🔴 P0(平台合规) |

#### 域 8 · DeepLearningArchive 审核 ★ P0(合规)

| 字段 | 内容 |
|---|---|
| 数据来源 | deep_learning_archives + FileParser 解析队列 |
| KPI | 上传审核中数 / 命中 PII 次数 / 命中违禁次数 / 抽样人工审核率 |
| 关键交互 | 上传后排队 → 自动 PII 扫描 + 违禁词扫描 → 抽样人工审核 → 通过才入向量库 + 一键下架 + 用户警告 |
| 鉴权 | super_admin / admin(审核员)|
| UI 骨架 | 待审核列表 + 详情(原文件 / 解析后内容 / 命中标记)+ 批准按钮 + 下架按钮 + 用户违规累计告警 |
| 优先级 | 🔴 P0(用户内容合规) |

#### 域 9 · 进化档案监控

| 字段 | 内容 |
|---|---|
| 数据来源 | evolution_profile + evolution_insight |
| KPI | L1-L5 用户分布 / 飞轮停滞数 / 异常档案数(insight 矛盾)|
| 关键交互 | level 分布饼图 + 飞轮停滞告警(7 天无新 insight)+ 异常档案标记 + 强制重新跑批(走 Approval Gates)|
| 鉴权 | super_admin / admin |
| UI 骨架 | 顶部 L 分布 + 飞轮健康度仪表 + 异常账号列表 |
| 优先级 | 🟠 P1 |

#### 域 10 · Specialist Prompt 版本管理

| 字段 | 内容 |
|---|---|
| 数据来源 | (新表)prompt_versions + LLM Judge 评分 |
| KPI | 各 Specialist 当前版本 / Judge 评分 / 灰度比例 |
| 关键交互 | Prompt 编辑器 + Diff 对比 + 灰度配置(0%-100%)+ 自动跑 LLM Judge 100 金标准 + 一键回滚 + A/B 评分对比 |
| 鉴权 | super_admin(发布)/ admin(编辑 + 走 Approval)|
| UI 骨架 | 14 Specialist Tab + 版本时间线 + Monaco 编辑器 + Judge 评分对比 |
| 优先级 | 🟠 P1 |

#### 域 11 · 配额 / 限流管理

| 字段 | 内容 |
|---|---|
| 数据来源 | (新表)user_quota + Redis token bucket 状态 |
| KPI | 各套餐用户数 / 实时使用率 / 异常用户数 |
| 关键交互 | 用户配额表 + 实时使用 + 异常告警(突发流量)+ 手动调整(临时放配额)+ 临时白名单 |
| 鉴权 | admin(限制范围内)/ super_admin(无上限)|
| UI 骨架 | 用户配额表 + 实时折线 + 异常告警侧栏 + 手动调整面板 |
| 优先级 | 🟠 P1 |

#### 域 12 · 行业合规仪表盘

| 字段 | 内容 |
|---|---|
| 数据来源 | audit_log(eventCategory='compliance') |
| KPI | 今日触发免责数 / 命中违禁词次数 / PII 命中率 / 行业分布 |
| 关键交互 | 触发明细列表 + 行业分布饼图 + 时间趋势 + 导出合规报告 |
| 鉴权 | admin / readonly_admin(法务必备)|
| UI 骨架 | 顶部 4 数字 + 行业饼图 + 趋势折线 + 详情列表 |
| 优先级 | 🟠 P1 |

#### 域 13 · Approval Gates 工作流

| 字段 | 内容 |
|---|---|
| 数据来源 | (新表)approval_requests + admin_audit_log |
| KPI | 待审批数 / 平均审批时长 / 拒绝率 |
| 关键交互 | 待审批列表(操作详情 + 申请人 + 风险等级)+ 批准/拒绝(必带理由)+ 通知申请人 + 二次审批(高风险 2 人) |
| 鉴权 | super_admin / admin(根据风险等级分配)|
| UI 骨架 | 待审批列表 + 详情抽屉(操作上下文 + 影响范围预估)+ 批准/拒绝按钮 + 历史决策 |
| 优先级 | 🟠 P1 |

#### 域 14-16(P2 · 后续版本)

| 域 | 优先级 | 一句话 |
|---|:-:|---|
| 14 · A/B 测试管理 | 🟡 P2 | 灰度发布 + 漏斗对比 + 显著性检验 |
| 15 · 知识库 / 常量管理 | 🟡 P2 | 67 案例 / 23 公式 CRUD + 入向量库 + 行业更新 |
| 16 · 系统配置中心 | 🟡 P2 | feature flags + 环境变量 + 紧急开关 |

### §5.3 部署形态推荐(三方独立)

```
                        ┌────────────────────────────────────┐
                        │         monorepo · QuanAn/         │
                        ├────────────────────────────────────┤
                        │  apps/                              │
                        │   ├── web/      (主应用 SPA)         │
                        │   ├── admin/    (管理后台 SPA)       │
                        │   └── api/      (后端 + tRPC + agents│
                        │                  + workers)         │
                        │  packages/                          │
                        │   ├── schemas/  (zod 真理 · 共享)   │
                        │   ├── ui/       (shadcn 基础 · 共享)│
                        │   └── clients/  (tRPC client · 共享)│
                        │  prisma/                            │
                        │   └── schema.prisma                 │
                        └─────────────┬──────────────────────┘
                                      │ build
            ┌─────────────────────────┼──────────────────────────┐
            ▼                         ▼                          ▼
  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
  │  apps/web build  │     │ apps/admin build │     │  apps/api build  │
  │  → 静态 dist     │     │  → 静态 dist     │     │  → Docker image  │
  └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
           │                        │                         │
           ▼                        ▼                         ▼
   ┌──────────────┐         ┌──────────────┐          ┌──────────────┐
   │   Vercel /   │         │   Vercel /   │          │   Railway /  │
   │ CF Pages     │         │ CF Pages     │          │   Fly.io     │
   │ www.quanan   │         │ admin.quanan │          │ api.quanan   │
   └──────────────┘         └──────────────┘          └──────────────┘

  独立子域名     · www.quanan.com / admin.quanan.com / api.quanan.com
  独立 OAuth     · 主应用 client / admin client(分开)
  独立 CI/CD     · 改 web 不发 admin · 改 admin 不发 web · api 独立伸缩
  独立故障域     · admin 挂不影响 web · web 挂不影响 admin
  共享 packages  · zod 改一处 · 三方都自动同步
```

### §5.4 与 ARCHITECTURE.md 的协同(改主架构的 4 处)

> 即使新建 ADMIN-ARCHITECTURE.md · ARCHITECTURE.md 主文件也要做 4 处补丁修复 §3 / §4 发现的边界问题:

| 改 | 内容 | 工作量 |
|:-:|---|:-:|
| ① 加 §1.4b "前后端分离 + admin 子系统边界声明"(P0-3 + P0-1)| 显式声明三方独立部署 + 跟 ADMIN-ARCHITECTURE 互链 | 1 小时 |
| ② §1.7 表加第 9 条偏离决策(P2-4)| "管理后台:原版嵌入 + 简陋 → QuanAn 独立 + 13 域" | 30 分钟 |
| ③ §2.5b 改写为"管理后台 → 见 ADMIN-ARCHITECTURE.md"占位段(P0-1)| 不再单独描述 admin · 跳转独立文档 | 30 分钟 |
| ④ §9 加 P9 阶段(P1-6)| P9 admin 子系统(独立 9 周路线 · 不阻塞主应用)| 1 小时 |

> 总改动 · ARCHITECTURE.md ≈ 3 小时 + ADMIN-ARCHITECTURE.md(新建)5-7 天

下一节(§6)讲与知识库的更紧融合点 · §7 给出 Coding 3.0 协同的下一步建议。

---

## §6 与知识库的更紧融合点

> ARCHITECTURE.md §7.7 已经显式列了 11 处知识库借鉴清单,基础融合度已经达 ✅ 级(参 §2.1 亮点 7)。
> 本节是"在已有融合的基础上,本 review 推荐再深挖的 6 个融合机会" — 主要服务于 ADMIN-ARCHITECTURE.md 的 P0/P1 设计。

### §6.1 直接可借鉴的知识库章节(已存在 · 直接抄)

| # | 知识库章节 | 借鉴点 | 应用到 ADMIN-ARCHITECTURE 哪一节 |
|:-:|---|---|---|
| 1 | [`reference-materials/Agent运营数据分析框架.md`](../Ai_Agent/knowledge-base/reference-materials/Agent运营数据分析框架.md) | 四层指标 + A/B 测试 + 漏斗 + 仪表盘 + 告警 | §3.2 域 1 NSM 仪表盘 / §3.5 域 14 A/B |
| 2 | [`reference-materials/Agent安全架构与合规指南.md`](../Ai_Agent/knowledge-base/reference-materials/Agent安全架构与合规指南.md) | OWASP LLM Top 10 + Red Teaming + PII 处理 + GDPR | §7 鉴权安全章 / §3.2 域 8/12 内容审核 + 合规 |
| 3 | [`reference-materials/多租户SaaS化架构指南.md`](../Ai_Agent/knowledge-base/reference-materials/多租户SaaS化架构指南.md) | 三级隔离 + 计费计量 + 功能分级 + 安全检查清单 | §4 数据访问 / §3.4 域 11 配额管理 |
| 4 | [`reference-materials/LLMOps与团队协作指南.md`](../Ai_Agent/knowledge-base/reference-materials/LLMOps与团队协作指南.md) | Prompt 版本管理 + CI/CD + 灰度 + 回滚 | §3.4 域 10 Prompt 版本管理 |
| 5 | [`08-tech-decisions/架构决策记录(ADR).md`](../Ai_Agent/knowledge-base/08-tech-decisions/架构决策记录%28ADR%29.md) ADR-016 Approval Gates | 高风险操作两步审批 + 操作前确认 | §7.6 高风险动作 / §3.4 域 13 Approval Gates |
| 6 | [`reference-materials/AI-Agent的两种记忆范式-内部分层vs外部Issue飞轮.md`](../Ai_Agent/knowledge-base/reference-materials/AI-Agent的两种记忆范式-内部分层vs外部Issue飞轮.md) | Issue 飞轮的"反馈监控"视角 | §3.4 域 9 进化档案监控 |

### §6.2 应该写但还没有的知识库章节(本次 review 触发的"反向贡献")

> review 实战中发现 · 知识库当前没有专门讲"AI 产品的管理后台/运营平台架构"这个主题。建议把 ADMIN-ARCHITECTURE.md 落地后,**反哺到知识库**作为新的 reference 篇。

| 建议新建的知识库篇 | 内容范围 |
|---|---|
| `reference-materials/AI产品管理后台架构指南.md` | 13+ 业务管理域全景 + 鉴权三档 + Approval Gates + 跨账号查 + 内容审核 |
| `08-tech-decisions/ADR-019 前后端分离 + admin 子系统` | 把 QuanAn 的部署形态决策沉淀成可复用 ADR |

> 🟢 这是 **knowledge-base CLAUDE.md §三大操作 § Ingest** 的标准模式 — 先在项目侧实战 · 再回流知识库 · 形成"项目 ↔ 知识库"的双向飞轮。

### §6.3 ARCHITECTURE.md §7.7 借鉴清单的 3 处补强建议

| 序 | 当前借鉴 | 补强建议 |
|:-:|---|---|
| 1 | "11/05 LLM 网关 → §6.5 LLMGateway" | 加注:**LLMGateway 输出的 cost_log + audit_log 是 admin 仪表盘的数据源** — 前后端分离要保证 admin 能跨账号读这两张表 |
| 2 | "ADR-018 外部 orchestrator → §4.4" | 加注:**Approval Gates(ADR-016)与 ADR-018 在结构上同构** — 都是"外部 orchestrator + 持久化状态"模式 · admin 高风险操作的审批流可以复用 ADR-018 模板 |
| 3 | (新增)"reference/Agent 运营数据分析框架 → admin NSM 仪表盘" | 当前 §7.7 不含此引用 · 但 admin 落地必须借鉴 |

### §6.4 知识库融合小结

本节答 3 件事:
1. **6 个直接可借鉴的章节** · 让 ADMIN-ARCHITECTURE 不需要从零设计
2. **2 个反向贡献机会** · 把项目实战回流知识库
3. **3 处主架构借鉴清单补强** · 让 LLM Gateway / ADR-018 / 运营框架的关联浮到主文档

---

## §7 下一步建议

> 本节回答 · "看完这份 review 应该做什么"。给一个**可执行的下一步路径** · 兼容 Coding 3.0 工作流。

### §7.1 推荐的修复路径(三步走)

```
第 1 步 · 主架构 4 处补丁(0.5 天)
─────────────────────────────────────────
  ① ARCHITECTURE.md 加 §1.4b 前后端分离 + admin 子系统边界声明
  ② §1.7 表加第 9 条偏离决策
  ③ §2.5b 改写为占位 + 跳转 ADMIN-ARCHITECTURE.md
  ④ §9 加 P9 阶段(admin 9 周路线 · 与主应用 P3-P8 并行)
  
  ↓ 修完后 · ARCHITECTURE.md 自洽 · 主应用业务侧不变 · admin 边界清楚
  
第 2 步 · 新建 ADMIN-ARCHITECTURE.md(5-7 天)
─────────────────────────────────────────
  按 §5.1 给的 9 章骨架展开 · 每章引用 §6.1 知识库章节
  重点产出 ·
    · §3 业务管理域全景(13+ 域逐一展开 · 含 Prisma 新表设计)
    · §6 前端架构(apps/admin SPA 完整骨架)
    · §7 鉴权 + 审计 + 安全(独立 OAuth / IP 白名单 / MFA / Approval Gates)
    · §8 P9 实施路线(9 周分 5 批)
  
  ↓ 修完后 · admin 已完整设计 · 可进入 Coding 3.0 P0
  
第 3 步 · 同步配套 4 文档(1-2 天)
─────────────────────────────────────────
  · ADR.md  加 ADR-019 前后端分离 + ADR-020 Approval Gates
  · DATA-MODEL.md  加 admin_audit_log + prompt_versions + user_quota + approval_requests 4 张新表
  · AGENTS.md  加 §10 admin 子系统的代码层约束(rule + 红线 + audit)
  · SCAFFOLD.md  改为强制 monorepo workspace(apps/web + apps/admin + apps/api + packages/*)
  
  ↓ 修完后 · 6 文档全部对齐 · 可启动 P0/P9 双轨实施
```

**总成本** · 约 7-10 天 · 由 1-2 个人完成

### §7.2 Coding 3.0 协同建议

> ARCHITECTURE.md §9.12 已对齐 Coding 3.0 主流程 · 本节补 admin 子系统的协同节点。

```
Step 1 · /prime
        加载 ARCHITECTURE.md + AGENTS.md + ADMIN-ARCHITECTURE.md(新)
        
Step 2 · /create-rules(分两次跑)
        ① 主应用 AGENTS.md(已有)
        ② admin 子系统 AGENTS-ADMIN.md(新 · 派生自 ADMIN-ARCHITECTURE.md)
        
Step 3 · prd skill(分两路)
        路 1 · 主应用 PRD-1 ~ PRD-9(对应 P0-P8)
        路 2 · admin 子系统 PRD-A1 ~ PRD-A5(对应 P9.0-P9.4)
        ★ 两路可并行 · 互不阻塞
        
Step 4 · ralph skill(分两路 prd.json)
        每路独立的 prd.json · 独立的 ralph.py 进程 · 独立的 audit-gate.json
        
Step 5 · ralph.py(分两进程跑 · 双 daemon)
        进程 1 · python scripts/ralph/ralph.py --model sonnet --workspace apps/web --daemon
        进程 2 · python scripts/ralph/ralph.py --model sonnet --workspace apps/admin --daemon
        ★ 两进程不互相争锁(独立 workspace · 独立 prd.json)
        
Step 5.5 · Opus 审计
        每个进程独立的 audit-gate.json · Opus 分别审主应用 PR 和 admin PR
        
Step 7 · /goal-verify
        分两次:主应用对 ARCHITECTURE 退出条件 · admin 对 ADMIN-ARCHITECTURE 退出条件
```

> 🟢 **关键洞察** · 这种"双进程 · 双 prd.json · 双 daemon"是 Coding 3.0 工作流第一次在本项目上测试**多子系统并行执行**。这本身是项目的实验价值 · 跑通后可以反哺全局 `~/.claude/CLAUDE.md` 工作流。

### §7.3 还需要确认的 5 个产品决策(给用户决定)

> 我作为 reviewer 不能替你做产品决策 · 但下面 5 个问题如果不先回答,ADMIN-ARCHITECTURE.md 的细节会跑偏:

| # | 决策点 | 选项 | 影响 |
|:-:|---|---|---|
| 1 | **admin 子系统是 1.0 一起上还是独立后续版本?** | A 一起上(MVP 含 admin · 总 14 周)/ B admin 独立 · 主应用上线后再做(总 11+9 = 20 周但分批)| 决定 P9 启动时机 |
| 2 | **运营 admin 还是开发 admin?** | A 重运营(13 域全做 · 含审核 + 仪表盘)/ B 重开发(只做 Prompt 版本 + 审计 + 邀请 = 5 域)| 决定 13 域的取舍 |
| 3 | **admin 角色三档是否需要?** | A 三档(super_admin / admin / readonly_admin)/ B 二档(super + readonly)/ C 单档(全权 admin)| 决定鉴权复杂度 |
| 4 | **MFA 是否强制?** | A 强制(所有 admin)/ B 仅 super_admin / C 不强制(MVP 后再说)| 决定 P9.0 工作量 |
| 5 | **admin 是否复用主应用的 Aurelian Dark 设计?** | A 完全复用(密集表格化 + 数据可视化)/ B 独立设计系统(更密集 / 更专业)| 决定 §6 前端架构工作量 |

> 我建议:1=B / 2=A / 3=A / 4=B(super_admin 强制 MFA · admin 后续加)/ 5=A(复用 base · 加 admin 专属密度)。**但这需要你拍板**。

### §7.4 Review 报告自身的下一步

| 动作 | 说明 |
|---|---|
| **本报告位置** | `/Users/return/Desktop/QuanAn/ARCHITECTURE-REVIEW.md`(已落地)|
| **需要存档?** | 建议在项目修订记录里追加一行 · 让后续 Ralph 进 P0 时知道这份 review 存在 |
| **是否回流知识库?** | 建议:本报告的 13+ 业务管理域设计可沉淀为 `knowledge-base/reference-materials/AI产品管理后台架构指南.md`(参 §6.2 反向贡献) |
| **回访周期?** | 建议在 ADMIN-ARCHITECTURE.md 完成后做一次 v0.2 review(只复查 admin 子系统是否真的解决了 §3 + §4 问题) |

### §7.5 一句话收尾

> **当前 ARCHITECTURE.md v0.2 已经是一份高质量的"主应用架构骨架" · 主应用业务侧达到 ✅ 级。** 但作为"前后端分离 + 独立管理后台 + 管理后台 web"项目的总架构,它有一个 **P0 级的结构性缺口 — 管理后台被当成主应用的附属页面而不是 first-class 子系统**(15 行 / 0.5% 篇幅) · 继承了 aiipznt 原版的简陋 admin 设计。
>
> **解法不是改局部 · 是新建 `ADMIN-ARCHITECTURE.md` 把管理后台升级为独立子系统**(独立部署 + 独立 SPA + 独立 OAuth + 独立 13+ 业务管理域) · 主架构做 4 处补丁配合 · 配套 4 文档同步 · 总成本 7-10 天。
>
> **修完后** · QuanAn 才是一份既覆盖"95% Workflow + 5% Agent 的主应用"又覆盖"前后端分离 + 独立运营管理后台"的完整架构 · 可以启动 Coding 3.0 双子系统并行实施。

---

## 修订记录

- **2026-05-06 v0.1** · 创建 review 报告 · 7 章节(§0 摘要 + §1 资源盘点 + §2 整体判断 + §3 三条硬约束 + §4 问题清单 + §5 改进建议 + §6 知识库融合 + §7 下一步)
  - **§3 三条硬约束评估**(本 review 核心)
    - ① 前后端分离 · 🟡 70%(技术分离 ✓ · 边界声明 ✗)
    - ② 独立管理后台 · 🔴 15%(嵌入主应用 · §2.5b 仅 15 行)
    - ③ 管理后台 web 页面 · 🔴 5%(全仓库仅 1 个 admin 页面)
  - **§4 问题清单** · 8 P0 + 7 P1 + 6 P2 = 21 项
  - **§5 改进建议** · ADMIN-ARCHITECTURE.md 9 章骨架 + 13+ 业务管理域逐域设计 + 三方独立部署形态
  - **§6 知识库融合** · 6 个直接可借鉴章节 + 2 个反向贡献机会
  - **§7 下一步** · 三步修复路径(7-10 天)+ Coding 3.0 双子系统协同 + 5 个产品决策待确认

---

> **本报告由 Claude(Opus 4.7)基于 knowledge-base 标准 + aiipznt-clone-research 参考 + QuanAn 6 文档实测 · 遵循"7 维度按维度看 · 不汇总总分"原则。**
