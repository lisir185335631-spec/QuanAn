/**
 * PRD-27 US-004 · DeepLearning unit tests (AC-9)
 * AC-9: ≥ 3 tests · mock deepLearningAgent.execute + BullMQ enqueue + query polling
 * vi.hoisted 模式 + MemoryRouter wrap
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import DeepLearning from '@/pages/tools/DeepLearning';

// ── Mock control (vi.hoisted runs before vi.mock) ─────────────────────────────

const mockCtrl = vi.hoisted(() => ({
  learnOnSuccess: undefined as ((data: unknown) => void) | undefined,
  learnOnError: undefined as ((error: unknown) => void) | undefined,
  learnIsPending: false,
  // learnStatus query state
  statusQueryData: undefined as
    | {
        status: 'queued' | 'processing' | 'completed' | 'failed';
        result: Record<string, unknown> | null;
      }
    | undefined,
  jobId: null as string | null,
}));

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_COMPLETED_RESULT = vi.hoisted(() => ({
  summary: '这批文案具有强烈的情感共鸣特征，整体语气轻松温暖，结构紧凑。',
  dimensions: {
    tone: '语气亲切自然，带有轻微幽默感，避免说教性语言。',
    structure: '起承转合清晰，开头悬念，中段展开，结尾号召行动。',
    hook: '前三句必有痛点或疑问句，快速抓住读者注意力。',
    transition: '用"但是""然而""所以"等连词自然转折，逻辑流畅。',
    closing: '结尾通常是行动号召或开放性问题，引发互动。',
  },
  isFallback: false,
  tokensUsed: 800,
  modelUsed: 'claude-opus-4-7',
  durationMs: 12000,
}));

const MOCK_FALLBACK_RESULT = vi.hoisted(() => ({
  summary: '系统繁忙，暂时无法完成文案深度分析。建议稍后重试。',
  dimensions: {
    tone: '暂无分析结果',
    structure: '暂无分析结果',
    hook: '暂无分析结果',
    transition: '暂无分析结果',
    closing: '暂无分析结果',
  },
  isFallback: true,
  tokensUsed: 0,
  modelUsed: 'fallback',
  durationMs: 0,
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({ account: null, isLoading: false }),
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    deepLearning: {
      learn: {
        useMutation: (opts?: {
          onSuccess?: (data: unknown) => void;
          onError?: (error: unknown) => void;
        }) => {
          mockCtrl.learnOnSuccess = opts?.onSuccess;
          mockCtrl.learnOnError = opts?.onError;
          return {
            mutate: vi.fn((input: unknown) => {
              void input;
            }),
            isPending: mockCtrl.learnIsPending,
            isError: false,
          };
        },
      },
      learnStatus: {
        useQuery: (_input: unknown, _opts?: unknown) => {
          return {
            data: mockCtrl.statusQueryData,
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

function renderDeepLearning() {
  return render(
    <MemoryRouter>
      <DeepLearning />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DeepLearning', () => {
  beforeEach(() => {
    mockCtrl.learnIsPending = false;
    mockCtrl.learnOnSuccess = undefined;
    mockCtrl.learnOnError = undefined;
    mockCtrl.statusQueryData = undefined;
    mockCtrl.jobId = null;
  });

  it('AC-9 · H1 字面锁 "文案深度学习"', () => {
    renderDeepLearning();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('文案深度学习');
  });

  it('AC-9 · 添加样本后显示 samples list', () => {
    renderDeepLearning();
    const textInput = screen.getByTestId('text-input');
    const sourceInput = screen.getByTestId('source-input');
    const addBtn = screen.getByTestId('add-sample-btn');

    fireEvent.change(textInput, { target: { value: '这是一篇超过十字的优秀文案内容样本，包含足够多的文字。' } });
    fireEvent.change(sourceInput, { target: { value: '小红书爆文 #1' } });
    fireEvent.click(addBtn);

    expect(screen.getByTestId('samples-list')).toBeInTheDocument();
    expect(screen.getByTestId('sample-item-0')).toBeInTheDocument();
  });

  it('AC-9 · learn mutation onSuccess → jobId 设置 → processing spinner 显示', () => {
    mockCtrl.statusQueryData = { status: 'processing', result: null };
    renderDeepLearning();

    act(() => {
      mockCtrl.learnOnSuccess?.({ jobId: 'test-job-123', status: 'queued' });
    });

    // After job queued, status section should eventually appear (query returns processing)
    // The start button should be in processing state
    const startBtn = screen.getByTestId('start-learning-btn');
    expect(startBtn).toBeDisabled();
  });

  it('AC-9 · learnStatus completed → 渲染 result.summary + 5 维度', () => {
    mockCtrl.statusQueryData = {
      status: 'completed',
      result: MOCK_COMPLETED_RESULT as unknown as Record<string, unknown>,
    };

    renderDeepLearning();

    act(() => {
      mockCtrl.learnOnSuccess?.({ jobId: 'test-job-456', status: 'queued' });
    });

    expect(screen.getByTestId('deep-learn-result')).toBeInTheDocument();
    expect(screen.getByTestId('result-summary')).toHaveTextContent(MOCK_COMPLETED_RESULT.summary);
    expect(screen.getByTestId('result-dimension-tone')).toHaveTextContent(MOCK_COMPLETED_RESULT.dimensions.tone);
    expect(screen.getByTestId('result-dimension-structure')).toBeInTheDocument();
    expect(screen.getByTestId('result-dimension-hook')).toBeInTheDocument();
    expect(screen.getByTestId('result-dimension-transition')).toBeInTheDocument();
    expect(screen.getByTestId('result-dimension-closing')).toBeInTheDocument();
  });

  it('AC-9 · isFallback=true → 显示 fallback banner', () => {
    mockCtrl.statusQueryData = {
      status: 'completed',
      result: MOCK_FALLBACK_RESULT as unknown as Record<string, unknown>,
    };

    renderDeepLearning();

    act(() => {
      mockCtrl.learnOnSuccess?.({ jobId: 'test-job-789', status: 'queued' });
    });

    expect(screen.getByTestId('fallback-banner')).toBeInTheDocument();
  });

  it('AC-9 · learnStatus failed → 显示错误信息', () => {
    mockCtrl.statusQueryData = { status: 'failed', result: null };

    renderDeepLearning();

    act(() => {
      mockCtrl.learnOnSuccess?.({ jobId: 'test-job-fail', status: 'queued' });
    });

    expect(screen.getByText(/分析失败/)).toBeInTheDocument();
  });
});
