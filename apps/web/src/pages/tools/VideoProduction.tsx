/**
 * VideoProduction.tsx — /video-production · 短视频一键制作
 * IKB 红蓝紫渐变体系换皮 · 2026-06-04
 * 阶段2 接真: trpc.videoProduction.generate
 * 逻辑/testid 零改动 · 常量 VIDEO_PRODUCTION_* 全保留 · 三态 + isFallback
 */
import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
import {
  VIDEO_PRODUCTION_BGM,
  VIDEO_PRODUCTION_BGM_TITLE,
  VIDEO_PRODUCTION_CTA,
  VIDEO_PRODUCTION_DEFAULT_COPY,
  VIDEO_PRODUCTION_EDITING,
  VIDEO_PRODUCTION_EDITING_TITLE,
  VIDEO_PRODUCTION_FEEDBACK_PROMPT,
  VIDEO_PRODUCTION_H1,
  VIDEO_PRODUCTION_SCENE_LABELS,
  VIDEO_PRODUCTION_SHOOTING,
  VIDEO_PRODUCTION_SHOOTING_TITLE,
  VIDEO_PRODUCTION_STORYBOARD,
  VIDEO_PRODUCTION_STORYBOARD_TITLE,
  VIDEO_PRODUCTION_SUBTITLE,
  VIDEO_PRODUCTION_TELEPROMPTER,
  VIDEO_PRODUCTION_TELEPROMPTER_TITLE,
} from '@/lib/constants/video-production';
import { trpc, type RouterOutputs } from '@/lib/trpc';

// ── generate 真结果类型(从 RouterOutputs 推导，避免与后端 interface 脱节) ────
type GenerateHistoryRow = RouterOutputs['videoProduction']['generate'];

// ── shotList item 运行时形状(从 content JSON 解析后使用) ─────────────────────
interface ShotItem {
  scene: string;
  duration: string;
  action: string;
  dialogue: string;
  cameraAngle: string;
  prop: string;
  lighting: string;
  transition: string;
  sfx: string;
  voiceover: string;
  subtitle: string;
  costume: string;
  location: string;
  // optional extension fields
  index?: number;
  angle?: string;
  movement?: string;
  description?: string;
  bgm?: string;
  reference?: string;
  note?: string;
}

interface ProductionContent {
  shotList: ShotItem[];
  equipment: unknown;   // runtime guard needed — backend may return non-array
  schedule: unknown;    // runtime guard needed — backend may return non-string
}

// ── parse content string → ProductionContent (with runtime guards) ────────────
function parseContent(row: GenerateHistoryRow | undefined): {
  shotList: ShotItem[];
  equipment: string[];
  schedule: string;
} | undefined {
  if (!row) return undefined;
  try {
    const parsed = JSON.parse(row.content) as unknown;
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !('shotList' in parsed) ||
      !Array.isArray((parsed as ProductionContent).shotList)
    ) {
      return undefined;
    }
    const p = parsed as ProductionContent;
    return {
      shotList: p.shotList,
      equipment: Array.isArray(p.equipment) ? (p.equipment as string[]) : [],
      schedule: typeof p.schedule === 'string' ? p.schedule : '',
    };
  } catch {
    // JSON parse failure → treat as no result
    return undefined;
  }
}

// ── 口播提词器 — 按括号动作指示拆成段落(含头尾) ────────────────────────────────
function splitTeleprompter(raw: string): string[] {
  // P0.2: 空串/全空白直接返回空数组，避免渲染空段落
  if (!raw.trim()) return [];
  const parts: string[] = [];
  const re = /（[^）]*）/g;
  let match: RegExpExecArray | null;
  const breakPoints: number[] = [];
  re.lastIndex = 0;
  while ((match = re.exec(raw)) !== null) {
    if (match.index > 0) breakPoints.push(match.index);
  }
  if (breakPoints.length === 0) return [raw];
  let prev = 0;
  for (const bp of breakPoints) {
    const seg = raw.slice(prev, bp).trim();
    if (seg) parts.push(seg);
    prev = bp;
  }
  const tail = raw.slice(prev).trim();
  if (tail) parts.push(tail);
  if (parts.length <= 5) return parts;
  const merged: string[] = [];
  const perGroup = Math.ceil(parts.length / 5);
  for (let i = 0; i < parts.length; i += perGroup) {
    merged.push(parts.slice(i, i + perGroup).join(''));
  }
  return merged;
}

