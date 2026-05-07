# PRD-2 · P1 数据底座

> **派生自** · [ARCHITECTURE.md §9.3](../ARCHITECTURE.md) · [§3 数据架构](../ARCHITECTURE.md) · [DATA-MODEL.md](../DATA-MODEL.md) · ADR-010/011/012 · AGENTS §3 LD-009/012
> **风险等级** · foundation(被 PRD-3 ~ PRD-9 全部 depends_on · 任何 reject 升级 high)
> **依赖前置** · PRD-1 已完成 ✅
> **预估周期** · 2 周
> **作者 / 审核** · prd skill (Opus) / Opus

---

## 元数据(frontmatter)

```yaml
prd_id: PRD-2
phase: P1 数据底座
risk_level: foundation
depends_on: [PRD-1]

prd_author: prd skill (Opus 主对话)
prd_reviewer: Opus(主对话)
prd_executor: Ralph Agent (Sonnet · daemon)
prd_verifier: Opus + 用户

status: 🟡 进行中
status_history:
  - 2026-05-08 03:45 · 🔵 → 🟡 · prd skill 启动(PRD-1 收官后)
```

---

## §0 引用清单(单一真理来源)

| 维度 | 来源 |
|---|---|
| 业务模型 | [ARCHITECTURE.md §3](../ARCHITECTURE.md) · 13 + 2 = 15 router 矩阵 + LS 18 keys + LS↔DB 双写策略 |
| UI 设计稿 | [ui/](../ui/) · P1 不动 UI(留 P2)· 仅占位 mock 数据 |
| 数据契约 | [DATA-MODEL.md](../DATA-MODEL.md) · 38 model 已 schema 就位(US-003 跑 baseline)· 仅需 RLS apply |
| 接口契约 | [ARCHITECTURE.md §3.2](../ARCHITECTURE.md) · 50+ procedure 名清单 · 全部本 PRD 实施(mock OK) |
| 退出条件 | [ARCHITECTURE.md §9.3](../ARCHITECTURE.md) · 50+ procedure 单元测试 · 多账号隔离 · LS↔DB e2e |
| 工程约束 | [AGENTS.md §3](../AGENTS.md) · LD-001/005/008/009/012/013/015 + R-1/3/6 |
| 关联 ADR | ADR-010(LS↔DB 双写)+ ADR-011(per-account 隔离 · RLS)+ ADR-012(trace_id 全栈)+ ADR-013(LLM Gateway) |
| 反例库 | [PRD-MASTER.md §6](../PRD-MASTER.md) · ~/.claude/playbooks/reject-examples.jsonl 36 条(+OAuth CSRF)|
| ★ PRD-1 沉淀 | [.planning/retros/PRD-1-RETRO.md §3](../.planning/retros/PRD-1-RETRO.md) · 8 节 Codebase Patterns · ralph 自动继承 |

> ⚠️ **PRD-1 收官提示(必读)** ·
> 1. ❌ **不重做** prisma init migration(TD-004 · US-003 已跑 baseline 38 表)
> 2. ✅ **仅跑** `prisma/migrations/manual_rls.sql` 启 12 业务表 RLS
> 3. ✅ **实施** LLMGateway.callProvider 真调 anthropic + openai SDK(R-1 唯一入口)
> 4. ✅ **填充** 13 + 2 = 15 router 全 procedure(mock OK · 实际 Specialist 留 PRD-3 起)
> 5. 🔧 **顺带修** TD-008 generateTraceId 命名混淆(HTTP layer vs Specialist layer 重命名)
> 6. 🔧 **顺带修** TD-007 apps/web 3 lint errors(no-misused-promises × 2 + unsafe-any × 1)

---

## §1 用户故事(US-001 ~ US-007)

### US-001 · RLS apply + 多账号隔离 middleware

- **As** · IP 起号者(ARCHITECTURE §1.6 第 1 类)
- **I want** · 切到账号 A · query stepData 只看 A 的数据 · 切到账号 B · 完全看不到 A 的数据
- **So that** · 满足 ARCHITECTURE §3.8 多账号隔离边界 · 防 LD-009 RLS 漏字段
- **risk_level** · foundation(全 PRD downstream)
- **depends_on** · []
- **anti_patterns** · 自动从 reject-examples grep 注入(关键词:RLS / account_id / executeRaw / 隔离)

