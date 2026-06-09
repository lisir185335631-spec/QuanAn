/**
 * /present-styles · 爆款呈现形式合集
 * 液态玻璃皮 · LiquidShell · 14 形式卡 · 阶段2 接真
 * trpc.presentStyles.recommend · hasResult 门控 · 三态 + isFallback
 * 2026-06-08
 */

import { PRESENTATION_STYLE_IDS } from '@quanan/schemas/specialist-io';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
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

// ── ACCENT_CYCLE — 液态玻璃三色轮转(冷蓝体系)────────────────────────────────
// rawColor: 用于 icon/文字/边框; tileBg: 卡片色块背景; tipsBg/tipsBorder: 提示块
const ACCENT_CYCLE = [
  {
    rawColor: C.ikb,                          // #d8e8ff
    tileBg: 'linear-gradient(135deg, rgba(168,197,224,0.55), rgba(120,160,220,0.38))',
    rawTipsBg: 'rgba(168,197,224,0.12)',
    rawTipsBorder: 'rgba(168,197,224,0.32)',
    rawBg: 'rgba(168,197,224,0.10)',
    rawBorder: 'rgba(168,197,224,0.28)',
  },
  {
    rawColor: C.yellow,                       // #e4eeff
    tileBg: 'linear-gradient(135deg, rgba(180,208,255,0.55), rgba(140,170,240,0.38))',
    rawTipsBg: 'rgba(180,208,255,0.12)',
    rawTipsBorder: 'rgba(180,208,255,0.32)',
    rawBg: 'rgba(180,208,255,0.10)',
    rawBorder: 'rgba(180,208,255,0.28)',
  },
  {
    rawColor: C.accent3,                      // #d8e8ff
    tileBg: 'linear-gradient(135deg, rgba(155,185,230,0.55), rgba(100,145,215,0.38))',
    rawTipsBg: 'rgba(155,185,230,0.12)',
    rawTipsBorder: 'rgba(155,185,230,0.32)',
    rawBg: 'rgba(155,185,230,0.10)',
    rawBorder: 'rgba(155,185,230,0.28)',
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
      style={{
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: '0.05em',
        color: C.ink,
        fontFamily: F.cn,
        textShadow: C.textShadow,
      }}
    >
      <span
        style={{
          height: 14,
          width: 3,
          borderRadius: 9999,
          background: C.grad,
          flexShrink: 0,
          display: 'inline-block',
        }}
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
      className="lg-glass lg-spec"
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: 24 }}
    >
      {/* 内部高光装饰 */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          right: -64,
          top: -64,
          height: 176,
          width: 176,
          borderRadius: '50%',
          filter: 'blur(48px)',
          background: 'rgba(168,197,224,0.18)',
        }}
        aria-hidden={true}
      />

      {/* 标题行 */}
      <div
        style={{
          position: 'relative',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `0.5px solid ${C.line}`,
          paddingBottom: 20,
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
              background: C.grad,
              color: '#fff',
              boxShadow: '0 4px 16px -4px rgba(120,160,220,0.45)',
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 22 }}>tune</span>
          </span>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.ink,
                fontFamily: F.cn,
                margin: 0,
                textShadow: C.textShadow,
              }}
            >
              {PS_FORM_TITLE}
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>
              填写文案 + 平台，AI 推荐最匹配形式
            </p>
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
          }}
        >
          <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
          参数就绪
        </span>
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 文案内容 */}
        <div>
          <label htmlFor="ps-text" style={{ display: 'block', marginBottom: 8 }}>
            <FieldLabel>
              {PS_LABEL_TEXT}
              {' '}<span style={{ color: 'rgba(255,120,140,0.9)' }}>*</span>
            </FieldLabel>
          </label>
          <div
            style={{
              overflow: 'hidden',
              borderRadius: 12,
              border: `0.5px solid ${textError ? 'rgba(255,120,140,0.6)' : C.line}`,
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(8px)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <textarea
              id="ps-text"
              data-testid="ps-text-input"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              rows={4}
              placeholder={`请输入你的文案内容（至少 ${PS_TEXT_MIN} 字）`}
              style={{
                width: '100%',
                resize: 'vertical',
                border: 0,
                background: 'transparent',
                padding: 16,
                fontSize: 14,
                lineHeight: 1.65,
                color: C.ink,
                fontFamily: F.cn,
                outline: 'none',
              }}
            />
          </div>
          {textError && (
            <p
              data-testid="ps-text-error"
              style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,120,140,0.9)', fontFamily: F.cn }}
            >
              {textError}
            </p>
          )}
        </div>

        {/* 目标平台 */}
        <div>
          <label htmlFor="ps-platform" style={{ display: 'block', marginBottom: 8 }}>
            <FieldLabel>{PS_LABEL_PLATFORM}</FieldLabel>
          </label>
          <select
            id="ps-platform"
            data-testid="ps-platform-select"
            value={platform}
            onChange={(e) => onPlatformChange(e.target.value)}
            style={{
              width: '100%',
              borderRadius: 12,
              border: `0.5px solid ${C.line}`,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              padding: '12px 16px',
              fontSize: 14,
              color: C.ink,
              fontFamily: F.cn,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'auto',
            }}
          >
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p.value} value={p.value} style={{ background: '#1a2d56', color: '#fff' }}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* CTA */}
        <Magnetic strength={0.3}>
          <button
            type="button"
            data-testid="ps-recommend-btn"
            onClick={onRecommend}
            disabled={isPending || text.trim().length < PS_TEXT_MIN}
            className="lg-gradbtn"
            style={{
              marginTop: 8,
              display: 'inline-flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 9999,
              padding: '14px 24px',
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              fontFamily: F.cn,
              border: 'none',
              cursor: isPending || text.trim().length < PS_TEXT_MIN ? 'not-allowed' : 'pointer',
              opacity: isPending || text.trim().length < PS_TEXT_MIN ? 0.55 : 1,
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>auto_awesome</span>
            {PS_CTA}
          </button>
        </Magnetic>
      </div>
    </section>
  );
}

