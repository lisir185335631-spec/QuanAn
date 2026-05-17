import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import Step3bOutputContent, {
  type Step3bResult,
} from '@/components/step3b/Step3bOutputContent';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import {
  STEP3B_AUDIENCE,
  STEP3B_BUTTON_COPY,
  STEP3B_BUTTON_COPY_ALL,
  STEP3B_BUTTON_OPTIMIZE,
  STEP3B_BUTTON_REGENERATE,
  STEP3B_CTA_LABEL,
  STEP3B_H1,
  STEP3B_LOADING_TEXT,
  STEP3B_OUTPUT_H3_5,
  STEP3B_STEP_TAG,
  STEP3B_SUBTITLE_TEMPLATE,
  STEP3B_TEXTAREAS_3,
  type Step3bOutputBlock,
} from '@/lib/constants/step3b';
import { STEP3_PLATFORMS_5 } from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

// ── Backend Step3bOutput → frontend Step3bResult adapter ──────────────────────
function adaptStep3bResult(raw: Record<string, unknown>): Step3bResult {
  const ts = (raw.thoughtSystem as { coreBeliefs?: string[]; uniqueViews?: string[]; catchphrases?: string[] } | null) ?? {};
  const cp = (raw.contentPersona as { contentPillars?: string[] } | null) ?? {};
  const pr = (raw.personaRoadmap as { phase1?: string; phase2?: string; phase3?: string } | null) ?? {};
  return {
    coreIdentity: {
      persona: typeof raw.coreIdentity === 'string' ? raw.coreIdentity : undefined,
    },
    thoughtSystem: {
      coreIdeas: ts.coreBeliefs ?? [],
      uniqueViews: ts.uniqueViews ?? [],
      catchphrases: ts.catchphrases ?? [],
    },
    contentPersona: {
      contentPillars: cp.contentPillars ?? [],
    },
    trustSystem: {
      socialProof: typeof raw.trustBuilding === 'string' ? raw.trustBuilding : undefined,
    },
    roadmap: {
      phases: [
        pr.phase1 ? { label: '第一阶段', goal: pr.phase1, keyResults: [] } : null,
        pr.phase2 ? { label: '第二阶段', goal: pr.phase2, keyResults: [] } : null,
        pr.phase3 ? { label: '第三阶段', goal: pr.phase3, keyResults: [] } : null,
      ].filter(Boolean) as { label: string; goal: string; keyResults: string[] }[],
    },
  };
}

function generateMockResult(): Step3bResult {
  return {
    coreIdentity: {
      persona: '深耕行业 10 年、专注客户结果的专业实践者',
      slogan: '真实经历 · 专业指引 · 结果为先',
      differentiation: '不卖课不带货，只分享真实落地经验与成果案例',
      memoryPoints: ['每次必说"我亲测过"', '擅用数字量化成果', '直接说反面案例'],
      personality: '真实 · 直率 · 专业 · 有温度',
    },
    thoughtSystem: {
      coreIdeas: ['结果比方法重要', '真实案例胜过理论', '持续迭代，拒绝完美主义'],
      uniqueViews: ['90% 的失败源于行动太晚', '爆款内容 = 真实痛点 × 解决方案'],
      catchphrases: ['先做一件事，做到极致', '你的经历就是你最大的流量资产'],
    },
    contentPersona: {
      speakingStyle: '口语化、有节奏感、善用停顿和反问，贴近对话感',
      sampleScript: '很多人告诉我 XXX，但我亲身测试之后发现，真实情况是这样的……',
      visualStyle: '简洁白底或渐变暖色调，字幕清晰，避免过度花哨',
      contentPillars: ['行业干货拆解', '真实案例复盘', '避坑指南', '工具/方法推荐'],
    },
    trustSystem: {
      endorsements: ['10 年行业从业背景', '500+ 实战案例沉淀', '业内媒体采访背书'],
      socialProof: '帮助 300+ 同行实现收入翻倍，好评截图每周更新',
      personalStory: '从零开始、踩坑无数，最终找到适合普通人的可复制路径',
    },
    roadmap: {
      phases: [
        {
          label: '0-1个月',
          goal: '人设定调 + 基础内容体系搭建',
          keyResults: ['确定核心人设标签', '产出 12 条测试视频', '完成账号基础包装'],
        },
        {
          label: '1-3个月',
          goal: '内容放量 + 粉丝积累',
          keyResults: ['周更 3-5 条', '粉丝突破 1000', '找到爆款内容公式'],
        },
        {
          label: '3-6个月',
          goal: '变现路径验证',
          keyResults: ['私域引流 200+', '完成首次变现', '建立内容 SOP'],
        },
      ],
    },
  };
}

