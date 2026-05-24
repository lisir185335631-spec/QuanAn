// PRD-29.12 · Step8 直播策划 完全重写
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Step8PlanTabs, type Step8Plan, type Step8StageDetail } from '@/components/step8/Step8PlanTabs';
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step8FormData {
  productInfo: string;
  targetAudience: string;
  platform: string;
  experience: 'newbie' | 'intermediate' | 'expert';
}

interface Step8Result {
  plans: Step8Plan[];
  trafficStrategy: {
    preLive: string[];
    duringLive: string[];
    postLive: string[];
  };
  productDesign: {
    mainProduct: string;
    priceAnchor: string;
    bonus: string;
    scarcity: string;
  };
  interactionTemplates: Array<{
    scenario: string;
    script: string;
  }>;
  objectionHandling: Array<{
    objection: string;
    response: string;
  }>;
  dataOptimization: Array<{
    metric: string;
    target: string;
    advice: string;
  }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FORM: Step8FormData = {
  productInfo: '定制智能体定价：10000-100000（根据客户需求专业定制）\n针对opc创业者：自己做ip获取流量，9800线上智能体使用和19800线下高阶段培训\n技术升级项目落地培训29800，训练营',
  targetAudience: '需要定制智能体降本增效的老板和opc创业者',
  platform: 'douyin',
  experience: 'newbie',
};

const EXPERIENCE_OPTIONS = [
  { value: 'newbie' as const, label: '新手', sub: '刚开始做直播' },
  { value: 'intermediate' as const, label: '有经验', sub: '有一定直播经验' },
  { value: 'expert' as const, label: '资深', sub: '直播经验丰富' },
];

const PLATFORMS = [
  { id: 'douyin', label: '抖音' },
  { id: 'xiaohongshu', label: '小红书' },
  { id: 'shipinhao', label: '视频号' },
  { id: 'kuaishou', label: '快手' },
  { id: 'bilibili', label: 'B站' },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────

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
    ] as Step8StageDetail[],
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const currentPlan = generated.plans.find((p) => p.index === activePlan) ?? generated.plans[0]!;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    setIsLocalGenerating(true);
    save({ productInfo, targetAudience, platform, experience });
    setTimeout(() => {
      setIsLocalGenerating(false);
      toast.success('生成完成');
    }, 1200);
  }

  function handleRegenerateAll() {
    if (!isLoading) {
      setIsLocalGenerating(true);
      setTimeout(() => {
        setIsLocalGenerating(false);
        toast.success('已重新生成');
      }, 1200);
    }
  }

  function handleCopyAll() {
    navigator.clipboard
      .writeText(JSON.stringify(generated, null, 2))
      .then(() => toast.success('已复制全部'));
  }

  function handleOptimize() {
    if (canBulkActions) toast.success('已智能优化');
  }

  function handleCopyPlan() {
    navigator.clipboard
      .writeText(JSON.stringify(currentPlan, null, 2))
      .then(() => toast.success(`已复制方案 ${activePlan}`));
  }

  function handleViewIpPlan() {
    toast.info('IP 方案查看功能开发中');
  }

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
              产品/服务信息{' '}
              <span className="text-xs text-muted-foreground font-normal">（可选）</span>
            </label>
            <textarea
              value={productInfo}
              onChange={(e) => setProductInfo(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              目标受众{' '}
              <span className="text-xs text-muted-foreground font-normal">（可选）</span>
            </label>
            <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
          </div>
        </div>

        {/* 平台 5 chip */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">直播平台</label>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={
                  'px-4 py-1.5 rounded border text-sm transition-colors ' +
                  (platform === p.id
                    ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                    : 'border-border/40 text-muted-foreground hover:text-on-surface')
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 经验 3 chip */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">直播经验</label>
          <div className="flex gap-2 flex-wrap">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExperience(opt.value)}
                className={
                  'px-4 py-1.5 rounded border text-sm transition-colors ' +
                  (experience === opt.value
                    ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                    : 'border-border/40 text-muted-foreground hover:text-on-surface')
                }
              >
                {opt.label}{' '}
                <span className="text-xs opacity-70">· {opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90">
          ✨ 生成直播方案
        </Button>
      </form>

      {isLoading && <Step3LoadingState />}

      {/* Output area header · toolbar(重新生成在前) */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
          🎙 直播方案（共3套）
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleRegenerateAll}>
            ⟳ 重新生成
          </Button>
          <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleOptimize}>
            ✨ 智能优化
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={!canBulkActions}
            onClick={handleCopyAll}
            aria-label="复制全部"
          >
            📋
          </Button>
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
        <Button
          variant="default"
          size="sm"
          onClick={handleViewIpPlan}
          className="bg-primary hover:bg-primary/90"
        >
          查看我的IP方案 ›
        </Button>
      </div>
    </main>
  );
}
