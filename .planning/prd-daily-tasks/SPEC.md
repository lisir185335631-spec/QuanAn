# SPEC · /daily-tasks 1:1 复刻

> **目标** · `apps/web/src/pages/modules/DailyTasks.tsx` rewrite + constants 改 · sally 真实页 1:1
> **截图** · 1 张(/daily-tasks 全页 · 字段已盘)
> **风险** · L+(simple structure 但 4 task 长 desc · mock-first 策略)

---

## §1 · 背景 + 7 大偏离

### 1.1 sally 真实页结构

- **URL** · `aiipznt.vip/daily-tasks`
- **header** · 复用 AIP AGENT logo + nav + INSTALL button(下载 icon) + 赵语AI/sally zhao + logout
- **正文** · 居中布局 max-w-4xl ·
  1. chip `每日任务`(日历 icon 金) · 圆角金边
  2. H1 `今日行动清单` 白 bold text-4xl/5xl · 居中
  3. subtitle `每天完成具体任务，一步步打造变现IP` 灰 · 居中
  4. 3 stat cards · 等高 grid-3 · 每 card(icon + 数字 + label)
  5. 1 today progress card(card 内:左 `今日进度` + 右 `0/4` 金 + 全宽 bar)
  6. 4 task cards stack · 每 task:○ checkbox + title + 2 tag chip + desc
  7. footer 2 button 居中 · IP诊断(听诊器) / 继续做IP方案 → (金底 primary)

### 1.2 7 大偏离(现状 = PRD-25 真 trpc 版 → sally)

| # | 偏离点 | 现状 | sally 真实 |
|:-:|---|---|---|
| **1** | 字面 chip | "智能" uppercase 紫色 chip | `每日任务`(日历 icon) · 金边圆 chip |
| **2** | subtitle 字面 | "AI 根据你的账号状态每日生成 3-5 个行动建议..." | `每天完成具体任务，一步步打造变现IP` |
| **3** | 缺 3 stat cards | 无 | 3 cards(连续打卡 / 累计打卡 / 累计完成) |
| **4** | 缺 today progress card | 无 | 1 card · `今日进度` + `0/4` + bar |
| **5** | TaskCard 结构 | ✓ icon + title + desc + estimatedMinutes + 完成打卡 btn | ○ checkbox + title + 2 tag(priority red/yellow + category 金) + desc · 无 btn |
| **6** | 缺 footer 2 button | 顶部 "重新生成 / 查看进化" 小 button | 底部居中 `IP诊断` + `继续做IP方案 →` |
| **7** | 任务内容 | trpc fetch(无数据时显 loading/empty) | mock-first · 4 固定 sally task(同 step5/Diagnosis 模式) |

### 1.3 strategy

- mock-first 默认 render `DAILY_TASKS_MOCK`(同 step5/Diagnosis 已成功模式) · ignore backend
- 保留 trpc.dailyTasks.* 调用 stub(PRR 评估 · 但不阻塞 render)
- 简化 · 删 trpc / loading / empty / fallback banner / regenerate 等所有动态状态
- TaskCard 重写 · 改为 sally 视觉(○ checkbox + tag + desc · 无按钮)

---

## §2 · 视觉规范

### 2.1 Icon 映射(lucide-react)

| 用途 | lucide icon | 颜色 |
|---|---|---|
| chip 每日任务 | `Calendar` | text-primary 金 |
| stat 1 火 | `Flame` | text-orange-500 橙 |
| stat 2 奖杯 | `Trophy` | text-primary 金 |
| stat 3 ✓ | `CheckCircle2` | text-green-500 绿 |
| task ○ checkbox | `Circle` w-5 h-5 | text-muted-foreground 灰 |
| task category 学习研究 | `BookOpen` | text-primary 金 |
| task category 内容创作 | `Zap` | text-primary 金 |
| task category 账号优化 | `Settings` | text-primary 金 |
| footer IP诊断 | `Stethoscope` | text-on-surface 白 |
| footer 继续做IP方案 | `ArrowRight` | text-on-primary 黑 |

### 2.2 layout

- main · `max-w-4xl mx-auto py-8 space-y-8`
- chip / H1 / subtitle · 居中 `flex flex-col items-center gap-2`
- 3 stat cards · `grid grid-cols-3 gap-4`
- task list · `space-y-4`
- footer · `flex justify-center gap-4`

### 2.3 color/styling

