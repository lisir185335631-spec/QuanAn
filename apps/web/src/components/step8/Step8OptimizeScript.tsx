/**
 * Step8OptimizeScript — PRD-25 US-007 AC-3/AC-4
 * AC-3: useMutation → trpc.stepData.save · sub_function='optimize_script'
 *       2 InfoCard 渲染(optimized_text + optimization_notes)
 * AC-4: isFallback hint + error handling
 */
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  STEP8_BUTTON_OPTIMIZE_SCRIPT,
  STEP8_OPTIMIZE_INPUT,
  STEP8_OPTIMIZE_LOADING_TEXT,
  STEP8_OPTIMIZE_MIN_CHARS,
  STEP8_OPTIMIZE_OUTPUT_LABELS_2,
  STEP8_OPTIMIZE_TEXTAREA,
} from '@/lib/constants/step8';
import { trpc } from '@/lib/trpc';

type OptimizeScriptResult = {
  optimized_text: string;
  optimization_notes: string;
};

interface Props {
  accountId: number | null;
}

export function Step8OptimizeScript({ accountId }: Props) {
  const [scriptText, setScriptText] = useState('');
  const [optimizeGoal, setOptimizeGoal] = useState('');
  const [result, setResult] = useState<OptimizeScriptResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const charCount = scriptText.length;

  // AC-3: useMutation → trpc.stepData.save
  const saveMutation = trpc.stepData.save.useMutation({
    onSuccess(data) {
      const raw = data.data.result as OptimizeScriptResult | null;
      if (raw?.optimized_text) {
        setResult(raw);
        setIsFallback(data.data.isFallback);
        document.getElementById('step8-optimize-output')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        toast.error('AI 返回格式错误 · 请稍后重试');
      }
    },
    onError() {
      toast.error('优化失败 · 请稍后重试');
    },
  });

  const submitDisabled = saveMutation.isPending || charCount < STEP8_OPTIMIZE_MIN_CHARS;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled || !accountId) return;
    setResult(null);
    setIsFallback(false);
    saveMutation.mutate({
      stepKey: 'step8',
      inputs: { sub_function: 'optimize_script', scriptText, optimizeGoal },
    });
  }

  function handleRetry() {
    if (!accountId || charCount < STEP8_OPTIMIZE_MIN_CHARS) return;
    setResult(null);
    setIsFallback(false);
    saveMutation.mutate({
      stepKey: 'step8',
      inputs: { sub_function: 'optimize_script', scriptText, optimizeGoal },
    });
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-xl p-6 space-y-4 max-w-2xl"
      >
        {/* Script textarea */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_OPTIMIZE_TEXTAREA.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder={STEP8_OPTIMIZE_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[160px] font-cn resize-y"
          />
          <p className="text-body-xs text-muted-foreground mt-1">已输入 {charCount} 字</p>
        </div>

        {/* Optimize goal input */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_OPTIMIZE_INPUT.label}
          </label>
          <Input
            value={optimizeGoal}
            onChange={(e) => setOptimizeGoal(e.target.value)}
            placeholder={STEP8_OPTIMIZE_INPUT.placeholder}
          />
        </div>

        <Button type="submit" disabled={submitDisabled} className="w-full sm:w-auto">
          {saveMutation.isPending ? STEP8_OPTIMIZE_LOADING_TEXT : STEP8_BUTTON_OPTIMIZE_SCRIPT}
        </Button>
      </form>

      {/* AC-4: isFallback banner */}
      {result && isFallback && (
        <div
          data-testid="step8-optimize-fallback-banner"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-body-sm text-amber-600"
        >
          AI 服务繁忙，以下为备用内容 · 建议稍后
          <button
            type="button"
            onClick={handleRetry}
            className="ml-2 underline hover:no-underline"
          >
            重试
          </button>
        </div>
      )}

      {/* AC-3: 2 InfoCard output */}
      {result && (
        <div id="step8-optimize-output" className="space-y-6" data-testid="step8-optimize-output">
          {STEP8_OPTIMIZE_OUTPUT_LABELS_2.map((item) => (
            <div key={item.id} className="glass-card rounded-xl p-6">
              <h3 className="text-h3 font-display text-on-surface mb-3">{item.label}</h3>
              <p className="text-body-sm text-muted-foreground whitespace-pre-wrap">
                {result[item.id]}
              </p>
            </div>
          ))}
          <Button variant="outline" type="button" onClick={handleRetry}>
            重新优化
          </Button>
        </div>
      )}
    </div>
  );
}
