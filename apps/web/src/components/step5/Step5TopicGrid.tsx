import { useNavigate } from 'react-router-dom';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { LoadingState } from '@/components/states';
import {
  STEP5_CATEGORIES_5,
  STEP5_LOADING_TEXT,
  type Step5Result,
  type Step5Topic,
} from '@/lib/constants/step5';
import type { CategoryKey, StreamStatus } from '@/pages/step/Step5';

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
        <span className="text-xs text-muted-foreground">{topic.difficulty}</span>
        <span className="text-xs text-primary">{'⭐'.repeat(topic.potential_stars)}</span>
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
}: Step5TopicGridProps) {
  const navigate = useNavigate();

  function handleTopicClick(topic: Step5Topic) {
    const namespacedKey =
      accountId !== null
        ? `aiip_memory_acc_${accountId}_selected_topic`
        : 'acc_step5_selected_topic';
    localStorage.setItem(namespacedKey, JSON.stringify(topic));
    // Backward compat: Step7 still reads acc_step5_selected_topic
    localStorage.setItem('acc_step5_selected_topic', JSON.stringify(topic));
    void navigate('/step/7');
  }

  return (
    <div className="space-y-10" data-testid="step5-output-grid">
      {STEP5_CATEGORIES_5.map((cat, i) => {
        const topics = result?.topics.filter((t) => t.category === cat.key) ?? [];
        const status = streamStatuses[cat.key];

        return (
          <FadeInWrapper key={cat.key} delay={i * 0.05}>
            {/* AC-3 + AC-11: H3 字面锁 — 5 H3 同时存在于 DOM */}
            <h3
              className="text-h3 font-display text-on-surface mb-4"
              data-testid={`step5-h3-${cat.key}`}
            >
              {cat.label}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>

            {status === 'loading' && (
              <div className="glass-card rounded-xl p-6">
                <LoadingState text={STEP5_LOADING_TEXT} size="lg" />
              </div>
            )}

            {status !== 'loading' && topics.length === 0 && (
              <div className="glass-card rounded-xl p-4">
                <p className="text-body-sm text-muted-foreground text-center">
                  {status === 'error' ? '生成失败，请重试' : '等待生成...'}
                </p>
              </div>
            )}

            {topics.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {topics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      onClick={() => handleTopicClick(topic)}
                    />
                  ))}
                </div>
              </div>
            )}
          </FadeInWrapper>
        );
      })}
    </div>
  );
}
