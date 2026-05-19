/**
 * PRD-23 US-003 · Step8 unit tests
 * AC-11: ≥ 6 tests · 2 tabs / 6 H3 stub output / 3 experience radio dual-line / disabled 条件
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
    expect(screen.getByText('STEP 08 · 直播策划')).toBeInTheDocument();
  });

  it('AC-2 · 2 tabs 字面锁 "生成直播方案" + "AI 优化话术" (shadcn Tabs)', () => {
    renderStep8();
    expect(screen.getByRole('tab', { name: '生成直播方案' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'AI 优化话术' })).toBeInTheDocument();
  });

  it('AC-3/4 · 3 经验 radio dual-line: label + subtitle 均渲染', () => {
    renderStep8();
    // Label (short)
    expect(screen.getByText('新手')).toBeInTheDocument();
    expect(screen.getByText('有经验')).toBeInTheDocument();
    expect(screen.getByText('资深')).toBeInTheDocument();
    // Subtitle (description)
    expect(screen.getByText('刚开始做直播')).toBeInTheDocument();
    expect(screen.getByText('有一定直播经验')).toBeInTheDocument();
    expect(screen.getByText('直播经验丰富')).toBeInTheDocument();
  });

  it('AC-4 · "生成直播方案" CTA 初始 disabled (product 为空)', () => {
    renderStep8();
    expect(screen.getByRole('button', { name: '生成直播方案' })).toBeDisabled();
  });

  it('AC-4 · 填写 product + 选 platform + 选 experience → CTA enabled', () => {
    renderStep8();
    // Fill product
    const textarea = screen.getByPlaceholderText('描述你要在直播中推广的产品或服务...');
    fireEvent.change(textarea, { target: { value: '护肤品' } });
    // Select platform (抖音 button from PlatformInlineRadio)
    const douyinBtn = screen.getByRole('button', { name: /抖音/ });
    fireEvent.click(douyinBtn);
    // Select experience
    const noviceBtn = screen.getByText('新手').closest('button')!;
    fireEvent.click(noviceBtn);

    expect(screen.getByRole('button', { name: '生成直播方案' })).not.toBeDisabled();
  });

  it('AC-6 · 切换到 tab 2 → "AI 优化话术" CTA 初始 disabled (< 10 字)', () => {
    renderStep8();
    // Activate tab 2 first so its content becomes accessible
    fireEvent.click(screen.getByRole('tab', { name: 'AI 优化话术' }));
    const cta = screen.getByRole('button', { name: 'AI 优化话术' });
    expect(cta).toBeDisabled();
  });

  it('AC-5 · 提交 tab 1 表单后渲染 6 H3 stub 输出区块', () => {
    renderStep8();
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('描述你要在直播中推广的产品或服务...'), {
      target: { value: '美妆产品' },
    });
    fireEvent.click(screen.getByRole('button', { name: /抖音/ }));
    fireEvent.click(screen.getByText('新手').closest('button')!);
    // Submit
    fireEvent.click(screen.getByRole('button', { name: '生成直播方案' }));

    // 6 H3 blocks should appear
    expect(screen.getByRole('heading', { level: 3, name: '开场话术' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '中场互动' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '成交话术' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '收尾' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '引流策略' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '互动设计' })).toBeInTheDocument();
  });
});
