import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import {
  VideoReferenceCaseSection,
  type VideoReferenceCase,
} from '../VideoReferenceCaseSection';

const TWO_CASES: VideoReferenceCase[] = [
  {
    title: '美业头部账号主页参考',
    description: '美业 TOP 100 账号主页截图和数据分析，含粉丝增长曲线。',
    searchHint: '搜索：美业头部账号',
  },
  {
    title: '高转化率账号包装案例',
    description: '高转化率账号的完整包装路径，含封面、简介和主页结构。',
    searchHint: '搜索：高转化率案例',
  },
];

describe('VideoReferenceCaseSection — empty state', () => {
  it('renders H3 "视频参考案例" even when cases is empty', () => {
    render(<VideoReferenceCaseSection />);
    expect(screen.getByRole('heading', { level: 3, name: /视频参考案例/ })).toBeInTheDocument();
  });

  it('renders exactly 2 skeleton placeholders when cases is empty', () => {
    const { container } = render(<VideoReferenceCaseSection />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(2);
  });

  it('[生成参考图] button is disabled when canGenerate=false (default)', () => {
    render(<VideoReferenceCaseSection />);
    expect(screen.getByRole('button', { name: /生成参考图/ })).toBeDisabled();
  });

  it('[生成参考图] button is disabled when cases=[] and canGenerate=false', () => {
    render(<VideoReferenceCaseSection cases={[]} canGenerate={false} />);
    expect(screen.getByRole('button', { name: /生成参考图/ })).toBeDisabled();
  });
});

describe('VideoReferenceCaseSection — 2 cases', () => {
  it('renders H3 "视频参考案例"', () => {
    render(<VideoReferenceCaseSection cases={TWO_CASES} canGenerate={true} />);
    expect(screen.getByRole('heading', { level: 3, name: /视频参考案例/ })).toBeInTheDocument();
  });

  it('renders both case titles', () => {
    render(<VideoReferenceCaseSection cases={TWO_CASES} canGenerate={true} />);
    expect(screen.getByText('美业头部账号主页参考')).toBeInTheDocument();
    expect(screen.getByText('高转化率账号包装案例')).toBeInTheDocument();
  });

  it('renders both case descriptions', () => {
    render(<VideoReferenceCaseSection cases={TWO_CASES} canGenerate={true} />);
    expect(screen.getByText(/美业 TOP 100 账号主页截图/)).toBeInTheDocument();
    expect(screen.getByText(/高转化率账号的完整包装路径/)).toBeInTheDocument();
  });

  it('renders both search hint chips', () => {
    render(<VideoReferenceCaseSection cases={TWO_CASES} canGenerate={true} />);
    const hints1 = screen.getAllByText((_content, node) => {
      if (!node || node.nodeName !== 'SPAN') return false;
      const el = node as HTMLElement;
      return el.textContent?.includes('搜索：美业头部账号') === true && el.childElementCount === 1;
    });
    expect(hints1.length).toBeGreaterThanOrEqual(1);
    const hints2 = screen.getAllByText((_content, node) => {
      if (!node || node.nodeName !== 'SPAN') return false;
      const el = node as HTMLElement;
      return el.textContent?.includes('搜索：高转化率案例') === true && el.childElementCount === 1;
    });
    expect(hints2.length).toBeGreaterThanOrEqual(1);
  });

  it('[生成参考图] button is enabled when canGenerate=true', () => {
    render(<VideoReferenceCaseSection cases={TWO_CASES} canGenerate={true} />);
    expect(screen.getByRole('button', { name: /生成参考图/ })).not.toBeDisabled();
  });

  it('calls onGenerate when [生成参考图] is clicked', () => {
    const onGenerate = vi.fn();
    render(
      <VideoReferenceCaseSection cases={TWO_CASES} canGenerate={true} onGenerate={onGenerate} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /生成参考图/ }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('renders no skeleton placeholders when 2 cases provided', () => {
    const { container } = render(
      <VideoReferenceCaseSection cases={TWO_CASES} canGenerate={true} />,
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(0);
  });
});

describe('VideoReferenceCaseSection — 1 case', () => {
  const ONE_CASE = TWO_CASES.slice(0, 1);

  it('renders H3 with 1 case', () => {
    render(<VideoReferenceCaseSection cases={ONE_CASE} canGenerate={true} />);
    expect(screen.getByRole('heading', { level: 3, name: /视频参考案例/ })).toBeInTheDocument();
  });

  it('renders only the single case title', () => {
    render(<VideoReferenceCaseSection cases={ONE_CASE} canGenerate={true} />);
    expect(screen.getByText('美业头部账号主页参考')).toBeInTheDocument();
    expect(screen.queryByText('高转化率账号包装案例')).not.toBeInTheDocument();
  });

  it('[生成参考图] button is enabled with 1 case and canGenerate=true', () => {
    render(<VideoReferenceCaseSection cases={ONE_CASE} canGenerate={true} />);
    expect(screen.getByRole('button', { name: /生成参考图/ })).not.toBeDisabled();
  });

  it('renders no skeleton placeholders when 1 case provided', () => {
    const { container } = render(
      <VideoReferenceCaseSection cases={ONE_CASE} canGenerate={true} />,
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(0);
  });
});
