/**
 * AiVideo.tsx — /ai-video STORYBOARD 工具页 · IKB 红蓝紫渐变体系
 * IKBLayout 外壳 · inline IKB 卡 · 逻辑/testid 零改动
 * 2026-06-04
 */
import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
import {
  AI_VIDEO_ADVICE,
  AI_VIDEO_CHIP_SUBTITLE,
  AI_VIDEO_CHIP_TITLE,
  AI_VIDEO_CTA_TEXT,
  AI_VIDEO_DEFAULT_DEMO_SCRIPT,
  AI_VIDEO_EMPTY_BULLETS,
  AI_VIDEO_EMPTY_DESC,
  AI_VIDEO_EMPTY_H3,
  AI_VIDEO_LABEL_PLATFORM,
  AI_VIDEO_LABEL_TEXT,
  AI_VIDEO_LABEL_TYPE,
  AI_VIDEO_MOCK_SHOTS,
  AI_VIDEO_PLATFORMS,
  AI_VIDEO_RESTART_TEXT,
  AI_VIDEO_RESULT_SHOT_COUNT,
  AI_VIDEO_RESULT_TITLE,
  AI_VIDEO_RESULT_TOTAL_DURATION,
  AI_VIDEO_TIMELINE_SEGMENTS,
  AI_VIDEO_COPY_ALL_TEXT,
  AI_VIDEO_EXPORT_CSV_TEXT,
  SHOT_LABEL_ANGLE,
  SHOT_LABEL_MOVEMENT,
  SHOT_LABEL_EMOTION,
  SHOT_LABEL_TRANSITION,
  SHOT_LABEL_SCENE,
  SHOT_LABEL_DIALOGUE,
  SHOT_LABEL_ACTION,
} from '@/lib/constants/ai-video';
import { VIDEO_TYPES } from '@/lib/constants/video-types';

// ── 雷达六维数据 ──────────────────────────────────────────────────────────────
const RADAR_DIMS = [
  { label: '脚本质量', value: 90, color: C.ikb },
  { label: '分镜节奏', value: 85, color: C.burgundy },
  { label: '视觉表现', value: 88, color: C.accent3 },
  { label: '平台适配', value: 82, color: C.ikb },
  { label: '时长把控', value: 78, color: C.burgundy },
  { label: '转化引导', value: 92, color: C.accent3 },
];

// ── 情绪/节奏曲线(沿 10 镜头)───────────────────────────────────────────────
const EMOTION_CURVE = [40, 52, 70, 66, 58, 72, 80, 84, 88, 74];

// ── 平台品牌色(保留不变)─────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string, string> = {
  douyin: 'music_note',
  kuaishou: 'video_camera_back',
  xiaohongshu: 'menu_book',
  bilibili: 'tv',
  wechat_video: 'smart_display',
};
const PLATFORM_COLORS: Record<string, string> = {
  douyin: '#0ea5b7',
  kuaishou: '#ff6600',
  xiaohongshu: '#ff2442',
  bilibili: '#00aeec',
  wechat_video: '#07c160',
};

