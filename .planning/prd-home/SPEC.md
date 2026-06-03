# SPEC · / 首页 1:1 复刻

> **目标** · `apps/web/src/pages/Home.tsx` 大改 + 5 sub-component 新建 · sally landing 视觉
> **风险** · M(7 section · ~50+ 字面 · typing rotation + mock 100% 进度 + 4 stats + 14 card 4 group + 6 step workflow + footer brand)

---

## §1 · 7 大偏离

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | hero 大字 | 静态 `AI+短视频+IP` (1 行) | typing rotation · 6 短句轮播(`从流量到` / `从0到1` / `从想法到` / `从内容到` / `从私域到` / `从IP到`) |
| 2 | hero chip | 无 | `● SYSTEM ONLINE · AIP全案获客操盘手` 金边 chip 上方 |
| 3 | hero subtitle | 3 行分开 | 单行 · `OPC全案落地 · 从流量到成交 · AI+短视频+IP · 全链路变现` |
| 4 | hero quote | `"重新构造一个人是怎样不变形的"` 错 | `"善用AI,你一个人就是千军万马!"` |
| 5 | hero brand | 无 | `POWERED BY ADVANCED AI · FULL-CHAIN INTELLIGENT ACCELERATION` 灰小字 |
| 6 | IP进度 | trpc.stepData.progress · 动态完成数 | mock 100% · 9 step 全 ✓ · `恭喜!全部流程已完成` |
| 7 | IP进度顶部 | `已完成 X/9 步` | `总体进度` + 右 `100%` |
| 8 | IP进度按钮 | 2 btn(查看IP方案+继续) | 1 btn `查看IP方案 →` 右上角 link 形 |
| 9 | 9 step icon 设计 | StepProgress 老视觉 | 每 step = 圆 icon + ✓ tag + label · 9 个 lucide icon 横排 |
| 10 | 4 stats(覆盖行业/爆款元素/脚本类型/平台覆盖) | 无 | 4 大数字横排 + icon prefix |
| 11 | FUNCTION MATRIX subtitle | 无 | `全链路功能矩阵 · 洞察市场 → 设计变现 → 创作内容 → 智能工具` |
| 12 | FUNCTION MATRIX group bar | `\|` 小竖线 | emoji+text group header(🌐 市场洞察 / 💰 变现设计 / ✨ 内容创作 / 🖥️ 智能工具)· icon 用 lucide 圆形 chip |
| 13 | FUNCTION MATRIX card 数 | 3+2+5+4 = 14 + 1 footer = 15 | 3+2+5+5 = 15(footer 使用说明 = 第 5 个智能工具 card · 不再单独 footer) |
| 14 | WORKFLOW subtitle | `规范流程加上一站式短视频创作系统` 错 | `按照流程从零到一打造你的短视频变现体系` |
| 15 | WORKFLOW step | 7 step(含 04 学爆款) | 6 step · 跳过 04(01/02/03/05/06/07) |
| 16 | WORKFLOW step desc | 全错(56 行业精准匹配/AI 生成完整方案/...) | 全新 4 字 desc(确定赛道/设计模型/学习套路/AI生成/分镜脚本/话术转化) |
| 17 | READY TO START subtitle | `是时候开始了,IP 打造在等你` 错 | `愿无知者有力,愿有力者前行` |
| 18 | footer | 无 | `AIP AGENT · AI FULL-CHAIN IP MONETIZATION ENGINE` 居中 灰小 caps |

---

## §2 · 字面 + 视觉

### 2.1 Hero section

- **chip**(顶上 · 居中)
  - `rounded-full border border-primary/30 px-4 py-1.5 bg-primary/5`
  - `●` 绿点(`text-green-500`)+ ` SYSTEM ONLINE · AIP全案获客操盘手` 金色 small font(text-sm)

- **h1 大字**(typing rotation)
  - className · `font-display text-7xl md:text-9xl font-black text-primary tracking-tight` · `WebkitTextStroke: '1px var(--primary)'` 边描
  - 6 短句轮播 · interval 2000ms · 当前显示 1 句 ·
    - `从流量到`
    - `从0到1`
    - `从想法到`
    - `从内容到`
    - `从私域到`
    - `从IP到`
  - 实现 · `useState<number>` + `useEffect(setInterval)`

- **subtitle**(单行 · 居中)
  - className · `font-cn text-lg text-muted-foreground`
  - 文字 · `OPC全案落地 · 从流量到成交 · AI+短视频+IP · 全链路变现`
  - 注 · `·` 用全角 `·` (U+00B7)

