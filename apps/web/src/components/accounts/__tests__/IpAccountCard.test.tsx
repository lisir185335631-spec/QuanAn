/**
 * IpAccountCard unit tests — PRD-23 US-002 AC-8
 * ≥ 5 tests: props 渲染 / ACTIVE 标条件 / 圆形头像首字符 / onActivate/onEdit/onDelete click / stub toast
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { IpAccountCard } from '@/components/accounts/IpAccountCard';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const mockAccount = {
  id: 1,
  name: 'AI 创业者小张',
  industry: '企业服务',
  platform: 'douyin',
  stage: 'starter',
  isActive: true,
  followersRange: '0-1000',
  personalInfo: '定制智能体和 opc 培训',
  ipPositioning: 'AI 工具达人',
};

describe('IpAccountCard', () => {
  const onActivate = vi.fn();
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    onActivate.mockClear();
    onEdit.mockClear();
    onDelete.mockClear();
  });

  it('props 渲染: name / industry / platform 显示', () => {
    render(
      <IpAccountCard
        account={mockAccount}
        isActive={false}
        onActivate={onActivate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByText('AI 创业者小张')).toBeInTheDocument();
    expect(screen.getByText(/企业服务/)).toBeInTheDocument();
    expect(screen.getByText(/douyin/)).toBeInTheDocument();
  });

  it('ACTIVE 标条件: isActive=true 显示 chip', () => {
    render(
      <IpAccountCard
        account={mockAccount}
        isActive={true}
        onActivate={onActivate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByTestId(`ip-account-active-chip-${mockAccount.id}`)).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('ACTIVE 标条件: isActive=false 不显示 chip', () => {
    render(
      <IpAccountCard
        account={mockAccount}
        isActive={false}
        onActivate={onActivate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(screen.queryByTestId(`ip-account-active-chip-${mockAccount.id}`)).not.toBeInTheDocument();
  });

  it('圆形头像首字符: 显示 name[0]', () => {
    render(
      <IpAccountCard
        account={mockAccount}
        isActive={false}
        onActivate={onActivate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    const avatar = screen.getByTestId(`ip-account-avatar-${mockAccount.id}`);
    expect(avatar).toHaveTextContent('A');
  });

  it('onActivate: 点击卡片主体触发', () => {
    render(
      <IpAccountCard
        account={mockAccount}
        isActive={false}
        onActivate={onActivate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByTestId(`ip-account-card-${mockAccount.id}`));
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it('onEdit click: 编辑 button 触发', async () => {
    const { toast } = await import('sonner');
    render(
      <IpAccountCard
        account={mockAccount}
        isActive={false}
        onActivate={onActivate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByTestId(`ip-account-edit-${mockAccount.id}`));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(toast.info).toHaveBeenCalledWith('功能 PRD-25+');
  });

  it('onDelete click: 删除 button 触发', async () => {
    const { toast } = await import('sonner');
    render(
      <IpAccountCard
        account={mockAccount}
        isActive={false}
        onActivate={onActivate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByTestId(`ip-account-delete-${mockAccount.id}`));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(toast.info).toHaveBeenCalledWith('功能 PRD-25+');
  });

  it('personalInfo + ipPositioning: 有值时渲染', () => {
    render(
      <IpAccountCard
        account={mockAccount}
        isActive={false}
        onActivate={onActivate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByText('定制智能体和 opc 培训')).toBeInTheDocument();
    expect(screen.getByText('AI 工具达人')).toBeInTheDocument();
  });
});
