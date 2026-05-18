// PRD-10 US-005 · AdminLayout · grid 模板
// AC-1: topbar(60px) + sidebar(240px) + main(自适应) + audit-drawer(portal) + status-bar(24px)

import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { AuditDrawer } from '../components/admin/AuditDrawer';
import { Sidebar } from '../components/admin/Sidebar';
import { StatusBar } from '../components/admin/StatusBar';
import { TopBar } from '../components/admin/TopBar';
import { adminTrpc } from '../lib/admin-client';

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: me } = adminTrpc.auth.me.useQuery();

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
