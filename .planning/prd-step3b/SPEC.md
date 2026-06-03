# /step/3b "人设定制方案" 完全重写 SPEC

> **作者** · Opus 4.7(team plan)
> **执行** · Sonnet 4.6 max(按本 SPEC 写代码)
> **目标** · 1:1 字面复刻 aiipznt sally zhao 真实输出 · 5 H3 / 28 sub-section / ~80 字段
> **不动** · router.tsx (已挂 /step/3b) · 旧 STEP3B_OUTPUT_H3_6 常量(留 @deprecated)

---

## 1 · 背景 + 工程约束

### 现状
- `apps/web/src/pages/step/Step3b.tsx`(327 行 PRD-20 历史版 · 6 H3 ID 全错 · 必须完全重写)
- `apps/web/src/components/step3b/Step3bOutputContent.tsx`(旧 child · 保留不删 · 重写后的 Step3b.tsx 不再 import 它)
- `apps/web/src/lib/constants/step3b.ts`(82 行 · 部分复用 · 加新 H3 常量 · 旧 OUTPUT_H3_6 留 @deprecated)
- `apps/web/src/router.tsx:82` 已挂 `{ path: '3b', element: <Step3b /> }` · **不动 router**

### 视觉风格参考(必读)
Sonnet 写 sub-component 前 · 必读 ·
- `apps/web/src/components/step3/AvatarDesignSection.tsx`(SubCard + 8 sub-section + 必含元素 + 禁忌 + AI Prompt 风格)
- `apps/web/src/components/step3/OverallStrategySection.tsx`(SubCard + sub-section 标 + 时长策略 stage chip + 平台优势 grid)
- `apps/web/src/components/step3/NicknameRecommendSection.tsx`(命名策略 ✓/✗ list + chips + 附注 风格)
- `apps/web/src/components/step3/IntroCopyPlatformCard.tsx`(line highlight chip 黄边风格)
- `apps/web/src/components/ui/sub-card.tsx`(SubCard 组件)
- `apps/web/src/components/icons/aiipznt-icons.tsx`(FlameIcon / SparkleIcon)

**严格沿用** · text-xs / text-on-surface / text-muted-foreground / bg-primary/10 等 token · 不引入新颜色。

---

## 2 · 完整 schema(TypeScript interface)

```typescript
export interface Step3bResult {
  // ── H3-1 核心身份定位 ────────────────────────────────────────
  coreIdentity: {
    identityTag: string;              // 人设标签(大字 chip · 1-2 行)
    quote: string;                    // 个人口号/金句(italic + 双引号包围)
    differentiation: string;          // 差异化定位(段落)
    memoryPoints: Array<{             // 记忆点设计(3 卡)
      title: string;
      desc: string;
      practice: string;               // 落地方式
    }>;
    traits: Array<{                   // 性格特质(3 大 chip)
      name: string;                   // 实战派 / 韧性强 / 真诚
      desc: string;                   // 括号描述
    }>;
  };

  // ── H3-2 思想体系 ────────────────────────────────────────────
  thoughtSystem: {
    coreBeliefs: Array<{              // 核心理念(3 段)
      belief: string;
      reason: string;
      angle: string;                  // 内容角度
    }>;
    viewpoints: Array<{               // 独特观点(2 黄边 block)
      title: string;
      desc: string;
      exampleTitle: string;           // 示例标题
    }>;
    mottos: Array<{                   // 口头禅设计(3 段)
      motto: string;                  // "用AI, 做个聪明的老板"
      whenToUse: string;
      effect: string;
    }>;
  };

  // ── H3-3 内容人设 ────────────────────────────────────────────
  contentPersona: {
    speakingStyle: string;            // 说话风格段
    speakingDos: string[];            // ✓ list
    speakingDonts: string[];          // ✗ list
    examplePitch: string;             // 示例口播(大黄边 block · italic)
    visualStyle: {
      style: string;                  // 风格(子 label)
      outfit: string;                 // 穿搭
      scene: string;                  // 场景
      props: string[];                // 道具(4 chip)
    };
    contentPillars: Array<{           // 内容支柱(4 块)
      title: string;
      percentage: string;             // "40%"
      frequency: string;              // "每周2-3次"
      desc: string;
      cases: string[];                // 3 子案例 chip
    }>;
  };

  // ── H3-4 信任构建体系 ────────────────────────────────────────
  trustSystem: {
    backings: Array<{                 // 信任背书(3 条)
      claim: string;
      display: string;                // 展示方式
    }>;
    socialProofs: Array<{             // 社会证明(2 条)
      proof: string;
      method: string;                 // 获取方式
    }>;
    storyLine: {                      // 个人故事线(黄边大 block)
      mainStory: string;              // 主段长文
      turningPoint: string;           // 转折点段
      narrationMethod: string;        // 讲述方式段
    };
  };

  // ── H3-5 人设打造路线图 ──────────────────────────────────────
  roadmap: Array<{                    // 3 阶段 timeline box
    period: string;                   // "0-1个月" / "1-3个月" / "3-6个月"
    accent: 'green' | 'yellow' | 'purple';
    goal: string;                     // 阶段目标
    steps: string[];                  // → step list
  }>;
}

export interface Step3bFormData {
  personalInfo: string;
  personalAdvantage: string;          // 个人优势/特长
  personalStory: string;              // 个人故事/经历
  platform: string;                   // 'douyin' default
  audience: string;
}
```

