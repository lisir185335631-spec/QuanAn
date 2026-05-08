# PRD-3 P2 路由 + 首页 · /prd-retro 复盘

> **生成** · 2026-05-08 22:30 · /prd-retro Opus 主对话(简化版 · context 65% 节省)
> **PRD** · PRD-3 · 6 stories · 34 路由 + 14 step + 14 工具 + 6 模块占位 + IP 账号切换 + /ip-plan 0/9
> **对比 PRD-2** · 第 3 份 PRD · ARCHITECTURE-driven 持续验证 + 首次 fail-over

---

## 🚀 TL;DR

```
PRD-3 完成度       100%(6/6 PASSED · 0 audit reject · ★ 1 fail-over US-006 Opus 接管)
计划周期           1 周
实际日历时间        ~8h36m(12:06 → 20:42 · ralph 跑 + Opus 接管 30min)
Sonnet 时间        ~9h17m · 23 iter (cost-log)
Opus 时间          6 audit + 1 接管修(30min)≈ 1h
US-006 占比         dev+val 279min / 总 592min = 47%(单 story 黑洞)

vs PRD-2 改进 ·
  · 0 audit reject(持平)
  · 1 fail-over (US-006 viewport overflow · 第 1 次 ralph blocked → Opus 接管)
  · 同模块 chunk 分组 · 主动缓解 PRD §4 风险
  · 5/6 stories ≤ 2 round pass(US-001/003/004 一轮过 · US-002/005 二轮过)

vs PRD-2 退步 ·
  · 时间膨胀 4x(单 story 平均 92min vs PRD-2 19min)
  · 1 fail-over(PRD-2 是 0 fail-over 1 误操作)
  · iter 23 vs 14(+64%)— US-006 占 11 iter

3 新 TD(全 process-gap)· 0 BLOCKER · 可进 PRD-4
```

---

## §1 Wins(PRD-3 干得好的)

### W-1 · 5/6 stories 顺畅过 · ARCHITECTURE-driven + Patterns 继承复利

US-001 ~ US-005 都是 1-2 round pass · 0 reject · audit 一次性过。继承 PRD-2 的 5 节 Codebase Patterns(RLS / LS↔DB / LLMGateway / TraceId / Ralph SOP)+ 反例库 36 条 · ralph 写 frontend hooks 时**自动避开**:
- US-002 调 trpc.ipAccounts(不是 trpc.account)— 受益 PRD-2 patterns
- US-004 clearLsNamespace + reload 一次写对 — 受益 REJ-010
- US-005 IPProgressService 走 protectedProcedure(per-account)— 受益 LD-009

### W-2 · 同模块 chunk 共享(主动缓解 PRD §4 风险 #2)

US-001 router.tsx 用 `webpackChunkName: "step|tools|modules"` 把 9+14+6 路由打成 3 chunk(避免 34 个独立 chunk 性能差)。**ralph 自己识别**该写注释 — 不是 PRD 强制要求。

### W-3 · TD-012 顺带 closed(PRD-2 遗留)

US-001 合并删除 trpc/routers/{account,step}.ts(alias router) · 同步前端 hooks 调用 · 0 残留 · grep 实测 0 命中。**1 个 commit 同时实现 + 闭环 TD**。

### W-4 · packages/clients/router-types.ts 跨包共享(US-003 衍生)

ralph 在 US-003 时主动把 AppRouter type 提取到 packages/clients/router-types.ts · web/admin 共用 · 解决 monorepo cross-package type 误报。**这是 prd skill 没要求 · ralph 主动判断的扩展**。

### W-5 · FeedbackButton 11 step 全覆盖 → 单点收敛(US-005)

US-005 第二轮把 11 step 页都加 FeedbackButton(原本 prd-3 §1 US-006 计划的)· 提前到 US-005 · 也就此发现 strict mode 重复渲染问题 · audit 阶段揪出 · US-006 修(移到 StepLayout 单点 · 11 step 页内不再重复)。

---

## §2 Lessons(PRD-3 踩的坑)

### L-1 · US-006 viewport overflow 黑洞 · ralph 12 iter 触发 blocked

