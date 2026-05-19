# PRD-1 P0 基础设施 · /prd-retro 复盘报告

> **生成** · 2026-05-08 03:35 · /prd-retro Opus 主对话
> **PRD** · PRD-1(P0 · 7 stories · 28 AC · risk=foundation × 4 + medium × 2 + high × 1)
> **首份 PRD** · 无前序对比 · 提炼 Playbook 基线给 PRD-2 起继承

---

## 🚀 TL;DR

```
PRD-1 完成度       100%(7/7 PASSED)
计划周期           2 周
实际周期           7h 40m(凌晨爆肝)· 远低于估算 · 因 ralph 高度自动化
ralph 总迭代       26 iter(7 stories)· 平均 3.7 iter/story · US-006 11 iter 是异常
Sonnet 时间        340 min(纯 ralph)
Opus 时间          ~50 min(audit 7 次 + 写 2 RCA + 1 reject + 1 fail-over)

关键事件 · 2 次根因分析(RCA)· 1 次 reject(US-006 CSRF)· 1 次 Opus fail-over(US-005)
TD 登记 · 8 条(3 closed · 1 accepted · 4 scheduled)
反例库 · 35 → 36 条(+1 OAuth CSRF)
```

---

## §1 PRD-1 干得好的(Wins)

### W-1 · ARCHITECTURE-driven 模式落地有效

PRD-1 严格按 PRD-MASTER.md §2 模板 · 7 US × 4 类 AC(H/E/B/P)· 实施时 ralph 没有跑偏(US-005 路径偏差是 SCAFFOLD §A.1 vs shadcn 默认的边缘问题 · 不算跑偏)。

**验证 ·** 28 AC 全 pass · 0 missing acceptance · 0 出现"业务跑偏"(只有 scope-creep TD-004 · 实务必需)。

### W-2 · Monitor 工具 SOL 60x 提速

US-001 audit 31min 空窗 → RCA-001 → Monitor task 持续监控 → US-002 起每次 audit-gate 写入 < 1s 通知 Opus。

**实测 ·** 6/7 stories Monitor 工作完美(US-001 是 baseline)· 全程 0 misfire。

### W-3 · 反例库自动入库(reject 时)

US-006 reject feedback 自动写到 `~/.claude/playbooks/reject-examples.jsonl`(OAuth CSRF query-param-bypass 教训)· 跨项目跨 PRD 沉淀。

**未来收益 ·** PRD-2/PRD-6 涉及 auth/credential/security-critical 关键字时 · prd skill 转 prd.json 自动注入这条反例 · ralph 实施前就有"前车之鉴"避免重复踩坑。

### W-4 · 简化 + 断点续跑救活 large story

US-005 size=large 卡 3 round · RCA-002 拆细 prd.json + notes 写"断点续跑指令" · ralph round 9 真的 4 min 跑通 + commit(我误判 stuck → TD-006 教训)。

**Pattern · 写 notes 详细列已写文件清单 · 不让 ralph 重写**(节省 30+ min)。

### W-5 · OAuth 安全严审 + reject

risk=high 严审 + 不允许 rubber-stamp 起作用了。requiresCsrfCheck 旁路 bug 通过 reject 修 · ralph 写 attack scenario test(注释 before/after fix 有教学价值)。

**沉淀 ·** "OAuth provider 抽象时 · isMockRequest 是 attacker-controllable input · never short-circuits security" 这条 pattern 永久写入反例库。

---

## §2 PRD-1 踩的坑(Lessons)

### L-1 · 启 daemon 后没启 Monitor → 31 min 空窗(RCA-001)

**根因 ·** macOS 系统通知发到屏幕 · Opus 主对话不接收 OS 通知 · 链路断在通知接收方。

**已修 ·** CLAUDE.md §9.1 5 步 SOP · Step 2 强制 Monitor 在 daemon 启动前。
**已沉淀 ·** §9.2 5 条红线(不允许靠系统通知 + 屏幕用户转告)。

### L-2 · size=large story 必卡 daemon(RCA-002)

**根因 ·** 5 角度 · 任务粒度 + stdout buffer + prompt 字节 + 检测策略宽 + prd skill 缺规则。

**已修 ·** CLAUDE.md §9.6 6 子节硬规则 · 包括 size_hint 决策表 + prompt 字节阈值(< 7K ✅ / 7-10K 🟡 / 10-12K 🟠 / > 12K 🔴 拒启)+ 失败 5 信号触发立即介入。

### L-3 · Opus fail-over 前没跑 git log → 二次实施浪费 5 min(TD-006)

