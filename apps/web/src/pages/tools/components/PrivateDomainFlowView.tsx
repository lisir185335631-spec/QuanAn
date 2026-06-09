/**
 * PrivateDomainFlowView — ui/_1 设计稿 · 6 阶段流程图 · PRD-15 US-005
 * 液态玻璃皮 · 业务逻辑/testid 零改动
 */

import { motion } from 'framer-motion';

import { C, F } from '@/components/home-next/ikb/system';

import { PhaseCard } from './PhaseCard';

import type { PhaseData } from './PhaseCard';

const DEFAULT_PHASES: PhaseData[] = [
  { key: 'attract',    name: '引流获客',   goal: '通过内容吸引目标受众关注',    tactics: [], scripts: [], metrics: [] },
  { key: 'add_wechat', name: '加微转化',   goal: '将平台粉丝引导至微信私域',    tactics: [], scripts: [], metrics: [] },
  { key: 'trust',      name: '信任建立',   goal: '建立专业信任感，培育购买意愿', tactics: [], scripts: [], metrics: [] },
  { key: 'moments',    name: '朋友圈打造', goal: '打造专业+真实的朋友圈人设',   tactics: [], scripts: [], metrics: [] },
  { key: 'convert',    name: '成交转化',   goal: '完成最终销售转化',            tactics: [], scripts: [], metrics: [] },
  { key: 'repurchase', name: '复购裂变',   goal: '实现复购与口碑裂变',          tactics: [], scripts: [], metrics: [] },
];

interface PrivateDomainFlowViewProps {
  phases: PhaseData[] | null;
  isStreaming?: boolean;
  onStartConfig: () => void;
}

export function PrivateDomainFlowView({
  phases,
  isStreaming,
  onStartConfig,
}: PrivateDomainFlowViewProps) {
  const displayPhases = phases ?? DEFAULT_PHASES;
  const isGenerated = phases !== null && !isStreaming;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="private-domain-flow-view">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.8)',
              fontFamily: F.mono,
            }}
          >
            私域成交流程
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: F.cn }}>
            {isGenerated
              ? '点击任意阶段查看详细 SOP 和话术'
              : '配置参数后，AI 将生成完整 6 阶段执行 SOP'}
          </p>
        </div>
        {!isGenerated && (
          <motion.button
            type="button"
            onClick={onStartConfig}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: C.ikb,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
            data-testid="start-config-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>settings</span>
            开始配置
          </motion.button>
        )}
      </div>

      {/* 6-phase flow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="phase-flow-list">
        {displayPhases.map((phase, idx) => (
          <div key={phase.key} style={{ position: 'relative' }} data-testid={`phase-row-${idx}`}>
            <PhaseCard
              phase={phase}
              index={idx}
              isGenerated={isGenerated}
              isStreaming={isStreaming && idx === 0}
              onClick={onStartConfig}
            />
            {idx < displayPhases.length - 1 && (
              <div
                style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}
                aria-hidden="true"
                data-testid="phase-connector"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'rgba(168,197,224,0.4)', transform: 'rotate(90deg)' }}
                >
                  chevron_right
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA when not generated */}
      {!isGenerated && !isStreaming && (
        <div
          className="lg-glass"
          style={{
            borderRadius: 14,
            padding: 24,
            textAlign: 'center',
            border: `0.5px dashed ${C.line}`,
          }}
          data-testid="flow-empty-state"
        >
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
            点击「开始配置」填写产品信息，AI 将生成完整的私域成交执行方案
          </p>
        </div>
      )}
    </div>
  );
}
