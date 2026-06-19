# QuanAn · 代码层约束(AGENTS.md · R7 精简版)

> **版本** · v1.1-r7(2026-06-12 R7 瘦身 · 原 AGENTS.md 3714 行 → 318 行主文件，≤500 达标)
> **派生自** · ARCHITECTURE.md v0.4 + ADMIN-ARCHITECTURE.md v0.2
> **服务对象** · Ralph Agent / Opus Audit / 任何 AI / 工程师在本仓库写代码时遵循
> **硬约束** · 本文件的 LD / 红线 是**不可绕过**的 — 必须先改本文件再改代码
> **配套** · ADR.md · DATA-MODEL.md · PROMPTS.md · .claude/rules/（下沉细节）

---

## 文档地图

> **Harness = `docs/architecture/01-06` 这 6 根承重墙 L3 架构的护栏**。本文件的 LD / 红线 / audit 脚本，是对以下 6 墙 L3 架构决策的机器可检测护栏（承重墙编号见 KB《Agent项目架构实质性标准》）：
> - `docs/architecture/01-编排架构.md` — 承重墙② 控制流/编排（三层编排 + 共享记忆松耦合）
> - `docs/architecture/02-上下文工程.md` — 承重墙① 上下文工程（ContextAssembler 7 路 + 全量注入）
> - `docs/architecture/03-记忆.md` — 承重墙③ 记忆/状态（五层 · 活跃 vs 声明）
> - `docs/architecture/04-可靠性.md` — 承重墙④ 可靠性/失败（6 层兜底链）
> - `docs/architecture/05-演进.md` — 承重墙⑤ 演进/反馈（飞轮 · 单向反哺）
> - `docs/architecture/06-多租户隔离.md` — 条件承重墙⑥ 多租户/RLS（三道闸 · RLS 失效=Agent 拿到别人的大脑）
>
> 以上 6 文件是架构真相源；改代码前必须对齐这 6 墙不可破坏约束（每墙 L3 六条），否则 audit 直接 reject。

| § | 章节 | 一句话 | 详细文档 |
|:-:|---|---|---|
| §1 | **Mission** | 9 步 AI 向导 · 14 Specialist(含 PresentationAgent) · Aurelian Dark 三位一体 | ARCHITECTURE.md §1 |
| §2 | **Tech Stack(锁定)** | Vite+React+tRPC+Postgres+pgvector+Claude Sonnet 4.6 — 锁定 | ADR.md |
| §3 | **18 LD 锁定决策** | 编排/记忆/数据/接口/视觉/测试/法律 全架构约束 | ADR.md + 下方断言 |
| §4 | **设计约束** | Workflow/Agent 决策树 · 数据隔离 · 接口契约 | .claude/rules/design-constraints.md |
| §5 | **红线(22 条)** | 任一触犯 = Opus 直接 reject | .claude/rules/redlines-detail.md |
| §6 | **编码规范** | 命名 · 错误处理 · 类型 · 注释 · Commit | .claude/rules/coding-standards.md |
| §7 | **测试要求** | 5 层金字塔 · LLM Judge · 覆盖率门槛 | .claude/rules/testing.md |
| §8 | **审计入口** | `pnpm audit:redlines` + `bash scripts/audit-ld.sh` | .claude/rules/audit-playbook.md |
| §9 | **上下文加载** | 任务类型 → 必读文档表 | 下方表格 |
| §10 | **Session 卫生** | 清洁退出五维 · 跨 session 协议 · 初始化 | 下方节 |
| §11 | **Admin 子系统** | 11 LD-A · 6 R-A · 6 闸鉴权 | .claude/rules/admin-subsystem.md |
| §12 | **高频陷阱** | 15 条 PRD 实测教训（已发生的） | docs/harness-archive/实施沉淀-2026H1.md |
| 历史 | **修订记录** | R8 2026-06-18 · R7 2026-06-12 · v1.0 2026-05-23 | docs/harness-archive/实施沉淀-2026H1.md |

---

## §1 Mission

> **善用 AI · 你一个人就是千军万马** — 把"做 IP / 上短视频 / 私域成交"全链路拆成 9 步 AI 向导 + 13 个独立工具 · 让个人 IP 起号者 / OPC 创业者 / 传统行业转型者 / MCN 团队 用 AI 替代营销部全职岗。

**9 步主线断言**（Ralph 不允许跳步 · 不允许新增步骤）：Step1 定行业 → Step3 账号包装 → Step3b 人设 → Step4 执行计划 → Step4b 变现 → Step5 选题 → Step6 拍摄 → Step7 文案 → Step8 直播

**14 Specialist**：PositioningAgent · BrandingAgent · MonetizationAgent · TopicAgent · CopywritingAgent · VideoAgent · LivestreamAgent · PrivateDomainAgent · AnalysisAgent · DiagnosisAgent · DeepLearnAgent · EvolutionAgent · DailyTaskAgent · PresentationAgent（精确这 14 个 · 数量锁定；含 PresentationAgent(PRD-27)；VoiceChatAgent 已删除（语音下线））

