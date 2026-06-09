/**
 * MyTopics.tsx — /my-topics 我的选题库 · 液态玻璃 IKB 体系
 * Phase-2: 接真 tRPC · TopicCard + TopicList · source 过滤对齐后端 · KPI 真数据
 * 逻辑零回退 · testid 全保留 · 4 个 my-topics 组件 inline 重写(禁旧 import)
 */
import { keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import {
  MY_TOPICS_BACK,
  MY_TOPICS_BACK_HREF,
  MY_TOPICS_BREADCRUMB,
  MY_TOPICS_COPY_ALL,
  MY_TOPICS_DOWNLOAD_TXT,
  MY_TOPICS_EMPTY_CTA,
  MY_TOPICS_EMPTY_DESC,
  MY_TOPICS_EMPTY_TITLE,
  MY_TOPICS_FILTERS,
  MY_TOPICS_H1,
  MY_TOPICS_SEARCH_PLACEHOLDER,
  MY_TOPICS_SUBTITLE,
  MY_TOPICS_TOAST_COPY,
  MY_TOPICS_TOAST_DOWNLOAD,
  MY_TOPICS_TOAST_COPY_SUCCESS,
  MY_TOPICS_TOAST_DOWNLOAD_SUCCESS,
  MY_TOPICS_CTA_HREF,
  type TopicFilterKey,
} from '@/lib/constants/myTopics';
import { trpc } from '@/lib/trpc';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MyTopicItem {
  id: string;
  title: string;
  source: 'step5' | 'trending' | 'manual';
  industry: string | null;
  platform: string | null;
  createdAt: Date | string;
  topicId?: number;
  trendingItemId?: number;
}

// ─── Filter icon map (Material Symbols · 禁 lucide) ──────────────────────────

const FILTER_ICON: Record<TopicFilterKey, string> = {
  all:      'filter_list',
  step5:    'auto_awesome',
  trending: 'local_fire_department',
  manual:   'bookmark_added',
};

// ─── IKB 三主色轮转 ────────────────────────────────────────────────────────────
// C.ikb = '#d8e8ff'(hex · alpha 拼接有效)
// C.burgundy = rgba() · C.accent3 = '#d8e8ff'(同 ikb)
const IKB_CHIP_COLORS = [
  { border: `${C.ikb}40`,     bg: `${C.ikb}0d`,     text: C.ikb },
  { border: `${C.ikb}40`,     bg: `${C.ikb}0d`,     text: 'rgba(255,255,255,0.88)' },
  { border: `${C.accent3}40`, bg: `${C.accent3}0d`,  text: C.accent3 },
] as const;

// ─── Source badge helpers ─────────────────────────────────────────────────────

function getSourceLabel(source: MyTopicItem['source']): string {
  if (source === 'step5') return '选题策划';
  if (source === 'trending') return '热点收藏';
  return '手动添加';
}

function getSourceColor(source: MyTopicItem['source']): { bg: string; text: string; border: string } {
  // C.ikb = hex → alpha 拼接有效
  if (source === 'step5') return { bg: `${C.ikb}1a`, text: C.ikb, border: `${C.ikb}50` };
  // C.burgundy = rgba() → 直接用字面量
  if (source === 'trending') return { bg: 'rgba(255,255,255,0.10)', text: 'rgba(255,255,255,0.94)', border: 'rgba(255,255,255,0.28)' };
  // manual: accent3(= ikb hex)描边
  return { bg: `${C.accent3}1a`, text: 'rgba(255,255,255,0.90)', border: `${C.accent3}50` };
}

function getSourceIcon(source: MyTopicItem['source']): string {
  if (source === 'step5') return 'auto_awesome';
  if (source === 'trending') return 'local_fire_department';
  return 'bookmark_added';
}

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDate(dt: Date | string): string {
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Inline: TopicCard ────────────────────────────────────────────────────────

interface TopicCardProps {
  item: MyTopicItem;
  index: number;
}

function TopicCard({ item, index }: TopicCardProps) {
  const badge = getSourceColor(item.source);
  return (
    <Item style={{ height: '100%' }}>
      <motion.div
        className="lg-glass lg-spec"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          borderRadius: 16,
          padding: '16px 20px',
          height: '100%',
        }}
        data-testid={`topic-card-${index}`}
      >
        {/* Title */}
        <p
          className="line-clamp-2"
          style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.45, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
          data-testid={`topic-title-${index}`}
        >
          {item.title}
        </p>

        {/* Footer row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
          {/* Source badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              borderRadius: 6,
              border: `1px solid ${badge.border}`,
              background: badge.bg,
              color: badge.text,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: F.mono,
            }}
            data-testid={`topic-source-badge-${index}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden={true}>
              {getSourceIcon(item.source)}
            </span>
            {getSourceLabel(item.source)}
          </span>

          {/* Industry chip (optional) */}
          {item.industry && (
            <span
              style={{
                borderRadius: 6,
                border: `1px solid ${IKB_CHIP_COLORS[0].border}`,
                background: IKB_CHIP_COLORS[0].bg,
                color: IKB_CHIP_COLORS[0].text,
                padding: '2px 8px',
                fontSize: 11,
                fontFamily: F.cn,
              }}
            >
              {item.industry}
            </span>
          )}

          {/* Platform chip (optional) */}
          {item.platform && (
            <span
              style={{
                borderRadius: 6,
                border: `1px solid ${IKB_CHIP_COLORS[1].border}`,
                background: IKB_CHIP_COLORS[1].bg,
                color: IKB_CHIP_COLORS[1].text,
                padding: '2px 8px',
                fontSize: 11,
                fontFamily: F.cn,
              }}
            >
              {item.platform}
            </span>
          )}

          {/* Date */}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>
            {formatDate(item.createdAt)}
          </span>
        </div>
      </motion.div>
    </Item>
  );
}