**根因 ·** ralph round 9 实际 commit 了 · 我误判 stuck · 又跑 lint:fix + 二次 commit。

**已修 ·** CLAUDE.md §9.6.5 失败 SOP 加 Step 0 · "git log --since='10 min ago' 看是否已 commit"。

### L-4 · prisma migrate 由 US-003 跑触 PRD-1 P0 范围爬出(TD-004 accepted)

**根因 ·** PRD-1 §3 范围排除 14 写"RLS 启用 排到 PRD-2"· 但 prisma migration 创建表不在排除列表 · ralph 需要 schema 才能 prisma client + integration test 跑通 · 自然跑 migrate。

**未修 ·** PRD-2 启动时不重做 init migration · 仅跑 manual_rls.sql 启 RLS · 写到 PRD-2 §0 引用清单。

### L-5 · shadcn 12 组件路径偏差(TD-005)

**根因 ·** ralph 用 shadcn CLI 默认路径 apps/web/src/components/ui/ · 没读 SCAFFOLD §A.1 monorepo 拓扑要求 packages/ui/src/base/。

**未修 ·** P9.0 admin 启动前 lift。

---

## §3 给 PRD-2 起 ralph 的 Codebase Patterns(追加 progress.txt)

```
## Codebase Patterns(PRD-1 提炼 · 跨 PRD 永久)

### Monorepo · workspace
- monorepo 用 pnpm + apps/{web,admin,api} + packages/{schemas,ui,clients}
- 路径 alias 三轨同步:
  · root tsconfig.base.json paths
  · 各 apps tsconfig.json paths(extends base + override)
  · apps/web vite.config.ts resolve.alias(vite 不读 tsconfig)
  · vitest.config.ts resolve.alias(unit test 跨包 import)
- monorepo prisma client 解:
  · 加 .npmrc · public-hoist-pattern[]=@prisma/client
  · @prisma/client 在 apps/api/deps · 走 hoist 到 root node_modules
  · prisma migrate / generate 在 root 跑 · schema.prisma 在 prisma/

### TS strict + ESM
- tsconfig.base.json 全开 strict + noUncheckedIndexedAccess + noUnusedLocals + noUnusedParameters
- 抽象方法 protected abstract · 子类必 implements
- 未使用参数 prefix _ 而非删(noUnusedParameters 严格)
- ESM 全栈 type:module · target ES2022 · moduleResolution: Bundler

### LD-015 token 派生
- tailwind config 必须 .js(v3 工具链限)· 用 JSDoc 类型注解 + unit test 等价 TS strict
- DESIGN.md YAML 派生 token · 文字段忽略(LD-015 优先级)
- CSS vars HSL space + theme('colors.X') runtime 解析 · grep hardcode hex 0
- shadcn 用 copy-paste(不 npm install shadcn-ui)+ @radix-ui primitive + cn() (twMerge + clsx)

### OAuth + 安全
- requiresCsrfCheck 单参 providerName · 不接 attacker-controllable input(?mock=true 不能短路)
- session cookie 隔离 · 'app_session' ≠ 'admin_session'(防 REJ-026)
- Lucia v3 + arctic v3 PKCE + secure=isProduction + sameSite=Lax
- Hono CORS · origin=APP_BASE_URL + credentials:true · 不 wildcard
- OAuth callback deleteCookie state + code_verifier 防重放
- validateStartupConfig: SESSION_SECRET ≥32 + OAUTH_PROVIDER 合法 + prod-mock guard(全 exit(1))

### Trace + Logging
- AsyncLocalStorage(traceStore)+ pino mixin · 自动跨异步 chain 注入 traceId
- tRPC middleware traceStore.run({ traceId }, () => next(...)) 启动 ALS
- pino structured JSON Lines · level/time/pid/hostname/traceId/agentId 5 字段
- 严禁 console.log(AGENTS §6.9)· 全用 logger
- X-Trace-Id 双 case 兼容(小写 + 标准 case)· 缺失则 nanoid-16 fallback
- generateTraceId 同名 2 函数命名混淆(HTTP layer vs Specialist layer · TD-008 · 待重命名)

### Validator 产物
- audit-artifacts.py 期望 manifest exit_code(Python 项目)· TS 项目自然缺 · 走 Cheat Sheet §1.7 partial fake 补跑
- 多 iter 时 timestamps span > 1h 报 FAKE · 实际多 iter 自然 · 不阻塞 approve

### Specialist 抽象(BaseSpecialist 模板方法)
- abstract class BaseSpecialist<P, R> · 子类只实现 execute()
- run() 不可重写 · 处理 trace + validateInput + ContextAssembler.assemble + try/catch + timing + audit log
- validateInput · accountId>0 + agentId 匹配
- LD-001 95% Workflow · execute 单次 LLM 调用 · 不允许循环
- LD-012 LLM Gateway 唯一入口 · 严禁直 import @anthropic-ai/sdk / openai

### Ralph daemon SOP(本项目)
- 启 daemon 前必先启 Monitor(persistent · grep PENDING_DETECTED|审计门禁|APPROVED|REJECTED|⛔)
- size_hint=large story 必拆 · prompt > 12K 拒启
- fail-over 前必跑 git log --since='10 min ago' 看是否已 commit
- ralph round 卡 5min no-output 触发立即介入(不等 30min)
```

