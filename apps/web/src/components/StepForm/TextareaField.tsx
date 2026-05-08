import type { FieldError } from 'react-hook-form';

import { cn } from '@/lib/utils';

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: FieldError;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export function TextareaField({
  label,
  value,
  onChange,
  error,
  placeholder,
  rows = 4,
  required,
}: TextareaFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-body-sm font-medium text-on-surface">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          'flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y',
          error && 'border-error focus-visible:ring-error',
        )}
      />
      {error && (
        <p className="text-body-xs text-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
