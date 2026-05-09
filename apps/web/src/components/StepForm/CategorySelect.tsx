import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { FieldError } from 'react-hook-form';


const CATEGORIES = [
  { key: 'traffic', label: '引流涨粉' },
  { key: 'monetize', label: '变现转化' },
  { key: 'persona', label: '人设塑造' },
  { key: 'cognition', label: '认知教育' },
  { key: 'case', label: '案例实证' },
] as const;

interface CategorySelectProps {
  value: string;
  onChange: (v: string) => void;
  error?: FieldError;
}

export function CategorySelect({ value, onChange, error }: CategorySelectProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="category-select" className="text-body-sm font-medium text-on-surface">
        选题类别<span className="text-error ml-0.5">*</span>
      </label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id="category-select" className={error ? 'border-error focus:ring-error' : ''}>
          <SelectValue placeholder="请选择选题类别" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.key} value={c.key}>
              {c.label}
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
