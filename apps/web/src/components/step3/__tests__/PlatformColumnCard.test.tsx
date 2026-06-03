import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { PlatformColumnCard } from '../PlatformColumnCard';

describe('PlatformColumnCard — emoji + label (AC-5)', () => {
  it('renders douyin label with emoji', () => {
    render(<PlatformColumnCard platformKey="douyin" />);
    expect(screen.getByText('📱 抖音')).toBeInTheDocument();
  });

  it('renders xiaohongshu label with emoji', () => {
    render(<PlatformColumnCard platformKey="xiaohongshu" />);
    expect(screen.getByText('📕 小红书')).toBeInTheDocument();
  });

  it('renders shipinhao label with emoji', () => {
    render(<PlatformColumnCard platformKey="shipinhao" />);
    expect(screen.getByText('📺 视频号')).toBeInTheDocument();
  });
});

describe('PlatformColumnCard — dashed placeholder (AC-1)', () => {
  it('renders dashed placeholder when referenceImageUrl is undefined', () => {
    const { container } = render(<PlatformColumnCard platformKey="douyin" />);
    expect(container.querySelector('.border-dashed')).toBeInTheDocument();
  });

  it('renders dashed placeholder when referenceImageUrl is null', () => {
    const { container } = render(
      <PlatformColumnCard platformKey="douyin" referenceImageUrl={null} />,
    );
    expect(container.querySelector('.border-dashed')).toBeInTheDocument();
  });

  it('renders image when referenceImageUrl is provided', () => {
    render(
      <PlatformColumnCard
        platformKey="douyin"
        referenceImageUrl="https://example.com/bg.png"
      />,
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/bg.png',
    );
  });

  it('does NOT render dashed placeholder when image is provided', () => {
    const { container } = render(
      <PlatformColumnCard
        platformKey="xiaohongshu"
        referenceImageUrl="https://example.com/bg.png"
      />,
    );
    expect(container.querySelector('.border-dashed')).not.toBeInTheDocument();
  });
});
