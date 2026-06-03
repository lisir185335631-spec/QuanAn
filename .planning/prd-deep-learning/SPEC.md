# SPEC · /deep-learning 1:1 复刻

> **目标** · `apps/web/src/pages/tools/DeepLearning.tsx` 全文 rewrite · sally 真实页 1:1(form 上半 + 学习档案下半 含 1 个已完成 mock 档案)
> **截图** · 6 张(default empty + add 流程 + 完成档案展开 + 使用说明)
> **风险** · M(字段密 · 1 mock 档案完整字面 风格画像/9字段/5字段/4 quote)

---

## §1 · 背景 + 5 大偏离

### 1.1 sally 真实页结构

- **URL** · `aiipznt.vip/deep-learning`
- **header** · 复用 AIP AGENT logo + nav
- **正文** · 居中 max-w-5xl ·
  1. chip card 居中 · Brain icon + `深度学习` 金字
  2. H1 · `文案深度学习` 白大字 · 居中
  3. subtitle · `上传文件或粘贴文案样本，AI将深度分析文案逻辑、包装风格，生成可复用的风格画像` 灰 居中
  4. 大 form card(深 bg + 金边)·
     - 2 tab(上传文件 / 粘贴文案 · default 粘贴文案 active 金底)
     - `+ 添加文案样本` 左 + `批量粘贴` 右金
     - textarea(default empty · placeholder)
     - `Ctrl+Enter 快速添加` 左灰小 + `+ 添加这篇` 右金 outline btn
     - 学习档案名称 input
     - 主 CTA `开始深度学习（N篇文案）` 全宽金底(Brain icon 前缀)
  5. `学习档案 (N)` H2 + 完成档案 list / empty state
  6. 使用说明 card(底部 · 3 mode + 7 bullet)

### 1.2 5 大偏离(现状 PRD-27 → sally)

| # | 偏离点 | 现状 | sally 真实 |
|:-:|---|---|---|
| **1** | chip / h1 | 无 chip · 无 h1 居中 · 仅 5 维度 result | chip + h1 + subtitle 居中 |
| **2** | form 结构 | 简化 textarea + 添加 + 开始按钮 | 完整 2 tab + 批量粘贴 + 学习档案名 input + 主 CTA |
| **3** | trpc 真版 | `trpc.deepLearning.learn.useMutation` 实时 | mock-first · 0 fetch · 默认 1 mock 完成档案 |
| **4** | 结果结构 | 5 维度 dimension card(tone/structure/hook/transition/closing) | 完成档案展开 · 风格画像 + 文案逻辑 9 字段 + 包装风格 5 字段 + 精华片段 4 段 |
| **5** | 使用说明 card | 无 | 3 mode + 7 bullet 完整使用说明 |

### 1.3 strategy

- mock-first(同 step5/Diagnosis/AiVideo) · default render 1 完成 mock 档案 + empty form
- 删 trpc.deepLearning.* 等动态依赖 · 保留 ui-only 交互(tab switch / textarea typing)
- 主 CTA · 点击 toast `深度学习 · 即将上线`
- 复制 / 删除 btn · 各 toast(纯视觉)

---

## §2 · 视觉规范

### 2.1 Icon 映射(lucide-react)

| 用途 | lucide icon |
|---|---|
| chip 主 icon | `Brain` 金 |
| 主 CTA | `Brain` 金 prefix |
| 上传文件 tab | `Upload` |
| 粘贴文案 tab | `FileText` 金 |
| 添加文案样本 | `Plus` 金 |
| 批量粘贴 | text only(无 icon) |
| 添加这篇 btn | `Plus` 金 |
| empty 大 icon | `Brain` 大灰 |
| 使用说明 icons(无 · 文字 only) | — |
| 档案完成 chip | `CheckCircle2` 绿 |
| 档案复制 btn | `Copy` 金 |
| 档案删除 btn | `Trash2` 红 |
| 档案 toggle | `ChevronUp/ChevronDown` |
| 精华片段 icon(可选 · sally 无 icon · 跳过) | — |

### 2.2 layout

- main · `max-w-5xl mx-auto py-8 space-y-8`
- chip/h1/subtitle · `flex flex-col items-center gap-3`
- form card · `rounded-xl border border-primary/40 bg-card p-6 space-y-4`
- 2 tab · `grid grid-cols-2 gap-3`
- 档案 card · `rounded-xl border border-border bg-card p-6 space-y-6`
- 文案逻辑 / 包装风格 · `grid grid-cols-1 md:grid-cols-2 gap-4`
- 精华片段 · `space-y-3`
- 使用说明 · `rounded-xl border border-border bg-card p-6 space-y-4`

