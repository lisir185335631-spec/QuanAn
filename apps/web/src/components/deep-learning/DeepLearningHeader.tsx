/**
 * DeepLearningHeader.tsx — chip + h1 + subtitle 居中
 */
import { DEEP_LEARNING_H1, DEEP_LEARNING_SUBTITLE } from '@/lib/constants/deep-learning';

import { DeepLearningChip } from './DeepLearningChip';

export function DeepLearningHeader() {
  return (
    <div
      data-testid="deep-learning-header"
      className="flex flex-col items-center gap-3 text-center"
    >
      <DeepLearningChip />
      <h1
        data-testid="deep-learning-h1"
        className="text-3xl font-bold text-white"
      >
        {DEEP_LEARNING_H1}
      </h1>
      <p
        data-testid="deep-learning-subtitle"
        className="text-base text-muted-foreground max-w-2xl"
      >
        {DEEP_LEARNING_SUBTITLE}
      </p>
    </div>
  );
}
