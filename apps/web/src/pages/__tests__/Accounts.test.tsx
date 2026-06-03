/**
 * Accounts page unit tests — tRPC-first
 * mocks: trpc.ipAccounts.list / update / create / smartRecommend · useActiveAccount
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Accounts from '@/pages/modules/Accounts';

// ── TEST_ACCOUNT ──────────────────────────────────────────────────────────────
const TEST_ACCOUNT = {
  id: 1,
  name: '赵语AI',
  industry: 'enterprise',
  platform: 'douyin',
  stage: 'starter',
  isActive: true,
  followersRange: '0-1000',
  personalInfo: '定制智能体和opc培训',
  ipPositioning: 'ip-creator',
};

// ── Mutable query state — tests override this before rendering ────────────────
let mockListQueryResult: {
  data: typeof TEST_ACCOUNT[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch?: () => void;
} = {
  data: [TEST_ACCOUNT],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

const mockRefetch = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      list: {
        useQuery: () => ({ refetch: mockRefetch, ...mockListQueryResult }),
      },
      update: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({}),
          isPending: false,
        }),
      },
      create: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ id: 99 }),
          isPending: false,
        }),
      },
      smartRecommend: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
      active: {
        useQuery: () => ({
          data: TEST_ACCOUNT,
          isLoading: false,
        }),
      },
      switchActive: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: TEST_ACCOUNT,
    switchTo: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as object), useNavigate: () => vi.fn() };
});

// ── Render helper ─────────────────────────────────────────────────────────────
function renderAccounts() {
  return render(
    <MemoryRouter>
      <Accounts />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Accounts page', () => {
  beforeEach(() => {
    // Reset to the default happy-path state before each test
    mockListQueryResult = {
      data: [TEST_ACCOUNT],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    };
  });

  it('H1 字面锁 "IP账号管理"', () => {
    renderAccounts();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IP账号管理');
  });

  it('副标题字面锁', () => {
    renderAccounts();
    expect(
      screen.getByText('管理多个IP账号，每个账号独立配置行业、定位和人设'),
    ).toBeInTheDocument();
  });

  it('account card 渲染: ip-account-card-1 存在', () => {
    renderAccounts();
    expect(screen.getByTestId('ip-account-card-1')).toBeInTheDocument();
  });

  it('account name 显示: 赵语AI', () => {
    renderAccounts();
    expect(screen.getByText('赵语AI')).toBeInTheDocument();
  });

  it('ACTIVE chip 显示: id=1 卡片显示 ACTIVE', () => {
    renderAccounts();
    expect(screen.getByTestId('ip-account-active-chip-1')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('新建账号 trigger button 存在', () => {
    renderAccounts();
    expect(screen.getByTestId('create-account-trigger')).toBeInTheDocument();
  });

  it('新建账号 button 点击打开 create-account-modal', () => {
    renderAccounts();
    // modal not open initially
    expect(screen.queryByTestId('create-account-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('create-account-trigger'));
    expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
  });

  it('desc 显示: 定制智能体和opc培训', () => {
    renderAccounts();
    expect(screen.getByText('定制智能体和opc培训')).toBeInTheDocument();
  });

  it('平台 chip 显示: 抖音', () => {
    renderAccounts();
    // The card renders chips including platform
    const card = screen.getByTestId('ip-account-card-1');
    expect(card).toHaveTextContent('抖音');
  });

  it('粉丝 chip 显示: 0-1000粉', () => {
    renderAccounts();
    const card = screen.getByTestId('ip-account-card-1');
    expect(card).toHaveTextContent('0-1000粉');
  });

  // ── P2 新增测试 ─────────────────────────────────────────────────────────────

  it('testid accounts-list 存在', () => {
    renderAccounts();
    expect(screen.getByTestId('accounts-list')).toBeInTheDocument();
  });

  it('testid ip-account-avatar-1 存在', () => {
    renderAccounts();
    expect(screen.getByTestId('ip-account-avatar-1')).toBeInTheDocument();
  });

  it('空态: 账号列表为空时显示「暂无账号」', () => {
    mockListQueryResult = { data: [], isLoading: false, isError: false };
    renderAccounts();
    expect(screen.getByText('暂无账号')).toBeInTheDocument();
  });

  it('加载态: isLoading=true 时显示「加载中」', () => {
    mockListQueryResult = { data: undefined, isLoading: true, isError: false };
    renderAccounts();
    expect(screen.getByText('加载中…')).toBeInTheDocument();
  });

  it('编辑流: 点击编辑按钮打开 edit-account-modal', () => {
    renderAccounts();
    // modal not open initially
    expect(screen.queryByTestId('edit-account-modal')).not.toBeInTheDocument();
    // find the edit button for account 1 by aria-label
    const editBtn = screen.getByRole('button', { name: '编辑账号 赵语AI' });
    fireEvent.click(editBtn);
    expect(screen.getByTestId('edit-account-modal')).toBeInTheDocument();
  });
});
