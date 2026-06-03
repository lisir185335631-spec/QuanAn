# SPEC · /step/1 1:1 复刻

> **目标** · `apps/web/src/pages/step/Step1.tsx` 改写 + 3 sub-component 新建/修改 · sally 56 行业网格视觉
> **风险** · M(56 industry constants 已 100% 复用 · 不动 · 主要改 page 布局 + 加 banner + sticky bar + h1 emoji + subtitle inline link)

---

## §1 · 10 大偏离

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | breadcrumb | `STEP 01 · 选择行业赛道` 单行 uppercase | `STEP 01` 金 chip + `>` + `选择行业赛道` 金 text (breadcrumb 双段) |
| 2 | h1 emoji prefix | 无 | `🌐 选择你的行业赛道`(🌐 前置 emoji) |
| 3 | subtitle 金色 + inline link | 全灰 | `56+` 和 `自定义输入行业` 金色 · 后者可点击触发 modal |
| 4 | 已选 banner placement | 顶部最上方 | 6 chip 之后 · industry grid 之前 |
| 5 | 已选 banner 内嵌大 CTA | 无(仅 emoji + 文字) | 右侧 `✨ 确认并进入下一步` 金底黑字 大 btn |
| 6 | 行业 card 选中 ✓ | 无 | 选中 card 右上角 `CheckCircle2` icon(金 fill) |
| 7 | 底部 sticky bar | 无(独立 CTA btn) | bottom sticky · 左 `已选择 💄 美业` + 右 `→ 确认并进入下一步` 金底黑字 |
| 8 | CustomIndustryModal 触发 | 底部 CTA 上方独立 trigger btn | subtitle 内 inline link · 点击触发 modal |
| 9 | persist 数据 | `useStepData(accountId,'step1')` + trpc | mock-first · localStorage 简单 set + navigate |
| 10 | FadeInWrapper 包裹 | 全 section 包 | sally 无 animation · 删 |

---

## §2 · 字面 + 视觉

### 2.1 顶部 breadcrumb

- container · flex items-center gap-3 mb-6
- chip · `rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-display text-xs font-bold text-primary tracking-wider`
- text · `STEP 01`
- separator · `>` 灰 muted-foreground
- text · `选择行业赛道` 金 `text-primary font-cn text-sm`

### 2.2 h1 + subtitle

- h1 · `🌐 选择你的行业赛道` 白大字 `font-display text-4xl md:text-5xl font-bold text-on-surface flex items-center gap-3`
- emoji `🌐` 显示在 h1 内 prefix · 不用 span 包(直接在 text)

- subtitle · `font-cn text-base text-muted-foreground mt-3`
- 字面 · `覆盖抖音、视频号等主流平台的 `(灰)+ `<span class="text-primary font-bold">56+</span>` + ` 个细分行业。 你也可以 `(灰)+ `<button class="text-primary underline-offset-2 hover:underline">自定义输入行业</button>` + ` 。`(灰)
- 点击 inline `自定义输入行业` btn · 触发 `CustomIndustryModal`

### 2.3 search input

- container · `relative max-w-3xl mb-6 mt-6`
- input · `w-full rounded-lg border border-border bg-card pl-10 pr-3 py-3 font-cn text-sm text-on-surface placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary`
- placeholder · `搜索行业名称或关键词（如：美容院、餐饮、教育...）`(已有 STEP1_SEARCH_PLACEHOLDER · 复用)
- search icon · `Search` left-3 top-1/2 -translate-y-1/2 text-muted-foreground

### 2.4 6 chip row(横排)

- container · `flex flex-wrap gap-3 mb-6`
- 每 chip · `rounded-lg px-4 py-2.5 font-cn text-sm transition-all cursor-pointer border`
- selected · `bg-primary/10 border-primary text-primary font-bold`
- unselected · `border-border bg-card text-muted-foreground hover:border-primary/40`
- chip 文字 · `${emoji} ${label} (${count})` · 例 · `🏠 生活服务 (18)` · 第一 chip 无 emoji · `全部行业 (56)`
- 6 chip 沿用现有 STEP1_TABS · 不动

### 2.5 已选 banner(条件渲染)

- container · `mt-6 mb-6 rounded-xl border border-primary/40 bg-primary/5 p-5 flex items-center justify-between gap-4`
- 左 · flex items-center gap-3 ·
  - emoji 大 `text-4xl`
  - vertical · 上 `已选择：${label}` font-cn text-base text-on-surface · 下 `关键词：${keywords.join('、')}` font-cn text-sm text-muted-foreground/80(仅当有 keywords)
- 右 · 金底大 btn ·
  - `bg-primary text-on-primary hover:bg-primary/90 rounded-lg px-6 py-3 font-cn font-bold flex items-center gap-2`
  - `Sparkles` icon 14 + `确认并进入下一步`

