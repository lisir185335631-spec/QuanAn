/**
 * BoomGenerate.tsx — /boom-generate 工具页 · PRD-5 US-006
 * 真表单: ToolForm(toolKey=boom-generate) + ElementsMultiSelect + industry input + theme input
 * industry default 用 useActiveAccount 读 active account.industry (AC-5 · 用户可手动覆盖)
 * LS-first dual-write: getToolLsKey(accountId, "boomGenerate", "input") (D-031 · AC-4)
 * submit → trpc.boomGenerate.generate.mutate → onSuccess setResult → <BoomGenerateResult>
 * <BoomGenerateResult> split content '---' → 5 Card grid md:grid-cols-2
 * AbortController on unmount
 * US-011: ?historyId → trpc.history.detail.useQuery → 预填 elements/industry/theme + setResult(历史 content)
 */

import { generateBoomInput } from '@quanan/schemas/specialist-io';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedbackButton } from '@/components/FeedbackButton';
import { ToolForm } from '@/components/ToolForm/ToolForm';
import { BoomGenerateResult } from '@/components/ToolResult/BoomGenerateResult';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getToolLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

import type { BoomGenerateHistoryRow } from '@quanan/clients/router-types';

export default function BoomGenerate() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const [result, setResult] = useState<BoomGenerateHistoryRow | null>(null);
  const [searchParams] = useSearchParams();
  const historyId = searchParams.get('historyId') ? parseInt(searchParams.get('historyId')!, 10) : undefined;

  // AbortController on unmount
  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  // AC-5: industry default from active account (user can override)
  const industryDefault = (account as { industry?: string } | null)?.industry ?? '';

  // LS-first restore: read saved input under boomGenerate namespace (D-031 · AC-4)
  const [lsDefaults] = useState<Record<string, unknown> | undefined>(() => {
    if (accountId === null) return undefined;
    try {
      const stored = localStorage.getItem(getToolLsKey(accountId, 'boomGenerate', 'input'));
      if (stored) return JSON.parse(stored) as Record<string, unknown>;
    } catch {
      // ignore malformed LS
    }
    return undefined;
  });

  // US-011: ?historyId pre-fill
  const { data: historyDetail } = trpc.history.detail.useQuery(
    { id: historyId! },
    { enabled: !!historyId },
  );

  useEffect(() => {
    if (historyDetail) {
      setResult(historyDetail as unknown as BoomGenerateHistoryRow);
    }
  }, [historyDetail]);

  const historyDefaults = historyDetail
    ? {
        elements: historyDetail.elements ?? [],
        industry: industryDefault,
        theme: '',
      }
    : undefined;

  // Merge: history > LS > account industry default
  const resolvedDefaults: Record<string, unknown> = historyDefaults ?? lsDefaults ?? {
    elements: [],
    industry: industryDefault,
    theme: '',
  };

  const mutation = trpc.boomGenerate.generate.useMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    // REJ-035: LS先写 — DB fail 时 LS 保留(不回滚)
    if (accountId !== null) {
      try {
        localStorage.setItem(
          getToolLsKey(accountId, 'boomGenerate', 'input'),
          JSON.stringify(data),
        );
      } catch {
        // Storage full — continue
      }
    }

    if (abortRef.current.signal.aborted) throw new Error('aborted');

    const row = await mutation.mutateAsync(
      data as { elements: string[]; industry?: string; theme?: string },
    );

    if (abortRef.current.signal.aborted) throw new Error('aborted');
    return row;
  }

  function handleSuccess(row: unknown) {
    setResult(row as BoomGenerateHistoryRow);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">一键生成爆款文案</h1>
        <p className="mt-2 text-body-md text-muted-foreground">选择爆款元素组合，AI 同时生成 5 篇差异化内容</p>
      </div>

      <ToolForm
        toolKey="boom-generate"
        schema={generateBoomInput}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        defaultValues={resolvedDefaults}
        submitLabel="一键生成爆款文案"
      />

      {result && (
        <div className="space-y-4">
          <BoomGenerateResult data={result} />
          <FeedbackButton stepKey="boomGenerate" agentId="CopywritingAgent" />
        </div>
      )}
    </main>
  );
}
