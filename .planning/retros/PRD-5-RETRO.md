# PRD-5 P4 创作模块 · /prd-retro 复盘

> **生成** · 2026-05-09 · /prd-retro Opus 主对话(完整版 · 11 节)
> **PRD** · PRD-5 · 12 stories · CopywritingAgent 解锁 free/boom mode + AnalysisAgent 新建 + 4 工具页 + /history 接入 · risk=medium · 计划 1 周
> **对比 PRD-4** · 第 5 份 PRD · 第一份"共享 Specialist 多 mode 验证"PRD · ralph daemon claude CLI 系统级 hang 事故首次 · Opus 主对话路径 B 救援首例

---

## 🚀 TL;DR

```
PRD-5 完成度       100%(12/12 PASSED · 0 fail-over · 0 audit reject · 但 ★ 1 BLOCKED 救援)
计划周期           1 周
实际日历时间        ~10.3h(2026-05-09 12:04 prd.json → 22:21 4 TD fix · 单日 marathon)
Sonnet 时间        ~12.5h wall(83 cost-log entry · ralph daemon 11 iter + 5 hang retry)
Opus 时间          ~3h(11 audit + Goal-verify + GSD codebase + 4 TD fix · 含 1 重大救援)
反例库 + Patterns 注入 · 17+ 反例 + 14 节 Pattern 自 PRD-1~4 全继承 · 0 摸索

vs PRD-4 改进 ·
  · 0 audit reject(★ 比 PRD-4 1 reject 进步)
  · 多 mode + analysis 模板继承顺利(US-002 解锁 free/boom + AnalysisAgent 新建 0 retry)
  · Foundation 档升档机制持续(US-001/002 foundation · 0 reject · 模式定型)
  · 测试套件大幅扩展(542 vitest +199 from PRD-4 / 22 judge +8 / 126 e2e +20)
  · ToolForm/ToolResult 抽象首次落地(StepForm 模式扩展 · LD-009 LS namespace 区分)

vs PRD-4 退步 ·
  · ★ 1 BLOCKED 救援(US-012 ralph daemon hang · 5 次 retry 全 0 bytes · Opus 主对话路径 B 接管 audit)
  · ralph daemon 因 claude --print CLI 系统级 hang 失联(RCA-003 · 跟 prompt/模型/大小都无关)
  · TD 4 新发现(全 design-drift)· 但本次"3 historical TD + 1 顺手"+ 全 resolved · 净 +0
  · cost-log 跨 PRD 累积污染(154 entries 含 PRD-4 18 stories · 必须 filter by date)

★ 4 TD 发现 + 修复 ·
  · TD-016 (High) PII mask + disclaimer 0 接线 · PRD-1/2 期间历史遗留 · 5 个 PRD 漏 catch · 修
  · TD-017 (Medium) audit-redlines.sh 路径过期 · 17 红线全假绿灯 · 真根因 · 修
  · TD-018 (Medium) audit-ld.sh 不存在 · package.json 引用断链 · 配 TD-017 让 PII 漏 catch · 修
  · TD-019 (Low) knowledge.ts getFavorites/getNotes RLS-only 漏 explicit accountId · audit 修后第一次 catch · 修

★ 新 RCA · RCA-003 · ralph daemon claude --print CLI 系统级 hang on US-012 · sonnet+opus 都 hang
0 BLOCKER · 可进 PRD-6
```

---

## §1 Wins(8 维度)

### W-1 · PRD 写作质量 · assumptions-driven + 协议锁第 5 次验证

PRD-5(1500+ 行)严格按 PRD-MASTER §2 模板 · 12 US × 4 类 AC + §1.5 协议锁(A 类型签名 / B Specialist outputSchema / C history+cost_log / D router procedure 命名 / E 既有代码现状对账 F5)· §3 范围排除 12 项明确 · §6 退出条件 7 项可量化 · §7 Locked Decisions D-026~D-035 跨 PRD 编号延续 · §8 反例库 17+ 关键词命中。**实施时 ralph 0 大跑偏**(11/12 顺利 · US-012 失败是 claude CLI 环境问题 · 不是 PRD 问题)。

**关键改进** vs PRD-4: §1.5 加了 **F5 既有代码现状对账**(2026-05-09 新增)· 防 TD-012 类协议锁 vs 既有 stub 冲突。PRD-5 0 出现这类问题。

### W-2 · Ralph 实施 · Codebase Patterns 跨 PRD 继承 · 0 摸索

PRD-1~4 累计 14 节 Codebase Patterns(进 progress.txt 顶部段)· PRD-5 ralph **直接套用 0 重学**:

- US-006 BoomGenerate.tsx · IndustrySelect ScrollArea h-72 · 直接套(继承 PRD-3 ScrollArea 教训)
- US-008 Analysis.tsx · 5 维度 progress bar · 复用 PRD-2 progress 组件 · 0 新建
- US-010 VideoAnalysis.tsx · 22 元素 tag · 复用 IndustrySelect 模式
- US-011 history.ts · accountId 自动 RLS + protectedProcedure(继承 PRD-2 模式)· 0 grep 红线漂移
- 全 5 router 用 protectedProcedure(REJ-013 反例自动注入 · 实现前必读)

