import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CustomIndustryModal } from '@/components/industry/CustomIndustryModal';
import { IndustryEmojiGrid } from '@/components/industry/IndustryEmojiGrid';
import { Step1Banner } from '@/components/industry/Step1Banner';
import { Step1Breadcrumb } from '@/components/industry/Step1Breadcrumb';
import { Step1StickyBar } from '@/components/industry/Step1StickyBar';
import { EmptyState } from '@/components/states';
import {
  type Industry,
  STEP1_INDUSTRIES_56,
  STEP1_PAGE_H1,
  STEP1_PAGE_H1_EMOJI,
  STEP1_SEARCH_PLACEHOLDER,
  STEP1_SUBTITLE_COUNT,
  STEP1_SUBTITLE_CUSTOM_LINK,
  STEP1_SUBTITLE_PART1,
  STEP1_SUBTITLE_PART2,
  STEP1_SUBTITLE_PART3,
  STEP1_TABS,
} from '@/lib/constants/industries';

export default function Step1() {
  const navigate = useNavigate();
  const [activeTabId, setActiveTabId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [customIndustry, setCustomIndustry] = useState<string>('');
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const activeTab = STEP1_TABS.find((t) => t.id === activeTabId) ?? STEP1_TABS[0]!;
  const tabFiltered =
    activeTabId === 'all'
      ? STEP1_INDUSTRIES_56
      : STEP1_INDUSTRIES_56.filter((ind) => ind.category === activeTab.label);
  const filteredIndustries = searchQuery.trim()
    ? tabFiltered.filter(
        (ind) =>
          ind.label.includes(searchQuery) ||
          (ind.keywords ?? []).some((kw) => kw.includes(searchQuery)),
      )
    : tabFiltered;

  const hasSelection = !!selectedIndustry || !!customIndustry;

  function handleSelectIndustry(ind: Industry) {
    setSelectedIndustry(ind);
    setCustomIndustry('');
  }

  function handleCustomConfirm(value: string) {
    setCustomIndustry(value);
    setSelectedIndustry(null);
  }

  function handleSubmit() {
    if (!hasSelection) return;
    navigate('/step/3');
  }

  return (
    <main className={`flex-1 container py-8${hasSelection ? ' pb-24' : ''}`}>
      <Step1Breadcrumb />

      <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface flex items-center gap-3">
        <span>{STEP1_PAGE_H1_EMOJI}</span>
        <span>{STEP1_PAGE_H1}</span>
      </h1>

      <p className="font-cn text-base text-muted-foreground mt-3">
        {STEP1_SUBTITLE_PART1}
        <span className="text-primary font-bold">{STEP1_SUBTITLE_COUNT}</span>
        {STEP1_SUBTITLE_PART2}
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline"
          onClick={() => setCustomModalOpen(true)}
          data-testid="subtitle-custom-link"
        >
          {STEP1_SUBTITLE_CUSTOM_LINK}
        </button>
        {STEP1_SUBTITLE_PART3}
      </p>

      <div className="relative max-w-3xl mb-6 mt-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={STEP1_SEARCH_PLACEHOLDER}
          data-testid="industry-search"
          className="w-full rounded-lg border border-border bg-card pl-10 pr-3 py-3 font-cn text-sm text-on-surface placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {STEP1_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`tab-${tab.id}`}
            data-state={activeTabId === tab.id ? 'active' : 'inactive'}
            onClick={() => setActiveTabId(tab.id)}
            className={[
              'rounded-lg px-4 py-2.5 font-cn text-sm transition-all cursor-pointer border whitespace-nowrap',
              activeTabId === tab.id
                ? 'bg-primary/10 border-primary text-primary font-bold'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40',
            ].join(' ')}
          >
            {tab.id !== 'all' ? `${tab.emoji} ` : ''}
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {selectedIndustry && (
        <Step1Banner industry={selectedIndustry} onConfirm={handleSubmit} />
      )}
      {customIndustry && (
        <Step1Banner customLabel={customIndustry} onConfirm={handleSubmit} />
      )}

      {filteredIndustries.length === 0 ? (
        <EmptyState title="未找到匹配的行业" description="尝试自定义输入" />
      ) : (
        <IndustryEmojiGrid
          industries={filteredIndustries}
          value={selectedIndustry}
          onChange={handleSelectIndustry}
        />
      )}

      <CustomIndustryModal
        open={customModalOpen}
        onOpenChange={setCustomModalOpen}
        hideTrigger
        onConfirm={handleCustomConfirm}
      />

      {hasSelection && (
        <Step1StickyBar
          selectedEmoji={selectedIndustry?.emoji ?? '✨'}
          selectedLabel={selectedIndustry?.label ?? customIndustry}
          isCustom={!!customIndustry}
          onConfirm={handleSubmit}
        />
      )}
    </main>
  );
}
