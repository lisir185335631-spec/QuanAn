/**
 * /step/1 · 选择行业赛道 — 红蓝紫渐变 IKB 体系
 *
 * 数据/行为保留:56 行业 + 分类 tabs + 搜索过滤 + 选择 + 自定义行业 modal + 跳 /step/3。
 * 视觉换向:IKBLayout 外壳 + Step 01 chip + bento 行业卡网格 + sticky 操作栏。
 */
import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { C, F } from '@/components/home/ikb/system';
import { CustomIndustryModal } from '@/components/industry/CustomIndustryModal';
import { IKBLayout } from '@/layouts/IKBLayout';
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
    badgeColor: C.ikb,
    badgeBg: `${C.ikb}18`,
    iconColor: C.ikb,
    iconBg: `${C.ikb}18`,
    extra: null,
  },
  {
    icon: 'verified',
    label: '推荐匹配度',
    value: '92',
    unit: '%',
    badge: '+18%',
    badgeColor: C.ikb,
    badgeBg: `${C.ikb}18`,
    iconColor: C.burgundyText,
    iconBg: `${C.burgundy}18`,
    extra: 'ring',
  },
  {
    icon: 'track_changes',
    label: '已选行业',
    value: '0',
    unit: '个',
    badge: '选择中',
    badgeColor: C.purpleText,
    badgeBg: `${C.yellow}28`,
    iconColor: C.purpleText,
    iconBg: `${C.yellow}28`,
    extra: 'bar',
  },
  {
    icon: 'local_fire_department',
    label: '平均热度',
    value: '86',
    unit: '/100',
    badge: '↑热门',
    badgeColor: C.ikb,
    badgeBg: `${C.ikb}18`,
    iconColor: C.ikb,
    iconBg: `${C.ikb}18`,
    extra: null,
  },
] as const;

// ── 赛道吸引力雷达六维(S1 suffix 防 id 冲突) ─────────────────────────────────
const S1_RADAR_DIMS = [
  { label: '市场规模', value: 88, color: C.ikb },
  { label: '增长性', value: 82, color: C.burgundy },
  { label: '变现力', value: 90, color: C.accent3 },
  { label: '竞争度', value: 72, color: C.ikb },
  { label: '门槛', value: 68, color: C.burgundy },
  { label: '政策', value: 85, color: C.accent3 },
];

// ── 赛道热度趋势数据 ─────────────────────────────────────────────────────────
const S1_TREND_DATA = [22, 35, 44, 58, 70, 83, 92, 100];
const S1_TREND_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'];

// ── 行业卡 icon tile 颜色轮转(红蓝紫三主色) ────────────────────────────────────────
const S1_TILE_COLORS = [C.ikb, C.burgundy, C.accent3, C.ikb, C.burgundy];

