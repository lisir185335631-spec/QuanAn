/**
 * AiVideo.test.tsx — /ai-video STORYBOARD 1:1 复刻单测
 * mock-first · 0 backend · 0 trpc mock needed
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import AiVideo from '@/pages/tools/AiVideo';

// sonner toast 不影响测试 · 不 mock
function renderPage() {
  return render(
    <MemoryRouter>
      <AiVideo />
    </MemoryRouter>,
  );
}

describe('AiVideo · form 态(default)', () => {
  it('renders STORYBOARD chip with subtitle', () => {
    renderPage();
    expect(screen.getByText('STORYBOARD')).toBeInTheDocument();
    expect(screen.getByText('专业分镜表生成器 · 文案一键转拍摄方案')).toBeInTheDocument();
  });

  it('renders 5 platform cards', () => {
    renderPage();
    expect(screen.getByTestId('platform-card-douyin')).toBeInTheDocument();
    expect(screen.getByTestId('platform-card-kuaishou')).toBeInTheDocument();
    expect(screen.getByTestId('platform-card-xiaohongshu')).toBeInTheDocument();
    expect(screen.getByTestId('platform-card-bilibili')).toBeInTheDocument();
    expect(screen.getByTestId('platform-card-wechat_video')).toBeInTheDocument();
  });

  it('renders 6 video type cards', () => {
    renderPage();
    expect(screen.getByTestId('video-type-card-monologue')).toBeInTheDocument();
    expect(screen.getByTestId('video-type-card-plot')).toBeInTheDocument();
    expect(screen.getByTestId('video-type-card-vlog')).toBeInTheDocument();
    expect(screen.getByTestId('video-type-card-product')).toBeInTheDocument();
    expect(screen.getByTestId('video-type-card-interview')).toBeInTheDocument();
    expect(screen.getByTestId('video-type-card-tutorial')).toBeInTheDocument();
  });

  it('renders main CTA button', () => {
    renderPage();
    expect(screen.getByTestId('ai-video-cta')).toBeInTheDocument();
    expect(screen.getByText('一键生成专业分镜表')).toBeInTheDocument();
  });

  it('renders empty placeholder card with H3 and 4 bullets', () => {
    renderPage();
    expect(screen.getByTestId('ai-video-empty-card')).toBeInTheDocument();
    // H3 · 注意 STORYBOARD chip 副标题也含 "专业分镜表生成器" 子串
    const h3Elements = screen.getAllByText('专业分镜表生成器');
    expect(h3Elements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('输入文案 → AI生成6-12个专业分镜')).toBeInTheDocument();
    expect(screen.getByText('每个分镜包含：景别、角度、运镜、情绪、台词')).toBeInTheDocument();
    expect(screen.getByText('支持5大平台 × 6种视频类型')).toBeInTheDocument();
    expect(screen.getByText('一键导出CSV分镜表，直接交给团队执行')).toBeInTheDocument();
  });

  it('textarea defaults to demo script (non-empty) and shows char count', () => {
    renderPage();
    const textarea = screen.getByTestId('ai-video-textarea') as HTMLTextAreaElement;
    expect(textarea.value.length).toBeGreaterThan(0);
    // char count display
    const charCount = screen.getByTestId('ai-video-char-count');
    expect(charCount.textContent).toMatch(/\d+\/5000/);
  });
});

describe('AiVideo · result 态(点 CTA 后)', () => {
  it('shows result title card + restart button after clicking CTA', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('ai-video-cta'));
    expect(screen.getByTestId('result-title-card')).toBeInTheDocument();
    expect(screen.getByText('美业老板的秘密：AI赋能还是人情味？')).toBeInTheDocument();
    expect(screen.getByText('110秒')).toBeInTheDocument();
    expect(screen.getByText('10个分镜')).toBeInTheDocument();
    expect(screen.getByTestId('ai-video-restart')).toBeInTheDocument();
    expect(screen.getByText('清空记录，重新开始')).toBeInTheDocument();
  });

  it('shows 10 SHOT cards in result', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('ai-video-cta'));
    for (let i = 1; i <= 10; i++) {
      const num = String(i).padStart(2, '0');
      expect(screen.getByTestId(`shot-card-${num}`)).toBeInTheDocument();
    }
  });

  it('shows timeline bar with 10 segments', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('ai-video-cta'));
    expect(screen.getByTestId('ai-video-timeline')).toBeInTheDocument();
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByTestId(`timeline-seg-${i}`)).toBeInTheDocument();
    }
  });

  it('shows 3 advice cards', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('ai-video-cta'));
    expect(screen.getByTestId('advice-card-shooting')).toBeInTheDocument();
    expect(screen.getByTestId('advice-card-editing')).toBeInTheDocument();
    expect(screen.getByTestId('advice-card-music')).toBeInTheDocument();
    expect(screen.getByText('拍摄建议：')).toBeInTheDocument();
    expect(screen.getByText('剪辑要点：')).toBeInTheDocument();
    expect(screen.getByText('音乐建议：')).toBeInTheDocument();
  });

  it('restart button hides result and shows empty card again', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('ai-video-cta'));
    expect(screen.getByTestId('result-title-card')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('ai-video-restart'));
    expect(screen.queryByTestId('result-title-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('ai-video-empty-card')).toBeInTheDocument();
  });
});
