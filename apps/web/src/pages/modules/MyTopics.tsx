/**
 * MyTopics.tsx — /my-topics 我的选题库 · 红蓝紫渐变 IKB 体系
 * Phase-2: 接真 tRPC · TopicCard + TopicList · source 过滤对齐后端 · KPI 真数据
 * 逻辑零回退 · testid 全保留 · 4 个 my-topics 组件 inline 重写(禁旧 import)
 */
import '@/styles/ikb-hero.css';

import { keepPreviousData } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
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

const IKB_CHIP_COLORS = [
  { border: `${C.ikb}40`,      bg: `${C.ikb}0d`,      text: C.ikb      },
  { border: `${C.burgundy}40`, bg: `${C.burgundy}0d`, text: C.burgundy },
  { border: `${C.accent3}40`,  bg: `${C.accent3}0d`,  text: C.accent3  },
] as const;

// ─── Source badge helpers ─────────────────────────────────────────────────────

function getSourceLabel(source: MyTopicItem['source']): string {
  if (source === 'step5') return '选题策划';
  if (source === 'trending') return '热点收藏';
  return '手动添加';
}

function getSourceColor(source: MyTopicItem['source']): { bg: string; text: string; border: string } {
  if (source === 'step5') return { bg: C.ikb, text: '#fff', border: C.ikb };
  if (source === 'trending') return { bg: C.burgundy, text: '#fff', border: C.burgundy };
  // manual: 紫底白字
  return { bg: C.accent3, text: '#fff', border: C.accent3 };
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderRadius: 0,
        border: `1px solid ${C.line}`,
        background: C.paper,
        padding: '16px 20px',
      }}
      className="ikb-hovercard"
      data-testid={`topic-card-${index}`}
    >
      {/* Title */}
      <p
        className="ikb-c-title line-clamp-2"
        style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.45, color: C.ink, fontFamily: F.cn, margin: 0 }}
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

        {/* Industry chip (optional) — IKB 蓝 */}
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

        {/* Platform chip (optional) — IKB 玫红 */}
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
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280', fontFamily: F.mono }}>
          {formatDate(item.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ─── Inline: TopicList ────────────────────────────────────────────────────────

interface TopicListProps {
  items: MyTopicItem[];
}

function TopicList({ items }: TopicListProps) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      data-testid="topic-list"
    >
      {items.map((item, i) => (
        <TopicCard key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}

// ─── Inline: TopicListSkeleton ─────────────────────────────────────────────────

function TopicListSkeleton() {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      data-testid="topic-list-skeleton"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ height: 96, border: `1px solid ${C.line}`, background: C.base, borderRadius: 0 }}
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
  const kpiAccents = [C.ikb, C.burgundy, C.accent3, C.ikb] as const;

  return (
    <div className="mb-10" data-testid="my-topics-header">
      {/* 返回 link */}
      <Link
        to={MY_TOPICS_BACK_HREF}
        className="ikb-focusring"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 500,
          color: '#6b7280',
          textDecoration: 'none',
          fontFamily: F.cn,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.ikb; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280'; }}
        data-testid="back-link"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>arrow_back</span>
        {MY_TOPICS_BACK}
      </Link>

      {/* 双徽标 + breadcrumb */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            borderRadius: 0,
            border: `1px solid ${C.line}`,
            background: '#e8e8e8',
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: C.ink,
            fontFamily: F.mono,
          }}
        >
          更多
        </span>
        <span
          style={{
            borderRadius: 0,
            border: `1px solid ${C.accent3}66`,
            background: `${C.accent3}18`,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: C.purpleText,
            fontFamily: F.mono,
          }}
        >
          选题库
        </span>
        {/* breadcrumb chip */}
        <span
          style={{
            borderRadius: 0,
            border: `1px solid ${C.ikb}40`,
            background: `${C.ikb}0d`,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: C.ikb,
            fontFamily: F.mono,
          }}
          data-testid="breadcrumb-chip"
        >
          {MY_TOPICS_BREADCRUMB}
        </span>
        <span style={{ color: '#6b7280', fontSize: 12 }}>›</span>
        <span
          style={{ fontSize: 14, fontWeight: 600, color: C.ikb, fontFamily: F.cn }}
          data-testid="breadcrumb-right"
        >
          {MY_TOPICS_H1}
        </span>
      </div>

      {/* breadcrumb wrapper(for testid) */}
      <div data-testid="breadcrumb" className="sr-only">
        {MY_TOPICS_BREADCRUMB} › {MY_TOPICS_H1}
      </div>

      <div className="flex items-start justify-between gap-8">
        <div className="shrink-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span
              className="material-symbols-outlined icon-fill"
              style={{ fontSize: 32, color: C.burgundy }}
              aria-hidden={true}
              data-testid="h1-heart-icon"
            >
              favorite
            </span>
            <h1
              className="ikb-gradtext whitespace-nowrap"
              style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: F.display, margin: 0 }}
              data-testid="h1-title"
            >
              {MY_TOPICS_H1}
            </h1>
          </div>
          <p
            style={{ maxWidth: 820, fontSize: 16, lineHeight: 1.65, color: '#444653', fontFamily: F.cn, margin: 0 }}
            data-testid="subtitle"
          >
            {MY_TOPICS_SUBTITLE}
          </p>
        </div>

        {/* KPI 概览 · 一排 4 个小卡 · 真数据 */}
        <div style={{ display: 'flex', flexShrink: 0, gap: 16 }}>
          {[
            { label: '收藏选题', value: topicCount,  icon: 'favorite',   accentIdx: 0 },
            { label: '本周新增', value: weeklyNew,   icon: 'add_circle', accentIdx: 1 },
            { label: '筛选维度', value: MY_TOPICS_FILTERS.length, icon: 'category', accentIdx: 2 },
            { label: '来源数',   value: sourceCount, icon: 'hub',        accentIdx: 3 },
          ].map((kpi) => {
            const accent = kpiAccents[kpi.accentIdx];
            return (
              <div
                key={kpi.label}
                className="ikb-hovercard"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 108,
                  borderRadius: 0,
                  border: `1px solid ${C.line}`,
                  background: C.paper,
                  padding: '12px',
                  boxShadow: `0 2px 8px ${accent}10`,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22, marginBottom: 4, color: accent }}
                  aria-hidden={true}
                >
                  {kpi.icon}
                </span>
                <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: accent, fontFamily: F.display }}>
                  {kpi.value}
                </span>
                <span style={{ marginTop: 4, fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>
                  {kpi.label}
                </span>
              </div>
            );
          })}
        </div>
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
    <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }} data-testid="search-row">
      {/* Search input */}
      <div style={{ position: 'relative', flex: 1 }}>
        <span
          className="material-symbols-outlined"
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 18,
            color: '#6b7280',
          }}
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
          className="ikb-input"
          style={{
            width: '100%',
            borderRadius: 0,
            border: `1px solid ${C.line}`,
            background: C.base,
            padding: '10px 12px 10px 40px',
            fontSize: 14,
            color: C.ink,
            fontFamily: F.cn,
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = C.ikb; (e.currentTarget as HTMLInputElement).style.background = C.paper; }}
          onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = C.line; (e.currentTarget as HTMLInputElement).style.background = C.base; }}
          data-testid="search-input"
        />
      </div>

      {/* Copy btn */}
      <button
        type="button"
        onClick={onCopy}
        disabled={actionsDisabled}
        aria-label={MY_TOPICS_COPY_ALL}
        className="ikb-focusring"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 0,
          border: `1px solid ${C.line}`,
          background: C.paper,
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: '#5A6173',
          fontFamily: F.cn,
          cursor: actionsDisabled ? 'not-allowed' : 'pointer',
          opacity: actionsDisabled ? 0.4 : 1,
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => { if (!actionsDisabled) { (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb; (e.currentTarget as HTMLButtonElement).style.color = C.ikb; } }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; (e.currentTarget as HTMLButtonElement).style.color = '#5A6173'; }}
        data-testid="copy-all-btn"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>content_copy</span>
        {MY_TOPICS_COPY_ALL}
      </button>

      {/* Download btn */}
      <button
        type="button"
        onClick={onDownload}
        disabled={actionsDisabled}
        aria-label={MY_TOPICS_DOWNLOAD_TXT}
        className="ikb-focusring"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 0,
          border: `1px solid ${C.line}`,
          background: C.paper,
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: '#5A6173',
          fontFamily: F.cn,
          cursor: actionsDisabled ? 'not-allowed' : 'pointer',
          opacity: actionsDisabled ? 0.4 : 1,
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => { if (!actionsDisabled) { (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb; (e.currentTarget as HTMLButtonElement).style.color = C.ikb; } }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; (e.currentTarget as HTMLButtonElement).style.color = '#5A6173'; }}
        data-testid="download-txt-btn"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>download</span>
        {MY_TOPICS_DOWNLOAD_TXT}
      </button>
    </div>
  );
}

