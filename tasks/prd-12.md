# PRD-12 · P9.2 2 P0 内容审核域

> **版本** · v0.1 seed(2026-05-13 · Coding 3.0 详细度优先 · 派生 ADMIN §3.4 + §8.4 + DATA-MODEL §13.6.D + §13.6.E + AGENTS §10 LD-A-5 + PRD-11 retro §10 Playbook)
> **范围** · 13 US · 2 P0 内容审核域(⑦ TrendingItem 审核 + ⑧ DeepLearning 审核)+ 收官 1 US
> **周期** · 2 周(ADMIN §8.4)
> **依赖** · PRD-10 admin 基础设施 + PRD-11 6 业务核心域(commit 0b29446)· 31 commits / 22 US PASSED / verify-prd-11.sh 34 PASS / 14 GSD 事实层 / 8 Codebase Patterns / 5 TD
> **后续** · PRD-13 P9.3 5 P1 健康度 · PRD-14 P9.4 3 P2 高级
> **继承** · PRD-11 retro §10 Playbook P-1~P-9(7 patterns 直接复用 + 2 新 Diff 防御:plan-check 2.6.14 大 UI 拆分 + 2.6.15 cron schedule wire + Cheat Sheet Step 1.6.b git stash confirm)

---

## §0 · 引用清单(必读 · 启动 PRD-12 前)

### §0.1 战略骨架文档

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 1 | `ARCHITECTURE.md` §9.13b TrendingItem 合规方案 A/B | 见 ARCHITECTURE | 域 ⑦ 数据来源 · 官方 API 或第三方授权 · PRD-12 不实际接入(留 PRR)· 但 schema 要兼容 |
| 2 | `ARCHITECTURE.md` §9.11-A 输入护栏 + §9.11-D PII 脱敏 | 见 ARCHITECTURE | 内容审核合规事故防线 · 域 ⑧ PII 扫描接入点 |
| 3 | `ARCHITECTURE.md` §1.4b 主应用 + admin 边界 ADR-019 | 见 ARCHITECTURE | LD-A-1 主 / admin 不互引 · scraper worker 改造不能耦合 admin 业务 |

### §0.2 ADMIN 架构必读章节(P9.2 核心)

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 4 | `ADMIN-ARCHITECTURE.md` §3.4 P0 内容审核 2 域 | 516-543 | 2 域字段定义 · 数据来源 / KPI / 鉴权 / UI 骨架 / Prisma 5 新表(权威源) |
| 5 | `ADMIN-ARCHITECTURE.md` §3.3 共性 1 跨账号 + 共性 2 高风险 Approval | 491-510 | 共性 · admin (reviewer 模式) 审核操作 + super_admin 配置规则 |
| 6 | `ADMIN-ARCHITECTURE.md` §4 数据访问与隔离 | 660-917 | adminRLS bypass + admin_audit_log 4 eventType(含 trending_review / deep_learn_review 新扩展)|
| 7 | `ADMIN-ARCHITECTURE.md` §5 接口契约 adminRouter | 917-1015 | adminRouter 2 新子树(reviewTrending / reviewDeepLearn)+ 12+ procedure |
| 8 | `ADMIN-ARCHITECTURE.md` §6 前端架构 admin SPA | 1015-1269 | admin layout · 16 sidebar 域 · 2 业务页落位(/admin/reviewTrending /admin/reviewDeepLearn)· P-8 大 UI 拆分严格 |
| 9 | `ADMIN-ARCHITECTURE.md` §7.6 高风险动作清单 | 1269-1460 | 域 ⑧ 用户暂停上传走 Approval Gates trigger stub · 同 PRD-11 模式 |
| 10 | `ADMIN-ARCHITECTURE.md` §8.4 P9.2 退出条件 | 1515-1524 | 3 退出条件 · TrendingScraper 抓的内容必通过 review 才入 RAG · 用户 DeepLearning 样本必通过 review 才入向量库 · 内容审核员每天处理队列 + audit log 完整 |

### §0.3 数据层必读章节

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 11 | `DATA-MODEL.md` §13.1 admin 13 表概览 | 2861-2898 | PRD-12 涉及 5 张:trending_review_queue / trending_takedown / auto_review_rules / deep_learn_review_queue / user_violation_log |
| 12 | `DATA-MODEL.md` §13.2 admin_audit_log schema | 2899-2964 | PRD-10 已建表 · PRD-12 中间件继续写入 + 加 4 新 eventType(trending_review_approve / trending_review_reject / deep_learn_review_approve / deep_learn_review_reject) |
| 13 | `DATA-MODEL.md` §13.3 approval_requests schema | 2966-3012 | PRD-10 已建表 · 域 ⑧ user suspend 触发申请 stub(super_admin 直批模式同 PRD-11)|
| 14 | `DATA-MODEL.md` §13.6.D TrendingReviewQueue + TrendingTakedown + AutoReviewRule | 3253-3320 | 域 ⑦ 3 张新表 schema · @@unique([sourcePlatform, sourceItemId]) · autoVerdict 三态 |
| 15 | `DATA-MODEL.md` §13.6.E DeepLearnReviewQueue + UserViolationLog | 3322-3375 | 域 ⑧ 2 张新表 schema · @@unique([userId, violationType]) · suspendedAt 字段 |
| 16 | `DATA-MODEL.md` §2.3 trending_items 全局共享无 RLS | 见 DATA-MODEL | 域 ⑦ 通过 review 后 · 入 trending_items 主表(trendingItemId FK 链路追溯) |
| 17 | `DATA-MODEL.md` §7.1 deep_learning_archives per-account | 见 DATA-MODEL | 域 ⑧ 通过 review 后 · 入 deep_learning_archives 主表 |

### §0.4 设计约束必读章节

| # | 文档章节 | 行号 | 必读理由 |
|:-:|---|:-:|---|
| 18 | `AGENTS.md` §3 18 LD | 209-426 | 18 锁定决策 · 全局约束 |
| 19 | `AGENTS.md` §5 17 R 红线 | 805-1175 | R-001 / R-016 / 等 17 红线 |
| 20 | `AGENTS.md` §10 admin 子系统 5 LD-A · ★ 重点 LD-A-5 | 2381-2400 | LD-A-5 内容审核 = 主应用 RAG 入库前的硬闸门 · grep `prisma.trendingItem.create` in workers/trending-scraper/ → 0 · grep `prisma.deepLearningArchive.create` in workers/file-parser/ → 0 |

### §0.5 PRD-11 收官交付物(直接复用)

| # | PRD-11 产出 | 引用方式 |
|:-:|---|---|
| 21 | adminProcedure 7 闸链(apps/api/src/trpc/procedures/admin.ts:14-21)| US-005/009 全 procedure 必经 |
| 22 | logAdminAction service · idempotent + redact + payloadHash SHA-256 | 全部 review 操作 写 admin_audit_log |
| 23 | Approval Gates stub 三态(super_admin auto_executed / admin pending / 已存在态 ValidationError)| US-012 user suspend trigger 走该模式 |
| 24 | DenseTable @tanstack/react-virtual(packages/ui/src/admin/DenseTable.tsx)| US-005/006 + US-010/011 UI 直接 import |
| 25 | Recharts fill var(--accent-X)(US-004/011 等模板)| US-006/011 UI 必含 fill var |
| 26 | BullMQ cron tz='Asia/Shanghai' + jobId 防 double-fire | US-008 来源监控 cron + US-012 用户违规告警 cron 严格复用 |
| 27 | isMock 默认 true 外部 service 模板(D-077 · DingtalkService 模式)| US-003 违禁词库 + PII 库 service 严格复用 |
| 28 | admin-routes.ts metadata-driven · prd: 11 → 12 协议(P-2)| 删 2 placeholder.tsx + sidebar 不动 · admin-routes 2 路由 prd: 12 |
| 29 | 4 audit script(redlines + admin-rls-tables + admin-rls AST + approval-gates)+ verify-prd-N.sh 模板 | US-013 收官 verify-prd-12.sh 9 段 self-test 严格包装 |
| 30 | reject-examples.jsonl 全局反例库(PRD-11 入 2 条:cron schedule wire / Validator ECONNRESET)| ralph skill 转 prd-12.json 时自动检索 + 注入 anti_patterns |
| 31 | progress.txt 7+ Codebase Patterns(7 闸链 / adminRLS LOCAL / payloadHash redact / Approval stub / Recharts var / DenseTable virtual / cron tz jobId / isMock 默认)| 全 US 复用 |

### §0.6 PRD-11 retro §10 Playbook 严格执行(本 PRD 实施前必读)

按 `.agents/retros/prd-11-vs-prd-10-retrospective.md` §10:
- **P-1~P-9 必做项** 全采纳(7 patterns 复用 + P-2 admin-routes 协议 + P-3 audit 4 件套 + P-4 anti_patterns 注入 + P-5 foundation 升档 + P-6 AC 代码片段嵌入 + P-7 packages/ui/admin 复用 + ★ **P-8 大 UI 必拆 ≥ 6 files / ≥ 5 嵌套 component** + ★ **P-9 Opus audit git stash confirm pre-existing**)
- **N-1~N-4 不做项** 严守(不在单 foundation US 塞 5 件工程 / 不期望 WAF MFA 真启 / 不依赖 Opus 直 fix mechanical 错 / 不接入真违禁词库 API · 留 PRR)
- **E-1~E-4 实验项** 跟进(TrendingScraper worker 入口 / 抽样审核机制 / 用户违规累计告警 / 大 UI Story 拆分实证)

### §0.7 全局 skill Diff(本 PRD 启动时已 apply)

PRD-11 retro §13 已 apply 3 Skill 升级 Diff 到全局 ~/.claude:
- **Diff-1** · `~/.claude/commands/plan-check.md` §2.6.14 大 UI Story 拆分检查(≥ 12 files + ≥ 8 嵌套 component ERROR · 8-11 / 6-7 WARN)
- **Diff-2** · `~/.claude/scripts/ralph/OPUS-AUDIT-CHEATSHEET.md` Step 1.6.b pre-existing 强 confirm(git stash + 跑 test confirm · 不靠 Sonnet 自宣)
- **Diff-3** · `~/.claude/commands/plan-check.md` §2.6.15 cron schedule wire 检查(含 .job.ts 但缺 index.ts wire ERROR)