### 2.6 industry grid(IndustryEmojiGrid)

- 现有 `grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3` 视觉对
- 每 card · 增加选中右上角 `CheckCircle2` icon `absolute top-1.5 right-1.5 w-5 h-5 text-primary fill-primary/10`(card 加 `relative`)
- 选中态 · `bg-primary/5 border-primary` + ✓ icon · 未选中 `border-border` 无 ✓
- 每 card · 大 emoji `text-4xl mb-2` + label `font-cn text-sm text-on-surface`

### 2.7 底部 sticky bar(条件渲染 · 仅当 selectedIndustry 或 customIndustry 时显示)

- container · `fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md`
- inner · `container mx-auto px-4 py-3 flex items-center justify-between gap-4`
- 左 · flex items-center gap-2 ·
  - `font-cn text-sm text-muted-foreground` · `已选择`
  - emoji 大 `text-xl`
  - `font-cn text-base font-bold text-on-surface` · `${label}` 或 `${customIndustry}（自定义）`
- 右 · 金底 btn ·
  - `bg-primary text-on-primary hover:bg-primary/90 rounded-lg px-6 py-2.5 font-cn font-bold flex items-center gap-2`
  - `ArrowRight` 14 + `确认并进入下一步`

### 2.8 main padding

- 当 sticky bar 显示时 · `<main>` 需 `pb-24` 避免内容被 sticky bar 遮挡

---

## §3 · constants 改动 + 新建

### 3.1 `lib/constants/industries.ts`(改动 — 仅加新常量 · 不动 56 数据)

末尾追加 ·

```ts
// /step/1 page-specific 字面常量(D1 锁 · sally aiipznt 1:1)
export const STEP1_BREADCRUMB_CHIP = 'STEP 01' as const;
export const STEP1_BREADCRUMB_LABEL = '选择行业赛道' as const;
export const STEP1_PAGE_H1 = '选择你的行业赛道' as const;
export const STEP1_PAGE_H1_EMOJI = '🌐' as const;
export const STEP1_SUBTITLE_PART1 = '覆盖抖音、视频号等主流平台的 ' as const;
export const STEP1_SUBTITLE_COUNT = '56+' as const;
export const STEP1_SUBTITLE_PART2 = ' 个细分行业。 你也可以 ' as const;
export const STEP1_SUBTITLE_CUSTOM_LINK = '自定义输入行业' as const;
export const STEP1_SUBTITLE_PART3 = ' 。' as const;
export const STEP1_BANNER_PREFIX = '已选择：' as const;
export const STEP1_BANNER_KW_PREFIX = '关键词：' as const;
export const STEP1_CUSTOM_TAG = '（自定义）' as const;
export const STEP1_PAGE_CTA = '确认并进入下一步' as const;
export const STEP1_STICKY_PREFIX = '已选择' as const;
```

### 3.2 删除 / 不再用的常量

- `STEP1_CTA_LABEL = '生成行业洞察'` · 不再用(替换为 `STEP1_PAGE_CTA`)
- `STEP1_NEXT_LABEL = '进入 IP 定位 →'` · 不再用
- `STEP1_CTA_DISABLED_HINT = '请先选择一个行业'` · 不再用(banner / sticky bar 仅在选了之后显示 · disabled 状态消失)

注 · 保留这些常量不删(其他 page 可能用)· 仅 Step1.tsx 不 import。

---

## §4 · sub-component 改动

新建 / 修改 `apps/web/src/components/industry/` ·

| 文件 | 操作 | 用途 |
|---|---|---|
| `IndustryEmojiGrid.tsx` | **改** · 加选中右上 ✓ icon(`relative` + `CheckCircle2 absolute`)| 行业 grid |
| `Step1Breadcrumb.tsx` | **新建** | `STEP 01` chip + `>` + `选择行业赛道` |
| `Step1Banner.tsx` | **新建** | 已选 banner · emoji + label + 关键词 + 内嵌 ✨ CTA |
| `Step1StickyBar.tsx` | **新建** | 底部 sticky · 已选 + ArrowRight CTA |
| `CustomIndustryModal.tsx` | **保留**(不动) · 改 trigger 方式 | 复用现有 |

---

## §5 · page rewrite

`apps/web/src/pages/step/Step1.tsx`(201 → ~130 行) ·

