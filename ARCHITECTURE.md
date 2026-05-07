# QuanQn · Agent 架构骨架

> **版本** · v0.4(架构骨架 · 2026-05-06 创建 · 2026-05-07 v0.4 修订:§1.4b 主/admin 边界 + §2.5b admin 跳转 + §6.7 双 daemon 时序 + §9.X P9 25w 串行)
> **范围** · 模块切分 / Agent 拓扑 / 接口契约 / 数据流 — **不含** 详细 ADR / 成本估算 / 部署细节 / Prompt 模板
> **输入** · `aiipznt-clone-research/`(逆向研究)+ `aiipznt-spec.md`(329KB 复刻规格)+ `ui/`(60+ 设计稿)
> **方法论** · 项目本仓库 `knowledge-base/` 的 Agent 架构知识体系
> **配套(待补)** · ADR.md / DATA-MODEL.md / PROMPTS.md / DEPLOY.md
>
> **阅读顺序** · §1 看全局 → §2 看业务 → §4 看核心 Agent 拓扑 → §3/§5/§6 看数据与接口 → §9 看落地

---

## 文档地图

| § | 章节 | 一句话 |
|:-:|---|---|
| §1 | **系统总览** | QuanQn 是 aiipznt 的复刻品,本架构在其 spec 之上叠加知识库的 Agent 范式形成"骨架"。 |
| §2 | **业务模型** | 9 步 IP 打造向导(主线) + 14 个独立工具(辅线) + 6 个新模块(辅助) + 反馈进化飞轮(机制) 四件套。 |
| §3 | **数据架构** | 13 个 tRPC 路由组 / 18 个 localStorage key / 9 步真实输出 schema / RAG 边界(常量 vs 向量)。 |
| §4 | **Agent 编排架构** | 95% Workflow + 5% Agent 的混合范式,14 个 Specialist 按"能力域"归并(不按 Step 一对一),2 个 Heartbeat Agent 自治。 |
| §5 | **记忆系统 + 进化飞轮** | 五层记忆(Buffer/Core/Recall/Profile/Trending)+ 反馈飞轮(EvolutionAgent 跑批 → ContextAssembler 注入 prompt)。 |
| §6 | **接口契约与数据流** | 前后端 tRPC 契约 + Agent↔Tool/Memory/RAG 内部契约 + 5 条关键端到端数据流(主向导/工具/诊断/进化/语音)。 |
| §7 | **多 Agent 案例对照** | 跟知识库 11/02 八 Agent + 02 多 Agent 协作 + 05-vertical/02 爆款文案的横向对照,解释为什么我们选这个粒度。 |
| §8 | **UI/UX 设计系统** | Aurelian Dark 极简奢华:Manrope/Plus Jakarta Sans/Inter 三字体 + #f2ca50/#d4af37 双金 + 60+ 设计稿索引。 |
| §9 | **实施路线图 + 知识库映射 + 风险护栏** | P0-P8 阶段拆分 + 每个 Phase 引用的知识库文档 + 输入/输出/配额/合规 4 类护栏。 |

---

## §1 系统总览

### §1.1 一句话定位

> **QuanQn = 借用 aiipznt 的产品形态(WHAT)+ 引入知识库的工程哲学(HOW)+ 用 Aurelian Dark 重塑视觉(LOOK)** — 一个"复刻 + 升级 + 范式落地"三位一体的 AI Agent 平台项目。

* **产品语义** · AIP 全案获客操盘手 · OPC 全案落地 · 从流量到成交的一站式 AI 工具集
* **服务对象** · 个人 IP 起号者 / OPC(One Person Company)创业者 / 传统行业转型者 / MCN 与品牌方
* **业务承诺** · 把"做 IP / 上短视频 / 私域成交"全链路拆成 9 步 AI 向导 + 14 个独立工具 — **「善用 AI,你一个人就是千军万马」**
* **复刻基线** · aiipznt.vip(Manus 平台生成 · 已实测 50+ tRPC procedure / 18 LS keys / 27 个核心页面)

### §1.2 系统的三种本质(从三个角度理解 QuanQn 是什么)

| 维度 | 本质 | 含义 |
|---|---|---|
| **业务本质** | AI 驱动的"个人 IP 孵化 + 变现加速"工具集 | 围绕"IP 账号"做聚合根,从行业选择到直播策划,每一步都让 AI 把"专业活"接管 |
| **工程本质** | 95% Workflow + 5% Agent 的混合系统 | 主向导是预定义代码路径(用户主动推进),少数节点(语音对话/进化/每日任务)才是 LLM 自主决策 — 详见 §4 |
| **数据本质** | 多层记忆 + 反馈飞轮的有机体 | stepData 双写 + 18 LS keys + 进化档案 + trending 滚动缓存,共同支撑"用得越多越懂你"的 5 级进化机制 — 详见 §5 |

> 这三种本质要**同时**理解。少一个角度都会把架构带偏:只看业务会过度抽象,只看工程会丢业务语境,只看数据会做成 CRUD。

### §1.3 输入边界 — 三份资料是什么关系

```
                          ┌──────────────────────────┐
                          │  aiipznt.vip(线上目标) │
                          └─────────────┬────────────┘
                                        │ 逆向抓取(2026-05-05 · 3 轮)
                                        ▼
            ┌────────────────────────────────────────────────┐
            │  aiipznt-clone-research/(逆向研究 · 98% 完成度) │
            │  · 27 raw HTML(每页 ~400KB)                    │
            │  · 34 页面结构 JSON                             │
            │  · 50+ tRPC 路由(bundle 反编译)                │
            │  · 18 LS keys(实测 schema)                     │
            │  · 30+ dynamic UI 行为                          │
            └────────────┬─────────────────────┬─────────────┘
                         │ 提炼 spec            │ 提炼 schema
                         ▼                     ▼
              ┌──────────────────┐    ┌──────────────────────┐
              │ aiipznt-spec.md  │    │ schemas-summary.md  │
              │ (329KB · 50 章)  │    │ (实测真实数据结构)   │
              └─────────┬────────┘    └────────┬─────────────┘
                        └─────────┬────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │   QuanQn/ui/     │
                        │   60+ 设计稿     │
                        │  Aurelian Dark   │
                        └─────────┬────────┘
                                  │
                                  ▼
              ┌────────────────────────────────────┐
              │   本架构骨架 ARCHITECTURE.md       │
              │   (在其上叠加知识库 Agent 范式)    │
              └────────────────────────────────────┘
```

**关键**:本架构**不重复 spec.md 已经写明的内容**(产品规格 / UI 细节 / API 字段)。本架构只回答 spec.md **没回答的 4 个问题**:
1. 这个产品在 Agent 拓扑层面应该长什么样?(§4)
2. 数据如何在 Agent 之间流转?(§5 + §6)
3. 模块之间的接口契约是什么?(§6)
4. 怎么用知识库的最佳实践来落地?(§7 + §9)

### §1.4 整体 9 层架构图(本项目映射)

> 借用知识库通用 9 层架构(参 [`00-project-overview/项目整体技术架构总览.md`](../Ai_Agent/knowledge-base/00-project-overview/)),映射到本项目:

```
┌────────────────────────────────────────────────────────────────────────┐
│  L1 · UI 表现层(React + shadcn + Aurelian Dark · 60+ 设计稿)         │
│       9 步向导页 / 14 工具页 / 6 新模块页 / 3 辅助页                    │
├────────────────────────────────────────────────────────────────────────┤
│  L2 · 客户端 SDK 层                                                    │
│       tRPC client + React Query + Zustand + LocalStorage Hook           │
│       useStepData / useActiveAccount / useEvolution / useFeedback       │
├────────────────────────────────────────────────────────────────────────┤
│  L3 · API 网关层(13 个 tRPC 路由组 / 50+ procedure)                    │
│       auth / ipAccounts / stepData / copywriting / videoAnalysis ...    │
├────────────────────────────────────────────────────────────────────────┤
│  L4 · Workflow 编排层(确定性流程)                                     │
│       9 步向导 Command / 14 工具 Command / 8 步诊断 Command             │
│       IPProgressService(软 Supervisor · 跟踪 9 步进度)                 │
├────────────────────────────────────────────────────────────────────────┤
│  L5 · Agent 自治层(LLM 决策密集)                                      │
│       VoiceChatAgent(多轮对话)                                         │
│       EvolutionAgent(Heartbeat · 反馈聚合 · 注入)                      │
│       DailyTaskAgent(Heartbeat · 0 点触发 · 任务生成)                  │
├────────────────────────────────────────────────────────────────────────┤
│  L6 · Specialist 能力层(14 个能力域 Agent)                            │
│       Positioning / Branding / Monetization / Topic / Copywriting /     │
│       Video / Livestream / PrivateDomain / Analysis / Diagnosis /       │
│       DeepLearn / VoiceChat / Evolution / DailyTask                     │
│       ContextAssembler(软 Supervisor · 调用前组装上下文)              │
├────────────────────────────────────────────────────────────────────────┤
│  L7 · Tool / RAG 层                                                     │
│       LLM Gateway(Claude/GPT/降级)+ Methodology Constants(常量)+     │
│       Vector Store(67 案例/23 公式/trending/用户档案)+ ImageGen +     │
│       FileParser + STT/TTS + TrendingScraper                            │
├────────────────────────────────────────────────────────────────────────┤
│  L8 · 数据持久层                                                       │
│       PostgreSQL(关系数据)+ Redis(缓存/限流/会话)+                  │
│       pgvector or Qdrant(向量库)+ S3/OSS(文件)                      │
├────────────────────────────────────────────────────────────────────────┤
│  L9 · 观测与运营层                                                     │
│       反馈日志 / 进化档案 / 配额计量 / 灰度开关 / Plausible/Amplitude   │
└────────────────────────────────────────────────────────────────────────┘
```

> ⚠️ **L4 与 L5 的边界是本架构最重要的判断**:多数节点是 L4 Workflow(用户主动推进 + 调单个 Specialist),只有 3 个节点进入 L5 Agent 自治(LLM 决定下一步)。这个判断的理论基础见 [`reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md`](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/),详细应用见 §4。

> 📌 **本图覆盖范围**(2026-05-07 v0.3 修订 · 对应 REVIEW P2-3) · 上述 9 层架构是**主应用(apps/web + apps/api)的视图**。**管理后台(apps/admin)是独立 first-class 子系统**,不在本图内,见下方 §1.4b 的双子系统全景图。详细 admin 架构见 [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md)。

### §1.4b 前后端分离 + admin 子系统边界声明(2026-05-07 v0.3 新增 · 对应 REVIEW P0-3)

> 本节是 v0.3 修订引入的**显式架构边界声明** — 把"前后端是怎么分的"和"admin 子系统跟主应用是什么关系"写到主架构里,让团队认知一致。
>
> 参 [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) §1.2 + §2 部署形态 / [`ADR.md`](ADR.md) ADR-019 + ADR-021 / [`SCAFFOLD.md`](SCAFFOLD.md) Workspace 强制结构。

#### A · 双子系统全景图(主应用 + 管理后台 · 共享数据层)

```
┌────────────────────────────────────────────────────────────────────────┐
│  浏览器侧(三个独立访问入口)                                          │
│                                                                        │
│   www.quanqn.com           admin.quanqn.com         (移动端 PWA · 复用 web│
│        ↓                         ↓                                      │
│  ┌──────────────┐          ┌──────────────┐                            │
│  │  apps/web    │          │  apps/admin  │ ★ 独立 SPA · 独立 OAuth   │
│  │  主应用 SPA  │          │  管理后台    │   独立路由 · 独立 build    │
│  │  9 步向导/   │          │  16 业务管理 │   独立 IP 白名单 · MFA     │
│  │  14 工具/    │          │  域 · 13 路由│                            │
│  │  6 新模块/   │          │  仪表盘/审核/│                            │
│  │  Aurelian    │          │  审计/合规/  │                            │
│  │  Dark        │          │  配额/Approve│                            │
│  └──────┬───────┘          └──────┬───────┘                            │
│         │ user OAuth              │ admin OAuth                         │
│         │ session                 │ session(独立)                     │
└─────────┼─────────────────────────┼─────────────────────────────────────┘
          │ tRPC                    │ tRPC
          │ /trpc/app.*             │ /trpc/admin.*
          └─────────┬───────────────┘
                    ▼
       ┌──────────────────────────────────────┐
       │  apps/api(后端 · 同一进程 · 双 router 树)│
       │   ├── appRouter(13 子树 · 主应用用)    │
       │   └── adminRouter(14 子树 · admin 用)  │
       │       └── 6 闸鉴权链(adminAuth →     │
       │            roleCheck → ipWhitelist →  │
       │            mfaCheck → adminRLS →      │
       │            approvalGateCheck)         │
       └─────────────────┬────────────────────┘
                         ▼
       ┌──────────────────────────────────────┐
       │  数据层(共享 · 通过 RLS 隔离)        │
       │   PostgreSQL · pgvector · Redis · S3  │
       │   ├── 主应用走 RLS account_isolation  │
       │   └── admin 走 admin_full_access      │
       │        bypass policy(set_config       │
       │        'app.role'='admin')             │
       └──────────────────────────────────────┘

   独立的 ·  域名 · OAuth · SPA bundle · CI/CD · 故障域
   共享的 ·  数据库 · Redis · S3 · 监控 · trace_id 协议
```

#### B · 三方独立部署形态

| 部署单元 | 域名 | 部署目标 | 何时发版 |
|---|---|---|---|
| **apps/web**(主应用 SPA) | www.quanqn.com | Vercel / Cloudflare Pages(静态 + CDN)| 跟随产品迭代 · 周更 |
| **apps/admin**(管理后台 SPA) | admin.quanqn.com | Vercel / Cloudflare Pages(独立 · IP 白名单)| 按需 · 月更甚至季度更 |
| **apps/api**(后端服务)| api.quanqn.com | Railway / Fly.io(容器 + autoscale)| 跟随两端任一改动 · 但有 PR review |

> ⚠️ **共享 api 进程不等于"耦合"** — 同一个 Node 进程既挂 appRouter 又挂 adminRouter,但**两棵 router 树严格分离**(adminRouter 不能调 appRouter 的 procedure · 反之亦然)。这种"同进程隔离"是为了节省 MVP 部署成本(< 1k 用户期间)· 规模化后可拆出独立的 admin-api 微服务,只动 router 文件位置,不动业务代码。

#### C · monorepo workspace 结构(强制)

```
QuanQn/(monorepo)
├── apps/
│   ├── web/             主应用 SPA(原 src/pages/ 主部分)
│   ├── admin/           管理后台 SPA(★ ADMIN-ARCHITECTURE 子系统)
│   └── api/             后端 + tRPC + agents + workers
│
├── packages/
│   ├── schemas/         zod 真理(三方共享)
│   ├── ui/              Aurelian Dark base + admin 密度组件
│   │   ├── base/        主应用使用
│   │   └── admin/       admin 专属(密集表格/数据可视化)
│   └── clients/         tRPC client config
│       ├── app-client.ts
│       └── admin-client.ts
│
├── prisma/              共享 schema(主应用 + admin 共用一个数据库)
│   ├── schema.prisma
│   └── migrations/
│
└── pnpm-workspace.yaml  ★ 强制(不再可选 · 详 SCAFFOLD §A 强制改造)
```

> 详细 workspace 文件清单 + 移植路径 见 [`SCAFFOLD.md`](SCAFFOLD.md) §A 强制 monorepo 改造。

#### D · 不允许的边界破坏(代码层)

```
❌ apps/web 的代码 import apps/admin 的代码
❌ apps/admin 的代码 import apps/web 的代码
❌ adminRouter 的 procedure 直接调 appRouter 的 procedure(反之亦然)
❌ apps/web 共享 admin OAuth client_id(反之亦然)
❌ apps/web 的 session 能登 admin SPA(反之亦然)
❌ admin SPA 不带 IP 白名单 / MFA 直接上线
✅ apps/web + apps/admin 通过 packages/* 共享(zod / UI base / tRPC client config)
✅ adminRouter + appRouter 通过同一 prisma client 共享数据(但 RLS 隔离)
```

> 这些边界由 [`AGENTS.md`](AGENTS.md) §10 红线机制强制 + `scripts/audit-redlines.sh` grep 检测。详 §10。

### §1.5 主要 Agent 拓扑速览(全图见 §4)

```
                  ┌─────────────────────────────────┐
                  │         用户(浏览器)            │
                  └──────────────┬──────────────────┘
                                 │ 点击 / 填表 / 反馈
                                 ▼
            ┌──────────────────────────────────────────────┐
            │  Workflow Command 层(用户主动)              │
            │  9 步 / 14 工具 / 6 新模块                    │
            └──────┬───────────────────────────────┬───────┘
                   │ 调用                           │ 反馈
                   ▼                                ▼
       ┌──────────────────────┐     ┌──────────────────────────┐
       │  ContextAssembler    │     │     反馈日志(L4 Profile)│
       │  (组装 prompt 上下文) │     │     feedback_log         │
       └──────┬───────────────┘     └────────┬─────────────────┘
              │ 调用                          │
              ▼                               │ 累计触发
   ┌────────────────────────┐                 ▼
   │  14 Specialist Agents  │      ┌─────────────────────┐
   │  (每个负责 1 个能力域) │      │  EvolutionAgent     │
   └────┬───────────────────┘      │  (Heartbeat)        │
        │ 调用                      │  · 聚合反馈         │
        ▼                           │  · 生成 insights    │
   ┌────────────────────────┐      └────────┬────────────┘
   │  LLM Gateway / Tools / │                │ 注入
   │  Vector Store / 常量    │                ▼
   └────────────────────────┘    ┌─────────────────────┐
                                  │ 进化档案 → 注入 prompt│
                                  └─────────────────────┘
```

> 看图要看出 3 个事:
> 1. **用户是 Workflow 的驱动者** — 不是 Agent 主动跑,而是用户点按钮才跑
> 2. **进化飞轮是闭环** — 反馈 → 聚合 → 注入回 Specialist · 形成"越用越懂你"
> 3. **ContextAssembler 是隐形枢纽** — 不是 LLM,但每次 Specialist 调用前都要它组装上下文(进化档案 + 9 步历史 + 当前账号 + 方法论常量)

### §1.6 4 类用户视角(谁怎么用)

| 用户画像 | 主要路径 | 重度依赖的 Agent | 关键诉求 |
|---|---|---|---|
| **个人 IP 起号者**(0-1k 粉) | step1→step3→step3b→step5→step7 反复 | Branding · Topic · Copywriting | 从 0 起号 · 出爆款 |
| **OPC 创业者**(单人公司) | step4b→/monetization→/private-domain→/daily-tasks | Monetization · PrivateDomain · DailyTask | 单人撬动百万营收 |
| **传统行业转型者**(实体店主) | /diagnosis→step1→step3→/deep-learning | Diagnosis · Positioning · DeepLearn | 从线下到线上 · 重塑人设 |
| **MCN / 品牌方**(多账号矩阵) | /accounts→/trending→/my-topics→/history | Topic · 进化飞轮 · 多账号管理 | 矩阵效率 · 数据沉淀 |

> 4 类用户的产品入口不同,但底层 Agent 是**共享的**(共用 14 个 Specialist)。这是**能力域 Specialist 切分**(§4)能省掉重复 prompt 维护的根本原因。

### §1.7 与 aiipznt 原版的差异化决策

> 本架构**不是全盘照搬** aiipznt。在以下 8 个维度做了选型偏离:

| # | 维度 | aiipznt 原版 | QuanQn 本架构 | 偏离理由 |
|:-:|---|---|---|---|
| 1 | 视觉风格 | 赛博青(#00e5ff)+ Orbitron 科技字 | Aurelian Dark(金 #d4af37/#f2ca50)+ Manrope 编辑字 | UI 阶段已选"极简奢华",更适配高客单价 OPC 用户群 — 详见 §8 |
| 2 | Agent 拓扑 | 黑盒(用户/工程师都看不到内部结构) | 显式 14 Specialist + 2 Heartbeat + 软 Supervisor | 知识库 [ADR-007 三层编排](../Ai_Agent/knowledge-base/08-tech-decisions/) 要求拓扑透明 |
| 3 | 文案生成 | step7 / generate / boom-generate / acquisition 各自一份 prompt | 4 个入口共用 CopywritingAgent(prompt 内分支) | 消除重复维护 · 11/02 实战案例验证可行 |
| 4 | 记忆机制 | 18 LS keys + stepData 双写 | 同上 + L4 进化档案 + L5 trending 滚动缓存 | [11/04 五层记忆](../Ai_Agent/knowledge-base/11-implementation-case/04-五层记忆系统实现.md) 完整化 |
| 5 | 进化机制 | 5 级 + 累计反馈手动触发 | 同上 + 自动注入 Specialist system prompt | [ADR-018 外部 orchestrator](../Ai_Agent/knowledge-base/08-tech-decisions/) — 不只展示进化,更让进化生效 |
| 6 | 流式响应 | 实测全部非流式(Streamdown 是前端打字机模拟 · spec §ⅩⅬⅢ) | 同上 + 长输出 step3/4b/7 走 SSE | 用户体验 + 11/05 LLM 网关支持 |
| 7 | 多账号切换 | `window.location.reload()` 整页刷新 | reload + 预热 stepData 缓存 + 进化档案预读 | 软切换体验更顺 · 不破坏当前操作 |
| 8 | 架构透明度 | 0(只有前端能看到) | 100%(本文件 + 后续 ADR/DATA-MODEL/PROMPTS) | 复刻不只是抄,而是"复刻+理解+升级" |
| **9** | **管理后台**(2026-05-07 v0.3 新增 · 对应 REVIEW P2-4) | **1 个 `/invite-manage`(嵌入主应用)+ "推测后台功能"**(spec.md §16.3 实测) | **独立 first-class 子系统** · 16 业务管理域 · 独立部署(admin.quanqn.com)· 独立 OAuth · 独立 IP 白名单 · super_admin 强制 MFA · Approval Gates · 独立 9 周路线(P9.0-P9.4) | 原版 admin 简陋是历史包袱 · 复刻产品不应连同包袱一起复刻 · 用户硬约束#2 #3 要求独立 · 详见 [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) |

### §1.8 一句话总结

> 看完本节,你应该知道:**QuanQn 是什么(§1.1)、产品的 3 种本质(§1.2)、3 份资料怎么协同(§1.3)、9 层架构怎么映射(§1.4)、Agent 拓扑长什么样(§1.5)、谁怎么用(§1.6)、跟原版有哪些刻意偏离(§1.7)**。
>
> 后续章节按这个总览分头深入:**§2 业务模型 · §3 数据架构 · §4 Agent 编排 · §5 记忆与飞轮 · §6 接口与数据流 · §7 案例对照 · §8 设计系统 · §9 实施落地**。

---

## §2 业务模型

> 本节是"产品语言"层 · 不讲 Agent 拓扑(那在 §4)、不讲数据 schema(那在 §3)、不讲接口契约(那在 §6)。**只回答**:用户用这个产品做什么、流程怎么走、模块怎么协作。

### §2.1 四层业务对象金字塔

```
                  ┌───────────────────────┐
                  │     用户 (User)       │   ← 一人多账号
                  └───────────┬───────────┘
                              │ 1 : N
                              ▼
                  ┌───────────────────────┐
                  │   IP 账号 (IpAccount) │   ← 业务聚合根
                  │   行业·平台·阶段·定位 │
                  └───────────┬───────────┘
                              │ 1 : N
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │  9 步 Step   │ │  14 工具产物  │ │  6 新模块状态 │
      │  StepData    │ │ Asset/History│ │ Diagnosis/   │
      │  (向导主线)  │ │  (工具辅线)  │ │ Evolution... │
      └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
             │                │                 │
             └────────────────┼─────────────────┘
                              │ N : 1(每条产出可被 👍/👎)
                              ▼
                  ┌───────────────────────┐
                  │  反馈日志 (Feedback)  │   ← 进化飞轮燃料
                  │  + 进化档案 (Evolution)│
                  └───────────────────────┘
```

> 几个边界先说清:
> 1. **用户跟 IP 账号是 1:N** · 一个 sally zhao 可以有多个 IP 账号(企业号 / 个人号 / 测试号),通过 `aiip_active_account_id` 切换
> 2. **IP 账号是业务聚合根** · 9 步数据 / 14 工具产物 / 反馈历史 全部按 `account_id` 隔离 — 这决定了多账号场景下数据完全独立(详见 §5.4)
> 3. **进化档案是"账号级",不是"用户级"** · 同一用户的不同 IP 账号有不同进化方向(企业号严谨 vs 个人号活泼)

### §2.2 主线 · 9 步 IP 打造向导(Workflow)

> 📌 **术语澄清**:**实际 9 个 path / 业务上 8 个独立功能** —
> · **9 path** · `step1/3/3b/4/4b/5/6/7/8`(spec.md §ⅩⅦ 实测注册路由数)
> · **8 功能** · step3+3b 是"账号包装"内的拆分(包装 vs 人设) · step4+4b 是"成长规划"内的拆分(执行 vs 变现) · 业务概念上视为 2 大功能
> · 本文统一按 **9 path** 计数(对应代码层路由 / Specialist 切分 / stepData key)

每一步的契约表(对照 [`schemas-summary.md`](../aiipznt-clone-research/schema/schemas-summary.md) 实测真实数据 + spec.md §Ⅶ):

| Step | URL | 核心输入 | AI 输出结构 | LS Key | 对应 Specialist |
|:-:|---|---|---|---|---|
| **1** | `/step/1` | 行业(56 选 1 / 自定义) | `{industry, marketAnalysis, competitionLevel, recommendation}` | `step1` | **PositioningAgent** |
| **3** | `/step/3` | 平台 + 个人信息 + 目标受众 + 现有账号 | `{nickname[5], avatar{prompt+style}, background{prompt+platformVersions[3]}, bio{6 platforms}, overallStrategy}` 8KB | `step3_account_v3` | **BrandingAgent**(packaging mode) |
| **3b** | `/step/3b` | 平台 + 个人信息 + 受众 + 优势 + 故事 | `{coreIdentity, thoughtSystem{coreBeliefs[3]+uniqueViews[2]+catchphrases[3]}, contentPersona{contentPillars[4]}, trustBuilding, personaRoadmap{phase1+phase2+phase3}}` 6KB | `step3b_persona` | **BrandingAgent**(persona mode) |
| **4** | `/step/4` | 平台 + 粉丝量 + 目标 | markdown 字符串(16KB · 完整执行计划) | `step4_execution_v2` | **PositioningAgent**(execution mode) |
| **4b** | `/step/4b` | 产品描述 + 受众 + IP 定位 + 当前营收 | `{currentAnalysis, ladder[3 阶段], revenueStructure{primary+secondary[2]}, successCases[2]}` 8KB | `step4b_monetization` | **MonetizationAgent** |
| **5** | `/step/5` | 行业 + 产品 + 选题类别(traffic/monetize/persona/cognition/case) | `{[category]: 20 选题 · 含 hook/structure/formula/viralPotential}` 22KB | `step5_topics_v2` | **TopicAgent** |
| **6** | `/step/6` | 文案源 | `{shotList, equipment, schedule}`(13 列分镜表) | `step6_shooting` | **VideoAgent**(shooting mode) |
| **7** | `/step/7` | 脚本类型(20 选 1)+ 元素(22 选 N)+ 主题 | markdown 字符串(完整文案) | `step7_copywriting` | **CopywritingAgent** |
| **8** | `/step/8` | 平台 + 产品信息 + 受众 + 经验等级 | `{lastResult, lastOptimizedResult}` | `step8_livestream` | **LivestreamAgent** |

> ⚠️ **没有 step2** · 实测 `/step/2` 返回 404,产品迭代时被合并/删除(spec §ⅩⅦ 实测确认)。
> ⚠️ **step9 复盘** · 路由代码已注册但 UI 未上线(spec §ⅩⅦ 提及),本架构按"已规划但未实现"处理。

### §2.3 9 步数据流(主线串联)

> step 之间不是孤立的 — 后续 step 的 prompt 上下文要读前面 step 的 result。这是 **ContextAssembler**(§4.6)的核心职责。

```
[Step 1 行业]
    │ 行业 + 推荐分析
    ▼
[Step 3 账号包装]──┐
    │ 昵称+头像+简介+背景图(全平台版本)
    ▼              │ 复用 platform / personalInfo / targetAudience
[Step 3b 人设]    │
    │ 核心身份+思维体系+内容支柱+人设路线图
    ▼              │ 复用 personalInfo / targetAudience
[Step 4 执行]     │ 复用 platform / followers / industry
    │ 完整执行计划
    ▼              │ 复用 ipPositioning(从 step1 推导)
[Step 4b 变现]    │
    │ 阶梯+收入结构+成功案例
    ▼              │
[Step 5 选题]─────┤ 复用 industry + product + persona
    │ 5 类 × 20 选题
    ▼              │ ★ 选题数据可被收藏到 my-topics
[Step 6 拍摄]     │ 复用 step5 选定选题(如果有)
    │ 13 列分镜表
    ▼              │
[Step 7 文案]─────┤ 复用 industry + scriptType + 选定 topic
    │ markdown 文案    ★ 自动写入 history
    ▼              │
[Step 8 直播]     │ 复用 platform + product + 经验等级
    └──────────────┘
```

**关键观察**:
1. **强依赖少** · step3/3b/4/4b/5/7/8 互相不强依赖(用户可以乱序点)
2. **共享上下文多** · `industry / platform / personalInfo / targetAudience` 反复用 — 这就是 spec §ⅩⅩⅩⅠ 实测的"sally 数据复用"现象
3. **`/ip-plan` 是状态视图** · 不是独立 step,而是 9 步进度的可视化(`stepData.progress` procedure 算 N/9)

### §2.4 辅线 · 14 个独立工具(4 大类)

> 14 个工具页**不是** 9 步的子集,而是**正交**于 9 步的"独立创作工具"。用户可以不走 9 步,直接用 /generate 写文案。

| 类别 | URL | 模块 | 一句话 | 共享 Specialist |
|:-:|---|---|---|---|
| **市场洞察** | `/trending` | 全网爆款库 | 一键抓取全平台爆款 | **TopicAgent** + TrendingScraper(Worker) |
| | `/video-analysis` | 爆款文案解析 | 粘贴文案 → AI 拆解 + 一键仿写 | **AnalysisAgent** |
| | `/present-styles` | 14 呈现形式 | 14 种爆款呈现形式全解析 | (静态常量页 · 无 Agent) |
| **变现设计** | `/monetization` | IP 变现模型 | 定制 IP 变现路径 | **MonetizationAgent** |
| | `/private-domain` | 私域成交 | 6 阶段话术(欢迎/破冰/信任/挖掘/成交/跟进) | **PrivateDomainAgent** |
| | `/boom-generate` | 爆款元素生成 | 选元素 → 一键 5 篇 | **CopywritingAgent**(boom mode) |
| **内容创作** | `/generate` | AI 智能生成 | 选脚本类型 + 元素 → 一键文案 | **CopywritingAgent**(free mode) |
| | `/analysis` | 文案结构分析 | 多维度评分 + 优化建议 | **AnalysisAgent**(structural mode) |
| | `/video-production` | 短视频制作 | 文案 → 分镜 + 拍摄方案 | **VideoAgent**(production mode) |
| | `/acquisition-video` | 获客型视频 | 精准获客视频方案 | **VideoAgent**(acquisition mode) |
| **智能工具** | `/ai-video` | 一键生成视频 | 文案 → 分镜表 + 每镜 AI 生图 | **VideoAgent**(storyboard mode)+ ImageGen Worker |
| | `/voice-chat` | 语音对话 | 实时语音 AI 助手 | **VoiceChatAgent**(L5 自治)+ STT/TTS Worker |
| | `/deep-learning` | 深度学习 | 上传文案样本 → 风格学习 | **DeepLearnAgent**(写记忆 · 不直接生成) |
| | `/knowledge` | 方法论知识库 | 20 脚本 + 22 元素 + 67 案例 | (静态常量 + RAG 检索 · 详见 §3.5) |

> 重点说**「共享 Specialist」**这一列(本架构最关键的工程决策之一):
> * `/step/7` `/generate` `/boom-generate` `/acquisition-video`(部分) **共享 CopywritingAgent** — 都是文案生成,只是 prompt 模板里的"模式分支"不同
> * `/step/6` `/video-production` `/acquisition-video` `/ai-video` **共享 VideoAgent** — 都是视频方案
> * `/video-analysis` `/analysis` **共享 AnalysisAgent** — 都是结构分析
> * `/trending` `/step/5` `/my-topics` **共享 TopicAgent** — 都是选题
>
> 这种共享是**能力域 Specialist 切分**的核心红利:14 个工具页 × 9 步 = 23 个潜在的 prompt 模板,合并到 14 个能力域 Specialist 后,**实际只维护 14 个 system prompt**(详细切分理由见 §7.1 与 11/02 八 Agent 案例的对照)。

### §2.5 第三组 · 6 个新模块(辅助层)

> 这 6 个模块**不是** 9 步,**也不是** 14 工具,而是支撑前两类的**基础设施性页面**。

| 模块 | URL | 类型 | Agent / Worker | 业务角色 |
|---|---|---|---|---|
| **/diagnosis** | 8 维度 IP 诊断 | 独立 8 步表单 | **DiagnosisAgent**(独立 Specialist) | 用户进入产品的"体检入口" — 7 维度报告告诉他先做哪步 |
| **/daily-tasks** | 每日任务 | 后台 Heartbeat 触发 | **DailyTaskAgent**(L5 自治 · 0 点跑批) | 每天给用户 3-5 个具体任务(基于当前 IP 账号 9 步状态) |
| **/evolution** | 智能体进化中心 | 反馈飞轮可视化 | **EvolutionAgent**(L5 自治 · 阈值触发) | 5 级进化系统(L1-L5) + 反馈历史 + 进化洞察 — 详见 §5 |
| **/accounts** | IP 账号管理 | CRUD + 状态机 | (无 Agent · 纯 tRPC) | 多账号矩阵的入口,切换 active 账号 |
| **/my-topics** | 选题库 | 历史聚合 + 筛选 | (无 Agent · TopicAgent 写入) | step5/trending 收藏的选题集合,可一键跳 step7 |
| **/history** | 历史记录 | 历史聚合 + 筛选 | (无 Agent · CopywritingAgent 写入) | step7/generate/boom-generate 历史,按时间倒序 |

**重要边界**:
- `/diagnosis` 是**独立第三方流程** — 不属于 9 步,也不属于 14 工具,而是**前置评估**(类似医生先做体检再开方子)。诊断结果写入 `account.diagnosisHistory`,会被 ContextAssembler 在后续 Specialist 调用时引用。
- `/daily-tasks` 与 `/evolution` 是**唯三的 L5 自治 Agent**(加 `/voice-chat` 共 3 个) — 它们是 LLM 决策密集的,详见 §4.4。
- `/accounts` `/my-topics` `/history` 是**纯数据视图** — 不调 Agent,只是把别处生成的数据聚合展示。

### §2.5b 管理后台 → 见 ADMIN-ARCHITECTURE.md(2026-05-07 v0.3 重写 · 对应 REVIEW P0-1)

> ⚠️ **本节在 v0.2 版本曾尝试用 15 行总结整个管理后台** — REVIEW(2026-05-06)指出这种"嵌入主应用 + 简陋 3 路由"设计**违反硬约束#2 + #3**(独立管理后台 + 管理后台 web 页面)。
>
> v0.3 修订:**管理后台已升级为独立 first-class 子系统** · 完整设计见 [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md)(1762 行 / 9 章 / 16 业务管理域) · 本节仅保留**主应用视角的占位说明**。

#### A · 主应用视角的 admin 边界

```
主应用(本架构 §1-§9 描述的全部内容)
   │
   │ 不包含 admin 路由 · 不包含 admin 页面 · 不包含 adminRouter
   │
   │ 主应用 SPA(apps/web)路由表:
   │   · /step/1/3/3b/4/4b/5/6/7/8(9 步主向导)
   │   · /trending /video-analysis /generate / ...(14 工具)
   │   · /diagnosis /daily-tasks /evolution /accounts / ...(6 新模块)
   │   · /(首页)· /guide · /ip-plan(辅助)
   │   ──── 共 33 路由 · ★ 不含 /admin/* ──── 
   │
   ▼
管理后台(独立子系统 · 见 ADMIN-ARCHITECTURE.md)
   │
   │ admin SPA(apps/admin)· 部署在 admin.quanqn.com
   │ 16 业务管理域 · 13 路由组 · 独立 OAuth + IP 白名单 + MFA
```

#### B · 主应用应做的 admin 协同(★ P0/P1 必做)

> 主应用代码层只需做 4 件事配合 admin 子系统 · 其余全在 ADMIN-ARCHITECTURE.md:

| # | 主应用要做的 | 何时做 | 详见 |
|:-:|---|---|---|
| 1 | 数据库表加 trace_id 字段 + admin 索引(`[industry]` `[platform]` `[level]` 等) | P1 数据底座 | DATA-MODEL §G + §10 索引清单 |
| 2 | TrendingScraper Worker 改造 · 抓回的内容**不直接入向量库** · 进 trending_review_queue | P5 视频模块 | ADMIN §3.4 域 ⑦ |
| 3 | FileParser Worker 改造 · 用户上传的样本**不直接进 DeepLearningArchive** · 进 deep_learn_review_queue | P7 智能工具 | ADMIN §3.4 域 ⑧ |
| 4 | LLM Gateway 输出的 cost_log + audit_log · 不限 RLS 给 admin 跨账号查 | P3 主流程 | DATA-MODEL §9.4 |

#### C · admin 不在主应用 P0-P8 路线图

| 主应用阶段 | 是否包含 admin | 备注 |
|:-:|:-:|---|
| P0 基础设施 | ❌ | OAuth 只做主应用 user · admin OAuth 在 P9.0 单独申请 |
| P1 数据底座 | 🟡 部分 | 主应用 schema 加 trace_id + admin 索引(给 P9 用)|
| P2 路由地图 | ❌ | 不包含 /admin/* 占位(admin 在 admin.quanqn.com 子域名)|
| P3-P8 业务实施 | ❌ | 主应用功能完整 · admin 留 P9 |
| **P9.0-P9.4 · admin 子系统** | ✅ | **独立路线 · 主应用 P8 上线后启动** · 见 [§9.X P9 阶段](#§9X-P9--admin-子系统-9-周-2026-05-07-v03-新增)|

> ⚠️ **跟 v0.2 的关键差异** ·
> - v0.2 写的"延到 P8 之后(MVP 不需要)" → ❌ 已废弃
> - v0.3 改为"admin 独立 9 周路线 P9 系列 · 主应用 P0-P8 完整不被打扰" → ✅ 见 §9.X(本架构 v0.3 新增 P9 章节)

#### D · 主应用代码层禁止做的事(由 §1.4b D 红线定义)

```
❌ 主应用 src/pages/ 加 admin 子目录 · admin 应该在 apps/admin/src/pages/
❌ 主应用 src/server/trpc/ 加 admin router · adminRouter 在 apps/api/src/trpc/routers/admin/
❌ 主应用前端 wrapper 检查 role === 'admin' 跳转 admin 页面 · 用户应被拒绝(403 + 引导去 admin.quanqn.com)
❌ admin role 用户在主应用看到"额外的 admin 入口" · 主应用不暴露 admin 入口 · admin 用户必须主动访问 admin.quanqn.com
```

> 详细 admin 设计 → [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md)
> · §1 系统总览(为什么独立)
> · §2 部署形态(三方独立)
> · §3 16 业务管理域(★ 业务核心)
> · §4 数据访问与隔离
> · §5 接口契约(adminRouter)
> · §6 前端架构(apps/admin)
> · §7 鉴权 + 审计 + 安全
> · §8 P9.0-P9.4 实施路线(9 周)
> · §9 与主应用协同

### §2.6 第四组 · 反馈进化飞轮(机制层)

> 这不是一个"模块",而是一个**贯穿所有模块的横切机制**。详细数据流在 §5.5,这里只先讲业务位置。

```
┌─────────────────────────────────────────────────────────────┐
│  任意 Specialist 生成内容  →  用户看到 → 👍/👎  →  feedback_log │
└──────────────────────────────────────┬──────────────────────┘
                                       │ 累计触发
                                       ▼
                         ┌─────────────────────┐
                         │  EvolutionAgent     │
                         │  (Heartbeat / 手动)│
                         └──────────┬──────────┘
                                    │ 生成 evolution_insights
                                    ▼
                         ┌─────────────────────┐
                         │  Evolution Profile  │   ← 账号级
                         │  · 偏好金句         │
                         │  · 风格倾向         │
                         │  · 避忌清单         │
                         └──────────┬──────────┘
                                    │ 注入 system prompt
                                    ▼
                         ┌─────────────────────┐
                         │  下次 Specialist 调用 │   ← 越用越懂你
                         └─────────────────────┘
```

**5 级进化等级**(实测 spec §8.5.3):

| 等级 | 反馈数 | 业务含义 |
|:-:|:-:|---|
| 🌱 L1 初始化 | 0-4 | 刚注册 · 进化档案为空 · Specialist 用基础 prompt |
| 📚 L2 学习中 | 5-19 | 可手动「触发进化」 · 第一次生成 insights |
| 🌿 L3 成长期 | 20-49 | 自动进化开关可启用 · insights 持续更新 |
| 🌳 L4 成熟期 | 50-99 | 进化方向多维度细分(创意/转化/真实) |
| 👑 L5 大师级 | 100+ | 进化档案稳定 · 可被复用到该用户其他账号(可选) |

**4 个核心指标**(`/evolution` 仪表盘展示):
1. 好评数(累计 👍)
2. 待改进(累计 👎)
3. 学习档案数(`/deep-learning` 上传样本数)
4. 满意率 = 👍 / (👍 + 👎)

> 详细的反馈数据流图、ContextAssembler 注入机制、跨账号档案共享策略,都在 **§5 记忆系统 + 进化飞轮**。

### §2.7 业务全景图(本节收口)

```
                    ┌──────────────────────────┐
                    │      用户的 IP 账号       │
                    └────────────┬─────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
  ┌──────────┐            ┌──────────┐              ┌──────────┐
  │ 9 步主线 │            │ 14 工具  │              │ 6 新模块 │
  │ Workflow │◄─共享 Agent┤ Workflow │              │ 基础设施 │
  │ (向导)   │            │ (独立)   │              │ + 自治   │
  └────┬─────┘            └────┬─────┘              └────┬─────┘
       │                       │                          │
       └───────┬───────────────┴──────────────────────────┘
               │ 任意输出都可被 👍/👎
               ▼
       ┌────────────────────────────┐
       │   反馈飞轮(横切机制)       │
       │   feedback_log → Evolution │
       │   → 注入下次 Specialist     │
       └────────────────────────────┘
```

**业务模型小结**(本章答 4 件事):
1. 用户在 4 层金字塔上工作(用户/账号/产物/反馈)— §2.1
2. 主线是 9 步向导,数据流强联(共享 industry/platform/persona)— §2.2/§2.3
3. 辅线是 14 工具,通过**能力域共享 Specialist**消除重复 prompt — §2.4
4. 6 新模块是基础设施 + 反馈飞轮是横切机制 — §2.5/§2.6

下一章(§3)进入数据架构层,具体看每个对象的 Schema、tRPC 路由组、LS↔DB 双写、RAG 边界。

---

## §3 数据架构

> 本节是"数据骨架" · 不讲 Agent 调用(那在 §4)、不讲 prompt 注入(那在 §5)。**只回答**:有哪些实体、字段什么样、放哪个存储、谁入库谁是常量。

### §3.1 领域实体关系图(ER 概览)

```
                          ┌──────────────┐
                          │     User     │  ← Google OAuth 登录
                          └──────┬───────┘
                                 │ 1:N
                                 ▼
                          ┌──────────────┐         ┌────────────────┐
                          │  IpAccount   │◄────────┤  InviteCode    │
                          │  (聚合根)    │  N:1    │ (邀请激活)     │
                          └──────┬───────┘         └────────────────┘
                                 │
        ┌────────┬───────┬───────┼───────┬────────┬───────┬─────────┐
        │ 1:N    │ 1:N   │ 1:N   │ 1:N   │ 1:N    │ 1:N   │ 1:1     │
        ▼        ▼       ▼       ▼       ▼        ▼       ▼         │
   ┌────────┐┌────────┐┌──────┐┌──────┐┌────────┐┌────────┐┌─────────────┐
   │StepData││History ││Topic ││Asset ││Diagnosis││Feedback││ Evolution   │
   │(9 步)  ││(文案史)││库    ││(媒体)││Report  ││Log     ││ Profile     │
   └────────┘└────────┘└──────┘└──────┘└────────┘└───┬────┘└──────┬──────┘
                                                     │            │ 累计触发
                                                     │ N:1        ▼
                                                     │     ┌─────────────────┐
                                                     └────►│ EvolutionInsight│
                                                           │  (跑批产物)     │
                                                           └─────────────────┘

   ┌─────────────────────────┐         ┌────────────────────────┐
   │ DeepLearningArchive     │         │ KnowledgeFavorite      │
   │ (用户上传样本 · per-acc) │         │ KnowledgeNote          │
   └─────────────────────────┘         └────────────────────────┘

   ┌──────────────────────────┐
   │  TrendingItem (全局缓存) │  ← 不属于任何账号 · 跨用户共享
   └──────────────────────────┘
```

**3 条关键原则**:
1. **IpAccount 是聚合根** · 90% 的实体都按 `account_id` 分区(除 User/InviteCode/TrendingItem 三个例外)
2. **Feedback 是飞轮燃料** · FeedbackLog 累计 → EvolutionAgent 跑批 → EvolutionInsight 注入 prompt(详见 §5)
3. **TrendingItem 是全局共享** · 全网爆款不按账号隔离,所有用户复用同一份缓存(节省抓取成本)

### §3.2 13 + 2 = 15 个 tRPC 路由组职责矩阵

> 实测从 `bundle.js` 反编译得到 50+ procedure,归为 **13 个核心 router + 2 个辅助 router(trending / invite) = 15 个**(spec.md §3.1)。每个 router 的职责边界 + 操作的实体 + 是否调 Specialist 一目了然:

| # | Router | 主要 Procedure | 操作实体 | 调用 Specialist | 写入 LS Key |
|:-:|---|---|---|---|---|
| 1 | `auth` | `me` / `logout` | User | — | (Cookie · 不入 LS) |
| 2 | `ipAccounts` | `list` / `active` / `create` / `update` / `delete` / `switchActive` | IpAccount | — | `aiip_active_account_id` |
| 3 | `stepData` | `get(stepKey)` / `getAll` / `save` / `progress` | StepData | (read-only · 写在各 Specialist mutation) | `aiip_memory_acc_{id}_{stepKey}` × 9 |
| 4 | `copywriting` | `generate` / `optimize` / `list` / `delete` | History | **CopywritingAgent** | `step7_copywriting` + `_history` |
| 5 | `videoAnalysis` | `analyze` / `rewrite` | History(video kind) | **AnalysisAgent** | `video_analysis` |
| 6 | `videoProduction` `acquisitionVideo` `aiVideo` | `generate` / `generateStoryboard` / `generateSceneImage` | Asset | **VideoAgent** + ImageGen Worker | `step6_shooting` / `ai_video_storyboard` |
| 7 | `boomGenerate` | `generate` | History | **CopywritingAgent**(boom mode) | `boom_generate` |
| 8 | `monetization` | `generate` | StepData | **MonetizationAgent** | `step4b_monetization` |
| 9 | `privateDomain` | `generate` | History | **PrivateDomainAgent** | `private_domain_v2` |
| 10 | `diagnosis` | `generate` / `history` / `latest` | DiagnosisReport | **DiagnosisAgent** | (服务端为主 · 不入 LS) |
| 11 | `evolution` | `evolve` / `getConfig` / `updateConfig` / `history` / `recentFeedback` / `feedbackTrend` / `moduleRanking` | EvolutionProfile / Insight / FeedbackLog | **EvolutionAgent**(Heartbeat) | (服务端为主) |
| 12 | `deepLearning` | `list` / `create` / `createFromFile` / `learn` / `delete` | DeepLearningArchive | **DeepLearnAgent** | (服务端为主) |
| 13 | `knowledge` | `getRecommendations` / `getScriptCases` / `getFavorites` / `addFavorite` / `removeFavorite` / `getNotes` / `addNote` | KnowledgeFavorite / Note + (RAG 向量库) | (无 Specialist · 走 RAG) | (服务端为主) |
| - | `trending` | `fetch` / `listByIndustry` / `listByStyle` | TrendingItem | (TrendingScraper Worker) | (Redis · 不入 LS) |
| - | `invite` | `redeem` (推测) | InviteCode | — | `pendingInviteCode` (sessionStorage) |

> ⚠️ **路由 1-13 是**核心 + 辅助的全部**,trending 和 invite 单独列(spec.md 实测但归类到"扩展")。
> ⚠️ `stepData.save` 是**通用入口**,但实际生产环境**每个 Specialist 自己写自己的 stepKey**(避免互相覆盖) — 这是一个隐性约定。

### §3.3 LocalStorage 18 keys 命名规范

> 18 keys 的核心模式是 `aiip_memory_acc_{accountId}_{key}`,实现**多账号 Schema 隔离**(spec.md §3.5 实测 + §ⅩⅩⅩⅠ 完整 dump):

| 命名空间 | Key 模式 | 示例 | 数量 |
|---|---|---|---|
| 全局会话 | `aiip_active_account_id` | `390012` | 1 |
| 邀请态 | `pendingInviteCode`(sessionStorage) | `XYZ123` | 1 |
| 9 步主线 | `aiip_memory_acc_{id}_step{N}{key}` | `aiip_memory_acc_390012_step3_account_v3` | 9 |
| 工具产物 | `aiip_memory_acc_{id}_{toolKey}` | `aiip_memory_acc_390012_video_analysis` | 7+ |

**键名版本** · 实测有 `_v2` `_v3` 后缀(如 `step3_account_v3`)— 这是产品迭代时**保留旧版兼容**的写法。本架构选择 **「读旧 + 写新」策略**:Specialist 读时同时尝试 v2/v3,写时强制 v3。

### §3.4 LS↔DB 双写策略(关键)

> 这是 spec.md §3.4 + §ⅩⅩⅩⅦ 实测的"乐观双写"模式。本架构精简为 4 条规则:

```
┌─────────────────────────────────────────────────────────────┐
│  规则 1 · 写时:LS 先写(乐观) → 触发 mutation → 失败回滚 LS  │
└─────────────────────────────────────────────────────────────┘
   useStepData.save(stepKey, data) {
     1. localStorage.setItem(`aiip_memory_acc_${accId}_${stepKey}`, JSON.stringify(data))
     2. trpc.stepData.save.mutate({ stepKey, data })
     3. onError: 回滚 LS · toast 提示「同步失败」· 重试
   }

┌─────────────────────────────────────────────────────────────┐
│  规则 2 · 读时:LS 优先(快) → 后台 invalidate → 差异 reconcile  │
└─────────────────────────────────────────────────────────────┘
   useStepData.get(stepKey) {
     1. 同步返回 localStorage 值(立即渲染)
     2. 后台 trpc.stepData.get.query 拉 DB
     3. 若 DB 比 LS 新 → 更新 LS + 软提示用户
   }

┌─────────────────────────────────────────────────────────────┐
│  规则 3 · 切账号:reload 整页 + 预热活跃账号缓存                │
└─────────────────────────────────────────────────────────────┘
   ipAccounts.switchActive 后:
     1. localStorage.setItem('aiip_active_account_id', newId)
     2. 调 stepData.getAll(newId) 预热(并行 9 步)
     3. window.location.reload()
     ↳ 原版 aiipznt 实测有 reload(spec.md §3.1)
     ↳ 本架构升级 · reload 前先预热,体验更顺

┌─────────────────────────────────────────────────────────────┐
│  规则 4 · 服务端为主的 7 个实体 · 不入 LS                      │
└─────────────────────────────────────────────────────────────┘
   DiagnosisReport / EvolutionProfile / EvolutionInsight /
   FeedbackLog / DeepLearningArchive / KnowledgeFavorite / TrendingItem
   ↳ 这些数据量大或需要跨设备一致 · 直接走 DB · LS 不缓存
```

### §3.5 9 步 Step Schema 摘要(基于 schemas-summary.md 实测)

> 详细字段见 [`aiipznt-clone-research/schema/schemas-summary.md`](../aiipznt-clone-research/schema/schemas-summary.md)。本架构只列**契约层**(每个 step 输入字段 + 输出顶层结构):

| Step | 输入字段(`last*`) | 输出顶层结构 | 大小 | 备注 |
|:-:|---|---|:-:|---|
| 1 | `lastIndustry` | `{industry, marketAnalysis, recommendation}` | ~1KB | 简单 |
| 3 | `lastPlatform` `lastPersonalInfo` `lastTargetAudience` `lastCurrentAccount` | `{nickname[5], avatar{...prompt}, background{...prompt+platformVersions[3]}, bio{6 平台版本}, overallStrategy{...platformPriority[3]}}` | 8KB | 含 prompt 字段供 ImageGen 用 |
| 3b | `lastPlatform` `lastPersonalInfo` `lastTargetAudience` `lastStrengths` `lastStory` | `{coreIdentity{title, slogan[3], memoryPoints[3], personalityTraits[3]}, thoughtSystem{coreBeliefs[3], uniqueViews[2], catchphrases[3]}, contentPersona{toneOfVoice, visualStyle, contentPillars[4]}, trustBuilding, personaRoadmap{phase1, phase2, phase3}}` | 6KB | 5 大子结构 |
| 4 | `lastPlatform` `lastFollowers` `lastPersonalInfo` `lastGoals` | `lastResult: string`(纯 markdown) | 16KB | ⚠️ 不结构化 · 难校验 |
| 4b | `lastProductDesc` `lastTargetAudience` `lastIpPositioning` `lastCurrentRevenue` | `{currentAnalysis, ladder[3 阶段], revenueStructure{primary, secondary[2]}, successCases[2]}` | 8KB | 阶梯式收入设计 |
| 5 | `lastIndustry` `lastProduct` `lastCategory` | `{traffic[20], monetize[20], persona[20], cognition[20], case[20]}`(每条 `{title, hook, structure, formula, viralPotential}`) | 22KB | 5 类 × 20 = 100 选题 |
| 6 | `lastSourceCopy` | `{shotList[N 镜], equipment, schedule}`(13 列分镜表) | 变 | ⚠️ **schema 推断 · sally 账号实测 lastResult=null 未跑** |
| 7 | `lastScriptType` `lastElements[]` `lastTopic` | `lastResult: string`(纯 markdown) | 1KB+ | ⚠️ 不结构化 · 但短 |
| 8 | `lastPlatform` `lastProductInfo` `lastTargetAudience` `lastExperience` | `{lastResult, lastOptimizedResult}` | 变 | ⚠️ **schema 推断 · sally 账号实测 lastResult=null 未跑** · 双产物(原 + 优化)结构来自 spec §Ⅶ.9 |

> **本架构的 schema 升级建议**:
> 1. **step4 / step7 强制结构化** · 当前实测是 markdown 字符串,改为 `{markdown, sections[], metadata}` 结构(zod 校验更可靠)
> 2. **每个 result 加版本字段** · `{version: '3.0', generatedAt, agentId, ...}` — 用于进化飞轮的版本溯源
> 3. **每条产出加 trace_id** · 串联 Agent 调用日志(11/02 八 Agent 同款做法)

### §3.6 RAG / 常量边界(谁入库、谁是常量)

> 这是数据架构最重要的判断之一:**不是所有数据都需要向量库**。常量级数据(几 KB)直接 in-memory,RAG 只在真有"语义检索需求"时启用。

#### A · 静态常量(不入向量库 · 几 KB · 直接 import)

| 常量 | 数量 | 用途 | 实现 |
|---|:-:|---|---|
| `PLATFORMS` | 5 | 5 大平台 emoji + label | `lib/constants/platforms.ts` |
| `INDUSTRIES` | 56(5 大类) | 行业枚举 | `lib/constants/industries.ts` |
| `HOT_ELEMENTS` | 22(4 组) | 爆款元素 | `lib/constants/hotElements.ts` |
| `SCRIPT_TYPES` | 20 | 脚本类型 + methodology(短描述) | `lib/constants/scriptTypes.ts` |
| `PRESENT_STYLES` | 14 | 呈现形式 | `lib/constants/presentStyles.ts` |
| `PRIVATE_DOMAIN_STAGES` | 6 | 私域 6 阶段 | `lib/constants/privateDomain.ts` |
| `STEPS` | 9 | 9 步映射 | `lib/constants/steps.ts` |
| `EVOLUTION_LEVELS` | 5 | L1-L5 阈值 | `lib/constants/evolution.ts` |
| `DIAGNOSIS_DIMENSIONS` | 8 | 8 维度自评项 | `lib/constants/diagnosis.ts` |
| **合计** | **~150 项** | **总大小 ~30KB** | **直接 bundle 进前端 + 后端 import** |

#### B · 向量库(真需要语义检索)

| 数据 | 数量级 | Namespace 策略 | 检索场景 |
|---|---|---|---|
| **67 实战案例** | ~67 | 全局 | CopywritingAgent 生成时 · 按 scriptType + industry 检索相似案例做 few-shot |
| **23 文案公式** | ~23 | 全局 | CopywritingAgent / BoomGenerator 引用公式 |
| **22 元素心理学详解** | ~22 | 全局 | CopywritingAgent 注入元素背后的心理机制 |
| **TrendingItem(全网爆款)** | 1k-10k 滚动 | 全局 + (industry, platform) tag | TopicAgent / TrendingScraper · 按行业 + 平台拉相似爆款 |
| **DeepLearningArchive(用户样本)** | per-user | `account_{id}` namespace | CopywritingAgent / DeepLearnAgent · 注入用户专属风格 |
| **History(用户历史)** | per-user | `account_{id}` namespace | `/my-topics` `/history` 模糊检索 |

#### C · 选型(不深入 ADR · 详见后续 ADR.md)

* 推荐 **`pgvector`(PostgreSQL 扩展)** — 原因:本架构 PG 已是主库,加 pgvector 比独立 Qdrant/Milvus 简单 3 倍(11/03 RAG 实战经验)
* 备选 **Qdrant** — 如果向量数据涨到 100k+ 量级再迁移

### §3.7 数据存储栈分配(全图)

```
┌──────────────────────────────────────────────────────────────────┐
│  PostgreSQL(主库 · 关系数据)                                  │
│   User · IpAccount · StepData · DiagnosisReport · FeedbackLog ·  │
│   EvolutionProfile · EvolutionInsight · DeepLearningArchive ·    │
│   History · KnowledgeFavorite · KnowledgeNote · InviteCode       │
├──────────────────────────────────────────────────────────────────┤
│  PostgreSQL + pgvector(向量库 · 复用主库)                       │
│   knowledge_cases_vec(67) · formulas_vec(23) ·                   │
│   elements_vec(22) · trending_vec(滚动) ·                        │
│   user_samples_vec(per-account) · user_history_vec(可选)        │
├──────────────────────────────────────────────────────────────────┤
│  Redis                                                           │
│   · session(JWT 黑名单 + 短期会话)                              │
│   · rate-limit(token bucket · 每用户 N/min LLM 调用)            │
│   · trending hot cache(L5 · 行业 → 爆款 · TTL 1h)               │
│   · evolution profile hot cache(account → insights · TTL 5min)  │
├──────────────────────────────────────────────────────────────────┤
│  S3 / 阿里 OSS                                                   │
│   · 用户上传文件(PDF/Word/CSV/MD · ≤20MB)                      │
│   · AI 生成图片(头像参考图 / 背景图 / 分镜场景图)              │
│   · 语音对话录音(可选 · 语音回放)                              │
├──────────────────────────────────────────────────────────────────┤
│  浏览器 LocalStorage(双写镜像 · 18 keys)                       │
│   · `aiip_memory_acc_{id}_*`(stepData 镜像)                     │
│   · `aiip_active_account_id`(当前活跃账号)                      │
│  浏览器 SessionStorage                                           │
│   · `pendingInviteCode`(登录前邀请码)                           │
└──────────────────────────────────────────────────────────────────┘
```

### §3.8 多账号数据隔离约束(关键安全边界)

> 这是数据架构的**铁律**,违反会出严重 bug(其他账号看到我的数据)。

```
账号隔离的 3 道闸:
─────────────────────────────────────────────────────────
①  路由层(tRPC middleware)
   每个 procedure 都注入 ctx.activeAccountId
   操作前 assert(ctx.user.accounts.includes(activeAccountId))

②  存储层(SQL 强制 WHERE)
   90% 表都有 account_id 字段
   ORM 层注入 `WHERE account_id = ${ctx.activeAccountId}` 强制
   类似 Postgres RLS(Row-Level Security · 11/02 案例同款)

③  缓存层(命名空间)
   Redis key 必须带 acc_{id} 前缀
   LS key 必须带 acc_{id} 前缀
   pgvector namespace 按 account_{id} 分区
─────────────────────────────────────────────────────────
```

**特殊情况**:
- **进化档案是「账号级」**(不是「用户级」) · 同一用户的不同账号有不同进化方向(企业号 vs 个人号)。这是产品决策,详见 §5.6
- **DeepLearningArchive 是「账号级」** · 上传的样本只对当前账号生效,切账号要切样本库
- **TrendingItem / KnowledgeFavorite 全局共享** — 不带 account_id

### §3.9 数据架构小结

本章答 5 件事:
1. **领域有 15 个核心实体**(其中 12 个按 `account_id` 隔离 + 3 个全局/独立 · IpAccount 是聚合根)(§3.1)
2. **13 + 2 = 15 个 tRPC 路由组**(13 核心 + trending + invite),每组职责清晰对应 1-2 个 Specialist 或纯 CRUD(§3.2)
3. **LS↔DB 双写**遵循 4 条规则(乐观写 + LS 优先读 + 切账号 reload+预热 + 7 个实体服务端为主)(§3.4)
4. **9 步 Schema** 已实测,本架构在原版基础上加版本字段 + trace_id(§3.5)
5. **RAG 边界明确**:150 项常量(30KB)直接 import + 6 类向量数据走 pgvector(§3.6)

下一章(§4)进入 Agent 编排架构,讲清楚 Workflow 与 Agent 怎么二分、14 个 Specialist 怎么切、2 个 Heartbeat 怎么自治。

---

## §4 Agent 编排架构

> **本节是本架构的核心**。前 3 节是"产品/数据"的描述,本节开始才是真正的"Agent 工程哲学"应用。
> 理论基础 · [`reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md`](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md)
> 编排参考 · [`08-tech-decisions/架构决策记录(ADR).md` ADR-007 三层编排](../Ai_Agent/knowledge-base/08-tech-decisions/) + [ADR-018 外部 orchestrator](../Ai_Agent/knowledge-base/08-tech-decisions/)
> 实战参考 · [`11-implementation-case/02-八Agent配置与Pipeline编排.md`](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md)(五层配置 + 状态机模式)

### §4.1 编排范式 · Workflow + Agent 二分应用

> **第一性问题**:这个产品的每个节点,LLM 应该"自主决定下一步"还是"按代码路径执行"?
> 答案 · **95% 节点是 Workflow,只有 3 个节点是 Agent**。

#### A · Anthropic 官方二分法回顾(reference/PI/03)

| 范式 | 特征 | 触发方式 |
|---|---|---|
| **Workflow** | 预定义代码路径 · 步骤显式 · 失败可重试 | **用户主动**(点按钮 / 提交表单) |
| **Agent** | LLM 动态决策 · 多轮交互 · 自主选下一步 | **系统主动**(多轮对话 / Heartbeat / 事件触发) |

#### B · 本项目所有节点的二分判断

```
┌─────────────────────────────────────────────────────────┐
│           节点 = Workflow(95% · 用户主动)             │
├─────────────────────────────────────────────────────────┤
│  9 步主向导(Step 1/3/3b/4/4b/5/6/7/8)                │
│    ↳ 用户填表 → 点"生成" → 调 1 个 Specialist → 渲染   │
│  14 工具页(/generate, /trending, /private-domain ...) │
│    ↳ 同上                                               │
│  8 步诊断(/diagnosis)                                  │
│    ↳ 用户走 8 步表单 → 一次性调 DiagnosisAgent          │
│  反馈系统(👍/👎)                                       │
│    ↳ 用户点 → 写 feedback_log                           │
│                                                         │
│  共同特征 · 用户每次只点 1 次 · LLM 调 1 次 · 渲染 1 次 │
│            没有"LLM 自主决定下一步"的语义                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           节点 = Agent(5% · 系统/LLM 主动)            │
├─────────────────────────────────────────────────────────┤
│  ① VoiceChatAgent(/voice-chat · 多轮)                  │
│    ↳ 用户说一句 · LLM 回 · 持续直到用户挂断             │
│    ↳ 每轮 LLM 都决定:回答?反问?切话题?调 tool?       │
│  ② EvolutionAgent(/evolution · Heartbeat 或手动触发)  │
│    ↳ 累计反馈 N+ 触发 · LLM 自主决定生成什么 insights   │
│    ↳ insights 内容、风格、数量都由 LLM 决定             │
│  ③ DailyTaskAgent(/daily-tasks · 每日 0 点 Heartbeat) │
│    ↳ 系统主动跑批 · LLM 自主决定今日 3-5 任务           │
│    ↳ 任务选择基于当前账号状态 · 不是模板填空            │
│                                                         │
│  共同特征 · 没有"用户填表 + 点生成"的明确入口           │
│            LLM 必须自主决定循环何时结束 / 内容是什么    │
└─────────────────────────────────────────────────────────┘
```

#### C · 这个判断为什么重要(直接影响实现复杂度)

| 维度 | Workflow 节点 | Agent 节点 |
|---|---|---|
| 实现复杂度 | 低 · 一次 LLM 调用 + zod 校验 | 高 · 多轮 / 状态机 / 工具循环 |
| 失败恢复 | 简单 · 重试一次 | 复杂 · 续命循环(ADR-018) |
| Token 成本 | 可控 · 单次调用 | 不可控 · 多轮累积 |
| 测试难度 | 低 · 输入→输出快照对比 | 高 · 行为序列验证 |
| 用户体验 | 即时(loading 后出结果) | 流式 / 异步 |

> **这就是为什么我们不把每个 Step 设计成 Agent**(虽然 LangGraph 等框架鼓励这么做)— 9 步向导本质是**用户驱动**的,不需要 LLM 决策"下一步是什么"。
> 只在 3 个真有"系统/LLM 主动"语义的节点才用 Agent 模式。

### §4.2 三层编排架构(对应 ADR-007)

> 在 §1.4 的 9 层架构里,L4-L7 是编排层。本节展开:

```
┌────────────────────────────────────────────────────────────────┐
│  L4 · Workflow Command 层(确定性流程入口 · 用户主动)         │
│  ─────────────────────────────────────────                    │
│  · StepCommand × 9(9 步向导)                                  │
│  · ToolCommand × 14(14 工具)                                  │
│  · DiagnosisCommand(8 步问卷向导)                            │
│  · FeedbackCommand(👍/👎 写日志)                              │
│  ─────────────────────────────────────────                    │
│  特点 · 无 LLM · 路由 + 表单 + 调 1 次 Specialist             │
│  实现 · tRPC procedure + React 表单                           │
└──────┬─────────────────────────────────────────────────────────┘
       │ 调用
       ▼
┌────────────────────────────────────────────────────────────────┐
│  L5 · Agent 自治层(LLM 决策密集 · 系统主动)                  │
│  ─────────────────────────────────────────                    │
│  · VoiceChatAgent(多轮 · 用户驱动循环)                       │
│  · EvolutionAgent(Heartbeat · 反馈聚合)                      │
│  · DailyTaskAgent(Heartbeat · 任务生成)                      │
│  ─────────────────────────────────────────                    │
│  特点 · LLM 主导 · 自主决定何时结束 / 调什么 tool             │
│  实现 · 状态机 + 工具循环 + 持久化(参 ADR-018)               │
└──────┬─────────────────────────────────────────────────────────┘
       │ 调用 + 协作
       ▼
┌────────────────────────────────────────────────────────────────┐
│  L6 · Specialist 能力层(14 个能力域 Agent · 单次调用为主)    │
│  ─────────────────────────────────────────                    │
│  · 11 个生成型(Positioning/Branding/Monetization/Topic/      │
│    Copywriting/Video/Livestream/PrivateDomain/Analysis/       │
│    Diagnosis/DeepLearn)                                       │
│  · 3 个自治型(VoiceChat/Evolution/DailyTask)从 L5 复用       │
│  ─────────────────────────────────────────                    │
│  特点 · 单次 LLM 调用 · 输入→输出 · 无多轮循环                │
│  共享 · 多个 Workflow Command 共用同一个 Specialist           │
│  实现 · BaseAgent 模板方法(参 11/02)+ 五层配置(§4.7)        │
└──────┬─────────────────────────────────────────────────────────┘
       │ 调用
       ▼
┌────────────────────────────────────────────────────────────────┐
│  L7 · Deterministic Worker 层(无 LLM · 纯工具)               │
│  ─────────────────────────────────────────                    │
│  LLMGateway · ImageGen · FileParser · STT · TTS ·             │
│  TrendingScraper · MethodologyQuery · LSSyncWorker            │
│  ─────────────────────────────────────────                    │
│  特点 · 0 LLM · 高确定性 · 易测试                             │
│  实现 · 普通函数 / Service · 不算 Agent                       │
└────────────────────────────────────────────────────────────────┘
```

### §4.3 14 个 Specialist 的"能力域"切分(关键决策)

> **切分原则**:**按"能力域"而不是按"页面"** — 这是本架构跟 11/02 八 Agent 案例最大的差别(详见 §7.1 对照)。

#### A · 14 Specialist 完整画像

| # | Specialist ID | LLM Tier | 服务页面 | 输入 | 输出 | 模式分支 |
|:-:|---|:-:|---|---|---|---|
| 1 | **PositioningAgent** | reasoning | `/step/1` `/step/4` | industry, personalInfo, followers, goals | (mode=industry) `{recommendation, marketAnalysis}` / (mode=execution) markdown | `industry` `execution` |
| 2 | **BrandingAgent** | reasoning | `/step/3` `/step/3b` | platform, personalInfo, targetAudience, (strengths, story) | (packaging) `{nickname[], avatar, background, bio[6], overallStrategy}` / (persona) `{coreIdentity, thoughtSystem, contentPersona, trustBuilding, personaRoadmap}` | `packaging` `persona` |
| 3 | **MonetizationAgent** | reasoning | `/step/4b` `/monetization` | productDesc, targetAudience, ipPositioning, currentRevenue | `{currentAnalysis, ladder[3], revenueStructure, successCases[2]}` | (单模式) |
| 4 | **TopicAgent** | reasoning | `/step/5` `/trending`(部分)`/my-topics` | industry, product, category | `{[category]: 20 选题 × {title, hook, structure, formula, viralPotential}}` | `category=traffic/monetize/persona/cognition/case` |
| 5 | **CopywritingAgent** | reasoning | `/step/7` `/generate` `/boom-generate` `/acquisition-video`(文案部分) | scriptType, elements[], topic, (boomFlavor, acquisitionGoal) | markdown 文案 + `{structure, hooks[], cta}` | `step7` `free` `boom` `acquisition` |
| 6 | **VideoAgent** | reasoning | `/step/6` `/video-production` `/acquisition-video` `/ai-video` | sourceCopy, (videoType, duration) | (shooting) 13 列分镜 / (production) 完整方案 / (storyboard) 分镜 + sceneImage prompt | `shooting` `production` `acquisition` `storyboard` |
| 7 | **LivestreamAgent** | reasoning | `/step/8` | platform, productInfo, targetAudience, experience | `{lastResult, lastOptimizedResult}` | (单模式) |
| 8 | **PrivateDomainAgent** | reasoning | `/private-domain` | stage, product, targetUser, scenario | `{stage, scripts[]}` | `stage=welcome/icebreak/trust/discover/close/follow` |
| 9 | **AnalysisAgent** | lightweight | `/video-analysis` `/analysis` | copy, (title, mode) | `{structure, scoreByDimension, optimizations[]}` | `viral`(/video-analysis) `structural`(/analysis) |
| 10 | **DiagnosisAgent** | reasoning | `/diagnosis` | 8 步问卷 answers | `{dimensions[7]: {score, issues, suggestions}, overallScore, priority}` | (单模式 · 一次性调用) |
| 11 | **DeepLearnAgent** | lightweight | `/deep-learning` | sample(text or file) | `{styleVector, tags, summary}` → 写入用户 sample 库 + Profile 风格特征 | (单模式 · 写记忆为主) |
| 12 | **VoiceChatAgent** ★L5 | reasoning + tools | `/voice-chat` | 流式音频(STT 后)+ 历史 | 流式回复(TTS 输出) | (多轮 · 工具:查询当前账号 9 步状态) |
| 13 | **EvolutionAgent** ★L5 | reasoning | `/evolution`(手动) + 后台(Heartbeat) | 全部 feedback_log + DeepLearning samples + 历史 insights | `{insights[], styleAdjustments, avoidList[]}` | `manual` `auto` |
| 14 | **DailyTaskAgent** ★L5 | lightweight | `/daily-tasks` + 后台(0 点 Heartbeat) | 当前账号 9 步 progress + 最近 history + diagnosis latest | `{tasks[3-5]: {title, type, ctaUrl, expectedOutcome}}` | (单模式 · 每日跑) |

> ★L5 = 自治型(§4.1 B 中的 3 个 Agent)
> reasoning = Claude Sonnet 4.6 / GPT-4o(主推理)
> lightweight = Haiku 4.5 / GPT-4o-mini(成本敏感)

#### B · 切分判断的 5 个原则

| # | 原则 | 应用 |
|:-:|---|---|
| 1 | **不按 URL 一对一**(否则 23+ 个 Agent · 维护爆炸) | step3+step3b 共用 BrandingAgent |
| 2 | **按"输出物相似性"归并** | step7 / generate / boom / acquisition 都生成文案 → CopywritingAgent |
| 3 | **按"输入字段相似性"归并** | step1 / step4 共用 industry+personalInfo → PositioningAgent |
| 4 | **生成型 vs 分析型 vs 写记忆型 分开** | DeepLearn 不生成 · 只写记忆 · 独立 |
| 5 | **L5 自治型独立**(行为模式不同) | VoiceChat / Evolution / DailyTask 独立 |

### §4.4 3 个 L5 自治 Agent 的特殊性

> 这 3 个 Agent 跟其他 11 个不一样。它们的"运行模式"是 **多轮 / Heartbeat 触发 / 工具循环**,需要 ADR-018 外部 orchestrator 模式。

#### A · VoiceChatAgent(多轮对话 · 用户驱动循环)

```
用户开口 → STT Worker → 文本片段 → VoiceChatAgent
                                       │
                                       ├── 调 tool · stepData.get(读当前账号 9 步状态)
                                       ├── 调 tool · history.search(查历史)
                                       └── 流式生成回复
                                              │
                                              ▼
                                         TTS Worker
                                              │
                                              ▼
                                         浏览器播放
                                              │
                                              ▼
                                         用户下一句 → 循环
```

* 状态:对话上下文驻留 Redis · 5 分钟无声音自动结束
* 工具(5 个):`get_current_step` · `search_history` · `query_diagnosis` · `get_today_tasks` · `get_evolution_insights`
* 实现参考:[`11-implementation-case/02-八Agent配置与Pipeline编排.md` 第 6 章状态机](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md)

#### B · EvolutionAgent(Heartbeat 或手动触发 · 反馈聚合)

```
触发条件 ·
  ① 用户在 /evolution 点"触发进化"
  ② Cron Heartbeat:累计反馈 ≥ 阈值(L2: 5, L3: 20, L4: 50, L5: 100)
  ③ 用户在 /deep-learning 上传新样本时(可选触发)

EvolutionAgent 跑批 ·
  1. 拉 feedback_log(最近 N 条 · 按账号)
  2. 拉 DeepLearningArchive(全部样本 · 按账号)
  3. 拉历史 EvolutionInsight(看上次进化方向)
  4. LLM 自主聚合 → 生成 insights · styleAdjustments · avoidList
  5. 写入 EvolutionProfile(最新)+ EvolutionInsight(历史快照)
  6. 触发 toast 通知用户「智能体已进化到 Lx」

注入路径 · ContextAssembler 在下次 Specialist 调用前读 EvolutionProfile · 注入 system prompt
```

* 这是 [ADR-018 外部 orchestrator](../Ai_Agent/knowledge-base/08-tech-decisions/) 的典型应用 — Cron 是外部 orchestrator,LLM 不会自己跑

#### C · DailyTaskAgent(每日 0 点 Heartbeat)

```
0:00 跑批(per-account) ·
  1. 拉当前账号 stepData.progress(9 步完成度)
  2. 拉最近 history(7 天)+ latest diagnosis
  3. 读 EvolutionProfile(用户偏好)
  4. LLM 自主决定 → 3-5 个今日任务 · {title, type, ctaUrl}
  5. 写入 DailyTask 表(per-account · per-day)

用户访问 /daily-tasks ·
  - 读今日任务列表
  - 完成打卡 → 累计经验值 → 影响 EvolutionAgent 下次进化
```

> ⚠️ **冷启动**:新注册用户 progress=0 · diagnosis 无 · 此时 DailyTaskAgent 退化为模板任务(去做 step1)

#### D · 冷启动场景全集(新用户首次使用时各 Agent 怎么工作)

> 新注册用户的初始状态 · `level=L1` · `feedbackCount=0` · `diagnosis=null` · `history=[]` · `stepData=空` · `DeepLearningArchive=[]`。
> 这种"四空"状态下 · ContextAssembler 拼 prompt 时各段都缺。**每个 Specialist 必须能优雅降级**。

| 场景 | 缺失数据 | ContextAssembler 处理 | Specialist 行为 |
|---|---|---|---|
| **CS-1 · 第一次 step1** | 全空 | "用户偏好"段 · 注入「(新用户 · 暂无偏好 · 请基于行业经验给最优实践)」 | PositioningAgent 走通用 prompt · 不用进化档案 |
| **CS-2 · L1 阶段反复用 CopywritingAgent** | feedback < 5 · EvolutionProfile 为空 | "用户偏好"段 · 注入「(新用户阶段 · 鼓励多反馈解锁进化)」 | CopywritingAgent 走基础 prompt · 输出后 toast 提示「点 👍/👎 让 AI 越来越懂你」 |
| **CS-3 · 第一次进 /diagnosis(无 stepData)** | stepData=空 | 跳过"历史 step"段 | DiagnosisAgent 仅基于 8 步问卷答复诊断 · 不引用 step result |
| **CS-4 · 第一次进 /daily-tasks** | progress=0 + diagnosis=null | 模板任务模式 | DailyTaskAgent 返回固定 3 任务 · `["完成 IP 诊断", "做 step1 选行业", "做 step3 包装账号"]` |
| **CS-5 · 第一次开 /voice-chat** | L1 Buffer=空 | 仅注入"账号基础"+ 问候模板 | VoiceChatAgent 走"自我介绍 + 引导"开场 · 不假装认识用户 |
| **CS-6 · 已有反馈但 EvolutionAgent 还没跑完** | feedbackCount=5 但 latestInsight=null | 降级用空 insights · 标 `evolution_pending=true` | Specialist 走基础 prompt · 不阻断用户 |

**统一原则**:**任何 Agent 在数据不全时必须"安全降级",不报错给用户**。降级路径在每个 Specialist config 里显式声明:

```typescript
specialistConfig.fallback = {
  on_missing: 'evolution_profile' | 'step_data' | 'diagnosis',
  strategy: 'use_template' | 'skip_section' | 'use_industry_default'
}
```

### §4.5 Deterministic Worker 层(8 个无 LLM 工具)

> 这一层不算 Agent,但它们是**所有 Agent 的"手脚"**。每个 Worker 都是确定性服务(无 LLM),易测试易缓存。

| Worker | 职责 | 调用者 | 实现要点 |
|---|---|---|---|
| **LLMGateway** | 统一 LLM 调用入口 · 限流 / 熔断 / 降级 / 计费 / Trace | 14 个 Specialist | 参 11/05 工具系统与 LLM 网关 |
| **ImageGenWorker** | DALL-E 3 / 文心一格 调用 | BrandingAgent / VideoAgent | 异步队列 · 头像 prompt 短缓存 |
| **FileParserWorker** | PDF/Word/CSV/MD/TXT 解析 | DeepLearnAgent | 异步 + 大文件分块 |
| **STTWorker** | Whisper 语音转文字 | VoiceChatAgent | 流式 |
| **TTSWorker** | 文字转语音 | VoiceChatAgent | 流式 + 多音色 |
| **TrendingScraper** | 5 平台爆款抓取 | 后台 Cron · TopicAgent | 抓取 + 入向量库 |
| **MethodologyQuery** | 56/22/20/14/6 常量查询 | 全部 Specialist | in-memory 查表 · 无网络 |
| **LSSyncWorker** | LS↔DB 双写一致性 | 客户端 hook | 详见 §3.4 |

> 注意 · **LLMGateway 不是 Agent · 是基础设施**。所有 Specialist 通过它调 LLM,统一管控成本和稳定性。

### §4.6 软 Supervisor(2 个确定性服务 · 编排中枢)

> 这 2 个不是 Agent(无 LLM),但它们是**编排层的中枢神经**。每次 Specialist 调用前都要它们配合。

#### A · IPProgressService(跟踪 9 步进度)

```
职责 ·
  - 算当前账号 9 步完成度(N/9 · 百分比)
  - 提供"下一步推荐"(第一个未完成的 step)
  - 服务于 /ip-plan 页面 · /daily-tasks · /evolution

实现 · 纯算法
  function progress(accountId) {
    const all = await stepData.getAll(accountId);
    const completed = all.filter(s => s.status === 'completed' && s.result !== null);
    return {
      completed: completed.length,
      total: 9,
      percentage: (completed.length / 9) * 100,
      nextStep: STEPS.find(s => !completed.find(c => c.stepKey === s.key))
    };
  }
```

#### B · ContextAssembler(调用前组装上下文 · 隐形枢纽)

```
职责 · 在每个 Specialist 调用前 · 组装 system prompt 上下文

输入参数 · {agentId, accountId, runtimeInputs}

组装步骤 ·
  1. 读 IpAccount 基础信息(industry/platform/positioning)
  2. 读 stepData.getAll(以前所有 step 的 result · 给 prompt 当 few-shot)
  3. 读 EvolutionProfile(进化档案 · 注入"用户偏好金句 / 风格 / 避忌")
  4. 读 DiagnosisReport(latest · 给 Specialist 知道用户的 7 维度短板)
  5. 读 DeepLearningArchive(top-K 相似样本 · 仅 CopywritingAgent 等需要风格的)
  6. 拉常量(MethodologyQueryWorker · 22 元素心理学 / 67 案例)
  7. 拉向量库(若 Specialist 需要 RAG · 走 pgvector · 详见 §3.6)

输出 · {systemPrompt, userPrompt, tools[]}
       传给 Specialist · Specialist 不需要再去拉这些
```

> ContextAssembler 是本架构的**最重要的隐形组件**。它实现了 [`reference-materials/PI-Agent设计哲学/13-Harness工程深度与5大模式.md`](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/13-Harness工程深度与5大模式.md) §模式 1 「Context 投影」— 把所有上下文聚合到 prompt 边界,让 Specialist 实现纯净。

### §4.7 Specialist 五层配置体系(借用 11/02 模板)

> 借鉴 [`11-implementation-case/02-八Agent配置与Pipeline编排.md` §4 五层配置](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md)。每个 Specialist 都用统一配置体系,易于维护和扩展。

```typescript
interface SpecialistConfig {
  // 1. Persona · 角色 + 边界
  persona: {
    role: string;          // "短视频选题猎手"
    goal: string;          // "为 IP 账号生成 100 条按 5 类分类的爆款选题"
    boundaries: string[];  // ["不编造数据", "不抄袭", "符合平台调性"]
  };

  // 2. Memory · 哪些层级可读写
  memory: {
    l1_readonly: ('account' | 'currentStep')[];      // 只读 · 当前会话
    l2_read: ('stepData' | 'evolution' | 'diagnosis')[];  // 读 Core Memory
    l2_write: ('stepData' | 'history')[];            // 写 Core Memory
  };

  // 3. Knowledge · 常量源 + RAG namespace
  knowledge: {
    constants: ('industries' | 'hotElements' | 'scriptTypes')[];
    rag: ('knowledge_cases' | 'formulas' | 'user_samples')[];
    refresh_interval_sec: number;  // 缓存刷新
  };

  // 4. Tools · 可用工具白名单
  tools: ('llm.complete' | 'llm.stream' | 'image.generate' | 'file.parse')[];

  // 5. Execution · 执行参数
  execution: {
    timeout_ms: number;        // 30000 / 60000 / 120000
    retry: number;             // 1 / 2
    model_tier: 'reasoning' | 'lightweight';
    streaming: boolean;        // 是否走 SSE
    parallel_group?: string;   // 用于并行调度(参 11/02 §5)
  };
}
```

**TopicAgent 配置示例**:

```typescript
const TopicAgentConfig: SpecialistConfig = {
  persona: {
    role: "短视频选题猎手",
    goal: "按 5 大类生成 20 条精准选题",
    boundaries: ["不编造爆款数据", "符合用户行业调性"]
  },
  memory: {
    l1_readonly: ['account', 'currentStep'],
    l2_read: ['stepData'],   // 读 step1+step3b(industry+persona)
    l2_write: ['stepData']   // 写 step5_topics_v2
  },
  knowledge: {
    constants: ['industries', 'hotElements', 'scriptTypes'],
    rag: ['knowledge_cases', 'trending'],  // 拉 67 案例 + trending 相似爆款
    refresh_interval_sec: 600
  },
  tools: ['llm.stream'],
  execution: {
    timeout_ms: 60000,
    retry: 1,
    model_tier: 'reasoning',
    streaming: true,
    parallel_group: 'topic_generation'
  }
};
```

### §4.8 Agent 拓扑全图(本节收口)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户(浏览器)                              │
└────────────────────────┬─────────────────┬──────────────────────────┘
                         │ 9 步/14 工具     │ 反馈
                         ▼                 ▼
        ┌────────────────────────────────────────────────┐
        │  L4 · Workflow Command(tRPC procedure)        │
        │   StepCmd ×9 · ToolCmd ×14 · DiagnosisCmd     │
        └─────────┬─────────────────────┬────────────────┘
                  │ 调用                 │ 写日志
                  ▼                     ▼
       ┌─────────────────────┐   ┌──────────────────┐
       │ ContextAssembler    │   │  feedback_log    │
       │ (软 Supervisor)     │   └────────┬─────────┘
       │ · stepData          │            │ 累计
       │ · EvolutionProfile  │            ▼
       │ · DiagnosisLatest   │   ┌──────────────────┐
       │ · 常量 + RAG         │   │ Cron Heartbeat  │
       └─────────┬───────────┘   └────────┬─────────┘
                 │ 完整 prompt              │ 触发
                 ▼                         ▼
   ┌──────────────────────────────────────────────────┐
   │         L6 · Specialist(14)+ L5 自治(3)        │
   │  ┌─────────────────────────────────────────────┐ │
   │  │ 11 生成型(Workflow 调)                     │ │
   │  │  Positioning Branding Monetization Topic    │ │
   │  │  Copywriting Video Livestream PrivateDomain │ │
   │  │  Analysis Diagnosis DeepLearn               │ │
   │  └─────────────────────────────────────────────┘ │
   │  ┌─────────────────────────────────────────────┐ │
   │  │ 3 自治型(L5)                                │ │
   │  │  VoiceChat(用户多轮)                       │ │
   │  │  Evolution(Cron+手动)                      │ │
   │  │  DailyTask(0 点 Cron)                      │ │
   │  └─────────────────────────────────────────────┘ │
   └──────────┬───────────────────────────────────────┘
              │ 调用
              ▼
   ┌──────────────────────────────────────────────────┐
   │  L7 · Deterministic Worker(8)                   │
   │   LLMGateway · ImageGen · FileParser · STT/TTS · │
   │   TrendingScraper · MethodologyQuery · LSSync   │
   └──────────────────────────────────────────────────┘

   软 Supervisor · IPProgressService(跟踪 9 步进度)
```

### §4.9 Agent 编排架构小结

本章答 6 件事:
1. **范式选择**:95% Workflow + 5% Agent · 其中 3 个 L5 自治 Agent(VoiceChat/Evolution/DailyTask)(§4.1)
2. **三层编排**:L4 Workflow Command · L5 Agent 自治 · L6 Specialist · L7 Worker — 对应 ADR-007(§4.2)
3. **14 Specialist 切分**:按"能力域"不按"页面" · 5 个切分原则(§4.3)
4. **Heartbeat 模式**:EvolutionAgent + DailyTaskAgent 用 ADR-018 外部 orchestrator(§4.4)
5. **软 Supervisor**:IPProgressService 跟进度 · ContextAssembler 组装 prompt(§4.6)
6. **五层配置**:统一模板 · 借用 11/02 八 Agent 案例(§4.7)

下一章(§5)进入记忆系统 + 进化飞轮,讲清楚 5 层记忆的具体映射 + EvolutionAgent 的完整数据流。

---

## §5 记忆系统 + 进化飞轮

> 本节是产品**最有创意的设计**。前 4 节回答"产品/数据/编排"三个静态问题,本节回答"用得越多越懂你"是怎么实现的动态问题。
> 理论基础 · [`11-implementation-case/04-五层记忆系统实现.md`](../Ai_Agent/knowledge-base/11-implementation-case/04-五层记忆系统实现.md) + [`reference-materials/Agent记忆系统设计.md`](../Ai_Agent/knowledge-base/reference-materials/Agent记忆系统设计.md)
> 飞轮范式 · [`reference-materials/AI-Agent的两种记忆范式-内部分层vs外部Issue飞轮.md`](../Ai_Agent/knowledge-base/reference-materials/AI-Agent的两种记忆范式-内部分层vs外部Issue飞轮.md) — 本架构选「内部分层 + Issue 飞轮」混合
> 续命模式 · [`08-tech-decisions/架构决策记录(ADR).md` ADR-018 外部 Orchestrator](../Ai_Agent/knowledge-base/08-tech-decisions/)

### §5.1 五层记忆体系(借用 11/04 + 项目特化)

> 11/04 案例的五层是 Buffer / Core / Recall / Summarizer / Portrait。本项目按业务特点做了一处替换:**用 Trending Cache 替换 Summarizer**(理由见下表 ⚠️)。

| 层 | 名称 | 11/04 原意 | **本项目映射** | 存储介质 | 隔离粒度 |
|:-:|---|---|---|---|---|
| **L1** | Buffer | 最近对话窗口 | 当前会话上下文(主要给 VoiceChat) | Redis(TTL 30min) | account |
| **L2** | Core Memory | 用户关键信息(可 CRUD) | **9 步 stepData**(每个账号的核心档案) | Postgres + LS 双写 | account |
| **L3** | Recall Memory | 全量对话历史(可检索) | **History 表**(所有生成历史 · 文案/视频/选题) | Postgres + pgvector(可选) | account |
| **L4** | ~~Summarizer~~ → **Profile** | 11/04 是定时摘要 | **EvolutionProfile + DeepLearningArchive** · 用户画像 + 风格样本 | Postgres + Redis 热缓存 | account |
| **L5** | ~~Portrait~~ → **Trending Cache** | 11/04 是用户画像 | **全网爆款滚动缓存** · 跨用户共享(节省抓取) | Redis + pgvector | **全局** |

> ⚠️ **替换理由**:
> 1. 11/04 的"Summarizer"在本项目里**用不上** — 9 步 stepData 是结构化数据,不需要 LLM 摘要(直接读 result 字段)。
> 2. 11/04 的"Portrait" = 用户画像 · 本项目把这个职责**升级到 L4** 由 EvolutionProfile 承担(因为有反馈飞轮)。
> 3. **L5 留给 Trending** · 因为爆款数据是全局资源(几千条),其他用户也用,不属于个人记忆但需要快速检索 → 放在最外层最合适。

### §5.2 五层记忆详细映射表

#### L1 · Buffer(对话短期记忆)

```
角色 · 给 VoiceChatAgent 留"刚才说过的话"
存储 · Redis Key: voice_chat:acc_{id}:turns(List 类型 · 最多 20 条)
TTL · 30 分钟无消息自动清空
写入 · 每轮对话 push 用户输入 + Agent 回复
读取 · VoiceChatAgent 调用前 LRANGE 拉最近 N 条
```

> 仅 VoiceChatAgent 用 · 其他 Specialist 是单次调用 · 不需要 L1

#### L2 · Core Memory(账号核心档案 · 双写镜像)

```
角色 · 9 步 stepData 是账号的"灵魂" · 后续每次 Specialist 调用都依赖
存储 · Postgres `step_data` 表(account_id + step_key + result_json + version + updated_at)
镜像 · LocalStorage(`aiip_memory_acc_{id}_{stepKey}` · 18 keys 的核心 9 个)
写入 · Specialist 生成后 · 通过 useStepData.save 双写
读取 ·
  - 客户端 · LS 优先 + 后台 invalidate
  - 服务端 · ContextAssembler 拉 stepData.getAll(给后续 Specialist 当上下文)
```

> 本项目数据持久化的"主战场" · 详细 schema 见 §3.5

#### L3 · Recall Memory(全量历史 · 可检索)

```
角色 · 用户的所有生成历史 · 用于 /history /my-topics 检索 · 可注入 prompt 当 few-shot
存储 ·
  · Postgres `history` 表(关系数据)
  · pgvector(可选 · embedding 用户历史 · 给"找相似历史文案"用)
内容 ·
  · 文案历史(CopywritingAgent 写)
  · 视频方案历史(VideoAgent 写)
  · 选题收藏(TopicAgent / 用户主动收藏)
  · 私域话术历史(PrivateDomainAgent 写)
检索 ·
  · 时间倒序 · 类型筛选(/history)
  · 模糊搜索 · 标签筛选(/my-topics 5 类 tab)
  · 语义检索(可选 · 给 ContextAssembler "找相似历史"用)
```

#### L4 · Profile(用户画像 · 进化档案)

```
角色 · 把"用户用得越多 · 越懂你"具象化的载体 · 反馈飞轮的产物
组成 · 3 个子结构 ·
  ① EvolutionProfile(实时聚合状态 · 1 row per account)
     - level: L1-L5
     - feedbackCount: { good, bad }
     - satisfactionRate: 0-1
     - currentDirection: '综合' | '创意' | '转化' | '真实'
     - lastEvolvedAt: timestamp
  ② EvolutionInsight[](历史快照 · N rows per account)
     - generatedAt
     - direction
     - content: { preferredCatchphrases[], styleTone, avoidList[] }
     - sourceFeedbackIds: [number]  // 这次进化用了哪些反馈
  ③ DeepLearningArchive[](用户上传样本 · N rows per account)
     - sample: text(用户上传文案)
     - styleVector: vector(由 DeepLearnAgent 提炼)
     - tags: string[]
     - summary: string
存储 · Postgres + Redis 热缓存(每次 ContextAssembler 拉取频繁)
写入 · EvolutionAgent / DeepLearnAgent
读取 · ContextAssembler(每次 Specialist 调用前必读)
```

#### L5 · Trending Cache(全网爆款 · 全局共享)

```
角色 · 跨用户的"客观资源" · 不属于任何账号
存储 ·
  · Postgres `trending_item` 表(关系数据)
  · pgvector(embedding · 给 TopicAgent 找相似爆款)
  · Redis 热缓存(按 industry+platform 索引 · TTL 1h)
写入 · TrendingScraper Worker(后台 Cron · ⚠️ **本架构建议每 4 小时抓 5 平台 · 非原版实测频率**)
读取 · TopicAgent · /trending 页 · /step/5 选题生成
```

### §5.3 多账号隔离机制(铁律)

```
┌─────────────────────────────────────────────────────────┐
│  L1 / L2 / L3 / L4 都按 account_id 严格隔离             │
│  ─────────────────────────────────────                  │
│  · Postgres · 表都有 account_id 字段 · ORM 强制 WHERE   │
│  · Redis · key 必须带 acc_{id} 前缀                     │
│  · LocalStorage · key 模式 aiip_memory_acc_{id}_*       │
│  · pgvector · namespace 按 account_{id} 分区            │
│  ─────────────────────────────────────                  │
│  L5 Trending Cache · 全局 · 不带 account_id              │
└─────────────────────────────────────────────────────────┘
```

**进化档案的特殊性**(关键产品决策):

> EvolutionProfile 是「**账号级**」而不是「**用户级**」 — 同一用户的不同账号有不同进化方向。
>
> 例:sally zhao 同时有「企业号(严谨/B 端)」和「个人号(活泼/C 端)」 — 这两个账号的进化档案应该独立 · 否则 BrandingAgent 调企业号时被个人号的 catchphrase 污染。
>
> § 5.7 会讨论是否允许"L5 大师级账号克隆档案到新账号"。

### §5.4 反馈飞轮完整数据流(核心)

> 这是产品**最有创意的机制**。下面是完整的端到端数据流:

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1 · 生成 + 标记 trace_id                                 │
└─────────────────────────────────────────────────────────────────┘
   用户在某个 Workflow Command 触发(如 /step/7 文案生成)
       ↓
   ContextAssembler 组装 prompt
       ↓
   CopywritingAgent 调用 LLMGateway · 生成 markdown 文案
       ↓
   返回 { result, trace_id, agentId, model, tokens }
       ↓
   渲染 + 写入 history 表(含 trace_id)

┌─────────────────────────────────────────────────────────────────┐
│  Phase 2 · 用户反馈                                             │
└─────────────────────────────────────────────────────────────────┘
   用户看到结果 · 点 👍 或 👎 · (可选)填补充意见
       ↓
   FeedbackCommand · trpc.evolution.evolve.useMutation
       ↓
   写 feedback_log 表 ·
     { account_id, trace_id, agent_id, rating: 'good' | 'bad',
       comment?, created_at }
       ↓
   原子计数 · evolution_profile.feedbackCount.good++ 或 bad++
       ↓
   Toast 提示 · "感谢好评 · 智能体将持续进化"

┌─────────────────────────────────────────────────────────────────┐
│  Phase 3 · 阈值触发(自动 · 手动)                              │
└─────────────────────────────────────────────────────────────────┘
   每次写 feedback_log 后 · 检查触发条件:
     ① 累计反馈数 = 5/20/50/100 → 升级 L1→L2/L3/L4/L5
     ② 用户在 /evolution 主动点"触发进化"
     ③ Cron Heartbeat(每周 · 累计 ≥ 5 新反馈)
       ↓
   触发 · 调 EvolutionAgent

┌─────────────────────────────────────────────────────────────────┐
│  Phase 4 · EvolutionAgent 跑批                                  │
└─────────────────────────────────────────────────────────────────┘
   入参 · { account_id, trigger: 'level_up' | 'manual' | 'cron' }
       ↓
   读 ·
     · feedback_log(最近 N 条 · N=阈值)
     · DeepLearningArchive(全部样本)
     · 上次 EvolutionInsight(看上次进化方向)
     · history 表(top-K 最近生成 · 给 LLM 参考)
       ↓
   LLM 自主聚合 · 输出 ·
     {
       direction: '综合优化' | '创意性优先' | '转化率优先' | '真实感优先',
       insights: {
         preferredCatchphrases: string[],   // 用户偏好的金句
         styleTone: string,                 // "活泼/严谨/中性"
         avoidList: string[],               // 用户不喜欢的表达
         strongPoints: string[],            // 用户认可的角度
         weakPoints: string[]               // 用户反对的角度
       },
       sourceFeedbackIds: number[]
     }
       ↓
   写 ·
     · EvolutionInsight 表(历史快照)
     · 更新 EvolutionProfile(latest insights · level · direction)
       ↓
   推送通知用户 · "智能体进化到 Lx"

┌─────────────────────────────────────────────────────────────────┐
│  Phase 5 · 注入下次 Specialist 调用                             │
└─────────────────────────────────────────────────────────────────┘
   用户下次触发任意 Specialist
       ↓
   ContextAssembler 读 EvolutionProfile · 拼到 system prompt
       ↓
   Specialist 用进化后的 prompt 生成
       ↓
   闭环 · 越用越懂你
```

### §5.5 ContextAssembler 注入 Prompt 模板(细节)

> 这是飞轮产生效果的"最后一公里"。每次 Specialist 调用前 · ContextAssembler 拼出这样的 system prompt:

```
你是 [agent.persona.role]
目标 · [agent.persona.goal]
边界 · [agent.persona.boundaries.join(' / ')]

────────────────────────────────────────
# 当前 IP 账号(L2 Core 摘要)
- 行业 · {account.industry}
- 平台 · {account.platform}
- 当前阶段 · {diagnosis.stage}(诊断推断)
- 定位 · {step1.recommendation}

────────────────────────────────────────
# 历史 step 摘要(L2 Core · 给前后一致性参考)
- step3 包装 · {step3.overallStrategy.firstImpression}
- step3b 人设 · {step3b.coreIdentity.title}
- step4b 变现 · {step4b.currentAnalysis.industry}
{...其他 step}

────────────────────────────────────────
# 用户偏好(L4 Profile · 进化档案 · 越用越懂你)★ 核心
偏好金句:
{evolutionProfile.preferredCatchphrases.join('\n')}

风格倾向 · {evolutionProfile.styleTone}

避忌清单(用户反复 👎 过):
{evolutionProfile.avoidList.join('\n')}

────────────────────────────────────────
# 风格样本(L4 DeepLearning · top-K 相似)
{topKSamples.map(s => s.summary).join('\n---\n')}

────────────────────────────────────────
# 方法论(常量 + RAG)
脚本类型 · {scriptTypes[input.scriptType].methodology}
爆款元素心理学:
{input.elements.map(e => `${e}: ${psychology[e]}`).join('\n')}

────────────────────────────────────────
# 任务输入
{userInput}

# 输出 schema
{zodSchemaJsonExample}
```

> 这个 prompt 模板的核心是 **★ 用户偏好** 段 — **它就是反馈飞轮的产物**。
> 没有这段 · Specialist 就是普通 LLM 调用 · 跟用户用了多久无关。
> 有了这段 · Specialist **会按用户历史偏好生成** — "越用越懂你"成立。

### §5.6 进化等级触发逻辑(对应 §2.6 的 5 级)

| 等级 | 反馈数 | 触发动作 | EvolutionAgent 行为 |
|:-:|:-:|---|---|
| 🌱 L1 | 0-4 | 累计反馈 | 仅写 feedback_log · 不跑 EvolutionAgent · 用基础 prompt |
| 📚 L2 | 5+ | 第一次进化 | EvolutionAgent 跑 · 生成首版 insights · 注入 prompt |
| 🌿 L3 | 20+ | 自动进化开关启用 | 累计 5 新反馈 + 周 Cron · 持续小步进化 |
| 🌳 L4 | 50+ | 多维度细分 | 用户可选 direction(创意/转化/真实) · EvolutionAgent 按方向跑 |
| 👑 L5 | 100+ | 大师级 | 进化档案稳定 · 可选"克隆到新账号"(§5.7) |

### §5.7 跨账号档案共享决策(L5 大师级专属功能)

```
问题 · sally zhao 的「企业号」打到 L5 大师级 · 进化档案 100+ insights
       她现在新建一个「个人号」· 是否要克隆?

选项 ·
  A · 强制克隆 · 节省冷启动 · 但污染人设(企业号严谨 vs 个人号活泼)
  B · 强制独立 · 干净 · 但浪费已积累的"金句/避忌"
  C · 用户选择 · 在 /accounts 新建账号时勾选"继承 X 账号的进化档案"

本架构选 C · 推荐默认关闭 · 用户主动勾选才继承
```

> 这是产品决策 · 不是工程决策 · 详细 ADR 见后续 ADR.md

### §5.8 LS↔DB 同步策略(记忆维度)

> §3.4 已经从数据架构层讲过 · 本节从记忆维度补充 3 个边界:

| 层 | 同步策略 |
|:-:|---|
| **L1 Buffer** | 仅服务端 · 客户端不缓存(Redis is source of truth) |
| **L2 Core** | LS↔DB 双写 · 详见 §3.4 4 条规则 |
| **L3 Recall** | 仅服务端 · 客户端只读 · 大数据量不入 LS |
| **L4 Profile** | 仅服务端 · 但通过 React Query 缓存 5min(避免每次 ContextAssembler 都查 DB) |
| **L5 Trending** | 仅服务端 · 全用户共享 · Redis 热缓存 1h |

### §5.9 内部分层 vs Issue 飞轮 · 本架构的混合策略

> 引自 [`reference-materials/AI-Agent的两种记忆范式-内部分层vs外部Issue飞轮.md`](../Ai_Agent/knowledge-base/reference-materials/AI-Agent的两种记忆范式-内部分层vs外部Issue飞轮.md)。

| 范式 | 特征 | 本架构应用 |
|---|---|---|
| **内部分层**(Mem0 / Letta 派) | LLM 内部 5 层记忆 · 程序化管理 | L1-L4(Buffer/Core/Recall/Profile) |
| **外部 Issue 飞轮**(GitHub 派) | 反馈作为 Issue · 人机协作 · LLM 学习 | feedback_log → EvolutionAgent → 注入 prompt |

**本架构 = 两者的混合**:
- 9 步 + 14 工具的"显式输入"用**内部分层**(L2 Core 是核心)
- "用户满意度"用**外部 Issue 飞轮**(feedback_log 是燃料 · EvolutionAgent 是处理器 · prompt 注入是闭环)
- 这是国内产品罕见的"双范式"应用 · 是 QuanQn 跟 aiipznt 的最大差异之一(§1.7 第 5 条)

### §5.10 记忆系统小结

本章答 5 件事:
1. **5 层记忆映射**:Buffer / Core / Recall / **Profile** / **Trending**(替换 11/04 的 Summarizer/Portrait)(§5.1)
2. **多账号隔离**:L1-L4 严格按 account_id 隔离 · L5 全局共享(§5.3)
3. **反馈飞轮 5 阶段**:生成→反馈→触发→跑批→注入(§5.4)
4. **ContextAssembler prompt 模板**:Persona + Core 摘要 + 历史 step + ★用户偏好 + 风格样本 + 方法论(§5.5)
5. **混合范式**:内部分层 + Issue 飞轮(§5.9)

下一章(§6)进入接口契约与数据流,把所有上面的"静态架构"用 5 条端到端时序图串起来。

---

## §6 接口契约与数据流

> 前 5 节是"静态架构"(谁是谁 · 怎么放),本节是"动态契约"(怎么调 · 怎么传)。
> 看完本节你能拿契约直接写代码框架。

### §6.1 三层接口模型

```
┌─────────────────────────────────────────────────────────────┐
│  ① 对外接口 · 前后端 tRPC(L3 API 网关)                    │
│     · 13 个 router · 50+ procedure                          │
│     · 客户端通过 React Query + tRPC client 调用             │
│     · zod schema 自动校验                                   │
├─────────────────────────────────────────────────────────────┤
│  ② 对内接口 · Agent 协作(L4-L6 编排)                      │
│     · BaseSpecialist 抽象类                                  │
│     · ContextAssembler · LLMGateway 是必经枢纽              │
│     · 统一 Trace ID + 统一错误处理                          │
├─────────────────────────────────────────────────────────────┤
│  ③ 横向接口 · Worker 调用(L7 工具)                        │
│     · 8 个 Worker 各自独立                                   │
│     · 普通函数签名 · 不需要协议                              │
└─────────────────────────────────────────────────────────────┘
```

### §6.2 对外 · 前后端 tRPC 关键契约(精选 6 个 · 不全列)

> 50+ procedure 不全列(spec.md §3.1 已列全)。本节只列 6 个**最关键**的契约:

#### A · `ipAccounts.switchActive`(切换活跃账号 · 副作用 reload)

```typescript
input: z.object({ id: z.number() })
output: z.object({
  success: z.boolean(),
  account: IpAccountSchema  // 完整账号信息
})
side_effect:
  - 服务端 · 更新 user.active_account_id
  - 客户端 · localStorage.setItem('aiip_active_account_id', String(id))
  - 客户端 · await trpc.utils.invalidate()(强刷所有缓存)
  - 客户端 · 预热 stepData.getAll(id) ★ 本架构升级
  - 客户端 · window.location.reload() (原版行为 · 保留)
```

#### B · `stepData.save`(写 9 步主线 · 双写 LS)

```typescript
input: z.object({
  accountId: z.number(),
  stepKey: z.enum(['step1','step3','step3b','step4','step4b',
                   'step5','step6','step7','step8']),
  data: z.unknown(),  // 具体 schema 由 stepKey 决定 · 服务端再校验
  version: z.string().default('3.0'),
  trace_id: z.string().optional()
})
output: z.object({
  success: z.boolean(),
  updatedAt: z.string(),
  progress: ProgressSchema  // 顺便返回最新 9/N 进度
})
auth:
  - middleware · assert(user.accounts.includes(accountId))
write_path:
  1. validate by stepKey schema
  2. upsert step_data table(account_id + step_key 复合唯一)
  3. (异步)write history archive
  4. (异步)trigger feedback hook 准备(空)
```

#### C · `copywriting.generate`(文案生成 · SSE 流式)

```typescript
// 注:tRPC v11 + observable 实现 SSE
input: z.object({
  accountId: z.number(),
  scriptType: z.enum([20 种]),
  elements: z.array(z.string()).max(5),
  topic: z.string().min(1).max(100),
  mode: z.enum(['step7','free','boom','acquisition']).default('free')
})
output_stream: z.object({
  trace_id: z.string(),
  delta: z.string(),     // 增量文本
  done: z.boolean(),
  // done=true 时附带 ·
  result?: CopywritingResultSchema,
  history_id?: z.number()
})
internal:
  ① ContextAssembler.assemble({agentId:'CopywritingAgent', accountId, mode, userInput})
  ② CopywritingAgent.invoke → LLMGateway.stream
  ③ 流式增量 push 到 client
  ④ 完成后 · 写 history 表 · 触发 feedback hook 准备
```

#### D · `evolution.evolve`(写反馈 + 触发进化)

```typescript
// 双重职责 · 既写反馈又可能触发进化
input: z.object({
  accountId: z.number(),
  trace_id: z.string(),
  agent_id: z.string(),
  rating: z.enum(['good', 'bad']),
  comment: z.string().optional()
})
output: z.object({
  success: z.boolean(),
  newLevel: z.enum(['L1','L2','L3','L4','L5']).optional(),  // 升级时返回
  triggeredEvolution: z.boolean()  // 是否触发了 EvolutionAgent
})
flow:
  1. write feedback_log
  2. atomic increment evolution_profile.feedbackCount
  3. check threshold · 触发条件:
     - 累计反馈数 ∈ {5, 20, 50, 100}
     - 自动进化开关开 + 新增 5 反馈
  4. 若触发 · 异步 enqueue EvolutionAgent.run({accountId, trigger:'level_up'|'auto'})
  5. 立即返回 · EvolutionAgent 异步跑
```

#### E · `diagnosis.generate`(8 步问卷 → 一次性诊断)

```typescript
input: z.object({
  accountId: z.number(),
  answers: z.array(z.object({
    step: z.number().int().min(1).max(8),
    selectedItems: z.array(z.string()),  // 自评项 keys
    comment: z.string().optional()
  })).length(8)  // 必须 8 步全填
})
output: z.object({
  reportId: z.number(),
  trace_id: z.string(),
  dimensions: z.array(z.object({
    name: z.string(),
    score: z.number().int().min(0).max(100),
    issues: z.array(z.string()),
    suggestions: z.array(z.string()),
    priority: z.number().int()  // 优先级 1-7
  })).length(7),  // 7 维度报告
  overallScore: z.number(),
  topPriority: z.string()  // 用户最该先做的 1 件事
})
internal:
  ContextAssembler · DiagnosisAgent · LLMGateway · 写 diagnosis_report 表
```

#### F · `evolution.recentFeedback` & `feedbackTrend`(进化仪表盘数据)

```typescript
recentFeedback:
  input · { accountId, limit?:10 }
  output · Array<{trace_id, agent_id, rating, comment, agentName, originalContent, createdAt}>
feedbackTrend:
  input · { accountId, range:'7d'|'30d'|'90d' }
  output · Array<{date, good, bad, satisfaction}>
```

> 其他 44+ procedure 在 spec.md §3.1 + §ⅩⅩⅡ 全部列出 · 本架构不重复。

### §6.3 对内 · BaseSpecialist 抽象契约

> 14 个 Specialist 共同遵守的接口 · 借鉴 [`11-implementation-case/02-八Agent配置与Pipeline编排.md` §3 BaseAgent](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md):

```typescript
// 输入(所有 Specialist 共用)
interface SpecialistInput<P = unknown> {
  accountId: number;
  userId: number;
  agentId: SpecialistId;     // 'CopywritingAgent' | 'TopicAgent' | ...
  mode?: string;              // 模式分支(如 'step7' | 'free' | 'boom')
  payload: P;                 // 各 Specialist 自己的输入 schema
  trace_id?: string;          // 复用 tRPC procedure 传入的 trace
  metadata?: {
    referer?: string;
    feedbackParent?: string;  // 用于"再生成"场景
  };
}

// 输出(所有 Specialist 共用)
interface SpecialistOutput<R = unknown> {
  success: boolean;
  result?: R;                 // 各 Specialist 自己的输出 schema
  error?: { code, message, retryable };
  trace_id: string;
  agentId: SpecialistId;
  model: string;              // 'claude-sonnet-4-6' | 'gpt-4o-mini' | ...
  tokens: { prompt, completion, total };
  durationMs: number;
  feedbackHook: {              // 反馈飞轮接入点
    rateableContentId: number; // 用户能 👍/👎 的对象 id
    rateableType: 'history' | 'topic' | 'storyboard' | ...;
  };
}

// 抽象接口
abstract class BaseSpecialist {
  abstract config: SpecialistConfig;  // 五层配置(§4.7)

  // 模板方法 · 不可重写
  async run(input: SpecialistInput): Promise<SpecialistOutput> {
    const trace_id = input.trace_id ?? generateTraceId();
    try {
      validateInput(input);
      const ctx = await ContextAssembler.assemble({...});
      const out = await this.execute(input, ctx);
      writeAuditLog({ trace_id, agentId, in:input, out, durationMs });
      return out;
    } catch (err) {
      writeErrorLog(...);
      throw err;
    }
  }

  // 子类实现
  protected abstract execute(
    input: SpecialistInput,
    ctx: AssembledContext
  ): Promise<SpecialistOutput>;
}
```

### §6.4 ContextAssembler 接口契约

```typescript
interface AssembleRequest {
  agentId: SpecialistId;
  accountId: number;
  mode?: string;
  userInput: unknown;
  needRag?: ('knowledge_cases' | 'trending' | 'user_samples' | 'history')[];
  needLayers?: ('L2_step_data' | 'L4_profile' | 'L4_samples' | 'L5_trending')[];
}

interface AssembledContext {
  systemPrompt: string;       // 完整 system prompt(参 §5.5 模板)
  userPrompt: string;         // 用户输入格式化
  tools: ToolSchema[];        // Specialist 可用工具子集
  metadata: {
    contextTokens: number;    // 上下文 token 量
    layersUsed: string[];
    ragHits: { source, count }[];
  };
}

class ContextAssembler {
  async assemble(req: AssembleRequest): Promise<AssembledContext>
  // 内部并行 ·
  //   - L2 stepData.getAll(accountId)
  //   - L4 EvolutionProfile.get(accountId)
  //   - L4 DeepLearningArchive.topK(accountId, userInput)
  //   - L5 RAG · pgvector.search(...)
  //   - 常量 · MethodologyQueryWorker
}
```

### §6.5 LLMGateway 接口契约

```typescript
interface LLMGateway {
  complete(req: CompleteRequest): Promise<CompleteResponse>;
  stream(req: StreamRequest): AsyncIterable<StreamChunk>;
}

interface CompleteRequest {
  model_tier: 'reasoning' | 'lightweight';
  systemPrompt: string;
  userPrompt: string;
  tools?: ToolSchema[];
  responseFormat?: { type: 'text' } | { type: 'json_schema', schema: ZodSchema };
  metadata: { trace_id, agentId, accountId, userId };
  // 治理参数
  timeout_ms?: number;
  retry?: number;
}

interface CompleteResponse {
  content: string | object;
  tokens: { prompt, completion, total };
  model: string;          // 实际用的模型(可能因降级跟 tier 不一致)
  duration_ms: number;
  trace_id: string;
  fallback?: { from, to, reason };  // 降级记录
}

// 治理(详见 11/05 LLM 网关)·
//   · 限流 · token bucket per user
//   · 熔断 · 同模型连续 5 次 5xx 切下一档
//   · 降级 · reasoning → lightweight 自动
//   · 计费 · tokens × model_price → cost_log
//   · 审计 · 每次调用全量记 trace
```

### §6.6 Worker 接口签名(8 个)

```typescript
LLMGateway          → 见 §6.5 · 是 Worker 同时也是基础设施
ImageGenWorker      → generate({ prompt, size, count, model? }) → { urls[], jobId }
FileParserWorker    → parse({ fileUrl, mime }) → { text, pages?, metadata }
STTWorker           → transcribe({ audioStream, lang? }) → AsyncIterable<{partial, final}>
TTSWorker           → synthesize({ text, voice, format }) → AsyncIterable<audioBuffer>
TrendingScraper     → fetch({ platforms[], industry?, topN }) → TrendingItem[]
MethodologyQuery    → get({ name: 'industries'|'hotElements'|... }) → 常量(in-memory)
LSSyncWorker        → syncStep({ accountId, stepKey, data }) · 客户端 hook
```

### §6.7 五条端到端关键数据流(时序图)

#### 流程 1 · 9 步主线 · `/step/7` 文案生成

```
User    Browser    tRPC          ContextAssembler   CopywritingAgent   LLMGateway   DB
 │ 填表 │            │                  │                   │              │         │
 │──→  │            │                  │                   │              │         │
 │     │ generate   │                  │                   │              │         │
 │     │──────────→ │                  │                   │              │         │
 │     │            │ assemble({       │                   │              │         │
 │     │            │   accountId,     │                   │              │         │
 │     │            │   agentId,       │                   │              │         │
 │     │            │   mode:'step7'}) │                   │              │         │
 │     │            │─────────────────→│                   │              │         │
 │     │            │                  │ 并行拉 ·          │              │         │
 │     │            │                  │ - stepData.getAll │              │         │
 │     │            │                  │ - EvolutionProfile│              │         │
 │     │            │                  │ - DeepLearn topK  │              │         │
 │     │            │                  │ - 常量 + RAG      │              │         │
 │     │            │                  │←──── DB ←─────    │              │         │
 │     │            │ ←─ AssembledContext                  │              │         │
 │     │            │                  │                   │              │         │
 │     │            │ invoke ──────────────────────────────→              │         │
 │     │            │                  │                   │ stream(...)  │         │
 │     │            │                  │                   │─────────────→│         │
 │     │            │←─── chunk1 ────────────────────────  │←─ tokens ────│         │
 │     │ ←chunk1─── │                  │                   │              │         │
 │     │←──        │                                                                │
 │     │            │←─── chunk2 ─── ...                                             │
 │     │            │                                                                │
 │     │            │←─── done · result ─────────                                   │
 │     │            │ writeHistory(result) ────────────────────────────────────→ │
 │     │            │ ←─ history_id, trace_id ─                                    │
 │     │ ←done──── │                                                                │
 │     │ 渲染      │                                                                │
 │     │ 显示 👍/👎按钮                                                              │
```

#### 流程 2 · 14 工具(`/generate` · 同上但简化版)

```
跟流程 1 同 · 区别只在 mode='free' 而不是 'step7'
两者共用 CopywritingAgent · prompt 模板里 if (mode==='step7') 用 9 步上下文 · else 用普通上下文
```

#### 流程 3 · 8 步诊断 `/diagnosis`

```
User → 走完 8 步表单 → diagnosis.generate({accountId, answers[8]})
      ↓
ContextAssembler · 拉 stepData.getAll(看用户已经做了哪步) + EvolutionProfile
      ↓
DiagnosisAgent · 一次性 LLM 调用(reasoning tier · 60s timeout)
      ↓
zod schema 校验(7 维度报告必须有)
      ↓
写 diagnosis_report 表 + 更新 latest_diagnosis_id 到 IpAccount
      ↓
返回 · 用户看到 7 维度报告 + 顶部"最该先做"按钮 → 跳对应 step
```

#### 流程 4 · 反馈进化飞轮(★ 完整闭环)

```
T0 · 用户在 /step/7 看到文案 · 点 👍
     ↓
T1 · evolution.evolve({trace_id, rating:'good'})
     ↓ 写 feedback_log + 原子 ++good count
T2 · 检查 ·
       if (count === 5) → enqueue EvolutionAgent.run({trigger:'level_up:L1→L2'})
T3 · (异步)EvolutionAgent worker 启动
     ↓ 拉 feedback_log 最近 5 条
     ↓ 拉 DeepLearningArchive
     ↓ 拉 历史 history(top-K)
     ↓ LLM(reasoning) · 生成 insights
     ↓ 写 EvolutionInsight 表
     ↓ 更新 EvolutionProfile(level=L2 · latest insights)
T4 · 推送 toast · "智能体已进化到 L2"
T5 · 用户下次再用 CopywritingAgent
     ↓ ContextAssembler 读 EvolutionProfile · 注入 system prompt 的"用户偏好"段
     ↓ 新文案带用户偏好金句 + 风格 + 避忌
     ↓ 用户体验 · "这条文案像我自己写的"

闭环 · T0 → T5 周期短则即时(L2)长则数周(L5)
```

#### 流程 5 · L5 自治 · VoiceChat 多轮(简化)

```
T0 · 用户开口 → 浏览器 stream 到后端
T1 · STTWorker · 流式转文字
T2 · 写 L1 Buffer(Redis · voice_chat:acc_{id}:turns push 用户输入)
T3 · VoiceChatAgent.invoke ·
       ContextAssembler 拉 L1 Buffer 最近 10 条 + EvolutionProfile + step 摘要
       LLMGateway.stream(systemPrompt, userPrompt + history, tools[5个])
T4 · 流式回复 · 每个 chunk:
       - 文本 chunk → TTSWorker → 浏览器播放
       - tool_call · 调对应 tool(get_current_step 等) → 结果回填上下文
T5 · 完成后 ·
       - L1 Buffer push Agent 回复
       - 写 conversation_log(可选 · 用于事后分析)
T6 · 用户下一句 → 回到 T0 · 直到挂断 · TTL 30min 自动清 L1
```

#### 流程 6 · admin 跨账号查 + Approval Gates(2026-05-07 v0.3 新增 · 对应 REVIEW P2-5)

> admin 子系统的端到端时序 · 跟主应用前 5 条流程(用户主动 / 主应用 procedure)完全不同 · 涉及鉴权链 + Approval Gates 横切机制。详细 admin 时序图见 [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) §6 + §7。

```
admin   admin SPA   adminRouter   adminAuth   approvalGate   adminPrisma   admin_audit_log   钉钉
  │ 改套餐  │            │              │              │              │              │              │
  │──→    │            │              │              │              │              │              │
  │       │ users.changePlan(userId, newPlan)        │              │              │              │
  │       │──────────→│              │              │              │              │              │
  │       │            │ adminAuth(OAuth+session)│              │              │              │
  │       │            │──────────→│              │              │              │              │
  │       │            │            │ roleCheck >= admin           │              │              │
  │       │            │            │ ipWhitelist                   │              │              │
  │       │            │            │ mfaCheck(super_admin)         │              │              │
  │       │            │            │ adminRLS · set_config         │              │              │
  │       │            │            │   app.role='admin'            │              │              │
  │       │            │            │     │                          │              │              │
  │       │            │            │     ▼ 写 cross_account_query 事件
  │       │            │            │     ────────────────────────────────────────→│              │
  │       │            │←─ ok ──── │                                │              │              │
  │       │            │ approvalGateCheck(meta.requiresApproval)│              │              │
  │       │            │──────────────────────────→│              │              │              │
  │       │            │                            │ 检查 input._approvalRequestId
  │       │            │                            │   ├── 没有 → 创建 approval_request(pending)
  │       │            │                            │   │           ↓ 通知审批人(钉钉/Slack)
  │       │            │                            │   │ ──────────────────────────────────────→
  │       │            │                            │   └── 抛 PRECONDITION_REQUIRED · 中止
  │       │ ←──── APPROVAL_REQUIRED + approvalRequestId ──── │              │              │
  │ ←Modal "已提交审批,等待 super_admin 决策"
  │       │
  │       │  ★ 等待 super_admin 在 admin.quanqn.com /approval 决策
  │       │     super_admin 批准 → approval_request.status='approved'
  │       │     → 异步执行原操作 · 写 admin_audit_log + 通知申请人
  │       │
  │ ←Toast "操作已批准并执行"
```

**关键时序节点**:
1. **6 闸鉴权链**(adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck) — 每个 admin procedure 必经
2. **跨账号查询自动写 audit** — `cross_account_query` 事件由 adminRLS middleware 自动记录,业务代码不感知
3. **Approval Gates 中止 → 异步审批 → 异步执行** — 不阻塞 admin SPA · 用户可继续做别的事
4. **二次审批场景**(如批量改 ≥ 100 账号) — `requireDualApproval=true` · 申请人 ≠ 审批人 · 两个 super_admin 都批才能执行
5. **紧急通道**(如紧急止损) — `isEmergency=true` · 1 人快速批准 · 后置 24h 复核 · 写两条 audit(执行 + 复核)

> 详细 Approval Gates 实现 + 14 类高风险动作清单 + 4 类二次审批 + 2 类紧急通道 见 [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) §4.4 + §7.6。

### §6.8 错误处理与降级契约

| 失败位置 | 处理方式 |
|---|---|
| LLMGateway timeout | 重试 1 次 · 失败降到下一档(reasoning→lightweight) · 仍失败返回 fallback 模板 |
| zod 校验失败 | LLM 重试 1 次 · 失败标 `is_fallback=true` 返回简版结果 |
| stepData.save 失败 | 客户端回滚 LS · toast 错误 · 30s 后自动重试 |
| **stepData 并发冲突** ★ | **乐观锁(version 字段)· 多 tab 同改 step3 时第二次 save 报错 → toast "已被另一处修改 · 请刷新" · 用户决定** |
| EvolutionAgent 失败 | 异步队列 · 失败重试 3 次 · 仍失败写 dead-letter · 不影响用户主流程 |
| **EvolutionAgent 部分失败** ★ | **level 升级 + insight 写入必须放同一 transaction · 任一失败全部回滚 · 防止"已升级 L2 但 insight 为空"** |
| **EvolutionAgent 长期失败** ★ | **dead-letter 累计 ≥3 条触发告警 · 同时 ContextAssembler 降级用上一版 EvolutionInsight(不阻断用户)** |
| DiagnosisAgent 失败 | 同步阻塞 · 失败展示错误页 · 用户重试 |
| VoiceChat 失败 | 流式中断 · 客户端 toast · 5s 后自动重连 |

### §6.9 Trace ID 端到端贯穿

> 每次用户操作生成 1 个 trace_id · 贯穿整个调用栈 · 用于审计 · 反馈关联 · 错误排查。

```
trace_id = `tr_${accountId}_${agentId}_${timestamp}_${rand4}`
例 · tr_390012_CopywritingAgent_1714987200000_a3f1
```

每条数据**都带 trace_id**:
- history.trace_id
- feedback_log.trace_id
- audit_log.trace_id
- evolution_insight.sourceFeedbackIds → 反查 feedback_log → 反查 history → 反查 trace

> 这让"用户为什么不喜欢这条文案"可以一路追溯到"用了什么 prompt + 哪些上下文"。

**实现栈推荐**(MVP → 规模化两档):

| 阶段 | 推荐栈 | 理由 |
|---|---|---|
| **MVP**(< 1k 用户) | Postgres `audit_log` 表 + 自建 logger(pino) + Grafana Loki 查日志 | 复用主库 · 无运维 · 0 元起步 |
| **规模化**(> 1k 用户) | OpenTelemetry SDK + OTLP → Tempo / Jaeger + Grafana 看板 | 标准化 · 多服务串联 · 业界主流 |
| **不推荐** | Datadog / New Relic 商业 | 月费高(¥10k+)· MVP 不必要 |

> 关键 · `trace_id` 字段在所有 DB 表中字段名统一 · 即使后期切换观测栈也不用改业务代码。

### §6.10 接口契约小结

本章答 5 件事:
1. **三层接口**:对外 tRPC · 对内 BaseSpecialist · 横向 Worker(§6.1)
2. **6 个关键 tRPC 契约**(switchActive / save / generate / evolve / diagnosis / feedback)(§6.2)
3. **统一 Specialist 抽象**:模板方法 + 五层配置 + Trace ID(§6.3)
4. **5 条端到端数据流**:9 步 / 14 工具 / 诊断 / 飞轮 / 多轮(§6.7)
5. **错误处理与降级**:LLM 降级 + 队列重试 + 客户端回滚(§6.8)

下一章(§7)进入多 Agent 案例对照,跟知识库的实战案例做横向对比 · 解释为什么我们选 14 个能力域 Specialist。

---

## §7 多 Agent 案例对照

> 本节是"为什么选 14 个能力域 Specialist"的完整辩护 — 用知识库 4 个对标案例横向比较 · 看清我们为什么这么选,以及跟其他选择的差别在哪里。
>
> 对标对象:
> 1. **11/02 mini-program-agent**(客服 Agent · 8 个 Agent · Pipeline)— [`11-implementation-case/02-八Agent配置与Pipeline编排.md`](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md)
> 2. **02 多 Agent 协作架构**(理论文档 · 多模式选型)— [`02-multi-agent-collaboration-architecture/`](../Ai_Agent/knowledge-base/02-multi-agent-collaboration-architecture/)
> 3. **05-vertical/02 爆款文案**(内容生产 · 7 Agent · 串行 pipeline)— [`05-vertical-solutions/02-viral-copywriting-agent/`](../Ai_Agent/knowledge-base/05-vertical-solutions/02-viral-copywriting-agent/)
> 4. **05-vertical/05 智能营销**(营销操作系统 · 7 Agent · 并行)— [`05-vertical-solutions/05-intelligent-marketing-agent/`](../Ai_Agent/knowledge-base/05-vertical-solutions/05-intelligent-marketing-agent/)

### §7.1 五案例全景对比矩阵

| 维度 | 11/02 mini-program | 05-vertical/02 爆款 | 05-vertical/05 营销 | 02 多 Agent(理论) | **QuanQn(本架构)** |
|---|---|---|---|---|---|
| **业务场景** | 客服对话 | 内容生产 | 营销执行 | 跨场景理论 | IP 孵化平台 |
| **Agent 数量** | 8(细粒度) | 7(串行) | 7(并行) | 多模式可选 | **14**(能力域) |
| **协作模式** | Pipeline 流水线 | 串行 pipeline | 并行 + 周期 | Centralized / Swarm / Star ... | **Centralized + 软 Supervisor** |
| **触发主体** | 每条用户消息 | 用户一键启动 | Cron + 事件 | 多种 | **用户驱动 · 95% Workflow** |
| **状态机复杂度** | 极高(企业/个人/技能 三分支 + N 状态) | 中(7 步线性) | 中(并行无依赖) | 视模式 | **低**(9 步顺序 + 用户控制) |
| **LLM 调用频率** | 1 次输入 → 多 Agent | 1 次输入 → 7 Agent | 1 周期 → 7 Agent | 视模式 | **1 输入 → 1 Specialist** |
| **反馈机制** | 隐式(对话语义) | 无显式飞轮 | A/B 测试反馈 | 提了 issue 飞轮 | **★ 显式飞轮(L1-L5 进化)** |
| **粒度选择** | 流水线工人 | 内容工序 | 营销职能 | 都行 | **能力域**(领域驱动) |
| **抽象隐喻** | 工厂流水线 | 内容生产线 | 营销部门 | — | **专业化技能集** |
| **Token 成本** | 高(8 Agent × 1 输入) | 高(7 串行) | 高(周期累积) | 视模式 | **可控**(单次 1 LLM) |

### §7.2 跟 11/02 八 Agent 的对照(粒度判断)

> 11/02 是知识库的"实战标杆案例" · 客服场景 · 8 个 Agent 共同处理一条用户消息。本架构跟它的差别**不是好坏 · 是场景**。

#### A · 业务形态差异(根因)

```
11/02 客服 Agent ·
  用户输入 1 条消息(自由文本 / 快捷选项)
       ↓
  Pipeline 同时跑 8 个 Agent:
    [前置并行组] FAQ拦截 ∥ 情绪检测
       ↓
    [中段] 对话引擎(LLM 主对话)
       ↓
    [后置并行] 实体提取 ∥ 意向评分 ∥ 标签生成
       ↓
    [报告] 报告生成器
       ↓
  返回 · 1 个回复 + 数据库持久化
  
关键 · 8 Agent 协作产出 1 个对话回复 · 输入是单条消息
─────────────────────────────────────────────

QuanQn IP 孵化 ·
  用户填表 1 个 step / 工具
       ↓
  调 1 个 Specialist:
    CopywritingAgent / TopicAgent / etc.
       ↓
  产出 · 1 个 result(可能很长 16KB markdown)
       ↓
  用户看 · 决定下一步去哪
       ↓
  下次用户再触发 · 调另一个(或同一个) Specialist
  
关键 · 1 Specialist 产出 1 个结构化 result · 输入是表单
```

#### B · 切分粒度差异

| 维度 | 11/02 八 Agent(细) | QuanQn 14 Specialist(中) |
|---|---|---|
| 拆分依据 | 流水线工序 · 1 个 Agent 干 1 件小事 | 能力域 · 1 个 Specialist 覆盖多个相似场景 |
| Agent 间协作 | Pipeline · 输出 → 下个 Agent 输入 | 独立 · Specialist 之间不直接协作(走 ContextAssembler 共享 stepData) |
| Prompt 模板数 | 4 个(4 个 LLM Agent · 4 prompt) | 14 个(每个 Specialist 1 个 prompt) |
| 共享性 | 8 Agent 各司其职 · 不共享 | 4 个 Workflow 入口共享 1 个 Specialist(如 step7+generate+boom+acquisition 共享 CopywritingAgent) |

#### C · 借鉴 11/02 的 4 个设计

虽然粒度不同 · 但 11/02 的几个机制本架构**直接借鉴**:

| 借鉴项 | 11/02 出处 | QuanQn 应用 |
|---|---|---|
| **BaseAgent 模板方法** | §3 BaseAgent 抽象接口 | §6.3 BaseSpecialist 抽象类 |
| **五层配置体系** | §4 五层配置(Persona/Memory/Knowledge/Tools/Execution) | §4.7 SpecialistConfig 完全照搬 |
| **AgentResult 标准化输出** | §3.2 AgentResult dataclass | §6.3 SpecialistOutput 同款字段 |
| **trace_id 链路追踪** | §3.2 trace_id 字段 | §6.9 全栈 trace 贯穿 |

> ⭐ 关键 · 11/02 是 **「Pipeline 同步流水线」** · QuanQn 是 **「独立调用 + 异步飞轮」** · 但**配置体系和接口标准可以共享**。

### §7.3 跟 02 多 Agent 协作架构的对照(范式选型)

> 02 是理论文档 · 列了 5 种协作模式。QuanQn 选哪种?为什么?

#### A · 5 种协作模式(02 提的)

| 模式 | 特征 | 典型场景 |
|---|---|---|
| **Centralized Supervisor** | 1 个 Supervisor 调度 N 个 Specialist | 客服 Triage · 工作流编排 |
| **Decentralized Swarm** | Agent 平等 · 互相调用 | 协作写作 · 多视角辩论 |
| **Hierarchical** | 多层 Supervisor · 树形结构 | 大型企业流程 · 复杂决策 |
| **Pipeline** | 串行流水线 · 输出→下个输入 | 内容生产 · 数据 ETL |
| **Star** | 中心 + 卫星 · 所有人调中心 | 知识库 RAG · 工具中枢 |

#### B · QuanQn 的选择 · **Centralized + 软 Supervisor**(变种)

```
                ┌──────────────────────────────┐
                │  Workflow Command(用户驱动) │
                │  (= 软 Supervisor · 不是 LLM) │
                └──────────────┬───────────────┘
                               │ 路由
       ┌───────────┬───────────┼───────────┬──────────┐
       ▼           ▼           ▼           ▼          ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
  │Position │ │Branding │ │Topic    │ │Copywri  │ │ ...     │
  │Agent    │ │Agent    │ │Agent    │ │tingAgent│ │         │
  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘

特征 ·
  · 软 Supervisor = Workflow Command · 不做 LLM 决策 · 不算 Agent
  · 14 个 Specialist 之间 0 直接调用
  · ContextAssembler 是隐形枢纽(每次调用前组装上下文)
  · EvolutionAgent 是异步飞轮(不在主调用栈)
```

#### C · 为什么不选其他 4 种

| 模式 | 为什么不选 |
|---|---|
| Decentralized Swarm | 业务场景固定 · 不需要 Agent 之间互相调用 · 用户控制流程 |
| Hierarchical | 太重 · 这个产品没有"多层决策"语义 |
| Pipeline | 11/02 是 Pipeline · 但本案例不需要 — 用户每次只调 1 个 Specialist · Pipeline 多余 |
| Star | 中心是 LLM 的话 token 爆炸 · 中心是 Workflow Command 的话就退化为 Centralized |

### §7.4 跟 05-vertical/02 爆款文案的对照(同领域 · 不同形态)

> 05-vertical/02 跟本架构最相似(都是内容生产) · 但**形态不一样**。

| 维度 | 05-vertical/02 爆款文案 | QuanQn |
|---|---|---|
| **目标** | 一键端到端 · 帮用户出爆款 | 工具集 · 用户主导每一步 |
| **流程** | 7 Agent 串行(热点→选题→大纲→文案→优化→改写→排程) | 用户在 step5/7/8 之间自由跳 |
| **用户参与度** | 低(填行业 → 一键跑 → 看结果) | 高(每步看结果 · 决定下一步) |
| **失败容忍** | 低(中间出错全废) | 高(单步失败只影响那步) |
| **适合用户** | MCN 矩阵 · 批量起号 | 个人 IP · 精打磨人设 |

**借鉴点**:
* 05-vertical/02 的"22 爆款元素 + 20 脚本类型"知识体系 → 直接搬到 QuanQn 当常量(§3.6)
* 05-vertical/02 的"AI Prompt 设计模板"思想 → 用在 CopywritingAgent 的多模式分支
* 但**串行流程不搬** — QuanQn 是用户控制 · 不是 Agent 自动跑

### §7.5 跟 05-vertical/05 智能营销的对照(B 端 vs C 端)

> 05-vertical/05 是企业级营销操作系统 · QuanQn 是个人 IP 工具集。两者形态不同。

| 维度 | 05-vertical/05 智能营销 | QuanQn |
|---|---|---|
| **客户** | B 端(品牌 / 营销团队) | C 端(个人 IP / OPC) |
| **协作模式** | 7 Agent 并行 + 周期(Cron 触发) | 14 Specialist 单次 + 飞轮 |
| **数据源** | 多渠道(社媒 / 邮件 / 广告 / CRM) | 单用户(IP 账号 + 文案历史) |
| **A/B 测试** | 内置(原生 A/B 模块) | 暂无 · 但反馈飞轮可演化为 A/B(L4 阶段) |

**借鉴点**:
* 05-vertical/05 的"私域 6 阶段话术体系" → 直接搬到 PrivateDomainAgent
* 05-vertical/05 的"ICP 自学习"思路 → 反馈飞轮的灵感来源(QuanQn 实现得更轻)
* 05-vertical/05 的"KPI 仪表盘"设计 → /evolution 仪表盘 4 指标参考

### §7.6 14 个能力域 Specialist 的切分理由(完整辩护)

#### A · 为什么不选 23 个细 Agent(每个 URL 一个)?

```
9 步 + 14 工具 = 23 个潜在 Agent
                      ↓
   维护爆炸 ·
     - 23 个 prompt 模板
     - 23 套配置
     - 23 个测试用例集
     - 23 个降级策略
                      ↓
   共享上下文割裂 ·
     - step3 和 step3b 都要读 industry+platform · 但 prompt 各写一份 · 容易不一致
     - generate 和 boom-generate 都要 22 元素心理学 · 重复维护
                      ↓
   团队认知成本爆炸 ·
     - 新人入职要看 23 个 prompt
     - 改一个全局逻辑(比如加"避忌清单")要改 23 处
```

#### B · 为什么不选 4 个角色化 Agent(Paperclip 风格)?

```
4 角色 · CEO / CMO / Engineer / Reviewer
                ↓
   过粗 ·
     - 一个 Agent 做"内容创作 + 选题 + 文案 + 视频 + 直播" → prompt 极长 · LLM 注意力分散
     - 不能针对 22 元素心理学这种细领域知识做精调
                ↓
   不适合本场景 ·
     - Paperclip 是 SaaS 营销 · 4 角色对应 SaaS 经营的 4 个职能
     - QuanQn 是 IP 孵化工具集 · 没有"角色"语义 · 只有"能力"语义
```

#### C · 14 个能力域是怎么算出来的?

```
9 步 + 14 工具 + 6 新模块 = 29 个潜在切点
                ↓
合并规则 ·
  规则 1 · 输出物相似 → 合并
    step7 / generate / boom-generate / acquisition-video → CopywritingAgent
    step6 / video-production / acquisition-video / ai-video → VideoAgent
    video-analysis / analysis → AnalysisAgent
    step5 / trending / my-topics → TopicAgent
  规则 2 · 输入字段重叠 → 合并
    step1 / step4 → PositioningAgent(共用 industry+goals)
    step3 / step3b → BrandingAgent(共用 platform+personalInfo)
  规则 3 · 模式独立 → 不合并
    diagnosis / monetization / privateDomain / livestream / deepLearn → 各自独立
  规则 4 · 自治型独立
    voice-chat / evolution / daily-tasks → 3 个 L5 独立
  规则 5 · 纯 CRUD 不算 Specialist
    /accounts / /my-topics / /history / /knowledge / /present-styles → 0 个 Specialist
                ↓
合并结果 · 14 个 Specialist
  · 11 生成型(Position, Branding, Monetization, Topic, Copywriting, Video,
              Livestream, PrivateDomain, Analysis, Diagnosis, DeepLearn)
  · 3 自治型(VoiceChat, Evolution, DailyTask)
```

#### D · 14 这个数字的"经济学"

| 项 | 11/02 八 Agent | QuanQn 14 Specialist | 23 细 Agent(假设) |
|---|:-:|:-:|:-:|
| Prompt 模板数 | 4 | **14** | 23 |
| 配置数 | 8 | 14 | 23 |
| 测试用例数(平均 5/Agent) | 40 | **70** | 115 |
| 团队上手成本 | 中 | **中** | 高 |
| 演进灵活性 | 中(共享流水线) | **高**(独立 Specialist) | 高(完全隔离) |
| Token 成本 | 高(每条 8 LLM) | **低**(每次 1 LLM) | 低 |

> 14 是**「细够用 + 不爆炸」的甜点**。

### §7.7 知识库借鉴清单(本架构具体借了什么)

| 知识库文档 | 借鉴内容 | 应用位置 |
|---|---|---|
| **02 多 Agent 协作架构** | Centralized + 软 Supervisor 选型 | §4.2 三层编排 |
| **11/02 八 Agent** | BaseAgent / AgentResult / 五层配置 / trace_id | §4.7 + §6.3 |
| **11/04 五层记忆** | Buffer/Core/Recall 三层 + 替换 Summarizer/Portrait | §5.1 |
| **11/05 工具系统与 LLM 网关** | 限流 / 熔断 / 降级 / 计费 | §6.5 LLMGateway |
| **05-vertical/02 爆款文案** | 22 元素 + 20 脚本知识体系 + Prompt 模板思路 | §3.6 常量 + CopywritingAgent prompt |
| **05-vertical/05 智能营销** | 私域 6 阶段 + ICP 自学习启发 | PrivateDomainAgent + 反馈飞轮灵感 |
| **reference/PI 03 二分法** | Workflow vs Agent 判断 | §4.1 95/5 分类 |
| **reference/PI 13 Harness 5 模式** | Context 投影 → ContextAssembler 设计 | §4.6 + §5.5 |
| **reference/AI-Agent 两种记忆范式** | 内部分层 + Issue 飞轮混合 | §5.9 |
| **ADR-007 三层编排** | L4-L7 分层 | §4.2 |
| **ADR-018 外部 orchestrator** | EvolutionAgent + DailyTaskAgent Heartbeat | §4.4 |

### §7.8 案例对照小结

本章答 4 件事:
1. **跟 11/02 借接口、不借粒度** · 8 Agent 是流水线工序粒度 · 14 Specialist 是能力域粒度(§7.2)
2. **协作模式选 Centralized + 软 Supervisor** · 用户驱动 · 不需要 Agent 互相调用(§7.3)
3. **跟 05-vertical 借知识体系、不借端到端流程** · 22 元素 / 20 脚本 / 6 阶段直接搬 · 但流程是用户控制(§7.4 + §7.5)
4. **14 是甜点** · 11 生成型 + 3 自治型 · 由 5 条合并规则推出来的(§7.6)

下一章(§8)进入 UI/UX 设计系统,讲清楚 Aurelian Dark 设计哲学 + 60+ 设计稿索引。

---

## §8 UI/UX 设计系统

> 本节回答 · "QuanQn 长什么样" — 不是 Agent 架构,但是项目的"皮肤"。设计稿已经做了 60+ 张 · 本节给出统一的索引和落地方法。
>
> **来源** · [`QuanQn/ui/aurelian_dark/DESIGN.md`](ui/aurelian_dark/DESIGN.md)(项目唯一的设计系统文件 · 7.4KB · YAML 元数据 + 文字描述)
>
> **关键判断** · 本架构跟 aiipznt 原版**视觉风格完全不同**(§1.7 第 1 条)— 原版赛博青(#00e5ff + Orbitron)· 本架构选 Aurelian Dark(金 #d4af37 + Manrope)。

### §8.1 Aurelian Dark 设计哲学(Minimalist Luxury)

> ⚠️ **DESIGN.md 双重金色定义** · 本架构以 YAML frontmatter 为权威 ·
> · YAML(权威) · `primary: #f2ca50` / `primary-container: #d4af37` / `primary-fixed: #ffe088`
> · 文字段(参考) · "Primary Gold #D4AF37 / active #C5A028 / hover/deep #B8860B"
> · 两套定义实际是 Material Design 风格(YAML 5 档)与 Tailwind 风格(文字段 3 档)的不同表述。**实施时统一用 YAML · 把文字段当 hover/active 状态变体**。

> 引自 DESIGN.md "Brand & Style" 段:

```
"This design system embodies Minimalist Luxury.
 It is designed for high-end SaaS platforms where
 precision, exclusivity, and calm authority are paramount.

 The aesthetic rejects the frenetic energy of typical
 tech startups in favor of a curated, editorial feel."
```

**3 个设计原则**(从原文提炼):

| 原则 | 含义 | 跟 aiipznt 原版的区别 |
|---|---|---|
| **Tonal Layering** | 同色系深浅分层做层级 · 不靠投影 | 原版用赛博青强对比 · 本架构用 4 档 #131316→#343437 |
| **Void and Gold** | 极深背景 + 稀疏金色高光 | 原版处处是青色 · 本架构金色是「价值信号」不是装饰 |
| **Editorial Calm** | 像高端杂志 · 慢节奏 · 富空白 | 原版强调"科技感"动效 · 本架构强调"克制感"留白 |

**适配人群**:这种风格更适合 **OPC 创业者 / MCN / 中高客单价 IP 起号者**(§1.6 用户画像)— 不适合青少年向短视频用户。

### §8.2 颜色体系(从 DESIGN.md YAML frontmatter 提取)

#### A · Surface 层级(深背景的 4 档)

| Token | HEX | 用途 |
|---|---|---|
| `surface-container-lowest` | #0e0e11 | 最深 · 输入框 sunken 感 |
| `surface-container-low` | #1b1b1e | 次深 · 二级面板 |
| `surface-container` | #1f1f22 | 标准卡片背景 |
| `surface-container-high` | #2a2a2d | 浮起元素 · hover 状态 |
| `surface-container-highest` | #343437 | 最高层 · 弹窗 / Modal |
| `surface` (= background) | #131316 | 主画布 |
| `surface-bright` | #39393c | 高对比度边缘 |

#### B · Primary Gold(双金 + 4 档)

```
Primary Layer ·
  primary           · #f2ca50  ← 主交互色(按钮 / 链接 / 高亮)
  primary-container · #d4af37  ← 容器金(分隔条 / 强调底)
  primary-fixed     · #ffe088  ← 浅金(柔和强调)
  primary-fixed-dim · #e9c349  ← 中金(标准)

  on-primary        · #3c2f00  ← 金底上的深色文字(暗琥珀)
  on-primary-fixed-variant · #574500  ← 浅金底上的中调文字
```

**使用规则**(从 DESIGN.md 提炼):
* 金色**稀疏使用** — 不超过页面 5% 视觉权重
* 金色 Glow 用 `radial-gradient(rgba(212,175,55,0.10) 0%, transparent 70%)` 软晕
* hover 状态金色加深到 `#c5a028`

#### C · Tertiary / Error / Outline

| Token | HEX | 用途 |
|---|---|---|
| `tertiary` | #ffc551 | 次要金色变体 · 用于"完成态"提示 |
| `error` | #ffb4ab | 错误提示(红润不刺眼) |
| `error-container` | #93000a | 错误背景 |
| `outline` | #99907c | 标准边框(暖灰) |
| `outline-variant` | #4d4635 | 弱边框(深暖灰) |
| `on-surface` | #e4e2e5 | 主文字色 |
| `on-surface-variant` | #d0c5af | 次文字色(暖白) |

> **关键**:不用纯黑 `#000000` · 不用纯白 `#ffffff` · 全部用稍带暖调的近黑近白(参考高端杂志印刷)

### §8.3 字体系统(三字体分工)

```yaml
# 来自 DESIGN.md typography 段
display-xl:    Manrope · 48px · 700 · -0.02em
display-lg:    Manrope · 36px · 600 · -0.02em
h1:            Manrope · 30px · 600
h2:            Manrope · 24px · 600
body-lg:       Plus Jakarta Sans · 18px · 400
body-md:       Plus Jakarta Sans · 16px · 400
body-sm:       Plus Jakarta Sans · 14px · 400
label-md:      Inter · 12px · 500 · 0.05em(全大写)
label-sm:      Inter · 11px · 600 · 0.08em(全大写)
```

| 字体 | 角色 | 哲学 |
|---|---|---|
| **Manrope** | 标题 | Geometric · Modern Industrial · 大尺寸字间距收紧 -0.02em(高端杂志感) |
| **Plus Jakarta Sans** | 正文 | 柔和的 Sans-serif · 平衡黑暗主题的硬朗 |
| **Inter** | 标签 / 数据 | 系统化"Pro"感 · 字间距放宽 0.05/0.08em · 全大写(像奢侈品牌印记) |

> 字体跟 aiipznt 原版(Orbitron + Rajdhani + Noto Sans SC)完全不同。中文字体 DESIGN.md 没指定 · 本架构推荐 **Noto Sans SC**(继承原版兼容性)+ **思源宋体**(用于"封面"卡片想突出编辑感时)

### §8.4 间距 · 圆角 · 阴影体系

#### A · 4px Rule(铁律)

```yaml
spacing:
  unit: 4px
  xs: 4px      # 紧凑间距
  sm: 8px      # 标签内
  md: 16px     # 默认间距
  lg: 24px     # 卡片之间(标准 gutter)
  xl: 40px     # 章节之间
  2xl: 64px    # 巨大留白(英雄区)
  gutter: 24px
  container-max: 1440px
```

> **所有间距必须是 4px 倍数** — 这是 DESIGN.md 明确写的"4px Rule"。

#### B · 圆角(默认 Soft 0.25rem · 平衡硬与软)

```yaml
rounded:
  sm: 0.125rem    # 2px · 极小元素(tag)
  DEFAULT: 0.25rem # 4px · 按钮 / 输入框
  md: 0.375rem    # 6px · 中卡片
  lg: 0.5rem      # 8px · 大卡片 / Modal
  xl: 0.75rem     # 12px · 超大容器(可选)
  full: 9999px    # 圆形(头像 / 标签)
```

#### C · 阴影 · 用边框光做层级(不用传统投影)

```css
/* DESIGN.md "Borders as Light" */
border-top: 1px solid;
border-image: linear-gradient(to bottom, rgba(255,255,255,0.1), transparent) 1;
/* 给卡片顶端微妙的"机加工金属边" 感 */

/* 唯一允许的阴影 · Modal 用 */
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);

