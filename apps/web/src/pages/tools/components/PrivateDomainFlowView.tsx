/**
 * PrivateDomainFlowView — ui/_1 设计稿 · 6 阶段流程图 · PRD-15 US-005
 * AC-2: 6 阶段卡片 · 每卡片显示阶段名+描述+状态 · 点击展开详情
 */

import { ArrowRight, Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { PhaseCard } from './PhaseCard';

import type { PhaseData } from './PhaseCard';

const DEFAULT_PHASES: PhaseData[] = [
  {
    key: 'attract',
    name: '引流获客',
    goal: '通过内容吸引目标受众关注',
    tactics: [],
    scripts: [],
    metrics: [],
  },
  {
    key: 'add_wechat',
    name: '加微转化',
    goal: '将平台粉丝引导至微信私域',
    tactics: [],
    scripts: [],
    metrics: [],
  },
  {
    key: 'trust',
    name: '信任建立',
    goal: '建立专业信任感，培育购买意愿',
    tactics: [],
    scripts: [],
    metrics: [],
  },
  {
    key: 'moments',
    name: '朋友圈打造',
    goal: '打造专业+真实的朋友圈人设',
    tactics: [],
    scripts: [],
    metrics: [],
  },
  {
    key: 'convert',
    name: '成交转化',
    goal: '完成最终销售转化',
    tactics: [],
    scripts: [],
    metrics: [],
  },
  {
    key: 'repurchase',
    name: '复购裂变',
    goal: '实现复购与口碑裂变',
    tactics: [],
    scripts: [],
    metrics: [],
  },
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
    <div className="space-y-4" data-testid="private-domain-flow-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-label-sm text-muted-foreground uppercase tracking-wide">私域成交流程</p>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {isGenerated
              ? '点击任意阶段查看详细 SOP 和话术'
              : '配置参数后，AI 将生成完整 6 阶段执行 SOP'}
          </p>
        </div>
        {!isGenerated && (
          <Button
            size="sm"
            onClick={onStartConfig}
            data-testid="start-config-btn"
          >
            <Settings2 className="h-4 w-4 mr-1.5" />
            开始配置
          </Button>
        )}
      </div>

      {/* 6-phase flow */}
      <div className="space-y-2" data-testid="phase-flow-list">
        {displayPhases.map((phase, idx) => (
          <div key={phase.key} className="relative" data-testid={`phase-row-${idx}`}>
            <PhaseCard
              phase={phase}
              index={idx}
              isGenerated={isGenerated}
              isStreaming={isStreaming && idx === 0}
              onClick={onStartConfig}
            />
            {idx < displayPhases.length - 1 && (
              <div
                className="flex justify-center py-0.5"
                aria-hidden="true"
                data-testid="phase-connector"
              >
                <ArrowRight className="h-3 w-3 text-muted-foreground/50 rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA when not generated */}
      {!isGenerated && !isStreaming && (
        <div
          className="rounded-lg border border-dashed border-border p-6 text-center"
          data-testid="flow-empty-state"
        >
          <p className="text-body-sm text-muted-foreground">
            点击「开始配置」填写产品信息，AI 将生成完整的私域成交执行方案
          </p>
        </div>
      )}
    </div>
  );
}
