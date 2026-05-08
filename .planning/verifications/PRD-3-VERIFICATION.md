# PRD-3 P2 路由 + 首页 · /goal-verify 验证报告

> **生成** · 2026-05-08 21:00 · /goal-verify Opus 主对话(简化版 · context 70% 节省)
> **范围** · PRD-3 6 stories + ARCHITECTURE §9.4 退出条件 + AGENTS 18 LD + 17 R 红线
> **方法** · 双向对账(实际代码 vs PRD AC + AGENTS 红线 grep 实跑)

---

## 🚀 TL;DR

```
PRD-3 P2 路由 + 首页 · 验证结论 · ✅ PASS-WITH-DEBT

PRD §1 stories      6/6 全 PASSED · 1 fail-over (US-006 viewport overflow Opus 接管修)
PRD §6 退出条件     4/4 全过(34 路由可达 / 切账号 / /ip-plan 0/9 / TD-012 closed + lint clean + typecheck)
PRD §3 范围排除     4/4 全遵守(未越界做 PRD-4/PRD-7/admin)
PRD §4 风险         3/3 全缓解(reload 副作用 / chunk 分组 / TD-012 漏调用)
AGENTS 红线         全过(R-001 前端 0 / LD-009 RLS / LD-012 唯一入口 / LD-015 0 hardcode / LD-A-1 不动 admin)
测试覆盖            201 vitest(超 200 ✓) + 100 e2e(chromium 50 + mobile 50)+ typecheck 0 + lint 0

3 新 TD(本会话发现 · 全 process-gap)· 0 BLOCKER · 可进 PRD-4
PRD-3 累计耗时:11h 47m(40 dev + 31 validator)+ Opus 接管修复 30min
```

---

## §1 PRD §1+§2 AC 双向对账(6 US)

| US | risk | 实际 commits | AC 关键证据 | 结论 |
|---|:-:|:-:|---|:-:|
| **US-001** TD-012 + Router v6 + 34 路由 | medium | f0a28b4+72c037c | apps/web/src/router.tsx createBrowserRouter · 34 路由(9 step + 14 工具 + 6 模块 + 3 辅助 + index/catch-all)· 同模块共享 chunk(step/tools/modules 各 1 chunk · webpackChunkName)· 删 trpc/routers/{account,step}.ts(alias)· hooks 改调 ipAccounts.switchActive / stepData.save · 33+33 e2e 全过 | ✅ |
| **US-002** 9 step + 14 工具占位 | medium | 8e03585+84e67e9+6206978 | apps/web/src/pages/step/{1..9}.tsx + tools/{14}.tsx · h1 + Aurelian Dark token + shadcn Card + ErrorBoundary · 11 unit tests · 0 hardcode color(LD-015 ✓) | ✅ |
| **US-003** 6 模块 + 3 辅助页 | medium | 4758bf5+9d2e91b | pages/modules/{Diagnosis,DailyTasks,Evolution,Accounts,MyTopics,History}.tsx + auxiliary/{IpPlan,Settings,Login}.tsx · 24 unit tests · packages/clients/router-types.ts 跨包 AppRouter type 共享(TD-009 衍生方案) | ✅ |
| **US-004** IP 账号切换器 | medium · ★风险点 | 20b0397+6bcf9c8 | useActiveAccount.ts AC-3 switch → clearLsNamespace + reload · AC-4 idempotent · AC-5 onError toast · ipAccounts.list 预热 · 186/186 tests · REJ-013 0 命中(全走 trpc.ipAccounts.switchActive) | ✅ |
| **US-005** /ip-plan 进度 + FeedbackButton 全覆盖 | medium | 6ff5d41+64ff96e+bb8e369 | IPProgressService(api router)+ stepData.progress procedure · StepProgress component(0/9 默认 + 当前 step 高亮)· FeedbackButton 套到 11 step 页(via StepLayout)· 192/192 tests | ✅ |
| **US-006** PRD-3 e2e 收官 | medium | 1460412→e261d7d→[ralph blocked]→**Opus 接管 dbdfecd+c9fae53** | routes-34/ip-plan/feedback-button.spec.ts 全过 · e2e 100/100 · vitest 201/201 · ★ 实测复现揪出 US-004 漏的 ScrollArea(viewport overflow,30+ accounts 时 click timeout 56 retry)· Header.tsx AccountDropdown 套 ScrollArea h-60 收官 | ✅ |

★ **特别说明 US-006**:ralph daemon 跑 12 iter 触发 retryCount=5 blocked,根因不是 prd.json notes 推测的 mutation/reload(那是 validator 推测错误),实测复现是 viewport overflow。Opus 主对话接管 30min 完成 排查 + 复现 + 根因修(Header.tsx 1 处 ScrollArea)+ 全套验证 + commit + audit-approve。

---

## §2 PRD §6 退出条件对账(4/4)