---

## 3 · Form 默认值(useState initial · 1:1 sally 真实输入)

```typescript
const DEFAULT_FORM: Step3bFormData = {
  personalInfo: '我是一名opc创业者，擅长与人沟通和项目交付。专业技能是给企业或者个人定制全自动工作流或者智能体，在这么行业从业半年。我以前是餐饮从业者，从事餐饮行业12年，作为品牌创始人之一的我，高峰时期拥有13家店铺（外卖店+实体店），因为品类周期原因，已经没有利润和持续的意义，加上因为认知问题投资的代加工厂失败，背上近百万的负债。后来果断一家一家店铺关掉，来到ai赛道做一家opc个人创业公司。我也是一名持续创业者，这是十几年期间有成功的项目也有失败血亏的项目，但是我从来不缺从头再来的勇气，目前公司已经交付一些简单的工作流和智能体平台，这些交付的案例都帮助客户解决了提效的问题，把客户从复杂重复的工作里抽身出来把精力放在更重要的商业决策上来。收费有4位数到6位数都有。我以前是技术小白，通过我不断的学习和自我迭代，到我现在可以交付项目。我自己的商业闭环走通这个环节也走了一些弯路，我把这些学习经验和沟通经验做成一系列的课程，想要帮助一些opc创业者避坑。',
  personalAdvantage: '我是一名持续创业者，这些年一直尝试餐饮的不同项目，有成功的类目也有失败的类目，总体来说有一些经验在身上的',
  personalStory: '2023年，第一次尝试用ai工具制作图片，非常感叹ai工具的厉害，中间也去各种科技展参观考察，思考并判断。这期间慢慢开始关闭自己的实体店。去年自己手工搓出来自己的第一条工作流，又一次感觉普通人也可以利用ai做自己喜欢做的事情，去年年底彻底关闭最后一家实体店铺全身心投入ai，今年龙虾机器人火之前，我就养出来多只龙虾协作办公了，现在给企业和个人定制智能体工作流，月入过万，刚接了个粉丝百万博主的商单，正在最后调优阶段',
  platform: 'douyin',
  audience: '需要定制智能体降本增效的老板和opc创业者',
};
```

---

## 4 · 完整 mock data · 1:1 逐字提取(generateMockResult)

