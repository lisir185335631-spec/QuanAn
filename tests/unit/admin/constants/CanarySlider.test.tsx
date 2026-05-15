// PRD-14 US-010 · CanarySlider (constants) unit tests
// AC-1: 5-step stepper renders
// AC-2: 100% → confirm modal shown
// AC-3: 1-50% → direct updateCanary call (no modal)
// AC-4: 0% → confirm modal shown
// AC-6: rollback button visible for super_admin only · reason ≥ 20 chars
// @vitest-environment jsdom

import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockUpdateCanaryMutate = vi.hoisted(() => vi.fn());
const mockRollbackMutate = vi.hoisted(() => vi.fn());

vi.mock('../../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    constants: {
      updateCanary: {
        useMutation: () => ({
          mutate: mockUpdateCanaryMutate,
          isPending: false,
        }),
      },
      rollbackVersion: {
        useMutation: () => ({
          mutate: mockRollbackMutate,
          isPending: false,
        }),
      },
    },
  },
}));

import { CanarySlider } from '../../../../apps/admin/src/pages/constants/components/CanarySlider';

const CURRENT_VERSION = { id: 17, version: 17, judgeScore: '4.50', status: 'active' };
const NEXT_VERSION = { id: 18, version: 18, judgeScore: '3.80', status: 'pending_review' };

const DEFAULT_PROPS = {
  constantType: 'case',
  constantKey: 'opinion_beauty_01',
  currentVersion: CURRENT_VERSION,
  nextVersion: NEXT_VERSION,
  currentCanaryPct: 10,
  nextVersionId: 18,
  isSuperAdmin: true,
  onRefetch: vi.fn(),
  onToast: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CanarySlider (constants)', () => {
  it('renders 5 step buttons', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('1%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('clicking 50% calls updateCanary directly without modal (AC-3)', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('50%'));
    expect(mockUpdateCanaryMutate).toHaveBeenCalledWith({
      constantType: 'case',
      constantKey: 'opinion_beauty_01',
      nextVersionId: 18,
      canaryPct: 50,
    });
    expect(screen.queryByText(/确认完全发布/)).not.toBeInTheDocument();
  });

  it('clicking 10% calls updateCanary directly without modal (AC-3)', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('10%'));
    expect(mockUpdateCanaryMutate).toHaveBeenCalledWith({
      constantType: 'case',
      constantKey: 'opinion_beauty_01',
      nextVersionId: 18,
      canaryPct: 10,
    });
  });

  it('clicking 100% shows confirm modal, no immediate call (AC-2)', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('100%'));
    expect(screen.getByText(/确认完全发布/)).toBeInTheDocument();
    expect(mockUpdateCanaryMutate).not.toHaveBeenCalled();
  });

  it('clicking 0% shows confirm modal (AC-4)', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('0%'));
    expect(screen.getByText(/确认暂停灰度/)).toBeInTheDocument();
    expect(mockUpdateCanaryMutate).not.toHaveBeenCalled();
  });

  it('rollback button visible for super_admin (AC-6)', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    expect(screen.getByRole('button', { name: '一键回滚' })).toBeInTheDocument();
  });

  it('rollback button hidden for non-super_admin (AC-6)', () => {
    render(<CanarySlider {...DEFAULT_PROPS} isSuperAdmin={false} />);
    expect(screen.queryByRole('button', { name: '一键回滚' })).not.toBeInTheDocument();
  });

  it('rollback modal requires ≥20 char reason before confirm enables (AC-6)', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: '一键回滚' }));
    expect(screen.getByText(/超级危险操作/)).toBeInTheDocument();
    const confirmBtn = screen.getByText('提交回滚申请');
    expect(confirmBtn).toBeDisabled();
  });

  it('shows canary status card with currentVersion and nextVersion (AC-5)', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    expect(screen.getByText('v17')).toBeInTheDocument();
    expect(screen.getByText('v18')).toBeInTheDocument();
  });

  it('shows no-canary message when nextVersion is null', () => {
    render(<CanarySlider {...DEFAULT_PROPS} nextVersion={null} nextVersionId={null} />);
    expect(screen.getByText(/暂无灰度配置/)).toBeInTheDocument();
  });

  it('stepper buttons disabled when nextVersionId is null', () => {
    render(<CanarySlider {...DEFAULT_PROPS} nextVersion={null} nextVersionId={null} />);
    fireEvent.click(screen.getByText('50%'));
    expect(mockUpdateCanaryMutate).not.toHaveBeenCalled();
  });
});