- **quote**(灰小 italic)
  - className · `font-cn italic text-sm text-muted-foreground/70`
  - 文字 · `"善用AI,你一个人就是千军万马!"`(全角双引号 + 全角逗号 + 全角!)

- **brand**(更小 灰 caps tracking)
  - className · `font-display text-xs text-muted-foreground/50 tracking-widest`
  - 文字 · `POWERED BY ADVANCED AI · FULL-CHAIN INTELLIGENT ACCELERATION`

- **2 CTA**(横排 · gap-4)
  - btn 1 · `🛡️ 启动智能分析` · lucide `Shield` icon prefix · 金底 + 黑字 · `Link to /step/1`
  - btn 2 · `📄 使用说明` · lucide `FileText` icon prefix · outline 金边 + 金字 · `Link to /guide`

### 2.2 IP打造进度 block

- 大 glass card · `rounded-xl border border-primary/20 bg-card p-6`

- header row(flex justify-between)
  - 左 · `font-display text-xl font-bold` + `我的IP打造进度` + 灰小 subtitle 下行 `恭喜!全部流程已完成`
  - 右 · `查看IP方案 →` 金 outline 圆角 btn · `Link to /ip-plan`

- 进度 row(flex justify-between mt-4)
  - 左 · `总体进度` 灰
  - 右 · `100%` 金 bold

- 进度条 · `h-2 bg-muted/20 rounded-full overflow-hidden` · inner `bg-primary` width 100%

- 9 step row(grid-cols-9 gap-2 mt-4)
  - 每 step 一个 card · `rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 flex flex-col items-center gap-2 relative`
  - 右上角 · `CheckCircle2` icon 圆 + filled · `text-primary absolute -top-1.5 -right-1.5 w-5 h-5`
  - 中 · 大 lucide icon · `w-8 h-8 text-primary`
  - 下 · 小 label · `font-cn text-xs text-foreground`
  - 9 step ·
    | # | label | lucide icon |
    |:-:|---|---|
    | 1 | 选择行业 | `LayoutGrid` |
    | 2 | 账号包装 | `Users` |
    | 3 | 人设定制 | `Fingerprint` |
    | 4 | 执行计划 | `Target` |
    | 5 | 变现路径 | `DollarSign` |
    | 6 | 爆款选题 | `TrendingUp` |
    | 7 | 拍摄计划 | `Camera` |
    | 8 | 文案生成 | `Sparkles` |
    | 9 | 直播策划 | `Radio` |

### 2.3 4 stats row(mt-8 · grid-cols-4 gap-4 · 居中)

每 stat · flex items-center gap-3 · 左 icon + 右 数字+label vertical

| # | icon | 大数字 | label |
|:-:|---|---|---|
| 1 | `Globe` 金 | `56+` 大白(font-display text-5xl font-black) | `覆盖行业` 灰小 |
| 2 | `Zap` 金 | `22` | `爆款元素` |
| 3 | `Film` 金 | `20` | `脚本类型` |
| 4 | `TrendingUp` 金 | `5` | `平台覆盖` |

### 2.4 FUNCTION MATRIX section(mt-16)

- title · `FUNCTION MATRIX` 大金 caps tracking · `font-display text-5xl md:text-6xl font-black text-primary text-center tracking-widest`
- subtitle · `全链路功能矩阵 · 洞察市场 → 设计变现 → 创作内容 → 智能工具` 灰小 居中 · `mt-3`

- 4 group(每 group `mt-12`) · 每 group:
  - **group header** · flex items-center gap-3 · `rounded-lg bg-primary/10 p-2.5` lucide icon + `font-display text-xl font-bold` text
  - **card grid** · 不同 group 列数不同 · 见下表