```typescript
function generateMockResult(): Step3bResult {
  return {
    coreIdentity: {
      identityTag: 'AI转型实战家：从餐饮老板到智能体定制专家，助你降本增效',
      quote: '"AI不是未来，是你的现在。用AI解放重复，让决策更值钱。从百万负债到AI落地，我帮你避坑。"',
      differentiation: '你不仅懂技术，更懂商业和创业。与纯技术出身的AI专家不同，你拥有12年餐饮创业的实战经验，经历过从0到1、从成功到失败的完整周期。这让你在定制AI方案时，能从老板视角出发，真正理解降本增效的痛点，而不是仅仅停留在技术层面。同时，你从技术小白逆袭的经历，让你能更好地理解并指导OPC创业者避坑，提供更接地气的实战经验。',
      memoryPoints: [
        {
          title: '餐饮老板转行AI',
          desc: '这个反差巨大的背景，能迅速抓住注意力。从传统行业到前沿AI，展现了你的敏锐和学习能力，也暗示了你对商业本质的深刻理解。',
          practice: '在自我介绍、故事分享、直播开场时，强调"我曾是开了13家餐饮店的老板，现在用AI帮你做生意"；制作对比视频，如"餐饮老板的AI转型日记"。',
        },
        {
          title: '百万负债逆袭',
          desc: '真实且充满戏剧性的经历，能引发共鸣和好奇。它不仅展现了你的韧性，也为你的商业判断和避坑经验增加了说服力。',
          practice: '在分享创业故事、讲解商业模式时，自然提及这段经历，如"我曾为认知买单，背上百万负债，所以更懂创业者的痛"；制作短视频系列"我的百万负债逆袭路"。',
        },
        {
          title: '技术小白到交付专家',
          desc: '强调了普通人通过学习也能掌握AI的能力，降低了AI的门槛，让目标受众（尤其是OPC创业者）觉得AI不再遥不可及，你就是他们的榜样。',
          practice: '制作"小白学AI"系列内容，分享学习路径、工具推荐、踩坑经验；用"我以前连代码都不懂，现在能给大客户定制智能体"来强化人设。',
        },
      ],
      traits: [
        { name: '实战派', desc: '所有分享都基于真实案例和结果，拒绝空谈' },
        { name: '韧性强', desc: '面对困难和失败，展现出不屈不挠的创业精神' },
        { name: '真诚', desc: '不回避过去的失败，坦诚分享经验教训，像朋友一样交流' },
      ],
    },

    thoughtSystem: {
      coreBeliefs: [
        {
          belief: 'AI是普通人弯道超车的最佳机会。',
          reason: '你曾是技术小白，却通过AI实现了逆袭。这证明AI的门槛并非不可逾越，普通人也能通过学习和应用，创造巨大的价值。',
          angle: '分享AI工具学习路径、成功案例、个人转型故事；拆解AI如何赋能个体创业者。',
        },
        {
          belief: '商业的本质是解决问题，AI是高效的解决方案。',
          reason: '你的餐饮经历让你深知商业竞争的残酷和效率的重要性。AI不是炫技，而是实实在在解决企业痛点，提升效率，创造利润的工具。',
          angle: '分析不同行业痛点，提出AI解决方案；案例拆解AI如何帮助客户降本增效；对比传统模式与AI模式的效率差异。',
        },
        {
          belief: '认知升级是创业者最宝贵的投资。',
          reason: '你曾因认知问题导致代加工厂失败并背负百万负债。这段经历让你深刻认识到，持续学习和迭代认知是避免踩坑、实现突破的关键。',
          angle: '分享认知升级的路径和方法；解读行业趋势，帮助创业者预判风险；拆解商业模式，提升商业洞察力。',
        },
      ],
      viewpoints: [
        {
          title: '所有人都说AI要学编程，但我认为普通人更需要学会"指挥"AI。',
          desc: '这个观点反常识，能引发争议和讨论。它降低了AI学习门槛，吸引更多非技术背景的创业者，同时突出了你作为"指挥官"的价值。',
          exampleTitle: '《别再死磕代码了！普通人玩转AI的真正秘诀是这个...》',
        },
        {
          title: '创业失败不可怕，可怕的是没有从失败中"赚"到经验。',
          desc: '你的百万负债经历让这个观点极具说服力。它能引发创业者的共鸣，并传递积极的价值观，强化你"过来人"的形象。',
          exampleTitle: '《我背负百万负债后，才明白这3个创业真相》',
        },
      ],
      mottos: [
        {
          motto: '"用AI，做个聪明的老板。"',
          whenToUse: '在介绍AI解决方案或案例时，结尾强调。',
          effect: '简洁有力，突出AI对老板的价值，强化品牌定位。',
        },
        {
          motto: '"别只看热闹，要看门道。"',
          whenToUse: '在分析行业趋势、拆解案例或揭示AI本质时使用。',
          effect: '引导观众深入思考，展现你的深度和洞察力。',
        },
        {
          motto: '"我的坑，你别再踩。"',
          whenToUse: '分享个人失败经历或避坑建议时使用。',
          effect: '拉近距离，展现真诚，增加内容的实用性和信任度。',
        },
      ],
    },

    contentPersona: {
      speakingStyle: '像一位经历过风浪、洞察商业本质的创业老兵，不卖弄技术，只讲实战经验和落地价值。语言直接、精炼，充满干货，偶尔穿插个人经历，真诚且有力量。语速适中，眼神坚定，偶尔带点幽默感。',
      speakingDos: [
        '多用比喻和类比，把复杂AI概念讲明白（例如：AI智能体就像你的专属超级员工）',
        '多讲故事，用个人经历或客户案例来支撑观点（例如：我当年开干餐饮店时，如果有AI就能省下...）',
      ],
      speakingDonts: [
        '避免使用生涩的技术术语，除非有清晰解释（例如：不说"Transformer架构"，说"AI理解语言的底层逻辑"）',
        '避免空泛的理论，所有建议都必须有可执行的步骤（例如：不说"要提升效率"，说"用AI自动生成报告，每周节省3小时"）',
      ],
      examplePitch: '"哈喽，我是老王。很多人问我，AI到底能帮我们做什么？别听那些花里胡哨的。我告诉你，AI最厉害的地方，就是帮你把那些重复、枯燥、又不得不做的事，全部自动化。比如我有个客户，每天要花两小时整理数据，现在一个智能体搞定，他能把精力放回谈大单。这就是AI的价值。记住，用AI，做个聪明的老板。"',
      visualStyle: {
        style: '专业而不失亲和力，展现创业者的精干和实干精神。整体色调偏向沉稳、科技感，但不过于冰冷，融入一些生活化的元素。',
        outfit: '商务休闲为主。衬衫、T恤搭配休闲西装外套或夹克。颜色以黑、白、灰、深蓝为主，偶尔点缀一些亮色。佩戴简约手表或手环，体现效率和品质感。',
        scene: '简洁明亮的办公室、工作室背景（有AI设备或屏幕显示智能体界面），或有设计感的咖啡馆一角，突出创业氛围。也可以选择一些科技展会、AI大会的现场作为背景。',
        props: ['笔记本电脑（显示AI界面）', '平板电脑', '白板/透明玻璃板（手写思考过程）', '咖啡杯'],
      },
      contentPillars: [
        {
          title: 'AI降本增效实战案例',
          percentage: '40%',
          frequency: '每周2-3次',
          desc: '拆解具体行业或企业如何通过定制智能体实现效率提升、成本降低的真实案例，突出AI的商业价值。',
          cases: [
            '《一个智能体，让我的电商客服效率提升300%！》',
            '《餐饮老板必看：AI如何帮你做菜单优化和采购预测？》',
            '《我给百万博主定制的AI助手，让他省下了一个运营团队》',
          ],
        },
        {
          title: 'OPC创业避坑指南',
          percentage: '30%',
          frequency: '每周1-2次',
          desc: '结合自身从餐饮到AI的转型经历，分享OPC创业者在AI赛道可能遇到的坑，以及如何规避和解决，提供实战经验和方法论。',
          cases: [
            '《我踩过的百万创业大坑：OPC创业者如何避免认知陷阱？》',
            '《技术小白如何快速上手AI，找到你的第一个付费客户？》',
            '《OPC创业，别只盯着技术，商业闭环才是王道！》',
          ],
        },
        {
          title: 'AI工具与趋势解读',
          percentage: '20%',
          frequency: '每周1次',
          desc: '分享最新AI工具的使用技巧、行业前沿趋势解读，帮助目标受众保持信息领先，激发对AI的兴趣和应用思考。',
          cases: [
            '《2026年，这3个AI工具将彻底改变你的工作方式！》',
            '《除了ChatGPT，你还应该知道的5款免费AI效率神器》',
            '《AI智能体发展趋势：未来每个人都将拥有专属AI员工》',
          ],
        },
        {
          title: '个人成长与创业感悟',
          percentage: '10%',
          frequency: '每半月1次',
          desc: '分享个人创业心路历程、从失败中学习的感悟、保持学习和迭代的方法，展现真实、有血有肉的人格魅力。',
          cases: [
            '《从13家店铺到百万负债，我如何走出人生低谷？》',
            '《创业十年，我学到的最重要一课：认知决定命运》',
            '《不是因为看到希望才坚持，而是坚持了才看到希望》',
          ],
        },
      ],
    },

    trustSystem: {
      backings: [
        {
          claim: '12年餐饮创业经验，曾拥有13家店铺',
          display: '在讲述商业洞察、市场分析时，提及"我当年做餐饮时就发现..."；在个人故事中，展示老照片或店铺照片。',
        },
        {
          claim: '成功交付多项AI工作流/智能体项目，收费4-6位数',
          display: '展示客户的感谢信、案例截图（模糊敏感信息）、客户访谈（征得同意后），强调"已帮助XX客户实现XX%效率提升"。',
        },
        {
          claim: '从技术小白到AI交付专家，已走通商业闭环',
          display: '分享学习路径、工具使用心得，展示个人学习笔记或项目开发过程中的截图；在课程宣传中强调"我的方法已验证"。',
        },
      ],
      socialProofs: [
        {
          proof: '客户的真实反馈和案例（包括百万博主商单）',
          method: '定期收集客户的文字或视频反馈，制作成案例集或短视频；邀请客户进行线上访谈或推荐；展示合作合同或交付成果（注意保密）。',
        },
        {
          proof: 'OPC创业者的学习成果和避坑反馈',
          method: '鼓励课程学员分享学习心得和应用成果；建立社群，收集学员的提问和成功案例；制作学员访谈视频。',
        },
      ],
      storyLine: {
        mainStory: '我曾是餐饮界的"老炮儿"，从一家小店做到13家连锁，以为摸透了商业的门道。然而，市场的无情和一次错误的投资，让我背负了百万负债。那段日子，我每天都在思考出路。偶然间，我接触到AI，从一个技术小白开始，像着了魔一样学习、实践。我亲手搓出了第一个AI工作流，看到了普通人通过AI改变命运的可能。我果断关闭了所有餐饮店，全身心投入AI赛道，从零开始打造我的OPC公司。现在，我不仅还清了债务，还用AI帮助更多企业和创业者降本增效，也把我的避坑经验总结成课程，希望能帮助更多OPC创业者少走弯路。',
        turningPoint: '背负百万负债后，我第一次尝试用AI工具制作图片，被它的强大震撼。那一刻我意识到，AI不是遥远的科技，而是普通人也能掌握的、改变命运的工具，它让我看到了从绝境中翻盘的希望。',
        narrationMethod: '通过短视频系列讲述"我的AI转型之路"，每期聚焦一个阶段或一个感悟；在直播中穿插讲述关键节点和心路历程；在课程或分享中，以"我当年就是这样..."的形式，把故事融入知识点，让内容更具感染力。',
      },
    },

    roadmap: [
      {
        period: '0-1个月',
        accent: 'green',
        goal: '建立核心人设，积累初始信任和流量',
        steps: [
          '发布10-15条核心人设短视频（餐饮老板转AI、百万负债、技术小白逆袭），形成记忆点。',
          '至少1个AI降本增效案例视频播放量破万。',
          '完成第一期OPC避坑课程大纲设计，并进行小范围内测。',
        ],
      },
      {
        period: '1-3个月',
        accent: 'yellow',
        goal: '强化专业认知，扩大影响力，开始课程预售',
        steps: [
          '持续发布AI实战案例和OPC避坑指南，形成内容系列。',
          '至少3个客户案例视频获得积极反馈，提升转化率。',
          '开始OPC避坑课程的预售，积累首批学员。',
          '尝试进行1-2场直播，分享AI趋势或创业经验。',
        ],
      },
      {
        period: '3-6个月',
        accent: 'purple',
        goal: '构建思想体系，打造社群，实现规模化交付',
        steps: [
          '形成稳定的内容输出节奏，深化核心理念和独特观点。',
          '课程正式上线并持续优化，建立学员社群，提供答疑和支持。',
          '通过客户案例和学员反馈，形成口碑传播，吸引更多高价值客户。',
          '探索AI定制服务和课程的组合销售模式，提升客单价和复购率。',
        ],
      },
    ],
  };
}
```

