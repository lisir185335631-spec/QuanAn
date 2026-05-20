/**
 * PRD-25 US-007 AC-9 · Step8GeneratePlan unit tests
 * ≥ 5 tests · mock trpc.stepData.save
 */
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Step8GeneratePlan } from './Step8GeneratePlan';

// ── Mock control (vi.hoisted runs before vi.mock) ─────────────────────────────

const mockCtrl = vi.hoisted(() => ({
  onSuccess: undefined as ((data: unknown) => void) | undefined,
  onError: undefined as (() => void) | undefined,
  isPending: false,
}));

const MOCK_GENERATE_PLAN_RESULT = vi.hoisted(() => ({
  ok: true,
  data: {
    stepKey: 'step8',
    inputs: { sub_function: 'generate_plan' },
    result: {
      opening: '欢迎来到直播间，我是你们的主播！今天带来超值好物，先扣1让我知道你来了',
      warmup: '来个小互动，评论区告诉我你来自哪个城市？',
      product: '今天主推产品：特性是高品质，优势是性价比超高，利益是省钱实用，案例：已有5000位用户好评',
      conversion: '直播间专属价，限时优惠，只有今天！手速快的朋友赶紧下单！',
      faq: '发货时间3天内，7天无理由退换，全国包邮，有问题扣在评论区',
      closing: '感谢大家今天陪伴！记得关注主页，下次直播同一时间见！',
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
    inputs: { sub_function: 'generate_plan' },
    result: {
      opening: '备用开场',
      warmup: '备用暖场',
      product: '备用产品',
      conversion: '备用转化',
      faq: '备用FAQ',
      closing: '备用收尾',
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
      <Step8GeneratePlan accountId={accountId} />
    </MemoryRouter>,
  );
}

describe('Step8GeneratePlan', () => {
  beforeEach(() => {
    mockCtrl.onSuccess = undefined;
    mockCtrl.onError = undefined;
    mockCtrl.isPending = false;
  });

  it('AC-1: 表单字段渲染 — textarea + audience input + platform radio + experience 3 buttons', () => {
    renderComponent();
    expect(screen.getByText('产品/服务信息')).toBeInTheDocument();
    expect(screen.getByText('目标受众')).toBeInTheDocument();
    expect(screen.getByText('直播平台')).toBeInTheDocument();
    expect(screen.getByText('直播经验')).toBeInTheDocument();
    expect(screen.getByText('新手')).toBeInTheDocument();
    expect(screen.getByText('有经验')).toBeInTheDocument();
    expect(screen.getByText('资深')).toBeInTheDocument();
  });

  it('AC-1: submit 默认 disabled（未填产品信息时）', () => {
    renderComponent();
    const submitBtn = screen.getByRole('button', { name: /生成直播方案/ });
    expect(submitBtn).toBeDisabled();
  });

  it('AC-2: onSuccess 后渲染 6 模块 H3 + 真实内容', () => {
    renderComponent();
    act(() => {
      mockCtrl.onSuccess?.(MOCK_GENERATE_PLAN_RESULT);
    });
    // 6 module labels
    expect(screen.getByText('开场话术')).toBeInTheDocument();
    expect(screen.getByText('暖场互动')).toBeInTheDocument();
    expect(screen.getByText('产品介绍')).toBeInTheDocument();
    expect(screen.getByText('转化促单')).toBeInTheDocument();
    expect(screen.getByText('常见问题')).toBeInTheDocument();
    expect(screen.getByText('收尾')).toBeInTheDocument();
    // actual content
    expect(screen.getByText(/欢迎来到直播间/)).toBeInTheDocument();
    expect(screen.getByText(/来个小互动/)).toBeInTheDocument();
  });

  it('AC-4: isFallback=true 时显示 fallback banner', () => {
    renderComponent();
    act(() => {
      mockCtrl.onSuccess?.(MOCK_FALLBACK_RESULT);
    });
    expect(screen.getByTestId('step8-generate-fallback-banner')).toBeInTheDocument();
    expect(screen.getByText(/AI 服务繁忙/)).toBeInTheDocument();
  });

  it('AC-4: onError 时不渲染 output', () => {
    renderComponent();
    act(() => {
      mockCtrl.onError?.();
    });
    expect(screen.queryByTestId('step8-generate-output')).not.toBeInTheDocument();
  });

  it('AC-2: result null 时不渲染 output 区域', () => {
    renderComponent();
    expect(screen.queryByTestId('step8-generate-output')).not.toBeInTheDocument();
  });
});