/* 焦点态金色 Glow */
box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.15);
```

### §8.5 60+ 设计稿索引(按业务映射)

> ui/ 目录下 67 个子目录 · 1 份 DESIGN.md。本节按业务页面归类。

#### A · 9 步主向导(11 张稿)

| 设计稿 | 映射页面 | 备注 |
|---|---|---|
| `step_01/code.html` | `/step/1` 选择行业 | 主稿 |
| `step_03_account_packaging/` | `/step/3` 账号包装 | 主稿 |
| `step_03b/` | `/step/3b` 人设定制 | 主稿 |
| `step_04b_1` ~ `step_04b_6` | `/step/4b` 变现路径 6 个变体 | A/B 候选 |
| `step_05/` | `/step/5` 爆款选题 | 主稿 |
| `step_06/` | `/step/6` 拍摄计划 | 主稿 |
| `step_08_1` ~ `step_08_7` | `/step/8` 直播策划 7 个变体 | 多模式探索 |

> 没有 step_04 / step_07 设计稿(待补) · 推测复用 step_03 的"表单 + AI 输出"通用骨架

#### B · 14 工具页(关键映射)

| 设计稿 | 映射页面 | Specialist |
|---|---|---|
| `ai_copywriting_studio_1/2` | `/step/7` + `/generate` + `/boom-generate` | CopywritingAgent |
| `ai_storyboard/` | `/ai-video` | VideoAgent(storyboard mode) |
| `ip_voice_chat/` | `/voice-chat` | VoiceChatAgent |
| `market_intelligence_hub/` | `/trending` | TopicAgent + TrendingScraper |

#### C · 主要功能页(`aip_*` 系列 · 19+ 张)

| 设计稿 | 推测映射 |
|---|---|
| `aip_1` ~ `aip_19` | 各主功能页探索稿 · 需后期对照 |
| `aip_a` / `aip_ai` | 主题页 / AI 入口 |
| `aip_dashboard_overview` | `/` 首页 |
| `aip_17.md` | 单页文档(非 HTML) · 待解析 |

#### D · IP 系列(`ip_1-4`)

| 设计稿 | 推测映射 |
|---|---|
| `ip_1` ~ `ip_4` | `/ip-plan`(IP 方案查看)的 4 个变体 |
| `ip_voice_chat` | `/voice-chat`(C 类已列) |

#### E · 编号系列(`_1` ~ `_15` · 15 张)

> 这一组是早期探索稿 · 编号没有业务对应。落地时**取舍** —— 优先用 step_*/aip_* 系列,`_N` 系列作为"备用元素库"(从中提取按钮/卡片/列表组件)。

#### F · 设计系统源文件

| 文件 | 内容 |
|---|---|
| `aurelian_dark/DESIGN.md` | 唯一的设计系统源文件 · 7.4KB · 本节全部数据来源 |

### §8.6 组件级落地规则(直接抄 DESIGN.md "Components" 段)

#### A · Button

```css
/* Primary */
background: #d4af37;
color: #0a0a0b;
animation: light-sweep 2s ease;  /* 45° 白色渐变扫过 */

