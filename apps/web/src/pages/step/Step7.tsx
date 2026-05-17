import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Step7OutputContent, {
  type CopywritingOutput,
} from '@/components/step7/Step7OutputContent';
import { Step7ElementMultiSelect } from '@/components/step7/Step7ElementMultiSelect';
import { Step7ScriptTypeSearch } from '@/components/step7/Step7ScriptTypeSearch';
import { EmptyState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import {
  STEP7_BUTTON_GENERATE,
  STEP7_BUTTON_GO_MY_TOPICS,
  STEP7_BUTTON_GO_STEP5,
  STEP7_BUTTON_OPTIMIZE,
  STEP7_H1,
  STEP7_LABEL_SCRIPT_TYPE,
  STEP7_LOADING_TEXT,
  STEP7_OPTIMIZE_LABEL,
  STEP7_OPTIMIZE_PLACEHOLDER,
  STEP7_SCRIPT_TYPES_20,
  STEP7_STEP_TAG,
  STEP7_SUBTITLE,
  STEP7_TEXTAREA,
} from '@/lib/constants/step7';

export default function Step7() {
  const navigate = useNavigate();
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step7');

  const [selectedScriptId, setSelectedScriptId] = useState<string>(
    STEP7_SCRIPT_TYPES_20[0]!.id
  );
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [topic, setTopic] = useState('');
  const [optimize, setOptimize] = useState('');
  const [result, setResult] = useState<CopywritingOutput | null>(null);

  const prevIsSavingRef = useRef(false);

  // Cross-step prefill: selected_topic from Step5 → prefill topic textarea
  // and restore step7 own saved inputs from LS
  useEffect(() => {
    if (accountId === null) return;

    // Prefill topic from step5 selected topic (key = 'selected_topic' per migration map)
    const selectedTopic = readOtherStep<{ title?: string }>(accountId, 'selected_topic');
    if (selectedTopic?.title) {
      setTopic((prev) => prev || selectedTopic.title!);
    }

    // Restore step7 own saved inputs
    const step7Data = readOtherStep<{
      topic?: string;
      optimizeDir?: string;
      scriptType?: string;
      elements?: string[];
    }>(accountId, 'step7');
    if (step7Data) {
      if (step7Data.scriptType) setSelectedScriptId(step7Data.scriptType);
      if (step7Data.elements?.length) setSelectedElements(new Set(step7Data.elements));
      if (step7Data.topic) setTopic((prev) => prev || step7Data.topic!);
      if (step7Data.optimizeDir) setOptimize(step7Data.optimizeDir);
    }
  }, [accountId]);

  // Refetch after save completes (isSaving: true → false)
  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  // Sync result from DB (CopywritingAgent output)
  useEffect(() => {
    if (!dbQuery.data?.result) return;
    const raw = dbQuery.data.result as Record<string, unknown>;
    if (typeof raw['markdown'] === 'string' && raw['markdown'].length > 0) {
      setResult({
        markdown: raw['markdown'],
        structure: (raw['structure'] as string) ?? '',
        hooks: (raw['hooks'] as string[]) ?? [],
        cta: (raw['cta'] as string) ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data?.result]);

  const handleToggleElement = useCallback((id: string) => {
    setSelectedElements((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const generateDisabled = isSaving || !topic.trim();
  const optimizeDisabled = isSaving || !result;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (generateDisabled) return;
    save({
      topic: topic.trim(),
      optimizeDir: optimize.trim(),
      scriptType: selectedScriptId,
      elements: Array.from(selectedElements),
    });
  }

  function handleRegenerate() {
    if (!topic.trim()) return;
    save({
      topic: topic.trim(),
      optimizeDir: optimize.trim(),
      scriptType: selectedScriptId,
      elements: Array.from(selectedElements),
    });
  }

  return (
    <main className="flex-1 container py-8">
      {/* Header */}
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP7_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP7_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{STEP7_SUBTITLE}</p>

      {/* Form glass-card · 4 sections per spec §7.8 */}
      <form
        onSubmit={(e) => {
          handleSubmit(e);
        }}
        className="glass-card rounded-xl p-6 space-y-8 max-w-3xl"
      >
        {/* 1. 选择脚本类型 (20 选 1) — TD-76 fix: use STEP7_LABEL_SCRIPT_TYPE constant */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-3">
            {STEP7_LABEL_SCRIPT_TYPE}
          </label>
          <Step7ScriptTypeSearch
            selectedId={selectedScriptId}
            onSelect={setSelectedScriptId}
          />
        </div>

        {/* 2. 选择爆款元素 (22 选 N · 4 分组) */}
        <div>
          <Step7ElementMultiSelect
            selected={selectedElements}
            onToggle={handleToggleElement}
          />
        </div>

        {/* 3. 文案主题输入 */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP7_TEXTAREA.label}
            {STEP7_TEXTAREA.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </label>
          <textarea
            required={STEP7_TEXTAREA.required}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={STEP7_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-cn resize-y"
            style={{ minHeight: '120px' }}
          />
        </div>

        {/* 4. AI 智能优化 */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP7_OPTIMIZE_LABEL}
          </label>
          <Input
            type="text"
            placeholder={STEP7_OPTIMIZE_PLACEHOLDER}
            value={optimize}
            onChange={(e) => setOptimize(e.target.value)}
          />
        </div>

        {/* 4 Buttons */}
        <div className="space-y-3">
          <Button
            type="submit"
            disabled={generateDisabled}
            className="w-full bg-gradient-to-r from-primary to-primary/80"
          >
            {STEP7_BUTTON_GENERATE}
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={optimizeDisabled}
            className="w-full"
          >
            {STEP7_BUTTON_OPTIMIZE}
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="link"
              className="flex-1"
              onClick={() => void navigate('/my-topics')}
            >
              {STEP7_BUTTON_GO_MY_TOPICS}
            </Button>
            <Button
              type="button"
              variant="link"
              className="flex-1"
              onClick={() => void navigate('/step/5')}
            >
              {STEP7_BUTTON_GO_STEP5}
            </Button>
          </div>
        </div>
      </form>

      {/* Loading state */}
      {isSaving && (
        <div className="mt-8 max-w-3xl">
          <LoadingState text={STEP7_LOADING_TEXT} size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!isSaving && !result && (
        <div className="mt-8 max-w-3xl">
          <EmptyState title={`填写主题后生成${STEP7_H1}`} />
        </div>
      )}

      {/* Output section */}
      {result && !isSaving && (
        <section id="step7-output" className="mt-8 max-w-3xl">
          <Step7OutputContent result={result} onRegenerate={handleRegenerate} />
        </section>
      )}
    </main>
  );
}
