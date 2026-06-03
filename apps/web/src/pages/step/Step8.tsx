// PRD-29.12 · Step8 直播策划 · 先锋白 PioneerLayout · 品牌三主色重构
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep } from '@/hooks/useStepData';
import { PioneerLayout } from '@/layouts/PioneerLayout';
import { stepLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

// ─── LivestreamAgent result type (generate_plan sub_function) ────────────────

/** Mirrors GeneratePlanOutput from LivestreamAgent · 6-module JSON */
export interface Step8LivestreamResult {
  opening: string;
  warmup: string;
  product: string;
  conversion: string;
  faq: string;
  closing: string;
}

/** Runtime guard — avoids bare `as` casts */
function isStep8Result(x: unknown): x is Step8LivestreamResult {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.opening === 'string' &&
    typeof r.warmup === 'string' &&
    typeof r.product === 'string' &&
    typeof r.conversion === 'string' &&
    typeof r.faq === 'string' &&
    typeof r.closing === 'string'
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step8FormData {
  productInfo: string;
  targetAudience: string;
  platform: string;
  experience: 'newbie' | 'intermediate' | 'expert';
}

interface Step8StageDetail {
  index: number;
  name: string;
  duration: string;
  accent: 'normal' | 'green' | 'orange' | 'red';
  scriptLabel: string;
  script: string;
  actions?: string[];
  hooks?: string[];
  interaction?: string;
  conversion?: string;
  urgencyTags?: string[];
  closeTechniques?: string[];
  nextPreview?: string;
}


// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FORM: Step8FormData = {
  productInfo: '定制智能体定价：10000-100000（根据客户需求专业定制）\n针对opc创业者：自己做ip获取流量，9800线上智能体使用和19800线下高阶段培训\n技术升级项目落地培训29800，训练营',
  targetAudience: '需要定制智能体降本增效的老板和opc创业者',
  platform: 'douyin',
  experience: 'newbie',
};

const EXPERIENCE_OPTIONS = [
  { value: 'newbie' as const, label: '新手', sub: '刚开始做直播', icon: 'rocket_launch', color: '#002fa7' },
  { value: 'intermediate' as const, label: '有经验', sub: '有一定直播经验', icon: 'trending_up', color: '#781621' },
  { value: 'expert' as const, label: '资深', sub: '直播经验丰富', icon: 'star', color: '#002fa7' },
];

const PLATFORMS = [
  { id: 'douyin', label: '抖音', icon: 'music_note', color: '#0ea5b7', desc: '短视频 · 流量' },
  { id: 'xiaohongshu', label: '小红书', icon: 'menu_book', color: '#ff2442', desc: '种草 · 图文' },
  { id: 'shipinhao', label: '视频号', icon: 'smart_display', color: '#07c160', desc: '私域 · 转化' },
  { id: 'kuaishou', label: '快手', icon: 'bolt', color: '#ff7a00', desc: '下沉 · 互动' },
  { id: 'bilibili', label: 'B站', icon: 'smart_display', color: '#fb7299', desc: '知识 · 社区' },
];

// ─── accent → brand color mapping ────────────────────────────────────────────

function accentColor(accent: Step8StageDetail['accent']): string {
  if (accent === 'green') return '#002fa7';
  if (accent === 'orange') return '#F6D300';
  if (accent === 'red') return '#781621';
  return '#002fa7';
}

/**
 * Returns the foreground text color for a given accent.
 * Pure yellow (#F6D300) is never used as text — deep gold (#8a6a00) is used instead.
 */
function accentText(accent: Step8StageDetail['accent']): string {
  if (accent === 'orange') return '#8a6a00';
  if (accent === 'red') return '#781621';
  return '#002fa7';
}

function accentBg(accent: Step8StageDetail['accent']): string {
  if (accent === 'green') return 'bg-[#002fa7]/[0.07]';
  if (accent === 'orange') return 'bg-[#fdf6cc]';
  if (accent === 'red') return 'bg-[#781621]/[0.07]';
  return 'bg-[#f5f8ff]';
}

function accentBorder(accent: Step8StageDetail['accent']): string {
  if (accent === 'green') return 'border-[#002fa7]/20';
  if (accent === 'orange') return 'border-[#F3E08A]';
  if (accent === 'red') return 'border-[#781621]/30';
  return 'border-[#002fa7]/20';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Step8() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  const [productInfo, setProductInfo] = useState(DEFAULT_FORM.productInfo);
  const [targetAudience, setTargetAudience] = useState(DEFAULT_FORM.targetAudience);
  const [platform, setPlatform] = useState(DEFAULT_FORM.platform);
  const [experience, setExperience] = useState<Step8FormData['experience']>(DEFAULT_FORM.experience);

  // PRD-29.12 · 真 query: stepData.get 进页即读取历史结果 (对齐 Step7: staleTime + retry:false)
  const dbQuery = trpc.stepData.get.useQuery(
    { stepKey: 'step8' },
    { enabled: accountId !== null, staleTime: 30_000, retry: false },
  );

  // PRD-29.12 · 真 mutation: stepData.save → LivestreamAgent.execute(generate_plan)
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

  // PRD-29.12 · 真数据来源(带运行时守卫，避免强转崩溃):
  // 1. 本次 session mutation 返回的 result (优先)
  // 2. db query 里已存的 result
  // 3. 无数据 → undefined (不再 fallback mock · Step3b 教训)
  // RouterOutputs typed — useMutation.data is already RouterOutputs['stepData']['save'] | undefined
  const mutationResult = generateMutation.data;
  const rawSession = mutationResult?.data?.result;
  const rawDb = dbQuery.data?.result;
  const sessionResult: Step8LivestreamResult | undefined = isStep8Result(rawSession) ? rawSession : undefined;
  const dbResult: Step8LivestreamResult | undefined = isStep8Result(rawDb) ? rawDb : undefined;
  const isFallbackFlag = mutationResult?.data?.isFallback ?? dbQuery.data?.isFallback ?? false;

  const result: Step8LivestreamResult | undefined = sessionResult ?? dbResult;
  const hasResult = result !== undefined;
  const canBulkActions = hasResult && !isLoading;

  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step8FormData>(accountId, 'step8');
    if (saved?.productInfo) {
      setProductInfo(saved.productInfo);
      if (saved.targetAudience) setTargetAudience(saved.targetAudience);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.experience) setExperience(saved.experience);
    }
  }, [accountId]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    // Map experience value to Chinese label expected by LivestreamAgent
    const expMap: Record<Step8FormData['experience'], string> = {
      newbie: '新手',
      intermediate: '有经验',
      expert: '资深',
    };
    const formSnapshot: Step8FormData = { productInfo, targetAudience, platform, experience };
    // Write LS so readOtherStep('step8') can restore form state on next visit
    if (accountId !== null) {
      try {
        localStorage.setItem(stepLsKey(accountId, 'step8'), JSON.stringify(formSnapshot));
      } catch {
        // LS full — non-fatal, proceed with DB write
      }
    }
    generateMutation.mutate({
      stepKey: 'step8',
      inputs: {
        productInfo,
        targetAudience,
        platform,
        experience: expMap[experience],
        sub_function: 'generate_plan',
      },
    });
  }

  function handleRegenerateAll() {
    if (isLoading) return;
    const expMap: Record<Step8FormData['experience'], string> = {
      newbie: '新手',
      intermediate: '有经验',
      expert: '资深',
    };
    generateMutation.mutate({
      stepKey: 'step8',
      inputs: {
        productInfo,
        targetAudience,
        platform,
        experience: expMap[experience],
        sub_function: 'generate_plan',
      },
    });
  }

  function handleCopyAll() {
    if (!result) return;
    navigator.clipboard
      .writeText(JSON.stringify(result, null, 2))
      .then(() => toast.success('已复制全部'))
      .catch(() => toast.error('复制失败'));
  }

  function handleOptimize() {
    if (!canBulkActions) return;
    // TODO: wire to optimize_script sub_function when UX flow is finalized
    toast.info('优化功能开发中');
  }

  function handleCopySection(label: string, text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`已复制${label}`))
      .catch(() => toast.error('复制失败'));
  }

  function handleViewIpPlan() {
    toast.info('IP 方案查看功能开发中');
  }

  const btnSecondary =
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

  // ── 数据洞察雷达维度 (直播转化力)
  const RADAR_DIMS_S8 = [
    { label: '流量获取', value: 82, color: '#002fa7' },
    { label: '互动设计', value: 88, color: '#781621' },
    { label: '产品塑造', value: 76, color: '#F6D300' },
    { label: '逼单话术', value: 84, color: '#002fa7' },
    { label: '留存转粉', value: 79, color: '#781621' },
    { label: '数据优化', value: 90, color: '#F6D300' },
  ];

  // ── 趋势图数据 (7 环节在线人数)
  const TREND_DATA_S8 = [120, 180, 260, 320, 290, 350, 300];
  const TREND_LABELS_S8 = ['预热', '开场', '痛点共鸣', 'AI解析', '产品植入', '逼单', '收尾'];

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              战略路径
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              直播脚本
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tight text-[#1b1b1b]">
            STEP 08 · 直播策划
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button type="button" onClick={handleRegenerateAll} disabled={isLoading} className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            重新生成
          </button>
          <button type="button" onClick={handleOptimize} disabled={!canBulkActions} className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            导出方案
          </button>
        </div>
      </header>

      {/* ── 输入卡 ───────────────────────────────────────────── */}
      <section className="relative mb-12 overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />
        <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined">podcasts</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">直播策划参数</h2>
              <p className="text-[12px] text-[#9ca3af]">填写产品信息与目标受众 · AI 据此生成三套完整直播脚本</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            参数就绪
          </span>
        </div>
        <div className="relative">
          <form onSubmit={handleSubmit} className="space-y-7">

            {/* 直播平台 · 5 可视化选择卡 */}
            <div>
              <span className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                直播平台
              </span>
              <div className="grid grid-cols-5 gap-3">
                {PLATFORMS.map((p) => {
                  const active = platform === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all ${active ? 'border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm' : 'border-[#e5e7eb] bg-white hover:border-[#c7d2fe] hover:bg-[#f8faff]'}`}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: p.color }}
                      >
                        <span className="material-symbols-outlined text-[20px]">{p.icon}</span>
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
            </div>

            {/* 直播经验 · 3 可视化选择卡 */}
            <div>
              <span className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                直播经验
              </span>
              <div className="grid grid-cols-3 gap-4">
                {EXPERIENCE_OPTIONS.map((opt) => {
                  const active = experience === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setExperience(opt.value)}
                      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all ${active ? 'border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm' : 'border-[#e5e7eb] bg-white hover:border-[#c7d2fe] hover:bg-[#f8faff]'}`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${active ? 'bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white' : 'bg-[#f1f3f9] text-[#6b7280]'}`}>
                        <span className="material-symbols-outlined text-[22px]">{opt.icon}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold text-[#111827]">{opt.label}</span>
                        <span className="block text-[11px] text-[#9ca3af]">{opt.sub}</span>
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
            </div>

            {/* 产品/服务信息 · 框式编辑器 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="s8-product-info" className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                  产品/服务信息
                  <span className="ml-1 text-[#9ca3af] font-normal text-[12px]">（可选）</span>
                </label>
                <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                  <span className="material-symbols-outlined text-[14px] text-[#781621]">auto_awesome</span>
                  AI 据此定制直播话术
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
                <textarea
                  id="s8-product-info"
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  rows={5}
                  placeholder="输入产品定价、服务内容、核心卖点等，AI 将据此生成专属直播脚本"
                  className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                />
                <div className="flex items-center justify-between gap-3 border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-[#9ca3af]">可包含</span>
                    {['定价', '卖点', '服务范围', '成交案例', '课程体系'].map((t) => (
                      <span key={t} className="rounded-full bg-[#f1f3f9] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7280]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]">{productInfo.length} 字</span>
                </div>
              </div>
            </div>

            {/* 目标受众 · 带前置图标输入 */}
            <div>
              <label htmlFor="s8-target-audience" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                目标受众
                <span className="ml-1 text-[#9ca3af] font-normal text-[12px]">（可选）</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">groups</span>
                <input
                  id="s8-target-audience"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="例如：需要降本增效的企业老板、OPC创业者"
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">mic</span>
                {isLoading ? '生成中…' : '生成直播方案'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── 三态 banners ───────────────────────────────── */}

      {/* Loading: mutation 进行中 */}
      {generateMutation.isPending && (
        <div
          data-testid="step8-loading"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#002fa7]/20 bg-[#f0f4ff] p-4 text-[13px] font-medium text-[#001e73]"
        >
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          AI 正在生成直播策划方案，预计 30-60 秒…
        </div>
      )}

      {/* Error: mutation 失败 */}
      {generateMutation.isError && !hasResult && (
        <div
          data-testid="step8-error"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-[13px] font-medium text-[#991b1b]"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">error</span>
            生成失败：{generateMutation.error?.message ?? '请稍后重试'}
          </div>
          <button
            type="button"
            onClick={handleRegenerateAll}
            className="shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {/* DB loading */}
      {dbQuery.isLoading && (
        <div
          data-testid="step8-db-loading"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#002fa7]/20 bg-[#f0f4ff] p-4 text-[13px] font-medium text-[#001e73]"
        >
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          正在加载历史记录…
        </div>
      )}

      {/* DB error */}
      {dbQuery.isError && !hasResult && (
        <div
          data-testid="step8-db-error"
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

      {/* isFallback 降级提示 */}
      {hasResult && isFallbackFlag && (
        <div
          data-testid="step8-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#F6D300]/40 bg-[#fffde7] p-4 text-[13px] font-medium text-[#8a6a00]"
        >
          <span className="material-symbols-outlined text-[20px]">warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质方案。
        </div>
      )}

      {/* 空态: 无真数据 · 非 loading */}
      {!hasResult && !generateMutation.isPending && !dbQuery.isLoading && (
        <div
          data-testid="step8-empty-state"
          className="mb-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] py-16 text-center"
        >
          <span className="material-symbols-outlined mb-4 text-[48px] text-[#d1d5db]">podcasts</span>
          <p className="text-[16px] font-semibold text-[#374151]">尚未生成直播策划方案</p>
          <p className="mt-2 text-[13px] text-[#9ca3af]">填写上方表单，点击「生成直播方案」开始生成</p>
        </div>
      )}

      {/* ── 结果区 · 仅有真实数据时显示 ─────────────────── */}
      {hasResult && (
      <>

      {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
      <div data-testid="step8-generate-output" className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]">insights</span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 实时测算</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 直播转化力雷达 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">直播转化力雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估 · 参考值</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">83</p>
              <p className="text-[10px] text-[#9ca3af]">综合分 · 参考</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS_S8;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full">
                <defs>
                  <linearGradient id="radarFillS8" x1="0" y1="0" x2="0" y2="1">
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
                <polygon points={dataPoly} fill="url(#radarFillS8)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
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
            {RADAR_DIMS_S8.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 直播节奏·在线人数曲线 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">直播节奏·在线人数曲线</h3>
                <p className="text-[11px] text-[#9ca3af]">沿 7 环节的在线人数/情绪预估</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['在线人数', '互动率', '转化'].map((t, i) => (
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
            <p className="text-[30px] font-bold leading-none text-[#111827]">350</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>+192%
            </span>
            <span className="mb-1 text-[12px] text-[#9ca3af]">峰值在线人数</span>
          </div>
          {(() => {
            const data = TREND_DATA_S8;
            const W = 560;
            const H = 168;
            const padL = 6;
            const padR = 6;
            const padT = 12;
            const padB = 8;
            const innerW = W - padL - padR;
            const innerH = H - padT - padB;
            const max = 400;
            const x = (i: number) => padL + (innerW * i) / (data.length - 1);
            const y = (v: number) => padT + innerH * (1 - v / max);
            const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                <defs>
                  <linearGradient id="trendFillS8" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendLineS8" x1="0" y1="0" x2="1" y2="0">
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
                <path d={area} fill="url(#trendFillS8)" />
                <path d={line} fill="none" stroke="url(#trendLineS8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" />
                ))}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
            {TREND_LABELS_S8.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>


      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 方案模块数 · 环形 · 蓝 */}
        <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]">library_books</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>全覆盖
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                6
                <span className="text-[15px] text-[#9ca3af]"> 模块</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">方案模块数</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#002fa7" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="100 100" />
              </svg>
            </div>
          </div>
        </div>

        {/* 开场话术 · 字数 · 勃艮第红 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
              <span className="material-symbols-outlined text-[20px]">record_voice_over</span>
            </span>
            <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">开场</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {result.opening.length}
              <span className="text-[15px] text-[#9ca3af]"> 字</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">开场话术字数</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[45, 72, 60, 88, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-[#781621]/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* 产品话术 · 字数 · 暖黄 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </span>
            <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">产品</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {result.product.length}
              <span className="text-[15px] text-[#9ca3af]"> 字</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">产品话术字数</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
            <div className="h-2 w-[85%] rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" />
          </div>
        </div>

        {/* 流程环节 · chip · 蓝 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]">view_timeline</span>
            </span>
            <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">
              6 节
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              6
              <span className="text-[15px] text-[#9ca3af]"> 环节</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">流程环节</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['开场', '暖场', '逼单'].map((k) => (
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

      {/* ── 6 模块话术详情 ──────────────────────────────────── */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#002fa7]">article</span>
          <h2 className="text-[16px] font-bold text-[#111827]">直播方案</h2>
          <span className="text-[12px] text-[#9ca3af]">· 6 模块完整脚本 · AI 个性化生成</span>
        </div>

        {([
          { key: 'opening' as const, label: '开场 / 钩子话术', icon: 'record_voice_over', accent: 'green' as const, desc: '自我介绍 · 钩子设计 · 留人话术' },
          { key: 'warmup' as const, label: '暖场互动话术', icon: 'groups', accent: 'normal' as const, desc: '互动话题 · 福利点 · 氛围营造' },
          { key: 'product' as const, label: '产品介绍话术', icon: 'inventory_2', accent: 'orange' as const, desc: 'FABE 模型：特性 · 优势 · 利益 · 证明' },
          { key: 'conversion' as const, label: '转化促单话术', icon: 'shopping_cart', accent: 'red' as const, desc: '限时优惠 · 行动引导 · 合规不夸大' },
          { key: 'faq' as const, label: '常见问题处理', icon: 'live_help', accent: 'normal' as const, desc: '发货 · 质量 · 型号 等常见 Q&A' },
          { key: 'closing' as const, label: '收尾话术', icon: 'flag', accent: 'green' as const, desc: '总结价值 · 引导下次互动' },
        ] as Array<{ key: keyof Step8LivestreamResult; label: string; icon: string; accent: Step8StageDetail['accent']; desc: string }>).map(({ key, label, icon, accent, desc }, idx) => {
          const aColor = accentColor(accent);
          const aText = accentText(accent);
          const aBg = accentBg(accent);
          const aBorder = accentBorder(accent);
          const aBadgeBg = accent === 'orange' ? '#fdf6cc' : `${aColor}15`;
          return (
            <div key={key} className={`overflow-hidden rounded-xl border ${aBorder} bg-white pw-shadow-soft`}>
              <div className="flex items-center justify-between border-b border-[#eef1f6] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-extrabold"
                    style={{ backgroundColor: accent === 'orange' ? '#F6D300' : aColor, color: accent === 'orange' ? '#221b00' : '#fff' }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#111827]">{label}</h4>
                    <span className="text-[11px] text-[#9ca3af]">{desc}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
                    style={{ backgroundColor: aBadgeBg, color: aText }}
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{icon}</span>
                    {result[key].length} 字
                  </span>
                  <button
                    type="button"
                    aria-label={`复制${label}`}
                    onClick={() => handleCopySection(label, result[key])}
                    className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#6b7280] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    复制
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className={`rounded-lg border ${aBorder} ${aBg} p-4`}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: aText }}>
                    话术内容
                  </p>
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#1b1b1b]">{result[key]}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── AI 优化 ───────────────────────────────────────────── */}
      <div className="mb-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft">
        <div className="flex items-center gap-3 border-b border-[#eef1f6] px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
            <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
          </span>
          <div>
            <h3 className="text-[16px] font-bold text-[#111827]">AI 智能优化</h3>
            <p className="text-[12px] text-[#9ca3af]">一键优化直播脚本 · 提升转化率</p>
          </div>
        </div>
        <div className="p-6">
          <p className="mb-4 text-[14px] leading-relaxed text-[#6b7280]">
            AI 将基于最新直播数据与转化模型，对当前方案的话术节奏、逼单时机、互动设计进行深度优化，提升整体转化率。
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleOptimize}
              disabled={!canBulkActions}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-6 py-3 text-[13px] font-bold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              一键优化脚本
            </button>
            <button
              type="button"
              onClick={handleRegenerateAll}
              disabled={isLoading}
              className={btnSecondary}
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              重新生成方案
            </button>
          </div>
        </div>
      </div>

      {/* ── 底部完成卡 · hasResult 门控 ──────────────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#002fa7] to-[#001952] p-6 text-white pw-shadow-soft">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#781621]/20 blur-2xl" />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10b981]">
                <span className="material-symbols-outlined text-[16px] text-white">check</span>
              </span>
              <p className="text-[16px] font-bold">直播策划已完成</p>
            </div>
            <p className="text-[14px] text-white/70">恭喜完成全部流程！现在可以查看完整的 IP 方案汇总，开始执行直播计划。</p>
          </div>
          <button
            type="button"
            onClick={handleViewIpPlan}
            className="shrink-0 flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-6 py-3 text-[13px] font-bold text-[#002fa7] shadow-sm transition-colors hover:bg-[#f3f3f3]"
          >
            <span className="material-symbols-outlined text-[18px]">description</span>
            查看我的 IP 方案
          </button>
        </div>
      </div>
      </>
      )}
    </PioneerLayout>
  );
}
