import type { TaskCategory } from '@/lib/constants/daily-tasks';
import { CATEGORY_ICON_MAP } from '@/lib/constants/daily-tasks';

interface TaskCategoryTagProps {
  category: TaskCategory;
}

export function TaskCategoryTag({ category }: TaskCategoryTagProps) {
  const Icon = CATEGORY_ICON_MAP[category];
  return (
    <span
      data-testid="task-category-tag"
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-primary"
    >
      <Icon className="w-3 h-3 text-primary" />
      {category}
    </span>
  );
}