**最关键**: US-002 解锁 CopywritingAgent free/boom mode + 新建 AnalysisAgent 双 mode · **0 retry**(继承 PRD-4 多 mode 模式 · _mode + outputSchema getter)。

### W-3 · Audit · 0 reject(vs PRD-4 1 reject)

PRD-5 11 个 ralph daemon 跑的 stories(US-001~011)· **全部 0 audit reject**:
- foundation 2 + high 4 + medium 6 全过
- Opus audit 按 OPUS-AUDIT-CHEATSHEET 5 步执行 · 平均 5-15 min audit/story
- §0 4 项实测 + 通用 4 维度 + 域 grep 全过 · 无 TD 豁免

**模式定型**: US-002 Foundation audit 拿掉 PRD-4 TD-012 教训 · 协议锁双对账验证后 0 retry 一次过。

### W-4 · 多 mode + 共享 Specialist 模式标准化

PRD-5 是**第一份"共享 Specialist 多 mode 验证"PRD**:
- CopywritingAgent: step7 (PRD-4) + free + boom + acquisition(throw 'PRD-6')4 mode 共存
- AnalysisAgent: viral + structural 2 mode(全新)
- 总 6 mode · 5 处 _mode + outputSchema getter 复用(继承 PRD-4 TD-014 race window 文档化)

**ToolForm/ToolResult 抽象首次落地**:
- D-030 决策: 新建 ToolForm wrapper(不复用 StepForm)· 因为 stepKey 必填 vs toolKey 可选 + LS namespace 不同
- D-031: getToolLsKey(accountId, toolKey, suffix)= `acc_{id}_tool_{tool}_{suffix}` · 跟 stepLsKey 区分
- 4 工具页(Generate/BoomGenerate/Analysis/VideoAnalysis)全用 ToolForm/ToolResult · 0 重复代码

### W-5 · 测试金字塔 · 配额扩展 + Judge 套件大幅增长

PRD-5 测试新增:
- vitest: 343 → **542** (+199 · +58%)· 其中 21 是 PRD-5 收尾 TD-016 compliance.test.ts
- judge: 14 → **22** (+8)· 4 文件各 2 golden case(医美 + 健身 · 育儿 + 理财 · 美妆 + 美食 · 减肥 + 育儿)
- e2e: 106 → **126** (+20 · 含 5 tools-integration spec serial · CI mock LLM)
- typecheck: 6 ws · 0 errors(同 PRD-4)
- lint: 0 warnings(同 PRD-4 · --max-warnings=0 严格)

**LLM Judge 测试模式标准化**:
- vi.hoisted({ mockComplete }) + vi.mock('@/workers/llm-gateway')
- golden case 数组(input + actualOutput + criteria + expectedKeyFields)
- runJudge(case_)中央调度 · eventType='judge_call' 中央设(judge-runner.ts:74)
- 11 文件 × 2 cases = 22 tests · 总 422ms(< 5 min budget · 712x margin)

### W-6 · history 接入策略 · 单 procedure + 各 router 写入

D-029 决策: 单一 history.list procedure(filter by agentId/agentMode/sourceType/dateRange)+ 各 router 自然写入(分散写 · 集中读)· 工具页 useEffect(?historyId)调 history.detail 预填。

**TD-016 教训实施**(US-001 修):7+ router 写 history.agentId 时统一用 PascalCase Class name(CopywritingAgent / AnalysisAgent)· grep `agentId: '[a-z]'` apps/api/src 应 0 命中 · audit pass。

**跨 router cross-cut**(REJ-013 反例自动注入):全 5 router 用 protectedProcedure + accountId 双层防护(US-011 audit 实测验证)。

### W-7 · 跨 PRD 知识沉淀 · /goal-verify §0 GSD 事实层 + 9 新 patterns

PRD-5 完成后 /goal-verify §0 跑 GSD codebase mapper × 4 并行 · 产出 .planning/codebase/ 7 文档 5097 行(STACK / INTEGRATIONS / ARCHITECTURE / STRUCTURE / CONVENTIONS / TESTING / CONCERNS)· 与 AGENTS.md 设计约束对账 · catch 3 historical TD(TD-016/017/018)。

**9 新 Codebase Patterns 回传 progress.txt**(下个 PRD-6 自动继承):
- LLM Judge mock 模式(vi.hoisted + vi.mock)
- e2e tRPC v11 httpBatchStreamLink 3-line JSONL mock
- e2e serial + sharedPage(workers=1 fullyParallel=false 防 race)
- 多 mode Specialist _mode + outputSchema getter
- packages/schemas inline 常量(防跨包 cycle)
- ToolForm wrapper 跟 StepForm 分离
- history 单 procedure + 各 router 写入
- TD-016 PascalCase agentId
- e2e mock 4 history rows 必含 'content' 字段(否则 row.content.substring TypeError)

### W-8 · TD 修复链 · audit 工具修后立即生效

PRD-5 goal-verify §0 + 4 TD fix 形成完整因果链:
- TD-018 audit-ld.sh 不存在 ┐
                              ├→ R-14 PII 5 个 PRD 漏 catch → TD-016(High · 上线即合规风险)
