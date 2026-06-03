/**
 * PresentStyles.test.tsx — 阶段2 接真 trpc.presentStyles.recommend
 * mock trpc · 断言:
 *   - h1/subtitle 字面锁 + 14 form 卡保留
 *   - 无真结果时:显示空态(ps-empty-state)、不显假推荐(门控)
 *   - 有真结果:映射 recommendedStyles → 渲染真推荐 + rationale
 *   - loading 态:显示 ps-loading-banner + CTA disabled
 *   - error 态:显示 ps-error-notice + 重试
 *   - isFallback=true:显示 ps-fallback-notice
 *   - text < 10 字前端校验:不穿透 mutate + 显示 ps-text-error
 *   - CTA 调 recommend({text, platform})
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PRESENT_STYLES,
  PS_CTA,
  PS_DEFAULT_PLATFORM,
  PS_RESULT_TITLE,
} from '@/lib/constants/present-styles';
import PresentStyles from '@/pages/tools/PresentStyles';

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

// ── Mutable store: tests set state here before renderPage() ──────────────────
const _store: {
  isPending: boolean;
  isError: boolean;
  data: unknown;
  mutate: ReturnType<typeof vi.fn>;
} = {
  isPending: false,
  isError: false,
  data: undefined,
  mutate: vi.fn(),
};

// ── trpc mock ─────────────────────────────────────────────────────────────────
vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: { me: { useQuery: () => ({ data: null, isLoading: false }) } },
    ipAccounts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    presentStyles: {
      recommend: {
        useMutation: ({ onSuccess, onError }: {
          onSuccess?: () => void;
          onError?: (err: { message: string }) => void;
        } = {}) => ({
          mutate: (...args: unknown[]) => {
            _store.mutate(...args);
            if (!_store.isError) onSuccess?.();
            else onError?.({ message: 'recommend error' });
          },
          isPending: _store.isPending,
          isError: _store.isError,
          data: _store.data,
        }),
      },
    },
  },
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: null,
    isLoading: false,
    isSwitching: false,
    switchTo: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refetch: vi.fn(),
  }),
}));

// ── 真结果 fixture(不同于 fallback template · 用于断言 LLM 结果渲染) ──────────
const REAL_STYLES = [
  {
    id: 'vlog',
    label: 'Vlog',
    description: '日常记录/体验分享，适合人设打造',
    tips: '真实感最重要，不要过度修饰',
    matchScore: 92,
    rationale: '你的健身100天经历非常适合 Vlog 形式，过程记录感染力强。',
  },
  {
    id: 'before_after',
    label: '前后对比',
    description: '变化前后对比，适合美妆/装修/健身等',
    tips: '对比要在同一条件下，差异要明显',
    matchScore: 88,
    rationale: '健身前后变化视觉冲击力强，非常适合前后对比形式。',
  },
  {
    id: 'talking_head',
    label: '口播',
    description: '真人出镜直接讲述，适合知识分享和观点输出',
    tips: '注意表情管理和语速控制，前 3 秒表情要夸张',
    matchScore: 78,
    rationale: '口播形式适合分享心路历程，代入感强。',
  },
];

function makeResultRow(isFallback: boolean) {
  return {
    id: 99,
    content: JSON.stringify({ recommendedStyles: REAL_STYLES }),
    agentId: 'PresentationAgent',
    agentMode: 'recommend',
    traceId: 'trace-ps-001',
    isFallback,
    tokensUsed: 800,
    modelUsed: 'claude-3-5-sonnet',
    durationMs: 6000,
    createdAt: new Date(),
  };
}

// ── render helper ─────────────────────────────────────────────────────────────
function renderPage() {
  return render(
    <MemoryRouter>
      <PresentStyles />
    </MemoryRouter>,
  );
}

// ── reset store before each test ──────────────────────────────────────────────
beforeEach(() => {
  _store.isPending = false;
  _store.isError = false;
  _store.data = undefined;
  _store.mutate = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── 字面锁 ────────────────────────────────────────────────────────────────────
describe('PresentStyles — 字面锁 + 常量', () => {
  it('h1 字面锁 "爆款呈现形式合集"', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款呈现形式合集');
  });

  it('subtitle 字面锁', () => {
    renderPage();
    expect(screen.getByText('掌握各种爆款视频的呈现形式，找到最适合你的内容表达方式')).toBeInTheDocument();
  });

  it('form section title "内容推荐参数" 可见', () => {
    renderPage();
    expect(screen.getByText('内容推荐参数')).toBeInTheDocument();
  });

  it('CTA 按钮 PS_CTA 文案可见', () => {
    renderPage();
    expect(screen.getByTestId('ps-recommend-btn')).toBeInTheDocument();
    expect(screen.getByTestId('ps-recommend-btn')).toHaveTextContent(PS_CTA);
  });

  it('CTA 按钮默认不 disabled', () => {
    renderPage();
    expect(screen.getByTestId('ps-recommend-btn')).not.toBeDisabled();
  });

  it('文案 textarea 有默认值', () => {
    renderPage();
    const textarea = screen.getByTestId<HTMLTextAreaElement>('ps-text-input');
    expect(textarea.value.length).toBeGreaterThan(0);
  });

  it('平台 select 默认值为 PS_DEFAULT_PLATFORM', () => {
    renderPage();
    const select = screen.getByTestId<HTMLSelectElement>('ps-platform-select');
    expect(select.value).toBe(PS_DEFAULT_PLATFORM);
  });
});

// ── 14 静态形式卡保留(字面不变) ──────────────────────────────────────────────
describe('PresentStyles — 14 静态形式卡', () => {
  it('renders 14 style cards in order', () => {
    renderPage();
    PRESENT_STYLES.forEach((s) => {
      const card = screen.getByTestId(`style-card-${s.id}`);
      expect(within(card).getByText(s.label)).toBeInTheDocument();
      expect(within(card).getByText(s.description)).toBeInTheDocument();
    });
  });

  it('renders 14 场景行 适用场景：通用', () => {
    renderPage();
    const scenes = screen.getAllByText(/适用场景：通用/);
    expect(scenes).toHaveLength(14);
  });
});

// ── idle 态 · 无真结果 · 空态门控 ─────────────────────────────────────────────
describe('PresentStyles — 无真结果(idle) · 空态门控', () => {
  it('显示 ps-empty-state 占位', () => {
    renderPage();
    expect(screen.getByTestId('ps-empty-state')).toBeInTheDocument();
  });

  it('result title 在空态区可见', () => {
    renderPage();
    const emptyState = screen.getByTestId('ps-empty-state');
    expect(within(emptyState).getByText(PS_RESULT_TITLE)).toBeInTheDocument();
    // ps-result-panel 不在 DOM(空态门控)
    expect(screen.queryByTestId('ps-result-panel')).not.toBeInTheDocument();
  });

  it('idle 态:不显示 fallback / error / loading banner', () => {
    renderPage();
    expect(screen.queryByTestId('ps-fallback-notice')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ps-error-notice')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ps-loading-banner')).not.toBeInTheDocument();
  });

  it('idle 态:不显示真结果面板 ps-result-panel', () => {
    renderPage();
    expect(screen.queryByTestId('ps-result-panel')).not.toBeInTheDocument();
  });

  it('idle 态:不显示 ps-recommended-styles', () => {
    renderPage();
    expect(screen.queryByTestId('ps-recommended-styles')).not.toBeInTheDocument();
  });
});

// ── loading 态 ────────────────────────────────────────────────────────────────
describe('PresentStyles — loading 态', () => {
  it('isPending=true: 显示 ps-loading-banner', () => {
    _store.isPending = true;
    renderPage();
    expect(screen.getByTestId('ps-loading-banner')).toBeInTheDocument();
  });

  it('isPending=true: CTA disabled', () => {
    _store.isPending = true;
    renderPage();
    expect(screen.getByTestId('ps-recommend-btn')).toBeDisabled();
  });

  it('isPending=true: 不显示 error notice', () => {
    _store.isPending = true;
    renderPage();
    expect(screen.queryByTestId('ps-error-notice')).not.toBeInTheDocument();
  });
});

// ── error 态 ──────────────────────────────────────────────────────────────────
describe('PresentStyles — error 态', () => {
  it('isError=true: 显示 ps-error-notice', () => {
    _store.isError = true;
    renderPage();
    expect(screen.getByTestId('ps-error-notice')).toBeInTheDocument();
  });

  it('isError=true: 不显示 loading banner', () => {
    _store.isError = true;
    renderPage();
    expect(screen.queryByTestId('ps-loading-banner')).not.toBeInTheDocument();
  });

  it('isError=true: 重试按钮存在且触发 mutate', () => {
    _store.isError = true;
    renderPage();
    const retryBtn = screen.getByRole('button', { name: '重试' });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(_store.mutate).toHaveBeenCalledTimes(1);
    const arg = (_store.mutate.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(arg).toHaveProperty('text');
    expect(arg).toHaveProperty('platform');
  });
});

// ── text < 10 字前端校验 ─────────────────────────────────────────────────────
describe('PresentStyles — text < 10 字前端校验', () => {
  it('text 为空时: CTA disabled · 不调 mutate', () => {
    renderPage();
    const textarea = screen.getByTestId('ps-text-input');
    fireEvent.change(textarea, { target: { value: '' } });
    // P2.5: button is disabled when text < PS_TEXT_MIN, blocking click entirely
    expect(screen.getByTestId('ps-recommend-btn')).toBeDisabled();
    expect(_store.mutate).not.toHaveBeenCalled();
  });

  it('text 为 5 字时: CTA disabled · 不调 mutate', () => {
    renderPage();
    const textarea = screen.getByTestId('ps-text-input');
    fireEvent.change(textarea, { target: { value: '五个字！！' } });
    // P2.5: button is disabled when text < PS_TEXT_MIN
    expect(screen.getByTestId('ps-recommend-btn')).toBeDisabled();
    expect(_store.mutate).not.toHaveBeenCalled();
  });

  it('text ≥ 10 字时: 无 ps-text-error · 调 mutate', () => {
    renderPage();
    const textarea = screen.getByTestId('ps-text-input');
    fireEvent.change(textarea, { target: { value: '这是超过十个字的文案内容示例！' } });
    fireEvent.click(screen.getByTestId('ps-recommend-btn'));
    expect(screen.queryByTestId('ps-text-error')).not.toBeInTheDocument();
    expect(_store.mutate).toHaveBeenCalledTimes(1);
  });

  it('text 恰好 10 字时: 允许通过', () => {
    renderPage();
    const textarea = screen.getByTestId('ps-text-input');
    fireEvent.change(textarea, { target: { value: '1234567890' } });
    fireEvent.click(screen.getByTestId('ps-recommend-btn'));
    expect(screen.queryByTestId('ps-text-error')).not.toBeInTheDocument();
    expect(_store.mutate).toHaveBeenCalledTimes(1);
  });
});

// ── CTA 调 recommend mutation · {text, platform} ───────────────────────────
describe('PresentStyles — CTA 调 recommend mutation', () => {
  it('点击 CTA 时调用 recommendMutation.mutate({ text, platform })', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('ps-recommend-btn'));
    expect(_store.mutate).toHaveBeenCalledTimes(1);
    expect(_store.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.any(String),
        platform: expect.any(String),
      }),
    );
  });

  it('mutate 中 platform 字段 = PS_DEFAULT_PLATFORM', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('ps-recommend-btn'));
    const arg = (_store.mutate.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(arg.platform).toBe(PS_DEFAULT_PLATFORM);
  });

  it('修改平台 → mutate 使用新平台', () => {
    renderPage();
    const select = screen.getByTestId('ps-platform-select');
    fireEvent.change(select, { target: { value: '小红书' } });
    fireEvent.click(screen.getByTestId('ps-recommend-btn'));
    const arg = (_store.mutate.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(arg.platform).toBe('小红书');
  });
});

// ── 有真结果 · 门控渲染真数据 ────────────────────────────────────────────────
describe('PresentStyles — 有真结果(门控)', () => {
  beforeEach(() => {
    _store.data = makeResultRow(false);
  });

  it('显示 ps-result-panel', () => {
    renderPage();
    expect(screen.getByTestId('ps-result-panel')).toBeInTheDocument();
  });

  it('不显示 ps-empty-state', () => {
    renderPage();
    expect(screen.queryByTestId('ps-empty-state')).not.toBeInTheDocument();
  });

  it('结果标题 PS_RESULT_TITLE 可见', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 2, name: PS_RESULT_TITLE })).toBeInTheDocument();
  });

  it('ps-recommended-styles 列表可见', () => {
    renderPage();
    expect(screen.getByTestId('ps-recommended-styles')).toBeInTheDocument();
  });

  it('真推荐 vlog 条目可见(ps-recommended-item-vlog)', () => {
    renderPage();
    expect(screen.getByTestId('ps-recommended-item-vlog')).toBeInTheDocument();
  });

  it('真推荐 before_after 条目可见', () => {
    renderPage();
    expect(screen.getByTestId('ps-recommended-item-before_after')).toBeInTheDocument();
  });

  it('真推荐 talking_head 条目可见', () => {
    renderPage();
    expect(screen.getByTestId('ps-recommended-item-talking_head')).toBeInTheDocument();
  });

  it('真推荐理由 vlog rationale 渲染', () => {
    renderPage();
    const rationaleEl = screen.getByTestId('ps-rationale-vlog');
    expect(rationaleEl).toBeInTheDocument();
    expect(rationaleEl).toHaveTextContent(REAL_STYLES[0]!.rationale);
  });

  it('真推荐理由 before_after rationale 渲染', () => {
    renderPage();
    const rationaleEl = screen.getByTestId('ps-rationale-before_after');
    expect(rationaleEl).toHaveTextContent(REAL_STYLES[1]!.rationale);
  });

  it('matchScore 徽章: vlog = 92', () => {
    renderPage();
    const badge = screen.getByTestId('ps-match-score-vlog');
    expect(badge).toHaveTextContent('92');
  });

  it('matchScore 徽章: before_after = 88', () => {
    renderPage();
    const badge = screen.getByTestId('ps-match-score-before_after');
    expect(badge).toHaveTextContent('88');
  });

  it('有真结果(isFallback=false): 无 ps-fallback-notice', () => {
    renderPage();
    expect(screen.queryByTestId('ps-fallback-notice')).not.toBeInTheDocument();
  });

  it('反馈 prompt "这个推荐对你有帮助吗？" 可见', () => {
    renderPage();
    expect(screen.getByText('这个推荐对你有帮助吗？')).toBeInTheDocument();
  });
});

// ── isFallback 降级提示 ───────────────────────────────────────────────────────
describe('PresentStyles — isFallback 降级提示', () => {
  it('isFallback=true 显示 ps-fallback-notice', () => {
    _store.data = makeResultRow(true);
    renderPage();
    expect(screen.getByTestId('ps-fallback-notice')).toBeInTheDocument();
  });

  it('isFallback=false 不显示 ps-fallback-notice', () => {
    _store.data = makeResultRow(false);
    renderPage();
    expect(screen.queryByTestId('ps-fallback-notice')).not.toBeInTheDocument();
  });
});

// ── malformed JSON content 鲁棒性 ────────────────────────────────────────────
describe('PresentStyles — malformed JSON content', () => {
  it('content 不是合法 JSON → hasResult=false，不崩溃', () => {
    _store.data = {
      ...makeResultRow(false),
      content: '{not valid json!!!',
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('ps-result-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('ps-empty-state')).toBeInTheDocument();
  });

  it('content 合法 JSON 但缺 recommendedStyles → hasResult=false', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({ other: 'field' }),
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('ps-result-panel')).not.toBeInTheDocument();
  });

  it('content 合法 JSON 但 recommendedStyles 非 array → hasResult=false', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({ recommendedStyles: 'not-array' }),
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('ps-result-panel')).not.toBeInTheDocument();
  });

  it('content 合法 JSON 但 recommendedStyles 为空数组 → hasResult=false', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({ recommendedStyles: [] }),
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('ps-result-panel')).not.toBeInTheDocument();
  });

  it('item 缺 matchScore(非 number) → hasResult=false', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({
        recommendedStyles: [{ id: 'vlog', label: 'Vlog', description: 'd', tips: 't', matchScore: 'bad', rationale: 'r' }],
      }),
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('ps-result-panel')).not.toBeInTheDocument();
  });
});

// ── 负向: 无真结果时不渲染真推荐 ────────────────────────────────────────────
describe('PresentStyles — idle 不显示真推荐(负向)', () => {
  it('无真结果时不渲染 ps-result-panel', () => {
    renderPage();
    expect(screen.queryByTestId('ps-result-panel')).not.toBeInTheDocument();
  });

  it('无真结果时不渲染 ps-recommended-styles', () => {
    renderPage();
    expect(screen.queryByTestId('ps-recommended-styles')).not.toBeInTheDocument();
  });

  it('无真结果时不渲染任何 ps-recommended-item-*', () => {
    renderPage();
    REAL_STYLES.forEach((s) => {
      expect(screen.queryByTestId(`ps-recommended-item-${s.id}`)).not.toBeInTheDocument();
    });
  });
});

// ── P1.1: 全部参考目录 section header ────────────────────────────────────────
describe('PresentStyles — 全部参考目录 section header', () => {
  it('ps-catalog-header 可见', () => {
    renderPage();
    expect(screen.getByTestId('ps-catalog-header')).toBeInTheDocument();
  });

  it('section title 文案 "全部呈现形式 · 参考目录" 可见', () => {
    renderPage();
    expect(screen.getByTestId('ps-catalog-title')).toHaveTextContent('全部呈现形式 · 参考目录');
  });

  it('section 说明包含 AI 推荐提示', () => {
    renderPage();
    expect(screen.getByTestId('ps-catalog-header')).toHaveTextContent('AI 已从中为你个性化推荐');
  });
});

// ── P2.4: matchScore 徽章带 % ────────────────────────────────────────────────
describe('PresentStyles — matchScore 徽章单位', () => {
  beforeEach(() => {
    _store.data = makeResultRow(false);
  });

  it('matchScore 徽章 vlog 显示 92%', () => {
    renderPage();
    expect(screen.getByTestId('ps-match-score-vlog')).toHaveTextContent('92%');
  });

  it('matchScore 徽章 before_after 显示 88%', () => {
    renderPage();
    expect(screen.getByTestId('ps-match-score-before_after')).toHaveTextContent('88%');
  });
});

// ── P2.5: CTA disabled when text < PS_TEXT_MIN ───────────────────────────────
describe('PresentStyles — CTA disabled when text < PS_TEXT_MIN', () => {
  it('text 清空后 CTA 变 disabled', () => {
    renderPage();
    const textarea = screen.getByTestId('ps-text-input');
    fireEvent.change(textarea, { target: { value: '' } });
    expect(screen.getByTestId('ps-recommend-btn')).toBeDisabled();
  });

  it('text < 10 字时 CTA disabled', () => {
    renderPage();
    const textarea = screen.getByTestId('ps-text-input');
    fireEvent.change(textarea, { target: { value: '五个字！！' } });
    expect(screen.getByTestId('ps-recommend-btn')).toBeDisabled();
  });

  it('text ≥ 10 字时 CTA 不 disabled (非 pending)', () => {
    renderPage();
    const textarea = screen.getByTestId('ps-text-input');
    fireEvent.change(textarea, { target: { value: '这是超过十个字的文案内容' } });
    expect(screen.getByTestId('ps-recommend-btn')).not.toBeDisabled();
  });
});

// ── P1.2: parseContent 过滤无效 id ───────────────────────────────────────────
describe('PresentStyles — parseContent 过滤非法 id', () => {
  it('全部 id 非法 → hasResult=false', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({
        recommendedStyles: [
          { id: 'unknown_style', label: 'X', description: 'd', tips: 't', matchScore: 80, rationale: 'r' },
          { id: 'another_bad_id', label: 'Y', description: 'd', tips: 't', matchScore: 70, rationale: 'r' },
        ],
      }),
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('ps-result-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('ps-empty-state')).toBeInTheDocument();
  });

  it('混合 id(部分合法) → 只渲染合法条目', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({
        recommendedStyles: [
          { id: 'vlog', label: 'Vlog', description: 'd', tips: 't', matchScore: 90, rationale: 'r' },
          { id: 'bad_id', label: 'Bad', description: 'd', tips: 't', matchScore: 50, rationale: 'r' },
          { id: 'talking_head', label: '口播', description: 'd', tips: 't', matchScore: 80, rationale: 'r' },
        ],
      }),
    };
    renderPage();
    expect(screen.getByTestId('ps-result-panel')).toBeInTheDocument();
    expect(screen.getByTestId('ps-recommended-item-vlog')).toBeInTheDocument();
    expect(screen.getByTestId('ps-recommended-item-talking_head')).toBeInTheDocument();
    expect(screen.queryByTestId('ps-recommended-item-bad_id')).not.toBeInTheDocument();
  });
});
