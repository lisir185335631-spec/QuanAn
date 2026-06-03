import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import {
  BackgroundImageDesignSection,
  type BackgroundImageContent,
} from '../BackgroundImageDesignSection';

const FULL_CONTENT: BackgroundImageContent = {
  风格理念: '简约现代风，专业感强',
  布局结构: '上下分区，品牌区 + 服务区',
  色调: '金色主调，冷暖对比',
  主色调: '金色 #C9A84C',
  辅色调: '象牙白 #F8F4EC',
  品牌元素: 'Logo + 口号 + 二维码',
  '字体/icon': '思源黑体 + 微图标',
  分镜建议: '三段式分镜：品牌区 / 内容区 / CTA区',
  platformImages: {
    douyin: null,
    xiaohongshu: null,
    shipinhao: null,
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// H3
// ──────────────────────────────────────────────────────────────────────────────
describe('BackgroundImageDesignSection — H3', () => {
  it('renders H3 "背景图设计方案"', () => {
    render(<BackgroundImageDesignSection />);
    expect(
      screen.getByRole('heading', { level: 3, name: /背景图设计方案/ }),
    ).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 8 sub-section labels — AC-3 字面锁
// ──────────────────────────────────────────────────────────────────────────────
describe('BackgroundImageDesignSection — 8 sub-section labels (AC-3)', () => {
  const EXPECTED_LABELS = [
    '风格理念',
    '布局结构',
    '色调',
    '主色调',
    '辅色调',
    '品牌元素',
    '字体/icon',
    '分镜建议',
  ];

  it.each(EXPECTED_LABELS)('renders sub-section label "%s"', (label) => {
    render(<BackgroundImageDesignSection content={FULL_CONTENT} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3 platform columns — AC-4 D-288 锁
// ──────────────────────────────────────────────────────────────────────────────
describe('BackgroundImageDesignSection — 3 platform columns (AC-4)', () => {
  it('renders douyin column', () => {
    render(<BackgroundImageDesignSection content={FULL_CONTENT} />);
    expect(screen.getByText('📱 抖音')).toBeInTheDocument();
  });

  it('renders xiaohongshu column', () => {
    render(<BackgroundImageDesignSection content={FULL_CONTENT} />);
    expect(screen.getByText('📕 小红书')).toBeInTheDocument();
  });

  it('renders shipinhao column', () => {
    render(<BackgroundImageDesignSection content={FULL_CONTENT} />);
    expect(screen.getByText('📺 视频号')).toBeInTheDocument();
  });

  it('does NOT render 快手 or B站 (D-288)', () => {
    render(<BackgroundImageDesignSection content={FULL_CONTENT} />);
    expect(screen.queryByText(/快手/)).not.toBeInTheDocument();
    expect(screen.queryByText(/B站/)).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// [生成参考图] button — AC-6
// ──────────────────────────────────────────────────────────────────────────────
describe('BackgroundImageDesignSection — [生成参考图] button (AC-6)', () => {
  it('button is disabled when content=null', () => {
    render(<BackgroundImageDesignSection content={null} />);
    expect(screen.getByRole('button', { name: /生成参考图/ })).toBeDisabled();
  });

  it('button is disabled by default when canGenerate is not set', () => {
    render(<BackgroundImageDesignSection content={FULL_CONTENT} />);
    expect(screen.getByRole('button', { name: /生成参考图/ })).toBeDisabled();
  });

  it('button is enabled when canGenerate=true and content is not null', () => {
    render(<BackgroundImageDesignSection content={FULL_CONTENT} canGenerate={true} />);
    expect(screen.getByRole('button', { name: /生成参考图/ })).not.toBeDisabled();
  });

  it('calls onGenerate when clicked', () => {
    const onGenerate = vi.fn();
    render(
      <BackgroundImageDesignSection
        content={FULL_CONTENT}
        canGenerate={true}
        onGenerate={onGenerate}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /生成参考图/ }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// loading state (content=undefined)
// ──────────────────────────────────────────────────────────────────────────────
describe('BackgroundImageDesignSection — loading state (content=undefined)', () => {
  it('renders skeleton placeholders for sub-sections', () => {
    const { container } = render(<BackgroundImageDesignSection />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(8);
  });

  it('renders dashed placeholders for all 3 platform columns', () => {
    const { container } = render(<BackgroundImageDesignSection />);
    const dashed = container.querySelectorAll('.border-dashed');
    expect(dashed.length).toBe(3);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// full content
// ──────────────────────────────────────────────────────────────────────────────
describe('BackgroundImageDesignSection — full content', () => {
  it('renders sub-section descriptions', () => {
    render(<BackgroundImageDesignSection content={FULL_CONTENT} />);
    expect(screen.getByText('简约现代风，专业感强')).toBeInTheDocument();
    expect(screen.getByText('上下分区，品牌区 + 服务区')).toBeInTheDocument();
    expect(screen.getByText('金色 #C9A84C')).toBeInTheDocument();
  });
});