**北极星 NSM**：7 天内有 ≥1 次 Specialist 调用 + 完成 ≥3/9 步的活跃 IP 账号数

**6 项目原则**（遇到抉择按此排序）：架构透明 > 抽象封装 · Schema 严格 > 灵活 · 多账号隔离 > 性能 · 能力域共享 > 页面独立 · Workflow > Agent · 常量 > RAG · 测试覆盖 > 完成度

**边界**：ARCHITECTURE.md = "做什么/为什么"；本文件 = "怎么做/不能做什么"。改本文件红线触犯会被 Opus 审计 reject；改 ARCHITECTURE.md 不会让代码报错。

---

## §2 Tech Stack（锁定表）

> ⚠️ 任何变更必须先开新 ADR 走完决策流程 · 才能改本表 · 才能改代码。patch/minor 版本升级不需 ADR · 但需测试。

| 层 | 锁定 | 主版本 |
|---|---|:-:|
| 渲染框架 | `react` + `react-dom` | **18.x** |
| 路由 | `react-router-dom` | **6.x** |
| 构建 | `vite` | **5.x** |
| TS | `typescript` strict + `noUncheckedIndexedAccess: true` | **5.4+** |
| 样式 | `tailwindcss` | **3.4+** |
| 组件库 | `@shadcn/ui`(via CLI copy) + `@radix-ui/react-*` | latest |
| 数据获取 | `@tanstack/react-query` | **5.x** |
| 状态管理 | `zustand` | **4.x** |
| API | `@trpc/client` + `@trpc/react-query` + `@trpc/server` | **11.x** |
| 表单+验证 | `react-hook-form` + `zod` | **7.x** + **3.23+** |
| 包管理 | `pnpm` | — |
| Runtime | Node.js | **20 LTS** |
| HTTP Framework | `hono` | **4.x** |
| ORM | `prisma` | **5.x** |
| 队列 | `bullmq` + `ioredis` | **5.x** |
| 日志 | `pino` | **9.x** |
| 主库 | **PostgreSQL 16**（Supabase 托管） | — |
| 向量库 | **pgvector**（不引入 Qdrant/Pinecone/Milvus） | — |
| 缓存 | **Redis 7+** | — |
| LLM-reasoning | `claude-sonnet-4-6`（降级 `gpt-4o`） | — |
| LLM-lightweight | `claude-haiku-4-5`（降级 `gpt-4o-mini`） | — |
| Embedding | `text-embedding-3-small`（1536 维） | — |
| Test runner | `vitest`（单元/集成）+ `playwright`（E2E） | — |
| CI | GitHub Actions | — |
| 前端托管 | Vercel 或 Cloudflare Pages（MVP 二选一） | — |
| 后端托管 | Railway 或 Fly.io（MVP 二选一） | — |

**降级由 LLMGateway 自动处理**·应用代码只指定 `model_tier: 'reasoning' | 'lightweight'`，不直接选模型。

---

## §3 Locked Decisions（18 条断言）

> 每条 LD 对应 ADR.md 详细 Context/Options/Decision/Consequences。下方仅列核心断言+违规检测。ADR.md 全部 18 条均为 Accepted 状态，可直接查阅详情。

### §3.1 编排（LD-001~003）

**LD-001**·95% Workflow / 5% Agent：2 个 L5 自治 Agent = EvolutionAgent/DailyTaskAgent（VoiceChatAgent 已删除）；其余全部 Workflow。→ ADR-001/002
检测：`grep -A30 "execute(" apps/api/src/specialists/*.ts apps/api/src/agents/**/*.ts | grep -E "for|while" | grep llm`→0 命中
例外：无——任何 Specialist 不允许内部多轮 LLM，多轮场景必须走 3 个 L5 之一

**LD-002**·14 能力域 Specialist（含 PresentationAgent(PRD-27)；按域归并·不按 URL 一对一）→ ADR-003
检测：`grep -rl "extends BaseSpecialist" apps/api/src --include=*.ts | grep -v test | wc -l`=14(12 step+2 autonomous·与 R-15/audit 同口径)

**LD-003**·Specialist 之间 0 直接调用（通过 ContextAssembler / EvolutionAgent 飞轮） → ADR-004
检测：`bash scripts/audit-ld.sh`（LD-003 段）
例外：DeepLearnAgent 写 EvolutionProfile 合法（写记忆，不是调用 Agent）

### §3.2 自治+共享（LD-004~005）

**LD-004**·3 L5 Agent 走外部 orchestrator（ADR-018 模式·BaseSpecialist execute() 单次·由 bullmq/Cron/用户事件外部触发） → ADR-005
检测：`bash scripts/audit-ld.sh`（LD-004 段）→0 self-loop

**LD-005**·全部 14 Specialist 继承 BaseSpecialist·实现 execute()·声明 5 层 SpecialistConfig · re-export stub（D-007+TD-024）豁免 → ADR-003
检测：`bash scripts/audit-ld.sh`（LD-005 段）

### §3.3 记忆+飞轮（LD-006~008）

