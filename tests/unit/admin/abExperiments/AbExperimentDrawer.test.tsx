// PRD-14 US-004 · AbExperimentDrawer unit tests
// AC-5/8: renders drawer info, shows stop button for super_admin only, hides for admin
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ── Mock tRPC ─────────────────────────────────────────────────────────────

const mockGetDetail = vi.fn();
const mockGetMultiMetric = vi.fn();

vi.mock('../../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    abExperiments: {
      getDetail: { useQuery: (_: unknown, __: unknown) => mockGetDetail() },
      getMultiMetric: { useQuery: (_: unknown, __: unknown) => mockGetMultiMetric() },
      stop: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ ok: true }),
          isPending: false,
        }),
      },
    },
  },
  adminTrpcClient: {},
  adminQueryClient: {},
}));

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Legend: () => null,
}));

vi.mock('../../../../apps/admin/src/pages/abExperiments/components/MultiMetricChart', () => ({
  MultiMetricChart: ({ results }: { results: unknown[] }) => (
    <div data-testid="multi-metric-chart">metrics: {results.length}</div>
  ),
}));

import { AbExperimentDrawer } from '../../../../apps/admin/src/pages/abExperiments/AbExperimentDrawer';
import type { ExperimentRow } from '../../../../apps/admin/src/pages/abExperiments/AbExperimentDrawer';

afterEach(cleanup);

const mockExperiment: ExperimentRow = {
  id: 1,
  experimentKey: 'test-exp-key',
  name: 'Test Experiment',
  status: 'running',
  variantCount: 3,
  sampleSize: 500,
  startedAt: new Date('2026-05-01T10:00:00'),
  stoppedAt: null,
  createdAt: new Date('2026-05-01T09:00:00'),
  trafficAllocation: { control: 50, variant_a: 30, variant_b: 20 },
};

describe('AbExperimentDrawer', () => {
  beforeEach(() => {
    mockGetDetail.mockReturnValue({
      data: {
        id: 1,
        experimentKey: 'test-exp-key',
        name: 'Test Experiment',
        description: 'Test description',
        status: 'running',
        variantConfig: { control: {}, variant_a: {}, variant_b: {} },
        trafficAllocation: { control: 50, variant_a: 30, variant_b: 20 },
        startedAt: new Date('2026-05-01T10:00:00'),
        stoppedAt: null,
        resultSummary: null,
        createdAt: new Date('2026-05-01T09:00:00'),
        sampleSize: 500,
        timeline: [
          { day: new Date('2026-05-01'), count: 100 },
          { day: new Date('2026-05-02'), count: 150 },
        ],
      },
    });
    mockGetMultiMetric.mockReturnValue({
      data: { results: [{ metric: 'conversion', testType: 'chi_square', pValue: 0.04, isSignificant: true, effect: 0.1, sampleSize: 500, confidence: 0.95, recommendation: 'stop_winner' }] },
    });
  });

  it('renders nothing when selected is null', () => {
    render(
      <AbExperimentDrawer selected={null} currentRole="admin" onClose={() => {}} onRefresh={() => {}} />,
    );
    expect(screen.queryByText('Test Experiment')).not.toBeInTheDocument();
  });

  it('renders experiment name and key', () => {
    render(
      <AbExperimentDrawer
        selected={mockExperiment}
        currentRole="admin"
        onClose={() => {}}
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByText('Test Experiment')).toBeInTheDocument();
    expect(screen.getAllByText('test-exp-key').length).toBeGreaterThan(0);
  });

  it('shows 一键停损 button for super_admin when experiment is running', () => {
    render(
      <AbExperimentDrawer
        selected={mockExperiment}
        currentRole="super_admin"
        onClose={() => {}}
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByText(/一键停损/)).toBeInTheDocument();
  });

  it('does NOT show 一键停损 button for admin (SHIELD: super_admin only)', () => {
    render(
      <AbExperimentDrawer
        selected={mockExperiment}
        currentRole="admin"
        onClose={() => {}}
        onRefresh={() => {}}
      />,
    );
    expect(screen.queryByText(/一键停损/)).not.toBeInTheDocument();
  });

  it('does NOT show 一键停损 for stopped experiment (even super_admin)', () => {
    render(
      <AbExperimentDrawer
        selected={{ ...mockExperiment, status: 'stopped' }}
        currentRole="super_admin"
        onClose={() => {}}
        onRefresh={() => {}}
      />,
    );
    expect(screen.queryByText(/一键停损/)).not.toBeInTheDocument();
  });

  it('calls onClose when × is clicked', async () => {
    const onClose = vi.fn();
    render(
      <AbExperimentDrawer
        selected={mockExperiment}
        currentRole="admin"
        onClose={onClose}
        onRefresh={() => {}}
      />,
    );
    await userEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows stop confirm modal when 一键停损 clicked (super_admin)', async () => {
    render(
      <AbExperimentDrawer
        selected={mockExperiment}
        currentRole="super_admin"
        onClose={() => {}}
        onRefresh={() => {}}
      />,
    );
    await userEvent.click(screen.getByText(/一键停损/));
    expect(screen.getByText(/一键停损确认/)).toBeInTheDocument();
  });

  it('stop confirm requires ≥ 20 char reason', async () => {
    render(
      <AbExperimentDrawer
        selected={mockExperiment}
        currentRole="super_admin"
        onClose={() => {}}
        onRefresh={() => {}}
      />,
    );
    await userEvent.click(screen.getByText(/一键停损/));
    await userEvent.click(screen.getByText('确认停损'));
    expect(screen.getByText(/至少 20 个字/)).toBeInTheDocument();
  });
});
