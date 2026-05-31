/**
 * VideoAnalysis.test.tsx — mock-first · 字面锁断言
 * 旧 trpc.videoAnalysis.analyze 版整体重写
 * (PRD-29.16 已把 /video-analysis 克隆为 mock-first · 此前 trpc 旧测试未同步 → 9 fail)
 * 断言 h1 / 副标题 / 使用方法 / 默认表单 / CTA / 3 解析 section / 爆款元素+公式 / 一键仿写 / 反馈
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import VideoAnalysis from '@/pages/tools/VideoAnalysis';

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <VideoAnalysis />
    </MemoryRouter>,
  );
}

describe('VideoAnalysis', () => {
  it('h1 字面锁 "爆款文案解析"', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('爆款文案解析');
  });

  it('副标题关键词 深度拆解 + 一键仿写', () => {
    renderPage();
    expect(screen.getByText('深度拆解')).toBeInTheDocument();
    // "一键仿写" 同时出现在副标题 span 与仿写 section h3 → getAllByText
    expect(screen.getAllByText('一键仿写').length).toBeGreaterThanOrEqual(1);
  });

  it('使用方法 highlight 可见', () => {
    renderPage();
    expect(screen.getByText(/使用方法/)).toBeInTheDocument();
  });

  it('表单 · 视频标题 placeholder + 默认 content 预填', () => {
    renderPage();
    expect(screen.getByPlaceholderText('视频标题（选填）')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/希望了解爆款的奥秘/)).toBeInTheDocument();
  });

  it('CTA "开始深度解析" 可见且默认 enabled(content 非空)', () => {
    renderPage();
    const btn = screen.getByRole('button', { name: /开始深度解析/ });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('解析 section · 选题策略分析 / 钩子分析 / 叙事结构', () => {
    renderPage();
    expect(screen.getByText(/选题策略分析/)).toBeInTheDocument();
    expect(screen.getByText(/钩子分析/)).toBeInTheDocument();
    expect(screen.getByText(/叙事结构/)).toBeInTheDocument();
  });

  it('选题/叙事 mock 字面 · 测试与探索 / 声明式', () => {
    renderPage();
    expect(screen.getByText('测试与探索')).toBeInTheDocument();
    expect(screen.getByText(/声明式/)).toBeInTheDocument();
  });

  it('爆款元素运用 + 爆款公式提炼 + 元素名 身份认同/好奇心', () => {
    renderPage();
    expect(screen.getByText(/爆款元素运用/)).toBeInTheDocument();
    expect(screen.getByText(/爆款公式提炼/)).toBeInTheDocument();
    expect(screen.getByText('身份认同')).toBeInTheDocument();
    expect(screen.getByText('好奇心')).toBeInTheDocument();
  });

  it('一键仿写 section · 生成按钮 + 仿写结果 mock 字面', () => {
    renderPage();
    expect(screen.getByText(/生成仿写文案/)).toBeInTheDocument();
    // "一眼假" 出现在仿写标题与正文 body → getAllByText
    expect(screen.getAllByText(/一眼假/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/#短视频爆款/)).toBeInTheDocument();
  });

  it('反馈 "有帮助吗？"', () => {
    renderPage();
    expect(screen.getByText(/有帮助吗/)).toBeInTheDocument();
  });
});