| group title | icon(lucide) | 列数 | cards |
|---|---|:-:|---|
| 市场洞察 | `Globe` | 3 | 1.全网爆款库(`TrendingUp`,`一键抓取全平台爆款视频和文案`,/trending) · 2.爆款文案解析(`Video`,`粘贴文案,AI深度拆解爆款密码+一键仿写`,/video-analysis) · 3.爆款呈现形式(`LayoutGrid`,`14种爆款呈现形式全解析`,/present-styles) |
| 变现设计 | `DollarSign` | 2 | 1.IP变现模型(`DollarSign`,`定制清晰的IP变现路径和收入结构`,/monetization) · 2.私域成交流程(`Users`,`全链路话术覆盖六大成交阶段`,/private-domain · 右侧 `ChevronRight` icon) |
| 内容创作 | `Sparkles` | 5 | 1.爆款元素生成(`Zap`,`AI自动生成多角度爆款文案`,/boom-generate) · 2.AI智能生成(`Sparkles`,`基于方法论一键生成爆款文案`,/generate) · 3.文案结构分析(`Search`,`多维度分析评分精准优化`,/analysis) · 4.短视频制作(`Film`,`文案转分镜脚本和拍摄方案`,/video-production) · 5.获客型视频(`Target`,`精准获客短视频方案`,/acquisition-video) |
| 智能工具 | `Cpu` | 5 | 1.一键生成视频(`Clapperboard`,`文案自动转视频分镜+AI生成`,/ai-video) · 2.语音对话(`Mic`,`语音交互AI智能对话助手`,/voice-chat · 右 `ChevronRight`) · 3.深度学习(`Brain`,`批量添加文案,AI深度分析风格逻辑`,/deep-learning) · 4.方法论知识库(`BookOpen`,`系统学习全网爆款创作技巧`,/knowledge) · 5.使用说明(`FileText`,`完整产品操作手册`,/guide) |

- card 视觉(每 card)·
  - `rounded-xl border border-primary/20 bg-card p-5 hover:border-primary/40 transition-all cursor-pointer h-full relative`
  - 左上 icon · `rounded-lg bg-primary/10 p-2.5 w-fit` + lucide icon `w-5 h-5 text-primary`
  - 标题 · `font-display text-base font-bold mt-4`
  - 描述 · `font-cn text-xs text-muted-foreground/80 mt-2`
  - 右侧 chevron(可选)· `absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground`

### 2.5 WORKFLOW section(mt-16)

- title · `WORKFLOW` 金大 caps · `font-display text-5xl md:text-6xl font-black text-primary text-center tracking-widest`
- subtitle · `按照流程从零到一打造你的短视频变现体系` 灰小 居中

- 6 step row(mt-10 · flex justify-between · arrow between)
  | num | title | desc |
  |:-:|---|---|
  | `01` | `选择行业` | `确定赛道` |
  | `02` | `制定变现` | `设计模型` |
  | `03` | `抓取爆款` | `学习套路` |
  | `05` | `创作文案` | `AI生成` |
  | `06` | `制作视频` | `分镜脚本` |
  | `07` | `私域成交` | `话术转化` |

- 每 step ·
  - 上 · `rounded-lg border border-primary/40 px-4 py-2 font-display text-2xl font-black text-primary`(num)
  - 中 · `font-cn text-base font-bold text-foreground mt-3`(title)
  - 下 · `font-cn text-xs text-muted-foreground mt-1`(desc)

- step 之间 ·
  - 右箭头 `→` 灰 · 渐淡 · 第 6 step 之后也有箭头(暗示循环或继续)

### 2.6 READY TO START section(mt-20 py-16 text-center)

- title · `READY TO START?` 大金 caps · `font-display text-5xl md:text-6xl font-black text-primary tracking-widest`
- subtitle · `愿无知者有力,愿有力者前行` 灰中字 mt-4
- CTA · `立即启动 →` 金底黑字 大 btn · `Link to /step/1` · `font-cn px-12 py-5 text-xl`

### 2.7 Footer

- 居中 · py-8 灰小 caps tracking
- `AIP AGENT · AI FULL-CHAIN IP MONETIZATION ENGINE`
- className · `font-display text-xs text-muted-foreground/40 text-center tracking-widest`

---

## §3 · constants 新建 / 重写

### 3.1 `lib/constants/home.ts`(新建)