- chip · 金边 + 深 bg + 金字 · padding px-4 py-2 rounded-full
- H1 · text-4xl/5xl bold white display
- subtitle · text-base muted
- stat card · 深 bg-card + 边框 border-border + rounded-xl + p-6 + 居中 flex-col gap-2 (icon w-8 h-8 + 数字 text-3xl bold 颜色 per icon + label 灰 text-sm)
- progress card · 深 bg-card + 边框 + rounded-xl + p-6 · row1(label `今日进度` 灰 + 右 `0/4` 金 bold) · row2(全宽 bar h-2 rounded · empty 0%)
- task card · 深 bg-card + 边框 border-border + rounded-xl + p-6
- task ○ · w-5 h-5 灰 circle icon · 顶部对齐
- task title · text-lg white bold · 旁 inline tag chips
- task priority tag `高` · 红底 bg-red-500/20 + 红字 text-red-400 + small chip
- task priority tag `中` · 浅金底 bg-primary/10 + 金字 text-primary + small chip
- task category tag · 金字 + icon 金 + small chip 无边框
- task desc · 灰 text-sm leading-relaxed · 整段
- footer button outline / primary

---

## §3 · 字面(完整 from sally 截图)

### 3.1 header 部分

| 字段 | 字面 |
|---|---|
| chip | `每日任务` |
| h1 | `今日行动清单` |
| subtitle | `每天完成具体任务，一步步打造变现IP` |

### 3.2 3 stat cards

| # | icon | 数值 | label |
|:-:|---|:-:|---|
| 1 | Flame 橙 | `0` 橙 | `连续打卡天数` 灰 |
| 2 | Trophy 金 | `1` 金 | `累计打卡天数` 灰 |
| 3 | CheckCircle2 绿 | `1` 绿 | `累计完成任务` 灰 |

### 3.3 today progress card

- label · `今日进度` 灰
- 计数 · `0/4` 金 bold(右上)
- bar · 全宽 · empty 0% 进度

### 3.4 4 task cards

#### Task 1 · 高 + 学习研究

- title · `复盘已发布内容数据并总结`
- desc · `登录抖音/快手/B站等已发布内容的平台后台，查看过去一周所有流量型和价值型内容的播放量、点赞量、评论量、分享量、完播率等核心数据。将数据汇总到表格中，并针对表现较好的内容和表现较差的内容，初步分析可能的原因（例如：选题、标题、封面、开头、剪辑节奏、口播表现等）。`

#### Task 2 · 高 + 内容创作

- title · `优化下一批内容选题和脚本方向`
- desc · `根据任务1的数据复盘结果，结合你之前规划的流量型和价值型内容选题库，调整和优化下一批（至少2条流量型和2条价值型）内容的选题方向。对于表现好的内容类型，思考如何延续；对于表现不佳的内容，思考如何改进。为其中一条流量型内容（例如：关于企业服务行业某个鲜为人知的"坑"或"黑幕"）撰写详细脚本，包括开场白、核心内容点、案例/数据支撑、结尾引导。`

#### Task 3 · 中 + 学习研究

- title · `研究对标账号的评论区互动策略`
- desc · `选择3-5个你认为做得好的企业服务领域对标IP账号（或相关领域的知识分享型IP），重点观察他们最新发布的5-10条内容的评论区。分析他们是如何回复用户评论的？是否有引导用户提问或参与讨论？是否有利用评论区进行二次内容创作？记录下你认为值得借鉴的互动方式和话术。`

#### Task 4 · 高 + 账号优化

- title · `进行一次口播训练并录制`
- desc · `选取你为任务2撰写好的流量型内容脚本，进行至少3次口播训练。每次训练都用手机录制下来，并回放检查：1. 语速是否适中？2. 语调是否有起伏，避免平铺直叙？3. 表情和肢体语言是否自然？4. 是否有"念稿"感？5. 重点信息是否清晰有力？找出至少2个需要改进的点。`

### 3.5 footer 2 button

| 字段 | 字面 | icon | 视觉 |
|---|---|---|---|
| btn 1 | `IP诊断` | Stethoscope w-4 h-4 | outline + 灰边 + 暗 bg |
| btn 2 | `继续做IP方案` | ArrowRight w-4 h-4(右侧) | primary 金底 + 黑字 bold |

footer navigate ·
- btn 1 → `/diagnosis`
- btn 2 → `/step/1`(主流程起点 · 暂定)

---

## §4 · constants 改动

### 4.1 `lib/constants/daily-tasks.ts` 大改

#### 4.1.1 删除老 stub

```ts
// 删 DAILY_TASKS_STUB / DailyTask interface / DAILY_TASKS_LOADING_TEXT / EMPTY_* 4 常量
```

