# QuanAn · src/ 脚手架索引(SCAFFOLD.md)

> **版本** · v0.2(2026-05-06 创建 · 2026-05-07 v0.2 修订:§A monorepo 强制改造)
> **角色** · src/ 代码工程的"目录索引"+ 文件清单 · 让 Ralph 在 Coding 3.0 P0 阶段立即可用
> **状态** · **本骨架是"最小可启动 + 关键骨架填充"模式** · 不是完整实现 · 详细实现由 Ralph 在 P0-P8 各 Phase 完成
> **配套** · [ARCHITECTURE.md](ARCHITECTURE.md) · [AGENTS.md](AGENTS.md) · [DATA-MODEL.md](DATA-MODEL.md) · [PROMPTS.md](PROMPTS.md)

---

## 文件清单(8 大类 · 50+ 文件)

| 类别 | 路径 | 文件数 | 优先级 |
|:-:|---|:-:|:-:|
| **A · 根配置** | `/`(根目录) | 11 | 🔴 P0 |
| **B · Prisma + DB** | `prisma/` | 4 | 🔴 P1 |
| **C · 常量库** | `src/lib/constants/` | 10 | 🔴 P0 |
| **D · zod schemas** | `src/lib/schemas/` | 18+ | 🔴 P1 |
| **E · Agent base** | `src/server/agents/base/` | 4 | 🔴 P3 |
| **F · 14 Specialists** | `src/server/agents/specialists/` | 14 | 🟠 P3+ |
| **G · 7 Workers** | `src/server/workers/` | 8 | 🟠 P3+ |
| **H · tRPC routers** | `src/server/trpc/` | 14 | 🟠 P1+ |
| **I · 合规模块** | `src/lib/compliance/` | 2 | 🔴 P0 |
| **J · scripts(审计)** | `scripts/` | 5 | 🔴 P0 |
| **K · 测试目录骨架** | `tests/` | 4 + N | 🟠 P0+ |

---

## 完整目录树