// ─── Inline: TopicList ────────────────────────────────────────────────────────

interface TopicListProps {
  items: MyTopicItem[];
}

function TopicList({ items }: TopicListProps) {
  return (
    <div data-testid="topic-list">
      <RevealGroup
        style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, 1fr)' }}
      >
        {items.map((item, i) => (
          <TopicCard key={item.id} item={item} index={i} />
        ))}
      </RevealGroup>
    </div>
  );
}

// ─── Inline: TopicListSkeleton ─────────────────────────────────────────────────

function TopicListSkeleton() {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
      data-testid="topic-list-skeleton"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse lg-glass"
          style={{ height: 96, borderRadius: 16 }}
        />
      ))}
    </div>
  );
}

// ─── Inline: MyTopicsHeader ──────────────────────────────────────────────────

interface MyTopicsHeaderProps {
  topicCount: number;
  weeklyNew: number;
  sourceCount: number;
}

function MyTopicsHeader({ topicCount, weeklyNew, sourceCount }: MyTopicsHeaderProps) {
  // KPI 三色轮转
  const kpiAccents = [C.ikb, 'rgba(255,255,255,0.9)', C.accent3, C.ikb] as const;
  const kpiBgs = [
    'rgba(168,197,224,0.18)',
    'rgba(255,255,255,0.12)',
    'rgba(168,197,224,0.18)',
    'rgba(168,197,224,0.18)',
  ] as const;

  return (
    <div className="mb-10" data-testid="my-topics-header">
      {/* 返回 link */}
      <Reveal>
        <Link
          to={MY_TOPICS_BACK_HREF}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.72)',
            textDecoration: 'none',
            fontFamily: F.cn,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.ikb; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.72)'; }}
          data-testid="back-link"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>arrow_back</span>
          {MY_TOPICS_BACK}
        </Link>
      </Reveal>

      {/* 双徽标 + breadcrumb */}
      <Reveal style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            borderRadius: 9999,
            border: `0.5px solid ${C.line}`,
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(12px)',
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
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
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: C.ikb,
            fontFamily: F.mono,
            textShadow: C.textShadow,
          }}
        >
          选题库
        </span>
        {/* breadcrumb chip */}
        <span
          style={{
            borderRadius: 9999,
            border: `0.5px solid ${C.ikb}40`,
            background: `${C.ikb}12`,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: C.ikb,
            fontFamily: F.mono,
          }}
          data-testid="breadcrumb-chip"
        >
          {MY_TOPICS_BREADCRUMB}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>›</span>
        <span
          style={{ fontSize: 14, fontWeight: 600, color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}
          data-testid="breadcrumb-right"
        >
          {MY_TOPICS_H1}
        </span>
      </Reveal>

      {/* breadcrumb wrapper(for testid) */}
      <div data-testid="breadcrumb" className="sr-only">
        {MY_TOPICS_BREADCRUMB} › {MY_TOPICS_H1}
      </div>

      <div className="flex items-start justify-between gap-8">
        <Reveal style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span
              style={{
                display: 'flex',
                height: 44,
                width: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
                color: 'rgba(255,255,255,0.95)',
              }}
              aria-hidden={true}
              data-testid="h1-heart-icon"
            >
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 24 }}>favorite</span>
            </span>
            <h1
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
              data-testid="h1-title"
            >
              {MY_TOPICS_H1}
            </h1>
          </div>
          <p
            style={{ maxWidth: 820, fontSize: 16, lineHeight: 1.65, color: C.burgundyText, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
            data-testid="subtitle"
          >
            {MY_TOPICS_SUBTITLE}
          </p>
        </Reveal>

        {/* KPI 概览 · 一排 4 个小卡 · 真数据 */}
        <RevealGroup style={{ display: 'flex', flexShrink: 0, gap: 16 }}>
          {[
            { label: '收藏选题', value: topicCount,  icon: 'favorite',   accentIdx: 0 },
            { label: '本周新增', value: weeklyNew,   icon: 'add_circle', accentIdx: 1 },
            { label: '筛选维度', value: MY_TOPICS_FILTERS.length, icon: 'category', accentIdx: 2 },
            { label: '来源数',   value: sourceCount, icon: 'hub',        accentIdx: 3 },
          ].map((kpi) => {
            const accent = kpiAccents[kpi.accentIdx];
            const bg = kpiBgs[kpi.accentIdx];
            return (
              <Item key={kpi.label} style={{ height: '100%' }}>
                <motion.div
                  className="lg-glass lg-spec"
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 108,
                    borderRadius: 16,
                    padding: '12px',
                    height: '100%',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: bg,
                      color: accent,
                      marginBottom: 6,
                    }}
                    aria-hidden={true}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {kpi.icon}
                    </span>
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: accent, fontFamily: F.display, textShadow: C.textShadow }}>
                    {kpi.value}
                  </span>
                  <span style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                    {kpi.label}
                  </span>
                </motion.div>
              </Item>
            );
          })}
        </RevealGroup>
      </div>
    </div>
  );
}

