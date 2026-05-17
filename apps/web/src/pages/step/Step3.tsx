import { Copy, ImagePlus, RefreshCw } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';

import Step3OutputContent, {
  getBlockText,
  type Step3Result,
} from '@/components/step3/Step3OutputContent';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
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

// ── Backend Step3Output → frontend Step3Result adapter ────────────────────────
function adaptStep3Result(raw: Record<string, unknown>): Step3Result {
  const nickname = Array.isArray(raw.nickname) ? (raw.nickname as string[]) : [];
  const avatar = (raw.avatar as { style?: string; prompt?: string } | null) ?? {};
  const background = (raw.background as { prompt?: string; platformVersions?: string[] } | null) ?? {};
  const bio = Array.isArray(raw.bio)
    ? (raw.bio as { platform: string; text: string }[])
    : [];
  const overallStrategy = typeof raw.overallStrategy === 'string' ? raw.overallStrategy : '';
  return {
    videoReferences: { cards: [] },
    nickname: {
      recommendations: nickname,
      strategy: overallStrategy,
      platformAdjust: '',
    },
    avatar: {
      style: avatar.style ?? '',
      colorScheme: '',
      expression: '',
      references: '',
      mustHave: '',
      avoid: '',
      aiPrompt: avatar.prompt ?? '',
    },
    background: {
      style: background.prompt ?? '',
      layout: '',
      colorTone: '',
      copyContent: '',
      mustHave: '',
      platformSizes: {
        douyin: (background.platformVersions ?? [])[0] ?? '',
        xiaohongshu: (background.platformVersions ?? [])[1] ?? '',
        bilibili: (background.platformVersions ?? [])[2] ?? '',
      },
      aiPrompt: background.prompt ?? '',
    },
    bio: {
      formula: '',
      versions: bio.map((b) => `[${b.platform}] ${b.text}`),
    },
    strategy: {
      visualConsistency: overallStrategy,
      firstImpression: '',
      conversionPath: '',
      platformPriority: '',
    },
  };
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
      strategy: '昵称需体现专业性 + 记忆点 + 亲和力',
      platformAdjust: '抖音：可用"徐医生护肤"简短有力',
    },
    avatar: {
      style: '专业白大褂 + 自然妆容',
      colorScheme: '医疗白 + 浅蓝点缀',
      expression: '微笑自信，眼神坚定',
      references: '参考：@皮肤科李医生',
      mustHave: '白大褂或专业服装',
      avoid: '过度滤镜',
      aiPrompt: 'Professional female dermatologist portrait, white medical coat',
    },
    background: {
      style: '医疗科技感 + 温暖专业感的融合',
      layout: '左侧留文字区域，右侧放专业形象',
      colorTone: '主色：深海军蓝 or 医疗白',
      copyContent: '「专业皮肤管理 · 10年经验 · 科学护肤」',
      mustHave: '联系方式/平台主页QR码位置预留',
      platformSizes: {
        douyin: '抖音主页背景：750×422px（16:9）',
        xiaohongshu: '小红书个人页背景：1125×450px（2.5:1）',
        bilibili: 'B站空间封面：2560×768px',
      },
      aiPrompt: 'Professional skincare clinic background banner',
    },
    bio: {
      formula: '职业标签 + 核心价值主张 + 社会证明 + 行动召唤',
      versions: [
        '【抖音主号】皮肤科级护肤导师 | 10年皮肤管理经验',
        '【小红书主号】皮肤管理师✨ | 专注抗衰&修复',
      ],
    },
    strategy: {
      visualConsistency: '所有平台统一使用医疗白+海军蓝色调',
      firstImpression: '头像传递「专业可信赖」',
      conversionPath: '关注→看内容→信任→私信咨询',
      platformPriority: '第一优先：抖音 → 第二：小红书',
    },
  };
}

export default function Step3() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step3');

  const [personalInfo, setPersonalInfo] = useState('');
  const [platform, setPlatform] = useState('');
  const [audience, setAudience] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [result, setResult] = useState<Step3Result | null>(null);
  const [regenLoadingBlocks, setRegenLoadingBlocks] = useState<string[]>([]);
  const [regenAllLoading, setRegenAllLoading] = useState(false);

  // Optimize modal state
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [optimizeBlockId, setOptimizeBlockId] = useState<Step3OutputBlock['id'] | null>(null);
  const [optimizeDirection, setOptimizeDirection] = useState('');

  const prevIsSavingRef = useRef(false);

  // Cross-step prefill: read industry from step1 using new namespaced key
  const step1Data = readOtherStep<{ industryLabel?: string }>(accountId, 'step1');
  const industryLabel = step1Data?.industryLabel ?? '(未选择)';
  const subtitle = STEP3_SUBTITLE_TEMPLATE.replace('{industry}', industryLabel);
  const isCtaDisabled = !personalInfo.trim() || !platform || isSaving;

  // Prefill form from new namespaced LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<{
      personalInfo?: string;
      platform?: string;
      audience?: string;
      accountStatus?: string;
    }>(accountId, 'step3');
    if (saved?.personalInfo) setPersonalInfo(saved.personalInfo);
    if (saved?.platform) setPlatform(saved.platform);
    if (saved?.audience) setAudience(saved.audience ?? '');
    if (saved?.accountStatus) setAccountStatus(saved.accountStatus ?? '');
  }, [accountId]);

  // Refetch after save completes (isSaving: true → false)
  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  // Sync result from DB
  useEffect(() => {
    if (!dbQuery.data?.result) return;
    const raw = dbQuery.data.result as Record<string, unknown>;
    setResult(adaptStep3Result(raw));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data?.result]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isCtaDisabled) return;
    save({ personalInfo, platform, audience, accountStatus });
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
        {/* personalInfo */}
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

        {/* platform */}
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

        {/* audience */}
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

        {/* accountStatus */}
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
            {STEP3_CTA_LABEL}
          </Button>
          {isCtaDisabled && !isSaving && (
            <p className="text-body-sm text-muted-foreground text-center mt-2">
              {STEP3_CTA_DISABLED_HINT}
            </p>
          )}
        </div>
      </form>

      {/* Result area */}
      <div className="mt-8">
        {isSaving ? (
          <LoadingState text="正在分析 IP 定位 · 请稍候 ..." size="lg" />
        ) : dbQuery.isError ? (
          <ErrorState
            message={dbQuery.error instanceof Error ? dbQuery.error.message : '加载失败'}
            onRetry={dbQuery.refetch}
          />
        ) : result ? (
          <section id="step3-output" className="mt-2 max-w-4xl">
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
                      <Button variant="outline" size="sm" onClick={() => handleCopy(block.id)}>
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
                      <Button variant="outline" size="sm" onClick={() => handleOptimize(block.id)}>
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
        ) : (
          <EmptyState title={`提交表单后查看${STEP3_H1}`} />
        )}
      </div>

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

      {/* Loading text overlay during initial generation */}
      {isSaving && (
        <div className="mt-2 text-center text-body-sm text-muted-foreground">
          {STEP3_LOADING_TEXT}
        </div>
      )}
    </main>
  );
}
