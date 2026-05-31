# /video-production · 短视频一键制作 · 1:1 复刻 SPEC(team 模式)

> **来源** · aiipznt.vip/video-production(sally zhao demo · 9 张截图)
> **分工** · Opus 出 constants 真相源(已写)+ 本 SPEC · Sonnet 4.6 max 执行组件/页面/测试
> **现状** · 旧 PRD-25 `trpc` 内联版整页重写 → mock-first
> **真相源** · `apps/web/src/lib/constants/video-production.ts`(Opus 已逐字写好 · 全部从此 import · 禁止重打字面)

---

## 1 · 工程约束(红线)
- ✅ 复用克隆范式:薄 `VideoProduction.tsx` orchestrator + `pages/tools/components/videoProduction/` 子组件 + mock-first
- ✅ 所有文案/mock **从 `@/lib/constants/video-production` import** · 组件里**不准出现任何中文字面 mock**(只允许 import 常量 + label)
- ✅ mock-first:默认 mock 直出(textarea 预填 `VIDEO_PRODUCTION_DEFAULT_COPY` + 5 个结果 section 常驻) · 不调 trpc · 按钮 onClick → sonner toast
- ✅ lucide 线性 icon(非 emoji)· tailwind 用项目 token(primary/on-surface/muted-foreground/card/input)+ 内置色(green/red/orange/amber-500)
- ❌ 不动 router.tsx / tools/index.ts(default export 名不变 `VideoProduction`)/ apps/api
- ❌ 不加 uppercase class · 不改写/概括/删减任何 mock 字符 · 时间码/括号/引号"" 全保留

## 2 · 页面结构(单列 stack · 7 区块)
| # | 区块 | 组件 | 标题 icon |
|:-:|---|---|---|
| 1 | Header | `VideoProductionHero` | — |
| 2 | 输入卡 | `VideoProductionInputCard` | — |
| 3 | 分镜脚本 | `VideoProductionStoryboard` + `VideoProductionSceneCard` | Camera |
| 4 | 拍摄方案 | `VideoProductionShootingPlan` | Camera |
| 5 | 口播提词器 | `VideoProductionTeleprompter` | Mic(绿) |
| 6 | 配乐建议 | `VideoProductionBgm` | Music |
| 7 | 剪辑要点 | `VideoProductionEditing` | Scissors(红) |
| 8 | 反馈 | `VideoProductionFeedback` | — |

容器:`<main className="flex-1 container mx-auto px-4 py-8 space-y-6 max-w-6xl">`
通用卡:`rounded-2xl border border-primary/20 bg-card p-6`
卡标题:`<h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-on-surface">` + icon `h-5 w-5`

## 3 · 组件规格

### 3.1 VideoProductionHero
`<header className="space-y-3">` · h1 `font-display text-4xl md:text-5xl font-bold text-on-surface` = `VIDEO_PRODUCTION_H1` · p `font-cn text-base text-muted-foreground mt-3` = `VIDEO_PRODUCTION_SUBTITLE`

### 3.2 VideoProductionInputCard(props: `copy: string; onCopyChange: (v:string)=>void`)
通用卡内:
- `<textarea>` value=copy · `w-full min-h-[280px] resize-y border-0 bg-transparent font-cn text-base leading-relaxed text-on-surface focus:outline-none`
- 底行 `mt-4 flex justify-end`(注意:**无字数计数器**) · button `flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-cn font-bold text-on-primary hover:bg-primary/90 transition-colors` · 内含 `<Clapperboard className="h-4 w-4" />` + `VIDEO_PRODUCTION_CTA` · onClick → `toast.success('已生成制作方案')`

