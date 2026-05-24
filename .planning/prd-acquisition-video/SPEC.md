# /acquisition-video "获客型视频制作" 完全重写 SPEC

> **作者** · Opus 4.7
> **执行** · Sonnet 4.6 max
> **目标** · 1:1 字面复刻 aiipznt sally /acquisition-video · 2 列 layout(form + JSON 字面输出)
> **不动** · router.tsx · 旧 AcquisitionVideoResult.tsx / acquisitionVideoFrontend.ts schema(留 @deprecated)

---

## 1 · 现状

- `apps/web/src/pages/tools/AcquisitionVideo.tsx` (238 行旧 · 完全重写)
- `apps/web/src/components/ToolResult/AcquisitionVideoResult.tsx` (112 行 · 留 @deprecated)
- `apps/web/src/lib/schemas/acquisitionVideoFrontend.ts` (旧 schema · 留)
- `apps/web/src/lib/constants/acquisition-video.ts` **不存在 · 新建**
- `apps/web/src/router.tsx:104` 已挂 · **不动**

### 视觉参考
- `apps/web/src/pages/tools/PrivateDomain.tsx` (form + output layout)
- `apps/web/src/components/step6/Step6ProductionPlanSection.tsx` (JSON-like 字面输出)
- `apps/web/src/components/ui/sub-card.tsx`

---

## 2 · schema

```typescript
export interface AcquisitionVideoFormData {
  industry: string;          // 美业 default
  customerProfile: string;
  productHighlights: string;
}
```

输出 · 整个 JSON 字符串 (用户提供 · 1:1)。

---

## 3 · Form 默认值

```typescript
const DEFAULT_FORM: AcquisitionVideoFormData = {
  industry: '💅 美业',
  customerProfile: '想要创业的3-45岁宝妈群体，有一定积蓄但缺乏方向',
  productHighlights: '零基础可学、3个月回本、一对一指导',
};

const INDUSTRY_OPTIONS = [
  { value: 'beauty',    label: '💅 美业' },
  { value: 'fitness',   label: '💪 健身' },
  { value: 'education', label: '📚 教育培训' },
  { value: 'food',      label: '🍔 餐饮' },
  { value: 'fashion',   label: '👗 时尚' },
  { value: 'tech',      label: '💻 科技' },
  { value: 'other',     label: '✨ 其他' },
];
```

---

## 4 · 完整 mock data · 用户提供 JSON 1:1(逐字)

