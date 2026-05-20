// AC-1 · H1/subtitle 字面锁 · D-226/227 严守
// AC-4 · useMutation → trpc.diagnosis.generate · loading Loader2 + 'AI 分析中...'
// AC-5 · 7 维度报告渲染 report.dimensions[dim.id]?.score + issues + suggestions
// AC-6 · isFallback=true → 灰色 hint banner + retry button
// AC-7 · onError → toast.error + retry button

import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { DiagnosisStepCard } from '@/components/diagnosis/DiagnosisStepCard';
import { FadeInWrapper } from '@/components/FadeInWrapper';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import {
  DIAGNOSIS_H1,
  DIAGNOSIS_SUBTITLE,
  DIAGNOSIS_DIMENSIONS_8,
  REPORT_DIMENSIONS_7,
} from '@/lib/constants/diagnosis';
import { getLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

import type { DiagnosisGenerateOutput } from '@quanan/clients/router-types';

const TOTAL_STEPS = 8;

interface DiagnosisProgress {
  currentStep: number;
  selectedAnswers: Record<string, string[]>;
  notesPerStep: Record<string, string>;
  industry: string;
  product: string;
  stage: string;
}

function getInitialProgress(): DiagnosisProgress {
  return {
    currentStep: 0,
    selectedAnswers: {},
    notesPerStep: {},
    industry: '',
    product: '',
    stage: '',
  };
}

type DimensionResult = { score: number; issues: string[]; suggestions: string[] };

function getDimensions(report: DiagnosisGenerateOutput): Record<string, DimensionResult> {
  if (!report?.dimensions || typeof report.dimensions !== 'object') return {};
  return report.dimensions as Record<string, DimensionResult>;
}

function buildAnswers(progress: DiagnosisProgress) {
  return DIAGNOSIS_DIMENSIONS_8.map((dim) => {
    if (dim.id === 'basic') {
      const filled = [progress.industry, progress.product, progress.stage].filter(Boolean).length;
      const comment = [progress.industry, progress.product, progress.stage]
        .filter(Boolean).join(' | ').slice(0, 200);
      return { dimension: dim.id, score: Math.round((filled / 3) * 10), comment: comment || undefined };
    }
    const selected = progress.selectedAnswers[dim.id] ?? [];
    const total = dim.checkboxes.length;
    const score = total > 0 ? Math.round((selected.length / total) * 10) : 0;
    const comment = progress.notesPerStep[dim.id];
    return { dimension: dim.id, score, comment: comment || undefined };
  });
}

export default function Diagnosis() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const lsKey = accountId !== null ? getLsKey(accountId, 'diagnosis_progress') : null;

  const [progress, setProgress] = useState<DiagnosisProgress>(() => {
    if (typeof window === 'undefined' || !lsKey) return getInitialProgress();
    try {
      const saved = localStorage.getItem(lsKey);
      if (saved) return JSON.parse(saved) as DiagnosisProgress;
    } catch {
      // ignore
    }
    return getInitialProgress();
  });

  const [report, setReport] = useState<DiagnosisGenerateOutput | null>(null);

  // AC-7 · Persist to localStorage on every change
  useEffect(() => {
    if (!lsKey) return;
    try {
      localStorage.setItem(lsKey, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [lsKey, progress]);

  // AC-4: useMutation hook → trpc.diagnosis.generate
  const generateMutation = trpc.diagnosis.generate.useMutation({
    onSuccess: (data) => {
      setReport(data as DiagnosisGenerateOutput);
    },
    onError: () => {
      toast.error('生成报告失败 · 请稍后再试');
    },
  });

  const dimension = DIAGNOSIS_DIMENSIONS_8[progress.currentStep]!;
  const dimensionId = dimension.id;

  const selectedCheckboxes = progress.selectedAnswers[dimensionId] ?? [];
  const currentNotes = progress.notesPerStep[dimensionId] ?? '';

  const handleCheckboxToggle = useCallback((item: string) => {
    setProgress((prev) => {
      const current = prev.selectedAnswers[dimensionId] ?? [];
      const updated = current.includes(item)
        ? current.filter((c) => c !== item)
        : [...current, item];
      return {
        ...prev,
        selectedAnswers: { ...prev.selectedAnswers, [dimensionId]: updated },
      };
    });
  }, [dimensionId]);

  const handleNotesChange = useCallback((notes: string) => {
    setProgress((prev) => ({
      ...prev,
      notesPerStep: { ...prev.notesPerStep, [dimensionId]: notes },
    }));
  }, [dimensionId]);

  const handlePrev = useCallback(() => {
    setProgress((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  }, []);

  const handleNext = useCallback(() => {
    const nextStep = progress.currentStep + 1;
    if (nextStep >= TOTAL_STEPS) {
      // AC-4: 触发 LLM 生成诊断报告
      const answers = buildAnswers(progress);
      generateMutation.mutate({
        answers,
        inferredStage: progress.stage || 'starter',
      });
    } else {
      setProgress((prev) => ({ ...prev, currentStep: nextStep }));
    }
  }, [progress, generateMutation]);

  const handleRetry = useCallback(() => {
    generateMutation.reset();
    const answers = buildAnswers(progress);
    generateMutation.mutate({
      answers,
      inferredStage: progress.stage || 'starter',
    });
  }, [progress, generateMutation]);

  const handleRestartDiagnosis = useCallback(() => {
    setProgress(getInitialProgress());
    setReport(null);
    generateMutation.reset();
  }, [generateMutation]);

  // AC-4: loading state — show spinner while mutation is pending
  if (generateMutation.isPending) {
    return (
      <main className="flex-1 container py-8 max-w-3xl flex flex-col items-center justify-center gap-6" data-testid="diagnosis-loading">
        <FadeInWrapper from="up">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-body-lg text-muted-foreground mt-4">AI 分析中...</p>
          <p className="text-body-sm text-muted-foreground">正在生成 7 维度诊断报告，请稍候 (约 8-15 秒)</p>
        </FadeInWrapper>
      </main>
    );
  }

  // AC-7: error state — show retry button
  if (generateMutation.isError && report === null) {
    return (
      <main className="flex-1 container py-8 max-w-3xl" data-testid="diagnosis-error">
        <FadeInWrapper from="up">
          <h1 className="text-h1 font-display text-on-surface mb-2">{DIAGNOSIS_H1}</h1>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex flex-col gap-4 mt-8">
            <p className="text-body-md text-on-surface">生成报告失败 · 请稍后再试</p>
            <button
              type="button"
              onClick={handleRetry}
              data-testid="retry-button"
              className="self-start rounded-md bg-primary px-5 py-2.5 text-body-md font-label text-on-primary hover:bg-primary/90 transition-colors"
            >
              重试
            </button>
          </div>
        </FadeInWrapper>
      </main>
    );
  }

  // AC-5: Report view (after successful mutation)
  if (report !== null) {
    const dimensions = getDimensions(report);

    return (
      <main className="flex-1 container py-8 max-w-3xl" data-testid="diagnosis-report">
        <FadeInWrapper from="up">
          <h1 className="text-h1 font-display text-on-surface mb-2">{DIAGNOSIS_H1}</h1>
          <p className="text-body-md text-muted-foreground mb-8">{DIAGNOSIS_SUBTITLE}</p>

          {/* AC-6: isFallback hint banner */}
          {report.isFallback && (
            <div
              className="mb-6 rounded-xl border border-border bg-surface-container px-4 py-3 flex items-center justify-between gap-4"
              data-testid="fallback-banner"
            >
              <p className="text-body-sm text-muted-foreground">
                AI 暂未生成深度分析 · 显示规则评分
              </p>
              <button
                type="button"
                onClick={handleRetry}
                data-testid="fallback-retry-button"
                className="rounded-md border border-border px-3 py-1.5 text-body-sm font-label text-on-surface hover:border-primary/40 transition-colors shrink-0"
              >
                重新生成
              </button>
            </div>
          )}

          <h2 className="text-h2 font-display text-on-surface mb-6">7 维度 IP 健康度报告</h2>

          {/* AC-5: overallScore */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 mb-6 flex items-center justify-between">
            <span className="text-body-md font-label text-on-surface">整体评分</span>
            <span className="text-h2 font-display text-primary" data-testid="overall-score">
              {report.overallScore}
            </span>
          </div>

          {/* AC-5: 7 维度卡 */}
          <div className="flex flex-col gap-4 mb-8">
            {REPORT_DIMENSIONS_7.map((dim) => {
              const dimResult = dimensions[dim.id];
              const score = dimResult?.score ?? 0;
              const issues = dimResult?.issues ?? [];
              const suggestions = dimResult?.suggestions ?? [];
              return (
                <div
                  key={dim.id}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3"
                  data-testid={`report-dimension-${dim.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-label-md font-label text-on-surface">{dim.label}</span>
                    <span
                      className="text-h3 font-display text-primary"
                      data-testid={`report-score-${dim.id}`}
                    >
                      {score}
                    </span>
                  </div>
                  {issues.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-label-sm font-label text-muted-foreground">问题</p>
                      <ul className="flex flex-col gap-1 list-disc list-inside">
                        {issues.map((issue, i) => (
                          <li key={i} className="text-body-sm text-on-surface">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-label-sm font-label text-muted-foreground">建议</p>
                      <ul className="flex flex-col gap-1 list-disc list-inside">
                        {suggestions.map((sug, i) => (
                          <li key={i} className="text-body-sm text-primary">{sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AC-5: priority list */}
          {report.recommendedSteps.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 mb-8" data-testid="priority-list">
              <p className="text-label-md font-label text-on-surface mb-3">优先改进项</p>
              <ol className="flex flex-col gap-2 list-decimal list-inside">
                {(report.recommendedSteps as string[]).map((step, i) => (
                  <li key={i} className="text-body-sm text-on-surface">{step}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => toast.info('导出功能 PRD-25+')}
              data-testid="export-pdf-button"
              className="rounded-md bg-primary px-5 py-2.5 text-body-md font-label text-on-primary hover:bg-primary/90 transition-colors"
            >
              导出诊断报告 PDF
            </button>
            <button
              type="button"
              onClick={handleRestartDiagnosis}
              data-testid="restart-diagnosis-button"
              className="rounded-md border border-border px-5 py-2.5 text-body-md font-label text-on-surface hover:border-primary/40 transition-colors"
            >
              重新诊断
            </button>
          </div>
        </FadeInWrapper>
      </main>
    );
  }

  // Wizard view
  return (
    <main className="flex-1 container py-8 max-w-3xl">
      <FadeInWrapper from="up">
        <h1 className="text-h1 font-display text-on-surface mb-2">{DIAGNOSIS_H1}</h1>
        <p className="text-body-md text-muted-foreground mb-8">{DIAGNOSIS_SUBTITLE}</p>

        <DiagnosisStepCard
          stepIndex={progress.currentStep + 1}
          totalSteps={TOTAL_STEPS}
          dimension={dimension}
          selectedCheckboxes={selectedCheckboxes}
          onCheckboxToggle={handleCheckboxToggle}
          notes={currentNotes}
          onNotesChange={handleNotesChange}
          onPrev={handlePrev}
          onNext={handleNext}
          isFirst={progress.currentStep === 0}
          isLast={progress.currentStep === TOTAL_STEPS - 1}
          industry={progress.industry}
          onIndustryChange={(v) => setProgress((prev) => ({ ...prev, industry: v }))}
          product={progress.product}
          onProductChange={(v) => setProgress((prev) => ({ ...prev, product: v }))}
          stage={progress.stage}
          onStageChange={(v) => setProgress((prev) => ({ ...prev, stage: v }))}
        />
      </FadeInWrapper>
    </main>
  );
}
