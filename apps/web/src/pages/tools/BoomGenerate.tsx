/**
 * BoomGenerate.tsx — /boom-generate 爆款元素自动生成 · 1:1 复刻 aiipznt
 * mock-first 静态 · 4 group 23 chip + 6 entry 完整 mock
 * H1 字面锁: "⚡ 爆款元素自动生成"
 */

import { useState } from 'react';

import {
  BOOM_DEFAULT_SELECTED_KEYS,
  BOOM_ENTRIES,
  BOOM_FIELD_INDUSTRY_DEFAULT,
  BOOM_FIELD_TOPIC_DEFAULT,
} from '@/lib/constants/boomGenerate';

import { BoomAnalysis } from './components/boomGenerate/BoomAnalysis';
import { BoomBreadcrumb } from './components/boomGenerate/BoomBreadcrumb';
import { BoomCTA } from './components/boomGenerate/BoomCTA';
import { BoomElementsPicker } from './components/boomGenerate/BoomElementsPicker';
import { BoomHero } from './components/boomGenerate/BoomHero';
import { BoomResultList } from './components/boomGenerate/BoomResultList';
import { BoomSettings } from './components/boomGenerate/BoomSettings';

export default function BoomGenerate() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([...BOOM_DEFAULT_SELECTED_KEYS]);
  const [industry, setIndustry] = useState<string>(BOOM_FIELD_INDUSTRY_DEFAULT);
  const [topic, setTopic] = useState<string>(BOOM_FIELD_TOPIC_DEFAULT);

  return (
    <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
      <BoomBreadcrumb />
      <BoomHero />
      <BoomElementsPicker selectedKeys={selectedKeys} onChange={setSelectedKeys} />
      <BoomSettings
        industry={industry}
        topic={topic}
        onIndustryChange={setIndustry}
        onTopicChange={setTopic}
      />
      <BoomCTA />
      <BoomAnalysis />
      <BoomResultList entries={BOOM_ENTRIES} />
    </main>
  );
}
