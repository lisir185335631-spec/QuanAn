// PRD-29.6 Step3 · Step7 文案生成 — 先锋白 PioneerLayout 重构
// 阶段2 接真后端: trpc.stepData.save/get · CopywritingAgent step7 mode
// URL 预填: ?topic=... 来自 TrendingDetailDrawer/TrendingTable
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import { PioneerLayout } from '@/layouts/PioneerLayout';
import { trpc, type RouterOutputs } from '@/lib/trpc';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScriptType {
  id: string;
  name: string;
  desc: string;
}

interface ElementItem {
  id: string;
  label: string;
  icon: string;
}

interface ElementCategory {
  id: string;
  name: string;
  elements: ElementItem[];
}

// CopywritingOutput shape (step7 mode · matches CopywritingOutputSchema)
export interface CopywritingResult {
  markdown: string;
  structure: string;
  hooks: string[];
  cta: string;
}

// Runtime guard — 避免强转崩溃
function isCopywritingResult(x: unknown): x is CopywritingResult {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.markdown === 'string' &&
    typeof r.structure === 'string' &&
    Array.isArray(r.hooks) &&
    typeof r.cta === 'string'
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCRIPT_TYPES: ScriptType[] = [
  { id: 'opinion', name: '聊观点',   desc: '表达个人观点，引发共鸣，适合知识分享类账号' },
  { id: 'process', name: '晒过程',   desc: '展示操作过程，平台超大流量体，适合教程类内容' },
  { id: 'teach',   name: '教知识',   desc: '教学类内容，传递价值，适合专业领域分享' },
  { id: 'story',   name: '讲故事',   desc: '故事型脚本，塑造人设，适合个人品牌打造' },
  { id: 'joke',    name: '尬段子',   desc: '搞笑类内容，娱乐性强，适合泛娱乐账号' },
  { id: 'product', name: '说产品',   desc: '以变现为目标的产品脚本，适合带货和商业推广' },
  { id: 'debate',  name: '搞辩论',   desc: '正反观点对抗，引发讨论和互动' },
];

// Script type icons (Material Symbols)
const SCRIPT_TYPE_ICONS: Record<string, string> = {
  opinion: 'record_voice_over',
  process: 'play_circle',
  teach: 'school',
  story: 'auto_stories',
  joke: 'sentiment_very_satisfied',
  product: 'shopping_bag',
  debate: 'forum',
};

const ELEMENT_CATEGORIES: ElementCategory[] = [
  {
    id: 'classic',
    name: '经典元素',
    elements: [
      { id: 'greed',          label: '贪念',         icon: 'monetization_on' },
      { id: 'fear',           label: '恐惧',         icon: 'warning' },
      { id: 'curiosity',      label: '猎奇',         icon: 'search' },
      { id: 'contrast',       label: '反差',         icon: 'compare_arrows' },
      { id: 'worst',          label: '最差',         icon: 'error_outline' },
      { id: 'leverage',       label: '借势',         icon: 'local_fire_department' },
      { id: 'resonance',      label: '共鸣',         icon: 'chat_bubble' },
      { id: 'empathy',        label: '共情',         icon: 'handshake' },
      { id: 'leverage_small', label: '以小搏大',     icon: 'track_changes' },
      { id: 'roi_high',       label: '低成本高回报', icon: 'trending_up' },
      { id: 'roi_unknown',    label: '低成本未知回报', icon: 'casino' },
    ],
  },
  {
    id: 'emotion',
    name: '情绪驱动',
    elements: [
      { id: 'anger',    label: '愤怒', icon: 'mood_bad' },
      { id: 'surprise', label: '惊喜', icon: 'celebration' },
    ],
  },
  {
    id: 'content',
    name: '内容策略',
    elements: [
      { id: 'hot',         label: '热点',  icon: 'whatshot' },
      { id: 'controversy', label: '争议',  icon: 'gavel' },
      { id: 'reveal',      label: '揭秘',  icon: 'lock_open' },
      { id: 'list',        label: '清单',  icon: 'checklist' },
      { id: 'challenge',   label: '挑战',  icon: 'emoji_events' },
      { id: 'transform',   label: '蜕变',  icon: 'change_circle' },
    ],
  },
  {
    id: 'conversion',
    name: '转化驱动',
    elements: [
      { id: 'scarcity',  label: '稀缺',     icon: 'hourglass_bottom' },
      { id: 'social',    label: '社会证明', icon: 'thumb_up' },
      { id: 'authority', label: '权威',     icon: 'workspace_premium' },
      { id: 'benefit',   label: '利益',     icon: 'card_giftcard' },
    ],
  },
];

const DEFAULT_FORM = {
  selectedScriptTypeId: 'debate',
  selectedElementIds: [
    'greed', 'fear', 'curiosity', 'contrast', 'worst',
    'leverage', 'resonance', 'empathy', 'leverage_small',
  ],
  topic: '为什么有的人赚钱那么轻松',
  optimizeGoal: '',
};

// ── 雷达维度 (文案爆款力雷达)
const RADAR_DIMS_S7 = [
  { label: '钩子强度', value: 86, color: '#002fa7' },
  { label: '情绪张力', value: 79, color: '#781621' },
  { label: '价值密度', value: 88, color: '#F6D300' },
  { label: '转化引导', value: 82, color: '#002fa7' },
  { label: '记忆点',   value: 75, color: '#781621' },
  { label: '传播性',   value: 91, color: '#F6D300' },
];

// ── 趋势数据 (爆款元素权重分布 / 文案结构曲线)
const TREND_DATA_S7 = [72, 65, 88, 70, 82, 76, 90, 85, 79, 93, 88, 96];
const TREND_LABELS_S7 = ['贪念', '恐惧', '猎奇', '反差', '借势', '共鸣', '共情', '情绪', '热点', '争议', '稀缺', '权威'];

// ── Category colors
const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; iconBg: string; dot: string }> = {
  classic:    { border: 'border-[#002fa7]/20', bg: 'bg-[#002fa7]/[0.04]', text: 'text-[#002fa7]', iconBg: 'bg-[#002fa7]/10',  dot: '#002fa7' },
  emotion:    { border: 'border-[#781621]/20', bg: 'bg-[#781621]/[0.04]', text: 'text-[#781621]', iconBg: 'bg-[#781621]/10',  dot: '#781621' },
  content:    { border: 'border-[#F3E08A]',    bg: 'bg-[#fdf6cc]',        text: 'text-[#8a6a00]', iconBg: 'bg-[#F6D300]/20', dot: '#F6D300' },
  conversion: { border: 'border-[#002fa7]/20', bg: 'bg-[#002fa7]/[0.04]', text: 'text-[#002fa7]', iconBg: 'bg-[#002fa7]/10',  dot: '#002fa7' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Step7() {
  const [searchParams] = useSearchParams();
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  // URL 预填: ?topic=... ?source=... ?trendingId=... 来自 TrendingDetailDrawer/TrendingTable
  const urlTopic = searchParams.get('topic');
  const urlSource = searchParams.get('source') ?? undefined;
  const urlTrendingId = searchParams.get('trendingId') ?? undefined;

  const [selectedScriptTypeId, setSelectedScriptTypeId] = useState(DEFAULT_FORM.selectedScriptTypeId);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(DEFAULT_FORM.selectedElementIds);
  const [topic, setTopic] = useState(urlTopic ?? DEFAULT_FORM.topic);
  const [optimizeGoal, setOptimizeGoal] = useState('');

  // Sync topic from URL param (e.g. navigate back from Trending)
  useEffect(() => {
    if (urlTopic) setTopic(urlTopic);
  }, [urlTopic]);

  // ── tRPC: save mutation (生成文案)
  const generateMutation = trpc.stepData.save.useMutation({
    onSuccess: () => {
      void dbQuery.refetch();
      toast.success('生成完成');
    },
    onError: (err) => {
      toast.error(err.message || '生成失败，请重试');
    },
  });

  // ── tRPC: get query (历史记录)
  const dbQuery = trpc.stepData.get.useQuery(
    { stepKey: 'step7' },
    { enabled: accountId !== null, staleTime: 30_000, retry: false },
  );

  const isLoading = generateMutation.isPending;

  // ── 真数据来源 (带运行时守卫，避免强转崩溃):
  // 1. 本次 session mutation 返回的 result (优先)
  // 2. db query 里已存的 result
  // 3. 无数据 → undefined (不渲染 mock 假文案)
  const mutationResult: RouterOutputs['stepData']['save'] | undefined = generateMutation.data;
  const rawSession: unknown = mutationResult?.data?.result;
  const rawDb = dbQuery.data?.result;
  const sessionResult: CopywritingResult | undefined = isCopywritingResult(rawSession) ? rawSession : undefined;
  const dbResult: CopywritingResult | undefined = isCopywritingResult(rawDb) ? rawDb : undefined;
  const isFallbackFlag = mutationResult?.data?.isFallback ?? dbQuery.data?.isFallback ?? false;

  const result: CopywritingResult | undefined = sessionResult ?? dbResult;
  const hasResult = result !== undefined;

  const currentScript = SCRIPT_TYPES.find((t) => t.id === selectedScriptTypeId);

  function handleToggleElement(id: string) {
    setSelectedElementIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleGenerate() {
    if (!topic.trim() || isLoading) return;
    generateMutation.mutate({
      stepKey: 'step7',
      inputs: {
        scriptType: selectedScriptTypeId,
        elements: selectedElementIds,
        topic,
        ...(urlSource !== undefined ? { source: urlSource } : {}),
        ...(urlTrendingId !== undefined ? { trendingId: urlTrendingId } : {}),
      },
    });
  }

  function handleCopyResult() {
    if (!result) return;
    navigator.clipboard.writeText(result.markdown).then(
      () => toast.success('已复制文案'),
      () => toast.error('复制失败，请手动选取'),
    );
  }

  function handleOptimize() {
    if (!hasResult) return;
    toast.info('AI 优化功能开发中');
  }

  function handleChangeTopic() {
    toast.info('跳转到爆款选题库');
  }

  function handleMyTopics() {
    toast.info('打开我的选题库');
  }

  function handleHotTopics() {
    toast.info('跳转到爆款选题');
  }

  // 计算爆款元素总数
  const totalElements = ELEMENT_CATEGORIES.reduce((sum, cat) => sum + cat.elements.length, 0);

  const btnSecondary =
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

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
              文案工厂
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            STEP 07 · 文案生成
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button type="button" onClick={handleOptimize} disabled={!hasResult} className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={handleCopyResult}
            disabled={!hasResult}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
            复制文案
          </button>
        </div>
      </header>

      {/* ── loading 状态 ────────────────────────────────────── */}
      {generateMutation.isPending && (
        <div
          data-testid="step7-loading"
          className="mb-8 flex items-center gap-3 rounded-xl border border-[#002fa7]/20 bg-[#002fa7]/5 p-4 text-[14px] font-medium text-[#001e73]"
        >
          <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
          AI 正在生成爆款文案，请稍候…
        </div>
      )}

      {/* ── error 重试 ──────────────────────────────────────── */}
      {generateMutation.isError && (
        <div
          data-testid="step7-error"
          className="mb-8 flex items-center justify-between gap-3 rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-[14px] font-medium text-[#991b1b]"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {generateMutation.error?.message ?? '生成失败，请重试'}
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {/* ── db 历史加载中 ────────────────────────────────────── */}
      {dbQuery.isLoading && (
        <div
          data-testid="step7-db-loading"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#002fa7]/20 bg-[#f0f4ff] p-4 text-[13px] font-medium text-[#001e73]"
        >
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          正在加载历史记录…
        </div>
      )}

      {/* ── db 历史加载失败 ──────────────────────────────────── */}
      {dbQuery.isError && !hasResult && (
        <div
          data-testid="step7-db-error"
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

      {/* ── isFallback 提示 ─────────────────────────────────── */}
      {hasResult && isFallbackFlag && (
        <div
          data-testid="step7-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#F6D300]/40 bg-[#fffde7] p-4 text-[13px] font-medium text-[#8a6a00]"
        >
          <span className="material-symbols-outlined text-[20px]">warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质方案。
        </div>
      )}

      {/* ── 数据洞察(雷达 + 趋势)——仅有真实结果时显示 ──────── */}
      {hasResult && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#002fa7]">insights</span>
            <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
            <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 实时测算</span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
              模型已就绪
            </span>
          </div>
          <div className="mb-8 grid grid-cols-12 gap-6">
            {/* 文案爆款力雷达 */}
            <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                    <span className="material-symbols-outlined text-[20px]">radar</span>
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#111827]">文案爆款力雷达</h3>
                    <p className="text-[11px] text-[#9ca3af]">六维模型评估 · 参考值</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[26px] font-bold leading-none text-[#002fa7]">84</p>
                  <p className="text-[10px] text-[#9ca3af]">综合分 · 参考值</p>
                </div>
              </div>
              {(() => {
                const dims = RADAR_DIMS_S7;
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
                      <linearGradient id="radarFillS7" x1="0" y1="0" x2="0" y2="1">
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
                    <polygon points={dataPoly} fill="url(#radarFillS7)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
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
                {RADAR_DIMS_S7.map((d) => (
                  <div key={d.label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                    <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 爆款元素权重分布 / 文案结构曲线 */}
            <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                    <span className="material-symbols-outlined text-[20px]">show_chart</span>
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#111827]">爆款元素权重分布 / 文案结构曲线</h3>
                    <p className="text-[11px] text-[#9ca3af]">按当前选中元素测算 · 参考值</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {['权重', '强度', '转化'].map((t, i) => (
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
                <p className="text-[30px] font-bold leading-none text-[#111827]">96</p>
                <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>+230%
                </span>
                <span className="mb-1 text-[12px] text-[#9ca3af]">较基准值 · 参考值</span>
              </div>
              {(() => {
                const data = TREND_DATA_S7;
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
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                    <defs>
                      <linearGradient id="trendFillS7" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="trendLineS7" x1="0" y1="0" x2="1" y2="0">
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
                    <path d={area} fill="url(#trendFillS7)" />
                    <path d={line} fill="none" stroke="url(#trendLineS7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((v, i) => (
                      <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" />
                    ))}
                  </svg>
                );
              })()}
              <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
                {TREND_LABELS_S7.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── KPI 卡一排 ─────────────────────────────────────── */}
          <div className="mb-8 grid grid-cols-4 gap-6">
            {/* 脚本类型 · 环形 · 蓝 */}
            <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                  <span className="material-symbols-outlined text-[20px]">description</span>
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
                  <span className="material-symbols-outlined text-[13px]">trending_up</span>全覆盖
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-bold leading-none text-[#111827]">
                    {SCRIPT_TYPES.length}
                    <span className="text-[15px] text-[#9ca3af]"> 种</span>
                  </p>
                  <p className="mt-1.5 text-[12px] text-[#6b7280]">脚本类型</p>
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
                      strokeDasharray={`${Math.round((SCRIPT_TYPES.length / 10) * 100)} 100`}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 爆款元素 · 迷你柱 · 勃艮第红 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                  <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
                </span>
                <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">元素库</span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none text-[#111827]">
                  {totalElements}
                  <span className="text-[15px] text-[#9ca3af]"> 个</span>
                </p>
                <p className="mt-1.5 text-[12px] text-[#6b7280]">爆款元素</p>
              </div>
              <div className="mt-3 flex h-6 items-end gap-1">
                {[58, 84, 70, 96, 78].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-[#781621]/70" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* 已选元素 · 进度条 · 暖黄 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </span>
                <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">已选</span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none text-[#111827]">
                  {selectedElementIds.length}
                  <span className="text-[15px] text-[#9ca3af]"> 个</span>
                </p>
                <p className="mt-1.5 text-[12px] text-[#6b7280]">已选元素</p>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]"
                  style={{ width: `${Math.min(100, Math.round((selectedElementIds.length / totalElements) * 100))}%` }}
                />
              </div>
            </div>

            {/* 文案字数 · chip · 蓝 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                  <span className="material-symbols-outlined text-[20px]">article</span>
                </span>
                <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">
                  {result.markdown.length} 字
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none text-[#111827]">
                  {result.markdown.length}
                  <span className="text-[15px] text-[#9ca3af]"> 字</span>
                </p>
                <p className="mt-1.5 text-[12px] text-[#6b7280]">文案字数</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {result.hooks.slice(0, 3).map((hook, i) => (
                  <span
                    key={i}
                    className="rounded bg-[#eff4ff] px-1.5 py-0.5 text-[10px] font-medium text-[#002fa7]"
                  >
                    {hook.slice(0, 6)}…
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── 2 列配置区 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-6">
        {/* 左:脚本类型(7 · 先锋白可视化选择卡) */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </span>
            <div>
              <h2 className="text-[16px] font-bold text-[#111827]">脚本类型</h2>
              <p className="text-[11px] text-[#9ca3af]">选择适合的内容框架</p>
            </div>
          </div>
          <div className="space-y-2">
            {SCRIPT_TYPES.map((type) => {
              const active = selectedScriptTypeId === type.id;
              return (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setSelectedScriptTypeId(type.id)}
                  className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all ${active ? 'border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm' : 'border-[#e5e7eb] bg-[#f9f9f9] hover:border-[#c7d2fe] hover:bg-[#f8faff]'}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${active ? 'bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white' : 'bg-[#f1f3f9] text-[#6b7280]'}`}>
                    <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{SCRIPT_TYPE_ICONS[type.id] ?? 'article'}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-[#111827]">{type.name}</span>
                    <span className="block text-[11px] text-[#9ca3af]">{type.desc}</span>
                  </span>
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all ${active ? 'bg-[#002fa7] text-white' : 'border border-[#e5e7eb] bg-white text-transparent'}`}
                  >
                    <span className="material-symbols-outlined text-[12px]" aria-hidden="true">check</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右:爆款元素多选 + 文案主题 + CTA */}
        <div className="space-y-5">
          {/* 爆款元素多选 */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
              </span>
              <div>
                <h2 className="text-[16px] font-bold text-[#111827]">爆款元素</h2>
                <p className="text-[11px] text-[#9ca3af]">多选 · 已选 {selectedElementIds.length} 个</p>
              </div>
            </div>
            <div className="space-y-4">
              {ELEMENT_CATEGORIES.map((cat) => {
                const cc = CATEGORY_COLORS[cat.id] ?? CATEGORY_COLORS['classic']!;
                return (
                  <div key={cat.id}>
                    <div className={`mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide ${cc.text}`}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cc.dot }} />
                      {cat.name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cat.elements.map((el) => {
                        const selected = selectedElementIds.includes(el.id);
                        return (
                          <button
                            type="button"
                            key={el.id}
                            onClick={() => handleToggleElement(el.id)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all ${selected ? 'border-[#002fa7] bg-[#002fa7]/[0.04] text-[#002fa7]' : 'border-[#e5e7eb] bg-[#f9f9f9] text-[#6b7280] hover:border-[#c7d2fe] hover:text-[#002fa7]'}`}
                          >
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{el.icon}</span>
                            {el.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 文案主题 + 当前脚本提示 + 生成 CTA */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="s7-topic" className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                文案主题
              </label>
              <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                <span className="material-symbols-outlined text-[14px] text-[#781621]">auto_awesome</span>
                AI 据此生成爆款文案
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
              <textarea
                id="s7-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="输入文案主题，例如：为什么有的人赚钱那么轻松"
                className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
              />
              <div className="flex items-center justify-between gap-3 border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                <span className="text-[11px] text-[#9ca3af]">支持中英文 · 越具体效果越好</span>
                <span className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]">{topic.length} 字</span>
              </div>
            </div>
            {currentScript && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#dbe2ff] bg-[#eff4ff] px-3 py-2.5">
                <span className="material-symbols-outlined text-[16px] text-[#002fa7]">{SCRIPT_TYPE_ICONS[currentScript.id] ?? 'article'}</span>
                <div>
                  <span className="text-[12px] font-bold text-[#002fa7]">{currentScript.name}</span>
                  <span className="ml-1.5 text-[11px] text-[#6b7280]">{currentScript.desc}</span>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!topic.trim() || isLoading}
                className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
                {isLoading ? '生成中…' : (topic.trim() ? '生成爆款文案' : '请输入主题')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 空态 (无真实结果 · 非加载中) ───────────────────── */}
      {!hasResult && !generateMutation.isPending && !dbQuery.isLoading && (
        <div
          data-testid="step7-empty-state"
          className="mb-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] py-16 text-center"
        >
          <span className="material-symbols-outlined mb-4 text-[48px] text-[#d1d5db]">article</span>
          <p className="text-[16px] font-semibold text-[#374151]">尚未生成文案</p>
          <p className="mt-2 text-[13px] text-[#9ca3af]">选择脚本类型和爆款元素，输入主题，点击「生成爆款文案」开始</p>
        </div>
      )}

      {/* ── 生成结果(全宽) · hasResult 门控 ───────────────── */}
      {hasResult && (
        <>
          <div className="mb-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft">
            <div className="flex items-center justify-between border-b border-[#eef1f6] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
                  <span className="material-symbols-outlined text-[20px]">article</span>
                </span>
                <div>
                  <h2 className="text-[16px] font-bold text-[#111827]">生成文案</h2>
                  <p className="text-[12px] text-[#9ca3af]">基于「{currentScript?.name ?? '脚本类型'}」框架 · AI 深度生成</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="复制文案"
                onClick={handleCopyResult}
                className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[12px] font-semibold text-[#6b7280] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">content_copy</span>
                复制
              </button>
            </div>
            <div className="p-6">
              <pre
                data-testid="step7-result-markdown"
                className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-[#1b1b1b]"
              >
                {result.markdown}
              </pre>
              {result.structure && (
                <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#002fa7]">内容结构 · </span>
                  <span className="text-[12px] text-[#6b7280]">{result.structure}</span>
                </div>
              )}
              {result.cta && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#dbe2ff] bg-[#eff4ff] px-4 py-3">
                  <span className="material-symbols-outlined mt-0.5 text-[16px] text-[#002fa7]">campaign</span>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#002fa7]">行动号召 · </span>
                    <span className="text-[12px] text-[#374151]">{result.cta}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── AI 优化区 ────────────────────────────────────────── */}
          <div className="mb-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft">
            <div className="flex items-center gap-3 border-b border-[#eef1f6] px-6 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
              </span>
              <div>
                <h3 className="text-[16px] font-bold text-[#111827]">AI 智能优化</h3>
                <p className="text-[12px] text-[#9ca3af]">输入优化目标 · AI 一键深度改写文案</p>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="s7-optimize-goal" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                  优化目标
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">edit</span>
                  <input
                    id="s7-optimize-goal"
                    type="text"
                    value={optimizeGoal}
                    onChange={(e) => setOptimizeGoal(e.target.value)}
                    placeholder="例如：加强转化钩子 / 提升情绪张力 / 更接地气"
                    className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleOptimize}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-6 py-3 text-[13px] font-bold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
                  AI 优化
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className={btnSecondary}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
                  重新生成
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-t border-[#eef1f6] pt-6">
        <button
          type="button"
          className="flex items-center gap-1.5 text-[13px] text-[#6b7280] transition-colors hover:text-[#002fa7]"
          onClick={handleChangeTopic}
        >
          <span className="material-symbols-outlined text-[16px] text-[#781621]" aria-hidden="true">favorite</span>
          想换个选题继续生成文案？
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="我的选题库"
            className="flex items-center gap-1.5 text-[13px] text-[#002fa7] transition-colors hover:text-[#001e73]"
            onClick={handleMyTopics}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">bookmarks</span>
            我的选题库
          </button>
          <button
            type="button"
            aria-label="爆款选题"
            className="flex items-center gap-1.5 text-[13px] text-[#002fa7] transition-colors hover:text-[#001e73]"
            onClick={handleHotTopics}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">local_fire_department</span>
            爆款选题
          </button>
        </div>
      </div>
    </PioneerLayout>
  );
}
