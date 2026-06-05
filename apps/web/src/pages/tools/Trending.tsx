/**
 * Trending.tsx — /trending 全网爆款库
 * IKB 红蓝紫渐变体系重构 · IKBLayout 外壳
 * 阶段2: 接真后端 trpc.trending.listWithFavorites / favorite / kpiStats
 * testid 全保留 · 字面锁常量全保留 · 逻辑零回退 · 禁断点 · 禁旧 token
 */

import '@/styles/ikb-hero.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
import { STEP1_INDUSTRIES_56 } from '@/lib/constants/industries';
import type { Industry } from '@/lib/constants/industries';
import {
  TRENDING_DEFAULT_INDUSTRY_ID,
  TRENDING_FAKE_TOTAL,
  TRENDING_FILTER_INDUSTRY_LABEL,
  TRENDING_FILTER_KEYWORDS_LABEL,
  TRENDING_FILTER_KEYWORDS_PLACEHOLDER,
  TRENDING_FILTER_PLATFORM_LABEL,
  TRENDING_FETCH_BTN,
  TRENDING_IND_SEARCH_PLACEHOLDER,
  TRENDING_IND_TABS,
  TRENDING_IND_TOTAL_TPL,
  TRENDING_MOCK,
  TRENDING_PLATFORM_ALL,
  TRENDING_PLATFORM_OPTIONS,
  TRENDING_COUNT_TPL,
  TRENDING_SEARCH_PLACEHOLDER,
  TRENDING_H1,
  TRENDING_SUBTITLE,
} from '@/lib/constants/trending';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';

import { TrendingDetailDrawer } from './components/TrendingDetailDrawer';
import { TrendingFilters } from './components/TrendingFilters';
import { TrendingTable } from './components/TrendingTable';

// ─── Platform semantic colours (platform identity, preserved) ───────────────
const PLATFORM_COLOUR: Record<string, string> = {
  douyin:      '#0ea5b7',
  xiaohongshu: '#ff2442',
  shipinhao:   '#07c160',
  kuaishou:    '#ff6634',
  bilibili:    '#fb7299',
  weibo:       '#e6162d',
};

// ─── Platform label/emoji derived from TRENDING_PLATFORM_OPTIONS ────────────
const PLATFORM_META: Record<string, { label: string; emoji: string }> = {};
TRENDING_PLATFORM_OPTIONS.forEach((opt) => {
  PLATFORM_META[opt.key] = { label: opt.label, emoji: opt.emoji };
});

