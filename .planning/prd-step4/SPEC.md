# /step/4 "执行计划" 完全重写 SPEC

> **作者** · Opus 4.7(team plan · /step/4 是字段密度最高的 page · ~280 字段 / 6 sub-component)
> **执行** · Sonnet 4.6 max(按本 SPEC 写代码)
> **目标** · 1:1 字面复刻 aiipznt sally zhao /step/4 真实输出 · form + 6 sub-component output
> **不动** · router.tsx · `STEP4_*_5` `STEP4_INPUTS_3` `STEP4_OUTPUT_H3_3` 旧常量(留 @deprecated)

---

## 1 · 背景 + 工程约束

### 现状
- `apps/web/src/pages/step/Step4.tsx` (199 行 PRD-22 旧版 · 3 H3 schema · 跟截图完全不匹配 · 必须完全重写)
- `apps/web/src/lib/constants/step4.ts` (85 行 · 部分复用 · 加新常量 · 旧 @deprecated)
- `apps/web/src/components/step4/` (目录不存在 · 新建)
- `apps/web/src/router.tsx:83` 已挂 `{ path: '4', element: <Step4 /> }` · **不动 router**

### 视觉风格参考(必读)
Sonnet 写 sub-component 前 · 必读 ·
- `apps/web/src/components/step3b/CoreIdentitySection.tsx` (SubCard + 多 sub-card pattern 参考)
- `apps/web/src/components/step3b/RoadmapSection.tsx` (timeline box · accent color 参考)
- `apps/web/src/components/step3/OverallStrategySection.tsx` (stage chip + 3 列 grid 参考 · 跟"每日作息"几乎一样)
- `apps/web/src/components/step3/NicknameRecommendSection.tsx` (highlight ✓/✗ 参考)
- `apps/web/src/components/ui/sub-card.tsx`
- `apps/web/src/components/icons/aiipznt-icons.tsx` (FlameIcon / SparkleIcon)

**严格沿用** · text-xs / text-on-surface / text-muted-foreground / bg-primary/10 · 不引入新颜色。
**新颜色 token** · 仅警告区用 `border-rose-500/30 bg-rose-500/5` + `text-rose-400` · 成功区用 `border-emerald-500/30 bg-emerald-500/5` + `text-emerald-400`。

---

## 2 · 完整 schema(TypeScript interface)

```typescript
export interface Step4Result {
  // ── 总览 ─────────────────────────────────────────────────
  overview: {
    currentStage: string;        // 当前阶段
    coreGoal: string;            // 核心目标
    timeline: string;            // 总体时间线
    mainPlatform: string;        // 主攻平台
    coreAdvantages: string;      // 核心优势(长段)
  };

  // ── 3 阶段(stage 1/2/3) ──────────────────────────────────
  phases: Step4Phase[];

  // ── 每日作息(3 列 · 上午/下午/晚上)─────────────────────
  dailySchedule: {
    morning: Step4ScheduleItem[];
    afternoon: Step4ScheduleItem[];
    evening: Step4ScheduleItem[];
  };

  // ── 危险信号预警(红边)──────────────────────────────────
  warnings: Array<{
    signal: string;              // 视频完播率低于30%
    meaning: string;             // 内容开头不够吸引人...
    solution: string;            // 优化前3秒内容...
  }>;

  // ── 成功标准(绿边 · 3 时段)──────────────────────────────
  successCriteria: Array<{
    period: string;              // 第1周 / 第1个月 / 第3个月
    desc: string;
  }>;
}

export interface Step4Phase {
  number: 1 | 2 | 3;
  title: string;                 // 阶段一：战略规划与IP定位
  weekRange: string;             // 第1周
  goal: string;                  // 明确商业模式、双目标，完成IP基础包装，并产出首批内容策略。
  dailyTasks: Array<{
    day: string;                 // 周一 09:00-12:00
    title: string;               // 商业模式梳理与目标细化
    desc: string;
    duration: string;            // 3小时
  }>;
  milestones: Array<{
    week: string;                // 第1周 / 第2周 / 第3周 / 第4周 / 第5-8周 / 第9周+
    goal: string;
    criteria?: string;           // 检查标准: ...(并非所有 milestone 都有)
  }>;
  contentPlan: {
    frequency: string;           // 5-7条 / 7-10条
    categories: Array<{          // 每个 category 是黄边 highlight chip
      name: string;              // 看见你（痛点共鸣/价值主张）（20%）
      desc: string;              // 快速吸引目标用户停留...
    }>;
    bestTime: string;            // 早7:00-8:30、午休12:00-13:30、晚18:00-20:00
  };
  kpis: Array<{
    name: string;                // 抖音账号粉丝数
    target: string;              // 500 / >30% / 10000
    baseline: string;            // 1-1000 / 未知 / 3000 / 0
  }>;
}

export interface Step4ScheduleItem {
  time: string;                  // 08:30-09:00
  title: string;                 // 数据复盘
  desc: string;
}

export interface Step4FormData {
  platform: string;              // 'douyin' default
  followerCount: string;         // '1-1000'
  goal: string;                  // 'start'
  personalInfo: string;
}
```

---

## 3 · Form 默认值(useState initial · 1:1 sally 真实输入)

