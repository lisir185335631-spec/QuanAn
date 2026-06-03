/**
 * /ip-plan · 我的IP方案/进度总览 — 先锋白·工业精密版
 *
 * 逻辑零改动：IP_PLAN_STEPS / completed / remaining / firstUncompleted / navigate
 * testid 全保留：ip-plan-page + header/subtitle/progress/step-list/footer 各子 testid
 * 4 个 ip-plan 组件 inline 重写（不 import 旧组件）
 */
import { useNavigate } from 'react-router-dom';

import { PioneerLayout } from '@/layouts/PioneerLayout';
import {
  IP_PLAN_FOOTER_TPL,
  IP_PLAN_GO_COMPLETE,
  IP_PLAN_H1,
  IP_PLAN_NEXT_BTN,
  IP_PLAN_PROGRESS_LABEL,
  IP_PLAN_STATUS_DONE,
  IP_PLAN_STATUS_TODO,
  IP_PLAN_STEPS,
  IP_PLAN_SUBTITLE_TPL,
  IP_PLAN_VIEW_DETAIL,
  type IpPlanStep,
} from '@/lib/constants/ipPlan';

// ── KPI 卡色轮(蓝→勃艮第→黄→蓝) ──────────────────────────────────────────────
const KPI_ACCENTS = [
  {
    border: 'border-[#e0e7ff]',
    bg: 'bg-gradient-to-br from-white to-[#f3f6ff]',
    iconBg: 'bg-[#002fa7]/10',
    iconText: 'text-[#002fa7]',
    valColor: 'text-[#002fa7]',
    badge: 'bg-[#002fa7]/10 text-[#002fa7]',
    ringTrack: '#eef2ff',
    ringFill: '#002fa7',
    icon: 'map',
  },
  {
    border: 'border-[#e5e7eb]',
    bg: 'bg-white',
    iconBg: 'bg-[#781621]/10',
    iconText: 'text-[#781621]',
    valColor: 'text-[#781621]',
    badge: 'bg-[#781621]/10 text-[#781621]',
    ringTrack: '#fef2f2',
    ringFill: '#781621',
    icon: 'check_circle',
  },
  {
    border: 'border-[#e5e7eb]',
    bg: 'bg-white',
    iconBg: 'bg-[#F6D300]/20',
    iconText: 'text-[#8A6A00]',
    valColor: 'text-[#111827]',
    badge: 'bg-[#FEFCE0] text-[#8A6A00]',
    ringTrack: '#fdf6cc',
    ringFill: '#F6D300',
    icon: 'pending_actions',
  },
  {
    border: 'border-[#e0e7ff]',
    bg: 'bg-gradient-to-br from-white to-[#f3f6ff]',
    iconBg: 'bg-[#002fa7]/10',
    iconText: 'text-[#002fa7]',
    valColor: 'text-[#111827]',
    badge: 'bg-[#002fa7]/10 text-[#002fa7]',
    ringTrack: '#eef2ff',
    ringFill: '#002fa7',
    icon: 'format_list_numbered',
  },
] as const;

// ── IP 成熟度雷达六维 ─────────────────────────────────────────────────────────
const IP_RADAR_DIMS = [
  { label: '定位', value: 82, color: '#002fa7' },
  { label: '包装', value: 75, color: '#781621' },
  { label: '人设', value: 88, color: '#F6D300' },
  { label: '执行', value: 70, color: '#002fa7' },
  { label: '变现', value: 64, color: '#781621' },
  { label: '内容', value: 78, color: '#F6D300' },
];

// ── inline IpPlanHeader ───────────────────────────────────────────────────────
function IpPlanHeader({ completed, total }: { completed: number; total: number }) {
  return (
    <header className="mb-12 flex flex-row items-center justify-between gap-8" data-testid="ip-plan-header">
      <div className="shrink-0">
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
            更多
          </span>
          <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
            IP 方案
          </span>
        </div>
        <h1
          className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]"
          data-testid="ip-plan-h1"
        >
          {IP_PLAN_H1}
        </h1>
        <p
          className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]"
          data-testid="ip-plan-subtitle"
        >
          {IP_PLAN_SUBTITLE_TPL(completed, total)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium shadow-sm">
        <span className="block h-2.5 w-2.5 animate-pulse rounded-full bg-[#10b981]" />
        进度追踪中
      </div>
    </header>
  );
}

