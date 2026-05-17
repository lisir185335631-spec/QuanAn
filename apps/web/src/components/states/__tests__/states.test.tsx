import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { LoadingState } from '../LoadingState';

describe('LoadingState', () => {
  it('renders custom text', () => {
    render(<LoadingState text="处理中..." />);
    expect(screen.getByText('处理中...')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('shows 重试 button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    const btn = screen.getByRole('button', { name: '重试' });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('EmptyState', () => {
  it("renders default title '暂无数据'", () => {
    render(<EmptyState />);
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });
});
