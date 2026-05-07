# PRD-1 · P0 基础设施

> **派生自** · [ARCHITECTURE.md §9.2](../ARCHITECTURE.md) · [SCAFFOLD.md §A](../SCAFFOLD.md) · [AGENTS.md §1-§9](../AGENTS.md) · ADR-019(monorepo)
> **风险等级** · foundation(被 PRD-2 ~ PRD-9 全部 depends_on · 任何 reject 升级 high)
> **依赖前置** · 无(第一份 PRD)
> **预估周期** · 2 周
> **作者 / 审核** · prd skill (Opus) / Opus

---

## 元数据(frontmatter)

```yaml
prd_id: PRD-1
phase: P0 基础设施
risk_level: foundation
depends_on: []

# ownership(PRD-MASTER §1.4 P1-7)
prd_author: prd skill (Opus 主对话)
prd_reviewer: Opus(主对话)
prd_executor: Ralph Agent (Sonnet · daemon)
prd_verifier: Opus + 用户

# 状态(PRD-MASTER §1.4 P1-8)
status: 🟡 进行中  # 🔵 待写 / 🟡 进行中 / 🟢 已完成 / 🔴 阻塞
status_history:
  - 2026-05-07 · 🔵 → 🟡 · prd skill 启动(Opus 主对话写 PRD-1)
```

---

## §0 引用清单(单一真理来源 · 不复制大段)

| 维度 | 来源 |
|---|---|
| 业务模型 | [ARCHITECTURE.md §1.5 + §1.4b](../ARCHITECTURE.md) · monorepo + 主/admin 边界 |
| UI 设计稿 | [ui/aurelian_dark/DESIGN.md](../ui/aurelian_dark/DESIGN.md) · YAML token + 文字描述 |
| 数据契约 | [DATA-MODEL.md §2 全局表](../DATA-MODEL.md) · User / InviteCode 已就位 · P0 不动 schema(只 prisma generate) |
| 接口契约 | [ARCHITECTURE.md §3.2](../ARCHITECTURE.md) · auth.me / auth.logout / auth.callback procedure 名 |
| 退出条件 | [ARCHITECTURE.md §9.2](../ARCHITECTURE.md) · 完整粘贴在本 PRD §6 |
| 工程约束 | [AGENTS.md §1-§9](../AGENTS.md) · 18 LD + 17 R + §1.4 不做事项 |
| 工程红线 | [AGENTS.md §3 LD-001/002/006/008/009/013/015](../AGENTS.md) · 关键 LD |
| Scaffold | [SCAFFOLD.md §A](../SCAFFOLD.md) · monorepo 改造 + 80 文件填充计划 |
| 关联 ADR | ADR-019(monorepo)· ADR-013(LLM Gateway · 骨架)· ADR-015(Aurelian Dark token) |
| 反例库 | [PRD-MASTER.md §6](../PRD-MASTER.md) + ~/.claude/playbooks/reject-examples.jsonl(35 条已就位) |

