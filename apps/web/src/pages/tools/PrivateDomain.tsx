/**
 * PrivateDomain.tsx — /private-domain 私域成交流程 · 先锋白标准重构
 * 照抄 Step3/Step8 手法 · 逻辑零改动 · 只换皮 + 加可视化
 */

import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';

// ── types ─────────────────────────────────────────────────────────────────────

interface PrivateDomainResult {
  trafficScripts: {
    shortVideo: string[];
    commentInteraction: string[];
    dmGuidance: string[];
  };
  momentsScripts: {
    grass: string[];
    trust: string[];
    closing: string[];
    fission: string[];
  };
  salesScripts: {
    firstConsult: string[];
    objectionHandling: Array<{ objection: string; response: string }>;
    pushOrder: string[];
    afterSales: string[];
  };
  sop: Array<{
    day: string;
    title: string;
    goal: string;
    desc: string;
  }>;
  keyMetrics: string[];
}

interface PrivateDomainFormData {
  productName: string;
  targetUser: string;
  scenario: string;
}

// ── constants ─────────────────────────────────────────────────────────────────

const DEFAULT_FORM: PrivateDomainFormData = {
  productName: '护肤套装',
  targetUser: '25-35宝妈',
  scenario: '客户看了朋友圈后主动咨询、老客户3个月没复购',
};

const SCENARIOS = [
  { id: 'welcome',    name: '欢迎话术', subtitle: '新好友添加后的第一印象话术',       icon: 'waving_hand' },
  { id: 'icebreaker', name: '破冰暖场', subtitle: '快速拉近距离，降低客户戒备',        icon: 'forum' },
  { id: 'trust',      name: '信任建立', subtitle: '通过专业度和真诚建立深度信任',       icon: 'verified_user' },
  { id: 'discovery',  name: '需求挖掘', subtitle: '深入了解客户痛点和需求',             icon: 'search' },
  { id: 'closing',    name: '成交话术', subtitle: '把握时机促成订单转化',               icon: 'redeem' },
  { id: 'followup',   name: '售后跟进', subtitle: '提升满意度，引导复购和转介绍',       icon: 'groups' },
] as const;

type PrivateDomainScenarioId = (typeof SCENARIOS)[number]['id'];

// ── mock data ─────────────────────────────────────────────────────────────────

