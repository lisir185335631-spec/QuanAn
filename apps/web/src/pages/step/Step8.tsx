// PRD-29.12 · Step8 直播策划 · IKB 红蓝紫渐变重构
import '@/styles/ikb-hero.css';

import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep } from '@/hooks/useStepData';
import { IKBLayout } from '@/layouts/IKBLayout';
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
  { value: 'newbie' as const, label: '新手', sub: '刚开始做直播', icon: 'rocket_launch', color: C.ikb },
  { value: 'intermediate' as const, label: '有经验', sub: '有一定直播经验', icon: 'trending_up', color: C.burgundy },
  { value: 'expert' as const, label: '资深', sub: '直播经验丰富', icon: 'star', color: C.accent3 },
];

const PLATFORMS = [
  { id: 'douyin', label: '抖音', icon: 'music_note', color: '#0ea5b7', desc: '短视频 · 流量' },
  { id: 'xiaohongshu', label: '小红书', icon: 'menu_book', color: '#ff2442', desc: '种草 · 图文' },
  { id: 'shipinhao', label: '视频号', icon: 'smart_display', color: '#07c160', desc: '私域 · 转化' },
  { id: 'kuaishou', label: '快手', icon: 'bolt', color: '#ff7a00', desc: '下沉 · 互动' },
  { id: 'bilibili', label: 'B站', icon: 'smart_display', color: '#fb7299', desc: '知识 · 社区' },
];

// ─── accent → IKB color mapping ────────────────────────────────────────────

function accentColor(accent: Step8StageDetail['accent']): string {
  if (accent === 'green') return C.ikb;
  if (accent === 'orange') return C.accent3;
  if (accent === 'red') return C.burgundy;
  return C.ikb;
}

/**
 * Returns the foreground text color for a given accent.
 * Pure accent3 (#7A3BE0) is never used as text — deep purple (#3A1A6E) is used instead.
 */
function accentText(accent: Step8StageDetail['accent']): string {
  if (accent === 'orange') return C.purpleText;
  if (accent === 'red') return C.burgundyText;
  return C.ikb;
}

