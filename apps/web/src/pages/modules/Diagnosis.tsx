// AC-1 · H1/subtitle 字面锁 · D-226/227 严守
// AC-5 · useState 管理 8 step 状态 · AC-7 · localStorage save (acc_ prefix · LD-009)

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { DiagnosisStepCard } from '@/components/diagnosis/DiagnosisStepCard';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getLsKey } from '@/lib/ls-namespace';
import {
  DIAGNOSIS_H1,
  DIAGNOSIS_SUBTITLE,
  DIAGNOSIS_DIMENSIONS_8,
  REPORT_DIMENSIONS_7,
  REPORT_SUGGESTIONS,
} from '@/lib/constants/diagnosis';

const TOTAL_STEPS = 8;

interface DiagnosisProgress {
  currentStep: number;
  selectedAnswers: Record<string, string[]>;
  notesPerStep: Record<string, string>;
  industry: string;
  product: string;
  stage: string;
  showReport: boolean;
}

function getInitialProgress(): DiagnosisProgress {
  return {
    currentStep: 0,
    selectedAnswers: {},
    notesPerStep: {},
    industry: '',
    product: '',
    stage: '',
    showReport: false,
  };
}

// Stub: deterministic-ish score in 60-95 range per dimension
function stubScore(dimensionId: string): number {
  const hash = dimensionId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return 60 + (hash % 36);
}

export default function Diagnosis() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const lsKey = accountId != null ? getLsKey(accountId, 'diagnosis_progress') : null;

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

  // AC-7 · Persist to localStorage on every change
  useEffect(() => {
    if (!lsKey) return;
    try {
      localStorage.setItem(lsKey, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [lsKey, progress]);

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
      setProgress((prev) => ({ ...prev, showReport: true }));
    } else {
      setProgress((prev) => ({ ...prev, currentStep: nextStep }));
    }
  }, [progress.currentStep]);

  const handleExportPdf = useCallback(() => {
    toast.info('导出功能 PRD-25+');
  }, []);

  const handleRestartDiagnosis = useCallback(() => {
    setProgress(getInitialProgress());
  }, []);

  // Report view (after Step 8 submit)
  if (progress.showReport) {
    return (
      <main className="flex-1 container py-8 max-w-3xl" data-testid="diagnosis-report">
        <FadeInWrapper from="up">
          <h1 className="text-h1 font-display text-on-surface mb-2">{DIAGNOSIS_H1}</h1>
          <p className="text-body-md text-muted-foreground mb-8">{DIAGNOSIS_SUBTITLE}</p>

          <h2 className="text-h2 font-display text-on-surface mb-6">7 维度 IP 健康度报告</h2>

          <div className="flex flex-col gap-4 mb-8">
            {REPORT_DIMENSIONS_7.map((dim) => {
              const score = stubScore(dim.id);
              const suggestion = REPORT_SUGGESTIONS[dim.id] ?? '';
              return (
                <div
                  key={dim.id}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2"
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
                  <p className="text-body-sm text-muted-foreground">{suggestion}</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleExportPdf}
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
