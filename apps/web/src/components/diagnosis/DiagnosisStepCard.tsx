// D-227 → Sally 1:1 · 8 step wizard card
// SPEC §6.2 大改 · step header 灰小字 · Step1 2x2 grid · DimensionIconBlock · lucide ✕/✓ · dim placeholders

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

  const inputCls =
    'w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] transition-all ikb-focusring focus:bg-white';
  const labelCls =
    'mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#161D33] before:h-3.5 before:w-1 before:rounded-full before:content-[\'\']';

  return (
    <div className="flex flex-col gap-6" data-testid="diagnosis-step-card">
      {/* Step label */}
      <p className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-widest">
        步骤 {stepIndex}/{totalSteps} · {dimension.label}
      </p>

      {/* Step 1: 基本信息 — industry / product / stage 2x2 grid */}
      {isStep1 && (
        <div className="flex flex-col gap-6">
          {/* 行业输入 */}
          <div>
            <label
              className={labelCls}
              htmlFor="diagnosis-industry"
              style={{
                ['--before-bg' as string]: 'linear-gradient(180deg, #2B53E6, #EF3E6B)',
              }}
            >
              <span
                className="inline-block h-3.5 w-1 rounded-full shrink-0"
                style={{ background: 'linear-gradient(180deg, #2B53E6, #EF3E6B)' }}
                aria-hidden={true}
              />
              {DIAGNOSIS_STEP1_LABELS.industry}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6b7280]" aria-hidden={true}>category</span>
              <input
                id="diagnosis-industry"
                data-testid="diagnosis-industry"
                className={inputCls}
                placeholder="例如：美业、电商、知识付费..."
                value={industry}
                onChange={(e) => onIndustryChange?.(e.target.value)}
              />
            </div>
          </div>
          {/* 产品输入 */}
          <div>
            <label
              className={labelCls}
              htmlFor="diagnosis-product"
            >
              <span
                className="inline-block h-3.5 w-1 rounded-full shrink-0"
                style={{ background: 'linear-gradient(180deg, #2B53E6, #EF3E6B)' }}
                aria-hidden={true}
              />
              {DIAGNOSIS_STEP1_LABELS.product}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6b7280]" aria-hidden={true}>inventory_2</span>
              <input
                id="diagnosis-product"
                data-testid="diagnosis-product"
                className={inputCls}
                placeholder="例如：皮肤管理项目、智能体定制..."
                value={product}
                onChange={(e) => onProductChange?.(e.target.value)}
              />
            </div>
          </div>
          {/* 阶段 2x2 grid 4 cards */}
          <div className="flex flex-col gap-3">
            <p id="diagnosis-stage-label" className={cn(labelCls, 'flex items-center gap-1.5')}>
              <span
                className="inline-block h-3.5 w-1 rounded-full shrink-0"
                style={{ background: 'linear-gradient(180deg, #2B53E6, #EF3E6B)' }}
                aria-hidden={true}
              />
              {DIAGNOSIS_STEP1_LABELS.stage}
            </p>
            <div role="radiogroup" aria-labelledby="diagnosis-stage-label" className="grid grid-cols-2 gap-4">
              {DIAGNOSIS_STAGES_4.map((s) => (
                <div
                  key={s.value}
                  role="radio"
                  aria-checked={stage === s.value}
                  tabIndex={0}
                  data-testid={`diagnosis-stage-${s.value}`}
                  data-state={stage === s.value ? 'selected' : 'unselected'}
                  className={cn(
                    'ikb-hovercard cursor-pointer flex flex-col gap-1 rounded-xl border px-4 py-3.5 transition-all',
                    stage === s.value
                      ? 'shadow-sm'
                      : 'border-[#e5e7eb] bg-white hover:bg-[#F3F5FC]',
                  )}
                  style={
                    stage === s.value
                      ? { border: '1px solid #2B53E6', background: 'rgba(43,83,230,0.04)' }
                      : undefined
                  }
                  onClick={() => onStageChange?.(s.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onStageChange?.(s.value);
                  }}
                >
                  <span
                    className={cn(
                      'text-[15px] font-bold',
                    )}
                    style={{ color: stage === s.value ? '#2B53E6' : '#161D33' }}
                  >
                    {s.label}
                  </span>
                  <span className="text-[13px] text-[#6b7280]">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2-8: icon block + checkbox chips + notes */}
      {!isStep1 && (
        <div className="flex flex-col gap-5">
          <DimensionIconBlock
            dimensionId={dimension.id}
            label={dimension.label}
            subtitle={dimension.subtitle}
          />
          {/* Checkbox chips — 可多选卡片 */}
          <div className="flex flex-col gap-3">
            {dimension.checkboxes.map((item) => {
              const checked = selectedCheckboxes.includes(item);
              return (
                <div
                  key={item}
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={item}
                  tabIndex={0}
                  data-testid={`diagnosis-checkbox-${item}`}
                  data-state={checked ? 'checked' : 'unchecked'}
                  className={cn(
                    'ikb-hovercard flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-all',
                    checked
                      ? 'shadow-sm'
                      : 'border-[#e5e7eb] bg-white hover:bg-[#F3F5FC]',
                  )}
                  style={
                    checked
                      ? { border: '1px solid #2B53E6', background: 'rgba(43,83,230,0.05)' }
                      : undefined
                  }
                  onClick={() => onCheckboxToggle(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onCheckboxToggle(item);
                  }}
                >
                  {checked ? (
                    <span className="material-symbols-outlined mt-0.5 text-[20px] shrink-0 icon-fill" aria-hidden={true} style={{ color: '#2B53E6' }}>check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#c4c5d6] shrink-0" aria-hidden={true}>radio_button_unchecked</span>
                  )}
                  <span
                    className={cn(
                      'text-[15px] leading-relaxed',
                      checked ? 'font-medium text-[#161D33]' : 'text-[#444653]',
                    )}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Notes textarea */}
          <div className="flex flex-col gap-2">
            <label
              className={cn(labelCls, 'flex items-center gap-1.5')}
              htmlFor={`diagnosis-notes-${stepIndex}`}
            >
              <span
                className="inline-block h-3.5 w-1 rounded-full shrink-0"
                style={{ background: 'linear-gradient(180deg, #2B53E6, #EF3E6B)' }}
                aria-hidden={true}
              />
              {DIAGNOSIS_NOTES_PLACEHOLDER}
            </label>
            <div
              className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:bg-white"
              style={{
                ['--focus-within-border' as string]: '#2B53E6',
              }}
              onFocus={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2B53E6'; }}
              onBlur={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = ''; }}
            >
              <textarea
                id={`diagnosis-notes-${stepIndex}`}
                data-testid="diagnosis-notes"
                className="min-h-[80px] w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed ikb-focusring"
                placeholder={DIAGNOSIS_DIMENSION_PLACEHOLDERS[dimension.id] ?? ''}
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          data-testid="diagnosis-prev"
          aria-label="上一步"
          className="ikb-focusring flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#444653] transition-colors hover:bg-[#F3F5FC] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>arrow_back</span>
          {DIAGNOSIS_BUTTONS.prev}
        </button>
        <button
          type="button"
          onClick={onNext}
          data-testid="diagnosis-next"
          aria-label={isLast ? DIAGNOSIS_BUTTONS.generate : DIAGNOSIS_BUTTONS.next}
          className="ikb-gradbtn flex items-center gap-2 rounded-xl px-6 py-2.5 text-[14px] font-bold text-white shadow-sm transition-all active:translate-y-px"
        >
          {isLast ? (
            <>
              {DIAGNOSIS_BUTTONS.generate}
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>stethoscope</span>
            </>
          ) : (
            <>
              {DIAGNOSIS_BUTTONS.next}
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
