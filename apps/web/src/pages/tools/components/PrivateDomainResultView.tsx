/**
 * PrivateDomainResultView — ui/_7 设计稿 · 生成结果 · PRD-15 US-005
 * 液态玻璃皮 · 业务逻辑/testid 零改动
 */

import { RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

import { C, F } from '@/components/home-next/ikb/system';

import { PhaseCard } from './PhaseCard';

import type { PhaseData } from './PhaseCard';

interface PrivateDomainResultViewProps {
  phases: PhaseData[];
  isStreaming: boolean;
  summary?: string;
  onRetry: () => void;
  onViewHistory: () => void;
}

export function PrivateDomainResultView({
  phases,
  isStreaming,
  summary,
  onRetry,
  onViewHistory,
}: PrivateDomainResultViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="private-domain-result-view">
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isStreaming ? (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.ikb,
                fontFamily: F.cn,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              AI 生成中…
            </span>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(120,220,160,0.85)' }}>check_circle</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(120,220,160,0.85)', fontFamily: F.cn }}>6 阶段 SOP 已生成</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            type="button"
            onClick={onViewHistory}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-glass"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              borderRadius: 10, padding: '7px 14px',
              fontSize: 12, fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: F.cn,
            }}
            data-testid="view-history-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>history</span>
            历史记录
          </motion.button>
          <motion.button
            type="button"
            onClick={onRetry}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-glass"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              borderRadius: 10, padding: '7px 14px',
              fontSize: 12, fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: F.cn,
            }}
            data-testid="retry-btn"
          >
            <RotateCcw style={{ height: 13, width: 13 }} />
            重新生成
          </motion.button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div
          className="lg-glass"
          style={{ borderRadius: 14, padding: '12px 16px' }}
        >
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
            {summary}
          </p>
        </div>
      )}

      {/* 6-phase result with connectors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} data-testid="result-phases-list">
        {phases.map((phase, idx) => (
          <div key={phase.key} data-testid={`result-phase-row-${idx}`}>
            <PhaseCard
              phase={phase}
              index={idx}
              isGenerated={!isStreaming}
              isStreaming={isStreaming}
            />
            {idx < phases.length - 1 && (
              <div
                style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}
                aria-hidden="true"
                data-testid="phase-arrow"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'rgba(168,197,224,0.45)' }}
                >
                  arrow_downward
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
