import { HeroIKB } from '@/components/home/HeroIKB';
import { MatrixIKB, ProgressIKB, ReadyIKB, StatsIKB, WorkflowIKB } from '@/components/home/ikb/sections';
import { IKBLayout } from '@/layouts/IKBLayout';

// 克莱因蓝·先锋印刷 — IKBLayout(与 Pioneer 同构的导航/账号/缩放/页脚,编辑换皮)
// 内容区:浅底 · 蓝退为大字/描边/点缀 · 紧凑栅格 · 统一编辑卡片
export default function Home() {
  return (
    <IKBLayout>
      <HeroIKB />
      <ProgressIKB />
      <StatsIKB />
      <MatrixIKB />
      <WorkflowIKB />
      <ReadyIKB />
    </IKBLayout>
  );
}