```typescript
const GENERATED_RESULT_JSON = `{ "strategy": { "hookType": "免费创业资料包、行业趋势分析报告、1对1创业咨询名额", "painPoint": "宝妈创业迷茫、担心投入打水漂、缺乏专业指导、时间精力有限", "trustMethod": "真实学员案例分享、数据化收益展示、专家导师出镜、零基础教学过程展示", "ctaDesign": "评论区引导领取资料、私信关键词获取咨询、主页链接查看成功案例" }, "scripts": [ { "title": "30岁宝妈，辞职3个月，靠这招月入3万，你也能做到！", "style": "真人出镜+实拍案例混剪", "targetPain": "创业迷茫，担心投入风险，追求快速回本", "script": { "opening": "你是不是也想创业，但又怕选错方向，钱打水漂？我身边这位30岁宝妈，辞职前月薪不到5千，现在靠美业小店，3个月就回本，月入3万+", "development": "她之前跟你一样，没经验，没方向。但她选对了项目，我们提供零基础教学，从手法到拓客，手把手教。你看，这是她店里今天的流水，这是她的学员反馈，都说学得快、上手容易。", "climax": "她最开始也担心学不会，但我们承诺一对一指导，直到你完全掌握。现在她不仅自己赚钱，还能兼顾孩子，时间自由。你是不是也想知道她是怎么做到的？", "ending": "如果你也想3个月回本，月入过万，评论区留言"创业"，我把她用的"美业新手创业秘籍"发给你，帮你少走弯路。" }, "boomElements": [ "真实学员案例", "收益数据展示", "零基础教学承诺", "快速回本时间" ], "expectedConversion": "高意向客户评论"创业"，获取资料并进入私域咨询流程。" }, { "title": "宝妈在家带娃，如何轻松月入2万？这份美业副业指南，你必须看！", "style": "情景剧+教学片段混剪", "targetPain": "时间碎片化，需要灵活的创业模式，担心学习难度", "script": { "opening": "带娃太忙，想赚钱又没时间？我给你看个视频。这位宝妈，每天只用碎片时间，在家就能做美业，现在每月额外收入2万多，她是怎么做到的？", "development": "她选择的项目，操作简单，不需要大投入。我们提供线上线下结合的教学，零基础也能学。你看，这是她在家练习的场景，这是她给客户服务的照片，手法专业，客户都说好。我们的一对一指导，确保她每个步骤都学会、做对。", "climax": "她最担心的是学不会，但我们有系统课程，从理论到实操，每个细节都讲透。现在她不仅经济独立，还有了更多时间陪伴孩子。你是不是也想拥有这样的自由？", "ending": "如果你也想在家轻松赚钱，评论区扣"美业"，我免费送你一份《宝妈居家美业创业指南》，里面有详细的项目介绍和学习路径，帮你找到适合自己的路。" }, "boomElements": [ "居家创业场景", "碎片化时间利用", "零基础易学", "免费指南钩子" ], "expectedConversion": "对居家创业感兴趣的宝妈评论"美业"，获取指南，提升对项目的认知和兴趣。" }, { "title": "别再观望了！美业小白3个月逆袭店长，她只做了这3件事！", "style": "访谈式+数据图表", "targetPain": "缺乏方向，害怕失败，需要明确的成功路径", "script": { "opening": "你是不是想创业，却不知道从何开始？我采访了一位美业小白，她从零基础到店长，只用了3个月。她到底做了哪3件事？", "development": "第一，选对平台：我们提供完整的创业扶持，不只是教技术，更教你如何开店、如何运营。第二，专业指导：我们承诺一对一教学，从选址到拓客，全程保姆式服务。第三，快速回本：我们有成熟的盈利模式，很多学员3个月就回本了，你看这些数据，都是真实案例。", "climax": "她最开始也担心自己没经验，但我们有专门针对零基础学员的课程体系，确保每个人都能学会。现在她不仅实现了经济独立，还带动了身边姐妹一起创业。你是不是也想知道这3件事的具体细节？", "ending": "如果你也想抓住美业红利，评论区私信我"店长"，我送你一份《美业创业成功路径图》，里面有详细的步骤和我们最新的扶持政策，帮你快速启动你的美业事业。" }, "boomElements": [ "逆袭故事", "数据支撑", "完整创业扶持", "免费路径图" ], "expectedConversion": "有强烈创业意愿、寻求完整解决方案的客户私信"店长"，获取更深入的资料和咨询机会。" } ], "commentGuide": { "seedComments": [ "真的能3个月回本吗？好心动！", "我就是零基础宝妈，想知道具体学什么？", "有线上课程吗？带娃不方便出门。", "求《美业新手创业秘籍》！想了解更多。", "私信了，希望真的能帮到我！" ], "replyTemplates": [ "私信你了哦，详细的资料已经发给你了，快去看看吧！", "是的，我们很多学员都做到了！想知道他们是怎么做到的吗？评论区留言"创业"，我把秘籍发给你！", "零基础完全没问题！我们有专门针对新手的课程，手把手教你。想了解课程详情吗？私信我"课程"！", "线上课程也有哦，方便你带娃学习。想了解更多，评论区扣"美业"，我把指南发给你！", "已经私信你了，请注意查收。有什么问题可以随时问我哦！" ] }, "optimizationTips": [ "视频开头3秒内必须抛出核心痛点或收益，抓住目标用户注意力。", "多使用真实学员的口述或出镜，增加视频的真实感和说服力。", "CTA（Call To Action）必须清晰、明确，指引用户到评论区或私信，并提供具体关键词。", "背景音乐选择轻松、励志的风格，符合宝妈群体的审美和情绪。", "视频画面要干净、明亮，展示美业的专业性和美好前景。" ] }`;
```

注意 · JSON 字符串里所有 `"..."` 单字符引号都用中文 " 和 "(直引号 · 不是反向引号)· 跟 sally 截图字面一致。

---

## 5 · AcquisitionVideo.tsx 重写

