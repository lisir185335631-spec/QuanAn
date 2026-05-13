// PRD-12 US-005 · TrendingReviewDrawer — 右侧抽屉 5 段
// 基本 / rawContent JSON树折叠 / autoScanResult红+橙 / 审核状态 / 链路追溯
// SHIELD: rawContent JSON > 100KB 默认折叠 + '展开' 按钮 lazy render

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';

type DetailData = {
  id: number;
  sourcePlatform: string;
  sourceItemId: string;
  sourceUrl: string;
  rawContent: unknown;
  fetchedAt: Date;
  autoScanResult: unknown;
  autoVerdict: string;
  status: string;
  reviewerAdminId: number | null;
  reviewedAt: Date | null;
  rejectReason: string | null;
  trendingItemId: number | null;
};

interface Props {
  queueId: number | null;
  onClose: () => void;
  onActionDone: () => void;
  role: string | undefined;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'basic', label: '基本' },
  { id: 'rawContent', label: 'rawContent' },
  { id: 'scanResult', label: '扫描结果' },
  { id: 'reviewStatus', label: '审核状态' },
  { id: 'traceChain', label: '链路追溯' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── BasicSection ──────────────────────────────────────────────────────────────

function BasicSection({ detail }: { detail: DetailData }) {
  const rows = [
    { label: 'Queue ID', value: String(detail.id) },
    { label: '平台', value: detail.sourcePlatform },
    { label: '来源 ID', value: detail.sourceItemId },
    { label: '来源 URL', value: detail.sourceUrl },
    { label: '抓取时间', value: new Date(String(detail.fetchedAt)).toLocaleString('zh-CN') },
    { label: '自动判定', value: detail.autoVerdict },
    { label: '当前状态', value: detail.status },
  ];
  return (
    <div>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: 'flex',
            padding: '8px 0',
            borderBottom: '1px solid var(--border)',
            gap: 12,
          }}
        >
          <div style={{ width: 90, flexShrink: 0, color: 'var(--text-muted)', fontSize: 12 }}>{r.label}</div>
          <div style={{ color: 'var(--text)', fontSize: 12, wordBreak: 'break-all' }}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── RawContentSection ─────────────────────────────────────────────────────────

function RawContentSection({ rawContent }: { rawContent: unknown }) {
  const [expanded, setExpanded] = useState(false);

  const jsonStr = JSON.stringify(rawContent, null, 2);
  const byteLen = new Blob([jsonStr]).size;
  const isLarge = byteLen > 100_000; // 100KB threshold

  const displayStr = expanded || !isLarge ? jsonStr : null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          rawContent · {(byteLen / 1024).toFixed(1)} KB
        </span>
        {isLarge && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--gold-text)',
              padding: '3px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            {expanded ? '折叠' : `展开 rawContent · ${(byteLen / 1024).toFixed(0)}KB`}
          </button>
        )}
      </div>
      {isLarge && !expanded ? (
        <div
          style={{
            padding: '12px 14px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text-dim)',
            fontSize: 12,
          }}
        >
          内容体积较大（{(byteLen / 1024).toFixed(0)} KB），点击"展开"查看完整内容
        </div>
      ) : (
        <pre
          style={{
            margin: 0,
            padding: '10px 12px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            fontSize: 11,
            color: 'var(--text-muted)',
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 400,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {displayStr}
        </pre>
      )}
    </div>
  );
}

// ── ScanResultSection ─────────────────────────────────────────────────────────