function generateMockResult(): PrivateDomainResult {
  return {
    trafficScripts: {
      shortVideo: [
        '25岁后皮肤开始走下坡路？别慌，我用这套搞定细纹暗沉，素颜也敢出门。',
        '带娃熬夜脸垮了？3步焕亮秘籍，让你重回少女肌，老公都夸你变美了。',
        '还在花冤枉钱买大牌？这套平价好物，效果不输千元，真实反馈看评论区。',
      ],
      commentInteraction: [
        '想知道我素颜秘诀？点击主页，免费领【宝妈专属护肤手册】。',
        '皮肤暗沉、毛孔粗大？私信我，免费诊断皮肤问题，送你定制方案。',
        '想了解产品细节？加我微信，一对一解答，还有专属优惠等你。',
      ],
      dmGuidance: [
        '你好，很高兴你对护肤感兴趣。我是你的专属护肤顾问，有什么皮肤问题想解决吗？',
        '宝妈护肤不易，我为你准备了一份【高效护肤小技巧】，点击链接领取：[链接]',
        '为了更好地帮助你，可以简单描述下你的皮肤状况和主要困扰吗？',
      ],
    },

    momentsScripts: {
      grass: [
        '【干货】熬夜带娃皮肤差？这3个护肤误区，你踩雷了吗？正确方法让你事半功倍。',
        '【日常】忙碌一天，睡前给自己10分钟，享受护肤的仪式感，皮肤真的会爱上你。',
        '【好物分享】最近皮肤状态超好，全靠这套XX护肤品，细腻透亮，素颜自信出门。',
      ],
      trust: [
        '【客户反馈】@小雅妈妈：用了XX套装，痘印淡了，皮肤也水润了，真的推荐！',
        '【对比图】真实用户使用XX套装前后对比，皮肤光泽度提升，细纹明显改善。',
        '【专业解析】XX套装核心成分解析：[成分A]抗氧化，[成分B]深层补水，科学有效。',
      ],
      closing: [
        '【限时福利】XX套装，原价999，今天下单立减200，再送价值199的XX面膜！仅限前10名。',
        '【算账法】每天不到10块钱，就能拥有专业级护肤体验，告别皮肤困扰，这笔账怎么算都划算。',
      ],
      fission: [
        '【福利升级】成功推荐1位好友购买XX套装，你和好友各得XX赠品！多推多得。',
        '【社群活动】邀请3位宝妈进群，免费领取【XX护肤体验装】，还有护肤专家在线答疑。',
      ],
    },

    salesScripts: {
      firstConsult: [
        '（客户咨询朋友圈产品）你好，很高兴你对XX护肤套装感兴趣。这款套装专为25-35岁宝妈设计，能有效解决熬夜、压力导致的皮肤暗沉、干燥、细纹等问题。你目前主要想改善哪些方面呢？',
        '（老客户3个月未复购）[客户昵称]你好，我是你的专属护肤顾问。最近皮肤还好吗？上次你用的XX套装效果怎么样？我们最近上新了XX新品，或者XX套装有升级版，想给你推荐下。',
      ],
      objectionHandling: [
        {
          objection: '客户说：价格太贵了',
          response: '我理解你的顾虑。你算算，如果去美容院做一次护理至少要几百块，这套XX套装可以用2-3个月，平均每天不到10块钱。它能从根源改善你的皮肤问题，长期看比频繁去美容院更划算，效果也更持久。而且我们现在有活动，还能省下不少。',
        },
        {
          objection: '客户说：没时间护肤/太麻烦',
          response: '我懂你，宝妈时间确实紧张。这套XX套装设计得很精简，只需要早晚3分钟，就能完成基础护理。我们还附赠了【懒人护肤攻略】，教你如何高效利用碎片时间，效果一点不打折。你试试看，真的不费力。',
        },
        {
          objection: '客户说：担心没效果/过敏',
          response: '你的担心很有道理。我们产品成分都很温和，经过严格测试。如果你实在不放心，可以先申请小样试用，或者我们提供【30天无理由退款】服务，只要你不满意，全额退款。这样你没有任何风险，可以安心尝试。',
        },
      ],
      pushOrder: [
        '这款XX套装的优惠活动只到今晚12点，之后就恢复原价了。现在下单，不仅能省200元，还送价值199的面膜，错过真的可惜。',
        '我们这个月的XX套装库存不多了，目前只剩最后5套。很多宝妈都在抢，如果你想改善皮肤，建议尽快下单，以免断货。',
        '已经有3000多位宝妈通过XX套装改善了皮肤问题，效果都非常好。现在下单，我们还会赠送你一份【定制护肤方案】，帮你更快达成目标。',
      ],
      afterSales: [
        '（成交后）恭喜你做出正确的选择！你的XX套装已经发出，预计X天送达。收到后有任何使用问题，随时联系我，我会全程指导你。',
        '（使用一周后）[客户昵称]你好，XX套装用得怎么样？有没有觉得皮肤更水润了？有什么需要调整的，告诉我哦。',
        '（使用一月后）[客户昵称]你好，你的皮肤状态有明显改善吗？我这里有一些更进阶的护肤小技巧，想分享给你，让效果更好。',
      ],
    },

    sop: [
      {
        day: 'Day 1',
        title: '客户主动咨询/老客户触达',
        goal: '建立初步信任，获取客户信息和需求',
        desc: '（客户咨询）发送欢迎语，了解客户皮肤问题和需求；（老客户）发送关怀语，询问近况，引出产品升级/新品。',
      },
      {
        day: 'Day 1-2',
        title: '提供初步解决方案/产品介绍',
        goal: '激发客户兴趣，展示产品价值',
        desc: '根据客户需求，推荐XX套装，介绍核心成分和功效，结合客户痛点进行说明。提供【宝妈专属护肤手册】作为引流钩子。',
      },
      {
        day: 'Day 2-3',
        title: '朋友圈内容辅助/解答疑问',
        goal: '增强客户信任，消除购买顾虑',
        desc: '朋友圈发布XX套装的客户见证、干货知识（如：宝妈如何高效护肤），私聊解答客户关于产品、价格、效果的疑问。',
      },
      {
        day: 'Day 3-4',
        title: '促单/逼单',
        goal: '引导客户完成购买',
        desc: '利用稀缺性、紧迫感、从众心理等话术促单。提供限时优惠、赠品、无风险承诺（如：30天无理由退款）。',
      },
      {
        day: 'Day 5-7',
        title: '售后服务/建立长期关系',
        goal: '提升客户满意度，为复购和转介绍做铺垫',
        desc: '发货通知，使用指导。定期关怀客户使用情况，解答疑问，分享更多护肤知识。邀请客户加入专属宝妈护肤社群。',
      },
    ],

    keyMetrics: [
      '私域好友添加率',
      '咨询转化率',
      '老客户复购率',
      '客单价',
      '客户好评率',
    ],
  };
}