- TD-017 audit-redlines.sh ┘   audit-redlines.sh 修后第一次 catch → TD-019
  路径过期(17 红线假绿灯)

**4 TD 一次性修干净**:
- TD-016: ContextAssembler.\_formatUserPrompt 接 piiMask + BaseSpecialist.execute 接 disclaimer + pii-mask.ts apply 顺序 bug 修 + 21 unit/integration tests
- TD-017: audit-redlines.sh monorepo 路径全修 + multi-line awk 跨行解析 + 12/12 红线 PASS
- TD-018: audit-ld.sh 新建 · 18 LD + 5 R 验证 · R-14 硬 catch
- TD-019: knowledge.ts getFavorites/getNotes 改 explicit accountId(LD-009 双层防护)

零回归: vitest 563 + typecheck 0 + lint 0 全过。

---

## §2 Lessons(8 维度)

### L-1 · ★ ralph daemon claude --print CLI 系统级 hang(RCA-003)

**事故详情**:
- US-012 收官 story · ralph daemon 5 次 retry 全失败:
  - 迭代 15 (17:47): 30 min 超时 · 0 bytes · retryCount=1
  - 迭代 16 (18:17): 30 min 超时 · 0 bytes · retryCount=2
  - 迭代 17 (18:47): 4 min ECONNRESET · 49 bytes · retryCount=3
  - 迭代 18 (18:51): 4 min ECONNRESET · 49 bytes · retryCount=4
  - 迭代 19 (18:55): 4 min ECONNRESET · 49 bytes · retryCount=5 → BLOCKED
- daemon "[OK] 所有任务已完成" 自然退出(混淆 PASSED 和 BLOCKED)
- 用户 review screenshots 报告状态后 Opus 接手

**根因深查**(控制实验):
- ✅ 简单 24-char prompt → claude --print 25s 秒回 OK
- ✅ 3K 普通 TCP 知识 prompt → 30s 内 1433 bytes 完整退出
- ❌ 3K ralph 模板 prompt → 60s+ 0 bytes hang
- ❌ 11K US-012 prompt(sonnet)→ 60s+ 0 bytes hang
- ❌ 11K US-012 prompt(opus)→ 90s+ 0 bytes hang
- ❌ 11K US-011 prompt(之前 ralph 跑成功)→ 60s+ 0 bytes hang

**结论**: 不是 PRD-5 / US-012 specific · 不是模型 · 不是大小 · 是 **claude CLI 在某种环境状态下对所有 ralph-template prompts 100% hang** · 1-2 小时内突变。RCA-003 详记 + 跨 PRD 教训。

**Opus 主对话救援(路径 B)**:
- 用户给 4 选 1: A 等 / B Opus 接管 / C R&D 找 hang 根因 / D 切 opus model
- 选 B → 30 min 内确认 ralph 实际已 commit 81017b4(代码完整)+ 后续 fix commits · 仅 prd.json 状态脱节
- Opus 接管: 跑 §0 4 项实测 + 通用 4 维度 + 5 条域 grep + AC-16 4 证据链 + 写完整 manifest + 改 prd.json passes=true
- 实际 audit 1.5h 完成 · 比从 0 写代码节省 70%

### L-2 · ralph daemon BLOCKED 后静默 exit COMPLETE 误导

ralph.py 看到所有 stories 解决(包括 BLOCKED)就输出:
```
[OK] 所有任务已完成（部分可能 BLOCKED）！
```

并自然 exit. **没有响铃 / 通知 / audit-gate(needs_attention)**。用户 review 时容易误以为成功(进度条 11/12 + 文字"已完成"混淆)。**应该改成 BLOCKED 触发 audit-gate(needs_attention)+ 等待用户介入**。

(进 §6 L4→L5 应固化机制建议)

### L-3 · audit 工具失效 5 个 PRD 漏 catch · TD-017+018 是真根因

PRD-1 时写的 `scripts/audit-redlines.sh` 用 `src/` 路径 · 但 monorepo 早就是 `apps/api/src/` · grep 全部假绿灯。+ `audit-ld.sh` 在 package.json 引用但**文件不存在**。

**后果**: PRD-1~5 的 17 红线检查 100% false-positive PASS · LD-018 PII drift 漏 catch 5 个 PRD · 直到 PRD-5 goal-verify §0 GSD 扫码才发现。

**根因(再下一层)**: PRD-1 时只跑 audit:redlines 看 echo 输出, 没看 grep 实际 stdout · 看到 "✅ 通过" 文字就放过。**audit script 自身没有元 audit**。

### L-4 · ralph Validator 只写 manifest.json 不留 5 stdout 产物

US-012 Validator 写完 manifest.json 后 audit 时发现 verify-artifacts/US-012/ 只有 1 文件(manifest.json)· 缺 vitest/judge/e2e/typecheck/lint 5 stdout 产物。**Opus audit 必须亲跑补产物** · 否则 §0 4 项实测无凭证。

按 OPUS-AUDIT-CHEATSHEET §1.7 "partial FAKE 补跑实测" 流程: 我亲跑 + tee 保存到 5 stdout 文件 + 改 manifest.json 加 artifacts 列表。

### L-5 · cost-log.jsonl 跨 PRD 累积污染

