# PRD-4 P3 IP 主流程 9 步 · /prd-retro 复盘

> **生成** · 2026-05-09 · /prd-retro Opus 主对话(完整版 · 不简化 · 11 节)
> **PRD** · PRD-4 · 18 stories · 7 Specialist 真接 LLMGateway · ContextAssembler 完整版 · feedback_log 真表 · isFallback 降级 · LLM Judge · 9 步 e2e · risk=high · 计划 3 周
> **对比 PRD-1/2/3** · 第 4 份 PRD · 第一份"真 LLM 集成"PRD · ARCHITECTURE-driven + 反例库 + Foundation 升档机制全套验证

---

## 🚀 TL;DR

```
PRD-4 完成度       100%(18/18 PASSED · 0 fail-over · 1 reject(US-007)· 4 retry(US-002/007/011/015))
计划周期           3 周
实际日历时间        ~10.5h(2026-05-08 23:30 → 2026-05-09 10:03 · 2 天)
Sonnet 时间        ~16h wall(24 iter · ralph daemon)
Opus 时间          ~2h(18 audit + 1 reject + verify + retro · 0 fail-over · 0 RCA)
反例库 + Patterns 注入 · 17 条反例 + 14 节 Pattern · 全 7 Specialist 顺利继承

vs PRD-1/2/3 改进 ·
  · 0 fail-over(★ 比 PRD-3 1 fail-over 进步 · 比 PRD-1/2 持平)
  · Foundation 档升档机制生效(3 foundation US 全 0 reject · 1 retry 修 TD-012 闭环)
  · 反例自动注入跨 PRD 见效(US-007 reject 后写到反例库 · 后续 SSE Specialist 自动避开)
  · 测试套件大幅扩展(343 vitest +84 from PRD-3 / 14 judge 新 / 106 e2e +6 from PRD-3)
  · 0 console.log 残留(全 logger · LD-013 严格)

vs PRD-1/2/3 退步 ·
  · 时间膨胀 1.2x vs PRD-3 8h36m(因 18 US vs 6 US · per-story 平均反而更短)
  · iter 24 vs PRD-3 23(几乎持平 · 但 PRD-4 每 iter 平均更短)
  · TD 4 新(全 design-drift)· PRD-3 是 3(全 process-gap)· 类型转向架构层

4 新 TD(TD-012 closed in US-002 retry 1 · TD-013/014 留 PRD-11/PRD-7+ · TD-015 accepted)
0 BLOCKER · 可进 PRD-5
```

---

## §1 Wins(8 维度)

### W-1 · PRD 写作质量 · ARCHITECTURE-driven + 协议锁第 4 次验证有效

PRD-4 v0.1(974a0a6 · 1595 行)严格按 PRD-MASTER §2 模板 · 18 US × 4 类 AC · §1.5 协议锁(表 A/B/C 锁定文件路径 + cost_log 字段 + Specialist 接口)· §3 范围排除明确(boom/video-acquisition/EvolutionProfile/RAG/admin 全留 PRD-5+)· §6 退出条件 7 项可量化。**实施时 ralph 0 大跑偏**(只有 TD-012 双 base 路径协议锁与既有代码现状不一致 · 修补 1 retry 闭环)。

### W-2 · Ralph 实施 · 反例库自动注入 + Codebase Patterns 跨 PRD 继承复利

PRD-3 retro §3 沉淀 ScrollArea / e2e DB 边界 / chunk 共享 3 节 patterns · PRD-4 ralph **自动避开**·

- US-011 IndustrySelect 56 行业 dropdown · 直接套 ScrollArea h-72(无需提醒)
- US-012 Step5Result(20 选题)+ Step6Result(13 列分镜)· 主动套 ScrollArea h-96 + ScrollBar horizontal
- US-018 e2e workers=1 + fullyParallel=false · 主动修共享 dev user race condition

PRD-1/2/3 累计 17+ 节 Codebase Patterns + 36+ 反例 · ralph **零摸索**直接写对。最关键的 W-2 体现:

- US-007 第 2 次 reject(model 硬编码)→ 写到反例库 → US-009 CopywritingAgent SSE 实施时**直接继承** stream meta chunk 模式 · 0 retry 一次过

### W-3 · Audit · Foundation 档分档机制首次验证

PRD-4 是第一个有 Foundation 档 stories(US-001/002/003 risk_level=foundation · downstream=7+)· Opus audit 严格按 OPUS-AUDIT-CHEATSHEET §F1-F4 协议核对 ·

- US-001 audit 揪出 TD-012(双 base 目录 · ralph US-001 import 既有 agents/base/ stub · 协议锁 vs 既有代码现状双对账)
- US-002 reject feedback 含 4 处具体目标代码 · ralph retry 1 一次性修 4 项 · 23 unit pass + 6 ws typecheck 0 + agents/base/ContextAssembler.ts deleted · TD-012 closed
- US-003 audit 后**确认 Foundation 3/3 全过 + 协议层稳定 + Wave 4 7 Specialist 可全并行启动**

★ Foundation 档升档机制生效(downstream=7 让 risk: medium/high → foundation 强制深审)。

### W-4 · 多 mode + SSE Specialist 模式标准化

