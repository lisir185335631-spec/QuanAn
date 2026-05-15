/**
 * DeepLearning.tsx — /tools/deep-learning 文案深度学习中心 · PRD-15 US-003
 * 1:1 实现 ui/_8/screen.png 视觉(3-tab: 学习/我的库/公式应用)
 * AC-1~8: 3 tabs + URL state ?tab=learn|library|apply + tRPC parse/list/delete/applyFormula
 * SHIELD #2: URL state for tabs
 */

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';

import {
  ApplyFormulaTab,
  LearnTab,
  LibraryTab,
} from './components/DeepLearningTabs';
import type { ParseAnalysis, QueueItem } from './components/DeepLearningTabs';

// ── Tab types ─────────────────────────────────────────────────────────────────

type TabValue = 'learn' | 'library' | 'apply';

const TAB_LABELS: Record<TabValue, string> = {
  learn: '学习',
  library: '我的库',
  apply: '公式应用',
};

const TABS: TabValue[] = ['learn', 'library', 'apply'];

const TAB_DESCRIPTIONS: Record<TabValue, string> = {
  learn: '粘贴优秀文案，AI 自动解析公式、结构与情绪弧线',
  library: '查看所有已保存的文案学习记录，应用或删除',
  apply: '选择已学习的公式，输入新主题，生成符合公式的文案',
};

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar() {
  const { data: items = [] } = trpc.deepLearning.list.useQuery({
    limit: 50,
    offset: 0,
    onlyActive: true,
  });

  const total = (items as unknown[]).length;
  const platforms = new Set(
    (items as { sourcePlatform: string }[]).map((i) => i.sourcePlatform),
  ).size;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6" data-testid="stats-bar">
      <Card className="border-outline-variant bg-surface-variant/10">
        <CardContent className="pt-4 pb-3">
          <p className="text-label-xs text-on-surface-variant">已学习文案</p>
          <p className="text-h2 font-display text-on-surface" data-testid="stat-total">{total}</p>
        </CardContent>
      </Card>
      <Card className="border-outline-variant bg-surface-variant/10">
        <CardContent className="pt-4 pb-3">
          <p className="text-label-xs text-on-surface-variant">覆盖平台</p>
          <p className="text-h2 font-display text-on-surface" data-testid="stat-platforms">{platforms}</p>
        </CardContent>
      </Card>
      <Card className="border-outline-variant bg-surface-variant/10">
        <CardContent className="pt-4 pb-3">
          <p className="text-label-xs text-on-surface-variant">公式库</p>
          <p className="text-h2 font-display text-on-surface" data-testid="stat-formulas">{total}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── DeepLearning page ─────────────────────────────────────────────────────────

export default function DeepLearning() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as TabValue | null;
  const activeTab: TabValue = rawTab && TABS.includes(rawTab) ? rawTab : 'learn';

  const handleTabChange = useCallback(
    (val: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', val);
        return next;
      });
    },
    [setSearchParams],
  );

  // After saving to library → switch to library tab
  const handleSaved = useCallback(() => {
    handleTabChange('library');
  }, [handleTabChange]);

  // After clicking apply from learn tab → switch to apply tab
  const handleApplyFromLearn = useCallback(
    (_analysis: ParseAnalysis, queueId: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'apply');
        next.set('queueId', String(queueId));
        return next;
      });
    },
    [setSearchParams],
  );

  // After clicking apply from library tab → switch to apply tab
  const handleApplyFromLibrary = useCallback(
    (item: QueueItem) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'apply');
        next.set('queueId', String(item.id));
        return next;
      });
    },
    [setSearchParams],
  );

  const preselectedQueueId = searchParams.get('queueId')
    ? parseInt(searchParams.get('queueId')!, 10)
    : null;

  return (
    <main className="flex-1 container py-8" data-testid="deep-learning-page">
      <div className="mb-6">
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">
          智能工具
        </span>
        <h1 className="text-h1 font-display text-on-surface mt-1">文案深度学习中心</h1>
        <p className="text-body-md text-muted-foreground mt-2">
          上传优秀文案，让 AI 解析公式与模式，构建专属学习库
        </p>
      </div>

      <StatsBar />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        data-testid="deep-learning-tabs"
      >
        <TabsList className="mb-2">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} data-testid={`tab-${t}`}>
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <p
          className="text-body-sm text-on-surface-variant mb-4"
          data-testid="tab-description"
          aria-live="polite"
        >
          {TAB_DESCRIPTIONS[activeTab]}
        </p>

        <TabsContent value="learn" data-testid="tab-content-learn">
          <LearnTab onSaved={handleSaved} onApply={handleApplyFromLearn} />
        </TabsContent>

        <TabsContent value="library" data-testid="tab-content-library">
          <LibraryTab onApply={handleApplyFromLibrary} />
        </TabsContent>

        <TabsContent value="apply" data-testid="tab-content-apply">
          <ApplyFormulaTab preselectedQueueId={preselectedQueueId} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