### 3.3 VideoProductionStoryboard + VideoProductionSceneCard
通用卡 · h2 `<Camera/>` + `VIDEO_PRODUCTION_STORYBOARD_TITLE` · `<div className="space-y-4">` map `VIDEO_PRODUCTION_STORYBOARD` → `<VideoProductionSceneCard scene={s} />`(key=s.scene)
`VideoProductionSceneCard`(props `scene: VideoProductionScene`)· import label `VIDEO_PRODUCTION_SCENE_LABELS`:
- 外框 `rounded-lg border border-border/40 bg-input/30 p-4 space-y-2`
- 顶行 `flex items-center justify-between`:左 `font-display text-base font-bold text-primary`={scene.scene} · 右 time `rounded bg-muted/40 px-2 py-0.5 font-mono text-xs text-muted-foreground`={scene.time}
- 行:`镜头：`{shot} · `画面：`{frame} —— 格式 `<p className="font-cn text-sm text-muted-foreground"><span className="text-muted-foreground/70">{LABEL}：</span>{value}</p>`
- 口播 高亮框:`rounded border-l-2 border-primary bg-primary/5 px-3 py-2` 内 `<p className="font-cn text-sm text-on-surface"><span className="...">口播：</span>{voiceover}</p>`
- 行:`动作：`{action}
- 行:`转场：` + `<span className="text-primary font-semibold">{transition}</span>`

### 3.4 VideoProductionShootingPlan
通用卡 · h2 `<Camera/>` + `VIDEO_PRODUCTION_SHOOTING_TITLE` · import `VIDEO_PRODUCTION_SHOOTING`
- `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">` 6 子块(顺序:设备建议/场景建议/灯光建议/服装建议/道具清单/预计时长)
- 每子块:label `<p className="font-cn text-sm text-muted-foreground mb-2">{xxxLabel}</p>` + 内容
  - 设备建议/道具清单:`<ul className="space-y-1.5">` 每项 `<li className="font-cn text-sm text-on-surface/85 flex gap-2"><span className="text-primary">·</span><span>{item}</span></li>`
  - 场景/灯光/服装:`<p className="font-cn text-sm text-on-surface/85 leading-relaxed">{value}</p>`
  - 预计时长:`<p className="font-cn text-base font-semibold text-on-surface">{duration}</p>`

### 3.5 VideoProductionTeleprompter(绿色卡)
- 外卡 `rounded-2xl border border-green-500/30 bg-card p-6`
- 顶行 `mb-4 flex items-center justify-between`:h2 `flex items-center gap-2 font-display text-xl font-bold text-green-500` `<Mic className="h-5 w-5"/>` + `VIDEO_PRODUCTION_TELEPROMPTER_TITLE` · 右 copy button `aria-label="复制提词器"` `<Copy className="h-4 w-4"/>`(text-muted-foreground hover:text-on-surface) onClick → `navigator.clipboard.writeText(VIDEO_PRODUCTION_TELEPROMPTER).then(()=>toast.success('已复制提词器'))`
- 正文框 `rounded-lg border border-border/40 bg-input/30 p-4` · `<p className="font-cn text-sm leading-loose text-on-surface/90 whitespace-pre-wrap">{VIDEO_PRODUCTION_TELEPROMPTER}</p>`

### 3.6 VideoProductionBgm
通用卡 · h2 `<Music/>` + `VIDEO_PRODUCTION_BGM_TITLE` · import `VIDEO_PRODUCTION_BGM`
- `<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">`:风格行 `风格：`(muted)+`<span className="font-semibold text-on-surface">{style}</span>` · 情绪行 `情绪：`+`{mood}`
- chips `flex flex-wrap gap-3`:每 chip `rounded-full border border-primary/40 bg-primary/5 px-4 py-2 font-cn text-sm text-primary`={chip}

### 3.7 VideoProductionEditing
通用卡 · h2 `<Scissors className="h-5 w-5 text-red-400"/>`(注意 icon 红色) + `VIDEO_PRODUCTION_EDITING_TITLE` · `<ol className="space-y-3">` map `VIDEO_PRODUCTION_EDITING`(key=item) → `<li className="flex gap-3 font-cn text-sm leading-relaxed text-muted-foreground"><span className="font-display font-bold text-red-400">{i+1}.</span><span>{item}</span></li>`

