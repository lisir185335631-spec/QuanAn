/**
 * Evolution.tsx · 液态玻璃 iOS26 皮(LiquidShell)
 * /evolution · 智能体进化中心 · 阶段2: trpc 真后端
 * LiquidShell 外壳 · inline style + token · testid 零改动
 */
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import {
  EVOLUTION_ARCHIVE_ADD,
  EVOLUTION_ARCHIVE_DONE_CHIP,
  EVOLUTION_ARCHIVE_TITLE,
  EVOLUTION_BREADCRUMB_LEFT,
  EVOLUTION_DIR_DEFAULT_TAG,
  EVOLUTION_FEEDBACK_EMPTY_DESC,
  EVOLUTION_FEEDBACK_EMPTY_TITLE,
  EVOLUTION_FEEDBACK_TITLE,
  EVOLUTION_H1,
  EVOLUTION_INSIGHT_EMPTY_DESC,
  EVOLUTION_INSIGHT_EMPTY_TITLE,
  EVOLUTION_INSIGHT_TITLE,
  EVOLUTION_LEVEL_INFO_TPL,
  EVOLUTION_LEVEL_NEXT_TPL,
  EVOLUTION_LEVEL_TITLE_TPL,
  EVOLUTION_LEVELS_5,
  EVOLUTION_SETTING_AUTO_DESC,
  EVOLUTION_SETTING_AUTO_LABEL,
  EVOLUTION_SETTING_DIR_DESC,
  EVOLUTION_SETTING_DIR_LABEL,
  EVOLUTION_SETTINGS_TITLE,
  EVOLUTION_STAT_LABELS,
  EVOLUTION_SUBTITLE_PARTS,
  EVOLUTION_TOAST_AUTO_OFF,
  EVOLUTION_TOAST_AUTO_ON,
  EVOLUTION_TRIGGER_BTN,
} from '@/lib/constants/evolution';
import { trpc } from '@/lib/trpc';

// ── Level threshold map (mirrors API inferLevel) ─────────────────────────────
const LEVEL_THRESHOLDS: Record<string, { min: number; next: number | null }> = {
  L1: { min: 0,   next: 5   },
  L2: { min: 5,   next: 20  },
  L3: { min: 20,  next: 50  },
  L4: { min: 50,  next: 100 },
  L5: { min: 100, next: null },
};

function calcProgress(level: string, feedbackTotal: number): number {
  const cfg = LEVEL_THRESHOLDS[level];
  if (!cfg || cfg.next === null) return 100;
  const range = cfg.next - cfg.min;
  const done  = feedbackTotal - cfg.min;
  return Math.min(100, Math.max(0, Math.round((done / range) * 100)));
}

function calcNextNeed(level: string, feedbackTotal: number): number {
  const cfg = LEVEL_THRESHOLDS[level];
  if (!cfg || cfg.next === null) return 0;
  return Math.max(0, cfg.next - feedbackTotal);
}

// ─────────────────────────────────────────────────────────────────
// Inline 液态玻璃组件 (testid 全保留)
// ─────────────────────────────────────────────────────────────────

// ── EvolutionHeader ────────────────────────────────────────────────
interface EvolutionHeaderProps {
  onTrigger: () => void;
}
function EvolutionHeader({ onTrigger }: EvolutionHeaderProps) {
  return (
    <header data-testid="evolution-header" style={{ marginBottom: 48, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
      <div style={{ flexShrink: 0 }}>
        <Reveal style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div data-testid="evolution-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.84)' }}>
            <span style={{ fontFamily: F.mono, color: C.ikb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', textShadow: C.textShadow }}>
              {EVOLUTION_BREADCRUMB_LEFT}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }} aria-hidden={true}>chevron_right</span>
            <span style={{ color: 'rgba(255,255,255,0.84)', textShadow: C.textShadow }}>{EVOLUTION_H1}</span>
          </div>
        </Reveal>
        <Reveal style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
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
            智能引擎
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
            进化引擎
          </span>
        </Reveal>
        <h1
          data-testid="evolution-h1"
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
          {EVOLUTION_H1}
        </h1>
        <p style={{ marginTop: 10, maxWidth: 820, fontSize: 16, lineHeight: 1.6, color: C.burgundyText, fontFamily: F.cn, textShadow: C.textShadow }}>
          {EVOLUTION_SUBTITLE_PARTS.prefix}
          <span style={{ fontWeight: 600, color: C.ikb }}>{EVOLUTION_SUBTITLE_PARTS.highlight1}</span>
          {EVOLUTION_SUBTITLE_PARTS.middle}
          <span style={{ fontWeight: 600, color: C.ikb }}>{EVOLUTION_SUBTITLE_PARTS.highlight2}</span>
          {EVOLUTION_SUBTITLE_PARTS.suffix}
        </p>
      </div>
      <Magnetic strength={0.3}>
        <button
          type="button"
          data-testid="trigger-evolution-btn"
          onClick={onTrigger}
          className="lg-gradbtn"
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            borderRadius: 9999,
            padding: '10px 22px',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: F.cn,
            color: '#fff',
            cursor: 'pointer',
            border: 'none',
          }}
          aria-label="触发进化"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>bolt</span>
          {EVOLUTION_TRIGGER_BTN}
        </button>
      </Magnetic>
    </header>
  );
}

