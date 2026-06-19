/**
 * BoomGenerate.realdata.test.tsx — 真实 agent 数据路径测试
 * Injection: trpc.boomGenerate.generate.useMutation mock 在 mutate() 调用时
 *            同步触发 onSuccess({ candidates: REAL_CANDIDATES })
 * 断言: real title[0]/[1], indexScore, opening 渲染到 DOM
 *       (区别于 BOOM_ENTRIES 默认数据中的中文标题)
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BoomGenerate from '@/pages/tools/BoomGenerate';

// ── sonner mock ──────────────────────────────────────────────────────────────
vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

// ── auth / account hooks ─────────────────────────────────────────────────────
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn(), refetch: vi.fn() }),
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({ account: null, isLoading: false, isSwitching: false, switchTo: vi.fn() }),
}));

// ── Real candidate data (unique Chinese titles distinguish from BOOM_ENTRIES) ─
const REAL_CANDIDATES = [
  {
    title: 'AI智能体真实测试标题——超越人类的极限',
    indexScore: '7/10',
    opening: '你有没有想过，三年后你的工作会被AI完全替代？',
    development: '根据最新调查，78%的重复性工作岗位将在2026年消失。',
    climax: '但有一类人不仅没有失业，还因此年收入翻了5倍——他们是AI智能体定制师。',
    ending: '现在加入我们的AI创业训练营，成为这个时代的赢家。',
    reason: '恐惧+稀缺+转化，三重爆款元素叠加，点击率预计提升300%。',
  },
  {
    title: '月薪3万的打工人和月入30万的AI创业者，差距在哪里？',
    indexScore: '8/10',
    opening: '同样是打工，为什么有人月薪3万天天焦虑，有人月入30万还能自由旅行？',
    development: '答案不在于努力程度，而在于你是否掌握了AI这个杠杆工具。',
    climax: '通过AI智能体，一个人就能完成10人团队的工作量，成本降低90%。',
    ending: '想知道怎么做？点击主页链接，领取免费AI创业路线图。',
    reason: '对比反差+利益诱惑，直击创业者痛点。',
  },
];

// ── Mutable store: triggerSuccess controls whether mutate() calls onSuccess ──
const _boomStore = { triggerSuccess: false as boolean };

// ── trpc mock — boomGenerate.generate calls onSuccess synchronously ──────────
vi.mock('@/lib/trpc', () => {
  type OnSuccessHandler = (data: { candidates: typeof REAL_CANDIDATES }) => void;

  const boomMutation = ({ onSuccess, onError: _onError }: { onSuccess?: OnSuccessHandler; onError?: (e: { message?: string }) => void } = {}) => ({
    mutate: (..._args: unknown[]) => {
      if (_boomStore.triggerSuccess && onSuccess) {
        onSuccess({ candidates: REAL_CANDIDATES });
      }
    },
    isPending: false,
    isError: false,
    data: undefined,
  });

  const defaultQuery = () => ({ data: undefined, isLoading: false, isPending: false, isError: false, error: null, refetch: vi.fn() });
  const defaultMutation = () => ({ mutate: vi.fn(), isPending: false, isError: false, data: undefined });

  return {
    trpc: {
      auth: { me: { useQuery: defaultQuery } },
      ipAccounts: {
        list: { useQuery: defaultQuery },
        active: { useQuery: defaultQuery },
        switchActive: { useMutation: defaultMutation },
      },
      boomGenerate: {
        generate: { useMutation: boomMutation },
      },
    },
  };
});

// ── render helper ─────────────────────────────────────────────────────────────
function renderPage() {
  return render(
    <MemoryRouter>
      <BoomGenerate />
    </MemoryRouter>,
  );
}

// ── Reset store before each test ─────────────────────────────────────────────
beforeEach(() => {
  _boomStore.triggerSuccess = false;
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── 真实 agent 数据路径测试 ────────────────────────────────────────────────────
describe('BoomGenerate — 真实 agent 数据路径', () => {
  it('onSuccess 触发后 · 真实 candidate.title[0] 渲染到 DOM', async () => {
    _boomStore.triggerSuccess = true;
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /一键生成爆款文案/ }));
    await screen.findAllByText(/AI智能体真实测试标题/);
    expect(screen.getAllByText(/AI智能体真实测试标题/).length).toBeGreaterThanOrEqual(1);
  });

  it('onSuccess 触发后 · 真实 candidate.title[1] 渲染到 DOM', async () => {
    _boomStore.triggerSuccess = true;
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /一键生成爆款文案/ }));
    await screen.findAllByText(/月薪3万的打工人/);
    expect(screen.getAllByText(/月薪3万的打工人/).length).toBeGreaterThanOrEqual(1);
  });

  it('onSuccess 触发后 · 真实 candidate.indexScore[0] "7/10" 渲染到 DOM (7/10 不在 BOOM_ENTRIES 中，注入空时不出现=真负向)', async () => {
    _boomStore.triggerSuccess = true;
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /一键生成爆款文案/ }));
    await screen.findAllByText(/7\/10/);
    expect(screen.getAllByText(/7\/10/).length).toBeGreaterThanOrEqual(1);
  });

  it('onSuccess 触发后 · 真实 candidate.opening[0] 渲染到 DOM', async () => {
    _boomStore.triggerSuccess = true;
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /一键生成爆款文案/ }));
    await screen.findAllByText(/你有没有想过，三年后你的工作会被AI完全替代/);
    expect(screen.getAllByText(/你有没有想过，三年后你的工作会被AI完全替代/).length).toBeGreaterThanOrEqual(1);
  });

  it('triggerSuccess=false 时 · 真实数据不渲染(负向)', () => {
    _boomStore.triggerSuccess = false;
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /一键生成爆款文案/ }));
    expect(screen.queryByText(/AI智能体真实测试标题/)).not.toBeInTheDocument();
  });
});
