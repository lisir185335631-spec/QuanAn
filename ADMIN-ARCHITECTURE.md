# QuanAn · 管理后台架构(ADMIN-ARCHITECTURE.md)

> **版本** · v0.2(2026-05-07 · 跟 ARCHITECTURE.md 平级 · 不依附主架构 · v0.2 修订:§8.7 + §9.3 改单 daemon 串行)
> **范围** · 管理后台子系统的**独立架构** — 部署 / 鉴权 / 业务管理域 / 接口契约 / 前端 / 路线图
> **派生自** · [`ARCHITECTURE-REVIEW.md`](ARCHITECTURE-REVIEW.md) §3 + §5(P0/P1 系统性补完)+ [`ARCHITECTURE.md`](ARCHITECTURE.md) §2.5b 占位 + [`DATA-MODEL.md`](DATA-MODEL.md) §G 运维表 + §9 RLS
> **方法论** · 项目本仓库 [`knowledge-base/`](../Ai_Agent/knowledge-base/) 的多租户 / 安全 / 运营分析 / Approval Gates 等 ADR
> **服务对象** · super_admin / admin / readonly_admin / 财务 / 法务 / 客服(详见 §1.3)
>
> **阅读顺序** · §1 看定位 → §2 看部署 → §3 看 13+ 业务管理域(★ 核心)→ §4-5 看数据/接口 → §6-7 看前端/鉴权 → §8 看实施 → §9 看协同

---

## 默认决策摘要(应用本架构 5 项 · 来自 REVIEW §7.3)

| # | 决策点 | 选择 | 影响章节 |
|:-:|---|---|---|
| 1 | admin 子系统是 1.0 一起上还是独立后续版本? | **B · 独立后续** · 主应用上线后再做 · 总 11+9 周分批 | §8 实施路线图 |
| 2 | 重运营还是重开发? | **A · 重运营** · 13 域全做 · 含审核 + 仪表盘 | §3 业务管理域 |
| 3 | admin 角色是否需要分档? | **A · 三档** · super_admin / admin / readonly_admin | §4 + §7 鉴权 |
| 4 | MFA 是否强制? | **B · 仅 super_admin 强制** · admin 后续加 | §7.3 MFA |
| 5 | admin 是否复用主应用的 Aurelian Dark? | **A · 复用 base + admin 专属密度** | §6 前端架构 |

> ⚠️ 任何对上述 5 个决策的修改 · **必须先开新 ADR(ADR-019/020 ... 系列)** · 才能改本文件 · 才能改代码。

---

## 文档地图

| § | 章节 | 一句话 |
|:-:|---|---|
| §1 | **系统总览** | admin 是独立 first-class 子系统 · 跟主应用解耦 · 服务运营/财务/法务/客服 4 类内部用户 |
| §2 | **部署形态** | 独立子域名(admin.quanan.com)+ 独立 SPA(apps/admin)+ 独立 OAuth + IP 白名单 + 独立 CI/CD |
| §3 | **业务管理域全景**(★ 核心) | 13+ 域:6 P0 + 2 P0 内容审核 + 5 P1 + 3 P2 — 每域含数据来源/KPI/交互/鉴权/UI |
| §4 | **数据访问与隔离** | admin 跨账号 RLS policy + admin_audit_log 独立审计 + 三档角色权限矩阵 |
| §5 | **接口契约** | adminRouter 跟 appRouter 并列的 tRPC 树 + 鉴权链 + 命名规范 |
| §6 | **前端架构** | apps/admin SPA + Aurelian Dark + admin 密度 + 13 路由组 + 数据可视化 + 表格 |
| §7 | **鉴权 + 审计 + 安全** | 独立 OAuth + IP 白名单 + MFA(super_admin)+ Approval Gates + 异常告警 |
| §8 | **实施路线图** | P9.0-P9.4 共 9 周 · 主应用 P0-P8 上线后启动 · 不阻塞主应用 |
| §9 | **与主应用协同** | 共享 / 不共享清单 + 跨子系统事件总线 + Coding 3.0 双 daemon 协同 |

---

## §1 系统总览

### §1.1 admin 子系统定位(为什么独立 · 不嵌入主应用)

> **第一性问题** · 管理后台跟主应用是同一个产品 · 还是两个产品?
> 答案 · **两个产品** — 服务对象不同 · 演进节奏不同 · 安全边界不同 · 必须独立。

| 维度 | 主应用 | 管理后台 |
|---|---|---|
| **服务对象** | 个人 IP 起号者 / OPC 创业者 / MCN(C 端外部用户)| super_admin / admin / 财务 / 法务 / 客服(B 端内部用户)|
| **核心能力** | AI 自助创作 + 9 步向导 + 14 工具 + 进化飞轮 | 运营监控 + 审核 + 审计 + 配额管理 + Prompt 治理 |
| **演进节奏** | 业务驱动 · 跟随用户增长(MVP 5 周 / 全功能 16 周)| 运营驱动 · 跟随事故和合规需求(独立 9 周 P9 系列)|
| **安全等级** | 标准 OAuth + Session + RLS | 独立 OAuth + IP 白名单 + MFA + Approval + 全审计 |
| **故障域** | 挂了用户无法用 AI · C 端事故 | 挂了运营无法监控 · 但 C 端无感知 |
| **发版节奏** | 跟随产品迭代 · 周更 | 按需发版 · 月更甚至季度更 |

> 🟢 **结论** · 把 admin 嵌入主应用相当于把"卡车驾驶证"和"飞机驾驶证"做成同一张证件 — 表面上省事 · 实质上让两边都妥协。

### §1.2 跟主应用的关系(共享什么 / 不共享什么)

```
                    ┌────────────────────────────────────┐
                    │       共享层(packages/*)         │
                    │  · zod schemas(真理来源)         │
                    │  · Aurelian Dark base tokens       │
                    │  · Prisma schema(同一个数据库)   │
                    │  · 监控 / 日志(同一套基础设施)   │
                    │  · trace_id 协议                   │
                    └─────────┬────────────────┬────────┘
                              │                │
              ┌───────────────┘                └───────────────┐
              ▼                                                ▼
   ┌────────────────────────┐                    ┌────────────────────────┐
   │   主应用(apps/web)     │                    │   管理后台(apps/admin)  │
   │  + apps/api(后端)      │  ← (同一 api 但 ── │   + apps/api 复用       │
   │                         │   adminRouter 隔离) │                         │
   │  · 用户 OAuth           │                    │  · 独立 admin OAuth     │
   │  · 主 SPA bundle        │                    │  · 独立 admin SPA       │
   │  · www.quanan.com       │                    │  · admin.quanan.com     │
   │  · 14 Specialist        │                    │  · 13 业务管理域        │
   │  · 进化飞轮             │                    │  · 不调 Specialist      │
   └────────────────────────┘                    └────────────────────────┘
```

**共享清单**:
- ✅ Prisma schema(同一个数据库 · admin 通过 RLS bypass 跨账号查)
- ✅ zod schemas(`packages/schemas/`)
- ✅ Aurelian Dark base tokens(`packages/ui/`)
- ✅ tRPC 类型 / trace_id 协议(`packages/clients/`)
- ✅ 监控 / 日志 / Sentry / pino · 同一套观测栈
- ✅ 运行时 api 后端进程(同一个 `apps/api/` · 但 `adminRouter` 跟 `appRouter` 树状隔离)

**不共享清单**(关键边界):
- ❌ OAuth 应用 · 主应用 client_id ≠ admin client_id
- ❌ Session · 主应用 session 不能登 admin · 反之亦然
- ❌ SPA bundle · `apps/web` 跟 `apps/admin` 是两个独立 build 产物
- ❌ 域名 · `www.quanan.com` ≠ `admin.quanan.com`
- ❌ 路由 / 页面 / 设计密度
- ❌ CI/CD · 改 web 不发 admin · 改 admin 不发 web
- ❌ 故障域 · admin 挂不影响 web · web 挂不影响 admin

### §1.3 服务对象(admin 内部 6 类用户)

> 跟主应用 4 类外部用户(个人 IP / OPC / 转型者 / MCN)完全不同。admin 是给**内部团队**用的。

| 角色 | 占比目标 | 关键诉求 | 鉴权档位 |
|---|:-:|---|:-:|
| **super_admin**(技术负责人 / CEO) | 5% · 1-3 人 | 全权 · 跨账号查 · 高风险操作 · 紧急止损 | super_admin |
| **admin**(产品 / 运营 / 增长) | 30% · 5-10 人 | 看仪表盘 · 处理用户问题 · 审核内容 · 改 prompt | admin |
| **readonly_admin · 财务** | 15% · 1-2 人 | 看成本仪表盘 · 导出账单 · 月度对账 | readonly_admin(财务模式) |
| **readonly_admin · 法务** | 10% · 1-2 人 | 看 audit_log · 取证导出 · 合规仪表盘 | readonly_admin(法务模式) |
| **admin · 客服** | 30% · 5-10 人 | 用户检索 · 配额调整 · 反馈反查 · 临时白名单 | admin(限定范围) |
| **admin · 内容审核员** | 10% · 2-5 人 | TrendingItem 审核 · DeepLearning 审核 · 违规内容下架 | admin(审核模式) |

> ⚠️ **客服 / 审核员都是 admin 角色 · 但不同"模式"**(不同模式开放不同管理域)— 详见 §4.3 权限矩阵。

### §1.4 admin 子系统 9 层架构图

> 借用主应用 9 层架构的形式 · 但每一层职责完全不同。

```
┌────────────────────────────────────────────────────────────────────────┐
│  L1 · UI 表现层(React + Aurelian Dark + admin 密度)                  │
│       admin layout(sidebar 13 域 / topbar / breadcrumb / audit drawer)│
├────────────────────────────────────────────────────────────────────────┤
│  L2 · 客户端 SDK 层                                                    │
│       tRPC client(指向 adminRouter)+ React Query + Zustand            │
│       useAdminUser / useAdminAudit / 各域专属 hook                      │
├────────────────────────────────────────────────────────────────────────┤
│  L3 · API 网关层(adminRouter 14 子树 / 80+ procedure)                 │
│       admin.users / admin.accounts / admin.cost / admin.audit / ...    │
├────────────────────────────────────────────────────────────────────────┤
│  L4 · 鉴权链层(★ admin 子系统专属)                                   │
│       adminAuth → roleCheck → ipWhitelist → mfaCheck                   │
│       → approvalGateCheck(高风险) → auditLog                          │
├────────────────────────────────────────────────────────────────────────┤
│  L5 · 业务管理域服务层(13+ 域)                                        │
│       NSMService / UserAdminService / CostService / AuditService /     │
│       ContentReviewService / EvolutionMonitorService /                 │
│       PromptVersionService / QuotaService / ApprovalService / ...      │
├────────────────────────────────────────────────────────────────────────┤
│  L6 · 数据访问层(★ admin 跨账号 bypass RLS)                          │
│       adminPrisma · 自动 set_config('app.role', 'admin', true)         │
│       走单独 RLS policy(DATA-MODEL §9.3)                              │
├────────────────────────────────────────────────────────────────────────┤
│  L7 · 数据可视化层(纯展示 · 无 LLM)                                   │
│       Recharts / ECharts · 折线 / 漏斗 / 桑基 / 热力                    │
│       TanStack Table · 虚拟滚动 + 列筛选 + 导出 CSV/Excel               │
├────────────────────────────────────────────────────────────────────────┤
│  L8 · 数据持久层(★ 复用主应用)                                       │
│       PostgreSQL(同一库 · admin role bypass RLS)                      │
│       Redis(独立 namespace · admin:session:* / admin:cache:*)         │
│       admin_audit_log(独立表 · DATA-MODEL 待加)                       │
├────────────────────────────────────────────────────────────────────────┤
│  L9 · 观测与运营层                                                     │
│       admin 操作 trace · 异常登录告警(钉钉/Slack)· 法务取证导出       │
└────────────────────────────────────────────────────────────────────────┘
```

> ⚠️ **关键差异**(跟主应用 9 层比) ·
> 1. **L4 鉴权链是 admin 子系统专属**(主应用没有 ipWhitelist / mfaCheck / approvalGateCheck)
> 2. **L5 是业务管理服务**(不是 14 Specialist · admin 不调 LLM)
> 3. **L6 是 admin bypass RLS**(主应用是强 RLS · admin 走单独 policy)
> 4. **L7 是数据可视化**(主应用 L7 是 Tool/RAG · admin 不需要)

### §1.5 与 aiipznt 原版的差异(第 9 条偏离决策)

> ARCHITECTURE.md §1.7 列了 8 条偏离决策(视觉/拓扑/文案/记忆/进化/流式/多账号/透明度)· 本架构补**第 9 条**:

| # | 维度 | aiipznt 原版 | QuanAn 本架构 | 偏离理由 |
|:-:|---|---|---|---|
| **9** | **管理后台** | 1 个 `/invite-manage`(嵌入主应用)+ "推测后台功能"(spec.md §16.3) | **独立子系统** · 13+ 业务管理域 · 独立部署 · 独立鉴权 · 独立路线图 | 原版 admin 简陋是历史包袱 · 复刻产品不应连同包袱一起复刻 · 用户硬约束#2 #3 要求独立 |

### §1.6 决策摘要应用(本架构 5 项默认决策落到哪里)

| # | 默认决策 | 落地章节 | 落地形式 |
|:-:|---|---|---|
| 1 | B · admin 独立后续版本 | §8 P9.0 启动时机 | 主应用 P0-P8 完成后才启动 P9 |
| 2 | A · 重运营 · 13 域全做 | §3 业务管理域全景 | 13 域 + 3 P2 = 共 16 个 |
| 3 | A · 三档角色 | §4.3 权限矩阵 + §7.1 OAuth 设计 | super_admin / admin / readonly_admin · 含 admin 子模式(客服/审核员)|
| 4 | B · 仅 super_admin 强制 MFA | §7.3 MFA 章节 | super_admin 强制 TOTP/WebAuthn · admin 推荐但不强制 |
| 5 | A · 复用 Aurelian Dark + admin 密度 | §6.1 设计系统 | 复用主应用 base tokens · 加密集表格 / 数据可视化专属 |

### §1.7 一句话总结

> **admin 子系统不是主应用的"附属页面" · 是与主应用平级的 first-class 产品** — 服务对象、演进节奏、安全等级、故障域全部独立 · 共享数据库和监控基础设施 · 不共享 SPA、OAuth、CI/CD。本架构按"重运营 + 13 域 + 三档角色 + super_admin 强制 MFA + 复用 Aurelian Dark"5 项决策展开。

---

## §2 部署形态

### §2.1 独立子域名 · admin.quanan.com

```
www.quanan.com         · 主应用(apps/web)        · 用户访问
admin.quanan.com       · 管理后台(apps/admin)    · 内部团队访问
api.quanan.com         · 后端 API(apps/api)      · 两端都调用
                          ↑
                          ├── /trpc/app.*      · 主应用调
                          └── /trpc/admin.*    · 管理后台调
```

