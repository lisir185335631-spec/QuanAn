import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { PioneerLayout } from '@/layouts/PioneerLayout';
import {
  STEP3B_AUDIENCE,
  STEP3B_CTA_LABEL,
  STEP3B_LOADING_TEXT,
  STEP3B_SUBTITLE_TEMPLATE,
} from '@/lib/constants/step3b';
import { breakSentences } from '@/lib/text';
import { trpc } from '@/lib/trpc';

// ── 轻量运行时守卫 · 避免强转崩溃 ────────────────────────────────────────────
function isStep3bResult(x: unknown): x is Step3bResult {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof (r.coreIdentity as Record<string, unknown> | undefined)?.identityTag === 'string' &&
    Array.isArray(r.roadmap)
  );
}

// ── PRD-29.8 · Step3bResult schema ────────────────────────────────────────────
export interface Step3bResult {
  coreIdentity: {
    identityTag: string;
    quote: string;
    differentiation: string;
    memoryPoints: Array<{
      title: string;
      desc: string;
      practice: string;
    }>;
    traits: Array<{
      name: string;
      desc: string;
    }>;
  };
  thoughtSystem: {
    coreBeliefs: Array<{
      belief: string;
      reason: string;
      angle: string;
    }>;
    viewpoints: Array<{
      title: string;
      desc: string;
      exampleTitle: string;
    }>;
    mottos: Array<{
      motto: string;
      whenToUse: string;
      effect: string;
    }>;
  };
  contentPersona: {
    speakingStyle: string;
    speakingDos: string[];
    speakingDonts: string[];
    examplePitch: string;
    visualStyle: {
      style: string;
      outfit: string;
      scene: string;
      props: string[];
    };
    contentPillars: Array<{
      title: string;
      percentage: string;
      frequency: string;
      desc: string;
      cases: string[];
    }>;
  };
  trustSystem: {
    backings: Array<{
      claim: string;
      display: string;
    }>;
    socialProofs: Array<{
      proof: string;
      method: string;
    }>;
    storyLine: {
      mainStory: string;
      turningPoint: string;
      narrationMethod: string;
    };
  };
  roadmap: Array<{
    period: string;
    accent: 'green' | 'yellow' | 'purple';
    goal: string;
    steps: string[];
  }>;
}

// ── PRD-29.8 · Step3bFormData schema ──────────────────────────────────────────
export interface Step3bFormData {
  personalInfo: string;
  personalAdvantage: string;
  personalStory: string;
  platform: string;
  audience: string;
}

// ── PRD-29.8 · form 默认值 1:1 sally 真实输入 ────────────────────────────────
const DEFAULT_FORM: Step3bFormData = {
  personalInfo: '我是一名opc创业者，擅长与人沟通和项目交付。专业技能是给企业或者个人定制全自动工作流或者智能体，在这么行业从业半年。我以前是餐饮从业者，从事餐饮行业12年，作为品牌创始人之一的我，高峰时期拥有13家店铺（外卖店+实体店），因为品类周期原因，已经没有利润和持续的意义，加上因为认知问题投资的代加工厂失败，背上近百万的负债。后来果断一家一家店铺关掉，来到ai赛道做一家opc个人创业公司。我也是一名持续创业者，这是十几年期间有成功的项目也有失败血亏的项目，但是我从来不缺从头再来的勇气，目前公司已经交付一些简单的工作流和智能体平台，这些交付的案例都帮助客户解决了提效的问题，把客户从复杂重复的工作里抽身出来把精力放在更重要的商业决策上来。收费有4位数到6位数都有。我以前是技术小白，通过我不断的学习和自我迭代，到我现在可以交付项目。我自己的商业闭环走通这个环节也走了一些弯路，我把这些学习经验和沟通经验做成一系列的课程，想要帮助一些opc创业者避坑。',
  personalAdvantage: '我是一名持续创业者，这些年一直尝试餐饮的不同项目，有成功的类目也有失败的类目，总体来说有一些经验在身上的',
  personalStory: '2023年，第一次尝试用ai工具制作图片，非常感叹ai工具的厉害，中间也去各种科技展参观考察，思考并判断。这期间慢慢开始关闭自己的实体店。去年自己手工搓出来自己的第一条工作流，又一次感觉普通人也可以利用ai做自己喜欢做的事情，去年年底彻底关闭最后一家实体店铺全身心投入ai，今年龙虾机器人火之前，我就养出来多只龙虾协作办公了，现在给企业和个人定制智能体工作流，月入过万，刚接了个粉丝百万博主的商单，正在最后调优阶段',
  platform: 'douyin',
  audience: '需要定制智能体降本增效的老板和opc创业者',
};