function ScanResultSection({ autoScanResult }: { autoScanResult: unknown }) {
  const result = autoScanResult as Record<string, unknown> | null;
  if (!result) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>暂无扫描结果</div>;
  }

  const bannedWords = (result['bannedWords'] as string[] | undefined) ?? [];
  const piiMatches = (result['piiMatches'] as string[] | undefined) ?? [];
  const score = result['score'];
  const verdict = result['verdict'];

  return (
    <div>
      {(score !== undefined || verdict !== undefined) && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 12,
            padding: '8px 12px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
          }}
        >
          {score !== undefined && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>风险评分</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--status-err)' }}>{String(score)}</div>
            </div>
          )}
          {verdict !== undefined && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>判定</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{String(verdict)}</div>
            </div>
          )}
        </div>
      )}

      {bannedWords.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--status-err)',
              fontWeight: 600,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            命中违禁词 ({bannedWords.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {bannedWords.map((w, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  color: '#ef4444',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: '2px 7px',
                  borderRadius: 3,
                  fontWeight: 600,
                }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {piiMatches.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--status-warn)',
              fontWeight: 600,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            PII 命中 ({piiMatches.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {piiMatches.map((p, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  color: '#f97316',
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  padding: '2px 7px',
                  borderRadius: 3,
                  fontWeight: 600,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {bannedWords.length === 0 && piiMatches.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--status-ok)' }}>✓ 未命中违禁词 · 未命中 PII</div>
      )}

      <details style={{ marginTop: 12 }}>
        <summary
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            userSelect: 'none',
            listStyle: 'none',
          }}
        >
          ▸ 查看完整扫描结果 JSON
        </summary>
        <pre
          style={{
            margin: '8px 0 0',
            padding: '8px 10px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            fontSize: 10,
            color: 'var(--text-dim)',
            overflowX: 'auto',
            maxHeight: 240,
            whiteSpace: 'pre-wrap',
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}

// ── ReviewStatusSection ────────────────────────────────────────────────────────

function ReviewStatusSection({
  detail,
  queueId,
  role,
  onActionDone,
}: {
  detail: DetailData;
  queueId: number;
  role: string | undefined;
  onActionDone: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const isReadonly = role === 'readonly_admin';
  const isPending = detail.status === 'pending';

  const approveMut = adminTrpc.reviewTrending.approve.useMutation({
    onSuccess: () => { showToast('已批准', 'ok'); onActionDone(); },
    onError: (err) => showToast(`操作失败: ${err.message}`, 'err'),
  });
  const rejectMut = adminTrpc.reviewTrending.reject.useMutation({
    onSuccess: () => { showToast('已驳回', 'ok'); onActionDone(); setRejectReason(''); },
    onError: (err) => showToast(`操作失败: ${err.message}`, 'err'),
  });

  const statusLabels: Record<string, string> = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已驳回',
    auto_approved: '自动批准',
    auto_rejected: '自动驳回',
  };

  return (
    <div>
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>当前状态</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>
          {statusLabels[detail.status] ?? detail.status}
        </div>
        {detail.reviewedAt && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            审核于 {new Date(String(detail.reviewedAt)).toLocaleString('zh-CN')}
            {detail.reviewerAdminId ? ` · Admin #${detail.reviewerAdminId}` : ''}
          </div>
        )}
        {detail.rejectReason && (
          <div style={{ fontSize: 12, color: 'var(--status-err)', marginTop: 6 }}>
            驳回原因: {detail.rejectReason}
          </div>
        )}
      </div>

      {isPending && !isReadonly && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => approveMut.mutate({ queueId })}
              disabled={approveMut.isPending}
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.4)',
                color: '#22c55e',
                padding: '6px 16px',
                borderRadius: 4,
                cursor: approveMut.isPending ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {approveMut.isPending ? '处理中…' : '✓ 批准'}
            </button>
          </div>
          <div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="驳回原因（至少 5 个字符）…"
              style={{
                width: '100%',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                color: 'var(--text)',
                padding: '6px 8px',
                fontSize: 12,
                outline: 'none',
                resize: 'vertical',
                height: 64,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button
                type="button"
                onClick={() => rejectMut.mutate({ queueId, rejectReason })}
                disabled={rejectReason.trim().length < 5 || rejectMut.isPending}
                style={{
                  background: rejectReason.trim().length >= 5 ? 'rgba(239,68,68,0.15)' : 'var(--bg-hover)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: rejectReason.trim().length >= 5 ? '#ef4444' : 'var(--text-dim)',
                  padding: '5px 14px',
                  borderRadius: 4,
                  cursor: rejectReason.trim().length >= 5 ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {rejectMut.isPending ? '处理中…' : '✗ 驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TraceChainSection ─────────────────────────────────────────────────────────

function TraceChainSection({ detail }: { detail: DetailData }) {
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>处理链路</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { step: '1. TrendingScraper 抓取', done: true, time: new Date(String(detail.fetchedAt)).toLocaleString('zh-CN') },
            { step: '2. 自动扫描 (违禁词 + PII)', done: true, time: `判定: ${detail.autoVerdict}` },
            { step: '3. 进入审核队列', done: true, time: `status: ${detail.status}` },
            {
              step: '4. 人工审核',
              done: !!detail.reviewedAt,
              time: detail.reviewedAt ? new Date(String(detail.reviewedAt)).toLocaleString('zh-CN') : '待处理',
            },
            {
              step: '5. 推入 TrendingItem',
              done: detail.trendingItemId !== null,
              time: detail.trendingItemId ? `Item #${detail.trendingItemId}` : '—',
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: item.done ? 'var(--status-ok)' : 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  color: item.done ? '#fff' : 'var(--text-dim)',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {item.done ? '✓' : '○'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: item.done ? 'var(--text)' : 'var(--text-muted)' }}>
                  {item.step}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {detail.trendingItemId && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 4,
          }}
        >
          <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
            ✓ 已推入 TrendingItem #{detail.trendingItemId}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TrendingReviewDrawer (main) ───────────────────────────────────────────────

export function TrendingReviewDrawer({ queueId, onClose, onActionDone, role }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const isOpen = queueId !== null;

  const { data: rawDetail, isLoading, refetch } = adminTrpc.reviewTrending.detail.useQuery(
    { queueId: queueId! },
    { enabled: queueId !== null, staleTime: 30_000 },
  );
  const detail = rawDetail as unknown as DetailData | null | undefined;

  const handleActionDone = () => {
    void refetch();
    onActionDone();
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
        />
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'var(--drawer-width)',
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              🔥 TrendingItem 审核详情
            </div>
            {detail && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                {detail.sourcePlatform} · #{detail.id} · {detail.status}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 18,
              padding: '0 4px',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {isLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>加载中…</div>
          ) : !detail ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>无数据</div>
          ) : (
            <>
              {activeTab === 'basic' && <BasicSection detail={detail} />}
              {activeTab === 'rawContent' && <RawContentSection rawContent={detail.rawContent} />}
              {activeTab === 'scanResult' && <ScanResultSection autoScanResult={detail.autoScanResult} />}
              {activeTab === 'reviewStatus' && (
                <ReviewStatusSection
                  detail={detail}
                  queueId={queueId!}
                  role={role}
                  onActionDone={handleActionDone}
                />
              )}
              {activeTab === 'traceChain' && <TraceChainSection detail={detail} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Toast utility ─────────────────────────────────────────────────────────────

function showToast(msg: string, type: 'ok' | 'warn' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : type === 'warn' ? '#f59e0b' : '#ef4444';
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
    background: '#111', border: `1px solid ${color}`, color,
    padding: '10px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
