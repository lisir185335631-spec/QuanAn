/**
 * PrivateDomain.tsx — /tools/private-domain 私域成交流程工具 · PRD-27 US-002
 * AC-5: PRIVATE_DOMAIN_STAGES 引自 constants
 * AC-6: 6 tab UI · tab click → onPhaseChange → state · generate → trpc.privateDomain.generate.useMutation
 * AC-7: isFallback hint + cost_log + error handle 同 US-001
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { useAuth } from '@/hooks/useAuth';
import { PRIVATE_DOMAIN_STAGES } from '@/lib/constants/private-domain';
import { getToolLsKey } from '@/lib/ls-namespace';
import { trpc, trpcClient } from '@/lib/trpc';

import { DEFAULT_FORM, PrivateDomainConfigView } from './components/PrivateDomainConfigView';
import { PrivateDomainFlowView } from './components/PrivateDomainFlowView';
import { PrivateDomainHistoryView } from './components/PrivateDomainHistoryView';

import type { PrivateDomainFormValues } from './components/PrivateDomainConfigView';
import type { Unsubscribable } from '@trpc/server/observable';

// ── Phase result types (AC-4) ─────────────────────────────────────────────────

interface PhaseVariants {
  professional: string;
  friendly: string;
  sales: string;
}

interface PhaseResult {
  phaseScript: string;
  variants: PhaseVariants;
}

// ── View type ─────────────────────────────────────────────────────────────────

type ViewMode = 'flow' | 'config' | 'result' | 'history';

const VIEW_LABELS: Record<ViewMode, string> = {
  flow: '流程图',
  config: '配置参数',
  result: '生成结果',
  history: '历史回看',
};

const VIEWS: ViewMode[] = ['flow', 'config', 'result', 'history'];

// ── localStorage draft ────────────────────────────────────────────────────────

function readDraft(userId: number | null, accountId: number | null): Partial<PrivateDomainFormValues> {
  if (!userId || !accountId) return {};
  try {
    const raw = localStorage.getItem(getToolLsKey(accountId, 'private_domain', `draft_${userId}`));
    if (raw) return JSON.parse(raw) as Partial<PrivateDomainFormValues>;
  } catch { /* ignore */ }
  return {};
}