PRD-12 全 US 实施期间这 3 个 Diff 自动作用 · ralph + Opus audit 自动遵守。

---

## §1 · 13 User Stories(分 2 域 + 1 收官)

### 🟦 域 ⑦ · TrendingItem 内容审核(6 US · US-001~006)

★ **法律风险生命线** · TrendingScraper Worker 抓回的内容**不直接写 trending_items 主表** · 必经 trending_review_queue 审核 · 防违规内容污染主应用 RAG / Specialist 输出。AGENTS §10 LD-A-5 硬约束。

---

#### US-001 · trending_review_queue + trending_takedown + auto_review_rules 3 schema(foundation)

**risk_level** · `foundation`(downstream 5 US · 跨 PRD-13/14 复用 review queue 模式)
**size_hint** · medium
**priority** · 1
**depends_on** · []

**描述** · 作为开发者 · 需要 3 张 admin 表(trending_review_queue + trending_takedown + auto_review_rules)+ manual_admin_rls DISABLE RLS + audit-admin-rls-tables.sh 加 3 表 + zod schema · 这是域 ⑦ 全 US 5+ 下游 + 域 ⑧ 模式继承的基础。

**AC**:

##### H 幸福路径
- [ ] H-1 · `prisma/schema.prisma` 加 3 model 严格按 DATA-MODEL §13.6.D 行 3253-3320:
  - `TrendingReviewQueue` · 字段(sourcePlatform / sourceItemId / sourceUrl / rawContent Json / fetchedAt / autoScanResult Json / autoVerdict / status / reviewerAdminId? / reviewedAt? / rejectReason? / trendingItemId?)+ @@unique([sourcePlatform, sourceItemId]) + 4 indexes
  - `TrendingTakedown` · 字段(trendingItemId / reason / takedownByAdminId? / takedownAt / hasAppeal / appealResolution? / appealResolvedAt?)+ 2 indexes
  - `AutoReviewRule` · 字段(ruleType / ruleKey / ruleValue Json / enabled / updatedByAdminId / updatedAt)+ @@unique([ruleType, ruleKey]) + 1 index
- [ ] H-2 · `pnpm prisma migrate dev --name add_trending_review_tables` · migration 含 3 CREATE TABLE + indexes
- [ ] H-3 · `prisma/migrations/manual_admin_rls.sql` 加 3 行 ALTER TABLE ... DISABLE ROW LEVEL SECURITY · psql 实测 relrowsecurity=f
- [ ] H-4 · `scripts/audit-admin-rls-tables.sh` 列表加 3 表 · 含 "域⑦ TrendingItem 审核" 注释
- [ ] H-5 · `apps/api/src/schemas/admin/trending-review.schema.ts` zod schema · 3 schema 严格 export · status / autoVerdict enum 与 model 一致
- [ ] H-6 · 跑 `pnpm audit:admin-rls-tables` · 16/16 admin tables RLS=false · 0 mismatches(13 PRD-10/11 + 3 新)
- [ ] H-7 · `pnpm prisma generate` 后 TrendingReviewQueue / TrendingTakedown / AutoReviewRule 类型可 import

##### E 错误 / 边界
- [ ] E-1 · 重复 (sourcePlatform, sourceItemId) · @@unique 抛 P2002 · service 层 catch 友好错
- [ ] E-2 · autoVerdict 不在 enum('auto_approved' | 'auto_rejected' | 'needs_review')· zod 校验
- [ ] E-3 · status 不在 enum('pending' | 'approved' | 'rejected' | 'auto_approved' | 'auto_rejected')· zod 校验
- [ ] E-4 · ruleType 不在 enum('banned_word' | 'sampling_rate' | 'industry_quota')· zod 校验
- [ ] E-5 · rawContent / autoScanResult / ruleValue 必为 Json · TypeScript 严格 InputJsonValue 类型

##### B 后端
- [ ] B-1 · 单元测试 `apps/api/src/schemas/admin/__tests__/trending-review.schema.test.ts` · zod 边界:9+ test 覆盖 enum 校验 + 必填字段 + JSON 类型
- [ ] B-2 · `pnpm test apps/api/src/schemas/admin/__tests__/trending-review.schema.test.ts` 全过
- [ ] B-3 · `pnpm typecheck` 0 error · 全 workspace
- [ ] B-4 · `pnpm audit:redlines-admin` ALL PASS(继承 PRD-11)

##### P 前端
- [ ] P-1 · 无前端 · zod schema 被 packages/clients 自动 inference

**files_to_create** ·
- `apps/api/src/schemas/admin/trending-review.schema.ts`
- `apps/api/src/schemas/admin/__tests__/trending-review.schema.test.ts`
- `prisma/migrations/20260513_add_trending_review_tables/migration.sql`

**files_to_modify** ·
- `prisma/schema.prisma`(+ 3 model)
- `prisma/migrations/manual_admin_rls.sql`(+ 3 ALTER TABLE)
- `scripts/audit-admin-rls-tables.sh`(+ 3 表)

**anti_patterns**:
1. **手动 SQL 漏 @@unique** · 反例 prisma 加 @unique 但 manual migration 漏 CREATE UNIQUE INDEX · 正例 prisma migrate dev 自动生成 + verify · PRD-1 教训
2. **audit-admin-rls-tables 漏加新表** · 反例只改 schema 漏 audit 列表(TD-039/042)· 正例 manual_rls + audit list + audit-self-test 三联同步 · PRD-11 US-001 模式
3. **zod schema enum 跟 prisma 模型 String 不对齐** · 反例 zod 写 ['auto_approved','auto_rejected'] 但 prisma comment 写 'auto_approved'|'auto_rejected'|'needs_review' · 正例严格 1:1

---

#### US-002 · TrendingScraper worker 接入 review queue(★ LD-A-5 硬闸门)

**risk_level** · high
**size_hint** · medium
**priority** · 2
**depends_on** · ["US-001"]

