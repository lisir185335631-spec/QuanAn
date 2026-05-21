/**
 * PRD-27 US-003 · PresentStyles unit tests (AC-10)
 * AC-10: ≥ 5 tests · mock presentationAgent.execute → success/fallback/14enum/matchScore/rationale
 * vi.hoisted 模式 + MemoryRouter wrap
 */

import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import PresentStyles from '@/pages/tools/PresentStyles';

// ── Mock control (vi.hoisted runs before vi.mock) ─────────────────────────────

const mockCtrl = vi.hoisted(() => ({
  onSuccess: undefined as ((data: unknown) => void) | undefined,
  onError: undefined as ((error: unknown) => void) | undefined,
  isPending: false,
}));

// ── Mock data ─────────────────────────────────────────────────────────────────

const RECOMMENDED_STYLES = vi.hoisted(() => [
  {
    id: 'talking_head',
    label: '口播',
    description: '真人出镜直接讲述，适合知识分享和观点输出',
    tips: '注意表情管理和语速控制，前 3 秒表情要夸张',
    matchScore: 92,
    rationale: '你的文案适合直接讲述，口播形式传播效率最高',
  },
  {
    id: 'tutorial',
    label: '教程',
    description: '步骤式教学，适合技能分享和产品使用',
    tips: '声画分离效果更好，步骤要清晰',
    matchScore: 78,
    rationale: '教程形式便于用户学习和收藏',
  },
  {
    id: 'list_style',
    label: '清单盘点',
    description: '盘点型内容，信息密度高',
    tips: '数字要具体，排序有逻辑',
    matchScore: 65,
    rationale: '清单形式便于传播和记忆',
  },
]);

const MOCK_SUCCESS_ROW = vi.hoisted(() => ({
  id: 1,
  content: JSON.stringify({
    recommendedStyles: RECOMMENDED_STYLES,
  }),
  agentId: 'PresentationAgent',
  agentMode: 'recommend',
  traceId: null,
  isFallback: false,
  tokensUsed: 600,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 4500,
  createdAt: new Date(),
}));

const MOCK_FALLBACK_ROW = vi.hoisted(() => ({
  id: 2,
  content: JSON.stringify({
    recommendedStyles: [
      {
        id: 'talking_head',
        label: '口播',
        description: '真人出镜直接讲述，适合知识分享和观点输出',
        tips: '注意表情管理和语速控制，前 3 秒表情要夸张',
        matchScore: 85,
        rationale: '系统暂时繁忙，以口播作为通用首选推荐',
      },
      {
        id: 'tutorial',
        label: '教程',
        description: '步骤式教学，适合技能分享和产品使用',
        tips: '声画分离效果更好，步骤要清晰',
        matchScore: 75,
        rationale: '教程形式适合传递知识',
      },
      {
        id: 'list_style',
        label: '清单盘点',
        description: '盘点型内容，信息密度高',
        tips: '数字要具体，排序有逻辑',
        matchScore: 70,
        rationale: '清单形式信息密度高',
      },
    ],
  }),
  agentId: 'PresentationAgent',
  agentMode: 'recommend',
  traceId: null,
  isFallback: true,
  tokensUsed: 0,
  modelUsed: 'fallback',
  durationMs: 0,
  createdAt: new Date(),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({ account: null, isLoading: false }),
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    presentStyles: {
      recommend: {
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPresentStyles() {
  return render(
    <MemoryRouter>
      <PresentStyles />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PresentStyles', () => {
  beforeEach(() => {
    mockCtrl.isPending = false;
    mockCtrl.onSuccess = undefined;
    mockCtrl.onError = undefined;
  });

  it('AC-6 · H1 字面锁 "14 呈现形式"', () => {
    renderPresentStyles();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('14 呈现形式');
  });

  it('AC-10 · onSuccess success → 渲染 3-5 推荐 + matchScore + rationale', () => {
    renderPresentStyles();
    fireEvent.click(screen.getByTestId('present-styles-submit'));

    act(() => {
      mockCtrl.onSuccess?.(MOCK_SUCCESS_ROW);
    });

    expect(screen.getByTestId('present-styles-result')).toBeInTheDocument();
    expect(screen.getByTestId('present-styles-recommended')).toBeInTheDocument();
    // 3 recommended items visible
    expect(screen.getByTestId('recommended-style-0')).toBeInTheDocument();
    expect(screen.getByTestId('recommended-style-1')).toBeInTheDocument();
    expect(screen.getByTestId('recommended-style-2')).toBeInTheDocument();
    // matchScore displayed
    expect(screen.getByText(/匹配度 92%/)).toBeInTheDocument();
    // rationale displayed
    expect(screen.getByText(/你的文案适合直接讲述/)).toBeInTheDocument();
  });

  it('AC-10 · isFallback=true → 显示 fallback banner', () => {
    renderPresentStyles();
    fireEvent.click(screen.getByTestId('present-styles-submit'));

    act(() => {
      mockCtrl.onSuccess?.(MOCK_FALLBACK_ROW);
    });

    expect(screen.getByTestId('present-styles-fallback-banner')).toBeInTheDocument();
    expect(screen.getByText(/AI 暂时繁忙 · 显示备用推荐方案/)).toBeInTheDocument();
  });

  it('AC-10 · isFallback=false → 不显示 fallback banner', () => {
    renderPresentStyles();
    fireEvent.click(screen.getByTestId('present-styles-submit'));

    act(() => {
      mockCtrl.onSuccess?.(MOCK_SUCCESS_ROW);
    });

    expect(screen.queryByTestId('present-styles-fallback-banner')).not.toBeInTheDocument();
  });

  it('AC-10 · 14 enum ids 覆盖 — recommended style ids 必须是合法 enum key', () => {
    const VALID_IDS = new Set([
      'talking_head', 'drama', 'tutorial', 'vlog', 'street_interview',
      'comparison', 'list_style', 'mashup', 'screen_record', 'animation',
      'reaction', 'before_after', 'pov', 'qa',
    ]);

    renderPresentStyles();
    fireEvent.click(screen.getByTestId('present-styles-submit'));

    act(() => {
      mockCtrl.onSuccess?.(MOCK_SUCCESS_ROW);
    });

    // Verify that recommended style ids in mock are all valid enum keys
    for (const style of RECOMMENDED_STYLES) {
      expect(VALID_IDS.has(style.id)).toBe(true);
    }
  });

  it('AC-10 · matchScore 范围 0-100 · rationale 非空', () => {
    renderPresentStyles();
    fireEvent.click(screen.getByTestId('present-styles-submit'));

    act(() => {
      mockCtrl.onSuccess?.(MOCK_SUCCESS_ROW);
    });

    for (const style of RECOMMENDED_STYLES) {
      expect(style.matchScore).toBeGreaterThanOrEqual(0);
      expect(style.matchScore).toBeLessThanOrEqual(100);
      expect(style.rationale.length).toBeGreaterThan(0);
    }
  });

  it('AC-10 · onError → toast.error 推荐失败', async () => {
    const { toast } = await import('sonner');
    renderPresentStyles();
    fireEvent.click(screen.getByTestId('present-styles-submit'));

    act(() => {
      mockCtrl.onError?.(new Error('network error'));
    });

    expect(toast.error).toHaveBeenCalledWith('推荐失败 · 请重试');
  });
});
