import { AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = '出错了',
  message = '请稍后重试或联系客服',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('glass-card flex flex-col items-center gap-4 p-8 text-center', className)}>
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div>
        <p className="text-body-lg font-medium text-destructive">{title}</p>
        <p className="mt-1 text-body-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-border px-4 py-1.5 text-body-sm hover:bg-surface-container"
        >
          重试
        </button>
      )}
    </div>
  );
}
