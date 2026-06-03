/**
 * AiVideo.tsx — /ai-video STORYBOARD 工具页 · 先锋白重构
 * PioneerLayout 外壳 · inline 先锋白软卡 · 逻辑/testid 零改动
 * 2026-06-02
 */
import { useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
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
  { label: '脚本质量', value: 90, color: '#002fa7' },
  { label: '分镜节奏', value: 85, color: '#781621' },
  { label: '视觉表现', value: 88, color: '#F6D300' },
  { label: '平台适配', value: 82, color: '#002fa7' },
  { label: '时长把控', value: 78, color: '#781621' },
  { label: '转化引导', value: 92, color: '#F6D300' },
];

// ── 情绪/节奏曲线(沿 10 镜头)───────────────────────────────────────────────
const EMOTION_CURVE = [40, 52, 70, 66, 58, 72, 80, 84, 88, 74];

// ── inline 先锋白 · PlatformCard ─────────────────────────────────────────────
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
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all ${
        selected
          ? 'border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm'
          : 'border-[#e5e7eb] bg-white hover:border-[#c7d2fe] hover:bg-[#f8faff]'
      }`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
        style={{ backgroundColor: PLATFORM_COLORS[platform.key] ?? '#888' }}
      >
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
          {PLATFORM_ICONS[platform.key] ?? 'device_hub'}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-bold text-[#111827]">{platform.label}</span>
      </span>
      <span
        className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all ${
          selected ? 'bg-[#002fa7] text-white' : 'border border-[#e5e7eb] bg-white text-transparent'
        }`}
      >
        <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
          check
        </span>
      </span>
    </button>
  );
}

