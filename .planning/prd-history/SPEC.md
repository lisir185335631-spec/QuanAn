# SPEC · /history 1:1 复刻

> **目标** · `apps/web/src/pages/modules/History.tsx` 大改 · sally 简单 list 视觉
> **风险** · L(short UI + 3 mock entry · 0 sally 长内容 · 复用 HOT_ELEMENTS / SCRIPT_TYPES)

---

## §1 · 5 大偏离

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | 数据源 | trpc.history.list + stats | mock-first · 3 entry 固定 |
| 2 | 视图 | 2 view(timeline + dashboard recharts) | 单视图 vertical list |
| 3 | 筛选 | tool + dateRange + pagination | 无 · sally simple |
| 4 | 顶部 | 复杂 toolbar + view 切换 | h1 + subtitle 简单 |
| 5 | entry 视觉 | timeline 按天分组 + 摘要 | vertical card list · 每 card 类型 chip + 8 element chip + 主题 + 时间戳 + 右 3 btn |

---

## §2 · 字面 + 视觉

### 2.1 header

- h1 · `历史记录` 白大字
- subtitle · `查看和管理你生成的所有文案　（共 4 条）`(全角空格分隔 · count = mock 长度)

### 2.2 3 mock entry(vertical list)

每 entry card · `rounded-xl border border-border bg-card p-6 space-y-3` ·

row 1 · chip group horizontal flex-wrap gap-2 ·
- 类型 chip(金边 + 金字) · 例:`搞辩论` / `讲故事`
- 8 element chip(emoji + label · 来自 ALL_ELEMENTS)· 例:`🔄 反差` / `🔍 猎奇` / `🔥 借势` / `💬 共鸣` / `📈 低成本高回报` / `🎯 以小搏大` / `💬 争议` / `🎁 利益` / `💰 贪念`

row 2 · `主题：` 灰小 prefix + 主题 text 白
row 3 · `Clock` icon 灰 + timestamp 灰小

右上 group · 3 圆 icon btn · `Eye`(查看)/ `Copy`(复制)/ `Trash2`(删除)· 灰 hover 金

### 2.3 3 mock entries 数据

```ts
export const HISTORY_MOCK: ReadonlyArray<HistoryEntry> = [
  {
    id: 'h1',
    scriptType: '搞辩论',
    elementKeys: ['contrast','curiosity','leverage','resonance','low_cost_high','small_big','controversy','benefit','greed'],
    topic: '为什么有的人赚钱那么轻松',
    timestamp: '2026/5/24 14:53:07',
  },
  {
    id: 'h2',
    scriptType: '搞辩论',
    elementKeys: ['contrast','curiosity','leverage','resonance','low_cost_high','small_big','controversy','benefit','greed'],
    topic: '为什么有的人赚钱那么轻松',
    timestamp: '2026/4/14 15:33:43',
  },
  {
    id: 'h3',
    scriptType: '讲故事',
    elementKeys: ['contrast','curiosity','leverage','resonance','low_cost_high','small_big','controversy','benefit','greed'],
    topic: '为什么有的人赚钱那么轻松',
    timestamp: '2026/4/14 15:32:19',
  },
];
```

注 · 第 4 个 entry 在截图未完全显但 subtitle "共 4 条" · 故 mock 写 4 entry(第 4 entry 同 h3 数据 · 时间戳早一些)

---

## §3 · constants 新建

`lib/constants/historyPage.ts` ·