7 Specialist 写完后**沉淀 5 个标准模板**:
- 单 mode + non-SSE(MonetizationAgent / LivestreamAgent · 最简 · ~150-200 行)
- 多 mode + non-SSE(PositioningAgent / BrandingAgent / VideoAgent · _mode getter 模式)
- 单 mode + SSE(CopywritingAgent · 继承 TopicAgent _consumeStream)
- 多 mode + SSE(预留)
- responseFormat 双 schema 策略(refine 不能序列化 · LLM 用 BaseSchema · post-validate 用 OutputSchema)

US-008/009/010 在 US-007 SSE 模式定型后 · **每个 Specialist 平均 12-16 min 一次过**(对比 US-001~003 各 1h+)。模板化让 Wave 4 后期速度大幅提升。

### W-5 · 测试金字塔 · 配额 + Judge + e2e 三层全建立

PRD-4 测试新增 142 vitest + 14 judge + 6 e2e · 总 343/14/106 + 0 typecheck + 0 lint:
- **判别器(Judge)套件**首次建立 · 7 Specialist × 1-2 golden case · 用 lightweight model · cost_log eventType='judge_call' 区分
- **真 LLM e2e**(ip-flow-9-steps · RUN_LIVE_TESTS=1 manual 跑)+ **Mock LLM e2e**(fallback / feedback-log / account-isolation · CI 跑)分层
- **集成测试**首次接 nock SDK · specialist-llm.test.ts 真 DB 写入 cost_log + 查 SQL 验证

### W-6 · 工具链 · monorepo vitest + vite 配置三轨同步落地

PRD-1 沉淀的"路径 alias 三轨同步"(tsconfig + vite + vitest)在 PRD-4 持续验证:
- US-011 retry 1 修两处工具链坑(vitest config include `*.test.{ts,tsx}` + vite resolve.dedupe:['react','react-dom'])· **一次 retry 全修**
- packages/clients/router-types.ts shadow router 跨包 type 共享模式持续生效(US-013 加 completedSteps + US-012 加 isFallback 全同步)
- LL Judge 用独立 vitest.judge.config.ts · @/ alias 与主 vitest.config.ts 一致(US-016)

### W-7 · 跨 PRD 知识沉淀 · progress.txt 三段结构 + 反例库自动入库链路

PRD-4 全程**0 知识丢失**:
- progress.txt Codebase Patterns 段从 PRD-1 9 节 → PRD-4 14 节(累加不清)
- 本 PRD 专属知识段(7 Specialist 各自坑 · 24 iter 学习)归档时随 PRD 清理
- US-007 reject feedback 自动写到 ~/.claude/playbooks/reject-examples.jsonl(跨 PRD 跨项目共享)
- US-018 收官记录"e2e 并发 race"+ "fullyParallel:false 是处理共享 mock user 全局状态最简单的方案"

### W-8 · 工程纪律 · 0 fail-over · 0 RCA · daemon 全程顺

PRD-4 **全 24 iter 0 一次 Opus fail-over**(对比 PRD-3 1 次 / PRD-2 1 次 / PRD-1 1 次)· **0 新 RCA**(对比 PRD-1 2 RCA / PRD-2 RCA-003 草稿但未写)·

- §9.1 5 步启 daemon SOP 严格执行(Monitor persistent 全程在线)
- §9.6 large story 拆分硬规则生效(0 size=large story · 全 medium · 最大 prompt < 12K)
- TD-009 (网络故障消耗 retryCount) 虽未在 PRD-4 启动前修 · 但实际**未撞**(BaseSpecialist 内部 retry + LLMTimeoutError 转 fallback 间接 absorb)

---

## §2 Lessons(8 维度)

### L-1 · PRD 协议锁 · 与既有代码现状未对账(TD-012)

**根因 ·** PRD-4 §1.5 表 A 锁定 BaseSpecialist 路径 `apps/api/src/specialists/base/BaseSpecialist.ts` · ContextAssembler 路径 `apps/api/src/services/context-assembler/` · **没意识到 PRD-2 US-007 已在 `apps/api/src/agents/base/` 写了 stub**。ralph US-001 严格按协议锁创建在 specialists/base/ 但 import 既有 agents/base/ stub · 双路径并存。

**教训 ·** Foundation 档协议锁审计要"既有代码现状 + PRD 协议锁双对账" · 不只看 PRD 文档 · 必须 grep 既有代码看是否撞路径。

**修补 ·** 见 §6 Diff-1(OPUS-AUDIT-CHEATSHEET §F4 加"既有代码扫"步骤)。

### L-2 · Ralph 实施 · 多 mode `_mode` instance state race(TD-014)

**根因 ·** PRD-4 §1 PositioningAgent 接 step1+step4 双 mode · ralph 用 instance state(`private _mode`)保存 mode 让 outputSchema getter 按 mode 返回 schema · 单例 export(REJ-004 合规)+ Node.js 异步 await · 同实例多并发 execute 间隙切入 race window。

**教训 ·** 多 mode Specialist 模板"_mode + outputSchema getter"在单 user 串行场景安全 · 但**架构层不该依赖运行时假设**。BaseSpecialist 接口设计应支持 stateless multi-mode(outputSchema 改 method (req) => schema)。