**描述** · 作为开发者 · 需要改 TrendingScraper worker · 抓回的内容**不再直接 prisma.trendingItem.create** · 而是写入 trending_review_queue · LD-A-5 硬闸门。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/workers/trending-scraper/worker.ts`(若已存在则改;若仅 .gitkeep 则新建 worker 入口)· 抓回的 trending 数据写入 prisma.trendingReviewQueue:
  ```typescript
  // SHIELD: LD-A-5 · TrendingScraper 不直接 prisma.trendingItem.create · 必经 review queue
  await prisma.trendingReviewQueue.create({
    data: {
      sourcePlatform: result.platform,
      sourceItemId: result.platformItemId,
      sourceUrl: result.url,
      rawContent: result.raw as Prisma.InputJsonValue,
      autoScanResult: scanResult as Prisma.InputJsonValue,
      autoVerdict, // 'auto_approved' / 'auto_rejected' / 'needs_review'
      status: autoVerdict.startsWith('auto_') ? autoVerdict : 'pending',
    },
  });
  ```
- [ ] H-2 · 改 worker 流程 · grep `prisma.trendingItem.create` in `apps/api/src/workers/trending-scraper/` 必须 **0 命中**(AGENTS §10 LD-A-5 验证)
- [ ] H-3 · autoVerdict 计算 service `apps/api/src/services/admin/content-review/trending-auto-verdict.service.ts`:
  - 接 scanResult { hitWords, piiHits, sourceCategory }
  - 命中违禁词 → autoVerdict='auto_rejected'
  - 0 hit + 抽样未中 → autoVerdict='auto_approved'
  - 抽样中或偏门类目 → autoVerdict='needs_review'
- [ ] H-4 · @@unique([sourcePlatform, sourceItemId]) 已防重 · 重复抓取 catch P2002 + log warn(不当 error · scraper 可能重抓)
- [ ] H-5 · 写 audit-log `eventCategory='data_mutation' eventType='scraper_enqueue'`(non-admin actor · system worker · actorAdminId=0 actorRole='system')

##### E 错误 / 边界
- [ ] E-1 · scanResult 空 / null · autoVerdict default 'needs_review'(保守)
- [ ] E-2 · 重复抓取(P2002 violation)· catch + log warn + 不抛 + 不阻塞 worker
- [ ] E-3 · prisma 写入失败 · BullMQ attempts:3 重试 · 第 3 次进 failed queue + audit `eventCategory='system_alert' eventType='scraper_enqueue_failed'`

##### B 后端
- [ ] B-1 · 单元测试 `apps/api/src/workers/trending-scraper/__tests__/worker-review-queue.test.ts` · 8+ test 覆盖:autoVerdict 三态分支 / 重复防御 / 失败 retry / autoScanResult Json 写入
- [ ] B-2 · 单元测试 trending-auto-verdict.service · 5+ test
- [ ] B-3 · ★ 关键 grep verify in test · `grep -r "prisma.trendingItem.create" apps/api/src/workers/trending-scraper/` → **必须 0 命中**(LD-A-5 验证)
- [ ] B-4 · `pnpm test` 全过 · `pnpm typecheck` 0 error
- [ ] B-5 · `pnpm audit:redlines-admin` ALL PASS

##### P 前端
- [ ] P-1 · 无前端

**files_to_create** ·
- `apps/api/src/workers/trending-scraper/worker.ts`(若 .gitkeep 占位 · 转真实现)
- `apps/api/src/services/admin/content-review/trending-auto-verdict.service.ts`
- `apps/api/src/workers/trending-scraper/__tests__/worker-review-queue.test.ts`
- `apps/api/src/services/admin/content-review/__tests__/trending-auto-verdict.test.ts`

**files_to_modify** ·
- (若现有 worker 实现) `apps/api/src/workers/trending-scraper/*.ts` 改为写 review queue

**anti_patterns**:
1. **LD-A-5 漏 enforce** · 反例 worker 仍 `prisma.trendingItem.create({})` 直入 RAG 表 · 正例必经 trending_review_queue · grep 0 命中
2. **autoVerdict 默认 'auto_approved' 偏激** · 反例无 scan 数据默认 approved → 漏掉危险内容 · 正例默认 'needs_review' 保守
3. **重复抓取抛 error** · 反例 P2002 抛错阻塞 worker · 正例 catch + log warn + continue(scraper 多次抓同 url 是正常)

---

#### US-003 · 违禁词库 + PII 库 service(isMock 默认 · D-077 模式严格复用)

**risk_level** · medium
**size_hint** · medium
**priority** · 3
**depends_on** · []

**描述** · 作为开发者 · 需要 2 个外部审核 service · BannedWordService(违禁词库 · 政治/暴力/色情/赌博 stub)+ PIIDetectionService(PII 库 · 身份证/手机/邮箱/银行卡 regex)· isMock 默认 true · 真启 PRR。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/services/admin/content-review/banned-word.service.ts` · class BannedWordService · isMock = process.env.BANNED_WORD_ENABLE !== 'true'(默认 mock · D-077):
  ```typescript
  // SHIELD: isMock=true by default (D-077) · real API requires BANNED_WORD_ENABLE=true + BANNED_WORD_API_URL
  export class BannedWordService {
    private readonly isMock: boolean;
    private readonly apiUrl: string;
    private readonly mockDictionary: string[]; // 内置 stub 词库(政治 / 暴力 / 色情 / 赌博 各 5-10 词)

    constructor(
      apiUrl: string = process.env.BANNED_WORD_API_URL ?? '',
      isMock: boolean = process.env.BANNED_WORD_ENABLE !== 'true',
    ) {
      this.isMock = isMock;
      this.apiUrl = apiUrl;
      this.mockDictionary = isMock ? buildMockDictionary() : [];
      if (!this.isMock && !this.apiUrl) {
        throw new ConfigurationError('BANNED_WORD_API_URL is required when BANNED_WORD_ENABLE=true');
      }
    }

    async scan(text: string): Promise<{ hits: string[]; category: 'politics'|'violence'|'porn'|'gambling'|null }> {
      if (this.isMock) {
        // 内置 stub 扫描 mockDictionary
        const hits = this.mockDictionary.filter(w => text.includes(w));
        return { hits, category: hits.length > 0 ? classifyCategory(hits) : null };
      }
      // 真启 API 调用(留 PRR)
      const resp = await fetch(`${this.apiUrl}/scan`, { method: 'POST', body: JSON.stringify({ text }) });
      return await resp.json();
    }
  }
  ```
- [ ] H-2 · `apps/api/src/services/admin/content-review/pii-detection.service.ts` · class PIIDetectionService · 4 regex(身份证/手机/邮箱/银行卡):
  ```typescript
  // SHIELD: PII detection is purely regex local · 不调外部 API(隐私本地处理)
  const ID_CARD = /\b[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g;
  const PHONE_CN = /\b1[3-9]\d{9}\b/g;
  const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;
  const BANK_CARD = /\b[1-9]\d{15,18}\b/g; // 16-19 位

  export class PIIDetectionService {
    detect(text: string): { idCards: string[]; phones: string[]; emails: string[]; bankCards: string[]; total: number } {
      const idCards = [...text.matchAll(ID_CARD)].map(m => m[0]);
      const phones = [...text.matchAll(PHONE_CN)].map(m => m[0]);
      const emails = [...text.matchAll(EMAIL)].map(m => m[0]);
      const bankCards = [...text.matchAll(BANK_CARD)].map(m => m[0]);
      return { idCards, phones, emails, bankCards, total: idCards.length + phones.length + emails.length + bankCards.length };
    }

    /** Redact PII 后供 logging / audit · 不能持久化原 PII */
    redact(text: string): string {
      return text.replace(ID_CARD, '[ID-REDACTED]').replace(PHONE_CN, '[PHONE-REDACTED]').replace(EMAIL, '[EMAIL-REDACTED]').replace(BANK_CARD, '[CARD-REDACTED]');
    }
  }
  ```
- [ ] H-3 · 2 service export singleton instance(便于跨模块复用)
- [ ] H-4 · `.env.example` 加 `BANNED_WORD_ENABLE` + `BANNED_WORD_API_URL` 注释 + PII regex 自带不需 env
- [ ] H-5 · mock dictionary 含 20+ 词(政治 5 / 暴力 5 / 色情 5 / 赌博 5)· 函数 `buildMockDictionary()` 内嵌(non-prod 真启时 dictionary 来自 API)

##### E 错误 / 边界
- [ ] E-1 · BANNED_WORD_ENABLE='true' + BANNED_WORD_API_URL 空 · 抛 ConfigurationError 服务启动 fail-fast(同 DingtalkService 模式)
- [ ] E-2 · text 空 / null · 返 `{ hits: [], category: null }`(banned-word)/ `{ ..., total: 0 }`(PII)· 不抛
- [ ] E-3 · 真启 API fetch 失败(网络断 / 5xx)· log warn + fall back 'needs_review' verdict(保守 · 不放行 risky 内容)
- [ ] E-4 · PII regex 误报(如 邮箱含国际域名)· 抽样人审兜底(由 US-005 procedure 处理)

##### B 后端
- [ ] B-1 · 单元测试 `apps/api/src/services/admin/content-review/__tests__/banned-word.service.test.ts` · isMock × API ENABLE × ConfigurationError × scan 边界 · 8+ test
- [ ] B-2 · 单元测试 `apps/api/src/services/admin/content-review/__tests__/pii-detection.service.test.ts` · 4 regex × empty / single / multi / redact · 10+ test
- [ ] B-3 · `pnpm test` 全过 · `pnpm typecheck` 0 error
- [ ] B-4 · audit-redlines 加 R-A7? PII 不入 admin_audit_log payload(redact 必做)· 跑过 0 命中

##### P 前端
- [ ] P-1 · 无前端

**files_to_create** ·
- `apps/api/src/services/admin/content-review/banned-word.service.ts`
- `apps/api/src/services/admin/content-review/pii-detection.service.ts`
- `apps/api/src/services/admin/content-review/__tests__/banned-word.service.test.ts`
- `apps/api/src/services/admin/content-review/__tests__/pii-detection.service.test.ts`

**files_to_modify** ·
- `.env.example`(+ BANNED_WORD_ENABLE / BANNED_WORD_API_URL)

**anti_patterns**:
1. **isMock 默认 false** · 反例 default isMock=false → 必须配 BANNED_WORD_API_URL → dev 启动 fail · 正例 isMock=true 默认(D-077 严格复用)
2. **PII 原文入 audit_log** · 反例 audit 写 payload 含 raw 身份证 · 正例 redact 后写 + payloadHash 用 redact 数据(LD-A-3 + GDPR)
3. **真启 API 失败默认 approve** · 反例 fetch fail → autoVerdict='auto_approved' 放行 · 正例 fall back 'needs_review' 保守

---

#### US-004 · adminRouter.reviewTrending 6 procedure(list / detail / approve / reject / batchAction / configRules)

**risk_level** · high
**size_hint** · medium
**priority** · 4
**depends_on** · ["US-001", "US-002", "US-003"]

**描述** · 作为前端开发者 · 6 procedure 让 admin(reviewer 模式)+ super_admin 操作审核队列。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/trpc/routers/admin/review-trending.ts` 新建 reviewTrendingRouter · 6 procedure 全走 adminProcedure(7 闸链复用):
  - `list` · zod input(page/pageSize/statusFilter/platformFilter/dateRange/autoVerdictFilter)· $transaction + SET LOCAL · 分页 + filter · 写 audit `eventCategory='data_query' eventType='list_trending_review_queue'`
  - `detail` · 输入 queueId · 返回完整 rawContent + autoScanResult + 链路追溯(若已通过 trendingItemId)· cross_account_query audit
  - `approve` · zod input(queueId, reviewerNote optional)· 修改 status='approved' + 触发入主 trending_items 表(prisma.trendingItem.create · 这是唯一允许 trendingItem.create 的地方)+ 写 audit `eventCategory='data_mutation' eventType='trending_review_approve'`
  - `reject` · zod input(queueId, rejectReason min 5)· status='rejected' + 写 audit `eventType='trending_review_reject'`
  - `batchAction` · zod input(queueIds[], action 'approve'|'reject', reason)· 批量处理 + each item 单独 audit · max 100 per batch
  - `configRules` · zod input(ruleType, ruleKey, ruleValue, enabled)· 仅 super_admin · 更新 auto_review_rules · 写 audit `eventCategory='config_change' eventType='auto_review_rule_update'`
- [ ] H-2 · adminRouter index.ts 挂载 `reviewTrending: reviewTrendingRouter`
- [ ] H-3 · `approve` procedure 用 prisma.$transaction · 内一次性:update queue status + create trending_items + update queue.trendingItemId(原子链路 · 防 inconsistency)
- [ ] H-4 · `audit-admin-rls.ts` AST 应识别 reviewTrending 6 procedure · Checked ≥ 44 procedures(累计 38 + 6)
- [ ] H-5 · `configRules` 仅 super_admin · 非 super_admin → 写 privilege_escalation audit + 403(同 NSM triggerSnapshot 模式)

##### E 错误 / 边界
- [ ] E-1 · approve 已 approved 的 queue item · 抛 ValidationError("queue item already approved")
- [ ] E-2 · reject 已 rejected · 同上
- [ ] E-3 · approve 的 queue item 已存在主 trending_items(trendingItemId 已 set)· 抛 ValidationError(防双重入库)
- [ ] E-4 · batchAction queueIds > 100 · 抛 ValidationError("batch size exceeds 100")
- [ ] E-5 · readonly_admin 调 approve/reject/batchAction/configRules · 6 闸 roleCheck 403 · 仅 list/detail 允许
- [ ] E-6 · configRules ruleType 不在 enum · zod 校验

##### B 后端
- [ ] B-1 · 6 procedure 全 adminProcedure(7 闸链 PRD-10 已建)
- [ ] B-2 · 单元测试 `apps/api/src/trpc/routers/admin/__tests__/review-trending.test.ts` · 30+ test 覆盖:list 各 filter / detail / approve(双重检测)/ reject / batchAction(>100 拒)/ configRules(super_admin only)/ 各鉴权边界
- [ ] B-3 · `pnpm test` 全过 · `pnpm typecheck` 0 error
- [ ] B-4 · `audit-admin-rls.ts` AST 跑过 · 44 procedure 0 violations
- [ ] B-5 · `audit-redlines-admin` ALL PASS

