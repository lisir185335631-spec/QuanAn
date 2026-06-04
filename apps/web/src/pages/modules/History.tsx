/**
 * History.tsx — /history 历史记录页 · 红蓝紫渐变 IKB 体系
 * 逻辑零改动 · testid 全保留 · inline IKB style + token
 */
import '@/styles/ikb-hero.css';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
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
    { label: '记录总数', value: String(totalCount), sub: '全部生成记录', color: C.ikb, bg: `${C.ikb}10` },
    { label: '近 7 天',  value: String(weekCount),  sub: '最近 7 天生成', color: C.burgundy, bg: `${C.burgundy}10` },
    { label: '脚本类型', value: rows.length > 0 ? String(scriptTypes) : '0', sub: '种内容类型', color: C.accent3, bg: `${C.accent3}10` },
    { label: '最新记录', value: latest, sub: '最近生成日期', color: C.ikb, bg: `${C.ikb}10` },
  ];
}

// ── IKB三色轮转 chip colors ────────────────────────────────────────────────────

const IKB_CHIP_COLORS = [
  { border: `${C.ikb}40`,      bg: `${C.ikb}0d`,      text: C.ikb },
  { border: `${C.burgundy}40`, bg: `${C.burgundy}0d`, text: C.burgundy },
  { border: `${C.accent3}40`,  bg: `${C.accent3}0d`,  text: C.accent3 },
] as const;

// ── inline ChipRow ──────────────────────────────────────────────────────────────

