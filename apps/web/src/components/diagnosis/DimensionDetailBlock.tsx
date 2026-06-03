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
      className="flex flex-col gap-3 border-l-2 border-[#002fa7] pl-4"
    >
      <h3 className="text-[18px] font-bold text-[#111827]">
        {detail.num}. {detail.label}
      </h3>
      <p className="text-[15px] text-[#444653]">
        <span className="font-bold text-[#111827]">{REPORT_LABEL_STATUS_PREFIX}</span>
        {detail.status}
      </p>
      <p className="text-[15px] text-[#444653]">
        <span className="font-bold text-[#781621]">{REPORT_LABEL_PROBLEM_PREFIX}</span>
        {detail.problem}
      </p>
      <div className="flex flex-col gap-2">
        <p className="font-bold text-[#002fa7]">{REPORT_LABEL_SOLUTION_PREFIX}</p>
        <ul className="flex flex-col gap-2 pl-2">
          {detail.solutions.map((sol, si) => (
            <li key={si} className="flex flex-col gap-1">
              <p className="text-[15px] text-[#444653]">
                {sol.heading && (
                  <span className="font-bold text-[#111827]">{sol.heading}</span>
                )}
                {sol.body}
              </p>
              {sol.sub && sol.sub.length > 0 && (
                <ul className="flex flex-col gap-1 pl-4">
                  {sol.sub.map((s, ssi) => (
                    <li key={ssi} className="text-[13px] text-[#6b7280]">
                      {s.heading && (
                        <span className="font-bold text-[#444653]">{s.heading}</span>
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
