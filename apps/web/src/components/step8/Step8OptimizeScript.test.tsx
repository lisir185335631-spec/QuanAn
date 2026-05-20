/**
 * PRD-25 US-007 AC-9 · Step8OptimizeScript unit tests
 * ≥ 5 tests · mock trpc.stepData.save
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Step8OptimizeScript } from './Step8OptimizeScript';

// ── Mock control ──────────────────────────────────────────────────────────────

const mockCtrl = vi.hoisted(() => ({
  onSuccess: undefined as ((data: unknown) => void) | undefined,
  onError: undefined as (() => void) | undefined,
  isPending: false,
}));

const MOCK_OPTIMIZE_RESULT = vi.hoisted(() => ({
  ok: true,
  data: {
    stepKey: 'step8',
    inputs: { sub_function: 'optimize_script' },
    result: {
      optimized_text: '【高转化优化版】欢迎来到直播间！今天这款产品我个人试用了三个月，效果远超预期。今天直播间专属价，历史最低，限量50份，手慢则无！',
      optimization_notes: '主要优化了：(1)增加个人背书降低信任门槛；(2)用"历史最低"强化稀缺感；(3)结尾行动引导从模糊改为命令式"手慢则无"',
    },
    isFallback: false,
    version: 1,
    updatedAt: new Date().toISOString(),
  },
}));

const MOCK_FALLBACK_RESULT = vi.hoisted(() => ({
  ok: true,
  data: {
    stepKey: 'step8',
    inputs: { sub_function: 'optimize_script' },
    result: {
      optimized_text: '备用优化文案，系统繁忙请稍后重试',
      optimization_notes: '备用优化说明',
    },
    isFallback: true,
    version: 1,
    updatedAt: new Date().toISOString(),
  },
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    stepData: {
      save: {
        useMutation: (opts?: { onSuccess?: (data: unknown) => void; onError?: () => void }) => {
          mockCtrl.onSuccess = opts?.onSuccess;
          mockCtrl.onError = opts?.onError;
          return {
            mutate: vi.fn(),
            isPending: mockCtrl.isPending,
          };
        },
      },
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function renderComponent(accountId: number | null = 1) {
  return render(
    <MemoryRouter>
      <Step8OptimizeScript accountId={accountId} />
    </MemoryRouter>,
  );
}

describe('Step8OptimizeScript', () => {
  beforeEach(() => {
    mockCtrl.onSuccess = undefined;
    mockCtrl.onError = undefined;
    mockCtrl.isPending = false;
  });

  it('AC-3: 表单渲染 — textarea + 优化目标 input + submit button', () => {
    renderComponent();
    expect(screen.getByText('直播话术脚本')).toBeInTheDocument();
    expect(screen.getByText('优化目标')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI 优化话术/ })).toBeInTheDocument();
  });

  it('AC-3: submit disabled when textarea < 10 chars', () => {
    renderComponent();
    const submitBtn = screen.getByRole('button', { name: /AI 优化话术/ });
    expect(submitBtn).toBeDisabled();

    // Type less than 10 chars
    const textarea = screen.getByPlaceholderText(/粘贴你的直播话术脚本/);
    fireEvent.change(textarea, { target: { value: '短内容' } });
    expect(submitBtn).toBeDisabled();
  });

  it('AC-3: submit enabled when textarea ≥ 10 chars', () => {
    renderComponent();
    const submitBtn = screen.getByRole('button', { name: /AI 优化话术/ });
    const textarea = screen.getByPlaceholderText(/粘贴你的直播话术脚本/);
    fireEvent.change(textarea, { target: { value: '这是超过10个字符的直播话术内容用于测试' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('AC-3: onSuccess 后渲染 2 InfoCard (优化后文案 + 优化说明)', () => {
    renderComponent();
    act(() => {
      mockCtrl.onSuccess?.(MOCK_OPTIMIZE_RESULT);
    });
    expect(screen.getByText('优化后文案')).toBeInTheDocument();
    expect(screen.getByText('优化说明')).toBeInTheDocument();
    expect(screen.getByText(/高转化优化版/)).toBeInTheDocument();
    expect(screen.getByText(/个人背书/)).toBeInTheDocument();
  });

  it('AC-4: isFallback=true 时显示 fallback banner', () => {
    renderComponent();
    act(() => {
      mockCtrl.onSuccess?.(MOCK_FALLBACK_RESULT);
    });
    expect(screen.getByTestId('step8-optimize-fallback-banner')).toBeInTheDocument();
  });

  it('AC-4: onError 时不渲染 output 区域', () => {
    renderComponent();
    act(() => {
      mockCtrl.onError?.();
    });
    expect(screen.queryByTestId('step8-optimize-output')).not.toBeInTheDocument();
  });
});