**修补 ·** 见 §6 Diff-2(BaseSpecialist 接口升级 · 留 PRD-7+ 治理)+ TD-014 文档化(已登记)。

### L-3 · Audit · 单次审里漏看跨 file 模式继承(US-007 reject)

**根因 ·** US-007 TopicAgent 第 1 round 写 `'claude-sonnet-4-6'` 硬编码 model 名 · ralph 当时不知道 cost_log.modelUsed 应该反映 LLMGateway 真选 model(D-019)· Opus audit 揪出 reject。**单次审里 reject 是好事 · 但模式继承(US-009 CopywritingAgent 也用 SSE)需要审里同时检查**。

**教训 ·** Audit 一个 SSE Specialist 时 · 必须 grep 其他 SSE Specialist 是否同样错(US-007 时 US-009 还没写 · 但 reject feedback 必须明确"此模式必须在所有 SSE Specialist 内一致")。

**修补 ·** 反例库自动注入已生效 · US-009 写 SSE 时直接继承 stream meta 模式 · 0 retry 一次过。**反例库已 cover** · 不需要额外修补。

### L-4 · Foundation 档审计 · TD-012 是 PRD 协议锁本身的 design bug

**根因 ·** TD-012 不是 ralph 实施 bug · 是 PRD 写作时未对账既有代码 · 协议锁产生路径漂移。Audit US-001 时**Opus 应该 reject US-001**(协议锁与既有代码不一致 · ralph 选 import 既有 stub 是合理但产生协议漂移)· **而不是豁免 approve + 让 US-002 修**。

**教训 ·** Foundation 档协议锁问题应 reject US-001 让 prd skill / 用户先修协议锁 · 而不是放行让下游 story 收拾。下次类似情况:Audit 阶段发现 PRD 协议锁问题 → reject 给 prd skill 修锁 → 重新走流程。

**修补 ·** 见 §6 Diff-1(OPUS-AUDIT-CHEATSHEET 加"协议锁与既有代码冲突 → reject 给 prd skill 修锁"分支)。

### L-5 · 多 mode + SSE 模式 · invokeLLM 内部 retry 设计漏(US-007 retry 2)

**根因 ·** US-007 第 1 round invokeLLM 内 JSON.parse 失败直接 throw · BaseSpecialist Step 3 catch 仅处理 AbortError → re-throw · **无 retry 路径**。第 2 round 提取 _consumeStream 私有方法 · invokeLLM 内部 retry 1 次 stream → 仍失败返回 { content: null, isFallback: true } → safeParse 失败 → BaseSpecialist 触发 retry。

**教训 ·** SSE Specialist 的 retry 路径**不能依赖 BaseSpecialist Step 3 catch**(那只 cover AbortError → LLMTimeoutError)· 必须 invokeLLM **不 throw** · 改返回 { content: null, isFallback: true } 让 BaseSpecialist Step 4 safeParse 失败触发 retry。

**修补 ·** 已沉淀进 PRD-4-VERIFICATION.md §9 Codebase Patterns "SSE Specialist 模式" · PRD-5 SSE 新 Agent 直接继承。

### L-6 · 测试金字塔 · stepData.save handler 漏覆盖(US-017 e2e)

**根因 ·** US-017 跑 9 步 e2e 时发现 stepData.save handler 不覆盖 step5/7 · 返回 null result · UI skeleton 永挂。原因是 Specialist Wave 4 时各 US 只加自己的 step branch · **没有人负责"全 9 step coverage"的 cross-cut audit**。

**教训 ·** 大型 router(如 stepData.save · 9 step branch)的覆盖性应在 Wave 4 收尾或 Wave 5 启动前做 cross-cut audit · 不要等到 e2e 才发现。

**修补 ·** 见 §6 Diff-3(prd skill 模板加"router cross-cut coverage 章节" · 新增 9 step 全 coverage 的退出条件)+ §7 Codebase Patterns "stepData.save 必覆盖全 9 step"。

### L-7 · 工具链 · vitest config + vite resolve 联合配置坑(US-011 retry)