**根因 ·** US-004 时 AccountDropdown 漏写 ScrollArea(ToolsDropdown 有 h-52 模式)· DB 累积 30+ accounts 测试时 · 新建 acc2 在 dropdown 列表底部 · 溢出 viewport · playwright click 56× retry timeout 30s。

**为什么 12 iter 都没修对 ·**
1. 第 1-2 round Validator 推测失败原因是 "mutation 没触发 / DB 累积污染 / dropdown click 异常"(prd.json notes)— **3 个推测全错**(真根因是 ScrollArea 缺失)
2. 第 3-5 round Anthropic API ECONNRESET · dev iter 0 byte 输出 · retryCount 3→4→5 触发 blocked — **网络故障消耗 retry 预算**
3. Opus 接管 30 min 复现 + 修(1 行 ScrollArea 套接 · viewport 实测 30s timeout × 56 retry → 1.3s pass)

**教训 ·** 
- Validator 推测的失败原因可能 100% 错 · ralph dev 信任 notes 改错地方导致死循环
- 网络故障不是代码问题 · 不应消耗 retryCount

**修补 ·** 
- TD-009 ralph.py 网络故障识别(留 PRD-4 启动前修)
- TD-010 Validator notes 区分 SUSPECTED/CONFIRMED(留 PRD-4 启动前修)

### L-2 · prd skill 没把 "list 大数据测试" 列入 PRD-3 §4 风险

**根因 ·** PRD-3 §4 风险 3 项(reload 副作用 / chunk 碎 / TD-012 合并漏)· 没考虑"e2e 测试在 dev DB 累积场景下的边界条件"。

**教训 ·** Frontend e2e 涉及 list/dropdown/grid/scroll 类组件时 · PRD §4 风险该明确列入 "N > threshold 的累积污染场景"。

**修补 ·** 写到 §3 Codebase Patterns 给 PRD-4 prd skill 借鉴。

### L-3 · US-002/US-005 的 retry 是因为 PRD AC 跨域(StepLayout vs page)

**根因 ·** 
- US-002 第 1 round 漏 Step2/Step9/Copywriting 页 · 第 2 round 补
- US-005 第 1 round 漏 FeedbackButton 在 11 step 全覆盖 · 第 2 round 补

**教训 ·** PRD §1 写"占位 + 调 mock"时 · ralph 倾向用最小化实现(只做明确列出的)· 跨域(StepLayout 共享)的部分要 prd skill 明确点出。

**修补 ·** 不算 retry 严重(都是 1 次 fail-over · audit 揪到补)· 写到 §3 Patterns。

---

## §3 给 PRD-4 起的 Codebase Patterns(已追加 progress.txt)

```
## Codebase Patterns(PRD-3 提炼 · 2026-05-08 · 跨 PRD 永久)

### Radix list/dropdown 组件 · viewport overflow
- DropdownMenuContent / Select / Combobox / 任何 list 类 · items > 8 必须套 <ScrollArea className="h-N">
  · 否则 items 溢出 dropdown viewport · 在大 N 数据时 playwright click 56× retry 30s timeout
- 同模块共享 chunk · React.lazy + webpackChunkName · 避免 34 路由各自独立 chunk · 性能差
- shared AppRouter type 提到 packages/clients/router-types.ts · web/admin 共用 · 防 cross-package type 误报

### e2e 测试 · 共享 dev user 边界
- DB 测试用 dev@local.test 时 · 30+ entries 累积是常态(PRD-3 实测)
- 任何依赖"列表底部新建 item"的 spec 必须保证组件能 scroll(套 ScrollArea + h-N)
- 切账号 e2e 用同 user 不同 IP 账号 · 不要并发跑(workers=1 for 这一类)· 否则 active_account_id race
```

---

## §4 给 PRD-4 起 prd skill 的提示

PRD-4 P3 真 Specialist 接 LLMGateway · 1.5 周 · risk=high · 关键 US 数 6-8 · depends_on PRD-3。

