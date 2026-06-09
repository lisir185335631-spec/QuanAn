/**
 * VideoAnalysis.tsx — /video-analysis · 爆款文案解析
 * 液态玻璃皮 · LiquidShell 外壳 · 逻辑零改动 · testid / htmlFor / id 全保留
 * 样板: Guide.tsx · 原语: home-next/ikb/system.tsx
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';

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

// ── 小工具:玻璃卡片 label bar ─────────────────────────────────────────────────

function LgLabel({ color = C.ikb, children }: { color?: string; children: React.ReactNode }) {
  return (
    <p
      style={{
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.26em',
        textTransform: 'uppercase',
        color,
        fontFamily: F.mono,
        textShadow: C.textShadow,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          height: 10,
          width: 2,
          borderRadius: 9999,
          background: color,
          flexShrink: 0,
        }}
        aria-hidden={true}
      />
      {children}
    </p>
  );
}

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

  // 爆款解析雷达六维数据 — 冷蓝/白双色交替
  const RADAR_DIMS_VA = [
    { label: '选题精准', value: 72, color: C.ikb },
    { label: '钩子强度', value: generated.hookAnalysis.score, color: 'rgba(255,255,255,0.85)' },
    { label: '叙事张力', value: 65, color: C.accent3 },
    { label: '元素密度', value: generated.popularElements.length * 30, color: C.ikb },
    { label: '情绪价值', value: 78, color: 'rgba(255,255,255,0.85)' },
    { label: '转化引导', value: 55, color: C.accent3 },
  ];

  // 黄金3秒注意力曲线
  const ATTENTION_DATA = [90, 75, 60, 55, 68, 72, 65, 58, 50, 62, 70, 55];
  const NARRATIVE_DATA = [40, 55, 70, 80, 75, 90, 85, 78, 88, 82, 76, 68];

  return (
    <LiquidShell>

      {/* ── Header ─────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
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
              创作引擎
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
              拆解器
            </span>
          </div>
          {/* 主标题 — 冷蓝渐变字 */}
          <h1
            style={{
              whiteSpace: 'nowrap',
              fontSize: 48,
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
            爆款文案解析
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
            粘贴爆款视频的完整文案/口播稿，AI 将深度拆解爆款密码，支持一键仿写生成同类高转化内容。
          </p>
        </div>
        {/* 右侧按钮组 */}
        <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'nowrap', gap: 12 }}>
          <button
            type="button"
            onClick={handleRewriteCopy}
            aria-label="复制仿写文案"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              borderRadius: 10,
              border: `0.5px solid ${C.line}`,
              background: 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(12px)',
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: C.ink,
              fontFamily: F.mono,
              cursor: 'pointer',
              transition: 'background 0.2s',
              textShadow: C.textShadow,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>content_copy</span>
            复制仿写
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!content.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              borderRadius: 12,
              border: `0.5px solid rgba(168,197,224,0.55)`,
              background: 'linear-gradient(135deg, rgba(168,197,224,0.45), rgba(120,160,220,0.35))',
              backdropFilter: 'blur(12px)',
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              fontFamily: F.mono,
              cursor: 'pointer',
              transition: 'background 0.2s',
              textShadow: C.textShadow,
              opacity: content.trim() ? 1 : 0.4,
            }}
            onMouseEnter={(e) => { if (content.trim()) (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(168,197,224,0.6), rgba(120,160,220,0.5))'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(168,197,224,0.45), rgba(120,160,220,0.35))'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>analytics</span>
            重新解析
          </button>
        </div>
      </Reveal>

      {/* ── 使用方法提示卡 ─────────────────────────────────── */}
      <Reveal style={{ marginBottom: 28 }}>
        <div
          className="lg-glass"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            borderRadius: 14,
            padding: 16,
          }}
        >
          <span className="material-symbols-outlined" style={{ marginTop: 2, flexShrink: 0, fontSize: 20, color: C.ikb }} aria-hidden={true}>info</span>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: C.purpleText, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>
            <span style={{ fontWeight: 700 }}>使用方法：</span>
            打开抖音/小红书/快手等 APP → 找到爆款视频 → 复制视频的完整口播文案/文字内容 → 粘贴到下方输入框 → 点击「开始深度解析」
          </p>
        </div>
      </Reveal>

      {/* ── 输入卡 ─────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 36 }}>
        <section
          className="lg-glass"
          style={{ overflow: 'hidden', borderRadius: 20, padding: 24, position: 'relative' }}
        >
          {/* 装饰光晕 */}
          <div
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              top: -48,
              right: -48,
              height: 160,
              width: 160,
              borderRadius: '50%',
              background: 'rgba(168,197,224,0.12)',
              filter: 'blur(40px)',
            }}
          />
          <div
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              bottom: -60,
              left: '33%',
              height: 160,
              width: 160,
              borderRadius: '50%',
              background: 'rgba(168,197,224,0.08)',
              filter: 'blur(40px)',
            }}
          />
          {/* 卡头 */}
          <div
            style={{
              position: 'relative',
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
                <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden={true}>content_paste_search</span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>输入文案内容</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>粘贴爆款文案 · AI 深度拆解爆款密码</p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 9999,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(168,197,224,0.18)',
                color: C.ikb,
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              <span
                style={{
                  height: 6,
                  width: 6,
                  borderRadius: '50%',
                  backgroundColor: C.ikb,
                  animation: 'ikb-pulse 2s ease-in-out infinite',
                }}
              />
              待解析
            </span>
          </div>
          {/* 表单 */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 视频标题 */}
            <div>
              <label
                htmlFor="va-title"
                style={{
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  color: C.ink,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    height: 14,
                    width: 3,
                    borderRadius: 9999,
                    background: 'linear-gradient(to bottom, #d4e6ff, #a8c5e0)',
                    flexShrink: 0,
                  }}
                  aria-hidden={true}
                />
                视频标题
                <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.72)' }}>（选填）</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.45)', pointerEvents: 'none' }}
                  aria-hidden={true}
                >
                  title
                </span>
                <input
                  id="va-title"
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="粘贴视频标题（可选）"
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: `0.5px solid ${C.line}`,
                    background: 'rgba(255,255,255,0.08)',
                    color: C.ink,
                    fontFamily: F.cn,
                    fontSize: 14,
                    padding: '12px 12px 12px 40px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 2px rgba(168,197,224,0.55)`; }}
                  onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* 文案内容 */}
            <div>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label
                  htmlFor="va-content"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      height: 14,
                      width: 3,
                      borderRadius: 9999,
                      background: 'linear-gradient(to bottom, #d4e6ff, #a8c5e0)',
                      flexShrink: 0,
                    }}
                    aria-hidden={true}
                  />
                  文案内容
                  <span style={{ marginLeft: 4, color: C.ikb }}>*</span>
                </label>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }} aria-hidden={true}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.ikb }} aria-hidden={true}>auto_awesome</span>
                  AI 据此拆解爆款结构
                </span>
              </div>
              <div
                style={{
                  overflow: 'hidden',
                  borderRadius: 12,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.06)',
                  transition: 'box-shadow 0.2s',
                }}
                onFocus={() => {}}
              >
                <textarea
                  id="va-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="粘贴完整口播文案/视频文字内容"
                  style={{
                    width: '100%',
                    resize: 'none',
                    border: 0,
                    background: 'transparent',
                    padding: 16,
                    fontSize: 14,
                    lineHeight: 1.65,
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
                    gap: 12,
                    borderTop: `0.5px solid ${C.line}`,
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>支持</span>
                    {['口播稿', '字幕', '描述文案', '评论区文案'].map((t) => (
                      <span
                        key={t}
                        style={{
                          borderRadius: 9999,
                          padding: '2px 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          background: 'rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.8)',
                          border: `0.5px solid ${C.line}`,
                          fontFamily: F.cn,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 11, fontFamily: F.mono, color: 'rgba(255,255,255,0.72)' }}>{content.length} 字</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Magnetic strength={0.3}>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!content.trim()}
                  className="lg-gradbtn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 9999,
                    padding: '12px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: F.cn,
                    cursor: content.trim() ? 'pointer' : 'not-allowed',
                    opacity: content.trim() ? 1 : 0.4,
                    border: 'none',
                    textShadow: C.textShadow,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>analytics</span>
                  开始深度解析
                </button>
              </Magnetic>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {/* 钩子评分 · 环形 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 18, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>anchor</span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                已分析
              </span>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                  {generated.hookAnalysis.score}
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>/{generated.hookAnalysis.maxScore}</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>钩子评分</p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%' }} role="img" aria-label={`钩子评分 ${generated.hookAnalysis.score} 分`}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.18)" strokeWidth="3.5" />
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
          </motion.div>
        </Item>

        {/* 爆款元素数 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 18, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>stars</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                已提取
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                {generated.popularElements.length}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}> 个</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>爆款元素</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
              {[40, 70, 55, 85, 65].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: 'rgba(255,255,255,0.45)' }} />
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 叙事结构 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 18, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.22)',
                  color: C.accent3,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>timeline</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.accent3,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                已识别
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                {generated.narrativeStructure.label}
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>叙事结构</p>
            </div>
            <div style={{ marginTop: 12, height: 6, width: '100%', borderRadius: 9999, background: 'rgba(168,197,224,0.15)' }}>
              <div style={{ height: 6, borderRadius: 9999, width: '45%', background: 'linear-gradient(to right, #d8e8ff, #a8c5e0)' }} />
            </div>
          </motion.div>
        </Item>

        {/* 仿写字数 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 18, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>edit_note</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                仿写就绪
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                {rewriteWordCount}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}> 字</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>仿写总字数</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['标题', '开头', '正文', '结尾'].map((k) => (
                <span
                  key={k}
                  style={{
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 600,
                    background: 'rgba(168,197,224,0.15)',
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── 解析结果区 ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── 选题策略 ──────────────────────────────────────── */}
        <Reveal>
          <section
            className="lg-glass"
            style={{ overflow: 'hidden', borderRadius: 20 }}
          >
            {/* 卡头 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 24px',
                background: 'linear-gradient(110deg, rgba(168,197,224,0.35) 0%, rgba(120,160,220,0.25) 100%)',
                borderBottom: `0.5px solid ${C.line}`,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  height: 32,
                  width: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.15)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }} aria-hidden={true}>target</span>
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>选题策略</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: 20 }}>
              {[
                { key: '内容分类', val: generated.topicStrategy.category, color: C.ikb },
                { key: '切入角度', val: generated.topicStrategy.angle, color: C.ikb },
                { key: '目标受众', val: generated.topicStrategy.targetAudience, color: 'rgba(255,255,255,0.85)' },
              ].map(({ key, val, color }) => (
                <div
                  key={key}
                  className="lg-glass"
                  style={{ borderRadius: 12, padding: 14 }}
                >
                  <LgLabel color={color}>{key}</LgLabel>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{val}</p>
                </div>
              ))}
              <div
                className="lg-glass"
                style={{ gridColumn: '1 / -1', borderRadius: 12, padding: 14 }}
              >
                <LgLabel color="rgba(255,255,255,0.85)">综合评估</LgLabel>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{generated.topicStrategy.evaluation}</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── 钩子分析 ──────────────────────────────────────── */}
        <Reveal>
          <section
            className="lg-glass"
            style={{ overflow: 'hidden', borderRadius: 20 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 24px',
                background: 'linear-gradient(to right, rgba(255,255,255,0.15), rgba(168,197,224,0.2))',
                borderBottom: `0.5px solid ${C.line}`,
              }}
            >
              <span style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }} aria-hidden={true}>anchor</span>
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>钩子分析</h3>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: '0 1px 4px rgba(6,14,38,.9),0 0 16px rgba(6,14,38,.55)' }}>
                    {generated.hookAnalysis.score}
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>/{generated.hookAnalysis.maxScore}</span>
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 9999,
                      padding: '4px 12px',
                      fontSize: 13,
                      fontWeight: 700,
                      background: 'rgba(168,197,224,0.18)',
                      color: C.ikb,
                      fontFamily: F.mono,
                      textShadow: C.textShadow,
                    }}
                  >
                    {generated.hookAnalysis.type}
                  </span>
                  <div style={{ marginTop: 8, height: 6, width: 192, borderRadius: 9999, background: 'rgba(168,197,224,0.15)' }}>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 9999,
                        width: `${(generated.hookAnalysis.score / generated.hookAnalysis.maxScore) * 100}%`,
                        background: 'linear-gradient(to right, #d4e6ff, #a8c5e0)',
                      }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="lg-glass" style={{ borderRadius: 12, padding: 14 }}>
                  <LgLabel color={C.ikb}>钩子技法</LgLabel>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{generated.hookAnalysis.technique}</p>
                </div>
                <div className="lg-glass" style={{ borderRadius: 12, padding: 14 }}>
                  <LgLabel color="rgba(255,255,255,0.85)">效果评估</LgLabel>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{generated.hookAnalysis.evaluation}</p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── 叙事结构 ──────────────────────────────────────── */}
        <Reveal>
          <section
            className="lg-glass"
            style={{ overflow: 'hidden', borderRadius: 20 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 24px',
                background: 'linear-gradient(to right, rgba(168,197,224,0.3), rgba(168,197,224,0.15))',
                borderBottom: `0.5px solid ${C.line}`,
              }}
            >
              <span style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }} aria-hidden={true}>timeline</span>
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>叙事结构</h3>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 9999,
                    padding: '6px 16px',
                    fontSize: 14,
                    fontWeight: 700,
                    background: 'rgba(168,197,224,0.2)',
                    color: C.accent3,
                    fontFamily: F.mono,
                    textShadow: C.textShadow,
                  }}
                >
                  {generated.narrativeStructure.label}
                </span>
              </div>
              <div style={{ marginBottom: 18 }}>
                <LgLabel color={C.ikb}>叙事时间线</LgLabel>
                <ol style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
                  {generated.narrativeStructure.timeline.map((step, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span
                        style={{
                          marginTop: 2,
                          display: 'flex',
                          height: 24,
                          width: 24,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#fff',
                          background: 'linear-gradient(135deg, rgba(168,197,224,0.6), rgba(120,160,220,0.4))',
                          fontFamily: F.mono,
                          textShadow: C.textShadow,
                        }}
                      >
                        {i + 1}
                      </span>
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="lg-glass" style={{ borderRadius: 12, padding: 14 }}>
                <LgLabel color="rgba(255,255,255,0.85)">节奏评估</LgLabel>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{generated.narrativeStructure.evaluation}</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── 爆款元素 + 公式 ───────────────────────────────── */}
        <Reveal>
          <section
            className="lg-glass"
            style={{ overflow: 'hidden', borderRadius: 20 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 24px',
                background: 'linear-gradient(to right, rgba(168,197,224,0.35), rgba(255,255,255,0.15))',
                borderBottom: `0.5px solid ${C.line}`,
              }}
            >
              <span style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }} aria-hidden={true}>stars</span>
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>爆款元素 &amp; 公式</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 20 }}>
              {/* 元素列表 */}
              <div>
                <LgLabel color={C.ikb}>爆款元素</LgLabel>
                <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 4 }}>
                  {generated.popularElements.map((el, i) => (
                    <Item key={i} style={{ height: '100%' }}>
                      <div className="lg-glass" style={{ borderRadius: 12, padding: 14, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              display: 'flex',
                              height: 24,
                              width: 24,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#fff',
                              background: 'linear-gradient(135deg, rgba(168,197,224,0.6), rgba(120,160,220,0.4))',
                              fontFamily: F.mono,
                              textShadow: C.textShadow,
                            }}
                          >
                            {i + 1}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{el.name}</span>
                        </div>
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: '0 0 6px' }}>{el.main}</p>
                        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0, marginTop: 'auto' }}>{el.note}</p>
                      </div>
                    </Item>
                  ))}
                </RevealGroup>
              </div>

              {/* 爆款公式 */}
              <div
                className="lg-glass"
                style={{ borderRadius: 14, padding: 18 }}
              >
                <LgLabel color={C.ikb}>爆款公式</LgLabel>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: '0 0 12px', textShadow: C.textShadow }}>{generated.popularFormula.title}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {generated.popularFormula.chips.map((chip) => (
                    <span
                      key={chip}
                      style={{
                        borderRadius: 9999,
                        border: `0.5px solid rgba(168,197,224,0.4)`,
                        background: 'rgba(168,197,224,0.12)',
                        padding: '4px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.ikb,
                        fontFamily: F.cn,
                        textShadow: C.textShadow,
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── 一键仿写 ──────────────────────────────────────── */}
        <Reveal>
          <section
            className="lg-glass"
            style={{ overflow: 'hidden', borderRadius: 20 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                background: 'linear-gradient(110deg, rgba(168,197,224,0.35) 0%, rgba(120,160,220,0.25) 100%)',
                borderBottom: `0.5px solid ${C.line}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.15)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }} aria-hidden={true}>edit_note</span>
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>一键仿写</h3>
              </div>
              <button
                type="button"
                onClick={handleRewriteCopy}
                aria-label="复制仿写文案"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  fontFamily: F.mono,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  textShadow: C.textShadow,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>content_copy</span>
                复制全文
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 20 }}>
              {/* 仿写主题输入 */}
              <div>
                <label
                  htmlFor="va-rewrite"
                  style={{
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      height: 14,
                      width: 3,
                      borderRadius: 9999,
                      background: 'linear-gradient(to bottom, #d4e6ff, #a8c5e0)',
                      flexShrink: 0,
                    }}
                    aria-hidden={true}
                  />
                  仿写主题
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.45)', pointerEvents: 'none' }}
                      aria-hidden={true}
                    >
                      subject
                    </span>
                    <input
                      id="va-rewrite"
                      type="text"
                      value={rewriteTopic}
                      onChange={(e) => setRewriteTopic(e.target.value)}
                      placeholder="输入仿写主题（选填，留空则沿用原文角度）"
                      style={{
                        width: '100%',
                        borderRadius: 10,
                        border: `0.5px solid ${C.line}`,
                        background: 'rgba(255,255,255,0.08)',
                        color: C.ink,
                        fontFamily: F.cn,
                        fontSize: 14,
                        padding: '12px 12px 12px 40px',
                        outline: 'none',
                        transition: 'box-shadow 0.2s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 2px rgba(168,197,224,0.55)`; }}
                      onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'none'; }}
                    />
                  </div>
                  <Magnetic strength={0.3}>
                    <button
                      type="button"
                      onClick={handleRewriteGenerate}
                      className="lg-gradbtn"
                      style={{
                        display: 'inline-flex',
                        flexShrink: 0,
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 9999,
                        padding: '12px 24px',
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#fff',
                        fontFamily: F.cn,
                        cursor: 'pointer',
                        border: 'none',
                        textShadow: C.textShadow,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>auto_awesome</span>
                      生成仿写
                    </button>
                  </Magnetic>
                </div>
              </div>

              {/* 仿写结果展示 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* 标题 */}
                <div className="lg-glass" style={{ borderRadius: 12, padding: 14 }}>
                  <LgLabel color={C.ikb}>标题</LgLabel>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{generated.rewriteResult.title}</p>
                </div>

                {/* 开头 */}
                <div className="lg-glass" style={{ borderRadius: 12, padding: 14 }}>
                  <LgLabel color="rgba(255,255,255,0.85)">开头 · 黄金3秒</LgLabel>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{generated.rewriteResult.intro}</p>
                </div>

                {/* 正文 */}
                <div className="lg-glass" style={{ borderRadius: 12, padding: 14 }}>
                  <LgLabel color={C.ikb}>正文</LgLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {generated.rewriteResult.body.map((para, i) => (
                      <p key={i} style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{para}</p>
                    ))}
                  </div>
                </div>

                {/* 转折/升华 */}
                <div
                  className="lg-glass"
                  style={{ borderRadius: 12, padding: 14, background: 'rgba(168,197,224,0.12)' }}
                >
                  <LgLabel color={C.ikb}>转折 · 升华</LgLabel>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{generated.rewriteResult.twist}</p>
                </div>

                {/* 结尾 */}
                <div className="lg-glass" style={{ borderRadius: 12, padding: 14 }}>
                  <LgLabel color="rgba(255,255,255,0.85)">结尾 · 引导互动</LgLabel>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{generated.rewriteResult.ending}</p>
                </div>

                {/* 话题标签 */}
                <div className="lg-glass" style={{ borderRadius: 12, padding: 14 }}>
                  <LgLabel color={C.ikb}>话题标签</LgLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {generated.rewriteResult.hashtags.split(' ').map((tag) => (
                      <span
                        key={tag}
                        style={{
                          borderRadius: 9999,
                          border: `0.5px solid rgba(168,197,224,0.4)`,
                          background: 'rgba(168,197,224,0.12)',
                          padding: '2px 10px',
                          fontSize: 12,
                          fontWeight: 500,
                          color: C.ikb,
                          fontFamily: F.cn,
                          textShadow: C.textShadow,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      {/* ── 数据洞察 band ──────────────────────────────────── */}
      <Reveal style={{ marginTop: 32 }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 9999,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              background: 'rgba(168,197,224,0.18)',
              color: C.ikb,
              fontFamily: F.mono,
              textShadow: C.textShadow,
            }}
          >
            <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb }} />
            模型已就绪
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20, marginBottom: 28 }}>
          {/* 爆款解析雷达 */}
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 24 }}
          >
            <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>radar</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>爆款解析雷达</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>六维模型评估</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    lineHeight: 1,
                    margin: 0,
                    fontFamily: F.display,
                    background: C.grad,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                    textShadow: 'none',
                  }}
                >
                  {Math.round(RADAR_DIMS_VA.reduce((acc, d) => acc + d.value, 0) / RADAR_DIMS_VA.length)}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: F.mono }}>综合分</p>
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
                <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="爆款解析雷达图">
                  <defs>
                    <linearGradient id="va-radarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4e6ff" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#a8c5e0" stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = pt(i, R);
                    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
                  })}
                  <polygon points={dataPoly} fill="url(#va-radarFill)" stroke="#d4e6ff" strokeWidth="2" strokeLinejoin="round" />
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R * (Math.min(d.value, 100) / 100));
                    return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
                  })}
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R + 16);
                    return (
                      <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.75)" fontSize="10.5" fontWeight="600">
                        {d.label}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {RADAR_DIMS_VA.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ height: 8, width: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: d.color }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono, textShadow: C.textShadow }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 黄金3秒 + 叙事节奏趋势 */}
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 24 }}
          >
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>show_chart</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>黄金3秒注意力曲线 / 叙事节奏</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>注意力留存 vs 叙事张力对比</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {['注意力', '叙事'].map((t, i) => (
                  <span
                    key={t}
                    style={i === 0
                      ? { borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: C.ikb, color: '#0a1628', fontFamily: F.mono }
                      : { borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }
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
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
                  <defs>
                    <linearGradient id="va-trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4e6ff" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#d4e6ff" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="va-trendLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#d4e6ff" />
                      <stop offset="100%" stopColor="#a8c5e0" />
                    </linearGradient>
                  </defs>
                  {[0, 0.33, 0.66, 1].map((f) => (
                    <line
                      key={f}
                      x1={padL}
                      x2={W - padR}
                      y1={(padT + innerH * f).toFixed(1)}
                      y2={(padT + innerH * f).toFixed(1)}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  ))}
                  <path d={area1} fill="url(#va-trendFill)" />
                  <path d={line1} fill="none" stroke="url(#va-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={line2} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
                  {ATTENTION_DATA.map((v, i) =>
                    i % 3 === 0 ? <circle key={i} cx={x(i)} cy={yFn(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke="#d4e6ff" strokeWidth="2" /> : null,
                  )}
                </svg>
              );
            })()}
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 10, color: 'rgba(255,255,255,0.72)', fontFamily: F.mono }}>
              {['开头', '第2节', '第3节', '第4节', '第5节', '第6节', '第7节', '第8节', '第9节', '第10节', '第11节', '结尾'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </Reveal>

      {/* ── 反馈 footer ─────────────────────────────────────── */}
      <div
        style={{
          marginTop: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderTop: `0.5px solid ${C.line}`,
          paddingTop: 24,
        }}
      >
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>解析结果有帮助吗？</p>
        <button
          type="button"
          onClick={handleFeedbackUp}
          aria-label="有帮助"
          style={{
            display: 'flex',
            height: 36,
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            border: `0.5px solid ${C.line}`,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = C.ikb;
            el.style.color = C.ikb;
            el.style.background = 'rgba(168,197,224,0.15)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = C.line;
            el.style.color = 'rgba(255,255,255,0.8)';
            el.style.background = 'rgba(255,255,255,0.08)';
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>thumb_up</span>
        </button>
        <button
          type="button"
          onClick={handleFeedbackDown}
          aria-label="没有帮助"
          style={{
            display: 'flex',
            height: 36,
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            border: `0.5px solid ${C.line}`,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = C.ikb;
            el.style.color = C.ikb;
            el.style.background = 'rgba(168,197,224,0.15)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = C.line;
            el.style.color = 'rgba(255,255,255,0.8)';
            el.style.background = 'rgba(255,255,255,0.08)';
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>thumb_down</span>
        </button>
      </div>

    </LiquidShell>
  );
}
