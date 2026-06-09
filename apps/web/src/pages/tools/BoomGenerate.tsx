/**
 * BoomGenerate.tsx — /boom-generate 爆款元素自动生成 · 液态玻璃换皮
 * 业务逻辑/状态/mutation/校验/testid 一字不改 · 只换视觉皮
 * H1 字面锁: "爆款元素自动生成"
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import {
  BOOM_ANALYSIS_BODY,
  BOOM_ANALYSIS_TAG,
  BOOM_ANALYSIS_TITLE,
  BOOM_AVOID_LIST,
  BOOM_BEST_PRACTICE,
  BOOM_BEST_PRACTICE_LABEL,
  BOOM_BREADCRUMB,
  BOOM_BREADCRUMB_LABEL,
  BOOM_CTA,
  BOOM_DEFAULT_SELECTED_KEYS,
  BOOM_ENTRIES,
  BOOM_FEEDBACK_PROMPT,
  BOOM_FIELD_INDUSTRY_DEFAULT,
  BOOM_FIELD_INDUSTRY_LABEL,
  BOOM_FIELD_INDUSTRY_PLACEHOLDER,
  BOOM_FIELD_TOPIC_DEFAULT,
  BOOM_FIELD_TOPIC_LABEL,
  BOOM_FIELD_TOPIC_PLACEHOLDER,
  BOOM_H1,
  BOOM_INDEX_PREFIX,
  BOOM_PICKER_TITLE,
  BOOM_REASON_PREFIX,
  BOOM_SECTION_CLIMAX,
  BOOM_SECTION_DEVELOPMENT,
  BOOM_SECTION_ENDING,
  BOOM_SECTION_FULL,
  BOOM_SECTION_OPENING,
  BOOM_SELECTED_PREFIX,
  BOOM_SELECTED_SUFFIX,
  BOOM_SETTINGS_TITLE,
  BOOM_SUBTITLE_HIGHLIGHT,
  BOOM_SUBTITLE_PART1,
  BOOM_SUBTITLE_PART2,
  type BoomEntry,
} from '@/lib/constants/boomGenerate';
import { HOT_ELEMENT_GROUPS } from '@/lib/constants/elements';

// ── Category accent 三色轮转(冷蓝体系) ──────────────────────────────────────
const ACCENT_CYCLE = [C.ikb, C.yellow, C.accent3] as const;
const CATEGORY_ACCENT: Record<string, string> = {
  classic:    C.ikb,
  emotion:    C.yellow,
  content:    C.accent3,
  conversion: C.ikb,
};

// ── Radar data (爆款力雷达 · 六维) ────────────────────────────────────────────
const RADAR_DIMS_BM = [
  { label: '钩子强度', value: 88, color: C.ikb },
  { label: '情绪张力', value: 82, color: C.yellow },
  { label: '价值密度', value: 91, color: C.accent3 },
  { label: '转化引导', value: 79, color: C.ikb },
  { label: '记忆点',   value: 85, color: C.yellow },
  { label: '传播性',   value: 93, color: C.accent3 },
];

// ── Trend data (元素权重/热度曲线) ────────────────────────────────────────────
const TREND_DATA_BM = [68, 75, 88, 72, 84, 78, 92, 86, 80, 95, 90, 97];
const TREND_LABELS_BM = ['贪念', '恐惧', '猎奇', '反差', '借势', '共鸣', '共情', '情绪', '热点', '争议', '稀缺', '权威'];

// ── inline BoomHero ────────────────────────────────────────────────────────────
function BoomHero() {
  return (
    <div style={{ flexShrink: 0 }}>
      <Reveal style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
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
          {BOOM_BREADCRUMB}
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
          {BOOM_BREADCRUMB_LABEL}
        </span>
      </Reveal>
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
        爆款引擎 · {BOOM_H1}
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
        {BOOM_SUBTITLE_PART1}
        <span style={{ fontWeight: 700, color: C.ikb, textShadow: C.textShadow }}>{BOOM_SUBTITLE_HIGHLIGHT}</span>
        {BOOM_SUBTITLE_PART2}
      </p>
    </div>
  );
}

// ── inline BoomElementsPicker ──────────────────────────────────────────────────
interface BoomElementsPickerProps {
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
}

function BoomElementsPicker({ selectedKeys, onChange }: BoomElementsPickerProps) {
  function toggleKey(key: string) {
    if (selectedKeys.includes(key)) {
      onChange(selectedKeys.filter((k) => k !== key));
    } else {
      onChange([...selectedKeys, key]);
    }
  }

  const selectedLabels = HOT_ELEMENT_GROUPS.flatMap((g) => g.items)
    .filter((item) => selectedKeys.includes(item.key))
    .map((item) => item.label);

  return (
    <div className="lg-glass" style={{ borderRadius: 20, padding: 24 }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            display: 'flex',
            height: 38,
            width: 38,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: 'rgba(228,238,255,0.18)',
            color: C.yellow,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>local_fire_department</span>
        </span>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{BOOM_PICKER_TITLE}</h2>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>多选 · 当前 {selectedKeys.length} 个</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {HOT_ELEMENT_GROUPS.map((group, gi) => {
          const accent = CATEGORY_ACCENT[group.key] ?? ACCENT_CYCLE[gi % ACCENT_CYCLE.length];
          return (
            <div key={group.key}>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, fontFamily: F.mono, textShadow: C.textShadow }}>
                <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: accent, flexShrink: 0, display: 'inline-block' }} />
                {group.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {group.items.map((item) => {
                  const selected = selectedKeys.includes(item.key);
                  return (
                    <button
                      type="button"
                      key={item.key}
                      aria-pressed={selected}
                      data-state={selected ? 'active' : 'inactive'}
                      onClick={() => toggleKey(item.key)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 10,
                        border: selected ? `1px solid rgba(216,232,255,0.55)` : `0.5px solid ${C.line}`,
                        background: selected ? 'rgba(168,197,224,0.22)' : 'rgba(255,255,255,0.07)',
                        color: selected ? C.ikb : 'rgba(255,255,255,0.6)',
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: F.cn,
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        backdropFilter: 'blur(8px)',
                        textShadow: selected ? C.textShadow : 'none',
                        outline: 'none',
                      }}
                      onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
                      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>
                        {item.key === 'greed' ? 'monetization_on' :
                         item.key === 'fear' ? 'warning' :
                         item.key === 'curiosity' ? 'search' :
                         item.key === 'contrast' ? 'compare_arrows' :
                         item.key === 'worst' ? 'error_outline' :
                         item.key === 'leverage' ? 'local_fire_department' :
                         item.key === 'resonance' ? 'chat_bubble' :
                         item.key === 'empathy' ? 'handshake' :
                         item.key === 'small_big' ? 'track_changes' :
                         item.key === 'low_cost_high' ? 'trending_up' :
                         item.key === 'low_cost_unknown' ? 'casino' :
                         item.key === 'anger' ? 'mood_bad' :
                         item.key === 'surprise' ? 'celebration' :
                         item.key === 'trend' ? 'whatshot' :
                         item.key === 'controversy' ? 'gavel' :
                         item.key === 'reveal' ? 'lock_open' :
                         item.key === 'list' ? 'checklist' :
                         item.key === 'challenge' ? 'emoji_events' :
                         item.key === 'transformation' ? 'change_circle' :
                         item.key === 'scarcity' ? 'hourglass_bottom' :
                         item.key === 'social_proof' ? 'thumb_up' :
                         item.key === 'authority' ? 'workspace_premium' :
                         item.key === 'benefit' ? 'card_giftcard' :
                         'star'}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {selectedKeys.length > 0 && (
        <div
          style={{
            marginTop: 20,
            borderRadius: 12,
            border: `0.5px solid rgba(168,197,224,0.4)`,
            background: 'rgba(168,197,224,0.12)',
            padding: '10px 16px',
            fontSize: 12,
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ fontWeight: 700, color: C.ikb, textShadow: C.textShadow }}>
            {BOOM_SELECTED_PREFIX} {selectedKeys.length} {BOOM_SELECTED_SUFFIX}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{selectedLabels.join('、')}</span>
        </div>
      )}
    </div>
  );
}

// ── inline BoomSettings ────────────────────────────────────────────────────────
interface BoomSettingsProps {
  industry: string;
  topic: string;
  onIndustryChange: (v: string) => void;
  onTopicChange: (v: string) => void;
}

function BoomSettings({ industry, topic, onIndustryChange, onTopicChange }: BoomSettingsProps) {
  return (
    <div className="lg-glass" style={{ borderRadius: 20, padding: 24 }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            display: 'flex',
            height: 38,
            width: 38,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: 'rgba(168,197,224,0.22)',
            color: C.ikb,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>tune</span>
        </span>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{BOOM_SETTINGS_TITLE}</h2>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>行业 + 主题，精准定向生成</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <label
            htmlFor="boom-industry"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
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
                marginRight: 4,
                height: 14,
                width: 4,
                borderRadius: 9999,
                background: `linear-gradient(to bottom, ${C.ikb}, ${C.yellow})`,
                flexShrink: 0,
              }}
              aria-hidden={true}
            />
            {BOOM_FIELD_INDUSTRY_LABEL}
          </label>
          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.72)', pointerEvents: 'none' }}
              aria-hidden={true}
            >storefront</span>
            <input
              id="boom-industry"
              type="text"
              value={industry}
              onChange={(e) => onIndustryChange(e.target.value)}
              placeholder={BOOM_FIELD_INDUSTRY_PLACEHOLDER}
              className="lg-glass"
              style={{
                width: '100%',
                borderRadius: 12,
                padding: '12px 12px 12px 40px',
                fontSize: 14,
                color: C.ink,
                fontFamily: F.cn,
                background: 'rgba(255,255,255,0.07)',
                border: `0.5px solid ${C.line}`,
                outline: 'none',
                transition: 'box-shadow 0.18s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px rgba(168,197,224,0.55)`; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              data-testid="boom-industry-input"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="boom-topic"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
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
                marginRight: 4,
                height: 14,
                width: 4,
                borderRadius: 9999,
                background: `linear-gradient(to bottom, ${C.ikb}, ${C.yellow})`,
                flexShrink: 0,
              }}
              aria-hidden={true}
            />
            {BOOM_FIELD_TOPIC_LABEL}
          </label>
          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.72)', pointerEvents: 'none' }}
              aria-hidden={true}
            >topic</span>
            <input
              id="boom-topic"
              type="text"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder={BOOM_FIELD_TOPIC_PLACEHOLDER}
              className="lg-glass"
              style={{
                width: '100%',
                borderRadius: 12,
                padding: '12px 12px 12px 40px',
                fontSize: 14,
                color: C.ink,
                fontFamily: F.cn,
                background: 'rgba(255,255,255,0.07)',
                border: `0.5px solid ${C.line}`,
                outline: 'none',
                transition: 'box-shadow 0.18s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px rgba(168,197,224,0.55)`; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              data-testid="boom-topic-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── inline BoomCTA ─────────────────────────────────────────────────────────────
interface BoomCTAProps {
  onClick?: () => void;
}

function BoomCTA({ onClick }: BoomCTAProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Magnetic strength={0.3}>
        <motion.button
          type="button"
          onClick={onClick}
          className="lg-gradbtn"
          whileTap={{ y: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 9999,
            padding: '12px 32px',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            fontFamily: F.cn,
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>auto_awesome</span>
          {BOOM_CTA}
        </motion.button>
      </Magnetic>
    </div>
  );
}

// ── inline BoomAnalysis ────────────────────────────────────────────────────────
function BoomAnalysis() {
  return (
    <div className="lg-glass" style={{ overflow: 'hidden', borderRadius: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `0.5px solid ${C.line}`,
          padding: '16px 24px',
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
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
              color: C.ikb,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>analytics</span>
          </span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{BOOM_ANALYSIS_TITLE}</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>AI 策略解析 · 实时生效</p>
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
            fontWeight: 700,
            background: 'rgba(228,238,255,0.18)',
            color: C.yellow,
            fontFamily: F.mono,
            textShadow: C.textShadow,
          }}
        >
          {BOOM_ANALYSIS_TAG}
        </span>
      </div>
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{BOOM_ANALYSIS_BODY}</p>
        <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>{BOOM_BEST_PRACTICE_LABEL}</span>
          <span style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{BOOM_BEST_PRACTICE}</span>
        </p>
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {BOOM_AVOID_LIST.map((text) => (
            <span
              key={text}
              style={{
                borderRadius: 10,
                border: `0.5px solid rgba(228,238,255,0.35)`,
                background: 'rgba(228,238,255,0.10)',
                padding: '6px 12px',
                fontSize: 12,
                color: C.yellow,
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── inline BoomResultEntry ────────────────────────────────────────────────────
function BoomResultEntry({ entry }: { entry: BoomEntry }) {
  const fullText = [entry.opening, entry.development, entry.climax, entry.ending].join(' ');

  function handleCopy() {
    navigator.clipboard.writeText(fullText).then(
      () => toast.success('已复制'),
      () => toast.error('复制失败'),
    );
  }

  // 液态玻璃三色轮转 for section left-border
  const sections = [
    { label: BOOM_SECTION_OPENING,     body: entry.opening,     borderColor: C.accent3,  labelColor: C.accent3 },
    { label: BOOM_SECTION_DEVELOPMENT, body: entry.development, borderColor: C.accent3,  labelColor: C.accent3 },
    { label: BOOM_SECTION_CLIMAX,      body: entry.climax,      borderColor: C.yellow,   labelColor: C.yellow },
    { label: BOOM_SECTION_ENDING,      body: entry.ending,      borderColor: C.ikb,      labelColor: C.ikb },
  ];

  return (
    <motion.div
      className="lg-glass lg-spec"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{ overflow: 'hidden', borderRadius: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div
        style={{
          borderBottom: `0.5px solid ${C.line}`,
          padding: '16px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'flex',
                height: 32,
                width: 32,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                background: 'linear-gradient(135deg, rgba(168,197,224,0.6), rgba(120,160,220,0.4))',
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              {entry.index}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, flex: 1, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{entry.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
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
                color: C.accent3,
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              {BOOM_INDEX_PREFIX}{entry.indexScore}
            </span>
            <button
              type="button"
              aria-label="复制"
              onClick={handleCopy}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 8,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.84)',
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.18s',
                outline: 'none',
                backdropFilter: 'blur(6px)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.ink; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>content_copy</span>
              复制
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {/* type chip — accent3 */}
          <span
            style={{
              borderRadius: 8,
              border: `0.5px solid rgba(168,197,224,0.35)`,
              background: 'rgba(168,197,224,0.12)',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 500,
              color: C.accent3,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            {entry.type}
          </span>
          {/* format chip — ikb */}
          <span
            style={{
              borderRadius: 8,
              border: `0.5px solid rgba(216,232,255,0.4)`,
              background: 'rgba(216,232,255,0.12)',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 500,
              color: C.ikb,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            {entry.format}
          </span>
          {/* element chip — yellow */}
          <span
            style={{
              borderRadius: 8,
              border: `0.5px solid rgba(228,238,255,0.35)`,
              background: 'rgba(228,238,255,0.10)',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 500,
              color: C.yellow,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            {entry.element}
          </span>
        </div>
      </div>

      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map((sec) => (
            <div key={sec.label} style={{ borderLeft: `2px solid ${sec.borderColor}`, paddingLeft: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: sec.labelColor, fontFamily: F.mono, textShadow: C.textShadow }}>{sec.label}</p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{sec.body}</p>
            </div>
          ))}
        </div>

        <div
          className="lg-glass"
          style={{
            marginTop: 'auto',
            borderRadius: 14,
            padding: 16,
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: C.ikb, fontFamily: F.mono, textShadow: C.textShadow }}>{BOOM_SECTION_FULL}</p>
          <p style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{fullText}</p>
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderTop: `0.5px solid ${C.line}`,
              paddingTop: 12,
            }}
          >
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{BOOM_FEEDBACK_PROMPT}</p>
            <button
              type="button"
              aria-label="有帮助"
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                display: 'flex',
                height: 28,
                width: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.84)',
                cursor: 'pointer',
                transition: 'all 0.18s',
                outline: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.ikb; e.currentTarget.style.background = 'rgba(168,197,224,0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>thumb_up</span>
            </button>
            <button
              type="button"
              aria-label="无帮助"
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                display: 'flex',
                height: 28,
                width: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.84)',
                cursor: 'pointer',
                transition: 'all 0.18s',
                outline: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.yellow; e.currentTarget.style.background = 'rgba(228,238,255,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>thumb_down</span>
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            borderLeft: `2px solid ${C.yellow}`,
            borderRadius: 4,
            background: 'rgba(228,238,255,0.08)',
            padding: 12,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: C.yellow, fontFamily: F.mono, textShadow: C.textShadow }}>{BOOM_REASON_PREFIX}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{entry.reason}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── inline BoomResultList ─────────────────────────────────────────────────────
