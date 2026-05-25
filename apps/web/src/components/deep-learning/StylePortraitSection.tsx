/**
 * StylePortraitSection.tsx — 风格画像 sub-section
 */
import { DL_SECTION_STYLE_PORTRAIT } from '@/lib/constants/deep-learning';

interface StylePortraitSectionProps {
  body: string;
}

export function StylePortraitSection({ body }: StylePortraitSectionProps) {
  return (
    <div data-testid="style-portrait-section" className="space-y-2">
      <p className="text-sm font-bold text-primary">{DL_SECTION_STYLE_PORTRAIT}</p>
      <p
        data-testid="style-portrait-body"
        className="text-base text-muted-foreground leading-relaxed"
      >
        {body}
      </p>
    </div>
  );
}
