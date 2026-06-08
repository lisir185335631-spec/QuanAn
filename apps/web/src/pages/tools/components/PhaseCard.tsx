/**
 * PhaseCard — 私域成交 6 阶段卡片 · PRD-15 US-005
 * 液态玻璃皮 · 业务逻辑/testid 零改动
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

import { C, F } from '@/components/home-next/ikb/system';

export interface PhaseData {
  key: string;
  name: string;
  goal: string;
  tactics: string[];
  scripts: string[];
  metrics: string[];
}

interface PhaseCardProps {
  phase: PhaseData;
  index: number;
  isGenerated: boolean;
  isStreaming?: boolean;
  onClick?: () => void;
}

const PHASE_ICONS: Record<string, string> = {
  attract:    'ads_click',
  add_wechat: 'chat_bubble',
  trust:      'handshake',
  moments:    'photo_camera',
  convert:    'shopping_cart',
  repurchase: 'autorenew',
};

// accent colour per phase (cycles through liquid glass palette)
const PHASE_ACCENTS: Record<string, string> = {
  attract:    '#d8e8ff',   // C.ikb
  add_wechat: '#e4eeff',   // C.yellow
  trust:      '#d8e8ff',   // C.ikb
  moments:    '#e4eeff',   // C.yellow
  convert:    '#d8e8ff',   // C.ikb
  repurchase: '#e4eeff',   // C.yellow
};

export function PhaseCard({ phase, index, isGenerated, isStreaming, onClick }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const icon = PHASE_ICONS[phase.key] ?? 'checklist';
  const accent = PHASE_ACCENTS[phase.key] ?? C.ikb;

  function handleToggle() {
    if (isGenerated) {
      setExpanded((v) => !v);
    } else {
      onClick?.();
    }
  }

  return (
    <motion.div
      className="lg-glass"
      whileHover={isGenerated ? { y: -3 } : {}}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        opacity: isGenerated ? 1 : 0.65,
        cursor: isGenerated ? 'pointer' : 'default',
      }}
      data-testid={`phase-card-${phase.key}`}
      onClick={handleToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(); }}
      role={isGenerated ? 'button' : undefined}
      tabIndex={isGenerated ? 0 : undefined}
      aria-expanded={expanded}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
        <span
          style={{
            display: 'flex',
            height: 40,
            width: 40,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(168,197,224,0.4), rgba(120,160,220,0.25))',
            color: accent,
            fontSize: 20,
            userSelect: 'none',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>
              阶段 {index + 1}
            </span>
            {isStreaming && (
              <span
                style={{
                  fontSize: 11,
                  color: C.ikb,
                  fontFamily: F.cn,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                生成中…
              </span>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
            {phase.name}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
              fontFamily: F.cn,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {phase.goal}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isGenerated ? (
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(120,220,160,0.85)' }}>check_circle</span>
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>circle</span>
          )}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>
            {isGenerated ? '已生成' : '未生成'}
          </span>
          {isGenerated && (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)' }}
            >
              {expanded ? 'expand_less' : 'chevron_right'}
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && isGenerated && (
        <div
          style={{
            padding: '0 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            borderTop: `0.5px solid ${C.line}`,
            paddingTop: 14,
          }}
          data-testid={`phase-detail-${phase.key}`}
          role="none"
          onClick={(e) => e.stopPropagation()}
        >
          {phase.tactics.length > 0 && (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>
                执行策略
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {phase.tactics.map((t, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
                    <span style={{ color: C.ikb, marginTop: 1, flexShrink: 0 }}>·</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {phase.scripts.length > 0 && (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>
                话术模板
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {phase.scripts.map((s, i) => (
                  <li key={i} style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {phase.metrics.length > 0 && (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>
                关键指标
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {phase.metrics.map((m, i) => (
                  <span
                    key={i}
                    style={{
                      borderRadius: 9999,
                      padding: '3px 10px',
                      fontSize: 11,
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.65)',
                      fontFamily: F.cn,
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