**子域名隔离的好处**:
- ✅ Cookie / Session 自然隔离(`admin.quanan.com` 跟 `www.quanan.com` Cookie 不互通)
- ✅ CDN / 静态托管可分别配置(admin 走更严格的 CDN policy · 比如禁缓存)
- ✅ DNS / WAF 层可独立加防护(admin 加 IP 白名单 · www 不加)
- ✅ 用户视觉认知清晰(打开 admin.quanan.com 就知道是后台)

### §2.2 独立 SPA bundle · apps/admin

```
QuanAn/(monorepo)
├── apps/
│   ├── web/                    主应用 SPA(原 src/pages/* 主部分)
│   │   ├── src/pages/
│   │   ├── src/components/
│   │   ├── vite.config.ts      build target: dist-web
│   │   └── package.json
│   ├── admin/    ★ 新建        管理后台 SPA
│   │   ├── src/pages/admin/
│   │   ├── src/components/admin/
│   │   ├── src/layouts/AdminLayout.tsx
│   │   ├── vite.config.ts      build target: dist-admin
│   │   └── package.json
│   └── api/                    后端服务(原 src/server/*)
│       ├── src/trpc/
│       │   ├── routers/app/    主应用 router 树
│       │   └── routers/admin/  ★ admin router 树(隔离)
│       ├── src/agents/
│       ├── src/workers/
│       ├── src/middleware/admin-auth.ts ★ 独立鉴权链
│       └── package.json
│
├── packages/
│   ├── schemas/                zod 真理(三方共享)
│   ├── ui/                     Aurelian Dark base + 组件
│   │   ├── base/               主应用使用
│   │   └── admin/              ★ admin 专属密度组件
│   └── clients/                tRPC client config
│       ├── app-client.ts
│       └── admin-client.ts     ★
│
├── prisma/                     共享 schema
│   ├── schema.prisma
│   └── migrations/
│
└── pnpm-workspace.yaml         ★ 强制 monorepo
```

> ⚠️ **关键** · `apps/admin` 是**完全独立的 Vite build** · 跟 `apps/web` 不互相 import 业务组件(只通过 `packages/ui/admin/` 共享基础组件)。

### §2.3 独立 OAuth 应用

```
主应用 OAuth:
  client_id     · QUANQN_WEB_CLIENT_ID
  client_secret · QUANQN_WEB_CLIENT_SECRET
  redirect_uri  · https://www.quanan.com/auth/callback
  scope         · openid email profile
  
管理后台 OAuth(独立申请):
  client_id     · QUANQN_ADMIN_CLIENT_ID    ★ 不同 client_id
  client_secret · QUANQN_ADMIN_CLIENT_SECRET
  redirect_uri  · https://admin.quanan.com/auth/callback   ★ 不同回调
  scope         · openid email profile
  额外限制      · Google Workspace 内部域名(只允许 @quanan.com 邮箱)
```

> 🟢 **为什么必须独立** · 同一 OAuth 应用同时支持两个 client 看似省事 · 但:
> - 安全审计无法分离("是哪个端的登录"无法 1 步判断)
> - Workspace 限制无法独立(主应用要给外部用户 · admin 要限内部域名)
> - 撤回时不能精准撤回("admin 被入侵"等于"用户也被入侵")

### §2.4 IP 白名单 + MFA + 强制审计

```
admin.quanan.com 访问链路:
─────────────────────────────────────────────────
  ① DNS → CDN
       └── WAF 层 IP 白名单(office network + VPN IP 段)
            └── 不在白名单 → 403 Forbidden(连 OAuth 页面都不显示)
            
  ② OAuth 登录
       └── Google Workspace 限定 @quanan.com
            └── 不是内部邮箱 → 拒绝
            
  ③ Session 建立(独立 admin session · 跟主应用 session 不互通)
       └── 写 admin_audit_log · eventType='admin_login'
       
  ④ MFA 校验(super_admin 强制 · admin 推荐)
       └── TOTP 或 WebAuthn(super_admin 30 天一验)
            └── 失败 3 次 · 锁账号 · 钉钉告警
            
  ⑤ 进入 admin SPA
       └── 每个 procedure 调用走鉴权链(§5.3)
       └── 每个跨账号 query 写 audit_log eventType='cross_account_query'
       └── 每个高风险操作走 Approval Gates(§7.6)
```

### §2.5 独立 CI/CD

```
GitHub Actions(monorepo · 路径触发)
─────────────────────────────────────────────────
  apps/web/**          → web-deploy.yml
                          ├── lint + test web
                          ├── build apps/web → dist-web
                          └── deploy to Vercel(www.quanan.com)
                          
  apps/admin/**        → admin-deploy.yml ★ 独立 workflow
                          ├── lint + test admin
                          ├── build apps/admin → dist-admin
                          └── deploy to Vercel(admin.quanan.com)
                          ★ 独立的 deployment URL · 独立的发版历史
                          
  apps/api/**          → api-deploy.yml
                          ├── lint + test api(含 adminRouter 测试)
                          ├── build Docker image
                          └── deploy to Railway / Fly.io
                          
  packages/**          → 触发**所有**端的 CI(因为是共享层)
  prisma/**            → 触发 api-deploy + 跑 migration(无 admin 单独 deploy)
```

**好处**:
- ✅ 改 web 不发 admin · 反之亦然(发版历史独立 · 故障定位快)
- ✅ admin 出问题可以**独立回滚**(不影响 web)
- ✅ admin 加新功能不会让 web bundle 膨胀(用户首屏速度)

### §2.6 部署形态全图

```
┌──────────────────────────────────────────────────────────────────┐
│                    GitHub(monorepo · QuanAn)                     │
└──────────────┬─────────────┬───────────────────┬────────────────┘
               │             │                   │
               ▼             ▼                   ▼
        ┌──────────┐   ┌──────────┐       ┌──────────────┐
        │ web-CI   │   │ admin-CI │       │   api-CI     │
        └────┬─────┘   └────┬─────┘       └──────┬───────┘
             │              │                    │
             ▼              ▼                    ▼
    ┌──────────────┐  ┌──────────────┐   ┌──────────────────┐
    │  Vercel      │  │  Vercel      │   │  Railway/Fly.io  │
    │ www.quanan   │  │ admin.quanan │   │  api.quanan      │
    │ (公开 CDN)   │  │ (IP 白名单)  │   │  (容器 + autoscale│
    └──────┬───────┘  └──────┬───────┘   └────────┬─────────┘
           │                 │                    │
           └─────tRPC────────┴───────tRPC─────────┘
                             │
                             ▼
                  ┌───────────────────────┐
                  │ Postgres + pgvector   │
                  │ Redis                 │
                  │ S3                    │
                  │ (共享数据层)          │
                  └───────────────────────┘

  独立子域名     · 3 个独立 host
  独立 OAuth     · web client / admin client(分开)
  独立 CI/CD     · 改一处不发其他
  独立故障域     · 任一挂掉不影响其他
  共享数据层     · 同一个 PG / Redis / S3 · 通过 RLS 隔离
```

### §2.7 部署形态小结

本节答 5 件事:
1. **独立子域名** · admin.quanan.com / www.quanan.com / api.quanan.com — 自然隔离
2. **独立 SPA bundle** · monorepo 下 `apps/web` + `apps/admin` + `apps/api` + 共享 `packages/*`
3. **独立 OAuth 应用** · 不同 client_id + Workspace 限定内部域名
4. **多重防护** · WAF IP 白名单 + Google Workspace + MFA(super_admin)+ Approval Gates + 全审计
5. **独立 CI/CD** · 三方独立发版 · 独立回滚 · 独立故障域

下一节(§3)进入 13+ 业务管理域全景 · 这是 admin 子系统的"业务核心"。

---

## §3 业务管理域全景(★ 核心)

> 本章是 admin 子系统的"业务模型"。13+ 域按 **6 P0 业务核心 + 2 P0 内容审核 + 5 P1 + 3 P2 = 16 域**展开。
> 每域统一格式 · 6 字段:**数据来源 / KPI / 关键交互 / 鉴权 / UI 骨架 / Prisma 新表(如有)**。

### §3.1 业务管理域全景图

```
┌────────────────────────────────────────────────────────────────────┐
│                    管理后台 13+ 业务管理域                          │
├────────────────────────────────────────────────────────────────────┤
│  ★ P0 业务核心(6 域)·  运营生命线 / 安全生命线 / 财务生命线        │
│   ① 运营 NSM 仪表盘 · 产品健康度生死线                             │
│   ② 用户管理 · 用户检索 + 套餐 + 封禁                              │
│   ③ IP 账号管理 · 跨账号搜索 + 行业分布 + 异常识别                 │
│   ④ 成本仪表盘 · 月度账单 + Top 10 用户 + 异常告警                 │
│   ⑤ 审计日志查询 · trace 反查 + 法务取证                           │
│   ⑥ 邀请码管理 · campaign + 转化漏斗                               │
│                                                                    │
│  ★ P0 内容审核(2 域)· 法律 + 合规生命线                          │
│   ⑦ TrendingItem 内容审核 · 入库前队列 + 违禁词 + 来源监控         │
│   ⑧ DeepLearningArchive 审核 · 上传扫描 + PII + 抽样人审           │
│                                                                    │
│  P1 健康度判断(5 域)· 演进与质量                                  │
│   ⑨ 进化档案监控 · L1-L5 分布 + 飞轮停滞告警                      │
│   ⑩ Specialist Prompt 版本管理 · 灰度 + LLM Judge + 回滚           │
│   ⑪ 配额 / 限流管理 · 实时使用 + 异常告警 + 手动调整               │
│   ⑫ 行业合规仪表盘 · 免责触发 + 违禁词 + PII 命中                  │
│   ⑬ Approval Gates 工作流 · 高风险两步审批                         │
│                                                                    │
│  P2 后续版本(3 域)· 高级能力                                      │
│   ⑭ A/B 测试管理 · 灰度 + 漏斗对比 + 显著性                        │
│   ⑮ 知识库 / 静态常量管理 · 67 案例 + 23 公式 CRUD                 │
│   ⑯ 系统配置中心 · feature flags + env + 紧急开关                  │
└────────────────────────────────────────────────────────────────────┘
```

**域之间的横切关系**:
- 🔗 **审计 trace** 贯穿所有域 — 任何 admin 操作必写 admin_audit_log + trace_id 串联
- 🔗 **Approval Gates(域 ⑬)横切** — 域 ②⑦⑧⑨⑩⑪⑮ 的高风险操作都走 ⑬ 流程
- 🔗 **域 ④ 成本** + **域 ⑪ 配额** 联动 — 配额是成本的"前置阀门"

### §3.2 P0 业务核心(6 域)

#### 域 ① · 运营 NSM 仪表盘 ★ P0(产品健康度生死线)

| 字段 | 内容 |
|---|---|
| **数据来源** | feedback_log + step_data + evolution_profile + users + cost_log + ip_accounts(多表聚合)|
| **核心 KPI** | • **NSM** · 7 天活跃 IP 账号数(7 天内 ≥1 次 Specialist 调用 + 完成 ≥3/9 步)<br>• **完成 9 步比例** · 目标 > 30%<br>• **反馈率** · 👍/👎 点击率 / 生成次数 · 目标 > 40%<br>• **进化升级率** · 新用户 30 天内升 L2 · 目标 > 60%<br>• **D30 留存** · 目标 > 25% |
| **关键交互** | • 时间维度 · 日 / 周 / 月切换<br>• 用户画像分布 · 4 类用户(IP 起号者 / OPC / 转型者 / MCN)<br>• 漏斗钻取 · 注册 → step1 → step3 → step3b → step7 → 反馈<br>• 行业分布饼图(56 行业)<br>• 平台分布饼图(5 平台)<br>• 告警 · 任一指标连续 3 天恶化 → 钉钉推送 |
| **鉴权** | super_admin / admin / readonly_admin(财务可看 D30 + 注册数 · 不看完成率)|
| **UI 骨架** | • 顶部 · 4 大数字卡片(NSM / 完成率 / 反馈率 / 进化率)<br>• 中部 · 漏斗图(横向 6 阶段)+ 分日折线(并排)<br>• 底部 · 行业 / 平台 / 用户画像 3 饼图<br>• 右侧 · 实时告警栏(指标恶化 / 异常事件)|
| **Prisma 新表** | (复用现有表 · 不需要新表 · 但需要 `kpi_snapshots` 缓存表用于"历史趋势")|

#### 域 ② · 用户管理 ★ P0

| 字段 | 内容 |
|---|---|
| **数据来源** | users 表 + 关联 ip_accounts / cost_log(成本)/ audit_log(操作)/ feedback_log(反馈)|
| **核心 KPI** | • 总用户 / 活跃用户(7 天)/ 付费用户(Pro+Enterprise)<br>• 风险用户(成本超 90% 配额 · 反馈 0 · 异常登录) |
| **关键交互** | • **列表** · 分页 + 搜索(email / openId / userId)+ 筛选(role / 套餐 / 行业 / 注册时间 / 活跃度)+ 导出 CSV<br>• **详情**(右侧抽屉)· 5 Tab:<br>&nbsp;&nbsp;&nbsp;&nbsp;◦ 基本信息(email / role / 套餐 / 注册时间 / 最近登录)<br>&nbsp;&nbsp;&nbsp;&nbsp;◦ 活跃度(9 步进度 + 反馈分布 + 最近 30 天活跃日历)<br>&nbsp;&nbsp;&nbsp;&nbsp;◦ 成本(cost_log 月度图 + Top 5 Specialist)<br>&nbsp;&nbsp;&nbsp;&nbsp;◦ 审计时间线(audit_log 最近 100 条)<br>&nbsp;&nbsp;&nbsp;&nbsp;◦ 关联账号(ip_accounts 列表)<br>• **操作** · 改套餐(走 Approval Gates)/ 封禁(走 Approval Gates · super_admin 才能)/ 重置密码 / 强制下线 |
| **鉴权** | • super_admin · 全权<br>• admin · 改套餐 + 封禁(走 Approval)<br>• readonly_admin · 仅查 |
| **UI 骨架** | • 顶部 · 总用户 / 活跃 / 付费 / 风险 4 大数字<br>• 中部 · 用户列表表格(虚拟滚动 · TanStack Table · 多列筛选 · 列宽自定义)<br>• 详情 · 右侧抽屉(5 Tab)|
| **Prisma 新表** | 无需(复用 users 现有 schema · 但建议加 `last_login_at` `last_login_ip` 字段)|

#### 域 ③ · IP 账号管理 ★ P0