function BoomResultList({ entries }: { entries: ReadonlyArray<BoomEntry> }) {
  return (
    <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {entries.map((entry) => (
        <Item key={entry.index} style={{ height: '100%' }}>
          <BoomResultEntry entry={entry} />
        </Item>
      ))}
    </RevealGroup>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BoomGenerate() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([...BOOM_DEFAULT_SELECTED_KEYS]);
  const [industry, setIndustry] = useState<string>(BOOM_FIELD_INDUSTRY_DEFAULT);
  const [topic, setTopic] = useState<string>(BOOM_FIELD_TOPIC_DEFAULT);

  const totalElements = HOT_ELEMENT_GROUPS.reduce((sum: number, cat) => sum + cat.items.length, 0);

  function handleGenerate() {
    toast.success('已生成爆款文案');
  }

  return (
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ marginBottom: 48, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
        <BoomHero />
        <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'nowrap', gap: 12 }}>
          <button
            type="button"
            aria-label="重新生成"
            onClick={handleGenerate}
            className="lg-glass"
            onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            style={{
              display: 'inline-flex',
              flexShrink: 0,
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              borderRadius: 9999,
              border: `0.5px solid ${C.line}`,
              background: 'rgba(255,255,255,0.08)',
              color: C.ink,
              padding: '10px 18px',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontFamily: F.mono,
              cursor: 'pointer',
              transition: 'all 0.18s',
              outline: 'none',
              textShadow: C.textShadow,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>refresh</span>
            重新生成
          </button>
          <Magnetic strength={0.3}>
            <motion.button
              type="button"
              aria-label="导出方案"
              onClick={() => {
                const text = JSON.stringify(BOOM_ENTRIES, null, 2);
                navigator.clipboard.writeText(text).then(
                  () => toast.success('已复制全部'),
                  () => toast.error('复制失败'),
                );
              }}
              className="lg-gradbtn"
              whileTap={{ y: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                display: 'inline-flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 9999,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                fontFamily: F.cn,
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>download</span>
              导出方案
            </motion.button>
          </Magnetic>
        </div>
      </header>

      {/* ── KPI 概览一排 (4 卡) ────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {/* 爆款元素 · 冷蓝 · 环形 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>local_fire_department</span>
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
                <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden={true}>trending_up</span>全库
              </span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                  {totalElements}
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, marginLeft: 2 }}>个</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>爆款元素</p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%' }} role="img" aria-label="爆款元素覆盖率">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.2)" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.ikb} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="100 100" />
                </svg>
              </div>
            </div>
          </motion.div>
        </Item>

        {/* 选中元素 · yellow · 进度条 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  background: 'rgba(228,238,255,0.18)',
                  color: C.yellow,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>check_circle</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(228,238,255,0.18)',
                  color: C.yellow,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >选中</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                {selectedKeys.length}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, marginLeft: 2 }}>个</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>选中元素</p>
            </div>
            <div style={{ marginTop: 12, height: 6, width: '100%', borderRadius: 9999, background: 'rgba(228,238,255,0.15)' }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 9999,
                  width: `${Math.min(100, Math.round((selectedKeys.length / totalElements) * 100))}%`,
                  background: `linear-gradient(to right, ${C.yellow}, ${C.accent3})`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </motion.div>
        </Item>

        {/* 生成结果 · accent3 · 迷你柱 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>article</span>
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
              >结果库</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                {BOOM_ENTRIES.length}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, marginLeft: 2 }}>篇</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>生成结果</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }} aria-hidden={true}>
              {[64, 88, 72, 96, 82].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '4px 4px 0 0', height: `${h}%`, background: 'rgba(168,197,224,0.45)' }} />
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 命中率 · 冷蓝 · chips */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>gps_fixed</span>
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
              >命中率</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                87
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, marginLeft: 2 }}>%</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>命中率</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }} aria-hidden={true}>
              {['共鸣', '转化', '爆款'].map((k) => (
                <span
                  key={k}
                  style={{
                    borderRadius: 6,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 600,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    fontFamily: F.mono,
                    textShadow: C.textShadow,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── 元素多选 ────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 24 }}>
        <BoomElementsPicker selectedKeys={selectedKeys} onChange={setSelectedKeys} />
      </Reveal>

      {/* ── 设置 ────────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 24 }}>
        <BoomSettings
          industry={industry}
          topic={topic}
          onIndustryChange={setIndustry}
          onTopicChange={setTopic}
        />
      </Reveal>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 44 }}>
        <BoomCTA onClick={handleGenerate} />
      </div>

      {/* ── 元素组合分析 ────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 44 }}>
        <BoomAnalysis />
      </Reveal>

      {/* ── 结果列表 ─────────────────────────────────────────── */}
      <BoomResultList entries={BOOM_ENTRIES} />

      {/* ── 数据洞察(雷达 + 趋势) ─────────────────────────── */}
      <Reveal style={{ marginTop: 40, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>数据洞察</h2>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
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
          <span
            style={{
              height: 6,
              width: 6,
              borderRadius: '50%',
              backgroundColor: C.ikb,
              display: 'inline-block',
              animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
            }}
          />
          模型已就绪
        </span>
      </Reveal>
      <div style={{ marginBottom: 44, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 }}>
        {/* 爆款力雷达 */}
        <motion.div
          className="lg-glass lg-spec"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ borderRadius: 20, padding: 24 }}
        >
          <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  display: 'flex',
                  height: 38,
                  width: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>radar</span>
              </span>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>爆款力雷达</h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>六维模型评估</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  lineHeight: 1,
                  background: C.grad,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                  fontFamily: F.display,
                  margin: 0,
                }}
              >86</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: F.mono, margin: 0 }}>综合分</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS_BM;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="爆款力雷达图">
                <defs>
                  <linearGradient id="boom-radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={C.yellow} stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.10)" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#boom-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(8,20,48,0.6)" stroke={d.color} strokeWidth="2" />;
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
            {RADAR_DIMS_BM.map((d) => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono, textShadow: C.textShadow }}>{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 元素权重/热度曲线 */}
        <motion.div
          className="lg-glass lg-spec"
          whileHover={{ y: -4 }}
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
                  background: 'rgba(228,238,255,0.18)',
                  color: C.yellow,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>show_chart</span>
              </span>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>元素权重 / 热度曲线</h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>按当前选中元素测算</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {['权重', '热度', '转化'].map((t, i) => (
                <span
                  key={t}
                  style={{
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: F.mono,
                    background: i === 0 ? 'rgba(168,197,224,0.5)' : 'rgba(255,255,255,0.07)',
                    color: i === 0 ? '#fff' : 'rgba(255,255,255,0.55)',
                    textShadow: i === 0 ? C.textShadow : 'none',
                    border: i === 0 ? 'none' : `0.5px solid ${C.line}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>97</p>
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
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>trending_up</span>+248%
            </span>
            <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>较基准值</span>
          </div>
          {(() => {
            const data = TREND_DATA_BM;
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
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label="元素热度曲线图">
                <defs>
                  <linearGradient id="boom-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="boom-trendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.ikb} />
                    <stop offset="55%" stopColor={C.accent3} />
                    <stop offset="100%" stopColor={C.yellow} />
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
                <path d={area} fill="url(#boom-trendFill)" />
                <path d={line} fill="none" stroke="url(#boom-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(8,20,48,0.6)" stroke={C.ikb} strokeWidth="2" />
                ))}
              </svg>
            );
          })()}
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4, fontSize: 10, color: 'rgba(255,255,255,0.72)', fontFamily: F.mono }}>
            {TREND_LABELS_BM.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </LiquidShell>
  );
}