> ⚠️ **当前 P0 准备已完成的部分(2026-05-07 用户介入)**
> - ✅ git init + .gitignore · pnpm install 通过 · 第 1 个 commit
> - ✅ monorepo workspace 骨架 · apps/{web,api,admin} + packages/{schemas,ui,clients}
> - ✅ src/* git mv 到 apps/api/src/(20 文件 rename)+ apps/web 占位 main.tsx
> - ✅ prisma schema 加 16 admin + 4 P2 = 20 张新 model · validate 通过
> - ✅ prisma/migrations/manual_admin_rls.sql · 16 + 4 占位
> - ✅ scripts/ralph/sync-to-project.sh · 13 文件 ralph 工具链
> - ✅ scripts/ralph/switch-prd.sh · chmod +x
> - ✅ 本地 PG 16.13 + Redis 8.6.3 + pgvector 0.8.0 · 数据库 quanqn / quanqn_test 已建
> - ✅ .env(本地 dev)+ .env.example(模板)
>
> Ralph 在 PRD-1 的工作 · 在上述准备基础上 · 完成 7 个 US

---

## §1 用户故事(US-001 ~ US-007)

> 7 个 US · 严格遵循 ARCHITECTURE-driven 原则 · 不重写业务模型 · 仅补"4 类 AC + 性能阈值"工程合约。
> ralph 1 story = 1 US 1:1 映射。

### US-001 · 修复 monorepo 代码迁移产物(import 路径 / package 引用)

- **As** · 任何上游开发者(IP 起号者无关)· 仅技术合约
- **I want** · 把 P0 准备阶段 git mv 过来的 src/* 代码(20 文件 · 全占位)在新 monorepo 路径下能 typecheck 通过
- **So that** · PRD-2 起的所有功能开发都基于 typecheck 干净的 baseline
- **risk_level** · foundation(被全 PRD depends_on)
- **depends_on** · []
- **anti_patterns** · 由 prd skill grep reject-examples.jsonl 注入(关键词:monorepo / typecheck / import path)
- **测试配额** · 0 单元(仅 typecheck)+ 0 集成 + 0 E2E + 0 Judge

### US-002 · Vite + React 18 + TS 主应用启动(apps/web)

- **As** · IP 起号者(ARCHITECTURE §1.6 第 1 类)
- **I want** · 在 localhost:5173 看到 QuanQn 首页(占位 · 文字"QuanQn · 工程骨架就绪")
- **So that** · 推进 NSM「9 步主向导第 1 步进入率」的前置工程基础就位
- **risk_level** · foundation
- **depends_on** · [US-001]
- **anti_patterns** · 由 prd skill 注入(关键词:vite / react 18 / tsconfig / strict)
- **测试配额** · 1 单元(占位 main.tsx 渲染)· 0 集成 · 0 E2E · 0 Judge

### US-003 · Hono + tRPC + Prisma client 后端启动(apps/api)

- **As** · IP 起号者(同上)
- **I want** · 在 localhost:3000 调 `auth.me` procedure · 返回 `{ ok: false, error: "unauthenticated" }`(未登录)
- **So that** · 主应用前端能调后端 · 鉴权链路就位
- **risk_level** · foundation
- **depends_on** · [US-001]
- **anti_patterns** · 由 prd skill 注入(关键词:hono / trpc / prisma client / monorepo · 注 · prisma generate 在 monorepo 需要 schema 路径)
- **测试配额** · 2 单元(auth.me 未登录 + Prisma client 实例化)· 1 集成(curl localhost:3000/trpc/auth.me 返 401)· 0 E2E · 0 Judge

### US-004 · Tailwind 引 Aurelian Dark token(从 ui/aurelian_dark/DESIGN.md YAML)

- **As** · IP 起号者(同上)
- **I want** · 在主应用看到 Aurelian Dark 主题(深底 · 金色高亮 · Manrope/Plus Jakarta Sans/Inter 字体)
- **So that** · 视觉品牌就位 · 不再是 tailwind 默认样式
- **risk_level** · medium(品牌 / 视觉 · 但不阻塞功能)
- **depends_on** · [US-002]
- **anti_patterns** · 由 prd skill 注入(关键词:tailwind config / token / hardcode color · 参 LD-015)
- **测试配额** · 1 单元(theme('colors.X') 解析)· 0 集成 · 0 E2E · 0 Judge

### US-005 · shadcn/ui 12 基础组件 + Header 三 dropdown

- **As** · IP 起号者(同上)
- **I want** · Header 显示 · 用户头像 dropdown / 当前 IP 账号 dropdown / 工具入口 dropdown(各显示 mock 数据)
- **So that** · 推进 ARCHITECTURE §3.6.4 主应用骨架的 P0 退出条件
- **risk_level** · medium
- **depends_on** · [US-004]
- **anti_patterns** · 由 prd skill 注入(关键词:shadcn / radix-ui · 注 · shadcn 组件 copy-paste 而非 npm install · 详 ADR-014 if exists)
- **测试配额** · 0 单元(组件 stories) · 0 集成 · 1 E2E(Header 三 dropdown 可见 + 点开)· 0 Judge

### US-006 · Google OAuth(dev 模式 · localhost:5173 跑通)

- **As** · IP 起号者(同上)
- **I want** · 点 Header → "登录" → 跳 Google OAuth → 回调 → 头像 dropdown 显示我的 email
- **So that** · 满足 ARCHITECTURE §9.2 P0 退出条件"用户能登录"
- **risk_level** · high(OAuth 安全 · session 管理 · LD-008 / R-006)
- **depends_on** · [US-003, US-005]
- **anti_patterns** · 由 prd skill 注入(关键词:oauth / lucia / session secret / cookie httpOnly + sameSite)
- **测试配额** · 3 单元(callback 解析 token / session 创建 / logout)· 1 集成(完整 OAuth flow with mock)· 1 E2E(用户能登录 · 看到 email)· 0 Judge
- **★ 用户介入** · 启动前用户必须申 Google dev OAuth 应用(localhost:5173/auth/callback)填到 .env 的 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET

### US-007 · Agent 抽象层骨架 + trace_id 中间件 + pino logger

- **As** · 工程合约(non-user-facing)
- **I want** · BaseSpecialist 抽象类 · ContextAssembler 接口 · LLMGateway 限流计费骨架 · trace_id 中间件 · pino structured logger 全部就位(仅 stubs · 不实现具体逻辑)
- **So that** · PRD-2 起的所有 Specialist 实施有继承基础 · 全栈 trace_id 链路就位
- **risk_level** · foundation(被 PRD-2/4/8 全部 depends_on)
- **depends_on** · [US-003]
- **anti_patterns** · 由 prd skill 注入(关键词:abstract class / interface / generic / trace_id propagation / pino + http logging)
- **测试配额** · 4 单元(BaseSpecialist 抽象方法签名 · ContextAssembler 接口字段 · LLMGateway tier 选择骨架 · trace_id 透传)· 1 集成(curl 带 trace_id 入 / pino 输出含 trace_id)· 0 E2E · 0 Judge

---

## §2 验收标准(AC · ★ 4 类必含)

> 每个 US 必含 H/E/B/P · 详 PRD-MASTER §2.2-C。

### AC-001-H(US-001 happy)

- **Given** · monorepo 改造已完成 · pnpm install 通过 · src/* 已 git mv 到 apps/api/src/*
- **When** · 跑 `pnpm typecheck`(根级 · 跑全 workspace)
- **Then** ·
  - 退出码 0
  - apps/api typecheck 通过(0 type error)
  - apps/web typecheck 通过(0 type error)
  - 所有 import 路径解析正确(无 `Cannot find module '@/...'` 残留)
  - 占位文件保留 .gitkeep / 注释说明 · 不删

### AC-001-E(US-001 error)

- **场景 E1** · 跑 typecheck 时 · 某 ts 文件用 `import { X } from '@/old-path'`(老 src/* 风格)· 在新路径下找不到
  - Given · 同 H · 但代码内残留老 import
  - When · `pnpm typecheck`
  - Then · 退出码 ≠ 0 · 报 Cannot find module · ralph 改 import 路径 · 重新 typecheck

### AC-001-B(US-001 boundary)

- **场景 B1** · workspace 内某包(如 packages/schemas)的 export 被另一包(apps/api)import · 但 packages/schemas 没 build
  - Given · 同 H
  - When · `pnpm --filter @quanqn/api typecheck` · 引 `@quanqn/schemas`
  - Then · TS path alias 解析到 packages/schemas/src/index.ts · 不需 build · typecheck 仍通过

### AC-001-P(US-001 performance)

- **场景 P1** · pnpm typecheck 全 workspace 总耗时 < 30s(占位代码 · 后续会变)
- **场景 P2** · pnpm install 增量 < 60s(已有 lockfile)

---

### AC-002-H(US-002 happy)

- **Given** · US-001 已通 · pnpm install 完成
- **When** · `pnpm dev:web`(localhost:5173)
- **Then** ·
  - vite dev server 启动 · 无 error
  - 浏览器访问 http://localhost:5173 · 显示文字"QuanQn · 工程骨架就绪"(占位 main.tsx 内容)
  - 启动时间 < 3s
  - HMR 启用(改 main.tsx 内容 · 浏览器 < 1s 反映)

### AC-002-E(US-002 error)

- **场景 E1** · vite 启动时端口 5173 被占
  - Given · 端口 5173 已被另一进程占用
  - When · `pnpm dev:web`
  - Then · vite 报错 + 自动尝试 5174 / 5175(vite 默认行为)· 用户看到提示

### AC-002-B(US-002 boundary)

- **场景 B1** · main.tsx 占位 · 不引入任何 React 库
  - Given · main.tsx 仅 console.warn + export {}
  - When · `pnpm --filter @quanqn/web build`
  - Then · 退出码 0 · 生成 dist/ · main.js < 5KB(占位无 React deps)

### AC-002-P(US-002 performance)

- **场景 P1** · `pnpm --filter @quanqn/web build` 总耗时 < 10s(占位)
- **场景 P2** · vite dev cold start < 3s · HMR < 1s

---

### AC-003-H(US-003 happy)

- **Given** · US-001 已通 · DATABASE_URL 设到 .env(本地 PG 16)
- **When** · `pnpm dev:api`(localhost:3000)+ `curl http://localhost:3000/trpc/auth.me`
- **Then** ·
  - hono server 启动 · 监听 3000 端口 · 无 error
  - tRPC 路由挂载 · `/trpc/auth.me` 可访问
  - 未登录请求 · 返回 `{ result: { data: { ok: false, error: "unauthenticated" } } }`
  - Prisma client 已实例化 · 能 query users 表(空查 · 验证连通)
  - 启动时间 < 5s

### AC-003-E(US-003 error)

- **场景 E1** · DATABASE_URL 错(连不上 PG)
  - Given · .env DATABASE_URL = postgres://wrong:wrong@badhost:5432/quanqn
  - When · `pnpm dev:api`
  - Then · server 启动报错 · pino log 含 "DB connection failed" · trace_id 写入 · 进程优雅退出 code 1
- **场景 E2** · prisma generate 没跑 · @prisma/client 找不到 schema
  - Given · 删 node_modules/.prisma · 然后 dev:api
  - Then · 报错"@prisma/client did not initialize yet" · 提示用户 `pnpm db:generate`

### AC-003-B(US-003 boundary)

- **场景 B1** · monorepo 下 prisma generate 路径
  - Given · prisma/schema.prisma 在 root · @prisma/client 在 apps/api/deps
  - When · `pnpm db:generate`(根级)
  - Then · client 生成到 apps/api/node_modules/.prisma/client · 或 root node_modules/.prisma/client · 取决于 hoist 策略
  - apps/api 的 import { PrismaClient } 能解析

### AC-003-P(US-003 performance)

- **场景 P1** · `pnpm dev:api` cold start < 5s · auth.me 响应 P50 < 50ms · P99 < 200ms
- **场景 P2** · Prisma client 实例化 < 100ms

---

### AC-004-H(US-004 happy)

- **Given** · US-002 已通 · ui/aurelian_dark/DESIGN.md YAML token 解析完
- **When** · 浏览器访问 localhost:5173 · 检查 CSS
- **Then** ·
  - body 背景色 = Aurelian Dark 深底色(从 YAML token aurelian.bg.deep 取)
  - 字体 family 包含 Manrope / Plus Jakarta Sans / Inter
  - 主色 / 辅助色 / 边框色 全部走 theme('colors.X')(参 LD-015)
  - tailwind.config.js 内**无 hardcode 颜色字符串**(grep `#[0-9a-f]{6}` 命中 0)

### AC-004-E(US-004 error)

- **场景 E1** · YAML 解析失败(DESIGN.md 头部 YAML 损坏)
  - Given · YAML frontmatter 损坏
  - When · `pnpm dev:web` 启动
  - Then · 报错 + ralph 修 YAML · 重新启动

### AC-004-B(US-004 boundary)

- **场景 B1** · YAML 跟文字段冲突(LD-015 优先级)
  - Given · YAML 写 primary=#FFD700 · 文字段写 primary=#FF0000
  - When · 派生 token
  - Then · YAML 优先(LD-015)· tailwind 用 #FFD700

### AC-004-P(US-004 performance)

- **场景 P1** · CSS 总大小 < 50KB(占位无大组件库)· tailwind purge 启用 · build 时 tree-shake

---

### AC-005-H(US-005 happy)

- **Given** · US-004 已通 · shadcn 基础组件就位
- **When** · 用户访问 localhost:5173 · 鼠标悬停 Header 三 dropdown
- **Then** ·
  - 用户头像 dropdown 展开 · 显示 mock 用户(name/email/avatar)
  - 当前 IP 账号 dropdown 展开 · 显示 mock 账号列表(2-3 个)
  - 工具入口 dropdown 展开 · 显示 14 工具页 + 6 新模块占位(ARCHITECTURE §3.6.4 表)

### AC-005-E(US-005 error)

- **场景 E1** · shadcn 基础组件渲染时 hydration 错误(SSR 跟 CSR 状态不一致)
  - Given · React 18 严格模式
  - When · 渲染 Header
  - Then · 0 React warning · 0 hydration mismatch

### AC-005-B(US-005 boundary)

- **场景 B1** · 窄屏(≤640px)· Header dropdown 应转为 hamburger menu
  - Given · viewport 360px
  - When · 渲染 Header
  - Then · 三 dropdown 隐藏 · 显示 hamburger · 点开抽屉

### AC-005-P(US-005 performance)

- **场景 P1** · Header 首次渲染 < 100ms · dropdown 展开动画 < 200ms

---

### AC-006-H(US-006 happy)

- **Given** · US-003 已通 · US-005 已通 · 用户已申 Google dev OAuth · 填好 .env(GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)
- **When** · 访问 localhost:5173 · 点登录 → 跳 Google OAuth · 授权 → 回调
- **Then** ·
  - lucia session 创建 · cookie 写入(httpOnly + sameSite=lax + secure=false 仅 dev)
  - 重定向到首页 · Header 显示用户 email + avatar
  - tRPC `auth.me` 返回 `{ ok: true, user: { id, email, name } }`
  - DB users 表新增 1 行 · openId / email 写入

### AC-006-E(US-006 error)

- **场景 E1** · OAuth callback state 不匹配(CSRF 攻击)
  - Given · 攻击者构造伪造 callback URL
  - When · 访问 callback URL · state 跟 cookie 不一致
  - Then · 返回 401 · 不创 session · 写 audit_log(security_alert · oauth_state_mismatch)
- **场景 E2** · GOOGLE_CLIENT_ID 没设 / 错
  - Given · .env GOOGLE_CLIENT_ID = ""
  - When · 点登录
  - Then · 后端返 500 · log 含"GOOGLE_CLIENT_ID missing" · 前端 toast"OAuth 暂不可用"

### AC-006-B(US-006 boundary)

- **场景 B1** · session 过期(cookie expires)
  - Given · session 已过期
  - When · 访问任何 procedure
  - Then · auth.me 返 unauthenticated · Header 切回未登录态
- **场景 B2** · 同一 google 账号二次登录
  - Given · users 表已有该 openId
  - When · 第 2 次登录
  - Then · 不重复创建 user · update last_signed_in · session 重新签发

### AC-006-P(US-006 performance)

- **场景 P1** · OAuth callback 处理 < 500ms · session 创建 < 100ms · DB users insert/update < 50ms
- **场景 P2** · 整个登录 flow 用户感知 < 3s(含 Google 跳转)

---

### AC-007-H(US-007 happy)

- **Given** · US-003 已通
- **When** · ralph 写完 BaseSpecialist + ContextAssembler + LLMGateway + trace_id middleware + pino logger 骨架
- **Then** ·
  - apps/api/src/agents/base/BaseSpecialist.ts · 抽象类 · 含 abstract method `execute(input, context): Promise<output>`
  - apps/api/src/agents/base/ContextAssembler.ts · interface · 含 `assembleStep(step, accountId): Promise<Context>`(stub return null OK)
  - apps/api/src/workers/llm-gateway/index.ts · 类 LLMGateway · 含 `selectTier(modelHint, costBudget): tier`(占位)+ `callLLM(tier, messages): response`(throws 'not implemented')
  - apps/api/src/lib/logger.ts · pino instance · 含 trace_id 自动注入字段
  - apps/api/src/trpc/middleware/trace.ts · middleware · 从 header X-Trace-Id 读 / 不在则生成 · 写到 ctx.traceId
  - 全栈 trace_id 链路 · 前端 fetch → tRPC ctx → pino log · 同一 trace_id

### AC-007-E(US-007 error)

- **场景 E1** · Specialist 子类没实现 execute()
  - Given · `class MySpecialist extends BaseSpecialist` 无 execute
  - When · TS compile
  - Then · TS 报错 · 编译失败(abstract method 未实现)

### AC-007-B(US-007 boundary)

- **场景 B1** · trace_id 来源(用户自带 vs 服务端生成)
  - Given · curl 带 `X-Trace-Id: user-trace-001` · 或不带
  - When · 进 middleware
  - Then · 带则用 user-trace-001 · 不带则 nanoid 生成
- **场景 B2** · pino structured log 字段
  - Given · `logger.info({ event: 'auth.me', userId: 1 })`
  - When · 输出
  - Then · JSON Lines · 含 `trace_id` / `event` / `userId` / `level` / `timestamp` 5 字段

### AC-007-P(US-007 performance)

- **场景 P1** · trace middleware overhead < 1ms · pino log overhead < 100μs

---

## §3 范围排除(明确不做)

> 引用 [AGENTS.md §1.4](../AGENTS.md) + 本 PRD 特有的 out-of-scope。

| # | 不做的事 | 理由 | 排到哪 |
|:-:|---|---|:-:|
| 1 | 多租户 / 团队协作 | AGENTS §1.4 全局不做 | 1.0 之后 |
| 2 | 用户自带 LLM API Key | AGENTS §1.4 全局不做 | 1.0 之后 |
| 3 | 移动端 App / Native | AGENTS §1.4 仅 Web 响应式 | 1.0 之后 |
| 4 | 海外版 / 多语言 | AGENTS §1.4 仅中文 | 1.0 之后 |
| 5 | 公开 API 给第三方 | AGENTS §1.4 全局不做 | 1.0 之后 |
| 6 | 支付集成 | AGENTS §1.4 暂用邀请制 | P9.4 后 |
| 7 | apps/admin 任何代码 | ADR-021 admin 独立部署 · 主应用 P0 不动 admin | P9.0(PRD-10) |
| 8 | 真实 Google OAuth Workspace Internal | 等域名 + ICP 备案下来 · 仅本地 dev | PRR(上线前) |
| 9 | Trending 抓取实现 | trending 改造在 P5(PRD-6)· P0 不动 trending_items | PRD-6 |
| 10 | shadcn 12 组件全部填(下拉/对话框/抽屉等) | 仅 Header 三 dropdown 必需 · 其他随 PRD-3 ~ PRD-9 滚动加 | PRD-3 起 |
| 11 | LLM Gateway 实际调用(Anthropic / OpenAI) | 仅骨架 · selectTier/callLLM 占位 throw 'not implemented' | PRD-2 |
| 12 | ContextAssembler 实际拼接 | 仅 interface · 实施留 PRD-4 P3 主流程 | PRD-4 |
| 13 | 业务 Specialist 实施(CopywritingAgent 等)| 仅 base 抽象类 · 14 Specialist 留 P3-P7 | PRD-4 ~ PRD-8 |
| 14 | RLS 启用(主应用 12 业务表) | DATA-MODEL §9 设计了 · P1 创建表后跑 manual_rls.sql | PRD-2 |
| 15 | admin 13 表 RLS DISABLE | DATA-MODEL §13.8 + manual_admin_rls.sql 已就位 · P9.0 跑 | PRD-10 |

---

## §4 风险 + 缓解

| # | 风险 | 严重度 | 缓解 | 触发回滚条件 |
|:-:|---|:-:|---|---|
| 1 | monorepo prisma client 路径(monorepo 下 generate 行为) | 高 | US-003 AC-003-B 显式定 client 路径 · 或 hoisted to root · 实施时验 | prisma generate 失败 · ralph reject ≥ 3 次 |
| 2 | tailwind v3/v4 + shadcn 兼容性 | 中 | 锁 tailwind v3 · shadcn 用 copy-paste 模式(不依赖最新) | shadcn 组件渲染 ≥ 3 次 hydration 错 |
| 3 | OAuth callback 跨域(localhost:5173 → :3000) | 中 | dev 用 vite proxy 转 /api/trpc → :3000 · OAuth callback 写到 :5173/auth/callback 由前端转后端 | OAuth state 不匹配率 > 10% |
| 4 | trace_id 链路断 (前端 → 后端 → DB) | 中 | US-007 AC-007-B 显式测带 / 不带 trace_id 两路径 · pino structured log 强制 trace_id 字段 | 任何 procedure log 缺 trace_id |
| 5 | apps/api 老 src 代码(从 src/server git mv)的 import 路径全 broken | 中 | US-001 AC-001-H 显式跑 typecheck 全 workspace 通过 · ralph 改 import | typecheck error 持续 ≥ 2 次 reject |
| 6 | ★ foundation 风险 PRD-1 任何 reject 升级 high(参 OPUS-AUDIT-CHEATSHEET) | 高 | Opus audit 不允许 rubber-stamp · 严格 4 维度 + §0 4 项实测 + Z 升档 | rubber-stamp ≥ 1 次(发现后回滚)|

---

## §5 测试配额(★ 跟 PRD-MASTER §4.5 规范对齐)

| 类别 | 数量 | 范围 | 工具 |
|---|:-:|---|---|
| 单元 | 11(US-002 1 + US-003 2 + US-004 1 + US-005 0 + US-006 3 + US-007 4) | 占位渲染 / Prisma 实例 / token 解析 / OAuth flow / Specialist 抽象 / trace_id | vitest |
| 集成 | 3(US-003 1 + US-006 1 + US-007 1) | curl auth.me · OAuth flow with mock · trace_id 透传 | vitest + supertest |
| E2E | 2(US-005 1 + US-006 1) | Header 三 dropdown · OAuth login flow | playwright |
| LLM Judge | 0 | P0 无 Specialist 实施 · 0 金标准 | — |

---

## §6 退出条件(从 ARCHITECTURE §9.2 完整粘贴 + AC 总和)

> 派生 [ARCHITECTURE.md §9.2](../ARCHITECTURE.md):

```
P0 · 基础设施(2 周)
  目标 · 工程骨架就绪 · 设计系统全量 token · 单用户能登录
  交付物 · Vite + React 18 + TS · `tailwind.config.js`(从 §8 token 转换)·
          shadcn/ui 12 基础组件 · Google OAuth · Header 三 dropdown
  ★ Agent 架构相关 · `BaseSpecialist` 抽象类骨架(§6.3)
                    `ContextAssembler` 接口框架(§6.4 · 仅 stubs)
                    `LLMGateway` 限流计费框架(§6.5)
                    `trace_id` 中间件
  引用知识库 · 项目级 ~/.claude/CLAUDE.md Coding 3.0 流程 ·
              reference-materials/PI-Agent设计哲学/06-从零起步PlayBook.md ·
              §8 Aurelian Dark
  风险 · tailwind v4 跟 shadcn 默认 v3 兼容性 · OAuth 回调跨域
  退出条件 · 跑通 `npm run dev` + 用户能登录 +
            Header 三个 dropdown 显示正确 + tRPC `auth.me` 工作
```

**总和验收清单**:
- [ ] ARCHITECTURE §9.2 退出条件 4 项全部满足(npm run dev / 用户登录 / 三 dropdown / auth.me)
- [ ] PRD §1 7 个 US 全部 AC-XXX-H 通过
- [ ] PRD §1 7 个 US 全部 AC-XXX-E 通过(关键错误场景)
- [ ] PRD §1 7 个 US 全部 AC-XXX-B 通过(关键边界)
- [ ] PRD §1 7 个 US 全部 AC-XXX-P 满足性能阈值
- [ ] §5 测试配额 16 用例全部达成(11 单元 + 3 集成 + 2 E2E + 0 Judge)
- [ ] AGENTS § 红线 0 触发(grep 检测 17 R)
- [ ] §4 6 个高风险无未缓解项
- [ ] LD-013 strict TS 全 workspace typecheck 通过
- [ ] LD-015 tailwind 无 hardcode 颜色

---

## §7 跟 Coding 3.0 的协同协议

| 步骤 | 输入 / 输出 |
|---|---|
| `prd skill` 转 prd.json | 输入本文件 → 输出 scripts/ralph/prd-1.json(US-NN → story-NN 1:1)· anti_patterns 由 grep reject-examples.jsonl 注入 |
| `/plan-check` | 检查本 PRD §1 7 US 完整 · §2 4 类 AC 齐(每 US H/E/B/P)· §4 风险有缓解 · §5 测试配额合理 · risk_level=foundation 升档检查 |
| `python ralph.py --model sonnet --daemon` | 读 scripts/ralph/prd.json(已 cp 自 prd-1.json) · 按 risk_level + depends_on 拓扑跑 7 story |
| Opus audit(每 story 后) | §0 4 项实测(pytest 不适用 · 改用 pnpm typecheck + lint + 类型扫 + import 扫)· §Z 风险分档(US-001/002/003/007 = foundation 深审 · US-004/005 = medium 标准审 · US-006 = high 深审) |
| `/goal-verify` | 双向对账 · 实际代码 vs PRD §2 AC + 实际代码 vs ARCHITECTURE §9.2 退出条件 + ARCHITECTURE §3.2 procedure 名 · §0 跑 /gsd-map-codebase 同步事实层(apps/api / apps/web 各跑一份) |
| `/prd-retro` | 反哺 ~/.claude/playbooks/reject-examples.jsonl · 提炼 P0 反例(预期:OAuth callback / monorepo prisma / vite proxy / typecheck import 等) |

---

## §8 修订记录

- v0.1 · 2026-05-07 · prd skill (Opus) · 初版 · 7 US 4 类 AC 35 反例就位 · risk=foundation 升档生效

---

> **本 PRD 由 Opus 主对话(prd skill 风格)写 · ARCHITECTURE-driven 模式 · 准备由 Ralph 在 PRD-1 实施期跑 7 story。**
> **下一步** · ralph skill 转 scripts/ralph/prd-1.json · /plan-check 7 项 · cp prd-1.json prd.json · python ralph.py --model sonnet --daemon · /monitor-ralph
