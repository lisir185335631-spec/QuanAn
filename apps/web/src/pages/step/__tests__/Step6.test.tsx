import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Step6 from '@/pages/step/Step6';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      get: {
        useQuery: () => ({
          data: null,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        }),
      },
      save: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

describe('Step6', () => {
  it('renders h1 with 拍摄计划', () => {
    render(
      <MemoryRouter>
        <Step6 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('拍摄计划');
  });

  it('renders STEP_TAG', () => {
    render(
      <MemoryRouter>
        <Step6 />
      </MemoryRouter>,
    );
    expect(
      screen.getByText((content) => content.includes('STEP 06') && content.includes('生成拍摄计划')),
    ).toBeInTheDocument();
  });

  it('renders subtitle describing AI generation capability', () => {
    render(
      <MemoryRouter>
        <Step6 />
      </MemoryRouter>,
    );
    expect(screen.getByText(/AI将自动生成完整的分镜脚本、拍摄方案和口播提词器/)).toBeInTheDocument();
  });

  it('renders generate button', () => {
    render(
      <MemoryRouter>
        <Step6 />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /生成拍摄计划/ })).toBeInTheDocument();
  });

  it('generate button is disabled when textarea is empty', () => {
    render(
      <MemoryRouter>
        <Step6 />
      </MemoryRouter>,
    );
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '' } });
    const btn = screen.getByRole('button', { name: /生成拍摄计划/ });
    expect(btn).toBeDisabled();
  });
});
