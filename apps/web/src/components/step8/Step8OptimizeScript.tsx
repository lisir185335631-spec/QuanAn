import { type FormEvent, useEffect, useState } from 'react';

import { LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  STEP8_BUTTON_OPTIMIZE_SCRIPT,
  STEP8_OPTIMIZE_CHAR_COUNTER_TEMPLATE,
  STEP8_OPTIMIZE_INPUT,
  STEP8_OPTIMIZE_LOADING_TEXT,
  STEP8_OPTIMIZE_MIN_CHARS,
  STEP8_OPTIMIZE_TEXTAREA,
  type Step8OptimizeScriptResult,
} from '@/lib/constants/step8';

const LS_STEP8 = 'acc_step8';

export interface Step8OptimizeScriptFormData {
  scriptText: string;
  optimizeGoal: string;
}

interface Step8OptimizeLsShape {
  sub_function: string;
  formData?: Step8OptimizeScriptFormData;
  optimize_script?: Step8OptimizeScriptResult;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-container p-4">
      <p className="text-body-xs font-label text-primary uppercase tracking-wide mb-2">{label}</p>
      <p className="text-body-sm text-on-surface whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function generateMockResult(formData: Step8OptimizeScriptFormData): Step8OptimizeScriptResult {
  const preview = formData.scriptText.slice(0, 30);
  const goal = formData.optimizeGoal || '提升整体表达效果';
  return {
    optimized_text: `【优化版本】${preview}…

AI 已针对「${goal}」对您的话术进行深度优化，调整了以下方面：
1. 开场更具吸引力，前 3 秒抓住观众注意力
2. 痛点描述更精准，情感共鸣更强烈
3. 行动引导更清晰，降低用户决策门槛
4. 互动设计更自然，增强实时参与感
5. 结尾收尾更有力，强化品牌记忆点

完整优化后话术已整合以上所有改动，建议按照节奏提示词完成排练后再正式使用。`,
    optimization_notes: `优化目标：${goal}

主要改动说明：
• 句式节奏：长句拆短，增加停顿感，适合口播节奏
• 情感层次：增加共鸣词汇，强化"你也有过这样的困扰吗"类互动
• 转化逻辑：优化 FABE 结构（特点→优势→利益→证据）
• 互动密度：每 2-3 分钟一个互动钩子，防止观众流失
• 禁用词检查：已替换平台敏感词，降低违规风险

建议搭配使用：直播前完整朗读 2 遍，掌握节奏后再开播。`,
  };
}

interface Props {
  subfunctionKey: string;
}

export function Step8OptimizeScript({ subfunctionKey }: Props) {
  const [scriptText, setScriptText] = useState('');
  const [optimizeGoal, setOptimizeGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Step8OptimizeScriptResult | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_STEP8);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Step8OptimizeLsShape;
      if (parsed.sub_function !== subfunctionKey) return;
      if (parsed.formData) {
        const fd = parsed.formData;
        if (fd.scriptText) setScriptText(fd.scriptText);
        if (fd.optimizeGoal) setOptimizeGoal(fd.optimizeGoal);
      }
      if (parsed.optimize_script) setResult(parsed.optimize_script);
    } catch {
      // ignore parse errors
    }
  }, [subfunctionKey]);

  const charCounterText = STEP8_OPTIMIZE_CHAR_COUNTER_TEMPLATE.replace(
    '{count}',
    String(scriptText.length),
  );
  const submitDisabled = isGenerating || scriptText.length < STEP8_OPTIMIZE_MIN_CHARS;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled) return;
    setIsGenerating(true);
    const formData: Step8OptimizeScriptFormData = { scriptText, optimizeGoal };
    const delay = 3000 + Math.random() * 2000;
    await new Promise<void>((r) => setTimeout(r, delay));
    const mockResult = generateMockResult(formData);
    const lsData: Step8OptimizeLsShape = {
      sub_function: subfunctionKey,
      formData,
      optimize_script: mockResult,
    };
    localStorage.setItem(LS_STEP8, JSON.stringify(lsData));
    setResult(mockResult);
    setIsGenerating(false);
    document.getElementById('step8-optimize-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={(e) => { void handleSubmit(e); }}
        className="glass-card rounded-xl p-6 space-y-4 max-w-2xl"
      >
        {/* Script textarea */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_OPTIMIZE_TEXTAREA.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            required
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder={STEP8_OPTIMIZE_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[160px] font-cn resize-y"
          />
          <p className="text-body-xs text-muted-foreground mt-1">{charCounterText}</p>
        </div>

        {/* Optimize goal input */}
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

        {/* CTA */}
        <Button type="submit" disabled={submitDisabled} className="w-full sm:w-auto">
          {STEP8_BUTTON_OPTIMIZE_SCRIPT}
        </Button>
      </form>

      {/* Loading */}
      {isGenerating && <LoadingState text={STEP8_OPTIMIZE_LOADING_TEXT} />}

      {/* Output: 2 InfoCards */}
      {result && !isGenerating && (
        <div id="step8-optimize-output" className="space-y-4">
          <InfoCard label="优化后文案" value={result.optimized_text} />
          <InfoCard label="优化说明" value={result.optimization_notes} />
        </div>
      )}
    </div>
  );
}
