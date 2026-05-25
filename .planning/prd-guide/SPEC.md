# SPEC · /guide 1:1 复刻

> **目标** · `apps/web/src/pages/Guide.tsx` 全文 rewrite + 扩 `guide.ts` constants · sally USER GUIDE 1:1
> **截图** · 16 张 · 14 section accordion + 推荐流程 + 5 FAQ
> **风险** · L+(全 generic 操作说明字面 · 0 sally 长 IP content · 现有 constants 已含 13 模块基础)

---

## §1 · 5 大偏离(现状 → sally)

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | header | H1 USER GUIDE + subtitle · 无 chip 框 | chip card 含 book icon + USER GUIDE 金大字 + subtitle 2 行(在 chip 内) |
| 2 | 推荐使用流程 | 5 卡 grid · 仅数字+title+desc · 无 icon · 无箭头 | 5 卡含 大圆 icon(Brain/Dollar/Zap/Clapperboard/Users)+ name + sub · `→` 箭头连(横向) |
| 3 | 14 section 视觉 | 13 link card grid(非 accordion · 直接 link) | 14 accordion(chevron 折叠 · default 全展开)· 每 section 3 numbered step + 实用技巧 box · 含"系统概览"为 section 1 |
| 4 | "实用技巧"box | 无 | 每 section 底部含灯泡 icon + "实用技巧" + 2-3 ✓ bullet |
| 5 | 5 FAQ 视觉 | 卡 list | 5 卡含 ★ star icon prefix + Q bold + a desc |

---

## §2 · 视觉规范

### 2.1 Icon 映射(lucide-react)

| 用途 | icon |
|---|---|
| chip book | `BookOpen` 金 |
| 推荐流程 标题前 | `Rocket` 金 |
| 推荐流程 5 卡 icon | `Brain` / `DollarSign` / `Zap` / `Clapperboard` / `Users` |
| 流程箭头 | `ChevronRight` 金 |
| 14 section icon | `Shield`(系统概览)/ `TrendingUp`(爆款库)/ `Video`(爆款解析)/ `LayoutGrid`(呈现形式)/ `DollarSign`(变现模型)/ `Users`(私域成交)/ `Zap`(爆款生成)/ `Sparkles`(生成文案)/ `Search`(文案分析)/ `Clapperboard`(AI视频)/ `Mic`(语音对话)/ `Brain`(深度学习)/ `Film`(视频制作)/ `Target`(获客视频) |
| accordion chevron | `ChevronUp` / `ChevronDown` |
| step 圆 prefix | 数字圆(金 bg + 黑数字) |
| 实用技巧 box icon | `Lightbulb` 金 |
| 实用技巧 ✓ bullet | `CheckCircle2` 金 |
| 常见问题 标题前 | `AlertCircle` 金 |
| FAQ 卡 star prefix | `Star` 金(filled) |

### 2.2 layout

- main · `max-w-5xl mx-auto py-8 space-y-8`
- header · `flex flex-col items-start gap-4`
- 推荐流程 card · `rounded-xl border + bg-card + p-6`
- 5 step grid · `grid grid-cols-1 md:grid-cols-5 gap-2`(箭头放每两段之间)
- search · `max-w-md` 居中
- 14 accordion stack · `space-y-3`
- accordion · `rounded-xl border + bg-card`
- accordion header · `flex justify-between p-5 cursor-pointer`(左 icon 圆 + name + sub)(右 chevron)
- accordion body · `p-5 pt-0 space-y-6`(默认展开)
- 实用技巧 box · `rounded-lg border + bg-card/40 + p-4`
- FAQ stack · `space-y-3`

---

## §3 · 字面源

### 3.1 chip card

- chip title · `USER GUIDE`(uppercase 金大字 tracking-wider)
- chip subtitle · `产品使用说明 · 功能详解 · 最佳实践`(灰)

### 3.2 推荐使用流程(5 步)