```typescript
const DEFAULT_FORM: Step4FormData = {
  platform: 'douyin',
  followerCount: '1-1000',
  goal: 'start',
  personalInfo: '我是一名opc创业者，擅长与人沟通和项目交付。专业技能是给企业或者个人定制全自动工作流或者智能体，在这么行业从业半年。我以前是餐饮从业者，从事餐饮行业12年，作为品牌创始人之一的我，高峰时期拥有13家店铺（外卖店+实体店），因为品类周期原因，已经没有利润和持续的意义，加上因为认知问题投资的代加工厂失败，背上近百万的负债。后来果断一家一家店铺关掉，来到ai赛道做一家opc个人创业公司。我也是一名持续创业者，这是十几年期间有成功的项目也有失败血亏的项目，但是我从来不缺从头再来的勇气，目前公司已经交付一些简单的工作流和智能体平台，这些交付的案例都帮助客户解决了提效的问题，把客户从复杂重复的工作里抽身出来把精力放在更重要的商业决策上来。收费有4位数到6位数都有。我以前是技术小白，通过我不断的学习和自我迭代，到我现在可以交付项目。我自己的商业闭环走通这个环节也走了一些弯路，我把这些学习经验和沟通经验做成一系列的课程，想要帮助一些opc创业者避坑。',
};
```

---

## 4 · 完整 mock data · 逐字提取(generateMockResult)

> ⚠️ **Sonnet 必须逐字 copy · 不允许概括 / 删减 / 改写标点** · 全角中文标点(，。：、)严格保留

