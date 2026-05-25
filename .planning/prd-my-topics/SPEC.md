# SPEC · /my-topics 1:1 复刻

> **目标** · `apps/web/src/pages/modules/MyTopics.tsx` 大改 · sally empty state 简化视觉
> **风险** · L(empty state + 全 UI labels · 0 sally 内容)

---

## §1 · 5 大偏离

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | 数据源 | trpc.myTopics.list(3 source) | mock-first · default 空数组 |
| 2 | 视图切换 | 2 view(card/table)+ url state | 单视图 · 卡片网格 · 默认 empty |
| 3 | source 筛选 | step5/trending/manual 3 source filter | 6 filter chip(全部/流量型/变现型/人设型/认知型/案例型 · 按类型) |
| 4 | 添加选题 Modal | 有 | 无 · sally 引导用户去 /step/5 生成 |
| 5 | 顶部 | 简单 h1 | 返回 link + breadcrumb chip + ❤️ h1 + subtitle |

---

## §2 · 字面 + 视觉

### 2.1 顶部

- 返回 link · `← 返回爆款选题` · navigate `/step/5`
- breadcrumb chip · `MY TOPICS` 金边 chip + `>` + `我的选题库` 金 text
- h1 · ❤️ Heart filled 红 + `我的选题库` 白大字 text-3xl bold
- subtitle · `你收藏的所有爆款选题都在这里，支持按类型筛选、一键导出和生成文案。` 灰

### 2.2 search row

- search input · placeholder `搜索选题、行业、产品...` · flex-1 + 金边
- right group btn · `复制全部`(Copy icon · outline) + `下载TXT`(Download icon · outline)

### 2.3 6 filter chip(横排 · 全部 default active)

| key | label | icon |
|---|---|---|
| `all` | `全部` | `Heart` 金 |
| `traffic` | `流量型` | `TrendingUp` |
| `monetize` | `变现型` | `DollarSign` |
| `persona` | `人设型` | `Users` |
| `cognitive` | `认知型` | `Brain` |
| `case` | `案例型` | `BookOpen` |

每 chip · rounded-lg + border-border + px-4 py-2 · selected = bg-primary/10 + 金边 + 金字 + 金 icon · unselected = border-border + 灰

### 2.4 empty state

- 居中 vertical · py-16
- `Heart` icon 大灰 w-20 h-20
- `还没有收藏任何选题` text-base 灰
- `去爆款选题页面生成选题，点击红心即可收藏` text-sm 灰
- btn · `去生成选题`(Flame icon prefix · 金底 + 黑字) · navigate `/step/5`

---

## §3 · constants 新建

`lib/constants/myTopics.ts` ·

```ts
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen, Brain, DollarSign, Heart, TrendingUp, Users,
} from 'lucide-react';

export const MY_TOPICS_BACK = '返回爆款选题' as const;
export const MY_TOPICS_BREADCRUMB = 'MY TOPICS' as const;
export const MY_TOPICS_H1 = '我的选题库' as const;
export const MY_TOPICS_SUBTITLE = '你收藏的所有爆款选题都在这里，支持按类型筛选、一键导出和生成文案。' as const;
export const MY_TOPICS_SEARCH_PLACEHOLDER = '搜索选题、行业、产品...' as const;
export const MY_TOPICS_COPY_ALL = '复制全部' as const;
export const MY_TOPICS_DOWNLOAD_TXT = '下载TXT' as const;
export const MY_TOPICS_EMPTY_TITLE = '还没有收藏任何选题' as const;
export const MY_TOPICS_EMPTY_DESC = '去爆款选题页面生成选题，点击红心即可收藏' as const;
export const MY_TOPICS_EMPTY_CTA = '去生成选题' as const;
export const MY_TOPICS_TOAST_COPY = '暂无选题可复制' as const;
export const MY_TOPICS_TOAST_DOWNLOAD = '暂无选题可下载' as const;
export const MY_TOPICS_BACK_HREF = '/step/5' as const;
export const MY_TOPICS_CTA_HREF = '/step/5' as const;

export type TopicFilterKey = 'all' | 'traffic' | 'monetize' | 'persona' | 'cognitive' | 'case';

export interface TopicFilter {
  key: TopicFilterKey;
  label: string;
  icon: LucideIcon;
}

export const MY_TOPICS_FILTERS: ReadonlyArray<TopicFilter> = [
  { key: 'all',       label: '全部',   icon: Heart       },
  { key: 'traffic',   label: '流量型', icon: TrendingUp  },
  { key: 'monetize',  label: '变现型', icon: DollarSign  },
  { key: 'persona',   label: '人设型', icon: Users       },
  { key: 'cognitive', label: '认知型', icon: Brain       },
  { key: 'case',      label: '案例型', icon: BookOpen    },
];
```