// ── inline IpPlanProgressCard ─────────────────────────────────────────────────
function IpPlanProgressCard({ percent, completed, total }: { percent: number; completed: number; total: number }) {
  const dashArray = `${percent} 100`;
  return (
    <section
      className="pw-shadow-soft mb-8 rounded-xl border border-[#e5e7eb] bg-white p-8"
      data-testid="ip-plan-progress-card"
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[18px] font-extrabold text-[#111827] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
          <span data-testid="ip-plan-progress-label">{IP_PLAN_PROGRESS_LABEL}</span>
        </h3>
        <div className="flex items-end gap-2">
          <span
            className="text-[30px] font-bold leading-none text-[#002fa7]"
            data-testid="ip-plan-progress-percent"
          >
            {percent}%
          </span>
          <span className="mb-1 ml-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">trending_up</span>
            {completed}/{total} 已完成
          </span>
        </div>
      </div>
      {/* 品牌色进度条 */}
      <div
        className="mb-4 h-4 w-full overflow-hidden rounded-full bg-[#f3f4f6]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`IP 打造进度 ${percent}%`}
      >
        <div
          className="h-4 rounded-full bg-gradient-to-r from-[#002fa7] to-[#781621] transition-all duration-700"
          style={{ width: `${percent}%` }}
          data-testid="ip-plan-progress-bar-fill"
        />
      </div>
      {/* 大环形进度 + 数字 */}
      <div className="mt-6 flex items-center justify-center gap-12">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <svg viewBox="0 0 36 36" className="-rotate-90 h-32 w-32" aria-hidden="true">
            <defs>
              <linearGradient id="ipProgressGrad" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#002fa7" />
                <stop offset="100%" stopColor="#781621" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="url(#ipProgressGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={dashArray}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[28px] font-bold leading-none text-[#002fa7]">{percent}<span className="text-[14px] text-[#9ca3af]">%</span></span>
            <span className="mt-1 text-[10px] text-[#9ca3af]">完成度</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#9ca3af]">已完成</p>
            <p className="text-[22px] font-bold text-[#10b981]">{completed}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#9ca3af]">总步数</p>
            <p className="text-[22px] font-bold text-[#111827]">{total}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── inline step row (为 IpPlanStepList 内联使用) ──────────────────────────────
function StepRow({ step, index }: { step: IpPlanStep; index: number }) {
  // 序号色轮：蓝→勃艮第→蓝…
  const numColor = step.done ? '#10b981' : index % 2 === 0 ? '#002fa7' : '#781621';
  const numBg = step.done ? '#d1fae5' : index % 2 === 0 ? '#eef2ff' : '#fef2f2';

  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${step.done ? 'border-[#d1fae5] bg-gradient-to-r from-white to-[#f0fdf4]' : 'border-[#e5e7eb] bg-white'}`}
      data-testid={`ip-plan-step-card-${step.id}`}
    >
      <div className="flex items-center justify-between">
        {/* 左侧：序号 + 名称 + 状态 */}
        <div className="flex items-center gap-4">
          {/* 序号圆圈 */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold"
            style={{ backgroundColor: numBg, color: numColor }}
            data-testid={`ip-plan-step-icon-circle-${index}`}
          >
            {String(index + 1).padStart(2, '0')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`text-[15px] font-bold ${step.done ? 'text-[#111827]' : 'text-[#444653]'}`}
                data-testid={`ip-plan-step-title-${step.id}`}
              >
                {step.title}
              </h3>
              {step.done ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-[#d1fae5] px-2 py-0.5 text-[11px] font-semibold text-[#065f46]"
                  data-testid={`ip-plan-step-status-${step.id}`}
                >
                  <span className="material-symbols-outlined text-[12px]" aria-hidden="true">check_circle</span>
                  {IP_PLAN_STATUS_DONE}
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-semibold text-[#6b7280]"
                  data-testid={`ip-plan-step-status-${step.id}`}
                >
                  <span className="material-symbols-outlined text-[12px]" aria-hidden="true">radio_button_unchecked</span>
                  {IP_PLAN_STATUS_TODO}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：完成标记 + 跳转链接 */}
        <div className="flex shrink-0 items-center gap-3">
          {step.done ? (
            <span
              className="material-symbols-outlined text-[22px] text-[#10b981]"
              aria-label={`${step.title} 已完成`}
              data-testid={`ip-plan-step-check-${step.id}`}
            >
              check_circle
            </span>
          ) : (
            <span
              className="material-symbols-outlined text-[22px] text-[#d1d5db]"
              aria-label={`${step.title} 未完成`}
              data-testid={`ip-plan-step-circle-${step.id}`}
            >
              radio_button_unchecked
            </span>
          )}
          <a
            href={step.href}
            className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5 ${step.done ? 'border-[#002fa7]/20 bg-[#002fa7]/5 text-[#002fa7] hover:bg-[#002fa7]/10' : 'border-[#e5e7eb] bg-white text-[#781621] hover:border-[#781621]/30 hover:bg-[#781621]/5'}`}
            data-testid={`ip-plan-step-action-${step.id}`}
          >
            {step.done ? IP_PLAN_VIEW_DETAIL : IP_PLAN_GO_COMPLETE}
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
          </a>
        </div>
      </div>

      {/* 完成态 extra 行 */}
      {step.done && step.extra && (
        <div
          className="mt-3 border-t border-[#d1fae5] pt-3"
          data-testid={`ip-plan-step-extra-${step.id}`}
        >
          <p className="text-[12px] text-[#6b7280]">{step.extra}</p>
        </div>
      )}
    </div>
  );
}

// ── inline IpPlanStepList ─────────────────────────────────────────────────────
function IpPlanStepList({ steps }: { steps: ReadonlyArray<IpPlanStep> }) {
  return (
    <section data-testid="ip-plan-step-list">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">checklist</span>
        <h2 className="text-[16px] font-bold text-[#111827]">步骤清单</h2>
        <span className="text-[12px] text-[#9ca3af]">· 点击跳转对应步骤</span>
      </div>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <StepRow key={step.id} step={step} index={index} />
        ))}
      </div>
    </section>
  );
}