```typescript
function generateMockResult(): Step4Result {
  return {
    overview: {
      currentStage: '你目前处于IP冷启动期，拥有1-1000粉丝，需要快速验证内容方向并积累初期用户。',
      coreGoal: '在3个月内，通过抖音平台获取精准意向客户，并实现首批高客单价智能体定制服务成交，同时启动OPC创业者课程的私域流量积累。',
      timeline: '三阶段规划：战略规划（第1周）、基础建设（第2-3周）、内容启动及增长（第4周+）。',
      mainPlatform: '抖音，作为核心流量入口。',
      coreAdvantages: '你拥有丰富的创业经验（餐饮12年，AI半年），经历过成功与失败，具备强大的抗压能力和从头再来的勇气。擅长沟通和项目交付，能将复杂技术转化为客户价值。同时，你从技术小白成长为交付者，这本身就是极具说服力的IP故事。',
    },

    phases: [
      // ── 阶段一：战略规划与IP定位 ──────────────────────────
      {
        number: 1,
        title: '阶段一：战略规划与IP定位',
        weekRange: '第1周',
        goal: '明确商业模式、双目标，完成IP基础包装，并产出首批内容策略。',
        dailyTasks: [
          {
            day: '周一 09:00-12:00',
            title: '商业模式梳理与目标细化',
            desc: '明确核心价值主张：为企业/个人定制AI工作流，解决提效痛点。目标客户：需要降本增效的企业主（美业、餐饮等）、寻求商业闭环的OPC创业者。盈利模式：智能体定制服务（1-10万+），OPC课程/训练营（9800-29800）。',
            duration: '3小时',
          },
          {
            day: '周一 14:00-17:00',
            title: '双目标设定',
            desc: '变现目标：第一个月成交1单智能体定制服务（1-5万），积累500个OPC创业者私域用户。客资目标：抖音账号月增粉5000，私域引流率10%。',
            duration: '3小时',
          },
          {
            day: '周二 09:00-12:00',
            title: '全域IP矩阵布局（规划）',
            desc: '主号抖音：核心内容发布，引流私域。小红书（规划）：作为案例展示和深度内容补充。视频号（规划）：作为私域承接和长视频输出平台。目前主攻抖音。',
            duration: '3小时',
          },
          {
            day: '周二 14:00-17:00',
            title: '产品体系设计',
            desc: '引流品：免费AI工具清单/AI提效案例集（0元）。信任品：AI工作流定制体验课/AI智能体定制咨询（99-499元）。利润品：基础版AI智能体定制（1-5万），OPC创业者线上课程（9800）。后端品：高级定制AI智能体（5万+），OPC创业者线下高阶培训/训练营（19800-29800）。',
            duration: '3小时',
          },
          {
            day: '周三 09:00-12:00',
            title: '三大素材库搭建（启动）',
            desc: '生活素材库：整理个人创业经历、餐饮经验、AI学习过程中的照片/视频。选题库：基于目标客户痛点（效率低下、成本高、商业闭环难）和AI解决方案，头脑风暴100个短视频选题。案例库：整理已交付的AI工作流/智能体案例，提炼客户痛点、解决方案、效果对比。',
            duration: '3小时',
          },
          {
            day: '周三 14:00-17:00',
            title: 'IP人设与账号包装',
            desc: '昵称：AI老吴、AI工作流定制师、AI创业老兵。头像：专业形象照，体现AI科技感。背景图：展示AI工作流或成功案例。简介："从餐饮老板到AI工作流定制师，用AI助你提效降本，告别重复工作。" 或 "12年创业老兵，半年从小白到AI工作流交付专家，助OPC创业者避坑。"',
            duration: '3小时',
          },
          {
            day: '周四 09:00-12:00',
            title: '抖音内容八大系统策略制定',
            desc: '分配内容类型占比：看见你（20%）、信任你（30%）、认可你（15%）、喜欢你（15%）、成交（10%）、平台托举（5%）、追随（3%）、行业标杆（2%）。重点在前四周快速提升"看见你"和"信任你"的内容。',
            duration: '3小时',
          },
          {
            day: '周四 14:00-17:00',
            title: '私域承接SOP初稿',
            desc: '引流钩子设计："免费领取AI工具清单，提升效率30%"，"私信我，免费诊断你的工作流"。用户标签体系：意向客户（企业主）、OPC创业者、潜在合作者。朋友圈规划：每日3-5条，内容包括AI干货、案例分享、个人生活、课程预告。',
            duration: '3小时',
          },
          {
            day: '周五 09:00-12:00',
            title: '场景化选题指南应用',
            desc: '规划未来一周的拍摄场景：办公室（展示AI工具）、咖啡馆（轻松分享创业经验）、和客户在一起（案例展示）。',
            duration: '3小时',
          },
          {
            day: '周五 14:00-17:00',
            title: '首周内容脚本撰写',
            desc: '撰写3-5个短视频脚本，涵盖"看见你"和"信任你"类型，时长控制在30-60秒。例如："3个AI工具，让你的工作效率翻倍"（看见你），"我如何用AI，半年从餐饮老板转型成功"（信任你）。',
            duration: '3小时',
          },
        ],
        milestones: [
          {
            week: '第1周',
            goal: '完成IP基础设定，明确商业路径，产出首批内容策略和脚本。',
            criteria: '商业模式清晰，双目标量化，产品体系完整，账号包装完成，至少5个可发布脚本。',
          },
        ],
        contentPlan: {
          frequency: '5-7条',
          categories: [
            { name: '看见你（痛点共鸣/价值主张）（20%）', desc: '快速吸引目标用户停留，让他们知道你能解决什么问题。' },
            { name: '信任你（个人故事/专业度展示）（30%）', desc: '通过个人经历、专业知识，建立用户信任感。' },
          ],
          bestTime: '早7:00-8:30、午休12:00-13:30、晚18:00-20:00',
        },
        kpis: [
          { name: '抖音账号粉丝数', target: '500', baseline: '1-1000' },
          { name: '单视频完播率', target: '>30%', baseline: '未知' },
          { name: '单视频点赞率', target: '>3%', baseline: '未知' },
        ],
      },

      // ── 阶段二：基础建设与内容启动 ──────────────────────
      {
        number: 2,
        title: '阶段二：基础建设与内容启动',
        weekRange: '第2-3周',
        goal: '完善素材库，开始发布内容，测试用户反馈，并优化私域承接流程。',
        dailyTasks: [
          {
            day: '周一 09:00-12:00',
            title: '素材库完善',
            desc: '继续扩充选题库（至少50个），案例库（至少5个详细案例），生活素材库（个人学习、工作场景）。',
            duration: '3小时',
          },
          {
            day: '周一 14:00-17:00',
            title: '内容拍摄与剪辑',
            desc: '拍摄并剪辑3条视频，例如："美业老板，还在手算业绩？AI帮你秒出报表！"（看见你），"我用AI打造的餐饮智能助手，让门店成本直降15%"（信任你），"OPC创业者，这3个AI坑你必须避开"（信任你）。注意黄金3秒法则，前3秒突出痛点或结果。',
            duration: '3小时',
          },
          {
            day: '周二 09:00-10:00',
            title: '抖音首发',
            desc: '发布一条视频，选择在早7:00-8:30之间。标题包含关键词，例如："美业AI提效"。文案引导互动："你还遇到哪些工作流难题？评论区告诉我。"',
            duration: '1小时',
          },
          {
            day: '周二 10:00-12:00',
            title: '数据复盘与优化',
            desc: '分析已发布视频的完播率、点赞率、评论，根据数据调整后续内容方向和脚本。',
            duration: '2小时',
          },
          {
            day: '周二 14:00-17:00',
            title: '私域引流钩子优化',
            desc: '设计更具吸引力的引流钩子，例如："私信【AI】，免费获取美业AI提效方案"，"私信【避坑】，领取OPC创业者AI工具避坑指南"。制作对应的落地页或私域欢迎语。',
            duration: '3小时',
          },
          {
            day: '周三 09:00-12:00',
            title: '内容拍摄与剪辑',
            desc: '拍摄并剪辑2条视频，例如："AI工作流定制，到底能帮你省多少钱？"（认可你），"从负债百万到AI创业，我的心路历程"（喜欢你）。',
            duration: '3小时',
          },
          {
            day: '周三 12:00-13:00',
            title: '抖音发布',
            desc: '发布一条视频，选择在午休12:00-13:30之间。文案引导私信。',
            duration: '1小时',
          },
          {
            day: '周四 09:00-12:00',
            title: '私域承接SOP演练',
            desc: '模拟用户添加私域流程，确保欢迎语、自动回复、朋友圈内容流畅且有价值。准备好用户标签体系。',
            duration: '3小时',
          },
          {
            day: '周四 18:00-19:00',
            title: '抖音发布',
            desc: '发布一条视频，选择在晚18:00-20:00之间。文案引导私信或评论。',
            duration: '1小时',
          },
          {
            day: '周五 09:00-12:00',
            title: '内容规划与脚本撰写',
            desc: '根据前几条视频数据反馈，调整下周内容方向。撰写3-5个新脚本，增加"认可你"和"喜欢你"的内容占比。',
            duration: '3小时',
          },
        ],
        milestones: [
          {
            week: '第2周',
            goal: '发布至少5条高质量短视频，测试内容方向和用户反馈，优化私域引流钩子。',
            criteria: '账号粉丝增长100+，单视频平均完播率>35%，私域引流人数>20。',
          },
          {
            week: '第3周',
            goal: '持续发布内容，开始积累私域用户，并进行初步互动。',
            criteria: '账号粉丝增长300+，私域引流人数>50，至少完成10次私域用户互动（咨询、提问等）。',
          },
        ],
        contentPlan: {
          frequency: '5-7条',
          categories: [
            { name: '看见你（痛点共鸣/价值主张）（20%）', desc: '持续吸引新用户' },
            { name: '信任你（个人故事/专业度展示）（30%）', desc: '加深用户对你的了解和信任' },
            { name: '认可你（解决方案/案例展示）（15%）', desc: '展示你的能力和成果，让用户觉得你有真本事' },
            { name: '喜欢你（个人魅力/价值观）（15%）', desc: '通过真诚分享，让用户产生情感连接' },
          ],
          bestTime: '早7:00-8:30、午休12:00-13:30、晚18:00-20:00',
        },
        kpis: [
          { name: '抖音账号粉丝数', target: '3000', baseline: '1-1000' },
          { name: '单视频互动率（评论+转发）', target: '>5%', baseline: '未知' },
          { name: '私域引流人数', target: '100', baseline: '0' },
        ],
      },

      // ── 阶段三：规模增长与变现启动 ──────────────────────
      {
        number: 3,
        title: '阶段三：规模增长与变现启动',
        weekRange: '第4周+',
        goal: '通过付费投流和直播，放大流量，加速私域积累和变现。',
        dailyTasks: [
          {
            day: '每天 09:00-10:00',
            title: '数据复盘与内容优化',
            desc: '分析前一天视频数据，特别是互动率、关注转化率和私域引流数据。根据数据调整当天内容方向和发布策略。例如，如果某个案例视频效果好，就多做类似内容。',
            duration: '1小时',
          },
          {
            day: '每天 10:00-12:00',
            title: '内容拍摄与剪辑',
            desc: '每天产出1-2条高质量视频。例如："美业老板必看！AI帮你分析客户数据，精准营销！"（认可你），"我如何用AI，实现从0到1的商业闭环"（成交），"我的AI智能体，让客户每月节省30000元"（成交）。',
            duration: '2小时',
          },
          {
            day: '每天 12:00-13:00',
            title: '抖音发布与互动',
            desc: '发布视频，并积极回复评论、私信。引导用户进入私域。利用抖音推流机制，在黄金时间发布。',
            duration: '1小时',
          },
          {
            day: '每天 14:00-17:00',
            title: '私域运营与客户沟通',
            desc: '在企业微信/个人微信中，对新引流用户进行标签化管理，提供引流品（免费AI工具清单）。针对意向客户进行一对一咨询，了解痛点，推荐产品体系中的信任品或利润品。例如："你好，我是AI老吴，看到你对AI提效感兴趣，方便聊聊你目前遇到的工作流难题吗？我这里有份【美业AI提效方案】可以免费送你。"',
            duration: '3小时',
          },
          {
            day: '每周二/四 19:00-21:00',
            title: '直播流程设计与执行',
            desc: '暖场（5分钟）：分享个人创业故事，吸引用户。痛点共鸣（15分钟）：深挖企业主/OPC创业者痛点。干货输出（30分钟）：分享AI提效具体方法、工具。产品植入（10分钟）：介绍AI智能体定制服务或OPC课程。答疑（15分钟）：解答用户疑问。逼单（5分钟）：限时优惠或专属福利，引导成交或私域转化。例如："今晚直播间，我将手把手教你搭建第一个AI工作流，前10名用户可获得免费AI诊断！"',
            duration: '2小时',
          },
          {
            day: '每周三/五 10:00-11:00',
            title: '付费投流策略',
            desc: '精准测试投流（100-300元/天）：选择表现好的视频进行DOU+投放，测试不同人群包（企业主、创业者、美业老板、餐饮老板）的效果。目标是提升视频播放量和私域引流成本。批量放大投流（1000-5000元/天）：一旦发现高转化视频和精准人群包，果断放大投放，加速流量获取。',
            duration: '1小时',
          },
        ],
        milestones: [
          {
            week: '第4周',
            goal: '启动直播，进行首次付费投流测试，实现首单成交。',
            criteria: '抖音粉丝突破5000，私域引流人数200+，至少1单智能体定制服务成交（或1个OPC课程成交）。',
          },
          {
            week: '第5-8周',
            goal: '稳定内容输出，优化投流策略，提升成交转化率。',
            criteria: '抖音粉丝突破1万，私域引流人数500+，累计成交3-5单智能体定制服务或OPC课程。',
          },
          {
            week: '第9周+',
            goal: '持续放大，探索裂变增长和IP矩阵复制。',
            criteria: '抖音粉丝突破3万，私域用户1000+，月均成交5万+，开始规划小红书/视频号内容。',
          },
        ],
        contentPlan: {
          frequency: '7-10条',
          categories: [
            { name: '看见你（痛点共鸣/价值主张）（15%）', desc: '持续引入新用户。' },
            { name: '信任你（个人故事/专业度展示）（25%）', desc: '深化信任，建立专业形象。' },
            { name: '认可你（解决方案/案例展示）（20%）', desc: '用成果说话，增强说服力。' },
            { name: '喜欢你（个人魅力/价值观）（15%）', desc: '建立情感连接，培养忠实粉丝。' },
            { name: '成交（产品介绍/促单）（10%）', desc: '直接引导购买或咨询。' },
            { name: '平台托举（热点/挑战）（5%）', desc: '蹭平台流量，扩大曝光。' },
            { name: '追随（用户反馈/互动）（3%）', desc: '增强用户粘性，形成社群氛围。' },
            { name: '行业标杆（深度分析/趋势洞察）（2%）', desc: '树立行业权威形象。' },
          ],
          bestTime: '早7:00-8:30、午休12:00-13:30、晚18:00-20:00',
        },
        kpis: [
          { name: '抖音账号粉丝数', target: '10000', baseline: '3000' },
          { name: '直播间观看人数', target: '200+', baseline: '0' },
          { name: '私域引流人数', target: '500', baseline: '100' },
          { name: '智能体定制服务成交额', target: '50000', baseline: '0' },
        ],
      },
    ],

    dailySchedule: {
      morning: [
        {
          time: '08:30-09:00',
          title: '数据复盘',
          desc: '查看前一天抖音视频数据（完播率、点赞、评论、转发、关注转化、私信量），私域新增人数及互动情况。',
        },
        {
          time: '09:00-12:00',
          title: '内容创作',
          desc: '根据数据反馈，撰写脚本，进行拍摄或剪辑。确保内容符合八大系统占比。',
        },
      ],
      afternoon: [
        {
          time: '12:00-13:00',
          title: '抖音发布与互动',
          desc: '发布当天第一条视频，并回复评论、私信。引导至私域。',
        },
        {
          time: '14:00-17:00',
          title: '私域运营与客户沟通',
          desc: '在企业微信中与新老客户互动，提供价值，进行咨询或促单。',
        },
        {
          time: '17:00-18:00',
          title: '素材整理与选题',
          desc: '整理当天拍摄素材，更新选题库，为第二天内容做准备。',
        },
      ],
      evening: [
        {
          time: '18:00-19:00',
          title: '抖音发布与互动',
          desc: '发布当天第二条视频（如有），并进行互动。尤其关注直播前的预热。',
        },
        {
          time: '19:00-21:00',
          title: '直播/学习',
          desc: '按计划进行直播，或进行行业学习、AI技术迭代学习，提升专业能力。',
        },
      ],
    },

    warnings: [
      {
        signal: '视频完播率低于30%',
        meaning: '内容开头不够吸引人，或节奏拖沓。',
        solution: '优化前3秒内容，增加悬念或直接抛出痛点/结果。加快视频节奏，精简废话。',
      },
      {
        signal: '点赞率低于3%，评论、转发少',
        meaning: '内容没有引起共鸣或互动性差。',
        solution: '增加互动引导，如提问、投票。内容更贴近用户痛点，提供更具体解决方案。',
      },
      {
        signal: '私域引流成本过高，或转化率低',
        meaning: '引流钩子不够吸引人，或私域承接SOP有问题。',
        solution: '优化引流钩子，使其更具价值和稀缺性。检查私域欢迎语、朋友圈内容是否能持续提供价值并建立信任。',
      },
      {
        signal: '直播间互动少，停留时间短',
        meaning: '直播内容枯燥，或没有有效互动环节。',
        solution: '增加直播互动游戏、抽奖。提前预告直播亮点，提升内容密度和干货输出。',
      },
    ],

    successCriteria: [
      {
        period: '第1周',
        desc: '完成IP基础设定，发布至少3条视频，账号粉丝突破100。',
      },
      {
        period: '第1个月',
        desc: '抖音粉丝突破3000，私域引流人数100+，至少1次直播，实现首单成交。',
      },
      {
        period: '第3个月',
        desc: '抖音粉丝突破10000，私域引流人数500+，月均成交额达到5万+，形成稳定内容输出和变现模式。',
      },
    ],
  };
}
```

