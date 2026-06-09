// PRD-29.10 · Step4b 单个 stage sub-component(3 次复用)
import { C, F } from '@/components/home-next/ikb/system';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface Step4bStage {
  number: 1 | 2 | 3;
  icon: 'trending' | 'diamond' | 'crown';
  range: string;
  title: string;
  duration: string;
  coreStrategy: string;
  productMatrix: Array<{
    category: '引流品' | '信任品' | '利润品' | '后端产品';
    name: string;
    priceRange: string;
    targetCustomer: string;
    monthlyTarget: string;
    monthlyRevenue: string;
  }>;
  trafficStrategy?: string;
  conversionFlow?: string[];
  teamBuilding?: string;
  systemBuilding?: string;
  brandStrategy?: string;
  matrixLayout?: string;
  keyActions: string[];
  risks: string[];
}

interface Step4bStageSectionProps {
  stage: Step4bStage;
  className?: string;
}

function stageEmoji(icon: Step4bStage['icon']): string {
  if (icon === 'trending') return '📈';
  if (icon === 'diamond') return '💎';
  return '👑';
}

export function Step4bStageSection({ stage, className }: Step4bStageSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row · large icon circle + range + title */}
      <div className="flex items-start gap-4">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full text-2xl shrink-0"
          style={{ border: `0.5px solid rgba(216,232,255,0.35)`, background: 'rgba(216,232,255,0.12)' }}
          aria-hidden="true"
        >
          {stageEmoji(stage.icon)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold" style={{ color: C.ikb, fontFamily: F.display }}>{stage.range}</span>
            <h3 className="text-lg font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{stage.title}</h3>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>↗ {stage.duration}</p>
        </div>
      </div>

      {/* ⚡ 核心策略 */}
      <SubCard>
        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">⚡</span> 核心策略</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{stage.coreStrategy}</p>
        </div>
      </SubCard>

      {/* 📦 产品矩阵 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">📦</span> 产品矩阵</p>
          <div className="grid grid-cols-2 gap-3">
            {stage.productMatrix.map((product, i) => (
              <div key={i} className="rounded p-3 space-y-1.5" style={{ border: `0.5px solid ${C.line}`, background: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                    <span className="font-semibold" style={{ color: C.ikb }}>{product.category}：</span>
                    <span style={{ color: C.ink }}>{product.name}</span>
                  </p>
                  <span className="text-xs font-semibold shrink-0" style={{ color: C.ikb, fontFamily: F.mono }}>{product.priceRange}</span>
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>目标客户: {product.targetCustomer}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>月目标: {product.monthlyTarget}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>
                  月收入: <span className="font-semibold" style={{ color: 'rgba(100,220,160,0.9)' }}>{product.monthlyRevenue}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 📊 流量策略 · 仅 stage 1 */}
      {stage.trafficStrategy && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">📊</span> 流量策略</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{stage.trafficStrategy}</p>
          </div>
        </SubCard>
      )}

      {/* ⟲ 转化流程 · 仅 stage 1 */}
      {stage.conversionFlow && stage.conversionFlow.length > 0 && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>⟲ 转化流程</p>
            <div className="space-y-2">
              {stage.conversionFlow.map((step, i) => (
                <p key={i} className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{step}</p>
              ))}
            </div>
          </div>
        </SubCard>
      )}

      {/* 👥 团队建设 · 仅 stage 2 */}
      {stage.teamBuilding && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">👥</span> 团队建设</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{stage.teamBuilding}</p>
          </div>
        </SubCard>
      )}

      {/* ⚙ 体系化建设 · 仅 stage 2 */}
      {stage.systemBuilding && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>⚙ 体系化建设</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{stage.systemBuilding}</p>
          </div>
        </SubCard>
      )}

      {/* 🏆 品牌化策略 · 仅 stage 3 */}
      {stage.brandStrategy && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">🏆</span> 品牌化策略</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{stage.brandStrategy}</p>
          </div>
        </SubCard>
      )}

      {/* 🧭 矩阵化布局 · 仅 stage 3 */}
      {stage.matrixLayout && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">🧭</span> 矩阵化布局</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{stage.matrixLayout}</p>
          </div>
        </SubCard>
      )}

      {/* 🎯 关键动作 */}
      <SubCard>
        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">🎯</span> 关键动作</p>
          <ul className="space-y-1.5">
            {stage.keyActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
                <span className="shrink-0" style={{ color: 'rgba(100,220,160,0.9)' }} aria-hidden="true">✓</span>
                <span className="leading-relaxed">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </SubCard>

      {/* 风险提示 · 独立半透红边 box */}
      <div className="rounded-lg p-4 space-y-2" style={{ border: `0.5px solid rgba(255,120,120,0.35)`, background: 'rgba(255,60,60,0.08)' }}>
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'rgba(255,140,140,0.95)', fontFamily: F.cn }}>
          <span aria-hidden="true">🛡️</span> 风险提示
        </p>
        <ul className="space-y-1">
          {stage.risks.map((risk, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="shrink-0" style={{ color: 'rgba(255,140,140,0.95)' }} aria-hidden="true">·</span>
              <span className="text-xs leading-relaxed" style={{ color: 'rgba(255,180,180,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{risk}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
