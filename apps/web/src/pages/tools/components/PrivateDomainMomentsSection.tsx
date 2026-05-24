// PRD-29.13 · 私域成交流程 · 朋友圈文案 4 sub-list · 绿边
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MomentsScripts {
  grass: string[];
  trust: string[];
  closing: string[];
  fission: string[];
}

interface PrivateDomainMomentsSectionProps {
  scripts: MomentsScripts;
  className?: string;
}

const SUB_LISTS: Array<{ key: keyof MomentsScripts; label: string }> = [
  { key: 'grass', label: '种草文案' },
  { key: 'trust', label: '信任文案' },
  { key: 'closing', label: '成交文案' },
  { key: 'fission', label: '裂变文案' },
];

function CopyButton({ text }: { text: string }) {
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => toast.success('已复制'));
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 text-emerald-400/70 hover:text-emerald-400 transition-colors text-base"
      aria-label="复制"
    >
      📋
    </button>
  );
}

export function PrivateDomainMomentsSection({
  scripts,
  className,
}: PrivateDomainMomentsSectionProps) {
  return (
    <div
      className={cn(
        'border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-5 space-y-4',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-emerald-400 flex items-center gap-2">
        👥 朋友圈文案
      </h3>
      <div className="space-y-6">
        {SUB_LISTS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <p className="text-sm font-semibold text-emerald-400">{label}</p>
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
    </div>
  );
}