---

## 5 · 6 sub-component 详细规格

### 5.1 Step4OverviewSection.tsx(总览)

文件 · `apps/web/src/components/step4/Step4OverviewSection.tsx`
Props · `{ overview?: Step4Result['overview']; className?: string; }`

Layout(整段一个大 SubCard 暗色背景):
1. H3 row · `<SparkleIcon size={4} /> 📌 总览`(注意 emoji 直接放 jsx text 里)
2. SubCard 内 · grid-cols-1 md:grid-cols-2 gap-6:
   - 左列 · "当前阶段" + 段 / "总体时间线" + 段 / "核心优势" + 段(跨整行)
   - 右列 · "核心目标" + 段 / "主攻平台" + 段
3. 每 sub-section · `<p text-xs font-semibold text-primary/85>{label}</p>` + `<p text-sm text-on-surface/90 leading-relaxed>{value}</p>`

**特殊处理** · "核心优势" 是长段 · 跨整行 grid-column: 1 / -1(md:col-span-2)

### 5.2 Step4PhaseSection.tsx(单个 phase · 3 次)

文件 · `apps/web/src/components/step4/Step4PhaseSection.tsx`
Props · `{ phase: Step4Phase; className?: string; }`

Layout:
1. H3 row · `<span text-2xl in-circle bg-primary/15 text-primary>{number}</span>` + `<h3>{title}</h3>`
2. `<p text-xs text-muted-foreground>🕐 {weekRange} · 目标：{goal}</p>`
3. SubCard "📋 每日任务" · sub-label + dailyTasks.map:
   - 每 task: 2 列 layout(grid-cols-[140px_1fr] gap-4):
     - 左: `<p text-xs text-primary/85 font-mono>{day}</p>`
     - 右: `<p text-sm font-semibold>{title}</p>` + `<p text-xs text-muted-foreground leading-relaxed>{desc}</p>` + `<p text-[11px] text-muted-foreground/70>🕐 {duration}</p>`