---

## §4 · sub-component

新建 `apps/web/src/components/my-topics/` ·

| 文件 | 用途 |
|---|---|
| `MyTopicsHeader.tsx` | 返回 link + breadcrumb + ❤️ h1 + subtitle |
| `MyTopicsSearchRow.tsx` | search input + 复制全部 + 下载TXT btn |
| `MyTopicsFilters.tsx` | 6 filter chip 横排 |
| `MyTopicsEmpty.tsx` | empty state · 心 icon + 文字 + 去生成选题 btn |

---

## §5 · page rewrite

`apps/web/src/pages/modules/MyTopics.tsx`(578 → ~60 行) ·

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { MyTopicsEmpty } from '@/components/my-topics/MyTopicsEmpty';
import { MyTopicsFilters } from '@/components/my-topics/MyTopicsFilters';
import { MyTopicsHeader } from '@/components/my-topics/MyTopicsHeader';
import { MyTopicsSearchRow } from '@/components/my-topics/MyTopicsSearchRow';
import {
  MY_TOPICS_CTA_HREF, MY_TOPICS_TOAST_COPY, MY_TOPICS_TOAST_DOWNLOAD,
  type TopicFilterKey,
} from '@/lib/constants/myTopics';

export default function MyTopics() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TopicFilterKey>('all');

  const topics: never[] = [];

  return (
    <main className="flex-1 container mx-auto max-w-6xl py-8 space-y-6">
      <MyTopicsHeader />
      <MyTopicsSearchRow
        value={search}
        onChange={setSearch}
        onCopy={() => toast.info(MY_TOPICS_TOAST_COPY)}
        onDownload={() => toast.info(MY_TOPICS_TOAST_DOWNLOAD)}
      />
      <MyTopicsFilters active={filter} onChange={setFilter} />
      {topics.length === 0 && <MyTopicsEmpty onCta={() => navigate(MY_TOPICS_CTA_HREF)} />}
    </main>
  );
}
```

删 · trpc.myTopics.list / AddTopicModal / view url state / DenseTable / SourceBadge / IndustryDropdown / Card view inline

---

## §6 · 文件清单

| 文件 | 操作 |
|---|---|
| `lib/constants/myTopics.ts` | 新建 |
| `components/my-topics/` 4 sub-component | 新建 |
| `pages/modules/MyTopics.tsx` | rewrite 578 → ~50 行 |
| 老 test | 改 / 新建 |

---

## §7 · 验收

D1 字面 grep · 必命中 · `返回爆款选题` / `MY TOPICS` / `我的选题库` / subtitle / `搜索选题、行业、产品...` / `复制全部` / `下载TXT` / 6 filter label / `还没有收藏任何选题` / `去爆款选题页面生成选题，点击红心即可收藏` / `去生成选题`
D2 · 顶部 chip + h1 红心 + filter chip 横排 + empty 居中
D3 · filter click 切换 · 复制/下载/CTA toast 或 navigate
D6 · typecheck + test 全绿

---

## §8 · 红线

- ❌ hardcode 字面 · 走 constants
- ❌ 半角中文标点
- ❌ 保留 trpc.myTopics / AddTopicModal / DenseTable / 2 view 老逻辑
- ❌ emoji icon(❤️ 例外 · sally 真实保留 · 用 Heart filled lucide)
- ❌ 动 backend
