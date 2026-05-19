/**
 * BoomGenerate.tsx — /boom-generate 工具页 · PRD-22 US-003
 * 完整 inline 重构: 22 元素 4 组 + 行业 input + 主题 input + 一键生成 5 篇
 * H1 字面锁: "爆款元素自动生成"
 * 副标题锁: "选择爆款元素组合，AI 自动生成 5 篇深度爆款文案，每篇至少 300 字，拒绝表面化"
 * AC-5: 表单状态本地 useState · 不读 stepData · scriptType 不存在
 */

import { useEffect, useRef, useState } from 'react';

import { BoomGenerateResult } from '@/components/ToolResult/BoomGenerateResult';
import { FadeInWrapper } from '@/components/FadeInWrapper';
import { ElementsInlineMultiPicker } from '@/components/inline-pickers';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { ALL_ELEMENTS } from '@/lib/constants/elements';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

import type { BoomGenerateHistoryRow } from '@quanan/clients/router-types';
import type { ActiveAccountOutput } from '@quanan/clients/router-types';

export default function BoomGenerate() {
  const { account } = useActiveAccount();
  const industryDefault = (account as ActiveAccountOutput)?.industry ?? '';

  const [elements, setElements] = useState<string[]>([]);
  const [industry, setIndustry] = useState('');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<BoomGenerateHistoryRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  const mutation = trpc.boomGenerate.generate.useMutation();

  // AC-3: disabled 条件 — elements 必选，industry/topic 可选
  const isDisabled = elements.length === 0;

  function handleSelectAll() {
    setElements(ALL_ELEMENTS.map((el) => el.key));
  }

  function handleClearAll() {
    setElements([]);
  }

  async function handleSubmit() {
    if (isDisabled || isSubmitting) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      if (abortRef.current.signal.aborted) return;
      const row = await mutation.mutateAsync({
        elements,
        industry: industry || undefined,
        theme: topic || undefined,
      });
      if (!abortRef.current.signal.aborted) {
        setResult(row as unknown as BoomGenerateHistoryRow);
      }
    } catch {
      // ignore aborted or user-cancelled
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* AC-1: PageHeader + H1 字面锁 */}
      <FadeInWrapper delay={0} from="up">
        <div>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">
            内容创作
          </span>
          <h1 className="mt-1 text-h1 font-display text-on-surface">
            爆款元素自动生成
          </h1>
          <p className="mt-2 text-body-md text-muted-foreground">
            选择爆款元素组合，AI 自动生成 5 篇深度爆款文案，每篇至少 300 字，拒绝表面化
          </p>
        </div>
      </FadeInWrapper>

      {/* AC-2(2): 22 元素 4 组 + 全选/清空 secondary buttons (AC-4) */}
      <FadeInWrapper delay={0.05} from="up">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 font-display text-on-surface">选择爆款元素</h2>
            <div className="flex gap-2">
              {/* Secondary button 1 */}
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1 rounded-full text-body-sm border border-border bg-card text-on-surface hover:border-primary/40 transition-all duration-200"
                data-testid="select-all-elements"
              >
                全选
              </button>
              {/* Secondary button 2 */}
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1 rounded-full text-body-sm border border-border bg-card text-on-surface hover:border-primary/40 transition-all duration-200"
                data-testid="clear-elements"
              >
                清空
              </button>
            </div>
          </div>
          <ElementsInlineMultiPicker
            value={elements}
            onChange={setElements}
            showCount
            layout="grouped"
          />
        </section>
      </FadeInWrapper>

      {/* AC-2(3): 行业领域 input */}
      <FadeInWrapper delay={0.1} from="up">
        <div className="space-y-2">
          <label
            htmlFor="boom-industry"
            className="block text-body-md font-medium text-on-surface"
          >
            行业领域
            <span className="ml-1 text-body-sm text-muted-foreground font-normal">（可选）</span>
          </label>
          <input
            id="boom-industry"
            type="text"
            placeholder={
              industryDefault
                ? `当前：${industryDefault}（可手动输入覆盖）`
                : '如：美容、教育、餐饮...'
            }
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="boom-industry-input"
          />
        </div>
      </FadeInWrapper>

      {/* AC-2(4): 主题方向 input */}
      <FadeInWrapper delay={0.15} from="up">
        <div className="space-y-2">
          <label
            htmlFor="boom-topic"
            className="block text-body-md font-medium text-on-surface"
          >
            主题方向
            <span className="ml-1 text-body-sm text-muted-foreground font-normal">（可选）</span>
          </label>
          <input
            id="boom-topic"
            type="text"
            placeholder="如：减肥、理财、育儿..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="boom-topic-input"
          />
        </div>
      </FadeInWrapper>

      {/* AC-2(5): 主 CTA */}
      <FadeInWrapper delay={0.2} from="up">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isDisabled || isSubmitting}
          className={cn(
            'w-full py-3 rounded-xl font-display font-bold text-white bg-gradient-to-r from-primary to-primary/60 transition-opacity',
            (isDisabled || isSubmitting) && 'opacity-50 cursor-not-allowed',
          )}
          data-testid="boom-generate-cta"
        >
          {isSubmitting ? '生成中...' : '一键生成爆款文案'}
        </button>
      </FadeInWrapper>

      {/* Loading skeleton */}
      {isSubmitting && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-32 w-full rounded bg-muted" />
          <div className="h-32 w-full rounded bg-muted" />
        </div>
      )}

      {/* AC-2(6): 结果区 — 5 篇 card 网格 */}
      {result && !isSubmitting && (
        <div className="space-y-4" data-testid="tool-result-boom-generate-wrapper">
          <BoomGenerateResult data={result} />
        </div>
      )}
    </main>
  );
}
