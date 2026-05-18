import { type PropsWithChildren } from 'react';
import { motion } from 'framer-motion';

export interface FadeInWrapperProps extends PropsWithChildren {
  delay?: number;
  duration?: number;
  from?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

const directionMap = {
  up:    { opacity: 0, y: 16 },
  down:  { opacity: 0, y: -16 },
  left:  { opacity: 0, x: 16 },
  right: { opacity: 0, x: -16 },
  none:  { opacity: 0, x: 0, y: 0 },
} as const;

export function FadeInWrapper({
  delay = 0,
  duration = 0.4,
  from = 'up',
  className,
  children,
}: FadeInWrapperProps) {
  return (
    <motion.div
      initial={directionMap[from]}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