##### P 前端
- [ ] P-1 · 无前端 · packages/clients 自动 inference

**files_to_create** ·
- `apps/api/src/trpc/routers/admin/review-trending.ts`
- `apps/api/src/trpc/routers/admin/__tests__/review-trending.test.ts`

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`(+ reviewTrending)

**anti_patterns**:
1. **approve 不走 $transaction** · 反例 update queue + 后续 create trendingItem 分两步 → 中途 crash 数据 inconsistent · 正例 $transaction 原子
2. **trendingItem.create 多处出现** · 反例 worker / approve 两处都 prisma.trendingItem.create · 正例**只 approve 一处**(LD-A-5 单点)+ grep 验证 1 命中
3. **batchAction 无 max 限制** · 反例 admin 提 10k queueIds · 单 request OOM · 正例 max 100 + 友好错

---

#### US-005 · TrendingItem 审核 UI part 1 · 列表 + 详情抽屉(P-8 拆 1/2)

**risk_level** · medium
**size_hint** · medium
**priority** · 5
**depends_on** · ["US-004"]

**描述** · 作为内容审核员 / super_admin · 打开 admin.quanqn.com/reviewTrending 看待审核 + 已审核列表 + 详情抽屉(rawContent / 自动扫描结果高亮 / 5 平台 filter)· **P-8 大 UI 拆 part 1**(5 files · 严守 plan-check 2.6.14 安全区)。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/admin/src/pages/reviewTrending/index.tsx` 主页面(part 1)· 替换 placeholder · 实现列表 + 抽屉 framework(P-8 拆分)
- [ ] H-2 · `ReviewTrendingFilters.tsx` · 多 filter(status / platform / autoVerdict / dateRange · 5 平台 dropdown)· debounce 300ms 搜索
- [ ] H-3 · `ReviewTrendingTable.tsx` · DenseTable from @quanqn/ui/admin · 列(queueId/platform/sourceUrl/autoVerdict/status/fetchedAt/操作)· virtualScroll
- [ ] H-4 · `TrendingReviewDrawer.tsx` · 右侧抽屉 · 5 段:基本(platform/url/fetchedAt)+ rawContent JSON 树(可折叠)+ autoScanResult 高亮(命中违禁词 red / PII orange)+ 审核状态 + 历史 trendingItem 链路(若已 approve)
- [ ] H-5 · OverviewCards.tsx · 顶部 4 数字 [待审核 / 已批准 / 已驳回 / 命中违禁词]
- [ ] H-6 · `admin-routes.ts` reviewTrending metadata.prd 'PRD-10 placeholder' → 'PRD-12' · sidebar 不动 · 删 placeholder.tsx

##### E 错误 / 边界
- [ ] E-1 · 列表空 · 显示 "暂无待审核内容 · TrendingScraper 抓回后会自动入队"
- [ ] E-2 · API 拉取失败 · ErrorBoundary fallback 不白屏
- [ ] E-3 · rawContent JSON 极大(> 100KB)· 默认折叠 + "展开" 按钮(防卡渲染)

##### B 后端
- [ ] B-1 · 无新后端 · 复用 US-004 procedure

##### P 前端
- [ ] P-1 · `pnpm typecheck` 全 workspace 0 error
- [ ] P-2 · agent-browser 打开 `http://localhost:5174/admin/reviewTrending`:
  - 看到顶部 4 数字 + 列表(可能空)+ 5 platform filter dropdown
  - 点列表行 → 抽屉打开 · 5 段全 visible
  - 折叠 / 展开 rawContent · 无卡顿
- [ ] P-3 · 切 platform filter(douyin/xiaohongshu/bilibili/shipinhao/kuaishou)· 列表实时刷新
- [ ] P-4 · console 0 error · 0 React key warning
- [ ] P-5 · 刷新页面 · filter 状态 URL 持久化(useSearchParams)

**files_to_create** ·
- `apps/admin/src/pages/reviewTrending/index.tsx`(替换 placeholder)
- `apps/admin/src/pages/reviewTrending/ReviewTrendingFilters.tsx`
- `apps/admin/src/pages/reviewTrending/ReviewTrendingTable.tsx`
- `apps/admin/src/pages/reviewTrending/TrendingReviewDrawer.tsx`
- `apps/admin/src/pages/reviewTrending/OverviewCards.tsx`

**files_to_modify** ·
- `apps/admin/src/lib/admin-routes.ts`(reviewTrending metadata.prd = "PRD-12")
- 删 `apps/admin/src/pages/admin/placeholder/reviewTrending.tsx`

**anti_patterns**:
1. **rawContent JSON 全展开默认** · 反例 100KB+ JSON 全 DOM render 卡顿 · 正例默认折叠 + "展开" 按钮 lazy render
2. **filter 不持久化** · 反例 URL 不含 filter · 刷新 reset · 正例 useSearchParams 同步
3. **DenseTable 重新撸 div table** · 反例 1000+ 行 div 假表格 · 正例 @quanqn/ui/admin DenseTable virtualScroll · D-075

---

#### US-006 · TrendingItem 审核 UI part 2 · 批量按钮 + 自动规则配置(P-8 拆 2/2)

**risk_level** · medium
**size_hint** · medium
**priority** · 6
**depends_on** · ["US-005"]

**描述** · TrendingItem 审核 UI part 2 · 批量操作 + auto_review_rules 配置(仅 super_admin)· P-8 拆 2/2 完整审核能力。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/admin/src/pages/reviewTrending/BatchActionBar.tsx` · 批量选中 + 批量批准 / 批量驳回 按钮 · 必填 reason · 调 batchAction · max 100 校验
- [ ] H-2 · `apps/admin/src/pages/reviewTrending/RejectReasonDialog.tsx` · 单条 / 批量驳回 reason 弹窗 · min 5 字符校验
- [ ] H-3 · `apps/admin/src/pages/reviewTrending/AutoRuleConfigPanel.tsx` · auto_review_rules 配置面板 · 仅 super_admin visible · ruleType dropdown(banned_word / sampling_rate / industry_quota)+ ruleKey + ruleValue Json 编辑器(Monaco optional · 或 textarea + JSON.parse)+ enabled toggle
- [ ] H-4 · `apps/admin/src/pages/reviewTrending/index.tsx` 集成 part 2 · 列表上方加 BatchActionBar + 顶部 Tab 切换 [待审核 / 已批准 / 已驳回 / 规则配置]
- [ ] H-5 · 规则 Tab 仅 super_admin 显示 · 用 role === 'super_admin' 判断

##### E 错误 / 边界
- [ ] E-1 · 批量 > 100 · 提交前禁用按钮 + 提示 "最多批处理 100 条"
- [ ] E-2 · 0 选中 · 批量按钮 disabled
- [ ] E-3 · reason < 5 字符 · 提交前禁用 + 红字提示
- [ ] E-4 · ruleValue 非合法 JSON · 提交前 JSON.parse catch + 错误提示
- [ ] E-5 · readonly_admin / admin 隐藏 [规则配置] Tab

##### B 后端
- [ ] B-1 · 无新后端

##### P 前端
- [ ] P-1 · agent-browser 打开 reviewTrending page:
  - 多选 3 条列表行 → BatchActionBar 显示 "已选 3 条" + [批量批准] [批量驳回]
  - 点 [批量批准] → 弹 RejectReasonDialog(approval reason)→ 提交 → toast "已批准 3 条"
  - 切 [规则配置] Tab(super_admin)· 看到 AutoRuleConfigPanel · 添加新规则 + 提交 → audit log 写入 'auto_review_rule_update'
- [ ] P-2 · admin / readonly_admin · 切 [规则配置] Tab 不可见(显式隐藏)
- [ ] P-3 · console 0 error · typecheck 全过

**files_to_create** ·
- `apps/admin/src/pages/reviewTrending/BatchActionBar.tsx`
- `apps/admin/src/pages/reviewTrending/RejectReasonDialog.tsx`
- `apps/admin/src/pages/reviewTrending/AutoRuleConfigPanel.tsx`

**files_to_modify** ·
- `apps/admin/src/pages/reviewTrending/index.tsx`(part 1 + part 2 集成 · Tab 切换)

**anti_patterns**:
1. **批量按钮无 max 前端校验** · 反例选 1k 行点提交 · 后端拒 + 用户体验差 · 正例前端 disabled + 提示
2. **AutoRuleConfigPanel 给所有 admin 看** · 反例 admin / readonly_admin 也能看 · 正例严格 role === 'super_admin' 才 render
3. **JSON 编辑器无 parse 校验** · 反例 submit 后端校验返 400 · 正例前端 JSON.parse 提前 catch + 红字

---

### 🟦 域 ⑧ · DeepLearningArchive 审核(6 US · US-007~012)

★ **用户内容合规防线** · 用户上传(≤ 20MB PDF/Word/CSV/MD/TXT)**不直接 prisma.deepLearningArchive.create** · 必经 deep_learn_review_queue · PII 扫描 + 违禁词扫描 + 抽样人审 · 防泄露 GDPR / 误注入 prompt。

---

#### US-007 · deep_learn_review_queue + user_violation_log 2 schema

**risk_level** · medium
**size_hint** · small
**priority** · 7
**depends_on** · ["US-001"]

**描述** · 作为开发者 · 需要 2 张 admin 表(deep_learn_review_queue + user_violation_log)· 同 US-001 模式严格复用。

**AC**:

##### H 幸福路径
- [ ] H-1 · `prisma/schema.prisma` 加 2 model 严格按 DATA-MODEL §13.6.E 行 3322-3375:
  - `DeepLearnReviewQueue` · 字段(userId / accountId / fileName / fileMime / fileSize / fileUrl / uploadedAt / autoScanResult / autoVerdict / status / reviewerAdminId? / reviewedAt? / rejectReason? / archiveId?)+ 4 indexes
  - `UserViolationLog` · 字段(userId / violationType / count / lastViolationAt / lastReviewItemId? / warningCount / suspendedAt? / suspendedByAdminId? / suspendedReason?)+ @@unique([userId, violationType]) + 2 indexes
- [ ] H-2 · migration + manual_admin_rls + audit-admin-rls-tables · 同 US-001 三联同步(D-073 模式)
- [ ] H-3 · psql 实测 RLS=f · audit-admin-rls-tables 18/18 admin tables 全过(13 PRD-10/11 + 3 PRD-12 US-001 + 2 新)
- [ ] H-4 · zod schema 加 deep-learn-review.schema.ts + user-violation.schema.ts

##### E 错误 / 边界
- [ ] E-1 · @@unique([userId, violationType]) 重复触发 · service 层 upsert · count + 1
- [ ] E-2 · fileSize > 20MB(20 × 1024 × 1024)· 由 US-008 worker 入口校验拒绝 · 此层不约束
- [ ] E-3 · violationType 不在 enum('pii_upload' | 'banned_content' | 'trending_abuse' | 'other')· zod 校验
- [ ] E-4 · status enum 同 trending_review(pending/approved/rejected/auto_approved/auto_rejected)

##### B 后端
- [ ] B-1 · 单元测试 `apps/api/src/schemas/admin/__tests__/deep-learn-review.schema.test.ts` 8+ test
- [ ] B-2 · `pnpm test` 全过 · `pnpm typecheck` 0 error

##### P 前端
- [ ] P-1 · 无

**files_to_create** ·
- `apps/api/src/schemas/admin/deep-learn-review.schema.ts`
- `apps/api/src/schemas/admin/user-violation.schema.ts`
- `apps/api/src/schemas/admin/__tests__/deep-learn-review.schema.test.ts`
- `prisma/migrations/20260514_add_deep_learn_review_tables/migration.sql`

**files_to_modify** ·
- `prisma/schema.prisma`(+ 2 model)
- `prisma/migrations/manual_admin_rls.sql`(+ 2 ALTER TABLE)
- `scripts/audit-admin-rls-tables.sh`(+ 2 表)

**anti_patterns**:
1. **violationType String 不限 enum** · 反例任意字符串 · 防 ad-hoc 字段 abuse · 正例 zod enum
2. **upsert 计数错 ON CONFLICT** · 反例自己 try findFirst then create · race condition 重复 · 正例 prisma upsert 原子 · count + 1

---

#### US-008 · FileParser worker 接入 review queue + PII + 违禁词扫描(★ LD-A-5 硬闸门)

**risk_level** · high
**size_hint** · medium
**priority** · 8
**depends_on** · ["US-003", "US-007"]

**描述** · 改 FileParser worker · 用户上传 → 不直接 prisma.deepLearningArchive.create · 入 deep_learn_review_queue · 自动跑 PII + 违禁词扫描 + 计算 autoVerdict。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/workers/file-parser/worker.ts`(若仅 .gitkeep 占位 · 新建 worker 入口)· 上传后:
  - 校验 fileSize ≤ 20 × 1024 × 1024(20MB)· 超 拒绝 + 用户提示
  - 解析文件 → 提取 text(PDF/Word/CSV/MD/TXT 各 parser)
  - 调 PIIDetectionService.detect(text) + BannedWordService.scan(text)
  - 计算 autoVerdict:命中 PII ≥ 1(身份证/银行卡 强敏感)→ 'auto_rejected' / 命中违禁词 → 'auto_rejected' / 抽样 10% 中或偏门 → 'needs_review' / 其他 'auto_approved'
  - 写入 prisma.deepLearnReviewQueue · text 字段 redact 后写(防原 PII 持久化)
  - **绝对不能** `prisma.deepLearningArchive.create({})` 直接入库