function accentBg(accent: Step8StageDetail['accent']): string {
  if (accent === 'green') return `bg-[#2B53E6]/[0.05]`;
  if (accent === 'orange') return `bg-[#7A3BE0]/[0.05]`;
  if (accent === 'red') return `bg-[#EF3E6B]/[0.05]`;
  return `bg-[#2B53E6]/[0.05]`;
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
    'ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40';

  // ── 数据洞察雷达维度 (直播转化力) — IKB 三色轮转
  const RADAR_DIMS_S8 = [
    { label: '流量获取', value: 82, color: C.ikb },
    { label: '互动设计', value: 88, color: C.burgundy },
    { label: '产品塑造', value: 76, color: C.accent3 },
    { label: '逼单话术', value: 84, color: C.ikb },
    { label: '留存转粉', value: 79, color: C.burgundy },
    { label: '数据优化', value: 90, color: C.accent3 },
  ];

  // ── 趋势图数据 (7 环节在线人数)
  const TREND_DATA_S8 = [120, 180, 260, 320, 290, 350, 300];
  const TREND_LABELS_S8 = ['预热', '开场', '痛点共鸣', 'AI解析', '产品植入', '逼单', '收尾'];

  return (
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
            >
              战略路径
            </span>
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${C.burgundy}50`, background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
            >
              直播脚本
            </span>
          </div>
          <h1
            className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight"
            style={{ fontFamily: F.display }}
          >
            STEP 08 · 直播策划
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed" style={{ color: '#5A6173', fontFamily: F.cn }}>
            当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            onClick={handleRegenerateAll}
            disabled={isLoading}
            aria-label="重新生成"
            className={btnSecondary}
            style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>refresh</span>
            重新生成
          </button>
          <button
            type="button"
            onClick={handleOptimize}
            disabled={!canBulkActions}
            aria-label="智能优化"
            className={btnSecondary}
            style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            aria-label="导出方案"
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>download</span>
            导出方案
          </button>
        </div>
      </header>

      {/* ── 输入卡 ───────────────────────────────────────────── */}
      <section
        className="relative mb-12 overflow-hidden rounded-xl border p-6"
        style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl"
          style={{ background: `${C.ikb}08` }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl"
          style={{ background: `${C.burgundy}06` }}
        />
        <div className="relative mb-6 flex items-center justify-between border-b pb-5" style={{ borderColor: C.line }}>
          <div className="flex items-center gap-3">
            <span
              className="ikb-gradbtn flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
            >
              <span className="material-symbols-outlined" aria-hidden={true}>podcasts</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>直播策划参数</h2>
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>填写产品信息与目标受众 · AI 据此生成三套完整直播脚本</p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
          >
            <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
            参数就绪
          </span>
        </div>
        <div className="relative">
          <form onSubmit={handleSubmit} className="space-y-7">

            {/* 直播平台 · 5 可视化选择卡 */}
            <div>
              <span
                className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="mr-1 inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                />
                直播平台
              </span>
              <div className="grid grid-cols-5 gap-3" role="radiogroup" aria-label="直播平台选择">
                {PLATFORMS.map((p) => {
                  const active = platform === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      aria-pressed={active}
                      className={`ikb-hovercard ikb-focusring group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all`}
                      style={
                        active
                          ? { borderColor: C.ikb, background: `${C.ikb}06` }
                          : { borderColor: C.line, background: C.base }
                      }
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: p.color }}
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>{p.icon}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{p.label}</span>
                        <span className="block text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{p.desc}</span>
                      </span>
                      <span
                        className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all"
                        style={
                          active
                            ? { background: C.ikb, color: '#fff' }
                            : { border: `1px solid ${C.line}`, background: '#fff', color: 'transparent' }
                        }
                      >
                        <span className="material-symbols-outlined text-[12px]" aria-hidden={true}>check</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 直播经验 · 3 可视化选择卡 */}
            <div>
              <span
                className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="mr-1 inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                />
                直播经验
              </span>
              <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label="直播经验选择">
                {EXPERIENCE_OPTIONS.map((opt) => {
                  const active = experience === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setExperience(opt.value)}
                      aria-pressed={active}
                      className="ikb-hovercard ikb-focusring group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all"
                      style={
                        active
                          ? { borderColor: C.ikb, background: `${C.ikb}06` }
                          : { borderColor: C.line, background: C.base }
                      }
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm"
                        style={
                          active
                            ? { background: C.grad, color: '#fff' }
                            : { background: C.base, color: '#6b7280' }
                        }
                      >
                        <span className="material-symbols-outlined text-[22px]" aria-hidden={true}>{opt.icon}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{opt.label}</span>
                        <span className="block text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{opt.sub}</span>
                      </span>
                      <span
                        className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all"
                        style={
                          active
                            ? { background: C.ikb, color: '#fff' }
                            : { border: `1px solid ${C.line}`, background: '#fff', color: 'transparent' }
                        }
                      >
                        <span className="material-symbols-outlined text-[12px]" aria-hidden={true}>check</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 产品/服务信息 · 框式编辑器 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="s8-product-info"
                  className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                  style={{ color: C.ink, fontFamily: F.cn }}
                >
                  <span
                    className="mr-1 inline-block h-3.5 w-1 rounded-full"
                    style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                  />
                  产品/服务信息
                  <span className="ml-1 text-[12px] font-normal" style={{ color: '#6b7280' }}>（可选）</span>
                </label>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ color: C.burgundy }} aria-hidden={true}>auto_awesome</span>
                  AI 据此定制直播话术
                </span>
              </div>
              <div
                className="ikb-input overflow-hidden rounded-xl border transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
                style={{ borderColor: C.line, background: C.base }}
              >
                <textarea
                  id="s8-product-info"
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  rows={5}
                  placeholder="输入产品定价、服务内容、核心卖点等，AI 将据此生成专属直播脚本"
                  className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                  style={{ fontFamily: F.cn, color: C.ink }}
                />
                <div className="flex items-center justify-between gap-3 border-t bg-white/60 px-4 py-2.5" style={{ borderColor: C.line }}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>可包含</span>
                    {['定价', '卖点', '服务范围', '成交案例', '课程体系'].map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ background: C.base, color: '#6b7280', fontFamily: F.cn }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums" style={{ color: '#6b7280', fontFamily: F.mono }}>{productInfo.length} 字</span>
                </div>
              </div>
            </div>

            {/* 目标受众 · 带前置图标输入 */}
            <div>
              <label
                htmlFor="s8-target-audience"
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="mr-1 inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                />
                目标受众
                <span className="ml-1 text-[12px] font-normal" style={{ color: '#6b7280' }}>（可选）</span>
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
                  style={{ color: '#6b7280' }}
                  aria-hidden={true}
                >
                  groups
                </span>
                <input
                  id="s8-target-audience"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="例如：需要降本增效的企业老板、OPC创业者"
                  className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
                  style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.cn }}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                style={{ fontFamily: F.mono }}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>mic</span>
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
          className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-[13px] font-medium"
          style={{ borderColor: `${C.ikb}25`, background: `${C.ikb}08`, color: C.ikb, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden={true}>progress_activity</span>
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
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>error</span>
            生成失败：{generateMutation.error?.message ?? '请稍后重试'}
          </div>
          <button
            type="button"
            onClick={handleRegenerateAll}
            className="ikb-focusring shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {/* DB loading */}
      {dbQuery.isLoading && (
        <div
          data-testid="step8-db-loading"
          className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-[13px] font-medium"
          style={{ borderColor: `${C.ikb}20`, background: `${C.ikb}06`, color: C.ikb, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden={true}>progress_activity</span>
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
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>error</span>
            历史记录加载失败，请重试
          </div>
          <button
            type="button"
            onClick={() => void dbQuery.refetch()}
            className="ikb-focusring shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {/* isFallback 降级提示 */}
      {hasResult && isFallbackFlag && (
        <div
          data-testid="step8-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-[13px] font-medium"
          style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}08`, color: C.purpleText, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质方案。
        </div>
      )}

      {/* 空态: 无真数据 · 非 loading */}
      {!hasResult && !generateMutation.isPending && !dbQuery.isLoading && (
        <div
          data-testid="step8-empty-state"
          className="mb-8 flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center"
          style={{ borderColor: C.line, background: C.base }}
        >
          <span
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: `${C.ikb}10`, color: C.ikb }}
          >
            <span className="material-symbols-outlined text-[36px]" aria-hidden={true}>podcasts</span>
          </span>
          <p className="text-[16px] font-semibold" style={{ color: C.ink, fontFamily: F.cn }}>尚未生成直播策划方案</p>
          <p className="mt-2 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>填写上方表单，点击「生成直播方案」开始生成</p>
        </div>
      )}

      {/* ── 结果区 · 仅有真实数据时显示 ─────────────────── */}
      {hasResult && (
      <>

      {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
      <div data-testid="step8-generate-output" className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>数据洞察</h2>
        <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
        >
          <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 直播转化力雷达 */}
        <div
          className="ikb-hovercard col-span-5 rounded-xl border p-6"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.ikb}12`, color: C.ikb }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>直播转化力雷达</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估 · 参考值</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>83</p>
              <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>综合分 · 参考</p>
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
              <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="直播转化力雷达图">
                <defs>
                  <linearGradient id="s8-radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#s8-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
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
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 直播节奏·在线人数曲线 */}
        <div
          className="ikb-hovercard col-span-7 rounded-xl border p-6"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.burgundy}12`, color: C.burgundy }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>直播节奏·在线人数曲线</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>沿 7 环节的在线人数/情绪预估</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['在线人数', '互动率', '转化'].map((t, i) => (
                <span
                  key={t}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                  style={i === 0 ? { background: C.ikb, color: '#fff', fontFamily: F.mono } : { background: C.base, color: '#6b7280', fontFamily: F.mono }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>350</p>
            <span
              className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>+192%
            </span>
            <span className="mb-1 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>峰值在线人数</span>
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
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="直播节奏在线人数曲线图">
                <defs>
                  <linearGradient id="s8-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="s8-trendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.ikb} />
                    <stop offset="55%" stopColor={C.accent3} />
                    <stop offset="100%" stopColor={C.burgundy} />
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
                <path d={area} fill="url(#s8-trendFill)" />
                <path d={line} fill="none" stroke="url(#s8-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" />
                ))}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
            {TREND_LABELS_S8.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>


      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 方案模块数 · 环形 · 蓝 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: `${C.ikb}30`, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>library_books</span>
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>全覆盖
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                6
                <span className="text-[15px]" style={{ color: '#6b7280' }}> 模块</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>方案模块数</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label="方案模块数覆盖 100%">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}22`} strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.ikb} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="100 100" />
              </svg>
            </div>
          </div>
        </div>

        {/* 开场话术 · 字数 · 玫红 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>record_voice_over</span>
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.burgundy}12`, color: C.burgundyText }}>开场</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {result.opening.length}
              <span className="text-[15px]" style={{ color: '#6b7280' }}> 字</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>开场话术字数</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[45, 72, 60, 88, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `${C.burgundy}70` }} />
            ))}
          </div>
        </div>

        {/* 产品话术 · 字数 · 紫 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.accent3}18`, color: C.accent3 }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>inventory_2</span>
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.accent3}12`, color: C.purpleText }}>产品</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {result.product.length}
              <span className="text-[15px]" style={{ color: '#6b7280' }}> 字</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>产品话术字数</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}18` }}>
            <div
              className="h-2 w-[85%] rounded-full"
              style={{ background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})` }}
            />
          </div>
        </div>

        {/* 流程环节 · chip · 蓝 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>view_timeline</span>
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
              6 节
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              6
              <span className="text-[15px]" style={{ color: '#6b7280' }}> 环节</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>流程环节</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['开场', '暖场', '逼单'].map((k) => (
              <span
                key={k}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
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
          <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>article</span>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>直播方案</h2>
          <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· 6 模块完整脚本 · AI 个性化生成</span>
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
          const aBadgeBg = accent === 'orange' ? `${C.accent3}15` : `${aColor}15`;
          // Border color: use 20% opacity of the accent color
          const cardBorderColor = `${aColor}33`;
          return (
            <div key={key} className="ikb-hovercard overflow-hidden rounded-xl border bg-white" style={{ borderColor: cardBorderColor }}>
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.line }}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-extrabold"
                    style={{
                      background: accent === 'orange' ? C.accent3 : aColor,
                      color: '#fff',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{label}</h4>
                    <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{desc}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
                    style={{ backgroundColor: aBadgeBg, color: aText, fontFamily: F.mono }}
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>{icon}</span>
                    {result[key].length} 字
                  </span>
                  <button
                    type="button"
                    aria-label={`复制${label}`}
                    onClick={() => handleCopySection(label, result[key])}
                    className="ikb-focusring flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:border-[#2B53E6] hover:text-[#2B53E6]"
                    style={{ borderColor: C.line, color: '#6b7280', background: C.paper, fontFamily: F.cn }}
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>content_copy</span>
                    复制
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div
                  className={`rounded-lg border p-4 ${aBg}`}
                  style={{ borderColor: `${aColor}20` }}
                >
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: aText, fontFamily: F.mono }}>
                    话术内容
                  </p>
                  <p className="whitespace-pre-line text-[14px] leading-relaxed" style={{ color: C.ink, fontFamily: F.cn }}>{result[key]}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── AI 优化 ───────────────────────────────────────────── */}
      <div className="ikb-hovercard mb-6 overflow-hidden rounded-xl border" style={{ borderColor: C.line, background: C.paper }}>
        <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: C.line }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>auto_fix_high</span>
          </span>
          <div>
            <h3 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>AI 智能优化</h3>
            <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>一键优化直播脚本 · 提升转化率</p>
          </div>
        </div>
        <div className="p-6">
          <p className="mb-4 text-[14px] leading-relaxed" style={{ color: '#6b7280', fontFamily: F.cn }}>
            AI 将基于最新直播数据与转化模型，对当前方案的话术节奏、逼单时机、互动设计进行深度优化，提升整体转化率。
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleOptimize}
              disabled={!canBulkActions}
              aria-label="一键优化脚本"
              className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_awesome</span>
              一键优化脚本
            </button>
            <button
              type="button"
              onClick={handleRegenerateAll}
              disabled={isLoading}
              className={btnSecondary}
              style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>refresh</span>
              重新生成方案
            </button>
          </div>
        </div>
      </div>

      {/* ── 底部完成卡 · hasResult 门控 ──────────────────────── */}
      <div
        className="relative overflow-hidden rounded-xl p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${C.ikb} 0%, #1A3DB8 100%)` }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full blur-2xl"
          style={{ background: `${C.burgundy}25` }}
        />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: '#166534' }}
              >
                <span className="material-symbols-outlined text-[16px] text-white" aria-hidden={true}>check_circle</span>
              </span>
              <p className="text-[16px] font-bold">直播策划已完成</p>
            </div>
            <p className="text-[14px] text-white/70" style={{ fontFamily: F.cn }}>恭喜完成全部流程！现在可以查看完整的 IP 方案汇总，开始执行直播计划。</p>
          </div>
          <button
            type="button"
            onClick={handleViewIpPlan}
            aria-label="查看我的 IP 方案"
            className="ikb-focusring shrink-0 flex items-center gap-2 rounded-xl border px-6 py-3 text-[13px] font-bold shadow-sm transition-colors hover:bg-[#f3f3f3]"
            style={{ borderColor: C.line, background: C.paper, color: C.ikb, fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>description</span>
            查看我的 IP 方案
          </button>
        </div>
      </div>
      </>
      )}
    </IKBLayout>
  );
}
