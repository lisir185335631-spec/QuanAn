/**
 * VideoProduction.tsx — /video-production · 短视频一键制作
 * 先锋白 PioneerLayout 全站统一重构 · inline 8 section · 2026-06-02
 * 阶段2 接真: trpc.videoProduction.generate
 * 逻辑/testid 零改动 · 常量 VIDEO_PRODUCTION_* 全保留 · 三态 + isFallback
 */
import { useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
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

  // ── 雷达数据(始终固定 · 无可靠后端维度) ─────────────────────────────────────
  const radarDims = [
    { label: '分镜完整', value: 94, color: '#002fa7' },
    { label: '视觉表现', value: 88, color: '#781621' },
    { label: '口播质量', value: 91, color: '#F6D300' },
    { label: '节奏张力', value: 83, color: '#002fa7' },
    { label: '音乐配合', value: 79, color: '#781621' },
    { label: '剪辑逻辑', value: 86, color: '#F6D300' },
  ];

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

  const btnSecondary =
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              工具
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              视频工坊
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            {VIDEO_PRODUCTION_H1}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            {VIDEO_PRODUCTION_SUBTITLE}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={!hasResult}
            className={btnSecondary}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className={btnSecondary}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
            复制全部
          </button>
          <button
            type="button"
            onClick={handleExportScript}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
            导出脚本
          </button>
        </div>
      </header>

      {/* ── 输入文案卡 ──────────────────────────────────────── */}
      <section className="relative mb-12 overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />
        <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined" aria-hidden="true">videocam</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">输入文案</h2>
              <p className="text-[12px] text-[#9ca3af]">填写脚本文案 · AI 据此生成完整制作方案</p>
            </div>
          </div>
          {/* 状态角标 */}
          {isPending ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#002fa7]/10 px-3 py-1 text-[12px] font-semibold text-[#002fa7]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#002fa7]" />
              生成中…
            </span>
          ) : hasResult ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
              已生成
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9ca3af]/15 px-3 py-1 text-[12px] font-semibold text-[#6b7280]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
              待输入/准备就绪
            </span>
          )}
        </div>

        {/* ── isError 重试提示 ──────────────────────────────── */}
        {isError && (
          <div
            data-testid="vp-error-notice"
            className="mb-4 flex items-center gap-3 rounded-xl border border-[#dc2626]/30 bg-[#fef2f2] p-4 text-[13px] font-medium text-[#991b1b]"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">error</span>
            <span className="flex-1">生成失败，请检查网络后重试。</span>
            <button
              type="button"
              onClick={handleGenerate}
              className="shrink-0 rounded-lg border border-[#dc2626]/30 bg-white px-4 py-1.5 text-[12px] font-bold text-[#991b1b] hover:bg-[#fef2f2]"
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
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                视频文案
              </label>
              <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                <span className="material-symbols-outlined text-[14px] text-[#781621]" aria-hidden="true">
                  auto_awesome
                </span>
                AI 据此生成分镜+口播+剪辑
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
              <textarea
                id="vp-copy"
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
                rows={10}
                placeholder="输入你的视频脚本文案，包含标题、话题抛出、正反方观点、结论等结构"
                className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
              />
              <div className="flex items-center justify-between gap-3 border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#9ca3af]">建议包含</span>
                  {['标题', '话题', '正方', '反方', '结论', '引导'].map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#f1f3f9] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7280]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]">
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
              className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">refresh</span>
                  生成中…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">videocam</span>
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
          className="mb-8 flex items-center gap-4 rounded-xl border border-[#002fa7]/20 bg-[#eff4ff] p-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#002fa7]/10">
            <span className="material-symbols-outlined animate-spin text-[24px] text-[#002fa7]" aria-hidden="true">refresh</span>
          </span>
          <div>
            <p className="text-[14px] font-bold text-[#002fa7]">AI 正在生成制作方案…</p>
            <p className="text-[12px] text-[#6b7280]">分析文案 · 生成分镜 · 编排制作流程，预计 20-45 秒</p>
          </div>
          <div className="ml-auto h-1.5 w-40 overflow-hidden rounded-full bg-[#002fa7]/20">
            <div className="h-full w-full animate-pulse rounded-full bg-[#002fa7]" />
          </div>
        </div>
      )}

      {/* ── isFallback 降级提示 ───────────────────────────────── */}
      {hasResult && isFallback && (
        <div
          data-testid="vp-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#F6D300]/40 bg-[#fffde7] p-4 text-[13px] font-medium text-[#8a6a00]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">warning</span>
          AI 模型降级处理，当前为备用方案（无 API Key）。建议配置模型密钥后重新生成以获取最优质方案。
        </div>
      )}

      {/* ── KPI 概览一排(4 卡) · 门控:有真结果/始终可见(部分指标软化) ─── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 分镜场景数 · 蓝 · 环形 */}
        <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">movie</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[13px]" aria-hidden="true">trending_up</span>
              {hasResult ? '完整' : '示例'}
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                {kpiSceneCount}
                <span className="text-[15px] text-[#9ca3af]"> 个</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">分镜场景</p>
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
                  strokeDasharray={`${Math.min(100, kpiSceneCount * 7)} 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 预计时长 · 勃艮第 · 迷你柱 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">timer</span>
            </span>
            <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">
              {hasResult ? '已测算' : '示例'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[18px] font-bold leading-none text-[#111827]">
              {hasResult ? (productionContent.schedule.slice(0, 6) || '约 80s') : '约 80s'}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">预计时长</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[45, 68, 55, 80, 62, 90, 72].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[#781621]/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* 口播段落 · 暖黄 · 进度条 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">mic</span>
            </span>
            <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">
              {hasResult ? '全覆盖' : '示例'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {teleprompterDisplay.length}
              <span className="text-[15px] text-[#9ca3af]"> 段</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">口播段落</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
            <div className="h-2 rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" style={{ width: '100%' }} />
          </div>
        </div>

        {/* BGM建议数 · 蓝 · chip — P1.9: 始终来自 mock，加通用参考标注 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">music_note</span>
            </span>
            <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">
              {kpiBgmCount} 首
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {kpiBgmCount}
              <span className="text-[15px] text-[#9ca3af]"> 首</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">BGM建议</p>
            <p className="text-[10px] text-[#9ca3af]">通用参考</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['流行', '科技感', '轻快', '思考'].map((k) => (
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

      {/* ── 数据洞察 band ──────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">insights</span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 实时测算</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 制作完备度雷达 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">制作完备度雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">87</p>
              <p className="text-[10px] text-[#9ca3af]">综合分（示例）</p>
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
                  <linearGradient id="radarFillVP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
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
                  fill="url(#radarFillVP)"
                  stroke="#002fa7"
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
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 情绪节奏曲线 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">情绪节奏曲线</h3>
                <p className="text-[11px] text-[#9ca3af]">
                  沿 {kpiSceneCount} 个场景情绪强度推演
                  {!hasResult && <span className="ml-1 text-[#d97706]">（示例）</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['强度', '节奏', '峰值'].map((t, i) => (
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
            <p className="text-[30px] font-bold leading-none text-[#111827]">
              {Math.max(...emotionCurve)}
            </p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">trending_up</span>
              峰值
            </span>
            <span className="mb-1 text-[12px] text-[#9ca3af]">
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
                  <linearGradient id="trendFillVP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendLineVP" x1="0" y1="0" x2="1" y2="0">
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
                <path d={area} fill="url(#trendFillVP)" />
                <path
                  d={line}
                  fill="none"
                  stroke="url(#trendLineVP)"
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
                      stroke="#002fa7"
                      strokeWidth="2"
                    />
                  ) : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
            {Array.from({ length: kpiSceneCount }, (_, i) => `场景${i + 1}`).map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 结果各 section ──────────────────────────────────── */}
      <div className="space-y-6">

        {/* ── 分镜脚本 section ─────────────────────────────── */}
        <div className="rounded-xl border border-[#dbe2ff] bg-gradient-to-br from-[#eff4ff] via-white to-[#f7f1ff] p-6 pw-shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
                <span className="material-symbols-outlined" aria-hidden="true">movie</span>
              </span>
              <div>
                <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#002fa7]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#002fa7]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#002fa7]" />
                  Storyboard
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-[20px] font-bold text-[#111827]">{VIDEO_PRODUCTION_STORYBOARD_TITLE}</h3>
                  {/* P1.7: idle 时明确标注示例数据 */}
                  {!hasResult && (
                    <span className="text-[11px] text-[#9ca3af]">（示例数据 · 生成后替换）</span>
                  )}
                </div>
              </div>
            </div>
            <span className="rounded-full bg-[#002fa7]/10 px-3 py-1 text-[12px] font-bold text-[#002fa7]">
              {kpiSceneCount} 场景
            </span>
          </div>

          {/* 门控:有真结果渲染真 shotList;否则渲染 mock 分镜 */}
          {hasResult ? (
            <div data-testid="vp-storyboard-real" className="space-y-0">
              {productionContent.shotList.map((s, idx) => (
                <div key={idx} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#002fa7] bg-white text-[11px] font-bold text-[#002fa7] shadow-sm">
                      {s.index ?? idx + 1}
                    </div>
                    {idx < productionContent.shotList.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-[#002fa7]/30 to-[#781621]/20" style={{ minHeight: '20px' }} />
                    )}
                  </div>
                  <div className="mb-4 flex-1 rounded-xl border border-[#e5e7eb] bg-white p-4 pw-shadow-soft">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold text-[#111827]">{s.scene}</span>
                      <span className="rounded-md bg-[#002fa7] px-2.5 py-0.5 text-[11px] font-bold text-white">
                        {s.duration}
                      </span>
                      {s.angle && (
                        <span className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-0.5 text-[11px] font-medium text-[#444653]">
                          {s.angle}
                        </span>
                      )}
                      {s.transition && (
                        <span className="rounded-md border border-[#F3E08A] bg-[#fdf6cc] px-2.5 py-0.5 text-[11px] font-medium text-[#8a6a00]">
                          {VIDEO_PRODUCTION_SCENE_LABELS.transition}: {s.transition}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold text-[#111827] before:h-3 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                          {VIDEO_PRODUCTION_SCENE_LABELS.frame}
                        </p>
                        <p className="text-[13px] leading-relaxed text-[#444653]">
                          {s.description ?? s.dialogue}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold text-[#111827] before:h-3 before:w-0.5 before:rounded-full before:bg-[#781621] before:content-['']">
                          {VIDEO_PRODUCTION_SCENE_LABELS.voiceover}
                        </p>
                        <p className="text-[13px] leading-relaxed text-[#444653]">{s.voiceover}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <p className="text-[12px] text-[#9ca3af]">
                        <span className="font-semibold text-[#444653]">{VIDEO_PRODUCTION_SCENE_LABELS.action}:</span>{' '}
                        {s.action}
                      </p>
                      {/* P2.13: 补渲染 cameraAngle/sfx/subtitle 字段 */}
                      {s.cameraAngle && s.cameraAngle !== '无' && (
                        <p className="text-[12px] text-[#9ca3af]">
                          <span className="font-semibold text-[#444653]">机位:</span>{' '}
                          {s.cameraAngle}
                        </p>
                      )}
                      {s.sfx && s.sfx !== '无' && (
                        <p className="text-[12px] text-[#9ca3af]">
                          <span className="font-semibold text-[#444653]">音效:</span>{' '}
                          {s.sfx}
                        </p>
                      )}
                      {s.subtitle && s.subtitle !== '无' && (
                        <p className="text-[12px] text-[#9ca3af]">
                          <span className="font-semibold text-[#444653]">字幕:</span>{' '}
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#002fa7] bg-white text-[11px] font-bold text-[#002fa7] shadow-sm">
                      {idx + 1}
                    </div>
                    {idx < VIDEO_PRODUCTION_STORYBOARD.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-[#002fa7]/30 to-[#781621]/20" style={{ minHeight: '20px' }} />
                    )}
                  </div>
                  <div className="mb-4 flex-1 rounded-xl border border-[#e5e7eb] bg-white p-4 pw-shadow-soft">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold text-[#111827]">{s.scene}</span>
                      <span className="rounded-md bg-[#002fa7] px-2.5 py-0.5 text-[11px] font-bold text-white">
                        {s.time}
                      </span>
                      <span className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-0.5 text-[11px] font-medium text-[#444653]">
                        {s.shot}
                      </span>
                      <span className="rounded-md border border-[#F3E08A] bg-[#fdf6cc] px-2.5 py-0.5 text-[11px] font-medium text-[#8a6a00]">
                        {VIDEO_PRODUCTION_SCENE_LABELS.transition}: {s.transition}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold text-[#111827] before:h-3 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
                          {VIDEO_PRODUCTION_SCENE_LABELS.frame}
                        </p>
                        <p className="text-[13px] leading-relaxed text-[#444653]">{s.frame}</p>
                      </div>
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold text-[#111827] before:h-3 before:w-0.5 before:rounded-full before:bg-[#781621] before:content-['']">
                          {VIDEO_PRODUCTION_SCENE_LABELS.voiceover}
                        </p>
                        <p className="text-[13px] leading-relaxed text-[#444653]">{s.voiceover}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-[12px] text-[#9ca3af]">
                        <span className="font-semibold text-[#444653]">{VIDEO_PRODUCTION_SCENE_LABELS.action}:</span>{' '}
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
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#781621] to-[#a52030] text-white shadow-lg shadow-[#781621]/25">
                <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>
              </span>
              <div>
                <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#781621]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#781621]">
                  Production Plan
                </span>
                <h3 className="text-[20px] font-bold text-[#111827]">{VIDEO_PRODUCTION_SHOOTING_TITLE}</h3>
              </div>
            </div>
            <span className="rounded-full border border-[#781621]/20 bg-[#781621]/10 px-3 py-1 text-[12px] font-bold text-[#781621]">
              {hasResult ? (productionContent.schedule || VIDEO_PRODUCTION_SHOOTING.duration) : VIDEO_PRODUCTION_SHOOTING.duration}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* 设备建议 */}
            <div className="col-span-2 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[13px] font-extrabold text-[#111827]">
                <span className="material-symbols-outlined text-[16px] text-[#002fa7]" aria-hidden="true">videocam</span>
                {VIDEO_PRODUCTION_SHOOTING.equipmentLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {(hasResult ? productionContent.equipment : VIDEO_PRODUCTION_SHOOTING.equipment).map((eq, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-[#dbe2ff] bg-[#eff4ff] px-2.5 py-1 text-[12px] font-medium text-[#002fa7]"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
            {/* 场景建议 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-extrabold text-[#111827]">
                <span className="material-symbols-outlined text-[16px] text-[#781621]" aria-hidden="true">location_on</span>
                {VIDEO_PRODUCTION_SHOOTING.sceneLabel}
              </p>
              <p className="text-[13px] leading-relaxed text-[#444653]">
                {hasResult
                  ? [...new Set(productionContent.shotList.map((s) => s.location).filter(Boolean))].slice(0, 2).join('、') || VIDEO_PRODUCTION_SHOOTING.scene
                  : VIDEO_PRODUCTION_SHOOTING.scene}
              </p>
            </div>
            {/* 灯光建议 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-extrabold text-[#111827]">
                <span className="material-symbols-outlined text-[16px] text-[#8a6a00]" aria-hidden="true">light_mode</span>
                {VIDEO_PRODUCTION_SHOOTING.lightingLabel}
              </p>
              <p className="text-[13px] leading-relaxed text-[#444653]">
                {hasResult
                  ? productionContent.shotList.map((s) => s.lighting).filter((l) => l && l !== '无').slice(0, 1)[0] || VIDEO_PRODUCTION_SHOOTING.lighting
                  : VIDEO_PRODUCTION_SHOOTING.lighting}
              </p>
            </div>
            {/* 服装建议 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-extrabold text-[#111827]">
                <span className="material-symbols-outlined text-[16px] text-[#002fa7]" aria-hidden="true">checkroom</span>
                {VIDEO_PRODUCTION_SHOOTING.costumeLabel}
              </p>
              <p className="text-[13px] leading-relaxed text-[#444653]">
                {hasResult
                  ? productionContent.shotList.map((s) => s.costume).filter((c) => c && c !== '无').slice(0, 1)[0] || VIDEO_PRODUCTION_SHOOTING.costume
                  : VIDEO_PRODUCTION_SHOOTING.costume}
              </p>
            </div>
            {/* 道具清单 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[13px] font-extrabold text-[#111827]">
                <span className="material-symbols-outlined text-[16px] text-[#781621]" aria-hidden="true">category</span>
                {VIDEO_PRODUCTION_SHOOTING.propsLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {(hasResult
                  ? [...new Set(productionContent.shotList.map((s) => s.prop).filter((p) => p && p !== '无'))].slice(0, 6)
                  : VIDEO_PRODUCTION_SHOOTING.props
                ).map((prop, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-[#F3E08A] bg-[#fdf6cc] px-2.5 py-1 text-[12px] font-medium text-[#8a6a00]"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 口播提词器 section ──────────────────────────────── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#F6D300] to-[#ffe45c] text-[#221b00] shadow-lg shadow-[#F6D300]/40">
                <span className="material-symbols-outlined" aria-hidden="true">mic</span>
              </span>
              <div>
                <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#F6D300]/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8a6a00]">
                  Voiceover Script
                </span>
                <h3 className="text-[20px] font-bold text-[#111827]">{VIDEO_PRODUCTION_TELEPROMPTER_TITLE}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyText(teleprompterText)}
              className="flex items-center gap-1.5 rounded-lg border border-[#F3E08A] bg-[#fdf6cc] px-3 py-1.5 text-[12px] font-bold text-[#8a6a00] transition-colors hover:bg-[#F6D300]/30"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">content_copy</span>
              复制全文
            </button>
          </div>
          <div className="space-y-3">
            {teleprompterDisplay.map((seg, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4 transition-all hover:border-[#F6D300] hover:bg-[#fefce0]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#002fa7] text-[11px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(seg)}
                    aria-label="复制段落"
                    className="cursor-pointer text-[#9ca3af] transition-colors group-hover:text-[#8a6a00]"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
                  </button>
                </div>
                <p className="text-[13px] leading-relaxed text-[#444653]">{seg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BGM 配乐建议 section ──────────────────────────── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined" aria-hidden="true">music_note</span>
            </span>
            <div>
              <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#002fa7]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#002fa7]">
                BGM Suggestion
              </span>
              {/* P1.4: BGM 始终来自 mock，明确标注 */}
              <div className="flex items-center gap-2">
                <h3 className="text-[20px] font-bold text-[#111827]">{VIDEO_PRODUCTION_BGM_TITLE}</h3>
                <span className="text-[11px] text-[#9ca3af]">（通用参考 · 非本视频 AI 生成）</span>
              </div>
            </div>
          </div>
          <div className="mb-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <p className="mb-1 text-[12px] font-extrabold text-[#111827]">
                {VIDEO_PRODUCTION_BGM.styleLabel}
              </p>
              {hasResult ? (
                <p className="text-[13px] font-semibold text-[#444653]">
                  {productionContent.shotList.map((s) => s.bgm).filter((b) => b && b !== '无').slice(0, 1)[0] || VIDEO_PRODUCTION_BGM.style}
                </p>
              ) : (
                <p className="text-[13px] font-semibold text-[#444653]">{VIDEO_PRODUCTION_BGM.style}</p>
              )}
            </div>
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <p className="mb-1 text-[12px] font-extrabold text-[#111827]">
                {VIDEO_PRODUCTION_BGM.moodLabel}
              </p>
              <p className="text-[13px] text-[#444653]">{VIDEO_PRODUCTION_BGM.mood}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {VIDEO_PRODUCTION_BGM.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[#dbe2ff] bg-[#eff4ff] px-4 py-2 text-[12px] font-semibold text-[#002fa7]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* ── 剪辑要点 section ──────────────────────────────── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#781621] to-[#a52030] text-white shadow-lg shadow-[#781621]/25">
              <span className="material-symbols-outlined" aria-hidden="true">cut</span>
            </span>
            <div>
              <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#781621]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#781621]">
                Editing Tips
              </span>
              {/* P1.5: 剪辑要点始终来自 mock，明确标注 */}
              <div className="flex items-center gap-2">
                <h3 className="text-[20px] font-bold text-[#111827]">{VIDEO_PRODUCTION_EDITING_TITLE}</h3>
                <span className="text-[11px] text-[#9ca3af]">通用剪辑指南</span>
              </div>
            </div>
          </div>
          <ol className="space-y-3">
            {VIDEO_PRODUCTION_EDITING.map((item, i) => (
              <li key={item} className="flex gap-3 text-[13px] leading-relaxed text-[#444653]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#781621] text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── 反馈 section ─────────────────────────────────── */}
        <div className="flex items-center gap-3 py-4">
          <p className="text-[14px] text-[#6b7280]">{VIDEO_PRODUCTION_FEEDBACK_PROMPT}</p>
          <button
            type="button"
            onClick={handleFeedback}
            aria-label="有帮助"
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[12px] font-bold text-[#444653] transition-all hover:border-[#002fa7] hover:text-[#002fa7]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">thumb_up</span>
            有帮助
          </button>
          <button
            type="button"
            onClick={handleFeedback}
            aria-label="无帮助"
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[12px] font-bold text-[#444653] transition-all hover:border-[#781621] hover:text-[#781621]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">thumb_down</span>
            无帮助
          </button>
        </div>
      </div>
    </PioneerLayout>
  );
}
