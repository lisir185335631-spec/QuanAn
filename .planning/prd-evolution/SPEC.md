# SPEC · /evolution 1:1 复刻

> **目标** · `apps/web/src/pages/modules/Evolution.tsx` 全文 rewrite · 现有 PRD-25 trpc 真版 → sally 真实视觉 6 段
> **截图** · 2 张(顶部 header + level + 4 stat + 2 col empty · 下半 archive + 设置)
> **风险** · L(纯 UI · 0 sally 长 content)

---

## §1 · 背景 + 5 大偏离

### 1.1 sally 真实页结构

- chip breadcrumb · `EVOLUTION` > `智能体进化中心`
- header row · Brain icon + h1 + subtitle 左 + `触发进化` btn 右(金底)
- 进化等级 card(横向 row · 左 seedling + L1 信息 + progress + 距离下一等级 · 右 5 level icon)
- 4 stat cards(grid-4) · 好评数 0(绿👍)/ 待改进 0(红👎)/ 学习档案 1(brain)/ 满意率 0% (trending · 右上 chip "-0%")
- 2 col 区域(empty 双卡)· 进化洞察(shield icon · empty)/ 最近反馈(message icon · empty)
- 深度学习档案 section · 右链接`新增学习` + 1 archive entry
- 进化设置 section · 自动进化 toggle + 进化方向(L1 初始化 tag)

### 1.2 5 大偏离(现状 PRD-25 → sally)

| # | 偏离点 | 现状 | sally 真实 |
|:-:|---|---|---|
| **1** | header 结构 | h1 + subtitle 简洁 | breadcrumb chip + Brain h1 + subtitle + 触发进化 btn 右 |
| **2** | level 展示 | LevelBadgeRow 5 个 chip 横排 | 横长 card(左:seedling + L1 + progress + 距离... · 右:5 icon 紧凑) |
| **3** | trpc 真版 | trpc.evolution.* 全套 | mock-first · 0 backend |
| **4** | 4 stat 视觉 | MetricCard 等高 4 col(value 大字 + label 灰) | 同 · 但加 icon(👍绿/👎红/brain金/trending金)+ 颜色映射 + 满意率 chip "-0%" 右上 |
| **5** | 2 col empty 区域 | EmptyState 通用 | 进化洞察(shield icon + 文案)/ 最近反馈(message icon + 文案) 各 empty |

### 1.3 strategy

- mock-first · default render 完整 sally 真实视觉(L1 + 0 fb + 1 archive)
- 删 trpc.evolution.* 全部
- 触发进化 btn · toast `触发进化 · 即将上线`
- 自动进化 toggle · default ON · 切换 toast
- 新增学习 link · navigate `/deep-learning`

---

## §2 · 视觉规范

### 2.1 Icon 映射(lucide-react)

| 用途 | lucide icon |
|---|---|
| breadcrumb separator | `ChevronRight` |
| h1 prefix | `Brain` 金 |
| 触发进化 btn prefix | `Zap` 金 |
| 进化等级 left icon | `Sprout` 金(seedling) |
| level icon(L1-L5) | `Sprout` / `BookOpen` / `Leaf` / `Trees` / `Crown` |
| stat 好评数 | `ThumbsUp` 绿 |
| stat 待改进 | `ThumbsDown` 红 |
| stat 学习档案 | `Brain` 金 |
| stat 满意率 | `TrendingUp` 金 |
| 进化洞察 empty | `Award` 大灰(或 `Shield`) |
| 最近反馈 empty | `MessageSquare` 大灰 |
| 深度学习档案 section icon | `Sparkles` 金 |
| 新增学习 link | `Sparkles` 金 |
| archive ✓ | `CheckCircle2` 绿 |

### 2.2 layout

- main · `max-w-6xl mx-auto py-8 space-y-8`
- header · `flex justify-between items-start`
- 进化等级 card · `flex justify-between items-center` · 左 group + 右 5 icon row
- 4 stat · `grid grid-cols-2 md:grid-cols-4 gap-4`
- 2 col empty · `grid grid-cols-1 md:grid-cols-2 gap-4`
- archive section · `flex justify-between` for header + space-y-3 for list
- 进化设置 · `space-y-6` · 每 setting row 含 label + control 右

---

## §3 · 字面源(完整)

### 3.1 header