4. SubCard "🎯 每周里程碑" · sub-label + milestones.map:
   - 每 milestone: 2 列 layout(grid-cols-[80px_1fr] gap-4):
     - 左: `<p text-xs text-primary font-semibold>{week}</p>`
     - 右: `<p text-sm text-on-surface>{goal}</p>` + (criteria 存在时) `<p text-xs text-muted-foreground>检查标准：{criteria}</p>`
5. SubCard "📝 内容计划":
   - `<p>每周发布: <span text-primary>{frequency}</span></p>`
   - categories.map · highlight chip(bg-primary/8 border-primary/25 rounded-lg p-3): `<span font-semibold>{name}</span> - <span text-muted-foreground>{desc}</span>`(每个 chip 独立 block · 不是 inline)
   - `<p text-xs text-muted-foreground>最佳发布时间：{bestTime}</p>`
6. SubCard "📊 KPI指标" · grid-cols-1 md:grid-cols-2 gap-4:
   - 每 KPI: `<p text-xs text-muted-foreground>{name}</p>` + `<p text-2xl text-primary font-bold>{target}</p>` + `<p text-xs text-muted-foreground/70>当前基准：{baseline}</p>`

### 5.3 Step4DailyScheduleSection.tsx(每日作息)

文件 · `apps/web/src/components/step4/Step4DailyScheduleSection.tsx`
Props · `{ schedule?: Step4Result['dailySchedule']; className?: string; }`