### 3.8 VideoProductionFeedback
`<div className="flex items-center gap-3">` · p `font-cn text-sm text-muted-foreground`=`VIDEO_PRODUCTION_FEEDBACK_PROMPT` · `<ThumbsUp/>`(aria-label="有帮助")+`<ThumbsDown/>`(aria-label="无帮助")各 `h-4 w-4` · onClick → `toast.success('感谢反馈')`

## 4 · Page.tsx 重写规格
```tsx
import { useState } from 'react';
import { VIDEO_PRODUCTION_DEFAULT_COPY } from '@/lib/constants/video-production';
// import 8 组件
export default function VideoProduction() {
  const [copy, setCopy] = useState<string>(VIDEO_PRODUCTION_DEFAULT_COPY);
  return (
    <main className="flex-1 container mx-auto px-4 py-8 space-y-6 max-w-6xl">
      <VideoProductionHero />
      <VideoProductionInputCard copy={copy} onCopyChange={setCopy} />
      <VideoProductionStoryboard />
      <VideoProductionShootingPlan />
      <VideoProductionTeleprompter />
      <VideoProductionBgm />
      <VideoProductionEditing />
      <VideoProductionFeedback />
    </main>
  );
}
```
(除 InputCard 外其余组件无 props · 各自 import 常量)

## 5 · 测试规格(重写 `__tests__/VideoProduction.test.tsx`)
- 删旧 trpc mock · 仅 `vi.mock('sonner', ...)` + MemoryRouter
- 参考 `Analysis.test.tsx` 结构 · 断言:
  - h1=`VIDEO_PRODUCTION_H1` · subtitle · CTA button(`/生成制作方案/` enabled)
  - 默认文案:`getByRole('textbox')` `toHaveValue(VIDEO_PRODUCTION_DEFAULT_COPY)`(多行用 toHaveValue 不要 getByDisplayValue)
  - 5 section 标题(分镜脚本/拍摄方案/口播提词器/配乐建议/剪辑要点)
  - 分镜:`场景 1`/`场景 14` + time `0:00-0:03`/`1:14-1:18` + 某 voiceover(注意 voiceover 也在 teleprompter+textarea 出现 → 用 `getAllByText(...).length>=1`)
  - 拍摄方案:设备项 `手机（iPhone 15 Pro Max或同级别安卓旗舰）` · 预计时长 `1分20秒 - 1分30秒`
  - 配乐 4 chip(`Future Bass` 等)
  - 剪辑要点 11 条之一
  - 反馈 prompt
  - 字面重叠的串一律 `getAllByText(...).length>=1`(如「评论区聊聊你的看法」「370万」在多处)

## 6 · 参考文件(必读)
- `apps/web/src/lib/constants/video-production.ts`(真相源 · 全 import)
- `apps/web/src/pages/tools/Analysis.tsx` + `components/analysis/*`(同范式:Hero/InputCard/卡片/Feedback · 刚由 Opus 写 · 风格照抄)
- `apps/web/src/pages/tools/__tests__/Analysis.test.tsx`(测试范式)
- `apps/web/src/pages/tools/components/monetization/MonetizationHero.tsx`(Hero token)

## 7 · 验收
- `pnpm --filter @quanan/web typecheck` 0 error
- `pnpm --filter @quanan/web test -- src/pages/tools/__tests__/VideoProduction.test.tsx` 全绿
- `pnpm --filter @quanan/web exec eslint <新增文件>` 0 problem(import 顺序:react → 三方 → @/ · 组内空行会被 import/order 报错 · 注意)
- 报告 DONE + 文件清单 + typecheck/test 结果

## 8 · 红线复述
1. 组件零中文 mock 字面 · 全 import 常量
2. 逐字 · 不概括/不改写 · "" 全角引号保留
3. 无 uppercase class · lucide 非 emoji
4. 不动 router/tools index/apps api
5. import 顺序符合 eslint import/order(否则 lint fail)
