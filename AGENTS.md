# QuanQn · 代码层设计约束(AGENTS.md)

> **版本** · v0.2(2026-05-06 创建 · 2026-05-07 v0.2 修订:§10 admin 5 LD-A + 6 R-A + 14 高风险 + 5 audit_commands)
> **派生自** · [ARCHITECTURE.md](ARCHITECTURE.md) v0.4 + [ADMIN-ARCHITECTURE.md](ADMIN-ARCHITECTURE.md) v0.2 · §4 Agent 编排 + §6 接口契约 + §3 数据架构
> **服务对象** · Ralph Agent / Opus Audit / 任何 AI / 工程师在本仓库写代码时遵循
> **硬约束** · 本文件的 Locked Decisions / 红线 / audit_commands 是**不可绕过**的 — 即使 Ralph 觉得"这样更好"也不能违反 · 必须先改本文件再改代码
>
> **配套文档** · [ARCHITECTURE.md](ARCHITECTURE.md)(架构骨架)· [ADR.md](ADR.md)(决策详情)· [DATA-MODEL.md](DATA-MODEL.md)(Prisma schema)· [PROMPTS.md](PROMPTS.md)(14 Specialist prompt)

---

## 文档地图

| § | 章节 | 一句话 |
|:-:|---|---|
| §1 | **Mission** | 复刻 aiipznt 形态 · 引入知识库 Agent 哲学 · 用 Aurelian Dark 重塑视觉 — 三位一体 |
| §2 | **Tech Stack(技术栈锁定)** | Vite + React + Tailwind + tRPC + Postgres + pgvector + Claude Sonnet 4.6 — 不允许变更 |
| §3 | **Locked Decisions** | 18+ 条架构决策(95% Workflow / 14 Specialist / 5 层记忆 / 反馈飞轮 / 等) |
| §4 | **设计约束(How to design)** | 模块切分原则 / Agent 切分原则 / 数据隔离铁律 / 接口契约规范 |
| §5 | **红线(What NOT to do)** | 不允许的 17 种行为(直接 LLM 调用 / 跨账号读取 / 编造 schema / 等) |
| §6 | **编码规范** | 命名 / 文件组织 / 错误处理 / 类型 / 注释 |
| §7 | **测试要求** | 测试金字塔(静态/单元/集成/E2E)+ LLM-as-Judge + 覆盖率门槛 |
| §8 | **audit_commands** | Opus 审计的 grep / pytest / typecheck / lint 命令清单 |
| §9 | **上下文加载顺序(LLM 入仓必读)** | 进入仓库时按这个顺序读 · 让 LLM 快速建立心智模型 |

---

## §1 Mission

### §1.1 产品使命(一句话)

> **善用 AI · 你一个人就是千军万马** — 把"做 IP / 上短视频 / 私域成交"全链路拆成 9 步 AI 向导 + 14 个独立工具 · 让个人 IP 起号者 / OPC 创业者 / 传统行业转型者 / MCN 团队 用 AI 替代营销部全职岗。

### §1.2 北极星指标(NSM)

> 单一最重要的指标 · 决定产品是否成功:

```
NSM · 「活跃 IP 账号数」(7 天内有 ≥ 1 次 Specialist 调用 + 完成 ≥ 3/9 步)

子指标 ·
  · 完成 9 步比例(主流程跑通率)· 目标 > 30%
  · 反馈率(👍/👎 点击率 / 生成次数)· 目标 > 40% · 决定飞轮燃料
  · 进化升级率(新用户 30 天内升 L2)· 目标 > 60% · 验证飞轮
  · 月留存(D30 / 注册)· 目标 > 25%
```

### §1.3 服务对象(4 类用户)

> 详见 [ARCHITECTURE.md §1.6](ARCHITECTURE.md)。本节强调 · **代码中所有功能必须能服务这 4 类**:

| 用户画像 | 占比目标 | 关键诉求 |
|---|:-:|---|
| **个人 IP 起号者**(0-1k 粉) | 50% | 从 0 起号 · 出爆款 |
| **OPC 创业者**(单人公司) | 25% | 单人撬动百万营收 |
| **传统行业转型者** | 15% | 从线下到线上 · 重塑人设 |
| **MCN / 品牌方**(矩阵) | 10% | 矩阵效率 · 数据沉淀 |

### §1.4 不做的事(范围排除 · 防止 scope creep)

> 这些功能在产品长期路线图里 · 但**当前迭代不做** · Ralph 不允许实现:

| ❌ 不做 | 理由 |
|---|---|
| 真实视频生成(MP4 输出) | 仅生成"分镜表 + prompt" · 视频用第三方剪辑工具 · 详见 ARCHITECTURE §2.4 备注 |
| 多人协作 / 团队版 | 1.0 是个人 IP · 团队版进 2.0 |
| 移动 App(iOS/Android 原生) | 1.0 用 PWA 替代 · 原生进 2.0 |
| 直播实时挂件 / OBS 插件 | 1.0 仅生成话术 · 实时投屏进 2.0 |
| 跨平台一键发布(自动发抖音/小红书) | 平台 API 限制 + 法律风险 · 1.0 仅"生成内容 · 用户手动发" |
| 用户自定义 LLM 模型(自带 API Key) | 复杂度高 · 不在 MVP |
| 实时翻译 / 多语言 UI | 1.0 仅中文 · 出海版进 2.0 |

### §1.5 成功标准(MVP 5 周后退出条件)

> Ralph 跑完 P0 + P1 + P2 + P3(5 步)+ P8(精简) · 必须达成:

| 类别 | 标准 |
|---|---|
| **功能完整性** | 一个新用户能从注册 → step1 → step3 → step3b → step4b → step7 全跑通 · 看到 5 个 result |
| **数据正确性** | 多账号切换 · 数据 100% 隔离(自动测试通过) |
| **AI 质量** | 5 个 Specialist 输出过 zod 100% 校验 · LLM-Judge 评分 ≥ 4.0/5 |
| **反馈飞轮** | 用户做 5 次 👍/👎 后 · ContextAssembler 注入的 prompt 可见包含 EvolutionInsight |
| **测试覆盖** | 单元 ≥ 50 用例 · 集成 ≥ 15 用例 · E2E ≥ 3 用例(主链路) |
| **可观测性** | 每次 Specialist 调用有 trace_id · 全栈可追溯 |
| **成本可控** | 单用户日均 < $0.5 LLM 成本 · 详见 [ARCHITECTURE.md §9.12b](ARCHITECTURE.md) |
| **设计还原** | UI 跟 60+ 设计稿 ≥ 80% 一致 · Aurelian Dark 设计系统 100% 落地 |

### §1.6 项目原则(贯穿所有代码决策)

> 当 Ralph 遇到设计抉择时 · 按以下原则排序:

1. **架构透明 > 抽象封装** · 宁可代码长 · 也要让"谁调谁"一眼看清(参 ARCHITECTURE §1.7 第 2 条)
2. **Schema 严格 > 灵活** · 所有 LLM 输出过 zod 校验 · 不允许"any" type 兜底(§5 红线)
3. **多账号隔离 > 性能** · 任何 SQL/Redis/LS/向量库都带 account_id · 否则不合并(§4 数据隔离铁律)
4. **能力域共享 > 页面独立** · 4 个 Workflow 能共享 1 个 Specialist 时必须共享(§4.3 切分原则)
5. **Workflow > Agent** · 默认走 Workflow · 只有真"系统/LLM 主动"才用 Agent(§4.1 二分法)
6. **常量 > RAG** · 30KB 以内的数据走常量 · 不入向量库(§3.6 RAG 边界)
7. **测试覆盖 > 完成度** · 写代码必带单元测试 · 不写测试视为未完成(§7 测试要求)

### §1.7 与 ARCHITECTURE.md 的边界

> ARCHITECTURE.md 是"**做什么 / 为什么**"(架构骨架)
> 本文件(AGENTS.md)是"**怎么做 / 不能做什么**"(代码层约束)
> 区别 · ARCHITECTURE.md 改不会让代码报错 · 本文件红线触犯会被 Opus 审计 reject

---

## §2 Tech Stack(技术栈锁定)

> ⚠️ **本节是 LOCKED**(锁定) · 任何变更必须先开新 ADR 走完决策流程 · 才能改本表 · 才能改代码。
> 命名规范 · 包名 / 主版本 / 用途备注 · **次版本不锁**(允许 patch / minor 升级)。

### §2.1 前端栈

| 层 | 锁定包 | 主版本 | 用途 | 备选 / 升级方向 |
|---|---|:-:|---|---|
| 渲染框架 | `react` + `react-dom` | **18.x** | 不允许跳到 19(Concurrent rendering 暂不需要) | (锁) |
| 路由 | `react-router-dom` | **6.x** | SPA 路由 · 客户端 | wouter(实测原版用) · 但本架构选 react-router 更主流 |
| 构建 | `vite` | **5.x** | dev / build / HMR | (锁) |
| TS | `typescript` | **5.4+** | 严格模式 · `strict: true` | (锁) |
| 样式 | `tailwindcss` | **3.4+** | 不用 v4(spec.md 实测原版 v4 但 shadcn 兼容性问题) | v4(待 shadcn 官方支持) |
| 组件库 | `@shadcn/ui`(via copy)+ `@radix-ui/react-*` | latest | shadcn 不是 npm 包 · 用 CLI 复制 | (锁) |
| 数据获取 | `@tanstack/react-query` | **5.x** | tRPC 客户端依赖 | (锁) |
| 状态管理 | `zustand` | **4.x** | 全局状态(IpAccount 切换 · L1 Buffer 客户端镜像) | jotai(若需要细粒度) |
| API 客户端 | `@trpc/client` + `@trpc/react-query` | **11.x** | 类型安全 RPC | (锁) |
| 表单 | `react-hook-form` + `@hookform/resolvers/zod` | **7.x** | 必带 zod 校验 | (锁) |
| 验证 | `zod` | **3.23+** | 全栈 schema 共享 · 前后端唯一真理 | (锁) |
| 图标 | `lucide-react` | latest | 1.5/2px stroke · 不用 filled | (锁) |
| 字体 | `@fontsource/manrope` + `@fontsource/plus-jakarta-sans` + `@fontsource/inter` | latest | 自托管 · 不依赖 Google Fonts CDN | (锁) |
| 富文本渲染 | `react-markdown` + `streamdown`(可选) | latest | step4/step7 markdown 输出 | (锁) |
| 流式 | `@trpc/server` 内置 SSE(observable)+ React 18 Suspense | — | step3/4b/7 流式输出 | WebSocket subscription(后期) |

### §2.2 后端栈

| 层 | 锁定包 | 主版本 | 用途 | 备选 / 升级方向 |
|---|---|:-:|---|---|
| Runtime | Node.js | **20 LTS** | 不用 Bun(Specialist 需要稳定的 worker_threads) | Bun(运行时稳定后) |
| Framework | `hono` | **4.x** | 轻量 + Edge 兼容 + 性能好 | Express(若团队不熟 hono) |
| RPC | `@trpc/server` | **11.x** | 类型安全 + 跟客户端版本一致 | (锁) |
| ORM | `prisma` | **5.x** | DB schema 单一来源 + Migration | drizzle(性能优先时) |
| 队列 | `bullmq` + `ioredis` | **5.x** + **5.x** | EvolutionAgent / DailyTaskAgent / ImageGen 异步任务 | (锁) |
| 调度 | `node-cron` | **3.x** | DailyTaskAgent 每日 0 点 · TrendingScraper 4 小时 | (锁) |
| 日志 | `pino` + `pino-pretty` | **9.x** | 结构化日志 + trace_id 贯穿 | (锁) |
| 限流 | `@upstash/ratelimit` 或自建(token bucket on Redis) | latest | LLMGateway 限流 | (锁) |
| OAuth | `lucia-auth` 或 `next-auth`(若选 Next) | latest | Google OAuth · 推荐 lucia(轻量) | (锁) |

### §2.3 数据存储

| 层 | 锁定栈 | 用途 | 备注 |
|---|---|---|---|
| 主库 | **PostgreSQL 16** | 关系数据 · 15 实体 · 12 实体按 account 分区 | 用 Supabase 托管 · 自管 PG 也行 |
| 向量库 | **pgvector**(PG 扩展) | 67 案例 / 23 公式 / 22 元素 / trending / user_samples | 不引入 Qdrant · 复用主库 · 量上去后再说 |
| 缓存 | **Redis 7+** | session / 限流 / Trending hot cache(TTL 1h) / EvolutionProfile hot cache(TTL 5min) / L1 Buffer | Upstash Redis(MVP) · 自管(规模化) |
| 文件 | **S3 / 阿里 OSS / Supabase Storage** | 用户上传 ≤ 20MB · AI 生成图片 · 语音录音 | (锁) |
| 浏览器 | **localStorage**(18 keys) + **sessionStorage**(pendingInviteCode) | 双写镜像 · 详见 ARCHITECTURE §3.3 | (锁) |

### §2.4 AI 模型层

| 角色 | 主选 | 备选(降级) | 用途 |
|---|---|---|---|
| **reasoning(推理级)** | `claude-sonnet-4-6`(Anthropic API) | `gpt-4o`(OpenAI) | 11 个生成型 Specialist · 中文长输出稳定 |
| **lightweight(轻量级)** | `claude-haiku-4-5`(Anthropic) | `gpt-4o-mini`(OpenAI) | AnalysisAgent / DailyTaskAgent / DeepLearnAgent |
| **图像生成** | `dall-e-3`(OpenAI) | `mj-api`(Midjourney) / `wenxin`(百度文心) | step3 头像 / 背景 · /ai-video 分镜场景图 |
| **STT** | `whisper-large-v3`(OpenAI 或自部署) | 阿里云 STT(国内合规) | VoiceChat 语音转文字 |
| **TTS** | OpenAI TTS(`tts-1-hd`) | 火山引擎(国内) / Azure | VoiceChat 文字转语音 |
| **embedding** | `text-embedding-3-small`(OpenAI · 1536 维) | bge-m3(国内自部署) | RAG · 67 案例 / trending / 用户样本 |

> ⚠️ **降级策略由 LLMGateway 自动处理** · 应用代码不直接选模型 · 只指定 `model_tier: 'reasoning' | 'lightweight'`(详见 [ARCHITECTURE.md §6.5](ARCHITECTURE.md))。

### §2.5 部署 / 运维

| 类别 | MVP 选择 | 规模化(>1k 用户)切换 | 备注 |
|---|---|---|---|
| 前端托管 | **Vercel** 或 **Cloudflare Pages** | 自建 K8s | (锁 MVP 二选一) |
| 后端托管 | **Railway** 或 **Fly.io** | 自建 K8s + auto-scale | (锁 MVP 二选一) |
| DB 托管 | **Supabase** 或 **Neon** | 自建 PG + Patroni HA | Supabase 含 pgvector + Auth 一体 · 优先 |
| 监控 | **Postgres `audit_log` + Loki + Grafana**(MVP) | OpenTelemetry + Tempo | 详见 ARCHITECTURE §6.9 |
| 错误追踪 | Sentry | (同) | 配置 trace_id 关联 |
| Analytics | Plausible(实测原版用 · 隐私友好) | + Amplitude(漏斗) | 详见 spec.md §ⅩⅬⅧ |
| 邮件(可选) | Resend | (同) | 邀请码 · 重要提醒 |
| CDN | Vercel / CF 自带 | (同) | 静态资源 · 图片 |

### §2.6 包管理 + 工具链

| 项 | 锁定 |
|---|---|
| 包管理 | **`pnpm`**(monorepo 友好 + 速度) |
| Node 版本 | `.nvmrc` 写 `20`(锁定 LTS) |
| Lint | `eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y` |
| Format | `prettier` + `prettier-plugin-tailwindcss`(自动排序 className) |
| 类型 | `typescript` strict + `noUncheckedIndexedAccess: true` |
| Test runner | `vitest`(单元/集成)+ `playwright`(E2E) |
| Pre-commit | `husky` + `lint-staged` |
| CI | GitHub Actions |

### §2.7 任何变更必须走 ADR

> 本节列的任何技术栈选择 · 即使是"小改"(比如把 zustand 换 jotai),都**必须**:
> 1. 写新 ADR(参 ADR.md 模板)
> 2. 列 Context / Options / Decision / Consequences
> 3. Opus 审计通过
> 4. 才能改本表 · 才能改代码

> ❌ **绝不允许**:Ralph 自己决定换包(比如"我觉得 trpc 不如 graphql · 切了" · 必 reject)
> ✅ **允许**:patch / minor 版本升级(react 18.2.0 → 18.3.1 · 不用 ADR · 但要测试)

---

## §3 Locked Decisions(18 锁定决策)

> 本节是 **AGENTS.md 的核心** · 18 条 Locked Decisions(LD-001 ~ LD-018)是不可绕过的硬约束。
>
> 每条 LD 格式 · `标题 / 决策陈述 / 派生 ADR / 违规检测 / 例外条件`。
> 每条 LD 对应 [ADR.md](ADR.md) 一个 ADR(详细 Context / Options / Decision / Consequences)。
>
> **如何使用**:
> - **Ralph 写代码前**:扫一遍 §3 · 确认不违反任何 LD · 否则停下问
> - **Opus 审计时**:逐条 LD 跑"违规检测"命令 · 任一失败 → reject
> - **新增 LD**:必须先写 ADR · 通过 review 后追加到本节

### §3.1 编排架构(LD-001 ~ LD-003)

#### 🔒 LD-001 · 编排范式 95/5(Workflow vs Agent)