---

## 5 · 5 sub-component 详细规格

### 5.1 CoreIdentitySection.tsx(H3-1 核心身份定位)

文件 · `apps/web/src/components/step3b/CoreIdentitySection.tsx`

Props · `{ content?: Step3bResult['coreIdentity']; className?: string; }`

Layout(自上而下):
1. H3 row · `<FlameIcon size={4} /> 核心身份定位` + 右上 chip `人设核心`(text-xs · bg-primary/15 · text-primary · border-primary/30 · rounded · px-3 py-1)
2. SubCard "人设标签" · 顶部小 chip 标 + 中间大标题(text-base font-semibold text-on-surface)
3. SubCard "个人口号/金句" · 顶部小 chip 标 + italic 大字(text-sm italic text-on-surface/90 · text-center)
4. SubCard 含 sub-label "差异化定位"(text-xs font-semibold text-primary/85) + 段落
5. SubCard 含 sub-label "记忆点设计" + 3 卡 grid-cols-1 md:grid-cols-3 gap-3
   - 每卡 · border border-primary/15 rounded p-3 ·
     - row: ⭐(text-primary) + title(text-sm font-semibold)
     - desc(text-xs text-muted-foreground)
     - sub-label "落地方式：" (text-[11px] font-semibold text-on-surface/70)
     - practice(text-xs text-muted-foreground)
