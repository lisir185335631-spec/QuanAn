/**
 * PRD-25 US-005 · VideoAnalysis unit tests
 * AC-8: ≥ 5 tests · mock trpc · 验证 H3 渲染真数据 + isFallback hint + retry button
 * SHIELD: mock useMutation 返回 viral output · 验证 5 H3 真数据 (ANTI_PATTERN: 不能 stub OUTPUT_SECTIONS)
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import VideoAnalysis from '@/pages/tools/VideoAnalysis';

// ── Mock control (vi.hoisted runs before vi.mock) ─────────────────────────────

const mockCtrl = vi.hoisted(() => ({
  onSuccess: undefined as ((data: unknown) => void) | undefined,
  onError: undefined as ((error: unknown) => void) | undefined,
  isPending: false,
}));

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_VIRAL_ROW = vi.hoisted(() => ({
  id: 1,
  content: JSON.stringify({
    analysis: {
      elements: ['curiosity', 'contrast'],
      structure: '钩子→痛点→案例→CTA',
      hookType: '悬念开场',
      viralFormula: '好奇心+反差=爆款公式',
    },
    insights: [
      { element: 'curiosity', explanation: '制造信息缺口，驱动点击', impact: '高' },
      { element: 'contrast', explanation: '反差感强化情绪共鸣', impact: '高' },
      { element: 'resonance', explanation: '引发用户强烈认同感', impact: '中' },
    ],
    rewriteVersion:
      '这是一段基于爆款元素心理学重写的仿写版文案，融入了钩子、情绪共鸣和行动引导三个核心要素，文字超过五十字，用于测试。',
  }),
  isFallback: false,
  agentId: 'AnalysisAgent',
  agentMode: 'viral',
  contentType: 'json',
  scriptType: null,
  elements: ['curiosity'],
  tokensUsed: 100,
  modelUsed: 'claude-3-5-haiku',
  durationMs: 3000,
  traceId: null,
  createdAt: new Date(),
}));

const MOCK_FALLBACK_ROW = vi.hoisted(() => ({
  id: 2,
  content: JSON.stringify({
    analysis: { elements: ['curiosity'], structure: '钩子→CTA', hookType: '规则备用', viralFormula: '规则公式' },
    insights: [
      { element: 'curiosity', explanation: '信息缺口（系统备用）', impact: '高' },
      { element: 'contrast', explanation: '反差（系统备用）', impact: '高' },
      { element: 'resonance', explanation: '共鸣（系统备用）', impact: '中' },
    ],
    rewriteVersion: '系统备用模板：这是基于爆款元素心理学重写的仿写版文案，包含核心要素，超过五十字。',
  }),
  isFallback: true,
  agentId: 'AnalysisAgent',
  agentMode: 'viral',
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
    videoAnalysis: {
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

function renderVideoAnalysis() {
  return render(
    <MemoryRouter>
      <VideoAnalysis />
    </MemoryRouter>,
  );
}

function fillAndSubmit(copy = '这是一段超过十个字的视频文案内容测试') {
  const textarea = screen.getByPlaceholderText(/至少 10 个字/);
  fireEvent.change(textarea, { target: { value: copy } });
  fireEvent.click(screen.getByRole('button', { name: /开始深度解析/ }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VideoAnalysis', () => {
  beforeEach(() => {
    mockCtrl.isPending = false;
    mockCtrl.onSuccess = undefined;
    mockCtrl.onError = undefined;
  });

  it('AC-1 · H1 字面锁 "爆款文案解析"', () => {
    renderVideoAnalysis();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款文案解析');
  });

  it('AC-1 · 副标题包含 "AI 将深度拆解爆款密码，支持一键仿写"', () => {
    renderVideoAnalysis();
    expect(screen.getByText(/AI 将深度拆解爆款密码，支持一键仿写/)).toBeInTheDocument();
  });

  it('AC-4 · CTA "开始深度解析" 初始 disabled (copy < 10 字)', () => {
    renderVideoAnalysis();
    expect(screen.getByRole('button', { name: '开始深度解析' })).toBeDisabled();
  });

  it('AC-4 · copy ≥ 10 字 → CTA enabled', () => {
    renderVideoAnalysis();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '这是一段超过十个字的视频文案内容测试' } });
    expect(screen.getByRole('button', { name: '开始深度解析' })).not.toBeDisabled();
  });

  it('AC-2 · onSuccess → 5 H3 区块渲染真数据', () => {
    renderVideoAnalysis();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_VIRAL_ROW);
    });

    expect(screen.getByRole('heading', { level: 3, name: '结构拆解' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '节奏分析' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '爆款元素识别' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '多维评分' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '优化建议' })).toBeInTheDocument();
  });

  it('AC-2 · viral output 真实数据内容渲染', () => {
    renderVideoAnalysis();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_VIRAL_ROW);
    });

    expect(screen.getByTestId('viral-structure')).toHaveTextContent('钩子→痛点→案例→CTA');
    expect(screen.getByTestId('viral-hook-type')).toHaveTextContent('悬念开场');
    expect(screen.getByTestId('viral-elements')).toBeInTheDocument();
    expect(screen.getByTestId('viral-insights')).toBeInTheDocument();
  });

  it('AC-5 · isFallback=true → 显示 fallback banner + retry button', () => {
    renderVideoAnalysis();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_FALLBACK_ROW);
    });

    expect(screen.getByTestId('video-analysis-fallback-banner')).toBeInTheDocument();
    expect(screen.getByText(/AI 暂未生成深度分析 · 显示规则评分/)).toBeInTheDocument();
    expect(screen.getByTestId('video-analysis-retry')).toBeInTheDocument();
  });

  it('AC-5 · isFallback=false → 不显示 fallback banner', () => {
    renderVideoAnalysis();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_VIRAL_ROW);
    });

    expect(screen.queryByTestId('video-analysis-fallback-banner')).not.toBeInTheDocument();
  });

  it('AC-3 · 一键仿写 button 在结果区块中存在', () => {
    renderVideoAnalysis();
    fillAndSubmit();

    act(() => {
      mockCtrl.onSuccess?.(MOCK_VIRAL_ROW);
    });

    expect(screen.getByTestId('video-analysis-imitate')).toBeInTheDocument();
    expect(screen.getByTestId('video-analysis-imitate')).toHaveTextContent('一键仿写');
  });
});