| 字段 | 字面 |
|---|---|
| breadcrumb left | `EVOLUTION` |
| breadcrumb right | `智能体进化中心` |
| h1 | `智能体进化中心` |
| subtitle | `你的智能体通过反馈学习和深度学习持续进化，越用越懂你` |
| 触发进化 btn | `触发进化` |

注 · subtitle 中"反馈学习" "深度学习" 是金色高亮(其他字灰)

### 3.2 进化等级 card

| 字段 | 字面 |
|---|---|
| left title | `进化等级 L1：初始化` |
| left info | `已收集 0 条反馈 · 1 个深度学习档案` |
| progress hint | `距离下一等级还需 5 条反馈` |
| right · 5 level icon | (active L1 · 其余 4 dimmed) |

### 3.3 4 stat cards

| stat | label | value | unit |
|:-:|---|:-:|:-:|
| 1 | `好评数` | `0` | — |
| 2 | `待改进` | `0` | — |
| 3 | `学习档案` | `1` | — |
| 4 | `满意率` | `0` | `%` |

stat 4 右上 chip · `- 0%`(灰)

### 3.4 2 col empty

进化洞察:
- icon · Award(灰大)
- title · `还没有进化洞察`
- desc · `积累至少3条反馈后，点击"触发进化"生成洞察`
- card header · `进化洞察`(icon 金)

最近反馈:
- icon · MessageSquare(灰大)
- title · `还没有反馈记录`
- desc · `在使用各功能时点击 👍 或 👎 留下反馈`(注 · 这里用 emoji 是 sally 真实 · 例外保留)
- card header · `最近反馈`(icon 金)

### 3.5 深度学习档案 section

- H2 · `深度学习档案`(Sparkles icon 金 prefix)
- 右 link · `新增学习`(Sparkles icon · 金) → navigate `/deep-learning`
- archive entry(1) ·
  - left ✓ icon 绿
  - title · `文案学习 2026/5/25 (1篇)`
  - subtitle · `2026/5/25　来源: 添加1篇文案...`
  - right · `已学习` chip 绿

### 3.6 进化设置 section

- H2 · `进化设置`(Target icon prefix · sally 截图是 ⊙ 圆 icon)
- row 1 · 自动进化 ·
  - label · `自动进化`(白 bold)
  - desc · `根据反馈自动优化生成质量`(灰)
  - control · toggle switch(default ON · 金底)
- row 2 · 进化方向 ·
  - label · `进化方向`(白 bold)
  - desc · `综合优化（积累反馈后自动生成）`(灰)
  - control · `L1 初始化` tag(金边 + 金字)

---

## §4 · constants 改动

### 4.1 `lib/constants/evolution.ts` · 大改

