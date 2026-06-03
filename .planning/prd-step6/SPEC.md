# /step/6 "拍摄计划" 完全重写 SPEC

> **作者** · Opus 4.7(team plan)
> **执行** · Sonnet 4.6 max
> **目标** · 1:1 字面复刻 aiipznt sally zhao /step/6 真实输出 · form 1 字段 + 3 output sub-component
> **不动** · router.tsx · 旧 step6.ts 常量(留 @deprecated)

---

## 1 · 背景 + 工程约束

### 现状
- `apps/web/src/pages/step/Step6.tsx` (288 行旧版 · 必须完全重写)
- `apps/web/src/lib/constants/step6.ts` (87 行 · 部分复用 · 加新常量 · 旧 @deprecated)
- `apps/web/src/components/step6/` (目录不存在 · 新建)
- `apps/web/src/router.tsx:86` 已挂 `{ path: '6', element: <Step6 /> }` · **不动 router**

### 视觉风格参考(必读)
Sonnet 必读 ·
- `apps/web/src/components/step4/Step4PhaseSection.tsx` (sub-card list 模式)
- `apps/web/src/components/step4/Step4DailyScheduleSection.tsx` (time-based item list 模式 · 跟分镜脚本类似)
- `apps/web/src/components/step3b/RoadmapSection.tsx` (timeline + number chip · 跟分镜镜头编号风格类似)
- `apps/web/src/components/ui/sub-card.tsx`
- `apps/web/src/components/icons/aiipznt-icons.tsx`

**严格沿用** · text-xs / text-on-surface / text-muted-foreground / bg-primary/10

---

## 2 · 完整 schema(TypeScript interface)

```typescript
export interface Step6Result {
  // ── 分镜脚本(10 镜头)─────────────────────────────────
  storyboard: Step6Shot[];

  // ── 拍摄方案 ─────────────────────────────────────────────
  productionPlan: {
    equipment: string[];        // 5 项设备
    location: string;           // 地点段
    lighting: string;           // 光照段
    props: string[];            // 6 项道具
    wardrobe: string;           // 服装段
    totalDuration: string;      // 45-50秒
  };

  // ── 口播提词器(6 段)─────────────────────────────────
  voiceoverScript: string[];    // 6 段(场景说明 + 文字 一体)
}

export interface Step6Shot {
  index: number;                // 1-10
  timeRange: string;            // 0:00-0:03
  shotType: string;             // 特写/中景，正面
  visual: string;               // 画面: ...
  audio: string;                // 音频: ...
}

export interface Step6FormData {
  content: string;              // 文案内容(单一字段)
}
```

---

## 3 · Form 默认值(useState initial · 1:1 sally · 797 字)

```typescript
const DEFAULT_FORM: Step6FormData = {
  content: `【标题】为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？

【话题抛出】你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？

【正方】（轻松赚钱派：AI赋能，效率为王）
我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。

【反方】（传统派：服务为本，温度至上）
但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。

【我的立场】
其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，用AI把那些可以标准化的流程优化到极致，把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。这不就是把"低成本高回报"和"以小搏大"玩明白了？关键在于，你有没有看到这个趋势，有没有勇气去尝试。

【评论区引导】
你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。