### US-002 · 客户端 hooks · useStepData / useActiveAccount / useEvolution(LS↔DB 双写)

- **As** · IP 起号者(同上)
- **I want** · 写完 step3 数据 · 立刻看到 LS 缓存 · DB 写入也成功 · 切账号时 LS 自动清掉 A 的 namespace
- **So that** · 满足 ADR-010 LS↔DB 双写 + ARCHITECTURE §3.4 双写策略
- **risk_level** · medium
- **depends_on** · [US-001]
- **anti_patterns** · 关键词:localStorage / aiip_memory_acc / 双写 / 切账号

### US-003 · ipAccounts + stepData 2 核心 router(7 procedure)

- **As** · IP 起号者
- **I want** · GET /trpc/ipAccounts.list 返我所有账号 · POST switchActive 切账号成功 · stepData.save 写入 DB + LS
- **So that** · 满足 ARCHITECTURE §3.2 第 2-3 行 · IP 账号 + stepData 全 procedure 实现
- **risk_level** · medium
- **depends_on** · [US-001, US-002]
- **anti_patterns** · 关键词:CRUD / prisma / per-account / 字段验证

### US-004 · 9 Specialist router 骨架(mock 数据)

- **As** · IP 起号者
- **I want** · 调 copywriting.generate / videoAnalysis.analyze / videoProduction.generate / boomGenerate.generate / monetization.generate / privateDomain.generate / diagnosis.generate / evolution.evolve / deepLearning.learn 全返 mock 数据
- **So that** · 满足 ARCHITECTURE §3.2 第 4-12 行 · 骨架就位 · 实际 Specialist 实施留 PRD-3 起
- **risk_level** · medium(9 router 但都是 mock · 复杂度低)
- **depends_on** · [US-003]
- **anti_patterns** · 关键词:Specialist / mock / placeholder / TODO

### US-005 · knowledge router + trending + invite 辅助(8 procedure)

- **As** · IP 起号者(主)/ admin(invite)
- **I want** · knowledge.getRecommendations / getScriptCases / getFavorites / addFavorite / addNote / trending.fetch / listByIndustry / invite.redeem 全工作(mock OK)
- **So that** · 满足 ARCHITECTURE §3.2 第 13 行 + 2 辅助 router · 完整 15 router 就位
- **risk_level** · medium
- **depends_on** · [US-003]

### US-006 · LLMGateway 真 callProvider(anthropic + openai SDK)+ 限流 + 降级 + cost_log

- **As** · 工程合约(non-user-facing)
- **I want** · 调 llmGateway.complete({ model_tier:'reasoning', ... }) · 真调 anthropic Sonnet · 失败降到 openai gpt-4o · 写 cost_log
- **So that** · 满足 ADR-013 + LD-012(R-1 唯一入口)+ ARCHITECTURE §6.5 5 大职责
- **risk_level** · **high**(security-critical · auth/credential 关键字 + LD-012 + R-1 红线)
- **depends_on** · [US-001]
- **anti_patterns** · 关键词:LLMGateway / anthropic / openai / SDK / 限流 / 降级 / cost_log
- **★ 用户介入** · 启动前用户必须填 .env 的 ANTHROPIC_API_KEY 和 OPENAI_API_KEY

### US-007 · 50+ procedure 单元测试 + 修 TD-007/TD-008

- **As** · 工程合约
- **I want** · 全 15 router · 每 procedure 至少 1 个 unit test(mock + zod 校验)· 总 ≥ 50 单元测试 + 多账号隔离 e2e 1 个 + LS↔DB 双写 e2e 1 个
- **So that** · 满足 ARCHITECTURE §9.3 P1 退出条件 · 同时清 TD-007(lint clean)+ TD-008(generateTraceId 重命名)
- **risk_level** · medium
- **depends_on** · [US-003, US-004, US-005, US-006]
- **anti_patterns** · 关键词:test / vitest / playwright / mock

---

## §2 验收标准(AC · ★ 4 类必含)

### AC-001(US-001 RLS + 隔离 middleware)

