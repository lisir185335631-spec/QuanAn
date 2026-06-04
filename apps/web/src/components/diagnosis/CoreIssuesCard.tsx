import { REPORT_HEADING_CORE_ISSUES } from '@/lib/constants/diagnosis';

interface CoreIssuesCardProps {
  issues: ReadonlyArray<string>;
}

export function CoreIssuesCard({ issues }: CoreIssuesCardProps) {
  return (
    <div
      data-testid="core-issues-card"
      className="rounded-xl p-6 flex flex-col gap-4 pw-shadow-soft"
      style={{
        border: '1px solid rgba(239,62,107,0.20)',
        background: 'rgba(239,62,107,0.05)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: '#EF3E6B' }}>error</span>
        <h3 className="text-[18px] font-bold" style={{ color: '#EF3E6B' }}>{REPORT_HEADING_CORE_ISSUES}</h3>
      </div>
      <ul className="flex flex-col gap-2">
        {issues.map((issue, i) => (
          <li key={i} className="flex items-start gap-2 text-[15px] text-[#444653]">
            <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full" style={{ background: '#EF3E6B' }} />
            <span>{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
