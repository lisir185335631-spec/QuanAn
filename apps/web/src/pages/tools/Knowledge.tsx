/**
 * /knowledge 页面 — AIP文案方法论
 * 液态玻璃皮 · LiquidShell 外壳
 * 4 tab(20类脚本 / 20大爆款 / 开头公式 / 核心公式) + 起承转合 footer
 * 逻辑零改动 · testid 全保留 · 禁断点 · 禁 line-clamp
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
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

// KPI data — 液态玻璃冷蓝体系轮转
const KPI_CARDS = [
  { label: '脚本类型', value: `${SCRIPT_TYPES.length}`, unit: '类', icon: 'chat',      color: C.ikb,    bg: 'rgba(168,197,224,0.18)' },
  { label: '爆款元素', value: '20',                       unit: '个', icon: 'bolt',      color: C.yellow, bg: 'rgba(228,238,255,0.18)' },
  { label: '开头公式', value: `${OPENING_FORMULAS.length}`, unit: '个', icon: 'menu_book', color: C.accent3, bg: 'rgba(168,197,224,0.18)' },
  { label: '核心公式', value: `${CORE_FORMULAS.length}`,  unit: '个', icon: 'lightbulb', color: C.ikb,    bg: 'rgba(168,197,224,0.18)' },
];

// Story stage accent colors — 液态玻璃冷蓝体系
const STAGE_ACCENT: Record<string, { color: string; bg: string; border: string }> = {
  qi:    { color: C.yellow,  bg: 'rgba(228,238,255,0.14)', border: 'rgba(228,238,255,0.30)' },
  cheng: { color: C.accent3, bg: 'rgba(168,197,224,0.14)', border: 'rgba(168,197,224,0.30)' },
  zhuan: { color: C.ikb,     bg: 'rgba(168,197,224,0.14)', border: 'rgba(168,197,224,0.30)' },
  he:    { color: C.ikb,     bg: 'rgba(168,197,224,0.10)', border: 'rgba(168,197,224,0.22)' },
};

// ── Sub-components (inline) ────────────────────────────────────────────────────

// ── ScriptTab ──────────────────────────────────────────────────────────────────
function ScriptTab() {
  const [search, setSearch] = useState('');

  const lowerQuery = search.trim().toLowerCase();
  const filtered = lowerQuery
    ? SCRIPT_TYPES.filter(
        (s) =>
          s.label.toLowerCase().includes(lowerQuery) ||
          s.desc.toLowerCase().includes(lowerQuery)
      )
    : SCRIPT_TYPES;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="script-tab">
      {/* search row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div
          className="lg-glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 12,
            padding: '8px 14px',
            width: 440,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: C.ikb, flexShrink: 0 }}
            aria-hidden={true}
          >
            search
          </span>
          <input
            type="text"
            placeholder={KNOWLEDGE_PAGE.searchPlaceholders.scripts}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: C.ink,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
            data-testid="script-search"
          />
        </div>
        <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }} data-testid="script-count">
          {KNOWLEDGE_PAGE.countText.scripts(SCRIPT_TYPES.length, filtered.length)}
        </span>
      </div>

      {/* grid — fixed 4 cols */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {filtered.map((s) => (
          <Item key={s.key}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
              data-testid={`script-card-${s.key}`}
            >
              {/* header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(168,197,224,0.22)',
                      color: C.ikb,
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                    data-testid={`script-chip-${s.key}`}
                  >
                    {s.emoji}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    aria-label="收藏"
                    data-testid={`script-bookmark-${s.key}`}
                    onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                    style={{
                      display: 'flex',
                      height: 28,
                      width: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: 'transparent',
                      border: `0.5px solid ${C.line}`,
                      color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.accent3; (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent3; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden={true}>bookmark</span>
                  </button>
                  <button
                    type="button"
                    aria-label="复制"
                    data-testid={`script-copy-${s.key}`}
                    onClick={() => {
                      void navigator.clipboard.writeText(s.label);
                      toast.success(KNOWLEDGE_PAGE.toasts.copied);
                    }}
                    style={{
                      display: 'flex',
                      height: 28,
                      width: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: 'transparent',
                      border: `0.5px solid ${C.line}`,
                      color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden={true}>content_copy</span>
                  </button>
                </div>
              </div>

              {/* desc */}
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: F.cn, margin: 0 }}>{s.desc}</p>

              {/* methodology */}
              <p style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>{s.methodology}</p>

              {/* expand cases — disabled (no data yet) */}
              <button
                type="button"
                data-testid={`script-cases-${s.key}`}
                disabled
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  cursor: 'not-allowed',
                  opacity: 0.4,
                  color: 'rgba(255,255,255,0.84)',
                  fontFamily: F.cn,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                }}
              >
                <span>实战案例</span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: F.cn }}>· 敬请期待</span>
              </button>
            </motion.div>
          </Item>
        ))}
      </RevealGroup>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="elements-tab">
      {/* filter chips */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} role="radiogroup" aria-label="爆款元素分类筛选">
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
                style={{
                  borderRadius: 9999,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: `0.5px solid ${active ? C.ikb : C.line}`,
                  background: active ? 'rgba(168,197,224,0.28)' : 'transparent',
                  color: active ? C.ikb : 'rgba(255,255,255,0.84)',
                  fontFamily: F.cn,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }} data-testid="elements-count">
          {KNOWLEDGE_PAGE.countText.elements(ALL_ELEMENTS.length, filtered.length)}
        </span>
      </div>

      {/* grid — fixed 4 cols */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {filtered.map((item) => {
          const detail = ELEMENT_DETAILS[item.key];
          if (!detail) return null;
          const groupLabel = ELEMENT_GROUP_LABEL[item.key] ?? '';
          return (
            <Item key={item.key}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
                data-testid={`element-card-${item.key}`}
              >
                {/* header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span
                      style={{
                        borderRadius: 9999,
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 500,
                        background: 'rgba(168,197,224,0.15)',
                        color: 'rgba(255,255,255,0.84)',
                        border: `0.5px solid ${C.line}`,
                        fontFamily: F.cn,
                      }}
                    >
                      {groupLabel}
                    </span>
                    <button
                      type="button"
                      aria-label="收藏"
                      data-testid={`element-bookmark-${item.key}`}
                      onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                      style={{
                        display: 'flex',
                        height: 28,
                        width: 28,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        background: 'transparent',
                        border: `0.5px solid ${C.line}`,
                        color: 'rgba(255,255,255,0.8)',
                        cursor: 'pointer',
                        transition: 'color 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.accent3; (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent3; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden={true}>bookmark</span>
                    </button>
                    <button
                      type="button"
                      aria-label="复制"
                      data-testid={`element-copy-${item.key}`}
                      onClick={() => {
                        void navigator.clipboard.writeText(item.label);
                        toast.success(KNOWLEDGE_PAGE.toasts.copied);
                      }}
                      style={{
                        display: 'flex',
                        height: 28,
                        width: 28,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        background: 'transparent',
                        border: `0.5px solid ${C.line}`,
                        color: 'rgba(255,255,255,0.8)',
                        cursor: 'pointer',
                        transition: 'color 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden={true}>content_copy</span>
                    </button>
                  </div>
                </div>

                {/* desc */}
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: F.cn, margin: 0 }}>{detail.desc}</p>

                {/* techniques */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>使用技巧</p>
                  <ol style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: 0, padding: 0, listStyle: 'none' }}>
                    {detail.techniques.map((t, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: F.cn }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                            marginTop: 2,
                            background: 'rgba(168,197,224,0.22)',
                            color: C.ikb,
                            fontFamily: F.mono,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            </Item>
          );
        })}
      </RevealGroup>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="opening-tab">
      {/* search row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div
          className="lg-glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 12,
            padding: '8px 14px',
            width: 440,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: C.ikb, flexShrink: 0 }}
            aria-hidden={true}
          >
            search
          </span>
          <input
            type="text"
            placeholder={KNOWLEDGE_PAGE.searchPlaceholders.opening}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: C.ink,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
            data-testid="opening-search"
          />
        </div>
        <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }} data-testid="opening-count">
          {KNOWLEDGE_PAGE.countText.opening(OPENING_FORMULAS.length, filtered.length)}
        </span>
      </div>

      {/* grid — fixed 4 cols */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {filtered.map((f) => (
          <Item key={f.num}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
              data-testid={`opening-card-${f.num}`}
            >
              {/* header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(168,197,224,0.6), rgba(120,160,220,0.4))',
                      fontFamily: F.mono,
                      textShadow: C.textShadow,
                    }}
                  >
                    {f.num}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{f.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    aria-label="收藏"
                    data-testid={`opening-bookmark-${f.num}`}
                    onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                    style={{
                      display: 'flex',
                      height: 28,
                      width: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: 'transparent',
                      border: `0.5px solid ${C.line}`,
                      color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.accent3; (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent3; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden={true}>bookmark</span>
                  </button>
                  <button
                    type="button"
                    aria-label="复制"
                    data-testid={`opening-copy-${f.num}`}
                    onClick={() => {
                      void navigator.clipboard.writeText(f.formula);
                      toast.success(KNOWLEDGE_PAGE.toasts.copied);
                    }}
                    style={{
                      display: 'flex',
                      height: 28,
                      width: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: 'transparent',
                      border: `0.5px solid ${C.line}`,
                      color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden={true}>content_copy</span>
                  </button>
                </div>
              </div>

              {/* formula */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>公式</p>
                <p style={{ fontSize: 12, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{f.formula}</p>
              </div>

              {/* example */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>示例</p>
                <blockquote
                  style={{
                    fontSize: 12,
                    fontStyle: 'italic',
                    borderRadius: 10,
                    padding: '8px 12px',
                    color: 'rgba(255,255,255,0.65)',
                    background: 'rgba(255,255,255,0.06)',
                    border: `0.5px solid ${C.line}`,
                    fontFamily: F.cn,
                    margin: 0,
                  }}
                >
                  {f.example}
                </blockquote>
              </div>
            </motion.div>
          </Item>
        ))}
      </RevealGroup>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="core-tab">
      {/* search row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div
          className="lg-glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 12,
            padding: '8px 14px',
            width: 440,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: C.ikb, flexShrink: 0 }}
            aria-hidden={true}
          >
            search
          </span>
          <input
            type="text"
            placeholder={KNOWLEDGE_PAGE.searchPlaceholders.core}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: C.ink,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
            data-testid="core-search"
          />
        </div>
        <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }} data-testid="core-count">
          {KNOWLEDGE_PAGE.countText.core(CORE_FORMULAS.length, filtered.length)}
        </span>
      </div>

      {/* grid — fixed 4 cols */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {filtered.map((f, i) => (
          <Item key={f.name}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
              data-testid={`core-card-${i}`}
            >
              {/* header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, flex: 1, minWidth: 0, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  {f.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    aria-label="收藏"
                    data-testid={`core-bookmark-${i}`}
                    onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
                    style={{
                      display: 'flex',
                      height: 28,
                      width: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: 'transparent',
                      border: `0.5px solid ${C.line}`,
                      color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.accent3; (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent3; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden={true}>bookmark</span>
                  </button>
                  <button
                    type="button"
                    aria-label="复制"
                    data-testid={`core-copy-${i}`}
                    onClick={() => {
                      void navigator.clipboard.writeText(f.name);
                      toast.success(KNOWLEDGE_PAGE.toasts.copied);
                    }}
                    style={{
                      display: 'flex',
                      height: 28,
                      width: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: 'transparent',
                      border: `0.5px solid ${C.line}`,
                      color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden={true}>content_copy</span>
                  </button>
                </div>
              </div>

              {/* flow chips — 液态玻璃冷蓝三色轮转 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {f.flow.map((step, si) => {
                  // 轮转 [ikb/冷蓝, yellow/冰蓝, accent3/冷蓝]
                  const chipColors = [
                    { border: 'rgba(168,197,224,0.5)', bg: 'rgba(168,197,224,0.12)', text: C.ikb      },
                    { border: 'rgba(228,238,255,0.5)', bg: 'rgba(228,238,255,0.12)', text: C.yellow   },
                    { border: 'rgba(168,197,224,0.5)', bg: 'rgba(168,197,224,0.12)', text: C.accent3  },
                  ] as const;
                  const cp = chipColors[si % chipColors.length]!;
                  return (
                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span
                        style={{
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 500,
                          border: `0.5px solid ${cp.border}`,
                          background: cp.bg,
                          color: cp.text,
                          fontFamily: F.mono,
                        }}
                      >
                        {step}
                      </span>
                      {si < f.flow.length - 1 && (
                        <span className="material-symbols-outlined" style={{ fontSize: 13, flexShrink: 0, color: C.ikb }} aria-hidden={true}>
                          arrow_forward
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* example quote */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>实战案例</p>
                <blockquote
                  style={{
                    fontSize: 12,
                    fontStyle: 'italic',
                    borderRadius: 10,
                    padding: '8px 12px',
                    color: 'rgba(255,255,255,0.65)',
                    background: 'rgba(255,255,255,0.06)',
                    border: `0.5px solid ${C.line}`,
                    fontFamily: F.cn,
                    margin: 0,
                  }}
                >
                  {f.example}
                </blockquote>
              </div>

              {/* generate btn */}
              <button
                type="button"
                data-testid={`core-generate-${i}`}
                onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.generate)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  width: '100%',
                  padding: '8px 0',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: F.cn,
                  background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.35))',
                  border: `0.5px solid rgba(168,197,224,0.4)`,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  textShadow: C.textShadow,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.82'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>auto_awesome</span>
                用这个公式生成文案
              </button>
            </motion.div>
          </Item>
        ))}
      </RevealGroup>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Knowledge() {
  const [activeTab, setActiveTab] = useState<TabKey>('scripts');

  return (
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ marginBottom: 48, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <div style={{ flexShrink: 0 }}>
          {/* chip 标签行 */}
          <Reveal style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                borderRadius: 9999,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(12px)',
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.ink,
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              更多
            </span>
            <span
              style={{
                borderRadius: 9999,
                border: `0.5px solid rgba(168,197,224,0.55)`,
                background: 'rgba(168,197,224,0.18)',
                backdropFilter: 'blur(12px)',
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.ikb,
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              方法论
            </span>
          </Reveal>
          {/* 主标题 — 冷蓝渐变字 */}
          <h1
            data-testid="knowledge-h1"
            style={{
              whiteSpace: 'nowrap',
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontFamily: F.display,
              margin: 0,
              background: C.grad,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              textShadow: 'none',
            }}
          >
            {KNOWLEDGE_PAGE.h1}
          </h1>
          <p
            data-testid="knowledge-subtitle"
            style={{
              marginTop: 10,
              maxWidth: 820,
              fontSize: 16,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.75)',
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            {KNOWLEDGE_PAGE.subtitle}
          </p>
        </div>
      </header>

      {/* ── KPI 概览 ─────────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 44 }}>
        {KPI_CARDS.map((kpi) => (
          <Item key={kpi.label} style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    display: 'flex',
                    height: 38,
                    width: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: kpi.bg,
                    color: kpi.color,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>{kpi.icon}</span>
                </span>
              </div>
              <p style={{ marginTop: 14, fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                {kpi.value}
                <span style={{ marginLeft: 4, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}> {kpi.unit}</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{kpi.label}</p>
            </motion.div>
          </Item>
        ))}
      </RevealGroup>

      {/* ── Tab 导航 ──────────────────────────────────────────── */}
      <div
        data-testid="knowledge-tabs"
        role="tablist"
        aria-label="方法论分类"
        style={{ marginBottom: 24 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: `0.5px solid ${C.line}`,
          }}
        >
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: F.cn,
                  background: active ? 'rgba(168,197,224,0.12)' : 'transparent',
                  color: active ? C.ikb : 'rgba(255,255,255,0.84)',
                  border: 'none',
                  borderBottom: active ? `2px solid ${C.ikb}` : '2px solid transparent',
                  marginBottom: -1,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textShadow: active ? C.textShadow : 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab 内容 ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 48 }}>
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
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="story-footer">
        <Reveal style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span
            style={{
              display: 'flex',
              height: 38,
              width: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: 'rgba(168,197,224,0.22)',
              color: C.ikb,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>auto_stories</span>
          </span>
          <h2
            style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}
            data-testid="story-footer-title"
          >
            {STORY_FOOTER_TITLE}
          </h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>· 短视频文案四步法</span>
        </Reveal>
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {STORY_STAGES.map((stage) => {
            const accent = STAGE_ACCENT[stage.key] ?? { color: C.ikb, bg: 'rgba(168,197,224,0.14)', border: 'rgba(168,197,224,0.30)' };
            return (
              <Item key={stage.key}>
                <motion.div
                  className="lg-glass lg-spec"
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{ borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}
                  data-testid={`story-stage-${stage.key}`}
                >
                  <p
                    style={{ fontWeight: 700, fontSize: 13, color: accent.color, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
                    data-testid={`story-stage-label-${stage.key}`}
                  >
                    {stage.label}
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', fontFamily: F.cn, margin: 0 }}>{stage.desc}</p>
                </motion.div>
              </Item>
            );
          })}
        </RevealGroup>
      </section>
    </LiquidShell>
  );
}
