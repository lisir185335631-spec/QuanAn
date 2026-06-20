# PRD-24 · 3 modules 完整化 + 全 32 page visual diff 收官 · 1:1 视觉复刻达成

> **版本** · v0.1(2026-05-20 BJT · Opus 4.7 主对话写)
> **范围** · 跟 aiipznt 1:1 视觉对齐 · 3 件事 ·
> 1. 2 modules 完整化(/daily-tasks 今日任务 + /evolution 智能体进化中心) [重构删: /voice-chat 语音对话]
> 2. 全 31 page visual diff 收官(PRD-22+23 累计 29 baseline + PRD-24 新 2 = 31 · voice-chat 已删)
> 3. 反哺全局 skill 模板 · PRD-21~24 4 PRD 视觉对齐征程跨 PRD 复盘(严格通过率 / baseline 增长曲线 / 反例库统计)
> **基线** · PRD-21+22+23 已 ship main(commit `f99631b Merge: PRD-23`)· 29 visual baseline 累计 · D-233 unit test 同步硬规则机制化(PRD-23 实证 100% 1st pass)· 7 stub page 完整化(PRD-23 sweep)· `~/.claude/playbooks/prd-template-unit-test-sync.md` 全局反哺已就位
> **目标** · 32 page 全 visual baseline · 0 stub 剩余 · 收官 1:1 视觉复刻 · 准备 PRR(production readiness review) · LLM 接入留 PRD-25+
> **预估** · 5 US · 3 high + 1 medium + 1 收官 · 1.5 周 wall time · 5-7h daemon · 12-18 commits

---

## §0 引用清单 + 元数据 + 复刻定调

### §0.1 上游文档(7 份核心)

| # | 文档 | 用途 | 重点章节 |
|:-:|---|---|---|
| 1 | [aiipznt-deep-dom-dump.md](../aiipznt-deep-dom-dump.md) | **32 page DOM 实测 + spec 校准 + 红线 5 条** · 当冲突时以 dump 为准 | §2.4 6 modules table + 1 衍生 page |
| 2 | [aiipznt-spec.md](../aiipznt-spec.md) | 9192 行复刻基线 | §8.4.2 /voice-chat · 字面 12 button 自我介绍 + 6 quick prompts / §8.5.2 /daily-tasks 3-5 任务 + loading / §8.5.3 /evolution 5 级 + 4 指标 + 5 H3 + 4 进化方向 |
| 3 | [tasks/prd-23.md](prd-23.md) | PRD-23 7 stub 完整化(已 ship · pattern 复用) | §3 10 US 范围 + D-226~D-235 + D-233 unit test 同步机制 |
| 4 | [.agents/retros/prd-23-vs-prd-22-retrospective.md](../.agents/retros/prd-23-vs-prd-22-retrospective.md) | PRD-23 复盘 · 严格一轮通过率 100%(PRD-22 是 82%) · D-233 机制化生效证据 | 反例库累积 + ralph 自主修 pattern |
| 5 | [.agents/verification/prd-22-visual-diff-vs-aiipznt.md](../.agents/verification/prd-22-visual-diff-vs-aiipznt.md) | Step D 量化数据 · QuanAn vs aiipznt 实拍 -30~-83% diff(根因 LLM 内容空) | TD-090/091 defer 决策 · D-234 不接 LLM 留 PRD-25+ |
| 6 | [AGENTS.md](../AGENTS.md) | 18 LD + 17 R 红线 + §11 PRD 沉淀 | §11.14 PRD-23 沉淀(stub 完整化 pattern + DiagnosisStepCard 通用组件) |
| 7 | `~/.claude/playbooks/prd-template-unit-test-sync.md` | 全局反哺(PRD-23 US-010 写入 · D-233 机制化) | unit test 同步硬规则 · prd skill 自动生成 AC 时引用 |
| 8 | `~/.claude/playbooks/reject-examples.jsonl` | 跨 PRD 反例库 · PRD-23 含 unit test 同步反例 + stub 完整化反例 | 注入 3 high US 的 anti_patterns(prd skill 自动检索 ≤ 3 条) |

### §0.2 元数据

| 项 | 值 |
|---|---|
| **branchName** | `ralph/prd-24-modules-final-polish` |
| **Locked Decisions** | D-236 起延续(PRD-23 收尾在 D-235 · 总 6 D · D-236~D-241) |
| **风险分档** | high × 2(US-001 /daily-tasks + US-002 /evolution 都涉及 stub 重写 + ls-namespace 集成 + 字面密度高) [重构删: US-003 /voice-chat]+ medium × 1(US-004 全 31 baseline 验证 · voice-chat 已删)+ 收官 × 1(US-005) |
| **anti_patterns 注入** | 3 high US 必须从 reject-examples.jsonl 检索 ≤ 3 条 · 关键词 "stub 完整化" / "localStorage 多账号隔离" / "5 级系统字面锁" / "quick prompts" / "unit test 同步"(PRD-23 教训) / "EmptyState 空态" / "字面常量字面锁" |
| **依赖前置 PRD** | PRD-15(8 page 完整化基线) + PRD-16(设计系统) + PRD-17~20(9 step page + 14 工具基础) + PRD-21(visual-diff infra + expectVisualMatch helper) + PRD-22(3 inline picker utility + 13 visual baseline + glass-card.tsx + FadeInWrapper polish) + PRD-23(7 stub 完整化 + 16 visual baseline + DiagnosisStepCard pattern + ls-namespace helper + dev-login + globalProcedure) · 严格保留不动 |
| **下游 PRD** | PRD-25+ · LLM 接入(/daily-tasks AI 任务生成 + /evolution AI 洞察生成 + 7 PRD-23 完整化 page 真 LLM + /diagnosis 7 维度真评分) [重构删: /voice-chat 真聊天 streaming] |
| **baseline 抓取来源** | `/tmp/aiipznt-clone-research/{dump,screenshots}` 32 HTML + 32 PNG fullPage 1440px |
| **visual diff 配置** | 复用 PRD-21 D-206 maxDiffPixelRatio 0.05 + D-208 viewport 1440x900 + expectVisualMatch helper |
| **失败回滚** | `git branch backup/before-prd-24 main` 已建(本会话 08:18) |

### §0.3 复刻定调(D1=A + D4=B 严锁 · 继承 PRD-23)

