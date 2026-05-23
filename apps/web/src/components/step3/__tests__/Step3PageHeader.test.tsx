import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Step3PageHeader } from '../Step3PageHeader';

describe('Step3PageHeader', () => {
  it('renders breadcrumb with correct literal including › (U+203A)', () => {
    render(<Step3PageHeader />);
    expect(screen.getByText('STEP 03 › 账号包装方案')).toBeInTheDocument();
  });

  it('renders H1 with text "账号包装方案"', () => {
    render(<Step3PageHeader />);
    expect(screen.getByRole('heading', { level: 1, name: /账号包装方案/ })).toBeInTheDocument();
  });

  it('renders default industry "美业" in subtitle', () => {
    render(<Step3PageHeader />);
    expect(screen.getByText('美业')).toBeInTheDocument();
  });

  it('renders custom industry prop in subtitle', () => {
    render(<Step3PageHeader industry="餐饮" />);
    expect(screen.getByText('餐饮')).toBeInTheDocument();
  });

  it('renders 3 toolbar buttons with correct labels', () => {
    render(<Step3PageHeader />);
    expect(screen.getByRole('button', { name: /智能优化/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /一键重新生成/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /复制全部/ })).toBeInTheDocument();
  });

  it('all 3 buttons are disabled when canBulkActions=false (default)', () => {
    render(<Step3PageHeader canBulkActions={false} />);
    expect(screen.getByRole('button', { name: /智能优化/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /一键重新生成/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /复制全部/ })).toBeDisabled();
  });

  it('all 3 buttons are enabled when canBulkActions=true', () => {
    render(<Step3PageHeader canBulkActions={true} />);
    expect(screen.getByRole('button', { name: /智能优化/ })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /一键重新生成/ })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /复制全部/ })).not.toBeDisabled();
  });

  it('calls onOptimize when 智能优化 button is clicked', () => {
    const onOptimize = vi.fn();
    render(<Step3PageHeader canBulkActions={true} onOptimize={onOptimize} />);
    fireEvent.click(screen.getByRole('button', { name: /智能优化/ }));
    expect(onOptimize).toHaveBeenCalledTimes(1);
  });

  it('calls onRegenerateAll when 一键重新生成 button is clicked', () => {
    const onRegenerateAll = vi.fn();
    render(<Step3PageHeader canBulkActions={true} onRegenerateAll={onRegenerateAll} />);
    fireEvent.click(screen.getByRole('button', { name: /一键重新生成/ }));
    expect(onRegenerateAll).toHaveBeenCalledTimes(1);
  });

  it('calls onCopyAll when 复制全部 button is clicked', () => {
    const onCopyAll = vi.fn();
    render(<Step3PageHeader canBulkActions={true} onCopyAll={onCopyAll} />);
    fireEvent.click(screen.getByRole('button', { name: /复制全部/ }));
    expect(onCopyAll).toHaveBeenCalledTimes(1);
  });
});
