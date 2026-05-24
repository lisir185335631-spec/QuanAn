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
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-primary/30 bg-primary/10 text-2xl shrink-0">
          {stageEmoji(stage.icon)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-primary text-lg font-bold">{stage.range}</span>
            <h3 className="text-lg font-semibold text-on-surface">{stage.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground">↗ {stage.duration}</p>
        </div>
      </div>

      {/* ⚡ 核心策略 */}
      <SubCard>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface/80">⚡ 核心策略</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{stage.coreStrategy}</p>
        </div>
      </SubCard>

      {/* 📦 产品矩阵 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">📦 产品矩阵</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stage.productMatrix.map((product, i) => (
              <div key={i} className="border border-primary/15 rounded p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-on-surface/80">
                    <span className="font-semibold text-primary/85">{product.category}：</span>
                    <span className="text-on-surface">{product.name}</span>
                  </p>
                  <span className="text-xs text-primary font-semibold shrink-0">{product.priceRange}</span>
                </div>
                <p className="text-xs text-muted-foreground">目标客户: {product.targetCustomer}</p>
                <p className="text-xs text-muted-foreground">月目标: {product.monthlyTarget}</p>
                <p className="text-xs text-muted-foreground">
                  月收入: <span className="text-emerald-400">{product.monthlyRevenue}</span>
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
            <p className="text-xs font-semibold text-on-surface/80">📊 流量策略</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{stage.trafficStrategy}</p>
          </div>
        </SubCard>
      )}

      {/* ⟲ 转化流程 · 仅 stage 1 */}
      {stage.conversionFlow && stage.conversionFlow.length > 0 && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface/80">⟲ 转化流程</p>
            <div className="space-y-2">
              {stage.conversionFlow.map((step, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">{step}</p>
              ))}
            </div>
          </div>
        </SubCard>
      )}

      {/* 👥 团队建设 · 仅 stage 2 */}
      {stage.teamBuilding && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface/80">👥 团队建设</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{stage.teamBuilding}</p>
          </div>
        </SubCard>
      )}

      {/* ⚙ 体系化建设 · 仅 stage 2 */}
      {stage.systemBuilding && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface/80">⚙ 体系化建设</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{stage.systemBuilding}</p>
          </div>
        </SubCard>
      )}

      {/* 🏆 品牌化策略 · 仅 stage 3 */}
      {stage.brandStrategy && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface/80">🏆 品牌化策略</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{stage.brandStrategy}</p>
          </div>
        </SubCard>
      )}

      {/* 🧭 矩阵化布局 · 仅 stage 3 */}
      {stage.matrixLayout && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface/80">🧭 矩阵化布局</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{stage.matrixLayout}</p>
          </div>
        </SubCard>
      )}

      {/* 🎯 关键动作 */}
      <SubCard>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface/80">🎯 关键动作</p>
          <ul className="space-y-1.5">
            {stage.keyActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-emerald-500 shrink-0">✓</span>
                <span className="leading-relaxed">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </SubCard>

      {/* ⚠️ 风险提示 · 独立红边 box */}
      <div className="border border-rose-500/30 bg-rose-500/5 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
          🛡️ 风险提示
        </p>
        <ul className="space-y-1">
          {stage.risks.map((risk, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-rose-400/70 shrink-0">·</span>
              <span className="text-xs text-rose-300 leading-relaxed">{risk}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