/* Secondary */
background: transparent;
border: 1px solid #2d2d30;
&:hover { border-color: #d4af37; }

/* Tertiary / Ghost */
color: inherit;
&:hover { color: #d4af37; }
```

#### B · Card

```css
background: #1c1c1e;
border: 1px solid #2d2d30;
transition: transform 0.2s, border-opacity 0.2s;
&:hover {
  transform: translateY(-2px);
  border-color: rgba(212, 175, 55, 0.3);
}
```

#### C · Input

```css
background: #0a0a0b;             /* sunken */
border: 1px solid #2d2d30;
&:focus {
  border-color: #d4af37;
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.15);
}
```

#### D · Navigation Sidebar

```css
background: #141416;
.active::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: #d4af37;            /* 左 2px 金色竖线 */
}
```

### §8.7 图标体系(Lucide SVG · 1.5/2px stroke)

> DESIGN.md 强制 **Lucide SVG only · stroke 1.5px 或 2px · 不用 filled** — 跟 §3.6 常量层 spec.md §ⅩⅩ 实测的 68 lucide 图标完全兼容。

| 规则 | 值 |
|---|---|
| 库 | `lucide-react`(shadcn 默认搭档) |
| 尺寸 | 20px / 24px(rem 单位 · 5/6) |
| Stroke | 1.5px 或 2px(跟字体衬线粗度匹配) |
| 颜色 | 继承 `currentColor` |
| Filled 图标 | **禁用** · 除非用作"激活"状态指示 |

### §8.8 动效体系(克制 + 精度)

DESIGN.md 没明确列动效,本架构补充 5 个核心动效(沿用 spec.md §ⅩⅢ 实测的 6 自定义动画):

| 动效 | 触发 | 实现 |
|---|---|---|
| **light-sweep** | 按钮 hover | 45° 白色渐变条横扫 600ms |
| **gold-glow-pulse** | focus 焦点 | 金色辉光 1.5s 慢呼吸 |
| **card-lift** | 卡片 hover | translateY(-2px) + border 微亮 |
| **fade-in-up** | 卡片入场 | 自下而上淡入 400ms · 错峰 100ms |
| **shimmer-loading** | Skeleton | 暗灰渐变扫光 1500ms · 替代旋转 loader |

> 全部动效 **≤ 600ms** · 不用 `transition: all` · 用具体属性(避免 layout 抖动)

### §8.9 设计 → 实现栈映射

```
Aurelian Dark Tokens(YAML)
  ↓ 转换
