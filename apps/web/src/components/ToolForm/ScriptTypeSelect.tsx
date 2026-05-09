/**
 * ScriptTypeSelect — 20 脚本类型 dropdown with ScrollArea · PRD-5 US-001
 * AGENTS §11.4 + §11.6.7 模式 · ScrollArea h-72 (>8 items 必须)
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SCRIPT_TYPE_KEYS_20, SCRIPT_TYPE_LABELS } from '@quanqn/schemas/specialist-io';

import type { FieldError } from 'react-hook-form';
import type { ScriptTypeKey } from '@quanqn/schemas/specialist-io';

interface ScriptTypeSelectProps {
  value: string;
  onChange: (value: ScriptTypeKey) => void;
  error?: FieldError;
}

export function ScriptTypeSelect({ value, onChange, error }: ScriptTypeSelectProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="tool-script-type" className="text-body-sm font-medium text-on-surface">
        脚本类型<span className="text-error ml-0.5">*</span>
      </label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger
          id="tool-script-type"
          className={error ? 'border-error' : ''}
          data-testid="script-type-select"
        >
          <SelectValue placeholder="请选择脚本类型" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-72">
            {(SCRIPT_TYPE_KEYS_20 as ReadonlyArray<ScriptTypeKey>).map((key) => (
              <SelectItem key={key} value={key}>
                {SCRIPT_TYPE_LABELS[key]}
              </SelectItem>
            ))}
          </ScrollArea>
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
