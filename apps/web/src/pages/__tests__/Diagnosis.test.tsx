import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Diagnosis from '@/pages/modules/Diagnosis';

const mockMutate = vi.fn();
const mockReset = vi.fn();

const MOCK_REPORT = {
  id: 1,
  answers: [],
  dimensions: {
    positioning: { score: 7, issues: ['定位不够清晰'], suggestions: ['明确赛道方向'] },
    branding:    { score: 6, issues: ['头像不专业'], suggestions: ['换真人照片'] },
    traffic:     { score: 5, issues: ['缺乏流量内容'], suggestions: ['增加猎奇选题'] },
    value:       { score: 8, issues: [], suggestions: ['继续输出干货'] },
    case:        { score: 4, issues: ['案例不足'], suggestions: ['整理成功案例'] },
    persona:     { score: 6, issues: ['人设不鲜明'], suggestions: ['分享从业故事'] },
    authentic:   { score: 7, issues: [], suggestions: ['保持真实表达'] },
  },
  overallScore: 61,
  inferredStage: 'starter',
  topPriority: '完善账号定位',
  recommendedSteps: ['完善账号定位', '优化账号包装', '增加流量内容'],
  agentId: 'DiagnosisAgent',
  traceId: null,
  isFallback: false,
  modelUsed: 'claude-sonnet-4-6',
  tokensUsed: 1234,
  durationMs: 5000,
  createdAt: new Date().toISOString(),
};

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: { id: 1 }, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    diagnosis: {
      generate: {
        useMutation: vi.fn().mockImplementation((opts: { onSuccess?: (d: typeof MOCK_REPORT) => void } = {}) => ({
          mutate: vi.fn((_input: unknown) => {
            opts.onSuccess?.(MOCK_REPORT);
          }),
          mutateAsync: vi.fn().mockResolvedValue(MOCK_REPORT),
          isPending: false,
          isError: false,
          reset: mockReset,
        })),
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

describe('Diagnosis', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMutate.mockClear();
    mockReset.mockClear();
  });

  it('AC-1 · H1 字面锁 "7 维度 IP 诊断报告"', () => {
    renderDiagnosis();
    expect(screen.getAllByRole('heading', { level: 1 })[0]).toHaveTextContent('7 维度 IP 诊断报告');
  });

  it('AC-1 · 副标题字面锁', () => {
    renderDiagnosis();
    expect(
      screen.getByText('像老师一样诊断你的 IP，找出问题，给出具体可执行的改进方案'),
    ).toBeInTheDocument();
  });

  it('Step 1 渲染: "步骤 1 / 8 · 基本信息" + 行业/产品 input', () => {
    renderDiagnosis();
    expect(screen.getByText('步骤 1 / 8 · 基本信息')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-industry')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-product')).toBeInTheDocument();
  });

  it('8 step 切换: 点下一步进入 Step 2', () => {
    renderDiagnosis();
    fireEvent.click(screen.getByTestId('diagnosis-next'));
    expect(screen.getByText('步骤 2 / 8 · 定位清晰度')).toBeInTheDocument();
  });

  it('checkbox 多选 toggle: 选中后再次点击取消', () => {
    renderDiagnosis();
    fireEvent.click(screen.getByTestId('diagnosis-next'));
    const checkboxLabel = screen.getByTestId('diagnosis-checkbox-已确定赛道方向');
    fireEvent.click(checkboxLabel);
    expect(checkboxLabel.className).toContain('bg-primary/10');
    fireEvent.click(checkboxLabel);
    expect(checkboxLabel.className).not.toContain('bg-primary/10');
  });

  it('Step 8 报告显示: 7 维度评分 + 导出 PDF button', () => {
    renderDiagnosis();
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    }
    // Step 8 click triggers mutation → onSuccess called synchronously → report shown
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    expect(screen.getByTestId('diagnosis-report')).toBeInTheDocument();
    expect(screen.getByText('7 维度 IP 健康度报告')).toBeInTheDocument();
    expect(screen.getByTestId('export-pdf-button')).toBeInTheDocument();
    expect(screen.getByTestId('report-dimension-positioning')).toBeInTheDocument();
    expect(screen.getByTestId('report-dimension-authentic')).toBeInTheDocument();
  });

  it('AC-7 · localStorage save: 进入 step 2 后 LS 有记录', () => {
    renderDiagnosis();
    fireEvent.click(screen.getByTestId('diagnosis-next'));
    const keys = Object.keys(localStorage);
    const diagKey = keys.find((k) => k.includes('diagnosis_progress'));
    expect(diagKey).toBeTruthy();
  });

  it('导出 PDF button 点击: toast.info 调用', async () => {
    const { toast } = await import('sonner');
    renderDiagnosis();
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    }
    act(() => {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    });
    fireEvent.click(screen.getByTestId('export-pdf-button'));
    expect(toast.info).toHaveBeenCalledWith('导出功能 PRD-25+');
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

  it('最后一步 CTA 文字改 "生成诊断报告"', () => {
    renderDiagnosis();
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    }
    expect(screen.getByTestId('diagnosis-next')).toHaveTextContent('生成诊断报告');
  });
});
