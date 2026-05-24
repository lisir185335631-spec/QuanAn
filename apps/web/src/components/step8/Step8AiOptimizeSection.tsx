// PRD-29.12 · Step8 AI 优化话术
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface Step8AiOptimizeSectionProps {
  className?: string;
}

export function Step8AiOptimizeSection({ className }: Step8AiOptimizeSectionProps) {
  const [script, setScript] = useState('');
  const [goal, setGoal] = useState('');

  function handleOptimize() {
    if (script.length < 10) {
      toast.error('请输入至少10个字的话术脚本');
      return;
    }
    toast.success('AI优化中，请稍候...');
  }

  return (
    <SubCard className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
        🔄 AI优化直播话术
      </h3>

      {/* textarea */}
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="粘贴你的直播话术脚本（至少10个字），AI将深度优化话术表达、互动设计和转化逻辑..."
        className="w-full min-h-[120px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y placeholder:text-muted-foreground"
      />

      {/* goal input */}
      <input
        type="text"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="优化目标（可选），如：提升互动率、增强转化、更有感染力..."
        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface placeholder:text-muted-foreground"
      />

      {/* button */}
      <div className="flex justify-center">
        <Button onClick={handleOptimize} className="bg-primary hover:bg-primary/90">
          🔄 AI优化话术
        </Button>
      </div>
    </SubCard>
  );
}