**LD-006**·5 层记忆：L1 Buffer / L2 Core / L3 Recall / L4 Profile / L5 Trending Cache（不用 Summarizer/Portrait） → ADR-006

**LD-007**·ContextAssembler 是 prompt 注入**唯一入口**·严禁 Specialist 内自拼 systemPrompt → ADR-007
检测：`grep -rn 'systemPrompt\s*=\s*[` + "`" + `'"]' apps/api/src/specialists/`→0 命中
例外：单元测试可 mock ContextAssembler，但不能完全绕过

**LD-008**·反馈飞轮 5 阶段（生成→反馈→触发→跑批→注入）·EvolutionProfile 必须是**账号级**（account_id 唯一索引，不允许 user_id 主键） → ADR-008/009

### §3.4 数据架构（LD-009~011）

**LD-009**·IpAccount 聚合根·3 道闸：ORM 强制 WHERE accountId + Postgres RLS + Redis/LS 命名空间·全局表仅 User/InviteCode/TrendingItem → ADR-010

**LD-010**·LS↔DB 双写 4 规则（写 LS 优先+后台 mutation·读 LS 优先+后台 invalidate·切账号 reload+预热·7 实体不入 LS） → ADR-011
7 实体不入 LS：DiagnosisReport / EvolutionProfile / EvolutionInsight / FeedbackLog / DeepLearningArchive / KnowledgeFavorite / TrendingItem

**LD-011**·≤30KB 常量直接 import（不入向量库）·RAG 用 pgvector·禁止引入 qdrant/pinecone/weaviate → ADR-012
例外：数据量 >1M 向量后可重新评估（开新 ADR）

### §3.5 接口+护栏（LD-012~014）

**LD-012**·全部 LLM 调用经 LLMGateway.complete() / .stream()·严禁业务代码 `import OpenAI` / `import Anthropic` → ADR-013
检测：`bash scripts/audit-redlines.sh`（R-1）

**LD-013**·所有 Specialist 输出过 zod 校验·失败重试 1 次·仍失败标 is_fallback=true·代码禁 `any` type·全部调用带 trace_id → ADR-014

**LD-014**·错误恢复：LLM 失败重试 1→降级 lightweight→fallback 模板·EvolutionAgent 升级+insight 写入**必须同事务**·stepData 乐观锁（version 字段） → ADR-014

### §3.6 视觉（LD-015）

**LD-015**·Aurelian Dark（金 #d4af37/--primary）·弃用赛博青 #00e5ff·ADR.md ADR-015（颜色权威；原 ui/aurelian_dark/DESIGN.md 已随 34dc2f9 移除）·Lucide 1.5/2px stroke 非 filled → ADR-015
检测：`grep -rn "#00e5ff\|cyan-\|Orbitron\|Rajdhani" apps/web/src apps/api/src --include="*.ts" --include="*.tsx" --include="*.css"`→0 命中
例外：Active 状态指示可用 filled 图标，加注释 // active state filled icon

### §3.7 测试（LD-016）

**LD-016**·单元覆盖率≥80%（核心 agents ≥90%）·集成≥40 用例·E2E≥8 用例·LLM-as-Judge≥4.0/5.0·prompt 改动必跑回归不下降 → ADR-016
例外：src/lib/utils/ 不要求 LLM Judge，但单元覆盖 100%（高于标准）

### §3.8 法律+合规（LD-017~018）

**LD-017**·trending 必须走第三方授权（新榜/蝉妈妈/飞瓜 API）·**绝对禁止**自建爬虫（puppeteer/playwright+代理） → ADR-017
例外：无——即使 dev 环境也不允许自建爬虫

**LD-018**·医疗/法律/金融行业生成内容加免责声明·用户 PII（邮箱/手机/真实姓名）不得入 prompt（替换为占位符） → ADR-018

---

## §4 设计约束（核心判断规则）

> 详细决策树、代码示例、接口规范见 `.claude/rules/design-constraints.md`

**Workflow vs Agent 判断（派生 LD-001）**：
- 用户主动 + 单次 LLM → L4 Workflow（默认）
- 系统主动（Cron/事件）+ LLM 自主决策多轮 → L5 Agent（仅 3 个）
- 新功能**默认 L4 Workflow**·想用 L5 必须先开 ADR

**Specialist 切分（派生 LD-002）**：输出物相似→加 mode 分支·输入字段重叠≥70%→加 mode 分支·跨类型（生成/分析/写记忆）→必须独立·新增第 16 个必须先开 ADR

**数据隔离 3 道闸（铁律 · 派生 LD-009）**：
1. 路由层：每个 procedure 必须有 accountIsolation middleware（校验 activeAccountId 归属）
2. 存储层：非全局表必须 RLS + `prisma.X.findMany` 带 `where: { accountId }`
3. 缓存层：Redis key 格式 `acc_${accountId}:*`·LS key 格式 `acc_${accountId}_*`·pgvector namespace `account_${accountId}`

