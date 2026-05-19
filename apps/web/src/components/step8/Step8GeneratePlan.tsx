import { type FormEvent, useState } from 'react';

import { PlatformInlineRadio } from '@/components/inline-pickers/PlatformInlineRadio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStepData } from '@/hooks/useStepData';
import {
  STEP8_BUTTON_GENERATE_PLAN,
  STEP8_EXPERIENCE_RADIO_LABEL,
  STEP8_EXPERIENCES_3,
  STEP8_GENERATE_PLAN_INPUT,
  STEP8_GENERATE_PLAN_TEXTAREA,
  STEP8_OUTPUT_MODULES_6,
  STEP8_PLATFORM_RADIO_LABEL,
} from '@/lib/constants/step8';
import { cn } from '@/lib/utils';

// Static stub content for 6 output modules (AC-5)
const STUB_PLAN: Record<string, string> = {
  opening:
    '大家好！欢迎来到今天的直播间，我是你们的主播小Q，今天将为大家带来超值分享，记得点关注不迷路！',
  interaction:
    '现在来个小互动！评论区扣 1 告诉我你最想了解哪个方面，我会在直播中逐一为大家解答，最积极的朋友会有惊喜～',
  deal: '现在下单享受直播间专属价格，比日常价优惠 30%，今天仅限直播间！手速快的朋友赶紧下单，库存有限哦！',
  closing:
    '感谢大家今天的陪伴，你们的支持是我最大的动力！记得关注主页，明天同一时间我们继续，爱你们！',
  traffic:
    '点击主页置顶链接获取完整资料包，扫码加入粉丝专属群，第一时间获取优惠信息和福利活动通知！',
  engagement:
    '每 15 分钟进行一次抽奖互动，参与方式：评论区留言 + 转发直播，获奖名单将在直播结束后公布！',
};

interface Props {
  accountId: number | null;
}

export function Step8GeneratePlan({ accountId }: Props) {
  const [productInfo, setProductInfo] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { save, isSaving } = useStepData(accountId, 'step8');

  // AC-4 · disabled if !product || !platform || !experience
  const submitDisabled = !productInfo || !platform || !experience || isSaving;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled) return;
    save({
      sub_function: 'generate_plan',
      productInfo,
      targetAudience,
      platform,
      experience,
    });
    setSubmitted(true);
    document.getElementById('step8-generate-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-xl p-6 space-y-4 max-w-2xl"
      >
        {/* (1) Product textarea — AC-4 required */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_GENERATE_PLAN_TEXTAREA.label}
          </label>
          <textarea
            value={productInfo}
            onChange={(e) => setProductInfo(e.target.value)}
            placeholder={STEP8_GENERATE_PLAN_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] font-cn resize-y"
          />
        </div>

        {/* (2) Audience input */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_GENERATE_PLAN_INPUT.label}
          </label>
          <Input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder={STEP8_GENERATE_PLAN_INPUT.placeholder}
          />
        </div>

        {/* (3) Platform radio — AC-4 use <PlatformInlineRadio> */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_PLATFORM_RADIO_LABEL}
          </label>
          <PlatformInlineRadio value={platform} onChange={setPlatform} />
        </div>

        {/* (4) Experience radio — AC-4 3 buttons dual-line label+subtitle */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_EXPERIENCE_RADIO_LABEL}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STEP8_EXPERIENCES_3.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => setExperience(exp.id)}
                className={cn(
                  'glass-card rounded-lg p-3 flex flex-col items-start text-left transition-colors',
                  experience === exp.id
                    ? 'border-primary bg-primary/10'
                    : 'hover:border-primary/40',
                )}
              >
                <span className="text-body-sm font-label text-on-surface">{exp.label}</span>
                <span className="text-body-xs text-muted-foreground">{exp.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CTA · AC-4 disabled if !product || !platform || !experience */}
        <Button type="submit" disabled={submitDisabled} className="w-full sm:w-auto">
          {STEP8_BUTTON_GENERATE_PLAN}
        </Button>
      </form>

      {/* AC-5 · stub 6 H3 output after form submit */}
      {submitted && (
        <div id="step8-generate-output" className="space-y-6">
          {STEP8_OUTPUT_MODULES_6.map((module) => (
            <div key={module.id} className="glass-card rounded-xl p-6">
              <h3 className="text-h3 font-display text-on-surface mb-3">{module.h3Label}</h3>
              <p className="text-body-sm text-muted-foreground whitespace-pre-wrap">
                {STUB_PLAN[module.id] ?? ''}
              </p>
            </div>
          ))}
          {/* AC-9 · 3 stub action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" type="button">
              复制全部
            </Button>
            <Button variant="outline" type="button">
              导出 PDF
            </Button>
            <Button variant="outline" type="button" onClick={() => setSubmitted(false)}>
              重新生成
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
