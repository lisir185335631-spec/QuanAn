import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { FieldError } from 'react-hook-form';


const PLATFORMS = [
  { key: 'douyin', label: '📱 抖音' },
  { key: 'xiaohongshu', label: '📕 小红书' },
  { key: 'shipinhao', label: '📺 视频号' },
  { key: 'kuaishou', label: '🎬 快手' },
  { key: 'bilibili', label: '📺 B站' },
] as const;

interface PlatformSelectProps {
  value: string;
  onChange: (v: string) => void;
  error?: FieldError;
}

export function PlatformSelect({ value, onChange, error }: PlatformSelectProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="platform-select" className="text-body-sm font-medium text-on-surface">
        主要平台<span className="text-error ml-0.5">*</span>
      </label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id="platform-select" className={error ? 'border-error focus:ring-error' : ''}>
          <SelectValue placeholder="请选择平台" />
        </SelectTrigger>
        <SelectContent>
          {PLATFORMS.map((p) => (
            <SelectItem key={p.key} value={p.key}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-body-xs text-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
