import { useNavigate } from 'react-router-dom';

import { EmptyState, LoadingState } from '@/components/states';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  STEP5_CATEGORIES_5,
  STEP5_H1,
  STEP5_LOADING_TEXT,
  type Step5Result,
  type Step5Topic,
} from '@/lib/constants/step5';
import type { CategoryKey, StreamStatus } from '@/pages/step/Step5';

const PLATFORM_EMOJI: Record<Step5Topic['platform'], string> = {
  '抖音': '🎵',
  '小红书': '📕',
  '视频号': '📹',
  '快手': '⚡',
  'B站': '🎬',
};

interface TopicCardProps {
  topic: Step5Topic;
  onClick: () => void;
}

function TopicCard({ topic, onClick }: TopicCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card rounded-lg p-4 text-left hover:border-primary/50 hover:shadow-md transition-all cursor-pointer space-y-2 w-full"
    >
      <p className="text-body-sm font-label text-on-surface line-clamp-2">{topic.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-1">{topic.hook}</p>
      <p className="text-xs text-muted-foreground line-clamp-1">{topic.structure}</p>
      <p className="text-xs text-muted-foreground/80 line-clamp-1">{topic.formula}</p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {PLATFORM_EMOJI[topic.platform]} {topic.platform}
        </span>
        <span className="text-xs text-muted-foreground">{topic.difficulty}</span>
        <span className="text-xs text-primary">
          {'⭐'.repeat(topic.potential_stars)}
        </span>
      </div>
    </button>
  );
}

interface Step5TopicGridProps {
  result: Step5Result | null;
  accountId: number | null;
  streamStatuses: Record<CategoryKey, StreamStatus>;
  activeCategory: CategoryKey;
  onCategoryChange: (cat: CategoryKey) => void;
}

export function Step5TopicGrid({
  result,
  accountId,
  streamStatuses,
  activeCategory,
  onCategoryChange,
}: Step5TopicGridProps) {
  const navigate = useNavigate();

  function handleTopicClick(topic: Step5Topic) {
    // AC-4: namespaced key (aiip_memory_acc_{accountId}_selected_topic)
    const namespacedKey =
      accountId !== null
        ? `aiip_memory_acc_${accountId}_selected_topic`
        : 'acc_step5_selected_topic';
    localStorage.setItem(namespacedKey, JSON.stringify(topic));
    // Backward compat: Step7 still reads acc_step5_selected_topic until it migrates
    localStorage.setItem('acc_step5_selected_topic', JSON.stringify(topic));
    void navigate('/step/7');
  }

  return (
    <Tabs
      value={activeCategory}
      onValueChange={(v) => onCategoryChange(v as CategoryKey)}
      className="w-full"
    >
      <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
        {STEP5_CATEGORIES_5.map((cat) => (
          <TabsTrigger key={cat.key} value={cat.key} className="text-body-sm">
            {cat.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {STEP5_CATEGORIES_5.map((cat) => {
        const topics = result?.topics.filter((t) => t.category === cat.key) ?? [];
        const status = streamStatuses[cat.key];
        return (
          <TabsContent key={cat.key} value={cat.key}>
            <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>
            {status === 'loading' && (
              <LoadingState text={STEP5_LOADING_TEXT} size="lg" />
            )}
            {status !== 'loading' && topics.length === 0 && (
              <EmptyState title={`提交表单后查看${STEP5_H1}`} />
            )}
            {topics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {topics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    onClick={() => handleTopicClick(topic)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
