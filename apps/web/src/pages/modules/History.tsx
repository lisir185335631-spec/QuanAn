/**
 * History.tsx — /history 历史记录页 · 先锋白迁移 · 阶段2 接真 tRPC
 * 逻辑零改动 · testid 全保留 · inline 先锋白重写(无旧组件 import)
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
import { ALL_ELEMENTS } from '@/lib/constants/elements';
import {
  HISTORY_ACTIONS,
  HISTORY_H1,
  HISTORY_SUBTITLE_TPL,
  HISTORY_TOAST_COPY,
  HISTORY_TOAST_DELETE,
  HISTORY_TOAST_VIEW,
  HISTORY_TOPIC_PREFIX,
} from '@/lib/constants/historyPage';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';

// ── tRPC-inferred row type (P1 #7: replace manual interface with inferred type) ──
type HistoryRow = RouterOutputs['history']['list'][number];

// ── helpers ────────────────────────────────────────────────────────────────────

/** Format DateTime → "YYYY/M/D H:mm:ss" aligned with original mock timestamps */
function formatTs(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Parse elements field — already String[] from Prisma, guard against edge-cases */
function parseElements(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {
      /* non-JSON string */
    }
  }
  return [];
}

// ── Card shape (mapped from row) ───────────────────────────────────────────────

interface CardEntry {
  id: number;
  scriptType: string;
  elementKeys: string[];
  topic: string;
  timestamp: string;
  content: string;
}

function rowToCard(row: HistoryRow): CardEntry {
  const topic = row.inputSummary.trim() || row.content.slice(0, 60);
  const timestamp = formatTs(row.createdAt);
  const elementKeys = parseElements(row.elements);
  const scriptType = row.scriptType ?? row.agentMode ?? row.sourceType;
  return { id: row.id, scriptType, elementKeys, topic, timestamp, content: row.content };
}

// ── KPI derived from live rows + server counts ─────────────────────────────────

function buildKpi(rows: HistoryRow[], totalCount: number, weekCount: number) {
  const scriptTypes = new Set(rows.map((r) => r.scriptType ?? '')).size;
  const latest = rows[0]?.createdAt
    ? formatTs(rows[0].createdAt).split(' ')[0] ?? '—'
    : '—';
  return [
    { label: '记录总数', value: String(totalCount), sub: '全部生成记录', color: '#002fa7', bg: '#eff3fc' },
    { label: '近 7 天', value: String(weekCount), sub: '最近 7 天生成', color: '#781621', bg: '#fdf2f2' },
    { label: '脚本类型', value: rows.length > 0 ? String(scriptTypes) : '0', sub: '种内容类型', color: '#8A6A00', bg: '#fefae0' },
    { label: '最新记录', value: latest, sub: '最近生成日期', color: '#002fa7', bg: '#eff3fc' },
  ];
}

// ── inline ChipRow ──────────────────────────────────────────────────────────────

function ChipRow({ scriptType, elementKeys, entryId }: { scriptType: string; elementKeys: ReadonlyArray<string>; entryId?: number | string }) {
  const typeColor = scriptType === '搞辩论' ? '#002fa7' : '#781621';
  const typeBg = scriptType === '搞辩论' ? '#eff3fc' : '#fdf2f2';
  const prefix = entryId !== undefined ? `-${entryId}` : '';

  return (
    <div data-testid={`history-chip-row${prefix}`} className="flex flex-wrap gap-2">
      <span
        data-testid={`script-type-chip-${scriptType}`}
        style={{ color: typeColor, backgroundColor: typeBg, border: `1px solid ${typeColor}33` }}
        className="rounded-md px-3 py-1 text-[12px] font-bold tracking-wide"
      >
        {scriptType}
      </span>

      {elementKeys.map((key) => {
        const el = ALL_ELEMENTS.find((e) => e.key === key);
        if (!el) return null;
        return (
          <span
            key={key}
            data-testid={`element-chip-${entryId !== undefined ? `${entryId}-` : ''}${key}`}
            className="rounded-md border border-[#e5e7eb] bg-[#f8f9fa] px-2 py-1 text-[12px] text-[#444653]"
          >
            {el.emoji} {el.label}
          </span>
        );
      })}
    </div>
  );
}

// ── Detail drawer ───────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  entry: CardEntry;
  onClose: () => void;
}