// ── PresentStylesEmptyState ───────────────────────────────────────────────────
function PresentStylesEmptyState() {
  return (
    <div
      data-testid="ps-empty-state"
      className="lg-glass"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        padding: 48,
        textAlign: 'center',
        border: `0.5px dashed ${C.line}`,
      }}
    >
      <span
        style={{
          marginBottom: 16,
          display: 'flex',
          height: 64,
          width: 64,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          background: 'rgba(168,197,224,0.18)',
          color: C.ink,
        }}
      >
        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 36, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>style</span>
      </span>
      <h3
        style={{
          marginBottom: 8,
          fontSize: 18,
          fontWeight: 700,
          color: C.ink,
          fontFamily: F.cn,
          textShadow: C.textShadow,
        }}
      >
        {PS_RESULT_TITLE}
      </h3>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.84)',
          fontFamily: F.cn,
        }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} data-testid="ps-result-panel">
      {/* isFallback 降级提示 */}
      {isFallback && (
        <div
          data-testid="ps-fallback-notice"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 12,
            border: `0.5px solid rgba(168,197,224,0.35)`,
            padding: '12px 16px',
            fontSize: 13,
            background: 'rgba(168,197,224,0.10)',
            color: 'rgba(255,255,255,0.88)',
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18, color: C.ikb }}>warning</span>
          AI 繁忙，已返回备用推荐方案，建议稍后重试以获取个性化结果。
        </div>
      )}

      {/* 结果标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            display: 'flex',
            height: 36,
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: C.grad,
            color: '#0c1a30',
            boxShadow: '0 4px 14px -4px rgba(120,160,220,0.45)',
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>style</span>
        </span>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: C.ink,
            fontFamily: F.cn,
            margin: 0,
            textShadow: C.textShadow,
          }}
        >
          {PS_RESULT_TITLE}
        </h2>
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
          }}
        >
          <span
            style={{
              height: 6,
              width: 6,
              borderRadius: '50%',
              background: C.ikb,
              display: 'inline-block',
              animation: 'pulse 2s infinite',
            }}
          />
          推荐已就绪
        </span>
      </div>

      {/* 推荐形式列表 · 两列卡片网格 */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }} data-testid="ps-recommended-styles">
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
            <Item key={item.id} style={{ height: '100%' }}>
              <motion.div
                data-testid={`ps-recommended-item-${item.id}`}
                className="lg-glass"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', height: '100%' }}
              >
                {/* Icon tile */}
                <div
                  style={{
                    display: 'flex',
                    height: 56,
                    width: '100%',
                    alignItems: 'center',
                    gap: 12,
                    padding: '0 20px',
                    background: accent.tileBg,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 26, color: '#fff' }}>
                    {icon}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', textShadow: '0 1px 4px rgba(8,20,48,0.4)' }}>
                    {displayLabel}
                  </span>
                  {/* matchScore 徽章 */}
                  <span
                    style={{
                      marginLeft: 'auto',
                      borderRadius: 9999,
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#fff',
                      background: 'rgba(255,255,255,0.20)',
                    }}
                    data-testid={`ps-match-score-${item.id}`}
                  >
                    匹配度 {item.matchScore}%
                  </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: 'rgba(255,255,255,0.80)',
                      fontFamily: F.cn,
                      margin: 0,
                    }}
                  >
                    {displayDescription}
                  </p>

                  {/* 推荐理由 */}
                  {item.rationale && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        borderRadius: 10,
                        border: `0.5px solid ${accent.rawTipsBorder}`,
                        padding: 12,
                        background: accent.rawTipsBg,
                        marginTop: 'auto',
                      }}
                      data-testid={`ps-rationale-${item.id}`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ marginTop: 2, flexShrink: 0, fontSize: 18, color: accent.rawColor }}
                        aria-hidden={true}
                      >
                        recommend
                      </span>
                      <div>
                        <span
                          style={{
                            marginRight: 4,
                            fontSize: 12,
                            fontWeight: 800,
                            color: accent.rawColor,
                            fontFamily: F.cn,
                          }}
                        >
                          推荐理由
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.84)',
                            fontFamily: F.cn,
                          }}
                        >
                          {item.rationale}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 操作要点 */}
                  {displayTips && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        borderRadius: 10,
                        border: `0.5px solid ${C.line}`,
                        padding: 12,
                        background: 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ marginTop: 2, flexShrink: 0, fontSize: 18, color: 'rgba(255,255,255,0.8)' }}
                        aria-hidden={true}
                      >
                        lightbulb
                      </span>
                      <div>
                        <span
                          style={{
                            marginRight: 4,
                            fontSize: 12,
                            fontWeight: 800,
                            color: 'rgba(255,255,255,0.84)',
                            fontFamily: F.cn,
                          }}
                        >
                          要点
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.84)',
                            fontFamily: F.cn,
                          }}
                        >
                          {displayTips}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </Item>
          );
        })}
      </RevealGroup>

      {/* 反馈 row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderTop: `0.5px solid ${C.line}`,
          paddingTop: 16,
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.84)',
            fontFamily: F.cn,
            margin: 0,
          }}
        >
          {PS_FEEDBACK_PROMPT}
        </p>
        <button
          type="button"
          onClick={handleFeedback}
          aria-label="有帮助"
          style={{
            display: 'flex',
            height: 32,
            width: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: `0.5px solid ${C.line}`,
            background: 'transparent',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = C.ikb;
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.line;
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>thumb_up</span>
        </button>
        <button
          type="button"
          onClick={handleFeedback}
          aria-label="无帮助"
          style={{
            display: 'flex',
            height: 32,
            width: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: `0.5px solid ${C.line}`,
            background: 'transparent',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,120,140,0.9)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,120,140,0.6)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.line;
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>thumb_down</span>
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
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Reveal>
        <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ flexShrink: 0 }}>
            {/* chip 标签行 */}
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
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
                形式库
              </span>
            </div>
            {/* 主标题 — 冷蓝渐变字 */}
            <h1
              style={{
                whiteSpace: 'nowrap',
                fontSize: 40,
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
              {PAGE_TITLE}
            </h1>
            <p
              style={{
                marginTop: 8,
                maxWidth: 820,
                fontSize: 16,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.75)',
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              {PAGE_SUBTITLE}
            </p>
          </div>
        </header>
      </Reveal>

      {/* ── KPI 卡一排(4 卡)──────────────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 44 }}>
        {/* 呈现形式总数 · 冷蓝 · 环形 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>video_library</span>
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
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 13 }}>trending_up</span>
                全覆盖
              </span>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: C.ink,
                    fontFamily: F.display,
                    margin: 0,
                    textShadow: C.textShadow,
                  }}
                >
                  {PRESENT_STYLES.length}
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{' '}种</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '6px 0 0' }}>
                  呈现形式
                </p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} aria-hidden={true}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.20)" strokeWidth="3.5" />
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
          </motion.div>
        </Item>

        {/* 覆盖场景 · 次冷蓝 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  background: 'rgba(180,208,255,0.20)',
                  color: C.yellow,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>category</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(180,208,255,0.18)',
                  color: C.yellow,
                }}
              >
                多场景
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                6
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{' '}类</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '6px 0 0' }}>
                覆盖场景
              </p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
              {[70, 90, 60, 85, 75, 95].map((h, i) => (
                <div
                  key={i}
                  style={{ flex: 1, borderRadius: '2px 2px 0 0', background: 'rgba(180,208,255,0.55)', height: `${h}%` }}
                />
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 上手难度 · accent3 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  background: 'rgba(155,185,230,0.20)',
                  color: C.accent3,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>signal_cellular_alt</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(155,185,230,0.18)',
                  color: C.accent3,
                }}
              >
                易上手
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                初级
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{' '}起</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '6px 0 0' }}>
                上手难度
              </p>
            </div>
            <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 9999, background: 'rgba(155,185,230,0.18)' }}>
              <div
                style={{
                  height: 8,
                  width: '40%',
                  borderRadius: 9999,
                  background: C.grad,
                }}
              />
            </div>
          </motion.div>
        </Item>

        {/* 适用平台 · 冷蓝 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>hub</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                }}
              >
                全平台
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                3
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{' '}平台</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '6px 0 0' }}>
                适用平台
              </p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['抖音', '小红书', '视频号'].map((k) => (
                <span
                  key={k}
                  style={{
                    borderRadius: 6,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 500,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    fontFamily: F.cn,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── loading banner ────────────────────────────────────────────── */}
      {isPending && (
        <div
          data-testid="ps-loading-banner"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 14,
            border: `0.5px solid rgba(168,197,224,0.35)`,
            padding: '14px 20px',
            fontSize: 14,
            background: 'rgba(168,197,224,0.10)',
            color: C.ink,
          }}
        >
          <svg style={{ height: 20, width: 20, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" aria-hidden={true}>
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          AI 正在分析文案，推荐最适合的呈现形式，大约需要 10-20 秒…
        </div>
      )}

      {/* ── error notice ──────────────────────────────────────────────── */}
      {isError && (
        <div
          data-testid="ps-error-notice"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 14,
            border: `0.5px solid rgba(255,120,140,0.40)`,
            padding: '14px 20px',
            fontSize: 14,
            background: 'rgba(255,120,140,0.08)',
            color: 'rgba(255,200,210,0.95)',
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>error</span>
          推荐失败，请检查网络后重试。
          <button
            type="button"
            onClick={handleRecommend}
            style={{
              marginLeft: 'auto',
              borderRadius: 10,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 700,
              color: '#0c1a30',
              background: C.grad,
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            重试
          </button>
        </div>
      )}

      {/* ── 表单 + 结果(左右 2 列)──────────────────────────────────────── */}
      <div style={{ marginBottom: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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

      {/* ── 全部参考目录 section header ──────────────────────────────── */}
      <Reveal>
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 6 }} data-testid="ps-catalog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                display: 'flex',
                height: 32,
                width: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                background: 'rgba(168,197,224,0.22)',
                color: C.ikb,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>auto_stories</span>
            </span>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: C.ink,
                fontFamily: F.cn,
                margin: 0,
                textShadow: C.textShadow,
              }}
              data-testid="ps-catalog-title"
            >
              全部呈现形式 · 参考目录
            </h2>
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
              }}
            >
              共 {PRESENT_STYLES.length} 种
            </span>
          </div>
          <p
            style={{
              paddingLeft: 44,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.84)',
              fontFamily: F.cn,
              margin: 0,
            }}
          >
            以下是所有支持的呈现形式，AI 已从中为你个性化推荐——填写左侧文案后点击「{PS_CTA}」即可查看推荐结果。
          </p>
        </div>
      </Reveal>

      {/* ── 14 形式卡(grid-cols-3)──────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {PRESENT_STYLES.map((style, idx) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const accent = ACCENT_CYCLE[idx % 3]!;
          const icon = STYLE_ICON[style.id] ?? 'play_circle';
          return (
            <Item key={style.id}>
              <motion.div
                data-testid={`style-card-${style.id}`}
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ display: 'flex', flexDirection: 'column', borderRadius: 18, overflow: 'hidden' }}
              >
                {/* Icon tile */}
                <div
                  style={{
                    display: 'flex',
                    height: 56,
                    width: '100%',
                    alignItems: 'center',
                    gap: 12,
                    padding: '0 20px',
                    background: accent.tileBg,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 26, color: '#fff' }}>
                    {icon}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', textShadow: '0 1px 4px rgba(8,20,48,0.4)' }}>
                    {style.label}
                  </span>
                </div>

                {/* Card body */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
                  {/* description */}
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: 'rgba(255,255,255,0.80)',
                      fontFamily: F.cn,
                      margin: 0,
                    }}
                  >
                    {style.description}
                  </p>

                  {/* tips block */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      borderRadius: 10,
                      border: `0.5px solid ${accent.rawTipsBorder}`,
                      padding: 12,
                      background: accent.rawTipsBg,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ marginTop: 2, flexShrink: 0, fontSize: 18, color: accent.rawColor }}
                      aria-hidden={true}
                    >
                      lightbulb
                    </span>
                    <div>
                      <span
                        style={{
                          marginRight: 4,
                          fontSize: 12,
                          fontWeight: 800,
                          color: accent.rawColor,
                          fontFamily: F.cn,
                        }}
                      >
                        要点
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: 'rgba(255,255,255,0.72)',
                          fontFamily: F.cn,
                        }}
                      >
                        {style.tips}
                      </span>
                    </div>
                  </div>

                  {/* 场景行 */}
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, color: accent.rawColor }}
                      aria-hidden={true}
                    >
                      visibility
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: accent.rawColor,
                        fontFamily: F.cn,
                      }}
                    >
                      {SCENE_LABEL}：{SCENE_VALUE_DEFAULT}
                    </span>
                  </div>
                </div>
              </motion.div>
            </Item>
          );
        })}
      </RevealGroup>

      {/* ── 数据洞察 band ────────────────────────────────────────────── */}
      <Reveal>
        <div style={{ marginTop: 48, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: C.ikb }}
            aria-hidden={true}
          >
            insights
          </span>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: C.ink,
              fontFamily: F.cn,
              margin: 0,
              textShadow: C.textShadow,
            }}
          >
            数据洞察
          </h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· 内容形式覆盖全景</span>
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
            }}
          >
            <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            已收录 {PRESENT_STYLES.length} 种形式
          </span>
        </div>
      </Reveal>

      <div style={{ marginBottom: 32, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 }}>
        {/* 内容形式适配雷达 */}
        <Reveal>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 24 }}
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
                    background: 'rgba(168,197,224,0.22)',
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>radar</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>
                    内容形式适配雷达
                  </h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>
                    六维模型评估（示例/参考）
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>14</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>形式总数</p>
              </div>
            </div>
            {(() => {
              const dims = [
                { label: '知识输出', value: 85, color: C.ikb },
                { label: '剧情张力', value: 72, color: C.yellow },
                { label: '测评种草', value: 78, color: C.accent3 },
                { label: '人设打造', value: 90, color: C.ikb },
                { label: '互动话题', value: 68, color: C.yellow },
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
                <svg viewBox="0 0 260 244" style={{ width: '100%' }} aria-hidden={true}>
                  <defs>
                    <linearGradient id="ps-radarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                      <stop offset="100%" stopColor={C.yellow} stopOpacity="0.12" />
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
                      <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />
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
                        fill="rgba(255,255,255,0.65)"
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
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[
                { label: '知识输出', value: 85, color: C.ikb },
                { label: '剧情张力', value: 72, color: C.yellow },
                { label: '测评种草', value: 78, color: C.accent3 },
                { label: '人设打造', value: 90, color: C.ikb },
                { label: '互动话题', value: 68, color: C.yellow },
                { label: '带货转化', value: 80, color: C.accent3 },
              ].map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ height: 8, width: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </Reveal>

        {/* 各形式流量热度趋势 */}
        <Reveal>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 24 }}
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
                    background: 'rgba(180,208,255,0.20)',
                    color: C.yellow,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>show_chart</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>
                    各形式流量热度
                  </h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>
                    代表形式综合热度指数（示例/参考）
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {['口播', '剧情', '教程', '测评', 'Vlog', '清单'].map((t, i) => (
                  <span
                    key={t}
                    style={{
                      borderRadius: 8,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      background: i === 0 ? C.grad : 'rgba(255,255,255,0.08)',
                      color: i === 0 ? '#0c1a30' : 'rgba(255,255,255,0.84)',
                      fontFamily: F.cn,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                口播
              </p>
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
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>trending_up</span>
                最高热度
              </span>
              <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
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
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} aria-hidden={true}>
                  <defs>
                    <linearGradient id="ps-trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                      <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="ps-trendLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.ikb} />
                      <stop offset="100%" stopColor={C.yellow} />
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
                    <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" />
                  ))}
                  {data.map((_, i) => (
                    <text
                      key={`lbl-${i}`}
                      x={x(i).toFixed(1)}
                      y={(padT + innerH + 14).toFixed(1)}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.8)"
                      fontSize="11"
                    >
                      {labels[i]}
                    </text>
                  ))}
                </svg>
              );
            })()}
          </motion.div>
        </Reveal>
      </div>
    </LiquidShell>
  );
}
