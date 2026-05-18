# QuanQn · 数据模型(DATA-MODEL.md)

> **版本** · v0.2(2026-05-06 创建 · 2026-05-07 v0.2 修订:§13 admin 13 表 schema + RLS + 索引)
> **角色** · 把 [ARCHITECTURE.md §3](ARCHITECTURE.md) 的 ER 图展开成完整 Prisma schema · RLS 策略 · 索引 · 迁移
> **真理来源** · 本文件是 prisma schema + zod schema 的"上游" · 改动顺序 · 本文件 → `prisma/schema.prisma` → `src/lib/schemas/` zod
> **配套** · [ARCHITECTURE.md](ARCHITECTURE.md) · [AGENTS.md](AGENTS.md)(LD-009 / LD-010 / LD-011)· [ADR-010 / ADR-011 / ADR-012](ADR.md)

---

## 文档地图

| § | 章节 | 一句话 |
|:-:|---|---|
| §1 | **总览 · ER 图 + 15 实体清单** | 全局视图 + 实体分类(全局/账号聚合/9 步/进化/学习/运维) |
| §2 | **全局表(3 张)** | User · InviteCode · TrendingItem · 不带 account_id |
| §3 | **账号聚合根 · IpAccount** | 业务聚合根 · 90% 实体按它隔离 · 含 active 切换语义 |
| §4 | **9 步主线 · StepData** | 9 个 stepKey 的 result_json 双写 · 乐观锁 version |
| §5 | **历史 + 资产 · History · Topic · Asset** | 用户生成内容沉淀 · 反馈飞轮燃料源 |
| §6 | **诊断 + 进化(4 张)** | DiagnosisReport · FeedbackLog · EvolutionProfile · EvolutionInsight |
| §7 | **学习 + 知识(3 张)** | DeepLearningArchive · KnowledgeFavorite · KnowledgeNote |
| §8 | **运维表(3 张)** | cost_log · audit_log · daily_task |
| §9 | **RLS 策略集** | 12 张账号表的 Postgres Row-Level Security 策略 |
| §10 | **索引策略** | 高频查询索引 · 复合索引 · pgvector 索引 |
| §11 | **zod schema 派生** | 从 prisma model 派生 zod · 全栈共享 |
| §12 | **迁移策略 + 种子数据** | initial migration · seed.ts · 版本回滚 |

---

## §1 总览 · ER 图 + 15 实体清单

### §1.1 完整 ER 图(15 业务 + 3 运维 = 18 实体)

```
                          ┌──────────┐
                          │  User    │  ★ GLOBAL · Google OAuth
                          └────┬─────┘
                               │ 1:N
                               ▼
            ┌───────────────────────────────────┐
            │       IpAccount(聚合根)         │  ★ 90% 实体按它隔离
            │  industry / platform / stage     │
            │  activeAccountId 由 User 引用     │
            └─┬─────────────────────────────┬───┘
              │                              │
   ┌──────────┴──────────┐         ┌────────┴────────────┐
   │ 9 步主线             │         │ 历史 + 资产           │
   │ ├─ StepData(9 keys) │         │ ├─ History           │
   │                     │         │ ├─ Topic             │
   │                     │         │ └─ Asset             │
   └─────────────────────┘         └─────────────────────┘
              │                              │
   ┌──────────┴──────────────────────────────┴───┐
   │ 诊断 + 进化(反馈飞轮 4 张)                  │
   │ ├─ DiagnosisReport · 8 步问卷 → 7 维度报告  │
   │ ├─ FeedbackLog     · 👍/👎 燃料             │
   │ ├─ EvolutionProfile· 当前等级 + insights   │
   │ └─ EvolutionInsight· 历史快照               │
   └────────────────────────────────────────────┘
              │
   ┌──────────┴──────────┐
   │ 学习 + 知识(3 张)    │
   │ ├─ DeepLearningArchive(用户样本)        │
   │ ├─ KnowledgeFavorite                    │
   │ └─ KnowledgeNote                        │
   └─────────────────────────────────────────┘

   ┌─────────────────────┐    ┌─────────────────┐
   │  InviteCode         │    │  TrendingItem   │  ★ GLOBAL
   │  (邀请码池)         │    │  (全网爆款)     │     全用户共享
   └─────────────────────┘    └─────────────────┘

   运维表(3 张 · 跨账号 · 但带 account_id 字段做分析)·
   ┌────────────┐  ┌──────────────┐  ┌────────────┐
   │ cost_log   │  │ audit_log    │  │ daily_task │
   │ (计费)     │  │ (操作审计)   │  │ (每日任务) │
   └────────────┘  └──────────────┘  └────────────┘
```

### §1.2 18 实体分类速查

| 分类 | 实体 | 数量 | 隔离粒度 |
|---|---|:-:|:-:|
| **A · 全局表** | User · InviteCode · TrendingItem | 3 | **GLOBAL** · 不带 account_id |
| **B · 账号聚合根** | IpAccount | 1 | 按 user_id 隔离 |
| **C · 9 步主线** | StepData | 1(9 keys) | 按 account_id |
| **D · 历史 + 资产** | History · Topic · Asset | 3 | 按 account_id |
| **E · 诊断 + 进化** | DiagnosisReport · FeedbackLog · EvolutionProfile · EvolutionInsight | 4 | 按 account_id |
| **F · 学习 + 知识** | DeepLearningArchive · KnowledgeFavorite · KnowledgeNote | 3 | 按 account_id |
| **G · 运维表** | cost_log · audit_log | 2 | 含 account_id 但**不**开 RLS · admin 跨账号聚合用 |
| **G · daily_task** | daily_task | 1 | **开 RLS**(用户在 /daily-tasks 直接读 · 详 §9.2) |
| - | **合计** | **18** | 12 严格隔离 + 3 全局 + 3 运维 |

### §1.3 隔离粒度铁律(对应 ADR-010 + LD-009)

```
┌───────────────────────────────────────────────────┐
│  RLS 强制(12 张 · 任一查询不带 account_id 拒绝)  │
│  ─────────────────────────────────────            │
│  IpAccount(按 user_id 同样开 RLS)                │
│  StepData · History · Topic · Asset                │
│  DiagnosisReport · FeedbackLog                     │
│  EvolutionProfile · EvolutionInsight               │
│  DeepLearningArchive · KnowledgeFavorite ·         │
│  KnowledgeNote                                     │
└───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│  GLOBAL 显式标注(3 张 · 不带 account_id)         │
│  ─────────────────────────────────────            │
│  User · InviteCode · TrendingItem                  │
│  代码注释必含 // GLOBAL TABLE                      │
└───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│  分析表(3 张 · 含 account_id 但无 RLS)           │
│  ─────────────────────────────────────            │
│  cost_log    · 跨账号聚合按用户 / Specialist 计费  │
│  audit_log   · 跨账号查 trace_id                   │
│  daily_task  · 含 account_id 但管理员可批量查      │
│  说明 · 这些表 admin 后台需要跨账号查 · 不开 RLS · │
│        但应用 layer 必须显式 where: { accountId } │
└───────────────────────────────────────────────────┘
```

### §1.4 跟 ARCHITECTURE.md §3.1 ER 的关系

* ARCHITECTURE 给的是**抽象 ER**(15 业务实体 · 关系示意)
* 本文件给的是**具体 Prisma model**(字段类型 · 索引 · RLS · 默认值)
* 数字一致 · 15 业务实体 · 加上 3 运维表 = 18 物理表
* trace_id 字段全部表必含(LD-013 强约束)

### §1.5 命名约定(对应 AGENTS §6.1)

| 层 | 风格 |
|---|---|
| Prisma model | PascalCase 单数 · `IpAccount` · `StepData` |
| DB 表名 | snake_case 复数 · `ip_accounts` · `step_data` |
| DB 列名 | snake_case · `account_id` · `created_at` · `trace_id` |
| zod schema | PascalCase + `Schema` 后缀 · `IpAccountSchema` |
| TS type | PascalCase · `IpAccount = z.infer<typeof IpAccountSchema>` |

### §1.6 通用字段(15 业务实体共有)

```prisma
// 所有非全局表必含的标准字段
{
  id          Int       @id @default(autoincrement())
  accountId   Int       @map("account_id")    // 12/15 实体含
  traceId     String?   @db.VarChar(64) @map("trace_id")  // LD-013
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
}
```

> ⚠️ **删除策略** · 大部分用 `Cascade`(账号删 → 数据删) · 但 FeedbackLog / cost_log 用 `SetNull`(保留审计)。

---

## §2 全局表(3 张 · 不带 account_id)

> 这 3 张表是**唯一允许不带 account_id 的实体**(LD-009 例外)。代码中必须显式加 `// GLOBAL TABLE` 注释。

### §2.1 User · 用户主表

```prisma
/// GLOBAL TABLE · 用户本身就是隔离单位 · 无需 account_id
model User {
  id              Int       @id @default(autoincrement())
  openId          String    @unique @db.VarChar(64) @map("open_id")
  // openId · Google OAuth 返回的稳定 ID(实测 sally · "mk9g7YY3JquSvSe5LGjzgP")

  name            String    @db.VarChar(100)
  email           String    @unique @db.VarChar(255)
  loginMethod     String    @default("google") @db.VarChar(32) @map("login_method")
  // loginMethod · 'google' | 'wechat'(后期)| 'phone'(后期)

  role            String    @default("user") @db.VarChar(16)
  // role · 'user' | 'admin' · admin 才能访问 /admin/*

  isActivated     Boolean   @default(false) @map("is_activated")
  // isActivated · 邀请码激活后才为 true · 未激活只能看登录页

  industry        String?   @db.VarChar(64)
  // industry · 全局首选行业 · 新建 IpAccount 时 prefill · 实测 sally · "beauty_industry"

  activeAccountId Int?      @map("active_account_id")
  // activeAccountId · 当前活跃账号 · 切换时同步 LS 'aiip_active_account_id'
  //                · NULL = 用户还没创建任何账号

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  lastSignedIn    DateTime? @map("last_signed_in")

  // 关系
  ipAccounts      IpAccount[]
  invitesCreated  InviteCode[]    @relation("InviteCreator")
  invitesUsed     InviteCode[]    @relation("InviteUser")
  feedbacks       FeedbackLog[]
  auditLogs       AuditLog[]

  @@map("users")
  @@index([email])
  @@index([openId])
  @@index([activeAccountId])
}
```

**关键决策**:
* `openId` 不变 · `email` 可变(Google 允许改 primary email) · 用 `openId` 做 OAuth 关联
* `activeAccountId` 是 nullable · 新用户进 onboarding 走完才有第一个账号
* `role` 用字符串而非 enum(LD-013 不用 TS enum · 但允许 DB enum?这里选字符串保持灵活)

### §2.2 InviteCode · 邀请码池

```prisma
/// GLOBAL TABLE · 邀请码池 · 跨用户共享
model InviteCode {
  id          Int       @id @default(autoincrement())
  code        String    @unique @db.VarChar(32)
  // code · 显示给用户的邀请码 · 8-16 位字母数字 · 实测 sessionStorage 'pendingInviteCode'

  // 状态
  isActive    Boolean   @default(true) @map("is_active")
  maxUses     Int       @default(1) @map("max_uses")
  // maxUses · 单码最多激活几次(默认 1 次性 · 后期支持团队码)

  usedCount   Int       @default(0) @map("used_count")
  expiresAt   DateTime? @map("expires_at")

  // 创建人 · 谁发的邀请
  createdById Int       @map("created_by_id")
  createdBy   User      @relation("InviteCreator", fields: [createdById], references: [id])

  // 第一个使用人(只记一个 · 团队码场景另写 InviteRedemption 中间表)
  usedById    Int?      @map("used_by_id")
  usedBy      User?     @relation("InviteUser", fields: [usedById], references: [id])
  usedAt      DateTime? @map("used_at")

  // 元数据
  campaign    String?   @db.VarChar(64)
  // campaign · 营销活动标记 · 'launch_2026q2' · 'KOL_zhao' · ...

  notes       String?   @db.Text
  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("invite_codes")
  @@index([code])
  @@index([campaign])
  @@index([createdById])
  @@index([isActive, expiresAt])
}
```

**关键决策**:
* MVP 用 `usedById`(单码单用)· 后期改 `InviteRedemption` 中间表(团队码)
* `campaign` 字段为运营追踪 · 哪个渠道 / KOL 转化最高
* admin 后台 `/admin/invite-manage` 操作此表

### §2.3 TrendingItem · 全网爆款缓存(L5)

```prisma
/// GLOBAL TABLE · 全网爆款 · 跨用户共享 · 节省抓取成本
model TrendingItem {
  id            Int       @id @default(autoincrement())

  // 来源
  platform      String    @db.VarChar(32)
  // platform · 'douyin' | 'xiaohongshu' | 'shipinhao' | 'kuaishou' | 'bilibili'

  sourceUrl     String?   @db.VarChar(512) @map("source_url")
  sourceItemId  String?   @db.VarChar(128) @map("source_item_id")
  // sourceItemId · 平台原 ID · 用于去重(同一爆款不同 vendor 抓多次合并)

  vendor        String    @db.VarChar(32)
  // vendor · 'xinbang'(新榜)| 'cmm'(蝉妈妈)| 'official_douyin' | ...
  // 详见 ADR-017 · 严禁 'self_crawler'

  // 内容
  title         String    @db.Text
  contentText   String?   @db.Text @map("content_text")
  // contentText · 文案全文(可选 · 部分 vendor 不返回)

  // 分类(用于按 industry / presentStyle 筛选)
  industry      String?   @db.VarChar(64)
  presentStyle  String?   @db.VarChar(64) @map("present_style")
  // industry · 抓取时识别 · 可能为 NULL(未识别)
  // presentStyle · 14 呈现形式之一 · NULL = 未分类

  // 作者
  authorName    String?   @db.VarChar(100) @map("author_name")
  authorFollowers Int?    @map("author_followers")

  // 互动数据(实测时点)
  viewCount     BigInt    @default(0) @map("view_count")
  likeCount     Int       @default(0) @map("like_count")
  shareCount    Int       @default(0) @map("share_count")
  commentCount  Int       @default(0) @map("comment_count")

  // 向量(详见 ADR-012)· 给 TopicAgent 按 industry+platform 找相似爆款
  contentEmbedding Unsupported("vector(1536)")? @map("content_embedding")

  // 时间
  publishedAt   DateTime? @map("published_at")
  crawledAt     DateTime  @default(now()) @map("crawled_at")
  // crawledAt · 入库时间 · TTL 滚动 · 老数据(>30 天)归档或删除

  @@map("trending_items")
  @@unique([platform, sourceItemId])  // 跨 vendor 去重
  @@index([platform, industry])
  @@index([platform, presentStyle])
  @@index([crawledAt(sort: Desc)])    // 时间倒序查最近
  @@index([viewCount(sort: Desc)])    // 按热度查
}
```

**关键决策**:
* `vendor` 字段记录数据来源 · 严禁 `'self_crawler'`(LD-017 R-17 grep 检测时连 enum 字符串都禁)
* `contentEmbedding` 用 pgvector(ADR-012) · 1536 维 OpenAI text-embedding-3-small
* TTL 策略 · 老数据(crawledAt > 30 天)定期归档(`scripts/cron/archive-trending.ts`)
* 复合唯一 `[platform, sourceItemId]` · 跨 vendor 去重(同一抖音爆款新榜 + 蝉妈妈都返回 · 只存一条)
* `BigInt` · 单条爆款 viewCount 可能超 21 亿 · int 不够

### §2.4 全局表跨表查询的合规边界

* **User ↔ IpAccount** · 必须 `where: { userId: ctx.user.id }` · 防止用户 A 查 B 的账号列表
* **User ↔ InviteCode** · admin 才能跨用户查 · 普通用户只能查自己创建的(createdById)
* **TrendingItem** · 任何登录用户都可读 · 但写仅 TrendingScraper Worker(rls 强制)

```sql
-- TrendingItem 写权限策略
CREATE POLICY trending_item_write_only_worker ON trending_items
  FOR INSERT WITH CHECK (current_setting('app.role', true) = 'worker');
```

---

## §3 账号聚合根 · IpAccount

> **本架构最重要的一张表**。其他 12 张实体都按它的 `id` 分区(LD-009 数据隔离 3 道闸)。
> 派生 · ARCHITECTURE.md §2.1 + 实测 spec.md §3.7 + ADR-009 / ADR-010

### §3.1 完整 Prisma model

```prisma
/// 账号聚合根 · 90% 业务实体按 id 隔离
model IpAccount {
  id              Int       @id @default(autoincrement())
  userId          Int       @map("user_id")

  // 基础定位
  name            String    @db.VarChar(100)
  // name · IP 账号显示名 · 实测 sally · "赵语AI"

  industry        String    @db.VarChar(64)
  // industry · 56 行业 key · 'beauty' | 'cosmetics' | ... | 'other'
  // 详见 lib/constants/industries.ts(ADR-012 常量)

  platform        String    @db.VarChar(32)
  // platform · 主平台 · 'douyin' | 'xiaohongshu' | 'shipinhao' | 'kuaishou' | 'bilibili'
  // 一个账号默认 1 主平台 · step3 包装时可生成多平台版本

  stage           String    @default("starter") @db.VarChar(32)
  // stage · 'starter'(起步)| 'growth'(成长)| 'breakout'(爆发)| 'plateau'(瓶颈)
  // 由 /diagnosis 8 步问卷 step1 推断 · 影响 PositioningAgent prompt

  // 用户输入(给 ContextAssembler 的种子数据 · 9 步反复用)
  personalInfo    String?   @db.Text @map("personal_info")
  // personalInfo · 用户自述 · 实测 sally · "12 年餐饮创业 · 现做 AI 智能体定制..."

  targetAudience  String?   @db.Text @map("target_audience")
  // targetAudience · 实测 · "需要定制智能体降本增效的老板和 opc 创业者"

  followersRange  String    @default("0-1000") @db.VarChar(32) @map("followers_range")
  // followersRange · '0-1000' | '1000-10000' | '10000-100000' | '100000+'
  // 影响 step4 执行计划

  ipPositioning   String?   @db.VarChar(255) @map("ip_positioning")
  // ipPositioning · IP 定位关键词 · 实测 · "ai 智能体定制"
  // step1/step3b 推断后写入

  goal            String?   @db.VarChar(64)
  // goal · 'start'(起号)| 'monetize'(变现)| 'scale'(规模化)| 'reposition'(重塑)

  currentRevenue  String?   @db.VarChar(32) @map("current_revenue")
  // currentRevenue · 'pre_revenue' | '10万以下' | '10-30万' | '30-100万' | '100万+'
  // step4b 用

  // 状态
  isActive        Boolean   @default(true) @map("is_active")
  // isActive · 软删除标记 · false 则不在 ipAccounts.list 显示 · 但数据保留

  archivedAt      DateTime? @map("archived_at")

  // 关系 · 12 张子实体 · 全部 onDelete: Cascade
  user                User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  stepDataList        StepData[]
  histories           History[]
  topics              Topic[]
  assets              Asset[]
  diagnosisReports    DiagnosisReport[]
  feedbackLogs        FeedbackLog[]
  evolutionProfile    EvolutionProfile?     // 1:1
  evolutionInsights   EvolutionInsight[]
  deepLearningArchives DeepLearningArchive[]
  knowledgeFavorites  KnowledgeFavorite[]
  knowledgeNotes      KnowledgeNote[]
  dailyTasks          DailyTask[]
  costLogs            CostLog[]

  // 元数据
  traceId         String?   @db.VarChar(64) @map("trace_id")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@map("ip_accounts")
  @@index([userId])
  @@index([userId, isActive])
  @@index([industry])         // admin 按行业分布查
  @@index([platform])         // admin 按平台分布查
}
```