function writeDraft(userId: number, accountId: number, values: PrivateDomainFormValues): void {
  try {
    localStorage.setItem(getToolLsKey(accountId, 'private_domain', `draft_${userId}`), JSON.stringify(values));
  } catch { /* storage full */ }
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
          <p className="text-label-xs text-on-surface-variant">已生成话术</p>
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
          <p className="text-label-xs text-on-surface-variant">风格变体</p>
          <p className="text-h2 font-display text-on-surface">3</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Phase result view (AC-4 output schema) ────────────────────────────────────

function PhaseResultView({
  result,
  isFallback,
  isStreaming,
  streamDelta,
  phase,
  onRetry,
}: {
  result: PhaseResult | null;
  isFallback: boolean;
  isStreaming: boolean;
  streamDelta: string;
  phase: string;
  onRetry: () => void;
}) {
  const stage = PRIVATE_DOMAIN_STAGES.find(s => s.value === phase);
  const [activeVariant, setActiveVariant] = useState<keyof PhaseVariants>('professional');

  if (isStreaming && !result) {
    return (
      <div className="space-y-4" data-testid="private-domain-streaming">
        <div className="flex items-center gap-2">
          <span className="text-label-sm text-primary animate-pulse">AI 生成中…</span>
        </div>
        {streamDelta && (
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-body-md text-on-surface whitespace-pre-wrap">{streamDelta}</p>
          </div>
        )}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-6" data-testid="private-domain-result">
      {/* isFallback banner — AC-7 */}
      {isFallback && (
        <div
          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
          data-testid="private-domain-fallback-banner"
        >
          <p className="text-body-sm text-muted-foreground">AI 暂时繁忙 · 显示备用话术</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-border px-3 py-1.5 text-label-sm font-label text-muted-foreground hover:bg-muted/50 transition-colors"
            data-testid="private-domain-retry"
          >
            重试
          </button>
        </div>
      )}

      {/* Phase label */}
      {stage && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-label-sm text-primary" data-testid="result-phase-label">{stage.label}</span>
          <span className="text-body-sm text-muted-foreground">{stage.desc}</span>
        </div>
      )}

      {/* Main script */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h3 className="text-h3 font-display text-on-surface">主话术</h3>
        <p
          className="text-body-md text-on-surface whitespace-pre-wrap leading-relaxed"
          data-testid="private-domain-phase-script"
        >
          {result.phaseScript}
        </p>
      </section>

      {/* 3 style variants */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="text-h3 font-display text-on-surface">风格变体</h3>
        <div className="flex gap-2">
          {(['professional', 'friendly', 'sales'] as const).map(v => (
            <button
              key={v}
              onClick={() => setActiveVariant(v)}
              className={`rounded-md px-3 py-1.5 text-label-sm font-label transition-colors ${
                activeVariant === v
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:bg-muted/50'
              }`}
              data-testid={`variant-tab-${v}`}
            >
              {{ professional: '专业版', friendly: '亲切版', sales: '销售版' }[v]}
            </button>
          ))}
        </div>
        <p
          className="text-body-md text-on-surface whitespace-pre-wrap leading-relaxed"
          data-testid={`variant-content-${activeVariant}`}
        >
          {result.variants[activeVariant]}
        </p>
      </section>

      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-border px-4 py-2 text-label-sm font-label text-muted-foreground hover:bg-muted/50 transition-colors"
        data-testid="private-domain-regenerate"
      >
        重新生成
      </button>
    </div>
  );
}

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

  // Phase selection state (AC-6)
  const [activePhase, setActivePhase] = useState<typeof PRIVATE_DOMAIN_STAGES[number]['value']>('welcome');

  // Form state — initialised from LS draft
  const [form, setForm] = useState<PrivateDomainFormValues>(() => ({
    ...DEFAULT_FORM,
    ...readDraft(userId, accountId),
  }));

  // Result state
  const [result, setResult] = useState<PhaseResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDelta, setStreamDelta] = useState('');

  const subRef = useRef<Unsubscribable | null>(null);

  // Draft restoration indicator
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    const draft = readDraft(userId, accountId);
    const hasMeaningful = Boolean(
      draft.productDescription?.trim() ||
      draft.targetAudience?.trim() ||
      draft.ipPositioning?.trim(),
    );
    setHasDraft(hasMeaningful);
  }, [userId, accountId]);

  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDraft = useCallback(
    (values: PrivateDomainFormValues) => {
      if (!userId || !accountId) return;
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => writeDraft(userId, accountId, values), 1000);
    },
    [userId, accountId],
  );

  function handleFormChange(values: PrivateDomainFormValues) {
    setForm(values);
    saveDraft(values);
  }

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

  // AC-6: generate mutation with phase
  const generateMutation = trpc.privateDomain.generate.useMutation({
    onSuccess(data) {
      const content = (data as { content?: string; isFallback?: boolean }).content ?? '';
      const fallback = (data as { isFallback?: boolean }).isFallback ?? false;
      setIsFallback(fallback);
      try {
        const parsed = JSON.parse(content) as PhaseResult;
        setResult(parsed);
      } catch {
        setResult(null);
        toast.error('话术解析失败 · 请重试');
      }
      setIsStreaming(false);
    },
    onError(err) {
      setIsStreaming(false);
      subRef.current?.unsubscribe();
      toast.error(`生成失败：${err.message ?? '请重试'}`);
      navigateTo('config');
    },
  });

  function handleSubmit(values: PrivateDomainFormValues) {
    const mutationInput = {
      phase: activePhase,
      productDescription: values.productDescription.trim(),
      productPrice: parseFloat(values.productPrice),
      targetAudience: values.targetAudience.trim(),
      ipPositioning: values.ipPositioning.trim(),
      currentChannel: values.currentChannel,
      monthlyTraffic: parseInt(values.monthlyTraffic, 10),
      scene: (values as PrivateDomainFormValues & { scene?: string }).scene?.trim() || undefined,
    };

    setIsStreaming(true);
    setResult(null);
    setIsFallback(false);
    setStreamDelta('');
    navigateTo('result');

    generateMutation.mutate(mutationInput);

    // AC-2: SSE streaming for live UX — chunk-level (meta + delta + done)
    subRef.current?.unsubscribe();
    subRef.current = trpcClient.privateDomain.generateStream.subscribe(mutationInput, {
      onData(chunk) {
        if (chunk.type === 'delta' && (chunk as { type: string; delta?: string }).delta) {
          const delta = (chunk as { type: string; delta?: string }).delta ?? '';
          setStreamDelta(prev => prev + delta);
        } else if (chunk.type === 'done') {
          const doneChunk = chunk as { type: string; result?: PhaseResult | null };
          if (doneChunk.result) {
            setResult(doneChunk.result);
          }
          setIsStreaming(false);
        }
      },
      onError() { setIsStreaming(false); },
      onComplete() { setIsStreaming(false); },
    });
  }

  function handleRetry() {
    handleSubmit(form);
  }

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
          <h1 className="mt-1 text-h1 font-display text-on-surface">私域成交话术</h1>
          <p className="mt-2 text-body-md text-muted-foreground">
            6 阶段私域运营话术 · 选择当前阶段 · AI 生成专属话术 + 3 种风格变体
          </p>
          {hasDraft && !result && (
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

      {/* View tabs */}
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
      </div>

      {/* View content */}
      <div data-testid="view-content">
        {activeView === 'flow' && (
          <PrivateDomainFlowView
            phases={null}
            isStreaming={false}
            onStartConfig={() => navigateTo('config')}
          />
        )}

        {activeView === 'config' && (
          <div className="space-y-6 max-w-2xl">
            {/* AC-6: 6 phase tabs */}
            <div>
              <p className="text-label-sm font-label text-on-surface mb-3">选择话术阶段</p>
              <div className="grid grid-cols-3 gap-2" data-testid="phase-tabs">
                {PRIVATE_DOMAIN_STAGES.map((stage) => (
                  <button
                    key={stage.value}
                    type="button"
                    onClick={() => setActivePhase(stage.value)}
                    data-testid={`phase-tab-${stage.value}`}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      activePhase === stage.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-on-surface hover:bg-muted/50'
                    }`}
                  >
                    <p className="text-label-sm font-label">{stage.label}</p>
                    <p className="text-body-xs text-muted-foreground mt-0.5 line-clamp-2">{stage.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <PrivateDomainConfigView
              values={form}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              isPending={generateMutation.isPending || isStreaming}
            />
          </div>
        )}

        {activeView === 'result' && (
          result !== null || isStreaming ? (
            <PhaseResultView
              result={result}
              isFallback={isFallback}
              isStreaming={isStreaming}
              streamDelta={streamDelta}
              phase={activePhase}
              onRetry={handleRetry}
            />
          ) : (
            <div
              className="text-center py-12 text-body-sm text-muted-foreground"
              data-testid="result-empty"
            >
              <div className="space-y-2">
                <p>尚未生成话术，请先选择阶段并完成配置</p>
                <button
                  onClick={() => navigateTo('config')}
                  className="text-primary underline text-body-sm"
                  data-testid="go-config-link"
                >
                  前往配置
                </button>
              </div>
            </div>
          )
        )}

        {activeView === 'history' && (
          <PrivateDomainHistoryView
            onRestore={(phases, _summary, _inputSummary) => {
              // Try new schema first (phaseScript + variants)
              const firstPhase = phases[0] as unknown as Record<string, unknown> | undefined;
              if (firstPhase && typeof firstPhase.phaseScript === 'string') {
                setResult(firstPhase as unknown as PhaseResult);
                setIsFallback(false);
                setIsStreaming(false);
                navigateTo('result');
              } else {
                setResult(null);
                navigateTo('result');
              }
            }}
          />
        )}
      </div>
    </main>
  );
}