- H2 · `推荐使用流程`(Rocket icon 金 prefix)
- 5 step ·

| # | icon | name | sub |
|:-:|---|---|---|
| 1 | Brain | `深度学习` | `批量文案分析` |
| 2 | DollarSign | `设计变现` | `规划盈利模式` |
| 3 | Zap | `创作内容` | `爆款文案生成` |
| 4 | Clapperboard | `制作视频` | `AI辅助制作` |
| 5 | Users | `私域成交` | `转化变现` |

### 3.3 search

- placeholder · `搜索功能说明...`

### 3.4 14 section accordion(每 section: icon + name + sub + 3 numbered step + tips)

> 复用现有 `GUIDE_MODULES` 13 entry 的 steps 数据 · 但需扩 4 个字段 · `subtitle` / `tips[]` · 并新增 `system_overview` 作为 section 1

字面源 ·

#### Section 1 · 系统概览(新)
- icon · `Shield`
- name · `系统概览`
- sub · `了解AIP智能体的核心能力`
- 3 step ·
  - `什么是AIP智能体？` · `AIP智能体是一款专为IP变现设计的AI智能工具，集成了爆款创作、视频制作、语音对话、深度学习等多项AI能力，帮助你快速打造个人IP并实现变现。`
  - `核心定位` · `从行业洞察 → 内容创作 → 流量变现，覆盖IP变现全链路。无论你是刚起步的创作者，还是需要提效的成熟IP，都能找到适合的工具。`
  - `使用前准备` · `1. 登录账号（点击右上角登录按钮）\n2. 选择你所在的行业领域\n3. 根据需求选择对应功能模块`
- tips ·
  - `建议先完成行业选择，这样AI会根据你的行业提供更精准的建议`
  - `所有AI生成的内容都可以复制和导出`

#### Section 2 · 爆款库
- icon · `TrendingUp`
- name · `爆款库`
- sub · `全网爆款内容实时追踪`
- 3 step ·
  - `选择行业分类` · `选择你所在的行业，系统会自动抓取该行业最新的爆款内容。`
  - `浏览爆款内容` · `查看各平台（抖音、小红书、视频号）的爆款文案、视频和话题。`
  - `收藏和学习` · `收藏你感兴趣的爆款内容，分析其爆款元素，为自己的创作提供灵感。`
- tips ·
  - `每天花10分钟浏览爆款库，培养爆款感觉`
  - `关注爆款的开头和结构，而非简单模仿`

#### Section 3 · 爆款解析
- icon · `Video`
- name · `爆款解析`
- sub · `拆解爆款视频的成功密码`
- 3 step ·
  - `输入视频链接或文案` · `粘贴你想分析的爆款视频链接或文案内容。`
  - `AI深度拆解` · `AI会从选题角度、开头设计、内容结构、爆款元素、情绪节奏等维度进行拆解。`
  - `一键改写` · `基于分析结果，AI可以帮你一键改写成适合你风格的文案。`
- tips ·
  - `分析爆款时重点关注前3秒的开头设计`
  - `改写时融入自己的行业特色和个人风格`

#### Section 4 · 呈现形式
- icon · `LayoutGrid`
- name · `呈现形式`
- sub · `多样化的内容呈现方式`
- 3 step ·
  - `浏览呈现形式库` · `查看口播、情景剧、vlog、图文、直播切片等多种内容呈现形式。`
  - `了解各形式特点` · `每种形式都有详细的适用场景、优势分析和制作要点说明。`
  - `选择适合的形式` · `根据你的行业和个人特点，选择最适合的1-2种呈现形式深耕。`
- tips ·
  - `新手建议从口播开始，门槛低且容易出效果`
  - `不要贪多，先专注做好1种形式再扩展`