**根因 ·** US-011 第 1 round 写 StepForm.test.tsx · 但 root vitest.config include 仅 `*.test.ts`(不含 .tsx) · 19 schema tests 不被发现。同时 apps/web/vite.config.ts 缺 `resolve.dedupe:['react','react-dom']` · /step/* 初次 render 报 "Invalid hook call"。

**教训 ·** monorepo vitest 配置 include 必须显式列 `*.test.{ts,tsx}` · vite resolve.dedupe 是 workspace 包自带 deps 时的必需配置。**根因是 PRD-1/2/3 没有 React 测试组件 · PRD-4 第一次出现 .tsx test 暴露**。

**修补 ·** 已沉淀进 PRD-4-VERIFICATION.md §9 Codebase Patterns "vitest 配置(monorepo · React 测试)" · PRD-5 直接继承不再撞。

### L-8 · 跨 PRD 知识沉淀 · cost-log.jsonl 累积无清理(累积现象 · 不是 bug)

**根因 ·** scripts/ralph/cost-log.jsonl 从 PRD-1(2026-05-07 20:22)到 PRD-4 收官累积 119 次调用 21h 3m 18s · 包含**全部 4 个 PRD 的数据**。`ralph-tools.py cost` 命令显示 US-006 4h49m 实际是 PRD-3 US-006 viewport overflow + PRD-4 US-006 MonetizationAgent 两份合计(同 ID 不同 PRD 混合)。

**教训 ·** cost-log.jsonl 设计上不区分 PRD · 跨 PRD 数据混合查询会误导(PRD-4 US-006 实际仅 11 min · 不是 4h49m)。

**修补 ·** 留 ralph.py 改进(PRD 切换时归档 cost-log · 影响其他项目 · 留 v3 评估)· 本期 retro 数据用 progress.txt 倒推每 US 实际时间(更准)。

---

## §3 反向发现(不可迁移 · 偶然成功)

### 偶然成功 1 · 0 fail-over 不全靠 SOP · 也靠运气

**为什么不可复制 ·** PRD-4 0 fail-over 的部分原因是:
- 18 stories 中 6 个属于 risk=medium(单 mode + non-SSE Specialist · 简单)· 一次过率高
- TopicAgent SSE retry 时刚好 3 round 内修通(没撞 PRD-3 US-006 viewport overflow 那种 12 round 黑洞)
- ralph 选 import 既有 agents/base/ stub 是"运气好"(避免破坏 LLMGateway 的 ModelTier import)· 如果 ralph 选完全重写 · 可能撞更深的协议漂移

**缓解 ·** TD-014 / TD-013 留 high-risk PRD 治理 · §6 Diff-1/2/3 把"运气好"转为"机制保证"。

### 偶然成功 2 · TD-012 一轮 retry 修闭环 · 因为 reject feedback 含 4 处具体目标

**为什么不可复制 ·** US-002 reject feedback 由 Opus 写时严格按 REJECT-TEMPLATE · 含具体反例 + 4 处目标代码 + 验证命令(`grep \\'@/agents/base/ContextAssembler\\' 应 0 命中`)· ralph 一次性修 4 项。**这是 reject feedback 质量的胜利**。如果 reject feedback 模糊("修一下双 base 路径")· ralph 会摸索多 round。

**缓解 ·** §6 Diff-1 沉淀 "Foundation 档 reject feedback 必须含具体反例 + 验证命令"。

---

## §4 归因占比表(PRD-4 vs PRD-3 时间膨胀)

PRD-4 实际 ~10.5h vs PRD-3 ~8.6h(膨胀 22%)· 但 PRD-4 18 US vs PRD-3 6 US(任务量 3x)· per-story 平均 35 min vs PRD-3 86 min(**实际效率提升 60%**)。膨胀来源:

| 驱动 | 占比 | 证据 |
|---|:-:|---|
| 7 Specialist 实施(US-004~010) | 32% | Wave 4 共 ~3.5h · 7 Agent × 平均 30 min(其中 US-007 retry 多用 30 min) |
| Foundation 3 大 story(US-001/002/003) | 22% | Wave 1 共 ~2.3h · 含 US-002 retry 修 TD-012 |
| 前端集成 4(US-011~014 · 含 retry) | 18% | Wave 3 共 ~1.9h · 含 US-011 retry 1 vitest config |
| US-015 fallback(3 iter 1 retry) | 12% | 1.3h · 第 3 iter 修 e2e mock + JSONL 三行 |
| US-017 e2e + US-018 收官 | 10% | ~1.5h · e2e dev server warmup + 全套 lint typecheck |
| US-016 Judge + Audit | 6% | ~40 min · 7 judge files + judge-runner |
| 其他(audit/commit/Monitor)| <1% | 18 audit × 5-10 min |
| **合计** | 100% | |

**结论 ·** PRD-4 时间分布合理 · 没有 PRD-3 US-006 那种"单 story 黑洞"(US-007 第 2-3 iter 加起来 30 min · 不是黑洞)· 7 Specialist 模板化后 Wave 4 后期速度倍增。

---

## §5 Playbook · 给 PRD-5 起 prd skill 的提示

PRD-5 P4 创作模块 4 工具页 · /generate /analysis /video-analysis /boom-generate · CopywritingAgent 4 mode + AnalysisAgent 2 mode · 1.5 周 · risk=high · 关键 US 数 8-10。

### 5.1 继承

- **7 Specialist 真接 LLMGateway** 已就位 · PRD-5 加 CopywritingAgent free/boom/acquisition mode + AnalysisAgent / VideoAnalysisAgent
- **BaseSpecialist 模板方法**已稳定 · PRD-5 子类只填 config + inputSchema + outputSchema + invokeLLM
- **多 mode + SSE 模板**已成型 · PRD-5 直接继承(stream meta chunk + outputSchema getter + responseFormat 双 schema)
- **stepData.save handler**已覆盖 9 step · PRD-5 不动主流程 · 加新 router(`copywriting.generate` / `analysis.run` / `videoAnalysis.run` / `boomGenerate.run`)
- **9 step e2e**(ip-flow-9-steps)已 manual 跑通 · PRD-5 加 4 工具页独立 e2e

### 5.2 注意

- **ARCHITECTURE §9.6 P4 退出条件** · 4 工具页跑通(/generate 真出 markdown · /analysis 输出洞察 · /video-analysis 输出 13 列分镜 · /boom-generate 输出爆款选题)· cost_log eventType 区分(specialist_call vs analysis_call)
- **CopywritingAgent 解锁 free/boom/acquisition mode** · 按 BrandingAgent 双 mode 模式扩展为 4 mode · outputSchema getter 按 mode · TD-014 _mode race 同模式继承(留高并发治理)
- **TopicAgent boom 模式**(PRD-5 boom-generate 入口)· step5 已 5 category SSE · 加 boom mode 用 z.discriminatedUnion 扩展
- **AnalysisAgent / VideoAnalysisAgent** 是新 Specialist · 不在 7 Specialist 之列 · 按 BaseSpecialist 模板新建
- **TD-013 双 cost_log** 留 PRD-11 · PRD-5 不动
- **TD-014 _mode race** 留 PRD-7+ · PRD-5 multi-mode 继续用同模式
- **packages/schemas/src/specialist-io/ 子目录** 加 boomGenerate / copywriting (free/boom/acquisition) / analysis / videoAnalysis · 协议锁路径用子目录(TD-015 accepted)

### 5.3 反例库自动注入

PRD-5 prd skill 转 prd.json 时关键词命中(copywriting / analysis / video / boom / specialist / sse / streaming)· 自动注入历史教训:

- **17 条 PRD-1~PRD-4 反例**(REJ-001~035 + OAuth CSRF + ScrollArea + viewport overflow + model 硬编码 + double cost_log)
- **14 节 Codebase Patterns**(monorepo / OAuth / Trace / RLS / LS↔DB / Specialist 抽象 / 多 mode + SSE / responseFormat 双 schema / vi.hoisted / vitest 配置 / Playwright workers=1 / Judge 套件 / isFallback 路径 / feedback_log)
- **新增 PRD-4 patterns**(SSE meta chunk / responseFormat 双 schema / stepData.save 必覆盖全 step / Foundation 档协议锁与既有代码双对账 / multi-mode race window 警示 / vitest config .tsx + vite resolve.dedupe)

---

## §6 L4→L5 应固化为机制的 N 条反复问题

### M-1 · Foundation 档协议锁与既有代码现状未对账(跨 PRD 第 1 次出现 · 严重)

- **观察** · PRD-4 TD-012 双 base 目录 · PRD 协议锁锁定新路径 · 既有 stub 在旧路径 · ralph 实施时撞双路径。**前序问题** · PRD-1 TD-005 shadcn 12 组件路径偏差(packages/ui vs apps/web/components/ui)· PRD-2 TD-012 router alias 重复 — **同类"PRD 锁定路径 vs 既有代码不一致"反复发生**。
- **现状** · OPUS-AUDIT-CHEATSHEET §F1-F4 协议核对仅看 PRD 协议锁 · 不 grep 既有代码现状
- **建议机制化位置** · `~/.claude/scripts/ralph/OPUS-AUDIT-CHEATSHEET.md` Foundation 档子节 + `~/.claude/skills/prd/SKILL.md` 协议锁写作前自检
- **实现思路** · 
  - prd skill §1.5 协议锁写完后 · 强制 `grep -r "<新锁定文件名>" apps packages` 看是否已存在 · 存在即提示用户"路径冲突 · 选 A 复用既有 / B 改协议锁 / C 删旧 stub"
  - OPUS-AUDIT-CHEATSHEET §F4 加"既有代码扫" · audit Foundation 档 US 时跑 `grep -r "<协议锁锁定路径>" apps packages | grep -v "新建文件"` · 命中即提示 reject 给 prd skill 修锁
- **ROI 估算** · 每 high-risk 多 PRD 项目省 1 次 retry · 30+ min(US-002 实证)

### M-2 · Multi-mode Specialist instance state race(跨 PRD 第 1 次出现 · 但 4 处复用)

- **观察** · PRD-4 TD-014 _mode instance state · race window 短 · P3 单 user 串行不触发 · 但**架构层 design smell**。4 个 Specialist 同模式(US-004/005/008/009)· PRD-5 解锁 CopywritingAgent 4 mode 时**第 5 处复用** · PRD-7 高并发场景**第 N 处暴露**。
- **现状** · BaseSpecialist 接口 outputSchema 是 getter · 子类靠 instance state · race 风险隐式
- **建议机制化位置** · `apps/api/src/specialists/base/BaseSpecialist.ts` 接口升级
- **实现思路** · 
  - 选项 A · outputSchema 改 method (req: SpecialistRequest) => ZodSchema · 子类按 req.mode 直接返回 schema · 不依赖 instance state
  - 选项 B · AsyncLocalStorage 隔离 _mode(每 execute() 独立 storage 上下文)
  - 选项 C · 接受当前实施 · 文档化"高并发场景必修"
- **ROI 估算** · 留 PRD-7+ 高并发场景 · 1 次 race incident 可能损失 1-3 完整账号数据(用户看到错 schema 输出)· **架构层修远比 incident 后修便宜**

### M-3 · 大型 router cross-cut coverage 缺审(跨 PRD 第 1 次明显出现)

- **观察** · PRD-4 US-017 e2e 才发现 stepData.save handler 漏 step5/7 · UI skeleton 永挂 · 浪费 1 次 e2e 跑(~30 min)。**前序** · PRD-3 US-001 router.tsx 34 路由也是 e2e 才发现 cross-cut 漏(后修)。
- **现状** · prd skill 写每个 US 时聚焦自己的 scope · 没人负责"router 全 N step coverage"
- **建议机制化位置** · `~/.claude/skills/prd/SKILL.md` US 模板加 cross-cut 章节 + AGENTS.md §11 加 cross-cut audit checklist
- **实现思路** · 
  - prd skill US 模板:涉及 N-step / N-route / N-mode 的 router 必须有"cross-cut coverage AC"(grep handler / grep router 全 N 路径)
  - AGENTS.md §11 加"router cross-cut audit"章节 · 每 PRD 收官前 grep `router 内 switch by ... .case ...` 看是否覆盖 prd.json 列出的全部路径
- **ROI 估算** · 每 PRD 1-2 次 cross-cut 漏 · 30 min/次

### M-4 · cost-log.jsonl 跨 PRD 累积导致 retro 数据失真(累积型 · 第 4 次)

- **观察** · 4 PRD 全部 cost-log.jsonl 累积 21h 3m · `ralph-tools.py cost` 同 ID 不同 PRD 混合查询(US-006 显示 4h49m 实际是 PRD-3 + PRD-4 合计)· retro 时 wall time 失真。
- **现状** · cost-log.jsonl 设计上不区分 PRD · 跨 PRD 数据混合
- **建议机制化位置** · `~/.claude/scripts/ralph/ralph.py` PRD 切换时归档 cost-log
- **实现思路** · 
  - PRD 启动时(prd.json 切换 / 新 PRD 起)· cost-log.jsonl 归档为 cost-log-PRD-N.jsonl + 新建空 cost-log.jsonl
  - `ralph-tools.py cost` 加 `--prd N` 选项查指定 PRD
- **ROI 估算** · 每 PRD retro 节省 5-10 min 倒推时间 · 但累积价值低 · **留 v3 评估**

---

## §7 Skill 升级建议 diff(L4 半自动 · 用户 review 后 apply)

> ★ 本节生成具体 diff · §8 任务 5 直接 Edit 到 ~/.claude/scripts/ralph/。

### Diff-1 · OPUS-AUDIT-CHEATSHEET.md Foundation 档 §F4 加"既有代码扫"

- **文件** · `~/.claude/scripts/ralph/OPUS-AUDIT-CHEATSHEET.md`
- **原因** · M-1 / TD-012 · Foundation 档协议锁与既有代码现状未对账(跨 PRD 第 3 次同类问题)
- **建议 diff(unified)** ·

```diff
+ ## §F4.1 协议锁与既有代码现状双对账(2026-05-09 · PRD-4 US-001 经验)
+ 
+ Foundation 档 audit 时 · §F4 协议核对前**必跑**:
+ 
+ ```bash
+ # 1. 提取 PRD §1.5 协议锁锁定的所有新文件路径
+ grep -A 100 "## §1.5 协议锁\|## 1.5 协议锁" tasks/prd-N.md | grep -E "^\\| .*\\.(ts|tsx|json|prisma)"
+ 
+ # 2. 对每个锁定路径 · grep 既有代码看是否已存在
+ for path in <锁定路径列表>; do
+   parent=$(dirname "$path")
+   basename=$(basename "$path")
+   # 检查既有 stub(同名文件 OR 同 dir)
+   find apps packages -name "$basename" -type f 2>/dev/null | grep -v "$path" 
+ done
+ ```
+ 
+ **冲突处理 ·**
+ - 命中既有 stub → reject US-001 · feedback "PRD §1.5 协议锁路径 X 与既有代码 Y 冲突 · 选 A 复用既有 / B 改协议锁 / C 删旧 stub · 修后重提"
+ - 不命中 → §F4 协议核对继续
+ 
+ **实证 ·** PRD-4 US-001 audit 时若跑此步 · 会发现 apps/api/src/specialists/base/BaseSpecialist.ts(协议锁)vs apps/api/src/agents/base/BaseSpecialist.ts(PRD-2 stub)冲突 · reject 给 prd skill 修锁 · 避免 TD-012 + 1 retry。
```

### Diff-2 · AUDIT-CHECKLIST-TEMPLATE.md 加"Multi-mode Specialist race window"警示

- **文件** · `~/.claude/scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md`
- **原因** · M-2 / TD-014 · 4 处复用同模式 · PRD-5 第 5 处 · PRD-7 高并发暴露
- **建议 diff** ·

```diff
+ ### Multi-mode Specialist 域(2026-05-09 · PRD-4 TD-014 经验)
+ 
+ 仅 Specialist story 含多 mode 时检查 ·
+ 
+ - [ ] 是否用 instance state(`private _mode`)? 是 → race window 警示
+   - grep · `grep -B2 "_mode" apps/api/src/specialists/<Agent>.ts | grep "private"`
+   - 如有 → audit 报告写"⚠️ TD-014 模式继承 · 高并发治理留 PRD-7+"
+ - [ ] outputSchema 是 getter 还是 method?
+   - getter + instance state → race 风险(approve · 文档化)
+   - method (req) => schema → 安全(approve)
+ - [ ] 单例 export(REJ-004) + multi-mode → 是否 documented "P3 单 user 串行场景安全 · 高并发治理留 PRD-7+"?
```

### Diff-3 · prd skill US 模板加 "cross-cut coverage" 章节

- **文件** · `~/.claude/skills/prd/SKILL.md`(全局 skill · 影响其他项目 · 留用户确认)
- **原因** · M-3 / US-017 e2e 教训 · 大型 router 漏 cross-cut coverage
- **跨项目影响** · ★ 高 · 建议**留全局评估**(不在本次 retro 直接 apply · 仅记录)
- **如果 apply** ·

```diff
+ ### US 模板 · cross-cut coverage 章节(2026-05-09 · PRD-4 US-017 经验)
+ 
+ 涉及"N-step / N-route / N-mode"router 的 US 必须有 cross-cut AC ·
+ 
+ 示例(stepData.save 9 step coverage)·
+ - [ ] save handler 覆盖全 9 step (step1/3/3b/4/4b/5/6/7/8) · grep `case 'step` 在 stepData.ts 全 9 命中
+ - [ ] e2e 测试 9 step 全跑 · grep `await page.goto('/step/` 在 e2e spec 全 9 命中
+ - [ ] 漏 step → UI skeleton 永挂 / save 返回 null · 必修后再 audit
+ 
+ 触发条件 · prd skill 检测 PRD §1 含 "N step / N 路由 / N mode" 时自动加章节。
```

### Diff-4 · VALIDATOR.md 加 "router handler coverage" 验证

- **文件** · `~/.claude/scripts/ralph/VALIDATOR.md`
- **原因** · M-3 衍生 · Validator 应该在 audit 前发现 router cross-cut 漏
- **建议 diff** ·

```diff
+ ### Router cross-cut coverage 验证(2026-05-09 · PRD-4 US-017 经验)
+ 
+ Validator 验证 stepData.save / 多 step router 类 US 时 · 加产物 ·
+ 
+ ```bash
+ # router-coverage.txt
+ grep -E "case '(step|route|mode)" apps/api/src/trpc/routers/<router>.ts
+ # 输出全部 case · 与 PRD §1 列出的 N 项对账
+ ```
+ 
+ Notes 强制格式 ·
+ - CONFIRMED: stepData.save 覆盖 step1/3/3b/4/4b/5/6/7/8 全 9 step
+ - SUSPECTED: 未发现漏 step(已 grep 全 9 case)
+ 
+ 漏 step → re-throw failure · ralph 必补全。
```

---

## §8 文档回流候选(commit 事实驱动)

### 8.1 取证范围

```bash
git log --reverse --oneline 6956d46..a05765e  # PRD-4 起点 = PRD-3 retro 完(6956d46)
git diff --name-status 6956d46..a05765e | head -50
```

### 8.2 提炼候选(commit 事实驱动 · 9 条 → 筛选 7 条)

| # | 内容 | 事实证据 | 落位 |
|:-:|---|---|---|
| 1 | apps/api/src/specialists/base/BaseSpecialist.ts(250 行)是 7 Specialist 的统一抽象 · 模板方法 4 步(parse → assemble → invokeLLM → safeParse → writeCostLog)· 子类只填 config + inputSchema + outputSchema + invokeLLM | bb51025 + 0dc637b · base.test.ts 24 unit | AGENTS.md §11.7 后端实施沉淀(新章节)|
| 2 | apps/api/src/services/context-assembler/ContextAssembler.ts(170 行)· 4 路并行 Promise.allSettled + 各路 5s timeout · L4/L5 降级跑空 · MethodologyQueryWorker 真接常量 | 4289068 · context-assembler.test.ts 16 unit | AGENTS.md §11.7 |
| 3 | 多 mode Specialist 模板 · `private _mode` 字段 + outputSchema getter 按 mode · 单例 export(REJ-004)· **TD-014 race window 警示(P3 单 user 串行安全 · 高并发治理留 PRD-7+)** | b4a68c2 + b4cfcd0 + 0ba2e2c + e5acb34 · 4 Specialist 同模式 | AGENTS.md §11.7 + AGENTS.md §10 admin 边界(TD-014 文档化)|
| 4 | SSE Specialist 模式 · stream() 首 chunk emit `{type:'meta', meta:{model:actualModel}}` · _consumeStream 接收 model · cost_log.modelUsed 反映 LLMGateway 真选 model(D-019)· 跨 SSE Specialist(US-007 + US-009)复用 | 85f8d9c + e5acb34 · TopicAgent + CopywritingAgent | AGENTS.md §11.7 |
| 5 | responseFormat 双 schema 策略 · refine 不能序列化为 JSON Schema · LLM 用 BaseSchema(无 refine) · BaseSpecialist post-validate 用 OutputSchema(含 refine) | b4a68c2 + e5acb34 · PositioningAgent step4 + CopywritingAgent step7 | AGENTS.md §11.7 |
| 6 | stepData.save handler **必须覆盖全 9 step**(step1/3/3b/4/4b/5/6/7/8)· 漏任一 → UI skeleton 永挂 / save 返回 null · **router cross-cut audit 在每个 PRD 收官前必跑** | 7f2e3f1 (US-017 修补) | AGENTS.md §11.7 + AGENTS.md §6 后端规范(cross-cut audit) |
| 7 | LLM Judge 套件 · vitest.judge.config.ts 独立 + model_tier='lightweight' + cost_log eventType='judge_call' · 7 Specialist × 1-2 golden case · 用 lightweight model 控成本 · cost-logger metadata.eventType 穿透 | 37ef848 · tests/judge/ 7 files | AGENTS.md §11.7 + AGENTS.md §8 测试金字塔 |

### 8.3 不保留

- ❌ Story 编号 / retry 次数 / Audit 经过 · 留在 retro 文档
- ❌ Codebase Patterns 全部原样搬 · 只筛选与 AGENTS.md / ARCHITECTURE 强相关的 7 条
- ❌ 工具链坑(vitest .tsx + vite dedupe · vi.hoisted)· 留 progress.txt 段
- ❌ ContextAssembler 4 路并行内部细节 · ARCHITECTURE §6.4 已 cover · 不重复

### 8.4 触发节奏

回流**强烈推荐立刻执行**(本次 retro §8 任务 6 直接 Edit AGENTS.md §11.7 新章节)。

---

## §9 决策(给 PRD-5 起前)

### M-1 · TD-013 / TD-014 是否在 PRD-5 启动前修?

**TD-013 双 cost_log** · ❌ **不修** · 设计是双层 logging · PRD-11 admin 域 ④ 治理时再决定。

**TD-014 _mode race** · ❌ **不修** · PRD-5 CopywritingAgent 4 mode + AnalysisAgent 2 mode 仍按现模式实施 · TD-014 文档化(本 retro §8 候选 3 落位 AGENTS.md §11.7)· 留 PRD-7+ 高并发治理。

### M-2 · §7 Skill diff Diff-1/2/4 是否本次 apply?

**Diff-1 OPUS-AUDIT-CHEATSHEET §F4.1** · ✅ **apply** · M-1 跨 PRD 第 3 次问题 · 立即固化(本次 retro §8 任务 5)。

**Diff-2 AUDIT-CHECKLIST-TEMPLATE Multi-mode 警示** · ✅ **apply** · TD-014 4 处复用 · 现在固化避免 PRD-5 第 5 处再忘。

**Diff-3 prd skill cross-cut(全局 skill)** · ⚠️ **留全局评估** · 影响其他项目 · 用户 review 后再 apply 全局 ~/.claude/skills/prd/SKILL.md。

**Diff-4 VALIDATOR.md router-coverage** · ✅ **apply** · M-3 配套 · 让 Validator 在 audit 前 catch 漏 step。

### M-3 · cost-log.jsonl 跨 PRD 累积是否清理?

**不清理** · v3 评估留全局 ralph.py 改进。本期 retro 数据用 progress.txt 倒推每 US 实际时间(更准)。

### M-4 · 反例库新增条目?

US-007 model 硬编码 reject 已自动入库到 ~/.claude/playbooks/reject-examples.jsonl(在 ralph-tools.py reject 时入库 · D-2026-05-04 升级)· 0 手动操作。

### M-5 · 文档回流 7 条是否本次直接 Edit AGENTS.md?

✅ **是** · 本次 retro §8 任务 6 直接 Edit AGENTS.md §11.7(新章节"后端 Specialist 实施沉淀")· 标记 v0.4 修订记录。

---

## §10 修订记录

- 2026-05-09 · v0.1 · 初稿(PRD-4 收官 · Opus 主对话 /prd-retro · 完整版 11 节)

---

## §11 结论

```
PRD-4 18/18 PASS · 0 fail-over · 0 RCA · 1 reject(US-007 reject feedback 含 4 处目标 · ralph 一次性修)
4 retry(US-002 TD-012 / US-007 D-019 / US-011 vitest config / US-015 e2e mock)· 全 ≤ 2 round 修通

成功的根因 · 
1. 反例库自动注入 + Codebase Patterns 跨 PRD 继承复利(累计 17 反例 + 14 patterns)
2. Foundation 档升档机制生效(downstream=7 触发深审 + 协议核对)
3. SOP §9.1 + §9.6 严格执行(0 fail-over · 0 size=large · prompt < 12K)
4. 7 Specialist 模板化(单 mode + 多 mode + SSE + responseFormat 双 schema 4 个标准模板)

待治理 ·
1. TD-013 双 cost_log → PRD-11 admin 域 ④
2. TD-014 _mode race → PRD-7+ 高并发场景
3. Skill diff 3 条本次 apply(§7 Diff-1/2/4)· 1 条留全局评估(Diff-3 prd skill cross-cut)
4. 文档回流 7 条本次直接 Edit AGENTS.md §11.7
5. cost-log.jsonl 跨 PRD 累积 留 v3
```

**给 PRD-5 起步**:
- prd skill 转 PRD-5 时关键词命中 → 自动注入 PRD-4 14 节 patterns + 17 反例
- CopywritingAgent 4 mode + AnalysisAgent / VideoAnalysisAgent 按 BrandingAgent / VideoAgent 多 mode 模板实施
- 4 工具页(/generate /analysis /video-analysis /boom-generate)按 9 步 e2e 模式各加独立 e2e
- TD-013/014 不修 · TD-015 已 accepted · 0 BLOCKER

**结论 · ✅ PRD-5 可启动**。
