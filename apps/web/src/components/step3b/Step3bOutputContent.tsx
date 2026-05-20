import type { Step3bOutputBlock } from '@/lib/constants/step3b';
import { cn } from '@/lib/utils';

// Step3bResult — 6 块结构对应 D-220 字面锁
export interface Step3bResult {
  personaPosition?: string;          // 人设定位
  personaTags?: string[];             // 人设标签
  contentDirection?: string[];        // 内容方向
  differentiationStrategy?: string;   // 差异化策略
  contentDirectionAdvice?: string[];  // 内容方向建议
  ipStoryFramework?: string;          // IP 故事框架
}

function StringList({ items }: { items?: string[] }) {
  if (!items?.length) return <p className="text-body-sm text-muted-foreground">—</p>;
  return (
    <ul className="space-y-1">
      {items.map((s, i) => (
        <li key={i} className="text-body-sm text-muted-foreground flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          {s}
        </li>
      ))}
    </ul>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-body-xs font-medium text-on-surface">{label}</p>
      <p className="text-body-sm text-muted-foreground leading-relaxed">{value ?? '—'}</p>
    </div>
  );
}

interface Props {
  blockId: Step3bOutputBlock['id'];
  result: Step3bResult;
  className?: string;
}

export default function Step3bOutputContent({ blockId, result, className }: Props) {
  return (
    <div className={cn('space-y-3', className)}>
      {blockId === 'personaPosition' && (
        <Field label="人设定位" value={result.personaPosition} />
      )}

      {blockId === 'personaTags' && (
        <div className="flex flex-wrap gap-2">
          {(result.personaTags ?? []).map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-body-sm"
            >
              {tag}
            </span>
          ))}
          {!result.personaTags?.length && (
            <p className="text-body-sm text-muted-foreground">—</p>
          )}
        </div>
      )}

      {blockId === 'contentDirection' && (
        <StringList items={result.contentDirection} />
      )}

      {blockId === 'differentiationStrategy' && (
        <Field label="差异化策略" value={result.differentiationStrategy} />
      )}

      {blockId === 'contentDirectionAdvice' && (
        <StringList items={result.contentDirectionAdvice} />
      )}

      {blockId === 'ipStoryFramework' && (
        <Field label="IP 故事框架" value={result.ipStoryFramework} />
      )}
    </div>
  );
}
