# /step/8 "直播策划" 完全重写 SPEC

> **作者** · Opus 4.7(team plan · /step/8 是字段密度最高 page · ~290 字段 · 7 sub-component)
> **执行** · Sonnet 4.6 max
> **目标** · 1:1 字面复刻 aiipznt sally zhao /step/8 真实输出 · form 4 字段 + 3 套方案 + 7 stage + 6 共享 section + AI 优化 + footer
> **不动** · router.tsx · 旧 step8 常量 / 旧组件(留 @deprecated)

---

## 1 · 背景 + 工程约束

### 现状
- `apps/web/src/pages/step/Step8.tsx` (55 行旧版 · 必须完全重写)
- `apps/web/src/lib/constants/step8.ts` (188 行 · 部分复用 · 加新常量 · 旧 @deprecated)
- `apps/web/src/components/step8/Step8GeneratePlan.tsx / Step8OptimizeScript.tsx`(旧 child · 保留 · 不再 import)
- `apps/web/src/router.tsx:88` 已挂 · **不动**

### 视觉风格参考(必读)
- `apps/web/src/components/step4/Step4PhaseSection.tsx`(sub-card 模式)
- `apps/web/src/components/step4/Step4WarningSection.tsx`(红边)
- `apps/web/src/components/step3b/RoadmapSection.tsx`(timeline + accent color)
- `apps/web/src/components/step6/Step6StoryboardSection.tsx`(折叠 chevron · stage 列表)
- `apps/web/src/components/step4b/Step4bStageSection.tsx`(条件 sub-card)
- `apps/web/src/components/ui/sub-card.tsx`
- `apps/web/src/components/icons/aiipznt-icons.tsx`

**严格沿用** · text-xs / text-on-surface / text-muted-foreground / bg-primary/10
**绿边** · `border-emerald-500/30 bg-emerald-500/5` + `text-emerald-400`
**红边** · `border-rose-500/30 bg-rose-500/5` + `text-rose-400`
**橙/金边** · 默认 `border-primary/30 bg-primary/8` + `text-primary`

---

## 2 · 完整 schema

```typescript
export interface Step8Result {
  plans: Step8Plan[];                  // 3 套方案

  // 全部 plan 共享 ──────────────────────
  trafficStrategy: {
    preLive: string[];
    duringLive: string[];
    postLive: string[];
  };
  productDesign: {
    mainProduct: string;
    priceAnchor: string;
    bonus: string;                     // 赠品/福利设计
    scarcity: string;                  // 限时限量(红边)
  };
  interactionTemplates: Array<{
    scenario: string;                  // 引导点赞关注 / 引导评论互动 / ...
    script: string;
  }>;
  objectionHandling: Array<{
    objection: string;                 // 小白能学会吗?
    response: string;                  // 应对: ...
  }>;
  dataOptimization: Array<{
    metric: string;                    // 停留时长 / 互动率 / 转粉率
    target: string;                    // >2分钟 / >10% / >3%
    advice: string;
  }>;
}

export interface Step8Plan {
  index: 1 | 2 | 3;
  title: string;                       // AI赋能美业老板：降本增效智能体定制方案
  hookLine: string;                    // 美业老板必看：AI智能体，让你的店铺业绩翻倍...
  kpis: {
    targetAudience: string;
    duration: string;                  // 1小时
    targetOnline: string;              // 300
    targetRevenue: string;             // 1-2个定制智能体订单意向，或10个高意向咨询
  };
  flowStages: Array<{                  // 顶部 timeline · 7 stage
    index: number;
    name: string;
  }>;
  stageDetails: Step8StageDetail[];   // 7 stage 详情
}

export interface Step8StageDetail {
  index: number;
  name: string;                        // 预热阶段 / 开场阶段 / 痛点共鸣与案例引入 / ...
  duration: string;                    // 5min / 10min / 20min
  accent: 'normal' | 'green' | 'red' | 'orange';  // 开场绿 / 高潮逼单红 / 收尾橙
  scriptLabel: string;                 // 话术 / 开场话术 / 完整话术 / 逼单话术 / 结尾话术
  script: string;
  actions?: string[];                  // 执行动作(预热独有)
  hooks?: string[];                    // 留人钩子(开场独有 · 绿 chip)
  interaction?: string;
  conversion?: string;
  urgencyTags?: string[];              // 紧迫感策略(高潮逼单独有 · 红 chip)
  closeTechniques?: string[];          // 成交技巧(高潮逼单独有 · ✓ list)
  nextPreview?: string;                // 下场预告(收尾独有)
}

export interface Step8FormData {
  productInfo: string;
  targetAudience: string;
  platform: string;                    // 'douyin' default
  experience: 'newbie' | 'intermediate' | 'expert';  // 'newbie' default
}
```