```
QuanAn/
├── package.json                    # 依赖锁定 · 跟 AGENTS §2 一致
├── pnpm-workspace.yaml             # workspace(可选)
├── tsconfig.json                   # strict + noUncheckedIndexedAccess
├── vite.config.ts                  # 前端 build
├── tailwind.config.js              # 从 DESIGN.md YAML 派生
├── postcss.config.js
├── .eslintrc.cjs                   # eslint + plugins
├── .prettierrc                     # prettier
├── vitest.config.ts                # 单元 + 集成测试
├── playwright.config.ts            # E2E
├── .gitignore
├── .env.example                    # 环境变量模板(脱敏)
├── README.md                       # 项目快速启动
│
├── prisma/
│   ├── schema.prisma               # 15 + 3 实体(完整 model)
│   ├── seed.ts                     # 种子数据(测试用户 + 67 案例入向量库)
│   └── migrations/
│       ├── manual_rls.sql          # 12 表 RLS 策略
│       └── manual_vector_indexes.sql  # ivfflat 索引
│
├── src/
│   ├── lib/
│   │   ├── constants/              # 30KB 常量(LD-011)
│   │   │   ├── platforms.ts        # 5 平台
│   │   │   ├── industries.ts       # 56 行业(5 大类)
│   │   │   ├── hotElements.ts      # 22 元素(4 组)
│   │   │   ├── scriptTypes.ts      # 20 脚本 + methodology
│   │   │   ├── presentStyles.ts    # 14 形式
│   │   │   ├── privateDomain.ts    # 6 阶段
│   │   │   ├── steps.ts            # 9 步
│   │   │   ├── evolution.ts        # 5 等级阈值
│   │   │   ├── diagnosis.ts        # 8 维度自评项
│   │   │   └── index.ts            # barrel
│   │   ├── schemas/                # zod 真理来源
│   │   │   ├── entities/           # 15 实体 schema
│   │   │   │   ├── user.schema.ts
│   │   │   │   ├── ip-account.schema.ts
│   │   │   │   ├── step-data.schema.ts
│   │   │   │   ├── history.schema.ts
│   │   │   │   ├── topic.schema.ts
│   │   │   │   ├── asset.schema.ts
│   │   │   │   ├── diagnosis-report.schema.ts
│   │   │   │   ├── feedback-log.schema.ts
│   │   │   │   ├── evolution-profile.schema.ts
│   │   │   │   ├── evolution-insight.schema.ts
│   │   │   │   ├── deep-learning-archive.schema.ts
│   │   │   │   ├── knowledge.schema.ts
│   │   │   │   ├── trending-item.schema.ts
│   │   │   │   ├── invite-code.schema.ts
│   │   │   │   └── ...(运维表 3)
│   │   │   ├── step-results/       # 9 step result schema
│   │   │   │   └── step1-step8.schema.ts
│   │   │   ├── specialist-io/      # 14 Specialist 输入输出
│   │   │   └── index.ts
│   │   ├── compliance/             # 合规模块(LD-018)
│   │   │   ├── disclaimer.ts       # 免责声明
│   │   │   └── pii-mask.ts         # PII 脱敏
│   │   ├── prompts/                # 14 Specialist prompt 模板(对应 PROMPTS.md)
│   │   ├── trpc.ts                 # tRPC client 配置
│   │   ├── logger.ts               # pino logger
│   │   └── utils/                  # 通用工具
│   │
│   ├── server/                     # 服务端
│   │   ├── agents/
│   │   │   ├── base/               # 抽象层
│   │   │   │   ├── types.ts        # SpecialistInput/Output/Config 接口
│   │   │   │   ├── BaseSpecialist.ts
│   │   │   │   ├── ContextAssembler.ts
│   │   │   │   └── IPProgressService.ts
│   │   │   └── specialists/        # 14 Specialist 实现
│   │   │       ├── PositioningAgent.ts
│   │   │       ├── BrandingAgent.ts
│   │   │       ├── MonetizationAgent.ts
│   │   │       ├── TopicAgent.ts
│   │   │       ├── CopywritingAgent.ts  ★ 完整示例
│   │   │       ├── VideoAgent.ts
│   │   │       ├── LivestreamAgent.ts
│   │   │       ├── PrivateDomainAgent.ts
│   │   │       ├── AnalysisAgent.ts
│   │   │       ├── DiagnosisAgent.ts
│   │   │       ├── DeepLearnAgent.ts
│   │   │       ├── VoiceChatAgent.ts    ★L5
│   │   │       ├── EvolutionAgent.ts    ★L5
│   │   │       └── DailyTaskAgent.ts    ★L5
│   │   ├── workers/                # 7 Workers
│   │   │   ├── llm-gateway/        # ADR-013
│   │   │   │   ├── index.ts        # 入口
│   │   │   │   ├── rate-limit.ts
│   │   │   │   ├── circuit-breaker.ts
│   │   │   │   ├── cost-tracker.ts
│   │   │   │   └── model-router.ts
│   │   │   ├── image-gen/index.ts
│   │   │   ├── file-parser/index.ts
│   │   │   ├── stt/index.ts
│   │   │   ├── tts/index.ts
│   │   │   ├── trending-scraper/index.ts
│   │   │   └── methodology-query/index.ts
│   │   ├── trpc/                   # tRPC 服务端
│   │   │   ├── context.ts
│   │   │   ├── trpc.ts             # init + middleware
│   │   │   ├── middleware/
│   │   │   │   └── account-isolation.ts
│   │   │   └── routers/            # 13 router(LD §3.2)
│   │   │       ├── auth.ts
│   │   │       ├── ipAccounts.ts
│   │   │       ├── stepData.ts
│   │   │       ├── copywriting.ts
│   │   │       ├── videoAnalysis.ts
│   │   │       ├── videoProduction.ts
│   │   │       ├── boomGenerate.ts
│   │   │       ├── monetization.ts
│   │   │       ├── privateDomain.ts
│   │   │       ├── diagnosis.ts
│   │   │       ├── evolution.ts
│   │   │       ├── deepLearning.ts
│   │   │       ├── knowledge.ts
│   │   │       └── _app.ts         # router 聚合
│   │   ├── memory/                 # 5 层记忆(ADR-006)
│   │   │   ├── l1-buffer.ts
│   │   │   ├── l2-core.ts
│   │   │   ├── l3-recall.ts
│   │   │   ├── l4-profile.ts
│   │   │   └── l5-trending.ts
│   │   ├── cron/                   # Heartbeat(ADR-005)
│   │   │   ├── evolution-runner.ts
│   │   │   └── daily-task-runner.ts
│   │   └── audit/                  # 审计 + 计费
│   │       ├── audit-log.ts
│   │       └── cost-tracker.ts
│   │
│   ├── pages/                      # 路由(34 个)· 后续 P2-P8 填
│   │   └── ...
│   ├── components/                 # UI(shadcn + 业务)
│   │   └── ...
│   ├── hooks/                      # React hooks
│   │   ├── useStepData.ts
│   │   ├── useActiveAccount.ts
│   │   ├── useEvolution.ts
│   │   └── useFeedback.ts
│   └── styles/
│       └── globals.css
│
├── scripts/                        # 脚本
│   ├── audit-all.sh                # 一键审计(对应 AGENTS §8.8)
│   ├── audit-redlines.sh           # 17 红线 grep
│   ├── audit-ld.sh                 # 18 LD 检测
│   ├── schema-diff.ts              # prisma/zod/doc 一致性检查
│   └── ralph/                      # Coding 3.0 工具(从全局复制 · 详 P0)
│
├── tests/
│   ├── unit/                       # 单元(200+)
│   ├── integration/                # 集成(40-60)
│   ├── e2e/                        # E2E(8-10 · playwright)
│   └── llm-judge/                  # LLM Judge(100 金标准)
│       ├── config.ts
│       ├── golden-dataset.ts
│       └── runner.ts
│
└── public/
    ├── manifest.json               # PWA
    └── icons/
```