### §3.2 状态机(stage / isActive / archive)

```
                  ┌──────────────┐
   注册成功后 ── ▶ │  Onboarding  │  ← 必经 · 走 /step/1 创第一个账号
                  │  (无账号)    │
                  └──────┬───────┘
                         │ 创建第一个 account
                         ▼
                  ┌──────────────┐
                  │   Active     │  ◀── isActive=true · activeAccountId=this.id
                  │ stage=starter│
                  └──────┬───────┘
                         │ /diagnosis 8 步问卷 推断 stage
                         ▼
              stage 变化(starter → growth → breakout → plateau)
                         │
                ┌────────┴────────┐
                │                 │
        用户停用              用户彻底删除
                │                 │
                ▼                 ▼
        ┌──────────────┐   ┌──────────────┐
        │  Archived    │   │  Hard Delete │
        │ isActive=false│  │ Cascade 12 表 │
        │ archivedAt=now│  └──────────────┘
        └──────────────┘
```

**关键** · `archivedAt`(软删) vs `Cascade delete`(硬删):
* 软删 · 默认 · 保留数据 · /accounts 列表不显示
* 硬删 · 用户在 /accounts 显式选"删除并清除所有数据" · 二次确认弹窗 + 输入账号名
* 法律合规 · 用户行使"被遗忘权"(GDPR / 个保法)时必须能硬删 · 7 天内执行

### §3.3 切换活跃账号(switchActive)

实现于 `trpc.ipAccounts.switchActive.mutation`:

```typescript
switchActive: protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // 1. 鉴权 · 用户拥有此账号
    const account = await prisma.ipAccount.findFirst({
      where: { id: input.id, userId: ctx.user.id, isActive: true }
    });
    if (!account) throw new TRPCError({ code: 'FORBIDDEN' });

    // 2. 更新 User.activeAccountId
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { activeAccountId: input.id }
    });

    // 3. 客户端处理(详见 ADR-011)·
    //    - localStorage.setItem('aiip_active_account_id', String(input.id))
    //    - await stepData.getAll(input.id) 预热(并行 9 步)
    //    - window.location.reload()
    return { success: true, account };
  });
```

> 客户端的 reload + 预热逻辑见 [ARCHITECTURE.md §3.4 规则 3](ARCHITECTURE.md)。

### §3.4 LS 同步约定

| LS Key | 内容 | 时机 |
|---|---|---|
| `aiip_active_account_id` | 当前活跃账号 ID | switchActive 后立即写 |
| `aiip_memory_acc_${id}_*` | 该账号的 stepData 镜像(详见 §4) | 每次 stepData.save 后双写 |

切换账号时 · 老账号的 LS 镜像**保留**(用户切回来时仍可立即看)· 不强制清。

### §3.5 索引设计

| 索引 | 用途 |
|---|---|
| `[userId]` | 查用户的所有账号(/accounts 列表) |
| `[userId, isActive]` | 查用户的活跃账号(默认筛掉 archived) |
| `[industry]` | admin 按行业查分布 |
| `[platform]` | admin 按平台查分布 |

---

## §4 9 步主线 · StepData

> 9 步向导的核心存储 · 复合唯一 `[account_id, step_key]` · 一个账号每个 step 仅 1 条 latest。
> 历史快照走 StepDataHistory 子表(可选 · MVP 不强求)· 主表只存 latest。
> 派生 · ARCHITECTURE.md §3.5 + spec.md §3.4 + ADR-011 LS↔DB 双写 + LD-013/14

### §4.1 StepData 主表 prisma model

```prisma
/// 9 步向导主存储 · 一账号一 step 仅 1 条 latest · LS 双写
model StepData {
  id            Int       @id @default(autoincrement())
  accountId     Int       @map("account_id")

  stepKey       String    @db.VarChar(16) @map("step_key")
  // stepKey · 'step1' | 'step3' | 'step3b' | 'step4' | 'step4b'
  //         | 'step5' | 'step6' | 'step7' | 'step8'
  // 没有 step2 · 实测 spec.md §ⅩⅦ · 路由 404

  // 用户输入字段(`last*` · 沿用 spec.md §3.4 实测命名)
  inputs        Json      @map("inputs")
  // 例 · step3 · { lastPlatform, lastPersonalInfo, lastTargetAudience, lastCurrentAccount }
  // 详见 §4.3 输入 schema

  // AI 输出 · 9 步各自 schema 不同(详见 §4.4)
  result        Json?
  // step4/step7 是 markdown 字符串(原版兼容)· 包成 { result: string }
  // 其他 step 是结构化对象

  // 版本 + schema 版本
  version       Int       @default(0)
  // version · 乐观锁 · 详见 LD-014 + R-13 + ADR-011
  // 每次 update increment · 冲突 toast 提示用户

  schemaVersion String    @default("3.0") @db.VarChar(8) @map("schema_version")
  // schemaVersion · 实测原版有 'v2' / 'v3' 后缀 · 用于"读旧 + 写新"策略
  // 本架构默认 3.0 · 旧 v2 数据迁移时升级

  // 状态
  status        String    @default("completed") @db.VarChar(16)
  // status · 'in_progress' | 'completed' | 'failed' | 'fallback'

  isFallback    Boolean   @default(false) @map("is_fallback")
  // isFallback · LLM 生成失败时降级模板返回 · UI 标"系统繁忙生成的备用版本"

  // 元数据(性能 / 成本 · 给 cost_log 用)
  durationMs    Int?      @map("duration_ms")
  tokensUsed    Int?      @map("tokens_used")
  modelUsed     String?   @db.VarChar(64) @map("model_used")
  // modelUsed · 实际使用的 LLM · 'claude-sonnet-4-6' / 'gpt-4o-mini' / ...

  agentId       String    @db.VarChar(64) @map("agent_id")
  // agentId · 哪个 Specialist 生成 · 'CopywritingAgent' | 'BrandingAgent' | ...

  traceId       String?   @db.VarChar(64) @map("trace_id")

  // 关系
  ipAccount     IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("step_data")
  @@unique([accountId, stepKey])      // 一账号一 step 仅 1 条
  @@index([accountId])
  @@index([accountId, status])        // /ip-plan 查完成进度用
}
```

### §4.2 LS 镜像约定(详见 ADR-011)

| LS Key 模式 | 对应 stepKey | 大小估计 |
|---|---|:-:|
| `aiip_memory_acc_${id}_step1` | step1 | ~1KB |
| `aiip_memory_acc_${id}_step3_account_v3` | step3 | ~8KB(实测) |
| `aiip_memory_acc_${id}_step3b_persona` | step3b | ~6KB |
| `aiip_memory_acc_${id}_step4_execution_v2` | step4 | ~16KB |
| `aiip_memory_acc_${id}_step4b_monetization` | step4b | ~8KB |
| `aiip_memory_acc_${id}_step5_topics_v2` | step5 | ~22KB |
| `aiip_memory_acc_${id}_step6_shooting` | step6 | ~5KB |
| `aiip_memory_acc_${id}_step7_copywriting` | step7 | ~1KB |
| `aiip_memory_acc_${id}_step8_livestream` | step8 | ~1KB |
| **合计** | 9 keys | ~70KB |

> 实测 sally 账号 ~70KB · 远低于 LS 5MB 上限。

### §4.3 输入字段 schema(`last*` 命名沿用 spec.md 实测)

```typescript
// src/lib/schemas/step-data-inputs.ts
export const Step1InputSchema = z.object({
  lastIndustry: z.enum(INDUSTRY_KEYS).or(z.string()),  // 56 枚举或自定义
});

export const Step3InputSchema = z.object({
  lastPlatform: z.enum(PLATFORM_KEYS),                 // 5 平台
  lastPersonalInfo: z.string().min(20).max(500),
  lastTargetAudience: z.string().min(5).max(200),
  lastCurrentAccount: z.string().max(50).default("新账号"),
});

export const Step3bInputSchema = z.object({
  lastPlatform: z.enum(PLATFORM_KEYS),
  lastPersonalInfo: z.string().min(50).max(800),
  lastTargetAudience: z.string().max(200),
  lastStrengths: z.string().max(200),
  lastStory: z.string().max(500),
});

export const Step4InputSchema = z.object({
  lastPlatform: z.enum(PLATFORM_KEYS),
  lastFollowers: z.enum(['0-1000','1000-10000','10000-100000','100000+']),
  lastPersonalInfo: z.string().min(50),
  lastGoals: z.enum(['start','monetize','scale','reposition']),
});

export const Step4bInputSchema = z.object({
  lastProductDesc: z.string().min(20).max(300),
  lastTargetAudience: z.string().max(200),
  lastIpPositioning: z.string().max(100),
  lastCurrentRevenue: z.enum(['pre_revenue','10万以下','10-30万','30-100万','100万+']),
});

export const Step5InputSchema = z.object({
  lastIndustry: z.string(),
  lastProduct: z.string().min(5).max(200),
  lastCategory: z.enum(['traffic','monetize','persona','cognition','case']),
});

export const Step6InputSchema = z.object({
  lastSourceCopy: z.string().min(50).max(5000),
});

export const Step7InputSchema = z.object({
  lastScriptType: z.enum(SCRIPT_TYPE_KEYS),  // 20 脚本
  lastElements: z.array(z.enum(HOT_ELEMENT_KEYS)).max(5),  // 22 元素 · 最多 5 个
  lastTopic: z.string().min(2).max(200),
});

export const Step8InputSchema = z.object({
  lastPlatform: z.enum(PLATFORM_KEYS),
  lastProductInfo: z.string().max(500),
  lastTargetAudience: z.string().max(200),
  lastExperience: z.enum(['beginner','intermediate','advanced']),
});
```

### §4.4 AI 输出 schema(9 步各自结构 · 来自 schemas-summary.md)

#### step1 · 行业选择

```typescript
export const Step1ResultSchema = z.object({
  industry: z.string(),                     // 选定行业
  marketAnalysis: z.string(),               // 市场分析摘要
  competitionLevel: z.enum(['low','mid','high']),
  monetizationPotential: z.string(),
  recommendation: z.string(),               // 给该用户的具体建议
});
```

#### step3 · 账号包装(实测最复杂 · 8KB)

```typescript
export const Step3ResultSchema = z.object({
  nickname: z.object({
    recommended: z.array(z.object({
      name: z.string(),
      reason: z.string(),
      searchability: z.string(),
    })).length(5),
    namingStrategy: z.object({
      principles: z.array(z.string()).length(4),
      avoidList: z.array(z.string()).length(4),
      platformDifference: z.string(),
    }),
  }),
  avatar: z.object({
    style: z.string(),
    colorScheme: z.string(),
    elements: z.array(z.string()).length(2),
    expression: z.string(),
    taboos: z.array(z.string()).length(4),
    prompt: z.string(),                     // 给 ImageGen 的 DALL-E 3 prompt
    referenceDescription: z.string(),
  }),
  background: z.object({
    style: z.string(),
    layout: z.string(),
    elements: z.array(z.string()).length(4),
    text: z.string(),
    colorTone: z.string(),
    prompt: z.string(),                     // 背景图 prompt
    platformVersions: z.array(z.object({
      platform: z.string(),
      size: z.string(),                     // 实测 · "1128x636 像素"
      adjustments: z.string(),
    })).length(3),
  }),
  bio: z.object({
    versions: z.array(z.object({
      platform: z.string(),
      bio: z.string(),
      structure: z.string(),
      highlights: z.array(z.string()).length(3),
      seoKeywords: z.array(z.string()).length(5),
    })).length(6),                          // 6 平台版本(含 niche 平台)
    bioFormula: z.string(),
    keywords: z.array(z.string()).length(5),
  }),
  overallStrategy: z.object({
    visualIdentity: z.string(),
    firstImpression: z.string(),
    conversionPath: z.string(),
    platformPriority: z.array(z.object({
      platform: z.string(),
      priority: z.enum(['高','中','低']),
      reason: z.string(),
    })).length(3),
  }),
});
```

#### step3b · 人设定制(6KB · 5 大子结构)

```typescript
export const Step3bResultSchema = z.object({
  coreIdentity: z.object({
    title: z.string(),                              // 一句话定位
    slogan: z.array(z.string()).length(3),
    memoryPoints: z.array(z.object({
      point: z.string(),
      description: z.string(),
      implementation: z.string(),
    })).length(3),
    differentiator: z.string(),
    personalityTraits: z.array(z.string()).length(3),
  }),
  thoughtSystem: z.object({
    coreBeliefs: z.array(z.object({
      belief: z.string(),
      explanation: z.string(),
      contentAngle: z.string(),
    })).length(3),
    uniqueViews: z.array(z.object({
      view: z.string(),
      reasoning: z.string(),
      sampleContent: z.string(),
    })).length(2),
    catchphrases: z.array(z.object({
      phrase: z.string(),
      usage: z.string(),
      effect: z.string(),
    })).length(3),
  }),
  contentPersona: z.object({
    toneOfVoice: z.object({
      description: z.string(),
      dos: z.array(z.string()).length(2),
      donts: z.array(z.string()).length(2),
      sampleScript: z.string(),
    }),
    visualStyle: z.object({
      description: z.string(),
      clothing: z.string(),
      scene: z.string(),
      props: z.array(z.string()).length(4),
    }),
    contentPillars: z.array(z.object({
      pillar: z.string(),
      description: z.string(),
      percentage: z.string(),                       // "40%"
      frequency: z.string(),                        // "每周 2-3 次"
      examples: z.array(z.string()).length(3),
    })).length(4),
  }),
  trustBuilding: z.object({
    credentials: z.array(z.object({
      credential: z.string(),
      howToShow: z.string(),
    })).length(3),
    socialProof: z.array(z.object({
      proof: z.string(),
      howToCollect: z.string(),
    })).length(2),
    storyAngle: z.object({
      mainStory: z.string(),
      turningPoint: z.string(),
      howToTell: z.string(),
    }),
  }),
  personaRoadmap: z.object({
    phase1: z.object({ period: z.string(), focus: z.string(), milestones: z.array(z.string()).length(3) }),
    phase2: z.object({ period: z.string(), focus: z.string(), milestones: z.array(z.string()).length(4) }),
    phase3: z.object({ period: z.string(), focus: z.string(), milestones: z.array(z.string()).length(4) }),
  }),
});
```

#### step4 · 执行计划(纯 markdown · 16KB · 不结构化)

```typescript
export const Step4ResultSchema = z.object({
  result: z.string().min(2000).max(50000),  // markdown 全文
  // ⚠️ 不结构化(原版兼容)· LLM Judge 评分校验内容质量
  metadata: z.object({
    sectionsDetected: z.array(z.string()),  // 解析出的章节标题(给 UI 锚点用)
  }).optional(),
});
```

#### step4b · 变现路径(8KB · 阶梯式)

```typescript
export const Step4bResultSchema = z.object({
  currentAnalysis: z.object({
    industry: z.string(),
    marketSize: z.string(),
    competitionLevel: z.string(),
    monetizationPotential: z.string(),
  }),
  ladder: z.array(z.object({
    stage: z.string(),                              // "0→90 万"
    title: z.string(),
    timeline: z.string(),
    coreStrategy: z.string(),
    products: z.array(z.object({
      name: z.string(),
      price: z.string(),
      targetCustomers: z.string(),
      monthlyGoal: z.string(),
      monthlyRevenue: z.string(),
      F: z.string(),                                // FABE 模型
      A: z.string(),
      B: z.string(),
      E: z.string(),
    })).length(3),
    trafficStrategy: z.string(),
    conversionFlow: z.array(z.string()).length(3),
    keyActions: z.array(z.string()).length(4),
    riskPoints: z.array(z.string()).length(3),
  })).length(3),
  revenueStructure: z.object({
    primary: z.object({ source: z.string(), percentage: z.string(), description: z.string() }),
    secondary: z.array(z.object({ source: z.string(), percentage: z.string(), description: z.string() })).length(2),
  }),
  successCases: z.array(z.object({
    name: z.string(),
    industry: z.string(),
    path: z.string(),
    result: z.string(),
    keyTakeaway: z.string(),
  })).length(2),
});
```

#### step5 · 爆款选题(22KB · 5 类 × 20 条)

```typescript
export const TopicItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  hook: z.string(),                       // 开场钩子
  structure: z.string(),                  // 结构描述
  formula: z.string(),                    // 公式
  logicType: z.string().optional(),       // 仅 traffic 类有 · "恐惧" / "贪念" 等
  platform: z.string(),
  difficulty: z.enum(['简单','中等','困难']),
  viralPotential: z.string(),             // "⭐⭐⭐⭐"
});

export const Step5ResultSchema = z.object({
  results: z.object({
    traffic:  z.array(TopicItemSchema).length(20),
    monetize: z.array(TopicItemSchema).length(20),
    persona:  z.array(TopicItemSchema).length(20),
    cognition:z.array(TopicItemSchema).length(20),
    case:     z.array(TopicItemSchema).length(20),
  }),
});
```

#### step6 · 拍摄计划(13 列分镜表)

```typescript
export const ShotItemSchema = z.object({
  shotNumber: z.number(),
  duration: z.string(),                   // "0:00-0:05"
  scene: z.string(),
  camera: z.string(),
  shot: z.string(),                       // 景别
  movement: z.string(),                   // 运动
  action: z.string(),
  voiceover: z.string(),
  prop: z.string(),
  lighting: z.string(),
  music: z.string(),
  transition: z.string(),
  notes: z.string(),
});

export const Step6ResultSchema = z.object({
  shotList: z.array(ShotItemSchema).min(3).max(20),
  equipment: z.string(),
  schedule: z.string(),
  totalDuration: z.string(),
});
```

#### step7 · 文案生成(纯 markdown · 1KB+)

```typescript
export const Step7ResultSchema = z.object({
  result: z.string().min(200).max(5000),  // markdown 文案
  metadata: z.object({
    scriptType: z.string(),
    elements: z.array(z.string()),
    structureSummary: z.string(),         // 结构摘要(给 UI 用)
    estimatedDuration: z.string(),        // "60-90 秒"
  }).optional(),
});
```