---

## 3 · Form 默认值

```typescript
const DEFAULT_FORM: Step8FormData = {
  productInfo: '定制智能体定价：10000-100000（根据客户需求专业定制）\n针对opc创业者：自己做ip获取流量，9800线上智能体使用和19800线下高阶段培训\n技术升级项目落地培训29800，训练营',
  targetAudience: '需要定制智能体降本增效的老板和opc创业者',
  platform: 'douyin',
  experience: 'newbie',
};

// 直播经验 3 chip
const EXPERIENCE_OPTIONS = [
  { value: 'newbie', label: '新手', sub: '刚开始做直播' },
  { value: 'intermediate', label: '有经验', sub: '有一定直播经验' },
  { value: 'expert', label: '资深', sub: '直播经验丰富' },
] as const;
```

---

## 4 · 完整 mock data · 逐字提取

> ⚠️ Sonnet **必须逐字** · 全角中文标点严格保留 · '' "" 单双引号保留 · plan 2/3 跟 plan 1 完全一样数据(截图未暴露差异)

```typescript
function generateMockResult(): Step8Result {
  const samplePlan = (index: 1 | 2 | 3): Step8Plan => ({
    index,
    title: 'AI赋能美业老板：降本增效智能体定制方案',
    hookLine: '美业老板必看：AI智能体，让你的店铺业绩翻倍，告别内耗！',
    kpis: {
      targetAudience: '美业老板，寻求降本增效解决方案的企业主',
      duration: '1小时',
      targetOnline: '300',
      targetRevenue: '1-2个定制智能体订单意向，或10个高意向咨询',
    },
    flowStages: [
      { index: 1, name: '预热' },
      { index: 2, name: '开场' },
      { index: 3, name: '痛点共鸣与案例引入' },
      { index: 4, name: 'AI智能体功能解析（干货输出）' },
      { index: 5, name: '产品植入与价值塑造' },
      { index: 6, name: '高潮逼单' },
      { index: 7, name: '收尾' },
    ],
    stageDetails: [
      {
        index: 1,
        name: '预热阶段',
        duration: '5min',
        accent: 'normal',
        scriptLabel: '话术',
        script: "晚上好，你来了吗？我是AI智能体定制师，今天为你揭秘美业老板如何用AI降本增效。评论区扣个'想了解'，让我看到你。点点小红心，直播间不迷路。我们等30秒，马上开始。",
        actions: [
          '播放美业店铺AI应用场景短视频',
          '主播提前上线调试设备，背景板展示直播主题和福利预告',
          "引导观众点亮小红心、发评论'想了解'",
        ],
      },
      {
        index: 2,
        name: '开场阶段',
        duration: '5min',
        accent: 'green',
        scriptLabel: '开场话术',
        script: '你是不是每天被员工管理、客户流失、营销效果差这些问题困扰？你是不是觉得美业越来越难做，利润越来越薄？别急，我懂你。我曾是餐饮品牌创始人，也经历过经营困境。今天，我给你带来一个颠覆美业的解决方案：AI智能体定制。它能帮你自动管理、自动营销、自动拓客，让你从繁琐工作中解脱，把精力放在更重要的商业决策上。想知道怎么做吗？点赞加关注，别走开。',
        hooks: [
          'AI智能体如何让美业店铺业绩翻倍？',
          '告别内耗，AI帮你自动管理员工和客户',
          '直播间专属福利：免费AI诊断名额',
        ],
      },
      {
        index: 3,
        name: '痛点共鸣与案例引入',
        duration: '10min',
        accent: 'orange',
        scriptLabel: '完整话术',
        script: "你知道吗？很多美业老板，每天80%的时间都花在重复性工作上，比如预约排班、客户提醒、活动策划。这些工作效率低，还容易出错。我有个客户，一家连锁美甲店，以前每月光是客服沟通、预约确认就耗费大量人力。引入我们的AI智能体后，这些全自动化了。客户预约、改期、咨询，AI秒回。员工排班、考勤，AI自动生成。老板说，感觉请了十个不抱怨、不请假、24小时工作的'超级员工'。你是不是也想拥有这样的'员工'？评论区扣'想拥有'。",
        interaction: "引导观众评论'想拥有'，提问'你目前最大的管理痛点是什么？'",
        conversion: '引发对AI智能体的初步兴趣',
      },
      {
        index: 4,
        name: 'AI智能体功能解析（干货输出）',
        duration: '20min',
        accent: 'orange',
        scriptLabel: '完整话术',
        script: "那这个AI智能体到底能做什么？我给你拆解一下。它不是简单的机器人，是根据你的店铺特点、客户画像、服务流程，为你量身定制的'大脑'。第一，客户管理：AI自动识别客户需求，推荐服务，生日提醒，节日问候，甚至能根据消费记录智能推荐专属套餐。第二，员工管理：自动排班，绩效考核，培训答疑。第三，营销拓客：AI自动生成营销文案，分析客户数据，精准推送活动信息，甚至能模拟真人语音进行电话邀约。第四，数据分析：实时反馈店铺运营数据，帮你快速调整经营策略。这些功能，能帮你省下至少50%的人力成本，提升30%的客户满意度。你觉得哪个功能最吸引你？评论区告诉我。",
        interaction: "引导观众评论最感兴趣的功能，例如'客户管理'、'营销拓客'",
        conversion: '展现AI智能体的具体价值和能力',
      },
      {
        index: 5,
        name: '产品植入与价值塑造',
        duration: '10min',
        accent: 'orange',
        scriptLabel: '完整话术',
        script: "你可能会说，这么好的东西，一定很贵吧？我们提供的定制智能体服务，价格从1万到10万不等，具体根据你的需求和复杂程度来定。这不是一笔开销，是对你店铺未来发展的投资。你想想，每年省下的人力成本，提升的客户复购率，增加的新客户，这些收益远超你的投入。我们的AI智能体，能让你在竞争激烈的市场中脱颖而出。它能帮你解决美业经营的四大痛点：人力成本高、客户流失快、营销效果差、管理效率低。现在，我给你一个特别的机会。今天直播间，前3名咨询的，我免费为你提供一次店铺AI化诊断，帮你找出最适合你的AI解决方案。想抓住机会的，评论区扣'我要诊断'。",
        interaction: "引导观众评论'我要诊断'，并提醒私信客服",
        conversion: '引导咨询，初步筛选意向客户',
      },
      {
        index: 6,
        name: '高潮逼单',
        duration: '5min',
        accent: 'red',
        scriptLabel: '逼单话术',
        script: "时间不多了，免费诊断名额只剩最后1个！你还在犹豫什么？不行动，你的店铺可能还在原地踏步，甚至被同行超越。行动起来，你就能抢占先机，让AI成为你最强大的竞争力。现在立刻点击小黄车，或者私信我'AI定制'，抓住这最后的机会。记住，不满意，我们承诺提供解决方案，直到你满意为止。这是你改变美业经营困境的唯一机会，别错过！",
        urgencyTags: [
          '只剩最后1个免费诊断名额',
          '时间倒计时：最后3分钟',
          '不行动的代价是：继续被内耗困扰，被同行超越',
        ],
        closeTechniques: [
          '强调投资回报率，而非成本',
          '风险承诺：满意为止',
          "清晰的行动指令：点击小黄车/私信'AI定制'",
        ],
      },
      {
        index: 7,
        name: '收尾阶段',
        duration: '5min',
        accent: 'normal',
        scriptLabel: '结尾话术',
        script: "感谢你今天的陪伴。AI智能体，是美业的未来趋势，也是你弯道超车的机会。记住，今天你了解的，可能是你未来几年经营的关键。如果你有任何关于AI智能体定制的问题，欢迎私信我。下周二晚上8点，我还会继续分享'如何用AI打造个人IP，吸引精准客户'。关注我，不错过任何干货！",
        nextPreview: "下周二晚8点：如何用AI打造个人IP，吸引精准客户",
      },
    ],
  });

  return {
    plans: [samplePlan(1), samplePlan(2), samplePlan(3)],
    trafficStrategy: {
      preLive: [
        "提前3天发布直播预告短视频：剪辑美业AI应用场景，配文'美业老板必看！AI帮你省钱又赚钱，直播间揭秘！'，挂载直播预约链接。",
        "直播前1小时，发布一条倒计时短视频：'最后1小时！AI赋能美业，你准备好了吗？'",
        '在朋友圈分享直播预约链接和主题海报，引导私域流量预约。',
        '利用Dou+推广直播预告短视频，精准投放给美业老板、企业主标签用户。',
      ],
      duringLive: [
        '开播前30分钟，持续引导观众点赞、评论、分享，提升互动率，争取更多推流。',
        "每隔10-15分钟提醒观众点赞、关注，并引导评论互动，如'扣1'、'想了解'等。",
        "设置小福利，如'点赞超过1万，送出AI诊断名额'，刺激互动和停留时长。",
        '引导观众加入粉丝团，提升转粉率。',
      ],
      postLive: [
        '直播结束后，发布直播回顾短视频，剪辑精彩片段和核心干货，引导未观看用户私信咨询。',
        '私信回复所有直播间咨询用户，提供一对一服务。',
        '将直播回放剪辑成系列短视频，持续发布，扩大影响力。',
      ],
    },
    productDesign: {
      mainProduct: '定制智能体服务',
      priceAnchor: '10000-100000（根据需求定制）',
      bonus: '直播间前3名咨询者，免费提供店铺AI化诊断服务',
      scarcity: '免费诊断名额限时限量，仅限直播间前3名',
    },
    interactionTemplates: [
      { scenario: '引导点赞关注', script: '如果你觉得今天的分享有价值，点点小红心，关注我，下次直播不迷路。' },
      { scenario: '引导评论互动', script: "你是不是也有类似的问题？评论区扣个'1'让我知道。或者把你的想法打出来。" },
      { scenario: '引导私信咨询', script: "如果你想了解更具体的方案，私信我'AI定制'，我给你一对一解答。" },
      { scenario: '催促行动', script: '名额不多了，时间有限，抓住机会，点击小黄车。' },
    ],
    objectionHandling: [
      { objection: '小白能学会吗？', response: '完全可以！我就是从技术小白过来的。我们有专门针对零基础的课程体系，手把手教你。关键在于方法和实践，我能做到，你也能。' },
      { objection: '价格太贵了/没时间学', response: '这不是一笔开销，是对你未来收益的投资。你想想，每年省下的人力成本，提升的客户复购率，增加的新客户，这些收益远超你的投入。时间就像海绵里的水，挤一挤总会有的。与其把时间花在重复性工作上，不如投资自己，用AI提升效率。' },
      { objection: '能赚回来吗？', response: '我给你算笔账。一个AI智能体，帮你省下的人力成本，提升的效率和业绩，远超你的投入。它是一次性投入，长期收益。我有个客户，美业老板，定制AI客服后，每月省下1个客服的工资，一年就是几万块。你觉得这笔投资划算吗？' },
      { objection: '担心效果不好/不满意', response: '我们承诺提供解决方案，直到你满意为止。我们的交付案例都帮助客户解决了提效问题，把客户从复杂重复的工作里抽身出来。我们有信心让你看到效果。' },
    ],
    dataOptimization: [
      { metric: '停留时长', target: '>2分钟', advice: '多讲故事，多提问互动，设置悬念，每隔5-10分钟抛出新福利或干货点，确保内容节奏紧凑，吸引观众持续观看。' },
      { metric: '互动率（评论、点赞、分享）', target: '>10%', advice: "开播前30分钟是核心，频繁引导观众点赞、评论'1'、'想了解'等，设置有奖问答或抽奖，刺激观众参与。主播要积极回应评论。" },
      { metric: '转粉率', target: '>3%', advice: '在直播中多次提醒观众关注，说明关注后的好处（不错过干货、福利等），引导加入粉丝团。主播个人IP的价值感和专业度是关键。' },
    ],
  };
}
```