| 项 | 内容 |
|---|---|
| **决策** | 项目按节点分类执行范式:**95% 走 Workflow Command**(用户主动 · 单次 LLM)· **5% 走 Agent**(系统主动 · 多轮 / Heartbeat)。3 个 L5 自治 Agent 是 VoiceChat / Evolution / DailyTask · 其余全部 Workflow。 |
| **派生** | ADR-001(编排范式) · ADR-002(三层编排 L4-L7) |
| **理论基础** | [reference/PI/03 Workflow vs Agent 二分法](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md) |
| **违规检测** | grep "while.*llm.complete" `src/agents/` · 找循环调 LLM 的代码 → 必须是 3 个 L5 之一 · 否则 reject |
| **例外** | 无 · 任何 Specialist 不允许内部多轮 LLM 调用 · 多轮场景必须走 L5 |

#### 🔒 LD-002 · 14 能力域 Specialist 切分(不按 URL 一对一)

| 项 | 内容 |
|---|---|
| **决策** | 共 **14 个 Specialist**(11 生成型 + 3 自治型)· 按能力域归并 · **不允许**给每个 URL 写独立 Specialist。例 · `step7` `/generate` `/boom-generate` `/acquisition-video` 共享 `CopywritingAgent`(mode 分支)。 |
| **14 个清单** | PositioningAgent · BrandingAgent · MonetizationAgent · TopicAgent · CopywritingAgent · VideoAgent · LivestreamAgent · PrivateDomainAgent · AnalysisAgent · DiagnosisAgent · DeepLearnAgent · VoiceChatAgent · EvolutionAgent · DailyTaskAgent |
| **派生** | ADR-003(Specialist 切分原则) |
| **违规检测** | `ls src/agents/specialists/*.ts` · 必须 ≤ 14 个 + 命名匹配清单 · 否则 reject |
| **例外** | 新增 Specialist 必须先开 ADR · 给"为什么 14 不够"的论证 |

#### 🔒 LD-003 · 协作模式 Centralized + 软 Supervisor

| 项 | 内容 |
|---|---|
| **决策** | Specialist 之间**0 直接调用** · 协作通过 ContextAssembler(prompt 注入)+ EvolutionAgent(异步飞轮)。**禁止** Specialist A 在 execute 中调 Specialist B。 |
| **派生** | ADR-004(协作模式选 Centralized) |
| **违规检测** | grep "specialists\." `src/agents/specialists/*.ts` · 找互相调用 · 命中 reject |
| **例外** | DeepLearnAgent 写 EvolutionProfile 是合法的(写记忆 · 不是调用 Agent) |

### §3.2 自治 Agent + 共享配置(LD-004 ~ LD-005)

#### 🔒 LD-004 · 3 L5 自治 Agent 走外部 orchestrator

| 项 | 内容 |
|---|---|
| **决策** | VoiceChatAgent / EvolutionAgent / DailyTaskAgent 必须用 **ADR-018 外部 orchestrator 模式** · 不允许 LLM 自己跑循环。VoiceChat = 用户驱动 · Evolution = Cron / 手动触发 · DailyTask = 0 点 Cron。 |
| **派生** | ADR-005(L5 自治范式 · 引用 ADR-018) |
| **违规检测** | EvolutionAgent / DailyTaskAgent 必须由 `bullmq` 任务触发(grep "evolution.queue.add" 等 enqueue 调用) · 不允许从 tRPC procedure 直接同步调 |
| **例外** | VoiceChatAgent 是流式 · 由用户每说一句触发(也是外部 orchestrator) |

#### 🔒 LD-005 · BaseSpecialist 抽象 + 五层配置

| 项 | 内容 |
|---|---|
| **决策** | 全部 14 Specialist 必须继承 `BaseSpecialist` 抽象类 · 必须实现 `execute()` 方法 · 必须声明 `SpecialistConfig`(persona / memory / knowledge / tools / execution 五层) · 调用入口走 `run()` 模板方法。 |
| **借鉴** | [11-implementation-case/02-八Agent配置与Pipeline编排.md §3 BaseAgent](../Ai_Agent/knowledge-base/11-implementation-case/02-八Agent配置与Pipeline编排.md) |
| **派生** | ADR-003(同 LD-002) |
| **违规检测** | 每个 Specialist 文件必须 `extends BaseSpecialist` · 必须导出 `config: SpecialistConfig` · 单元测试必跑 |
| **例外** | 无 |

### §3.3 记忆 + 飞轮(LD-006 ~ LD-008)

#### 🔒 LD-006 · 五层记忆(替换 Summarizer / Portrait)

| 项 | 内容 |
|---|---|
| **决策** | 5 层记忆为 **L1 Buffer · L2 Core · L3 Recall · L4 Profile · L5 Trending Cache**(本架构特化版) · **不沿用** 11/04 原版的 Summarizer / Portrait。 |
| **派生** | ADR-006(五层记忆架构) |
| **违规检测** | 不允许出现 `Summarizer` / `Portrait` 命名 · 不允许引入"定时摘要"逻辑(stepData 是结构化 · 不需要摘要) |
| **例外** | 无 |

#### 🔒 LD-007 · ContextAssembler 是 prompt 注入唯一入口

| 项 | 内容 |
|---|---|
| **决策** | 所有 Specialist 调用 LLMGateway 之前 · 必须经过 `ContextAssembler.assemble()` 组装 prompt。**严禁**绕过 ContextAssembler 直接拼 prompt。 |
| **派生** | ADR-007(ContextAssembler 设计) |
| **违规检测** | grep "systemPrompt" `src/agents/specialists/*.ts` 不应该出现拼接逻辑 · 应只出现 `ctx.systemPrompt` 引用 |
| **例外** | 单元测试可以 mock ContextAssembler · 但不能完全绕过 |

#### 🔒 LD-008 · 反馈飞轮 5 阶段闭环 + EvolutionProfile 账号级

| 项 | 内容 |
|---|---|
| **决策** | 反馈飞轮严格走 5 阶段:**生成→反馈→触发→跑批→注入** · 不允许跳步。EvolutionProfile 是**账号级**(`account_id`)· 不是用户级 · 不允许跨账号自动共享(L5 大师级用户主动勾选除外)。 |
| **派生** | ADR-008(反馈飞轮)· ADR-009(账号级 vs 用户级) |
| **违规检测** | EvolutionProfile 表必须有 `account_id` 字段 + 唯一索引 · 不允许 user_id 主键 |
| **例外** | 无 |

### §3.4 数据架构(LD-009 ~ LD-011)

#### 🔒 LD-009 · IpAccount 聚合根 + 多账号隔离 3 道闸

| 项 | 内容 |
|---|---|
| **决策** | IpAccount 是业务聚合根 · 12 个实体按 `account_id` 隔离(只 3 个全局 · 见下)。3 道闸:**ORM 强制 WHERE + Postgres RLS + Redis/LS 命名空间**。 |
| **3 个全局实体** | User / InviteCode / TrendingItem |
| **派生** | ADR-010(数据隔离铁律) |
| **违规检测** | (1)Postgres `pg_policies` 必须有所有非全局表的 RLS · (2)代码 grep `prisma.X.findMany` 不带 `where: { accountId }` → reject · (3)Redis key 不带 `acc_${id}` 前缀 → reject |
| **例外** | 全局表(User / InviteCode / TrendingItem)显式标 `// GLOBAL TABLE - no account_id` |

#### 🔒 LD-010 · LS↔DB 双写 4 规则

| 项 | 内容 |
|---|---|
| **决策** | (1)写 LS 优先 + 后台 mutation + 失败回滚 · (2)读 LS 优先 + 后台 invalidate · (3)切账号 reload + 预热 · (4)7 个服务端为主实体不入 LS。 |
| **7 实体不入 LS** | DiagnosisReport / EvolutionProfile / EvolutionInsight / FeedbackLog / DeepLearningArchive / KnowledgeFavorite / TrendingItem |
| **派生** | ADR-011(LS↔DB 双写) |
| **违规检测** | grep `localStorage.setItem` 在 client hooks 之外 → reject · 7 个实体的 client cache 命中检查(必须从 server 拉) |
| **例外** | 无 |

#### 🔒 LD-011 · 30KB 常量 import + 6 类向量库 + 不引入独立向量库

| 项 | 内容 |
|---|---|
| **决策** | 56 行业 / 22 元素 / 20 脚本 / 14 形式 / 6 阶段 / 9 步 / 5 进化 / 8 维度 等 ≤ 30KB **不入向量库** · 直接 import。RAG 仅用于 67 案例 / 23 公式 / 22 元素心理学 / trending / user_samples / history(可选)6 类。 |
| **向量库** | 用 `pgvector`(PG 扩展) · 不引入 Qdrant / Milvus / Pinecone。 |
| **派生** | ADR-012(RAG 边界 · pgvector 选型) |
| **违规检测** | `package.json` 不允许出现 `qdrant-client` `@pinecone-database/pinecone` `weaviate-ts-client` 等独立向量库依赖 |
| **例外** | 数据量 > 1M 向量后可重新评估(开新 ADR) |

### §3.5 接口 + 护栏(LD-012 ~ LD-014)

#### 🔒 LD-012 · 全部 LLM 调用走 LLMGateway

| 项 | 内容 |
|---|---|
| **决策** | 任何 LLM 调用必须经过 `LLMGateway.complete()` 或 `LLMGateway.stream()` · **严禁**直接 `import OpenAI` / `import Anthropic` 在业务代码用。Gateway 统管限流 / 熔断 / 降级 / 计费 / Trace。 |
| **派生** | ADR-013(LLM Gateway 设计) |
| **违规检测** | grep `new OpenAI\|new Anthropic\|client\.messages\.create\|openai\.chat\.completions\.create` 在 `src/agents/` 之外 → reject |
| **例外** | 仅 `src/lib/llm-gateway.ts` 内允许直接调 SDK |

#### 🔒 LD-013 · zod schema + trace_id + 无 any 兜底

| 项 | 内容 |
|---|---|
| **决策** | (1)所有 Specialist 输出过 zod 校验 · 失败重试 1 次 · 仍失败标 `is_fallback=true` · (2)所有 LLM 调用 / DB 写入 / API 响应带 `trace_id` 字段 · (3)代码不允许 `any` type 兜底 · 用 `unknown` + 显式 narrow。 |
| **派生** | ADR-014(类型严格 + Trace 贯穿) |
| **违规检测** | (1)tsc `--strict --noUncheckedIndexedAccess` 0 error · (2)grep `: any` 在 `src/` 内 → reject(测试代码除外)· (3)所有 mutation 必须接受 `trace_id` 参数 |
| **例外** | `unknown`(显式)允许 · `any`(隐式)不允许 |

#### 🔒 LD-014 · 错误恢复 + 原子事务

| 项 | 内容 |
|---|---|
| **决策** | (1)LLM 失败:重试 1 次 → 降级 lightweight → 返回 fallback 模板 · (2)Specialist schema 失败:LLM 重试 1 次 → 标 fallback · (3)EvolutionAgent 升级 + insight 写入**必须同事务** · 任一失败全回滚 · (4)stepData 多 tab 用乐观锁(version 字段冲突 toast)。 |
| **派生** | ADR-014(同 LD-013) |
| **违规检测** | EvolutionAgent 单元测试必含"transaction rollback" 用例 · stepData.save 必接 `version` 字段 |
| **例外** | 无 |

### §3.6 视觉 + 设计(LD-015)

#### 🔒 LD-015 · Aurelian Dark · YAML 权威 · Lucide 1.5/2px

