// PRD-12 US-010 · DeepLearnReviewDrawer — 右侧抽屉 6 段
// 1.基本信息 2.文件 metadata 3.autoScanResult(PII/违禁高亮) 4.text预览(redact) 5.用户违规 6.链路
// SHIELD: PII redact → hash + redact 显示; text > 5KB 默认折叠

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';

type ViolationEntry = {
  violationType: string;
  count: number;
  lastViolationAt: Date;
  suspendedAt: Date | null;
};

type DetailData = {
  id: number;
  userId: number;
  accountId: number;
  fileName: string;
  fileMime: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: Date;
  autoScanResult: unknown;
  autoVerdict: string;
  status: string;
  reviewerAdminId: number | null;
  reviewedAt: Date | null;
  rejectReason: string | null;
  archiveId: number | null;
  textPreview: string;
  userViolationCount: number;
  userViolations: ViolationEntry[];
};

interface Props {
  queueId: number | null;
  onClose: () => void;
  onActionDone: () => void;
  role: string | undefined;
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '10px 0 6px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 8,
      }}
    >
      {label}
    </div>
  );
}

function KVRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '6px 0',
        borderBottom: '1px solid var(--border)',
        gap: 12,
      }}
    >
      <div style={{ width: 90, flexShrink: 0, color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
      <div style={{ color: 'var(--text)', fontSize: 12, wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── Section 1: 基本信息 ────────────────────────────────────────────────────────

function BasicSection({ detail }: { detail: DetailData }) {
  const statusLabels: Record<string, string> = {
    pending: '待审核', approved: '已批准', rejected: '已驳回',
    auto_approved: '自动批准', auto_rejected: '自动驳回',
  };
  const verdictLabels: Record<string, string> = {
    auto_approved: '自动批准', auto_rejected: '自动驳回', needs_review: '需人工',
  };
  return (
    <div>
      <KVRow label="Queue ID" value={String(detail.id)} />
      <KVRow label="用户 ID" value={String(detail.userId)} />
      <KVRow label="账号 ID" value={String(detail.accountId)} />
      <KVRow label="上传时间" value={new Date(String(detail.uploadedAt)).toLocaleString('zh-CN')} />
      <KVRow label="自动判定" value={verdictLabels[detail.autoVerdict] ?? detail.autoVerdict} />
      <KVRow label="当前状态" value={statusLabels[detail.status] ?? detail.status} />
    </div>
  );
}

// ── Section 2: 文件 Metadata ───────────────────────────────────────────────────

function FileMetaSection({ detail }: { detail: DetailData }) {
  return (
    <div>
      <KVRow label="文件名" value={detail.fileName} />
      <KVRow label="类型" value={detail.fileMime} />
      <KVRow label="大小" value={formatFileSize(detail.fileSize)} />
      <KVRow label="文件 URL" value={detail.fileUrl.length > 60 ? detail.fileUrl.slice(0, 60) + '…' : detail.fileUrl} />
    </div>
  );
}

// ── Section 3: autoScanResult ─────────────────────────────────────────────────

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
            marginBottom: 10,
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

      {piiMatches.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--status-warn)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            PII 命中 ({piiMatches.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
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

      {bannedWords.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--status-err)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            命中违禁词 ({bannedWords.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
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

      {piiMatches.length === 0 && bannedWords.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--status-ok)' }}>✓ 未命中 PII · 未命中违禁词</div>
      )}
    </div>
  );
}

// ── Section 4: 解析 Text 预览 (redact 显示) · > 5KB 默认折叠 ─────────────────────

function TextPreviewSection({ textPreview }: { textPreview: string }) {
  const [expanded, setExpanded] = useState(false);
  const byteLen = new Blob([textPreview]).size;
  const isLarge = byteLen > 5_000; // AC-7: > 5KB collapsed

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          解析预览 · {(byteLen / 1024).toFixed(1)} KB · [redact 脱敏显示]
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
            {expanded ? '折叠' : `展开 · ${(byteLen / 1024).toFixed(0)}KB`}
          </button>
        )}
      </div>
      {isLarge && !expanded ? (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text-dim)',
            fontSize: 12,
          }}
        >
          内容体积较大（{(byteLen / 1024).toFixed(0)} KB），点击"展开"查看完整预览
        </div>
      ) : (
        <pre
          style={{
            margin: 0,
            padding: '8px 10px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            fontSize: 11,
            color: 'var(--text-muted)',
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 240,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {textPreview || '（无解析内容）'}
        </pre>
      )}
    </div>
  );
}

// ── Section 5: 用户违规历史 ────────────────────────────────────────────────────