**继承 ·**
- 14 Specialist mock 就位(PRD-2 US-004/US-005 mock router)· PRD-4 改成真调 LLMGateway
- LLMGateway R-1 唯一入口(PRD-2 US-007)· PRD-4 用现成 callProvider
- 34 路由 + 占位页(PRD-3)· PRD-4 真功能落地
- /ip-plan + StepProgress(PRD-3 US-005)· PRD-4 加真 step 完成判定

**注意 ·**
- ARCHITECTURE §9.5 P3 退出条件 · 14 Specialist 真出 LLM 内容 · 5 step 跑通(创建账号 → step 1 → step 2 → ... → step 5)
- TD-009 / TD-010 必须先修(否则 PRD-4 高 risk story 撞同样陷阱):
  - TD-009 · ralph.py 网络故障不消耗 retryCount(stderr grep ECONNRESET)
  - TD-010 · VALIDATOR.md 区分 SUSPECTED / CONFIRMED · ralph dev 看 SUSPECTED 必先复现

**反例库自动注入 ·** PRD-4 prd skill 转 prd.json 时关键词命中(specialist / llm / gateway / streaming)· 自动注入 PRD-3 新 patterns(ScrollArea / e2e DB 边界 / chunk 共享)+ PRD-2 LLMGateway 模式。

---

## §5 数据(PRD-3 vs PRD-2 vs PRD-1)

| 维度 | PRD-1 | PRD-2 | PRD-3 | 趋势 |
|---|:-:|:-:|:-:|:-:|
| Stories | 7 | 8 | 6 | 缩减(收敛) |
| Tests 总(累积) | 48 | 178 | 201+100e2e | +13% / +56% |
| Sonnet iter(本 PRD) | 26 | 14 | 23 | -46% / +64% |
| Sonnet 时间 | 340 min | ~150 min | ~592 min | -56% / +295% ★ |
| 日历时间 | 7h40m | ~3h40m | ~8h36m | -52% / +135% |
| Reject 次数(audit) | 1 | 0 | 0 | 持平 |
| Fail-over | 1(US-005)| 1(我误操作)| 1(US-006 Opus 接管)| 持平 |
| 一轮过率 | ~70% | ~88% | ~83%(5/6) | -5pp |
| 新 TD | 8 | 4 | 3 | 收敛 |
| RCA 写 | 2 | 0 | 0(本会话不写)| 持平 |
| Codebase Patterns 新增 | 9 节 | 5 节 | 1 + 2 节 | 收敛 |

**结论 ·** PRD-3 时间膨胀主要因 US-006 黑洞(占 47%)· 排除 US-006 后 PRD-3 5 stories 平均 62min/story(对比 PRD-2 19min)· 仍慢 3.3x。原因 ·
1. **Frontend e2e 启动成本高**(playwright dev server + DB seed + 100 tests × 22s)
2. **US-006 是真 e2e 收官 + lint clean** · 4 e2e + 全套测试 + typecheck + lint 一起跑 · 单 round 时间长
3. **US-002/US-005 跨域补漏**(StepLayout / FeedbackButton 11 step)· 第 2 round 才完整

---

## §6 反向发现(不可迁移)

### 偶然成功 1 · Opus 30min 接管修(高思考成本)

**为什么不可复制 ·** Opus 接管修 US-006 是因为 ralph daemon blocked + Opus 实测复现 mobile project + 看出 viewport overflow。这种"实测+看出"是 Opus 的深度思考能力 · 不是 ralph 流程能力。下次 PRD-4 如果撞类似 blocked · 可能 Opus 也找不到根因。

**缓解 ·** TD-010 推动 Validator 强制 SUSPECTED/CONFIRMED 区分 · 减少 Opus 兜底依赖。

### 偶然成功 2 · DB 30+ accounts 触发 viewport overflow 暴露 ScrollArea 漏

**为什么不可复制 ·** 这次是因为前期 ralph daemon 跑过多轮 e2e 测试 · DB 累积了 80 accounts。如果 PRD-3 第一次跑 · DB 只有 1-2 accounts · 测试通过 · ScrollArea 缺失漏 · 上线后才发现。

**缓解 ·** §3 Patterns 加 "list/dropdown 组件 N>8 必须 ScrollArea + h-N"· PRD-4 prd skill 写 list 类 AC 时主动列入 §4 风险。

