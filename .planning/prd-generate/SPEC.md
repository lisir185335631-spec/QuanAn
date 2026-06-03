# SPEC · /generate 1:1 复刻

> **目标** · `apps/web/src/pages/tools/Generate.tsx` 大改(255 → ~70 行)+ 4 sub-component · sally 2 col layout
> **风险** · M(SCRIPT_TYPES 20 + HOT_ELEMENTS 23 复用 · 8 段 mock 文案字面 1:1)

---

## §1 · 6 大偏离

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | h1 | `生成爆款文案`(可能含其他)| `生成爆款文案`(对) |
| 2 | subtitle | trpc 默认或不显 | `选择脚本类型和爆款元素，输入主题，AI为你生成AIP风格的短视频文案` |
| 3 | layout | 单 col vertical mode switch | 2 col grid · 左 form / 右 result |
| 4 | 数据源 | `trpc.copywriting.freeGenerate` + `trpc.copywriting.acquisitionGenerate` + ToolForm + ToolResult + URL state mode | mock-first · default 选 `opinion` (聊观点) + `resonance` (共鸣) + textarea fill + result 已显示 |
| 5 | element grid | 4 group(分组)| 2 col flat list(不分 group)· 23 chip 直接列 |
| 6 | result section | ToolResult 老结构 | 简单 result 标题 + 3 action btn(复制 / AI优化 / 重新开始)+ 8 段 mock 文案 + 反馈 |

---

## §2 · 字面 + 视觉

### 2.1 Hero

- h1 · `生成爆款文案` 白
- subtitle · `选择脚本类型和爆款元素，输入主题，AI为你生成AIP风格的短视频文案` 灰

### 2.2 2 col grid

- container · `grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6`

### 2.3 左 form section

**A. 选择脚本类型**
- container · `rounded-2xl border border-primary/20 bg-card p-6`
- h2 · `选择脚本类型` 白
- 2 col grid `grid grid-cols-2 gap-3 mt-4` · 20 card · 每 card ·
  - `rounded-xl border border-border bg-card px-4 py-3 cursor-pointer hover:border-primary/40 transition`
  - selected · `border-primary text-primary bg-primary/5`
  - inside · title `font-cn font-bold text-base mb-1` + desc `font-cn text-xs text-muted-foreground/70 leading-relaxed line-clamp-2`

复用 SCRIPT_TYPES 20 数据(`label` + `desc`)

**B. 爆款元素（可多选）**
- container · `rounded-2xl border border-primary/20 bg-card p-6`
- h2 · `爆款元素（可多选）` 白
- 2 col grid `grid grid-cols-2 gap-3 mt-4` · 23 chip · 每 chip ·
  - `rounded-lg border border-border bg-card px-4 py-2.5 cursor-pointer flex items-center gap-2 font-cn text-sm hover:border-primary/40 transition`
  - selected · `border-primary text-primary bg-primary/10 font-bold`
  - inside · `{emoji}` + `{label}`

复用 HOT_ELEMENTS 23 数据(flat 列表 · 跨 4 group 拼接)

**C. 文案主题**
- container · `rounded-2xl border border-primary/20 bg-card p-6`
- h2 · `文案主题` 白
- textarea · `min-h-[100px] rounded-lg border border-border bg-input px-4 py-3 font-cn text-sm mt-4 placeholder:text-muted-foreground/60`
- default value · `如何在3天内涨粉1万、新手做短视频最容易犯的3个错误`
- 字符 count · `text-xs text-muted-foreground/60 mt-1 text-right` · `{n}/500` · default `26/500`
- CTA btn · 居中 · `bg-primary text-on-primary hover:bg-primary/90 rounded-full px-10 py-3 font-cn font-bold flex items-center gap-2 mt-4 mx-auto`
- icon · `Sparkles` + `生成文案`

### 2.4 右 result section