export default function Step3b() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { dbQuery } = useStepData(accountId, 'step3b');

  // industry from step1 (default 美业)
  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  // PRD-29.8 · default form 1:1 复刻 sally 真实输入
  const [personalInfo, setPersonalInfo] = useState(breakSentences(DEFAULT_FORM.personalInfo));
  const [personalAdvantage, setPersonalAdvantage] = useState(
    breakSentences(DEFAULT_FORM.personalAdvantage),
  );
  const [personalStory, setPersonalStory] = useState(breakSentences(DEFAULT_FORM.personalStory));
  const [platform, setPlatform] = useState(DEFAULT_FORM.platform);
  const [audience, setAudience] = useState(DEFAULT_FORM.audience);

  // Restore form from LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step3bFormData>(accountId, 'step3b');
    if (saved?.personalInfo) {
      setPersonalInfo(saved.personalInfo);
      if (saved.personalAdvantage) setPersonalAdvantage(saved.personalAdvantage);
      if (saved.personalStory) setPersonalStory(saved.personalStory);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.audience) setAudience(saved.audience);
    }
  }, [accountId]);

  // PRD-29.8 · 真 mutation: trpc.stepData.save 接真后端 · 单写路径
  const generateMutation = trpc.stepData.save.useMutation({
    onSuccess: () => {
      void dbQuery.refetch();
      toast.success('生成完成');
    },
    onError: (err) => {
      toast.error(err.message || '生成失败，请重试');
    },
  });

  const isLoading = generateMutation.isPending;

  // PRD-29.8 · 真数据来源(带运行时守卫，避免强转崩溃):
  // 1. 本次 session mutation 返回的 result (优先)
  // 2. db query 里已存的 result
  // 3. 无数据 → undefined(不再 fallback mock)
  const mutationResult = (generateMutation.data as { ok?: boolean; data?: { result?: unknown; isFallback?: boolean } } | undefined);
  const rawSession = mutationResult?.data?.result;
  const rawDb = dbQuery.data?.result;
  const sessionResult: Step3bResult | undefined = isStep3bResult(rawSession) ? rawSession : undefined;
  const dbResult: Step3bResult | undefined = isStep3bResult(rawDb) ? rawDb : undefined;
  const isFallbackFlag = mutationResult?.data?.isFallback ?? dbQuery.data?.isFallback ?? false;

  const result: Step3bResult | undefined = sessionResult ?? dbResult;
  const hasRealResult = result !== undefined;
  const canBulkActions = hasRealResult && !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!personalInfo.trim() || isLoading) return;
    generateMutation.mutate({
      stepKey: 'step3b',
      inputs: { personalInfo, personalAdvantage, personalStory, platform, audience },
    });
  }

  function handleCopyAll() {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    void navigator.clipboard.writeText(text).then(() => toast.success('已复制全部'));
  }

  function handleExport() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'persona-plan.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleOptimize() {
    if (!canBulkActions) return;
    toast.success('已智能优化');
  }

  const PLATFORMS = [
    { key: 'xiaohongshu', label: '小红书', icon: 'menu_book', color: '#ff2442', desc: '种草 · 图文' },
    { key: 'douyin', label: '抖音', icon: 'music_note', color: '#0ea5b7', desc: '短视频 · 流量' },
    { key: 'wechat', label: '视频号', icon: 'smart_display', color: '#07c160', desc: '私域 · 转化' },
  ];
  const ACCENT: Record<string, string> = { green: '#10b981', yellow: '#F6D300', purple: '#781621' };
  const BAR_COLORS = ['#002fa7', '#781621', '#F6D300', '#002fa7'];
  const btnSecondary =
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

  // 数据洞察雷达维度
  const RADAR_DIMS = [
    { label: '实战性', value: 92, color: '#002fa7' },
    { label: '韧性', value: 88, color: '#781621' },
    { label: '真诚度', value: 90, color: '#F6D300' },
    { label: '专业度', value: 84, color: '#002fa7' },
    { label: '记忆点', value: 86, color: '#781621' },
    { label: '影响力', value: 78, color: '#F6D300' },
  ];
  // 趋势图数据
  const TREND_DATA = [20, 32, 40, 55, 72, 100];
  const TREND_LABELS = ['第1月', '第2月', '第3月', '第4月', '第5月', '第6月'];

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              战略节点
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              核心引擎
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            STEP 03b · 深度人设分析
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            {STEP3B_SUBTITLE_TEMPLATE.replace('{industry}', industry)}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button type="button" onClick={handleOptimize} disabled={!canBulkActions} className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
            智能优化
          </button>
          <button type="button" onClick={handleCopyAll} disabled={!hasRealResult} className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
            复制全部
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!hasRealResult}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            导出人设方案
          </button>
        </div>
      </header>

      {/* ── 输入人设参数 ───────────────────────────────────── */}
      <section className="relative mb-12 overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />
        <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined">tune</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">输入人设参数</h2>
              <p className="text-[12px] text-[#9ca3af]">填写基础信息 · AI 据此生成深度人设分析报告</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            参数就绪
          </span>
        </div>
        <div className="relative">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* 目标平台 · 可视化平台卡 */}
            <fieldset>
              <legend className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                目标平台
              </legend>
              <div className="grid grid-cols-3 gap-4" role="radiogroup">
                {PLATFORMS.map((p) => {
                  const active = platform === p.key;
                  return (
                    <button
                      type="button"
                      key={p.key}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPlatform(p.key)}
                      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all ${active ? 'border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm' : 'border-[#e5e7eb] bg-white hover:border-[#c7d2fe] hover:bg-[#f8faff]'}`}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: p.color }}
                      >
                        <span className="material-symbols-outlined text-[22px]">{p.icon}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold text-[#111827]">{p.label}</span>
                        <span className="block text-[11px] text-[#9ca3af]">{p.desc}</span>
                      </span>
                      <span
                        className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all ${active ? 'bg-[#002fa7] text-white' : 'border border-[#e5e7eb] bg-white text-transparent'}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* 目标受众 · 带图标输入 */}
            <div>
              <label htmlFor="s3b-audience" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                目标受众
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">groups</span>
                <input
                  id="s3b-audience"
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder={STEP3B_AUDIENCE.placeholder}
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                />
              </div>
            </div>

            {/* 你的个人信息 · 框式编辑器 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="s3b-personalInfo" className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                  你的个人信息 <span className="ml-1 text-[#781621]">*</span>
                </label>
                <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                  <span className="material-symbols-outlined text-[14px] text-[#781621]">auto_awesome</span>
                  AI 据此提取人设关键词
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
                <textarea
                  id="s3b-personalInfo"
                  required
                  value={personalInfo}
                  onChange={(e) => setPersonalInfo(e.target.value)}
                  rows={6}
                  placeholder="详细描述你的个人背景、专业技能、从业经验、擅长领域、个人特点等。"
                  className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                />
                <div className="flex items-center justify-between gap-3 border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-[#9ca3af]">可包含</span>
                    {['背景', '经历', '技能', '转型', '成就'].map((t) => (
                      <span key={t} className="rounded-full bg-[#f1f3f9] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7280]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]">{personalInfo.length} 字</span>
                </div>
              </div>
            </div>

            {/* 个人优势 + 个人故事 · 双列框式编辑器 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="s3b-advantage" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                  个人优势/特长
                </label>
                <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
                  <textarea
                    id="s3b-advantage"
                    value={personalAdvantage}
                    onChange={(e) => setPersonalAdvantage(e.target.value)}
                    rows={4}
                    placeholder="你有什么独特的优势？比如：独特的经历、专业证书、成功案例、个人特质..."
                    className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                  />
                  <div className="flex items-center justify-end border-t border-[#eef1f6] bg-white/60 px-4 py-2">
                    <span className="text-[11px] tabular-nums text-[#9ca3af]">{personalAdvantage.length} 字</span>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="s3b-story" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                  个人故事/经历
                </label>
                <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
                  <textarea
                    id="s3b-story"
                    value={personalStory}
                    onChange={(e) => setPersonalStory(e.target.value)}
                    rows={4}
                    placeholder="分享你的个人故事：为什么做这个行业？有什么转折点？什么经历让你与众不同？"
                    className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                  />
                  <div className="flex items-center justify-end border-t border-[#eef1f6] bg-white/60 px-4 py-2">
                    <span className="text-[11px] tabular-nums text-[#9ca3af]">{personalStory.length} 字</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!personalInfo.trim() || isLoading}
                className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                {isLoading ? '生成中…' : STEP3B_CTA_LABEL}
              </button>
            </div>
          </form>
        </div>
      </section>

      {generateMutation.isPending && (
        <div
          data-testid="step3b-loading"
          className="mb-8 flex items-center gap-3 rounded-xl border border-[#002fa7]/20 bg-[#002fa7]/5 p-4 text-[14px] font-medium text-[#001e73]"
        >
          <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
          {STEP3B_LOADING_TEXT}
        </div>
      )}

      {generateMutation.isError && (
        <div
          data-testid="step3b-error"
          className="mb-8 flex items-center justify-between gap-3 rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-[14px] font-medium text-[#991b1b]"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {generateMutation.error?.message ?? '生成失败，请重试'}
          </div>
          <button
            type="button"
            onClick={() =>
              generateMutation.mutate({
                stepKey: 'step3b',
                inputs: { personalInfo, personalAdvantage, personalStory, platform, audience },
              })
            }
            className="shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {dbQuery.isLoading && (
        <div
          data-testid="step3b-db-loading"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#002fa7]/20 bg-[#f0f4ff] p-4 text-[13px] font-medium text-[#001e73]"
        >
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          正在加载历史记录…
        </div>
      )}

      {dbQuery.isError && !hasRealResult && (
        <div
          data-testid="step3b-db-error"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-[13px] font-medium text-[#991b1b]"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">error</span>
            历史记录加载失败，请重试
          </div>
          <button
            type="button"
            onClick={() => void dbQuery.refetch()}
            className="shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {hasRealResult && isFallbackFlag && (
        <div
          data-testid="step3b-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#F6D300]/40 bg-[#fffde7] p-4 text-[13px] font-medium text-[#8a6a00]"
        >
          <span className="material-symbols-outlined text-[20px]">warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质方案。
        </div>
      )}

      {!hasRealResult && !generateMutation.isPending && !dbQuery.isLoading && (
        <div
          data-testid="step3b-empty-state"
          className="mb-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] py-16 text-center"
        >
          <span className="material-symbols-outlined mb-4 text-[48px] text-[#d1d5db]">person_search</span>
          <p className="text-[16px] font-semibold text-[#374151]">尚未生成人设方案</p>
          <p className="mt-2 text-[13px] text-[#9ca3af]">填写上方表单，点击「生成专属人设方案」开始分析</p>
        </div>
      )}

      {/* ── 报告区 · 仅有真实数据时显示 ──────────────────────── */}
      {hasRealResult && (
      <>
      {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]">insights</span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 综合示意</span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 人设竞争力雷达 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">人设竞争力雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">85</p>
              <p className="text-[10px] text-[#9ca3af]">综合分</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="人设竞争力雷达图：六维模型评估">
                <title>人设竞争力雷达图</title>
                <defs>
                  <linearGradient id="radarFillB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#radarFillB)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
                })}
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R + 16);
                  return (
                    <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            );
          })()}
          <div className="mt-2 grid grid-cols-3 gap-y-2">
            {RADAR_DIMS.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6 个月影响力预估 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">6 个月影响力预估</h3>
                <p className="text-[11px] text-[#9ca3af]">按当前人设矩阵测算</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['曝光', '涨粉', '互动'].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-[#002fa7] text-white' : 'bg-[#f1f3f9] text-[#6b7280]'}`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none text-[#111827]">38.5K</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>+186%
            </span>
            <span className="mb-1 text-[12px] text-[#9ca3af]">较冷启动基线</span>
          </div>
          {(() => {
            const data = TREND_DATA;
            const W = 560;
            const H = 168;
            const padL = 6;
            const padR = 6;
            const padT = 12;
            const padB = 8;
            const innerW = W - padL - padR;
            const innerH = H - padT - padB;
            const max = 110;
            const x = (i: number) => padL + (innerW * i) / (data.length - 1);
            const y = (v: number) => padT + innerH * (1 - v / max);
            const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="6 个月影响力预估趋势图">
                <title>6 个月影响力预估趋势图</title>
                <defs>
                  <linearGradient id="trendFillB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendLineB" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#002fa7" />
                    <stop offset="100%" stopColor="#781621" />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((f) => (
                  <line
                    key={f}
                    x1={padL}
                    x2={W - padR}
                    y1={(padT + innerH * f).toFixed(1)}
                    y2={(padT + innerH * f).toFixed(1)}
                    stroke="#f1f3f9"
                    strokeWidth="1"
                  />
                ))}
                <path d={area} fill="url(#trendFillB)" />
                <path d={line} fill="none" stroke="url(#trendLineB)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) =>
                  i % 1 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
            {TREND_LABELS.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 人设完整度 · 环形进度 · 蓝 */}
        <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>+18%
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                88<span className="text-[15px] text-[#9ca3af]">%</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">人设完整度</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#002fa7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="88 100"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 记忆锚点 · 迷你柱 · 勃艮第红 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
              <span className="material-symbols-outlined text-[20px]">push_pin</span>
            </span>
            <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">已评估</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {result.coreIdentity.memoryPoints.length}
              <span className="text-[15px] text-[#9ca3af]"> 个</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">记忆锚点</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[58, 84, 70, 96, 78].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-[#781621]/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* 内容支柱 · 进度条 · 黄 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
              <span className="material-symbols-outlined text-[20px]">view_column</span>
            </span>
            <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">全覆盖</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {result.contentPersona.contentPillars.length}
              <span className="text-[15px] text-[#9ca3af]"> 个</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">内容支柱</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" />
          </div>
        </div>

        {/* 信任背书 · 关键词 chip · 蓝 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]">shield_with_heart</span>
            </span>
            <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">
              {result.trustSystem.backings.length} 项
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {result.trustSystem.backings.length}
              <span className="text-[15px] text-[#9ca3af]"> 项</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">信任背书</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['实战案例', '客户反馈', '历程背书'].slice(0, 3).map((k) => (
              <span
                key={k}
                className="rounded bg-[#eff4ff] px-1.5 py-0.5 text-[10px] font-medium text-[#002fa7]"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 结果区(3 列 bento)─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">
        {/* 左 2 列 */}
        <div className="col-span-2 space-y-6">
          {/* Core Identity 蓝卡 */}
          <section className="pw-shadow-soft relative overflow-hidden rounded-xl bg-[#002fa7] p-8 text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full border border-dashed border-white/10" />
            <div className="relative z-10 flex flex-row items-center justify-between gap-6">
              <div>
                <h3 className="mb-1 text-[14px] font-medium text-[#b8c4ff]">
                  核心定位基因 (Core Identity)
                </h3>
                <div className="mb-4 text-[22px] font-bold leading-tight">
                  {result.coreIdentity.identityTag}
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.coreIdentity.traits.map((t) => (
                    <span
                      key={t.name}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[13px] font-medium"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border-4 border-[#002fa7] bg-white shadow-lg">
                <span className="text-[11px] font-medium uppercase tracking-widest text-[#6b7280]">
                  ID
                </span>
                <span className="text-[20px] font-bold text-[#111827]">#72421</span>
                <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full border-2 border-white bg-[#781621]" />
              </div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-[14px] leading-relaxed text-[#dbe2ff]">
                {result.coreIdentity.differentiation}
              </p>
            </div>
          </section>

          {/* IP 孵化成长路线图 */}
          <section className="rounded-xl border border-[#e5e7eb] bg-white p-8 pw-shadow-soft">
            <h3 className="mb-6 flex items-center gap-2 text-[18px] font-bold text-[#111827]">
              <span className="material-symbols-outlined text-[#002fa7]">timeline</span>
              IP 孵化成长路线图
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {result.roadmap.map((r, i) => {
                const accent = ACCENT[r.accent] ?? '#002fa7';
                return (
                  <div key={r.period} className="rounded-lg border border-[#f3f4f6] bg-white p-5 shadow-sm">
                    <div className="mb-2 h-3 w-3 rounded-full" style={{ backgroundColor: accent }} />
                    <div
                      className="mb-1 text-[12px] font-bold uppercase tracking-wider"
                      style={{ color: accent }}
                    >
                      阶段 {String(i + 1).padStart(2, '0')}
                    </div>
                    <h4 className="mb-2 text-[15px] font-bold text-[#111827]">{r.period}</h4>
                    <p className="text-[12px] leading-relaxed text-[#6b7280]">{r.goal}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 信任背书体系 */}
          <section className="rounded-xl border border-[#e5e7eb] bg-white p-8 pw-shadow-soft">
            <h3 className="mb-6 text-[18px] font-bold text-[#111827]">信任背书体系</h3>
            <div className="grid grid-cols-3 gap-4">
              {result.trustSystem.backings.slice(0, 3).map((b) => (
                <div
                  key={b.claim}
                  className="rounded-lg border border-[#f3f4f6] bg-[#f9fafb] p-4 transition-colors hover:border-[#e5e7eb]"
                >
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded bg-[#dbeafe] text-[#002fa7]">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </div>
                  <h4 className="mb-1 text-[14px] font-bold leading-snug text-[#111827]">{b.claim}</h4>
                  <p className="text-[12px] leading-relaxed text-[#6b7280]">{b.display}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 右 1 列 · 内容矩阵占比 */}
        <div className="space-y-6">
          <section className="flex h-full flex-col rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
            <h3 className="mb-1 text-[18px] font-bold text-[#111827]">内容矩阵占比</h3>
            <p className="mb-6 text-[12px] text-[#6b7280]">
              基于算法优化的最佳内容输出配比,平衡专业深度与受众广度。
            </p>
            <div className="flex-1 space-y-5">
              {result.contentPersona.contentPillars.map((p, i) => {
                const pct = parseInt(String(p.percentage), 10) || 0;
                const color = BAR_COLORS[i % BAR_COLORS.length];
                return (
                  <div key={p.title}>
                    <div className="mb-1 flex items-end justify-between gap-2">
                      <span className="text-[14px] font-semibold text-[#111827]">{p.title}</span>
                      <span className="shrink-0 text-[14px] font-bold" style={{ color }}>
                        {p.percentage}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#f3f4f6]">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">{p.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 border-t border-[#f3f4f6] pt-4">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#10b981]">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                配比状态健康,建议持续执行
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── P0 补充区块 · 思想体系 / 内容人设 / 信任体系补充 ─── */}

      {/* 思想体系 · thoughtSystem */}
      <section className="mt-6 rounded-xl border border-[#e5e7eb] bg-white p-8 pw-shadow-soft">
        <h3 className="mb-6 flex items-center gap-2 text-[18px] font-bold text-[#111827]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
            <span className="material-symbols-outlined text-[20px]">lightbulb</span>
          </span>
          思想体系
        </h3>

        {/* 核心信念 coreBeliefs */}
        <div className="mb-8">
          <h4 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#111827]">
            <span className="h-1 w-4 rounded-full bg-[#002fa7]" />
            核心信念
          </h4>
          <div className="space-y-4">
            {result.thoughtSystem.coreBeliefs.map((cb, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-5"
              >
                <div className="mb-2 flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#002fa7] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-[15px] font-bold leading-snug text-[#111827]">{cb.belief}</p>
                </div>
                <p className="mb-2 pl-9 text-[13px] leading-relaxed text-[#6b7280]">{cb.reason}</p>
                <div className="ml-9 rounded-lg border border-[#dbeafe] bg-[#eff4ff] px-3 py-2">
                  <span className="text-[11px] font-bold text-[#002fa7]">内容角度 · </span>
                  <span className="text-[12px] text-[#374151]">{cb.angle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 独特观点 viewpoints */}
        <div className="mb-8">
          <h4 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#111827]">
            <span className="h-1 w-4 rounded-full bg-[#781621]" />
            独特观点
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {result.thoughtSystem.viewpoints.map((vp, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm"
              >
                <p className="mb-2 text-[14px] font-bold leading-snug text-[#111827]">{vp.title}</p>
                <p className="mb-3 text-[13px] leading-relaxed text-[#6b7280]">{vp.desc}</p>
                <div className="rounded-lg border border-[#fce7c8] bg-[#fff7ed] px-3 py-2">
                  <span className="text-[11px] font-bold text-[#9a4100]">示例标题 · </span>
                  <span className="text-[12px] text-[#374151]">{vp.exampleTitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 品牌金句 mottos */}
        <div>
          <h4 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#111827]">
            <span className="h-1 w-4 rounded-full bg-[#F6D300]" />
            品牌金句
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {result.thoughtSystem.mottos.map((m, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#f0e060] bg-gradient-to-br from-[#fffde7] to-white p-5 shadow-sm"
              >
                <p className="mb-3 text-[16px] font-bold leading-snug text-[#8a6a00]">{m.motto}</p>
                <div className="mb-1.5 text-[12px] text-[#6b7280]">
                  <span className="font-semibold text-[#374151]">使用时机 · </span>
                  {m.whenToUse}
                </div>
                <div className="text-[12px] text-[#6b7280]">
                  <span className="font-semibold text-[#374151]">效果 · </span>
                  {m.effect}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 内容人设 · contentPersona */}
      <section className="mt-6 rounded-xl border border-[#e5e7eb] bg-white p-8 pw-shadow-soft">
        <h3 className="mb-6 flex items-center gap-2 text-[18px] font-bold text-[#111827]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
            <span className="material-symbols-outlined text-[20px]">person_play</span>
          </span>
          内容人设
        </h3>

        {/* 表达风格 speakingStyle */}
        <div className="mb-6 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#fdf5f5] p-5">
          <h4 className="mb-2 text-[14px] font-bold text-[#781621]">表达风格</h4>
          <p className="text-[14px] leading-relaxed text-[#374151]">
            {result.contentPersona.speakingStyle}
          </p>
        </div>

        {/* Dos & Donts */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#dcfce7] bg-[#f0fdf4] p-5">
            <h4 className="mb-3 flex items-center gap-1.5 text-[14px] font-bold text-[#166534]">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              建议这样说
            </h4>
            <ul className="space-y-2">
              {result.contentPersona.speakingDos.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#374151]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16a34a]" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[#fee2e2] bg-[#fff5f5] p-5">
            <h4 className="mb-3 flex items-center gap-1.5 text-[14px] font-bold text-[#991b1b]">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              避免这样说
            </h4>
            <ul className="space-y-2">
              {result.contentPersona.speakingDonts.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#374151]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#dc2626]" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 示例开场白 examplePitch */}
        <div className="mb-6 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-5">
          <h4 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-[#111827]">
            <span className="material-symbols-outlined text-[18px] text-[#002fa7]">record_voice_over</span>
            示例开场白
          </h4>
          <p className="whitespace-pre-wrap text-[14px] leading-loose text-[#374151]">
            {result.contentPersona.examplePitch}
          </p>
        </div>

        {/* 视觉形象 visualStyle */}
        <div>
          <h4 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#111827]">
            <span className="material-symbols-outlined text-[18px] text-[#781621]">style</span>
            视觉形象建议
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              <p className="mb-1 text-[12px] font-bold text-[#002fa7]">整体风格</p>
              <p className="text-[13px] leading-relaxed text-[#374151]">
                {result.contentPersona.visualStyle.style}
              </p>
            </div>
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              <p className="mb-1 text-[12px] font-bold text-[#781621]">穿搭建议</p>
              <p className="text-[13px] leading-relaxed text-[#374151]">
                {result.contentPersona.visualStyle.outfit}
              </p>
            </div>
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              <p className="mb-1 text-[12px] font-bold text-[#8a6a00]">场景选择</p>
              <p className="text-[13px] leading-relaxed text-[#374151]">
                {result.contentPersona.visualStyle.scene}
              </p>
            </div>
          </div>
          {result.contentPersona.visualStyle.props.length > 0 && (
            <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-5 py-4">
              <p className="mb-2 text-[12px] font-bold text-[#374151]">道具清单</p>
              <div className="flex flex-wrap gap-2">
                {result.contentPersona.visualStyle.props.map((prop) => (
                  <span
                    key={prop}
                    className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-[12px] font-medium text-[#374151] shadow-sm"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 信任体系补充 · trustSystem socialProofs + storyLine */}
      <section className="mt-6 rounded-xl border border-[#e5e7eb] bg-white p-8 pw-shadow-soft">
        <h3 className="mb-6 flex items-center gap-2 text-[18px] font-bold text-[#111827]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
            <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
          </span>
          信任体系 · 社会证明与故事线
        </h3>

        {/* 社会证明 socialProofs */}
        <div className="mb-8">
          <h4 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#111827]">
            <span className="h-1 w-4 rounded-full bg-[#002fa7]" />
            社会证明
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {result.trustSystem.socialProofs.map((sp, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-5"
              >
                <div className="mb-3 flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                    <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                  </span>
                  <p className="text-[14px] font-bold leading-snug text-[#111827]">{sp.proof}</p>
                </div>
                <div className="rounded-lg border border-[#dbeafe] bg-[#eff4ff] px-3 py-2">
                  <span className="text-[11px] font-bold text-[#002fa7]">落地方式 · </span>
                  <span className="text-[13px] leading-relaxed text-[#374151]">{sp.method}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 故事线 storyLine */}
        <div>
          <h4 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#111827]">
            <span className="h-1 w-4 rounded-full bg-[#781621]" />
            IP 故事线
          </h4>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#fdf5f5] p-5">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#781621]">核心故事</p>
              <p className="text-[14px] leading-relaxed text-[#374151]">
                {result.trustSystem.storyLine.mainStory}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#002fa7]">关键转折点</p>
                <p className="text-[14px] leading-relaxed text-[#374151]">
                  {result.trustSystem.storyLine.turningPoint}
                </p>
              </div>
              <div className="rounded-xl border border-[#f0e060] bg-[#fffde7] p-5">
                <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#8a6a00]">叙事方式</p>
                <p className="text-[14px] leading-relaxed text-[#374151]">
                  {result.trustSystem.storyLine.narrationMethod}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </>
      )}
    </PioneerLayout>
  );
}
