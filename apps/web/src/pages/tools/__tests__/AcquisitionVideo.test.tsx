/**
 * AcquisitionVideo.test.tsx — 阶段2 接真 trpc.acquisitionVideo.generate
 * mock trpc · 断言:
 *   - h1/subtitle/CTA 字面锁 + 3 label + 默认值
 *   - 无真结果时:显示 av-empty-state、不显假方案(门控)
 *   - 有真结果:映射 script/ctaScript/conversionPath/keyMessages → 渲染真数据
 *   - loading 态:显示 av-loading-banner + CTA disabled
 *   - error 态:显示 av-error-notice + 重试按钮调 mutate
 *   - isFallback=true: 显示 av-fallback-notice
 *   - CTA 调 generate 含 sourceCopy + conversionGoal(无 emoji)
 *   - 切换行业后 sourceCopy 更新
 *   - 最小字数校验(10 字)· 错误提示 · 提交拦截
 *   - 复制方案 disabled={!hasResult} · 智能优化 always disabled
 *   - malformed JSON: hasResult=false 不崩溃
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ACQUISITION_VIDEO_CTA_GENERATE,
  ACQUISITION_VIDEO_CUSTOMER_LABEL,
  ACQUISITION_VIDEO_FOOTER_FEEDBACK,
  ACQUISITION_VIDEO_H1,
  ACQUISITION_VIDEO_INDUSTRY_LABEL,
  ACQUISITION_VIDEO_PRODUCT_LABEL,
  ACQUISITION_VIDEO_SUBTITLE,
} from '@/lib/constants/acquisition-video';
import AcquisitionVideo from '@/pages/tools/AcquisitionVideo';

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
    acquisitionVideo: {
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

// ── Real LLM result fixture — distinct from any hardcoded data ───────────────
const REAL_SCRIPT =
  '你是不是也想获得更多客户？这套方案专为你设计，帮你在30天内把获客成本降低50%！点击下方链接，免费领取《获客秘籍》，限时100份！';
const REAL_CTA_SCRIPT = '扫码添加微信，免费领取《获客秘籍》，仅限今天！私信回复"获客"立即获取。';
const REAL_CONVERSION_PATH = '视频曝光 → 点击主页链接 → 落地页填写信息 → 1v1咨询 → 成交';
const REAL_KEY_MESSAGES = [
  '30天获客成本降低50%',
  '已服务1000+商家',
  '一对一专属指导',
];

function makeResultRow(isFallback: boolean) {
  return {
    id: 42,
    content: JSON.stringify({
      script: REAL_SCRIPT,
      ctaScript: REAL_CTA_SCRIPT,
      conversionPath: REAL_CONVERSION_PATH,
      keyMessages: REAL_KEY_MESSAGES,
    }),
    contentType: 'json',
    agentId: 'VideoAgent',
    agentMode: 'acquisition',
    scriptType: null,
    elements: [],
    isFallback,
    tokensUsed: 1200,
    modelUsed: 'claude-3-5-sonnet',
    durationMs: 8000,
    traceId: 'trace-abc',
    createdAt: new Date(),
  };
}

// ── render helper ─────────────────────────────────────────────────────────────
function renderPage() {
  return render(
    <MemoryRouter>
      <AcquisitionVideo />
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
describe('AcquisitionVideo — 字面锁 + 常量', () => {
  it('h1 字面锁', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(ACQUISITION_VIDEO_H1);
  });

  it('subtitle 字面锁', () => {
    renderPage();
    expect(screen.getByText(ACQUISITION_VIDEO_SUBTITLE)).toBeInTheDocument();
  });

  it('3 label 字面锁', () => {
    renderPage();
    expect(screen.getByText(ACQUISITION_VIDEO_INDUSTRY_LABEL)).toBeInTheDocument();
    expect(screen.getByText(ACQUISITION_VIDEO_CUSTOMER_LABEL)).toBeInTheDocument();
    expect(screen.getByText(ACQUISITION_VIDEO_PRODUCT_LABEL)).toBeInTheDocument();
  });

  it('默认值预填 · 行业 美业 + 客户画像 + 产品亮点', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /美业/i })).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByDisplayValue('想要创业的3-45岁宝妈群体，有一定积蓄但缺乏方向'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('零基础可学、3个月回本、一对一指导')).toBeInTheDocument();
  });

  it('CTA 可见且默认 enabled(默认值非空)', () => {
    renderPage();
    const btn = screen.getByRole('button', { name: ACQUISITION_VIDEO_CTA_GENERATE });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('反馈 prompt', () => {
    renderPage();
    expect(screen.getByText(ACQUISITION_VIDEO_FOOTER_FEEDBACK)).toBeInTheDocument();
  });
});

// ── idle 态 · 无真结果 · 空态门控 ─────────────────────────────────────────────
describe('AcquisitionVideo — 无真结果(idle) · 空态门控', () => {
  it('显示 av-empty-state 占位', () => {
    renderPage();
    expect(screen.getByTestId('av-empty-state')).toBeInTheDocument();
  });

  it('idle 态:不显示 fallback / error / loading banner', () => {
    renderPage();
    expect(screen.queryByTestId('av-fallback-notice')).not.toBeInTheDocument();
    expect(screen.queryByTestId('av-error-notice')).not.toBeInTheDocument();
    expect(screen.queryByTestId('av-loading-banner')).not.toBeInTheDocument();
  });

  it('idle 态:不显示真结果面板 av-result-panel', () => {
    renderPage();
    expect(screen.queryByTestId('av-result-panel')).not.toBeInTheDocument();
  });

  it('idle 态:不显示 av-script', () => {
    renderPage();
    expect(screen.queryByTestId('av-script')).not.toBeInTheDocument();
  });

  it('idle 态:不显示 av-cta-script', () => {
    renderPage();
    expect(screen.queryByTestId('av-cta-script')).not.toBeInTheDocument();
  });

  it('idle 态:不显示 av-key-messages', () => {
    renderPage();
    expect(screen.queryByTestId('av-key-messages')).not.toBeInTheDocument();
  });
});

// ── loading 态 ────────────────────────────────────────────────────────────────
describe('AcquisitionVideo — loading 态', () => {
  it('isPending=true: 显示 av-loading-banner', () => {
    _store.isPending = true;
    renderPage();
    expect(screen.getByTestId('av-loading-banner')).toBeInTheDocument();
  });

  it('isPending=true: CTA disabled', () => {
    _store.isPending = true;
    renderPage();
    expect(screen.getByTestId('av-generate-btn')).toBeDisabled();
  });
});

// ── error 态 ──────────────────────────────────────────────────────────────────
describe('AcquisitionVideo — error 态', () => {
  it('isError=true: 显示 av-error-notice', () => {
    _store.isError = true;
    renderPage();
    expect(screen.getByTestId('av-error-notice')).toBeInTheDocument();
  });

  it('isError=true: 不显示 loading banner', () => {
    _store.isError = true;
    renderPage();
    expect(screen.queryByTestId('av-loading-banner')).not.toBeInTheDocument();
  });

  it('isError=true: 重试按钮存在且触发 mutate 含入参', () => {
    _store.isError = true;
    renderPage();
    const retryBtn = screen.getByRole('button', { name: '重试' });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(_store.mutate).toHaveBeenCalledTimes(1);
    expect(_store.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceCopy: expect.any(String),
        conversionGoal: expect.any(String),
      }),
    );
  });
});

// ── CTA 调 generate mutation · 入参 ─────────────────────────────────────────
describe('AcquisitionVideo — CTA 调 generate mutation', () => {
  it('点击 CTA 时调用 generateMutation.mutate 含 sourceCopy + conversionGoal', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('av-generate-btn'));
    expect(_store.mutate).toHaveBeenCalledTimes(1);
    expect(_store.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceCopy: expect.any(String),
        conversionGoal: expect.any(String),
      }),
    );
  });

  it('sourceCopy 包含客户画像默认值', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('av-generate-btn'));
    const firstCallArg = (_store.mutate.mock.calls[0] as [Record<string, unknown>])[0];
    expect(String(firstCallArg['sourceCopy'])).toContain('宝妈群体');
  });

  it('sourceCopy 包含产品亮点默认值', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('av-generate-btn'));
    const firstCallArg = (_store.mutate.mock.calls[0] as [Record<string, unknown>])[0];
    expect(String(firstCallArg['sourceCopy'])).toContain('零基础可学');
  });

  it('conversionGoal 不含 emoji(💅)', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('av-generate-btn'));
    expect(_store.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        conversionGoal: expect.not.stringContaining('💅'),
      }),
    );
  });

  it('conversionGoal 是干净文案(无 emoji 字符)', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('av-generate-btn'));
    const firstCallArg = (_store.mutate.mock.calls[0] as [Record<string, unknown>])[0];
    // 干净文案应为下拉选项之一，不含 emoji
    expect(String(firstCallArg['conversionGoal'])).toMatch(/^[一-龥a-zA-Z0-9_\s-]+$/);
  });

  it('切换行业后 sourceCopy 包含新行业的中文名', () => {
    renderPage();
    // 切换到"健身"
    fireEvent.click(screen.getByRole('button', { name: /健身/i }));
    fireEvent.click(screen.getByTestId('av-generate-btn'));
    const firstCallArg = (_store.mutate.mock.calls[0] as [Record<string, unknown>])[0];
    expect(String(firstCallArg['sourceCopy'])).toContain('健身');
  });
});

// ── 有真结果 · 门控渲染真数据 ────────────────────────────────────────────────
describe('AcquisitionVideo — 有真结果(门控)', () => {
  beforeEach(() => {
    _store.data = makeResultRow(false);
  });

  it('显示 av-result-panel', () => {
    renderPage();
    expect(screen.getByTestId('av-result-panel')).toBeInTheDocument();
  });

  it('不显示 av-empty-state', () => {
    renderPage();
    expect(screen.queryByTestId('av-empty-state')).not.toBeInTheDocument();
  });

  it('真 script 渲染到 av-script', () => {
    renderPage();
    expect(screen.getByTestId('av-script')).toBeInTheDocument();
    expect(screen.getByText(REAL_SCRIPT)).toBeInTheDocument();
  });

  it('真 ctaScript 渲染到 av-cta-script', () => {
    renderPage();
    expect(screen.getByTestId('av-cta-script')).toBeInTheDocument();
    expect(screen.getByText(REAL_CTA_SCRIPT)).toBeInTheDocument();
  });

  it('真 conversionPath 渲染到 av-conversion-path', () => {
    renderPage();
    expect(screen.getByTestId('av-conversion-path')).toBeInTheDocument();
    expect(screen.getByText(REAL_CONVERSION_PATH)).toBeInTheDocument();
  });

  it('真 keyMessages[0] 渲染到 av-key-messages', () => {
    renderPage();
    expect(screen.getByTestId('av-key-messages')).toBeInTheDocument();
    expect(screen.getByText(REAL_KEY_MESSAGES[0]!)).toBeInTheDocument();
  });

  it('真 keyMessages[1] 渲染到 av-key-messages', () => {
    renderPage();
    expect(screen.getByText(REAL_KEY_MESSAGES[1]!)).toBeInTheDocument();
  });

  it('真 keyMessages[2] 渲染到 av-key-messages', () => {
    renderPage();
    expect(screen.getByText(REAL_KEY_MESSAGES[2]!)).toBeInTheDocument();
  });

  it('有真结果(isFallback=false): 无 av-fallback-notice', () => {
    renderPage();
    expect(screen.queryByTestId('av-fallback-notice')).not.toBeInTheDocument();
  });

  it('反馈 prompt 可见', () => {
    renderPage();
    expect(screen.getByText(ACQUISITION_VIDEO_FOOTER_FEEDBACK)).toBeInTheDocument();
  });
});

// ── isFallback 降级提示 ───────────────────────────────────────────────────────
describe('AcquisitionVideo — isFallback 降级提示', () => {
  it('isFallback=true 显示 av-fallback-notice', () => {
    _store.data = makeResultRow(true);
    renderPage();
    expect(screen.getByTestId('av-fallback-notice')).toBeInTheDocument();
  });

  it('isFallback=false 不显示 av-fallback-notice', () => {
    _store.data = makeResultRow(false);
    renderPage();
    expect(screen.queryByTestId('av-fallback-notice')).not.toBeInTheDocument();
  });
});

// ── malformed JSON content ────────────────────────────────────────────────────
describe('AcquisitionVideo — malformed JSON content', () => {
  it('content 不是合法 JSON → hasResult=false，不崩溃', () => {
    _store.data = {
      ...makeResultRow(false),
      content: '{not valid json!!!',
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('av-result-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('av-empty-state')).toBeInTheDocument();
  });

  it('content 合法 JSON 但缺 script → hasResult=false，不崩溃', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({ ctaScript: 'x', conversionPath: 'x', keyMessages: [] }),
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('av-result-panel')).not.toBeInTheDocument();
  });

  it('content 合法 JSON 但 keyMessages 非 array → hasResult=false', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({ script: 'x', ctaScript: 'x', conversionPath: 'x', keyMessages: 'not-array' }),
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('av-result-panel')).not.toBeInTheDocument();
  });
});

// ── 负向: 无真结果时不渲染真结果面板 ──────────────────────────────────────────
describe('AcquisitionVideo — idle 不显示真结果面板(负向)', () => {
  it('无真结果时不渲染 av-result-panel', () => {
    renderPage();
    expect(screen.queryByTestId('av-result-panel')).not.toBeInTheDocument();
  });

  it('无真结果时不渲染 av-script', () => {
    renderPage();
    expect(screen.queryByTestId('av-script')).not.toBeInTheDocument();
  });

  it('无真结果时不渲染 av-cta-script', () => {
    renderPage();
    expect(screen.queryByTestId('av-cta-script')).not.toBeInTheDocument();
  });

  it('无真结果时不渲染 av-key-messages', () => {
    renderPage();
    expect(screen.queryByTestId('av-key-messages')).not.toBeInTheDocument();
  });
});

// ── 最小字数校验(≥10 字)─────────────────────────────────────────────────────
describe('AcquisitionVideo — 最小字数校验', () => {
  it('客户画像少于 10 字时显示错误提示', () => {
    renderPage();
    const textarea = screen.getByTestId('av-customer-profile-input');
    fireEvent.change(textarea, { target: { value: '太短' } });
    expect(screen.getByTestId('av-customer-profile-error')).toBeInTheDocument();
    expect(screen.getByTestId('av-customer-profile-error')).toHaveTextContent('10 字');
  });

  it('客户画像恰好 10 字时无错误提示', () => {
    renderPage();
    const textarea = screen.getByTestId('av-customer-profile-input');
    fireEvent.change(textarea, { target: { value: '十个字刚好达到最低限' } });
    expect(screen.queryByTestId('av-customer-profile-error')).not.toBeInTheDocument();
  });

  it('产品亮点少于 10 字时显示错误提示', () => {
    renderPage();
    const textarea = screen.getByTestId('av-product-highlights-input');
    fireEvent.change(textarea, { target: { value: '太短了' } });
    expect(screen.getByTestId('av-product-highlights-error')).toBeInTheDocument();
    expect(screen.getByTestId('av-product-highlights-error')).toHaveTextContent('10 字');
  });

  it('产品亮点恰好 10 字时无错误提示', () => {
    renderPage();
    const textarea = screen.getByTestId('av-product-highlights-input');
    fireEvent.change(textarea, { target: { value: '十个字刚好达到最低限' } });
    expect(screen.queryByTestId('av-product-highlights-error')).not.toBeInTheDocument();
  });

  it('客户画像清空时(0 字)不显示错误提示(不触发校验)', () => {
    renderPage();
    const textarea = screen.getByTestId('av-customer-profile-input');
    fireEvent.change(textarea, { target: { value: '' } });
    expect(screen.queryByTestId('av-customer-profile-error')).not.toBeInTheDocument();
  });

  it('客户画像少于 10 字时生成按钮 disabled', () => {
    renderPage();
    const textarea = screen.getByTestId('av-customer-profile-input');
    fireEvent.change(textarea, { target: { value: '太短' } });
    expect(screen.getByTestId('av-generate-btn')).toBeDisabled();
  });

  it('产品亮点少于 10 字时生成按钮 disabled', () => {
    renderPage();
    const textarea = screen.getByTestId('av-product-highlights-input');
    fireEvent.change(textarea, { target: { value: '太短' } });
    expect(screen.getByTestId('av-generate-btn')).toBeDisabled();
  });

  it('两个字段都 ≥10 字时生成按钮可用', () => {
    renderPage();
    const cpTextarea = screen.getByTestId('av-customer-profile-input');
    const phTextarea = screen.getByTestId('av-product-highlights-input');
    fireEvent.change(cpTextarea, { target: { value: '十个字刚好达到最低限制目标' } });
    fireEvent.change(phTextarea, { target: { value: '十个字刚好达到最低限制卖点' } });
    expect(screen.getByTestId('av-generate-btn')).not.toBeDisabled();
  });

  it('少于 10 字时点击生成按钮不调用 mutate', () => {
    renderPage();
    const textarea = screen.getByTestId('av-customer-profile-input');
    fireEvent.change(textarea, { target: { value: '太短' } });
    fireEvent.click(screen.getByTestId('av-generate-btn'));
    expect(_store.mutate).not.toHaveBeenCalled();
  });
});

// ── 按钮 disabled 状态 ────────────────────────────────────────────────────────
describe('AcquisitionVideo — 按钮 disabled 状态', () => {
  it('idle 态(无结果): 复制方案按钮 disabled', () => {
    renderPage();
    expect(screen.getByTestId('av-copy-btn')).toBeDisabled();
  });

  it('有真结果时: 复制方案按钮 enabled', () => {
    _store.data = makeResultRow(false);
    renderPage();
    expect(screen.getByTestId('av-copy-btn')).not.toBeDisabled();
  });

  it('智能优化按钮 always disabled', () => {
    renderPage();
    expect(screen.getByTestId('av-optimize-btn')).toBeDisabled();
  });

  it('有真结果时智能优化按钮仍然 disabled', () => {
    _store.data = makeResultRow(false);
    renderPage();
    expect(screen.getByTestId('av-optimize-btn')).toBeDisabled();
  });
});