6. SubCard 含 sub-label "性格特质" + 3 chip flex-wrap gap-2:
   - 每 chip · `<span>{name}<span className="text-on-surface/55">（{desc}）</span></span>`
   - chip 风格 · text-xs bg-primary/10 border border-primary/25 text-on-surface rounded px-3 py-1.5

### 5.2 ThoughtSystemSection.tsx(H3-2 思想体系)

文件 · `apps/web/src/components/step3b/ThoughtSystemSection.tsx`

Props · `{ content?: Step3bResult['thoughtSystem']; className?: string; }`

Layout:
1. H3 row · `<FlameIcon /> 思想体系` + 右上 chip `深度内核`
2. SubCard "核心理念" · sub-label + 3 段(space-y-4):
   - 每段 · belief 大字(text-sm font-semibold text-on-surface) + reason 段(text-xs text-muted-foreground) + "内容角度："(text-[11px] font-semibold text-on-surface/70) + angle 段
3. SubCard "独特观点（引爆流量）" · sub-label + 2 黄边 highlight block(space-y-3):
   - 每 block · bg-primary/8 border border-primary/25 rounded-lg p-4 ·
     - row · ✨(text-primary text-base) + title(text-sm font-semibold text-on-surface)
     - desc(text-xs text-muted-foreground)
     - sub-label "示例标题：" + exampleTitle(text-xs italic text-primary/85)
4. SubCard "口头禅设计" · sub-label + 3 段(space-y-3):
   - 每段 · 🎤(text-primary) + motto(text-sm font-semibold text-on-surface) + whenToUse(text-xs text-muted-foreground) + sub-label "效果：" + effect

### 5.3 ContentPersonaSection.tsx(H3-3 内容人设)

文件 · `apps/web/src/components/step3b/ContentPersonaSection.tsx`

Props · `{ content?: Step3bResult['contentPersona']; className?: string; }`

Layout:
1. H3 row · `<FlameIcon /> 内容人设`
2. SubCard "说话风格" · speakingStyle 段
3. SubCard ✓✗ list(同 /step/3 AvatarDesignSection 必含/禁忌 风格):
   - speakingDos.map → ✓ (text-emerald-500) + text
   - speakingDonts.map → ✗ (text-rose-400) + text
4. SubCard "示例口播" · 大黄边 highlight block(bg-primary/8 border-primary/25 rounded-lg p-4 italic)
5. SubCard "视觉风格" · 2 列 grid-cols-1 md:grid-cols-2 gap-4:
   - 左列 · sub-label "风格" + style 段 ‖ sub-label "场景" + scene 段
   - 右列 · sub-label "穿搭" + outfit 段 ‖ sub-label "道具" + 4 chip flex-wrap
6. SubCard "内容支柱" · sub-label + 4 卡 grid-cols-1 md:grid-cols-2 gap-3:
   - 每卡 · border border-primary/15 rounded p-3 ·
     - row · title(text-sm font-semibold) + 右上 percentage chip(bg-primary/15 text-primary) + frequency chip(bg-muted/30 text-muted-foreground · 2 chip 同 row)
     - desc(text-xs text-muted-foreground)
     - 下方 · 3 cases chip flex-wrap(text-[11px] bg-primary/8 border-primary/15 rounded px-2 py-1)

### 5.4 TrustSystemSection.tsx(H3-4 信任构建体系)

文件 · `apps/web/src/components/step3b/TrustSystemSection.tsx`

Props · `{ content?: Step3bResult['trustSystem']; className?: string; }`

Layout:
1. H3 row · `<FlameIcon /> 信任构建体系`(用 FlameIcon 替代 🛡️ · 跟 /step/3 一致)
2. SubCard "信任背书" · sub-label + 3 条(space-y-3):
   - 每条 · claim(text-sm font-semibold text-on-surface) + sub-label "展示方式：" + display(text-xs text-muted-foreground)
3. SubCard "社会证明" · sub-label + 2 条(space-y-3):
   - 每条 · proof(text-sm font-semibold) + sub-label "获取方式：" + method
