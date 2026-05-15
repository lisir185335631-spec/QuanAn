/**
 * PrivateDomain.tsx — /tools/private-domain 私域成交流程工具 · PRD-15 US-005
 * 1:1 实现 ui/_1/_5/_7/_14 4 设计稿(4 view mode)
 * AC-1: 400+ 行完整实现(18 行 stub → 全功能页面)
 * AC-6: URL state ?view=flow|config|result|history 切换
 * AC-7: localStorage draft private_domain_draft_${userId} debounce 1s 持久化
 * AC-3: 配置表单 6 字段 productDescription/productPrice/targetAudience/ipPositioning/currentChannel/monthlyTraffic
 * AC-4: 提交后调 trpc.privateDomain.generate.useMutation() · 渲染 6 阶段完整 SOP
 * AC-5: 历史回看 · DenseTable + 点击恢复 View 1-3 状态
 * AC-8: PrivateDomainAgent SSE 流式输出 · 每阶段独立 chunk · cost_log 写入
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { useAuth } from '@/hooks/useAuth';
import { LS_PREFIX } from '@/lib/ls-namespace';
import { trpc, trpcClient } from '@/lib/trpc';

import type { Unsubscribable } from '@trpc/server/observable';

import type { PhaseData } from './components/PhaseCard';
import type { PrivateDomainFormValues } from './components/PrivateDomainConfigView';
import { DEFAULT_FORM, PrivateDomainConfigView } from './components/PrivateDomainConfigView';
import { PrivateDomainFlowView } from './components/PrivateDomainFlowView';
import { PrivateDomainHistoryView } from './components/PrivateDomainHistoryView';
import { PrivateDomainResultView } from './components/PrivateDomainResultView';

// ── 6-stage private domain funnel constants ──────────────────────────────────

/** 6 core stages of the private domain conversion funnel */
export const PRIVATE_DOMAIN_STAGES = [
  'attract',    // 引流获客: content attracts target audience
  'add_wechat', // 加微转化: platform fans → WeChat private domain
  'trust',      // 信任建立: professional trust + purchase intent
  'moments',    // 朋友圈打造: persona building via Moments (3:4:3 rule)
  'convert',    // 成交转化: final sales conversion
  'repurchase', // 复购裂变: repeat purchase + referral flywheel
] as const;

export type PrivateDomainStage = typeof PRIVATE_DOMAIN_STAGES[number];

/** Channel labels for UI display */
export const CHANNEL_LABELS: Record<string, string> = {
  wechat: '微信视频号',
  douyin: '抖音',
  xiaohongshu: '小红书',
  weibo: '微博',
  other: '其他平台',
};

// ── View type ─────────────────────────────────────────────────────────────────

type ViewMode = 'flow' | 'config' | 'result' | 'history';

const VIEW_LABELS: Record<ViewMode, string> = {
  flow: '流程图',
  config: '配置参数',
  result: '生成结果',
  history: '历史回看',
};

const VIEWS: ViewMode[] = ['flow', 'config', 'result', 'history'];

// ── localStorage draft (AC-7) ─────────────────────────────────────────────────

function getDraftKey(userId: number, accountId: number): string {
  return `${LS_PREFIX}_${accountId}_private_domain_draft_${userId}`;
}

function readDraft(
  userId: number | null,
  accountId: number | null,
): Partial<PrivateDomainFormValues> {
  if (!userId || !accountId) return {};
  try {
    const raw = localStorage.getItem(getDraftKey(userId, accountId));
    if (raw) return JSON.parse(raw) as Partial<PrivateDomainFormValues>;
  } catch {
    // ignore corrupt JSON
  }
  return {};
}

function writeDraft(
  userId: number,
  accountId: number,
  values: PrivateDomainFormValues,
): void {
  try {
    localStorage.setItem(getDraftKey(userId, accountId), JSON.stringify(values));
  } catch {
    // storage full — ignore
  }
}

// ── SOP parser ────────────────────────────────────────────────────────────────

