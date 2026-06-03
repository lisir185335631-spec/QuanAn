/**
 * VideoAnalysis.tsx — /video-analysis · 爆款文案解析
 * 先锋白·工业精密版 · PioneerLayout · inline 软卡 · 逻辑零改动
 * 样板: Step3.tsx + Step4b.tsx
 */
import { useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';

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
  'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

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

  // 爆款解析雷达六维数据
  const RADAR_DIMS_VA = [
    { label: '选题精准', value: 72, color: '#002fa7' },
    { label: '钩子强度', value: generated.hookAnalysis.score, color: '#781621' },
    { label: '叙事张力', value: 65, color: '#F6D300' },
    { label: '元素密度', value: generated.popularElements.length * 30, color: '#002fa7' },
    { label: '情绪价值', value: 78, color: '#781621' },
    { label: '转化引导', value: 55, color: '#F6D300' },
  ];

  // 黄金3秒注意力曲线
  const ATTENTION_DATA = [90, 75, 60, 55, 68, 72, 65, 58, 50, 62, 70, 55];
  const NARRATIVE_DATA = [40, 55, 70, 80, 75, 90, 85, 78, 88, 82, 76, 68];

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              创作引擎
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              拆解器
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            爆款文案解析
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            粘贴爆款视频的完整文案/口播稿，AI 将深度拆解爆款密码，支持一键仿写生成同类高转化内容。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button type="button" onClick={handleRewriteCopy} aria-label="复制仿写文案" className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
            复制仿写
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!content.trim()}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">analytics</span>
            重新解析
          </button>
        </div>
      </header>

      {/* ── 使用方法提示卡 ─────────────────────────────────── */}
      <div className="mb-8 flex items-start gap-3 rounded-xl border border-[#dbe2ff] bg-[#002fa7]/5 p-4">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-[#002fa7]" aria-hidden="true">info</span>
        <p className="text-[14px] leading-relaxed text-[#1b2a5e]">
          <span className="font-bold">使用方法：</span>
          打开抖音/小红书/快手等 APP → 找到爆款视频 → 复制视频的完整口播文案/文字内容 → 粘贴到下方输入框 → 点击「开始深度解析」
        </p>
      </div>

      {/* ── 输入卡 ─────────────────────────────────────────── */}
      <section className="relative mb-12 overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />
        <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined" aria-hidden="true">content_paste_search</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">输入文案内容</h2>
              <p className="text-[12px] text-[#9ca3af]">粘贴爆款文案 · AI 深度拆解爆款密码</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            待解析
          </span>
        </div>
        <div className="relative space-y-6">
          {/* 视频标题 */}
          <div>
            <label
              htmlFor="va-title"
              className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
            >
              视频标题
              <span className="ml-1 text-[12px] font-normal text-[#9ca3af]">（选填）</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" aria-hidden="true">title</span>
              <input
                id="va-title"
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="粘贴视频标题（可选）"
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
              />
            </div>
          </div>

          {/* 文案内容 · 框式编辑器 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="va-content"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                文案内容 <span className="ml-1 text-[#781621]">*</span>
              </label>
              <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]" aria-hidden="true">
                <span className="material-symbols-outlined text-[14px] text-[#781621]">auto_awesome</span>
                AI 据此拆解爆款结构
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
              <textarea
                id="va-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="粘贴完整口播文案/视频文字内容"
                className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
              />
              <div className="flex items-center justify-between gap-3 border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#9ca3af]">支持</span>
                  {['口播稿', '字幕', '描述文案', '评论区文案'].map((t) => (
                    <span key={t} className="rounded-full bg-[#f1f3f9] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7280]">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]">{content.length} 字</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!content.trim()}
              className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">analytics</span>
              开始深度解析
            </button>
          </div>
        </div>
      </section>

      {/* ── 数据洞察 band ──────────────────────────────────── */}
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
        {/* 爆款解析雷达 · col-span-5 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">爆款解析雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">
                {Math.round(RADAR_DIMS_VA.reduce((acc, d) => acc + d.value, 0) / RADAR_DIMS_VA.length)}
              </p>
              <p className="text-[10px] text-[#9ca3af]">综合分</p>
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
              <svg viewBox="0 0 260 244" className="w-full">
                <defs>
                  <linearGradient id="radarFillVA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#radarFillVA)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
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
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 黄金3秒 + 叙事节奏趋势 · col-span-7 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">黄金3秒注意力曲线 / 叙事节奏</h3>
                <p className="text-[11px] text-[#9ca3af]">注意力留存 vs 叙事张力对比</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['注意力', '叙事'].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-[#002fa7] text-white' : 'bg-[#f1f3f9] text-[#6b7280]'}`}
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
                  <linearGradient id="trendFillVA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendLineVA" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#002fa7" />
                    <stop offset="100%" stopColor="#781621" />
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
                <path d={area1} fill="url(#trendFillVA)" />
                <path d={line1} fill="none" stroke="url(#trendLineVA)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={line2} fill="none" stroke="#781621" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
                {ATTENTION_DATA.map((v, i) =>
                  i % 3 === 0 ? <circle key={i} cx={x(i)} cy={yFn(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
            {['开头', '第2节', '第3节', '第4节', '第5节', '第6节', '第7节', '第8节', '第9节', '第10节', '第11节', '结尾'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 钩子评分 · 环形 · 蓝 */}
        <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">anchor</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              已分析
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                {generated.hookAnalysis.score}
                <span className="text-[15px] text-[#9ca3af]">/{generated.hookAnalysis.maxScore}</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">钩子评分</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#002fa7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${(generated.hookAnalysis.score / generated.hookAnalysis.maxScore) * 100} 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 爆款元素数 · 勃艮第 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">stars</span>
            </span>
            <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">已提取</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {generated.popularElements.length}
              <span className="text-[15px] text-[#9ca3af]"> 个</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">爆款元素</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[40, 70, 55, 85, 65].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-[#781621]/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* 叙事结构 · 黄 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">timeline</span>
            </span>
            <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">已识别</span>
          </div>
          <div className="mt-4">
            <p className="text-[20px] font-bold leading-tight text-[#111827]">
              {generated.narrativeStructure.label}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">叙事结构</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
            <div className="h-2 rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" style={{ width: '45%' }} />
          </div>
        </div>

        {/* 仿写字数 · 蓝 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit_note</span>
            </span>
            <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">仿写就绪</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {rewriteWordCount}
              <span className="text-[15px] text-[#9ca3af]"> 字</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">仿写总字数</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['标题', '开头', '正文', '结尾'].map((k) => (
              <span
                key={k}
                className="rounded bg-[#eff4ff] px-1.5 py-0.5 text-[10px] font-medium text-[#002fa7]"
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
        <section className="rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft overflow-hidden">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-6 py-4 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">target</span>
            </span>
            <h3 className="text-[16px] font-bold">选题策略</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#002fa7] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                内容分类
              </p>
              <p className="text-[14px] leading-relaxed text-[#374151]">{generated.topicStrategy.category}</p>
            </div>
            <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#002fa7] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                切入角度
              </p>
              <p className="text-[14px] leading-relaxed text-[#374151]">{generated.topicStrategy.angle}</p>
            </div>
            <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#781621] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#781621] before:content-['']">
                目标受众
              </p>
              <p className="text-[14px] leading-relaxed text-[#374151]">{generated.topicStrategy.targetAudience}</p>
            </div>
            <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4 col-span-2">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#781621] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#781621] before:content-['']">
                综合评估
              </p>
              <p className="text-[14px] leading-relaxed text-[#374151]">{generated.topicStrategy.evaluation}</p>
            </div>
          </div>
        </section>

        {/* ── 钩子分析 ──────────────────────────────────────── */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft overflow-hidden">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#781621] to-[#a02030] px-6 py-4 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">anchor</span>
            </span>
            <h3 className="text-[16px] font-bold">钩子分析</h3>
          </div>
          <div className="p-6">
            <div className="mb-5 flex items-center gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-[52px] font-extrabold leading-none text-[#002fa7]">
                  {generated.hookAnalysis.score}
                </span>
                <span className="text-[22px] font-bold text-[#9ca3af]">/{generated.hookAnalysis.maxScore}</span>
              </div>
              <div>
                <span className="inline-flex items-center rounded-full bg-[#002fa7]/10 px-3 py-1 text-[13px] font-bold text-[#002fa7]">
                  {generated.hookAnalysis.type}
                </span>
                <div className="mt-2 h-2 w-48 rounded-full bg-[#eef1f6]">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#002fa7] to-[#781621]"
                    style={{ width: `${(generated.hookAnalysis.score / generated.hookAnalysis.maxScore) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#002fa7] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                  钩子技法
                </p>
                <p className="text-[14px] leading-relaxed text-[#374151]">{generated.hookAnalysis.technique}</p>
              </div>
              <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#781621] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#781621] before:content-['']">
                  效果评估
                </p>
                <p className="text-[14px] leading-relaxed text-[#374151]">{generated.hookAnalysis.evaluation}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 叙事结构 ──────────────────────────────────────── */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft overflow-hidden">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#F6D300] to-[#e8c800] px-6 py-4 text-[#221b00]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221b00]/10">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">timeline</span>
            </span>
            <h3 className="text-[16px] font-bold">叙事结构</h3>
          </div>
          <div className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-[#F6D300]/20 px-4 py-1.5 text-[14px] font-bold text-[#8a6a00]">
                {generated.narrativeStructure.label}
              </span>
            </div>
            <div className="mb-5">
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#002fa7] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                叙事时间线
              </p>
              <ol className="space-y-2">
                {generated.narrativeStructure.timeline.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#002fa7] text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-[14px] leading-relaxed text-[#374151]">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#781621] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#781621] before:content-['']">
                节奏评估
              </p>
              <p className="text-[14px] leading-relaxed text-[#374151]">{generated.narrativeStructure.evaluation}</p>
            </div>
          </div>
        </section>

        {/* ── 爆款元素 + 公式 ───────────────────────────────── */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft overflow-hidden">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#002fa7] to-[#781621] px-6 py-4 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">stars</span>
            </span>
            <h3 className="text-[16px] font-bold">爆款元素 &amp; 公式</h3>
          </div>
          <div className="p-6 space-y-5">
            {/* 元素列表 */}
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#002fa7] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                爆款元素
              </p>
              <div className="space-y-3">
                {generated.popularElements.map((el, i) => (
                  <div key={i} className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#002fa7] text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="text-[14px] font-bold text-[#111827]">{el.name}</span>
                    </div>
                    <p className="mb-1.5 text-[14px] leading-relaxed text-[#374151]">{el.main}</p>
                    <p className="text-[13px] leading-relaxed text-[#6b7280]">{el.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 爆款公式 */}
            <div className="rounded-xl border border-[#dbe2ff] bg-[#002fa7]/5 p-5">
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#002fa7] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                爆款公式
              </p>
              <p className="mb-3 text-[14px] font-bold text-[#111827]">{generated.popularFormula.title}</p>
              <div className="flex flex-wrap gap-2">
                {generated.popularFormula.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[#dbe2ff] bg-white px-3 py-1 text-[12px] font-semibold text-[#002fa7]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 一键仿写 ──────────────────────────────────────── */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-6 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit_note</span>
              </span>
              <h3 className="text-[16px] font-bold">一键仿写</h3>
            </div>
            <button
              type="button"
              onClick={handleRewriteCopy}
              aria-label="复制仿写文案"
              className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-white/25"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">content_copy</span>
              复制全文
            </button>
          </div>
          <div className="p-6 space-y-5">
            {/* 仿写主题输入 */}
            <div>
              <label
                htmlFor="va-rewrite"
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                仿写主题
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" aria-hidden="true">subject</span>
                  <input
                    id="va-rewrite"
                    type="text"
                    value={rewriteTopic}
                    onChange={(e) => setRewriteTopic(e.target.value)}
                    placeholder="输入仿写主题（选填，留空则沿用原文角度）"
                    className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRewriteGenerate}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-[#002fa7] px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
                  生成仿写
                </button>
              </div>
            </div>

            {/* 仿写结果展示 */}
            <div className="space-y-4">
              {/* 标题 */}
              <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#002fa7] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                  标题
                </p>
                <p className="text-[15px] font-bold text-[#111827]">{generated.rewriteResult.title}</p>
              </div>

              {/* 开头 */}
              <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#781621] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#781621] before:content-['']">
                  开头 · 黄金3秒
                </p>
                <p className="text-[14px] leading-relaxed text-[#374151]">{generated.rewriteResult.intro}</p>
              </div>

              {/* 正文 · 多段完整 */}
              <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#002fa7] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                  正文
                </p>
                <div className="space-y-3">
                  {generated.rewriteResult.body.map((para, i) => (
                    <p key={i} className="text-[14px] leading-relaxed text-[#374151]">{para}</p>
                  ))}
                </div>
              </div>

              {/* 转折/升华 */}
              <div className="rounded-xl border border-[#dbe2ff] bg-[#002fa7]/5 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#002fa7] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                  转折 · 升华
                </p>
                <p className="text-[14px] leading-relaxed text-[#374151]">{generated.rewriteResult.twist}</p>
              </div>

              {/* 结尾 */}
              <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#781621] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#781621] before:content-['']">
                  结尾 · 引导互动
                </p>
                <p className="text-[14px] leading-relaxed text-[#374151]">{generated.rewriteResult.ending}</p>
              </div>

              {/* 话题标签 */}
              <div className="rounded-xl border border-[#eef1f6] bg-[#f9faff] p-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#002fa7] before:h-2.5 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                  话题标签
                </p>
                <div className="flex flex-wrap gap-2">
                  {generated.rewriteResult.hashtags.split(' ').map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#dbe2ff] bg-white px-2.5 py-0.5 text-[12px] font-medium text-[#002fa7]"
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

      {/* ── 反馈 footer ─────────────────────────────────────── */}
      <div className="mt-8 flex items-center gap-3 border-t border-[#eef1f6] pt-6">
        <p className="text-[13px] text-[#9ca3af]">解析结果有帮助吗？</p>
        <button
          type="button"
          onClick={handleFeedbackUp}
          aria-label="有帮助"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">thumb_up</span>
        </button>
        <button
          type="button"
          onClick={handleFeedbackDown}
          aria-label="没有帮助"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:border-[#781621] hover:text-[#781621]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">thumb_down</span>
        </button>
      </div>
    </PioneerLayout>
  );
}