```ts
import type { LucideIcon } from 'lucide-react';
import { Copy, Eye, Trash2 } from 'lucide-react';

export const HISTORY_H1 = '历史记录' as const;
export const HISTORY_SUBTITLE_TPL = (n: number) =>
  `查看和管理你生成的所有文案　（共 ${n} 条）` as const;
export const HISTORY_TOPIC_PREFIX = '主题：' as const;
export const HISTORY_TOAST_VIEW = '查看详情 · 即将上线' as const;
export const HISTORY_TOAST_COPY = '已复制' as const;
export const HISTORY_TOAST_DELETE = '删除 · 即将上线' as const;

export interface HistoryEntry {
  id: string;
  scriptType: string;
  elementKeys: ReadonlyArray<string>;
  topic: string;
  timestamp: string;
}

export const HISTORY_MOCK: ReadonlyArray<HistoryEntry> = [
  { id: 'h1', scriptType: '搞辩论',
    elementKeys: ['contrast','curiosity','leverage','resonance','low_cost_high','small_big','controversy','benefit','greed'],
    topic: '为什么有的人赚钱那么轻松', timestamp: '2026/5/24 14:53:07' },
  { id: 'h2', scriptType: '搞辩论',
    elementKeys: ['contrast','curiosity','leverage','resonance','low_cost_high','small_big','controversy','benefit','greed'],
    topic: '为什么有的人赚钱那么轻松', timestamp: '2026/4/14 15:33:43' },
  { id: 'h3', scriptType: '讲故事',
    elementKeys: ['contrast','curiosity','leverage','resonance','low_cost_high','small_big','controversy','benefit','greed'],
    topic: '为什么有的人赚钱那么轻松', timestamp: '2026/4/14 15:32:19' },
  { id: 'h4', scriptType: '讲故事',
    elementKeys: ['contrast','curiosity','leverage','resonance','low_cost_high','small_big','controversy','benefit','greed'],
    topic: '为什么有的人赚钱那么轻松', timestamp: '2026/3/28 09:11:02' },
];

export const HISTORY_ACTIONS: ReadonlyArray<{ key: string; icon: LucideIcon; label: string }> = [
  { key: 'view',   icon: Eye,    label: '查看' },
  { key: 'copy',   icon: Copy,   label: '复制' },
  { key: 'delete', icon: Trash2, label: '删除' },
];
```

---

## §4 · sub-component

新建 `apps/web/src/components/history/` ·

| 文件 | 用途 |
|---|---|
| `HistoryHeader.tsx` | h1 + subtitle |
| `HistoryList.tsx` | vertical stack 4 HistoryEntryCard |
| `HistoryEntryCard.tsx` | 单 entry(类型 chip + element chips + 主题 + timestamp + 右 3 btn) |
| `HistoryChipRow.tsx` | 类型 chip + element chips group(复用 ALL_ELEMENTS lookup) |

---

## §5 · page rewrite

`pages/modules/History.tsx`(839 → ~40 行) ·

```tsx
import { toast } from 'sonner';

import { HistoryHeader } from '@/components/history/HistoryHeader';
import { HistoryList } from '@/components/history/HistoryList';
import { HISTORY_MOCK, HISTORY_TOAST_COPY, HISTORY_TOAST_DELETE, HISTORY_TOAST_VIEW } from '@/lib/constants/historyPage';

export default function History() {
  return (
    <main className="flex-1 container mx-auto max-w-5xl py-8 space-y-6">
      <HistoryHeader count={HISTORY_MOCK.length} />
      <HistoryList
        entries={HISTORY_MOCK}
        onView={() => toast.info(HISTORY_TOAST_VIEW)}
        onCopy={(topic) => {
          void navigator.clipboard.writeText(topic).catch(() => {});
          toast.success(HISTORY_TOAST_COPY);
        }}
        onDelete={() => toast.info(HISTORY_TOAST_DELETE)}
      />
    </main>
  );
}
```

删 · trpc.history.list/stats / 2 view / recharts / pagination / 工具筛选 / Sheet 全部

---

## §6 · 验收

D1 字面 grep · 必命中 ·
- `历史记录` 1 次
- `查看和管理你生成的所有文案` 1 次
- `共 4 条` 1 次
- `搞辩论` 2 次 / `讲故事` 2 次
- 9 element label(反差/猎奇/借势/共鸣/低成本高回报/以小搏大/争议/利益/贪念)各 4 次(每 entry)
- `主题：` 4 次
- `为什么有的人赚钱那么轻松` 4 次
- 4 timestamp 各 1 次

D2 · vertical list + chip row + 3 btn 右 · sally 1:1
D3 · view btn toast · copy btn 复制 topic 到剪贴板 + toast · delete toast
D6 · typecheck + test 全绿

---

## §7 · 红线

- ❌ hardcode 字面 · 走 constants
- ❌ 半角中文标点(`，` `。` `：` `（）` 全角)
- ❌ 保留 trpc.history / dashboard / recharts / 2 view 老逻辑
- ❌ emoji icon(element emoji 例外 · 复用 HOT_ELEMENTS 已有 emoji 字段)
- ❌ 动 backend / `apps/api/`
- ❌ 装新 npm 包