---

## §7 归因占比表(PRD-3 vs PRD-2 时间膨胀)

PRD-3 比 PRD-2 慢 4x · 量化驱动 ·

| 驱动 | 占比 | 证据 |
|---|:-:|---|
| US-006 e2e 黑洞(viewport overflow + ECONNRESET) | 47% | US-006 单独占 279/592 min |
| Frontend e2e 启动成本 | 25% | playwright 100 tests × 22s + dev server warmup × 多 round |
| US-002/US-005 跨域补漏 | 15% | 第 2 round 补 step 页 + 11 FeedbackButton |
| Codebase Patterns 继承不足(frontend 类 0 patterns 从 PRD-2) | 8% | PRD-2 patterns 全是 backend(RLS/LS↔DB/LLMGateway)· frontend 类 ralph 摸索 |
| 其他(audit 时间 + commit 时间)| 5% | 6 audit × 5min |
| **合计** | 100% | |

---

## §8 应固化为机制的 N 条反复问题(L4→L5 元进化)

### M-1 · ralph.py 网络故障消耗 retryCount(跨 PRD 第 2 次出现)

- **观察** · PRD-3 US-006 retry 3-5 全是 ECONNRESET。**前序问题** · 看 PRD-2-RETRO §2 L-1 也提到"网络问题杀子进程"(我 pkill -f 误杀)· 同类"网络故障"反复发生。
- **现状** · ralph.py 把所有 dev iter 非零退出码当代码问题 · retryCount +1
- **建议机制化位置** · `~/.claude/scripts/ralph/ralph.py` build_developer_prompt 后捕获 stderr · grep ECONNRESET / "Unable to connect to API" / "API Error" / "503" · 不消耗 retryCount · 改为指数退避重试
- **实现思路** · 在 ralph iter loop 里 grep stderr · 若命中网络关键词 · attempt += 1 但 retryCount 不动 · time.sleep(min(2**attempt, 60))
- **ROI 估算** · 每 PRD 平均省 1 次 fail-over · 30+ min(US-006 实证)

### M-2 · Validator notes 推测 vs 事实未区分(跨 PRD 第 1 次出现 · 但严重)

- **观察** · PRD-3 US-006 第 2 次 Validator notes 推测的 3 个失败原因全错 · ralph dev 信任改错地方死循环。**新发现** · 此前 PRD-1/PRD-2 没暴露(因为前 2 个 PRD 没复杂 e2e 失败场景)。
- **现状** · VALIDATOR.md 没要求 Validator 区分推测/事实 · ralph 100% 信任 notes
- **建议机制化位置** · `~/.claude/scripts/ralph/VALIDATOR.md` 升级 + ralph CLAUDE.md 加规则
- **实现思路** · Validator 写 notes 时强制格式 ·
  ```
  ## CONFIRMED(实测复现 + 命令 + 输出)
  - <事实 1 with reproduction>
  
  ## SUSPECTED(推测原因 · 待复现)
  - <推测 1 with caveat>
  ```
  · ralph CLAUDE.md 加规则 · "看 SUSPECTED 必先 reproduce 再动手"
- **ROI 估算** · 每 PRD 平均省 0.5 次死循环 · 1-2h(US-006 实证)

### M-3 · 大 N list 组件 ScrollArea 缺失(新规律)

- **观察** · PRD-3 US-006 暴露 AccountDropdown 漏 ScrollArea。**前序** · ToolsDropdown 有 h-52 模式 · 但同 codebase 内有"漏写"。
- **建议机制化位置** · `~/.claude/scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md` 加"frontend list 域"
- **实现思路** · audit 时 grep `<DropdownMenuContent\|<SelectContent\|<CommandList` · 若内含 `.map(` 无 `<ScrollArea` 套接 · 提示 reviewer 检查 viewport overflow 风险
- **ROI 估算** · 每 PRD 1 次 catch · 30 min

---

## §9 Skill 升级建议 diff(L4 半自动 · 用户 review 后 apply)

> ★ 本节只生成建议 · 不自动 apply · 等用户确认。