Layout:
1. H3 row · `<FlameIcon /> 🕐 每日作息安排`
2. SubCard 内 · grid-cols-1 md:grid-cols-3 gap-6:
   - 列 1 "☀️ 上午"(顶部小 label · text-primary text-sm font-semibold) + morning.map(每 item: time + title + desc 垂直堆叠 · 整体 space-y-1)
   - 列 2 "☁️ 下午" + afternoon.map
   - 列 3 "🌙 晚上" + evening.map
3. 每 item · `<p text-xs text-primary font-mono>{time}</p>` + `<p text-sm font-semibold text-on-surface>{title}</p>` + `<p text-xs text-muted-foreground leading-relaxed>{desc}</p>`
4. 多 item 间隔 space-y-4

### 5.4 Step4WarningSection.tsx(危险信号)

文件 · `apps/web/src/components/step4/Step4WarningSection.tsx`
Props · `{ warnings?: Step4Result['warnings']; className?: string; }`

Layout(整个区用红色边框):
1. H3 row · `<span text-rose-400>⚠️</span> <span text-rose-400 font-semibold>危险信号预警</span>`
2. 红色边框大卡(`border border-rose-500/30 bg-rose-500/5 rounded-lg p-5`):
3. warnings.map(space-y-4):
   - `<p text-sm font-semibold text-rose-400>{signal}</p>`(红字标题)
   - `<p text-xs text-muted-foreground>含义：{meaning}</p>`(灰字含义)
   - `<p text-xs text-emerald-400>解决方案：{solution}</p>`(绿字解决方案)

### 5.5 Step4SuccessCriteriaSection.tsx(成功标准)

文件 · `apps/web/src/components/step4/Step4SuccessCriteriaSection.tsx`
Props · `{ criteria?: Step4Result['successCriteria']; className?: string; }`

Layout(整个区用绿色边框):
1. H3 row · `<span text-emerald-400>📊</span> <span text-emerald-400 font-semibold>成功标准</span>`
2. 绿色边框大卡(`border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-5`):
3. criteria.map · grid-cols-1 md:grid-cols-3 gap-4:
   - 每 criterion: `<p text-xs text-emerald-400 font-semibold>{period}</p>` + `<p text-sm text-on-surface leading-relaxed>{desc}</p>`

### 5.6 Step4FooterAction.tsx(footer)

文件 · `apps/web/src/components/step4/Step4FooterAction.tsx`
Props · `{ onNextStep?: () => void; onViewIpPlan?: () => void; className?: string; }`

Layout:
1. 顶部一行 · "这个结果对你有帮助吗？" + 👍 button(variant ghost size icon) + 👎 button
2. 下方一个 SubCard(bg-primary/8 border-primary/25):
   - 顶部 row · `<CheckCircle text-primary />` + "执行计划 已完成 🎉"
   - 副文 · "分析结果已保存。建议继续下一步「变现路径」，让AI为你生成更精准的方案。"
   - 2 button · 主 "继续下一步：变现路径 >"(金背) + 次 "查看我的IP方案"(stroke)

### 5.7 SubCard 写法参考(必读)

```tsx
import { SubCard } from '@/components/ui/sub-card';

<SubCard>
  <div className="space-y-3">
    <p className="text-xs font-semibold text-on-surface/80">sub-label</p>
    <div className="...">content</div>
  </div>
</SubCard>
```

---

## 6 · Step4.tsx 重写规格

文件 · `apps/web/src/pages/step/Step4.tsx`(完全替换 199 行 PRD-22 版)

### 6.1 import 清单

