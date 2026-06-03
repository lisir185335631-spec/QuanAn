import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  IntroCopyPlatformCard,
  type IntroCopyEntry,
} from '../IntroCopyPlatformCard';

vi.mock('sonner', () => ({ toast: vi.fn() }));

const MOCK_ENTRY: IntroCopyEntry = {
  platformKey: 'douyin_main',
  platformLabel: '抖音主号',
  copy: '10年美容师 | 皮肤管理专家 | 专注抗衰与修复 | 每周分享真实案例与护肤秘籍',
  hashtags: ['皮肤管理', '抗衰', '美容师'],
  evaluation: '简洁有力，专业感强，适合抖音算法推荐',
};

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Placeholder / empty state
// ──────────────────────────────────────────────────────────────────────────────
describe('IntroCopyPlatformCard — placeholder state', () => {
  it('renders placeholderLabel when no entry provided', () => {
    render(<IntroCopyPlatformCard placeholderLabel="抖音主号" />);
    expect(screen.getByText('抖音主号')).toBeInTheDocument();
  });

  it('renders animate-pulse skeleton', () => {
    const { container } = render(<IntroCopyPlatformCard />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Content rendering
// ──────────────────────────────────────────────────────────────────────────────
describe('IntroCopyPlatformCard — content rendering', () => {
  it('renders platform label', () => {
    render(<IntroCopyPlatformCard entry={MOCK_ENTRY} />);
    expect(screen.getByText('抖音主号')).toBeInTheDocument();
  });

  it('renders copy text', () => {
    render(<IntroCopyPlatformCard entry={MOCK_ENTRY} />);
    expect(screen.getByText(/10年美容师/)).toBeInTheDocument();
  });

  it('renders hashtag chips with # prefix (AC-5)', () => {
    render(<IntroCopyPlatformCard entry={MOCK_ENTRY} />);
    expect(screen.getByText('#皮肤管理')).toBeInTheDocument();
    expect(screen.getByText('#抗衰')).toBeInTheDocument();
    expect(screen.getByText('#美容师')).toBeInTheDocument();
  });

  it('hashtag chips use brand-blue #002fa7 (AC-5)', () => {
    render(<IntroCopyPlatformCard entry={MOCK_ENTRY} />);
    const chip = screen.getByText('#美容师');
    expect(chip.className).toContain('002fa7');
  });

  it('renders evaluation text', () => {
    render(<IntroCopyPlatformCard entry={MOCK_ENTRY} />);
    expect(screen.getByText(/简洁有力，专业感强/)).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Copy button — AC-6
// ──────────────────────────────────────────────────────────────────────────────
describe('IntroCopyPlatformCard — copy button (AC-6)', () => {
  it('renders a copy button', () => {
    render(<IntroCopyPlatformCard entry={MOCK_ENTRY} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls navigator.clipboard.writeText with the copy field on click', () => {
    render(<IntroCopyPlatformCard entry={MOCK_ENTRY} />);
    fireEvent.click(screen.getByRole('button'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(MOCK_ENTRY.copy);
  });

  it('calls toast with "已复制 {platformLabel} 简介文案" after copy', async () => {
    const { toast } = await import('sonner');
    render(<IntroCopyPlatformCard entry={MOCK_ENTRY} />);
    fireEvent.click(screen.getByRole('button'));
    await Promise.resolve();
    expect(toast).toHaveBeenCalledWith('已复制 抖音主号 简介文案');
  });
});
