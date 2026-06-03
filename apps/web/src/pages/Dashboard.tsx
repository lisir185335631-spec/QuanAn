/**
 * /dashboard · 系统控制台 — 先锋白·工业精密版(Stitch 设计基准 · 1:1 还原)
 *
 * 部署进度斜条纹 + 3 实色 metric 卡(蓝/黄/红)+ 活动节点流数据表。
 * 统一走 PioneerLayout 外壳。CTA「控制台」入口指向此路由。
 */
import { PioneerLayout } from '@/layouts/PioneerLayout';

type Tone = 'green' | 'yellow' | 'red';

const STATUS_TONE: Record<Tone, string> = {
  green: 'bg-[#d1fae5] text-[#065f46] border-[#6ee7b7]',
  yellow: 'bg-[#FEFCE0] text-[#8A6A00] border-[#F3E08A]',
  red: 'bg-[#fef2f2] text-[#781621] border-[#fca5a5]',
};
const DOT_TONE: Record<Tone, string> = {
  green: 'bg-[#10b981]',
  yellow: 'bg-[#F6D300]',
  red: 'bg-[#781621]',
};

// icon chip 三色轮转
const ICON_CHIP_COLORS = [
  { bg: 'bg-[#002fa7]/10', text: 'text-[#002fa7]' },
  { bg: 'bg-[#781621]/10', text: 'text-[#781621]' },
  { bg: 'bg-[#F6D300]/20', text: 'text-[#8A6A00]' },
];

const TABLE_ROWS: {
  id: string;
  src: string;
  status: string;
  tone: Tone;
  latency: string;
  icon: string;
  chipIdx: number;
}[] = [
  { id: 'NX-001', src: '上海三角洲', status: '极佳', tone: 'green', latency: '12ms', icon: 'wifi_tethering', chipIdx: 0 },
  { id: 'NX-042', src: '北京枢纽', status: '降级', tone: 'yellow', latency: '145ms', icon: 'warning_amber', chipIdx: 1 },
  { id: 'NX-108', src: '深圳核心', status: '危险', tone: 'red', latency: '890ms', icon: 'error_outline', chipIdx: 2 },
];

// ── 系统健康度雷达维度 ─────────────────────────────────────────────────────
const DB_RADAR_DIMS = [
  { label: '算力', value: 86, color: '#002fa7' },
  { label: '稳定性', value: 91, color: '#781621' },
  { label: '响应速度', value: 78, color: '#F6D300' },
  { label: '任务吞吐', value: 83, color: '#002fa7' },
  { label: '在线率', value: 95, color: '#781621' },
  { label: '资源余量', value: 72, color: '#F6D300' },
];

// ── 7 日吞吐趋势数据 ────────────────────────────────────────────────────────
const DB_TREND_DATA = [38, 55, 47, 68, 74, 81, 92];
const DB_TREND_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// ── 部署阶段节点 ────────────────────────────────────────────────────────────
const DEPLOY_PHASES = [
  { label: '初始化', pct: 16.67, color: '#002fa7', done: true },
  { label: '编译', pct: 16.67, color: '#002fa7', done: true },
  { label: '集成', pct: 16.67, color: '#002fa7', done: true },
  { label: '测试', pct: 16.66, color: '#002fa7', done: true },
  { label: '活跃阶段', pct: 11.33, color: '#781621', done: false },
  { label: '完成', pct: 22.0, color: '#e5e7eb', done: false },
];

