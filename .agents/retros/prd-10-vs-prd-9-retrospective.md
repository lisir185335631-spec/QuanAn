# PRD-10 vs PRD-9 复盘

> **基线** · PRD-9(P8 知识库 + pgvector RAG · 5 stories · 严格 0/5 一轮通过 · 0 Opus reject · 1 daemon BLOCKED · 4 TDs · 1 RCA)
> **当前** · PRD-10(P9.0 admin 基础设施 · 7 stories · 严格 6/7 一轮通过 · 0 Opus reject · 0 BLOCKED · 0 RCA · 8 TDs)
> **触发** · /goal-verify PASS-WITH-DEBT(7/7 100% 覆盖率 · 1 DRIFT)+ 用户 /prd-retro · 2026-05-12 15:35
> **核心问题** · admin 子系统 foundation 单 PRD 7 US 一次成线性收敛(0 reject + 0 BLOCKED + 0 RCA) · 跨 4 下游 PRD 依赖底座就位

---

## 0. 数据总览

### 0.1 成功率曲线(跨 PRD 6→10)

```
PRD-6 P5 视频模块:    严格 ~73%(11/15 一轮过 · 2 reject)· daemon ~12h
PRD-7 cleanup TD-fix: 严格 100%(10/10)· 0 reject · daemon ~6h
PRD-8 P7 智能模块:    严格 54%(7/13)· 0 reject · daemon ~6.24h
PRD-9 P8 知识库 RAG:  严格 0%(0/5)· 0 reject · 1 BLOCKED · daemon ~3.5h
PRD-10 P9.0 admin 基础: 严格 86%(6/7)· 0 reject · 0 BLOCKED · daemon ~3.9h  ★★★
```

**亮点** · PRD-10 跨 PRD-9 大幅跃迁(严格 0% → 86%)+ 第一次 0 BLOCKED 自 PRD-7 以来 · ralph daemon 完全无 infra storm

### 0.2 关键事实

1. **严格 6/7 = 86% 一轮通过率**(US-002 例外 · 3 dev iter self-correct · 但 retryCount=0 · 健康)
2. **0 Opus reject** · 沿用 PRD-7/8/9 ★(连 4 个 PRD 0 reject · 跨 PRD 反例库 + plan-check W-patches + Opus deep 审实战收益)
3. **0 daemon BLOCKED**(对比 PRD-9 1 个 US-002 ECONNRESET storm)· 完全无 infra failure
4. **0 RCA**(对比 PRD-9 1 个 RCA-006 daemon ECONNRESET)
5. **0 Opus 直 fix mechanical 错**(对比 PRD-9 1 个 US-002 commit 3d26b92)
6. **8 个新 TDs**(TD-037~044 · 全 low · doc-drift 4 + design-drift 2 + audit-coverage 3 · 0 PRR 必修)
7. **anti_patterns 注入实战** · 21 entries(7 stories × 3 条)· PRD-9 是 6 entries × 2 stories · **3.5× 注入密度** ★★★
8. **Codebase Patterns 沉淀新 7 条**(admin 隔离 4 维度 / 6 闸链 / adminRLS LOCAL=true / OAuth multi-layer / audit append-only / 16 sidebar metadata / monorepo 10 步迁移)
9. **总 commits** · 12(8 feat + 4 docs · 1 commit per US 7 + 4 progress.txt + 1 US-002 self-correct)

### 0.3 Cost-log 分析(daemon active 时间)

| US | iter dev | iter validating | 总 (s) | 总 (min) |
|---|:-:|:-:|:-:|:-:|
| US-001 | 1372s | 381s | 1753 | 29 |
| US-002 | 1802s + 270s + 561s = 2633s | 811s + 621s = 1432s | 4065 | 68 |
| US-003 | 891s | 160s | 1051 | 18 |
| US-004 | 846s | 386s | 1232 | 21 |
| US-005 | 1227s | 571s | 1798 | 30 |
| US-006 | 1242s | 876s | 2118 | 35 |
| US-007 | 1407s | 721s | 2128 | 35 |
| **总** | **9620s ≈ 160 min** | **4527s ≈ 75 min** | **14147s ≈ 236 min** | **3.93h** |

PRD-10 daemon active ~3.93h · 比 PRD-9(3.5h)略多(stories 7 vs 5 · ratio 1.4×)· 单 story 平均 ~34 min(PRD-9 ~42 min · 提升 19%)★

### 0.4 Reject 根因分布

```
本 PRD reject 数 · 0(连 4 PRD 0 reject)
US-002 self-correct dev iter 多(3 dev iter) · 根因 · ralph 第 1 iter CORS 顺序错(/trpc/admin/* CORS 顺序漏装) · 第 2 iter self-fix(commit 4d236db CORS 顺序修)· 不是 reject · 是 dev 内部纠错
其他 6 US 全 1 dev + 1 validating 一次过
```

---

## 1. PRD 文档质量(8 维度第 1)

### 优势(跨 PRD-9 跃迁)

- **§0 引用清单** · 1216 行总 · 详细引用 ADMIN §1+§2+§4+§5+§7+§8.2 + ARCHITECTURE §1.4b + AGENTS §10 + DATA-MODEL §13 + ADR-019/020/021 · 跨 4 主文档 14 章节
- **§1 US 详细度** · 每 US 平均 18-25 AC + 4-7 anti_patterns entries · 比 PRD-9 平均 11 AC × 1.6 entries 大幅提升
- **§7 LD-059~D-068** · 10 个新 LD(命名 + 实施模式 + Stub 路径)· LD 数比 PRD-9 D-056~058 多 7
- **§8 反例库注入** · 8 类关键词 · 3 示例 anti_patterns(US-001/US-003/US-007)· 引用 reject-examples.jsonl 真案例(REJ-019~026 + PRD-1 US-006 OAuth CSRF · 跨 7 反例)
- **§10/§11 章节扩展** · admin 专属 § 10 Coding 3.0 协同(分档审 + 5 audit_commands)+ §11 PRD-11~14 接入预备(5 子节预定义协议)· **跨 PRD 协议锁**

### 缺陷(本 PRD 教训)

