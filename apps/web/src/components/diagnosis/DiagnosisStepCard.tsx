// D-226 · 通用 8 step 向导组件 · controlled props · 不 hardcode 维度

import { Button } from '@/components/ui/button';
import { type DiagnosisDimension, DIAGNOSIS_STAGES_4, DIAGNOSIS_NOTES_PLACEHOLDER } from '@/lib/constants/diagnosis';
import { cn } from '@/lib/utils';

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
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-label-sm font-label text-primary uppercase tracking-wide">
          步骤 {stepIndex} / {totalSteps} · {dimension.label}
        </p>
        <h2 className="text-h2 font-display text-on-surface">{dimension.label}</h2>
        <p className="text-body-md text-muted-foreground">{dimension.subtitle}</p>
      </div>

      {/* Step 1: 基本信息 — industry / product / stage */}
      {isStep1 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-label-sm font-label text-on-surface" htmlFor="diagnosis-industry">
              行业
            </label>
            <input
              id="diagnosis-industry"
              data-testid="diagnosis-industry"
              className="rounded-md border border-border bg-surface-container px-3 py-2 text-body-md text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入你的行业，如：美业"
              value={industry}
              onChange={(e) => onIndustryChange?.(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-label-sm font-label text-on-surface" htmlFor="diagnosis-product">
              产品
            </label>
            <input
              id="diagnosis-product"
              data-testid="diagnosis-product"
              className="rounded-md border border-border bg-surface-container px-3 py-2 text-body-md text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入你的产品或服务，如：皮肤管理"
              value={product}
              onChange={(e) => onProductChange?.(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-label-sm font-label text-on-surface">当前阶段</p>
            {DIAGNOSIS_STAGES_4.map((s) => (
              <label
                key={s.value}
                data-testid={`diagnosis-stage-${s.value}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all',
                  stage === s.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  name="diagnosis-stage"
                  value={s.value}
                  checked={stage === s.value}
                  onChange={() => onStageChange?.(s.value)}
                  className="accent-primary"
                  aria-label={s.label}
                />
                <span className="text-body-md text-on-surface">{s.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 2-8: checkbox list + notes */}
      {!isStep1 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            {dimension.checkboxes.map((item) => {
              const checked = selectedCheckboxes.includes(item);
              return (
                <label
                  key={item}
                  data-testid={`diagnosis-checkbox-${item}`}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-all',
                    checked
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onCheckboxToggle(item)}
                    className="mt-0.5 accent-primary"
                    aria-label={item}
                  />
                  <span className="text-body-md text-on-surface">{item}</span>
                </label>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-label-sm font-label text-muted-foreground" htmlFor={`diagnosis-notes-${stepIndex}`}>
              {DIAGNOSIS_NOTES_PLACEHOLDER}
            </label>
            <textarea
              id={`diagnosis-notes-${stepIndex}`}
              data-testid="diagnosis-notes"
              className="min-h-[80px] rounded-md border border-border bg-surface-container px-3 py-2 text-body-md text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder={DIAGNOSIS_NOTES_PLACEHOLDER}
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
          上一步
        </Button>
        <Button
          type="button"
          onClick={onNext}
          data-testid="diagnosis-next"
        >
          {isLast ? '生成诊断报告' : '下一步'}
        </Button>
      </div>
    </div>
  );
}