| 维度 | 切 / 不切 |
|---|:-:|
| 整体页面布局(layout / 区块顺序 / 区块尺寸 / 容器宽度 / padding 方向) | ✅ **切 1:1 对齐 aiipznt** |
| spacing scale / 字体 / motion / hover effect / glass-card / inline picker | ✅ 切(继承 PRD-21/22/23 utility) |
| **文字内容(title / 副标 / H1 / H2 / H3 / p / button 文字 / 自我介绍 / quick prompts / placeholder)** | ✅ **严格 1:1**(D1A 字面锁) |
| **常量数据 1:1**(5 级进化字面 / 4 进化方向 / 4 指标 / 5 H3 模块 / 6 quick prompts / 3-5 stub 任务) | ✅ **严格 1:1**(constants 字面锁) |
| 颜色 token / D4=B | ❌ **D4=B 锁 · 保留当前 HSL 43° 金色 token 不变** |
| OKLCH 任何 ref / `var(--gold)` / `border-gold/X` 字面 | ❌ **替换为 `var(--primary)` / `border-primary/X`** |
| UX behavior(search filter / accordion 展开 / hover transition 时长 / 历史 list 排序…) | 🟡 可自由发挥(D1=A 不锁) |
| **LLM 调用 + stub data**(基于 Step D 数据决策 · 继承 PRD-23 D-234) | 🟡 **本 PRD 不接 LLM**(留 PRD-25+)· 3 modules 完整化 = UI 骨架 + 静态 stub 数据示例 + 复用 PRD-22 inline picker / PRD-23 ls-namespace helper · LLM 集成留 PRD-25+ |

**D4=B 反例锁**(继承 PRD-22/23) · 防 ralph 字面解读紫色 → Tailwind 真紫色 utility

**D1A 长文本字面双锁**(继承 PRD-22/23) · AC-1 锁完整字面 · AC-N 重复时复述完整字符

**unit test 同步规则**(继承 PRD-23 D-233 + ~/.claude/playbooks/prd-template-unit-test-sync.md 全局规则) · 每个 US AC 必须显式列 "同步更新 apps/web/src/pages/**/__tests__/*.test.tsx + lib/constants/__tests__/*.test.ts unit test 期望对齐新字面 · vitest 全 pass"

### §0.4 D-236 ~ D-241 Locked Decisions(本 PRD 新建)

| ID | 决策 | Why |
|---|---|---|
| D-236 | /daily-tasks · 3-5 stub 任务卡 grid + "AI 老师正在为你制定今日任务..." loading 状态 + 无 active account 时显示 EmptyState + "添加账号" button → 跳 /accounts · "智能" 菜单分类 | spec §8.5.2 "AI 根据当前 IP 账号的状态生成 3-5 个建议任务" + "实测当前账号下还在 loading 中" + "无活跃账号时显示添加账号 button" |
| D-237 | /evolution · 5 级进化系统字面锁 · `'🌱 L1 初始化'` (0-4 反馈) / `'📚 L2 学习中'` (5-19 反馈) / `'🌿 L3 成长期'` (20-49 反馈) / `'🌳 L4 成熟期'` (50-99 反馈) / `'👑 L5 大师级'` (100+ 反馈) + 4 指标仪表盘(好评数/待改进/学习档案/满意率) + 5 H3 模块(进化等级/进化洞察/最近反馈/深度学习档案/进化设置) | spec §8.5.3 line 2460-2486 完整字面锁 |
| D-238 | /evolution 进化方向 4 选 1 字面锁 · `综合优化（积累反馈后自动生成）` / `创意性优先` / `转化率优先` / `真实感优先` · ls-namespace `acc_{accountId}_evolution_settings` 存储进化方向选择 · LD-009 多账号隔离 | spec §8.5.3 line 2489-2492 + PRD-15 TD-70 LocalStorage acc_ 前缀反例机制化 |
| D-239 | [重构删: /voice-chat 语音对话] | *(作废)* |
| D-240 | 全 31 page visual baseline 覆盖矩阵 · PRD-22 13 + PRD-23 16 + PRD-24 新 2 = 31 baseline(voice-chat 已删)· prd24-visual-baseline.spec.ts 2 fixture · 复用 PRD-21 expectVisualMatch helper · 不切 aiipznt 实拍 baseline(TD-090/091 defer 决策延续) | 收官目标 + Step D 数据决策 |
| D-241 | verify-prd-24.sh 收官 ALL CHECKS PASSED · 含 PRD-24 内 ≥ 30 checks + 全 32 baseline 跨 PRD-22+23+24 验证 · 一键 CI gate · 标志 1:1 视觉复刻达成 | 历史可追溯 · 准备 PRR |

---

## §1 介绍/概述

PRD-21+22+23 累计 ship main(commit `f99631b Merge: PRD-23`)· 严格一轮通过率 82% → **100%**(PRD-23) · 7 stub page 完整化 + 29 visual baseline + 3 inline picker utility + DiagnosisStepCard 通用 pattern + ls-namespace helper + dev-login + globalProcedure 中间件。

**Step D 量化数据**(.agents/verification/prd-22-visual-diff-vs-aiipznt.md)显示 · QuanAn vs aiipznt 实拍 -30~-83% diff(根因 LLM 内容空 · QuanAn 是空骨架)· **D-234 不接 LLM 决策延续**(留 PRD-25+)。

PRD-24 完成 **3 modules 完整化 + 全 32 page visual diff 收官**:

### 1.1 3 modules 完整化(3 high US)

| Page | 当前状态 | aiipznt 实测 | PRD-24 目标 |
|---|---|---|---|
| /daily-tasks | stub 未触(4 H + 8 button + 3 H3 占位) | spec §8.5.2 · 3-5 任务卡 + AI loading + 无 active 添加账号 button | UI 骨架 + 3-5 stub 任务卡(spec line 2438-2440 示例字面 "今天发布 1 条 step/7 生成的文案" / "优化 step/3 的简介" / "回复粉丝评论 X 条") + loading state + 空态 + ls-namespace 打卡 storage |
| /evolution | stub 未触(6 H + 9 button + 5 H3 占位) | spec §8.5.3 · 5 级进化 + 4 指标 + 5 H3 模块 + 4 进化方向 radio | UI 骨架 + 5 H3 模块完整(进化等级/进化洞察/最近反馈/深度学习档案/进化设置) + 5 级 level badge(🌱 L1 → 👑 L5 字面锁) + 4 指标 stub(好评数/待改进/学习档案/满意率) + 4 进化方向 radio(综合优化/创意性优先/转化率优先/真实感优先) + ls-namespace settings storage |

### 1.2 全 32 page visual baseline 收官(1 medium US)