function getBlockText(blockId: Step3bOutputBlock['id'], result: Step3bResult): string {
  if (blockId === 'coreIdentity') {
    const ci = result.coreIdentity;
    return [
      `人设定位：${ci?.persona ?? '—'}`,
      `Slogan：${ci?.slogan ?? '—'}`,
      `差异化：${ci?.differentiation ?? '—'}`,
      `记忆点：${(ci?.memoryPoints ?? []).join('、')}`,
      `性格标签：${ci?.personality ?? '—'}`,
    ].join('\n');
  }
  if (blockId === 'ideologySystem') {
    const ts = result.thoughtSystem;
    return [
      `核心理念：${(ts?.coreIdeas ?? []).join('、')}`,
      `独特观点：${(ts?.uniqueViews ?? []).join('、')}`,
      `口头禅：${(ts?.catchphrases ?? []).join('、')}`,
    ].join('\n');
  }
  if (blockId === 'contentPersona') {
    const cp = result.contentPersona;
    return [
      `表达风格：${cp?.speakingStyle ?? '—'}`,
      `示例脚本：${cp?.sampleScript ?? '—'}`,
      `视觉风格：${cp?.visualStyle ?? '—'}`,
      `内容支柱：${(cp?.contentPillars ?? []).join('、')}`,
    ].join('\n');
  }
  if (blockId === 'trustSystem') {
    const tr = result.trustSystem;
    return [
      `背书资源：${(tr?.endorsements ?? []).join('、')}`,
      `社会证明：${tr?.socialProof ?? '—'}`,
      `个人故事：${tr?.personalStory ?? '—'}`,
    ].join('\n');
  }
  if (blockId === 'personaRoadmap') {
    return (result.roadmap?.phases ?? [])
      .map((p) => `${p.label} - ${p.goal}：${p.keyResults.join('、')}`)
      .join('\n');
  }
  return '';
}

interface FormData {
  personalInfo: string;
  advantages: string;
  story: string;
  audience: string;
}

