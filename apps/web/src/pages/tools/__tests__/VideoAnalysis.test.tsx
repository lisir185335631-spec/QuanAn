/**
 * PRD-23 US-004 · VideoAnalysis unit tests
 * AC-6: ≥ 4 tests · H1 字面 / 表单 disabled / ≥ 10 字 enabled / 输出 5 H3
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import VideoAnalysis from '@/pages/tools/VideoAnalysis';

function renderVideoAnalysis() {
  return render(
    <MemoryRouter>
      <VideoAnalysis />
    </MemoryRouter>,
  );
}

describe('VideoAnalysis', () => {
  it('AC-1 · H1 字面锁 "爆款文案解析"', () => {
    renderVideoAnalysis();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款文案解析');
  });

  it('AC-1 · 副标题包含 "AI 将深度拆解爆款密码，支持一键仿写"', () => {
    renderVideoAnalysis();
    expect(screen.getByText(/AI 将深度拆解爆款密码，支持一键仿写/)).toBeInTheDocument();
  });

  it('AC-4 · CTA "开始深度解析" 初始 disabled (copy < 10 字)', () => {
    renderVideoAnalysis();
    expect(screen.getByRole('button', { name: '开始深度解析' })).toBeDisabled();
  });

  it('AC-4 · copy ≥ 10 字 → CTA enabled', () => {
    renderVideoAnalysis();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '这是一段超过十个字的视频文案内容测试' } });
    expect(screen.getByRole('button', { name: '开始深度解析' })).not.toBeDisabled();
  });

  it('AC-5 · 提交后渲染 5 H3 stub 输出区块', () => {
    renderVideoAnalysis();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '这是一段超过十个字的视频文案内容测试' } });
    fireEvent.click(screen.getByRole('button', { name: '开始深度解析' }));

    expect(screen.getByRole('heading', { level: 3, name: '钩子拆解' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '结构分析' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '爆款元素识别' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '多维评分' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '一键仿写' })).toBeInTheDocument();
  });
});