| 累计 baseline | 数 | 来源 |
|---|:-:|---|
| PRD-22 | 13 | inline 重构 5 + step page 8 |
| PRD-23 | 16 | stub 完整化 7 + PRD-15 沉淀工具 8 + 衍生 1 |
| PRD-24 | 2 | /daily-tasks · /evolution *(voice-chat 已删)* |
| **总** | **31** | 31 page = 31 baseline · 1:1 视觉复刻达成 |

### 1.3 收官(1 medium US)

US-005 收官 · verify-prd-24.sh ALL CHECKS PASSED + /goal-verify §0 codebase 同步 + /prd-retro 跨 PRD-21~24 4 PRD 复盘 + AGENTS.md §11.15 PRD-24 沉淀 + handoff PRD-25+(LLM 接入)。

完成后 · **32 page 全 visual baseline + 0 stub 剩余 + 1:1 视觉复刻达成** · PRD-21~24 视觉对齐征程收官 · 准备 PRR(production readiness review) + PRD-25+ LLM 接入。

---

## §2 目标

- ✅ /daily-tasks 完整化(stub 3-5 任务卡 + AI loading + 无 active 空态 + ls-namespace acc_ 前缀) · 跟 spec §8.5.2 1:1
- ✅ /evolution 完整化(5 级进化 字面锁 + 4 指标仪表盘 + 5 H3 模块 + 4 进化方向 radio · 全字面锁) · 跟 spec §8.5.3 1:1
- ✅ 31 page visual baseline 全建立(累计 PRD-22 13 + PRD-23 16 + PRD-24 2 = 31) · 阈值 5% threshold · 跨 PRD-22+23+24 全 pass
- ✅ verify-prd-24.sh ALL CHECKS PASSED · /goal-verify + /prd-retro 跨 4 PRD 复盘 · AGENTS.md §11.15 沉淀
- ✅ 5 US 全 audit approved(Opus 4 维度 + risk_level 分档) · D-233 unit test 同步严守(继承 PRD-23) · 反例库自动注入

---

## §3 User Stories(5)

### US-001 high · /daily-tasks 完整化(3-5 stub 任务卡 + loading + 空态 + ls-namespace acc_ 前缀)

**风险分档** · 🔴 **high**(stub 完整化 · UI 骨架 + 状态管理 + ls-namespace acc_ 前缀 + EmptyState 空态 + AI loading 状态 · 多场景 UX 分支)

**Story 大小** · medium(单次 ralph 迭代可完成 · 5 文件创建/修改 · ~320 LOC 新增)

**前置依赖** · spec §8.5.2 + 现有 /daily-tasks stub(`apps/web/src/pages/modules/DailyTasks.tsx`) + PRD-23 ls-namespace getLsKey helper + PRD-23 EmptyState 组件

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /daily-tasks · 我看到 H1 "今日行动清单" + 副标 + 3 H3 任务卡(stub data 字面包含 spec §8.5.2 示例) + 完成打卡 button(stub) · 无 active account 时显示 EmptyState + "添加账号" CTA → 跳 /accounts · AI loading 状态显示 "AI 老师正在为你制定今日任务..." text + spinner。打卡状态走 localStorage `acc_{accountId}_daily_tasks_completed` 多账号隔离。

**验收标准** ·

- **AC-1** · H1 字面锁 `今日行动清单` · 副标字面 spec §8.5.2 · 顶部 "智能" 菜单分类标识(text-label-sm font-label text-primary uppercase tracking-wide)
- **AC-2** · 新建 `apps/web/src/lib/constants/daily-tasks.ts` · 导出 `DAILY_TASKS_STUB` · 3-5 项 stub 任务数组 · 每项 `{ id, title, hint, link }` · 字面包含 spec §8.5.2 line 2438-2440 完整示例 ·
  ```typescript
  export interface DailyTask {
    id: string
    title: string
    hint: string
    link?: string  // 跳到的 step page(可选)
  }

  export const DAILY_TASKS_STUB: readonly DailyTask[] = [
    { id: 'publish-step7', title: '今天发布 1 条 step/7 生成的文案', hint: '前往 /step/7 生成或选已有文案发布', link: '/step/7' },
    { id: 'optimize-step3', title: '优化 step/3 的简介', hint: '回顾账号包装方案 · 检查简介字数和关键词', link: '/step/3' },
    { id: 'reply-comments', title: '回复粉丝评论 X 条', hint: '保持互动率 · 提升账号活跃度' },
  ] as const

  export const DAILY_TASKS_LOADING_TEXT = 'AI 老师正在为你制定今日任务...' as const
  export const DAILY_TASKS_EMPTY_TITLE = '请先创建 IP 账号' as const
  export const DAILY_TASKS_EMPTY_DESC = '完成账号配置后即可获取每日任务' as const
  export const DAILY_TASKS_EMPTY_CTA = '添加账号' as const
  ```
- **AC-3** · 重写 `apps/web/src/pages/modules/DailyTasks.tsx` · 渲染 4 H 标签(H1 + 3 H3 stub 任务卡 · 接近 aiipznt 4 H 标签) · 主区结构(从上到下) ·
  1. PageHeader + 顶部 "智能" 菜单分类标识 + H1 `今日行动清单` + 副标
  2. 主区(分 3 状态)·
     - 无 active account → `<EmptyState title={DAILY_TASKS_EMPTY_TITLE} description={DAILY_TASKS_EMPTY_DESC} action={<Button onClick={() => navigate('/accounts')}>{DAILY_TASKS_EMPTY_CTA}</Button>} />`
     - loading 状态 → 中央 Loader2 spinner + text `{DAILY_TASKS_LOADING_TEXT}`
     - 有 active account + 已加载 → grid 3-5 任务卡(`DAILY_TASKS_STUB.map`)
  3. 每任务卡 · `<glass-card>` wrapper(`bg-card/40 backdrop-blur-md border-border/40 rounded-lg p-6`) + H3 `{task.title}` font-display + text-sm muted `{task.hint}` + 底部 [完成打卡] button(stub onClick toast `打卡功能 PRD-25+`) + 如有 `task.link` 显示 [前往] button(跳 link)
  4. 顶部 FadeInWrapper stagger(delay 0.05 * idx)入场
