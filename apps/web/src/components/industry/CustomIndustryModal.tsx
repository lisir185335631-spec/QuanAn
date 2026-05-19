import { useState } from 'react';

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
import {
  STEP1_CUSTOM_MODAL_CANCEL,
  STEP1_CUSTOM_MODAL_CONFIRM,
  STEP1_CUSTOM_MODAL_PLACEHOLDER,
  STEP1_CUSTOM_MODAL_TITLE,
  STEP1_CUSTOM_TRIGGER_LABEL,
} from '@/lib/constants/industries';

interface CustomIndustryModalProps {
  onConfirm: (value: string) => void;
}

export function CustomIndustryModal({ onConfirm }: CustomIndustryModalProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  function handleConfirm() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setInput('');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" data-testid="custom-industry-trigger">
          {STEP1_CUSTOM_TRIGGER_LABEL}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="font-display">{STEP1_CUSTOM_MODAL_TITLE}</DialogTitle>
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
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {STEP1_CUSTOM_MODAL_CANCEL}
          </Button>
          <Button
            disabled={!input.trim()}
            className="bg-gradient-to-r from-primary to-primary/80"
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
