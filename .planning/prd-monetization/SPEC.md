# SPEC · /monetization 1:1 复刻

> **目标** · `apps/web/src/pages/tools/Monetization.tsx` 大改(220 → ~70 行)+ 3 sub-component · sally 2 col 大型 form + JSON raw 输出
> **风险** · M(完整 JSON mock 字面 已由用户给 · 形式跟 /acquisition-video 同 · 复用模式)

---

## §1 · 5 大偏离

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | h1 | `IP 变现模型`(空格) | `IP变现模型定制`(无空格 + 加 `定制`) |
| 2 | subtitle | `设计 IP 变现路径，从流量到收益的转化模型` | `结合行业数据和全网成功案例，为您定制清晰的IP变现路径` |
| 3 | layout | 单 col vertical · form 在上 + result 在下 | 2 col grid · 左 form card / 右 result card |
| 4 | 字段 label + 类型 | `行业背景` input / `产品描述` input / `受众画像` input / `IP 定位` input | `选择行业` dropdown / `产品/服务描述 *` textarea / `目标受众（可选）` input / `IP定位（可选）` input |
| 5 | result 渲染 | 结构化(productMatrix / pricingStrategy / conversionFunnel) | JSON raw 一字不漏字符串 · `<pre>` 或 `<div>` 显示完整字符串 |
| 6 | 数据源 | `trpc.monetization.generate` mutation | mock-first · default state result 已 populated(同 /acquisition-video) |

---

## §2 · 字面 + 视觉

### 2.1 Hero

- h1 · `IP变现模型定制` 白大字 `font-display text-4xl md:text-5xl font-bold text-on-surface`
- subtitle · `结合行业数据和全网成功案例，为您定制清晰的IP变现路径` 灰 `font-cn text-base text-muted-foreground mt-3`

### 2.2 2 col grid(mt-8)

- container · `grid grid-cols-1 lg:grid-cols-2 gap-6`

### 2.3 左 form card

- container · `rounded-2xl border border-primary/20 bg-card p-6`
- h2 · `基本信息` 白 `font-display text-xl font-bold mb-6`
- form vertical · `space-y-5`

字段 1 · **选择行业**
- label · `选择行业` 灰小 `font-cn text-sm text-muted-foreground mb-2`
- dropdown trigger · `flex items-center justify-between rounded-lg border border-primary/30 bg-input px-4 py-3 font-cn text-sm`
- default text · `📲 自媒体运营`(复用 STEP1_INDUSTRIES_56 self_media)
- 右 `ChevronDown` icon

字段 2 · **产品/服务描述 ***
- label · `产品/服务描述` + 红 `*` `text-destructive`
- textarea · `min-h-[100px] rounded-lg border border-primary/30 bg-input px-4 py-3 font-cn text-sm placeholder:text-muted-foreground/60`
- default value · `线上英语培训课程，面向职场白领`

字段 3 · **目标受众（可选）**
- label · `目标受众（可选）`
- input · single line
- default value · `25-40岁职场女性`

字段 4 · **IP定位（可选）**
- label · `IP定位（可选）`
- input · single line
- default value · `专业、接地气的英语老师人设`

CTA btn · `生成变现模型`
- `w-full bg-primary text-on-primary hover:bg-primary/90 rounded-lg py-3 font-cn font-bold mt-2`

### 2.4 右 result card

- container · `rounded-2xl border border-primary/20 bg-card p-6`
- h2 · `IP变现模型` 白 `font-display text-xl font-bold mb-6`
- body · raw JSON string 一字不漏显示 · `font-cn text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-all`(不用 pre / not code · sally 是普通 div text)

result 内容 · 见 §2.6 完整 mock(用户给)

### 2.5 底部 反馈 row

- container · `mt-6 flex items-center gap-3`
- text · `这个结果对你有帮助吗？` 灰小
- 👍 btn icon · ThumbsUp 灰 hover 金
- 👎 btn icon · ThumbsDown 灰 hover 金

### 2.6 result 完整 JSON mock(字面 1:1 用户提供 · 全角符号)

