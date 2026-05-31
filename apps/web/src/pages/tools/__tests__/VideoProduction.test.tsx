/**
 * VideoProduction.test.tsx — mock-first · 字面锁断言
 * 旧 trpc.videoProduction.generate 版整体重写 → 断言 h1 / subtitle / 默认文案 /
 * 分镜脚本 / 拍摄方案 / 口播提词器 / 配乐建议 / 剪辑要点 / 反馈
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  VIDEO_PRODUCTION_BGM,
  VIDEO_PRODUCTION_BGM_TITLE,
  VIDEO_PRODUCTION_DEFAULT_COPY,
  VIDEO_PRODUCTION_EDITING,
  VIDEO_PRODUCTION_EDITING_TITLE,
  VIDEO_PRODUCTION_FEEDBACK_PROMPT,
  VIDEO_PRODUCTION_H1,
  VIDEO_PRODUCTION_SHOOTING_TITLE,
  VIDEO_PRODUCTION_STORYBOARD_TITLE,
  VIDEO_PRODUCTION_SUBTITLE,
  VIDEO_PRODUCTION_TELEPROMPTER_TITLE,
} from '@/lib/constants/video-production';
import VideoProduction from '@/pages/tools/VideoProduction';

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <VideoProduction />
    </MemoryRouter>,
  );
}

describe('VideoProduction', () => {
  it('h1 字面锁 "短视频一键制作"', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(VIDEO_PRODUCTION_H1);
  });

  it('subtitle 字面锁', () => {
    renderPage();
    expect(screen.getByText(VIDEO_PRODUCTION_SUBTITLE)).toBeInTheDocument();
  });

  it('CTA button "生成制作方案" enabled', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /生成制作方案/ })).toBeInTheDocument();
  });

  it('默认文案 prefilled', () => {
    renderPage();
    expect(screen.getByRole('textbox')).toHaveValue(VIDEO_PRODUCTION_DEFAULT_COPY);
  });

  it('5 section 标题全部可见', () => {
    renderPage();
    expect(screen.getByText(VIDEO_PRODUCTION_STORYBOARD_TITLE)).toBeInTheDocument();
    expect(screen.getByText(VIDEO_PRODUCTION_SHOOTING_TITLE)).toBeInTheDocument();
    expect(screen.getByText(VIDEO_PRODUCTION_TELEPROMPTER_TITLE)).toBeInTheDocument();
    expect(screen.getByText(VIDEO_PRODUCTION_BGM_TITLE)).toBeInTheDocument();
    expect(screen.getByText(VIDEO_PRODUCTION_EDITING_TITLE)).toBeInTheDocument();
  });

  it('分镜:场景 1 + time 0:00-0:03', () => {
    renderPage();
    expect(screen.getAllByText('场景 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('0:00-0:03')).toBeInTheDocument();
  });

  it('分镜:场景 14 + time 1:14-1:18', () => {
    renderPage();
    expect(screen.getAllByText('场景 14').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1:14-1:18')).toBeInTheDocument();
  });

  it('分镜:场景 1 voiceover 字面（也在提词器出现 → getAllByText）', () => {
    renderPage();
    expect(
      screen.getAllByText(
        '（BGM起，略带神秘感）你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；',
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('拍摄方案:设备项 "手机（iPhone 15 Pro Max或同级别安卓旗舰）"', () => {
    renderPage();
    expect(
      screen.getByText('手机（iPhone 15 Pro Max或同级别安卓旗舰）'),
    ).toBeInTheDocument();
  });

  it('拍摄方案:预计时长 "1分20秒 - 1分30秒"', () => {
    renderPage();
    expect(screen.getByText('1分20秒 - 1分30秒')).toBeInTheDocument();
  });

  it('配乐建议:4 chip 全部可见', () => {
    renderPage();
    VIDEO_PRODUCTION_BGM.chips.forEach((chip) => {
      expect(screen.getAllByText(chip).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('剪辑要点:第 1 条字面', () => {
    renderPage();
    expect(
      screen.getByText('开头3秒内迅速抛出核心问题，抓住观众注意力。'),
    ).toBeInTheDocument();
  });

  it('剪辑要点:11 条全部渲染', () => {
    renderPage();
    VIDEO_PRODUCTION_EDITING.forEach((item) => {
      expect(screen.getAllByText(item).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('反馈 prompt "这个结果对你有帮助吗？"', () => {
    renderPage();
    expect(screen.getByText(VIDEO_PRODUCTION_FEEDBACK_PROMPT)).toBeInTheDocument();
  });

  it('反馈按钮:有帮助 + 无帮助', () => {
    renderPage();
    expect(screen.getByRole('button', { name: '有帮助' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '无帮助' })).toBeInTheDocument();
  });
});