- container · `rounded-2xl border border-primary/20 bg-card p-6`
- top row · flex justify-between items-center
  - 左 h2 · `生成结果` 白
  - 右 3 action btn(flex gap-3)·
    - `Copy` icon + `复制` 灰 hover 金
    - `Sparkles` icon + `AI优化` 金边 chip
    - `RotateCcw` icon + `重新开始` 灰
- body · `mt-6 space-y-4 font-cn text-sm text-on-surface leading-relaxed`
  - 8 段 mock 文案 · 每段独立 `<p>` · 每段前缀 + body

mock 8 段(字面 1:1 sally)·

```
段 1 · 【标题】你做短视频涨粉慢，不是内容不好，是你从一开始就错了

段 2 · 【炸裂开头】 你是不是也这样：做企业服务好几年，也知道短视频是趋势，但一拍视频就头疼，播放量上不去，涨粉更是遥遥无期，感觉自己就像个局外人?

段 3 · 【论证一】 我看了不下500个企业服务账号，发现一个普遍现象：很多人一上来就想"涨粉1万"，然后拼命追热点、学剪辑。结果呢? 内容东拼西凑，风格变来变去，粉丝涨得慢不说，来的还都是泛粉，根本转化不了。你以为你在努力，其实你在瞎忙。

段 4 · 【论证二】 还有一种，觉得内容为王，就开始讲行业知识、企业文化，恨不得把公司所有优势都塞进一个视频。但你有没有想过，用户刷到你的视频，他不是来听课的，他更关心的是：你能不能解决我的问题? 你的内容能不能让我省钱、省事、省心? 如果你的视频没第一时间回答这个问题，用户根本不会停留。

段 5 · 【论证三】 最要命的是，很多人把短视频当成了"宣传册"，把公司介绍、产品功能一股脑地往外倒。这就像你第一次跟客户见面，还没了解对方需求，就直接掏出合同让人签字。你觉得客户会怎么想? 短视频是建立信任的工具，不是销售的终点。你越想卖，客户就越跑。

段 6 · 【深层洞察】 所以本质上，你做短视频涨粉慢，不是因为你内容不好，也不是因为你不会剪辑，而是你从一开始就没搞清楚短视频的底层逻辑——它不是一个"宣传"工具，而是一个"筛选"工具。它筛选的不是你的产品，而是那些真正需要你、信任你、愿意为你付费的精准客户。

段 7 · 【收尾】 如果你还在用"宣传"思维做短视频，那你的努力，可能只会让你离目标越来越远。你是不是也觉得，是时候换个思路了?

段 8 · 【话题标签】 #企业服务短视频 #短视频涨粉 #短视频运营 #精准获客 #商业洞察
```

注 · 每段 label 用 `【...】` 全角方括号(sally 真实) · 不是 ASCII `[...]`

### 2.5 底部反馈 row

- `mt-6 flex items-center gap-3 text-sm text-muted-foreground`
- `这个结果对你有帮助吗?` + 👍 ThumbsUp + 👎 ThumbsDown btn

---

## §3 · constants 新建

`lib/constants/generatePage.ts` ·