| 字段 | 内容 |
|---|---|
| **数据来源** | ip_accounts(已有 `[industry]` `[platform]` admin 索引 · DATA-MODEL:420-421)+ step_data(progress)+ evolution_profile(level)+ history(最近活跃)|
| **核心 KPI** | • 总账号 / 活跃账号(7 天)<br>• 行业分布 / 平台分布 / 阶段分布(stage)<br>• 异常账号 · 连续 7 天活跃但 0 反馈 / 进化停滞 / 多账号同 user 频繁切换 |
| **关键交互** | • **跨账号搜索** · industry / platform / level / userId / accountId<br>• **详情** · 9 步进度可视化 + 进化档案 + 最近 history(只读)+ 关联用户<br>• **异常账号识别** · 后台跑批 · 标记可疑账号 · 推 admin 确认<br>• **操作** · 标记异常 / 强制冻结(走 Approval)/ 备注(admin 内部) |
| **鉴权** | • super_admin · 全权<br>• admin(客服模式)· 查 + 备注<br>• admin(审核员模式)· 标记异常<br>• readonly_admin · 仅查 |
| **UI 骨架** | • 顶部 · 数字卡片 + 行业/平台 2 饼图<br>• 中部 · 大表格(分页 + 多维筛选 + 列自定义)<br>• 右侧抽屉 · 详情(9 步进度图 + 进化档案 + 历史时间线)<br>• 异常账号专属 Tab |
| **Prisma 新表** | • `ip_account_admin_notes`(admin 内部备注 · 不让用户看)<br>• `ip_account_anomaly_flags`(异常账号标记 · 跑批写入)|

#### 域 ④ · 成本仪表盘 ★ P0(财务生命线)

| 字段 | 内容 |
|---|---|
| **数据来源** | cost_log(双冗余 userId/accountId · 6 admin 索引 · DATA-MODEL:2351 已就位)|
| **核心 KPI** | • 月度总成本 / 同比 / 环比<br>• Top 10 成本用户 / Top 10 成本账号<br>• Specialist 分项 · 14 个 + 3 自治型<br>• 模型分项 · reasoning / lightweight / image / stt / tts<br>• Provider 分项 · Anthropic / OpenAI / Azure / 文心 / 百度<br>• 单用户日均(对照 ARCHITECTURE §9.12b 估算 $0.45) |
| **关键交互** | • **时间范围** · 任意区间 + 预设(本月 / 上月 / 本季度 / 本年)<br>• **维度切换** · 用户 / Specialist / 模型 / Provider 一键切<br>• **异常告警** · 单用户日 > $5 / 某 Specialist 日成本 > $X / 某模型连续失败<br>• **导出** · CSV(给财务月度对账)+ PDF(月度账单)|
| **鉴权** | • super_admin / admin · 全权<br>• readonly_admin(财务模式)· 仅查 + 导出 |
| **UI 骨架** | • 顶部 · 月度总成本 + 同比 + 环比 + Top 10 用户(横向条形图)<br>• 中部 · 多线折线(分模型 / Specialist · 可切换)+ 饼图(分项)<br>• 底部 · 详细表格(可分组 + 排序 + 导出)<br>• 右侧 · 异常告警栏 |
| **Prisma 新表** | 无需(复用 cost_log + 索引)|

#### 域 ⑤ · 审计日志查询 ★ P0(法务取证生命线)

| 字段 | 内容 |
|---|---|
| **数据来源** | audit_log + admin_audit_log(本架构新增)+ cost_log + feedback_log + history + step_data — **trace_id 全栈贯穿**(ARCHITECTURE:1929)|
| **核心 KPI** | • 日操作量(用户 + admin)<br>• cross_account_query 次数(法务关注)<br>• 异常事件数(login_fail / mfa_fail / privilege_escalation)|
| **关键交互** | • **trace_id 反查** · 输入 trace_id → 一路追溯 · 看到该操作完整链路 ·<br>&nbsp;&nbsp;&nbsp;&nbsp;◦ 用户操作 → tRPC procedure → Specialist → ContextAssembler → LLMGateway → 实际 prompt/response<br>&nbsp;&nbsp;&nbsp;&nbsp;◦ 反馈链路 → feedback_log → 触发 EvolutionAgent → 写入 EvolutionInsight<br>• **用户操作时间线** · 输入 userId → 时间线视图(按事件 category 分类高亮)<br>• **admin 操作审计** · 输入 admin userId → 时间线 + 高风险事件高亮(cross_account_query)<br>• **法务取证导出** · PDF 含 trace_id / 时间戳 / 操作详情 / 上下文 hash(防篡改) |
| **鉴权** | • super_admin · 全权<br>• admin · 仅查自己范围内的 audit_log<br>• readonly_admin(法务模式)· 全权查 + 取证导出 |
| **UI 骨架** | • 顶部 · 数字卡片(日操作量 / cross_account / 异常事件)<br>• 中部 · trace_id 反查输入框 + 时间线视图<br>• 详情 · 抽屉(prompt + response + context · 可折叠)<br>• 底部 · PDF 取证导出按钮 |
| **Prisma 新表** | • `admin_audit_log` ★ 必加(eventType / actorAdminId / targetUserId / targetAccountId / payloadHash / approvalRequestId / ip / ua) — 详见 §4.2 |

#### 域 ⑥ · 邀请码管理 P0

| 字段 | 内容 |
|---|---|
| **数据来源** | invite_codes 表(DATA-MODEL §2.2 已就位)|
| **核心 KPI** | • 待激活邀请码数<br>• 转化率(激活 / 创建)<br>• 各 campaign 效果 · 创建 → 激活 → 9 步完成 → D30 留存 全漏斗 |
| **关键交互** | • **创建** · 单条 + 批量(CSV 导入 + 模板)+ 设置 expiresAt + campaign tag + 分配额度<br>• **列表** · 分页 + 筛选 · 状态(active/used/expired)+ campaign + 创建人<br>• **激活历史** · 谁用了 / 何时 / 来自 IP / 后续 9 步进度<br>• **失效设置** · 一键作废(走 Approval · super_admin)<br>• **campaign 分组** · 创建营销 campaign · 分配邀请码池 · 看转化漏斗 |
| **鉴权** | • super_admin · 全权<br>• admin · 创建 + 失效(走 Approval)<br>• readonly_admin · 仅查 |
| **UI 骨架** | • 顶部 · 待激活 / 转化率 / 各 campaign 数字<br>• 操作栏 · 创建按钮(打开模态)+ 批量导入 + 导出<br>• 中部 · 邀请码大表格<br>• campaign 分组 Tab · 每个 campaign 单独漏斗图<br>• 详情 · 点邀请码 → 抽屉 · 激活历史 + 用户后续 9 步进度 |
| **Prisma 新表** | • `invite_campaigns`(营销 campaign 元数据 · campaign tag → 名称 / 创建人 / 配额 / 起止时间)|

### §3.3 P0 核心域共性观察

#### 共性 1 · 三个跨账号查询(②③⑤)必须走 RLS bypass

域 ②(用户管理列表)、③(IP 账号搜索)、⑤(审计反查)都需要跨账号查全部数据 · 必须通过 `set_config('app.role', 'admin', true)` 走 RLS bypass policy(DATA-MODEL §9.3)+ 写 `cross_account_query` 事件到 admin_audit_log。

#### 共性 2 · 两类高风险操作(②⑥)必走 Approval Gates

- **域 ② 改套餐 / 封禁** · 触及用户权益和资产 · 必走两步审批(申请 + 审批 · 不同人)
- **域 ⑥ 邀请码作废** · 影响营销执行 · 同上

详见 §7.6 高风险动作清单 + Approval Gates 流程。

#### 共性 3 · 财务关心(④)+ 法务关心(⑤)是 readonly_admin 的两个独立子模式

readonly_admin 不是单一角色 · 是 2 个子模式:
- **财务模式** · 看 ① + ④(NSM 数字 + 成本)+ 导出账单
- **法务模式** · 看 ① + ⑤(NSM + 审计)+ 取证导出

详见 §4.3 权限矩阵。

下一节(§3.3 + §3.4)进入 P0 内容审核 2 域 + P1 健康度 5 域 · 这是合规 + 演进生命线。

---

### §3.4 P0 内容审核(2 域)· 法律 + 合规生命线

#### 域 ⑦ · TrendingItem 内容审核 ★ P0(法律风险)

| 字段 | 内容 |
|---|---|
| **数据来源** | trending_items 表(全局共享 · 无 RLS · DATA-MODEL §2.3)+ TrendingScraper 入库队列(BullMQ)+ ARCHITECTURE §9.13b 选定的合规方案 A/B(官方 API 或第三方授权)|
| **核心 KPI** | • 入库待审核数(队列长度)<br>• 已批准 / 已驳回 / 命中违禁词次数<br>• 5 平台来源占比(抖音 / 小红书 / B 站 / 视频号 / 快手)<br>• 自动驳回率 vs 人工驳回率 |
| **关键交互** | • **入库前队列** · 每条 trending 进 review_queue 状态 · 不进 RAG 直到批准<br>• **自动违禁词扫描** · 内置违禁词库(政治 / 暴力 / 色情 / 赌博)+ 命中自动 reject(写理由)<br>• **抽样人工审核** · 自动通过的随机 5% 抽审 · 偏门类目 100% 抽审<br>• **批量批准 / 驳回** · admin 选择多条 + 操作 + 必填理由<br>• **来源平台监控** · 某平台命中违禁率 > 阈值 → 暂停该平台抓取(走 Approval)<br>• **自动下架规则配置** · 已入库的 trending 后续被举报 · 自动下架<br>• **触发 admin 强制人工复审** · 高风险类目(政治 / 名人)100% 人工 |
| **鉴权** | • super_admin · 全权 + 配置规则<br>• admin(审核员模式)· 批准 / 驳回 / 备注<br>• readonly_admin · 仅查 |
| **UI 骨架** | • 顶部 · 待审核数(大数字)+ 5 平台来源饼图 + 命中违禁词数<br>• 操作栏 · 批量批准 / 批量驳回 / 筛选(平台 / 命中状态 / 来源时间)<br>• 中部 · 待审核列表(每条含原 url / 缩略图 / 自动扫描结果高亮)<br>• 详情 · 点开看完整内容(文案 / 视频帧 / 元数据)+ 命中违禁词高亮<br>• 自动规则配置面板 · super_admin 才能改 |
| **Prisma 新表** | • `trending_review_queue`(item_id / status / scan_result / reviewer_id / review_at / reason)<br>• `trending_takedown`(已上架但被下架的记录 · 申诉用)<br>• `auto_review_rules`(自动审核规则 · 违禁词库 / 抽样比例 / 自动驳回阈值)|

> ⚠️ **关键安全设计** · TrendingItem 在入向量库 / 主应用 RAG 检索之前 · **必须通过审核** · 防止违规内容污染 Specialist 输出。这是 P0 法律红线。

#### 域 ⑧ · DeepLearningArchive 审核 ★ P0(用户内容合规)

| 字段 | 内容 |
|---|---|
| **数据来源** | deep_learning_archives 表(per-account · DATA-MODEL §7.1)+ FileParser 解析队列 + 用户上传 ≤20MB(PDF/Word/CSV/MD/TXT)|
| **核心 KPI** | • 上传待审核数<br>• 命中 PII 数(邮箱 / 手机 / 身份证 / 真实姓名)<br>• 命中违禁数(暴力 / 政治 / 商业秘密)<br>• 抽样人审率 / 自动通过率<br>• 用户违规累计(同一用户多次上传违规 → 警告 → 封禁) |
| **关键交互** | • **上传后排队** · 每条进 review_queue · 不解析入向量库直到批准<br>• **自动 PII 扫描** · 邮箱 / 手机号 / 身份证 / 银行卡 自动识别 · 命中 → 阻断 + 用户提示<br>• **违禁词扫描** · 复用域 ⑦ 违禁词库<br>• **抽样人工审核** · 自动通过的随机 10% 抽审<br>• **批准 / 驳回 / 一键下架已入库样本**<br>• **用户违规累计告警** · 单 user 累计违规 ≥ 3 → admin 强制人工复审 + 警告 → ≥ 5 → 自动暂停上传权限(走 Approval) |
| **鉴权** | • super_admin · 全权<br>• admin(审核员模式)· 批准 / 驳回 / 警告 / 暂停<br>• readonly_admin · 仅查 |
| **UI 骨架** | • 顶部 · 待审核 / 命中 PII / 命中违禁 3 大数字<br>• 操作栏 · 批量按钮 + 筛选(状态 / 上传时间 / 用户)<br>• 中部 · 待审核列表(用户 / 文件名 / 大小 / 自动扫描结果)<br>• 详情 · 原文件预览(PDF/Word 嵌入查看 / TXT/MD 高亮违禁)+ 解析后内容 + 命中标记<br>• 用户违规累计 Tab · 高违规用户列表 |
| **Prisma 新表** | • `deep_learn_review_queue`(archive_id / scan_result / status / reviewer_id / reason)<br>• `user_violation_log`(user_id / type / count / last_violation_at)|

> ⚠️ **核心合规要求**(对应 AGENTS §1.4 + §9.11-A 输入护栏 + AGENTS §9.11-D PII 脱敏) · 用户上传内容 → 审核 → 入向量库 · 全程**不能**未审核就被 CopywritingAgent 注入 prompt。这是合规事故防线。

### §3.5 P1 健康度判断(5 域)

#### 域 ⑨ · 进化档案监控 P1

| 字段 | 内容 |
|---|---|
| **数据来源** | evolution_profile + evolution_insight + feedback_log(已就位 · DATA-MODEL §6.3-6.4)|
| **核心 KPI** | • L1-L5 用户分布(饼图)<br>• 飞轮停滞数 · 7 天无新 insight 的账号数<br>• 异常档案数 · insights 矛盾 / styleAdjustments 频繁翻转 / avoidList 突破阈值<br>• 平均升级周期(L1→L2 / L2→L3 / ...)|
| **关键交互** | • **L 分布** · 饼图 + 时间趋势(月度变化)<br>• **飞轮健康度** · 仪表盘 · 绿(正常)/ 黄(停滞)/ 红(冲突)<br>• **异常账号列表** · admin 点详情 · 看 evolution_insight 时间线 · 找冲突点<br>• **强制重新跑批**(走 Approval)· super_admin 才能 · 清空当前 profile + 重跑<br>• **进化档案污染告警** · 检测到 styleAdjustments 翻转 / avoidList 矛盾 → 钉钉 |
| **鉴权** | • super_admin · 全权 + 强制重跑<br>• admin · 查 + 标记<br>• readonly_admin · 仅查 |
| **UI 骨架** | • 顶部 · L 分布饼图 + 飞轮健康度仪表 + 异常账号数<br>• 中部 · 异常账号列表(可筛选 / 排序)<br>• 详情 · evolution_insight 时间线视图(可视化矛盾)<br>• 操作 · 强制重跑按钮(高风险 · Approval)|
| **Prisma 新表** | • `evolution_anomaly_flags`(account_id / anomaly_type / detected_at / resolved_at)|

#### 域 ⑩ · Specialist Prompt 版本管理 P1

