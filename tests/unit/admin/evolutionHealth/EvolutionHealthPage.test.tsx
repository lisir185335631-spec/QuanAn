// PRD-13 US-006 · EvolutionHealthPage unit tests
// AC-2: 标准页面布局 + 标题
// AC-3: KPI cards + L分布 + 飞轮仪表
// AC-4: DenseTable 存在
// AC-7: 空状态 + 加载状态 + 错误状态
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ── Mock recharts (no SVG rendering in jsdom) ─────────────────────────────────
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// ── Mock DenseTable ────────────────────────────────────────────────────────────
vi.mock('@quanqn/ui/admin', () => ({
  DenseTable: ({ data, loading }: { data: unknown[]; loading?: boolean }) => (
    <div data-testid="dense-table">
      {loading ? 'loading' : `rows:${data.length}`}
    </div>
  ),
}));

// ── Mock react-router-dom ─────────────────────────────────────────────────────
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// ── Mock tRPC ─────────────────────────────────────────────────────────────────
const mockMe = vi.hoisted(() => vi.fn());
const mockLDist = vi.hoisted(() => vi.fn());
const mockFlywheel = vi.hoisted(() => vi.fn());
const mockStats = vi.hoisted(() => vi.fn());
const mockList = vi.hoisted(() => vi.fn());
const mockTimeline = vi.hoisted(() => vi.fn());
const mockForceRebuild = vi.hoisted(() => vi.fn());
const mockMarkResolved = vi.hoisted(() => vi.fn());

vi.mock('../../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    auth: {
      me: { useQuery: mockMe },
    },
    evolution: {
      getLDistribution: { useQuery: mockLDist },
      getFlywheelHealth: { useQuery: mockFlywheel },
      getAnomalyStats: { useQuery: mockStats },
      listAnomalies: { useQuery: mockList },
      getAccountTimeline: { useQuery: mockTimeline },
      forceRebuildEvolution: { useMutation: mockForceRebuild },
      markAnomalyResolved: { useMutation: mockMarkResolved },
    },
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  adminTrpcClient: {},
  adminQueryClient: {},
}));

// ── Import SUT ────────────────────────────────────────────────────────────────
import EvolutionHealthPage from '../../../../apps/admin/src/pages/evolutionHealth/EvolutionHealthPage';

function setupDefaultMocks() {
  mockMe.mockReturnValue({ data: { id: 1, email: 'admin@quanqn.com', role: 'super_admin' } });
  mockTimeline.mockReturnValue({ data: { profile: null, insights: [], anomalyFlags: [] }, isLoading: false });
  mockForceRebuild.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockMarkResolved.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockLDist.mockReturnValue({ data: { L1: 10, L2: 20, L3: 5, L4: 2, L5: 1 }, isLoading: false });
  mockFlywheel.mockReturnValue({
    data: { status: 'green', stalledCount: 0, conflictCount: 0, healthyCount: 38 },
    isLoading: false,
  });
  mockStats.mockReturnValue({
    data: { byType: {}, bySeverity: { high: 2, medium: 3 }, last24h: 1, last7d: 5 },
  });
  mockList.mockReturnValue({
    data: {
      items: [
        {
          id: 1,
          accountId: 101,
          anomalyType: 'flywheel_stalled',
          severity: 'medium',
          evidence: {},
          detectedAt: new Date(),
          resolvedAt: null,
          resolution: null,
          resolvedByAdminId: null,
        },
      ],
      nextCursor: undefined,
    },
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  });
}

afterEach(cleanup);

describe('EvolutionHealthPage', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it('renders page title', () => {
    render(<EvolutionHealthPage />);
    expect(screen.getByText(/进化档案监控/)).toBeInTheDocument();
  });

  it('renders 4 KPI cards area with anomaly count', () => {
    render(<EvolutionHealthPage />);
    expect(screen.getByText(/未解决异常账号数/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // high(2)+medium(3)=5
  });

  it('renders flywheel health gauge section', () => {
    render(<EvolutionHealthPage />);
    expect(screen.getByText(/飞轮健康度/i)).toBeInTheDocument();
    expect(screen.getByText('健康')).toBeInTheDocument();
  });

  it('renders L distribution pie chart', () => {
    render(<EvolutionHealthPage />);
    // getByText with exact text to avoid matching outer container
    expect(screen.getAllByText(/L 等级分布/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders anomaly list table', () => {
    render(<EvolutionHealthPage />);
    expect(screen.getByTestId('dense-table')).toBeInTheDocument();
    expect(screen.getByText('rows:1')).toBeInTheDocument();
  });

  it('renders filter selects', () => {
    render(<EvolutionHealthPage />);
    expect(screen.getByRole('combobox', { name: /异常类型筛选/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /严重程度筛选/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /解决状态筛选/i })).toBeInTheDocument();
  });

  it('shows empty state when no anomalies', () => {
    mockList.mockReturnValue({
      data: { items: [], nextCursor: undefined },
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockStats.mockReturnValue({
      data: { byType: {}, bySeverity: {}, last24h: 0, last7d: 0 },
    });
    render(<EvolutionHealthPage />);
    expect(screen.getByText(/所有账号档案健康/)).toBeInTheDocument();
  });

  it('shows skeleton when loading initial list', () => {
    mockList.mockReturnValue({
      data: undefined,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    });
    render(<EvolutionHealthPage />);
    // When loading and no items yet, skeleton rows appear (no dense-table)
    expect(screen.queryByTestId('dense-table')).not.toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    mockList.mockReturnValue({
      data: undefined,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    });
    render(<EvolutionHealthPage />);
    expect(screen.getByText(/数据加载失败/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
  });

  it('shows avg upgrade cycle as placeholder', () => {
    render(<EvolutionHealthPage />);
    expect(screen.getByText(/平均升级周期/i)).toBeInTheDocument();
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });
});
