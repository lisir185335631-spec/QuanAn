// PRD-29.14 · Step5 爆款选题库 · 先锋白 PioneerLayout 重构 · 接真后端
// Fix: per-category stepKeys (step5_traffic…step5_case) → each row written independently, no DB race
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import { PioneerLayout } from '@/layouts/PioneerLayout';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';

// ─── Types ─────────────────────────────────────────────────────────────────────

// Backend category keys (from TopicAgent / stepData router)
type BackendCategoryId = 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case';

// Page display category ids (internally aligned to backend · 'monetize' not 'monetization')
type Step5CategoryId = BackendCategoryId;

interface Step5FormData {
  industry: string;
  product: string;
}

interface Step5Category {
  id: Step5CategoryId;
  name: string;
  subtitle: string;
  icon: string; // Material Symbols icon name
  color: string;
  count: number;
}

interface Step5TopicItem {
  index: number;
  title: string;
  platform: string;
  difficulty: 'simple' | 'medium' | 'hard';
  difficultyLabel: string;
  rating: number;
}

// Shape of result stored in DB / returned by save
// TopicOutput: { category: BackendCategoryId, topics: [{title, hook, structure, formula, viralPotential}] }
type TopicSaveResult = RouterOutputs['stepData']['save'];
type StepDataGetResult = RouterOutputs['stepData']['get'];

// Per-category stepKey map — each category writes to its own DB row (no race condition)
const CATEGORY_STEP_KEY: Record<BackendCategoryId, string> = {
  traffic:   'step5_traffic',
  monetize:  'step5_monetize',
  persona:   'step5_persona',
  cognition: 'step5_cognition',
  case:      'step5_case',
};

// Runtime guard: one category result
function isTopicOutput(x: unknown): x is { category: BackendCategoryId; topics: Array<{ title: string; viralPotential: string }> } {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.category === 'string' &&
    ['traffic', 'monetize', 'persona', 'cognition', 'case'].includes(r.category) &&
    Array.isArray(r.topics)
  );
}

// Map backend TopicOutput → page Step5TopicItem[]
function mapTopicItems(
  topics: Array<{ title: string; viralPotential?: string }>,
): Step5TopicItem[] {
  return topics.map((t, idx) => {
    const vp = t.viralPotential as 'low' | 'medium' | 'high' | undefined;
    let difficulty: 'simple' | 'medium' | 'hard';
    let difficultyLabel: string;
    let rating: number;
    if (vp === 'high') {
      difficulty = 'simple';
      difficultyLabel = '简单';
      rating = 5;
    } else if (vp === 'low') {
      difficulty = 'hard';
      difficultyLabel = '困难';
      rating = 3;
    } else {
      difficulty = 'medium';
      difficultyLabel = '中等';
      rating = 4;
    }
    return {
      index: idx + 1,
      title: t.title ?? '',
      platform: 'douyin',
      difficulty,
      difficultyLabel,
      rating,
    };
  });
}

