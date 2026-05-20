/**
 * PRD-23 US-005 · Analysis unit tests (D-233)
 * AC-5: ≥ 4 tests · H1 字面 / 副标题 / 字符计数 / disabled / enabled / 5 H3 stub
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import Analysis from '@/pages/tools/Analysis';

function renderAnalysis() {
  return render(
    <MemoryRouter>
      <Analysis />
    </MemoryRouter>,
  );
}

describe('Analysis', () => {
  it('AC-1 · H1 字面锁 "文案结构分析"', () => {
    renderAnalysis();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('文案结构分析');
  });

  it('AC-1 · 副标题包含"多维度深度分析"', () => {
    renderAnalysis();
    expect(screen.getByText(/多维度深度分析/)).toBeInTheDocument();
  });

  it('AC-2 · 初始字符计数显示 "0 字"', () => {
    renderAnalysis();
    expect(screen.getByTestId('char-count')).toHaveTextContent('0 字');
  });

  it('AC-2 · 输入后字符计数更新', () => {
    renderAnalysis();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '测试文案内容' } });
    expect(screen.getByTestId('char-count')).toHaveTextContent('6 字');
  });

  it('AC-3 · CTA "开始分析" 初始 disabled (text < 10 字)', () => {
    renderAnalysis();
    expect(screen.getByRole('button', { name: '开始分析' })).toBeDisabled();
  });

  it('AC-3 · text ≥ 10 字 → CTA enabled', () => {
    renderAnalysis();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '这是一段超过十个字的短视频文案测试内容' } });
    expect(screen.getByRole('button', { name: '开始分析' })).not.toBeDisabled();
  });

  it('AC-4 · 提交后渲染 5 H3 stub 区块(字面锁)', () => {
    renderAnalysis();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '这是一段超过十个字的短视频文案测试内容' } });
    fireEvent.click(screen.getByRole('button', { name: '开始分析' }));

    expect(screen.getByRole('heading', { level: 3, name: '结构拆解' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '节奏分析' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '爆款元素识别' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '多维评分' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '优化建议' })).toBeInTheDocument();
  });
});
