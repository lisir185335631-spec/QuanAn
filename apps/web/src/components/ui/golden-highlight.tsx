import { cn } from '@/lib/utils';

interface GoldenHighlightProps {
  children?: React.ReactNode;
  industry?: string;
  className?: string;
}

export function GoldenHighlight({ children, industry = '美业', className }: GoldenHighlightProps) {
  return <span className={cn('text-primary font-bold', className)}>{children ?? industry}</span>;
}