- **AC-4** · 无 active account 状态 · `const { account } = useActiveAccount()` · `account === null` 时显示 EmptyState · 不渲染任务 grid · `<Button>` onClick `navigate('/accounts')`
- **AC-5** · AI loading 状态 · `const [isLoading, setIsLoading] = useState(false)` · stub 加 useEffect 模拟 800ms loading(可注释说明 `PRD-25+ 接 LLM 时替换为 trpc.dailyTasks.list.useQuery()`) · loading 时显示 spinner + DAILY_TASKS_LOADING_TEXT
- **AC-6** · localStorage `acc_{accountId}_daily_tasks_completed` 存储已打卡 task ids(数组) · 用 `getLsKey(accountId, 'daily_tasks_completed')` from `@/lib/ls-namespace` · 完成 button click → 加 id 到 array + localStorage.setItem · 已打卡任务卡显示 ✓ 标 + opacity-60 · LD-009 多账号隔离
- **AC-7** · DOM button 数 ≥ 8(3-5 任务卡完成 button × 3-5 + 1 添加账号 + 顶部其他 hover button) · 接近 aiipznt 实测 8
- **AC-8** · DOM H 标签数 ≥ 4(H1 + 3 H3 任务卡) · 接近 aiipznt 4
- **AC-9** · **D-233 unit test 同步硬规则** · 新建 `apps/web/src/pages/__tests__/DailyTasks.test.tsx` · ≥ 6 test ·
  - test 1: H1 字面 `今日行动清单` 命中
  - test 2: stub 3-5 任务渲染(`DAILY_TASKS_STUB` 长度对照)
  - test 3: 完成 button click → toast + localStorage save
  - test 4: 无 active account → EmptyState + "添加账号" CTA 渲染 + click navigate('/accounts')
  - test 5: loading state → spinner + `AI 老师正在为你制定今日任务...` text
  - test 6: localStorage save 打卡 ids 用 getLsKey helper(acc_ 前缀)
- **AC-10** · 新建 `apps/web/src/lib/constants/__tests__/daily-tasks.test.ts` · ≥ 4 test · 覆盖 (a) DAILY_TASKS_STUB 长度 3-5 (b) 字面包含 spec line 2438-2440 示例 (c) DAILY_TASKS_LOADING_TEXT 字面 (d) DAILY_TASKS_EMPTY_TITLE/DESC/CTA 字面
- **AC-11** · TypeScript 编译通过 · cd apps/web && pnpm typecheck → 0 error
- **AC-12** · vitest run 通过 · cd apps/web && pnpm exec vitest run → 总 ≥ 297 test pass(基线 PRD-23 287 + US-001 新增 ≥ 10)
- **AC-13** · 新增 e2e `tests/e2e/prd24-daily-tasks-flow.spec.ts` · ≥ 3 test(H1 命中 / 3 任务卡渲染 / 空态显示 stub mock no-account)
- **AC-14** · 新增 visual baseline · `tests/e2e/prd24-visual-baseline.spec.ts` /daily-tasks fixture · baseline `prd24-daily-tasks.png` · viewport 1440x900 · fullPage · maxDiffPixelRatio 0.05 · 首跑 --update-snapshots + Read confirm baseline 跟 aiipznt 视觉相符
- **AC-15** · 用 agent-browser 打开 http://localhost:5173/daily-tasks · 验证 (a) H1 + 副标 + 智能菜单标识 · (b) 3 任务卡渲染含 spec 示例字面 · (c) 空态(stub mock account=null)显示 EmptyState + CTA · (d) loading 状态显示 spinner + loading text · (e) 完成 button click 打卡 + localStorage 写入 · (f) console 无 error
- **Typecheck passes**

**测试范围** ·
- unit test · 10 new(6 page + 4 constants)
- e2e · 3 new
- visual diff · 1 new baseline

**文件 to create** ·
- `apps/web/src/lib/constants/daily-tasks.ts`
- `apps/web/src/pages/__tests__/DailyTasks.test.tsx`
- `apps/web/src/lib/constants/__tests__/daily-tasks.test.ts`
- `tests/e2e/prd24-daily-tasks-flow.spec.ts`
- `tests/e2e/prd24-visual-baseline.spec.ts`

**文件 to modify** ·
- `apps/web/src/pages/modules/DailyTasks.tsx`(完整重写 · 替换 stub 33 LOC)

**anti_patterns 注入** · prd skill 从 reject-examples.jsonl 检索 "stub 完整化" / "EmptyState 空态" / "localStorage acc_ 前缀" / "unit test 同步" 关键词 · 注入 ≤ 3 条

---

### US-002 high · /evolution 完整化(5 级进化 badge + 4 指标仪表盘 + 5 H3 模块 + 4 进化方向 radio · D-237/D-238 字面锁严守)

**风险分档** · 🔴 **high**(spec §8.5.3 字面锁密度高 · 5 级 + 4 指标 + 5 H3 + 4 进化方向 总 14+ 字面常量 · ls-namespace evolution_settings 集成)

**Story 大小** · medium-large(单次 ralph 迭代可完成 · 4 文件创建/修改 · ~420 LOC 新增 · 接近 size_hint 边界)

**前置依赖** · spec §8.5.3 + 现有 /evolution stub + PRD-23 ls-namespace getLsKey helper + glass-card.tsx + FadeInWrapper

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /evolution · 我看到 H1 "智能体进化中心" + 副标 + 5 级进化 badge 卡(🌱 L1 → 👑 L5 字面锁 · 当前 stub L2 active 高亮) + 4 指标仪表盘(好评数/待改进/学习档案/满意率 · stub 随机值) + 5 H3 模块 grid(进化等级 / 进化洞察 / 最近反馈 / 深度学习档案 / 进化设置) · 进化设置内嵌 4 进化方向 radio(综合优化/创意性优先/转化率优先/真实感优先 字面锁) · 选择保存到 localStorage `acc_{accountId}_evolution_settings`。

**验收标准** ·

- **AC-1** · H1 字面锁 `智能体进化中心` · 副标字面锁 `你的智能体通过反馈学习和深度学习持续进化，越用越懂你`(spec §8.5.3 + D1A) · 顶部 "智能" 菜单分类标识
- **AC-2** · 新建 `apps/web/src/lib/constants/evolution.ts` · 导出 `EVOLUTION_LEVELS_5`(D-237) · 字面锁 ·
  ```typescript
  export interface EvolutionLevel {
    id: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
    emoji: string
    label: string
    range: string
  }

  export const EVOLUTION_LEVELS_5: readonly EvolutionLevel[] = [
    { id: 'L1', emoji: '🌱', label: '初始化', range: '0-4 反馈' },
    { id: 'L2', emoji: '📚', label: '学习中', range: '5-19 反馈' },
    { id: 'L3', emoji: '🌿', label: '成长期', range: '20-49 反馈' },
    { id: 'L4', emoji: '🌳', label: '成熟期', range: '50-99 反馈' },
    { id: 'L5', emoji: '👑', label: '大师级', range: '100+ 反馈' }
  ] as const
  ```
