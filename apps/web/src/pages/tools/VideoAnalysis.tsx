/**
 * VideoAnalysis.tsx — /video-analysis · 爆款文案解析
 * IKB 红蓝紫渐变体系重构 · IKBLayout 外壳 · 逻辑零改动 · testid / htmlFor / id 全保留
 * 样板: Analysis.tsx / AcquisitionVideo.tsx / Generate.tsx
 */

import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VideoAnalysisResult {
  topicStrategy: {
    category: string;
    angle: string;
    targetAudience: string;
    evaluation: string;
  };
  hookAnalysis: {
    score: number;
    maxScore: number;
    type: string;
    technique: string;
    evaluation: string;
  };
  narrativeStructure: {
    label: string;
    timeline: string[];
    evaluation: string;
  };
  popularElements: Array<{
    name: string;
    main: string;
    note: string;
  }>;
  popularFormula: {
    title: string;
    chips: string[];
  };
  rewriteResult: {
    title: string;
    intro: string;
    body: string[];
    twist: string;
    ending: string;
    hashtags: string;
  };
}

export interface VideoAnalysisFormData {
  videoTitle: string;
  content: string;
  rewriteTopic: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_FORM: VideoAnalysisFormData = {
  videoTitle: '',
  content: '这是测试文案，用于测试 AI 解析功能。我是一个内容创作者，希望了解爆款的奥秘。',
  rewriteTopic: '',
};

// ── Mock data ─────────────────────────────────────────────────────────────────

function generateMockResult(): VideoAnalysisResult {
  return {
    topicStrategy: {
      category: '测试与探索',
      angle: 'AI功能测试与爆款奥秘探寻',
      targetAudience: 'AI开发者、内容创作者、对爆款机制感兴趣的用户',
      evaluation: '这个文案本身是测试性质的，所以从选题策略上来说，它不是一个常规的爆款选题。但如果把它看作一个创作者在探索爆款的开场白，那它的目标就是引起共鸣，表达对爆款的求知欲。对于一个真实视频来说，这样的选题缺乏具体内容支撑，很难成为爆款。',
    },
    hookAnalysis: {
      score: 20,
      maxScore: 100,
      type: '提问型（潜在）',
      technique: '虽然文案是测试，但"希望了解爆款的奥秘"这句话本身就带有提问和求知欲，可以看作一种潜在的提问型钩子，吸引有相同困惑的人。',
      evaluation: '对于测试文案来说，有效性不适用。如果作为真实视频的开头，仅仅表达求知欲，缺乏具体内容或反差，吸引力会比较弱，很难在黄金3秒内抓住人。',
    },
    narrativeStructure: {
      label: '声明式',
      timeline: [
        '声明：这是测试文案',
        '目的：测试AI解析功能',
        '身份：内容创作者',
        '诉求：希望了解爆款奥秘',
      ],
      evaluation: '平缓，没有明显的起伏或转折，更像一个简单的陈述。',
    },
    popularElements: [
      {
        name: '身份认同',
        main: '"我是一个内容创作者"这句话能让一部分同类用户产生共鸣。',
        note: '在真实视频中，如果能进一步展现创作者的困境或努力，会更有效。目前仅是声明，效果有限。',
      },
      {
        name: '好奇心',
        main: '"希望了解爆款的奥秘"直接点出了很多创作者的痛点和好奇心。',
        note: '这个点是好的，但需要后续内容来承接和满足这份好奇心，否则只是提出问题，没有解答，难以形成爆款。',
      },
    ],
    popularFormula: {
      title: '（测试文案无爆款公式）',
      chips: [
        '真实性（作为测试文案）',
        '身份认同（内容创作者）',
        '求知欲（爆款奥秘）',
      ],
    },
    rewriteResult: {
      title: '你刷到过那些"一眼假"的视频吗？',
      intro: '2025年，我朋友在网上刷到一个视频，博主信誓旦旦说，只要每天对着镜子说三遍"我会暴富"，七天内就能中彩票。当时我俩都笑了。',
      body: [
        '结果不到一周，这个视频播放量破了千万。评论区里，有人说自己真的捡到钱了，有人说工作突然顺利，还有人分享自己买彩票中了小奖。我朋友开始有点动摇，问我，这玩意儿真有魔力？',
        '我当时就想，这怎么可能？但那些评论，那些数字，又实实在在摆在那里。我开始琢磨，为什么这种"一眼假"的东西，反而能火到出圈？它到底戳中了多少人的心？',
        '我翻了上百个类似视频，从"喝水能瘦十斤"到"冥想能吸引好运"，发现它们都有一个共同点：门槛极低，回报极高。你不需要投入金钱，不需要付出巨大努力，只需要动动嘴皮子，或者稍微改变一个习惯，就能得到你梦寐以求的结果。',
        '这就像一个心理安慰剂。在快节奏的生活里，我们每个人都渴望捷径。渴望不劳而获，渴望一夜暴富。哪怕理智告诉我们这是假的，但内心深处，总有一丝丝微弱的期待。',
      ],
      twist: '这些视频，其实不是在卖方法，而是在卖一种情绪价值。它们贩卖的是希望，是幻想，是对美好未来的无条件憧憬。它让你在疲惫的时候，能找到一个短暂的出口，一个可以寄托心愿的虚幻空间。',
      ending: '所以，当你下次再刷到这种视频，不妨想想，它是不是在给你提供一个情绪上的"甜点"？它可能没法改变你的现实，但它能让你在某个瞬间，感受到一点点被点燃的希望。这种希望，对你来说，值不值得？',
      hashtags: '#短视频爆款 #流量密码 #情绪价值 #心理学 #内容创作 #人性洞察 #为什么会火 #社交媒体 #自我安慰 #生活哲学',
    },
  };
}

// ── Style tokens ──────────────────────────────────────────────────────────────

const btnSecondary =
  'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

// ── Main Component ────────────────────────────────────────────────────────────

export default function VideoAnalysis() {
  const [videoTitle, setVideoTitle] = useState(DEFAULT_FORM.videoTitle);
  const [content, setContent] = useState(DEFAULT_FORM.content);
  const [rewriteTopic, setRewriteTopic] = useState(DEFAULT_FORM.rewriteTopic);

  const generated = generateMockResult();

  function handleAnalyze() {
    toast.success('已开始深度解析');
  }

  function handleRewriteGenerate() {
    toast.success('已生成仿写文案');
  }

  function handleRewriteCopy() {
    const r = generated.rewriteResult;
    const text = [
      '• 标题', r.title, '', '• 开头', r.intro, '', '• 正文', ...r.body,
      '', '• 转折/升华', r.twist, '', '• 结尾', r.ending, '', '• 话题标签', r.hashtags,
    ].join('\n');
    void navigator.clipboard.writeText(text).then(() => toast.success('已复制仿写文案'));
  }

  function handleFeedbackUp() {
    toast.success('感谢反馈!');
  }

  function handleFeedbackDown() {
    toast.info('我们会持续改进');
  }

  // rewriteResult 总字数
  const rewriteWordCount = [
    generated.rewriteResult.title,
    generated.rewriteResult.intro,
    ...generated.rewriteResult.body,
    generated.rewriteResult.twist,
    generated.rewriteResult.ending,
  ].join('').length;

  // 爆款解析雷达六维数据 — IKB 三色轮转
  const RADAR_DIMS_VA = [
    { label: '选题精准', value: 72, color: C.ikb },
    { label: '钩子强度', value: generated.hookAnalysis.score, color: C.burgundy },
    { label: '叙事张力', value: 65, color: C.accent3 },
    { label: '元素密度', value: generated.popularElements.length * 30, color: C.ikb },
    { label: '情绪价值', value: 78, color: C.burgundy },
    { label: '转化引导', value: 55, color: C.accent3 },
  ];

  // 黄金3秒注意力曲线
  const ATTENTION_DATA = [90, 75, 60, 55, 68, 72, 65, 58, 50, 62, 70, 55];
  const NARRATIVE_DATA = [40, 55, 70, 80, 75, 90, 85, 78, 88, 82, 76, 68];

  return (
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
            >
              创作引擎
            </span>
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${C.burgundy}50`, background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
            >
              拆解器
            </span>
          </div>
          <h1
            className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight"
            style={{ fontFamily: F.display }}
          >
            爆款文案解析
          </h1>
          <p
            className="mt-2 max-w-[820px] text-[16px] leading-relaxed"
            style={{ color: '#5A6173', fontFamily: F.cn }}
          >
            粘贴爆款视频的完整文案/口播稿，AI 将深度拆解爆款密码，支持一键仿写生成同类高转化内容。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            onClick={handleRewriteCopy}
            aria-label="复制仿写文案"
            className={btnSecondary}
            style={{ borderColor: C.line, background: C.paper, color: C.ink, fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>content_copy</span>
            复制仿写
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!content.trim()}
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>analytics</span>
            重新解析
          </button>
        </div>
      </header>

      {/* ── 使用方法提示卡 ─────────────────────────────────── */}
      <div
        className="mb-8 flex items-start gap-3 rounded-xl border p-4"
        style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}06` }}
      >
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>info</span>
        <p className="text-[14px] leading-relaxed" style={{ color: C.purpleText, fontFamily: F.cn }}>
          <span className="font-bold">使用方法：</span>
          打开抖音/小红书/快手等 APP → 找到爆款视频 → 复制视频的完整口播文案/文字内容 → 粘贴到下方输入框 → 点击「开始深度解析」
        </p>
      </div>

