/**
 * pages/__tests__/Diagnosis.test.tsx · 字面对齐 Sally 1:1 版
 * 注: 完整测试在 pages/modules/__tests__/Diagnosis.test.tsx
 * 本文件保留 基础冒烟测试(字面对齐)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Diagnosis from '@/pages/modules/Diagnosis';

const mockReset = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: { id: 1 }, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    diagnosis: {
      generate: {
        useMutation: vi.fn().mockImplementation(() => ({
          mutate: vi.fn(),
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

describe('Diagnosis · pages 冒烟', () => {
  beforeEach(() => {
    localStorage.clear();
    mockReset.mockClear();
  });

  it('H1 字面锁(无空格) "7维度IP诊断报告"', () => {
    renderDiagnosis();
    expect(screen.getByText('7维度IP诊断报告')).toBeInTheDocument();
  });

  it('副标题字面锁(无空格)', () => {
    renderDiagnosis();
    expect(
      screen.getByText('像老师一样诊断你的IP，找出问题，给出具体可执行的改进方案'),
    ).toBeInTheDocument();
  });

  it('chip "IP健康度诊断" 渲染', () => {
    renderDiagnosis();
    expect(screen.getByTestId('diagnosis-chip')).toHaveTextContent('IP健康度诊断');
  });

  it('Step 1: label "你的行业" / "你的产品/服务"', () => {
    renderDiagnosis();
    expect(screen.getByText('你的行业')).toBeInTheDocument();
    expect(screen.getByText('你的产品/服务')).toBeInTheDocument();
  });

  it('Step 1: 4 stage cards · 渲染起步期 desc', () => {
    renderDiagnosis();
    expect(screen.getByText('刚开始做IP，还在摸索中')).toBeInTheDocument();
  });

  it('Step 2: DimensionIconBlock 渲染 positioning', () => {
    renderDiagnosis();
    fireEvent.click(screen.getByTestId('diagnosis-next'));
    expect(screen.getByTestId('dimension-icon-block-positioning')).toBeInTheDocument();
  });

  it('上一步 disabled on Step 1', () => {
    renderDiagnosis();
    expect(screen.getByTestId('diagnosis-prev')).toBeDisabled();
  });

  it('最后一步 CTA "生成诊断报告"', () => {
    renderDiagnosis();
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByTestId('diagnosis-next'));
    }
    expect(screen.getByTestId('diagnosis-next')).toHaveTextContent('生成诊断报告');
  });
});
