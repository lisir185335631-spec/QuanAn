// PRD-10 US-005 · React Router · 16 域 route + /login + /admin 默认 + 404
// AC-9: BrowserRouter already in App.tsx · this exports the route tree
// PRD-26 US-006 · React.lazy 17 page chunks · Suspense fallback AdminLoading

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminLoading } from './components/AdminLoading';
import { AdminLayout } from './layouts/AdminLayout';
import Login from './pages/Login';

// P0 核心
const NsmDashboard = lazy(/* webpackChunkName: "p0-core" */ () => import('./pages/nsm/index'));
const UsersPage = lazy(/* webpackChunkName: "p0-core" */ () => import('./pages/users/index'));
const AccountsPage = lazy(/* webpackChunkName: "p0-core" */ () => import('./pages/accounts/index'));
const CostPage = lazy(/* webpackChunkName: "p0-core" */ () => import('./pages/cost/index'));
const AuditPage = lazy(/* webpackChunkName: "p0-core" */ () => import('./pages/audit/index'));
const InvitesPage = lazy(/* webpackChunkName: "p0-core" */ () => import('./pages/invites/index'));

// P0 内容审核
const ReviewTrendingPage = lazy(/* webpackChunkName: "p0-review" */ () => import('./pages/reviewTrending/index'));
const ReviewDeepLearnPage = lazy(/* webpackChunkName: "p0-review" */ () => import('./pages/reviewDeepLearn/index'));

// P1 健康度
const EvolutionHealthPage = lazy(/* webpackChunkName: "p1-health" */ () => import('./pages/evolutionHealth/EvolutionHealthPage'));
const PromptsPage = lazy(/* webpackChunkName: "p1-health" */ () => import('./pages/prompts/PromptsPage'));
const QuotaPage = lazy(/* webpackChunkName: "p1-health" */ () => import('./pages/quota/QuotaPage'));
const CompliancePage = lazy(/* webpackChunkName: "p1-health" */ () => import('./pages/compliance/index'));
const ApprovalGatesPage = lazy(/* webpackChunkName: "p1-health" */ () => import('./pages/approvals/index'));

// PRD-28 Evaluation
const EvaluationPage = lazy(/* webpackChunkName: "admin-evaluation" */ () => import('./pages/evaluation/EvaluationPage'));

// PRD-29 Diagnosis
const DiagnosisPage = lazy(/* webpackChunkName: "p1-health" */ () => import('./pages/diagnosis/index'));
const EvaluationDetailPage = lazy(/* webpackChunkName: "admin-evaluation" */ () => import('./pages/evaluation/EvaluationDetailPage'));
const InterRaterPage = lazy(/* webpackChunkName: "admin-evaluation" */ () => import('./pages/evaluation/InterRaterPage'));

// PRD-29.6 LLM Config
const LlmConfigPage = lazy(/* webpackChunkName: "p2-advanced" */ () => import('./pages/llmConfig/LlmConfigPage'));

// PRD-29 StepData
const StepDataPage = lazy(/* webpackChunkName: "p2-advanced" */ () => import('./pages/stepData/index'));

// PRD-29 History (生成历史)
const HistoryPage = lazy(/* webpackChunkName: "p2-advanced" */ () => import('./pages/history/index'));

// PRD-29 Topics (选题库)
const TopicsPage = lazy(/* webpackChunkName: "p2-advanced" */ () => import('./pages/topics/index'));

// PRD-29 DailyTasks (每日任务)
const DailyTasksPage = lazy(/* webpackChunkName: "p2-advanced" */ () => import('./pages/dailyTasks/index'));

// P2 高级
const AbExperimentsPage = lazy(/* webpackChunkName: "p2-advanced" */ () => import('./pages/abExperiments/AbExperimentsPage'));
const ExperimentDetailPage = lazy(/* webpackChunkName: "p2-advanced" */ () => import('./pages/abExperiments/ExperimentDetailPage'));
const ConstantsPage = lazy(/* webpackChunkName: "p2-advanced" */ () => import('./pages/constants/ConstantsPage'));
const FeatureFlagsPage = lazy(/* webpackChunkName: "p2-advanced" */ () => import('./pages/featureFlags/FeatureFlagsPage'));
const KnowledgePlaceholder = lazy(/* webpackChunkName: "p2-advanced" */ () => import('./pages/admin/placeholder/knowledge'));

export function AdminRoutes() {
  return (
    <Suspense fallback={<AdminLoading />}>
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
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="approvals" element={<ApprovalGatesPage />} />

          {/* PRD-28 Evaluation */}
          <Route path="evaluation" element={<EvaluationPage />} />

          {/* PRD-29 Diagnosis */}
          <Route path="diagnosis" element={<DiagnosisPage />} />
          <Route path="evaluation/:runId" element={<EvaluationDetailPage />} />
          {/* AC-7: inter-rater route · nav 不显示(仅 click-through) */}
          <Route path="evaluation/inter-rater/:runId" element={<InterRaterPage />} />

          {/* P2 高级 */}
          <Route path="ab-experiments" element={<AbExperimentsPage />} />
          <Route path="ab-experiments/:experimentKey" element={<ExperimentDetailPage />} />
          <Route path="constants" element={<ConstantsPage />} />
          <Route path="knowledge" element={<KnowledgePlaceholder />} />
          <Route path="feature-flags" element={<FeatureFlagsPage />} />

          {/* PRD-29.6 LLM Config */}
          <Route path="llm-config" element={<LlmConfigPage />} />

          {/* PRD-29 StepData */}
          <Route path="step-data" element={<StepDataPage />} />

          {/* PRD-29 History (生成历史) */}
          <Route path="history" element={<HistoryPage />} />

          {/* PRD-29 Topics (选题库) */}
          <Route path="topics" element={<TopicsPage />} />

          {/* PRD-29 DailyTasks (每日任务) */}
          <Route path="daily-tasks" element={<DailyTasksPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
