/**
 * VideoProduction.tsx — /video-production 工具页 · PRD-6 US-004 · US-013
 * 真表单: ToolForm(toolKey=video-production) + sourceCopy textarea min 10 + videoType select + duration select + additionalContext textarea
 * LS-first dual-write: getToolLsKey(accountId, "video-production", "input") — handled by ToolForm (D-031 · AC-4)
 * submit → trpc.videoProduction.generate.mutate → onSuccess setResult → <VideoProductionResult>
 * FeedbackButton: agentId=VideoAgent
 * AbortController on unmount
 * US-011 pattern: ?historyId → trpc.history.detail.useQuery → 预填 sourceCopy(inputSummary) + setResult(历史 content)
 * US-013 SHIELD REJ-010: ?historyId pre-fill → write defaults to LS namespace for persistence
 */

import { videoProductionInput } from '@quanqn/schemas/specialist-io';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedbackButton } from '@/components/FeedbackButton';
import { ToolForm } from '@/components/ToolForm/ToolForm';
import { VideoProductionResult } from '@/components/ToolResult/VideoProductionResult';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getToolLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

import type { VideoProductionHistoryRow } from '@quanqn/clients/router-types';

export default function VideoProduction() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const [result, setResult] = useState<VideoProductionHistoryRow | null>(null);
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
    setResult(historyDetail as unknown as VideoProductionHistoryRow);
    // US-013 SHIELD REJ-010: write pre-filled input to LS so user doesn't lose state on navigation
    try {
      localStorage.setItem(
        getToolLsKey(accountId, 'video-production', 'input'),
        JSON.stringify({ sourceCopy: historyDetail.inputSummary, videoType: '', duration: '', additionalContext: '' }),
      );
    } catch { /* storage full */ }
  }, [historyDetail, accountId]);

  const historyDefaults = historyDetail
    ? { sourceCopy: historyDetail.inputSummary, videoType: '', duration: '', additionalContext: '' }
    : undefined;

  const mutation = trpc.videoProduction.generate.useMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    if (abortRef.current.signal.aborted) throw new Error('aborted');

    const row = await mutation.mutateAsync(
      data as { sourceCopy: string; videoType?: 'short_form' | 'long_form'; duration?: '15s' | '30s' | '60s' | '180s'; additionalContext?: string },
    );

    if (abortRef.current.signal.aborted) throw new Error('aborted');
    return row;
  }

  function handleSuccess(row: unknown) {
    setResult(row as VideoProductionHistoryRow);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">短视频制作</h1>
        <p className="mt-2 text-body-md text-muted-foreground">从原始文案生成完整制作方案：分镜脚本 + 设备清单 + 拍摄排期</p>
      </div>

      <ToolForm
        toolKey="video-production"
        schema={videoProductionInput}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        submitLabel="生成方案"
        defaultValues={historyDefaults}
      />

      {result && (
        <div className="space-y-4">
          <VideoProductionResult data={result} />
          <FeedbackButton stepKey="video-production" agentId="VideoAgent" />
        </div>
      )}
    </main>
  );
}
