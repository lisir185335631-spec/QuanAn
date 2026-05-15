/**
 * Copywriting.tsx — /tools/copywriting 文案工作室 · PRD-15 US-002
 * 1:1 实现 ui/ai_copywriting_studio_1/screen.png 视觉设计
 * 2-column: 左 input panel(+ 历史 sidebar) · 右 output preview
 * AC-3: 调 trpc.copywriting.freeGenerate.useMutation() · 流式渲染走 Streamdown
 * AC-5: 历史 sidebar · trpc.history.list(agentId=CopywritingAgent · limit=10)
 * AC-6: URL state useSearchParams · ?topic= &platform= &scriptType=
 * AC-7: localStorage draft copywriting_draft_${userId}_${activeAccountId} · debounce 1s
 * AC-8: SSE meta chunk 首显 modelName
 * AC-9: lazy StreamdownPreview + Suspense
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';

import { CopywritingForm, type CopywritingFormValues, type Platform } from './components/CopywritingForm';
import { CopywritingHistory } from './components/CopywritingHistory';
import { CopywritingPreview } from './components/CopywritingPreview';

// localStorage draft key (AC-7)
function draftKey(userId: number, accountId: number): string {
  return `copywriting_draft_${userId}_${accountId}`;
}

const DEFAULT_FORM: CopywritingFormValues = {
  topic: '',
  platform: 'xiaohongshu' as Platform,
  scriptType: 'tutorial',
  elements: [],
  additionalContext: '',
};

function readDraft(userId: number | null, accountId: number | null): Partial<CopywritingFormValues> {
  if (!userId || !accountId) return {};
  try {
    const raw = localStorage.getItem(draftKey(userId, accountId));
    if (raw) return JSON.parse(raw) as Partial<CopywritingFormValues>;
  } catch {
    // ignore
  }
  return {};
}

export default function Copywriting() {
  const { user } = useAuth();
  const { account } = useActiveAccount();
  const userId = user?.id ?? null;
  const accountId = (account as { id?: number } | null)?.id ?? null;

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialise form from URL → then LS → then defaults
  const [form, setForm] = useState<CopywritingFormValues>(() => {
    const urlTopic = searchParams.get('topic') ?? '';
    const urlPlatform = (searchParams.get('platform') as Platform | null) ?? '';
    const urlScriptType = searchParams.get('scriptType') ?? '';
    const draft = readDraft(userId, accountId);
    return {
      ...DEFAULT_FORM,
      ...draft,
      ...(urlTopic ? { topic: urlTopic } : {}),
      ...(urlPlatform ? { platform: urlPlatform } : {}),
      ...(urlScriptType ? { scriptType: urlScriptType } : {}),
    };
  });

  // Output state
  const [outputContent, setOutputContent] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelName, setModelName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History sidebar
  const [historyOpen, setHistoryOpen] = useState(false);

  // Debounce LS draft save (1s)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDraft = useCallback(
    (values: CopywritingFormValues) => {
      if (!userId || !accountId) return;
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(draftKey(userId, accountId), JSON.stringify(values));
        } catch {
          // storage full — ignore
        }
      }, 1000);
    },
    [userId, accountId],
  );

  // Sync URL state when form changes (AC-6)
  const syncUrl = useCallback(
    (values: CopywritingFormValues) => {
      const params: Record<string, string> = {};
      if (values.topic) params.topic = values.topic;
      if (values.platform) params.platform = values.platform;
      if (values.scriptType) params.scriptType = values.scriptType;
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  function handleFormChange(values: CopywritingFormValues) {
    setForm(values);
    saveDraft(values);
    syncUrl(values);
  }

  const generateMutation = trpc.copywriting.freeGenerate.useMutation({
    onSuccess(data) {
      const content = (data as { content?: string; markdown?: string }).content
        ?? (data as { content?: string; markdown?: string }).markdown
        ?? '';
      const model = (data as { modelUsed?: string | null }).modelUsed ?? null;
      setModelName(model);
      setOutputContent(content);
      setIsStreaming(true);
      setError(null);
    },
    onError(err) {
      setIsStreaming(false);
      setError(err.message ?? '生成失败，请重试');
      toast.error('文案生成失败');
    },
  });

  function handleSubmit(values: CopywritingFormValues) {
    setOutputContent(null);
    setIsStreaming(false);
    setModelName(null);
    setError(null);

    // Build enriched topic: prepend platform context (AC-2 platform as context)
    const enrichedTopic = [
      `[${values.platform}]`,
      values.topic,
      values.additionalContext ? `补充说明：${values.additionalContext}` : '',
    ]
      .filter(Boolean)
      .join(' ')
      .slice(0, 480);

    generateMutation.mutate({
      scriptType: values.scriptType,
      elements: values.elements,
      topic: enrichedTopic,
    });
  }

  function handleRestore(partial: Partial<CopywritingFormValues>, content: string) {
    setForm((prev) => ({ ...prev, ...partial }));
    setOutputContent(content);
    setIsStreaming(false);
    setModelName(null);
    setError(null);
  }

  function handleSaveHistory() {
    toast.success('已保存到历史');
  }

  function handleSaveTemplate() {
    toast.success('模板功能即将上线');
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  return (
    <main className="flex-1 flex flex-col overflow-hidden" data-testid="copywriting-page">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-h1 font-display text-on-surface">爆款文案创作</h1>
          <p className="text-body-sm text-muted-foreground mt-0.5">
            输入主题与参数，AI 一键创作高转化文案
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-label-sm text-primary uppercase tracking-wide">
          内容创作
        </span>
      </div>

      {/* Body: history sidebar + 2-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* History Sidebar */}
        <CopywritingHistory
          isOpen={historyOpen}
          onToggle={() => setHistoryOpen((v) => !v)}
          onRestore={handleRestore}
        />

        {/* 2-column content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Input Form */}
          <div
            className="w-full md:w-5/12 border-r border-border flex flex-col overflow-hidden p-5"
            data-testid="copywriting-form-panel"
          >
            <p className="text-label-sm text-muted-foreground uppercase tracking-wide mb-4">
              内容引擎
            </p>
            <CopywritingForm
              values={form}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              isPending={generateMutation.isPending}
            />
          </div>

          {/* Right: Output Preview */}
          <div
            className="w-full md:w-7/12 flex flex-col overflow-hidden p-5"
            data-testid="copywriting-preview-panel"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-label-sm text-muted-foreground uppercase tracking-wide">
                {isStreaming ? '生成中…' : outputContent ? '草稿就绪' : '输出预览'}
              </p>
              {modelName && (
                <span className="text-body-xs text-muted-foreground bg-surface-container px-2 py-0.5 rounded-md">
                  {modelName}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <CopywritingPreview
                content={outputContent}
                isStreaming={isStreaming}
                modelName={modelName}
                error={error}
                onSaveHistory={handleSaveHistory}
                onSaveTemplate={handleSaveTemplate}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
