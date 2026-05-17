import { type FormEvent, useEffect, useState } from 'react';

import { EmptyState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  STEP6_BUTTON_GENERATE,
  STEP6_CHAR_COUNTER_TEMPLATE,
  STEP6_H1,
  STEP6_LOADING_TEXT,
  STEP6_OUTPUT_MODULES_3,
  STEP6_STEP_TAG,
  STEP6_SUBTITLE,
  STEP6_TEXTAREA,
  STEP6_TEXTAREA_MIN_CHARS,
  type Step6Result,
  type Step6StoryboardScene,
} from '@/lib/constants/step6';

const LS_STEP6 = 'acc_step6';
const LS_STEP7 = 'acc_step7';

export interface Step6FormData {
  text: string;
}

const STORYBOARD_COLUMNS: { key: keyof Step6StoryboardScene; label: string }[] = [
  { key: 'duration',  label: '时长' },
  { key: 'scene',     label: '场景' },
  { key: 'framing',   label: '景别' },
  { key: 'angle',     label: '角度' },
  { key: 'movement',  label: '运镜' },
  { key: 'emotion',   label: '情绪' },
  { key: 'dialogue',  label: '台词' },
  { key: 'action',    label: '动作' },
];

function generateMockResult(text: string): Step6Result {
  const preview = text.slice(0, 12);
  const storyboard: Step6StoryboardScene[] = [
    {
      shot_number: 1,
      duration: '3s',
      scene: '开场建立镜头',
      framing: '中景',
      angle: '平视',
      movement: '固定',
      emotion: '自信从容',
      dialogue: `${preview}…`,
      action: '面向镜头，微笑，缓慢深呼吸',
    },
    {
      shot_number: 2,
      duration: '5s',
      scene: '核心内容呈现',
      framing: '近景',
      angle: '略俯',
      movement: '缓慢推进',
      emotion: '专注认真',
      dialogue: '这是核心论点——',
      action: '手势辅助表达，眼神坚定',
    },
    {
      shot_number: 3,
      duration: '4s',
      scene: '数据证据展示',
      framing: '特写',
      angle: '平视',
      movement: '固定',
      emotion: '惊喜揭示',
      dialogue: '数据表明…',
      action: '手持道具或指向屏幕',
    },
    {
      shot_number: 4,
      duration: '4s',
      scene: '案例故事支撑',
      framing: '中景',
      angle: '平视',
      movement: '轻微摇移',
      emotion: '共情温暖',
      dialogue: '我遇到过这样的…',
      action: '轻微点头，语调放缓',
    },
    {
      shot_number: 5,
      duration: '4s',
      scene: '行动号召收尾',
      framing: '中近景',
      angle: '平视',
      movement: '固定',
      emotion: '鼓励有力',
      dialogue: '关注我，更多干货持续更新',
      action: '手势指向镜头，表情自信',
    },
  ];

  return {
    storyboard,
    shooting_plan: {
      props: '无线麦克风、手持稳定器（可选）、桌面支架或三脚架',
      lighting: '自然窗光为主光源，补充柔光灯消除阴影，色温 5000-5500K',
      costume: '干净简洁职业装，避免复杂图案，颜色与背景形成对比',
      location: '安静室内环境，简洁背景墙或书架，避免杂乱背景干扰',
    },
    teleprompter: [
      '【开场钩子】',
      `${text.slice(0, 30)}…`,
      '',
      '【核心论点】',
      '很多人不知道的是——',
      '今天我来拆解这个关键问题。',
      '',
      '【数据支撑】',
      '研究表明，掌握这个方法的人，效率提升了 3 倍。',
      '',
      '【案例故事】',
      '我有一个学员，原来…',
      '后来用了这个方法，结果完全不一样了。',
      '',
      '【行动号召】',
      '如果你也想要这样的改变，',
      '关注我，点赞收藏，我每天都会分享实操干货。',
    ].join('\n'),
  };
}