```typescript
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Step4OverviewSection } from '@/components/step4/Step4OverviewSection';
import { Step4PhaseSection } from '@/components/step4/Step4PhaseSection';
import { Step4DailyScheduleSection } from '@/components/step4/Step4DailyScheduleSection';
import { Step4WarningSection } from '@/components/step4/Step4WarningSection';
import { Step4SuccessCriteriaSection } from '@/components/step4/Step4SuccessCriteriaSection';
import { Step4FooterAction } from '@/components/step4/Step4FooterAction';
import { Step3LoadingState } from '@/components/step3/Step3LoadingState';
import { Step3SectionDivider } from '@/components/step3/Step3PageHeader';
import { PlatformRadioGroup } from '@/components/step3/PlatformRadioGroup';
import { SparkleIcon } from '@/components/icons/aiipznt-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { STEP4_H1, STEP4_BUTTON_GENERATE, STEP4_SUBTITLE_TEMPLATE } from '@/lib/constants/step4';
```

### 6.2 函数体结构

```typescript
export default function Step4() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step4');

  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  // PRD-29.9 · default form 1:1 复刻 sally 真实输入
  const [platform, setPlatform] = useState(DEFAULT_FORM.platform);
  const [followerCount, setFollowerCount] = useState(DEFAULT_FORM.followerCount);
  const [goal, setGoal] = useState(DEFAULT_FORM.goal);
  const [personalInfo, setPersonalInfo] = useState(DEFAULT_FORM.personalInfo);

  const prevIsSavingRef = useRef(false);

  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step4FormData>(accountId, 'step4');
    if (saved?.personalInfo) {
      setPersonalInfo(saved.personalInfo);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.followerCount) setFollowerCount(saved.followerCount);
      if (saved.goal) setGoal(saved.goal);
    }
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

  // PRD-29.9 · default 强制 mock
  const generated: Step4Result = generateMockResult();
  const canBulkActions = !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    setIsLocalGenerating(true);
    save({ platform, followerCount, goal, personalInfo });
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

  function handleFeedbackUp() { toast.success('感谢反馈!'); }
  function handleFeedbackDown() { toast.info('我们会持续改进'); }
  function handleNextStep() { toast.info('变现路径功能开发中'); }
  function handleViewIpPlan() { toast.info('IP 方案查看功能开发中'); }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* 1. Header · breadcrumb + H1 + subtitle(不含 toolbar · form 上方) */}
      <header className="space-y-3">
        <p className="text-xs font-semibold text-primary tracking-wide">
          STEP 04 › 制定执行计划
        </p>
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          🗺️ {STEP4_H1}
        </h1>
        <p className="text-sm text-muted-foreground">
          {STEP4_SUBTITLE_TEMPLATE.replace('{industry}', industry)}
        </p>
      </header>

      {/* 2. Form · 选择平台 + 粉丝量 + 目标 + 个人信息 + main CTA */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-card/30 border border-border/40 rounded-lg p-6">
        {/* 选择平台 (required *) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">
            选择平台 <span className="text-rose-400">*</span>
          </label>
          <PlatformRadioGroup value={platform} onChange={setPlatform} />
        </div>

        {/* 2 col grid: 当前粉丝量 + 目标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              当前粉丝量 <span className="text-xs text-muted-foreground font-normal">（可选）</span>
            </label>
            <Input value={followerCount} onChange={(e) => setFollowerCount(e.target.value)} placeholder="如：0 / 500 / 1万 / 10万" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              目标 <span className="text-xs text-muted-foreground font-normal">（可选）</span>
            </label>
            <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="如：3个月涨粉1万、月入5万" />
          </div>
        </div>

        {/* 个人信息 (optional) textarea */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">
            个人信息 <span className="text-xs text-muted-foreground font-normal">（可选）</span>
          </label>
          <textarea
            value={personalInfo}
            onChange={(e) => setPersonalInfo(e.target.value)}
            className="w-full min-h-[200px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
          />
        </div>

        {/* Main CTA */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90"
        >
          🚀 {STEP4_BUTTON_GENERATE}
        </Button>
      </form>

      {/* 3. Loading state */}
      {isLoading && <Step3LoadingState />}

      {/* 4. Output area: H2 + toolbar */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
          🗺️ 你的专属执行计划
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleOptimize}>
            ✨ 智能优化
          </Button>
          <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleRegenerateAll}>
            ⟳ 重新生成
          </Button>
          <Button variant="outline" size="icon" disabled={!canBulkActions} onClick={handleCopyAll} aria-label="复制全部">
            📋
          </Button>
        </div>
      </div>

      {/* 5. Overview */}
      <Step4OverviewSection overview={generated.overview} />

      {/* 6. 3 Phases */}
      {generated.phases.map((phase) => (
        <Step4PhaseSection key={phase.number} phase={phase} />
      ))}

      {/* 7. Daily Schedule */}
      <Step4DailyScheduleSection schedule={generated.dailySchedule} />

      {/* 8. Warnings */}
      <Step4WarningSection warnings={generated.warnings} />

      {/* 9. Success Criteria */}
      <Step4SuccessCriteriaSection criteria={generated.successCriteria} />

      {/* 10. Footer */}
      <Step4FooterAction
        onNextStep={handleNextStep}
        onViewIpPlan={handleViewIpPlan}
      />
    </main>
  );
}
```

---

## 7 · step4.ts 常量补充

在 `apps/web/src/lib/constants/step4.ts` 末尾追加(不删原有 · 老 STEP4_OUTPUT_H3_3 + STEP4_INPUTS_3 留 @deprecated):