**模块依赖方向（单向）**：L1 UI → L2 Hooks → L3 tRPC Client ─网络分割─ L4 tRPC Router → L5 Specialist → L6 ContextAssembler/LLMGateway → L7 Workers。禁止跨层跳调。

**写代码前 5 个判断**（任一答不出来先回文档再动手）：
1. 这是新 Specialist 吗？→ §3.1 LD-002（大概率加 mode）
2. Workflow 还是 Agent？→ LD-001（默认 Workflow）
3. 数据放哪？→ LD-009（必带 account_id）
4. 调 LLM 怎么调？→ LD-012（必经 LLMGateway+trace_id）
5. 文件放哪？→ ARCHITECTURE.md §4.6 目录树

---

## §5 红线（22 条 · 任一触犯 = 直接 reject）

> 详细代码示例/错误范例见 `.claude/rules/redlines-detail.md`。下方是核心断言+检测指针。
> 一键检测：`pnpm audit:redlines`（调 `scripts/audit-redlines.sh`）+ `bash scripts/audit-ld.sh`

| # | 红线 | 触犯 LD | 快速检测 |
|---|---|---|---|
| R-1 | 直接调 LLM SDK 跳过 LLMGateway | LD-012 | `scripts/audit-redlines.sh` R-1 |
| R-2 | Specialist 之间互相调用 | LD-003 | `grep "Agent\.run\|Agent\.invoke" apps/api/src/specialists/` |
| R-3 | Specialist 内多轮 LLM 循环 | LD-001 | `scripts/audit-ld.sh` LD-001 |
| R-4 | DB 查询漏 account_id | LD-009 | `scripts/audit-redlines.sh` R-4 |
| R-5 | Redis/LS 命名漏 account_id | LD-009 | `scripts/audit-redlines.sh` R-5 |
| R-6 | 新表不带 RLS / 不带 account_id | LD-009 | migration 后跑 pg_policies 查询 |
| R-7 | 编造 ARCHITECTURE/DATA-MODEL 没有的 schema | LD-013+§1.7 | prisma schema diff DATA-MODEL.md |
| R-8 | 跳过 zod 校验直接 trust LLM 输出 | LD-013 | `scripts/audit-ld.sh` LD-013 |
| R-9 | 不写 trace_id | LD-013 | DB 表 traceId 字段检查 |
| R-10 | 用 `any` type 兜底 | LD-013 | `grep ": any" apps/api/src apps/web/src --include="*.ts"` |
| R-11 | 自己拼 systemPrompt 或 invokeLLM 首参用废弃 `_ctx` 跳过 ContextAssembler | LD-007 | `scripts/audit-redlines.sh` R-11（权威·双 facet：(a) `systemPrompt=` 不走 ctx/assembled + (b) US-005 新增 `grep "_ctx: AssembledContext" specialists/*.ts` 排除 `_build*` 辅助方法） |
| R-12 | EvolutionAgent 升级+insight 不在同事务 | LD-014 | EvolutionAgent 单测必含 transaction rollback 用例 |
| R-13 | stepData.save 不带 version（无乐观锁） | LD-014 | stepData mutation 必含 version 参数 |
| R-14 | 跳过免责声明 / PII 不脱敏（含 specialist _buildUserPrompt 追加路径，非仅 ContextAssembler 主路径·AC③）| LD-018 | `disclaimer.ts`+`pii-mask.ts` 必存在；_buildUserPrompt 追加内容须过 piiMask〔阶段6 补追加路径〕|
| R-15 | 给每个 URL 写独立 Specialist（超过 14） | LD-002 | 数 `extends BaseSpecialist` 类 ≤14(12 step in specialists/ + 2 autonomous in agents/;精确命令见 audit-redlines.sh R-15) |
| R-16 | 用赛博青/Orbitron/aiipznt 原版视觉 | LD-015 | `grep -rn "#00e5ff\|Orbitron\|cyan-" apps/web/src apps/api/src/` |
| R-17 | trending 自建爬虫 + 技术栈未经 ADR 变更 | LD-017+§2 | `grep "puppeteer" apps/api/src/workers/trending-scraper/` |
| R-18 | LLM API Key/密钥明文落库（SystemConfig.configValue/Redis/LS 明文）| G1.8+AC-B | **🔜阶段6实装·当前债务·audit暂未检测；** loadLlmKey 须解密（envelope AES-256-GCM 或 KMS）或仅 env 注入；取 key 处无解密=reject〔阶段6 实装·当前明文=已登记门禁债务〕|
| R-19 | 外部来源内容（RAG chunk/sourceCopy/trending rawContent）入 prompt 前未过注入特征过滤（DANGEROUS_TAGS·0.7 A层）| AC① | **🔜阶段6实装·当前债务·audit暂未检测；** ContextAssembler/specialist 拼外部内容前须调 sanitize；`grep` 外部内容入 prompt 处有无过滤〔阶段6 实装〕|
| R-20 | LLMGateway 调用无 contextTokens 上限截断 / 第三方 API（trending/embedding/imageGen）无独立日预算分桶 | AC②+D9.3 | **🔜阶段6实装·当前债务·audit暂未检测；** ContextAssembler 超阈 graceful trim 不 throw；非 LLM API 分桶限流〔阶段6 实装〕|
| R-21 | account_id 业务表漏 RLS（R-6 仅查新表→存量遗漏，如 trending_favorites）| AC-A+R-6 | `scripts/audit-redlines.sh` R-21（真检测·已落地）；从 prisma/schema.prisma 提取有 accountId 的业务表 → 与 manual_rls.sql ENABLE RLS 求差 → trending_favorites 应被抓出；阶段6 补 manual_rls.sql |
| R-22 | 前端 apps/web import 后端 apps/api 内部模块（`apps/api/src/...`）| NFR-前后端分离 | 前端只经 packages/clients（codegen:shadow 生成类型）+packages/schemas（zod 契约）共享；`grep -rn "from ['\"].*apps/api/src" apps/web/src` 应=0；〔直接 import 真 AppRouter 会 api `@/` 自引用 TS2307+实例化上限·trpc.ts:8〕违犯=reject |

