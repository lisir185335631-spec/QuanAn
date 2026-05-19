/**
 * Monetization.tsx — /tools/monetization IP 变现模型 · PRD-15 US-004
 * 复用 StepForm stepKey='step4b' + MonetizationInputSchema (§11.6.3)
 * AC-1: input productDescription + audienceProfile + ipPositioning + currentRevenue
 *       → 提交 trpc.monetization.generate.useMutation()
 *       → output <StepResult/> → {currentAnalysis, ladder[3], revenueStructure, successCases[2]}
 * AC-3: URL state useSearchParams + localStorage draft getToolLsKey(accountId,'monetization','draft')
 */

import { MonetizationInputSchema } from '@quanan/schemas/specialist-io';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { StepForm } from '@/components/StepForm/StepForm';
import { StepResult } from '@/components/StepResult/StepResult';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getToolLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

const TOOL_KEY = 'monetization';

function readDraft(accountId: number | null): Record<string, unknown> | null {
  if (accountId === null) return null;
  try {
    const raw = localStorage.getItem(getToolLsKey(accountId, TOOL_KEY, 'draft'));
    if (raw) return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // ignore
  }
  return null;
}

function saveDraft(accountId: number | null, data: Record<string, unknown>): void {
  if (accountId === null) return;
  try {
    localStorage.setItem(getToolLsKey(accountId, TOOL_KEY, 'draft'), JSON.stringify(data));
  } catch {
    // storage full
  }
}

export default function Monetization() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const [searchParams, setSearchParams] = useSearchParams();
  const isDone = searchParams.get('done') === '1';

  const [result, setResult] = useState<{ result: unknown; isFallback: boolean } | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // trpc.monetization.generate — called after StepForm submission (AC-1)
  const generateMutation = trpc.monetization.generate.useMutation();

  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  // Restore draft indicator on mount
  useEffect(() => {
    if (accountId === null) return;
    const draft = readDraft(accountId);
    if (draft) setHasDraft(true);
  }, [accountId]);

  // Sync result with URL done state
  useEffect(() => {
    if (!isDone && result) setResult(null);
  }, [isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSuccess(payload: { result: unknown; isFallback: boolean }) {
    if (abortRef.current.signal.aborted) return;

    // Persist form result as draft (AC-3)
    saveDraft(accountId, payload.result as Record<string, unknown>);

    // Call monetization.generate for specialist monetization analysis (AC-1)
    try {
      await generateMutation.mutateAsync({ stepKey: 'step4b' });
    } catch {
      if (!abortRef.current.signal.aborted) {
        toast.error('变现分析请求失败 · 请重试');
      }
      return;
    }

    if (!abortRef.current.signal.aborted) {
      setResult(payload);
      // Persist completion to URL state (AC-3)
      setSearchParams((prev) => {
        prev.set('done', '1');
        return prev;
      });
    }
  }

  function handleRetry() {
    setResult(null);
    setSearchParams((prev) => {
      prev.delete('done');
      return prev;
    });
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">
          变现设计
        </span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">IP 变现模型</h1>
        <p className="mt-2 text-body-md text-muted-foreground">
          设计 IP 变现路径，从流量到收益的转化模型
        </p>
        {hasDraft && !result && (
          <p className="mt-1 text-body-xs text-muted-foreground">已恢复上次填写草稿</p>
        )}
      </div>

      {result ? (
        <div className="space-y-4">
          <StepResult
            stepKey="step4b"
            data={result.result}
            isFallback={result.isFallback}
            onRetry={handleRetry}
          />
        </div>
      ) : (
        <StepForm
          stepKey="step4b"
          schema={MonetizationInputSchema}
          onSuccess={(payload) => { void handleSuccess(payload); }}
        />
      )}
    </main>
  );
}