| 项 | 内容 |
|---|---|
| **决策** | (1)弃用 aiipznt 原版赛博青(#00e5ff)· 用 Aurelian Dark(金 #d4af37) · (2)`DESIGN.md` YAML frontmatter 是颜色权威 · 文字段是 hover/active 状态变体 · (3)图标用 Lucide SVG · stroke 1.5px 或 2px · 不用 filled。 |
| **派生** | ADR-015(视觉设计系统) |
| **违规检测** | (1)`tailwind.config.js` colors 必须从 DESIGN.md YAML 派生 · CI 跑 schema 校验 · (2)grep `text-cyan\|bg-cyan\|#00e5ff` 在 `src/` → reject · (3)grep `lucide.*Filled` 或 `Filled.*Icon` → reject |
| **例外** | "Active" 状态指示可用 filled 图标 · 加注释 `// active state filled icon` |

### §3.7 测试 + 质量(LD-016)

#### 🔒 LD-016 · 测试金字塔 + LLM Judge + Prompt 回归

| 项 | 内容 |
|---|---|
| **决策** | (1)单元覆盖率 ≥ 80%(`v8` reporter) · (2)集成 ≥ 40 用例 · (3)E2E ≥ 8 用例(主链路) · (4)LLM-as-Judge 评分 ≥ 4.0 / 5.0 · (5)任何 prompt 改动必跑回归(对比改动前后金标准评分) · 不下降才允许合并。 |
| **派生** | ADR-016(测试体系) |
| **违规检测** | CI 强制门槛 · 覆盖率 < 80% reject · LLM Judge 评分 < 4.0 reject · prompt 回归评分下降 reject |
| **例外** | 工具函数(`src/lib/utils/`)不要求 LLM Judge · 但仍要 100% 单元覆盖 |

### §3.8 法律 + 合规(LD-017 ~ LD-018)

#### 🔒 LD-017 · trending 走第三方授权 · 严禁自建爬虫

| 项 | 内容 |
|---|---|
| **决策** | trending 数据获取必须走 §9.13b 方案 A(官方 API)或 B(第三方授权 · 新榜 / 蝉妈妈 / 飞瓜)· **绝对禁止** C 方案(自建爬虫 + 代理)。 |
| **派生** | ADR-017(trending 法律方案) |
| **违规检测** | (1)grep `puppeteer\|playwright` 在 `src/workers/trending/` 内 → reject · (2)grep `proxy\|user-agent.*spoof` → reject · (3)合规审计必查 vendor 合同 |
| **例外** | 无 · 即使是 dev 环境也不允许自建爬虫 |

#### 🔒 LD-018 · 行业合规 + PII 脱敏

| 项 | 内容 |
|---|---|
| **决策** | (1)医疗 / 法律 / 金融行业生成内容自动加底部免责声明(关键词触发) · (2)用户 PII(邮箱 / 手机号 / 真实姓名)不得入 prompt · 替换为占位符。 |
| **派生** | ADR-018(行业合规 · PII 脱敏) |
| **违规检测** | (1)`src/lib/compliance/disclaimer.ts` 必存在 · CopywritingAgent / VideoAgent 输出必跑 · (2)`src/lib/compliance/pii-mask.ts` 必存在 · ContextAssembler 必跑 |
| **例外** | 用户主动选择"不需要免责"(企业版功能 · 后期) |

---

### §3.9 决策矩阵速查

```
范畴            LD          ADR          检测命令
────────────────────────────────────────────────────────────────
编排架构        LD-001/2/3  ADR-001/2/3  grep specialists 数量 + 互相调用
自治 + 共享     LD-004/5    ADR-005/3    grep BaseSpecialist + bullmq enqueue
记忆 + 飞轮     LD-006/7/8  ADR-006/7/8  grep ContextAssembler 唯一入口
数据架构        LD-009/10/11 ADR-010/11/12 SQL WHERE + LS keys + 向量库 SDK
接口 + 护栏     LD-012/3/4  ADR-013/14   import OpenAI · type any · trace_id
视觉            LD-015      ADR-015      tailwind colors + cyan/filled
测试            LD-016      ADR-016      coverage 80% + LLM Judge 4.0
法律 + 合规     LD-017/8    ADR-017/8    puppeteer + PII mask
```

> Opus 审计时把"检测命令"列做成 shell 脚本批量跑(详见 §8 audit_commands)。

---

## §4 设计约束(How to design)

> §3 是"**锁定什么**" · 本节是"**怎么落地**" · 把 LD 转成可执行的设计判断规则。
> Ralph 在每次写代码前应**回到本节**做决策树判断 · 不允许直接动手。

### §4.1 Workflow vs Agent 判断规则(决策树)

> 派生 LD-001 · 决定一个新功能是用 L4 Workflow Command 还是 L5 自治 Agent。

```
     ┌──────────────────────────────────────────┐
     │ 新功能需求来了 · 应该用 Workflow 还是 Agent? │
     └──────────────────────────────────────────┘
                          │
                          ▼
       ┌──────────────────────────────────────────┐
       │ Q1 · 触发主体是谁?                        │
       └──────────────────────────────────────────┘
              │                              │
       用户主动(点按钮 / 填表)        系统主动(Cron / 事件 / 多轮对话)
              │                              │
              ▼                              ▼
       ┌─────────────┐               ┌──────────────┐
       │ Q2 · 需要多轮  │               │ Q3 · LLM 自主  │
       │ LLM 决策吗?  │               │ 决定流程吗?  │
       └─────────────┘               └──────────────┘
              │                              │
       否(单次 LLM) → ✅ L4 Workflow      是 → ✅ L5 Agent
              │                              │
       是 → ⚠️ 警告 · 多轮 + 用户主动     否 → ⚠️ 警告 · 系统主动 + 单次
            通常是错误设计                    应该改成 Cron + Workflow
            考虑改成多步 Workflow              不要包装成 Agent
```

**实操规则**:
* **9 步主向导 / 14 工具页 / 8 步诊断 / 反馈写入** · 全部 L4 Workflow
* **VoiceChat / Evolution / DailyTask** · 唯三 L5 Agent
* **新功能不在以上清单** · **默认 L4 Workflow** · 想用 L5 必须先开 ADR

### §4.2 Specialist 切分 5 原则

> 派生 LD-002 · 决定要不要新增 Specialist · 或者把 URL 归到现有的哪个。

#### 决策流程

```
   新 URL / 新模式 来了 · 怎么放?
   ─────────────────────────────────────
   ① 输出物跟现有 Specialist 相似?
      └─ Yes → 加 mode 分支(不新增)
   ② 输入字段跟现有 Specialist 重叠 ≥ 70%?
      └─ Yes → 加 mode 分支(不新增)
   ③ 是生成型 / 分析型 / 写记忆型?
      └─ 跨类型 → 必须独立(不能合并)
   ④ 是用户驱动循环 / Heartbeat / 系统主动?
      └─ Yes → 必须 L5 自治型(独立)
   ⑤ 都不是 · 才允许新增第 15 个 Specialist
      └─ 必须先开 ADR · 给"为什么 14 不够"的论证
```

#### 当前 14 Specialist 的能力域归属

| 输入特征 | 输出物 | 归属 |
|---|---|---|
| `industry + personalInfo + goals` | 行业分析 / 执行计划 | **PositioningAgent** |
| `platform + personalInfo + targetAudience + (strengths/story)` | 昵称 / 头像 / 简介 / 人设 | **BrandingAgent** |
| `productDesc + currentRevenue + ipPositioning` | 阶梯 / 收入结构 / 案例 | **MonetizationAgent** |
| `industry + product + category` | 选题列表 | **TopicAgent** |
| `scriptType + elements + topic + (mode)` | markdown 文案 | **CopywritingAgent** |
| `sourceCopy / videoType` | 分镜 / 拍摄方案 / 场景图 prompt | **VideoAgent** |
| `platform + productInfo + experience` | 直播话术 | **LivestreamAgent** |
| `stage + product + targetUser` | 私域话术 | **PrivateDomainAgent** |
| `copy / title` | 结构分析 / 评分 | **AnalysisAgent** |
| `8 步问卷 answers` | 7 维度报告 | **DiagnosisAgent** |
| `sample(text/file)` | 风格向量(写记忆) | **DeepLearnAgent** |
| `audio stream` | 流式回复 | **VoiceChatAgent** ★L5 |
| `feedback_log + samples` | insights(自治产物) | **EvolutionAgent** ★L5 |
| `progress + diagnosis + history` | 今日 3-5 任务 | **DailyTaskAgent** ★L5 |

> ⚠️ **如果 Ralph 想新增 Specialist** · 先回这张表查 · 看能不能放进现有的 mode 分支。

### §4.3 数据隔离 3 道闸(铁律)

> 派生 LD-009 · 这是数据架构的最关键约束 · 违反会出"用户 A 看到 B 数据"的严重 bug。

#### 闸 1 · 路由层(tRPC middleware)

每个 procedure 必须有以下中间件:

```typescript
const accountIsolation = middleware(async ({ ctx, input, next }) => {
  // 1. 取活跃账号
  const accountId = ctx.user.activeAccountId;

  // 2. 校验:用户拥有此账号
  const owns = await prisma.ipAccount.count({
    where: { id: accountId, userId: ctx.user.id }
  });
  if (owns === 0) throw new TRPCError({ code: 'FORBIDDEN' });

  // 3. 注入到 ctx
  return next({ ctx: { ...ctx, activeAccountId: accountId } });
});
```

**所有 protected procedure 必须 use 这个 middleware** · 否则 reject。

#### 闸 2 · 存储层(Prisma + Postgres RLS)

**必做** · 每个非全局表加 RLS 策略:

```sql
-- 例:step_data 表
ALTER TABLE step_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY step_data_account_isolation ON step_data
  FOR ALL
  USING (account_id = current_setting('app.current_account_id')::int);

-- 在每个请求开始时设
SET LOCAL app.current_account_id = '${ctx.activeAccountId}';
```

**不允许** · `prisma.stepData.findMany()` 不带 `where: { accountId }` — Opus 审计 grep 检测。

#### 闸 3 · 缓存层(命名空间)

```typescript
// ✅ 正确
const key = `voice_chat:acc_${accountId}:turns`;
localStorage.setItem(`aiip_memory_acc_${accountId}_${stepKey}`, ...);
pgvector.search({ namespace: `account_${accountId}`, ... });

// ❌ 错误
const key = `voice_chat:turns`;  // 漏 account_id
localStorage.setItem(`aiip_memory_${stepKey}`, ...);  // 漏 account
```

#### 全局表清单(显式不带 account_id)

| 表 | 理由 |
|---|---|
| `users` | 用户本身就是隔离单位 · 自带主键 |
| `invite_codes` | 跨用户共享 · 邀请码池 |
| `trending_items` | 全网爆款 · 跨用户共享 |

> **任何新表默认要加 `account_id` + RLS** · 不带的必须显式标注 `// GLOBAL TABLE` 注释 · 必须在 ADR 论证。

### §4.4 接口契约规范

> 派生 LD-005 / LD-007 / LD-012 · 让 4 类调用都遵循统一约定。

#### A · BaseSpecialist 用法

```typescript
// ✅ 标准模板
export class CopywritingAgent extends BaseSpecialist {
  config: SpecialistConfig = {
    persona: { role: '文案魔法师', goal: '生成爆款文案', boundaries: [...] },
    memory: { l1_readonly: ['account'], l2_read: ['stepData'], l2_write: ['history'] },
    knowledge: { constants: ['scriptTypes', 'hotElements'], rag: ['knowledge_cases'], refresh_interval_sec: 600 },
    tools: ['llm.stream'],
    execution: { timeout_ms: 60000, retry: 1, model_tier: 'reasoning', streaming: true }
  };

  protected async execute(input, ctx): Promise<SpecialistOutput> {
    const stream = await llmGateway.stream({
      systemPrompt: ctx.systemPrompt,
      userPrompt: ctx.userPrompt,
      tools: ctx.tools,
      metadata: { trace_id: input.trace_id, agentId: 'CopywritingAgent', ... }
    });
    // ... 流式 yield + zod 校验最终
  }
}

// ❌ 错误 · 不继承 BaseSpecialist · 不声明 config · 直接调 LLM
export async function generateCopy(input) {
  const r = await openai.chat.completions.create({...});  // 跳过 LLMGateway!
  return r.choices[0].message.content;
}
```

#### B · ContextAssembler 调用规范

```typescript
// ✅ 标准
const ctx = await contextAssembler.assemble({
  agentId: 'CopywritingAgent',
  accountId: input.accountId,
  mode: input.mode,
  userInput: input.payload,
  needRag: ['knowledge_cases']
});

// ❌ 错误 · 自己拼 prompt
const systemPrompt = `你是文案魔法师 ... ${stepData} ... ${profile}`;
```

#### C · LLMGateway 调用规范

```typescript
// ✅ 标准
const resp = await llmGateway.complete({
  model_tier: 'reasoning',
  systemPrompt: ctx.systemPrompt,
  userPrompt: ctx.userPrompt,
  responseFormat: { type: 'json_schema', schema: CopywritingSchema },
  metadata: { trace_id, agentId, accountId, userId },
  timeout_ms: 60000
});

// ❌ 错误 · 直接调 SDK
const resp = await anthropic.messages.create({ model: 'claude-sonnet-4-6', ... });
```

#### D · Worker 调用规范

```typescript
// ✅ 标准 · 异步队列(图像 / 文件 / trending)
await imageGenQueue.add('generate-avatar', {
  prompt, size: '1024x1024', count: 4, accountId, trace_id
});

// ❌ 错误 · 同步阻塞调用慢工具
const url = await dalle.generate({...});  // 阻塞 30s 用户主流程
```

### §4.5 模块依赖方向(单向 · 不可绕过)

> 模块之间只允许"上层调下层" · **下层禁止调上层** · 同层之间用接口隔离。

```
┌──────────────────────────────────────────┐
│         L1 · UI(React 组件)            │  ← 顶层
└──────────────────────────────────────────┘
                  │ ↓ 调
┌──────────────────────────────────────────┐
│         L2 · Hooks(useXxx)              │
└──────────────────────────────────────────┘
                  │ ↓ 调
┌──────────────────────────────────────────┐
│         L3 · tRPC Client                 │
└──────────────────────────────────────────┘
        ────── 网络分割线 ──────
                  │ ↓ 调
┌──────────────────────────────────────────┐
│         L4 · tRPC Router(server)        │
└──────────────────────────────────────────┘
                  │ ↓ 调
┌──────────────────────────────────────────┐
│         L5 · Specialist Agents           │
└──────────────────────────────────────────┘
                  │ ↓ 调
┌──────────────────────────────────────────┐
│  L6 · ContextAssembler · LLMGateway · 等 │
└──────────────────────────────────────────┘
                  │ ↓ 调
┌──────────────────────────────────────────┐
│         L7 · Workers(DALL-E / STT 等)  │  ← 底层
└──────────────────────────────────────────┘
```

**禁止** · 跨层跳调 · 例如 L1 UI 直接 import L5 Specialist · 必须通过 L3 tRPC。

### §4.6 文件组织(标准目录树)

> Ralph 在创建新文件前 · 先回这棵树查应该放哪。

```
QuanQn/
├── ARCHITECTURE.md          # 架构骨架(只读 · 修改要先开 ADR)
├── AGENTS.md                # 本文件 · 代码层约束
├── ADR.md                   # 架构决策详情
├── DATA-MODEL.md            # Prisma schema 详情
├── PROMPTS.md               # 14 Specialist prompt 模板
├── DEPLOY.md                # 部署详情(后期)
├── DECISIONS.md             # 产品决策(团队/价格/法律方案 · 待用户写)
│
├── prisma/
│   └── schema.prisma        # DB schema(单一真理来源)
│
├── src/
│   ├── pages/               # 路由页面(34 个)
│   │   ├── Home.tsx
│   │   ├── steps/{Step1, Step3, Step3b, ...}.tsx
│   │   ├── insight/{Trending, VideoAnalysis, PresentStyles}.tsx
│   │   ├── monetize/{Monetization, PrivateDomain, BoomGenerate}.tsx
│   │   ├── create/{Generate, Analysis, VideoProduction, AcquisitionVideo}.tsx
│   │   ├── tools/{AiVideo, VoiceChat, DeepLearning, Knowledge}.tsx
│   │   ├── extra/{Diagnosis, DailyTasks, Evolution, Accounts, MyTopics, History}.tsx
│   │   └── admin/{InviteManage}.tsx
│   ├── components/
│   │   ├── ui/              # shadcn 基础组件
│   │   ├── layout/{Header, Footer, Sidebar}.tsx
│   │   └── shared/{PlatformPicker, IndustryPicker, ResultCard, ...}.tsx
│   ├── hooks/
│   │   ├── useStepData.ts
│   │   ├── useActiveAccount.ts
│   │   ├── useEvolution.ts
│   │   └── useFeedback.ts
│   ├── server/
│   │   ├── trpc/            # tRPC routers(13 个)
│   │   │   ├── auth.ts
│   │   │   ├── ipAccounts.ts
│   │   │   └── ...
│   │   ├── agents/          # Specialist + 编排
│   │   │   ├── base/
│   │   │   │   ├── BaseSpecialist.ts
│   │   │   │   ├── ContextAssembler.ts
│   │   │   │   ├── IPProgressService.ts
│   │   │   │   └── types.ts
│   │   │   ├── specialists/ # 14 个文件
│   │   │   │   ├── PositioningAgent.ts
│   │   │   │   ├── BrandingAgent.ts
│   │   │   │   └── ...
│   │   │   └── workflows/   # Workflow Command 实现
│   │   ├── workers/         # 7 个 Worker
│   │   │   ├── llm-gateway/
│   │   │   ├── image-gen/
│   │   │   ├── trending-scraper/
│   │   │   ├── stt/
│   │   │   ├── tts/
│   │   │   └── file-parser/
│   │   ├── memory/          # 5 层记忆实现
│   │   │   ├── l1-buffer.ts
│   │   │   ├── l2-core.ts
│   │   │   ├── l3-recall.ts
│   │   │   ├── l4-profile.ts
│   │   │   └── l5-trending.ts
│   │   └── cron/            # Heartbeat 任务
│   │       ├── evolution-runner.ts
│   │       └── daily-task-runner.ts
│   ├── lib/
│   │   ├── constants/       # 30KB 常量(industries, hotElements, ...)
│   │   ├── compliance/      # disclaimer.ts · pii-mask.ts
│   │   ├── trpc.ts
│   │   └── utils/
│   └── styles/
│       └── globals.css
│
├── tests/
│   ├── unit/                # 200+ 单元
│   ├── integration/         # 40-60 集成
│   ├── e2e/                 # 8-10 E2E(playwright)
│   └── llm-judge/           # 100 金标准 + Judge 配置
│
├── scripts/
│   └── ralph/               # Coding 3.0 工具(全局复制过来)
│
└── public/
    └── manifest.json        # PWA
```

### §4.7 设计决策树速查(写代码前必读)

> Ralph 在写任何代码前的 5 个判断:

```
1. 这是新 Specialist 吗?
   → 回 §4.2 5 原则 · 大概率是现有 Specialist 加 mode

2. 这是 Workflow 还是 Agent?
   → 回 §4.1 决策树 · 默认 Workflow

3. 数据放哪?
   → 回 §4.3 3 道闸 · 必须带 account_id(除全局表)

4. 调 LLM 怎么调?
   → 回 §4.4 接口契约 · 必经 LLMGateway · 必带 trace_id

5. 文件放哪?
   → 回 §4.6 目录树 · 不允许新建顶级目录
```

> 如果以上 5 个问题任何一个答不出来 · **不允许写代码** · 先回 ARCHITECTURE.md 找答案 · 找不到回到本文件 §3 LD 找。

---

## §5 红线(What NOT to do)

> §3 是"**做什么**" · §4 是"**怎么做**" · 本节是"**绝对不能做**"。
> 17 条红线 · 任一触犯就是 Opus 审计直接 reject 的 hard fail。

### §5.1 编排架构红线(R-1 ~ R-3)

#### ❌ R-1 · 直接调 LLM SDK 跳过 LLMGateway

**触犯** · LD-012
**错误**:
```typescript
// ❌ 在 Specialist 内
import OpenAI from 'openai';
const client = new OpenAI();
const r = await client.chat.completions.create({ model: 'gpt-4o', ... });
```
**正确**:
```typescript
// ✅
const r = await llmGateway.complete({ model_tier: 'reasoning', ... });
```
**检测** · `grep -r "new OpenAI\|new Anthropic\|client\.messages\.create\|openai\.chat\.completions" src/ --exclude-dir=lib/llm-gateway` → 任一命中 reject

---

#### ❌ R-2 · Specialist 之间互相调用

**触犯** · LD-003
**错误**:
```typescript
// ❌ 在 BrandingAgent 内
const result = await positioningAgent.run(input);  // 跨 Specialist 调用
```
**正确** · 通过 ContextAssembler 共享 stepData(异步飞轮也只能写记忆 · 不直接调)
**检测** · `grep -rn "Agent\.run\|Agent\.invoke" src/server/agents/specialists/ | grep -v "this\."` → 命中 reject

---

#### ❌ R-3 · 在 Specialist 内多轮 LLM 循环

**触犯** · LD-001(95% Workflow · 单次 LLM)
**错误**:
```typescript
// ❌ Specialist 不允许循环
async execute(input, ctx) {
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += await llmGateway.complete({...});  // 循环调!
  }
}
```
**正确** · 单次 LLM · 如果真要多轮 · 该是 L5 自治 Agent(VoiceChat / Evolution / DailyTask 三选一)· 否则改成多个 Workflow step 由用户驱动
**检测** · `grep -A20 "execute(input" src/server/agents/specialists/ | grep -E "for|while" | grep "llm"` · 命中 reject(除非是流式 chunk 处理)

### §5.2 数据架构红线(R-4 ~ R-7)

#### ❌ R-4 · 漏 account_id 的 DB 查询

**触犯** · LD-009
**错误**:
```typescript
// ❌ 跨账号风险
const all = await prisma.stepData.findMany();
const found = await prisma.history.findFirst({ where: { id: 123 } });
```
**正确**:
```typescript
// ✅
const all = await prisma.stepData.findMany({ where: { accountId: ctx.activeAccountId } });
```
**检测** · `grep -rn "prisma\.\(stepData\|history\|topic\|asset\|diagnosisReport\|feedbackLog\|evolutionProfile\|evolutionInsight\|deepLearningArchive\|knowledgeFavorite\|knowledgeNote\)\.\(findMany\|findFirst\|findUnique\|update\|delete\)" src/ | grep -v "accountId"` → 命中 reject

---

#### ❌ R-5 · 漏 account_id 的 Redis / LS 命名

**触犯** · LD-009
**错误**:
```typescript
// ❌
redis.set('voice_chat:turns', JSON.stringify(turns));
localStorage.setItem('aiip_memory_step3', JSON.stringify(data));
```
**正确**:
```typescript
// ✅
redis.set(`voice_chat:acc_${accountId}:turns`, ...);
localStorage.setItem(`aiip_memory_acc_${accountId}_step3`, ...);
```
**检测** · `grep -rn "redis\.\|localStorage\.set" src/ | grep -v "acc_"` → 人工核查命中行

---

#### ❌ R-6 · 新表不带 RLS / 不带 account_id

**触犯** · LD-009
**错误**:
```sql
-- ❌ 新表只有 id + 数据字段
CREATE TABLE my_new_table (
  id SERIAL PRIMARY KEY,
  data JSONB
);
```
**正确**:
```sql
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
**例外** · 全局表(users / invite_codes / trending_items)显式标 `// GLOBAL TABLE` 注释 + 必须 ADR 论证
**检测** · 每次 prisma migration 后跑 `pg_policies` 查询 · 非全局表必有 RLS 策略

---

#### ❌ R-7 · 编造 ARCHITECTURE / DATA-MODEL 没有的 schema

**触犯** · LD-013(zod 严格)+ §1.7(架构透明)
**错误** · Ralph 自己加新字段 / 新表 / 新 Specialist · 没回 ARCHITECTURE.md / DATA-MODEL.md 改源
**正确** · 任何 schema 变更 · **先**改 ARCHITECTURE / DATA-MODEL · **后**写代码
**检测** · prisma schema 跟 DATA-MODEL.md 跑 diff · 不一致 reject

### §5.3 接口 + 类型红线(R-8 ~ R-11)

#### ❌ R-8 · 跳过 zod 校验返回 LLM 结果

**触犯** · LD-013
**错误**:
```typescript
// ❌ 直接 trust LLM 输出
const r = await llmGateway.complete({...});
return r.content as MyType;
```
**正确**:
```typescript
// ✅
const r = await llmGateway.complete({
  responseFormat: { type: 'json_schema', schema: MyZodSchema }
});
const parsed = MyZodSchema.safeParse(r.content);
if (!parsed.success) {
  // 重试 or fallback
  return { ...fallback, is_fallback: true };
}
return parsed.data;
```
**检测** · `grep -rn "as " src/server/agents/specialists/*.ts` · 找强转 + 后面没 zod 校验的 → reject

---

#### ❌ R-9 · 不写 trace_id

**触犯** · LD-013
**错误**:
```typescript
// ❌
await prisma.history.create({ data: { content, accountId } });
await llmGateway.complete({ systemPrompt, userPrompt });
```
**正确**:
```typescript
// ✅
await prisma.history.create({ data: { content, accountId, traceId } });
await llmGateway.complete({
  systemPrompt, userPrompt,
  metadata: { trace_id, agentId, accountId, userId }
});
```
**检测** · DB 表必有 `trace_id` 字段(prisma schema check) · LLMGateway 调用必含 metadata.trace_id

---

#### ❌ R-10 · 用 `any` type 兜底

**触犯** · LD-013
**错误**:
```typescript
// ❌
function process(input: any): any { ... }
const data = result as any;
```
**正确**:
```typescript
// ✅
function process(input: unknown): MyType {
  if (typeof input !== 'object') throw new Error();
  // narrow 后再用
}
```
**检测** · `tsc --strict --noUncheckedIndexedAccess` 0 error · grep `: any` 在 `src/` 内(测试代码 / 第三方 SDK 类型缺失除外)→ reject

---

#### ❌ R-11 · 自己拼 system prompt 跳过 ContextAssembler

**触犯** · LD-007
**错误**:
```typescript
// ❌ 在 Specialist 内
const sysPrompt = `你是文案魔法师。当前账号 ${accountId} ...`;
const r = await llmGateway.complete({ systemPrompt: sysPrompt });
```
**正确**:
```typescript
// ✅
const ctx = await contextAssembler.assemble({ agentId, accountId, ... });
const r = await llmGateway.complete({ systemPrompt: ctx.systemPrompt });
```
**检测** · `grep -rn "systemPrompt\s*=\s*[\`'\"]" src/server/agents/specialists/` · 找直接拼 prompt 的 → reject

### §5.4 行为 + 流程红线(R-12 ~ R-14)

#### ❌ R-12 · EvolutionAgent 升级 + insight 写入不在同事务

**触犯** · LD-014
**错误**:
```typescript
// ❌
await prisma.evolutionProfile.update({ data: { level: 'L2' } });
await llmGateway.complete({...});  // 这里失败 · level 已升但 insight 空
await prisma.evolutionInsight.create({...});
```
**正确**:
```typescript
// ✅
await prisma.$transaction(async (tx) => {
  const insights = await llmGateway.complete({...});  // 成功才升级
  await tx.evolutionInsight.create({ data: insights });
  await tx.evolutionProfile.update({ data: { level: 'L2' } });
});
```
**检测** · EvolutionAgent 单元测试必含"transaction rollback" 用例

---

#### ❌ R-13 · stepData.save 不带 version(无乐观锁)

**触犯** · LD-014
**错误**:
```typescript
// ❌ 多 tab 同改 step3 后写覆盖前写
await prisma.stepData.upsert({ where: { ... }, update: { result: newResult } });
```
**正确**:
```typescript
// ✅
const r = await prisma.stepData.update({
  where: { id, version: oldVersion },  // 乐观锁
  data: { result: newResult, version: { increment: 1 } }
});
// 失败说明被另一处改过 · 客户端 toast 提示刷新
```
**检测** · stepData 相关 mutation 必带 version 参数

---

#### ❌ R-14 · 跳过免责声明 / PII 不脱敏

**触犯** · LD-018
**错误**:
```typescript
// ❌
const ctx = { systemPrompt: `... ${user.email} ${user.phone} ...` };  // PII 入 prompt!
return result;  // 医疗行业内容直接输出 · 无免责
```
**正确**:
```typescript
// ✅
const masked = piiMask(input);
const ctx = await contextAssembler.assemble({...});  // ContextAssembler 内已 mask
const result = await agent.run(...);
return appendDisclaimerIfSensitive(result, account.industry);  // 医疗 / 法律 / 金融 加免责
```
**检测** · `src/lib/compliance/disclaimer.ts` + `pii-mask.ts` 必存在 · ContextAssembler 单元测试必跑 PII 检测

### §5.5 切分 + 视觉 + 法律红线(R-15 ~ R-17)

#### ❌ R-15 · 给每个 URL 写独立 Specialist

**触犯** · LD-002(14 能力域归并)
**错误** · 在 `src/server/agents/specialists/` 创建 `Step7Agent.ts` · `GenerateAgent.ts` · `BoomGenerateAgent.ts` 共 3 个文件做相同的事
**正确** · 都归到 `CopywritingAgent.ts` · 用 `mode: 'step7' | 'free' | 'boom'` 分支
**检测** · `ls src/server/agents/specialists/` · 数量必须 ≤ 14 · 命名必须匹配 §4.2 表

---

#### ❌ R-16 · 用赛博青 / Orbitron / aiipznt 原版视觉

**触犯** · LD-015
**错误**:
```css
/* ❌ aiipznt 原版风格 */
color: #00e5ff;
font-family: Orbitron, sans-serif;
```
**正确**:
```css
/* ✅ Aurelian Dark */
color: theme('colors.primary');  /* #f2ca50 from DESIGN.md YAML */
font-family: theme('fontFamily.display');  /* Manrope */
```
**检测** · `grep -rn "#00e5ff\|cyan\|Orbitron\|Rajdhani" src/` → reject(注释 / 文档除外)

---

#### ❌ R-17 · trending 自建爬虫 + 技术栈未经 ADR 变更

**触犯** · LD-017 + §2.7
**错误**:
```typescript
// ❌ 自建爬虫
import puppeteer from 'puppeteer';
const page = await browser.newPage();
page.setExtraHTTPHeaders({ 'User-Agent': 'spoofed' });
```
```json
// ❌ 自由切技术栈
"dependencies": {
  "drizzle-orm": "^0.30.0",  // §2.2 锁定 prisma · 切换必须开 ADR
  "qdrant-client": "^1.0.0"  // LD-011 禁止独立向量库
}
```
**正确** · trending 用第三方授权(新榜 / 蝉妈妈 / 飞瓜 API) · 技术栈变更先开 ADR
**检测** · `grep -rn "puppeteer" src/server/workers/trending/` → reject(playwright 在 tests/e2e/ 是允许的) · `package.json` diff 检查锁定包版本

---

### §5.6 红线总检表(Opus 审计速跑)

```bash
# 一键跑所有红线检测 · 详细命令见 §8 audit_commands

# R-1 · 直接调 LLM SDK
grep -r "new OpenAI\|new Anthropic" src/ --exclude-dir=lib/llm-gateway

# R-2 · Specialist 互相调
grep -rn "Agent\.run\|Agent\.invoke" src/server/agents/specialists/ | grep -v "this\."

# R-3 · Specialist 内多轮 LLM
grep -A20 "execute(input" src/server/agents/specialists/*.ts | grep -E "for|while" | grep llm

# R-4 ~ R-5 · 漏 account_id
grep -rn "prisma\.\w\+\.findMany\|redis\.set\|localStorage\.set" src/ | grep -v "accountId\|acc_"

# R-7 · schema 漂移
diff <(prisma_schema_extract) <(architecture_md_extract)

# R-8 ~ R-10 · 类型不严
grep -rn "as MyType\|: any" src/

# R-11 · 自拼 prompt
grep -rn "systemPrompt\s*=" src/server/agents/specialists/

# R-15 · Specialist 数量
ls src/server/agents/specialists/*.ts | wc -l   # 必须 ≤ 14

# R-16 · 视觉违规
grep -rn "#00e5ff\|cyan\|Orbitron" src/

# R-17 · 自建爬虫
grep -rn "puppeteer" src/server/workers/
```

> 17 条红线对应 ~10 行 grep · 任一命中 → reject。Ralph 提交 PR 前应先跑一遍。

---

## §6 编码规范

> §3 / §4 / §5 是"**架构语义**"约束 · 本节是"**代码风格**"约束。Ralph 在写每行代码时落到这里。

### §6.1 命名约定

| 对象 | 风格 | 示例 |
|---|---|---|
| **文件名(模块)** | kebab-case | `step-data-router.ts` · `context-assembler.ts` |
| **文件名(React 组件)** | PascalCase | `StepHeader.tsx` · `IndustryPicker.tsx` |
| **目录名** | kebab-case | `agents/` · `specialists/` · `llm-gateway/` |
| **变量 / 函数** | camelCase | `accountId` · `assemblePrompt()` |
| **常量(模块级)** | SCREAMING_SNAKE_CASE | `MAX_TIMEOUT_MS` · `DEFAULT_MODEL_TIER` |
| **类型 / 接口** | PascalCase(无 `I` 前缀) | `SpecialistConfig` · `AssembledContext`(❌ 不用 `ISpecialistConfig`) |
| **类(包括 Specialist)** | PascalCase + 必须含语义后缀 | `CopywritingAgent` · `ContextAssembler` · `LLMGateway` |
| **zod schema** | PascalCase + `Schema` 后缀 | `CopywritingSchema` · `IpAccountSchema` |
| **React Hook** | camelCase + `use` 前缀 | `useStepData` · `useActiveAccount` |
| **tRPC procedure** | camelCase 动词式 | `stepData.save` · `evolution.evolve` |
| **DB 表名(prisma)** | snake_case 复数 | `step_data` · `evolution_insights`(model 名是 PascalCase 单数 `StepData`) |
| **DB 列名** | snake_case | `account_id` · `created_at` · `trace_id` |
| **CSS 类(自定义)** | kebab-case + 业务前缀 | `aip-card-glow` · `aip-step-header` |
| **测试文件** | `<原文件>.test.ts` | `CopywritingAgent.test.ts` |

### §6.2 Specialist Agent 命名规范(LD-002 强约束)

| 规则 | 例子 |
|---|---|
| 14 个 Specialist 文件名固定 | `src/server/agents/specialists/<Name>Agent.ts` |
| 文件名必匹配 §4.2 表 | ✅ `CopywritingAgent.ts` · ❌ `Step7Agent.ts` |
| 类名必匹配文件名 | `export class CopywritingAgent extends BaseSpecialist` |
| 模式分支用 `mode` 字段 · 不开新文件 | `mode: 'step7' \| 'free' \| 'boom' \| 'acquisition'` |

### §6.3 文件大小 + 函数大小约束

| 对象 | 上限 | 软建议 | 超出处理 |
|---|:-:|:-:|---|
| 单文件行数 | 500 | 300 | 拆分模块 |
| 单函数行数 | 80 | 40 | 提取子函数 |
| 单类方法数 | 15 | 8 | 拆分类 |
| 单 import 数 | 25 | 15 | 检查耦合 |

> ⚠️ Specialist 单文件可放宽到 600 行(因为 prompt 模板长 + mode 分支多) · 但 prompt 应**外部化到 PROMPTS.md / `src/lib/prompts/<agent>.ts`**

### §6.4 错误处理约定

#### 4 类错误(必区分)

```typescript
// ① 用户输入错误(user error · 4xx)
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: '行业字段必须从 56 个预设中选择',  // 中文 · 给用户看
  cause: { trace_id }
});

// ② 鉴权错误(auth error · 401/403)
throw new TRPCError({ code: 'UNAUTHORIZED', cause: { trace_id } });
throw new TRPCError({ code: 'FORBIDDEN', cause: { trace_id } });  // 跨账号

// ③ 系统错误(system error · 5xx)
logger.error({ err, trace_id, agentId }, 'LLM Gateway timeout');
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: '系统繁忙 · 请稍后再试',  // 用户看到的不暴露细节
  cause: { trace_id }
});

// ④ Agent 执行降级(可恢复 · 不抛)
return { ...fallback, is_fallback: true, trace_id };  // 标 fallback · 用户能看到 · 但提示
```

#### 错误处理铁律

| ✅ 必须 | ❌ 不允许 |
|---|---|
| 所有 catch 必带 trace_id 写日志 | `try { ... } catch {}` 静默吞错 |
| 用户看到的 message 是中文 + 友好 | 直接把 `err.stack` 暴露给用户 |
| 系统错误用 `logger.error` 不用 `console.log` | 生产代码出现 `console.log` |
| Specialist 失败有 fallback 路径 | LLM 失败直接抛 500 |
| EvolutionAgent 失败异步重试 | EvolutionAgent 失败影响用户主流程 |

### §6.5 类型严格度(LD-013 强约束)

#### tsconfig 必含

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,    // arr[0] 推断成 T | undefined
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 类型规则

```typescript
// ✅ 用 unknown + narrow
function process(input: unknown): MyType {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid input');
  }
  // narrow 后再用
}

// ✅ 用 const + as const(代替 enum)
export const PLATFORMS = ['douyin', 'xiaohongshu', 'shipinhao', 'kuaishou', 'bilibili'] as const;
export type Platform = typeof PLATFORMS[number];

// ✅ zod schema 是真理来源 · 不重复定义类型
export const StepDataSchema = z.object({...});
export type StepData = z.infer<typeof StepDataSchema>;

// ❌ 不用 TS enum(运行时膨胀 + 难 tree-shake)
enum Platform { Douyin, Xiaohongshu, ... }

// ❌ 不重复定义同一个 type
interface StepData { ... }  // 跟 zod schema 不同步 → bug
```

### §6.6 注释规则(默认 0 注释)

#### 规则

* **默认不写注释** · 函数名 / 变量名讲清意图就够了
* **只在以下情况注释**:
  1. 违反默认规则的 hack / workaround(说明绕过原因)
  2. 安全约束 / 业务边界(让下次改的人不踩坑)
  3. 跨模块的隐含依赖
  4. 性能 hot path 的不直觉优化
* **必含 `// GLOBAL TABLE` 注释**:任何不带 `account_id` 的表
* **必含 `// PII` 注释**:任何处理 PII 的代码块
* **不写**:
  - `// 生成文案`(函数名已经叫 `generateCopy`)
  - `// 参数 1: 用户ID`(类型 + 名字已经讲清)
  - `// 修复 #123 bug`(放 commit message 不放代码)

#### 例子

```typescript
// ✅ 好注释 · WHY
// 必须 reload 整页(不是 invalidate) · 因为账号切换涉及 LS namespace 切换 · soft 切换会有竞态
window.location.reload();

// ✅ 好注释 · 业务边界
// step4 / step7 是 markdown 字符串(原版兼容) · 不结构化 · 不 zod 校验内部
const stepResult = z.object({ result: z.string() });

// ❌ 废注释
// 调用 API
const data = await trpc.stepData.get.query({...});
```

### §6.7 Git Commit 规范

#### Conventional Commits

```
<type>(<scope>): <subject>

<body 可选>

<footer 可选 · 含 trace_id / breaking>
```

| Type | 含义 |
|---|---|
| `feat` | 新功能 |
| `fix` | bug 修复 |
| `refactor` | 不改行为重构 |
| `test` | 加 / 改测试 |
| `docs` | 文档 |
| `chore` | 构建 / 依赖升级 |
| `perf` | 性能优化 |

| Scope(对应模块) |
|---|
| `agents` · `workflows` · `memory` · `compliance` · `ui` · `hooks` · `lib` · `db` · `cron` · `tests` · `infra` |

#### 例子

```
✅ feat(agents): add CopywritingAgent boom mode
✅ fix(memory): plug L4 EvolutionProfile race condition
✅ refactor(workflows): extract IPProgressService from /ip-plan
✅ test(specialists): cover all 14 Specialist cold-start scenarios

❌ "update code"
❌ "WIP"
❌ "fix bug"  (没说什么 bug)
```

#### 一个 commit 一件事

* 单 commit 修改 ≤ 10 文件(超出可能违反"一件事")
* 单 PR ≤ 5 commits(超出考虑拆 PR)
* 重构 commit 不混 feat / fix(纯 refactor)

### §6.8 import 顺序(eslint-plugin-import 强制)

```typescript
// 1. Node 标准库
import path from 'node:path';

// 2. 第三方库(按字母)
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

// 3. 别名 import(@/...)
import { llmGateway } from '@/server/workers/llm-gateway';
import { contextAssembler } from '@/server/agents/base/context-assembler';

// 4. 相对 import(../../)
import { BaseSpecialist } from '../base/BaseSpecialist';

// 5. 类型 import(用 import type)
import type { SpecialistInput, SpecialistOutput } from '../base/types';
```

### §6.9 console / debugger 禁用

```typescript
// ❌ 生产代码不允许
console.log('debug:', data);
console.error(err);
debugger;

// ✅ 用 logger
import { logger } from '@/lib/logger';
logger.info({ trace_id, agentId }, 'Specialist started');
logger.error({ trace_id, err }, 'LLM call failed');
```

> CI 检测 · `grep -rn "console\.\|debugger" src/ --exclude='*.test.ts'` 命中 reject。

### §6.10 魔法数字 / 字符串

```typescript
// ❌
if (count > 5) { ... }                    // 5 是什么?
setTimeout(fn, 30000);                     // 30000 是什么?
if (rating === 'good') { ... }            // 'good' 是字符串字面量

// ✅
const FEEDBACK_THRESHOLD_L2 = 5;
const STEP_DATA_TIMEOUT_MS = 30 * 1000;
type Rating = 'good' | 'bad';
const RATING_GOOD: Rating = 'good';

if (count > FEEDBACK_THRESHOLD_L2) { ... }
setTimeout(fn, STEP_DATA_TIMEOUT_MS);
if (rating === RATING_GOOD) { ... }
```

### §6.11 PR 流程(Coding 3.0 协同)

#### 提 PR 前 Ralph 必跑

```bash
pnpm typecheck     # tsc 0 error
pnpm lint           # eslint 0 error
pnpm test:unit      # 100% 通过 + 覆盖率 ≥ 80%
pnpm test:integration
pnpm audit:redlines  # §5.6 17 条红线 grep
```

#### Opus 审计 reject 的 hard fail

| 失败 | reject 类别 |
|---|:-:|
| §5 任一红线触犯 | hard fail |
| typecheck / lint 失败 | hard fail |
| 单元覆盖率 < 80% | hard fail |
| LLM Judge 评分 < 4.0 | hard fail |
| Schema 跟 ARCHITECTURE / DATA-MODEL 不一致 | hard fail |
| 缺 trace_id 字段 | hard fail |
| Specialist 数 > 14 / 文件名不匹配 | hard fail |

> 详细审计命令清单见 §8 audit_commands。

---

## §7 测试要求

> 派生 LD-016 + ARCHITECTURE.md §9.11-E。本节是 Ralph 写测试时的具体规范 · CI 强制门槛。

### §7.1 测试金字塔(5 层)

```
                       ┌────────────────────┐
                       │ ⑤ LLM Judge        │   100 金标准 · 评分 ≥ 4.0
                       │   (夜跑 · 30 min)  │
                       └────────────────────┘
                  ┌────────────────────────────┐
                  │ ④ E2E(8-10 用例)         │   主链路 · playwright
                  │   (15 min)                 │
                  └────────────────────────────┘
              ┌────────────────────────────────────┐
              │ ③ 集成(40-60 用例)               │   tRPC + DB · supertest
              │   (10 min)                          │
              └────────────────────────────────────┘
        ┌────────────────────────────────────────────────┐
        │ ② 单元(200+ 用例)                             │   vitest
        │   (5 min)                                       │
        └────────────────────────────────────────────────┘
   ┌──────────────────────────────────────────────────────────────┐
   │ ① 静态(类型 + lint + zod schema 一致性)                    │   tsc · eslint · CI
   │   (1 min)                                                     │
   └──────────────────────────────────────────────────────────────┘
```

### §7.2 ① 静态测试(CI 自动 · 0 用例代码)

```bash
pnpm typecheck      # tsc --strict --noUncheckedIndexedAccess · 0 error
pnpm lint           # eslint + plugin-react-hooks + plugin-jsx-a11y · 0 error / 0 warning
pnpm format:check   # prettier --check
pnpm schema:diff    # 自定义脚本 · 比对 prisma schema vs DATA-MODEL.md vs zod schema
```

| 检查项 | 失败处理 |
|---|---|
| tsc 0 error | hard fail |
| eslint 0 warning(`--max-warnings=0`) | hard fail |
| 三个 schema(prisma / DATA-MODEL.md / zod)不一致 | hard fail |

### §7.3 ② 单元测试(200+ 用例 · vitest)

#### 14 Specialist 各 14 用例 = 196 用例

```typescript
// 模板 · src/server/agents/specialists/CopywritingAgent.test.ts
describe('CopywritingAgent', () => {
  // 5 happy path(每 mode 1)
  it('step7 mode · 完整输入 · 输出含 hook/structure/cta', ...);
  it('free mode · 自由文案 · 5 元素 · 1500 字以内', ...);
  it('boom mode · 5 元素融合 · 5 篇候选', ...);
  it('acquisition mode · 含 CTA · 转化导向', ...);
  it('long output · 16KB 不截断 · 流式正确', ...);

  // 3 mode 分支边界
  it('mode 切换 · prompt 模板正确加载', ...);
  it('mode 不存在 · 抛 BAD_REQUEST', ...);
  it('mode + scriptType 组合非法 · 报错', ...);

  // 3 fallback / cold start
  it('cold start · evolution profile 空 · 走基础 prompt', ...);
  it('LLM timeout · 重试 1 次 · 降级 lightweight', ...);
  it('zod 校验失败 · is_fallback=true · 不抛错', ...);

  // 3 边界
  it('空输入 · 返回 BAD_REQUEST', ...);
  it('超长 topic(>200 字)· 截断到 200', ...);
  it('prompt 注入(用户输入含恶意 instruction)· 检测 + reject', ...);
});
```

#### 其他单元(50+ 用例)

| 模块 | 用例数 |
|---|:-:|
| ContextAssembler(参 §4.4-D 6 冷启动) | 8 |
| LLMGateway(限流 / 熔断 / 降级 / 计费 / 重试) | 12 |
| 5 层记忆模块(L1 ~ L5) | 10 |
| 工具函数(`src/lib/utils/`) | 20+ |
| zod schema(15 实体校验 · 每个 1 用例) | 15 |
| 常量校验(emoji / key 唯一性 / count) | 5 |

> **覆盖率门槛**:
> - `src/server/agents/`: **≥ 90%**(核心)
> - `src/server/workers/`: **≥ 85%**
> - `src/lib/`: **≥ 95%**(工具函数)
> - `src/hooks/`: **≥ 80%**
> - 整体: **≥ 80%**

### §7.4 ③ 集成测试(40-60 用例 · vitest + supertest + 测试 DB)

| 测试对象 | 用例策略 | 数量 |
|---|---|:-:|
| **每个 tRPC procedure 端到端** | (成功 + 鉴权失败 + 限流 + zod 错)× 抽样 1/4 | 50+ |
| **5 条数据流**(ARCHITECTURE §6.7) | 每条 1 happy + 1 错误恢复 | 10 |
| **多账号隔离** | 用户 A 不能读 B 数据 · 切账号清缓存 · RLS 强制 | 5 |
| **LS↔DB 双写一致性** | 离线写 · 网络抖动 · 切账号 · 多 tab 冲突 · 乐观锁 | 6 |
| **EvolutionAgent 飞轮** | 5+ 反馈触发 · L1→L2 · prompt 注入生效 | 4 |
| **DailyTaskAgent Heartbeat** | 0 点跑 · 冷启动模板 · 完整账号生成 | 3 |
| **VoiceChatAgent 多轮** | 3 轮对话 · L1 Buffer 写读 · 工具调用 | 3 |

#### 测试 DB 策略

```typescript
// 用 testcontainers 启 Postgres + Redis
beforeAll(async () => {
  pgContainer = await new PostgreSqlContainer('postgres:16').start();
  await prisma.$migrateDeploy();
  await seed();   // 跑 prisma/seed.ts · 创 test user · test ip account
});

afterEach(async () => {
  await prisma.feedbackLog.deleteMany();   // 每个 case 后清动态数据
  await prisma.history.deleteMany();
  await redis.flushdb();
});
```

### §7.5 ④ E2E 测试(8-10 用例 · playwright)

| 旅程 | 验证点 |
|---|---|
| **新用户 5 步主线** · 注册 → step1 → step3 → step3b → step4b → step7 看结果 | 5 步全跑 · 共享上下文正确 |
| **反馈飞轮闭环** · 做 5 次 👍 · 升 L2 · 重新 step7 · prompt 包含 evolution | LD-008 验证 |
| **VoiceChat 多轮** · 开 voice chat · 说 3 句 · 挂断 · 验证 L1 Buffer 清空 | LD-006 L1 验证 |
| **8 步诊断** · 走完 → 看 7 维度报告 → 跳推荐 step | DiagnosisAgent 端到端 |
| **多账号切换** · 创 2 账号 · 切换 · 数据隔离 + reload + 预热 | LD-009 + LD-010 |
| **设计还原** · 主页 / step1 / step3 截图 vs 设计稿 ≥ 80% 像素相似 | LD-015 |
| **降级路径** · 模拟 LLM timeout · 验证降级到 lightweight + fallback 正确 | LD-014 |
| **多 tab 并发** · 同时改 step3 → 第二次 save 失败 + toast 提示 | R-13 验证 |

```typescript
// 模板 · tests/e2e/feedback-flywheel.spec.ts
test('反馈飞轮闭环', async ({ page }) => {
  await login(page, testUser);
  await page.goto('/step/7');

  // 1. 生成文案 5 次
  for (let i = 0; i < 5; i++) {
    await page.fill('input[name="topic"]', `测试主题 ${i}`);
    await page.click('button:has-text("生成文案")');
    await page.waitForSelector('[data-testid="result"]');
    await page.click('button[aria-label="点赞"]');
  }

  // 2. 验证升级
  await page.goto('/evolution');
  await expect(page.getByText('L2 学习中')).toBeVisible();

  // 3. 重新生成 · 验证 prompt 包含进化
  await page.goto('/step/7');
  // (拦截 LLM Gateway 调用 · 验证 systemPrompt 包含 evolution insights)
});
```

### §7.6 ⑤ LLM-as-Judge(质量评测层 · 持续运行)

> 静态测试不能保证 LLM 输出**好** · 必须有专门的质量评测层。

#### 配置

```typescript
// tests/llm-judge/config.ts
export const JUDGE_CONFIG = {
  judgeModel: 'gpt-4o',  // 用不同的模型当 Judge · 避免自我验证
  judgePromptTemplate: `
你是一个严格的内容质量评审。请对以下输出在 5 维度打分(1-5):
1. 结构完整性 · 是否符合 schema
2. 内容相关性 · 跟用户输入的关联度
3. 风格一致性 · 跟该 Specialist 的人设
4. 实用价值 · 用户能直接用吗
5. 安全合规 · 有无违禁 / PII 泄漏

{specialist_context}
{user_input}
{ai_output}

返回 JSON: { dim1: number, dim2: number, ..., overall: number, reasoning: string }
`,
  passThreshold: 4.0,  // 任一 Specialist 评分 < 4.0 → CI fail
};

// 100 金标准 · 每 Specialist 7-8 个
export const GOLDEN_DATASET = [
  { specialist: 'CopywritingAgent', mode: 'step7', input: {...}, expectedTags: ['fear', 'social_proof'] },
  // ... 100 个
];
```

#### 跑批

```bash
pnpm test:llm-judge          # 跑 100 金标准 · 输出报告 + Slack 通知
pnpm test:llm-judge:diff     # prompt 改动后跑回归 · 对比上一次评分
```

| 跑频 | 时机 |
|---|---|
| 完整 100 金标准 | 夜跑(每天) + prompt 改动 PR |
| 抽样 20(快验) | 每个 PR(只跑改动相关 Specialist) |

### §7.7 覆盖率门槛(CI 强制)

```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  thresholds: {
    global: { lines: 80, functions: 80, branches: 75, statements: 80 },
    'src/server/agents/**': { lines: 90, functions: 90 },
    'src/lib/**': { lines: 95 },
  },
  exclude: ['**/*.test.ts', 'src/lib/constants/**']  // 常量不测覆盖
}
```

### §7.8 CI/CD 集成(GitHub Actions)

```yaml
# .github/workflows/ci.yml(节选)
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile

      - name: ① 静态
        run: pnpm typecheck && pnpm lint && pnpm schema:diff

      - name: ② 单元
        run: pnpm test:unit --coverage
      - uses: codecov/codecov-action@v4

      - name: ③ 集成(用 testcontainers 启 PG + Redis)
        run: pnpm test:integration

      - name: ⑥ 红线检测(§5.6 17 条 grep)
        run: pnpm audit:redlines

      - name: ④ E2E(playwright)
        run: pnpm test:e2e

      - name: ⑤ LLM Judge(只 PR · 抽样 20)
        if: github.event_name == 'pull_request'
        run: pnpm test:llm-judge -- --sample 20
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

  llm-judge-full:
    runs-on: ubuntu-latest
    if: github.event.schedule  # 夜跑
    steps:
      - run: pnpm test:llm-judge -- --full   # 跑 100 金标准
      - name: notify slack
        if: failure()
        # ...
```

### §7.9 测试数据策略

| 数据类型 | 来源 |
|---|---|
| **测试用户** | `prisma/seed.ts` 创 3 个 fixed user(`test_starter` · `test_opc` · `test_mcn`) |
| **测试 IP 账号** | 每用户 1-3 个 fixture account(行业 · 平台 · 阶段不同) |
| **金标准 stepData** | sally 实测数据(脱敏后)+ 5 类生成场景 |
| **金标准反馈** | 手工标 100 条 · 5 维度评分 |
| **PII 测试用例** | 故意带邮箱 / 手机 / 真实姓名 · 验证 mask 正确 |
| **多语言** | MVP 仅中文 · 测试用例全中文 |

### §7.10 性能 + 安全测试

#### 性能(可选 · MVP 后期)

| 指标 | 目标 | 工具 |
|---|---|---|
| Specialist 调用 P95 | < 30s | 自建 trace 聚合 |
| ContextAssembler P95 | < 200ms | 同 |
| 首页 LCP | < 2.5s | Lighthouse |
| 反馈飞轮端到端(👍 → prompt 注入) | < 24h | 监控 |

#### 安全(MVP 必做)

| 项 | 工具 |
|---|---|
| 依赖漏洞扫描 | `pnpm audit` + Snyk |
| 注入攻击测试 | OWASP ZAP(可选) |
| 多账号越权 | 单元 + E2E 覆盖 |
| Prompt 注入 | 单元 12 用例(每 Specialist 1) |

### §7.11 测试金字塔"经济学"(为什么这样分配)

| 层 | 用例数 | 跑时 | 单用例发现 bug 价值 | 维护成本 |
|---|:-:|:-:|:-:|:-:|
| ① 静态 | 0(自动) | 1 min | 极高(类型 / lint) | 0 |
| ② 单元 | 200+ | 5 min | 高(覆盖最广) | 中 |
| ③ 集成 | 40-60 | 10 min | 中(组件交互) | 中高 |
| ④ E2E | 8-10 | 15 min | 高(真实路径) | 高(脆弱) |
| ⑤ LLM Judge | 100 | 30 min | 中(质量保证) | 中(prompt 改动维护) |

> 加起来 ~1 小时 CI · 跑完才合并 · 是产品质量基线。

---

## §8 audit_commands(Opus 审计命令)

> 本节是 Coding 3.0 **Step 5.5 Opus 质量审查**直接消费的清单。每次 Ralph 完成一个 story 后 · Opus 复制粘贴本节命令跑一遍 · 决定 approve / reject。
> 模板基础 · 全局 `~/.claude/scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md` + `OPUS-AUDIT-CHEATSHEET.md`

### §8.1 审计流程(5 步)

```
Step 1 · 读 audit-gate.json + ralph 提交的代码 diff
Step 2 · 跑 §8.3 必跑 5 项(零回归硬门禁)
Step 3 · 跑 §8.4 LD 检测(按 risk_level 选条数)
Step 4 · 跑 §8.5 红线 grep(全部 17 条 · 不分档)
Step 5 · approve(附 4 维度报告)or reject(附反例 · 用 §8.7 模板)
```

### §8.2 风险分档(决定审计深度)

> 沿用全局 `AUDIT-CHECKLIST-TEMPLATE.md §Z` 风险分档。

| risk_level | 触发条件 | 审计强度 | 时长 |
|:-:|---|---|:-:|
| **🟢 low** | 纯常量 / 小工具 / UI 文案 | §8.3 + 通用 4 维度 + 1-2 LD grep | 2-3 min |
| **🟡 medium** | service / CRUD API / 单 Specialist | §8.3 + 通用 + 3-5 LD grep + 关键函数阅读 | 5-8 min |
| **🔴 high** | gateway 热路径 / 反馈飞轮 / 多账号边界 / 安全 | §8.3 + 全部 LD + line-by-line + SQL 实测 + 必读相关测试 | 10-15 min |
| **🟣 foundation** | 被 ≥3 个下游 story `depends_on` 的 model / schema / `__init__` / conftest | high 全部 + 升档(防 rubber-stamp 污染下游) | 15+ min |

> Opus 应**先**判断 risk_level · 再选检测条数 · 不允许"全部跳过快审"。

### §8.3 必跑 5 项(零回归硬门禁 · 任一失败 reject)

```bash
# ① TypeScript 0 error
pnpm typecheck
# expected · "Found 0 errors."

# ② ESLint 0 error · 0 warning
pnpm lint --max-warnings=0
# expected · 退出码 0 · 无输出

# ③ 全量单元 + 集成测试
pnpm test:unit && pnpm test:integration
# expected · 全过 · 覆盖率达标(整体 ≥ 80% · 核心 ≥ 90%)

# ④ Schema 一致性
pnpm schema:diff
# expected · prisma schema = DATA-MODEL.md = zod schema · 无 diff

# ⑤ 红线 17 条(§5.6 + 详见 §8.5)
pnpm audit:redlines
# expected · 0 命中
```

> 任一失败 → **直接 reject** · 不进入后续审计。

### §8.4 LD 检测命令(18 条 · 按 risk_level 抽)

```bash
# ─────────────────────────────────────────────────────
# §3.1 编排架构(LD-001 ~ LD-003)
# ─────────────────────────────────────────────────────

# LD-001 · 95% Workflow / 5% Agent · Specialist 内不允许多轮
echo "=== LD-001 · Specialist 内多轮 LLM 检测 ==="
grep -rn -A30 "execute(input" src/server/agents/specialists/*.ts \
  | grep -E "(for|while)" | grep -i "llm" || echo "✅ 通过"

# LD-002 · 14 个能力域 Specialist · 不允许新增
echo "=== LD-002 · Specialist 数量 ==="
SPECIALIST_COUNT=$(ls src/server/agents/specialists/*.ts 2>/dev/null \
  | grep -v ".test.ts" | wc -l)
echo "现有 $SPECIALIST_COUNT 个 · 上限 14"
[ "$SPECIALIST_COUNT" -le 14 ] && echo "✅ 通过" || echo "❌ FAIL · 超过 14"

# LD-003 · Specialist 互不调用
echo "=== LD-003 · Specialist 互调 ==="
grep -rn "Agent\.run\|Agent\.invoke" src/server/agents/specialists/ \
  | grep -v "this\." | grep -v ".test.ts" || echo "✅ 通过"

# ─────────────────────────────────────────────────────
# §3.2 自治 + 共享(LD-004 ~ LD-005)
# ─────────────────────────────────────────────────────

# LD-004 · 3 L5 Agent 走 bullmq 队列(Heartbeat)
echo "=== LD-004 · L5 Agent 必通过队列 ==="
grep -rn "evolutionAgent\.run\|dailyTaskAgent\.run" src/server/trpc/ \
  | grep -v "queue.add\|enqueue" && echo "❌ FAIL · L5 不能从 tRPC 同步调" \
  || echo "✅ 通过"

# LD-005 · 全部 Specialist 继承 BaseSpecialist
echo "=== LD-005 · BaseSpecialist 继承 ==="
for f in src/server/agents/specialists/*.ts; do
  [[ "$f" == *.test.ts ]] && continue
  grep -q "extends BaseSpecialist" "$f" || echo "❌ FAIL · $f 未继承"
done

# ─────────────────────────────────────────────────────
# §3.3 记忆 + 飞轮(LD-006 ~ LD-008)
# ─────────────────────────────────────────────────────

# LD-006 · 不沿用 Summarizer / Portrait 命名
echo "=== LD-006 · 5 层记忆命名 ==="
grep -rn "Summarizer\|Portrait" src/server/memory/ && echo "❌ FAIL" \
  || echo "✅ 通过"

# LD-007 · ContextAssembler 唯一 prompt 入口
echo "=== LD-007 · 自拼 system prompt ==="
grep -rn 'systemPrompt\s*=\s*[`"]' src/server/agents/specialists/ \
  | grep -v ".test.ts" && echo "❌ FAIL" || echo "✅ 通过"

# LD-008 · EvolutionProfile 必有 account_id 字段
echo "=== LD-008 · EvolutionProfile 账号级 ==="
grep -A5 "model EvolutionProfile" prisma/schema.prisma \
  | grep "accountId" || echo "❌ FAIL · 必须有 accountId"

# ─────────────────────────────────────────────────────
# §3.4 数据架构(LD-009 ~ LD-011)
# ─────────────────────────────────────────────────────

# LD-009 · 漏 account_id 的 Prisma 查询
echo "=== LD-009 · DB 查询漏 account_id ==="
grep -rn "prisma\.\(stepData\|history\|topic\|asset\|diagnosisReport\|feedbackLog\|evolutionProfile\|evolutionInsight\|deepLearningArchive\|knowledgeFavorite\|knowledgeNote\)\.\(findMany\|findFirst\|update\|delete\)" src/ \
  | grep -v "accountId\|account_id" | grep -v ".test.ts" || echo "✅ 通过"

# LD-009 · Postgres RLS 策略
echo "=== LD-009 · 非全局表必有 RLS ==="
psql $TEST_DATABASE_URL -tAc "
SELECT tablename FROM pg_tables WHERE schemaname='public'
  AND tablename NOT IN ('users','invite_codes','trending_items','_prisma_migrations')
  AND tablename NOT IN (SELECT tablename FROM pg_policies);
" | grep -q . && echo "❌ FAIL · 上述表无 RLS" || echo "✅ 通过"

# LD-010 · 7 实体不入 LS
echo "=== LD-010 · LS 不允许的 7 实体 ==="
grep -rn "localStorage\.setItem.*\(diagnosis\|evolution\|feedback\|deepLearn\|knowledgeFav\|trending\)" src/ \
  | grep -v ".test.ts" || echo "✅ 通过"

# LD-011 · 不引入独立向量库
echo "=== LD-011 · 独立向量库依赖 ==="
grep -E "qdrant|pinecone|weaviate|milvus|chroma" package.json \
  && echo "❌ FAIL · 必须用 pgvector" || echo "✅ 通过"

# ─────────────────────────────────────────────────────
# §3.5 接口 + 护栏(LD-012 ~ LD-014)
# ─────────────────────────────────────────────────────

# LD-012 · 直接调 LLM SDK
echo "=== LD-012 · LLMGateway 唯一入口 ==="
grep -rn "new OpenAI\|new Anthropic\|client\.messages\.create\|openai\.chat\.completions" src/ \
  --exclude-dir="lib/llm-gateway" --exclude="*.test.ts" \
  && echo "❌ FAIL" || echo "✅ 通过"

# LD-013 · any 类型
echo "=== LD-013 · any type 兜底 ==="
grep -rn "[^a-zA-Z]: any[^a-zA-Z]" src/ --include="*.ts" \
  | grep -v ".test.ts" | grep -v "// eslint-disable" || echo "✅ 通过"

# LD-013 · trace_id 字段
echo "=== LD-013 · DB 表必有 trace_id ==="
grep -E "^model (StepData|History|FeedbackLog|EvolutionInsight|DiagnosisReport)" -A20 \
  prisma/schema.prisma | grep -B0 -A1 "model " | grep "traceId" \
  || echo "❌ FAIL · 上述表必含 traceId 字段"

# LD-014 · EvolutionAgent 原子事务
echo "=== LD-014 · EvolutionAgent transaction ==="
grep -A20 "execute" src/server/agents/specialists/EvolutionAgent.ts \
  | grep "prisma.\$transaction" || echo "❌ FAIL · 必须用 transaction"

# ─────────────────────────────────────────────────────
# §3.6 视觉(LD-015)
# ─────────────────────────────────────────────────────

# LD-015 · 赛博青 / Orbitron / Rajdhani 禁用
echo "=== LD-015 · 视觉违规 ==="
grep -rn "#00e5ff\|cyan-\|Orbitron\|Rajdhani" src/ --include="*.ts" --include="*.tsx" --include="*.css" \
  | grep -v "// 禁用" | grep -v ".test.ts" || echo "✅ 通过"

# ─────────────────────────────────────────────────────
# §3.7 测试(LD-016)
# ─────────────────────────────────────────────────────

# LD-016 · 覆盖率门槛
echo "=== LD-016 · 单元覆盖率 ==="
pnpm test:unit --coverage --reporter=json --outputFile=coverage.json 2>/dev/null
COV=$(jq '.total.lines.pct' coverage.json)
[ "$(echo "$COV >= 80" | bc)" -eq 1 ] && echo "✅ $COV%" || echo "❌ FAIL · $COV% < 80%"

# LD-016 · LLM Judge(改 prompt 时必跑)
if git diff HEAD~1 --name-only | grep -q "src/lib/prompts/"; then
  echo "=== LD-016 · LLM Judge 回归(改了 prompt) ==="
  pnpm test:llm-judge -- --diff
fi

# ─────────────────────────────────────────────────────
# §3.8 法律 + 合规(LD-017 ~ LD-018)
# ─────────────────────────────────────────────────────

# LD-017 · 自建爬虫
echo "=== LD-017 · trending 不允许 puppeteer / playwright ==="
grep -rn "puppeteer" src/server/workers/trending/ \
  && echo "❌ FAIL" || echo "✅ 通过"

# LD-018 · disclaimer + pii-mask 必存在
echo "=== LD-018 · 合规模块存在 ==="
[ -f "src/lib/compliance/disclaimer.ts" ] && [ -f "src/lib/compliance/pii-mask.ts" ] \
  && echo "✅ 通过" || echo "❌ FAIL · 合规模块缺失"
```

### §8.5 红线 17 条(全跑 · 任一命中 reject)

> 详见 §5.6 红线总检表。本节只列**必须用 grep 0 命中**的 17 条:

```bash
pnpm audit:redlines  # 调 scripts/audit-redlines.sh

# 内容(节选关键):
grep -r "new OpenAI\|new Anthropic" src/ --exclude-dir=lib/llm-gateway       # R-1
grep -rn "Agent\.run" src/server/agents/specialists/ | grep -v "this\."      # R-2
grep -rn "prisma\.\w\+\.findMany" src/ | grep -v "accountId"                 # R-4
grep -rn "redis\.set\|localStorage\.setItem" src/ | grep -v "acc_"           # R-5
grep -rn "as MyType\|: any" src/ --include="*.ts"                            # R-10
grep -rn 'systemPrompt\s*=' src/server/agents/specialists/                   # R-11
grep -rn "#00e5ff\|Orbitron" src/                                            # R-16
grep -rn "puppeteer" src/server/workers/                                     # R-17
# ...其余见 §5.6
```

### §8.6 4 维度 approve 报告模板(Opus 通过时必出)

> 沿用全局 `OPUS-AUDIT-CHEATSHEET.md` Step 5 模板:

```markdown
# Approve · Story <ID> · risk_level: <low|medium|high|foundation>

## ① 验收标准合规(AC by AC)
- [✓] AC-1 · ${AC1 描述} · 验证 · ${file:line / test name}
- [✓] AC-2 · ...
- [✓] ...

## ② AGENTS.md 技术约束(LD 检测)
- [✓] LD-001 · 95/5 范式 · 无 Specialist 内多轮 · grep 0 命中
- [✓] LD-009 · 多账号隔离 · 全部查询带 accountId · RLS 策略全
- [✓] LD-013 · trace_id 贯穿 · 类型严格 0 any
- [✓] ${其他相关 LD}

## ③ 安全审查
- [✓] 无 PII 入 prompt · pii-mask 测试通过
- [✓] 无注入风险 · 用户输入走 zod 校验
- [✓] 无敏感日志泄漏

## ④ PRD 一致性
- [✓] 实现跟 PRD §<x.y> 完全一致
- [⚠️] (如有偏差)偏差 · ${描述} · 已登记 TD-${id}

## TD 豁免(若有)
- TD-X 豁免 approve · 理由 · ${pre-existing tech debt} · 证据 · ${file:line}

## 测试覆盖
- 单元 · 全过 · 覆盖率 ${X%}
- 集成 · 全过
- LLM Judge(若改 prompt)· 评分 ${X}/5.0 · 不下降

## 命令实测
- pnpm typecheck · 0 error
- pnpm lint · 0 warning
- pnpm test:unit · ${X} 通过
- pnpm audit:redlines · 0 命中
```

### §8.7 reject 反例模板(Opus 拒绝时必出)

> 沿用全局 `REJECT-TEMPLATE.md` · feedback < 200 字符会自动报错。

```markdown
# Reject · Story <ID>

## Blocker · ${一句话总结}

## 触犯
- AGENTS.md ${LD-XXX} · ${LD 标题}
- 红线 ${R-X} · ${红线描述}

## 当前代码(行号)
\`\`\`typescript
// src/server/agents/specialists/CopywritingAgent.ts:42
const r = await openai.chat.completions.create({...});  // ❌ 直接调 SDK · 触犯 R-1
\`\`\`

## 目标代码
\`\`\`typescript
const r = await llmGateway.complete({
  model_tier: 'reasoning',
  systemPrompt: ctx.systemPrompt,
  userPrompt: ctx.userPrompt,
  metadata: { trace_id, agentId, accountId, userId }
});
\`\`\`

## 绝对不能(反例列表)
- ❌ 不能直接 `import OpenAI`
- ❌ 不能 `new Anthropic()`
- ❌ 不能跳过 metadata.trace_id
- ❌ 不能让 timeout / retry 在 Specialist 内部处理(LLMGateway 已做)
- ❌ 不能用 `responseFormat: { type: 'text' }` 跳过 zod schema 校验

## 验证方式
\`\`\`bash
# Ralph 修完后跑这个 · 0 命中才行
grep -rn "new OpenAI\|new Anthropic" src/ --exclude-dir=lib/llm-gateway
# expected · 0 行输出
\`\`\`

## 参考
- AGENTS.md §3.5 LD-012(详细决策)
- AGENTS.md §5.1 R-1(红线)
- ARCHITECTURE.md §6.5(LLMGateway 接口契约)
```

### §8.8 一键审计脚本

```bash
#!/bin/bash
# scripts/audit-all.sh · Opus 审计入口

set -e

echo "════════════════════════════════════"
echo "  Opus Audit · QuanQn"
echo "════════════════════════════════════"

# Step 1 · 必跑 5 项(§8.3)
pnpm typecheck
pnpm lint --max-warnings=0
pnpm test:unit && pnpm test:integration
pnpm schema:diff
pnpm audit:redlines

# Step 2 · LD 18 条(§8.4)
bash scripts/audit-ld.sh

# Step 3 · 红线 17 条(§8.5)
bash scripts/audit-redlines.sh

# Step 4 · 输出 audit-gate.json
echo '{"status":"ready_for_opus","timestamp":"'$(date -Iseconds)'"}' \
  > scripts/ralph/audit-gate.json

echo "✅ 自动检查全过 · 等待 Opus 4 维度审查 + approve"
```

### §8.9 audit-gate.json 通信契约

```typescript
// 跟全局 ralph.py 协作的状态文件
interface AuditGate {
  status: 'pending' | 'approved' | 'rejected';
  story_id: string;
  risk_level: 'low' | 'medium' | 'high' | 'foundation';
  ralph_finished_at: string;
  opus_started_at?: string;
  opus_finished_at?: string;
  approve_report?: string;   // §8.6 模板
  reject_feedback?: string;  // §8.7 模板
  auto_checks: {
    typecheck: boolean;
    lint: boolean;
    test_unit: boolean;
    test_integration: boolean;
    schema_diff: boolean;
    redlines: boolean;
  };
}
```

> 完整 ralph 协议见全局 `~/.claude/scripts/ralph/CLAUDE.md`。

---

## §9 上下文加载顺序(LLM 入仓必读)

> AI 进入本仓库时按此顺序加载文档 · 最快建立心智模型。
> Coding 3.0 `/prime` 命令应该按本节顺序执行。

### §9.1 文档分层模型

```
┌────────────────────────────────────────────────────────────┐
│  L1 · 顶层(必读 · 描述"是什么 / 怎么做 / 不能做什么")  │
│   ① ARCHITECTURE.md                                         │
│   ② AGENTS.md(本文件)                                     │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│  L2 · 派生(详情 · 当 L1 不够时回这里)                    │
│   ③ ADR.md          · 18+ 决策的 Context/Options/Consequences │
│   ④ DATA-MODEL.md   · 15 实体完整 Prisma schema             │
│   ⑤ PROMPTS.md      · 14 Specialist system prompt 模板      │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│  L3 · 参考(查表用 · 不必通读)                            │
│   ⑥ aiipznt-spec.md          · 329KB 原版规格 · 当 schema 模糊查这里 │
│   ⑦ ui/aurelian_dark/DESIGN.md · 设计 token 真理来源        │
│   ⑧ knowledge-base/...       · 9 处知识库引用 · 各章节链接   │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│  L4 · 代码 · src/                                           │
│   按 §4.6 目录树组织                                        │
└────────────────────────────────────────────────────────────┘
```

### §9.2 按角色加载路径

#### A · Ralph(写代码)

```
1. AGENTS.md §1 Mission(知道做什么) · 5 min
2. AGENTS.md §3 Locked Decisions + §5 红线(知道不能做什么) · 10 min
3. ARCHITECTURE.md §4 Agent 编排(知道怎么切 Specialist) · 10 min
4. PROMPTS.md(找当前 Specialist 的 prompt 模板) · 5 min
5. DATA-MODEL.md(查相关 schema) · 5 min
─────
开始写代码 · 总 35 min
```

#### B · Opus(审计)

```
1. AGENTS.md §3 LD + §5 红线 + §8 audit_commands · 10 min
2. ARCHITECTURE.md §6 接口契约(对照 Ralph 实现) · 5 min
3. ADR.md 相关 ADR(理解决策 Context) · 5-10 min
4. 跑 §8.3 必跑 5 项 · 5 min
5. 跑 §8.4 LD 检测 · 5 min
6. 出 §8.6 approve 报告 or §8.7 reject 反例
─────
完整审计 · 30-45 min
```

#### C · 新工程师 onboarding

```
Day 1 ·
  AM · ARCHITECTURE.md 9 章通读(2 小时)
  PM · AGENTS.md 9 章通读(2 小时)
Day 2 ·
  AM · ADR.md 18+ ADR 通读(2 小时)
  PM · DATA-MODEL.md + PROMPTS.md 通读(2 小时)
Day 3 ·
  Pair 写第一个 Specialist · 跑全套测试
─────
3 天上手 · 第 4 天可独立写新 Specialist
```

#### D · 产品经理 / Stakeholder

```
1. ARCHITECTURE.md §1 系统总览 + §2 业务模型 · 30 min
2. ARCHITECTURE.md §9 实施路线图 · 15 min
3. AGENTS.md §1 Mission · 5 min
─────
理解项目 · 50 min
```

### §9.3 5 分钟速读(快速建立心智)

> 时间紧时按这个 7 步走:

```
① ARCHITECTURE.md §1.1 一句话定位                  · 30s
② ARCHITECTURE.md §1.4 9 层架构图                  · 1 min
③ ARCHITECTURE.md §4.1 95% Workflow / 5% Agent     · 30s
④ ARCHITECTURE.md §4.3 14 Specialist 清单           · 1 min
⑤ AGENTS.md §3.9 决策矩阵速查                       · 1 min
⑥ AGENTS.md §5.6 红线总检表                         · 30s
⑦ ARCHITECTURE.md §9.14 MVP 5 周路径                · 30s
─────
共 5 min · 抓住灵魂
```

### §9.4 文档间依赖关系(谁是谁的源)

```
spec.md(原版规格)+ DESIGN.md(设计 token)
                 ↓ 派生
        ARCHITECTURE.md(架构骨架 · 9 章)
                 ↓ 派生
              AGENTS.md(代码层约束 · 本文件)
                 ↓ 派生(详情展开)
        ┌────────┼─────────┐
        ▼        ▼         ▼
     ADR.md   DATA-MODEL  PROMPTS.md
     (决策)   (Schema)    (14 prompt)
                 ↓
              src/(代码)
```

> **修改规则**:
> - 改 `spec.md` / `DESIGN.md` · 触发 ARCHITECTURE.md 复审
> - 改 ARCHITECTURE.md · 触发 AGENTS.md / ADR.md / DATA-MODEL.md / PROMPTS.md 复审
> - 改 AGENTS.md(LD / 红线)· 触发全部 src/ 代码复审
> - 改 src/ · 反向触发 schema:diff · 不允许跟上层文档不一致

### §9.5 何时回头读哪个

| 你想做的事 | 回这个文档 |
|---|---|
| 加新 Specialist | AGENTS.md §4.2(切分原则)+ §3 LD-002 |
| 改 LLM 调用方式 | AGENTS.md §3 LD-012 + ARCHITECTURE.md §6.5 + ADR.md ADR-013 |
| 加新表 / 字段 | DATA-MODEL.md(改 schema)+ ARCHITECTURE.md §3.1 ER + AGENTS.md §3 LD-009 |
| 改 prompt | PROMPTS.md(改模板)+ AGENTS.md §7.6 LLM Judge 跑回归 |
| 加新 tRPC procedure | AGENTS.md §4.4-A + ARCHITECTURE.md §6.2 |
| 加新护栏 | AGENTS.md §3 LD + §5 红线 + 改 §8 audit_commands |
| 改 UI 颜色 / 字体 | DESIGN.md(改 YAML)· 不直接改 src/(从 token 派生) |
| 加新 Phase | ARCHITECTURE.md §9 + AGENTS.md §1.5 验收标准 |
| 改 risk_level 评分 | AGENTS.md §8.2 |

### §9.6 文档维护铁律

| 规则 | 含义 |
|---|---|
| **架构文档先行** | 改 src/ 前必须先改对应文档 · 否则 Opus reject |
| **数字一致性** | 18 LD / 17 红线 / 14 Specialist / 15 实体 · 任一文档改了全栈同步 |
| **trace_id 贯穿** | 文档间引用必带 § / ADR-XXX / LD-XXX |
| **修订记录追加** | 每次大改后追加文档底部"修订记录" · 不删历史 |
| **版本号** | v0.x = 骨架 / 草稿 · v1.x = 跑通 MVP · v2.x = 上线后 |

### §9.7 一句话总结

> **本文件(AGENTS.md)是 Coding 3.0 的"宪法"** · ARCHITECTURE.md 是"宪章" · ADR/DATA-MODEL/PROMPTS 是"实施细则"。
> 任何代码变更必须**先**通过 AGENTS.md 的 18 LD + 17 红线 · **后**通过 §8 audit_commands · 才能合入主干。
> Ralph 与 Opus 协作的全部规则 · 都在这一份文件里。

---

## §10 admin 子系统代码层约束(2026-05-07 v0.2 新增 · 对应 REVIEW P0-1 派生 + ADR-021)

> 本章是 admin 子系统(详见 [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md))在**代码层的 LD + 红线 + audit_commands**。
> 类比关系 · §3-§5 是主应用代码层约束 · 本章是 admin 子系统代码层约束。
>
> **执行边界** · 当 Ralph / Opus 在 `apps/admin/` 或 `apps/api/src/trpc/routers/admin/` 下写代码时,本章红线**优先于** §3-§5 通用红线适用。

### §10.1 admin 子系统的 5 条 LD(LD-A1 ~ LD-A5)

> 跟主应用 18 LD 平级 · 但范围限定在 admin 子系统。

#### LD-A1 · admin 子系统独立部署 + 独立 OAuth(对应 ADR-021)

**铁律**:
- ✅ apps/admin 独立 build → admin.quanqn.com
- ✅ apps/admin 用独立 OAuth client_id(QUANQN_ADMIN_CLIENT_ID)+ Workspace 限定 @quanqn.com
- ✅ apps/admin session 跟主应用 session 完全隔离(独立 Redis namespace `admin:session:*`)
- ❌ apps/admin 复用主应用 OAuth client / session
- ❌ apps/admin 部署到 www.quanqn.com 子路径

**执行检查**:
- grep `apps/admin/.*QUANQN_WEB_CLIENT` → 0 结果(admin 不应出现 web 的 OAuth 配置名)
- grep `app:session:` in apps/admin/ → 0 结果(admin 应用 admin: 前缀)

#### LD-A2 · adminRouter 跟 appRouter 严格分离

**铁律**:
- ✅ adminRouter 在 `apps/api/src/trpc/routers/admin/` 树下(14 子树)
- ✅ appRouter 在 `apps/api/src/trpc/routers/app/` 树下(13 子树)
- ✅ 每个 admin procedure 必经 6 闸鉴权链:adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck
- ❌ adminRouter 调 appRouter 的 procedure(反之亦然)
- ❌ admin procedure 不带 adminRLS middleware(即使是只读)
- ❌ 高风险 procedure 不带 approvalGateCheck middleware(参 §10.3 高风险清单)

**执行检查**:
- grep `import.*from.*'@/trpc/routers/app'` in apps/api/src/trpc/routers/admin/ → 0 结果
- grep `from.*'@/trpc/routers/admin'` in apps/api/src/trpc/routers/app/ → 0 结果
- AST 检测:每个 admin procedure 链路必含 `adminRLS` middleware

#### LD-A3 · admin 跨账号查必走 RLS bypass + 必写 admin_audit_log

**铁律**:
- ✅ admin 跨账号查走 `set_config('app.role', 'admin', true)`(由 adminRLS middleware 自动)
- ✅ 每次跨账号查自动写 `admin_audit_log` eventType='cross_account_query'(由 middleware 自动)
- ✅ 跨账号查必带显式 WHERE 过滤(代码 review 严格)
- ❌ admin procedure 不写 audit
- ❌ 直接用主应用 prismaClient 跨账号查(必须用 adminPrisma · 自带 set_config)

**执行检查**:
- grep `prisma\.(.*)\.findMany\({` in apps/api/src/trpc/routers/admin/ · 必带 where 过滤
- grep `app.role.*admin` in apps/api/src/middleware/admin-rls.ts · 必有
- 测试套件 · 跨账号查必有"读 admin_audit_log 验证 cross_account_query 写入"用例

#### LD-A4 · 高风险操作必走 Approval Gates(对应 ADR-020)

**铁律**:
- ✅ 14 类高风险动作(详 §10.3)必带 `meta.requiresApproval=true`
- ✅ 4 类二次审批必带 `meta.requireDualApproval=true` + 申请人 ≠ 审批人验证
- ✅ 2 类紧急通道必带 `meta.isEmergency=true` + `postReviewAt` 24h cron
- ✅ Approval 通过后必写 `admin_audit_log.approvalRequestId` 关联
- ❌ 高风险操作硬编码 `requiresApproval=false`(必须先开新 ADR 改 §10.3 清单)
- ❌ 紧急通道不做后置 24h 复核

**执行检查**:
- AST · 14 高风险 procedure 名单必带 `meta.requiresApproval`
- grep `meta.requiresApproval.*false` in 高风险列表 → 0 结果
- 测试 · 14 类高风险动作每条必有"未带 approvalRequestId → PRECONDITION_REQUIRED"用例

#### LD-A5 · admin 内容审核 = 主应用 RAG 入库前的硬闸门

**铁律**:
- ✅ TrendingScraper 抓回的内容**进 trending_review_queue 表 status=pending** · 不直接写 trending_items
- ✅ FileParser 解析的样本**进 deep_learn_review_queue 表 status=pending** · 不直接写 deep_learning_archives
- ✅ status=approved 才允许 embed 入向量库(由 cron 异步触发)
- ❌ TrendingScraper / FileParser 直接 .create({...}) 写主表
- ❌ embed worker 处理 status≠approved 的记录

**执行检查**:
- grep `prisma.trendingItem.create` in apps/api/src/workers/trending-scraper/ → 0(应该写 review queue)
- grep `prisma.deepLearningArchive.create` in apps/api/src/workers/file-parser/ → 0(应该写 review queue)
- 集成测试 · "TrendingScraper 抓 1 条 → 主 trending_items 0 条 / review_queue 1 条"

### §10.2 admin 子系统的 6 条红线(R-A1 ~ R-A6)

#### R-A1 · 不允许 apps/web 跟 apps/admin 互相 import 业务代码

```bash
# 检测
! grep -rn "from '@quanqn/admin\|from '\.\./admin'" apps/web/src/
! grep -rn "from '@quanqn/web\|from '\.\./web'" apps/admin/src/
```

**例外** · packages/* 三方共享层不算违反(zod / UI base / tRPC client config 共享)。

#### R-A2 · 不允许在主应用前端暴露 admin 入口

```bash
# 主应用前端不应有 admin 跳转链接 / 路由 wrapper
! grep -rn "role === 'admin'.*navigate" apps/web/src/
! grep -rn "/admin" apps/web/src/
```

**强制** · admin 用户必须主动访问 admin.quanqn.com · 主应用不暴露 admin 入口。

#### R-A3 · 不允许 admin SPA 不带 IP 白名单 / MFA 直接上线

```bash
# 部署前检查 · WAF 配置 + MFA 启用
test -f infra/cloudflare-waf-admin.yaml
grep -q "MFA_REQUIRED.*true" apps/admin/.env.production
```

**部署 gate** · admin SPA 上 prod 前 · CI 必检 WAF + MFA 配置。

#### R-A4 · 不允许 admin procedure 不写 admin_audit_log

```bash
# 每个 admin procedure 体内必含 admin_audit.log() 调用
# AST 检测(scripts/audit-admin-audit.ts)
```

**例外** · 仅查的 procedure 由 middleware 统一写(不需要业务代码再写)。

#### R-A5 · 不允许 admin 直接调主应用 LLM Gateway / Specialist

```bash
# admin 不调 LLM(没业务需要)
! grep -rn "import.*LLMGateway" apps/admin/src/
! grep -rn "import.*Specialist" apps/admin/src/
! grep -rn "llmGateway.complete\|llmGateway.stream" apps/api/src/trpc/routers/admin/
```

**例外** · 域 ⑩ Prompt 版本管理需要"试运行新 Prompt 跑 LLM Judge" — **必须通过专门的 admin-llm-judge worker**(不是直接调主 Specialist)。

#### R-A6 · 不允许 admin 操作绕过 admin_audit_log + Approval

```bash
# admin procedure 不能用 raw SQL 绕过 RLS
! grep -rn "\$executeRawUnsafe\|\$queryRawUnsafe" apps/api/src/trpc/routers/admin/

# 高风险动作不能 mock approval
! grep -rn "approvalRequestId.*'mock'\|approvalRequestId.*'bypass'" apps/api/src/
```

### §10.3 14 类高风险动作清单(LD-A4 + ADR-020 引用)

> 每条动作的 `meta.requiresApproval` 配置 · 详见 [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) §4.4 + §7.6。

| # | 动作 | requiresApproval | requireDualApproval | isEmergency |
|:-:|---|:-:|:-:|:-:|
| 1 | admin.users.changePlan(降级) | ✅ | — | — |
| 2 | admin.users.banUser | ✅ | — | — |
| 3 | admin.invites.batchInvalidate(≥10 条) | ✅ | — | — |
| 4 | admin.reviewTrending.updateRules | ✅ | — | — |
| 5 | admin.evolution.forceRebuild | ✅ | — | — |
| 6 | admin.prompts.publishCanary(>10%) | ✅ | — | — |
| 7 | admin.prompts.rollback | ✅ | — | — |
| 8 | admin.quota.adjustLong(>24h) | ✅ | — | — |
| 9 | admin.quota.changePlanQuota | ✅ | — | — |
| 10 | admin.compliance.changeDisclaimer | ✅ | — | — |
| 11 | admin.ab.startStop | ✅ | — | — |
| 12 | admin.knowledge.changeConstants | ✅ | — | — |
| 13 | admin.config.changeFeatureFlag(≥10%) | ✅ | — | — |
| 14 | admin.config.emergencyStop | ✅ | — | ✅ |
| **D-1** | admin.accounts.batchUpdate(≥100) | ✅ | ✅ | — |
| **D-2** | admin.evolution.batchRebuild(≥10) | ✅ | ✅ | — |
| **D-3** | admin.prompts.publishCanary(=100%) | ✅ | ✅ | — |
| **D-4** | admin.config.changeFeatureFlag(≥50%) | ✅ | ✅ | — |
| **E-1** | admin.config.emergencyStop(prod 报错) | ✅ | — | ✅ |
| **E-2** | admin.quota.tempWhitelist(24h 自动失效) | ✅ | — | ✅ |

### §10.4 admin 子系统的 audit_commands(扩展 §8)

> 在 §8 主应用 audit_commands 基础上 · admin 专属增加以下 5 类:

#### §10.4.1 LD-A 检测

```bash
# LD-A1 · admin OAuth 独立
! grep -rn "QUANQN_WEB_CLIENT" apps/admin/

# LD-A2 · adminRouter / appRouter 严格分离
! grep -rn "from.*routers/app" apps/api/src/trpc/routers/admin/
! grep -rn "from.*routers/admin" apps/api/src/trpc/routers/app/

# LD-A3 · admin 跨账号查必带 adminRLS
node scripts/audit-admin-rls.ts  # AST 检测每个 admin procedure 必经 adminRLS

# LD-A4 · 14 类高风险动作必带 requiresApproval
node scripts/audit-approval-gates.ts

# LD-A5 · TrendingScraper / FileParser 不直接写主表
! grep -rn "prisma.trendingItem.create" apps/api/src/workers/trending-scraper/
! grep -rn "prisma.deepLearningArchive.create" apps/api/src/workers/file-parser/
```

#### §10.4.2 R-A 红线检测

```bash
bash scripts/audit-redlines-admin.sh  # 6 条 R-A 红线一键 grep
```

#### §10.4.3 admin 集成测试

```bash
pnpm --filter @quanqn/api test:admin           # admin router 单元测试
pnpm --filter @quanqn/api test:admin-integration  # 含 6 闸鉴权链
pnpm test:e2e:admin                            # admin SPA E2E
```

#### §10.4.4 admin 审计闭环检测

```bash
# 跨账号查必写 admin_audit_log
node scripts/audit-cross-account-query.ts

# 高风险动作必带 approvalRequestId 关联
node scripts/audit-approval-link.ts

# 紧急通道必有 24h 后置复核 cron
node scripts/audit-emergency-postreview.ts
```

#### §10.4.5 部署前 gate

```bash
# admin SPA 上 prod 前必检
test -f infra/cloudflare-waf-admin.yaml || exit 1
grep -q "MFA_REQUIRED.*true" apps/admin/.env.production || exit 1
grep -q "QUANQN_ADMIN_CLIENT_ID" apps/admin/.env.production || exit 1
```

### §10.5 admin 子系统的测试要求(扩展 §7)

| 测试类别 | 主应用要求(§7)| admin 增量 |
|---|---|---|
| 单元 | Specialist input→output 200+ | + admin Service 单元 50+(13 业务管理域 ServiceImpl) |
| 集成 | tRPC procedure 端到端 50+ | + admin procedure 60+(14 router · 平均 4.3 用例)|
| E2E | 主链路 8-10 | + admin 主链路 8(登录/MFA/跨账号查/Approval/审核/导出/封禁/紧急止损)|
| LLM Judge | Specialist 输出 100 金标准 | + admin 域 ⑩ Prompt 版本灰度 LLM Judge |
| **★ Approval 闭环** | (主应用无)| **必须 100%** · 14 类高风险 + 4 类二次 + 2 类紧急 全闭环测试 |

### §10.6 admin 子系统跟主应用文档的映射

| 主应用文档 | admin 子系统对应章节 |
|---|---|
| ARCHITECTURE.md | ADMIN-ARCHITECTURE.md(平级 · 不叠加 · 通过 §1.4b 边界声明协同)|
| AGENTS.md §1-9 | AGENTS.md §10(本章)= admin 子系统宪法 |
| ADR.md ADR-001~018 | ADR-019(monorepo)+ ADR-020(Approval Gates)+ ADR-021(管理后台独立)|
| DATA-MODEL.md §1-10 | DATA-MODEL.md §11(待加 · admin 13 张新表)|
| PROMPTS.md | (admin 不调 LLM · 无对应)|
| SCAFFOLD.md src/ 80 文件 | SCAFFOLD.md §A(monorepo workspace 完整结构)|

### §10.7 一句话总结

> **§3-§9 是主应用宪法 · §10 是 admin 子系统宪法**。
> Ralph / Opus 在 `apps/admin/` 或 `apps/api/src/trpc/routers/admin/` 下写代码时 · 本章 5 LD + 6 红线**优先于** §3-§5 通用红线适用 · 配套 §10.4 audit_commands 5 类 admin 专属检测 · 形成完整闭环。

---

## §11 前端实施沉淀(动态 · PRD-3 起累加)

> **来源** · 各 PRD 收官 retro 的"文档回流候选" · 经用户确认后追加到本章。
> **性质** · 不是 LD 锁定决策 · 是已实施的事实约束 + 高频陷阱 · 防 ralph 在 PRD-(N+1) 重蹈覆辙。
> **更新规则** · 仅追加 · 引用 file:line · 跨 PRD 累加(类似 §3 LD 但语义更轻)。

### §11.1 路由架构(PRD-3 US-001 沉淀 · `apps/web/src/router.tsx:58-114`)

- 入口 · `apps/web/src/main.tsx` 用 `<RouterProvider router={router}>`
- 34 路由 = 9 step + 14 工具 + 6 模块 + 3 辅助(/ip-plan, /settings, /login)+ index 重定向 + catch-all `/*`
- **同模块共享 chunk**(防 34 chunk 太碎)· `React.lazy(() => import(/* webpackChunkName: "step|tools|modules" */ '@/pages/...'))`
- 嵌套结构 · `RootLayout`(共享 Header)→ `StepLayout`(/step/* 子路由 · 共享 FeedbackButton)→ 各页

**给后续 PRD ralph** · 加新页时按现有 chunk 分组放(step → step chunk · tool → tools chunk · 新模块 → modules chunk · 辅助页独立 chunk)。

### §11.2 跨包类型共享(PRD-3 US-003 沉淀 · `packages/clients/router-types.ts`)

- `apps/api/src/trpc/_app.ts` 的 `AppRouter` type 不能直接 import 进 `apps/web`(monorepo cross-package + tsc rootDir 报错)
- 用 `packages/clients/router-types.ts` 做 shadow `initTRPC` · 导出 `AppRouter` type · web/admin 共用
- **新加 router 时不要直接在 web 内 inline AppRouter** · 改 packages/clients

### §11.3 Layout 共享组件防重复(PRD-3 US-005/006 沉淀 · `apps/web/src/layouts/StepLayout.tsx`)

- `StepLayout` 已渲染共享 `<FeedbackButton>` · **11 step 页内不要再渲染 FeedbackButton**
- 否则 `getByTestId('feedback-good')` 命中 2 个 element · playwright strict mode 拒绝
- **泛化规则** · Layout 层共享 UI(toast / FeedbackButton / breadcrumb / etc)时 · 子页面不要重复
- grep 检测 · `grep -rn "FeedbackButton" apps/web/src/pages/step` 应只在 import 不在 JSX 渲染

### §11.4 列表 viewport overflow 防御(PRD-3 US-006 沉淀 · `apps/web/src/components/Header.tsx:140-160`)

- Radix DropdownMenuContent / SelectContent / CommandList 套 `.map(items)` 时 · **items 可能 > 8 必须套 `<ScrollArea className="h-N">`**
- 否则大 N 数据(30+)items 溢出 dropdown viewport · playwright click 56× retry 30s timeout · 用户也无法点击底部新建项
- 同 codebase `ToolsDropdown` 用 `h-52`(208px · 14 工具) · `AccountDropdown` 用 `h-60`(240px · 邀请制内测期 1-3 accounts 默认空旷 · TD-011 留 polish)
- **泛化规则** · 任何 list 组件,N 不可控时套 ScrollArea + 显式高度
- audit grep · 见 `scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md §H Frontend list/dropdown 域`

### §11.5 IP 账号切换契约(PRD-3 US-004 沉淀 · `apps/web/src/hooks/useActiveAccount.ts:30-58`)

- 切账号 = `trpc.ipAccounts.switchActive.mutate(...)` → onSuccess: `clearLsNamespace(localStorage, oldAccountId)` → `window.location.reload()`
- 预热 · `AccountDropdown` 拉 `trpc.ipAccounts.list` 用 `staleTime: 30_000` · 切换前 list 已在 React Query cache
- 幂等 · `currentAccountId === newAccountId` 直接 return · 不 reload(AC-4)
- 失败 · `onError` 触发 `toast.error('切换失败 · 请重试')` · 不 reload(AC-5)
- **不要在其他位置自己实现切账号** · 全部走 `useActiveAccount.switchTo`

---

## §11.6 后端 Specialist 实施沉淀(PRD-4 起累加)

> **来源** · PRD-4 retro §8 文档回流候选 7 条 · commit 事实驱动 · 经 v0.4 用户确认追加。
> **性质** · 7 Specialist 真接 LLMGateway 后沉淀的事实约束 + 高频陷阱 · 防 PRD-5+ 新 Specialist 重蹈覆辙。

### §11.6.1 BaseSpecialist 模板方法(PRD-4 US-001 沉淀 · `apps/api/src/specialists/base/BaseSpecialist.ts:1-250`)

- **统一抽象** · 7 Specialist 全继承 `abstract class BaseSpecialist<TIn, TOut>` · 模板方法 4 步 ·
  1. `inputSchema.parse(req.userInput)` ← 输入校验
  2. `await this.contextAssembler.assemble(req)` ← 装配 prompt(L2/L4/L5 + 常量)
  3. `await this.invokeLLM(systemPrompt, userPrompt, ...)` ← **子类实现**
  4. `outputSchema.safeParse(llmResp.content)` ← 输出校验 + retry 1 → 二次失败 throw SchemaValidationError
  5. `_writeCostLog(...)` ← cost_log 7 字段(agentId/accountId/traceId/modelUsed/promptTokens/completionTokens/durationMs/callType='specialist_call'/eventType/target jsonb)
- **子类只填** · `config(五层 persona/memory/knowledge/tools/execution)` + `inputSchema` + `outputSchema` + `invokeLLM` 4 项 · **不重写 execute()** 模板方法
- **单实例 export**(REJ-004) · `export const positioningAgent = new PositioningAgent()` · router 调 `specialist.execute(...)` 不要 `new Specialist().execute()`
- **TraceId** · 用 `generateSpecialistTraceId(accountId, agentId)`(REJ-017 · 不要用 `generateHttpTraceId`)
- **错误类** · `SchemaValidationError(zodError, llmRawOutput)` / `LLMTimeoutError(agentId, timeout_ms)` / `FallbackTriggeredError`(`apps/api/src/specialists/base/errors.ts`)

### §11.6.2 ContextAssembler 4 路并行 + 降级(PRD-4 US-002 沉淀 · `apps/api/src/services/context-assembler/ContextAssembler.ts:1-170`)

- **接口** · `assemble(req: AssembleRequest) => Promise<AssembledContext>` · 完全对齐 ARCHITECTURE §6.4
- **4 路并行** · `Promise.allSettled` 不用 `Promise.all`(D-020)· 各路独立 `withTimeout(5000)` · 任一失败降级注入空段不阻断主流程
- **L2 stepData fetch** · 真接 `prisma.stepData.findMany({ where: { accountId } })`(REJ-008 RLS 必)
- **L4 EvolutionProfile / L4 Samples** · 本期降级跑空(留 PRD-7+)· 注入 `[L1 阶段 · 暂无进化档案]` 占位
- **L5 RAG** · 本期 D-025 降级跑空 · `ragResult` 总返 `[]` · `needRag` 字段保留接口
- **MethodologyQueryWorker** · 真接(`apps/api/src/workers/methodology-query/index.ts`)· in-memory 常量(industries / hotElements / scriptTypes)
- **AssembledContext.metadata** · `layersUsed: string[]` 真实反映哪些层 fetched 成功 · `contextTokens` 用 `chars/4` 粗算(本期接受)
- **R-001 grep** · 注释里也不能含 `BASE_LLM_URL` / `LLM_API_KEY` / `sk-` 字样 · 否则 grep 命中 fail

### §11.6.3 多 mode Specialist 模板 + race window 警示(PRD-4 US-004/005/008/009 沉淀)

- **触发** · 同一 Specialist 接多个 step / mode(`PositioningAgent` industry+execution / `BrandingAgent` packaging+persona / `VideoAgent` 4 mode / `CopywritingAgent` 4 mode)
- **模板** ·
  - `private _mode: Mode` instance state
  - `outputSchema` getter 按 `this._mode` 返回对应 schema(REJ-007 · 防多 mode 共用单一 schema)
  - `invokeLLM` 最先 `set _mode`(在 throw mode 不合法之后)→ BaseSpecialist safeParse 才能读对的 schema
  - `TIMEOUT_MS Record` 按 mode 分配(packaging=60s / persona=45s)
- **⚠️ TD-014 race window** · `_mode instance state + outputSchema getter` 在**单 user 串行场景安全**(P3 主流程 9 step)· **高并发治理留 PRD-7+**(选项 A · `outputSchema` 改 method `(req) => schema` · 选项 B · `AsyncLocalStorage` 隔离 _mode · 选项 C · 接受文档化)
- **跨 PRD 复用** · PRD-5 解锁 `CopywritingAgent` free/boom/acquisition mode 时**仍按现模式实施** · TD-014 留高并发场景治理(影响 4 → 5+ Specialist 同模式)
- **audit grep** · 见 `scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md §I Multi-mode Specialist race window 域`

### §11.6.4 SSE Specialist 模式 + stream meta chunk(PRD-4 US-007/009 沉淀 · `apps/api/src/specialists/{TopicAgent,CopywritingAgent}.ts`)

- **触发** · `streaming=true` Specialist(TopicAgent step5 · CopywritingAgent step7)· `model_tier='reasoning'` · `timeout_ms=60000`
- **invokeLLM 重写 SSE** ·
  - `for await (const chunk of gateway.stream(...))` accumulate → `JSON.parse`
  - `_consumeStream()` 私有方法封装 stream 消费 · 失败 throw 让 BaseSpecialist retry
- **★ stream meta chunk 模式**(D-019 闭环) ·
  - `LLMGateway.stream()` 首 chunk emit `{ type: 'meta', meta: { model: actualModel } }`
  - Specialist `_consumeStream` 接收 model · `invokeLLM` 返回真 model
  - `cost_log.modelUsed` 反映 LLMGateway **真选 model**(不硬编码 `'claude-sonnet-4-6'` 等)· REJ-003 grep 0 命中
- **跨 SSE Specialist 复用** · TopicAgent + CopywritingAgent 全用此模式 · PRD-5 起新 SSE Agent 直接继承
- **retry 路径** · invokeLLM **不 throw** · 改返回 `{ content: null, isFallback: true }` 让 BaseSpecialist Step 4 safeParse 失败触发 retry(BaseSpecialist Step 3 catch 仅处理 AbortError → LLMTimeoutError · 不 cover 断流)

### §11.6.5 responseFormat 双 schema 策略(PRD-4 US-004/009 沉淀)

- **触发** · outputSchema 含 `.refine()`(如 `Step4OutputSchema` markdown.min(1000).refine('# 执行计划' heading))
- **问题** · `.refine()` 不能序列化为 JSON Schema · 不能直接传给 LLM `responseFormat`
- **方案** · 双 schema ·
  - `Step4BaseSchema` = `z.object({...})` ← **无 refine** · 给 LLM `responseFormat` 用(序列化为 JSON Schema)
  - `Step4OutputSchema` = `z.object({...}).refine(...)` ← **含 refine** · BaseSpecialist post-validate 用(运行时校验 heading)
- **类型双重 cast** · `Step4OutputSchema as unknown as z.ZodType<TOut>`(因为 `.refine()` 返回 `z.ZodEffects` 不能直接赋值给 `ZodType<Union>`)
- **实证** · PositioningAgent step4 + CopywritingAgent step7 · 全用此模式

### §11.6.6 stepData.save handler 必覆盖全 9 step(PRD-4 US-017 教训 · `apps/api/src/trpc/routers/stepData.ts`)

- **背景** · PRD-4 US-017 e2e 跑时发现 save handler 漏 `step5/step7` · 返回 `null` result → UI skeleton 永挂 · 浪费 1 次 e2e 跑(~30 min)
- **铁律** · `stepData.save` handler **必须覆盖全 9 step**(step1/3/3b/4/4b/5/6/7/8)· **save 路径漏任一 step → UI skeleton 永挂 / save 返回 null**
- **router cross-cut audit 在每个 PRD 收官前必跑** · `grep -E "case 'step\w+'" apps/api/src/trpc/routers/stepData.ts | wc -l` 应 = 9
- **default 分支安全** · `default: throw new Error('Unsupported stepKey')` 比 `return null` 安全(漏 step 立刻报错而非静默失败)
- **同模式适用** · 14 工具调度 router / 6 模块 router · N-step / N-route handler 都遵守
- **audit grep** · 见 `scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md §J Cross-cut router coverage 域` + `scripts/ralph/VALIDATOR.md Router cross-cut coverage 验证`

### §11.6.7 LLM Judge 测试套件(PRD-4 US-016 沉淀 · `tests/judge/`)

- **目的** · 验证 7 Specialist 输出质量(用 LLM 评分而非死规则)· cost 控制 + 自动化覆盖
- **架构** ·
  - 独立 `vitest.judge.config.ts`(@/ alias 与主 vitest.config.ts 一致)
  - `tests/judge/judge-runner.ts` 共享 `runJudge(case_)` · `model_tier='lightweight'`(haiku / 4o-mini)· `timeout_ms=10000` · `retry=1` 内置
  - 7 Specialist × 1-2 golden case · `tests/judge/{positioning,branding,monetization,topic,video,copywriting,livestream}.judge.ts`
  - `package.json` 加 `"test:judge": "vitest run --config vitest.judge.config.ts"` script
- **cost_log 区分** · `eventType='judge_call'`(不污染 specialist_call 数据)· `cost-logger.ts` 通过 `req.metadata.eventType` 穿透
- **触发** · CI 跑(无需 RUN_LIVE_TESTS · lightweight model cost 可控)· `pnpm test:judge` 14/14 pass
- **PRD-5 起新 Specialist** · 必加 1-2 golden case 到 `tests/judge/` · 走同 judge-runner · 复用 lightweight model

---

## 修订记录

- **2026-05-06 v0.1** · 创建骨架 + 9 章节全部填充
  - §1 Mission(81 行)
  - §2 Tech Stack(102 行)
  - §3 Locked Decisions · 18 LD(218 行)
  - §4 设计约束(380 行)
  - §5 红线 · 17 R(375 行)
  - §6 编码规范(288 行)
  - §7 测试要求(311 行)
  - §8 audit_commands(378 行)
  - §9 上下文加载顺序(本节)
- **2026-05-07 v0.2** · 加 §10 admin 子系统代码层约束(对应 REVIEW P0-1 派生 + ADR-021)
  - §10.1 · 5 条 LD-A(独立部署 / 严格分离 / RLS 闭环 / Approval Gates / 内容审核硬闸门)
  - §10.2 · 6 条 R-A 红线(import 边界 / 入口隐藏 / 部署 gate / audit 闭环 / 不调 LLM / 不绕审计)
  - §10.3 · 14 类高风险 + 4 类二次审批 + 2 类紧急通道完整清单
  - §10.4 · admin 专属 audit_commands 5 类(LD-A 检测 / R-A 红线 / 集成测试 / 审计闭环 / 部署 gate)
  - §10.5 · 测试要求(60+ admin 集成 · 8 admin E2E · Approval 闭环 100%)
  - §10.6 · admin 跟主应用文档映射(ADR-019/020/021 + DATA-MODEL §11 + SCAFFOLD §A)
- **2026-05-08 v0.3** · 加 §11 前端实施沉淀(动态 · PRD-3 起累加 · /prd-retro 文档回流)
  - §11.1 · 路由架构(34 路由 · 同模块共享 chunk · React.lazy webpackChunkName)
  - §11.2 · 跨包类型共享(packages/clients/router-types.ts shadow AppRouter)
  - §11.3 · Layout 共享组件防重复(StepLayout 已渲染 FeedbackButton · 11 step 页不重复)
  - §11.4 · 列表 viewport overflow 防御(Radix DropdownMenu N>8 必须 ScrollArea + h-N)
  - §11.5 · IP 账号切换契约(useActiveAccount.switchTo · clearLsNamespace + reload)
- **2026-05-09 v0.4** · 加 §11.6 后端 Specialist 实施沉淀(PRD-4 retro 文档回流 · 7 候选 commit 事实驱动)
  - §11.6.1 · BaseSpecialist 模板方法(`abstract class BaseSpecialist<TIn, TOut>` · 4 步模板 · 子类只填 config + inputSchema + outputSchema + invokeLLM · 单实例 export REJ-004 · TraceId 用 generateSpecialistTraceId REJ-017)
  - §11.6.2 · ContextAssembler 4 路并行 + 降级(Promise.allSettled + 5s timeout · L2 真接 / L4/L5 降级跑空 D-020/D-025 · MethodologyQueryWorker 真接常量)
  - §11.6.3 · 多 mode Specialist 模板 + race window 警示(`_mode + outputSchema getter` · ⚠️ TD-014 race window · 单 user 串行安全 · 高并发治理留 PRD-7+)
  - §11.6.4 · SSE Specialist 模式 + stream meta chunk(`{type:'meta',meta:{model:actualModel}}` 首 chunk · cost_log.modelUsed 反映真 model · D-019 闭环 · invokeLLM 不 throw 改返回 isFallback 让 BaseSpecialist retry)
  - §11.6.5 · responseFormat 双 schema 策略(`.refine()` 不能序列化为 JSON Schema · LLM 用 BaseSchema · post-validate 用 OutputSchema · 类型双重 cast)
  - §11.6.6 · stepData.save handler 必覆盖全 9 step(US-017 教训 · default throw 比 return null 安全 · 每 PRD 收官前 cross-cut audit)
  - §11.6.7 · LLM Judge 测试套件(`vitest.judge.config.ts` 独立 · `model_tier='lightweight'` · `eventType='judge_call'` · 7 Specialist × 1-2 golden case · `pnpm test:judge` 14/14)