- [ ] H-2 · `apps/api/src/services/admin/content-review/deep-learn-auto-verdict.service.ts` · 计算 autoVerdict 逻辑
- [ ] H-3 · 抽样 10% 用 `Math.random() < 0.1` 简单实现(US-013 cron 重 sample 不重)
- [ ] H-4 · 上传到 S3(stub · 留 PRR)· fileUrl 暂用 'mock-s3://bucket/file.pdf'(D-077 isMock 模式)
- [ ] H-5 · 写 audit `eventCategory='data_mutation' eventType='file_parser_enqueue'`(system actor)

##### E 错误 / 边界
- [ ] E-1 · fileSize > 20MB · 用户拒绝 + log warn + 不入 queue
- [ ] E-2 · fileMime 不在白名单(PDF/Word/CSV/MD/TXT)· 拒绝
- [ ] E-3 · 解析失败(损坏文件 / encoding 错)· autoVerdict='needs_review' + log warn + 仍入 queue(让 admin 决定)
- [ ] E-4 · PII detect 命中身份证 / 银行卡 ≥ 1 · 强制 autoVerdict='auto_rejected'(强敏感)
- [ ] E-5 · 抽样 10% 跑出 'needs_review' 即使 0 hits

##### B 后端
- [ ] B-1 · 单元测试 `apps/api/src/workers/file-parser/__tests__/worker-review-queue.test.ts` · 12+ test 覆盖 5 file type / autoVerdict 4 分支 / size 限制 / mime 白名单
- [ ] B-2 · 单元测试 deep-learn-auto-verdict.service · 8+ test
- [ ] B-3 · ★ grep verify `grep -r "prisma.deepLearningArchive.create" apps/api/src/workers/file-parser/` → **必须 0 命中**
- [ ] B-4 · `pnpm test` 全过 · `pnpm typecheck` 0 error

##### P 前端
- [ ] P-1 · 无

**files_to_create** ·
- `apps/api/src/workers/file-parser/worker.ts`(转真实现)
- `apps/api/src/services/admin/content-review/deep-learn-auto-verdict.service.ts`
- `apps/api/src/workers/file-parser/__tests__/worker-review-queue.test.ts`

**files_to_modify** ·
- (若现有 worker) `apps/api/src/workers/file-parser/*.ts`

**anti_patterns**:
1. **LD-A-5 漏 enforce(deep_learn 路径)** · 反例 worker 写 deepLearningArchive · 正例必经 deep_learn_review_queue
2. **PII 解析后原文入 audit_log** · 反例 audit payload 含 raw 身份证 · 正例 redact 后 write + payloadHash 用 redact 数据
3. **fileSize 后端不校验** · 反例信前端校验 · 攻击者绕 · 正例 worker 入口 + S3 上传两道校验

---

#### US-009 · adminRouter.reviewDeepLearn 6 procedure(list / detail / approve / reject / banUploader / userViolations)

**risk_level** · high
**size_hint** · medium
**priority** · 9
**depends_on** · ["US-007", "US-008"]

**描述** · 6 procedure 让 admin(reviewer 模式) + super_admin 处理 deep_learn 审核 + 用户违规累计追踪 + 暂停上传(走 Approval Gates stub)。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/trpc/routers/admin/review-deep-learn.ts` 新建 reviewDeepLearnRouter · 6 procedure:
  - `list` · zod(page/pageSize/statusFilter/userIdFilter/dateRange/autoVerdictFilter)· filter + paginate
  - `detail` · 输入 queueId · 返回完整 autoScanResult + 文件 metadata + 解析 text 预览(redact 后)+ 用户当前违规累计
  - `approve` · status='approved' + 触发入 deep_learning_archives + 写 audit
  - `reject` · status='rejected' + 升 user_violation_log count + 1 + audit
  - `banUploader` · ★ 高风险动作 · 走 Approval Gates stub(super_admin auto_executed / admin pending)+ update user_violation_log.suspendedAt + admin_audit_log eventCategory='high_risk_action' eventType='ban_uploader' approvalRequestId
  - `userViolations` · 输入 userId 或 null(列全部高违规用户)· 返回 user_violation_log 数据 · 高违规用户 = count ≥ 3
- [ ] H-2 · adminRouter index.ts 挂载 `reviewDeepLearn`
- [ ] H-3 · audit-approval-gates EXCEPTION 加 `admin.reviewDeepLearn.banUploader` · pnpm audit:approval-gates 14 checks 0 missing(累计 PRD-11 13 + PRD-12 1)
- [ ] H-4 · audit-admin-rls.ts AST 应 Checked ≥ 50 procedure(累计 44 + 6)
- [ ] H-5 · 用户违规累计自动告警 · reject 时若 count + 1 >= 3 → admin_audit_log eventCategory='security_alert' eventType='user_violation_warning'

##### E 错误 / 边界
- [ ] E-1 · approve / reject 已处理 queue · ValidationError
- [ ] E-2 · banUploader 已 suspended user · ValidationError
- [ ] E-3 · readonly_admin · approve / reject / banUploader 全 403
- [ ] E-4 · admin 调 banUploader · 走 申请 + pending(super_admin 审)
- [ ] E-5 · userViolations 高违规用户 = count ≥ 3 default 排序 desc count

##### B 后端
- [ ] B-1 · 6 procedure 全 adminProcedure
- [ ] B-2 · 单元测试 30+ test 覆盖各路径 + 鉴权
- [ ] B-3 · `pnpm test` 全过 · `pnpm typecheck` 0 error
- [ ] B-4 · audit-approval-gates 14 checks 0 missing
- [ ] B-5 · audit-admin-rls AST 50 procedure 0 violations

##### P 前端
- [ ] P-1 · 无

**files_to_create** ·
- `apps/api/src/trpc/routers/admin/review-deep-learn.ts`
- `apps/api/src/trpc/routers/admin/__tests__/review-deep-learn.test.ts`

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`(+ reviewDeepLearn)
- `scripts/audit-approval-gates.ts`(+ reviewDeepLearn.banUploader EXCEPTION)

**anti_patterns**:
1. **banUploader 漏 Approval Gates** · 反例 prisma.userViolationLog.update({suspendedAt:NOW()}) 直接 · 正例必经 approval_requests + audit · LD-A-4 + PRD-11 模式严格复用
2. **reject 不累计 violation_log** · 反例 reject 仅 update queue.status · 正例同时 userViolationLog.upsert count+1 · 防警告链断
3. **user_violation count + 1 race** · 反例 findFirst + update 两步 · 正例 prisma.userViolationLog.upsert + increment

---

