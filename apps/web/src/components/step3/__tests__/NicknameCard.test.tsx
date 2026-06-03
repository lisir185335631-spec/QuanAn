import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NicknameCard, type NicknameEvaluation } from '../NicknameCard';

vi.mock('sonner', () => ({ toast: vi.fn() }));

const MOCK_NICKNAME: NicknameEvaluation = {
  name: '肌肤守护者',
  description: '专注于皮肤管理领域的专业昵称，传递权威感与信任感。',
  psychology: '权威型命名激发用户信任，降低决策阻力。',
  searchability: '「肌肤」「守护」高频搜索词，SEO 友好，易被发现。',
  tags: ['皮肤管理', '专业感', '权威型'],
  hasSparkle: false,
};

const SPARKLE_NICKNAME: NicknameEvaluation = {
  ...MOCK_NICKNAME,
  name: '✨ 美肤达人',
  hasSparkle: true,
};

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe('NicknameCard — content rendering', () => {
  it('renders the nickname name', () => {
    render(<NicknameCard nickname={MOCK_NICKNAME} />);
    expect(screen.getByText('肌肤守护者')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<NicknameCard nickname={MOCK_NICKNAME} />);
    expect(screen.getByText(/专注于皮肤管理领域的专业昵称/)).toBeInTheDocument();
  });

  it('renders psychology label and content', () => {
    render(<NicknameCard nickname={MOCK_NICKNAME} />);
    expect(screen.getByText(/权威型命名激发用户信任/)).toBeInTheDocument();
  });

  it('renders searchability label and content', () => {
    render(<NicknameCard nickname={MOCK_NICKNAME} />);
    expect(screen.getByText(/肌肤.*守护.*高频搜索词/)).toBeInTheDocument();
  });

  it('renders all chip tags', () => {
    render(<NicknameCard nickname={MOCK_NICKNAME} />);
    expect(screen.getByText('皮肤管理')).toBeInTheDocument();
    expect(screen.getByText('专业感')).toBeInTheDocument();
    expect(screen.getByText('权威型')).toBeInTheDocument();
  });
});

describe('NicknameCard — SparkleIcon', () => {
  it('does not render SparkleIcon when hasSparkle=false', () => {
    const { container } = render(<NicknameCard nickname={MOCK_NICKNAME} />);
    // SparkleIcon renders a lucide Sparkles svg inside h4
    const h4 = container.querySelector('h4');
    const svgs = h4?.querySelectorAll('svg');
    expect(svgs?.length ?? 0).toBe(0);
  });

  it('renders SparkleIcon when hasSparkle=true', () => {
    const { container } = render(<NicknameCard nickname={SPARKLE_NICKNAME} />);
    const h4 = container.querySelector('h4');
    const svgs = h4?.querySelectorAll('svg');
    expect(svgs?.length ?? 0).toBeGreaterThan(0);
  });
});

describe('NicknameCard — copy button', () => {
  it('renders a copy button', () => {
    render(<NicknameCard nickname={MOCK_NICKNAME} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls navigator.clipboard.writeText with nickname name on click', async () => {
    render(<NicknameCard nickname={MOCK_NICKNAME} />);
    fireEvent.click(screen.getByRole('button'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('肌肤守护者');
  });

  it('calls toast with "已复制昵称" after copy', async () => {
    const { toast } = await import('sonner');
    render(<NicknameCard nickname={MOCK_NICKNAME} />);
    fireEvent.click(screen.getByRole('button'));
    await Promise.resolve(); // flush microtask
    expect(toast).toHaveBeenCalledWith('已复制昵称');
  });
});