// Extract one category result from mutation data or dbQuery data
function extractCategoryResult(
  raw: unknown,
): { category: BackendCategoryId; items: Step5TopicItem[] } | null {
  if (!raw || typeof raw !== 'object') return null;
  // Could be TopicOutput directly, or a StepData row with .result
  const asRow = raw as Record<string, unknown>;
  // StepData row shape: { stepKey, inputs, result, isFallback, ... }
  if (asRow.result !== undefined) {
    return extractCategoryResult(asRow.result);
  }
  if (isTopicOutput(raw)) {
    return {
      category: (raw as { category: BackendCategoryId }).category,
      items: mapTopicItems(
        (raw as { topics: Array<{ title: string; viralPotential?: string }> }).topics,
      ),
    };
  }
  return null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_FORM: Step5FormData = {
  industry: '其他行业',
  product: '定制智能体和opc培训',
};

const CATEGORIES: Step5Category[] = [
  { id: 'traffic',   name: '流量型选题',  subtitle: '追热点、蹭流量、快速涨粉',  icon: 'trending_up',  color: '#002fa7', count: 20 },
  { id: 'monetize',  name: '变现型选题',  subtitle: '直接带货、引流变现',          icon: 'payments',     color: '#781621', count: 20 },
  { id: 'persona',   name: '人设型选题',  subtitle: '打造个人品牌、建立信任',      icon: 'groups',       color: '#002fa7', count: 20 },
  { id: 'cognition', name: '认知型选题',  subtitle: '输出价值、建立专业形象',      icon: 'psychology',   color: '#781621', count: 20 },
  { id: 'case',      name: '案例型选题',  subtitle: '真实案例、社会证明',          icon: 'menu_book',    color: '#002fa7', count: 20 },
];

const ALL_CATEGORY_IDS: BackendCategoryId[] = ['traffic', 'monetize', 'persona', 'cognition', 'case'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function difficultyStyle(d: 'simple' | 'medium' | 'hard'): { bg: string; text: string; border: string } {
  if (d === 'simple') return { bg: '#10b981', text: '#fff', border: '#10b981' };
  if (d === 'hard')   return { bg: '#781621', text: '#fff', border: '#781621' };
  // medium: 暖黄底 深字
  return { bg: '#F6D300', text: '#221b00', border: '#e0c200' };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="material-symbols-outlined icon-fill text-[14px]"
          style={{ color: s <= rating ? '#F6D300' : '#9ca3af' }}
          aria-hidden="true"
        >
          star
        </span>
      ))}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Step5() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const [industry, setIndustry] = useState(DEFAULT_FORM.industry);
  const [product, setProduct] = useState(DEFAULT_FORM.product);
  const [activeCategory, setActiveCategory] = useState<Step5CategoryId>('traffic');
  const [searchQuery, setSearchQuery] = useState('');

  // Accumulated real topics per category (populated by save mutations + per-category dbQueries)
  const [realTopics, setRealTopics] = useState<Partial<Record<BackendCategoryId, Step5TopicItem[]>>>({});

  // ── tRPC: one mutation per active session (accumulates results via onSuccess) ──────

  const saveMutation = trpc.stepData.save.useMutation({
    onSuccess: (data: TopicSaveResult) => {
      const mutData = data as { ok?: boolean; data?: unknown };
      const extracted = extractCategoryResult(mutData?.data);
      if (extracted) {
        setRealTopics((prev) => ({ ...prev, [extracted.category]: extracted.items }));
      }
    },
    onError: (err) => {
      toast.error(err.message || '生成失败，请重试');
    },
  });

  // ── tRPC: per-category DB queries (step5_traffic … step5_case) ─────────────────
  // Each category reads from its own row → no race condition, refresh preserves all 5.
  const trafficQuery  = trpc.stepData.get.useQuery({ stepKey: 'step5_traffic'   }, { enabled: accountId !== null, staleTime: 30_000, retry: false });
  const monetizeQuery = trpc.stepData.get.useQuery({ stepKey: 'step5_monetize'  }, { enabled: accountId !== null, staleTime: 30_000, retry: false });
  const personaQuery  = trpc.stepData.get.useQuery({ stepKey: 'step5_persona'   }, { enabled: accountId !== null, staleTime: 30_000, retry: false });
  const cognitionQuery = trpc.stepData.get.useQuery({ stepKey: 'step5_cognition' }, { enabled: accountId !== null, staleTime: 30_000, retry: false });
  const caseQuery     = trpc.stepData.get.useQuery({ stepKey: 'step5_case'      }, { enabled: accountId !== null, staleTime: 30_000, retry: false });

  const categoryQueries: Record<BackendCategoryId, typeof trafficQuery> = {
    traffic:   trafficQuery,
    monetize:  monetizeQuery,
    persona:   personaQuery,
    cognition: cognitionQuery,
    case:      caseQuery,
  };

  // Any per-category DB query loading
  const dbIsLoading = Object.values(categoryQueries).some((q) => q.isLoading);
  const dbIsError   = Object.values(categoryQueries).some((q) => q.isError);

  // On mount / per-query data: restore each category's result from DB
  useEffect(() => {
    for (const [cat, query] of Object.entries(categoryQueries) as Array<[BackendCategoryId, typeof trafficQuery]>) {
      if (!query.data) continue;
      const row = query.data as StepDataGetResult;
      if (!row) continue;
      // Restore form inputs from any available row
      const inputs = row.inputs as Record<string, unknown> | null;
      if (inputs) {
        if (typeof inputs.industry === 'string') setIndustry((prev) => prev === DEFAULT_FORM.industry ? inputs.industry as string : prev);
        if (typeof inputs.product === 'string') setProduct((prev) => prev === DEFAULT_FORM.product ? inputs.product as string : prev);
      }
      // Restore category topics
      const extracted = extractCategoryResult(row.result);
      if (extracted) {
        setRealTopics((prev) => {
          if (prev[cat]) return prev; // don't overwrite session result
          return { ...prev, [cat]: extracted.items };
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trafficQuery.data, monetizeQuery.data, personaQuery.data, cognitionQuery.data, caseQuery.data]);

  // isLoading: mutation is pending (any in-flight save)
  const isLoading = saveMutation.isPending;

  // Also derive from saveMutation.data directly (covers pre-set mock data in tests + same-render reads)
  const sessionRaw = (saveMutation.data as { ok?: boolean; data?: unknown } | undefined)?.data;
  const sessionExtracted = extractCategoryResult(sessionRaw);

  // Merge: realTopics (accumulated via onSuccess + DB restore) + any direct session result
  const mergedTopics: Partial<Record<BackendCategoryId, Step5TopicItem[]>> = sessionExtracted
    ? { ...realTopics, [sessionExtracted.category]: sessionExtracted.items }
    : realTopics;

  // hasResult: at least one category has real topics
  const hasResult = Object.keys(mergedTopics).length > 0;

  // isFallback: from ANY per-category DB query OR from latest mutation result
  const mutIsFallback = (saveMutation.data as { ok?: boolean; data?: { isFallback?: boolean } } | undefined)?.data?.isFallback ?? false;
  const dbIsFallback = Object.values(categoryQueries).some((q) => (q.data as { isFallback?: boolean } | null)?.isFallback);
  const isFallbackFlag = mutIsFallback || dbIsFallback;

  // Current category topics (real or empty)
  const currentTopics: Step5TopicItem[] = mergedTopics[activeCategory] ?? [];
  const filteredTopics = searchQuery.trim()
    ? currentTopics.filter((t) => t.title.includes(searchQuery))
    : currentTopics;

  // Average rating for current category
  const avgRating = currentTopics.length > 0
    ? (currentTopics.reduce((s, t) => s + t.rating, 0) / currentTopics.length).toFixed(1)
    : '0.0';

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Generate ALL 5 categories: fire save to EACH per-category stepKey.
  // Each call writes to its own DB row (step5_traffic … step5_case) → no race condition.
  // Results accumulate via onSuccess; refresh reads 5 independent rows → all preserved.
  function handleGenerateAll() {
    if (!industry.trim() || !product.trim() || isLoading) return;
    for (const cat of ALL_CATEGORY_IDS) {
      saveMutation.mutate({
        stepKey: CATEGORY_STEP_KEY[cat],
        inputs: { industry, product },
      });
    }
  }

  // Generate a single category
  function handleGenerateCategory(cat: BackendCategoryId) {
    if (!industry.trim() || isLoading) return;
    saveMutation.mutate({
      stepKey: CATEGORY_STEP_KEY[cat],
      inputs: { industry, product },
    });
  }

  function handleOptimize() {
    if (!hasResult) return;
    toast.success('已智能优化');
  }

  function handleLike(t: Step5TopicItem) {
    toast.success(`已收藏 #${t.index} ${t.title}`);
  }

  function handleOptimizeOne(t: Step5TopicItem) {
    toast.success(`已优化 #${t.index}`);
  }

  function handleCopy(t: Step5TopicItem) {
    navigator.clipboard.writeText(t.title).then(() => toast.success('已复制选题')).catch(() => undefined);
  }

  const btnSecondary =
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

  // ── 雷达维度 (选题矩阵雷达 · 参考值 · 按已生成类数动态显示强度)
  // Values are reference/indicative — softened as "参考值" in label
  const RADAR_DIMS_S5 = ALL_CATEGORY_IDS.map((cat, i) => {
    const catTopics = mergedTopics[cat] ?? [];
    // Strength: 0 if not generated, else proportional to topic count + base
    const value = catTopics.length > 0
      ? Math.min(60 + Math.round((catTopics.length / 20) * 40), 100)
      : 0;
    const colors = ['#002fa7', '#781621', '#F6D300', '#002fa7', '#781621'];
    const labels = ['流量型', '变现型', '人设型', '认知型', '案例型'];
    return { label: labels[i], value, color: colors[i] };
  });

  // ── 趋势图: 当前类评分序列
  const TREND_DATA_S5 = currentTopics.length > 0
    ? currentTopics.map((t) => t.rating)
    : [0, 0];
  const TREND_LABELS_S5 = currentTopics.length > 0
    ? currentTopics.map((t) => `#${t.index}`)
    : ['#1', '#2'];

  // total generated count
  const totalGenerated = Object.values(mergedTopics).reduce((s, arr) => s + (arr?.length ?? 0), 0);

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              创作引擎
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              选题库
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            STEP 05 · 爆款选题库
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            输入你的行业和产品信息，AI 一次性生成
            <span className="mx-1 font-bold text-[#002fa7]">5 大类</span>
            爆款选题（流量型 / 变现型 / 人设型 / 认知型 / 案例型），每类 20 个，共
            <span className="mx-1 font-bold text-[#002fa7]">100 个</span>
            选题。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button type="button" onClick={handleOptimize} disabled={!hasResult} className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={handleGenerateAll}
            disabled={isLoading}
            className={btnSecondary}
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            重新生成全部
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
              <span className="material-symbols-outlined">edit_note</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">选题生成参数</h2>
              <p className="text-[12px] text-[#9ca3af]">填写行业与产品信息 · AI 据此生成 5 大类 100 个爆款选题</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            参数就绪
          </span>
        </div>
        <div className="relative space-y-7">
          {/* 行业 + 产品 双列带图标输入 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="s5-industry" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                你的行业
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" aria-hidden="true">business_center</span>
                <input
                  id="s5-industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="例如：AI智能体 / 餐饮 / 美业"
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="s5-product" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                你的产品/服务
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" aria-hidden="true">inventory_2</span>
                <input
                  id="s5-product"
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="例如：定制智能体 / OPC培训课程"
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                />
              </div>
            </div>
          </div>

          {/* 2 个上传 dropzone */}
          <div className="grid grid-cols-2 gap-6">
            <button
              type="button"
              aria-label="上传产品资料"
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#c7d2fe] bg-[#f8faff] px-4 py-8 text-center transition-colors hover:border-[#002fa7] hover:bg-white"
            >
              <span className="material-symbols-outlined text-[32px] text-[#002fa7]" aria-hidden="true">description</span>
              <p className="text-[14px] font-bold text-[#002fa7]">上传产品资料</p>
              <p className="text-[12px] text-[#6b7280]">产品介绍、卖点、价格体系、客户案例等</p>
              <p className="text-[11px] text-[#9ca3af]">支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）</p>
            </button>
            <button
              type="button"
              aria-label="上传人物介绍与行业"
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#c7d2fe] bg-[#f8faff] px-4 py-8 text-center transition-colors hover:border-[#002fa7] hover:bg-white"
            >
              <span className="material-symbols-outlined text-[32px] text-[#002fa7]" aria-hidden="true">person</span>
              <p className="text-[14px] font-bold text-[#002fa7]">上传人物介绍与行业</p>
              <p className="text-[12px] text-[#6b7280]">个人经历、行业背景、专业资质、从业故事等</p>
              <p className="text-[11px] text-[#9ca3af]">支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）</p>
            </button>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerateAll}
              disabled={isLoading || !industry.trim() || !product.trim()}
              className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isLoading ? 'progress_activity' : 'refresh'}
              </span>
              {isLoading ? '生成中…' : '重新生成全部选题'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Loading 态 ─────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div
          data-testid="step5-loading"
          className="mb-8 flex items-center gap-3 rounded-xl border border-[#002fa7]/20 bg-[#002fa7]/5 p-4 text-[14px] font-medium text-[#001e73]"
        >
          <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
          AI 正在生成爆款选题，预计 60-120 秒，请稍候…
        </div>
      )}

      {/* ── Error 态 ────────────────────────────────────────────────────────────── */}
      {saveMutation.isError && (
        <div
          data-testid="step5-error"
          className="mb-8 flex items-center justify-between gap-3 rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-[14px] font-medium text-[#991b1b]"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {saveMutation.error?.message ?? '生成失败，请重试'}
          </div>
          <button
            type="button"
            onClick={handleGenerateAll}
            className="shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {/* ── DB 加载态 ────────────────────────────────────────────────────────────── */}
      {dbIsLoading && (
        <div
          data-testid="step5-db-loading"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#002fa7]/20 bg-[#f0f4ff] p-4 text-[13px] font-medium text-[#001e73]"
        >
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          正在加载历史记录…
        </div>
      )}

      {/* ── DB 加载失败 ──────────────────────────────────────────────────────────── */}
      {dbIsError && !hasResult && (
        <div
          data-testid="step5-db-error"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-[13px] font-medium text-[#991b1b]"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">error</span>
            历史记录加载失败，请重试
          </div>
          <button
            type="button"
            onClick={() => { for (const q of Object.values(categoryQueries)) void q.refetch(); }}
            className="shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {/* ── isFallback 降级提示 ───────────────────────────────────────────────────── */}
      {hasResult && isFallbackFlag && (
        <div
          data-testid="step5-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#F6D300]/40 bg-[#fffde7] p-4 text-[13px] font-medium text-[#8a6a00]"
        >
          <span className="material-symbols-outlined text-[20px]">warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质选题。
        </div>
      )}

      {/* ── 空态 · hasResult 门控 ─────────────────────────────────────────────────── */}
      {!hasResult && !isLoading && !dbIsLoading && (
        <div
          data-testid="step5-empty-state"
          className="mb-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] py-16 text-center"
        >
          <span className="material-symbols-outlined mb-4 text-[48px] text-[#d1d5db]">topic</span>
          <p className="text-[16px] font-semibold text-[#374151]">尚未生成爆款选题库</p>
          <p className="mt-2 text-[13px] text-[#9ca3af]">填写上方表单，点击「重新生成全部选题」开始生成</p>
        </div>
      )}

      {/* ── 结果区 · hasResult 门控 ────────────────────────────────────────────────── */}
      {hasResult && (
        <div data-testid="step5-output-grid">
          {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#002fa7]">insights</span>
            <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
            <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 实时测算</span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
              已生成 {totalGenerated} 个选题
            </span>
          </div>
          <div className="mb-8 grid grid-cols-12 gap-6">
            {/* 选题矩阵雷达 (5 维) */}
            <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                    <span className="material-symbols-outlined text-[20px]">radar</span>
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#111827]">选题矩阵雷达</h3>
                    <p className="text-[11px] text-[#9ca3af]">五维强度模型 · 参考值</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[26px] font-bold leading-none text-[#002fa7]">
                    {RADAR_DIMS_S5.filter((d) => d.value > 0).length > 0
                      ? Math.round(RADAR_DIMS_S5.reduce((s, d) => s + d.value, 0) / RADAR_DIMS_S5.length)
                      : '—'}
                  </p>
                  <p className="text-[10px] text-[#9ca3af]">综合分 · 参考</p>
                </div>
              </div>
              {(() => {
                const dims = RADAR_DIMS_S5;
                const cx = 130;
                const cy = 122;
                const R = 88;
                const ang = (i: number) => ((-90 + i * (360 / dims.length)) * Math.PI) / 180;
                const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
                const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
                const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
                return (
                  <svg viewBox="0 0 260 244" className="w-full">
                    <defs>
                      <linearGradient id="radarFillS5" x1="0" y1="0" x2="0" y2="1">
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
                    <polygon points={dataPoly} fill="url(#radarFillS5)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
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
                {RADAR_DIMS_S5.map((d) => (
                  <div key={d.label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                    <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 选题难度分布 / 评分曲线 */}
            <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                    <span className="material-symbols-outlined text-[20px]">show_chart</span>
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#111827]">选题难度分布 / 评分曲线</h3>
                    <p className="text-[11px] text-[#9ca3af]">当前类 {currentTopics.length} 条评分趋势</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {['评分', '难度', '覆盖'].map((t, i) => (
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
                <p className="text-[30px] font-bold leading-none text-[#111827]">{avgRating}</p>
                <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>优质
                </span>
                <span className="mb-1 text-[12px] text-[#9ca3af]">平均评分</span>
              </div>
              {(() => {
                const data = TREND_DATA_S5;
                if (data.length < 2) {
                  return (
                    <div className="flex h-[168px] items-center justify-center text-[12px] text-[#9ca3af]">
                      暂无足够数据
                    </div>
                  );
                }
                const W = 560;
                const H = 168;
                const padL = 6;
                const padR = 6;
                const padT = 12;
                const padB = 8;
                const innerW = W - padL - padR;
                const innerH = H - padT - padB;
                const max = 6;
                const xFn = (i: number) => padL + (innerW * i) / (data.length - 1);
                const yFn = (v: number) => padT + innerH * (1 - v / max);
                const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFn(i).toFixed(1)} ${yFn(v).toFixed(1)}`).join(' ');
                const area = `${line} L ${xFn(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${xFn(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                    <defs>
                      <linearGradient id="trendFillS5" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="trendLineS5" x1="0" y1="0" x2="1" y2="0">
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
                    <path d={area} fill="url(#trendFillS5)" />
                    <path d={line} fill="none" stroke="url(#trendLineS5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((v, i) =>
                      i % 4 === 0 ? <circle key={i} cx={xFn(i)} cy={yFn(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" /> : null,
                    )}
                  </svg>
                );
              })()}
              <div className="mt-1 flex justify-between overflow-hidden px-1 text-[10px] text-[#9ca3af]">
                {TREND_LABELS_S5.filter((_, i) => i % 4 === 0).map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── KPI 卡一排 ─────────────────────────────────────── */}
          <div className="mb-8 grid grid-cols-4 gap-6">
            {/* 总选题 · 环形 · 蓝 */}
            <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                  <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
                  <span className="material-symbols-outlined text-[13px]">trending_up</span>全量
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-bold leading-none text-[#111827]">
                    {totalGenerated}<span className="text-[15px] text-[#9ca3af]"> 个</span>
                  </p>
                  <p className="mt-1.5 text-[12px] text-[#6b7280]">总选题</p>
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
                      strokeDasharray={`${Math.min(totalGenerated, 100)} 100`}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 选题大类 · 迷你柱 · 勃艮第 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                  <span className="material-symbols-outlined text-[20px]">category</span>
                </span>
                <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">大类</span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none text-[#111827]">
                  {CATEGORIES.length}<span className="text-[15px] text-[#9ca3af]"> 类</span>
                </p>
                <p className="mt-1.5 text-[12px] text-[#6b7280]">选题大类</p>
              </div>
              <div className="mt-3 flex h-6 items-end gap-1">
                {[60, 80, 70, 90, 75].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-[#781621]/70" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* 当前类 · 进度条 · 暖黄 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
                  <span className="material-symbols-outlined text-[20px]">filter_list</span>
                </span>
                <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">当前类</span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none text-[#111827]">
                  {currentTopics.length}<span className="text-[15px] text-[#9ca3af]"> 个</span>
                </p>
                <p className="mt-1.5 text-[12px] text-[#6b7280]">当前类选题</p>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
                <div className="h-2 rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" style={{ width: `${Math.min((currentTopics.length / 20) * 100, 100)}%` }} />
              </div>
            </div>

            {/* 平均评分 · chip · 蓝 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                  <span className="material-symbols-outlined text-[20px]">star</span>
                </span>
                <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">评分</span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none text-[#111827]">
                  {avgRating}<span className="text-[15px] text-[#9ca3af]"> 分</span>
                </p>
                <p className="mt-1.5 text-[12px] text-[#6b7280]">平均评分</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {['5星', '4星', '爆款'].map((k) => (
                  <span key={k} className="rounded bg-[#eff4ff] px-1.5 py-0.5 text-[10px] font-medium text-[#002fa7]">{k}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── 5 大类选择卡 ────────────────────────────────────── */}
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#002fa7]">grid_view</span>
            <h2 className="text-[16px] font-bold text-[#111827]">选题大类</h2>
            <span className="text-[12px] text-[#9ca3af]">· 5 大类 · 点击切换</span>
          </div>
          <div className="mb-8 grid grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              const catTopics = mergedTopics[cat.id] ?? [];
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    // If this category has no topics yet, generate it
                    if (catTopics.length === 0 && !isLoading) {
                      handleGenerateCategory(cat.id);
                    }
                  }}
                  className={`group relative flex flex-col items-start gap-2 overflow-hidden rounded-xl border p-4 text-left transition-all ${active ? 'border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm' : 'border-[#e5e7eb] bg-white hover:border-[#c7d2fe] hover:bg-[#f8faff]'}`}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{cat.icon}</span>
                  </span>
                  <span className="block text-[14px] font-bold text-[#111827]">{cat.name}</span>
                  <span className="block text-[11px] leading-snug text-[#6b7280]">{cat.subtitle}</span>
                  <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">
                    {catTopics.length > 0 ? `${catTopics.length} 个` : '0 个'}
                  </span>
                  {active && (
                    <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#002fa7] text-white">
                      <span className="material-symbols-outlined text-[13px]">check</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── 搜索 + 计数 ─────────────────────────────────────── */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" aria-hidden="true">search</span>
              <input
                type="text"
                aria-label="搜索选题关键词"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索选题关键词..."
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
              />
            </div>
            <p className="shrink-0 text-[13px] text-[#6b7280]">
              当前类 <span className="font-bold text-[#002fa7]">{filteredTopics.length}</span> / {currentTopics.length} 条
              <span className="ml-1 text-[#9ca3af]">· 全库 5 类 {totalGenerated} 个</span>
            </p>
          </div>

          {/* ── 选题 list ────────────────────────────────────────── */}
          <div className="mb-8 space-y-3">
            {currentTopics.length === 0 && !isLoading && (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] py-8 text-center">
                <p className="text-[13px] text-[#9ca3af]">该类选题尚未生成，点击上方「重新生成全部选题」</p>
              </div>
            )}
            {filteredTopics.map((t) => {
              const diff = difficultyStyle(t.difficulty);
              return (
                <div
                  key={`${activeCategory}-${t.index}`}
                  className="group flex items-center gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 transition-all hover:border-[#002fa7] hover:shadow-sm pw-shadow-soft"
                >
                  {/* 序号 */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f3f9] text-[13px] font-bold text-[#6b7280]">
                    {t.index}
                  </span>

                  {/* 标题 (完整) */}
                  <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-[#111827]">
                    {t.title}
                  </span>

                  {/* 平台 chip */}
                  <span className="shrink-0 rounded-md bg-[#f1f3f9] px-2.5 py-1 text-[11px] font-bold text-[#6b7280]">
                    {t.platform === 'douyin' ? '抖音' : t.platform}
                  </span>

                  {/* 难度徽标 */}
                  <span
                    className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold"
                    style={{ backgroundColor: diff.bg, color: diff.text, border: `1px solid ${diff.border}` }}
                  >
                    {t.difficultyLabel}
                  </span>

                  {/* 评分星标 */}
                  <span className="shrink-0">
                    <StarRating rating={t.rating} />
                  </span>

                  {/* 操作按钮 */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label="收藏"
                      onClick={() => handleLike(t)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#9ca3af] transition-colors hover:border-[#F6D300] hover:text-[#8a6a00]"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">bookmark</span>
                    </button>
                    <button
                      type="button"
                      aria-label="优化"
                      onClick={() => handleOptimizeOne(t)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#9ca3af] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">auto_fix_high</span>
                    </button>
                    <button
                      type="button"
                      aria-label="复制"
                      onClick={() => handleCopy(t)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#9ca3af] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">content_copy</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 底部反馈 ─────────────────────────────────────────── */}
          <div className="flex items-center gap-3 border-t border-[#eef1f6] pt-6">
            <p className="text-[13px] text-[#6b7280]">这个结果对你有帮助吗？</p>
            <button type="button" aria-label="有帮助" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#9ca3af] transition-colors hover:border-[#10b981] hover:text-[#10b981]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">thumb_up</span>
            </button>
            <button type="button" aria-label="无帮助" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#9ca3af] transition-colors hover:border-[#781621] hover:text-[#781621]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">thumb_down</span>
            </button>
          </div>
        </div>
      )}
    </PioneerLayout>
  );
}