      {/* ── 输入卡 ─────────────────────────────────────────── */}
      <section
        className="relative mb-12 overflow-hidden rounded-xl border p-6"
        style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl"
          style={{ background: `${C.ikb}08` }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl"
          style={{ background: `${C.burgundy}06` }}
        />
        <div className="relative mb-6 flex items-center justify-between border-b pb-5" style={{ borderColor: C.line }}>
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: C.grad }}
            >
              <span className="material-symbols-outlined" aria-hidden={true}>content_paste_search</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>输入文案内容</h2>
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>粘贴爆款文案 · AI 深度拆解爆款密码</p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
          >
            <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
            待解析
          </span>
        </div>
        <div className="relative space-y-6">
          {/* 视频标题 */}
          <div>
            <label
              htmlFor="va-title"
              className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
              style={{ color: C.ink, fontFamily: F.cn }}
            >
              <span
                className="mr-0.5 inline-block h-3.5 w-1 rounded-full"
                style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                aria-hidden={true}
              />
              视频标题
              <span className="ml-1 text-[12px] font-normal" style={{ color: '#6b7280' }}>（选填）</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#6b7280' }} aria-hidden={true}>title</span>
              <input
                id="va-title"
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="粘贴视频标题（可选）"
                className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus:ring-1 focus-within:ring-[#2B53E6]"
                style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.cn }}
              />
            </div>
          </div>

          {/* 文案内容 · 框式编辑器 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="va-content"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="mr-0.5 inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                  aria-hidden={true}
                />
                文案内容 <span className="ml-1" style={{ color: C.burgundyText }}>*</span>
              </label>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }} aria-hidden={true}>
                <span className="material-symbols-outlined text-[14px]" style={{ color: C.burgundy }} aria-hidden={true}>auto_awesome</span>
                AI 据此拆解爆款结构
              </span>
            </div>
            <div
              className="overflow-hidden rounded-xl border transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
              style={{ borderColor: C.line, background: C.base }}
            >
              <textarea
                id="va-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="粘贴完整口播文案/视频文字内容"
                className="ikb-input w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed"
                style={{ color: C.ink, fontFamily: F.cn }}
              />
              <div
                className="flex items-center justify-between gap-3 border-t px-4 py-2.5"
                style={{ borderColor: C.line, background: `${C.paper}99` }}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>支持</span>
                  {['口播稿', '字幕', '描述文案', '评论区文案'].map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ background: C.base, color: '#6b7280', border: `1px solid ${C.line}`, fontFamily: F.cn }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 tabular-nums text-[11px]" style={{ color: '#6b7280', fontFamily: F.mono }}>{content.length} 字</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!content.trim()}
              className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>analytics</span>
              开始深度解析
            </button>
          </div>
        </div>
      </section>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 钩子评分 · 环形 · 蓝 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>anchor</span>
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              已分析
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                {generated.hookAnalysis.score}
                <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}>/{generated.hookAnalysis.maxScore}</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>钩子评分</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label={`钩子评分 ${generated.hookAnalysis.score} 分`}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}22`} strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={C.ikb}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${(generated.hookAnalysis.score / generated.hookAnalysis.maxScore) * 100} 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 爆款元素数 · 玫红 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.burgundy}12`, color: C.burgundy }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>stars</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
            >
              已提取
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {generated.popularElements.length}
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 个</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>爆款元素</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[40, 70, 55, 85, 65].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `${C.burgundy}B3` }} />
            ))}
          </div>
        </div>

        {/* 叙事结构 · 紫 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.accent3}12`, color: C.accent3 }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>timeline</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}
            >
              已识别
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[20px] font-bold leading-tight" style={{ color: C.ink, fontFamily: F.display }}>
              {generated.narrativeStructure.label}
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>叙事结构</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}18` }}>
            <div className="h-2 rounded-full" style={{ width: '45%', background: `linear-gradient(to right, ${C.accent3}, ${C.ikb})` }} />
          </div>
        </div>

        {/* 仿写字数 · 蓝 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>edit_note</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              仿写就绪
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {rewriteWordCount}
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 字</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>仿写总字数</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['标题', '开头', '正文', '结尾'].map((k) => (
              <span
                key={k}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: `${C.ikb}10`, color: C.ikb, fontFamily: F.mono }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 解析结果区 ─────────────────────────────────────── */}
      <div className="space-y-6">

        {/* ── 选题策略 ──────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border" style={{ borderColor: C.line, background: C.paper }}>
          <div className="flex items-center gap-2.5 px-6 py-4" style={{ background: C.grad }}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px] text-white" aria-hidden={true}>target</span>
            </span>
            <h3 className="text-[16px] font-bold text-white">选题策略</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 p-6">
            <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p
                className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: C.ikb, fontFamily: F.mono }}
              >
                <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                内容分类
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.topicStrategy.category}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p
                className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: C.ikb, fontFamily: F.mono }}
              >
                <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                切入角度
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.topicStrategy.angle}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p
                className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: C.burgundy, fontFamily: F.mono }}
              >
                <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.burgundy }} aria-hidden={true} />
                目标受众
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.topicStrategy.targetAudience}</p>
            </div>
            <div className="col-span-2 rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p
                className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: C.burgundy, fontFamily: F.mono }}
              >
                <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.burgundy }} aria-hidden={true} />
                综合评估
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.topicStrategy.evaluation}</p>
            </div>
          </div>
        </section>

        {/* ── 钩子分析 ──────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border" style={{ borderColor: C.line, background: C.paper }}>
          <div
            className="flex items-center gap-2.5 px-6 py-4"
            style={{ background: `linear-gradient(to right, ${C.burgundy}, #c4304e)` }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px] text-white" aria-hidden={true}>anchor</span>
            </span>
            <h3 className="text-[16px] font-bold text-white">钩子分析</h3>
          </div>
          <div className="p-6">
            <div className="mb-5 flex items-center gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-[52px] font-extrabold leading-none" style={{ color: C.ikb, fontFamily: F.display }}>
                  {generated.hookAnalysis.score}
                </span>
                <span className="text-[22px] font-bold" style={{ color: '#6b7280', fontFamily: F.cn }}>/{generated.hookAnalysis.maxScore}</span>
              </div>
              <div>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-[13px] font-bold"
                  style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
                >
                  {generated.hookAnalysis.type}
                </span>
                <div className="mt-2 h-2 w-48 rounded-full" style={{ background: `${C.ikb}18` }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(generated.hookAnalysis.score / generated.hookAnalysis.maxScore) * 100}%`,
                      background: `linear-gradient(to right, ${C.ikb}, ${C.burgundy})`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
                <p
                  className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: C.ikb, fontFamily: F.mono }}
                >
                  <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                  钩子技法
                </p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.hookAnalysis.technique}</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
                <p
                  className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: C.burgundy, fontFamily: F.mono }}
                >
                  <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.burgundy }} aria-hidden={true} />
                  效果评估
                </p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.hookAnalysis.evaluation}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 叙事结构 ──────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border" style={{ borderColor: C.line, background: C.paper }}>
          <div
            className="flex items-center gap-2.5 px-6 py-4"
            style={{ background: `linear-gradient(to right, ${C.accent3}, ${C.ikb})` }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px] text-white" aria-hidden={true}>timeline</span>
            </span>
            <h3 className="text-[16px] font-bold text-white">叙事结构</h3>
          </div>
          <div className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <span
                className="inline-flex items-center rounded-full px-4 py-1.5 text-[14px] font-bold"
                style={{ background: `${C.accent3}18`, color: C.purpleText, fontFamily: F.mono }}
              >
                {generated.narrativeStructure.label}
              </span>
            </div>
            <div className="mb-5">
              <p
                className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: C.ikb, fontFamily: F.mono }}
              >
                <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                叙事时间线
              </p>
              <ol className="space-y-2">
                {generated.narrativeStructure.timeline.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: C.ikb, fontFamily: F.mono }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p
                className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: C.burgundy, fontFamily: F.mono }}
              >
                <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.burgundy }} aria-hidden={true} />
                节奏评估
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.narrativeStructure.evaluation}</p>
            </div>
          </div>
        </section>

        {/* ── 爆款元素 + 公式 ───────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border" style={{ borderColor: C.line, background: C.paper }}>
          <div
            className="flex items-center gap-2.5 px-6 py-4"
            style={{ background: `linear-gradient(to right, ${C.ikb}, ${C.burgundy})` }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px] text-white" aria-hidden={true}>stars</span>
            </span>
            <h3 className="text-[16px] font-bold text-white">爆款元素 &amp; 公式</h3>
          </div>
          <div className="space-y-5 p-6">
            {/* 元素列表 */}
            <div>
              <p
                className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: C.ikb, fontFamily: F.mono }}
              >
                <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                爆款元素
              </p>
              <div className="space-y-3">
                {generated.popularElements.map((el, i) => (
                  <div key={i} className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ background: C.ikb, fontFamily: F.mono }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{el.name}</span>
                    </div>
                    <p className="mb-1.5 text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{el.main}</p>
                    <p className="text-[13px] leading-relaxed" style={{ color: '#6b7280', fontFamily: F.cn }}>{el.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 爆款公式 */}
            <div className="rounded-xl border p-5" style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}06` }}>
              <p
                className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: C.ikb, fontFamily: F.mono }}
              >
                <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                爆款公式
              </p>
              <p className="mb-3 text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{generated.popularFormula.title}</p>
              <div className="flex flex-wrap gap-2">
                {generated.popularFormula.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border px-3 py-1 text-[12px] font-semibold"
                    style={{ borderColor: `${C.ikb}30`, background: C.paper, color: C.ikb, fontFamily: F.cn }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 一键仿写 ──────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border" style={{ borderColor: C.line, background: C.paper }}>
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ background: C.grad }}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <span className="material-symbols-outlined text-[18px] text-white" aria-hidden={true}>edit_note</span>
              </span>
              <h3 className="text-[16px] font-bold text-white">一键仿写</h3>
            </div>
            <button
              type="button"
              onClick={handleRewriteCopy}
              aria-label="复制仿写文案"
              className="ikb-focusring flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/25"
              style={{ fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>content_copy</span>
              复制全文
            </button>
          </div>
          <div className="space-y-5 p-6">
            {/* 仿写主题输入 */}
            <div>
              <label
                htmlFor="va-rewrite"
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="mr-0.5 inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                  aria-hidden={true}
                />
                仿写主题
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#6b7280' }} aria-hidden={true}>subject</span>
                  <input
                    id="va-rewrite"
                    type="text"
                    value={rewriteTopic}
                    onChange={(e) => setRewriteTopic(e.target.value)}
                    placeholder="输入仿写主题（选填，留空则沿用原文角度）"
                    className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus:ring-1 focus-within:ring-[#2B53E6]"
                    style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.cn }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRewriteGenerate}
                  className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px"
                  style={{ fontFamily: F.mono }}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_awesome</span>
                  生成仿写
                </button>
              </div>
            </div>

            {/* 仿写结果展示 */}
            <div className="space-y-4">
              {/* 标题 */}
              <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
                <p
                  className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: C.ikb, fontFamily: F.mono }}
                >
                  <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                  标题
                </p>
                <p className="text-[15px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{generated.rewriteResult.title}</p>
              </div>

              {/* 开头 */}
              <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
                <p
                  className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: C.burgundy, fontFamily: F.mono }}
                >
                  <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.burgundy }} aria-hidden={true} />
                  开头 · 黄金3秒
                </p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.rewriteResult.intro}</p>
              </div>

              {/* 正文 · 多段完整 */}
              <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
                <p
                  className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: C.ikb, fontFamily: F.mono }}
                >
                  <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                  正文
                </p>
                <div className="space-y-3">
                  {generated.rewriteResult.body.map((para, i) => (
                    <p key={i} className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{para}</p>
                  ))}
                </div>
              </div>

              {/* 转折/升华 */}
              <div className="rounded-xl border p-4" style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}06` }}>
                <p
                  className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: C.ikb, fontFamily: F.mono }}
                >
                  <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                  转折 · 升华
                </p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.rewriteResult.twist}</p>
              </div>

              {/* 结尾 */}
              <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
                <p
                  className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: C.burgundy, fontFamily: F.mono }}
                >
                  <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.burgundy }} aria-hidden={true} />
                  结尾 · 引导互动
                </p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.rewriteResult.ending}</p>
              </div>

              {/* 话题标签 */}
              <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
                <p
                  className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: C.ikb, fontFamily: F.mono }}
                >
                  <span className="inline-block h-2.5 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                  话题标签
                </p>
                <div className="flex flex-wrap gap-2">
                  {generated.rewriteResult.hashtags.split(' ').map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2.5 py-0.5 text-[12px] font-medium"
                      style={{ borderColor: `${C.ikb}30`, background: C.paper, color: C.ikb, fontFamily: F.cn }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── 数据洞察 band ──────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>数据洞察</h2>
        <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
        >
          <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 爆款解析雷达 · col-span-5 */}
        <div
          className="col-span-5 ikb-hovercard rounded-xl border p-6"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.ikb}12`, color: C.ikb }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>爆款解析雷达</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>
                {Math.round(RADAR_DIMS_VA.reduce((acc, d) => acc + d.value, 0) / RADAR_DIMS_VA.length)}
              </p>
              <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>综合分</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS_VA;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (Math.min(d.value, 100) / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="爆款解析雷达图">
                <defs>
                  <linearGradient id="va-radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#va-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (Math.min(d.value, 100) / 100));
                  return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
                })}
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R + 16);
                  return (
                    <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            );
          })()}
          <div className="mt-2 grid grid-cols-3 gap-y-2">
            {RADAR_DIMS_VA.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 黄金3秒 + 叙事节奏趋势 · col-span-7 */}
        <div
          className="col-span-7 ikb-hovercard rounded-xl border p-6"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.burgundy}12`, color: C.burgundy }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>黄金3秒注意力曲线 / 叙事节奏</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>注意力留存 vs 叙事张力对比</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['注意力', '叙事'].map((t, i) => (
                <span
                  key={t}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                  style={i === 0
                    ? { background: C.ikb, color: '#ffffff', fontFamily: F.mono }
                    : { background: C.base, color: '#6b7280', fontFamily: F.mono }
                  }
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          {(() => {
            const W = 560;
            const H = 168;
            const padL = 6;
            const padR = 6;
            const padT = 12;
            const padB = 8;
            const innerW = W - padL - padR;
            const innerH = H - padT - padB;
            const max = 110;
            const x = (i: number) => padL + (innerW * i) / (ATTENTION_DATA.length - 1);
            const yFn = (v: number) => padT + innerH * (1 - v / max);
            const line1 = ATTENTION_DATA.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${yFn(v).toFixed(1)}`).join(' ');
            const line2 = NARRATIVE_DATA.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${yFn(v).toFixed(1)}`).join(' ');
            const area1 = `${line1} L ${x(ATTENTION_DATA.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                <defs>
                  <linearGradient id="va-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="va-trendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.ikb} />
                    <stop offset="100%" stopColor={C.burgundy} />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((f) => (
                  <line
                    key={f}
                    x1={padL}
                    x2={W - padR}
                    y1={(padT + innerH * f).toFixed(1)}
                    y2={(padT + innerH * f).toFixed(1)}
                    stroke="#f1f3f9"
                    strokeWidth="1"
                  />
                ))}
                <path d={area1} fill="url(#va-trendFill)" />
                <path d={line1} fill="none" stroke="url(#va-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={line2} fill="none" stroke={C.burgundy} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
                {ATTENTION_DATA.map((v, i) =>
                  i % 3 === 0 ? <circle key={i} cx={x(i)} cy={yFn(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
            {['开头', '第2节', '第3节', '第4节', '第5节', '第6节', '第7节', '第8节', '第9节', '第10节', '第11节', '结尾'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 反馈 footer ─────────────────────────────────────── */}
      <div className="mt-8 flex items-center gap-3 border-t pt-6" style={{ borderColor: C.line }}>
        <p className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>解析结果有帮助吗？</p>
        <button
          type="button"
          onClick={handleFeedbackUp}
          aria-label="有帮助"
          className="ikb-focusring flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:border-[#2B53E6] hover:text-[#2B53E6]"
          style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>thumb_up</span>
        </button>
        <button
          type="button"
          onClick={handleFeedbackDown}
          aria-label="没有帮助"
          className="ikb-focusring flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
          style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>thumb_down</span>
        </button>
      </div>
    </IKBLayout>
  );
}
