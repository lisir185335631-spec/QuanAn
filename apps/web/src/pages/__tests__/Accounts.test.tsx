/**
 * Accounts page unit tests — PRD-23 US-002 AC-7
 * ≥ 5 tests: H1 字面 / 账号列表渲染 / ACTIVE 标显示 / 切换 active 调 setActive / 新建账号 modal 弹
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Accounts from '@/pages/modules/Accounts';

const mockSwitchTo = vi.fn();
const mockMutateAsync = vi.fn().mockResolvedValue({
  id: 99,
  name: '新账号',
  industry: '科技',
  platform: 'douyin',
  stage: 'starter',
  isActive: true,
  followersRange: '0-1000',
});

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      list: {
        useQuery: () => ({
          data: [
            { id: 1, name: 'AI 创业者小张', industry: '企业服务', platform: 'douyin', stage: 'starter', isActive: true, followersRange: '0-1000', personalInfo: null, ipPositioning: null },
            { id: 2, name: 'OPC 经营者老王', industry: '企业服务', platform: 'xiaohongshu', stage: 'growth', isActive: false, followersRange: '1000-10000', personalInfo: null, ipPositioning: null },
            { id: 3, name: '实体店主陈姐', industry: '餐饮', platform: 'douyin', stage: 'starter', isActive: false, followersRange: '0-1000', personalInfo: '卖特色火锅', ipPositioning: null },
          ],
          isLoading: false,
        }),
      },
      active: {
        useQuery: () => ({
          data: { id: 1, name: 'AI 创业者小张', platform: 'douyin', stage: 'starter', industry: '企业服务', followersRange: '0-1000' },
          isLoading: false,
        }),
      },
      switchActive: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
      create: {
        useMutation: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
      },
      // US-007 AC-7: smartRecommend mock (required by CreateAccountModal)
      smartRecommend: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
  },
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: { id: 1, name: 'AI 创业者小张', platform: 'douyin', stage: 'starter', industry: '企业服务', followersRange: '0-1000' },
    switchTo: mockSwitchTo,
    isSwitching: false,
    isLoading: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

function renderAccounts() {
  return render(
    <MemoryRouter>
      <Accounts />
    </MemoryRouter>,
  );
}

describe('Accounts page', () => {
  beforeEach(() => {
    mockSwitchTo.mockClear();
  });

  it('AC-1 · H1 字面锁 "IP 账号管理"', () => {
    renderAccounts();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IP 账号管理');
  });

  it('AC-1 · 副标题字面锁', () => {
    renderAccounts();
    expect(
      screen.getByText('管理多个 IP 账号，每个账号独立配置行业、定位和人设'),
    ).toBeInTheDocument();
  });

  it('AC-5 · 账号列表渲染: 3 张卡片显示', () => {
    renderAccounts();
    expect(screen.getByTestId('ip-account-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('ip-account-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('ip-account-card-3')).toBeInTheDocument();
  });

  it('AC-2 · ACTIVE 标显示: id=1 卡片显示 ACTIVE chip', () => {
    renderAccounts();
    expect(screen.getByTestId('ip-account-active-chip-1')).toBeInTheDocument();
    expect(screen.queryByTestId('ip-account-active-chip-2')).not.toBeInTheDocument();
  });

  it('AC-5 · 切换 active: 点击非 active 卡调 switchTo', () => {
    renderAccounts();
    fireEvent.click(screen.getByTestId('ip-account-card-2'));
    expect(mockSwitchTo).toHaveBeenCalledWith(2);
  });

  it('AC-5 · 新建账号 trigger button 存在', () => {
    renderAccounts();
    expect(screen.getByTestId('create-account-trigger')).toBeInTheDocument();
  });

  it('AC-3 · 新建账号 button 点击弹 modal', () => {
    renderAccounts();
    fireEvent.click(screen.getByTestId('create-account-trigger'));
    expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
  });

  it('AC-5 · personalInfo 显示: 账号3 description 渲染', () => {
    renderAccounts();
    expect(screen.getByText('卖特色火锅')).toBeInTheDocument();
  });
});
