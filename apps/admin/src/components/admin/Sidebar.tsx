// PRD-10 US-005 · Sidebar 240px · 16 域 4 组
// PRD-26 US-003: filter by allowedDomains from auth.me (server-authoritative · no frontend hardcoding)

import { NavLink, useLocation } from 'react-router-dom';

import { adminTrpc } from '../../lib/admin-client';
import { getAllowedRoutes, ROUTE_GROUP_LABELS, type AdminRouteItem } from '../../lib/admin-routes';

const GROUPS: Array<AdminRouteItem['group']> = ['p0-core', 'p0-review', 'p1-health', 'p2-advanced'];

export function Sidebar() {
  const location = useLocation();
  const { data: me } = adminTrpc.auth.me.useQuery(undefined, { retry: false });
  const allowedDomains = me?.allowedDomains ?? [];
  const visibleRoutes = getAllowedRoutes(allowedDomains);

  return (
    <nav
      className="admin-sidebar"
      aria-label="管理导航"
      style={{
        height: `calc(100vh - var(--topbar-height) - var(--statusbar-height))`,
      }}
    >
      {GROUPS.map((group) => {
        const items = visibleRoutes.filter((r) => r.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} role="group" aria-label={ROUTE_GROUP_LABELS[group]}>
            <div className="admin-sidebar__group-label">{ROUTE_GROUP_LABELS[group]}</div>
            {items.map((route) => {
              const isActive = location.pathname === route.path;
              return (
                <NavLink
                  key={route.path}
                  to={route.path}
                  className={`admin-sidebar__item${isActive ? ' admin-sidebar__item--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="admin-sidebar__emoji" aria-hidden="true">
                    {route.emoji}
                  </span>
                  {route.label}
                </NavLink>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
