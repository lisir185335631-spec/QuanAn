/**
 * Monetization.test.tsx — 阶段2 接真 trpc.monetization.generate
 * mock trpc · 断言:
 *   - h1/subtitle/CTA 字面锁 + 4 label + 4 default value
 *   - 无真结果时:显示空态(mn-empty-state)、不显假方案(门控)
 *   - 有真结果:映射 productMatrix/pricingStrategy/conversionFunnel → 渲染真数据
 *   - loading 态:显示 mn-loading-banner + CTA disabled
 *   - error 态:显示 mn-error-notice
 *   - isFallback=true:显示 mn-fallback-notice
 *   - CTA 调 generate 含 4 入参
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MONETIZATION_CTA,
  MONETIZATION_DEFAULT_AUDIENCE,
  MONETIZATION_DEFAULT_POSITIONING,
  MONETIZATION_DEFAULT_PRODUCT,
  MONETIZATION_FEEDBACK_PROMPT,
  MONETIZATION_FORM_TITLE,
  MONETIZATION_H1,
  MONETIZATION_LABEL_AUDIENCE,
  MONETIZATION_LABEL_INDUSTRY,
  MONETIZATION_LABEL_POSITIONING,
  MONETIZATION_LABEL_PRODUCT,
  MONETIZATION_RESULT_TITLE,
  MONETIZATION_SUBTITLE,
} from '@/lib/constants/monetization';
import Monetization from '@/pages/tools/Monetization';

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

// ── trpc mock — reads from _store on every useMutation() call ────────────────
vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: { me: { useQuery: () => ({ data: null, isLoading: false }) } },
    ipAccounts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    monetization: {
      generate: {
        useMutation: ({ onSuccess, onError }: {
          onSuccess?: () => void;
          onError?: (err: { message: string }) => void;
        } = {}) => ({
          mutate: (...args: unknown[]) => {
            _store.mutate(...args);
            if (!_store.isError) onSuccess?.();
            else onError?.({ message: 'generate error' });
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

// ── test MonetizationToolOutput result shape — distinct from fallback template ─
// (uses different products/funnel so tests verify real LLM results render, not fallback)
const REAL_PRODUCT_MATRIX = [
  '独家会员订阅（月度精选内容 · 39-99 元/月）',
  'B端企业培训包（团队授权 · 5000-20000 元/套）',
  '联名品牌广告（深度内容植入 · 协议定价）',
];
const REAL_PRICING_STRATEGY =
  '采用订阅制叠加项目制双轨策略：个人订阅 59 元/月作为流量入口 → 企业年包 15000 元锁定 B 端 → 联名广告按曝光量议价，三档并行分散收入风险。';
const REAL_CONVERSION_FUNNEL = [
  '免费试听课 · 吸引垂直领域目标用户',
  '限时折扣订阅 · 转化首单付费会员',
  '社群深度运营 · 提升留存与复购率',
  'B 端定向触达 · 推动企业培训采购',
  '老用户裂变激励 · 驱动口碑转介绍',
];

function makeResultRow(isFallback: boolean) {
  return {
    id: 42,
    content: JSON.stringify({
      productMatrix: REAL_PRODUCT_MATRIX,
      pricingStrategy: REAL_PRICING_STRATEGY,
      conversionFunnel: REAL_CONVERSION_FUNNEL,
    }),
    agentId: 'MonetizationAgent',
    agentMode: 'monetization-tool',
    traceId: 'trace-abc',
    isFallback,
    tokensUsed: 1200,
    modelUsed: 'claude-3-5-sonnet',
    durationMs: 8000,
    createdAt: new Date(),
  };
}

// ── render helper ─────────────────────────────────────────────────────────────
function renderPage() {
  return render(
    <MemoryRouter>
      <Monetization />
    </MemoryRouter>,
  );
}

// ── reset store to idle before each test ─────────────────────────────────────
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
describe('Monetization — 字面锁 + 常量', () => {
  it('h1 字面锁 "IP变现模型定制"', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(MONETIZATION_H1);
  });

  it('subtitle 字面锁', () => {
    renderPage();
    expect(screen.getByText(MONETIZATION_SUBTITLE)).toBeInTheDocument();
  });

  it('form card h2 "基本信息"', () => {
    renderPage();
    expect(screen.getByText(MONETIZATION_FORM_TITLE)).toBeInTheDocument();
  });

  it('4 个 label 字面锁', () => {
    renderPage();
    expect(screen.getByText(MONETIZATION_LABEL_INDUSTRY)).toBeInTheDocument();
    expect(screen.getByText((text) => text.startsWith(MONETIZATION_LABEL_PRODUCT))).toBeInTheDocument();
    expect(screen.getByText(MONETIZATION_LABEL_AUDIENCE)).toBeInTheDocument();
    expect(screen.getByText(MONETIZATION_LABEL_POSITIONING)).toBeInTheDocument();
  });

  it('4 个 default value prefilled', () => {
    renderPage();
    expect(screen.getByDisplayValue(MONETIZATION_DEFAULT_PRODUCT)).toBeInTheDocument();
    expect(screen.getByDisplayValue(MONETIZATION_DEFAULT_AUDIENCE)).toBeInTheDocument();
    expect(screen.getByDisplayValue(MONETIZATION_DEFAULT_POSITIONING)).toBeInTheDocument();
    expect(screen.getByText(/自媒体运营/)).toBeInTheDocument();
  });

  it('CTA 按钮 "生成变现模型" 可见', () => {
    renderPage();
    expect(screen.getByTestId('mn-generate-btn')).toBeInTheDocument();
    expect(screen.getByTestId('mn-generate-btn')).toHaveTextContent(MONETIZATION_CTA);
  });

  it('CTA 按钮默认不 disabled', () => {
    renderPage();
    expect(screen.getByTestId('mn-generate-btn')).not.toBeDisabled();
  });
});

// ── idle 态 · 无真结果 · 空态门控 ─────────────────────────────────────────────
describe('Monetization — 无真结果(idle) · 空态门控', () => {
  it('显示 mn-empty-state 占位', () => {
    renderPage();
    expect(screen.getByTestId('mn-empty-state')).toBeInTheDocument();
  });

  it('result title 在空态区可见', () => {
    renderPage();
    // empty state shows MONETIZATION_RESULT_TITLE
    expect(screen.getByText(MONETIZATION_RESULT_TITLE)).toBeInTheDocument();
  });

  it('idle 态:不显示 fallback / error / loading banner', () => {
    renderPage();
    expect(screen.queryByTestId('mn-fallback-notice')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mn-error-notice')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mn-loading-banner')).not.toBeInTheDocument();
  });

  it('idle 态:不显示真结果面板 mn-result-panel', () => {
    renderPage();
    expect(screen.queryByTestId('mn-result-panel')).not.toBeInTheDocument();
  });
});

// ── loading 态 ────────────────────────────────────────────────────────────────
describe('Monetization — loading 态', () => {
  it('isPending=true: 显示 mn-loading-banner', () => {
    _store.isPending = true;
    renderPage();
    expect(screen.getByTestId('mn-loading-banner')).toBeInTheDocument();
  });

  it('isPending=true: CTA disabled', () => {
    _store.isPending = true;
    renderPage();
    expect(screen.getByTestId('mn-generate-btn')).toBeDisabled();
  });
});

// ── error 态 ──────────────────────────────────────────────────────────────────
describe('Monetization — error 态', () => {
  it('isError=true: 显示 mn-error-notice', () => {
    _store.isError = true;
    renderPage();
    expect(screen.getByTestId('mn-error-notice')).toBeInTheDocument();
  });

  it('isError=true: 不显示 loading banner', () => {
    _store.isError = true;
    renderPage();
    expect(screen.queryByTestId('mn-loading-banner')).not.toBeInTheDocument();
  });

  it('isError=true: 重试按钮存在且触发 mutate 含 4 入参', () => {
    _store.isError = true;
    renderPage();
    const retryBtn = screen.getByRole('button', { name: '重试' });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(_store.mutate).toHaveBeenCalledTimes(1);
    expect(_store.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        industryContext: expect.any(String),
        audienceProfile: expect.any(String),
        ipPositioning: expect.any(String),
        productDescription: expect.any(String),
      }),
    );
  });
});

// ── CTA 调 generate mutation · 4 入参 ────────────────────────────────────────
describe('Monetization — CTA 调 generate mutation', () => {
  it('点击 CTA 时调用 generateMutation.mutate 含 4 入参字段', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('mn-generate-btn'));
    expect(_store.mutate).toHaveBeenCalledTimes(1);
    expect(_store.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        industryContext: expect.any(String),
        productDescription: expect.any(String),
      }),
    );
  });

  it('mutate 参数包含 audienceProfile 字段', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('mn-generate-btn'));
    const calls = (_store.mutate as ReturnType<typeof vi.fn>).mock.calls;
    const callArg = (calls[0] as unknown[])[0] as Record<string, unknown>;
    // audienceProfile 来自 MONETIZATION_DEFAULT_AUDIENCE
    expect(callArg).toHaveProperty('audienceProfile');
  });

  it('mutate 参数包含 ipPositioning 字段', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('mn-generate-btn'));
    const calls = (_store.mutate as ReturnType<typeof vi.fn>).mock.calls;
    const callArg = (calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(callArg).toHaveProperty('ipPositioning');
  });
});

// ── 有真结果 · 门控渲染真数据 ────────────────────────────────────────────────
describe('Monetization — 有真结果(门控)', () => {
  beforeEach(() => {
    _store.data = makeResultRow(false);
  });

  it('显示 mn-result-panel', () => {
    renderPage();
    expect(screen.getByTestId('mn-result-panel')).toBeInTheDocument();
  });

  it('不显示 mn-empty-state', () => {
    renderPage();
    expect(screen.queryByTestId('mn-empty-state')).not.toBeInTheDocument();
  });

  it('真 productMatrix[0] 渲染到产品矩阵', () => {
    renderPage();
    expect(screen.getByTestId('mn-product-matrix')).toBeInTheDocument();
    expect(screen.getByText(REAL_PRODUCT_MATRIX[0]!)).toBeInTheDocument();
  });

  it('真 productMatrix[1] 渲染到产品矩阵', () => {
    renderPage();
    expect(screen.getByText(REAL_PRODUCT_MATRIX[1]!)).toBeInTheDocument();
  });

  it('真 productMatrix[2] 渲染到产品矩阵', () => {
    renderPage();
    expect(screen.getByText(REAL_PRODUCT_MATRIX[2]!)).toBeInTheDocument();
  });

  it('真 pricingStrategy 渲染到定价策略', () => {
    renderPage();
    expect(screen.getByTestId('mn-pricing-strategy')).toBeInTheDocument();
    expect(screen.getByText(REAL_PRICING_STRATEGY)).toBeInTheDocument();
  });

  it('真 conversionFunnel[0] 渲染到转化漏斗', () => {
    renderPage();
    expect(screen.getByTestId('mn-conversion-funnel')).toBeInTheDocument();
    expect(screen.getByText(REAL_CONVERSION_FUNNEL[0]!)).toBeInTheDocument();
  });

  it('真 conversionFunnel[3] 渲染到转化漏斗', () => {
    renderPage();
    expect(screen.getByText(REAL_CONVERSION_FUNNEL[3]!)).toBeInTheDocument();
  });

  it('有真结果(isFallback=false): 无 mn-fallback-notice', () => {
    renderPage();
    expect(screen.queryByTestId('mn-fallback-notice')).not.toBeInTheDocument();
  });

  it('反馈 prompt "这个结果对你有帮助吗？" 可见', () => {
    renderPage();
    expect(screen.getByText(MONETIZATION_FEEDBACK_PROMPT)).toBeInTheDocument();
  });

  it('result card h2 "IP变现模型" 可见', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 2, name: MONETIZATION_RESULT_TITLE })).toBeInTheDocument();
  });
});

// ── isFallback 降级提示 ───────────────────────────────────────────────────────
describe('Monetization — isFallback 降级提示', () => {
  it('isFallback=true 显示 mn-fallback-notice', () => {
    _store.data = makeResultRow(true);
    renderPage();
    expect(screen.getByTestId('mn-fallback-notice')).toBeInTheDocument();
  });

  it('isFallback=false 不显示 mn-fallback-notice', () => {
    _store.data = makeResultRow(false);
    renderPage();
    expect(screen.queryByTestId('mn-fallback-notice')).not.toBeInTheDocument();
  });
});

// ── malformed JSON content ────────────────────────────────────────────────────
describe('Monetization — malformed JSON content', () => {
  it('content 不是合法 JSON → hasResult=false，不崩溃', () => {
    _store.data = {
      ...makeResultRow(false),
      content: '{not valid json!!!',
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('mn-result-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('mn-empty-state')).toBeInTheDocument();
  });

  it('content 合法 JSON 但缺 productMatrix → hasResult=false，不崩溃', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({ pricingStrategy: 'test', conversionFunnel: [] }),
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('mn-result-panel')).not.toBeInTheDocument();
  });

  it('content 合法 JSON 但 productMatrix 非 array → hasResult=false', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({ productMatrix: 'not-array', pricingStrategy: 'x', conversionFunnel: [] }),
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('mn-result-panel')).not.toBeInTheDocument();
  });
});

// ── 负向: 无真结果时不渲染真结果面板 ──────────────────────────────────────────
describe('Monetization — idle 不显示真结果面板(负向)', () => {
  it('无真结果时不渲染 mn-result-panel', () => {
    renderPage();
    expect(screen.queryByTestId('mn-result-panel')).not.toBeInTheDocument();
  });

  it('无真结果时不渲染 mn-product-matrix', () => {
    renderPage();
    expect(screen.queryByTestId('mn-product-matrix')).not.toBeInTheDocument();
  });

  it('无真结果时不渲染 mn-pricing-strategy', () => {
    renderPage();
    expect(screen.queryByTestId('mn-pricing-strategy')).not.toBeInTheDocument();
  });

  it('无真结果时不渲染 mn-conversion-funnel', () => {
    renderPage();
    expect(screen.queryByTestId('mn-conversion-funnel')).not.toBeInTheDocument();
  });
});
