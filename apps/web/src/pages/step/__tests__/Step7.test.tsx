import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Step7 from '@/pages/step/Step7';

// ── Minimal CopywritingResult fixture (真实后端 CopywritingOutput 形状) ────────
const MOCK_COPYWRITING_RESULT = {
  markdown: '# 测试爆款文案\n\n【话题抛出】为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？\n\n【正方】AI赋能，效率为王\n\n【反方】传统派：服务为本，温度至上\n\n• 我的立场\n\n其实这两种观点都有道理。\n\n• 评论区引导\n\n你怎么看？\n\n【话题标签】#美业 #AI赋能',
  structure: '话题抛出→正方论点→反方论点→我的立场→评论引导（辩论模板）',
  hooks: ['为什么有的人赚钱那么轻松', '美业 AI 赋能对比'],
  cta: '评论区告诉我你的选择',
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
      save: {
        useMutation: (opts?: {
          onSuccess?: () => void;
          onError?: (err: { message: string }) => void;
        }) => ({
          mutate: mockState.saveMutation.mutate,
          isPending: mockState.saveMutation.isPending,
          isError: mockState.saveMutation.isError,
          error: mockState.saveMutation.error,
          data: mockState.saveMutation.data,
          isSuccess: mockState.saveMutation.data !== undefined,
          // expose opts so tests can trigger callbacks if needed
          _opts: opts,
        }),
      },
    },
    // US-P10: viral analysis mutation mock
    videoAnalysis: {
      analyze: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
          isError: false,
          error: null,
          data: undefined,
        }),
      },
    },
  },
}));

// US-P10: mock readOtherStep (returns null by default → step5Topic = null, no topic echo rendered)
vi.mock('@/hooks/useStepData', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/useStepData')>();
  return {
    ...original,
    readOtherStep: vi.fn(() => null),
  };
});

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
});

function renderStep7(route = '/step/7') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Step7 />
    </MemoryRouter>,
  );
}