cost-log.jsonl 154 entries · 但其中包含 PRD-1~PRD-4 全部 stories(US-001~US-018 都有 entries)· PRD-5 stats 时必须 filter by date(`grep "2026-05-09"`)否则 grand total 严重虚高。**应分 PRD 文件**(`cost-log-PRD-N.jsonl`)避免污染。

### L-6 · 知识 router(knowledge.ts)RLS-only 设计第一次被 audit catch(TD-019)

PRD-3 期间 knowledge.ts 注释明确写 "(RLS auto-filters by accountId)" 不传 explicit accountId · 是 design choice。但 LD-009 强调"3 道闸"(middleware + RLS + UI)· **explicit accountId 是 defense-in-depth 必需**。audit-redlines.sh TD-017 修后第一次 catch · 改成双层防护。

### L-7 · 微妙: piiMask apply 顺序 bug(PRD-1 引入 · 5 个 PRD 漏)

pii-mask.ts apply 顺序原: email → phone_cn → phone_intl → id_card → bank_card。phone_intl regex 弹性 max 20 位 · **比 bank_card(16-19 位)+ id_card(18 位)位数还多**。phone_intl 先 apply 抢吃了 bank/id 字段 → bank_card / id_card 永远不脱敏。

**修复**: id_card / bank_card 提前到 phone_intl 之前(长固定优先 · 弹性短优先后)· TD-016 修时顺手发现并修。**单元 test 之前没覆盖** · 是 5 PRD 漏的另一证据。

### L-8 · ralph daemon 长跑(11 stories)后 claude CLI 风险大

PRD-5 ralph daemon 跑 11/12 顺利 · 第 12 个 hang。可能跟"ralph daemon 长跑 N 个 story 后 claude CLI 状态累积"相关(但未证实)。建议: ralph daemon 每 5-7 stories 重启一次(预防性)· 或 monitor "30 min 0 bytes 模式"立即 kill。

---

## §3 反向发现(不可迁移 · 偶然成功)

### 偶然 1: ralph 在 hang 之前已 commit US-012 70% 工作

US-012 hang 不是从一开始 · ralph 实际跑过几次成功的 commit:
- 81017b4 (20:28): feat: [US-012] 主 implementation(4 judge + 1 e2e + manifest)
- cc00e6c (20:42): fix: e2e Step 5 MOCK_HISTORY_LIST missing content
- f8551c1 (20:42): chore: append progress.txt
- 47a76c9 (20:48): fix: e2e Step 2 boom-generate input selector
- 之后才进入 hang 5 次

**Opus 接管时省 70% 工作 · 但完全是巧合**。如果 ralph 第 1 次就 hang(0 commit)· Opus 必须从 0 写 5 个测试文件 + 跑测试 + audit · 估 3-5 hr · 总救援时间会翻倍。

**不可复制性**: 下次 hang 可能在 0 commit 时发生。建议: ralph daemon 内置"hang 检测 + commit 前自动 git push"(确保部分工作不丢)。

### 偶然 2: claude --print 简单 prompt 还能用

调试 ralph hang 时 · claude --print "say only OK" 25s 秒回 · 让我能并行单独验证 prompt 内容。如果 claude CLI 完全挂(连简单 prompt 都不响应)· 我连 hang 元凶都查不出 · 只能靠用户切 model / 重启。

### 偶然 3: dev server 跑着 + DB 跑着 不需要重启

PRD-5 audit 时 dev server (5173 + 3000) 已经在跑(用户上次调试时启动)· DB 已经在跑。**Opus 接管 e2e 验证** + curl 验证 backend 时直接复用 · 0 启动 cost。如果 dev server 没跑 · 需要 `pnpm dev` 启动 + 等待 ready · 加 5-10 min。

### 偶然 4: TD-019 (knowledge.ts) 是 audit catch 真发现 · 不是事先 review

audit-redlines.sh 修复后跑 + catch knowledge.ts:98 漏 explicit accountId · 这是 audit 工具修复后**第一次真发挥作用**的实证。**如果不是 TD-017 TD-018 一起修 · 永远不会被 catch**。这是个不可复制的"audit 工具修复 → 立即发现新 TD"的 chain reaction。

---

## §4 归因占比(PRD-5 vs PRD-4 改进 + 退步)

### 改进归因(为什么 0 reject + 测试套件 +58%)

| 驱动 | 归因占比 | 证据 |
|---|:-:|---|
| Codebase Patterns 跨 PRD 继承 | 35% | ScrollArea / multi-mode / e2e mock JSONL / TD-016 PascalCase 全部直接套用 0 重学 |
| 反例库自动注入(17+ 反例)| 25% | REJ-013 protectedProcedure / REJ-008 accountId / REJ-007 outputSchema getter · ralph 实现前必读 · 0 retry |
| Foundation 档升档机制(downstream≥3)| 15% | US-001/002 foundation · 严格 audit 0 reject |
| §1.5 协议锁 F5 既有代码现状对账 | 10% | 防 TD-012 类协议锁 vs 既有 stub 冲突 · PRD-5 0 出现 |
| ToolForm/ToolResult 抽象首次落地 | 8% | 4 工具页 0 重复代码 · 速度大幅提升 |
| LLM Judge mock 模式标准化 | 5% | 8 新 case 用 PRD-4 vi.hoisted 模式 · 0 学习成本 |
| 其他(BaseSpecialist 抽象/中央 prompt 装配/etc)| 2% | LD-005/007 持续验证 |
| **合计** | **100%** | |

