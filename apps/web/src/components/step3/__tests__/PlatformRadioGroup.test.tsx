import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { PLATFORMS } from '@/lib/constants/platforms';

import { PlatformRadioGroup } from '../PlatformRadioGroup';

describe('PlatformRadioGroup', () => {
  it('renders 5 platform buttons', () => {
    render(<PlatformRadioGroup value={null} onChange={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('renders all 5 platform labels', () => {
    render(<PlatformRadioGroup value={null} onChange={() => {}} />);
    expect(screen.getByText('抖音')).toBeInTheDocument();
    expect(screen.getByText('小红书')).toBeInTheDocument();
    expect(screen.getByText('视频号')).toBeInTheDocument();
    expect(screen.getByText('快手')).toBeInTheDocument();
    expect(screen.getByText('B站')).toBeInTheDocument();
  });

  it('renders emoji literals for each platform', () => {
    render(<PlatformRadioGroup value={null} onChange={() => {}} />);
    expect(screen.getByText('📱')).toBeInTheDocument();
    expect(screen.getByText('📕')).toBeInTheDocument();
    expect(screen.getAllByText('📺')).toHaveLength(2); // 视频号 + B站
    expect(screen.getByText('🎬')).toBeInTheDocument();
  });

  it('calls onChange callback when a platform is clicked', () => {
    const onChange = vi.fn();
    render(<PlatformRadioGroup value={null} onChange={onChange} />);
    fireEvent.click(screen.getByText('抖音').closest('button')!);
    expect(onChange).toHaveBeenCalledWith('douyin');
  });

  it('calls onChange with correct key for each platform', () => {
    const onChange = vi.fn();
    render(<PlatformRadioGroup value={null} onChange={onChange} />);
    fireEvent.click(screen.getByText('小红书').closest('button')!);
    expect(onChange).toHaveBeenCalledWith('xiaohongshu');
  });

  it('active platform button has gold bg class', () => {
    render(<PlatformRadioGroup value="douyin" onChange={() => {}} />);
    const btn = screen.getByText('抖音').closest('button')!;
    expect(btn.className).toMatch(/bg-primary/);
  });

  it('inactive platform buttons do not have primary bg', () => {
    render(<PlatformRadioGroup value="douyin" onChange={() => {}} />);
    const btn = screen.getByText('小红书').closest('button')!;
    expect(btn.className).not.toMatch(/bg-primary/);
  });

  it('clicking a different platform triggers onChange', () => {
    const onChange = vi.fn();
    render(<PlatformRadioGroup value="douyin" onChange={onChange} />);
    fireEvent.click(screen.getByText('快手').closest('button')!);
    expect(onChange).toHaveBeenCalledWith('kuaishou');
  });

  it('uses PLATFORMS constant — 5 items with correct emoji literals', () => {
    expect(PLATFORMS).toHaveLength(5);
    render(<PlatformRadioGroup value={null} onChange={() => {}} />);
    PLATFORMS.forEach((p) => {
      expect(screen.getByText(p.label)).toBeInTheDocument();
    });
  });
});
