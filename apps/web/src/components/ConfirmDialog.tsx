/**
 * ConfirmDialog.tsx — 可复用 IKB 红蓝紫确认弹窗
 * 替代 window.confirm · 支持 destructive 删除类危险操作
 */

import '@/styles/ikb-hero.css';

import { C, F } from '@/components/home/ikb/system';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = '确认',
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="confirm-dialog" className="max-w-sm">
        <DialogHeader>
          <DialogTitle
            style={{ fontFamily: F.display, color: C.ink }}
          >
            {title}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription style={{ fontFamily: F.cn, color: C.ink, fontSize: 14, lineHeight: 1.6 }}>
          {description}
        </DialogDescription>

        <DialogFooter>
          <button
            type="button"
            data-testid="confirm-dialog-cancel"
            className="ikb-focusring"
            style={{
              border: `1px solid ${C.line}`,
              color: C.ink,
              background: 'transparent',
              padding: '9px 20px',
              fontFamily: F.cn,
              fontSize: 14,
              cursor: 'pointer',
            }}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>

          {destructive ? (
            <button
              type="button"
              data-testid="confirm-dialog-confirm"
              className="ikb-focusring"
              style={{
                background: '#D11E52',
                color: '#fff',
                border: 'none',
                padding: '9px 20px',
                fontFamily: F.cn,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </button>
          ) : (
            <button
              type="button"
              data-testid="confirm-dialog-confirm"
              className="ikb-gradbtn ikb-focusring"
              style={{
                color: '#fff',
                border: 'none',
                padding: '9px 20px',
                fontFamily: F.cn,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