---

## 5 · sub-component 规格

### 5.1 Step8PlanTabs.tsx(3 套方案 tabs)

文件 · `apps/web/src/components/step8/Step8PlanTabs.tsx`
Props · `{ plans: Step8Plan[]; activeIndex: number; onChange: (i: number) => void; }`

Layout · `<div className="flex gap-3">` · 每 tab `<button>` ·
- active · `bg-primary/15 border-primary/40 text-primary` · font-semibold
- inactive · `border-border/40 text-muted-foreground hover:text-on-surface`
- 标签 · 方案1 / 方案2 / 方案3(用 `方案${plan.index}` · 注意"方案 1" 中间有空格还是没空格 · 截图看是有空格但很小 · 用 `方案 ${index}` 含空格)

### 5.2 Step8PlanHeader.tsx(plan 头部)

文件 · `apps/web/src/components/step8/Step8PlanHeader.tsx`
Props · `{ plan: Step8Plan; className?: string; }`

Layout(整段一个 SubCard):
1. row · 左 `<h3 text-base font-semibold>🎙 {plan.title}</h3>` + 右 chip(`bg-primary/15 border-primary/30 text-primary rounded px-3 py-1`)`{plan.hookLine}`
2. 4 KPI grid grid-cols-2 md:grid-cols-4 gap-4:
   - 每 KPI · `<div className="space-y-1">`:
     - row · icon + `<p text-xs text-muted-foreground>{label}</p>`
     - `<p text-sm text-on-surface font-semibold>{value}</p>`
   - 4 KPI 标签 · `👥 目标观众` / `🕐 建议时长` / `◎ 目标在线` / `$ 目标营收`

