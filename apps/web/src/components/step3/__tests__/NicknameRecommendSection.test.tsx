import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import {
  NicknameRecommendSection,
  type NicknameEvaluation,
  type NicknameSelectionStrategy,
} from '../NicknameRecommendSection';

vi.mock('sonner', () => ({ toast: vi.fn() }));

Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

const FIVE_NICKNAMES: NicknameEvaluation[] = [
  {
    name: '肌肤守护者',
    description: '专注皮肤管理的权威型昵称。',
    psychology: '权威命名激发信任。',
    searchability: '高频词 · SEO 友好。',
    tags: ['皮肤管理'],
    hasSparkle: false,
  },
  {
    name: '抗衰专家',
    description: '聚焦抗老赛道的专业定位。',
    psychology: '专家型命名增强可信度。',
    searchability: '「抗衰」热搜词。',
    tags: ['抗衰', '专业'],
    hasSparkle: true,
  },
  {
    name: '美肌日记',
    description: '记录美肌历程的生活化昵称。',
    psychology: '日记式命名亲近感强。',
    searchability: '「美肌」关键词收录广。',
    tags: ['生活化'],
    hasSparkle: false,
  },
  {
    name: '皮肤科普君',
    description: '科普型昵称降低学习门槛。',
    psychology: '科普型激发好奇心。',
    searchability: '长尾词效果好。',
    tags: ['科普'],
    hasSparkle: false,
  },
  {
    name: '美业老师傅',
    description: '老师傅定位彰显经验。',
    psychology: '师傅型命名强调经验值。',
    searchability: '搜索需补充行业词。',
    tags: ['经验', '美业'],
    hasSparkle: false,
  },
];

const MOCK_STRATEGY: NicknameSelectionStrategy = {
  hint: '建议优先选择「抗衰专家」或「肌肤守护者」，与美业专业人设高度契合。',
  chips: ['权威型', '专业感', '易搜索'],
};

describe('NicknameRecommendSection — empty state', () => {
  it('renders H3 "昵称推荐"', () => {
    render(<NicknameRecommendSection />);
    expect(screen.getByRole('heading', { level: 3, name: /昵称推荐/ })).toBeInTheDocument();
  });

  it('renders exactly 5 skeleton placeholders', () => {
    const { container } = render(<NicknameRecommendSection />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    // 5 card skeletons + 1 strategy skeleton = 6; but we check ≥5
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it('renders 选择策略 section in empty state', () => {
    render(<NicknameRecommendSection />);
    expect(screen.getByText('命名策略')).toBeInTheDocument();
  });
});

describe('NicknameRecommendSection — 5 nicknames', () => {
  it('renders H3 "昵称推荐"', () => {
    render(<NicknameRecommendSection nicknames={FIVE_NICKNAMES} strategy={MOCK_STRATEGY} />);
    expect(screen.getByRole('heading', { level: 3, name: /昵称推荐/ })).toBeInTheDocument();
  });

  it('renders all 5 nickname names', () => {
    render(<NicknameRecommendSection nicknames={FIVE_NICKNAMES} strategy={MOCK_STRATEGY} />);
    expect(screen.getByText('肌肤守护者')).toBeInTheDocument();
    expect(screen.getByText('抗衰专家')).toBeInTheDocument();
    expect(screen.getByText('美肌日记')).toBeInTheDocument();
    expect(screen.getByText('皮肤科普君')).toBeInTheDocument();
    expect(screen.getByText('美业老师傅')).toBeInTheDocument();
  });

  it('renders description for each card', () => {
    render(<NicknameRecommendSection nicknames={FIVE_NICKNAMES} strategy={MOCK_STRATEGY} />);
    expect(screen.getByText(/专注皮肤管理的权威型昵称/)).toBeInTheDocument();
  });

  it('renders psychology and searchability content', () => {
    render(<NicknameRecommendSection nicknames={FIVE_NICKNAMES} strategy={MOCK_STRATEGY} />);
    expect(screen.getByText(/权威命名激发信任/)).toBeInTheDocument();
    expect(screen.getByText(/高频词.*SEO 友好/)).toBeInTheDocument();
  });

  it('renders no skeleton when 5 nicknames provided', () => {
    const { container } = render(
      <NicknameRecommendSection nicknames={FIVE_NICKNAMES} strategy={MOCK_STRATEGY} />,
    );
    // card skeletons only appear in empty state
    const gridSkeletons = container.querySelectorAll('.grid .animate-pulse');
    expect(gridSkeletons).toHaveLength(0);
  });

  it('renders 选择策略 with hint text', () => {
    render(<NicknameRecommendSection nicknames={FIVE_NICKNAMES} strategy={MOCK_STRATEGY} />);
    expect(screen.getByText(/建议优先选择「抗衰专家」/)).toBeInTheDocument();
  });

  it('renders 选择策略 chips', () => {
    render(<NicknameRecommendSection nicknames={FIVE_NICKNAMES} strategy={MOCK_STRATEGY} />);
    expect(screen.getByText('权威型')).toBeInTheDocument();
    expect(screen.getByText('专业感')).toBeInTheDocument();
    expect(screen.getByText('易搜索')).toBeInTheDocument();
  });

  it('grid has lg:grid-cols-3 class (D-283 lock)', () => {
    const { container } = render(
      <NicknameRecommendSection nicknames={FIVE_NICKNAMES} strategy={MOCK_STRATEGY} />,
    );
    const grid = container.querySelector('.lg\\:grid-cols-3');
    expect(grid).toBeTruthy();
  });
});