#### Section 5 · 变现模型
- icon · `DollarSign`
- name · `变现模型`
- sub · `定制你的IP变现策略`
- 3 step ·
  - `输入行业和产品信息` · `告诉AI你的行业、产品/服务、目标客户等基本信息。`
  - `生成变现模型` · `AI会根据你的情况，生成包含前端引流产品、中端转化产品、后端利润产品的完整变现模型。`
  - `优化变现路径` · `AI会给出具体的定价策略、转化话术和私域运营建议。`
- tips ·
  - `变现模型要定期根据数据反馈进行调整`
  - `先跑通最小闭环，再扩大规模`

#### Section 6 · 私域成交
- icon · `Users`
- name · `私域成交`
- sub · `打造高转化的私域成交体系`
- 3 step ·
  - `设定成交场景` · `选择你的成交场景（微信私聊、社群、朋友圈等）和产品类型。`
  - `生成成交方案` · `AI会生成完整的私域成交方案，包括引流话术、破冰话术、需求挖掘、异议处理、逼单话术等。`
  - `实战应用` · `将AI生成的话术模板应用到实际成交场景中，根据反馈持续优化。`
- tips ·
  - `私域成交的关键是建立信任，不要急于推销`
  - `定期复盘对话记录，优化话术效果`

#### Section 7 · 爆款生成
- icon · `Zap`
- name · `爆款生成`
- sub · `融合爆款元素一键生成文案`
- 3 step ·
  - `选择爆款元素` · `从反差、悬念、共鸣、争议、干货、故事、数据、痛点等爆款元素中选择1-3个。`
  - `设定主题方向` · `输入你想创作的主题或方向（可选），AI会结合爆款元素自动生成。`
  - `获取5篇爆款文案` · `AI会一次性生成5篇融合所选爆款元素的文案，每篇采用不同的切入角度。`
- tips ·
  - `建议每次选2-3个爆款元素组合使用`
  - `生成后可以在"生成文案"模块进一步优化`

#### Section 8 · 生成文案
- icon · `Sparkles`
- name · `生成文案`
- sub · `AI智能文案创作与优化`
- 3 step ·
  - `选择脚本类型` · `选择观点型、故事型、干货型、情感型等脚本类型。`
  - `输入创作要求` · `输入主题、关键词、目标受众等信息，AI会根据你的风格档案生成文案。`
  - `优化和导出` · `对生成的文案进行AI优化，调整语气、长度、风格，满意后复制导出。`
- tips ·
  - `先在"智能进化"中设置你的风格档案，生成的文案会更贴合你的风格`
  - `善用优化功能，一篇文案可以反复优化3-5次`

#### Section 9 · 文案分析
- icon · `Search`
- name · `文案分析`
- sub · `AI分析文案结构和优化建议`
- 3 step ·
  - `粘贴文案` · `将你写好的文案或看到的好文案粘贴到分析框中。`
  - `获取分析报告` · `AI会从结构、节奏、情绪曲线、爆款元素、开头吸引力等维度进行分析。`
  - `应用优化建议` · `根据AI的分析建议，针对性地优化你的文案。`
- tips ·
  - `先分析10篇同行爆款，找到行业内容规律`
  - `重点优化开头3秒和结尾引导`

#### Section 10 · AI视频
- icon · `Clapperboard`
- name · `AI视频`
- sub · `文案一键转视频分镜`
- 4 step ·
  - `输入文案` · `将你的短视频文案粘贴到输入框中。`
  - `选择风格和比例` · `选择视觉风格（电影质感/赛博朋克/写实/卡通/极简）和画面比例（竖屏/横屏/方形）。`
  - `生成分镜脚本` · `AI会自动将文案拆解为4-8个分镜场景，包含画面描述、旁白、镜头运动、转场等详细信息。`
  - `生成场景图片` · `点击每个分镜的"生成图片"按钮，AI会根据画面描述生成对应的场景图片。也可以一键生成全部图片。`
- tips ·
  - `赛博朋克风格适合科技/潮流类内容`
  - `生成的分镜脚本可以直接交给剪辑师执行`

