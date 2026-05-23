import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Step3SectionDivider } from '../Step3PageHeader';

describe('Step3SectionDivider', () => {
  it('renders H2 with text "账号包装方案"', () => {
    render(<Step3SectionDivider />);
    expect(screen.getByRole('heading', { level: 2, name: /账号包装方案/ })).toBeInTheDocument();
  });

  it('renders the flame icon (Flame svg element is present)', () => {
    const { container } = render(<Step3SectionDivider />);
    // lucide renders SVG elements
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders without crashing when no props provided', () => {
    expect(() => render(<Step3SectionDivider />)).not.toThrow();
  });
});
