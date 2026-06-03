import { cn } from '@/lib/utils';

export interface SubCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted';
}

export function SubCard({ children, className, variant = 'default' }: SubCardProps) {
  return (
    <div
      className={cn(
        'bg-card/40 backdrop-blur-md border rounded-lg p-4',
        variant === 'highlighted' ? 'border-primary/40' : 'border-border/40',
        className,
      )}
    >
      {children}
    </div>
  );
}
