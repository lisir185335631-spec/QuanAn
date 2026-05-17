import { Copy, ImagePlus, RefreshCw } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import Step3OutputContent, {
  getBlockText,
  type Step3Result,
} from '@/components/step3/Step3OutputContent';
import { LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  STEP3_BUTTON_COPY,
  STEP3_BUTTON_GEN_IMAGE,
  STEP3_BUTTON_OPTIMIZE,
  STEP3_BUTTON_REGENERATE,
  STEP3_CTA_DISABLED_HINT,
  STEP3_CTA_LABEL,
  STEP3_FORM,
  STEP3_H1,
  STEP3_HEADER_BUTTON_COPY_ALL,
  STEP3_HEADER_BUTTON_REGEN_ALL,
  STEP3_LOADING_TEXT,
  STEP3_OUTPUT_H3_6,
  STEP3_PLATFORMS_5,
  STEP3_STEP_TAG,
  STEP3_SUBTITLE_TEMPLATE,
  type Step3OutputBlock,
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
  result?: Step3Result;
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

function generateMockResult(): Step3Result {
  return {
    videoReferences: {
      cards: [
        {
          title: '皮肤科医生说的护肤误区你踩了几个',
          description: '专业科普内容，以"打脸"方式颠覆用户认知，强互动高完播率。',
          keywords: ['护肤误区', '皮肤科', '科普'],
        },
        {
          title: '30岁后皮肤突然变差？这3个原因99%的人不知道',
          description: '痛点切入，提供深度解决方案，精准触达目标受众。',
          keywords: ['30岁护肤', '皮肤变差', '解决方案'],
        },
        {
          title: '我用这个方法帮300个客户修复了敏感肌',
          description: '案例分享，数字增强可信度，建立专业权威形象。',
          keywords: ['敏感肌修复', '皮肤管理', '客户案例'],
        },
      ],
    },
    nickname: {
      recommendations: ['皮肤科徐医生', '肌肤管理师小徐', '抗衰皮肤专家', '护肤真相馆', '医美级护肤指南'],
      strategy:
        '昵称需体现专业性 + 记忆点 + 亲和力，建议以职业/专业方向为核心词，搭配人格化称呼。',
      platformAdjust:
        '抖音：可用"徐医生护肤"简短有力；小红书：建议"肌肤管理师小徐"更具亲和力；B站：可用全称"皮肤科级护肤专家-徐XX"。',
    },
    avatar: {
      style: '专业白大褂 + 自然妆容，背景简洁（诊所或白底），展现医疗专业感与亲和力的平衡',
      colorScheme: '主色调：医疗白 + 浅蓝点缀；肤色自然真实，避免过度美化',
      expression: '微笑自信，眼神坚定，传递"我是专家但我很亲切"的信息',
      references: '参考：@皮肤科李医生（抖音）@丁香医生 的头像风格',
      mustHave: '白大褂或专业服装、清晰的五官、品牌感背景或logo',
      avoid: '过度滤镜、网红感浓厚的妆容、杂乱背景',
      aiPrompt:
        'Professional female dermatologist portrait, white medical coat, natural makeup, soft studio lighting, clean white background, confident smile, high resolution, 4K quality, photorealistic',
    },
    background: {
      style: '医疗科技感 + 温暖专业感的融合，展示专业设备或护肤场景',
      layout: '左侧留文字区域，右侧放专业形象或场景图；或全屏专业场景+文字浮层',
      colorTone: '主色：深海军蓝 or 医疗白；辅色：金色（品质感）；避免鲜艳杂色',
      copyContent: '建议文案：「专业皮肤管理 · 10年经验 · 科学护肤」或账号slogan',
      mustHave: '联系方式/平台主页QR码位置预留、Logo展示区、专业资质标识',
      platformSizes: {
        douyin: '抖音主页背景：750×422px（16:9）',
        xiaohongshu: '小红书个人页背景：1125×450px（2.5:1）',
        bilibili: 'B站空间封面：2560×768px，安全区1028×368px',
      },
      aiPrompt:
        'Professional skincare clinic background banner, medical aesthetic, navy blue and gold color scheme, clean minimalist design, dermatology clinic interior, soft lighting, 4K resolution',
    },
    bio: {
      formula: '职业标签 + 核心价值主张 + 社会证明 + 行动召唤 = 完整简介公式',
      versions: [
        '【抖音主号】皮肤科级护肤导师 | 10年皮肤管理经验 | 帮助3000+人修复敏感肌 | 每天分享真实护肤干货',
        '【抖音副号】❤️ 每天帮你解决皮肤问题 | 护肤误区避坑指南 | 点击主页领取《敏感肌修复手册》',
        '【小红书主号】皮肤管理师✨ | 专注抗衰&修复 | 分享科学护肤方法 | 合作/咨询👇',
        '【小红书副号】和我一起做有效护肤🌿 | 不卖产品只讲真话 | 每周更新皮肤管理案例',
        '【B站主号】我是有10年经验的皮肤管理师，专注皮肤科学，带你了解真正有效的护肤方法。不踩坑，不种草，只讲干货。',
        '【B站副号】皮肤管理爱好者，记录真实护肤过程。一起探索适合自己肤质的护肤之路🔬',
      ],
    },
    strategy: {
      visualConsistency:
        '所有平台统一使用医疗白+海军蓝色调，同一字体风格，logo固定位置，建立强识别性视觉系统',
      firstImpression:
        '头像传递「专业可信赖」，昵称体现专业身份，前3条视频直接展示核心专业价值，让用户0.5秒内判断值得关注',
      conversionPath:
        '关注→看内容→信任→私信咨询→购买服务/产品。内容设计要在第3-5步加强转化钩子（如：评论区引导私信、主页置顶转化视频）',
      platformPriority:
        '第一优先：抖音（流量最大，建立基础粉丝池）→ 第二：小红书（精准高净值女性用户，强转化）→ 第三：B站（专业形象背书，长尾SEO价值）',
    },
  };
}

export default function Step3() {
  const [personalInfo, setPersonalInfo] = useState('');
  const [platform, setPlatform] = useState('');
  const [audience, setAudience] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Step3Result | null>(null);
  const [regenLoadingBlocks, setRegenLoadingBlocks] = useState<string[]>([]);
  const [regenAllLoading, setRegenAllLoading] = useState(false);

  // Optimize modal state
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [optimizeBlockId, setOptimizeBlockId] = useState<Step3OutputBlock['id'] | null>(null);
  const [optimizeDirection, setOptimizeDirection] = useState('');

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
    if (saved?.result) {
      setResult(saved.result);
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isCtaDisabled) return;

    setIsLoading(true);
    await new Promise<void>((r) => setTimeout(r, 1500));

    const mockResult = generateMockResult();

    localStorage.setItem(
      LS_STEP3,
      JSON.stringify({
        input: { personalInfo, platform, audience, accountStatus },
        result: mockResult,
      }),
    );

    setResult(mockResult);
    setIsLoading(false);
    document.getElementById('step3-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleCopy(blockId: Step3OutputBlock['id']) {
    if (!result) return;
    const text = getBlockText(blockId, result);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制');
    } catch {
      toast.error('复制失败 · 请手动');
    }
  }

  async function handleRegen(blockId: Step3OutputBlock['id']) {
    setRegenLoadingBlocks((prev) => [...prev, blockId]);
    toast.info('重新生成中...');
    await new Promise<void>((r) => setTimeout(r, 1500));
    const fresh = generateMockResult();
    setResult((prev) => (prev ? { ...prev, [blockId]: fresh[blockId] } : fresh));
    setRegenLoadingBlocks((prev) => prev.filter((id) => id !== blockId));
  }

  function handleOptimize(blockId: Step3OutputBlock['id']) {
    setOptimizeBlockId(blockId);
    setOptimizeDirection('');
    setOptimizeOpen(true);
  }

  async function handleOptimizeSubmit() {
    setOptimizeOpen(false);
    toast.info('智能优化中...');
    await new Promise<void>((r) => setTimeout(r, 1500));
    if (optimizeBlockId) {
      const fresh = generateMockResult();
      setResult((prev) => (prev ? { ...prev, [optimizeBlockId]: fresh[optimizeBlockId] } : fresh));
    }
    setOptimizeDirection('');
    setOptimizeBlockId(null);
  }

  async function handleRegenAll() {
    setRegenAllLoading(true);
    toast.info('全部模块重新生成中...');
    await new Promise<void>((r) => setTimeout(r, 1500));
    const fresh = generateMockResult();
    setResult(fresh);
    setRegenAllLoading(false);
  }

  async function handleCopyAll() {
    if (!result) return;
    const allText = STEP3_OUTPUT_H3_6.map((block) => {
      const label = block.h3Label;
      const content = getBlockText(block.id, result);
      return `${label}\n${content}`;
    }).join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(allText);
      toast.success('已复制全部 6 个模块');
    } catch {
      toast.error('复制失败 · 请手动');
    }
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

      {/* Output section — rendered when result is available */}
      {result && (
        <section id="step3-output" className="mt-10 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display text-on-surface">账号包装方案</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenAll}
                disabled={regenAllLoading}
              >
                <RefreshCw className="h-4 w-4" />
                {STEP3_HEADER_BUTTON_REGEN_ALL}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                <Copy className="h-4 w-4" />
                {STEP3_HEADER_BUTTON_COPY_ALL}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {STEP3_OUTPUT_H3_6.map((block) => (
              <div key={block.id} className="glass-card rounded-xl p-6">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl text-on-surface">{block.h3Label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{block.hint}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(block.id)}
                    >
                      {STEP3_BUTTON_COPY}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegen(block.id)}
                      disabled={regenLoadingBlocks.includes(block.id)}
                    >
                      {regenLoadingBlocks.includes(block.id) ? '生成中...' : STEP3_BUTTON_REGENERATE}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOptimize(block.id)}
                    >
                      {STEP3_BUTTON_OPTIMIZE}
                    </Button>
                    {(block.id === 'avatar' || block.id === 'background') && (
                      <Button variant="outline" size="sm">
                        <ImagePlus className="h-4 w-4" />
                        {STEP3_BUTTON_GEN_IMAGE}
                      </Button>
                    )}
                  </div>
                </div>
                <Step3OutputContent blockId={block.id} result={result} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Optimize direction modal */}
      <Dialog open={optimizeOpen} onOpenChange={setOptimizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>智能优化</DialogTitle>
            <DialogDescription>
              请输入你的优化方向，AI 将根据你的需求重新生成这个模块
            </DialogDescription>
          </DialogHeader>
          <Input
            value={optimizeDirection}
            onChange={(e) => setOptimizeDirection(e.target.value)}
            placeholder="例如：更专业一些、突出年轻感、适合男性用户..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOptimizeOpen(false)}>
              取消
            </Button>
            <Button onClick={handleOptimizeSubmit}>确认优化</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