// ── 行业卡微指标静态热度(循环分配) · 占位假数据,待接入真实 API ────────────────────
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
            <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
            <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
        ))}
        {dims.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
        })}
        <polygon points={dataPoly} fill="url(#radarFillS1)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
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
            <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
            <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trendLineS1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.ikb} />
            <stop offset="100%" stopColor={C.burgundy} />
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
          i % 2 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
        )}
      </svg>
    );
  }

  return (
    <IKBLayout>
      <div className="pb-28">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-12 flex flex-row items-center justify-between gap-8">
          <div className="shrink-0">
            <div className="mb-3 flex items-center gap-3">
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  borderRadius: 8,
                  border: `1px solid ${C.line}`,
                  background: C.base,
                  color: C.ink,
                  padding: '4px 10px',
                }}
              >
                战略节点
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  borderRadius: 8,
                  border: `1px solid ${C.yellow}55`,
                  background: `${C.yellow}18`,
                  color: C.purpleText,
                  padding: '4px 10px',
                }}
              >
                赛道选择
              </span>
            </div>
            <h1
              style={{
                fontFamily: F.display,
                fontWeight: 400,
                fontSize: 40,
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                margin: 0,
                whiteSpace: 'nowrap',
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              STEP 01 · {STEP1_PAGE_H1}
            </h1>
            <p
              className="mt-2 max-w-2xl"
              style={{ fontSize: 16, color: '#5A6173', fontFamily: F.cn }}
            >
              {STEP1_SUBTITLE_PART1}
              <span style={{ fontWeight: 700, color: C.ikb }}>{STEP1_SUBTITLE_COUNT}</span>
              {STEP1_SUBTITLE_PART2}
              <button
                type="button"
                data-testid="subtitle-custom-link"
                onClick={() => setCustomModalOpen(true)}
                style={{
                  fontWeight: 600,
                  color: C.burgundyText,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: F.cn,
                  fontSize: 16,
                  padding: 0,
                }}
              >
                {STEP1_SUBTITLE_CUSTOM_LINK}
              </button>
              {STEP1_SUBTITLE_PART3}
            </p>
          </div>
          <div className="flex shrink-0 flex-nowrap gap-3">
            <button
              type="button"
              onClick={() => setCustomModalOpen(true)}
              className="ikb-focusring"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 10,
                border: `1px solid ${C.line}`,
                background: C.paper,
                padding: '10px 16px',
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.ink,
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.base; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.paper; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
              自定义行业
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasSelection}
              className="ikb-gradbtn"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 10,
                padding: '10px 18px',
                fontFamily: F.cn,
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                border: 'none',
                cursor: hasSelection ? 'pointer' : 'not-allowed',
                opacity: hasSelection ? 1 : 0.4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              确认并进入下一步
            </button>
          </div>
        </header>

        {/* ── KPI 概览卡(4 张)──────────────────────────────── */}
        <div className="mb-8 grid grid-cols-4 gap-6">
          {S1_KPI.map((kpi, idx) => (
            <div
              key={kpi.label}
              className="ikb-hovercard"
              style={{
                border: `1px solid ${C.line}`,
                background: C.paper,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: kpi.iconBg,
                    color: kpi.iconColor,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{kpi.icon}</span>
                </span>
                <span
                  style={{
                    borderRadius: 999,
                    padding: '2px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: F.mono,
                    letterSpacing: '0.06em',
                    background: kpi.badgeBg,
                    color: kpi.badgeColor,
                  }}
                >
                  {idx === 1 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>trending_up</span>
                      {kpi.badge}
                    </span>
                  ) : kpi.badge}
                </span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>
                    {idx === 2 ? (hasSelection ? '1' : '0') : kpi.value}
                    <span style={{ fontSize: 15, color: '#6b7280', fontFamily: F.cn, fontWeight: 400 }}>{kpi.unit}</span>
                  </p>
                  <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>{kpi.label}</p>
                </div>
                {kpi.extra === 'ring' && (
                  <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.burgundy} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="92 100" />
                    </svg>
                  </div>
                )}
              </div>
              {kpi.extra === 'bar' && (
                <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 999, background: `${C.yellow}22` }}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      background: C.grad,
                      width: hasSelection ? '100%' : '4%',
                      transition: 'width 0.4s',
                    }}
                  />
                </div>
              )}
              {kpi.extra === null && idx === 3 && (
                <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
                  {[68, 82, 75, 90, 78].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        borderRadius: '2px 2px 0 0',
                        background: `${C.ikb}99`,
                        height: `${h}%`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
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
                  className="ikb-focusring"
                  style={{
                    borderRadius: 9999,
                    border: active ? `1px solid ${C.ikb}` : `1px solid rgba(22,32,72,0.18)`,
                    background: active ? C.ikb : C.paper,
                    color: active ? '#fff' : '#5A6173',
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontFamily: F.mono,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb;
                      (e.currentTarget as HTMLButtonElement).style.color = C.ikb;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(22,32,72,0.18)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#5A6173';
                    }
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ fontSize: 18, color: '#6b7280' }}>
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={STEP1_SEARCH_PLACEHOLDER}
              data-testid="industry-search"
              className="ikb-input"
              style={{
                width: 256,
                borderRadius: 10,
                border: `1px solid ${C.line}`,
                background: C.paper,
                padding: '8px 16px 8px 40px',
                fontSize: 14,
                fontFamily: F.cn,
                color: C.ink,
                transition: 'border-color 0.2s',
              }}
            />
          </div>
        </div>

        {/* ── Industry bento grid ────────────────────────────── */}
        {filteredIndustries.length === 0 ? (
          <div
            style={{
              borderRadius: 12,
              border: `1px dashed rgba(22,32,72,0.22)`,
              background: C.base,
              padding: '64px 0',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>未找到匹配的行业</p>
            <button
              type="button"
              onClick={() => setCustomModalOpen(true)}
              style={{
                marginTop: 8,
                fontSize: 14,
                fontWeight: 600,
                color: C.ikb,
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: F.cn,
              }}
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
                  className={`ikb-focusring ikb-hovercard`}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    cursor: 'pointer',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 8,
                    overflow: 'hidden',
                    borderRadius: 12,
                    padding: 16,
                    textAlign: 'left',
                    border: active ? `2px solid ${C.ikb}` : `1px solid ${C.line}`,
                    background: active ? `${C.ikb}08` : C.paper,
                    boxShadow: active ? `0 2px 12px ${C.ikb}20` : 'none',
                  }}
                >
                  {/* 选中 check 徽标 */}
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: 10,
                      display: 'flex',
                      height: 16,
                      width: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: active ? C.ikb : C.paper,
                      border: active ? 'none' : `1px solid ${C.line}`,
                      color: active ? '#fff' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
                  </span>

                  {/* 彩色 icon tile */}
                  <span
                    style={{
                      display: 'flex',
                      height: 40,
                      width: 40,
                      flexShrink: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      borderRadius: 8,
                      boxShadow: `0 2px 8px ${tileColor}40`,
                      backgroundColor: tileColor,
                    }}
                  >
                    {ind.emoji}
                  </span>

                  {/* 行业名 + 副标 */}
                  <div style={{ width: '100%', minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        fontFamily: F.cn,
                        color: active ? C.ikb : C.ink,
                        margin: 0,
                      }}
                    >
                      {ind.label}
                    </h3>
                    <p
                      style={{
                        marginTop: 2,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#6b7280',
                        fontFamily: F.mono,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: '2px 0 0',
                      }}
                    >
                      {ind.category}
                    </p>
                  </div>

                  {/* 微指标: 热度进度条 */}
                  <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                      <span style={{ color: '#6b7280', fontFamily: F.mono }}>热度</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: active ? C.ikb : '#6b7280',
                          fontFamily: F.mono,
                        }}
                      >
                        {heat}%
                      </span>
                    </div>
                    <div style={{ height: 4, width: '100%', borderRadius: 999, background: '#f3f4f6' }}>
                      <div
                        style={{
                          height: 4,
                          borderRadius: 999,
                          transition: 'all 0.3s',
                          width: `${heat}%`,
                          background: active ? C.grad : tileColor,
                          opacity: active ? 1 : 0.65,
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
        <div className="mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }}>insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 行业吸引力实时测算</span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              background: `${C.ikb}15`,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: C.ikb,
              fontFamily: F.mono,
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                height: 6,
                width: 6,
                borderRadius: '50%',
                background: C.ikb,
                animation: 'ikb-pulse 1.6s ease-in-out infinite',
                display: 'inline-block',
              }}
            />
            模型已就绪
          </span>
        </div>
        <div className="mb-8 grid grid-cols-12 gap-6">
          {/* 赛道吸引力雷达 */}
          <div
            className="col-span-5 ikb-hovercard"
            style={{
              borderRadius: 12,
              border: `1px solid ${C.line}`,
              background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
              padding: 24,
            }}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: `${C.ikb}18`,
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>radar</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>赛道吸引力雷达</h3>
                  <p style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn, margin: 0 }}>六维模型评估</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  className="ikb-gradtext"
                  style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, margin: 0, fontFamily: F.display }}
                >
                  81
                </p>
                <p style={{ fontSize: 10, color: '#6b7280', fontFamily: F.mono, margin: 0 }}>综合分</p>
              </div>
            </div>
            {renderRadar()}
            <div className="mt-2 grid grid-cols-3 gap-y-2">
              {S1_RADAR_DIMS.map((d) => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 赛道热度趋势 */}
          <div
            className="col-span-7 ikb-hovercard"
            style={{
              borderRadius: 12,
              border: `1px solid ${C.line}`,
              background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
              padding: 24,
            }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: `${C.burgundy}18`,
                    color: C.burgundyText,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>show_chart</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>赛道热度趋势</h3>
                  <p style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn, margin: 0 }}>近 8 个月综合热度指数</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(['热度', '流量', '竞争'] as const).map((t, i) => (
                  <span
                    key={t}
                    style={{
                      borderRadius: 4,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: F.mono,
                      background: i === 0 ? C.ikb : '#f1f3f9',
                      color: i === 0 ? '#fff' : '#6b7280',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-3 flex items-end gap-3">
              <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>100</p>
              <span
                style={{
                  marginBottom: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 999,
                  background: `${C.ikb}15`,
                  padding: '2px 8px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>+354%
              </span>
              <span style={{ marginBottom: 4, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>较同期基线</span>
            </div>
            {renderTrend()}
            <div className="mt-1 flex justify-between px-1" style={{ fontSize: 10, color: '#6b7280', fontFamily: F.mono }}>
              {S1_TREND_LABELS.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky action bar ────────────────────────────────── */}
      {hasSelection && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            borderTop: `1px solid ${C.line}`,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(10px)',
            boxShadow: `0 -4px 20px ${C.ikb}0F`,
          }}
        >
          <div
            style={{
              margin: '0 auto',
              display: 'flex',
              width: '100%',
              maxWidth: 1440,
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 40px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 14, color: '#5A6173', fontFamily: F.cn }}>已选择:</span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 999,
                  border: `1px solid ${C.ikb}33`,
                  background: `${C.ikb}12`,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.cn,
                }}
              >
                {selectedLabel}
                <button
                  type="button"
                  aria-label="清除选择"
                  onClick={clearSelection}
                  style={{
                    fontSize: 14,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.ikb,
                    padding: 0,
                    display: 'inline-flex',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.burgundy; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="ikb-gradbtn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 10,
                padding: '12px 32px',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontFamily: F.cn,
              }}
            >
              确认并进入下一步
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
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
    </IKBLayout>
  );
}