### 2.3 颜色

- chip · 金边 + 深 bg + Brain icon 金 + 字金
- h1 白 · subtitle 灰
- form card 金边
- tab 选中金底 + 黑字 · 未选 透明 + 边框灰 + 灰字
- 主 CTA 金底大按钮
- empty state 大 Brain icon 灰 + 灰字
- 档案 chip 绿(`bg-emerald-500/20` + `text-emerald-400`)
- 风格画像 / 文案逻辑 / 包装风格 / 精华片段 等区块 label 金 bold + 内容灰 white
- 精华片段 quote · 灰 italic / 左缩进

---

## §3 · 字面源(form 部分 + empty)

### 3.1 顶部 chip + h1 + subtitle

| 字段 | 字面 |
|---|---|
| chip | `深度学习` |
| h1 | `文案深度学习` |
| subtitle | `上传文件或粘贴文案样本，AI将深度分析文案逻辑、包装风格，生成可复用的风格画像` |

### 3.2 form card

- tab 1 · `上传文件`(Upload icon)· 视觉切换 · 点击 toast `文件上传 · 即将上线`
- tab 2 · `粘贴文案`(FileText icon · default active)
- left "+ 添加文案样本" 链接(纯视觉 · 折叠 toggle stub · 不实现)
- right "批量粘贴" 链接(toast `批量粘贴 · 即将上线`)
- textarea placeholder · `粘贴一篇文案内容（口播文案、短视频文案、图文文案均可）`
- left text · `Ctrl+Enter 快速添加`(灰小)
- right btn · `添加这篇`(+ Plus icon · disabled when textarea empty · click toast `请粘贴文案后再添加`)
- input placeholder · `学习档案名称（可选，如：XX老师的文案风格）`
- 主 CTA · `开始深度学习（0篇文案）`(N 动态根据 samples 长度 · default 0 · click toast `深度学习 · 即将上线`)

### 3.3 学习档案 section

- H2 · `学习档案 (1)`(1 是 mock 档案数量)
- 完成档案 list · 1 entry(SPEC §4 完整字面)
- 折叠后只显示 title row + chip + btn · 展开后显示完整 6 段

### 3.4 使用说明 card(始终显示在底部)

- H3 · `使用说明`
- subsection 1 · `文件上传模式：`(金 bold)
  - `1. 支持上传 PDF、Word（.doc/.docx）、TXT、Markdown、CSV 文件`
  - `2. 系统会自动提取文件中的文本内容，拆分成段落进行深度学习`
  - `3. 建议上传你的代表作品集、话术文档、文案素材库等`
- subsection 2 · `文案粘贴模式：`(金 bold)
  - `4. 逐条粘贴或使用"批量粘贴"模式一次性添加多篇（用空行或---分隔）`
  - `5. 最多支持50篇文案，建议添加10篇以上以获得更精准的风格分析`
- subsection 3 · `通用说明：`(金 bold)
  - `6. AI会深度分析文案逻辑（开头模式、结构、钩子技巧等）和包装风格`
  - `7. 分析完成后，点击"复制风格提示词"可将学习成果应用到文案生成中`

---

## §4 · 字面源(1 完成 mock 档案 · 完整)

### 4.1 档案 header

- title · `文案学习 2026/5/25 (1篇)`(日期动态 · 默认硬 2026/5/25 跟 sally 截图一致)
- chip · `已完成`(CheckCircle2 icon 绿)
- subtitle · `添加1篇文案 · 1篇文案`(灰小 · FileText icon 前缀)
- right btn · Copy icon(金) + Trash2 icon(红) + Chevron toggle(灰)

### 4.2 风格画像 section

- label · `风格画像`(金 bold)
- body · 1 paragraph(灰 text-base leading-relaxed) ·

```
这份文案的核心风格画像是一位深谙美业经营之道的"智者型"IP。他擅长以犀利的问题切入行业痛点，通过正反两面的案例对比，展现新旧模式的冲突与融合。其语言风格口语化且富有启发性，善用数据和故事来支撑论点，最终提出独到的平衡解决方案，并以开放式提问引导用户深度参与。整体呈现出一种理性分析、趋势洞察和解决问题导向的专业态度，旨在帮助美业老板们打破思维局限，拥抱高效未来。
```

