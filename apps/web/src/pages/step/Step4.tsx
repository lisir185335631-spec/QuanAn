import { Copy } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  STEP4_BUTTON_COPY,
  STEP4_BUTTON_GENERATE,
  STEP4_H1,
  STEP4_INPUTS_3,
  STEP4_LOADING_TEXT,
  STEP4_OUTPUT_H3_3,
  STEP4_PLATFORMS_5,
  STEP4_RADIO_LABEL,
  STEP4_STEP_TAG,
  STEP4_SUBTITLE_TEMPLATE,
  type Step4Result,
} from '@/lib/constants/step4';
import { cn } from '@/lib/utils';

const LS_STEP1 = 'acc_step1';
const LS_STEP4 = 'acc_step4';

interface Step4FormData {
  platform: string;
  follower_count: string;
  goal: string;
  personal_info: string;
}

interface Step4Saved {
  formData?: Step4FormData;
  result?: Step4Result;
}

function readStep1Industry(): string {
  try {
    const raw = localStorage.getItem(LS_STEP1);
    if (raw) {
      const parsed = JSON.parse(raw) as { industry?: string };
      return parsed.industry ?? '你的行业';
    }
  } catch {
    // ignore parse errors
  }
  return '你的行业';
}

function readStep4Saved(): Step4Saved | null {
  try {
    const raw = localStorage.getItem(LS_STEP4);
    if (raw) return JSON.parse(raw) as Step4Saved;
  } catch {
    // ignore parse errors
  }
  return null;
}

function generateMockResult(formData: Step4FormData): Step4Result {
  const platform = formData.platform || 'douyin';
  return {
    daily_tasks: [
      `【${platform}】发布 1 条竖版短视频（时长 30-60 秒）`,
      '早 9 点 / 午 12 点 / 晚 8 点各发 1 条帖子评论互动',
      '回复所有粉丝评论 + 私信（不超过 20 条）',
      '浏览行业 TOP 10 账号，收藏 3 条爆款分析结构',
      '记录 1 个新选题 idea 到素材本',
      '检查当日视频数据（完播率 / 点赞 / 评论）',
      '拍摄明日视频素材（1-2 个片段）',
      '学习 1 个平台运营干货（官方课 / 博主分析）',
    ],
    weekly_milestones: [
      '第 1 周：发布 7 条内容，账号完播率 ≥ 30%，新增粉丝 50+',
      '第 2 周：找到 1 个爆款选题方向，单条视频播放量 > 5000',
      '第 3 周：粉丝突破 500，开通私信引流渠道',
      '第 4 周：完成首月复盘，确定 3 个高互动内容类型',
    ],
    phase_kpis: [
      {
        phase: '第一阶段（1-30 天）',
        kpi: '冷启动 · 内容测试',
        target: '粉丝 1000 / 完播率 > 40% / 主页跳转率 > 5%',
      },
      {
        phase: '第二阶段（31-90 天）',
        kpi: '规模增长 · 变现探索',
        target: '粉丝 5000 / 月播放 ≥ 50 万 / 首单变现',
      },
      {
        phase: '第三阶段（91-180 天）',
        kpi: '稳定变现 · 品牌打造',
        target: '粉丝 2 万+ / 月收入 ≥ 1 万 / 复购率 > 30%',
      },
    ],
  };
}

type PageState = 'idle' | 'loading' | 'result' | 'error';