### Diff-1 · VALIDATOR.md 加 SUSPECTED/CONFIRMED 区分要求

- **文件** · `~/.claude/scripts/ralph/VALIDATOR.md`
- **原因** · TD-010 / M-2 · PRD-3 US-006 实证 ralph 100% 信任 Validator notes 导致死循环
- **建议 diff(unified)** ·

```diff
+ ## 失败原因 notes 强制格式(2026-05-08 · PRD-3 US-006 经验)
+ 
+ Validator 写 notes 时**必须**区分两类:
+ 
+ ### CONFIRMED(实测复现 + 命令 + 输出 · 100% 事实)
+ - <事实 1>
+   - 复现命令: <bash 命令>
+   - 实际输出: <输出片段>
+   - 失败定位: <file:line>
+ 
+ ### SUSPECTED(推测原因 · 仅候选 · 未复现)
+ - <推测 1>
+   - 推测依据: <为什么觉得是这个>
+   - ⚠️ 必须先 reproduce 验证 · 不要直接改代码
+ 
+ **示例**(PRD-3 US-006 实证) ·
+ ✅ 好 ·
+   CONFIRMED · playwright mobile project click 'account-item-83' timeout 30s
+     复现 · pnpm playwright test tests/e2e/account-switch.spec.ts --project=mobile
+     输出 · "element is outside of the viewport" × 56 retry
+ 
+ ❌ 坏(PRD-3 US-006 第 2 次 Validator 实犯)·
+   "切换账号后 mutation 可能未触发 reload"  ← 推测当事实写
+   "DB 30+ accounts 累积导致 idempotent 命中"  ← 推测当事实写
```

- **人工 apply 流程** · 用户 review → 同意 → Opus Edit `~/.claude/scripts/ralph/VALIDATOR.md`

### Diff-2 · ralph.py 网络故障重试逻辑

- **文件** · `~/.claude/scripts/ralph/ralph.py`
- **原因** · TD-009 / M-1 · PRD-3 retry 3-5 全是 ECONNRESET 浪费 30min
- **跨项目影响** · ★ 高(影响所有项目 ralph daemon)· 建议**留 v3 评估**(不在本次 retro apply)
- **如果 apply** · 在 dev iter 后 `if exit_code != 0:` 内加 ·

```diff
+   # 2026-05-08 PRD-3 US-006 经验:网络故障不消耗 retryCount
+   stderr_text = stderr.decode('utf-8', errors='ignore')
+   network_signals = [
+       "ECONNRESET", "Unable to connect to API",
+       "API Error: 503", "API Error: 502", "API Error: 504",
+       "Connection refused", "timed out"
+   ]
+   if any(sig in stderr_text for sig in network_signals):
+       network_attempt += 1
+       backoff = min(2 ** network_attempt, 60)
+       print(f"[NETWORK] {network_attempt}/10 · 等 {backoff}s 后重试 · retryCount 不变")
+       time.sleep(backoff)
+       if network_attempt >= 10:
+           print("[FATAL] 网络故障 10 次 · 真 blocked")
+           # fall through to retryCount += 1
+       else:
+           continue  # retry without consuming retryCount
+   network_attempt = 0  # reset on non-network failure
```

- **人工 apply 流程** · 因为跨项目影响 · 留全局评估 · 暂不 apply

### Diff-3 · AUDIT-CHECKLIST-TEMPLATE.md 加 frontend list 域

- **文件** · `~/.claude/scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md`
- **原因** · M-3 · PRD-3 实证 list 组件 ScrollArea 缺失漏 audit
- **建议 diff** ·

```diff
+ ### Frontend list 组件域(2026-05-08 · PRD-3 US-006 经验)
+ 
+ 仅 frontend story 含 dropdown / list / select 类组件时检查 ·
+ 
+ - [ ] DropdownMenuContent / SelectContent / CommandList 内的 .map(...) 是否套 ScrollArea?
+   - grep · `grep -A5 "DropdownMenuContent\|SelectContent\|CommandList" apps/web/src --include='*.tsx' | grep -B2 ".map("`
+   - 命中后看是否有 `<ScrollArea` · 没有 → 大 N 数据时 viewport overflow 风险 · 必须套
+   - ScrollArea height 取 h-52 / h-60 / max-h-N(单元高度 × ~8 + buffer)
```