```tsx
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CustomIndustryModal, type CustomIndustryModalHandle } from '@/components/industry/CustomIndustryModal';
import { IndustryEmojiGrid } from '@/components/industry/IndustryEmojiGrid';
import { Step1Banner } from '@/components/industry/Step1Banner';
import { Step1Breadcrumb } from '@/components/industry/Step1Breadcrumb';
import { Step1StickyBar } from '@/components/industry/Step1StickyBar';
import { EmptyState } from '@/components/states';
import {
  type Industry,
  STEP1_INDUSTRIES_56,
  STEP1_PAGE_H1,
  STEP1_PAGE_H1_EMOJI,
  STEP1_SEARCH_PLACEHOLDER,
  STEP1_SUBTITLE_COUNT,
  STEP1_SUBTITLE_CUSTOM_LINK,
  STEP1_SUBTITLE_PART1,
  STEP1_SUBTITLE_PART2,
  STEP1_SUBTITLE_PART3,
  STEP1_TABS,
} from '@/lib/constants/industries';
import { useRef } from 'react';

export default function Step1() {
  const navigate = useNavigate();
  const [activeTabId, setActiveTabId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [customIndustry, setCustomIndustry] = useState<string>('');
  const customModalRef = useRef<CustomIndustryModalHandle>(null);

  const activeTab = STEP1_TABS.find((t) => t.id === activeTabId) ?? STEP1_TABS[0]!;
  const tabFiltered = activeTabId === 'all' ? STEP1_INDUSTRIES_56 : STEP1_INDUSTRIES_56.filter((ind) => ind.category === activeTab.label);
  const filteredIndustries = searchQuery.trim()
    ? tabFiltered.filter((ind) => ind.label.includes(searchQuery) || (ind.keywords ?? []).some((kw) => kw.includes(searchQuery)))
    : tabFiltered;

  const hasSelection = !!selectedIndustry || !!customIndustry;

  function handleSelectIndustry(ind: Industry) {
    setSelectedIndustry(ind);
    setCustomIndustry('');
  }

  function handleCustomConfirm(value: string) {
    setCustomIndustry(value);
    setSelectedIndustry(null);
  }

  function handleSubmit() {
    if (!hasSelection) return;
    navigate('/step/3');
  }

  return (
    <main className={`flex-1 container py-8 ${hasSelection ? 'pb-24' : ''}`}>
      <Step1Breadcrumb />

      <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface flex items-center gap-3">
        <span>{STEP1_PAGE_H1_EMOJI}</span>
        <span>{STEP1_PAGE_H1}</span>
      </h1>

      <p className="font-cn text-base text-muted-foreground mt-3">
        {STEP1_SUBTITLE_PART1}
        <span className="text-primary font-bold">{STEP1_SUBTITLE_COUNT}</span>
        {STEP1_SUBTITLE_PART2}
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline"
          onClick={() => customModalRef.current?.open()}
        >
          {STEP1_SUBTITLE_CUSTOM_LINK}
        </button>
        {STEP1_SUBTITLE_PART3}
      </p>

      <div className="relative max-w-3xl mb-6 mt-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={STEP1_SEARCH_PLACEHOLDER}
          data-testid="industry-search"
          className="w-full rounded-lg border border-border bg-card pl-10 pr-3 py-3 font-cn text-sm text-on-surface placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {STEP1_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`tab-${tab.id}`}
            data-state={activeTabId === tab.id ? 'active' : 'inactive'}
            onClick={() => setActiveTabId(tab.id)}
            className={[
              'rounded-lg px-4 py-2.5 font-cn text-sm transition-all cursor-pointer border whitespace-nowrap',
              activeTabId === tab.id
                ? 'bg-primary/10 border-primary text-primary font-bold'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40',
            ].join(' ')}
          >
            {tab.id !== 'all' ? `${tab.emoji} ` : ''}{tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {selectedIndustry && (
        <Step1Banner industry={selectedIndustry} onConfirm={handleSubmit} />
      )}
      {customIndustry && (
        <Step1Banner customLabel={customIndustry} onConfirm={handleSubmit} />
      )}

      {filteredIndustries.length === 0 ? (
        <EmptyState title="未找到匹配的行业" description="尝试自定义输入" />
      ) : (
        <IndustryEmojiGrid
          industries={filteredIndustries}
          value={selectedIndustry}
          onChange={handleSelectIndustry}
        />
      )}

      <CustomIndustryModal ref={customModalRef} onConfirm={handleCustomConfirm} />

      {hasSelection && (
        <Step1StickyBar
          selectedEmoji={selectedIndustry?.emoji ?? '✨'}
          selectedLabel={selectedIndustry?.label ?? customIndustry}
          isCustom={!!customIndustry}
          onConfirm={handleSubmit}
        />
      )}
    </main>
  );
}
```

删 · `FadeInWrapper` 全部 + `useActiveAccount` + `useStepData(accountId,'step1')` + 旧顶部 banner + 底部独立 CTA btn + CustomIndustryModal 独立 trigger

注 · `CustomIndustryModal` 需要改成 forwardRef 暴露 `open()` 方法(若现有 modal 自带 trigger btn · 改为 trigger 可隐藏 + 暴露 open API)

---

## §6 · 文件清单