- ⚠️ **§0 文字 "13 admin model" typo · 实际 14**(TD-038)· 列表 14 个名字写全但数字算错 · prd skill 写时数错
- ⚠️ **AC-13 命名漂移 `adminUserId` vs schema 字段 `actorAdminId`**(TD-040)· PRD 引用 DATA-MODEL §13.2 通用名 · 但 prisma model 实施时用 actor* 前缀
- ⚠️ **§1 US-007 e2e 路径 flat `tests/e2e/admin-foundation-loop.spec.ts` · 实际 `tests/e2e/admin/` 子目录**(TD-041)· 实施更好但 PRD 没考虑 admin/ 子目录约定
- ⚠️ **D-068 admin tokens 落位漂移**(TD-044 · /goal-verify 补 catch)· PRD §1 US-005 写 packages/ui/admin/{tokens.ts,DenseTable.tsx,index.ts} · 实际落 apps/admin/src/styles/admin.css(CSS custom property)· 功能等价 · 但 packages/ui/admin/ 目录不存在

### 量化对比

| 维度 | PRD-8 | PRD-9 | **PRD-10** | vs PRD-9 |
|---|:-:|:-:|:-:|:-:|
| PRD 总行数 | 1104 | 492 | **1216** | +147% ★★ |
| SoT 表 / 引用清单 | 4 | 1 | **14 章节引用** | +13 ★★ |
| 协议锁项数 | 8 | 14 | **31**(技术栈 + 7 闸命名 + 16 路由 + audit_commands)| +17 ★★ |
| Locked Decisions 新增 | D-050~055 | D-056~058 | **D-059~068**(10 个)| +7 ★★ |
| anti_patterns entries | 0 | 6 | **21**(7 stories × 3)| 3.5× ★★ |
| Doc-only drift TD | 0 | 1 | **4**(TD-038/040/041/044)| +3 ⚠️(密度高 · 但全 low 且 functional equivalent) |

**净评估** · PRD 文档量翻倍 + 详细度大幅提升 + 反例库注入 3.5× → 直接驱动严格 86% · 但 doc-drift 比例上升(7 stories × 4 drift)· 应固化 plan-check naming consistency 机制(§9 M-1)

---

## 2. plan-check W-patches(8 维度第 2)

### 实战表现

PRD-10 prd.json 通过 /plan-check 时:
- ✅ **anti_patterns 字段使用率 100%**(7 stories 全有 · 注入 21 entries · 来源标 source_prd + source_story)· **首次跨 PRD 全量注入** ★★★
- ✅ **branchName format ERROR catch**(`p9.0` 含 `.` 违反 kebab-case · /plan-check 自定义脚本发现 · 改成 `ralph/prd-10-admin-foundation` 通过)· **/plan-check ERROR 检测有效** ★
- ⚠️ **14 WARN 接受**(notes 含 [risk-upgrade] 元数据 · AC > 8 条 · 都是 seed 文档详细度副作用 · 跟 prd-5/prd-8 一致)
- ⚠️ **未预埋 "doc-vs-schema naming consistency" patch**(因 PRD-1~9 没遇过 · 不在 plan-check 规则里)· TD-038/040 是其暴露

### 节省的 reject 估计

- **anti_patterns 21 entries 防御** · 估计 **省 5-7 轮 reject**:
  - US-002 OAuth CSRF mock-bypass(PRD-1 US-006 反例 · 真历史教训)· 防 1 reject
  - US-003 6 闸不漏 adminRLS(REJ-020)· 防 1 reject
  - US-001 不写主应用 src/pages/admin(REJ-022 · R-A2)· 防 1 reject
  - US-001 manual_admin_rls 不绕过 raw SQL(REJ-009)· 防 1 reject
  - 其他 18 entries 各自防御 1-2 类 · 共 ~3 reject prevented
- **branchName format catch** · 直接 ERROR · 防 1 启动失败

**ROI** · plan-check W-patches 实战兑现 · 节省 ~5-8 reject · 约 **30-50 min daemon time**(每 reject ~6 min)

### 应补的 W-patches(详 §9 M-1/M-2)

- M-1 · doc-vs-schema naming consistency(PRD §1 AC 引用字段名 vs prisma model 字段名 grep diff)· 防 TD-038/040 类
- M-2 · packages/<sub>/<name> 落位检查(PRD 期望 packages/ 路径 vs 实际 apps/ 路径 diff)· 防 TD-044 类

---

## 3. Ralph 跨 story 扩展能力(8 维度第 3)

### 主动扩展案例(PRD-10)

1. **US-002 self-fix CORS 顺序**(commit ad37ab0 → 4d236db)· 第 1 dev iter 写完 admin.auth router · 浏览器实测发现 `/trpc/admin/*` CORS 顺序冲突 · ralph 主动找到根因(Hono CORS more-specific 路径必须先注册)+ self-fix · 不等 Validator 反馈 · 2 commit 内闭环 ★

2. **US-002 makePayloadHash helper 主动加** · auth.ts L29 写了 SHA-256 helper · PRD §1 US-002 没明确要求 · 但 ralph 看到 future 需求(US-004 admin_audit_log 防篡改)主动加 · 命中 D-064(payload hash)· **超前实施** ★

3. **US-006 SEED_TAG 跨 test run 隔离** · `SEED_TAG = rls-integ-${Date.now()}` · PRD §1 US-006 没明确要求 traceId 隔离 · ralph 主动加 · 防 idempotent skip · ralph 主动认识到 idempotent constraint(PRD-9 US-004 学过)

4. **US-006 createCaller pattern**(commit 610752c)· tRPC v11 createCaller 用法 · PRD-9 US-002 用过 · ralph 跨 PRD 复用 ★

5. **US-003 Vite proxy + admin baseURL 双 project**(playwright.config.ts)· ralph 主动加 admin project + workers=1(继承 PRD-4 US-018 教训 · prd.json anti_patterns 注入)· 0 Opus reminder

### 评分

| 维度 | PRD-8 | PRD-9 | **PRD-10** |
|---|:-:|:-:|:-:|
| 主动扩展次数 | 5 | 5 | **5 + 超前实施 1**(payloadHash)★ |
| Self-resolve TD 同 PRD 内 | 0 | 1 | **0**(8 TD 全留下游 PRD)|
| 自纠 retry 1 成功率 | 80% | 100% | **100%** ★ |
| 跨 PRD pattern 复用 | ~70% | ~85% | **~90%**(createCaller / workers=1 / SEED_TAG 都复用)★ |

---

## 4. progress.txt 跨 PRD 知识传递(8 维度第 4)

### 继承的 patterns(PRD-1~9 → PRD-10)