---

## §10 文档回流建议(commit 事实驱动)

### 1. 取证范围

```bash
git log --reverse --oneline e87a6f4..HEAD  # PRD-3 起点 = e87a6f4 (PRD-2 retro)
git diff --name-status e87a6f4..HEAD
```

### 2. 提炼候选(只保留 5 条)

| # | 内容 | 落位 |
|:-:|---|---|
| 1 | apps/web/src/router.tsx 是 React Router v6 入口 · 34 路由 · 同模块共享 chunk(step/tools/modules)· lazy loading | apps/web/STRUCTURE.md(若存在)/ AGENTS.md §11(技术栈具体落位)|
| 2 | packages/clients/router-types.ts 是跨包 AppRouter type 共享出口 · web/admin 共用 | AGENTS.md §11(monorepo 包关系)|
| 3 | apps/web/src/layouts/StepLayout.tsx 渲染共享 FeedbackButton · 11 step 页内**不要重复渲染** · strict mode 会拒绝 | apps/web/CONVENTIONS.md(若存在)|
| 4 | Radix DropdownMenu list > 8 项必须套 ScrollArea + 显式高度 · 否则 viewport overflow + e2e click timeout | apps/web/CONCERNS.md / AGENTS.md §10(高频陷阱) |
| 5 | useActiveAccount.ts AC-3 switch → clearLsNamespace + window.location.reload · AccountDropdown 预拉 ipAccounts.list staleTime 30s | AGENTS.md §11 / apps/web/CONVENTIONS.md |

### 3. 不保留

- ❌ Story 编号 / retry 次数 / Opus 接管经过 · 留在 retro 文档
- ❌ Codebase Patterns 全部原样搬 · 只筛选与 AGENTS.md 强相关的(上面 5 条)

### 4. 触发节奏

回流**不强制立刻执行** · 等用户确认。回流后 AGENTS.md 进版本控制。

---

## §11 决策(给 PRD-4 起前)

**M-1 · TD-009/010 是否在 PRD-4 启动前修?**

**强烈推荐 ·** 是。两条都有 PRD-3 实证 · 不修则 PRD-4 高 risk story(真 LLM 调用 · 网络故障概率高)很可能撞同样陷阱:
- TD-009 网络重试逻辑 · 留 v3 评估(影响其他项目)· 但本项目可在 scripts/ralph/ralph.py 单独 patch
- TD-010 VALIDATOR.md SUSPECTED/CONFIRMED 区分 · 全局 · 用 §9 Diff-1 apply

**M-2 · TD-011 AccountDropdown ScrollArea h-60 是否优化为 max-h?**

**推荐 ·** 留 PRD-4 UI polish 期 · 测 Radix DropdownMenu + ScrollArea max-h 兼容 · 不影响功能。

**M-3 · 是否升级 Audit checklist 加 frontend list 域(M-3)?**

**推荐 ·** 是。§9 Diff-3 apply · 防 PRD-4 真 functional UI 落地时漏 list/dropdown 组件 ScrollArea。

**M-4 · cost-log.jsonl 是否清理 PRD-2 残留?**

**推荐 ·** 暂不。PRD-3 vs PRD-2 数据对比已记到本 retro · cost-log 累积是 ralph daemon 设计的(不区分 PRD)· 留全局评估清理逻辑。

---

## §12 修订记录

- 2026-05-08 22:30 · v0.1 · 初稿(PRD-3 收官 + Opus 接管 · 简化版 · context 65% 节省)

---

> **结论 ·** PRD-3 6/6 PASS · 但 1 fail-over(US-006 viewport overflow + 网络故障)暴露 ralph.py + VALIDATOR.md 两个进化点。给 PRD-4 起步:**先修 TD-009 + TD-010 · 再启 daemon**。否则 PRD-4 高 risk story(真 Specialist + LLM)很可能撞同样陷阱浪费时间。
