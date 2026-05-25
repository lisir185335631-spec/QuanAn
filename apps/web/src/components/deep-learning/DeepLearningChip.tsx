/**
 * DeepLearningChip.tsx — Brain icon + chip label
 */
import { Brain } from 'lucide-react';

import { DEEP_LEARNING_CHIP } from '@/lib/constants/deep-learning';

export function DeepLearningChip() {
  return (
    <div
      data-testid="deep-learning-chip"
      className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-1.5"
    >
      <Brain className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-primary">{DEEP_LEARNING_CHIP}</span>
    </div>
  );
}
