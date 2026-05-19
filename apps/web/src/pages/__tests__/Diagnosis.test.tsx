import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Diagnosis from '@/pages/modules/Diagnosis';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: { id: 1 }, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
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
    // Go to step 2
    fireEvent.click(screen.getByTestId('diagnosis-next'));
    const checkboxLabel = screen.getByTestId('diagnosis-checkbox-已确定赛道方向');
    // Select — should have bg-primary/10
    fireEvent.click(checkboxLabel);
    expect(checkboxLabel.className).toContain('bg-primary/10');
    // Deselect — bg-primary/10 removed
    fireEvent.click(checkboxLabel);
    expect(checkboxLabel.className).not.toContain('bg-primary/10');
  });

  it('Step 8 报告显示: 7 维度评分 + 导出 PDF button', () => {
    renderDiagnosis();
    // Navigate through all 8 steps
    for (let i = 0; i < 8; i++) {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    }
    expect(screen.getByTestId('diagnosis-report')).toBeInTheDocument();
    expect(screen.getByText('7 维度 IP 健康度报告')).toBeInTheDocument();
    expect(screen.getByTestId('export-pdf-button')).toBeInTheDocument();
    // 7 dimension cards
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
    for (let i = 0; i < 8; i++) {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    }
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
    // Navigate to step 8
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    }
    expect(screen.getByTestId('diagnosis-next')).toHaveTextContent('生成诊断报告');
  });
});