// ─── Inline: MyTopicsSearchRow ────────────────────────────────────────────────

interface MyTopicsSearchRowProps {
  value: string;
  onChange: (v: string) => void;
  onCopy: () => void;
  onDownload: () => void;
  actionsDisabled?: boolean;
}

function MyTopicsSearchRow({ value, onChange, onCopy, onDownload, actionsDisabled }: MyTopicsSearchRowProps) {
  return (
    <Reveal>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }} data-testid="search-row">
        {/* Search input — 液态玻璃 */}
        <div
          className="lg-glass"
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 16,
            padding: '10px 16px',
            transition: 'box-shadow 0.2s',
          }}
          onFocus={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.boxShadow = `0 0 0 2px rgba(168,197,224,0.6), 0 26px 52px -14px rgba(8,20,48,0.55)`;
          }}
          onBlur={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.boxShadow = '';
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ flexShrink: 0, fontSize: 20, color: C.ikb }}
            aria-hidden={true}
          >
            search
          </span>
          <label htmlFor="my-topics-search" className="sr-only">
            {MY_TOPICS_SEARCH_PLACEHOLDER}
          </label>
          <input
            id="my-topics-search"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={MY_TOPICS_SEARCH_PLACEHOLDER}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: C.ink,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
            data-testid="search-input"
          />
        </div>

        {/* Copy btn */}
        <motion.button
          type="button"
          onClick={onCopy}
          disabled={actionsDisabled}
          aria-label={MY_TOPICS_COPY_ALL}
          whileHover={actionsDisabled ? {} : { y: -2 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          className="lg-glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 12,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: actionsDisabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
            fontFamily: F.cn,
            cursor: actionsDisabled ? 'not-allowed' : 'pointer',
            opacity: actionsDisabled ? 0.4 : 1,
            border: 'none',
            transition: 'color 0.15s',
          }}
          data-testid="copy-all-btn"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>content_copy</span>
          {MY_TOPICS_COPY_ALL}
        </motion.button>

        {/* Download btn */}
        <motion.button
          type="button"
          onClick={onDownload}
          disabled={actionsDisabled}
          aria-label={MY_TOPICS_DOWNLOAD_TXT}
          whileHover={actionsDisabled ? {} : { y: -2 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          className="lg-glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 12,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: actionsDisabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
            fontFamily: F.cn,
            cursor: actionsDisabled ? 'not-allowed' : 'pointer',
            opacity: actionsDisabled ? 0.4 : 1,
            border: 'none',
            transition: 'color 0.15s',
          }}
          data-testid="download-txt-btn"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>download</span>
          {MY_TOPICS_DOWNLOAD_TXT}
        </motion.button>
      </div>
    </Reveal>
  );
}