export default function Step6() {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Step6Result | null>(null);

  useEffect(() => {
    try {
      const acc7 = JSON.parse(localStorage.getItem(LS_STEP7) ?? '{}') as {
        result?: { body?: { text?: string } };
      };
      if (acc7?.result?.body?.text) {
        setText(acc7.result.body.text);
      }
    } catch {
      // ignore
    }

    try {
      const raw = localStorage.getItem(LS_STEP6);
      if (raw) {
        const parsed = JSON.parse(raw) as { text?: string; result?: Step6Result };
        if (parsed.text) setText((prev) => prev || parsed.text!);
        if (parsed.result) setResult(parsed.result);
      }
    } catch {
      // ignore
    }
  }, []);

  const counterText = STEP6_CHAR_COUNTER_TEMPLATE.replace('{count}', String(text.length));
  const generateDisabled = isGenerating || text.length < STEP6_TEXTAREA_MIN_CHARS;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (generateDisabled) return;

    setIsGenerating(true);
    await new Promise<void>((r) => setTimeout(r, 2000 + Math.random() * 1000));

    const mockResult = generateMockResult(text);
    localStorage.setItem(LS_STEP6, JSON.stringify({ text, result: mockResult }));
    setResult(mockResult);
    setIsGenerating(false);
    document.getElementById('step6-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="flex-1 container py-8">
      {/* Header */}
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP6_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP6_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{STEP6_SUBTITLE}</p>

      {/* Form glass-card */}
      <form
        onSubmit={(e) => { void handleSubmit(e); }}
        className="glass-card rounded-xl p-6 space-y-4 max-w-2xl"
      >
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP6_TEXTAREA.label}
            {STEP6_TEXTAREA.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <textarea
            required={STEP6_TEXTAREA.required}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={STEP6_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-cn resize-y"
            style={{ minHeight: '120px' }}
          />
          <p className="text-body-xs text-secondary mt-1">{counterText}</p>
        </div>

        <Button
          type="submit"
          disabled={generateDisabled}
          className="w-full bg-gradient-to-r from-primary to-primary/80"
        >
          {STEP6_BUTTON_GENERATE}
        </Button>
      </form>

      {/* Three-state feedback */}
      <div className="mt-8 max-w-2xl">
        {isGenerating && <LoadingState text={STEP6_LOADING_TEXT} size="lg" />}
        {!isGenerating && !result && (
          <EmptyState title={`输入文案后生成${STEP6_H1}`} />
        )}
      </div>

      {/* Output section — 3 H3 modules */}
      {result && !isGenerating && (
        <section id="step6-output" className="mt-10 max-w-5xl space-y-8">
          {/* Output Module 1 */}
          <div>
            <h3 className="text-h3 font-display text-on-surface mb-4">
              {STEP6_OUTPUT_MODULES_3[0]!.h3Label}
            </h3>
            <div className="glass-card rounded-xl overflow-hidden">
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  <table className="w-full text-body-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-3 py-2 text-left font-medium text-on-surface whitespace-nowrap">
                          #
                        </th>
                        {STORYBOARD_COLUMNS.map((col) => (
                          <th
                            key={col.key}
                            className="px-3 py-2 text-left font-medium text-on-surface whitespace-nowrap"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.storyboard.map((scene) => (
                        <tr
                          key={scene.shot_number}
                          className="border-b border-border hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2 text-muted-foreground font-medium">
                            {scene.shot_number}
                          </td>
                          {STORYBOARD_COLUMNS.map((col) => (
                            <td
                              key={col.key}
                              className="px-3 py-2 text-muted-foreground max-w-[180px]"
                            >
                              <span className="line-clamp-2">{scene[col.key]}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>

          {/* Output Module 2 */}
          <div>
            <h3 className="text-h3 font-display text-on-surface mb-4">
              {STEP6_OUTPUT_MODULES_3[1]!.h3Label}
            </h3>
            <div className="glass-card rounded-xl p-6">
              <ul className="space-y-3">
                {(
                  [
                    { label: '道具', value: result.shooting_plan.props },
                    { label: '灯光', value: result.shooting_plan.lighting },
                    { label: '服装', value: result.shooting_plan.costume },
                    { label: '场景', value: result.shooting_plan.location },
                  ] as const
                ).map(({ label, value }) => (
                  <li key={label} className="flex gap-3 text-body-sm">
                    <span className="font-label text-on-surface min-w-[40px]">{label}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Output Module 3 */}
          <div>
            <h3 className="text-h3 font-display text-on-surface mb-4">
              {STEP6_OUTPUT_MODULES_3[2]!.h3Label}
            </h3>
            <div className="glass-card rounded-xl p-6">
              <pre className="text-body-sm text-muted-foreground font-cn whitespace-pre-wrap leading-relaxed">
                {result.teleprompter}
              </pre>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
