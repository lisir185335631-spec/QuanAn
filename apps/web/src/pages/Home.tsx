/**
 * Home.tsx — 首页 · iOS 26 Liquid Glass 液态玻璃版(2026-06-08 定稿)
 *
 * 架构:
 *  - LiquidShell 液态玻璃外壳(首页专属,替代 IKBLayout;其他 32 页仍用 IKBLayout)
 *  - lg-fluid + lg-grain 通过 createPortal 挂 document.body,脱离 zoom 铺满视口
 *  - GlassFilters SVG 折射滤镜
 *  - 六大区块:HeroIKB / ProgressIKB / StatsIKB / MatrixIKB / WorkflowIKB / ReadyIKB
 *  - 液态玻璃组件库在 components/home-next/(首页专属,与 IKBLayout 共享的 home/ 解耦)
 */
import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import { GlassFilters } from '@/components/home-next/GlassFilters';
import { HeroIKB } from '@/components/home-next/HeroIKB';
import {
  MatrixIKB,
  ProgressIKB,
  ReadyIKB,
  StatsIKB,
  WorkflowIKB,
} from '@/components/home-next/ikb/sections';
import { LiquidShell } from '@/components/home-next/LiquidShell';
import '@/styles/liquid-glass.css';

// 流体背景层 — fixed 全屏 portal,脱离 LiquidShell 的 CSS zoom 容器,真正相对视口铺满
function FluidPortal() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'lg-root';
    el.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
    document.body.appendChild(el);
    containerRef.current = el;
    setMounted(true);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  if (!mounted || !containerRef.current) return null;

  return ReactDOM.createPortal(
    <>
      <div className="lg-fluid" />
      <div className="lg-grain" />
    </>,
    containerRef.current,
  );
}

export default function Home() {
  return (
    <>
      {/* 流体背景层 portal — 脱离 LiquidShell zoom · z-index:0 */}
      <FluidPortal />

      <LiquidShell>
        {/* SVG 折射滤镜 defs — 渲染一次 */}
        <GlassFilters />

        {/* ① Hero — 打字机大字 + 双 CTA */}
        <HeroIKB />
        {/* ② 9步进度 */}
        <ProgressIKB />
        {/* ③ 4数据 CountUp */}
        <StatsIKB />
        {/* ④ 23工具功能矩阵 */}
        <MatrixIKB />
        {/* ⑤ 6步工作流 */}
        <WorkflowIKB />
        {/* ⑥ 立即启动 CTA */}
        <ReadyIKB />
      </LiquidShell>
    </>
  );
}