// ─── Inline: MyTopicsFilters ──────────────────────────────────────────────────

interface MyTopicsFiltersProps {
  active: TopicFilterKey;
  onChange: (key: TopicFilterKey) => void;
}

function MyTopicsFilters({ active, onChange }: MyTopicsFiltersProps) {
  return (
    <Reveal>
      <div style={{ marginBottom: 44, display: 'flex', alignItems: 'center', gap: 8 }} data-testid="filter-chips">
        {MY_TOPICS_FILTERS.map(({ key, label }) => {
          const isActive = active === key;
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              data-testid={`filter-chip-${key}`}
              aria-pressed={isActive}
              aria-label={label}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className={isActive ? '' : 'lg-glass'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 9999,
                border: isActive ? 'none' : `0.5px solid ${C.line}`,
                background: isActive
                  ? 'linear-gradient(110deg,#d4e6ff 0%,#a8c5e0 52%,#7fb0e6 100%)'
                  : undefined,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: F.cn,
                cursor: 'pointer',
                transition: 'color 0.15s',
                textShadow: isActive ? C.textShadow : undefined,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: isActive ? '#fff' : C.ikb }}
                aria-hidden={true}
              >
                {FILTER_ICON[key]}
              </span>
              {label}
            </motion.button>
          );
        })}
      </div>
    </Reveal>
  );
}

// ─── Inline: MyTopicsEmpty ────────────────────────────────────────────────────

interface MyTopicsEmptyProps {
  onCta: () => void;
}

