// PRD-14 US-004 · AbExperimentsPage unit tests
// AC-14: renders 4 KPI cards, renders experiment table, status filter, status badges
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ── Mock tRPC ─────────────────────────────────────────────────────────────

const mockGetKpiStats = vi.fn();
const mockList = vi.fn();
const mockMe = vi.fn();

vi.mock('../../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    auth: {
      me: { useQuery: () => mockMe() },
    },
    abExperiments: {
      getKpiStats: { useQuery: () => mockGetKpiStats() },
      list: { useQuery: (_: unknown) => mockList() },
    },
  },
  adminTrpcClient: {},
  adminQueryClient: {},
}));

// Mock DenseTable to avoid @quanqn/ui dependency complexity
vi.mock('@quanqn/ui/admin', () => ({
  DenseTable: ({
    data,
    onRowClick,
  }: {
    data: Array<{ id: number; name: string; status: string }>;
    onRowClick?: (row: unknown) => void;
  }) => (
    <div data-testid="dense-table">
      {data.map((r) => (
        <div key={r.id} data-testid={`row-${r.id}`} onClick={() => onRowClick?.(r)}>
          {r.name} - {r.status}
        </div>
      ))}
    </div>
  ),
}));

// Mock drawer + modal to simplify
vi.mock('../../../../apps/admin/src/pages/abExperiments/AbExperimentDrawer', () => ({
  AbExperimentDrawer: ({ selected }: { selected: unknown }) =>
    selected ? <div data-testid="drawer">Drawer Open</div> : null,
}));

vi.mock('../../../../apps/admin/src/pages/abExperiments/components/CreateExperimentModal', () => ({
  CreateExperimentModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="create-modal">
      <button onClick={onClose}>关闭Modal</button>
    </div>
  ),
}));

import AbExperimentsPage from '../../../../apps/admin/src/pages/abExperiments/AbExperimentsPage';

afterEach(cleanup);

describe('AbExperimentsPage', () => {
  beforeEach(() => {
    mockMe.mockReturnValue({ data: { id: 1, email: 'admin@test.com', role: 'super_admin' } });
    mockGetKpiStats.mockReturnValue({
      data: { runningCount: 3, recentStarted: 2, avgSampleSize: 500, autoStopRate: 25 },
      refetch: vi.fn(),
    });
    mockList.mockReturnValue({
      data: { items: [], nextCursor: undefined },
      refetch: vi.fn(),
      isFetching: false,
    });
  });

  it('renders page title', () => {
    render(<AbExperimentsPage />);
    expect(screen.getByText(/A\/B 实验管理/)).toBeInTheDocument();
  });

  it('renders 4 KPI cards with data', () => {
    render(<AbExperimentsPage />);
    expect(screen.getByText('运行中实验')).toBeInTheDocument();
    expect(screen.getByText('7天新启')).toBeInTheDocument();
    expect(screen.getByText(/平均 Sample Size/)).toBeInTheDocument();
    expect(screen.getByText(/自动停损率/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // runningCount
    expect(screen.getByText('25%')).toBeInTheDocument(); // autoStopRate
  });

  it('shows empty message when no experiments', () => {
    render(<AbExperimentsPage />);
    expect(screen.getByText('暂无实验')).toBeInTheDocument();
  });

  it('renders experiments in table', () => {
    mockList.mockReturnValue({
      data: {
        items: [
          {
            id: 1,
            experimentKey: 'test-exp',
            name: 'Test Experiment',
            status: 'running',
            variantCount: 3,
            sampleSize: 500,
            startedAt: new Date(),
            stoppedAt: null,
            createdAt: new Date(),
            trafficAllocation: { control: 50, variant_a: 30, variant_b: 20 },
          },
        ],
        nextCursor: undefined,
      },
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<AbExperimentsPage />);
    expect(screen.getByText(/Test Experiment/)).toBeInTheDocument();
  });

  it('opens create modal when 新建实验 button clicked', async () => {
    render(<AbExperimentsPage />);
    await userEvent.click(screen.getByText('+ 新建实验'));
    expect(screen.getByTestId('create-modal')).toBeInTheDocument();
  });

  it('closes create modal on close', async () => {
    render(<AbExperimentsPage />);
    await userEvent.click(screen.getByText('+ 新建实验'));
    await userEvent.click(screen.getByText('关闭Modal'));
    expect(screen.queryByTestId('create-modal')).not.toBeInTheDocument();
  });

  it('renders status filter select', () => {
    render(<AbExperimentsPage />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('全部状态')).toBeInTheDocument();
    expect(screen.getByText('运行中')).toBeInTheDocument();
  });
});
