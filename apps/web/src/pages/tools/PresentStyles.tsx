/**
 * /present-styles · 爆款呈现形式合集
 * 先锋白标准 · PioneerLayout · 14 形式卡 · 阶段2 接真
 * trpc.presentStyles.recommend · hasResult 门控 · 三态 + isFallback
 * 2026-06-02
 */

import { PRESENTATION_STYLE_IDS } from '@quanan/schemas/specialist-io';
import { useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
import {
  PAGE_SUBTITLE,
  PAGE_TITLE,
  PLATFORM_OPTIONS,
  PRESENT_STYLES,
  PRESENT_STYLES_MAP,
  PS_CTA,
  PS_DEFAULT_PLATFORM,
  PS_DEFAULT_TEXT,
  PS_FEEDBACK_PROMPT,
  PS_FORM_TITLE,
  PS_LABEL_PLATFORM,
  PS_LABEL_TEXT,
  PS_RESULT_TITLE,
  PS_TEXT_MIN,
  PS_TEXT_MIN_MSG,
  SCENE_LABEL,
  SCENE_VALUE_DEFAULT,
} from '@/lib/constants/present-styles';
import { trpc, type RouterOutputs } from '@/lib/trpc';

// ── RouterOutputs 推导真结果类型 ──────────────────────────────────────────────
type RecommendHistoryRow = RouterOutputs['presentStyles']['recommend'];

// ── 运行时 content 形状 ────────────────────────────────────────────────────────
interface RecommendedStyleItem {
  id: string;
  label: string;
  description: string;
  tips: string;
  matchScore: number;
  rationale: string;
}

interface PresentationResult {
  recommendedStyles: RecommendedStyleItem[];
}

// ── parse content string → PresentationResult (with runtime guards) ─────────
function parseContent(row: RecommendHistoryRow | undefined): PresentationResult | undefined {
  if (!row) return undefined;
  try {
    const parsed = JSON.parse(row.content) as unknown;
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !('recommendedStyles' in parsed) ||
      !Array.isArray((parsed as PresentationResult).recommendedStyles) ||
      (parsed as PresentationResult).recommendedStyles.length < 1
    ) {
      return undefined;
    }
    const p = parsed as PresentationResult;
    // each item must have id + matchScore at minimum
    const valid = p.recommendedStyles.every(
      (s) => typeof s === 'object' && s !== null && typeof s.id === 'string' && typeof s.matchScore === 'number',
    );
    if (!valid) return undefined;
    // P1.2: filter out items whose id is not in the 14 known enum keys
    const filtered = p.recommendedStyles.filter(
      (s) => (PRESENTATION_STYLE_IDS as readonly string[]).includes(s.id),
    );
    if (filtered.length < 1) return undefined;
    return { recommendedStyles: filtered };
  } catch {
    return undefined;
  }
}

// ── ACCENT_CYCLE ──────────────────────────────────────────────────────────────
const ACCENT_CYCLE = [
  {
    bg: '#002fa7',
    tileBg: 'bg-[#002fa7]',
    badgeBg: 'bg-[#002fa7]/10',
    badgeText: 'text-[#002fa7]',
    border: 'border-[#c7d2fe]',
    tipsBg: 'bg-[#eff4ff]',
    tipsText: 'text-[#002fa7]',
    tipsBorder: 'border-[#c7d2fe]',
    tileText: 'text-white',
  },
  {
    bg: '#781621',
    tileBg: 'bg-[#781621]',
    badgeBg: 'bg-[#781621]/10',
    badgeText: 'text-[#781621]',
    border: 'border-[#f5c2c7]',
    tipsBg: 'bg-[#fff1f2]',
    tipsText: 'text-[#781621]',
    tipsBorder: 'border-[#f5c2c7]',
    tileText: 'text-white',
  },
  {
    bg: '#F6D300',
    tileBg: 'bg-[#F6D300]',
    badgeBg: 'bg-[#fdf6cc]',
    badgeText: 'text-[#8a6a00]',
    border: 'border-[#F3E08A]',
    tipsBg: 'bg-[#fdf6cc]',
    tipsText: 'text-[#8a6a00]',
    tipsBorder: 'border-[#F3E08A]',
    tileText: 'text-[#221b00]',
  },
] as const;

// ── 每种形式对应 Material Symbol 图标 ──────────────────────────────────────────
const STYLE_ICON: Record<string, string> = {
  talking_head: 'record_voice_over',
  drama: 'movie',
  tutorial: 'school',
  vlog: 'videocam',
  street_interview: 'forum',
  comparison: 'compare',
  list_style: 'format_list_numbered',
  mashup: 'video_library',
  screen_record: 'screen_record',
  animation: 'animation',
  reaction: 'emoji_emotions',
  before_after: 'compare_arrows',
  pov: 'panorama_photosphere',
  qa: 'quiz',
};

