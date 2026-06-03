import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeFunctionMatrix } from '@/components/home/HomeFunctionMatrix';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeProgressBlock } from '@/components/home/HomeProgressBlock';
import { HomeReadyStart } from '@/components/home/HomeReadyStart';
import { HomeStatsRow } from '@/components/home/HomeStatsRow';
import { HomeWorkflow } from '@/components/home/HomeWorkflow';
import { PioneerLayout } from '@/layouts/PioneerLayout';

export default function Home() {
  return (
    <PioneerLayout>
      <div className="space-y-20">
        <HomeHero />
        <HomeProgressBlock />
        <HomeStatsRow />
        <HomeFunctionMatrix />
        <HomeWorkflow />
        <HomeReadyStart />
        <HomeFooter />
      </div>
    </PioneerLayout>
  );
}
