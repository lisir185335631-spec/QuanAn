/**
 * PRD-25 US-004 AC-10 · Evolution unit tests
 * ≥ 8 tests: level badge / 4 指标真数据 / evolve mutation / disabled 条件 /
 *            latestInsight 显示 / direction server-source-of-truth / EmptyState / H1
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Evolution from '@/pages/modules/Evolution';

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as object), useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: vi.fn(),
}));

// ── trpc mock factories ───────────────────────────────────────────────────────

const mockEvolveMutate = vi.fn();
const mockInsightMutate = vi.fn();
const mockUpdateConfigMutate = vi.fn();
const mockGetProfileInvalidate = vi.fn().mockResolvedValue(undefined);

const mockGetProfileUseQuery = vi.fn();
const mockEvolveUseMutation = vi.fn();
const mockUpdateConfigUseMutation = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    useUtils: () => ({
      evolution: {
        getProfile: {
          invalidate: mockGetProfileInvalidate,
        },
      },
    }),
    evolution: {
      getProfile: {
        useQuery: (...args: unknown[]) => mockGetProfileUseQuery(...args) as unknown,
      },
      evolve: {
        useMutation: (...args: unknown[]) => mockEvolveUseMutation(...args) as unknown,
      },
      updateConfig: {
        useMutation: (...args: unknown[]) => mockUpdateConfigUseMutation(...args) as unknown,
      },
    },
  },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const { useActiveAccount } = await import('@/hooks/useActiveAccount');
const { toast } = await import('sonner');

const mockAccount = {
  id: 42,
  name: 'Test',
  platform: 'douyin' as const,
  stage: 'starter' as const,
  industry: '科技',
  followersRange: '0-1000' as const,
};

const mockProfile = {
  id: 1,
  level: 'L2',
  feedbackCountGood: 6,
  feedbackCountBad: 2,
  feedbackCountTotal: 8,
  satisfactionRate: 0.75,
  currentDirection: '创意性优先',
  autoEvolutionEnabled: true,
  deepLearningCount: 3,
  latestInsight: { insights: { summary: '用户偏爱轻松幽默风格' } },
  lastEvolvedAt: null,
  lastUpgradedAt: null,
  updatedAt: new Date().toISOString(),
};

function makeEvolveUseMutation(overrides?: Record<string, unknown>) {
  return ({
    onSuccess,
  }: {
    onSuccess?: (data: unknown) => void;
    onError?: (err: { message: string }) => void;
  } = {}) => ({
    mutate: (input: unknown, opts?: { onError?: () => void }) => {
      mockEvolveMutate(input);
      onSuccess?.({ ok: true, feedbackId: 1 });
      void opts;
    },
    isPending: false,
    ...overrides,
  });
}

function renderEvolution() {
  return render(
    <MemoryRouter>
      <Evolution />
    </MemoryRouter>,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Evolution page · PRD-25 US-004', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    mockEvolveMutate.mockClear();
    mockInsightMutate.mockClear();
    mockUpdateConfigMutate.mockClear();
    vi.mocked(useActiveAccount).mockReturnValue({
      account: mockAccount,
      isLoading: false,
      isSwitching: false,
      switchTo: vi.fn(),
    });

    // Default: successful profile load
    mockGetProfileUseQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
    });
    mockEvolveUseMutation.mockImplementation(makeEvolveUseMutation());
    mockUpdateConfigUseMutation.mockReturnValue({
      mutate: mockUpdateConfigMutate,
      isPending: false,
    });
  });

  // AC-10(a): level badge correct
  it('AC-10(a) · LevelBadgeRow · profile.level=L2 active 高亮(D-237)', () => {
    renderEvolution();
    const l2badge = screen.getByTestId('badge-L2');
    expect(l2badge).toBeInTheDocument();
    expect(l2badge.className).toContain('bg-primary');
    // other badges not active
    const l1badge = screen.getByTestId('badge-L1');
    expect(l1badge.className).toContain('opacity-50');
  });

  // AC-10(b): 4 指标真数据
  it('AC-10(b) · 4 指标真数据 · feedbackCountGood=6 / needsImprovement=2 / deepLearning=3 / satisfactionRate=0.75', () => {
    renderEvolution();
    expect(screen.getByTestId('metric-好评数')).toHaveTextContent('6');
    expect(screen.getByTestId('metric-待改进')).toHaveTextContent('2');
    expect(screen.getByTestId('metric-学习档案')).toHaveTextContent('3');
    expect(screen.getByTestId('metric-满意率')).toHaveTextContent('0.75');
  });

  // AC-10(c): evolve mutation called on 触发进化
  it('AC-10(c) · 触发进化 button → evolve.mutate(rateableType=manual_trigger)', async () => {
    renderEvolution();
    const btn = screen.getByRole('button', { name: /触发进化/ });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(mockEvolveMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 'good',
          agentId: 'EvolutionAgent',
          rateableType: 'manual_trigger',
          rateableId: 0,
        }),
      );
    });
  });

  // AC-10(d): disabled when feedbackCountTotal < 5
  it('AC-10(d) · 生成洞察 button · feedbackCountTotal<5 → disabled + title=需 ≥ 5 反馈', () => {
    mockGetProfileUseQuery.mockReturnValue({
      data: { ...mockProfile, feedbackCountTotal: 3, feedbackCountGood: 3 },
      isLoading: false,
      isError: false,
    });
    renderEvolution();
    const insightBtn = screen.getByTestId('insight-trigger-button');
    expect(insightBtn).toBeDisabled();
    expect(insightBtn).toHaveAttribute('title', '需 ≥ 5 反馈');
  });

  // AC-10(d2): enabled when feedbackCountTotal >= 5
  it('AC-10(d2) · 生成洞察 button · feedbackCountTotal>=5 → enabled', () => {
    renderEvolution();
    const insightBtn = screen.getByTestId('insight-trigger-button');
    expect(insightBtn).not.toBeDisabled();
  });

  // AC-10(e): latestInsight 显示
  it('AC-10(e) · 进化洞察模块 · latestInsight summary 渲染', () => {
    renderEvolution();
    expect(screen.getByTestId('insight-text')).toHaveTextContent('用户偏爱轻松幽默风格');
  });

  // AC-10(e2): null latestInsight → 暂无洞察字面锁
  it('AC-10(e2) · 进化洞察模块 · null latestInsight → 暂无洞察 D-237 字面锁', () => {
    mockGetProfileUseQuery.mockReturnValue({
      data: { ...mockProfile, latestInsight: null },
      isLoading: false,
      isError: false,
    });
    renderEvolution();
    expect(screen.getByTestId('insight-text')).toHaveTextContent(
      '暂无洞察 · 累计 5+ 反馈后自动生成偏好画像洞察',
    );
  });

  // AC-10(f): direction server-source-of-truth
  it('AC-10(f) · 进化方向 · profile.currentDirection=创意性优先 → 初始 selected', () => {
    renderEvolution();
    // profile.currentDirection = '创意性优先' — should be pressed
    const btn = screen.getByTestId('direction-创意性优先');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  // AC-10(f2): direction change → updateConfig called
  it('AC-10(f2) · 进化方向 change → updateConfig.mutate({currentDirection})', () => {
    renderEvolution();
    const btn = screen.getByTestId('direction-转化率优先');
    fireEvent.click(btn);
    expect(mockUpdateConfigMutate).toHaveBeenCalledWith(
      { currentDirection: '转化率优先' },
      expect.any(Object),
    );
  });

  // AC-1: null profile → EmptyState
  it('AC-1 · null profile → EmptyState 新用户 · 暂无进化数据', () => {
    mockGetProfileUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });
    renderEvolution();
    expect(screen.getByText('新用户 · 暂无进化数据')).toBeInTheDocument();
    expect(screen.getByText('跑任意 specialist 后生成')).toBeInTheDocument();
  });

  // AC-1: loading spinner
  it('AC-1 · isLoading → Loader2 spinner visible', () => {
    mockGetProfileUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    renderEvolution();
    expect(screen.getByTestId('evolution-loading')).toBeInTheDocument();
  });

  // H1 字面锁
  it('H1 · 智能体进化中心', () => {
    renderEvolution();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('智能体进化中心');
  });

  // AC-7: 新增学习 button → toast.info
  it('AC-7 · 新增学习 button → toast.info 正确文案', () => {
    renderEvolution();
    const btn = screen.getByRole('button', { name: /新增学习/ });
    fireEvent.click(btn);
    expect(vi.mocked(toast.info)).toHaveBeenCalledWith('新增学习功能 · 跑任意 specialist 后自动加入档案');
  });
});
