// PRD-10 US-005 · AdminLayout · grid 模板
// PRD-26 US-003: route guard (redirect to /admin if unauthorized domain) + page_view audit logging

import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AuditDrawer } from '../components/admin/AuditDrawer';
import { Sidebar } from '../components/admin/Sidebar';
import { StatusBar } from '../components/admin/StatusBar';
import { TopBar } from '../components/admin/TopBar';
import { adminTrpc } from '../lib/admin-client';
import { ADMIN_ROUTES, getAllowedRoutes, isDomainAllowed } from '../lib/admin-routes';

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

  usePageViewAudit(location.pathname);

  // Route guard: redirect to first allowed route if current path domain is not allowed.
  // Redirects to /login if user has no allowed routes at all.
  if (!meLoading && me) {
    const route = ADMIN_ROUTES.find((r) => location.pathname.startsWith(r.path));
    if (route && !isDomainAllowed(route.domainKey, me.allowedDomains)) {
      const allowedRoutes = getAllowedRoutes(me.allowedDomains);
      const redirectTo = allowedRoutes[0]?.path ?? '/login';
      return <Navigate to={redirectTo} replace />;
    }
  }

  return (
    <div className="admin-layout" data-testid="admin-layout">
      <TopBar
        onAuditDrawerToggle={() => setDrawerOpen((v) => !v)}
        auditDrawerOpen={drawerOpen}
      />

      <Sidebar />

      <main className="admin-main" role="main">
        <Outlet />
      </main>

      <StatusBar role={me?.role} />

      <AuditDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