```typescript
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AcquisitionVideo() {
  const [industry, setIndustry] = useState(DEFAULT_FORM.industry);
  const [customerProfile, setCustomerProfile] = useState(DEFAULT_FORM.customerProfile);
  const [productHighlights, setProductHighlights] = useState(DEFAULT_FORM.productHighlights);

  function handleGenerate() {
    if (!customerProfile.trim() || !productHighlights.trim()) return;
    toast.success('已生成获客方案');
  }
  function handleFeedbackUp() { toast.success('感谢反馈!'); }
  function handleFeedbackDown() { toast.info('我们会持续改进'); }

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-6xl">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-on-surface">获客型视频制作</h1>
        <p className="text-sm text-muted-foreground">专为获客设计的短视频方案，让精准客户主动找上门</p>
      </header>

      {/* 2 列 layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左 · 获客信息 form */}
        <div className="bg-card/30 border border-border/40 rounded-lg p-5 space-y-4">
          <p className="text-sm font-semibold text-on-surface">获客信息</p>

          <div className="space-y-2">
            <label className="block text-xs text-muted-foreground">选择行业</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm text-on-surface"
            >
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.label}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-muted-foreground">
              目标客户画像 <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={customerProfile}
              onChange={(e) => setCustomerProfile(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-muted-foreground">
              产品/服务卖点 <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={productHighlights}
              onChange={(e) => setProductHighlights(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
              required
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!customerProfile.trim() || !productHighlights.trim()}
            className="w-full bg-primary hover:bg-primary/90"
          >
            生成获客方案
          </Button>
        </div>

        {/* 右 · 获客视频方案(JSON 字面 raw 输出) */}
        <div className="bg-card/30 border border-border/40 rounded-lg p-5 space-y-3">
          <p className="text-sm font-semibold text-on-surface">获客视频方案</p>
          <div className="text-sm text-on-surface/85 leading-relaxed whitespace-pre-wrap font-cn">
            {GENERATED_RESULT_JSON}
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground">这个结果对你有帮助吗？</p>
        <Button variant="ghost" size="icon" onClick={handleFeedbackUp} aria-label="有帮助">👍</Button>
        <Button variant="ghost" size="icon" onClick={handleFeedbackDown} aria-label="无帮助">👎</Button>
      </div>
    </main>
  );
}
```

---

## 6 · acquisition-video.ts 常量(新建)

```typescript
export const ACQUISITION_VIDEO_H1 = '获客型视频制作' as const;
export const ACQUISITION_VIDEO_SUBTITLE = '专为获客设计的短视频方案，让精准客户主动找上门' as const;
export const ACQUISITION_VIDEO_FORM_TITLE = '获客信息' as const;
export const ACQUISITION_VIDEO_INDUSTRY_LABEL = '选择行业' as const;
export const ACQUISITION_VIDEO_CUSTOMER_LABEL = '目标客户画像' as const;
export const ACQUISITION_VIDEO_PRODUCT_LABEL = '产品/服务卖点' as const;
export const ACQUISITION_VIDEO_CTA_GENERATE = '生成获客方案' as const;
export const ACQUISITION_VIDEO_OUTPUT_TITLE = '获客视频方案' as const;
export const ACQUISITION_VIDEO_FOOTER_FEEDBACK = '这个结果对你有帮助吗？' as const;
```

---

## 7 · 文件输出 list

| # | path | 操作 | 行数估 |
|:-:|---|:-:|:-:|
| 1 | `apps/web/src/lib/constants/acquisition-video.ts` | **new** | ~12 |
| 2 | `apps/web/src/pages/tools/AcquisitionVideo.tsx` | rewrite(238 → ~150 + JSON 长文 ~50) | ~200 |

不动 · router.tsx · 旧 AcquisitionVideoResult.tsx · acquisitionVideoFrontend.ts · AcquisitionVideo.test.tsx

---

## 8 · 验收

1. typecheck 0 error
2. http://localhost:5173/acquisition-video 可访问
3. innerText 30+ key grep · JSON 字面长文显示

---

## 9 · Sonnet 工作流

1. Read SPEC.md 全文
2. Read PrivateDomain.tsx · Step6ProductionPlanSection.tsx
3. **Write** acquisition-video.ts(新建)
4. Write AcquisitionVideo.tsx 重写
5. typecheck PASS

---

## 10 · 红线

- ❌ 不动 router.tsx
- ❌ 不动旧 AcquisitionVideoResult.tsx / acquisitionVideoFrontend.ts / AcquisitionVideo.test.tsx
- ❌ §4 GENERATED_RESULT_JSON 必须**逐字** copy · 全角中文标点 / 中文双引号 " " / 《》 全保留(注意里面是中文直引号 · 不是 JSON 转义)
- ❌ JSON 用 template literal 包(`...`)· 内部不用 escape
- ❌ 行业 dropdown default 选 '💅 美业'
- ❌ 不允许 uppercase class
- ❌ 不启 dev server / 不截图

---

## 11 · 报告

```
DONE / BLOCKED
写了 X 个文件: ...
typecheck: PASS / FAIL
异常: ...
下一步建议 Opus 做的事: ...
```
