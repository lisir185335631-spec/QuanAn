/**
 * PRD-25 US-001 AC-9 · Diagnosis module unit tests
 * ≥ 5 tests: (a) useMutation 触发 (b) dimensions[dim.id].score 渲染 (c) isFallback hint banner
 *            (d) error retry button (e) loading spinner
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Diagnosis from '@/pages/modules/Diagnosis';

// ── Shared mock data ───────────────────────────────────────────────────────────

const MOCK_REPORT_NORMAL = {
  id: 42,
  answers: [],
  dimensions: {
    positioning: { score: 8, issues: ['定位略模糊'], suggestions: ['明确细分赛道'] },
    branding:    { score: 7, issues: ['简介待优化'], suggestions: ['补充价值主张'] },
    traffic:     { score: 5, issues: ['破圈内容不足'], suggestions: ['增加猎奇选题'] },
    value:       { score: 9, issues: [], suggestions: ['持续输出干货'] },
    case:        { score: 4, issues: ['案例展示较少'], suggestions: ['整理成功案例'] },
    persona:     { score: 6, issues: ['人设有待强化'], suggestions: ['分享真实故事'] },
    authentic:   { score: 7, issues: [], suggestions: ['保持口语化表达'] },
  },
  overallScore: 66,
  inferredStage: 'growth',
  topPriority: '增加案例内容',
  recommendedSteps: ['增加案例内容', '强化破圈选题', '优化账号简介'],
  agentId: 'DiagnosisAgent',
  traceId: 'trace-001',
  isFallback: false,
  modelUsed: 'claude-sonnet-4-6',
  tokensUsed: 1500,
  durationMs: 7200,
  createdAt: new Date().toISOString(),
};

const MOCK_REPORT_FALLBACK = {
  ...MOCK_REPORT_NORMAL,
  isFallback: true,
  modelUsed: 'fallback',
  overallScore: 50,
};

// ── Configurable mutation mock ─────────────────────────────────────────────────

type MutationOptions = {
  onSuccess?: (data: typeof MOCK_REPORT_NORMAL) => void;
  onError?: (err: Error) => void;
};

let mutationMode: 'success' | 'fallback' | 'error' | 'loading' = 'success';
const capturedMutate = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: { id: 1 }, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    diagnosis: {
      generate: {
        useMutation: vi.fn().mockImplementation((opts: MutationOptions = {}) => {
          const mutate = vi.fn((_input: unknown) => {
            capturedMutate(_input);
            if (mutationMode === 'success') opts.onSuccess?.(MOCK_REPORT_NORMAL);
            if (mutationMode === 'fallback') opts.onSuccess?.(MOCK_REPORT_FALLBACK);
            if (mutationMode === 'error') opts.onError?.(new Error('network error'));
          });
          return {
            mutate,
            isPending: mutationMode === 'loading',
            isError: mutationMode === 'error',
            reset: vi.fn(),
          };
        }),
      },
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

function renderDiagnosis() {
  return render(
    <MemoryRouter>
      <Diagnosis />
    </MemoryRouter>,
  );
}

function navigateToLastStep(times = 7) {
  for (let i = 0; i < times; i++) {
    fireEvent.click(screen.getByTestId('diagnosis-next'));
  }
}

describe('Diagnosis · PRD-25 US-001 AC-9', () => {
  beforeEach(() => {
    localStorage.clear();
    capturedMutate.mockClear();
    mutationMode = 'success';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // (a) useMutation 触发
  it('(a) 点击「生成诊断报告」触发 trpc.diagnosis.generate.useMutation', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(capturedMutate).toHaveBeenCalledOnce();
    const payload = capturedMutate.mock.calls[0]?.[0] as { answers: unknown[]; inferredStage: string };
    expect(payload.answers).toHaveLength(8);
    expect(typeof payload.inferredStage).toBe('string');
  });

  // (b) dimensions[dim.id].score 渲染
  it('(b) 报告渲染 dimensions[dim.id].score — 7 维度得分从 LLM 结果来', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    // positioning score = 8 from MOCK_REPORT_NORMAL
    const posScore = screen.getByTestId('report-score-positioning');
    expect(posScore).toHaveTextContent('8');
    // value score = 9
    const valScore = screen.getByTestId('report-score-value');
    expect(valScore).toHaveTextContent('9');
    // overall score = 66
    expect(screen.getByTestId('overall-score')).toHaveTextContent('66');
  });

  // (c) isFallback hint banner
  it('(c) isFallback=true 时显示灰色 hint banner + retry button', () => {
    mutationMode = 'fallback';
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    const banner = screen.getByTestId('fallback-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('AI 暂未生成深度分析 · 显示规则评分');
    expect(screen.getByTestId('fallback-retry-button')).toBeInTheDocument();
  });

  // (d) error retry button
  it('(d) onError 时显示 retry button + toast.error', async () => {
    mutationMode = 'error';
    const { toast } = await import('sonner');
    renderDiagnosis();
    // With isError=true from mock, component shows error view immediately
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    // Click retry → calls mutate() → onError() fires → toast.error
    act(() => {
      fireEvent.click(screen.getByTestId('retry-button'));
    });
    expect(toast.error).toHaveBeenCalledWith('生成报告失败 · 请稍后再试');
  });

  // (e) loading spinner
  it('(e) mutation pending 时显示 Loader2 spinner + "AI 分析中..."', () => {
    mutationMode = 'loading';
    renderDiagnosis();
    // With isPending=true from mock, component immediately shows loading state
    expect(screen.getByTestId('diagnosis-loading')).toBeInTheDocument();
    expect(screen.getByText('AI 分析中...')).toBeInTheDocument();
  });

  // issues/suggestions render
  it('每维度卡显示 issues 和 suggestions 列表', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    // positioning has issues=['定位略模糊'] and suggestions=['明确细分赛道']
    const posCard = screen.getByTestId('report-dimension-positioning');
    expect(posCard).toHaveTextContent('定位略模糊');
    expect(posCard).toHaveTextContent('明确细分赛道');
  });

  // priority list render
  it('优先改进项 priority list 渲染', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByTestId('priority-list')).toBeInTheDocument();
    expect(screen.getByTestId('priority-list')).toHaveTextContent('增加案例内容');
  });
});