function parseSop(content: string): { phases: PhaseData[]; summary: string } | null {
  try {
    const parsed = JSON.parse(content) as { phases?: PhaseData[]; summary?: string };
    if (parsed.phases && Array.isArray(parsed.phases) && parsed.phases.length > 0) {
      return { phases: parsed.phases, summary: parsed.summary ?? '' };
    }
  } catch {
    // invalid JSON
  }
  return null;
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar() {
  const { data: historyItems = [] } = trpc.history.list.useQuery(
    { agentId: 'PrivateDomainAgent', limit: 50, offset: 0 },
    { staleTime: 60_000 },
  );

  const total = (historyItems as unknown[]).length;

  return (
    <div className="grid grid-cols-3 gap-4" data-testid="stats-bar">
      <Card className="border-outline-variant bg-surface-variant/10">
        <CardContent className="pt-4 pb-3">
          <p className="text-label-xs text-on-surface-variant">已生成方案</p>
          <p className="text-h2 font-display text-on-surface" data-testid="stat-total">{total}</p>
        </CardContent>
      </Card>
      <Card className="border-outline-variant bg-surface-variant/10">
        <CardContent className="pt-4 pb-3">
          <p className="text-label-xs text-on-surface-variant">成交阶段</p>
          <p className="text-h2 font-display text-on-surface">6</p>
        </CardContent>
      </Card>
      <Card className="border-outline-variant bg-surface-variant/10">
        <CardContent className="pt-4 pb-3">
          <p className="text-label-xs text-on-surface-variant">话术模板</p>
          <p className="text-h2 font-display text-on-surface">12+</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── View description ──────────────────────────────────────────────────────────

const VIEW_DESCRIPTIONS: Record<ViewMode, string> = {
  flow: '查看完整的 6 阶段私域成交流程，了解每个阶段的目标与策略',
  config: '填写产品信息、目标受众和 IP 定位，AI 将生成专属成交方案',
  result: '查看 AI 生成的完整 6 阶段执行 SOP、话术模板和关键指标',
  history: '浏览历史生成记录，点击恢复之前的方案',
};

// ── PrivateDomain page ────────────────────────────────────────────────────────

export default function PrivateDomain() {
  const { user } = useAuth();
  const { account } = useActiveAccount();
  const userId = user?.id ?? null;
  const accountId = (account as { id?: number } | null)?.id ?? null;

  const [searchParams, setSearchParams] = useSearchParams();
  const rawView = searchParams.get('view') as ViewMode | null;
  const activeView: ViewMode =
    rawView && VIEWS.includes(rawView as ViewMode) ? (rawView as ViewMode) : 'flow';

  // Form state — initialised from URL params then LS draft (AC-7)
  const [form, setForm] = useState<PrivateDomainFormValues>(() => ({
    ...DEFAULT_FORM,
    ...readDraft(userId, accountId),
  }));

  // Generated SOP state
  const [phases, setPhases] = useState<PhaseData[] | null>(null);
  const [sopSummary, setSopSummary] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  // AC-8: SSE streaming subscription ref (imperative, like VoiceChat pattern)
  const subRef = useRef<Unsubscribable | null>(null);
  const streamAccumRef = useRef<PhaseData[]>([]);

  // Draft restoration indicator (AC-7)
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    const draft = readDraft(userId, accountId);
    const hasMeaningfulContent = Boolean(
      draft.productDescription?.trim() ||
      draft.targetAudience?.trim() ||
      draft.ipPositioning?.trim(),
    );
    setHasDraft(hasMeaningfulContent);
  }, [userId, accountId]);

  // Debounce draft save (AC-7: 1s)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback(
    (values: PrivateDomainFormValues) => {
      if (!userId || !accountId) return;
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        writeDraft(userId, accountId, values);
      }, 1000);
    },
    [userId, accountId],
  );

  function handleFormChange(values: PrivateDomainFormValues) {
    setForm(values);
    saveDraft(values);
  }

  // Navigate to a view by setting ?view= URL param (AC-6)
  function navigateTo(view: ViewMode) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('view', view);
        return next;
      },
      { replace: false },
    );
  }

  // AC-4: tRPC mutation — writes History row + costLog (AC-8 cost_log)
  // onSuccess: history is saved; SSE subscription handles phase streaming
  const generateMutation = trpc.privateDomain.generate.useMutation({
    onSuccess(data) {
      // History saved — if SSE stream hasn't populated phases yet (e.g. in test env),
      // fall back to parsing the mutation response
      if (streamAccumRef.current.length === 0) {
        const content = (data as { content?: string }).content ?? '';
        const parsed = parseSop(content);
        if (parsed) {
          setPhases(parsed.phases);
          setSopSummary(parsed.summary);
        } else {
          setPhases([]);
          setSopSummary('');
        }
        setIsStreaming(false);
      }
    },
    onError(err) {
      setIsStreaming(false);
      subRef.current?.unsubscribe();
      toast.error(`生成失败：${err.message ?? '请重试'}`);
      navigateTo('config');
    },
  });

  // Handle form submit (AC-3/4 + AC-8)
  function handleSubmit(values: PrivateDomainFormValues) {
    const mutationInput = {
      productDescription: values.productDescription.trim(),
      productPrice: parseFloat(values.productPrice),
      targetAudience: values.targetAudience.trim(),
      ipPositioning: values.ipPositioning.trim(),
      currentChannel: values.currentChannel,
      monthlyTraffic: parseInt(values.monthlyTraffic, 10),
    };

    setIsStreaming(true);
    setPhases([]);
    setSopSummary('');
    streamAccumRef.current = [];
    navigateTo('result');

    // AC-4: mutation to write History row + costLog
    generateMutation.mutate(mutationInput);

    // AC-8: SSE subscription — yields each of the 6 phases as independent chunks
    subRef.current?.unsubscribe();
    subRef.current = trpcClient.privateDomain.generateStream.subscribe(mutationInput, {
      onData(chunk) {
        if (chunk.type === 'phase') {
          streamAccumRef.current = [...streamAccumRef.current, chunk.data as PhaseData];
          setPhases([...streamAccumRef.current]);
        } else if (chunk.type === 'done') {
          setSopSummary(chunk.summary);
          setIsStreaming(false);
        }
      },
      onError() {
        setIsStreaming(false);
      },
      onComplete() {
        setIsStreaming(false);
      },
    });
  }

  // Restore from history (AC-5)
  function handleRestore(
    restoredPhases: PhaseData[],
    summary: string,
    _inputSummary: string,
  ) {
    setPhases(restoredPhases);
    setSopSummary(summary);
    setIsStreaming(false);
    navigateTo('result');
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      subRef.current?.unsubscribe();
    };
  }, []);

  return (
    <main className="flex-1 container py-8 space-y-6" data-testid="private-domain-page">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">
            变现设计
          </span>
          <h1 className="mt-1 text-h1 font-display text-on-surface">私域成交流程</h1>
          <p className="mt-2 text-body-md text-muted-foreground">
            6 阶段私域成交 SOP · 引流 → 加微 → 信任 → 朋友圈 → 成交 → 复购
          </p>
          {hasDraft && !phases && (
            <p className="mt-1 text-body-xs text-muted-foreground" data-testid="draft-indicator">
              已恢复上次填写草稿
            </p>
          )}
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-label-sm text-primary uppercase tracking-wide">
          变现设计
        </span>
      </div>

      {/* Stats bar */}
      <StatsBar />

      {/* View tabs (AC-6: URL state ?view=flow|config|result|history) */}
      <div>
        <Tabs
          value={activeView}
          onValueChange={(v) => navigateTo(v as ViewMode)}
          data-testid="view-tabs"
        >
          <TabsList className="mb-2">
            {VIEWS.map((v) => (
              <TabsTrigger key={v} value={v} data-testid={`tab-${v}`}>
                {VIEW_LABELS[v]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <p
          className="text-body-sm text-on-surface-variant"
          data-testid="view-description"
          aria-live="polite"
        >
          {VIEW_DESCRIPTIONS[activeView]}
        </p>
      </div>

      {/* View content */}
      <div data-testid="view-content">
        {/* View 1: ui/_1 流程图 */}
        {activeView === 'flow' && (
          <PrivateDomainFlowView
            phases={phases}
            isStreaming={isStreaming}
            onStartConfig={() => navigateTo('config')}
          />
        )}

        {/* View 2: ui/_5 配置参数 */}
        {activeView === 'config' && (
          <div className="max-w-2xl">
            <PrivateDomainConfigView
              values={form}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              isPending={generateMutation.isPending || isStreaming}
            />
          </div>
        )}

        {/* View 3: ui/_7 生成结果 */}
        {activeView === 'result' && (
          phases !== null ? (
            <PrivateDomainResultView
              phases={phases}
              isStreaming={isStreaming}
              summary={sopSummary}
              onRetry={() => navigateTo('config')}
              onViewHistory={() => navigateTo('history')}
            />
          ) : (
            <div
              className="text-center py-12 text-body-sm text-muted-foreground"
              data-testid="result-empty"
            >
              {isStreaming ? (
                <div className="space-y-2">
                  <p className="text-primary animate-pulse text-body-md">
                    AI 正在生成 6 阶段 SOP…
                  </p>
                  <p className="text-body-sm text-muted-foreground">
                    通常需要 10-30 秒，请稍候
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>尚未生成 SOP，请先完成配置</p>
                  <button
                    onClick={() => navigateTo('config')}
                    className="text-primary underline text-body-sm"
                    data-testid="go-config-link"
                  >
                    前往配置
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* View 4: ui/_14 历史回看 */}
        {activeView === 'history' && (
          <PrivateDomainHistoryView onRestore={handleRestore} />
        )}
      </div>
    </main>
  );
}
