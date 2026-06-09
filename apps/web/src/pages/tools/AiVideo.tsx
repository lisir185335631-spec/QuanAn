/**
 * AiVideo.tsx — /ai-video STORYBOARD 工具页 · iOS26 液态玻璃体系
 * LiquidShell 外壳 · lg-glass 卡 · 逻辑/testid 零改动
 * 2026-06-09
 */
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import {
  AI_VIDEO_ADVICE,
  AI_VIDEO_CHIP_SUBTITLE,
  AI_VIDEO_CHIP_TITLE,
  AI_VIDEO_CTA_TEXT,
  AI_VIDEO_DEFAULT_DEMO_SCRIPT,
  AI_VIDEO_EMPTY_BULLETS,
  AI_VIDEO_EMPTY_DESC,
  AI_VIDEO_EMPTY_H3,
  AI_VIDEO_LABEL_PLATFORM,
  AI_VIDEO_LABEL_TEXT,
  AI_VIDEO_LABEL_TYPE,
  AI_VIDEO_MOCK_SHOTS,
  AI_VIDEO_PLATFORMS,
  AI_VIDEO_RESTART_TEXT,
  AI_VIDEO_RESULT_SHOT_COUNT,
  AI_VIDEO_RESULT_TITLE,
  AI_VIDEO_RESULT_TOTAL_DURATION,
  AI_VIDEO_TIMELINE_SEGMENTS,
  AI_VIDEO_COPY_ALL_TEXT,
  AI_VIDEO_EXPORT_CSV_TEXT,
  SHOT_LABEL_ANGLE,
  SHOT_LABEL_MOVEMENT,
  SHOT_LABEL_EMOTION,
  SHOT_LABEL_TRANSITION,
  SHOT_LABEL_SCENE,
  SHOT_LABEL_DIALOGUE,
  SHOT_LABEL_ACTION,
} from '@/lib/constants/ai-video';
import { VIDEO_TYPES } from '@/lib/constants/video-types';

// ── 雷达六维数据 ──────────────────────────────────────────────────────────────
const RADAR_DIMS = [
  { label: '脚本质量', value: 90, color: C.ikb },
  { label: '分镜节奏', value: 85, color: 'rgba(255,255,255,0.85)' },
  { label: '视觉表现', value: 88, color: C.accent3 },
  { label: '平台适配', value: 82, color: C.ikb },
  { label: '时长把控', value: 78, color: 'rgba(255,255,255,0.85)' },
  { label: '转化引导', value: 92, color: C.accent3 },
];

// ── 情绪/节奏曲线(沿 10 镜头)───────────────────────────────────────────────
const EMOTION_CURVE = [40, 52, 70, 66, 58, 72, 80, 84, 88, 74];

// ── 平台品牌色(保留不变)─────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string, string> = {
  douyin: 'music_note',
  kuaishou: 'video_camera_back',
  xiaohongshu: 'menu_book',
  bilibili: 'tv',
  wechat_video: 'smart_display',
};
const PLATFORM_COLORS: Record<string, string> = {
  douyin: '#0ea5b7',
  kuaishou: '#ff6600',
  xiaohongshu: '#ff2442',
  bilibili: '#00aeec',
  wechat_video: '#07c160',
};

// ── InlinePlatformCard ────────────────────────────────────────────────────────
function InlinePlatformCard({
  platform,
  selected,
  onClick,
}: {
  platform: (typeof AI_VIDEO_PLATFORMS)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={`platform-card-${platform.key}`}
      className="lg-glass"
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        overflow: 'hidden',
        padding: '12px 14px',
        textAlign: 'left',
        borderRadius: 12,
        border: selected ? `1px solid ${C.ikb}` : `1px solid ${C.line}`,
        background: selected ? 'rgba(168,197,224,0.22)' : 'rgba(255,255,255,0.08)',
        cursor: 'pointer',
        outline: 'none',
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
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
          backgroundColor: PLATFORM_COLORS[platform.key] ?? '#888',
          color: '#fff',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden={true}>
          {PLATFORM_ICONS[platform.key] ?? 'device_hub'}
        </span>
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{platform.label}</span>
      </span>
      <span
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          display: 'flex',
          height: 16,
          width: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: selected ? C.ikb : 'transparent',
          color: selected ? '#fff' : 'transparent',
          border: selected ? 'none' : `1px solid ${C.line}`,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden={true}>
          check
        </span>
      </span>
    </motion.button>
  );
}