#### US-010 · DeepLearning 审核 UI part 1 · 列表 + 详情抽屉(P-8 拆 1/2)

**risk_level** · medium
**size_hint** · medium
**priority** · 10
**depends_on** · ["US-009"]

**描述** · admin.quanqn.com/reviewDeepLearn · 列表 + 抽屉 framework(P-8 拆 1/2)。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/admin/src/pages/reviewDeepLearn/index.tsx` 主页面 part 1 · 替换 placeholder
- [ ] H-2 · `ReviewDeepLearnFilters.tsx` · userIdFilter / statusFilter / autoVerdictFilter / fileMimeFilter
- [ ] H-3 · `ReviewDeepLearnTable.tsx` · DenseTable · 列(queueId/userId/fileName/fileSize/autoVerdict/status/uploadedAt/操作)
- [ ] H-4 · `DeepLearnReviewDrawer.tsx` · 右侧抽屉 · 6 段:基本信息 + 文件 metadata + autoScanResult(PII / 违禁词命中高亮)+ 解析后 text 预览(redact 显示)+ 用户当前 violation count + 历史 archiveId 链路
- [ ] H-5 · `OverviewCards.tsx` · 顶部 3 数字 [待审核 / 命中 PII / 命中违禁]
- [ ] H-6 · admin-routes reviewDeepLearn metadata.prd = "PRD-12" · 删 placeholder

##### E 错误 / 边界
- [ ] E-1 · 列表空 · 显示 "暂无待审核内容 · 用户上传后会自动入队"
- [ ] E-2 · text 预览 > 5KB · 默认折叠 + 展开按钮
- [ ] E-3 · API 失败 ErrorBoundary

##### B 后端
- [ ] B-1 · 无新

##### P 前端
- [ ] P-1 · pnpm typecheck 全过 · admin/reviewDeepLearn dev server 200
- [ ] P-2 · agent-browser 打开 / 点列表行 → 抽屉 6 段 visible
- [ ] P-3 · console 0 error · filter 状态 URL 持久化

**files_to_create** ·
- `apps/admin/src/pages/reviewDeepLearn/index.tsx`(替换 placeholder)
- `apps/admin/src/pages/reviewDeepLearn/ReviewDeepLearnFilters.tsx`
- `apps/admin/src/pages/reviewDeepLearn/ReviewDeepLearnTable.tsx`
- `apps/admin/src/pages/reviewDeepLearn/DeepLearnReviewDrawer.tsx`
- `apps/admin/src/pages/reviewDeepLearn/OverviewCards.tsx`

**files_to_modify** ·
- `apps/admin/src/lib/admin-routes.ts`(reviewDeepLearn metadata.prd = "PRD-12")
- 删 `apps/admin/src/pages/admin/placeholder/reviewDeepLearn.tsx`

**anti_patterns**:
1. **抽屉显示原 text(未 redact)** · 反例 admin SPA 显示完整 raw 身份证(虽 admin 内网 · 但 LD-A-3 仍要求 redact)· 正例 redact 显示 + 原文不入前端
2. **filter 漏 URL 持久化** · 反例刷新 reset · 正例 useSearchParams

---

#### US-011 · DeepLearning 审核 UI part 2 · 文件预览 + 用户违规 Tab(P-8 拆 2/2)

**risk_level** · medium
**size_hint** · medium
**priority** · 11
**depends_on** · ["US-010"]

**描述** · part 2 · 文件预览组件(PDF/Word/MD/TXT 嵌入查看 stub · 真启 PDF.js / mammoth.js 留 PRR)+ 用户违规累计 Tab + banUploader Dialog。

**AC**:

##### H 幸福路径
- [ ] H-1 · `FilePreviewPanel.tsx` · 根据 fileMime 显示:
  - PDF · `<iframe src={fileUrl}>` stub · 真启 PDF.js
  - Word · "Word 文件预览功能见 PRR · 当前显示解析 text"
  - TXT/MD · 直接显示 text 内容(redact)
  - CSV · 简单 table 渲染(<table>)
- [ ] H-2 · `UserViolationsTab.tsx` · 高违规用户列表(count ≥ 3)· DenseTable · 列(userId/email/violationType/count/lastViolationAt/suspendedAt/操作)
- [ ] H-3 · `BanUploaderDialog.tsx` · reason 文本框 + 提交调 reviewDeepLearn.banUploader · super_admin 直批 / admin pending
- [ ] H-4 · `apps/admin/src/pages/reviewDeepLearn/index.tsx` 集成 part 2 · Tab 切换 [待审核 / 已批准 / 已驳回 / 用户违规累计]
- [ ] H-5 · readonly_admin 隐藏 [封禁用户] 按钮

##### E 错误 / 边界
- [ ] E-1 · fileMime 不支持预览 · 显示 "预览功能见 PRR · 当前查看 metadata + autoScanResult"
- [ ] E-2 · reason < 10 字符 · 前端 disabled + 红字
- [ ] E-3 · suspended user 重复 banUploader · 前端 disabled

##### B 后端
- [ ] B-1 · 无新

##### P 前端
- [ ] P-1 · agent-browser 打开 reviewDeepLearn page:
  - 切 Tab [用户违规累计] · 看到高违规用户列表
  - 点 [封禁上传] → BanUploaderDialog · reason 输入 + 提交 → toast
  - 抽屉切 FilePreviewPanel · 不同 mime 不同 fallback
- [ ] P-2 · admin 提 ban 申请 → 显示 "已提交等审批"
- [ ] P-3 · console 0 error · typecheck 全过

**files_to_create** ·
- `apps/admin/src/pages/reviewDeepLearn/FilePreviewPanel.tsx`
- `apps/admin/src/pages/reviewDeepLearn/UserViolationsTab.tsx`
- `apps/admin/src/pages/reviewDeepLearn/BanUploaderDialog.tsx`

**files_to_modify** ·
- `apps/admin/src/pages/reviewDeepLearn/index.tsx`(part 2 集成 · Tab 切换)

**anti_patterns**:
1. **PDF iframe 跨域** · 反例 fileUrl S3 跨域 iframe 加载失败 · 正例 PRR 评估 PDF.js · 当前 stub 提示
2. **BanUploaderDialog 不显示 admin 是 pending** · 反例 admin 看到 toast "封禁成功" 误以为已生效 · 正例显示 "已提交等审批"

---

#### US-012 · 用户违规累计告警 cron + 自动暂停上传 + index.ts wire(★ Diff-3 验证)

**risk_level** · medium
**size_hint** · small
**priority** · 12
**depends_on** · ["US-009"]

**描述** · BullMQ cron 每日 04:00 跑 detectViolationThresholds · count ≥ 3 → admin 警告告警 · count ≥ 5 → 自动 trigger banUploader(走 Approval stub)· **★ 严格 wire scheduleViolationDetection() 到 index.ts**(PRD-11 US-009 教训 + Diff-3 验证)。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/jobs/admin/violation-detection.job.ts` · BullMQ cron pattern '0 4 * * *' tz 'Asia/Shanghai' jobId 'violation-detection-recurring'(错峰 KPI/anomaly · 04:00)
- [ ] H-2 · `apps/api/src/services/admin/content-review/violation-detection.service.ts` · detectViolationThresholds:
  - 查 user_violation_log count ≥ 3 + 未 suspended · 写 admin_audit_log `eventCategory='security_alert' eventType='user_violation_warning'`
  - count ≥ 5 + 未 suspended · 触发 banUploader 申请(走 Approval Gates stub · super_admin 直批模式)
  - dedupe per (userId, violationType) per day
- [ ] H-3 · ★ `apps/api/src/index.ts` 加 scheduleViolationDetection() 调用(line ~325+ 之后)· 必经 Diff-3 plan-check 2.6.15 验证
  ```typescript
  // AC-3 US-012: register user violation detection cron (0 4 * * * Asia/Shanghai)
  const { scheduleViolationDetection } = await import('./jobs/admin/violation-detection.job');
  await scheduleViolationDetection();
  logger.info('violation_detection_cron.registered');
  ```
- [ ] H-4 · BullMQ attempts:3 + failed event 写 admin_audit_log `eventCategory='system_alert' eventType='violation_cron_failed'`
- [ ] H-5 · isMock 默认通知 stub(钉钉 webhook 复用 DingtalkService · isMock=true 默认)

##### E 错误 / 边界
- [ ] E-1 · 同 user 同 violationType 同日重复 detect · dedupe via adminAuditLog.findFirst(同 cost-anomaly 模式)
- [ ] E-2 · count = 5 但已 suspended · skip
- [ ] E-3 · cron 失败 3 次进 failed queue + admin_audit_log

##### B 后端
- [ ] B-1 · 单元测试 violation-detection.service · 10+ test 覆盖 count 各阈值 / dedupe / suspended skip
- [ ] B-2 · 单元测试 violation-detection.job · 7+ test
- [ ] B-3 · ★ grep verify · `scheduleViolationDetection in apps/api/src/index.ts` ≥ 2 命中(import + call)(Diff-3 验证)
- [ ] B-4 · `pnpm test` 全过 · `pnpm typecheck` 0 error · `audit-redlines-admin` ALL PASS

##### P 前端
- [ ] P-1 · 无 UI

**files_to_create** ·
- `apps/api/src/jobs/admin/violation-detection.job.ts`
- `apps/api/src/jobs/admin/__tests__/violation-detection.job.test.ts`
- `apps/api/src/services/admin/content-review/violation-detection.service.ts`
- `apps/api/src/services/admin/content-review/__tests__/violation-detection.service.test.ts`

**files_to_modify** ·
- `apps/api/src/index.ts`(+ scheduleViolationDetection() · ★ 严格 wire)

**anti_patterns**:
1. **scheduleViolationDetection 漏 wire index.ts** · 反例 US-009 教训重现(只定义不 wire · cron 永不 fire)· 正例严格 +5 lines wire(Diff-3 plan-check 2.6.15 自动 catch)
2. **dedupe per user per day 漏** · 反例同日告警 N 次扰民 · 正例 adminAuditLog.findFirst(同 cost-anomaly US-015 模式)

---

### 🟦 收官(1 US · US-013)

---

