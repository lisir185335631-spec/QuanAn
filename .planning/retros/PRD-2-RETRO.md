# PRD-2 P1 数据底座 · /prd-retro 复盘

> **生成** · 2026-05-08 11:50 · /prd-retro Opus 主对话(简化版 · context 71% 节省)
> **PRD** · PRD-2 · 8 stories · 53 procedure · 178 tests
> **对比 PRD-1** · 第 2 份 PRD · 首份 ARCHITECTURE-driven 模式持续验证

---

## 🚀 TL;DR

```
PRD-2 完成度       100%(8/8 PASSED · 0 reject)
计划周期           2 周
实际日历时间        ~3.5h(07:54 → 11:34 · 比 PRD-1 7h40m 快 53%)
Sonnet 时间        ~150 min · 14 iter(对比 PRD-1 26 iter · 减半)
Opus 时间          ~30 min · 8 audit · 0 reject · 0 RCA · 1 fail-over

vs PRD-1 改进 ·
  · 0 reject(PRD-1 1 reject)
  · iter 14 vs 26(几乎少一半 · 因为 ARCHITECTURE-driven 已熟练)
  · 1 Opus fail-over(都因我误操作 · 不是 ralph 失败)
  · Monitor SOL 8/8 验证(PRD-1 是 6/7)

新发现 4 TD · 全 process-gap(我自己的失误)· 留 RCA-003
1 PRD design TD(TD-012 router alias 重复)
```

---

## §1 Wins(PRD-2 干得好的)

### W-1 · ARCHITECTURE-driven 模式持续有效

PRD-2 严格按 PRD-MASTER §2 模板 · 8 US × 4 类 AC · 实施时 ralph 0 跑偏 · 0 reject · 全程顺。**说明 PRD-1 写好 PRD 模板 + Codebase Patterns 沉淀给 PRD-2 起跑 · 复利效应明显。**

### W-2 · 反例库 + Patterns 跨 PRD 继承生效

PRD-1 沉淀 9 节 Codebase Patterns + 36 反例库 · PRD-2 ralph 自动注入 ·
- US-001 自动避开 REJ-008/009/013(RLS / executeRaw 跨 account)· 一次性写对
- US-002 自动避开 REJ-010(LS namespace)· clearLsNamespace 写对
- US-007 自动避开 REJ-001/003/006(Specialist 调 LLM 模式)· R-1 唯一入口写对

**PRD-1 RETRO §3 提供的"给 PRD-2 起 prd skill 的提示"** 全部 honor:
- ✅ 不重做 init migration
- ✅ 仅跑 manual_rls.sql(US-001)
- ✅ LLMGateway 真实施(US-007)
- ✅ 13+2=15 router 全填(US-003~006)
- ✅ 修 TD-007 lint + TD-008 generateTraceId(US-008)

### W-3 · LLMGateway 真实施(US-007 risk=high)0 reject

PRD-1 US-006 OAuth 是 reject 1 次才过 · PRD-2 US-007 LLMGateway 同等 high risk · **0 reject 直接过审** · 因为反例库已 cover R-1/LD-012 模式。

### W-4 · 174/174 tests + 4 e2e + lint clean 全包

US-008 一举 close TD-007(lint)+ TD-008(generateTraceId 重命名)· 加 2 关键 e2e(account-isolation + ls-db-sync)· 174 tests 0 fail。

---

## §2 Lessons(PRD-2 踩的坑 · 全是我 Opus 的失误)

### L-1 · 我误用 `pkill -f "claude --print"` 杀掉 ralph 子进程(US-004 · TD-009)

**根因 ·** 我测网络时 `claude --print "test" 2>&1` 跑完后用 `pkill -f "claude --print"` 杀僵尸 · **同时也杀了 ralph 正在跑的 claude 子进程**(round 2 exit 143)

**教训 ·** 任何 pkill 模式必须用项目无关的进程查找方式 · 比如检查 PPID(parent pid)是否是 ralph

