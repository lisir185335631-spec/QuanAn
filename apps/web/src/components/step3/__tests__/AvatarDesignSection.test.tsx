import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import {
  AvatarDesignSection,
  type AvatarDesignContent,
} from '../AvatarDesignSection';

const FULL_CONTENT: AvatarDesignContent = {
  风格: '专业医美风，简洁大气',
  配色方案: '金色主调，白色辅助',
  主色调: '金色 #C9A84C',
  辅色调: '象牙白 #F8F4EC',
  心理学依据: '金色象征权威与专业，提升信任感',
  '表情/姿态': '微笑，略微仰头，展示自信',
  '服装/造型': '白大褂或商务正装，淡妆',
  背景设计: '纯白或浅灰渐变，突出主体',
  referenceImageUrl: null,
};

// ──────────────────────────────────────────────────────────────────────────────
// empty state (content === null)
// ──────────────────────────────────────────────────────────────────────────────
describe('AvatarDesignSection — empty state (content=null)', () => {
  it('renders H3 "头像设计方案"', () => {
    render(<AvatarDesignSection content={null} />);
    expect(screen.getByRole('heading', { level: 3, name: /头像设计方案/ })).toBeInTheDocument();
  });

  it('shows "暂无内容" placeholder', () => {
    render(<AvatarDesignSection content={null} />);
    expect(
      screen.getByText(/暂无内容 · 点击"生成账号包装方案"开始/),
    ).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// loading / undefined state
// ──────────────────────────────────────────────────────────────────────────────
describe('AvatarDesignSection — loading state (content=undefined)', () => {
  it('renders H3', () => {
    render(<AvatarDesignSection />);
    expect(screen.getByRole('heading', { level: 3, name: /头像设计方案/ })).toBeInTheDocument();
  });

  it('renders skeleton placeholders for all 8 sub-sections', () => {
    const { container } = render(<AvatarDesignSection />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    // 8 sub-sections, each has one animate-pulse wrapper
    expect(skeletons.length).toBeGreaterThanOrEqual(8);
  });

  it('renders dashed border placeholder for reference image', () => {
    render(<AvatarDesignSection />);
    expect(screen.getByText(/点击"查看图标"生成参考图/)).toBeInTheDocument();
  });

  it('[查看图标] button is disabled by default', () => {
    render(<AvatarDesignSection />);
    expect(screen.getByRole('button', { name: /查看图标/ })).toBeDisabled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 8 sub-section labels — D-286 字面锁
// ──────────────────────────────────────────────────────────────────────────────
describe('AvatarDesignSection — 8 sub-section labels (D-286)', () => {
  const EXPECTED_LABELS = [
    '风格',
    '配色方案',
    '主色调',
    '辅色调',
    '心理学依据',
    '表情/姿态',
    '服装/造型',
    '背景设计',
  ];

  it.each(EXPECTED_LABELS)('renders sub-section label "%s"', (label) => {
    render(<AvatarDesignSection content={FULL_CONTENT} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// full content
// ──────────────────────────────────────────────────────────────────────────────
describe('AvatarDesignSection — full content', () => {
  it('renders content descriptions for all 8 sub-sections', () => {
    render(<AvatarDesignSection content={FULL_CONTENT} />);
    expect(screen.getByText('专业医美风，简洁大气')).toBeInTheDocument();
    expect(screen.getByText('金色主调，白色辅助')).toBeInTheDocument();
    expect(screen.getByText('金色 #C9A84C')).toBeInTheDocument();
    expect(screen.getByText('象牙白 #F8F4EC')).toBeInTheDocument();
    expect(screen.getByText('金色象征权威与专业，提升信任感')).toBeInTheDocument();
    expect(screen.getByText('微笑，略微仰头，展示自信')).toBeInTheDocument();
    expect(screen.getByText('白大褂或商务正装，淡妆')).toBeInTheDocument();
    expect(screen.getByText('纯白或浅灰渐变，突出主体')).toBeInTheDocument();
  });

  it('shows dashed placeholder when referenceImageUrl is null', () => {
    render(<AvatarDesignSection content={FULL_CONTENT} />);
    expect(screen.getByText(/点击"查看图标"生成参考图/)).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// [查看图标] button — D-287 字面锁
// ──────────────────────────────────────────────────────────────────────────────
describe('AvatarDesignSection — [查看图标] button (D-287)', () => {
  it('button label is "查看图标" (not "查看图片")', () => {
    render(<AvatarDesignSection />);
    expect(screen.getByRole('button', { name: /查看图标/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /查看图片/ })).not.toBeInTheDocument();
  });

  it('button is enabled when canViewImage=true', () => {
    render(<AvatarDesignSection content={FULL_CONTENT} canViewImage={true} />);
    expect(screen.getByRole('button', { name: /查看图标/ })).not.toBeDisabled();
  });

  it('calls onViewImage when button is clicked', () => {
    const onViewImage = vi.fn();
    render(
      <AvatarDesignSection
        content={FULL_CONTENT}
        canViewImage={true}
        onViewImage={onViewImage}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /查看图标/ }));
    expect(onViewImage).toHaveBeenCalledTimes(1);
  });
});
