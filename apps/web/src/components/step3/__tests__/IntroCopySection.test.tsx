import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { IntroCopySection, type IntroCopyEntry } from '../IntroCopySection';

vi.mock('sonner', () => ({ toast: vi.fn() }));

Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

const SIX_ENTRIES: IntroCopyEntry[] = [
  {
    platformKey: 'douyin_main',
    platformLabel: '抖音主号',
    copy: '10年美容师 | 皮肤管理专家 | 专注抗衰与修复',
    hashtags: ['皮肤管理', '抗衰'],
    evaluation: '专业感强，适合抖音算法',
  },
  {
    platformKey: 'douyin_sub',
    platformLabel: '抖音副号',
    copy: '美容师的日常 | 护肤小技巧 | 真实案例分享',
    hashtags: ['护肤', '日常'],
    evaluation: '生活化，增强亲近感',
  },
  {
    platformKey: 'xiaohongshu_knowledge',
    platformLabel: '小红书干货博主',
    copy: '皮肤科医生推荐 | 10年美容师 | 专业护肤指南',
    hashtags: ['护肤干货', '专业'],
    evaluation: '权威型，适合小红书干货内容',
  },
  {
    platformKey: 'xiaohongshu_personal',
    platformLabel: '小红书个人IP',
    copy: '美容师 | 皮肤管理爱好者 | 记录真实蜕变之路',
    hashtags: ['个人IP', '蜕变'],
    evaluation: '个人化，强调真实性',
  },
  {
    platformKey: 'shipinhao_quality',
    platformLabel: '视频号品质创业',
    copy: '10年美容行业 | 皮肤管理创业者 | 专注品质服务',
    hashtags: ['创业', '品质'],
    evaluation: '商务感，适合品质创业定位',
  },
  {
    platformKey: 'shipinhao_life',
    platformLabel: '视频号个人生活',
    copy: '美容师妈妈 | 分享皮肤管理经验 | 记录美好生活',
    hashtags: ['生活', '家庭'],
    evaluation: '生活化，强调家庭温度',
  },
];

const MOCK_FORMULA = '[身份定位] | [核心价值] | [目标受众] | [行动号召]';

// ──────────────────────────────────────────────────────────────────────────────
// H3
// ──────────────────────────────────────────────────────────────────────────────
describe('IntroCopySection — H3', () => {
  it('renders H3 "简介文案方案"', () => {
    render(<IntroCopySection />);
    expect(
      screen.getByRole('heading', { level: 3, name: /简介文案方案/ }),
    ).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 简介公式 SubCard — AC-3
// ──────────────────────────────────────────────────────────────────────────────
describe('IntroCopySection — 简介公式 SubCard (AC-3)', () => {
  it('renders ★ 简介公式 label', () => {
    render(<IntroCopySection />);
    expect(screen.getByText('★ 简介公式')).toBeInTheDocument();
  });

  it('renders formula text when provided', () => {
    render(<IntroCopySection formula={MOCK_FORMULA} />);
    expect(screen.getByText(MOCK_FORMULA)).toBeInTheDocument();
  });

  it('renders skeleton when formula not provided', () => {
    const { container } = render(<IntroCopySection />);
    // formula SubCard has animate-pulse inside
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Empty state — AC-7: 6 placeholder cards
// ──────────────────────────────────────────────────────────────────────────────
describe('IntroCopySection — empty state (AC-7)', () => {
  it('renders all 6 platform placeholder labels', () => {
    render(<IntroCopySection />);
    expect(screen.getByText('抖音主号')).toBeInTheDocument();
    expect(screen.getByText('抖音副号')).toBeInTheDocument();
    expect(screen.getByText('小红书干货博主')).toBeInTheDocument();
    expect(screen.getByText('小红书个人IP')).toBeInTheDocument();
    expect(screen.getByText('视频号品质创业')).toBeInTheDocument();
    expect(screen.getByText('视频号个人生活')).toBeInTheDocument();
  });

  it('renders animate-pulse for each placeholder card', () => {
    const { container } = render(<IntroCopySection />);
    const pulseCards = container.querySelectorAll('.animate-pulse');
    // 6 placeholder cards + 1 formula skeleton = 7
    expect(pulseCards.length).toBeGreaterThanOrEqual(6);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6 platform grid — AC-4: md:grid-cols-2
// ──────────────────────────────────────────────────────────────────────────────
describe('IntroCopySection — 6 platform grid (AC-4)', () => {
  it('grid has md:grid-cols-2 class (D-289 lock)', () => {
    const { container } = render(<IntroCopySection entries={SIX_ENTRIES} formula={MOCK_FORMULA} />);
    const grid = container.querySelector('.md\\:grid-cols-2');
    expect(grid).toBeTruthy();
  });

  it('renders all 6 platform labels when entries provided', () => {
    render(<IntroCopySection entries={SIX_ENTRIES} formula={MOCK_FORMULA} />);
    expect(screen.getByText('抖音主号')).toBeInTheDocument();
    expect(screen.getByText('抖音副号')).toBeInTheDocument();
    expect(screen.getByText('小红书干货博主')).toBeInTheDocument();
    expect(screen.getByText('小红书个人IP')).toBeInTheDocument();
    expect(screen.getByText('视频号品质创业')).toBeInTheDocument();
    expect(screen.getByText('视频号个人生活')).toBeInTheDocument();
  });

  it('renders hashtag chips with # prefix (AC-5)', () => {
    render(<IntroCopySection entries={SIX_ENTRIES} formula={MOCK_FORMULA} />);
    expect(screen.getByText('#皮肤管理')).toBeInTheDocument();
    expect(screen.getByText('#抗衰')).toBeInTheDocument();
    expect(screen.getByText('#护肤')).toBeInTheDocument();
  });

  it('renders no skeleton cards when entries are provided', () => {
    const { container } = render(
      <IntroCopySection entries={SIX_ENTRIES} formula={MOCK_FORMULA} />,
    );
    const pulseCards = container.querySelectorAll('.grid .animate-pulse');
    expect(pulseCards).toHaveLength(0);
  });
});