### 4.3 文案逻辑 section(9 字段)

- label · `文案逻辑`(金 bold)
- grid 2 col · 9 entry · 每 entry · 灰 label + 白 content ·

| key | label | content |
|---|---|---|
| `opening` | `开头模式：` | `通过提出一个行业普遍存在的痛点和对比现象（有人轻松赚钱，有人苦苦挣扎），引发目标受众的共鸣和好奇心，直接切入核心问题。` |
| `structure` | `内容结构：` | `采用"提出问题 -> 正反观点呈现（AI赋能 vs 人情服务）-> 融合与升华（我的立场）-> 引导讨论"的辩论式/探讨式结构。首先抛出行业困境，接着分别阐述两种看似对立的解决方案及其案例，最后给出作者的独到见解和融合之道，并以互动提问收尾。` |
| `language` | `语言风格：` | `口语化、平实易懂，带有一定的煽动性和启发性。善用疑问句、反问句和比喻（支点、以小搏大），逻辑清晰，表达流畅，能够有效引导用户思考。` |
| `script_type` | `脚本类型：` | `行业洞察分析型 / 辩论探讨型` |
| `guidance` | `引导行为：` | `开放式提问，引导评论区用户进行观点分享和讨论，激发互动，形成UGC内容。` |
| `audience` | `目标受众：` | `美业老板、创业者、行业从业人员、对商业模式和效率提升感兴趣的人群。` |
| `hook` | `钩子技巧：` | `痛点共鸣（美业老板赚钱难）、对比反差（轻松赚钱 vs 苦苦挣扎）、悬念提问（背后藏着什么秘密?）、案例故事（美容院老板年入370万）、数据支撑（省20万人力，效率10倍）` |
| `emotion` | `情感触发：` | `焦虑感（赚钱难、辛苦钱）、好奇心（秘密、趋势）、认同感（我的立场、融合之道）、希望感（轻松赚钱、高回报）、危机感（有没有看到趋势、勇气尝试）` |
| `viral` | `爆款元素：` | `行业痛点直击、新旧观念冲突、成功案例分享、数据量化效果、趋势预判与解决方案、互动式结尾` |

### 4.4 包装风格 section(5 字段)

- label · `包装风格`(金 bold)
- grid 2 col · 5 entry ·

| key | label | content |
|---|---|---|
| `brand` | `品牌定位：` | `行业专家/导师/思想者形象，具备深度洞察力，能够提供新颖的视角和解决方案，不偏袒任何一方，而是寻求平衡与最优解。` |
| `tone` | `语气调性：` | `理性分析、启发思考、略带权威性，同时保持亲和力，鼓励互动。` |
| `format` | `呈现形式：` | `短视频文案（适用于口播或配字幕讲解），内容结构清晰，节奏感强，适合碎片化传播。` |
| `topic` | `内容主题：` | `美业经营策略、AI赋能商业、效率提升与成本优化、商业模式创新、人与技术结合` |
| `differentiation` | `差异化：` | `平衡视角：不简单站队，而是探讨融合之道。、案例支撑：用具体故事和数据增强说服力。、趋势洞察：关注前沿科技（AI）在传统行业的应用。、问题解决导向：提供可操作的思路而非纯粹抱怨。` |

### 4.5 精华片段 (4) section

- label · `精华片段 (4)`(金 bold)
- 4 quote(灰 italic · vertical stack) ·

| # | quote |
|:-:|---|
| 1 | `为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？` |
| 2 | `AI智能体能帮美业省下至少20万的人力成本，效率是人工的十倍。` |
| 3 | `美业是服务行业，最重要的是人情味和体验感，这是AI给不了的。` |
| 4 | `轻松赚钱和人情味并不冲突，关键在于用AI优化标准化流程，把精力投入到真正需要"人"的服务上。` |

---

## §5 · constants 改动

### 5.1 `lib/constants/deep-learning.ts` · 新建