#### Section 11 · 语音对话
- icon · `Mic`
- name · `语音对话`
- sub · `AI语音智能助手`
- 3 step ·
  - `开始对话` · `点击麦克风按钮开始语音输入，或直接在输入框中打字。`
  - `语音交互` · `AI会自动识别你的语音并转为文字，然后给出专业的回答。开启语音播报后，AI的回答会自动朗读。`
  - `多轮对话` · `支持连续多轮对话，AI会记住上下文，提供更精准的建议。`
- tips ·
  - `语音对话适合碎片化时间学习和咨询`
  - `可以问任何关于IP变现、文案创作的问题`

#### Section 12 · 深度学习
- icon · `Brain`
- name · `深度学习`
- sub · `批量添加文案，AI深度分析风格逻辑`
- 3 step ·
  - `批量添加文案` · `粘贴或输入你的文案样本，最多支持50篇。`
  - `AI深度分析` · `AI会分析文案的写作风格、内容逻辑、语言特征等。`
  - `应用到创作` · `学习完成后，文案生成时可选择已学习的风格模板。`
- tips ·
  - `添加5-10篇代表作效果最佳`
  - `可以创建多个风格模板，适用于不同场景`

#### Section 13 · 视频制作
- icon · `Film`
- name · `视频制作`
- sub · `AI辅助视频脚本制作`
- 3 step ·
  - `输入视频主题` · `告诉AI你想制作什么类型的视频，包括主题、时长、风格等。`
  - `生成完整脚本` · `AI会生成包含分镜、台词、画面描述、BGM建议的完整视频脚本。`
  - `导出执行` · `将脚本导出，按照分镜指导进行拍摄和剪辑。`
- tips ·
  - `视频脚本要先写好再开拍，避免临场发挥`
  - `BGM建议结合内容情绪选择`

#### Section 14 · 获客视频
- icon · `Target`
- name · `获客视频`
- sub · `制作高转化获客视频方案`
- 3 step ·
  - `设定获客目标` · `输入你的产品/服务、目标客户画像、核心卖点等信息。`
  - `生成获客方案` · `AI会生成包含视频脚本、投放策略、转化路径的完整获客方案。`
  - `执行和优化` · `按照方案执行，根据数据反馈持续优化获客效果。`
- tips ·
  - `获客视频的关键是清晰的钩子和明确的引导`
  - `定期 A/B 测试不同钩子的转化效果`

### 3.5 常见问题(5 FAQ)

- H2 · `常见问题`(AlertCircle icon 金 prefix)
- 5 FAQ ·

| # | Q | A |
|:-:|---|---|
| 1 | `AI生成的内容可以直接使用吗？` | `AI生成的内容是高质量的初稿，建议根据你的实际情况和个人风格进行适当调整后使用。` |
| 2 | `语音对话支持哪些语言？` | `目前主要支持中文语音识别和对话，AI回答也以中文为主。` |
| 3 | `AI视频功能可以直接生成视频吗？` | `目前AI视频功能会生成详细的分镜脚本和场景图片，你可以根据这些素材在剪辑软件中快速制作视频。` |
| 4 | `如何让AI更了解我的风格？` | `使用"智能进化"功能，上传你的代表作品，AI会学习你的写作风格，后续生成的内容会更贴合你的特点。` |
| 5 | `数据会被保存吗？` | `你的所有生成记录都会保存在"历史记录"中，可以随时查看和复用。` |

---

## §4 · constants 改动

### 4.1 `lib/constants/guide.ts` · 大改