function DetailDrawer({ entry, onClose }: DetailDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // P1 #6: focus panel on open
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  // P1 #6: close on Esc
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') onClose();
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      data-testid="history-detail-drawer"
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- dialog requires keyboard Esc handling */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="生成详情"
        tabIndex={-1}
        className="relative w-full max-w-2xl rounded-t-2xl border border-[#e5e7eb] bg-white p-6 pb-10 shadow-xl outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* close btn */}
        <button
          data-testid="history-detail-close"
          aria-label="关闭"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#002fa7]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
        </button>

        <h3 className="mb-1 text-[16px] font-bold text-[#111827]">生成详情</h3>
        <p className="mb-4 text-[12px] text-[#9ca3af]">{entry.timestamp}</p>
        <ChipRow scriptType={entry.scriptType} elementKeys={entry.elementKeys} entryId={`drawer-${entry.id}`} />
        <div className="mt-4 max-h-[50vh] overflow-y-auto rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-4 text-[13px] leading-relaxed text-[#1b1b1b] whitespace-pre-wrap">
          {entry.content || '（无内容）'}
        </div>
      </div>
    </div>
  );
}

// ── inline EntryCard ────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: CardEntry;
  onView: () => void;
  onCopy: (topic: string) => void;
  onDelete: () => void;
  isDeleting?: boolean;
  /** P1 #5: any delete in-flight → disable all cards' delete buttons */
  isAnyDeleting?: boolean;
}

const ACTION_ICONS: Record<string, string> = {
  view: 'visibility',
  copy: 'content_copy',
  delete: 'delete',
};

function EntryCard({ entry, onView, onCopy, onDelete, isDeleting, isAnyDeleting }: EntryCardProps) {
  function handleAction(key: string) {
    if (key === 'view') onView();
    else if (key === 'copy') onCopy(entry.topic);
    else if (key === 'delete') onDelete();
  }

  return (
    <div
      data-testid={`history-entry-card-${entry.id}`}
      className="relative rounded-xl border border-[#e5e7eb] bg-white p-6 transition-all hover:border-[#002fa7] hover:shadow-sm"
      style={{ opacity: isDeleting ? 0.5 : 1 }}
    >
      {/* 右上 3 icon btn */}
      <div
        data-testid={`history-entry-actions-${entry.id}`}
        className="absolute right-4 top-4 flex gap-1"
      >
        {HISTORY_ACTIONS.map(({ key, label }) => (
          <button
            key={key}
            data-testid={`history-btn-${key}-${entry.id}`}
            aria-label={label}
            disabled={isDeleting || (key === 'delete' && isAnyDeleting)}
            onClick={() => handleAction(key)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3af] transition-colors hover:bg-[#f3f4f6] hover:text-[#002fa7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {ACTION_ICONS[key] ?? 'more_horiz'}
            </span>
          </button>
        ))}
      </div>

      {/* row 1 · chip group */}
      <ChipRow scriptType={entry.scriptType} elementKeys={entry.elementKeys} entryId={entry.id} />

      {/* row 2 · 主题 */}
      <p data-testid={`history-topic-${entry.id}`} className="mt-3 text-[14px] leading-relaxed text-[#1b1b1b]">
        <span className="text-[#9ca3af]">{HISTORY_TOPIC_PREFIX}</span>
        <span className="font-semibold text-[#111827]">{entry.topic}</span>
      </p>

      {/* row 3 · timestamp */}
      <p
        data-testid={`history-timestamp-${entry.id}`}
        className="mt-2 flex items-center gap-1.5 text-[12px] text-[#9ca3af]"
      >
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">schedule</span>
        {entry.timestamp}
      </p>
    </div>
  );
}

// ── inline HistoryList ──────────────────────────────────────────────────────────

interface HistoryListProps {
  entries: CardEntry[];
  onView: (entry: CardEntry) => void;
  onCopy: (topic: string) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
  /** P1 #5: global delete in-flight flag — disables all delete buttons */
  isAnyDeleting?: boolean;
}

function HistoryList({ entries, onView, onCopy, onDelete, deletingId, isAnyDeleting }: HistoryListProps) {
  if (entries.length === 0) {
    return (
      <div data-testid="history-list" className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white py-20">
        <span className="material-symbols-outlined text-[48px] text-[#d1d5db]" aria-hidden="true">history</span>
        <p className="mt-3 text-[14px] text-[#9ca3af]">暂无历史记录</p>
      </div>
    );
  }

  return (
    <div data-testid="history-list" className="space-y-4">
      {entries.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          isDeleting={deletingId === entry.id}
          isAnyDeleting={isAnyDeleting}
          onView={() => onView(entry)}
          onCopy={onCopy}
          onDelete={() => onDelete(entry.id)}
        />
      ))}
    </div>
  );
}

// ── inline HistoryHeader ────────────────────────────────────────────────────────