tailwind.config.js · theme.extend.colors / fontFamily / spacing
  ↓
shadcn/ui 组件层(button/card/input/dialog 全部用 Tailwind 变量)
  ↓
React 业务组件
```

**实现要点**:
1. 把 DESIGN.md YAML 用脚本转 `tailwind.config.js`(避免手动维护)
2. 在 `globals.css` 设 CSS 变量(`--surface` `--primary` 等),Tailwind 引用变量
3. 字体走 `next/font/google` 或 `@fontsource/manrope` 自托管(不依赖 Google Fonts CDN)

### §8.10 设计系统小结

本章答 5 件事:
1. **设计哲学**:Minimalist Luxury · Tonal Layering + Void and Gold(§8.1)
2. **三字体三色调**:Manrope/PlusJakarta/Inter + Surface 7 档/Primary 4 档/Tertiary+Error(§8.2 + §8.3)
3. **4px Rule + 边框光阴影**:不用传统投影 · 用 1px 上边框光做层级(§8.4)
4. **60+ 设计稿索引**:9 步 / 14 工具 / aip_*/ ip_*/ _N · 落地优先用 step_*/aip_*(§8.5)
5. **组件 + 动效落地**:shadcn + Tailwind 引用 token · 动效 ≤ 600ms · Lucide 1.5px stroke(§8.6 + §8.8)

下一章(§9)进入实施路线图 + 知识库映射 + 风险护栏 · 把所有架构决策落到 P0-P8 9 个阶段。

---

## §9 实施路线图 + 知识库映射 + 风险护栏

> 本节是"如何把这份架构落地" — 把前 8 节的所有架构决策**对齐到 9 个 Phase** · 每个 Phase 给:目标 / 交付物 / 引用知识库文档 / 退出条件。
> 本节也是"开工清单" — 看完应该能知道"明天先做什么"。

### §9.1 实施总览(P0-P8 · 沿用 spec.md §11.2 框架)

> 沿用 [`aiipznt-spec.md` §11.2 复刻拆分建议](aiipznt-spec.md) 的 9 阶段骨架 · 在每个 Phase 注入 Agent 架构特有的落地任务(★ 标注本架构新增):

```
┌──────────────────────────────────────────────────────────────────┐
│ P0 · 基础设施(2 周)                                            │
│   工程骨架 + 设计系统 + 认证 + Header + ★ ContextAssembler 框架  │
├──────────────────────────────────────────────────────────────────┤
│ P1 · 数据底座(2 周)                                            │
│   13 tRPC router + DB schema + ★ BaseSpecialist 抽象类           │
├──────────────────────────────────────────────────────────────────┤
│ P2 · 首页 + 路由地图(1 周)                                     │
│   34 占位页 + Header 4 dropdown + IP 账号切换器                  │
├──────────────────────────────────────────────────────────────────┤
│ P3 · IP 主流程 9 步(3 周)★ Agent 架构主战场                    │
│   9 个 Specialist 实装 + ContextAssembler 完整版 + LLMGateway     │
├──────────────────────────────────────────────────────────────────┤
│ P4 · 创作模块(2 周)                                            │
│   /generate /analysis /video-analysis /boom-generate · 共享 Spe  │
├──────────────────────────────────────────────────────────────────┤
│ P5 · 视频模块(2 周)                                            │
│   /video-production /acquisition-video /ai-video /trending       │
├──────────────────────────────────────────────────────────────────┤
│ P6 · 私域 + 变现(1 周)                                          │
│   /monetization /private-domain                                   │
├──────────────────────────────────────────────────────────────────┤
│ P7 · 智能工具(2 周)★ 3 个 L5 自治 Agent                        │
│   /voice-chat(VoiceChatAgent)+ /deep-learning(DeepLearnAgent)│
│   ★ EvolutionAgent + DailyTaskAgent(Heartbeat 后台跑批)         │
├──────────────────────────────────────────────────────────────────┤
│ P8 · 知识库 + 静态页(1 周)                                     │
│   /knowledge /guide /present-styles + 67 案例入向量库            │
└──────────────────────────────────────────────────────────────────┘
   总周期 · 16 周(约 4 个月) · MVP 路径(P0+P1+P2+P3+P8)= 9 周