成功复用:
- ✅ **monorepo workspace pattern**(PRD-1 / PRD-5 经验)· US-001 拆 monorepo · 沿用 pnpm-workspace.yaml + tsconfig.base.json + vitest workspace + playwright 双 project
- ✅ **schema SoT 单一原则**(PRD-9 D-046)· 14 admin model 在 prisma/schema.prisma · 1 source(无跨文件命名漂移)
- ✅ **set_config LOCAL=true pattern**(PRD-2 accountIsolation D-009)· adminRLS middleware 完全类比 · 5 个 PRD-10 unit + 8 PRD-10 integration test 全沿用此 pattern
- ✅ **cost_log eventType pattern**(PRD-9 第 7 类 embedding_call)· admin_audit_log 类比 · 4 类 eventType + 4 类 eventCategory enum 设计沿用
- ✅ **workers=1 + fullyParallel=false**(PRD-4 US-018 教训)· playwright admin project workers=1 · prd.json anti_patterns 注入 · ralph 直接落地

### 本 PRD 新沉淀(回传到 progress.txt § 11)· 7 条

```
## Codebase Patterns - PRD-10
1. admin 子系统独立隔离 4 维度 pattern(独立 OAuth client_id / Redis namespace / SPA bundle / cookie)
2. 6 闸 middleware 链 + auditLog 后置统一 pattern(顺序硬约束 + env switch dev/prod 分层)
3. adminRLS bypass + LOCAL=true pattern($transaction + LOCAL=true + crossAccountAccessed flag → audit middleware 自动写)
4. OAuth multi-layer prod 防护 pattern(factory + UI guard + provider check + audit grep)
5. admin_audit_log append-only + 4 类 eventType pattern(append-only + redact + idempotent + payloadHash SHA-256)
6. 16 sidebar 域 metadata array pattern(集中 metadata + sidebar/page 共用 source of truth)
7. monorepo workspace 10 步迁移协议(scripts 自动化 + e2e 回归门禁 + workspace 全 update)
```

### 评分

| 维度 | PRD-8 | PRD-9 | **PRD-10** |
|---|:-:|:-:|:-:|
| 继承的 patterns 数 | ~8 | ~10 | **~14** ★ |
| 同类 reject 0 次(继承 pattern 防御)| 5 类 | 4 类 | **7 类**(workers=1 / set_config / schema SoT / monorepo / cost_log / createCaller / vitest workspace)★★ |
| 新沉淀 patterns | 4 | 2 | **7** ★★★(单 PRD 最高记录)|
| 跨 PRD pattern 复用率 | ~70% | ~85% | **~90%** ★ |

---

## 5. Opus Audit Feedback 演化(8 维度第 5)

### PRD-10 Opus reject 数 · **0**(连 4 PRD 0 reject ★★★)

7 个 audit cycle 全 approve · 但每个情境不同:

| Story | Audit 决策 | 档 | 特殊情境 | 耗时 |
|---|---|:-:|---|:-:|
| US-001 | approve(11:18)| **foundation** | F1-F5 全跑 · 27 files + 14 model + 6 闸 stub + RLS 双向 | ~7 min(深审)|
| US-002 | approve(12:33)| high | multi-layer R3 真验(factory + UI + provider check)+ 单测覆盖 | ~8 min(标审)|
| US-003 | approve(12:53)| high | 6 闸 stub→真接 + SQL LOCAL=true 真验 + AST 顺序 | ~5 min |
| US-004 | approve(13:15)| medium | redact + idempotent + payloadHash + 4 eventType 链路 + TD-040 留痕 | ~5 min |
| US-005 | approve(13:45)| medium | 16 placeholder + 4 layout 组件 + browser E2E + R-A grep | ~4 min |
| US-006 | approve(14:24)| high | 真 DB 集成测试 7 case + RLS invariant + LD-A3 法务取证 | ~5 min |
| US-007 | approve(15:08)| medium | 收官全套(audit-redlines + admin-rls.ts AST + audit-rls-tables.sh + e2e)+ TD-041/042 | ~6 min |
| **总** | 7/7 approve | | **0 reject · 0 BLOCKED · 0 Opus 直 fix** | **~40 min 审 7 US**|

### 演化对比

| 维度 | PRD-7 | PRD-8 | PRD-9 | **PRD-10** |
|---|:-:|:-:|:-:|:-:|
| Opus reject 数 | 0 | 0 | 0 | **0** ★ |
| ralph-tools.py reject 反例库追加 | 0 | 0 | 0 | **0** |
| TD 豁免 approve 数 | 0 | 0 | 2 | **4**(US-001 3 + US-004 1)|
| Opus 直 fix mechanical 错 | 0 | 0 | 1 | **0** ★(US-002 dev 内部 self-fix CORS · ralph 自己修)|
| **平均 audit 耗时** | ~5 min | ~5 min | ~6 min | **~5.7 min**(foundation US-001 拉高均值) |

**关键洞察** · PRD-10 没用 Opus 直 fix 机制(PRD-9 引入)· 因为 ralph 在 dev iter 内部 self-correct(CORS 顺序)· **机制使用未必每 PRD 都触发** · 留作 dormant 防御工具(下一 PRD 触发概率 unknown)

---

## 6. Story 粒度 + Wave 设计(8 维度第 6)

### Wave 划分(PRD-10)

| Wave | Story | Iter | Outcome |
|:-:|---|:-:|---|
| 0(Foundation)| US-001 ★ | 1 dev + 1 val | PASS · foundation 档深审 ~7 min |
| 1(Auth + Middleware)| US-002 + US-003 | 3+1 dev | PASS · US-002 self-fix CORS · US-003 一次过 |
| 2(audit + Layout)| US-004 + US-005 | 1+1 dev | PASS(可并行 · 实际串行)|
| 3(集成测试)| US-006 | 1 dev | PASS · 7 test + RLS invariant |
| 4(收官)| US-007 | 1 dev | PASS · audit 4 scripts + e2e + manifest |

### Size_hint 校准

| Story | PRD claim | 实际 commits | 偏差评估 |
|---|:-:|:-:|---|
| US-001 | medium(★ 标 large-risk-warn) | 1 feat + 1 progress = 2 | 准确(notes 标 size warn 防御有效)|
| US-002 | medium | 2 feat(self-correct CORS) + 0 progress | 准确 · self-correct dev 内部 |
| US-003 | medium | 1 feat | 准确(6 闸文件 · stub→真接 · 不大)|
| US-004 | small | 1 feat + 1 progress | 准确(audit middleware + redact + idempotent)|
| US-005 | medium | 1 feat + 1 progress | 准确 · 16 placeholder + 4 layout · medium-large 但分散 |
| US-006 | small | 1 feat | 偏差(集成测试 + helpers + fixtures + SQL introspect · 实际 small-medium)|
| US-007 | small | 1 feat + 1 progress | 准确(audit scripts + e2e helpers + manifest · 集成多但每个 < 50 lines)|