---

## 文件填充计划(分 7 批写)

| 批次 | 类别 | 文件 | 状态 |
|:-:|---|:-:|:-:|
| 批 1 | A · 根配置 | 11 文件 | 进行中 |
| 批 2 | B + C 部分 · prisma + 常量 | 10 文件 | 待 |
| 批 3 | C 剩余 + D · 常量 + zod schema | 12 文件 | 待 |
| 批 4 | E + F 部分 · base + CopywritingAgent ★ | 5 文件 | 待 |
| 批 5 | F + G · 13 Specialist 骨架 + Workers | 20 文件 | 待 |
| 批 6 | H + I · tRPC routers + compliance | 16 文件 | 待 |
| 批 7 | J + K · scripts + tests 骨架 | 9 文件 | 待 |

**预估 80 文件 · 累计 ~3000-4000 行代码**(含骨架 + 关键完整实现)。

---

## 实现策略

### 完整实现(关键文件 · 必跑通)

* `package.json` · `tsconfig.json` · `tailwind.config.js`
* `prisma/schema.prisma`(15 + 3 实体)
* `prisma/migrations/manual_rls.sql`
* `src/lib/constants/*`(全部 9 常量)
* `src/lib/schemas/entities/*`(关键 5 个 zod schema)
* `src/server/agents/base/{types,BaseSpecialist,ContextAssembler}.ts`
* `src/server/agents/specialists/CopywritingAgent.ts` ★(完整示例)
* `src/server/workers/llm-gateway/index.ts`(完整框架)
* `src/lib/compliance/{disclaimer,pii-mask}.ts`
* `scripts/audit-redlines.sh`
* `README.md`

### 骨架占位(其他文件 · TODO 风格)

* 13 个 Specialist(除 CopywritingAgent)· 仅 config + 空 execute()
* 13 个 tRPC routers · 仅 stub procedure(返回 mock)
* Workers 仅入口签名 + TODO

> Ralph 在 P3-P8 各 Phase 按 PRD 填充 TODO 部分 · Opus 审计每个 Phase 退出条件。

---

---

## §A 强制 monorepo workspace 改造(2026-05-07 v0.2 新增 · 对应 REVIEW P1-7 + ADR-019)

> v0.1 写 `pnpm-workspace.yaml(可选)` · REVIEW(2026-05-06)指出这是隐患 — 实际 src/ 下前后端混在一个包内,后续拆 admin 子系统(ADR-021)时要大重构。
> v0.2 修订:**强制 monorepo workspace** · 移到 P0 启动前完成。

### §A.1 目标 workspace 结构