```ts
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen, Brain, Camera, ChevronRight, Clapperboard, Cpu, DollarSign,
  Film, FileText, Fingerprint, Globe, LayoutGrid, Mic, Radio, Search,
  Sparkles, Target, TrendingUp, Users, Video, Zap,
} from 'lucide-react';

// Hero
export const HOME_HERO_CHIP = 'SYSTEM ONLINE · AIP全案获客操盘手' as const;
export const HOME_HERO_ROTATION: ReadonlyArray<string> = [
  '从流量到',
  '从0到1',
  '从想法到',
  '从内容到',
  '从私域到',
  '从IP到',
];
export const HOME_HERO_SUBTITLE = 'OPC全案落地 · 从流量到成交 · AI+短视频+IP · 全链路变现' as const;
export const HOME_HERO_QUOTE = '"善用AI,你一个人就是千军万马!"' as const;
export const HOME_HERO_BRAND = 'POWERED BY ADVANCED AI · FULL-CHAIN INTELLIGENT ACCELERATION' as const;
export const HOME_HERO_CTA1 = '启动智能分析' as const;
export const HOME_HERO_CTA2 = '使用说明' as const;
export const HOME_HERO_CTA1_HREF = '/step/1' as const;
export const HOME_HERO_CTA2_HREF = '/guide' as const;

// Progress block
export const HOME_PROGRESS_TITLE = '我的IP打造进度' as const;
export const HOME_PROGRESS_SUBTITLE = '恭喜!全部流程已完成' as const;
export const HOME_PROGRESS_VIEW_PLAN = '查看IP方案' as const;
export const HOME_PROGRESS_OVERALL = '总体进度' as const;
export const HOME_PROGRESS_PERCENT = '100%' as const;
export const HOME_PROGRESS_VIEW_PLAN_HREF = '/ip-plan' as const;

export interface HomeStep {
  label: string;
  icon: LucideIcon;
}
export const HOME_STEPS: ReadonlyArray<HomeStep> = [
  { label: '选择行业', icon: LayoutGrid   },
  { label: '账号包装', icon: Users        },
  { label: '人设定制', icon: Fingerprint  },
  { label: '执行计划', icon: Target       },
  { label: '变现路径', icon: DollarSign   },
  { label: '爆款选题', icon: TrendingUp   },
  { label: '拍摄计划', icon: Camera       },
  { label: '文案生成', icon: Sparkles     },
  { label: '直播策划', icon: Radio        },
];

// Stats
export interface HomeStat {
  icon: LucideIcon;
  value: string;
  label: string;
}
export const HOME_STATS: ReadonlyArray<HomeStat> = [
  { icon: Globe,       value: '56+', label: '覆盖行业' },
  { icon: Zap,         value: '22',  label: '爆款元素' },
  { icon: Film,        value: '20',  label: '脚本类型' },
  { icon: TrendingUp,  value: '5',   label: '平台覆盖' },
];

// Function matrix
export const HOME_MATRIX_TITLE = 'FUNCTION MATRIX' as const;
export const HOME_MATRIX_SUBTITLE = '全链路功能矩阵 · 洞察市场 → 设计变现 → 创作内容 → 智能工具' as const;

export interface HomeMatrixCard {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
  arrow?: boolean;
}
export interface HomeMatrixGroup {
  groupIcon: LucideIcon;
  groupTitle: string;
  cols: 2 | 3 | 5;
  cards: ReadonlyArray<HomeMatrixCard>;
}

export const HOME_MATRIX: ReadonlyArray<HomeMatrixGroup> = [
  {
    groupIcon: Globe,
    groupTitle: '市场洞察',
    cols: 3,
    cards: [
      { icon: TrendingUp, title: '全网爆款库',  desc: '一键抓取全平台爆款视频和文案',           href: '/trending' },
      { icon: Video,      title: '爆款文案解析', desc: '粘贴文案,AI深度拆解爆款密码+一键仿写',  href: '/video-analysis' },
      { icon: LayoutGrid, title: '爆款呈现形式', desc: '14种爆款呈现形式全解析',                href: '/present-styles' },
    ],
  },
  {
    groupIcon: DollarSign,
    groupTitle: '变现设计',
    cols: 2,
    cards: [
      { icon: DollarSign, title: 'IP变现模型',    desc: '定制清晰的IP变现路径和收入结构',         href: '/monetization' },
      { icon: Users,      title: '私域成交流程',  desc: '全链路话术覆盖六大成交阶段',             href: '/private-domain', arrow: true },
    ],
  },
  {
    groupIcon: Sparkles,
    groupTitle: '内容创作',
    cols: 5,
    cards: [
      { icon: Zap,        title: '爆款元素生成', desc: 'AI自动生成多角度爆款文案',     href: '/boom-generate' },
      { icon: Sparkles,   title: 'AI智能生成',   desc: '基于方法论一键生成爆款文案',   href: '/generate' },
      { icon: Search,     title: '文案结构分析', desc: '多维度分析评分精准优化',       href: '/analysis' },
      { icon: Film,       title: '短视频制作',   desc: '文案转分镜脚本和拍摄方案',     href: '/video-production' },
      { icon: Target,     title: '获客型视频',   desc: '精准获客短视频方案',           href: '/acquisition-video' },
    ],
  },
  {
    groupIcon: Cpu,
    groupTitle: '智能工具',
    cols: 5,
    cards: [
      { icon: Clapperboard, title: '一键生成视频',   desc: '文案自动转视频分镜+AI生成',          href: '/ai-video' },
      { icon: Mic,          title: '语音对话',       desc: '语音交互AI智能对话助手',             href: '/voice-chat', arrow: true },
      { icon: Brain,        title: '深度学习',       desc: '批量添加文案,AI深度分析风格逻辑',    href: '/deep-learning' },
      { icon: BookOpen,     title: '方法论知识库',   desc: '系统学习全网爆款创作技巧',           href: '/knowledge' },
      { icon: FileText,     title: '使用说明',       desc: '完整产品操作手册',                   href: '/guide' },
    ],
  },
];

// Workflow
export const HOME_WORKFLOW_TITLE = 'WORKFLOW' as const;
export const HOME_WORKFLOW_SUBTITLE = '按照流程从零到一打造你的短视频变现体系' as const;
export interface HomeWorkflowStep {
  num: string;
  title: string;
  desc: string;
}
export const HOME_WORKFLOW_STEPS: ReadonlyArray<HomeWorkflowStep> = [
  { num: '01', title: '选择行业', desc: '确定赛道' },
  { num: '02', title: '制定变现', desc: '设计模型' },
  { num: '03', title: '抓取爆款', desc: '学习套路' },
  { num: '05', title: '创作文案', desc: 'AI生成'   },
  { num: '06', title: '制作视频', desc: '分镜脚本' },
  { num: '07', title: '私域成交', desc: '话术转化' },
];

// Ready to start
export const HOME_READY_TITLE = 'READY TO START?' as const;
export const HOME_READY_SUBTITLE = '愿无知者有力,愿有力者前行' as const;
export const HOME_READY_CTA = '立即启动' as const;
export const HOME_READY_CTA_HREF = '/step/1' as const;

// Footer
export const HOME_FOOTER = 'AIP AGENT · AI FULL-CHAIN IP MONETIZATION ENGINE' as const;

// Hero rotation interval
export const HOME_HERO_ROTATION_MS = 2000 as const;
```

