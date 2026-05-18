// PRD-14 US-009 · HistoryTimeline — constant version history
// AC-9: 每版条目 · 版本号 + 评分 + 状态 + 创建人 + 时间 · 操作 回滚此版本(super_admin · 走 dual approval)
// SHIELD: Monaco lazy import via prompts MonacoEditor (language override to 'json')

import { lazy, Suspense, useState } from 'react';
import type { EditorProps } from '@monaco-editor/react';

// ── Lazy Monaco (re-export pattern from prompts MonacoEditor) ─────────────────

const Editor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.default })));

const AURELIAN_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6b7280' },
    { token: 'keyword', foreground: 'd4af37' },
    { token: 'string', foreground: '86efac' },
    { token: 'variable', foreground: 'c4b5fd' },
  ],
  colors: {
    'editor.background': '#0f1117',
    'editor.foreground': '#e5e7eb',
    'editorLineNumber.foreground': '#4b5563',
    'editor.lineHighlightBackground': '#1f2937',
    'editorCursor.foreground': '#d4af37',
    'editor.selectionBackground': '#374151',
    'editorIndentGuide.background': '#1f2937',
  },
};

function beforeMount(monaco: Parameters<NonNullable<EditorProps['beforeMount']>>[0]) {
  monaco.editor.defineTheme('aurelian-dark', AURELIAN_THEME);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConstantVersionItem {
  id: number;
  version: number;
  content: string;
  status: string;
  judgeScore: string | null;
  createdByAdminId: number;
  createdAt: Date | string;
}

interface Props {
  versions: ConstantVersionItem[];
  isLoading?: boolean;
  isSuperAdmin?: boolean;
  constantType: string;
  constantKey: string;
  onRollback?: (constantType: string, constantKey: string) => void;
}

// ── HistoryTimeline ───────────────────────────────────────────────────────────

export function HistoryTimeline({ versions, isLoading, isSuperAdmin, constantType, constantKey, onRollback }: Props) {
  const [previewId, setPreviewId] = useState<number | null>(null);

  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>加载中…</div>;
  }

  if (versions.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>暂无历史版本</div>
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
                <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 2, minHeight: 16 }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>v{v.version}</span>
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
                      onRollback(constantType, constantKey);
                    }}
                  >
                    回滚此版本
                  </button>
                )}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                管理员 #{v.createdByAdminId} · {relativeTime(v.createdAt)}
              </div>
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
              <Suspense fallback={<div style={{ padding: 16, color: 'var(--text-muted)' }}>加载编辑器…</div>}>
                <Editor
                  height="100%"
                  language="json"
                  theme="aurelian-dark"
                  value={previewVersion.content}
                  options={{ readOnly: true, minimap: { enabled: false }, wordWrap: 'on', fontSize: 13 }}
                  beforeMount={beforeMount}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
