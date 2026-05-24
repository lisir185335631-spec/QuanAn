// PRD-29.15 · Step7 AI 优化 sub-card
import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface Step7AiOptimizeSectionProps {
  value: string;
  onChange: (v: string) => void;
  onOptimize: () => void;
  className?: string;
}

export function Step7AiOptimizeSection({
  value,
  onChange,
  onOptimize,
  className,
}: Step7AiOptimizeSectionProps) {
  return (
    <SubCard variant="highlighted" className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="text-sm font-semibold text-on-surface">⟳ AI智能优化</h3>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="输入优化方向（可选），如：更有吸引力、增加互动感、更口语化..."
        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />

      {/* Button */}
      <div className="flex justify-center">
        <Button
          type="button"
          onClick={onOptimize}
          className="bg-primary hover:bg-primary/90"
        >
          ⟳ AI优化文案
        </Button>
      </div>
    </SubCard>
  );
}
