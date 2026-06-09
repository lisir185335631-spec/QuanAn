// AC-1 · H1/subtitle 字面锁 · D-226/227 严守 → Sally 1:1 重写
// AC-4 · useMutation → trpc.diagnosis.generate · loading progress_activity + 'AI 分析中...'
// AC-7 · onError → toast.error + retry button
// 阶段2: 真后端驱动 — onSuccess(report) → 存 report state + setIsReportView(true)

import { motion } from 'framer-motion';
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
import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import {
  DIAGNOSIS_H1,
  DIAGNOSIS_DIMENSIONS_8,
} from '@/lib/constants/diagnosis';
import type {
  ActionPlanCardData,
  DimensionDetailData,
  PriorityStepData,
  WeeklyTaskItem,
} from '@/lib/constants/diagnosis';
import { getLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

// Local report type matching the real backend response shape
interface DiagnosisReportData {
  id: number;
  answers: unknown;
  dimensions: unknown;
  overallScore: number;
  inferredStage: string;
  topPriority: string;
  recommendedSteps: unknown[];
  agentId: string;
  traceId: string | null;
  isFallback: boolean;
  modelUsed: string | null;
  tokensUsed: number | null;
  durationMs: number | null;
  createdAt: string;
}

// ── dimension key → display labels ──────────────────────────────────────────

const DIM_LABELS: Record<string, { shortLabel: string; radarLabel: string; label: string }> = {
  positioning: { shortLabel: '定位清晰', radarLabel: '定位', label: '定位清晰度' },
  branding:    { shortLabel: '账号包装', radarLabel: '包装', label: '账号包装' },
  traffic:     { shortLabel: '流量型内', radarLabel: '流',   label: '流量型内容' },
  value:       { shortLabel: '价值型内', radarLabel: '价值', label: '价值型内容' },
  case:        { shortLabel: '案例型内', radarLabel: '案例', label: '案例型内容' },
  persona:     { shortLabel: '人设型内', radarLabel: '设',   label: '人设型内容' },
  authentic:   { shortLabel: '内容状态', radarLabel: '状态', label: '内容状态' },
};

const DIM_ORDER = ['positioning', 'branding', 'traffic', 'value', 'case', 'persona', 'authentic'] as const;

// ── report data mapper ────────────────────────────────────────────────────────

type DimData = { score: number; issues: string[]; suggestions: string[] };

function getDimensions(rawDimensions: unknown): Record<string, DimData> {
  if (!rawDimensions || typeof rawDimensions !== 'object') return {};
  return rawDimensions as Record<string, DimData>;
}

function buildDimensionScores(dims: Record<string, DimData>) {
  return DIM_ORDER.map((key) => {
    const d = dims[key];
    const labels = DIM_LABELS[key]!;
    return {
      id: key,
      shortLabel: labels.shortLabel,
      radarLabel: labels.radarLabel,
      score: d?.score ?? 0,
    };
  });
}

function buildCoreIssues(dims: Record<string, DimData>): string[] {
  // Sort dims by score ascending → worst first; flatten their issues
  const sorted = DIM_ORDER
    .map((key) => ({ key, d: dims[key] }))
    .sort((a, b) => (a.d?.score ?? 0) - (b.d?.score ?? 0));

  const issues: string[] = [];
  for (const { key, d } of sorted) {
    if (!d || !d.issues) continue;
    const labels = DIM_LABELS[key]!;
    for (const issue of d.issues) {
      if (issue.trim()) issues.push(`[${labels.label}] ${issue}`);
      if (issues.length >= 4) break;
    }
    if (issues.length >= 4) break;
  }

  // Fallback if LLM returned empty issues
  if (issues.length === 0) {
    for (const key of sorted.slice(0, 3).map((x) => x.key)) {
      const labels = DIM_LABELS[key]!;
      issues.push(`${labels.label} 维度得分偏低，需重点改善。`);
    }
  }
  return issues.slice(0, 4);
}

function getOverallVerdict(overallScore: number): { lead: string; body: string; intro: string; reportH2: string } {
  if (overallScore >= 70) {
    return {
      intro: '你的IP整体基础较好，已具备一定的运营积累。现在的关键是把优势维度继续放大，同时补齐短板，朝着更系统化、更高变现效率的方向推进。',
      reportH2: 'IP诊断报告',
      lead: '整体评价：',
      body: '你整体处于成长期中上水平，部分维度已有明显优势，但仍有可精进的空间，持续优化可加速变现。',
    };
  }
  if (overallScore >= 40) {
    return {
      intro: '你的IP有一定基础，但还有几个关键维度需要重点改善。只要按照优先级逐步完善，变现效率会显著提升。',
      reportH2: 'IP诊断报告',
      lead: '整体评价：',
      body: '你目前处于成长期，基础已有，但距离稳定变现还需要补齐几个核心短板，按优先级逐步改善是最优路径。',
    };
  }
  return {
    intro: '你的IP目前还处于比较初级的阶段，大部分维度都需要从零开始建立。别慌，按照下面的优先级一步步来，每完成一步都是巨大的进步。',
    reportH2: 'IP诊断报告',
    lead: '整体评价：',
    body: '你目前还在起步阶段，大多数维度还是一张白纸，先把最核心的定位和包装做起来，其余逐步跟上。',
  };
}

function buildDetails(dims: Record<string, DimData>): DimensionDetailData[] {
  return DIM_ORDER.map((key, idx) => {
    const d = dims[key];
    const labels = DIM_LABELS[key]!;
    const score = d?.score ?? 0;
    const issues = d?.issues ?? [];
    const suggestions = d?.suggestions ?? [];

    const statusText = issues.length > 0
      ? issues.join('；')
      : score >= 7 ? `${labels.label}状态良好，继续保持。` : `${labels.label}还有提升空间。`;

    const problemText = issues.length > 0
      ? issues[0]!
      : score < 5
        ? `${labels.label}得分偏低(${score}/10)，需要重点改善。`
        : `${labels.label}得分(${score}/10)，可进一步强化。`;

    const solutions = suggestions.length > 0
      ? suggestions.map((s, si) => ({ heading: `建议${si + 1}：`, body: s }))
      : [{ heading: '改进方向：', body: `加强${labels.label}方面的系统化建设，参考行业最佳实践。` }];

    return {
      num: idx + 1,
      label: labels.label,
      status: statusText,
      problem: problemText,
      solutions,
    };
  });
}

function buildPrioritySteps(
  recommendedSteps: unknown[],
  dims: Record<string, DimData>,
): PriorityStepData[] {
  const steps = (recommendedSteps as string[]).filter(Boolean).slice(0, 5);

  if (steps.length === 0) {
    // Fallback: derive from worst dims
    return DIM_ORDER
      .map((key) => ({ key, score: dims[key]?.score ?? 0 }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(({ key }, idx) => {
        const labels = DIM_LABELS[key]!;
        const suggestion = dims[key]?.suggestions?.[0] ?? `完善${labels.label}`;
        return {
          num: idx + 1,
          title: `第${idx + 1}步（${idx === 0 ? '本周内' : `${idx + 1}周内`}）：${labels.label}`,
          exec: suggestion,
        };
      });
  }

  const timeLabels = ['本周内', '1周内', '2周内', '3周内', '4周内'];
  return steps.map((step, idx) => ({
    num: idx + 1,
    title: `第${idx + 1}步（${timeLabels[idx] ?? `${idx + 1}周内`}）：${step}`,
    exec: step,
  }));
}

function buildWeeklyTasks(dims: Record<string, DimData>): WeeklyTaskItem[] {
  const tasks: WeeklyTaskItem[] = [];
  // Take first suggestion from each of the 4 worst dims
  const sorted = DIM_ORDER
    .map((key) => ({ key, d: dims[key] }))
    .sort((a, b) => (a.d?.score ?? 0) - (b.d?.score ?? 0));

  for (const { key, d } of sorted) {
    const labels = DIM_LABELS[key]!;
    const suggestion = d?.suggestions?.[0];
    if (suggestion) {
      tasks.push({ heading: `${labels.label}：`, body: suggestion });
    } else {
      tasks.push({ heading: `${labels.label}：`, body: `本周重点改善${labels.label}，参考诊断建议落地执行。` });
    }
    if (tasks.length >= 4) break;
  }
  return tasks;
}

function buildActionPlans(
  recommendedSteps: unknown[],
  dims: Record<string, DimData>,
): ActionPlanCardData[] {
  const steps = (recommendedSteps as string[]).filter(Boolean).slice(0, 5);
  const timeLabels = ['本周内', '1周内', '2周内', '3周内', '4周内'];

  if (steps.length >= 3) {
    return steps.map((step, idx) => {
      // Find which dim this step is most relevant to by checking if the step
      // text contains the dimension label (full or first 2 chars), or matches
      // any of the dim's suggestions (first 3 chars overlap).
      const relatedDim = DIM_ORDER.find((k) => {
        const label = DIM_LABELS[k]!.label;
        if (step.includes(label) || step.includes(label.slice(0, 2))) return true;
        return (dims[k]?.suggestions ?? []).some(
          (s) => s.length >= 3 && step.includes(s.slice(0, 3)),
        );
      });
      return {
        num: idx + 1,
        title: step,
        dimension: relatedDim ? DIM_LABELS[relatedDim]!.label : '综合优化',
        deadline: timeLabels[idx] ?? `${idx + 1}周内`,
      };
    });
  }

  // Fallback: build from dims
  return DIM_ORDER
    .map((key) => ({ key, score: dims[key]?.score ?? 0 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map(({ key }, idx) => {
      const labels = DIM_LABELS[key]!;
      const suggestion = dims[key]?.suggestions?.[0] ?? `完善${labels.label}`;
      return {
        num: idx + 1,
        title: suggestion,
        dimension: labels.label,
        deadline: timeLabels[idx] ?? `${idx + 1}周内`,
      };
    });
}

// ── page state ───────────────────────────────────────────────────────────────

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

  // 阶段2: 真实报告 state(由 onSuccess 写入)
  const [isReportView, setIsReportView] = useState(false);
  const [report, setReport] = useState<DiagnosisReportData | null>(null);

  // Persist progress to localStorage
  useEffect(() => {
    if (!lsKey) return;
    try {
      localStorage.setItem(lsKey, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [lsKey, progress]);

  // 阶段2: onSuccess 真正保存 report + 切换到报告视图
  const generateMutation = trpc.diagnosis.generate.useMutation({
    onSuccess: (data) => {
      setReport(data as DiagnosisReportData);
      setIsReportView(true);
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

  // 阶段2: 最后一步只 fire mutation，不再直接 setIsReportView
  const handleNext = useCallback(() => {
    const nextStep = progress.currentStep + 1;
    if (nextStep >= TOTAL_STEPS) {
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
    setReport(null);
    generateMutation.reset();
  }, [generateMutation]);

  const handleHistory = useCallback(() => {
    toast.info('诊断历史 · 即将上线');
  }, []);

  const handleTodayTasks = useCallback(() => {
    navigate('/daily-tasks');
  }, [navigate]);

  // AC-4: loading state — show spinner while mutation is pending
  if (generateMutation.isPending) {
    return (
      <LiquidShell>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            padding: '64px 0',
            maxWidth: 768,
          }}
          data-testid="diagnosis-loading"
        >
          <FadeInWrapper from="up">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              {/* Material Symbols spinner */}
              <span
                className="material-symbols-outlined animate-spin"
                aria-hidden={true}
                style={{ fontSize: 48, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}
              >
                progress_activity
              </span>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>AI 分析中...</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontFamily: F.cn, margin: 0 }}>正在生成 7 维度诊断报告，请稍候 (约 8-15 秒)</p>
            </div>
          </FadeInWrapper>
        </div>
      </LiquidShell>
    );
  }

  // AC-7: error state — show retry button
  if (generateMutation.isError) {
    return (
      <LiquidShell>
        <div
          style={{ padding: '32px 0', maxWidth: 768 }}
          data-testid="diagnosis-error"
        >
          <FadeInWrapper from="up">
            {/* Header chrome */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ink,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                智能引擎
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid rgba(168,197,224,0.55)`,
                  background: 'rgba(168,197,224,0.18)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                IP 诊断
              </span>
            </div>
            <h1
              style={{
                fontFamily: F.display,
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: 44,
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                textShadow: 'none',
              }}
            >
              {DIAGNOSIS_H1}
            </h1>
            <div
              className="lg-glass"
              style={{
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="material-symbols-outlined"
                  aria-hidden={true}
                  style={{ fontSize: 20, color: 'rgba(255,100,100,0.9)' }}
                >
                  error
                </span>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,180,180,0.95)', fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>生成报告失败 · 请稍后再试</p>
              </div>
              <Magnetic strength={0.3}>
                <button
                  type="button"
                  onClick={handleRetry}
                  data-testid="retry-button"
                  aria-label="重试"
                  className="lg-gradbtn"
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 9999,
                    padding: '10px 24px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: F.cn,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden={true}
                    style={{ fontSize: 18 }}
                  >
                    refresh
                  </span>
                  重试
                </button>
              </Magnetic>
            </div>
          </FadeInWrapper>
        </div>
      </LiquidShell>
    );
  }

  // Report view — 真实 report 驱动
  if (isReportView && report) {
    const dims = getDimensions(report.dimensions);
    const dimensionScores = buildDimensionScores(dims);
    const coreIssues = buildCoreIssues(dims);
    const verdict = getOverallVerdict(report.overallScore);
    const details = buildDetails(dims);
    const prioritySteps = buildPrioritySteps(report.recommendedSteps, dims);
    const weeklyTasks = buildWeeklyTasks(dims);
    const actionPlans = buildActionPlans(report.recommendedSteps, dims);

    const closingNote = report.overallScore >= 70
      ? '你已经站在不错的起跑线上了，接下来就是按照优先级逐步精进，把每一个维度都做到行业优秀水平，变现只会越来越顺。'
      : '记住，IP孵化变现不是玩虚的，每一步都要实打实地干。从现在开始，按照这个路子走，坚持执行，变现只是时间问题。';

    return (
      <LiquidShell>
        <div
          style={{ padding: '8px 0' }}
          data-testid="diagnosis-report"
        >
          <RevealGroup style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* isFallback 降级提示 */}
            {report.isFallback && (
              <Item>
                <div
                  className="lg-glass"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 12,
                    padding: '10px 16px',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden={true}
                    style={{ fontSize: 16, color: C.ikb }}
                  >
                    warning
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, textShadow: C.textShadow }}>AI 繁忙·降级结果 — 本次报告由备用模型生成，仅供参考</span>
                </div>
              </Item>
            )}

            {/* Shared header: report uses step 7 (0-indexed, 8/8 all lit) */}
            <Item>
              <DiagnosisHeader currentStep={7} totalSteps={TOTAL_STEPS} />
            </Item>

            {/* Section A: 总分 + 雷达图 */}
            <Item>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <IPHealthScoreCard
                  scores={dimensionScores}
                  overallScore={report.overallScore}
                />
                <IPRadarChart scores={dimensionScores} />
              </div>
            </Item>

            {/* Section B: 核心问题 */}
            <Item>
              <CoreIssuesCard issues={coreIssues} />
            </Item>

            {/* Section C: 详细诊断报告 */}
            <Item>
              <DetailedReportSection
                intro={verdict.intro}
                reportH2={verdict.reportH2}
                verdictLead={verdict.lead}
                verdictBody={verdict.body}
                details={details}
              />
            </Item>

            {/* Section D: 优先级排序及行动计划 */}
            <Item>
              <PriorityPlanSection
                intro={`根据你的诊断结果（总分 ${report.overallScore}/100），以下是优先级最高的行动步骤：`}
                steps={prioritySteps}
              />
            </Item>

            {/* Section E: 本周立即行动任务清单 */}
            <Item>
              <WeeklyTasksSection
                tasks={weeklyTasks}
                closing={closingNote}
              />
            </Item>

            {/* Section F: 行动计划 cards */}
            <Item>
              <ActionPlanCardsSection plans={actionPlans} />
            </Item>

            {/* Section G: 底部 3 button */}
            <Item>
              <ReportFooterActions
                onRestart={handleRestartDiagnosis}
                onHistory={handleHistory}
                onTodayTasks={handleTodayTasks}
              />
            </Item>
          </RevealGroup>
        </div>
      </LiquidShell>
    );
  }

  // Wizard view (form)
  return (
    <LiquidShell>
      <div style={{ padding: '8px 0', maxWidth: 768 }}>
        <Reveal>
          {/* Page header chips */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                borderRadius: 9999,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(12px)',
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.ink,
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              智能引擎
            </span>
            <span
              style={{
                borderRadius: 9999,
                border: `0.5px solid rgba(168,197,224,0.55)`,
                background: 'rgba(168,197,224,0.18)',
                backdropFilter: 'blur(12px)',
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.ikb,
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              IP 诊断
            </span>
          </div>

          {/* Main title — 冷蓝渐变字 */}
          <h1
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: 44,
              fontFamily: F.display,
              background: C.grad,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              textShadow: 'none',
            }}
          >
            {DIAGNOSIS_H1}
          </h1>

          {/* Shared header */}
          <DiagnosisHeader currentStep={progress.currentStep} totalSteps={TOTAL_STEPS} />

          {/* Wizard card — 液态玻璃面板 */}
          <motion.div
            className="lg-glass"
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{
              borderRadius: 20,
              padding: 32,
            }}
          >
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
          </motion.div>
        </Reveal>
      </div>
    </LiquidShell>
  );
}