// ── KPI representative values ─────────────────────────────────────────────────

const KPI_META = [
  { label: '好友添加率', value: '32%', num: 32, icon: 'person_add', accent: '#002fa7' },
  { label: '咨询转化率', value: '18%', num: 18, icon: 'chat', accent: '#781621' },
  { label: '复购率',     value: '45%', num: 45, icon: 'autorenew', accent: '#F6D300' },
  { label: '客户好评率', value: '96%',   num: 96, icon: 'star_rate', accent: '#002fa7' },
];

// ── helper ────────────────────────────────────────────────────────────────────

function copyText(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success('已复制'))
    .catch(() => toast.error('复制失败'));
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function PrivateDomain() {
  const [activeScenario, setActiveScenario] = useState<PrivateDomainScenarioId>('welcome');
  const [productName, setProductName] = useState(DEFAULT_FORM.productName);
  const [targetUser, setTargetUser] = useState(DEFAULT_FORM.targetUser);
  const [scenario, setScenario] = useState(DEFAULT_FORM.scenario);

  const generated = generateMockResult();
  const currentScenario = SCENARIOS.find((s) => s.id === activeScenario) ?? SCENARIOS[0];

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productName.trim()) return;
    toast.success('已生成话术');
  }

  function handleCopyAll() {
    const text = JSON.stringify(generated, null, 2);
    navigator.clipboard.writeText(text).then(() => toast.success('已复制全部话术')).catch(() => toast.error('复制失败'));
  }

  function handleFeedbackUp() {
    toast.success('感谢反馈！');
  }

  function handleFeedbackDown() {
    toast.info('我们会持续改进');
  }

  function handleOptimize() {
    toast.success('已智能优化');
  }

  function handleExport() {
    navigator.clipboard
      .writeText(JSON.stringify(generated, null, 2))
      .then(() => toast.success('已导出话术'))
      .catch(() => toast.error('导出失败'));
  }

  const btnSecondary =
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

  // ── radar data ──────────────────────────────────────────────────────────────
  const radarDims = [
    { label: '引流获客', value: 72, color: '#002fa7' },
    { label: '破冰建联', value: 80, color: '#781621' },
    { label: '信任建立', value: 88, color: '#F6D300' },
    { label: '需求洞察', value: 76, color: '#002fa7' },
    { label: '成交转化', value: 65, color: '#781621' },
    { label: '复购裂变', value: 70, color: '#F6D300' },
  ];

  const cx = 130;
  const cy = 122;
  const R = 88;
  const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
  const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const poly = (r: number) => radarDims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
  const dataPoly = radarDims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');

  // ── trend chart data ────────────────────────────────────────────────────────
  const trendData = [12, 20, 18, 30, 38, 35, 50, 62, 58, 74, 82, 100];
  const funnelLabels = ['引流', '建联', '信任', '需求', '成交', '复购'];
  const trendW = 560;
  const trendH = 168;
  const trendPadL = 6;
  const trendPadR = 6;
  const trendPadT = 12;
  const trendPadB = 8;
  const trendInnerW = trendW - trendPadL - trendPadR;
  const trendInnerH = trendH - trendPadT - trendPadB;
  const trendMax = 110;
  const tx = (i: number) => trendPadL + (trendInnerW * i) / (trendData.length - 1);
  const ty = (v: number) => trendPadT + trendInnerH * (1 - v / trendMax);
  const trendLine = trendData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${tx(i).toFixed(1)} ${ty(v).toFixed(1)}`).join(' ');
  const trendArea = `${trendLine} L ${tx(trendData.length - 1).toFixed(1)} ${(trendPadT + trendInnerH).toFixed(1)} L ${tx(0).toFixed(1)} ${(trendPadT + trendInnerH).toFixed(1)} Z`;

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              成交链路
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              话术库
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tight text-[#1b1b1b]">
            私域成交流程
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            覆盖从加好友到成交复购的全链路话术，让私域转化率翻倍。欢迎话术、破冰暖场、信任建立、需求挖掘、成交促单、售后复购，六大场景一次生成。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button type="button" onClick={handleOptimize} className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_fix_high</span>
            智能优化
          </button>
          <button type="button" onClick={handleCopyAll} className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
            复制全部话术
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
            导出
          </button>
        </div>
      </header>

      {/* ── 场景选择(6 tile 卡) ──────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">category</span>
          <h2 className="text-[16px] font-bold text-[#111827]">选择场景</h2>
          <span className="text-[12px] text-[#9ca3af]">· 当前：{currentScenario.name}</span>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {SCENARIOS.map((s) => {
            const active = activeScenario === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScenario(s.id)}
                className={`group relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border p-4 text-center transition-all ${active ? 'border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm' : 'border-[#e5e7eb] bg-white hover:border-[#c7d2fe] hover:bg-[#f8faff]'}`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-sm transition-colors ${active ? 'bg-[#002fa7] text-white' : 'bg-[#f1f3f9] text-[#6b7280] group-hover:bg-[#dbe2ff] group-hover:text-[#002fa7]'}`}
                >
                  <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{s.icon}</span>
                </span>
                <span className="block text-[13px] font-bold text-[#111827]">{s.name}</span>
                <span className="block text-[10px] leading-tight text-[#9ca3af]">{s.subtitle}</span>
                <span
                  className={`absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full transition-all ${active ? 'bg-[#002fa7] text-white' : 'border border-[#e5e7eb] bg-white text-transparent'}`}
                >
                  <span className="material-symbols-outlined text-[12px]" aria-hidden="true">check</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 输入卡 ──────────────────────────────────────────── */}
      <section className="relative mb-12 overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />
        <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined" aria-hidden="true">tune</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">话术参数</h2>
              <p className="text-[12px] text-[#9ca3af]">填写产品与用户信息 · AI 据此生成全链路话术</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            参数就绪
          </span>
        </div>
        <div className="relative">
          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="grid grid-cols-2 gap-6">
              {/* 产品名称 */}
              <div>
                <label htmlFor="pd-product-name" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                  产品/服务名称
                  <span className="ml-1 text-[#781621]">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" aria-hidden="true">inventory_2</span>
                  <input
                    id="pd-product-name"
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="例如：护肤套装"
                    required
                    className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                  />
                </div>
              </div>
              {/* 目标用户 */}
              <div>
                <label htmlFor="pd-target-user" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                  目标用户
                  <span className="ml-2 text-[11px] font-normal text-[#9ca3af]">（选填）</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" aria-hidden="true">groups</span>
                  <input
                    id="pd-target-user"
                    type="text"
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    placeholder="例如：25-35宝妈"
                    className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                  />
                </div>
              </div>
            </div>
            {/* 具体场景 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="pd-scenario" className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                  具体场景
                  <span className="ml-2 text-[11px] font-normal text-[#9ca3af]">（选填）</span>
                </label>
                <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                  <span className="material-symbols-outlined text-[14px] text-[#781621]" aria-hidden="true">auto_awesome</span>
                  AI 据此生成精准话术
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
                <textarea
                  id="pd-scenario"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  rows={4}
                  placeholder="描述具体场景，例如：客户看了朋友圈主动咨询、老客户3个月没复购"
                  className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                />
                <div className="flex items-center justify-between border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-[#9ca3af]">可描述</span>
                    {['触达时机', '客户类型', '主要痛点', '期望结果'].map((t) => (
                      <span key={t} className="rounded-full bg-[#f1f3f9] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7280]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]">{scenario.length} 字</span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={!productName.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
                  生成全链路话术
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── 数据洞察 band ─────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">insights</span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 实时测算</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 私域转化力雷达 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">私域转化力雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">75</p>
              <p className="text-[10px] text-[#9ca3af]">综合分</p>
            </div>
          </div>
          <svg viewBox="0 0 260 244" className="w-full">
            <defs>
              <linearGradient id="radarFillPD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
            ))}
            {radarDims.map((_, i) => {
              const [x, y] = pt(i, R);
              return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
            })}
            <polygon points={dataPoly} fill="url(#radarFillPD)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
            {radarDims.map((d, i) => {
              const [x, y] = pt(i, R * (d.value / 100));
              return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
            })}
            {radarDims.map((d, i) => {
              const [x, y] = pt(i, R + 16);
              return (
                <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                  {d.label}
                </text>
              );
            })}
          </svg>
          <div className="mt-2 grid grid-cols-3 gap-y-2">
            {radarDims.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 成交转化漏斗 / 复购曲线 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">成交转化漏斗 / 复购曲线</h3>
                <p className="text-[11px] text-[#9ca3af]">按当前链路参数测算</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['成交', '复购', '裂变'].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-[#002fa7] text-white' : 'bg-[#f1f3f9] text-[#6b7280]'}`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none text-[#111827]">45%</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">trending_up</span>+28%
            </span>
            <span className="mb-1 text-[12px] text-[#9ca3af]">较行业基线</span>
          </div>
          <svg viewBox={`0 0 ${trendW} ${trendH}`} className="w-full">
            <defs>
              <linearGradient id="trendFillPD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="trendLinePD" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#002fa7" />
                <stop offset="100%" stopColor="#781621" />
              </linearGradient>
            </defs>
            {[0, 0.33, 0.66, 1].map((f) => (
              <line
                key={f}
                x1={trendPadL}
                x2={trendW - trendPadR}
                y1={(trendPadT + trendInnerH * f).toFixed(1)}
                y2={(trendPadT + trendInnerH * f).toFixed(1)}
                stroke="#f1f3f9"
                strokeWidth="1"
              />
            ))}
            <path d={trendArea} fill="url(#trendFillPD)" />
            <path d={trendLine} fill="none" stroke="url(#trendLinePD)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {trendData.map((v, i) =>
              i % 2 === 0 ? <circle key={i} cx={tx(i)} cy={ty(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" /> : null,
            )}
          </svg>
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
            {funnelLabels.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI 卡一排 ───────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {KPI_META.map((k, idx) => {
          const borderColors = ['border-[#e0e7ff]', 'border-[#e5e7eb]', 'border-[#F3E08A]', 'border-[#e0e7ff]'];
          const bgColors = ['from-white to-[#f3f6ff]', 'bg-white', 'from-white to-[#fffbeb]', 'from-white to-[#f3f6ff]'];
          const iconBgs = ['bg-[#002fa7]/10 text-[#002fa7]', 'bg-[#781621]/10 text-[#781621]', 'bg-[#F6D300]/20 text-[#221b00]', 'bg-[#002fa7]/10 text-[#002fa7]'];
          const badgeColors = [
            'bg-[#10b981]/10 text-[#10b981]',
            'bg-[#781621]/10 text-[#781621]',
            'bg-[#fdf6cc] text-[#221b00]',
            'bg-[#002fa7]/10 text-[#002fa7]',
          ];
          const badges = ['+12%', '已优化', '持续增长', '+8%'];
          return (
            <div
              key={k.label}
              className={`rounded-xl border ${borderColors[idx]} bg-gradient-to-br ${bgColors[idx]} p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBgs[idx]}`}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{k.icon}</span>
                </span>
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeColors[idx]}`}>
                  {idx === 0 || idx === 3 ? (
                    <span className="material-symbols-outlined text-[13px]" aria-hidden="true">trending_up</span>
                  ) : null}
                  {badges[idx]}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-bold leading-none text-[#111827]">{k.value}</p>
                  <p className="mt-1.5 text-[12px] text-[#6b7280]">{k.label}</p>
                </div>
                <div className="h-12 w-12 shrink-0">
                  <svg viewBox="0 0 36 36" className="-rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={k.accent}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${k.num} 100`}
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 结果区 ───────────────────────────────────────────── */}
      <div className="space-y-6">

        {/* 引流话术 trafficScripts */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[#111827]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">campaign</span>
              </span>
              引流话术
            </h3>
            <span className="rounded-full bg-[#002fa7]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#002fa7]">
              Traffic Scripts
            </span>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {/* 短视频引流 */}
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-[#111827] before:h-3 before:w-1 before:rounded-full before:bg-[#002fa7] before:content-['']">
                短视频引流
              </p>
              <div className="space-y-2">
                {generated.trafficScripts.shortVideo.map((s, i) => (
                  <div key={i} className="group flex items-start gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 transition-colors hover:border-[#002fa7] hover:bg-white">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#002fa7] text-[10px] font-bold text-white">{i + 1}</span>
                    <p className="flex-1 text-[13px] leading-relaxed text-[#444653]">{s}</p>
                    <button
                      type="button"
                      onClick={() => copyText(s)}
                      aria-label="复制话术"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#9ca3af] hover:text-[#002fa7]" aria-hidden="true">content_copy</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* 评论互动 */}
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-[#111827] before:h-3 before:w-1 before:rounded-full before:bg-[#781621] before:content-['']">
                评论互动引流
              </p>
              <div className="space-y-2">
                {generated.trafficScripts.commentInteraction.map((s, i) => (
                  <div key={i} className="group flex items-start gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 transition-colors hover:border-[#781621] hover:bg-white">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#781621] text-[10px] font-bold text-white">{i + 1}</span>
                    <p className="flex-1 text-[13px] leading-relaxed text-[#444653]">{s}</p>
                    <button
                      type="button"
                      onClick={() => copyText(s)}
                      aria-label="复制话术"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#9ca3af] hover:text-[#781621]" aria-hidden="true">content_copy</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* 私信引导 */}
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-[#111827] before:h-3 before:w-1 before:rounded-full before:bg-[#221b00] before:content-['']">
                私信引导话术
              </p>
              <div className="space-y-2">
                {generated.trafficScripts.dmGuidance.map((s, i) => (
                  <div key={i} className="group flex items-start gap-2 rounded-lg border border-[#F3E08A] bg-[#fdf6cc]/40 p-3 transition-colors hover:bg-[#fdf6cc]/70">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F6D300] text-[10px] font-bold text-[#221b00]">{i + 1}</span>
                    <p className="flex-1 text-[13px] leading-relaxed text-[#444653]">{s}</p>
                    <button
                      type="button"
                      onClick={() => copyText(s)}
                      aria-label="复制话术"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#9ca3af] hover:text-[#221b00]" aria-hidden="true">content_copy</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 朋友圈话术 momentsScripts */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[#111827]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">photo_album</span>
              </span>
              朋友圈话术
            </h3>
            <span className="rounded-full bg-[#781621]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#781621]">
              Moments Scripts
            </span>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {(
              [
                { key: 'grass',   label: '种草内容',  color: '#002fa7', numColor: '#fff',    items: generated.momentsScripts.grass },
                { key: 'trust',   label: '信任背书',  color: '#781621', numColor: '#fff',    items: generated.momentsScripts.trust },
                { key: 'closing', label: '促单话术',  color: '#F6D300', numColor: '#221b00', items: generated.momentsScripts.closing },
                { key: 'fission', label: '裂变钩子',  color: '#10b981', numColor: '#fff',    items: generated.momentsScripts.fission },
              ] as const
            ).map((group) => (
              <div key={group.key}>
                <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-[#111827]" style={{ '--bar-color': group.color } as React.CSSProperties}>
                  <span className="inline-block h-3 w-1 rounded-full" style={{ backgroundColor: group.color }} />
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.items.map((s, i) => (
                    <div key={i} className={`group flex items-start gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 transition-colors hover:bg-white ${group.key === 'closing' ? 'hover:border-[#F3E08A]' : 'hover:border-[#002fa7]'}`}>
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: group.color, color: group.numColor }}
                      >
                        {i + 1}
                      </span>
                      <p className="flex-1 text-[13px] leading-relaxed text-[#444653]">{s}</p>
                      <button
                        type="button"
                        onClick={() => copyText(s)}
                        aria-label="复制话术"
                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#9ca3af] hover:text-[#002fa7]" aria-hidden="true">content_copy</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 销售话术 salesScripts */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[#111827]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#221b00]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">record_voice_over</span>
              </span>
              销售话术
            </h3>
            <span className="rounded-full bg-[#F6D300]/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#221b00]">
              Sales Scripts
            </span>
          </div>
          <div className="space-y-5">
            {/* 初次咨询 */}
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-[#111827] before:h-3 before:w-1 before:rounded-full before:bg-[#002fa7] before:content-['']">
                初次咨询话术
              </p>
              <div className="space-y-2">
                {generated.salesScripts.firstConsult.map((s, i) => (
                  <div key={i} className="group flex items-start gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 transition-colors hover:border-[#002fa7] hover:bg-white">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#002fa7] text-[10px] font-bold text-white">{i + 1}</span>
                    <p className="flex-1 text-[13px] leading-relaxed text-[#444653]">{s}</p>
                    <button
                      type="button"
                      onClick={() => copyText(s)}
                      aria-label="复制话术"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#9ca3af] hover:text-[#002fa7]" aria-hidden="true">content_copy</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* 异议处理 */}
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-[#111827] before:h-3 before:w-1 before:rounded-full before:bg-[#781621] before:content-['']">
                异议处理话术
              </p>
              <div className="space-y-3">
                {generated.salesScripts.objectionHandling.map((pair, i) => (
                  <div key={i} className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] overflow-hidden">
                    <div className="flex items-start gap-2 border-b border-[#e5e7eb] bg-[#fff1f0] px-4 py-2.5">
                      <span className="material-symbols-outlined mt-0.5 text-[16px] text-[#781621]" aria-hidden="true">report_problem</span>
                      <p className="text-[13px] font-semibold text-[#781621]">{pair.objection}</p>
                    </div>
                    <div className="group flex items-start gap-2 px-4 py-3">
                      <span className="material-symbols-outlined mt-0.5 text-[16px] text-[#10b981]" aria-hidden="true">check_circle</span>
                      <p className="flex-1 text-[13px] leading-relaxed text-[#444653]">{pair.response}</p>
                      <button
                        type="button"
                        onClick={() => copyText(pair.response)}
                        aria-label="复制应答话术"
                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#9ca3af] hover:text-[#002fa7]" aria-hidden="true">content_copy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* 促单 + 售后 双列 */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-[#111827] before:h-3 before:w-1 before:rounded-full before:bg-[#221b00] before:content-['']">
                  促单/催单话术
                </p>
                <div className="space-y-2">
                  {generated.salesScripts.pushOrder.map((s, i) => (
                    <div key={i} className="group flex items-start gap-2 rounded-lg border border-[#F3E08A] bg-[#fdf6cc]/40 p-3 transition-colors hover:bg-[#fdf6cc]/70">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F6D300] text-[10px] font-bold text-[#221b00]">{i + 1}</span>
                      <p className="flex-1 text-[13px] leading-relaxed text-[#444653]">{s}</p>
                      <button
                        type="button"
                        onClick={() => copyText(s)}
                        aria-label="复制话术"
                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#9ca3af] hover:text-[#221b00]" aria-hidden="true">content_copy</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-[#111827] before:h-3 before:w-1 before:rounded-full before:bg-[#10b981] before:content-['']">
                  售后跟进话术
                </p>
                <div className="space-y-2">
                  {generated.salesScripts.afterSales.map((s, i) => (
                    <div key={i} className="group flex items-start gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 transition-colors hover:border-[#10b981] hover:bg-white">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-[10px] font-bold text-white">{i + 1}</span>
                      <p className="flex-1 text-[13px] leading-relaxed text-[#444653]">{s}</p>
                      <button
                        type="button"
                        onClick={() => copyText(s)}
                        aria-label="复制话术"
                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#9ca3af] hover:text-[#10b981]" aria-hidden="true">content_copy</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 成交 SOP · Day 时间线 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[#111827]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">timeline</span>
              </span>
              成交 SOP 时间线
            </h3>
            <span className="rounded-full bg-[#002fa7]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#002fa7]">
              {generated.sop.length} 阶段
            </span>
          </div>
          <div className="relative">
            <div className="absolute left-[22px] top-0 h-full w-0.5 bg-gradient-to-b from-[#002fa7] to-[#781621]" />
            <div className="space-y-4">
              {generated.sop.map((step, i) => (
                <div key={i} className="relative flex gap-5">
                  <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#002fa7] bg-white text-[11px] font-extrabold text-[#002fa7]">
                    {i + 1}
                  </span>
                  <div className="flex-1 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4 transition-colors hover:border-[#002fa7] hover:bg-white">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full border border-[#F3E08A] bg-[#fdf6cc] px-2.5 py-0.5 text-[11px] font-bold text-[#221b00]">
                        {step.day}
                      </span>
                      <span className="text-[15px] font-bold text-[#111827]">{step.title}</span>
                    </div>
                    <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#10b981]">
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">flag</span>
                      目标：{step.goal}
                    </p>
                    <p className="text-[13px] leading-relaxed text-[#444653]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 关键指标 keyMetrics · 全部 5 项 */}
        <div className="rounded-xl border border-[#dbe2ff] bg-gradient-to-br from-[#eff4ff] via-white to-[#f7f1ff] p-6 pw-shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[#111827]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">analytics</span>
              </span>
              关键指标
            </h3>
            <span className="rounded-full bg-[#002fa7]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#002fa7]">
              {generated.keyMetrics.length} 项
            </span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {generated.keyMetrics.map((m, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white p-4 text-center transition-colors hover:border-[#002fa7]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#002fa7] text-[14px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-[13px] font-semibold text-[#111827]">{m}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 底部反馈 ─────────────────────────────────────────── */}
      <div className="mt-10 flex items-center justify-between border-t border-[#eef1f6] pt-6">
        <div className="flex items-center gap-3">
          <p className="text-[13px] text-[#9ca3af]">这个结果对你有帮助吗？</p>
          <button
            type="button"
            onClick={handleFeedbackUp}
            aria-label="有帮助"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">thumb_up</span>
          </button>
          <button
            type="button"
            onClick={handleFeedbackDown}
            aria-label="无帮助"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white transition-colors hover:border-[#781621] hover:text-[#781621]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">thumb_down</span>
          </button>
        </div>
        <button
          type="button"
          onClick={handleCopyAll}
          className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-6 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
          复制全部话术
        </button>
      </div>
    </PioneerLayout>
  );
}
