/**
 * IpAccountCard unit tests — 1:1 复刻 mock-first
 * Tests: name / avatar / 4 chip / ACTIVE chip 条件 / desc
 */
import { render, screen } from '@testing-library/react';
import { Building2, Globe, Target, Users } from 'lucide-react';
import { describe, it, expect, vi } from 'vitest';

import { IpAccountCard } from '@/components/accounts/IpAccountCard';
import type { IpAccountMock } from '@/lib/constants/accounts';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const mockAccount: IpAccountMock = {
  id: 1,
  name: '赵语AI',
  desc: '定制智能体和opc培训',
  active: true,
  chips: [
    { icon: Building2, label: '企业服务' },
    { icon: Globe,     label: '抖音' },
    { icon: Users,     label: '1-1000粉' },
    { icon: Target,    label: '从零开始做IP' },
  ],
};

describe('IpAccountCard', () => {
  it('name 渲染: 赵语AI', () => {
    render(<IpAccountCard account={mockAccount} />);
    expect(screen.getByText('赵语AI')).toBeInTheDocument();
  });

  it('avatar 首字符: 赵', () => {
    render(<IpAccountCard account={mockAccount} />);
    const avatar = screen.getByTestId('ip-account-avatar-1');
    expect(avatar).toHaveTextContent('赵');
  });

  it('4 chip 显示: 企业服务 / 抖音 / 1-1000粉 / 从零开始做IP', () => {
    render(<IpAccountCard account={mockAccount} />);
    expect(screen.getByText('企业服务')).toBeInTheDocument();
    expect(screen.getByText('抖音')).toBeInTheDocument();
    expect(screen.getByText('1-1000粉')).toBeInTheDocument();
    expect(screen.getByText('从零开始做IP')).toBeInTheDocument();
  });

  it('ACTIVE chip: active=true 显示绿 chip', () => {
    render(<IpAccountCard account={mockAccount} />);
    expect(screen.getByTestId('ip-account-active-chip-1')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('ACTIVE chip: active=false 不显示 chip', () => {
    render(<IpAccountCard account={{ ...mockAccount, active: false }} />);
    expect(screen.queryByTestId('ip-account-active-chip-1')).not.toBeInTheDocument();
  });

  it('desc 渲染: 定制智能体和opc培训', () => {
    render(<IpAccountCard account={mockAccount} />);
    expect(screen.getByText('定制智能体和opc培训')).toBeInTheDocument();
  });

  it('card testid: ip-account-card-1', () => {
    render(<IpAccountCard account={mockAccount} />);
    expect(screen.getByTestId('ip-account-card-1')).toBeInTheDocument();
  });
});
