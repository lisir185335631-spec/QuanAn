/**
 * AiVideoResult — /ai-video 工具页结果渲染 · PRD-6 US-008
 * AC-2: 5-8 镜头卡片网格 (responsive grid-cols-2/3) · 每镜头含头部(编号+duration) + 中部(img/skeleton) + 底部(description+imagePromptEn折叠)
 * AC-4: polling · trpc.aiVideo.jobStatus useQuery refetchInterval:3000 · enabled when !allCompleted
 * AC-5: 全完成 banner '所有镜头已完成 · 查看历史'
 * AC-6: 失败 scene → placeholder + 重试按钮 (占位, toast '重试功能 PRD-7+')
 * AC-15: ?historyId=N 预填 + 完成状态
 * SHIELD REJ-035: polling 失败时 LS lastHistoryId 不回滚
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredScene {
  index: number;
  description: string;
  imagePromptEn: string;
  duration: string;
  sceneImageUrl: string | null;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

interface StoredStoryboardContent {
  title?: string;
  totalDuration?: string;
  scenes: StoredScene[];
}

interface SceneDisplayData {
  index: number;
  description: string;
  imagePromptEn: string;
  duration: string;
  status: 'pending' | 'completed' | 'failed';
  sceneImageUrl: string | null;
  error?: string;
}

interface AiVideoResultProps {
  historyId: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AiVideoResult({ historyId }: AiVideoResultProps) {
  const [allCompleted, setAllCompleted] = useState(false);
  const [pollingStallCount, setPollingStallCount] = useState(0);

  // Fetch history detail for scene descriptions, imagePromptEn, duration
  const { data: historyDetail } = trpc.history.detail.useQuery(
    { id: historyId },
    { enabled: !!historyId, staleTime: Infinity },
  );

  // Poll jobStatus every 3s while not allCompleted
  const { data: jobStatus } = trpc.aiVideo.jobStatus.useQuery(
    { historyId },
    {
      enabled: !!historyId && !allCompleted,
      refetchInterval: allCompleted ? false : 3000,
    },
  );

  // React to jobStatus changes — detect completion and stalls
  useEffect(() => {
    if (!jobStatus) return;
    if (jobStatus.completed === jobStatus.total && jobStatus.total > 0) {
      setAllCompleted(true);
    }
    // AC-14: stall detection — 5 polls with 0 completions
    if (jobStatus.completed === 0) {
      setPollingStallCount((c) => c + 1);
    } else {
      setPollingStallCount(0);
    }
  }, [jobStatus]);

  // Parse stored scenes from history detail (for description/imagePromptEn/duration)
  const storedScenes: StoredScene[] = (() => {
    if (!historyDetail?.content) return [];
    try {
      const parsed = JSON.parse(historyDetail.content) as StoredStoryboardContent;
      return parsed.scenes ?? [];
    } catch {
      return [];
    }
  })();

  // Merge: storedScenes for descriptions + jobStatus for live status/sceneImageUrl
  const mergedScenes: SceneDisplayData[] = storedScenes.map((stored) => {
    const live = jobStatus?.scenes.find((s) => s.index === stored.index);
    return {
      index: stored.index,
      description: stored.description,
      imagePromptEn: stored.imagePromptEn,
      duration: stored.duration,
      status: live?.status ?? stored.status,
      sceneImageUrl: live?.sceneImageUrl ?? stored.sceneImageUrl ?? null,
      error: live?.error ?? stored.error,
    };
  });

  // Show skeleton placeholders when history detail not yet loaded
  const scenesCount = jobStatus?.total ?? storedScenes.length;
  const displayScenes: SceneDisplayData[] = mergedScenes.length > 0
    ? mergedScenes
    : Array.from({ length: scenesCount > 0 ? scenesCount : 5 }, (_, i) => ({
        index: i + 1,
        description: '',
        imagePromptEn: '',
        duration: '',
        status: 'pending' as const,
        sceneImageUrl: null,
      }));

  // AC-5: stall hint after 5 polls with 0 completions
  const showStallHint = pollingStallCount >= 5 && !allCompleted;

  return (
    <div className="space-y-4" data-testid="ai-video-result">
      {/* AC-5: Completion banner */}
      {allCompleted && (
        <div
          className="rounded-lg border border-primary bg-primary/5 px-4 py-3 flex items-center gap-3"
          data-testid="ai-video-complete-banner"
          role="status"
        >
          <span className="text-primary text-lg">✓</span>
          <span className="text-body-sm font-medium text-on-surface">所有镜头已完成 · 查看历史</span>
        </div>
      )}

      {/* AC-14: stall hint */}
      {showStallHint && (
        <div
          className="rounded-lg border border-border bg-surface-container px-4 py-3"
          data-testid="ai-video-stall-hint"
          role="status"
        >
          <span className="text-body-sm text-muted-foreground">图片生成中 · 您可关闭页面</span>
        </div>
      )}

      {/* Scene grid: responsive 2 cols mobile / 3 cols md */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
        data-testid="ai-video-scene-grid"
      >
        {displayScenes.map((scene) => (
          <SceneCard key={scene.index} scene={scene} />
        ))}
      </div>
    </div>
  );
}

