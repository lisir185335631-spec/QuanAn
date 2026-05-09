/**
 * VideoAnalysis.tsx — /video-analysis 工具页 · PRD-5 US-010
 * 真表单: ToolForm(toolKey=video-analysis) + lastTitle input optional + lastCopy textarea min 10
 * LS-first dual-write: getToolLsKey(accountId, "video-analysis", "input") — handled by ToolForm (D-031 · AC-5)
 * submit → trpc.videoAnalysis.analyze.mutate({ lastTitle, lastCopy }) → onSuccess setResult
 * <VideoAnalysisResult> JSON.parse(data.content) → elements Badge tag + insights Card + rewriteVersion markdown
 * FeedbackButton: agentId=AnalysisAgent
 * AbortController on unmount
 * US-011: ?historyId → trpc.history.detail.useQuery → 预填 lastCopy(inputSummary) + setResult(历史 content)
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedbackButton } from '@/components/FeedbackButton';
import { ToolForm } from '@/components/ToolForm/ToolForm';
import { VideoAnalysisResult } from '@/components/ToolResult/VideoAnalysisResult';
import { trpc } from '@/lib/trpc';
import { analyzeVideoInput } from '@quanqn/schemas/specialist-io';

import type { VideoAnalysisHistoryRow } from '@quanqn/clients/router-types';

export default function VideoAnalysis() {
  const [result, setResult] = useState<VideoAnalysisHistoryRow | null>(null);
  const [searchParams] = useSearchParams();
  const historyId = searchParams.get('historyId') ? parseInt(searchParams.get('historyId')!, 10) : undefined;

  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  // US-011: ?historyId pre-fill
  const { data: historyDetail } = trpc.history.detail.useQuery(
    { id: historyId! },
    { enabled: !!historyId },
  );

  useEffect(() => {
    if (historyDetail) {
      setResult(historyDetail as unknown as VideoAnalysisHistoryRow);
    }
  }, [historyDetail]);

  const historyDefaults = historyDetail
    ? { lastCopy: historyDetail.inputSummary, lastTitle: '' }
    : undefined;

  const mutation = trpc.videoAnalysis.analyze.useMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    if (abortRef.current.signal.aborted) throw new Error('aborted');

    const row = await mutation.mutateAsync(
      data as { lastTitle?: string; lastCopy: string },
    );

    if (abortRef.current.signal.aborted) throw new Error('aborted');
    return row;
  }

  function handleSuccess(row: unknown) {
    setResult(row as VideoAnalysisHistoryRow);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">市场洞察</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">爆款文案解析</h1>
        <p className="mt-2 text-body-md text-muted-foreground">深度解析爆款视频文案，提取可迁移的写作公式</p>
      </div>

      <ToolForm
        toolKey="video-analysis"
        schema={analyzeVideoInput}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        submitLabel="开始深度解析"
        defaultValues={historyDefaults}
      />

      {result && (
        <div className="space-y-4">
          <VideoAnalysisResult data={result} />
          <FeedbackButton stepKey="videoAnalysis" agentId="AnalysisAgent" />
        </div>
      )}
    </main>
  );
}
