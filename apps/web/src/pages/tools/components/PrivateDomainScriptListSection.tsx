// PRD-29.13 · 私域成交流程 · 引流话术 3 sub-list
import { toast } from 'sonner';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface TrafficScripts {
  shortVideo: string[];
  commentInteraction: string[];
  dmGuidance: string[];
}

interface PrivateDomainScriptListSectionProps {
  scripts: TrafficScripts;
  className?: string;
}

const SUB_LISTS: Array<{ key: keyof TrafficScripts; label: string }> = [
  { key: 'shortVideo', label: '短视频引流话术' },
  { key: 'commentInteraction', label: '评论区互动话术' },
  { key: 'dmGuidance', label: '私信引导话术' },
];

function CopyButton({ text }: { text: string }) {
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => toast.success('已复制'));
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 text-muted-foreground hover:text-on-surface transition-colors text-base"
      aria-label="复制"
    >
      📋
    </button>
  );
}

export function PrivateDomainScriptListSection({
  scripts,
  className,
}: PrivateDomainScriptListSectionProps) {
  return (
    <SubCard className={cn('space-y-4', className)}>
      <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
        📢 引流话术
      </h3>
      <div className="space-y-6">
        {SUB_LISTS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <p className="text-sm font-semibold text-primary">{label}</p>
            <div className="space-y-2">
              {scripts[key].map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <p className="flex-1 text-sm text-on-surface/85 leading-relaxed">{line}</p>
                  <CopyButton text={line} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SubCard>
  );
}
