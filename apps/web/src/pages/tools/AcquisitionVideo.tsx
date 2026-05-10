/**
 * AcquisitionVideo.tsx — /acquisition-video 工具页 · PRD-6 US-006 · US-013
 * 真表单: ToolForm(toolKey=acquisition-video) + sourceCopy textarea min 10 + conversionGoal input required + platform select + duration select
 * LS-first dual-write: getToolLsKey(accountId, "acquisition-video", "input") — handled by ToolForm (D-031 · AC-4)
 * submit → trpc.acquisitionVideo.generate.mutate → onSuccess setResult → <AcquisitionVideoResult>
 * FeedbackButton: agentId=VideoAgent
 * AbortController on unmount
 * US-011 pattern: ?historyId → trpc.history.detail.useQuery → 预填 sourceCopy(inputSummary) + setResult(历史 content)
 * US-013 SHIELD REJ-010: ?historyId pre-fill → write defaults to LS namespace for persistence
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedbackButton } from '@/components/FeedbackButton';
import { ToolForm } from '@/components/ToolForm/ToolForm';
import { AcquisitionVideoResult } from '@/components/ToolResult/AcquisitionVideoResult';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getToolLsKey } from '@/lib/ls-namespace';
import { acquisitionVideoFrontendInput } from '@/lib/schemas/acquisitionVideoFrontend';
import { trpc } from '@/lib/trpc';

import type { AcquisitionVideoHistoryRow } from '@quanqn/clients/router-types';

export { acquisitionVideoFrontendInput } from '@/lib/schemas/acquisitionVideoFrontend';

export default function AcquisitionVideo() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const [result, setResult] = useState<AcquisitionVideoHistoryRow | null>(null);
  const [searchParams] = useSearchParams();
  const historyId = searchParams.get('historyId') ? parseInt(searchParams.get('historyId')!, 10) : undefined;

  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  // ?historyId pre-fill (US-011 pattern)
  const { data: historyDetail } = trpc.history.detail.useQuery(
    { id: historyId! },
    { enabled: !!historyId },
  );

  useEffect(() => {
    if (!historyDetail || accountId === null) return;
    setResult(historyDetail as unknown as AcquisitionVideoHistoryRow);
    // US-013 SHIELD REJ-010: write pre-filled input to LS so user doesn't lose state on navigation
    try {
      localStorage.setItem(
        getToolLsKey(accountId, 'acquisition-video', 'input'),
        JSON.stringify({ sourceCopy: historyDetail.inputSummary, conversionGoal: '', platform: '', duration: '' }),
      );
    } catch { /* storage full */ }
  }, [historyDetail, accountId]);

  const historyDefaults = historyDetail
    ? { sourceCopy: historyDetail.inputSummary, conversionGoal: '', platform: '', duration: '' }
    : undefined;

  const mutation = trpc.acquisitionVideo.generate.useMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    if (abortRef.current.signal.aborted) throw new Error('aborted');

    const row = await mutation.mutateAsync(
      data as {
        sourceCopy: string;
        conversionGoal: string;
        platform?: string;
        duration?: '15s' | '30s' | '60s' | '180s';
      },
    );

    if (abortRef.current.signal.aborted) throw new Error('aborted');
    return row;
  }

  function handleSuccess(row: unknown) {
    setResult(row as AcquisitionVideoHistoryRow);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">获客视频方案</h1>
        <p className="mt-2 text-body-md text-muted-foreground">从原始文案生成转化导向的获客视频脚本：完整文案 + CTA 指令 + 转化路径</p>
      </div>

      <ToolForm
        toolKey="acquisition-video"
        schema={acquisitionVideoFrontendInput}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        submitLabel="生成方案"
        defaultValues={historyDefaults}
      />

      {result && (
        <div className="space-y-4">
          <AcquisitionVideoResult data={result} />
          <FeedbackButton stepKey="acquisition-video" agentId="VideoAgent" />
        </div>
      )}
    </main>
  );
}