4. SubCard "个人故事线" · 大黄边 highlight block(bg-primary/8 border-primary/25 rounded-lg p-5 space-y-3):
   - mainStory 段(text-sm text-on-surface/90 leading-relaxed)
   - sub-label "转折点：" + turningPoint 段
   - sub-label "讲述方式：" + narrationMethod 段

### 5.5 RoadmapSection.tsx(H3-5 人设打造路线图)

文件 · `apps/web/src/components/step3b/RoadmapSection.tsx`

Props · `{ roadmap?: Step3bResult['roadmap']; canViewPlan?: boolean; onViewPlan?: () => void; className?: string; }`

Layout:
1. H3 row · `<FlameIcon /> 人设打造路线图` + 右上 stroke Button "执行计划"(variant=outline · size=sm)
2. 3 个 timeline box(space-y-3 · 垂直堆叠):
   - 每 box(rounded-lg border p-5):
     - accent='green' → border-emerald-500/30 bg-emerald-500/5
     - accent='yellow' → border-amber-500/30 bg-amber-500/5
     - accent='purple' → border-violet-500/30 bg-violet-500/5
   - 顶部 row · period chip(对应 accent · bg/border 同色更深 · text-on-surface · text-xs font-semibold rounded px-3 py-1) + goal(text-sm font-semibold text-on-surface · ml-3)
   - 下方 ul · 每 step · → (text-primary · shrink-0) + text(text-xs text-muted-foreground leading-relaxed) · space-y-1.5 mt-3

### 5.6 SubCard 写法参考(必读)

```tsx
import { SubCard } from '@/components/ui/sub-card';

<SubCard>
  <div className="space-y-3">
    <p className="text-xs font-semibold text-on-surface/80">sub-label</p>
    <p className="text-xs text-muted-foreground leading-relaxed">content</p>
  </div>
</SubCard>
```

---

## 6 · Step3b.tsx 重写规格

文件 · `apps/web/src/pages/step/Step3b.tsx`(完全替换 327 行 PRD-20 版)

### 6.1 import 清单

```typescript
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { CoreIdentitySection } from '@/components/step3b/CoreIdentitySection';
import { ThoughtSystemSection } from '@/components/step3b/ThoughtSystemSection';
import { ContentPersonaSection } from '@/components/step3b/ContentPersonaSection';
import { TrustSystemSection } from '@/components/step3b/TrustSystemSection';
import { RoadmapSection } from '@/components/step3b/RoadmapSection';
import { Step3LoadingState } from '@/components/step3/Step3LoadingState';
import { Step3PageHeader, Step3SectionDivider } from '@/components/step3/Step3PageHeader';
import { PlatformRadioGroup } from '@/components/step3/PlatformRadioGroup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import {
  STEP3B_AUDIENCE,
  STEP3B_CTA_LABEL,
  STEP3B_H1,
  STEP3B_STEP_TAG,
  STEP3B_SUBTITLE_TEMPLATE,
} from '@/lib/constants/step3b';
```

注意 · `Step3PageHeader` 接受 props 跟 /step/3 一样(`industry`/`canBulkActions`/`onOptimize`/`onRegenerateAll`/`onCopyAll`)· 注意 Step3b 头部 toolbar 只有"智能优化 + 复制全部"两个 button(**无"一键重新生成"**)· 但为简化 · 仍传 onRegenerateAll handler(可不显示 · 或显示)· 暂时全 3 button 都传 · 视觉略多一个 button 不致命 · Stage 4 红框补丁再调整。

### 6.2 函数体结构

