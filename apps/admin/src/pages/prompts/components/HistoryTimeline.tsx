// PRD-13 US-007/008 · HistoryTimeline — version history list
// AC-9: 版本号 + 评分 + 状态(active/draft/archived/pending_review) + 创建人/时间
//       点条目可预览 · super_admin 可回滚(走 dual approval)
// US-008 AC-9: 每版本下显示灰度历史(canaryPct 变化)

import { useState } from 'react';

import { MonacoEditor } from './MonacoEditor';

export interface CanaryHistoryEntry {
  canaryPct: number;
  updatedAt: Date | string;
}

export interface PromptVersionItem {
  id: number;
  version: number;
  content: string;
  status: string;
  judgeScore: string | null;
  createdByAdminId: number;
  createdAt: Date | string;
  canaryHistory?: CanaryHistoryEntry[];
}

interface Props {
  versions: PromptVersionItem[];
  isLoading?: boolean;
  isSuperAdmin?: boolean;
  onRollback?: (versionId: number) => void;
}

function statusColor(s: string): string {
  if (s === 'active') return '#22c55e';
  if (s === 'pending_review') return '#d4af37';
  if (s === 'draft') return '#60a5fa';
  return 'var(--text-muted)';
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    active: '线上',
    pending_review: '审核中',
    draft: '草稿',
    archived: '已归档',
  };
  return map[s] ?? s;
}

function scoreColor(score: number): string {
  if (score >= 4.0) return '#22c55e';
  if (score >= 3.5) return '#d4af37';
  return '#ef4444';
}

function relativeTime(date: Date | string): string {
  const d = new Date(String(date));
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
  return d.toLocaleDateString('zh-CN');
}

export function HistoryTimeline({ versions, isLoading, isSuperAdmin, onRollback }: Props) {
  const [previewId, setPreviewId] = useState<number | null>(null);

  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>加载中…</div>;
  }

  if (versions.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
        暂无历史版本
      </div>
    );
  }

  const previewVersion = previewId !== null ? versions.find((v) => v.id === previewId) : null;

  return (
    <div>
      {versions.map((v, idx) => {
        const isLast = idx === versions.length - 1;
        const score = v.judgeScore !== null ? parseFloat(v.judgeScore) : null;
        const isPreview = previewId === v.id;

        return (
          <div
            key={v.id}
            style={{
              display: 'flex',
              gap: 10,
              paddingBottom: isLast ? 0 : 12,
              cursor: 'pointer',
            }}
            onClick={() => setPreviewId(isPreview ? null : v.id)}
          >
            {/* timeline dot + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: statusColor(v.status),
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              {!isLast && (
                <div
                  style={{
                    width: 1,
                    flex: 1,
                    background: 'var(--border)',
                    marginTop: 2,
                    minHeight: 16,
                  }}
                />
              )}
            </div>

            {/* content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>
                  v{v.version}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: statusColor(v.status),
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 3,
                    padding: '1px 5px',
                    border: `1px solid ${statusColor(v.status)}44`,
                  }}
                >
                  {statusLabel(v.status)}
                </span>
                {score !== null && (
                  <span style={{ fontSize: 12, color: scoreColor(score), fontWeight: 600 }}>
                    {score.toFixed(2)}分
                  </span>
                )}
                {isSuperAdmin && v.status === 'archived' && onRollback && (
                  <button
                    style={{
                      fontSize: 11,
                      color: '#60a5fa',
                      background: 'transparent',
                      border: '1px solid #60a5fa44',
                      borderRadius: 3,
                      padding: '1px 6px',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRollback(v.id);
                    }}
                  >
                    回滚此版本
                  </button>
                )}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                管理员 #{v.createdByAdminId} · {relativeTime(v.createdAt)}
              </div>

              {/* US-008 AC-9: canary history */}
              {v.canaryHistory && v.canaryHistory.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 3 }}>灰度历史</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {v.canaryHistory.map((h, i) => (
                      <span
                        key={i}
                        title={new Date(String(h.updatedAt)).toLocaleString('zh-CN')}
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: 3,
                          padding: '1px 5px',
                        }}
                      >
                        {h.canaryPct}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Preview modal */}
      {previewVersion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setPreviewId(null)}
        >
          <div
            style={{
              background: '#0f1117',
              border: '1px solid var(--border)',
              borderRadius: 8,
              width: '80vw',
              maxWidth: 900,
              height: '70vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 600 }}>
                v{previewVersion.version} 预览（只读）
              </span>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 16,
                  cursor: 'pointer',
                }}
                onClick={() => setPreviewId(null)}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <MonacoEditor value={previewVersion.content} readOnly height="100%" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
