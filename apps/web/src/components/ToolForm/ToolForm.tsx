/**
 * ToolForm — generic tool page form wrapper · PRD-5 US-001
 * Serves 4 tool pages: /generate · /boom-generate · /analysis · /video-analysis
 * useForm + zodResolver + LS-first dual-write + AbortController on unmount
 * LS namespace: getToolLsKey (D-031) — not stepKey, toolKey namespace
 * REJ-035: LS先写 + DB后写 · DB fail 时 LS 保留 + toast.error
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getToolLsKey } from '@/lib/ls-namespace';
import { cn } from '@/lib/utils';

import { ElementsMultiSelect } from './ElementsMultiSelect';
import { ScriptTypeSelect } from './ScriptTypeSelect';
import { TextareaField } from '@/components/StepForm/TextareaField';

import type { FieldError, FieldErrors } from 'react-hook-form';
import type { ZodTypeAny } from 'zod';
import type { HotElementKey, ScriptTypeKey } from '@quanqn/schemas/specialist-io';

// ── Tool types ────────────────────────────────────────────────────────────────

export type ToolKey = 'generate' | 'boom-generate' | 'analysis' | 'video-analysis' | 'freeGenerate';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ToolFormProps {
  toolKey: ToolKey;
  schema: ZodTypeAny;
  /** onSubmit receives validated form data; returns result or throws */
  onSubmit: (data: Record<string, unknown>) => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
}

// ── ToolForm ──────────────────────────────────────────────────────────────────

export function ToolForm({ toolKey, schema, onSubmit, onSuccess, defaultValues, submitLabel }: ToolFormProps) {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  const [isPending, setIsPending] = useState(false);

  const resolvedDefaults = defaultValues ?? getDefaultValues(toolKey);

  // Restore from LS on first mount
  const [restoredDefaults] = useState<Record<string, unknown>>(() => {
    if (accountId === null) return resolvedDefaults;
    try {
      const stored = localStorage.getItem(getToolLsKey(accountId, toolKey, 'input'));
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        return { ...resolvedDefaults, ...parsed };
      }
    } catch {
      // ignore malformed LS
    }
    return resolvedDefaults;
  });

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: restoredDefaults,
  });

  const { setValue, watch, formState: { errors: rawErrors }, register } = form;
  const errors = rawErrors as FieldErrors<Record<string, unknown>>;

  const handleSubmit = form.handleSubmit(async (data) => {
    if (abortRef.current.signal.aborted) return;

    // REJ-035: LS先写 — DB fail 时 LS 保留(不回滚)
    if (accountId !== null) {
      try {
        localStorage.setItem(getToolLsKey(accountId, toolKey, 'input'), JSON.stringify(data));
      } catch {
        // Storage full — continue to submit
      }
    }

    setIsPending(true);
    try {
      const result = await onSubmit(data);
      if (!abortRef.current.signal.aborted) {
        onSuccess?.(result);
      }
    } catch {
      if (!abortRef.current.signal.aborted) {
        // REJ-035: DB fail → LS 保留 + toast.error
        toast.error('生成失败 · 请稍后重试');
      }
    } finally {
      if (!abortRef.current.signal.aborted) {
        setIsPending(false);
      }
    }
  });

  return (
    <form
      onSubmit={(e) => { void handleSubmit(e); }}
      className="max-w-2xl space-y-6"
      data-testid={`tool-form-${toolKey}`}
      noValidate
    >
      {renderToolFields(toolKey, form, watch, setValue, register, errors as Record<string, FieldError | undefined>)}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        {isPending ? '生成中…' : (submitLabel ?? '开始生成')}
      </Button>
    </form>
  );
}

// ── Field renderer (switch on toolKey) ───────────────────────────────────────