```ts
import type { LucideIcon } from 'lucide-react';
import { FileText, Upload } from 'lucide-react';

// ── header ────────────────────────────────────────────────────────────────────
export const DEEP_LEARNING_CHIP = '深度学习' as const;
export const DEEP_LEARNING_H1 = '文案深度学习' as const;
export const DEEP_LEARNING_SUBTITLE =
  '上传文件或粘贴文案样本，AI将深度分析文案逻辑、包装风格，生成可复用的风格画像' as const;

// ── form labels ────────────────────────────────────────────────────────────────
export const DL_TAB_UPLOAD = '上传文件' as const;
export const DL_TAB_PASTE = '粘贴文案' as const;
export const DL_ADD_SAMPLE_LABEL = '添加文案样本' as const;
export const DL_BATCH_PASTE = '批量粘贴' as const;
export const DL_TEXTAREA_PLACEHOLDER =
  '粘贴一篇文案内容（口播文案、短视频文案、图文文案均可）' as const;
export const DL_HINT_CTRL_ENTER = 'Ctrl+Enter 快速添加' as const;
export const DL_ADD_THIS_BTN = '添加这篇' as const;
export const DL_NAME_PLACEHOLDER = '学习档案名称（可选，如：XX老师的文案风格）' as const;
export const DL_START_BTN_PREFIX = '开始深度学习' as const;
export const DL_START_BTN_SUFFIX = (n: number) => `（${n}篇文案）` as const;

// ── toast texts ──────────────────────────────────────────────────────────────
export const DL_TOAST_UPLOAD = '文件上传 · 即将上线' as const;
export const DL_TOAST_BATCH = '批量粘贴 · 即将上线' as const;
export const DL_TOAST_NEED_TEXT = '请粘贴文案后再添加' as const;
export const DL_TOAST_START = '深度学习 · 即将上线' as const;
export const DL_TOAST_COPY = '复制成功' as const;
export const DL_TOAST_DELETE = '删除 · 即将上线' as const;

// ── 学习档案 ─────────────────────────────────────────────────────────────────
export const DL_ARCHIVES_TITLE_PREFIX = '学习档案' as const;
export const DL_EMPTY_TITLE = '还没有学习档案' as const;
export const DL_EMPTY_DESC = '上传文件或添加文案样本，开始深度学习' as const;
export const DL_ARCHIVE_STATUS_DONE = '已完成' as const;

// ── 6 段 archive sub-section labels ──────────────────────────────────────────
export const DL_SECTION_STYLE_PORTRAIT = '风格画像' as const;
export const DL_SECTION_LOGIC = '文案逻辑' as const;
export const DL_SECTION_PACKAGING = '包装风格' as const;
export const DL_SECTION_HIGHLIGHTS_PREFIX = '精华片段' as const;

// ── 9 logic field labels ──────────────────────────────────────────────────────
export interface ArchiveFieldEntry {
  key: string;
  label: string;
  content: string;
}

export const DL_LOGIC_FIELDS: ReadonlyArray<ArchiveFieldEntry> = [
  { key: 'opening', label: '开头模式：', content: '通过提出一个行业普遍存在的痛点和对比现象（有人轻松赚钱，有人苦苦挣扎），引发目标受众的共鸣和好奇心，直接切入核心问题。' },
  { key: 'structure', label: '内容结构：', content: '采用"提出问题 -> 正反观点呈现（AI赋能 vs 人情服务）-> 融合与升华（我的立场）-> 引导讨论"的辩论式/探讨式结构。首先抛出行业困境，接着分别阐述两种看似对立的解决方案及其案例，最后给出作者的独到见解和融合之道，并以互动提问收尾。' },
  { key: 'language', label: '语言风格：', content: '口语化、平实易懂，带有一定的煽动性和启发性。善用疑问句、反问句和比喻（支点、以小搏大），逻辑清晰，表达流畅，能够有效引导用户思考。' },
  { key: 'script_type', label: '脚本类型：', content: '行业洞察分析型 / 辩论探讨型' },
  { key: 'guidance', label: '引导行为：', content: '开放式提问，引导评论区用户进行观点分享和讨论，激发互动，形成UGC内容。' },
  { key: 'audience', label: '目标受众：', content: '美业老板、创业者、行业从业人员、对商业模式和效率提升感兴趣的人群。' },
  { key: 'hook', label: '钩子技巧：', content: '痛点共鸣（美业老板赚钱难）、对比反差（轻松赚钱 vs 苦苦挣扎）、悬念提问（背后藏着什么秘密?）、案例故事（美容院老板年入370万）、数据支撑（省20万人力，效率10倍）' },
  { key: 'emotion', label: '情感触发：', content: '焦虑感（赚钱难、辛苦钱）、好奇心（秘密、趋势）、认同感（我的立场、融合之道）、希望感（轻松赚钱、高回报）、危机感（有没有看到趋势、勇气尝试）' },
  { key: 'viral', label: '爆款元素：', content: '行业痛点直击、新旧观念冲突、成功案例分享、数据量化效果、趋势预判与解决方案、互动式结尾' },
];

// ── 5 packaging field labels ──────────────────────────────────────────────────
export const DL_PACKAGING_FIELDS: ReadonlyArray<ArchiveFieldEntry> = [
  { key: 'brand', label: '品牌定位：', content: '行业专家/导师/思想者形象，具备深度洞察力，能够提供新颖的视角和解决方案，不偏袒任何一方，而是寻求平衡与最优解。' },
  { key: 'tone', label: '语气调性：', content: '理性分析、启发思考、略带权威性，同时保持亲和力，鼓励互动。' },
  { key: 'format', label: '呈现形式：', content: '短视频文案（适用于口播或配字幕讲解），内容结构清晰，节奏感强，适合碎片化传播。' },
  { key: 'topic', label: '内容主题：', content: '美业经营策略、AI赋能商业、效率提升与成本优化、商业模式创新、人与技术结合' },
  { key: 'differentiation', label: '差异化：', content: '平衡视角：不简单站队，而是探讨融合之道。、案例支撑：用具体故事和数据增强说服力。、趋势洞察：关注前沿科技（AI）在传统行业的应用。、问题解决导向：提供可操作的思路而非纯粹抱怨。' },
];

// ── 4 highlight quotes ────────────────────────────────────────────────────────
export const DL_HIGHLIGHTS: ReadonlyArray<string> = [
  '为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？',
  'AI智能体能帮美业省下至少20万的人力成本，效率是人工的十倍。',
  '美业是服务行业，最重要的是人情味和体验感，这是AI给不了的。',
  '轻松赚钱和人情味并不冲突，关键在于用AI优化标准化流程，把精力投入到真正需要"人"的服务上。',
];

// ── style portrait ────────────────────────────────────────────────────────────
export const DL_STYLE_PORTRAIT_BODY = '这份文案的核心风格画像是一位深谙美业经营之道的"智者型"IP。他擅长以犀利的问题切入行业痛点，通过正反两面的案例对比，展现新旧模式的冲突与融合。其语言风格口语化且富有启发性，善用数据和故事来支撑论点，最终提出独到的平衡解决方案，并以开放式提问引导用户深度参与。整体呈现出一种理性分析、趋势洞察和解决问题导向的专业态度，旨在帮助美业老板们打破思维局限，拥抱高效未来。' as const;

// ── archive mock ──────────────────────────────────────────────────────────────
export interface ArchiveMock {
  id: string;
  title: string;
  sampleCount: number;
  stylePortrait: string;
  logic: ReadonlyArray<ArchiveFieldEntry>;
  packaging: ReadonlyArray<ArchiveFieldEntry>;
  highlights: ReadonlyArray<string>;
}

export const DL_ARCHIVE_MOCK: ArchiveMock = {
  id: 'archive-1',
  title: '文案学习 2026/5/25 (1篇)',
  sampleCount: 1,
  stylePortrait: DL_STYLE_PORTRAIT_BODY,
  logic: DL_LOGIC_FIELDS,
  packaging: DL_PACKAGING_FIELDS,
  highlights: DL_HIGHLIGHTS,
};

// ── 使用说明 ─────────────────────────────────────────────────────────────────
export const DL_USAGE_TITLE = '使用说明' as const;

export interface UsageSection {
  title: string;
  bullets: ReadonlyArray<string>;
}

export const DL_USAGE_SECTIONS: ReadonlyArray<UsageSection> = [
  {
    title: '文件上传模式：',
    bullets: [
      '1. 支持上传 PDF、Word（.doc/.docx）、TXT、Markdown、CSV 文件',
      '2. 系统会自动提取文件中的文本内容，拆分成段落进行深度学习',
      '3. 建议上传你的代表作品集、话术文档、文案素材库等',
    ],
  },
  {
    title: '文案粘贴模式：',
    bullets: [
      '4. 逐条粘贴或使用"批量粘贴"模式一次性添加多篇（用空行或---分隔）',
      '5. 最多支持50篇文案，建议添加10篇以上以获得更精准的风格分析',
    ],
  },
  {
    title: '通用说明：',
    bullets: [
      '6. AI会深度分析文案逻辑（开头模式、结构、钩子技巧等）和包装风格',
      '7. 分析完成后，点击"复制风格提示词"可将学习成果应用到文案生成中',
    ],
  },
];

// ── tab icon mapping (re-export 给 page) ─────────────────────────────────────
export const DL_TAB_ICONS: Record<string, LucideIcon> = {
  upload: Upload,
  paste: FileText,
};
```