```
QuanAn/(monorepo)
├── pnpm-workspace.yaml             ★ 强制(不再可选)
├── package.json                    根 package · 仅 devDeps + scripts
├── turbo.json                      Turborepo 配置(可选 · 加速 build)
├── tsconfig.base.json              共享 tsc 配置
│
├── apps/
│   ├── web/                        主应用 SPA · www.quanan.com
│   │   ├── src/
│   │   │   ├── pages/              33 路由(9 步 + 14 工具 + 6 新 + 4 辅助)
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── styles/
│   │   │   └── main.tsx
│   │   ├── public/manifest.json    PWA
│   │   ├── index.html
│   │   ├── vite.config.ts          build target: dist-web
│   │   ├── tailwind.config.js      引用 @quanan/ui base
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── admin/                  ★ 新增 · 管理后台 SPA · admin.quanan.com
│   │   ├── src/
│   │   │   ├── pages/              13 路由组(对应 ADMIN §6.3 16 业务管理域)
│   │   │   │   ├── ops/Dashboard.tsx      (域 ① NSM)
│   │   │   │   ├── users/{List,Detail}.tsx (域 ②)
│   │   │   │   ├── accounts/{List,Detail}.tsx (域 ③)
│   │   │   │   ├── cost/{Dashboard,Export}.tsx (域 ④)
│   │   │   │   ├── audit/{Search,TraceLookup}.tsx (域 ⑤)
│   │   │   │   ├── invites/{List,Campaigns,Create}.tsx (域 ⑥)
│   │   │   │   ├── review-trending/{Queue,Rules}.tsx (域 ⑦)
│   │   │   │   ├── review-deep-learn/{Queue,Violations}.tsx (域 ⑧)
│   │   │   │   ├── evolution/{Monitor,Anomalies}.tsx (域 ⑨)
│   │   │   │   ├── prompts/{List,Editor,History}.tsx (域 ⑩)
│   │   │   │   ├── quota/{List,Adjustments}.tsx (域 ⑪)
│   │   │   │   ├── compliance/{Dashboard,Export}.tsx (域 ⑫)
│   │   │   │   ├── approval/{Inbox,Detail,History}.tsx (域 ⑬)
│   │   │   │   └── (P9.4 后)ab/ knowledge/ config/(域 ⑭⑮⑯)
│   │   │   ├── layouts/AdminLayout.tsx  (sidebar + topbar + audit drawer)
│   │   │   ├── components/admin/        (admin 专属业务组件)
│   │   │   ├── hooks/{useAdminUser,useAdminAudit, ...}.ts
│   │   │   ├── styles/admin.css
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts          build target: dist-admin
│   │   ├── tailwind.config.js      引用 @quanan/ui base + admin
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                        后端服务 · api.quanan.com
│       ├── src/
│       │   ├── trpc/
│       │   │   ├── context.ts
│       │   │   ├── trpc.ts
│       │   │   ├── middleware/
│       │   │   │   ├── account-isolation.ts    (主应用 RLS)
│       │   │   │   ├── admin-auth.ts           ★ 6 闸鉴权链 1
│       │   │   │   ├── role-check.ts           ★ 闸 2
│       │   │   │   ├── ip-whitelist.ts         ★ 闸 3
│       │   │   │   ├── mfa-check.ts            ★ 闸 4
│       │   │   │   ├── admin-rls.ts            ★ 闸 5(set app.role='admin')
│       │   │   │   └── approval-gate.ts        ★ 闸 6(对应 ADR-020)
│       │   │   └── routers/
│       │   │       ├── app/                   (主应用 13 router · ARCHITECTURE §3.2)
│       │   │       │   ├── auth.ts
│       │   │       │   ├── ipAccounts.ts
│       │   │       │   ├── stepData.ts
│       │   │       │   └── ...
│       │   │       └── admin/             ★ 新增 · 14 admin router(ADMIN §5.1)
│       │   │           ├── _router.ts          (聚合 14 子树)
│       │   │           ├── ops.ts              (域 ① NSM)
│       │   │           ├── users.ts            (域 ②)
│       │   │           ├── accounts.ts         (域 ③)
│       │   │           ├── cost.ts             (域 ④)
│       │   │           ├── audit.ts            (域 ⑤)
│       │   │           ├── invites.ts          (域 ⑥)
│       │   │           ├── review-trending.ts  (域 ⑦)
│       │   │           ├── review-deep-learn.ts(域 ⑧)
│       │   │           ├── evolution.ts        (域 ⑨)
│       │   │           ├── prompts.ts          (域 ⑩)
│       │   │           ├── quota.ts            (域 ⑪)
│       │   │           ├── compliance.ts       (域 ⑫)
│       │   │           ├── approval.ts         (域 ⑬)
│       │   │           └── (P9.4)ab.ts knowledge.ts config.ts
│       │   ├── agents/                 (主应用 14 Specialist · 不变)
│       │   ├── workers/                (主应用 7 Worker · trending-scraper / file-parser 改造)
│       │   ├── memory/                 (5 层记忆)
│       │   ├── cron/                   (Heartbeat)
│       │   ├── audit/
│       │   │   ├── audit-log.ts             (主应用 audit_log)
│       │   │   └── admin-audit.ts           ★ 新增 · admin_audit_log 写入器
│       │   ├── notification/             ★ 新增
│       │   │   ├── dingtalk.ts             (钉钉 webhook · 异常告警 + Approval 通知)
│       │   │   ├── slack.ts                (Slack)
│       │   │   └── email.ts                (Resend)
│       │   ├── server.ts                  (Hono entry)
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                       ★ 强制启用(三方共享层)
│   ├── schemas/                    zod 真理来源
│   │   ├── src/
│   │   │   ├── entities/           (15 业务实体 · 已就位)
│   │   │   ├── step-results/       (9 step result)
│   │   │   ├── specialist-io/      (14 Specialist 输入输出)
│   │   │   ├── admin/              ★ 新增 · admin 专属 schema
│   │   │   │   ├── admin-user.schema.ts
│   │   │   │   ├── approval-request.schema.ts
│   │   │   │   ├── prompt-version.schema.ts
│   │   │   │   ├── user-quota.schema.ts
│   │   │   │   ├── trending-review.schema.ts
│   │   │   │   ├── deep-learn-review.schema.ts
│   │   │   │   └── ...(13 业务管理域 schema)
│   │   │   └── index.ts            (barrel)
│   │   └── package.json            "@quanan/schemas"
│   │
│   ├── ui/                         Aurelian Dark + admin 密度
│   │   ├── src/
│   │   │   ├── base/               (主应用使用)
│   │   │   │   ├── tokens/         (颜色 / 字体 / 间距 / 圆角)
│   │   │   │   ├── shadcn/         (基础 shadcn 组件)
│   │   │   │   └── ...
│   │   │   ├── admin/          ★ 新增 · admin 专属密度
│   │   │   │   ├── tokens/         (admin 密度 token · 间距 12/16 · body 14)
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── AdminSidebar.tsx
│   │   │   │   ├── AdminTopbar.tsx
│   │   │   │   ├── AdminTable.tsx       (TanStack Table 封装 · 详 ADMIN §6.5)
│   │   │   │   ├── AdminDetailDrawer.tsx
│   │   │   │   ├── AdminStatusBar.tsx
│   │   │   │   ├── AdminAuditDrawer.tsx
│   │   │   │   ├── AdminApprovalModal.tsx
│   │   │   │   └── charts/              (Recharts 封装 · 折线/漏斗/饼图)
│   │   │   └── index.ts
│   │   └── package.json            "@quanan/ui"
│   │
│   └── clients/                    tRPC client config
│       ├── src/
│       │   ├── app-client.ts       (主应用调 appRouter)
│       │   ├── admin-client.ts     ★ 新增(admin SPA 调 adminRouter)
│       │   └── trace.ts            (trace_id 协议 · 三方共享)
│       └── package.json            "@quanan/clients"
│
├── prisma/                         共享 schema(主应用 + admin 共用)
│   ├── schema.prisma               (15 业务实体 + 3 运维表 + ★ 13 admin 新表 · 详 DATA-MODEL §11)
│   ├── seed.ts
│   └── migrations/
│       ├── manual_rls.sql          (12 业务表 RLS)
│       ├── manual_admin_rls.sql    ★ 新增(admin bypass policy)
│       └── manual_vector_indexes.sql
│
├── scripts/                        共享脚本
│   ├── audit-redlines.sh           (含 ADR-019 边界 grep · ADR-021 admin 边界 grep)
│   ├── audit-ld.sh
│   ├── schema-diff.ts
│   └── ralph/                      Coding 3.0 工具(含双 daemon 配置 · 详 ADMIN §9.3)
│
└── tests/
    ├── unit/                       三方共享单元测试
    ├── integration/
    ├── e2e/
    │   ├── web/                    主应用 E2E
    │   └── admin/              ★ 新增 · admin E2E
    └── llm-judge/
```