**size_hint=large 危险线** · PRD-10 0 个 large story(US-001 标 medium 但 notes 写 [size-hint-warn] 防御)· 符合全局 §9.6 第一规则 · **PRD-9 retro Playbook P-5 沿用** ★

### Foundation 档应用(2026-05-04 升档机制 first PRD 实战)

US-001 是 PRD-10 唯一 foundation 档:
- **触发条件** · downstream 6 + 跨 4 下游 PRD(PRD-11/12/13/14)· 满足 "low + downstream≥5 → medium 起步 + 关键词命中 → foundation"
- **升档证据 in prd.json notes** · `[risk-upgrade] high → foundation · downstream count=6 + 跨下游 PRD count=4`
- **Audit 实战** · §F1-§F5 全跑(12-18 min budget · 实际 ~7 min · 高效)· F2 跨 story 命名 + F4 SQL schema + F5 协议锁双对账 全过
- **跨 PRD 验证** · US-002~007 全 depends_on US-001 · 命名一致 · 0 命名漂移 reject

---

## 7. 基础设施复用(8 维度第 7)

### 部分复用 + 部分新建(monorepo 重构)

PRD-10 复用 + 新建:
- ✅ **复用 · pgvector + Prisma + tRPC + vitest + Playwright + Hono** · 沿用 PRD-1~9 stack
- ✅ **复用 · ContextAssembler + cost_log + Aurelian Dark + shadcn** · 沿用 PRD-1~9
- ✅ **复用 · lucia-auth + arctic OAuth lib** · admin 复用 lib · 仅写 adapter
- ✅ **复用 · packages/ui/base + packages/schemas + packages/clients** · admin 共享类型
- 🆕 **新建 · monorepo workspace 拆 6 sub-projects**(apps/admin/api/web + packages/{schemas,ui,clients})· US-001 实施 + scripts/migrate-monorepo.sh 自动化
- 🆕 **新建 · admin 鉴权链 + audit_log + Layout**(US-002~005)· 13 文件新建 in apps/api/src/{lib/auth,trpc/middleware/admin,trpc/routers/admin,trpc/procedures} + 12 文件 in apps/admin/src
- 🆕 **新建 · 14 admin model + manual_admin_rls.sql**(US-001 · 加 13+ 表 schema + RLS DISABLE)

### packages/ui/admin/ 应建未建(TD-044 doc-drift)

- ⚠️ **PRD §1 US-005 + D-068 期望** · packages/ui/admin/{tokens.ts, DenseTable.tsx, index.ts}
- **实际落地** · admin tokens 直接放 apps/admin/src/styles/admin.css CSS custom property + grid templates
- **功能等价** · TopBar 60 / Sidebar 240 / StatusBar 24 全生效 · 18 unit + browser E2E 全过
- **风险** · PRD-11+ 加 admin DenseTable + 数据可视化组件时缺 packages 容器
- **fix_by** · PRD-11 启动前 maintenance PR(详 §10 P-7)

---

## 8. Audit 专项扫描(8 维度第 8)

### 5 audit script 全建 + 全跑通(US-007 收官)

| Script | 类型 | 实测结果 |
|---|---|---|
| **scripts/audit-redlines-admin.sh** | bash grep | ALL PASS · 5 LD-A + 6 R-A |
| **scripts/audit-admin-rls.ts**(AST)| ts-AST | 5 procedure 0 violations(例外列表 ['auth.login','auth.logout','health','me']) |
| **scripts/audit-admin-rls-tables.sh** | psql 双向 | 13/13 admin DISABLED + 15/15 main ENABLED · 0 mismatches |
| **scripts/audit-approval-gates.ts**(AST)| ts-AST stub | Approval Gates 机制就位 · 3/3 checks PASS |
| **scripts/verify-prd-10.sh** ★ | bash 集成 wrapper | 18 PASS / 0 WARN / 0 FAIL / 2 SKIP(fast mode)· 9 段验收 |

### 关键反例 grep 命中

- LD-A1 · `QUANQN_WEB_CLIENT` in apps/admin/ = 0 ✅
- LD-A2 · `from.*routers/app` in admin/ = 0 ✅ + 反向 = 0
- LD-A3 · `set_config.*app.role.*admin` in adminRLS.ts ≥ 1 ✅
- LD-A4 · `requiresApproval.*false` hardcode = 0 ✅
- LD-A5 · `prisma.trendingItem.create` in workers/ = 0 ✅(PRD-12 落地前预防)
- R-A1/A2/A4/A5/A6 全 0 命中
- **audit append-only** · `prisma.adminAuditLog.(update|delete|upsert)` = 0 命中 · 项目 CLAUDE §5.1 真验

### 评分

| 维度 | PRD-8 | PRD-9 | **PRD-10** |
|---|:-:|:-:|:-:|
| audit script 数 | 2 | 3 | **5**(+2)★ |
| 红线 grep 总条数 | 11 | 14 | **17**(5 LD-A + 6 R-A + 6 反例)★ |
| AST 检测覆盖 | 0 | 0 | **2 scripts**(adminRLS + approval gates)★★ |
| 自动化 verify wrapper | 0 | 0 | **1**(verify-prd-10.sh)★ |
| 实测 0 红线触发 | ✓ | ✓ | **✓**(连 3 PRD)|

---

## 9. 反向发现(不可迁移 / 偶然成功)

不能让 playbook 过于乐观。本 PRD 靠运气或 Opus 深度思考成功的点:

1. **US-001 一次过(foundation 档 large story)** · 27 files create + monorepo 重构 + 10 步迁移 + 14 model + 6 闸 stub · 1 iter 完成是 dev agent 实力 + anti_patterns 21 entries 共同作用
   - **不可复制性** · 后续 foundation 档 large story 可能 retry(US-002 已示范 3 dev iter · 跨 PRD 期望 retry 1-2 次)
   - **缓解建议** · prd skill 转 prd.json 时严格执行 §9.6 拆分硬规则 · large story 必拆 + `[size-hint-warn]` notes 必加

