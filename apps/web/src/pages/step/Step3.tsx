import { type FormEvent, useEffect, useState } from 'react';

import { LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  STEP3_CTA_DISABLED_HINT,
  STEP3_CTA_LABEL,
  STEP3_FORM,
  STEP3_H1,
  STEP3_LOADING_TEXT,
  STEP3_PLATFORMS_5,
  STEP3_STEP_TAG,
  STEP3_SUBTITLE_TEMPLATE,
} from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

const LS_STEP1 = 'acc_step1';
const LS_STEP3 = 'acc_step3';

function readStep1IndustryLabel(): string {
  try {
    const raw = localStorage.getItem(LS_STEP1);
    if (raw) {
      const parsed = JSON.parse(raw) as { industryLabel?: string };
      return parsed.industryLabel ?? '(未选择)';
    }
  } catch {
    // ignore parse errors
  }
  return '(未选择)';
}

interface Step3Saved {
  input?: {
    personalInfo?: string;
    platform?: string;
    audience?: string;
    accountStatus?: string;
  };
}

function readStep3Saved(): Step3Saved | null {
  try {
    const raw = localStorage.getItem(LS_STEP3);
    if (raw) return JSON.parse(raw) as Step3Saved;
  } catch {
    // ignore parse errors
  }
  return null;
}

export default function Step3() {
  const [personalInfo, setPersonalInfo] = useState('');
  const [platform, setPlatform] = useState('');
  const [audience, setAudience] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const industryLabel = readStep1IndustryLabel();
  const subtitle = STEP3_SUBTITLE_TEMPLATE.replace('{industry}', industryLabel);
  const isCtaDisabled = !personalInfo.trim() || !platform || isLoading;

  useEffect(() => {
    const saved = readStep3Saved();
    if (saved?.input) {
      setPersonalInfo(saved.input.personalInfo ?? '');
      setPlatform(saved.input.platform ?? '');
      setAudience(saved.input.audience ?? '');
      setAccountStatus(saved.input.accountStatus ?? '');
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isCtaDisabled) return;

    setIsLoading(true);
    await new Promise<void>((r) => setTimeout(r, 1500));

    const mockResult = {
      videoReferences:
        '【AI 生成占位】本行业爆款视频参考案例（3 条），包含标题、描述及搜索词推荐...',
      nickname:
        '【AI 生成占位】5 个备选昵称：① 专业型 ② 人设型 ③ 记忆点型 ④ 品牌型 ⑤ 情感型，含命名策略与平台调整建议...',
      avatar:
        '【AI 生成占位】头像设计方案：风格 / 配色 / 表情 / 必含元素 / 禁忌 / AI 绘图 prompt...',
      background:
        '【AI 生成占位】背景图设计方案：风格 / 布局 / 配色 / 文案 / 三平台尺寸适配 / AI 绘图 prompt...',
      bio: '【AI 生成占位】简介文案方案：简介公式 + 6 个版本（3 平台 × 主号副号）+ SEO 关键词...',
      strategy:
        '【AI 生成占位】整体包装策略：视觉一致性 / 第一印象 / 转化路径 / 平台优先级建议...',
    };

    localStorage.setItem(
      LS_STEP3,
      JSON.stringify({ input: { personalInfo, platform, audience, accountStatus }, result: mockResult }),
    );

    setIsLoading(false);
    document.getElementById('step3-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="flex-1 container py-8">
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP3_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP3_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* personalInfo — Textarea, required */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP3_FORM.personalInfo.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            required
            value={personalInfo}
            onChange={(e) => setPersonalInfo(e.target.value)}
            placeholder={STEP3_FORM.personalInfo.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[160px] font-cn resize-y"
          />
        </div>

        {/* platform — RadioGroup, required */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP3_FORM.platform.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {STEP3_PLATFORMS_5.map((p) => (
              <label
                key={p.id}
                htmlFor={p.id}
                className={cn(
                  'glass-card rounded-lg p-3 flex flex-col items-center text-center cursor-pointer transition-colors',
                  platform === p.id ? 'border-primary/60 bg-primary/10' : 'hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  id={p.id}
                  name="platform"
                  value={p.id}
                  checked={platform === p.id}
                  onChange={() => setPlatform(p.id)}
                  className="sr-only"
                />
                <span className="text-body-sm font-cn text-on-surface">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* audience — Input, optional */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP3_FORM.audience.label}
          </label>
          <Input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder={STEP3_FORM.audience.placeholder}
          />
        </div>

        {/* accountStatus — Input, optional */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP3_FORM.accountStatus.label}
          </label>
          <Input
            value={accountStatus}
            onChange={(e) => setAccountStatus(e.target.value)}
            placeholder={STEP3_FORM.accountStatus.placeholder}
          />
        </div>

        {/* Main CTA */}
        <div>
          <Button
            type="submit"
            disabled={isCtaDisabled}
            className={cn('w-full', !isCtaDisabled && 'bg-gradient-to-r from-primary to-primary/80')}
          >
            {isLoading ? STEP3_LOADING_TEXT : STEP3_CTA_LABEL}
          </Button>
          {isCtaDisabled && !isLoading && (
            <p className="text-body-sm text-muted-foreground text-center mt-2">
              {STEP3_CTA_DISABLED_HINT}
            </p>
          )}
        </div>
      </form>

      {/* Loading indicator while generating */}
      {isLoading && (
        <div className="mt-8">
          <LoadingState text={STEP3_LOADING_TEXT} size="lg" />
        </div>
      )}

      {/* Output anchor — US-006b renders result here */}
      <div id="step3-output" />
    </main>
  );
}