```ts
export const GENERATE_H1 = '生成爆款文案' as const;
export const GENERATE_SUBTITLE = '选择脚本类型和爆款元素，输入主题，AI为你生成AIP风格的短视频文案' as const;
export const GENERATE_SCRIPT_TITLE = '选择脚本类型' as const;
export const GENERATE_ELEMENTS_TITLE = '爆款元素（可多选）' as const;
export const GENERATE_TOPIC_TITLE = '文案主题' as const;
export const GENERATE_TOPIC_DEFAULT = '如何在3天内涨粉1万、新手做短视频最容易犯的3个错误' as const;
export const GENERATE_TOPIC_MAXLEN = 500 as const;
export const GENERATE_CTA = '生成文案' as const;
export const GENERATE_RESULT_TITLE = '生成结果' as const;
export const GENERATE_BTN_COPY = '复制' as const;
export const GENERATE_BTN_AI_OPT = 'AI优化' as const;
export const GENERATE_BTN_RESTART = '重新开始' as const;
export const GENERATE_FEEDBACK_PROMPT = '这个结果对你有帮助吗?' as const;
export const GENERATE_DEFAULT_SCRIPT_KEY = 'opinion' as const;
export const GENERATE_DEFAULT_ELEMENT_KEYS = ['resonance'] as const;

export const GENERATE_RESULT_PARAGRAPHS: ReadonlyArray<{ label: string; body: string }> = [
  { label: '【标题】', body: '你做短视频涨粉慢，不是内容不好，是你从一开始就错了' },
  { label: '【炸裂开头】', body: '你是不是也这样：做企业服务好几年，也知道短视频是趋势，但一拍视频就头疼，播放量上不去，涨粉更是遥遥无期，感觉自己就像个局外人?' },
  { label: '【论证一】', body: '我看了不下500个企业服务账号，发现一个普遍现象：很多人一上来就想"涨粉1万"，然后拼命追热点、学剪辑。结果呢? 内容东拼西凑，风格变来变去，粉丝涨得慢不说，来的还都是泛粉，根本转化不了。你以为你在努力，其实你在瞎忙。' },
  { label: '【论证二】', body: '还有一种，觉得内容为王，就开始讲行业知识、企业文化，恨不得把公司所有优势都塞进一个视频。但你有没有想过，用户刷到你的视频，他不是来听课的，他更关心的是：你能不能解决我的问题? 你的内容能不能让我省钱、省事、省心? 如果你的视频没第一时间回答这个问题，用户根本不会停留。' },
  { label: '【论证三】', body: '最要命的是，很多人把短视频当成了"宣传册"，把公司介绍、产品功能一股脑地往外倒。这就像你第一次跟客户见面，还没了解对方需求，就直接掏出合同让人签字。你觉得客户会怎么想? 短视频是建立信任的工具，不是销售的终点。你越想卖，客户就越跑。' },
  { label: '【深层洞察】', body: '所以本质上，你做短视频涨粉慢，不是因为你内容不好，也不是因为你不会剪辑，而是你从一开始就没搞清楚短视频的底层逻辑——它不是一个"宣传"工具，而是一个"筛选"工具。它筛选的不是你的产品，而是那些真正需要你、信任你、愿意为你付费的精准客户。' },
  { label: '【收尾】', body: '如果你还在用"宣传"思维做短视频，那你的努力，可能只会让你离目标越来越远。你是不是也觉得，是时候换个思路了?' },
  { label: '【话题标签】', body: '#企业服务短视频 #短视频涨粉 #短视频运营 #精准获客 #商业洞察' },
];
```

---

## §4 · sub-component 新建

`apps/web/src/pages/tools/components/generate/` ·

| 文件 | 用途 |
|---|---|
| `GenerateHero.tsx` | h1 + subtitle |
| `GenerateScriptPicker.tsx` | h2 + 20 script type 2 col grid card · 复用 SCRIPT_TYPES |
| `GenerateElementsPicker.tsx` | h2 + 23 element 2 col grid chip · 复用 ALL_ELEMENTS |
| `GenerateTopicForm.tsx` | h2 + textarea + count + 生成文案 CTA |
| `GenerateResult.tsx` | top row(h2 + 3 action btn)+ 8 段 mock + 反馈 |

---

## §5 · page rewrite

`apps/web/src/pages/tools/Generate.tsx`(255 → ~70 行) ·

