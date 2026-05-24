import type { DimensionDetailData } from '@/lib/constants/diagnosis';
import {
  REPORT_LABEL_STATUS_PREFIX,
  REPORT_LABEL_PROBLEM_PREFIX,
  REPORT_LABEL_SOLUTION_PREFIX,
} from '@/lib/constants/diagnosis';

interface DimensionDetailBlockProps {
  detail: DimensionDetailData;
}

export function DimensionDetailBlock({ detail }: DimensionDetailBlockProps) {
  return (
    <div
      data-testid={`dimension-detail-block-${detail.num}`}
      className="flex flex-col gap-3"
    >
      <h3 className="text-lg font-bold text-on-surface">
        {detail.num}. {detail.label} (0分)
      </h3>
      <p className="text-base text-muted-foreground">
        <span className="font-bold text-on-surface">{REPORT_LABEL_STATUS_PREFIX}</span>
        {detail.status}
      </p>
      <p className="text-base text-muted-foreground">
        <span className="font-bold text-on-surface">{REPORT_LABEL_PROBLEM_PREFIX}</span>
        {detail.problem}
      </p>
      <div className="flex flex-col gap-2">
        <p className="font-bold text-on-surface">{REPORT_LABEL_SOLUTION_PREFIX}</p>
        <ul className="flex flex-col gap-2 pl-2">
          {detail.solutions.map((sol, si) => (
            <li key={si} className="flex flex-col gap-1">
              <p className="text-base text-muted-foreground">
                {sol.heading && (
                  <span className="font-bold text-on-surface">{sol.heading}</span>
                )}
                {sol.body}
              </p>
              {sol.sub && sol.sub.length > 0 && (
                <ul className="flex flex-col gap-1 pl-4">
                  {sol.sub.map((s, ssi) => (
                    <li key={ssi} className="text-sm text-muted-foreground">
                      {s.heading && (
                        <span className="font-bold text-on-surface">{s.heading}</span>
                      )}
                      {s.body}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
