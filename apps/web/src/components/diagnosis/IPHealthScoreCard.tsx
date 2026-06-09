import { C, F } from '@/components/home-next/ikb/system';
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
      className="lg-glass lg-spec rounded-xl p-6 flex flex-col gap-5"
    >
      {/* KPI 大数值 */}
      <div className="flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="-rotate-90 h-24 w-24">
            <defs>
              <linearGradient id="dg-health-ring" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2B53E6" />
                <stop offset="52%" stopColor="#7A3BE0" />
                <stop offset="100%" stopColor="#EF3E6B" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="url(#dg-health-ring)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash.toFixed(1)} ${circumference.toFixed(1)}`}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-[26px] font-extrabold"
            style={{ color: C.ikb, textShadow: C.textShadow }}
          >
            {overallScore}
          </span>
        </div>
        <div>
          <p
            className="text-[13px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.60)', fontFamily: F.cn, textShadow: C.textShadow }}
          >
            {REPORT_LABEL_SCORE_TOTAL}
          </p>
          <p className="mt-1 text-[32px] font-extrabold leading-none" style={{ color: C.ink, textShadow: C.textShadow, fontFamily: F.display }}>
            {overallScore}
            <span className="ml-1 text-[16px] font-normal" style={{ color: 'rgba(255,255,255,0.50)' }}>/ 100</span>
          </p>
          <span
            className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold"
            style={{ background: 'rgba(216,232,255,0.14)', color: C.ikb, border: `1px solid ${C.line}`, textShadow: C.textShadow }}
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>
            IP健康度
          </span>
        </div>
      </div>
      {/* 维度条形列表 */}
      <div className="flex flex-col gap-3">
        {scores.map((dim) => (
          <div key={dim.id} className="flex items-center gap-3">
            <span
              className="text-[12px] font-semibold w-16 shrink-0"
              style={{ color: 'rgba(255,255,255,0.60)', fontFamily: F.cn }}
            >
              {dim.shortLabel}
            </span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${maxScore > 0 ? (dim.score / maxScore) * 100 : 0}%`,
                  background: 'linear-gradient(110deg, #2B53E6 0%, #7A3BE0 52%, #EF3E6B 100%)',
                }}
              />
            </div>
            <span
              className="text-[12px] font-bold w-6 text-right shrink-0"
              style={{ color: C.ink, textShadow: C.textShadow }}
            >
              {dim.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
