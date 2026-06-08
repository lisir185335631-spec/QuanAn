/**
 * PrivateDomain.tsx — /private-domain 私域成交流程
 * 液态玻璃皮(LiquidShell)· 业务逻辑/状态/testid 零改动
 */

import { type FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { C, F, Item, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import { LiquidShell } from '@/components/home-next/LiquidShell';

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
  { label: '好友添加率', value: '32%', num: 32, icon: 'person_add',  accent: C.ikb },
  { label: '咨询转化率', value: '18%', num: 18, icon: 'chat',        accent: C.yellow },
  { label: '复购率',     value: '45%', num: 45, icon: 'autorenew',   accent: C.accent3 },
  { label: '客户好评率', value: '96%', num: 96, icon: 'star_rate',   accent: C.ikb },
];

// ── helper ────────────────────────────────────────────────────────────────────

function copyText(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success('已复制'))
    .catch(() => toast.error('复制失败'));
}

// ── glass script item ─────────────────────────────────────────────────────────

function ScriptItem({ text, onCopy, accent }: { text: string; onCopy: () => void; accent: string }) {
  return (
    <motion.div
      className="lg-glass"
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <span
        style={{
          marginTop: 2,
          display: 'flex',
          height: 20,
          width: 20,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: accent,
          fontSize: 10,
          fontWeight: 800,
          color: '#081430',
          fontFamily: F.mono,
        }}
      >
        ·
      </span>
      <p style={{ flex: 1, fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.82)', fontFamily: F.cn }}>
        {text}
      </p>
      <button
        type="button"
        onClick={onCopy}
        aria-label="复制"
        style={{
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: 'rgba(255,255,255,0.45)',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)'; }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>content_copy</span>
      </button>
    </motion.div>
  );
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

  // ── radar data ──────────────────────────────────────────────────────────────
  const radarDims = [
    { label: '引流获客', value: 72, color: C.ikb },
    { label: '破冰建联', value: 80, color: C.yellow },
    { label: '信任建立', value: 88, color: C.accent3 },
    { label: '需求洞察', value: 76, color: C.ikb },
    { label: '成交转化', value: 65, color: C.yellow },
    { label: '复购裂变', value: 70, color: C.accent3 },
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
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <Reveal>
        <header style={{ marginBottom: 48, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ flexShrink: 0 }}>
            {/* chip 标签行 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ink,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                成交链路
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid rgba(168,197,224,0.55)`,
                  background: 'rgba(168,197,224,0.18)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                话术库
              </span>
            </div>
            {/* 主标题 — 冷蓝渐变字 */}
            <h1
              style={{
                whiteSpace: 'nowrap',
                fontSize: 44,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: F.display,
                margin: 0,
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                textShadow: 'none',
              }}
            >
              私域成交流程
            </h1>
            <p
              style={{
                marginTop: 10,
                maxWidth: 820,
                fontSize: 16,
                lineHeight: 1.6,
                color: C.burgundyText,
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              覆盖从加好友到成交复购的全链路话术，让私域转化率翻倍。欢迎话术、破冰暖场、信任建立、需求挖掘、成交促单、售后复购，六大场景一次生成。
            </p>
          </div>
          {/* 操作按钮 */}
          <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'nowrap', gap: 12 }}>
            <motion.button
              type="button"
              onClick={handleOptimize}
              aria-label="智能优化"
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.ink,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>auto_fix_high</span>
              智能优化
            </motion.button>
            <motion.button
              type="button"
              onClick={handleCopyAll}
              aria-label="复制全部话术"
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.ink,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>content_copy</span>
              复制全部话术
            </motion.button>
            <motion.button
              type="button"
              onClick={handleExport}
              aria-label="导出"
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 12,
                padding: '10px 20px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#081430',
                background: C.ikb,
                border: 'none',
                cursor: 'pointer',
                fontFamily: F.mono,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>download</span>
              导出
            </motion.button>
          </div>
        </header>
      </Reveal>

      {/* ── 场景选择(6 tile 卡) ──────────────────────────────── */}
      <RevealGroup style={{ marginBottom: 40 }}>
        <div role="radiogroup" aria-label="选择话术场景">
          <Reveal style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>category</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>选择场景</h2>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>· 当前：{currentScenario.name}</span>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {SCENARIOS.map((s) => {
              const active = activeScenario === s.id;
              return (
                <Item key={s.id}>
                  <motion.button
                    type="button"
                    onClick={() => setActiveScenario(s.id)}
                    aria-label={`选择场景：${s.name}`}
                    aria-pressed={active}
                    whileHover={{ y: -5 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    className="lg-glass"
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: 16,
                      padding: 16,
                      textAlign: 'center',
                      background: active ? 'rgba(168,197,224,0.22)' : undefined,
                      outline: active ? `1.5px solid rgba(168,197,224,0.7)` : undefined,
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        height: 44,
                        width: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: active
                          ? 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))'
                          : 'rgba(255,255,255,0.08)',
                        color: active ? C.ikb : 'rgba(255,255,255,0.55)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden={true}>{s.icon}</span>
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{s.name}</span>
                    <span style={{ fontSize: 10, lineHeight: 1.4, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>{s.subtitle}</span>
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: 8,
                          display: 'flex',
                          height: 16,
                          width: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          background: C.ikb,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#081430' }} aria-hidden={true}>check</span>
                      </span>
                    )}
                  </motion.button>
                </Item>
              );
            })}
          </div>
        </div>
      </RevealGroup>

      {/* ── 输入卡 ──────────────────────────────────────────── */}
      <Reveal>
        <section
          className="lg-glass"
          style={{ marginBottom: 48, overflow: 'hidden', borderRadius: 20, padding: 28 }}
        >
          <div
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `0.5px solid ${C.line}`,
              paddingBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'flex',
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true}>tune</span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>话术参数</h2>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>填写产品与用户信息 · AI 据此生成全链路话术</p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 9999,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(168,197,224,0.18)',
                color: C.ikb,
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
              参数就绪
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* 产品名称 */}
              <div>
                <label
                  htmlFor="pd-product-name"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                  }}
                >
                  <span style={{ display: 'inline-block', height: 14, width: 3, flexShrink: 0, borderRadius: 9999, background: C.grad }} aria-hidden={true} />
                  产品/服务名称
                  <span style={{ color: 'rgba(255,120,120,0.9)', marginLeft: 2 }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.45)', pointerEvents: 'none' }}
                    aria-hidden={true}
                  >inventory_2</span>
                  <input
                    id="pd-product-name"
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="例如：护肤套装"
                    required
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: `0.5px solid ${C.line}`,
                      background: 'rgba(255,255,255,0.07)',
                      backdropFilter: 'blur(10px)',
                      padding: '12px 14px 12px 40px',
                      fontSize: 14,
                      color: C.ink,
                      fontFamily: F.cn,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.boxShadow = `0 0 0 1.5px rgba(168,197,224,0.6)`; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.boxShadow = ''; }}
                  />
                </div>
              </div>
              {/* 目标用户 */}
              <div>
                <label
                  htmlFor="pd-target-user"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                  }}
                >
                  <span style={{ display: 'inline-block', height: 14, width: 3, flexShrink: 0, borderRadius: 9999, background: C.grad }} aria-hidden={true} />
                  目标用户
                  <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.45)' }}>（选填）</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.45)', pointerEvents: 'none' }}
                    aria-hidden={true}
                  >groups</span>
                  <input
                    id="pd-target-user"
                    type="text"
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    placeholder="例如：25-35宝妈"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: `0.5px solid ${C.line}`,
                      background: 'rgba(255,255,255,0.07)',
                      backdropFilter: 'blur(10px)',
                      padding: '12px 14px 12px 40px',
                      fontSize: 14,
                      color: C.ink,
                      fontFamily: F.cn,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.boxShadow = `0 0 0 1.5px rgba(168,197,224,0.6)`; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.boxShadow = ''; }}
                  />
                </div>
              </div>
            </div>

            {/* 具体场景 */}
            <div>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label
                  htmlFor="pd-scenario"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                  }}
                >
                  <span style={{ display: 'inline-block', height: 14, width: 3, flexShrink: 0, borderRadius: 9999, background: C.grad }} aria-hidden={true} />
                  具体场景
                  <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.45)' }}>（选填）</span>
                </label>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.yellow }} aria-hidden={true}>auto_awesome</span>
                  AI 据此生成精准话术
                </span>
              </div>
              <div
                className="lg-glass"
                style={{
                  overflow: 'hidden',
                  borderRadius: 12,
                  border: `0.5px solid ${C.line}`,
                }}
              >
                <textarea
                  id="pd-scenario"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  rows={4}
                  placeholder="描述具体场景，例如：客户看了朋友圈主动咨询、老客户3个月没复购"
                  style={{
                    width: '100%',
                    resize: 'none',
                    background: 'transparent',
                    border: 'none',
                    padding: 16,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: C.ink,
                    fontFamily: F.cn,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: `0.5px solid ${C.line}`,
                    padding: '8px 16px',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>可描述</span>
                    {['触达时机', '客户类型', '主要痛点', '期望结果'].map((t) => (
                      <span
                        key={t}
                        style={{
                          borderRadius: 9999,
                          padding: '2px 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          background: 'rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.55)',
                          fontFamily: F.cn,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{scenario.length} 字</span>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <motion.button
                  type="submit"
                  disabled={!productName.trim()}
                  whileHover={productName.trim() ? { y: -3 } : {}}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 12,
                    padding: '12px 28px',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#081430',
                    background: C.ikb,
                    border: 'none',
                    cursor: productName.trim() ? 'pointer' : 'not-allowed',
                    opacity: productName.trim() ? 1 : 0.4,
                    fontFamily: F.mono,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>auto_awesome</span>
                  生成全链路话术
                </motion.button>
              </div>
            </div>
          </form>
        </section>
      </Reveal>

      {/* ── KPI 卡一排 ───────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {KPI_META.map((k, idx) => (
          <Item key={k.label}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 22 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    display: 'flex',
                    height: 38,
                    width: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(168,197,224,0.18)',
                    color: k.accent,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>{k.icon}</span>
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    borderRadius: 9999,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(168,197,224,0.18)',
                    color: k.accent,
                    fontFamily: F.mono,
                  }}
                >
                  {(idx === 0 || idx === 3) && (
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden={true}>trending_up</span>
                  )}
                  {['+12%', '已优化', '持续增长', '+8%'][idx]}
                </span>
              </div>
              <p style={{ marginTop: 14, fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                {k.value}
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>{k.label}</p>
              <div style={{ marginTop: 10, height: 48, width: 48 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.18)" strokeWidth="3.5" />
                  <circle
                    cx="18" cy="18" r="15.915" fill="none"
                    stroke={k.accent} strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${k.num} 100`}
                  />
                </svg>
              </div>
            </motion.div>
          </Item>
        ))}
      </RevealGroup>

      {/* ── 结果区 ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 引流话术 */}
        <Reveal>
          <section className="lg-glass" style={{ borderRadius: 20, padding: 28 }}>
            <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>
                <span
                  style={{
                    display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>campaign</span>
                </span>
                引流话术
              </h3>
              <span
                style={{
                  borderRadius: 9999, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.mono,
                }}
              >
                Traffic Scripts
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { key: 'shortVideo' as const,         label: '短视频引流',   accent: C.ikb },
                { key: 'commentInteraction' as const, label: '评论互动引流', accent: C.yellow },
                { key: 'dmGuidance' as const,         label: '私信引导话术', accent: C.accent3 },
              ].map((group) => (
                <div key={group.key}>
                  <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                    <span style={{ display: 'inline-block', height: 12, width: 3, borderRadius: 9999, background: group.accent }} aria-hidden={true} />
                    {group.label}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {generated.trafficScripts[group.key].map((s, i) => (
                      <ScriptItem key={i} text={s} onCopy={() => copyText(s)} accent={group.accent} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* 朋友圈话术 */}
        <Reveal>
          <section className="lg-glass" style={{ borderRadius: 20, padding: 28 }}>
            <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>
                <span
                  style={{
                    display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10, background: 'rgba(228,238,255,0.18)', color: C.yellow,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>photo_album</span>
                </span>
                朋友圈话术
              </h3>
              <span
                style={{
                  borderRadius: 9999, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: 'rgba(228,238,255,0.18)', color: C.yellow, fontFamily: F.mono,
                }}
              >
                Moments Scripts
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {(
                [
                  { key: 'grass'   as const, label: '种草内容', accent: C.ikb },
                  { key: 'trust'   as const, label: '信任背书', accent: C.yellow },
                  { key: 'closing' as const, label: '促单话术', accent: C.accent3 },
                  { key: 'fission' as const, label: '裂变钩子', accent: C.ikb },
                ]
              ).map((group) => (
                <div key={group.key}>
                  <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                    <span style={{ display: 'inline-block', height: 12, width: 3, borderRadius: 9999, background: group.accent }} aria-hidden={true} />
                    {group.label}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {generated.momentsScripts[group.key].map((s, i) => (
                      <ScriptItem key={i} text={s} onCopy={() => copyText(s)} accent={group.accent} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* 销售话术 */}
        <Reveal>
          <section className="lg-glass" style={{ borderRadius: 20, padding: 28 }}>
            <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>
                <span
                  style={{
                    display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10, background: 'rgba(168,197,224,0.18)', color: C.accent3,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>record_voice_over</span>
                </span>
                销售话术
              </h3>
              <span
                style={{
                  borderRadius: 9999, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: 'rgba(168,197,224,0.18)', color: C.accent3, fontFamily: F.mono,
                }}
              >
                Sales Scripts
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 初次咨询 */}
              <div>
                <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span style={{ display: 'inline-block', height: 12, width: 3, borderRadius: 9999, background: C.ikb }} aria-hidden={true} />
                  初次咨询话术
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {generated.salesScripts.firstConsult.map((s, i) => (
                    <ScriptItem key={i} text={s} onCopy={() => copyText(s)} accent={C.ikb} />
                  ))}
                </div>
              </div>
              {/* 异议处理 */}
              <div>
                <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span style={{ display: 'inline-block', height: 12, width: 3, borderRadius: 9999, background: C.yellow }} aria-hidden={true} />
                  异议处理话术
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {generated.salesScripts.objectionHandling.map((pair, i) => (
                    <motion.div
                      key={i}
                      className="lg-glass"
                      whileHover={{ y: -3 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                      style={{ overflow: 'hidden', borderRadius: 14 }}
                    >
                      <div
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                          borderBottom: `0.5px solid ${C.line}`,
                          padding: '10px 16px',
                          background: 'rgba(228,238,255,0.08)',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ marginTop: 1, fontSize: 16, color: C.yellow }} aria-hidden={true}>report_problem</span>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.yellow, fontFamily: F.cn, textShadow: C.textShadow }}>{pair.objection}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 16px' }}>
                        <span className="material-symbols-outlined" style={{ marginTop: 1, fontSize: 16, color: 'rgba(120,220,160,0.85)' }} aria-hidden={true}>check_circle</span>
                        <p style={{ flex: 1, margin: 0, fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.82)', fontFamily: F.cn }}>{pair.response}</p>
                        <button
                          type="button"
                          onClick={() => copyText(pair.response)}
                          aria-label="复制应答话术"
                          style={{
                            flexShrink: 0, background: 'transparent', border: 'none',
                            cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.45)', transition: 'color 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)'; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>content_copy</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              {/* 促单 + 售后 双列 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                    <span style={{ display: 'inline-block', height: 12, width: 3, borderRadius: 9999, background: C.accent3 }} aria-hidden={true} />
                    促单/催单话术
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {generated.salesScripts.pushOrder.map((s, i) => (
                      <ScriptItem key={i} text={s} onCopy={() => copyText(s)} accent={C.accent3} />
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                    <span style={{ display: 'inline-block', height: 12, width: 3, borderRadius: 9999, background: C.ikb }} aria-hidden={true} />
                    售后跟进话术
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {generated.salesScripts.afterSales.map((s, i) => (
                      <ScriptItem key={i} text={s} onCopy={() => copyText(s)} accent={C.ikb} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* 成交 SOP · Day 时间线 */}
        <Reveal>
          <section className="lg-glass" style={{ borderRadius: 20, padding: 28 }}>
            <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>
                <span
                  style={{
                    display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>timeline</span>
                </span>
                成交 SOP 时间线
              </h3>
              <span
                style={{
                  borderRadius: 9999, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.mono,
                }}
              >
                {generated.sop.length} 阶段
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute', left: 22, top: 0, bottom: 0, width: 1.5,
                  background: `linear-gradient(to bottom, ${C.ikb}, ${C.accent3})`,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {generated.sop.map((step, i) => (
                  <div key={i} style={{ position: 'relative', display: 'flex', gap: 20 }}>
                    <span
                      style={{
                        position: 'relative', zIndex: 1,
                        display: 'flex', height: 44, width: 44, flexShrink: 0,
                        alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%',
                        border: `1.5px solid rgba(168,197,224,0.7)`,
                        background: 'rgba(22,40,72,0.85)',
                        fontSize: 11, fontWeight: 800, color: C.ikb, fontFamily: F.mono,
                      }}
                    >
                      {i + 1}
                    </span>
                    <motion.div
                      className="lg-glass"
                      whileHover={{ y: -3 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                      style={{ flex: 1, borderRadius: 14, padding: 16 }}
                    >
                      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            borderRadius: 9999, border: `0.5px solid rgba(168,197,224,0.4)`,
                            background: 'rgba(168,197,224,0.12)', padding: '2px 10px',
                            fontSize: 11, fontWeight: 700, color: C.ikb, fontFamily: F.mono,
                          }}
                        >
                          {step.day}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{step.title}</span>
                      </div>
                      <p style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'rgba(120,220,160,0.85)', fontFamily: F.cn }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>flag</span>
                        目标：{step.goal}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>{step.desc}</p>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* 关键指标 */}
        <Reveal>
          <section className="lg-glass" style={{ borderRadius: 20, padding: 28 }}>
            <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>
                <span
                  style={{
                    display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>analytics</span>
                </span>
                关键指标
              </h3>
              <span
                style={{
                  borderRadius: 9999, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.mono,
                }}
              >
                {generated.keyMetrics.length} 项
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {generated.keyMetrics.map((m, i) => (
                <motion.div
                  key={i}
                  className="lg-glass lg-spec"
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 8, borderRadius: 16, padding: 16, textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      display: 'flex', height: 36, width: 36, alignItems: 'center',
                      justifyContent: 'center', borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
                      fontSize: 13, fontWeight: 800, color: '#081430', fontFamily: F.mono,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{m}</span>
                </motion.div>
              ))}
            </div>
          </section>
        </Reveal>
      </div>

      {/* ── 数据洞察 band ─────────────────────────────────────── */}
      <Reveal style={{ marginTop: 40 }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>· AI 综合评估 · 实时测算</span>
          <span
            style={{
              marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
              borderRadius: 9999, padding: '4px 14px', fontSize: 12, fontWeight: 600,
              background: 'rgba(168,197,224,0.18)', color: C.ikb,
              fontFamily: F.cn, textShadow: C.textShadow,
            }}
          >
            <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
            模型已就绪
          </span>
        </div>
      </Reveal>
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20, marginBottom: 32 }}>
        {/* 私域转化力雷达 */}
        <Item>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 24 }}
          >
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>radar</span>
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>私域转化力雷达</h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>六维模型评估</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 700, lineHeight: 1, color: C.ikb, fontFamily: F.display, textShadow: C.textShadow }}>75</p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>综合分</p>
              </div>
            </div>
            <svg viewBox="0 0 260 244" style={{ width: '100%' }}>
              <defs>
                <linearGradient id="pd-radarFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                  <stop offset="100%" stopColor={C.accent3} stopOpacity="0.12" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              ))}
              {radarDims.map((_, i) => {
                const [x, y] = pt(i, R);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
              })}
              <polygon points={dataPoly} fill="url(#pd-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
              {radarDims.map((d, i) => {
                const [x, y] = pt(i, R * (d.value / 100));
                return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(22,40,72,0.9)" stroke={d.color} strokeWidth="2" />;
              })}
              {radarDims.map((d, i) => {
                const [x, y] = pt(i, R + 16);
                return (
                  <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.65)" fontSize="10.5" fontWeight="600">
                    {d.label}
                  </text>
                );
              })}
            </svg>
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {radarDims.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ height: 8, width: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 成交转化漏斗 / 复购曲线 */}
        <Item>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 24 }}
          >
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10, background: 'rgba(228,238,255,0.18)', color: C.yellow,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>show_chart</span>
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>成交转化漏斗 / 复购曲线</h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>按当前链路参数测算</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {(['成交', '复购', '裂变'] as const).map((t, i) => (
                  <span
                    key={t}
                    style={{
                      borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                      background: i === 0 ? C.ikb : 'rgba(255,255,255,0.08)',
                      color: i === 0 ? '#081430' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>45%</p>
              <span
                style={{
                  marginBottom: 2, display: 'inline-flex', alignItems: 'center', gap: 2,
                  borderRadius: 9999, padding: '3px 8px', fontSize: 12, fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.mono,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>trending_up</span>+28%
              </span>
              <span style={{ marginBottom: 2, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>较行业基线</span>
            </div>
            <svg viewBox={`0 0 ${trendW} ${trendH}`} style={{ width: '100%' }}>
              <defs>
                <linearGradient id="pd-trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                  <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="pd-trendLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C.ikb} />
                  <stop offset="100%" stopColor={C.accent3} />
                </linearGradient>
              </defs>
              {[0, 0.33, 0.66, 1].map((f) => (
                <line
                  key={f}
                  x1={trendPadL} x2={trendW - trendPadR}
                  y1={(trendPadT + trendInnerH * f).toFixed(1)}
                  y2={(trendPadT + trendInnerH * f).toFixed(1)}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1"
                />
              ))}
              <path d={trendArea} fill="url(#pd-trendFill)" />
              <path d={trendLine} fill="none" stroke="url(#pd-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {trendData.map((v, i) =>
                i % 2 === 0 ? <circle key={i} cx={tx(i)} cy={ty(v)} r="3.4" fill="rgba(22,40,72,0.9)" stroke={C.ikb} strokeWidth="2" /> : null,
              )}
            </svg>
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
              {funnelLabels.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── 底部反馈 ─────────────────────────────────────────── */}
      <Reveal>
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `0.5px solid ${C.line}`,
            paddingTop: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>这个结果对你有帮助吗？</p>
            <motion.button
              type="button"
              onClick={handleFeedbackUp}
              aria-label="有帮助"
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass"
              style={{
                display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: C.ikb,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>thumb_up</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={handleFeedbackDown}
              aria-label="无帮助"
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass"
              style={{
                display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>thumb_down</span>
            </motion.button>
          </div>
          <motion.button
            type="button"
            onClick={handleCopyAll}
            aria-label="复制全部话术"
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              borderRadius: 12, padding: '10px 22px',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#081430', background: C.ikb, border: 'none', cursor: 'pointer', fontFamily: F.mono,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>content_copy</span>
            复制全部话术
          </motion.button>
        </div>
      </Reveal>
    </LiquidShell>
  );
}
