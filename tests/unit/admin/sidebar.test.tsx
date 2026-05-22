// PRD-10 US-005 · Sidebar unit tests (AC-14: 6 tests)
// PRD-26 US-004: updated to use props API (groups/currentPath/onNavigate injected, no react-router-dom dep)
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

import { ADMIN_ROUTES, ROUTE_GROUP_LABELS } from '../../../apps/admin/src/lib/admin-routes';
import { Sidebar } from '@quanan/ui/admin';
import type { SidebarGroup } from '@quanan/ui/admin';

afterEach(cleanup);

const ALL_GROUPS = ['p0-core', 'p0-review', 'p1-health', 'p2-advanced'] as const;

function buildGroups(currentPath?: string): SidebarGroup[] {
  return ALL_GROUPS
    .map((group) => ({
      key: group as string,
      label: ROUTE_GROUP_LABELS[group],
      items: ADMIN_ROUTES.filter((r) => r.group === group).map((r) => ({
        path: r.path,
        emoji: r.emoji,
        label: r.label,
      })),
    }))
    .filter((g) => g.items.length > 0);
}

describe('Sidebar', () => {
  it('renders exactly 18 domain links', () => {
    const groups = buildGroups();
    render(
      <Sidebar role="super_admin" groups={groups} currentPath="/admin/nsm" onNavigate={vi.fn()} />,
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(18);
  });

  it('renders 4 group labels', () => {
    const groups = buildGroups();
    render(
      <Sidebar role="super_admin" groups={groups} currentPath="/admin/nsm" onNavigate={vi.fn()} />,
    );
    const groupLabels = Object.values(ROUTE_GROUP_LABELS);
    for (const label of groupLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('NSM link has active class when currentPath is /admin/nsm', () => {
    const groups = buildGroups();
    render(
      <Sidebar role="super_admin" groups={groups} currentPath="/admin/nsm" onNavigate={vi.fn()} />,
    );
    const nsmLink = screen.getByRole('link', { name: /NSM 仪表盘/ });
    expect(nsmLink).toHaveClass('admin-sidebar__item--active');
  });

  it('non-active links do NOT have active class', () => {
    const groups = buildGroups();
    render(
      <Sidebar role="super_admin" groups={groups} currentPath="/admin/nsm" onNavigate={vi.fn()} />,
    );
    const usersLink = screen.getByRole('link', { name: /用户管理/ });
    expect(usersLink).not.toHaveClass('admin-sidebar__item--active');
  });

  it('P0 core group contains 6 routes', () => {
    const p0Core = ADMIN_ROUTES.filter((r) => r.group === 'p0-core');
    expect(p0Core).toHaveLength(6);
  });

  it('all 4 groups have correct counts: 6 + 2 + 6 + 4', () => {
    const counts = ALL_GROUPS.map(
      (g) => ADMIN_ROUTES.filter((r) => r.group === g).length,
    );
    expect(counts).toEqual([6, 2, 6, 4]);
  });
});
