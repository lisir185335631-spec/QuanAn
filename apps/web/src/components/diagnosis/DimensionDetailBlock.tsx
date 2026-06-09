import { C, F } from '@/components/home-next/ikb/system';
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
      className="flex flex-col gap-3 pl-4"
      style={{ borderLeft: `2px solid ${C.ikb}` }}
    >
      <h3
        className="text-[18px] font-bold"
        style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
      >
        {detail.num}. {detail.label}
      </h3>
      <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
        <span className="font-bold" style={{ color: C.ink }}>{REPORT_LABEL_STATUS_PREFIX}</span>
        {detail.status}
      </p>
      <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
        <span className="font-bold" style={{ color: '#EF3E6B' }}>{REPORT_LABEL_PROBLEM_PREFIX}</span>
        {detail.problem}
      </p>
      <div className="flex flex-col gap-2">
        <p className="font-bold" style={{ color: C.ikb, textShadow: C.textShadow, fontFamily: F.cn }}>{REPORT_LABEL_SOLUTION_PREFIX}</p>
        <ul className="flex flex-col gap-2 pl-2">
          {detail.solutions.map((sol, si) => (
            <li key={si} className="flex flex-col gap-1">
              <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
                {sol.heading && (
                  <span className="font-bold" style={{ color: C.ink }}>{sol.heading}</span>
                )}
                {sol.body}
              </p>
              {sol.sub && sol.sub.length > 0 && (
                <ul className="flex flex-col gap-1 pl-4">
                  {sol.sub.map((s, ssi) => (
                    <li key={ssi} className="text-[13px]" style={{ color: 'rgba(255,255,255,0.60)', fontFamily: F.cn, textShadow: C.textShadow }}>
                      {s.heading && (
                        <span className="font-bold" style={{ color: 'rgba(255,255,255,0.84)' }}>{s.heading}</span>
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