// ── InlineVideoTypeCard ───────────────────────────────────────────────────────
function InlineVideoTypeCard({
  type,
  selected,
  onClick,
}: {
  type: (typeof VIDEO_TYPES)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={`video-type-card-${type.key}`}
      className="lg-glass"
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        padding: 16,
        textAlign: 'left',
        borderRadius: 12,
        border: selected ? `1px solid ${C.ikb}` : `1px solid ${C.line}`,
        background: selected ? 'rgba(168,197,224,0.22)' : 'rgba(255,255,255,0.08)',
        cursor: 'pointer',
        outline: 'none',
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{type.label}</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{type.desc}</span>
      <span
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          display: 'flex',
          height: 16,
          width: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: selected ? C.ikb : 'transparent',
          color: selected ? '#fff' : 'transparent',
          border: selected ? 'none' : `1px solid ${C.line}`,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden={true}>
          check
        </span>
      </span>
    </motion.button>
  );
}

// ── InlineEmptyPlaceholderCard ────────────────────────────────────────────────
function InlineEmptyPlaceholderCard() {
  return (
    <div
      className="lg-glass"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 48,
        textAlign: 'center',
        borderRadius: 16,
        border: `2px dashed ${C.line}`,
      }}
      data-testid="ai-video-empty-card"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 64, marginBottom: 24, color: 'rgba(255,255,255,0.4)' }} aria-hidden={true}>
        movie
      </span>
      <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{AI_VIDEO_EMPTY_H3}</h3>
      <p style={{ marginBottom: 24, maxWidth: 440, fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{AI_VIDEO_EMPTY_DESC}</p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', listStyle: 'none', padding: 0, margin: 0 }}>
        {AI_VIDEO_EMPTY_BULLETS.map((bullet) => (
          <li key={bullet} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ marginTop: 2, fontSize: 16, color: C.ikb, flexShrink: 0 }} aria-hidden={true}>
              chevron_right
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── InlineResultTitleCard ─────────────────────────────────────────────────────
function InlineResultTitleCard({
  title,
  duration,
  shotCount,
  onCopy,
  onExport,
}: {
  title: string;
  duration: string;
  shotCount: string;
  onCopy: () => void;
  onExport: () => void;
}) {
  return (
    <div
      className="lg-glass"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 24,
        borderRadius: 16,
      }}
      data-testid="result-title-card"
    >
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          right: -48,
          top: -48,
          height: 176,
          width: 176,
          borderRadius: '50%',
          filter: 'blur(32px)',
          background: 'rgba(168,197,224,0.18)',
        }}
      />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              height: 48,
              width: 48,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              background: C.grad,
            }}
          >
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 24 }} aria-hidden={true}>
              movie
            </span>
          </div>
          <div>
            <span
              style={{
                marginBottom: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 9999,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'rgba(168,197,224,0.2)',
                color: C.ikb,
              }}
            >
              <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
              Storyboard
            </span>
            <h2 style={{ marginBottom: 8, fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>
                  timer
                </span>
                {duration}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>
                  grid_view
                </span>
                {shotCount}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onCopy}
            data-testid="result-copy-btn"
            onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 10,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              border: `1px solid ${C.line}`,
              color: C.ikb,
              background: 'rgba(255,255,255,0.08)',
              outline: 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>
              content_copy
            </span>
            {AI_VIDEO_COPY_ALL_TEXT}
          </button>
          <button
            type="button"
            onClick={onExport}
            data-testid="result-export-btn"
            onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 10,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              color: '#fff',
              background: C.grad,
              outline: 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>
              download
            </span>
            {AI_VIDEO_EXPORT_CSV_TEXT}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── InlineTimelineBar ─────────────────────────────────────────────────────────
const OPACITY_MAP: Record<string, number> = {
  '3s': 0.5,
  '5s': 0.6,
  '10s': 0.75,
  '12s': 0.8,
  '15s': 1.0,
};

function InlineTimelineBar({ segments }: { segments: ReadonlyArray<string> }) {
  return (
    <div style={{ display: 'flex', gap: 4 }} data-testid="ai-video-timeline">
      {segments.map((seg, idx) => {
        const opacity = OPACITY_MAP[seg] ?? 0.7;
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              height: 48,
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              background: `rgba(168,197,224,${opacity})`,
              textShadow: C.textShadow,
            }}
            data-testid={`timeline-seg-${idx + 1}`}
          >
            {seg}
          </div>
        );
      })}
    </div>
  );
}

