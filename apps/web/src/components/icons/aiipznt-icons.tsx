export { Flame, Sparkles } from 'lucide-react';
import { Flame, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

export function FlameIcon({ className, size = 5 }: IconProps) {
  return <Flame className={cn(`h-${size} w-${size} text-primary/80`, className)} />;
}

export function SparkleIcon({ className, size = 5 }: IconProps) {
  return <Sparkles className={cn(`h-${size} w-${size} text-primary/80`, className)} />;
}
