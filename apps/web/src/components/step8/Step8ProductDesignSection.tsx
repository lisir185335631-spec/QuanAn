// PRD-29.12 · Step8 产品成交设计
import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface ProductDesign {
  mainProduct: string;
  priceAnchor: string;
  bonus: string;
  scarcity: string;
}

interface Step8ProductDesignSectionProps {
  design?: ProductDesign;
  onCopy?: () => void;
  className?: string;
}

export function Step8ProductDesignSection({ design, onCopy, className }: Step8ProductDesignSectionProps) {
  if (!design) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
          $ 产品与成交设计
        </h3>
        <span className="inline-flex items-center rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold">
          转化核心
        </span>
      </div>

      {/* row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface/80">主推产品/服务</p>
            <p className="text-sm font-semibold text-on-surface">{design.mainProduct}</p>
          </div>
        </SubCard>
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface/80">价格锚点设计</p>
            <p className="text-sm text-on-surface">{design.priceAnchor}</p>
          </div>
        </SubCard>
      </div>

      {/* row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface/80">🎁 赠品/福利设计</p>
            <p className="text-sm text-on-surface">{design.bonus}</p>
          </div>
        </SubCard>
        <div className="border border-rose-500/30 bg-rose-500/5 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-rose-400">⚠️ 限时限量策略</p>
          <p className="text-sm text-rose-300">{design.scarcity}</p>
        </div>
      </div>

      {/* copy button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onCopy}>
          📋 复制此方案
        </Button>
      </div>
    </div>
  );
}
