import { type FormEvent, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStepData } from '@/hooks/useStepData';
import {
  STEP8_BUTTON_OPTIMIZE_SCRIPT,
  STEP8_OPTIMIZE_INPUT,
  STEP8_OPTIMIZE_MIN_CHARS,
  STEP8_OPTIMIZE_OUTPUT_MODULES_4,
  STEP8_OPTIMIZE_TEXTAREA,
} from '@/lib/constants/step8';

const STUB_OPTIMIZED_SCRIPT = `## 优化后话术示例

欢迎来到直播间，我是你们的老朋友！今天带来了一个超级实用的分享，很多朋友都在问这个问题，
今天我们好好聊聊。大家先点个关注，这样就不会错过我们的精彩内容了！

先来个小互动，评论区告诉我你目前最大的困惑是什么？我来一一解答！

好了，话不多说，我们直接进入今天的主题...`;

const STUB_OPTIMIZE_DETAILS: Record<string, string> = {
  highlight: '话术表达更自然流畅，口语化程度提升，去掉了生硬的书面语，更贴近观众日常交流习惯。',
  interaction: '在开场和中场各增加了 2 处高互动节点，引导评论区互动，预计提升互动率 25%。',
  conversion: '加强了价值主张表达，增加了稀缺性和紧迫感钩子，成交话术更清晰直接。',
  notes: '保持真实自然的表达风格，避免过度销售感；互动频率控制在每 10-15 分钟一次为宜。',
};

interface Props {
  accountId: number | null;
}

export function Step8OptimizeScript({ accountId }: Props) {
  const [scriptText, setScriptText] = useState('');
  const [optimizeGoal, setOptimizeGoal] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { save, isSaving } = useStepData(accountId, 'step8');

  const charCount = scriptText.length;
  // AC-6 · disabled if text.length < 10
  const submitDisabled = isSaving || charCount < STEP8_OPTIMIZE_MIN_CHARS;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled) return;
    save({ sub_function: 'optimize_script', scriptText, optimizeGoal });
    setSubmitted(true);
    document.getElementById('step8-optimize-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-xl p-6 space-y-4 max-w-2xl"
      >
        {/* Script textarea · AC-6 required ≥ 10 chars */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_OPTIMIZE_TEXTAREA.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder={STEP8_OPTIMIZE_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[160px] font-cn resize-y"
          />
          <p className="text-body-xs text-muted-foreground mt-1">已输入 {charCount} 字</p>
        </div>

        {/* Optimize goal input · AC-6 optional */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_OPTIMIZE_INPUT.label}
          </label>
          <Input
            value={optimizeGoal}
            onChange={(e) => setOptimizeGoal(e.target.value)}
            placeholder={STEP8_OPTIMIZE_INPUT.placeholder}
          />
        </div>

        {/* CTA · AC-6 disabled if text.length < 10 */}
        <Button type="submit" disabled={submitDisabled} className="w-full sm:w-auto">
          {STEP8_BUTTON_OPTIMIZE_SCRIPT}
        </Button>
      </form>

      {/* AC-7 · stub output: ReactMarkdown + 4 H3 blocks */}
      {submitted && (
        <div id="step8-optimize-output" className="space-y-6">
          {/* ReactMarkdown stub optimized script */}
          <div className="glass-card rounded-xl p-6">
            <ReactMarkdown className="prose prose-sm text-on-surface max-w-none">
              {STUB_OPTIMIZED_SCRIPT}
            </ReactMarkdown>
          </div>

          {/* 4 H3 analysis blocks */}
          {STEP8_OPTIMIZE_OUTPUT_MODULES_4.map((module) => (
            <div key={module.id} className="glass-card rounded-xl p-6">
              <h3 className="text-h3 font-display text-on-surface mb-3">{module.h3Label}</h3>
              <p className="text-body-sm text-muted-foreground">
                {STUB_OPTIMIZE_DETAILS[module.id] ?? ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
