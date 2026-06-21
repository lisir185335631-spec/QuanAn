/**
 * createBrowserRouter · iOS26 液态玻璃全站路由
 * step/* 9 条均已迁移液态玻璃 · 顶层独立路由 · StepLayout 已移除
 * Route groups (chunks):
 *   step/*      → 9 条顶层独立路由(各自内置 LiquidShell 外壳，不挂 RootLayout)
 *   tools/*     → 13 tool pages (lazy individually, shared vite chunk via webpackChunkName)
 *   modules/*   → 6 new modules
 *   auxiliary   → /ip-plan, /404 catch-all
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';

// ── Step pages (8 + 2 sub-steps) — one shared chunk ──────────────────────────
// sally aiipznt /step/2 也是 404 · 跳过 step 2 与 sally 一致(catch-all 接管)
const Step1 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step1'));
const Step3 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step3'));
const Step3b = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step3b'));
const Step4 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step4'));
const Step4b = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step4b'));
const Step5 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step5'));
const Step6 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step6'));
const Step7 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step7'));
const Step8 = lazy(() => import(/* webpackChunkName: "step" */ '@/pages/step/Step8'));
// sally aiipznt /step/9 也是 404 · 跳过 step 9 与 sally 一致(catch-all 接管)

// ── Tool pages (13) — shared tools chunk ─────────────────────────────────────
const Trending = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/Trending'));
// sally aiipznt /copywriting 也是 404 · 跳过 · catch-all 接管
const Monetization = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/Monetization'));
const PrivateDomain = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/PrivateDomain'));
const BoomGenerate = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/BoomGenerate'));
const Generate = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/Generate'));
const Analysis = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/Analysis'));
const VideoAnalysis = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/VideoAnalysis'));
const VideoProduction = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/VideoProduction'));
const AiVideo = lazy(() => import(/* webpackChunkName: "tools" */ '@/pages/tools/AiVideo'));
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
const Guide = lazy(() => import('@/pages/Guide'));

// ── iOS26 液态玻璃 dashboard(系统控制台 · Stitch 设计 · 新建路由)──
const Dashboard = lazy(() => import('@/pages/Dashboard'));

export const router = createBrowserRouter([
  // ── iOS26 液态玻璃 · 已迁移页面各自内置 LiquidShell 独立外壳(不挂 RootLayout) ──
  {
    path: '/step/1',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Step1 />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Dashboard />
      </Suspense>
    ),
  },
  {
    path: '/step/3',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Step3 />
      </Suspense>
    ),
  },
  {
    path: '/step/3b',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Step3b />
      </Suspense>
    ),
  },
  {
    path: '/step/4',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Step4 />
      </Suspense>
    ),
  },
  {
    path: '/step/4b',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Step4b />
      </Suspense>
    ),
  },
  {
    path: '/step/6',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Step6 />
      </Suspense>
    ),
  },
  {
    path: '/step/5',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Step5 />
      </Suspense>
    ),
  },
  {
    path: '/step/7',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Step7 />
      </Suspense>
    ),
  },
  {
    path: '/step/8',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Step8 />
      </Suspense>
    ),
  },
  {
    path: '/private-domain',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <PrivateDomain />
      </Suspense>
    ),
  },
  {
    path: '/video-analysis',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <VideoAnalysis />
      </Suspense>
    ),
  },
  {
    path: '/present-styles',
    element: <Navigate to="/step/6" replace />,
  },
  {
    path: '/diagnosis',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Diagnosis />
      </Suspense>
    ),
  },
  {
    path: '/daily-tasks',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <DailyTasks />
      </Suspense>
    ),
  },
  {
    path: '/ai-video',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <AiVideo />
      </Suspense>
    ),
  },
  {
    path: '/deep-learning',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <DeepLearning />
      </Suspense>
    ),
  },
  {
    path: '/evolution',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Evolution />
      </Suspense>
    ),
  },
  {
    path: '/knowledge',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Knowledge />
      </Suspense>
    ),
  },
  {
    path: '/accounts',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Accounts />
      </Suspense>
    ),
  },
  // ── iOS26 液态玻璃 · Guide 使用说明(独立顶层路由 · LiquidShell 外壳)──
  {
    path: '/guide',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Guide />
      </Suspense>
    ),
  },
  // ── iOS26 液态玻璃 · IP 方案进度总览(独立顶层路由 · LiquidShell 外壳)──
  {
    path: '/ip-plan',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <IpPlan />
      </Suspense>
    ),
  },
  // ── iOS26 液态玻璃 · 爆款元素自动生成(独立顶层路由 · LiquidShell 外壳)──
  {
    path: '/boom-generate',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <BoomGenerate />
      </Suspense>
    ),
  },
  // ── iOS26 液态玻璃 · IP变现模型定制(独立顶层路由 · LiquidShell 外壳)──
  {
    path: '/monetization',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Monetization />
      </Suspense>
    ),
  },
  // ── iOS26 液态玻璃 · 全网爆款库(独立顶层路由 · LiquidShell 外壳)──
  {
    path: '/trending',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Trending />
      </Suspense>
    ),
  },
  // ── iOS26 液态玻璃 · 我的选题库(独立顶层路由 · LiquidShell 外壳)──
  {
    path: '/my-topics',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <MyTopics />
      </Suspense>
    ),
  },
  // ── iOS26 液态玻璃 · 历史记录(独立顶层路由 · LiquidShell 外壳)──
  {
    path: '/history',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <History />
      </Suspense>
    ),
  },
  // ── iOS26 液态玻璃 · 生成爆款文案(独立顶层路由 · LiquidShell 外壳)──
  {
    path: '/generate',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Generate />
      </Suspense>
    ),
  },
  // ── iOS26 液态玻璃 · 文案结构分析(独立顶层路由 · LiquidShell 外壳)──
  {
    path: '/analysis',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Analysis />
      </Suspense>
    ),
  },
  // ── iOS26 液态玻璃 · 短视频一键制作(独立顶层路由 · LiquidShell 外壳)──
  {
    path: '/video-production',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <VideoProduction />
      </Suspense>
    ),
  },
  // ── '/' 布局路由(无外壳元素 → 渲染 Outlet)· index=首页 / '*'=404 · 均 iOS26 液态玻璃(各自内置 LiquidShell)──
  {
    path: '/',
    children: [
      { index: true, element: <Home /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