【话题标签】 #美业 #AI赋能 #智能体 #赚钱思维 #效率提升 #创业者 #商业模式 #美业老板 #行业洞察`,
};
```

---

## 4 · 完整 mock data · 逐字提取

> ⚠️ Sonnet **必须逐字 copy** · 全角中文标点(，。：、)严格保留 · "" 中文双引号必须保留 · 不允许概括/删减

```typescript
function generateMockResult(): Step6Result {
  return {
    // ── 分镜脚本 10 镜头 ──────────────────────────────────
    storyboard: [
      {
        index: 1,
        timeRange: '0:00-0:03',
        shotType: '特写/中景，正面',
        visual: '你（IP本人）坐在办公室里，表情略带思考或疑惑，背景是简洁的办公环境，可以有一些电脑屏幕、白板等元素，但不要太杂乱。',
        audio: '（BGM起，轻快但略带悬念）你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；',
      },
      {
        index: 2,
        timeRange: '0:03-0:06',
        shotType: '中景，正面',
        visual: '你（IP本人）表情变得轻松自信，背景可以是办公室一角，或者切换到一个更明亮、有活力的场景（比如咖啡馆，代表轻松）。',
        audio: '有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？',
      },
      {
        index: 3,
        timeRange: '0:06-0:12',
        shotType: '中景，侧面/正面',
        visual: '你（IP本人）坐在办公室，电脑屏幕上可以模糊地显示一些AI相关的界面或数据图表。画面可以穿插一些文字动画，比如"AI赋能"、"效率为王"。',
        audio: '我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。',
      },
      {
        index: 4,
        timeRange: '0:12-0:17',
        shotType: '中景，正面',
        visual: '你（IP本人）表情自信，手势强调。可以配上一些动态的文字，比如"省20万"、"效率10倍"。',
        audio: '员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。',
      },
      {
        index: 5,
        timeRange: '0:17-0:21',
        shotType: '特写/中景，正面',
        visual: '你（IP本人）表情变得略带思考，仿佛在转述别人的观点。背景可以稍微暗一点，或者切换到一个比较温馨的场景，比如家里的沙发，代表"人情味"。',
        audio: '但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？',
      },
      {
        index: 6,
        timeRange: '0:21-0:27',
        shotType: '中景，正面',
        visual: '你（IP本人）表情真诚，手势强调"情感连接"。可以穿插一些温馨的图文素材，比如美容师为客户服务的特写，或者老客户和老板亲切交流的画面。',
        audio: '一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。',
      },
      {
        index: 7,
        timeRange: '0:27-0:31',
        shotType: '中景，正面',
        visual: '你（IP本人）表情豁然开朗，背景切换回办公室或一个明亮的工作空间，可以有AI智能体的logo或相关视觉元素。画面可以有"AI+人情味"的文字动画。',
        audio: '其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，',
      },
      {
        index: 8,
        timeRange: '0:31-0:37',
        shotType: '中景，正面',
        visual: '你（IP本人）表情自信且充满智慧，手势强调"优化极致"和"投入"。画面可以穿插AI智能体工作流程的示意图（简化版），或者你和客户沟通的Vlog片段（模拟成交场景）。',
        audio: '用AI把那些可以标准化的流程优化到极致，把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。',
      },
      {
        index: 9,
        timeRange: '0:37-0:42',
        shotType: '特写/中景，正面',
        visual: '你（IP本人）表情自信，带着鼓励的微笑。背景可以是你和客户成功交付智能体的合影（工作场景），或者你对着镜头竖起大拇指。画面可以有"低成本高回报"、"以小搏大"的文字动画。',
        audio: '这不就是把"低成本高回报"和"以小搏大"玩明白了？关键在于，你有没有看到这个趋势，有没有勇气去尝试。',
      },
      {
        index: 10,
        timeRange: '0:42-0:45',
        shotType: '特写，正面',
        visual: '你（IP本人）表情亲切，眼神看向镜头。画面下方出现评论区引导文字。',
        audio: '（BGM音量渐大）你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。',
      },
    ],

    // ── 拍摄方案 ─────────────────────────────────────────
    productionPlan: {
      equipment: [
        '手机（iPhone 15 Pro Max或同级别安卓旗舰）',
        '手机稳定器（大疆Osmo Mobile系列）',
        '补光灯（小型LED补光灯，如神牛Litemons LA150D）',
        '无线麦克风（罗德Wireless Go II或大疆DJI Mic）',
        '三脚架',
      ],
      location: '办公室、咖啡馆、家里温馨一角，或者可以模拟美容院场景（如果方便）。主要以能体现专业和生活化的场景为主，比如你的工作室或一个干净明亮的办公空间。',
      lighting: '自然光为主，配合补光灯柔化阴影，确保面部光线均匀明亮。避免逆光和强光直射。',
      props: [
        '笔记本电脑（显示AI界面或数据图表）',
        '咖啡杯（生活场景）',
        '白板或便签纸（工作场景）',
        '书籍（学习场景）',
        '手机（模拟客户沟通或展示AI应用）',
        '一些绿色植物（增加活力）',
      ],
      wardrobe: '商务休闲风格，比如衬衫、Polo衫或质感好的T恤，搭配休闲裤或牛仔裤。颜色以素雅、专业为主，避免过于花哨。给人一种专业、可靠又亲切的感觉。',
      totalDuration: '45-50秒',
    },

    // ── 口播提词器(6 段)──────────────────────────────────
    voiceoverScript: [
      '（开场略带疑惑，BGM起）你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；（转为轻松自信）有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？',
      '（讲述案例，自信）我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。',
      '（转述反方观点，略带思考）但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。',
      '（表达自己立场，自信且充满智慧）其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，用AI把那些可以标准化的流程优化到极致，把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。这不就是把"低成本高回报"和"以小搏大"玩明白了？关键在于，你有没有看到这个趋势，有没有勇气去尝试。',
      '（BGM音量渐大，亲切邀请互动）你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。',
    ],
  };
}
```

注意 · voiceoverScript 截图里看起来 5 段(开场 / 案例 / 反方 / 立场 / 互动)· 我数了下 · 是 5 段(中间还有原本截图段 5: BGM音量渐大 · 应该最后一段)。共 5 段(数字 5)· 但我之前误数为 6 · 实际 5 段。

---

## 5 · 3 sub-component 详细规格

### 5.1 Step6StoryboardSection.tsx(分镜脚本 10 镜头)

文件 · `apps/web/src/components/step6/Step6StoryboardSection.tsx`
Props · `{ shots?: Step6Shot[]; defaultExpanded?: boolean; className?: string; }`

Layout(整段一个 SubCard · 含折叠):
1. H3 row · `<div className="flex items-center justify-between">`:
   - 左 · `<h3>分镜脚本 <span className="chip">{shots?.length ?? 0} 个镜头</span></h3>`
   - 右 · 折叠 ^ button(ChevronUp/Down · 用 useState 控制 expanded · default true)
2. (条件 expanded) shots.map · space-y-3:
   - 每镜头 · grid-cols-[60px_1fr] gap-4 items-start:
     - 左 · 大数字 chip(`<span text-2xl font-bold text-on-surface bg-primary/15 border-primary/30 rounded-lg w-12 h-12 flex items-center justify-center>{index.toString().padStart(2, '0')}</span>`)
     - 右 · 内容(space-y-1):
       - row · time chip(`<span text-xs text-primary bg-primary/10 border-primary/25 rounded px-2 py-0.5>{timeRange}</span>`)
       - shotType(`<p text-sm font-semibold text-on-surface>{shotType}</p>`)
       - 画面行(`<p text-xs leading-relaxed><span className="text-primary/85 font-medium">画面：</span><span className="text-muted-foreground">{visual}</span></p>`)
       - 音频行(`<p text-xs leading-relaxed><span className="text-primary/85 font-medium">音频：</span><span className="text-muted-foreground">{audio}</span></p>`)

### 5.2 Step6ProductionPlanSection.tsx(拍摄方案)

文件 · `apps/web/src/components/step6/Step6ProductionPlanSection.tsx`
Props · `{ plan?: Step6Result['productionPlan']; defaultExpanded?: boolean; className?: string; }`

Layout(整段一个 SubCard · 含折叠):
1. H3 row + 折叠 ^ button(同上)
2. (条件 expanded) 6 字段 stack(space-y-4):
   - 每字段 SubCard:
     - `<p text-xs font-semibold text-primary uppercase>{key}</p>`(英文 key 全大写 · equipment / location / lighting / props / wardrobe / totalDuration)
     - 如果是 string · `<p text-xs text-muted-foreground leading-relaxed>{value}</p>`
     - 如果是 string[] · `<p text-xs text-muted-foreground leading-relaxed>["{items.join('","')}"]</p>` · 注意截图实际是字面 JSON array 显示(带 [" 和 "])

### 5.3 Step6VoiceoverScriptSection.tsx(口播提词器)

文件 · `apps/web/src/components/step6/Step6VoiceoverScriptSection.tsx`
Props · `{ script?: string[]; defaultExpanded?: boolean; className?: string; }`

Layout(整段一个 SubCard · 含折叠):
1. H3 row · `<div className="flex items-center justify-between">`:
   - 左 · `<h3>口播提词器 <span className="chip 金色 bg-primary/15 border-primary/30 text-primary">可直接使用</span></h3>`
   - 右 · 折叠 ^ button
2. (条件 expanded) 5 段 stack(space-y-4):
   - 每段 · `<p text-sm text-on-surface/90 leading-loose>{paragraph}</p>`

---

## 6 · Step6.tsx 重写规格

文件 · `apps/web/src/pages/step/Step6.tsx`(完全替换 288 行)

### 6.1 import

```typescript
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Step6StoryboardSection } from '@/components/step6/Step6StoryboardSection';
import { Step6ProductionPlanSection } from '@/components/step6/Step6ProductionPlanSection';
import { Step6VoiceoverScriptSection } from '@/components/step6/Step6VoiceoverScriptSection';
import { Step3LoadingState } from '@/components/step3/Step3LoadingState';
import { Button } from '@/components/ui/button';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
```

### 6.2 函数体结构

```typescript
export default function Step6() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step6');

  // PRD-29.11 · default form 1:1 sally
  const [content, setContent] = useState(DEFAULT_FORM.content);

  const prevIsSavingRef = useRef(false);

  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step6FormData>(accountId, 'step6');
    if (saved?.content) setContent(saved.content);
  }, [accountId]);

  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  const isLoading = isLocalGenerating || isSaving;

  const generated: Step6Result = generateMockResult();
  const canBulkActions = !isLoading;
  const charCount = content.length;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    setIsLocalGenerating(true);
    save({ content });
    setTimeout(() => { setIsLocalGenerating(false); toast.success('生成完成'); }, 1200);
  }
  function handleCopyAll() { navigator.clipboard.writeText(JSON.stringify(generated, null, 2)).then(() => toast.success('已复制全部')); }
  function handleOptimize() { if (canBulkActions) toast.success('已智能优化'); }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* 1. Header */}
      <header className="space-y-3">
        <p className="text-xs font-semibold text-primary tracking-wide">
          STEP 06 › 生成拍摄计划
        </p>
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          📷 拍摄计划
        </h1>
        <p className="text-sm text-muted-foreground">
          输入你的文案内容，AI将自动生成完整的分镜脚本、拍摄方案和口播提词器。
        </p>
      </header>

      {/* 2. Form · 1 textarea + char count + main CTA */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-card/30 border border-border/40 rounded-lg p-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">
            文案内容 <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[400px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y font-mono"
            required
          />
          <p className="text-xs text-muted-foreground text-right">已输入 {charCount} 字</p>
        </div>

        <Button type="submit" disabled={!content.trim() || isLoading} className="w-full bg-primary hover:bg-primary/90">
          📷 生成拍摄计划
        </Button>
      </form>

      {/* 3. Loading state */}
      {isLoading && <Step3LoadingState />}

      {/* 4. Output area H2 + toolbar(只 2 button · 无"重新生成") */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
          📷 完整拍摄计划
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleOptimize}>
            ✨ 智能优化
          </Button>
          <Button variant="outline" size="icon" disabled={!canBulkActions} onClick={handleCopyAll} aria-label="复制全部">
            📋
          </Button>
        </div>
      </div>

      {/* 5. 3 H3 sections */}
      <Step6StoryboardSection shots={generated.storyboard} />
      <Step6ProductionPlanSection plan={generated.productionPlan} />
      <Step6VoiceoverScriptSection script={generated.voiceoverScript} />
    </main>
  );
}
```

---

## 7 · step6.ts 常量补充

末尾追加:

```typescript
// ─── PRD-29.11 · 真实字面 ──────────────────────────────────
export const STEP6_BREADCRUMB_REAL = 'STEP 06 › 生成拍摄计划' as const;
export const STEP6_H1_REAL = '拍摄计划' as const;
export const STEP6_OUTPUT_H2 = '完整拍摄计划' as const;
export const STEP6_SUBTITLE_REAL = '输入你的文案内容，AI将自动生成完整的分镜脚本、拍摄方案和口播提词器。' as const;
export const STEP6_BUTTON_GENERATE_REAL = '生成拍摄计划' as const;
export const STEP6_FORM_CONTENT_LABEL = '文案内容' as const;
export const STEP6_CTA_OPTIMIZE = '智能优化' as const;
export const STEP6_CTA_COPY = '复制全部' as const;
export const STEP6_VOICEOVER_USABLE_CHIP = '可直接使用' as const;

