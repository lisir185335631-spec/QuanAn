/**
 * Evolution module unit tests · 阶段2 真后端 mock
 * trpc.evolution.* useQuery 真实形状 mock
 * 断言: 真数据渲染 + 空态 + 交互
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Evolution from '@/pages/modules/Evolution';

import type * as ReactRouterDom from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────
// Shared mock shapes (mirrors backend return types exactly)
// ─────────────────────────────────────────────────────────────────

const MOCK_PROFILE = {
  id: 1,
  level: 'L2',
  feedbackCountGood: 12,
  feedbackCountBad: 3,
  feedbackCountTotal: 15,
  satisfactionRate: 0.8,
  currentDirection: '综合',
  autoEvolutionEnabled: true,
  deepLearningCount: 2,
  latestInsight: null,
  lastEvolvedAt: new Date('2026-05-01'),
  lastUpgradedAt: null,
  updatedAt: new Date('2026-05-25'),
};

const MOCK_INSIGHTS = [
  {
    id: 101,
    triggerType: 'threshold:5',
    direction: '综合',
    content: { summary: '用户偏爱轻松风格' },
    levelBefore: 'L1',
    levelAfter: 'L2',
    createdAt: new Date('2026-05-20'),
  },
];

const MOCK_FEEDBACK = [
  {
    id: 201,
    rating: 'good' as const,
    agentId: 'ContentAgent',
    comment: '内容很有用',
    traceId: 'trace-001',
    createdAt: new Date('2026-05-22'),
  },
  {
    id: 202,
    rating: 'bad' as const,
    agentId: 'VideoAgent',
    comment: null,
    traceId: null,
    createdAt: new Date('2026-05-21'),
  },
];

// ─────────────────────────────────────────────────────────────────
// Configurable query state
// ─────────────────────────────────────────────────────────────────

type QueryState = 'loaded' | 'loading' | 'error' | 'null-profile' | 'empty';

let queryState: QueryState = 'loaded';
const mockUpdateConfig = vi.fn();
const mockRefetch      = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    evolution: {
      getProfile: {
        useQuery: vi.fn(() => {
          if (queryState === 'loading')       return { data: undefined, isLoading: true,  isError: false, refetch: mockRefetch };
          if (queryState === 'error')         return { data: undefined, isLoading: false, isError: true,  refetch: mockRefetch };
          if (queryState === 'null-profile')  return { data: null,      isLoading: false, isError: false, refetch: mockRefetch };
          // 'empty' or 'loaded'
          return {
            data: queryState === 'empty' ? { ...MOCK_PROFILE, feedbackCountGood: 0, feedbackCountBad: 0, feedbackCountTotal: 0, deepLearningCount: 0, satisfactionRate: 0, level: 'L1' } : MOCK_PROFILE,
            isLoading: false,
            isError: false,
            refetch: mockRefetch,
          };
        }),
      },
      getInsightHistory: {
        useQuery: vi.fn(() => ({
          data: queryState === 'loaded' ? MOCK_INSIGHTS : [],
          isLoading: false,
          refetch: mockRefetch,
        })),
      },
      recentFeedback: {
        useQuery: vi.fn(() => ({
          data: queryState === 'loaded' ? MOCK_FEEDBACK : [],
          isLoading: false,
        })),
      },
      updateConfig: {
        useMutation: vi.fn((opts?: { onSuccess?: () => void; onError?: () => void }) => ({
          mutate: vi.fn((_input: unknown) => {
            mockUpdateConfig(_input);
            opts?.onSuccess?.();
          }),
          isPending: false,
        })),
      },
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockNavigate = vi.fn();

// ─────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────

let toastInfoSpy: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  queryState = 'loaded';
  mockNavigate.mockClear();
  mockUpdateConfig.mockClear();
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

describe('Evolution page · 阶段2 trpc 真后端', () => {
  // ── §1 Header / static structure ──────────────────────────────

  it('breadcrumb EVOLUTION + h1 智能体进化中心 出现', () => {
    renderEvolution();
    expect(screen.getByText('EVOLUTION')).toBeInTheDocument();
    expect(screen.getAllByText('智能体进化中心').length).toBeGreaterThanOrEqual(2);
  });

  it('subtitle 关键词 反馈学习 / 深度学习 出现', () => {
    renderEvolution();
    expect(screen.getByText('反馈学习')).toBeInTheDocument();
    expect(screen.getByText('深度学习')).toBeInTheDocument();
  });

  // ── §2 LevelCard — 真实 profile 数据 ──────────────────────────

  it('LevelCard 渲染 profile.level=L2 + feedbackCountTotal=15', () => {
    renderEvolution();
    expect(screen.getByTestId('level-title')).toHaveTextContent('进化等级 L2：学习中');
    expect(screen.getByTestId('level-info')).toHaveTextContent('已收集 15 条反馈 · 2 个深度学习档案');
  });

  it('level-next 距离下一等级还需 5 条反馈 (20-15=5)', () => {
    renderEvolution();
    expect(screen.getByTestId('level-next')).toHaveTextContent('距离下一等级还需 5 条反馈');
  });

  it('L2 icon active · L1 inactive', () => {
    renderEvolution();
    // L2 active: data-state=active
    const l2 = screen.getByTestId('level-icon-L2');
    expect(l2).toHaveAttribute('data-state', 'active');
    // L1 inactive: data-state=inactive
    const l1 = screen.getByTestId('level-icon-L1');
    expect(l1).toHaveAttribute('data-state', 'inactive');
  });

  // ── §3 StatCards — 真实数据 ────────────────────────────────────

  it('4 stat labels 全部出现', () => {
    renderEvolution();
    expect(screen.getByTestId('stat-label-good')).toHaveTextContent('好评数');
    expect(screen.getByTestId('stat-label-needsImprove')).toHaveTextContent('待改进');
    expect(screen.getByTestId('stat-label-learning')).toHaveTextContent('学习档案');
    expect(screen.getByTestId('stat-label-satisfaction')).toHaveTextContent('满意率');
  });

  it('good=12 / bad=3 值正确渲染', () => {
    renderEvolution();
    const goodCard = screen.getByTestId('stat-card-good');
    expect(goodCard).toHaveTextContent('12');
    const badCard = screen.getByTestId('stat-card-needsImprove');
    expect(badCard).toHaveTextContent('3');
  });

  it('satisfactionRate=0.8 → stat-card-satisfaction 显示 80 (×100 转换)', () => {
    renderEvolution();
    const satCard = screen.getByTestId('stat-card-satisfaction');
    expect(satCard).toHaveTextContent('80');
  });

  // ── §5a InsightCard — 真实洞察数据 ────────────────────────────

  it('有洞察时 insight-card 渲染 insight-item-101', () => {
    renderEvolution();
    expect(screen.getByTestId('insight-card')).toBeInTheDocument();
    expect(screen.getByTestId('insight-item-101')).toBeInTheDocument();
  });

  it('洞察项目展示方向 + 等级升降', () => {
    renderEvolution();
    const item = screen.getByTestId('insight-item-101');
    expect(item).toHaveTextContent('综合');
    expect(item).toHaveTextContent('L2');
  });

  // ── §5b FeedbackCard — 真实反馈数据 ───────────────────────────

  it('有反馈时 feedback-card 渲染 feedback-item-201 + feedback-item-202', () => {
    renderEvolution();
    expect(screen.getByTestId('feedback-card')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-item-201')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-item-202')).toBeInTheDocument();
  });

  it('feedback-item-201 包含 👍 + ContentAgent', () => {
    renderEvolution();
    const item = screen.getByTestId('feedback-item-201');
    expect(item).toHaveTextContent('👍');
    expect(item).toHaveTextContent('ContentAgent');
    expect(item).toHaveTextContent('内容很有用');
  });

  // ── §5 空态 ────────────────────────────────────────────────────

  it('空态: insight empty card + feedback empty card', () => {
    queryState = 'empty';
    renderEvolution();
    expect(screen.getByTestId('empty-insight-card')).toBeInTheDocument();
    expect(screen.getByTestId('insight-empty-title')).toHaveTextContent('还没有进化洞察');
    expect(screen.getByTestId('empty-feedback-card')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-empty-title')).toHaveTextContent('还没有反馈记录');
  });

  // ── §6 深度学习档案 ────────────────────────────────────────────

  it('deepLearningCount>0 显示 archive-count-card + archive-chip', () => {
    renderEvolution();
    expect(screen.getByTestId('archive-count-card')).toBeInTheDocument();
    expect(screen.getByTestId('archive-chip-archive-1')).toHaveTextContent('已学习');
  });

  it('deepLearningCount=0 显示 archive-empty', () => {
    queryState = 'empty';
    renderEvolution();
    expect(screen.getByTestId('archive-empty')).toBeInTheDocument();
  });

  it('新增学习 link click → navigate /deep-learning', async () => {
    renderEvolution();
    const link = screen.getByTestId('add-learning-link');
    await act(async () => { fireEvent.click(link); });
    expect(mockNavigate).toHaveBeenCalledWith('/deep-learning');
  });

  // ── §7 进化设置 ────────────────────────────────────────────────

  it('auto-toggle 初始 aria-pressed=true (from config.autoEvolutionEnabled=true)', () => {
    renderEvolution();
    const toggle = screen.getByTestId('auto-toggle');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('auto-toggle click → updateConfig.mutate + toast 自动进化已关闭', async () => {
    renderEvolution();
    const toggle = screen.getByTestId('auto-toggle');
    await act(async () => { fireEvent.click(toggle); });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ autoEvolutionEnabled: false });
    expect(toastInfoSpy).toHaveBeenCalledWith('自动进化已关闭');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('进化方向 currentDirection 显示 综合', () => {
    renderEvolution();
    expect(screen.getByTestId('setting-row-direction')).toHaveTextContent('综合');
  });

  // ── 整页三态 ───────────────────────────────────────────────────

  it('loading 态: evolution-loading 占位', () => {
    queryState = 'loading';
    renderEvolution();
    expect(screen.getByTestId('evolution-loading')).toBeInTheDocument();
  });

  it('error 态: evolution-error + 重试按钮', () => {
    queryState = 'error';
    renderEvolution();
    expect(screen.getByTestId('evolution-error')).toBeInTheDocument();
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('null profile 态: evolution-empty + 暂无进化档案', () => {
    queryState = 'null-profile';
    renderEvolution();
    expect(screen.getByTestId('evolution-empty')).toBeInTheDocument();
    expect(screen.getByTestId('evolution-empty-title')).toHaveTextContent('暂无进化档案');
  });

  // ── 触发进化按钮 ───────────────────────────────────────────────

  it('触发进化 btn click (有 profile) → toast 并 refetch', async () => {
    renderEvolution();
    const btn = screen.getByTestId('trigger-evolution-btn');
    await act(async () => { fireEvent.click(btn); });
    expect(toastInfoSpy).toHaveBeenCalled();
    expect(mockRefetch).toHaveBeenCalled();
  });
});
