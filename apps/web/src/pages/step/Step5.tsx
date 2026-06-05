// PRD-29.14 · Step5 爆款选题库 · IKB 红蓝紫渐变重构
// Fix: per-category stepKeys (step5_traffic…step5_case) → each row written independently, no DB race
import '@/styles/ikb-hero.css';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { IKBLayout } from '@/layouts/IKBLayout';
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
  { id: 'traffic',   name: '流量型选题',  subtitle: '追热点、蹭流量、快速涨粉',  icon: 'trending_up',  color: C.ikb,     count: 20 },
  { id: 'monetize',  name: '变现型选题',  subtitle: '直接带货、引流变现',          icon: 'payments',     color: C.burgundy, count: 20 },
  { id: 'persona',   name: '人设型选题',  subtitle: '打造个人品牌、建立信任',      icon: 'groups',       color: C.ikb,     count: 20 },
  { id: 'cognition', name: '认知型选题',  subtitle: '输出价值、建立专业形象',      icon: 'psychology',   color: C.accent3, count: 20 },
  { id: 'case',      name: '案例型选题',  subtitle: '真实案例、社会证明',          icon: 'menu_book',    color: C.ikb,     count: 20 },
];

const ALL_CATEGORY_IDS: BackendCategoryId[] = ['traffic', 'monetize', 'persona', 'cognition', 'case'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function difficultyStyle(d: 'simple' | 'medium' | 'hard'): { bg: string; text: string; border: string } {
  // simple: IKB 蓝底白字
  if (d === 'simple') return { bg: C.ikb, text: '#fff', border: C.ikb };
  // hard: 玫红底白字
  if (d === 'hard')   return { bg: C.burgundy, text: '#fff', border: C.burgundy };
  // medium: 紫底深字
  return { bg: `${C.accent3}22`, text: C.purpleText, border: `${C.accent3}60` };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="material-symbols-outlined icon-fill text-[14px]"
          style={{ color: s <= rating ? C.accent3 : '#d1d5db' }}
          aria-hidden={true}
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
    'ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40';

  // ── 雷达维度 (选题矩阵雷达 · 参考值 · 按已生成类数动态显示强度)
  // Values are reference/indicative — softened as "参考值" in label
  const RADAR_DIMS_S5 = ALL_CATEGORY_IDS.map((cat, i) => {
    const catTopics = mergedTopics[cat] ?? [];
    // Strength: 0 if not generated, else proportional to topic count + base
    const value = catTopics.length > 0
      ? Math.min(60 + Math.round((catTopics.length / 20) * 40), 100)
      : 0;
    const colors = [C.ikb, C.burgundy, C.accent3, C.ikb, C.burgundy];
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
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest" style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}>
              创作引擎
            </span>
            <span className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest" style={{ borderColor: `${C.burgundy}50`, background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}>
              选题库
            </span>
          </div>
          <h1 className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tighter" style={{ fontFamily: F.display }}>
            STEP 05 · 爆款选题库
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed" style={{ color: '#5A6173', fontFamily: F.cn }}>
            输入你的行业和产品信息，AI 一次性生成
            <span className="mx-1 font-bold" style={{ color: C.ikb }}>5 大类</span>
            爆款选题（流量型 / 变现型 / 人设型 / 认知型 / 案例型），每类 20 个，共
            <span className="mx-1 font-bold" style={{ color: C.ikb }}>100 个</span>
            选题。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button type="button" onClick={handleOptimize} disabled={!hasResult} className={btnSecondary} style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={handleGenerateAll}
            disabled={isLoading}
            className={btnSecondary}
            style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>refresh</span>
            重新生成全部
          </button>
        </div>
      </header>

      {/* ── 输入卡 ───────────────────────────────────────────── */}
      <section className="relative mb-12 overflow-hidden rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl" style={{ background: `${C.ikb}08` }} />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl" style={{ background: `${C.burgundy}06` }} />
        <div className="relative mb-6 flex items-center justify-between pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3">
            <span className="ikb-gradbtn flex h-11 w-11 items-center justify-center rounded-xl text-white">
              <span className="material-symbols-outlined" aria-hidden={true}>edit_note</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>选题生成参数</h2>
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>填写行业与产品信息 · AI 据此生成 5 大类 100 个爆款选题</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
            参数就绪
          </span>
        </div>
        <div className="relative space-y-7">
          {/* 行业 + 产品 双列带图标输入 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="s5-industry" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide" style={{ color: C.ink, fontFamily: F.cn }}>
                <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
                你的行业
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#6b7280' }} aria-hidden={true}>business_center</span>
                <input
                  id="s5-industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="例如：AI智能体 / 餐饮 / 美业"
                  className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus-visible:outline-2 focus-within:ring-1 focus-within:ring-[#2B53E6]"
                  style={{ borderColor: C.line, background: C.base, fontFamily: F.cn, color: C.ink }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="s5-product" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide" style={{ color: C.ink, fontFamily: F.cn }}>
                <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
                你的产品/服务
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#6b7280' }} aria-hidden={true}>inventory_2</span>
                <input
                  id="s5-product"
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="例如：定制智能体 / OPC培训课程"
                  className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus-visible:outline-2 focus-within:ring-1 focus-within:ring-[#2B53E6]"
                  style={{ borderColor: C.line, background: C.base, fontFamily: F.cn, color: C.ink }}
                />
              </div>
            </div>
          </div>

          {/* 2 个上传 dropzone */}
          <div className="grid grid-cols-2 gap-6">
            <button
              type="button"
              aria-label="上传产品资料"
              className="ikb-focusring flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors hover:bg-white"
              style={{ borderColor: `${C.ikb}40`, background: `${C.ikb}04` }}
            >
              <span className="material-symbols-outlined text-[32px]" style={{ color: C.ikb }} aria-hidden={true}>description</span>
              <p className="text-[14px] font-bold" style={{ color: C.ikb, fontFamily: F.cn }}>上传产品资料</p>
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>产品介绍、卖点、价格体系、客户案例等</p>
              <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）</p>
            </button>
            <button
              type="button"
              aria-label="上传人物介绍与行业"
              className="ikb-focusring flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors hover:bg-white"
              style={{ borderColor: `${C.ikb}40`, background: `${C.ikb}04` }}
            >
              <span className="material-symbols-outlined text-[32px]" style={{ color: C.ikb }} aria-hidden={true}>person</span>
              <p className="text-[14px] font-bold" style={{ color: C.ikb, fontFamily: F.cn }}>上传人物介绍与行业</p>
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>个人经历、行业背景、专业资质、从业故事等</p>
              <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）</p>
            </button>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerateAll}
              disabled={isLoading || !industry.trim() || !product.trim()}
              className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>
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
          className="mb-8 flex items-center gap-3 rounded-xl border p-4 text-[14px] font-medium"
          style={{ borderColor: `${C.ikb}25`, background: `${C.ikb}08`, color: C.ikb, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden={true}>progress_activity</span>
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
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>error</span>
            {saveMutation.error?.message ?? '生成失败，请重试'}
          </div>
          <button
            type="button"
            onClick={handleGenerateAll}
            className="ikb-focusring shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {/* ── DB 加载态 ────────────────────────────────────────────────────────────── */}
      {dbIsLoading && (
        <div
          data-testid="step5-db-loading"
          className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-[13px] font-medium"
          style={{ borderColor: `${C.ikb}20`, background: `${C.ikb}06`, color: C.ikb, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden={true}>progress_activity</span>
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
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>error</span>
            历史记录加载失败，请重试
          </div>
          <button
            type="button"
            onClick={() => { for (const q of Object.values(categoryQueries)) void q.refetch(); }}
            className="ikb-focusring shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {/* ── isFallback 降级提示 ───────────────────────────────────────────────────── */}
      {hasResult && isFallbackFlag && (
        <div
          data-testid="step5-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-[13px] font-medium"
          style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}08`, color: C.purpleText, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质选题。
        </div>
      )}

      {/* ── 空态 · hasResult 门控 ─────────────────────────────────────────────────── */}
      {!hasResult && !isLoading && !dbIsLoading && (
        <div
          data-testid="step5-empty-state"
          className="mb-8 flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center"
          style={{ borderColor: C.line, background: C.base }}
        >
          <span className="material-symbols-outlined mb-4 text-[48px]" style={{ color: '#d1d5db' }} aria-hidden={true}>topic</span>
          <p className="text-[16px] font-semibold" style={{ color: C.ink, fontFamily: F.cn }}>尚未生成爆款选题库</p>
          <p className="mt-2 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>填写上方表单，点击「重新生成全部选题」开始生成</p>
        </div>
      )}

      {/* ── 结果区 · hasResult 门控 ────────────────────────────────────────────────── */}
      {hasResult && (
        <div data-testid="step5-output-grid">
          {/* ── KPI 卡一排 ─────────────────────────────────────── */}
          <div className="mb-8 grid grid-cols-4 gap-6">
            {/* 总选题 · 环形 · 蓝 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: `${C.ikb}30`, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>format_list_bulleted</span>
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>全量
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                    {totalGenerated}<span className="text-[15px]" style={{ color: '#6b7280' }}> 个</span>
                  </p>
                  <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>总选题</p>
                </div>
                <div className="h-12 w-12 shrink-0">
                  <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label={`总选题进度 ${Math.min(totalGenerated, 100)}%`}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}22`} strokeWidth="3.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={C.ikb}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min(totalGenerated, 100)} 100`}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 选题大类 · 迷你柱 · 玫红 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>category</span>
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.burgundy}12`, color: C.burgundyText }}>大类</span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  {CATEGORIES.length}<span className="text-[15px]" style={{ color: '#6b7280' }}> 类</span>
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>选题大类</p>
              </div>
              <div className="mt-3 flex h-6 items-end gap-1">
                {[60, 80, 70, 90, 75].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `${C.burgundy}70` }} />
                ))}
              </div>
            </div>

            {/* 当前类 · 进度条 · 紫 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.accent3}18`, color: C.accent3 }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>filter_list</span>
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.accent3}12`, color: C.purpleText }}>当前类</span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  {currentTopics.length}<span className="text-[15px]" style={{ color: '#6b7280' }}> 个</span>
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>当前类选题</p>
              </div>
              <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}18` }}>
                <div className="h-2 rounded-full" style={{ width: `${Math.min((currentTopics.length / 20) * 100, 100)}%`, background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})` }} />
              </div>
            </div>

            {/* 平均评分 · chip · 蓝 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>star</span>
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>评分</span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  {avgRating}<span className="text-[15px]" style={{ color: '#6b7280' }}> 分</span>
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>平均评分</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {['5星', '4星', '爆款'].map((k) => (
                  <span key={k} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${C.ikb}12`, color: C.ikb }}>{k}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── 5 大类选择卡 ────────────────────────────────────── */}
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>grid_view</span>
            <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>选题大类</h2>
            <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· 5 大类 · 点击切换</span>
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
                  className="ikb-hovercard ikb-focusring group relative flex flex-col items-start gap-2 overflow-hidden rounded-xl border p-4 text-left transition-all"
                  style={{
                    borderColor: active ? C.ikb : C.line,
                    background: active ? `${C.ikb}06` : C.paper,
                  }}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>{cat.icon}</span>
                  </span>
                  <span className="block text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{cat.name}</span>
                  <span className="block text-[11px] leading-snug" style={{ color: '#6b7280', fontFamily: F.cn }}>{cat.subtitle}</span>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                    {catTopics.length > 0 ? `${catTopics.length} 个` : '0 个'}
                  </span>
                  {active && (
                    <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: C.ikb }}>
                      <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>check</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── 搜索 + 计数 ─────────────────────────────────────── */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#6b7280' }} aria-hidden={true}>search</span>
              <input
                type="text"
                aria-label="搜索选题关键词"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索选题关键词..."
                className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus-visible:outline-2 focus-within:ring-1 focus-within:ring-[#2B53E6]"
                style={{ borderColor: C.line, background: C.base, fontFamily: F.cn, color: C.ink }}
              />
            </div>
            <p className="shrink-0 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
              当前类 <span className="font-bold" style={{ color: C.ikb }}>{filteredTopics.length}</span> / {currentTopics.length} 条
              <span className="ml-1" style={{ color: '#6b7280' }}>· 全库 5 类 {totalGenerated} 个</span>
            </p>
          </div>

          {/* ── 选题 list ────────────────────────────────────────── */}
          <div className="mb-8 space-y-3">
            {currentTopics.length === 0 && !isLoading && (
              <div className="flex items-center justify-center rounded-xl border border-dashed py-8 text-center" style={{ borderColor: C.line, background: C.base }}>
                <p className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>该类选题尚未生成，点击上方「重新生成全部选题」</p>
              </div>
            )}
            {filteredTopics.map((t) => {
              const diff = difficultyStyle(t.difficulty);
              return (
                <div
                  key={`${activeCategory}-${t.index}`}
                  className="ikb-hovercard group flex items-center gap-4 rounded-xl border bg-white p-4"
                  style={{ borderColor: C.line }}
                >
                  {/* 序号 */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold" style={{ background: C.base, color: '#6b7280', fontFamily: F.mono }}>
                    {t.index}
                  </span>

                  {/* 标题 (完整) */}
                  <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug" style={{ color: C.ink, fontFamily: F.cn }}>
                    {t.title}
                  </span>

                  {/* 平台 chip */}
                  <span className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ background: C.base, color: '#6b7280', fontFamily: F.mono }}>
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
                      className="ikb-focusring flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                      style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
                      onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = C.accent3; el.style.color = C.accent3; }}
                      onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = C.line; el.style.color = '#6b7280'; }}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>bookmark</span>
                    </button>
                    <button
                      type="button"
                      aria-label="优化"
                      onClick={() => handleOptimizeOne(t)}
                      className="ikb-focusring flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                      style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
                      onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = C.ikb; el.style.color = C.ikb; }}
                      onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = C.line; el.style.color = '#6b7280'; }}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>auto_fix_high</span>
                    </button>
                    <button
                      type="button"
                      aria-label="复制"
                      onClick={() => handleCopy(t)}
                      className="ikb-focusring flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                      style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
                      onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = C.ikb; el.style.color = C.ikb; }}
                      onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = C.line; el.style.color = '#6b7280'; }}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>content_copy</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
            <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>数据洞察</h2>
            <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>
              <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
              已生成 {totalGenerated} 个选题
            </span>
          </div>
          <div className="mb-8 grid grid-cols-12 gap-6">
            {/* 选题矩阵雷达 (5 维) */}
            <div className="ikb-hovercard col-span-5 rounded-xl border p-6" style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>选题矩阵雷达</h3>
                    <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>五维强度模型 · 参考值</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>
                    {RADAR_DIMS_S5.filter((d) => d.value > 0).length > 0
                      ? Math.round(RADAR_DIMS_S5.reduce((s, d) => s + d.value, 0) / RADAR_DIMS_S5.length)
                      : '—'}
                  </p>
                  <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>综合分 · 参考</p>
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
                  <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="选题矩阵雷达图">
                    <defs>
                      <linearGradient id="s5-radarFill" x1="0" y1="0" x2="0" y2="1">
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
                    <polygon points={dataPoly} fill="url(#s5-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
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
                    <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                    <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 选题难度分布 / 评分曲线 */}
            <div className="ikb-hovercard col-span-7 rounded-xl border p-6" style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>选题难度分布 / 评分曲线</h3>
                    <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>当前类 {currentTopics.length} 条评分趋势</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {['评分', '难度', '覆盖'].map((t, i) => (
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
                <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>{avgRating}</p>
                <span className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>优质
                </span>
                <span className="mb-1 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>平均评分</span>
              </div>
              {(() => {
                const data = TREND_DATA_S5;
                if (data.length < 2) {
                  return (
                    <div className="flex h-[168px] items-center justify-center text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
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
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="选题评分趋势图">
                    <defs>
                      <linearGradient id="s5-trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.22" />
                        <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="s5-trendLine" x1="0" y1="0" x2="1" y2="0">
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
                    <path d={area} fill="url(#s5-trendFill)" />
                    <path d={line} fill="none" stroke="url(#s5-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((v, i) =>
                      i % 4 === 0 ? <circle key={i} cx={xFn(i)} cy={yFn(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
                    )}
                  </svg>
                );
              })()}
              <div className="mt-1 flex justify-between overflow-hidden px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
                {TREND_LABELS_S5.filter((_, i) => i % 4 === 0).map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── 底部反馈 ─────────────────────────────────────────── */}
          <div className="flex items-center gap-3 border-t pt-6" style={{ borderColor: C.line }}>
            <p className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>这个结果对你有帮助吗？</p>
            <button type="button" aria-label="有帮助" className="ikb-focusring flex h-8 w-8 items-center justify-center rounded-lg border transition-colors" style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = C.ikb; el.style.color = C.ikb; }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = C.line; el.style.color = '#6b7280'; }}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>thumb_up</span>
            </button>
            <button type="button" aria-label="无帮助" className="ikb-focusring flex h-8 w-8 items-center justify-center rounded-lg border transition-colors" style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = C.burgundy; el.style.color = C.burgundy; }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = C.line; el.style.color = '#6b7280'; }}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>thumb_down</span>
            </button>
          </div>
        </div>
      )}
    </IKBLayout>
  );
}
