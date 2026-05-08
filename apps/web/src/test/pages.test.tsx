import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { stepConfig } from '@/lib/stepConfig';
import Step1 from '@/pages/step/Step1';
import Step2 from '@/pages/step/Step2';
import Step5 from '@/pages/step/Step5';
import Step8 from '@/pages/step/Step8';
import Step9 from '@/pages/step/Step9';
import Accounts from '@/pages/modules/Accounts';
import Diagnosis from '@/pages/modules/Diagnosis';
import DailyTasks from '@/pages/modules/DailyTasks';
import Evolution from '@/pages/modules/Evolution';
import History from '@/pages/modules/History';
import MyTopics from '@/pages/modules/MyTopics';
import Copywriting from '@/pages/tools/Copywriting';
import Generate from '@/pages/tools/Generate';
import Knowledge from '@/pages/tools/Knowledge';
import Trending from '@/pages/tools/Trending';

// Mock tRPC — pages that call useQuery hooks need this to render without a real provider
vi.mock('@/lib/trpc', () => ({
  trpc: {
    diagnosis: { latest: { useQuery: () => ({ data: null, isLoading: false }) } },
    evolution: { history: { useQuery: () => ({ data: [], isLoading: false }) } },
    ipAccounts: { list: { useQuery: () => ({ data: [], isLoading: false }) } },
    knowledge: { getRecommendations: { useQuery: () => ({ data: [], isLoading: false }) } },
    trending: { fetch: { useQuery: () => ({ data: [], isLoading: false }) } },
  },
  queryClient: {},
  trpcClient: {},
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
    render(<Step1 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IP 定位与身份建立');
  });

  it('Step2 renders h1 with correct title', () => {
    render(<Step2 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('受众研究与竞品分析');
  });

  it('Step5 renders h1 with correct title', () => {
    render(<Step5 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('发布与运营');
  });

  it('Step8 renders h1 with correct title', () => {
    render(<Step8 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('持续迭代与升级');
  });

  it('Step9 renders h1 with correct title', () => {
    render(<Step9 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('品牌商业化与社群运营');
  });
});

describe('Tool pages render', () => {
  it('Generate renders h1 heading', () => {
    render(<Generate />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI 智能生成');
  });

  it('Trending renders h1 heading', () => {
    render(<Trending />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('全网爆款库');
  });

  it('Copywriting renders h1 heading', () => {
    render(<Copywriting />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款文案创作');
  });

  it('Knowledge renders h1 heading', () => {
    render(<Knowledge />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('方法论知识库');
  });
});

describe('Module pages render', () => {
  it('Diagnosis renders h1 heading', () => {
    render(<Diagnosis />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IP 诊断');
  });

  it('Diagnosis shows empty state when no data', () => {
    render(<Diagnosis />);
    expect(screen.getByText('暂无诊断记录 · 请先完成 IP 诊断问卷')).toBeInTheDocument();
  });

  it('Evolution renders h1 heading', () => {
    render(<Evolution />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('进化中心');
  });

  it('Evolution shows empty state when no data', () => {
    render(<Evolution />);
    expect(screen.getByText('暂无进化记录')).toBeInTheDocument();
  });

  it('Accounts renders h1 heading', () => {
    render(<Accounts />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IP 账号');
  });

  it('Accounts shows empty state when no data', () => {
    render(<Accounts />);
    expect(screen.getByText('暂无 IP 账号 · 请先完成 Step 1 创建')).toBeInTheDocument();
  });

  it('DailyTasks renders h1 heading', () => {
    render(<DailyTasks />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('每日任务');
  });

  it('MyTopics renders h1 heading', () => {
    render(<MyTopics />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('选题库');
  });

  it('History renders h1 heading', () => {
    render(<History />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('历史记录');
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