#### 4.1.2 新增字面 + mock 常量

```ts
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Settings, Zap } from 'lucide-react';

// ── Page-level constants ─────────────────────────────────────────────────────
export const DAILY_TASKS_CHIP = '每日任务' as const;
export const DAILY_TASKS_H1 = '今日行动清单' as const;
export const DAILY_TASKS_SUBTITLE = '每天完成具体任务，一步步打造变现IP' as const;

// ── 3 stat cards ──────────────────────────────────────────────────────────────
export interface StatCardData {
  id: string;
  value: number;
  label: string;
}

export const DAILY_TASKS_STATS: ReadonlyArray<StatCardData> = [
  { id: 'streak', value: 0, label: '连续打卡天数' },
  { id: 'total-days', value: 1, label: '累计打卡天数' },
  { id: 'total-tasks', value: 1, label: '累计完成任务' },
];

// ── Today progress ────────────────────────────────────────────────────────────
export const DAILY_TASKS_PROGRESS_LABEL = '今日进度' as const;
export const DAILY_TASKS_PROGRESS_COMPLETED = 0 as const;
export const DAILY_TASKS_PROGRESS_TOTAL = 4 as const;

// ── 4 mock tasks(per sally 截图) ──────────────────────────────────────────────
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = '学习研究' | '内容创作' | '账号优化';

export interface TaskMockItem {
  id: string;
  title: string;
  priority: TaskPriority;
  category: TaskCategory;
  desc: string;
}

export const DAILY_TASKS_MOCK: ReadonlyArray<TaskMockItem> = [
  {
    id: 'task-1',
    title: '复盘已发布内容数据并总结',
    priority: 'high',
    category: '学习研究',
    desc: '登录抖音/快手/B站等已发布内容的平台后台，查看过去一周所有流量型和价值型内容的播放量、点赞量、评论量、分享量、完播率等核心数据。将数据汇总到表格中，并针对表现较好的内容和表现较差的内容，初步分析可能的原因（例如：选题、标题、封面、开头、剪辑节奏、口播表现等）。',
  },
  {
    id: 'task-2',
    title: '优化下一批内容选题和脚本方向',
    priority: 'high',
    category: '内容创作',
    desc: '根据任务1的数据复盘结果，结合你之前规划的流量型和价值型内容选题库，调整和优化下一批（至少2条流量型和2条价值型）内容的选题方向。对于表现好的内容类型，思考如何延续；对于表现不佳的内容，思考如何改进。为其中一条流量型内容（例如：关于企业服务行业某个鲜为人知的"坑"或"黑幕"）撰写详细脚本，包括开场白、核心内容点、案例/数据支撑、结尾引导。',
  },
  {
    id: 'task-3',
    title: '研究对标账号的评论区互动策略',
    priority: 'medium',
    category: '学习研究',
    desc: '选择3-5个你认为做得好的企业服务领域对标IP账号（或相关领域的知识分享型IP），重点观察他们最新发布的5-10条内容的评论区。分析他们是如何回复用户评论的？是否有引导用户提问或参与讨论？是否有利用评论区进行二次内容创作？记录下你认为值得借鉴的互动方式和话术。',
  },
  {
    id: 'task-4',
    title: '进行一次口播训练并录制',
    priority: 'high',
    category: '账号优化',
    desc: '选取你为任务2撰写好的流量型内容脚本，进行至少3次口播训练。每次训练都用手机录制下来，并回放检查：1. 语速是否适中？2. 语调是否有起伏，避免平铺直叙？3. 表情和肢体语言是否自然？4. 是否有"念稿"感？5. 重点信息是否清晰有力？找出至少2个需要改进的点。',
  },
];

// ── Tag mapping ───────────────────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export const CATEGORY_ICON_MAP: Record<TaskCategory, LucideIcon> = {
  学习研究: BookOpen,
  内容创作: Zap,
  账号优化: Settings,
};

// ── Footer buttons ────────────────────────────────────────────────────────────
export const DAILY_TASKS_FOOTER_BTN_1 = 'IP诊断' as const;
export const DAILY_TASKS_FOOTER_BTN_2 = '继续做IP方案' as const;
export const DAILY_TASKS_FOOTER_BTN_1_HREF = '/diagnosis' as const;
export const DAILY_TASKS_FOOTER_BTN_2_HREF = '/step/1' as const;
```

---

## §5 · sub-component 设计

### 5.1 新建组件(`apps/web/src/components/daily-tasks/`)