#### step8 · 直播策划(双产物)

```typescript
export const Step8ResultSchema = z.object({
  result: z.string().min(500),            // 主版本话术
  optimizedResult: z.string().min(500).optional(),  // 优化版
  // ⚠️ schema 推断 · sally 实测 lastResult=null
});
```

### §4.5 schemaVersion 兼容策略

```typescript
// 读时尝试多版本(LD-013 schema 一致性)
async function readStepData(accountId: number, stepKey: string) {
  const row = await prisma.stepData.findUnique({
    where: { accountId_stepKey: { accountId, stepKey } }
  });
  if (!row) return null;

  const schema = pickSchemaByVersion(stepKey, row.schemaVersion);
  const parsed = schema.safeParse(row.result);
  if (!parsed.success) {
    logger.error({ accountId, stepKey, version: row.schemaVersion }, 'schema mismatch');
    return null;
  }
  return parsed.data;
}
```

### §4.6 索引 + 性能

| 索引 | 用途 |
|---|---|
| `[accountId, stepKey]` UNIQUE | 主查 · 必有 |
| `[accountId]` | /ip-plan 查全部 9 步 |
| `[accountId, status]` | 进度查询(`completed` 计数) |
| `[updatedAt]` (admin) | 跨账号查最近活跃 |

> JSON 字段 `result` 不建索引 · 9 步全量字段都需要时一次性 read · 不需 partial query。

---

## §5 历史 + 资产 · History · Topic · Asset

> 这 3 张表是用户**生成内容的沉淀** · 也是反馈飞轮的"被反馈对象"。
> 关联 · ADR-008 反馈飞轮 + ADR-014 trace_id 贯穿

### §5.1 History · 生成历史(L3 Recall Memory)

```prisma
/// 用户每次生成的快照 · 服务于 /history /my-topics 检索 + 反馈飞轮溯源
model History {
  id          Int       @id @default(autoincrement())
  accountId   Int       @map("account_id")

  // 生成来源
  agentId     String    @db.VarChar(64) @map("agent_id")
  // agentId · 'CopywritingAgent' | 'VideoAgent' | 'TopicAgent' | ...

  agentMode   String?   @db.VarChar(32) @map("agent_mode")
  // agentMode · CopywritingAgent 的 'step7' | 'free' | 'boom' | 'acquisition'

  sourceType  String    @db.VarChar(32) @map("source_type")
  // sourceType · 'step7' | 'generate' | 'boom-generate' | 'video-analysis' | ...
  //            标识具体哪个 URL 触发(用于按来源筛选)

  // 输入摘要(用于显示卡片标题 · 不存全量 input)
  inputSummary String   @db.VarChar(255) @map("input_summary")
  // 例 · "搞辩论 · 反差/猎奇 · 主题: 为什么有的人赚钱那么轻松"

  // 内容
  content     String    @db.Text
  // content · markdown 文案 / JSON 字符串(VideoAgent storyboard 等)

  contentType String    @default("markdown") @db.VarChar(16) @map("content_type")
  // contentType · 'markdown' | 'json' | 'mixed'

  // 标签(用于筛选)· 复制 step7 的 scriptType + elements
  scriptType  String?   @db.VarChar(32) @map("script_type")
  elements    String[]  @default([])
  // elements · ['fear', 'social_proof', ...] · 22 元素 keys

  // 性能 / 成本
  tokensUsed  Int?      @map("tokens_used")
  modelUsed   String?   @db.VarChar(64) @map("model_used")
  durationMs  Int?      @map("duration_ms")

  // 状态
  isFallback  Boolean   @default(false) @map("is_fallback")
  isFavorited Boolean   @default(false) @map("is_favorited")
  // isFavorited · 用户是否收藏到 /my-topics(对应 Topic 表)

  // 反馈(冗余字段 · 加速 /history 列表显示 · 真理来源仍是 FeedbackLog)
  ratingGood  Int       @default(0) @map("rating_good")
  ratingBad   Int       @default(0) @map("rating_bad")

  traceId     String?   @db.VarChar(64) @map("trace_id")
  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  feedbacks   FeedbackLog[]

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // 可选 · 内容向量(给 ContextAssembler "找相似历史"用 · 详见 ADR-012)
  contentEmbedding Unsupported("vector(1536)")? @map("content_embedding")

  @@map("histories")
  @@index([accountId])
  @@index([accountId, agentId])
  @@index([accountId, scriptType])
  @@index([accountId, createdAt(sort: Desc)])
  @@index([accountId, isFavorited])
  @@index([traceId])
}
```

**关键决策**:
* `inputSummary` 是预格式化字符串 · 直接显示 · 不需要前端再格式化(降低渲染延迟)
* `ratingGood/Bad` 是冗余字段 · 真理来源是 FeedbackLog · 但 /history 列表 N 条都查 FeedbackLog 太慢
* `contentEmbedding` 是 nullable · MVP 不做 history embedding(节省成本) · 后期开启
* `elements` 用 Postgres array 类型 · 查询时 `WHERE elements @> ARRAY['fear']`

### §5.2 Topic · 选题收藏(`/my-topics`)

```prisma
/// 用户从 /step/5 或 /trending 收藏的选题 · 可一键跳 /step/7 生成文案
model Topic {
  id            Int       @id @default(autoincrement())
  accountId     Int       @map("account_id")

  // 选题内容(从 step5 或 trending 复制)
  title         String    @db.VarChar(255)
  hook          String    @db.Text
  structure     String?   @db.Text
  formula       String?   @db.Text

  // 分类(对应 step5 的 5 类 + 14 形式)
  category      String?   @db.VarChar(32)
  // category · 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case'

  presentStyle  String?   @db.VarChar(32) @map("present_style")
  // presentStyle · 14 形式之一 · NULL 表示未分类

  platform      String?   @db.VarChar(32)
  difficulty    String?   @db.VarChar(16)
  viralPotential String?  @db.VarChar(16) @map("viral_potential")
  logicType     String?   @db.VarChar(32) @map("logic_type")

  // 来源
  sourceType    String    @db.VarChar(32) @map("source_type")
  // sourceType · 'step5_generated' | 'trending_imported' | 'manual'

  sourceTrendingId Int?   @map("source_trending_id")
  // sourceTrendingId · 如果是从 trending 收藏 · 关联原 TrendingItem.id

  // 用户标签(自定义)
  userTags      String[]  @default([]) @map("user_tags")

  // 状态
  isUsed        Boolean   @default(false) @map("is_used")
  // isUsed · 是否已用此选题生成过文案 · UI 展示 ✓

  usedAt        DateTime? @map("used_at")
  generatedHistoryId Int? @map("generated_history_id")
  // generatedHistoryId · 跳 /step/7 生成后的 History.id · 双向关联

  traceId       String?   @db.VarChar(64) @map("trace_id")
  ipAccount     IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  createdAt     DateTime  @default(now()) @map("created_at")

  @@map("topics")
  @@index([accountId])
  @@index([accountId, category])
  @@index([accountId, isUsed])
  @@index([accountId, createdAt(sort: Desc)])
}
```

**关键决策**:
* 不复用 History 表 · Topic 是"待生成的选题"· History 是"已生成的产物"· 语义不同
* `sourceTrendingId` nullable · 因为可能是 step5 自生成(不是 trending 来的)
* `userTags` 给用户自定义标签(`["金句"," 转化高"]`)· 后期产品迭代加

### §5.3 Asset · 媒体资产

```prisma
/// 用户上传文件 · AI 生成图片 · 语音录音
model Asset {
  id          Int       @id @default(autoincrement())
  accountId   Int       @map("account_id")

  // 类型
  assetType   String    @db.VarChar(32) @map("asset_type")
  // assetType · 'avatar_ai'(AI 生成头像)
  //          | 'background_ai'(AI 生成背景)
  //          | 'storyboard_ai'(/ai-video 分镜场景图)
  //          | 'user_upload'(用户上传 PDF/Word/CSV/MD/TXT)
  //          | 'voice_recording'(VoiceChat 录音 · 可选)

  // 元数据
  fileName    String    @db.VarChar(255) @map("file_name")
  mimeType    String    @db.VarChar(100) @map("mime_type")
  sizeBytes   Int       @map("size_bytes")

  // 存储
  storageProvider String @default("s3") @db.VarChar(16) @map("storage_provider")
  // storageProvider · 's3' | 'oss' | 'supabase'

  storageKey  String    @db.VarChar(512) @map("storage_key")
  // storageKey · S3 key / OSS path · 不直接暴露给前端

  publicUrl   String?   @db.VarChar(512) @map("public_url")
  // publicUrl · CDN 直链 · 部分场景用(头像 / 背景图)
  //           其他用 signed URL(用户上传文件防泄漏)

  // 关联(可选)
  relatedStepKey String? @db.VarChar(16) @map("related_step_key")
  // relatedStepKey · 关联到 step3(头像 + 背景)/ step6 / ai-video 等

  relatedHistoryId Int? @map("related_history_id")
  // relatedHistoryId · 关联到 History.id

  // AI 生成元数据(assetType 是 *_ai 时填)
  generationPrompt String? @db.Text @map("generation_prompt")
  generationModel  String? @db.VarChar(64) @map("generation_model")
  // generationModel · 'dall-e-3' | 'midjourney' | 'wenxin' | ...

  // 解析元数据(assetType 是 user_upload 时填)
  parsedText  String?   @db.Text @map("parsed_text")
  // parsedText · FileParserWorker 解析后的纯文本 · 给 DeepLearnAgent 用

  parsingStatus String  @default("pending") @db.VarChar(16) @map("parsing_status")
  // parsingStatus · 'pending' | 'processing' | 'completed' | 'failed'

  parsingError String?  @db.Text @map("parsing_error")

  traceId     String?   @db.VarChar(64) @map("trace_id")
  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("assets")
  @@index([accountId])
  @@index([accountId, assetType])
  @@index([accountId, relatedStepKey])
  @@index([parsingStatus])  // FileParserWorker 拉 pending 用
}
```

**关键决策**:
* 单 Asset 表覆盖所有"非结构化资产"· assetType 区分 · 节省维护
* `storageKey` 不直接暴露 · 用 signed URL(防资产泄漏)· 头像 / 背景图 公开 publicUrl(CDN)
* `parsedText` · FileParser Worker 异步填 · DeepLearnAgent 走样本时读
* 文件大小硬上限 20MB(spec.md §ⅩⅩⅩⅣ + LD-018 R-14 输入护栏)
* MIME 白名单 · pdf / docx / xlsx / md / txt / csv / png / jpg / mp3(VoiceChat 可选)

### §5.4 三表协同的典型流程

```
流程 · 用户从 /step/5 收藏选题 → 跳 /step/7 生成文案 → 看 /history
─────────────────────────────────────────────────────────────────

1. 用户在 /step/5 看到选题 · 点 ❤️
   → INSERT INTO topics(...) WITH source_type='step5_generated', is_used=false

2. 用户跳 /step/7 · query 自动 prefill `lastTopic = topic.title`
   → /step/7 生成文案 · 写 history
   → INSERT INTO histories(...) WITH agent_id='CopywritingAgent', mode='step7'

3. /step/7 完成后 · 反向更新 topic
   → UPDATE topics SET is_used=true, used_at=NOW(), generated_history_id=$historyId

4. 用户进 /history 看历史
   → SELECT FROM histories WHERE account_id=? ORDER BY created_at DESC LIMIT 20

5. 用户点 👍
   → INSERT INTO feedback_logs WITH history_id=$id
   → UPDATE histories SET rating_good = rating_good + 1
```

### §5.5 索引 + 性能

| 表 | 高频查询 | 索引 |
|---|---|---|
| histories | /history 时间倒序 | `[accountId, createdAt DESC]` |
| histories | /history 按类型筛选 | `[accountId, agentId]` + `[accountId, scriptType]` |
| histories | trace_id 反查 | `[traceId]` |
| topics | /my-topics 5 类 tab | `[accountId, category]` |
| topics | /my-topics 是否已用 | `[accountId, isUsed]` |
| assets | step3 头像 / 背景查 | `[accountId, relatedStepKey]` |
| assets | FileParserWorker 拉 pending | `[parsingStatus]`(无 account · 后台任务) |

---

## §6 诊断 + 进化(4 张 · 反馈飞轮核心)

> 这 4 张表共同支撑 **反馈飞轮 5 阶段闭环**(ADR-008)· 是 QuanQn 最有创意的产品机制的物理载体。
> 关联 · ADR-008 + ADR-009 + ADR-014 + LD-008 · 详见 [ARCHITECTURE.md §5.4](ARCHITECTURE.md)

### §6.1 DiagnosisReport · 8 维度 IP 诊断

```prisma
/// 8 步问卷 → 7 维度健康度报告 · 给 ContextAssembler 注入"用户当前短板"
model DiagnosisReport {
  id          Int       @id @default(autoincrement())
  accountId   Int       @map("account_id")

  // 用户 8 步问卷答复(完整保留 · 给后续诊断对比)
  answers     Json
  // answers · [{ step: 1, selectedItems: [...], comment: "..." }, ...] · 8 项

  // 7 维度报告
  dimensions  Json
  // dimensions · [{ name, score, issues, suggestions, priority }] · 7 项

  // 总分(0-100)
  overallScore  Int     @map("overall_score")

  // 推断的当前阶段(影响后续 Specialist prompt)
  inferredStage String  @db.VarChar(32) @map("inferred_stage")
  // inferredStage · 'starter' | 'growth' | 'breakout' | 'plateau'
  // 推断依据 · 8 步问卷里的 step1.stage 字段 + 维度分布

  topPriority   String  @db.Text @map("top_priority")
  // topPriority · 用户最该先做的 1 件事 · 显示在报告顶部 + CTA 按钮

  // 推荐跳转(用户在报告页可一键跳)
  recommendedSteps String[] @default([]) @map("recommended_steps")
  // recommendedSteps · ['step1', 'step3'] · 按 priority 排序的 3-5 step keys

  // 元数据
  agentId     String    @default("DiagnosisAgent") @db.VarChar(64) @map("agent_id")
  modelUsed   String?   @db.VarChar(64) @map("model_used")
  tokensUsed  Int?      @map("tokens_used")
  durationMs  Int?      @map("duration_ms")
  isFallback  Boolean   @default(false) @map("is_fallback")

  traceId     String?   @db.VarChar(64) @map("trace_id")
  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("diagnosis_reports")
  @@index([accountId])
  @@index([accountId, createdAt(sort: Desc)])  // 拉 latest 报告
}
```

**dimensions JSON 结构(zod schema)**:

```typescript
export const DiagnosisDimensionSchema = z.object({
  name: z.string(),                              // "定位清晰度" / "账号包装" / ...
  score: z.number().int().min(0).max(100),
  issues: z.array(z.string()).max(5),
  suggestions: z.array(z.string()).max(5),
  priority: z.number().int().min(1).max(7),     // 1 = 最高优先级
});

export const DiagnosisReportSchema = z.object({
  dimensions: z.array(DiagnosisDimensionSchema).length(7),
  overallScore: z.number().int().min(0).max(100),
  topPriority: z.string(),
  recommendedSteps: z.array(z.string()).max(5),
});
```

**8 维度问卷 vs 7 维度报告**:
* 8 步问卷(spec.md §8.5.1 实测)· step1 是基本信息(行业/产品/阶段) · 不出维度报告
* 7 维度报告 · step2-8 各对应 1 维度(定位 / 包装 / 流量 / 价值 / 案例 / 人设 / 内容状态)

**ContextAssembler 用法**:
```typescript
const latest = await prisma.diagnosisReport.findFirst({
  where: { accountId },
  orderBy: { createdAt: 'desc' }
});
// 注入 prompt 段 · "用户当前 7 维度短板 · 优先项 · ${latest.topPriority}"
```

### §6.2 FeedbackLog · 👍/👎 反馈日志(飞轮燃料)

```prisma
/// 用户对 Specialist 输出的反馈 · 飞轮的"燃料"
model FeedbackLog {
  id          Int       @id @default(autoincrement())
  accountId   Int       @map("account_id")
  userId      Int       @map("user_id")
  // userId · 冗余 · 给 admin 跨账号查同一用户反馈分布

  // 反馈对象
  historyId   Int?      @map("history_id")
  // historyId · 关联 History.id · 大部分反馈是对生成历史

  rateableType String   @db.VarChar(32) @map("rateable_type")
  // rateableType · 'history' | 'topic' | 'storyboard' | 'diagnosis_suggestion'

  rateableId  Int       @map("rateable_id")
  // rateableId · 配合 rateableType 做多态关联

  // 反馈内容
  rating      String    @db.VarChar(8)
  // rating · 'good' | 'bad'

  comment     String?   @db.Text
  // comment · 用户可选补充意见 · 用于 EvolutionAgent 提取偏好金句

  // 元数据(从被反馈对象冗余 · 加速 EvolutionAgent 跑批)
  agentId     String    @db.VarChar(64) @map("agent_id")
  agentMode   String?   @db.VarChar(32) @map("agent_mode")
  scriptType  String?   @db.VarChar(32) @map("script_type")
  elements    String[]  @default([])

  // 飞轮状态(EvolutionAgent 跑批后标记)
  consumedByEvolution Boolean   @default(false) @map("consumed_by_evolution")
  // consumedByEvolution · 是否被某次 EvolutionAgent 跑批用过 · 不重复用

  consumedAt          DateTime? @map("consumed_at")
  consumedByInsightId Int?      @map("consumed_by_insight_id")

  traceId     String?   @db.VarChar(64) @map("trace_id")
  // traceId · 关联到原 LLM 调用 · 一路追溯到 prompt + context

  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])
  // user 用 default `Restrict` · 删用户前要先清反馈(法律 / 审计要求)

  history     History?  @relation(fields: [historyId], references: [id], onDelete: SetNull)

  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("feedback_logs")
  @@index([accountId])
  @@index([accountId, rating])
  @@index([accountId, consumedByEvolution])  // EvolutionAgent 拉未消费反馈
  @@index([accountId, agentId])              // 按 Specialist 看反馈分布
  @@index([accountId, createdAt(sort: Desc)])
  @@index([traceId])
  @@index([userId])
}
```

**关键决策**:
* `consumedByEvolution` flag · 防止同条反馈被多次 EvolutionAgent 跑批用 · 保证飞轮 insights 增量更新
* `userId` 冗余 · 删账号但保留用户时仍能查反馈历史(虽然此时 accountId 也保留)
* `comment` nullable · 大部分用户只点 👍/👎 不写文字 · 但有文字时是飞轮金句来源
* `rateableType` + `rateableId` 是多态关联 · 跟 prisma 单态偏好相反 · 但产品语义需要(可反馈对象多)

