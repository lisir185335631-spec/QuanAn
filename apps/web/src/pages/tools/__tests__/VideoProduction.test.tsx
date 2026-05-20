/**
 * PRD-23 US-006 · VideoProduction unit tests (D-233)
 * AC-5: ≥ 4 tests · H1 字面 / 副标题 / CTA disabled→enabled / 4 H3 stub
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import VideoProduction from '@/pages/tools/VideoProduction';

function renderVideoProduction() {
  return render(
    <MemoryRouter>
      <VideoProduction />
    </MemoryRouter>,
  );
}

describe('VideoProduction', () => {
  it('AC-1 · H1 字面锁 "短视频一键制作"', () => {
    renderVideoProduction();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('短视频一键制作');
  });

  it('AC-1 · 副标题包含 "AI 自动生成分镜脚本、拍摄方案、口播提词器和剪辑指导"', () => {
    renderVideoProduction();
    expect(screen.getByText(/AI 自动生成分镜脚本、拍摄方案、口播提词器和剪辑指导/)).toBeInTheDocument();
  });

  it('AC-3 · CTA "生成制作方案" 初始 disabled (text < 10 字)', () => {
    renderVideoProduction();
    expect(screen.getByRole('button', { name: '生成制作方案' })).toBeDisabled();
  });

  it('AC-3 · text ≥ 10 字 → CTA enabled', () => {
    renderVideoProduction();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '这是一段超过十个字的短视频文案测试内容' } });
    expect(screen.getByRole('button', { name: '生成制作方案' })).not.toBeDisabled();
  });

  it('AC-4 · 提交后渲染 4 H3 stub 区块(字面锁)', () => {
    renderVideoProduction();
    const textarea = screen.getByPlaceholderText(/至少 10 个字/);
    fireEvent.change(textarea, { target: { value: '这是一段超过十个字的短视频文案测试内容' } });
    fireEvent.click(screen.getByRole('button', { name: '生成制作方案' }));

    expect(screen.getByRole('heading', { level: 3, name: '分镜脚本' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '拍摄方案' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '口播提词器' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '剪辑指导' })).toBeInTheDocument();
  });
});
