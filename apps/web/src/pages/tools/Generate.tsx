/**
 * Generate.tsx — /generate 工具页 · PRD-5 US-004 · PRD-6 US-012 · US-013
 * mode select: 'free'(自由创作) | 'acquisition'(获客文案)
 * free mode: ToolForm(toolKey=freeGenerate) + copywritingFreeGenerateInput → trpc.copywriting.freeGenerate
 * acquisition mode: ToolForm(toolKey=acquisition) + acquisitionCopywritingInputSchema → trpc.copywriting.acquisitionGenerate
 * LS-first dual-write per mode namespace (D-031)
 * AbortController on unmount (AC-8)
 * US-011 stub: ?historyId=xxx → trpc.history.detail.useQuery → 预填 defaultValues
 * US-013 AC-6: ?mode=acquisition → switch to acquisition mode + write LS namespace (SHIELD REJ-010)
 */

import { acquisitionCopywritingInputSchema, copywritingFreeGenerateInput } from '@quanqn/schemas/specialist-io';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedbackButton } from '@/components/FeedbackButton';
import { ToolForm } from '@/components/ToolForm/ToolForm';
import { ToolResult } from '@/components/ToolResult/ToolResult';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getToolLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

import type { FreeGenerateHistoryRow } from '@quanqn/clients/router-types';

type GenerateMode = 'free' | 'acquisition';

export default function Generate() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const [mode, setMode] = useState<GenerateMode>('free');
  const [result, setResult] = useState<FreeGenerateHistoryRow | null>(null);
  const [searchParams] = useSearchParams();
  const rawHistoryId = searchParams.get('historyId') ?? searchParams.get('restored');
  const historyId = rawHistoryId ? parseInt(rawHistoryId, 10) : undefined;
  const topicFromUrl = searchParams.get('topic') ?? '';
  const searchParamsMode = searchParams.get('mode') as GenerateMode | null;

  // AbortController on unmount (AC-8)
  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  // LS-first restore: read saved input under freeGenerate namespace (AC-3 · D-031)
  const [lsDefaults] = useState<Record<string, unknown> | undefined>(() => {
    if (accountId === null) return undefined;
    try {
      const stored = localStorage.getItem(getToolLsKey(accountId, 'freeGenerate', 'input'));
      if (stored) return JSON.parse(stored) as Record<string, unknown>;
    } catch {
      // ignore malformed LS
    }
    return undefined;
  });

  // US-013 AC-6: ?mode=acquisition → switch mode
  useEffect(() => {
    if (searchParamsMode === 'acquisition') {
      setMode('acquisition');
    }
  }, [searchParamsMode]);

  // US-011 stub: ?historyId pre-fill
  const { data: historyDetail } = trpc.history.detail.useQuery(
    { id: historyId! },
    { enabled: !!historyId },
  );

  // Merge history pre-fill into defaults; write to LS for the active mode (SHIELD REJ-010)
  useEffect(() => {
    if (!historyDetail || accountId === null) return;
    const activeMode = searchParamsMode === 'acquisition' ? 'acquisition' : mode;
    const toolNamespace = activeMode === 'acquisition' ? 'acquisition' : 'freeGenerate';
    const inputDefaults =
      activeMode === 'acquisition'
        ? { scriptType: historyDetail.scriptType ?? '', elements: historyDetail.elements ?? [], conversionGoal: '', topic: topicFromUrl || historyDetail.inputSummary || '' }
        : { scriptType: historyDetail.scriptType ?? '', elements: historyDetail.elements ?? [], topic: topicFromUrl || historyDetail.inputSummary || '' };
    try {
      localStorage.setItem(getToolLsKey(accountId, toolNamespace, 'input'), JSON.stringify(inputDefaults));
    } catch { /* storage full */ }
  }, [historyDetail, accountId, searchParamsMode, mode, topicFromUrl]);

  const historyDefaults = historyDetail
    ? {
        scriptType: historyDetail.scriptType ?? '',
        elements: historyDetail.elements ?? [],
        topic: topicFromUrl || historyDetail.inputSummary || '',
      }
    : undefined;

  const resolvedDefaults = historyDefaults ?? lsDefaults ?? (topicFromUrl ? { topic: topicFromUrl } : undefined);

  const freeMutation = trpc.copywriting.freeGenerate.useMutation();
  const acquisitionMutation = trpc.copywriting.acquisitionGenerate.useMutation();

  async function handleFreeSubmit(data: Record<string, unknown>) {
    // REJ-035: LS先写 — DB fail 时 LS 保留(不回滚)
    if (accountId !== null) {
      try {
        localStorage.setItem(
          getToolLsKey(accountId, 'freeGenerate', 'input'),
          JSON.stringify(data),
        );
      } catch {
        // Storage full — continue
      }
    }

    if (abortRef.current.signal.aborted) throw new Error('aborted');

    const row = await freeMutation.mutateAsync(
      data as { scriptType: string; elements: string[]; topic: string },
    );

    if (abortRef.current.signal.aborted) throw new Error('aborted');
    return row;
  }

  async function handleAcquisitionSubmit(data: Record<string, unknown>) {
    if (accountId !== null) {
      try {
        localStorage.setItem(
          getToolLsKey(accountId, 'acquisition', 'input'),
          JSON.stringify(data),
        );
      } catch {
        // Storage full — continue
      }
    }

    if (abortRef.current.signal.aborted) throw new Error('aborted');

    const row = await acquisitionMutation.mutateAsync(
      data as { scriptType: string; elements: string[]; conversionGoal: string; topic: string },
    );

    if (abortRef.current.signal.aborted) throw new Error('aborted');
    return row;
  }

  function handleSuccess(row: unknown) {
    setResult(row as FreeGenerateHistoryRow);
  }

  // Reset result when mode changes
  function handleModeChange(newMode: GenerateMode) {
    setMode(newMode);
    setResult(null);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">AI 智能生成</h1>
        <p className="mt-2 text-body-md text-muted-foreground">智能生成符合 IP 定位的高质量内容脚本</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2" role="tablist" aria-label="生成模式">
        <button
          role="tab"
          aria-selected={mode === 'free'}
          onClick={() => handleModeChange('free')}
          className={cn(
            'px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors',
            mode === 'free'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
          data-testid="mode-tab-free"
        >
          自由创作
        </button>
        <button
          role="tab"
          aria-selected={mode === 'acquisition'}
          onClick={() => handleModeChange('acquisition')}
          className={cn(
            'px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors',
            mode === 'acquisition'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
          data-testid="mode-tab-acquisition"
        >
          获客文案
        </button>
      </div>

      {mode === 'free' && (
        <ToolForm
          toolKey="freeGenerate"
          schema={copywritingFreeGenerateInput}
          onSubmit={handleFreeSubmit}
          onSuccess={handleSuccess}
          defaultValues={resolvedDefaults}
        />
      )}

      {mode === 'acquisition' && (
        <ToolForm
          toolKey="acquisition"
          schema={acquisitionCopywritingInputSchema}
          onSubmit={handleAcquisitionSubmit}
          onSuccess={handleSuccess}
          submitLabel="生成获客文案"
        />
      )}

      {result && (
        <div className="space-y-4">
          <ToolResult
            toolKey={mode === 'acquisition' ? 'acquisition' : 'freeGenerate'}
            data={result}
            isFallback={result.isFallback}
          />
          <FeedbackButton stepKey={mode === 'acquisition' ? 'acquisitionGenerate' : 'freeGenerate'} agentId="CopywritingAgent" />
        </div>
      )}
    </main>
  );
}