---

## §6 · sub-component 设计

### 6.1 新建组件(`apps/web/src/components/deep-learning/`)

| 文件 | 用途 | 行数估 |
|---|---|:-:|
| `DeepLearningChip.tsx` | 顶部 chip(Brain icon + label) | ~20 |
| `DeepLearningHeader.tsx` | chip + h1 + subtitle 组合 | ~25 |
| `SampleForm.tsx` | 大 form card(2 tab + textarea + 添加 btn + 学习档案 input + 主 CTA) | ~120 |
| `ArchiveCard.tsx` | 单已完成档案 card(header row + 折叠 + 4 子段) | ~80 |
| `StylePortraitSection.tsx` | 风格画像 sub-section | ~20 |
| `FieldGridSection.tsx` | 文案逻辑/包装风格通用 grid 2 col(label + content) | ~30 |
| `HighlightsSection.tsx` | 精华片段 4 quote | ~25 |
| `UsageInstructions.tsx` | 使用说明 card(3 mode + 7 bullet) | ~40 |
| `EmptyArchives.tsx` | empty state(Brain 大 + 文字) | ~20 |

---

## §7 · page rewrite

### 7.1 `apps/web/src/pages/tools/DeepLearning.tsx` · 全文 rewrite(307 → ~80 行)

```tsx
import { useState } from 'react';
import { toast } from 'sonner';

import { ArchiveCard } from '@/components/deep-learning/ArchiveCard';
import { DeepLearningHeader } from '@/components/deep-learning/DeepLearningHeader';
import { SampleForm } from '@/components/deep-learning/SampleForm';
import { UsageInstructions } from '@/components/deep-learning/UsageInstructions';
import {
  DL_ARCHIVE_MOCK,
  DL_ARCHIVES_TITLE_PREFIX,
  DL_TOAST_START,
} from '@/lib/constants/deep-learning';

export default function DeepLearning() {
  const [text, setText] = useState('');
  const [archiveName, setArchiveName] = useState('');

  const archives = [DL_ARCHIVE_MOCK]; // mock-first · default 1 archive

  return (
    <main className="flex-1 container py-8 max-w-5xl space-y-8">
      <DeepLearningHeader />

      <SampleForm
        text={text}
        onTextChange={setText}
        archiveName={archiveName}
        onArchiveNameChange={setArchiveName}
        sampleCount={0}
        onStart={() => toast.info(DL_TOAST_START)}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-on-surface">
          {DL_ARCHIVES_TITLE_PREFIX} ({archives.length})
        </h2>
        {archives.map((archive) => (
          <ArchiveCard key={archive.id} archive={archive} />
        ))}
      </div>

      <UsageInstructions />
    </main>
  );
}
```

