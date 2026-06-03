/**
 * /step/1 · 选择行业赛道 — 先锋白·工业精密版(Stitch 设计基准 · 1:1 还原)
 *
 * 数据/行为保留:56 行业 + 分类 tabs + 搜索过滤 + 选择 + 自定义行业 modal + 跳 /step/3。
 * 视觉换向:PioneerLayout 外壳 + Step 01 chip + bento 行业卡网格 + sticky 操作栏。
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CustomIndustryModal } from '@/components/industry/CustomIndustryModal';
import { PioneerLayout } from '@/layouts/PioneerLayout';
import {
  type Industry,
  STEP1_INDUSTRIES_56,
  STEP1_PAGE_H1,
  STEP1_SEARCH_PLACEHOLDER,
  STEP1_SUBTITLE_COUNT,
  STEP1_SUBTITLE_CUSTOM_LINK,
  STEP1_SUBTITLE_PART1,
  STEP1_SUBTITLE_PART2,
  STEP1_SUBTITLE_PART3,
  STEP1_TABS,
} from '@/lib/constants/industries';

// ── 静态 KPI 数据 ────────────────────────────────────────────────────────────
const S1_KPI = [
  {
    icon: 'hub',
    label: '可选赛道数',
    value: String(STEP1_INDUSTRIES_56.length),
    unit: '个',
    badge: '全覆盖',
    badgeColor: 'bg-[#002fa7]/10 text-[#002fa7]',
    iconBg: 'bg-[#002fa7]/10 text-[#002fa7]',
    cardBg: 'bg-gradient-to-br from-white to-[#f3f6ff] border-[#e0e7ff]',
    extra: null,
  },
  {
    icon: 'verified',
    label: '推荐匹配度',
    value: '92',
    unit: '%',
    badge: '+18%',
    badgeColor: 'bg-[#10b981]/10 text-[#10b981]',
    iconBg: 'bg-[#781621]/10 text-[#781621]',
    cardBg: 'bg-white border-[#e5e7eb]',
    extra: 'ring',
  },
  {
    icon: 'track_changes',
    label: '已选行业',
    value: '0',
    unit: '个',
    badge: '选择中',
    badgeColor: 'bg-[#F6D300]/20 text-[#8a6a00]',
    iconBg: 'bg-[#F6D300]/20 text-[#8a6a00]',
    cardBg: 'bg-white border-[#e5e7eb]',
    extra: 'bar',
  },
  {
    icon: 'local_fire_department',
    label: '平均热度',
    value: '86',
    unit: '/100',
    badge: '↑热门',
    badgeColor: 'bg-[#002fa7]/10 text-[#002fa7]',
    iconBg: 'bg-[#002fa7]/10 text-[#002fa7]',
    cardBg: 'bg-white border-[#e5e7eb]',
    extra: null,
  },
] as const;

// ── 赛道吸引力雷达六维(S1 suffix 防 id 冲突) ─────────────────────────────────
const S1_RADAR_DIMS = [
  { label: '市场规模', value: 88, color: '#002fa7' },
  { label: '增长性', value: 82, color: '#781621' },
  { label: '变现力', value: 90, color: '#F6D300' },
  { label: '竞争度', value: 72, color: '#002fa7' },
  { label: '门槛', value: 68, color: '#781621' },
  { label: '政策', value: 85, color: '#F6D300' },
];

// ── 赛道热度趋势数据 ─────────────────────────────────────────────────────────
const S1_TREND_DATA = [22, 35, 44, 58, 70, 83, 92, 100];
const S1_TREND_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'];

// ── 行业卡 icon tile 颜色轮转(三主色) ────────────────────────────────────────
const S1_TILE_COLORS = ['#002fa7', '#781621', '#F6D300', '#002fa7', '#781621'];

// ── 行业卡微指标静态热度(循环分配) ──────────────────────────────────────────
const S1_HEAT = [92, 85, 88, 78, 83, 90, 72, 86, 80, 94, 75, 88, 82, 76, 89, 84, 71, 93,
                 87, 79, 85, 91, 73, 88, 82, 77, 86, 94, 80, 75, 89, 83, 70, 92, 85, 78,
                 88, 82, 76, 90, 84, 71, 93, 87, 79, 85, 91, 73, 88, 82, 77, 86, 94, 80, 75, 89];

export default function Step1() {
  const navigate = useNavigate();
  const [activeTabId, setActiveTabId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [customIndustry, setCustomIndustry] = useState<string>('');
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const activeTab = STEP1_TABS.find((t) => t.id === activeTabId) ?? STEP1_TABS[0]!;
  const tabFiltered =
    activeTabId === 'all'
      ? STEP1_INDUSTRIES_56
      : STEP1_INDUSTRIES_56.filter((ind) => ind.category === activeTab.label);
  const filteredIndustries = searchQuery.trim()
    ? tabFiltered.filter(
        (ind) =>
          ind.label.includes(searchQuery) ||
          (ind.keywords ?? []).some((kw) => kw.includes(searchQuery)),
      )
    : tabFiltered;

  const selectedLabel = selectedIndustry?.label ?? customIndustry;
  const hasSelection = !!selectedIndustry || !!customIndustry;

  function handleSelectIndustry(ind: Industry) {
    setSelectedIndustry(ind);
    setCustomIndustry('');
  }

  function handleCustomConfirm(value: string) {
    setCustomIndustry(value);
    setSelectedIndustry(null);
  }

  function clearSelection() {
    setSelectedIndustry(null);
    setCustomIndustry('');
  }

  function handleSubmit() {
    if (!hasSelection) return;
    navigate('/step/3');
  }

  const btnSecondary =
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

  // ── 雷达 SVG 渲染(静态)──────────────────────────────────────────────────────
  function renderRadar() {
    const dims = S1_RADAR_DIMS;
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
          <linearGradient id="radarFillS1" x1="0" y1="0" x2="0" y2="1">
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
        <polygon points={dataPoly} fill="url(#radarFillS1)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
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
  }

  // ── 趋势折线 SVG ─────────────────────────────────────────────────────────────
  function renderTrend() {
    const data = S1_TREND_DATA;
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
          <linearGradient id="trendFillS1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trendLineS1" x1="0" y1="0" x2="1" y2="0">
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
        <path d={area} fill="url(#trendFillS1)" />
        <path d={line} fill="none" stroke="url(#trendLineS1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) =>
          i % 2 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" /> : null,
        )}
      </svg>
    );
  }

  return (
    <PioneerLayout>
      <div className="pb-28">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-12 flex flex-row items-center justify-between gap-8">
          <div className="shrink-0">
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
                战略节点
              </span>
              <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
                赛道选择
              </span>
            </div>
            <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tight text-[#1b1b1b]">
              STEP 01 · {STEP1_PAGE_H1}
            </h1>
            <p className="mt-2 max-w-2xl text-[16px] text-[#444653]">
              {STEP1_SUBTITLE_PART1}
              <span className="font-bold text-[#002fa7]">{STEP1_SUBTITLE_COUNT}</span>
              {STEP1_SUBTITLE_PART2}
              <button
                type="button"
                data-testid="subtitle-custom-link"
                onClick={() => setCustomModalOpen(true)}
                className="font-semibold text-[#002fa7] underline-offset-2 hover:underline"
              >
                {STEP1_SUBTITLE_CUSTOM_LINK}
              </button>
              {STEP1_SUBTITLE_PART3}
            </p>
          </div>
          <div className="flex shrink-0 flex-nowrap gap-3">
            <button type="button" onClick={() => setCustomModalOpen(true)} className={btnSecondary}>
              <span className="material-symbols-outlined text-[18px]">edit</span>
              自定义行业
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasSelection}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              确认并进入下一步
            </button>
          </div>
        </header>

        {/* ── KPI 概览卡(4 张)──────────────────────────────── */}
        <div className="mb-8 grid grid-cols-4 gap-6">
          {S1_KPI.map((kpi, idx) => (
            <div
              key={kpi.label}
              className={`rounded-xl border p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${kpi.cardBg}`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.iconBg}`}>
                  <span className="material-symbols-outlined text-[20px]">{kpi.icon}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${kpi.badgeColor}`}>
                  {idx === 1
                    ? <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[13px]">trending_up</span>{kpi.badge}</span>
                    : kpi.badge}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-bold leading-none text-[#111827]">
                    {idx === 2 ? (hasSelection ? '1' : '0') : kpi.value}
                    <span className="text-[15px] text-[#9ca3af]">{kpi.unit}</span>
                  </p>
                  <p className="mt-1.5 text-[12px] text-[#6b7280]">{kpi.label}</p>
                </div>
                {kpi.extra === 'ring' && (
                  <div className="h-12 w-12 shrink-0">
                    <svg viewBox="0 0 36 36" className="-rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#781621" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="92 100" />
                    </svg>
                  </div>
                )}
              </div>
              {kpi.extra === 'bar' && (
                <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" style={{ width: hasSelection ? '100%' : '4%' }} />
                </div>
              )}
              {kpi.extra === null && idx === 3 && (
                <div className="mt-3 flex h-6 items-end gap-1">
                  {[68, 82, 75, 90, 78].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-[#002fa7]/60" style={{ height: `${h}%` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
        <div className="mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#002fa7]">insights</span>
          <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
          <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 行业吸引力实时测算</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
            模型已就绪
          </span>
        </div>
        <div className="mb-8 grid grid-cols-12 gap-6">
          {/* 赛道吸引力雷达 */}
          <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                  <span className="material-symbols-outlined text-[20px]">radar</span>
                </span>
                <div>
                  <h3 className="text-[14px] font-bold text-[#111827]">赛道吸引力雷达</h3>
                  <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[26px] font-bold leading-none text-[#002fa7]">81</p>
                <p className="text-[10px] text-[#9ca3af]">综合分</p>
              </div>
            </div>
            {renderRadar()}
            <div className="mt-2 grid grid-cols-3 gap-y-2">
              {S1_RADAR_DIMS.map((d) => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                  <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 赛道热度趋势 */}
          <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                  <span className="material-symbols-outlined text-[20px]">show_chart</span>
                </span>
                <div>
                  <h3 className="text-[14px] font-bold text-[#111827]">赛道热度趋势</h3>
                  <p className="text-[11px] text-[#9ca3af]">近 8 个月综合热度指数</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {['热度', '流量', '竞争'].map((t, i) => (
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
              <p className="text-[30px] font-bold leading-none text-[#111827]">100</p>
              <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>+354%
              </span>
              <span className="mb-1 text-[12px] text-[#9ca3af]">较同期基线</span>
            </div>
            {renderTrend()}
            <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
              {S1_TREND_LABELS.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filters + search ───────────────────────────────── */}
        <div className="mb-6 flex flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {STEP1_TABS.map((tab) => {
              const active = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`tab-${tab.id}`}
                  data-state={active ? 'active' : 'inactive'}
                  onClick={() => setActiveTabId(tab.id)}
                  className={[
                    'rounded-md border px-4 py-2 text-[12px] font-bold uppercase tracking-wide transition-all',
                    active
                      ? 'border-[#002fa7] bg-[#002fa7] text-white shadow-sm'
                      : 'border-[#c4c5d6] bg-white text-[#444653] hover:border-[#001e73] hover:text-[#001e73]',
                  ].join(' ')}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={STEP1_SEARCH_PLACEHOLDER}
              data-testid="industry-search"
              className="w-64 rounded-md border border-[#e5e7eb] bg-white py-2 pl-10 pr-4 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:ring-1 focus:ring-[#002fa7]"
            />
          </div>
        </div>

        {/* ── Industry bento grid ────────────────────────────── */}
        {filteredIndustries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c4c5d6] bg-[#f9f9f9] py-16 text-center">
            <p className="text-[16px] font-bold text-[#1b1b1b]">未找到匹配的行业</p>
            <button
              type="button"
              onClick={() => setCustomModalOpen(true)}
              className="mt-2 text-[14px] font-semibold text-[#002fa7] hover:underline"
            >
              尝试自定义输入 →
            </button>
          </div>
        ) : (
          <div className="mb-12 grid grid-cols-6 gap-4">
            {filteredIndustries.map((ind, idx) => {
              const active = selectedIndustry?.label === ind.label;
              const tileColor = S1_TILE_COLORS[idx % S1_TILE_COLORS.length]!;
              const heat = S1_HEAT[idx % S1_HEAT.length] ?? 80;
              return (
                <button
                  key={ind.label}
                  type="button"
                  data-testid={`industry-card-${ind.label}`}
                  data-state={active ? 'active' : 'inactive'}
                  onClick={() => handleSelectIndustry(ind)}
                  className={[
                    'group relative flex cursor-pointer flex-col items-start gap-2 overflow-hidden rounded-xl p-4 text-left transition-all',
                    active
                      ? 'border-2 border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm'
                      : 'border border-[#e5e7eb] bg-white hover:-translate-y-1 hover:border-[#001e73] hover:shadow-md',
                  ].join(' ')}
                >
                  {/* 选中 check 徽标 */}
                  <span
                    className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all ${active ? 'bg-[#002fa7] text-white' : 'border border-[#e5e7eb] bg-white text-transparent'}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">check</span>
                  </span>

                  {/* 彩色 icon tile */}
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl shadow-sm"
                    style={{ backgroundColor: tileColor }}
                  >
                    {ind.emoji}
                  </span>

                  {/* 行业名 + 副标 */}
                  <div className="w-full min-w-0">
                    <h3
                      className={[
                        'text-[14px] font-bold leading-tight',
                        active ? 'text-[#001e73]' : 'text-[#1b1b1b]',
                      ].join(' ')}
                    >
                      {ind.label}
                    </h3>
                    <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-[#9ca3af]">
                      {ind.category}
                    </p>
                  </div>

                  {/* 微指标: 热度进度条 */}
                  <div className="w-full">
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span className="text-[#9ca3af]">热度</span>
                      <span className={`font-bold ${active ? 'text-[#002fa7]' : 'text-[#6b7280]'}`}>{heat}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-[#f3f4f6]">
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: `${heat}%`,
                          backgroundColor: active ? '#002fa7' : tileColor,
                          opacity: active ? 1 : 0.6,
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sticky action bar ────────────────────────────────── */}
      {hasSelection && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#c4c5d6] bg-white/95 shadow-[0px_-4px_20px_rgba(0,0,0,0.04)] backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-10 py-4">
            <div className="flex items-center gap-4">
              <span className="text-[14px] text-[#444653]">已选择:</span>
              <span className="flex items-center gap-1 rounded-full border border-[#002fa7]/20 bg-[#002fa7]/10 px-3 py-1 text-[12px] font-bold text-[#001e73]">
                {selectedLabel}
                <button
                  type="button"
                  aria-label="清除选择"
                  onClick={clearSelection}
                  className="material-symbols-outlined text-[14px] hover:text-[#781621]"
                >
                  close
                </button>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[14px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm"
            >
              确认并进入下一步
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      <CustomIndustryModal
        open={customModalOpen}
        onOpenChange={setCustomModalOpen}
        hideTrigger
        onConfirm={handleCustomConfirm}
      />
    </PioneerLayout>
  );
}
