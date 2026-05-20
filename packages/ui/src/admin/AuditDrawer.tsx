// @quanan/ui/admin · AuditDrawer — slide-from-right portal, no app-layer deps
// logs are fetched by AdminLayout (adminTrpc.audit.listMine) and passed as props

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface AuditRow {
  id: number;
  eventType: string;
  eventCategory: string;
  createdAt: Date | string;
  payload?: Record<string, unknown> | null;
}

interface AuditDrawerProps {
  open: boolean;
  onClose: () => void;
  logs: AuditRow[];
}

export function AuditDrawer({ open, onClose, logs }: AuditDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        ref={overlayRef}
        className="audit-drawer-overlay"
        aria-hidden="true"
        onClick={onClose}
        data-testid="audit-drawer-overlay"
      />
      <aside
        className="audit-drawer audit-drawer--open"
        aria-label="我的审计记录"
        data-testid="audit-drawer"
      >
        <div className="audit-drawer__header">
          <span className="audit-drawer__title">审计记录（最近 50 条）</span>
          <button
            type="button"
            className="audit-drawer__close"
            aria-label="关闭"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="audit-drawer__body">
          {logs.length === 0 ? (
            <div className="audit-drawer__empty">暂无审计记录</div>
          ) : (
            logs.map((row) => (
              <div key={row.id} className="audit-drawer__row">
                <span className="audit-drawer__event-type">{row.eventType}</span>
                <span style={{ color: '#555', fontSize: 11 }}>
                  {new Date(row.createdAt).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}