- **AC-3** · 导出 `EVOLUTION_MODULES_5`(D-237) · 5 H3 模块字面锁 · 顺序固定 ·
  ```typescript
  export const EVOLUTION_MODULES_5 = [
    { id: 'level', h3Label: '进化等级', desc: '显示当前 L1-L5 + 升级条件提示 + 触发进化按钮' },
    { id: 'insight', h3Label: '进化洞察', desc: '累计 3+ 反馈后点触发进化生成 AI 自我分析' },
    { id: 'feedback', h3Label: '最近反馈', desc: '在各功能 👍/👎 的历史记录' },
    { id: 'archive', h3Label: '深度学习档案', desc: '关联 /deep-learning · 可新增学习' },
    { id: 'settings', h3Label: '进化设置', desc: '自动进化开关 / 进化方向选择' }
  ] as const
  ```
- **AC-4** · 导出 `EVOLUTION_DIRECTIONS_4`(D-238) · 4 进化方向 radio 字面锁 · 完整字面 spec §8.5.3 line 2489-2492 ·
  ```typescript
  export const EVOLUTION_DIRECTIONS_4 = [
    { id: 'comprehensive', label: '综合优化（积累反馈后自动生成）' },
    { id: 'creative',      label: '创意性优先' },
    { id: 'conversion',    label: '转化率优先' },
    { id: 'authentic',     label: '真实感优先' }
  ] as const
  ```
- **AC-5** · 导出 `EVOLUTION_METRICS_4` · 4 指标仪表盘字面锁 ·
  ```typescript
  export const EVOLUTION_METRICS_4 = [
    { id: 'positive',  label: '好评数',   hint: '用户在功能页点 👍 的次数' },
    { id: 'improve',   label: '待改进',   hint: '用户点 👎 的次数' },
    { id: 'archive',   label: '学习档案', hint: '来自 /deep-learning 上传的样本数' },
    { id: 'satisfy',   label: '满意率',   hint: '好评数 / (好评 + 待改进) %' }
  ] as const
  ```
- **AC-6** · 重写 `apps/web/src/pages/modules/Evolution.tsx` · 6 H 标签(H1 + 5 H3 模块) · 主区结构(从上到下) ·
  1. PageHeader + "智能" 菜单标识 + H1 `智能体进化中心` + 副标
  2. 顶部 5 级 badge 卡 row · `EVOLUTION_LEVELS_5.map` · 每 badge `<div className="flex flex-col items-center p-4 rounded-lg border">`(active L2 加 `border-primary bg-primary/10` · 其他 `border-border opacity-60`) + emoji text-3xl + label font-display + range text-xs muted
  3. 4 指标仪表盘 · grid-cols-4 gap-4 · 每指标 glass-card + label + 大数字(stub 60-95 随机值 · 用 useMemo 固定一次) + hint text-xs muted
  4. 5 H3 模块 grid · grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 · `EVOLUTION_MODULES_5.map` · 每模块 glass-card + H3 `{module.h3Label}` font-display + desc text-sm muted
     - 进化等级模块内 · [触发进化] button(stub onClick toast `进化功能 PRD-25+`)
     - 进化洞察模块内 · stub 占位 "累计反馈 5 次后可触发进化"
     - 最近反馈模块内 · stub 占位 "暂无反馈记录"
     - 深度学习档案模块内 · [新增学习] button(stub onClick navigate('/deep-learning'))
     - **进化设置**模块内 · 嵌入 `EVOLUTION_DIRECTIONS_4` radio + 自动进化 switch(stub 默认开)
  5. FadeInWrapper stagger 入场
- **AC-7** · 进化方向 radio 状态 · `const [direction, setDirection] = useState<string>('comprehensive')`(默认综合优化) · 切换 → `localStorage.setItem(getLsKey(accountId, 'evolution_settings'), JSON.stringify({ direction, autoEvolve: true }))` · LD-009 多账号隔离
- **AC-8** · DOM button 数 ≥ 9(5 H3 模块各 1 主 button × 2 = 2 + 4 进化方向 radio + 1 触发进化 + 1 新增学习 + 1 自动进化 switch) · 接近 aiipznt 实测 9
- **AC-9** · DOM H 标签数 ≥ 6(H1 + 5 H3) · 接近 aiipznt 6
- **AC-10** · **D-233 unit test 同步硬规则** · 新建 `apps/web/src/pages/__tests__/Evolution.test.tsx` · ≥ 8 test ·
  - test 1: H1 + 副标字面命中
  - test 2: 5 级 badge 渲染(5 emoji + 5 label + 5 range)
  - test 3: 当前 active L2 高亮(border-primary class)
  - test 4: 4 指标仪表盘渲染(4 label + 4 hint)
  - test 5: 5 H3 模块字面顺序对照(用 page.locator('h3').allTextContents())
  - test 6: 4 进化方向 radio 字面渲染
  - test 7: 切换 radio → localStorage save(用 getLsKey helper)
  - test 8: 触发进化 button + 新增学习 button click stub
- **AC-11** · 新建 `apps/web/src/lib/constants/__tests__/evolution.test.ts` · ≥ 5 test · 覆盖 4 常量字面对照(EVOLUTION_LEVELS_5 / EVOLUTION_MODULES_5 / EVOLUTION_DIRECTIONS_4 / EVOLUTION_METRICS_4 · 每常量 1 test · 加 1 综合测试验证 5 + 5 + 4 + 4 数量)
- **AC-12** · TypeScript 编译通过 · cd apps/web && pnpm typecheck → 0 error
- **AC-13** · vitest run 通过 · 总 ≥ 310 test(基线 297 + US-002 新增 ≥ 13)
- **AC-14** · 新增 e2e `tests/e2e/prd24-evolution-flow.spec.ts` · ≥ 4 test(H1 / 5 级 badge / 5 H3 字面 / 4 进化方向 radio 切换)
- **AC-15** · visual baseline 加 /evolution · `prd24-evolution.png` · 阈值 5% · 首跑 --update-snapshots + Read confirm
- **AC-16** · 用 agent-browser 打开 http://localhost:5173/evolution · 验证 (a) H1 + 副标 · (b) 5 级 badge 渲染 · (c) 4 指标仪表盘 · (d) 5 H3 模块字面顺序对照 · (e) 4 进化方向 radio 字面 + 切换 localStorage save · (f) console 无 error
- **Typecheck passes**

**文件 to create** ·
- `apps/web/src/lib/constants/evolution.ts`
- `apps/web/src/pages/__tests__/Evolution.test.tsx`
- `apps/web/src/lib/constants/__tests__/evolution.test.ts`
- `tests/e2e/prd24-evolution-flow.spec.ts`