// ── FieldLabel helper ─────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
      {children}
    </span>
  );
}

// ── PresentStylesForm ─────────────────────────────────────────────────────────
interface FormProps {
  text: string;
  platform: string;
  onTextChange: (v: string) => void;
  onPlatformChange: (v: string) => void;
  onRecommend: () => void;
  isPending: boolean;
  textError: string | null;
}

function PresentStylesForm({
  text,
  platform,
  onTextChange,
  onPlatformChange,
  onRecommend,
  isPending,
  textError,
}: FormProps) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />

      <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
            <span className="material-symbols-outlined" aria-hidden="true">tune</span>
          </span>
          <div>
            <h2 className="text-[18px] font-bold text-[#111827]">{PS_FORM_TITLE}</h2>
            <p className="text-[12px] text-[#9ca3af]">填写文案 + 平台，AI 推荐最匹配形式</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          参数就绪
        </span>
      </div>

      <div className="relative space-y-5">
        {/* 文案内容 */}
        <div>
          <label htmlFor="ps-text" className="mb-2 block">
            <FieldLabel>
              {PS_LABEL_TEXT}
              {' '}<span className="text-[#781621]">*</span>
            </FieldLabel>
          </label>
          <div
            className={`overflow-hidden rounded-xl border bg-[#f9f9f9] transition-all focus-within:bg-white focus-within:ring-1 ${
              textError
                ? 'border-[#781621] focus-within:border-[#781621] focus-within:ring-[#781621]'
                : 'border-[#e5e7eb] focus-within:border-[#002fa7] focus-within:ring-[#002fa7]'
            }`}
          >
            <textarea
              id="ps-text"
              data-testid="ps-text-input"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              rows={4}
              placeholder={`请输入你的文案内容（至少 ${PS_TEXT_MIN} 字）`}
              className="w-full resize-y border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
            />
          </div>
          {textError && (
            <p data-testid="ps-text-error" className="mt-1 text-[12px] text-[#781621]">
              {textError}
            </p>
          )}
        </div>

        {/* 目标平台 */}
        <div>
          <label htmlFor="ps-platform" className="mb-2 block">
            <FieldLabel>{PS_LABEL_PLATFORM}</FieldLabel>
          </label>
          <select
            id="ps-platform"
            data-testid="ps-platform-select"
            value={platform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="w-full rounded-md border border-[#e5e7eb] bg-[#f9f9f9] px-4 py-3 text-[14px] text-[#1b1b1b] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
          >
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* CTA */}
        <button
          type="button"
          data-testid="ps-recommend-btn"
          onClick={onRecommend}
          disabled={isPending || text.trim().length < PS_TEXT_MIN}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#002fa7] px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
          {PS_CTA}
        </button>
      </div>
    </section>
  );
}

// ── PresentStylesEmptyState ───────────────────────────────────────────────────
function PresentStylesEmptyState() {
  return (
    <div
      data-testid="ps-empty-state"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d1d5db] bg-gradient-to-br from-white to-[#f9fafb] p-12 text-center"
    >
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#002fa7]/8 text-[#002fa7]">
        <span className="material-symbols-outlined text-[36px]" aria-hidden="true">style</span>
      </span>
      <h3 className="mb-2 text-[18px] font-bold text-[#111827]">{PS_RESULT_TITLE}</h3>
      <p className="text-[14px] leading-relaxed text-[#9ca3af]">
        填写左侧文案 + 平台，点击「{PS_CTA}」
        <br />AI 将为你推荐最适合的呈现形式
      </p>
    </div>
  );
}

// ── PresentStylesResult ───────────────────────────────────────────────────────
interface ResultProps {
  result: PresentationResult;
  isFallback: boolean;
}