// ── LevelCard ────────────────────────────────────────────────────
interface LevelCardProps {
  level: string;
  feedbackCountTotal: number;
  deepLearningCount: number;
}
function LevelCard({ level, feedbackCountTotal, deepLearningCount }: LevelCardProps) {
  const currentLevel = EVOLUTION_LEVELS_5.find((l) => l.id === level) ?? EVOLUTION_LEVELS_5[0]!;
  const titleText = EVOLUTION_LEVEL_TITLE_TPL(currentLevel.id, currentLevel.label);
  const infoText  = EVOLUTION_LEVEL_INFO_TPL(feedbackCountTotal, deepLearningCount);
  const isMaxLevel = LEVEL_THRESHOLDS[level]?.next === null;
  const nextNeed  = calcNextNeed(level, feedbackCountTotal);
  const nextText  = isMaxLevel ? '已达最高等级' : EVOLUTION_LEVEL_NEXT_TPL(nextNeed);
  const progressPct = calcProgress(level, feedbackCountTotal);

  return (
    <Reveal>
      <motion.div
        data-testid="level-card"
        className="lg-glass"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{ marginBottom: 44, overflow: 'hidden', borderRadius: 20, padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  height: 56,
                  width: 56,
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  background: C.grad,
                  boxShadow: '0 8px 24px rgba(168,197,224,0.25)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#fff' }} aria-hidden={true}>eco</span>
              </div>
              <div>
                <p
                  data-testid="level-title"
                  style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}
                >
                  {titleText}
                </p>
                <p
                  data-testid="level-info"
                  style={{ marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: '2px 0 0', fontFamily: F.cn }}
                >
                  {infoText}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.84)' }}>
                <span>进化经验</span>
                <span>{progressPct}%</span>
              </div>
              <div style={{ height: 10, width: '100%', overflow: 'hidden', borderRadius: 9999, background: 'rgba(255,255,255,0.12)' }}>
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: 10,
                    borderRadius: 9999,
                    background: C.grad,
                    transition: 'width 0.7s ease',
                  }}
                />
              </div>
              <p
                data-testid="level-next"
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0 }}
              >
                {nextText}
              </p>
            </div>
          </div>

          <div
            data-testid="level-icon-row"
            style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 12 }}
          >
            {EVOLUTION_LEVELS_5.map((lvl) => {
              const isActive = lvl.id === level;
              return (
                <div
                  key={lvl.id}
                  data-testid={`level-icon-${lvl.id}`}
                  data-state={isActive ? 'active' : 'inactive'}
                  style={{
                    display: 'flex',
                    height: 44,
                    width: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(168,197,224,0.7), rgba(100,155,220,0.5))'
                      : 'rgba(255,255,255,0.07)',
                    border: isActive
                      ? '1px solid rgba(168,197,224,0.6)'
                      : `1px solid ${C.line}`,
                    boxShadow: isActive ? '0 4px 14px rgba(168,197,224,0.22)' : 'none',
                    opacity: isActive ? 1 : 0.4,
                    transition: 'all 0.2s',
                  }}
                  title={`${lvl.id} ${lvl.label}`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20, color: isActive ? '#fff' : 'rgba(255,255,255,0.84)' }}
                    aria-hidden={true}
                  >
                    {lvl.id === 'L1'
                      ? 'eco'
                      : lvl.id === 'L2'
                        ? 'menu_book'
                        : lvl.id === 'L3'
                          ? 'rocket_launch'
                          : lvl.id === 'L4'
                            ? 'park'
                            : 'workspace_premium'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </Reveal>
  );
}

// ── StatCard ─────────────────────────────────────────────────────
type StatVariant = 'good' | 'needsImprove' | 'learning' | 'satisfaction';

interface StatCardProps {
  variant: StatVariant;
  label: string;
  value: number;
  unit?: string;
  showDelta?: boolean;
}

type StatVariantStyle = {
  iconBg: string;
  iconColor: string;
  icon: string;
  chipBg: string;
  chipColor: string;
};

// C.burgundy / C.burgundyText / C.accent3 / C.purpleText are rgba() in liquid glass
// safe rgba literals are used here instead of string concatenation
const STAT_VARIANT_STYLES: Record<StatVariant, StatVariantStyle> = {
  good: {
    iconBg: 'rgba(168,197,224,0.22)',
    iconColor: C.ikb,
    icon: 'thumb_up',
    chipBg: 'rgba(168,197,224,0.18)',
    chipColor: C.ikb,
  },
  needsImprove: {
    iconBg: 'rgba(255,255,255,0.12)',
    iconColor: 'rgba(255,255,255,0.9)',
    icon: 'thumb_down',
    chipBg: 'rgba(255,255,255,0.08)',
    chipColor: 'rgba(255,255,255,0.85)',
  },
  learning: {
    iconBg: 'rgba(168,197,224,0.22)',
    iconColor: C.ikb,
    icon: 'neurology',
    chipBg: 'rgba(168,197,224,0.18)',
    chipColor: C.ikb,
  },
  satisfaction: {
    iconBg: 'rgba(168,197,224,0.22)',
    iconColor: C.ikb,
    icon: 'trending_up',
    chipBg: 'rgba(168,197,224,0.18)',
    chipColor: C.ikb,
  },
};

function StatCard({ variant, label, value, unit = '', showDelta = false }: StatCardProps) {
  const s = STAT_VARIANT_STYLES[variant];
  return (
    <Item style={{ height: '100%' }}>
      <motion.div
        data-testid={`stat-card-${variant}`}
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
              background: s.iconBg,
              color: s.iconColor,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>{s.icon}</span>
          </span>
          {showDelta && (
            <span
              data-testid="stat-delta-chip"
              style={{
                borderRadius: 9999,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                background: s.chipBg,
                color: s.chipColor,
              }}
            >
              -0%
            </span>
          )}
        </div>
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>
            {value}
            {unit && <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', marginLeft: 2 }}>{unit}</span>}
          </p>
          <p
            data-testid={`stat-label-${variant}`}
            style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: '6px 0 0', fontFamily: F.cn }}
          >
            {label}
          </p>
        </div>
      </motion.div>
    </Item>
  );
}