| 文件 | 操作 |
|---|---|
| `apps/web/src/lib/constants/industries.ts` | append 13 字面常量 |
| `apps/web/src/components/industry/Step1Breadcrumb.tsx` | 新建 |
| `apps/web/src/components/industry/Step1Banner.tsx` | 新建 |
| `apps/web/src/components/industry/Step1StickyBar.tsx` | 新建 |
| `apps/web/src/components/industry/IndustryEmojiGrid.tsx` | 改 · 加右上 ✓ icon |
| `apps/web/src/components/industry/CustomIndustryModal.tsx` | 改 · forwardRef 暴露 open() + 隐藏 trigger 模式 |
| `apps/web/src/pages/step/Step1.tsx` | rewrite 201 → ~130 行 |
| `apps/web/src/pages/step/__tests__/Step1.test.tsx` | 改 · 适配新结构 + mock-first(删 trpc mock) |

---

## §7 · 验收

D1 字面 grep · 必命中 ·
- `STEP 01` 1 次
- `选择行业赛道` 1 次(breadcrumb)
- `选择你的行业赛道` 1 次(h1 · 不含 🌐 部分)
- `🌐` 1 次(h1 prefix)
- `覆盖抖音、视频号等主流平台的` 1 次
- `56+` 1 次
- `个细分行业。` 1 次
- `自定义输入行业` 1 次(inline link)
- `搜索行业名称或关键词（如：美容院、餐饮、教育...）` 1 次
- 6 tab label 各 1 次(全部行业 / 生活服务 / 电商零售 / 内容创作 / 专业服务 / 产业制造)+ 6 count(56 / 18 / 13 / 7 / 14 / 4)
- 56 industry label 各 1 次(美业 / 美妆护肤 / 餐饮美食 / ... / 其他行业)
- 选中 美业 后 · `已选择：美业` 1 次 + `关键词：美容院、美发、美甲、美睫、纹绣` 1 次
- 选中后 · `确认并进入下一步` 2 次(顶 banner + 底 sticky)
- 选中后 · `已选择` 1 次(sticky bar prefix)

D2 · breadcrumb + h1 emoji + subtitle 内嵌 inline link + 6 chip + (banner 选中后) + 5 col grid + (sticky 选中后) · sally 视觉 1:1

D3 · click chip 切换 filter · click industry card 选中(✓ 显示)+ banner + sticky bar 显 · click inline `自定义输入行业` 触发 modal · click banner / sticky CTA 跳 `/step/3`

D4 · default state 无选中 · 选中后 banner + sticky · search filter · tab filter

D6 · typecheck + test 全绿

---

## §8 · Sonnet 执行流程

1. Read SPEC.md(本文件)+ Read Step1.tsx + industries.ts + IndustryEmojiGrid.tsx + CustomIndustryModal.tsx
2. append 13 常量到 `lib/constants/industries.ts`(§3.1)
3. 改 IndustryEmojiGrid.tsx · 加 ✓ icon(relative + CheckCircle2 absolute)
4. 改 CustomIndustryModal.tsx · forwardRef 暴露 open() 方法(隐藏 trigger btn 模式)
5. 新建 Step1Breadcrumb.tsx + Step1Banner.tsx + Step1StickyBar.tsx
6. rewrite Step1.tsx 按 §5 模板
7. 改 Step1.test.tsx · 删 trpc / useActiveAccount mock · 适配新结构(banner 测试 / sticky 测试 / inline link click)
8. 跑 `pnpm --filter @quanan/web typecheck` + `pnpm --filter @quanan/web test --run`
9. 报告

---

## §9 · 红线

- ❌ 改 56 行业数据(STEP1_INDUSTRIES_56)
- ❌ 改 6 tab 数据(STEP1_TABS)
- ❌ hardcode 字面(走 constants)
- ❌ 半角中文标点(`，` `：` `（）` `。` 全角 · sally 已确认)
- ❌ 保留 trpc useStepData / useActiveAccount 老逻辑
- ❌ 保留 FadeInWrapper(sally 无 animation)
- ❌ 删除 56 industry 中任一(其他 page 在用)
- ❌ 动 backend / `apps/api/`
- ❌ 装新 npm 包
- ❌ 改 router.tsx / Header.tsx 外层

---

## §10 · 注意

- `CustomIndustryModal` 当前实现是带自己的 trigger button。需改为支持两种模式 · A) 老式带 trigger(向后兼容)B) ref.open() 触发(本 page 用)。具体改动 ·
  - 在 modal 内加 `forwardRef` + `useImperativeHandle` 暴露 `{ open: () => void }`
  - 加 prop `hideTrigger?: boolean`(本 page 设 true · 不渲染老 trigger btn)
  - 或者 · 把 modal 内部 state 提到 page 自管 · 用 `<CustomIndustryModal open={isOpen} onOpenChange={...}>` controlled 模式(更简洁)
- 推荐 controlled 模式 · 简单清晰
