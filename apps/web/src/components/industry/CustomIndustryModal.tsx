import { useState } from 'react';

import { C, F } from '@/components/home-next/ikb/system';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import '@/styles/liquid-glass.css';
import {
  STEP1_CUSTOM_MODAL_CANCEL,
  STEP1_CUSTOM_MODAL_CONFIRM,
  STEP1_CUSTOM_MODAL_PLACEHOLDER,
  STEP1_CUSTOM_MODAL_TITLE,
  STEP1_CUSTOM_TRIGGER_LABEL,
} from '@/lib/constants/industries';

interface CustomIndustryModalProps {
  onConfirm: (value: string) => void;
  /** controlled 模式: 由父组件管理 open state */
  open?: boolean;
  /** controlled 模式: open state 变化回调 */
  onOpenChange?: (open: boolean) => void;
  /** 隐藏内置 trigger btn(controlled 模式下设 true) */
  hideTrigger?: boolean;
}

export function CustomIndustryModal({
  onConfirm,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: CustomIndustryModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [input, setInput] = useState('');

  // controlled 模式优先; 否则自管 state
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  function handleOpenChange(next: boolean) {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  }

  function handleConfirm() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setInput('');
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="link" data-testid="custom-industry-trigger">
            {STEP1_CUSTOM_TRIGGER_LABEL}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: F.display, color: C.ink }}>{STEP1_CUSTOM_MODAL_TITLE}</DialogTitle>
        </DialogHeader>
        <Input
          maxLength={20}
          placeholder={STEP1_CUSTOM_MODAL_PLACEHOLDER}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
          }}
          data-testid="custom-industry-input"
          className="lg-input"
          style={{ borderColor: C.line }}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="lg-focusring"
            style={{ border: `1px solid ${C.line}`, color: C.ink, background: 'transparent' }}
          >
            {STEP1_CUSTOM_MODAL_CANCEL}
          </Button>
          <Button
            disabled={!input.trim()}
            className="lg-gradbtn lg-focusring"
            style={{ color: '#fff' }}
            onClick={handleConfirm}
            data-testid="custom-industry-confirm"
          >
            {STEP1_CUSTOM_MODAL_CONFIRM}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
