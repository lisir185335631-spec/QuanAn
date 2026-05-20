/**
 * PRD-25 US-005 · Analysis unit tests
 * AC-8: ≥ 5 tests · mock trpc · 验证 H3 渲染真数据 + isFallback hint + retry button
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import Analysis from '@/pages/tools/Analysis';

// ── Mock control ──────────────────────────────────────────────────────────────

const mockCtrl = vi.hoisted(() => ({
  onSuccess: undefined as ((data: unknown) => void) | undefined,
  onError: undefined as ((error: unknown) => void) | undefined,
  isPending: false,
}));

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_STRUCTURAL_ROW = vi.hoisted(() => ({
  id: 1,
  content: JSON.stringify({
    scores: {
      hook: 72,
      structure: 68,
      emotion: 75,
      specificity: 55,
      cta: 60,
      overall: 66,
    },
    optimizations: [
      { dimension: 'hook', issue: '开场钩子吸引力不足', suggestion: '加入具体数字或反问句' },
      { dimension: 'specificity', issue: '内容描述较为抽象', suggestion: '用真实数据替换抽象描述' },
      { dimension: 'cta', issue: '结尾行动引导不够明确', suggestion: '明确说明下一步行动' },
    ],
    rewriteSnippet:
      '这是优化后的关键段落示例，包含更清晰的钩子和更强的行动引导，建议参考此结构改写全文，超过五十字。',
  }),
  isFallback: false,
  agentId: 'AnalysisAgent',
  agentMode: 'structural',
  contentType: 'json',
  scriptType: null,
  elements: [],
  tokensUsed: 80,
  modelUsed: 'claude-3-5-haiku',
  durationMs: 2500,
  traceId: null,
  createdAt: new Date(),
}));

const MOCK_FALLBACK_STRUCTURAL_ROW = vi.hoisted(() => ({
  id: 2,
  content: JSON.stringify({
    scores: { hook: 65, structure: 70, emotion: 60, specificity: 55, cta: 50, overall: 60 },
    optimizations: [
      { dimension: 'hook', issue: '开场不足', suggestion: '加数字' },
      { dimension: 'specificity', issue: '太抽象', suggestion: '加案例' },
      { dimension: 'cta', issue: '引导不明', suggestion: '明确行动' },
    ],
    rewriteSnippet:
      '系统备用改写片段：优化后的段落示例，包含清晰钩子和行动引导，超过五十字的备用内容。',
  }),
  isFallback: true,
  agentId: 'AnalysisAgent',
  agentMode: 'structural',
  contentType: 'json',
  scriptType: null,
  elements: [],
  tokensUsed: 0,
  modelUsed: 'fallback',
  durationMs: 0,
  traceId: null,
  createdAt: new Date(),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/trpc', () => ({
  trpc: {
    analysis: {
      analyze: {
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as Record<string, unknown>),
    useNavigate: () => vi.fn(),
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderAnalysis() {
  return render(
    <MemoryRouter>
      <Analysis />
    </MemoryRouter>,
  );
}

function fillAndSubmit(text = '这是一段超过十个字的短视频文案测试内容') {
  const textarea = screen.getByPlaceholderText(/至少 10 个字/);
  fireEvent.change(textarea, { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /开始分析/ }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Analysis', () => {
  beforeEach(() => {
    mockCtrl.isPending = false;
    mockCtrl.onSuccess = undefined;
    mockCtrl.onError = undefined;
  });

  it('AC-1 · H1 字面锁 "文案结构分析"', () => {
    renderAnalysis();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('文案结构分析');
  });

  it('AC-1 · 副标题包含"多维度深度分析"', () => {
    renderAnalysis();
    expect(screen.getByText(/多维度深度分析/)).toBeInTheDocument();
  });

  it('AC-2 · 初始字符计数显示 "0 字"', () => {
    renderAnalysis();
    expect(screen.getByTestId('char-count')).toHaveTextContent('0 字');
  });

  it('AC-2 · 输入后字符计数更新', () => {
    renderAnalysis();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '测试文案内容' } });
    expect(screen.getByTestId('char-count')).toHaveTextContent('6 字');
  });

  it('AC-3 · CTA "开始分析" 初始 disabled (text < 10 字)', () => {
    renderAnalysis();
    expect(screen.getByRole('button', { name: '开始分析' })).toBeDisabled();
  });

  it('AC-3 · text ≥ 10 字 → CTA enabled', () => {
    renderAnalysis();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '这是一段超过十个字的短视频文案测试内容' } });
    expect(screen.getByRole('button', { name: '开始分析' })).not.toBeDisabled();
  });

  it('AC-4 · onSuccess → 5 H3 区块渲染', () => {
    renderAnalysis();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_STRUCTURAL_ROW);
    });

    expect(screen.getByRole('heading', { level: 3, name: '结构拆解' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '节奏分析' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '爆款元素识别' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '多维评分' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '优化建议' })).toBeInTheDocument();
  });

  it('AC-4 · structural output 真实数据渲染', () => {
    renderAnalysis();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_STRUCTURAL_ROW);
    });

    expect(screen.getByTestId('structural-overall')).toHaveTextContent('66');
    expect(screen.getByTestId('structural-optimizations')).toBeInTheDocument();
    expect(screen.getByTestId('structural-rewrite-snippet')).toBeInTheDocument();
    expect(screen.getByTestId('structural-scores')).toBeInTheDocument();
  });

  it('AC-5 · isFallback=true → 显示 fallback banner + retry button', () => {
    renderAnalysis();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_FALLBACK_STRUCTURAL_ROW);
    });

    expect(screen.getByTestId('analysis-fallback-banner')).toBeInTheDocument();
    expect(screen.getByText(/AI 暂未生成深度分析 · 显示规则评分/)).toBeInTheDocument();
    expect(screen.getByTestId('analysis-retry')).toBeInTheDocument();
  });

  it('AC-5 · isFallback=false → 不显示 fallback banner', () => {
    renderAnalysis();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_STRUCTURAL_ROW);
    });

    expect(screen.queryByTestId('analysis-fallback-banner')).not.toBeInTheDocument();
  });

  it('AC-4 · 一键仿写 button 存在于结果区块', () => {
    renderAnalysis();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_STRUCTURAL_ROW);
    });

    expect(screen.getByTestId('analysis-imitate')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-imitate')).toHaveTextContent('一键仿写');
  });
});