| 字段 | 内容 |
|---|---|
| **数据来源** | (新表)`prompt_versions` + LLM Judge 评分输出 + ARCHITECTURE §9.11-E.4 LLM-as-Judge 配置 + PROMPTS.md 14 模板基线 |
| **核心 KPI** | • 14 Specialist 各自当前版本号<br>• 各版本 LLM Judge 评分(对 100 金标准 · 阈值 4.0)<br>• 灰度比例 · 当前 / 上一版分布<br>• 版本变更频率(改 prompt 频率 · 反映迭代速度)|
| **关键交互** | • **Prompt 编辑器** · Monaco 编辑器(语法高亮)+ Diff 对比上一版<br>• **灰度配置** · 0% / 1% / 10% / 50% / 100% 五档(可改) · 按 user_id hash 分流<br>• **自动跑 LLM Judge** · 改 prompt → CI 触发 → 跑 100 金标准 → 评分 → 卡阈值<br>• **A/B 评分对比** · 灰度期间 · 看新旧版本 LLM Judge 评分差<br>• **一键回滚** · super_admin 才能 · 立即切回上一版 + 写 audit |
| **鉴权** | • super_admin · 发布 + 回滚<br>• admin · 编辑 + 提议(必走 Approval Gates 给 super_admin 审)<br>• readonly_admin · 仅查 |
| **UI 骨架** | • 顶部 · 14 Specialist Tab(横向)<br>• 中部 · 当前版本卡片 · 评分 · 灰度比例(进度条)<br>• 编辑器区 · Monaco + Diff 对比<br>• 历史版本时间线 · 每版评分 / 灰度记录 / 操作人<br>• 操作 · 保存(打开 Approval 申请)+ 灰度调整 + 回滚 |
| **Prisma 新表** | • `prompt_versions`(specialist_id / mode / version / content / judge_score / status:draft/active/archived / created_by / created_at / approved_by / approved_at)<br>• `prompt_canary_config`(specialist_id / current_version_id / next_version_id / canary_pct / strategy)|

#### 域 ⑪ · 配额 / 限流管理 P1

| 字段 | 内容 |
|---|---|
| **数据来源** | (新表)`user_quota` + Redis token bucket 状态(LLMGateway 实时)+ ARCHITECTURE §9.11-C 配额定义(Free 50 / Pro 500 / Enterprise 5000)|
| **核心 KPI** | • 各套餐用户数 · 实时使用率分布<br>• 异常用户数(突发流量 / 接近爆配额)<br>• 客服调整次数(临时放配额 / 临时白名单)<br>• 月度配额命中率(被打回的请求 / 总请求)|
| **关键交互** | • **用户配额表** · 列出每个用户的 daily / monthly 用量 + 使用率<br>• **实时使用监控** · 折线图 · 分套餐<br>• **异常告警** · 突发流量(单用户 5 min > 100 调用)→ 钉钉<br>• **手动调整** · 客服可以临时放配额(限定范围 · 单次 ≤ 500 / 24h 自动失效)<br>• **临时白名单** · 加入后 24h 不限流(super_admin 可延长) |
| **鉴权** | • super_admin · 全权<br>• admin(客服模式)· 临时放配额(限定范围 · 走轻 Approval)<br>• readonly_admin · 仅查 |
| **UI 骨架** | • 顶部 · 各套餐用户数 + 实时使用率(仪表盘)<br>• 中部 · 异常用户列表(实时刷新)+ 时间趋势折线<br>• 详情 · 点用户 · 看其 24h 调用时间线 + 手动调整面板<br>• 操作 · 客服调整 / 白名单(快速操作 + 备注必填)|
| **Prisma 新表** | • `user_quota`(user_id / plan / daily_quota / daily_used / monthly_quota / monthly_used / reset_at)<br>• `quota_adjustment_log`(user_id / admin_id / delta / reason / created_at / expires_at)|

#### 域 ⑫ · 行业合规仪表盘 P1

| 字段 | 内容 |
|---|---|
| **数据来源** | audit_log(eventCategory='compliance')+ ARCHITECTURE §9.11-D 行业合规规则(医疗 / 法律 / 金融自动免责 + PII 脱敏)|
| **核心 KPI** | • 今日触发免责声明数(分行业)<br>• 命中违禁词次数<br>• PII 命中率(检测到 / 总解析)<br>• 行业分布(56 行业各自合规事件数)<br>• 合规热点行业(命中频率 Top 5)|
| **关键交互** | • **触发明细列表** · audit_log 内 compliance 事件 · 可筛选(事件类型 / 行业 / 时间)<br>• **行业分布饼图** · 56 行业合规事件占比<br>• **时间趋势** · 分日 / 分周折线<br>• **导出合规报告** · PDF · 给法务月度汇报<br>• **配置免责模板** · super_admin 可改 · 走 Approval |
| **鉴权** | • super_admin · 全权<br>• admin · 查 + 导出<br>• readonly_admin(法务模式)· 全权查 + 取证导出 |
| **UI 骨架** | • 顶部 · 4 数字(免责 / 违禁 / PII / 行业 Top 5)<br>• 中部 · 行业饼图 + 时间趋势折线(并排)<br>• 详情列表 · 可分组(按事件类型 / 行业)<br>• 导出按钮 · PDF 模板带签名页 |
| **Prisma 新表** | (无 · 复用 audit_log + eventCategory='compliance' 索引)|

#### 域 ⑬ · Approval Gates 工作流 P1(★ 横切机制)

| 字段 | 内容 |
|---|---|
| **数据来源** | (新表)`approval_requests` + admin_audit_log + 高风险动作清单(§7.6)|
| **核心 KPI** | • 待审批数<br>• 平均审批时长(申请 → 决策)<br>• 拒绝率(被拒 / 总申请)<br>• 紧急审批 SLA 达成率(< 1h)|
| **关键交互** | • **待审批列表** · 申请人 / 风险等级 / 操作详情 / 申请时间<br>• **详情抽屉** · 操作上下文(将影响哪些数据)+ 影响范围预估 + 申请理由<br>• **批准 / 拒绝** · 必带理由 + 通知申请人(站内信 + 邮件)<br>• **二次审批** · 高风险(封禁 / 跨账号大批量改 / 强制重跑进化档案)需要 2 人审批 · 申请人不能是审批人<br>• **历史决策** · 看以前的同类决策 · 给参考<br>• **紧急审批通道** · 紧急事件(prod 报错)· 1 人快速批 + 后置 24h 复核 |
| **鉴权** | • super_admin · 全权<br>• admin · 看自己提的 · 看属于自己范围的待审批 |
| **UI 骨架** | • 顶部 · 待审批 / 平均时长 / 拒绝率 数字<br>• 中部 · 待审批列表(按风险等级排序)<br>• 详情 · 抽屉(操作详情 + 影响预估 + 历史决策参考)<br>• 操作 · 批准 / 拒绝按钮 + 理由输入<br>• 历史 Tab · 已决策 list |
| **Prisma 新表** | • `approval_requests` ★ 必加(action_type / risk_level / requester_admin_id / target_payload / status:pending/approved/rejected/expired / approver_admin_id / decision_reason / created_at / decided_at) — 详见 §4.4 |

> ⚠️ **域 ⑬ 是横切机制** · 域 ② / ⑥ / ⑦ / ⑧ / ⑨ / ⑩ / ⑪ / ⑫ / ⑮ 的高风险操作都通过域 ⑬ 走两步审批。这是 admin 安全的核心闸门(对应 knowledge-base ADR-016 Approval Gates)。

### §3.6 P0 内容审核 + P1 健康度小结

本节(§3.4 + §3.5)答 4 件事:
1. **2 个 P0 内容审核域**(⑦⑧)是法律 / 合规生命线 · 入库 + 入向量库前必审核
2. **5 个 P1 健康度域**(⑨-⑬)解决"产品演进 + 质量保障"
3. **域 ⑬ Approval Gates 是横切机制** · 不仅本身是一域 · 还服务其他 8 域的高风险操作
4. **本批次 9 域共需新加 11 张 Prisma 表**(详见 §4 数据访问与隔离)

下一节(§3.6)进入 P2 后续版本 3 域 · 然后 §4 + §5 进入数据访问与隔离 + 接口契约。

---

### §3.7 P2 后续版本(3 域)

> P2 域不在 P9.0-P9.3 范围内 · 排到 P9.4 或后续版本。但**架构骨架**先占位 · 避免后期打补丁。

#### 域 ⑭ · A/B 测试管理 P2

| 字段 | 内容 |
|---|---|
| **数据来源** | (新表)`ab_experiments` + `ab_assignments` + 复用 feedback_log + cost_log |
| **核心能力** | • 灰度发布(prompt / UI / 规则)<br>• 漏斗对比(A 组 vs B 组的 9 步完成率)<br>• 显著性检验(简单 t-test 起步)<br>• 实验时间线 + 自动停损(B 组指标恶化超阈值自动回滚) |
| **鉴权** | super_admin · admin(走 Approval) |
| **优先级** | 🟡 P2 · 跟域 ⑩ Prompt 版本管理后落地(域 ⑩ 已含简单 A/B) |

#### 域 ⑮ · 知识库 / 静态常量管理 P2

| 字段 | 内容 |
|---|---|
| **数据来源** | `lib/constants/*`(56 行业 / 22 元素 / 20 脚本 / 14 形式 / 6 阶段)+ knowledge_cases_vec / formulas_vec / elements_vec(向量库)|
| **核心能力** | • 67 案例 / 23 公式 / 22 元素的 CRUD<br>• 改动后入向量库(走 Approval · embed 重跑)<br>• 行业 / 平台 / 脚本类型新增 · 影响 prompt → 跑 LLM Judge<br>• 版本化(像域 ⑩ Prompt 一样)|
| **鉴权** | super_admin · admin(走 Approval) |
| **优先级** | 🟡 P2 · 改动频率低(常量级 30KB · 半年级别更新一次) |

#### 域 ⑯ · 系统配置中心 P2

| 字段 | 内容 |
|---|---|
| **数据来源** | (新表)`feature_flags` + `system_config` + .env 同步 |
| **核心能力** | • Feature flags · 按用户 / 套餐 / 行业灰度开关<br>• 环境变量 · 运行时改(慎用 · 必走 Approval)<br>• 紧急开关 · 一键停 trending 抓取 / 一键停 EvolutionAgent / 一键启用降级 prompt<br>• 配置变更审计 |
| **鉴权** | super_admin · 紧急开关 admin 也可(走轻 Approval · 1 人 + 后置复核)|
| **优先级** | 🟡 P2 · 上线后随事故经验积累 |

### §3.8 16 业务管理域汇总

| 优先级 | 数量 | 域 # | 关键定位 |
|:-:|:-:|---|---|
| 🔴 **P0 业务核心** | 6 | ①运营NSM ②用户 ③IP账号 ④成本 ⑤审计 ⑥邀请码 | 运营 / 财务 / 法务 / 客服日常 |
| 🔴 **P0 内容审核** | 2 | ⑦TrendingItem ⑧DeepLearning | 法律 / 合规生命线 |
| 🟠 **P1 健康度** | 5 | ⑨进化档案 ⑩Prompt版本 ⑪配额 ⑫合规 ⑬Approval | 产品演进 + 安全闸门 |
| 🟡 **P2 后续** | 3 | ⑭A/B ⑮常量 ⑯配置中心 | 高级能力 |
| **合计** | **16** | — | — |

> 跟 ARCHITECTURE-REVIEW.md §5.2 列的 13+ 域对齐(实际 16 个 · 含 3 个 P2 后续) · 全部下放到 §8 实施路线图 P9 系列。

---

## §4 数据访问与隔离(跟主应用的安全边界)

### §4.1 admin 跨账号查询走单独 RLS policy

> 主应用走"账号隔离 RLS"(DATA-MODEL §9.2 已就位 · 12 张表) · admin 通过设置 `app.role='admin'` 走 bypass policy。

```sql
-- 已就位(DATA-MODEL §9.3 · L2185-2189)
CREATE POLICY admin_full_access_step_data ON step_data
  FOR SELECT
  USING (current_setting('app.role', true) = 'admin');

-- 类似复制到所有 12 张带 RLS 的表
-- · histories · topics · assets · diagnosis_reports
-- · feedback_logs · evolution_profiles · evolution_insights
-- · deep_learning_archives · knowledge_favorites · knowledge_notes
-- · daily_tasks · ip_accounts(本架构补 · 主应用 DATA-MODEL 没列)
```

**应用层 admin tRPC procedure 走 admin middleware**(DATA-MODEL §9.3 L2195-2205 已就位):

```typescript
// apps/api/src/middleware/admin-rls.ts
export const adminRLS = middleware(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  // 设 admin 上下文 · LOCAL · 仅当前事务有效
  await prisma.$executeRaw`SELECT set_config('app.role', 'admin', true)`;

  // ★ 写 admin_audit_log · cross_account_query 事件
  await admin_audit.log({
    eventType: 'cross_account_query',
    actorAdminId: ctx.user.id,
    target: ctx.input,
    ip: ctx.ip,
    ua: ctx.userAgent,
  });

  return next({ ctx: { ...ctx, isAdmin: true } });
});
```

### §4.2 admin_audit_log 独立审计表(★ 必加)

> 跟用户 audit_log 分开 · 让 admin 操作的审计独立可追溯。

```prisma
// prisma/schema.prisma · 新加
model AdminAuditLog {
  id                  Int          @id @default(autoincrement())

  /// 谁(admin · 不是 user)
  actorAdminId        Int
  actorRole           String       // 'super_admin' | 'admin' | 'readonly_admin'
  actorMode           String?      // 'cs' | 'reviewer' | 'finance' | 'legal' | null

  /// 什么事件
  eventCategory       String       // 'auth' | 'data_query' | 'data_mutation' |
                                   // 'cross_account_query' | 'high_risk_action' |
                                   // 'config_change' | 'export'
  eventType           String       // 'admin_login' / 'mfa_check' /
                                   // 'cross_account_query' / 'change_user_plan' /
                                   // 'ban_user' / 'force_evolution_rebuild' /
                                   // 'invalidate_invite_code' /
                                   // 'change_quota' / ...

  /// 影响谁
  targetUserId        Int?
  targetAccountId     Int?
  targetEntity        String?      // 'user' / 'ip_account' / 'invite_code' / ...
  targetEntityId      String?

  /// 操作详情
  payloadHash         String       // 操作 payload 的 hash · 防篡改
  payload             Json?        // 操作详情(可被审计 · 不含敏感数据)

  /// 关联 Approval Gates
  approvalRequestId   Int?         // 如果是高风险操作 · 关联 Approval

  /// trace
  traceId             String       @db.VarChar(64)

  /// 上下文
  ip                  String       @db.VarChar(45)  // IPv4/IPv6
  userAgent           String       @db.VarChar(500)
  sessionId           String       @db.VarChar(64)

  /// 结果
  success             Boolean      @default(true)
  errorCode           String?
  errorMessage        String?

  createdAt           DateTime     @default(now())

  @@index([actorAdminId, createdAt(sort: Desc)])
  @@index([eventCategory, createdAt(sort: Desc)])
  @@index([eventType, createdAt(sort: Desc)])
  @@index([targetUserId, createdAt(sort: Desc)])
  @@index([targetAccountId, createdAt(sort: Desc)])
  @@index([traceId])
  @@index([approvalRequestId])
  @@index([createdAt(sort: Desc)])
}
```

**与用户 audit_log 的关系**:
- 主应用用户操作 → `audit_log` 表(已有)
- admin 操作 → `admin_audit_log` 表(本架构新加)
- **法务取证场景** · 输入 trace_id · 两表都查 · 完整看到一次事件链(用户操作 → 触发了 admin 介入 → admin 处理 → 用户后续操作)

