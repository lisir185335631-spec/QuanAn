/**
 * PRD-3 US-001 · createBrowserRouter · 34 routes
 * Route groups (chunks):
 *   step/*      → step chunk (9 routes)
 *   tools/*     → 14 tool pages (lazy individually, shared vite chunk via webpackChunkName)
 *   modules/*   → 6 new modules
 *   auxiliary   → /ip-plan, /settings, /login, /404 catch-all
 */

import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { RootLayout } from '@/layouts/RootLayout';
import NotFound from '@/pages/NotFound';

// ── Step pages (9) — one shared chunk ────────────────────────────────────────
const Step1 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step1'));
const Step3 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step3'));
const Step3b = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step3b'));
const Step4 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step4'));
const Step4b = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step4b'));
const Step5 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step5'));
const Step6 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step6'));
const Step7 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step7'));
const Step8 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step8'));

// ── Tool pages (14) — shared tools chunk ─────────────────────────────────────
const Trending = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/Trending'));
const VideoAnalysis = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/VideoAnalysis'));
const PresentStyles = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/PresentStyles'));
const Monetization = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/Monetization'));
const PrivateDomain = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/PrivateDomain'));
const BoomGenerate = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/BoomGenerate'));
const Generate = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/Generate'));
const Analysis = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/Analysis'));
const VideoProduction = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/VideoProduction'));
const AcquisitionVideo = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/AcquisitionVideo'));
const AiVideo = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/AiVideo'));
const VoiceChat = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/VoiceChat'));
const DeepLearning = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/DeepLearning'));
const Knowledge = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/Knowledge'));

// ── New module pages (6) — shared modules chunk ───────────────────────────────
const Diagnosis = lazy(() => import(/* webpackChunkName: "modules" */ '@/pages/modules/Diagnosis'));
const DailyTasks = lazy(() => import(/* webpackChunkName: "modules" */ '@/pages/modules/DailyTasks'));
const Evolution = lazy(() => import(/* webpackChunkName: "modules" */ '@/pages/modules/Evolution'));
const Accounts = lazy(() => import(/* webpackChunkName: "modules" */ '@/pages/modules/Accounts'));
const MyTopics = lazy(() => import(/* webpackChunkName: "modules" */ '@/pages/modules/MyTopics'));
const History = lazy(() => import(/* webpackChunkName: "modules" */ '@/pages/modules/History'));

// ── Auxiliary pages ───────────────────────────────────────────────────────────
const IpPlan = lazy(() => import('@/pages/IpPlan'));
const Settings = lazy(() => import('@/pages/Settings'));
const Login = lazy(() => import('@/pages/Login'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Root redirect
      { index: true, element: <Navigate to="/step/1" replace /> },

      // ── Step routes (9) ──────────────────────────────────────────────────
      { path: 'step/1', element: <Step1 /> },
      { path: 'step/3', element: <Step3 /> },
      { path: 'step/3b', element: <Step3b /> },
      { path: 'step/4', element: <Step4 /> },
      { path: 'step/4b', element: <Step4b /> },
      { path: 'step/5', element: <Step5 /> },
      { path: 'step/6', element: <Step6 /> },
      { path: 'step/7', element: <Step7 /> },
      { path: 'step/8', element: <Step8 /> },

      // ── Tool routes (14) ─────────────────────────────────────────────────
      { path: 'trending', element: <Trending /> },
      { path: 'video-analysis', element: <VideoAnalysis /> },
      { path: 'present-styles', element: <PresentStyles /> },
      { path: 'monetization', element: <Monetization /> },
      { path: 'private-domain', element: <PrivateDomain /> },
      { path: 'boom-generate', element: <BoomGenerate /> },
      { path: 'generate', element: <Generate /> },
      { path: 'analysis', element: <Analysis /> },
      { path: 'video-production', element: <VideoProduction /> },
      { path: 'acquisition-video', element: <AcquisitionVideo /> },
      { path: 'ai-video', element: <AiVideo /> },
      { path: 'voice-chat', element: <VoiceChat /> },
      { path: 'deep-learning', element: <DeepLearning /> },
      { path: 'knowledge', element: <Knowledge /> },

      // ── New module routes (6) ─────────────────────────────────────────────
      { path: 'diagnosis', element: <Diagnosis /> },
      { path: 'daily-tasks', element: <DailyTasks /> },
      { path: 'evolution', element: <Evolution /> },
      { path: 'accounts', element: <Accounts /> },
      { path: 'my-topics', element: <MyTopics /> },
      { path: 'history', element: <History /> },

      // ── Auxiliary routes ──────────────────────────────────────────────────
      { path: 'ip-plan', element: <IpPlan /> },
      { path: 'settings', element: <Settings /> },
      { path: 'login', element: <Login /> },

      // ── 404 catch-all ─────────────────────────────────────────────────────
      { path: '*', element: <NotFound /> },
    ],
  },
]);