### §A.2 关键 workspace 配置文件

#### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### 根 `package.json`(只放 devDeps + 跨包脚本)

```json
{
  "name": "quanan",
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter @quanan/web dev",
    "dev:admin": "pnpm --filter @quanan/admin dev",
    "dev:api": "pnpm --filter @quanan/api dev",
    "build:web": "pnpm --filter @quanan/web build",
    "build:admin": "pnpm --filter @quanan/admin build",
    "build:api": "pnpm --filter @quanan/api build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "audit:redlines": "bash scripts/audit-redlines.sh",
    "db:migrate": "pnpm --filter @quanan/api db:migrate",
    "db:seed": "pnpm --filter @quanan/api db:seed"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "turbo": "^2.0.0"
  }
}
```

#### `tsconfig.base.json`(共享配置)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "paths": {
      "@quanan/schemas": ["./packages/schemas/src"],
      "@quanan/schemas/*": ["./packages/schemas/src/*"],
      "@quanan/ui": ["./packages/ui/src"],
      "@quanan/ui/*": ["./packages/ui/src/*"],
      "@quanan/clients": ["./packages/clients/src"],
      "@quanan/clients/*": ["./packages/clients/src/*"]
    }
  }
}
```

### §A.3 P0 启动前的迁移路径(从 v0.1 src/ 单包到 v0.2 monorepo)

```
v0.1 现状:
QuanAn/
├── src/server/         ← 移到 apps/api/src/
├── src/lib/            ← 拆分:schemas → packages/schemas · ui → packages/ui · 其他 → apps/api 或 apps/web
├── prisma/             ← 不动 · 留根目录
└── ...