### 5.3 Step8FlowDesignSection.tsx(7 stage 横向 timeline)

文件 · `apps/web/src/components/step8/Step8FlowDesignSection.tsx`
Props · `{ stages: Step8Plan['flowStages']; className?: string; }`

Layout:
1. H3 row · 左 `⚡ 直播流程设计` + 右 chip "完整流程"
2. `<div className="flex items-center gap-2 flex-wrap">`:
   - stages.map(stage, i) · 
     - chip · `<span className="text-xs bg-primary/10 border-primary/30 rounded px-3 py-1 text-on-surface flex items-center gap-1.5">
                  <span text-primary>{stage.index}</span>{stage.name}
                </span>`
     - 后面 if not last · `→` arrow(text-primary/60)

### 5.4 Step8StageDetailSection.tsx(单个 stage · 7 次复用)

文件 · `apps/web/src/components/step8/Step8StageDetailSection.tsx`
Props · `{ detail: Step8StageDetail; className?: string; }`

Layout(整段一个 SubCard · accent 决定边框颜色):
- accent='green' → `border-emerald-500/30 bg-emerald-500/5` + 标题用 `text-emerald-400`
- accent='red' → `border-rose-500/30 bg-rose-500/5` + 标题 `text-rose-400`
- accent='orange' → `border-primary/30 bg-primary/5` + 标题 `text-primary`
- accent='normal' → 默认 SubCard