result 是一个 JS object · 用 `JSON.stringify(MONETIZATION_MOCK, null, 0)` 渲染成单行字符串(或保留 pretty + spaces)· sally 看截图是 **wrapped raw text** · 显示成 narrative 长字符串(不分行不缩进 · 看截图就是普通段落)。

考虑可读性 · 用 `JSON.stringify(MONETIZATION_MOCK, null, 2)` 输出 pretty 字符串 · 然后 `whitespace-pre-wrap`  保留换行 · 视觉跟 sally 接近(单字符串 · 但可读)。

或者更简洁 · 用 narrative paragraph 形式 · `JSON.stringify(MONETIZATION_MOCK)` 输出单行 · `whitespace-pre-wrap break-all` · 浏览器自动 wrap。

**决策** · 用 `JSON.stringify(MONETIZATION_MOCK)` 单行 string 输出 · `whitespace-pre-wrap break-all`(sally 截图视觉就是 narrative wrapped text)

mock 数据 ·

```ts
export const MONETIZATION_MOCK = {
  ipAnalysis: {
    positioning: '专业、接地气的英语老师人设，聚焦职场英语提升',
    uniqueValue: '结合职场痛点，提供实用、高效的英语学习方案，而非传统应试教育',
    targetAudience: '25-40岁职场女性，追求职业发展、渴望提升英语沟通能力',
    contentPillars: [
      '职场英语口语技巧',
      '商务邮件与报告写作',
      '面试与会议英语实战',
      '英语学习方法论分享',
      '职场女性成长与英语结合',
    ],
  },
  monetizationPaths: [
    {
      path: '引流产品：免费/低价课程与资料包',
      description: '通过提供高价值的免费或低价内容，吸引潜在学员进入私域流量池',
      revenueModel: '免费引流，低价转化',
      estimatedRevenue: '0-1000元/月 (主要为引流)',
      difficulty: '低',
      timeToRevenue: '1-2周',
      steps: [
        '制作\'职场英语高频词汇包\' (0元)',
        '设计\'3天口语速成挑战营\' (9.9元)',
        '发布免费英语学习方法论直播课',
        '引导用户添加企业微信/社群',
      ],
    },
    {
      path: '信任产品：精品小课与社群服务',
      description: '提供针对特定痛点的中低价课程，建立信任，筛选高意向用户',
      revenueModel: '课程销售 + 社群服务费',
      estimatedRevenue: '5000-20000元/月',
      difficulty: '中',
      timeToRevenue: '1-2个月',
      steps: [
        '开发\'商务邮件写作精讲\' (99元)',
        '推出\'职场口语发音矫正营\' (199元)',
        '建立VIP学习社群，提供答疑服务 (299-499元)',
        '定期举办社群专属直播分享',
      ],
    },
    {
      path: '利润产品：系统性进阶课程',
      description: '提供全面、深入的英语能力提升课程，解决学员核心痛点，实现高客单价',
      revenueModel: '高价课程销售',
      estimatedRevenue: '30000-100000元/月',
      difficulty: '中高',
      timeToRevenue: '2-4个月',
      steps: [
        '设计\'职场精英英语全能提升计划\' (1980元)',
        '开发\'高阶商务谈判英语实战课\' (3980元)',
        '提供\'一对多小组口语私教课\' (4980-9800元)',
        '课程内容FABE包装：特点→优势→益处→证据',
      ],
    },
    {
      path: '后端产品：定制化服务与高阶社群',
      description: '为高净值学员提供个性化、深度服务，实现持续复购和高价值转化',
      revenueModel: '定制服务费 + 高阶社群年费',
      estimatedRevenue: '20000-50000元/月',
      difficulty: '高',
      timeToRevenue: '4-6个月',
      steps: [
        '提供\'企业内训定制方案\' (10000元+)',
        '推出\'一对一职场英语教练服务\' (15000元+)',
        '建立\'职场女性英语精英俱乐部\' (年费10000元+)',
        '邀请知名职场导师进行联名分享',
      ],
    },
  ],
  revenueStructure: {
    primary: {
      source: '系统性进阶课程销售',
      percentage: '60%',
      description: '通过高客单价的精品课程，贡献主要营收，解决用户核心痛点',
    },
    secondary: [
      { source: '精品小课与社群服务', percentage: '25%', description: '作为利润产品的前置，提供中低价位选择，培养用户付费习惯' },
      { source: '定制化服务与高阶社群', percentage: '10%', description: '服务高净值用户，提供个性化解决方案，提升品牌溢价' },
      { source: '引流产品转化', percentage: '5%', description: '低价产品带来的直接收入，主要目的是获取用户数据和建立连接' },
    ],
  },
  contentMatrix: {
    trafficContent: {
      ratio: '40%',
      types: ['免费英语学习干货短视频', '职场英语常见错误解析', '名人英语演讲片段分析', '英语学习工具推荐'],
      frequency: '每天2-3条',
    },
    trustContent: {
      ratio: '30%',
      types: ['学员成功案例分享', '课程试听片段/免费章节', '英语学习方法论深度直播', '行业专家访谈'],
      frequency: '每周3-4条',
    },
    conversionContent: {
      ratio: '30%',
      types: ['课程FABE价值拆解视频', '限时优惠/报名通道直播', '学员问答与痛点解答', '课程福利与服务介绍'],
      frequency: '每周2-3条 (集中在转化期)',
    },
  },
  phasesPlan: [
    {
      phase: 'IP启动与引流',
      duration: '1-2个月',
      goals: ['IP人设内容体系搭建', '积累1000+私域用户', '测试引流产品转化率'],
      actions: ['发布高频引流内容', '推出9.9元引流课程', '建立企业微信私域社群', '收集用户反馈'],
      kpi: ['私域用户增长率', '引流产品购买率', '内容互动率'],
    },
    {
      phase: '信任建立与小课转化',
      duration: '2-4个月',
      goals: ['推出2-3款信任产品', '提升私域用户活跃度', '实现信任产品月销5000+'],
      actions: ['发布信任内容，分享学员案例', '组织社群专属直播/答疑', '优化信任产品FABE包装', '进行小范围付费推广'],
      kpi: ['信任产品转化率', '私域用户留存率', '用户转介绍率'],
    },
    {
      phase: '利润增长与品牌升级',
      duration: '4-8个月',
      goals: ['推出1-2款利润产品', '实现利润产品月销30000+', '提升IP行业影响力'],
      actions: ['系统化课程开发与迭代', '举办线上大型分享会', '与相关品牌进行联名合作', '扩大付费流量投放'],
      kpi: ['利润产品销售额', 'IP全网曝光量', '品牌搜索指数'],
    },
    {
      phase: '后端服务与生态拓展',
      duration: '8个月+',
      goals: ['开发定制化服务', '建立高阶社群', '探索多元化变现模式'],
      actions: ['提供一对一/企业定制服务', '运营高阶付费社群', '孵化助教团队', '出版英语学习书籍/周边'],
      kpi: ['后端产品客单价', '用户生命周期价值', 'IP生态营收占比'],
    },
  ],
  riskWarnings: [
    '内容同质化风险：需持续创新，保持内容独特性和实用性',
    '用户信任度建立周期长：需耐心运营，提供真实价值',
    '市场竞争激烈：需明确差异化优势，打造不可替代的IP',
    '私域运营效率：社群管理、用户互动需投入大量精力',
  ],
  successCases: [
    { name: '李叫兽', industry: '营销/知识付费', model: '免费内容引流 + 付费课程/咨询', result: '通过深度内容建立专业人设，高价课程与咨询服务获得巨大成功' },
    { name: '秋叶大叔', industry: '职场技能/知识付费', model: '多平台内容输出 + 课程体系 + 社群运营', result: '从PPT教学切入，拓展至职场技能全方位，形成完整知识付费生态' },
    { name: '新东方在线 (部分老师IP)', industry: '教育培训', model: '名师IP打造 + 体系化课程 + 线上直播互动', result: '通过老师个人魅力和专业能力，吸引大量学生，形成忠实用户群体' },
  ],
} as const;
```

