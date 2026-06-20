import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { stepConfig } from '@/lib/stepConfig';
import IpPlan from '@/pages/IpPlan';
import Accounts from '@/pages/modules/Accounts';
import DailyTasks from '@/pages/modules/DailyTasks';
import Diagnosis from '@/pages/modules/Diagnosis';
import Evolution from '@/pages/modules/Evolution';
import History from '@/pages/modules/History';
import MyTopics from '@/pages/modules/MyTopics';
import Step1 from '@/pages/step/Step1';
import Step5 from '@/pages/step/Step5';
import Step8 from '@/pages/step/Step8';
import Generate from '@/pages/tools/Generate';
import Knowledge from '@/pages/tools/Knowledge';
import Trending from '@/pages/tools/Trending';

// Mock tRPC — pages that call useQuery hooks need this to render without a real provider
vi.mock('@/lib/trpc', () => ({
  trpc: {
    costLog: { logFeedback: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
    useUtils: () => ({
      dailyTasks: {
        getToday: {
          getData: vi.fn(() => null),
          setData: vi.fn(),
          cancel: vi.fn().mockResolvedValue(undefined),
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
      },
      evolution: {
        getProfile: {
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
      },
      history: {
        list: {
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
        count: {
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
      },
      trending: {
        listWithFavorites: {
          getData: vi.fn(() => null),
          setData: vi.fn(),
          cancel: vi.fn().mockResolvedValue(undefined),
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
        kpiStats: {
          invalidate: vi.fn().mockResolvedValue(undefined),
        },
      },
    }),
    dailyTasks: {
      getToday: { useQuery: () => ({ data: null, isLoading: false, refetch: vi.fn() }) },
      getHistory: { useQuery: () => ({ data: [], isLoading: false }) },
      markCompleted: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({ ok: true, completedCount: 0, totalCount: 0 }), isPending: false }) },
      regenerateToday: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    diagnosis: {
      latest: { useQuery: () => ({ data: null, isLoading: false }) },
      generate: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
          isError: false,
          reset: vi.fn(),
        }),
      },
    },
    evolution: {
      getProfile: { useQuery: () => ({ data: null, isLoading: false, isError: false, refetch: vi.fn() }) },
      evolve: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateConfig: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getInsightHistory: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
      recentFeedback: { useQuery: () => ({ data: [], isLoading: false }) },
      getFeedbackTrend: { useQuery: () => ({ data: [], isLoading: false }) },
      getModuleRanking: { useQuery: () => ({ data: { ranking: [] }, isLoading: false }) },
      history: { useQuery: () => ({ data: [], isLoading: false }) },
    },
    ipAccounts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      create: { useMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: 1, name: 'test', industry: 'tech', platform: 'douyin', stage: 'starter', isActive: true, followersRange: '0-1000' }), isPending: false }) },
      delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      // US-007 AC-7: smartRecommend mock
      smartRecommend: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({ platform: 'douyin', followersRange: '0-1k', ipPositioning: '测试定位', rationale: '测试推荐理由', isFallback: false }), isPending: false }) },
    },
    knowledge: {
      getRecommendations: { useQuery: () => ({ data: [], isLoading: false }) },
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      search: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getById: { useQuery: () => ({ data: null, isLoading: false }) },
    },
    auth: { me: { useQuery: () => ({ data: null, isLoading: false }) } },
    trending: {
      fetch: { useQuery: () => ({ data: [], isLoading: false }) },
      listWithFavorites: { useQuery: () => ({ data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }, isLoading: false, isError: false, refetch: vi.fn() }) },
      kpiStats: { useQuery: () => ({ data: null, isLoading: false }) },
      favorite: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      detail: { useQuery: () => ({ data: null, isLoading: false, isError: false }) },
    },
    myTopics: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      countBySource: { useQuery: () => ({ data: null, isLoading: false }) },
      add: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    copywriting: {
      freeGenerate: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, data: null }) },
      acquisitionGenerate: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, data: null }) },
    },
    history: {
      list: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) },
      count: { useQuery: () => ({ data: 0 }) },
      detail: { useQuery: () => ({ data: null, isLoading: false }) },
      delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      get: { useQuery: () => ({ data: null, isLoading: false, isError: false, error: null, refetch: vi.fn() }) },
      save: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }) },
      saveStream: { useSubscription: vi.fn() },
      progress: { useQuery: () => ({ data: { completedSteps: [], completed: 0, total: 9 }, isLoading: false, refetch: vi.fn() }) },
    },
    // PRD-37 US-P08: asset router mock
    asset: {
      uploadAsset: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({ ok: true, assetId: 1 }), isPending: false }) },
      summarizeStep1Assets: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({ ok: true, productSummary: null, personaSummary: null }), isPending: false }) },
    },
  },
  queryClient: {},
  trpcClient: {},
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: { id: 1, name: 'Test', platform: 'douyin', stage: 'starter', industry: '科技', followersRange: '0-1000' },
    isLoading: false,
    isSwitching: false,
    switchTo: vi.fn(),
  }),
}));

