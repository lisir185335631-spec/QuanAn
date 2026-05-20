import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { EmptyState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
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
} from '@/lib/constants/step6';

// VideoAgent shooting mode result shape (mirrors ShootingOutput from apps/api)
interface ShotListItem {
  scene: string;
  duration: string;
  action: string;
  dialogue: string;
  cameraAngle: string;
  prop: string;
  lighting: string;
  location: string;
  [key: string]: string | number | undefined;
}

interface Step6AgentResult {
  shotList: ShotListItem[];
  equipment: string[];
  schedule: string;
}

// 8 columns rendered from the 13-column shotList — matches AC-5 "8 列分镜"
const STORYBOARD_COLUMNS: { key: keyof ShotListItem; label: string }[] = [
  { key: 'duration',    label: '时长' },
  { key: 'scene',       label: '场景' },
  { key: 'cameraAngle', label: '景别' },
  { key: 'action',      label: '动作' },
  { key: 'dialogue',    label: '台词' },
  { key: 'lighting',    label: '灯光' },
  { key: 'prop',        label: '道具' },
  { key: 'location',    label: '地点' },
];

export default function Step6() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step6');
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [result, setResult] = useState<Step6AgentResult | null>(null);

  const prevIsSavingRef = useRef(false);

  useEffect(() => {
    if (accountId === null) return;

    const step7Data = readOtherStep<{ topic?: string }>(accountId, 'step7');
    if (step7Data?.topic) {
      setText((prev) => prev || step7Data.topic!);
    }

    const step6Data = readOtherStep<{ text?: string }>(accountId, 'step6');
    if (step6Data?.text) {
      setText((prev) => prev || step6Data.text!);
    }
  }, [accountId]);

  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  useEffect(() => {
    if (!dbQuery.data?.result) return;
    const raw = dbQuery.data.result;
    if (Array.isArray(raw['shotList']) && raw['shotList'].length > 0) {
      setResult({
        shotList: raw['shotList'] as ShotListItem[],
        equipment: (raw['equipment'] as string[]) ?? [],
        schedule: (raw['schedule'] as string) ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data?.result]);

  const counterText = STEP6_CHAR_COUNTER_TEMPLATE.replace('{count}', String(text.length));
  // AC-8 + TD-HINT: disabled when text.length < 10 (not just empty)
  const generateDisabled = isSaving || text.length < STEP6_TEXTAREA_MIN_CHARS;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (generateDisabled) return;
    save({ text });
    document.getElementById('step6-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="flex-1 container py-8">
      {/* AC-1: Header with FadeInWrapper stagger */}
      <FadeInWrapper delay={0} from="up">
        <div>
          <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
            {STEP6_STEP_TAG}
          </p>
          <h1 className="text-h1 font-display text-on-surface mb-2">{STEP6_H1}</h1>
          <p className="text-body-md text-muted-foreground mb-8">{STEP6_SUBTITLE}</p>
        </div>
      </FadeInWrapper>

      {/* AC-1 + AC-7: infobox with FadeInWrapper */}
      <FadeInWrapper delay={0.05} from="up">
        <div
          className="glass-card rounded-xl p-4 mb-6 max-w-2xl flex items-start gap-3 border-primary/20"
          data-testid="step6-infobox"
        >
          <span className="text-primary mt-0.5 shrink-0">ℹ️</span>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm text-muted-foreground">
              你可以先去第七步「文案生成」生成文案，再回这里
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void navigate('/step/7')}
            data-testid="step6-goto-step7"
            className="shrink-0"
          >
            去文案生成
          </Button>
        </div>
      </FadeInWrapper>

      {/* AC-1: Form with FadeInWrapper */}
      <FadeInWrapper delay={0.1} from="up">
      <form
        onSubmit={(e) => { handleSubmit(e); }}
        className="glass-card rounded-xl p-6 space-y-4 max-w-2xl"
      >
        <div>
          {/* AC-6 字面锁: label="短视频文案" */}
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
            data-testid="step6-textarea"
          />
          <p className="text-body-xs text-secondary mt-1">{counterText}</p>
        </div>

        {/* AC-8: disabled when text.length < 10 */}
        <Button
          type="submit"
          disabled={generateDisabled}
          className="w-full bg-gradient-to-r from-primary to-primary/80"
          data-testid="step6-cta"
        >
          {STEP6_BUTTON_GENERATE}
        </Button>
      </form>
      </FadeInWrapper>

      {/* Three-state feedback */}
      <div className="mt-8 max-w-2xl">
        {isSaving && <LoadingState text={STEP6_LOADING_TEXT} size="lg" />}
        {!isSaving && !result && (
          <EmptyState title={`输入文案后生成${STEP6_H1}`} />
        )}
      </div>

      {/* AC-2 + AC-9 + AC-11: Output section — H3 inside glass-card wrapper */}
      {result && !isSaving && (
        <section id="step6-output" className="mt-10 max-w-5xl space-y-8">
          {/* Module 1: 分镜脚本 — H3 inside glass-card (AC-2) */}
          <FadeInWrapper delay={0} from="up">
            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg mb-4 overflow-hidden">
              <div className="p-6 pb-3">
                <h3 className="text-h3 font-display text-on-surface" data-testid="step6-h3-storyboard">
                  {STEP6_OUTPUT_MODULES_3[0]!.h3Label}
                </h3>
              </div>
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
                            key={String(col.key)}
                            className="px-3 py-2 text-left font-medium text-on-surface whitespace-nowrap"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.shotList.map((shot, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-border hover:bg-muted/20 transition-all duration-200"
                        >
                          <td className="px-3 py-2 text-muted-foreground font-medium">
                            {idx + 1}
                          </td>
                          {STORYBOARD_COLUMNS.map((col) => (
                            <td
                              key={String(col.key)}
                              className="px-3 py-2 text-muted-foreground max-w-[180px]"
                            >
                              <span className="line-clamp-2">
                                {String(shot[col.key] ?? '')}
                              </span>
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
          </FadeInWrapper>

          {/* Module 2: 拍摄方案 — H3 inside glass-card (AC-2) */}
          <FadeInWrapper delay={0.05} from="up">
            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-6 mb-4">
              <h3 className="text-h3 font-display text-on-surface mb-4" data-testid="step6-h3-shooting">
                {STEP6_OUTPUT_MODULES_3[1]!.h3Label}
              </h3>
              {result.equipment.length > 0 ? (
                <ul className="space-y-2">
                  {result.equipment.map((item, i) => (
                    <li key={i} className="flex gap-3 text-body-sm">
                      <span className="font-label text-primary min-w-[20px]">·</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-muted-foreground">暂无拍摄方案数据</p>
              )}
            </div>
          </FadeInWrapper>

          {/* Module 3: 口播提词器 — H3 inside glass-card (AC-2) */}
          {result.schedule && (
            <FadeInWrapper delay={0.1} from="up">
              <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-6 mb-4">
                <h3 className="text-h3 font-display text-on-surface mb-4">
                  {STEP6_OUTPUT_MODULES_3[2]!.h3Label}
                </h3>
                <pre className="text-body-sm text-muted-foreground font-cn whitespace-pre-wrap leading-relaxed">
                  {result.schedule}
                </pre>
              </div>
            </FadeInWrapper>
          )}
        </section>
      )}
    </main>
  );
}