注 · sally 截图里所有标点全角(`，` `。` `：` `（）` `"` 全角)· `+` `/` 半角 OK

---

## §3 · constants 新建

`lib/constants/monetization.ts` ·

```ts
export const MONETIZATION_H1 = 'IP变现模型定制' as const;
export const MONETIZATION_SUBTITLE = '结合行业数据和全网成功案例，为您定制清晰的IP变现路径' as const;
export const MONETIZATION_FORM_TITLE = '基本信息' as const;
export const MONETIZATION_RESULT_TITLE = 'IP变现模型' as const;

export const MONETIZATION_LABEL_INDUSTRY = '选择行业' as const;
export const MONETIZATION_LABEL_PRODUCT = '产品/服务描述' as const;
export const MONETIZATION_LABEL_AUDIENCE = '目标受众（可选）' as const;
export const MONETIZATION_LABEL_POSITIONING = 'IP定位（可选）' as const;

export const MONETIZATION_DEFAULT_PRODUCT = '线上英语培训课程，面向职场白领' as const;
export const MONETIZATION_DEFAULT_AUDIENCE = '25-40岁职场女性' as const;
export const MONETIZATION_DEFAULT_POSITIONING = '专业、接地气的英语老师人设' as const;
export const MONETIZATION_DEFAULT_INDUSTRY_ID = 'self_media' as const;

export const MONETIZATION_CTA = '生成变现模型' as const;
export const MONETIZATION_FEEDBACK_PROMPT = '这个结果对你有帮助吗？' as const;

// 完整 JSON mock(§2.6)
export const MONETIZATION_MOCK = { /* ... 用户给的完整 object ... */ } as const;
```