注 · 全文 sally `,` `:` `(` `)` `"` `!` 一律全角(已确认是 sally 真实)

---

## §4 · sub-component 新建

新建 `apps/web/src/components/home/` ·

| 文件 | 用途 |
|---|---|
| `HomeHero.tsx` | chip + h1 typing rotation(`useEffect + setInterval`)+ subtitle + quote + brand + 2 CTA |
| `HomeProgressBlock.tsx` | header(title + subtitle + 右上 view link)+ 进度 row + 进度条 + 9 step grid |
| `HomeStatsRow.tsx` | 4 stat(icon + 数字 + label) |
| `HomeFunctionMatrix.tsx` | title + subtitle + 4 group(每 group · group header + card grid) |
| `HomeWorkflow.tsx` | title + subtitle + 6 step + 5 arrow between |
| `HomeReadyStart.tsx` | title + subtitle + CTA btn |
| `HomeFooter.tsx` | brand caps |

---

## §5 · page rewrite

`apps/web/src/pages/Home.tsx`(198 → ~30 行) ·

```tsx
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeFunctionMatrix } from '@/components/home/HomeFunctionMatrix';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeProgressBlock } from '@/components/home/HomeProgressBlock';
import { HomeReadyStart } from '@/components/home/HomeReadyStart';
import { HomeStatsRow } from '@/components/home/HomeStatsRow';
import { HomeWorkflow } from '@/components/home/HomeWorkflow';

export default function Home() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen space-y-16">
      <HomeHero />
      <HomeProgressBlock />
      <HomeStatsRow />
      <HomeFunctionMatrix />
      <HomeWorkflow />
      <HomeReadyStart />
      <HomeFooter />
    </main>
  );
}
```

删 · `trpc.stepData.progress` / 4 内联 section function / 旧 `function-matrix.ts` / 旧 `workflow.ts` 引用(constants 文件可保留但 Home.tsx 不再 import)/ `FadeInWrapper` 不再用(简化)/ `StepProgress` 不再用(自己渲 9 step grid)

---

## §6 · 文件清单

