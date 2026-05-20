import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import KnowledgePlaceholder from '../knowledge';

describe('KnowledgePlaceholder', () => {
  it('renders without crash', () => {
    render(<KnowledgePlaceholder />, { wrapper: MemoryRouter });
  });

  it('主标题 域 ⑮ 常量管理', () => {
    render(<KnowledgePlaceholder />, { wrapper: MemoryRouter });
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('renders placeholder content AdminConstants', () => {
    render(<KnowledgePlaceholder />, { wrapper: MemoryRouter });
    expect(screen.getByText(/AdminConstants/)).toBeInTheDocument();
  });
});