#### AC-001-H(happy)
- **Given** · DB 跑了 prisma migrate · 12 业务表已建
- **When** · `psql $DATABASE_URL -f prisma/migrations/manual_rls.sql`
- **Then** ·
  - 12 业务表(ip_accounts / step_data / history / topic / asset / diagnosis_reports / feedback_log / evolution_profile / evolution_insight / deep_learning_archives / knowledge_favorites / knowledge_notes / daily_tasks / cost_log)RLS 启用 · `\dx vector` 显 0.8.0
  - tRPC middleware `accountIsolation.ts` · 每 request 设 `SET LOCAL app.account_id = <ctx.activeAccountId>`
  - 测试 · 用户 A query stepData · 看到 A 的 · 完全看不到 B 的(ROW count 0)
  - 测试 · 用户切到 B · query 看到 B 的 · A 0 行

#### AC-001-E(error)
- **场景 E1** · ctx.activeAccountId 缺失(用户没切账号)
  - Then · middleware 返 ForbiddenError · log 'no_active_account'
- **场景 E2** · 攻击者 prisma.$executeRaw 直查跨 account
  - Then · grep `\$executeRaw` apps/api/src 0 命中(代码层禁)· R-009 红线

#### AC-001-B(boundary)
- **场景 B1** · 全局表(User / InviteCode / TrendingItem)不需 account_id
  - Then · LD-009 例外 · middleware 跳过 SET app.account_id 对全局表 procedure(用 procedure metadata 标 `isGlobal: true`)
- **场景 B2** · 用户切账号后 immediate query
  - Then · ctx.activeAccountId 用最新值(从 lucia session refresh)

#### AC-001-P(performance)
- **场景 P1** · middleware overhead < 2ms · 不显著拉慢 procedure
- **场景 P2** · RLS 索引命中 · query EXPLAIN 显示 Index Scan(非 Seq Scan)

---

### AC-002(US-002 LS↔DB 双写 hooks)

#### AC-002-H
- **Given** · 用户 A 在 step3 输入数据 · activeAccountId='1'
- **When** · `useStepData('step3').save({ ... })`
- **Then** ·
  - LS key `aiip_memory_acc_1_step3` 写入(ARCHITECTURE §3.3)
  - DB stepData 表 row 写入(accountId=1, stepKey='step3')
  - 双写顺序 · LS 先写 · DB 后写 · DB 失败时 LS 不回滚(ADR-010 · 防数据丢)
  - useActiveAccount 返 '1' · 切到 '2' 时返 '2' + LS namespace 切

#### AC-002-E
- **场景 E1** · DB 写失败(网络断)
  - Then · LS 仍有 · 用户能看到 · 但页面提示 "已保存到本地 · 网络恢复后同步" · trace 写 cost_log
- **场景 E2** · 切账号时 LS 没清干净 A 的 namespace
  - Then · grep `aiip_memory_acc_1_` 当切到 '2' 后命中 0 · LS clear 必清干净

#### AC-002-B
- **场景 B1** · 多账号同时打开多 tab
  - Then · 每个 tab 独立 activeAccountId · LS 互不污染
- **场景 B2** · LS 满 5MB 限额
  - Then · 提示用户 · 自动 prune 非 active 账号 namespace(LS 容量管理)

#### AC-002-P
- **场景 P1** · LS read < 1ms · DB write < 50ms · useStepData hook 重新渲染 < 16ms

---

### AC-003(US-003 ipAccounts + stepData router)

#### AC-003-H
- **Given** · authenticated user · activeAccountId 已设
- **When** · `trpc.ipAccounts.list.query()` + `trpc.stepData.save.mutate({ stepKey:'step3', inputs:{...} })`
- **Then** ·
  - ipAccounts.list 返 user.ipAccounts(only own)· 含 6 字段(id/name/industry/platform/stage/isActive)
  - ipAccounts.switchActive(id) 更新 user.activeAccountId · 返新 active
  - stepData.save 写 DB + 触发 useStepData 缓存更新
  - stepData.get(stepKey) 返本 account · 跨 account 0 row(RLS)

#### AC-003-E / B / P · 略(标准 CRUD)
- E · 切到不存在的 account → ForbiddenError
- B · same-account double-active(用户连续点 switchActive) → 幂等
- P · list < 100ms · save < 200ms