// ── inline 先锋白 · VideoTypeCard ─────────────────────────────────────────────
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
      className={`relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
        selected
          ? 'border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm'
          : 'border-[#e5e7eb] bg-white hover:border-[#c7d2fe] hover:bg-[#f8faff]'
      }`}
    >
      <span className="block text-[14px] font-bold text-[#111827]">{type.label}</span>
      <span className="text-[12px] text-[#6b7280]">{type.desc}</span>
      <span
        className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all ${
          selected ? 'bg-[#002fa7] text-white' : 'border border-[#e5e7eb] bg-white text-transparent'
        }`}
      >
        <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
          check
        </span>
      </span>
    </button>
  );
}

// ── inline 先锋白 · EmptyPlaceholderCard ─────────────────────────────────────
function InlineEmptyPlaceholderCard() {
  return (
    <div
      className="flex flex-col items-center rounded-xl border-2 border-dashed border-[#e5e7eb] bg-white p-12 text-center"
      data-testid="ai-video-empty-card"
    >
      <span className="material-symbols-outlined mb-6 text-[64px] text-[#9ca3af]" aria-hidden="true">
        clapperboard
      </span>
      <h3 className="mb-3 text-[18px] font-bold text-[#111827]">{AI_VIDEO_EMPTY_H3}</h3>
      <p className="mb-6 max-w-md text-[14px] leading-relaxed text-[#6b7280]">{AI_VIDEO_EMPTY_DESC}</p>
      <ul className="flex flex-col gap-2 text-left">
        {AI_VIDEO_EMPTY_BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="material-symbols-outlined mt-0.5 text-[16px] text-[#002fa7]" aria-hidden="true">
              chevron_right
            </span>
            <span className="text-[13px] text-[#6b7280]">{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── inline 先锋白 · ResultTitleCard ──────────────────────────────────────────
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
      className="relative overflow-hidden rounded-xl border border-[#dbe2ff] bg-gradient-to-br from-[#eff4ff] via-white to-[#f7f1ff] p-6 pw-shadow-soft"
      data-testid="result-title-card"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#002fa7]/[0.07] blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] shadow-lg shadow-[#002fa7]/25">
            <span className="material-symbols-outlined text-white" aria-hidden="true">
              movie
            </span>
          </div>
          <div>
            <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#002fa7]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#002fa7]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#002fa7]" />
              Storyboard
            </span>
            <h2 className="mb-2 text-[20px] font-bold text-[#111827]">{title}</h2>
            <div className="flex items-center gap-4 text-[13px] text-[#6b7280]">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  timer
                </span>
                {duration}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
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
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-[13px] font-medium text-[#002fa7] transition-all hover:border-[#002fa7] hover:bg-[#eff4ff]"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              content_copy
            </span>
            {AI_VIDEO_COPY_ALL_TEXT}
          </button>
          <button
            type="button"
            onClick={onExport}
            data-testid="result-export-btn"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              download
            </span>
            {AI_VIDEO_EXPORT_CSV_TEXT}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── inline 先锋白 · TimelineBar ──────────────────────────────────────────────
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
            className="flex h-12 flex-1 items-center justify-center rounded-lg bg-[#002fa7] text-[11px] font-bold text-white"
            style={{ opacity }}
            data-testid={`timeline-seg-${idx + 1}`}
          >
            {seg}
          </div>
        );
      })}
    </div>
  );
}

// ── inline 先锋白 · AdviceCard ────────────────────────────────────────────────
const ADVICE_ICONS: Record<string, string> = {
  shooting: 'videocam',
  editing: 'cut',
  music: 'music_note',
};
const ADVICE_COLORS: Record<string, string> = {
  shooting: '#002fa7',
  editing: '#781621',
  music: '#8a6a00',
};
const ADVICE_BG: Record<string, string> = {
  shooting: 'bg-[#002fa7]/10',
  editing: 'bg-[#781621]/10',
  music: 'bg-[#F6D300]/20',
};

function InlineAdviceCard({
  advice,
}: {
  advice: { id: string; label: string; content: string };
}) {
  return (
    <div
      className="flex items-start gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 pw-shadow-soft"
      data-testid={`advice-card-${advice.id}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ADVICE_BG[advice.id] ?? 'bg-[#002fa7]/10'}`}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ color: ADVICE_COLORS[advice.id] ?? '#002fa7' }}
          aria-hidden="true"
        >
          {ADVICE_ICONS[advice.id] ?? 'lightbulb'}
        </span>
      </span>
      <p className="text-[14px] leading-relaxed text-[#6b7280]">
        <span className="font-bold text-[#111827]">{advice.label}</span>
        {advice.content}
      </p>
    </div>
  );
}

// ── inline 先锋白 · ShotCard(Step6 分镜时间线风格)────────────────────────────
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#002fa7] bg-white text-[13px] font-bold text-[#002fa7] shadow-sm">
          {parseInt(shot.num, 10)}
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 bg-gradient-to-b from-[#002fa7]/30 to-[#781621]/20"
            style={{ minHeight: '20px' }}
          />
        )}
      </div>
      {/* カード */}
      <div className="mb-4 flex-1 rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft">
        {/* ヘッダー: SHOT# + 秒 + 景别 chip */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#002fa7] px-2.5 py-0.5 text-[11px] font-bold text-white">
            SHOT {shot.num}
          </span>
          <span className="flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-0.5 text-[11px] font-medium text-[#444653]">
            <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
              timer
            </span>
            {shot.duration}
          </span>
          <span className="rounded-md border border-[#dbe2ff] bg-[#eff4ff] px-2.5 py-0.5 text-[11px] font-medium text-[#002fa7]">
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
            <div key={label} className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2.5">
              <p className="mb-1 text-[11px] font-bold text-[#9ca3af]">{label}</p>
              <p className="text-[12px] leading-snug text-[#444653]">{value}</p>
            </div>
          ))}
        </div>

        {/* 场景 + 台词/旁白 */}
        <div className="mb-3 grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold text-[#111827] before:h-3 before:w-0.5 before:rounded-full before:bg-[#002fa7] before:content-['']">
              {SHOT_LABEL_SCENE}
            </p>
            <p className="text-[13px] leading-relaxed text-[#444653]">{shot.scene}</p>
          </div>
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold text-[#111827] before:h-3 before:w-0.5 before:rounded-full before:bg-[#781621] before:content-['']">
              {SHOT_LABEL_DIALOGUE}
            </p>
            <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-[13px] leading-relaxed text-[#444653]">
              {shot.dialogue}
            </div>
          </div>
        </div>

        {/* 动作指导 */}
        <div className="mb-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold text-[#111827] before:h-3 before:w-0.5 before:rounded-full before:bg-[#F6D300] before:content-['']">
            {SHOT_LABEL_ACTION}
          </p>
          <p className="text-[13px] leading-relaxed text-[#444653]">{shot.action}</p>
        </div>

        {/* 字幕/音乐/提示 chip */}
        <div className="flex flex-col gap-2">
          <div
            className="flex items-start gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2"
            data-testid={`shot-chip-subtitle-${shot.num}`}
          >
            <span className="material-symbols-outlined mt-0.5 text-[14px] text-[#002fa7]" aria-hidden="true">
              subtitles
            </span>
            <span className="text-[12px] text-[#444653]">{shot.subtitle}</span>
          </div>
          <div
            className="flex items-start gap-1.5 rounded-lg border border-[#F3E08A] bg-[#fdf6cc] px-3 py-2"
            data-testid={`shot-chip-music-${shot.num}`}
          >
            <span className="material-symbols-outlined mt-0.5 text-[14px] text-[#8a6a00]" aria-hidden="true">
              music_note
            </span>
            <span className="text-[12px] text-[#444653]">{shot.music}</span>
          </div>
          <div
            className="flex items-start gap-1.5 rounded-lg border border-[#fde2e2] bg-[#fff5f5] px-3 py-2"
            data-testid={`shot-chip-tip-${shot.num}`}
          >
            <span className="material-symbols-outlined mt-0.5 text-[14px] text-[#781621]" aria-hidden="true">
              lightbulb
            </span>
            <span className="text-[12px] text-[#444653]">{shot.tip}</span>
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
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              智能引擎
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              AI 视频
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            {AI_VIDEO_CHIP_TITLE}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            {AI_VIDEO_CHIP_SUBTITLE}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            aria-label="复制全部分镜"
            onClick={() =>
              toast.success('已复制全部分镜')
            }
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              content_copy
            </span>
            复制全部
          </button>
          <button
            type="button"
            aria-label="导出 CSV"
            onClick={() => toast.info('CSV 导出 · 即将上线')}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              download
            </span>
            导出方案
          </button>
        </div>
      </header>

      {/* ── 输入卡 ─────────────────────────────────────────── */}
      <section
        className="relative mb-12 overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft"
        data-testid="storyboard-chip"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />

        {/* Section header */}
        <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined" aria-hidden="true">
                clapperboard
              </span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">STORYBOARD</h2>
              <p className="text-[12px] text-[#9ca3af]">专业分镜表生成器 · 文案一键转拍摄方案</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            待生成
          </span>
        </div>

        <div className="relative space-y-7">
          {/* 文案内容 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="ai-video-text"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                {AI_VIDEO_LABEL_TEXT}
              </label>
              <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                <span className="material-symbols-outlined text-[14px] text-[#781621]" aria-hidden="true">
                  auto_awesome
                </span>
                AI 据此生成分镜+拍摄方案
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
              <textarea
                id="ai-video-text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 5000))}
                maxLength={5000}
                rows={10}
                placeholder="输入你的短视频文案，包含标题、话题、正反方观点、结论等结构"
                className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                data-testid="ai-video-textarea"
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
                <span
                  className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]"
                  data-testid="ai-video-char-count"
                >
                  {text.length}/5000
                </span>
              </div>
            </div>
          </div>

          {/* 发布平台 */}
          <div>
            <span id="aiv-platform-label" className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
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
            <span id="aiv-type-label" className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
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
              className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                auto_awesome
              </span>
              {AI_VIDEO_CTA_TEXT}
            </button>
          </div>
        </div>
      </section>

      {/* ── 数据洞察(雷达 + 情绪曲线)─────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">
          insights
        </span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 实时测算</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 视频制作力雷达 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  radar
                </span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">视频制作力雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">86</p>
              <p className="text-[10px] text-[#9ca3af]">综合分</p>
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
                  <linearGradient id="radarFillAIV" x1="0" y1="0" x2="0" y2="1">
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
                {RADAR_DIMS.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return (
                    <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />
                  );
                })}
                <polygon
                  points={dataPoly}
                  fill="url(#radarFillAIV)"
                  stroke="#002fa7"
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
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 分镜情绪/节奏曲线 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  show_chart
                </span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">分镜情绪/节奏曲线</h3>
                <p className="text-[11px] text-[#9ca3af]">沿 10 个镜头情绪强度推演</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['强度', '节奏', '峰值'].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                    i === 0 ? 'bg-[#002fa7] text-white' : 'bg-[#f1f3f9] text-[#6b7280]'
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none text-[#111827]">88</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                trending_up
              </span>
              峰值
            </span>
            <span className="mb-1 text-[12px] text-[#9ca3af]">第9镜情绪最高点</span>
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
                  <linearGradient id="trendFillAIV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendLineAIV" x1="0" y1="0" x2="1" y2="0">
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
                <path d={area} fill="url(#trendFillAIV)" />
                <path
                  d={line}
                  fill="none"
                  stroke="url(#trendLineAIV)"
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
            {Array.from({ length: 10 }, (_, i) => `镜头${i + 1}`).map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 分镜数 · 环形进度 */}
        <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                movie
              </span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                trending_up
              </span>
              完整
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                {AI_VIDEO_MOCK_SHOTS.length}
                <span className="text-[15px] text-[#9ca3af]"> 个</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">分镜数</p>
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
                  strokeDasharray={`${Math.min(100, AI_VIDEO_MOCK_SHOTS.length * 10)} 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 总时长 · 迷你柱 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                timer
              </span>
            </span>
            <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">
              已测算
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[22px] font-bold leading-none text-[#111827]">
              {AI_VIDEO_RESULT_TOTAL_DURATION}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">总时长</p>
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

        {/* 目标平台 · 进度条 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                hub
              </span>
            </span>
            <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">
              已选
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[20px] font-bold leading-none text-[#111827]">
              {selectedPlatformLabel}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">目标平台</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" />
          </div>
        </div>

        {/* 视频类型 · 关键词 chip */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                video_library
              </span>
            </span>
            <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">
              {VIDEO_TYPES.length} 种
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[20px] font-bold leading-none text-[#111827]">
              {selectedTypeLabel}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">视频类型</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['口播', '剧情', 'Vlog'].map((k) => (
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
              className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-4 py-2 text-[13px] font-medium text-[#6b7280] transition-colors hover:border-[#781621] hover:text-[#781621]"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
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
            {AI_VIDEO_ADVICE.map((a) => (
              <InlineAdviceCard key={a.id} advice={a} />
            ))}
          </div>

          {/* 10 SHOT 分镜时间线 */}
          <div className="rounded-xl border border-[#dbe2ff] bg-gradient-to-br from-[#eff4ff] via-white to-[#f7f1ff] p-6 pw-shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    movie
                  </span>
                </span>
                <div>
                  <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#002fa7]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#002fa7]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#002fa7]" />
                    Storyboard
                  </span>
                  <h3 className="text-[20px] font-bold text-[#111827]">分镜脚本</h3>
                </div>
              </div>
              <span className="rounded-full bg-[#002fa7]/10 px-3 py-1 text-[12px] font-bold text-[#002fa7]">
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
    </PioneerLayout>
  );
}
