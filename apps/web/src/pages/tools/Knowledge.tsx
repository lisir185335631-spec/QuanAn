/**
 * /knowledge 页面 — AIP文案方法论 · 先锋白重构
 * 4 tab(20类脚本 / 20大爆款 / 开头公式 / 核心公式) + 起承转合 footer
 * 先锋白标准 · PioneerLayout · 自定义 tab(无 shadcn Tabs · 无 lucide 图标) · 品牌三主色
 * testid 全保留 · 逻辑零改动 · 禁断点 · 禁 line-clamp
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
import { CORE_FORMULAS } from '@/lib/constants/coreFormulas';
import { ELEMENT_DETAILS } from '@/lib/constants/elementDetails';
import { ALL_ELEMENTS, HOT_ELEMENT_GROUPS } from '@/lib/constants/elements';
import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';
import { OPENING_FORMULAS } from '@/lib/constants/openingFormulas';
import { SCRIPT_TYPES } from '@/lib/constants/scripts';
import { STORY_FOOTER_TITLE, STORY_STAGES } from '@/lib/constants/storyStages';

// ── Types ──────────────────────────────────────────────────────────────────────
type TabKey = 'scripts' | 'elements' | 'opening' | 'core';
type FilterKey = 'all' | 'classic' | 'emotion' | 'content' | 'conversion';

// ── Constants ──────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: string; testid: string }[] = [
  { key: 'scripts',  label: KNOWLEDGE_PAGE.tabs.scripts,  icon: 'chat',         testid: 'tab-scripts'  },
  { key: 'elements', label: KNOWLEDGE_PAGE.tabs.elements, icon: 'bolt',         testid: 'tab-elements' },
  { key: 'opening',  label: KNOWLEDGE_PAGE.tabs.opening,  icon: 'menu_book',    testid: 'tab-opening'  },
  { key: 'core',     label: KNOWLEDGE_PAGE.tabs.core,     icon: 'lightbulb',    testid: 'tab-core'     },
];

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all',        label: KNOWLEDGE_PAGE.filterChips.all },
  { key: 'classic',    label: KNOWLEDGE_PAGE.filterChips.classic },
  { key: 'emotion',    label: KNOWLEDGE_PAGE.filterChips.emotion },
  { key: 'content',    label: KNOWLEDGE_PAGE.filterChips.content },
  { key: 'conversion', label: KNOWLEDGE_PAGE.filterChips.conversion },
];

// Element group key lookup
const ELEMENT_GROUP_LABEL: Record<string, string> = {};
const ELEMENT_GROUP_KEY: Record<string, string> = {};
for (const group of HOT_ELEMENT_GROUPS) {
  for (const item of group.items) {
    ELEMENT_GROUP_LABEL[item.key] = group.label;
    ELEMENT_GROUP_KEY[item.key] = group.key;
  }
}

// KPI data
const KPI_CARDS = [
  { label: '脚本类型', value: `${SCRIPT_TYPES.length}`, unit: '类', icon: 'chat',      color: '#002fa7', bg: '#e0e7ff', borderColor: '#c7d2fe' },
  { label: '爆款元素', value: '20',                       unit: '个', icon: 'bolt',      color: '#781621', bg: '#fde8ec', borderColor: '#f5c2c7' },
  { label: '开头公式', value: `${OPENING_FORMULAS.length}`, unit: '个', icon: 'menu_book', color: '#8a6a00', bg: '#fdf6cc', borderColor: '#F3E08A' },
  { label: '核心公式', value: `${CORE_FORMULAS.length}`,  unit: '个', icon: 'lightbulb', color: '#002fa7', bg: '#e0e7ff', borderColor: '#c7d2fe' },
];

// Story stage accent colors (pioneer-white)
const STAGE_ACCENT: Record<string, { color: string; bg: string; border: string }> = {
  qi:    { color: '#781621', bg: '#fde8ec', border: '#f5c2c7' },
  cheng: { color: '#8a6a00', bg: '#fdf6cc', border: '#F3E08A' },
  zhuan: { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7' },
  he:    { color: '#002fa7', bg: '#e0e7ff', border: '#c7d2fe' },
};

// ── Sub-components (inline) ────────────────────────────────────────────────────

// ── ScriptTab ──────────────────────────────────────────────────────────────────
function ScriptTab() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const lowerQuery = search.trim().toLowerCase();
  const filtered = lowerQuery
    ? SCRIPT_TYPES.filter(
        (s) =>
          s.label.toLowerCase().includes(lowerQuery) ||
          s.desc.toLowerCase().includes(lowerQuery)
      )
    : SCRIPT_TYPES;

  return (
    <div className="space-y-4" data-testid="script-tab">
      {/* search row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative">
          <span
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="text"
            placeholder={KNOWLEDGE_PAGE.searchPlaceholders.scripts}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[320px] rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-2.5 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
            data-testid="script-search"
          />
        </div>
        <span className="shrink-0 text-[13px] text-[#6b7280]" data-testid="script-count">
          {KNOWLEDGE_PAGE.countText.scripts(SCRIPT_TYPES.length, filtered.length)}
        </span>
      </div>

      {/* grid — fixed 4 cols */}
      <div className="grid grid-cols-4 gap-4">
        {filtered.map((s) => {
          const isExpanded = expanded[s.key] ?? false;
          return (
            <div
              key={s.key}
              className="rounded-xl border border-[#e5e7eb] bg-white p-4 space-y-3 transition-all hover:-translate-y-0.5 hover:shadow-md pw-shadow-soft"
              data-testid={`script-card-${s.key}`}
            >
              {/* header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#002fa7]/10 text-[#002fa7] text-[13px] font-bold shrink-0"
                    data-testid={`script-chip-${s.key}`}
                  >
                    {s.emoji}
                  </span>
                  <span className="font-bold text-[13px] leading-snug text-[#111827]">{s.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label="收藏"
                    data-testid={`script-bookmark-${s.key}`}
                    onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#F6D300] hover:text-[#8a6a00]"
                  >
                    <span className="material-symbols-outlined text-[15px]" aria-hidden="true">bookmark</span>
                  </button>
                  <button
                    type="button"
                    aria-label="复制"
                    data-testid={`script-copy-${s.key}`}
                    onClick={() => {
                      void navigator.clipboard.writeText(s.label);
                      toast.success(KNOWLEDGE_PAGE.toasts.copied);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
                  >
                    <span className="material-symbols-outlined text-[15px]" aria-hidden="true">content_copy</span>
                  </button>
                </div>
              </div>

              {/* desc */}
              <p className="text-[12px] text-[#6b7280]">{s.desc}</p>

              {/* methodology */}
              <p className="text-[11px] text-[#9ca3af] leading-relaxed">{s.methodology}</p>

              {/* expand cases */}
              <button
                type="button"
                data-testid={`script-cases-${s.key}`}
                onClick={() => setExpanded((v) => ({ ...v, [s.key]: !v[s.key] }))}
                className="flex items-center gap-1 text-[11px] text-[#9ca3af] hover:text-[#002fa7] transition-colors w-full"
              >
                <span>实战案例</span>
                <span
                  className={`material-symbols-outlined text-[13px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  expand_more
                </span>
              </button>
              {isExpanded && (
                <p className="text-[11px] text-[#9ca3af] pl-2 border-l-2 border-[#e5e7eb]">
                  暂无案例数据
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ElementsTab ────────────────────────────────────────────────────────────────
function ElementsTab() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filtered =
    activeFilter === 'all'
      ? ALL_ELEMENTS
      : ALL_ELEMENTS.filter((item) => ELEMENT_GROUP_KEY[item.key] === activeFilter);

  return (
    <div className="space-y-4" data-testid="elements-tab">
      {/* filter chips */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={active}
                data-testid={`elements-filter-${chip.key}`}
                onClick={() => setActiveFilter(chip.key)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold border transition-all ${
                  active
                    ? 'border-[#002fa7] bg-[#002fa7] text-white'
                    : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#002fa7] hover:text-[#002fa7]'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <span className="shrink-0 text-[13px] text-[#6b7280]" data-testid="elements-count">
          {KNOWLEDGE_PAGE.countText.elements(ALL_ELEMENTS.length, filtered.length)}
        </span>
      </div>

      {/* grid — fixed 4 cols */}
      <div className="grid grid-cols-4 gap-4">
        {filtered.map((item) => {
          const detail = ELEMENT_DETAILS[item.key];
          if (!detail) return null;
          const groupLabel = ELEMENT_GROUP_LABEL[item.key] ?? '';
          return (
            <div
              key={item.key}
              className="rounded-xl border border-[#e5e7eb] bg-white p-4 space-y-3 transition-all hover:-translate-y-0.5 hover:shadow-md pw-shadow-soft"
              data-testid={`element-card-${item.key}`}
            >
              {/* header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[22px] shrink-0">{item.emoji}</span>
                  <span className="font-bold text-[13px] leading-snug text-[#111827]">{item.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="rounded-full border border-[#e5e7eb] bg-[#f9f9f9] px-2 py-0.5 text-[10px] font-medium text-[#6b7280]">
                    {groupLabel}
                  </span>
                  <button
                    type="button"
                    aria-label="收藏"
                    data-testid={`element-bookmark-${item.key}`}
                    onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#F6D300] hover:text-[#8a6a00]"
                  >
                    <span className="material-symbols-outlined text-[15px]" aria-hidden="true">bookmark</span>
                  </button>
                  <button
                    type="button"
                    aria-label="复制"
                    data-testid={`element-copy-${item.key}`}
                    onClick={() => {
                      void navigator.clipboard.writeText(item.label);
                      toast.success(KNOWLEDGE_PAGE.toasts.copied);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
                  >
                    <span className="material-symbols-outlined text-[15px]" aria-hidden="true">content_copy</span>
                  </button>
                </div>
              </div>

              {/* desc */}
              <p className="text-[12px] text-[#6b7280]">{detail.desc}</p>

              {/* techniques */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-[#111827]">使用技巧</p>
                <ol className="space-y-1">
                  {detail.techniques.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-[#6b7280]">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#f1f3f9] text-[10px] font-bold shrink-0 mt-0.5 text-[#002fa7]">
                        {i + 1}
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── OpeningTab ─────────────────────────────────────────────────────────────────
function OpeningTab() {
  const [search, setSearch] = useState('');

  const lowerQuery = search.trim().toLowerCase();
  const filtered = lowerQuery
    ? OPENING_FORMULAS.filter(
        (f) =>
          f.name.toLowerCase().includes(lowerQuery) ||
          f.formula.toLowerCase().includes(lowerQuery)
      )
    : OPENING_FORMULAS;

  return (
    <div className="space-y-4" data-testid="opening-tab">
      {/* search row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative">
          <span
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="text"
            placeholder={KNOWLEDGE_PAGE.searchPlaceholders.opening}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[320px] rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-2.5 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
            data-testid="opening-search"
          />
        </div>
        <span className="shrink-0 text-[13px] text-[#6b7280]" data-testid="opening-count">
          {KNOWLEDGE_PAGE.countText.opening(OPENING_FORMULAS.length, filtered.length)}
        </span>
      </div>

      {/* grid — fixed 4 cols */}
      <div className="grid grid-cols-4 gap-4">
        {filtered.map((f) => (
          <div
            key={f.num}
            className="rounded-xl border border-[#e5e7eb] bg-white p-4 space-y-3 transition-all hover:-translate-y-0.5 hover:shadow-md pw-shadow-soft"
            data-testid={`opening-card-${f.num}`}
          >
            {/* header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#002fa7] text-white text-[11px] font-bold shrink-0">
                  {f.num}
                </span>
                <span className="font-bold text-[13px] leading-snug text-[#111827]">{f.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="收藏"
                  data-testid={`opening-bookmark-${f.num}`}
                  onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#F6D300] hover:text-[#8a6a00]"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">bookmark</span>
                </button>
                <button
                  type="button"
                  aria-label="复制"
                  data-testid={`opening-copy-${f.num}`}
                  onClick={() => {
                    void navigator.clipboard.writeText(f.formula);
                    toast.success(KNOWLEDGE_PAGE.toasts.copied);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">content_copy</span>
                </button>
              </div>
            </div>

            {/* formula */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#6b7280]">公式</p>
              <p className="text-[12px] text-[#111827]">{f.formula}</p>
            </div>

            {/* example */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#6b7280]">示例</p>
              <blockquote className="text-[12px] text-[#6b7280] italic rounded-lg bg-[#f9f9f9] border border-[#e5e7eb] px-3 py-2">
                {f.example}
              </blockquote>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CoreTab ────────────────────────────────────────────────────────────────────
function CoreTab() {
  const [search, setSearch] = useState('');

  const lowerQuery = search.trim().toLowerCase();
  const filtered = lowerQuery
    ? CORE_FORMULAS.filter((f) => f.name.toLowerCase().includes(lowerQuery))
    : CORE_FORMULAS;

  return (
    <div className="space-y-4" data-testid="core-tab">
      {/* search row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative">
          <span
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="text"
            placeholder={KNOWLEDGE_PAGE.searchPlaceholders.core}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[320px] rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-2.5 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
            data-testid="core-search"
          />
        </div>
        <span className="shrink-0 text-[13px] text-[#6b7280]" data-testid="core-count">
          {KNOWLEDGE_PAGE.countText.core(CORE_FORMULAS.length, filtered.length)}
        </span>
      </div>

      {/* grid — fixed 4 cols */}
      <div className="grid grid-cols-4 gap-4">
        {filtered.map((f, i) => (
          <div
            key={f.name}
            className="rounded-xl border border-[#e5e7eb] bg-white p-4 space-y-3 transition-all hover:-translate-y-0.5 hover:shadow-md pw-shadow-soft"
            data-testid={`core-card-${i}`}
          >
            {/* header */}
            <div className="flex items-start justify-between gap-2">
              <span className="font-bold text-[13px] leading-snug text-[#111827] flex-1 min-w-0">
                {f.name}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="收藏"
                  data-testid={`core-bookmark-${i}`}
                  onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#F6D300] hover:text-[#8a6a00]"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">bookmark</span>
                </button>
                <button
                  type="button"
                  aria-label="复制"
                  data-testid={`core-copy-${i}`}
                  onClick={() => {
                    void navigator.clipboard.writeText(f.name);
                    toast.success(KNOWLEDGE_PAGE.toasts.copied);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">content_copy</span>
                </button>
              </div>
            </div>

            {/* flow chips */}
            <div className="flex items-center gap-1 flex-wrap">
              {f.flow.map((step, si) => (
                <div key={si} className="flex items-center gap-1">
                  <span className="rounded-md border border-[#c7d2fe] bg-[#eff4ff] px-2 py-0.5 text-[11px] font-medium text-[#002fa7]">
                    {step}
                  </span>
                  {si < f.flow.length - 1 && (
                    <span className="material-symbols-outlined text-[13px] text-[#002fa7] shrink-0" aria-hidden="true">
                      arrow_forward
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* example quote */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#6b7280]">实战案例</p>
              <blockquote className="text-[12px] text-[#6b7280] italic rounded-lg bg-[#f9f9f9] border border-[#e5e7eb] px-3 py-2">
                {f.example}
              </blockquote>
            </div>

            {/* generate btn */}
            <button
              type="button"
              data-testid={`core-generate-${i}`}
              onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.generate)}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#002fa7] text-white text-[12px] font-semibold hover:bg-[#001e73] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">auto_awesome</span>
              用这个公式生成文案
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Knowledge() {
  const [activeTab, setActiveTab] = useState<TabKey>('scripts');

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              更多
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              方法论
            </span>
          </div>
          <h1
            className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]"
            data-testid="knowledge-h1"
          >
            {KNOWLEDGE_PAGE.h1}
          </h1>
          <p
            className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]"
            data-testid="knowledge-subtitle"
          >
            {KNOWLEDGE_PAGE.subtitle}
          </p>
        </div>
      </header>

      {/* ── KPI 概览 ─────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {KPI_CARDS.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: '#fff', borderColor: kpi.borderColor }}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${kpi.color}18`, color: kpi.color }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{kpi.icon}</span>
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                {kpi.value}
                <span className="text-[15px] text-[#9ca3af]"> {kpi.unit}</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab 导航 ──────────────────────────────────────────── */}
      <div
        className="mb-6"
        data-testid="knowledge-tabs"
        role="tablist"
        aria-label="方法论分类"
      >
        <div className="flex items-center gap-2 border-b border-[#e5e7eb] pb-0">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`tab-btn-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`tab-panel-${tab.key}`}
                data-testid={tab.testid}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold transition-all border-b-2 -mb-px ${
                  active
                    ? 'border-[#002fa7] bg-[#002fa7]/[0.04] text-[#002fa7]'
                    : 'border-transparent text-[#6b7280] hover:text-[#111827] hover:border-[#c7d2fe]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab 内容 ──────────────────────────────────────────── */}
      <div className="mb-12">
        {activeTab === 'scripts' && (
          <div
            role="tabpanel"
            id="tab-panel-scripts"
            aria-labelledby="tab-btn-scripts"
            tabIndex={0}
            data-testid="tab-content-scripts"
          >
            <ScriptTab />
          </div>
        )}
        {activeTab === 'elements' && (
          <div
            role="tabpanel"
            id="tab-panel-elements"
            aria-labelledby="tab-btn-elements"
            tabIndex={0}
            data-testid="tab-content-elements"
          >
            <ElementsTab />
          </div>
        )}
        {activeTab === 'opening' && (
          <div
            role="tabpanel"
            id="tab-panel-opening"
            aria-labelledby="tab-btn-opening"
            tabIndex={0}
            data-testid="tab-content-opening"
          >
            <OpeningTab />
          </div>
        )}
        {activeTab === 'core' && (
          <div
            role="tabpanel"
            id="tab-panel-core"
            aria-labelledby="tab-btn-core"
            tabIndex={0}
            data-testid="tab-content-core"
          >
            <CoreTab />
          </div>
        )}
      </div>

      {/* ── 起承转合 Footer ────────────────────────────────────── */}
      <section className="space-y-4" data-testid="story-footer">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">
            auto_stories
          </span>
          <h2
            className="text-[18px] font-bold text-[#111827]"
            data-testid="story-footer-title"
          >
            {STORY_FOOTER_TITLE}
          </h2>
          <span className="text-[12px] text-[#9ca3af]">· 短视频文案四步法</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {STORY_STAGES.map((stage) => {
            const accent = STAGE_ACCENT[stage.key] ?? { color: '#002fa7', bg: '#e0e7ff', border: '#c7d2fe' };
            return (
              <div
                key={stage.key}
                className="rounded-xl border p-5 space-y-2 transition-all hover:-translate-y-0.5 hover:shadow-md pw-shadow-soft"
                style={{ borderColor: accent.border, backgroundColor: accent.bg }}
                data-testid={`story-stage-${stage.key}`}
              >
                <p
                  className="font-bold text-[13px]"
                  style={{ color: accent.color }}
                  data-testid={`story-stage-label-${stage.key}`}
                >
                  {stage.label}
                </p>
                <p className="text-[12px] text-[#444653] leading-relaxed">{stage.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </PioneerLayout>
  );
}