---

## §4 给 PRD-2 起 prd skill 的提示

PRD-2 P1 数据底座 · 2 周 · risk=foundation · 关键 US 数 8-10 · depends_on PRD-1。

**继承 ·**
- prisma init migration 已由 PRD-1 US-003 跑(38 表 baseline)· 不重做(TD-004)· 仅跑 manual_rls.sql 启 12 业务表 RLS
- BaseSpecialist abstract 已就位(US-007)· PRD-2 各 router 用 publicProcedure(已 wrap traceMiddleware)
- LLMGateway 仅 stub(throw 'not implemented in P0')· PRD-2 实施真 callProvider(arctic 路 anthropic + openai)
- packages/schemas barrel index.ts 占位 · PRD-2 起填 zod schemas

**注意 ·**
- 改 schema.prisma 走"DATA-MODEL → prisma → migration → 实测"4 步顺序
- 加 procedure 时改用 publicProcedure(自动 use traceMiddleware)
- 写 Specialist 子类时 extend BaseSpecialist + implements execute · 不要重写 run()

**反例库自动注入 ·** PRD-2 用 prd skill 转 prd.json 时 · 关键词命中(monorepo / typecheck / prisma / schema / RLS / etc)· 自动注入历史教训(36 条反例)+ Codebase Patterns 段(progress.txt)。

---

## §5 数据(成本 + 时长)

| 维度 | 数据 |
|---|---|
| 总日历时间 | 19:44 → 03:24 = **7h 40m** |
| Sonnet 纯 ralph 时间 | **340 min**(5h 40m)· 26 iter |
| Opus 主对话时间 | **~50 min**(7 audit + 2 RCA + 1 reject + 1 fail-over) |
| 人 review 时间 | ~30 min(用户截图反馈 2 次 · OAuth 决策 · 启 daemon 拍板) |
| 净 idle/等待 | ~80 min(主要因 US-001 31min 空窗 + US-005 stuck 重试) |
| LLM 成本估算 | $30-80(Sonnet 主体 + Opus audit · 详 ARCHITECTURE §9.12b) |

**iter 分布(异常 · US-006)** · 11 iter / 194 min · 因为 reject 后 round 4 跑通但 Validator 反复 5 次 · 加合计 11。

---

## §6 决策(给 PRD-2 起前的拍板)

**M-1 · 是否同步改 prd skill 加 size_hint=large 强制拆**

**推荐 ·** 是。改 ~/.claude/skills/prd/SKILL.md 加 §"Story 大小硬限"· 任何 size=large 必报错。但需要用户确认改全局 skill(影响其他项目)。

PRD-2 起本项目 prd skill 应自检 · 不自动改全局。

**M-2 · 是否升 ralph.py 改超时 5min no-output → 立即诊断**

**推荐 ·** 待观察。当前 §9.6.4 已写 5 信号介入 SOP · 我手动监控 Monitor 通知 + 进度截图。如果 PRD-2 再出 stuck · 改 ralph.py(影响其他项目 · 需用户确认)。

**M-3 · 是否在 PRD-2 起前 lift TD-005 shadcn 路径**

**不推荐 ·** TD-005 留 P9.0 admin 启动前 lift · 不影响 PRD-2 实施。

**M-4 · TD-007 lint 3 errors 修期**

**推荐 ·** PRD-2 起 ralph 写新 web 文件时 · 它跑 lint:fix 顺手清。或用户在闲时跑 `pnpm --filter @quanan/web lint --fix` 一键。

---

## §7 修订记录

- 2026-05-08 03:35 · v0.1 · 初稿(PRD-1 收官)· Opus 主对话 /prd-retro

---

> **结论 ·** PRD-1 100% PASSED · 沉淀 9 条 Codebase Patterns + 1 条新反例 + 8 TD + 2 RCA + CLAUDE.md §9 SOP · PRD-2 起步基础非常扎实。
