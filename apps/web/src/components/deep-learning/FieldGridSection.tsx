/**
 * FieldGridSection.tsx — 通用 grid 2 col · 文案逻辑 / 包装风格 共用
 */
import type { ArchiveFieldEntry } from '@/lib/constants/deep-learning';

interface FieldGridSectionProps {
  title: string;
  fields: ReadonlyArray<ArchiveFieldEntry>;
  testId?: string;
}

export function FieldGridSection({ title, fields, testId }: FieldGridSectionProps) {
  return (
    <div data-testid={testId ?? 'field-grid-section'} className="space-y-3">
      <p className="text-sm font-bold text-primary">{title}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} data-testid={`field-${field.key}`} className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{field.label}</p>
            <p className="text-sm text-foreground leading-relaxed">{field.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