#### US-013 · adminRouter index 挂载 + admin-routes prd: 12 + 删 2 placeholder + verify-prd-12.sh

**risk_level** · high
**size_hint** · medium
**priority** · 13
**depends_on** · ["US-006", "US-011", "US-012"]

**描述** · 收官 · 确认 adminRouter index 挂载 reviewTrending + reviewDeepLearn · admin-routes 2 路由 prd: 12 · 删 2 placeholder · 写 verify-prd-12.sh 9 段 self-test。

**AC**:

##### H 幸福路径
- [ ] H-1 · `apps/api/src/trpc/routers/admin/index.ts` 挂载 `reviewTrending: reviewTrendingRouter, reviewDeepLearn: reviewDeepLearnRouter`(US-004 + US-009 已加 · 此处确认)
- [ ] H-2 · `apps/admin/src/lib/admin-routes.ts` 2 路由 metadata.prd = 12:
  ```typescript
  { path: '/admin/reviewTrending', prd: 12, ... },
  { path: '/admin/reviewDeepLearn', prd: 12, ... },
  ```
- [ ] H-3 · 删 2 placeholder.tsx · `git rm apps/admin/src/pages/admin/placeholder/reviewTrending.tsx reviewDeepLearn.tsx`
- [ ] H-4 · `scripts/verify-prd-12.sh` 9 段 self-test(参 verify-prd-11.sh 模板):
  - §1 workspace check
  - §2 RLS 双向 check(18/18 admin RLS=false + 15/15 main RLS=true)
  - §3 audit-redlines-admin ALL PASS
  - §4 audit-admin-rls.ts AST ≥ 50 procedure 0 violations
  - §5 PRD-12 文件存在 check(13 US 主要 files 抽样)
  - §6 2 placeholder.tsx 已删 + admin-routes 2 路由 prd: 12
  - §7 关键反例 grep multi-layer 防护(LD-A-5 grep · trending-scraper 0 命中 prisma.trendingItem.create · file-parser 0 命中 prisma.deepLearningArchive.create)
  - §8 admin-integration · 2 URL 200(/admin/reviewTrending /admin/reviewDeepLearn)
  - §9 typecheck + lint
- [ ] H-5 · `chmod +x scripts/verify-prd-12.sh`
- [ ] H-6 · 跑 `bash scripts/verify-prd-12.sh` · ≥ 30 PASS / 0 FAIL

##### E 错误 / 边界
- [ ] E-1 · adminRouter index.ts 已挂(US-004 US-009 已加)· 此处不重复
- [ ] E-2 · admin-routes 字段 prd: 12 严格(PRD-10 已预填模板 · 仅改 2 处)
- [ ] E-3 · verify-prd-12.sh fast mode 仅 skip e2e + 浏览器烟测(类 verify-prd-11)

##### B 后端
- [ ] B-1 · 无新

##### P 前端
- [ ] P-1 · agent-browser 打开 /admin/reviewTrending + /admin/reviewDeepLearn · 全 200
- [ ] P-2 · DenseTable virtualScroll 1000+ 行流畅
- [ ] P-3 · console 0 error · 6 业务页(PRD-11 5 + PRD-12 2)全部 visible

