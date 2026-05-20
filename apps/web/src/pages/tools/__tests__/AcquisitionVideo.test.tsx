/**
 * PRD-23 US-007 · AcquisitionVideo unit tests (D-233)
 * AC-6: ≥ 4 tests · H1 字面 / 副标题 / CTA disabled→enabled / 3 方案 grid 4 H4
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import AcquisitionVideo from '@/pages/tools/AcquisitionVideo';

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: { id: 1, name: 'AI 创业者小张', industry: '企业服务', platform: 'douyin', stage: 'starter' },
    switchTo: vi.fn(),
    isSwitching: false,
    isLoading: false,
  }),
}));

function renderAcquisitionVideo() {
  return render(
    <MemoryRouter>
      <AcquisitionVideo />
    </MemoryRouter>,
  );
}

describe('AcquisitionVideo', () => {
  it('AC-1 · H1 字面锁 "获客型视频制作"', () => {
    renderAcquisitionVideo();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('获客型视频制作');
  });

  it('AC-1 · 副标题字面锁 "专为获客设计的短视频方案，让精准客户主动找上门"', () => {
    renderAcquisitionVideo();
    expect(screen.getByText(/专为获客设计的短视频方案，让精准客户主动找上门/)).toBeInTheDocument();
  });

  it('AC-3 · CTA "生成获客方案" 初始 disabled (audience + sellingPoints 为空)', () => {
    renderAcquisitionVideo();
    expect(screen.getByRole('button', { name: '生成获客方案' })).toBeDisabled();
  });

  it('AC-3 · 填写 audience + sellingPoints → CTA enabled', () => {
    renderAcquisitionVideo();
    // industry defaults to '企业服务' from mocked account (via useEffect)
    fireEvent.change(screen.getByTestId('acq-audience-textarea'), {
      target: { value: '想要创业的宝妈群体，有一定积蓄' },
    });
    fireEvent.change(screen.getByTestId('acq-selling-points-textarea'), {
      target: { value: '0基础可学、3个月回本' },
    });
    expect(screen.getByRole('button', { name: '生成获客方案' })).not.toBeDisabled();
  });

  it('AC-4 · 提交后渲染 3 方案 grid · 每方案含 4 H4 字面锁', () => {
    renderAcquisitionVideo();
    // Set industry if not auto-filled (ensure state is set)
    fireEvent.change(screen.getByTestId('acq-industry-select'), {
      target: { value: '企业服务' },
    });
    fireEvent.change(screen.getByTestId('acq-audience-textarea'), {
      target: { value: '想要创业的宝妈群体，有一定积蓄但缺乏方向' },
    });
    fireEvent.change(screen.getByTestId('acq-selling-points-textarea'), {
      target: { value: '0基础可学、3个月回本、一对一指导' },
    });
    fireEvent.click(screen.getByRole('button', { name: '生成获客方案' }));

    // 3 plans × 4 H4 headings = 12 occurrences
    expect(screen.getAllByRole('heading', { level: 4, name: '主题角度' })).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 4, name: '钩子' })).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 4, name: '内容结构' })).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 4, name: 'CTA' })).toHaveLength(3);
  });

  it('AC-5 · industry select 有 "企业服务" 选项可被选中', () => {
    renderAcquisitionVideo();
    const select = screen.getByTestId('acq-industry-select');
    fireEvent.change(select, { target: { value: '企业服务' } });
    expect((select as HTMLSelectElement).value).toBe('企业服务');
  });
});
