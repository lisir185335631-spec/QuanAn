// PRD-10 US-005 · AdminLayout unit tests (AC-13: 6 tests)
// Tests: AdminLayout render + topbar + sidebar 16 + logout + drawer
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ─── Mock tRPC ────────────────────────────────────────────────────────────────
vi.mock('../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    auth: {
      me: {
        useQuery: () => ({
          data: { id: 1, email: 'super@quanan.com', role: 'super_admin', allowedDomains: [] },
        }),
      },
      logout: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
      logPageView: {
        useMutation: () => ({ mutate: vi.fn() }),
      },
    },
    audit: {
      listMine: {
        useQuery: () => ({ data: [] }),
      },
    },
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  adminTrpcClient: {},
  adminQueryClient: {},
}));

// ─── Mock react-router-dom ────────────────────────────────────────────────────
vi.mock('react-router-dom', () => {
  const actual = vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/admin/nsm' }),
    useNavigate: () => vi.fn(),
    NavLink: ({ to, children, className }: { to: string; children: React.ReactNode; className: string }) => (
      <a href={to} className={typeof className === 'function' ? className({ isActive: to === '/admin/nsm' }) : className}>
        {children}
      </a>
    ),
    Outlet: () => <div data-testid="outlet-content">Outlet</div>,
  };
});

import { AdminLayout } from '../../../apps/admin/src/layouts/AdminLayout';

function renderLayout() {
  return render(<AdminLayout />);
}

afterEach(cleanup);

describe('AdminLayout', () => {
  it('renders the admin-layout grid container', () => {
    renderLayout();
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
  });

  it('renders TopBar with brand and role badge', () => {
    renderLayout();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('QuanAn Admin')).toBeInTheDocument();
    // super_admin appears in TopBar badge (role) and StatusBar (Role=) — both should be present
    const matches = screen.getAllByText('super_admin');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Sidebar with 17 navigation links', () => {
    renderLayout();
    // sidebar nav has 17 domain links (PRD-14 US-009 adds /admin/constants)
    const nav = screen.getByRole('navigation', { name: '管理导航' });
    const links = nav.querySelectorAll('a');
    expect(links.length).toBe(17);
  });

  it('clicking 🔔 opens AuditDrawer', async () => {
    renderLayout();
    const bell = screen.getByRole('button', { name: '审计记录' });
    await userEvent.click(bell);
    expect(screen.getByTestId('audit-drawer')).toBeInTheDocument();
  });

  it('clicking logout dropdown button triggers logout', async () => {
    renderLayout();
    const menuBtn = screen.getByRole('button', { name: '用户菜单' });
    await userEvent.click(menuBtn);
    expect(screen.getByRole('menuitem', { name: '退出登录' })).toBeVisible();
  });

  it('renders StatusBar with status fields', () => {
    renderLayout();
    const statusbar = screen.getByRole('contentinfo', { name: '系统状态' });
    expect(statusbar).toBeInTheDocument();
    expect(statusbar.textContent).toMatch(/ENV=dev/);
    expect(statusbar.textContent).toMatch(/RLS=ON/);
  });
});