// 3 H3 label
export const STEP6_H3_STORYBOARD = '分镜脚本' as const;
export const STEP6_H3_PRODUCTION = '拍摄方案' as const;
export const STEP6_H3_VOICEOVER = '口播提词器' as const;

// production plan field keys(英文小写显示)
export const STEP6_PRODUCTION_KEYS = ['equipment', 'location', 'lighting', 'props', 'wardrobe', 'totalDuration'] as const;
```

---

## 8 · 文件输出 list

| # | path | 操作 | 行数估 |
|:-:|---|:-:|:-:|
| 1 | `apps/web/src/lib/constants/step6.ts` | Edit(末尾追加 ~20 行) | +20 |
| 2 | `apps/web/src/components/step6/Step6StoryboardSection.tsx` | new | ~75 |
| 3 | `apps/web/src/components/step6/Step6ProductionPlanSection.tsx` | new | ~75 |
| 4 | `apps/web/src/components/step6/Step6VoiceoverScriptSection.tsx` | new | ~55 |
| 5 | `apps/web/src/pages/step/Step6.tsx` | rewrite(替换 288 行 · 含 mock ~300 行) | ~550 |

不动 · router.tsx · 旧 step6 常量 · 其他 page

---

## 9 · 验收

1. typecheck 0 error
2. dev server http://localhost:5173/step/6 可访问
3. innerText 50-70 关键字 grep

---

## 10 · Sonnet 工作流程

1. **必读**:
   ```
   Read apps/web/src/components/step4/Step4PhaseSection.tsx
   Read apps/web/src/components/step4/Step4DailyScheduleSection.tsx
   Read apps/web/src/components/step3b/RoadmapSection.tsx
   Read apps/web/src/components/ui/sub-card.tsx
   ```
2. Edit step6.ts 末尾追加
3. Write 3 sub-component
4. Write Step6.tsx 完全重写
5. typecheck PASS
6. 报告

---

## 11 · 红线

- ❌ 不动 router.tsx
- ❌ 不删旧 step6 常量(留 @deprecated)
- ❌ 不允许概括 §3 form 默认值或 §4 mock data(全部逐字 · 包括截图里的中文双引号)
- ❌ toolbar 只 2 button("智能优化 + 复制全部")· 不要"重新生成"
- ❌ emoji 保留: 📷 ✨ 📋 ^(折叠 chevron)
- ❌ voiceoverScript 数组 5 段(不是 6 · 注意 §4 我的数组是 5 段)
- ❌ productionPlan 字段 key 显示英文小写(equipment / location 等)· 截图里就是英文 key + 中文值

---

## 12 · 报告格式

```
DONE / BLOCKED
写了 X 个文件: ...
typecheck: PASS / FAIL
异常: ...
下一步建议 Opus 做的事: ...
```