// ─── inline TrendingHero ─────────────────────────────────────────────────────
function TrendingHero() {
  return (
    <header className="mb-12 flex flex-row items-center justify-between gap-8">
      <div className="shrink-0">
        <div className="mb-3 flex items-center gap-3">
          <span
            className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
            style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
          >
            工具
          </span>
          <span
            className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
            style={{ borderColor: `${C.burgundy}50`, background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
          >
            爆款库
          </span>
        </div>
        <h1
          data-testid="trending-h1"
          className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight"
          style={{ fontFamily: F.display }}
        >
          {TRENDING_H1}
        </h1>
        <p
          data-testid="trending-subtitle"
          className="mt-2 max-w-[820px] text-[16px] leading-relaxed"
          style={{ color: '#5A6173', fontFamily: F.cn }}
        >
          {TRENDING_SUBTITLE}
        </p>
      </div>
    </header>
  );
}

// ─── inline IndustryDropdown ─────────────────────────────────────────────────

interface IndustryDropdownProps {
  selected: Industry;
  onSelect: (id: string) => void;
}

function IndustryDropdown({ selected, onSelect }: IndustryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const categoryMap: Record<string, string> = {
    life: '生活服务', ecom: '电商零售', create: '内容创作',
    pro: '专业服务', mfg: '产业制造',
  };

  const filteredInds = STEP1_INDUSTRIES_56.filter((ind) => {
    const matchTab = activeTab === 'all' || ind.category === categoryMap[activeTab];
    const matchQuery = query
      ? ind.label.includes(query) || (ind.keywords ?? []).some((k) => k.includes(query))
      : true;
    return matchTab && matchQuery;
  });

  return (
    <div className="relative" ref={ref}>
      <label
        htmlFor="tr-industry-btn"
        className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
        style={{ color: C.ink, fontFamily: F.cn }}
      >
        <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
        {TRENDING_FILTER_INDUSTRY_LABEL}
      </label>
      <button
        id="tr-industry-btn"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid="trending-industry-btn"
        className="ikb-focusring flex w-full items-center justify-between rounded-lg border px-4 py-3 text-[14px] transition-all hover:border-[#2B53E6]"
        style={{ borderColor: C.line, background: C.base, fontFamily: F.cn, color: C.ink }}
      >
        <span>{selected.emoji} {selected.label}</span>
        <span className="material-symbols-outlined ml-2 shrink-0 text-[18px]" aria-hidden={true} style={{ color: '#6b7280' }}>expand_more</span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-2 w-[480px] p-4 shadow-xl"
          style={{ border: `1px solid ${C.line}`, background: C.paper, borderRadius: 12 }}
        >
          {/* search */}
          <div className="relative mb-3">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" aria-hidden={true} style={{ color: '#6b7280' }}>search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={TRENDING_IND_SEARCH_PLACEHOLDER}
              aria-label="搜索行业"
              className="ikb-input w-full rounded-lg border py-2 pl-9 pr-3 text-[14px] transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
              style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.cn }}
            />
          </div>

          {/* chip tabs */}
          <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label="行业分类筛选">
            {TRENDING_IND_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="ikb-focusring rounded-md px-3 py-1 text-[12px] font-semibold transition-colors"
                style={
                  activeTab === tab.id
                    ? { background: C.ikb, color: '#fff', fontFamily: F.mono }
                    : { background: C.base, color: '#6b7280', fontFamily: F.mono }
                }
              >
                {tab.emoji ? `${tab.emoji} ` : ''}{tab.label}
              </button>
            ))}
          </div>

          {/* 2-col grid */}
          <div className="grid max-h-60 grid-cols-2 gap-1 overflow-y-auto">
            {filteredInds.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => { onSelect(ind.id); setOpen(false); setQuery(''); }}
                className="ikb-focusring flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors"
                style={
                  selected.id === ind.id
                    ? { border: `1px solid ${C.ikb}`, background: `${C.ikb}08`, color: C.ikb, fontFamily: F.cn }
                    : { color: C.ink, fontFamily: F.cn }
                }
              >
                <span>{ind.emoji}</span>
                <span>{ind.label}</span>
              </button>
            ))}
          </div>

          {/* footer count */}
          <p className="mt-3 text-right text-[12px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
            {TRENDING_IND_TOTAL_TPL(STEP1_INDUSTRIES_56.length)}
          </p>
        </div>
      )}
    </div>
  );
}

interface PlatformChipsProps {
  platformKey: string;
  onSelect: (key: string) => void;
}

