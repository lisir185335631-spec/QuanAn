/**
 * Evolution page · legacy test file (PRD-25 US-004)
 * 阶段2 更新: trpc mock 对齐 · canonical test 在:
 *   apps/web/src/pages/modules/__tests__/Evolution.test.tsx
 *
 * Kept here to avoid orphan; mirrors key checks from canonical test.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Evolution from '@/pages/modules/Evolution';

import type * as ReactRouterDom from 'react-router-dom';

// ── trpc mock (same shape as canonical test) ──────────────────────────────────

const MOCK_PROFILE = {
  id: 1,
  level: 'L1',
  feedbackCountGood: 0,
  feedbackCountBad: 0,
  feedbackCountTotal: 0,
  satisfactionRate: 0,
  currentDirection: '综合',
  autoEvolutionEnabled: true,
  deepLearningCount: 0,
  latestInsight: null,
  lastEvolvedAt: null,
  lastUpgradedAt: null,
  updatedAt: new Date(),
};

const mockRefetch = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    evolution: {
      getProfile: {
        useQuery: () => ({
          data: MOCK_PROFILE,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
        }),
      },
      getInsightHistory: {
        useQuery: () => ({ data: [], isLoading: false, refetch: mockRefetch }),
      },
      recentFeedback: {
        useQuery: () => ({ data: [], isLoading: false }),
      },
      updateConfig: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

const mockNavigate = vi.fn();
let toastInfoSpy: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  mockNavigate.mockClear();
  mockRefetch.mockClear();
  const sonnerMod = await import('sonner');
  toastInfoSpy = vi.mocked(sonnerMod.toast.info);
  toastInfoSpy.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderEvolution() {
  return render(
    <MemoryRouter>
      <Evolution />
    </MemoryRouter>,
  );
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Evolution page · PRD-25 US-004', () => {
  it('H1 · 智能体进化中心', () => {
    renderEvolution();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('智能体进化中心');
  });

  it('breadcrumb EVOLUTION 出现', () => {
    renderEvolution();
    expect(screen.getByText('EVOLUTION')).toBeInTheDocument();
  });

  it('进化等级 L1：初始化 字面', () => {
    renderEvolution();
    expect(screen.getByTestId('level-title')).toHaveTextContent('进化等级 L1：初始化');
  });

  it('4 stat label 全部出现', () => {
    renderEvolution();
    expect(screen.getByTestId('stat-label-good')).toHaveTextContent('好评数');
    expect(screen.getByTestId('stat-label-needsImprove')).toHaveTextContent('待改进');
    expect(screen.getByTestId('stat-label-learning')).toHaveTextContent('学习档案');
    expect(screen.getByTestId('stat-label-satisfaction')).toHaveTextContent('满意率');
  });

  it('触发进化 btn click → toast.info 被调用', async () => {
    renderEvolution();
    await act(async () => {
      fireEvent.click(screen.getByTestId('trigger-evolution-btn'));
    });
    expect(toastInfoSpy).toHaveBeenCalled();
  });

  it('还没有进化洞察 + 还没有反馈记录 empty titles 出现', () => {
    renderEvolution();
    expect(screen.getByTestId('insight-empty-title')).toHaveTextContent('还没有进化洞察');
    expect(screen.getByTestId('feedback-empty-title')).toHaveTextContent('还没有反馈记录');
  });

  it('deepLearningCount=0 显示 archive-empty', () => {
    renderEvolution();
    expect(screen.getByTestId('archive-empty')).toBeInTheDocument();
  });

  it('自动进化 toggle default true + click → toast 自动进化已关闭', async () => {
    renderEvolution();
    const toggle = screen.getByTestId('auto-toggle');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toastInfoSpy).toHaveBeenCalledWith('自动进化已关闭');
  });

  it('新增学习 click → navigate /deep-learning', async () => {
    renderEvolution();
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-learning-link'));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/deep-learning');
  });
});