```ts
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Crown, Leaf, Sprout, Trees } from 'lucide-react';

// ── header ────────────────────────────────────────────────────────────────────
export const EVOLUTION_BREADCRUMB_LEFT = 'EVOLUTION' as const;
export const EVOLUTION_H1 = '智能体进化中心' as const;
export const EVOLUTION_SUBTITLE_PARTS = {
  prefix: '你的智能体通过',
  highlight1: '反馈学习',
  middle: '和',
  highlight2: '深度学习',
  suffix: '持续进化，越用越懂你',
} as const;
export const EVOLUTION_TRIGGER_BTN = '触发进化' as const;

// ── 5 levels ─────────────────────────────────────────────────────────────────
export interface EvolutionLevel {
  id: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  label: string;
  range: string;
  icon: LucideIcon;
}

export const EVOLUTION_LEVELS_5: ReadonlyArray<EvolutionLevel> = [
  { id: 'L1', label: '初始化', range: '0-4 反馈',   icon: Sprout   },
  { id: 'L2', label: '学习中', range: '5-19 反馈',  icon: BookOpen },
  { id: 'L3', label: '成长期', range: '20-49 反馈', icon: Leaf     },
  { id: 'L4', label: '成熟期', range: '50-99 反馈', icon: Trees    },
  { id: 'L5', label: '大师级', range: '100+ 反馈',  icon: Crown    },
];

// ── level card ───────────────────────────────────────────────────────────────
export const EVOLUTION_LEVEL_TITLE_TPL = (id: string, label: string) => `进化等级 ${id}：${label}`;
export const EVOLUTION_LEVEL_INFO_TPL = (feedbacks: number, archives: number) =>
  `已收集 ${feedbacks} 条反馈 · ${archives} 个深度学习档案`;
export const EVOLUTION_LEVEL_NEXT_TPL = (need: number) =>
  `距离下一等级还需 ${need} 条反馈`;

// ── 4 stat labels ────────────────────────────────────────────────────────────
export const EVOLUTION_STAT_LABELS = {
  good: '好评数',
  needsImprove: '待改进',
  learningArchive: '学习档案',
  satisfaction: '满意率',
} as const;

// ── 2 empty col ───────────────────────────────────────────────────────────────
export const EVOLUTION_INSIGHT_TITLE = '进化洞察' as const;
export const EVOLUTION_INSIGHT_EMPTY_TITLE = '还没有进化洞察' as const;
export const EVOLUTION_INSIGHT_EMPTY_DESC = '积累至少3条反馈后，点击"触发进化"生成洞察' as const;

export const EVOLUTION_FEEDBACK_TITLE = '最近反馈' as const;
export const EVOLUTION_FEEDBACK_EMPTY_TITLE = '还没有反馈记录' as const;
export const EVOLUTION_FEEDBACK_EMPTY_DESC = '在使用各功能时点击 👍 或 👎 留下反馈' as const;

// ── archive section ──────────────────────────────────────────────────────────
export const EVOLUTION_ARCHIVE_TITLE = '深度学习档案' as const;
export const EVOLUTION_ARCHIVE_ADD = '新增学习' as const;
export const EVOLUTION_ARCHIVE_DONE_CHIP = '已学习' as const;

export interface ArchiveEntry {
  id: string;
  title: string;
  date: string;
  source: string;
  done: boolean;
}

export const EVOLUTION_ARCHIVE_MOCK: ReadonlyArray<ArchiveEntry> = [
  {
    id: 'archive-1',
    title: '文案学习 2026/5/25 (1篇)',
    date: '2026/5/25',
    source: '来源: 添加1篇文案...',
    done: true,
  },
];

// ── settings ─────────────────────────────────────────────────────────────────
export const EVOLUTION_SETTINGS_TITLE = '进化设置' as const;
export const EVOLUTION_SETTING_AUTO_LABEL = '自动进化' as const;
export const EVOLUTION_SETTING_AUTO_DESC = '根据反馈自动优化生成质量' as const;
export const EVOLUTION_SETTING_DIR_LABEL = '进化方向' as const;
export const EVOLUTION_SETTING_DIR_DESC = '综合优化（积累反馈后自动生成）' as const;
export const EVOLUTION_DIR_DEFAULT_TAG = 'L1 初始化' as const;

// ── default mock state ───────────────────────────────────────────────────────
export const EVOLUTION_DEFAULT_LEVEL_ID = 'L1' as const;
export const EVOLUTION_DEFAULT_FEEDBACKS = 0 as const;
export const EVOLUTION_DEFAULT_ARCHIVES = 1 as const;
export const EVOLUTION_DEFAULT_NEXT_NEED = 5 as const;
export const EVOLUTION_DEFAULT_STATS = {
  good: 0,
  needsImprove: 0,
  learningArchive: 1,
  satisfaction: 0,
} as const;

// ── toast ────────────────────────────────────────────────────────────────────
export const EVOLUTION_TOAST_TRIGGER = '触发进化 · 即将上线' as const;
export const EVOLUTION_TOAST_AUTO_ON = '自动进化已开启' as const;
export const EVOLUTION_TOAST_AUTO_OFF = '自动进化已关闭' as const;
```

---

## §5 · sub-component 设计

### 5.1 新建组件(`apps/web/src/components/evolution/`)

| 文件 | 用途 | 行数估 |
|---|---|:-:|
| `EvolutionBreadcrumb.tsx` | EVOLUTION > 智能体进化中心 chip | ~25 |
| `EvolutionHeader.tsx` | breadcrumb + Brain h1 + subtitle(highlights)+ 触发进化 btn 右 | ~40 |
| `LevelCard.tsx` | 横长 card · 左 seedling + L1 + info + progress + next · 右 5 icon row | ~80 |
| `LevelIconRow.tsx` | 5 level icon · active 金圈 · 其余 dimmed | ~35 |
| `StatCard.tsx` | 单 stat(icon + value + label · 满意率 chip 特殊) | ~45 |
| `EmptyInsightCard.tsx` | 进化洞察 empty | ~30 |
| `EmptyFeedbackCard.tsx` | 最近反馈 empty | ~30 |
| `ArchiveListItem.tsx` | 1 archive entry(✓ + title + sub + chip) | ~30 |
| `SettingRow.tsx` | 通用 setting row(label + desc + control 右) | ~30 |

