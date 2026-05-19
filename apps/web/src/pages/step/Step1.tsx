import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CustomIndustryModal } from '@/components/industry/CustomIndustryModal';
import { IndustryEmojiGrid } from '@/components/industry/IndustryEmojiGrid';
import { EmptyState } from '@/components/states';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { useStepData } from '@/hooks/useStepData';
import {
  type Industry,
  STEP1_INDUSTRIES_56,
  STEP1_SEARCH_PLACEHOLDER,
  STEP1_TABS,
} from '@/lib/constants/industries';

// D1=A 字面锁 — D-224 + spec §7.1
const STEP1_LABEL = 'STEP 01 · 选择行业赛道' as const;
const STEP1_H1 = '选择你的行业赛道' as const;
const STEP1_SUBTITLE =
  '覆盖抖音、视频号等主流平台的 56+ 个细分行业。你也可以自定义输入行业。' as const;
const STEP1_CTA = '确认并进入下一步' as const;

export default function Step1() {
  const navigate = useNavigate();
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save } = useStepData(accountId, 'step1');

  const [activeTabId, setActiveTabId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [customIndustry, setCustomIndustry] = useState<string>('');

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

  const isCtaDisabled = !selectedIndustry && !customIndustry;

  function handleSelectIndustry(ind: Industry) {
    setSelectedIndustry(ind);
    setCustomIndustry('');
  }

  function handleCustomConfirm(value: string) {
    setCustomIndustry(value);
    setSelectedIndustry(null);
  }

  function handleSubmit() {
    if (isCtaDisabled) return;
    save({
      industry: selectedIndustry?.id ?? 'other',
      industryLabel: selectedIndustry?.label ?? customIndustry,
      ...(customIndustry ? { customIndustry } : {}),
    });
    navigate('/step/3');
  }

  return (
    <main className="flex-1 container py-8">
      {/* 已选状态卡 — 选中行业或自定义行业时显示 */}
      {selectedIndustry && (
        <div className="glass-card border-primary/40 bg-primary/5 rounded-lg p-4 mb-6 flex items-start gap-4">
          <span className="text-3xl">{selectedIndustry.emoji}</span>
          <div>
            <p className="text-body-sm font-cn text-on-surface">
              已选择：{selectedIndustry.label}
            </p>
            {selectedIndustry.keywords && selectedIndustry.keywords.length > 0 && (
              <p className="text-body-sm text-muted-foreground mt-1">
                {selectedIndustry.keywords.join('、')}
              </p>
            )}
          </div>
        </div>
      )}
      {customIndustry && (
        <div className="glass-card border-primary/40 bg-primary/5 rounded-lg p-4 mb-6 flex items-start gap-4">
          <span className="text-3xl">✨</span>
          <div>
            <p className="text-body-sm font-cn text-on-surface">
              已选择：{customIndustry}（自定义）
            </p>
          </div>
        </div>
      )}

      {/* 顶部副标签 D-224 */}
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP1_LABEL}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP1_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-6">{STEP1_SUBTITLE}</p>

      {/* 搜索框 AC-4 · 含搜索 icon button(+1 DOM button) */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={STEP1_SEARCH_PLACEHOLDER}
          data-testid="industry-search"
          className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 pr-9 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="button"
          aria-label="搜索"
          data-testid="industry-search-btn"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-on-surface"
        >
          <Search size={16} />
        </button>
      </div>

      {/* 6 tabs 横向滚动 AC-3 D-218 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STEP1_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`tab-${tab.id}`}
            data-state={activeTabId === tab.id ? 'active' : 'inactive'}
            onClick={() => setActiveTabId(tab.id)}
            className={[
              'flex-shrink-0 rounded-md px-3 py-2 text-body-sm text-center transition-colors whitespace-nowrap',
              activeTabId === tab.id
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-surface-container text-muted-foreground border border-border hover:bg-surface-container-high',
            ].join(' ')}
          >
            {/* D-218: tab 1 "全部行业 (56)" 无 emoji · tab 2-6 有 emoji */}
            {tab.id !== 'all' ? `${tab.emoji} ` : ''}
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* 行业卡网格 AC-5 */}
      {filteredIndustries.length === 0 ? (
        <EmptyState title="未找到匹配的行业" description="尝试自定义输入" />
      ) : (
        <div className="mb-6">
          <IndustryEmojiGrid
            industries={filteredIndustries}
            value={selectedIndustry}
            onChange={handleSelectIndustry}
          />
        </div>
      )}

      {/* 自定义输入行业 AC-7 D1A 字面 */}
      <div className="mb-4 text-center">
        <CustomIndustryModal onConfirm={handleCustomConfirm} />
      </div>

      {/* 主 CTA AC-8 */}
      <div className="mt-4">
        <button
          type="button"
          disabled={isCtaDisabled}
          onClick={handleSubmit}
          data-testid="step1-cta"
          className={[
            'w-full rounded-lg px-6 py-3 text-body-md font-label transition-colors',
            isCtaDisabled
              ? 'bg-surface-container text-muted-foreground cursor-not-allowed'
              : 'bg-gradient-to-r from-primary to-primary/60 hover:from-primary/90 hover:to-primary/50 text-on-primary cursor-pointer',
          ].join(' ')}
        >
          {STEP1_CTA}
        </button>
      </div>
    </main>
  );
}
