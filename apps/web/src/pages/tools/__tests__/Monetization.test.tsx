/**
 * PRD-27 US-001 · Monetization unit tests (AC-6)
 * AC-6: ≥ 3 tests · mock monetizationAgent.execute → success/fallback/error 3 场景
 * vi.hoisted 模式 + MemoryRouter wrap
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import Monetization from '@/pages/tools/Monetization';

// ── Mock control (vi.hoisted runs before vi.mock) ─────────────────────────────

const mockCtrl = vi.hoisted(() => ({
  onSuccess: undefined as ((data: unknown) => void) | undefined,
  onError: undefined as ((error: unknown) => void) | undefined,
  isPending: false,
}));

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_SUCCESS_ROW = vi.hoisted(() => ({
  id: 1,
  content: JSON.stringify({
    productMatrix: [
      '知识付费课程（系统化体系课 · 199-599 元）',
      '私域社群会员（高价值社区 · 999-2999 元/年）',
      '1 对 1 咨询服务（高客单价 · 3000-9800 元/次）',
    ],
    pricingStrategy: '采用价格锚点策略：入门课 99 元引流 → 进阶课 599 元主销 → VIP 社群 2999 元/年高客单',
    conversionFunnel: [
      '免费内容 · 公域引流建立认知',
      '低价产品 · 筛选意向用户进私域',
      '高价产品 · 服务精准付费客户',
    ],
  }),
  agentId: 'MonetizationAgent',
  agentMode: 'monetization-tool',
  traceId: null,
  isFallback: false,
  tokensUsed: 500,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 5000,
  createdAt: new Date(),
}));

const MOCK_FALLBACK_ROW = vi.hoisted(() => ({
  id: 2,
  content: JSON.stringify({
    productMatrix: ['知识付费课程（系统化体系课 · 199-599 元）'],
    pricingStrategy: '采用价格锚点策略。系统暂时繁忙，以上为通用备用方案。',
    conversionFunnel: ['免费内容 · 公域引流建立认知'],
  }),
  agentId: 'MonetizationAgent',
  agentMode: 'monetization-tool',
  traceId: null,
  isFallback: true,
  tokensUsed: 0,
  modelUsed: 'fallback',
  durationMs: 0,
  createdAt: new Date(),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/trpc', () => ({
  trpc: {
    monetization: {
      generate: {
        useMutation: (opts?: {
          onSuccess?: (data: unknown) => void;
          onError?: (error: unknown) => void;
        }) => {
          mockCtrl.onSuccess = opts?.onSuccess;
          mockCtrl.onError = opts?.onError;
          return {
            mutate: vi.fn(),
            isPending: mockCtrl.isPending,
            isError: false,
          };
        },
      },
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderMonetization() {
  return render(
    <MemoryRouter>
      <Monetization />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Monetization', () => {
  beforeEach(() => {
    mockCtrl.isPending = false;
    mockCtrl.onSuccess = undefined;
    mockCtrl.onError = undefined;
  });

  it('AC-3 · H1 字面锁 "IP 变现模型"', () => {
    renderMonetization();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IP 变现模型');
  });

  it('AC-3 · submit button 初始 enabled', () => {
    renderMonetization();
    expect(screen.getByTestId('monetization-submit')).not.toBeDisabled();
  });

  it('AC-3 · onSuccess success → 渲染 productMatrix + pricingStrategy + conversionFunnel', () => {
    renderMonetization();
    fireEvent.click(screen.getByTestId('monetization-submit'));

    act(() => {
      mockCtrl.onSuccess?.(MOCK_SUCCESS_ROW);
    });

    expect(screen.getByTestId('monetization-result')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '产品矩阵' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '定价策略' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '转化路径' })).toBeInTheDocument();
    expect(screen.getByTestId('monetization-pricing')).toHaveTextContent('采用价格锚点策略');
    expect(screen.getByTestId('monetization-product-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('monetization-funnel-item-0')).toBeInTheDocument();
  });

  it('AC-4 · isFallback=true → 显示 fallback banner + retry button', () => {
    renderMonetization();
    fireEvent.click(screen.getByTestId('monetization-submit'));

    act(() => {
      mockCtrl.onSuccess?.(MOCK_FALLBACK_ROW);
    });

    expect(screen.getByTestId('monetization-fallback-banner')).toBeInTheDocument();
    expect(screen.getByText(/AI 暂时繁忙 · 显示备用方案/)).toBeInTheDocument();
    expect(screen.getByTestId('monetization-retry')).toBeInTheDocument();
  });

  it('AC-4 · isFallback=false → 不显示 fallback banner', () => {
    renderMonetization();
    fireEvent.click(screen.getByTestId('monetization-submit'));

    act(() => {
      mockCtrl.onSuccess?.(MOCK_SUCCESS_ROW);
    });

    expect(screen.queryByTestId('monetization-fallback-banner')).not.toBeInTheDocument();
  });

  it('AC-4 · onError → toast.error 生成失败', async () => {
    const { toast } = await import('sonner');
    renderMonetization();
    fireEvent.click(screen.getByTestId('monetization-submit'));

    act(() => {
      mockCtrl.onError?.(new Error('network error'));
    });

    expect(toast.error).toHaveBeenCalledWith('生成失败 · 请重试');
  });
});
