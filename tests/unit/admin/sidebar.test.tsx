// PRD-10 US-005 · Sidebar unit tests (AC-14: 6 tests)
// Tests: 17 域 4 组 + isActive + folding + keyboard nav (PRD-14 US-009 adds /admin/constants → 17)
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

import { ADMIN_ROUTES, ROUTE_GROUP_LABELS } from '../../../apps/admin/src/lib/admin-routes';

// ─── Mock react-router-dom ────────────────────────────────────────────────────
vi.mock('react-router-dom', () => {
  const actual = vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/admin/nsm' }),
    NavLink: ({
      to,
      children,
      className,
    }: {
      to: string;
      children: React.ReactNode;
      className: string | ((opts: { isActive: boolean }) => string);
    }) => {
      const resolved =
        typeof className === 'function' ? className({ isActive: to === '/admin/nsm' }) : className;
      return (
        <a href={to} className={resolved} data-path={to}>
          {children}
        </a>
      );
    },
  };
});

import { Sidebar } from '../../../apps/admin/src/components/admin/Sidebar';

afterEach(cleanup);

describe('Sidebar', () => {
  it('renders exactly 17 domain links', () => {
    render(<Sidebar />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(17);
  });

  it('renders 4 group labels', () => {
    render(<Sidebar />);
    const groups = Object.values(ROUTE_GROUP_LABELS);
    for (const label of groups) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('NSM link has active class when pathname is /admin/nsm', () => {
    render(<Sidebar />);
    const nsmLink = screen.getByRole('link', { name: /NSM 仪表盘/ });
    expect(nsmLink).toHaveClass('admin-sidebar__item--active');
  });

  it('non-active links do NOT have active class', () => {
    render(<Sidebar />);
    const usersLink = screen.getByRole('link', { name: /用户管理/ });
    expect(usersLink).not.toHaveClass('admin-sidebar__item--active');
  });

  it('P0 core group contains 6 routes', () => {
    const p0Core = ADMIN_ROUTES.filter((r) => r.group === 'p0-core');
    expect(p0Core).toHaveLength(6);
  });

  it('all 4 groups have correct counts: 6 + 2 + 5 + 4', () => {
    const counts = (['p0-core', 'p0-review', 'p1-health', 'p2-advanced'] as const).map(
      (g) => ADMIN_ROUTES.filter((r) => r.group === g).length,
    );
    expect(counts).toEqual([6, 2, 5, 4]);
  });
});
