/**
 * SampleForm.tsx — 大 form card · 2 tab + 批量粘贴 + textarea + 添加这篇 + 学习档案名 + 主 CTA
 */
import { Brain, FileText, Plus, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DL_ADD_SAMPLE_LABEL,
  DL_ADD_THIS_BTN,
  DL_BATCH_PASTE,
  DL_HINT_CTRL_ENTER,
  DL_NAME_PLACEHOLDER,
  DL_START_BTN_PREFIX,
  DL_START_BTN_SUFFIX,
  DL_TAB_PASTE,
  DL_TAB_UPLOAD,
  DL_TEXTAREA_PLACEHOLDER,
  DL_TOAST_BATCH,
  DL_TOAST_NEED_TEXT,
  DL_TOAST_UPLOAD,
} from '@/lib/constants/deep-learning';

interface SampleFormProps {
  text: string;
  onTextChange: (v: string) => void;
  archiveName: string;
  onArchiveNameChange: (v: string) => void;
  sampleCount: number;
  onStart: () => void;
}

type TabKey = 'paste' | 'upload';

export function SampleForm({
  text,
  onTextChange,
  archiveName,
  onArchiveNameChange,
  sampleCount,
  onStart,
}: SampleFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('paste');

  function handleTabClick(tab: TabKey) {
    if (tab === 'upload') {
      toast.info(DL_TOAST_UPLOAD);
    }
    setActiveTab(tab);
  }

  function handleBatchPaste() {
    toast.info(DL_TOAST_BATCH);
  }

  function handleAddThis() {
    if (!text.trim()) {
      toast.info(DL_TOAST_NEED_TEXT);
    }
  }

  return (
    <div
      data-testid="sample-form"
      className="rounded-xl border border-primary/40 bg-card p-6 space-y-4"
    >
      {/* 2 tab */}
      <div className="grid grid-cols-2 gap-3">
        <button
          data-testid="tab-upload"
          type="button"
          onClick={() => handleTabClick('upload')}
          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'border-primary bg-primary text-black'
              : 'border-border text-muted-foreground hover:border-primary/40'
          }`}
        >
          <Upload className="h-4 w-4" />
          {DL_TAB_UPLOAD}
        </button>
        <button
          data-testid="tab-paste"
          type="button"
          onClick={() => handleTabClick('paste')}
          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'paste'
              ? 'border-primary bg-primary text-black'
              : 'border-border text-muted-foreground hover:border-primary/40'
          }`}
        >
          <FileText className={`h-4 w-4 ${activeTab === 'paste' ? 'text-black' : 'text-primary'}`} />
          {DL_TAB_PASTE}
        </button>
      </div>

      {/* 添加文案样本 / 批量粘贴 row */}
      <div className="flex items-center justify-between">
        <button
          data-testid="add-sample-label"
          type="button"
          className="flex items-center gap-1 text-sm text-primary hover:opacity-80"
        >
          <Plus className="h-4 w-4 text-primary" />
          {DL_ADD_SAMPLE_LABEL}
        </button>
        <button
          data-testid="batch-paste-btn"
          type="button"
          onClick={handleBatchPaste}
          className="text-sm text-primary hover:opacity-80"
        >
          {DL_BATCH_PASTE}
        </button>
      </div>

      {/* textarea */}
      <Textarea
        data-testid="dl-textarea"
        placeholder={DL_TEXTAREA_PLACEHOLDER}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={5}
        className="resize-none"
      />

      {/* Ctrl+Enter hint + 添加这篇 */}
      <div className="flex items-center justify-between">
        <span
          data-testid="ctrl-enter-hint"
          className="text-xs text-muted-foreground"
        >
          {DL_HINT_CTRL_ENTER}
        </span>
        <Button
          data-testid="add-this-btn"
          type="button"
          variant="outline"
          size="sm"
          disabled={!text.trim()}
          onClick={handleAddThis}
          className="flex items-center gap-1 border-primary text-primary hover:bg-primary/10"
        >
          <Plus className="h-3.5 w-3.5 text-primary" />
          {DL_ADD_THIS_BTN}
        </Button>
      </div>

      {/* 学习档案名称 input */}
      <Input
        data-testid="archive-name-input"
        placeholder={DL_NAME_PLACEHOLDER}
        value={archiveName}
        onChange={(e) => onArchiveNameChange(e.target.value)}
      />

      {/* 主 CTA */}
      <Button
        data-testid="start-learning-btn"
        type="button"
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 bg-primary text-black hover:bg-primary/90 font-semibold py-3"
        size="lg"
      >
        <Brain className="h-5 w-5 text-black" />
        {DL_START_BTN_PREFIX}{DL_START_BTN_SUFFIX(sampleCount)}
      </Button>
    </div>
  );
}