export default function Dashboard() {
  return (
    <PioneerLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-4 flex flex-row items-center justify-between gap-8">
          <div className="shrink-0">
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
                系统
              </span>
              <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
                运行中
              </span>
            </div>
            <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
              系统控制台
            </h1>
            <p className="mt-2 whitespace-nowrap text-[16px] text-[#444653]">核心数据与运行状态概览</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium shadow-sm">
            <span className="block h-2.5 w-2.5 animate-pulse rounded-full bg-[#10b981]" />
            系统在线
          </div>
        </header>

        {/* ── 数据概览 KPI 卡一排 ───────────────────────────────── */}
        <div className="grid grid-cols-4 gap-6">
          {/* 市场洞察 · 环形进度 · 蓝 */}
          <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]">insights</span>
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
                <span className="material-symbols-outlined text-[13px]">trending_up</span>+12.4%
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[28px] font-bold leading-none text-[#111827]">
                  8.4M<span className="text-[15px] text-[#9ca3af]"> TB</span>
                </p>
                <p className="mt-1.5 text-[12px] text-[#6b7280]">市场洞察</p>
              </div>
              <div className="h-12 w-12 shrink-0">
                <svg viewBox="0 0 36 36" className="-rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#002fa7"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="78 100"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 收益模型 · 迷你柱 · 勃艮第红 */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]">monetization_on</span>
              </span>
              <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">Q3预期</span>
            </div>
            <div className="mt-4">
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                ¥2.1B<span className="text-[15px] text-[#9ca3af]"> CNY</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">收益模型</p>
            </div>
            <div className="mt-3 flex h-6 items-end gap-1">
              {[58, 84, 70, 96, 78].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-[#781621]/70" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* 内容生成 · 进度条 · 黄 */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8A6A00]">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
              </span>
              <span className="rounded-full bg-[#FEFCE0] px-2 py-0.5 text-[11px] font-bold text-[#8A6A00]">高速</span>
            </div>
            <div className="mt-4">
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                45K<span className="text-[15px] text-[#9ca3af]"> 节点/秒</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">内容生成</p>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
              <div className="h-2 w-[84%] rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" />
            </div>
          </div>

          {/* 部署进度 · 环形 + 百分比 · 蓝 */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              </span>
              <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">进行中</span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[28px] font-bold leading-none text-[#111827]">
                  78<span className="text-[15px] text-[#9ca3af]">%</span>
                </p>
                <p className="mt-1.5 text-[12px] text-[#6b7280]">整体部署进度</p>
              </div>
              <div className="h-12 w-12 shrink-0">
                <svg viewBox="0 0 36 36" className="-rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#002fa7"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="78 100"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ── 部署进度详情 ──────────────────────────────────────── */}
        <section className="pw-shadow-soft rounded-xl border border-[#e5e7eb] bg-white p-8">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[18px] font-extrabold text-[#111827] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
              部署进度
            </h3>
            <div className="flex items-end gap-2">
              <span className="text-[30px] font-bold leading-none text-[#002fa7]">78</span>
              <span className="mb-1 text-[15px] text-[#9ca3af]">%</span>
              <span className="mb-1 ml-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>+5%
              </span>
            </div>
          </div>
          {/* 品牌色进度条 */}
          <div className="mb-4 h-4 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-[#002fa7] to-[#781621] transition-all duration-700"
              style={{ width: '78%' }}
            />
          </div>
          {/* 阶段节点 */}
          <div className="flex items-start gap-0">
            {DEPLOY_PHASES.map((phase, i) => (
              <div key={phase.label} className="flex flex-col items-center" style={{ width: `${phase.pct}%` }}>
                <div
                  className={`mb-1.5 h-2 w-full rounded-sm ${i < DEPLOY_PHASES.length - 2 ? 'opacity-100' : 'opacity-40'}`}
                  style={{ backgroundColor: phase.color }}
                />
                <span
                  className={`text-[10px] font-semibold ${phase.done ? 'text-[#002fa7]' : i === DEPLOY_PHASES.length - 2 ? 'font-bold text-[#781621]' : 'text-[#9ca3af]'}`}
                >
                  {phase.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 数据洞察 band (雷达 + 趋势) ──────────────────────── */}
        <div className="mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#002fa7]">insights</span>
          <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
          <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 实时测算</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
            模型已就绪
          </span>
        </div>
        <div className="grid grid-cols-12 gap-6">
          {/* 系统健康度雷达 · col-span-5 */}
          <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                  <span className="material-symbols-outlined text-[20px]">radar</span>
                </span>
                <div>
                  <h3 className="text-[14px] font-bold text-[#111827]">系统健康度雷达</h3>
                  <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[26px] font-bold leading-none text-[#002fa7]">84</p>
                <p className="text-[10px] text-[#9ca3af]">综合分</p>
              </div>
            </div>
            {(() => {
              const dims = DB_RADAR_DIMS;
              const cx = 130;
              const cy = 122;
              const R = 88;
              const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
              const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
              const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
              const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
              return (
                <svg viewBox="0 0 260 244" className="w-full">
                  <defs>
                    <linearGradient id="radarFillDB" x1="0" y1="0" x2="0" y2="1">
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
                  <polygon points={dataPoly} fill="url(#radarFillDB)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
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
              );
            })()}
            <div className="mt-2 grid grid-cols-3 gap-y-2">
              {DB_RADAR_DIMS.map((d) => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                  <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7 日吞吐趋势 · col-span-7 */}
          <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                  <span className="material-symbols-outlined text-[20px]">show_chart</span>
                </span>
                <div>
                  <h3 className="text-[14px] font-bold text-[#111827]">7 日吞吐趋势</h3>
                  <p className="text-[11px] text-[#9ca3af]">按当前系统节点测算</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {['吞吐', '延迟', '在线率'].map((t, i) => (
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
              <p className="text-[30px] font-bold leading-none text-[#111827]">92K</p>
              <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>+142%
              </span>
              <span className="mb-1 text-[12px] text-[#9ca3af]">节点/秒峰值</span>
            </div>
            {(() => {
              const data = DB_TREND_DATA;
              const W = 560;
              const H = 168;
              const padL = 6;
              const padR = 6;
              const padT = 12;
              const padB = 8;
              const innerW = W - padL - padR;
              const innerH = H - padT - padB;
              const max = 110;
              const x = (i: number) => padL + (innerW * i) / (data.length - 1);
              const y = (v: number) => padT + innerH * (1 - v / max);
              const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
              const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                  <defs>
                    <linearGradient id="trendFillDB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="trendLineDB" x1="0" y1="0" x2="1" y2="0">
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
                  <path d={area} fill="url(#trendFillDB)" />
                  <path d={line} fill="none" stroke="url(#trendLineDB)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((v, i) => (
                    <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" />
                  ))}
                </svg>
              );
            })()}
            <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
              {DB_TREND_LABELS.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── 活动节点流 ─────────────────────────────────────── */}
        <section className="pw-shadow-soft overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-gradient-to-r from-[#002fa7] to-[#001e73] px-6 py-4 text-white">
            <h3 className="flex items-center gap-1.5 text-[18px] font-extrabold before:h-3.5 before:w-1 before:rounded-full before:bg-[#F6D300] before:content-['']">
              活动节点流
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F6D300]" />
                实时监控
              </span>
              <span className="material-symbols-outlined text-white/80">sort</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#e5e7eb] bg-[#f8faff] font-medium text-[#6b7280]">
                <tr>
                  <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider">标识符</th>
                  <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider">来源</th>
                  <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-right text-[12px] font-bold uppercase tracking-wider">延迟</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {TABLE_ROWS.map((r) => {
                  const chip = ICON_CHIP_COLORS[r.chipIdx % ICON_CHIP_COLORS.length] ?? ICON_CHIP_COLORS[0]!;
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-[#f8faff]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${chip.bg} ${chip.text}`}>
                            <span className="material-symbols-outlined text-[15px]">{r.icon}</span>
                          </span>
                          <span className="font-mono text-[#4b5563]">{r.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#111827]">{r.src}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_TONE[r.tone]}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${DOT_TONE[r.tone]}`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`rounded-md px-2 py-0.5 font-mono text-[13px] font-semibold ${r.tone === 'green' ? 'bg-[#d1fae5] text-[#065f46]' : r.tone === 'yellow' ? 'bg-[#FEFCE0] text-[#8A6A00]' : 'bg-[#fef2f2] text-[#781621]'}`}>
                          {r.latency}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PioneerLayout>
  );
}