删除 ·
- `trpc.deepLearning.learn.useMutation` + DeepLearnResult interface + DIMENSION_LABELS 5 维度
- old ResultView component + 5 dimension card grid + isFallback banner

---

## §8 · 文件清单

| 文件 | 操作 | 行数估 |
|---|:-:|:-:|
| `lib/constants/deep-learning.ts` | **新建**(完整字面 const + 1 mock archive + 9+5 字段 + 4 quote + 3 usage section) | ~210 |
| `components/deep-learning/` | **新建 9 子组件** | 总 ~380 |
| `pages/tools/DeepLearning.tsx` | **全文 rewrite**(307 → ~70 行) | -237 |
| 老 test(若存) | **改 / 新建**(对齐新字面) | ~50 |

**不动** · `apps/api/src/router/deepLearning.ts` backend(PRR 评估)

---

## §9 · 验收(5 维度)

### D1 · 字面

innerText grep · 必命中 ·
- chip `深度学习` 1 次(注意:可能多次 出现在 chip + h1 + CTA 等)
- h1 `文案深度学习` 1 次
- subtitle 关键词 `深度分析文案逻辑、包装风格` 1 次
- 2 tab `上传文件` / `粘贴文案` 各 1 次
- `添加文案样本` / `批量粘贴` / `Ctrl+Enter 快速添加` / `添加这篇` / `开始深度学习` 各 1 次
- `学习档案 (1)` 1 次 + `文案学习 2026/5/25 (1篇)` 1 次 + `已完成` 1 次
- `风格画像` 1 次 + 关键句 `智者型` `深谙美业` 各 1 次
- `文案逻辑` 1 次 + 9 label(开头模式：/内容结构：/语言风格：/脚本类型：/引导行为：/目标受众：/钩子技巧：/情感触发：/爆款元素：)各 1 次
- `包装风格` 1 次 + 5 label(品牌定位：/语气调性：/呈现形式：/内容主题：/差异化：)各 1 次
- `精华片段 (4)` 1 次 + 4 quote keyword(`为什么美业老板` / `370万` 之类)各 1 次
- `使用说明` 1 次 + 3 section title 各 1 次 + 7 bullet keyword 各 1 次
- 字面命中率 ≥ 99%