```

### §9.2 P0 · 基础设施(2 周)

| 项 | 内容 |
|---|---|
| **目标** | 工程骨架就绪 · 设计系统全量 token · 单用户能登录 |
| **交付物** | Vite + React 18 + TS · `tailwind.config.js`(从 §8 token 转换)· shadcn/ui 12 基础组件 · Google OAuth · Header 三 dropdown |
| **★ Agent 架构相关** | `BaseSpecialist` 抽象类骨架(§6.3) · `ContextAssembler` 接口框架(§6.4 · 仅 stubs)· `LLMGateway` 限流计费框架(§6.5)· `trace_id` 中间件 |
| **引用知识库** | 项目级 `~/.claude/CLAUDE.md` Coding 3.0 流程 · `reference-materials/PI-Agent设计哲学/06-从零起步PlayBook.md` · §8 Aurelian Dark |
| **风险** | tailwind v4 跟 shadcn 默认 v3 兼容性 · OAuth 回调跨域 |
| **退出条件** | 跑通 `npm run dev` + 用户能登录 + Header 三个 dropdown 显示正确 + tRPC `auth.me` 工作 |

### §9.3 P1 · 数据底座(2 周)

| 项 | 内容 |
|---|---|
| **目标** | 13 tRPC router 全部就位(空实现也行) · DB schema 全量 · LS↔DB 双写 hook |
| **交付物** | `prisma/schema.prisma` 12 实体(§3.1) · 13 个 router 骨架(返回 mock 数据) · `useStepData` / `useActiveAccount` / `useEvolution` 客户端 hook · pgvector 扩展启用 |
| **★ Agent 架构相关** | DB 表全部加 `trace_id` 字段 · `evolution_profile` `evolution_insight` `feedback_log` 表 schema 完整(为 §5 飞轮预留) |
| **引用知识库** | `11-implementation-case/07-后端API与数据模型.md` · §3 数据架构 |
| **风险** | Schema 写完后期改动成本高 · 多账号隔离漏字段 |
| **退出条件** | 跑通 50+ procedure 单元测试(全部 mock 输出) · 多账号隔离测试通过 · LS↔DB 双写 e2e 通过 |

### §9.4 P2 · 首页 + 路由地图(1 周)

| 项 | 内容 |
|---|---|
| **目标** | 全部 34 路由可访问 · 大部分是占位 · 用户能在 Header 切换 IP 账号 |
| **交付物** | 9 step 占位 + 14 工具占位 + 6 新模块占位 + 3 辅助页 · IP 账号切换器(reload+预热)· /ip-plan 进度可视化 |
| **★ Agent 架构相关** | `IPProgressService`(软 Supervisor · §4.6) · 反馈按钮 placeholder(为 P3 接入 evolve 留接口) |
| **引用知识库** | spec.md §Ⅴ 全局布局 · §Ⅵ 首页详情 · §8 设计系统 |
| **风险** | 多账号切换 reload 副作用 · 路由懒加载分块策略 |
| **退出条件** | 34 路由全部可达 · 切账号正确 · /ip-plan 显示 0/9 进度 |

### §9.5 P3 · IP 主流程 9 步(3 周)★ Agent 架构主战场

| 项 | 内容 |
|---|---|
| **目标** | 9 步全跑通 · ContextAssembler 完整版 · 9 个 Specialist 上线 |
| **交付物** | 9 步表单 + 9 步 result 渲染 + 9 步 LS 双写 · `PositioningAgent`(step1+4)· `BrandingAgent`(step3+3b)· `MonetizationAgent`(step4b)· `TopicAgent`(step5)· `VideoAgent`(step6 · shooting mode)· `CopywritingAgent`(step7 · step7 mode)· `LivestreamAgent`(step8) |
| **★ Agent 架构相关** | **本 Phase 是核心** · `ContextAssembler` 完整(读 stepData 全量 + 注入历史 step 摘要)· `LLMGateway` 限流 + 降级 + 计费 · zod schema 校验 9 个 Specialist 输出 · `feedback_log` 写入 |
| **引用知识库** | **`11-implementation-case/02-八Agent配置与Pipeline编排.md`(BaseAgent 模板方法 · 五层配置)** · `11-implementation-case/05-工具系统与LLM网关.md`(限流/熔断/降级)· `reference-materials/Prompt-Engineering实战指南.md`(每个 Specialist 的 system prompt) · §4 + §5 + §6 |
| **风险** | step4 / step7 是 markdown 字符串 · zod 校验难 · LLM 长输出超 timeout |
| **退出条件** | 9 步全部能生成结果 · /ip-plan 显示完成度 · 切账号后数据隔离 |

### §9.6 P4 · 创作模块(2 周)

| 项 | 内容 |
|---|---|
| **目标** | 4 个创作工具页上线 · 共享 Specialist 验证可行性 |
| **交付物** | `/generate`(CopywritingAgent · free mode)· `/analysis`(AnalysisAgent · structural mode)· `/video-analysis`(AnalysisAgent · viral mode)· `/boom-generate`(CopywritingAgent · boom mode)· `/history` 接入 |
| **★ Agent 架构相关** | **共享 Specialist 第一次验证** · CopywritingAgent 的 4 mode 分支 · AnalysisAgent 的 2 mode 分支 · prompt 模板按 mode 切换 |
| **引用知识库** | `05-vertical-solutions/02-viral-copywriting-agent/`(22 元素 · 20 脚本 · 文案公式) · §2.4 Specialist 共享逻辑 |
| **风险** | mode 分支让 prompt 复杂 · 测试用例量翻倍 |
| **退出条件** | 4 个页面跑通 · CopywritingAgent 4 mode 输出符合预期 · 用户能 👍/👎 |

### §9.7 P5 · 视频模块(2 周)

| 项 | 内容 |
|---|---|
| **目标** | 4 个视频工具页 · VideoAgent 4 mode + ImageGenWorker · TrendingScraper |
| **交付物** | `/video-production`(VideoAgent · production mode)· `/acquisition-video`(VideoAgent · acquisition + CopywritingAgent · acquisition)· `/ai-video`(VideoAgent · storyboard + ImageGenWorker)· `/trending`(TopicAgent · trending mode + TrendingScraper)· `/present-styles` 静态页 |
| **★ Agent 架构相关** | `ImageGenWorker`(DALL-E 3 / 文心一格)· `TrendingScraper Worker`(5 平台 · Cron 4h · pgvector 入库)· VideoAgent 4 mode · 长输出 SSE 流式 |
| **引用知识库** | `05-vertical-solutions/03-auto-video-editing-agent/` · `11-implementation-case/05-工具系统与LLM网关.md`(图像生成异步队列) |
| **风险** | TrendingScraper 法律风险(平台 robots.txt)· 图像生成成本 |
| **退出条件** | 4 个视频页跑通 · trending 入库每天 ≥100 条 · /ai-video 分镜+图全跑 |

### §9.8 P6 · 私域 + 变现(1 周)

| 项 | 内容 |
|---|---|
| **目标** | 2 个变现工具页 · 私域 6 阶段全实装 |
| **交付物** | `/monetization`(MonetizationAgent · 复用 step4b 模板)· `/private-domain`(PrivateDomainAgent · 6 stage 分支) |
| **★ Agent 架构相关** | PrivateDomainAgent 的 6 stage 模板分支 · 复用 step4b 的现有 result 结构(避免 schema 重复) |
| **引用知识库** | `05-vertical-solutions/04-intelligent-sales-agent/`(销售话术参考) · `05-vertical-solutions/05-intelligent-marketing-agent/`(私域 6 阶段) |
| **退出条件** | 2 页跑通 · 私域 6 阶段切换正确 |

### §9.9 P7 · 智能工具(2 周)★ 3 个 L5 自治 Agent

| 项 | 内容 |
|---|---|
| **目标** | 3 个 L5 自治 Agent 全部上线 · 反馈飞轮闭环 |
| **交付物** | `/voice-chat`(VoiceChatAgent + STT/TTS Worker · 多轮 · L1 Buffer)· `/deep-learning`(DeepLearnAgent + FileParser)· `/evolution` 仪表盘(EvolutionAgent + 5 级进化 + 4 指标)· `/daily-tasks`(DailyTaskAgent · Cron 0 点) |
| **★ Agent 架构相关** | **本 Phase 是产品最有创意的部分**(§5 飞轮)· EvolutionAgent 的 LLM 自主聚合 · ContextAssembler 接入 EvolutionProfile 注入 · DailyTaskAgent 0 点 Cron · VoiceChatAgent 工具循环(`get_current_step` 等 5 工具) |
| **引用知识库** | **`08-tech-decisions/架构决策记录(ADR).md` ADR-018 外部 orchestrator** · `reference-materials/AI-Agent的两种记忆范式-内部分层vs外部Issue飞轮.md` · §4.4 + §5.4 |
| **风险** | EvolutionAgent 跑批失败回滚机制 · 进化档案污染(用户反馈不一致) · 语音延迟 |
| **退出条件** | 反馈 5 次能升 L2 · 升级后用 CopywritingAgent 看到 prompt 含进化字段 · /daily-tasks 0 点能看到 3-5 任务 |

### §9.10 P8 · 知识库 + 静态页(1 周)

| 项 | 内容 |
|---|---|
| **目标** | /knowledge 全量(20 脚本 + 22 元素 + 67 案例 + 23 公式)· /guide 使用说明 · 完整方法论入向量库 |
| **交付物** | `/knowledge`(常量 + 案例 RAG 检索)· `/guide`(13 模块详解 + FAQ)· 67 案例 / 23 公式 / 22 元素心理学入 pgvector |
| **★ Agent 架构相关** | RAG 第一次完整启用 · 全部 Specialist 切到"读向量库 + 常量"组合上下文 |
| **引用知识库** | `03-rag-and-vectordb-architecture/RAG与向量数据库架构设计文档.md` · `11-implementation-case/03-RAG与ChromaDB落地实践.md` |
| **退出条件** | /knowledge 检索 67 案例正确 · CopywritingAgent 调用时确认 RAG 命中 |

### §9.X P9 · admin 子系统(9 周 · 2026-05-07 v0.3 新增 · 对应 REVIEW P1-6)

> 主应用 P0-P8 完成上线后启动 P9 系列 · admin 独立子系统的实施路线。详细见 [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) §8 实施路线图。

| Phase | 周期 | 目标 | 交付的业务管理域 |
|:-:|:-:|---|---|
| **P9.0** | 1w | admin 基础设施(★ 主应用 P8 完成后启动 · v0.4 修订 · 不再支持并行) | monorepo workspace 重构 + apps/admin 骨架 + 独立 OAuth + WAF IP 白名单 + super_admin MFA + 6 闸鉴权链 + admin_audit_log + Layout 骨架 |
| **P9.1** | 3w | 6 个 P0 业务核心域(运营/财务/法务/客服日常上线即可用) | ① 运营 NSM 仪表盘 + ② 用户管理 + ③ IP 账号管理 + ④ 成本仪表盘 + ⑤ 审计日志查询 + ⑥ 邀请码管理 |
| **P9.2** | 2w | 2 个 P0 内容审核域(防止违规内容进入主应用 RAG) | ⑦ TrendingItem 审核 + ⑧ DeepLearning 审核 |
| **P9.3** | 2w | 5 个 P1 健康度域(产品演进 + 安全闸门齐) | ⑨ 进化档案监控 + ⑩ Specialist Prompt 版本管理 + ⑪ 配额管理 + ⑫ 行业合规仪表盘 + ⑬ Approval Gates 完整闭环 |
| **P9.4** | 1w(可后续) | 3 个 P2 高级域 | ⑭ A/B 测试 + ⑮ 静态常量管理 + ⑯ 系统配置中心 |

**总周期**:9 周(P9.4 可压到后续版本 → 8 周)
**协同节奏(2026-05-07 v0.4 修订)**:**严格串行** · 主应用 P0-P8 完整 16 周 → 主应用上线 → admin P9.0 起 → ... → P9.4 → 总 **25 周**(16 + 9)
**为什么不并行(v0.4 修订)** · ralph.py 单 PROJECT_ROOT 设计 · 同项目内不能跑两个 daemon · 改全局工具(方案 B/C/D)风险高 · 接受多 1w 总周期换工具链稳定性 · 详见 [`PRD-MASTER.md §7.4 E`](PRD-MASTER.md) 4 方案对比

**主应用 P0-P8 阶段需要为 P9 做的"埋点"**:
1. **P1 数据底座** · 12 张表加 `trace_id` + admin 索引(`[industry]` `[platform]` `[level]` 等) — 给 P9.1 跨账号查使用
2. **P5 视频模块** · TrendingScraper Worker 改造 · 抓回内容进 review_queue · 不直接入向量库 — 给 P9.2 审核使用
3. **P7 智能工具** · FileParser Worker 改造 · 用户上传进 review_queue · 不直接入 DeepLearningArchive — 给 P9.2 审核使用
4. **P3-P8 全期** · LLM Gateway 输出的 cost_log + audit_log 不限 RLS · 允许 admin 跨账号 — 给 P9.1 域 ④⑤ 使用

> 这 4 项"埋点"是主应用必做的 P9 兼容性保证 · 写在主应用各 Phase 的"退出条件"里。

### §9.11 5 类护栏(贯穿全期)

> 来自 [`reference-materials/Agent安全架构与合规指南.md`](../Ai_Agent/knowledge-base/reference-materials/Agent安全架构与合规指南.md) + [`07-testing-and-evaluation/风险边界与验收标准.md`](../Ai_Agent/knowledge-base/07-testing-and-evaluation/) + [`reference-materials/Agent测试与质量保障体系.md`](../Ai_Agent/knowledge-base/reference-materials/Agent测试与质量保障体系.md) 的提炼:

#### A · 输入护栏

| 检查 | 实现 |
|---|---|
| 行业字段 | 必须命中 56 行业 · 自定义需 LLM 二次校验 |
| 文件类型 | PDF/Word/CSV/MD/TXT 白名单 · 拒绝其他 |
| 文件大小 | ≤ 20MB |
| 文本长度 | 各字段 maxLength(spec.md §ⅩⅩⅩⅣ 实测) |
| 注入检测 | 检查 prompt injection 关键词 · 命中拒绝 |

#### B · 输出护栏

| 检查 | 实现 |
|---|---|
| Schema 校验 | 全部 Specialist 输出过 zod 验证 · 失败重试 1 次 |
| 敏感行业 | 医疗 / 法律 / 金融 · 自动加底部免责声明 |
| 违禁词 | 暴力 / 政治 / 色情 / 赌博 · 服务端二次过滤 |
| 不编造 | system prompt 强制"无依据不写" · LLM 输出 fact-check |

#### C · 配额护栏

| 限制 | 实现 |
|---|---|
| 单用户 / 日 LLM 调用 | Free 50 / Pro 500 / Enterprise 5000(参 spec.md §1.5 商业模式) |
| 单次 LLM token 上限 | 16K(reasoning) / 4K(lightweight) |
| 单用户并发 | 3 同时 · Redis token bucket |
| 图像生成 / 日 | Free 5 / Pro 50 |

#### D · 行业合规

| 行业 | 处理 |
|---|---|
| 医疗 | 输出末尾自动加"本内容仅供参考 · 不构成医疗建议" |
| 法律 | 同上 + 不出具体法条引用 |
| 金融 | 同上 + 不预测具体收益 |
| PII 脱敏 | 邮箱 / 手机号 / 真实姓名 不入 prompt(替换为占位符) |

#### E · 质量护栏(测试策略 · 4 层金字塔)★ 新增

> 14 Specialist + 5 数据流 + 反馈飞轮 · 必须有完整测试体系。借用 [`reference-materials/Agent测试与质量保障体系.md`](../Ai_Agent/knowledge-base/reference-materials/Agent测试与质量保障体系.md) 测试金字塔。

```
                    ┌──────────────────┐
                    │ E2E(8-10 用例)  │   关键用户旅程
                    └──────────────────┘
                  ┌──────────────────────┐
                  │ 集成(40-60 用例)   │   tRPC + Specialist + DB
                  └──────────────────────┘
              ┌──────────────────────────────┐
              │ 单元(200+ 用例)             │   Specialist input→output
              └──────────────────────────────┘
        ┌──────────────────────────────────────────┐
        │ 静态(类型 + lint + zod schema)         │   类型安全
        └──────────────────────────────────────────┘
