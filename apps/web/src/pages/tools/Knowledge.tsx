/**
 * /knowledge 页面 — AIP文案方法论
 * IKB 红蓝紫渐变体系重构 · IKBLayout 外壳
 * 4 tab(20类脚本 / 20大爆款 / 开头公式 / 核心公式) + 起承转合 footer
 * 逻辑零改动 · testid 全保留 · 禁断点 · 禁 line-clamp
 */

import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
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

// KPI data — IKB 三主色轮转: 蓝/玫红/紫/蓝
const KPI_CARDS = [
  { label: '脚本类型', value: `${SCRIPT_TYPES.length}`, unit: '类', icon: 'chat',      color: C.ikb,      bg: `${C.ikb}10`,      borderColor: `${C.ikb}28`      },
  { label: '爆款元素', value: '20',                       unit: '个', icon: 'bolt',      color: C.burgundy, bg: `${C.burgundy}10`, borderColor: `${C.burgundy}28` },
  { label: '开头公式', value: `${OPENING_FORMULAS.length}`, unit: '个', icon: 'menu_book', color: C.accent3,  bg: `${C.accent3}10`,  borderColor: `${C.accent3}28`  },
  { label: '核心公式', value: `${CORE_FORMULAS.length}`,  unit: '个', icon: 'lightbulb', color: C.ikb,      bg: `${C.ikb}10`,      borderColor: `${C.ikb}28`      },
];

