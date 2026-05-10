/**
 * AiVideo.tsx — /ai-video 工具页 · PRD-6 US-008
 * 真表单: ToolForm(toolKey=ai-video) + sourceCopy textarea + scenesCount select 5-8 + imageStyle select
 * submit → trpc.aiVideo.generateStoryboard.mutate → historyId + jobIds
 * 提交后立即跳结果区 AiVideoResult(polling 5-8 镜头 skeleton → 真图)
 * LS-first dual-write (SHIELD REJ-010): getToolLsKey(accountId, 'ai-video', 'active_polling') → { historyId, jobIds }
 * SHIELD REJ-035: polling fail 不清 LS lastHistoryId
 * ?historyId=N: 恢复 polling 当前 historyId · 镜头网格继续显示
 * rate limit (TOO_MANY_REQUESTS) → '今日已达上限 · 明日再来' + disabled 按钮
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { AiVideoResult } from '@/components/ToolResult/AiVideoResult';
import { ToolForm } from '@/components/ToolForm/ToolForm';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getToolLsKey } from '@/lib/ls-namespace';
import { aiVideoFrontendInput } from '@/lib/schemas/aiVideoFrontend';
import { trpc } from '@/lib/trpc';

import type { GenerateStoryboardOutput } from '@quanqn/clients/router-types';

// ── LS types ──────────────────────────────────────────────────────────────────

interface PollingLsData {
  historyId: number;
  jobIds: string[];
}

// ── Page component ────────────────────────────────────────────────────────────

export default function AiVideo() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const [searchParams] = useSearchParams();
  const queryHistoryId = searchParams.get('historyId') ? parseInt(searchParams.get('historyId')!, 10) : undefined;

  const [activeHistory, setActiveHistory] = useState<{ historyId: number; jobIds: string[] } | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // US-011 AC-4: daily usage query (read-only · no INCR)
  const dailyUsageQuery = trpc.aiVideo.dailyUsage.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const usageCount = dailyUsageQuery.data?.count ?? 0;
  const usageLimit = dailyUsageQuery.data?.limit ?? 10;
  const isOverLimit = usageCount >= usageLimit || isRateLimited;

  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  // ?historyId=N: show history polling view (AC-16)
  useEffect(() => {
    if (queryHistoryId && !activeHistory) {
      setActiveHistory({ historyId: queryHistoryId, jobIds: [] });
    }
  }, [queryHistoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  // LS restore on mount (SHIELD REJ-010 · AC-15)
  useEffect(() => {
    if (accountId === null || activeHistory || queryHistoryId) return;
    try {
      const stored = localStorage.getItem(getToolLsKey(accountId, 'ai-video', 'active_polling'));
      if (stored) {
        const parsed = JSON.parse(stored) as PollingLsData;
        if (parsed.historyId) {
          setActiveHistory({ historyId: parsed.historyId, jobIds: parsed.jobIds ?? [] });
        }
      }
    } catch {
      // ignore malformed LS
    }
  }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = trpc.aiVideo.generateStoryboard.useMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    if (abortRef.current.signal.aborted) throw new Error('aborted');

    let result: GenerateStoryboardOutput;
    try {
      result = await mutation.mutateAsync({
        sourceCopy: data.sourceCopy as string,
        scenesCount: data.scenesCount as number,
        imageStyle: data.imageStyle as 'vivid' | 'natural',
      });
    } catch (err: unknown) {
      // AC-13: TOO_MANY_REQUESTS → rate limit UI
      const errData = (err as { data?: { code?: string }; message?: string }) ?? {};
      if (errData?.data?.code === 'TOO_MANY_REQUESTS' || String(errData?.message ?? '').includes('TOO_MANY_REQUESTS')) {
        setIsRateLimited(true);
        void dailyUsageQuery.refetch();
        toast.error('今日已达上限 · 明日再来');
      }
      throw err;
    }

    if (abortRef.current.signal.aborted) throw new Error('aborted');
    return result;
  }

  function handleSuccess(row: unknown) {
    const result = row as GenerateStoryboardOutput;
    const { historyId, jobIds } = result;

    // SHIELD REJ-010: LS write with account namespace (not plain key)
    if (accountId !== null) {
      try {
        localStorage.setItem(
          getToolLsKey(accountId, 'ai-video', 'active_polling'),
          JSON.stringify({ historyId, jobIds } satisfies PollingLsData),
        );
      } catch {
        // Storage full — continue
      }
    }

    setActiveHistory({ historyId, jobIds });
    setIsRateLimited(false);
    void dailyUsageQuery.refetch();
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">一键生成 AI 视频</h1>
        <p className="mt-2 text-body-md text-muted-foreground">从原始文案自动生成分镜脚本 + AI 配图，一键出片</p>
      </div>

      {/* US-011 AC-4: daily usage display */}
      {dailyUsageQuery.data && (
        <div
          className="flex items-center gap-2 text-body-sm text-muted-foreground"
          data-testid="ai-video-daily-usage"
        >
          <span>今日剩余 {Math.max(0, usageLimit - usageCount)} 次</span>
          <span className="text-muted-foreground/50">({usageCount}/{usageLimit})</span>
        </div>
      )}

      <ToolForm
        toolKey="ai-video"
        schema={aiVideoFrontendInput}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        submitLabel="生成 AI 视频"
        disabled={isOverLimit}
        disabledLabel={`今日已达上限 (${usageCount}/${usageLimit}) · 明日再来`}
      />

      {activeHistory && (
        <AiVideoResult historyId={activeHistory.historyId} />
      )}
    </main>
  );
}