---

### AC-004(US-004 9 Specialist router 骨架 mock)

#### AC-004-H
- **Given** · 用户已选 stepType / scriptType 等 input
- **When** · trpc.copywriting.generate.mutate({ scriptType:'opinion', topic:'XXX' }) ... × 9 router
- **Then** ·
  - 9 router 全工作 · 返 mock data(content='[mock] ralph fills real Specialist in PRD-3+')
  - 每 procedure 走 zod 校验(LD-013)· input/output schema 在 packages/schemas
  - 每 mutation 写 history table · trace_id 写入
  - **不调** LLMGateway(P1 不实际跑 LLM · 留 PRD-3+ 实施)

#### AC-004-E / B / P · 略(标准 router 骨架)
- E · zod 校验失败 → 400 + log
- B · 输入超长 → 截断 / reject
- P · mock procedure < 50ms

---

### AC-005(US-005 knowledge + trending + invite 辅助)

#### AC-005-H
- **Given** · authenticated user
- **When** · trpc.knowledge.getRecommendations / trpc.trending.fetch / trpc.invite.redeem
- **Then** ·
  - knowledge 7 procedure 工作(mock 数据 OK · 实际 RAG 留 PRD-9)
  - trending.fetch 返 mock TrendingItem 列表(实际抓取留 PRD-6)
  - invite.redeem 检查 InviteCode + 标 used + 关联 user

#### AC-005-E · invite 重复 redeem → 409
#### AC-005-B · trending 多平台过滤
#### AC-005-P · knowledge < 100ms

---

### AC-006(US-006 LLMGateway 真实施)★ risk=high · 严审

#### AC-006-H
- **Given** · ANTHROPIC_API_KEY / OPENAI_API_KEY 在 .env
- **When** · llmGateway.complete({ model_tier:'reasoning', systemPrompt, userPrompt, metadata:{...} })
- **Then** ·
  - 真调 Anthropic SDK · model='claude-sonnet-4-6' · 返 content + tokens
  - cost_log 表新增 1 行(userId / model / tokens / durationMs / success=true)
  - trace_id 透传到 cost_log
  - response 含 model + tokens + duration_ms + trace_id

#### AC-006-E
- **场景 E1** · Anthropic API 5xx · 重试 1 次
  - Then · 仍失败 → 降到 openai gpt-4o · response.fallback={ from, to, reason }
- **场景 E2** · 两个 provider 都失败
  - Then · 返 fallback 模板 + log 'llm.both_failed' + cost_log 标 success=false
- **场景 E3** · API key 缺
  - Then · throw 'ANTHROPIC_API_KEY missing'(R-006 配置错误)

#### AC-006-B
- **场景 B1** · 用户超 daily quota(Free 50/日)
  - Then · checkRateLimit throw RateLimitError · 不调 LLM · log
- **场景 B2** · 单次输出 > 8K tokens
  - Then · response.truncated=true · 不阻塞

#### AC-006-P
- **场景 P1** · reasoning tier P50 < 12s · P99 < 30s
- **场景 P2** · cost < $0.30 / 次(reasoning · ARCHITECTURE §9.12b)
- **场景 P3** · checkRateLimit 用 Upstash · 单调 < 5ms

#### ★ 安全(R-1 / LD-012)
- **AC-006-S1** · grep `from '@anthropic-ai/sdk'` 仅 llm-gateway/index.ts 命中(R-1 唯一入口)
- **AC-006-S2** · grep `from 'openai'` 同上
- **AC-006-S3** · API key 不日志输出(grep `ANTHROPIC_API_KEY|OPENAI_API_KEY` log statements 0 命中)

---

### AC-007(US-007 50+ procedure unit + 多账号 e2e + 修 TD)

#### AC-007-H
- **Given** · 全 15 router 实施完(US-001 ~ US-006)
- **When** · pnpm test
- **Then** ·
  - vitest 单元 ≥ 50(每 procedure 至少 1 个 mock + zod 校验测试)
  - playwright e2e ≥ 2(多账号隔离 1 + LS↔DB 双写 1)
  - 全测试退出码 0
  - typecheck 全 6 workspace 0 error
  - **lint clean** · TD-007 关闭(no-misused-promises × 2 + unsafe-any × 1 修)