v0.2 目标(本节 §A.1 结构)

迁移步骤(0.5 天 · 一次性完成):
  ① pnpm init workspace + 配 pnpm-workspace.yaml
  ② mkdir apps/{web,admin,api} + packages/{schemas,ui,clients}
  ③ git mv src/server → apps/api/src
  ④ git mv src/pages → apps/web/src/pages(拆 admin/ 出去)
  ⑤ git mv src/lib/schemas → packages/schemas/src
  ⑥ git mv src/lib/ui-base → packages/ui/src/base
  ⑦ 各 apps/packages 加 package.json + tsconfig.json(继承 base)
  ⑧ 改根 package.json 为 workspace 根 + scripts
  ⑨ pnpm install · 跑通 pnpm dev:web / dev:api
  ⑩ apps/admin 暂留空 + 占位 README · 等 P9.0 实施

  ★ apps/admin 在 P9.0 启动时填充(参 ADMIN §8.2 P9.0 交付物)
```

### §A.4 文件填充计划修订(从 80 文件 → 110+ 文件 · admin 不在 P0 范围)

> 主应用 P0 仍是 80 文件 · admin SPA 30+ 文件留 P9.0 填(不阻塞主应用)。

| 批次 | 类别 | 文件数 | Phase |
|:-:|---|:-:|:-:|
| 批 1-7 | 主应用(原 SCAFFOLD §文件填充计划) | 80 | P0-P8 |
| **批 8** ★ | **monorepo workspace 配置** | 8(pnpm-workspace + 三方 package.json + tsconfig + turbo) | **P0 起步即做** |
| **批 9** ★ | **apps/admin 骨架占位** | 5(README + index.html + 空 main.tsx + tsconfig + package.json) | **P0 同时做** |
| 批 10 | apps/admin 实施 | 30+ | P9.0-P9.4 |

> 批 8-9 是 0.5 天工作量 · 必须在 P0 启动时完成 · 否则后续拆 admin 重构成本翻倍。

### §A.5 改造小结

本节答 5 件事:
1. **强制 monorepo** · `pnpm-workspace.yaml(可选)` → 强制启用(P1-7 修复)
2. **三方独立** · `apps/web` + `apps/admin` + `apps/api` · 共享 `packages/{schemas,ui,clients}`
3. **admin 13 路由组** · 对应 ADMIN §3 16 业务管理域(admin/* 子树完整目录就位)
4. **admin 14 router** · 加 6 闸鉴权链 middleware · 对应 ADMIN §5
5. **迁移路径** · 0.5 天一次性完成 · admin 骨架在 P0 占位 · 实施留 P9.0

---

## 修订记录

- **2026-05-06 v0.1** · 创建 SCAFFOLD.md 索引 + 完整目录树 + 80 文件清单
- **2026-05-07 v0.2** · 强制 monorepo workspace 改造(对应 REVIEW P1-7 + ADR-019 + ADR-021)
  - **§A 新增** · 完整 workspace 结构(apps/{web,admin,api} + packages/{schemas,ui,clients})
  - **apps/admin 完整目录树** · 13 路由组对应 ADMIN §6.3 16 业务管理域
  - **apps/api 加 admin router 子树**(14 router · 6 闸鉴权链 middleware)
  - **packages/* 三方共享层** · zod schemas + Aurelian Dark + admin 专属 token + tRPC client
  - **0.5 天迁移路径** · 从 v0.1 src/ 单包到 v0.2 monorepo · P0 启动前完成