describe('Step7', () => {
  // ── 字面锁 & 基础结构 ──────────────────────────────────────────────────────

  it('renders H1 字面锁 "文案生成"', () => {
    renderStep7();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('文案生成');
  });

  it('renders STEP_TAG 字面锁 (AC-1 · D-224)', () => {
    renderStep7();
    expect(
      screen.getByText((content) => content.includes('STEP 07') && content.includes('文案生成')),
    ).toBeInTheDocument();
  });

  it('renders 脚本类型 section label (AC-2)', () => {
    renderStep7();
    expect(screen.getAllByText('脚本类型').length).toBeGreaterThanOrEqual(1);
  });

  it('renders 生成爆款文案 CTA button (AC-2)', () => {
    renderStep7();
    expect(screen.getByRole('button', { name: /生成爆款文案/ })).toBeInTheDocument();
  });

  it('renders navigation buttons (AC-2)', () => {
    renderStep7();
    expect(screen.getByRole('button', { name: /我的选题库/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /爆款选题/ })).toBeInTheDocument();
  });

  it('renders subtitle 字面锁 (AC-1)', () => {
    renderStep7();
    expect(
      screen.getByText((_, element) => {
        if (!element || element.tagName !== 'P') return false;
        const text = element.textContent ?? '';
        return (
          text.includes('选择脚本类型和爆款元素') &&
          text.includes('输入主题') &&
          text.includes('深度爆款文案') &&
          text.includes('AI 智能修改优化')
        );
      }),
    ).toBeInTheDocument();
  });

  // ── 空态门控 ───────────────────────────────────────────────────────────────

  it('shows empty state when no result (AC-4 · hasResult gate)', () => {
    renderStep7();
    expect(screen.getByTestId('step7-empty-state')).toBeInTheDocument();
  });

  it('does NOT render mock 假文案 when no real result (AC-4 · 无真不显假)', () => {
    renderStep7();
    // 旧 GENERATED_RESULT mock 文本已彻底删除
    expect(screen.queryByText(/【话题抛出】为什么美业老板/)).not.toBeInTheDocument();
    expect(screen.queryByText(/轻松赚钱派/)).not.toBeInTheDocument();
  });

  it('does NOT show AI 优化区 when no real result', () => {
    renderStep7();
    // AI 优化区只在 hasResult 时渲染
    expect(screen.queryByPlaceholderText(/加强转化钩子/)).not.toBeInTheDocument();
  });

  it('does NOT show 数据洞察 section when no result', () => {
    renderStep7();
    expect(screen.queryByText('数据洞察')).not.toBeInTheDocument();
  });

  // ── 真实数据渲染 ───────────────────────────────────────────────────────────

  it('renders 真 result from dbQuery.data when available (AC-4)', () => {
    mockState.getQuery.data = { result: MOCK_COPYWRITING_RESULT, isFallback: false };
    renderStep7();

    expect(screen.getByTestId('step7-result-markdown')).toBeInTheDocument();
    expect(screen.getByText(/测试爆款文案/)).toBeInTheDocument();
    expect(screen.getByText(/【话题抛出】/)).toBeInTheDocument();
    expect(screen.getByText(/【正方】/)).toBeInTheDocument();
    expect(screen.getByText(/【反方】/)).toBeInTheDocument();
    // "我的立场" appears in both the markdown pre and the structure span — use getAllBy
    expect(screen.getAllByText(/我的立场/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders 评论区引导 and 话题标签 from db result (AC-4)', () => {
    mockState.getQuery.data = { result: MOCK_COPYWRITING_RESULT, isFallback: false };
    renderStep7();

    expect(screen.getByText(/评论区引导/)).toBeInTheDocument();
    expect(screen.getByText(/【话题标签】/)).toBeInTheDocument();
  });

  it('shows AI 优化区 when hasResult (AC-4)', () => {
    mockState.getQuery.data = { result: MOCK_COPYWRITING_RESULT, isFallback: false };
    renderStep7();

    expect(screen.getByPlaceholderText(/加强转化钩子/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /AI 优化/ }).length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT show empty-state when hasResult (AC-4)', () => {
    mockState.getQuery.data = { result: MOCK_COPYWRITING_RESULT, isFallback: false };
    renderStep7();

    expect(screen.queryByTestId('step7-empty-state')).not.toBeInTheDocument();
  });

  it('renders 数据洞察 section when hasResult', () => {
    mockState.getQuery.data = { result: MOCK_COPYWRITING_RESULT, isFallback: false };
    renderStep7();
    expect(screen.getByText('数据洞察')).toBeInTheDocument();
  });

  it('ignores non-CopywritingResult shaped data (runtime guard · AC-4)', () => {
    // Invalid shape — should not crash, should show empty state
    mockState.getQuery.data = { result: { foo: 'bar' }, isFallback: false };
    renderStep7();
    expect(screen.getByTestId('step7-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('step7-result-markdown')).not.toBeInTheDocument();
  });

  // ── loading 態 ─────────────────────────────────────────────────────────────

  it('shows loading indicator when isPending (AC-5 三态)', () => {
    mockState.saveMutation.isPending = true;
    renderStep7();
    expect(screen.getByTestId('step7-loading')).toBeInTheDocument();
    // CTA button shows "生成中…" text
    expect(screen.getByText('生成中…')).toBeInTheDocument();
  });

  it('shows db loading indicator when dbQuery.isLoading', () => {
    mockState.getQuery.isLoading = true;
    renderStep7();
    expect(screen.getByTestId('step7-db-loading')).toBeInTheDocument();
  });

  // ── error 態 ───────────────────────────────────────────────────────────────

  it('shows error UI when generateMutation.isError (AC-5 三态)', () => {
    mockState.saveMutation.isError = true;
    mockState.saveMutation.error = { message: '生成失败测试' };
    renderStep7();
    expect(screen.getByTestId('step7-error')).toBeInTheDocument();
    expect(screen.getByText(/生成失败测试/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
  });

  it('shows db error when dbQuery.isError and no result', () => {
    mockState.getQuery.isError = true;
    renderStep7();
    expect(screen.getByTestId('step7-db-error')).toBeInTheDocument();
  });

  // ── isFallback 提示 ────────────────────────────────────────────────────────

  it('shows fallback notice when isFallback=true', () => {
    mockState.getQuery.data = { result: MOCK_COPYWRITING_RESULT, isFallback: true };
    renderStep7();
    expect(screen.getByTestId('step7-fallback-notice')).toBeInTheDocument();
    expect(screen.getByText(/AI 模型降级处理/)).toBeInTheDocument();
  });

  it('does NOT show fallback notice when isFallback=false', () => {
    mockState.getQuery.data = { result: MOCK_COPYWRITING_RESULT, isFallback: false };
    renderStep7();
    expect(screen.queryByTestId('step7-fallback-notice')).not.toBeInTheDocument();
  });

  // ── URL 预填 topic ─────────────────────────────────────────────────────────

  it('prefills topic from URL searchParam ?topic=... (AC-7)', () => {
    renderStep7('/step/7?topic=来自选题库的主题&source=trending&trendingId=42');
    const textarea = screen.getByPlaceholderText(/输入文案主题/);
    expect(textarea).toHaveValue('来自选题库的主题');
  });

  it('uses default topic when no URL param', () => {
    renderStep7();
    const textarea = screen.getByPlaceholderText(/输入文案主题/);
    expect(textarea).toHaveValue('为什么有的人赚钱那么轻松');
  });

  // ── P0: generate 调用 mutate · inputs 含 topic/scriptType/elements ─────────

  it('clicking 生成爆款文案 calls mutate with topic, scriptType, elements (P0 · inputs注入)', () => {
    renderStep7();
    const btn = screen.getByRole('button', { name: /生成爆款文案/ });
    fireEvent.click(btn);
    expect(mockState.saveMutation.mutate).toHaveBeenCalledOnce();
    const callArg = mockState.saveMutation.mutate.mock.calls[0]?.[0] as {
      stepKey: string;
      inputs: Record<string, unknown>;
    };
    expect(callArg.stepKey).toBe('step7');
    expect(callArg.inputs).toHaveProperty('topic');
    expect(callArg.inputs).toHaveProperty('scriptType');
    expect(callArg.inputs).toHaveProperty('elements');
    expect(typeof callArg.inputs['topic']).toBe('string');
    expect((callArg.inputs['topic'] as string).length).toBeGreaterThan(0);
    expect(Array.isArray(callArg.inputs['elements'])).toBe(true);
  });

  it('URL prefill topic is included in mutate payload when generating (AC-7 · URL→payload)', () => {
    renderStep7('/step/7?topic=爆款选题主题测试');
    const btn = screen.getByRole('button', { name: /生成爆款文案/ });
    fireEvent.click(btn);
    expect(mockState.saveMutation.mutate).toHaveBeenCalledOnce();
    const callArg = mockState.saveMutation.mutate.mock.calls[0]?.[0] as {
      stepKey: string;
      inputs: Record<string, unknown>;
    };
    expect(callArg.inputs['topic']).toBe('爆款选题主题测试');
  });

  it('URL source and trendingId params are passed in mutate inputs (来源追踪)', () => {
    renderStep7('/step/7?topic=测试选题&source=trending&trendingId=99');
    const btn = screen.getByRole('button', { name: /生成爆款文案/ });
    fireEvent.click(btn);
    expect(mockState.saveMutation.mutate).toHaveBeenCalledOnce();
    const callArg = mockState.saveMutation.mutate.mock.calls[0]?.[0] as {
      stepKey: string;
      inputs: Record<string, unknown>;
    };
    expect(callArg.inputs['source']).toBe('trending');
    expect(callArg.inputs['trendingId']).toBe('99');
  });
});
