// PRD-29.6 Step3 · Step7 文案生成 — IKB 红蓝紫渐变重构
// 阶段2 接真后端: trpc.stepData.save/get · CopywritingAgent step7 mode
// URL 预填: ?topic=... 来自 TrendingDetailDrawer/TrendingTable
import '@/styles/ikb-hero.css';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { IKBLayout } from '@/layouts/IKBLayout';
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
  { label: '钩子强度', value: 86, color: C.ikb },
  { label: '情绪张力', value: 79, color: C.burgundy },
  { label: '价值密度', value: 88, color: C.accent3 },
  { label: '转化引导', value: 82, color: C.ikb },
  { label: '记忆点',   value: 75, color: C.burgundy },
  { label: '传播性',   value: 91, color: C.accent3 },
];

// ── 趋势数据 (爆款元素权重分布 / 文案结构曲线)
const TREND_DATA_S7 = [72, 65, 88, 70, 82, 76, 90, 85, 79, 93, 88, 96];
const TREND_LABELS_S7 = ['贪念', '恐惧', '猎奇', '反差', '借势', '共鸣', '共情', '情绪', '热点', '争议', '稀缺', '权威'];

// ── Category colors (IKB palette)
const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; iconBg: string; dot: string }> = {
  classic:    { border: `border-[#2B53E6]/20`, bg: `bg-[#2B53E6]/[0.04]`, text: `text-[#2B53E6]`,  iconBg: `bg-[#2B53E6]/10`,  dot: C.ikb },
  emotion:    { border: `border-[#EF3E6B]/20`, bg: `bg-[#EF3E6B]/[0.04]`, text: `text-[#D11E52]`,  iconBg: `bg-[#EF3E6B]/10`,  dot: C.burgundy },
  content:    { border: `border-[#7A3BE0]/20`, bg: `bg-[#7A3BE0]/[0.04]`, text: `text-[#3A1A6E]`,  iconBg: `bg-[#7A3BE0]/12`,  dot: C.accent3 },
  conversion: { border: `border-[#2B53E6]/20`, bg: `bg-[#2B53E6]/[0.04]`, text: `text-[#2B53E6]`,  iconBg: `bg-[#2B53E6]/10`,  dot: C.ikb },
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
    'ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40';

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
              文案工厂
            </span>
          </div>
          <h1 className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight" style={{ fontFamily: F.display }}>
            STEP 07 · 文案生成
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed" style={{ color: '#5A6173', fontFamily: F.cn }}>
            选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={!hasResult}
            aria-label="智能优化"
            className={btnSecondary}
            style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={handleCopyResult}
            disabled={!hasResult}
            aria-label="复制文案"
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>content_copy</span>
            复制文案
          </button>
        </div>
      </header>

      {/* ── loading 状态 ────────────────────────────────────── */}
      {generateMutation.isPending && (
        <div
          data-testid="step7-loading"
          className="mb-8 overflow-hidden rounded-xl border p-4"
          style={{ borderColor: `${C.ikb}25`, background: `${C.ikb}08` }}
        >
          <div className="mb-2 flex items-center gap-3 text-[14px] font-medium" style={{ color: C.ikb, fontFamily: F.cn }}>
            <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden={true}>progress_activity</span>
            AI 正在生成爆款文案，请稍候…
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: `${C.ikb}20` }}>
            <div className="h-full w-2/3 animate-pulse rounded-full" style={{ background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})` }} />
          </div>
        </div>
      )}

      {/* ── error 重试 ──────────────────────────────────────── */}
      {generateMutation.isError && (
        <div
          data-testid="step7-error"
          className="mb-8 flex items-center justify-between gap-3 rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-[14px] font-medium text-[#991b1b]"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>error</span>
            {generateMutation.error?.message ?? '生成失败，请重试'}
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="ikb-focusring shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {/* ── db 历史加载中 ────────────────────────────────────── */}
      {dbQuery.isLoading && (
        <div
          data-testid="step7-db-loading"
          className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-[13px] font-medium"
          style={{ borderColor: `${C.ikb}20`, background: `${C.ikb}06`, color: C.ikb, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden={true}>progress_activity</span>
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

      {/* ── isFallback 提示 ─────────────────────────────────── */}
      {hasResult && isFallbackFlag && (
        <div
          data-testid="step7-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-[13px] font-medium"
          style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}08`, color: C.purpleText, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质方案。
        </div>
      )}

      {/* ── KPI 卡一排(仅有真实结果时显示)────────────────────── */}
      {hasResult && (
        <>
          {/* ── KPI 卡一排 ─────────────────────────────────────── */}
          <div className="mb-8 grid grid-cols-4 gap-6">
            {/* 脚本类型 · 环形 · 蓝 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: `${C.ikb}30`, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>description</span>
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>全覆盖
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                    {SCRIPT_TYPES.length}
                    <span className="text-[15px]" style={{ color: '#6b7280' }}> 种</span>
                  </p>
                  <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>脚本类型</p>
                </div>
                <div className="h-12 w-12 shrink-0">
                  <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label={`脚本类型覆盖 ${Math.round((SCRIPT_TYPES.length / 10) * 100)}%`}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}22`} strokeWidth="3.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={C.ikb}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.round((SCRIPT_TYPES.length / 10) * 100)} 100`}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 爆款元素 · 迷你柱 · 玫红 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>local_fire_department</span>
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.burgundy}12`, color: C.burgundyText }}>元素库</span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  {totalElements}
                  <span className="text-[15px]" style={{ color: '#6b7280' }}> 个</span>
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>爆款元素</p>
              </div>
              <div className="mt-3 flex h-6 items-end gap-1">
                {[58, 84, 70, 96, 78].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `${C.burgundy}70` }} />
                ))}
              </div>
            </div>

            {/* 已选元素 · 进度条 · 紫 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.accent3}18`, color: C.accent3 }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>check_circle</span>
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.accent3}12`, color: C.purpleText }}>已选</span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  {selectedElementIds.length}
                  <span className="text-[15px]" style={{ color: '#6b7280' }}> 个</span>
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>已选元素</p>
              </div>
              <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}18` }}>
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((selectedElementIds.length / totalElements) * 100))}%`,
                    background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})`,
                  }}
                />
              </div>
            </div>

            {/* 文案字数 · chip · 蓝 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>article</span>
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  {result.markdown.length} 字
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  {result.markdown.length}
                  <span className="text-[15px]" style={{ color: '#6b7280' }}> 字</span>
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>文案字数</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {result.hooks.slice(0, 3).map((hook, i) => (
                  <span
                    key={i}
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
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
        {/* 左:脚本类型(7 · IKB 可视化选择卡) */}
        <div className="rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>description</span>
            </span>
            <div>
              <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>脚本类型</h2>
              <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>选择适合的内容框架</p>
            </div>
          </div>
          <div role="radiogroup" aria-label="脚本类型选择" className="space-y-2">
            {SCRIPT_TYPES.map((type) => {
              const active = selectedScriptTypeId === type.id;
              return (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setSelectedScriptTypeId(type.id)}
                  aria-pressed={active}
                  className={`ikb-hovercard ikb-focusring group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all ${active ? 'border-[#2B53E6]' : ''}`}
                  style={active ? { borderColor: C.ikb, background: `${C.ikb}06` } : { borderColor: C.line, background: C.base }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm"
                    style={active ? { background: C.grad, color: '#fff' } : { background: C.base, color: '#6b7280' }}
                  >
                    <span className="material-symbols-outlined text-[22px]" aria-hidden={true}>{SCRIPT_TYPE_ICONS[type.id] ?? 'article'}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{type.name}</span>
                    <span className="block text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{type.desc}</span>
                  </span>
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all"
                    style={active ? { background: C.ikb, color: '#fff' } : { border: `1px solid ${C.line}`, background: '#fff', color: 'transparent' }}
                  >
                    <span className="material-symbols-outlined text-[12px]" aria-hidden={true}>check</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右:爆款元素多选 + 文案主题 + CTA */}
        <div className="space-y-5">
          {/* 爆款元素多选 */}
          <div className="rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>local_fire_department</span>
              </span>
              <div>
                <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>爆款元素</h2>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>多选 · 已选 {selectedElementIds.length} 个</p>
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
                            aria-pressed={selected}
                            className="ikb-hovercard ikb-focusring inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all"
                            style={
                              selected
                                ? { borderColor: C.ikb, background: `${C.ikb}06`, color: C.ikb, fontFamily: F.cn }
                                : { borderColor: C.line, background: C.base, color: '#6b7280', fontFamily: F.cn }
                            }
                          >
                            <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>{el.icon}</span>
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
          <div className="rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="s7-topic" className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide" style={{ color: C.ink, fontFamily: F.cn }}>
                <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
                文案主题
              </label>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                <span className="material-symbols-outlined text-[14px]" style={{ color: C.burgundy }} aria-hidden={true}>auto_awesome</span>
                AI 据此生成爆款文案
              </span>
            </div>
            <div className="ikb-input overflow-hidden rounded-xl border transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]" style={{ borderColor: C.line, background: C.base }}>
              <textarea
                id="s7-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="输入文案主题，例如：为什么有的人赚钱那么轻松"
                className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                style={{ fontFamily: F.cn, color: C.ink }}
              />
              <div className="flex items-center justify-between gap-3 border-t bg-white/60 px-4 py-2.5" style={{ borderColor: C.line }}>
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>支持中英文 · 越具体效果越好</span>
                <span className="shrink-0 text-[11px] tabular-nums" style={{ color: '#6b7280', fontFamily: F.mono }}>{topic.length} 字</span>
              </div>
            </div>
            {currentScript && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}06` }}>
                <span className="material-symbols-outlined text-[16px]" style={{ color: C.ikb }} aria-hidden={true}>{SCRIPT_TYPE_ICONS[currentScript.id] ?? 'article'}</span>
                <div>
                  <span className="text-[12px] font-bold" style={{ color: C.ikb, fontFamily: F.cn }}>{currentScript.name}</span>
                  <span className="ml-1.5 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{currentScript.desc}</span>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!topic.trim() || isLoading}
                className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                style={{ fontFamily: F.mono }}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_awesome</span>
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
          className="mb-8 flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center"
          style={{ borderColor: C.line, background: C.base }}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `${C.ikb}10`, color: C.ikb }}>
            <span className="material-symbols-outlined text-[36px]" aria-hidden={true}>article</span>
          </span>
          <div>
            <p className="text-[16px] font-semibold" style={{ color: C.ink, fontFamily: F.cn }}>尚未生成文案</p>
            <p className="mt-2 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>选择脚本类型和爆款元素，输入主题，点击「生成爆款文案」开始</p>
          </div>
        </div>
      )}

      {/* ── 生成结果(全宽) · hasResult 门控 ───────────────── */}
      {hasResult && (
        <>
          <div className="mb-6 overflow-hidden rounded-xl border" style={{ borderColor: C.line, background: C.paper }}>
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-3">
                <span className="ikb-gradbtn flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg">
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>article</span>
                </span>
                <div>
                  <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>生成文案</h2>
                  <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>基于「{currentScript?.name ?? '脚本类型'}」框架 · AI 深度生成</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="复制文案"
                onClick={handleCopyResult}
                className="ikb-focusring flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors hover:border-[#2B53E6] hover:text-[#2B53E6]"
                style={{ borderColor: C.line, color: '#6b7280', fontFamily: F.cn }}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>content_copy</span>
                复制
              </button>
            </div>
            <div className="p-6">
              <pre
                data-testid="step7-result-markdown"
                className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                {result.markdown}
              </pre>
              {result.structure && (
                <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: C.line, background: C.base }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.ikb, fontFamily: F.mono }}>内容结构 · </span>
                  <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{result.structure}</span>
                </div>
              )}
              {result.cta && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border px-4 py-3" style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}06` }}>
                  <span className="material-symbols-outlined mt-0.5 text-[16px]" style={{ color: C.ikb }} aria-hidden={true}>campaign</span>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.ikb, fontFamily: F.mono }}>行动号召 · </span>
                    <span className="text-[12px]" style={{ color: '#444653', fontFamily: F.cn }}>{result.cta}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── AI 优化区 ────────────────────────────────────────── */}
          <div className="mb-6 overflow-hidden rounded-xl border" style={{ borderColor: C.line, background: C.paper }}>
            <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: C.line }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>auto_fix_high</span>
              </span>
              <div>
                <h3 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>AI 智能优化</h3>
                <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>输入优化目标 · AI 一键深度改写文案</p>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="s7-optimize-goal" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide" style={{ color: C.ink, fontFamily: F.cn }}>
                  <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
                  优化目标
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#6b7280' }} aria-hidden={true}>edit</span>
                  <input
                    id="s7-optimize-goal"
                    type="text"
                    value={optimizeGoal}
                    onChange={(e) => setOptimizeGoal(e.target.value)}
                    placeholder="例如：加强转化钩子 / 提升情绪张力 / 更接地气"
                    className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
                    style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.cn }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleOptimize}
                  aria-label="AI 优化"
                  className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5"
                  style={{ fontFamily: F.mono }}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_awesome</span>
                  AI 优化
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className={btnSecondary}
                  style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>refresh</span>
                  重新生成
                </button>
              </div>
            </div>
          </div>

          {/* ── 数据洞察(雷达 + 趋势)─────────────────────────── */}
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
            <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>数据洞察</h2>
            <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>
              <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
              模型已就绪
            </span>
          </div>
          <div className="mb-8 grid grid-cols-12 gap-6">
            {/* 文案爆款力雷达 */}
            <div className="ikb-hovercard col-span-5 rounded-xl border p-6" style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>文案爆款力雷达</h3>
                    <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估 · 参考值</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>84</p>
                  <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>综合分 · 参考值</p>
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
                  <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="文案爆款力雷达图">
                    <defs>
                      <linearGradient id="s7-radarFill" x1="0" y1="0" x2="0" y2="1">
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
                    <polygon points={dataPoly} fill="url(#s7-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
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
                    <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                    <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 爆款元素权重分布 / 文案结构曲线 */}
            <div className="ikb-hovercard col-span-7 rounded-xl border p-6" style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>爆款元素权重分布 / 文案结构曲线</h3>
                    <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>按当前选中元素测算 · 参考值</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {['权重', '强度', '转化'].map((t, i) => (
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
                <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>96</p>
                <span className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>+230%
                </span>
                <span className="mb-1 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>较基准值 · 参考值</span>
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
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="爆款元素权重分布曲线图">
                    <defs>
                      <linearGradient id="s7-trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                        <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="s7-trendLine" x1="0" y1="0" x2="1" y2="0">
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
                    <path d={area} fill="url(#s7-trendFill)" />
                    <path d={line} fill="none" stroke="url(#s7-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((v, i) => (
                      <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" />
                    ))}
                  </svg>
                );
              })()}
              <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
                {TREND_LABELS_S7.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-t pt-6" style={{ borderColor: C.line }}>
        <button
          type="button"
          className="ikb-focusring flex items-center gap-1.5 text-[13px] transition-colors hover:text-[#2B53E6]"
          style={{ color: '#6b7280', fontFamily: F.cn }}
          onClick={handleChangeTopic}
        >
          <span className="material-symbols-outlined text-[16px]" style={{ color: C.burgundy }} aria-hidden={true}>favorite</span>
          想换个选题继续生成文案？
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="我的选题库"
            className="ikb-focusring flex items-center gap-1.5 text-[13px] transition-colors hover:text-[#1a3db8]"
            style={{ color: C.ikb, fontFamily: F.cn }}
            onClick={handleMyTopics}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>bookmarks</span>
            我的选题库
          </button>
          <button
            type="button"
            aria-label="爆款选题"
            className="ikb-focusring flex items-center gap-1.5 text-[13px] transition-colors hover:text-[#1a3db8]"
            style={{ color: C.ikb, fontFamily: F.cn }}
            onClick={handleHotTopics}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>local_fire_department</span>
            爆款选题
          </button>
        </div>
      </div>
    </IKBLayout>
  );
}