function ChipRow({ scriptType, elementKeys, entryId }: { scriptType: string; elementKeys: ReadonlyArray<string>; entryId?: number | string }) {
  // scriptType chip: 搞辩论=蓝, others=玫红
  const typeColor = scriptType === '搞辩论' ? C.ikb : C.burgundy;
  const typeBg    = scriptType === '搞辩论' ? `${C.ikb}0d`      : `${C.burgundy}0d`;
  const typeBdr   = scriptType === '搞辩论' ? `${C.ikb}40`      : `${C.burgundy}40`;
  const prefix = entryId !== undefined ? `-${entryId}` : '';

  return (
    <div data-testid={`history-chip-row${prefix}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <span
        data-testid={`script-type-chip-${scriptType}`}
        style={{
          color: typeColor,
          backgroundColor: typeBg,
          border: `1px solid ${typeBdr}`,
          borderRadius: 6,
          padding: '3px 10px',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.04em',
          fontFamily: F.mono,
        }}
      >
        {scriptType}
      </span>

      {elementKeys.map((key, idx) => {
        const el = ALL_ELEMENTS.find((e) => e.key === key);
        if (!el) return null;
        const cp = IKB_CHIP_COLORS[idx % IKB_CHIP_COLORS.length]!;
        return (
          <span
            key={key}
            data-testid={`element-chip-${entryId !== undefined ? `${entryId}-` : ''}${key}`}
            style={{
              borderRadius: 6,
              border: `1px solid ${cp.border}`,
              backgroundColor: cp.bg,
              color: cp.text,
              padding: '3px 8px',
              fontSize: 12,
              fontFamily: F.cn,
            }}
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
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- dialog requires keyboard Esc handling */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="生成详情"
        tabIndex={-1}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 672,
          borderRadius: '16px 16px 0 0',
          border: `1px solid ${C.line}`,
          background: C.paper,
          padding: '24px 24px 40px',
          boxShadow: `0 -8px 40px ${C.ikb}14`,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* close btn */}
        <button
          data-testid="history-detail-close"
          aria-label="关闭"
          onClick={onClose}
          className="ikb-focusring"
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            display: 'flex',
            height: 32,
            width: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: `1px solid ${C.line}`,
            background: C.base,
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb; (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>close</span>
        </button>

        <h3 style={{ marginBottom: 4, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>生成详情</h3>
        <p style={{ marginBottom: 16, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>{entry.timestamp}</p>
        <ChipRow scriptType={entry.scriptType} elementKeys={entry.elementKeys} entryId={`drawer-${entry.id}`} />
        <div
          style={{
            marginTop: 16,
            maxHeight: '50vh',
            overflowY: 'auto',
            borderRadius: 8,
            border: `1px solid ${C.line}`,
            background: C.base,
            padding: 16,
            fontSize: 13,
            lineHeight: 1.7,
            color: C.ink,
            whiteSpace: 'pre-wrap',
            fontFamily: F.cn,
          }}
        >
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
      className="ikb-hovercard"
      style={{
        position: 'relative',
        borderRadius: 10,
        border: `1px solid ${C.line}`,
        background: C.paper,
        padding: 20,
        opacity: isDeleting ? 0.5 : 1,
      }}
    >
      {/* 右上 3 icon btn */}
      <div
        data-testid={`history-entry-actions-${entry.id}`}
        style={{ position: 'absolute', right: 16, top: 16, display: 'flex', gap: 4 }}
      >
        {HISTORY_ACTIONS.map(({ key, label }) => (
          <button
            key={key}
            data-testid={`history-btn-${key}-${entry.id}`}
            aria-label={label}
            disabled={isDeleting || (key === 'delete' && isAnyDeleting)}
            onClick={() => handleAction(key)}
            className="ikb-focusring"
            style={{
              display: 'flex',
              height: 30,
              width: 30,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: `1px solid transparent`,
              background: 'transparent',
              color: '#6b7280',
              cursor: isDeleting || (key === 'delete' && isAnyDeleting) ? 'not-allowed' : 'pointer',
              opacity: isDeleting || (key === 'delete' && isAnyDeleting) ? 0.5 : 1,
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isDeleting && !(key === 'delete' && isAnyDeleting)) {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = `${C.ikb}0d`;
                btn.style.borderColor = `${C.ikb}40`;
                btn.style.color = C.ikb;
              }
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = 'transparent';
              btn.style.borderColor = 'transparent';
              btn.style.color = '#6b7280';
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>
              {ACTION_ICONS[key] ?? 'more_horiz'}
            </span>
          </button>
        ))}
      </div>

      {/* row 1 · chip group */}
      <ChipRow scriptType={entry.scriptType} elementKeys={entry.elementKeys} entryId={entry.id} />

      {/* row 2 · 主题 */}
      <p data-testid={`history-topic-${entry.id}`} style={{ marginTop: 12, fontSize: 14, lineHeight: 1.65, color: C.ink, fontFamily: F.cn }}>
        <span style={{ color: '#6b7280' }}>{HISTORY_TOPIC_PREFIX}</span>
        <span style={{ fontWeight: 600, color: C.ink }}>{entry.topic}</span>
      </p>

      {/* row 3 · timestamp */}
      <p
        data-testid={`history-timestamp-${entry.id}`}
        style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', fontFamily: F.mono }}
      >
        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>schedule</span>
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
      <div
        data-testid="history-list"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          border: `2px dashed ${C.line}`,
          background: C.base,
          paddingTop: 80,
          paddingBottom: 80,
        }}
      >
        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 48, color: '#d1d5db' }}>history</span>
        <p style={{ marginTop: 12, fontSize: 14, color: '#6b7280', fontFamily: F.cn }}>暂无历史记录</p>
      </div>
    );
  }

  return (
    <div data-testid="history-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            borderRadius: 8,
            border: `1px solid ${C.line}`,
            background: C.base,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            color: C.ink,
            fontFamily: F.mono,
          }}
        >
          更多
        </span>
        <span
          style={{
            borderRadius: 8,
            border: `1px solid ${C.ikb}50`,
            background: `${C.ikb}12`,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            color: C.purpleText,
            fontFamily: F.mono,
          }}
        >
          历史记录
        </span>
      </div>
      <h1
        data-testid="history-h1"
        className="ikb-gradtext"
        style={{ whiteSpace: 'nowrap', fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: F.display }}
      >
        {HISTORY_H1}
      </h1>
      <p
        data-testid="history-subtitle"
        style={{ marginTop: 8, maxWidth: 820, fontSize: 16, lineHeight: 1.7, color: '#5A6173', fontFamily: F.cn }}
      >
        {HISTORY_SUBTITLE_TPL(count)}
      </p>
    </div>
  );
}

// ── Skeleton loader ─────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div data-testid="history-loading" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 128,
            borderRadius: 10,
            border: `1px solid ${C.line}`,
            background: C.base,
            animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
          }}
        />
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

  // KPI icon lookup
  const kpiIcons: Record<string, string> = {
    '记录总数': 'history',
    '近 7 天':  'date_range',
    '脚本类型': 'category',
    '最新记录': 'event_note',
  };

  return (
    <IKBLayout>
      {/* ── Header ──────────────────────────────────────────── */}
      <header style={{ marginBottom: 40 }}>
        <HistoryHeader count={entries.length} />
      </header>

      {/* ── KPI 概览 ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 32, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
        {kpiItems.map((kpi) => (
          <div
            key={kpi.label}
            data-testid={`history-kpi-${kpi.label}`}
            className="ikb-hovercard"
            style={{
              borderRadius: 10,
              border: `1px solid ${kpi.color}28`,
              background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
              padding: 20,
            }}
          >
            <div
              style={{
                marginBottom: 12,
                display: 'inline-flex',
                height: 36,
                width: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: kpi.bg,
                color: kpi.color,
              }}
            >
              <span
                className="material-symbols-outlined"
                aria-hidden={true}
                style={{ fontSize: 20 }}
              >
                {kpiIcons[kpi.label] ?? 'info'}
              </span>
            </div>
            <p
              style={{
                fontSize: 26,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: kpi.color,
                fontFamily: F.display,
              }}
            >
              {kpi.value}
            </p>
            <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>
              {kpi.label} · {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── 历史列表 ─────────────────────────────────────────── */}
      <section
        aria-labelledby="history-section-title"
        style={{
          borderRadius: 10,
          border: `1px solid ${C.line}`,
          background: C.base,
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.ikb }}>history</span>
          <h2 id="history-section-title" style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn }}>生成记录</h2>
          <span style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>· 共 {entries.length} 条</span>
        </div>

        {isError ? (
          <div
            data-testid="history-error"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              border: `2px dashed ${C.burgundy}40`,
              background: `${C.burgundy}06`,
              paddingTop: 80,
              paddingBottom: 80,
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 48, color: `${C.burgundy}80` }}>error_outline</span>
            <p style={{ marginTop: 12, fontSize: 14, color: C.burgundy, fontFamily: F.cn }}>加载失败</p>
            <button
              data-testid="history-retry"
              onClick={() => void refetch()}
              className="ikb-focusring"
              style={{
                marginTop: 16,
                borderRadius: 8,
                border: `1px solid ${C.ikb}`,
                background: 'transparent',
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 600,
                color: C.ikb,
                cursor: 'pointer',
                fontFamily: F.cn,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${C.ikb}0d`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
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
    </IKBLayout>
  );
}
