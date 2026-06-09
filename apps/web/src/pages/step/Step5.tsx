// PRD-29.14 · Step5 爆款选题库 · Liquid Glass 换皮
// Fix: per-category stepKeys (step5_traffic…step5_case) → each row written independently, no DB race
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
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
  { id: 'monetize',  name: '变现型选题',  subtitle: '直接带货、引流变现',          icon: 'payments',     color: 'rgba(255,255,255,0.95)', count: 20 },
  { id: 'persona',   name: '人设型选题',  subtitle: '打造个人品牌、建立信任',      icon: 'groups',       color: C.ikb,     count: 20 },
  { id: 'cognition', name: '认知型选题',  subtitle: '输出价值、建立专业形象',      icon: 'psychology',   color: C.accent3, count: 20 },
  { id: 'case',      name: '案例型选题',  subtitle: '真实案例、社会证明',          icon: 'menu_book',    color: C.ikb,     count: 20 },
];

const ALL_CATEGORY_IDS: BackendCategoryId[] = ['traffic', 'monetize', 'persona', 'cognition', 'case'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function difficultyStyle(d: 'simple' | 'medium' | 'hard'): { bg: string; text: string; border: string } {
  // simple: 冷蓝玻璃底白字
  if (d === 'simple') return { bg: 'rgba(168,197,224,0.35)', text: '#d8e8ff', border: 'rgba(168,197,224,0.55)' };
  // hard: 白玻璃底
  if (d === 'hard')   return { bg: 'rgba(255,255,255,0.18)', text: 'rgba(255,255,255,0.95)', border: 'rgba(255,255,255,0.35)' };
  // medium: 轻玻璃
  return { bg: 'rgba(216,232,255,0.14)', text: 'rgba(255,255,255,0.9)', border: 'rgba(216,232,255,0.3)' };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="material-symbols-outlined icon-fill text-[14px]"
          style={{ color: s <= rating ? C.accent3 : 'rgba(255,255,255,0.22)' }}
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

  // ── 雷达维度 (选题矩阵雷达 · 参考值 · 按已生成类数动态显示强度)
  // Values are reference/indicative — softened as "参考值" in label
  const RADAR_DIMS_S5 = ALL_CATEGORY_IDS.map((cat, i) => {
    const catTopics = mergedTopics[cat] ?? [];
    // Strength: 0 if not generated, else proportional to topic count + base
    const value = catTopics.length > 0
      ? Math.min(60 + Math.round((catTopics.length / 20) * 40), 100)
      : 0;
    const colors = [C.ikb, 'rgba(255,255,255,0.95)', C.accent3, C.ikb, 'rgba(255,255,255,0.95)'];
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
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <Reveal>
        <header style={{ marginBottom: 48, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ flexShrink: 0 }}>
            {/* chip 标签行 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ink,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                创作引擎
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  border: '0.5px solid rgba(168,197,224,0.55)',
                  background: 'rgba(168,197,224,0.18)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                选题库
              </span>
            </div>
            {/* 主标题 — 冷蓝渐变字 */}
            <h1
              style={{
                whiteSpace: 'nowrap',
                fontSize: 54,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: F.display,
                margin: 0,
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                textShadow: 'none',
              }}
            >
              STEP 05 · 爆款选题库
            </h1>
            <p
              style={{
                marginTop: 10,
                maxWidth: 820,
                fontSize: 16,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.94)',
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              输入你的行业和产品信息，AI 一次性生成
              <span style={{ margin: '0 4px', fontWeight: 700, color: C.ikb }}>5 大类</span>
              爆款选题（流量型 / 变现型 / 人设型 / 认知型 / 案例型），每类 20 个，共
              <span style={{ margin: '0 4px', fontWeight: 700, color: C.ikb }}>100 个</span>
              选题。
            </p>
          </div>
          {/* 右侧按钮组 */}
          <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'wrap', gap: 12 }}>
            <motion.button
              type="button"
              onClick={handleOptimize}
              disabled={!hasResult}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass lg-spec"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.ink,
                fontFamily: F.cn,
                cursor: !hasResult ? 'not-allowed' : 'pointer',
                opacity: !hasResult ? 0.4 : 1,
                border: 'none',
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>auto_fix_high</span>
              智能优化
            </motion.button>
            <motion.button
              type="button"
              onClick={handleGenerateAll}
              disabled={isLoading}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass lg-spec"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.ink,
                fontFamily: F.cn,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.4 : 1,
                border: 'none',
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>refresh</span>
              重新生成全部
            </motion.button>
          </div>
        </header>
      </Reveal>

      {/* ── 输入卡 ───────────────────────────────────────────── */}
      <Reveal>
        <section
          className="lg-glass lg-spec"
          style={{ position: 'relative', marginBottom: 48, overflow: 'hidden', borderRadius: 20, padding: 28 }}
        >
          {/* 头部分隔行 */}
          <div
            style={{
              position: 'relative',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 20,
              borderBottom: `0.5px solid ${C.line}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'flex',
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden={true}>edit_note</span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>选题生成参数</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>填写行业与产品信息 · AI 据此生成 5 大类 100 个爆款选题</p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 9999,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(168,197,224,0.18)',
                color: C.ikb,
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb, display: 'inline-block' }} />
              参数就绪
            </span>
          </div>

          {/* 行业 + 产品 双列带图标输入 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
            <div>
              <label
                htmlFor="s5-industry"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: C.ink,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    marginRight: 4,
                    height: 14,
                    width: 4,
                    borderRadius: 9999,
                    background: C.grad,
                    flexShrink: 0,
                  }}
                />
                你的行业
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 18,
                    color: 'rgba(255,255,255,0.84)',
                    pointerEvents: 'none',
                  }}
                  aria-hidden={true}
                >
                  business_center
                </span>
                <input
                  id="s5-industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="例如：AI智能体 / 餐饮 / 美业"
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: `0.5px solid ${C.line}`,
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(8px)',
                    padding: '12px 12px 12px 40px',
                    fontSize: 14,
                    color: C.ink,
                    fontFamily: F.cn,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168,197,224,0.7)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.25)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.line;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="s5-product"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: C.ink,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    marginRight: 4,
                    height: 14,
                    width: 4,
                    borderRadius: 9999,
                    background: C.grad,
                    flexShrink: 0,
                  }}
                />
                你的产品/服务
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 18,
                    color: 'rgba(255,255,255,0.84)',
                    pointerEvents: 'none',
                  }}
                  aria-hidden={true}
                >
                  inventory_2
                </span>
                <input
                  id="s5-product"
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="例如：定制智能体 / OPC培训课程"
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: `0.5px solid ${C.line}`,
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(8px)',
                    padding: '12px 12px 12px 40px',
                    fontSize: 14,
                    color: C.ink,
                    fontFamily: F.cn,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168,197,224,0.7)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.25)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.line;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>

          {/* 2 个上传 dropzone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
            <motion.button
              type="button"
              aria-label="上传产品资料"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass lg-spec"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                cursor: 'pointer',
                borderRadius: 18,
                borderStyle: 'dashed',
                borderWidth: 1,
                borderColor: 'rgba(168,197,224,0.4)',
                padding: '32px 16px',
                textAlign: 'center',
                background: 'rgba(168,197,224,0.06)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }} aria-hidden={true}>description</span>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>上传产品资料</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>产品介绍、卖点、价格体系、客户案例等</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）</p>
            </motion.button>
            <motion.button
              type="button"
              aria-label="上传人物介绍与行业"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass lg-spec"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                cursor: 'pointer',
                borderRadius: 18,
                borderStyle: 'dashed',
                borderWidth: 1,
                borderColor: 'rgba(168,197,224,0.4)',
                padding: '32px 16px',
                textAlign: 'center',
                background: 'rgba(168,197,224,0.06)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }} aria-hidden={true}>person</span>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>上传人物介绍与行业</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>个人经历、行业背景、专业资质、从业故事等</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）</p>
            </motion.button>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Magnetic strength={0.3}>
              <button
                type="button"
                onClick={handleGenerateAll}
                disabled={isLoading || !industry.trim() || !product.trim()}
                className="lg-gradbtn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 9999,
                  padding: '14px 34px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: F.cn,
                  cursor: isLoading || !industry.trim() || !product.trim() ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !industry.trim() || !product.trim() ? 0.4 : 1,
                  border: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>
                  {isLoading ? 'progress_activity' : 'refresh'}
                </span>
                {isLoading ? '生成中…' : '重新生成全部选题'}
              </button>
            </Magnetic>
          </div>
        </section>
      </Reveal>

      {/* ── Loading 态 ─────────────────────────────────────────────────────────── */}
      {isLoading && (
        <Reveal>
          <div
            data-testid="step5-loading"
            className="lg-glass lg-spec"
            style={{
              marginBottom: 44,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 14,
              padding: 16,
              fontSize: 14,
              fontWeight: 500,
              color: C.ikb,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }} aria-hidden={true}>progress_activity</span>
            AI 正在生成爆款选题，预计 60-120 秒，请稍候…
          </div>
        </Reveal>
      )}

      {/* ── Error 态 ────────────────────────────────────────────────────────────── */}
      {saveMutation.isError && (
        <Reveal>
          <div
            data-testid="step5-error"
            className="lg-glass lg-spec"
            style={{
              marginBottom: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderRadius: 14,
              padding: 16,
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.95)',
              borderColor: 'rgba(255,255,255,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>error</span>
              {saveMutation.error?.message ?? '生成失败，请重试'}
            </div>
            <motion.button
              type="button"
              onClick={handleGenerateAll}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass lg-spec"
              style={{
                flexShrink: 0,
                borderRadius: 10,
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 700,
                color: C.ink,
                cursor: 'pointer',
                border: 'none',
                textShadow: C.textShadow,
              }}
            >
              重试
            </motion.button>
          </div>
        </Reveal>
      )}

      {/* ── DB 加载态 ────────────────────────────────────────────────────────────── */}
      {dbIsLoading && (
        <div
          data-testid="step5-db-loading"
          className="lg-glass lg-spec"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 14,
            padding: 16,
            fontSize: 13,
            fontWeight: 500,
            color: C.ikb,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }} aria-hidden={true}>progress_activity</span>
          正在加载历史记录…
        </div>
      )}

      {/* ── DB 加载失败 ──────────────────────────────────────────────────────────── */}
      {dbIsError && !hasResult && (
        <div
          data-testid="step5-db-error"
          className="lg-glass lg-spec"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderRadius: 14,
            padding: 16,
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>error</span>
            历史记录加载失败，请重试
          </div>
          <motion.button
            type="button"
            onClick={() => { for (const q of Object.values(categoryQueries)) void q.refetch(); }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-glass lg-spec"
            style={{
              flexShrink: 0,
              borderRadius: 10,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 700,
              color: C.ink,
              cursor: 'pointer',
              border: 'none',
              textShadow: C.textShadow,
            }}
          >
            重试
          </motion.button>
        </div>
      )}

      {/* ── isFallback 降级提示 ───────────────────────────────────────────────────── */}
      {hasResult && isFallbackFlag && (
        <div
          data-testid="step5-fallback-notice"
          className="lg-glass lg-spec"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 14,
            padding: 16,
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.9)',
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质选题。
        </div>
      )}

      {/* ── 空态 · hasResult 门控 ─────────────────────────────────────────────────── */}
      {!hasResult && !isLoading && !dbIsLoading && (
        <Reveal>
          <div
            data-testid="step5-empty-state"
            className="lg-glass lg-spec"
            style={{
              marginBottom: 44,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              borderStyle: 'dashed',
              padding: '64px 0',
              textAlign: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ marginBottom: 16, fontSize: 48, color: 'rgba(255,255,255,0.25)' }} aria-hidden={true}>topic</span>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>尚未生成爆款选题库</p>
            <p style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>填写上方表单，点击「重新生成全部选题」开始生成</p>
          </div>
        </Reveal>
      )}

      {/* ── 结果区 · hasResult 门控 ────────────────────────────────────────────────── */}
      {hasResult && (
        <div data-testid="step5-output-grid">
          {/* ── KPI 卡一排 ─────────────────────────────────────── */}
          <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 44 }}>
            {/* 总选题 · 环形 · 冷蓝 */}
            <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 18, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      background: 'rgba(168,197,224,0.18)',
                      color: C.ikb,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>format_list_bulleted</span>
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                      borderRadius: 9999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'rgba(168,197,224,0.18)',
                      color: C.ikb,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden={true}>trending_up</span>全量
                  </span>
                </div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                      {totalGenerated}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)' }}> 个</span>
                    </p>
                    <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>总选题</p>
                  </div>
                  <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={`总选题进度 ${Math.min(totalGenerated, 100)}%`}>
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.2)" strokeWidth="3.5" />
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
              </motion.div>
            </Item>

            {/* 选题大类 · 迷你柱 · 白玻璃 */}
            <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 18, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.95)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>category</span>
                  </span>
                  <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.95)' }}>大类</span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                    {CATEGORIES.length}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)' }}> 类</span>
                  </p>
                  <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>选题大类</p>
                </div>
                <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
                  {[60, 80, 70, 90, 75].map((h, i) => (
                    <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: 'rgba(255,255,255,0.45)' }} />
                  ))}
                </div>
              </motion.div>
            </Item>

            {/* 当前类 · 进度条 · 冷蓝 */}
            <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 18, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      background: 'rgba(168,197,224,0.18)',
                      color: C.accent3,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>filter_list</span>
                  </span>
                  <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: 'rgba(255,255,255,0.9)' }}>当前类</span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                    {currentTopics.length}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)' }}> 个</span>
                  </p>
                  <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>当前类选题</p>
                </div>
                <div style={{ marginTop: 12, height: 6, width: '100%', borderRadius: 3, background: 'rgba(168,197,224,0.18)' }}>
                  <div style={{ height: 6, borderRadius: 3, width: `${Math.min((currentTopics.length / 20) * 100, 100)}%`, background: C.grad }} />
                </div>
              </motion.div>
            </Item>

            {/* 平均评分 · chip · 冷蓝 */}
            <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 18, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      background: 'rgba(168,197,224,0.18)',
                      color: C.ikb,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>star</span>
                  </span>
                  <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb }}>评分</span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                    {avgRating}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)' }}> 分</span>
                  </p>
                  <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>平均评分</p>
                </div>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {['5星', '4星', '爆款'].map((k) => (
                    <span key={k} style={{ borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 500, background: 'rgba(168,197,224,0.18)', color: C.ikb }}>{k}</span>
                  ))}
                </div>
              </motion.div>
            </Item>
          </RevealGroup>

          {/* ── 5 大类选择卡 ────────────────────────────────────── */}
          <Reveal>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>grid_view</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>选题大类</h2>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>· 5 大类 · 点击切换</span>
            </div>
          </Reveal>
          <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 44 }}>
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              const catTopics = mergedTopics[cat.id] ?? [];
              return (
                <Item key={cat.id}>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      // If this category has no topics yet, generate it
                      if (catTopics.length === 0 && !isLoading) {
                        handleGenerateCategory(cat.id);
                      }
                    }}
                    whileHover={{ y: -5 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    className="lg-glass lg-spec"
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 8,
                      width: '100%',
                      overflow: 'hidden',
                      borderRadius: 18,
                      padding: 18,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: active ? `1.5px solid rgba(168,197,224,0.7)` : undefined,
                      background: active ? 'rgba(168,197,224,0.12)' : undefined,
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        height: 40,
                        width: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(168,197,224,0.45), rgba(120,160,220,0.3))',
                        color: cat.color,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>{cat.icon}</span>
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{cat.name}</span>
                    <span style={{ fontSize: 11, lineHeight: 1.4, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{cat.subtitle}</span>
                    <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb }}>
                      {catTopics.length > 0 ? `${catTopics.length} 个` : '0 个'}
                    </span>
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: 10,
                          display: 'flex',
                          height: 20,
                          width: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          background: 'rgba(168,197,224,0.45)',
                          color: '#fff',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden={true}>check</span>
                      </span>
                    )}
                  </motion.button>
                </Item>
              );
            })}
          </RevealGroup>

          {/* ── 搜索 + 计数 ─────────────────────────────────────── */}
          <Reveal>
            <div style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'center' }}>
              <div
                className="lg-glass lg-spec"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 14,
                  padding: '17px 16px',
                }}
              >
                <span className="material-symbols-outlined" style={{ flexShrink: 0, fontSize: 18, color: C.ikb }} aria-hidden={true}>search</span>
                <input
                  type="text"
                  aria-label="搜索选题关键词"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索选题关键词..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 16,
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                  }}
                />
              </div>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
                当前类 <span style={{ fontWeight: 700, color: C.ikb }}>{filteredTopics.length}</span> / {currentTopics.length} 条
                <span style={{ marginLeft: 4, color: 'rgba(255,255,255,0.84)' }}>· 全库 5 类 {totalGenerated} 个</span>
              </p>
            </div>
          </Reveal>

          {/* ── 选题 list · 两列卡片网格 ──────────────────────────── */}
          {currentTopics.length === 0 && !isLoading && (
            <div
              className="lg-glass"
              style={{
                marginBottom: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                borderStyle: 'dashed',
                padding: '32px 0',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>该类选题尚未生成，点击上方「重新生成全部选题」</p>
            </div>
          )}
          <RevealGroup style={{ marginBottom: 44, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {filteredTopics.map((t) => {
              const diff = difficultyStyle(t.difficulty);
              return (
                <Item key={`${activeCategory}-${t.index}`} style={{ height: '100%' }}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    className="lg-glass lg-spec"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      borderRadius: 16,
                      padding: 18,
                      height: '100%',
                    }}
                  >
                    {/* 上排:序号 + 标题 */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span
                        style={{
                          display: 'flex',
                          height: 30,
                          width: 30,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 9,
                          fontSize: 13,
                          fontWeight: 700,
                          background: 'rgba(168,197,224,0.22)',
                          color: '#fff',
                          fontFamily: F.mono,
                          textShadow: C.textShadow,
                        }}
                      >
                        {t.index}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 15.5,
                          fontWeight: 600,
                          lineHeight: 1.5,
                          color: C.ink,
                          fontFamily: F.cn,
                          textShadow: C.textShadow,
                        }}
                      >
                        {t.title}
                      </span>
                    </div>

                    {/* 下排:meta(平台/难度/评分) + 操作按钮 · marginTop auto 贴底 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            flexShrink: 0,
                            borderRadius: 7,
                            padding: '3px 9px',
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'rgba(255,255,255,0.14)',
                            color: 'rgba(255,255,255,0.92)',
                            fontFamily: F.mono,
                            textShadow: C.textShadow,
                          }}
                        >
                          {t.platform === 'douyin' ? '抖音' : t.platform}
                        </span>
                        <span
                          style={{
                            flexShrink: 0,
                            borderRadius: 7,
                            padding: '3px 9px',
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: diff.bg,
                            color: diff.text,
                            border: `1px solid ${diff.border}`,
                          }}
                        >
                          {t.difficultyLabel}
                        </span>
                        <StarRating rating={t.rating} />
                      </div>
                      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 4 }}>
                        <motion.button
                          type="button"
                          aria-label="收藏"
                          onClick={() => handleLike(t)}
                          whileHover={{ y: -2, color: C.accent3 }}
                          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                          className="lg-glass lg-spec"
                          style={{ display: 'flex', height: 30, width: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 9, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', border: 'none' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>bookmark</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          aria-label="优化"
                          onClick={() => handleOptimizeOne(t)}
                          whileHover={{ y: -2, color: C.ikb }}
                          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                          className="lg-glass lg-spec"
                          style={{ display: 'flex', height: 30, width: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 9, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', border: 'none' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>auto_fix_high</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          aria-label="复制"
                          onClick={() => handleCopy(t)}
                          whileHover={{ y: -2, color: C.ikb }}
                          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                          className="lg-glass lg-spec"
                          style={{ display: 'flex', height: 30, width: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 9, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', border: 'none' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>content_copy</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </Item>
              );
            })}
          </RevealGroup>

          {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
          <Reveal>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>· AI 综合评估 · 实时测算</span>
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 9999,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb, display: 'inline-block' }} />
                已生成 {totalGenerated} 个选题
              </span>
            </div>
          </Reveal>
          <RevealGroup style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, marginBottom: 44 }}>
            {/* 选题矩阵雷达 (5 维) */}
            <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 18, padding: 24, height: '100%' }}
              >
                <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        display: 'flex',
                        height: 36,
                        width: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        background: 'rgba(168,197,224,0.18)',
                        color: C.ikb,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>radar</span>
                    </span>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>选题矩阵雷达</h3>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>五维强度模型 · 参考值</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontSize: 26,
                        fontWeight: 700,
                        lineHeight: 1,
                        margin: 0,
                        background: C.grad,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                        textShadow: 'none',
                        fontFamily: F.display,
                      }}
                    >
                      {RADAR_DIMS_S5.filter((d) => d.value > 0).length > 0
                        ? Math.round(RADAR_DIMS_S5.reduce((s, d) => s + d.value, 0) / RADAR_DIMS_S5.length)
                        : '—'}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: 0 }}>综合分 · 参考</p>
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
                    <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="选题矩阵雷达图">
                      <defs>
                        <linearGradient id="s5-radarFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.95)" stopOpacity="0.12" />
                        </linearGradient>
                      </defs>
                      {[0.25, 0.5, 0.75, 1].map((f) => (
                        <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                      ))}
                      {dims.map((_, i) => {
                        const [x, y] = pt(i, R);
                        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
                      })}
                      <polygon points={dataPoly} fill="url(#s5-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                      {dims.map((d, i) => {
                        const [x, y] = pt(i, R * (d.value / 100));
                        return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
                      })}
                      {dims.map((d, i) => {
                        const [x, y] = pt(i, R + 16);
                        return (
                          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.65)" fontSize="10.5" fontWeight="600">
                            {d.label}
                          </text>
                        );
                      })}
                    </svg>
                  );
                })()}
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 0' }}>
                  {RADAR_DIMS_S5.map((d) => (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{d.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Item>

            {/* 选题难度分布 / 评分曲线 */}
            <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 18, padding: 24, height: '100%' }}
              >
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        display: 'flex',
                        height: 36,
                        width: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.95)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>show_chart</span>
                    </span>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>选题难度分布 / 评分曲线</h3>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>当前类 {currentTopics.length} 条评分趋势</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {['评分', '难度', '覆盖'].map((t, i) => (
                      <span
                        key={t}
                        style={
                          i === 0
                            ? { borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(168,197,224,0.35)', color: C.ink, fontFamily: F.mono, textShadow: C.textShadow }
                            : { borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }
                        }
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                  <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>{avgRating}</p>
                  <span
                    style={{
                      marginBottom: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                      borderRadius: 9999,
                      padding: '2px 8px',
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(168,197,224,0.18)',
                      color: C.ikb,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>trending_up</span>优质
                  </span>
                  <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>平均评分</span>
                </div>
                {(() => {
                  const data = TREND_DATA_S5;
                  if (data.length < 2) {
                    return (
                      <div style={{ display: 'flex', height: 168, alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
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
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label="选题评分趋势图">
                      <defs>
                        <linearGradient id="s5-trendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.ikb} stopOpacity="0.22" />
                          <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="s5-trendLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={C.ikb} />
                          <stop offset="55%" stopColor={C.accent3} />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.95)" />
                        </linearGradient>
                      </defs>
                      {[0, 0.33, 0.66, 1].map((f) => (
                        <line
                          key={f}
                          x1={padL}
                          x2={W - padR}
                          y1={(padT + innerH * f).toFixed(1)}
                          y2={(padT + innerH * f).toFixed(1)}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1"
                        />
                      ))}
                      <path d={area} fill="url(#s5-trendFill)" />
                      <path d={line} fill="none" stroke="url(#s5-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {data.map((v, i) =>
                        i % 4 === 0 ? <circle key={i} cx={xFn(i)} cy={yFn(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" /> : null,
                      )}
                    </svg>
                  );
                })()}
                <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', overflow: 'hidden', padding: '0 4px', fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>
                  {TREND_LABELS_S5.filter((_, i) => i % 4 === 0).map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </motion.div>
            </Item>
          </RevealGroup>

          {/* ── 底部反馈 ─────────────────────────────────────────── */}
          <Reveal>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderTop: `0.5px solid ${C.line}`,
                paddingTop: 24,
              }}
            >
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>这个结果对你有帮助吗？</p>
              <motion.button
                type="button"
                aria-label="有帮助"
                whileHover={{ y: -2, color: C.ikb }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="lg-glass lg-spec"
                style={{
                  display: 'flex',
                  height: 32,
                  width: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>thumb_up</span>
              </motion.button>
              <motion.button
                type="button"
                aria-label="无帮助"
                whileHover={{ y: -2, color: 'rgba(255,255,255,0.95)' }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="lg-glass lg-spec"
                style={{
                  display: 'flex',
                  height: 32,
                  width: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>thumb_down</span>
              </motion.button>
            </div>
          </Reveal>
        </div>
      )}
    </LiquidShell>
  );
}