// ─── Inline: MyTopicsFilters ──────────────────────────────────────────────────

interface MyTopicsFiltersProps {
  active: TopicFilterKey;
  onChange: (key: TopicFilterKey) => void;
}

function MyTopicsFilters({ active, onChange }: MyTopicsFiltersProps) {
  return (
    <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }} data-testid="filter-chips">
      {MY_TOPICS_FILTERS.map(({ key, label }, idx) => {
        const isActive = active === key;
        // 轮转三色: all=蓝, step5=蓝, trending=玫红, manual=紫
        const chipAccent = [C.ikb, C.ikb, C.burgundy, C.accent3][idx % 4] ?? C.ikb;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            data-testid={`filter-chip-${key}`}
            aria-pressed={isActive}
            aria-label={label}
            className="ikb-focusring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 0,
              border: `1px solid ${isActive ? chipAccent : C.line}`,
              background: isActive ? chipAccent : C.paper,
              color: isActive ? '#fff' : '#444653',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: F.cn,
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: isActive ? '#fff' : '#6b7280' }}
              aria-hidden={true}
            >
              {FILTER_ICON[key]}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Inline: MyTopicsEmpty ────────────────────────────────────────────────────

interface MyTopicsEmptyProps {
  onCta: () => void;
}

function MyTopicsEmpty({ onCta }: MyTopicsEmptyProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px dashed ${C.line}`,
        background: C.base,
        padding: '80px 32px',
      }}
      data-testid="empty-state"
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 64, marginBottom: 20, color: `${C.ikb}30` }}
        aria-hidden={true}
        data-testid="empty-heart-icon"
      >
        favorite
      </span>
      <p
        style={{ marginBottom: 8, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.display }}
        data-testid="empty-title"
      >
        {MY_TOPICS_EMPTY_TITLE}
      </p>
      <p
        style={{
          marginBottom: 32,
          maxWidth: 400,
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 1.65,
          color: '#6b7280',
          fontFamily: F.cn,
        }}
        data-testid="empty-desc"
      >
        {MY_TOPICS_EMPTY_DESC}
      </p>
      <button
        type="button"
        onClick={onCta}
        data-testid="empty-cta-btn"
        className="ikb-gradbtn ikb-focusring"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 0,
          padding: '12px 32px',
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#fff',
          fontFamily: F.mono,
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>local_fire_department</span>
        {MY_TOPICS_EMPTY_CTA}
      </button>
    </div>
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
    <IKBLayout>
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px dashed ${C.line}`,
              background: C.base,
              padding: '80px 32px',
            }}
            data-testid="error-state"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, marginBottom: 16, color: `${C.burgundy}40` }}
              aria-hidden={true}
            >
              error_outline
            </span>
            <p style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display }}>
              加载失败，请重试
            </p>
            <button
              type="button"
              onClick={() => { void refetch(); }}
              className="ikb-gradbtn ikb-focusring"
              style={{
                borderRadius: 0,
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                fontFamily: F.mono,
                border: 'none',
                cursor: 'pointer',
              }}
              data-testid="retry-btn"
            >
              重试
            </button>
          </div>
        ) : items.length === 0 ? (
          <MyTopicsEmpty onCta={() => navigate(MY_TOPICS_CTA_HREF)} />
        ) : (
          <TopicList items={items} />
        )}
      </div>
    </IKBLayout>
  );
}