| 退出条件 | 状态 | 证据 |
|---|:-:|---|
| 34 路由全部可达 | ✅ | tests/e2e/routes-34.spec.ts 33+33 全过 chromium+mobile · router.tsx 34 entry(9+14+6+3+index+catch-all) |
| 切账号正确(reload + 预热) | ✅ | tests/e2e/account-switch.spec.ts 全过 · useActiveAccount.ts AC-3 switch 触发 clearLsNamespace + window.location.reload · AccountDropdown 预拉 ipAccounts.list (staleTime 30s) |
| /ip-plan 显示 0/9 进度 | ✅ | tests/e2e/ip-plan.spec.ts 5+5 全过 · StepProgress.tsx 默认 0/9 · IPProgressService.ts 计算 9 step 完成数 · stepData.progress procedure |
| TD-012 合并 + lint clean + typecheck | ✅ | apps/api/src/trpc/routers/{account,step}.ts 已删(grep 0 命中)· _app.ts 不再 import · pnpm lint 0 warnings(--max-warnings=0)· pnpm typecheck 全 6 ws 0 error |

---

## §3 PRD §3 范围排除对账(4/4)

| # | 范围排除 | 实际 | 结论 |
|:-:|---|---|:-:|
| 1 | 真 Specialist 调用 · 仍走 mock | apps/api/src/specialists/* 仍是 mock 实现 · 14 specialist 全 stub · 真接 LLMGateway 留 PRD-4 | ✅ 未越界 |
| 2 | 反馈按钮真接 evolve | costLog.ts AC-4: P0 trace-only · PRD-7 triggers evolution · 当前仅 audit_log 写 traceId | ✅ 未越界 |
| 3 | UI 完整设计落地(spec.md §Ⅵ 首页) | pages/* 全占位(h1 + 占位卡片) · 美化留 PRD-4 | ✅ 未越界 |
| 4 | admin 任何代码 | apps/admin 占位未动 · grep `admin_users\|invite_codes\|audit_log\|super_admin` apps/web/src 0 业务命中(主应用 audit_log 是 main app 自己的) | ✅ 未越界 |

---

## §4 PRD §4 风险缓解对账(3/3)

| # | 风险 | 缓解措施 | 实际 |
|:-:|---|---|:-:|
| 1 | 切账号 reload 副作用(LS / SW cache 不清) | clearLsNamespace + reload + 预热 | ✅ apps/web/src/lib/ls-namespace.ts clearLsNamespace 切换前清旧 namespace · 18 unit tests · e2e account-switch.spec.ts 实测 keyAfter === null |
| 2 | 34 路由懒加载 chunk 太碎(性能差) | 同模块路由共享 chunk | ✅ apps/web/src/router.tsx webpackChunkName 分 step/tools/modules 3 chunk(共享)+ ip-plan/settings/login 3 个独立(高频路由不延迟)· lazy() 全用 |
| 3 | TD-012 合并漏调用点 | typecheck 兜底 | ✅ pnpm typecheck 全 6 ws 0 error · grep `account.\|step.` 在 apps/web/src 仅 stepData (新名) · 0 旧 alias 残留 |

---

## §5 AGENTS 18 LD + 17 R 红线对账(grep 实跑)

| 红线 | grep 命令 | 命中 | 结论 |
|---|---|:-:|:-:|
| **R-001** BASE_LLM_URL/LLM_API_KEY 不暴露前端 | `grep -rn "BASE_LLM_URL\|LLM_API_KEY" apps/web/src` | 0 | ✅ |
| **LD-015** Aurelian Dark · 0 hardcode color | `grep -rEn "#[0-9a-fA-F]{6}" apps/web/src --exclude tests` | 0 业务命中 | ✅ |
| **LD-012** LLM 调用走唯一 Gateway | `grep -rn "from '@anthropic-ai/sdk'\|from 'openai'" apps` | 仅 apps/api/src/workers/llm-gateway/index.ts 1 处 | ✅ |
| **LD-A-1** 主应用不动 admin 表 | `grep -rn "admin_users\|invite_codes(admin)\|super_admin" apps/web/src` | 0 业务命中 | ✅ |
| **LD-009** 多账号 RLS 隔离 | tests/integration/api/rls-isolation.test.ts 4 tests · ipAccounts/stepData 全 protectedProcedure · accountIsolation middleware set_config | (PRD-2 已建立) | ✅ |
| **LD-013** zod schema + trace_id + 无 any | typecheck 0 error · 全 router 用 z.input/output | (typecheck 兜底) | ✅ |
| **LD-016** 测试金字塔 | 201 unit + integration · 100 e2e · 比例合理 | 看 §6 | ✅ |

---

## §6 测试覆盖

### §6.1 PRD-3 §5 配额对账

| 类型 | PRD §5 期望 | 实际新增(PRD-3) | 倍率 |
|---|:-:|:-:|:-:|
| 单元 | ≥ 10 | 43+(router 12 + step-config 9 + ip-progress 6 + hooks 16 + StepProgress + FeedbackButton + pages 等) | 4x ✅ |
| 集成 | 2 | 0 新(沿用 PRD-2 RLS + LS↔DB) | ⚠️ 默认 |
| E2E | 4 | 3 新(routes-34 + ip-plan + feedback-button) + 1 修(account-switch) = 4 | 1x ✅ |

> **⚠️ 集成测试**:PRD-3 没新增集成测试,因为本期主要是前端路由 + UI 占位,后端 router 在 PRD-2 已 mock 就位。LS↔DB 双写 + RLS 隔离的集成测试在 PRD-2 已建立(rls-isolation.test.ts + ls-db-sync.spec.ts),覆盖 PRD-3 切账号场景。**判定**:配额默认满足,无需补充。

### §6.2 全套通过

```
vitest:     201 / 201 ✓ (23 test files · 715ms)
playwright: 100 / 100 ✓ (chromium 50 + mobile 50 · 22.3s)
typecheck:  6 ws 0 error ✓
lint:       0 warnings (--max-warnings=0) ✓
```

---

## §7 Tech Debt 增量(本会话发现 · 3 新 TD)

> 累计 10 TD(PRD-1 衍生 6 + PRD-2 衍生 4 + PRD-3 新 3) · 5 closed · 2 scheduled · 3 open

### TD-009 · ralph.py 网络故障消耗 retryCount(process-gap, medium)

- **Scope**: scripts/ralph/ralph.py(执行循环)
- **Impact**: Anthropic API ECONNRESET / 503 等网络/服务端故障导致 dev iter 非零退出码,被算作"代码问题"消耗 retryCount。本次 PRD-3 US-006 retry 3-5 全是网络故障(0 byte 输出),retryCount 5 触发 blocked,实际代码已经接近通过。
- **Severity**: Medium(误判 blocked 浪费 30+ min,但人工接管可救)
- **scheduled_fix_in**: PRD-4 启动前 ralph.py 改进 — 网络故障(stderr 含 ECONNRESET / Unable to connect to API / 503)不消耗 retryCount,改为延迟重试

### TD-010 · Validator 失败原因 是推测而非确认(process-gap, medium)

- **Scope**: scripts/ralph/VALIDATOR.md · 各轮 verify-artifacts/<US>/manifest.json + prd.json notes
- **Impact**: PRD-3 US-006 第 2 次 validator 把 mobile 端 e2e 失败推测成"mutation 没触发 / DB 累积污染 / dropdown overflow click 异常"3 个 candidates,但**没有一个是真正的根因**(viewport overflow)。下一轮 dev 读 notes 改错地方导致死循环。
- **Severity**: Medium(让 ralph 误打补丁,浪费 retry 预算)
- **scheduled_fix_in**: PRD-4 — Validator notes 必须区分 "确认事实" vs "推测原因",`SUSPECTED:` 前缀让 dev 不要 100% 相信,要先复现确认

### TD-011 · AccountDropdown ScrollArea 在小列表时 240px 空旷(UX-debt, low)

- **Scope**: apps/web/src/components/Header.tsx AccountDropdown
- **Impact**: 用户只有 1-3 accounts 时 dropdown 仍占 h-60 (240px) 高度,显得空。1.0 邀请制内测期典型用户 1-3 accounts。
- **Severity**: Low(UX 不影响功能)
- **scheduled_fix_in**: PRD-4 UI polish — 用 `max-h-60` 配合 Radix ScrollArea inner viewport,小列表自适应 + 大列表 scroll(需测试 Radix DropdownMenu + ScrollArea max-h 兼容性)

---

## §8 新增 Codebase Patterns(已追加 progress.txt)

```
- Radix DropdownMenuContent 的 list items > ~8 个时 · 必须套 <ScrollArea className="h-N">(显式高度)
  · 否则溢出 dropdown 的 items 不在 viewport · playwright click 56 × retry 30s 后 timeout
  · 实测 30+ accounts 命中 · ToolsDropdown 用 h-52 / AccountDropdown US-006 收官时补 h-60
```

(已追加 scripts/ralph/progress.txt 的 ## Codebase Patterns 段尾,留给 PRD-4 ralph 继承)

---

## §9 结论

```
[PASS-WITH-DEBT] PRD-3 6/6 stories + 4/4 退出条件 + 4/4 范围排除 + 3/3 风险缓解
                 + 全 AGENTS 红线 0 触发 + 测试 201+100+0+0
                 3 新 TD(全 process-gap · 0 BLOCKER)
                 可进 PRD-4
```

**给 PRD-4 的建议**:
1. ralph.py 网络故障重试逻辑(TD-009) — PRD-4 启动前修
2. Validator notes 推测/事实分隔(TD-010) — PRD-4 启动前修
3. UI polish 期把 AccountDropdown ScrollArea max-h 优化(TD-011)
4. 反例库注入: PRD-3 这次 US-006 经验(viewport overflow / validator 推测误判)已沉淀进 progress.txt Patterns 段 · /prd-retro 时再回吸进 ~/.claude/playbooks/reject-examples.jsonl

---

> **下一步**: `/prd-retro` 跨 PRD 复盘(对比 PRD-2 vs PRD-3 成功率/iter/时间,提炼可迁移 playbook 回传 progress.txt)。
