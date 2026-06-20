// PRD-29.6 Step3 · Step7 文案生成 — iOS26 液态玻璃换皮
// 阶段2 接真后端: trpc.stepData.save/get · CopywritingAgent step7 mode
// URL 预填: ?topic=... 来自 TrendingDetailDrawer/TrendingTable

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep } from '@/hooks/useStepData';
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

// PRD-37 US-P10 AC3: viralStructure 形状(来自 AnalysisAgent viral mode 输出)
interface ViralStructure {
  hook: string;
  body: string;
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

// STEP_SCRIPT_TYPE_KEYS (schema): opinion/process/knowledge/story/comedy/product/review/expose/
//   challenge/interview/daily/transform/debate/list/reaction/qna/collab/behind/trend_news/motivation
// 前端展示7种·id 必须 ∈ STEP_SCRIPT_TYPE_KEYS (后端 enum 校验)
const SCRIPT_TYPES: ScriptType[] = [
  { id: 'opinion',   name: '聊观点',   desc: '表达个人观点，引发共鸣，适合知识分享类账号' },
  { id: 'process',   name: '晒过程',   desc: '展示操作过程，平台超大流量体，适合教程类内容' },
  { id: 'knowledge', name: '教知识',   desc: '教学类内容，传递价值，适合专业领域分享' },
  { id: 'story',     name: '讲故事',   desc: '故事型脚本，塑造人设，适合个人品牌打造' },
  { id: 'comedy',    name: '尬段子',   desc: '搞笑类内容，娱乐性强，适合泛娱乐账号' },
  { id: 'product',   name: '说产品',   desc: '以变现为目标的产品脚本，适合带货和商业推广' },
  { id: 'debate',    name: '搞辩论',   desc: '正反观点对抗，引发讨论和互动' },
];

// Script type icons (Material Symbols)
const SCRIPT_TYPE_ICONS: Record<string, string> = {
  opinion:   'record_voice_over',
  process:   'play_circle',
  knowledge: 'school',
  story:     'auto_stories',
  comedy:    'sentiment_very_satisfied',
  product:   'shopping_bag',
  debate:    'forum',
};

// STEP_HOT_ELEMENT_KEYS (schema): greed/fear/curiosity/contrast/worst/leverage/resonance/empathy/
//   small_big/low_cost_high/low_cost_unknown/anger/surprise/trend/controversy/reveal/list/
//   challenge/transformation/scarcity/social_proof/authority/benefit
// element id 必须 ∈ STEP_HOT_ELEMENT_KEYS (后端 enum 校验)·label 显示名称不变
const ELEMENT_CATEGORIES: ElementCategory[] = [
  {
    id: 'classic',
    name: '经典元素',
    elements: [
      { id: 'greed',            label: '贪念',           icon: 'monetization_on' },
      { id: 'fear',             label: '恐惧',           icon: 'warning' },
      { id: 'curiosity',        label: '猎奇',           icon: 'search' },
      { id: 'contrast',         label: '反差',           icon: 'compare_arrows' },
      { id: 'worst',            label: '最差',           icon: 'error_outline' },
      { id: 'leverage',         label: '借势',           icon: 'local_fire_department' },
      { id: 'resonance',        label: '共鸣',           icon: 'chat_bubble' },
      { id: 'empathy',          label: '共情',           icon: 'handshake' },
      { id: 'small_big',        label: '以小搏大',       icon: 'track_changes' },
      { id: 'low_cost_high',    label: '低成本高回报',   icon: 'trending_up' },
      { id: 'low_cost_unknown', label: '低成本未知回报', icon: 'casino' },
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
      { id: 'trend',          label: '热点',  icon: 'whatshot' },
      { id: 'controversy',    label: '争议',  icon: 'gavel' },
      { id: 'reveal',         label: '揭秘',  icon: 'lock_open' },
      { id: 'list',           label: '清单',  icon: 'checklist' },
      { id: 'challenge',      label: '挑战',  icon: 'emoji_events' },
      { id: 'transformation', label: '蜕变',  icon: 'change_circle' },
    ],
  },
  {
    id: 'conversion',
    name: '转化驱动',
    elements: [
      { id: 'scarcity',     label: '稀缺',     icon: 'hourglass_bottom' },
      { id: 'social_proof', label: '社会证明', icon: 'thumb_up' },
      { id: 'authority',    label: '权威',     icon: 'workspace_premium' },
      { id: 'benefit',      label: '利益',     icon: 'card_giftcard' },
    ],
  },
];

const DEFAULT_FORM = {
  selectedScriptTypeId: 'debate',
  selectedElementIds: [
    'greed', 'fear', 'curiosity', 'contrast', 'worst',
    'leverage', 'resonance', 'empathy', 'small_big',
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

// ── Category accent colors (liquid glass 冷蓝体系)
const CATEGORY_ACCENTS: Record<string, string> = {
  classic:    C.ikb,
  emotion:    C.burgundy,
  content:    C.accent3,
  conversion: C.ikb,
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

  // ── US-P10 AC3: 爆款解析(viral mode) state ───────────────────────────────────
  // copyText: 用户输入的对标爆款文案; viralStructure: 拆解结果; viral mutation 三态
  const [viralCopyText, setViralCopyText] = useState('');
  const [viralStructure, setViralStructure] = useState<ViralStructure | null>(null);
  const [viralExpanded, setViralExpanded] = useState(false);

  // ── US-P10 AC4: 从 step5 stepData(LS)读取选题回显 ───────────────────────────
  const step5Topic: string | null = (() => {
    const data = readOtherStep<Record<string, unknown>>(accountId, 'step5');
    if (!data) return null;
    // step5 存的选题可能在 lastTopic / topic 字段
    const candidate = (data['lastTopic'] ?? data['topic'] ?? null);
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
  })();

  // ── viral analysis mutation (trpc.videoAnalysis.analyze) ────────────────────
  const viralMutation = trpc.videoAnalysis.analyze.useMutation({
    onSuccess: (row) => {
      try {
        const parsed = JSON.parse(row.content) as { viralStructure?: ViralStructure };
        const vs = parsed?.viralStructure;
        if (vs && (vs.hook || vs.body || vs.cta)) {
          setViralStructure(vs);
          toast.success('爆款结构拆解完成，将自动注入文案生成');
        } else {
          toast.info('未能拆解爆款结构，可直接生成文案');
        }
      } catch {
        toast.error('解析爆款结构失败');
      }
    },
    onError: (err) => {
      toast.error(err.message || '爆款解析失败，请重试');
    },
  });

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
        // US-P10 AC3: 注入爆款结构(US-P09 CopywritingAgent step7 链已消费 viralStructure)
        ...(urlTrendingId !== undefined ? { sourceTrendingId: urlTrendingId } : {}),
        ...(viralStructure !== null ? { viralStructure } : {}),
      },
    });
  }

  function handleViralAnalyze() {
    if (!viralCopyText.trim() || viralMutation.isPending) return;
    viralMutation.mutate({ lastCopy: viralCopyText });
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

  return (
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <Reveal>
        <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
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
                  border: `0.5px solid rgba(168,197,224,0.55)`,
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
                文案工厂
              </span>
            </div>
            {/* 主标题 — 冷蓝渐变字 */}
            <h1
              style={{
                whiteSpace: 'nowrap',
                fontSize: 52,
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
              STEP 07 · 文案生成
            </h1>
            <p
              style={{
                marginTop: 10,
                maxWidth: 820,
                fontSize: 16,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.84)',
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。
            </p>
          </div>
          {/* Header 操作按钮 */}
          <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'wrap', gap: 12 }}>
            <motion.button
              type="button"
              onClick={handleOptimize}
              disabled={!hasResult}
              aria-label="智能优化"
              whileHover={hasResult ? { y: -3 } : undefined}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: !hasResult ? 'rgba(255,255,255,0.35)' : C.ink,
                fontFamily: F.cn,
                background: 'transparent',
                border: 'none',
                cursor: !hasResult ? 'not-allowed' : 'pointer',
                opacity: !hasResult ? 0.5 : 1,
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18, color: C.ikb }}>auto_fix_high</span>
              智能优化
            </motion.button>
            <Magnetic strength={0.3}>
              <motion.button
                type="button"
                onClick={handleCopyResult}
                disabled={!hasResult}
                aria-label="复制文案"
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="lg-gradbtn"
                style={{
                  display: 'flex',
                  flexShrink: 0,
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  borderRadius: 9999,
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: F.cn,
                  border: 'none',
                  cursor: !hasResult ? 'not-allowed' : 'pointer',
                  opacity: !hasResult ? 0.4 : 1,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>content_copy</span>
                复制文案
              </motion.button>
            </Magnetic>
          </div>
        </header>
      </Reveal>

      {/* ── loading 状态 ────────────────────────────────────── */}
      {generateMutation.isPending && (
        <div
          data-testid="step7-loading"
          className="lg-glass"
          style={{
            marginBottom: 44,
            overflow: 'hidden',
            borderRadius: 16,
            padding: 18,
          }}
        >
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>
            <span className="material-symbols-outlined animate-spin" aria-hidden={true} style={{ fontSize: 20 }}>progress_activity</span>
            AI 正在生成爆款文案，请稍候…
          </div>
          <div style={{ height: 6, width: '100%', overflow: 'hidden', borderRadius: 9999, background: 'rgba(168,197,224,0.2)' }}>
            <div className="animate-pulse" style={{ height: '100%', width: '66%', borderRadius: 9999, background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})` }} />
          </div>
        </div>
      )}

      {/* ── error 重试 ──────────────────────────────────────── */}
      {generateMutation.isError && (
        <div
          data-testid="step7-error"
          className="lg-glass"
          style={{
            marginBottom: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderRadius: 16,
            padding: 18,
            fontSize: 14,
            fontWeight: 600,
            color: C.burgundyText,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.burgundy }}>error</span>
            {generateMutation.error?.message ?? '生成失败，请重试'}
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="lg-glass"
            style={{ flexShrink: 0, borderRadius: 10, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: C.ink, background: 'transparent', border: 'none', cursor: 'pointer', textShadow: C.textShadow }}
          >
            重试
          </button>
        </div>
      )}

      {/* ── db 历史加载中 ────────────────────────────────────── */}
      {dbQuery.isLoading && (
        <div
          data-testid="step7-db-loading"
          className="lg-glass"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 16,
            padding: 18,
            fontSize: 13,
            fontWeight: 600,
            color: C.ikb,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          <span className="material-symbols-outlined animate-spin" aria-hidden={true} style={{ fontSize: 18 }}>progress_activity</span>
          正在加载历史记录…
        </div>
      )}

      {/* ── db 历史加载失败 ──────────────────────────────────── */}
      {dbQuery.isError && !hasResult && (
        <div
          data-testid="step7-db-error"
          className="lg-glass"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderRadius: 16,
            padding: 18,
            fontSize: 13,
            fontWeight: 600,
            color: C.burgundyText,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18, color: C.burgundy }}>error</span>
            历史记录加载失败，请重试
          </div>
          <button
            type="button"
            onClick={() => void dbQuery.refetch()}
            className="lg-glass"
            style={{ flexShrink: 0, borderRadius: 10, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: C.ink, background: 'transparent', border: 'none', cursor: 'pointer', textShadow: C.textShadow }}
          >
            重试
          </button>
        </div>
      )}

      {/* ── isFallback 提示 ─────────────────────────────────── */}
      {hasResult && isFallbackFlag && (
        <div
          data-testid="step7-fallback-notice"
          className="lg-glass"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 16,
            padding: 18,
            fontSize: 13,
            fontWeight: 600,
            color: C.purpleText,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.accent3 }}>warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质方案。
        </div>
      )}

      {/* ── KPI 卡一排(仅有真实结果时显示)────────────────────── */}
      {hasResult && (
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 44 }}>
          {/* 脚本类型 · 环形 · 冷蓝 */}
          <Item style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>description</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb, textShadow: C.textShadow }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 13 }}>trending_up</span>全覆盖
                </span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                    {SCRIPT_TYPES.length}
                    <span style={{ marginLeft: 3, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>种</span>
                  </p>
                  <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>脚本类型</p>
                </div>
                <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={`脚本类型覆盖 ${Math.round((SCRIPT_TYPES.length / 10) * 100)}%`}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.2)" strokeWidth="3.5" />
                    <circle
                      cx="18" cy="18" r="15.915" fill="none"
                      stroke={C.ikb} strokeWidth="3.5" strokeLinecap="round"
                      strokeDasharray={`${Math.round((SCRIPT_TYPES.length / 10) * 100)} 100`}
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </Item>

          {/* 爆款元素 · 迷你柱 · 白/冷 */}
          <Item style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: C.burgundy }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>local_fire_department</span>
                </span>
                <span style={{ borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.12)', color: C.burgundyText, textShadow: C.textShadow }}>元素库</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                  {totalElements}
                  <span style={{ marginLeft: 3, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>个</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>爆款元素</p>
              </div>
              <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
                {[58, 84, 70, 96, 78].map((h, i) => (
                  <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${h}%`, background: 'rgba(255,255,255,0.45)' }} />
                ))}
              </div>
            </motion.div>
          </Item>

          {/* 已选元素 · 进度条 · 冷蓝 */}
          <Item style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.accent3 }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>check_circle</span>
                </span>
                <span style={{ borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.purpleText, textShadow: C.textShadow }}>已选</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                  {selectedElementIds.length}
                  <span style={{ marginLeft: 3, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>个</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>已选元素</p>
              </div>
              <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 9999, background: 'rgba(168,197,224,0.18)' }}>
                <div
                  style={{
                    height: 8,
                    borderRadius: 9999,
                    width: `${Math.min(100, Math.round((selectedElementIds.length / totalElements) * 100))}%`,
                    background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})`,
                  }}
                />
              </div>
            </motion.div>
          </Item>

          {/* 文案字数 · chip · 冷蓝 */}
          <Item style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>article</span>
                </span>
                <span style={{ borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb, textShadow: C.textShadow }}>
                  {result.markdown.length} 字
                </span>
              </div>
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                  {result.markdown.length}
                  <span style={{ marginLeft: 3, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>字</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>文案字数</p>
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {result.hooks.slice(0, 3).map((hook, i) => (
                  <span
                    key={i}
                    style={{ borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 600, background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.mono, textShadow: C.textShadow }}
                  >
                    {hook.slice(0, 6)}…
                  </span>
                ))}
              </div>
            </motion.div>
          </Item>
        </RevealGroup>
      )}

      {/* ── 2 列配置区 ─────────────────────────────────────── */}
      <div style={{ marginBottom: 44, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        {/* 左:脚本类型(7 · 可视化选择卡) */}
        <Reveal>
          <div className="lg-glass" style={{ borderRadius: 20, padding: 24 }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>description</span>
              </span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>脚本类型</h2>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>选择适合的内容框架</p>
              </div>
            </div>
            {/* US-P10 AC5: 脚本类型卡片横排单行铺开(flex-wrap,去列数上限) */}
            <div data-testid="step7-script-type-cards" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {SCRIPT_TYPES.map((type) => {
                const active = selectedScriptTypeId === type.id;
                return (
                  <motion.button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedScriptTypeId(type.id)}
                    aria-pressed={active}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    className="lg-glass"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 100,
                      gap: 6,
                      overflow: 'hidden',
                      borderRadius: 14,
                      padding: '10px 14px',
                      textAlign: 'left',
                      background: active ? 'rgba(168,197,224,0.22)' : 'transparent',
                      border: active ? `1px solid rgba(168,197,224,0.6)` : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      transition: 'background 0.2s, border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          display: 'flex',
                          height: 32,
                          width: 32,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 9,
                          background: active
                            ? 'linear-gradient(135deg, rgba(168,197,224,0.6), rgba(120,160,220,0.4))'
                            : 'rgba(255,255,255,0.08)',
                          color: active ? '#fff' : 'rgba(255,255,255,0.8)',
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>{SCRIPT_TYPE_ICONS[type.id] ?? 'article'}</span>
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, whiteSpace: 'nowrap' }}>{type.name}</span>
                    </div>
                    <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: F.cn, lineHeight: 1.4 }}>{type.desc}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* 右:爆款元素多选 + 文案主题 + CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 爆款元素多选 */}
          <Reveal>
            <div className="lg-glass" style={{ borderRadius: 20, padding: 20 }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: C.burgundy }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>local_fire_department</span>
                </span>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>爆款元素</h2>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>多选 · 已选 {selectedElementIds.length} 个</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {ELEMENT_CATEGORIES.map((cat) => {
                  const accentColor = CATEGORY_ACCENTS[cat.id] ?? C.ikb;
                  return (
                    <div key={cat.id}>
                      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: accentColor, textShadow: C.textShadow }}>
                        <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: accentColor, flexShrink: 0 }} />
                        {cat.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {cat.elements.map((el) => {
                          const selected = selectedElementIds.includes(el.id);
                          return (
                            <motion.button
                              type="button"
                              key={el.id}
                              onClick={() => handleToggleElement(el.id)}
                              aria-pressed={selected}
                              whileHover={{ y: -2 }}
                              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                              className="lg-glass"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                borderRadius: 10,
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 600,
                                fontFamily: F.cn,
                                background: selected ? 'rgba(168,197,224,0.25)' : 'transparent',
                                border: selected ? `1px solid rgba(168,197,224,0.6)` : '1px solid rgba(255,255,255,0.08)',
                                color: selected ? C.ikb : 'rgba(255,255,255,0.84)',
                                cursor: 'pointer',
                                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                                textShadow: C.textShadow,
                              }}
                            >
                              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>{el.icon}</span>
                              {el.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* 文案主题 + 当前脚本提示 + 生成 CTA */}
          <Reveal>
            <div className="lg-glass" style={{ borderRadius: 20, padding: 20 }}>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label htmlFor="s7-topic" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, letterSpacing: '0.04em', color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, cursor: 'pointer' }}>
                  <span style={{ display: 'inline-block', height: 14, width: 4, borderRadius: 9999, background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})`, marginRight: 4 }} />
                  文案主题
                </label>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14, color: C.burgundy }}>auto_awesome</span>
                  AI 据此生成爆款文案
                </span>
              </div>
              {/* textarea 容器 */}
              <div
                className="lg-glass"
                style={{
                  overflow: 'hidden',
                  borderRadius: 14,
                  border: `1px solid rgba(255,255,255,0.12)`,
                  transition: 'border-color 0.2s',
                }}
                onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(168,197,224,0.6)`; }}
                onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(255,255,255,0.12)`; }}
              >
                <textarea
                  id="s7-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  placeholder="输入文案主题，例如：为什么有的人赚钱那么轻松"
                  style={{
                    width: '100%',
                    resize: 'none',
                    border: 0,
                    background: 'transparent',
                    padding: 16,
                    fontSize: 14,
                    lineHeight: 1.6,
                    outline: 'none',
                    fontFamily: F.cn,
                    color: C.ink,
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    borderTop: `1px solid rgba(255,255,255,0.10)`,
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>支持中英文 · 越具体效果越好</span>
                  <span style={{ flexShrink: 0, fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>{topic.length} 字</span>
                </div>
              </div>
              {currentScript && (
                <div
                  className="lg-glass"
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 12,
                    padding: '10px 14px',
                    border: `1px solid rgba(168,197,224,0.3)`,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16, color: C.ikb }}>{SCRIPT_TYPE_ICONS[currentScript.id] ?? 'article'}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>{currentScript.name}</span>
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{currentScript.desc}</span>
                  </div>
                </div>
              )}
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Magnetic strength={0.3}>
                  <motion.button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!topic.trim() || isLoading}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    className="lg-gradbtn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: 9999,
                      padding: '12px 32px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#fff',
                      fontFamily: F.cn,
                      border: 'none',
                      cursor: !topic.trim() || isLoading ? 'not-allowed' : 'pointer',
                      opacity: !topic.trim() || isLoading ? 0.4 : 1,
                    }}
                  >
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>auto_awesome</span>
                    {isLoading ? '生成中…' : (topic.trim() ? '生成爆款文案' : '请输入主题')}
                  </motion.button>
                </Magnetic>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── US-P10 AC4: 爆款选题回显(来自 step5 stepData LS)─── */}
      {step5Topic && (
        <Reveal style={{ marginBottom: 20 }}>
          <div
            data-testid="step7-step5-topic-echo"
            className="lg-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 16,
              padding: '14px 20px',
              border: `1px solid rgba(168,197,224,0.35)`,
              background: 'rgba(168,197,224,0.08)',
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.ikb, flexShrink: 0 }}>lightbulb</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ikb, fontFamily: F.mono, margin: 0, textShadow: C.textShadow }}>来自爆款选题阶段</p>
              <p
                data-testid="step7-step5-topic-text"
                style={{ fontSize: 14, fontWeight: 600, color: C.ink, fontFamily: F.cn, margin: '4px 0 0', textShadow: C.textShadow, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {step5Topic}
              </p>
            </div>
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              onClick={() => setTopic(step5Topic)}
              className="lg-glass"
              style={{ flexShrink: 0, borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: C.ikb, border: `0.5px solid rgba(168,197,224,0.5)`, background: 'transparent', cursor: 'pointer', fontFamily: F.cn, textShadow: C.textShadow }}
            >
              用此选题
            </motion.button>
          </div>
        </Reveal>
      )}

      {/* ── US-P10 AC3: 爆款解析区(可选·展开/收起)────────────── */}
      <Reveal style={{ marginBottom: 20 }}>
        <div className="lg-glass" style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid rgba(168,197,224,0.25)` }}>
          {/* 折叠头 */}
          <button
            type="button"
            data-testid="step7-viral-toggle"
            onClick={() => setViralExpanded((v) => !v)}
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              gap: 10,
              padding: '14px 20px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(168,197,224,0.18)', color: C.ikb, flexShrink: 0 }}>
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>rocket_launch</span>
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>
                可选：集成爆款解析（增强文案质量）
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: F.cn, margin: 0 }}>
                粘贴对标爆款文案 → AI 拆解 hook/body/cta 结构 → 按爆款结构生成
              </p>
            </div>
            {viralStructure && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.22)', color: C.ikb, fontFamily: F.mono, textShadow: C.textShadow, flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check_circle</span>
                已拆解
              </span>
            )}
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', flexShrink: 0, transform: viralExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>expand_more</span>
          </button>

          {/* 展开内容 */}
          {viralExpanded && (
            <div style={{ borderTop: `1px solid rgba(255,255,255,0.1)`, padding: '16px 20px' }}>
              <div
                className="lg-glass"
                style={{ overflow: 'hidden', borderRadius: 12, border: `1px solid rgba(255,255,255,0.1)`, marginBottom: 12 }}
                onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,197,224,0.5)'; }}
                onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                <textarea
                  data-testid="step7-viral-copy-input"
                  value={viralCopyText}
                  onChange={(e) => setViralCopyText(e.target.value)}
                  rows={4}
                  placeholder="粘贴对标爆款文案（至少10字），AI 将拆解其爆款结构注入文案生成"
                  style={{
                    width: '100%',
                    resize: 'none',
                    border: 0,
                    background: 'transparent',
                    padding: 14,
                    fontSize: 13,
                    lineHeight: 1.6,
                    outline: 'none',
                    fontFamily: F.cn,
                    color: C.ink,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  data-testid="step7-viral-analyze-btn"
                  onClick={handleViralAnalyze}
                  disabled={viralCopyText.trim().length < 10 || viralMutation.isPending}
                  className="lg-gradbtn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 9999,
                    padding: '8px 20px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: F.cn,
                    border: 'none',
                    cursor: viralCopyText.trim().length < 10 || viralMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: viralCopyText.trim().length < 10 || viralMutation.isPending ? 0.45 : 1,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>
                    {viralMutation.isPending ? 'progress_activity' : 'auto_awesome'}
                  </span>
                  {viralMutation.isPending ? '拆解中…' : '拆解爆款结构'}
                </button>
                {viralStructure && (
                  <button
                    type="button"
                    onClick={() => setViralStructure(null)}
                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.cn }}
                  >
                    清除结构
                  </button>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: F.mono }}>端到端真调待后端 key · UI 已接通</span>
              </div>
              {/* 拆解结果展示 */}
              {viralStructure && (
                <div
                  data-testid="step7-viral-structure-result"
                  style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {viralStructure.hook && (
                    <div className="lg-glass" style={{ borderRadius: 10, padding: '8px 14px', border: `0.5px solid rgba(168,197,224,0.35)` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ikb, fontFamily: F.mono }}>HOOK · 开场钩子</span>
                      <p style={{ fontSize: 12, color: C.ink, fontFamily: F.cn, margin: '4px 0 0', textShadow: C.textShadow }}>{viralStructure.hook}</p>
                    </div>
                  )}
                  {viralStructure.body && (
                    <div className="lg-glass" style={{ borderRadius: 10, padding: '8px 14px', border: `0.5px solid rgba(255,255,255,0.15)` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>BODY · 正文结构</span>
                      <p style={{ fontSize: 12, color: C.ink, fontFamily: F.cn, margin: '4px 0 0', textShadow: C.textShadow }}>{viralStructure.body}</p>
                    </div>
                  )}
                  {viralStructure.cta && (
                    <div className="lg-glass" style={{ borderRadius: 10, padding: '8px 14px', border: `0.5px solid rgba(168,197,224,0.25)` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ikb, fontFamily: F.mono }}>CTA · 行动号召</span>
                      <p style={{ fontSize: 12, color: C.ink, fontFamily: F.cn, margin: '4px 0 0', textShadow: C.textShadow }}>{viralStructure.cta}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Reveal>

      {/* ── 空态 (无真实结果 · 非加载中) ───────────────────── */}
      {!hasResult && !generateMutation.isPending && !dbQuery.isLoading && (
        <Reveal>
          <div
            data-testid="step7-empty-state"
            className="lg-glass"
            style={{
              marginBottom: 44,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              borderRadius: 20,
              padding: '64px 32px',
              textAlign: 'center',
              border: `1px dashed rgba(255,255,255,0.18)`,
            }}
          >
            <span style={{ display: 'flex', height: 64, width: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 18, background: 'rgba(168,197,224,0.18)', color: C.ink }}>
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 36, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>article</span>
            </span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, margin: 0 }}>尚未生成文案</p>
              <p style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '8px 0 0' }}>选择脚本类型和爆款元素，输入主题，点击「生成爆款文案」开始</p>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── 生成结果(全宽) · hasResult 门控 ───────────────── */}
      {hasResult && (
        <>
          <Reveal>
            <div className="lg-glass" style={{ marginBottom: 24, overflow: 'hidden', borderRadius: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `1px solid ${C.line}`,
                  padding: '16px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="lg-gradbtn" style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, color: '#fff', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>article</span>
                  </span>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>生成文案</h2>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>基于「{currentScript?.name ?? '脚本类型'}」框架 · AI 深度生成</p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  aria-label="复制文案"
                  onClick={handleCopyResult}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  className="lg-glass"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.84)',
                    fontFamily: F.cn,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textShadow: C.textShadow,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ink; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.84)'; }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>content_copy</span>
                  复制
                </motion.button>
              </div>
              <div style={{ padding: 24 }}>
                <pre
                  data-testid="step7-result-markdown"
                  style={{ whiteSpace: 'pre-wrap', fontFamily: F.cn, fontSize: 14, lineHeight: 1.7, color: C.ink, margin: 0, textShadow: C.textShadow }}
                >
                  {result.markdown}
                </pre>
                {result.structure && (
                  <div className="lg-glass" style={{ marginTop: 16, borderRadius: 12, padding: '12px 16px', border: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ikb, fontFamily: F.mono, textShadow: C.textShadow }}>内容结构 · </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{result.structure}</span>
                  </div>
                )}
                {result.cta && (
                  <div className="lg-glass" style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8, borderRadius: 12, padding: '12px 16px', border: `1px solid rgba(168,197,224,0.3)` }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ marginTop: 2, fontSize: 16, color: C.ikb }}>campaign</span>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ikb, fontFamily: F.mono, textShadow: C.textShadow }}>行动号召 · </span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>{result.cta}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* ── AI 优化区 ────────────────────────────────────────── */}
          <Reveal>
            <div className="lg-glass" style={{ marginBottom: 24, overflow: 'hidden', borderRadius: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.line}`, padding: '16px 24px' }}>
                <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>auto_fix_high</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>AI 智能优化</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>输入优化目标 · AI 一键深度改写文案</p>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="s7-optimize-goal" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 14, fontWeight: 800, letterSpacing: '0.04em', color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, cursor: 'pointer' }}>
                    <span style={{ display: 'inline-block', height: 14, width: 4, borderRadius: 9999, background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})`, marginRight: 4 }} />
                    优化目标
                  </label>
                  <div style={{ position: 'relative', minWidth: 0 }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ pointerEvents: 'none', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.45)' }}>edit</span>
                    <input
                      id="s7-optimize-goal"
                      type="text"
                      value={optimizeGoal}
                      onChange={(e) => setOptimizeGoal(e.target.value)}
                      placeholder="例如：加强转化钩子 / 提升情绪张力 / 更接地气"
                      className="lg-glass"
                      style={{
                        width: '100%',
                        minWidth: 0,
                        borderRadius: 12,
                        padding: '12px 12px 12px 40px',
                        fontSize: 14,
                        border: `1px solid rgba(255,255,255,0.12)`,
                        background: 'transparent',
                        color: C.ink,
                        fontFamily: F.cn,
                        outline: 'none',
                        boxSizing: 'border-box',
                        textShadow: C.textShadow,
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = `rgba(168,197,224,0.6)`; }}
                      onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = `rgba(255,255,255,0.12)`; }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Magnetic strength={0.3}>
                    <button
                      type="button"
                      onClick={handleOptimize}
                      aria-label="AI 优化"
                      className="lg-gradbtn"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 9999, padding: '12px 24px', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: F.cn, border: 'none', cursor: 'pointer' }}
                    >
                      <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>auto_awesome</span>
                      AI 优化
                    </button>
                  </Magnetic>
                  <motion.button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    whileHover={!isLoading ? { y: -3 } : undefined}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    className="lg-glass"
                    style={{
                      display: 'flex',
                      flexShrink: 0,
                      alignItems: 'center',
                      gap: 8,
                      whiteSpace: 'nowrap',
                      borderRadius: 14,
                      border: `1px solid rgba(255,255,255,0.18)`,
                      padding: '12px 20px',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: isLoading ? 'rgba(255,255,255,0.35)' : C.ink,
                      fontFamily: F.cn,
                      background: 'transparent',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      textShadow: C.textShadow,
                    }}
                  >
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>refresh</span>
                    重新生成
                  </motion.button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ── 数据洞察(雷达 + 趋势)─────────────────────────── */}
          <Reveal style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.ikb }}>insights</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 600, background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.mono, textShadow: C.textShadow }}>
                <span className="ikb-pulse" style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb }} />
                模型已就绪
              </span>
            </div>
          </Reveal>
          <RevealGroup style={{ marginBottom: 44, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 }}>
            {/* 文案爆款力雷达 */}
            <Item>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 24 }}
              >
                <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                      <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>radar</span>
                    </span>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>文案爆款力雷达</h3>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>六维模型评估 · 参考值</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, margin: 0, background: C.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent', fontFamily: F.display }}>84</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.mono }}>综合分 · 参考值</p>
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
                    <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="文案爆款力雷达图">
                      <defs>
                        <linearGradient id="s7-radarFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.5)" stopOpacity="0.12" />
                        </linearGradient>
                      </defs>
                      {[0.25, 0.5, 0.75, 1].map((f) => (
                        <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      ))}
                      {dims.map((_, i) => {
                        const [x, y] = pt(i, R);
                        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
                      })}
                      <polygon points={dataPoly} fill="url(#s7-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
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
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 0' }}>
                  {RADAR_DIMS_S7.map((d) => (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono, textShadow: C.textShadow }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Item>

            {/* 爆款元素权重分布 / 文案结构曲线 */}
            <Item>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 24 }}
              >
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: C.burgundy }}>
                      <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>show_chart</span>
                    </span>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>爆款元素权重分布 / 文案结构曲线</h3>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>按当前选中元素测算 · 参考值</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {['权重', '强度', '转化'].map((t, i) => (
                      <span
                        key={t}
                        style={i === 0
                          ? { background: C.ikb, color: 'rgba(6,14,38,0.85)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, fontFamily: F.mono }
                          : { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.8)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, fontFamily: F.mono }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                  <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, margin: 0, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>96</p>
                  <span style={{ marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 2, borderRadius: 9999, padding: '3px 10px', fontSize: 12, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb, textShadow: C.textShadow }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>trending_up</span>+230%
                  </span>
                  <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>较基准值 · 参考值</span>
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
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label="爆款元素权重分布曲线图">
                      <defs>
                        <linearGradient id="s7-trendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.ikb} stopOpacity="0.28" />
                          <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="s7-trendLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={C.ikb} />
                          <stop offset="55%" stopColor={C.accent3} />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
                        </linearGradient>
                      </defs>
                      {[0, 0.33, 0.66, 1].map((f) => (
                        <line
                          key={f}
                          x1={padL} x2={W - padR}
                          y1={(padT + innerH * f).toFixed(1)}
                          y2={(padT + innerH * f).toFixed(1)}
                          stroke="rgba(255,255,255,0.08)" strokeWidth="1"
                        />
                      ))}
                      <path d={area} fill="url(#s7-trendFill)" />
                      <path d={line} fill="none" stroke="url(#s7-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {data.map((v, i) => (
                        <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" />
                      ))}
                    </svg>
                  );
                })()}
                <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4, fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>
                  {TREND_LABELS_S7.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </motion.div>
            </Item>
          </RevealGroup>
        </>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderTop: `1px solid ${C.line}`, paddingTop: 24 }}>
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, background: 'transparent', border: 'none', cursor: 'pointer', textShadow: C.textShadow, transition: 'color 0.15s' }}
            onClick={handleChangeTopic}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ink; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.84)'; }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16, color: C.burgundy }}>favorite</span>
            想换个选题继续生成文案？
          </motion.button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.button
              type="button"
              aria-label="我的选题库"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.ikb, fontFamily: F.cn, background: 'transparent', border: 'none', cursor: 'pointer', textShadow: C.textShadow }}
              onClick={handleMyTopics}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>bookmarks</span>
              我的选题库
            </motion.button>
            <motion.button
              type="button"
              aria-label="爆款选题"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.ikb, fontFamily: F.cn, background: 'transparent', border: 'none', cursor: 'pointer', textShadow: C.textShadow }}
              onClick={handleHotTopics}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>local_fire_department</span>
              爆款选题
            </motion.button>
          </div>
        </div>
      </Reveal>
    </LiquidShell>
  );
}