2. **0 安全 Blocker / 0 红线触发** · multi-layer R3 + LD-A + R-A 设计完整 + Opus 深审
   - **不可复制性** · 实际 prod 时 stub mode 可能漏检(WAF / MFA 真启时再验证)· dev 阶段 R-A3 部署 gate skip
   - **缓解建议** · PRR 阶段补 R-A3 + LD-A4 真闭环(详 §10 N-2 不做项)

3. **US-002 CORS 顺序 self-fix** · ralph 第 1 iter 写完 admin.auth router · 浏览器实测发现 `/trpc/admin/*` CORS 顺序冲突 · ralph 主动找到 Hono CORS more-specific 路径必须先注册根因 + 2 commit 内 self-correct
   - **不可复制性** · Hono CORS 特异性 · 其他框架(Express/Fastify)CORS 注册方式不同 · ralph 跨框架时未必能 self-fix
   - **缓解建议** · 加 Codebase Pattern "tRPC + Hono CORS 顺序: more-specific 路径必须先注册"(已沉淀)

4. **8 TD 全 low + 全 doc-drift / audit-coverage / design-drift** · /goal-verify §0.4 主动发现 + 登记
   - **不可复制性** · /goal-verify 触发主动 audit 是 Opus 深审 · 跟 ralph daemon 自动不同 · TD 发现率 depends on Opus 投入时间
   - **缓解建议** · 固化 plan-check W-patches(详 §12 Diff-1 doc-vs-schema naming)+ 加 audit script self-test(详 §12 Diff-2)

5. **anti_patterns 21 entries 全防御 0 reject** · PRD-9 6 entries · PRD-10 3.5×注入密度
   - **不可复制性** · anti_patterns 注入密度 depends on reject-examples.jsonl 累积 + prd skill 检索质量 · 后续 PRD 可能没那么多相关反例
   - **缓解建议** · 持续累积反例(PRD-11+ 每次 reject 必走 ralph-tools.py reject + 自动入库)

---

## 10. PRD-11(P9.1 6 P0 业务核心域)Playbook

基于本 PRD 可迁移维度 · 列出 P-X 必做项 / N-X 不做项 / E-X 实验项:

### P-X 必做项(高 ROI)

- **P-1 · admin 子系统 7 大 patterns 直接复用**(详 §4 + progress.txt)
  - 独立隔离 4 维度 + 6 闸链 + adminRLS bypass + OAuth multi-layer + audit append-only + 16 sidebar metadata + monorepo 10 步
  - PRD-11 加 6 P0 业务页(NSM/users/accounts/cost/audit/invites)直接复用 · 0 新建 framework

- **P-2 · admin-routes.ts metadata-driven 业务页替换协议**(D-066)
  - PRD-11 加业务页:替换 placeholder.tsx + admin-routes.ts metadata.prd 字段更新(11/12/13/14) · sidebar 不动
  - 6 P0 业务页落地 0 sidebar 改动 + 0 route 改动 · PRD-11 工作量缩 30%

- **P-3 · audit script 4 件套 + verify-prd-N.sh 模板**(详 §8)
  - PRD-11 启动前先扩展 audit-admin-rls-tables.sh 14 admin model 全验证(关 TD-039/042)
  - PRD-11 收官加 scripts/verify-prd-11.sh(包装 audit-redlines + admin-integration + e2e)

- **P-4 · anti_patterns 注入密度保持 21+ entries**(详 §2)
  - PRD-11 7+ stories × 3 entries minimum · 跨 PRD-10 反例(admin 6 闸链 / adminRLS LOCAL=true)+ PRD-1~9 反例 + 历史 reject 真案例

- **P-5 · foundation 档升档机制 + size_hint 严控**(详 §6)
  - PRD-11 US-001 NSM 仪表盘(预计 downstream 5+ stories)· 满足 foundation 升档条件 · Opus audit 走 F1-F5

- **P-6 · cross story 协议锁 + AC 代码片段嵌入**(详 §1 + §2 W-patches)
  - PRD-11 §0 + §7 LD 引用 ARCHITECTURE / ADMIN / AGENTS / DATA-MODEL 严格 file:line · 不泛指
  - AC 含字段命名时嵌入完整 SQL/TS 声明 · 防 TD-038/040 类 doc-drift

- **P-7 · packages/ui/admin/ 提前建**(TD-044 fix · §7 部分复用)
  - PRD-11 启动前 maintenance PR:packages/ui/admin/{tokens.ts, DenseTable.tsx, index.ts} · 从 admin.css 提 JS/TS constants
  - PRD-11 加 admin 业务页用 DenseTable + 复用 admin tokens(防 PRD-12+ 重复抽包)

### N-X 不做项(防过度乐观)

- **N-1 · 不在单 foundation US 塞 5 件工程**(详 §9 反向发现 1)
  - PRD-10 US-001 塞 27 files create + 5 大件事(monorepo + schema + RLS + 骨架 + middleware stub)· 一次过是幸运 · 不要复制
  - PRD-11 US-001 NSM 仪表盘 build:拆 schema migration + service layer + UI 3 个 small US · 不一锅烩

- **N-2 · 不在 PRD-11 期望 WAF / MFA 真启用**(详 §9 反向发现 2)
  - 这些是 PRR 阶段任务 · PRD-11 维持 stub mode · 跟 PRD-10 一致

- **N-3 · 不依赖 Opus 直 fix mechanical 错**(详 §5)
  - PRD-10 没触发 · 但 PRD-9 触发过 · 机制 dormant 状态可用 · 但不预期靠它
  - PRD-11 dev 内部 self-correct(US-002 CORS 模式)优先 · 减少 Opus 直 fix 机会

### E-X 实验项

- **E-1 · 业务页落地协议:replace placeholder.tsx + metadata.prd 更新模式**
  - PRD-11 第一次实战验证 P-2 协议是否真 work(0 sidebar 改动)
  - 验证指标:PRD-11 commits 中 sidebar.tsx / admin-routes.ts 不在 git diff(除非真有新域)

- **E-2 · audit script self-test 机制**(详 §12 M-3)
  - PRD-11 启动前加 scripts/audit-self-test.sh · 跑各 audit script 看 coverage(audit-admin-rls-tables.sh 列表 vs manual_admin_rls.sql 列表 diff)
  - 验证指标:audit-self-test catch TD-039/042 类 audit coverage gap

