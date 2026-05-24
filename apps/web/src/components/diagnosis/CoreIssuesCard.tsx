import { XCircle } from 'lucide-react';

import { REPORT_HEADING_CORE_ISSUES } from '@/lib/constants/diagnosis';

interface CoreIssuesCardProps {
  issues: ReadonlyArray<string>;
}

export function CoreIssuesCard({ issues }: CoreIssuesCardProps) {
  return (
    <div
      data-testid="core-issues-card"
      className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <XCircle className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-bold text-destructive">{REPORT_HEADING_CORE_ISSUES}</h3>
      </div>
      <ul className="flex flex-col gap-2">
        {issues.map((issue, i) => (
          <li key={i} className="flex items-start gap-2 text-base text-muted-foreground">
            <span className="mt-1 shrink-0">·</span>
            <span>{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
