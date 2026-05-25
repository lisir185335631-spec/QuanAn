/**
 * StoryFooter — 起承转合 4 stage card grid
 * SPEC §9 · §7
 */

import { STORY_FOOTER_TITLE, STORY_STAGES } from '@/lib/constants/storyStages';

export function StoryFooter() {
  return (
    <section className="space-y-4" data-testid="story-footer">
      <h2 className="font-display text-2xl font-bold" data-testid="story-footer-title">
        {STORY_FOOTER_TITLE}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STORY_STAGES.map((stage) => (
          <div
            key={stage.key}
            className="rounded-xl border border-border bg-card p-5 space-y-2"
            data-testid={`story-stage-${stage.key}`}
          >
            <p className={`font-display font-bold text-sm ${stage.color}`} data-testid={`story-stage-label-${stage.key}`}>
              {stage.label}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{stage.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
