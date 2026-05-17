import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/states';
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
  type Industry,
  STEP1_CTA_DISABLED_HINT,
  STEP1_CTA_LABEL,
  STEP1_CUSTOM_MODAL_CANCEL,
  STEP1_CUSTOM_MODAL_CONFIRM,
  STEP1_CUSTOM_MODAL_PLACEHOLDER,
  STEP1_CUSTOM_MODAL_TITLE,
  STEP1_CUSTOM_TRIGGER_LABEL,
  STEP1_INDUSTRIES_56,
  STEP1_SEARCH_PLACEHOLDER,
  STEP1_TABS,
} from '@/lib/constants/industries';

// D1=A 字面锁 — 来源 aiipznt-spec.md §7.1
const STEP1_LABEL = 'STEP 01 · 选择行业赛道' as const;
const STEP1_H1 = '选择你的行业赛道' as const;
const STEP1_SUBTITLE = '覆盖抖音、视频号等主流平台的 56+ 个细分行业。你也可以自定义输入行业。' as const;

export default function Step1() {
  const navigate = useNavigate();
  const [activeTabId, setActiveTabId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [customIndustry, setCustomIndustry] = useState<string>('');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const activeTab = STEP1_TABS.find((t) => t.id === activeTabId) ?? STEP1_TABS[0]!;

  // tab filter first
  const tabFiltered =
    activeTabId === 'all'
      ? STEP1_INDUSTRIES_56
      : STEP1_INDUSTRIES_56.filter((ind) => ind.category === activeTab.label);

  // search filter on top of tab filter
  const filteredIndustries = searchQuery.trim()
    ? tabFiltered.filter(
        (ind) =>
          ind.label.includes(searchQuery) ||
          (ind.keywords ?? []).some((kw) => kw.includes(searchQuery)),
      )
    : tabFiltered;

  const isCtaDisabled = !selectedIndustry && !customIndustry;

  function handleCustomConfirm() {
    setCustomIndustry(customInput.trim());
    setSelectedIndustry(null);
    setCustomModalOpen(false);
  }

  function handleSubmit() {
    if (isCtaDisabled) return;
    localStorage.setItem(
      'acc_step1',
      JSON.stringify({
        industry: selectedIndustry?.id ?? 'other',
        industryLabel: selectedIndustry?.label ?? customIndustry,
        customIndustry: customIndustry ?? undefined,
      }),
    );
    navigate('/step/3');
  }

  return (
    <main className="flex-1 container py-8">
      {/* Status card — shown when industry selected from list */}
      {selectedIndustry && (
        <div className="glass-card border-primary/40 bg-primary/5 rounded-lg p-4 mb-6 flex items-start gap-4">
          <span className="text-3xl">{selectedIndustry.emoji}</span>
          <div>
            <p className="text-body-sm font-cn text-on-surface">
              已选择:{selectedIndustry.label}
            </p>
            {selectedIndustry.keywords && selectedIndustry.keywords.length > 0 && (
              <p className="text-body-sm text-muted-foreground mt-1">
                关键词:{selectedIndustry.keywords.join('、')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status card — shown when custom industry confirmed */}
      {customIndustry && (
        <div className="glass-card border-primary/40 bg-primary/5 rounded-lg p-4 mb-6 flex items-start gap-4">
          <span className="text-3xl">✨</span>
          <div>
            <p className="text-body-sm font-cn text-on-surface">
              已选择:{customIndustry}(自定义)
            </p>
          </div>
        </div>
      )}

      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP1_LABEL}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP1_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-6">{STEP1_SUBTITLE}</p>

      {/* search box — placeholder from constant only */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={STEP1_SEARCH_PLACEHOLDER}
          className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* 6 tabs, grid-cols-6, rendered from STEP1_TABS */}
      <div className="grid grid-cols-6 gap-2 mb-6">
        {STEP1_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabId(tab.id)}
            className={[
              'rounded-md px-2 py-2 text-body-sm text-center transition-colors',
              activeTabId === tab.id
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-surface-container text-muted-foreground border border-border hover:bg-surface-container-high',
            ].join(' ')}
          >
            {tab.emoji} {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* empty state or industry grid */}
      {filteredIndustries.length === 0 ? (
        <EmptyState title="未找到匹配的行业" description="尝试自定义输入" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {filteredIndustries.map((ind) => (
            <div
              key={ind.id}
              onClick={() => {
                setSelectedIndustry(ind);
                setCustomIndustry('');
              }}
              className={[
                'glass-card rounded-lg p-4 flex flex-col items-center text-center cursor-pointer transition-colors',
                selectedIndustry?.id === ind.id
                  ? 'border-primary/60 bg-primary/10'
                  : 'hover:border-primary/40',
              ].join(' ')}
            >
              <span className="text-3xl mb-2">{ind.emoji}</span>
              <span className="text-body-sm font-cn text-on-surface">{ind.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom industry Dialog — strictly click-triggered via DialogTrigger asChild */}
      <div className="mb-4 text-center">
        <Dialog open={customModalOpen} onOpenChange={setCustomModalOpen}>
          <DialogTrigger asChild>
            <Button variant="link">{STEP1_CUSTOM_TRIGGER_LABEL}</Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle className="font-display">{STEP1_CUSTOM_MODAL_TITLE}</DialogTitle>
            </DialogHeader>
            <Input
              maxLength={20}
              placeholder={STEP1_CUSTOM_MODAL_PLACEHOLDER}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCustomModalOpen(false)}>
                {STEP1_CUSTOM_MODAL_CANCEL}
              </Button>
              <Button
                disabled={!customInput.trim()}
                className="bg-gradient-to-r from-primary to-primary/80"
                onClick={handleCustomConfirm}
              >
                {STEP1_CUSTOM_MODAL_CONFIRM}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 主 CTA 按钮 */}
      <div className="mt-4">
        <button
          type="button"
          disabled={isCtaDisabled}
          onClick={handleSubmit}
          className={[
            'w-full rounded-lg px-6 py-3 text-body-md font-label transition-colors',
            isCtaDisabled
              ? 'bg-surface-container text-muted-foreground cursor-not-allowed'
              : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-on-primary cursor-pointer',
          ].join(' ')}
        >
          {STEP1_CTA_LABEL} →
        </button>
        {isCtaDisabled && (
          <p className="text-body-sm text-muted-foreground text-center mt-2">
            {STEP1_CTA_DISABLED_HINT}
          </p>
        )}
      </div>
    </main>
  );
}