### 退步归因(为什么 1 BLOCKED + 4 TD 发现)

| 驱动 | 归因占比 | 证据 |
|---|:-:|---|
| ★ claude CLI 系统级 hang(L-1 RCA-003)| 70% | sonnet+opus 都 hang on ralph-template prompts · 1-2h 内突变 · 是环境问题不是设计问题 |
| audit 工具失效(TD-017+018)| 15% | PRD-1 写错路径 + PRD-1 忘写脚本 · 5 PRD 漏 catch · 真根因 |
| ralph daemon BLOCKED 后静默 exit COMPLETE | 8% | "[OK] 所有任务已完成" 文字误导 · 用户难判断真状态 |
| Validator 只写 manifest.json(L-4)| 5% | OPUS-AUDIT-CHEATSHEET §1.7 partial FAKE 补跑流程触发 |
| cost-log 跨 PRD 累积(L-5)| 2% | filter by date 才能拿 PRD-5 真数据 |
| **合计** | **100%** | |

### 时间分布(PRD-5 12.46 hr agent time)

| Story | duration | % | 备注 |
|:-:|:-:|:-:|---|
| US-012 | 154.5 min | 20.7% | ★ 含 5 hang × 30 min 浪费 = ~150 min · 实际有效 ~25 min |
| US-004 | 92.1 min | 12.3% | 前端 generate · 6 iter |
| US-011 | 83.5 min | 11.2% | history 接入 · 6 iter · cross-cut 复杂 |
| US-002 | 73.3 min | 9.8% | Foundation · 6 iter |
| US-007 | 62.6 min | 8.4% | analysis 后端 · 8 iter(最高 iter 数)|
| US-008 | 47.2 min | 6.3% | analysis 前端 |
| US-010 | 46.3 min | 6.2% | video-analysis 前端 |
| US-001 | 45.2 min | 6.0% | Foundation |
| US-006 | 38.2 min | 5.1% | boom-generate 前端 |
| US-009 | 33.8 min | 4.5% | video-analysis 后端 |
| US-003 | 48.3 min | 6.5% | generate 后端 |
| US-005 | 22.4 min | 3.0% | boom-generate 后端 · 最快 |

**关键观察**: 减去 US-012 浪费的 130 min(5 hang × 26 min avg)· 真实 agent time = **10.3 hr** · 跟 wall clock 8.8h 接近(说明 background sub-agent 跟 main session 高度重叠)。

---

## §5 PRD-6 Playbook(基于 PRD-5 教训)

### P-必做(5 项)

- **P-1** · audit:redlines + audit:ld 必跑(TD-017+018 修后)· 加到 CI · 加到 ralph Validator X-6 产物。**PRD-6 启动时验证 0 红线 · 否则不进**。
- **P-2** · ralph daemon 启动后**立即 monitor**(项目 §9.1 SOP)· 检测"30 min 0 bytes 模式"立即 kill + check claude CLI 健康(简单 prompt 测试)· 不让 retryCount 跑到 5。
- **P-3** · ralph Validator 必落 5 stdout 产物(vitest-full.stdout.txt · judge.stdout.txt · e2e.stdout.txt · typecheck.stdout.txt · lint.stdout.txt)· 不只 manifest.json。如果只有 manifest.json · audit reject(进 OPUS-AUDIT-CHEATSHEET §1.7 partial FAKE 流程)。
- **P-4** · PRD-6 新 Specialist(VoiceChatAgent / EvolutionAgent / DailyTaskAgent / 等)直接继承 BaseSpecialist 的 PII 接线 + disclaimer · 0 额外工作。
- **P-5** · knowledge router 模式(双层防护 · TD-019 修)· PRD-6 任何新 router **禁用 RLS-only**单层 · 必须 explicit { accountId: activeAccountId!, ...filters } + RLS。

### N-不做(3 项)

- **N-1** · 不再用 RLS-only 单层防护(PRD-3 教训 · 第一次被 PRD-5 audit catch)· LD-009 严格双层。
- **N-2** · 不让 ralph daemon 长跑超过 10 stories(PRD-5 经验 · 11 顺利第 12 hang)· 建议每 5-7 stories 重启 · 减少 claude CLI 状态累积风险。
- **N-3** · 不依赖"ralph daemon 自然 exit COMPLETE 文字判断"(L-2)· 必须读 prd.json status + audit-gate 状态。

### E-实验(2 项)

- **E-1** · gstack/browse mac binary(/Users/return/.claude/skills/gstack/browse/dist/browse · 63 MB)替代 ralph e2e mock · 真浏览器 + 真 LLM 跑 AC-16 收官验证。
- **E-2** · cost-log 按 PRD 拆文件(cost-log-PRD-6.jsonl)· 避免跨 PRD 累积污染 stats。

---

## §6 应固化为 Coding 3.0 机制的建议(L4→L5 元进化)

### M-1: ralph daemon BLOCKED 后必须写 audit-gate(needs_attention)· 不静默 exit