**文件 to modify** ·
- `apps/web/src/pages/modules/Evolution.tsx`(完整重写)
- `tests/e2e/prd24-visual-baseline.spec.ts`

**anti_patterns 注入** · prd skill 检索 "5 级系统字面锁" / "进化方向 radio" / "字面常量字面锁" / "unit test 同步" 关键词 · 注入 ≤ 3 条

---

> ⚠️ US-003 作废(2026-06-18 重构)：**语音对话**(`/voice-chat` + `VoiceChatAgent` + STT/TTS worker)已删除。原内容见 git 历史。

---

### US-004 medium · 全 32 page visual baseline 收官 + regression 验证

**风险分档** · 🟡 medium(纯验证 · 不重写代码 · 跑全 32 baseline 跨 PRD-22+23+24 总 regression)

**Story 大小** · small(单次 ralph 迭代可完成 · 1 文件 · ~80 LOC)

**前置依赖** · US-001~003 完成 · 2 new visual baseline 已建立(prd24-daily-tasks/evolution · voice-chat 已删) · PRD-22 13 baseline + PRD-23 16 baseline 已在 main · 累计 31 baseline

**用户故事** ·
作为 QuanAn 视觉一致性 owner · 我需要 `tests/e2e/prd24-visual-baseline.spec.ts` 含本 PRD 新加 2 fixture · voice-chat 已删(在 US-001~002 中已逐个加入)+ 跑全 31 baseline 总 regression 验证(PRD-22 13 + PRD-23 16 + PRD-24 2) · 阈值 5% threshold 全 pass · 修任一 fail(scope ≤ 100 LOC)。

**验收标准** ·

- **AC-1** · `tests/e2e/prd24-visual-baseline.spec.ts` 2 fixture 全建立 · /daily-tasks · /evolution · voice-chat 已删 · 不建此 fixture · 每 fixture viewport 1440x900 + fullPage + maxDiffPixelRatio 0.05 · 复用 PRD-21 expectVisualMatch helper · animations:disabled + transitions:disabled
- **AC-2** · 跑全 baseline · `cd /Users/return/Desktop/QuanAn && pnpm exec playwright test prd22-visual-baseline prd23-visual-baseline prd24-visual-baseline` · 总 13(PRD-22)+ 16(PRD-23)+ 2(PRD-24 · voice-chat 已删)= **31 fixture 全 pass** · 阈值 5%
- **AC-3** · `/tmp/aiipznt-clone-research/screenshots/` 含 31 prd*-XXX.png 全建立 · 验证 `ls /tmp/aiipznt-clone-research/screenshots/prd{22,23,24}-*.png | wc -l` ≥ 31 · voice-chat 已删
- **AC-4** · 任一 fixture fail · 修小问题(scope ≤ 100 LOC) · 优先排查 page 渲染/animation/font 差异 · 若需 `--update-snapshots` 重 baseline · Read baseline image 肉眼 confirm 跟 aiipznt 视觉相符才 commit
- **AC-5** · TypeScript + vitest 通过 · 总 ≥ 321 · 0 fail
- **AC-6** · D-233 unit test 同步(如有 page 改动 · 同步更新对应 tests)
- **AC-8** · 更新 progress.txt · 写入 "32 baseline regression 总验证 PASS" 标记 · 反映视觉对齐征程收官
- **Typecheck passes**

**文件 to create** · 无(prd24-visual-baseline.spec.ts 在 US-001~003 中已逐步建立)

**文件 to modify** ·
- `tests/e2e/prd24-visual-baseline.spec.ts`(确认 3 fixture 全 + 微调 if needed)
- `scripts/ralph/progress.txt`

---

### US-005 收官 · verify-prd-24.sh ALL CHECKS PASSED + /goal-verify + /prd-retro 跨 4 PRD + AGENTS.md §11.15

**风险分档** · 🟡 medium(收官 · 不写新代码 · 验证 + 文档 + 跨 4 PRD 复盘 + 反哺全局 skill)

**Story 大小** · medium(scripts + docs · ~400 LOC)

**前置依赖** · US-001~004 全部完成

**用户故事** ·
作为 PRD-24 收官 owner · 我需要 verify-prd-24.sh ALL CHECKS PASSED + /goal-verify §0 codebase 同步 + /prd-retro 跨 PRD-21~24 4 PRD 复盘 + AGENTS.md §11.15 沉淀 + handoff PRD-25+(LLM 接入) · 标志 1:1 视觉复刻达成 · 准备 PRR(production readiness review)。

**验收标准** ·

