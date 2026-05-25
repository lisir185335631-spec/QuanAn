/**
 * KnowledgeHeader — h1 + subtitle 左对齐
 * SPEC §9 · §3
 */

import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';

export function KnowledgeHeader() {
  return (
    <div className="flex flex-col gap-2" data-testid="knowledge-header">
      <h1
        className="font-display text-4xl font-bold text-on-surface"
        data-testid="knowledge-h1"
      >
        {KNOWLEDGE_PAGE.h1}
      </h1>
      <p
        className="text-muted-foreground"
        data-testid="knowledge-subtitle"
      >
        {KNOWLEDGE_PAGE.subtitle}
      </p>
    </div>
  );
}