function MyTopicsEmpty({ onCta }: MyTopicsEmptyProps) {
  return (
    <Reveal>
      <div
        className="lg-glass"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 20,
          padding: '80px 32px',
        }}
        data-testid="empty-state"
      >
        <span
          style={{
            display: 'flex',
            height: 80,
            width: 80,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(168,197,224,0.15)',
            marginBottom: 24,
          }}
          aria-hidden={true}
          data-testid="empty-heart-icon"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 44, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))', textShadow: '0 1px 4px rgba(6,14,38,.9),0 0 16px rgba(6,14,38,.55)' }}>favorite</span>
        </span>
        <p
          style={{ marginBottom: 8, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}
          data-testid="empty-title"
        >
          {MY_TOPICS_EMPTY_TITLE}
        </p>
        <p
          style={{
            marginBottom: 44,
            maxWidth: 400,
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.84)',
            fontFamily: F.cn,
          }}
          data-testid="empty-desc"
        >
          {MY_TOPICS_EMPTY_DESC}
        </p>
        <Magnetic strength={0.3}>
          <button
            type="button"
            onClick={onCta}
            data-testid="empty-cta-btn"
            className="lg-gradbtn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 9999,
              padding: '12px 32px',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              fontFamily: F.cn,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>local_fire_department</span>
            {MY_TOPICS_EMPTY_CTA}
          </button>
        </Magnetic>
      </div>
    </Reveal>
  );
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debouncedValue;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyTopics() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TopicFilterKey>('all');

  // 300ms 防抖 — 避免每键一次查询
  const debouncedSearch = useDebounce(search, 300);

  // ── tRPC query (keepPreviousData 消除切换骨架抖动) ───────────────────────────
  const { data, isLoading, isError, refetch } = trpc.myTopics.list.useQuery(
    { source: filter, search: debouncedSearch || undefined, page: 1, pageSize: 100 },
    { placeholderData: keepPreviousData },
  );

  // ── countBySource — 用于全量 KPI (不随 filter 浮动) ────────────────────────
  const { data: countData } = trpc.myTopics.countBySource.useQuery(undefined, {
    placeholderData: keepPreviousData,
  });

  const items: MyTopicItem[] = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  // ── KPI: 全量收藏选题 = 三源求和 ─────────────────────────────────────────────
  const totalTopicCount = useMemo(() => {
    if (!countData) return total; // 未就绪前 fallback 当前 total
    return (countData.step5 ?? 0) + (countData.trending ?? 0) + (countData.manual ?? 0);
  }, [countData, total]);

  // ── KPI: 来源数 (≤3) — 用 countBySource 三源是否非零计算 ─────────────────────
  const sourceCount = useMemo(() => {
    if (!countData) return new Set(items.map((item) => item.source)).size;
    return [countData.step5, countData.trending, countData.manual].filter((n) => n > 0).length;
  }, [countData, items]);

  // ── KPI: 本周新增 — 计算时即取当前时间，不冻结 ─────────────────────────────
  const weeklyNew = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    cutoff.setHours(0, 0, 0, 0);
    return items.filter((item) => {
      const d = typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt;
      return d >= cutoff;
    }).length;
  }, [items]);

  // ── copy-all ────────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (items.length === 0) {
      toast.info(MY_TOPICS_TOAST_COPY);
      return;
    }
    try {
      const truncated = total > 100 && items.length < total;
      await navigator.clipboard.writeText(items.map((t) => t.title).join('\n'));
      const msg = truncated
        ? `${MY_TOPICS_TOAST_COPY_SUCCESS(items.length)}（共 ${total} 条，显示前 ${items.length}）`
        : MY_TOPICS_TOAST_COPY_SUCCESS(items.length);
      toast.success(msg);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  }, [items, total]);

  // ── download-txt ────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (items.length === 0) {
      toast.info(MY_TOPICS_TOAST_DOWNLOAD);
      return;
    }
    const blob = new Blob([items.map((t) => t.title).join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-topics.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const truncated = total > 100 && items.length < total;
    const msg = truncated
      ? `${MY_TOPICS_TOAST_DOWNLOAD_SUCCESS}（共 ${total} 条，显示前 ${items.length}）`
      : MY_TOPICS_TOAST_DOWNLOAD_SUCCESS;
    toast.success(msg);
  }, [items, total]);

  // ── render ──────────────────────────────────────────────────────────────────
  const actionsDisabled = items.length === 0;

  return (
    <LiquidShell>
      <div data-testid="my-topics-page">
        <MyTopicsHeader
          topicCount={totalTopicCount}
          weeklyNew={weeklyNew}
          sourceCount={sourceCount}
        />
        <MyTopicsSearchRow
          value={search}
          onChange={setSearch}
          onCopy={() => { void handleCopy(); }}
          onDownload={handleDownload}
          actionsDisabled={actionsDisabled}
        />
        <MyTopicsFilters active={filter} onChange={setFilter} />

        {/* Three-state: loading / error / content */}
        {isLoading ? (
          <TopicListSkeleton />
        ) : isError ? (
          <Reveal>
            <div
              className="lg-glass"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                padding: '80px 32px',
              }}
              data-testid="error-state"
            >
              <span
                style={{
                  display: 'flex',
                  height: 64,
                  width: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.10)',
                  marginBottom: 20,
                }}
                aria-hidden={true}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 36, color: 'rgba(255,255,255,0.8)' }}
                >
                  error_outline
                </span>
              </span>
              <p style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                加载失败，请重试
              </p>
              <Magnetic strength={0.3}>
                <button
                  type="button"
                  onClick={() => { void refetch(); }}
                  className="lg-gradbtn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 9999,
                    padding: '10px 24px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: F.cn,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  data-testid="retry-btn"
                >
                  重试
                </button>
              </Magnetic>
            </div>
          </Reveal>
        ) : items.length === 0 ? (
          <MyTopicsEmpty onCta={() => navigate(MY_TOPICS_CTA_HREF)} />
        ) : (
          <TopicList items={items} />
        )}
      </div>
    </LiquidShell>
  );
}
