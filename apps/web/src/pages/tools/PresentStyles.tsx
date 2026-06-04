/**
 * /present-styles · 爆款呈现形式合集
 * IKB 红蓝紫渐变体系 · IKBLayout · 14 形式卡 · 阶段2 接真
 * trpc.presentStyles.recommend · hasResult 门控 · 三态 + isFallback
 * 2026-06-04
 */

import '@/styles/ikb-hero.css';

import { PRESENTATION_STYLE_IDS } from '@quanan/schemas/specialist-io';
import { useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
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

// ── ACCENT_CYCLE — IKB 三主色轮转 ────────────────────────────────────────────
const ACCENT_CYCLE = [
  {
    bg: C.ikb,
    tileBg: `bg-[${C.ikb}]`,
    badgeBg: `bg-[${C.ikb}]/10`,
    badgeText: `text-[${C.ikb}]`,
    border: 'border-[#c7d2fe]',
    tipsBg: 'bg-[#eff4ff]',
    tipsText: `text-[${C.ikb}]`,
    tipsBorder: 'border-[#c7d2fe]',
    tileText: 'text-white',
    // raw values for inline styles
    rawColor: C.ikb,
    rawBg: `${C.ikb}0f`,
    rawBorder: `${C.ikb}40`,
    rawTipsBg: `${C.ikb}08`,
    rawTipsBorder: `${C.ikb}30`,
  },
  {
    bg: C.burgundy,
    tileBg: `bg-[${C.burgundy}]`,
    badgeBg: `bg-[${C.burgundy}]/10`,
    badgeText: `text-[${C.burgundyText}]`,
    border: 'border-[#f9c0ce]',
    tipsBg: 'bg-[#fff0f4]',
    tipsText: `text-[${C.burgundyText}]`,
    tipsBorder: 'border-[#f9c0ce]',
    tileText: 'text-white',
    rawColor: C.burgundy,
    rawBg: `${C.burgundy}0f`,
    rawBorder: `${C.burgundy}40`,
    rawTipsBg: `${C.burgundy}08`,
    rawTipsBorder: `${C.burgundy}30`,
  },
  {
    bg: C.accent3,
    tileBg: `bg-[${C.accent3}]`,
    badgeBg: `bg-[${C.accent3}]/10`,
    badgeText: `text-[${C.purpleText}]`,
    border: 'border-[#d8c4f8]',
    tipsBg: 'bg-[#f3eeff]',
    tipsText: `text-[${C.purpleText}]`,
    tipsBorder: 'border-[#d8c4f8]',
    tileText: 'text-white',
    rawColor: C.accent3,
    rawBg: `${C.accent3}0f`,
    rawBorder: `${C.accent3}40`,
    rawTipsBg: `${C.accent3}08`,
    rawTipsBorder: `${C.accent3}30`,
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
    <span
      className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
      style={{ color: C.ink, fontFamily: F.cn }}
    >
      <span
        className="h-3.5 w-1 rounded-full"
        style={{ background: C.grad }}
        aria-hidden={true}
      />
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
    <section
      className="relative overflow-hidden rounded-xl border p-6"
      style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl"
        style={{ background: `${C.ikb}08` }}
        aria-hidden={true}
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl"
        style={{ background: `${C.burgundy}06` }}
        aria-hidden={true}
      />

      <div
        className="relative mb-6 flex items-center justify-between border-b pb-5"
        style={{ borderColor: C.line }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ background: C.grad }}
          >
            <span className="material-symbols-outlined" aria-hidden={true}>tune</span>
          </span>
          <div>
            <h2
              className="text-[18px] font-bold"
              style={{ color: C.ink, fontFamily: F.cn }}
            >
              {PS_FORM_TITLE}
            </h2>
            <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
              填写文案 + 平台，AI 推荐最匹配形式
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.ikb}12`, color: C.ikb }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ikb }} />
          参数就绪
        </span>
      </div>

      <div className="relative space-y-5">
        {/* 文案内容 */}
        <div>
          <label htmlFor="ps-text" className="mb-2 block">
            <FieldLabel>
              {PS_LABEL_TEXT}
              {' '}<span style={{ color: C.burgundy }}>*</span>
            </FieldLabel>
          </label>
          <div
            className={`ikb-input overflow-hidden rounded-xl border bg-[#f9f9f9] transition-all focus-within:bg-white focus-within:ring-1 ${
              textError ? '' : ''
            }`}
            style={
              textError
                ? { borderColor: C.burgundy, outline: undefined }
                : { borderColor: C.line }
            }
          >
            <textarea
              id="ps-text"
              data-testid="ps-text-input"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              rows={4}
              placeholder={`请输入你的文案内容（至少 ${PS_TEXT_MIN} 字）`}
              className="w-full resize-y border-0 bg-transparent p-4 text-[14px] leading-relaxed focus:outline-none"
              style={{ color: C.ink, fontFamily: F.cn }}
            />
          </div>
          {textError && (
            <p
              data-testid="ps-text-error"
              className="mt-1 text-[12px]"
              style={{ color: C.burgundy, fontFamily: F.cn }}
            >
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
            className="ikb-focusring w-full rounded-md border px-4 py-3 text-[14px] transition-all focus:ring-1 focus:outline-none"
            style={{
              borderColor: C.line,
              background: C.base,
              color: C.ink,
              fontFamily: F.cn,
            }}
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
          className="ikb-gradbtn ikb-focusring mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          style={{ fontFamily: F.mono }}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_awesome</span>
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
      className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center"
      style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
    >
      <span
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: `${C.ikb}10`, color: C.ikb }}
      >
        <span className="material-symbols-outlined text-[36px]" aria-hidden={true}>style</span>
      </span>
      <h3
        className="mb-2 text-[18px] font-bold"
        style={{ color: C.ink, fontFamily: F.cn }}
      >
        {PS_RESULT_TITLE}
      </h3>
      <p
        className="text-[14px] leading-relaxed"
        style={{ color: '#6b7280', fontFamily: F.cn }}
      >
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
          className="flex items-center gap-3 rounded-xl border px-4 py-3 text-[13px]"
          style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}08`, color: C.purpleText }}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>warning</span>
          AI 繁忙，已返回备用推荐方案，建议稍后重试以获取个性化结果。
        </div>
      )}

      {/* 结果标题 */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-md"
          style={{ background: C.grad }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>style</span>
        </span>
        <h2
          className="text-[18px] font-bold"
          style={{ color: C.ink, fontFamily: F.cn }}
        >
          {PS_RESULT_TITLE}
        </h2>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.ikb}12`, color: C.ikb }}
        >
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: C.ikb }}
          />
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
              className="ikb-hovercard rounded-xl border"
              style={{ borderColor: C.line, background: C.paper }}
            >
              {/* Icon tile — ps-prefix on inline gradient */}
              <div
                className="flex h-14 w-full items-center gap-3 rounded-t-xl px-5"
                style={{ background: accent.rawColor }}
              >
                <span className="material-symbols-outlined text-[26px] text-white" aria-hidden={true}>
                  {icon}
                </span>
                <span className="text-[16px] font-extrabold tracking-tight text-white">
                  {displayLabel}
                </span>
                {/* matchScore 徽章 */}
                <span
                  className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                  data-testid={`ps-match-score-${item.id}`}
                >
                  匹配度 {item.matchScore}%
                </span>
              </div>

              <div className="flex flex-col gap-3 p-5">
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ color: '#444653', fontFamily: F.cn }}
                >
                  {displayDescription}
                </p>

                {/* 推荐理由 */}
                {item.rationale && (
                  <div
                    className="flex items-start gap-2 rounded-lg border p-3"
                    style={{
                      background: accent.rawTipsBg,
                      borderColor: accent.rawTipsBorder,
                    }}
                    data-testid={`ps-rationale-${item.id}`}
                  >
                    <span
                      className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]"
                      style={{ color: accent.rawColor }}
                      aria-hidden={true}
                    >
                      recommend
                    </span>
                    <div>
                      <span
                        className="mr-1 text-[12px] font-extrabold"
                        style={{ color: accent.rawColor, fontFamily: F.cn }}
                      >
                        推荐理由
                      </span>
                      <span
                        className="text-[13px] leading-relaxed"
                        style={{ color: accent.rawColor, fontFamily: F.cn }}
                      >
                        {item.rationale}
                      </span>
                    </div>
                  </div>
                )}

                {/* 操作要点 */}
                {displayTips && (
                  <div
                    className="flex items-start gap-2 rounded-lg border p-3"
                    style={{ borderColor: C.line, background: C.base }}
                  >
                    <span
                      className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]"
                      style={{ color: '#6b7280' }}
                      aria-hidden={true}
                    >
                      lightbulb
                    </span>
                    <div>
                      <span
                        className="mr-1 text-[12px] font-extrabold"
                        style={{ color: '#6b7280', fontFamily: F.cn }}
                      >
                        要点
                      </span>
                      <span
                        className="text-[13px] leading-relaxed"
                        style={{ color: '#6b7280', fontFamily: F.cn }}
                      >
                        {displayTips}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 反馈 row */}
      <div
        className="flex items-center gap-3 border-t pt-4"
        style={{ borderColor: C.line }}
      >
        <p
          className="text-[14px]"
          style={{ color: '#6b7280', fontFamily: F.cn }}
        >
          {PS_FEEDBACK_PROMPT}
        </p>
        <button
          type="button"
          onClick={handleFeedback}
          aria-label="有帮助"
          className="ikb-focusring flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-[#2B53E6] hover:text-[#2B53E6]"
          style={{ borderColor: C.line, color: '#6b7280' }}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>thumb_up</span>
        </button>
        <button
          type="button"
          onClick={handleFeedback}
          aria-label="无帮助"
          className="ikb-focusring flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-[#EF3E6B] hover:text-[#EF3E6B]"
          style={{ borderColor: C.line, color: '#6b7280' }}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>thumb_down</span>
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
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
            >
              创作引擎
            </span>
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${C.accent3}50`, background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}
            >
              形式库
            </span>
          </div>
          <h1
            className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight"
            style={{ fontFamily: F.display }}
          >
            {PAGE_TITLE}
          </h1>
          <p
            className="mt-2 max-w-[820px] text-[16px] leading-relaxed"
            style={{ color: '#5A6173', fontFamily: F.cn }}
          >
            {PAGE_SUBTITLE}
          </p>
        </div>
      </header>

      {/* ── 数据洞察 band ──────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ color: C.ikb }}
          aria-hidden={true}
        >
          insights
        </span>
        <h2
          className="text-[16px] font-bold"
          style={{ color: C.ink, fontFamily: F.cn }}
        >
          数据洞察
        </h2>
        <span
          className="text-[12px]"
          style={{ color: '#6b7280', fontFamily: F.cn }}
        >
          · 内容形式覆盖全景
        </span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.ikb}12`, color: C.ikb }}
        >
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: C.ikb }}
          />
          已收录 {PRESENT_STYLES.length} 种形式
        </span>
      </div>

      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 内容形式适配雷达 */}
        <div
          className="col-span-5 ikb-hovercard rounded-xl border p-6"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.ikb}10`, color: C.ikb }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
              </span>
              <div>
                <h3
                  className="text-[14px] font-bold"
                  style={{ color: C.ink, fontFamily: F.cn }}
                >
                  内容形式适配雷达
                </h3>
                <p
                  className="text-[11px]"
                  style={{ color: '#6b7280', fontFamily: F.cn }}
                >
                  六维模型评估（示例/参考）
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="text-[26px] font-bold leading-none"
                style={{ color: C.ikb, fontFamily: F.display }}
              >
                14
              </p>
              <p
                className="text-[10px]"
                style={{ color: '#6b7280', fontFamily: F.cn }}
              >
                形式总数
              </p>
            </div>
          </div>
          {(() => {
            const dims = [
              { label: '知识输出', value: 85, color: C.ikb },
              { label: '剧情张力', value: 72, color: C.burgundy },
              { label: '测评种草', value: 78, color: C.accent3 },
              { label: '人设打造', value: 90, color: C.ikb },
              { label: '互动话题', value: 68, color: C.burgundy },
              { label: '带货转化', value: 80, color: C.accent3 },
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
              <svg viewBox="0 0 260 244" className="w-full" aria-hidden={true}>
                <defs>
                  <linearGradient id="ps-radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke={C.line} strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return (
                    <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.line} strokeWidth="1" />
                  );
                })}
                <polygon
                  points={dataPoly}
                  fill="url(#ps-radarFill)"
                  stroke={C.ikb}
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
              { label: '知识输出', value: 85, color: C.ikb },
              { label: '剧情张力', value: 72, color: C.burgundy },
              { label: '测评种草', value: 78, color: C.accent3 },
              { label: '人设打造', value: 90, color: C.ikb },
              { label: '互动话题', value: 68, color: C.burgundy },
              { label: '带货转化', value: 80, color: C.accent3 },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span
                  className="text-[11px]"
                  style={{ color: '#6b7280', fontFamily: F.cn }}
                >
                  {d.label}
                </span>
                <span
                  className="text-[11px] font-bold"
                  style={{ color: C.ink, fontFamily: F.cn }}
                >
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 各形式流量热度趋势 */}
        <div
          className="col-span-7 ikb-hovercard rounded-xl border p-6"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.burgundy}10`, color: C.burgundy }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
              </span>
              <div>
                <h3
                  className="text-[14px] font-bold"
                  style={{ color: C.ink, fontFamily: F.cn }}
                >
                  各形式流量热度
                </h3>
                <p
                  className="text-[11px]"
                  style={{ color: '#6b7280', fontFamily: F.cn }}
                >
                  代表形式综合热度指数（示例/参考）
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['口播', '剧情', '教程', '测评', 'Vlog', '清单'].map((t, i) => (
                <span
                  key={t}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                  style={
                    i === 0
                      ? { background: C.ikb, color: '#fff', fontFamily: F.cn }
                      : { background: C.base, color: '#6b7280', fontFamily: F.cn }
                  }
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p
              className="text-[30px] font-bold leading-none"
              style={{ color: C.ink, fontFamily: F.display }}
            >
              口播
            </p>
            <span
              className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>
              最高热度
            </span>
            <span
              className="mb-1 text-[12px]"
              style={{ color: '#6b7280', fontFamily: F.cn }}
            >
              当前最主流形式
            </span>
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
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden={true}>
                <defs>
                  <linearGradient id="ps-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="ps-trendLine" x1="0" y1="0" x2="1" y2="0">
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
                <path d={area} fill="url(#ps-trendFill)" />
                <path
                  d={line}
                  fill="none"
                  stroke="url(#ps-trendLine)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" />
                ))}
                {data.map((_, i) => (
                  <text
                    key={`lbl-${i}`}
                    x={x(i).toFixed(1)}
                    y={(padT + innerH + 14).toFixed(1)}
                    textAnchor="middle"
                    fill="#6b7280"
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
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: `${C.ikb}28`, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}10`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>video_library</span>
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>
              全覆盖
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p
                className="text-[28px] font-bold leading-none"
                style={{ color: C.ink, fontFamily: F.display }}
              >
                {PRESENT_STYLES.length}
                <span
                  className="text-[15px]"
                  style={{ color: '#6b7280', fontFamily: F.cn }}
                >
                  {' '}种
                </span>
              </p>
              <p
                className="mt-1.5 text-[12px]"
                style={{ color: '#6b7280', fontFamily: F.cn }}
              >
                呈现形式
              </p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90" aria-hidden={true}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}20`} strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={C.ikb}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="100 100"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 覆盖场景 · 玫红 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: `${C.burgundy}28`, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.burgundy}10`, color: C.burgundy }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>category</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.burgundy}10`, color: C.burgundyText }}
            >
              多场景
            </span>
          </div>
          <div className="mt-4">
            <p
              className="text-[28px] font-bold leading-none"
              style={{ color: C.ink, fontFamily: F.display }}
            >
              6
              <span
                className="text-[15px]"
                style={{ color: '#6b7280', fontFamily: F.cn }}
              >
                {' '}类
              </span>
            </p>
            <p
              className="mt-1.5 text-[12px]"
              style={{ color: '#6b7280', fontFamily: F.cn }}
            >
              覆盖场景
            </p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[70, 90, 60, 85, 75, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${h}%`, background: `${C.burgundy}70` }}
              />
            ))}
          </div>
        </div>

        {/* 上手难度 · 紫 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: `${C.accent3}28`, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.accent3}10`, color: C.accent3 }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>signal_cellular_alt</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.accent3}10`, color: C.purpleText }}
            >
              易上手
            </span>
          </div>
          <div className="mt-4">
            <p
              className="text-[28px] font-bold leading-none"
              style={{ color: C.ink, fontFamily: F.display }}
            >
              初级
              <span
                className="text-[15px]"
                style={{ color: '#6b7280', fontFamily: F.cn }}
              >
                {' '}起
              </span>
            </p>
            <p
              className="mt-1.5 text-[12px]"
              style={{ color: '#6b7280', fontFamily: F.cn }}
            >
              上手难度
            </p>
          </div>
          <div
            className="mt-3 h-2 w-full rounded-full"
            style={{ background: `${C.accent3}15` }}
          >
            <div
              className="h-2 w-2/5 rounded-full"
              style={{ background: `linear-gradient(to right, ${C.accent3}, ${C.ikb})` }}
            />
          </div>
        </div>

        {/* 适用平台 · 蓝 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: `${C.ikb}28`, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}10`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>hub</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}10`, color: C.ikb }}
            >
              全平台
            </span>
          </div>
          <div className="mt-4">
            <p
              className="text-[28px] font-bold leading-none"
              style={{ color: C.ink, fontFamily: F.display }}
            >
              3
              <span
                className="text-[15px]"
                style={{ color: '#6b7280', fontFamily: F.cn }}
              >
                {' '}平台
              </span>
            </p>
            <p
              className="mt-1.5 text-[12px]"
              style={{ color: '#6b7280', fontFamily: F.cn }}
            >
              适用平台
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['抖音', '小红书', '视频号'].map((k) => (
              <span
                key={k}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: `${C.ikb}10`, color: C.ikb, fontFamily: F.cn }}
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
          className="mb-6 flex items-center gap-3 rounded-xl border px-5 py-4 text-[14px]"
          style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}08`, color: C.ikb }}
        >
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
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
          className="mb-6 flex items-center gap-3 rounded-xl border px-5 py-4 text-[14px]"
          style={{ borderColor: `${C.burgundy}30`, background: `${C.burgundy}08`, color: C.burgundyText }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>error</span>
          推荐失败，请检查网络后重试。
          <button
            type="button"
            onClick={handleRecommend}
            className="ikb-focusring ml-auto rounded-lg px-3 py-1 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: C.burgundy }}
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
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `${C.ikb}10`, color: C.ikb }}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>auto_stories</span>
          </span>
          <h2
            className="text-[20px] font-extrabold tracking-tight"
            style={{ color: C.ink, fontFamily: F.cn }}
            data-testid="ps-catalog-title"
          >
            全部呈现形式 · 参考目录
          </h2>
          <span
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: `${C.ikb}10`, color: C.ikb }}
          >
            共 {PRESENT_STYLES.length} 种
          </span>
        </div>
        <p
          className="pl-11 text-[14px] leading-relaxed"
          style={{ color: '#6b7280', fontFamily: F.cn }}
        >
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
              className="ikb-hovercard flex flex-col rounded-xl border"
              style={{ borderColor: C.line, background: C.paper }}
            >
              {/* Icon tile */}
              <div
                className="flex h-14 w-full items-center gap-3 rounded-t-xl px-5"
                style={{ background: accent.rawColor }}
              >
                <span className="material-symbols-outlined text-[26px] text-white" aria-hidden={true}>
                  {icon}
                </span>
                <span className="text-[16px] font-extrabold tracking-tight text-white">
                  {style.label}
                </span>
              </div>

              {/* Card body */}
              <div className="flex flex-1 flex-col gap-4 p-5">
                {/* description */}
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ color: '#444653', fontFamily: F.cn }}
                >
                  {style.description}
                </p>

                {/* tips block */}
                <div
                  className="flex items-start gap-2 rounded-lg border p-3"
                  style={{
                    background: accent.rawTipsBg,
                    borderColor: accent.rawTipsBorder,
                  }}
                >
                  <span
                    className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]"
                    style={{ color: accent.rawColor }}
                    aria-hidden={true}
                  >
                    lightbulb
                  </span>
                  <div>
                    <span
                      className="mr-1 text-[12px] font-extrabold"
                      style={{ color: accent.rawColor, fontFamily: F.cn }}
                    >
                      要点
                    </span>
                    <span
                      className="text-[13px] leading-relaxed"
                      style={{ color: accent.rawColor, fontFamily: F.cn }}
                    >
                      {style.tips}
                    </span>
                  </div>
                </div>

                {/* 场景行 */}
                <div className="mt-auto flex items-center gap-1.5 pt-1">
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ color: accent.rawColor }}
                    aria-hidden={true}
                  >
                    visibility
                  </span>
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: accent.rawColor, fontFamily: F.cn }}
                  >
                    {SCENE_LABEL}：{SCENE_VALUE_DEFAULT}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </IKBLayout>
  );
}
