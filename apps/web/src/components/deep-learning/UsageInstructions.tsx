/**
 * UsageInstructions.tsx — 使用说明 card · 3 mode + 7 bullet
 */
import { DL_USAGE_SECTIONS, DL_USAGE_TITLE } from '@/lib/constants/deep-learning';

export function UsageInstructions() {
  return (
    <div
      data-testid="usage-instructions"
      className="rounded-xl border border-border bg-card p-6 space-y-4"
    >
      <h3
        data-testid="usage-instructions-title"
        className="text-base font-bold text-foreground"
      >
        {DL_USAGE_TITLE}
      </h3>
      <div className="space-y-4">
        {DL_USAGE_SECTIONS.map((section, si) => (
          <div key={si} data-testid={`usage-section-${si}`} className="space-y-2">
            <p
              data-testid={`usage-section-title-${si}`}
              className="text-sm font-bold text-primary"
            >
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.bullets.map((bullet, bi) => (
                <li
                  key={bi}
                  data-testid={`usage-bullet-${si}-${bi}`}
                  className="text-sm text-muted-foreground"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
