/**
 * Home.tsx — 首页 · iOS 26 Liquid Glass 液态玻璃版
 *
 * - LiquidShell 液态玻璃外壳(内置流体背景 lg-fluid + lg-grain · 全站共享布局)
 * - GlassFilters SVG 折射滤镜
 * - 六大区块:HeroIKB / ProgressIKB / StatsIKB / MatrixIKB / WorkflowIKB / ReadyIKB
 */
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

export default function Home() {
  return (
    <LiquidShell>
      <GlassFilters />
      <HeroIKB />
      <ProgressIKB />
      <StatsIKB />
      <MatrixIKB />
      <WorkflowIKB />
      <ReadyIKB />
    </LiquidShell>
  );
}
