/**
 * PRD-23 US-003 · Step8 unit tests
 * AC-11: ≥ 6 tests · form / experience chip dual-line / disabled 条件
 * D-233 同步: expectations 对齐新字面
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import Step8 from '@/pages/step/Step8';

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

function renderStep8() {
  return render(
    <MemoryRouter>
      <Step8 />
    </MemoryRouter>,
  );
}

describe('Step8', () => {
  it('AC-1 · H1 字面锁 "直播策划"', () => {
    renderStep8();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('直播策划');
  });

  it('AC-1 · STEP_TAG "STEP 08 · 直播策划" 顶部副标签', () => {
    renderStep8();
    expect(
      screen.getByText((content) => content.includes('STEP 08') && content.includes('直播策划')),
    ).toBeInTheDocument();
  });

  it('AC-2 · 生成直播方案 CTA 和 AI优化话术 section 均渲染 (shadcn Tabs)', () => {
    renderStep8();
    expect(screen.getByRole('button', { name: /生成直播方案/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI优化话术/ })).toBeInTheDocument();
  });

  it('AC-3/4 · 3 经验 chip dual-line: label + subtitle 均渲染', () => {
    renderStep8();
    // Label (short) — check by button accessible name containing label text
    expect(screen.getByRole('button', { name: /新手/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /有经验/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /资深/ })).toBeInTheDocument();
    // Subtitle (description) via text match in button
    expect(screen.getByText(/刚开始做直播/)).toBeInTheDocument();
    expect(screen.getByText(/有一定直播经验/)).toBeInTheDocument();
    expect(screen.getByText(/直播经验丰富/)).toBeInTheDocument();
  });

  it('AC-4 · "生成直播方案" CTA 初始可点击 (非 loading 状态)', () => {
    renderStep8();
    expect(screen.getByRole('button', { name: /生成直播方案/ })).not.toBeDisabled();
  });

  it('AC-4 · 选 platform + 选 experience → CTA 仍 enabled', () => {
    renderStep8();
    // Select platform (抖音 button)
    const douyinBtn = screen.getByRole('button', { name: /抖音/ });
    fireEvent.click(douyinBtn);
    // Select experience
    const noviceBtn = screen.getByRole('button', { name: /新手/ });
    fireEvent.click(noviceBtn);

    expect(screen.getByRole('button', { name: /生成直播方案/ })).not.toBeDisabled();
  });

  it('AC-6 · AI优化话术 section 的 textarea 和 CTA button 均渲染', () => {
    renderStep8();
    expect(
      screen.getByPlaceholderText(/粘贴你的直播话术脚本/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI优化话术/ })).toBeInTheDocument();
  });

  it('AC-5 · 提交表单后 output test-id 不立即出现 (LLM result 在 onSuccess 后渲染)', () => {
    const mockMutate = vi.fn();
    // Override mock to capture mutate call
    vi.doMock('@/lib/trpc', () => ({
      trpc: {
        ipAccounts: {
          active: { useQuery: () => ({ data: null, isLoading: false }) },
          switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
        },
        stepData: {
          get: { useQuery: () => ({ data: null, isLoading: false, isError: false, error: null, refetch: vi.fn() }) },
          save: { useMutation: () => ({ mutate: mockMutate, isPending: false }) },
        },
      },
    }));

    renderStep8();
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /生成直播方案/ }));

    // Output section only appears after onSuccess · form is submitted (no error shown)
    expect(screen.queryByTestId('step8-generate-output')).not.toBeInTheDocument();
  });
});