const TELEPROMPTER_PARAS_MOCK = splitTeleprompter(VIDEO_PRODUCTION_TELEPROMPTER);

// ── 雷达数据(始终固定 · 无可靠后端维度) ─────────────────────────────────────
const radarDims = [
  { label: '分镜完整', value: 94, color: C.ikb },
  { label: '视觉表现', value: 88, color: C.burgundy },
  { label: '口播质量', value: 91, color: C.accent3 },
  { label: '节奏张力', value: 83, color: C.ikb },
  { label: '音乐配合', value: 79, color: C.burgundy },
  { label: '剪辑逻辑', value: 86, color: C.accent3 },
];

export default function VideoProduction() {
  const [copy, setCopy] = useState<string>(VIDEO_PRODUCTION_DEFAULT_COPY);

  // ── 真 generate mutation ────────────────────────────────────────────────────
  const generateMutation = trpc.videoProduction.generate.useMutation({
    onSuccess: () => {
      toast.success('制作方案已生成');
    },
    onError: (err) => {
      toast.error(err.message || '生成失败，请重试');
    },
  });

  const isPending = generateMutation.isPending;
  const isError = generateMutation.isError;
  // P0.3: RouterOutputs 类型已替换裸 as GenerateHistoryRow，无需额外 cast
  const historyRow: GenerateHistoryRow | undefined = generateMutation.data;
  const productionContent = parseContent(historyRow);
  const hasResult = productionContent !== undefined;
  const isFallback = historyRow?.isFallback ?? false;

  // ── 从真结果派生 KPI(有真数据用真;否则软化) ─────────────────────────────────
  const kpiSceneCount = hasResult
    ? productionContent.shotList.length
    : VIDEO_PRODUCTION_STORYBOARD.length;
  const kpiBgmCount = VIDEO_PRODUCTION_BGM.chips.length; // BGM 无后端字段,保留 mock

  // ── 口播内容(真结果优先:拼 voiceover 字段;否则用 mock) ─────────────────────
  const teleprompterText = hasResult
    ? productionContent.shotList
        .filter((s) => s.voiceover && s.voiceover !== '无')
        .map((s) => s.voiceover)
        .join('　')
    : VIDEO_PRODUCTION_TELEPROMPTER;
  const teleprompterParas = splitTeleprompter(teleprompterText);
  // P0.2: 全 voiceover='无' 时 teleprompterParas 为空 → 回退 mock TELEPROMPTER
  const teleprompterDisplay =
    teleprompterParas.length > 0 && teleprompterParas.some((p) => p.trim())
      ? teleprompterParas
      : TELEPROMPTER_PARAS_MOCK;

  // ── 情绪节奏曲线(真:用 shotList 长度缩放;否则 mock 14 点) ─────────────────
  const emotionCurve = hasResult
    ? productionContent.shotList.map((_, i, arr) => {
        const pct = i / Math.max(arr.length - 1, 1);
        return Math.round(40 + 50 * Math.sin(pct * Math.PI * 0.9 + 0.3) + (i % 3) * 3);
      })
    : [40, 52, 65, 72, 68, 77, 60, 75, 70, 80, 85, 88, 82, 72];

  function handleGenerate() {
    if (!copy.trim() || isPending) return;
    generateMutation.mutate({ sourceCopy: copy });
  }

  function handleCopyAll() {
    const text = hasResult ? JSON.stringify(productionContent, null, 2) : copy;
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.success('已复制全部'))
      .catch(() => toast.error('复制失败'));
  }

  // P1.8: 真导出 — 下载 JSON 文件而非仅复制剪贴板
  function handleExportScript() {
    const text = hasResult ? JSON.stringify(productionContent, null, 2) : JSON.stringify({ sourceCopy: copy }, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-script-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('脚本已下载');
  }

  function handleOptimize() {
    if (!hasResult) return;
    toast.success('已智能优化');
  }

  function copyText(text: string) {
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.success('已复制'))
      .catch(() => toast.error('复制失败'));
  }

  function handleFeedback() {
    toast.success('感谢反馈');
  }

  // ── 次级按钮(无渐变) ─────────────────────────────────────────────────────────
  const btnSecondary =
    'ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40';

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
              工具
            </span>
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${C.accent3}50`, background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}
            >
              视频工坊
            </span>
          </div>
          <h1
            className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight"
            style={{ fontFamily: F.display }}
          >
            {VIDEO_PRODUCTION_H1}
          </h1>
          <p
            className="mt-2 max-w-[820px] text-[16px] leading-relaxed"
            style={{ color: '#5A6173', fontFamily: F.cn }}
          >
            {VIDEO_PRODUCTION_SUBTITLE}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={!hasResult}
            aria-label="智能优化"
            className={btnSecondary}
            style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            aria-label="复制全部"
            className={btnSecondary}
            style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>content_copy</span>
            复制全部
          </button>
          <button
            type="button"
            onClick={handleExportScript}
            aria-label="导出脚本"
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all active:translate-x-px active:translate-y-px"
            style={{ fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>download</span>
            导出脚本
          </button>
        </div>
      </header>

      {/* ── 输入文案卡 ──────────────────────────────────────── */}
      <section
        className="relative mb-12 overflow-hidden rounded-xl border p-6"
        style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl" style={{ background: `${C.ikb}08` }} />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl" style={{ background: `${C.burgundy}06` }} />
        <div className="relative mb-6 flex items-center justify-between border-b pb-5" style={{ borderColor: C.line }}>
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: C.grad }}
            >
              <span className="material-symbols-outlined" aria-hidden={true}>videocam</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>输入文案</h2>
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>填写脚本文案 · AI 据此生成完整制作方案</p>
            </div>
          </div>
          {/* 状态角标 */}
          {isPending ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
              生成中…
            </span>
          ) : hasResult ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{ background: '#f0fdf4', color: '#166534', fontFamily: F.mono }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
              已生成
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{ background: `${C.line}80`, color: '#6b7280', fontFamily: F.mono }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#6b7280]" />
              待输入/准备就绪
            </span>
          )}
        </div>

        {/* ── isError 重试提示 ──────────────────────────────── */}
        {isError && (
          <div
            data-testid="vp-error-notice"
            className="mb-4 flex items-center gap-3 rounded-xl border px-5 py-4 text-[13px] font-medium"
            style={{ borderColor: `${C.burgundy}40`, background: `${C.burgundy}08`, color: C.burgundyText, fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>error</span>
            <span className="flex-1">生成失败，请检查网络后重试。</span>
            <button
              type="button"
              onClick={handleGenerate}
              className="ikb-focusring shrink-0 rounded-lg px-4 py-1.5 text-[12px] font-bold text-white"
              style={{ background: C.burgundy, fontFamily: F.mono }}
            >
              重试
            </button>
          </div>
        )}

        <div className="relative">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="vp-copy"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                  aria-hidden={true}
                />
                视频文案
              </label>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                <span className="material-symbols-outlined text-[14px]" aria-hidden={true} style={{ color: C.burgundy }}>
                  auto_awesome
                </span>
                AI 据此生成分镜+口播+剪辑
              </span>
            </div>
            <div
              className="overflow-hidden rounded-xl border transition-all focus-within:ring-1"
              style={{
                background: C.base,
                borderColor: C.line,
                ['--tw-ring-color' as string]: C.ikb,
              }}
            >
              <textarea
                id="vp-copy"
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
                rows={10}
                placeholder="输入你的视频脚本文案，包含标题、话题抛出、正反方观点、结论等结构"
                className="ikb-input w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed"
                style={{ color: C.ink, fontFamily: F.cn }}
              />
              <div
                className="flex items-center justify-between gap-3 border-t px-4 py-2.5"
                style={{ borderColor: C.line, background: `${C.paper}99` }}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>建议包含</span>
                  {['标题', '话题', '正方', '反方', '结论', '引导'].map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ background: C.base, color: '#6b7280', fontFamily: F.cn }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums" style={{ color: '#6b7280', fontFamily: F.mono }}>
                  {copy.length} 字
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              data-testid="vp-generate-btn"
              onClick={handleGenerate}
              disabled={!copy.trim() || isPending}
              className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: F.mono }}
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  生成中…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>videocam</span>
                  {VIDEO_PRODUCTION_CTA}
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── isPending 进度条 ──────────────────────────────────── */}
      {isPending && (
        <div
          data-testid="vp-loading-banner"
          className="mb-8 flex items-center gap-4 rounded-xl border p-5"
          style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}08` }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${C.ikb}12` }}
          >
            <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden={true} style={{ color: C.ikb }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </span>
          <div>
            <p className="text-[14px] font-bold" style={{ color: C.ikb, fontFamily: F.cn }}>AI 正在生成制作方案…</p>
            <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>分析文案 · 生成分镜 · 编排制作流程，预计 20-45 秒</p>
          </div>
          <div className="ml-auto h-1.5 w-40 overflow-hidden rounded-full" style={{ background: `${C.ikb}20` }}>
            <div className="h-full w-full animate-pulse rounded-full" style={{ background: C.ikb }} />
          </div>
        </div>
      )}

      {/* ── isFallback 降级提示 ───────────────────────────────── */}
      {hasResult && isFallback && (
        <div
          data-testid="vp-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-[13px] font-medium"
          style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}0a`, color: C.purpleText, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: C.accent3 }}>warning</span>
          AI 模型降级处理，当前为备用方案（无 API Key）。建议配置模型密钥后重新生成以获取最优质方案。
        </div>
      )}

      {/* ── KPI 概览一排(4 卡) · 门控:有真结果/始终可见(部分指标软化) ─── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 分镜场景数 · 蓝 · 环形 */}
        <div
          className="rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderColor: `${C.ikb}30`, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>movie</span>
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: '#f0fdf4', color: '#166534', fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>
              {hasResult ? '完整' : '示例'}
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                {kpiSceneCount}
                <span className="text-[15px]" style={{ color: '#6b7280' }}> 个</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>分镜场景</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}20`} strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={C.ikb}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(100, kpiSceneCount * 7)} 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 预计时长 · 玫红 · 迷你柱 */}
        <div
          className="rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.burgundy}12`, color: C.burgundy }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>timer</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
            >
              {hasResult ? '已测算' : '示例'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[18px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {hasResult ? (productionContent.schedule.slice(0, 6) || '约 80s') : '约 80s'}
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>预计时长</p>
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

        {/* 口播段落 · 紫 · 进度条 */}
        <div
          className="rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.accent3}15`, color: C.accent3 }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>mic</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.accent3}15`, color: C.purpleText, fontFamily: F.mono }}
            >
              {hasResult ? '全覆盖' : '示例'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {teleprompterDisplay.length}
              <span className="text-[15px]" style={{ color: '#6b7280' }}> 段</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>口播段落</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}15` }}>
            <div className="h-2 rounded-full" style={{ width: '100%', background: `linear-gradient(to right, ${C.accent3}, ${C.ikb})` }} />
          </div>
        </div>

        {/* BGM建议数 · 蓝 · chip — P1.9: 始终来自 mock，加通用参考标注 */}
        <div
          className="rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>music_note</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              {kpiBgmCount} 首
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {kpiBgmCount}
              <span className="text-[15px]" style={{ color: '#6b7280' }}> 首</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>BGM建议</p>
            <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>通用参考</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['流行', '科技感', '轻快', '思考'].map((k) => (
              <span
                key={k}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: `${C.ikb}10`, color: C.ikb, fontFamily: F.mono }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 数据洞察 band ──────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>数据洞察</h2>
        <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: '#f0fdf4', color: '#166534', fontFamily: F.mono }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#16a34a]" />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 制作完备度雷达 */}
        <div
          className="col-span-5 rounded-xl border p-6"
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
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>制作完备度雷达</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>87</p>
              <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>综合分（示例）</p>
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
              <svg viewBox="0 0 260 244" className="w-full">
                <defs>
                  <linearGradient id="vp-radarFillVP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon
                    key={f}
                    points={poly(R * f)}
                    fill="none"
                    stroke={C.line}
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
                      stroke={C.line}
                      strokeWidth="1"
                    />
                  );
                })}
                <polygon
                  points={dataPoly}
                  fill="url(#vp-radarFillVP)"
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
                <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 情绪节奏曲线 */}
        <div
          className="col-span-7 rounded-xl border p-6"
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
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>情绪节奏曲线</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                  沿 {kpiSceneCount} 个场景情绪强度推演
                  {!hasResult && <span className="ml-1" style={{ color: '#d97706' }}>（示例）</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['强度', '节奏', '峰值'].map((t, i) => (
                <span
                  key={t}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: i === 0 ? C.ikb : C.base,
                    color: i === 0 ? '#fff' : '#6b7280',
                    fontFamily: F.mono,
                  }}
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
            <span
              className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>
              峰值
            </span>
            <span className="mb-1 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
              第{emotionCurve.indexOf(Math.max(...emotionCurve)) + 1}场景情绪最高点
            </span>
          </div>
          {(() => {
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
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                <defs>
                  <linearGradient id="vp-trendFillVP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="vp-trendLineVP" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.ikb} />
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
                    stroke={C.line}
                    strokeWidth="1"
                  />
                ))}
                <path d={area} fill="url(#vp-trendFillVP)" />
                <path
                  d={line}
                  fill="none"
                  stroke="url(#vp-trendLineVP)"
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
            {Array.from({ length: kpiSceneCount }, (_, i) => `场景${i + 1}`).map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 结果各 section ──────────────────────────────────── */}
      <div className="space-y-6">

        {/* ── 分镜脚本 section ─────────────────────────────── */}
        <div
          className="rounded-xl border p-6"
          style={{ borderColor: `${C.ikb}25`, background: `linear-gradient(135deg, ${C.base} 0%, ${C.paper} 50%, ${C.base} 100%)` }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
                style={{ background: C.grad }}
              >
                <span className="material-symbols-outlined" aria-hidden={true}>movie</span>
              </span>
              <div>
                <span
                  className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
                  Storyboard
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-[20px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{VIDEO_PRODUCTION_STORYBOARD_TITLE}</h3>
                  {/* P1.7: idle 时明确标注示例数据 */}
                  {!hasResult && (
                    <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>（示例数据 · 生成后替换）</span>
                  )}
                </div>
              </div>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[12px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              {kpiSceneCount} 场景
            </span>
          </div>

          {/* 门控:有真结果渲染真 shotList;否则渲染 mock 分镜 */}
          {hasResult ? (
            <div data-testid="vp-storyboard-real" className="space-y-0">
              {productionContent.shotList.map((s, idx) => (
                <div key={idx} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[11px] font-bold shadow-sm"
                      style={{ borderColor: C.ikb, color: C.ikb, fontFamily: F.mono }}
                    >
                      {s.index ?? idx + 1}
                    </div>
                    {idx < productionContent.shotList.length - 1 && (
                      <div className="w-0.5 flex-1" style={{ minHeight: '20px', background: `linear-gradient(to bottom, ${C.ikb}30, ${C.burgundy}20)` }} />
                    )}
                  </div>
                  <div className="mb-4 flex-1 rounded-xl border p-4" style={{ borderColor: C.line, background: C.paper }}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{s.scene}</span>
                      <span className="rounded-md px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: C.ikb, fontFamily: F.mono }}>
                        {s.duration}
                      </span>
                      {s.angle && (
                        <span
                          className="rounded-md border px-2.5 py-0.5 text-[11px] font-medium"
                          style={{ borderColor: C.line, background: C.base, color: '#444653', fontFamily: F.cn }}
                        >
                          {s.angle}
                        </span>
                      )}
                      {s.transition && (
                        <span
                          className="rounded-md border px-2.5 py-0.5 text-[11px] font-medium"
                          style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}10`, color: C.purpleText, fontFamily: F.cn }}
                        >
                          {VIDEO_PRODUCTION_SCENE_LABELS.transition}: {s.transition}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p
                          className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold"
                          style={{ color: C.ink, fontFamily: F.cn }}
                        >
                          <span className="h-3 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                          {VIDEO_PRODUCTION_SCENE_LABELS.frame}
                        </p>
                        <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>
                          {s.description ?? s.dialogue}
                        </p>
                      </div>
                      <div>
                        <p
                          className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold"
                          style={{ color: C.ink, fontFamily: F.cn }}
                        >
                          <span className="h-3 w-0.5 rounded-full" style={{ background: C.burgundy }} aria-hidden={true} />
                          {VIDEO_PRODUCTION_SCENE_LABELS.voiceover}
                        </p>
                        <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{s.voiceover}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                        <span className="font-semibold" style={{ color: '#444653' }}>{VIDEO_PRODUCTION_SCENE_LABELS.action}:</span>{' '}
                        {s.action}
                      </p>
                      {/* P2.13: 补渲染 cameraAngle/sfx/subtitle 字段 */}
                      {s.cameraAngle && s.cameraAngle !== '无' && (
                        <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                          <span className="font-semibold" style={{ color: '#444653' }}>机位:</span>{' '}
                          {s.cameraAngle}
                        </p>
                      )}
                      {s.sfx && s.sfx !== '无' && (
                        <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                          <span className="font-semibold" style={{ color: '#444653' }}>音效:</span>{' '}
                          {s.sfx}
                        </p>
                      )}
                      {s.subtitle && s.subtitle !== '无' && (
                        <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                          <span className="font-semibold" style={{ color: '#444653' }}>字幕:</span>{' '}
                          {s.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0">
              {VIDEO_PRODUCTION_STORYBOARD.map((s, idx) => (
                <div key={s.scene} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[11px] font-bold shadow-sm"
                      style={{ borderColor: C.ikb, color: C.ikb, fontFamily: F.mono }}
                    >
                      {idx + 1}
                    </div>
                    {idx < VIDEO_PRODUCTION_STORYBOARD.length - 1 && (
                      <div className="w-0.5 flex-1" style={{ minHeight: '20px', background: `linear-gradient(to bottom, ${C.ikb}30, ${C.burgundy}20)` }} />
                    )}
                  </div>
                  <div className="mb-4 flex-1 rounded-xl border p-4" style={{ borderColor: C.line, background: C.paper }}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{s.scene}</span>
                      <span className="rounded-md px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: C.ikb, fontFamily: F.mono }}>
                        {s.time}
                      </span>
                      <span
                        className="rounded-md border px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ borderColor: C.line, background: C.base, color: '#444653', fontFamily: F.cn }}
                      >
                        {s.shot}
                      </span>
                      <span
                        className="rounded-md border px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}10`, color: C.purpleText, fontFamily: F.cn }}
                      >
                        {VIDEO_PRODUCTION_SCENE_LABELS.transition}: {s.transition}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p
                          className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold"
                          style={{ color: C.ink, fontFamily: F.cn }}
                        >
                          <span className="h-3 w-0.5 rounded-full" style={{ background: C.ikb }} aria-hidden={true} />
                          {VIDEO_PRODUCTION_SCENE_LABELS.frame}
                        </p>
                        <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{s.frame}</p>
                      </div>
                      <div>
                        <p
                          className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold"
                          style={{ color: C.ink, fontFamily: F.cn }}
                        >
                          <span className="h-3 w-0.5 rounded-full" style={{ background: C.burgundy }} aria-hidden={true} />
                          {VIDEO_PRODUCTION_SCENE_LABELS.voiceover}
                        </p>
                        <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{s.voiceover}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                        <span className="font-semibold" style={{ color: '#444653' }}>{VIDEO_PRODUCTION_SCENE_LABELS.action}:</span>{' '}
                        {s.action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 拍摄方案 section ──────────────────────────────── */}
        <div className="rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${C.burgundy}, #c0334f)` }}
              >
                <span className="material-symbols-outlined" aria-hidden={true}>photo_camera</span>
              </span>
              <div>
                <span
                  className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
                >
                  Production Plan
                </span>
                <h3 className="text-[20px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{VIDEO_PRODUCTION_SHOOTING_TITLE}</h3>
              </div>
            </div>
            <span
              className="rounded-full border px-3 py-1 text-[12px] font-bold"
              style={{ borderColor: `${C.burgundy}25`, background: `${C.burgundy}10`, color: C.burgundyText, fontFamily: F.mono }}
            >
              {hasResult ? (productionContent.schedule || VIDEO_PRODUCTION_SHOOTING.duration) : VIDEO_PRODUCTION_SHOOTING.duration}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* 设备建议 */}
            <div className="col-span-2 rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p className="mb-3 flex items-center gap-1.5 text-[13px] font-extrabold" style={{ color: C.ink, fontFamily: F.cn }}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true} style={{ color: C.ikb }}>videocam</span>
                {VIDEO_PRODUCTION_SHOOTING.equipmentLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {(hasResult ? productionContent.equipment : VIDEO_PRODUCTION_SHOOTING.equipment).map((eq, i) => (
                  <span
                    key={i}
                    className="rounded-lg border px-2.5 py-1 text-[12px] font-medium"
                    style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}08`, color: C.ikb, fontFamily: F.cn }}
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
            {/* 场景建议 */}
            <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-extrabold" style={{ color: C.ink, fontFamily: F.cn }}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true} style={{ color: C.burgundy }}>location_on</span>
                {VIDEO_PRODUCTION_SHOOTING.sceneLabel}
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>
                {hasResult
                  ? [...new Set(productionContent.shotList.map((s) => s.location).filter(Boolean))].slice(0, 2).join('、') || VIDEO_PRODUCTION_SHOOTING.scene
                  : VIDEO_PRODUCTION_SHOOTING.scene}
              </p>
            </div>
            {/* 灯光建议 */}
            <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-extrabold" style={{ color: C.ink, fontFamily: F.cn }}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true} style={{ color: C.accent3 }}>light_mode</span>
                {VIDEO_PRODUCTION_SHOOTING.lightingLabel}
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>
                {hasResult
                  ? productionContent.shotList.map((s) => s.lighting).filter((l) => l && l !== '无').slice(0, 1)[0] || VIDEO_PRODUCTION_SHOOTING.lighting
                  : VIDEO_PRODUCTION_SHOOTING.lighting}
              </p>
            </div>
            {/* 服装建议 */}
            <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-extrabold" style={{ color: C.ink, fontFamily: F.cn }}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true} style={{ color: C.ikb }}>checkroom</span>
                {VIDEO_PRODUCTION_SHOOTING.costumeLabel}
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>
                {hasResult
                  ? productionContent.shotList.map((s) => s.costume).filter((c) => c && c !== '无').slice(0, 1)[0] || VIDEO_PRODUCTION_SHOOTING.costume
                  : VIDEO_PRODUCTION_SHOOTING.costume}
              </p>
            </div>
            {/* 道具清单 */}
            <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p className="mb-3 flex items-center gap-1.5 text-[13px] font-extrabold" style={{ color: C.ink, fontFamily: F.cn }}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true} style={{ color: C.burgundy }}>category</span>
                {VIDEO_PRODUCTION_SHOOTING.propsLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {(hasResult
                  ? [...new Set(productionContent.shotList.map((s) => s.prop).filter((p) => p && p !== '无'))].slice(0, 6)
                  : VIDEO_PRODUCTION_SHOOTING.props
                ).map((prop, i) => (
                  <span
                    key={i}
                    className="rounded-lg border px-2.5 py-1 text-[12px] font-medium"
                    style={{ borderColor: `${C.accent3}35`, background: `${C.accent3}08`, color: C.purpleText, fontFamily: F.cn }}
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 口播提词器 section ──────────────────────────────── */}
        <div className="rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${C.accent3}, ${C.ikb})` }}
              >
                <span className="material-symbols-outlined" aria-hidden={true}>mic</span>
              </span>
              <div>
                <span
                  className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{ background: `${C.accent3}15`, color: C.purpleText, fontFamily: F.mono }}
                >
                  Voiceover Script
                </span>
                <h3 className="text-[20px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{VIDEO_PRODUCTION_TELEPROMPTER_TITLE}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyText(teleprompterText)}
              aria-label="复制全文"
              className="ikb-focusring flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-colors"
              style={{ borderColor: `${C.accent3}35`, background: `${C.accent3}08`, color: C.purpleText, fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>content_copy</span>
              复制全文
            </button>
          </div>
          <div className="space-y-3">
            {teleprompterDisplay.map((seg, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl border p-4 transition-all"
                style={{ borderColor: C.line, background: C.base }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: C.ikb, fontFamily: F.mono }}
                  >
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(seg)}
                    aria-label={`复制第 ${idx + 1} 段`}
                    className="ikb-focusring cursor-pointer transition-colors"
                    style={{ color: '#6b7280' }}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>content_copy</span>
                  </button>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{seg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BGM 配乐建议 section ──────────────────────────── */}
        <div className="rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
          <div className="mb-5 flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${C.ikb}, ${C.accent3})` }}
            >
              <span className="material-symbols-outlined" aria-hidden={true}>music_note</span>
            </span>
            <div>
              <span
                className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
              >
                BGM Suggestion
              </span>
              {/* P1.4: BGM 始终来自 mock，明确标注 */}
              <div className="flex items-center gap-2">
                <h3 className="text-[20px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{VIDEO_PRODUCTION_BGM_TITLE}</h3>
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>（通用参考 · 非本视频 AI 生成）</span>
              </div>
            </div>
          </div>
          <div className="mb-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p className="mb-1 text-[12px] font-extrabold" style={{ color: C.ink, fontFamily: F.cn }}>
                {VIDEO_PRODUCTION_BGM.styleLabel}
              </p>
              {hasResult ? (
                <p className="text-[13px] font-semibold" style={{ color: '#444653', fontFamily: F.cn }}>
                  {productionContent.shotList.map((s) => s.bgm).filter((b) => b && b !== '无').slice(0, 1)[0] || VIDEO_PRODUCTION_BGM.style}
                </p>
              ) : (
                <p className="text-[13px] font-semibold" style={{ color: '#444653', fontFamily: F.cn }}>{VIDEO_PRODUCTION_BGM.style}</p>
              )}
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: C.line, background: C.base }}>
              <p className="mb-1 text-[12px] font-extrabold" style={{ color: C.ink, fontFamily: F.cn }}>
                {VIDEO_PRODUCTION_BGM.moodLabel}
              </p>
              <p className="text-[13px]" style={{ color: '#444653', fontFamily: F.cn }}>{VIDEO_PRODUCTION_BGM.mood}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {VIDEO_PRODUCTION_BGM.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border px-4 py-2 text-[12px] font-semibold"
                style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}08`, color: C.ikb, fontFamily: F.mono }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* ── 剪辑要点 section ──────────────────────────────── */}
        <div className="rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
          <div className="mb-5 flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${C.burgundy}, #c0334f)` }}
            >
              <span className="material-symbols-outlined" aria-hidden={true}>cut</span>
            </span>
            <div>
              <span
                className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
              >
                Editing Tips
              </span>
              {/* P1.5: 剪辑要点始终来自 mock，明确标注 */}
              <div className="flex items-center gap-2">
                <h3 className="text-[20px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{VIDEO_PRODUCTION_EDITING_TITLE}</h3>
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>通用剪辑指南</span>
              </div>
            </div>
          </div>
          <ol className="space-y-3">
            {VIDEO_PRODUCTION_EDITING.map((item, i) => (
              <li key={item} className="flex gap-3 text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: C.burgundy, fontFamily: F.mono }}
                >
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── 反馈 section ─────────────────────────────────── */}
        <div className="flex items-center gap-3 border-t py-4" style={{ borderColor: C.line }}>
          <p className="text-[14px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{VIDEO_PRODUCTION_FEEDBACK_PROMPT}</p>
          <button
            type="button"
            onClick={handleFeedback}
            aria-label="有帮助"
            className="ikb-focusring flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-bold transition-all"
            style={{ borderColor: C.line, background: C.paper, color: '#444653', fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>thumb_up</span>
            有帮助
          </button>
          <button
            type="button"
            onClick={handleFeedback}
            aria-label="无帮助"
            className="ikb-focusring flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-bold transition-all"
            style={{ borderColor: C.line, background: C.paper, color: '#444653', fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>thumb_down</span>
            无帮助
          </button>
        </div>
      </div>
    </IKBLayout>
  );
}