```typescript
export default function Step3b() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step3b');

  // industry from step1 (default 美业)
  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  // PRD-29.8 · default form 1:1 复刻 sally 真实输入
  const [personalInfo, setPersonalInfo] = useState(DEFAULT_FORM.personalInfo);
  const [personalAdvantage, setPersonalAdvantage] = useState(DEFAULT_FORM.personalAdvantage);
  const [personalStory, setPersonalStory] = useState(DEFAULT_FORM.personalStory);
  const [platform, setPlatform] = useState(DEFAULT_FORM.platform);
  const [audience, setAudience] = useState(DEFAULT_FORM.audience);

  const prevIsSavingRef = useRef(false);

  // Restore form from LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step3bFormData>(accountId, 'step3b');
    if (saved?.personalInfo) {
      setPersonalInfo(saved.personalInfo);
      if (saved.personalAdvantage) setPersonalAdvantage(saved.personalAdvantage);
      if (saved.personalStory) setPersonalStory(saved.personalStory);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.audience) setAudience(saved.audience);
    }
  }, [accountId]);

  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  // 暂不接 LLM mutation · 用 stub(后续 PRD 接 trpc.step3b.generatePackage)
  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  const isLoading = isLocalGenerating || isSaving;

  // PRD-29.8 · default 强制 mock · 跟 /step/3 一致逻辑
  const generated: Step3bResult = generateMockResult();
  const canBulkActions = !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!personalInfo.trim() || isLoading) return;
    setIsLocalGenerating(true);
    save({ personalInfo, personalAdvantage, personalStory, platform, audience });
    setTimeout(() => {
      setIsLocalGenerating(false);
      toast.success('生成完成');
    }, 1200);
  }

  function handleRegenerateAll() {
    if (isLoading) return;
    setIsLocalGenerating(true);
    setTimeout(() => {
      setIsLocalGenerating(false);
      toast.success('已重新生成');
    }, 1200);
  }

  function handleCopyAll() {
    const text = JSON.stringify(generated, null, 2);
    navigator.clipboard.writeText(text).then(() => toast.success('已复制全部'));
  }

  function handleOptimize() {
    if (!canBulkActions) return;
    toast.success('已智能优化');
  }

  function handleViewPlan() {
    toast.info('执行计划功能开发中');
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* 1. Step3PageHeader 复用 · 但 H1/breadcrumb/subtitle 要传 3b 的 */}
      {/* 不复用 · 直接 hard-code render(因为 H1 字面不一样) */}
      <header className="space-y-3">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">
          STEP 03b › 人设定制方案
        </p>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <SparkleIcon size={6} className="h-6 w-6 shrink-0" />
            {STEP3B_H1}
          </h1>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleOptimize}>
              ✨ 智能优化
            </Button>
            <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleRegenerateAll}>
              ⟳ 一键重新生成
            </Button>
            <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleCopyAll}>
              📋 复制全部
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {STEP3B_SUBTITLE_TEMPLATE.replace('{industry}', industry)}
        </p>
      </header>

      {/* 2. Form · 3 textarea + platform + audience */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-card/30 border border-border/40 rounded-lg p-6">
        {/* personalInfo textarea (required *) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">
            你的个人信息 <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={personalInfo}
            onChange={(e) => setPersonalInfo(e.target.value)}
            className="w-full min-h-[140px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
            required
          />
        </div>

        {/* personalAdvantage textarea (optional) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">
            个人优势/特长 <span className="text-xs text-muted-foreground font-normal">（可选，有助于更精准的人设）</span>
          </label>
          <textarea
            value={personalAdvantage}
            onChange={(e) => setPersonalAdvantage(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
          />
        </div>

        {/* personalStory textarea (optional) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">
            个人故事/经历 <span className="text-xs text-muted-foreground font-normal">（可选，用于打造故事线）</span>
          </label>
          <textarea
            value={personalStory}
            onChange={(e) => setPersonalStory(e.target.value)}
            className="w-full min-h-[100px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
          />
        </div>

        {/* Platform radio group (复用 /step/3 PlatformRadioGroup) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">目标平台</label>
          <PlatformRadioGroup value={platform} onChange={setPlatform} />
        </div>

        {/* audience input (optional) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">
            目标受众 <span className="text-xs text-muted-foreground font-normal">（可选）</span>
          </label>
          <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder={STEP3B_AUDIENCE.placeholder} />
        </div>

        {/* Main CTA */}
        <Button
          type="submit"
          disabled={!personalInfo.trim() || isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-on-primary"
        >
          ✨ {STEP3B_CTA_LABEL}
        </Button>
      </form>

      {/* 3. Loading state */}
      {isLoading && <Step3LoadingState />}

      {/* 4. Section divider */}
      <Step3SectionDivider />

      {/* 5. H2 输出区标题 */}
      <h2 className="text-xl font-semibold text-on-surface">专属人设方案</h2>

      {/* 6. 5 H3 sections */}
      <CoreIdentitySection content={generated.coreIdentity} />
      <ThoughtSystemSection content={generated.thoughtSystem} />
      <ContentPersonaSection content={generated.contentPersona} />
      <TrustSystemSection content={generated.trustSystem} />
      <RoadmapSection roadmap={generated.roadmap} canViewPlan={canBulkActions} onViewPlan={handleViewPlan} />
    </main>
  );
}
```

注意 · 顶部 SparkleIcon 来自 `@/components/icons/aiipznt-icons` · 已存在 · 直接 import 用。

---

## 7 · step3b.ts 常量补充

在 `apps/web/src/lib/constants/step3b.ts` 末尾追加(不删原内容):

```typescript
// ─── PRD-29.8 · 真实 5 H3 字面(根据 sally zhao demo 截图)─────────
// 旧 STEP3B_OUTPUT_H3_6 是 PRD-20 历史 schema · 字面跟实际 aiipznt 不符 · 保留 @deprecated
// 实际 aiipznt sally /step/3b 输出 5 H3 · 字面如下
export interface Step3bRealH3Block {
  id: 'coreIdentity' | 'thoughtSystem' | 'contentPersona' | 'trustSystem' | 'roadmap';
  h3Label: string;
}

export const STEP3B_OUTPUT_H3_5_REAL: readonly Step3bRealH3Block[] = [
  { id: 'coreIdentity',   h3Label: '核心身份定位' },
  { id: 'thoughtSystem',  h3Label: '思想体系' },
  { id: 'contentPersona', h3Label: '内容人设' },
  { id: 'trustSystem',    h3Label: '信任构建体系' },
  { id: 'roadmap',        h3Label: '人设打造路线图' },
] as const;

// 整页顶部 H2 (输出区域)
export const STEP3B_RESULT_H2_REAL = '专属人设方案' as const;

// 顶部 toolbar 3 button(同 /step/3)
export const STEP3B_CTA_BULK_OPTIMIZE = '智能优化';
export const STEP3B_CTA_BULK_REGENERATE = '一键重新生成';
export const STEP3B_CTA_BULK_COPY = '复制全部';

// breadcrumb
export const STEP3B_BREADCRUMB = 'STEP 03b › 人设定制方案';

// H3-5 路线图右上 button
export const STEP3B_BUTTON_VIEW_PLAN = '执行计划';
```