**修补 ·** 写到 RCA-003 · CLAUDE.md §9.6.5 加红线"测试 claude CLI 不要用通用 pkill 模式"

### L-2 · `pgrep -fa ralph.py` 漏报 daemon → 双启动(US-004 · TD-010 + TD-011)

**根因 ·** ralph daemon 56588 启动后 · `pgrep -fa ralph.py` 没显示(可能因为 cmdline 截断)· 我误判 daemon 死了 · 又启 58298 · 两个 daemon 同时跑撞 prd.json

**教训 ·** `pgrep -fa` 在 macOS 不稳 · 用 `ps aux | grep ralph` 才显完整 cmdline

**修补 ·** §9.6.5 SOP Step 0 改 · "用 ps aux | grep ralph 而非 pgrep -fa"

### L-3 · ralph daemon 5min no-output 不自动 retry · zombie polling(TD-009 衍生)

**根因 ·** ralph round 6 dev log 0 bytes 5min 后 daemon 没 timeout kill claude · 老 daemon 47852 还在 polling 等 audit-gate

**教训 ·** §9.6.4 "5 信号触发立即介入" 要更主动 · 5min no-output 不仅 WARN · 应触发 daemon kill 子进程 + retry

**修补 ·** 留 ralph.py 改进(影响其他项目 · 留 v3 评估)

### L-4 · account / step router 跟 ipAccounts/stepData 重复(TD-012)

**根因 ·** US-002 加 LS↔DB hooks 时 · ralph 加 account.switchActive + step.saveStepData router · 但实际 ipAccounts.switchActive + stepData.save 已存在 · 重复

**教训 ·** prd skill 写 PRD-2 时未明确 hook 调用约定(用现有 router 还是新建 alias)

**修补 ·** PRD-3 USer story 中合并 · hooks 改调 ipAccounts/stepData(去掉 account/step alias)

---

## §3 给 PRD-3 起的 Codebase Patterns(追加 progress.txt)

```
## Codebase Patterns(PRD-2 提炼 · 2026-05-08 · 跨 PRD 永久)

### RLS middleware(LD-009 关键)
- set_config(name, value, true) 必须在 $transaction 内才生效(is_local 限 transaction scope)
- pass tx client as prisma 给 resolver · 否则 query 在不同 connection · set_config 无效
- protectedProcedure(走 RLS · meta.isGlobal 跳过 + ctx.activeAccountId 校验) vs
  globalProcedure(meta:{isGlobal:true} · 全局表 User/InviteCode/TrendingItem)
- $executeRaw 仅在 middleware 内合法(R-009 例外)· 其他位置 grep 必 0 命中

### LS↔DB 双写(ADR-010)
- LS key aiip_memory_acc_{accountId}_{suffix} 必含 account namespace(REJ-010)
- LS 先写 · DB 后写 · DB 失败时 LS 不回滚 + toast 提示(防数据丢)
- 切账号 clearLsNamespace(localStorage, oldAccountId) · grep 旧 prefix 命中 0
- LS 满 5MB 自动 prune 非 active 账号 namespace

### LLMGateway R-1 唯一入口(LD-012)
- @anthropic-ai/sdk + openai SDK 仅 llm-gateway/index.ts import · grep 全栈 0 命中其他位置
- API key 仅 process.env 读 · throw error 不含 key 值 · 0 log statement 含 key
- MODEL_BY_TIER as const satisfies · reasoning(sonnet→gpt-4o) · lightweight(haiku→gpt-4o-mini)
- @upstash/ratelimit token bucket(Free 50/日 · Pro 500/日 · Enterprise 5000/日)
- nock mock SDK 测试 · 不真调外部 API

### tRPC 命名分层(TD-008 修后)
- generateHttpTraceId() · 无参 · HTTP layer · randomBytes(8).toString('hex') 16-char
- generateSpecialistTraceId(accountId, agentId) · 结构化 · Specialist layer
- 不要再加 generateTraceId 同名 · 必须 layer 前缀

### Ralph daemon 操作 SOP(本项目)
- pgrep -fa ralph.py 在 macOS 不稳 · 用 ps aux | grep ralph
- pkill -f "claude --print" 会误杀 ralph 子进程 · 测试 claude CLI 用 timeout 命令
- daemon 启动前必 kill 所有 ralph 残留(包括 watch-audit-gate.py)+ rm lock + audit-gate
- 双 daemon 同时跑会撞 prd.json · 启动前 ps aux | grep -E "ralph|watch-audit" 必 0
```

