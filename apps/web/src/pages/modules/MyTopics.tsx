/**
 * MyTopics.tsx — /my-topics 我的选题库 · 先锋白 PioneerLayout 重构
 * Phase-2: 接真 tRPC · TopicCard + TopicList · source 过滤对齐后端 · KPI 真数据
 * 逻辑零回退 · testid 全保留 · 4 个 my-topics 组件 inline 重写(禁旧 import)
 */
import { keepPreviousData } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
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

// ─── Source badge helpers ─────────────────────────────────────────────────────

function getSourceLabel(source: MyTopicItem['source']): string {
  if (source === 'step5') return '选题策划';
  if (source === 'trending') return '热点收藏';
  return '手动添加';
}

function getSourceColor(source: MyTopicItem['source']): { bg: string; text: string; border: string } {
  if (source === 'step5') return { bg: '#002fa7', text: '#fff', border: '#002fa7' };
  if (source === 'trending') return { bg: '#781621', text: '#fff', border: '#781621' };
  return { bg: '#F6D300', text: '#221b00', border: '#6e5e00' };
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
      className="flex flex-col gap-2 rounded-xl border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
      data-testid={`topic-card-${index}`}
    >
      {/* Title */}
      <p
        className="text-[14px] font-semibold leading-snug text-[#1b1b1b] line-clamp-2"
        data-testid={`topic-title-${index}`}
      >
        {item.title}
      </p>

      {/* Footer row */}
      <div className="flex flex-wrap items-center gap-2 mt-auto">
        {/* Source badge */}
        <span
          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold"
          style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
          data-testid={`topic-source-badge-${index}`}
        >
          <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
            {getSourceIcon(item.source)}
          </span>
          {getSourceLabel(item.source)}
        </span>

        {/* Industry chip (optional) */}
        {item.industry && (
          <span className="rounded-md border border-[#e5e7eb] bg-[#f3f4f6] px-2 py-0.5 text-[11px] text-[#444653]">
            {item.industry}
          </span>
        )}

        {/* Platform chip (optional) */}
        {item.platform && (
          <span className="rounded-md border border-[#e5e7eb] bg-[#f3f4f6] px-2 py-0.5 text-[11px] text-[#444653]">
            {item.platform}
          </span>
        )}

        {/* Date */}
        <span className="ml-auto text-[11px] text-[#9ca3af]">
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
          className="h-[96px] animate-pulse rounded-xl border border-[#e5e7eb] bg-[#f3f4f6]"
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
  return (
    <div className="mb-10" data-testid="my-topics-header">
      {/* 返回 link */}
      <Link
        to={MY_TOPICS_BACK_HREF}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#444653] transition-colors hover:text-[#002fa7]"
        data-testid="back-link"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
        {MY_TOPICS_BACK}
      </Link>

      {/* 双徽标 + H1 */}
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
          更多
        </span>
        <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
          选题库
        </span>
        {/* breadcrumb chip(for testid) */}
        <span
          className="rounded-lg border border-[#002fa7] bg-[#002fa7]/5 px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#002fa7]"
          data-testid="breadcrumb-chip"
        >
          {MY_TOPICS_BREADCRUMB}
        </span>
        <span className="text-[#9ca3af] text-[12px]">›</span>
        <span className="text-[14px] font-semibold text-[#002fa7]" data-testid="breadcrumb-right">
          {MY_TOPICS_H1}
        </span>
      </div>

      {/* breadcrumb wrapper(for testid) */}
      <div data-testid="breadcrumb" className="sr-only">
        {MY_TOPICS_BREADCRUMB} › {MY_TOPICS_H1}
      </div>

      <div className="flex items-start justify-between gap-8">
        <div className="shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined icon-fill text-[32px] text-[#781621]" aria-hidden="true" data-testid="h1-heart-icon">
              favorite
            </span>
            <h1
              className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]"
              data-testid="h1-title"
            >
              {MY_TOPICS_H1}
            </h1>
          </div>
          <p
            className="max-w-[820px] text-[16px] leading-relaxed text-[#444653]"
            data-testid="subtitle"
          >
            {MY_TOPICS_SUBTITLE}
          </p>
        </div>

        {/* KPI 概览 · 一排 4 个小卡 · 真数据 */}
        <div className="flex shrink-0 gap-4">
          {[
            { label: '收藏选题', value: topicCount,  icon: 'favorite',            accent: '#002fa7' },
            { label: '本周新增', value: weeklyNew,   icon: 'add_circle',          accent: '#781621' },
            { label: '筛选维度', value: MY_TOPICS_FILTERS.length, icon: 'category', accent: '#F6D300', textDark: true },
            { label: '来源数',   value: sourceCount, icon: 'hub',                 accent: '#002fa7' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="flex w-[108px] flex-col items-center rounded-xl border border-[#e5e7eb] bg-white px-3 py-3 shadow-sm"
            >
              <span
                className="material-symbols-outlined mb-1 text-[22px]"
                style={{ color: kpi.accent }}
                aria-hidden="true"
              >
                {kpi.icon}
              </span>
              <span
                className="text-[22px] font-extrabold leading-none"
                style={{ color: kpi.textDark ? '#221b00' : kpi.accent }}
              >
                {kpi.value}
              </span>
              <span className="mt-1 text-[11px] text-[#9ca3af]">{kpi.label}</span>
            </div>
          ))}
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
    <div className="mb-5 flex items-center gap-3" data-testid="search-row">
      {/* Search input */}
      <div className="relative flex-1">
        <span
          className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]"
          aria-hidden="true"
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
          className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-2.5 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
          data-testid="search-input"
        />
      </div>

      {/* Right btn group */}
      <button
        type="button"
        onClick={onCopy}
        disabled={actionsDisabled}
        aria-label={MY_TOPICS_COPY_ALL}
        className={[
          'flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#444653] transition-colors',
          actionsDisabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:border-[#002fa7] hover:text-[#002fa7]',
        ].join(' ')}
        data-testid="copy-all-btn"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">content_copy</span>
        {MY_TOPICS_COPY_ALL}
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={actionsDisabled}
        aria-label={MY_TOPICS_DOWNLOAD_TXT}
        className={[
          'flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#444653] transition-colors',
          actionsDisabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:border-[#002fa7] hover:text-[#002fa7]',
        ].join(' ')}
        data-testid="download-txt-btn"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">download</span>
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
    <div className="mb-8 flex items-center gap-2" data-testid="filter-chips">
      {MY_TOPICS_FILTERS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            data-testid={`filter-chip-${key}`}
            aria-pressed={isActive}
            className={[
              'inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[13px] font-semibold transition-all',
              isActive
                ? 'border-[#002fa7] bg-[#002fa7] text-white shadow-sm'
                : 'border-[#e5e7eb] bg-white text-[#444653] hover:border-[#002fa7] hover:text-[#002fa7]',
            ].join(' ')}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              aria-hidden="true"
              style={{ color: isActive ? '#fff' : '#9ca3af' }}
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
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e5e7eb] bg-white px-8 py-20"
      data-testid="empty-state"
    >
      <span
        className="material-symbols-outlined mb-5 text-[64px] text-[#d1d5db]"
        aria-hidden="true"
        data-testid="empty-heart-icon"
      >
        favorite
      </span>
      <p
        className="mb-2 text-[18px] font-bold text-[#1b1b1b]"
        data-testid="empty-title"
      >
        {MY_TOPICS_EMPTY_TITLE}
      </p>
      <p
        className="mb-8 max-w-[400px] text-center text-[14px] leading-relaxed text-[#9ca3af]"
        data-testid="empty-desc"
      >
        {MY_TOPICS_EMPTY_DESC}
      </p>
      <button
        type="button"
        onClick={onCta}
        data-testid="empty-cta-btn"
        className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[13px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-[#001e73] hover:-translate-y-0.5 active:translate-y-0"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">local_fire_department</span>
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
    <PioneerLayout>
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
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e5e7eb] bg-white px-8 py-20"
            data-testid="error-state"
          >
            <span
              className="material-symbols-outlined mb-4 text-[48px] text-[#e5e7eb]"
              aria-hidden="true"
            >
              error_outline
            </span>
            <p className="mb-4 text-[16px] font-bold text-[#1b1b1b]">加载失败，请重试</p>
            <button
              type="button"
              onClick={() => { void refetch(); }}
              className="rounded-xl bg-[#002fa7] px-6 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#001e73]"
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
    </PioneerLayout>
  );
}
