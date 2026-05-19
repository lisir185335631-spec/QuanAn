/**
 * Generate.tsx — /generate 工具页 · PRD-22 US-002
 * 完整 inline 重构: 20 脚本卡 + 22 元素 4 组 + 文案主题 textarea 0/500 + 主 CTA
 * D-219 锁: 独立调用版本, 不读 stepData, 不调 trpc.stepData.get
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedbackButton } from '@/components/FeedbackButton';
// PRD-22 US-002: inline 重构后弃用 ToolForm · 但保留 import 防 PRD-15 沉淀回滚
import { ToolForm } from '@/components/ToolForm/ToolForm';
import { ToolResult } from '@/components/ToolResult/ToolResult';
import {
  ElementsInlineMultiPicker,
  ScriptTypeInlineCards,
} from '@/components/inline-pickers';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

import type { FreeGenerateHistoryRow } from '@quanan/clients/router-types';

// Suppress unused-import lint for ToolForm (D-216 lock: keep import for PRD-15 rollback guard)
void (ToolForm as unknown);

type GenerateMode = 'free' | 'acquisition';

export default function Generate() {
  const [searchParams] = useSearchParams();
  const searchParamsMode = searchParams.get('mode') as GenerateMode | null;

  const [mode, setMode] = useState<GenerateMode>('free');
  const [scriptType, setScriptType] = useState<string | null>(null);
  const [elements, setElements] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [conversionGoal, setConversionGoal] = useState('');
  const [result, setResult] = useState<FreeGenerateHistoryRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  useEffect(() => {
    if (searchParamsMode === 'acquisition') setMode('acquisition');
  }, [searchParamsMode]);

  const freeMutation = trpc.copywriting.freeGenerate.useMutation();
  const acquisitionMutation = trpc.copywriting.acquisitionGenerate.useMutation();

  // AC-4 · disabled 条件
  const isDisabled = !scriptType || elements.length === 0 || topic.length < 10;

  async function handleSubmit() {
    if (isDisabled || isSubmitting) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      if (abortRef.current.signal.aborted) return;
      const row =
        mode === 'acquisition'
          ? await acquisitionMutation.mutateAsync({
              scriptType: scriptType!,
              elements,
              conversionGoal,
              topic,
            })
          : await freeMutation.mutateAsync({
              scriptType: scriptType!,
              elements,
              topic,
            });
      if (!abortRef.current.signal.aborted) {
        setResult(row as unknown as FreeGenerateHistoryRow);
      }
    } catch {
      // ignore aborted or user-cancelled
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleModeChange(newMode: GenerateMode) {
    setMode(newMode);
    setResult(null);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* PageHeader */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">
          内容创作
        </span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">生成爆款文案</h1>
        <p className="mt-2 text-body-md text-muted-foreground">
          选择脚本类型和爆款元素，输入主题，AI 为你生成 AIP 风格的短视频文案
        </p>
      </div>

      {/* Mode tabs — 2 secondary buttons (AC-6 计数) */}
      <div className="flex gap-2" role="tablist" aria-label="生成模式">
        <button
          type="button"
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
          type="button"
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

      {/* AC-2(2): 20 脚本卡 + 搜索 input */}
      <section className="space-y-3">
        <h2 className="text-h3 font-display text-on-surface">选择脚本类型</h2>
        <ScriptTypeInlineCards
          value={scriptType}
          onChange={setScriptType}
          showSearch
        />
      </section>

      {/* AC-2(3): 22 元素 4 组 + 计数 */}
      <section className="space-y-3">
        <h2 className="text-h3 font-display text-on-surface">选择爆款元素</h2>
        <ElementsInlineMultiPicker
          value={elements}
          onChange={setElements}
          showCount
          layout="grouped"
        />
      </section>

      {/* Acquisition mode extra field */}
      {mode === 'acquisition' && (
        <div className="space-y-2">
          <label className="block text-body-md font-medium text-on-surface">
            转化目标
          </label>
          <input
            type="text"
            placeholder="例如：引导添加微信、预约到店、购买课程..."
            value={conversionGoal}
            onChange={(e) => setConversionGoal(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      )}

      {/* AC-2(4): textarea 文案主题 max 500 + 字符计数 */}
      <div className="space-y-2">
        <label className="block text-body-md font-medium text-on-surface">文案主题</label>
        <div className="relative">
          <textarea
            maxLength={500}
            placeholder="输入你的文案主题，如：美容院如何用抖音获客100个精准客户..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            data-testid="topic-textarea"
          />
          {/* AC-5 · 字符计数 + text-destructive > 500 */}
          <span
            className={cn(
              'absolute bottom-2 right-3 text-xs',
              topic.length > 500 ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {topic.length}/500
          </span>
        </div>
      </div>

      {/* AC-2(5): 主 CTA · bg-gradient-to-r from-primary to-primary/60 */}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={isDisabled || isSubmitting}
        className={cn(
          'w-full py-3 rounded-xl font-display font-bold text-white bg-gradient-to-r from-primary to-primary/60 transition-opacity',
          (isDisabled || isSubmitting) && 'opacity-50 cursor-not-allowed',
        )}
        data-testid="generate-cta"
      >
        {isSubmitting ? '生成中...' : '生成文案'}
      </button>

      {/* Loading skeleton */}
      {isSubmitting && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-32 w-full rounded bg-muted" />
        </div>
      )}

      {/* AC-2(6): 结果区 */}
      {result && !isSubmitting && (
        <div className="space-y-4" data-testid="tool-result-generate">
          <ToolResult
            toolKey={mode === 'acquisition' ? 'acquisition' : 'freeGenerate'}
            data={result}
            isFallback={result.isFallback}
          />
          <FeedbackButton
            stepKey={mode === 'acquisition' ? 'acquisitionGenerate' : 'freeGenerate'}
            agentId="CopywritingAgent"
          />
        </div>
      )}
    </main>
  );
}