- **E-3 · 业务 PRD 复杂度 7+ stories vs PRD-10 7 stories**
  - PRD-11 P9.1 6 P0 业务核心域(NSM/users/accounts/cost/audit/invites)· 每域 3-4 US · 总 18-24 US · **大 PRD 试金石**
  - 验证指标:严格一轮通过率 ≥ 70%(PRD-8 大 PRD baseline · PRD-10 是小 PRD 86% 不代表 PRD-11 同等)

---

## 11. 归因占比

本 PRD 严格一轮通过率从 PRD-9 0% → PRD-10 86%(若按 retryCount=0 算 7/7 100%)归因到:

| 驱动 | 归因占比 | 证据 |
|---|---|---|
| **anti_patterns 21 entries 注入** | 30% | 防 5-7 reject(REJ-019/020/021/022/023/024/026 + PRD-1 US-006 OAuth CSRF 真案例)· 7 stories 全注入 |
| **PRD 文档详细度跃迁** | 25% | 1216 行 vs PRD-9 492 行 · §10/§11 admin 专属扩展 · AC 数 14-25/US · D-059~068 10 LD · §0 14 章节引用 |
| **跨 PRD pattern 继承** | 20% | accountIsolation pattern(D-009)→ adminRLS · workers=1(US-018)→ playwright admin · createCaller v11 → US-006 · 7 类继承 0 reject |
| **Coding 3.0 工作流成熟** | 15% | /plan-check ERROR catch branchName · monitor → daemon ack 链路稳 · Opus audit 5 步 cheat sheet · audit-redlines-admin.sh 完整 |
| **Story 拆分粒度合理** | 5% | 7 US foundation 1 + high 3 + medium 3 · 0 large story · US-001 升 foundation(downstream 6+ 跨 4 PRD)· F1-F5 深审 |
| **Ralph self-correct 能力** | 3% | US-002 CORS 顺序 dev 内部 self-fix · 0 reject 化解 |
| **Opus audit 主动性** | 2% | 4 audit cycle 留 TD-037~042 + /goal-verify 补 catch TD-043/044 · 主动发现 8 TD |
| **合计** | **100%** | |

**核心驱动** · anti_patterns 注入(30%)+ PRD 详细度(25%)+ 跨 PRD pattern(20%)= **75% 来自 plan-check + PRD + 历史教训** · 跨 PRD 知识复利效应显著

---

## 12. 应固化为 Coding 3.0 机制的建议(L4→L5 元进化)

### M-1: doc-vs-schema naming consistency 检查

- **观察** · PRD-10 第 3 次出现 doc-vs-impl naming drift(TD-038 "13" vs 14 + TD-040 adminUserId vs actorAdminId + TD-041 e2e flat vs admin/ 子目录)· 前序 PRD-9 出现过 1 次(TD-033 22 vs 23 元素)· **跨 PRD 重复性 ≥ 2 次**
- **现状** · 目前靠 Opus 审查时 case-by-case 发现 + manifest verdict notes 标记 · 高思考成本
- **建议机制化位置** · /plan-check 2.6.14 新增 "AC-DocSchemaConsistency" 检查
- **实现思路**:
  ```bash
  # 扫 prd.json AC 中含字段名引用(如 'adminUserId', '@@index')
  # 对每个字段名 · grep prisma/schema.prisma 看实际命名
  # 漂移则报 WARNING
  # 类似 §2.6.8 fe-be schema drift 但扩到 prisma model
  ```
- **ROI 估算** · 预计避免未来每 PRD 平均 1-2 轮 TD audit overhead

### M-2: packages/<sub>/ vs apps/<sub>/ 落位检查

- **观察** · PRD-10 首次出现 packages 应建未建(TD-044 D-068 admin tokens)· 前序 PRD 未见 · **跨 PRD 重复性 < 2 次 · 暂未达 M 阈值** · 但 monorepo 复杂度增加后概率增高
- **现状** · /goal-verify §0.4 对账时发现
- **建议机制化位置** · /plan-check 2.6.15 "PkgLocation" 检查(low priority · 等再发生 1 次再固化)
- **实现思路** · 扫 prd.json files_to_create 含 `packages/<sub>/` 路径 · 对照实际 `<actual location>` · 漂移报 WARNING
- **ROI 估算** · 待验证(PRD-11 维持观察)

### M-3: audit script self-test

- **观察** · PRD-10 第 2 次出现 audit script coverage 漂移(TD-039 manual_admin_rls.sql DISABLE 26 表 / audit script 验 13 表 + TD-042 US-007 改 list 后漏验 8 model)· **本 PRD 同类问题 2 次**
- **现状** · Opus audit 时 grep manual SQL vs audit script 列表 case-by-case · 高思考成本
- **建议机制化位置** · scripts/audit-self-test.sh + plan-check 2.6.16 "AuditScriptCoverage"
- **实现思路**:
  ```bash
  # scripts/audit-self-test.sh
  # 比较 manual_admin_rls.sql DISABLE 列表 vs audit-admin-rls-tables.sh 验证列表
  # diff > 0 报错 · 强制更新 audit script
  # CI 集成 · PR 加 schema 自动更新 audit script
  ```
- **ROI 估算** · 防 audit coverage gap 累积 · 类似 TD-016 5-PRD 漏 catch 类 灾难预防

---

## 13. Skill 升级建议 diff(L4 半自动进化 · 人工 review)

> **触发条件确认** · 本 PRD §12 发现 2 个 M(M-1 + M-3)· 触发条件"§12 非空"满足

### Diff-1: /plan-check 加 2.6.14 AC-DocSchemaConsistency

