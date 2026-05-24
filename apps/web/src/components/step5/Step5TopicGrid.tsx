import { useNavigate } from 'react-router-dom';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { LoadingState } from '@/components/states';
import {
  STEP5_CATEGORIES_5,
  STEP5_LOADING_TEXT,
  type Step5Result,
  type Step5Topic,
} from '@/lib/constants/step5';
// @deprecated — these types were previously exported from Step5.tsx (PRD-29.14 rewrite removed them)
type CategoryKey = 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case';
type StreamStatus = 'idle' | 'loading' | 'done' | 'error';

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
          <FadeInWrapper key={cat.key} delay={i * 0.05} from="up">
            {/* AC-2: H3 inside glass-card wrapper */}
            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-6 mb-4">
              <h3
                className="text-h3 font-display text-on-surface mb-2"
                data-testid={`step5-h3-${cat.key}`}
              >
                {cat.label}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">{cat.description}</p>

              {status === 'loading' && <LoadingState text={STEP5_LOADING_TEXT} size="lg" />}

              {status !== 'loading' && topics.length === 0 && (
                <p className="text-body-sm text-muted-foreground text-center py-4">
                  {status === 'error' ? '生成失败，请重试' : '等待生成...'}
                </p>
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
            </div>
          </FadeInWrapper>
        );
      })}
    </div>
  );
}
