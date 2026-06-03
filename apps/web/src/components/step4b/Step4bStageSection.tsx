// PRD-29.10 · Step4b 单个 stage sub-component(3 次复用)
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
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#002fa7]/20 bg-[#eff4ff] text-2xl shrink-0" aria-hidden="true">
          {stageEmoji(stage.icon)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#002fa7] text-lg font-bold">{stage.range}</span>
            <h3 className="text-lg font-semibold text-[#111827]">{stage.title}</h3>
          </div>
          <p className="text-xs text-[#6b7280]">↗ {stage.duration}</p>
        </div>
      </div>

      {/* ⚡ 核心策略 */}
      <SubCard className="bg-white border-[#e5e7eb]">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">⚡</span> 核心策略</p>
          <p className="text-xs text-[#6b7280] leading-relaxed">{stage.coreStrategy}</p>
        </div>
      </SubCard>

      {/* 📦 产品矩阵 */}
      <SubCard className="bg-white border-[#e5e7eb]">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">📦</span> 产品矩阵</p>
          <div className="grid grid-cols-2 gap-3">
            {stage.productMatrix.map((product, i) => (
              <div key={i} className="border border-[#e5e7eb] rounded p-3 space-y-1.5 bg-[#f8f9fa]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-[#1f2937]">
                    <span className="font-semibold text-[#002fa7]">{product.category}：</span>
                    <span className="text-[#111827]">{product.name}</span>
                  </p>
                  <span className="text-xs text-[#002fa7] font-semibold shrink-0">{product.priceRange}</span>
                </div>
                <p className="text-xs text-[#6b7280]">目标客户: {product.targetCustomer}</p>
                <p className="text-xs text-[#6b7280]">月目标: {product.monthlyTarget}</p>
                <p className="text-xs text-[#6b7280]">
                  月收入: <span className="text-[#10b981] font-semibold">{product.monthlyRevenue}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 📊 流量策略 · 仅 stage 1 */}
      {stage.trafficStrategy && (
        <SubCard className="bg-white border-[#e5e7eb]">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">📊</span> 流量策略</p>
            <p className="text-xs text-[#6b7280] leading-relaxed">{stage.trafficStrategy}</p>
          </div>
        </SubCard>
      )}

      {/* ⟲ 转化流程 · 仅 stage 1 */}
      {stage.conversionFlow && stage.conversionFlow.length > 0 && (
        <SubCard className="bg-white border-[#e5e7eb]">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1f2937]">⟲ 转化流程</p>
            <div className="space-y-2">
              {stage.conversionFlow.map((step, i) => (
                <p key={i} className="text-xs text-[#6b7280] leading-relaxed">{step}</p>
              ))}
            </div>
          </div>
        </SubCard>
      )}

      {/* 👥 团队建设 · 仅 stage 2 */}
      {stage.teamBuilding && (
        <SubCard className="bg-white border-[#e5e7eb]">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">👥</span> 团队建设</p>
            <p className="text-xs text-[#6b7280] leading-relaxed">{stage.teamBuilding}</p>
          </div>
        </SubCard>
      )}

      {/* ⚙ 体系化建设 · 仅 stage 2 */}
      {stage.systemBuilding && (
        <SubCard className="bg-white border-[#e5e7eb]">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1f2937]">⚙ 体系化建设</p>
            <p className="text-xs text-[#6b7280] leading-relaxed">{stage.systemBuilding}</p>
          </div>
        </SubCard>
      )}

      {/* 🏆 品牌化策略 · 仅 stage 3 */}
      {stage.brandStrategy && (
        <SubCard className="bg-white border-[#e5e7eb]">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">🏆</span> 品牌化策略</p>
            <p className="text-xs text-[#6b7280] leading-relaxed">{stage.brandStrategy}</p>
          </div>
        </SubCard>
      )}

      {/* 🧭 矩阵化布局 · 仅 stage 3 */}
      {stage.matrixLayout && (
        <SubCard className="bg-white border-[#e5e7eb]">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">🧭</span> 矩阵化布局</p>
            <p className="text-xs text-[#6b7280] leading-relaxed">{stage.matrixLayout}</p>
          </div>
        </SubCard>
      )}

      {/* 🎯 关键动作 */}
      <SubCard className="bg-white border-[#e5e7eb]">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">🎯</span> 关键动作</p>
          <ul className="space-y-1.5">
            {stage.keyActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#6b7280]">
                <span className="text-[#10b981] shrink-0" aria-hidden="true">✓</span>
                <span className="leading-relaxed">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </SubCard>

      {/* 风险提示 · 独立红边 box */}
      <div className="border border-[#781621]/20 bg-[#fdf2f4] rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-[#781621] flex items-center gap-1.5">
          <span aria-hidden="true">🛡️</span> 风险提示
        </p>
        <ul className="space-y-1">
          {stage.risks.map((risk, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-[#781621] shrink-0" aria-hidden="true">·</span>
              <span className="text-xs text-[#781621]/80 leading-relaxed">{risk}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
