import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CompliancePage from '../index';

vi.mock('@react-pdf/renderer', () => ({
  PDFDownloadLink: ({ children }: { children: (opts: { loading: boolean }) => unknown }) =>
    children({ loading: false }),
  Document: ({ children }: { children: unknown }) => children,
  Page: ({ children }: { children: unknown }) => children,
  Text: ({ children }: { children: unknown }) => children,
  View: ({ children }: { children: unknown }) => children,
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Font: { register: () => {}, registerHyphenationCallback: () => {} },
  Image: () => null,
  Link: ({ children }: { children: unknown }) => children,
}));

const { mockKpi } = vi.hoisted(() => ({ mockKpi: vi.fn() }));

vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  return {
    adminTrpc: {
      useUtils: () => ({
        compliance: {
          listEvents: { fetch: async () => ({ items: [], nextCursor: null }) },
        },
      }),
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      compliance: {
        getKpiStats: { useQuery: mockKpi },
        getIndustryBreakdown: { useQuery: q() },
        getTrend: { useQuery: q() },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

beforeEach(() => {
  mockKpi.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

describe('CompliancePage', () => {
  it('renders without crash', () => {
    render(<CompliancePage />, { wrapper: MemoryRouter });
  });

  it('h2 主标题 行业合规仪表盘', () => {
    render(<CompliancePage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/行业合规仪表盘/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockKpi.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
    render(<CompliancePage />, { wrapper: MemoryRouter });
  });
});
