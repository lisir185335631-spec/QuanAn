/**
 * Accounts page unit tests — 1:1 复刻 mock-first
 * Tests: H1 字面 / subtitle 字面 / card 渲染 / ACTIVE chip / 新建 btn toast
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import Accounts from '@/pages/modules/Accounts';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

function renderAccounts() {
  return render(
    <MemoryRouter>
      <Accounts />
    </MemoryRouter>,
  );
}

describe('Accounts page', () => {
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

  it('demo account card 渲染: ip-account-card-1 存在', () => {
    renderAccounts();
    expect(screen.getByTestId('ip-account-card-1')).toBeInTheDocument();
  });

  it('demo account name 显示: 赵语AI', () => {
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

  it('新建账号 button 点击触发 toast', async () => {
    const { toast } = await import('sonner');
    renderAccounts();
    fireEvent.click(screen.getByTestId('create-account-trigger'));
    expect(toast.info).toHaveBeenCalledWith('新建账号 · 即将上线');
  });

  it('4 chip 横排: 企业服务 / 抖音 / 1-1000粉 / 从零开始做IP', () => {
    renderAccounts();
    expect(screen.getByText('企业服务')).toBeInTheDocument();
    expect(screen.getByText('抖音')).toBeInTheDocument();
    expect(screen.getByText('1-1000粉')).toBeInTheDocument();
    expect(screen.getByText('从零开始做IP')).toBeInTheDocument();
  });

  it('desc 显示: 定制智能体和opc培训', () => {
    renderAccounts();
    expect(screen.getByText('定制智能体和opc培训')).toBeInTheDocument();
  });
});