---

## §4 给 PRD-3 起 prd skill 的提示

PRD-3 P2 路由 + 首页 · 1 周 · risk=medium · 关键 US 数 5-7 · depends_on PRD-2。

**继承 ·**
- 17 router 全 mock 就位(PRD-2 US-003~006)· PRD-3 加前端路由调
- LLMGateway 真实施(PRD-2 US-007)· PRD-3 不动
- RLS middleware + LS↔DB hooks 就位 · PRD-3 用现成

**注意 ·**
- ARCHITECTURE §9.4 P2 退出条件 · 33 路由占位 · IP 账号切换 · /ip-plan 跑通
- TD-012 合并 · hooks 改调 ipAccounts/stepData · 删 account/step router(可作为 PRD-3 第 1 个 US)

**反例库自动注入 ·** PRD-3 prd skill 转 prd.json 时关键词命中(routing / page / hook / accountId / etc)· 自动注入 · 含 PRD-2 新加的 RLS / LS↔DB / TraceId 命名分层等 patterns。

---

## §5 数据(PRD-2 vs PRD-1)

| 维度 | PRD-1 | PRD-2 | 改进 |
|---|:-:|:-:|:-:|
| Stories | 7 | 8 | +1 |
| Tests | 48 | 178 | +271% |
| 总 ralph iter | 26 | 14 | -46% |
| Sonnet 时间 | 340 min | ~150 min | -56% |
| Opus 时间 | ~50 min | ~30 min | -40% |
| 日历时间 | 7h40m | ~3h40m | -52% |
| Reject 次数 | 1 | 0 | -100% |
| Opus fail-over | 1(US-005)| 1(US-004 我误操作)| 持平 |
| RCA 写 | 2(audit + size) | 0 | -100% |
| 新 TD | 8 | 4 | -50% |
| Monitor SOL 验证 | 6/7 | 8/8 | 接近完美 |

**结论 ·** PRD-2 比 PRD-1 顺很多 · 主要因为 ·
1. ARCHITECTURE-driven 模式 + Codebase Patterns 跨 PRD 继承的复利效应
2. CLAUDE.md §9 SOP + §9.6 large story 拆分规则就位 · 无 size=large story
3. 反例库 36 条自动注入 · ralph 写代码前避开历史坑

---

## §6 决策(给 PRD-3 起前)

**M-1 · TD-009/010/011 是否写 RCA-003?**

**推荐 ·** 是。3 个 process-gap 都是我 Opus 失误 · 跨项目都会犯 · 写到 ~/.claude/CLAUDE.md(全局)更好。但 context 70% · 留下次会话写。

**M-2 · TD-012 router alias 何时合并?**

**推荐 ·** PRD-3 第 1 个 US · 路由前端调用规范 · 顺带删 account/step alias。

**M-3 · ralph.py 5min no-output 改为立即 kill claude 子进程 + retry?**

**推荐 ·** 留 v3 评估(改全局 ralph.py 影响其他项目)。当前用 Monitor + 我手动介入兜底。

---

## §7 修订记录

- 2026-05-08 11:50 · v0.1 · 初稿(PRD-2 收官 · 简化版 · context 71% 节省)

---

> **结论 ·** PRD-2 100% PASS · 跟 PRD-1 比明显改进(0 reject · iter -46% · 时间 -52%)· ARCHITECTURE-driven + Patterns 复利效应验证。给 PRD-3 起步基础非常扎实。