// ── InlineAdviceCard ──────────────────────────────────────────────────────────
const ADVICE_ICONS: Record<string, string> = {
  shooting: 'videocam',
  editing: 'cut',
  music: 'music_note',
};
const ADVICE_ACCENT: [string, string, string] = [C.ikb, 'rgba(255,255,255,0.85)', C.accent3];

function InlineAdviceCard({
  advice,
  index,
}: {
  advice: { id: string; label: string; content: string };
  index: number;
}) {
  const accent = ADVICE_ACCENT[index % 3] ?? C.ikb;
  return (
    <Item style={{ height: '100%' }}>
      <motion.div
        className="lg-glass"
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12, borderRadius: 14, padding: 16, height: '100%' }}
        data-testid={`advice-card-${advice.id}`}
      >
        <span
          style={{
            display: 'flex',
            height: 36,
            width: 36,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: 'rgba(168,197,224,0.2)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: accent }}
            aria-hidden={true}
          >
            {ADVICE_ICONS[advice.id] ?? 'lightbulb'}
          </span>
        </span>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0, marginTop: 'auto' }}>
          <span style={{ fontWeight: 700, color: C.ink, textShadow: C.textShadow }}>{advice.label}</span>
          {advice.content}
        </p>
      </motion.div>
    </Item>
  );
}

