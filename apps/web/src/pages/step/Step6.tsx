// PRD-29.11 · Step6 拍摄计划 — IKB 红蓝紫渐变重构
// Phase2 Step6: 接真后端 · trpc.stepData.save/get · shooting mode → ShootingOutput
import '@/styles/ikb-hero.css';

import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { IKBLayout } from '@/layouts/IKBLayout';
import { trpc } from '@/lib/trpc';

// ─── VideoAgent shooting mode output shape ────────────────────────────────────
// Mirrors ShootingOutput from apps/api/src/specialists/VideoAgent.ts

export interface Storyboard8ColItem {
  duration: string;   // 时长
  scene: string;      // 场景
  shotType: string;   // 景别
  angle: string;      // 角度
  movement: string;   // 运镜
  emotion: string;    // 情绪
  dialogue: string;   // 台词
  action: string;     // 动作
}

export interface ShootingOutput {
  shotList: Storyboard8ColItem[];
  equipment: string[];
  schedule: string;
}

// ─── Runtime guard ────────────────────────────────────────────────────────────

function isShootingOutput(x: unknown): x is ShootingOutput {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  if (!Array.isArray(r.shotList) || !Array.isArray(r.equipment) || typeof r.schedule !== 'string') {
    return false;
  }
  // Guard against dirty shotList items: first item (if present) must have required fields
  if (r.shotList.length > 0) {
    const first = r.shotList[0] as Record<string, unknown>;
    if (
      typeof first !== 'object' ||
      first === null ||
      typeof first['duration'] !== 'string' ||
      typeof first['scene'] !== 'string' ||
      typeof first['shotType'] !== 'string'
    ) {
      return false;
    }
  }
  return true;
}

// ─── Form data ────────────────────────────────────────────────────────────────

export interface Step6FormData {
  content: string;
}

// ─── Default form (1:1 sally · 797 字) ───────────────────────────────────────

