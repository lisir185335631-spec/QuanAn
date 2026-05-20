import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { PLATFORMS } from '@/lib/constants/platforms';

import { PlatformInlineRadio } from '../PlatformInlineRadio';

describe('PlatformInlineRadio', () => {
  it('renders all 5 platform buttons', () => {
    render(<PlatformInlineRadio value={null} onChange={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByText('抖音')).toBeInTheDocument();
    expect(screen.getByText('B站')).toBeInTheDocument();
  });

  it('controlled: calls onChange with platform key when clicked', () => {
    const onChange = vi.fn();
    render(<PlatformInlineRadio value={null} onChange={onChange} />);
    fireEvent.click(screen.getByText('抖音').closest('button')!);
    expect(onChange).toHaveBeenCalledWith('douyin');
  });

  it('controlled: selected platform button has border-primary', () => {
    render(<PlatformInlineRadio value="xiaohongshu" onChange={() => {}} />);
    const btn = screen.getByText('小红书').closest('button')!;
    expect(btn.className).toContain('border-primary');
  });

  it('disabled: does not call onChange when clicked', () => {
    const onChange = vi.fn();
    render(<PlatformInlineRadio value={null} onChange={onChange} disabled />);
    fireEvent.click(screen.getByText('抖音').closest('button')!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('size=sm: applies sm padding class', () => {
    render(<PlatformInlineRadio value={null} onChange={() => {}} size="sm" />);
    const btn = screen.getAllByRole('button')[0]!;
    expect(btn.className).toContain('px-3');
    expect(btn.className).toContain('py-1');
  });

  it('size=lg: applies lg padding class', () => {
    render(<PlatformInlineRadio value={null} onChange={() => {}} size="lg" />);
    const btn = screen.getAllByRole('button')[0]!;
    expect(btn.className).toContain('px-5');
    expect(btn.className).toContain('py-3');
  });

  it('renders emoji for each platform (by label presence)', () => {
    render(<PlatformInlineRadio value={null} onChange={() => {}} />);
    expect(screen.getByText('📱')).toBeInTheDocument();
    expect(screen.getByText('📕')).toBeInTheDocument();
    expect(screen.getByText('🎬')).toBeInTheDocument();
    expect(screen.getAllByText('📺')).toHaveLength(2);
    expect(PLATFORMS.map((p) => p.emoji)).toContain('📱');
  });
});