| 文件 | 用途 | 行数估 |
|---|---|:-:|
| `DailyTasksChip.tsx` | Calendar icon + 字 chip | ~18 |
| `StatCard.tsx` | 单 stat card(icon + value + label · 颜色 prop) | ~25 |
| `TodayProgressCard.tsx` | 今日进度 + 0/4 + bar | ~25 |
| `TaskCard.tsx` | ○ checkbox + title + 2 tag + desc(rewrite 现有) | ~50 |
| `TaskPriorityTag.tsx` | 高/中/低 chip(颜色按 priority) | ~20 |
| `TaskCategoryTag.tsx` | 学习研究/内容创作/账号优化 chip(icon 按 category) | ~22 |
| `DailyTasksFooter.tsx` | 2 button(IP诊断 / 继续做IP方案 →) | ~30 |

---

## §6 · page 重写

### 6.1 `apps/web/src/pages/modules/DailyTasks.tsx` · 大改(269 → ~80 行)

```tsx
/**
 * /daily-tasks · 今日行动清单 (sally 真实页 1:1 复刻)
 * mock-first · 默认 render DAILY_TASKS_MOCK 4 task
 */
import { useNavigate } from 'react-router-dom';

import { DailyTasksChip } from '@/components/daily-tasks/DailyTasksChip';
import { DailyTasksFooter } from '@/components/daily-tasks/DailyTasksFooter';
import { StatCard } from '@/components/daily-tasks/StatCard';
import { TaskCard } from '@/components/daily-tasks/TaskCard';
import { TodayProgressCard } from '@/components/daily-tasks/TodayProgressCard';
import {
  DAILY_TASKS_H1,
  DAILY_TASKS_MOCK,
  DAILY_TASKS_STATS,
  DAILY_TASKS_SUBTITLE,
} from '@/lib/constants/daily-tasks';
import { Flame, Trophy, CheckCircle2 } from 'lucide-react';

const STAT_ICON_COLOR = [
  { Icon: Flame, color: 'text-orange-500' },
  { Icon: Trophy, color: 'text-primary' },
  { Icon: CheckCircle2, color: 'text-green-500' },
] as const;

export default function DailyTasks() {
  const navigate = useNavigate();

  return (
    <main className="flex-1 container py-8 max-w-4xl space-y-8">
      <div className="flex flex-col items-center gap-3">
        <DailyTasksChip />
        <h1 className="text-4xl md:text-5xl font-bold text-on-surface font-display text-center">
          {DAILY_TASKS_H1}
        </h1>
        <p className="text-base text-muted-foreground text-center">{DAILY_TASKS_SUBTITLE}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {DAILY_TASKS_STATS.map((stat, i) => (
          <StatCard
            key={stat.id}
            value={stat.value}
            label={stat.label}
            Icon={STAT_ICON_COLOR[i].Icon}
            iconColor={STAT_ICON_COLOR[i].color}
            valueColor={STAT_ICON_COLOR[i].color}
          />
        ))}
      </div>

      <TodayProgressCard />

      <div className="space-y-4">
        {DAILY_TASKS_MOCK.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      <DailyTasksFooter onIPDiagnosis={() => navigate('/diagnosis')} onContinue={() => navigate('/step/1')} />
    </main>
  );
}
```

删除 ·
- trpc.dailyTasks.* 3 个 mutation/query hook
- markCompletedMutation / regenerateMutation / utils.invalidate
- useActiveAccount(or 保留 unused · 不实际渲染分支)
- localStorage 离线兜底
- isFallback banner / EmptyState 分支
- 顶部 "重新生成 / 查看进化" 2 button
- 老 TaskCard inline 定义

---

## §7 · 文件清单

| 文件 | 操作 | 行数估 |
|---|:-:|:-:|
| `lib/constants/daily-tasks.ts` | **大改**(删 stub + 加 4 mock task + tag mapping) | -23 / +~120 |
| `components/daily-tasks/DailyTasksChip.tsx` | **新建** | ~18 |
| `components/daily-tasks/StatCard.tsx` | **新建** | ~25 |
| `components/daily-tasks/TodayProgressCard.tsx` | **新建** | ~25 |
| `components/daily-tasks/TaskCard.tsx` | **新建** | ~50 |
| `components/daily-tasks/TaskPriorityTag.tsx` | **新建** | ~20 |
| `components/daily-tasks/TaskCategoryTag.tsx` | **新建** | ~22 |
| `components/daily-tasks/DailyTasksFooter.tsx` | **新建** | ~30 |
| `pages/modules/DailyTasks.tsx` | **全文 rewrite**(269 → ~70 行) | -199 |
| `pages/__tests__/DailyTasks.test.tsx` | **rewrite**(改为 sally 真实页 assertion) | ~50 |
| `lib/constants/__tests__/daily-tasks.test.ts` | **rewrite**(对齐新常量) | ~30 |

