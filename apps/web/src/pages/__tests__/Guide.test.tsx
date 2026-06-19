/**
 * /guide · USER GUIDE · unit tests (sally 1:1 复刻 · mock-first)
 * 断言 chip / 推荐流程 / 13 section / search / 实用技巧 / 常见问题 / 4 FAQ
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import Guide from '@/pages/Guide';

// ── helper ────────────────────────────────────────────────────────────────────

function renderGuide() {
  return render(
    <MemoryRouter>
      <Guide />
    </MemoryRouter>,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Guide · sally 1:1 复刻', () => {
  it('chip · USER GUIDE + subtitle 字面锁', () => {
    renderGuide();
    expect(screen.getByTestId('guide-chip-title')).toHaveTextContent('USER GUIDE');
    expect(screen.getByTestId('guide-chip-subtitle')).toHaveTextContent(
      '产品使用说明 · 功能详解 · 最佳实践',
    );
  });

  it('推荐使用流程 · 5 step name 字面锁', () => {
    renderGuide();
    expect(screen.getByTestId('flow-section')).toBeInTheDocument();
    // use getAllByText as some names also appear in the 14-section accordion
    expect(screen.getAllByText('深度学习').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('设计变现').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('创作内容').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('制作视频').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('私域成交').length).toBeGreaterThanOrEqual(1);
    // verify flow cards render by testid
    expect(screen.getByTestId('flow-card-0')).toBeInTheDocument();
    expect(screen.getByTestId('flow-card-4')).toBeInTheDocument();
  });

  it('search input placeholder 字面锁', () => {
    renderGuide();
    expect(screen.getByTestId('guide-search-input')).toHaveAttribute(
      'placeholder',
      '搜索功能说明...',
    );
  });

  it('13 section name 全部渲染', () => {
    renderGuide();
    const names = [
      '系统概览',
      '爆款库',
      '爆款解析',
      '呈现形式',
      '变现模型',
      '私域成交',
      '爆款生成',
      '生成文案',
      '文案分析',
      'AI视频',
      '深度学习',
      '视频制作',
      '获客视频',
    ];
    // getAllByText used for names that appear multiple times (e.g. 私域成交 is also a FlowCard)
    names.forEach((name) => {
      expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('实用技巧 · 13 个 TipsBox 渲染', () => {
    renderGuide();
    const tipsBoxes = screen.getAllByTestId('tips-box');
    expect(tipsBoxes).toHaveLength(13);
  });

  it('常见问题 · section 字面锁', () => {
    renderGuide();
    expect(screen.getByTestId('faq-section')).toBeInTheDocument();
    expect(screen.getByText('常见问题')).toBeInTheDocument();
  });

  it('4 FAQ Q 字面锁', () => {
    renderGuide();
    expect(screen.getByText('AI生成的内容可以直接使用吗？')).toBeInTheDocument();
    expect(screen.getByText('AI视频功能可以直接生成视频吗？')).toBeInTheDocument();
    expect(screen.getByText('如何让AI更了解我的风格？')).toBeInTheDocument();
    expect(screen.getByText('数据会被保存吗？')).toBeInTheDocument();
  });

  it('search · 过滤 section · 隐藏 FlowSection', () => {
    renderGuide();
    const input = screen.getByTestId('guide-search-input');
    // FlowSection visible initially
    expect(screen.getByTestId('flow-section')).toBeInTheDocument();
    // type a query
    fireEvent.change(input, { target: { value: '爆款库' } });
    // FlowSection hidden when searching
    expect(screen.queryByTestId('flow-section')).not.toBeInTheDocument();
    // only 爆款库 section shows
    expect(screen.getAllByTestId(/^section-accordion-/).length).toBe(1);
  });

  it('accordion toggle · click header closes section', () => {
    renderGuide();
    const firstHeader = screen.getByTestId('section-header-system_overview');
    // body visible by default
    expect(screen.getByTestId('section-body-system_overview')).toBeInTheDocument();
    // click to close
    fireEvent.click(firstHeader);
    expect(screen.queryByTestId('section-body-system_overview')).not.toBeInTheDocument();
    // click to re-open
    fireEvent.click(firstHeader);
    expect(screen.getByTestId('section-body-system_overview')).toBeInTheDocument();
  });
});
