// PRD-29.10 · Step4b 市场分析 sub-component
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface Step4bMarketAnalysisSectionProps {
  analysis?: {
    industryAnalysis: string;
    marketScale: string;
    competition: string;
    monetizationPotential: string;
  };
  className?: string;
}

export function Step4bMarketAnalysisSection({ analysis, className }: Step4bMarketAnalysisSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
        🎯 市场分析
      </h3>

      <SubCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左列 上 · 行业分析 */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-primary/85">行业分析</p>
            <p className="text-sm text-on-surface/90 leading-relaxed">{analysis?.industryAnalysis ?? ''}</p>
          </div>

          {/* 右列 上 · 市场规模 */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-primary/85">市场规模</p>
            <p className="text-sm text-on-surface/90 leading-relaxed">{analysis?.marketScale ?? ''}</p>
          </div>

          {/* 左列 下 · 竞争程度 */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-primary/85">竞争程度</p>
            <p className="text-sm text-on-surface/90 leading-relaxed">{analysis?.competition ?? ''}</p>
          </div>

          {/* 右列 下 · 变现潜力 */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-primary/85">变现潜力</p>
            <p className="text-sm text-on-surface/90 leading-relaxed">{analysis?.monetizationPotential ?? ''}</p>
          </div>
        </div>
      </SubCard>
    </div>
  );
}