**不动** · `apps/api/src/router/dailyTasks.ts` backend 保留(PRR 评估)

---

## §8 · 验收(5 维度)

### D1 · 字面(必过)

innerText grep · 必含 ·
- `每日任务` 1 次
- `今日行动清单` 1 次
- `每天完成具体任务，一步步打造变现IP` 1 次
- `连续打卡天数` / `累计打卡天数` / `累计完成任务` 各 1 次
- `今日进度` 1 次 + `0/4` 1 次
- 4 task title 各 1 次
- `高` 出现 3 次(task1/2/4)+ `中` 1 次(task3)
- `学习研究` 2 次 + `内容创作` 1 次 + `账号优化` 1 次
- 4 task desc 各 1 次
- `IP诊断` 1 次 + `继续做IP方案` 1 次
- 字面命中率 ≥ 99%

### D2 · 视觉

- 居中 chip 金边 · 居中 h1 + subtitle
- 3 stat cards 等高 grid-3 · icon 颜色对(橙/金/绿)
- progress card · 含 label + 0/4 + 空 bar
- 4 task cards stack · ○ icon + title + tag(高红/中浅金 + category 金)+ desc
- footer 2 button 居中 · 第 2 button 金底 primary

### D3 · 交互

- 4 task ○ checkbox 默认 unchecked · 不交互(纯 demo 视觉)
- footer 2 button · click navigate

### D4 · 状态

- 纯静态 · MOCK 渲染 · 0 fetch · 0 mutation

### D5 · 边界

- 0 trpc 调用 · 不依赖 backend(同 step5/Diagnosis 模式)

### D6 · typecheck + test

- `pnpm typecheck` 全绿
- `pnpm --filter @quanan/web test DailyTasks` 全绿

---

## §9 · Sonnet 流程(6 步)

1. **改 constants** `lib/constants/daily-tasks.ts` · 删老 stub + 加 sally 完整字面(SPEC §4.1)· 中文标点全角
2. **新建 7 子组件** 在 `apps/web/src/components/daily-tasks/`(SPEC §5.1)· icon 全 lucide-react · data-testid kebab-case
3. **全文 rewrite** `apps/web/src/pages/modules/DailyTasks.tsx` · 按 SPEC §6.1(269 → ~70 行)· 删 trpc / mutation / localStorage / EmptyState 全部
4. **rewrite test 文件** ·
   - `pages/__tests__/DailyTasks.test.tsx` · 改为简化静态页 assertion(4 task title + chip + h1 + 3 stat label + footer 2 button)
   - `lib/constants/__tests__/daily-tasks.test.ts` · 对齐新常量(DAILY_TASKS_H1 / SUBTITLE / 4 MOCK task / STATS)
5. **跑** ·
   - `pnpm typecheck` 全绿
   - `pnpm --filter @quanan/web test DailyTasks` 全绿
   - 失败 retry 修到绿
6. **报告**

---

## §10 · 红线(违反 = reject)

1. ❌ 不允许 hardcode 字面 · 必走 constants(`DAILY_TASKS_*` / `DAILY_TASKS_MOCK.*`)
2. ❌ 不允许中文标点变半角 · 全角 `，` `。` `（）` `：` `"` `"` 必严守
3. ❌ 不允许 emoji · 全用 lucide-react icon
4. ❌ 不允许保留 trpc.dailyTasks.* 调用 · 全删
5. ❌ 不允许保留 isFallback banner / EmptyState / localStorage 离线兜底
6. ❌ 不允许保留 "重新生成 / 查看进化" 2 top button(sally 真实无)
7. ❌ 不允许任务可交互(○ checkbox 纯静态 · 不绑 onClick)
8. ❌ 不允许 page 文件直接 inline TaskCard · 必抽 sub-component
9. ❌ 不允许 hardcode "/step/1" 等 navigate target · 必走 constants `DAILY_TASKS_FOOTER_BTN_*_HREF`

---

## §11 · 报告

```yaml
status: done | blocked
files_changed:
  - <path> · +N / -N
typecheck: pass | fail
test_run: pass | fail (N passed / N failed)
notes: <异常 / 决策>
```
