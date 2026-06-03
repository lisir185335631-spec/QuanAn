// PRD-29.13 · 私域成交流程 · 成交话术 4 sub-list · 橙边
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

interface SalesScripts {
  firstConsult: string[];
  objectionHandling: Array<{ objection: string; response: string }>;
  pushOrder: string[];
  afterSales: string[];
}

interface PrivateDomainSalesScriptSectionProps {
  scripts: SalesScripts;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => toast.success('已复制'));
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

interface ScriptListProps {
  label: string;
  items: string[];
}

function ScriptList({ label, items }: ScriptListProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-primary">{label}</p>
      <div className="space-y-2">
        {items.map((line, i) => (
          <div key={i} className="flex items-start gap-2">
            <p className="flex-1 text-sm text-on-surface/85 leading-relaxed">{line}</p>
            <CopyButton text={line} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrivateDomainSalesScriptSection({
  scripts,
  className,
}: PrivateDomainSalesScriptSectionProps) {
  return (
    <div
      className={cn(
        'border border-primary/30 bg-primary/5 rounded-lg p-5 space-y-6',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-primary flex items-center gap-2">
        🎁 成交话术
      </h3>

      {/* 首次咨询话术 */}
      <ScriptList label="首次咨询话术" items={scripts.firstConsult} />

      {/* 异议处理话术 · 红 chip */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-primary">异议处理话术</p>
        <div className="space-y-3">
          {scripts.objectionHandling.map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="inline-flex items-center rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400 font-semibold shrink-0">
                  {item.objection}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <p className="flex-1 text-sm text-on-surface/85 leading-relaxed">{item.response}</p>
                <CopyButton text={`${item.objection}\n${item.response}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 逼单话术 */}
      <ScriptList label="逼单话术" items={scripts.pushOrder} />

      {/* 售后跟进话术 */}
      <ScriptList label="售后跟进话术" items={scripts.afterSales} />
    </div>
  );
}