// ── InsightCard ───────────────────────────────────────────────────
interface InsightItem {
  id: number | string;
  triggerType: string;
  direction: string | null;
  content?: unknown;
  levelBefore: string | null;
  levelAfter: string | null;
  createdAt: Date | string;
}

function InsightCard({ items }: { items: InsightItem[] }) {
  if (items.length === 0) {
    return (
      <motion.div
        data-testid="empty-insight-card"
        className="lg-glass"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{ borderRadius: 20, padding: 22 }}
      >
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'flex',
              height: 34,
              width: 34,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: 'rgba(168,197,224,0.22)',
              color: C.ikb,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>emoji_events</span>
          </span>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{EVOLUTION_INSIGHT_TITLE}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px 0', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'rgba(168,197,224,0.45)' }} aria-hidden={true}>shield</span>
          <p
            data-testid="insight-empty-title"
            style={{ fontSize: 13, fontWeight: 500, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}
          >
            {EVOLUTION_INSIGHT_EMPTY_TITLE}
          </p>
          <p style={{ maxWidth: 200, fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>
            {EVOLUTION_INSIGHT_EMPTY_DESC}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      data-testid="insight-card"
      className="lg-glass"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{ borderRadius: 20, padding: 22 }}
    >
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            display: 'flex',
            height: 34,
            width: 34,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: 'rgba(168,197,224,0.22)',
            color: C.ikb,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>emoji_events</span>
        </span>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{EVOLUTION_INSIGHT_TITLE}</h3>
      </div>
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {items.map((item) => (
          <Item key={String(item.id)} style={{ height: '100%' }}>
            <div
              data-testid={`insight-item-${String(item.id)}`}
              className="lg-glass"
              style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, padding: '12px 16px', height: '100%' }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>
                {item.direction ?? '综合'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                {item.levelAfter && (
                  <span
                    style={{
                      borderRadius: 9999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'rgba(168,197,224,0.18)',
                      color: C.ikb,
                    }}
                  >
                    → {item.levelAfter}
                  </span>
                )}
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>
                  {item.triggerType} · {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </Item>
        ))}
      </RevealGroup>
    </motion.div>
  );
}

// ── FeedbackCard ──────────────────────────────────────────────────
interface FeedbackItem {
  id: number | string;
  rating: 'good' | 'bad';
  agentId: string;
  comment: string | null;
  traceId: string | null;
  createdAt: Date | string;
}

function FeedbackCard({ items }: { items: FeedbackItem[] }) {
  if (items.length === 0) {
    return (
      <motion.div
        data-testid="empty-feedback-card"
        className="lg-glass"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{ borderRadius: 20, padding: 22 }}
      >
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'flex',
              height: 34,
              width: 34,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: 'rgba(168,197,224,0.22)',
              color: C.ikb,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>chat_bubble</span>
          </span>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{EVOLUTION_FEEDBACK_TITLE}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px 0', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'rgba(168,197,224,0.45)' }} aria-hidden={true}>chat_bubble_outline</span>
          <p
            data-testid="feedback-empty-title"
            style={{ fontSize: 13, fontWeight: 500, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}
          >
            {EVOLUTION_FEEDBACK_EMPTY_TITLE}
          </p>
          <p style={{ maxWidth: 200, fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>
            {EVOLUTION_FEEDBACK_EMPTY_DESC}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      data-testid="feedback-card"
      className="lg-glass"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{ borderRadius: 20, padding: 22 }}
    >
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            display: 'flex',
            height: 34,
            width: 34,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: 'rgba(168,197,224,0.22)',
            color: C.ikb,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>chat_bubble</span>
        </span>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{EVOLUTION_FEEDBACK_TITLE}</h3>
      </div>
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {items.map((item) => (
          <Item key={String(item.id)} style={{ height: '100%' }}>
            <div
              data-testid={`feedback-item-${String(item.id)}`}
              className="lg-glass"
              style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, padding: '12px 16px', height: '100%' }}
            >
              <p style={{ fontSize: 12, fontWeight: 600, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>
                <span style={{ marginRight: 6 }} aria-label={item.rating === 'good' ? '好评' : '差评'}>
                  {item.rating === 'good' ? '👍' : '👎'}
                </span>
                {item.agentId}
              </p>
              {item.comment && (
                <p style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: '4px 0 0', fontFamily: F.cn }}>{item.comment}</p>
              )}
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 'auto 0 0', fontFamily: F.cn }}>
                {new Date(item.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </Item>
        ))}
      </RevealGroup>
    </motion.div>
  );
}

// ── SettingRow ───────────────────────────────────────────────────
interface SettingRowProps {
  label: string;
  desc: string;
  control: React.ReactNode;
  testid?: string;
}
function SettingRow({ label, desc, control, testid = 'setting-row' }: SettingRowProps) {
  return (
    <div
      data-testid={testid}
      className="lg-glass"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderRadius: 16, padding: '16px 20px' }}
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{label}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: '4px 0 0', fontFamily: F.cn }}>{desc}</p>
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Radar / Trend static decoration (不依赖后端，视觉装饰)
// ─────────────────────────────────────────────────────────────────
const EV_RADAR_DIMS = [
  { label: '内容质量', value: 72, color: C.ikb },
  { label: '互动率',   value: 65, color: 'rgba(255,255,255,0.8)' },
  { label: '转化',     value: 58, color: C.ikb },
  { label: '更新频率', value: 80, color: C.ikb },
  { label: '学习力',   value: 90, color: 'rgba(255,255,255,0.8)' },
  { label: '满意度',   value: 70, color: C.ikb },
];

const EV_TREND_DATA   = [20, 28, 25, 38, 44, 50, 62, 72, 68, 80, 86, 92];
const EV_TREND_LABELS = ['第1周', '第3周', '第5周', '第7周', '第9周', '第12周'];

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────
export default function Evolution() {
  const navigate = useNavigate();

  // ── trpc queries ──────────────────────────────────────────────
  const profileQuery  = trpc.evolution.getProfile.useQuery();
  const insightQuery  = trpc.evolution.getInsightHistory.useQuery();
  const feedbackQuery = trpc.evolution.recentFeedback.useQuery({ limit: 10 });
  const updateConfig  = trpc.evolution.updateConfig.useMutation({
    onSuccess: () => { void profileQuery.refetch(); },
    onError: () => {
      setAutoOnLocal(null);
      toast.error('设置失败 · 请重试');
    },
  });

  // local optimistic state for toggle (mirrors server value once loaded)
  const [autoOnLocal, setAutoOnLocal] = useState<boolean | null>(null);

  const profile  = profileQuery.data ?? null;
  const insights = insightQuery.data ?? [];
  const feedbacks = feedbackQuery.data ?? [];
  const currentDirection = profile?.currentDirection ?? '综合';

  const autoOn = autoOnLocal ?? profile?.autoEvolutionEnabled ?? true;

  // ── derived profile values ─────────────────────────────────────
  const level            = profile?.level ?? 'L1';
  const feedbackTotal    = profile?.feedbackCountTotal ?? 0;
  const deepLearningCount = profile?.deepLearningCount ?? 0;
  const satisfactionRate  = profile !== null
    ? Math.round((profile.satisfactionRate ?? 0) * 100)
    : 0;

  // ── trigger-evolution handler ─────────────────────────────────
  function handleTrigger() {
    if (profile === null) {
      toast.info('暂无进化档案，开始使用积累反馈后可触发进化');
      return;
    }
    // No standalone "manual trigger" procedure — refetch insights/profile
    void profileQuery.refetch();
    void insightQuery.refetch();
    toast.info('反馈达阈值后自动进化，当前已刷新进化状态');
  }

  // ── loading state ─────────────────────────────────────────────
  if (profileQuery.isLoading) {
    return (
      <LiquidShell>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <EvolutionHeader onTrigger={handleTrigger} />
          <div
            data-testid="evolution-loading"
            style={{ display: 'flex', minHeight: 400, alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.84)' }}
          >
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }} aria-hidden={true}>progress_activity</span>
          </div>
        </div>
      </LiquidShell>
    );
  }

  // ── error state ───────────────────────────────────────────────
  if (profileQuery.isError) {
    return (
      <LiquidShell>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <EvolutionHeader onTrigger={handleTrigger} />
          <div
            data-testid="evolution-error"
            style={{ display: 'flex', minHeight: 400, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'rgba(255,255,255,0.9)' }} aria-hidden={true}>error</span>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>加载进化档案失败，请刷新重试</p>
            <Magnetic strength={0.3}>
              <button
                type="button"
                onClick={() => void profileQuery.refetch()}
                className="lg-gradbtn"
                style={{
                  borderRadius: 9999,
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: F.cn,
                  color: '#fff',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                重试
              </button>
            </Magnetic>
          </div>
        </div>
      </LiquidShell>
    );
  }

  // ── null / undefined (no profile yet) state ──────────────────
  if (profile === null) {
    return (
      <LiquidShell>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <EvolutionHeader onTrigger={handleTrigger} />
          <div
            data-testid="evolution-empty"
            style={{ display: 'flex', minHeight: 400, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'rgba(168,197,224,0.55)' }} aria-hidden={true}>eco</span>
            <p
              data-testid="evolution-empty-title"
              style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}
            >
              暂无进化档案
            </p>
            <p style={{ maxWidth: 320, fontSize: 13, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>
              开始使用各功能并留下反馈，积累后进化档案将自动创建
            </p>
          </div>
        </div>
      </LiquidShell>
    );
  }

  return (
    <LiquidShell>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* §1 Header */}
        <EvolutionHeader onTrigger={handleTrigger} />

        {/* §2 进化等级卡 */}
        <LevelCard
          level={level}
          feedbackCountTotal={feedbackTotal}
          deepLearningCount={deepLearningCount}
        />

        {/* §3 4 StatCard KPI */}
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 44 }}>
          <StatCard
            variant="good"
            label={EVOLUTION_STAT_LABELS.good}
            value={profile.feedbackCountGood}
          />
          <StatCard
            variant="needsImprove"
            label={EVOLUTION_STAT_LABELS.needsImprove}
            value={profile.feedbackCountBad}
          />
          <StatCard
            variant="learning"
            label={EVOLUTION_STAT_LABELS.learningArchive}
            value={deepLearningCount}
          />
          <StatCard
            variant="satisfaction"
            label={EVOLUTION_STAT_LABELS.satisfaction}
            value={satisfactionRate}
            unit="%"
          />
        </RevealGroup>

        {/* §5 2-col: 洞察 + 反馈 */}
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 44 }}>
          <Item><InsightCard items={insights} /></Item>
          <Item><FeedbackCard items={feedbacks} /></Item>
        </RevealGroup>

        {/* §6 深度学习档案 — 显示计数 + 跳转入口 */}
        <Reveal>
          <section style={{ marginBottom: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>auto_awesome</span>
                {EVOLUTION_ARCHIVE_TITLE}
              </h2>
              <motion.button
                type="button"
                data-testid="add-learning-link"
                onClick={() => navigate('/deep-learning')}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="lg-glass"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 12,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.ikb,
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
                aria-label="新增深度学习"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden={true}>add</span>
                {EVOLUTION_ARCHIVE_ADD}
              </motion.button>
            </div>

            {deepLearningCount > 0 ? (
              <motion.div
                data-testid="archive-count-card"
                className="lg-glass"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: '16px 20px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 34,
                      width: 34,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'rgba(168,197,224,0.22)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.ikb }} aria-hidden={true}>auto_awesome</span>
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>
                      已完成 {deepLearningCount} 个深度学习档案
                    </p>
                    <p style={{ marginTop: 2, fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: '2px 0 0', fontFamily: F.cn }}>
                      点击「新增学习」继续积累 · 或在深度学习页查看详情
                    </p>
                  </div>
                </div>
                <span
                  data-testid="archive-chip-archive-1"
                  style={{
                    flexShrink: 0,
                    borderRadius: 9999,
                    padding: '2px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    textShadow: C.textShadow,
                  }}
                >
                  {EVOLUTION_ARCHIVE_DONE_CHIP}
                </span>
              </motion.div>
            ) : (
              <div
                data-testid="archive-empty"
                className="lg-glass"
                style={{ borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}
              >
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>
                  还没有深度学习档案 · 点击「新增学习」开始积累
                </p>
              </div>
            )}
          </section>
        </Reveal>

        {/* §7 进化设置 */}
        <Reveal>
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: '0 0 16px', fontFamily: F.cn, textShadow: C.textShadow }}>{EVOLUTION_SETTINGS_TITLE}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SettingRow
                testid="setting-row-auto"
                label={EVOLUTION_SETTING_AUTO_LABEL}
                desc={EVOLUTION_SETTING_AUTO_DESC}
                control={
                  <button
                    type="button"
                    data-testid="auto-toggle"
                    onClick={() => {
                      const next = !autoOn;
                      setAutoOnLocal(next);
                      updateConfig.mutate({ autoEvolutionEnabled: next });
                      toast.info(next ? EVOLUTION_TOAST_AUTO_ON : EVOLUTION_TOAST_AUTO_OFF);
                    }}
                    style={{
                      position: 'relative',
                      height: 28,
                      width: 48,
                      borderRadius: 9999,
                      border: 'none',
                      cursor: 'pointer',
                      background: autoOn
                        ? 'linear-gradient(110deg,#d4e6ff 0%,#a8c5e0 52%,#7fb0e6 100%)'
                        : 'rgba(255,255,255,0.15)',
                      transition: 'background 0.2s',
                    }}
                    aria-pressed={autoOn}
                    aria-label="自动进化开关"
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: autoOn ? 20 : 2,
                        height: 24,
                        width: 24,
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                }
              />
              <SettingRow
                testid="setting-row-direction"
                label={EVOLUTION_SETTING_DIR_LABEL}
                desc={EVOLUTION_SETTING_DIR_DESC}
                control={
                  <span
                    style={{
                      borderRadius: 10,
                      padding: '4px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      border: `0.5px solid rgba(168,197,224,0.5)`,
                      background: 'rgba(168,197,224,0.14)',
                      color: C.ikb,
                      fontFamily: F.cn,
                      textShadow: C.textShadow,
                    }}
                  >
                    {currentDirection || EVOLUTION_DIR_DEFAULT_TAG}
                  </span>
                }
              />
            </div>
          </section>
        </Reveal>

        {/* §4 数据洞察 band */}
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
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
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ background: C.ikb }} />
              模型已就绪
            </span>
          </div>
        </Reveal>
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 16, marginBottom: 40 }}>
          {/* 进化维度雷达 · col-span-5 */}
          <Item>
            <motion.div
              className="lg-glass"
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
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>进化维度雷达</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>六维模型评估</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: C.ink, margin: 0, textShadow: '0 1px 4px rgba(6,14,38,.9),0 0 16px rgba(6,14,38,.55)' }}>73</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>综合分</p>
                </div>
              </div>
              {(() => {
                const dims = EV_RADAR_DIMS;
                const cx = 130; const cy = 122; const R = 88;
                const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
                const pt = (i: number, r: number): [number, number] => [
                  cx + r * Math.cos(ang(i)),
                  cy + r * Math.sin(ang(i)),
                ];
                const poly = (r: number) =>
                  dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
                const dataPoly = dims
                  .map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(','))
                  .join(' ');
                return (
                  <svg viewBox="0 0 260 244" style={{ width: '100%' }}>
                    <defs>
                      <linearGradient id="ev-radarFill" x1="0" y1="0" x2="0" y2="1">
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
                    <polygon points={dataPoly} fill="url(#ev-radarFill)" stroke="#d4e6ff" strokeWidth="2" strokeLinejoin="round" />
                    {dims.map((d, i) => {
                      const [x, y] = pt(i, R * (d.value / 100));
                      return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
                    })}
                    {dims.map((d, i) => {
                      const [x, y] = pt(i, R + 16);
                      return (
                        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.84)" fontSize="10.5" fontWeight="600">
                          {d.label}
                        </text>
                      );
                    })}
                  </svg>
                );
              })()}
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {EV_RADAR_DIMS.map((d) => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ height: 8, width: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, textShadow: C.textShadow }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </Item>

          {/* 进化成长曲线 · col-span-7 */}
          <Item>
            <motion.div
              className="lg-glass"
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
                      background: 'rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.9)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>show_chart</span>
                  </span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>进化成长曲线</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>按进化维度综合测算</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {['成长', '反馈', '学习'].map((t, i) => (
                    <span
                      key={t}
                      style={{
                        borderRadius: 8,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: F.cn,
                        ...(i === 0
                          ? { background: C.grad, color: '#fff', textShadow: C.textShadow }
                          : { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.84)' }),
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>92</p>
                <span
                  style={{
                    marginBottom: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    borderRadius: 9999,
                    padding: '2px 8px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    textShadow: C.textShadow,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>trending_up</span>
                  +360%
                </span>
                <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>较冷启动基线</span>
              </div>
              {(() => {
                const data = EV_TREND_DATA;
                const W = 560; const H = 168;
                const padL = 6; const padR = 6; const padT = 12; const padB = 8;
                const innerW = W - padL - padR; const innerH = H - padT - padB;
                const max = 110;
                const x = (i: number) => padL + (innerW * i) / (data.length - 1);
                const y = (v: number) => padT + innerH * (1 - v / max);
                const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
                const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
                    <defs>
                      <linearGradient id="ev-trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4e6ff" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#d4e6ff" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="ev-trendLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#d4e6ff" />
                        <stop offset="100%" stopColor="#a8c5e0" />
                      </linearGradient>
                    </defs>
                    {[0, 0.33, 0.66, 1].map((f) => (
                      <line key={f} x1={padL} x2={W - padR} y1={(padT + innerH * f).toFixed(1)} y2={(padT + innerH * f).toFixed(1)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    ))}
                    <path d={area} fill="url(#ev-trendFill)" />
                    <path d={line} fill="none" stroke="url(#ev-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((v, i) =>
                      i % 2 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke="#d4e6ff" strokeWidth="2" /> : null,
                    )}
                  </svg>
                );
              })()}
              <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 10, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>
                {EV_TREND_LABELS.map((m) => <span key={m}>{m}</span>)}
              </div>
            </motion.div>
          </Item>
        </RevealGroup>

      </div>
    </LiquidShell>
  );
}