**飞轮 5 阶段中的角色**:
| Phase | 操作 |
|---|---|
| 1 生成 | History 写入(含 trace_id) |
| 2 反馈 | feedback_logs INSERT + EvolutionProfile.feedbackCount++ |
| 3 触发 | 累计 ∈ {5,20,50,100} → enqueue EvolutionAgent |
| 4 跑批 | `WHERE consumed_by_evolution=false LIMIT N` 拉未消费反馈 → LLM 聚合 → mark consumed |
| 5 注入 | ContextAssembler 读 EvolutionProfile.latestInsight |

### §6.3 EvolutionProfile · 当前进化状态(每账号 1 行)

```prisma
/// 反馈飞轮的"latest 状态" · 每账号 1 行(1:1 IpAccount)
model EvolutionProfile {
  id          Int       @id @default(autoincrement())
  accountId   Int       @unique @map("account_id")  // 1:1

  // 等级 + 计数
  level       String    @default("L1") @db.VarChar(4)
  // level · 'L1' | 'L2' | 'L3' | 'L4' | 'L5' · 详见 ARCHITECTURE §5.6

  feedbackCountGood Int  @default(0) @map("feedback_count_good")
  feedbackCountBad  Int  @default(0) @map("feedback_count_bad")
  feedbackCountTotal Int @default(0) @map("feedback_count_total")
  // feedbackCountTotal · 冗余 · 升级阈值检查用(避免 good+bad 重算)

  satisfactionRate Float? @map("satisfaction_rate")
  // satisfactionRate · good / (good + bad) · L1 = NULL(分母 0)

  // 进化方向
  currentDirection String @default("综合") @db.VarChar(32) @map("current_direction")
  // currentDirection · '综合' | '创意性' | '转化率' | '真实感'
  // L4+ 才允许细分 · 否则强制 '综合'

  autoEvolutionEnabled Boolean @default(false) @map("auto_evolution_enabled")
  // autoEvolutionEnabled · L3+ 可开 · 累计 5 新反馈自动触发跑批

  // Latest insight(从 EvolutionInsight 冗余最新一条)
  latestInsightId Int?  @map("latest_insight_id")
  latestInsight   Json? @map("latest_insight")
  // latestInsight · ContextAssembler 直接读这里 · 不需要再 join EvolutionInsight 表

  // 学习样本计数(冗余 · 给 /evolution 仪表盘显示)
  deepLearningCount Int @default(0) @map("deep_learning_count")

  // 时间
  lastEvolvedAt   DateTime? @map("last_evolved_at")
  lastUpgradedAt  DateTime? @map("last_upgraded_at")
  // lastUpgradedAt · 上次升级到新等级的时间(L1→L2 / L2→L3 / ...)

  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("evolution_profiles")
  @@index([level])               // admin 看 L5 用户分布
  @@index([accountId, level])
}
```

**latestInsight JSON 结构**:

```typescript
export const EvolutionInsightContentSchema = z.object({
  preferredCatchphrases: z.array(z.string()).max(10),
  // 用户偏好金句 · 注入 prompt "用户喜欢用这些表达"

  styleTone: z.string(),                                  // "活泼" / "严谨" / "中性"
  avoidList: z.array(z.string()).max(10),
  strongPoints: z.array(z.string()).max(5),               // 用户认可的角度
  weakPoints: z.array(z.string()).max(5),                 // 用户反对的角度
});
```

**关键决策**:
* `latestInsight` 冗余存 1 份 · 加速 ContextAssembler 读取(不需要 join EvolutionInsight 表 + ORDER BY)
* `feedbackCountTotal` 冗余 · 阈值检查 `if (count IN (5,20,50,100))` 不用算 good+bad
* L4+ 才允许细分 direction · L1-L3 强制 '综合'(产品决策)
* Redis 热缓存 5min(详见 ADR-007)· ContextAssembler 高频读

### §6.4 EvolutionInsight · 历史快照(append-only)

```prisma
/// EvolutionAgent 每次跑批的产物 · 历史快照 · append-only
model EvolutionInsight {
  id          Int       @id @default(autoincrement())
  accountId   Int       @map("account_id")

  // 触发原因
  triggerType String    @db.VarChar(32) @map("trigger_type")
  // triggerType · 'level_up:L1→L2' | 'manual' | 'cron_weekly' | 'deep_learn_added'

  // 进化方向(本次跑批的方向)
  direction   String    @db.VarChar(32)

  // 内容(详见 §6.3 latestInsight schema)
  content     Json
  // content · { preferredCatchphrases, styleTone, avoidList, strongPoints, weakPoints }

  // 溯源
  sourceFeedbackIds Int[] @default([]) @map("source_feedback_ids")
  // sourceFeedbackIds · 本次跑批用了哪些 feedback_log.id · 反查路径

  sourceSampleIds   Int[] @default([]) @map("source_sample_ids")
  // sourceSampleIds · 本次跑批用了哪些 DeepLearningArchive · 可选

  // 元数据
  agentId     String    @default("EvolutionAgent") @db.VarChar(64) @map("agent_id")
  modelUsed   String?   @db.VarChar(64) @map("model_used")
  tokensUsed  Int?      @map("tokens_used")
  durationMs  Int?      @map("duration_ms")
  isFallback  Boolean   @default(false) @map("is_fallback")

  // 等级变化(若本次跑批伴随升级)
  levelBefore String?   @db.VarChar(4) @map("level_before")
  levelAfter  String?   @db.VarChar(4) @map("level_after")

  traceId     String?   @db.VarChar(64) @map("trace_id")
  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("evolution_insights")
  @@index([accountId])
  @@index([accountId, createdAt(sort: Desc)])  // 拉 latest
  @@index([accountId, levelAfter])             // 看升级历史
}
```

**append-only 不允许 update**:
* 修订记录的方式 · 后续跑批新生成 1 条 · 旧的不改
* `EvolutionProfile.latestInsight` 冗余存最新一条 · 是这里的"投影"
* 用户可以在 /evolution 看历史 insights 列表(向下滚动)

### §6.5 飞轮 5 阶段的 SQL 链路(汇总)

```sql
-- Phase 1 · 生成(略 · 在 step_data + history)

-- Phase 2 · 用户反馈
INSERT INTO feedback_logs(account_id, history_id, rating, agent_id, ...)
  VALUES (...);
UPDATE evolution_profiles
  SET feedback_count_good = feedback_count_good + (rating='good')::int,
      feedback_count_bad = feedback_count_bad + (rating='bad')::int,
      feedback_count_total = feedback_count_total + 1
  WHERE account_id = ?;

-- Phase 3 · 阈值检查 + 触发(应用层判断)
SELECT feedback_count_total, level FROM evolution_profiles WHERE account_id = ?;
-- 应用层 · if total IN (5, 20, 50, 100) → enqueue EvolutionAgent

-- Phase 4 · EvolutionAgent 跑批(必须 transaction)
BEGIN;
  -- 4a 拉未消费反馈
  SELECT * FROM feedback_logs
    WHERE account_id = ? AND consumed_by_evolution = false
    ORDER BY created_at DESC LIMIT 50;
  -- 4b LLM 聚合(应用层)
  -- 4c 写 EvolutionInsight
  INSERT INTO evolution_insights(account_id, trigger_type, direction, content, ...)
    VALUES (...) RETURNING id;
  -- 4d 更新 EvolutionProfile(latest)
  UPDATE evolution_profiles
    SET level = ?, latest_insight_id = ?, latest_insight = ?, last_evolved_at = NOW()
    WHERE account_id = ?;
  -- 4e mark feedback consumed
  UPDATE feedback_logs
    SET consumed_by_evolution = true, consumed_at = NOW(), consumed_by_insight_id = $insightId
    WHERE id IN (...);
COMMIT;

-- Phase 5 · 注入(ContextAssembler · Redis 热缓存)
SELECT level, latest_insight FROM evolution_profiles WHERE account_id = ?;
```

> 严格按 [AGENTS R-12](AGENTS.md) · Phase 4 必须放 prisma `$transaction()` 内 · 任一失败回滚。

### §6.6 索引设计 + 性能

| 表 | 高频查询 | 索引 |
|---|---|---|
| diagnosis_reports | 拉 latest 报告 | `[accountId, createdAt DESC]` |
| feedback_logs | EvolutionAgent 拉未消费 | `[accountId, consumedByEvolution]` |
| feedback_logs | 仪表盘按 agentId 看分布 | `[accountId, agentId]` |
| feedback_logs | trace 反查 | `[traceId]` |
| evolution_profiles | ContextAssembler 高频读(Redis 热缓存兜底) | `[accountId]`(Unique 自带) |
| evolution_profiles | admin 看 L5 用户 | `[level]` |
| evolution_insights | /evolution 历史列表 | `[accountId, createdAt DESC]` |

---

## §7 学习 + 知识(3 张)

> 这 3 张是 L4 Profile 的另一面 · 用户主动学习 / 上传 / 收藏 · 沉淀给 Specialist 用。
> 关联 · ADR-006 五层记忆 L4 · ADR-008 反馈飞轮 · ADR-012 RAG

### §7.1 DeepLearningArchive · 用户上传样本(给 CopywritingAgent 注入个人风格)

```prisma
/// 用户上传文案 / 文档 · DeepLearnAgent 提炼后写入
model DeepLearningArchive {
  id          Int       @id @default(autoincrement())
  accountId   Int       @map("account_id")

  // 来源
  sourceType  String    @db.VarChar(16) @map("source_type")
  // sourceType · 'manual_paste'(用户粘贴文案) | 'file_upload'(从 Asset)

  sourceAssetId Int?    @map("source_asset_id")
  // sourceAssetId · 关联 Asset.id(file_upload 时)

  // 样本内容
  sample      String    @db.Text
  // sample · 用户原始文案 / 文档解析后的纯文本 · 可能很长

  sampleHash  String    @db.VarChar(64) @map("sample_hash")
  // sampleHash · SHA-256 · 用于去重(用户多次上传同样本)

  // DeepLearnAgent 提炼结果
  summary     String?   @db.Text
  // summary · 短摘要 · 显示在 /deep-learning 列表卡片

  styleVector Unsupported("vector(1536)")? @map("style_vector")
  // styleVector · 风格向量 · CopywritingAgent 找 top-K 相似样本注入风格
  // 详见 ADR-012 + ARCHITECTURE §5.5

  // 提炼标签(给 CopywritingAgent 当 hint)
  tags        String[]  @default([])
  // tags · ['专业', '幽默', '故事化', ...]

  styleProfile Json?    @map("style_profile")
  // styleProfile · 风格画像 ·
  // {
  //   tone: 'humorous' | 'professional' | 'emotional' | ...,
  //   sentenceLength: 'short' | 'medium' | 'long',
  //   vocabulary: 'simple' | 'professional' | 'mixed',
  //   typicalPatterns: ['...', '...']
  // }

  // 学习状态
  learningStatus String @default("pending") @db.VarChar(16) @map("learning_status")
  // learningStatus · 'pending' | 'processing' | 'completed' | 'failed'
  // pending → DeepLearnAgent 跑批拉去 · processing → 处理中 · completed → 可用

  learningError String? @db.Text @map("learning_error")

  // 用户元数据
  userTitle   String?   @db.VarChar(100) @map("user_title")
  // userTitle · 用户给样本起名 · "我的爆款 1" / "竞品 X 的文案"

  userTags    String[]  @default([]) @map("user_tags")

  isActive    Boolean   @default(true) @map("is_active")
  // isActive · false 时 ContextAssembler 不再使用此样本(用户在 /deep-learning 删除)

  // 元数据
  agentId     String    @default("DeepLearnAgent") @db.VarChar(64) @map("agent_id")
  modelUsed   String?   @db.VarChar(64) @map("model_used")
  tokensUsed  Int?      @map("tokens_used")

  traceId     String?   @db.VarChar(64) @map("trace_id")
  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("deep_learning_archives")
  @@unique([accountId, sampleHash])  // 同账号同样本去重
  @@index([accountId])
  @@index([accountId, learningStatus])
  @@index([accountId, isActive])
}
```

**ContextAssembler 调用**:

```typescript
// 给 CopywritingAgent 找 top-K 相似样本
const topK = await prisma.$queryRaw`
  SELECT id, summary, style_profile, tags
  FROM deep_learning_archives
  WHERE account_id = ${accountId}
    AND is_active = true
    AND learning_status = 'completed'
    AND style_vector IS NOT NULL
  ORDER BY style_vector <=> ${queryEmbedding}::vector
  LIMIT 3
`;
```

**关键决策**:
* `sampleHash` UNIQUE · 同账号同文本只学一次(节省 LLM 成本)
* `learningStatus` 状态机 · DeepLearnAgent 后台跑批(参 ADR-005 L5 自治)
* `styleVector` nullable · 学习失败时保留样本但不可检索
* `tags` + `styleProfile` 双结构 · tags 给前端 UI 展示 · styleProfile 给 LLM prompt 注入

### §7.2 KnowledgeFavorite · 收藏方法论(67 案例 / 23 公式 / 22 元素心理学)

```prisma
/// 用户在 /knowledge 收藏的方法论条目
model KnowledgeFavorite {
  id          Int       @id @default(autoincrement())
  accountId   Int       @map("account_id")

  // 收藏对象
  itemType    String    @db.VarChar(32) @map("item_type")
  // itemType · 'script_case'(67 案例)
  //         | 'formula'(23 公式)
  //         | 'element_psychology'(22 元素心理学)
  //         | 'industry_benchmark'(行业基准 · 后期)

  itemKey     String    @db.VarChar(128) @map("item_key")
  // itemKey · 对应常量 lib/constants/* 中的 key
  // 例 · 'script_case_004' · 'formula_FAB' · 'element_fear'

  // 用户标签 + 笔记关联
  userTags    String[]  @default([]) @map("user_tags")

  noteId      Int?      @map("note_id")
  // noteId · 关联 KnowledgeNote.id(可选)

  // 元数据
  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("knowledge_favorites")
  @@unique([accountId, itemType, itemKey])  // 同账号同条目仅 1 次
  @@index([accountId])
  @@index([accountId, itemType])
}
```

