/**
 * Diagnosis module unit tests · Sally 1:1 版
 * mock-first report · isReportView state · 7 sub-section 验收
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

// ── Configurable mutation mock ─────────────────────────────────────────────────

type MutationOptions = {
  onSuccess?: (data: typeof MOCK_REPORT_NORMAL) => void;
  onError?: (err: Error) => void;
};

let mutationMode: 'success' | 'error' | 'loading' = 'success';
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

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

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

describe('Diagnosis · Sally 1:1', () => {
  beforeEach(() => {
    localStorage.clear();
    capturedMutate.mockClear();
    mutationMode = 'success';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Form 部分
  it('form 渲染: DiagnosisChip "IP健康度诊断" 可见', () => {
    renderDiagnosis();
    expect(screen.getByTestId('diagnosis-chip')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-chip')).toHaveTextContent('IP健康度诊断');
  });

  it('form 渲染: H1 字面锁(无空格)', () => {
    renderDiagnosis();
    expect(screen.getByText('7维度IP诊断报告')).toBeInTheDocument();
  });

  it('form 渲染: subtitle 字面锁(无空格)', () => {
    renderDiagnosis();
    expect(
      screen.getByText('像老师一样诊断你的IP，找出问题，给出具体可执行的改进方案'),
    ).toBeInTheDocument();
  });

  it('form 渲染: progress bar 8 段', () => {
    renderDiagnosis();
    expect(screen.getByTestId('diagnosis-progress-bar')).toBeInTheDocument();
  });

  it('Step 1 渲染: label "你的行业" / "你的产品/服务" / "你目前的阶段"', () => {
    renderDiagnosis();
    expect(screen.getByText('你的行业')).toBeInTheDocument();
    expect(screen.getByText('你的产品/服务')).toBeInTheDocument();
    expect(screen.getByText('你目前的阶段')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-industry')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-product')).toBeInTheDocument();
  });

  it('Step 1: 4 stage cards · 2x2 grid · desc 行渲染', () => {
    renderDiagnosis();
    expect(screen.getByTestId('diagnosis-stage-startup')).toBeInTheDocument();
    expect(screen.getByText('刚开始做IP，还在摸索中')).toBeInTheDocument();
    expect(screen.getByText('有一定内容了，但变现不稳定')).toBeInTheDocument();
  });

  it('8 step 切换: 点下一步进入 Step 2 · 显示 DimensionIconBlock', () => {
    renderDiagnosis();
    fireEvent.click(screen.getByTestId('diagnosis-next'));
    expect(screen.getByTestId('dimension-icon-block-positioning')).toBeInTheDocument();
  });

  it('Step 2: textarea placeholder 来自 DIAGNOSIS_DIMENSION_PLACEHOLDERS', () => {
    renderDiagnosis();
    fireEvent.click(screen.getByTestId('diagnosis-next'));
    const textarea = screen.getByTestId('diagnosis-notes');
    expect((textarea as HTMLTextAreaElement).placeholder).toContain('美业赛道');
  });

  it('最后一步 CTA 文字: "生成诊断报告"', () => {
    renderDiagnosis();
    navigateToLastStep();
    expect(screen.getByTestId('diagnosis-next')).toHaveTextContent('生成诊断报告');
  });

  it('上一步 disabled on Step 1', () => {
    renderDiagnosis();
    expect(screen.getByTestId('diagnosis-prev')).toBeDisabled();
  });

  it('上一步 enabled after step 2', () => {
    renderDiagnosis();
    fireEvent.click(screen.getByTestId('diagnosis-next'));
    expect(screen.getByTestId('diagnosis-prev')).not.toBeDisabled();
  });

  it('localStorage save: 进入 step 2 后 LS 有记录', () => {
    renderDiagnosis();
    fireEvent.click(screen.getByTestId('diagnosis-next'));
    const keys = Object.keys(localStorage);
    const diagKey = keys.find((k) => k.includes('diagnosis_progress'));
    expect(diagKey).toBeTruthy();
  });

  // Report 视图(mock-first)
  it('点击「生成诊断报告」→ isReportView → report 视图渲染', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByTestId('diagnosis-report')).toBeInTheDocument();
  });

  it('report 视图: IP健康度总分 可见', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByText('IP健康度总分')).toBeInTheDocument();
  });

  it('report 视图: 核心问题 card + 4 coreIssues', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByTestId('core-issues-card')).toBeInTheDocument();
    expect(screen.getByText('核心问题')).toBeInTheDocument();
    expect(screen.getByText('定位模糊，缺乏明确的目标客户和产品价值主张。')).toBeInTheDocument();
  });

  it('report 视图: 详细诊断报告 + IP诊断报告 H2 可见', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByText('详细诊断报告')).toBeInTheDocument();
    expect(screen.getByText('IP诊断报告')).toBeInTheDocument();
  });

  it('report 视图: 5 维度详细块(1-5)渲染', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByTestId('dimension-detail-block-1')).toBeInTheDocument();
    expect(screen.getByTestId('dimension-detail-block-5')).toBeInTheDocument();
  });

  it('report 视图: 优先级排序及行动计划', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByText('优先级排序及行动计划')).toBeInTheDocument();
    expect(screen.getByText('第一步（本周内）：定位清晰度')).toBeInTheDocument();
  });

  it('report 视图: 本周立即行动任务清单', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByText('本周立即行动任务清单')).toBeInTheDocument();
    expect(screen.getByText('明确细分赛道：')).toBeInTheDocument();
  });

  it('report 视图: 行动计划 5 cards', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByText('行动计划')).toBeInTheDocument();
    expect(screen.getByTestId('action-plan-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('action-plan-card-5')).toBeInTheDocument();
  });

  it('report 视图: 底部 3 button · 重新诊断 / 诊断历史 / 查看今日任务', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByTestId('restart-diagnosis-button')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-history-button')).toBeInTheDocument();
    expect(screen.getByTestId('today-tasks-button')).toBeInTheDocument();
  });

  it('report 重新诊断: 点击后回到 form 视图', () => {
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    // now in report view
    act(() => {
      fireEvent.click(screen.getByTestId('restart-diagnosis-button'));
    });
    // back to form
    expect(screen.getByTestId('diagnosis-chip')).toBeInTheDocument();
    expect(screen.queryByTestId('diagnosis-report')).not.toBeInTheDocument();
  });

  it('诊断历史 button: toast.info "诊断历史 · 即将上线"', async () => {
    const { toast } = await import('sonner');
    renderDiagnosis();
    navigateToLastStep();
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-history-button'));
    });
    expect(toast.info).toHaveBeenCalledWith('诊断历史 · 即将上线');
  });

  // error state
  it('onError 时显示 retry button + toast.error', async () => {
    mutationMode = 'error';
    const { toast } = await import('sonner');
    renderDiagnosis();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByTestId('retry-button'));
    });
    expect(toast.error).toHaveBeenCalledWith('生成报告失败 · 请稍后再试');
  });

  // loading state
  it('mutation pending 时显示 Loader2 spinner', () => {
    mutationMode = 'loading';
    renderDiagnosis();
    expect(screen.getByTestId('diagnosis-loading')).toBeInTheDocument();
    expect(screen.getByText('AI 分析中...')).toBeInTheDocument();
  });
});