### §4.3 三档角色权限矩阵

```
                        super_admin  admin   admin     admin     readonly  readonly
                                            (cs)      (审核)   (财务)   (法务)
─────────────────────────────────────────────────────────────────────────────────────
域 ① NSM 仪表盘             查        查      查         查        部分查    查
域 ② 用户管理               全        改/Apr  查/备注    -         -         -
域 ③ IP 账号管理            全        查/Apr  查/备注    标记异常  -         -
域 ④ 成本仪表盘             全        查      -          -         查/导出   -
域 ⑤ 审计日志查询           全        查自范围  查反查   -         -         全/取证导出
域 ⑥ 邀请码管理             全        创建/Apr -         -         -         -
域 ⑦ TrendingItem 审核      全        -        -         全        -         -
域 ⑧ DeepLearning 审核      全        -        -         全        -         -
域 ⑨ 进化档案监控           全/Apr    查       -         -         -         -
域 ⑩ Prompt 版本管理        全        编辑/Apr -         -         -         -
域 ⑪ 配额管理               全        临时调/Apr 临时调  -         -         -
域 ⑫ 行业合规仪表盘         全        查/导出  -         -         -         全/取证
域 ⑬ Approval Gates 工作流  审批      申请+审  -         -         -         -
域 ⑭ A/B 测试               全/Apr    查       -         -         -         -
域 ⑮ 常量管理               全/Apr    -        -         -         -         -
域 ⑯ 系统配置中心           全        紧急/轻Apr -       -         -         -

  Apr = 必走 Approval Gates · 轻 Apr = 1 人 + 后置复核
  - = 该角色 / 模式无该域权限
```

**角色定义补充**:

| 角色 | 子模式 | 范围 | OAuth 限制 |
|---|---|---|---|
| super_admin | (无)| 全权 + Approval 审批方 | Workspace + 强制 MFA + IP 白名单 |
| admin | cs(客服)/ reviewer(审核员)/(默认)| 按子模式开放权限 | Workspace + 推荐 MFA + IP 白名单 |
| readonly_admin | finance(财务)/ legal(法务)| 仅查 + 导出 | Workspace + IP 白名单 |

### §4.4 高风险操作走 Approval Gates(对应 ADR-016)

```
高风险动作清单(必走 Approval Gates · 含 §4.3 标 "Apr"):
─────────────────────────────────────────────────────────
  ① 域 ② · 改用户套餐(降级)
  ② 域 ② · 封禁用户
  ③ 域 ⑥ · 作废邀请码(批量 ≥ 10 条)
  ④ 域 ⑦⑧ · 自动审核规则配置变更
  ⑤ 域 ⑨ · 强制重跑某账号 EvolutionAgent
  ⑥ 域 ⑩ · 发布新 Prompt 版本(灰度 > 10%)
  ⑦ 域 ⑩ · Prompt 一键回滚(prod 影响)
  ⑧ 域 ⑪ · 长期放配额(> 24h)
  ⑨ 域 ⑪ · 修改套餐配额定义
  ⑩ 域 ⑫ · 改免责模板
  ⑪ 域 ⑭ · 启动 / 停止 A/B 实验
  ⑫ 域 ⑮ · 修改静态常量(影响 prompt)
  ⑬ 域 ⑯ · 改 feature flag 影响 ≥ 10% 用户
  ⑭ 域 ⑯ · 紧急关闭 trending / EvolutionAgent

二次审批(2 人 · 申请人 ≠ 审批人):
─────────────────────────────────────────────────────────
  ① 跨账号大批量改(≥ 100 账号)
  ② 强制重跑 ≥ 10 账号 EvolutionAgent
  ③ Prompt 版本 100% 灰度发布
  ④ 改 feature flag 影响 ≥ 50% 用户

紧急通道(1 人 + 后置 24h 复核):
─────────────────────────────────────────────────────────
  ① 紧急止损(prod 报错 · 停 trending / 停 EvolutionAgent / 启用降级 prompt)
  ② 临时白名单(单账号 · 24h 内自动失效)
```

**Approval Gates 工作流示意**:

```
admin 申请操作
       ↓
   adminRouter procedure
       ↓
   approvalGateCheck middleware
       ↓
   是否高风险?
   ├── 否 → 直接执行
   └── 是 → 写 approval_requests(status=pending)
                  + 触发审批人通知(钉钉/Slack)
                  ↓
              审批人决策
              ├── 批准 → 状态=approved
              │           → 异步执行原操作
              │           → 写 admin_audit_log(approvalRequestId)
              │           → 通知申请人
              └── 拒绝 → 状态=rejected
                          → 不执行
                          → 通知申请人(含拒绝理由)
                          → 写 admin_audit_log
```

```prisma
// prisma/schema.prisma · 新加
model ApprovalRequest {
  id                  Int          @id @default(autoincrement())

  /// 谁申请
  requesterAdminId    Int
  requesterRole       String

  /// 申请什么
  actionType          String       // 'change_user_plan' / 'ban_user' / ...
  actionPayload       Json         // 完整操作 payload(给审批人看)
  actionContext       Json?        // 上下文(影响范围预估)
  riskLevel           String       // 'low' | 'medium' | 'high' | 'critical'
  requireDualApproval Boolean      @default(false)
  isEmergency         Boolean      @default(false)

  /// 申请理由
  requesterReason     String       @db.Text

  /// 决策
  status              String       // 'pending' | 'approved' | 'rejected' |
                                   // 'expired' | 'auto_executed' | 'cancelled'
  approverAdminId     Int?
  decisionReason      String?      @db.Text
  secondApproverAdminId Int?       // 二次审批
  secondDecisionReason String?     @db.Text

  /// 时间
  createdAt           DateTime     @default(now())
  decidedAt           DateTime?
  expiresAt           DateTime     // 默认 + 24h
  executedAt          DateTime?
  postReviewAt        DateTime?    // 紧急通道后置复核

  @@index([status, createdAt(sort: Desc)])
  @@index([requesterAdminId, createdAt(sort: Desc)])
  @@index([approverAdminId])
  @@index([riskLevel, status])
}
```

### §4.5 数据访问与隔离小结

本节答 4 件事:
1. **admin 跨账号查走 RLS bypass policy**(已在 DATA-MODEL §9.3 就位 · 本架构扩展应用)
2. **admin_audit_log 独立审计表** · 跟用户 audit_log 分开 · 法务取证可两表关联查
3. **三档角色 + 4 子模式权限矩阵** · 16 域 × 6 角色完整定义
4. **14 类高风险操作 + 4 类二次审批 + 2 类紧急通道** · 配套 ApprovalRequest 表 schema 完整

---

## §5 接口契约(adminRouter)

### §5.1 adminRouter 跟 appRouter 并列的 tRPC 树

```typescript
// apps/api/src/trpc/router.ts
export const router = t.router({
  // 主应用 · 给 apps/web 用
  app: appRouter,         // 13 子树 · 50+ procedure(ARCHITECTURE §3.2)

  // 管理后台 · 给 apps/admin 用 ★ 新增独立树
  admin: adminRouter,     // 14 子树 · 80+ procedure
});

// apps/api/src/trpc/routers/admin/_router.ts
export const adminRouter = t.router({
  // 16 业务管理域分别一棵子树
  ops: opsRouter,                  // 域 ① NSM 仪表盘
  users: usersAdminRouter,         // 域 ② 用户管理
  accounts: accountsAdminRouter,   // 域 ③ IP 账号
  cost: costRouter,                // 域 ④ 成本
  audit: auditRouter,              // 域 ⑤ 审计
  invites: invitesAdminRouter,     // 域 ⑥ 邀请码
  reviewTrending: reviewTrendingRouter,    // 域 ⑦ TrendingItem 审核
  reviewDeepLearn: reviewDeepLearnRouter,  // 域 ⑧ DeepLearning 审核
  evolution: evolutionAdminRouter, // 域 ⑨ 进化监控
  prompts: promptsRouter,          // 域 ⑩ Prompt 版本
  quota: quotaRouter,              // 域 ⑪ 配额
  compliance: complianceRouter,    // 域 ⑫ 合规仪表盘
  approval: approvalRouter,        // 域 ⑬ Approval Gates
  ab: abRouter,                    // 域 ⑭ A/B(P2)
  knowledge: knowledgeAdminRouter, // 域 ⑮ 常量管理(P2)
  config: configRouter,            // 域 ⑯ 配置中心(P2)
});
```

### §5.2 命名规范

```
admin.<domain>.<action>

例:
  admin.users.list            · 列出用户(分页 + 筛选)
  admin.users.detail          · 用户详情
  admin.users.banUser         · 封禁(必走 Approval)
  admin.cost.monthlyReport    · 月度成本报告
  admin.audit.traceLookup     · trace_id 反查
  admin.reviewTrending.queue  · 待审核队列
  admin.approval.list         · 我审批的列表
  admin.approval.decide       · 批准 / 拒绝
```

**禁止做的事**(LD-admin):
- ❌ 跨树调用(`adminRouter` 不能调 `appRouter` 的 procedure · 反之亦然)
- ❌ admin procedure 不带 `adminRLS` middleware(每个 procedure 必须挂)
- ❌ 高风险 procedure 不走 `approvalGateCheck` middleware

### §5.3 鉴权链(每个 admin procedure 必经 5 闸)

```typescript
// apps/api/src/trpc/admin-procedure.ts
export const adminProcedure = t.procedure
  .use(adminAuth)            // 闸 1 · OAuth + Workspace + Session
  .use(roleCheck)            // 闸 2 · role >= admin
  .use(ipWhitelist)           // 闸 3 · IP in whitelist
  .use(mfaCheck)              // 闸 4 · super_admin 必带 MFA
  .use(adminRLS)              // 闸 5 · set app.role='admin' + 写 admin_audit_log
  .use(approvalGateCheck);    // 闸 6 · 高风险 → 检查 / 触发 Approval

export const superAdminProcedure = adminProcedure
  .use(superAdminCheck);      // 闸 7 · role === 'super_admin'

export const readonlyAdminProcedure = t.procedure
  .use(adminAuth)
  .use(roleCheck({ minimum: 'readonly_admin' }))
  .use(ipWhitelist)
  .use(adminRLS);             // readonly · 不需要 mfaCheck / approvalGateCheck
```

### §5.4 跟主 router 的关系

| 关系 | 状态 |
|---|---|
| 是否复用主 procedure? | ❌ 不复用(独立 procedure 树)|
| 是否复用主 middleware? | ✅ 部分(`logger / traceId / pino` 共享)|
| 是否复用主 service 层? | 🟡 部分(只读复用 · 写不复用)|
| 主端能否调 admin procedure? | ❌ 严禁(防止 admin 接口被普通用户绕过)|
| admin 端能否调主 procedure? | ❌ 不调(admin 自己的逻辑独立)|

**严格分离的工程价值**:
- ✅ 安全审计简化 · grep `adminRouter` 就能看到所有 admin 入口
- ✅ 测试套件分离 · `tests/admin/` 独立用例
- ✅ 未来想拆出独立 admin-api 微服务时 · 直接抽离 `adminRouter`

下一节(§6)进入前端架构 · 讲 apps/admin SPA 怎么搭 + 13 路由组 + 数据可视化栈。

---

## §6 前端架构(apps/admin SPA)

### §6.1 设计系统(复用 Aurelian Dark + admin 密度)

> **决策 5 = A** · 复用主应用 base tokens · 加 admin 专属密度组件。