---

## 8 · 文件输出 list(共 7 文件)

| # | path | 操作 | 行数估 |
|:-:|---|:-:|:-:|
| 1 | `apps/web/src/lib/constants/step3b.ts` | Edit(末尾追加 ~30 行) | +30 |
| 2 | `apps/web/src/components/step3b/CoreIdentitySection.tsx` | new | ~150 |
| 3 | `apps/web/src/components/step3b/ThoughtSystemSection.tsx` | new | ~140 |
| 4 | `apps/web/src/components/step3b/ContentPersonaSection.tsx` | new | ~180 |
| 5 | `apps/web/src/components/step3b/TrustSystemSection.tsx` | new | ~120 |
| 6 | `apps/web/src/components/step3b/RoadmapSection.tsx` | new | ~80 |
| 7 | `apps/web/src/pages/step/Step3b.tsx` | rewrite(完全替换) | ~280(含 mock + form default) |

**不动**:
- router.tsx
- step3b/Step3bOutputContent.tsx(旧 child · 留作 @deprecated · 但 Step3b.tsx 不再 import)
- StepResult/Step3bResult.tsx(不影响 · 暂不动)
- ip-plan/IpPlanStepGrid.tsx(暂不动 · 不影响渲染)

---

## 9 · 验收

1. **typecheck** · `cd apps/web && pnpm typecheck` · 0 error
2. **dev server 已启** · http://localhost:5173/step/3b 可访问
3. **innerText 关键字 grep** · Sonnet 不跑(Opus 阶段验证)· 但 sub-component 写完后预期至少包含:
   - "AI转型实战家" / "餐饮老板转行AI" / "百万负债逆袭" / "技术小白到交付专家"
   - "实战派" / "韧性强" / "真诚"
   - "AI是普通人弯道超车" / "商业的本质是解决问题" / "认知升级"
   - "别再死磕代码了" / "我背负百万负债后"
   - "用AI，做个聪明的老板" / "别只看热闹" / "我的坑"
   - "AI降本增效实战案例" / "OPC创业避坑指南" / "AI工具与趋势解读"
   - "12年餐饮创业经验" / "成功交付多项AI工作流"
   - "0-1个月" / "1-3个月" / "3-6个月"

---

## 10 · Sonnet 工作流程(必须按顺序)

1. **第 1 步 · 阅读参考组件**(必须先读 · 模仿风格):
   ```
   Read apps/web/src/components/step3/AvatarDesignSection.tsx
   Read apps/web/src/components/step3/OverallStrategySection.tsx
   Read apps/web/src/components/ui/sub-card.tsx
   Read apps/web/src/components/icons/aiipznt-icons.tsx (找 FlameIcon / SparkleIcon)
   ```

2. **第 2 步 · 写 step3b.ts 常量追加**(Edit · 仅末尾追加 · 不动原有)

3. **第 3 步 · 写 5 sub-component**(Write · 新文件 · 严格按 §5 规格)

4. **第 4 步 · 完全重写 Step3b.tsx**(Write · 替换 327 行原内容 · 严格按 §6 规格)
   - **包含** DEFAULT_FORM 常量(§3 真实字符)
   - **包含** Step3bResult interface(§2)
   - **包含** Step3bFormData interface(§2)
   - **包含** generateMockResult() 完整函数(§4 · 逐字 · 不允许概括或省略)
   - **包含** form 5 字段 + main CTA + 顶部 toolbar
   - **包含** 5 H3 section 渲染调用

5. **第 5 步 · 跑 typecheck**:
   ```
   cd apps/web && pnpm typecheck
   ```
   遇 error 自己 fix 直到 0 error。

6. **第 6 步 · 完成报告**:
   - 写了哪些文件
   - typecheck 结果
   - 任何遗漏 / 异常 / 不确定的地方明确说

---

## 11 · 红线(违反 = 任务失败)

- ❌ 不允许动 router.tsx
- ❌ 不允许删 step3b.ts 原有 STEP3B_OUTPUT_H3_6 / STEP3B_TEXTAREAS_3 / 等(保 @deprecated)
- ❌ 不允许概括 / 缩短 / 改写 §3 form 默认值或 §4 mock data(必须逐字)
- ❌ 不允许引入新 npm 依赖
- ❌ 不允许动 /step/3 已有组件
- ❌ 不允许使用 emoji 以外的新 icon · 风格跟 /step/3 一致
- ❌ 不允许写不必要的 comment / docstring(只在 §2 §3 §4 §6 关键 anchor 写一行 PRD-29.8 标记)
- ❌ 不允许尝试启 dev server / 跑 visual screenshot · 那是 Opus 阶段做的

---

## 12 · 我(Sonnet)做完后报告给 Opus 的格式

```
DONE / BLOCKED / NEEDS_CONTEXT

写了 X 个文件:
- path/to/file1 (XXX 行)
- ...

typecheck: PASS / FAIL(贴 error)

异常 / 不确定:
- ...

下一步建议 Opus 做的事:
- visual screenshot /step/3b
- innerText grep 验证
- 红框补丁
```