```

##### E.1 · 单元测试(200+ 用例 · 每 Specialist 平均 14)

| 测试对象 | 用例策略 |
|---|---|
| **每个 Specialist** | 5 个 happy path + 3 个 mode 分支 + 3 个 fallback + 3 个边界(空输入 / 超长 / 注入)= 14 用例 |
| **ContextAssembler** | 每种数据缺失组合(参 §4.4-D 6 个冷启动场景)+ 完整数据 = 8 用例 |
| **LLMGateway** | 限流 / 熔断 / 降级 / 计费 / 重试 · 各 2-3 用例 = 12 用例 |
| **常量校验** | 56 行业 / 22 元素 / 20 脚本 / 14 形式 / 6 阶段 emoji 完整性 + key 唯一性 = 5 用例 |

**Specialist 单测模板**:
```typescript
describe('CopywritingAgent', () => {
  it('step7 mode · 完整输入 · 输出含 hook/structure/cta', async () => {
    const result = await agent.run({
      mode: 'step7',
      payload: { scriptType: 'opinion', elements: ['fear'], topic: '...' }
    });
    expect(result.success).toBe(true);
    expect(zodSchema.safeParse(result.result).success).toBe(true);
  });

  it('cold start · evolution profile 空 · 走基础 prompt', async () => { ... });
  it('LLM timeout · 重试 1 次 · 降级 lightweight', async () => { ... });
});
```

##### E.2 · 集成测试(40-60 用例 · 每 Phase 5-7)

| 测试对象 | 用例 |
|---|---|
| **tRPC procedure 端到端** | 每个 procedure × (成功 + 鉴权失败 + 限流 + schema 错) = 4 用例 × 50+ procedure 抽 1/4 = 50+ 用例 |
| **5 条数据流**(§6.7) | 每条 1 happy + 1 错误恢复 = 10 用例 |
| **多账号隔离** | 用户 A 不能读用户 B 数据 · 切账号清缓存 = 5 用例 |
| **LS↔DB 双写一致性** | 离线写 / 网络抖动 / 切账号 / 多 tab 冲突 = 6 用例 |

##### E.3 · E2E 测试(8-10 用例 · 关键旅程)

| 旅程 | 验证点 |
|---|---|
| 新用户注册 → step1 → step3 → step7 → 看到结果 | 5 步主线打通 |
| 用户做 5 次 👍 → 升 L2 → 再用 step7 → prompt 含 evolution | 反馈飞轮闭环 |
| 用户开 voice-chat → 多轮 → 挂断 → L1 Buffer 清空 | 多轮对话正确 |
| 用户做完 8 步诊断 → 跳推荐 step | 诊断引导正确 |
| 多账号切换 → 数据隔离 | 安全护栏 |

##### E.4 · LLM 输出质量评测(LLM-as-Judge · 持续运行)

> 静态测试不能保证"LLM 输出**好**" · 需要**质量评测层**:

| 评测维度 | 实现 |
|---|---|
| **结构完整性** | zod schema 100% 通过(否则视为失败) |
| **内容相关性** | 用 GPT-4o 当 Judge · 对 100 个金标准输入打分(1-5) · 阈值 4.0 |
| **风格一致性** | 同一 Specialist 同 mode 多次输出 · 相似度 ≥ 0.7 |
| **进化有效性** | 进化前 vs 进化后 · 用户偏好金句出现率 ≥ 60% |
| **回归测试** | 每次 prompt 改动跑全量金标准 · 评分不下降 |

##### E.5 · CI/CD 集成

```
git push → CI ·
  ① 静态(tsc + eslint + zod schema 提取校验)
  ② 单元(jest/vitest · 5 min)
  ③ 集成(supertest + 测试 DB · 10 min)
  ④ E2E(playwright · 主链路 · 15 min)
  ⑤ LLM Judge(夜跑 · 100 金标准 · 30 min)
  ─────
  全过关 → 自动合并主干
