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

import { TextareaField } from '@/components/StepForm/TextareaField';
import { Button } from '@/components/ui/button';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getToolLsKey } from '@/lib/ls-namespace';
import { cn } from '@/lib/utils';

import { ElementsMultiSelect } from './ElementsMultiSelect';
import { ScriptTypeSelect } from './ScriptTypeSelect';

import type { HotElementKey, ScriptTypeKey } from '@quanan/schemas/specialist-io';
import type { FieldError } from 'react-hook-form';
import type { ZodTypeAny } from 'zod';

// ── Tool types ────────────────────────────────────────────────────────────────

export type ToolKey = 'generate' | 'boom-generate' | 'analysis' | 'video-analysis' | 'freeGenerate' | 'video-production' | 'acquisition-video' | 'ai-video' | 'acquisition';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ToolFormProps {
  toolKey: ToolKey;
  schema: ZodTypeAny;
  /** onSubmit receives validated form data; returns result or throws */
  onSubmit: (data: Record<string, unknown>) => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
  /** When true, submit button is disabled regardless of isPending */
  disabled?: boolean;
  /** Label shown on the button when disabled=true */
  disabledLabel?: string;
}

// ── ToolForm ──────────────────────────────────────────────────────────────────

export function ToolForm({ toolKey, schema, onSubmit, onSuccess, defaultValues, submitLabel, disabled, disabledLabel }: ToolFormProps) {
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
        return { ...resolvedDefaults, ...parsed, ...(resolvedDefaults.topic ? { topic: resolvedDefaults.topic } : {}) };
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
  const errors = rawErrors;

  // Debounced LS write on every input change (D-031 · input change → LS · not submit-only)
  const watchedValues = watch();
  useEffect(() => {
    if (accountId === null) return;
    const handler = setTimeout(() => {
      try {
        localStorage.setItem(getToolLsKey(accountId, toolKey, 'input'), JSON.stringify(watchedValues));
      } catch {
        // Storage full
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [watchedValues, accountId, toolKey]);

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

    const loadingToastId = toast.loading('生成中...');
    setIsPending(true);
    try {
      const result = await onSubmit(data);
      if (!abortRef.current.signal.aborted) {
        toast.dismiss(loadingToastId);
        onSuccess?.(result);
      }
    } catch {
      if (!abortRef.current.signal.aborted) {
        // REJ-035: DB fail → LS 保留 + toast.error
        toast.dismiss(loadingToastId);
        toast.error('生成失败 · 请稍后再试');
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
        disabled={isPending || disabled}
        className="w-full sm:w-auto"
      >
        {isPending ? '生成中…' : (disabled ? (disabledLabel ?? submitLabel ?? '开始生成') : (submitLabel ?? '开始生成'))}
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
            error={errors['elements']}
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
            error={errors['elements']}
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
            error={errors['elements']}
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

    case 'video-production':
      return (
        <>
          <div className="space-y-1.5">
            <label htmlFor="tool-vp-source-copy" className="text-body-sm font-medium text-on-surface">
              原始文案<span className="text-error ml-0.5">*</span>
            </label>
            <textarea
              id="tool-vp-source-copy"
              {...register('sourceCopy')}
              rows={8}
              className={cn(
                'flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y min-h-[120px]',
                errors['sourceCopy'] && 'border-error',
              )}
              placeholder="粘贴视频原始文案，生成完整短视频制作方案（10-3000字）"
              data-testid="tool-vp-source-copy"
            />
            {errors['sourceCopy'] && (
              <p className="text-body-xs text-error" role="alert">{errors['sourceCopy']?.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="tool-vp-video-type" className="text-body-sm font-medium text-on-surface">视频类型</label>
              <select
                id="tool-vp-video-type"
                {...register('videoType')}
                className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-testid="tool-vp-video-type"
              >
                <option value="">请选择类型</option>
                <option value="short_form">短视频</option>
                <option value="long_form">长视频</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tool-vp-duration" className="text-body-sm font-medium text-on-surface">视频时长</label>
              <select
                id="tool-vp-duration"
                {...register('duration')}
                className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-testid="tool-vp-duration"
              >
                <option value="">请选择时长</option>
                <option value="15s">15秒</option>
                <option value="30s">30秒</option>
                <option value="60s">60秒</option>
                <option value="180s">3分钟</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tool-vp-additional" className="text-body-sm font-medium text-on-surface">补充说明（可选）</label>
            <textarea
              id="tool-vp-additional"
              {...register('additionalContext')}
              rows={3}
              className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              placeholder="例如：主角为女性 / 需要口播形式 / 适合快剪风格"
              data-testid="tool-vp-additional"
            />
          </div>
        </>
      );

    case 'ai-video':
      return (
        <>
          <div className="space-y-1.5">
            <label htmlFor="tool-aiv-source-copy" className="text-body-sm font-medium text-on-surface">
              原始文案<span className="text-error ml-0.5">*</span>
            </label>
            <textarea
              id="tool-aiv-source-copy"
              {...register('sourceCopy')}
              rows={8}
              className={cn(
                'flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y min-h-[120px]',
                errors['sourceCopy'] && 'border-error',
              )}
              placeholder="粘贴视频文案，AI 自动生成分镜画面（10-3000字）"
              data-testid="tool-aiv-source-copy"
            />
            {errors['sourceCopy'] && (
              <p className="text-body-xs text-error" role="alert">{errors['sourceCopy']?.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="tool-aiv-scenes-count" className="text-body-sm font-medium text-on-surface">镜头数量</label>
              <select
                id="tool-aiv-scenes-count"
                {...register('scenesCount')}
                className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-testid="tool-aiv-scenes-count"
              >
                <option value="5">5 镜头</option>
                <option value="6">6 镜头</option>
                <option value="7">7 镜头</option>
                <option value="8">8 镜头</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tool-aiv-image-style" className="text-body-sm font-medium text-on-surface">图片风格</label>
              <select
                id="tool-aiv-image-style"
                {...register('imageStyle')}
                className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-testid="tool-aiv-image-style"
              >
                <option value="natural">自然风格</option>
                <option value="vivid">鲜艳风格</option>
              </select>
            </div>
          </div>
        </>
      );

    case 'acquisition-video':
      return (
        <>
          <div className="space-y-1.5">
            <label htmlFor="tool-av-source-copy" className="text-body-sm font-medium text-on-surface">
              原始文案<span className="text-error ml-0.5">*</span>
            </label>
            <textarea
              id="tool-av-source-copy"
              {...register('sourceCopy')}
              rows={8}
              className={cn(
                'flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y min-h-[120px]',
                errors['sourceCopy'] && 'border-error',
              )}
              placeholder="粘贴视频原始文案，生成转化导向的获客视频脚本（10-3000字）"
              data-testid="tool-av-source-copy"
            />
            {errors['sourceCopy'] && (
              <p className="text-body-xs text-error" role="alert">{errors['sourceCopy']?.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tool-av-conversion-goal" className="text-body-sm font-medium text-on-surface">
              转化目标<span className="text-error ml-0.5">*</span>
            </label>
            <input
              id="tool-av-conversion-goal"
              {...register('conversionGoal')}
              className={cn(
                'flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                errors['conversionGoal'] && 'border-error',
              )}
              placeholder="例如：引导私信 / 扫码进群 / 点击链接购买"
              data-testid="tool-av-conversion-goal"
            />
            {errors['conversionGoal'] && (
              <p className="text-body-xs text-error" role="alert">{errors['conversionGoal']?.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="tool-av-platform" className="text-body-sm font-medium text-on-surface">发布平台（可选）</label>
              <select
                id="tool-av-platform"
                {...register('platform')}
                className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-testid="tool-av-platform"
              >
                <option value="">请选择平台</option>
                <option value="douyin">抖音</option>
                <option value="xiaohongshu">小红书</option>
                <option value="wechat_video">微信视频号</option>
                <option value="bilibili">B站</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tool-av-duration" className="text-body-sm font-medium text-on-surface">视频时长（可选）</label>
              <select
                id="tool-av-duration"
                {...register('duration')}
                className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-testid="tool-av-duration"
              >
                <option value="">请选择时长</option>
                <option value="15s">15秒</option>
                <option value="30s">30秒</option>
                <option value="60s">60秒</option>
                <option value="180s">3分钟</option>
              </select>
            </div>
          </div>
        </>
      );

    case 'acquisition':
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
            error={errors['elements']}
            maxSelect={8}
          />
          <div className="space-y-1.5">
            <label htmlFor="tool-acq-conversion-goal" className="text-body-sm font-medium text-on-surface">
              转化目标<span className="text-error ml-0.5">*</span>
            </label>
            <input
              id="tool-acq-conversion-goal"
              {...register('conversionGoal')}
              className={cn(
                'flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                errors['conversionGoal'] && 'border-error',
              )}
              placeholder="例如：关注公众号 / 私信咨询 / 点击购买链接"
              data-testid="tool-acq-conversion-goal"
            />
            {errors['conversionGoal'] && (
              <p className="text-body-xs text-error" role="alert">{errors['conversionGoal']?.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tool-acq-topic" className="text-body-sm font-medium text-on-surface">
              话题方向<span className="text-error ml-0.5">*</span>
            </label>
            <input
              id="tool-acq-topic"
              {...register('topic')}
              className={cn(
                'flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                errors['topic'] && 'border-error',
              )}
              placeholder="例如：理财入门 / 职场晋升 / 健康养生"
              data-testid="tool-acq-topic"
            />
            {errors['topic'] && (
              <p className="text-body-xs text-error" role="alert">{errors['topic']?.message}</p>
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
    case 'video-production':
      return { sourceCopy: '', videoType: '', duration: '', additionalContext: '' };
    case 'acquisition-video':
      return { sourceCopy: '', conversionGoal: '', platform: '', duration: '' };
    case 'ai-video':
      return { sourceCopy: '', scenesCount: '5', imageStyle: 'natural' };
    case 'acquisition':
      return { scriptType: '', elements: [], conversionGoal: '', topic: '' };
    default:
      return {};
  }
}
