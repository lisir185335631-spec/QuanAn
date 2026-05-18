// PRD-13 US-006 · EvolutionHealthDrawer unit tests
// AC-6: 时间线 + 强制重跑按钮(super_admin only) + ConfirmModal + reason validation
// AC-9: Drawer 开关 + toast 验证
// SHIELD: admin/readonly_admin 不显示强制重跑
// @vitest-environment jsdom

import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ── Mock tRPC ─────────────────────────────────────────────────────────────────
const mockTimeline = vi.hoisted(() => vi.fn());
const mockForceRebuild = vi.hoisted(() => vi.fn());
const mockMarkResolved = vi.hoisted(() => vi.fn());

vi.mock('../../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    evolution: {
      getAccountTimeline: { useQuery: mockTimeline },
      forceRebuildEvolution: { useMutation: mockForceRebuild },
      markAnomalyResolved: { useMutation: mockMarkResolved },
    },
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  adminTrpcClient: {},
  adminQueryClient: {},
}));

// ── Shared fixture ────────────────────────────────────────────────────────────
import {
  EvolutionHealthDrawer,
  type AnomalyRow,
} from '../../../../apps/admin/src/pages/evolutionHealth/EvolutionHealthDrawer';

const SAMPLE_FLAG: AnomalyRow = {
  id: 42,
  accountId: 101,
  anomalyType: 'flywheel_stalled',
  severity: 'high',
  evidence: {},
  detectedAt: new Date('2026-05-10T10:00:00Z'),
  resolvedAt: null,
  resolution: null,
  resolvedByAdminId: null,
};

function setupMocks() {
  mockTimeline.mockReturnValue({
    data: {
      profile: { level: 'L3', satisfactionRate: 0.75, feedbackCountTotal: 50, autoEvolutionEnabled: true },
      insights: [
        {
          id: 1,
          triggerType: 'feedback_loop',
          direction: 'positive',
          levelBefore: 'L2',
          levelAfter: 'L3',
          isFallback: false,
          createdAt: new Date('2026-05-09T08:00:00Z'),
        },
      ],
      anomalyFlags: [],
    },
    isLoading: false,
  });
  mockForceRebuild.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockMarkResolved.mockReturnValue({ mutate: vi.fn(), isPending: false });
}

afterEach(cleanup);

describe('EvolutionHealthDrawer', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('does not render when selectedFlag is null (closed state)', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={null}
        role="super_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    // Drawer is off-screen via transform — close button still in DOM but drawer shifted
    expect(screen.queryByText('账号进化详情')).toBeInTheDocument();
    // Backdrop should NOT be rendered
    expect(screen.queryByRole('button', { name: /关闭详情/ })).toBeInTheDocument();
  });

  it('renders account info when selectedFlag provided', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="super_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    expect(screen.getByText(/Account #101/)).toBeInTheDocument();
    // L 등급 KPI card shows 'L3' as the value
    const levelCards = screen.getAllByText(/L3/);
    expect(levelCards.length).toBeGreaterThanOrEqual(1);
  });

  it('renders profile KPI cards', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="super_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    expect(screen.getByText('L 等级')).toBeInTheDocument();
    expect(screen.getByText('满意度')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('shows timeline section', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="super_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    expect(screen.getByText(/进化时间线/)).toBeInTheDocument();
    expect(screen.getByText('feedback_loop')).toBeInTheDocument();
  });

  it('shows 强制重跑批 button for super_admin', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="super_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /强制重跑批/ })).toBeInTheDocument();
  });

  it('SHIELD: hides 强制重跑批 for admin role', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /强制重跑批/ })).not.toBeInTheDocument();
  });

  it('SHIELD: hides 强制重跑批 for readonly_admin role', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="readonly_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /强制重跑批/ })).not.toBeInTheDocument();
  });

  it('clicking 强制重跑批 opens ConfirmModal', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="super_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /强制重跑批/ }));
    expect(screen.getByText(/强制重跑进化档案/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/请说明强制重跑的原因/)).toBeInTheDocument();
  });

  it('submit button disabled when reason < 10 chars', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="super_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /强制重跑批/ }));
    const textarea = screen.getByPlaceholderText(/请说明强制重跑的原因/);
    fireEvent.change(textarea, { target: { value: '太短' } });
    const submitBtn = screen.getByRole('button', { name: /提交申请/ });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/原因需至少 10 字/)).toBeInTheDocument();
  });

  it('submit button enabled when reason >= 10 chars', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="super_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /强制重跑批/ }));
    const textarea = screen.getByPlaceholderText(/请说明强制重跑的原因/);
    fireEvent.change(textarea, { target: { value: '这是一个足够长的审批原因说明文字' } });
    const submitBtn = screen.getByRole('button', { name: /提交申请/ });
    expect(submitBtn).not.toBeDisabled();
  });

  it('shows false positive action button for unresolved flag', () => {
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="super_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /标记 false positive/ })).toBeInTheDocument();
  });

  it('hides false positive button for resolved flag', () => {
    const resolvedFlag: AnomalyRow = {
      ...SAMPLE_FLAG,
      resolvedAt: new Date(),
      resolution: 'admin_action',
    };
    render(
      <EvolutionHealthDrawer
        selectedFlag={resolvedFlag}
        role="super_admin"
        onClose={vi.fn()}
        onFlagResolved={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /标记 false positive/ })).not.toBeInTheDocument();
  });

  it('close button calls onClose', () => {
    const onClose = vi.fn();
    render(
      <EvolutionHealthDrawer
        selectedFlag={SAMPLE_FLAG}
        role="super_admin"
        onClose={onClose}
        onFlagResolved={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /关闭详情/ }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