```

> ⚠️ **质量护栏的硬约束**:任何 Specialist 输出**必须过 zod 校验** + 每次 prompt 改动**必须跑 LLM Judge**(回归保护)。这是反馈飞轮稳定的前提 — 否则进化的"好"无从衡量。

### §9.12 与 Coding 3.0 工作流的协同

> 项目根目录 [`CLAUDE.md`](CLAUDE.md) 已声明本项目用 Coding 3.0(全局 `~/.claude/CLAUDE.md`)。本架构跟 Coding 3.0 的协同建议:

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1 · /prime  →  AI 加载本仓库上下文                    │
│  Step 2 · /create-rules  →  生成 AGENTS.md(基于本架构)     │
│            └─ 本 ARCHITECTURE.md 是 AGENTS.md 的"理论源头"  │
│  Step 3 · prd skill  →  按 P0-P8 写 9 个 PRD                │
│  Step 4 · ralph skill  →  PRD → prd.json                    │
│  Step 5 · ralph.py  →  Ralph 自主执行循环                   │
│  Step 5.1 · /monitor-ralph  →  Opus 审计监测                │
│  Step 5.5 · Opus 审计  →  审 4 维度(本架构提供契约依据)   │
│  Step 6 · dashboard  →  监控进度                            │
│  Step 7 · /goal-verify  →  跟本架构对账(每 Phase 退出条件) │
│  Step 8 · /prd-retro  →  跨 PRD 复盘                        │
└─────────────────────────────────────────────────────────────┘
```

**关键协同点**:
1. **AGENTS.md 由本文件派生** · `/create-rules` 时把本文件 §4 + §6 的契约转成"代码层"的 AGENTS.md(设计约束)
2. **Opus 审计参照本架构** · §6 的接口契约 + §9.11 护栏 是审计 4 维度的"AC 来源"
3. **反馈飞轮 ↔ Coding 3.0 的 audit gate** 类比 · 都是"外部 orchestrator 续命"模式 · ADR-018 共用

### §9.12b 成本量级估算(让选型有量感)★ 补充

> 详细 ADR 不在骨架里 · 但**量级感**对架构决策很关键。下表用一组 napkin math 给一个粗估 · 实际上线前需更精细测算。

#### 假设(Claude Sonnet 4.6 价 · 2026-05)

```
LLM 价格(Sonnet 4.6) · $3/M input · $15/M output
图像生成(DALL-E 3) · $0.04/张(1024×1024)
Whisper STT · $0.006/min
TTS · $15/M chars
```

#### 单用户日均成本(中度活跃 · MVP 配置)

| 类别 | 频次 | Token / 单次 | 成本 |
|---|:-:|---|---|
| Specialist 调用(reasoning) | 5 次/日 | 6K input + 2K output | $0.09 + $0.30 = **$0.39** |
| Specialist 调用(lightweight) | 3 次/日 | 4K input + 1K output | $0.012 + $0.015 ≈ **$0.027** |
| 图像生成(/step/3 / /ai-video) | 0.5 次/日(均摊) | — | **$0.02** |
| Voice chat(每周用 1 次 · 3 min) | — | — | **$0.01** |
| **单用户日均** | — | — | **≈ $0.45** |
| **单用户月均** | — | — | **≈ $13.5** |

#### 100 用户 / 1000 用户 / 10000 用户量级

| 用户规模 | LLM 月成本 | 图像 / 音频 | 数据库 / 主机 | 月总 | 单用户月成本 |
|---|---|---|---|---|---|
| **100 中度活跃** | $1,200 | $200 | $100(Supabase + Vercel) | **$1,500** | $15 |
| **1,000 中度活跃** | $12,000 | $2,000 | $500 | **$14,500** | $14.5 |
| **10,000 中度活跃** | $120,000 | $20,000 | $5,000(切自建 K8s) | **$145,000** | $14.5 |

#### 价格策略支撑

```
按 spec.md §1.5 商业模式假设 ·
  Free 套餐 · 不亏本(限额到 $0)· 拉新
  Pro 套餐 · 假设 ¥99/月 ≈ $14 · 跟单用户成本持平 · 不赚钱(用以换转化)
  Enterprise · 假设 ¥999/月 ≈ $140 · 利润率约 90%
                  ↓
策略 · 用 Free + Pro 拉量 · 用 Enterprise 赚钱
```

> ⚠️ **量级风险**:
> 1. 长输出(step3/4b 16KB)拉高 output token · 实际可能比上面贵 30%
> 2. 进化飞轮跑批(EvolutionAgent · L4 大用户每周一次)是隐性成本 · 上表未含
> 3. trending 抓取若选 §9.13b A/B 方案 · 月费 ¥5k-30k 是固定成本

### §9.13 风险全景与缓解

| 风险类别 | 具体风险 | 严重度 | 缓解 |
|---|---|:-:|---|
| **架构** | Specialist 共享导致 prompt 复杂(mode 分支多) | 中 | 每个 mode 独立测试用例 · prompt 模板分文件 |
| **架构** | ContextAssembler 拉数据慢(每次调用前并行 6 路) | 中 | Redis 热缓存 EvolutionProfile · React Query 缓存 stepData |
| **数据** | 多账号隔离泄露(SQL 漏 WHERE) | **高** | ORM 强制 + Postgres RLS + 单元测试 |
| **数据** | LS↔DB 不一致(前后端 schema 漂移) | 中 | 共享 zod schema · CI 校验 |
| **AI** | LLM 长输出(step3/4b)超时 | 中 | SSE 流式 · 超时 60s+30s 重试 |
| **AI** | 进化档案污染(用户反馈不一致) | 低 | EvolutionAgent 加冲突检测 · 标 fallback |
| **AI** | LLM 幻觉(编造数据) | 中 | system prompt 强约束 + 输出 fact-check 关键字段 |
| **成本** | trending 抓取 + 图像生成成本失控 | 中 | 限流 + Free 套餐限额 + 图像 prompt 缓存 |
| **法律** | trending 抓取违反平台 ToS | **高** | **见 §9.13b 三选一具体方案** |
| **合规** | 医疗 / 法律内容产生事故 | 中 | 自动免责声明 + 关键词触发免责 |

### §9.13b · trending 抓取的 3 种合规方案(P5 上线前必选其一)

> §9.13 列了"trending 抓取违反平台 ToS"为**🔴 高严重度**风险 · 本节给出 3 个具体方案。**P5 启动前必须法务确认其一**。

| 方案 | 实施 | 优势 | 劣势 |
|---|---|---|---|
| **A · 官方 API**(推荐 P0) | 抖音开放平台 / 小红书企业 API / B 站 OpenAPI(部分支持) | 100% 合规 · 长期稳定 | 申请门槛(需企业资质 / 部分仅蓝 V)· 数据有限制(部分字段不开放) |
| **B · 第三方授权数据**(推荐 MVP) | 接入新榜 / 蝉妈妈 / 飞瓜数据 API · 付费授权 | 合规 · 数据全 · 即开即用 | 月费 ¥5k-30k · 增加成本 |
| **C · 自建爬虫 + UA + 代理**(最危险) | 模拟用户 + 代理池 + 限流 | 0 授权成本 · 数据自由 | **违反 robots.txt + 平台风控 · 法律风险高** · 不推荐 |

**本架构推荐路径** ·
```
MVP 阶段(P5 上线时)· 选 B(新榜/蝉妈妈)· 月费换 0 法律风险
扩展期(用户上量后) · 切换 A(官方 API · 申请下来后接入)
长期        · A 为主 · B 为补
```

> ⚠️ **绝不** 在生产环境使用 C 方案 · 即使初期为了省钱。一旦被平台识别封 IP 或起诉,损失远超授权费。

### §9.14 MVP 路径推荐(5 周可上线)

> 如果只能做"MVP 验证产品" · 选下列子集 · ⚠️ **从原 4 周修正为 5 周**(P3 5 个 Specialist + ContextAssembler 完整版 0.5 周做不完):

```
P0 基础设施(2 周)
   ↓
P1 数据底座(精简 · 只做 5 个核心 router · 1 周)
   ↓
P2 首页 + 路由地图(精简 · 只做主流程 9 步占位 · 0.5 周)
   ↓
P3 IP 主流程 5 步(step1/3/3b/4b/7 · 1.5 周)★ 修正
   · 5 个 Specialist · 平均 1.5 天/个
   · ContextAssembler 完整版 · 1 天
   · LLMGateway 限流 + 降级 + 计费 · 1 天
   · zod 校验 + 错误处理 · 1 天
   · e2e 联调 · 1 天
   ↓
P8 知识库 · 静态化(67 案例直接写常量 · 不入向量库)(精简 · 0 周 · 跟 P3 并行)
─────
合计 5 周 · 跑通主链路
─────

P3 跳过的 4 步(step4/5/6/8)+ P4-P7 全部 + P8 完整 → 后续 11 周补全
全程预估 · 16 周(全功能版本)
```

### §9.15 实施路线图小结

本章答 5 件事:
1. **9 阶段拆分**:P0-P8 · 总周期 16 周(MVP 4 周)(§9.1)
2. **每个 Phase 5 维度**:目标 / 交付物 / Agent 架构相关 / 引用知识库 / 退出条件(§9.2-§9.10)
3. **4 类护栏**:输入 / 输出 / 配额 / 合规 · 贯穿全期(§9.11)
4. **Coding 3.0 协同**:本架构 → AGENTS.md → PRD → Ralph → 反馈飞轮 → audit gate(§9.12)
5. **MVP 路径**:P0+P1+P2+P3(5 步)+P8(精简) · 4 周可上线(§9.14)

---

## 全文小结

> 本架构骨架共 9 章 · 答了 9 个核心问题:

| § | 章节 | 核心结论 |
|:-:|---|---|
| §1 | 系统总览 | QuanQn = aiipznt 形态 + 知识库哲学 + Aurelian Dark · 三位一体 |
| §2 | 业务模型 | 9 步主线 + 14 工具(共享 Specialist)+ 6 新模块 + 反馈飞轮 |
| §3 | 数据架构 | 12 实体(IpAccount 聚合根)+ 13 router + 18 LS keys + RAG/常量分明 |
| §4 | Agent 编排 | **95% Workflow + 5% Agent · 14 能力域 Specialist · 三层编排 + 软 Supervisor** |
| §5 | 记忆 + 飞轮 | 5 层记忆(Buffer/Core/Recall/Profile/Trending)+ Issue 飞轮 5 阶段 + ContextAssembler 注入 |
| §6 | 接口契约 | tRPC 6 关键契约 + BaseSpecialist + 5 条端到端时序图 + Trace 贯穿 |
| §7 | 案例对照 | 跟 11/02 借接口不借粒度 · 跟 05-vertical 借知识不借流程 · 14 是甜点 |
| §8 | 设计系统 | Aurelian Dark · Manrope/PlusJakarta/Inter · Surface 7 档/Primary 4 档 · 60+ 设计稿 |
| §9 | 实施路线图 | P0-P8 16 周(MVP 4 周) · 4 类护栏 · Coding 3.0 协同 |

> **下一步建议**:
> 1. 跑 `/create-rules` 把本架构 §4+§6 转成 `AGENTS.md`(代码层设计约束)
> 2. 用 `prd skill` 写 P0 PRD · 启动 Coding 3.0 流程
> 3. **本架构是 v0.1 骨架** · 后续配套 ADR.md / DATA-MODEL.md / PROMPTS.md / DEPLOY.md(详细展开)

---

## 修订记录

- **2026-05-06 v0.1** · 创建骨架 + 9 章节全部填充完成
  - §1 系统总览(184 行)
  - §2 业务模型(226 行)
  - §3 数据架构(256 行)
  - §4 Agent 编排架构(426 行 · 核心)
  - §5 记忆系统 + 进化飞轮(337 行)
  - §6 接口契约与数据流(456 行 · 含 5 条时序图)
  - §7 多 Agent 案例对照(269 行)
  - §8 UI/UX 设计系统(312 行)
  - §9 实施路线图 + 知识库映射 + 风险护栏

- **2026-05-06 v0.2** · 全链路 review-and-fix(16 处问题全部修复)
  - 🔴 P0(2 处事实硬伤)
    - §3.2 路由组数 · 13 → 13+2=15(加 trending + invite)
    - §3.9 实体数 · 12 → 15(其中 12 按 account_id 隔离)
  - 🟠 P1(5 处重要遗漏)
    - §4.4-D 新增 · 6 个冷启动场景全集 + 统一降级原则
    - §6.8 加 · stepData 并发冲突乐观锁 + EvolutionAgent 原子事务 + dead-letter 降级
    - §9.11-E 新增 · 5 类质量护栏(测试金字塔 + LLM-as-Judge + CI/CD)
    - §9.13b 新增 · trending 抓取 3 种合规方案(官方 API / 第三方授权 / 自建爬虫)
    - §9.14 修正 · MVP 4 周 → 5 周(P3 估算偏乐观)
  - 🟡 P2(9 处润色)
    - §2.2 注解 · 9 path / 8 业务功能 术语澄清
    - §2.5b 新增 · /admin/invite-manage 管理后台
    - §3.5 标 · step6/step8 schema 是推断(sally 实测 lastResult=null)
    - §4.4-A 修正 · VoiceChat 工具 4 → 5(加 get_evolution_insights)
    - §5.2 注解 · trending 频率"每 4 小时"是建议非实测
    - §6.9 加 · Trace 实现栈(Postgres MVP / OTel 规模化)
    - §8.1 注解 · DESIGN.md 双重金色定义 · 以 YAML 为权威
    - §9.12b 新增 · 成本量级估算(单用户月均 $13.5 · 三档规模)
  - 累计 · 8 处新增段落 + 8 处修正 · 总行数 2775 → ~3100