```ts
import type { LucideIcon } from 'lucide-react';
import {
  Brain, Clapperboard, DollarSign, Film, LayoutGrid, Mic, Search,
  Shield, Sparkles, Target, TrendingUp, Users, Video, Zap,
} from 'lucide-react';

// ── header ──────────────────────────────────────────────────────────────────
export const GUIDE_CHIP_TITLE = 'USER GUIDE' as const;
export const GUIDE_CHIP_SUBTITLE = '产品使用说明 · 功能详解 · 最佳实践' as const;

// ── 推荐使用流程 ─────────────────────────────────────────────────────────────
export const GUIDE_FLOW_TITLE = '推荐使用流程' as const;

export interface FlowStep {
  icon: LucideIcon;
  name: string;
  sub: string;
}

export const GUIDE_FLOW: ReadonlyArray<FlowStep> = [
  { icon: Brain,        name: '深度学习', sub: '批量文案分析' },
  { icon: DollarSign,   name: '设计变现', sub: '规划盈利模式' },
  { icon: Zap,          name: '创作内容', sub: '爆款文案生成' },
  { icon: Clapperboard, name: '制作视频', sub: 'AI辅助制作' },
  { icon: Users,        name: '私域成交', sub: '转化变现' },
];

// ── search ──────────────────────────────────────────────────────────────────
export const GUIDE_SEARCH_PLACEHOLDER = '搜索功能说明...' as const;

// ── 14 section ──────────────────────────────────────────────────────────────
export interface SectionStep {
  title: string;
  desc: string;
}

export interface GuideSection {
  id: string;
  icon: LucideIcon;
  name: string;
  sub: string;
  steps: ReadonlyArray<SectionStep>;
  tips: ReadonlyArray<string>;
}

export const GUIDE_SECTIONS_14: ReadonlyArray<GuideSection> = [
  // SPEC §3.4 14 entry · 完整字面 copy
  // ... (14 完整 from SPEC §3.4)
];

// ── FAQ ─────────────────────────────────────────────────────────────────────
export const GUIDE_FAQ_TITLE = '常见问题' as const;

export interface FAQ {
  q: string;
  a: string;
}

export const GUIDE_FAQS_5: ReadonlyArray<FAQ> = [
  // SPEC §3.5 5 entry · 完整字面 copy
];

// ── 实用技巧 box label ──────────────────────────────────────────────────────
export const GUIDE_TIPS_TITLE = '实用技巧' as const;
```

### 4.2 现有 const 删 / 保留

- 删 · 老 `GUIDE_MODULES`(13 项 emoji 版)· 替为 GUIDE_SECTIONS_14(14 项 含 tips)
- 删 · 老 `FAQS`(5 项 generic 版)· 替为 GUIDE_FAQS_5(对齐 sally 字面)
- 保留 · `GuideModule` / `FAQ` interface 兼容(其他 page 可能用)

`lib/constants/guide-faq.ts` · 保留旧 export(其他 page 引用)· 但 Guide.tsx 改用新 GUIDE_FAQS_5

---

## §5 · sub-component 设计

新建组件(`apps/web/src/components/guide/`)·

| 文件 | 用途 |
|---|---|
| `GuideChip.tsx` | book icon + USER GUIDE chip + subtitle |
| `FlowSection.tsx` | 推荐使用流程 + 5 step grid + 箭头连 |
| `FlowCard.tsx` | 单 flow step(icon 圆 + name + sub) |
| `SectionAccordion.tsx` | 单 section accordion(header + body 折叠) |
| `SectionHeader.tsx` | accordion header(icon 圆 + name + sub + chevron 右) |
| `SectionStepsList.tsx` | 3+ numbered step list(数字圆 + title + desc) |
| `TipsBox.tsx` | 灯泡 icon + 实用技巧 + ✓ bullet list |
| `FAQSection.tsx` | 常见问题 H2 + 5 FAQCard |
| `FAQCard.tsx` | star prefix + Q + A |

---

## §6 · page rewrite

### 6.1 `apps/web/src/pages/Guide.tsx` · 大改(182 → ~60 行)

