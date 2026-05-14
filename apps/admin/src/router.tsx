// PRD-10 US-005 · React Router · 16 域 route + /login + /admin 默认 + 404
// AC-9: BrowserRouter already in App.tsx · this exports the route tree

import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from './layouts/AdminLayout';
import AbPlaceholder from './pages/admin/placeholder/ab';
import AccountsPage from './pages/accounts/index';
import ApprovalPlaceholder from './pages/admin/placeholder/approval';
import AuditPage from './pages/audit/index';
import CompliancePlaceholder from './pages/admin/placeholder/compliance';
import ConfigPlaceholder from './pages/admin/placeholder/config';
import CostPage from './pages/cost/index';
import EvolutionHealthPage from './pages/evolutionHealth/EvolutionHealthPage';
import InvitesPage from './pages/invites/index';
import KnowledgePlaceholder from './pages/admin/placeholder/knowledge';
import NsmDashboard from './pages/nsm/index';
import PromptsPage from './pages/prompts/PromptsPage';
import QuotaPage from './pages/quota/QuotaPage';
import ReviewDeepLearnPage from './pages/reviewDeepLearn/index';
import ReviewTrendingPage from './pages/reviewTrending/index';
import UsersPage from './pages/users/index';
import Login from './pages/Login';

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<AdminLayout />}>
        {/* default → nsm */}
        <Route index element={<Navigate to="/admin/nsm" replace />} />

        {/* P0 核心 */}
        <Route path="nsm" element={<NsmDashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="cost" element={<CostPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="invites" element={<InvitesPage />} />

        {/* P0 内容审核 */}
        <Route path="reviewTrending" element={<ReviewTrendingPage />} />
        <Route path="reviewDeepLearn" element={<ReviewDeepLearnPage />} />

        {/* P1 健康度 */}
        <Route path="evolution-health" element={<EvolutionHealthPage />} />
        <Route path="prompts" element={<PromptsPage />} />
        <Route path="quota" element={<QuotaPage />} />
        <Route path="compliance" element={<CompliancePlaceholder />} />
        <Route path="approval" element={<ApprovalPlaceholder />} />

        {/* P2 高级 */}
        <Route path="ab" element={<AbPlaceholder />} />
        <Route path="knowledge" element={<KnowledgePlaceholder />} />
        <Route path="config" element={<ConfigPlaceholder />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
