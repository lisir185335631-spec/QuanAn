/**
 * PRD-29.12 · Step8 unit tests (接真后端版)
 * AC-11: ≥ 6 tests · form / experience chip dual-line / disabled 条件 / 真数据渲染 / 三态
 * Step3b 已验证模式: vi.hoisted mutable mock state + hasResult 门控
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Step8, { type Step8LivestreamResult } from '@/pages/step/Step8';

// ── Minimal Step8LivestreamResult fixture (真实后端形状) ──────────────────────
const MOCK_STEP8_RESULT: Step8LivestreamResult = {
  opening: '欢迎来到直播间！我是AI智能体定制专家，今天为大家带来专属方案。评论区扣"1"让我看到你！',
  warmup: '大家好！先互动一下，你目前最大的运营痛点是什么？评论区打出来，我们一起聊！',
  product: '今天重点介绍我们的定制智能体服务。特性：根据您的业务场景量身定制。优势：相比同类产品，我们的智能体能自动处理80%的重复性工作。利益：每月节省人力成本，提升运营效率。证明：已有30+客户实现降本增效。',
  conversion: '今天直播间专属优惠！前3名下单享9折，还送价值2980元的AI诊断报告。数量有限，点击小黄车立即抢购！',
  faq: '常见问题：Q发货时间？A定制周期7-14天。Q支持退款吗？A不满意提供免费优化直到满意。Q新手能用吗？A完全可以，提供全程培训。',
  closing: '感谢大家今天的陪伴！AI智能体是未来趋势，错过今天可能要等很久。关注我，下周继续分享更多干货！',
};

// ── vi.hoisted mutable mock state (Step3b pattern) ────────────────────────────
const mockState = vi.hoisted(() => ({
  saveMutation: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null as { message: string } | null,
    data: undefined as unknown,
  },
  getQuery: {
    data: null as unknown,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  },
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      get: { useQuery: () => mockState.getQuery },
      save: { useMutation: () => mockState.saveMutation },
    },
  },
}));

beforeEach(() => {
  mockState.saveMutation.mutate = vi.fn();
  mockState.saveMutation.isPending = false;
  mockState.saveMutation.isError = false;
  mockState.saveMutation.error = null;
  mockState.saveMutation.data = undefined;

  mockState.getQuery.data = null;
  mockState.getQuery.isLoading = false;
  mockState.getQuery.isError = false;
  mockState.getQuery.error = null;
  mockState.getQuery.refetch = vi.fn();
});

function renderStep8() {
  return render(
    <MemoryRouter>
      <Step8 />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Step8', () => {
  // ── 字面锁 / H1 / 基础结构 ────────────────────────────────────────────────

  it('AC-1 · H1 字面锁 "直播策划"', () => {
    renderStep8();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('直播策划');
  });

  it('AC-1 · STEP_TAG "STEP 08 · 直播策划" 顶部副标签', () => {
    renderStep8();
    expect(
      screen.getByText((content) => content.includes('STEP 08') && content.includes('直播策划')),
    ).toBeInTheDocument();
  });

  it('AC-2 · 生成直播方案 CTA 渲染且可点击', () => {
    renderStep8();
    expect(screen.getByRole('button', { name: /生成直播方案/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /生成直播方案/ })).not.toBeDisabled();
  });

  it('AC-3/4 · 3 经验 chip dual-line: label + subtitle 均渲染', () => {
    renderStep8();
    expect(screen.getByRole('button', { name: /新手/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /有经验/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /资深/ })).toBeInTheDocument();
    expect(screen.getByText(/刚开始做直播/)).toBeInTheDocument();
    expect(screen.getByText(/有一定直播经验/)).toBeInTheDocument();
    expect(screen.getByText(/直播经验丰富/)).toBeInTheDocument();
  });

  it('AC-4 · 选 platform + 选 experience → CTA 仍 enabled', () => {
    renderStep8();
    const douyinBtn = screen.getByRole('button', { name: /抖音/ });
    fireEvent.click(douyinBtn);
    const noviceBtn = screen.getByRole('button', { name: /新手/ });
    fireEvent.click(noviceBtn);
    expect(screen.getByRole('button', { name: /生成直播方案/ })).not.toBeDisabled();
  });

  it('AC-6 · 产品信息 textarea 渲染', () => {
    renderStep8();
    expect(
      screen.getByPlaceholderText(/输入产品定价、服务内容、核心卖点等/),
    ).toBeInTheDocument();
  });

  // ── 真数据渲染 · dbQuery result ───────────────────────────────────────────

  it('renders opening script from dbQuery result (Step8LivestreamResult shape)', () => {
    mockState.getQuery.data = {
      result: MOCK_STEP8_RESULT,
      stepKey: 'step8',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep8();
    expect(screen.getByText(/欢迎来到直播间！我是AI智能体定制专家/)).toBeInTheDocument();
  });

  it('renders product script from dbQuery result', () => {
    mockState.getQuery.data = {
      result: MOCK_STEP8_RESULT,
      stepKey: 'step8',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep8();
    expect(screen.getByText(/今天重点介绍我们的定制智能体服务/)).toBeInTheDocument();
    expect(screen.getByText(/感谢大家今天的陪伴/)).toBeInTheDocument();
  });

  // ── 真数据渲染 · mutation 成功后 session result ────────────────────────────

  it('renders opening script from mutation session result', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_STEP8_RESULT,
        stepKey: 'step8',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep8();
    expect(screen.getByText(/欢迎来到直播间！我是AI智能体定制专家/)).toBeInTheDocument();
    expect(screen.getByText(/今天重点介绍我们的定制智能体服务/)).toBeInTheDocument();
  });

  it('shows step8-generate-output testid when dbQuery has valid result', () => {
    mockState.getQuery.data = {
      result: MOCK_STEP8_RESULT,
      stepKey: 'step8',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep8();
    expect(screen.getByTestId('step8-generate-output')).toBeInTheDocument();
    expect(screen.queryByTestId('step8-empty-state')).not.toBeInTheDocument();
  });

  // ── Loading 态 ─────────────────────────────────────────────────────────────

  it('shows loading banner (step8-loading testid) when mutation isPending', () => {
    mockState.saveMutation.isPending = true;
    renderStep8();
    expect(screen.getByTestId('step8-loading')).toBeInTheDocument();
    expect(screen.getByTestId('step8-loading')).toHaveTextContent('AI 正在生成直播策划方案');
  });

  it('CTA button shows 生成中… when isPending', () => {
    mockState.saveMutation.isPending = true;
    renderStep8();
    expect(screen.getByRole('button', { name: /生成中/ })).toBeInTheDocument();
  });

  // ── Error 态 ───────────────────────────────────────────────────────────────

  it('shows error banner (step8-error testid) when mutation isError', () => {
    mockState.saveMutation.isError = true;
    mockState.saveMutation.error = { message: '生成失败，请重试' };
    renderStep8();
    expect(screen.getByTestId('step8-error')).toBeInTheDocument();
  });

  // ── isFallback 降级提示 ────────────────────────────────────────────────────

  it('shows fallback notice (step8-fallback-notice testid) when isFallback=true', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_STEP8_RESULT,
        stepKey: 'step8',
        inputs: {},
        isFallback: true,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep8();
    expect(screen.getByTestId('step8-fallback-notice')).toBeInTheDocument();
  });

  it('does NOT show fallback notice when isFallback=false', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_STEP8_RESULT,
        stepKey: 'step8',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep8();
    expect(screen.queryByTestId('step8-fallback-notice')).not.toBeInTheDocument();
  });

  // ── 无真数据 → 不显脚本区、显空态 ──────────────────────────────────────────

  it('does NOT render script sections when no real data available', () => {
    renderStep8();
    expect(screen.queryByTestId('step8-generate-output')).not.toBeInTheDocument();
    expect(screen.queryByText(/欢迎来到直播间！我是AI智能体定制专家/)).not.toBeInTheDocument();
  });

  it('shows empty state when no real data and not loading', () => {
    renderStep8();
    expect(screen.getByTestId('step8-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/尚未生成直播策划方案/)).toBeInTheDocument();
  });

  it('does NOT show empty state while mutation is pending', () => {
    mockState.saveMutation.isPending = true;
    renderStep8();
    expect(screen.queryByTestId('step8-empty-state')).not.toBeInTheDocument();
  });

  it('does NOT show empty state while dbQuery is loading', () => {
    mockState.getQuery.isLoading = true;
    renderStep8();
    expect(screen.queryByTestId('step8-empty-state')).not.toBeInTheDocument();
  });

  it('does NOT render script for invalid/malformed result (guard rejected)', () => {
    mockState.getQuery.data = {
      result: { broken: true }, // not a valid Step8LivestreamResult
      stepKey: 'step8',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep8();
    expect(screen.queryByTestId('step8-generate-output')).not.toBeInTheDocument();
    expect(screen.getByTestId('step8-empty-state')).toBeInTheDocument();
  });

  // ── dbQuery isFallback → 降级提示 ────────────────────────────────────────────

  it('shows fallback notice when dbQuery.data.isFallback=true', () => {
    mockState.getQuery.data = {
      result: MOCK_STEP8_RESULT,
      stepKey: 'step8',
      inputs: {},
      isFallback: true,
      version: 1,
      updatedAt: '',
    };
    renderStep8();
    expect(screen.getByTestId('step8-fallback-notice')).toBeInTheDocument();
  });

  // ── dbQuery.isError → DB 加载失败提示 ─────────────────────────────────────

  it('shows db error banner with retry when dbQuery.isError=true and no real data', () => {
    mockState.getQuery.isError = true;
    renderStep8();
    expect(screen.getByTestId('step8-db-error')).toBeInTheDocument();
    expect(screen.getByText(/历史记录加载失败/)).toBeInTheDocument();
  });

  it('does NOT show db error banner when real data already available', () => {
    mockState.getQuery.isError = true;
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_STEP8_RESULT,
        stepKey: 'step8',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep8();
    expect(screen.queryByTestId('step8-db-error')).not.toBeInTheDocument();
  });

  // ── dbQuery.isLoading → 历史记录加载中 ───────────────────────────────────────

  it('shows db loading banner while dbQuery.isLoading=true', () => {
    mockState.getQuery.isLoading = true;
    renderStep8();
    expect(screen.getByTestId('step8-db-loading')).toBeInTheDocument();
    expect(screen.getByText(/正在加载历史记录/)).toBeInTheDocument();
  });

  // ── 提交表单 → mutation.mutate 被调用 ────────────────────────────────────────

  it('clicking 生成直播方案 calls mutation.mutate with step8 key', () => {
    renderStep8();
    fireEvent.click(screen.getByRole('button', { name: /生成直播方案/ }));
    expect(mockState.saveMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ stepKey: 'step8' }),
    );
  });

  it('submitting form passes sub_function:generate_plan to mutation', () => {
    renderStep8();
    fireEvent.click(screen.getByRole('button', { name: /生成直播方案/ }));
    expect(mockState.saveMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        stepKey: 'step8',
        inputs: expect.objectContaining({ sub_function: 'generate_plan' }),
      }),
    );
  });

  it('experience "新手" maps to Chinese "新手" in mutation inputs', () => {
    // Default experience is 'newbie' → maps to '新手'
    renderStep8();
    fireEvent.click(screen.getByRole('button', { name: /生成直播方案/ }));
    expect(mockState.saveMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: expect.objectContaining({ experience: '新手' }),
      }),
    );
  });

  it('experience "有经验" maps to Chinese "有经验" in mutation inputs', () => {
    renderStep8();
    fireEvent.click(screen.getByRole('button', { name: /有经验/ }));
    fireEvent.click(screen.getByRole('button', { name: /生成直播方案/ }));
    expect(mockState.saveMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: expect.objectContaining({ experience: '有经验' }),
      }),
    );
  });

  it('experience "资深" maps to Chinese "资深" in mutation inputs', () => {
    renderStep8();
    fireEvent.click(screen.getByRole('button', { name: /资深/ }));
    fireEvent.click(screen.getByRole('button', { name: /生成直播方案/ }));
    expect(mockState.saveMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: expect.objectContaining({ experience: '资深' }),
      }),
    );
  });

  // ── 底部完成卡 hasResult 门控 ─────────────────────────────────────────────────

  it('does NOT show 直播策划已完成 card when hasResult=false', () => {
    renderStep8();
    expect(screen.queryByText(/直播策划已完成/)).not.toBeInTheDocument();
  });

  it('shows 直播策划已完成 card only when hasResult=true', () => {
    mockState.getQuery.data = {
      result: MOCK_STEP8_RESULT,
      stepKey: 'step8',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep8();
    expect(screen.getByText(/直播策划已完成/)).toBeInTheDocument();
  });
});