function ViolationsSection({ count, violations }: { count: number; violations: ViolationEntry[] }) {
  const badge =
    count >= 5
      ? { color: '#ef4444', label: '高风险' }
      : count >= 3
      ? { color: '#f97316', label: '警告' }
      : { color: 'var(--text-muted)', label: '正常' };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
          padding: '8px 12px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 4,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>当前累计违规</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: badge.color }}>{count}</div>
        </div>
        <span
          style={{
            fontSize: 11,
            color: badge.color,
            border: `1px solid ${badge.color}44`,
            padding: '2px 8px',
            borderRadius: 3,
            fontWeight: 600,
          }}
        >
          {badge.label}
        </span>
      </div>

      {violations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {violations.map((v, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px 8px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--text)' }}>{v.violationType}</span>
              <span style={{ color: 'var(--status-err)', fontWeight: 600 }}>×{v.count}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                {new Date(String(v.lastViolationAt)).toLocaleString('zh-CN', {
                  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              {v.suspendedAt && (
                <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700 }}>已封禁</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section 6: 链路 (archiveId 链路 + 审核记录) ──────────────────────────────────

function ChainSection({ detail }: { detail: DetailData }) {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { step: '1. 用户上传文件', done: true, time: new Date(String(detail.uploadedAt)).toLocaleString('zh-CN') },
          { step: '2. 自动扫描 (PII + 违禁词)', done: true, time: `判定: ${detail.autoVerdict}` },
          { step: '3. 进入审核队列', done: true, time: `status: ${detail.status}` },
          {
            step: '4. 人工审核',
            done: !!detail.reviewedAt,
            time: detail.reviewedAt ? new Date(String(detail.reviewedAt)).toLocaleString('zh-CN') : '待处理',
          },
          {
            step: '5. 推入 DeepLearningArchive',
            done: detail.archiveId !== null,
            time: detail.archiveId !== null ? `Archive #${detail.archiveId}` : '—',
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
                width: 16, height: 16, borderRadius: '50%',
                background: item.done ? 'var(--status-ok)' : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: item.done ? '#fff' : 'var(--text-dim)',
                fontWeight: 700, flexShrink: 0, marginTop: 1,
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

      {detail.rejectReason && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 12px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 4,
            fontSize: 12,
            color: '#ef4444',
          }}
        >
          驳回原因: {detail.rejectReason}
        </div>
      )}

      {detail.archiveId !== null && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 12px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 4,
            fontSize: 12,
            color: '#22c55e',
            fontWeight: 600,
          }}
        >
          ✓ 已推入 DeepLearningArchive #{detail.archiveId}
        </div>
      )}
    </div>
  );
}

// ── Action Panel (approve / reject) ─────────────────────────────────────────────

function ActionSection({
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

  const approveMut = adminTrpc.reviewDeepLearn.approve.useMutation({
    onSuccess: () => { showToast('已批准', 'ok'); onActionDone(); },
    onError: (err) => showToast(`操作失败: ${err.message}`, 'err'),
  });
  const rejectMut = adminTrpc.reviewDeepLearn.reject.useMutation({
    onSuccess: () => { showToast('已驳回', 'ok'); onActionDone(); setRejectReason(''); },
    onError: (err) => showToast(`操作失败: ${err.message}`, 'err'),
  });

  if (!isPending || isReadonly) return null;

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        background: 'var(--bg-panel)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
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
          height: 56,
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
  );
}

// ── DeepLearnReviewDrawer (main) ─────────────────────────────────────────────────

export function DeepLearnReviewDrawer({ queueId, onClose, onActionDone, role }: Props) {
  const isOpen = queueId !== null;

  const { data: rawDetail, isLoading, refetch } = adminTrpc.reviewDeepLearn.detail.useQuery(
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
              📚 DeepLearn 审核详情
            </div>
            {detail && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                用户 #{detail.userId} · Queue #{detail.id} · {detail.status}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable 6-section content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {isLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>加载中…</div>
          ) : !detail ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>无数据</div>
          ) : (
            <>
              {/* §1 基本信息 */}
              <SectionHeader label="§1 基本信息" />
              <BasicSection detail={detail} />

              {/* §2 文件 Metadata */}
              <SectionHeader label="§2 文件 Metadata" />
              <FileMetaSection detail={detail} />

              {/* §3 autoScanResult */}
              <SectionHeader label="§3 自动扫描结果 (PII / 违禁词)" />
              <ScanResultSection autoScanResult={detail.autoScanResult} />

              {/* §4 解析 Text 预览 */}
              <SectionHeader label="§4 解析 Text 预览 (redact)" />
              <TextPreviewSection textPreview={detail.textPreview} />

              {/* §5 用户违规 */}
              <SectionHeader label="§5 用户违规历史" />
              <ViolationsSection
                count={detail.userViolationCount}
                violations={detail.userViolations}
              />

              {/* §6 链路 */}
              <SectionHeader label="§6 链路追溯 (archiveId)" />
              <ChainSection detail={detail} />
            </>
          )}
        </div>

        {/* Action panel at bottom */}
        {detail && (
          <ActionSection
            detail={detail}
            queueId={queueId!}
            role={role}
            onActionDone={handleActionDone}
          />
        )}
      </div>
    </>
  );
}

// ── Toast utility ──────────────────────────────────────────────────────────────

function showToast(msg: string, type: 'ok' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : '#ef4444';
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
