import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeFunctionMatrix } from '@/components/home/HomeFunctionMatrix';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeProgressBlock } from '@/components/home/HomeProgressBlock';
import { HomeReadyStart } from '@/components/home/HomeReadyStart';
import { HomeStatsRow } from '@/components/home/HomeStatsRow';
import { HomeWorkflow } from '@/components/home/HomeWorkflow';

export default function Home() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen space-y-16">
      <HomeHero />
      <HomeProgressBlock />
      <HomeStatsRow />
      <HomeFunctionMatrix />
      <HomeWorkflow />
      <HomeReadyStart />
      <HomeFooter />
    </main>
  );
}