#### AC-007-E · zod schema mismatch · 单测命中失败抛 error 详情
#### AC-007-B · 测试 mock LLM call(不真调 anthropic · 用 vi.mock)
#### AC-007-P · 全 vitest run < 30s · playwright run < 5min

#### ★ TD 修(本 story 顺带)
- **TD-008 重命名 generateTraceId** ·
  - apps/api/src/trpc/trpc.ts L17 · `generateTraceId` → `generateHttpTraceId`(无参 · 16-char hex)
  - apps/api/src/agents/base/types.ts L90 · `generateTraceId` → `generateSpecialistTraceId`(带参)
  - 更新所有 import 调用点
  - typecheck + tests 仍过

---

## §3 范围排除(明确不做)

| # | 不做的事 | 理由 | 排到哪 |
|:-:|---|---|:-:|
| 1 | 实际 Specialist 实施(CopywritingAgent execute / etc) | LD-001 95% Workflow 留 PRD-3 + PRD-4 + PRD-5 | PRD-3/4/5 |
| 2 | 真 RAG 检索(knowledge 向量库查询) | 留 PRD-9 知识库 | PRD-9 |
| 3 | 真 trending 抓取(TrendingScraper Worker) | 留 PRD-6(P5 视频)· 用户填 trending 第三方授权 | PRD-6 |
| 4 | UI 改动(P1 仅 router · 不动前端) | 留 PRD-3 P2 路由 + 首页 | PRD-3 |
| 5 | admin 任何代码(13 admin router) | ADR-021 admin 独立部署 · 留 P9.0 | PRD-10 |
| 6 | OAuth 真 Google 实施(用户填 .env 才生效) | PRD-1 mock provider 已就位 · 真 Google 用户拍板 | PRR / 用户 |
| 7 | TD-005 shadcn 路径 lift | 等 P9.0 admin 启动前 | PRD-10 |
| 8 | tRPC stream procedure(Specialist stream output) | 留 PRD-4(P3 主流程)| PRD-4 |
| 9 | Approval Gates / MFA / WAF | ADR-020 admin 安全 · 留 P9.3 | PRD-13 |

---

## §4 风险 + 缓解

| # | 风险 | 严重度 | 缓解 | 触发回滚条件 |
|:-:|---|:-:|---|---|
| 1 | RLS apply 漏字段 · 跨 account 数据泄露(LD-009 红线)| 🔴 高 | US-001 AC-001-H 多账号隔离测试 + e2e + grep $executeRaw 0 | 测试发现跨 account row · 立即 reject |
| 2 | LS↔DB 双写 race(LS 写完 · DB 失败 · 后续操作认 LS 已存)| 🟠 中 | ADR-010 LS 先写 · DB 失败提示用户 · log cost_log · 不阻塞 UI | 用户报"数据丢失"≥ 3 次 · 设 prefer-DB 模式 |
| 3 | LLMGateway 限流 / 降级 错(US-006 risk=high)| 🔴 高 | AC-006 5 类 AC + S1/S2/S3 安全 + reject 不允许 rubber-stamp | API key 泄露 / 降级未触发 |
| 4 | 50+ procedure 单元测试爆 size(US-007 写不完)| 🟠 中 | AC-007 ≥ 50 而非 100% · mock + zod 校验 · 不必每 procedure 端到端 | 测试覆盖率 < 50%(实测 procedure / total)|
| 5 | TD-008 重命名漏调用点 | 🟢 低 | typecheck 全 6 workspace 0 error 兜底 | typecheck error |
| 6 | ★ foundation 风险升档 · 任何 reject 自动 high | 高 | OPUS-AUDIT-CHEATSHEET 不允许 rubber-stamp · §0 4 项实测 + §Z 全量 grep | rubber-stamp ≥ 1 次 |

---

## §5 测试配额

| 类别 | 数量 | 范围 | 工具 |
|---|:-:|---|---|
| 单元 | 50+(每 procedure 1 个 + 边界 + zod)| 15 router · 50+ procedure | vitest |
| 集成 | 5(RLS isolation · LS↔DB 双写 · LLMGateway 真实 · cost_log · trace_id 透传)| 跨 procedure + DB | vitest + supertest |
| E2E | 2(多账号隔离 · LS↔DB 双写)| 主链路 | playwright |
| LLM Judge | 0 | 不实施 Specialist · 留 PRD-4 | — |
| **总** | **≥ 57 用例** | — | — |

