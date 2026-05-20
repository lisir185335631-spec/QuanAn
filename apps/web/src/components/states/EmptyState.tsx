import { Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';


interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = '暂无数据',
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <div className="text-muted-foreground/60">
        {icon ?? <Inbox className="h-10 w-10" />}
      </div>
      <div>
        <p className="text-body-md font-medium text-on-surface">{title}</p>
        {description && (
          <p className="mt-1 text-body-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