// ── Scene Card ────────────────────────────────────────────────────────────────

interface SceneCardProps {
  scene: SceneDisplayData;
}

function SceneCard({ scene }: SceneCardProps) {
  const [promptExpanded, setPromptExpanded] = useState(false);

  return (
    <Card
      className="overflow-hidden"
      data-testid={`ai-video-scene-card-${scene.index}`}
    >
      {/* Header: scene number + duration */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-container">
        <span className="text-label-sm font-label text-on-surface">
          镜头 {scene.index}
        </span>
        {scene.duration && (
          <span className="text-body-xs text-muted-foreground tabular-nums">
            {scene.duration}
          </span>
        )}
      </div>

      <CardContent className="p-0">
        {/* Image area */}
        <div
          className="relative aspect-video bg-surface-container flex items-center justify-center overflow-hidden"
          data-testid={`ai-video-scene-image-${scene.index}`}
        >
          {scene.status === 'completed' && scene.sceneImageUrl ? (
            <img
              src={scene.sceneImageUrl}
              alt={`镜头 ${scene.index}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : scene.status === 'failed' ? (
            // AC-6: failed scene placeholder + retry button
            <div className="flex flex-col items-center gap-2 p-4" data-testid={`ai-video-scene-failed-${scene.index}`}>
              <span className="text-muted-foreground text-2xl">⚠</span>
              <span className="text-body-xs text-muted-foreground">图片生成失败</span>
              <button
                type="button"
                className="mt-1 px-3 py-1 text-body-xs border border-border rounded-md text-on-surface hover:bg-surface-container transition-colors"
                data-testid={`ai-video-scene-retry-${scene.index}`}
                onClick={() => toast.info('重试功能 PRD-7+')}
              >
                重试
              </button>
            </div>
          ) : (
            // Skeleton + spinner for pending
            <div
              className="w-full h-full flex items-center justify-center"
              data-testid={`ai-video-scene-skeleton-${scene.index}`}
            >
              <div className="absolute inset-0 bg-surface-container animate-pulse" />
              <svg
                className="relative z-10 h-8 w-8 animate-spin text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Footer: scene description + imagePromptEn collapsible */}
        <div className="px-3 py-2 space-y-1">
          {scene.description && (
            <p className="text-body-xs text-on-surface line-clamp-2">{scene.description}</p>
          )}
          {scene.imagePromptEn && (
            <div>
              <button
                type="button"
                className="text-body-xs text-muted-foreground hover:text-on-surface transition-colors"
                onClick={() => setPromptExpanded((v) => !v)}
              >
                {promptExpanded ? '收起提示词 ▲' : '展开提示词 ▼'}
              </button>
              {promptExpanded && (
                <p className="mt-1 text-body-xs text-muted-foreground italic">{scene.imagePromptEn}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