**files_to_create** ·
- `scripts/verify-prd-12.sh`

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`(确认 2 router 挂载)
- `apps/admin/src/lib/admin-routes.ts`(2 路由 metadata.prd = 12)
- 删 2 placeholder.tsx

**anti_patterns**:
1. **verify-prd-12.sh fast skip 全部 audit** · 反例 fast mode 假绿灯 · 正例 fast 仅 skip e2e · keep 静态 audit(PRD-11 模式)
2. **admin-routes 2 路由 prd: 漏改一个** · 反例只改 reviewTrending 漏 reviewDeepLearn · 正例 verify-prd-12.sh §6 自动 catch
3. **LD-A-5 grep verify 缺失** · 反例 verify 不检 worker 没绕 review queue · 正例 §7 grep 2 关键路径 `prisma.{trendingItem|deepLearningArchive}.create` 在 workers 内 0 命中

---

## §2 · Acceptance Criteria 4 类总览

继承 PRD-11 严格 4 类(H/E/B/P)· 每 US ≥ 12 AC · seed 标准。

---

## §3 · 范围排除(Non-Goals)

### §3.1 留 PRD-13 P9.3

- 域 ⑨ 进化档案监控(evolution_anomaly_flags)
- 域 ⑩ Specialist Prompt 版本管理
- 域 ⑪ 配额 / 限流管理 UI(US-012 user_quota 表已建)
- 域 ⑫ 行业合规仪表盘
- 域 ⑬ Approval Gates 完整 dual approval UI(本 PRD 仍 stub super_admin 单批)

### §3.2 留 PRD-14 P9.4

- A/B 测试 / 知识库 / 系统配置中心

### §3.3 留 PRR

- 违禁词库真启 API(BANNED_WORD_ENABLE='true' + URL)
- S3 真启上传(当前 mock URL)
- PDF.js / mammoth.js 文件预览组件(当前 stub)
- 用户申诉机制(trending_takedown.appealResolution 字段已就位 · UI 留 PRR)

### §3.4 1.0 不做

- 多语言违禁词库(仅中文)
- 视频帧违规识别(当前仅文本)
- 实时举报系统(基于 cron + 手动审核)

---

## §4 · 风险

### §4.1 LD-A-5 漏 enforce(高)

**问题** · TrendingScraper / FileParser worker 仍 prisma.trendingItem.create / deepLearningArchive.create 直接入库 · 绕过 review queue · 违规内容污染 RAG。
**缓解** · US-002 + US-008 严格 grep 0 命中 + US-013 verify-prd-12.sh §7 自动 catch · 双层防护。
**残余** · 未来 PRD 加新 worker 时可能再绕(需 AGENTS §10 LD-A-5 + audit-redlines-admin 加 R-A7 grep 自动验证)。

### §4.2 PII 误伤 / 漏检(中)

**问题** · 4 regex(身份证/手机/邮箱/银行卡)可能误判(如邮箱国际域名)或漏检(变形写法)。
**缓解** · 抽样 10% 人审兜底 + 用户申诉机制(留 PRR)。
**残余** · 1% 误伤 / 0.5% 漏检 · 可接受。

### §4.3 batchAction 大批量性能(低)

**问题** · admin 选 100 条批量批准 · 单 request 处理 100 trending.create + audit · 5-10s 慢。
**缓解** · max 100 per batch + 后台 worker 异步处理(当前同步 OK)+ UI 进度条。
**残余** · 100 条同步可接受 · 1000 条留 PRR。

### §4.4 文件预览跨域(中)

**问题** · S3 URL + iframe 跨域 · PDF 不能预览。
**缓解** · 当前 stub · PRR PDF.js 接入。
**残余** · admin 暂时看 metadata + autoScanResult · 不影响审核决定(text 已在抽屉显示)。

### §4.5 用户违规累计告警漏报(中)

**问题** · violation-detection cron 漏跑 / 网络故障 · 高违规用户未及时告警。
**缓解** · BullMQ attempts:3 retry + failed queue audit · admin 可主动 userViolations procedure 查。
**残余** · 1 日延迟 · 可接受(非实时 SLA)。

---

## §5 · 配额(预计)

### §5.1 13 US 总耗时

| US | 估时(daemon) |
|:-:|:-:|
| US-001 trending schema | 30-40 min(foundation) |
| US-002 scraper worker 接入 | 35-45 min |
| US-003 违禁词 + PII service | 30-40 min |
| US-004 reviewTrending procedure | 40-55 min |
| US-005 reviewTrending UI part 1 | 50-65 min |
| US-006 reviewTrending UI part 2 | 35-50 min |
| US-007 deep_learn schema | 15-25 min |
| US-008 file-parser worker | 35-45 min |
| US-009 reviewDeepLearn procedure | 40-55 min |
| US-010 reviewDeepLearn UI part 1 | 45-60 min |
| US-011 reviewDeepLearn UI part 2 | 35-50 min |
| US-012 violation-detection cron | 20-30 min |
| US-013 收官 verify-prd-12.sh | 40-55 min |
| **合计** | **450-615 min(7.5-10h daemon time)** |

### §5.2 实际配置

- 13 US × ~25M token avg = ~325M token Sonnet
- 13 audit × ~7M token avg = ~90M token Opus
- 总 ~415M token · 估 $800-$1100
- Wall time · 8-12h(比 PRD-11 22 US 12h31min 短 50% · 因 0 新 framework + Playbook 成熟)

---

## §6 · 退出条件

### §6.1 ADMIN §8.4 P9.2 退出条件(权威源 · 行 1524)

- ✅ TrendingScraper 抓的内容必须通过 review 才进 RAG · LD-A-5 grep 验证
- ✅ 用户上传的 DeepLearning 样本必须通过 review 才入向量库 · LD-A-5 grep 验证
- ✅ 内容审核员每天能处理队列(2 UI page + 6 procedure × 2 域 = 12 procedure 可用)· admin_audit_log 有完整审核记录(4 新 eventType)

### §6.2 Coding 3.0 流程退出条件

- ✅ 13 US 全部 `passes=true`(prd.json)· 0 blocked
- ✅ `pnpm typecheck` 0 error · `pnpm lint` 0 warning(WARN 可接受)
- ✅ `pnpm test` 全过 · 覆盖率 ≥ 80% admin content-review services
- ✅ 4 audit script + audit-self-test 全 0 命中
- ✅ `bash scripts/verify-prd-12.sh` ≥ 30 PASS / 0 FAIL
- ✅ /goal-verify §0 GSD codebase mapper 跑 2-4 子项目 · 与 AGENTS §10 对账 · 0 偏差(若有 TD 登记)
- ✅ /goal-verify §1+ Goal-backward 验证 · ADMIN §8.4 退出条件对账
- ✅ /prd-retro 生成 §10 PRD-13 Playbook
- ✅ 反例库 ~/.claude/playbooks/reject-examples.jsonl 新增条目(若 reject 发生 · 预估 0-1)

### §6.3 git + branch 状态

- branch · `ralph/prd-12-content-review`
- 13 个 `feat: [US-NNN]` commit + 收官 commit
- main 不合并(per ADMIN §8.7 严格串行 · PRD-12~14 全跑完后整批合并)

---

## §7 · Locked Decisions(D-079 ~ D-088 · 10 LDs)

> **延续编号** · PRD-11 已用到 D-078 · PRD-12 从 **D-079** 起。

### D-079 · TrendingScraper / FileParser worker 不直接入主表(LD-A-5 硬约束)

**理由** · 防违规内容污染 RAG / Specialist · 法律 / 合规生命线。
**实现** · worker 写 trending_review_queue / deep_learn_review_queue · approve procedure 才入主表(唯一路径)。
**反例** · 不允许 worker 内 `prisma.trendingItem.create` / `prisma.deepLearningArchive.create` · grep 0 命中。

### D-080 · BannedWordService / PIIDetectionService 默认 isMock=true(D-077 严格复用)

**理由** · 真启外部 API 留 PRR · dev 用 stub 词库(20+ 词)+ 4 PII regex 本地处理。
**实现** · `process.env.BANNED_WORD_ENABLE !== 'true'`(默认 mock)· DingtalkService 同模式。
**反例** · 不允许 hardcode 真 API URL · dev / staging 必用 stub。

### D-081 · autoVerdict 默认 'needs_review'(保守模式)

**理由** · 未明确 hits + 抽样未中时 · 默认人审兜底 · 防漏检风险内容。
**实现** · `autoVerdict = (banWordHits.length > 0 || piiCriticalHits > 0) ? 'auto_rejected' : (samplingHit ? 'needs_review' : 'auto_approved')`。
**反例** · 不允许默认 'auto_approved' · 防危险内容溜进 RAG。

### D-082 · 强 PII(身份证 / 银行卡)= auto_rejected(强敏感)

**理由** · 身份证 / 银行卡 命中 ≥ 1 → 强制 auto_rejected · 不抽样不人审。
**实现** · piiCriticalHits = idCards.length + bankCards.length · ≥ 1 → autoVerdict='auto_rejected'。
**反例** · 弱 PII(手机 / 邮箱)单次命中 → 抽样人审 · 不直接 reject。

### D-083 · LD-A-3 redact 适用 PII(GDPR + LD-A-5 协同)

**理由** · audit_log payload + admin SPA 显示 + PDF 取证(US-018) · PII 全程 redact。
**实现** · 调 PIIDetectionService.redact(text) 后再 hash + 显示 / log。
**反例** · 不允许 admin_audit_log.payload 含 raw PII · grep audit-redlines 加 R-A7 验证(可选 PRD-13 加)。

### D-084 · batchAction max 100 per request

**理由** · 防 1000+ 大批 · 单 request OOM / 慢响应。
**实现** · zod max(100) + UI disabled when selected > 100。
**反例** · admin 选 1000 提交 → 后端 400 + 前端禁用 + 提示。

### D-085 · 抽样 10%(deep_learn) / 5%(trending · 偏门类目 100%)

**理由** · 平衡漏检 vs 人审压力 · 偏门类目 政治 / 名人 / 金融 / 医疗 100% 人审。
**实现** · `Math.random() < 0.1`(deep_learn)· `偏门类目 ? 'needs_review' : (Math.random() < 0.05 ? 'needs_review' : 'auto_approved')`(trending)。
**反例** · 不允许 0% 抽样 · 即使 auto_approved 也保 5% 兜底人审。

### D-086 · 用户违规累计 ≥ 3 警告 / ≥ 5 自动 ban(走 Approval stub)

**理由** · 3 次违规告警 + 5 次自动暂停(super_admin 直批) · 防长期违规用户。
**实现** · user_violation_log @@unique([userId, violationType]) + cron detectViolationThresholds 每日 04:00。
**反例** · 不允许 count = 1 立即 ban(过度 punish) · 不允许 ≥ 10 才 ban(过晚)。

### D-087 · 大 UI Story 拆 2 子(P-8 严格执行)

**理由** · PRD-11 US-007 PATH-B ECONNRESET 链教训 · plan-check 2.6.14(Diff-1)自动 catch。
**实现** · 域 ⑦ UI 拆 US-005 + US-006 · 域 ⑧ UI 拆 US-010 + US-011 · 共 4 子 UI US。
**反例** · 不允许单 US ≥ 12 files create + ≥ 8 嵌套 component。

### D-088 · cron schedule wire 严格(Diff-3 验证)

**理由** · PRD-11 US-009 reject 教训 · plan-check 2.6.15 自动 catch。
**实现** · US-012 violation-detection cron 必 wire 到 index.ts:325+ scheduleViolationDetection() · grep ≥ 2 命中。
**反例** · 不允许仅定义 schedule 函数不调用 · cron 永不 fire 是 AC 假绿灯。

---

## §8 · 反例库注入(anti_patterns · 21+ entries · 6 类继承 PRD-11 + 内容审核类新增)

### §8.1 类别 1 · LD-A-5 worker 直接入主表(★ PRD-12 新增)

注入到 · US-002 / US-008(worker 改造)+ US-004 / US-009(procedure 入库)
**核心反例** · worker `prisma.trendingItem.create({})` 或 `prisma.deepLearningArchive.create({})` 绕 review queue。
**正例** · worker 写 review queue · approve procedure 才入主表 · grep 0 命中(worker 路径)。

### §8.2 类别 2 · isMock 默认 true 外部 service(继承 D-077 + 新增 BannedWord)

注入到 · US-003 · 跟 PRD-11 DingtalkService US-015 同模式。

### §8.3 类别 3 · 大 UI Story 拆分(P-8 严格)

注入到 · US-005/006 + US-010/011(UI 拆 2 子)· 触发 plan-check 2.6.14 提示。

### §8.4 类别 4 · cron schedule wire(Diff-3 验证)

注入到 · US-012 violation-detection cron · 必 wire index.ts · plan-check 2.6.15 自动 catch。

### §8.5 类别 5 · PII redact + payloadHash(D-083 严格)

注入到 · US-008(text 处理)/ US-009(audit payload)/ US-011(UI 显示)· 全程 redact。

### §8.6 类别 6 · adminRLS LOCAL=true(继承 PRD-11)

注入到 · 全 procedure US-004 / US-009 · 严格 SET LOCAL · 不 SET global。

### §8.7 类别 7 · Recharts fill var(--accent-X)(继承)

注入到 · US-005 / US-010 UI · OverviewCards 数字若用 Recharts visualize · 必含 fill。

### §8.8 类别 8 · DenseTable @tanstack/react-virtual(继承)

注入到 · US-005 / US-010 列表 · 严格 import @quanqn/ui/admin DenseTable。

---

## §9 · 修订记录

| 版本 | 日期 | 修订人 | 内容 |
|:-:|---|---|---|
| v0.1 | 2026-05-13 | Claude(Opus 4.7)| seed 文档 · 13 US · 2 P0 内容审核域 · D-079~088 10 LD · 21+ anti_patterns 8 类(继承 6 + 新增 2)· 严格遵守 PRD-11 retro §10 Playbook P-1~P-9 |

---

## §10 · Coding 3.0 协同

### §10.1 启动 SOP(项目 CLAUDE.md §9.1 5 步)

```bash
# 1. 确认 prd-12.json + status
ls scripts/ralph/prd-12.json
python3 scripts/ralph/ralph-tools.py status

# 2. ★ 先启 Monitor(必须前于 daemon · RCA-001)

# 3. cp prd-12.json → prd.json + 启 daemon
cp scripts/ralph/prd-12.json scripts/ralph/prd.json
/Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon

# 4. 等 Monitor 通知 PENDING_DETECTED:US-NNN

# 5. 审完 → approve / reject → ralph 自动继续
```

### §10.2 Audit SOP(Step 5.5 · 含 PRD-11 retro 3 Diff 已 apply)

每 PENDING_DETECTED:US-NNN · Opus 走 5 步 Cheat Sheet:
- Step 1 audit-artifacts → **Step 1.6.b** git stash confirm pre-existing(★ Diff-2)→ Step 2 risk_level → Step 3 按档 grep → Step 4 读实现 + 协议核对 → Step 5 approve/reject

plan-check 启动前(转 prd-12.json 后)自动跑 **2.6.14 大 UI 拆分 + 2.6.15 cron wire**(★ Diff-1 + Diff-3)· 不需 Opus 手 grep。

### §10.3 收官 SOP

1. **/goal-verify** · §0 GSD codebase mapper(apps/api + apps/admin 增量更新 .planning/codebase/)+ §1+ Goal-backward + ADMIN §8.4 退出条件对账
2. **/prd-retro** · 16 章节 · §10 PRD-13 Playbook · §11 归因 · §13 Skill 升级 Diff(若有 PRD-12 新发现)
3. **commit** · `docs: [PRD-12] retro 收官 · 13/13 US PASSED · ...`

---

## §11 · PRD-13~14 接入预备

### §11.1 PRD-13 P9.3(5 P1 健康度域 · 2 周)

**5 域** · 进化档案监控(⑨)/ Specialist Prompt 版本管理(⑩)/ 配额管理(⑪ UI)/ 行业合规仪表盘(⑫)/ Approval Gates 完整 UI(⑬)

**PRD-12 → PRD-13 接入点**:
- admin_audit_log eventType 复用 + 加 prompt_publish / prompt_rollback / quota_adjustment / etc.
- 7 闸链 + DenseTable + Recharts + isMock + cron tz 全模式继承
- ★ **Approval Gates 完整 dual approval UI**(PRD-13 重头戏)· PRD-11 + PRD-12 stub 升级完整闭环(待审批列表 + 详情 + 二次审批 + 紧急通道 + 后置 24h 复核)

### §11.2 PRD-14 P9.4(3 P2 高级域 · 1 周)

**3 域** · A/B 测试 / 知识库管理 / 系统配置中心

---

> **本 PRD 由 Claude(Opus 4.7)在 PRD-12 启动期写 · 2026-05-13 · 跟全局 + 项目 CLAUDE.md + ADMIN §3.4 + §8.4 + DATA-MODEL §13.6.D/E + AGENTS §10 互补使用。**
> **下一步** · ralph skill 转 prd-12.json + /plan-check + 启 daemon。