**复用主应用**(`packages/ui/base/`):
- ✅ Surface 7 档(#0e0e11 → #39393c)
- ✅ Primary Gold(#f2ca50 / #d4af37 / #ffe088 / #e9c349)
- ✅ Tertiary / Error / Outline tokens
- ✅ Manrope / Plus Jakarta Sans / Inter 三字体
- ✅ 4px Rule 间距体系
- ✅ 圆角 / 边框光阴影 / 焦点 Glow 规则
- ✅ 5 核心动效(light-sweep / gold-glow-pulse / card-lift / fade-in-up / shimmer)

**admin 专属补强**(`packages/ui/admin/`):

| 调整 | 主应用值 | admin 值 | 理由 |
|---|---|---|---|
| **基础间距** | md=16px / lg=24px | md=12px / lg=16px | 数据密度 · 单屏看更多信息 |
| **行高** | leading-relaxed | leading-tight | 表格 / 列表更紧凑 |
| **文字大小** | body-md=16px | body-md=14px | 信息密度 |
| **金色 Glow** | 软晕 5% 透明度 | 不用 / 仅焦点态 | admin 是工作场所 · 不要装饰 |
| **动效时长** | ≤ 600ms | ≤ 200ms | 操作反馈要快 |
| **配色** | 偶尔金色高亮 | 增加冷色调(#3b82f6 蓝 + #10b981 绿 + #ef4444 红)| 数据可视化必须有标准语义色 |
| **图标** | 1.5/2px stroke 装饰 | 1.5px stroke + filled(状态)| 状态图标用 filled 更清晰 |

> ⚠️ **不破坏 Aurelian Dark 美学** — admin 仍然是深色 + 暖灰白 + 编辑感字体 · 但**信息密度提升 30-40%**。参考样本:Linear / Vercel Dashboard / Stripe Dashboard(都是深色 + 高密度)。

### §6.2 layout(全局骨架)

```
┌────────────────────────────────────────────────────────────────────┐
│  topbar · 56px(深色 #0e0e11)                                      │
│  ├─ logo(QuanAn admin)│ breadcrumb         │ search │ admin avatar│
└────────────────────────────────────────────────────────────────────┘
┌────────────────┬─────────────────────────────────────┬─────────────┐
│ sidebar · 240px│ main · flex-1                        │ audit drawer│
│ (#131316)      │                                      │  · 实时显示 │
│                │  ┌────────────────────────────────┐  │  · 当前 admin│
│ ┌────────────┐ │  │ 业务管理域内容                  │  │   操作 trace│
│ │ 业务核心    │ │  │ (NSM / 用户 / 账号 / ...)      │  │  · 默认折叠 │
│ │ ① NSM      │ │  │                                │  │  · 点开后    │
│ │ ② 用户      │ │  │                                │  │   500ms     │
│ │ ③ 账号      │ │  │                                │  │   滑出      │
│ │ ④ 成本      │ │  │                                │  │             │
│ │ ⑤ 审计      │ │  │                                │  │             │
│ │ ⑥ 邀请码    │ │  │                                │  │             │
│ └────────────┘ │  │                                │  │             │
│ ┌────────────┐ │  │                                │  │             │
│ │ 内容审核    │ │  │                                │  │             │
│ │ ⑦ Trending │ │  │                                │  │             │
│ │ ⑧ DeepLearn│ │  │                                │  │             │
│ └────────────┘ │  └────────────────────────────────┘  │             │
│ ┌────────────┐ │                                      │             │
│ │ 演进与质量  │ │                                      │             │
│ │ ⑨ 进化      │ │                                      │             │
│ │ ⑩ Prompt   │ │                                      │             │
│ │ ⑪ 配额      │ │                                      │             │
│ │ ⑫ 合规      │ │                                      │             │
│ │ ⑬ Approval │ │                                      │             │
│ └────────────┘ │                                      │             │
│ ┌────────────┐ │                                      │             │
│ │ 高级(P2)   │ │                                      │             │
│ │ ⑭ A/B      │ │                                      │             │
│ │ ⑮ 常量      │ │                                      │             │
│ │ ⑯ 配置      │ │                                      │             │
│ └────────────┘ │                                      │             │
└────────────────┴─────────────────────────────────────┴─────────────┘
                  └─ status bar(底部 32px)
                     │ admin: alice@quanan │ role: admin │ session 28m │
                     │ pending approvals: 3 │ alerts: 1   │ (钉钉链接) │
```

**核心组件**(`packages/ui/admin/`):
- `<AdminTopbar />`(logo / breadcrumb / search / avatar dropdown)
- `<AdminSidebar />`(13/16 路由组 · 4 group · 折叠 / 展开 · 当前域高亮)
- `<AdminAuditDrawer />`(右侧抽屉 · 实时 admin 自己的 trace · 法务审计场景下可"挂载到屏幕")
- `<AdminStatusBar />`(底部 · admin 信息 + 待办 + 告警)
- `<AdminBreadcrumb />`(自动从路由生成)

### §6.3 13 路由组(对应 16 业务管理域)

> 路由跟 §3 业务管理域一一对应 · 但 P2 域(⑭⑮⑯)在 P9.4 后才暴露 · MVP 时仅 13 路由可见。

```
admin.quanan.com/(根 = NSM 仪表盘 · 默认页)
                  /                            → 域 ① NSM
                  /users                       → 域 ② 用户管理
                  /users/:userId              → 用户详情
                  /accounts                    → 域 ③ IP 账号
                  /accounts/:accountId        → IP 账号详情
                  /cost                        → 域 ④ 成本仪表盘
                  /cost/export                → 导出账单
                  /audit                       → 域 ⑤ 审计日志查询
                  /audit/trace/:traceId       → trace 反查
                  /invites                     → 域 ⑥ 邀请码管理
                  /invites/campaigns          → campaign 分组
                  /review/trending            → 域 ⑦ TrendingItem 审核队列
                  /review/trending/rules     → 自动审核规则配置
                  /review/deep-learn          → 域 ⑧ DeepLearning 审核队列
                  /review/violations          → 用户违规累计
                  /evolution                   → 域 ⑨ 进化档案监控
                  /evolution/anomalies        → 异常账号
                  /prompts                     → 域 ⑩ Prompt 版本管理(14 Specialist tab)
                  /prompts/:specialistId      → 单 Specialist 版本时间线
                  /quota                       → 域 ⑪ 配额管理
                  /quota/adjustments          → 调整记录
                  /compliance                  → 域 ⑫ 行业合规仪表盘
                  /compliance/export          → 法务取证导出
                  /approval                    → 域 ⑬ Approval Gates
                  /approval/:requestId        → 审批详情
                  /approval/history           → 历史决策

  P9.4 后扩展:
                  /ab                          → 域 ⑭ A/B 测试
                  /knowledge                   → 域 ⑮ 常量管理
                  /config                      → 域 ⑯ 系统配置
                  /config/feature-flags       → Feature flags
                  /config/emergency           → 紧急开关
```

### §6.4 数据可视化栈

> admin 跟主应用最大不同 · **大量数据可视化**。选 1 个核心库 + 1 个表格库。

| 类别 | 推荐 | 备选 | 理由 |
|---|---|---|---|
| **图表** | **Recharts**(基于 Chart.js · React 生态主流) | ECharts / antv g2 / nivo | Recharts 跟 React 生态契合 · 体积小 · API 简单 · 满足 80% 场景 |
| **表格** | **TanStack Table v8** | AG Grid(商用)| TanStack Table 是 React 表格事实标准 · 支持虚拟滚动 / 列筛选 / 列拖拽 / 导出 / 排序 / 分组 · 完全可控样式 |
| **日期 / 时间** | **dayjs + react-day-picker** | date-fns | 体积小 · 跟 shadcn 生态一致 |
| **导出** | **xlsx**(SheetJS · 社区版)+ jsPDF(PDF 取证) | — | 财务 CSV/Excel + 法务 PDF 必备 |
| **代码编辑器**(域 ⑩)| **@monaco-editor/react** | CodeMirror | 支持 Diff 模式 · 跟 VSCode 一致 |
| **Markdown 渲染**(域 ⑩ Prompt 编辑)| **react-markdown + remark-gfm** | — | 复用主应用同款 |

### §6.5 表格(高频组件)

> admin 几乎每个页面都是"列表 + 筛选 + 详情" — 表格组件必须做到极致。

```typescript
// packages/ui/admin/AdminTable.tsx
export function AdminTable<T>({
  data,
  columns,
  pagination,
  filters,
  selection,
  onRowClick,
  onExport,
  density = 'compact',  // 'comfortable' | 'compact' | 'dense'
}: AdminTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowSelectionModel: getRowSelectionModel(),
  });

  // 虚拟滚动(>1000 行启用)
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => density === 'compact' ? 36 : 48,
  });

  return (
    <div>
      <AdminTableHeader filters={filters} onExport={onExport} />
      <div ref={tableContainerRef} className="h-[600px] overflow-auto">
        {/* 列拖拽 + 排序 + 筛选 + 选择 */}
      </div>
      <AdminTablePagination pagination={pagination} />
    </div>
  );
}
```

**表格能力清单**:
- ✅ 虚拟滚动(>1000 行)
- ✅ 列宽拖拽 · 列顺序拖拽 · 列固定(左 / 右)
- ✅ 单列 / 多列排序 · 单列筛选(支持多类型:文本 / 数字范围 / 日期 / 枚举)
- ✅ 行选择(单 / 多 / 全)+ 批量操作
- ✅ 行点击 → 详情抽屉(默认行为)
- ✅ 导出 CSV / Excel(全部 / 选中 / 当前筛选)
- ✅ 密度 3 档(comfortable / compact / dense)

### §6.6 详情抽屉(admin UX 核心模式)

> admin 的"列表 → 详情"不用页面跳转 · 用**右侧抽屉** · 速度快 · 不丢列表上下文。

```typescript
// packages/ui/admin/AdminDetailDrawer.tsx
<AdminDetailDrawer
  open={selectedRow !== null}
  onClose={() => setSelectedRow(null)}
  title={`用户详情 · ${selectedRow?.email}`}
  width={720}
  tabs={[
    { id: 'basic', label: '基本信息', component: <UserBasicTab /> },
    { id: 'activity', label: '活跃度', component: <UserActivityTab /> },
    { id: 'cost', label: '成本', component: <UserCostTab /> },
    { id: 'audit', label: '审计', component: <UserAuditTab /> },
    { id: 'accounts', label: '关联账号', component: <UserAccountsTab /> },
  ]}
  actions={[
    { label: '改套餐', onClick: openChangePlan, variant: 'default', requiresApproval: true },
    { label: '封禁', onClick: openBanUser, variant: 'destructive', requiresApproval: true, role: 'super_admin' },
  ]}
/>
```

### §6.7 admin 操作的 UI 反馈(★ 安全相关)

> 每次 admin 操作 · UI 必须明确反馈"这次操作的影响范围 + 是否走 Approval"。

**3 类操作的 UI 模式**:

| 类型 | UI 反馈 |
|---|---|
| **直接执行**(读 / 看)| Toast:操作成功 |
| **走 Approval**(改套餐 / 封禁等)| Modal:**确认提交审批** + 影响范围预估 + 申请理由必填 + 提交后 Toast:已提交审批,等待 super_admin 审核 |
| **紧急操作**(紧急止损)| Modal:**警告 · 紧急操作** + 红色边框 + "此操作 1 人即可执行 · 但会触发 24h 后置复核 · 是否继续" + 二次输入"确认"才生效 |

### §6.8 状态管理 + 数据获取

```
Zustand · 全局轻量状态
  ├─ adminUser(当前 admin · role · mode · session)
  ├─ adminUI(layout 偏好 · sidebar 折叠 · drawer 状态)
  └─ adminFilters(各页面筛选参数 · 持久化到 localStorage)

React Query(via tRPC client) · 服务端状态
  ├─ 每个 admin.<domain>.<action> 自动缓存
  ├─ staleTime: 30s(默认 · 数据稍微旧无所谓)
  ├─ refetchInterval: NSM 仪表盘 30s · 其他不自动刷
  └─ optimistic update · 简单操作(不走 Approval 的)用 optimistic
```

### §6.9 前端架构小结

本节答 7 件事:
1. **复用 Aurelian Dark base · 加 admin 密度补强**(间距 / 字号 / 配色 / 动效全部紧凑化)
2. **layout** · topbar + sidebar(13/16 域 4 group)+ main + audit drawer + status bar
3. **13 路由组** · 跟业务管理域一一对应 · P2 后续暴露
4. **可视化栈** · Recharts + TanStack Table + dayjs + xlsx + Monaco
5. **表格组件**是 admin 高频元素 · 必须做到极致(虚拟滚动 + 多筛 + 导出 + 3 档密度)
6. **详情抽屉模式** · 列表点击不跳页面 · 右侧抽屉 + 多 Tab
7. **3 类操作 UI 反馈** · 直接执行 / Approval / 紧急 · 安全感知到位

---

## §7 鉴权 + 审计 + 安全

### §7.1 admin OAuth 应用(独立)

> 跟 §2.3 部署形态对应 · 这里展开技术细节。

```
OAuth Provider · Google Workspace
─────────────────────────────────────────────────
  client_id     · QUANQN_ADMIN_CLIENT_ID(独立申请 · 不复用主应用 client)
  client_secret · 存 .env.admin · 不进 git
  redirect_uri  · https://admin.quanan.com/auth/callback
  scope         · openid email profile
  
  额外限制 ·
    ① Workspace 限定 · hd=quanan.com(只允许 @quanan.com 邮箱登录)
    ② 邮箱白名单二次过滤 · 白名单存 admin_users 表 · 不在白名单 → 403
    ③ 首次登录 · 创建 admin user 记录 + role=待分配 + 通知 super_admin

实现库 · lucia-auth(轻量 · 跟主应用同款)
  · 独立 admin session store(Redis 独立 namespace · admin:session:*)
  · session ttl 12h(短于主应用 30 天)
  · idle timeout 30min(无操作自动登出)
```

### §7.2 IP 白名单(WAF 层)

```
WAF 层 · Cloudflare(推荐)/ Vercel Edge / 自管 nginx
─────────────────────────────────────────────────
  允许的 IP 段:
    ① 公司办公网络 IP 段(从公网出口看到的 office IP)
    ② 公司 VPN 出口 IP(WireGuard / OpenVPN gateway)
    ③ super_admin 个人备用 IP(动态 · 通过钉钉 bot 临时加白)

  违反白名单 · 直接 403(连 OAuth 页面都不显示)
  
  钉钉 bot 临时白名单 ·
    super_admin 在外地紧急处理 · 钉钉私信 bot:"加白 1.2.3.4 · 紧急止损"
    bot 校验签名 + 写 admin_audit_log + 加白(2h 自动失效)
```

> 🟢 **为什么必须在 WAF 层** · 应用层(rls / middleware)只能挡 OAuth 之后的请求 · 但 OAuth 登录页本身就是攻击面(钓鱼 / 暴力破解)· WAF 层挡才能从根上隔离。

### §7.3 MFA(super_admin 强制 · 决策 4=B)

```
super_admin · 强制(决策 4=B)
─────────────────────────────────────────────────
  注册时 · 必绑 TOTP(Google Authenticator 等)或 WebAuthn(YubiKey 等)
  登录时 · OAuth 通过 + MFA 通过 = 才能进
  30 天 · 强制重新 MFA 一次(不是每次登录都问 · 体验跟安全平衡)
  失败 3 次 · 锁账号 30 min · 钉钉告警

admin · 推荐(可选 · 但建议)
─────────────────────────────────────────────────
  注册时 · 提示绑定(可跳过)
  登录时 · 已绑 → 必带 / 未绑 → 不带
  绑定后才能解锁某些"准高风险"操作(临时调配额 > 50%)

readonly_admin · 不强制
─────────────────────────────────────────────────
  仅查 + 导出 · MFA 可选
```

> ⚠️ **决策 4 为什么选 B 而不是 A**(全部强制) · 内部团队 admin 角色可能多至 10-20 人(产品/运营/审核员/客服)· 全部强制 MFA 上手成本高 + 容易"破窗"(用户找回账号麻烦 → 借同事账号用)。**super_admin 才是最高风险面 · 必须强制**。

### §7.4 异常登录告警(实时)

```
异常事件清单(检测到立即推钉钉/Slack):
─────────────────────────────────────────────────
  ① OAuth 失败 ≥ 3 次(同一 IP / 5 min)
  ② MFA 失败 ≥ 3 次
  ③ 非白名单 IP 触达(WAF 已挡 · 但记录)
  ④ super_admin 在非典型时间登录(深夜 02:00-06:00)
  ⑤ super_admin 在新地理位置登录(IP 地理库判断)
  ⑥ 同一 admin 5 min 内多地登录(geo 不一致)
  ⑦ admin 离职后仍有登录尝试(白名单未及时移除)

告警形式:
  · 钉钉群 @ super_admin
  · Slack #security-alerts
  · admin_audit_log eventCategory='security_alert'
```

### §7.5 admin_audit_log 全量记录

> §4.2 已给完整 schema · 这里强调**审计的覆盖度**。

**审计什么**:
- ✅ 所有登录 / 登出 / MFA(成功 + 失败)
- ✅ 所有跨账号查询(cross_account_query)
- ✅ 所有数据修改(包括读后修改 · 不只是直接 mutation)
- ✅ 所有导出操作(导出谁的什么)
- ✅ 所有 Approval Gates 申请 / 决策
- ✅ 所有配置变更
- ✅ 所有失败操作(包括权限不够被挡 · 用于检测越权尝试)

**不审计的**(明确):
- ❌ readonly 查 NSM 仪表盘聚合数据(无具体用户信息)
- ❌ 健康检查 / heartbeat
- ❌ 静态资源加载(SPA bundle / 图片)

### §7.6 高风险动作清单 + Approval Gates(承接 §4.4)

> §4.4 已列 14 类高风险 + 4 类二次审批 + 2 类紧急通道。这里讲**实施细节**:

```typescript
// apps/api/src/middleware/approval-gate.ts
export const approvalGateCheck = middleware(async ({ ctx, input, next, meta }) => {
  if (!meta.requiresApproval) return next();
  
  const approvalReqId = input._approvalRequestId;
  
  // 没有 approval id → 创建申请 + 中止当前请求
  if (!approvalReqId) {
    const req = await prisma.approvalRequest.create({
      data: {
        requesterAdminId: ctx.user.id,
        actionType: meta.actionType,
        actionPayload: input,
        riskLevel: meta.riskLevel,
        requireDualApproval: meta.requireDualApproval ?? false,
        isEmergency: meta.isEmergency ?? false,
        requesterReason: input._reason,  // UI 必填
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });
    
    // 通知审批人(钉钉 / 站内信)
    await notifyApprovers(req);
    
    throw new TRPCError({
      code: 'PRECONDITION_REQUIRED',
      message: 'APPROVAL_REQUIRED',
      cause: { approvalRequestId: req.id },
    });
  }
  
  // 有 approval id → 检查状态
  const req = await prisma.approvalRequest.findUnique({ where: { id: approvalReqId } });
  
  if (!req || req.status !== 'approved') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Approval not granted or expired',
    });
  }
  
  // 通过 · 继续执行 + 写 admin_audit_log(approvalRequestId 关联)
  return next({ ctx: { ...ctx, approvalRequest: req } });
});

// 在 procedure 上声明
export const banUserProcedure = adminProcedure
  .meta({
    requiresApproval: true,
    actionType: 'ban_user',
    riskLevel: 'high',
    requireDualApproval: false,
  })
  .input(banUserSchema)
  .mutation(async ({ ctx, input }) => {
    // approvalGateCheck 已确认 · 可直接执行
    await prisma.user.update({ where: { id: input.userId }, data: { isBanned: true } });
    await admin_audit.log({
      eventType: 'ban_user',
      actorAdminId: ctx.user.id,
      targetUserId: input.userId,
      approvalRequestId: ctx.approvalRequest.id,
    });
  });
```

### §7.7 鉴权 + 审计 + 安全小结

本节答 7 件事:
1. **独立 admin OAuth** · Workspace 限定 + 邮箱白名单 + 独立 lucia session
2. **WAF 层 IP 白名单** · 公司网络 + VPN + 钉钉 bot 临时白
3. **super_admin 强制 MFA** · admin 推荐 · readonly 不强制(决策 4=B)
4. **7 类异常登录告警** · 实时推钉钉 / Slack
5. **admin_audit_log 全量记录** · 含失败操作和越权尝试
6. **Approval Gates middleware** · meta 声明 + 二次审批 + 紧急通道实现
7. **6 闸鉴权链**(adminAuth + roleCheck + ipWhitelist + mfaCheck + adminRLS + approvalGateCheck)是每个 admin procedure 的硬约束

下一节(§8)进入实施路线图 P9 系列 · 把 16 域 + 鉴权 + 前端拆成 9 周可执行计划。

---

## §8 实施路线图(P9 系列)

> **决策 1 = B** · admin 独立后续版本 · 主应用 P0-P8 上线后启动 P9(总周期 11 周主应用 + 9 周 admin = 20 周分批)。
> P9.0 - P9.4 共 5 个阶段 · 9 周。

### §8.1 P9 总览

```
┌────────────────────────────────────────────────────────────────┐
│ 主应用 P0-P8(已规划 · ARCHITECTURE §9.1-9.10)                │
│   · 16 周完整 / 5 周 MVP                                       │
└────────────────────┬───────────────────────────────────────────┘
                     │ 上线后启动 P9
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ P9.0 · admin 基础设施(1 周)                                   │
│   独立 SPA + 独立 OAuth + 鉴权链 + IP 白名单 + admin_audit_log │
├────────────────────────────────────────────────────────────────┤
│ P9.1 · 6 个 P0 业务核心域(3 周)                              │
│   ① NSM ② 用户 ③ IP 账号 ④ 成本 ⑤ 审计 ⑥ 邀请码                │
├────────────────────────────────────────────────────────────────┤
│ P9.2 · 2 个 P0 内容审核域(2 周)                              │
│   ⑦ TrendingItem 审核 ⑧ DeepLearning 审核                     │
├────────────────────────────────────────────────────────────────┤
│ P9.3 · 5 个 P1 健康度域(2 周)                                │
│   ⑨ 进化 ⑩ Prompt 版本 ⑪ 配额 ⑫ 合规 ⑬ Approval Gates         │
├────────────────────────────────────────────────────────────────┤
│ P9.4 · 3 个 P2 高级域(1 周)                                  │
│   ⑭ A/B ⑮ 常量 ⑯ 配置中心(可后续版本)                        │
└────────────────────────────────────────────────────────────────┘
   总 9 周 · 不阻塞主应用 · 可与主应用 P3-P8 部分并行(参 §9.3)
```

### §8.2 P9.0 · admin 基础设施(1 周)

| 项 | 内容 |
|---|---|
| **目标** | apps/admin 骨架就绪 · super_admin 能登录看到空 NSM 页 |
| **交付物** | • monorepo workspace 重构(apps/web + apps/admin + apps/api + packages/*)<br>• apps/admin Vite + React + Aurelian Dark 复用<br>• admin OAuth 独立申请 + lucia-auth 接入<br>• WAF 层 IP 白名单(Cloudflare 配置)<br>• MFA(super_admin 强制 · TOTP)<br>• 6 闸鉴权链(adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck stub)<br>• admin_audit_log 表 + 中间件写入<br>• 异常登录告警(钉钉 webhook)<br>• Layout 骨架(topbar + sidebar 16 域 + audit drawer + status bar) |
| **★ 架构相关** | 跟主应用最大不同 · 这是**第一次运行 monorepo 多 SPA** · 必须验证:<br>① web build 不影响 admin build<br>② admin OAuth 跟主 OAuth 完全隔离<br>③ adminRLS bypass 跨账号查通过测试<br>④ WAF 真挡掉非白名单 IP |
| **引用知识库** | reference-materials/Agent安全架构与合规指南 §鉴权 / OWASP LLM Top 10 · ADR-016 Approval Gates |
| **风险** | • monorepo 重构破坏主应用现有代码(0 业务影响要求 · 严格回归)<br>• OAuth 二次申请 google workspace 配置 |
| **退出条件** | super_admin 用 admin@quanan.com 登录 admin.quanan.com · 必经 OAuth + MFA · 看到空 layout · admin_audit_log 有 admin_login 记录 · WAF 拒绝非白名单 IP |

### §8.3 P9.1 · 6 个 P0 业务核心域(3 周)

| 项 | 内容 |
|---|---|
| **目标** | 6 域全跑通 · 运营 / 财务 / 客服 / 法务每天能用 |
| **交付物** | • **域 ① NSM 仪表盘**(0.5 周)· 4 数字 + 漏斗 + 折线 + 3 饼图 + 告警栏(数据来源跨表聚合)<br>• **域 ② 用户管理**(0.5 周)· 列表 + 5 Tab 详情 + 改套餐(走 Approval)+ 封禁(走 Approval)<br>• **域 ③ IP 账号管理**(0.5 周)· 大表格 + 详情 + 异常账号识别后台跑批<br>• **域 ④ 成本仪表盘**(0.5 周)· 月度 + 多线折线 + Top 10 + 财务 PDF 导出<br>• **域 ⑤ 审计日志查询**(0.5 周)· trace 反查 + 时间线 + 法务 PDF 取证<br>• **域 ⑥ 邀请码管理**(0.5 周)· campaign + 创建 + 漏斗 |
| **★ 架构相关** | • adminRouter 6 子树 + 30+ procedure(全部带 adminRLS + auditLog)<br>• 6 个 admin 页面(对应路由组)<br>• Recharts + TanStack Table 接入<br>• Approval Gates 完整闭环(域 ②⑥ 触发 · 走域 ⑬ stub 流程)|
| **引用知识库** | reference-materials/Agent运营数据分析框架 · DATA-MODEL §G 运维表 |
| **风险** | • NSM 跨表聚合 SQL 慢(需要预聚合表 kpi_snapshots)<br>• 详情抽屉 5 Tab 同时拉数据(用 React Query 并行 + Suspense)|
| **退出条件** | • 6 个页面全部能展示真实数据<br>• 改套餐 + 封禁 + 邀请码作废全部走 Approval(stub 流程 · super_admin 直批)<br>• 财务能导出月度账单 PDF · 法务能 trace 反查 + 取证导出 |

### §8.4 P9.2 · 2 个 P0 内容审核域(2 周)

| 项 | 内容 |
|---|---|
| **目标** | 内容审核员 / super_admin 能用 · 防止违规内容污染 RAG / 用户样本库 |
| **交付物** | • **域 ⑦ TrendingItem 审核**(1 周)<br>&nbsp;&nbsp;◦ 入库 review_queue + 自动违禁词扫描 + 抽样人审 + 批量批准/驳回<br>&nbsp;&nbsp;◦ 5 平台来源监控 + 自动审核规则配置(super_admin)<br>&nbsp;&nbsp;◦ 已上架 trending 后续下架流程<br>• **域 ⑧ DeepLearning 审核**(1 周)<br>&nbsp;&nbsp;◦ 上传 review_queue + 自动 PII 扫描 + 违禁词扫描 + 抽样人审<br>&nbsp;&nbsp;◦ 文件预览(PDF/Word/MD/TXT 嵌入查看)<br>&nbsp;&nbsp;◦ 用户违规累计告警 + 暂停上传(走 Approval)|
| **★ 架构相关** | • 这两域是 **TrendingScraper Worker / FileParser Worker 的下游闸门**<br>• 后端要改:scraper / parser **不能直接入向量库**,必须先进 review_queue<br>• 自动扫描规则化 · 接入 PII 库(身份证 / 手机号 / 邮箱 / 银行卡正则)+ 违禁词库(政治 / 暴力 / 色情 / 赌博)<br>• 与主应用 ARCHITECTURE §9.13b trending 合规方案对齐(B 第三方授权 vs A 官方 API)|
| **引用知识库** | reference-materials/Agent安全架构与合规指南 §内容审核 + PII 处理 · ADR-017 trending 合规 |
| **风险** | • 自动扫描误伤(正常内容被标违禁)→ 抽样人审兜底 + 用户申诉机制<br>• 抽样比例设置(过低漏掉违规 · 过高人审压力大)|
| **退出条件** | • TrendingScraper 抓的内容必须通过 review 才进 RAG<br>• 用户上传的 DeepLearning 样本必须通过 review 才入向量库<br>• 内容审核员每天能处理队列 · admin_audit_log 有完整审核记录 |

### §8.5 P9.3 · 5 个 P1 健康度域(2 周)

| 项 | 内容 |
|---|---|
| **目标** | 产品演进 + 安全闸门齐 · 团队能管理 prompt 灰度、监控飞轮、放配额、合规仪表盘 |
| **交付物** | • **域 ⑨ 进化档案监控**(0.4 周)· L 分布 + 飞轮健康度 + 异常账号 + 强制重跑(走 Approval)<br>• **域 ⑩ Prompt 版本管理**(0.6 周)· 14 Specialist Tab + Monaco 编辑 + Diff + 灰度配置 + LLM Judge CI 触发 + 一键回滚<br>• **域 ⑪ 配额管理**(0.4 周)· 用户配额表 + 实时监控 + 客服快速调整(临时 · 24h 失效)<br>• **域 ⑫ 合规仪表盘**(0.3 周)· 行业触发统计 + 法务 PDF 导出<br>• **域 ⑬ Approval Gates 工作流**(0.3 周 · ★ 横切机制)· 待审批列表 + 详情抽屉 + 批准/拒绝 + 二次审批 + 紧急通道 |
| **★ 架构相关** | • 域 ⑩ 是**最复杂的域** · 涉及:Monaco 编辑器 / Diff 视图 / LLM Judge CI 集成 / canary 分流(按 user_id hash)/ Prompt 版本 schema 持久化<br>• 域 ⑬ 把 P9.0 的 stub 升级为完整闭环 · 通知系统 + 二次审批逻辑 + 紧急通道 + 后置 24h 复核 cron |
| **引用知识库** | reference-materials/LLMOps与团队协作指南 §Prompt 版本管理 · reference-materials/AI-Agent的两种记忆范式(进化监控)· ADR-016 Approval Gates 完整版 |
| **风险** | • 域 ⑩ Prompt 灰度按 hash 分流 · 必须保证一致性(同一用户始终在同一组)<br>• 域 ⑬ 通知系统(钉钉 / 站内信 / 邮件)三方对接 |
| **退出条件** | • Prompt 改动 → 灰度 → LLM Judge → 一键回滚全跑通<br>• Approval Gates 完整闭环(申请 → 通知 → 审批 → 执行 → 审计)<br>• 配额客服调整生效 · 24h 自动失效<br>• 飞轮停滞告警能推钉钉 |

### §8.6 P9.4 · 3 个 P2 高级域(1 周)

| 项 | 内容 |
|---|---|
| **目标** | 后续高级能力 · 不在 P9 主路线 · 但骨架先就位 |
| **交付物** | • **域 ⑭ A/B 测试**(0.4 周)· 复用域 ⑩ 灰度机制扩展 · 增加显著性检验 + 自动停损<br>• **域 ⑮ 常量管理**(0.3 周)· 67 案例 / 23 公式 CRUD + 入向量库(走 Approval · embed 重跑)<br>• **域 ⑯ 系统配置中心**(0.3 周)· feature flags + 紧急开关(停 trending / 停 EvolutionAgent / 启用降级 prompt)|
| **★ 架构相关** | • 域 ⑮ 改常量影响 prompt → 必须自动跑 LLM Judge(对接域 ⑩ 流程)<br>• 域 ⑯ 紧急开关是 prod 救命稻草 · 必须 1 人即可触发(轻 Approval + 后置 24h 复核)|
| **退出条件** | • A/B 实验能启动 + 看显著性 + 一键停损<br>• 常量改动走 Approval + 自动跑 Judge + 入库<br>• 紧急开关能 1 click 停 trending 抓取(救命) |

### §8.7 P9 协同节奏(★ 2026-05-07 v0.2 修订 · 选方案 A 严格串行)

> ⚠️ **v0.1 错误** · v0.1 写"P9.0 与主应用 P8 期间并行节流 1 周"是基于"双 daemon"假设 · 但实测 ralph.py 单 PROJECT_ROOT 设计不支持(详 PRD-MASTER §3.5 + §7.4)。
>
> ⚠️ **v0.2 修订** · 选方案 A 严格串行 · 总周期 25 周(不再节流)。

```
主应用时间线(Week 1-16):
  P0(2w) · P1(2w) · P2(1w) · P3(3w) · P4(2w) · P5(2w) · P6(1w) · P7(2w) · P8(1w)
                                                                              ↑
                                                                              │ 主应用 P8 完成 + 上线
                                                                              ▼
admin 时间线(Week 17-25 · ★ 主应用 P8 完成后才启动):
                                                                          P9.0(1w · Week 17)
                                                                          P9.1(3w · Week 18-20)
                                                                          P9.2(2w · Week 21-22)
                                                                          P9.3(2w · Week 23-24)
                                                                          P9.4(1w · Week 25 · 可压后)

  ★ 严格串行(方案 A) · 主应用 P0-P8 完整 16 周 → 主应用上线 → admin P9.0 起 → ... → P9.4
  ★ 总周期 16 + 9 = 25 周
```

**严格串行(方案 A · 推荐)**:主应用 16 周 + admin 9 周 = **25 周**
**为什么不做并行** · ralph.py 单 PROJECT_ROOT 设计 · 同项目内不能跑两个 daemon(详 PRD-MASTER §7.4 E)

**3 类伪并行机会**(团队层面 · ralph 总执行时间不变):
- A · 文档前置准备 · 在 ralph 跑当前 PRD 时 · prd skill 提前写下一份 PRD 文档(可省 0.3w/PRD 切换间隙)
- B · LLM Judge 100 金标准编写 · 团队成员在 PRD-4 启动前补齐主流程 60 条
- C · admin 设计稿补充 · 设计师补 10 个工具页设计稿 + admin layout 视觉 · 跟主应用 P3-P5 并行

### §8.8 路线图小结

本节答 5 件事:
1. **P9 总周期 9 周** · P9.0(1w)+ P9.1(3w)+ P9.2(2w)+ P9.3(2w)+ P9.4(1w)
2. **P9.0 是工程改造**(monorepo + OAuth + WAF + 鉴权链)· 是后续 5 阶段的地基
3. **P9.1-P9.2 是 8 个 P0 域**(运营核心 + 内容审核)· 上线即可承担运营 / 财务 / 法务 / 审核员日常
4. **P9.3 是 5 个 P1 域**(健康度 + Approval Gates 完整闭环)· 让产品演进有工具
5. **P9.4 P2 域可压到后续版本** · 不在 9 周必交清单

---

## §9 与主应用的协同

### §9.1 共享 / 不共享清单(承接 §1.2)

| 类别 | 项 | 共享? | 备注 |
|---|---|:-:|---|
| **数据层** | PostgreSQL | ✅ | admin 通过 RLS bypass 跨账号查 |
| **数据层** | Redis | 🟡 | 同一实例 · 不同 namespace(admin:* vs app:*) |
| **数据层** | S3 / OSS | ✅ | 文件存储共享 |
| **代码层** | Prisma schema | ✅ | 单一真理 |
| **代码层** | zod schemas | ✅ | packages/schemas |
| **代码层** | UI base tokens | ✅ | packages/ui/base |
| **代码层** | tRPC client config | 🟡 | 独立 client(packages/clients/admin-client.ts)|
| **后端** | API 进程 | ✅ | 同一 apps/api · 不同 router 树 |
| **后端** | LLM Gateway | 🟡 | admin 不调 LLM(不需要)|
| **后端** | Specialist | ❌ | admin 不调 |
| **后端** | Worker(scraper / parser) | 🟡 | admin 调阻断版本(进 review_queue 不直接入库)|
| **前端** | SPA bundle | ❌ | apps/web vs apps/admin 独立 build |
| **前端** | 路由 / 页面 | ❌ | 独立 |
| **前端** | layout | ❌ | apps/web 用主应用 layout · apps/admin 用 AdminLayout |
| **认证** | OAuth 应用 | ❌ | 独立 client_id |
| **认证** | Session | ❌ | 独立 admin session |
| **观测** | Sentry / pino / trace_id | ✅ | 同一套 |
| **观测** | 钉钉 / Slack 告警 | 🟡 | 同一系统 · 不同 channel |
| **CI/CD** | GitHub Actions | ✅ | 同一 repo · 不同 workflow |
| **CI/CD** | Deploy | ❌ | 独立 deploy(www / admin / api) |
| **故障域** | 服务可用性 | ❌ | 任一挂掉不影响其他 |

### §9.2 跨子系统的事件总线(可选 · 后期)

> P9 范围内不做 · 但留好钩子。某些场景需要主应用 → admin 双向事件:

```
场景示例:
─────────────────────────────────────────────────
  ① 用户被 admin 封禁 → 主应用 session 立即失效
       admin.users.banUser → emit 'user.banned' → 主应用 session store 删该用户
       
  ② admin 修改 prompt 灰度 → 主应用 ContextAssembler 立即生效
       admin.prompts.changeCanary → emit 'prompt.canary_changed' → 主应用刷新 prompt cache
       
  ③ TrendingItem 审核通过 → 入向量库 → 主应用 RAG 立即可用
       admin.reviewTrending.approve → emit 'trending.approved' → embed worker 入库 → 主应用查得到
       
  ④ 紧急开关 · 停 trending 抓取
       admin.config.emergencyStop('trending') → emit 'config.changed' → 主应用 TrendingScraper Worker 停 cron

实现选项(后期):
  · Postgres LISTEN/NOTIFY(轻量 · 同库 · 默认推荐)
  · Redis Pub/Sub(中量 · 性能更好)
  · 独立消息队列(NATS / Kafka · P9 不必)
```

> 🟢 **当前 P9 范围内** · 用**简单的"DB 写 + 主应用 30s 轮询"代替事件总线**(NSM 仪表盘已经是 30s refetch 模式 · 主应用同款节奏即可)。事件总线是后期优化项。

### §9.3 单 daemon 串行 Coding 3.0 协同(★ 2026-05-07 v0.2 修订 · 选方案 A)

> ⚠️ **v0.1 错误** · v0.1 写"双 prd.json + 双 daemon 并行 + 5 个 cli 参数"是编造的 · 实测 `~/.claude/scripts/ralph/ralph.py` 只支持 4 参数(`--model` / `--no-audit-gate` / `--daemon` + 1 位置参数)· 单 PROJECT_ROOT 设计不能并行(详 [PRD-MASTER §3.5 + §7.4](PRD-MASTER.md))。
>
> ⚠️ **v0.2 真相** · 严格串行 · 同一 daemon · prd.json 切换。

```bash
# 全程在项目根 /Users/return/Desktop/QuanAn 跑(同一 PROJECT_ROOT)
# 14 PRD 严格串行 · 一次只跑一份

# Week 1-16 · 主应用 PRD-1 ~ PRD-9
cp scripts/ralph/prd-1.json scripts/ralph/prd.json
python scripts/ralph/ralph.py --model sonnet --daemon
# 跑完 → /goal-verify → /prd-retro → bash scripts/ralph/switch-prd.sh prd-2 → 重启 daemon
# ... 直到 PRD-9 跑完

# Week 17-25 · admin PRD-10 ~ PRD-14
bash scripts/ralph/switch-prd.sh prd-10
python scripts/ralph/ralph.py --model sonnet --daemon
# ... 直到 PRD-14 跑完
```

**单 daemon 跨 PRD 共享资源(append-only · 无锁冲突)**:

| 资源 | 共享方式 |
|---|---|
| `scripts/ralph/cost-log.jsonl` | append-only · 14 PRD 累加成本 · 给运营总账用 |
| `scripts/ralph/progress.txt` | append-only · 14 PRD 进度连续记录 |
| `~/.claude/playbooks/reject-examples.jsonl` | 跨项目 + 跨 PRD 反例累加 · /prd-retro 自动 append |
| `prisma/schema.prisma` | 跟着 PRD 变化逐步加表 · migration 时间戳自然串行 |
| `packages/schemas/` | 跟着 PRD 变化逐步加 zod schema |

**PRD 切换时清掉的资源(防止 ralph.py 误读上一份 PRD 状态)**:

| 资源 | 处理 |
|---|---|
| `scripts/ralph/audit-gate.json` | 切 PRD 时 rm -f(由 switch-prd.sh 处理) |
| `scripts/ralph/ralph-lock.json` | 同上 |
| `scripts/ralph/prd.json` | 用 switch-prd.sh 替换为下一份 |

**实施期"伪并行"机会**(团队层面 · ralph 总执行时间不变):
- 在 ralph 跑当前 PRD 时 · prd skill 提前写下一份 PRD 文档(节流 PRD 切换间隙)
- 团队成员写 LLM Judge 100 金标准 · 不动 ralph
- 设计师补 10 个工具页设计稿 + admin 设计 · 跟主应用 P3-P5 并行

> 🟢 **关键洞察(v0.2 修正)** · 选方案 A 是**工程务实**的体现 — 不动全局 ralph 工具(影响其他项目的风险)· 不违反 monorepo 设计(影响代码组织清晰度)· 接受多 1 周总周期(25w 而非 24w)· 换工具链稳定性 · 这是合理的工程权衡。
>
> 详细方案对比见 [`PRD-MASTER.md §7.4 E`](PRD-MASTER.md)(4 方案 ABCD 对比 · 工作量 / 风险 / 总周期 / 选择理由)。

### §9.4 与主应用的版本一致性

> admin 子系统跟主应用是**两个独立产品** · 但共享数据层 · 必须保证 schema 兼容。

```
版本对齐策略:
─────────────────────────────────────────────────
  ① Prisma schema 改动 · admin / web / api 三方共同接受 · prisma migrate 串行
  ② zod schema 改动 · 通过 packages/schemas 共享 · breaking change 走 deprecation 周期(2 个版本)
  ③ admin 加新表(如 admin_audit_log / approval_requests)· 不影响主应用
  ④ 主应用 schema 改动 · admin 端按需适配(如 user 加字段)
  
breaking change 处理:
  · 主应用 v1.5 引入新字段 · admin v0.1 不识别 · 不报错(unknown field 容忍)
  · admin v0.5 新增需要主应用 v1.5+ · 写明依赖
```

### §9.5 协同小结

本节答 4 件事:
1. **共享 / 不共享 19 项清单** · 数据 + 观测共享 · 认证 + 部署 + bundle 不共享
2. **跨子系统事件总线** · P9 不做 · 用 30s 轮询代替 · 后期可演进为 LISTEN/NOTIFY
3. **双 prd.json + 双 daemon** · Coding 3.0 第一次多子系统并行实测 · 加 4 类冲突处理
4. **版本一致性** · Prisma + zod 共享 · breaking change 2 版本 deprecation

---

## §10 全文小结

> 本架构 9 章答了 9 个核心问题:

| § | 章节 | 核心结论 |
|:-:|---|---|
| §1 | 系统总览 | admin 是 first-class 子系统 · 跟主应用平级 · 服务运营/财务/法务/客服/审核员 6 类内部用户 |
| §2 | 部署形态 | 独立子域名 · 独立 SPA · 独立 OAuth · WAF IP 白名单 · 独立 CI/CD |
| §3 | 业务管理域 | 16 域(6 P0 业务 + 2 P0 内容审核 + 5 P1 健康度 + 3 P2 高级)|
| §4 | 数据访问与隔离 | RLS bypass + admin_audit_log 独立 + 三档角色 4 子模式权限矩阵 + Approval Gates |
| §5 | 接口契约 | adminRouter 14 子树 + 6 闸鉴权链 + 跟主 router 严格分离 |
| §6 | 前端架构 | apps/admin SPA + Aurelian Dark 复用 + admin 密度 + 13 路由组 + Recharts + TanStack Table |
| §7 | 鉴权 + 审计 + 安全 | 独立 OAuth + IP 白名单 + super_admin MFA + 7 类异常告警 + admin_audit_log 全量 + Approval Gates middleware |
| §8 | 实施路线图 | P9.0(1w)+ P9.1(3w 6 P0)+ P9.2(2w 2 审核)+ P9.3(2w 5 P1)+ P9.4(1w 3 P2)= 9 周 |
| §9 | 与主应用协同 | 19 项共享/不共享清单 + 双 daemon Coding 3.0 协同 + 版本一致性 |

### 默认决策落地确认

| # | 决策 | 落地 |
|:-:|---|---|
| 1 | B · admin 独立后续版本 | §8 P9 在主应用 P0-P8 后启动(可与 P8 并行 P9.0)|
| 2 | A · 重运营 · 13 域全做 | §3 共 16 域(13+3 P2)|
| 3 | A · 三档角色 | §4.3 super/admin/readonly + 4 子模式(cs / reviewer / finance / legal)|
| 4 | B · 仅 super_admin 强制 MFA | §7.3 super_admin TOTP/WebAuthn · admin 推荐 · readonly 不强制 |
| 5 | A · 复用 Aurelian Dark | §6.1 复用 base + admin 密度补强 |

### 配套需要做的事

| 文档 | 改动 | 工作量 |
|---|---|:-:|
| [ARCHITECTURE.md](ARCHITECTURE.md) | §1.4b + §1.7 + §2.5b 改写 + §9 加 P9 | 3h |
| [ADR.md](ADR.md) | 加 ADR-019(前后端分离 + monorepo)+ ADR-020(Approval Gates)| 2h |
| [DATA-MODEL.md](DATA-MODEL.md) | 加 4 张新表(admin_audit_log + approval_requests + prompt_versions + user_quota)+ 9 类业务管理域辅助表 | 1d |
| [AGENTS.md](AGENTS.md) | 加 §10 admin 子系统代码层约束(rule + 红线 + audit)| 4h |
| [SCAFFOLD.md](SCAFFOLD.md) | 改强制 monorepo workspace · 加 apps/admin 目录树 | 2h |
| **prisma/schema.prisma** | 加 11 张新表 schema · 跑 migration | 1d |

> **总配套工作 · 约 3-4 天**(在 P9.0 之前完成)

---

## 修订记录

- **2026-05-07 v0.1** · 创建管理后台架构骨架
  - **§1 系统总览** · admin 是 first-class 子系统 · 6 类内部用户 · 9 层架构图 · 第 9 条 aiipznt 偏离决策
  - **§2 部署形态** · 独立子域名 + 独立 SPA + 独立 OAuth + WAF IP 白名单 + 独立 CI/CD(三方部署全图)
  - **§3 业务管理域全景** · 16 域(6 P0 + 2 P0 审核 + 5 P1 + 3 P2)逐域设计 · 每域 6 字段(数据/KPI/交互/鉴权/UI/Prisma)
  - **§4 数据访问与隔离** · admin RLS bypass + admin_audit_log + 6 角色权限矩阵 + 14 类高风险 + 4 类二次审批 + 2 类紧急通道
  - **§5 接口契约** · adminRouter 14 子树 + 6 闸鉴权链 + 严格分离主 router
  - **§6 前端架构** · Aurelian Dark + admin 密度 + 13 路由组 + Recharts + TanStack Table + 详情抽屉模式 + 3 类操作 UI 反馈
  - **§7 鉴权 + 审计 + 安全** · 独立 OAuth + WAF + super_admin MFA(决策 4=B)+ 7 类异常告警 + Approval Gates middleware
  - **§8 实施路线图** · P9.0-P9.4 共 9 周 · 部分可与主应用 P8 并行
  - **§9 与主应用协同** · 19 项共享/不共享 + 双 daemon Coding 3.0 协同 + 版本一致性
  - **应用 5 项默认决策** · 1=B 独立后续 · 2=A 重运营 · 3=A 三档 · 4=B 仅 super MFA · 5=A 复用 Aurelian

---

> **本架构由 Claude(Opus 4.7)基于 [`ARCHITECTURE-REVIEW.md`](ARCHITECTURE-REVIEW.md) §3 + §5 派生 · 应用 5 项默认决策 · 兼容 [`ARCHITECTURE.md`](ARCHITECTURE.md) v0.2 主应用架构 · 复用 [`DATA-MODEL.md`](DATA-MODEL.md) §G + §9 已就位的 admin 索引和 RLS 设计 · 服务于 Coding 3.0 双 daemon 并行实施。**