export default function Step3b() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step3b');

  const [formData, setFormData] = useState<FormData>({
    personalInfo: '',
    advantages: '',
    story: '',
    audience: '',
  });
  const [platform, setPlatform] = useState('');
  const [result, setResult] = useState<Step3bResult | null>(null);
  const [regenLoadingBlocks, setRegenLoadingBlocks] = useState<string[]>([]);

  const prevIsSavingRef = useRef(false);

  // Cross-step prefill: industry from step1, personalInfo from step3
  const step1Data = readOtherStep<{ industryLabel?: string }>(accountId, 'step1');
  const industryLabel = step1Data?.industryLabel ?? '(未选择)';
  const subtitle = STEP3B_SUBTITLE_TEMPLATE.replace('{industry}', industryLabel);
  const isCtaDisabled = !formData.personalInfo.trim() || !platform || isSaving;

  // Prefill from new namespaced LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    // Prefill personalInfo from step3 if step3b not yet saved
    const step3Data = readOtherStep<{ personalInfo?: string }>(accountId, 'step3');
    const step3bData = readOtherStep<FormData & { platform?: string }>(accountId, 'step3b');
    if (step3bData?.personalInfo) {
      setFormData({
        personalInfo: step3bData.personalInfo,
        advantages: step3bData.advantages ?? '',
        story: step3bData.story ?? '',
        audience: step3bData.audience ?? '',
      });
      if (step3bData.platform) setPlatform(step3bData.platform);
    } else if (step3Data?.personalInfo) {
      setFormData((prev) => ({ ...prev, personalInfo: step3Data.personalInfo ?? '' }));
    }
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
    setResult(adaptStep3bResult(raw));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data?.result]);

  function setField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isCtaDisabled) return;
    save({ ...formData, platform });
    document.getElementById('step3b-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleCopy(blockId: Step3bOutputBlock['id']) {
    if (!result) return;
    const text = getBlockText(blockId, result);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制');
    } catch {
      toast.error('复制失败 · 请手动');
    }
  }

  function mergeBlockResult(prev: Step3bResult, blockId: Step3bOutputBlock['id'], fresh: Step3bResult): Step3bResult {
    if (blockId === 'coreIdentity') return { ...prev, coreIdentity: fresh.coreIdentity };
    if (blockId === 'ideologySystem') return { ...prev, thoughtSystem: fresh.thoughtSystem };
    if (blockId === 'contentPersona') return { ...prev, contentPersona: fresh.contentPersona };
    if (blockId === 'trustSystem') return { ...prev, trustSystem: fresh.trustSystem };
    if (blockId === 'personaRoadmap') return { ...prev, roadmap: fresh.roadmap };
    return prev;
  }

  async function handleRegen(blockId: Step3bOutputBlock['id']) {
    setRegenLoadingBlocks((prev) => [...prev, blockId]);
    toast.info('重新生成中...');
    await new Promise<void>((r) => setTimeout(r, 1500));
    const fresh = generateMockResult();
    setResult((prev) => (prev ? mergeBlockResult(prev, blockId, fresh) : fresh));
    setRegenLoadingBlocks((prev) => prev.filter((id) => id !== blockId));
  }

  function handleOptimize(blockId: Step3bOutputBlock['id']) {
    toast.info(`智能优化 ${blockId} 中...`);
    void new Promise<void>((r) => setTimeout(r, 1500)).then(() => {
      const fresh = generateMockResult();
      setResult((prev) => (prev ? mergeBlockResult(prev, blockId, fresh) : fresh));
    });
  }

  async function handleCopyAll() {
    if (!result) return;
    const allText = STEP3B_OUTPUT_H3_5.map((block) => {
      const label = block.h3Label;
      const content = getBlockText(block.id, result);
      return `${label}\n${content}`;
    }).join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(allText);
      toast.success(`已复制全部 5 个模块`);
    } catch {
      toast.error('复制失败 · 请手动');
    }
  }

  return (
    <main className="flex-1 container py-8">
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP3B_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP3B_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* 3 textarea from STEP3B_TEXTAREAS_3 */}
        {STEP3B_TEXTAREAS_3.map((ta) => (
          <div key={ta.id}>
            <label className="block text-body-sm font-label text-on-surface mb-2">
              {ta.label}
              {ta.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <textarea
              required={ta.required}
              value={formData[ta.id]}
              onChange={(e) => setField(ta.id, e.target.value)}
              placeholder={ta.placeholder}
              className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-cn resize-y"
              style={{ minHeight: ta.id === 'personalInfo' ? '160px' : '100px' }}
            />
          </div>
        ))}

        {/* 5 platform radio */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            目标平台
            <span className="text-destructive ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {STEP3_PLATFORMS_5.map((p) => (
              <label
                key={p.id}
                htmlFor={`step3b-${p.id}`}
                className={cn(
                  'glass-card rounded-lg p-3 flex flex-col items-center text-center cursor-pointer transition-colors',
                  platform === p.id
                    ? 'border-primary/60 bg-primary/10'
                    : 'hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  id={`step3b-${p.id}`}
                  name="step3b-platform"
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

        {/* 目标受众 input */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP3B_AUDIENCE.label}
          </label>
          <Input
            value={formData.audience}
            onChange={(e) => setField('audience', e.target.value)}
            placeholder={STEP3B_AUDIENCE.placeholder}
          />
        </div>

        {/* Main CTA */}
        <div>
          <Button
            type="submit"
            disabled={isCtaDisabled}
            className={cn('w-full', !isCtaDisabled && 'bg-gradient-to-r from-primary to-primary/80')}
          >
            {STEP3B_CTA_LABEL}
          </Button>
        </div>
      </form>

      {/* Result area */}
      <div className="mt-8">
        {isSaving ? (
          <LoadingState text="正在分析人设方案 · 请稍候 ..." size="lg" />
        ) : dbQuery.isError ? (
          <ErrorState
            message={dbQuery.error instanceof Error ? dbQuery.error.message : '加载失败'}
            onRetry={dbQuery.refetch}
          />
        ) : result ? (
          <section id="step3b-output" className="mt-2 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display text-on-surface">专属人设方案</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyAll}>
                  {STEP3B_BUTTON_COPY_ALL}
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {STEP3B_OUTPUT_H3_5.map((block) => (
                <div key={block.id} className="glass-card rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <h3 className="font-display text-2xl text-on-surface">{block.h3Label}</h3>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleCopy(block.id)}>
                        {STEP3B_BUTTON_COPY}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegen(block.id)}
                        disabled={regenLoadingBlocks.includes(block.id)}
                      >
                        {regenLoadingBlocks.includes(block.id) ? '生成中...' : STEP3B_BUTTON_REGENERATE}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOptimize(block.id)}>
                        {STEP3B_BUTTON_OPTIMIZE}
                      </Button>
                    </div>
                  </div>
                  <Step3bOutputContent blockId={block.id} result={result} />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState title={`提交表单后查看${STEP3B_H1}`} />
        )}
      </div>

      {isSaving && (
        <div className="mt-2 text-center text-body-sm text-muted-foreground">
          {STEP3B_LOADING_TEXT}
        </div>
      )}
    </main>
  );
}