// ── InlineShotCard(分镜时间线风格)────────────────────────────────────────────
function InlineShotCard({
  shot,
  isLast,
}: {
  shot: (typeof AI_VIDEO_MOCK_SHOTS)[number];
  isLast: boolean;
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', gap: 16 }} data-testid={`shot-card-${shot.num}`}>
      {/* 时间轴竖线 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            height: 36,
            width: 36,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            fontSize: 13,
            fontWeight: 800,
            color: C.ikb,
            border: `2px solid ${C.ikb}`,
            background: 'rgba(168,197,224,0.12)',
            textShadow: C.textShadow,
            fontFamily: F.mono,
          }}
        >
          {parseInt(shot.num, 10)}
        </div>
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              minHeight: 20,
              background: 'linear-gradient(to bottom, rgba(168,197,224,0.5), rgba(255,255,255,0.1))',
            }}
          />
        )}
      </div>
      {/* カード */}
      <div
        className="lg-glass"
        style={{ marginBottom: 16, flex: 1, padding: 20, borderRadius: 14 }}
      >
        {/* ヘッダー: SHOT# + 秒 + 景别 chip */}
        <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              borderRadius: 6,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              background: C.ikb,
              textShadow: C.textShadow,
            }}
          >
            SHOT {shot.num}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderRadius: 6,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 500,
              border: `1px solid ${C.line}`,
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden={true}>
              timer
            </span>
            {shot.duration}
          </span>
          <span
            style={{
              borderRadius: 6,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 500,
              border: `1px solid rgba(168,197,224,0.4)`,
              background: 'rgba(168,197,224,0.15)',
              color: C.ikb,
            }}
          >
            {shot.framing}
          </span>
        </div>

        {/* 4 cell grid: 角度/运镜/情绪/转场 */}
        <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: SHOT_LABEL_ANGLE, value: shot.angle },
            { label: SHOT_LABEL_MOVEMENT, value: shot.movement },
            { label: SHOT_LABEL_EMOTION, value: shot.emotion },
            { label: SHOT_LABEL_TRANSITION, value: shot.transition },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                borderRadius: 8,
                padding: 10,
                border: `1px solid ${C.line}`,
                background: 'rgba(255,255,255,0.06)',
              }}
            >
              <p style={{ marginBottom: 4, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontSize: 12, lineHeight: 1.4, color: 'rgba(255,255,255,0.75)', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* 场景 + 台词/旁白 */}
        <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p
              style={{ marginBottom: 6, fontSize: 12, fontWeight: 800, color: C.ink, margin: '0 0 6px', fontFamily: F.cn, textShadow: C.textShadow }}
            >
              <span
                style={{ borderLeft: `3px solid ${C.ikb}`, paddingLeft: 6 }}
              >
                {SHOT_LABEL_SCENE}
              </span>
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn, margin: 0 }}>{shot.scene}</p>
          </div>
          <div>
            <p
              style={{ marginBottom: 6, fontSize: 12, fontWeight: 800, color: C.ink, margin: '0 0 6px', fontFamily: F.cn, textShadow: C.textShadow }}
            >
              <span
                style={{ borderLeft: `3px solid rgba(255,255,255,0.6)`, paddingLeft: 6 }}
              >
                {SHOT_LABEL_DIALOGUE}
              </span>
            </p>
            <div
              style={{
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                lineHeight: 1.6,
                border: `1px solid ${C.line}`,
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              {shot.dialogue}
            </div>
          </div>
        </div>

        {/* 动作指导 */}
        <div style={{ marginBottom: 12 }}>
          <p
            style={{ marginBottom: 6, fontSize: 12, fontWeight: 800, color: C.ink, margin: '0 0 6px', fontFamily: F.cn, textShadow: C.textShadow }}
          >
            <span
              style={{ borderLeft: `3px solid ${C.accent3}`, paddingLeft: 6 }}
            >
              {SHOT_LABEL_ACTION}
            </span>
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn, margin: 0 }}>{shot.action}</p>
        </div>

        {/* 字幕/音乐/提示 chip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              borderRadius: 8,
              padding: '8px 12px',
              border: `1px solid ${C.line}`,
              background: 'rgba(255,255,255,0.06)',
            }}
            data-testid={`shot-chip-subtitle-${shot.num}`}
          >
            <span className="material-symbols-outlined" style={{ marginTop: 2, fontSize: 14, color: C.ikb, flexShrink: 0 }} aria-hidden={true}>
              subtitles
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>{shot.subtitle}</span>
          </div>
          {/* 音乐 chip — 冷蓝点缀 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              borderRadius: 8,
              padding: '8px 12px',
              border: `1px solid rgba(168,197,224,0.35)`,
              background: 'rgba(168,197,224,0.08)',
            }}
            data-testid={`shot-chip-music-${shot.num}`}
          >
            <span className="material-symbols-outlined" style={{ marginTop: 2, fontSize: 14, color: C.accent3, flexShrink: 0 }} aria-hidden={true}>
              music_note
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>{shot.music}</span>
          </div>
          {/* 拍摄提示 chip — 白点缀 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              borderRadius: 8,
              padding: '8px 12px',
              border: `1px solid rgba(255,255,255,0.15)`,
              background: 'rgba(255,255,255,0.06)',
            }}
            data-testid={`shot-chip-tip-${shot.num}`}
          >
            <span className="material-symbols-outlined" style={{ marginTop: 2, fontSize: 14, color: 'rgba(255,255,255,0.75)', flexShrink: 0 }} aria-hidden={true}>
              lightbulb
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>{shot.tip}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiVideo() {
  const [text, setText] = useState(AI_VIDEO_DEFAULT_DEMO_SCRIPT);
  const [platform, setPlatform] = useState<string>('douyin');
  const [videoType, setVideoType] = useState<string>('monologue');
  const [isResultShown, setIsResultShown] = useState(false);

  const handleGenerate = () => setIsResultShown(true);
  const handleRestart = () => setIsResultShown(false);

  const selectedPlatformLabel =
    AI_VIDEO_PLATFORMS.find((p) => p.key === platform)?.label ?? platform;
  const selectedTypeLabel =
    VIDEO_TYPES.find((vt) => vt.key === videoType)?.label ?? videoType;

  return (
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
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
              AI 视频
            </span>
          </Reveal>
          {/* 主标题 — 冷蓝渐变字 */}
          <h1
            data-testid="ai-video-title"
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
            {AI_VIDEO_CHIP_TITLE}
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
            {AI_VIDEO_CHIP_SUBTITLE}
          </p>
        </div>
        <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'nowrap', gap: 12 }}>
          <button
            type="button"
            aria-label="复制全部分镜"
            onClick={() => toast.success('已复制全部分镜')}
            onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            style={{
              display: 'flex',
              flexShrink: 0,
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              borderRadius: 10,
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: `1px solid ${C.line}`,
              background: 'rgba(255,255,255,0.08)',
              color: C.ink,
              fontFamily: F.mono,
              textShadow: C.textShadow,
              outline: 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>
              content_copy
            </span>
            复制全部
          </button>
          <button
            type="button"
            aria-label="导出 CSV"
            onClick={() => toast.info('CSV 导出 · 即将上线')}
            onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            style={{
              display: 'flex',
              flexShrink: 0,
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              borderRadius: 10,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              color: '#fff',
              background: C.grad,
              outline: 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>
              download
            </span>
            导出方案
          </button>
        </div>
      </header>

      {/* ── 输入卡 ─────────────────────────────────────────── */}
      <Reveal>
        <section
          className="lg-glass"
          style={{
            position: 'relative',
            marginBottom: 40,
            overflow: 'hidden',
            padding: 24,
            borderRadius: 20,
          }}
          data-testid="storyboard-chip"
        >
          <div
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              right: -64,
              top: -64,
              height: 176,
              width: 176,
              borderRadius: '50%',
              filter: 'blur(32px)',
              background: 'rgba(168,197,224,0.15)',
            }}
          />
          <div
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              bottom: -80,
              left: '33%',
              height: 176,
              width: 176,
              borderRadius: '50%',
              filter: 'blur(32px)',
              background: 'rgba(255,255,255,0.06)',
            }}
          />

          {/* Section header */}
          <div
            style={{
              position: 'relative',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 20,
              borderBottom: `1px solid ${C.line}`,
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
                  borderRadius: 14,
                  color: '#fff',
                  background: C.grad,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden={true}>
                  movie
                </span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>STORYBOARD</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>专业分镜表生成器 · 文案一键转拍摄方案</p>
              </div>
            </div>
            {/* 待生成状态 badge */}
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
              }}
            >
              <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
              待生成
            </span>
          </div>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* 文案内容 */}
            <div>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label
                  htmlFor="ai-video-text"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                  }}
                >
                  <span
                    style={{
                      height: 14,
                      width: 4,
                      borderRadius: 2,
                      background: C.grad,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  {AI_VIDEO_LABEL_TEXT}
                </label>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.ikb }} aria-hidden={true}>
                    auto_awesome
                  </span>
                  AI 据此生成分镜+拍摄方案
                </span>
              </div>
              <div
                className="lg-glass"
                style={{
                  overflow: 'hidden',
                  borderRadius: 14,
                }}
              >
                <textarea
                  id="ai-video-text"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 5000))}
                  maxLength={5000}
                  rows={10}
                  placeholder="输入你的短视频文案，包含标题、话题、正反方观点、结论等结构"
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; e.currentTarget.style.border = '0.5px solid rgba(168,197,224,0.7)'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.border = '0'; }}
                  style={{
                    width: '100%',
                    resize: 'none',
                    border: 0,
                    background: 'transparent',
                    padding: 16,
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily: F.cn,
                    color: C.ink,
                    outline: 'none',
                  }}
                  data-testid="ai-video-textarea"
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 16px',
                    borderTop: `1px solid ${C.line}`,
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)' }}>建议包含</span>
                    {['标题', '话题', '正方', '反方', '结论', '引导'].map((t) => (
                      <span
                        key={t}
                        style={{
                          borderRadius: 9999,
                          padding: '2px 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          background: 'rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.84)',
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span
                    style={{ flexShrink: 0, fontSize: 11, color: 'rgba(255,255,255,0.72)', fontVariantNumeric: 'tabular-nums' }}
                    data-testid="ai-video-char-count"
                  >
                    {text.length}/5000
                  </span>
                </div>
              </div>
            </div>

            {/* 发布平台 */}
            <div>
              <span
                id="aiv-platform-label"
                style={{
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: C.ink,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                <span
                  style={{ height: 14, width: 4, borderRadius: 2, background: C.grad, display: 'inline-block', flexShrink: 0 }}
                />
                {AI_VIDEO_LABEL_PLATFORM}
              </span>
              <div role="group" aria-labelledby="aiv-platform-label" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }} data-testid="platform-grid">
                {AI_VIDEO_PLATFORMS.map((p) => (
                  <InlinePlatformCard
                    key={p.key}
                    platform={p}
                    selected={p.key === platform}
                    onClick={() => setPlatform(p.key)}
                  />
                ))}
              </div>
            </div>

            {/* 视频类型 */}
            <div>
              <span
                id="aiv-type-label"
                style={{
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: C.ink,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                <span
                  style={{ height: 14, width: 4, borderRadius: 2, background: C.grad, display: 'inline-block', flexShrink: 0 }}
                />
                {AI_VIDEO_LABEL_TYPE}
              </span>
              <div role="group" aria-labelledby="aiv-type-label" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} data-testid="video-type-grid">
                {VIDEO_TYPES.map((vt) => (
                  <InlineVideoTypeCard
                    key={vt.key}
                    type={vt}
                    selected={vt.key === videoType}
                    onClick={() => setVideoType(vt.key)}
                  />
                ))}
              </div>
            </div>

            {/* 主 CTA */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Magnetic strength={0.3}>
                <button
                  type="button"
                  onClick={handleGenerate}
                  data-testid="ai-video-cta"
                  className="lg-gradbtn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 9999,
                    padding: '14px 34px',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    color: '#fff',
                    fontFamily: F.cn,
                    outline: 'none',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>
                    auto_awesome
                  </span>
                  {AI_VIDEO_CTA_TEXT}
                </button>
              </Magnetic>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 44 }}>
        {/* 分镜数 · 环形进度 */}
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
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>
                  movie
                </span>
              </span>
              {/* 完整 badge */}
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
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden={true}>
                  trending_up
                </span>
                完整
              </span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>
                  {AI_VIDEO_MOCK_SHOTS.length}
                  <span style={{ marginLeft: 4, fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}> 个</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: '6px 0 0', fontFamily: F.cn }}>分镜数</p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={C.ikb}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(100, AI_VIDEO_MOCK_SHOTS.length * 10)} 100`}
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </Item>

        {/* 总时长 · 迷你柱 */}
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
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>
                  timer
                </span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                已测算
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>
                {AI_VIDEO_RESULT_TOTAL_DURATION}
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: '6px 0 0', fontFamily: F.cn }}>总时长</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
              {[45, 68, 55, 80, 62, 90, 72].map((h, i) => (
                <div
                  key={i}
                  style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: 'rgba(255,255,255,0.4)' }}
                />
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 目标平台 · 进度条 */}
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
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>
                  hub
                </span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                已选
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>
                {selectedPlatformLabel}
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: '6px 0 0', fontFamily: F.cn }}>目标平台</p>
            </div>
            <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 9999, background: 'rgba(255,255,255,0.12)' }}>
              <div
                style={{ height: 8, width: '100%', borderRadius: 9999, background: `linear-gradient(to right, ${C.accent3}, ${C.ikb})` }}
              />
            </div>
          </motion.div>
        </Item>

        {/* 视频类型 · 关键词 chip */}
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
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>
                  video_library
                </span>
              </span>
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
                {VIDEO_TYPES.length} 种
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>
                {selectedTypeLabel}
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: '6px 0 0', fontFamily: F.cn }}>视频类型</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['口播', '剧情', 'Vlog'].map((k) => (
                <span
                  key={k}
                  style={{
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 500,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── Empty 态 · isResultShown=false ─────────────────── */}
      {!isResultShown && <InlineEmptyPlaceholderCard />}

      {/* ── Result 态 · isResultShown=true ─────────────────── */}
      {isResultShown && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 清空按钮 */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleRestart}
              data-testid="ai-video-restart"
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.55)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                border: `1px solid ${C.line}`,
                color: 'rgba(255,255,255,0.84)',
                background: 'rgba(255,255,255,0.08)',
                outline: 'none',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>
                delete
              </span>
              {AI_VIDEO_RESTART_TEXT}
            </button>
          </div>

          {/* 标题卡 */}
          <InlineResultTitleCard
            title={AI_VIDEO_RESULT_TITLE}
            duration={AI_VIDEO_RESULT_TOTAL_DURATION}
            shotCount={AI_VIDEO_RESULT_SHOT_COUNT}
            onCopy={() => toast.success('已复制全部')}
            onExport={() => toast.info('CSV 导出 · 即将上线')}
          />

          {/* 时间轴 */}
          <InlineTimelineBar segments={AI_VIDEO_TIMELINE_SEGMENTS} />

          {/* 3 段建议 · 两列卡片 */}
          <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {AI_VIDEO_ADVICE.map((a, i) => (
              <InlineAdviceCard key={a.id} advice={a} index={i} />
            ))}
          </RevealGroup>

          {/* 10 SHOT 分镜时间线 */}
          <Reveal>
            <div
              className="lg-glass"
              style={{
                padding: 24,
                borderRadius: 20,
              }}
            >
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 44,
                      width: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 14,
                      color: '#fff',
                      background: C.grad,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden={true}>
                      movie
                    </span>
                  </span>
                  <div>
                    <span
                      style={{
                        marginBottom: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 9999,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        background: 'rgba(168,197,224,0.2)',
                        color: C.ikb,
                      }}
                    >
                      <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
                      Storyboard
                    </span>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>分镜脚本</h3>
                  </div>
                </div>
                <span
                  style={{
                    borderRadius: 9999,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                  }}
                >
                  {AI_VIDEO_MOCK_SHOTS.length} 镜头
                </span>
              </div>
              <div>
                {AI_VIDEO_MOCK_SHOTS.map((shot, idx) => (
                  <InlineShotCard
                    key={shot.num}
                    shot={shot}
                    isLast={idx === AI_VIDEO_MOCK_SHOTS.length - 1}
                  />
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      )}

      {/* ── 数据洞察(雷达 + 情绪曲线)─────────────────────────── */}
      <Reveal style={{ marginTop: 40 }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>
            insights
          </span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
          {/* 模型就绪 badge */}
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
            }}
          >
            <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            模型已就绪
          </span>
        </div>
      </Reveal>
      <div style={{ marginBottom: 44, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 }}>
        {/* 视频制作力雷达 */}
        <motion.div
          className="lg-glass lg-spec"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ padding: 24, borderRadius: 18 }}
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
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>
                  radar
                </span>
              </span>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>视频制作力雷达</h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>六维模型评估</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: C.ink, margin: 0, textShadow: C.textShadow }}>86</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', margin: 0 }}>综合分</p>
            </div>
          </div>
          {(() => {
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [
              cx + r * Math.cos(ang(i)),
              cy + r * Math.sin(ang(i)),
            ];
            const poly = (r: number) =>
              RADAR_DIMS.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = RADAR_DIMS.map((d, i) =>
              pt(i, R * (d.value / 100))
                .map((n) => n.toFixed(1))
                .join(','),
            ).join(' ');
            return (
              <svg viewBox="0 0 260 244" style={{ width: '100%' }}>
                <defs>
                  <linearGradient id="aiv-radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.1)" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon
                    key={f}
                    points={poly(R * f)}
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                  />
                ))}
                {RADAR_DIMS.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return (
                    <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  );
                })}
                <polygon
                  points={dataPoly}
                  fill="url(#aiv-radarFill)"
                  stroke={C.ikb}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {RADAR_DIMS.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return (
                    <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />
                  );
                })}
                {RADAR_DIMS.map((d, i) => {
                  const [x, y] = pt(i, R + 16);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.65)"
                      fontSize="10.5"
                      fontWeight="600"
                    >
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            );
          })()}
          <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {RADAR_DIMS.map((d) => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, textShadow: C.textShadow }}>{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 分镜情绪/节奏曲线 */}
        <motion.div
          className="lg-glass lg-spec"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ padding: 24, borderRadius: 18 }}
        >
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
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
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>
                  show_chart
                </span>
              </span>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>分镜情绪/节奏曲线</h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>沿 10 个镜头情绪强度推演</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {['强度', '节奏', '峰值'].map((t, i) => (
                <span
                  key={t}
                  style={
                    i === 0
                      ? { borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: C.ikb, color: '#fff' }
                      : { borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.84)' }
                  }
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>88</p>
            {/* 峰值 badge */}
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
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>
                trending_up
              </span>
              峰值
            </span>
            <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>第9镜情绪最高点</span>
          </div>
          {(() => {
            const data = EMOTION_CURVE;
            const W = 560;
            const H = 168;
            const padL = 6;
            const padR = 6;
            const padT = 12;
            const padB = 8;
            const innerW = W - padL - padR;
            const innerH = H - padT - padB;
            const max = 100;
            const denom = Math.max(data.length - 1, 1);
            const x = (i: number) => padL + (innerW * i) / denom;
            const y = (v: number) => padT + innerH * (1 - v / max);
            const line = data
              .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
              .join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
                <defs>
                  <linearGradient id="aiv-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="aiv-trendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.ikb} />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
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
                <path d={area} fill="url(#aiv-trendFill)" />
                <path
                  d={line}
                  fill="none"
                  stroke="url(#aiv-trendLine)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((v, i) =>
                  i % 2 === 0 ? (
                    <circle
                      key={i}
                      cx={x(i)}
                      cy={y(v)}
                      r="3.4"
                      fill="rgba(255,255,255,0.9)"
                      stroke={C.ikb}
                      strokeWidth="2"
                    />
                  ) : null,
                )}
              </svg>
            );
          })()}
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 10, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>
            {Array.from({ length: 10 }, (_, i) => `镜头${i + 1}`).map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </LiquidShell>
  );
}
