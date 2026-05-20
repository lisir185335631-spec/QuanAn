import { Copy, RefreshCw } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { ScriptTypeInlineCards , ElementsInlineMultiPicker } from '@/components/inline-pickers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { SCRIPT_TYPES } from '@/lib/constants/scripts';
import {
  STEP7_BUTTON_GENERATE,
  STEP7_BUTTON_GO_MY_TOPICS,
  STEP7_BUTTON_GO_STEP5,
  STEP7_BUTTON_OPTIMIZE,
  STEP7_DEBATE_H4_4,
  STEP7_H1,
  STEP7_LABEL_SCRIPT_TYPE,
  STEP7_LOADING_TEXT,
  STEP7_OPTIMIZE_LABEL,
  STEP7_OPTIMIZE_PLACEHOLDER,
  STEP7_SCRIPT_DISPLAY_TEMPLATE,
  STEP7_STEP_TAG,
  STEP7_SUBTITLE,
  STEP7_TEXTAREA,
  type Step7DebateResult,
} from '@/lib/constants/step7';

const DEFAULT_SCRIPT_ID = 'debate';

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast('已复制');
  } catch {
    toast.error('复制失败 · 请手动');
  }
}

export default function Step7() {
  const navigate = useNavigate();
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step7');

  const [scriptType, setScriptType] = useState<string>(DEFAULT_SCRIPT_ID);
  const [elements, setElements] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [optimizeDirection, setOptimizeDirection] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const prevIsSavingRef = useRef(false);

  // AC-3 · D-219: prefill from DB stepData on mount
  useEffect(() => {
    if (!dbQuery.data) return;
    const inputs = dbQuery.data.inputs;
    if (typeof inputs?.scriptType === 'string') setScriptType(inputs.scriptType);
    if (Array.isArray(inputs?.elements)) setElements(inputs.elements as string[]);
    if (typeof inputs?.topic === 'string') setTopic((prev) => prev || (inputs.topic as string));
    if (typeof inputs?.optimizeDirection === 'string') setOptimizeDirection(inputs.optimizeDirection);
    // Sync result from DB (CopywritingAgent output)
    const res = dbQuery.data.result;
    if (res && typeof res['markdown'] === 'string' && (res['markdown']).length > 0) {
      setResult(res);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data]);

  // Cross-step prefill: selected_topic from Step5
  useEffect(() => {
    if (accountId === null) return;
    const selectedTopic = readOtherStep<{ title?: string }>(accountId, 'selected_topic');
    if (selectedTopic?.title) {
      setTopic((prev) => prev || selectedTopic.title!);
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

  const currentScript = SCRIPT_TYPES.find((s) => s.key === scriptType) ?? SCRIPT_TYPES[0]!;
  const scriptDisplayText = STEP7_SCRIPT_DISPLAY_TEMPLATE
    .replace('{name}', currentScript.label)
    .replace('{positioning}', currentScript.desc);

  const generateDisabled = isSaving || !topic.trim();
  const optimizeDisabled = isSaving || !result;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (generateDisabled) return;
    save({
      scriptType,
      elements,
      topic: topic.trim(),
      optimizeDirection: optimizeDirection.trim(),
    });
  }

  const handleRegenerate = useCallback(() => {
    if (!topic.trim()) return;
    save({
      scriptType,
      elements,
      topic: topic.trim(),
      optimizeDirection: optimizeDirection.trim(),
    });
  }, [scriptType, elements, topic, optimizeDirection, save]);

  function handleCopyAll() {
    if (!result) return;
    const parts: string[] = [];
    if (typeof result['markdown'] === 'string') parts.push(result['markdown']);
    if (typeof result['cta'] === 'string') parts.push(result['cta']);
    if (Array.isArray(result['hooks'])) {
      parts.push((result['hooks'] as string[]).map((h) => `#${h}`).join(' '));
    }
    void copyText(parts.join('\n\n'));
  }

  const isDebate = scriptType === 'debate';
  const debateResult = result ? (result as unknown as Step7DebateResult) : null;

  return (
    <main className="flex-1 container py-8">
      {/* Header — AC-1 字面锁 */}
      <FadeInWrapper delay={0} from="up">
        <div>
          <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
            {STEP7_STEP_TAG}
          </p>
          <h1 className="text-h1 font-display text-on-surface mb-2">{STEP7_H1}</h1>
          <p className="text-body-md text-muted-foreground mb-8">{STEP7_SUBTITLE}</p>
        </div>
      </FadeInWrapper>

      {/* Form glass-card */}
      <FadeInWrapper delay={0.05} from="up">
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-xl p-6 space-y-8 max-w-3xl"
      >
        {/* 1. Script Type — AC-2 · ScriptTypeInlineCards + search */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-3">
            {STEP7_LABEL_SCRIPT_TYPE}
          </label>
          <ScriptTypeInlineCards
            value={scriptType}
            onChange={setScriptType}
            showSearch
          />
        </div>

        {/* 2. Elements — AC-2 · ElementsInlineMultiPicker grouped + count */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-body-sm font-label text-on-surface">
              选择爆款元素（已选 {elements.length} 个）
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setElements([])}
              disabled={elements.length === 0}
            >
              全部清除
            </Button>
          </div>
          <ElementsInlineMultiPicker
            value={elements}
            onChange={setElements}
            showCount={false}
            layout="grouped"
          />
        </div>

        {/* 3. 文案主题 textarea — AC-2 */}
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
          {/* spec §7.8 line 1701: 当前脚本：{name} - {positioning} */}
          <p className="mt-2 text-xs text-muted-foreground">{scriptDisplayText}</p>
        </div>

        {/* 4. 优化方向 input — AC-2 */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP7_OPTIMIZE_LABEL}
          </label>
          <Input
            type="text"
            placeholder={STEP7_OPTIMIZE_PLACEHOLDER}
            value={optimizeDirection}
            onChange={(e) => setOptimizeDirection(e.target.value)}
          />
        </div>

        {/* Buttons — AC-2 */}
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
      </FadeInWrapper>

      {/* Loading state */}
      {isSaving && (
        <div className="mt-8 max-w-3xl text-center text-muted-foreground py-4">
          {STEP7_LOADING_TEXT}
        </div>
      )}

      {/* Output section — AC-4 · AC-5 · AC-7 */}
      <FadeInWrapper delay={0.1} from="up">
        <section id="step7-output" className="mt-8 max-w-3xl">
          {isDebate ? (
            /* 搞辩论: 4 H4 structure always in DOM (AC-4 · D-220 字面锁) */
            <div className="space-y-4">
              {/* Action row: regenerate + copy — always visible for button count (AC-6) */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!result}
                  onClick={handleRegenerate}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重新生成
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!result}
                  onClick={handleCopyAll}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  复制全部
                </Button>
              </div>

              {/* 4 H4 sections — fixed order per spec §7.8 (AC-4) · each in own glass-card */}
              {STEP7_DEBATE_H4_4.map((item, idx) => {
                const fieldKey = item.id as keyof Step7DebateResult;
                const content = debateResult?.[fieldKey];
                return (
                  <FadeInWrapper key={item.id} delay={0.05 * idx} from="up">
                    <div className="glass-card rounded-xl p-5">
                      <h4 className="text-base font-label font-bold text-on-surface mb-2">
                        {item.h4Label}
                      </h4>
                      {typeof content === 'string' && content.length > 0 ? (
                        <p className="text-body-sm text-on-surface leading-relaxed">{content}</p>
                      ) : (
                        <p className="text-body-sm text-muted-foreground italic">生成后显示</p>
                      )}
                    </div>
                  </FadeInWrapper>
                );
              })}

              {/* 评论区引导 — AC-4 */}
              <div className="glass-card rounded-xl p-5">
                <h4 className="text-base font-label font-bold text-on-surface mb-2">评论区引导</h4>
                {typeof debateResult?.comment_guide === 'string' && debateResult.comment_guide.length > 0 ? (
                  <p className="text-body-sm text-on-surface">{debateResult.comment_guide}</p>
                ) : (
                  <p className="text-body-sm text-muted-foreground italic">生成后显示</p>
                )}
              </div>

              {/* 话题标签 #xxx — AC-4 */}
              <div className="glass-card rounded-xl p-5">
                <h4 className="text-base font-label font-bold text-on-surface mb-2">话题标签</h4>
                {Array.isArray(debateResult?.topic_tags) && debateResult.topic_tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {debateResult.topic_tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-muted-foreground italic">生成后显示</p>
                )}
              </div>
            </div>
          ) : (
            /* 其他脚本类型: stub placeholder (AC-5) */
            <div className="glass-card rounded-xl p-5">
              <p className="text-body-sm text-muted-foreground">
                该脚本类型输出 schema · PRD-23 完整化
              </p>
            </div>
          )}
        </section>
      </FadeInWrapper>
    </main>
  );
}