function PresentStylesResult({ result, isFallback }: ResultProps) {
  function handleFeedback() {
    toast.success('感谢反馈');
  }

  const { recommendedStyles } = result;

  return (
    <div className="space-y-5" data-testid="ps-result-panel">
      {/* isFallback 降级提示 */}
      {isFallback && (
        <div
          data-testid="ps-fallback-notice"
          className="flex items-center gap-3 rounded-xl border border-[#F3E08A] bg-[#fef9e0] px-4 py-3 text-[13px] text-[#8a6a00]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">warning</span>
          AI 繁忙，已返回备用推荐方案，建议稍后重试以获取个性化结果。
        </div>
      )}

      {/* 结果标题 */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-md">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">style</span>
        </span>
        <h2 className="text-[18px] font-bold text-[#111827]">{PS_RESULT_TITLE}</h2>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          推荐已就绪
        </span>
      </div>

      {/* 推荐形式列表 */}
      <div className="space-y-4" data-testid="ps-recommended-styles">
        {recommendedStyles.map((item, idx) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const accent = ACCENT_CYCLE[idx % 3]!;
          const icon = STYLE_ICON[item.id] ?? 'play_circle';
          // 从 PRESENT_STYLES_MAP 补全缺字段 (如果 LLM 省略)
          const staticStyle = PRESENT_STYLES_MAP[item.id];
          const displayLabel = item.label || staticStyle?.label || item.id;
          const displayDescription = item.description || staticStyle?.description || '';
          const displayTips = item.tips || staticStyle?.tips || '';

          return (
            <div
              key={item.id}
              data-testid={`ps-recommended-item-${item.id}`}
              className="rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft"
            >
              {/* Icon tile */}
              <div className={`flex h-14 w-full items-center gap-3 rounded-t-xl px-5 ${accent.tileBg}`}>
                <span className={`material-symbols-outlined text-[26px] ${accent.tileText}`} aria-hidden="true">
                  {icon}
                </span>
                <span className={`text-[16px] font-extrabold tracking-tight ${accent.tileText}`}>
                  {displayLabel}
                </span>
                {/* matchScore 徽章 */}
                <span
                  className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-bold ${accent.tileText} bg-white/20`}
                  data-testid={`ps-match-score-${item.id}`}
                >
                  匹配度 {item.matchScore}%
                </span>
              </div>

              <div className="flex flex-col gap-3 p-5">
                <p className="text-[14px] leading-relaxed text-[#444653]">{displayDescription}</p>

                {/* 推荐理由 */}
                {item.rationale && (
                  <div
                    className={`flex items-start gap-2 rounded-lg border p-3 ${accent.tipsBg} ${accent.tipsBorder}`}
                    data-testid={`ps-rationale-${item.id}`}
                  >
                    <span
                      className={`material-symbols-outlined mt-0.5 shrink-0 text-[18px] ${accent.tipsText}`}
                      aria-hidden="true"
                    >
                      recommend
                    </span>
                    <div>
                      <span className={`mr-1 text-[12px] font-extrabold ${accent.tipsText}`}>推荐理由</span>
                      <span className={`text-[13px] leading-relaxed ${accent.tipsText}`}>{item.rationale}</span>
                    </div>
                  </div>
                )}

                {/* 操作要点 */}
                {displayTips && (
                  <div className="flex items-start gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3">
                    <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#6b7280]" aria-hidden="true">
                      lightbulb
                    </span>
                    <div>
                      <span className="mr-1 text-[12px] font-extrabold text-[#6b7280]">要点</span>
                      <span className="text-[13px] leading-relaxed text-[#6b7280]">{displayTips}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 反馈 row */}
      <div className="flex items-center gap-3 border-t border-[#eef1f6] pt-4">
        <p className="text-[14px] text-[#6b7280]">{PS_FEEDBACK_PROMPT}</p>
        <button
          type="button"
          onClick={handleFeedback}
          aria-label="有帮助"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#10b981] hover:text-[#10b981]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">thumb_up</span>
        </button>
        <button
          type="button"
          onClick={handleFeedback}
          aria-label="无帮助"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#781621] hover:text-[#781621]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">thumb_down</span>
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PresentStyles() {
  const [text, setText] = useState<string>(PS_DEFAULT_TEXT);
  const [platform, setPlatform] = useState<string>(PS_DEFAULT_PLATFORM);
  const [textError, setTextError] = useState<string | null>(null);

  // ── 真 recommend mutation ──────────────────────────────────────────────────
  const recommendMutation = trpc.presentStyles.recommend.useMutation({
    onSuccess: () => {
      toast.success('呈现形式推荐已生成');
    },
    onError: (err) => {
      toast.error(err.message || '推荐失败，请重试');
    },
  });

  const isPending = recommendMutation.isPending;
  const isError = recommendMutation.isError;
  const historyRow: RecommendHistoryRow | undefined = recommendMutation.data;
  const presentationResult = parseContent(historyRow);
  const hasResult = presentationResult !== undefined;
  const isFallback = historyRow?.isFallback ?? false;

  function handleRecommend() {
    if (isPending) return;
    // 前端校验: text < 10 字
    if (text.trim().length < PS_TEXT_MIN) {
      setTextError(PS_TEXT_MIN_MSG);
      return;
    }
    setTextError(null);
    recommendMutation.mutate({ text: text.trim(), platform });
  }

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
              形式库
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            {PAGE_TITLE}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            {PAGE_SUBTITLE}
          </p>
        </div>
      </header>

      {/* ── 数据洞察 band ──────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">insights</span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· 内容形式覆盖全景</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          已收录 {PRESENT_STYLES.length} 种形式
        </span>
      </div>

      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 内容形式适配雷达 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">内容形式适配雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估（示例/参考）</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">14</p>
              <p className="text-[10px] text-[#9ca3af]">形式总数</p>
            </div>
          </div>
          {(() => {
            const dims = [
              { label: '知识输出', value: 85, color: '#002fa7' },
              { label: '剧情张力', value: 72, color: '#781621' },
              { label: '测评种草', value: 78, color: '#F6D300' },
              { label: '人设打造', value: 90, color: '#002fa7' },
              { label: '互动话题', value: 68, color: '#781621' },
              { label: '带货转化', value: 80, color: '#F6D300' },
            ];
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [
              cx + r * Math.cos(ang(i)),
              cy + r * Math.sin(ang(i)),
            ];
            const poly = (r: number) =>
              dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims
              .map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(','))
              .join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full">
                <defs>
                  <linearGradient id="radarFillPS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return (
                    <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />
                  );
                })}
                <polygon
                  points={dataPoly}
                  fill="url(#radarFillPS)"
                  stroke="#002fa7"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return (
                    <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />
                  );
                })}
                {dims.map((d, i) => {
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
            {[
              { label: '知识输出', value: 85, color: '#002fa7' },
              { label: '剧情张力', value: 72, color: '#781621' },
              { label: '测评种草', value: 78, color: '#F6D300' },
              { label: '人设打造', value: 90, color: '#002fa7' },
              { label: '互动话题', value: 68, color: '#781621' },
              { label: '带货转化', value: 80, color: '#F6D300' },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 各形式流量热度趋势 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">各形式流量热度</h3>
                <p className="text-[11px] text-[#9ca3af]">代表形式综合热度指数（示例/参考）</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['口播', '剧情', '教程', '测评', 'Vlog', '清单'].map((t, i) => (
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
            <p className="text-[30px] font-bold leading-none text-[#111827]">口播</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">trending_up</span>
              最高热度
            </span>
            <span className="mb-1 text-[12px] text-[#9ca3af]">当前最主流形式</span>
          </div>
          {(() => {
            const data = [92, 78, 82, 71, 68, 74, 62, 58];
            const labels = ['口播', '剧情', '教程', '测评', 'Vlog', '清单', '混剪', '录屏'];
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
            const line = data
              .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
              .join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                <defs>
                  <linearGradient id="trendFillPS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendLinePS" x1="0" y1="0" x2="1" y2="0">
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
                <path d={area} fill="url(#trendFillPS)" />
                <path
                  d={line}
                  fill="none"
                  stroke="url(#trendLinePS)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" />
                ))}
                {data.map((_, i) => (
                  <text
                    key={`lbl-${i}`}
                    x={x(i).toFixed(1)}
                    y={(padT + innerH + 14).toFixed(1)}
                    textAnchor="middle"
                    fill="#9ca3af"
                    fontSize="11"
                  >
                    {labels[i]}
                  </text>
                ))}
              </svg>
            );
          })()}
        </div>
      </div>

      {/* ── KPI 卡一排(4 卡) ──────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 呈现形式总数 · 蓝 · 环形 */}
        <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">video_library</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[13px]" aria-hidden="true">trending_up</span>
              全覆盖
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                {PRESENT_STYLES.length}
                <span className="text-[15px] text-[#9ca3af]"> 种</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">呈现形式</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90" aria-hidden="true">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#002fa7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="100 100"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 覆盖场景 · 勃艮第 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">category</span>
            </span>
            <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">
              多场景
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              6<span className="text-[15px] text-[#9ca3af]"> 类</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">覆盖场景</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[70, 90, 60, 85, 75, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-[#781621]/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* 上手难度 · 暖黄 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fdf6cc] text-[#8a6a00]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">signal_cellular_alt</span>
            </span>
            <span className="rounded-full bg-[#fdf6cc] px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">
              易上手
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              初级<span className="text-[15px] text-[#9ca3af]"> 起</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">上手难度</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
            <div className="h-2 w-2/5 rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" />
          </div>
        </div>

        {/* 适用平台 · 蓝 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">hub</span>
            </span>
            <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">
              全平台
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              3<span className="text-[15px] text-[#9ca3af]"> 平台</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">适用平台</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['抖音', '小红书', '视频号'].map((k) => (
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

      {/* ── loading banner ───────────────────────────────── */}
      {isPending && (
        <div
          data-testid="ps-loading-banner"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#dbe2ff] bg-[#eff4ff] px-5 py-4 text-[14px] text-[#002fa7]"
        >
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          AI 正在分析文案，推荐最适合的呈现形式，大约需要 10-20 秒…
        </div>
      )}

      {/* ── error notice ─────────────────────────────────── */}
      {isError && (
        <div
          data-testid="ps-error-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#f5d0d4] bg-[#fef5f5] px-5 py-4 text-[14px] text-[#781621]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">error</span>
          推荐失败，请检查网络后重试。
          <button
            type="button"
            onClick={handleRecommend}
            className="ml-auto rounded-lg bg-[#781621] px-3 py-1 text-[12px] font-bold text-white hover:bg-[#5a1018]"
          >
            重试
          </button>
        </div>
      )}

      {/* ── 表单 + 结果(左右 2 列) ────────────────────────── */}
      <div className="mb-12 grid grid-cols-2 gap-6">
        <PresentStylesForm
          text={text}
          platform={platform}
          onTextChange={setText}
          onPlatformChange={setPlatform}
          onRecommend={handleRecommend}
          isPending={isPending}
          textError={textError}
        />

        {/* hasResult 门控 */}
        {hasResult ? (
          <PresentStylesResult result={presentationResult} isFallback={isFallback} />
        ) : (
          <PresentStylesEmptyState />
        )}
      </div>

      {/* ── 全部参考目录 section header ─────────────────── */}
      <div className="mb-6 flex flex-col gap-1.5" data-testid="ps-catalog-header">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">auto_stories</span>
          </span>
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#111827]" data-testid="ps-catalog-title">
            全部呈现形式 · 参考目录
          </h2>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#002fa7]/10 px-3 py-1 text-[12px] font-semibold text-[#002fa7]">
            共 {PRESENT_STYLES.length} 种
          </span>
        </div>
        <p className="pl-11 text-[14px] leading-relaxed text-[#6b7280]">
          以下是所有支持的呈现形式，AI 已从中为你个性化推荐——填写左侧文案后点击「{PS_CTA}」即可查看推荐结果。
        </p>
      </div>

      {/* ── 14 形式卡(固定 grid-cols-3) ──────────────────── */}
      <div className="grid grid-cols-3 gap-6">
        {PRESENT_STYLES.map((style, idx) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const accent = ACCENT_CYCLE[idx % 3]!;
          const icon = STYLE_ICON[style.id] ?? 'play_circle';
          return (
            <div
              key={style.id}
              data-testid={`style-card-${style.id}`}
              className="flex flex-col rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Icon tile */}
              <div className={`flex h-14 w-full items-center gap-3 rounded-t-xl px-5 ${accent.tileBg}`}>
                <span className={`material-symbols-outlined text-[26px] ${accent.tileText}`} aria-hidden="true">
                  {icon}
                </span>
                <span className={`text-[16px] font-extrabold tracking-tight ${accent.tileText}`}>
                  {style.label}
                </span>
              </div>

              {/* Card body */}
              <div className="flex flex-1 flex-col gap-4 p-5">
                {/* description */}
                <p className="text-[14px] leading-relaxed text-[#444653]">{style.description}</p>

                {/* tips block */}
                <div
                  className={`flex items-start gap-2 rounded-lg border p-3 ${accent.tipsBg} ${accent.tipsBorder}`}
                >
                  <span
                    className={`material-symbols-outlined mt-0.5 shrink-0 text-[18px] ${accent.tipsText}`}
                    aria-hidden="true"
                  >
                    lightbulb
                  </span>
                  <div>
                    <span className={`mr-1 text-[12px] font-extrabold ${accent.tipsText}`}>要点</span>
                    <span className={`text-[13px] leading-relaxed ${accent.tipsText}`}>{style.tips}</span>
                  </div>
                </div>

                {/* 场景行 */}
                <div className="mt-auto flex items-center gap-1.5 pt-1">
                  <span
                    className={`material-symbols-outlined text-[16px] ${accent.badgeText}`}
                    aria-hidden="true"
                  >
                    visibility
                  </span>
                  <span className={`text-[12px] font-semibold ${accent.badgeText}`}>
                    {SCENE_LABEL}：{SCENE_VALUE_DEFAULT}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PioneerLayout>
  );
}
