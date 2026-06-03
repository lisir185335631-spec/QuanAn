import {
  REPORT_LABEL_SCORE_TOTAL,
} from '@/lib/constants/diagnosis';

interface DimensionScore {
  id: string;
  shortLabel: string;
  radarLabel: string;
  score: number;
}

interface IPHealthScoreCardProps {
  scores: ReadonlyArray<DimensionScore>;
  overallScore: number;
}

export function IPHealthScoreCard({ scores, overallScore }: IPHealthScoreCardProps) {
  const maxScore = 10;
  // 环形进度参数
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const fraction = Math.min(1, Math.max(0, overallScore / 100));
  const dash = fraction * circumference;

  return (
    <div
      data-testid="ip-health-score-card"
      className="rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col gap-5 pw-shadow-soft"
    >
      {/* KPI 大数值 */}
      <div className="flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="-rotate-90 h-24 w-24">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#eef2ff" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#002fa7"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash.toFixed(1)} ${circumference.toFixed(1)}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[26px] font-extrabold text-[#002fa7]">
            {overallScore}
          </span>
        </div>
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-widest text-[#9ca3af]">{REPORT_LABEL_SCORE_TOTAL}</p>
          <p className="mt-1 text-[32px] font-extrabold leading-none text-[#111827]">{overallScore}<span className="ml-1 text-[16px] font-normal text-[#9ca3af]">/ 100</span></p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#10b981]/10 px-2.5 py-0.5 text-[12px] font-bold text-[#10b981]">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">trending_up</span>
            IP健康度
          </span>
        </div>
      </div>
      {/* 维度条形列表 */}
      <div className="flex flex-col gap-3">
        {scores.map((dim) => (
          <div key={dim.id} className="flex items-center gap-3">
            <span className="text-[12px] font-semibold text-[#6b7280] w-16 shrink-0">{dim.shortLabel}</span>
            <div className="flex-1 h-1.5 rounded-full bg-[#eef2ff] overflow-hidden">
              <div
                className="h-full bg-[#002fa7] rounded-full transition-all"
                style={{ width: `${maxScore > 0 ? (dim.score / maxScore) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[12px] font-bold text-[#111827] w-6 text-right shrink-0">{dim.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
