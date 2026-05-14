// PRD-13 US-008 · CanarySlider unit tests
// AC-1: 5-step stepper renders
// AC-2: 100% → confirm modal shown
// AC-3: 1-50% → direct updateCanary call
// AC-7: rollback button visible for super_admin only
// @vitest-environment jsdom

import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ── Hoisted mock for tRPC ─────────────────────────────────────────────────

const mockUpdateCanaryMutate = vi.hoisted(() => vi.fn());
const mockRollbackMutate = vi.hoisted(() => vi.fn());

vi.mock('../../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    prompts: {
      updateCanary: {
        useMutation: () => ({
          mutate: mockUpdateCanaryMutate,
          isPending: false,
        }),
      },
      rollback: {
        useMutation: () => ({
          mutate: mockRollbackMutate,
          isPending: false,
        }),
      },
    },
  },
}));

import { CanarySlider } from '../../../../apps/admin/src/pages/prompts/components/CanarySlider';

const DEFAULT_PROPS = {
  specialistId: 'PositioningAgent',
  mode: 'default',
  currentVersion: { id: 17, version: 17, judgeScore: '4.50', status: 'active' },
  nextVersion: null,
  currentCanaryPct: 10,
  isSuperAdmin: true,
  onRefetch: vi.fn(),
  onToast: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CanarySlider', () => {
  it('renders 5 step buttons', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('1%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('clicking 10% calls updateCanary directly (no modal)', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('50%'));
    expect(mockUpdateCanaryMutate).toHaveBeenCalledWith({
      specialistId: 'PositioningAgent',
      mode: 'default',
      canaryPct: 50,
    });
  });

  it('clicking 100% shows confirm modal, not immediate call', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('100%'));
    expect(screen.getByText(/确认完全发布/)).toBeInTheDocument();
    expect(mockUpdateCanaryMutate).not.toHaveBeenCalled();
  });

  it('clicking 0% shows confirm modal', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('0%'));
    expect(screen.getByText(/确认暂停灰度/)).toBeInTheDocument();
    expect(mockUpdateCanaryMutate).not.toHaveBeenCalled();
  });

  it('rollback button visible for super_admin', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    expect(screen.getByRole('button', { name: '一键回滚' })).toBeInTheDocument();
  });

  it('rollback button hidden for non-super_admin', () => {
    render(<CanarySlider {...DEFAULT_PROPS} isSuperAdmin={false} />);
    expect(screen.queryByRole('button', { name: '一键回滚' })).not.toBeInTheDocument();
  });

  it('rollback modal requires ≥20 char reason to enable confirm', () => {
    render(<CanarySlider {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: '一键回滚' }));
    expect(screen.getByText(/超级危险操作/)).toBeInTheDocument();
    // Confirm button should be disabled with short reason
    const confirmBtn = screen.getByText('提交回滚申请');
    expect(confirmBtn).toBeDisabled();
  });
});
