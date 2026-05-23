import type { FormEvent } from 'react';

import { SparkleIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  STEP3_FORM,
  STEP3_TEXTAREA_PLACEHOLDER,
  STEP3_TARGET_AUDIENCE_PLACEHOLDER,
  STEP3_ACCOUNT_STATUS_PLACEHOLDER,
  STEP3_CTA_PRIMARY,
  STEP3_CTA_REGENERATE,
  STEP3_CTA_LOADING,
} from '@/lib/constants/step3';
import { cn } from '@/lib/utils';
import { PlatformRadioGroup } from './PlatformRadioGroup';

export interface Step3FormProps {
  personalInfo: string;
  onPersonalInfoChange: (v: string) => void;
  platform: string;
  onPlatformChange: (v: string) => void;
  audience: string;
  onAudienceChange: (v: string) => void;
  accountStatus: string;
  onAccountStatusChange: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onRegenerate?: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export function Step3Form({
  personalInfo,
  onPersonalInfoChange,
  platform,
  onPlatformChange,
  audience,
  onAudienceChange,
  accountStatus,
  onAccountStatusChange,
  onSubmit,
  onRegenerate,
  isLoading,
  isDisabled,
}: Step3FormProps) {
  return (
    <SubCard>
      <form onSubmit={onSubmit} className="space-y-5">
        {/* personalInfo textarea */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP3_FORM.personalInfo.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            required
            value={personalInfo}
            onChange={(e) => onPersonalInfoChange(e.target.value)}
            placeholder={STEP3_TEXTAREA_PLACEHOLDER}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[160px] font-cn resize-y"
          />
        </div>

        {/* platform — PlatformRadioGroup */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP3_FORM.platform.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <PlatformRadioGroup value={platform} onChange={onPlatformChange} disabled={isLoading} />
        </div>

        {/* 目标受众 */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP3_FORM.audience.label}
          </label>
          <Input
            value={audience}
            onChange={(e) => onAudienceChange(e.target.value)}
            placeholder={STEP3_TARGET_AUDIENCE_PLACEHOLDER}
          />
        </div>

        {/* 现有账号情况 */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP3_FORM.accountStatus.label}
          </label>
          <Input
            value={accountStatus}
            onChange={(e) => onAccountStatusChange(e.target.value)}
            placeholder={STEP3_ACCOUNT_STATUS_PLACEHOLDER}
          />
        </div>

        {/* CTA row: 主 CTA + 右侧 重新生成 */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isDisabled || isLoading}
            className={cn(
              'flex-1 gap-2',
              !(isDisabled || isLoading) && 'bg-gradient-to-r from-primary to-primary/80',
            )}
          >
            {isLoading ? (
              <span>{STEP3_CTA_LOADING}</span>
            ) : (
              <>
                <SparkleIcon className="h-4 w-4" size={4} />
                <span>{STEP3_CTA_PRIMARY}</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onRegenerate}
            disabled={isLoading}
          >
            {STEP3_CTA_REGENERATE}
          </Button>
        </div>
      </form>
    </SubCard>
  );
}