---

## §6 · page rewrite

### 6.1 `apps/web/src/pages/modules/Evolution.tsx` · 全文 rewrite(416 → ~100 行)

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Award, MessageSquare, Sparkles } from 'lucide-react';

import { EvolutionHeader } from '@/components/evolution/EvolutionHeader';
import { LevelCard } from '@/components/evolution/LevelCard';
import { StatCard } from '@/components/evolution/StatCard';
import { EmptyInsightCard } from '@/components/evolution/EmptyInsightCard';
import { EmptyFeedbackCard } from '@/components/evolution/EmptyFeedbackCard';
import { ArchiveListItem } from '@/components/evolution/ArchiveListItem';
import { SettingRow } from '@/components/evolution/SettingRow';
import {
  EVOLUTION_ARCHIVE_ADD,
  EVOLUTION_ARCHIVE_MOCK,
  EVOLUTION_ARCHIVE_TITLE,
  EVOLUTION_DEFAULT_STATS,
  EVOLUTION_DIR_DEFAULT_TAG,
  EVOLUTION_SETTING_AUTO_DESC,
  EVOLUTION_SETTING_AUTO_LABEL,
  EVOLUTION_SETTING_DIR_DESC,
  EVOLUTION_SETTING_DIR_LABEL,
  EVOLUTION_SETTINGS_TITLE,
  EVOLUTION_STAT_LABELS,
  EVOLUTION_TOAST_AUTO_OFF,
  EVOLUTION_TOAST_AUTO_ON,
  EVOLUTION_TOAST_TRIGGER,
} from '@/lib/constants/evolution';