1. H3 row · 左 icon + `<h3>{name}</h3>` + 右 chip `<span>{duration}</span>`
   - icon 选择 · 1 预热: 🕐 · 2 开场: ▷ · 3-5: 🔊 · 6 高潮逼单: ⚡ · 7 收尾: 🛡
2. SubCard 内部 sub-section(space-y-4):
   - 话术 SubCard · sub-label "{scriptLabel}" + script 段
   - (if actions) sub-label "执行动作" + ul(`·` 前缀 + text)
   - (if hooks) sub-label "留人钩子" + chip flex-wrap(`bg-emerald-500/10 border-emerald-500/30 text-emerald-400 rounded px-3 py-1.5 text-xs`)
   - (if interaction or conversion) 2 列 grid:
     - sub-label "互动设计" + interaction 段
     - sub-label "转化节点" + conversion 段
   - (if urgencyTags) sub-label "紧迫感策略" + chip flex-wrap(`bg-rose-500/10 border-rose-500/30 text-rose-400 rounded px-3 py-1.5 text-xs`)
   - (if closeTechniques) sub-label "成交技巧" + ul(`✓` text-rose-400/70 前缀 + text-rose-300)
   - (if nextPreview) sub-card "下场预告" + nextPreview text

### 5.5 Step8TrafficStrategySection.tsx(引流策略 3 列)

文件 · `apps/web/src/components/step8/Step8TrafficStrategySection.tsx`
Props · `{ strategy?: Step8Result['trafficStrategy']; className?: string; }`

Layout:
1. H3 row · 左 `📢 引流策略` + 右 chip "三阶段"
2. grid-cols-1 md:grid-cols-3 gap-4:
   - 列 1 · SubCard 橙边 · 顶 `📢 直播前`(text-primary font-semibold) + ol number list(preLive)
   - 列 2 · SubCard 红边 · 顶 `🔴 直播中`(text-rose-400 font-semibold · 红圆点) + ol(duringLive)
   - 列 3 · SubCard 绿边 · 顶 `📊 直播后`(text-emerald-400 font-semibold) + ol(postLive)
3. ol 渲染 · `<div>` 内每条 grid-cols-[24px_1fr]:
   - 左 chip 数字 `<span className="text-xs text-on-surface bg-primary/15 border-primary/30 rounded-full w-6 h-6 flex items-center justify-center">{i+1}</span>`
   - 右 text-xs text-muted-foreground leading-relaxed

### 5.6 Step8ProductDesignSection.tsx(产品成交设计)

文件 · `apps/web/src/components/step8/Step8ProductDesignSection.tsx`
Props · `{ design?: Step8Result['productDesign']; onCopy?: () => void; className?: string; }`

Layout:
1. H3 row · 左 `$ 产品与成交设计` + 右 chip "转化核心"
2. grid-cols-1 md:grid-cols-2 gap-4:
   - SubCard 1 · sub-label "主推产品/服务" + mainProduct(text-sm font-semibold)
   - SubCard 2 · sub-label "价格锚点设计" + priceAnchor
3. grid-cols-1 md:grid-cols-2 gap-4:
   - SubCard 3 · sub-label "🎁 赠品/福利设计" + bonus
   - SubCard 4 · 红边(border-rose-500/30 bg-rose-500/5) · sub-label `<span text-rose-400>⚠️ 限时限量策略</span>` + scarcity(text-rose-300)
