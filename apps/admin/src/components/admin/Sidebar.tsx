// PRD-10 US-005 · Sidebar 240px · 16 域 4 组
// AC-3: NavLink + isActive highlight · ScrollArea + h-[calc(100vh-60px-48px)]

import { NavLink, useLocation } from 'react-router-dom';

import { ADMIN_ROUTES, ROUTE_GROUP_LABELS, type AdminRouteItem } from '../../lib/admin-routes';

const GROUPS: Array<AdminRouteItem['group']> = ['p0-core', 'p0-review', 'p1-health', 'p2-advanced'];

export function Sidebar() {
  const location = useLocation();

  return (
    <nav
      className="admin-sidebar"
      aria-label="管理导航"
      style={{
        height: `calc(100vh - var(--topbar-height) - var(--statusbar-height))`,
      }}
    >
      {GROUPS.map((group) => {
        const items = ADMIN_ROUTES.filter((r) => r.group === group);
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
