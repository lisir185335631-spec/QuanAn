import {
  BOOM_SETTINGS_TITLE,
  BOOM_FIELD_INDUSTRY_LABEL,
  BOOM_FIELD_INDUSTRY_PLACEHOLDER,
  BOOM_FIELD_TOPIC_LABEL,
  BOOM_FIELD_TOPIC_PLACEHOLDER,
} from '@/lib/constants/boomGenerate';

interface BoomSettingsProps {
  industry: string;
  topic: string;
  onIndustryChange: (v: string) => void;
  onTopicChange: (v: string) => void;
}

export function BoomSettings({
  industry,
  topic,
  onIndustryChange,
  onTopicChange,
}: BoomSettingsProps) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="font-cn font-bold text-on-surface">{BOOM_SETTINGS_TITLE}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <label className="block font-cn text-sm text-muted-foreground">
            {BOOM_FIELD_INDUSTRY_LABEL}
          </label>
          <input
            type="text"
            value={industry}
            onChange={(e) => onIndustryChange(e.target.value)}
            placeholder={BOOM_FIELD_INDUSTRY_PLACEHOLDER}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="boom-industry-input"
          />
        </div>
        <div className="space-y-2">
          <label className="block font-cn text-sm text-muted-foreground">
            {BOOM_FIELD_TOPIC_LABEL}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder={BOOM_FIELD_TOPIC_PLACEHOLDER}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="boom-topic-input"
          />
        </div>
      </div>
    </div>
  );
}
