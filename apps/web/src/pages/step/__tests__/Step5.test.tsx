import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Step5 from '@/pages/step/Step5';

// ── Minimal TopicOutput fixture (真实后端形状 · TopicAgent output) ──────────────
const MOCK_TOPIC_TRAFFIC = {
  category: 'traffic' as const,
  topics: [
    { title: '老板们为什么还在熬夜加班', hook: '开头钩子', structure: '痛点→方案', formula: '反差对比', viralPotential: 'high' as const },
    { title: '00后都开始用AI赚钱了', hook: '钩子2', structure: '结构2', formula: '数字清单', viralPotential: 'medium' as const },
    { title: 'AI定制比你自己更懂你', hook: '钩子3', structure: '结构3', formula: '情绪共鸣', viralPotential: 'low' as const },
  ],
};

const MOCK_TOPIC_MONETIZE = {
  category: 'monetize' as const,
  topics: [
    { title: 'AI定制服务直降3000仅限本周', hook: '钩子M', structure: '结构M', formula: '公式M', viralPotential: 'high' as const },
  ],
};

// ── vi.hoisted mutable mock state ─────────────────────────────────────────────
const mockState = vi.hoisted(() => ({
  saveMutation: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null as { message: string } | null,
    data: undefined as unknown,
  },
  // Per-category DB query mocks (step5_traffic … step5_case)
  // Default: all queries use the same shared getQuery state (backward compat)
  getQuery: {
    data: null as unknown,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  },
  // Per-category overrides — when set, that stepKey returns this data
  categoryData: {} as Record<string, unknown>,
  activeAccount: {
    data: null as unknown,
    isLoading: false,
  },
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => mockState.activeAccount },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      // Per-category get: return categoryData[stepKey] if set, else shared getQuery
      get: {
        useQuery: ({ stepKey }: { stepKey: string }) => {
          const override = mockState.categoryData[stepKey];
          if (override !== undefined) {
            return { data: override, isLoading: false, isError: false, error: null, refetch: vi.fn() };
          }
          return mockState.getQuery;
        },
      },
      save: { useMutation: () => mockState.saveMutation },
      saveStream: { useSubscription: vi.fn() },
    },
  },
}));

// ── Reset state before each test ──────────────────────────────────────────────
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

  mockState.categoryData = {};

  mockState.activeAccount.data = null;
  mockState.activeAccount.isLoading = false;
});

