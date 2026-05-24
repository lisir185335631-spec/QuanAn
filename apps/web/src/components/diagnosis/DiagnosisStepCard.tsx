// D-227 → Sally 1:1 · 8 step wizard card
// SPEC §6.2 大改 · step header 灰小字 · Step1 2x2 grid · DimensionIconBlock · lucide ✕/✓ · dim placeholders

import { CheckCircle2, CircleX, Stethoscope } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  type DiagnosisDimension,
  DIAGNOSIS_STAGES_4,
  DIAGNOSIS_NOTES_PLACEHOLDER,
  DIAGNOSIS_STEP1_LABELS,
  DIAGNOSIS_DIMENSION_PLACEHOLDERS,
  DIAGNOSIS_BUTTONS,
} from '@/lib/constants/diagnosis';
import { cn } from '@/lib/utils';

import { DimensionIconBlock } from './DimensionIconBlock';

export interface DiagnosisStepCardProps {
  stepIndex: number;        // 1-8
  totalSteps: number;       // 8
  dimension: DiagnosisDimension;
  selectedCheckboxes: string[];
  onCheckboxToggle: (item: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;         // disabled 上一步
  isLast: boolean;          // CTA 改 "生成诊断报告"
  // Step 1 special fields
  industry?: string;
  onIndustryChange?: (v: string) => void;
  product?: string;
  onProductChange?: (v: string) => void;
  stage?: string;
  onStageChange?: (v: string) => void;
}

export function DiagnosisStepCard({
  stepIndex,
  totalSteps,
  dimension,
  selectedCheckboxes,
  onCheckboxToggle,
  notes,
  onNotesChange,
  onPrev,
  onNext,
  isFirst,
  isLast,
  industry = '',
  onIndustryChange,
  product = '',
  onProductChange,
  stage = '',
  onStageChange,
}: DiagnosisStepCardProps) {
  const isStep1 = dimension.id === 'basic';

  return (
    <div className="flex flex-col gap-6" data-testid="diagnosis-step-card">
      {/* Header: 灰小字(删 uppercase 紫色 step header) */}
      <p className="text-sm text-muted-foreground">
        步骤 {stepIndex}/{totalSteps} · {dimension.label}
      </p>

      {/* Step 1: 基本信息 — industry / product / stage 2x2 grid */}
      {isStep1 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-label text-on-surface"
              htmlFor="diagnosis-industry"
            >
              {DIAGNOSIS_STEP1_LABELS.industry}
            </label>
            <input
              id="diagnosis-industry"
              data-testid="diagnosis-industry"
              className="rounded-md border border-border bg-surface-container px-3 py-2 text-base text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder=""
              value={industry}
              onChange={(e) => onIndustryChange?.(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-label text-on-surface"
              htmlFor="diagnosis-product"
            >
              {DIAGNOSIS_STEP1_LABELS.product}
            </label>
            <input
              id="diagnosis-product"
              data-testid="diagnosis-product"
              className="rounded-md border border-border bg-surface-container px-3 py-2 text-base text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder=""
              value={product}
              onChange={(e) => onProductChange?.(e.target.value)}
            />
          </div>
          {/* Stage: 2x2 grid 4 cards */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-label text-on-surface">{DIAGNOSIS_STEP1_LABELS.stage}</p>
            <div className="grid grid-cols-2 gap-4">
              {DIAGNOSIS_STAGES_4.map((s) => (
                <div
                  key={s.value}
                  role="radio"
                  aria-checked={stage === s.value}
                  tabIndex={0}
                  data-testid={`diagnosis-stage-${s.value}`}
                  className={cn(
                    'cursor-pointer flex flex-col gap-1 rounded-lg border px-4 py-3 transition-all',
                    stage === s.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                  onClick={() => onStageChange?.(s.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onStageChange?.(s.value);
                  }}
                >
                  <span
                    className={cn(
                      'text-base font-medium',
                      stage === s.value ? 'text-primary' : 'text-on-surface',
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="text-sm text-muted-foreground">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2-8: icon block + checkbox list + notes */}
      {!isStep1 && (
        <div className="flex flex-col gap-5">
          <DimensionIconBlock
            dimensionId={dimension.id}
            label={dimension.label}
            subtitle={dimension.subtitle}
          />
          <div className="flex flex-col gap-3">
            {dimension.checkboxes.map((item) => {
              const checked = selectedCheckboxes.includes(item);
              return (
                <div
                  key={item}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  data-testid={`diagnosis-checkbox-${item}`}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-all',
                    checked
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                  onClick={() => onCheckboxToggle(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onCheckboxToggle(item);
                  }}
                >
                  {checked ? (
                    <CheckCircle2 className="mt-0.5 w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <CircleX className="mt-0.5 w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={cn(
                      'text-base',
                      checked ? 'text-on-surface' : 'text-muted-foreground',
                    )}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-label text-muted-foreground"
              htmlFor={`diagnosis-notes-${stepIndex}`}
            >
              {DIAGNOSIS_NOTES_PLACEHOLDER}
            </label>
            <textarea
              id={`diagnosis-notes-${stepIndex}`}
              data-testid="diagnosis-notes"
              className="min-h-[80px] rounded-md border border-border bg-surface-container px-3 py-2 text-base text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder={DIAGNOSIS_DIMENSION_PLACEHOLDERS[dimension.id] ?? ''}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={isFirst}
          data-testid="diagnosis-prev"
        >
          {DIAGNOSIS_BUTTONS.prev}
        </Button>
        <Button
          type="button"
          onClick={onNext}
          data-testid="diagnosis-next"
          className="inline-flex items-center gap-2"
        >
          {isLast ? (
            <>
              {DIAGNOSIS_BUTTONS.generate}
              <Stethoscope className="w-4 h-4 ml-2" />
            </>
          ) : (
            DIAGNOSIS_BUTTONS.next
          )}
        </Button>
      </div>
    </div>
  );
}
