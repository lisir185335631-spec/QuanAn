// PRD-29.15 · Step7 生成结果展示 sub-card
import { toast } from 'sonner';

import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface Step7OutputResultSectionProps {
  content: string;
  onCopy?: () => void;
  className?: string;
}

export function Step7OutputResultSection({
  content,
  onCopy,
  className,
}: Step7OutputResultSectionProps) {
  function handleCopy() {
    if (onCopy) {
      onCopy();
      return;
    }
    navigator.clipboard.writeText(content).then(
      () => toast.success('已复制文案'),
      () => toast.error('复制失败，请手动选取'),
    );
  }

  return (
    <SubCard className={cn('space-y-4', className)}>
      {/* H3 row */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-on-surface">✨ 生成结果</h3>
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-on-surface transition-colors text-lg leading-none"
          aria-label="复制文案"
          title="复制文案"
        >
          📋
        </button>
      </div>

      {/* Content */}
      <div className="whitespace-pre-wrap text-sm text-on-surface/85 leading-loose font-cn">
        {content}
      </div>
    </SubCard>
  );
}
