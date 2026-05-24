// PRD-29.15 · Step7 右列 · 爆款元素多选 chip grid
import { cn } from '@/lib/utils';

export interface Step7ElementItem {
  id: string;
  label: string;
  icon: string;
}

export interface Step7ElementCategoryItem {
  id: string;
  name: string;
  elements: Step7ElementItem[];
}

interface Step7ElementCategoryGridProps {
  categories: Step7ElementCategoryItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  className?: string;
}

export function Step7ElementCategoryGrid({
  categories,
  selectedIds,
  onToggle,
  className,
}: Step7ElementCategoryGridProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-semibold text-on-surface">
        选择爆款元素{' '}
        <span className="text-muted-foreground font-normal">
          (已选 {selectedIds.length} 个)
        </span>
      </h3>

      {categories.map((category) => (
        <div key={category.id} className="space-y-2">
          <p className="text-xs text-muted-foreground">{category.name}</p>
          <div className="flex flex-wrap gap-2">
            {category.elements.map((el) => {
              const isSelected = selectedIds.includes(el.id);
              return (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => onToggle(el.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors',
                    isSelected
                      ? 'border-primary/40 bg-primary/15 text-primary font-semibold'
                      : 'border-border/40 text-on-surface/70 hover:text-on-surface',
                  )}
                >
                  <span className="text-sm">{el.icon}</span>
                  <span>{el.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