function HistoryHeader({ count }: { count: number }) {
  return (
    <div data-testid="history-header">
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
          更多
        </span>
        <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
          历史记录
        </span>
      </div>
      <h1
        data-testid="history-h1"
        className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]"
      >
        {HISTORY_H1}
      </h1>
      <p
        data-testid="history-subtitle"
        className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]"
      >
        {HISTORY_SUBTITLE_TPL(count)}
      </p>
    </div>
  );
}

// ── Skeleton loader ─────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div data-testid="history-loading" className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl border border-[#e5e7eb] bg-[#f3f4f6]" />
      ))}
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────────────────────

export default function History() {
  const [detailEntry, setDetailEntry] = useState<CardEntry | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: rawRows, isLoading, isError, refetch } = trpc.history.list.useQuery({ limit: 100 });

  // P0 #1: true total count (unbounded by list limit)
  const { data: totalCount = 0 } = trpc.history.count.useQuery({});
  // P0 #2: near-7-day distinct KPI
  const { data: weekCount = 0 } = trpc.history.count.useQuery({ dateRange: 'week' });

  const deleteMutation = trpc.history.delete.useMutation({
    onMutate: ({ id }) => {
      setDeletingId(id);
    },
    onSuccess: async () => {
      await utils.history.list.invalidate();
      await utils.history.count.invalidate();
      toast.success(HISTORY_TOAST_DELETE);
    },
    onError: () => {
      toast.error('删除失败，请重试');
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  // P1 #7: use inferred type, no cast
  const rows = rawRows ?? [];
  const entries: CardEntry[] = rows.map(rowToCard);
  const kpiItems = buildKpi(rows, totalCount, weekCount);

  function handleView(entry: CardEntry) {
    setDetailEntry(entry);
    toast.info(HISTORY_TOAST_VIEW);
  }

  function handleCopy(topic: string) {
    // P2 #13: non-silent clipboard error
    void navigator.clipboard
      .writeText(topic)
      .then(() => { toast.success(HISTORY_TOAST_COPY); })
      .catch(() => { toast.error('复制失败，请手动复制'); });
  }

  function handleDelete(id: number) {
    // P1 #5: concurrent delete guard — all cards' delete disabled while pending
    if (deleteMutation.isPending) return;
    deleteMutation.mutate({ id });
  }

  return (
    <PioneerLayout>
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="mb-10">
        <HistoryHeader count={entries.length} />
      </header>

      {/* ── KPI 概览 ─────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-5">
        {kpiItems.map((kpi) => (
          <div
            key={kpi.label}
            data-testid={`history-kpi-${kpi.label}`}
            className="rounded-xl border border-[#e5e7eb] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div
              className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: kpi.bg }}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                aria-hidden="true"
                style={{ color: kpi.color }}
              >
                {kpi.label === '记录总数'
                  ? 'history'
                  : kpi.label === '近 7 天'
                  ? 'date_range'
                  : kpi.label === '脚本类型'
                  ? 'category'
                  : 'event_note'}
              </span>
            </div>
            <p
              className="text-[26px] font-extrabold leading-none tracking-tighter"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">
              {kpi.label} · {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── 历史列表 ─────────────────────────────────────────── */}
      <section aria-labelledby="history-section-title" className="rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">history</span>
          <h2 id="history-section-title" className="text-[16px] font-bold text-[#111827]">生成记录</h2>
          <span className="text-[12px] text-[#9ca3af]">· 共 {entries.length} 条</span>
        </div>

        {isError ? (
          <div data-testid="history-error" className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white py-20">
            <span className="material-symbols-outlined text-[48px] text-[#d1d5db]" aria-hidden="true">error_outline</span>
            <p className="mt-3 text-[14px] text-[#9ca3af]">加载失败</p>
            <button
              data-testid="history-retry"
              onClick={() => void refetch()}
              className="mt-4 rounded-lg border border-[#002fa7] px-4 py-2 text-[13px] font-semibold text-[#002fa7] hover:bg-[#eff3fc]"
            >
              重试
            </button>
          </div>
        ) : isLoading ? (
          <HistorySkeleton />
        ) : (
          <HistoryList
            entries={entries}
            deletingId={deletingId}
            isAnyDeleting={deleteMutation.isPending}
            onView={handleView}
            onCopy={handleCopy}
            onDelete={handleDelete}
          />
        )}
      </section>

      {/* ── Detail Drawer ────────────────────────────────────── */}
      {detailEntry && (
        <DetailDrawer
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
        />
      )}
    </PioneerLayout>
  );
}
