/**
 * StepForm — generic 9-step form wrapper (PRD-4 US-011)
 * Uses react-hook-form + @hookform/resolvers/zod.
 * Renders step-specific fields via stepKey switch.
 * LS-first dual-write: writes localStorage before DB (REJ-010, REJ-035).
 * AbortController cleanup on unmount prevents state pollution (AC-11).
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ZodTypeAny } from 'zod';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { stepLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

import { CategorySelect } from './CategorySelect';
import { IndustrySelect } from './IndustrySelect';
import { PlatformSelect } from './PlatformSelect';
import { TextareaField } from './TextareaField';

// ── Hot element display data for step7 ───────────────────────────────────────
const HOT_ELEMENTS = [
  { key: 'greed', label: '贪念' }, { key: 'fear', label: '恐惧' },
  { key: 'curiosity', label: '猎奇' }, { key: 'contrast', label: '反差' },
  { key: 'worst', label: '最差' }, { key: 'leverage', label: '借势' },
  { key: 'resonance', label: '共鸣' }, { key: 'empathy', label: '共情' },
  { key: 'small_big', label: '以小搏大' }, { key: 'low_cost_high', label: '低成本高回报' },
  { key: 'low_cost_unknown', label: '低成本未知回报' }, { key: 'anger', label: '愤怒' },
  { key: 'surprise', label: '惊喜' }, { key: 'trend', label: '热点' },
  { key: 'controversy', label: '争议' }, { key: 'reveal', label: '揭秘' },
  { key: 'list', label: '清单' }, { key: 'challenge', label: '挑战' },
  { key: 'transformation', label: '蜕变' }, { key: 'scarcity', label: '稀缺' },
  { key: 'social_proof', label: '社会证明' }, { key: 'authority', label: '权威' },
  { key: 'benefit', label: '利益' },
] as const;

const SCRIPT_TYPES = [
  { key: 'opinion', label: '聊观点' }, { key: 'process', label: '晒过程' },
  { key: 'knowledge', label: '教知识' }, { key: 'story', label: '讲故事' },
  { key: 'comedy', label: '尬段子' }, { key: 'product', label: '说产品' },
  { key: 'review', label: '做测评' }, { key: 'expose', label: '揭内幕' },
  { key: 'challenge', label: '做挑战' }, { key: 'interview', label: '做采访' },
  { key: 'daily', label: '日常记录' }, { key: 'transform', label: '变身对比' },
  { key: 'debate', label: '辩论对话' }, { key: 'list', label: '合集盘点' },
  { key: 'reaction', label: '跟拍反应' }, { key: 'qna', label: '问答互动' },
  { key: 'collab', label: '联动合作' }, { key: 'behind', label: '幕后花絮' },
  { key: 'trend_news', label: '趋势解读' }, { key: 'motivation', label: '励志鸡汤' },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────

interface StepFormProps {
  stepKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodTypeAny;
}

// ── StepForm ──────────────────────────────────────────────────────────────────

export function StepForm({ stepKey, schema }: StepFormProps) {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const saveMutation = trpc.stepData.save.useMutation();

  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  const [submitted, setSubmitted] = useState(false);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(stepKey),
  });

  const { setValue, watch } = form;

  const onSubmit = form.handleSubmit(async (data) => {
    if (abortRef.current.signal.aborted) return;

    // REJ-010: LS key must have acc_{id} prefix — write before DB
    if (accountId !== null) {
      try {
        localStorage.setItem(stepLsKey(accountId, stepKey), JSON.stringify(data));
      } catch {
        // Storage full — continue to DB write
      }
    }

    try {
      await saveMutation.mutateAsync({ stepKey, inputs: data });
      if (!abortRef.current.signal.aborted) {
        setSubmitted(true);
      }
    } catch {
      if (!abortRef.current.signal.aborted) {
        toast.error('生成失败 · 请重试');
      }
    }
  });

  if (submitted) {
    return (
      <div
        className="max-w-2xl rounded-lg border border-border bg-surface-container p-8 text-center"
        data-testid="submit-success"
      >
        <p className="text-body-lg font-medium text-on-surface">提交成功</p>
        <p className="mt-2 text-body-sm text-muted-foreground">AI 正在分析，结果将在下方显示</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl space-y-6"
      data-testid={`step-form-${stepKey}`}
      noValidate
    >
      {renderStepFields(stepKey, form, watch, setValue)}

      <Button
        type="submit"
        disabled={saveMutation.isPending}
        className="w-full sm:w-auto"
      >
        {saveMutation.isPending ? '生成中…' : '开始生成'}
      </Button>
    </form>
  );
}

// ── Field renderer (switch on stepKey) ───────────────────────────────────────

function renderStepFields(
  stepKey: string,
  form: ReturnType<typeof useForm<Record<string, unknown>>>,
  watch: ReturnType<typeof useForm<Record<string, unknown>>>['watch'],
  setValue: ReturnType<typeof useForm<Record<string, unknown>>>['setValue'],
) {
  const { formState: { errors }, register } = form;

  switch (stepKey) {
    case 'step1':
      return (
        <IndustrySelect
          value={(watch('lastIndustry') as string) ?? ''}
          onChange={(v) => setValue('lastIndustry', v, { shouldValidate: true })}
          error={errors['lastIndustry'] as import('react-hook-form').FieldError | undefined}
        />
      );

    case 'step3':
      return (
        <>
          <PlatformSelect
            value={(watch('lastPlatform') as string) ?? ''}
            onChange={(v) => setValue('lastPlatform', v, { shouldValidate: true })}
            error={errors['lastPlatform'] as import('react-hook-form').FieldError | undefined}
          />
          <TextareaField
            label="个人信息"
            value={(watch('lastPersonalInfo') as string) ?? ''}
            onChange={(v) => setValue('lastPersonalInfo', v, { shouldValidate: true })}
            error={errors['lastPersonalInfo'] as import('react-hook-form').FieldError | undefined}
            placeholder="描述你的职业、背景、经历（至少20字）"
            rows={4}
            required
          />
          <TextareaField
            label="目标受众"
            value={(watch('lastTargetAudience') as string) ?? ''}
            onChange={(v) => setValue('lastTargetAudience', v, { shouldValidate: true })}
            error={errors['lastTargetAudience'] as import('react-hook-form').FieldError | undefined}
            placeholder="描述你的目标受众（至少5字）"
            rows={2}
            required
          />
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">当前账号状态</label>
            <input
              {...register('lastCurrentAccount')}
              className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="新账号"
            />
          </div>
        </>
      );

    case 'step3b':
      return (
        <>
          <PlatformSelect
            value={(watch('lastPlatform') as string) ?? ''}
            onChange={(v) => setValue('lastPlatform', v, { shouldValidate: true })}
            error={errors['lastPlatform'] as import('react-hook-form').FieldError | undefined}
          />
          <TextareaField
            label="详细个人信息"
            value={(watch('lastPersonalInfo') as string) ?? ''}
            onChange={(v) => setValue('lastPersonalInfo', v, { shouldValidate: true })}
            error={errors['lastPersonalInfo'] as import('react-hook-form').FieldError | undefined}
            placeholder="详细描述你的职业、背景、经历（至少50字）"
            rows={5}
            required
          />
          <TextareaField
            label="目标受众"
            value={(watch('lastTargetAudience') as string) ?? ''}
            onChange={(v) => setValue('lastTargetAudience', v, { shouldValidate: true })}
            error={errors['lastTargetAudience'] as import('react-hook-form').FieldError | undefined}
            placeholder="描述你的目标受众"
            rows={2}
          />
          <TextareaField
            label="个人优势"
            value={(watch('lastStrengths') as string) ?? ''}
            onChange={(v) => setValue('lastStrengths', v, { shouldValidate: true })}
            error={errors['lastStrengths'] as import('react-hook-form').FieldError | undefined}
            placeholder="你有哪些独特优势？"
            rows={2}
          />
          <TextareaField
            label="个人故事"
            value={(watch('lastStory') as string) ?? ''}
            onChange={(v) => setValue('lastStory', v, { shouldValidate: true })}
            error={errors['lastStory'] as import('react-hook-form').FieldError | undefined}
            placeholder="分享一个能体现你价值观的故事"
            rows={4}
          />
        </>
      );

    case 'step4':
      return (
        <>
          <PlatformSelect
            value={(watch('lastPlatform') as string) ?? ''}
            onChange={(v) => setValue('lastPlatform', v, { shouldValidate: true })}
            error={errors['lastPlatform'] as import('react-hook-form').FieldError | undefined}
          />
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">
              当前粉丝数量<span className="text-error ml-0.5">*</span>
            </label>
            <Select
              value={(watch('lastFollowers') as string) || undefined}
              onValueChange={(v) => setValue('lastFollowers', v, { shouldValidate: true })}
            >
              <SelectTrigger className={errors['lastFollowers'] ? 'border-error' : ''}>
                <SelectValue placeholder="请选择粉丝量级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-1000">0–1千</SelectItem>
                <SelectItem value="1000-10000">1千–1万</SelectItem>
                <SelectItem value="10000-100000">1万–10万</SelectItem>
                <SelectItem value="100000+">10万+</SelectItem>
              </SelectContent>
            </Select>
            {errors['lastFollowers'] && (
              <p className="text-body-xs text-error" role="alert">
                {(errors['lastFollowers'] as import('react-hook-form').FieldError).message}
              </p>
            )}
          </div>
          <TextareaField
            label="个人信息"
            value={(watch('lastPersonalInfo') as string) ?? ''}
            onChange={(v) => setValue('lastPersonalInfo', v, { shouldValidate: true })}
            error={errors['lastPersonalInfo'] as import('react-hook-form').FieldError | undefined}
            placeholder="详细描述你的背景和现状（至少50字）"
            rows={4}
            required
          />
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">
              当前目标<span className="text-error ml-0.5">*</span>
            </label>
            <Select
              value={(watch('lastGoals') as string) || undefined}
              onValueChange={(v) => setValue('lastGoals', v, { shouldValidate: true })}
            >
              <SelectTrigger className={errors['lastGoals'] ? 'border-error' : ''}>
                <SelectValue placeholder="请选择目标阶段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">从零起号</SelectItem>
                <SelectItem value="monetize">开始变现</SelectItem>
                <SelectItem value="scale">规模增长</SelectItem>
                <SelectItem value="reposition">重新定位</SelectItem>
              </SelectContent>
            </Select>
            {errors['lastGoals'] && (
              <p className="text-body-xs text-error" role="alert">
                {(errors['lastGoals'] as import('react-hook-form').FieldError).message}
              </p>
            )}
          </div>
        </>
      );

    case 'step4b':
      return (
        <>
          <TextareaField
            label="产品/服务描述"
            value={(watch('lastProductDesc') as string) ?? ''}
            onChange={(v) => setValue('lastProductDesc', v, { shouldValidate: true })}
            error={errors['lastProductDesc'] as import('react-hook-form').FieldError | undefined}
            placeholder="描述你的产品或服务（至少20字）"
            rows={4}
            required
          />
          <TextareaField
            label="目标受众"
            value={(watch('lastTargetAudience') as string) ?? ''}
            onChange={(v) => setValue('lastTargetAudience', v, { shouldValidate: true })}
            error={errors['lastTargetAudience'] as import('react-hook-form').FieldError | undefined}
            placeholder="描述你的目标买家"
            rows={2}
          />
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">IP 定位</label>
            <input
              {...register('lastIpPositioning')}
              className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="你的IP定位方向"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">
              当前营收<span className="text-error ml-0.5">*</span>
            </label>
            <Select
              value={(watch('lastCurrentRevenue') as string) || undefined}
              onValueChange={(v) => setValue('lastCurrentRevenue', v, { shouldValidate: true })}
            >
              <SelectTrigger className={errors['lastCurrentRevenue'] ? 'border-error' : ''}>
                <SelectValue placeholder="请选择营收范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_revenue">尚未变现</SelectItem>
                <SelectItem value="10万以下">10万以下</SelectItem>
                <SelectItem value="10-30万">10–30万</SelectItem>
                <SelectItem value="30-100万">30–100万</SelectItem>
                <SelectItem value="100万+">100万+</SelectItem>
              </SelectContent>
            </Select>
            {errors['lastCurrentRevenue'] && (
              <p className="text-body-xs text-error" role="alert">
                {(errors['lastCurrentRevenue'] as import('react-hook-form').FieldError).message}
              </p>
            )}
          </div>
        </>
      );

    case 'step5':
      return (
        <>
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">
              所属行业<span className="text-error ml-0.5">*</span>
            </label>
            <input
              {...register('lastIndustry')}
              className={cn(
                'flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                errors['lastIndustry'] && 'border-error',
              )}
              placeholder="例如：教育、美妆、健康"
            />
            {errors['lastIndustry'] && (
              <p className="text-body-xs text-error" role="alert">
                {(errors['lastIndustry'] as import('react-hook-form').FieldError).message}
              </p>
            )}
          </div>
          <TextareaField
            label="产品/服务"
            value={(watch('lastProduct') as string) ?? ''}
            onChange={(v) => setValue('lastProduct', v, { shouldValidate: true })}
            error={errors['lastProduct'] as import('react-hook-form').FieldError | undefined}
            placeholder="你的核心产品或服务是什么？（至少5字）"
            rows={3}
            required
          />
          <CategorySelect
            value={(watch('lastCategory') as string) ?? ''}
            onChange={(v) => setValue('lastCategory', v, { shouldValidate: true })}
            error={errors['lastCategory'] as import('react-hook-form').FieldError | undefined}
          />
        </>
      );

    case 'step6':
      return (
        <TextareaField
          label="原稿内容"
          value={(watch('lastSourceCopy') as string) ?? ''}
          onChange={(v) => setValue('lastSourceCopy', v, { shouldValidate: true })}
          error={errors['lastSourceCopy'] as import('react-hook-form').FieldError | undefined}
          placeholder="粘贴你的原始文案或脚本（至少50字）"
          rows={10}
          required
        />
      );

    case 'step7':
      return (
        <>
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">
              脚本类型<span className="text-error ml-0.5">*</span>
            </label>
            <Select
              value={(watch('lastScriptType') as string) || undefined}
              onValueChange={(v) => setValue('lastScriptType', v, { shouldValidate: true })}
            >
              <SelectTrigger className={errors['lastScriptType'] ? 'border-error' : ''}>
                <SelectValue placeholder="请选择脚本类型" />
              </SelectTrigger>
              <SelectContent>
                {SCRIPT_TYPES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors['lastScriptType'] && (
              <p className="text-body-xs text-error" role="alert">
                {(errors['lastScriptType'] as import('react-hook-form').FieldError).message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">爆款元素（最多5个）</label>
            <div className="grid grid-cols-3 gap-2">
              {HOT_ELEMENTS.map((el) => {
                const selected = ((watch('lastElements') as string[]) ?? []).includes(el.key);
                return (
                  <button
                    key={el.key}
                    type="button"
                    onClick={() => {
                      const current = ((watch('lastElements') as string[]) ?? []);
                      const next = selected
                        ? current.filter((k) => k !== el.key)
                        : current.length < 5 ? [...current, el.key] : current;
                      setValue('lastElements', next, { shouldValidate: true });
                    }}
                    className={cn(
                      'rounded-md border px-2 py-1 text-body-xs transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50',
                    )}
                  >
                    {el.label}
                  </button>
                );
              })}
            </div>
            {errors['lastElements'] && (
              <p className="text-body-xs text-error" role="alert">
                {(errors['lastElements'] as import('react-hook-form').FieldError).message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">
              话题方向<span className="text-error ml-0.5">*</span>
            </label>
            <input
              {...register('lastTopic')}
              className={cn(
                'flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                errors['lastTopic'] && 'border-error',
              )}
              placeholder="例如：减肥打卡 / 职场晋升 / 亲子教育"
            />
            {errors['lastTopic'] && (
              <p className="text-body-xs text-error" role="alert">
                {(errors['lastTopic'] as import('react-hook-form').FieldError).message}
              </p>
            )}
          </div>
        </>
      );

    case 'step8':
      return (
        <>
          <PlatformSelect
            value={(watch('lastPlatform') as string) ?? ''}
            onChange={(v) => setValue('lastPlatform', v, { shouldValidate: true })}
            error={errors['lastPlatform'] as import('react-hook-form').FieldError | undefined}
          />
          <TextareaField
            label="产品信息"
            value={(watch('lastProductInfo') as string) ?? ''}
            onChange={(v) => setValue('lastProductInfo', v, { shouldValidate: true })}
            error={errors['lastProductInfo'] as import('react-hook-form').FieldError | undefined}
            placeholder="描述你要直播销售的产品"
            rows={3}
          />
          <TextareaField
            label="目标受众"
            value={(watch('lastTargetAudience') as string) ?? ''}
            onChange={(v) => setValue('lastTargetAudience', v, { shouldValidate: true })}
            error={errors['lastTargetAudience'] as import('react-hook-form').FieldError | undefined}
            placeholder="描述你的直播目标观众"
            rows={2}
          />
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">
              直播经验<span className="text-error ml-0.5">*</span>
            </label>
            <Select
              value={(watch('lastExperience') as string) || undefined}
              onValueChange={(v) => setValue('lastExperience', v, { shouldValidate: true })}
            >
              <SelectTrigger className={errors['lastExperience'] ? 'border-error' : ''}>
                <SelectValue placeholder="请选择经验等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">新手（从未直播）</SelectItem>
                <SelectItem value="intermediate">进阶（有经验）</SelectItem>
                <SelectItem value="advanced">资深（月播10+场）</SelectItem>
              </SelectContent>
            </Select>
            {errors['lastExperience'] && (
              <p className="text-body-xs text-error" role="alert">
                {(errors['lastExperience'] as import('react-hook-form').FieldError).message}
              </p>
            )}
          </div>
        </>
      );

    default:
      return (
        <p className="text-body-sm text-muted-foreground">
          该步骤暂无需填写内容
        </p>
      );
  }
}

// ── Default values per stepKey ────────────────────────────────────────────────

function getDefaultValues(stepKey: string): Record<string, unknown> {
  switch (stepKey) {
    case 'step1':
      return { lastIndustry: '' };
    case 'step3':
      return { lastPlatform: '', lastPersonalInfo: '', lastTargetAudience: '', lastCurrentAccount: '新账号' };
    case 'step3b':
      return { lastPlatform: '', lastPersonalInfo: '', lastTargetAudience: '', lastStrengths: '', lastStory: '' };
    case 'step4':
      return { lastPlatform: '', lastFollowers: '', lastPersonalInfo: '', lastGoals: '' };
    case 'step4b':
      return { lastProductDesc: '', lastTargetAudience: '', lastIpPositioning: '', lastCurrentRevenue: '' };
    case 'step5':
      return { lastIndustry: '', lastProduct: '', lastCategory: '' };
    case 'step6':
      return { lastSourceCopy: '' };
    case 'step7':
      return { lastScriptType: '', lastElements: [], lastTopic: '' };
    case 'step8':
      return { lastPlatform: '', lastProductInfo: '', lastTargetAudience: '', lastExperience: '' };
    default:
      return {};
  }
}
