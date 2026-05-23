import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Step3LoadingState } from '../Step3LoadingState';

describe('Step3LoadingState — AC-1: required text content', () => {
  it('renders title "AI 正在深度分析中..."', () => {
    render(<Step3LoadingState />);
    expect(screen.getByText('AI 正在深度分析中...')).toBeInTheDocument();
  });

  it('renders subtitle "正在生成专业分析报告，请稍候片刻"', () => {
    render(<Step3LoadingState />);
    expect(screen.getByText('正在生成专业分析报告，请稍候片刻')).toBeInTheDocument();
  });
});

describe('Step3LoadingState — AC-2: animate-ping-primary dot', () => {
  it('renders animate-ping-primary element (not default animate-ping)', () => {
    const { container } = render(<Step3LoadingState />);
    const pingEl = container.querySelector('.animate-ping-primary');
    expect(pingEl).toBeInTheDocument();
    expect(pingEl).not.toHaveClass('animate-ping');
  });
});

describe('Step3LoadingState — AC-1: Loader2 spinning icon', () => {
  it('renders a spinning icon with animate-spin class', () => {
    const { container } = render(<Step3LoadingState />);
    const spinIcon = container.querySelector('.animate-spin');
    expect(spinIcon).toBeInTheDocument();
  });
});

describe('Step3LoadingState — AC-3: inline card (not modal)', () => {
  it('renders no dialog or modal element', () => {
    const { container } = render(<Step3LoadingState />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[data-radix-dialog-content]')).toBeNull();
  });

  it('renders inline SubCard with primary border', () => {
    const { container } = render(<Step3LoadingState />);
    const card = container.firstElementChild;
    expect(card?.className).toMatch(/border-primary/);
  });
});
