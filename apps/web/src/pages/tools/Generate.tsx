/**
 * Generate.tsx — /generate 工具页 · PRD-5 US-004
 * 真表单: ToolForm(toolKey=freeGenerate) + ScriptTypeSelect + ElementsMultiSelect + TextareaField topic
 * LS-first dual-write (REJ-035): getToolLsKey(accountId, "freeGenerate", "input") (D-031)
 * AbortController on unmount (AC-8)
 * US-011 stub: ?historyId=xxx → trpc.history.detail.useQuery → 预填 defaultValues
 */

import { copywritingFreeGenerateInput } from '@quanqn/schemas/specialist-io';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedbackButton } from '@/components/FeedbackButton';
import { ToolForm } from '@/components/ToolForm/ToolForm';
import { ToolResult } from '@/components/ToolResult/ToolResult';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getToolLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

import type { FreeGenerateHistoryRow } from '@quanqn/clients/router-types';

export default function Generate() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const [result, setResult] = useState<FreeGenerateHistoryRow | null>(null);
  const [searchParams] = useSearchParams();
  const historyId = searchParams.get('historyId') ? parseInt(searchParams.get('historyId')!, 10) : undefined;

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

  // US-011 stub: ?historyId pre-fill (接入 US-011 再激活)
  const { data: historyDetail } = trpc.history.detail.useQuery(
    { id: historyId! },
    { enabled: !!historyId },
  );

  // Merge history pre-fill into defaults if historyId is present
  const historyDefaults = historyDetail
    ? {
        scriptType: historyDetail.scriptType ?? '',
        elements: historyDetail.elements ?? [],
        topic: '',
      }
    : undefined;

  const resolvedDefaults = historyDefaults ?? lsDefaults;

  const mutation = trpc.copywriting.freeGenerate.useMutation();

  async function handleSubmit(data: Record<string, unknown>) {
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

    const row = await mutation.mutateAsync(
      data as { scriptType: string; elements: string[]; topic: string },
    );

    if (abortRef.current.signal.aborted) throw new Error('aborted');
    return row;
  }

  function handleSuccess(row: unknown) {
    setResult(row as FreeGenerateHistoryRow);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">AI 智能生成</h1>
        <p className="mt-2 text-body-md text-muted-foreground">智能生成符合 IP 定位的高质量内容脚本</p>
      </div>

      <ToolForm
        toolKey="freeGenerate"
        schema={copywritingFreeGenerateInput}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        defaultValues={resolvedDefaults}
      />

      {result && (
        <div className="space-y-4">
          <ToolResult
            toolKey="freeGenerate"
            data={result}
            isFallback={result.isFallback}
          />
          <FeedbackButton stepKey="freeGenerate" agentId="CopywritingAgent" />
        </div>
      )}
    </main>
  );
}