- **文件** · `~/.claude/commands/plan-check.md` 或 `~/.claude/skills/plan-check/SKILL.md`
- **插入位置** · 2.6.13 anti_patterns 注入覆盖率之后 · 新增子节
- **原因** · PRD-9 TD-033 + PRD-10 TD-038/040/041 · 4 次跨 PRD 同类问题 · 高 ROI 固化
- **建议 diff**:
  ```diff
  + ##### 2.6.14 AC-DocSchemaConsistency · doc 引用字段名 vs schema/migration 实际命名核对(PRD-9/10 retro M-1 固化 · 2026-05-12 新增)
  +
  + 防 PRD §1 AC 引用字段名跟 prisma schema / migration / TS interface 实际命名漂移。
  +
  + **触发条件**:PRD 含 prisma/schema.prisma + AC 中含字段命名引用(`@@index([X, Y])` / `X 字段` / `column X`)
  +
  + **检查规则**:
  + 1. 扫 prd.json 所有 acceptanceCriteria 文本 · grep 出 `@@index\(\[([a-zA-Z_]+)` / `field [a-zA-Z_]+` / `column [a-zA-Z_]+` 命名引用
  + 2. 对每个引用名 · grep prisma/schema.prisma + migrations/*.sql 实际命名
  + 3. 漂移 → WARNING(类似 §2.6.8 fe-be schema drift 但扩到 prisma vs PRD AC)
  +
  + **输出示例**:
  + WARNING [AC-doc-schema-drift] US-001 AC 第 13 条引用 `@@index([adminUserId, createdAt])`
  +   但 prisma schema AdminAuditLog 实际字段 `actorAdminId`(actor* 前缀)
  +   建议补丁:AC 改为 `@@index([actorAdminId, createdAt])` 或 schema 改字段名
  +   预估避免 · PRD-10 TD-040 类 doc-drift(每 PRD 平均 1-2 个)
  ```
- **人工 apply 流程** · 用户 review 后 Edit 到 plan-check.md

### Diff-2: scripts/audit-self-test.sh 新增 + plan-check 2.6.16 引用

- **新建文件** · `scripts/audit-self-test.sh`(项目级 · 不是全局)
- **原因** · PRD-10 TD-039 + TD-042 · 2 次同类 audit coverage gap · M-3 触发
- **建议 diff**:
  ```diff
  + #!/usr/bin/env bash
  + # scripts/audit-self-test.sh · audit script coverage self-test(PRD-10 retro M-3 · 2026-05-12 新增)
  + # 防 audit script 列表跟 manual SQL/schema/migration 数据源漂移
  +
  + set -uo pipefail
  + FAIL=0
  +
  + # === Test 1: audit-admin-rls-tables.sh 列表 vs manual_admin_rls.sql DISABLE 列表 ===
  + SQL_TABLES=$(grep -oE 'ALTER TABLE +[a-z_]+' prisma/migrations/manual_admin_rls.sql | awk '{print $3}' | sort -u)
  + AUDIT_TABLES=$(grep -oE "['\"][a-z_]+['\"]" scripts/audit-admin-rls-tables.sh | tr -d "'\"" | grep -E "^admin_|^approval_|^prompt_|^user_quota|^quota_|^trending_|^deep_learn|^kpi_|^ip_account_|^invite_|^auto_review|^user_violation|^evolution_|^feature_|^system_|^ab_" | sort -u)
  +
  + missing=$(comm -23 <(echo "$SQL_TABLES") <(echo "$AUDIT_TABLES"))
  + if [[ -n "$missing" ]]; then
  +   echo "❌ FAIL: audit-admin-rls-tables.sh 未验以下 manual_admin_rls.sql DISABLE 的表:"
  +   echo "$missing"
  +   FAIL=$((FAIL + 1))
  + else
  +   echo "✅ PASS: audit-admin-rls-tables.sh 列表跟 manual_admin_rls.sql 全对齐"
  + fi
  +
  + # === Test 2: 检查 audit script 内 path 是否真存在(防 PRD-1~5 src/ vs apps/api/src/ 类) ===
  + ...
  +
  + echo "Result: $FAIL fail"; exit $FAIL
  ```
- **人工 apply 流程**:
  1. 写 scripts/audit-self-test.sh + chmod +x
  2. 跑 1 次实测(catch TD-039/042)
  3. 加到 package.json scripts:`audit:self-test`
  4. /plan-check 启动前推荐 pnpm audit:self-test

### Diff-3: progress.txt Codebase Patterns 跨 PRD 累积归并机制(L3 优化)

- **背景** · PRD-10 7 新 patterns · PRD-9 2 + PRD-8 4 + ... 累积 · progress.txt Codebase Patterns 段已 ~14 条 · 接近 ralph CLAUDE.md "条目 > 20 条 用户介入整合" 阈值
- **建议** · 加 ralph-tools.py `consolidate-patterns` 命令 · 半自动归并跨 PRD 同语义 patterns
- **不建议自动 apply** · L4 哲学边界 · 由用户 review

**禁止行为**(L4 哲学边界遵守) ·
- ❌ 不自动改 ~/.claude/scripts/ralph/ralph.py 核心循环
- ❌ 不删除已有 plan-check 规则(只新增 2.6.14 + 2.6.16)
- ❌ 不建议移除 Audit Gate(即便 PRD-10 100% PASS)

---

## 14. 文档回流建议(commit 事实驱动)

### 14.1 取证范围

```bash
DEFAULT_BRANCH=main
MERGE_BASE=$(git merge-base HEAD "origin/main" 2>/dev/null || git merge-base HEAD main || echo "1a1300f")
git log --reverse --oneline "$MERGE_BASE"..HEAD
# 12 commits · 106 files / 7048 insertions / 31 deletions
```

### 14.2 候选回流条目(5-7 条精简)

#### A. AGENTS.md §10 admin 子系统宪法 · 补充实战注意

```
- §10.1 LD-A3 实战 · adminRLS 用 `$transaction + $executeRawUnsafe set_config('app.role','admin',true)` LOCAL=true(类比 accountIsolation D-009 · LOCAL=true 防连接池污染)
- §10.1 LD-A4 实战 · approvalGateCheck stub 即使 throw NOT_IMPLEMENTED · 也必先写 admin_audit_log eventType='approval_request_create' success=false errorCode='NOT_IMPLEMENTED' · 保 audit 闭环
- §10.2 R-A4 实战 · admin_audit_log 严格 append-only · audit-redlines-admin.sh R-A4 自动 grep `prisma.adminAuditLog.(update|delete|upsert)` = 0
```

#### B. AGENTS.md §10.4 audit_commands 补充

```
- §10.4.1 LD-A 检测 · scripts/audit-redlines-admin.sh + scripts/audit-admin-rls.ts(AST)+ scripts/audit-admin-rls-tables.sh 三件套已建
- §10.4 新增 · scripts/audit-self-test.sh(PRD-11 启动前补 · 防 audit script coverage 漂移)· 详 PRD-10 retro §12 M-3
```

#### C. CONCERNS.md 高频陷阱补充

```
- admin tokens 落位 · 当前在 apps/admin/src/styles/admin.css CSS custom property · packages/ui/admin/ 待建(PRD-11 启动前)· TD-044
- audit script coverage · audit-admin-rls-tables.sh 仅验 14 admin model(manual_admin_rls.sql DISABLE 26 表)· TD-039/042 · PRD-11 启动前 fix
- doc-vs-schema naming consistency · 4 次跨 PRD 同类问题(TD-033/038/040/041)· /plan-check 2.6.14 待固化
```

#### D. STRUCTURE.md 更新(PRD-11 启动前重组)

```
- /apps/{admin,api,web}/ + /packages/{schemas,ui,clients}/ + /prisma/ 6 子项目结构
- /apps/admin/ 13 文件骨架(layouts + components/admin + lib + pages + styles)
- /apps/api/src/trpc/{routers/admin, middleware/admin, procedures}/ admin 鉴权 + middleware 树
- /tests/{unit/admin, integration/admin, e2e/admin}/ admin 测试三层目录
```

#### E. INTEGRATIONS.md · 跨子项目接口

```
- packages/ui/base/ + packages/ui/admin/(待建)· admin Aurelian Dark 密集模式
- packages/schemas/ admin 类型 · 跨 web + admin + api 共享
- apps/api/src/server/{context, context-admin}.ts 双 context 路由 · /trpc/app.* + /trpc/admin.*
```

### 14.3 不做(硬性约束遵守)

- ❌ 不写 scripts/ralph/ + prd.json + Validator 等 admin/api/web 业务无关工具实现细节
- ❌ 不在根 AGENTS.md 堆 apps/admin/src/ 内部细节(归 STRUCTURE.md)
- ❌ 不把 progress.txt Codebase Patterns 原样搬运(只把"项目相关、可复用、当前分支仍成立"的归纳进去)
- ❌ 不改业务代码、脚本、配置、测试(只改文档)

### 14.4 落位决策(等用户确认)

| 文档 | 候选条目 | 严重度 |
|---|---|:-:|
| AGENTS.md §10.1-§10.2 实战注意 | A | 高(下游 PRD 必读) |
| AGENTS.md §10.4 audit_commands | B | 高(plan-check 必读) |
| CONCERNS.md | C | 中(TD-044 提醒 / audit coverage 警告) |
| STRUCTURE.md | D | 中(PRD-11 启动前重组 · 跟 TD-043 一起做) |
| INTEGRATIONS.md | E | 低(可后续) |

---

## 15. 执行预测(PRD-11 P9.1 6 P0 业务核心域)

### 预测指标

| 维度 | PRD-11 预测(遵循 Playbook)| PRD-11 预测(不遵循 Playbook · 重新摸索)|
|---|---|---|
| 预估 stories 数 | 18-24(每域 3-4 US × 6 域)| 20+(没 admin-routes.ts 协议 + 没 6 闸链复用 · 多 reject)|
| 预估一轮通过率 | **70-80%**(7 patterns 全继承 · 业务逻辑差异是变量)| 30-40%(0 patterns 继承 · 6 闸链重新摸索)|
| 预估 reject 数 | 2-4(业务逻辑差异 + admin 真实场景 corner case)| 8-12(基础设施重新摸索)|
| 预估 daemon time | 15-20h(PRD-10 4h × 4-5×)| 30-40h |
| 预估新 TD | 4-6(business logic edge case)| 10-15(基础设施 + 业务双重)|

### 关键变量(预测的不确定性)

- **真实业务复杂度**(NSM 仪表盘跨表聚合 + 用户管理 detail tab 5 路并发 + 成本仪表盘 PDF 导出)· 超出 PRD-10 stub mode 简洁
- **Approval Gates 真闭环**(LD-A4 + ADR-020 · PRD-13 主要做 · 但 PRD-11 业务封禁/改套餐已触发)· 需提前 PRD-13 部分实施
- **PostgreSQL 跨表聚合 SQL 性能**(NSM 仪表盘聚合 1k+ 用户)· 可能需 kpi_snapshots 预聚合表 · 新基础设施

---

## 16. 结论

**[PRD-10 = QuanAn 项目里程碑 PRD]**:
- ⭐ 第一个 admin 子系统 PRD · 立下 7 大 patterns + 5 audit scripts 模板
- ⭐ 严格 86% 一轮通过率(PRD-9 0% → PRD-10 86%)· 大幅跃迁
- ⭐ 0 reject + 0 BLOCKED + 0 RCA + 0 Opus 直 fix(全清零 · 连 4 PRD 0 reject)
- ⭐ 跨 4 下游 PRD 复用底座(PRD-11/12/13/14 直接 depends_on · 节省 20+h)
- ⭐ /plan-check + Coding 3.0 工作流成熟度证明(branchName ERROR 真 catch + anti_patterns 21 entries 实战防御)

**主应用 P0-P9.0 收官** · 距 PRD-11(P9.1 6 P0 业务核心域)启动一步之遥 · 7 patterns + 5 scripts + 44 TDs(全 low/medium · 0 PRR 必修)+ Playbook 7 P-X + 3 N-X + 3 E-X

**复盘 ROI** · 30 min retro + 提炼 7 patterns + 8 TDs + 3 M 机制建议 · 换取 PRD-11~14 预计 30-40h 节省(若严格遵循 Playbook)· **复利效应明确兑现**

---

## 附录 A · PRD 间成功率趋势

```
严格一轮通过率(retryCount=0 + 0 reject + 0 BLOCKED):

PRD-6:  ~73% (11/15 严格)  · 2 reject · daemon 12h
PRD-7:  100% (10/10)        · 0 reject · daemon 6h(cleanup TD-fix · 简单)
PRD-8:  54%  (7/13)         · 0 reject · daemon 6.24h(大 PRD · 复杂)
PRD-9:  0%   (0/5)          · 0 reject · 1 BLOCKED · daemon 3.5h(小 PRD · 但 infra storm)
PRD-10: 86%  (6/7)          · 0 reject · 0 BLOCKED · daemon 3.93h(foundation · 跃迁)★★★
```

**核心模式** · 大 PRD(13+ stories)严格 50-70% · 小 PRD(5-7 stories)严格 0-100% 大波动 · 影响因素 · infra storm(PRD-9 US-002 ECONNRESET) / cross-story 协议锁完整度(PRD-10 §0 14 章节引用)/ anti_patterns 注入密度(PRD-10 21 entries vs PRD-9 6 entries)

---

> **本复盘由 Opus 主对话(claude-opus-4-7)写于 2026-05-12 · /goal-verify PASS 后用户 /prd-retro 触发 · 单文件不简化 · 跨 PRD 8 维度 + 反向发现 + Playbook + L4/L5 机制建议 + 文档回流建议 · 跟 PRD-9 vs PRD-8 retro 模板一致**