4. row(justify-end) · `<Button variant="outline" size="sm" onClick={onCopy}>📋 复制此方案</Button>`

### 5.7 Step8GeneralTipsSection.tsx(通用直播技巧 · 3 sub)

文件 · `apps/web/src/components/step8/Step8GeneralTipsSection.tsx`
Props · `{ interactionTemplates / objectionHandling / dataOptimization; className?: string; }`

Layout(space-y-6):
1. H3 row · 左 `💡 通用直播技巧`

2. SubCard "💬 互动话术模板" · sub-label + 右上 chip "{count}个场景"
   - templates.map · 每条 SubCard:
     - `<p text-sm font-semibold>{scenario}</p>`
     - `<p text-xs text-muted-foreground leading-relaxed>{script}</p>`

3. SubCard "🛡 异议处理话术" · 红边 · sub-label + 右上 chip "{count}种异议"
   - handling.map · 每条 SubCard:
     - `<p text-sm font-semibold text-rose-400>⚠️ 异议：{objection}</p>`
     - `<p text-xs leading-relaxed><span text-emerald-400 font-semibold>应对：</span><span text-muted-foreground>{response}</span></p>`

4. SubCard "📊 数据优化建议" · 绿边 · sub-label + 右上 chip "关键指标"
   - 2 列 grid · optimization.map · 每条 SubCard:
     - row · `<p text-sm font-semibold>{metric}</p>` + 右 `<span text-emerald-400 font-semibold>{target}</span>`
     - `<p text-xs text-muted-foreground leading-relaxed>{advice}</p>`

### 5.8 Step8AiOptimizeSection.tsx(AI 优化话术)

文件 · `apps/web/src/components/step8/Step8AiOptimizeSection.tsx`
Props · `{ className?: string; }`(局部 state · 不传 props)

Layout(SubCard):
1. H3 row · `🔄 AI优化直播话术`
2. textarea · placeholder "粘贴你的直播话术脚本（至少10个字），AI将深度优化话术表达、互动设计和转化逻辑..."
3. input · placeholder "优化目标（可选），如：提升互动率、增强转化、更有感染力..."
4. 主 button center · `🔄 AI优化话术`

---

## 6 · Step8.tsx 重写

文件 · `apps/web/src/pages/step/Step8.tsx`(完全替换 55 行)

### 6.1 import

```typescript
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Step8PlanTabs } from '@/components/step8/Step8PlanTabs';
import { Step8PlanHeader } from '@/components/step8/Step8PlanHeader';
import { Step8FlowDesignSection } from '@/components/step8/Step8FlowDesignSection';
import { Step8StageDetailSection } from '@/components/step8/Step8StageDetailSection';
import { Step8TrafficStrategySection } from '@/components/step8/Step8TrafficStrategySection';
import { Step8ProductDesignSection } from '@/components/step8/Step8ProductDesignSection';
import { Step8GeneralTipsSection } from '@/components/step8/Step8GeneralTipsSection';
import { Step8AiOptimizeSection } from '@/components/step8/Step8AiOptimizeSection';
import { Step3LoadingState } from '@/components/step3/Step3LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
```

### 6.2 函数体

