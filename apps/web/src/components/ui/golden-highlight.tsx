import { cn } from '@/lib/utils';

interface GoldenHighlightProps {
  children: React.ReactNode;
  className?: string;
}

export function GoldenHighlight({ children, className }: GoldenHighlightProps) {
  return <span className={cn('text-primary font-bold', className)}>{children}</span>;
}
