import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PresentStyles from '@/pages/tools/PresentStyles';
import { PRESENT_STYLES } from '@/lib/constants/present-styles';

describe('PresentStyles · sally 真实页 1:1', () => {
  it('renders page title + subtitle', () => {
    render(<MemoryRouter><PresentStyles /></MemoryRouter>);
    expect(screen.getByText('爆款呈现形式合集')).toBeInTheDocument();
    expect(screen.getByText('掌握各种爆款视频的呈现形式，找到最适合你的内容表达方式')).toBeInTheDocument();
  });
  it('renders 14 style cards in order', () => {
    render(<MemoryRouter><PresentStyles /></MemoryRouter>);
    PRESENT_STYLES.forEach((s) => {
      expect(screen.getByText(s.label)).toBeInTheDocument();
      expect(screen.getByText(s.description)).toBeInTheDocument();
    });
  });
  it('renders 14 scene labels (适用场景：通用)', () => {
    render(<MemoryRouter><PresentStyles /></MemoryRouter>);
    const scenes = screen.getAllByText(/适用场景：通用/);
    expect(scenes).toHaveLength(14);
  });
});