```typescript
export default function Step8() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step8');

  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  const [productInfo, setProductInfo] = useState(DEFAULT_FORM.productInfo);
  const [targetAudience, setTargetAudience] = useState(DEFAULT_FORM.targetAudience);
  const [platform, setPlatform] = useState(DEFAULT_FORM.platform);
  const [experience, setExperience] = useState<Step8FormData['experience']>(DEFAULT_FORM.experience);
  const [activePlan, setActivePlan] = useState(1);

  const prevIsSavingRef = useRef(false);
  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step8FormData>(accountId, 'step8');
    if (saved?.productInfo) {
      setProductInfo(saved.productInfo);
      if (saved.targetAudience) setTargetAudience(saved.targetAudience);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.experience) setExperience(saved.experience);
    }
  }, [accountId]);

  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) void dbQuery.refetch();
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  const isLoading = isLocalGenerating || isSaving;
  const generated: Step8Result = generateMockResult();
  const canBulkActions = !isLoading;
  const currentPlan = generated.plans.find((p) => p.index === activePlan) ?? generated.plans[0];

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    setIsLocalGenerating(true);
    save({ productInfo, targetAudience, platform, experience });
    setTimeout(() => { setIsLocalGenerating(false); toast.success('生成完成'); }, 1200);
  }
  function handleRegenerateAll() { if (!isLoading) { setIsLocalGenerating(true); setTimeout(() => { setIsLocalGenerating(false); toast.success('已重新生成'); }, 1200); }}
  function handleCopyAll() { navigator.clipboard.writeText(JSON.stringify(generated, null, 2)).then(() => toast.success('已复制全部')); }
  function handleOptimize() { if (canBulkActions) toast.success('已智能优化'); }
  function handleCopyPlan() { navigator.clipboard.writeText(JSON.stringify(currentPlan, null, 2)).then(() => toast.success(`已复制方案 ${activePlan}`)); }
  function handleViewIpPlan() { toast.info('IP 方案查看功能开发中'); }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <p className="text-xs font-semibold text-primary tracking-wide">STEP 08 › 直播策划</p>
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">🎙 直播策划</h1>
        <p className="text-sm text-muted-foreground">
          当前行业：{industry}。AI将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持AI优化直播脚本。
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-card/30 border border-border/40 rounded-lg p-6">
        <p className="text-sm font-semibold text-on-surface flex items-center gap-2">🎙 生成直播方案</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              产品/服务信息 <span className="text-xs text-muted-foreground font-normal">（可选）</span>
            </label>
            <textarea value={productInfo} onChange={(e) => setProductInfo(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              目标受众 <span className="text-xs text-muted-foreground font-normal">（可选）</span>
            </label>
            <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
          </div>
        </div>

        {/* 平台 5 chip */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">直播平台</label>
          <div className="flex gap-2 flex-wrap">
            {[{id:'douyin',label:'抖音'},{id:'xiaohongshu',label:'小红书'},{id:'shipinhao',label:'视频号'},{id:'kuaishou',label:'快手'},{id:'bilibili',label:'B站'}].map((p) => (
              <button key={p.id} type="button" onClick={() => setPlatform(p.id)}
                className={'px-4 py-1.5 rounded border text-sm ' + (platform === p.id
                  ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                  : 'border-border/40 text-muted-foreground')}>{p.label}</button>
            ))}
          </div>
        </div>

        {/* 经验 3 chip */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">直播经验</label>
          <div className="flex gap-2 flex-wrap">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setExperience(opt.value)}
                className={'px-4 py-1.5 rounded border text-sm ' + (experience === opt.value
                  ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                  : 'border-border/40 text-muted-foreground')}>
                {opt.label} <span className="text-xs opacity-70">· {opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90">
          ✨ 生成直播方案
        </Button>
      </form>

      {isLoading && <Step3LoadingState />}

      {/* Output area · H2 + toolbar(重新生成在前) */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
          🎙 直播方案（共3套）
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleRegenerateAll}>⟳ 重新生成</Button>
          <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleOptimize}>✨ 智能优化</Button>
          <Button variant="outline" size="icon" disabled={!canBulkActions} onClick={handleCopyAll} aria-label="复制全部">📋</Button>
        </div>
      </div>

      {/* 3 套方案 tabs */}
      <Step8PlanTabs plans={generated.plans} activeIndex={activePlan} onChange={setActivePlan} />

      {/* current plan header */}
      <Step8PlanHeader plan={currentPlan} />

      {/* 7 stage timeline */}
      <Step8FlowDesignSection stages={currentPlan.flowStages} />

      {/* 7 stage details */}
      {currentPlan.stageDetails.map((d) => (
        <Step8StageDetailSection key={d.index} detail={d} />
      ))}

      {/* shared sections */}
      <Step8TrafficStrategySection strategy={generated.trafficStrategy} />
      <Step8ProductDesignSection design={generated.productDesign} onCopy={handleCopyPlan} />
      <Step8GeneralTipsSection
        interactionTemplates={generated.interactionTemplates}
        objectionHandling={generated.objectionHandling}
        dataOptimization={generated.dataOptimization}
      />
      <Step8AiOptimizeSection />

      {/* footer · 完成 chip */}
      <div className="bg-primary/8 border border-primary/30 rounded-lg p-5 space-y-3">
        <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
          <span className="text-primary">✓</span> 直播策划 已完成 🎉
        </p>
        <p className="text-xs text-muted-foreground">恭喜你完成了全部流程！现在可以查看完整的IP方案汇总。</p>
        <Button variant="default" size="sm" onClick={handleViewIpPlan} className="bg-primary hover:bg-primary/90">
          查看我的IP方案 ›
        </Button>
      </div>
    </main>
  );
}
```

---

## 7 · step8.ts 常量补充

末尾追加(旧 @deprecated 保留):