// ── inline IpPlanFooter ───────────────────────────────────────────────────────
function IpPlanFooter({ remaining, onNext }: { remaining: number; onNext: () => void }) {
  return (
    <section
      className="mt-8 overflow-hidden rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-8 pw-shadow-soft"
      data-testid="ip-plan-footer"
    >
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">rocket_launch</span>
          </span>
          <div>
            <p className="text-[16px] font-bold text-[#111827]">继续打造你的 IP</p>
            <p
              className="mt-0.5 text-[14px] text-[#6b7280]"
              data-testid="ip-plan-footer-text"
            >
              {IP_PLAN_FOOTER_TPL(remaining)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNext}
          aria-label="继续下一步"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[13px] font-bold uppercase tracking-widest text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:bg-[#001e73] hover:shadow-md active:translate-y-0"
          data-testid="ip-plan-next-btn"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          {IP_PLAN_NEXT_BTN}
        </button>
      </div>
    </section>
  );
}

// ── IP 成熟度雷达 ─────────────────────────────────────────────────────────────
function IpMaturityRadar() {
  const dims = IP_RADAR_DIMS;
  const cx = 130;
  const cy = 122;
  const R = 88;
  const avg = Math.round(dims.reduce((s, d) => s + d.value, 0) / dims.length);
  const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
  const pt = (i: number, r: number): [number, number] => [
    cx + r * Math.cos(ang(i)),
    cy + r * Math.sin(ang(i)),
  ];
  const poly = (r: number) =>
    dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
  const dataPoly = dims
    .map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(','))
    .join(' ');

  return (
    <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">radar</span>
          </span>
          <div>
            <h3 className="text-[14px] font-bold text-[#111827]">IP 成熟度雷达</h3>
            <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[26px] font-bold leading-none text-[#002fa7]">{avg}</p>
          <p className="text-[10px] text-[#9ca3af]">综合分</p>
        </div>
      </div>
      <svg viewBox="0 0 260 244" className="w-full" aria-hidden="true">
        <defs>
          <linearGradient id="radarFillIP" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
        ))}
        {dims.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
        })}
        <polygon
          points={dataPoly}
          fill="url(#radarFillIP)"
          stroke="#002fa7"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {dims.map((d, i) => {
          const [x, y] = pt(i, R * (d.value / 100));
          return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
        })}
        {dims.map((d, i) => {
          const [x, y] = pt(i, R + 16);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
              {d.label}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-y-2">
        {dims.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-[#6b7280]">{d.label}</span>
            <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── IP 进度趋势 ──────────────────────────────────────────────────────────────
function IpProgressTrend({ completed, total }: { completed: number; total: number }) {
  const trend = [10, 20, 20, 30, 44, 44, 56, 56, 44];
  const W = 560;
  const H = 168;
  const padL = 6;
  const padR = 6;
  const padT = 12;
  const padB = 8;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = 110;
  const x = (i: number) => padL + (innerW * i) / (trend.length - 1);
  const y = (v: number) => padT + innerH * (1 - v / max);
  const line = trend.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(trend.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  return (
    <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">show_chart</span>
          </span>
          <div>
            <h3 className="text-[14px] font-bold text-[#111827]">IP 完成进度趋势</h3>
            <p className="text-[11px] text-[#9ca3af]">按步骤完成节点测算</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {['进度', '步数', '剩余'].map((t, i) => (
            <span
              key={t}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-[#002fa7] text-white' : 'bg-[#f1f3f9] text-[#6b7280]'}`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mb-3 flex items-end gap-3">
        <p className="text-[30px] font-bold leading-none text-[#111827]">{completed}/{total}</p>
        <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">trending_up</span>
          步骤完成
        </span>
        <span className="mb-1 text-[12px] text-[#9ca3af]">持续推进中</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        <defs>
          <linearGradient id="trendFillIP" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trendLineIP" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#002fa7" />
            <stop offset="100%" stopColor="#781621" />
          </linearGradient>
        </defs>
        {[0, 0.33, 0.66, 1].map((f) => (
          <line
            key={f}
            x1={padL}
            x2={W - padR}
            y1={(padT + innerH * f).toFixed(1)}
            y2={(padT + innerH * f).toFixed(1)}
            stroke="#f1f3f9"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="url(#trendFillIP)" />
        <path d={line} fill="none" stroke="url(#trendLineIP)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {trend.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
        {Array.from({ length: 9 }, (_, i) => `步${i + 1}`).map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

// ── 主页组件 ──────────────────────────────────────────────────────────────────
export default function IpPlan() {
  const navigate = useNavigate();
  const completed = IP_PLAN_STEPS.filter((s) => s.done).length;
  const total = IP_PLAN_STEPS.length;
  const remaining = total - completed;
  const firstUncompleted = IP_PLAN_STEPS.find((s) => !s.done);
  const percent = Math.round((completed / total) * 100);

  // KPI 四项数据
  const kpiItems = [
    { label: '总进度', value: `${percent}%`, badge: '实时', accentIdx: 0 },
    { label: '已完成', value: String(completed), badge: '步骤', accentIdx: 1 },
    { label: '剩余', value: String(remaining), badge: '待办', accentIdx: 2 },
    { label: '总步骤', value: String(total), badge: '全部', accentIdx: 3 },
  ];

  return (
    <PioneerLayout>
      <main
        className="mx-auto max-w-6xl space-y-8"
        data-testid="ip-plan-page"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <IpPlanHeader completed={completed} total={total} />

        {/* ── KPI 概览一排 ───────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-6">
          {kpiItems.map((kpi) => {
            const accent = KPI_ACCENTS[kpi.accentIdx]!;
            const ringPercent = kpi.accentIdx === 0
              ? percent
              : kpi.accentIdx === 1
              ? Math.round((completed / total) * 100)
              : kpi.accentIdx === 2
              ? Math.round((remaining / total) * 100)
              : 100;

            return (
              <div
                key={kpi.label}
                className={`rounded-xl border p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${accent.border} ${accent.bg}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconText}`}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{accent.icon}</span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${accent.badge}`}>{kpi.badge}</span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className={`text-[28px] font-bold leading-none ${accent.valColor}`}>{kpi.value}</p>
                    <p className="mt-1.5 text-[12px] text-[#6b7280]">{kpi.label}</p>
                  </div>
                  {kpi.accentIdx === 0 && (
                    <div
                      className="h-12 w-12 shrink-0"
                      role="progressbar"
                      aria-valuenow={ringPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${kpi.label} ${kpi.value}`}
                    >
                      <svg viewBox="0 0 36 36" className="-rotate-90" aria-hidden="true">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke={accent.ringTrack} strokeWidth="3.5" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={accent.ringFill}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={`${ringPercent} 100`}
                        />
                      </svg>
                    </div>
                  )}
                  {kpi.accentIdx === 3 && (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: accent.ringTrack }} aria-hidden="true">
                      <span className="material-symbols-outlined text-[22px]" style={{ color: accent.ringFill }}>format_list_numbered</span>
                    </div>
                  )}
                  {kpi.accentIdx === 1 && (
                    <div className="flex h-6 items-end gap-1">
                      {[44, 56, 78, 100].map((h, i) => (
                        <div key={i} className="w-3 rounded-t bg-[#10b981]/70" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  )}
                  {kpi.accentIdx === 2 && (
                    <div className="mt-3 h-2 w-16 rounded-full bg-[#fdf6cc]">
                      <div className="h-2 rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" style={{ width: `${ringPercent}%` }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 进度卡 ─────────────────────────────────────────── */}
        <IpPlanProgressCard percent={percent} completed={completed} total={total} />

        {/* ── 数据洞察 band ───────────────────────────────────── */}
        <div className="mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">insights</span>
          <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
          <span className="text-[12px] text-[#9ca3af]">· IP 成熟度综合评估</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
            模型已就绪
          </span>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <IpMaturityRadar />
          <IpProgressTrend completed={completed} total={total} />
        </div>

        {/* ── 步骤清单 ────────────────────────────────────────── */}
        <IpPlanStepList steps={IP_PLAN_STEPS} />

        {/* ── 底部 CTA ────────────────────────────────────────── */}
        {remaining > 0 && firstUncompleted && (
          <IpPlanFooter
            remaining={remaining}
            onNext={() => { void navigate(firstUncompleted.href); }}
          />
        )}
      </main>
    </PioneerLayout>
  );
}