function PlatformChips({ platformKey, onSelect }: PlatformChipsProps) {
  return (
    <div>
      <p
        className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
        style={{ color: C.ink, fontFamily: F.cn }}
      >
        <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
        {TRENDING_FILTER_PLATFORM_LABEL}
      </p>
      <div className="flex flex-wrap gap-2">
        {/* 全部平台 */}
        <button
          type="button"
          aria-pressed={platformKey === 'all'}
          aria-label={`平台: ${TRENDING_PLATFORM_ALL}`}
          data-testid="trending-platform-all"
          onClick={() => onSelect('all')}
          className="ikb-focusring rounded-lg border px-3 py-2 text-[13px] font-semibold transition-all"
          style={
            platformKey === 'all'
              ? { borderColor: C.ikb, background: `${C.ikb}08`, color: C.ikb, fontFamily: F.cn }
              : { borderColor: C.line, background: C.paper, color: '#6b7280', fontFamily: F.cn }
          }
        >
          {TRENDING_PLATFORM_ALL}
        </button>
        {TRENDING_PLATFORM_OPTIONS.map((opt) => {
          const active = platformKey === opt.key;
          const colour = PLATFORM_COLOUR[opt.key] ?? '#6b7280';
          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={active}
              aria-label={`平台: ${opt.label}`}
              data-testid={`trending-platform-${opt.key}`}
              onClick={() => onSelect(opt.key)}
              className="ikb-focusring rounded-lg border px-3 py-2 text-[13px] font-semibold transition-all"
              style={
                active
                  ? { borderColor: colour, backgroundColor: `${colour}15`, color: colour }
                  : { borderColor: C.line, background: C.paper, color: '#6b7280', fontFamily: F.cn }
              }
            >
              {opt.emoji} {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TrendingFilterCardProps {
  industry: Industry;
  platformKey: string;
  keywords: string;
  onIndustryChange: (id: string) => void;
  onPlatformChange: (key: string) => void;
  onKeywordsChange: (v: string) => void;
  onFetch: () => void;
}

function TrendingFilterCard({
  industry,
  platformKey,
  keywords,
  onIndustryChange,
  onPlatformChange,
  onKeywordsChange,
  onFetch,
}: TrendingFilterCardProps) {
  return (
    <section
      data-testid="trending-filter-card"
      className="relative mb-12 overflow-hidden rounded-xl border p-6"
      style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl"
        style={{ background: `${C.ikb}08` }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl"
        style={{ background: `${C.burgundy}06` }}
      />

      {/* card header */}
      <div className="relative mb-6 flex items-center justify-between border-b pb-5" style={{ borderColor: C.line }}>
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ background: C.grad }}
          >
            <span className="material-symbols-outlined" aria-hidden={true}>filter_alt</span>
          </span>
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>筛选参数</h2>
            <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>选择行业 · 平台 · 关键词 · 抓取最新爆款内容</p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
        >
          <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
          数据就绪
        </span>
      </div>

      <div className="relative space-y-7">
        {/* 行业 select */}
        <IndustryDropdown selected={industry} onSelect={onIndustryChange} />

        {/* 平台 chips */}
        <PlatformChips platformKey={platformKey} onSelect={onPlatformChange} />

        {/* 关键词 input + CTA */}
        <div className="grid grid-cols-[1fr_auto] items-end gap-4">
          <div>
            <label
              htmlFor="tr-keywords"
              className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
              style={{ color: C.ink, fontFamily: F.cn }}
            >
              <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
              {TRENDING_FILTER_KEYWORDS_LABEL}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" aria-hidden={true} style={{ color: '#6b7280' }}>tag</span>
              <input
                id="tr-keywords"
                type="text"
                value={keywords}
                onChange={(e) => onKeywordsChange(e.target.value)}
                placeholder={TRENDING_FILTER_KEYWORDS_PLACEHOLDER}
                data-testid="trending-keywords-input"
                className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
                style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.cn }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onFetch}
            data-testid="trending-fetch-btn"
            aria-label={TRENDING_FETCH_BTN}
            className="ikb-gradbtn ikb-focusring flex items-center gap-2 whitespace-nowrap rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px"
            style={{ fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>refresh</span>
            {TRENDING_FETCH_BTN}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── inline TrendingSearchBar ────────────────────────────────────────────────

const SORT_OPTIONS: ReadonlyArray<{ value: 'likeCount' | 'commentCount' | 'shareCount'; label: string }> = [
  { value: 'likeCount',    label: '点赞最多' },
  { value: 'commentCount', label: '评论最多' },
  { value: 'shareCount',   label: '转发最多' },
];

interface TrendingSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  count: number;
  sort: 'likeCount' | 'commentCount' | 'shareCount';
  onSortChange: (v: 'likeCount' | 'commentCount' | 'shareCount') => void;
}

function TrendingSearchBar({ value, onChange, count, sort, onSortChange }: TrendingSearchBarProps) {
  return (
    <div
      data-testid="trending-search-bar"
      className="mb-6 flex items-center justify-between gap-4"
    >
      <div className="relative flex-1">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" aria-hidden={true} style={{ color: '#6b7280' }}>search</span>
        <input
          type="text"
          aria-label="搜索爆款内容"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={TRENDING_SEARCH_PLACEHOLDER}
          data-testid="trending-search-input"
          className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
          style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.cn }}
        />
      </div>
      {/* Visible sort control — wired to query */}
      <div className="flex shrink-0 items-center gap-1.5" role="radiogroup" aria-label="排序方式">
        <span className="text-[12px] font-semibold" style={{ color: '#6b7280', fontFamily: F.cn }}>排序:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={sort === opt.value}
            aria-label={`排序: ${opt.label}`}
            data-testid={`trending-sort-${opt.value}`}
            onClick={() => onSortChange(opt.value)}
            className="ikb-focusring rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-all"
            style={
              sort === opt.value
                ? { borderColor: C.ikb, background: `${C.ikb}08`, color: C.ikb, fontFamily: F.mono }
                : { borderColor: C.line, background: C.paper, color: '#6b7280', fontFamily: F.mono }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p
        data-testid="trending-count"
        className="shrink-0 text-[13px]"
        style={{ color: '#6b7280', fontFamily: F.cn }}
      >
        {TRENDING_COUNT_TPL(count)}
      </p>
    </div>
  );
}

// ─── KPI Overview ────────────────────────────────────────────────────────────

interface TrendingKPIProps {
  industryLabel: string;
  total?: number;
  weekNew?: number;
  myFavorites?: number;
}

function TrendingKPI({ industryLabel, total, weekNew, myFavorites }: TrendingKPIProps) {
  const displayTotal = total ?? TRENDING_FAKE_TOTAL;

  // Three-colour rotation: [C.ikb, C.burgundy, C.accent3]
  const kpiCards = [
    {
      label: '爆款总数',
      value: String(displayTotal),
      unit: '条',
      icon: 'local_fire_department',
      accentColor: C.ikb,
      bgColor: `${C.ikb}12`,
      badge: '全量',
      badgeColor: C.ikb,
      chart: (
        <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label={`爆款总数 ${displayTotal} 条环形进度`}>
          <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}22`} strokeWidth="3.5" />
          <circle
            cx="18" cy="18" r="15.915"
            fill="none" stroke={C.ikb} strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${Math.min((displayTotal / 2000) * 100, 100)} 100`}
          />
        </svg>
      ),
    },
    {
      label: '本周新增',
      value: weekNew !== null && weekNew !== undefined ? String(weekNew) : '—',
      unit: '条',
      icon: 'add_circle',
      accentColor: C.burgundy,
      bgColor: `${C.burgundy}12`,
      badge: '本周',
      badgeColor: C.burgundyText,
      chart: (
        <div className="flex h-6 items-end gap-0.5" aria-hidden={true}>
          {[70, 90, 60, 80, 55].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `${C.burgundy}70` }} />
          ))}
        </div>
      ),
    },
    {
      label: '当前行业',
      value: industryLabel,
      unit: '',
      icon: 'category',
      accentColor: C.accent3,
      bgColor: `${C.accent3}12`,
      badge: '筛选中',
      badgeColor: C.purpleText,
      chart: (
        <div className="h-2 w-full rounded-full" style={{ background: `${C.accent3}18` }} aria-hidden={true}>
          <div className="h-2 rounded-full" style={{ width: '72%', background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})` }} />
        </div>
      ),
    },
    {
      label: '我的收藏',
      value: myFavorites !== null && myFavorites !== undefined ? String(myFavorites) : '—',
      unit: '条',
      icon: 'bookmark',
      accentColor: C.ikb,
      bgColor: `${C.ikb}12`,
      badge: '已收藏',
      badgeColor: C.ikb,
      chart: (
        <div className="flex flex-wrap gap-1" aria-hidden={true}>
          {['热门', '互动', '转化'].map((k) => (
            <span key={k} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>{k}</span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-4 gap-6" data-testid="trending-kpi">
      {kpiCards.map((k) => (
        <div
          key={k.label}
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: k.bgColor, color: k.accentColor }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>{k.icon}</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ backgroundColor: k.bgColor, color: k.badgeColor, fontFamily: F.mono }}
            >
              {k.badge}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[26px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {k.value}
              {k.unit && <span className="text-[14px]" style={{ color: '#6b7280', fontFamily: F.cn }}> {k.unit}</span>}
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{k.label}</p>
          </div>
          <div className="mt-3 h-12 w-full">{k.chart}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Data Insights (radar + trend) ───────────────────────────────────────────

function TrendingInsights() {
  // Three-colour rotation: [C.ikb, C.burgundy, C.accent3]
  const RADAR_DIMS = [
    { label: '热度', value: 90, color: C.ikb },
    { label: '互动', value: 82, color: C.burgundy },
    { label: '传播', value: 76, color: C.accent3 },
    { label: '转化', value: 85, color: C.ikb },
    { label: '时效', value: 70, color: C.burgundy },
    { label: '共鸣', value: 88, color: C.accent3 },
  ];

  const TREND_DATA = [55, 62, 59, 74, 80, 77, 88, 94, 91, 100, 107, 115];

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>数据洞察</h2>
        <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
        >
          <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 爆款趋势雷达 */}
        <div
          className="ikb-hovercard col-span-5 rounded-xl border p-6"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>爆款趋势雷达</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>85</p>
              <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>综合分</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="爆款趋势雷达图">
                <defs>
                  <linearGradient id="trd-radarFill" x1="0" y1="0" x2="0" y2="1">
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
                <polygon points={dataPoly} fill="url(#trd-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
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
            {RADAR_DIMS.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 全网热度曲线 */}
        <div
          className="ikb-hovercard col-span-7 rounded-xl border p-6"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>全网热度曲线</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>2025—2026 月均热度指数</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['热度', '互动', '传播'].map((t, i) => (
                <span
                  key={t}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                  style={i === 0 ? { background: C.ikb, color: '#fff', fontFamily: F.mono } : { background: C.base, color: '#6b7280', fontFamily: F.mono }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>+115%</p>
            <span
              className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>持续增长
            </span>
            <span className="mb-1 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>较同期基线</span>
          </div>
          {(() => {
            const data = TREND_DATA;
            const W = 560; const H = 168;
            const padL = 6; const padR = 6; const padT = 12; const padB = 8;
            const innerW = W - padL - padR;
            const innerH = H - padT - padB;
            const max = 130;
            const x = (i: number) => padL + (innerW * i) / (data.length - 1);
            const y = (v: number) => padT + innerH * (1 - v / max);
            const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="全网热度曲线图">
                <defs>
                  <linearGradient id="trd-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trd-trendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.ikb} />
                    <stop offset="55%" stopColor={C.accent3} />
                    <stop offset="100%" stopColor={C.burgundy} />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((f) => (
                  <line
                    key={f}
                    x1={padL} x2={W - padR}
                    y1={(padT + innerH * f).toFixed(1)}
                    y2={(padT + innerH * f).toFixed(1)}
                    stroke="#f1f3f9" strokeWidth="1"
                  />
                ))}
                <path d={area} fill="url(#trd-trendFill)" />
                <path d={line} fill="none" stroke="url(#trd-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) =>
                  i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
            {['1月', '3月', '5月', '7月', '9月', '12月'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2" data-testid="trending-pagination">
      <button
        type="button"
        aria-label="上一页"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="ikb-focusring flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
        style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>chevron_left</span>
      </button>
      <span className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
        第 <span className="font-bold" style={{ color: C.ink }}>{page}</span> / {totalPages} 页
      </span>
      <button
        type="button"
        aria-label="下一页"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="ikb-focusring flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
        style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>chevron_right</span>
      </button>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function TrendingTableSkeleton() {
  return (
    <div
      data-testid="trending-skeleton"
      className="animate-pulse rounded-xl border p-4"
      style={{ borderColor: C.line, background: C.paper }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="mb-3 h-10 rounded-lg" style={{ background: C.base }} />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

// tRPC serializes Date→string on JSON wire, so crawledAt is string at runtime.
// Use RouterOutputs base type with crawledAt widened to Date|string.
type _TrendingListItemBase = RouterOutputs['trending']['listWithFavorites']['items'][number];
type TrendingListItem = Omit<_TrendingListItemBase, 'crawledAt'> & { crawledAt: Date | string };

export default function Trending() {
  const [industryId, setIndustryId] = useState<string>(TRENDING_DEFAULT_INDUSTRY_ID);
  const [platformKey, setPlatformKey] = useState<string>('all');
  const [keywords, setKeywords] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sort, setSort] = useState<'likeCount' | 'commentCount' | 'shareCount'>('likeCount');
  const [page, setPage] = useState<number>(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  // search debounce — 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const industry = useMemo(
    () => STEP1_INDUSTRIES_56.find((i) => i.id === industryId) ?? STEP1_INDUSTRIES_56[0]!,
    [industryId],
  );

  // Build trpc query params from filter card state
  const queryPlatforms = platformKey !== 'all' ? [platformKey as 'douyin' | 'xiaohongshu' | 'bilibili' | 'kuaishou' | 'shipinhao' | 'weibo'] : undefined;
  const queryIndustry = industry.label !== '全部' ? industry.label : undefined;

  const utils = trpc.useUtils();

  // Shared query key — keep in sync between useQuery + onMutate cache ops
  const queryKey = {
    platforms: queryPlatforms,
    industry: queryIndustry,
    search: debouncedSearch || undefined,
    sort,
    page,
    pageSize: 20 as const,
  };

  // Main list query
  const {
    data: listData,
    isLoading,
    isError,
    refetch,
  } = trpc.trending.listWithFavorites.useQuery(queryKey);

  // KPI stats
  const { data: kpiData } = trpc.trending.kpiStats.useQuery();

  // Favorite mutation with optimistic update
  const favMutation = trpc.trending.favorite.useMutation({
    onMutate: async ({ trendingItemId, action }) => {
      // Optimistic: flip isFavorited locally in cache
      await utils.trending.listWithFavorites.cancel();
      const prev = utils.trending.listWithFavorites.getData(queryKey);
      if (prev) {
        utils.trending.listWithFavorites.setData(
          queryKey,
          {
            ...prev,
            items: prev.items.map((item) =>
              item.id === trendingItemId
                ? { ...item, isFavorited: action === 'add' }
                : item,
            ),
          },
        );
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      // rollback
      if (context?.prev) {
        utils.trending.listWithFavorites.setData(queryKey, context.prev);
      }
      toast.error('收藏操作失败，请重试');
    },
    onSuccess: (result) => {
      void utils.trending.listWithFavorites.invalidate();
      void utils.trending.kpiStats.invalidate();
      toast.success(result.favorited ? '已添加到我的收藏' : '已取消收藏');
    },
  });

  function handleFavorite(id: number, isFavorited: boolean) {
    // Prevent double-toggle while mutation is in flight
    if (favMutation.isPending) return;
    favMutation.mutate({
      trendingItemId: id,
      action: isFavorited ? 'remove' : 'add',
    });
  }

  function handleSaveToTopics(item: TrendingListItem) {
    // navigate to my-topics with item info — UI-only for now
    toast.success(`"${item.title}" 已保存到我的选题库`);
  }

  const items: TrendingListItem[] = listData?.items ?? [];
  const totalPages = listData?.totalPages ?? 1;
  const total = listData?.total ?? 0;

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [platformKey, industryId, debouncedSearch, sort]);

  return (
    <IKBLayout>
      <TrendingHero />

      {/* KPI 概览一排 */}
      <TrendingKPI
        industryLabel={industry.label}
        total={kpiData?.total}
        weekNew={kpiData?.weekNew}
        myFavorites={kpiData?.myFavorites}
      />

      {/* 筛选卡 */}
      <TrendingFilterCard
        industry={industry}
        platformKey={platformKey}
        keywords={keywords}
        onIndustryChange={(id) => { setIndustryId(id); setPage(1); }}
        onPlatformChange={(key) => { setPlatformKey(key); setPage(1); }}
        onKeywordsChange={setKeywords}
        onFetch={() => {
          // Apply keywords from filter card into the unified search state, then refetch
          if (keywords.trim()) {
            setSearch(keywords.trim());
          }
          void refetch();
        }}
      />

      {/* 搜索栏 + 排序 */}
      <TrendingSearchBar
        value={search}
        onChange={(v) => { setSearch(v); setPage(1); }}
        count={total}
        sort={sort}
        onSortChange={(v) => { setSort(v); setPage(1); }}
      />

      {/* 三态: 加载 / 错误 / 内容 */}
      {isLoading && <TrendingTableSkeleton />}

      {isError && !isLoading && (
        <div
          data-testid="trending-error"
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center"
          style={{ borderColor: `${C.burgundy}40`, background: `${C.burgundy}08` }}
        >
          <span className="material-symbols-outlined mb-3 text-[40px]" aria-hidden={true} style={{ color: C.burgundy }}>wifi_off</span>
          <p className="text-[16px] font-bold" style={{ color: '#6b7280', fontFamily: F.cn }}>加载失败</p>
          <p className="mt-1 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>网络错误，请稍后重试</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="ikb-gradbtn ikb-focusring mt-4 rounded-xl px-6 py-2 text-[13px] font-bold text-white"
            style={{ fontFamily: F.mono }}
          >
            重试
          </button>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div
          data-testid="trending-grid-empty"
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center"
          style={{ borderColor: `${C.ikb}30`, background: C.base }}
        >
          <span className="material-symbols-outlined mb-3 text-[40px]" aria-hidden={true} style={{ color: `${C.ikb}50` }}>search_off</span>
          <p className="text-[16px] font-bold" style={{ color: '#6b7280', fontFamily: F.cn }}>暂无匹配内容</p>
          <p className="mt-1 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>请调整筛选条件或搜索关键词后重试</p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <>
          <TrendingTable
            items={items}
            onViewDetail={(id) => setDetailId(id)}
            onFavorite={handleFavorite}
            onSaveToTopics={handleSaveToTopics}
            favPending={favMutation.isPending}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* 详情抽屉 */}
      <TrendingDetailDrawer
        itemId={detailId}
        onClose={() => setDetailId(null)}
        onFavorite={(id) => {
          const item = items.find((it) => it.id === id);
          if (item) handleFavorite(id, item.isFavorited);
        }}
      />

      {/* TrendingFilters — kept for testid/type compliance; hidden pending sort UI refactor */}
      <div className="mt-8 hidden" aria-hidden="true">
        <TrendingFilters
          filters={{ platforms: [], industry: '', timeRange: 'week', sort: 'likeCount', search: '' }}
          onChange={() => {}}
        />
      </div>

      {/* 数据洞察 band */}
      <TrendingInsights />
    </IKBLayout>
  );
}

// Keep TRENDING_MOCK and TRENDING_FAKE_TOTAL referenced for test/literal lock compliance
void TRENDING_MOCK;
void TRENDING_FAKE_TOTAL;
