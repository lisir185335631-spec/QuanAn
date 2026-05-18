import { type FormEvent, useEffect, useRef, useState } from 'react';

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

  const [text, setText] = useState('');
  const [result, setResult] = useState<Step6AgentResult | null>(null);

  const prevIsSavingRef = useRef(false);

  // Cross-step prefill: read step7 inputs (topic used as textarea source)
  // and restore step6 own inputs from LS
  useEffect(() => {
    if (accountId === null) return;

    // Prefill from step7: use topic as starting text (reverse flow: 7→6)
    const step7Data = readOtherStep<{ topic?: string }>(accountId, 'step7');
    if (step7Data?.topic) {
      setText((prev) => prev || step7Data.topic!);
    }

    // Restore step6 inputs
    const step6Data = readOtherStep<{ text?: string }>(accountId, 'step6');
    if (step6Data?.text) {
      setText((prev) => prev || step6Data.text!);
    }
  }, [accountId]);

  // Refetch after save completes (isSaving: true → false)
  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  // Sync result from DB (VideoAgent ShootingOutput)
  useEffect(() => {
    if (!dbQuery.data?.result) return;
    const raw = dbQuery.data.result as Record<string, unknown>;
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
  const generateDisabled = isSaving || text.length < STEP6_TEXTAREA_MIN_CHARS;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (generateDisabled) return;
    save({ text });
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
        onSubmit={(e) => { handleSubmit(e); }}
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
        {isSaving && <LoadingState text={STEP6_LOADING_TEXT} size="lg" />}
        {!isSaving && !result && (
          <EmptyState title={`输入文案后生成${STEP6_H1}`} />
        )}
      </div>

      {/* Output section — 3 H3 modules */}
      {result && !isSaving && (
        <section id="step6-output" className="mt-10 max-w-5xl space-y-8">
          {/* Module 1: 分镜脚本 — shotList 8 列 */}
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
                          className="border-b border-border hover:bg-muted/20 transition-colors"
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
          </div>

          {/* Module 2: 拍摄方案 — equipment list */}
          {result.equipment.length > 0 && (
            <div>
              <h3 className="text-h3 font-display text-on-surface mb-4">
                {STEP6_OUTPUT_MODULES_3[1]!.h3Label}
              </h3>
              <div className="glass-card rounded-xl p-6">
                <ul className="space-y-2">
                  {result.equipment.map((item, i) => (
                    <li key={i} className="flex gap-3 text-body-sm">
                      <span className="font-label text-primary min-w-[20px]">·</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Module 3: 口播提词器 — schedule */}
          {result.schedule && (
            <div>
              <h3 className="text-h3 font-display text-on-surface mb-4">
                {STEP6_OUTPUT_MODULES_3[2]!.h3Label}
              </h3>
              <div className="glass-card rounded-xl p-6">
                <pre className="text-body-sm text-muted-foreground font-cn whitespace-pre-wrap leading-relaxed">
                  {result.schedule}
                </pre>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
