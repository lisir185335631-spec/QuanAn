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
import Step2 from '@/pages/step/Step2';
import Step5 from '@/pages/step/Step5';
import Step8 from '@/pages/step/Step8';
import Step9 from '@/pages/step/Step9';
import Copywriting from '@/pages/tools/Copywriting';
import Generate from '@/pages/tools/Generate';
import Knowledge from '@/pages/tools/Knowledge';
import Trending from '@/pages/tools/Trending';
import VoiceChat from '@/pages/tools/VoiceChat';

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
      getProfile: { useQuery: () => ({ data: null, isLoading: false, isError: false }) },
      evolve: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateConfig: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getInsightHistory: { useQuery: () => ({ data: [], isLoading: false }) },
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
      listWithFavorites: { useQuery: () => ({ data: [], isLoading: false }) },
      kpiStats: { useQuery: () => ({ data: null, isLoading: false }) },
      favorite: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      detail: { useQuery: () => ({ data: null, isLoading: false }) },
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
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      detail: { useQuery: () => ({ data: null, isLoading: false }) },
      delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      get: { useQuery: () => ({ data: null, isLoading: false, isError: false, error: null, refetch: vi.fn() }) },
      save: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }) },
      saveStream: { useSubscription: vi.fn() },
      progress: { useQuery: () => ({ data: { completedSteps: [], completed: 0, total: 9 }, isLoading: false, refetch: vi.fn() }) },
    },
    stt: {
      transcribe: { useMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({ transcript: '测试语音', durationSec: 2, costUsd: 0.001 }), isPending: false }) },
    },
    tts: {
      synthesize: { useMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({ publicUrl: 'http://example.com/audio.mp3', sizeBytes: 1024, costUsd: 0.015 }), isPending: false }) },
    },
    voiceChat: {
      clearSession: { useMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({ ok: true }), isPending: false }) },
      start: { useSubscription: vi.fn() },
    },
  },
  queryClient: {},
  trpcClient: {
    voiceChat: {
      start: {
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
      },
    },
  },
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

  it('Step2 renders h1 with correct title', () => {
    render(<Step2 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('受众研究与竞品分析');
  });

  it('Step5 renders h1 with correct title', () => {
    render(<MemoryRouter><Step5 /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款选题库');
  });

  it('Step8 renders h1 with correct title', () => {
    render(<Step8 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('直播策划');
  });

  it('Step9 renders h1 with correct title', () => {
    render(<Step9 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('品牌商业化与社群运营');
  });
});

describe('Tool pages render', () => {
  it('Generate renders h1 heading', () => {
    render(<MemoryRouter><Generate /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('生成爆款文案');
  });

  it('Trending renders h1 heading', () => {
    render(<MemoryRouter><Trending /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('全网爆款情报库');
  });

  it('Copywriting renders h1 heading', () => {
    render(<MemoryRouter><Copywriting /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款文案创作');
  });

  it('Knowledge renders h1 heading', () => {
    render(<Knowledge />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AIP 文案方法论');
  });
});

describe('Module pages render', () => {
  it('Diagnosis renders h1 字面锁 "7 维度 IP 诊断报告" (PRD-23 US-001 完整化)', () => {
    render(<Diagnosis />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('7 维度 IP 诊断报告');
  });

  it('Diagnosis shows 8-step wizard (Step 1 · 基本信息)', () => {
    render(<Diagnosis />);
    expect(screen.getByText('步骤 1 / 8 · 基本信息')).toBeInTheDocument();
  });

  it('Evolution renders h1 heading (PRD-24 US-002 · 智能体进化中心)', () => {
    render(<MemoryRouter><Evolution /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('智能体进化中心');
  });

  it('Evolution shows spec §8.5.3 subtitle', () => {
    render(<MemoryRouter><Evolution /></MemoryRouter>);
    expect(
      screen.getByText('你的智能体通过反馈学习和深度学习持续进化，越用越懂你'),
    ).toBeInTheDocument();
  });

  it('Accounts renders h1 heading', () => {
    render(<MemoryRouter><Accounts /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IP 账号管理');
  });

  it('Accounts shows empty state when no data', () => {
    render(<MemoryRouter><Accounts /></MemoryRouter>);
    expect(screen.getByText(/暂无 IP 账号/)).toBeInTheDocument();
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
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('操作历史');
  });
});

describe('IpPlan page (US-010)', () => {
  it('renders ip-plan-page with h1 我的IP方案', () => {
    render(<MemoryRouter><IpPlan /></MemoryRouter>);
    expect(screen.getByTestId('ip-plan-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('我的IP方案');
  });

  it('renders 9 step cards with 查看详情 buttons', () => {
    render(<MemoryRouter><IpPlan /></MemoryRouter>);
    const buttons = screen.getAllByRole('button', { name: /查看详情/ });
    expect(buttons).toHaveLength(9);
  });

  it('shows 已完成 0 / 9 步 with empty completedSteps', () => {
    render(<MemoryRouter><IpPlan /></MemoryRouter>);
    expect(screen.getByText(/已完成/)).toBeInTheDocument();
  });
});

describe('VoiceChat page (1:1 复刻 mock-first)', () => {
  it('chip 标题 "VOICE CHAT" 渲染', () => {
    render(
      <MemoryRouter>
        <VoiceChat />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('voice-chat-chip-title')).toHaveTextContent('VOICE CHAT');
  });

  it('chip subtitle "语音对话 · 你的专属IP变现顾问" 渲染', () => {
    render(
      <MemoryRouter>
        <VoiceChat />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('voice-chat-chip-subtitle')).toHaveTextContent(
      '语音对话 · 你的专属IP变现顾问',
    );
  });

  it('input placeholder 有什么问题尽管问我...', () => {
    render(
      <MemoryRouter>
        <VoiceChat />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText('有什么问题尽管问我...')).toBeInTheDocument();
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