| 文件 | 操作 |
|---|---|
| `apps/web/src/lib/constants/home.ts` | 新建 |
| `apps/web/src/components/home/HomeHero.tsx` | 新建 |
| `apps/web/src/components/home/HomeProgressBlock.tsx` | 新建 |
| `apps/web/src/components/home/HomeStatsRow.tsx` | 新建 |
| `apps/web/src/components/home/HomeFunctionMatrix.tsx` | 新建 |
| `apps/web/src/components/home/HomeWorkflow.tsx` | 新建 |
| `apps/web/src/components/home/HomeReadyStart.tsx` | 新建 |
| `apps/web/src/components/home/HomeFooter.tsx` | 新建 |
| `apps/web/src/pages/Home.tsx` | rewrite 198 → ~30 行 |
| `apps/web/src/pages/__tests__/Home.test.tsx` | 改 / 新建(若存在) |

---

## §7 · 验收

D1 字面 grep · 必命中 ·
- `SYSTEM ONLINE · AIP全案获客操盘手` 1 次
- `从流量到` 1 次(default 初始 rotation 第 0 项)
- `OPC全案落地 · 从流量到成交 · AI+短视频+IP · 全链路变现` 1 次
- `善用AI,你一个人就是千军万马!` 1 次
- `POWERED BY ADVANCED AI · FULL-CHAIN INTELLIGENT ACCELERATION` 1 次
- `我的IP打造进度` 1 次
- `恭喜!全部流程已完成` 1 次
- `查看IP方案` 1 次
- `总体进度` 1 次
- `100%` 1 次
- 9 step label 各 1 次(选择行业/账号包装/人设定制/执行计划/变现路径/爆款选题/拍摄计划/文案生成/直播策划)
- 4 stat label 各 1 次(覆盖行业/爆款元素/脚本类型/平台覆盖)+ 4 数字(56+/22/20/5)
- `FUNCTION MATRIX` 1 次
- `全链路功能矩阵 · 洞察市场 → 设计变现 → 创作内容 → 智能工具` 1 次
- 4 group title 各 1 次(市场洞察/变现设计/内容创作/智能工具)
- 15 card title 各 1 次(全网爆款库/爆款文案解析/爆款呈现形式/IP变现模型/私域成交流程/爆款元素生成/AI智能生成/文案结构分析/短视频制作/获客型视频/一键生成视频/语音对话/深度学习/方法论知识库/使用说明)
- `WORKFLOW` 1 次
- `按照流程从零到一打造你的短视频变现体系` 1 次
- 6 workflow step num + title(01 选择行业 / 02 制定变现 / 03 抓取爆款 / 05 创作文案 / 06 制作视频 / 07 私域成交)各 1 次
- `READY TO START?` 1 次
- `愿无知者有力,愿有力者前行` 1 次
- `立即启动` 1 次
- `AIP AGENT · AI FULL-CHAIN IP MONETIZATION ENGINE` 1 次

D2 · sally vertical 大 landing 视觉 · 7 section 顺序 · hero typing rotation · IP进度横排 9 step · 4 stats horizontal · 4 group function matrix · 6 step workflow horizontal · ready to start · footer

D3 · hero rotation 每 2s 切换 · CTA Link 跳 · 进度 view plan Link · 15 card Link · ready CTA Link 跳

D4 · default state · mock 100% · 6 rotation 自动循环

D6 · typecheck + test 全绿

---

## §8 · Sonnet 执行流程(7 阶段)

1. Read SPEC.md(本文件)+ Read 现 Home.tsx + Read function-matrix.ts + workflow.ts(对比偏离)
2. 写 `lib/constants/home.ts`(完整 § 3.1)
3. 写 7 个 sub-component(`components/home/*.tsx`)
4. rewrite `pages/Home.tsx`(§5)
5. 删 旧 `function-matrix.ts` 和 `workflow.ts` 的 import 引用(若 Home.tsx 外其他文件还用 · 保留;否则文件可 keep · 不删 · 别处可能用)
6. 跑 `pnpm typecheck` + `pnpm test`(若 Home.test.tsx 存在 · 同步改)
7. 报告完成 + 偏离

---

## §9 · 红线

- ❌ hardcode 字面 · 走 constants
- ❌ 半角中文标点(`,` `:` `(` `)` `"` `!` 全角)
- ❌ 保留 trpc.stepData.progress 老逻辑
- ❌ emoji icon(group 用 lucide 圆 chip · sally 真实是 lucide-like 图标)
- ❌ FUNCTION MATRIX 用 FadeInWrapper / FUNCTION_MATRIX_FOOTER 老结构
- ❌ 动 backend / `apps/api/`
- ❌ 装新 npm 包
- ❌ hero rotation 用 framer-motion(轻量 setInterval 即可)
- ❌ 改 router.tsx / Header.tsx 等外层