---

## §6 退出条件(从 ARCHITECTURE §9.3 完整粘贴 + AC 总和)

> 派生 [ARCHITECTURE.md §9.3](../ARCHITECTURE.md):

```
P1 · 数据底座(2 周)
  目标 · 13 tRPC router 全部就位(空实现也行) · DB schema 全量 · LS↔DB 双写 hook
  交付物 · prisma/schema.prisma 12 实体(§3.1) · 13 router 骨架(返 mock) ·
          useStepData / useActiveAccount / useEvolution 客户端 hook · pgvector 启用
  ★ Agent 架构相关 · DB 表全部加 trace_id · evolution_profile / evolution_insight /
                    feedback_log schema 完整(为 §5 飞轮预留)
  风险 · Schema 写完后期改动成本高 · 多账号隔离漏字段
  退出条件 · 跑通 50+ procedure 单元测试(全部 mock 输出) ·
            多账号隔离测试通过 · LS↔DB 双写 e2e 通过
```

**总和验收清单**:
- [ ] §9.3 退出条件 3 项达成(50+ procedure unit / 多账号隔离 / LS↔DB e2e)
- [ ] PRD §1 7 US 全 AC-XXX-H pass
- [ ] PRD §1 7 US 全 AC-XXX-E pass
- [ ] PRD §1 7 US 全 AC-XXX-B pass
- [ ] PRD §1 7 US 全 AC-XXX-P 满足阈值
- [ ] §5 测试配额 ≥ 57 用例达成
- [ ] AGENTS § 红线 0 触发(LD-009 RLS · LD-012 R-1 唯一入口 + LD-013 strict + AGENTS §6.9 console.log)
- [ ] §4 6 风险无未缓解
- [ ] TD-007 closed · TD-008 closed
- [ ] LLMGateway 真实施 + 真 anthropic + openai SDK 唯一入口

---

## §7 跟 Coding 3.0 的协同协议

| 步骤 | 输入 / 输出 |
|---|---|
| `prd skill` 转 prd.json | 输入本文件 → 输出 scripts/ralph/prd-2.json(US-NN → story-NN 1:1)· anti_patterns 自动注入 36 反例 + 8 Codebase Patterns(progress.txt) |
| `/plan-check` | 检查 §1 7 US · §2 4 类 AC 齐(每 US H/E/B/P)· §4 风险有缓解 · §5 配额合理 · risk_level 升档(US-001/006 升 high) |
| `python ralph.py --model sonnet --daemon` | 读 scripts/ralph/prd.json · 按 risk_level + depends_on 拓扑跑 7 story |
| Opus audit(每 story 后) | §0 4 项实测(typecheck + lint + 关键 grep + RLS 验证)· §Z 风险分档 · US-001 + US-006 = high 深审 |
| `/goal-verify` | 双向对账 · 实际代码 vs §2 AC + ARCHITECTURE §3.2 50+ procedure + §9.3 退出条件 |
| `/prd-retro` | 反哺反例库 · 提炼 P1 反例(预期:RLS 漏字段 / LS↔DB race / LLMGateway 限流 / 等) |

---

## §8 修订记录

- v0.1 · 2026-05-08 03:45 · prd skill (Opus 主对话) · 初稿(PRD-1 收官后)
- 派生自 PRD-1 8 节 Codebase Patterns(progress.txt)+ 5 Lessons(.planning/retros/PRD-1-RETRO.md)
- 顺带修 TD-007(lint clean)+ TD-008(generateTraceId 重命名)

---

> **本 PRD 是 PRD-1 数据底座延续** · 锁 50+ procedure 全骨架 + RLS apply + LS↔DB 双写 + LLMGateway 真实施 · 给 PRD-3 起 Specialist 实施提供完整 backplane。
> **下一步** · ralph skill 转 prd-2.json · /plan-check 7 项 · cp prd-2.json prd.json · python ralph.py --daemon · /monitor-ralph
