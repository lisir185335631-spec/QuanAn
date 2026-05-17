import { Step1InputSchema } from '@quanqn/schemas/specialist-io';
import { useState } from 'react';

import { EmptyState } from '@/components/states';
import { StepForm } from '@/components/StepForm/StepForm';
import { StepResult } from '@/components/StepResult/StepResult';
import { STEP1_INDUSTRIES_56, STEP1_SEARCH_PLACEHOLDER } from '@/lib/constants/industries';
import { stepConfig } from '@/lib/stepConfig';

const data = stepConfig.get('step1')!;

export default function Step1() {
  const [result, setResult] = useState<{ result: unknown; isFallback: boolean } | null>(null);
  const [industrySearch, setIndustrySearch] = useState('');

  const filteredIndustries = industrySearch.trim()
    ? STEP1_INDUSTRIES_56.filter(
        (ind) =>
          ind.label.includes(industrySearch) ||
          ind.id.includes(industrySearch) ||
          (ind.keywords ?? []).some((kw) => kw.includes(industrySearch)),
      )
    : STEP1_INDUSTRIES_56;

  const isSearchEmpty = industrySearch.trim().length > 0 && filteredIndustries.length === 0;

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-2">{data.title}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{data.description}</p>
      {result ? (
        <StepResult stepKey="step1" data={result.result} isFallback={result.isFallback} onRetry={() => setResult(null)} />
      ) : (
        <>
          <div className="max-w-2xl mb-4">
            <input
              type="text"
              value={industrySearch}
              onChange={(e) => setIndustrySearch(e.target.value)}
              placeholder={STEP1_SEARCH_PLACEHOLDER}
              className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {isSearchEmpty ? (
            <EmptyState
              title="没有匹配的行业"
              description="请尝试其他关键词，或清除搜索后直接选择"
              action={
                <button
                  type="button"
                  onClick={() => setIndustrySearch('')}
                  className="rounded-md border border-border px-4 py-1.5 text-body-sm hover:bg-surface-container"
                >
                  清除搜索
                </button>
              }
            />
          ) : (
            <StepForm stepKey="step1" schema={Step1InputSchema} onSuccess={setResult} />
          )}
        </>
      )}
    </main>
  );
}