```tsx
import { useState } from 'react';

import { GuideChip } from '@/components/guide/GuideChip';
import { FlowSection } from '@/components/guide/FlowSection';
import { SectionAccordion } from '@/components/guide/SectionAccordion';
import { FAQSection } from '@/components/guide/FAQSection';
import { Input } from '@/components/ui/input';
import { GUIDE_SECTIONS_14, GUIDE_SEARCH_PLACEHOLDER } from '@/lib/constants/guide';

export default function Guide() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery
    ? GUIDE_SECTIONS_14.filter(s =>
        s.name.includes(searchQuery) || s.sub.includes(searchQuery),
      )
    : GUIDE_SECTIONS_14;

  return (
    <main className="flex-1 container mx-auto max-w-5xl py-8 space-y-8">
      <GuideChip />
      {!searchQuery && <FlowSection />}
      <Input
        type="search"
        placeholder={GUIDE_SEARCH_PLACEHOLDER}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />
      <div className="space-y-3">
        {filtered.map((section) => <SectionAccordion key={section.id} section={section} />)}
      </div>
      <FAQSection />
    </main>
  );
}
```

---

## §7 · 文件清单

| 文件 | 操作 |
|---|---|
| `lib/constants/guide.ts` | **大改** · 删 GUIDE_MODULES/FAQS · 加 GUIDE_CHIP/FLOW/SECTIONS_14/FAQS_5 等(SPEC §4.1) |
| `components/guide/` 9 子组件 | **新建** |
| `pages/Guide.tsx` | **rewrite** 182 → 60 行 |
| 老 test(若存) | 改字面对齐 / 新建 |

**不动** · `FUNCTION_MATRIX`(其他 page 用) / `guide-faq.ts`(其他 page 可能用)

---

## §8 · 验收(5 维度)

### D1 · 字面

innerText grep · 必命中 ·
- `USER GUIDE` 1+ 次
- `产品使用说明 · 功能详解 · 最佳实践` 1 次
- `推荐使用流程` 1 次 + 5 step name(深度学习/设计变现/创作内容/制作视频/私域成交)
- `搜索功能说明` 1 次
- 14 section name(系统概览/爆款库/爆款解析/呈现形式/变现模型/私域成交/爆款生成/生成文案/文案分析/AI视频/语音对话/深度学习/视频制作/获客视频)各 1 次
- `实用技巧` 14 次
- `常见问题` 1 次 + 5 Q 各 1 次
- 字面命中率 ≥ 99%

### D2 · 视觉

- chip 顶 book icon 金
- 推荐流程 5 卡 + 箭头连
- search input 居中 max-w-md
- 14 accordion 默认全展开 · 每 header icon 圆 + sub
- 实用技巧 box 14 个 · 灯泡 + ✓ bullet
- 常见问题 5 卡 · star prefix

### D3 · 交互

- search · 实时过滤 14 section
- accordion · chevron click 折叠
- 推荐流程 5 卡 · click navigate(可选 · 暂 toast)

### D4 · 状态

- searchQuery state + expandedSet state · 默认 14 全展开

### D5 · 边界 · 0 trpc

### D6 · typecheck + test 全绿

---

## §9 · Sonnet 流程

1. 改 `lib/constants/guide.ts` 按 SPEC §3 字面完整 + SPEC §4.1 interface
2. 新建 9 子组件
3. rewrite `pages/Guide.tsx`(182 → 60)
4. 改 test 对齐
5. 跑 typecheck + test 全绿
6. 报告

---

## §10 · 红线

1. ❌ hardcode 字面 · 必走 constants
2. ❌ 中文标点变半角(`，` `。` `：` `（）` 全角)
3. ❌ 保留 GUIDE_MODULES / FUNCTION_MATRIX-based 老 link card 残留
4. ❌ emoji icon · 全改 lucide
5. ❌ 删 `GUIDE_MODULES`/`FAQS` export(其他 page 可能引用)· 仅在 Guide.tsx 不再用
6. ❌ 动 backend / FUNCTION_MATRIX / guide-faq.ts(其他 page 用)
7. ❌ 装新 npm 包

---

## §11 · 报告

```yaml
status: ...
files_changed: ...
typecheck: ...
test_run: ...
notes: ...
```
