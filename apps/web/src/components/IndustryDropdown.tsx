/**
 * IndustryDropdown — PRD-15 US-001 AC-6
 * 56 行业下拉组件 · 按 category 分组显示
 * 复用到 9 step + 6 工具 page
 */

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  INDUSTRIES,
  INDUSTRY_CATEGORIES,
  INDUSTRY_CATEGORY_EMOJI,
} from '@/lib/constants/industries';

interface IndustryDropdownProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function IndustryDropdown({
  value,
  onValueChange,
  placeholder = '选择行业',
  disabled,
  className,
}: IndustryDropdownProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className} data-testid="industry-dropdown-trigger">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent data-testid="industry-dropdown-content">
        {INDUSTRY_CATEGORIES.map((category) => {
          const items = INDUSTRIES.filter((ind) => ind.category === category);
          return (
            <SelectGroup key={category}>
              <SelectLabel className="text-xs text-muted-foreground">
                {INDUSTRY_CATEGORY_EMOJI[category]} {category} ({items.length})
              </SelectLabel>
              {items.map((ind) => (
                <SelectItem
                  key={ind.key}
                  value={ind.key}
                  data-testid={`industry-item-${ind.key}`}
                >
                  {ind.emoji} {ind.label}
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