```tsx
import { useState } from 'react';

import { GenerateElementsPicker } from './components/generate/GenerateElementsPicker';
import { GenerateHero } from './components/generate/GenerateHero';
import { GenerateResult } from './components/generate/GenerateResult';
import { GenerateScriptPicker } from './components/generate/GenerateScriptPicker';
import { GenerateTopicForm } from './components/generate/GenerateTopicForm';
import {
  GENERATE_DEFAULT_ELEMENT_KEYS,
  GENERATE_DEFAULT_SCRIPT_KEY,
  GENERATE_TOPIC_DEFAULT,
} from '@/lib/constants/generatePage';

export default function Generate() {
  const [scriptKey, setScriptKey] = useState(GENERATE_DEFAULT_SCRIPT_KEY);
  const [elementKeys, setElementKeys] = useState<string[]>([...GENERATE_DEFAULT_ELEMENT_KEYS]);
  const [topic, setTopic] = useState(GENERATE_TOPIC_DEFAULT);

  return (
    <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
      <GenerateHero />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GenerateScriptPicker value={scriptKey} onChange={setScriptKey} />
          <GenerateElementsPicker value={elementKeys} onChange={setElementKeys} />
          <GenerateTopicForm value={topic} onChange={setTopic} />
        </div>
        <GenerateResult />
      </div>
    </main>
  );
}
```

删 · trpc / FadeInWrapper / FeedbackButton / inline-pickers 老 / ToolForm / ToolResult / mode switch / URL state / abort controller 全部

---

## §6 · 文件清单

| 文件 | 操作 |
|---|---|
| `apps/web/src/lib/constants/generatePage.ts` | 新建 |
| `apps/web/src/pages/tools/components/generate/` 5 sub-component | 新建 |
| `apps/web/src/pages/tools/Generate.tsx` | rewrite 255 → ~70 行 |
| `apps/web/src/pages/tools/__tests__/Generate.test.tsx`(若存在) | 改 / 简化 |

---

## §7 · 验收

D1 字面 grep · 必命中 ·
- `生成爆款文案` 2 次(h1 + CTA)· 或 h1 1 + CTA `生成文案` 1
- `选择脚本类型和爆款元素，输入主题，AI为你生成AIP风格的短视频文案` 1 次
- `选择脚本类型` 1 次
- 20 script type label 各 1 次(聊观点 / 晒过程 / ... / 打鸡血)
- `爆款元素（可多选）` 1 次
- 23 element label 至少 5 个(贪念 / 恐惧 / 共鸣 / ... 等)
- `文案主题` 1 次
- `如何在3天内涨粉1万、新手做短视频最容易犯的3个错误` 1 次(default textarea)
- `26/500` 或 `500` 1 次(字符 count)
- `生成文案` 1 次(CTA)
- `生成结果` 1 次
- `复制` / `AI优化` / `重新开始` 各 1 次
- 8 段 label 各 1 次(【标题】/【炸裂开头】/【论证一】/【论证二】/【论证三】/【深层洞察】/【收尾】/【话题标签】)
- 8 段 body 关键句各 1 次
- `这个结果对你有帮助吗?` 1 次

D2 · 2 col layout · 左 form(script + element + topic)/ 右 result · sally 1:1

D3 · script type click 选中 · element click 多选 · textarea 改 / count 同步 · CTA click no-op

D6 · typecheck + 测试

---

## §8 · Sonnet 执行流程

1. Read SPEC.md + 现 Generate.tsx + scripts.ts + elements.ts + AcquisitionVideo.tsx(参考)
2. 写 `lib/constants/generatePage.ts`(完整 8 段 mock + 15 字面)
3. 写 5 sub-component
4. rewrite Generate.tsx
5. 改 __tests__/Generate.test.tsx(若有 · 简化字面锁)
6. 跑 typecheck + 测试
7. 报告

---

## §9 · 红线

- ❌ hardcode 字面(走 constants)
- ❌ 半角中文标点(`，` `：` `（）` `。` `"` `【】` 全角)
- ❌ 保留 trpc.copywriting.freeGenerate / acquisitionGenerate / ToolForm / ToolResult / mode switch / URL state / FadeInWrapper / FeedbackButton / inline-pickers 老
- ❌ 改 SCRIPT_TYPES / HOT_ELEMENTS / ALL_ELEMENTS
- ❌ 动 backend / `apps/api/`
- ❌ 装新 npm 包
- ❌ 改 router.tsx / Header.tsx 外层
- ❌ 缩减 8 段 mock 字面(完整保留)