---

## §4 · sub-component 新建

`apps/web/src/pages/tools/components/monetization/` ·

| 文件 | 用途 |
|---|---|
| `MonetizationHero.tsx` | h1 + subtitle |
| `MonetizationForm.tsx` | 左 form card · 4 字段 + CTA · 行业 dropdown 可复用 trending 的 Step1IndustryDropdown 或自写简易版 |
| `MonetizationResult.tsx` | 右 result card · h2 + JSON raw string + 底部反馈 row |

---

## §5 · page rewrite

`apps/web/src/pages/tools/Monetization.tsx`(220 → ~50 行) ·

```tsx
import { useState } from 'react';

import { MonetizationForm } from './components/monetization/MonetizationForm';
import { MonetizationHero } from './components/monetization/MonetizationHero';
import { MonetizationResult } from './components/monetization/MonetizationResult';
import { MONETIZATION_DEFAULT_INDUSTRY_ID, MONETIZATION_DEFAULT_PRODUCT, MONETIZATION_DEFAULT_AUDIENCE, MONETIZATION_DEFAULT_POSITIONING, MONETIZATION_MOCK } from '@/lib/constants/monetization';

export default function Monetization() {
  const [industryId, setIndustryId] = useState(MONETIZATION_DEFAULT_INDUSTRY_ID);
  const [product, setProduct] = useState(MONETIZATION_DEFAULT_PRODUCT);
  const [audience, setAudience] = useState(MONETIZATION_DEFAULT_AUDIENCE);
  const [positioning, setPositioning] = useState(MONETIZATION_DEFAULT_POSITIONING);

  return (
    <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
      <MonetizationHero />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonetizationForm
          industryId={industryId} product={product} audience={audience} positioning={positioning}
          onIndustryChange={setIndustryId} onProductChange={setProduct} onAudienceChange={setAudience} onPositioningChange={setPositioning}
          onGenerate={() => { /* no-op · default mock 已显示 */ }}
        />
        <MonetizationResult mock={MONETIZATION_MOCK} />
      </div>
    </main>
  );
}
```

删 · `trpc.monetization.generate` mutation · `isFallback` state · toast · MonetizationToolResult 结构化 type · 单 col layout

---

## §6 · 文件清单

| 文件 | 操作 |
|---|---|
| `apps/web/src/lib/constants/monetization.ts` | 新建 |
| `apps/web/src/pages/tools/components/monetization/MonetizationHero.tsx` | 新建 |
| `apps/web/src/pages/tools/components/monetization/MonetizationForm.tsx` | 新建 |
| `apps/web/src/pages/tools/components/monetization/MonetizationResult.tsx` | 新建 |
| `apps/web/src/pages/tools/Monetization.tsx` | rewrite 220 → ~50 行 |
| `apps/web/src/pages/tools/__tests__/Monetization.test.tsx` | 改 · 删 trpc mock · 字面锁断言 |