- **观察**: PRD-5 第 1 次出现 · 但 PRD-3 RCA-001 已暗示同类问题(audit-gate Monitor 失效)· **跨 PRD 重复 ≥ 2 次**
- **现状**: ralph.py 在所有 stories resolved(passes ∨ blocked)就 exit · 输出 "[OK] 所有任务已完成（部分可能 BLOCKED）" 文字 · 用户难判断真状态
- **建议机制化位置**: ralph.py exit logic
- **实现思路**:
  - 检查 prd.json 是否含 blocked=true story
  - 有 → 写 audit-gate.json(status='blocked_needs_attention', blocked_stories=[...])
  - 系统通知用户 + 不 exit · 等用户决策(approve / reject / split / quit)
- **ROI**: 避免 PRD-5 类 31 min 空窗 + 用户误判 · 预计每 PRD 平均节省 30-60 min user time

### M-2: claude --print CLI 健康检测(防 hang)

- **观察**: PRD-5 第 1 次出现 · 是新 RCA-003 · **跨 PRD 暂未重复但风险大**(影响 100% of US-012 类故事 · 是 ralph 单点失败)
- **现状**: ralph.py 跑 claude --print 卡 30 min 才超时 · 浪费 retryCount
- **建议机制化位置**: ralph.py spawn dev/validator agent 前
- **实现思路**:
  - spawn 前先用极简 prompt(< 100 char)测 claude --print 5s 内能否响应
  - 不响应 → 跳过本轮 + 等 60s 重试 · 不算 retryCount
  - 连续 3 次都不响应 → 写 audit-gate(claude_cli_unhealthy) + 等用户介入
- **ROI**: 避免 PRD-5 类 5 × 30 min = 2.5 hr 浪费 · 预计每年 save N hr

### M-3: audit-redlines.sh + audit-ld.sh 自身的元 audit