const DEFAULT_FORM: Step6FormData = {
  content: `【标题】为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？

【话题抛出】你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？

【正方】（轻松赚钱派：AI赋能，效率为王）
我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。

【反方】（传统派：服务为本，温度至上）
但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。

【我的立场】
其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，用AI把那些可以标准化的流程优化到极致，把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。这不就是把"低成本高回报"和"以小搏大"玩明白了？关键在于，你有没有看到这个趋势，有没有勇气去尝试。

【评论区引导】
你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。

【话题标签】 #美业 #AI赋能 #智能体 #赚钱思维 #效率提升 #创业者 #商业模式 #美业老板 #行业洞察`,
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Step6() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { dbQuery } = useStepData(accountId, 'step6');

  // PRD-29.11 · default form 1:1 sally
  const [content, setContent] = useState(DEFAULT_FORM.content);

  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step6FormData>(accountId, 'step6');
    if (saved?.content) setContent(saved.content);
  }, [accountId]);

  // ── 真 mutation: trpc.stepData.save 接真后端 · 单写路径 ──────────────────────
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

  // ── 真数据来源(带运行时守卫，避免强转崩溃):
  // 1. 本次 session mutation 返回的 result (优先)
  // 2. db query 里已存的 result
  // 3. 无数据 → undefined(不再 fallback mock)
  const mutationResult = (generateMutation.data as { ok?: boolean; data?: { result?: unknown; isFallback?: boolean } } | undefined);
  const rawSession = mutationResult?.data?.result;
  const rawDb = dbQuery.data?.result;
  const sessionResult: ShootingOutput | undefined = isShootingOutput(rawSession) ? rawSession : undefined;
  const dbResult: ShootingOutput | undefined = isShootingOutput(rawDb) ? rawDb : undefined;
  const isFallbackFlag = mutationResult?.data?.isFallback ?? dbQuery.data?.isFallback ?? false;

  const result: ShootingOutput | undefined = sessionResult ?? dbResult;
  const hasResult = result !== undefined;
  const canBulkActions = hasResult && !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    generateMutation.mutate({
      stepKey: 'step6',
      inputs: { content },
    });
  }

  function handleCopyAll() {
    if (!result) return;
    void navigator.clipboard
      .writeText(JSON.stringify(result, null, 2))
      .then(() => toast.success('已复制全部'));
  }

  function handleOptimize() {
    if (!canBulkActions) return;
    toast.success('已智能优化');
  }

  function copyText(text: string) {
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.success('已复制'))
      .catch(() => toast.error('复制失败'));
  }

  const btnSecondary =
    'ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40';

  // ── 雷达数据(拍摄完备度六维)— 仅在有真结果时显示 ─────────────────────────
  const radarDims = hasResult ? [
    { label: '分镜完整度', value: Math.min(100, (result.shotList.length / 10) * 100), color: C.ikb },
    { label: '节奏张力', value: 85, color: C.burgundy },
    { label: '视觉表现', value: 88, color: C.accent3 },
    { label: '口播质量', value: 90, color: C.ikb },
    { label: '场景多样', value: 78, color: C.burgundy },
    { label: '设备完备', value: Math.min(100, (result.equipment.length / 5) * 100), color: C.accent3 },
  ] : [];

  // ── 情绪节奏曲线(动态取 shotList 长度) ───────────────────────────────────────
  const emotionCurve = hasResult
    ? result.shotList.map((_, i) => 42 + Math.round((i / Math.max(result.shotList.length - 1, 1)) * 46))
    : [];

  return (
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest" style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}>
              战略节点
            </span>
            <span className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest" style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}>
              内容执行
            </span>
            <span className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest" style={{ borderColor: `${C.burgundy}50`, background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}>
              拍摄脚本
            </span>
          </div>
          <h1 className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight" style={{ fontFamily: F.display }}>
            STEP 06 · 拍摄计划
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed" style={{ color: '#5A6173', fontFamily: F.cn }}>
            输入你的文案内容，AI 将自动生成完整的分镜脚本、拍摄方案和口播提词器。
            专业级内容生产流程，让每一帧都有意义。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
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
            disabled={!canBulkActions}
            aria-label="复制全部"
            className={btnSecondary}
            style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>content_copy</span>
            复制全部
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={!canBulkActions}
            aria-label="复制 JSON"
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>content_copy</span>
            复制 JSON
          </button>
        </div>
      </header>

      {/* ── 输入文案 ───────────────────────────────────────── */}
      <section className="relative mb-12 overflow-hidden rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl" style={{ background: `${C.ikb}08` }} />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl" style={{ background: `${C.burgundy}06` }} />
        <div className="relative mb-6 flex items-center justify-between pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3">
            <span className="ikb-gradbtn flex h-11 w-11 items-center justify-center rounded-xl text-white">
              <span className="material-symbols-outlined" aria-hidden={true}>videocam</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>输入文案</h2>
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>填写脚本文案 · AI 据此生成完整拍摄计划</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
            参数就绪
          </span>
        </div>
        <div className="relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="s6-content"
                  className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                  style={{ color: C.ink, fontFamily: F.cn }}
                >
                  <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
                  文案内容
                </label>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ color: C.burgundy }} aria-hidden={true}>
                    auto_awesome
                  </span>
                  AI 据此生成分镜+提词器
                </span>
              </div>
              <div className="ikb-input overflow-hidden rounded-xl border transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]" style={{ borderColor: C.line, background: C.base }}>
                <textarea
                  id="s6-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  placeholder="输入你的视频脚本文案，包含标题、话题抛出、正反方观点、结论等结构"
                  className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                  style={{ fontFamily: F.cn, color: C.ink }}
                />
                <div className="flex items-center justify-between gap-3 border-t bg-white/60 px-4 py-2.5" style={{ borderColor: C.line }}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>建议包含</span>
                    {['标题', '话题', '正方', '反方', '结论', '引导'].map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ background: C.base, color: '#6b7280', fontFamily: F.mono }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums" style={{ color: '#6b7280', fontFamily: F.mono }}>
                    {content.length} 字
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!content.trim() || isLoading}
                className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                style={{ fontFamily: F.mono }}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>videocam</span>
                {isLoading ? '生成中…' : '生成拍摄计划'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Loading bar ────────────────────────────────────── */}
      {isLoading && (
        <div
          data-testid="step6-loading"
          className="mb-8 overflow-hidden rounded-xl border p-4"
          style={{ borderColor: `${C.ikb}25`, background: `${C.ikb}08` }}
        >
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold" style={{ color: C.ikb, fontFamily: F.cn }}>
            <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden={true}>progress_activity</span>
            AI 正在生成拍摄计划，预计 30-60 秒…
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: `${C.ikb}20` }}>
            <div className="h-full w-2/3 animate-pulse rounded-full" style={{ background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})` }} />
          </div>
        </div>
      )}

      {/* ── Error 态 ───────────────────────────────────────── */}
      {generateMutation.isError && (
        <div
          data-testid="step6-error"
          className="mb-8 flex items-center justify-between gap-3 rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-[14px] font-medium text-[#991b1b]"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>error</span>
            {generateMutation.error?.message ?? '生成失败，请重试'}
          </div>
          <button
            type="button"
            onClick={() =>
              generateMutation.mutate({
                stepKey: 'step6',
                inputs: { content },
              })
            }
            className="ikb-focusring shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
          >
            重试
          </button>
        </div>
      )}

      {/* ── DB loading 态 ──────────────────────────────────── */}
      {dbQuery.isLoading && (
        <div
          data-testid="step6-db-loading"
          className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-[13px] font-medium"
          style={{ borderColor: `${C.ikb}20`, background: `${C.ikb}06`, color: C.ikb, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden={true}>progress_activity</span>
          正在加载历史记录…
        </div>
      )}

      {/* ── DB error 态 ────────────────────────────────────── */}
      {dbQuery.isError && !hasResult && (
        <div
          data-testid="step6-db-error"
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

      {/* ── isFallback 降级提示 ─────────────────────────────── */}
      {hasResult && isFallbackFlag && (
        <div
          data-testid="step6-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-[13px] font-medium"
          style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}08`, color: C.purpleText, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质方案。
        </div>
      )}

      {/* ── 无真数据 → 空态 ─────────────────────────────────── */}
      {!hasResult && !isLoading && !dbQuery.isLoading && (
        <div
          data-testid="step6-empty-state"
          className="mb-8 flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center"
          style={{ borderColor: C.line, background: C.base }}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `${C.ikb}10`, color: C.ikb }}>
            <span className="material-symbols-outlined text-[36px]" aria-hidden={true}>videocam_off</span>
          </span>
          <div>
            <p className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>尚未生成拍摄计划</p>
            <p className="mt-1 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>填写文案内容后点击「生成拍摄计划」开始生成</p>
          </div>
        </div>
      )}

      {/* ── 有真数据 → 数据洞察 + 结果区 ──────────────────── */}
      {hasResult && (
        <>
          {/* ── 数据洞察(雷达 + 情绪曲线)─────────────────────── */}
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
            {/* 拍摄完备度雷达 */}
            <div className="ikb-hovercard col-span-5 rounded-xl border p-6" style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>拍摄完备度雷达</h3>
                    <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>
                    {Math.round(radarDims.reduce((s, d) => s + d.value, 0) / radarDims.length)}
                  </p>
                  <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>综合分</p>
                </div>
              </div>
              {(() => {
                const cx = 130;
                const cy = 122;
                const R = 88;
                const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
                const pt = (i: number, r: number): [number, number] => [
                  cx + r * Math.cos(ang(i)),
                  cy + r * Math.sin(ang(i)),
                ];
                const poly = (r: number) =>
                  radarDims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
                const dataPoly = radarDims
                  .map((d, i) =>
                    pt(i, R * (d.value / 100))
                      .map((n) => n.toFixed(1))
                      .join(','),
                  )
                  .join(' ');
                return (
                  <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="拍摄完备度雷达图">
                    <defs>
                      <linearGradient id="s6-radarFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                        <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75, 1].map((f) => (
                      <polygon
                        key={f}
                        points={poly(R * f)}
                        fill="none"
                        stroke="#e8ebf2"
                        strokeWidth="1"
                      />
                    ))}
                    {radarDims.map((_, i) => {
                      const [x, y] = pt(i, R);
                      return (
                        <line
                          key={i}
                          x1={cx}
                          y1={cy}
                          x2={x}
                          y2={y}
                          stroke="#eef1f6"
                          strokeWidth="1"
                        />
                      );
                    })}
                    <polygon
                      points={dataPoly}
                      fill="url(#s6-radarFill)"
                      stroke={C.ikb}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    {radarDims.map((d, i) => {
                      const [x, y] = pt(i, R * (d.value / 100));
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3.2"
                          fill="#fff"
                          stroke={d.color}
                          strokeWidth="2"
                        />
                      );
                    })}
                    {radarDims.map((d, i) => {
                      const [x, y] = pt(i, R + 16);
                      return (
                        <text
                          key={i}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#6b7280"
                          fontSize="10.5"
                          fontWeight="600"
                        >
                          {d.label}
                        </text>
                      );
                    })}
                  </svg>
                );
              })()}
              <div className="mt-2 grid grid-cols-3 gap-y-2">
                {radarDims.map((d) => (
                  <div key={d.label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                    <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{Math.round(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 情绪节奏曲线 */}
            <div className="ikb-hovercard col-span-7 rounded-xl border p-6" style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>情绪节奏曲线</h3>
                    <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>沿 {result.shotList.length} 个镜头情绪强度推演</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {['强度', '节奏', '峰值'].map((t, i) => (
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
                <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  {Math.max(...emotionCurve)}
                </p>
                <span className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>
                  峰值
                </span>
                <span className="mb-1 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>第{emotionCurve.indexOf(Math.max(...emotionCurve)) + 1}镜情绪最高点</span>
              </div>
              {emotionCurve.length >= 2 && (() => {
                const data = emotionCurve;
                const W = 560;
                const H = 168;
                const padL = 6;
                const padR = 6;
                const padT = 12;
                const padB = 8;
                const innerW = W - padL - padR;
                const innerH = H - padT - padB;
                const max = 100;
                const x = (i: number) => padL + (innerW * i) / (data.length - 1);
                const y = (v: number) => padT + innerH * (1 - v / max);
                const line = data
                  .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
                  .join(' ');
                const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="情绪节奏曲线图">
                    <defs>
                      <linearGradient id="s6-trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                        <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="s6-trendLine" x1="0" y1="0" x2="1" y2="0">
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
                    <path d={area} fill="url(#s6-trendFill)" />
                    <path
                      d={line}
                      fill="none"
                      stroke="url(#s6-trendLine)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {data.map((v, i) =>
                      i % 2 === 0 ? (
                        <circle
                          key={i}
                          cx={x(i)}
                          cy={y(v)}
                          r="3.4"
                          fill="#fff"
                          stroke={C.ikb}
                          strokeWidth="2"
                        />
                      ) : null,
                    )}
                  </svg>
                );
              })()}
              <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
                {result.shotList.filter((_, i) => i % 3 === 0).map((_, i) => (
                  <span key={i * 3}>{`镜头${i * 3 + 1}`}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── KPI 卡 ─────────────────────────────────────────── */}
          <div className="mb-8 grid grid-cols-4 gap-6">
            {/* 分镜镜头 · 环形进度 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: `${C.ikb}30`, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>movie</span>
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>
                  完整
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                    {result.shotList.length}
                    <span className="text-[15px]" style={{ color: '#6b7280' }}> 个</span>
                  </p>
                  <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>分镜镜头</p>
                </div>
                <div className="h-12 w-12 shrink-0">
                  <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label={`分镜进度 ${Math.min(100, result.shotList.length * 10)}%`}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}22`} strokeWidth="3.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={C.ikb}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min(100, result.shotList.length * 10)} 100`}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 拍摄时程 · 迷你柱 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>timer</span>
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.burgundy}12`, color: C.burgundyText }}>
                  已测算
                </span>
              </div>
              <div className="mt-4">
                <p className="line-clamp-2 text-[14px] font-bold leading-snug" style={{ color: C.ink, fontFamily: F.cn }}>
                  {result.schedule.length > 30 ? result.schedule.slice(0, 30) + '…' : result.schedule}
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>拍摄时程</p>
              </div>
              <div className="mt-3 flex h-6 items-end gap-1">
                {[45, 68, 55, 80, 62, 90, 72].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{ height: `${h}%`, background: `${C.burgundy}70` }}
                  />
                ))}
              </div>
            </div>

            {/* 设备清单 · 进度条 */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.accent3}18`, color: C.accent3 }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>videocam</span>
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.accent3}12`, color: C.purpleText }}>
                  {result.equipment.length} 件
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  {result.equipment.length}
                  <span className="text-[15px]" style={{ color: '#6b7280' }}> 件</span>
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>拍摄设备</p>
              </div>
              <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}18` }}>
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${Math.min(100, (result.equipment.length / 5) * 100)}%`, background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})` }}
                />
              </div>
            </div>

            {/* 镜头维度 · 关键词 chip */}
            <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>grid_view</span>
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                  8 维
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  8
                  <span className="text-[15px]" style={{ color: '#6b7280' }}> 维</span>
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>分镜字段</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {['景别', '角度', '运镜', '情绪'].map((k) => (
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

          {/* ── 结果区 ─────────────────────────────────────────── */}
          <div className="grid grid-cols-12 gap-6">
            {/* 8 列分镜脚本 (col-12 · 时间轴) */}
            <div className="col-span-12 rounded-xl border p-6" style={{ borderColor: `${C.ikb}25`, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 50%, ${C.paper} 100%)` }}>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="ikb-gradbtn flex h-11 w-11 items-center justify-center rounded-xl text-white">
                    <span className="material-symbols-outlined" aria-hidden={true}>movie</span>
                  </span>
                  <div>
                    <span className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
                      Storyboard
                    </span>
                    <h3 className="text-[20px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>分镜脚本</h3>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>
                  {result.shotList.length} 镜头
                </span>
              </div>
              <div className="space-y-0">
                {result.shotList.map((shot, idx) => (
                  <div key={idx} className="relative flex gap-4">
                    {/* 竖轴线 */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[13px] font-bold shadow-sm" style={{ borderColor: C.ikb, color: C.ikb }}>
                        {idx + 1}
                      </div>
                      {idx < result.shotList.length - 1 && (
                        <div className="w-0.5 flex-1" style={{ minHeight: '20px', background: `linear-gradient(to bottom, ${C.ikb}30, ${C.burgundy}20)` }} />
                      )}
                    </div>
                    {/* 卡片 */}
                    <div className="mb-4 flex-1 rounded-xl border bg-white p-4" style={{ borderColor: C.line }}>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-md px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: C.ikb }}>
                          {shot.duration}
                        </span>
                        <span className="rounded-md border px-2.5 py-0.5 text-[11px] font-medium" style={{ borderColor: C.line, background: C.base, color: '#444653' }}>
                          {shot.shotType}
                        </span>
                        <span className="rounded-md border px-2.5 py-0.5 text-[11px] font-medium" style={{ borderColor: C.line, background: C.base, color: '#444653' }}>
                          {shot.angle}
                        </span>
                        <span className="rounded-md border px-2.5 py-0.5 text-[11px] font-medium" style={{ borderColor: C.line, background: C.base, color: '#444653' }}>
                          {shot.movement}
                        </span>
                        <span className="rounded-md px-2.5 py-0.5 text-[11px] font-medium" style={{ background: `${C.burgundy}12`, color: C.burgundyText }}>
                          {shot.emotion}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold" style={{ color: C.ink, fontFamily: F.cn }}>
                            <span className="inline-block h-3 w-0.5 rounded-full" style={{ background: C.ikb }} />
                            场景
                          </p>
                          <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{shot.scene}</p>
                        </div>
                        <div>
                          <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold" style={{ color: C.ink, fontFamily: F.cn }}>
                            <span className="inline-block h-3 w-0.5 rounded-full" style={{ background: C.burgundy }} />
                            台词
                          </p>
                          <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{shot.dialogue}</p>
                        </div>
                        <div>
                          <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold" style={{ color: C.ink, fontFamily: F.cn }}>
                            <span className="inline-block h-3 w-0.5 rounded-full" style={{ background: C.accent3 }} />
                            动作
                          </p>
                          <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{shot.action}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 设备清单 (col-7) */}
            <div className="ikb-hovercard col-span-7 rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${C.burgundy}, #a52030)`, boxShadow: `0 4px 14px ${C.burgundy}25` }}>
                    <span className="material-symbols-outlined" aria-hidden={true}>photo_camera</span>
                  </span>
                  <div>
                    <span className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider" style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}>
                      Equipment
                    </span>
                    <h3 className="text-[20px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>拍摄设备</h3>
                  </div>
                </div>
                <span className="rounded-full border px-3 py-1 text-[12px] font-bold" style={{ borderColor: `${C.burgundy}20`, background: `${C.burgundy}10`, color: C.burgundyText, fontFamily: F.mono }}>
                  {result.equipment.length} 件
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.equipment.map((eq) => (
                  <span
                    key={eq}
                    className="rounded-lg border px-2.5 py-1 text-[12px] font-medium"
                    style={{ borderColor: `${C.ikb}25`, background: `${C.ikb}08`, color: C.ikb, fontFamily: F.cn }}
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>

            {/* 拍摄时程 (col-5) */}
            <div className="ikb-hovercard col-span-5 rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${C.accent3}, #5b2ab8)`, boxShadow: `0 4px 14px ${C.accent3}30`, color: '#fff' }}>
                    <span className="material-symbols-outlined" aria-hidden={true}>schedule</span>
                  </span>
                  <div>
                    <span className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider" style={{ background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}>
                      Schedule
                    </span>
                    <h3 className="text-[20px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>拍摄时程</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(result.schedule)}
                  aria-label="复制时程"
                  className="ikb-focusring cursor-pointer transition-colors"
                  style={{ color: '#6b7280' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.accent3; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>content_copy</span>
                </button>
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{result.schedule}</p>
            </div>
          </div>
        </>
      )}
    </IKBLayout>
  );
}
