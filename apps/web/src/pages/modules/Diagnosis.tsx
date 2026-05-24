// AC-1 · H1/subtitle 字面锁 · D-226/227 严守 → Sally 1:1 重写
// AC-4 · useMutation → trpc.diagnosis.generate · loading Loader2 + 'AI 分析中...'
// AC-7 · onError → toast.error + retry button
// isReportView · mock-first report 渲染(SPEC §7.1)

import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ActionPlanCardsSection } from '@/components/diagnosis/ActionPlanCardsSection';
import { CoreIssuesCard } from '@/components/diagnosis/CoreIssuesCard';
import { DetailedReportSection } from '@/components/diagnosis/DetailedReportSection';
import { DiagnosisHeader } from '@/components/diagnosis/DiagnosisHeader';
import { DiagnosisStepCard } from '@/components/diagnosis/DiagnosisStepCard';
import { IPHealthScoreCard } from '@/components/diagnosis/IPHealthScoreCard';
import { IPRadarChart } from '@/components/diagnosis/IPRadarChart';
import { PriorityPlanSection } from '@/components/diagnosis/PriorityPlanSection';
import { ReportFooterActions } from '@/components/diagnosis/ReportFooterActions';
import { WeeklyTasksSection } from '@/components/diagnosis/WeeklyTasksSection';
import { FadeInWrapper } from '@/components/FadeInWrapper';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import {
  DIAGNOSIS_H1,
  DIAGNOSIS_DIMENSIONS_8,
  DIAGNOSIS_MOCK_REPORT,
} from '@/lib/constants/diagnosis';
import { getLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

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
  const navigate = useNavigate();

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

  // isReportView: mock-first report 渲染(SPEC §7.1)
  const [isReportView, setIsReportView] = useState(false);

  // AC-7 · Persist to localStorage on every change
  useEffect(() => {
    if (!lsKey) return;
    try {
      localStorage.setItem(lsKey, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [lsKey, progress]);

  // AC-4: useMutation hook → trpc.diagnosis.generate (kept · but mock-first)
  const generateMutation = trpc.diagnosis.generate.useMutation({
    onSuccess: () => {
      // mock-first: setIsReportView already set in handleNext
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
      // mock-first: skip to report view immediately
      setIsReportView(true);
      // Also fire mutation (backend preserved for PRR)
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
    setIsReportView(false);
    generateMutation.reset();
  }, [generateMutation]);

  const handleHistory = useCallback(() => {
    toast.info('诊断历史 · 即将上线');
  }, []);

  const handleTodayTasks = useCallback(() => {
    navigate('/daily-tasks');
  }, [navigate]);

  // AC-4: loading state — show spinner while mutation is pending (not blocking report since mock-first)
  if (generateMutation.isPending && !isReportView) {
    return (
      <main className="flex-1 container py-8 max-w-3xl flex flex-col items-center justify-center gap-6" data-testid="diagnosis-loading">
        <FadeInWrapper from="up">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground mt-4">AI 分析中...</p>
          <p className="text-sm text-muted-foreground">正在生成 7 维度诊断报告，请稍候 (约 8-15 秒)</p>
        </FadeInWrapper>
      </main>
    );
  }

  // AC-7: error state — show retry button (only when no report at all)
  if (generateMutation.isError && !isReportView) {
    return (
      <main className="flex-1 container py-8 max-w-3xl" data-testid="diagnosis-error">
        <FadeInWrapper from="up">
          <h1 className="text-h1 font-display text-on-surface mb-2">{DIAGNOSIS_H1}</h1>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex flex-col gap-4 mt-8">
            <p className="text-base text-on-surface">生成报告失败 · 请稍后再试</p>
            <button
              type="button"
              onClick={handleRetry}
              data-testid="retry-button"
              className="self-start rounded-md bg-primary px-5 py-2.5 text-base font-label text-on-primary hover:bg-primary/90 transition-colors"
            >
              重试
            </button>
          </div>
        </FadeInWrapper>
      </main>
    );
  }

  // Report view (mock-first · SPEC §7.1 · 7 sub-section)
  if (isReportView) {
    const MOCK = DIAGNOSIS_MOCK_REPORT;
    return (
      <main className="flex-1 container py-8 max-w-5xl" data-testid="diagnosis-report">
        <FadeInWrapper from="up">
          {/* Shared header: report uses step 7 (0-indexed, 8/8 all lit) */}
          <DiagnosisHeader currentStep={7} totalSteps={TOTAL_STEPS} />

          <div className="flex flex-col gap-8">
            {/* Section A: 总分 + 雷达图 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IPHealthScoreCard
                scores={MOCK.dimensionScores}
                overallScore={MOCK.overallScore}
              />
              <IPRadarChart scores={MOCK.dimensionScores} />
            </div>

            {/* Section B: 核心问题 */}
            <CoreIssuesCard issues={MOCK.coreIssues} />

            {/* Section C: 详细诊断报告 */}
            <DetailedReportSection
              intro={MOCK.intro}
              reportH2={MOCK.reportH2}
              verdictLead={MOCK.overallVerdictLead}
              verdictBody={MOCK.overallVerdictBody}
              details={MOCK.details}
            />

            {/* Section D: 优先级排序及行动计划 */}
            <PriorityPlanSection
              intro={MOCK.priorityIntro}
              steps={MOCK.prioritySteps}
            />

            {/* Section E: 本周立即行动任务清单 */}
            <WeeklyTasksSection
              tasks={MOCK.weeklyTasks}
              closing={MOCK.closingNote}
            />

            {/* Section F: 行动计划 5 cards */}
            <ActionPlanCardsSection plans={MOCK.actionPlans} />

            {/* Section G: 底部 3 button */}
            <ReportFooterActions
              onRestart={handleRestartDiagnosis}
              onHistory={handleHistory}
              onTodayTasks={handleTodayTasks}
            />
          </div>
        </FadeInWrapper>
      </main>
    );
  }

  // Wizard view (form)
  return (
    <main className="flex-1 container py-8 max-w-3xl">
      <FadeInWrapper from="up">
        {/* Shared header */}
        <DiagnosisHeader currentStep={progress.currentStep} totalSteps={TOTAL_STEPS} />

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