- **AC-1** · 新建 `scripts/verify-prd-24.sh` · 复用 PRD-23 10 section 结构 · ≥ 30 checks(PRD-24 内) · 关键检查 ·
  - §1 /daily-tasks · grep `今日行动清单` H1 + 3 H3 stub 任务字面 spec line 2438-2440 + EmptyState + 添加账号 button + DAILY_TASKS_STUB 常量存在
  - §2 /evolution · grep `智能体进化中心` H1 + 5 级 badge(🌱 L1 / 📚 L2 / 🌿 L3 / 🌳 L4 / 👑 L5 字面)+ 4 指标(好评数/待改进/学习档案/满意率)+ 5 H3 模块字面 + 4 进化方向 radio 字面
  - §4 跨 page · typecheck 0 errors + vitest ≥ 321 test pass
  - §5 visual baseline · 31 fixture(prd22 13 + prd23 16 + prd24 2 · voice-chat 已删)全 pass · 阈值 5%
  - §6 unit test 同步规则验证 · D-233 锁 · 2 new page(`DailyTasks/Evolution`) 都有对应 __tests__/*.test.tsx + 2 new constants 都有对应 __tests__/*.test.ts *(VoiceChat/voice-chat 已删)*
  - §7 ls-namespace 验证 · grep `getLsKey` 使用 in 3 new page · LD-009 多账号隔离严守
  - §8 5 LD 落实验证 · D-236 + D-237 + D-238 + D-239 + D-240
  - §9 全 PRD-21~24 累计 checks · prd21 8 + prd22 52 + prd23 60 + prd24 ≥ 30 = ≥ 150 cumulative checks
  - §10 git state · branch + 累计 commit count + ahead/behind main
- **AC-2** · 跑 verify-prd-24.sh · ALL CHECKS PASSED · 退出码 0
- **AC-3** · `/goal-verify` 跑 §0 · `apps/web/.planning/codebase/` 5 文件 gsd-map-codebase 重新生成 · D1=A 字面对账(3 new page H1/副标/H3 + DAILY_TASKS_STUB + EVOLUTION_LEVELS_5/MODULES_5/DIRECTIONS_4/METRICS_4 + VOICE_CHAT_QUICK_PROMPTS_6/INTRO/H1 全字面)
- **AC-4** · `/goal-verify` §1+ · 对比 PRD-24 §2 目标 6 项 vs 5 US 交付 · 全 6 项 ✅ · 输出 `.agents/goal-verify/prd-24-goal-verify.md`
- **AC-5** · `/prd-retro` · 跨 PRD-21~24 4 PRD 复盘 · 输出 `.agents/retros/prd-24-vs-prd-23-retrospective.md` · 含 ·
  - 严格通过率趋势(PRD-21 — / PRD-22 82% / PRD-23 100% / PRD-24 期望 100%)
  - visual baseline 增长曲线(0 → 4 → 13 → 29 → 32)
  - 反例库增量(reject-examples.jsonl 跨 PRD 累积条数)
  - 跨 PRD 复用度(inline picker × N · DiagnosisStepCard pattern × N · ls-namespace 多账号隔离 × N)
  - **关键洞察 · 1:1 视觉复刻达成 vs LLM 内容空 的边界**(Step D 数据驱动决策)
  - 反哺全局 skill 模板的总价值(D-233 unit test 同步 + reject-examples · 跨项目跨 PRD 复用)
  - PRD-25+ LLM 接入 handoff(8 page 需接 LLM · /diagnosis / /step/8 / /daily-tasks / /evolution / 3 内容创作工具) [重构删: /voice-chat · acquisition-video]
- **AC-6** · 更新 `.agents/tech-debt.json` · 评估关 TD-094(若 PRD-24 修了 e2e auth bypass 模板 · 或登记为 PRD-25 修) · 登记 PRD-24 内偏差(预期 ≤ 2 TD)
- **AC-7** · 更新 `AGENTS.md §11.15` · 加 PRD-24 沉淀 · 含 ·
  - 3 modules 完整化(stub completion pattern 完结)
  - 32 baseline 收官(1:1 视觉复刻达成)
  - 5 级系统字面锁 pattern(可复用未来 N 级系统 page)
  - [重构删: 6 quick prompts pattern · voice-chat 已删]
  - LLM 接入 handoff(7 PRD-23 page + 2 PRD-24 page 共 9 page 留 PRD-25+ · voice-chat 已删)
- **AC-8** · 更新 `scripts/ralph/progress.txt` · PRD-24 ship summary 模板 + 累计 4 PRD 视觉对齐征程总结 ·
  ```
  ## PRD-21~24 视觉对齐征程总结(4 PRD ship)

  ### 累计成果
  - 32 page visual baseline 全建立(0 → 4 → 13 → 29 → 32)
  - 严格通过率: PRD-22 82% → PRD-23 100% → PRD-24 100%
  - 0 stub page 剩余(7 PRD-23 + 3 PRD-24 = 10 page 完整化)
  - 3 inline picker utility + DiagnosisStepCard pattern + ls-namespace helper 沉淀
  - 反例库累积 50+ 条跨 PRD 反例
  - 全局反哺 prd-template-unit-test-sync.md(D-233 机制化)

  ### PRD-24 → PRD-25+ Handoff
  - LLM 接入: /daily-tasks (AI 任务生成) + /evolution (AI 洞察) + 7 PRD-23 page (真 LLM) *(voice-chat 已删)*
  - 评估 TD-090/091 重新审视(LLM 接入后 visual diff vs aiipznt 实拍是否 ≤ 5%)
  ```
- **AC-9** · TypeScript + vitest 通过 · 0 fail
- **AC-10** · bash scripts/verify-prd-24.sh · ALL CHECKS PASSED · exit 0
- **Typecheck passes**

**文件 to create** ·
- `scripts/verify-prd-24.sh`
- `.agents/goal-verify/prd-24-goal-verify.md`
- `.agents/retros/prd-24-vs-prd-23-retrospective.md`

**文件 to modify** ·
- `apps/web/.planning/codebase/`(/gsd-map-codebase)
- `.agents/tech-debt.json`
- `AGENTS.md`(§11.15)
- `scripts/ralph/progress.txt`

---

## §4 验收标准摘要(plan-check 友好格式)

### §4.1 3 modules 完整化 + visual baseline 矩阵

| Page | US | 关键 AC 数 | DOM button 目标 | H 标签目标 | visual baseline |
|---|:-:|:-:|:-:|:-:|:-:|
| /daily-tasks | US-001 | 15 | ≥ 8 | 4(H1 + 3 H3) | prd24-daily-tasks.png |
| /evolution | US-002 | 16 | ≥ 9 | 6(H1 + 5 H3) | prd24-evolution.png |

### §4.2 共享 AC(全 5 US)

- **AC-X1** · typecheck 0 errors
- **AC-X2** · vitest 测试增量 ≥ 321(基线 PRD-23 287 + US-001~003 新增 ≥ 34)
- **AC-X3** · D1=A 字面锁严守(H1 / 副标 / H3 / placeholder / button name / 自我介绍 / quick prompts / 5 级 badge / 4 进化方向 / 4 指标)
- **AC-X4** · D4=B 颜色严锁(无 `from-violet-X` / `from-amber-X`)
- **AC-X5** · **D-233 unit test 同步**(每 US 必须同步更新对应 __tests__/*.test.tsx · 继承 PRD-23 教训)
- **AC-X6** · ls-namespace getLsKey acc_ 前缀(LD-009 多账号隔离 · 防 PRD-15 LocalStorage 反例)
- **AC-X7** · glass-card + FadeInWrapper 用到所有 H3 输出块(继承 PRD-22 polish)

### §4.3 跨 US 集成 AC

- **AC-Y1** · 31 page visual baseline 全建立(prd22 13 + prd23 16 + prd24 2 · voice-chat 已删)
- **AC-Y2** · verify-prd-24.sh ≥ 30 checks 全 PASS · 累计 4 PRD ≥ 150 checks
- **AC-Y3** · TD 评估 + 关闭 · /goal-verify + /prd-retro 文档完整
- **AC-Y4** · AGENTS.md §11.15 + ~/.claude/playbooks/ 反哺 + handoff PRD-25+

---

## §5 风险红线(自我把控)

### §5.1 不变红线(继承 PRD-15~23)

1. ❌ 不删 PRD-15~23 沉淀 page 代码 · 仅完整化 3 stub
2. ❌ 不切金色 token(D4=B)
3. ❌ 不动 admin · 不重写 backend
4. ❌ 不直接 copy aiipznt 版权专属内容 · 用 QuanAn 占位
5. ❌ 不绕过 Audit Gate
6. 🛑 推送远程 / 删数据 / 改 schema 破坏 · 提前问

### §5.2 PRD-24 新加红线

7. ❌ **不接 LLM**(D-234 同延续 · 留 PRD-25+) · 3 modules 完整化 = UI 骨架 + 真表单 + stub 输出 · 不调 trpc.XXX.generate / trpc.dailyTasks.list 等 · stub data 静态
8. ❌ **不切 aiipznt 实拍 baseline**(TD-090/091 defer · 保持 prd24-XXX 自截图 · 内部 regression baseline)
9. [重构删: /voice-chat quick prompt 红线 · voice-chat 已删]
10. ❌ /evolution 5 级 badge 字面不允许改写 · 'L1' 不能改 '1 级' · '0-4 反馈' 不能改 '0-4 次反馈'(D-237 字面锁)
11. ❌ /daily-tasks 无 active account 不能显示空白或 spinner · 必须 EmptyState + 添加账号 CTA(防 PRD-15 EmptyState 反例)
12. ❌ ls-namespace getLsKey 调用必须用 helper · 不允许 hardcode `acc_${accountId}_` 字符串拼接(PRD-15 TD-70 反例机制化)
13. ❌ **D-233 unit test 同步硬规则**(任 US 重写 page 必须同步更新对应 __tests__/*.test.tsx + lib/constants/__tests__/*.test.ts · 否则 reject · 继承 PRD-22 TD-093 + PRD-23 机制化)

---

## §6 失败回滚 + 拆 story 协议

### §6.1 backup branch

`git branch backup/before-prd-24 main`(本会话 08:18 已建)

### §6.2 拆 story 触发

按全局 CLAUDE.md §9.6 ·
- size_hint=large 必须拆 ≥ 3 子 story
- prompt > 11K 字节 → 拒启 daemon
- 单 story 累计 3 retry → 强制 retro

### §6.3 PRD-24 预测拆分点

| US | size_hint | 拆分预案 |
|---|---|---|
| US-001 | medium | 拆 US-001a(constants + page rewrite)+ US-001b(3 test files)如 ≥ 3 reject |
| US-002 | medium-large 边界(420 LOC + 5 常量) | 拆 US-002a(evolution.ts 4 常量 + Evolution.tsx 主结构)+ US-002b(5 H3 模块 + radio + localStorage save)如 ≥ 3 reject |
| US-004 | small | 不拆(纯验证) |
| US-005 | medium | 不拆(收官 docs) |

---

## §7 依赖图谱

### §7.1 前置 PRD(严格保留不动)

- **PRD-15**(8 page 完整化基线 + LocalStorage acc_ 前缀反例)
- **PRD-16~20**(设计系统 + 9 step page + 14 工具 + LLM Gateway 基础)
- **PRD-21**(visual-diff infra + expectVisualMatch helper)
- **PRD-22**(3 inline picker utility + 13 visual baseline + glass-card.tsx + FadeInWrapper polish)
- **PRD-23**(7 stub 完整化 + 16 visual baseline + DiagnosisStepCard pattern + ls-namespace helper + dev-login + globalProcedure)

### §7.2 US 依赖

```
US-001 (high) /daily-tasks   ← 独立 · spec §8.5.2 · 复用 ls-namespace + EmptyState
US-002 (high) /evolution     ← 独立 · spec §8.5.3 · 复用 ls-namespace + glass-card
US-004 (medium) 全 31 baseline 验证 ← US-001~002 完成后跑 · voice-chat 已删
US-005 (收官)                ← US-001~004 全部
```

### §7.3 下游 PRD

- **PRD-25+** · LLM 接入 · 10 page 真 LLM 集成
  - /daily-tasks · AI 任务生成
  - /evolution · AI 洞察生成
  - 7 PRD-23 完整化 page 真 LLM(/diagnosis 7 维度评分 / /accounts 智能推荐 / /step/8 真直播方案 / /video-analysis 真解析 / /analysis 真分析 / /video-production 真制作方案) [重构删: /voice-chat streaming chat · /acquisition-video 真获客方案]
  - 评估 TD-090/091 重新审视(LLM 接入后 visual diff vs aiipznt 实拍 ≤ 5% 是否可行)

---

## §8 进度跟踪

### §8.1 daemon 命令

```bash
cd /Users/return/Desktop/QuanAn
ls scripts/ralph/prd-24.json && cp scripts/ralph/prd-24.json scripts/ralph/prd.json
python3 scripts/ralph/ralph-tools.py status

# Monitor(必先于 daemon · 全局 §9.1 5 步 SOP)
Monitor(command="tail -n 0 -F scripts/ralph/ralph-output.log 2>/dev/null | grep -E --line-buffered 'PENDING_DETECTED|审计门禁已激活|APPROVED|REJECTED|所有任务已完成|All stories resolved|非零退出码|最大重试次数|级联阻断|通过 Opus 质量审查|⛔|Traceback|Error:'", persistent=true, timeout_ms=3600000)

# Daemon
/Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon
```

### §8.2 预期时间线

| US | 预期 ralph 时间 | 累计 |
|---|:-:|:-:|
| US-001 high | 40-50 min(stub 完整化 + 3 状态) | 50 min |
| US-002 high | 45-60 min(5 常量 + 5 H3 模块 + radio + localStorage) | 1.75h |
| US-004 medium | 15-25 min(纯验证 + 31 baseline 跑) | 2.25h |
| US-005 medium | 35-50 min(verify + retro + skill 更新) | 3.25h |
| **累计** | **2-3h daemon** | + Opus audit 4×3-15min/US ≈ 4-6h wall time |

### §8.3 跨 PRD-24 大门禁

1. ✅ US-001 完成 = /daily-tasks 可用 · UI 骨架 + 空态 + loading 三状态
2. ✅ US-002 完成 = /evolution 5 级 + 4 指标 + 5 H3 全字面锁
3. [重构删: US-003 /voice-chat VOICE CHAT + 6 quick prompts + 历史 localStorage · 此门禁作废]
4. ✅ US-004 完成 = 31 baseline 总 regression pass · 1:1 视觉复刻达成里程碑 · voice-chat 已删
5. ✅ US-005 完成 = PRD-24 ship · PRD-21~24 视觉对齐征程收官 · PRD-25+ LLM 接入 handoff

---

> **本 PRD 由 Claude(Opus 4.7)在 PRD-24 启动期写 · 2026-05-20 · 跟 PRD-23 互补使用 · 待 prd skill 转 prd-24.json 后启 daemon。**
