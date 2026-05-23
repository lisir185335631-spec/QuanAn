import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { OverallStrategySection, type OverallStrategyContent } from '../OverallStrategySection';

const MOCK_CONTENT: OverallStrategyContent = {
  视觉统一性: '统一使用金色+深色底色的视觉体系，头像、封面、背景图保持同一色调风格。',
  第一印象设计: '用户进入主页的前3秒决定是否关注，确保头图、昵称、简介三位一体。',
  内容封面与简介公益策略: '封面统一模板设计，简介采用"身份+价值+号召"公式，突出差异化定位。',
  内容创意建议: '围绕目标受众痛点创作，结合热点话题，保持每周3-5条稳定更新频率。',
};

// ──────────────────────────────────────────────────────────────────────────────
// H3
// ──────────────────────────────────────────────────────────────────────────────
describe('OverallStrategySection — H3', () => {
  it('renders H3 "整体包装策略"', () => {
    render(<OverallStrategySection />);
    expect(
      screen.getByRole('heading', { level: 3, name: /整体包装策略/ }),
    ).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// D-290 锁: 4 sub-section 字面顺序
// ──────────────────────────────────────────────────────────────────────────────
describe('OverallStrategySection — 4 sub-section labels (D-290 lock)', () => {
  it('renders all 4 sub-section labels', () => {
    render(<OverallStrategySection />);
    expect(screen.getByText('视觉统一性')).toBeInTheDocument();
    expect(screen.getByText('第一印象设计')).toBeInTheDocument();
    expect(screen.getByText('内容封面与简介公益策略')).toBeInTheDocument();
    expect(screen.getByText('内容创意建议')).toBeInTheDocument();
  });

  it('renders sub-section labels in correct order (D-290 顺序锁)', () => {
    const { container } = render(<OverallStrategySection />);
    const labels = container.querySelectorAll('p.text-xs.font-semibold');
    const texts = Array.from(labels).map((el) => el.textContent);
    expect(texts[0]).toBe('视觉统一性');
    expect(texts[1]).toBe('第一印象设计');
    expect(texts[2]).toBe('内容封面与简介公益策略');
    expect(texts[3]).toBe('内容创意建议');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// AC-3: 无 action button
// ──────────────────────────────────────────────────────────────────────────────
describe('OverallStrategySection — no action button (AC-3)', () => {
  it('renders no button elements', () => {
    const { container } = render(<OverallStrategySection content={MOCK_CONTENT} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// AC-4: empty state placeholder (content === null)
// ──────────────────────────────────────────────────────────────────────────────
describe('OverallStrategySection — empty state (AC-4)', () => {
  it('renders empty state text when content is null', () => {
    render(<OverallStrategySection content={null} />);
    expect(
      screen.getByText('暂无内容 · 点击"生成账号包装方案"开始'),
    ).toBeInTheDocument();
  });

  it('still renders H3 in empty state', () => {
    render(<OverallStrategySection content={null} />);
    expect(
      screen.getByRole('heading', { level: 3, name: /整体包装策略/ }),
    ).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Skeleton state (content === undefined)
// ──────────────────────────────────────────────────────────────────────────────
describe('OverallStrategySection — skeleton state (content undefined)', () => {
  it('renders animate-pulse skeletons when no content provided', () => {
    const { container } = render(<OverallStrategySection />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Content rendering
// ──────────────────────────────────────────────────────────────────────────────
describe('OverallStrategySection — content rendering', () => {
  it('renders all 4 sub-section descriptions when content provided', () => {
    render(<OverallStrategySection content={MOCK_CONTENT} />);
    expect(screen.getByText(MOCK_CONTENT.视觉统一性!)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CONTENT.第一印象设计!)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CONTENT['内容封面与简介公益策略']!)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CONTENT.内容创意建议!)).toBeInTheDocument();
  });

  it('renders no skeleton when content is provided', () => {
    const { container } = render(<OverallStrategySection content={MOCK_CONTENT} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(0);
  });
});
