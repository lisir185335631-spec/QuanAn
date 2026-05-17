import { type FormEvent, useEffect, useState } from 'react';

import { LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  STEP8_BUTTON_GENERATE_PLAN,
  STEP8_EXPERIENCE_3,
  STEP8_EXPERIENCE_RADIO_LABEL,
  STEP8_GENERATE_LOADING_TEXT,
  STEP8_GENERATE_PLAN_INPUT,
  STEP8_GENERATE_PLAN_TEXTAREA,
  STEP8_OUTPUT_MODULES_6,
  STEP8_PLATFORM_RADIO_LABEL,
  STEP8_PLATFORMS_5,
  type Step8GeneratePlanResult,
} from '@/lib/constants/step8';
import { cn } from '@/lib/utils';

const LS_STEP8 = 'acc_step8';

export interface Step8GeneratePlanFormData {
  productInfo: string;
  targetAudience: string;
  platform: string;
  experience: string;
}

interface Step8LsShape {
  sub_function: string;
  formData?: Step8GeneratePlanFormData;
  generate_plan?: Step8GeneratePlanResult;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-container p-4">
      <p className="text-body-xs font-label text-primary uppercase tracking-wide mb-2">{label}</p>
      <p className="text-body-sm text-on-surface whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function generateMockResult(formData: Step8GeneratePlanFormData): Step8GeneratePlanResult {
  const product = formData.productInfo.slice(0, 15) || '你的产品';
  const audience = formData.targetAudience || '目标受众';
  return {
    opening: `大家好！欢迎来到直播间～今天带来超好用的${product}，专为${audience}打造。先点关注，好东西一个不错过！接下来 60 分钟我会亲身演示，教你如何用它解决最核心的痛点。`,
    interaction: `来的宝宝扣 1！告诉我你们最想了解哪个功能？新进来的宝宝别急，马上重播一遍核心内容。老粉帮我欢迎新朋友！互动起来气氛才好！`,
    deal: `限时福利来了！直播间专属价，今天只需这个价，还有赠品包邮！拍下联系客服备注直播间，48 小时内发货。先到先得，库存有限！`,
    closing: `今天直播到这里，感谢所有陪伴的宝宝们！已下单的放心，48 小时内发货。没下单的先点关注，每周三、周六固定直播，下次还有更多好货。感谢大家！`,
    traffic: `观看完整回放→主页置顶视频；下期预告已发朋友圈；邀请 3 个好友关注，私信"${product}"获取专属资料包；搜索"${audience}推荐"找到我们。`,
    engagement: `每整点发福利抽奖，扣"想要"参与；限时问答答对送优惠券；说出你最大困扰主播现场解答；结尾连麦 3 位幸运观众随机赠礼。`,
  };
}

interface Props {
  subfunctionKey: string;
}

export function Step8GeneratePlan({ subfunctionKey }: Props) {
  const [productInfo, setProductInfo] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] = useState<string>(STEP8_PLATFORMS_5[0]!.id);
  const [experience, setExperience] = useState<string>(STEP8_EXPERIENCE_3[0]!.key);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Step8GeneratePlanResult | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_STEP8);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Step8LsShape;
      if (parsed.sub_function !== subfunctionKey) return;
      if (parsed.formData) {
        const fd = parsed.formData;
        if (fd.productInfo) setProductInfo(fd.productInfo);
        if (fd.targetAudience) setTargetAudience(fd.targetAudience);
        if (fd.platform) setPlatform(fd.platform);
        if (fd.experience) setExperience(fd.experience);
      }
      if (parsed.generate_plan) setResult(parsed.generate_plan);
    } catch {
      // ignore parse errors
    }
  }, [subfunctionKey]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsGenerating(true);
    const formData: Step8GeneratePlanFormData = { productInfo, targetAudience, platform, experience };
    const delay = 3000 + Math.random() * 2000;
    await new Promise<void>((r) => setTimeout(r, delay));
    const mockResult = generateMockResult(formData);
    const lsData: Step8LsShape = {
      sub_function: subfunctionKey,
      formData,
      generate_plan: mockResult,
    };
    localStorage.setItem(LS_STEP8, JSON.stringify(lsData));
    setResult(mockResult);
    setIsGenerating(false);
    document.getElementById('step8-generate-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={(e) => { void handleSubmit(e); }}
        className="glass-card rounded-xl p-6 space-y-4 max-w-2xl"
      >
        {/* Product textarea */}
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

        {/* Audience input */}
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

        {/* Platform radio */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_PLATFORM_RADIO_LABEL}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {STEP8_PLATFORMS_5.map((p) => (
              <label
                key={p.id}
                htmlFor={`step8-platform-${p.id}`}
                className={cn(
                  'glass-card rounded-lg p-3 flex flex-col items-center text-center cursor-pointer transition-colors',
                  platform === p.id
                    ? 'border-primary/60 bg-primary/10'
                    : 'hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  id={`step8-platform-${p.id}`}
                  name="step8-platform"
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

        {/* Experience radio */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_EXPERIENCE_RADIO_LABEL}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STEP8_EXPERIENCE_3.map((exp) => (
              <label
                key={exp.key}
                htmlFor={`step8-experience-${exp.key}`}
                className={cn(
                  'glass-card rounded-lg p-3 flex items-center cursor-pointer transition-colors',
                  experience === exp.key
                    ? 'border-primary/60 bg-primary/10'
                    : 'hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  id={`step8-experience-${exp.key}`}
                  name="step8-experience"
                  value={exp.key}
                  checked={experience === exp.key}
                  onChange={() => setExperience(exp.key)}
                  className="sr-only"
                />
                <span className="text-body-sm font-cn text-on-surface">{exp.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button type="submit" disabled={isGenerating} className="w-full sm:w-auto">
          {STEP8_BUTTON_GENERATE_PLAN}
        </Button>
      </form>

      {/* Loading */}
      {isGenerating && <LoadingState text={STEP8_GENERATE_LOADING_TEXT} />}

      {/* Output: 6 modules */}
      {result && !isGenerating && (
        <div id="step8-generate-output" className="space-y-6">
          {STEP8_OUTPUT_MODULES_6.map((module) => (
            <div key={module.id}>
              <h3 className="text-h3 font-display text-on-surface mb-3">{module.h3Label}</h3>
              <InfoCard label={module.h3Label} value={result[module.id]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
