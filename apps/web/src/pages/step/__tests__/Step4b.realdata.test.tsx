/**
 * Step4b.realdata.test.tsx — 真实 agent 数据路径测试
 * Injection: trpc.monetization.generatePlan.useMutation mock 在 mutate() 时
 *            同步调用 onSuccess({ content: JSON.stringify(REAL_PLAN_DATA) })
 * 断言: marketAnalysis.industryAnalysis / revenueStructure.name / successCases.title
 *       渲染到 DOM（区别于 generateMockResult() 默认数据）
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Step4b from '../Step4b';

// ── sonner mock ──────────────────────────────────────────────────────────────
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// ── hooks ────────────────────────────────────────────────────────────────────
vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({ account: null, isLoading: false }),
}));

vi.mock('@/hooks/useStepData', () => ({
  useStepData: () => ({ save: vi.fn(), isSaving: false, dbQuery: { refetch: vi.fn() } }),
  readOtherStep: () => null,
}));

vi.mock('@/lib/text', () => ({
  breakSentences: (s: string) => s,
}));

// ── Real plan data: fields distinct from generateMockResult() defaults ────────
// stages must satisfy Step4bStage type: productMatrix/keyActions/risks required arrays
const REAL_PLAN_DATA = {
  marketAnalysis: {
    industryAnalysis: 'AI教育垂直赛道·独家真实测试行业分析',
    marketScale: '2025年AI教育市场规模预计超5000亿，年增长率35%+',
    competition: '头部玩家占据60%市场，垂直细分领域蓝海竞争',
    monetizationPotential: '极高，AI技能溢价明显，定制化服务客单价持续提升',
  },
  stages: [
    {
      number: 1,
      icon: 'trending',
      range: '0→90万',
      title: '冷启动阶段：真实测试案例积累',
      duration: '6-12个月',
      coreStrategy: '私域流量积累+产品验证',
      productMatrix: [],
      keyActions: ['积累案例', '建立私域'],
      risks: ['流量获取难'],
    },
  ],
  revenueStructure: [
    { name: 'AI课程真实收入源', percentage: '45%', desc: '在线课程+训练营主要收入' },
  ],
  successCases: [
    {
      title: '真实成功案例一号',
      category: 'AI教育',
      journey: '从0到1的AI创业历程',
      outcome: '年收入500万',
      insight: '坚持垂直深耕是关键',
    },
  ],
};

// ── Mutable store ─────────────────────────────────────────────────────────────
const _step4bStore = { triggerSuccess: false as boolean };

// ── trpc mock — generatePlan calls onSuccess synchronously ───────────────────
vi.mock('@/lib/trpc', () => {
  type OnSuccessHandler = (row: { content: string }) => void;

  const generatePlanMutation = ({ onSuccess }: { onSuccess?: OnSuccessHandler; onError?: (e: { message: string }) => void } = {}) => ({
    mutate: (..._args: unknown[]) => {
      if (_step4bStore.triggerSuccess && onSuccess) {
        onSuccess({ content: JSON.stringify(REAL_PLAN_DATA) });
      }
    },
    isPending: false,
    isError: false,
    data: undefined,
  });

  return {
    trpc: {
      auth: { me: { useQuery: () => ({ data: null, isLoading: false }) } },
      ipAccounts: {
        list: { useQuery: () => ({ data: [], isLoading: false }) },
        active: { useQuery: () => ({ data: null, isLoading: false }) },
        switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      },
      monetization: {
        generatePlan: { useMutation: generatePlanMutation },
      },
    },
  };
});

// ── render helper ─────────────────────────────────────────────────────────────
function renderPage() {
  return render(
    <MemoryRouter>
      <Step4b />
    </MemoryRouter>,
  );
}

// ── Reset store before each test ─────────────────────────────────────────────
beforeEach(() => {
  _step4bStore.triggerSuccess = false;
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── 真实 agent 数据路径测试 ────────────────────────────────────────────────────
describe('Step4b — 真实 agent 数据路径', () => {
  it('onSuccess 触发后 · marketAnalysis.industryAnalysis 渲染到 DOM', async () => {
    _step4bStore.triggerSuccess = true;
    renderPage();
    const submitBtn = screen.getByRole('button', { name: /生成变现路径/ });
    fireEvent.click(submitBtn);
    await screen.findByText(/AI教育垂直赛道·独家真实测试行业分析/);
    expect(screen.getByText(/AI教育垂直赛道·独家真实测试行业分析/)).toBeInTheDocument();
  });

  it('onSuccess 触发后 · revenueStructure.name "AI课程真实收入源" 渲染到 DOM', async () => {
    _step4bStore.triggerSuccess = true;
    renderPage();
    const submitBtn = screen.getByRole('button', { name: /生成变现路径/ });
    fireEvent.click(submitBtn);
    await screen.findByText(/AI课程真实收入源/);
    expect(screen.getByText(/AI课程真实收入源/)).toBeInTheDocument();
  });

  it('onSuccess 触发后 · successCases.title "真实成功案例一号" 渲染到 DOM', async () => {
    _step4bStore.triggerSuccess = true;
    renderPage();
    const submitBtn = screen.getByRole('button', { name: /生成变现路径/ });
    fireEvent.click(submitBtn);
    await screen.findAllByText(/真实成功案例一号/);
    expect(screen.getAllByText(/真实成功案例一号/).length).toBeGreaterThanOrEqual(1);
  });

  it('triggerSuccess=false 时 · 真实数据不渲染(负向)', () => {
    _step4bStore.triggerSuccess = false;
    renderPage();
    const submitBtn = screen.getByRole('button', { name: /生成变现路径/ });
    fireEvent.click(submitBtn);
    expect(screen.queryByText(/AI教育垂直赛道·独家真实测试行业分析/)).not.toBeInTheDocument();
  });
});
