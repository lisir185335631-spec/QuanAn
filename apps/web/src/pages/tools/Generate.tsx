/**
 * Generate.tsx — /generate 生成爆款文案 · 液态玻璃 iOS 26 风格
 * 逻辑零改动 · testid 全保留 · 只换皮
 * 参考样板: Guide.tsx (同系液态玻璃页)
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import { HOT_ELEMENT_GROUPS, ALL_ELEMENTS } from '@/lib/constants/elements';
import {
  GENERATE_H1,
  GENERATE_SUBTITLE,
  GENERATE_SCRIPT_TITLE,
  GENERATE_ELEMENTS_TITLE,
  GENERATE_TOPIC_TITLE,
  GENERATE_TOPIC_DEFAULT,
  GENERATE_TOPIC_MAXLEN,
  GENERATE_CTA,
  GENERATE_RESULT_TITLE,
  GENERATE_BTN_COPY,
  GENERATE_BTN_AI_OPT,
  GENERATE_BTN_RESTART,
  GENERATE_RESULT_PARAGRAPHS,
  GENERATE_FEEDBACK_PROMPT,
  GENERATE_DEFAULT_SCRIPT_KEY,
  GENERATE_DEFAULT_ELEMENT_KEYS,
} from '@/lib/constants/generatePage';
import { SCRIPT_TYPES } from '@/lib/constants/scripts';

// ── Script type icons (Material Symbols) ─────────────────────────────────────
const SCRIPT_TYPE_ICONS: Record<string, string> = {
  opinion:    'record_voice_over',
  process:    'play_circle',
  knowledge:  'school',
  story:      'auto_stories',
  comedy:     'sentiment_very_satisfied',
  product:    'shopping_bag',
  review:     'rate_review',
  expose:     'lock_open',
  challenge:  'emoji_events',
  interview:  'mic',
  daily:      'photo_camera',
  transform:  'change_circle',
  debate:     'forum',
  list:       'checklist',
  reaction:   'emoji_emotions',
  qna:        'question_answer',
  collab:     'group',
  behind:     'movie',
  trend_news: 'whatshot',
  motivation: 'bolt',
};

// ── Category colors — 液态玻璃冷蓝体系轮转 ───────────────────────────────────
const CATEGORY_COLORS: Record<string, { dot: string; text: string }> = {
  classic:    { dot: C.ikb,          text: C.ikb },
  emotion:    { dot: C.burgundy,      text: C.burgundyText },
  content:    { dot: C.accent3,       text: C.purpleText },
  conversion: { dot: C.ikb,          text: C.ikb },
};

// ── Element icon map (Material Symbols) ──────────────────────────────────────
const ELEMENT_ICONS: Record<string, string> = {
  greed:           'monetization_on',
  fear:            'warning',
  curiosity:       'search',
  contrast:        'compare_arrows',
  worst:           'error_outline',
  leverage:        'local_fire_department',
  resonance:       'chat_bubble',
  empathy:         'handshake',
  small_big:       'track_changes',
  low_cost_high:   'trending_up',
  low_cost_unknown:'casino',
  anger:           'mood_bad',
  surprise:        'celebration',
  trend:           'whatshot',
  controversy:     'gavel',
  reveal:          'lock_open',
  list:            'checklist',
  challenge:       'emoji_events',
  transformation:  'change_circle',
  scarcity:        'hourglass_bottom',
  social_proof:    'thumb_up',
  authority:       'workspace_premium',
  benefit:         'card_giftcard',
};

// ── KPI / insight constants (文案爆款力雷达) ─────────────────────────────────
const RADAR_DIMS_GN = [
  { label: '钩子强度', value: 86, color: C.ikb },
  { label: '情绪张力', value: 79, color: C.burgundy },
  { label: '价值密度', value: 88, color: C.accent3 },
  { label: '转化引导', value: 82, color: C.ikb },
  { label: '记忆点',   value: 75, color: C.burgundy },
  { label: '传播性',   value: 91, color: C.accent3 },
];

const TREND_DATA_GN = [72, 65, 88, 70, 82, 76, 90, 85, 79, 93, 88, 96];
// 使用中性数字标签，避免与页面元素文字产生 getByText 冲突
const TREND_LABELS_GN = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

// Total elements count
const TOTAL_ELEMENTS = ALL_ELEMENTS.length;

// Full generated result text (for word count KPI)
const RESULT_FULL_TEXT = GENERATE_RESULT_PARAGRAPHS.map((p) => p.label + p.body).join('\n\n');

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Generate() {
  const [scriptKey, setScriptKey] = useState<string>(GENERATE_DEFAULT_SCRIPT_KEY);
  const [elementKeys, setElementKeys] = useState<string[]>([...GENERATE_DEFAULT_ELEMENT_KEYS]);
  const [topic, setTopic] = useState<string>(GENERATE_TOPIC_DEFAULT);

  const currentScript = SCRIPT_TYPES.find((t) => t.key === scriptKey);

  function handleToggleElement(key: string) {
    setElementKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function handleGenerate() {
    toast.success('已生成爆款文案');
  }

  function handleCopyResult() {
    navigator.clipboard.writeText(RESULT_FULL_TEXT).then(
      () => toast.success('已复制文案'),
      () => toast.error('复制失败，请手动选取'),
    );
  }

  function handleOptimize() {
    toast.success('已 AI 优化文案');
  }

  function handleRestart() {
    setScriptKey(GENERATE_DEFAULT_SCRIPT_KEY);
    setElementKeys([...GENERATE_DEFAULT_ELEMENT_KEYS]);
    setTopic(GENERATE_TOPIC_DEFAULT);
    toast.info('重新开始');
  }

  return (
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <Reveal>
        <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
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
                工具
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
                文案引擎
              </span>
            </div>
            {/* 主标题 — 冷蓝渐变字 */}
            <h1
              style={{
                whiteSpace: 'nowrap',
                fontSize: 52,
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
              {GENERATE_H1}
            </h1>
            <p
              style={{
                marginTop: 10,
                maxWidth: 820,
                fontSize: 16,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.75)',
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              {GENERATE_SUBTITLE}
            </p>
          </div>
          {/* 右侧操作按钮 */}
          <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'nowrap', gap: 12 }}>
            <motion.button
              type="button"
              aria-label="智能优化"
              onClick={handleOptimize}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.ink,
                fontFamily: F.mono,
                background: 'rgba(255,255,255,0.10)',
                border: `0.5px solid ${C.line}`,
                cursor: 'pointer',
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>auto_fix_high</span>
              智能优化
            </motion.button>
            <motion.button
              type="button"
              aria-label="复制全部文案"
              onClick={handleCopyResult}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                fontFamily: F.mono,
                background: C.grad,
                border: 'none',
                cursor: 'pointer',
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>content_copy</span>
              复制文案
            </motion.button>
          </div>
        </header>
      </Reveal>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {/* 脚本类型 · 环形 · 冷蓝 */}
        <Item>
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
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>description</span>
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
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden={true}>trending_up</span>全覆盖
              </span>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>
                  {SCRIPT_TYPES.length}
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}> 种</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn, margin: '6px 0 0' }}>脚本类型</p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }} role="img" aria-label="脚本类型覆盖率环形图">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.18)" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={C.ikb}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(100, Math.round((SCRIPT_TYPES.length / 20) * 100))} 100`}
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </Item>

        {/* 爆款元素 · 迷你柱 · 白 */}
        <Item>
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
                  background: 'rgba(255,255,255,0.12)',
                  color: C.burgundy,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>local_fire_department</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.12)',
                  color: C.burgundyText,
                  fontFamily: F.mono,
                }}
              >
                元素库
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>
                {TOTAL_ELEMENTS}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}> 个</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn, margin: '6px 0 0' }}>爆款元素</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }} aria-hidden={true}>
              {[58, 84, 70, 96, 78].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: 'rgba(255,255,255,0.35)' }} />
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 已选元素 · 进度条 · 冷蓝 */}
        <Item>
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
                  color: C.accent3,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>check_circle</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.purpleText,
                  fontFamily: F.mono,
                }}
              >
                已选
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>
                {elementKeys.length}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}> 个</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn, margin: '6px 0 0' }}>已选元素</p>
            </div>
            <div style={{ marginTop: 12, height: 6, width: '100%', borderRadius: 9999, background: 'rgba(168,197,224,0.18)' }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 9999,
                  width: `${Math.min(100, TOTAL_ELEMENTS > 0 ? Math.round((elementKeys.length / TOTAL_ELEMENTS) * 100) : 0)}%`,
                  background: C.grad,
                }}
              />
            </div>
          </motion.div>
        </Item>

        {/* 文案字数 · chip · 冷蓝 */}
        <Item>
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
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>article</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                {RESULT_FULL_TEXT.length} 字
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>
                {RESULT_FULL_TEXT.length}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}> 字</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn, margin: '6px 0 0' }}>文案字数</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }} aria-hidden={true}>
              {['钩子', '洞察', '转化'].map((k) => (
                <span
                  key={k}
                  style={{
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 600,
                    background: 'rgba(168,197,224,0.18)',
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

      {/* ── 2 列配置区(固定 grid-cols-2 · 禁断点) ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
        {/* 左列:脚本类型 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── GenerateScriptPicker inline ── */}
          <Reveal>
            <section
              className="lg-glass"
              style={{ overflow: 'hidden', borderRadius: 20, padding: 24 }}
            >
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 38,
                    width: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>description</span>
                </span>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, margin: 0 }}>{GENERATE_SCRIPT_TITLE}</h2>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn, margin: 0 }}>选择适合的内容框架</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SCRIPT_TYPES.map((type) => {
                  const active = scriptKey === type.key;
                  return (
                    <motion.button
                      type="button"
                      key={type.key}
                      aria-pressed={active}
                      data-state={active ? 'active' : 'inactive'}
                      onClick={() => setScriptKey(type.key)}
                      whileHover={{ y: -2 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                      className={active ? undefined : 'lg-glass'}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        gap: 12,
                        overflow: 'hidden',
                        borderRadius: 14,
                        padding: '12px 14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: active ? `0.5px solid rgba(168,197,224,0.6)` : `0.5px solid ${C.line}`,
                        background: active ? 'rgba(168,197,224,0.22)' : 'rgba(255,255,255,0.06)',
                        transition: 'background 0.2s, border-color 0.2s',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          height: 40,
                          width: 40,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 10,
                          background: active
                            ? C.grad
                            : 'rgba(255,255,255,0.10)',
                          color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden={true}>{SCRIPT_TYPE_ICONS[type.key] ?? 'article'}</span>
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{type.label}</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>{type.desc}</span>
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          height: 16,
                          width: 16,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          background: active ? C.ikb : 'transparent',
                          border: active ? 'none' : `0.5px solid ${C.line}`,
                          color: active ? '#fff' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden={true}>check</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          </Reveal>
        </div>

        {/* 右列:爆款元素 + 文案主题 + 生成结果 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── GenerateElementsPicker inline ── */}
          <Reveal>
            <section
              className="lg-glass"
              style={{ overflow: 'hidden', borderRadius: 20, padding: 20 }}
            >
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 38,
                    width: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.12)',
                    color: C.burgundy,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>local_fire_department</span>
                </span>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, margin: 0 }}>{GENERATE_ELEMENTS_TITLE}</h2>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn, margin: 0 }}>多选 · 已选 {elementKeys.length} 个</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {HOT_ELEMENT_GROUPS.map((cat) => {
                  const cc = CATEGORY_COLORS[cat.key] ?? CATEGORY_COLORS['classic']!;
                  return (
                    <div key={cat.key}>
                      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: cc.text, textShadow: C.textShadow }}>
                        <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: cc.dot, flexShrink: 0 }} />
                        {cat.label}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {cat.items.map((el) => {
                          const selected = elementKeys.includes(el.key);
                          return (
                            <motion.button
                              type="button"
                              key={el.key}
                              aria-pressed={selected}
                              data-state={selected ? 'active' : 'inactive'}
                              onClick={() => handleToggleElement(el.key)}
                              whileHover={{ y: -2 }}
                              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                borderRadius: 10,
                                padding: '6px 10px',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: selected
                                  ? `0.5px solid rgba(168,197,224,0.55)`
                                  : `0.5px solid ${C.line}`,
                                background: selected
                                  ? 'rgba(168,197,224,0.22)'
                                  : 'rgba(255,255,255,0.06)',
                                color: selected ? C.ikb : 'rgba(255,255,255,0.6)',
                                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>{ELEMENT_ICONS[el.key] ?? 'label'}</span>
                              {el.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </Reveal>

          {/* ── GenerateTopicForm inline ── */}
          <Reveal>
            <section
              className="lg-glass"
              style={{ overflow: 'hidden', borderRadius: 20, padding: 20 }}
            >
              <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label
                  htmlFor="gn-topic"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      marginRight: 4,
                      display: 'inline-block',
                      height: 14,
                      width: 4,
                      borderRadius: 9999,
                      background: C.grad,
                      flexShrink: 0,
                    }}
                    aria-hidden={true}
                  />
                  {GENERATE_TOPIC_TITLE}
                </label>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.ikb }} aria-hidden={true}>auto_awesome</span>
                  AI 据此生成爆款文案
                </span>
              </div>
              <div
                style={{
                  overflow: 'hidden',
                  borderRadius: 14,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.06)',
                  transition: 'box-shadow 0.2s',
                }}
                onFocusCapture={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = `0 0 0 1.5px rgba(168,197,224,0.6)`;
                }}
                onBlurCapture={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = '';
                }}
              >
                <textarea
                  id="gn-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={GENERATE_TOPIC_MAXLEN}
                  rows={4}
                  placeholder="输入文案主题，例如：如何在3天内涨粉1万"
                  style={{
                    display: 'block',
                    width: '100%',
                    resize: 'none',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    padding: '14px 16px',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: C.ink,
                    fontFamily: F.cn,
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
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: F.cn }}>支持中英文 · 越具体效果越好</span>
                  <span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: F.mono }}>{topic.length}/{GENERATE_TOPIC_MAXLEN}</span>
                </div>
              </div>
              {currentScript && (
                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 12,
                    padding: '10px 14px',
                    border: `0.5px solid rgba(168,197,224,0.35)`,
                    background: 'rgba(168,197,224,0.12)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.ikb }} aria-hidden={true}>{SCRIPT_TYPE_ICONS[currentScript.key] ?? 'article'}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>当前：{currentScript.label}</span>
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>{currentScript.desc}</span>
                  </div>
                </div>
              )}
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <motion.button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!topic.trim()}
                  whileHover={topic.trim() ? { y: -3 } : undefined}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 14,
                    padding: '12px 32px',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#fff',
                    fontFamily: F.mono,
                    background: topic.trim() ? C.grad : 'rgba(255,255,255,0.12)',
                    border: 'none',
                    cursor: topic.trim() ? 'pointer' : 'not-allowed',
                    opacity: topic.trim() ? 1 : 0.4,
                    textShadow: C.textShadow,
                    transition: 'opacity 0.2s, background 0.2s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>auto_awesome</span>
                  {topic.trim() ? GENERATE_CTA : '请输入主题'}
                </motion.button>
              </div>
            </section>
          </Reveal>

          {/* ── GenerateResult inline ── */}
          <Reveal>
            <section
              className="lg-glass"
              style={{ overflow: 'hidden', borderRadius: 20 }}
            >
              {/* 结果头部 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `0.5px solid ${C.line}`,
                  padding: '18px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 38,
                      width: 38,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 12,
                      background: C.grad,
                      color: '#fff',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>article</span>
                  </span>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, margin: 0 }}>{GENERATE_RESULT_TITLE}</h2>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn, margin: 0 }}>基于「{currentScript?.label ?? '脚本类型'}」框架 · AI 深度生成</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.button
                    type="button"
                    onClick={handleCopyResult}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 10,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      border: `0.5px solid ${C.line}`,
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.75)',
                      fontFamily: F.cn,
                      cursor: 'pointer',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>content_copy</span>
                    {GENERATE_BTN_COPY}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleOptimize}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 10,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      border: `0.5px solid rgba(168,197,224,0.55)`,
                      background: 'rgba(168,197,224,0.15)',
                      color: C.ikb,
                      fontFamily: F.cn,
                      cursor: 'pointer',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>auto_fix_high</span>
                    {GENERATE_BTN_AI_OPT}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleRestart}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 10,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      border: `0.5px solid ${C.line}`,
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.75)',
                      fontFamily: F.cn,
                      cursor: 'pointer',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>refresh</span>
                    {GENERATE_BTN_RESTART}
                  </motion.button>
                </div>
              </div>

              {/* 8 段 mock 文案 · 渐变 chip 头 · whitespace-pre-wrap · 无 line-clamp */}
              <div>
                {GENERATE_RESULT_PARAGRAPHS.map((para, idx) => {
                  // 三色轮转: 冷蓝 → 白半透 → 浅蓝 → 冷蓝
                  const chipSchemes = [
                    { bg: C.grad, text: '#fff' },
                    { bg: 'linear-gradient(135deg,rgba(255,255,255,0.55),rgba(200,220,255,0.45))', text: '#fff' },
                    { bg: 'linear-gradient(135deg,rgba(168,197,224,0.6),rgba(120,160,220,0.5))', text: '#fff' },
                  ];
                  const cs = chipSchemes[idx % chipSchemes.length]!;
                  return (
                    <div
                      key={para.label}
                      style={{
                        padding: '18px 24px',
                        ...(idx < GENERATE_RESULT_PARAGRAPHS.length - 1
                          ? { borderBottom: `0.5px solid ${C.line}` }
                          : {}),
                      }}
                    >
                      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            background: cs.bg,
                            color: cs.text,
                            fontFamily: F.mono,
                            textShadow: C.textShadow,
                          }}
                        >
                          {para.label}
                        </span>
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>
                        {para.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 底部反馈 row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderTop: `0.5px solid ${C.line}`,
                  padding: '12px 24px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: F.cn,
                }}
              >
                <span>{GENERATE_FEEDBACK_PROMPT}</span>
                <motion.button
                  type="button"
                  aria-label="有帮助"
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    borderRadius: 8,
                    padding: '4px 8px',
                    fontSize: 12,
                    border: `0.5px solid ${C.line}`,
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>thumb_up</span>
                  有帮助
                </motion.button>
                <motion.button
                  type="button"
                  aria-label="无帮助"
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    borderRadius: 8,
                    padding: '4px 8px',
                    fontSize: 12,
                    border: `0.5px solid ${C.line}`,
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>thumb_down</span>
                  无帮助
                </motion.button>
              </div>
            </section>
          </Reveal>
        </div>
      </div>

      {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
      <Reveal style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, margin: 0 }}>数据洞察</h2>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 9999,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            background: 'rgba(168,197,224,0.18)',
            color: C.ikb,
            fontFamily: F.mono,
          }}
        >
          <span
            style={{
              height: 6,
              width: 6,
              borderRadius: '50%',
              backgroundColor: C.ikb,
              display: 'inline-block',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          模型已就绪
        </span>
      </Reveal>

      <RevealGroup style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, marginBottom: 32 }}>
        {/* 文案爆款力雷达 */}
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
                    display: 'flex',
                    height: 38,
                    width: 38,
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
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, margin: 0 }}>文案爆款力雷达</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn, margin: 0 }}>六维模型评估</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    lineHeight: 1,
                    fontFamily: F.display,
                    margin: 0,
                    background: C.grad,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }}
                >
                  84
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: F.mono, margin: 0 }}>综合分</p>
              </div>
            </div>
            {(() => {
              const dims = RADAR_DIMS_GN;
              const cx = 130;
              const cy = 122;
              const R = 88;
              const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
              const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
              const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
              const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
              return (
                <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="文案爆款力雷达图">
                  <defs>
                    <linearGradient id="gen-radarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4e6ff" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#7fb0e6" stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = pt(i, R);
                    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.10)" strokeWidth="1" />;
                  })}
                  <polygon points={dataPoly} fill="url(#gen-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R * (d.value / 100));
                    return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
                  })}
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R + 16);
                    return (
                      <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.65)" fontSize="10.5" fontWeight="600">
                        {d.label}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {RADAR_DIMS_GN.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono, textShadow: C.textShadow }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 文案结构曲线 */}
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
                    display: 'flex',
                    height: 38,
                    width: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.12)',
                    color: C.burgundy,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>show_chart</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, margin: 0 }}>文案结构曲线</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn, margin: 0 }}>近 12 周文案结构趋势</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {['权重', '强度', '转化'].map((t, i) => (
                  <span
                    key={t}
                    style={{
                      borderRadius: 8,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      background: i === 0 ? C.ikb : 'rgba(255,255,255,0.10)',
                      color: i === 0 ? '#fff' : 'rgba(255,255,255,0.6)',
                      fontFamily: F.mono,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>96</p>
              <span
                style={{
                  marginBottom: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 9999,
                  padding: '3px 8px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>trending_up</span>+230%
              </span>
              <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>较基准值</span>
            </div>
            {(() => {
              const data = TREND_DATA_GN;
              const W = 560;
              const H = 168;
              const padL = 6;
              const padR = 6;
              const padT = 12;
              const padB = 8;
              const innerW = W - padL - padR;
              const innerH = H - padT - padB;
              const max = 110;
              const x = (i: number) => padL + (innerW * i) / (data.length - 1);
              const y = (v: number) => padT + innerH * (1 - v / max);
              const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
              const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
              return (
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label="文案结构曲线图">
                  <defs>
                    <linearGradient id="gen-trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4e6ff" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#d4e6ff" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gen-trendLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#d4e6ff" />
                      <stop offset="55%" stopColor="#a8c5e0" />
                      <stop offset="100%" stopColor="#7fb0e6" />
                    </linearGradient>
                  </defs>
                  {[0, 0.33, 0.66, 1].map((f) => (
                    <line
                      key={f}
                      x1={padL}
                      x2={W - padR}
                      y1={(padT + innerH * f).toFixed(1)}
                      y2={(padT + innerH * f).toFixed(1)}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                  ))}
                  <path d={area} fill="url(#gen-trendFill)" />
                  <path d={line} fill="none" stroke="url(#gen-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((v, i) =>
                    i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" /> : null,
                  )}
                </svg>
              );
            })()}
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: F.mono }}>
              {TREND_LABELS_GN.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>
    </LiquidShell>
  );
}