// ── InlinePlatformCard ────────────────────────────────────────────────────────
function InlinePlatformCard({
  platform,
  selected,
  onClick,
}: {
  platform: (typeof AI_VIDEO_PLATFORMS)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={`platform-card-${platform.key}`}
      className="ikb-card group relative flex items-center gap-3 overflow-hidden p-3.5 text-left transition-all ikb-focusring"
      style={{
        borderColor: selected ? C.ikb : C.line,
        background: selected ? `${C.ikb}08` : C.paper,
        borderRadius: 12,
        border: `1px solid ${selected ? C.ikb : C.line}`,
      }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
        style={{ backgroundColor: PLATFORM_COLORS[platform.key] ?? '#888' }}
      >
        <span className="material-symbols-outlined text-[22px]" aria-hidden={true}>
          {PLATFORM_ICONS[platform.key] ?? 'device_hub'}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-bold" style={{ color: C.ink }}>{platform.label}</span>
      </span>
      <span
        className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all"
        style={{
          background: selected ? C.ikb : C.paper,
          color: selected ? '#fff' : 'transparent',
          border: selected ? 'none' : `1px solid ${C.line}`,
        }}
      >
        <span className="material-symbols-outlined text-[12px]" aria-hidden={true}>
          check
        </span>
      </span>
    </button>
  );
}

// ── InlineVideoTypeCard ───────────────────────────────────────────────────────
function InlineVideoTypeCard({
  type,
  selected,
  onClick,
}: {
  type: (typeof VIDEO_TYPES)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={`video-type-card-${type.key}`}
      className="ikb-card relative flex flex-col items-start gap-1 p-4 text-left transition-all ikb-focusring"
      style={{
        borderRadius: 12,
        border: `1px solid ${selected ? C.ikb : C.line}`,
        background: selected ? `${C.ikb}08` : C.paper,
      }}
    >
      <span className="block text-[14px] font-bold" style={{ color: C.ink }}>{type.label}</span>
      <span className="text-[12px]" style={{ color: '#6b7280' }}>{type.desc}</span>
      <span
        className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all"
        style={{
          background: selected ? C.ikb : C.paper,
          color: selected ? '#fff' : 'transparent',
          border: selected ? 'none' : `1px solid ${C.line}`,
        }}
      >
        <span className="material-symbols-outlined text-[12px]" aria-hidden={true}>
          check
        </span>
      </span>
    </button>
  );
}

// ── InlineEmptyPlaceholderCard ────────────────────────────────────────────────
function InlineEmptyPlaceholderCard() {
  return (
    <div
      className="flex flex-col items-center p-12 text-center"
      style={{
        borderRadius: 12,
        border: `2px dashed ${C.line}`,
        background: C.base,
      }}
      data-testid="ai-video-empty-card"
    >
      <span className="material-symbols-outlined mb-6 text-[64px]" aria-hidden={true} style={{ color: '#6b7280' }}>
        clapperboard
      </span>
      <h3 className="mb-3 text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{AI_VIDEO_EMPTY_H3}</h3>
      <p className="mb-6 max-w-md text-[14px] leading-relaxed" style={{ color: '#6b7280', fontFamily: F.cn }}>{AI_VIDEO_EMPTY_DESC}</p>
      <ul className="flex flex-col gap-2 text-left">
        {AI_VIDEO_EMPTY_BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="material-symbols-outlined mt-0.5 text-[16px]" aria-hidden={true} style={{ color: C.ikb }}>
              chevron_right
            </span>
            <span className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── InlineResultTitleCard ─────────────────────────────────────────────────────
function InlineResultTitleCard({
  title,
  duration,
  shotCount,
  onCopy,
  onExport,
}: {
  title: string;
  duration: string;
  shotCount: string;
  onCopy: () => void;
  onExport: () => void;
}) {
  return (
    <div
      className="relative overflow-hidden p-6"
      style={{
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
      }}
      data-testid="result-title-card"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-2xl"
        style={{ background: `${C.ikb}12` }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg"
            style={{ background: C.grad }}
          >
            <span className="material-symbols-outlined text-white" aria-hidden={true}>
              movie
            </span>
          </div>
          <div>
            <span
              className="mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
              style={{ background: `${C.ikb}18`, color: C.ikb }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ikb }} />
              Storyboard
            </span>
            <h2 className="mb-2 text-[20px] font-bold" style={{ color: C.ink }}>{title}</h2>
            <div className="flex items-center gap-4 text-[13px]" style={{ color: '#6b7280' }}>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>
                  timer
                </span>
                {duration}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>
                  grid_view
                </span>
                {shotCount}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            data-testid="result-copy-btn"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ikb-focusring"
            style={{
              border: `1px solid ${C.line}`,
              color: C.ikb,
              background: C.paper,
            }}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>
              content_copy
            </span>
            {AI_VIDEO_COPY_ALL_TEXT}
          </button>
          <button
            type="button"
            onClick={onExport}
            data-testid="result-export-btn"
            className="ikb-gradbtn flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 ikb-focusring"
            style={{ background: C.grad }}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>
              download
            </span>
            {AI_VIDEO_EXPORT_CSV_TEXT}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── InlineTimelineBar ─────────────────────────────────────────────────────────
const OPACITY_MAP: Record<string, number> = {
  '3s': 0.5,
  '5s': 0.6,
  '10s': 0.75,
  '12s': 0.8,
  '15s': 1.0,
};

function InlineTimelineBar({ segments }: { segments: ReadonlyArray<string> }) {
  return (
    <div className="flex gap-1" data-testid="ai-video-timeline">
      {segments.map((seg, idx) => {
        const opacity = OPACITY_MAP[seg] ?? 0.7;
        return (
          <div
            key={idx}
            className="flex h-12 flex-1 items-center justify-center rounded-lg text-[11px] font-bold text-white"
            style={{ background: C.ikb, opacity }}
            data-testid={`timeline-seg-${idx + 1}`}
          >
            {seg}
          </div>
        );
      })}
    </div>
  );
}

// ── InlineAdviceCard ──────────────────────────────────────────────────────────
const ADVICE_ICONS: Record<string, string> = {
  shooting: 'videocam',
  editing: 'cut',
  music: 'music_note',
};
// 轮转三主色
const ADVICE_ACCENT: [string, string, string] = [C.ikb, C.burgundy, C.accent3];

function InlineAdviceCard({
  advice,
  index,
}: {
  advice: { id: string; label: string; content: string };
  index: number;
}) {
  const accent = ADVICE_ACCENT[index % 3] ?? C.ikb;
  return (
    <div
      className="flex items-start gap-4 rounded-xl p-4"
      style={{ border: `1px solid ${C.line}`, background: C.paper }}
      data-testid={`advice-card-${advice.id}`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${accent}18` }}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ color: accent }}
          aria-hidden={true}
        >
          {ADVICE_ICONS[advice.id] ?? 'lightbulb'}
        </span>
      </span>
      <p className="text-[14px] leading-relaxed" style={{ color: '#6b7280', fontFamily: F.cn }}>
        <span className="font-bold" style={{ color: C.ink }}>{advice.label}</span>
        {advice.content}
      </p>
    </div>
  );
}

// ── InlineShotCard(分镜时间线风格)────────────────────────────────────────────
function InlineShotCard({
  shot,
  isLast,
}: {
  shot: (typeof AI_VIDEO_MOCK_SHOTS)[number];
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-4" data-testid={`shot-card-${shot.num}`}>
      {/* 时间轴竖线 */}
      <div className="flex flex-col items-center">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold shadow-sm"
          style={{ border: `2px solid ${C.ikb}`, background: C.paper, color: C.ikb }}
        >
          {parseInt(shot.num, 10)}
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1"
            style={{
              background: `linear-gradient(to bottom, ${C.ikb}50, ${C.burgundy}30)`,
              minHeight: '20px',
            }}
          />
        )}
      </div>
      {/* カード */}
      <div
        className="mb-4 flex-1 p-5"
        style={{ borderRadius: 12, border: `1px solid ${C.line}`, background: C.paper }}
      >
        {/* ヘッダー: SHOT# + 秒 + 景别 chip */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-2.5 py-0.5 text-[11px] font-bold text-white"
            style={{ background: C.ikb }}
          >
            SHOT {shot.num}
          </span>
          <span
            className="flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-medium"
            style={{ border: `1px solid ${C.line}`, background: C.base, color: '#444653' }}
          >
            <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>
              timer
            </span>
            {shot.duration}
          </span>
          <span
            className="rounded-md px-2.5 py-0.5 text-[11px] font-medium"
            style={{ border: `1px solid ${C.ikb}40`, background: `${C.ikb}12`, color: C.ikb }}
          >
            {shot.framing}
          </span>
        </div>

        {/* 4 cell grid: 角度/运镜/情绪/转场 */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          {[
            { label: SHOT_LABEL_ANGLE, value: shot.angle },
            { label: SHOT_LABEL_MOVEMENT, value: shot.movement },
            { label: SHOT_LABEL_EMOTION, value: shot.emotion },
            { label: SHOT_LABEL_TRANSITION, value: shot.transition },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg p-2.5"
              style={{ border: `1px solid ${C.line}`, background: C.base }}
            >
              <p className="mb-1 text-[11px] font-bold" style={{ color: '#6b7280' }}>{label}</p>
              <p className="text-[12px] leading-snug" style={{ color: '#444653' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* 场景 + 台词/旁白 */}
        <div className="mb-3 grid grid-cols-2 gap-4">
          <div>
            <p
              className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold before:h-3 before:w-0.5 before:rounded-full before:content-['']"
              style={{ color: C.ink }}
            >
              <span
                className="before:h-3 before:w-0.5 before:rounded-full"
                style={{ borderLeft: `3px solid ${C.ikb}`, paddingLeft: 6 }}
              >
                {SHOT_LABEL_SCENE}
              </span>
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: '#444653' }}>{shot.scene}</p>
          </div>
          <div>
            <p
              className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold"
              style={{ color: C.ink }}
            >
              <span
                style={{ borderLeft: `3px solid ${C.burgundy}`, paddingLeft: 6 }}
              >
                {SHOT_LABEL_DIALOGUE}
              </span>
            </p>
            <div
              className="rounded-lg px-3 py-2 text-[13px] leading-relaxed"
              style={{ border: `1px solid ${C.line}`, background: C.base, color: '#444653' }}
            >
              {shot.dialogue}
            </div>
          </div>
        </div>

        {/* 动作指导 */}
        <div className="mb-3">
          <p
            className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold"
            style={{ color: C.ink }}
          >
            <span
              style={{ borderLeft: `3px solid ${C.accent3}`, paddingLeft: 6 }}
            >
              {SHOT_LABEL_ACTION}
            </span>
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#444653' }}>{shot.action}</p>
        </div>

        {/* 字幕/音乐/提示 chip */}
        <div className="flex flex-col gap-2">
          <div
            className="flex items-start gap-1.5 rounded-lg px-3 py-2"
            style={{ border: `1px solid ${C.line}`, background: C.base }}
            data-testid={`shot-chip-subtitle-${shot.num}`}
          >
            <span className="material-symbols-outlined mt-0.5 text-[14px]" aria-hidden={true} style={{ color: C.ikb }}>
              subtitles
            </span>
            <span className="text-[12px]" style={{ color: '#444653' }}>{shot.subtitle}</span>
          </div>
          {/* 音乐 chip — 用 accent3 紫点缀 */}
          <div
            className="flex items-start gap-1.5 rounded-lg px-3 py-2"
            style={{ border: `1px solid ${C.accent3}40`, background: `${C.accent3}0a` }}
            data-testid={`shot-chip-music-${shot.num}`}
          >
            <span className="material-symbols-outlined mt-0.5 text-[14px]" aria-hidden={true} style={{ color: C.accent3 }}>
              music_note
            </span>
            <span className="text-[12px]" style={{ color: '#444653' }}>{shot.music}</span>
          </div>
          {/* 拍摄提示 chip — 用 burgundy 暖点缀 */}
          <div
            className="flex items-start gap-1.5 rounded-lg px-3 py-2"
            style={{ border: `1px solid ${C.burgundy}30`, background: `${C.burgundy}08` }}
            data-testid={`shot-chip-tip-${shot.num}`}
          >
            <span className="material-symbols-outlined mt-0.5 text-[14px]" aria-hidden={true} style={{ color: C.burgundy }}>
              lightbulb
            </span>
            <span className="text-[12px]" style={{ color: '#444653' }}>{shot.tip}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiVideo() {
  const [text, setText] = useState(AI_VIDEO_DEFAULT_DEMO_SCRIPT);
  const [platform, setPlatform] = useState<string>('douyin');
  const [videoType, setVideoType] = useState<string>('monologue');
  const [isResultShown, setIsResultShown] = useState(false);

  const handleGenerate = () => setIsResultShown(true);
  const handleRestart = () => setIsResultShown(false);

  const selectedPlatformLabel =
    AI_VIDEO_PLATFORMS.find((p) => p.key === platform)?.label ?? platform;
  const selectedTypeLabel =
    VIDEO_TYPES.find((vt) => vt.key === videoType)?.label ?? videoType;

  return (
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded-lg px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ border: `1px solid ${C.line}`, background: C.base, color: C.ink, fontFamily: F.mono }}
            >
              智能引擎
            </span>
            <span
              className="rounded-lg px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ border: `1px solid ${C.ikb}40`, background: `${C.ikb}18`, color: C.ikb, fontFamily: F.mono }}
            >
              AI 视频
            </span>
          </div>
          <h1
            className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tighter"
            style={{ fontFamily: F.display }}
          >
            {AI_VIDEO_CHIP_TITLE}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>
            {AI_VIDEO_CHIP_SUBTITLE}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            aria-label="复制全部分镜"
            onClick={() => toast.success('已复制全部分镜')}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors ikb-focusring"
            style={{ border: `1px solid ${C.line}`, background: C.paper, color: C.ink, fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>
              content_copy
            </span>
            复制全部
          </button>
          <button
            type="button"
            aria-label="导出 CSV"
            onClick={() => toast.info('CSV 导出 · 即将上线')}
            className="ikb-gradbtn flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-md ikb-focusring"
            style={{ background: C.grad }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>
              download
            </span>
            导出方案
          </button>
        </div>
      </header>

      {/* ── 输入卡 ─────────────────────────────────────────── */}
      <section
        className="relative mb-12 overflow-hidden p-6"
        style={{
          borderRadius: 12,
          border: `1px solid ${C.line}`,
          background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
        }}
        data-testid="storyboard-chip"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl"
          style={{ background: `${C.ikb}0d` }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl"
          style={{ background: `${C.burgundy}0a` }}
        />

        {/* Section header */}
        <div
          className="relative mb-6 flex items-center justify-between pb-5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: C.grad }}
            >
              <span className="material-symbols-outlined" aria-hidden={true}>
                clapperboard
              </span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: C.ink }}>STORYBOARD</h2>
              <p className="text-[12px]" style={{ color: '#6b7280' }}>专业分镜表生成器 · 文案一键转拍摄方案</p>
            </div>
          </div>
          {/* 待生成状态 badge — 用 IKB 蓝替代绿 */}
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: `${C.ikb}14`, color: C.ikb }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ikb }} />
            待生成
          </span>
        </div>

        <div className="relative space-y-7">
          {/* 文案内容 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="ai-video-text"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="h-3.5 w-1 rounded-full"
                  style={{ background: C.grad, display: 'inline-block', flexShrink: 0 }}
                />
                {AI_VIDEO_LABEL_TEXT}
              </label>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280' }}>
                <span className="material-symbols-outlined text-[14px]" aria-hidden={true} style={{ color: C.burgundy }}>
                  auto_awesome
                </span>
                AI 据此生成分镜+拍摄方案
              </span>
            </div>
            <div
              className="overflow-hidden rounded-xl transition-all focus-within:ring-2"
              style={{
                border: `1px solid ${C.line}`,
                background: C.base,
              }}
            >
              <textarea
                id="ai-video-text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 5000))}
                maxLength={5000}
                rows={10}
                placeholder="输入你的短视频文案，包含标题、话题、正反方观点、结论等结构"
                className="ikb-input w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed"
                style={{ fontFamily: F.cn, color: C.ink }}
                data-testid="ai-video-textarea"
              />
              <div
                className="flex items-center justify-between gap-3 px-4 py-2.5"
                style={{ borderTop: `1px solid ${C.line}`, background: 'rgba(255,255,255,0.6)' }}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px]" style={{ color: '#6b7280' }}>建议包含</span>
                  {['标题', '话题', '正方', '反方', '结论', '引导'].map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ background: C.base, color: '#6b7280', border: `1px solid ${C.line}` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span
                  className="shrink-0 text-[11px] tabular-nums"
                  style={{ color: '#6b7280' }}
                  data-testid="ai-video-char-count"
                >
                  {text.length}/5000
                </span>
              </div>
            </div>
          </div>

          {/* 发布平台 */}
          <div>
            <span
              id="aiv-platform-label"
              className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
              style={{ color: C.ink, fontFamily: F.cn }}
            >
              <span
                className="h-3.5 w-1 rounded-full"
                style={{ background: C.grad, display: 'inline-block', flexShrink: 0 }}
              />
              {AI_VIDEO_LABEL_PLATFORM}
            </span>
            <div role="group" aria-labelledby="aiv-platform-label" className="grid grid-cols-5 gap-3" data-testid="platform-grid">
              {AI_VIDEO_PLATFORMS.map((p) => (
                <InlinePlatformCard
                  key={p.key}
                  platform={p}
                  selected={p.key === platform}
                  onClick={() => setPlatform(p.key)}
                />
              ))}
            </div>
          </div>

          {/* 视频类型 */}
          <div>
            <span
              id="aiv-type-label"
              className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
              style={{ color: C.ink, fontFamily: F.cn }}
            >
              <span
                className="h-3.5 w-1 rounded-full"
                style={{ background: C.grad, display: 'inline-block', flexShrink: 0 }}
              />
              {AI_VIDEO_LABEL_TYPE}
            </span>
            <div role="group" aria-labelledby="aiv-type-label" className="grid grid-cols-3 gap-3" data-testid="video-type-grid">
              {VIDEO_TYPES.map((vt) => (
                <InlineVideoTypeCard
                  key={vt.key}
                  type={vt}
                  selected={vt.key === videoType}
                  onClick={() => setVideoType(vt.key)}
                />
              ))}
            </div>
          </div>

          {/* 主 CTA */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              data-testid="ai-video-cta"
              className="ikb-gradbtn flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 active:translate-x-px active:translate-y-px active:shadow-sm ikb-focusring"
              style={{ background: C.grad, fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>
                auto_awesome
              </span>
              {AI_VIDEO_CTA_TEXT}
            </button>
          </div>
        </div>
      </section>

      {/* ── 数据洞察(雷达 + 情绪曲线)─────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: C.ikb }}>
          insights
        </span>
        <h2 className="text-[16px] font-bold" style={{ color: C.ink }}>数据洞察</h2>
        <span className="text-[12px]" style={{ color: '#6b7280' }}>· AI 综合评估 · 实时测算</span>
        {/* 模型就绪 badge — 用 IKB 蓝替代亮绿 */}
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.ikb}14`, color: C.ikb }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: C.ikb }} />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 视频制作力雷达 */}
        <div
          className="col-span-5 p-6"
          style={{
            borderRadius: 12,
            border: `1px solid ${C.line}`,
            background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
          }}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.ikb}18`, color: C.ikb }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
                  radar
                </span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink }}>视频制作力雷达</h3>
                <p className="text-[11px]" style={{ color: '#6b7280' }}>六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none" style={{ color: C.ikb }}>86</p>
              <p className="text-[10px]" style={{ color: '#6b7280' }}>综合分</p>
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
              RADAR_DIMS.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = RADAR_DIMS.map((d, i) =>
              pt(i, R * (d.value / 100))
                .map((n) => n.toFixed(1))
                .join(','),
            ).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full">
                <defs>
                  <linearGradient id="aiv-radarFill" x1="0" y1="0" x2="0" y2="1">
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
                {RADAR_DIMS.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return (
                    <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />
                  );
                })}
                <polygon
                  points={dataPoly}
                  fill="url(#aiv-radarFill)"
                  stroke={C.ikb}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {RADAR_DIMS.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return (
                    <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />
                  );
                })}
                {RADAR_DIMS.map((d, i) => {
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
            {RADAR_DIMS.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px]" style={{ color: '#6b7280' }}>{d.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.ink }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 分镜情绪/节奏曲线 */}
        <div
          className="col-span-7 p-6"
          style={{
            borderRadius: 12,
            border: `1px solid ${C.line}`,
            background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
          }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.burgundy}18`, color: C.burgundy }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
                  show_chart
                </span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink }}>分镜情绪/节奏曲线</h3>
                <p className="text-[11px]" style={{ color: '#6b7280' }}>沿 10 个镜头情绪强度推演</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['强度', '节奏', '峰值'].map((t, i) => (
                <span
                  key={t}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                  style={
                    i === 0
                      ? { background: C.ikb, color: '#fff' }
                      : { background: C.base, color: '#6b7280' }
                  }
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none" style={{ color: C.ink }}>88</p>
            {/* 峰值 badge — 用 IKB 蓝替代亮绿 */}
            <span
              className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold"
              style={{ background: `${C.ikb}14`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>
                trending_up
              </span>
              峰值
            </span>
            <span className="mb-1 text-[12px]" style={{ color: '#6b7280' }}>第9镜情绪最高点</span>
          </div>
          {(() => {
            const data = EMOTION_CURVE;
            const W = 560;
            const H = 168;
            const padL = 6;
            const padR = 6;
            const padT = 12;
            const padB = 8;
            const innerW = W - padL - padR;
            const innerH = H - padT - padB;
            const max = 100;
            const denom = Math.max(data.length - 1, 1);
            const x = (i: number) => padL + (innerW * i) / denom;
            const y = (v: number) => padT + innerH * (1 - v / max);
            const line = data
              .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
              .join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                <defs>
                  <linearGradient id="aiv-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="aiv-trendLine" x1="0" y1="0" x2="1" y2="0">
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
                    stroke="#f1f3f9"
                    strokeWidth="1"
                  />
                ))}
                <path d={area} fill="url(#aiv-trendFill)" />
                <path
                  d={line}
                  fill="none"
                  stroke="url(#aiv-trendLine)"
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
          <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280' }}>
            {Array.from({ length: 10 }, (_, i) => `镜头${i + 1}`).map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 分镜数 · 环形进度 */}
        <div
          className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{
            borderRadius: 12,
            border: `1px solid ${C.ikb}30`,
            background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}18`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
                movie
              </span>
            </span>
            {/* 完整 badge — 用 IKB 蓝 */}
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}14`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>
                trending_up
              </span>
              完整
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink }}>
                {AI_VIDEO_MOCK_SHOTS.length}
                <span className="text-[15px]" style={{ color: '#6b7280' }}> 个</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280' }}>分镜数</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={C.ikb}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(100, AI_VIDEO_MOCK_SHOTS.length * 10)} 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 总时长 · 迷你柱 */}
        <div
          className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderRadius: 12, border: `1px solid ${C.line}`, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.burgundy}18`, color: C.burgundy }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
                timer
              </span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.burgundy}14`, color: C.burgundy }}
            >
              已测算
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[22px] font-bold leading-none" style={{ color: C.ink }}>
              {AI_VIDEO_RESULT_TOTAL_DURATION}
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280' }}>总时长</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[45, 68, 55, 80, 62, 90, 72].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${h}%`, background: `${C.burgundy}b0` }}
              />
            ))}
          </div>
        </div>

        {/* 目标平台 · 进度条 */}
        <div
          className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderRadius: 12, border: `1px solid ${C.line}`, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.accent3}18`, color: C.accent3 }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
                hub
              </span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.accent3}18`, color: C.purpleText }}
            >
              已选
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[20px] font-bold leading-none" style={{ color: C.ink }}>
              {selectedPlatformLabel}
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280' }}>目标平台</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}20` }}>
            <div
              className="h-2 w-full rounded-full"
              style={{ background: `linear-gradient(to right, ${C.accent3}, ${C.ikb})` }}
            />
          </div>
        </div>

        {/* 视频类型 · 关键词 chip */}
        <div
          className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderRadius: 12, border: `1px solid ${C.line}`, background: C.paper }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}18`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
                video_library
              </span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}14`, color: C.ikb }}
            >
              {VIDEO_TYPES.length} 种
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[20px] font-bold leading-none" style={{ color: C.ink }}>
              {selectedTypeLabel}
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280' }}>视频类型</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['口播', '剧情', 'Vlog'].map((k) => (
              <span
                key={k}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: `${C.ikb}14`, color: C.ikb }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Empty 态 · isResultShown=false ─────────────────── */}
      {!isResultShown && <InlineEmptyPlaceholderCard />}

      {/* ── Result 态 · isResultShown=true ─────────────────── */}
      {isResultShown && (
        <div className="space-y-6">
          {/* 清空按钮 */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleRestart}
              data-testid="ai-video-restart"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ikb-focusring"
              style={{
                border: `1px solid ${C.line}`,
                color: '#6b7280',
                background: C.paper,
              }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>
                delete
              </span>
              {AI_VIDEO_RESTART_TEXT}
            </button>
          </div>

          {/* 标题卡 */}
          <InlineResultTitleCard
            title={AI_VIDEO_RESULT_TITLE}
            duration={AI_VIDEO_RESULT_TOTAL_DURATION}
            shotCount={AI_VIDEO_RESULT_SHOT_COUNT}
            onCopy={() => toast.success('已复制全部')}
            onExport={() => toast.info('CSV 导出 · 即将上线')}
          />

          {/* 时间轴 */}
          <InlineTimelineBar segments={AI_VIDEO_TIMELINE_SEGMENTS} />

          {/* 3 段建议 */}
          <div className="flex flex-col gap-3">
            {AI_VIDEO_ADVICE.map((a, i) => (
              <InlineAdviceCard key={a.id} advice={a} index={i} />
            ))}
          </div>

          {/* 10 SHOT 分镜时间线 */}
          <div
            className="p-6"
            style={{
              borderRadius: 12,
              border: `1px solid ${C.line}`,
              background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
                  style={{ background: C.grad }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true}>
                    movie
                  </span>
                </span>
                <div>
                  <span
                    className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: `${C.ikb}18`, color: C.ikb }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ikb }} />
                    Storyboard
                  </span>
                  <h3 className="text-[20px] font-bold" style={{ color: C.ink }}>分镜脚本</h3>
                </div>
              </div>
              <span
                className="rounded-full px-3 py-1 text-[12px] font-bold"
                style={{ background: `${C.ikb}14`, color: C.ikb }}
              >
                {AI_VIDEO_MOCK_SHOTS.length} 镜头
              </span>
            </div>
            <div className="space-y-0">
              {AI_VIDEO_MOCK_SHOTS.map((shot, idx) => (
                <InlineShotCard
                  key={shot.num}
                  shot={shot}
                  isLast={idx === AI_VIDEO_MOCK_SHOTS.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </IKBLayout>
  );
}