```typescript
// ─── PRD-29.9 · 真实字面(根据 sally zhao /step/4 demo 截图)─────────
// 旧 STEP4_OUTPUT_H3_3 / STEP4_INPUTS_3 是 PRD-22 历史 schema · 跟实际 aiipznt 不符 · 保留 @deprecated
// 实际 aiipznt sally /step/4 输出 · form 4 字段 + 6 output sub-component

// 顶部 breadcrumb + H1
export const STEP4_BREADCRUMB_REAL = 'STEP 04 › 制定执行计划' as const;
export const STEP4_H1_REAL = '执行计划' as const;
export const STEP4_OUTPUT_H2 = '你的专属执行计划' as const;

// CTA 字面
export const STEP4_CTA_GENERATE = '生成执行计划' as const;
export const STEP4_CTA_BULK_OPTIMIZE = '智能优化' as const;
export const STEP4_CTA_BULK_REGENERATE = '重新生成' as const;  // 注意: 不是"一键重新生成"
export const STEP4_CTA_BULK_COPY = '复制全部' as const;

// footer
export const STEP4_FOOTER_FEEDBACK_QUESTION = '这个结果对你有帮助吗？' as const;
export const STEP4_FOOTER_COMPLETION_TITLE = '执行计划 已完成 🎉' as const;
export const STEP4_FOOTER_COMPLETION_DESC = '分析结果已保存。建议继续下一步「变现路径」，让AI为你生成更精准的方案。' as const;
export const STEP4_FOOTER_BUTTON_NEXT = '继续下一步：变现路径 >' as const;
export const STEP4_FOOTER_BUTTON_VIEW_IP = '查看我的IP方案' as const;

// 总览 5 字段 label
export const STEP4_OVERVIEW_LABELS = {
  currentStage: '当前阶段',
  coreGoal: '核心目标',
  timeline: '总体时间线',
  mainPlatform: '主攻平台',
  coreAdvantages: '核心优势',
} as const;
```

---

## 8 · 文件输出 list(共 8 文件)

| # | path | 操作 | 行数估 |
|:-:|---|:-:|:-:|
| 1 | `apps/web/src/lib/constants/step4.ts` | Edit(末尾追加 ~25 行) | +25 |
| 2 | `apps/web/src/components/step4/Step4OverviewSection.tsx` | new | ~60 |
| 3 | `apps/web/src/components/step4/Step4PhaseSection.tsx` | new | ~150 |
| 4 | `apps/web/src/components/step4/Step4DailyScheduleSection.tsx` | new | ~80 |
| 5 | `apps/web/src/components/step4/Step4WarningSection.tsx` | new | ~65 |
| 6 | `apps/web/src/components/step4/Step4SuccessCriteriaSection.tsx` | new | ~55 |
| 7 | `apps/web/src/components/step4/Step4FooterAction.tsx` | new | ~60 |
| 8 | `apps/web/src/pages/step/Step4.tsx` | rewrite(完全替换 199 行 · 含 mock 600+ 行) | ~900 |

**不动**:
- router.tsx
- 旧 STEP4_OUTPUT_H3_3 / STEP4_INPUTS_3 等常量
- 其他 page

---

## 9 · 验收

1. **typecheck** · `cd apps/web && pnpm typecheck` · 0 error
2. **dev server 已启** · http://localhost:5173/step/4 可访问
3. **innerText 关键字 grep** · 预期至少 80 关键字命中(Opus 阶段做)

---

## 10 · Sonnet 工作流程

1. **必读参考组件**:
   ```
   Read apps/web/src/components/step3b/CoreIdentitySection.tsx
   Read apps/web/src/components/step3b/RoadmapSection.tsx
   Read apps/web/src/components/step3/OverallStrategySection.tsx
   Read apps/web/src/components/ui/sub-card.tsx
   Read apps/web/src/components/icons/aiipznt-icons.tsx
   ```

2. **Edit step4.ts 末尾追加新常量**(不动旧)

3. **Write 6 sub-component**(严格按 §5 规格)

4. **Write Step4.tsx 完全重写**(含 §2/§3/§4 interface + DEFAULT_FORM 逐字 + generateMockResult 逐字)
   - **mock 字段量极大** · 必须逐字 copy from §4 · 一个字符都不能改

5. **跑 typecheck**:
   ```
   cd apps/web && pnpm typecheck
   ```
   遇 error 自己 fix。

6. **报告**:
   ```
   DONE / BLOCKED / NEEDS_CONTEXT
   写了 X 个文件: ...
   typecheck: PASS / FAIL
   异常: ...
   下一步建议 Opus 做的事: ...
   ```

---

## 11 · 红线(违反 = 任务失败)

- ❌ 不允许动 router.tsx
- ❌ 不允许删 step4.ts 旧 STEP4_OUTPUT_H3_3 / STEP4_INPUTS_3(留 @deprecated)
- ❌ 不允许概括 / 缩短 / 改写 §3 form 默认值或 §4 mock data 任何字符
- ❌ 不允许引入新 npm 依赖
- ❌ 不允许动 /step/3 /step/3b 已有组件
- ❌ toolbar 必须 3 button · "重新生成"(注意不是"一键重新生成")
- ❌ 不允许 emoji 替换(🗺️ 📌 🟡 📋 🎯 📝 📊 ☀️ ☁️ 🌙 ⚠️ 🎉 · 全部保留 source)
- ❌ 不允许尝试启 dev server / 跑 visual screenshot

---

## 12 · 报告格式(同 step3b)

```
DONE / BLOCKED / NEEDS_CONTEXT

写了 X 个文件:
- path/to/file1 (XXX 行)

typecheck: PASS / FAIL(贴 error)

异常: ...

下一步建议 Opus 做的事:
- visual screenshot /step/4
- 字面 grep 80 key
- 用户 review 红框补丁
```