**关键决策**:
* `itemKey` 是常量 key 字符串 · 不外键到数据表(因为常量不在 DB 里 · 在 lib/constants/*)
* 校验 itemKey 合法性走应用层 · `validateItemKey(itemType, itemKey)` 函数
* itemKey 改名时(常量重构)· 写迁移脚本 · 详见 §12 迁移策略

### §7.3 KnowledgeNote · 用户笔记

```prisma
/// 用户在 /knowledge 给方法论 / 案例添加的笔记
model KnowledgeNote {
  id          Int       @id @default(autoincrement())
  accountId   Int       @map("account_id")

  // 关联(可选)
  itemType    String?   @db.VarChar(32) @map("item_type")
  itemKey     String?   @db.VarChar(128) @map("item_key")
  // 笔记可以是"独立笔记"(itemType=NULL · 不关联具体方法论)
  // 或者"附加在某条目"(关联到 KnowledgeFavorite)

  // 内容
  content     String    @db.Text
  // content · markdown 笔记

  title       String?   @db.VarChar(200)

  tags        String[]  @default([])

  // 关系
  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  favorites   KnowledgeFavorite[]

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("knowledge_notes")
  @@index([accountId])
  @@index([accountId, itemType, itemKey])
  @@index([accountId, updatedAt(sort: Desc)])
}
```

**关键决策**:
* 一对多 · 一条 Note 可能挂在多个 Favorite 上(reverse 关联)· 罕见但允许
* `itemType` / `itemKey` nullable · 支持独立笔记
* MVP 不做 Note 全文检索 · 后期可加 pgvector(content_embedding)

### §7.4 三表协同的典型流程

```
流程 · 用户上传文案 → DeepLearnAgent 学习 → CopywritingAgent 注入风格
─────────────────────────────────────────────────────────────────

1. 用户在 /deep-learning 上传 PDF / 粘贴文案
   ① 文件 · 写 Asset 表 + parsing_status='pending'
   ② FileParserWorker 异步解析 → Asset.parsedText 填充
   ③ 写 DeepLearningArchive · sample = Asset.parsedText · learning_status='pending'

   或

   ① 粘贴 · 直接写 DeepLearningArchive · learning_status='pending'

2. DeepLearnAgent 跑批(bullmq queue)
   ① WHERE learning_status='pending' LIMIT N · 拉
   ② LLM 调用 → 生成 styleProfile + tags + summary
   ③ embedding API → 生成 styleVector
   ④ UPDATE learning_status='completed' · 写其余字段

3. 用户进 /step/7 生成文案
   ① ContextAssembler 拉 top-K 相似样本(基于当前 input embedding)
   ② 注入到 system prompt "用户风格样本" 段
   ③ CopywritingAgent 生成 · 风格更贴合用户

4. 同时 · 用户在 /knowledge 收藏 67 案例之一
   ① INSERT INTO knowledge_favorites
   ② 加笔记 → INSERT INTO knowledge_notes · 关联 favorite.note_id
```

### §7.5 索引 + 性能

| 表 | 高频查询 | 索引 |
|---|---|---|
| deep_learning_archives | DeepLearnAgent 拉 pending | `[accountId, learningStatus]` |
| deep_learning_archives | ContextAssembler top-K(走 pgvector) | `style_vector USING ivfflat` |
| deep_learning_archives | 去重 | `[accountId, sampleHash]` UNIQUE |
| knowledge_favorites | /knowledge 看收藏列表 | `[accountId, itemType]` |
| knowledge_notes | 列表按时间倒序 | `[accountId, updatedAt DESC]` |

---

## §8 运维表(3 张 · 含 account_id 但无强制 RLS)

> 这 3 张是"运维分析表" · 含 account_id 字段(便于按账号分析) · 但**不开启 RLS**(admin 后台需要跨账号聚合)。
> 应用层访问必须显式带 account_id 过滤(LD-009) · admin role 才能跨查。
> 关联 · ADR-013 LLM Gateway · ADR-005 DailyTaskAgent · LD-013 trace_id 贯穿

### §8.1 CostLog · LLM 调用计费日志

```prisma
/// LLM 调用计费 · 月度按用户/Specialist/模型聚合
model CostLog {
  id          BigInt    @id @default(autoincrement())
  // BigInt · 高频写入 · 量级达百万
  accountId   Int?      @map("account_id")    // ★ nullable · 删账号 SetNull(审计保留)
  userId      Int?      @map("user_id")        // ★ nullable · 删用户 SetNull
  // userId · 冗余 · 加速 admin 月度按用户聚合查询
  // 关系 · ipAccount IpAccount? + user User? · 都 onDelete SetNull(法律审计要求保留 cost_log)

  // 调用元数据
  agentId     String    @db.VarChar(64) @map("agent_id")
  agentMode   String?   @db.VarChar(32) @map("agent_mode")
  callType    String    @db.VarChar(32) @map("call_type")
  // callType · 'specialist_run' | 'context_assemble' | 'image_generate' | 'embedding'
  //         | 'stt' | 'tts' | 'rerank' | 'tool_call'

  // 模型 + tier
  modelTier   String    @db.VarChar(16) @map("model_tier")
  // modelTier · 'reasoning' | 'lightweight' | 'image' | 'stt' | 'tts' | 'embedding'

  modelUsed   String    @db.VarChar(64) @map("model_used")
  // modelUsed · 实际使用的模型 · 'claude-sonnet-4-6' | 'gpt-4o-mini' | 'dall-e-3' | ...

  provider    String    @db.VarChar(32)
  // provider · 'anthropic' | 'openai' | 'aliyun' | 'tencent'

  // Token / 用量
  promptTokens     Int  @default(0) @map("prompt_tokens")
  completionTokens Int  @default(0) @map("completion_tokens")
  totalTokens      Int  @default(0) @map("total_tokens")

  // 图像 / 音频 (非 LLM 调用)
  imageCount    Int?  @map("image_count")
  audioSeconds  Int?  @map("audio_seconds")
  charactersIn  Int?  @map("characters_in")     // TTS 字符数

  // 成本($ · 含 6 位小数)
  costUsd     Decimal   @db.Decimal(10, 6) @map("cost_usd")

  // 性能
  durationMs  Int       @map("duration_ms")

  // 结果
  success     Boolean   @default(true)
  errorCode   String?   @db.VarChar(32) @map("error_code")
  // errorCode · 'timeout' | 'rate_limit' | 'invalid_input' | 'provider_error'

  // 降级记录(若发生)
  isFallback  Boolean   @default(false) @map("is_fallback")
  fallbackFrom String?  @db.VarChar(64) @map("fallback_from")
  fallbackTo   String?  @db.VarChar(64) @map("fallback_to")
  fallbackReason String? @db.VarChar(128) @map("fallback_reason")

  traceId     String?   @db.VarChar(64) @map("trace_id")

  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("cost_log")
  @@index([userId, createdAt(sort: Desc)])              // 用户月度账单
  @@index([accountId, createdAt(sort: Desc)])           // 账号成本分析
  @@index([agentId, createdAt(sort: Desc)])             // 哪个 Specialist 最贵
  @@index([modelUsed, createdAt(sort: Desc)])           // 模型成本对比
  @@index([provider, success, createdAt(sort: Desc)])   // SLA 监控
  @@index([traceId])
  @@index([createdAt(sort: Desc)])                      // 时间分区(年表 / 月表)
}
```

**关键决策**:
* `id BigInt` · 高频写 · 单 Specialist 每次调用 1 行 · 月百万级
* `accountId` + `userId` 双冗余 · 因为 admin 经常按用户查跨账号成本
* `costUsd Decimal(10, 6)` · 单次最高 $9999.999999 · 实际单次几分到几毛
* 月度可分区(`PARTITION BY RANGE(created_at)`) · 12 月一个分区表
* 月度归档 · 6 月以上数据写到冷存储(可选)
* MVP 不分区 · 先单表 + 索引 · 数据量大后再 partition

**SQL 聚合示例**:

```sql
-- 用户月度账单
SELECT user_id, SUM(cost_usd) AS total_cost, SUM(total_tokens) AS total_tokens
FROM cost_log
WHERE created_at >= '2026-05-01' AND created_at < '2026-06-01'
GROUP BY user_id ORDER BY total_cost DESC;

-- 哪个 Specialist 最贵
SELECT agent_id, COUNT(*) AS calls, SUM(cost_usd) AS total_cost,
       AVG(cost_usd) AS avg_cost, AVG(duration_ms) AS avg_ms
FROM cost_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY agent_id ORDER BY total_cost DESC;
```

### §8.2 AuditLog · 操作审计日志

```prisma
/// 全栈操作审计 · trace_id 串联 · admin 反查"用户做了什么 + AI 怎么响应"
model AuditLog {
  id          BigInt    @id @default(autoincrement())
  userId      Int?      @map("user_id")
  accountId   Int?      @map("account_id")
  // accountId · 部分操作没有 account 上下文(如登录) · nullable

  // 操作类型
  eventType   String    @db.VarChar(64) @map("event_type")
  // eventType · 详见 §8.2.1 完整列表

  eventCategory String  @db.VarChar(32) @map("event_category")
  // eventCategory · 'auth' | 'account' | 'specialist' | 'feedback' | 'admin' | 'compliance'

  // 操作对象
  resourceType String?  @db.VarChar(32) @map("resource_type")
  resourceId   Int?     @map("resource_id")
  // resourceType + resourceId · 多态关联 · 'history' + 123 / 'evolution_insight' + 45

  // 详情
  payload     Json?
  // payload · 操作的 input / output 摘要(不存全量) · max 2KB

  // 网络元数据
  ipAddress   String?   @db.VarChar(45) @map("ip_address")    // IPv4 + IPv6
  userAgent   String?   @db.Text @map("user_agent")

  // 结果
  success     Boolean   @default(true)
  errorCode   String?   @db.VarChar(32) @map("error_code")
  errorMessage String?  @db.Text @map("error_message")

  traceId     String?   @db.VarChar(64) @map("trace_id")

  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("audit_log")
  @@index([userId, createdAt(sort: Desc)])
  @@index([accountId, createdAt(sort: Desc)])
  @@index([eventType, createdAt(sort: Desc)])
  @@index([traceId])
  @@index([createdAt(sort: Desc)])
}
```

#### §8.2.1 eventType 完整清单

| Category | Events |
|---|---|
| **auth** | `login_google` · `logout` · `invite_redeem` · `invite_redeem_failed` |
| **account** | `account_create` · `account_switch` · `account_archive` · `account_delete_hard` · `account_export` |
| **specialist** | `specialist_invoke` · `specialist_success` · `specialist_failed` · `specialist_fallback` · `specialist_streaming_started` |
| **stepData** | `step_data_save` · `step_data_save_conflict`(乐观锁) · `step_data_load` |
| **feedback** | `feedback_submit` · `feedback_revoke`(撤回 · 可选) |
| **evolution** | `evolution_triggered` · `evolution_completed` · `evolution_failed` · `evolution_level_up` |
| **deep_learn** | `deep_learn_uploaded` · `deep_learn_completed` · `deep_learn_failed` |
| **diagnosis** | `diagnosis_started` · `diagnosis_completed` |
| **admin** | `invite_create` · `invite_revoke` · `user_role_change` · `user_ban` · `cross_account_query` |
| **compliance** | `pii_detected_and_masked` · `disclaimer_appended` · `privacy_export_requested` · `privacy_delete_requested` |
| **trending** | `trending_scrape_started` · `trending_scrape_completed` · `trending_scrape_failed` |

**关键决策**:
* `payload` 只存摘要 · 不存全量 input/output(防 PII 泄漏 + 节省存储)
* admin 跨账号查需写 `cross_account_query` 事件 · 给法务审计用
* `traceId` 跟 cost_log / step_data / history / feedback_logs 串联 · 一路追溯
* 7 年保留期(部分行业要求)· 老数据归档到冷存储

### §8.3 DailyTask · 每日任务(DailyTaskAgent 输出)

```prisma
/// DailyTaskAgent 每日 0 点跑批的产物 · per-account · per-day
model DailyTask {
  id          Int       @id @default(autoincrement())
  accountId   Int       @map("account_id")

  // 任务日期
  taskDate    DateTime  @db.Date @map("task_date")
  // taskDate · YYYY-MM-DD · 复合唯一(account + date 仅 1 条 latest)

  // 任务列表
  tasks       Json
  // tasks · [{ title, type, ctaUrl, expectedOutcome, completed }] · 3-5 条
  // 详见 §8.3.1 zod schema

  // 完成情况
  completedCount Int    @default(0) @map("completed_count")
  totalCount     Int    @default(0) @map("total_count")

  // 元数据
  agentId     String    @default("DailyTaskAgent") @db.VarChar(64) @map("agent_id")
  modelUsed   String?   @db.VarChar(64) @map("model_used")
  isFallback  Boolean   @default(false) @map("is_fallback")
  // isFallback · 冷启动用模板 · 标 true

  // 输入快照(给 LLM 用的当前账号状态)
  inputSnapshot Json?  @map("input_snapshot")
  // inputSnapshot · { progress: '5/9', latestDiagnosisId, recentHistoryCount, evolutionLevel }
  // 调试用 · 可重现 LLM 当时为什么生成这些任务

  traceId     String?   @db.VarChar(64) @map("trace_id")
  ipAccount   IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("daily_tasks")
  @@unique([accountId, taskDate])  // 一账号一天一条
  @@index([accountId])
  @@index([taskDate])              // admin 看每日跑批结果
  @@index([accountId, taskDate(sort: Desc)])  // 拉 latest
}
```

#### §8.3.1 tasks JSON 结构(zod)

```typescript
export const DailyTaskItemSchema = z.object({
  id: z.string(),                    // uuid · 客户端打卡用
  title: z.string().min(5).max(80),
  description: z.string().max(200),

  type: z.enum([
    'do_step',           // 去做 stepN(没完成的)
    'use_tool',          // 用某个工具(/generate / /trending)
    'review_diagnosis',  // 看诊断报告
    'feedback_request',  // 鼓励反馈(L1 阶段)
    'review_history',    // 复盘历史
    'upload_sample',     // 上传深度学习样本
    'engage_audience',   // 跟粉丝互动(产品外)
  ]),

  ctaUrl: z.string().url().optional(),  // 按钮跳转
  ctaText: z.string().max(20).optional(), // 按钮文字 · "去完成 step 3"

  expectedOutcome: z.string().max(150),  // 完成后的预期收益描述

  estimatedMinutes: z.number().int().min(5).max(60),

  completed: z.boolean().default(false),
  completedAt: z.string().datetime().optional(),

  difficulty: z.enum(['easy','medium','hard']).default('medium'),
});

export const DailyTaskListSchema = z.object({
  tasks: z.array(DailyTaskItemSchema).min(3).max(5),  // 3-5 个任务
});
```

**冷启动模板(isFallback=true)**:

```typescript
const COLD_START_TASKS = [
  { type: 'review_diagnosis', title: '完成 IP 诊断 · 找出最该先做的 1 件事', ctaUrl: '/diagnosis', estimatedMinutes: 10 },
  { type: 'do_step', title: '做 step1 · 选择行业赛道', ctaUrl: '/step/1', estimatedMinutes: 5 },
  { type: 'do_step', title: '做 step3 · 包装账号', ctaUrl: '/step/3', estimatedMinutes: 15 },
];
```

**关键决策**:
* 一账号一天仅 1 条 · 复合唯一索引强制
* DailyTaskAgent 0 点跑批 · 失败 1 点重试(参 ADR-005 实施要点)
* `tasks` JSON 包含 latest 完成情况 · 客户端打卡时 patch 整个 JSON
* `inputSnapshot` 调试用 · 出问题时 admin 看"LLM 当时看到了什么"

### §8.4 三张运维表的协同

```
trace_id 串联示例 ·

T0 · 用户在 /step/7 提交 · 生成 trace_id = 'tr_390012_CopywritingAgent_1714987200000_a3f1'

T1 · audit_log INSERT · event='specialist_invoke' · trace_id=tr_390012_...

T2 · cost_log INSERT · agent='CopywritingAgent' · cost=$0.082 · trace_id=tr_390012_...

T3 · history INSERT · trace_id=tr_390012_...

T4 · 用户点 👍
   audit_log INSERT · event='feedback_submit' · trace_id=tr_390012_...
   feedback_log INSERT · trace_id=tr_390012_...

T5 · admin 反查 · 输入 trace_id 看完整链路:
   SELECT * FROM audit_log WHERE trace_id = ?
   SELECT * FROM cost_log WHERE trace_id = ?
   SELECT * FROM histories WHERE trace_id = ?
   SELECT * FROM feedback_logs WHERE trace_id = ?
```

### §8.5 索引 + 性能

| 表 | 高频查询 | 索引 |
|---|---|---|
| cost_log | 用户月度账单 | `[userId, createdAt DESC]` |
| cost_log | 哪个 Specialist 最贵 | `[agentId, createdAt DESC]` |
| audit_log | 用户操作历史 | `[userId, createdAt DESC]` |
| audit_log | trace 反查 | `[traceId]` |
| daily_task | 拉 latest | `[accountId, taskDate DESC]` |
| daily_task | 唯一 | `[accountId, taskDate]` UNIQUE |

---

## §9 RLS 策略集 · 数据隔离闸 2

> 派生 · ADR-010 + LD-009 + R-4/5/6 红线
> RLS 是**闸 2**(ORM 闸 1 + RLS 闸 2 + 缓存命名空间闸 3)· 任一闸生效就挡住跨账号 · 三道叠加几乎不漏。

### §9.1 启用顺序

```sql
-- 1. 启用扩展(初始 migration · 一次性)
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. 创建表(prisma migration 自动)

-- 3. 启用 RLS(集中在 prisma/migrations/000_rls.sql)
ALTER TABLE ip_accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_data               ENABLE ROW LEVEL SECURITY;
ALTER TABLE histories               ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_insights      ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_learning_archives  ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_notes         ENABLE ROW LEVEL SECURITY;
-- 4. 全局表显式不启用(users / invite_codes / trending_items)
-- 5. 运维表显式不启用(cost_log / audit_log / daily_task)· 见 §9.4
```

### §9.2 12 张账号表的 RLS 策略

#### A · IpAccount(按 user_id 隔离 · 特殊)

```sql
-- 一般用户只能看自己拥有的账号
CREATE POLICY ip_account_user_isolation ON ip_accounts
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true)::int)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::int);
```

#### B · 11 张子表(按 account_id 隔离 · 通用模板)

```sql
-- 模板 · 复制到每张表 · 替换表名
CREATE POLICY step_data_account_isolation ON step_data
  FOR ALL
  USING (account_id = current_setting('app.current_account_id', true)::int)
  WITH CHECK (account_id = current_setting('app.current_account_id', true)::int);

-- 类似的 11 行 · 复制粘贴 ·
-- · histories
-- · topics
-- · assets
-- · diagnosis_reports
-- · feedback_logs
-- · evolution_profiles
-- · evolution_insights
-- · deep_learning_archives
-- · knowledge_favorites
-- · knowledge_notes
-- · daily_tasks(运维表 · 但带 RLS · 用户自己只看自己的)
```

> ⚠️ **特殊** · daily_tasks 虽是"运维表" · 但用户在 /daily-tasks 直接读 · 必须 RLS。
> cost_log / audit_log 也是运维表 · 但用户**不直接读** · 仅 admin · 不带 RLS(详见 §9.4)。

### §9.3 admin 跨账号查询(白名单 bypass)

```sql
-- admin role 可跨账号查 · 走单独 policy
CREATE POLICY admin_full_access_step_data ON step_data
  FOR SELECT
  USING (current_setting('app.role', true) = 'admin');

-- 类似复制到 11 张表
```

应用层注入 · admin tRPC procedure 走 admin middleware:

```typescript
const adminMiddleware = middleware(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });

  // 关键 · 同时设两个 setting
  await prisma.$executeRaw`SELECT set_config('app.role', 'admin', true)`;

  // 写 audit_log · LD-018 cross_account_query 事件
  await audit.log({ eventType: 'cross_account_query', userId: ctx.user.id });

  return next({ ctx: { ...ctx, isAdmin: true } });
});
```

### §9.4 运维表的隔离(不开 RLS · 走应用层)

`cost_log` / `audit_log` 不开 RLS · 因为:
* admin 后台需要跨账号聚合(月度账单 / 系统行为分析)
* 用户**永远不直接读这两张表** · 仅 admin role 可访问

应用层规则:
* 普通用户 procedure 不允许 query 这两张表(grep 检测)
* admin procedure 必须显式 `where: { ... }` 过滤(代码 review 严格)
* 测试用例必含"普通用户 query cost_log → 401" 验证

### §9.5 中间件:每请求开始设 current_account_id

```typescript
// src/server/trpc/middleware/account-isolation.ts
const accountIsolation = middleware(async ({ ctx, input, next }) => {
  const accountId = ctx.user.activeAccountId;
  if (!accountId) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: '请先创建 IP 账号'
    });
  }

  // 闸 1 · 鉴权
  const owns = await prisma.ipAccount.count({
    where: { id: accountId, userId: ctx.user.id, isActive: true }
  });
  if (owns === 0) throw new TRPCError({ code: 'FORBIDDEN' });

  // 闸 2 · 设置 RLS 上下文(本请求事务内)
  await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${ctx.user.id}::text, true)`;
  await prisma.$executeRaw`SELECT set_config('app.current_account_id', ${accountId}::text, true)`;

  return next({ ctx: { ...ctx, activeAccountId: accountId } });
});
```

> `set_config(..., true)` 第三个参数 `true` 表示 LOCAL · 仅当前事务有效 · 事务结束自动清。

### §9.6 测试 RLS(集成测试必含)

```typescript
// tests/integration/rls.test.ts
describe('RLS · 数据隔离闸 2', () => {
  it('用户 A 不能读用户 B 的 stepData', async () => {
    const userA = await createUser('a@test.com');
    const userB = await createUser('b@test.com');
    const accountA = await createAccount(userA.id);
    const accountB = await createAccount(userB.id);

    // userB 的 stepData
    await prisma.$executeRaw`SELECT set_config('app.current_account_id', ${accountB.id}::text, true)`;
    await prisma.stepData.create({ data: { accountId: accountB.id, stepKey: 'step1', ... } });

    // 切到 userA 视角(故意尝试跨账号)
    await prisma.$executeRaw`SELECT set_config('app.current_account_id', ${accountA.id}::text, true)`;
    const leak = await prisma.stepData.findMany({ where: { stepKey: 'step1' } });

    expect(leak).toHaveLength(0);  // RLS 应该挡住 · 即使 ORM 没带 accountId
  });

  it('ORM 漏 accountId · RLS 兜底', async () => {
    // 尝试不带 accountId 查 · RLS 应该过滤
    const result = await prisma.history.findMany();
    // current_account_id=A 时只能看到 A 的 history
    // 即使 ORM where 漏了 · RLS 兜底
  });

  it('admin role 可跨账号查', async () => {
    const admin = await createUser('admin@test.com', { role: 'admin' });
    await prisma.$executeRaw`SELECT set_config('app.role', 'admin', true)`;

    const all = await prisma.history.findMany();  // admin 看全部
    expect(all.length).toBeGreaterThan(0);
  });
});
```

### §9.7 RLS 性能影响(不可忽略)

| 场景 | 影响 |
|---|---|
| 简单查 `WHERE account_id = ?` | 几乎 0 影响 · pg planner 优化等价 |
| 复杂 join + RLS | 可能加 ~5-10% 开销 · 多个表 RLS 都 evaluate |
| index miss + RLS | 严重 · RLS 会全扫表 · 每条 row check policy |

**优化建议**:
* 所有带 RLS 的表必须有 `(account_id, ...)` 复合索引
* 监控慢查询 · 看 EXPLAIN ANALYZE 是否走 index scan
* 高频热点表(stepData / history)考虑 partition by account_id(规模化阶段)

### §9.8 RLS 调试

```sql
-- 看当前会话的 RLS 上下文
SELECT current_setting('app.current_user_id', true) AS user_id,
       current_setting('app.current_account_id', true) AS account_id,
       current_setting('app.role', true) AS role;

-- 看表的 RLS 策略
SELECT schemaname, tablename, policyname, cmd, qual, with_check
  FROM pg_policies WHERE tablename = 'step_data';

-- 临时禁用 RLS(仅 DBA 排查 · 生产慎用)
SET LOCAL row_security = off;
```

> ⚠️ `row_security = off` 仅超级用户可用 · 应用代码绝不允许调。

---

## §10 索引策略

> 把前面 §2-§8 散落的索引集中到一处 · 给 DBA / Opus 审计 / 性能调优一张速查表。

### §10.1 索引设计 5 原则

1. **复合索引前缀匹配 · 高基数列在前**(`[accountId, status]` 而不是 `[status, accountId]`)
2. **每个查询路径有专门索引** · 不依赖"全表扫"
3. **覆盖索引优先** · `INCLUDE` 列减少回表(PG 11+)
4. **B-tree 默认 · 文本搜全部走 GIN**(数组用 GIN · trigram 搜模糊用 GIN)
5. **pgvector 选 ivfflat 还是 hnsw 看量级**

### §10.2 全表索引清单

| 表 | 索引 | 用途 | 类型 |
|---|---|---|:-:|
| **users** | `[email]` UNIQUE · `[openId]` UNIQUE · `[activeAccountId]` | 登录 · OAuth · 切账号 | B-tree |
| **invite_codes** | `[code]` UNIQUE · `[campaign]` · `[createdById]` · `[isActive, expiresAt]` | 兑换 · 营销追踪 · admin | B-tree |
| **trending_items** | `[platform, sourceItemId]` UNIQUE · `[platform, industry]` · `[platform, presentStyle]` · `[crawledAt DESC]` · `[viewCount DESC]` · `style_vector USING ivfflat` | 去重 · 筛选 · 热度排序 · 语义检索 | B-tree + IVFFlat |
| **ip_accounts** | `[userId]` · `[userId, isActive]` · `[industry]` · `[platform]` | /accounts 列表 · admin 分布 | B-tree |
| **step_data** | `[accountId, stepKey]` UNIQUE · `[accountId]` · `[accountId, status]` | 主查 · 进度查询 | B-tree |
| **histories** | `[accountId]` · `[accountId, agentId]` · `[accountId, scriptType]` · `[accountId, createdAt DESC]` · `[accountId, isFavorited]` · `[traceId]` · `content_embedding USING ivfflat`(可选) | /history · /my-topics · trace 反查 · 相似检索 | B-tree + IVFFlat |
| **topics** | `[accountId]` · `[accountId, category]` · `[accountId, isUsed]` · `[accountId, createdAt DESC]` | /my-topics 5 类 tab | B-tree |
| **assets** | `[accountId]` · `[accountId, assetType]` · `[accountId, relatedStepKey]` · `[parsingStatus]` | step3 头像 · FileParser 队列 | B-tree |
| **diagnosis_reports** | `[accountId]` · `[accountId, createdAt DESC]` | latest 报告 | B-tree |
| **feedback_logs** | `[accountId]` · `[accountId, rating]` · `[accountId, consumedByEvolution]` · `[accountId, agentId]` · `[accountId, createdAt DESC]` · `[traceId]` · `[userId]` | 飞轮跑批 · 仪表盘 · trace 反查 | B-tree |
| **evolution_profiles** | `[accountId]` UNIQUE · `[level]` · `[accountId, level]` | ContextAssembler 高频读(Redis 兜底)+ admin | B-tree |
| **evolution_insights** | `[accountId]` · `[accountId, createdAt DESC]` · `[accountId, levelAfter]` | /evolution 历史 + 升级查询 | B-tree |
| **deep_learning_archives** | `[accountId, sampleHash]` UNIQUE · `[accountId]` · `[accountId, learningStatus]` · `[accountId, isActive]` · `style_vector USING ivfflat` | 去重 · DeepLearn 队列 · top-K 检索 | B-tree + IVFFlat |
| **knowledge_favorites** | `[accountId, itemType, itemKey]` UNIQUE · `[accountId]` · `[accountId, itemType]` | /knowledge 列表 · 去重 | B-tree |
| **knowledge_notes** | `[accountId]` · `[accountId, itemType, itemKey]` · `[accountId, updatedAt DESC]` | 笔记列表 | B-tree |
| **cost_log** | `[userId, createdAt DESC]` · `[accountId, createdAt DESC]` · `[agentId, createdAt DESC]` · `[modelUsed, createdAt DESC]` · `[provider, success, createdAt DESC]` · `[traceId]` · `[createdAt DESC]` | 月账 · Specialist 成本 · SLA 监控 | B-tree |
| **audit_log** | `[userId, createdAt DESC]` · `[accountId, createdAt DESC]` · `[eventType, createdAt DESC]` · `[traceId]` · `[createdAt DESC]` | 用户操作 · 事件分布 · trace 反查 | B-tree |
| **daily_tasks** | `[accountId, taskDate]` UNIQUE · `[accountId]` · `[taskDate]` · `[accountId, taskDate DESC]` | latest · admin | B-tree |

### §10.3 数组字段 GIN 索引(可选 · 按需)

```sql
-- histories.elements 数组查询(WHERE elements @> ARRAY['fear'])
CREATE INDEX histories_elements_gin ON histories USING GIN (elements);

-- topics.user_tags · deep_learning_archives.tags · 同样
CREATE INDEX topics_user_tags_gin ON topics USING GIN (user_tags);
```

> MVP 不强制 · 用户基数小时全表扫还行 · 1k+ 用户后再加。

### §10.4 pgvector 索引选型

| 索引 | 量级适用 | 构建时间 | 查询速度 | 内存 |
|---|---|:-:|:-:|:-:|
| **`ivfflat`** | 1k-1M 向量 | 快 | 中等 | 中等 |
| **`hnsw`** | 100k+ 向量 | 慢 | 快 | 高 |
| 不建索引 | < 1k 向量 | - | 全扫够快 | - |

**MVP 选 `ivfflat`**(简单 + 量级合适):

```sql
-- TrendingItem(预计 10k+ 向量)
CREATE INDEX trending_content_embedding_idx
  ON trending_items USING ivfflat (content_embedding vector_cosine_ops)
  WITH (lists = 100);  -- lists ≈ sqrt(num_rows)

-- DeepLearningArchive(per-account · 平均 10-100 个)
CREATE INDEX deep_learning_style_vector_idx
  ON deep_learning_archives USING ivfflat (style_vector vector_cosine_ops)
  WITH (lists = 100);

-- History(可选 · embedding 可后期再开)
-- 如果开启 ·
CREATE INDEX histories_content_embedding_idx
  ON histories USING ivfflat (content_embedding vector_cosine_ops)
  WITH (lists = 200);
```

**查询时**:

```sql
-- top-K 相似(用余弦距离)
SELECT id, summary
FROM deep_learning_archives
WHERE account_id = $1
  AND learning_status = 'completed'
  AND style_vector IS NOT NULL
ORDER BY style_vector <=> $2::vector
LIMIT 3;
```

> `<=>` = 余弦距离 · `<->` = 欧式 · `<#>` = 内积 · 本架构默认余弦。

### §10.5 性能基线(MVP 期 · 单 PG)

| 查询 | P95 目标 |
|---|:-:|
| `stepData.getAll(accountId)`(9 行) | < 5ms |
| `evolution_profiles.findUnique` | < 3ms(Redis 兜底 < 1ms) |
| `histories` 时间倒序 20 条 | < 10ms |
| `feedback_logs WHERE consumed=false LIMIT 50` | < 15ms |
| `trending_items` 按行业 + 平台筛选 | < 30ms |
| pgvector top-K(deep_learning · per-account) | < 50ms |
| pgvector top-K(trending · 全局 10k) | < 100ms |
| ContextAssembler 6 路并行 P95 | **< 200ms**(关键 SLA) |

### §10.6 索引膨胀 + 维护

```sql
-- 定期 REINDEX(月度)
REINDEX INDEX CONCURRENTLY histories_content_embedding_idx;

-- 看索引使用率(找无用索引删)
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0  -- 从未被用过
  ORDER BY pg_relation_size(indexrelid) DESC;

-- 看表大小 + 索引大小(评估分区时机)
SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) AS total_size
  FROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
  ORDER BY pg_total_relation_size(oid) DESC LIMIT 10;
```

### §10.7 何时 partition(规模化阶段决策)

* **cost_log** · 月百万行后 · 按 created_at 月分区
* **audit_log** · 同上
* **histories** · 1M 行后 · 按 account_id hash 分区(LIST partition 也可)
* **feedback_logs** · 用户量 10k+ 后评估
* **MVP 阶段不做** · 单表 + 索引足够

---

## §11 zod schema 派生

> 派生 LD-013 · zod schema 是真理来源 · 跟 prisma model 一致 · 跟 DATA-MODEL.md 一致(三处对齐 · CI 强制)。

### §11.1 三处对齐策略

```
┌──────────────────────────┐
│  本文件 DATA-MODEL.md    │  ← 文档真理(架构师维护)
└──────────────┬───────────┘
               │ 派生 / 对齐
               ▼
┌──────────────────────────┐
│  prisma/schema.prisma    │  ← DB 真理(prisma migrate 应用)
└──────────────┬───────────┘
               │ 派生 / 对齐
               ▼
┌──────────────────────────┐
│  src/lib/schemas/*.ts    │  ← 前后端共享 zod
└──────────────────────────┘
```

CI 跑 `pnpm schema:diff` · 三处不一致 reject。

### §11.2 zod 文件组织

```
src/lib/schemas/
├── entities/                  # 1 实体 1 文件 · 跟 prisma model 一一对应
│   ├── user.schema.ts
│   ├── ip-account.schema.ts
│   ├── step-data.schema.ts
│   ├── history.schema.ts
│   ├── topic.schema.ts
│   ├── asset.schema.ts
│   ├── diagnosis-report.schema.ts
│   ├── feedback-log.schema.ts
│   ├── evolution-profile.schema.ts
│   ├── evolution-insight.schema.ts
│   ├── deep-learning-archive.schema.ts
│   ├── knowledge.schema.ts       # favorite + note 合并
│   ├── trending-item.schema.ts
│   ├── invite-code.schema.ts
│   ├── cost-log.schema.ts
│   ├── audit-log.schema.ts
│   └── daily-task.schema.ts
├── step-results/              # 9 步 result schema(详见 §4.4)
│   ├── step1.schema.ts
│   ├── step3.schema.ts
│   ├── step3b.schema.ts
│   ├── step4.schema.ts
│   ├── step4b.schema.ts
│   ├── step5.schema.ts
│   ├── step6.schema.ts
│   ├── step7.schema.ts
│   └── step8.schema.ts
├── specialist-io/             # 14 Specialist 输入输出 schema
│   ├── positioning-agent.schema.ts
│   ├── branding-agent.schema.ts
│   └── ...
├── api/                       # tRPC procedure input/output schema
│   ├── auth.schema.ts
│   ├── ip-accounts.schema.ts
│   └── ...
└── index.ts                   # barrel export
```

### §11.3 实体 schema 模板

```typescript
// src/lib/schemas/entities/step-data.schema.ts
import { z } from 'zod';

// 1. 基础字段(跟 prisma model 字段一一对应)
export const StepDataBaseSchema = z.object({
  id: z.number().int().positive(),
  accountId: z.number().int().positive(),
  stepKey: z.enum(['step1','step3','step3b','step4','step4b','step5','step6','step7','step8']),
  inputs: z.unknown(),                  // JSON · 由 stepKey 决定具体 schema
  result: z.unknown().nullable(),
  version: z.number().int().nonnegative(),
  schemaVersion: z.string().default('3.0'),
  status: z.enum(['in_progress','completed','failed','fallback']).default('completed'),
  isFallback: z.boolean().default(false),
  durationMs: z.number().int().optional().nullable(),
  tokensUsed: z.number().int().optional().nullable(),
  modelUsed: z.string().optional().nullable(),
  agentId: z.string(),
  traceId: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 2. 派生 TS type
export type StepData = z.infer<typeof StepDataBaseSchema>;

// 3. Mutation input(创建 / 更新时)
export const StepDataSaveInputSchema = z.object({
  stepKey: StepDataBaseSchema.shape.stepKey,
  inputs: z.unknown(),
  result: z.unknown(),
  version: z.number().int().nonnegative(),  // 乐观锁
  traceId: z.string().optional(),
});

// 4. 复合 schema(stepKey 决定 inputs/result schema)
import { Step3InputSchema, Step3ResultSchema } from '../step-results/step3.schema';
import { Step3bInputSchema, Step3bResultSchema } from '../step-results/step3b.schema';
// ... 其他 step

export const StepDataValidatedSchema = z.discriminatedUnion('stepKey', [
  z.object({ stepKey: z.literal('step1'), inputs: Step1InputSchema, result: Step1ResultSchema.nullable() }),
  z.object({ stepKey: z.literal('step3'), inputs: Step3InputSchema, result: Step3ResultSchema.nullable() }),
  // ... 9 个分支
]);
```

### §11.4 schema:diff CI 检查

```typescript
// scripts/schema-diff.ts
// 1. 解析 prisma/schema.prisma · 提取 model 字段
// 2. 解析 src/lib/schemas/entities/*.ts · 提取 zod schema 字段
// 3. 解析 DATA-MODEL.md · 提取标记的字段块
// 4. 三方对比 · 任一不一致 exit(1)

// 简化逻辑(实际用 prisma-internals + zod 反射)
const prismaFields = parsePrismaModels('./prisma/schema.prisma');
const zodFields    = parseZodSchemas('./src/lib/schemas/entities/');
const docFields    = parseMdSchemas('./DATA-MODEL.md');

for (const model of MODELS) {
  if (!isEqual(prismaFields[model], zodFields[model])) {
    console.error(`❌ ${model} · prisma vs zod mismatch`);
    process.exit(1);
  }
  if (!isEqual(prismaFields[model], docFields[model])) {
    console.error(`❌ ${model} · prisma vs doc mismatch`);
    process.exit(1);
  }
}
```

### §11.5 tRPC 自动校验

```typescript
// src/server/trpc/routers/step-data.ts
export const stepDataRouter = createTRPCRouter({
  save: protectedProcedure
    .input(StepDataSaveInputSchema)        // input zod 自动校验
    .output(StepDataSaveOutputSchema)      // output 也校验(防 LLM 幻觉)
    .mutation(async ({ ctx, input }) => {
      // input 此处已是类型安全 · 无需手动校验
      return await stepDataService.save({ ...input, accountId: ctx.activeAccountId });
    }),
});
```

### §11.6 命名约定

| 对象 | 命名 |
|---|---|
| 基础实体 schema | `XxxSchema`(如 `IpAccountSchema`) |
| 派生 type | `Xxx`(如 `type IpAccount = z.infer<typeof IpAccountSchema>`) |
| 输入 schema | `XxxInputSchema`(如 `StepDataSaveInputSchema`) |
| 输出 schema | `XxxOutputSchema` |
| Specialist IO | `<AgentName>InputSchema` / `<AgentName>OutputSchema` |
| step result | `Step<N>ResultSchema`(如 `Step3ResultSchema`) |

---

## §12 迁移策略 + 种子数据

> 派生 ARCHITECTURE.md §9.1 P0 + ADR-012 RAG 边界

### §12.1 Initial Migration 顺序(P1 数据底座)

```bash
# Step 1 · 启用扩展
$ psql -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Step 2 · 跑 prisma migration(自动生成)
$ pnpm prisma migrate deploy

# Step 3 · RLS 策略(集中在一个 manual migration)
$ psql -f prisma/migrations/manual_rls.sql

# Step 4 · pgvector 索引(prisma 不支持自动 · 手工)
$ psql -f prisma/migrations/manual_vector_indexes.sql

# Step 5 · seed
$ pnpm prisma db seed
```

迁移文件目录:

```
prisma/migrations/
├── 20260506_001_init/
│   └── migration.sql                # prisma 自动 · 创 18 表
├── 20260506_002_enable_vector/
│   └── migration.sql                # CREATE EXTENSION vector
├── 20260506_003_rls_policies/
│   └── migration.sql                # 12 表 RLS 策略
├── 20260506_004_vector_indexes/
│   └── migration.sql                # ivfflat 索引(trending / deep_learning)
└── 20260506_005_initial_constants_to_vector/
    └── migration.sql                # 67 案例 + 23 公式 + 22 元素心理学 入 pgvector
```

### §12.2 Seed 数据(prisma/seed.ts)

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { embed } from '@/server/workers/llm-gateway';
import {
  KNOWLEDGE_CASES,    // 67 实战案例(详见 lib/constants)
  COPYWRITING_FORMULAS, // 23 公式
  ELEMENT_PSYCHOLOGY    // 22 元素心理学
} from '../src/lib/constants';

const prisma = new PrismaClient();

async function main() {
  // ───── 1. 测试用户 + 账号(开发 / 测试用)
  const testStarter = await prisma.user.upsert({
    where: { email: 'starter@test.com' },
    create: {
      openId: 'test_starter',
      name: '测试 · 起号者',
      email: 'starter@test.com',
      role: 'user',
      isActivated: true,
      industry: 'beauty',
    },
    update: {},
  });

  const testOpc = await prisma.user.upsert({
    where: { email: 'opc@test.com' },
    create: {
      openId: 'test_opc',
      name: '测试 · OPC 创业者',
      email: 'opc@test.com',
      role: 'user',
      isActivated: true,
      industry: 'enterprise',
    },
    update: {},
  });

  const testAdmin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    create: {
      openId: 'test_admin',
      name: '测试 · 管理员',
      email: 'admin@test.com',
      role: 'admin',
      isActivated: true,
    },
    update: {},
  });

  // ───── 2. 测试 IP 账号(每用户 1-2 个)
  await prisma.ipAccount.create({
    data: {
      userId: testStarter.id,
      name: '美业小丽',
      industry: 'beauty',
      platform: 'douyin',
      stage: 'starter',
      personalInfo: '5 年美容师 · 最近想做个人 IP',
      followersRange: '0-1000',
    },
  });
  await prisma.ipAccount.create({
    data: {
      userId: testOpc.id,
      name: '智能体老王',
      industry: 'enterprise',
      platform: 'douyin',
      stage: 'growth',
      personalInfo: '12 年餐饮创业 · 现做 AI 智能体定制',
      followersRange: '1000-10000',
    },
  });

  // ───── 3. 67 实战案例入 pgvector(全局 · 不带 account_id)
  for (const item of KNOWLEDGE_CASES) {
    const embedding = await embed(item.title + ' · ' + item.summary);
    await prisma.$executeRaw`
      INSERT INTO knowledge_cases_vec (item_key, content, embedding, metadata)
      VALUES (${item.key}, ${item.summary}, ${embedding}::vector, ${JSON.stringify(item)}::jsonb)
      ON CONFLICT (item_key) DO UPDATE SET embedding = EXCLUDED.embedding;
    `;
  }

  // ───── 4. 23 公式入向量库
  for (const formula of COPYWRITING_FORMULAS) {
    const embedding = await embed(formula.name + ' · ' + formula.description);
    await prisma.$executeRaw`
      INSERT INTO formulas_vec (item_key, content, embedding, metadata)
      VALUES (${formula.key}, ${formula.description}, ${embedding}::vector, ${JSON.stringify(formula)}::jsonb)
      ON CONFLICT (item_key) DO NOTHING;
    `;
  }

  // ───── 5. 22 元素心理学
  for (const element of ELEMENT_PSYCHOLOGY) {
    const embedding = await embed(element.label + ' · ' + element.psychology);
    await prisma.$executeRaw`
      INSERT INTO elements_vec (item_key, content, embedding, metadata)
      VALUES (${element.key}, ${element.psychology}, ${embedding}::vector, ${JSON.stringify(element)}::jsonb)
      ON CONFLICT (item_key) DO NOTHING;
    `;
  }

  // ───── 6. 邀请码池(开发期 · 100 个)
  for (let i = 0; i < 100; i++) {
    await prisma.inviteCode.create({
      data: {
        code: generateRandomCode(),
        createdById: testAdmin.id,
        campaign: 'dev_seed_2026q2',
        maxUses: 1,
      },
    });
  }

  console.log('✅ Seed 完成');
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

### §12.3 版本回滚

```bash
# 列出已应用 migration
$ pnpm prisma migrate status

# 回滚到指定 migration(危险 · 仅 dev / staging)
$ pnpm prisma migrate resolve --rolled-back <migration_name>

# 数据回滚 · 必须显式 · 默认禁止
# - 写专门的 down migration · 命名 *_down.sql
# - 走 admin approval(MR + Opus 审计)
```

> ⚠️ **生产环境从不直接回滚 schema** · 用前向兼容(deprecated 字段 · 不删字段) + 应用代码切换 · 老字段 30 天后清理。

### §12.4 Zero-downtime Migration(生产)

```
add_column 这种小改 · 直接 prisma migrate deploy · 不影响

drop_column / rename_column 这种破坏性改 · 走 3 步:
  1. 加新字段(允许同时存在)· 部署应用 · 双写
  2. 等用户请求都用新字段(metric 监控)
  3. drop 老字段 · 部署 · 监控

加 RLS / 复杂索引 · 走 CONCURRENTLY:
  CREATE INDEX CONCURRENTLY ...     # 不锁表
  ALTER TABLE ... 加 RLS · 仅在低峰期 · 写 maintenance window
```

### §12.5 Backup + 灾难恢复(简略 · DEPLOY.md 详细)

* **PG 备份** · Supabase 自带每日 + 每小时 PITR(point-in-time recovery)
* **S3 / OSS 文件** · 跨区域复制
* **测试** · 每月跑 1 次"恢复演练"(从备份恢复到新环境 + 抽样验证)
* **向量库** · pgvector 跟主库一起备份 · 不需要单独处理

### §12.6 与 Coding 3.0 P1 协同

```
Ralph 在 P1 数据底座阶段 ·

Day 1 ·
  · 写 prisma/schema.prisma(15 业务实体 + 3 运维表)
  · 跑 prisma migrate dev → 生成第一份 migration

Day 2 ·
  · 写 manual_rls.sql · manual_vector_indexes.sql
  · 写 src/lib/schemas/entities/*.ts(zod 跟 prisma 一致)
  · 跑 schema:diff CI 校验

Day 3 ·
  · 写 prisma/seed.ts(测试用户 + 67 案例入向量库)
  · 写 单元测试(每个 schema 1 个 · 共 18)
  · 写 集成测试(RLS · 多账号隔离 · 5 用例)

Day 4-5 ·
  · 13 个 tRPC router 骨架(空实现 · 返回 mock)
  · 跑 typecheck + lint + test:integration
  · 提 PR · Opus 审计

退出条件 · 13 router 全部跑通(mock)+ RLS 多账号测试通过 + 双写 hook 工作
```

---

---

## §13 admin 子系统 schema 扩展(2026-05-07 v0.2 新增 · 对应 REVIEW P0-1 派生 + P2-6 + ADR-021)

> 本章是 [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) §3 + §4 在数据层的完整落地。
> 主应用 §1-§10 给的 18 实体不变 · admin 子系统**新加 4 主表 + 9 辅助表 = 13 张** · 全部归本章。

### §13.1 admin 数据模型概览

```
┌─────────────────────────────────────────────────────────────────────┐
│  admin 子系统数据模型(13 张新表 · 跟主应用 18 实体兼容共享 prisma)│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─ 核心 4 主表(rl 横切 · 非按 account_id)──────────────────────┐ │
│  │  ① admin_audit_log         · admin 操作审计(法务取证)       │ │
│  │  ② approval_requests       · Approval Gates 工作流            │ │
│  │  ③ prompt_versions         · Specialist Prompt 版本管理        │ │
│  │  ④ user_quota              · 用户配额(对照 LLMGateway 限流)  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─ 9 辅助表(按业务管理域归类)────────────────────────────────────┐ │
│  │  域 ① NSM             · kpi_snapshots                           │ │
│  │  域 ③ IP 账号         · ip_account_admin_notes                  │ │
│  │                       · ip_account_anomaly_flags                │ │
│  │  域 ⑥ 邀请码          · invite_campaigns                        │ │
│  │  域 ⑦ Trending 审核   · trending_review_queue                   │ │
│  │                       · trending_takedown                       │ │
│  │                       · auto_review_rules                       │ │
│  │  域 ⑧ DeepLearn 审核  · deep_learn_review_queue                 │ │
│  │                       · user_violation_log                      │ │
│  │  域 ⑨ 进化            · evolution_anomaly_flags                 │ │
│  │  域 ⑩ Prompt          · prompt_canary_config                    │ │
│  │  域 ⑪ 配额            · quota_adjustment_log                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─ P2 后续(占位 · 不在 P9 必交)────────────────────────────────────┐ │
│  │  域 ⑭ A/B   · ab_experiments / ab_assignments                   │ │
│  │  域 ⑯ 配置  · feature_flags / system_config                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

  合计 · P9 必交 13 表 · P2 后续 4 表 = 17 张 admin 表(本章涵盖前 13 + P2 占位)
```

### §13.2 admin_audit_log · admin 操作审计(★ 必加)

> 完整 schema 在 ADMIN-ARCHITECTURE §4.2 已就位 · 这里复制并补充索引 / 关系定义。
> **跟主应用 audit_log 的关系** · 双轨并存(主应用用户操作走 audit_log · admin 操作走 admin_audit_log) · 法务取证场景跨表 trace_id 关联查。

```prisma
/// admin 操作审计 · 全量记录 · 跟用户 audit_log 分开
model AdminAuditLog {
  id                  Int          @id @default(autoincrement())

  /// actor(admin · 不是 user)
  actorAdminId        Int
  actorRole           String       // 'super_admin' | 'admin' | 'readonly_admin'
  actorMode           String?      // 'cs' | 'reviewer' | 'finance' | 'legal' | null

  /// event
  eventCategory       String       // 'auth' | 'data_query' | 'data_mutation' |
                                   // 'cross_account_query' | 'high_risk_action' |
                                   // 'config_change' | 'export' | 'security_alert'
  eventType           String       // 'admin_login' / 'mfa_check' /
                                   // 'cross_account_query' / 'change_user_plan' /
                                   // 'ban_user' / 'force_evolution_rebuild' /
                                   // 'invalidate_invite_code' / 'change_quota' /
                                   // 'publish_prompt' / 'rollback_prompt' / ...

  /// target
  targetUserId        Int?
  targetAccountId     Int?
  targetEntity        String?      // 'user' / 'ip_account' / 'invite_code' / ...
  targetEntityId      String?

  /// payload
  payloadHash         String       @db.VarChar(64)  // SHA-256 · 防篡改
  payload             Json?        // 详情(可被审计 · 不含敏感)

  /// 关联 Approval(高风险动作)
  approvalRequestId   Int?

  /// trace
  traceId             String       @db.VarChar(64)

  /// 上下文
  ip                  String       @db.VarChar(45)
  userAgent           String       @db.VarChar(500)
  sessionId           String       @db.VarChar(64)

  /// 结果
  success             Boolean      @default(true)
  errorCode           String?
  errorMessage        String?

  createdAt           DateTime     @default(now())

  approvalRequest     ApprovalRequest? @relation(fields: [approvalRequestId], references: [id])

  @@index([actorAdminId, createdAt(sort: Desc)])
  @@index([eventCategory, createdAt(sort: Desc)])
  @@index([eventType, createdAt(sort: Desc)])
  @@index([targetUserId, createdAt(sort: Desc)])
  @@index([targetAccountId, createdAt(sort: Desc)])
  @@index([traceId])
  @@index([approvalRequestId])
  @@index([createdAt(sort: Desc)])
  @@map("admin_audit_log")
}
```

### §13.3 approval_requests · Approval Gates 工作流

> 完整 schema 在 ADMIN-ARCHITECTURE §4.4 已给 · 这里补充关系。

```prisma
/// Approval Gates 高风险操作两步审批
model ApprovalRequest {
  id                  Int          @id @default(autoincrement())

  /// 申请人
  requesterAdminId    Int
  requesterRole       String

  /// 申请什么
  actionType          String       // 'change_user_plan' / 'ban_user' / ...
  actionPayload       Json
  actionContext       Json?
  riskLevel           String       // 'low' | 'medium' | 'high' | 'critical'
  requireDualApproval Boolean      @default(false)
  isEmergency         Boolean      @default(false)
  requesterReason     String       @db.Text

  /// 决策
  status              String       // 'pending' | 'approved' | 'rejected' |
                                   // 'expired' | 'auto_executed' | 'cancelled'
  approverAdminId     Int?
  decisionReason      String?      @db.Text
  secondApproverAdminId Int?
  secondApprovedAt    DateTime?    // PRD-13 US-002 加 · 第二审批人决策时间
  secondDecisionReason String?     @db.Text

  /// PRD-13 US-002 dual approval + emergency + 24h postReview 扩展(8 字段)
  emergencyMode       Boolean      @default(false)
  emergencyIncidentId String?      // emergencyMode=true 时必填 · 关联 prod incident
  postReviewRequired  Boolean      @default(false)  // emergencyApprove 自动设 true
  postReviewedAt      DateTime?    // 24h 后 super_admin 复核时间
  postReviewerAdminId Int?         // 复核人 · 必 !== firstApproverAdminId
  postReviewResult    String?      // 'confirmed' | 'overturned' | 'partial'

  /// 时间
  createdAt           DateTime     @default(now())
  decidedAt           DateTime?
  expiresAt           DateTime
  executedAt          DateTime?
  postReviewAt        DateTime?    // (老字段 · 跟 postReviewedAt 区分 · postReviewAt 是触发时间 · postReviewedAt 是决策时间)

  auditLogs           AdminAuditLog[]

  @@index([status, createdAt(sort: Desc)])
  @@index([requesterAdminId, createdAt(sort: Desc)])
  @@index([approverAdminId])
  @@index([riskLevel, status])
  @@index([expiresAt])  // cron 扫过期
  // PRD-13 US-002 加 3 index
  @@index([requireDualApproval, status])
  @@index([emergencyMode, postReviewRequired])
  @@index([postReviewRequired, postReviewedAt])  // cron 03:30 扫 overdue
  @@map("approval_requests")
}
```

**PRD-13 US-002 字段语义** (dual approval 工作流):

| 字段 | 类型 | 用途 |
|---|---|---|
| `requireDualApproval` | Boolean (default false) | 由 actionType 推导(D-094 8 actionType 触发 dual · 其余 single) |
| `secondApproverAdminId / secondApprovedAt` | Int? / DateTime? | 第二审批人 · 必 `!== firstApproverAdminId`(FORBIDDEN_SAME_APPROVER) |
| `emergencyMode` | Boolean (default false) | super_admin 紧急快速批 · 自动 postReviewRequired=true |
| `emergencyIncidentId` | String? | emergencyMode=true 时必填(关联 prod incident · D-095) |
| `postReviewRequired` | Boolean (default false) | emergencyApprove 自动设 true · cron 03:30 扫 24h overdue |
| `postReviewedAt / postReviewerAdminId / postReviewResult` | DateTime? / Int? / String? | 24h 后复核状态 · reviewer 必 `!== firstApprover` |

### §13.4 prompt_versions + prompt_canary_config · Prompt 版本管理(域 ⑩)

```prisma
/// Specialist Prompt 版本(每次 admin 改动一条记录)
model PromptVersion {
  id                  Int          @id @default(autoincrement())

  /// 哪个 Specialist · 哪个 mode
  specialistId        String       // 'CopywritingAgent' / 'BrandingAgent' / ...
  mode                String?      // 'step7' / 'free' / 'boom' / ... (null 表示无 mode)

  /// 版本
  version             Int          // 自增版本号(per specialist+mode)
  content             String       @db.Text
  contentHash         String       @db.VarChar(64)  // SHA-256

  /// 状态
  status              String       // 'draft' | 'staged' | 'active' | 'archived' | 'rolled_back'

  /// LLM Judge 评分(对 100 金标准 · 阈值 4.0)
  judgeScore          Decimal?     @db.Decimal(3, 2)
  judgeRunId          String?
  judgeReportUrl      String?

  /// 操作人
  createdByAdminId    Int
  createdAt           DateTime     @default(now())
  approvedByAdminId   Int?
  approvedAt          DateTime?

  canaryConfigs       PromptCanaryConfig[] @relation("currentVersion")
  canaryConfigsNext   PromptCanaryConfig[] @relation("nextVersion")

  @@unique([specialistId, mode, version])
  @@index([specialistId, mode, status])
  @@index([status, createdAt(sort: Desc)])
  @@map("prompt_versions")
}

/// 灰度发布配置(per specialist+mode 一行 · 当前 active 版本 + canary 配置)
model PromptCanaryConfig {
  id                  Int          @id @default(autoincrement())
  specialistId        String
  mode                String?

  /// 当前 prod 版本 + canary 试运行版本
  currentVersionId    Int
  nextVersionId       Int?
  canaryPct           Int          @default(0)  // 0 / 1 / 10 / 50 / 100
  strategy            String       // 'user_id_hash' | 'account_id_hash' | 'random'

  /// 灰度起止
  canaryStartedAt     DateTime?
  canaryEndsAt        DateTime?

  updatedByAdminId    Int
  updatedAt           DateTime     @updatedAt

  currentVersion      PromptVersion  @relation("currentVersion", fields: [currentVersionId], references: [id])
  nextVersion         PromptVersion? @relation("nextVersion",    fields: [nextVersionId],    references: [id])

  @@unique([specialistId, mode])
  @@index([canaryPct])
  @@map("prompt_canary_config")
}
```

### §13.5 user_quota + quota_adjustment_log · 配额管理(域 ⑪)

```prisma
/// 用户配额状态(每用户 1 行 · 跟 LLMGateway Redis token bucket 对照)
model UserQuota {
  id                  Int          @id @default(autoincrement())
  userId              Int          @unique

  /// 套餐
  plan                String       // 'free' | 'pro' | 'enterprise'

  /// 配额(可被 admin 临时覆盖)
  dailyQuota          Int          // 默认按 plan · admin 调整时改这里
  dailyUsed           Int          @default(0)
  monthlyQuota        Int
  monthlyUsed         Int          @default(0)
  imageDailyQuota     Int          @default(0)
  imageDailyUsed      Int          @default(0)

  /// 重置时间
  dailyResetAt        DateTime
  monthlyResetAt      DateTime

  /// 临时白名单
  isOnWhitelist       Boolean      @default(false)
  whitelistExpiresAt  DateTime?

  updatedAt           DateTime     @updatedAt

  adjustments         QuotaAdjustmentLog[]

  @@index([plan])
  @@index([dailyResetAt])
  @@index([whitelistExpiresAt])
  @@map("user_quota")
}

/// 配额调整记录(admin 临时调整 · 24h 自动失效)
model QuotaAdjustmentLog {
  id                  Int          @id @default(autoincrement())
  userQuotaId         Int
  userId              Int          // 冗余 · 加速查
  adminId             Int
  adminMode           String?      // 'cs' | 'super_admin'

  /// 调整内容
  field               String       // 'dailyQuota' / 'monthlyQuota' / 'imageDailyQuota' / 'whitelist'
  oldValue            Int?
  newValue            Int?
  delta               Int?
  reason              String       @db.Text

  /// 自动失效
  expiresAt           DateTime
  isExpired           Boolean      @default(false)
  expiredAt           DateTime?

  /// 关联 Approval(长期调整 > 24h 必走)
  approvalRequestId   Int?

  createdAt           DateTime     @default(now())

  userQuota           UserQuota    @relation(fields: [userQuotaId], references: [id])

  @@index([userId, createdAt(sort: Desc)])
  @@index([adminId, createdAt(sort: Desc)])
  @@index([expiresAt, isExpired])  // cron 扫过期
  @@index([approvalRequestId])
  @@map("quota_adjustment_log")
}
```

### §13.6 9 辅助表(分域归类)

#### A · 域 ① NSM · kpi_snapshots

```prisma
/// NSM 仪表盘历史趋势(预聚合 · 给查询加速)
model KpiSnapshot {
  id                  Int          @id @default(autoincrement())
  snapshotDate        DateTime     @db.Date
  granularity         String       // 'day' | 'week' | 'month'

  /// 4 大 NSM
  activeAccounts7d    Int          // NSM
  step9CompleteRate   Decimal      @db.Decimal(5, 4)
  feedbackRate        Decimal      @db.Decimal(5, 4)
  evolutionUpgradeRate Decimal     @db.Decimal(5, 4)
  d30Retention        Decimal      @db.Decimal(5, 4)

  /// 用户画像分布(JSON)
  userPersonaDistribution Json     // { ipBuilder, opc, traditional, mcn }
  industryDistribution Json
  platformDistribution Json

  /// 漏斗
  funnelData          Json         // [register, step1, step3, step3b, step7, feedback]

  computedAt          DateTime     @default(now())

  @@unique([snapshotDate, granularity])
  @@index([granularity, snapshotDate(sort: Desc)])
  @@map("kpi_snapshots")
}
```

#### B · 域 ③ IP 账号 · ip_account_admin_notes + ip_account_anomaly_flags

```prisma
/// admin 内部备注(用户看不到)
model IpAccountAdminNote {
  id                  Int          @id @default(autoincrement())
  accountId           Int
  adminId             Int
  note                String       @db.Text
  visibleToOtherAdmin Boolean      @default(true)
  createdAt           DateTime     @default(now())

  @@index([accountId, createdAt(sort: Desc)])
  @@index([adminId])
  @@map("ip_account_admin_notes")
}

/// 异常账号标记(自动跑批写入 · admin 复审)
model IpAccountAnomalyFlag {
  id                  Int          @id @default(autoincrement())
  accountId           Int
  anomalyType         String       // 'inactive_no_feedback' | 'evolution_stalled' |
                                   // 'frequent_account_switch' | 'cost_spike' | ...
  detectedAt          DateTime     @default(now())
  severity            String       // 'low' | 'medium' | 'high'
  evidence            Json
  resolvedAt          DateTime?
  resolvedByAdminId   Int?
  resolution          String?      // 'false_positive' | 'admin_action' | 'auto_resolved'

  @@index([accountId])
  @@index([anomalyType, detectedAt(sort: Desc)])
  @@index([severity, resolvedAt])
  @@map("ip_account_anomaly_flags")
}
```

#### C · 域 ⑥ 邀请码 · invite_campaigns

```prisma
/// 营销 campaign 元数据(关联 invite_codes.campaign tag)
model InviteCampaign {
  id                  Int          @id @default(autoincrement())
  campaignKey         String       @unique  // 跟 invite_codes.campaign 字段对应
  name                String
  description         String?      @db.Text
  createdByAdminId    Int

  /// 配额 + 时间
  totalQuota          Int          // 该 campaign 总配额
  usedCount           Int          @default(0)
  startsAt            DateTime
  endsAt              DateTime

  /// 状态
  status              String       // 'draft' | 'active' | 'paused' | 'ended'

  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  @@index([status, startsAt])
  @@index([createdByAdminId])
  @@map("invite_campaigns")
}
```

#### D · 域 ⑦ TrendingItem 审核 · 3 张表

```prisma
/// TrendingScraper 抓回的内容 → 入审核队列(★ 不直接写 trending_items)
model TrendingReviewQueue {
  id                  Int          @id @default(autoincrement())
  sourcePlatform      String       // 'douyin' / 'xiaohongshu' / 'bilibili' / ...
  sourceItemId        String       // 平台原 ID
  sourceUrl           String

  /// 抓取结果(原始数据 · 待审核)
  rawContent          Json         // 原始爬取数据 · 含文本 / 视频元数据
  fetchedAt           DateTime     @default(now())

  /// 自动扫描结果
  autoScanResult      Json         // { hitWords: [...], piiHits: [...], score, ... }
  autoVerdict         String       // 'auto_approved' | 'auto_rejected' | 'needs_review'

  /// 审核状态
  status              String       // 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'auto_rejected'
  reviewerAdminId     Int?
  reviewedAt          DateTime?
  rejectReason        String?      @db.Text

  /// 通过后 · 入主 trending_items 的 ID(链路追溯)
  trendingItemId      Int?

  @@unique([sourcePlatform, sourceItemId])
  @@index([status, fetchedAt(sort: Desc)])
  @@index([sourcePlatform, status])
  @@index([autoVerdict])
  @@index([reviewerAdminId])
  @@map("trending_review_queue")
}

/// 已上架 TrendingItem 后续被下架(申诉 / 二次违规)
model TrendingTakedown {
  id                  Int          @id @default(autoincrement())
  trendingItemId      Int
  reason              String       // 'reported' | 'auto_rule' | 'admin_judgment'
  takedownByAdminId   Int?
  takedownAt          DateTime     @default(now())

  /// 申诉
  hasAppeal           Boolean      @default(false)
  appealResolution    String?      // 'restored' | 'final_takedown'
  appealResolvedAt    DateTime?

  @@index([trendingItemId])
  @@index([takedownAt(sort: Desc)])
  @@map("trending_takedown")
}

/// 自动审核规则配置(super_admin 配 · 自动驳回阈值 / 抽样比例)
model AutoReviewRule {
  id                  Int          @id @default(autoincrement())
  ruleType            String       // 'banned_word' | 'sampling_rate' | 'industry_quota'
  ruleKey             String
  ruleValue           Json
  enabled             Boolean      @default(true)
  updatedByAdminId    Int
  updatedAt           DateTime     @updatedAt

  @@unique([ruleType, ruleKey])
  @@index([ruleType, enabled])
  @@map("auto_review_rules")
}
```

#### E · 域 ⑧ DeepLearningArchive 审核 · 2 张表

```prisma
/// 用户上传 → 入审核队列(★ 不直接写 deep_learning_archives)
model DeepLearnReviewQueue {
  id                  Int          @id @default(autoincrement())
  userId              Int
  accountId           Int          // per-account · 关联用户当前 IP 账号

  /// 上传文件
  fileName            String
  fileMime            String
  fileSize            Int
  fileUrl             String       // S3 URL
  uploadedAt          DateTime     @default(now())

  /// 自动扫描
  autoScanResult      Json         // { piiHits: [...], bannedWordHits: [...], textPreview }
  autoVerdict         String       // 'auto_approved' | 'auto_rejected' | 'needs_review'

  /// 审核
  status              String       // 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'auto_rejected'
  reviewerAdminId     Int?
  reviewedAt          DateTime?
  rejectReason        String?      @db.Text

  /// 通过后 · 入主 deep_learning_archives 的 ID
  archiveId           Int?

  @@index([status, uploadedAt(sort: Desc)])
  @@index([userId, status])
  @@index([accountId])
  @@index([autoVerdict])
  @@map("deep_learn_review_queue")
}

/// 用户违规累计(累计 ≥ 3 警告 / ≥ 5 暂停)
model UserViolationLog {
  id                  Int          @id @default(autoincrement())
  userId              Int
  violationType       String       // 'pii_upload' | 'banned_content' | 'trending_abuse' | ...
  count               Int          @default(1)
  lastViolationAt     DateTime     @default(now())
  lastReviewItemId    Int?
  warningCount        Int          @default(0)
  suspendedAt         DateTime?
  suspendedByAdminId  Int?
  suspendedReason     String?

  @@unique([userId, violationType])
  @@index([userId])
  @@index([violationType, count(sort: Desc)])
  @@map("user_violation_log")
}
```

#### F · 域 ⑨ 进化 · evolution_anomaly_flags

```prisma
/// 进化档案异常标记(冲突反馈 / styleAdjustments 翻转 / 飞轮停滞)
model EvolutionAnomalyFlag {
  id                  Int          @id @default(autoincrement())
  accountId           Int
  anomalyType         String       // 5 anomalyType(per D-089):
                                   // 'conflicting_insights'      · 同 detectedFrom 主题 2+ insight 含相反 styleAdjustments
                                   // 'frequent_style_flip'       · 7 天内 styleAdjustments 翻转 ≥ 2 次
                                   // 'avoidlist_overflow'        · evolution_profile.avoidList > 50 元素
                                   // 'flywheel_stalled'          · 7 天无新 evolution_insight 写入
                                   // 'negative_feedback_dominant' · 30 天 negative_feedback > positive × 2
  severity            String       // 'low' | 'medium' | 'high'
                                   // D-089 推导: evidence signalCount=1 → low / 2-3 → medium / ≥4 → high
  evidence            Json         // {insightIds:[N,M], styleFlipCount:3, avoidListSize:55, ...}
  detectedAt          DateTime     @default(now())
  resolvedAt          DateTime?
  resolution          String?      // 'auto_resolved' | 'admin_force_rebuild' | 'false_positive'
  resolvedByAdminId   Int?         // admin markAnomalyResolved 触发 · null 表示 auto_resolved

  @@index([accountId])
  @@index([anomalyType, detectedAt(sort: Desc)])
  @@index([severity, resolvedAt])
  @@map("evolution_anomaly_flags")
}
```

**PRD-13 US-004 检测算法位置** · `apps/api/src/services/admin/evolution-health/anomaly-detection.service.ts` · 5 个 detect 函数 + deriveSeverity 推导 · EvolutionAgent.execute() 末尾 try/catch 调用(非阻塞)。

### §13.7 P2 后续 4 张表(占位)

```prisma
/// P2 · A/B 测试实验(域 ⑭)
model AbExperiment {
  id                  Int          @id @default(autoincrement())
  experimentKey       String       @unique
  name                String
  description         String?      @db.Text
  variantConfig       Json         // { control: {...}, variant_a: {...}, variant_b: {...} }
  trafficAllocation   Json         // { control: 50, variant_a: 25, variant_b: 25 }
  status              String       // 'draft' | 'running' | 'stopped' | 'completed'
  startedAt           DateTime?
  stoppedAt           DateTime?
  resultSummary       Json?        // 显著性检验结果
  createdByAdminId    Int

  @@index([status])
  @@map("ab_experiments")
}

/// P2 · A/B 用户分组
model AbAssignment {
  id                  Int          @id @default(autoincrement())
  experimentId        Int
  userId              Int
  variant             String       // 'control' | 'variant_a' | 'variant_b'
  assignedAt          DateTime     @default(now())

  @@unique([experimentId, userId])
  @@index([userId, experimentId])
  @@map("ab_assignments")
}

/// P2 · Feature flags(域 ⑯)
model FeatureFlag {
  id                  Int          @id @default(autoincrement())
  flagKey             String       @unique
  description         String?      @db.Text
  flagType            String       // 'boolean' | 'percentage' | 'targeted'
  defaultValue        Json
  rolloutConfig       Json?        // { percentage: 30, target_users: [...], target_plans: [...] }
  enabled             Boolean      @default(false)
  updatedByAdminId    Int
  updatedAt           DateTime     @updatedAt

  @@index([enabled])
  @@map("feature_flags")
}

/// P2 · 系统配置(域 ⑯)
model SystemConfig {
  id                  Int          @id @default(autoincrement())
  configKey           String       @unique
  configValue         Json
  description         String?      @db.Text
  isEmergency         Boolean      @default(false)  // 紧急开关 · 1 人即可改
  updatedByAdminId    Int
  updatedAt           DateTime     @updatedAt

  @@index([isEmergency])
  @@map("system_config")
}
```

### §13.8 RLS 策略扩展(对 §9 的补充)

> admin 子系统 13 张新表的 RLS 策略 · 大部分**不开 RLS**(跟主应用 cost_log / audit_log 类似 · admin 跨账号查必备)。

```sql
-- §9 已有 · admin role bypass policy 已写到 12 业务表
-- 本节补:13 admin 新表全部不开 RLS · 走应用层 admin role check

-- ========================================
-- 不开 RLS 的表(全部 13 张 admin 新表)
-- 应用层规则 · 必须 admin role 才能访问 · 普通用户 procedure 不允许 query
-- ========================================
ALTER TABLE admin_audit_log         DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests        DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions          DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_canary_config     DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_quota               DISABLE ROW LEVEL SECURITY;
ALTER TABLE quota_adjustment_log     DISABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots            DISABLE ROW LEVEL SECURITY;
ALTER TABLE ip_account_admin_notes   DISABLE ROW LEVEL SECURITY;
ALTER TABLE ip_account_anomaly_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE invite_campaigns         DISABLE ROW LEVEL SECURITY;
ALTER TABLE trending_review_queue    DISABLE ROW LEVEL SECURITY;
ALTER TABLE trending_takedown        DISABLE ROW LEVEL SECURITY;
ALTER TABLE auto_review_rules        DISABLE ROW LEVEL SECURITY;
ALTER TABLE deep_learn_review_queue  DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_violation_log       DISABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_anomaly_flags  DISABLE ROW LEVEL SECURITY;
-- P2 后续
ALTER TABLE ab_experiments           DISABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments           DISABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags            DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_config            DISABLE ROW LEVEL SECURITY;
```

> 应用层硬约束(写入 AGENTS.md §10 R-A4):
> - 普通用户 procedure 不允许 query 这 17 张表(grep 检测)
> - admin procedure 通过 adminRLS middleware 自动设 `app.role='admin'`
> - 测试用例必含"普通用户 query admin_audit_log → 401"验证

### §13.9 索引清单扩展(对 §10 的补充)

> 13 admin 新表的索引清单 · 集成到 DBA / Opus 审计速查表。

| 表 | 索引 | 用途 | 类型 |
|---|---|---|:-:|
| **admin_audit_log** | `[actorAdminId, createdAt DESC]` · `[eventCategory, createdAt DESC]` · `[eventType, createdAt DESC]` · `[targetUserId, createdAt DESC]` · `[targetAccountId, createdAt DESC]` · `[traceId]` · `[approvalRequestId]` · `[createdAt DESC]` | 审计反查 · 法务取证 · trace 关联 | B-tree |
| **approval_requests** | `[status, createdAt DESC]` · `[requesterAdminId]` · `[approverAdminId]` · `[riskLevel, status]` · `[expiresAt]` | 待审批列表 · 申请历史 · cron 扫过期 | B-tree |
| **prompt_versions** | `[specialistId, mode, version]` UNIQUE · `[specialistId, mode, status]` · `[status, createdAt DESC]` | 版本时间线 · 当前 active 版本查 | B-tree |
| **prompt_canary_config** | `[specialistId, mode]` UNIQUE · `[canaryPct]` | 灰度配置 + 灰度状态查 | B-tree |
| **user_quota** | `[userId]` UNIQUE · `[plan]` · `[dailyResetAt]` · `[whitelistExpiresAt]` | 实时配额 + cron 重置 + 白名单失效 | B-tree |
| **quota_adjustment_log** | `[userId, createdAt DESC]` · `[adminId, createdAt DESC]` · `[expiresAt, isExpired]` · `[approvalRequestId]` | 调整历史 · cron 失效 · Approval 关联 | B-tree |
| **kpi_snapshots** | `[snapshotDate, granularity]` UNIQUE · `[granularity, snapshotDate DESC]` | NSM 历史趋势查 | B-tree |
| **ip_account_admin_notes** | `[accountId, createdAt DESC]` · `[adminId]` | admin 备注列表 | B-tree |
| **ip_account_anomaly_flags** | `[accountId]` · `[anomalyType, detectedAt DESC]` · `[severity, resolvedAt]` | 异常账号查 + 跑批扫描 | B-tree |
| **invite_campaigns** | `[campaignKey]` UNIQUE · `[status, startsAt]` · `[createdByAdminId]` | campaign 列表 + 状态筛 | B-tree |
| **trending_review_queue** | `[sourcePlatform, sourceItemId]` UNIQUE · `[status, fetchedAt DESC]` · `[sourcePlatform, status]` · `[autoVerdict]` · `[reviewerAdminId]` | 待审核队列 + 抓取去重 | B-tree |
| **trending_takedown** | `[trendingItemId]` · `[takedownAt DESC]` | 已下架列表 | B-tree |
| **auto_review_rules** | `[ruleType, ruleKey]` UNIQUE · `[ruleType, enabled]` | 规则查询 | B-tree |
| **deep_learn_review_queue** | `[status, uploadedAt DESC]` · `[userId, status]` · `[accountId]` · `[autoVerdict]` | 待审核 · 用户上传历史 | B-tree |
| **user_violation_log** | `[userId, violationType]` UNIQUE · `[userId]` · `[violationType, count DESC]` | 用户违规累计查 | B-tree |
| **evolution_anomaly_flags** | `[accountId]` · `[anomalyType, detectedAt DESC]` · `[severity, resolvedAt]` | 异常档案查 | B-tree |
| **ab_experiments** | `[experimentKey]` UNIQUE · `[status]` | A/B 实验列表(P2) | B-tree |
| **ab_assignments** | `[experimentId, userId]` UNIQUE · `[userId, experimentId]` | A/B 分组查(P2) | B-tree |
| **feature_flags** | `[flagKey]` UNIQUE · `[enabled]` | feature flag 查(P2) | B-tree |
| **system_config** | `[configKey]` UNIQUE · `[isEmergency]` | 系统配置查(P2) | B-tree |

### §13.10 跟主应用 schema 的兼容性

| 关系 | 状态 |
|---|---|
| 主应用 18 实体 schema | ✅ 完全不变(本章只增不改) |
| Prisma client 生成 | ✅ 同一个 client · 主应用 + admin 共享(packages/schemas)|
| Prisma migrate | ✅ 同一个 migration 文件夹 · 加 admin 表的 migration 时不影响主应用 |
| RLS 行为 | ✅ 13 admin 新表全部不开 RLS · 主应用 12 业务表 RLS 不变 |
| trace_id 协议 | ✅ admin_audit_log + approval_requests + 主应用 audit_log 用同一个 trace_id 字段 |
| 跨表 join | ✅ admin_audit_log.targetUserId → users.id · admin_audit_log.targetAccountId → ip_accounts.id |

### §13.11 admin schema 扩展小结

本章答 5 件事:
1. **13 张新表分布** · 4 主表(audit / approval / prompt / quota)+ 9 辅助表(分域)+ 4 P2 占位
2. **跟主应用兼容** · 同一 Prisma client · 同一 migration · 不冲突 18 业务实体
3. **RLS 策略** · 13 admin 表不开 RLS · 走应用层 admin role check + grep 检测
4. **索引清单** · 全 17 张表的索引规划(含 cron 扫描索引 + Approval 关联索引)
5. **trace_id 贯穿** · admin_audit_log / approval_requests / 主应用 audit_log 跨表 trace_id 关联(法务取证生命线)

---

## 修订记录

- **2026-05-06 v0.1** · 创建骨架 + 12 节全部填充
  - §1 总览 + ER 图(132 行)
  - §2 全局表 3 张(179 行)
  - §3 IpAccount 聚合根(171 行)
  - §4 StepData 9 步主线(467 行 · 含 9 step zod schema)
  - §5 History · Topic · Asset(255 行)
  - §6 诊断 + 进化 4 张(348 行 · 反馈飞轮核心)
  - §7 学习 + 知识 3 张(231 行)
  - §8 运维表 3 张(307 行)
  - §9 RLS 策略集(208 行)
  - §10 索引策略(132 行)
  - §11 zod schema 派生(本节)
  - §12 迁移策略 + 种子(本节)
- **2026-05-07 v0.2** · 加 §13 admin 子系统 schema 扩展(对应 REVIEW P0-1 派生 + P2-6 + ADR-021)
  - §13.1 · admin 数据模型概览(13 必交 + 4 P2 占位)
  - §13.2 · admin_audit_log(★ 法务取证生命线)
  - §13.3 · approval_requests(Approval Gates 工作流)
  - §13.4 · prompt_versions + prompt_canary_config(域 ⑩)
  - §13.5 · user_quota + quota_adjustment_log(域 ⑪)
  - §13.6 · 9 辅助表分域(域 ①③⑥⑦⑧⑨)
  - §13.7 · 4 P2 占位表(域 ⑭⑯)
  - §13.8 · RLS 策略扩展(13 admin 表不开 RLS)
  - §13.9 · 索引清单扩展(17 表完整索引)
  - §13.10 · 跟主应用 schema 的兼容性(只增不改)