export default function Evolution() {
  const navigate = useNavigate();
  const [autoOn, setAutoOn] = useState(true);

  return (
    <main className="flex-1 container py-8 max-w-6xl space-y-8">
      <EvolutionHeader onTrigger={() => toast.info(EVOLUTION_TOAST_TRIGGER)} />
      <LevelCard />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard variant="good" label={EVOLUTION_STAT_LABELS.good} value={EVOLUTION_DEFAULT_STATS.good} />
        <StatCard variant="needsImprove" label={EVOLUTION_STAT_LABELS.needsImprove} value={EVOLUTION_DEFAULT_STATS.needsImprove} />
        <StatCard variant="learning" label={EVOLUTION_STAT_LABELS.learningArchive} value={EVOLUTION_DEFAULT_STATS.learningArchive} />
        <StatCard variant="satisfaction" label={EVOLUTION_STAT_LABELS.satisfaction} value={EVOLUTION_DEFAULT_STATS.satisfaction} unit="%" showDelta />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmptyInsightCard />
        <EmptyFeedbackCard />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2 text-on-surface">
            <Sparkles className="w-5 h-5 text-primary" />
            {EVOLUTION_ARCHIVE_TITLE}
          </h2>
          <button type="button" onClick={() => navigate('/deep-learning')} className="text-primary text-sm flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            {EVOLUTION_ARCHIVE_ADD}
          </button>
        </div>
        {EVOLUTION_ARCHIVE_MOCK.map((a) => <ArchiveListItem key={a.id} archive={a} />)}
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-bold text-on-surface">{EVOLUTION_SETTINGS_TITLE}</h2>
        <SettingRow
          label={EVOLUTION_SETTING_AUTO_LABEL}
          desc={EVOLUTION_SETTING_AUTO_DESC}
          control={
            <button
              type="button"
              onClick={() => {
                setAutoOn((v) => !v);
                toast.info(autoOn ? EVOLUTION_TOAST_AUTO_OFF : EVOLUTION_TOAST_AUTO_ON);
              }}
              className={`w-12 h-7 rounded-full transition-colors relative ${autoOn ? 'bg-primary' : 'bg-muted'}`}
              data-testid="auto-toggle"
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${autoOn ? 'left-5' : 'left-0.5'}`} />
            </button>
          }
        />
        <SettingRow
          label={EVOLUTION_SETTING_DIR_LABEL}
          desc={EVOLUTION_SETTING_DIR_DESC}
          control={<span className="px-3 py-1 rounded-md border border-primary/40 text-primary text-sm">{EVOLUTION_DIR_DEFAULT_TAG}</span>}
        />
      </div>
    </main>
  );
}
```

删除 ·
- trpc.evolution.* 全部(getProfile / evolve / updateConfig)
- useActiveAccount + localStorage
- EmptyState 老版
- 老 LevelBadgeRow + 老 MetricCard inline 定义

---

## §7 · 文件清单

| 文件 | 操作 | 行数估 |
|---|:-:|:-:|
| `lib/constants/evolution.ts` | **大改**(删 emoji + range 字段 · 加 icon + 全新 const) | +~120 / -25 |
| `components/evolution/` | **新建 9 子组件** | 总 ~340 |
| `pages/modules/Evolution.tsx` | **全文 rewrite**(416 → ~100 行) | -316 |
| 老 test(若存) | **改 / 新建** | ~50 |

**不动** · backend / useActiveAccount(其他 page 用)

---

## §8 · 验收(5 维度)

### D1 · 字面

innerText grep · 必命中 ·
- `EVOLUTION` 1+ 次
- `智能体进化中心` 2+ 次(breadcrumb + h1)
- subtitle 关键 `反馈学习` / `深度学习` / `越用越懂你` 各 1 次
- `触发进化` 1+ 次(btn + empty desc)
- `进化等级 L1：初始化` 1 次
- `已收集 0 条反馈 · 1 个深度学习档案` 1 次
- `距离下一等级还需 5 条反馈` 1 次
- 4 stat label(好评数/待改进/学习档案/满意率)各 1 次
- `进化洞察` 1+ 次 + `还没有进化洞察` 1 次
- `最近反馈` 1+ 次 + `还没有反馈记录` 1 次
- `深度学习档案` 1 次 + `新增学习` 1 次
- `文案学习 2026/5/25 (1篇)` 1 次 + `已学习` 1 次
- `进化设置` 1 次 + `自动进化` 1 次 + `进化方向` 1 次 + `L1 初始化` 1 次
- 字面命中率 ≥ 99%

### D2 · 视觉

- breadcrumb chip 顶左 · h1 + Brain icon 大字 · 触发进化 btn 右金底
- level card 横长 · 左 seedling + 信息 · 右 5 icon row(L1 active 金圈)
- 4 stat cards equal · 颜色映射(绿/红/金/金 + 满意率 -0% chip)
- 2 col empty cards 居中
- archive 1 entry · ✓ + chip
- settings 2 row · toggle + tag

### D3 · 交互

- 触发进化 click · toast `触发进化 · 即将上线`
- 自动进化 toggle · 切换 + toast
- 新增学习 link · navigate `/deep-learning`

### D4 · 状态

- 1 state · `autoOn`(default true)
- 其他全 mock 常量

### D5 · 边界

- 0 trpc · 0 backend · 0 localStorage

### D6 · typecheck + test

- `pnpm typecheck` 全绿
- `pnpm --filter @quanan/web test Evolution` 全绿

---

## §9 · Sonnet 流程(6 步)

1. **改 constants** `lib/constants/evolution.ts` 按 §4.1(删 emoji + range 字段 · 加 icon mapping + 全新 const)
2. **新建 9 子组件** in `apps/web/src/components/evolution/`(§5.1)· icon lucide · 字面 from constants
3. **全文 rewrite** `apps/web/src/pages/modules/Evolution.tsx` 按 §6.1(416 → ~100 行)· 删 trpc/EmptyState/LevelBadgeRow inline 全部
4. **改 / 新建 test** ·
   - `apps/web/src/pages/modules/__tests__/Evolution.test.tsx` 改字面 / 新建 6-8 it 块断言关键字面
   - `apps/web/src/lib/constants/__tests__/evolution.test.ts` 改 / 新建 · 5 level + 字面 const
5. **跑** ·
   - `pnpm typecheck` 必绿
   - `pnpm --filter @quanan/web test Evolution` 必绿
6. **报告**

---

## §10 · 红线

1. ❌ hardcode 字面 · 必走 constants
2. ❌ 中文标点变半角(`，` `。` `（）` `：` 全角)
3. ❌ 保留 trpc.evolution.* / useActiveAccount / EmptyState 老版 任何残留
4. ❌ page 文件 inline 子段(必抽 9 sub-component)
5. ❌ 加 sally 截图未出现的功能
6. ❌ 动 apps/api/ backend
7. ❌ 装新 npm 包
8. ❌ 删 emoji 在 `还没有反馈记录` desc 里(`👍` `👎` sally 真实 emoji · 保留)

---

## §11 · 报告

```yaml
status: done | blocked
files_changed: ...
typecheck: pass | fail
test_run: pass | fail (N passed / N failed)
notes: ...
```