// Component that throws on render for ErrorBoundary testing
function BrokenComponent(): never {
  throw new Error('Test render error');
}

describe('stepConfig', () => {
  it('has all 9 step keys', () => {
    const keys = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9'];
    for (const key of keys) {
      expect(stepConfig.has(key)).toBe(true);
    }
  });

  it('step1 has non-empty title and description', () => {
    const data = stepConfig.get('step1')!;
    expect(data.title).toBeTruthy();
    expect(data.description).toBeTruthy();
    expect(data.phase).toBeTruthy();
  });
});

describe('Step pages render', () => {
  it('Step1 renders h1 with correct title', () => {
    render(
      <MemoryRouter>
        <Step1 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('选择你的行业赛道');
  });

  it('Step5 renders h1 with correct title', () => {
    render(<MemoryRouter><Step5 /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款选题库');
  });

  it('Step8 renders h1 with correct title', () => {
    render(<MemoryRouter><Step8 /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('直播策划');
  });

});

describe('Tool pages render', () => {
  it('Generate renders h1 heading', () => {
    render(<MemoryRouter><Generate /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('生成爆款文案');
  });

  it('Trending renders h1 heading', () => {
    render(<MemoryRouter><Trending /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('全网爆款库');
  });

  it('Trending renders trending-grid-empty when no items (smoke)', () => {
    render(<MemoryRouter><Trending /></MemoryRouter>);
    // mock returns items:[] → empty state rendered
    expect(screen.getByTestId('trending-grid-empty')).toBeInTheDocument();
  });

  it('Trending renders trending-filter-card and trending-search-bar (smoke)', () => {
    render(<MemoryRouter><Trending /></MemoryRouter>);
    expect(screen.getByTestId('trending-filter-card')).toBeInTheDocument();
    expect(screen.getByTestId('trending-search-bar')).toBeInTheDocument();
  });

  it('Knowledge renders h1 heading', () => {
    render(<MemoryRouter><Knowledge /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AIP文案方法论');
  });
});

describe('Module pages render', () => {
  it('Diagnosis renders h1 字面锁 "7 维度 IP 诊断报告" (PRD-23 US-001 完整化)', () => {
    render(<MemoryRouter><Diagnosis /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('7维度IP诊断报告');
  });

  it('Diagnosis shows 8-step wizard (Step 1 · 基本信息)', () => {
    render(<MemoryRouter><Diagnosis /></MemoryRouter>);
    expect(screen.getByText('步骤 1/8 · 基本信息')).toBeInTheDocument();
  });

  it('Evolution renders h1 heading (PRD-24 US-002 · 智能体进化中心)', () => {
    render(<MemoryRouter><Evolution /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('智能体进化中心');
  });

  it('Evolution shows spec §8.5.3 subtitle', () => {
    render(<MemoryRouter><Evolution /></MemoryRouter>);
    const header = screen.getByTestId('evolution-header');
    expect(header.textContent).toMatch(/你的智能体通过.*反馈学习.*深度学习.*持续进化，越用越懂你/);
  });

  it('Accounts renders h1 heading', () => {
    render(<MemoryRouter><Accounts /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IP账号管理');
  });

  it('Accounts renders accounts-list (empty state under no-data mock)', () => {
    render(<MemoryRouter><Accounts /></MemoryRouter>);
    expect(screen.getByTestId('accounts-list')).toBeInTheDocument();
    // 接真 tRPC 后,全局 mock 无数据 → 渲染空态
    expect(screen.getByText('暂无账号')).toBeInTheDocument();
  });

  it('DailyTasks renders h1 heading', () => {
    render(<MemoryRouter><DailyTasks /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('今日行动清单');
  });

  it('MyTopics renders h1 heading', () => {
    render(<MemoryRouter><MyTopics /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('选题库');
  });

  it('History renders h1 heading', () => {
    render(<MemoryRouter><History /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('历史记录');
  });
});

describe('IpPlan page (US-010)', () => {
  it('renders ip-plan-page with h1 我的IP方案', () => {
    render(<MemoryRouter><IpPlan /></MemoryRouter>);
    expect(screen.getByTestId('ip-plan-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('我的IP方案');
  });

  it('renders step cards with 查看详情 links for completed steps', () => {
    render(<MemoryRouter><IpPlan /></MemoryRouter>);
    const links = screen.getAllByRole('link', { name: /查看详情/ });
    expect(links).toHaveLength(4);
  });

  it('shows 已完成 N／9 步 subtitle in ip-plan-subtitle', () => {
    render(<MemoryRouter><IpPlan /></MemoryRouter>);
    expect(screen.getByTestId('ip-plan-subtitle')).toHaveTextContent(/已完成/);
  });
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <span>正常内容</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('页面加载出错')).toBeInTheDocument();
    expect(screen.getByText('Test render error')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallback={<div>自定义错误页</div>}>
        <BrokenComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('自定义错误页')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('resets error state on button click', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('页面加载出错')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新加载' }));
    spy.mockRestore();
  });
});
