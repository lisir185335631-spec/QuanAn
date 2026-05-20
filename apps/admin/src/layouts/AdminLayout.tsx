// PRD-10 US-005 · AdminLayout · grid 模板
// PRD-26 US-003: route guard + page_view audit
// PRD-26 US-004: 4 layout components lifted to @quanan/ui/admin; adminTrpc stays here

import { AuditDrawer, Sidebar, StatusBar, TopBar, type SidebarGroup } from '@quanan/ui/admin';
import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { adminTrpc } from '../lib/admin-client';
import { ADMIN_ROUTES, getAllowedRoutes, isDomainAllowed, ROUTE_GROUP_LABELS } from '../lib/admin-routes';

const SIDEBAR_GROUPS = ['p0-core', 'p0-review', 'p1-health', 'p2-advanced'] as const;

function usePageViewAudit(path: string) {
  const logPageView = adminTrpc.auth.logPageView.useMutation();
  const lastPath = useRef<string>('');

  useEffect(() => {
    if (path === lastPath.current) return;
    lastPath.current = path;
    logPageView.mutate({ path });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
}

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: me, isLoading: meLoading } = adminTrpc.auth.me.useQuery(undefined, { retry: false });
  const location = useLocation();
  const navigate = useNavigate();

  const logout = adminTrpc.auth.logout.useMutation({
    onSuccess: () => navigate('/login'),
  });

  const { data: auditData } = adminTrpc.audit.listMine.useQuery(undefined, {
    enabled: drawerOpen,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  usePageViewAudit(location.pathname);

  // Route guard: redirect to first allowed route if current path domain is not allowed.
  if (!meLoading && me) {
    const route = ADMIN_ROUTES.find((r) => location.pathname.startsWith(r.path));
    if (route && !isDomainAllowed(route.domainKey, me.allowedDomains)) {
      const allowedRoutes = getAllowedRoutes(me.allowedDomains);
      const redirectTo = allowedRoutes[0]?.path ?? '/login';
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Pre-compute sidebar groups for Sidebar component
  const allowedDomains = me?.allowedDomains ?? [];
  const visibleRoutes = getAllowedRoutes(allowedDomains);
  const sidebarGroups: SidebarGroup[] = SIDEBAR_GROUPS
    .map((group) => ({
      key: group as string,
      label: ROUTE_GROUP_LABELS[group],
      items: visibleRoutes
        .filter((r) => r.group === group)
        .map((r) => ({ path: r.path, emoji: r.emoji, label: r.label })),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="admin-layout" data-testid="admin-layout">
      <TopBar
        userEmail={me?.email ?? ''}
        userRole={me?.role ?? ''}
        onAuditDrawerToggle={() => setDrawerOpen((v) => !v)}
        auditDrawerOpen={drawerOpen}
        onLogout={() => logout.mutate()}
      />

      <Sidebar
        role={me?.role ?? ''}
        groups={sidebarGroups}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
      />

      <main className="admin-main" role="main">
        <Outlet />
      </main>

      <StatusBar role={me?.role} />

      <AuditDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        logs={auditData ?? []}
      />
    </div>
  );
}