---

## §6 编码规范（核心条目）

> 完整规范（示例/反例/eslint 配置）见 `.claude/rules/coding-standards.md`

**命名**：文件(模块)=kebab-case·文件(React组件)=PascalCase·变量/函数=camelCase·常量(模块级)=SCREAMING_SNAKE_CASE·类型/接口=PascalCase无I前缀·zod schema=PascalCase+Schema后缀·DB表=snake_case复数·DB列=snake_case

**文件大小上限**：单文件 500 行（Specialist 放宽 600 行·prompt 外部化到 PROMPTS.md）·单函数 80 行·单类方法 15 个

**tsconfig 必含**：`strict: true` + `noUncheckedIndexedAccess: true` + `noImplicitOverride: true` + `noUnusedLocals: true` + `noUnusedParameters: true`

**类型规则**：用 unknown+narrow（禁 any）·用 const+as const（禁 TS enum）·zod schema 是真理来源（不重复定义 type）

**错误处理铁律**：4 类区分（用户/鉴权/系统/Agent降级）·catch 必带 trace_id 日志·用户 message 必须是中文+友好·生产禁 console.log（用 pino logger）

**注释规则**：默认 0 注释·只在 hack/安全约束/跨模块隐含依赖/性能 hot path 时注释·必含 `// GLOBAL TABLE` 注释（不带 account_id 的表）·必含 `// PII` 注释（处理 PII 的代码块）

**提 PR 前必跑**：`pnpm typecheck` + `pnpm lint` + `pnpm test:unit` + `pnpm test:integration` + `pnpm audit:redlines`

---

## §7 测试要求（门槛）

> 完整规范（用例模板/Judge配置/CI YAML）见 `.claude/rules/testing.md`

**5 层测试金字塔**：①静态（tsc+eslint·1min）→②单元（200+用例·vitest·5min）→③集成（40-60用例·10min）→④E2E（8-10用例·playwright·15min）→⑤LLM Judge（100金标准·夜跑·30min）

**覆盖率门槛（CI 强制）**：整体≥80%·`apps/api/src/specialists/`≥90%·`apps/api/src/lib/`≥95%·`apps/web/src/hooks/`≥80%

**LLM Judge**：`judgeModel: 'gpt-4o'`（不同模型 judge·避免自我验证）·passThreshold: 4.0·5 维度（结构/相关性/风格/实用/安全）·每 PR 抽样 20 个·每夜跑全 100 个

**命令**：`pnpm test:unit --coverage`·`pnpm test:integration`·`pnpm test:e2e`·`pnpm test:llm-judge`·`pnpm test:visual:prdNN:check`

**Opus 审计 hard fail 清单**：§5 任一红线触犯·typecheck/lint 失败·覆盖率<80%·LLM Judge<4.0·schema 不一致·缺 trace_id·Specialist 数>14

---

## §8 审计入口

> 完整审计流程、approve 模板、reject 模板、命令行详解见 `.claude/rules/audit-playbook.md`
> 命令对齐基准：`scripts/audit-ld.sh` 和 `scripts/audit-redlines.sh` 是权威——AGENTS.md 引用的命令以脚本为准

```bash
# 审计入口（Opus 复制粘贴）
pnpm typecheck && pnpm lint --max-warnings=0   # ① 静态
pnpm test:unit && pnpm test:integration        # ② 测试
pnpm schema:diff                               # ③ Schema 一致性
pnpm audit:redlines                            # ④ 22 条红线(R-1~17+R-21~R-22 有 audit 检测·R-18~20 阶段6实装暂未检测)
bash scripts/audit-ld.sh                       # ⑤ 18 LD 检测
bash scripts/audit-redlines-admin.sh          # ⑥ admin 专属 6 R-A 红线（如涉及 admin）
```

风险分档：🟢 low（纯常量/UI）·🟡 medium（service/CRUD/单Specialist）·🔴 high（gateway热路径/飞轮/安全边界）·🟣 foundation（被≥3 下游 depends_on）

---

## §9 上下文加载顺序

**任务类型 → 必读文档**