### D2 · 视觉

- chip / h1 / subtitle 居中
- form card 金边 · 2 tab(粘贴文案 active 金底)
- empty 不显示(因 mock 1 archive)
- archive card 完整 6 段(header + 4 子段 + 使用说明 独立 card)
- 文案逻辑 / 包装风格 2 col grid

### D3 · 交互

- tab switch · 视觉切换 + 点 上传文件 toast
- textarea 输入 · state 更新
- 主 CTA · toast `深度学习 · 即将上线`
- 添加这篇 btn(empty 时 disable 或 toast)
- archive 折叠 toggle · chevron 旋转
- copy/trash btn · 各 toast

### D4 · 状态

- text / archiveName 2 state
- archives = `[DL_ARCHIVE_MOCK]` 固定 1 entry

### D5 · 边界

- 0 trpc · 0 backend · 0 localStorage

### D6 · typecheck + test

- `pnpm typecheck` 全绿
- `pnpm --filter @quanan/web test DeepLearning` 全绿

---

## §10 · Sonnet 流程(6 步)

1. **新建** `lib/constants/deep-learning.ts` 按 SPEC §5.1 完整字面(注意全角中文标点 严守)
2. **新建 9 子组件** in `apps/web/src/components/deep-learning/`(SPEC §6.1)· icon 全 lucide · 字面 from constants · data-testid kebab-case
3. **全文 rewrite** `apps/web/src/pages/tools/DeepLearning.tsx` 按 SPEC §7.1(307 → ~70 行)· 删 trpc + ResultView + 5 维度 + isFallback 全部
4. **改 / 新建 test** ·
   - `apps/web/src/pages/tools/__tests__/DeepLearning.test.tsx` 若存改 · 否则新建 4-5 it 块(chip / h1 / 2 tab / archive 完整 / 4 quote / 使用说明 3 section)
   - `apps/web/src/lib/constants/__tests__/deep-learning.test.ts` 新建 · 验证 9+5 字段数量 + 4 quote + 3 usage section 字面
5. **跑** ·
   - `cd /Users/return/Desktop/QuanAn && pnpm typecheck` 必绿
   - `cd /Users/return/Desktop/QuanAn && pnpm --filter @quanan/web test DeepLearning` 必绿
6. **报告**

---

## §11 · 红线(违反 = reject)

1. ❌ 不允许 hardcode 字面 · 必走 constants(`DL_*` / `DL_ARCHIVE_MOCK.*`)
2. ❌ 不允许中文标点变半角 · `，` `。` `（）` `：` `"` `"` 全角 严守
3. ❌ 不允许 emoji · 全 lucide
4. ❌ 不允许保留 trpc.deepLearning.* / DIMENSION_LABELS / ResultView / 5 维度 dimension card 任何残留
5. ❌ 不允许 page 文件直接 inline 子段 · 必抽 sub-component
6. ❌ 不允许加 sally 截图未出现的字段(如老 isFallback banner / Token usage footer)
7. ❌ 不允许动 `apps/api/` backend
8. ❌ 不允许装新 npm 包

---

## §12 · 报告(Sonnet 干完回填)

```yaml
status: done | blocked
files_changed:
  - <path> · +N / -N
typecheck: pass | fail
test_run: pass | fail (N passed / N failed)
notes: <异常 / 决策>
```