---

## §7 · 验收

D1 字面 grep · 必命中 ·
- `IP变现模型定制` 1 次(h1)
- `结合行业数据和全网成功案例，为您定制清晰的IP变现路径` 1 次
- `基本信息` 1 次
- `IP变现模型` 1 次(result h2)
- `选择行业` / `产品/服务描述` / `目标受众（可选）` / `IP定位（可选）` 各 1 次
- `线上英语培训课程，面向职场白领` 1 次(default textarea)
- `25-40岁职场女性` 1 次(default audience)
- `专业、接地气的英语老师人设` 1 次(default positioning)
- `自媒体运营` 1 次(default industry)
- `生成变现模型` 1 次(CTA)
- `这个结果对你有帮助吗？` 1 次
- result JSON 内 key 字面命中 · `职场英语口语技巧` / `引流产品：免费/低价课程与资料包` / `信任产品` / `利润产品` / `后端产品` / `职场英语高频词汇包` / `商务邮件写作精讲` / `职场精英英语全能提升计划` / `企业内训定制方案` / `李叫兽` / `秋叶大叔` / `新东方在线` / `IP启动与引流` / `信任建立与小课转化` / `利润增长与品牌升级` / `后端服务与生态拓展` 各 1 次
- 4 difficulty · `低` `中` `中高` `高` 各 ≥1 次

D2 · 2 col layout · 左 form 4 字段 · 右 result 大段 raw JSON text

D3 · form input 可改 · dropdown 可换 · CTA click no-op(mock-first · default 已显示)· 反馈 btn click no-op 或 toast

D4 · default state · 4 字段已 prefilled · result 已显示完整 mock

D6 · typecheck + 测试通过

---

## §8 · Sonnet 执行流程

1. Read SPEC.md + 现 Monetization.tsx + STEP1_INDUSTRIES_56
2. 写 `lib/constants/monetization.ts` · 完整 MONETIZATION_MOCK + 字面常量
3. 写 3 sub-component
4. rewrite Monetization.tsx
5. 改 __tests__/Monetization.test.tsx · 删 trpc.monetization.generate mock · 简化字面锁 + render 断言
6. 跑 `pnpm --filter @quanan/web typecheck` + Monetization 测试
7. 报告

---

## §9 · 红线

- ❌ hardcode 字面(走 constants)
- ❌ 半角中文标点(`，` `：` `（）` `。` `"` 全角 · `+` `/` 半角 OK)
- ❌ 保留 trpc.monetization.generate / isFallback / MonetizationToolResult 结构化
- ❌ 改 STEP1_INDUSTRIES_56
- ❌ 动 backend / `apps/api/`
- ❌ 装新 npm 包
- ❌ 改 router.tsx / Header.tsx 外层
- ❌ 缩减 MONETIZATION_MOCK 字面(用户提供完整 JSON · 一字不漏)

---

## §10 · 注意

- result JSON 字符串渲染 · 用 `<div className="whitespace-pre-wrap break-all font-cn text-sm text-muted-foreground leading-relaxed">{JSON.stringify(MONETIZATION_MOCK)}</div>`(单行 stringified · CSS 自动 wrap)· 视觉跟 sally 截图同(看起来像 narrative 长文本)
- 行业 dropdown 简单 toggle · 用 useState + onClick(不用 popover 复杂逻辑)· 选项列表展示 STEP1_INDUSTRIES_56 完整 56 · 或者简化为只 `📲 自媒体运营` 单选 disabled(sally 截图只显示 default · 暂时不需要全 56 可切换)
- 推荐简化 · 行业 dropdown 写成只显示 default text + ChevronDown · 点击 no-op 或 toast `即将上线`(避免复杂)
- 反馈 👍 👎 btn · 点击 toast.info(`感谢反馈`)即可 · 无后端