// Story stage accent colors (IKB 三主色轮转: 起→玫红 承→紫 转→蓝 合→蓝)
const STAGE_ACCENT: Record<string, { color: string; bg: string; border: string }> = {
  qi:    { color: C.burgundy, bg: `${C.burgundy}10`, border: `${C.burgundy}28` },
  cheng: { color: C.accent3,  bg: `${C.accent3}10`,  border: `${C.accent3}28`  },
  zhuan: { color: C.ikb,      bg: `${C.ikb}10`,      border: `${C.ikb}28`      },
  he:    { color: C.ikb,      bg: `${C.ikb}08`,      border: `${C.ikb}20`      },
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
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
            style={{ color: '#6b7280' }}
            aria-hidden={true}
          >
            search
          </span>
          <input
            type="text"
            placeholder={KNOWLEDGE_PAGE.searchPlaceholders.scripts}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ikb-input w-[320px] rounded-lg py-2.5 pl-10 pr-3 text-[14px] transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
            style={{ border: `1px solid ${C.line}`, background: C.base, color: C.ink, fontFamily: F.cn }}
            data-testid="script-search"
          />
        </div>
        <span className="shrink-0 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }} data-testid="script-count">
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
              className="rounded-xl border p-4 space-y-3 ikb-hovercard"
              style={{ borderColor: C.line, background: C.paper }}
              data-testid={`script-card-${s.key}`}
            >
              {/* header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[13px] font-bold shrink-0"
                    style={{ background: `${C.ikb}12`, color: C.ikb }}
                    data-testid={`script-chip-${s.key}`}
                  >
                    {s.emoji}
                  </span>
                  <span className="font-bold text-[13px] leading-snug" style={{ color: C.ink, fontFamily: F.cn }}>{s.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label="收藏"
                    data-testid={`script-bookmark-${s.key}`}
                    onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                    className="ikb-focusring flex h-7 w-7 items-center justify-center rounded-lg border transition-colors hover:border-[#7A3BE0] hover:text-[#7A3BE0]"
                    style={{ borderColor: C.line, color: '#6b7280' }}
                  >
                    <span className="material-symbols-outlined text-[15px]" aria-hidden={true}>bookmark</span>
                  </button>
                  <button
                    type="button"
                    aria-label="复制"
                    data-testid={`script-copy-${s.key}`}
                    onClick={() => {
                      void navigator.clipboard.writeText(s.label);
                      toast.success(KNOWLEDGE_PAGE.toasts.copied);
                    }}
                    className="ikb-focusring flex h-7 w-7 items-center justify-center rounded-lg border transition-colors hover:border-[#2B53E6] hover:text-[#2B53E6]"
                    style={{ borderColor: C.line, color: '#6b7280' }}
                  >
                    <span className="material-symbols-outlined text-[15px]" aria-hidden={true}>content_copy</span>
                  </button>
                </div>
              </div>

              {/* desc */}
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{s.desc}</p>

              {/* methodology */}
              <p className="text-[11px] leading-relaxed" style={{ color: '#6b7280', fontFamily: F.cn }}>{s.methodology}</p>

              {/* expand cases */}
              <button
                type="button"
                data-testid={`script-cases-${s.key}`}
                onClick={() => setExpanded((v) => ({ ...v, [s.key]: !v[s.key] }))}
                className="ikb-focusring flex items-center gap-1 text-[11px] transition-colors w-full hover:text-[#2B53E6]"
                style={{ color: '#6b7280', fontFamily: F.cn }}
              >
                <span>实战案例</span>
                <span
                  className={`material-symbols-outlined text-[13px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  aria-hidden={true}
                >
                  expand_more
                </span>
              </button>
              {isExpanded && (
                <p className="text-[11px] pl-2 border-l-2" style={{ color: '#6b7280', borderColor: C.line, fontFamily: F.cn }}>
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
        <div className="flex items-center gap-2" role="radiogroup" aria-label="爆款元素分类筛选">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                role="radio"
                aria-checked={active}
                data-testid={`elements-filter-${chip.key}`}
                onClick={() => setActiveFilter(chip.key)}
                className="ikb-focusring rounded-full px-3 py-1.5 text-[12px] font-semibold border transition-all"
                style={active
                  ? { borderColor: C.ikb, background: C.ikb, color: '#fff', fontFamily: F.cn }
                  : { borderColor: C.line, color: '#6b7280', background: 'transparent', fontFamily: F.cn }
                }
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <span className="shrink-0 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }} data-testid="elements-count">
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
              className="rounded-xl border p-4 space-y-3 ikb-hovercard"
              style={{ borderColor: C.line, background: C.paper }}
              data-testid={`element-card-${item.key}`}
            >
              {/* header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[22px] shrink-0">{item.emoji}</span>
                  <span className="font-bold text-[13px] leading-snug" style={{ color: C.ink, fontFamily: F.cn }}>{item.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: C.base, color: '#6b7280', border: `1px solid ${C.line}`, fontFamily: F.cn }}
                  >
                    {groupLabel}
                  </span>
                  <button
                    type="button"
                    aria-label="收藏"
                    data-testid={`element-bookmark-${item.key}`}
                    onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                    className="ikb-focusring flex h-7 w-7 items-center justify-center rounded-lg border transition-colors hover:border-[#7A3BE0] hover:text-[#7A3BE0]"
                    style={{ borderColor: C.line, color: '#6b7280' }}
                  >
                    <span className="material-symbols-outlined text-[15px]" aria-hidden={true}>bookmark</span>
                  </button>
                  <button
                    type="button"
                    aria-label="复制"
                    data-testid={`element-copy-${item.key}`}
                    onClick={() => {
                      void navigator.clipboard.writeText(item.label);
                      toast.success(KNOWLEDGE_PAGE.toasts.copied);
                    }}
                    className="ikb-focusring flex h-7 w-7 items-center justify-center rounded-lg border transition-colors hover:border-[#2B53E6] hover:text-[#2B53E6]"
                    style={{ borderColor: C.line, color: '#6b7280' }}
                  >
                    <span className="material-symbols-outlined text-[15px]" aria-hidden={true}>content_copy</span>
                  </button>
                </div>
              </div>

              {/* desc */}
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{detail.desc}</p>

              {/* techniques */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold" style={{ color: C.ink, fontFamily: F.cn }}>使用技巧</p>
                <ol className="space-y-1">
                  {detail.techniques.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0 mt-0.5"
                        style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
                      >
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
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
            style={{ color: '#6b7280' }}
            aria-hidden={true}
          >
            search
          </span>
          <input
            type="text"
            placeholder={KNOWLEDGE_PAGE.searchPlaceholders.opening}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ikb-input w-[320px] rounded-lg py-2.5 pl-10 pr-3 text-[14px] transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
            style={{ border: `1px solid ${C.line}`, background: C.base, color: C.ink, fontFamily: F.cn }}
            data-testid="opening-search"
          />
        </div>
        <span className="shrink-0 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }} data-testid="opening-count">
          {KNOWLEDGE_PAGE.countText.opening(OPENING_FORMULAS.length, filtered.length)}
        </span>
      </div>

      {/* grid — fixed 4 cols */}
      <div className="grid grid-cols-4 gap-4">
        {filtered.map((f) => (
          <div
            key={f.num}
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: C.line, background: C.paper }}
            data-testid={`opening-card-${f.num}`}
          >
            {/* header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-[11px] font-bold shrink-0"
                  style={{ background: C.ikb, fontFamily: F.mono }}
                >
                  {f.num}
                </span>
                <span className="font-bold text-[13px] leading-snug" style={{ color: C.ink, fontFamily: F.cn }}>{f.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="收藏"
                  data-testid={`opening-bookmark-${f.num}`}
                  onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                  className="ikb-focusring flex h-7 w-7 items-center justify-center rounded-lg border transition-colors hover:border-[#7A3BE0] hover:text-[#7A3BE0]"
                  style={{ borderColor: C.line, color: '#6b7280' }}
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden={true}>bookmark</span>
                </button>
                <button
                  type="button"
                  aria-label="复制"
                  data-testid={`opening-copy-${f.num}`}
                  onClick={() => {
                    void navigator.clipboard.writeText(f.formula);
                    toast.success(KNOWLEDGE_PAGE.toasts.copied);
                  }}
                  className="ikb-focusring flex h-7 w-7 items-center justify-center rounded-lg border transition-colors hover:border-[#2B53E6] hover:text-[#2B53E6]"
                  style={{ borderColor: C.line, color: '#6b7280' }}
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden={true}>content_copy</span>
                </button>
              </div>
            </div>

            {/* formula */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold" style={{ color: '#6b7280', fontFamily: F.cn }}>公式</p>
              <p className="text-[12px]" style={{ color: C.ink, fontFamily: F.cn }}>{f.formula}</p>
            </div>

            {/* example */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold" style={{ color: '#6b7280', fontFamily: F.cn }}>示例</p>
              <blockquote
                className="text-[12px] italic rounded-lg px-3 py-2"
                style={{ color: '#6b7280', background: C.base, border: `1px solid ${C.line}`, fontFamily: F.cn }}
              >
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
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
            style={{ color: '#6b7280' }}
            aria-hidden={true}
          >
            search
          </span>
          <input
            type="text"
            placeholder={KNOWLEDGE_PAGE.searchPlaceholders.core}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ikb-input w-[320px] rounded-lg py-2.5 pl-10 pr-3 text-[14px] transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
            style={{ border: `1px solid ${C.line}`, background: C.base, color: C.ink, fontFamily: F.cn }}
            data-testid="core-search"
          />
        </div>
        <span className="shrink-0 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }} data-testid="core-count">
          {KNOWLEDGE_PAGE.countText.core(CORE_FORMULAS.length, filtered.length)}
        </span>
      </div>

      {/* grid — fixed 4 cols */}
      <div className="grid grid-cols-4 gap-4">
        {filtered.map((f, i) => (
          <div
            key={f.name}
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: C.line, background: C.paper }}
            data-testid={`core-card-${i}`}
          >
            {/* header */}
            <div className="flex items-start justify-between gap-2">
              <span className="font-bold text-[13px] leading-snug flex-1 min-w-0" style={{ color: C.ink, fontFamily: F.cn }}>
                {f.name}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="收藏"
                  data-testid={`core-bookmark-${i}`}
                  onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                  className="ikb-focusring flex h-7 w-7 items-center justify-center rounded-lg border transition-colors hover:border-[#7A3BE0] hover:text-[#7A3BE0]"
                  style={{ borderColor: C.line, color: '#6b7280' }}
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden={true}>bookmark</span>
                </button>
                <button
                  type="button"
                  aria-label="复制"
                  data-testid={`core-copy-${i}`}
                  onClick={() => {
                    void navigator.clipboard.writeText(f.name);
                    toast.success(KNOWLEDGE_PAGE.toasts.copied);
                  }}
                  className="ikb-focusring flex h-7 w-7 items-center justify-center rounded-lg border transition-colors hover:border-[#2B53E6] hover:text-[#2B53E6]"
                  style={{ borderColor: C.line, color: '#6b7280' }}
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden={true}>content_copy</span>
                </button>
              </div>
            </div>

            {/* flow chips — IKB 三主色轮转 */}
            <div className="flex items-center gap-1 flex-wrap">
              {f.flow.map((step, si) => {
                // 轮转 [C.ikb, C.burgundy, C.accent3]
                const chipColors = [
                  { border: `${C.ikb}40`,      bg: `${C.ikb}0c`,      text: C.ikb      },
                  { border: `${C.burgundy}40`, bg: `${C.burgundy}0c`, text: C.burgundy },
                  { border: `${C.accent3}40`,  bg: `${C.accent3}0c`,  text: C.accent3  },
                ] as const;
                const cp = chipColors[si % chipColors.length]!;
                return (
                  <div key={si} className="flex items-center gap-1">
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                      style={{ border: `1px solid ${cp.border}`, background: cp.bg, color: cp.text, fontFamily: F.mono }}
                    >
                      {step}
                    </span>
                    {si < f.flow.length - 1 && (
                      <span className="material-symbols-outlined text-[13px] shrink-0" style={{ color: C.ikb }} aria-hidden={true}>
                        arrow_forward
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* example quote */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold" style={{ color: '#6b7280', fontFamily: F.cn }}>实战案例</p>
              <blockquote
                className="text-[12px] italic rounded-lg px-3 py-2"
                style={{ color: '#6b7280', background: C.base, border: `1px solid ${C.line}`, fontFamily: F.cn }}
              >
                {f.example}
              </blockquote>
            </div>

            {/* generate btn */}
            <button
              type="button"
              data-testid={`core-generate-${i}`}
              onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.generate)}
              className="ikb-gradbtn ikb-focusring flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-white text-[12px] font-semibold transition-all active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: F.cn }}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>auto_awesome</span>
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
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
            >
              更多
            </span>
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${C.accent3}50`, background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}
            >
              方法论
            </span>
          </div>
          <h1
            className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight"
            style={{ fontFamily: F.display }}
            data-testid="knowledge-h1"
          >
            {KNOWLEDGE_PAGE.h1}
          </h1>
          <p
            className="mt-2 max-w-[820px] text-[16px] leading-relaxed"
            style={{ color: '#5A6173', fontFamily: F.cn }}
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
            className="rounded-xl border p-5 ikb-hovercard"
            style={{ backgroundColor: C.paper, borderColor: kpi.borderColor }}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: kpi.bg, color: kpi.color }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>{kpi.icon}</span>
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                {kpi.value}
                <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> {kpi.unit}</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{kpi.label}</p>
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
        <div className="flex items-center gap-2 pb-0" style={{ borderBottom: `1px solid ${C.line}` }}>
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
                className="ikb-focusring flex items-center gap-2 px-5 py-3 text-[13px] font-semibold transition-all border-b-2 -mb-px"
                style={active
                  ? { borderBottomColor: C.ikb, background: `${C.ikb}06`, color: C.ikb, fontFamily: F.cn }
                  : { borderBottomColor: 'transparent', color: '#6b7280', fontFamily: F.cn }
                }
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>{tab.icon}</span>
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
          <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>
            auto_stories
          </span>
          <h2
            className="text-[18px] font-bold"
            style={{ color: C.ink, fontFamily: F.cn }}
            data-testid="story-footer-title"
          >
            {STORY_FOOTER_TITLE}
          </h2>
          <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· 短视频文案四步法</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {STORY_STAGES.map((stage) => {
            const accent = STAGE_ACCENT[stage.key] ?? { color: C.ikb, bg: `${C.ikb}10`, border: `${C.ikb}28` };
            return (
              <div
                key={stage.key}
                className="rounded-xl border p-5 space-y-2 ikb-hovercard"
                style={{ borderColor: accent.border, backgroundColor: accent.bg }}
                data-testid={`story-stage-${stage.key}`}
              >
                <p
                  className="font-bold text-[13px]"
                  style={{ color: accent.color, fontFamily: F.cn }}
                  data-testid={`story-stage-label-${stage.key}`}
                >
                  {stage.label}
                </p>
                <p className="text-[12px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{stage.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </IKBLayout>
  );
}
