import { cn } from '@/lib/utils';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={cn('bg-card/40 backdrop-blur-md border border-border/40 rounded-lg', className)}>
      {children}
    </div>
  );
}