| 你要做的 | 必读 |
|---|---|
| 写新 Specialist | AGENTS.md §3 LD-002 + §4（切分规则）+ PROMPTS.md |
| 改 LLM 调用 | AGENTS.md LD-012 + ADR.md ADR-013 + ARCHITECTURE.md §6.5 |
| 加新表/字段 | DATA-MODEL.md + ARCHITECTURE.md §3.1 + AGENTS.md LD-009 |
| 改 prompt | PROMPTS.md + .claude/rules/testing.md §7.6 LLM Judge 跑回归 |
| 加新 tRPC procedure | .claude/rules/design-constraints.md §4.4 + ARCHITECTURE.md §6.2 |
| 改 UI 颜色/字体 | ADR.md ADR-015（颜色权威；原 ui/aurelian_dark/DESIGN.md 已随 34dc2f9 移除） |
| 加新 admin 功能 | .claude/rules/admin-subsystem.md + ADMIN-ARCHITECTURE.md |
| 审计（Opus） | AGENTS.md §3+§5+§8 + ADR.md 相关 ADR + audit-playbook.md |

**文档分层**：L1 必读=ARCHITECTURE.md + AGENTS.md·L2 派生=ADR.md+DATA-MODEL.md+PROMPTS.md·L3 参考=aiipznt-spec.md+ADR.md ADR-015（颜色权威；原 ui/aurelian_dark/DESIGN.md 已随 34dc2f9 移除）·L4 代码=src/

**5 分钟速读路径**（时间紧时）：ARCHITECTURE.md §1.1 → §1.4 → §4.1 → §4.3 → AGENTS.md §3（18 LD 断言）+ §5 红线表 → ARCHITECTURE.md §9.14 MVP 路径

---

## §10 Session 卫生

**每 session 结束前(清洁退出五维)**:① build/typecheck 过 ② 测试过 ③ `scripts/ralph/progress.txt` 更新(本次做了什么/阻塞/下一步)④ 无 stale 产物(临时文件/注释掉的死代码)⑤ 启动路径可用。
**跨 session**:决策的 why 写进 ADR.md / progress.txt,不只在对话里;下个 session 先读 progress.txt + §9 必读表重建上下文。
**初始化**:新环境先跑 `bash scripts/init.sh`(装依赖+db:generate+env 校验)。

---

## §11 Admin 子系统

> **动 admin 必读**：`.claude/rules/admin-subsystem.md`（11 LD-A + 6 R-A + 14 类高风险动作 + 6 闸鉴权链 + 测试要求 + audit 命令）

触发条件：在 `apps/admin/` 或 `apps/api/src/trpc/routers/admin/` 下写代码时，`admin-subsystem.md` 的 LD-A / R-A **优先于** §3-§5 通用红线适用。

**核心断言**：admin 独立部署（admin.quanan.com·独立 OAuth·独立 Redis session）·adminRouter 跟 appRouter 严格分离·每个 admin procedure 必经 6 闸鉴权链（adminAuth→roleCheck→ipWhitelist→mfaCheck→adminRLS→approvalGateCheck）·14 类高风险动作必带 `meta.requiresApproval=true`·高风险操作必写 admin_audit_log

---

## §13 阶段6 架构债务登记

> 以下为阶段6 实装前已知的架构债务。每条包含：验收标准 / 对应红线 / 陷阱注意。阶段6 开始实装前必读。