```typescript
// ─── PRD-29.12 · 真实字面 ──────────────────────────────────
export const STEP8_BREADCRUMB_REAL = 'STEP 08 › 直播策划' as const;
export const STEP8_H1_REAL = '直播策划' as const;
export const STEP8_OUTPUT_H2_REAL = '直播方案（共3套）' as const;
export const STEP8_SUBTITLE_REAL = '当前行业：{industry}。AI将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持AI优化直播脚本。' as const;
export const STEP8_FORM_TITLE = '生成直播方案' as const;
export const STEP8_CTA_GENERATE_REAL = '生成直播方案' as const;
export const STEP8_CTA_BULK_REGENERATE = '重新生成' as const;
export const STEP8_CTA_BULK_OPTIMIZE = '智能优化' as const;
export const STEP8_CTA_BULK_COPY = '复制全部' as const;
export const STEP8_CTA_COPY_PLAN = '复制此方案' as const;
export const STEP8_CTA_AI_OPTIMIZE = 'AI优化话术' as const;
export const STEP8_AI_OPTIMIZE_PLACEHOLDER = '粘贴你的直播话术脚本（至少10个字），AI将深度优化话术表达、互动设计和转化逻辑...' as const;
export const STEP8_AI_OPTIMIZE_GOAL_PLACEHOLDER = '优化目标（可选），如：提升互动率、增强转化、更有感染力...' as const;
export const STEP8_FOOTER_COMPLETION_TITLE = '直播策划 已完成 🎉' as const;
export const STEP8_FOOTER_COMPLETION_DESC = '恭喜你完成了全部流程！现在可以查看完整的IP方案汇总。' as const;
export const STEP8_FOOTER_BUTTON_VIEW_IP = '查看我的IP方案 ›' as const;
```

---

## 8 · 文件输出 list

| # | path | 操作 | 行数估 |
|:-:|---|:-:|:-:|
| 1 | `apps/web/src/lib/constants/step8.ts` | Edit(末尾追加 ~25 行) | +25 |
| 2 | `apps/web/src/components/step8/Step8PlanTabs.tsx` | new | ~45 |
| 3 | `apps/web/src/components/step8/Step8PlanHeader.tsx` | new | ~75 |
| 4 | `apps/web/src/components/step8/Step8FlowDesignSection.tsx` | new | ~55 |
| 5 | `apps/web/src/components/step8/Step8StageDetailSection.tsx` | new | ~170 |
| 6 | `apps/web/src/components/step8/Step8TrafficStrategySection.tsx` | new | ~85 |
| 7 | `apps/web/src/components/step8/Step8ProductDesignSection.tsx` | new | ~75 |
| 8 | `apps/web/src/components/step8/Step8GeneralTipsSection.tsx` | new | ~110 |
| 9 | `apps/web/src/components/step8/Step8AiOptimizeSection.tsx` | new | ~50 |
| 10 | `apps/web/src/pages/step/Step8.tsx` | rewrite(替换 55 行 · 含 mock ~700 行) | ~900 |

不动 · router.tsx · 旧 step8 常量 · 旧 Step8GeneratePlan.tsx / Step8OptimizeScript.tsx

---

## 9 · 验收

1. typecheck 0 error
2. http://localhost:5173/step/8 可访问
3. innerText 100+ key grep
4. 3 套方案 tab 切换 work

---

## 10 · Sonnet 工作流程

1. **必读**:
   - Read SPEC.md 全文(~50KB)
   - Read step4 Phase + Warning + step3b Roadmap + step6 Storyboard + step4b Stage + sub-card

2. Edit step8.ts 末尾追加
3. Write 8 sub-component
4. Write Step8.tsx 完全重写
5. typecheck PASS
6. 报告

---

## 11 · 红线

- ❌ 不动 router.tsx
- ❌ 不删旧 step8 常量(留 @deprecated)
- ❌ 不允许概括 / 缩短 / 改写 §3 form 或 §4 mock 任何字符
- ❌ toolbar 顺序 · 重新生成 / 智能优化 / 复制(注意"重新生成"在第 1 个)
- ❌ emoji 保留 · 🎙 ▷ 🔊 ⚡ 🛡 🕐 📢 🔴 📊 $ 🎁 ⚠️ 💡 💬 🔄 👥 ◎ ✓ 🎉 ⟳ ✨ 📋 ›
- ❌ plan 2/3 跟 plan 1 完全一样数据(不要写"待生成"占位)
- ❌ ✅ **不允许 uppercase class**(吸取 step3b/step6 教训 · 含字母 chip / breadcrumb / sub-label 都不用 uppercase)
- ❌ 不启 dev server / 不截图

---

## 12 · 报告

```
DONE / BLOCKED
写了 X 个文件: ...
typecheck: PASS / FAIL
异常: ...
下一步建议 Opus 做的事: ...
```
