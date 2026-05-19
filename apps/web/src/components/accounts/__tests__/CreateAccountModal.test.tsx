/**
 * CreateAccountModal unit tests — PRD-23 US-002 AC-9
 * ≥ 5 tests: modal 弹/关 / 4 字段填写 / disabled 条件 / 取消关闭 / 创建成功 mutation 触发 + redirect
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CreateAccountModal } from '@/components/accounts/CreateAccountModal';

const mockMutateAsync = vi.fn().mockResolvedValue({
  id: 99,
  name: '新账号',
  industry: '科技',
  platform: 'douyin',
  stage: 'starter',
  isActive: true,
  followersRange: '0-1000',
});
const mockNavigate = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      create: {
        useMutation: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
      },
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderModal() {
  return render(
    <MemoryRouter>
      <CreateAccountModal />
    </MemoryRouter>,
  );
}

describe('CreateAccountModal', () => {
  beforeEach(() => {
    mockMutateAsync.mockClear();
    mockNavigate.mockClear();
  });

  it('modal 弹: 点击"新建账号" button dialog 打开', () => {
    renderModal();
    expect(screen.queryByTestId('create-account-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('create-account-trigger'));
    expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
  });

  it('4 字段渲染: name / industry / description input + platform radio', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('create-account-trigger'));
    expect(screen.getByTestId('create-account-name')).toBeInTheDocument();
    expect(screen.getByTestId('create-account-industry')).toBeInTheDocument();
    expect(screen.getByTestId('create-account-description')).toBeInTheDocument();
    // Platform radio has 5 buttons (PlatformInlineRadio)
    expect(screen.getByText('抖音')).toBeInTheDocument();
    expect(screen.getByText('小红书')).toBeInTheDocument();
  });

  it('disabled 条件: 空 name 时 submit disabled', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('create-account-trigger'));
    // name is empty by default
    expect(screen.getByTestId('create-account-submit')).toBeDisabled();
  });

  it('disabled 条件: 填写 name+industry 但无 platform 时仍 disabled', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('create-account-trigger'));
    fireEvent.change(screen.getByTestId('create-account-name'), { target: { value: '测试账号' } });
    fireEvent.change(screen.getByTestId('create-account-industry'), { target: { value: '科技' } });
    expect(screen.getByTestId('create-account-submit')).toBeDisabled();
  });

  it('取消关闭: 点击取消按钮关闭 modal', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('create-account-trigger'));
    expect(screen.getByTestId('create-account-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('create-account-cancel'));
    expect(screen.queryByTestId('create-account-modal')).not.toBeInTheDocument();
  });

  it('创建成功: 填完 name+industry+platform → submit → mutateAsync + navigate(/step/1)', async () => {
    const { toast } = await import('sonner');
    renderModal();
    fireEvent.click(screen.getByTestId('create-account-trigger'));

    fireEvent.change(screen.getByTestId('create-account-name'), { target: { value: '赵语AI' } });
    fireEvent.change(screen.getByTestId('create-account-industry'), { target: { value: '企业服务' } });
    // Click douyin platform button
    fireEvent.click(screen.getByText('抖音'));

    expect(screen.getByTestId('create-account-submit')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('create-account-submit'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ name: '赵语AI', industry: '企业服务', platform: 'douyin' }),
      );
      expect(toast.success).toHaveBeenCalledWith('账号创建成功');
      expect(mockNavigate).toHaveBeenCalledWith('/step/1');
    });
  });

  it('disabled 条件: 全部填完后 submit enabled', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('create-account-trigger'));
    fireEvent.change(screen.getByTestId('create-account-name'), { target: { value: '赵语AI' } });
    fireEvent.change(screen.getByTestId('create-account-industry'), { target: { value: '企业服务' } });
    fireEvent.click(screen.getByText('抖音'));
    expect(screen.getByTestId('create-account-submit')).not.toBeDisabled();
  });
});