| # | 债务项 | 验收标准 | 对应红线/LD | 陷阱注意 |
|---|---|---|---|---|
| G1 | **token 裁剪**：LLMGateway 调用无 contextTokens 上限截断 | ContextAssembler 超阈 graceful trim（不 throw）；非 LLM API（trending/embedding/imageGen）独立日预算分桶限流 | R-20 | trim 必须在 assemble 阶段前完成，不能在 LLMGateway 内部静默截断导致输出截断 |
| G2 | **PrivateDomainAgent PII 绕过**（侦察坐实真漏洞）：`_buildUserPrompt` 直接用 `input.productDescription/targetAudience` 拼 userPrompt，完全绕过 ContextAssembler 的 piiMask | `_buildUserPrompt` 内对用户字段调 piiMask，或改走 `_formatUserPrompt` 统一脱敏；单测覆盖含手机/邮箱输入被脱敏 | R-14·LD-018 | **真漏洞**：用户手机/邮箱原文进 LLM；R-14 扩展 audit 是警示级（grep 无法精确判定泄漏）→ 此条是已确认必修；它还完全忽略 ctx（7 路白跑 + 退出飞轮，承重墙①/⑤ 软肋）·**✅2026-06-19 已实装**：piiMask(productDescription/targetAudience/scene/ipPositioning) + US-002 接通 ctx + PII 单测 5/5|
| G8 | **embed 真实化**：L5 索引端走 stub（非真 OpenAI embedding）| `apps/api/src/workers/rag/` embed 调用改走真 OpenAI `text-embedding-3-small`；集成测试覆盖 vector 近邻查询 | LD-011 | stub 返回零向量→ pgvector 查询无意义；改真 embedding 后需重跑 seed 数据 |
| G9 | **熔断器实装**：LD-012 熔断器当前注释占位 | `apps/api/src/workers/llm-gateway/` 内熔断器（circuit-breaker）从注释改为真实 opossum/自研实现；E2E 测试模拟 LLM 超时触发熔断 | LD-012 | 禁止把注释当"已实装"（LD-012 audit 只检测文件存在·不检测 circuit-breaker 真实逻辑）|
| G11 | **evaluatePromptVersion isMock=false**：LLM Judge 当前 isMock=true | `tests/judge/*.judge.ts` 全部改 `isMock=false`；夜跑 CI 覆盖 100 金标准 passThreshold 4.0 | LD-016 | mock=true 时 judge 永远返回 5.0 满分；开启真实 judge 会暴露实际 prompt 质量问题 |
| G12 | **canary 接 ab-stop-loss**：canary 部署无自动回滚 | canary worker 接入 ab-stop-loss 钩子；error_rate > 5% 自动触发回滚；监控接入 Datadog/Grafana | LD-019 | 无回滚的 canary 是裸奔；ab-stop-loss 配置必须在 deploy pipeline 中 before-promote 阶段 |
| G13 | **演进 100 冻结**：EvolutionAgent 冻结点未锁定 | EvolutionProfile.evolutionCount 达 100 时 `canEvolve=false`；单测：count=100 时 EvolutionAgent.execute() 返回 `{skipped: true}` | LD-019 | 无冻结→ 无限 LLM 调用→ 爆成本；冻结逻辑必须在 EvolutionAgent.execute() 最前检查 |
| G15 | **ContextAssembler._fetchStepData 双轨**：任何重构必须保留 `where:{accountId}` | `_fetchStepData` 内所有 prisma 查询必须包含 `where:{accountId,...}`；**禁止按 stepData.ts 模式去掉 where→否则脱离事务 RLS 跨租户泄漏** | LD-009·R-4 | LD-009 注记（R-4 audit 盲区）：`_fetchStepData` 走 prisma.$transaction 内部，RLS SET LOCAL 在事务提交后失效；accountId where 子句是唯一保证。去掉 where = 跨租户数据泄漏 |

---

## §12 高频陷阱（PRD 实测教训·最高 15 条）

> 完整沉淀（§11.1~§11.19）见 `docs/harness-archive/实施沉淀-2026H1.md`

1. **LS 多账号命名**：禁止自定义 LS_PREFIX 变量拼接·必须用 `getLsKey(accountId, key)` / `getToolLsKey(accountId, tool, key)` 集中 helper（`apps/web/src/lib/ls-namespace.ts`）·audit grep 看字面 `acc_`
2. **StepLayout 组件防重复**：StepLayout 已渲染 `<FeedbackButton>`·11 step 子页不要重复渲染·否则 playwright strict mode 拒绝（2 个相同 testid）
3. **Specialist 单实例 export**：`export const xAgent = new XAgent()`·router 调 `agent.execute()`·禁止 `new Agent().execute()`（REJ-004）
4. **responseFormat 双 schema**：含 `.refine()` 的 schema 不能序列化为 JSON Schema·LLM 用不含 refine 的 BaseSchema·post-validate 用含 refine 的 OutputSchema
5. **EvolutionAgent+DailyTaskAgent 双路径白名单**：re-export stub 在 `specialists/`·真实现在 `agents/`·D-007 ContextAssembler grep 检查时这两个不算违规（TD-024）
6. **SSE subscription 连接级 SET**：tRPC subscription 路径中 RLS 必须用 `set_config(..., false)`（connection-level）·不能用 `$transaction` SET LOCAL（transaction commits 在 SSE long-lived connection 中提前提交）
7. **stepData.save 必覆盖全 9 step**：save handler 漏 step → UI skeleton 永挂·default 分支用 `throw` 不用 `return null`·每 PRD 收官前跑 cross-cut audit
8. **EmptyState title 禁 hardcode spec 字面**：必须用 template literal 嵌常量：`<EmptyState title={` + "`提交后查看${STEP4_H1}`" + `} />`（AC 字面 grep 否则 reject）
9. **monorepo lint 必从 ROOT 跑**：`pnpm lint` 从项目根·禁止 `cd apps/web && pnpm lint`（只覆盖 web·漏 workspace lint errors·TD-098 实证）
10. **admin page e2e spec 必加 project filter**：admin spec 加 `testIgnore` 或 `test.use({ baseURL: 'http://localhost:5174' })`·防主应用 e2e 运行 admin spec
11. **BullMQ worker 无 RLS ctx**：BullMQ worker 内 `prisma.X.update` 必须用 PK 精确定位·不能依赖 RLS 自动过滤（worker 无 HTTP ctx）
12. **D4=B 颜色严锁**：主品牌色一律 `var(--primary)` / Tailwind `text-primary`·禁止 `violet-X / amber-X / gold`·仅 status semantic indicator（难度/阶段/状态）可用 Tailwind 默认色
13. **D1=A 字面锁**：PRD AC 锁定的文字内容（H1/H2/H3/button/FAQ/constants 数据字段）必须 1:1 字面·Ralph 不允许创意改写
14. **ModelTier 跨文件同步**：新增 model_tier（如 balanced）必须同步 `specialists/base/types.ts` + `workers/llm-gateway/index.ts` MODEL_BY_TIER map + `agents/base/types.ts`
15. **R-4 aggregate/groupBy audit-friendly 注释**：prisma aggregate/groupBy/count 调用若 accountId 在变量中·必加 `// RLS auto-filters: where.accountId enforces LD-009` 注释（静态 grep 否则 false positive reject）