function renderToolFields(
  toolKey: ToolKey,
  _form: ReturnType<typeof useForm<Record<string, unknown>>>,
  watch: ReturnType<typeof useForm<Record<string, unknown>>>['watch'],
  setValue: ReturnType<typeof useForm<Record<string, unknown>>>['setValue'],
  register: ReturnType<typeof useForm<Record<string, unknown>>>['register'],
  errors: Record<string, FieldError | undefined>,
) {
  switch (toolKey) {
    case 'freeGenerate':
      return (
        <>
          <ScriptTypeSelect
            value={(watch('scriptType') as string) ?? ''}
            onChange={(v: ScriptTypeKey) => setValue('scriptType', v, { shouldValidate: true })}
            error={errors['scriptType']}
          />
          <ElementsMultiSelect
            value={(watch('elements') as HotElementKey[]) ?? []}
            onChange={(v) => setValue('elements', v, { shouldValidate: true })}
            error={errors['elements'] as FieldError | undefined}
            maxSelect={8}
          />
          <TextareaField
            label="话题方向"
            value={(watch('topic') as string) ?? ''}
            onChange={(v) => setValue('topic', v, { shouldValidate: true })}
            error={errors['topic']}
            placeholder="例如：为什么有的人30岁就财富自由 / 减肥打卡 / 职场晋升（最多500字）"
            rows={3}
            required
          />
        </>
      );

    case 'generate':
      return (
        <>
          <ScriptTypeSelect
            value={(watch('scriptType') as string) ?? ''}
            onChange={(v: ScriptTypeKey) => setValue('scriptType', v, { shouldValidate: true })}
            error={errors['scriptType']}
          />
          <ElementsMultiSelect
            value={(watch('elements') as HotElementKey[]) ?? []}
            onChange={(v) => setValue('elements', v, { shouldValidate: true })}
            error={errors['elements'] as FieldError | undefined}
            maxSelect={8}
          />
          <div className="space-y-1.5">
            <label htmlFor="tool-generate-topic" className="text-body-sm font-medium text-on-surface">
              话题方向<span className="text-error ml-0.5">*</span>
            </label>
            <input
              id="tool-generate-topic"
              {...register('topic')}
              className={cn(
                'flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                errors['topic'] && 'border-error',
              )}
              placeholder="例如：减肥打卡 / 职场晋升 / 亲子教育"
            />
            {errors['topic'] && (
              <p className="text-body-xs text-error" role="alert">{errors['topic']?.message}</p>
            )}
          </div>
        </>
      );

    case 'boom-generate':
      return (
        <>
          <ElementsMultiSelect
            value={(watch('elements') as HotElementKey[]) ?? []}
            onChange={(v) => setValue('elements', v, { shouldValidate: true })}
            error={errors['elements'] as FieldError | undefined}
            maxSelect={8}
          />
          <div className="space-y-1.5">
            <label htmlFor="tool-boom-industry" className="text-body-sm font-medium text-on-surface">行业（可选）</label>
            <input
              id="tool-boom-industry"
              {...register('industry')}
              className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="例如：健康养生 / 职场成长"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tool-boom-theme" className="text-body-sm font-medium text-on-surface">主题方向（可选）</label>
            <input
              id="tool-boom-theme"
              {...register('theme')}
              className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="例如：励志逆袭 / 产品种草"
            />
          </div>
        </>
      );

    case 'analysis': {
      const copyValue = (watch('copy') as string) ?? '';
      const charCount = copyValue.length;
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="tool-analysis-copy" className="text-body-sm font-medium text-on-surface">
              文案内容<span className="text-error ml-0.5">*</span>
            </label>
            <span
              className={cn(
                'text-body-xs tabular-nums',
                charCount < 10 ? 'text-error' : 'text-muted-foreground',
              )}
              data-testid="analysis-char-count"
            >
              {charCount} / 3000
            </span>
          </div>
          <textarea
            id="tool-analysis-copy"
            {...register('copy')}
            rows={10}
            className={cn(
              'flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y min-h-[120px]',
              errors['copy'] && 'border-error',
            )}
            placeholder="粘贴你的文案，进行结构评分和优化建议（10-3000字）"
          />
          {errors['copy'] && (
            <p className="text-body-xs text-error" role="alert">{errors['copy']?.message}</p>
          )}
        </div>
      );
    }

    case 'video-analysis':
      return (
        <>
          <div className="space-y-1.5">
            <label htmlFor="tool-va-title" className="text-body-sm font-medium text-on-surface">爆款标题（可选）</label>
            <input
              id="tool-va-title"
              {...register('lastTitle')}
              className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="粘贴爆款视频的标题（可选）"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tool-va-copy" className="text-body-sm font-medium text-on-surface">
              爆款文案<span className="text-error ml-0.5">*</span>
            </label>
            <textarea
              id="tool-va-copy"
              {...register('lastCopy')}
              rows={10}
              className={cn(
                'flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y min-h-[120px]',
                errors['lastCopy'] && 'border-error',
              )}
              placeholder="粘贴爆款视频的完整文案，进行心理元素拆解 + 仿写（10-3000字）"
            />
            {errors['lastCopy'] && (
              <p className="text-body-xs text-error" role="alert">{errors['lastCopy']?.message}</p>
            )}
          </div>
        </>
      );

    default:
      return (
        <p className="text-body-sm text-muted-foreground">该工具暂无需填写内容</p>
      );
  }
}

// ── Default values per toolKey ────────────────────────────────────────────────

function getDefaultValues(toolKey: ToolKey): Record<string, unknown> {
  switch (toolKey) {
    case 'freeGenerate':
      return { scriptType: '', elements: [], topic: '' };
    case 'generate':
      return { scriptType: '', elements: [], topic: '' };
    case 'boom-generate':
      return { elements: [], industry: '', theme: '' };
    case 'analysis':
      return { copy: '' };
    case 'video-analysis':
      return { lastTitle: '', lastCopy: '' };
    default:
      return {};
  }
}