export default function Step4() {
  const [platform, setPlatform] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    follower_count: '',
    goal: '',
    personal_info: '',
  });
  const [pageState, setPageState] = useState<PageState>('idle');
  const [result, setResult] = useState<Step4Result | null>(null);

  const industry = readStep1Industry();
  const subtitle = STEP4_SUBTITLE_TEMPLATE.replace('{industry}', industry);
  const isCtaDisabled = !platform || pageState === 'loading';

  useEffect(() => {
    const saved = readStep4Saved();
    if (saved?.formData) {
      setPlatform(saved.formData.platform ?? '');
      setFieldValues({
        follower_count: saved.formData.follower_count ?? '',
        goal: saved.formData.goal ?? '',
        personal_info: saved.formData.personal_info ?? '',
      });
    }
    if (saved?.result) {
      setResult(saved.result);
      setPageState('result');
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isCtaDisabled) return;

    setPageState('loading');
    const formData: Step4FormData = {
      platform,
      follower_count: fieldValues['follower_count'] ?? '',
      goal: fieldValues['goal'] ?? '',
      personal_info: fieldValues['personal_info'] ?? '',
    };

    await new Promise<void>((r) => setTimeout(r, 2000 + Math.random() * 1000));

    const mockResult = generateMockResult(formData);
    localStorage.setItem(LS_STEP4, JSON.stringify({ formData, result: mockResult }));
    setResult(mockResult);
    setPageState('result');
    document.getElementById('step4-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleRetry() {
    setPageState('idle');
    setResult(null);
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制');
    } catch {
      toast.error('复制失败 · 请手动');
    }
  }

  function getBlockText(blockId: string, r: Step4Result): string {
    if (blockId === 'daily_tasks') return r.daily_tasks.join('\n');
    if (blockId === 'weekly_milestones') return r.weekly_milestones.join('\n');
    if (blockId === 'phase_kpis') {
      return r.phase_kpis
        .map((p) => `${p.phase}\n${p.kpi}：${p.target}`)
        .join('\n\n');
    }
    return '';
  }

  return (
    <main className="flex-1 container py-8">
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP4_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP4_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
        {/* Platform radio — required */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP4_RADIO_LABEL}
            <span className="text-destructive ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {STEP4_PLATFORMS_5.map((p) => (
              <label
                key={p.id}
                htmlFor={`step4-platform-${p.id}`}
                className={cn(
                  'glass-card rounded-lg p-3 flex flex-col items-center text-center cursor-pointer transition-colors',
                  platform === p.id
                    ? 'border-primary/60 bg-primary/10'
                    : 'hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  id={`step4-platform-${p.id}`}
                  name="step4-platform"
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

        {/* inputs — iterate STEP4_INPUTS_3 to avoid noUncheckedIndexedAccess errors */}
        {STEP4_INPUTS_3.map((input) => (
          <div key={input.id}>
            <label className="block text-body-sm font-label text-on-surface mb-2">
              {input.label}
            </label>
            {input.type === 'textarea' ? (
              <textarea
                value={fieldValues[input.id] ?? ''}
                onChange={(e) =>
                  setFieldValues((prev) => ({ ...prev, [input.id]: e.target.value }))
                }
                placeholder={input.placeholder}
                className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] font-cn resize-y"
              />
            ) : (
              <Input
                value={fieldValues[input.id] ?? ''}
                onChange={(e) =>
                  setFieldValues((prev) => ({ ...prev, [input.id]: e.target.value }))
                }
                placeholder={input.placeholder}
              />
            )}
          </div>
        ))}

        {/* Main CTA */}
        <Button
          type="submit"
          disabled={isCtaDisabled}
          className={cn('w-full', !isCtaDisabled && 'bg-gradient-to-r from-primary to-primary/80')}
        >
          {STEP4_BUTTON_GENERATE}
        </Button>
      </form>

      {/* State feedback */}
      <div className="mt-8 max-w-2xl">
        {pageState === 'loading' && <LoadingState text={STEP4_LOADING_TEXT} size="lg" />}
        {pageState === 'error' && (
          <ErrorState message="生成失败 · 请重试" onRetry={handleRetry} />
        )}
        {pageState === 'idle' && !result && (
          <EmptyState title={`提交表单后查看${STEP4_H1}`} />
        )}
      </div>

      {/* Output section */}
      {pageState === 'result' && result && (
        <section id="step4-output" className="mt-10 max-w-4xl space-y-6">
          {STEP4_OUTPUT_H3_3.map((block) => (
            <div key={block.id} className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-2xl text-on-surface">{block.h3Label}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(getBlockText(block.id, result))}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {STEP4_BUTTON_COPY}
                </Button>
              </div>

              {block.id === 'daily_tasks' && (
                <ul className="space-y-2">
                  {result.daily_tasks.map((task, i) => (
                    <li key={i} className="text-body-sm text-on-surface flex gap-2">
                      <span className="text-primary font-label shrink-0">{i + 1}.</span>
                      {task}
                    </li>
                  ))}
                </ul>
              )}

              {block.id === 'weekly_milestones' && (
                <ul className="space-y-2">
                  {result.weekly_milestones.map((milestone, i) => (
                    <li key={i} className="text-body-sm text-on-surface flex gap-2">
                      <span className="text-primary font-label shrink-0">•</span>
                      {milestone}
                    </li>
                  ))}
                </ul>
              )}

              {block.id === 'phase_kpis' && (
                <div className="space-y-4">
                  {result.phase_kpis.map((item, i) => (
                    <div key={i} className="glass-card rounded-lg p-4">
                      <p className="text-body-sm font-label text-primary mb-1">{item.phase}</p>
                      <p className="text-body-sm text-on-surface font-medium">{item.kpi}</p>
                      <p className="text-body-sm text-muted-foreground mt-1">{item.target}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
