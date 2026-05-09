/**
 * Analysis.tsx — /analysis 工具页 · PRD-5 US-008
 * 真表单: ToolForm(toolKey=analysis) + copy textarea min 10 + 字符计数(react-hook-form watch)
 * LS-first dual-write: getToolLsKey(accountId, "analysis", "input") — handled by ToolForm (D-031 · AC-4)
 * submit → trpc.analysis.analyze.mutate({ copy }) → onSuccess setResult → <AnalysisResult>
 * <AnalysisResult> JSON.parse(data.content) → 5 维度 Progress bar
 * FeedbackButton: agentId=AnalysisAgent
 * AbortController on unmount
 * US-011: ?historyId → trpc.history.detail.useQuery → 预填 copy(inputSummary) + setResult(历史 content)
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedbackButton } from '@/components/FeedbackButton';
import { ToolForm } from '@/components/ToolForm/ToolForm';
import { AnalysisResult } from '@/components/ToolResult/AnalysisResult';
import { trpc } from '@/lib/trpc';
import { analysisStructuralInput } from '@quanqn/schemas/specialist-io';

import type { AnalysisHistoryRow } from '@quanqn/clients/router-types';

export default function Analysis() {
  const [result, setResult] = useState<AnalysisHistoryRow | null>(null);
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
      setResult(historyDetail as unknown as AnalysisHistoryRow);
    }
  }, [historyDetail]);

  const historyDefaults = historyDetail
    ? { copy: historyDetail.inputSummary }
    : undefined;

  const mutation = trpc.analysis.analyze.useMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    if (abortRef.current.signal.aborted) throw new Error('aborted');

    const row = await mutation.mutateAsync(
      data as { copy: string },
    );

    if (abortRef.current.signal.aborted) throw new Error('aborted');
    return row;
  }

  function handleSuccess(row: unknown) {
    setResult(row as AnalysisHistoryRow);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">文案结构分析</h1>
        <p className="mt-2 text-body-md text-muted-foreground">拆解爆款文案结构，提炼可复用写作框架</p>
      </div>

      <ToolForm
        toolKey="analysis"
        schema={analysisStructuralInput}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        submitLabel="开始分析"
        defaultValues={historyDefaults}
      />

      {result && (
        <div className="space-y-4">
          <AnalysisResult data={result} />
          <FeedbackButton stepKey="analysis" agentId="AnalysisAgent" />
        </div>
      )}
    </main>
  );
}
