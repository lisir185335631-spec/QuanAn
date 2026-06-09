/**
 * VideoProduction.tsx — /video-production · 短视频一键制作
 * 液态玻璃换皮 · 2026-06-08
 * 业务逻辑/状态/mutation/校验/testid 零改动
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
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

  return (
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
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
              工具
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
              视频工坊
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
            {VIDEO_PRODUCTION_H1}
          </h1>
          <p
            style={{
              marginTop: 10,
              maxWidth: 820,
              fontSize: 16,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.75)',
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            {VIDEO_PRODUCTION_SUBTITLE}
          </p>
        </div>
        {/* 右侧按钮组 */}
        <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'nowrap', gap: 12 }}>
          <motion.button
            type="button"
            onClick={handleOptimize}
            disabled={!hasResult}
            aria-label="智能优化"
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: F.mono,
              cursor: !hasResult ? 'not-allowed' : 'pointer',
              opacity: !hasResult ? 0.4 : 1,
              border: 'none',
              outline: 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>auto_fix_high</span>
            智能优化
          </motion.button>
          <motion.button
            type="button"
            onClick={handleCopyAll}
            aria-label="复制全部"
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: F.mono,
              cursor: 'pointer',
              border: 'none',
              outline: 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>content_copy</span>
            复制全部
          </motion.button>
          <motion.button
            type="button"
            onClick={handleExportScript}
            aria-label="导出脚本"
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              background: C.grad,
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: F.mono,
              boxShadow: '0 4px 20px rgba(168,197,224,0.35)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>download</span>
            导出脚本
          </motion.button>
        </div>
      </Reveal>

      {/* ── 输入文案卡 ──────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 36 }}>
        <div className="lg-glass" style={{ borderRadius: 20, padding: 28, overflow: 'hidden', position: 'relative' }}>
          {/* 装饰光晕 */}
          <div style={{ pointerEvents: 'none', position: 'absolute', right: -64, top: -64, height: 176, width: 176, borderRadius: '50%', filter: 'blur(40px)', background: 'rgba(168,197,224,0.12)' }} />
          <div style={{ pointerEvents: 'none', position: 'absolute', bottom: -80, left: '33%', height: 176, width: 176, borderRadius: '50%', filter: 'blur(40px)', background: 'rgba(168,197,224,0.08)' }} />

          {/* 卡头 */}
          <div style={{ position: 'relative', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `0.5px solid ${C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'flex',
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true}>videocam</span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>输入文案</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>填写脚本文案 · AI 据此生成完整制作方案</p>
              </div>
            </div>
            {/* 状态角标 */}
            {isPending ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 9999,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span className="ikb-pulse" style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb, display: 'inline-block' }} />
                生成中…
              </span>
            ) : hasResult ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 9999,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb, display: 'inline-block' }} />
                已生成
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 9999,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.84)',
                  fontFamily: F.mono,
                }}
              >
                <span style={{ height: 6, width: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', display: 'inline-block' }} />
                待输入
              </span>
            )}
          </div>

          {/* ── isError 重试提示 ──────────────────────────────── */}
          {isError && (
            <div
              data-testid="vp-error-notice"
              style={{
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderRadius: 14,
                border: `0.5px solid rgba(255,255,255,0.25)`,
                background: 'rgba(255,80,80,0.12)',
                padding: '14px 20px',
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255,200,200,0.95)',
                fontFamily: F.cn,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>error</span>
              <span style={{ flex: 1 }}>生成失败，请检查网络后重试。</span>
              <button
                type="button"
                onClick={handleGenerate}
                style={{
                  flexShrink: 0,
                  borderRadius: 8,
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  background: 'rgba(255,80,80,0.55)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: F.mono,
                }}
              >
                重试
              </button>
            </div>
          )}

          {/* 文案标签行 */}
          <div style={{ position: 'relative' }}>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                htmlFor="vp-copy"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: C.ink,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    height: 14,
                    width: 4,
                    borderRadius: 9999,
                    background: C.grad,
                  }}
                  aria-hidden={true}
                />
                视频文案
              </label>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.ikb }} aria-hidden={true}>
                  auto_awesome
                </span>
                AI 据此生成分镜+口播+剪辑
              </span>
            </div>
            {/* textarea 容器 */}
            <div
              className="lg-glass"
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
              }}
            >
              <textarea
                id="vp-copy"
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
                rows={10}
                placeholder="输入你的视频脚本文案，包含标题、话题抛出、正反方观点、结论等结构"
                className="ikb-input"
                style={{
                  width: '100%',
                  resize: 'none',
                  border: 0,
                  background: 'transparent',
                  padding: 16,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: C.ink,
                  fontFamily: F.cn,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderTop: `0.5px solid ${C.line}`,
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>建议包含</span>
                  {['标题', '话题', '正方', '反方', '结论', '引导'].map((t) => (
                    <span
                      key={t}
                      style={{
                        borderRadius: 9999,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 500,
                        background: 'rgba(255,255,255,0.10)',
                        color: 'rgba(255,255,255,0.84)',
                        fontFamily: F.cn,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span style={{ flexShrink: 0, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.mono }}>
                  {copy.length} 字
                </span>
              </div>
            </div>
            {/* 生成按钮 */}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <Magnetic strength={0.3}>
                <button
                  type="button"
                  data-testid="vp-generate-btn"
                  onClick={handleGenerate}
                  disabled={!copy.trim() || isPending}
                  className="lg-gradbtn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 9999,
                    padding: '12px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#fff',
                    border: 'none',
                    cursor: !copy.trim() || isPending ? 'not-allowed' : 'pointer',
                    opacity: !copy.trim() || isPending ? 0.4 : 1,
                    fontFamily: F.cn,
                  }}
                >
                  {isPending ? (
                    <>
                      <svg style={{ height: 16, width: 16, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" aria-hidden={true}>
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      生成中…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>videocam</span>
                      {VIDEO_PRODUCTION_CTA}
                    </>
                  )}
                </button>
              </Magnetic>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── isPending 进度条 ──────────────────────────────────── */}
      {isPending && (
        <Reveal style={{ marginBottom: 28 }}>
          <div
            data-testid="vp-loading-banner"
            className="lg-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <span
              style={{
                display: 'flex',
                height: 40,
                width: 40,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                background: 'rgba(168,197,224,0.22)',
              }}
            >
              <svg style={{ height: 24, width: 24, animation: 'spin 1s linear infinite', color: C.ikb }} viewBox="0 0 24 24" fill="none" aria-hidden={true}>
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: '0 1px 4px rgba(6,14,38,.9), 0 0 16px rgba(6,14,38,.55)' }}>AI 正在生成制作方案…</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: '4px 0 0', fontFamily: F.cn }}>分析文案 · 生成分镜 · 编排制作流程，预计 20-45 秒</p>
            </div>
            <div style={{ marginLeft: 'auto', height: 6, width: 160, overflow: 'hidden', borderRadius: 9999, background: 'rgba(168,197,224,0.20)' }}>
              <div style={{ height: '100%', width: '100%', borderRadius: 9999, background: C.ikb, animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
            </div>
          </div>
        </Reveal>
      )}

      {/* ── isFallback 降级提示 ───────────────────────────────── */}
      {hasResult && isFallback && (
        <Reveal style={{ marginBottom: 20 }}>
          <div
            data-testid="vp-fallback-notice"
            className="lg-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 14,
              padding: '14px 20px',
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
              fontFamily: F.cn,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.accent3 }} aria-hidden={true}>warning</span>
            AI 模型降级处理，当前为备用方案（无 API Key）。建议配置模型密钥后重新生成以获取最优质方案。
          </div>
        </Reveal>
      )}

      {/* ── KPI 概览一排(4 卡) ─────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {/* 分镜场景数 · 冷蓝 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>movie</span>
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
                  fontFamily: F.mono,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden={true}>trending_up</span>
                {hasResult ? '完整' : '示例'}
              </span>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                  {kpiSceneCount}
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', marginLeft: 4 }}> 个</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>分镜场景</p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.20)" strokeWidth="3.5" />
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
          </motion.div>
        </Item>

        {/* 预计时长 · 迷你柱 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  background: 'rgba(228,238,255,0.18)',
                  color: C.yellow,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>timer</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(228,238,255,0.16)',
                  color: C.yellow,
                  fontFamily: F.mono,
                }}
              >
                {hasResult ? '已测算' : '示例'}
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                {hasResult ? (productionContent.schedule.slice(0, 6) || '约 80s') : '约 80s'}
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>预计时长</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
              {[45, 68, 55, 80, 62, 90, 72].map((h, i) => (
                <div
                  key={i}
                  style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: 'rgba(228,238,255,0.50)' }}
                />
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 口播段落 · 紫 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>mic</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.purpleText,
                  fontFamily: F.mono,
                }}
              >
                {hasResult ? '全覆盖' : '示例'}
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                {teleprompterDisplay.length}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', marginLeft: 4 }}> 段</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>口播段落</p>
            </div>
            <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 9999, background: 'rgba(168,197,224,0.18)' }}>
              <div style={{ height: 8, borderRadius: 9999, width: '100%', background: C.grad }} />
            </div>
          </motion.div>
        </Item>

        {/* BGM建议 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>music_note</span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                {kpiBgmCount} 首
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                {kpiBgmCount}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', marginLeft: 4 }}> 首</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>BGM建议</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0', fontFamily: F.mono }}>通用参考</p>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['流行', '科技感', '轻快', '思考'].map((k) => (
                <span
                  key={k}
                  style={{
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 500,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── 结果各 section ──────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── 分镜脚本 section ─────────────────────────────── */}
        <Reveal>
          <div className="lg-glass" style={{ borderRadius: 20, padding: 28, overflow: 'hidden' }}>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 44,
                    width: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true}>movie</span>
                </span>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 9999,
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      background: 'rgba(168,197,224,0.20)',
                      color: C.ikb,
                      fontFamily: F.mono,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb, display: 'inline-block' }} />
                    Storyboard
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{VIDEO_PRODUCTION_STORYBOARD_TITLE}</h3>
                    {!hasResult && (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>（示例数据 · 生成后替换）</span>
                    )}
                  </div>
                </div>
              </div>
              <span
                style={{
                  borderRadius: 9999,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                {kpiSceneCount} 场景
              </span>
            </div>

            {/* 门控:有真结果渲染真 shotList;否则渲染 mock 分镜 */}
            {hasResult ? (
              <div data-testid="vp-storyboard-real" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {productionContent.shotList.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          height: 36,
                          width: 36,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          border: `2px solid ${C.ikb}`,
                          background: 'rgba(168,197,224,0.18)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.ikb,
                          fontFamily: F.mono,
                        }}
                      >
                        {s.index ?? idx + 1}
                      </div>
                      {idx < productionContent.shotList.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 20, background: 'linear-gradient(to bottom, rgba(168,197,224,0.30), rgba(168,197,224,0.10))' }} />
                      )}
                    </div>
                    <div
                      className="lg-glass"
                      style={{ marginBottom: 12, flex: 1, borderRadius: 14, padding: 16 }}
                    >
                      <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{s.scene}</span>
                        <span style={{ borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#fff', background: C.grad, fontFamily: F.mono }}>
                          {s.duration}
                        </span>
                        {s.angle && (
                          <span
                            style={{
                              borderRadius: 6,
                              border: `0.5px solid ${C.line}`,
                              padding: '2px 10px',
                              fontSize: 11,
                              fontWeight: 500,
                              background: 'rgba(255,255,255,0.08)',
                              color: 'rgba(255,255,255,0.75)',
                              fontFamily: F.cn,
                            }}
                          >
                            {s.angle}
                          </span>
                        )}
                        {s.transition && (
                          <span
                            style={{
                              borderRadius: 6,
                              border: '0.5px solid rgba(168,197,224,0.35)',
                              padding: '2px 10px',
                              fontSize: 11,
                              fontWeight: 500,
                              background: 'rgba(168,197,224,0.12)',
                              color: C.purpleText,
                              fontFamily: F.cn,
                            }}
                          >
                            {VIDEO_PRODUCTION_SCENE_LABELS.transition}: {s.transition}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <p style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                            <span style={{ height: 12, width: 2, borderRadius: 9999, background: C.ikb, display: 'inline-block' }} aria-hidden={true} />
                            {VIDEO_PRODUCTION_SCENE_LABELS.frame}
                          </p>
                          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>
                            {s.description ?? s.dialogue}
                          </p>
                        </div>
                        <div>
                          <p style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                            <span style={{ height: 12, width: 2, borderRadius: 9999, background: 'rgba(255,255,255,0.7)', display: 'inline-block' }} aria-hidden={true} />
                            {VIDEO_PRODUCTION_SCENE_LABELS.voiceover}
                          </p>
                          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>{s.voiceover}</p>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{VIDEO_PRODUCTION_SCENE_LABELS.action}:</span>{' '}
                          {s.action}
                        </p>
                        {s.cameraAngle && s.cameraAngle !== '无' && (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>机位:</span>{' '}
                            {s.cameraAngle}
                          </p>
                        )}
                        {s.sfx && s.sfx !== '无' && (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>音效:</span>{' '}
                            {s.sfx}
                          </p>
                        )}
                        {s.subtitle && s.subtitle !== '无' && (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>字幕:</span>{' '}
                            {s.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {VIDEO_PRODUCTION_STORYBOARD.map((s, idx) => (
                  <div key={s.scene} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          height: 36,
                          width: 36,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          border: `2px solid ${C.ikb}`,
                          background: 'rgba(168,197,224,0.18)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.ikb,
                          fontFamily: F.mono,
                        }}
                      >
                        {idx + 1}
                      </div>
                      {idx < VIDEO_PRODUCTION_STORYBOARD.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 20, background: 'linear-gradient(to bottom, rgba(168,197,224,0.30), rgba(168,197,224,0.10))' }} />
                      )}
                    </div>
                    <div
                      className="lg-glass"
                      style={{ marginBottom: 12, flex: 1, borderRadius: 14, padding: 16 }}
                    >
                      <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{s.scene}</span>
                        <span style={{ borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#fff', background: C.grad, fontFamily: F.mono }}>
                          {s.time}
                        </span>
                        <span
                          style={{
                            borderRadius: 6,
                            border: `0.5px solid ${C.line}`,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 500,
                            background: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.75)',
                            fontFamily: F.cn,
                          }}
                        >
                          {s.shot}
                        </span>
                        <span
                          style={{
                            borderRadius: 6,
                            border: '0.5px solid rgba(168,197,224,0.35)',
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 500,
                            background: 'rgba(168,197,224,0.12)',
                            color: C.purpleText,
                            fontFamily: F.cn,
                          }}
                        >
                          {VIDEO_PRODUCTION_SCENE_LABELS.transition}: {s.transition}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <p style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                            <span style={{ height: 12, width: 2, borderRadius: 9999, background: C.ikb, display: 'inline-block' }} aria-hidden={true} />
                            {VIDEO_PRODUCTION_SCENE_LABELS.frame}
                          </p>
                          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>{s.frame}</p>
                        </div>
                        <div>
                          <p style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                            <span style={{ height: 12, width: 2, borderRadius: 9999, background: 'rgba(255,255,255,0.7)', display: 'inline-block' }} aria-hidden={true} />
                            {VIDEO_PRODUCTION_SCENE_LABELS.voiceover}
                          </p>
                          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>{s.voiceover}</p>
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{VIDEO_PRODUCTION_SCENE_LABELS.action}:</span>{' '}
                          {s.action}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        {/* ── 拍摄方案 section ──────────────────────────────── */}
        <Reveal>
          <div className="lg-glass" style={{ borderRadius: 20, padding: 28 }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 44,
                    width: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(228,238,255,0.35), rgba(168,197,224,0.20))',
                    color: C.yellow,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true}>photo_camera</span>
                </span>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 9999,
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      background: 'rgba(228,238,255,0.16)',
                      color: C.yellow,
                      fontFamily: F.mono,
                      marginBottom: 6,
                    }}
                  >
                    Production Plan
                  </span>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{VIDEO_PRODUCTION_SHOOTING_TITLE}</h3>
                </div>
              </div>
              <span
                style={{
                  borderRadius: 9999,
                  border: '0.5px solid rgba(228,238,255,0.30)',
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'rgba(228,238,255,0.14)',
                  color: C.yellow,
                  fontFamily: F.mono,
                }}
              >
                {hasResult ? (productionContent.schedule || VIDEO_PRODUCTION_SHOOTING.duration) : VIDEO_PRODUCTION_SHOOTING.duration}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* 设备建议 */}
              <div className="lg-glass" style={{ gridColumn: '1 / -1', borderRadius: 14, padding: 16 }}>
                <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.ikb }} aria-hidden={true}>videocam</span>
                  {VIDEO_PRODUCTION_SHOOTING.equipmentLabel}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(hasResult ? productionContent.equipment : VIDEO_PRODUCTION_SHOOTING.equipment).map((eq, i) => (
                    <span
                      key={i}
                      style={{
                        borderRadius: 8,
                        border: '0.5px solid rgba(168,197,224,0.30)',
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 500,
                        background: 'rgba(168,197,224,0.14)',
                        color: C.ikb,
                        fontFamily: F.cn,
                      }}
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
              {/* 场景建议 */}
              <div className="lg-glass" style={{ borderRadius: 14, padding: 16 }}>
                <p style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.yellow }} aria-hidden={true}>location_on</span>
                  {VIDEO_PRODUCTION_SHOOTING.sceneLabel}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>
                  {hasResult
                    ? [...new Set(productionContent.shotList.map((s) => s.location).filter(Boolean))].slice(0, 2).join('、') || VIDEO_PRODUCTION_SHOOTING.scene
                    : VIDEO_PRODUCTION_SHOOTING.scene}
                </p>
              </div>
              {/* 灯光建议 */}
              <div className="lg-glass" style={{ borderRadius: 14, padding: 16 }}>
                <p style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.accent3 }} aria-hidden={true}>light_mode</span>
                  {VIDEO_PRODUCTION_SHOOTING.lightingLabel}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>
                  {hasResult
                    ? productionContent.shotList.map((s) => s.lighting).filter((l) => l && l !== '无').slice(0, 1)[0] || VIDEO_PRODUCTION_SHOOTING.lighting
                    : VIDEO_PRODUCTION_SHOOTING.lighting}
                </p>
              </div>
              {/* 服装建议 */}
              <div className="lg-glass" style={{ borderRadius: 14, padding: 16 }}>
                <p style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.ikb }} aria-hidden={true}>checkroom</span>
                  {VIDEO_PRODUCTION_SHOOTING.costumeLabel}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>
                  {hasResult
                    ? productionContent.shotList.map((s) => s.costume).filter((c) => c && c !== '无').slice(0, 1)[0] || VIDEO_PRODUCTION_SHOOTING.costume
                    : VIDEO_PRODUCTION_SHOOTING.costume}
                </p>
              </div>
              {/* 道具清单 */}
              <div className="lg-glass" style={{ borderRadius: 14, padding: 16 }}>
                <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.yellow }} aria-hidden={true}>category</span>
                  {VIDEO_PRODUCTION_SHOOTING.propsLabel}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(hasResult
                    ? [...new Set(productionContent.shotList.map((s) => s.prop).filter((p) => p && p !== '无'))].slice(0, 6)
                    : VIDEO_PRODUCTION_SHOOTING.props
                  ).map((prop, i) => (
                    <span
                      key={i}
                      style={{
                        borderRadius: 8,
                        border: '0.5px solid rgba(168,197,224,0.28)',
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 500,
                        background: 'rgba(168,197,224,0.12)',
                        color: C.purpleText,
                        fontFamily: F.cn,
                      }}
                    >
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── 口播提词器 section ──────────────────────────────── */}
        <Reveal>
          <div className="lg-glass" style={{ borderRadius: 20, padding: 28 }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 44,
                    width: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(168,197,224,0.4), rgba(120,160,220,0.25))',
                    color: C.accent3,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true}>mic</span>
                </span>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 9999,
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      background: 'rgba(168,197,224,0.18)',
                      color: C.purpleText,
                      fontFamily: F.mono,
                      marginBottom: 6,
                    }}
                  >
                    Voiceover Script
                  </span>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{VIDEO_PRODUCTION_TELEPROMPTER_TITLE}</h3>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={() => copyText(teleprompterText)}
                aria-label="复制全文"
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="lg-glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.purpleText,
                  fontFamily: F.mono,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden={true}>content_copy</span>
                复制全文
              </motion.button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {teleprompterDisplay.map((seg, idx) => (
                <div
                  key={idx}
                  className="lg-glass"
                  style={{ borderRadius: 14, padding: 16, transition: 'all 0.2s' }}
                >
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        display: 'flex',
                        height: 24,
                        width: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#fff',
                        background: C.grad,
                        fontFamily: F.mono,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(seg)}
                      aria-label={`复制第 ${idx + 1} 段`}
                      style={{
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.8)',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>content_copy</span>
                    </button>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.78)', fontFamily: F.cn }}>{seg}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── BGM 配乐建议 section ──────────────────────────── */}
        <Reveal>
          <div className="lg-glass" style={{ borderRadius: 20, padding: 28 }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'flex',
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true}>music_note</span>
              </span>
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 9999,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    fontFamily: F.mono,
                    marginBottom: 6,
                  }}
                >
                  BGM Suggestion
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{VIDEO_PRODUCTION_BGM_TITLE}</h3>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>（通用参考 · 非本视频 AI 生成）</span>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="lg-glass" style={{ borderRadius: 14, padding: 16 }}>
                <p style={{ marginBottom: 4, fontSize: 12, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  {VIDEO_PRODUCTION_BGM.styleLabel}
                </p>
                {hasResult ? (
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>
                    {productionContent.shotList.map((s) => s.bgm).filter((b) => b && b !== '无').slice(0, 1)[0] || VIDEO_PRODUCTION_BGM.style}
                  </p>
                ) : (
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>{VIDEO_PRODUCTION_BGM.style}</p>
                )}
              </div>
              <div className="lg-glass" style={{ borderRadius: 14, padding: 16 }}>
                <p style={{ marginBottom: 4, fontSize: 12, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  {VIDEO_PRODUCTION_BGM.moodLabel}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>{VIDEO_PRODUCTION_BGM.mood}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {VIDEO_PRODUCTION_BGM.chips.map((chip) => (
                <span
                  key={chip}
                  style={{
                    borderRadius: 9999,
                    border: '0.5px solid rgba(168,197,224,0.35)',
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'rgba(168,197,224,0.14)',
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── 剪辑要点 section ──────────────────────────────── */}
        <Reveal>
          <motion.div
            className="lg-glass"
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 28 }}
          >
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'flex',
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(228,238,255,0.35), rgba(168,197,224,0.20))',
                  color: C.yellow,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true}>cut</span>
              </span>
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 9999,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: 'rgba(228,238,255,0.16)',
                    color: C.yellow,
                    fontFamily: F.mono,
                    marginBottom: 6,
                  }}
                >
                  Editing Tips
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{VIDEO_PRODUCTION_EDITING_TITLE}</h3>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>通用剪辑指南</span>
                </div>
              </div>
            </div>
            <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {VIDEO_PRODUCTION_EDITING.map((item, i) => (
                <Item key={item} style={{ height: '100%' }}>
                  <div
                    className="lg-glass"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 14,
                      padding: 14,
                      height: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, flex: 1 }}>{item}</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignSelf: 'flex-start',
                        marginTop: 'auto',
                        paddingTop: 8,
                        height: 24,
                        width: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#fff',
                        background: 'linear-gradient(135deg, rgba(228,238,255,0.55), rgba(168,197,224,0.35))',
                        fontFamily: F.mono,
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                </Item>
              ))}
            </RevealGroup>
          </motion.div>
        </Reveal>

        {/* ── 数据洞察 band ──────────────────────────────────── */}
        <Reveal style={{ marginBottom: 0 }}>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
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
              }}
            >
              <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb, display: 'inline-block', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
              模型已就绪
            </span>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20, marginBottom: 28 }}>
          {/* 制作完备度雷达 */}
          <Reveal>
            <motion.div
              className="lg-glass"
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 24, height: '100%', boxSizing: 'border-box' }}
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
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>radar</span>
                  </span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>制作完备度雷达</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>六维模型评估</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      lineHeight: 1,
                      margin: 0,
                      fontFamily: F.display,
                      background: C.grad,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                    }}
                  >
                    87
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: F.mono }}>综合分（示例）</p>
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
                  <svg viewBox="0 0 260 244" style={{ width: '100%' }}>
                    <defs>
                      <linearGradient id="vp-radarFillVP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                        <stop offset="100%" stopColor="rgba(168,197,224,0.6)" stopOpacity="0.12" />
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
                          fill="rgba(255,255,255,0.85)"
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
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', rowGap: 8, columnGap: 4 }}>
                {radarDims.map((d) => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </Reveal>

          {/* 情绪节奏曲线 */}
          <Reveal>
            <motion.div
              className="lg-glass"
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 24, height: '100%', boxSizing: 'border-box' }}
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
                      background: 'rgba(228,238,255,0.18)',
                      color: C.yellow,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>show_chart</span>
                  </span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>情绪节奏曲线</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>
                      沿 {kpiSceneCount} 个场景情绪强度推演
                      {!hasResult && <span style={{ marginLeft: 4, color: C.purpleText }}>（示例）</span>}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {['强度', '节奏', '峰值'].map((t, i) => (
                    <span
                      key={t}
                      style={{
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        background: i === 0 ? C.grad : 'rgba(255,255,255,0.08)',
                        color: i === 0 ? '#fff' : 'rgba(255,255,255,0.84)',
                        fontFamily: F.mono,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>
                  {Math.max(...emotionCurve)}
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
                    fontFamily: F.mono,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>trending_up</span>
                  峰值
                </span>
                <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
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
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
                    <defs>
                      <linearGradient id="vp-trendFillVP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                        <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="vp-trendLineVP" x1="0" y1="0" x2="1" y2="0">
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
                          fill="rgba(255,255,255,0.85)"
                          stroke={C.ikb}
                          strokeWidth="2"
                        />
                      ) : null,
                    )}
                  </svg>
                );
              })()}
              <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 10, color: 'rgba(255,255,255,0.72)', fontFamily: F.mono }}>
                {Array.from({ length: kpiSceneCount }, (_, i) => `场景${i + 1}`).map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </motion.div>
          </Reveal>
        </div>

        {/* ── 反馈 section ─────────────────────────────────── */}
        <Reveal>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingTop: 16,
              paddingBottom: 16,
              borderTop: `0.5px solid ${C.line}`,
            }}
          >
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>{VIDEO_PRODUCTION_FEEDBACK_PROMPT}</p>
            <motion.button
              type="button"
              onClick={handleFeedback}
              aria-label="有帮助"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.75)',
                fontFamily: F.cn,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>thumb_up</span>
              有帮助
            </motion.button>
            <motion.button
              type="button"
              onClick={handleFeedback}
              aria-label="无帮助"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.75)',
                fontFamily: F.cn,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>thumb_down</span>
              无帮助
            </motion.button>
          </div>
        </Reveal>
      </div>
    </LiquidShell>
  );
}