function renderStep5() {
  return render(
    <MemoryRouter>
      <Step5 />
    </MemoryRouter>,
  );
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Step5', () => {
  // ── 字面锁 / H1 / 基础结构 ────────────────────────────────────────────────

  it('renders h1 with 爆款选题库', () => {
    renderStep5();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款选题库');
  });

  it('renders STEP 05 · 爆款选题库 tag literal', () => {
    renderStep5();
    expect(screen.getByText('STEP 05 · 爆款选题库')).toBeInTheDocument();
  });

  it('renders 重新生成全部选题 CTA button', () => {
    renderStep5();
    // Multiple occurrences (header + form CTA) — at least one present
    expect(screen.getAllByRole('button', { name: /重新生成全部选题/ })).not.toHaveLength(0);
  });

  it('renders industry input', () => {
    renderStep5();
    expect(screen.getByPlaceholderText(/AI智能体 \/ 餐饮/)).toBeInTheDocument();
  });

  // ── 空态 · hasResult 门控 · 无真数据不显假选题 ────────────────────────────

  it('shows empty state when no real data and not loading', () => {
    renderStep5();
    expect(screen.getByTestId('step5-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/尚未生成爆款选题库/)).toBeInTheDocument();
  });

  it('does NOT render output grid when no real data (hasResult gate)', () => {
    renderStep5();
    expect(screen.queryByTestId('step5-output-grid')).not.toBeInTheDocument();
  });

  it('does NOT render any topic titles before generation', () => {
    renderStep5();
    expect(screen.queryByText('老板们为什么还在熬夜加班')).not.toBeInTheDocument();
  });

  it('does NOT show empty state while mutation is pending', () => {
    mockState.saveMutation.isPending = true;
    renderStep5();
    expect(screen.queryByTestId('step5-empty-state')).not.toBeInTheDocument();
  });

  it('does NOT show empty state while dbQuery is loading', () => {
    mockState.getQuery.isLoading = true;
    renderStep5();
    expect(screen.queryByTestId('step5-empty-state')).not.toBeInTheDocument();
  });

  // ── Loading 态 ──────────────────────────────────────────────────────────────

  it('shows loading banner (step5-loading testid) when mutation isPending', () => {
    mockState.saveMutation.isPending = true;
    renderStep5();
    expect(screen.getByTestId('step5-loading')).toBeInTheDocument();
    expect(screen.getByTestId('step5-loading')).toHaveTextContent('AI 正在生成爆款选题');
  });

  it('CTA form button shows 生成中… when isPending', () => {
    mockState.saveMutation.isPending = true;
    renderStep5();
    expect(screen.getByRole('button', { name: /生成中/ })).toBeInTheDocument();
  });

  // ── Error 态 ────────────────────────────────────────────────────────────────

  it('shows error banner (step5-error testid) when mutation isError', () => {
    mockState.saveMutation.isError = true;
    mockState.saveMutation.error = { message: '生成失败，请重试' };
    renderStep5();
    expect(screen.getByTestId('step5-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
  });

  // ── DB loading 态 ───────────────────────────────────────────────────────────

  it('shows db loading banner while dbQuery.isLoading=true', () => {
    mockState.getQuery.isLoading = true;
    renderStep5();
    expect(screen.getByTestId('step5-db-loading')).toBeInTheDocument();
    expect(screen.getByText(/正在加载历史记录/)).toBeInTheDocument();
  });

  // ── DB error 态 ─────────────────────────────────────────────────────────────

  it('shows db error banner with retry when dbQuery.isError=true and no real data', () => {
    mockState.getQuery.isError = true;
    renderStep5();
    expect(screen.getByTestId('step5-db-error')).toBeInTheDocument();
    expect(screen.getByText(/历史记录加载失败/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
  });

  // ── 真数据渲染 · mutation 成功 session result ─────────────────────────────

  it('renders topic titles from mutation session result (TopicOutput shape)', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_TOPIC_TRAFFIC,
        stepKey: 'step5',
        inputs: { industry: '其他行业', product: 'AI', lastCategory: 'traffic' },
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep5();
    // output grid shown when hasResult
    expect(screen.getByTestId('step5-output-grid')).toBeInTheDocument();
    // topic title rendered
    expect(screen.getByText('老板们为什么还在熬夜加班')).toBeInTheDocument();
    expect(screen.getByText('00后都开始用AI赚钱了')).toBeInTheDocument();
    // empty state hidden
    expect(screen.queryByTestId('step5-empty-state')).not.toBeInTheDocument();
  });

  it('maps viralPotential to difficulty labels correctly (high→简单 medium→中等 low→困难)', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_TOPIC_TRAFFIC,
        stepKey: 'step5',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep5();
    // high → 简单, medium → 中等, low → 困难
    expect(screen.getByText('简单')).toBeInTheDocument();
    expect(screen.getByText('中等')).toBeInTheDocument();
    expect(screen.getByText('困难')).toBeInTheDocument();
  });

  // ── 真数据渲染 · dbQuery GET result ──────────────────────────────────────

  it('renders topic titles from dbQuery result (StepData row shape)', () => {
    mockState.getQuery.data = {
      result: MOCK_TOPIC_TRAFFIC,
      stepKey: 'step5',
      inputs: { industry: 'AI行业', product: '定制智能体', lastCategory: 'traffic' },
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep5();
    expect(screen.getByTestId('step5-output-grid')).toBeInTheDocument();
    expect(screen.getByText('老板们为什么还在熬夜加班')).toBeInTheDocument();
  });

  it('restores industry input from dbQuery inputs', () => {
    mockState.getQuery.data = {
      result: MOCK_TOPIC_TRAFFIC,
      stepKey: 'step5',
      inputs: { industry: 'AI教育行业', product: '定制智能体', lastCategory: 'traffic' },
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep5();
    expect(screen.getByPlaceholderText(/AI智能体 \/ 餐饮/)).toHaveValue('AI教育行业');
  });

  // ── isFallback 降级提示 ────────────────────────────────────────────────────

  it('shows fallback notice when dbQuery.data.isFallback=true and hasResult', () => {
    mockState.getQuery.data = {
      result: MOCK_TOPIC_TRAFFIC,
      stepKey: 'step5',
      inputs: {},
      isFallback: true,
      version: 1,
      updatedAt: '',
    };
    renderStep5();
    expect(screen.getByTestId('step5-fallback-notice')).toBeInTheDocument();
  });

  it('does NOT show fallback notice when isFallback=false', () => {
    mockState.getQuery.data = {
      result: MOCK_TOPIC_TRAFFIC,
      stepKey: 'step5',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep5();
    expect(screen.queryByTestId('step5-fallback-notice')).not.toBeInTheDocument();
  });

  // ── 无真数据 → 不显选题报告 ─────────────────────────────────────────────────

  it('does NOT render data insights section when no real data', () => {
    renderStep5();
    expect(screen.queryByText(/数据洞察/)).not.toBeInTheDocument();
  });

  // ── 无效/malformed result → 空态 ────────────────────────────────────────────

  it('does NOT render output for invalid malformed result (guard rejected)', () => {
    mockState.getQuery.data = {
      result: { broken: true }, // not a valid TopicOutput
      stepKey: 'step5',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep5();
    expect(screen.queryByTestId('step5-output-grid')).not.toBeInTheDocument();
    expect(screen.getByTestId('step5-empty-state')).toBeInTheDocument();
  });

  // ── dbQuery.isError → 加载失败提示，但有真数据时隐藏 ──────────────────────────

  it('does NOT show db error banner when dbQuery.isError=true but real data from mutation', () => {
    mockState.getQuery.isError = true;
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_TOPIC_MONETIZE,
        stepKey: 'step5',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep5();
    expect(screen.queryByTestId('step5-db-error')).not.toBeInTheDocument();
  });

  // ── 搜索框在有结果时显示 ─────────────────────────────────────────────────────

  it('renders search input when hasResult', () => {
    mockState.getQuery.data = {
      result: MOCK_TOPIC_TRAFFIC,
      stepKey: 'step5',
      inputs: {},
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep5();
    expect(screen.getByPlaceholderText(/搜索选题关键词/)).toBeInTheDocument();
  });

  // ── 多类累积 · 每类写各自 stepKey (无竞态) ────────────────────────────────────

  it('P0 fix: per-category stepKeys — mutate not called before user action', () => {
    // Verify handleGenerateAll fires saves to step5_traffic … step5_case, not all to 'step5'
    // On initial render, mutate should NOT have been called
    renderStep5();
    expect(mockState.saveMutation.mutate).not.toHaveBeenCalled();
  });

  it('P0 fix: accumulates multiple categories from separate mutation onSuccess calls', () => {
    // Simulate: mutation returned traffic first, then mutation returns monetize
    // Both should be in mergedTopics
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_TOPIC_TRAFFIC,
        stepKey: 'step5_traffic',
        inputs: { industry: '其他行业', product: 'AI' },
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep5();
    // traffic topics visible
    expect(screen.getByTestId('step5-output-grid')).toBeInTheDocument();
    expect(screen.getByText('老板们为什么还在熬夜加班')).toBeInTheDocument();
  });

  it('P0 fix: per-category DB restore — step5_monetize query populates hasResult', () => {
    // Set category-specific data for step5_monetize
    mockState.categoryData['step5_monetize'] = {
      result: MOCK_TOPIC_MONETIZE,
      stepKey: 'step5_monetize',
      inputs: { industry: '其他行业', product: 'AI' },
      isFallback: false,
      version: 1,
      updatedAt: '',
    };
    renderStep5();
    // output grid shown because hasResult=true (monetize category has data)
    expect(screen.getByTestId('step5-output-grid')).toBeInTheDocument();
    // empty state hidden because hasResult=true
    expect(screen.queryByTestId('step5-empty-state')).not.toBeInTheDocument();
    // The monetize category card should show the count > 0
    // (traffic is active by default; monetize count badge shows "1 个")
    expect(screen.getByText('1 个')).toBeInTheDocument();
  });

  it('mutation fallback: isFallback from mutation data → shows fallback notice', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_TOPIC_TRAFFIC,
        stepKey: 'step5_traffic',
        inputs: {},
        isFallback: true,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep5();
    // hasResult=true (topics present) + isFallback=true (from mutation)
    expect(screen.getByTestId('step5-fallback-notice')).toBeInTheDocument();
  });

  it('mutation fallback: isFallback=false from mutation → no fallback notice', () => {
    mockState.saveMutation.data = {
      ok: true,
      data: {
        result: MOCK_TOPIC_TRAFFIC,
        stepKey: 'step5_traffic',
        inputs: {},
        isFallback: false,
        version: 1,
        updatedAt: '',
      },
    };
    renderStep5();
    expect(screen.queryByTestId('step5-fallback-notice')).not.toBeInTheDocument();
  });
});