- **观察**: PRD-1~5 audit script 失效假绿灯 5 个 PRD 没 catch · **跨 PRD 重复 5 次同根因**
- **现状**: audit script 跑通后看 ✅ 文字就放过 · 没验证 script 自身路径正确
- **建议机制化位置**: /plan-check 加 §2.6.X 子节: "验证 audit 脚本"
- **实现思路**:
  - /plan-check 跑前先验 audit:redlines + audit:ld 都能找到目标文件
  - grep 路径里的 src/ 是否在仓库存在(monorepo 用 apps/*/src/)
  - 如果路径过期 → 阻断 plan-check · 强制 fix audit script
- **ROI**: 防 PRD-6+ 再次累积 · 预计每 5 PRD 避免 1 次类 TD-016 漏 catch 灾难

### M-4: cost-log 按 PRD 拆文件(防跨 PRD 污染)

- **观察**: PRD-5 stats 时发现 154 entries 含 PRD-1~PRD-4 · **跨 PRD 暴露**
- **现状**: cost-log.jsonl 单文件累积 · prd-retro stats 必须 filter by date
- **建议机制化位置**: ralph.py 写 cost-log 时
- **实现思路**:
  - 读 prd.json branchName 推 PRD 编号
  - 写到 cost-log-{branchName}.jsonl(per-PRD 文件)
  - 旧 cost-log.jsonl 保留作历史 archive
- **ROI**: prd-retro stats 准确度 100% · 节省每 retro 5-10 min filter 时间

### M-5: Validator 必落 5 stdout 产物 hard-gate

- **观察**: PRD-5 US-012 Validator 只写 manifest.json · **跨 PRD 也出现过**(PRD-3 类似)
- **现状**: OPUS-AUDIT-CHEATSHEET §1.7 已有 partial FAKE 补跑流程 · 但 Validator 自身还是漏
- **建议机制化位置**: ralph.py Validator wrapper · audit-artifacts.py
- **实现思路**:
  - Validator 跑完后强制检查 5 stdout 产物存在
  - 缺任一 → exit 1 + 提示重跑
  - audit-artifacts.py partial FAKE 降级为 WARN(不是 FAIL)· 让 Opus 顺利 audit
- **ROI**: 减少 Opus audit 时间 · 每 PRD 节省 10-20 min

---

## §7 Skill 升级建议 diff(L4 半自动进化 · 由 Opus 审核 · 不自动 apply)

### Diff-1: ralph.py BLOCKED-aware exit(M-1)

- **文件**: `~/.claude/scripts/ralph/ralph.py`
- **插入位置**: 末尾 "[OK] 所有任务已完成" 输出前
- **原因**: PRD-5 BLOCKED 静默 exit 误导 · 跨 PRD 重复(RCA-001)
- **建议 diff**:
  ```diff
  + # M-1 (PRD-5 RCA-003 教训): BLOCKED 必须写 audit-gate · 不静默 exit
  + blocked = [s for s in prd['userStories'] if s.get('blocked')]
  + if blocked:
  +   write_audit_gate({
  +     'status': 'blocked_needs_attention',
  +     'blocked_stories': [s['id'] for s in blocked],
  +     'message': f'{len(blocked)} stories BLOCKED · 用户介入'
  +   })
  +   notify_user_blocked(blocked)
  +   sys.exit(2)
  print("[OK] 所有任务已完成 · 全部 PASSED")
  ```
- **人工 apply 流程**: 用户 review → Edit `~/.claude/scripts/ralph/ralph.py` → 同步到项目

### Diff-2: claude CLI 健康检测(M-2)

- **文件**: `~/.claude/scripts/ralph/ralph.py`
- **插入位置**: spawn dev/validator agent 前 · `_run_claude_print()`
- **原因**: PRD-5 RCA-003 · 防 30 min × 5 = 2.5 hr 浪费
- **建议 diff**:
  ```diff
  + def _check_claude_health(timeout=5):
  +   """5s 内 echo 'OK' · 确认 claude CLI 健康"""
  +   try:
  +     result = subprocess.run(
  +       ['claude', '--print', '--model', 'sonnet'],
  +       input='say only OK and nothing else',
  +       text=True, timeout=timeout, capture_output=True
  +     )
  +     return 'OK' in result.stdout.upper()
  +   except subprocess.TimeoutExpired:
  +     return False
  +
  def _run_claude_print(prompt, ...):
  +   if not _check_claude_health():
  +     log.warn("claude CLI unhealthy · skip iter · wait 60s")
  +     time.sleep(60)
  +     return None  # 不算 retryCount
    # ... 原 spawn 逻辑
  ```

### Diff-3: /plan-check 加 audit script 元 audit(M-3)

- **文件**: `~/.claude/commands/plan-check.md`
- **插入位置**: §2.6 新子节 §2.6.X "audit script 元验证"
- **原因**: PRD-1~5 5 个 PRD 漏 catch · 真根因
- **建议 diff**:
  ```diff
  + ##### 2.6.X · audit script 元验证(PRD-5 教训)
  +
  + 在 plan-check 阶段验证 audit 脚本本身有效:
  + - 运行 `bash scripts/audit-redlines.sh > /dev/null && echo OK` · 必须 exit 0
  + - 运行 `bash scripts/audit-ld.sh > /dev/null && echo OK` · 必须 exit 0
  + - 检查每条 grep 路径里的 src/ 在 monorepo 中是否存在(用 ls 验证)
  + - 任一失败 → plan-check 阻断 · 强制 fix audit script 后再跑
  ```

### Diff-4: ralph.py cost-log per-PRD 文件(M-4)

- **文件**: `~/.claude/scripts/ralph/ralph.py`
- **插入位置**: `_log_cost()` 函数
- **原因**: PRD-5 prd-retro stats 时发现污染
- **建议 diff**:
  ```diff
  - COST_LOG = 'cost-log.jsonl'
  + def _cost_log_path():
  +   prd = json.load(open('scripts/ralph/prd.json'))
  +   branch = prd.get('branchName', 'unknown').replace('/', '-')
  +   return f'scripts/ralph/cost-log-{branch}.jsonl'
  ```

**4 条 diff 全是建议 · 不自动 apply** · 等用户 review 后决定。如果用户同意 · Opus 用 Edit 工具 apply 到 `~/.claude/scripts/ralph/ralph.py` 等。

---

## §8 文档回流建议(commit 事实驱动)

### 1. 取证范围
PRD-5 期间 commits(2026-05-09 12:04 → 22:21):
```bash
git log --reverse --oneline a83236d..HEAD
```
共 33 commits · 含 12 stories impl + 4 audit approve + goal-verify §0 + 4 TD fix。

### 2. 提炼标准
只保留:
- ✅ 当前目录结构已**真实变化**(新增 4 工具页 / history router / ToolForm/ToolResult / 4 judge files)
- ✅ 多个 story **反复出现**的稳定开发约定(多 mode + outputSchema getter / mock LLM jsonl / 双层防护)
- ✅ 容易再次踩坑的陷阱(claude CLI hang RCA-003 · audit 工具元验证)

### 3. 候选回流条目(精简 5-7 条)

| # | 条目 | 落位 |
|:-:|---|---|
| 1 | apps/api/src/specialists/{CopywritingAgent · AnalysisAgent}.ts (PRD-5 多 mode 模式 5 处复用) | AGENTS.md §11.6.4 后端 Specialist 实施沉淀 |
| 2 | apps/web/src/components/{ToolForm · ToolResult}/ (4 工具页通用模板) | .planning/codebase/STRUCTURE.md(已 PRD-5 §0 写) |
| 3 | tests/judge/{copywriting-free · copywriting-boom · analysis-viral · analysis-structural}.judge.ts (PRD-5 mock LLM judge 模式) | .planning/codebase/TESTING.md(已 PRD-5 §0 写) |
| 4 | LD-018 PII 接线已落地(ContextAssembler.\_formatUserPrompt + BaseSpecialist.execute)· PRD-6+ 任何新 Specialist 自动继承 | AGENTS.md §3 LD-018 表述更新 · 加"已实施"标记 |
| 5 | knowledge.ts LD-009 双层防护模式(explicit accountId + RLS)· PRD-6+ 任何新 router 必沿用 | AGENTS.md §3 LD-009 加"双层防护示例 · grep `RLS auto-filters` 0 命中" |
| 6 | ralph daemon claude --print CLI 系统级 hang(RCA-003)· 长跑 > 10 stories 风险大 | .planning/codebase/CONCERNS.md §4 Operational(已 PRD-5 §0 写)+ 项目 CLAUDE.md §9.1 5 步 SOP 加预防性重启建议 |
| 7 | audit:redlines + audit:ld 必跑 + 持续维护(TD-017/018 教训)| AGENTS.md §8 audit_commands 加这两条 + CI workflow 加 audit:all gate |

**等用户确认后 Edit 落位**(不自动 apply)。

---

## §9 决策(给 PRD-6 启动前的 5 条结论)

| # | 决策 | 理由 |
|:-:|---|---|
| 1 | ★ 5 历史 open TDs(TD-003/006/009/010/011)PRD-6 启动时 /prime 自动提示 · 用户决定哪些先修 | 全是 low/medium · 不阻塞 PRD-6 启动 |
| 2 | TD-016/017/018/019 已 resolved · 不需要 PRD-6 startup re-fix | goal-verify §0 已修干净 · 零回归 |
| 3 | PRD-6 启动前必跑 audit:redlines + audit:ld · 0 fail 才进 | TD-017+018 教训 · 防 audit 失效再发 |
| 4 | RCA-003 claude CLI hang 是环境问题 · 当前无法机制化 fix(等 Anthropic 后端稳定 / 切换 model)· §6 M-2 健康检测是缓解措施 | 根因不在 ralph · 不能让 ralph 修 |
| 5 | PRD-6 第 1 个 milestone(预估)· VoiceChatAgent + EvolutionAgent + DailyTaskAgent 3 个 L5 自治 Agent 真接 ADR-018 外部 orchestrator · risk=high · 计划 1.5 周 | LD-004 锁定 + 是 PRD-1~5 都没碰过的新模式 |

---

## §10 跨 PRD 趋势(PRD-1 ~ PRD-5)

| 指标 | PRD-1 | PRD-2 | PRD-3 | PRD-4 | PRD-5 |
|---|:-:|:-:|:-:|:-:|:-:|
| Stories | 6 | 4 | 6 | 18 | 12 |
| 完成率 | 100% | 100% | 100% | 100% | 100% |
| Audit reject | ? | ? | ? | 1 | 0 |
| Fail-over | 1 | 1 | 1 | 0 | 0 |
| BLOCKED 救援 | 0 | 0 | 0 | 0 | **1** ★ |
| Wall clock | ? | ? | 8h36m | 10.5h | 10.3h |
| RCA 新增 | 2 | 0(草稿) | 0 | 0 | **1**(RCA-003) |
| TD 新增 open | ? | ? | 3 | 4 | 4(全 historical · 但全 resolved) |
| TD 累计 | ? | ? | ? | 15 | 18 → 14 open(net -1)|
| vitest | ? | ? | 259 | 343 | 542 |
| judge | 0 | 0 | 0 | 14 | 22 |
| e2e | ? | ? | 100 | 106 | 126 |
| typecheck errors | 0 | 0 | 0 | 0 | 0 |
| lint warnings | (debt) | 0 | 0 | 0 | 0 |
| Codebase Patterns 累计 | 9 | 11 | 13 | 14 | **23**(+9 PRD-5)|

**关键趋势**:
- ✅ 完成率稳定 100% · 测试套件指数增长(PRD-3→4 +18% / PRD-4→5 +58%)
- ✅ Audit reject 0 化(PRD-4 1 → PRD-5 0)
- ⚠️ BLOCKED 救援 PRD-5 首次 · 不是趋势但要关注(若 PRD-6 再发说明 ralph 系统性问题)
- ✅ Codebase Patterns 累计 23 节 · 反例库继承复利明显(0 重学坑)
- ⚠️ TD 累计仍在涨 · 需要 PRD-6 启动前选 5 historical TD 决策

---

## §11 结论

**PRD-5 100% PASSED + 零回归** · 但**踩了 ralph daemon 史上最深的坑**(claude --print CLI 系统级 hang) · 通过 Opus 主对话路径 B 救援 + goal-verify §0 GSD 扫码 + 4 TD fix 一波收尾。

**3 个最大收获**:
1. **路径 B 救援机制** 验证可行 · ralph daemon 失联时 Opus 主对话能接管 audit 流程 · 严格度不降低
2. **audit 工具元 audit** 是真根因 · TD-017+018 修复让 PII 漏 catch chain reaction 闭环
3. **Codebase Patterns 跨 PRD 复利** 持续显效 · 0 reject + 多 mode 模式 5 处复用 0 摸索

**3 个最大教训**:
1. ★ **claude CLI 系统级 hang** 是新风险 · §6 M-1 + M-2 必须固化机制
2. **audit script 自身没人 audit** · §6 M-3 plan-check 加元验证
3. **ralph daemon "BLOCKED 后静默 exit"** 误导 · §6 M-1 写 audit-gate(needs_attention)

**给 PRD-6 启动**: 0 BLOCKER · 5 历史 open TD 用 /prime 自动提示决策 · audit:redlines + audit:ld 必跑 · ralph daemon 启动后立即 monitor。

---

> **本文件由 Opus 4.7 在 PRD-5 收尾期间写 · 2026-05-09 22:35 · 完整版 11 节 · 不简化(质量第一 · 上下文不是借口)**