---

## 修订记录（最近 3 条）

- **2026-06-19 R11** · 三轮对抗复审收敛+清残留+阶段6/7 出门:清残留(RAG _fetchRag query 改用真实输入非 agentId·3 家 incidental-PII 落地)·**3 安全交付能力包**(G74 注入特征过滤 injection-filter/G78 成本熔断 cost-budget-guard/G77 输出端合规 output-guardrail·接入 BaseSpecialist+ContextAssembler·闭合阶段2 P0 backlog)。三轮复审修真 bug:**EvolutionAgent/DailyTaskAgent override execute 绕过 budget+guardrail→补 runWithBudget+_applyOutputGuardrail**(_applyOutputGuardrail private→protected)/output-guardrail re-parse 失败回退含违规原始→改返 sanitized(安全>schema-min·违规不泄漏)/各 regex 误伤收窄(承诺要量化语境·injection act-as 限角色劫持·全角零宽 NFKC 归一)。**LD-001 例外登记**:`TopicAgent.executeStream` 5-category batch SSE(`this.execute`×5·批量 fan-out 非 agentic 循环·D-197 SHIELD)=接受例外;audit-ld 的 LD-001 grep 只检 llmGateway/invokeLLM/.complete(/.stream(·不检 this.execute 别名(单行启发式既有局限·主向量直调 LLM 循环仍抓)。R-5:Diagnosis.tsx lsKey 来自 getLsKey 真合规(注释文档化让审计相邻行启发式识别·非 gaming)。阶段6 出门→阶段7 带债出门(H76 eval-suite/H79 Judge偏差/H77 红队集中阶段8)。
- **2026-06-19 R10** · 全链路四波次重构 + 二轮对抗复审收口:波次1 清场 / 波次2 correctness(承重墙①ctx 接通·R-11 闭合·PII 根除) / 波次3 enrich 富 UI 变真 / 波次4 五护栏(G1 token 预算·G9 真熔断器·G8 embedding D-038·G11 真 LLM Judge·G12 canary 自动止损·均实装非 stub)。**§13 债务 G1/G2/G8/G9/G11/G12/G13/G15 全部实装✓**(G6/G7 随语音下线消解)。**R-14 实际覆盖修正(纠正 R8『piiMask 覆盖』over-claim)**:字段级 piiMask = PrivateDomain/Monetization/Branding/Positioning 四家;Analysis/DeepLearn/Video/Presentation 的输入是**待分析主体内容·不脱敏**(脱敏会毁分析);Livestream/Diagnosis/Copywriting 已字段级 piiMask(2026-06-19 清残留落地·incidental 元数据 mask·主体内容如 scriptText 不 mask)→**R-14 实际覆盖 7 家**(PrivateDomain/Monetization/Branding/Positioning/Livestream/Diagnosis/Copywriting)。二轮复审修真 bug:G12 success=!isFallback 系统性修(覆盖 VideoAgent 内层 fallback·别再逐路补丁)/前端 stat 卡改数据驱动/realdata 测试改真负向。详见 PROJECT-PROFILE phase_notes[6]。
- **2026-06-19 R9** · 语音下线 Wave1：VoiceChatAgent/stt/tts/voiceChat 全栈删除；Specialist 15→14；红线 23→22(删 R-23)；§1/§3/§5/§7/§8/§13 G6G7 全同步；docs/architecture/03-记忆.md L1 更新
- **2026-06-18 R8** · Harness 重定位：声明 6 墙 L3 架构护栏(docs/architecture/01-06)；红线 22→23(R-23 VoiceChatAgent finally 软锁)；R-21 落地真检测(trending_favorites 抓对)；R-14 扩展(Specialist._buildUserPrompt piiMask 覆盖)；§13 阶段6架构债务登记(G1/G2/G6/G7/G8/G9/G11/G12/G13/G15·G2=PrivateDomain PII 真漏洞)
- **2026-06-12 R7** · AGENTS.md 3714→318 行瘦身·下沉 6 rules 文件+1 archive 文件·台账见 `.planning-r7-审定台账.md`（版本接续 v1.0，旧头部 v0.5 系历史未更新）
- **2026-05-23 v1.0** · 加 §11.19 PRD-28 evaluation 完整化沉淀（LLM Judge 真闭环·100 金标准·admin evaluation UI·inter-rater Cohen's kappa）

> 完整修订历史见 `docs/harness-archive/实施沉淀-2026H1.md` 末尾。
