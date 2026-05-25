/**
 * DeepLearning.test.tsx — /tools/deep-learning · 1:1 复刻单测
 * mock-first · 0 trpc · 0 backend
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import DeepLearning from '@/pages/tools/DeepLearning';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <DeepLearning />
    </MemoryRouter>,
  );
}

describe('DeepLearning · header 字面锁', () => {
  it('chip 显示 "深度学习"', () => {
    renderPage();
    expect(screen.getByTestId('deep-learning-chip')).toBeInTheDocument();
    expect(screen.getByTestId('deep-learning-chip')).toHaveTextContent('深度学习');
  });

  it('h1 显示 "文案深度学习"', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('文案深度学习');
  });

  it('subtitle 含关键词 "深度分析文案逻辑、包装风格"', () => {
    renderPage();
    const subtitle = screen.getByTestId('deep-learning-subtitle');
    expect(subtitle).toHaveTextContent('深度分析文案逻辑、包装风格');
  });
});

describe('DeepLearning · form 字面锁', () => {
  it('2 tab "上传文件" / "粘贴文案" 均出现', () => {
    renderPage();
    expect(screen.getByTestId('tab-upload')).toHaveTextContent('上传文件');
    expect(screen.getByTestId('tab-paste')).toHaveTextContent('粘贴文案');
  });

  it('主 CTA 含 "开始深度学习"', () => {
    renderPage();
    expect(screen.getByTestId('start-learning-btn')).toHaveTextContent('开始深度学习');
  });
});

describe('DeepLearning · 学习档案 mock', () => {
  it('标题 "学习档案 (1)" 出现', () => {
    renderPage();
    expect(screen.getByTestId('archives-heading')).toHaveTextContent('学习档案 (1)');
  });

  it('档案标题 "文案学习 2026/5/25 (1篇)" 出现', () => {
    renderPage();
    expect(screen.getByTestId('archive-title')).toHaveTextContent('文案学习 2026/5/25 (1篇)');
  });

  it('"已完成" chip 出现', () => {
    renderPage();
    expect(screen.getByTestId('archive-done-chip')).toHaveTextContent('已完成');
  });

  it('展开状态：风格画像 / 文案逻辑 / 包装风格 / 精华片段 (4) 各出现', () => {
    renderPage();
    // default expanded=true in ArchiveCard
    expect(screen.getByTestId('style-portrait-section')).toBeInTheDocument();
    expect(screen.getByTestId('logic-grid-section')).toBeInTheDocument();
    expect(screen.getByTestId('packaging-grid-section')).toBeInTheDocument();
    expect(screen.getByTestId('highlights-section')).toBeInTheDocument();
    expect(screen.getByTestId('highlights-section')).toHaveTextContent('精华片段 (4)');
  });

  it('风格画像含关键词 "智者型"', () => {
    renderPage();
    expect(screen.getByTestId('style-portrait-body')).toHaveTextContent('智者型');
  });

  it('4 quote keyword "为什么美业老板" 出现', () => {
    renderPage();
    expect(screen.getByTestId('highlight-quote-0')).toHaveTextContent('为什么美业老板');
  });

  it('toggle 折叠后 expanded content 消失', () => {
    renderPage();
    // 先确认展开
    expect(screen.getByTestId('archive-expanded')).toBeInTheDocument();
    // 点 toggle 折叠
    fireEvent.click(screen.getByTestId('archive-toggle-btn'));
    expect(screen.queryByTestId('archive-expanded')).not.toBeInTheDocument();
  });
});

describe('DeepLearning · 使用说明 字面锁', () => {
  it('使用说明 card 出现', () => {
    renderPage();
    expect(screen.getByTestId('usage-instructions')).toBeInTheDocument();
    expect(screen.getByTestId('usage-instructions-title')).toHaveTextContent('使用说明');
  });

  it('3 section title 出现：文件上传模式 / 文案粘贴模式 / 通用说明', () => {
    renderPage();
    expect(screen.getByTestId('usage-section-title-0')).toHaveTextContent('文件上传模式：');
    expect(screen.getByTestId('usage-section-title-1')).toHaveTextContent('文案粘贴模式：');
    expect(screen.getByTestId('usage-section-title-2')).toHaveTextContent('通用说明：');
  });
});
