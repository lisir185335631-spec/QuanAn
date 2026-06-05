/**
 * BoomGenerate.tsx — /boom-generate 爆款元素自动生成 · IKB 红蓝紫渐变体系重构
 * 逻辑零改动 · testid 全保留 · 只换皮
 * H1 字面锁: "爆款元素自动生成"
 */

import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
import {
  BOOM_ANALYSIS_BODY,
  BOOM_ANALYSIS_TAG,
  BOOM_ANALYSIS_TITLE,
  BOOM_AVOID_LIST,
  BOOM_BEST_PRACTICE,
  BOOM_BEST_PRACTICE_LABEL,
  BOOM_BREADCRUMB,
  BOOM_BREADCRUMB_LABEL,
  BOOM_CTA,
  BOOM_DEFAULT_SELECTED_KEYS,
  BOOM_ENTRIES,
  BOOM_FEEDBACK_PROMPT,
  BOOM_FIELD_INDUSTRY_DEFAULT,
  BOOM_FIELD_INDUSTRY_LABEL,
  BOOM_FIELD_INDUSTRY_PLACEHOLDER,
  BOOM_FIELD_TOPIC_DEFAULT,
  BOOM_FIELD_TOPIC_LABEL,
  BOOM_FIELD_TOPIC_PLACEHOLDER,
  BOOM_H1,
  BOOM_INDEX_PREFIX,
  BOOM_PICKER_TITLE,
  BOOM_REASON_PREFIX,
  BOOM_SECTION_CLIMAX,
  BOOM_SECTION_DEVELOPMENT,
  BOOM_SECTION_ENDING,
  BOOM_SECTION_FULL,
  BOOM_SECTION_OPENING,
  BOOM_SELECTED_PREFIX,
  BOOM_SELECTED_SUFFIX,
  BOOM_SETTINGS_TITLE,
  BOOM_SUBTITLE_HIGHLIGHT,
  BOOM_SUBTITLE_PART1,
  BOOM_SUBTITLE_PART2,
  type BoomEntry,
} from '@/lib/constants/boomGenerate';
import { HOT_ELEMENT_GROUPS } from '@/lib/constants/elements';

// ── Category colors — IKB token 轮转 ─────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { dot: string; text: string }> = {
  classic:    { dot: C.ikb,      text: C.ikb },
  emotion:    { dot: C.burgundy, text: C.burgundyText },
  content:    { dot: C.accent3,  text: C.purpleText },
  conversion: { dot: C.ikb,     text: C.ikb },
};

// ── Radar data (爆款力雷达 · 六维) ────────────────────────────────────────────
const RADAR_DIMS_BM = [
  { label: '钩子强度', value: 88, color: C.ikb },
  { label: '情绪张力', value: 82, color: C.burgundy },
  { label: '价值密度', value: 91, color: C.accent3 },
  { label: '转化引导', value: 79, color: C.ikb },
  { label: '记忆点',   value: 85, color: C.burgundy },
  { label: '传播性',   value: 93, color: C.accent3 },
];

// ── Trend data (元素权重/热度曲线) ────────────────────────────────────────────
const TREND_DATA_BM = [68, 75, 88, 72, 84, 78, 92, 86, 80, 95, 90, 97];
const TREND_LABELS_BM = ['贪念', '恐惧', '猎奇', '反差', '借势', '共鸣', '共情', '情绪', '热点', '争议', '稀缺', '权威'];

// ── inline BoomHero ────────────────────────────────────────────────────────────
function BoomHero() {
  return (
    <div className="shrink-0">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
          style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
        >
          {BOOM_BREADCRUMB}
        </span>
        <span
          className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
          style={{ borderColor: `${C.burgundy}50`, background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
        >
          {BOOM_BREADCRUMB_LABEL}
        </span>
      </div>
      <h1
        className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight"
        style={{ fontFamily: F.display }}
      >
        爆款引擎 · {BOOM_H1}
      </h1>
      <p
        className="mt-2 max-w-[820px] text-[16px] leading-relaxed"
        style={{ color: '#5A6173', fontFamily: F.cn }}
      >
        {BOOM_SUBTITLE_PART1}
        <span className="font-bold" style={{ color: C.ikb }}>{BOOM_SUBTITLE_HIGHLIGHT}</span>
        {BOOM_SUBTITLE_PART2}
      </p>
    </div>
  );
}

// ── inline BoomElementsPicker ──────────────────────────────────────────────────
interface BoomElementsPickerProps {
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
}

function BoomElementsPicker({ selectedKeys, onChange }: BoomElementsPickerProps) {
  function toggleKey(key: string) {
    if (selectedKeys.includes(key)) {
      onChange(selectedKeys.filter((k) => k !== key));
    } else {
      onChange([...selectedKeys, key]);
    }
  }

  const selectedLabels = HOT_ELEMENT_GROUPS.flatMap((g) => g.items)
    .filter((item) => selectedKeys.includes(item.key))
    .map((item) => item.label);

  return (
    <div
      className="rounded-xl border p-6"
      style={{ borderColor: C.line, background: C.paper }}
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${C.burgundy}12`, color: C.burgundy }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>local_fire_department</span>
        </span>
        <div>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{BOOM_PICKER_TITLE}</h2>
          <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>多选 · 当前 {selectedKeys.length} 个</p>
        </div>
      </div>
      <div className="space-y-5">
        {HOT_ELEMENT_GROUPS.map((group) => {
          const cc = CATEGORY_COLORS[group.key] ?? CATEGORY_COLORS['classic']!;
          return (
            <div key={group.key}>
              <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide" style={{ color: cc.text }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cc.dot }} />
                {group.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const selected = selectedKeys.includes(item.key);
                  return (
                    <button
                      type="button"
                      key={item.key}
                      aria-pressed={selected}
                      data-state={selected ? 'active' : 'inactive'}
                      onClick={() => toggleKey(item.key)}
                      className={`ikb-hovercard ikb-focusring inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all ${selected ? '' : 'border-[#e5e7eb] bg-[#f9f9f9] text-[#6b7280]'}`}
                      style={selected ? { borderColor: C.ikb, background: `${C.ikb}06`, color: C.ikb } : undefined}
                    >
                      <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>
                        {item.key === 'greed' ? 'monetization_on' :
                         item.key === 'fear' ? 'warning' :
                         item.key === 'curiosity' ? 'search' :
                         item.key === 'contrast' ? 'compare_arrows' :
                         item.key === 'worst' ? 'error_outline' :
                         item.key === 'leverage' ? 'local_fire_department' :
                         item.key === 'resonance' ? 'chat_bubble' :
                         item.key === 'empathy' ? 'handshake' :
                         item.key === 'small_big' ? 'track_changes' :
                         item.key === 'low_cost_high' ? 'trending_up' :
                         item.key === 'low_cost_unknown' ? 'casino' :
                         item.key === 'anger' ? 'mood_bad' :
                         item.key === 'surprise' ? 'celebration' :
                         item.key === 'trend' ? 'whatshot' :
                         item.key === 'controversy' ? 'gavel' :
                         item.key === 'reveal' ? 'lock_open' :
                         item.key === 'list' ? 'checklist' :
                         item.key === 'challenge' ? 'emoji_events' :
                         item.key === 'transformation' ? 'change_circle' :
                         item.key === 'scarcity' ? 'hourglass_bottom' :
                         item.key === 'social_proof' ? 'thumb_up' :
                         item.key === 'authority' ? 'workspace_premium' :
                         item.key === 'benefit' ? 'card_giftcard' :
                         'star'}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {selectedKeys.length > 0 && (
        <div
          className="mt-5 rounded-xl border px-4 py-3 text-[12px]"
          style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}06` }}
        >
          <span className="font-bold" style={{ color: C.ikb }}>
            {BOOM_SELECTED_PREFIX} {selectedKeys.length} {BOOM_SELECTED_SUFFIX}
          </span>
          <span style={{ color: '#444653' }}>{selectedLabels.join('、')}</span>
        </div>
      )}
    </div>
  );
}

// ── inline BoomSettings ────────────────────────────────────────────────────────
interface BoomSettingsProps {
  industry: string;
  topic: string;
  onIndustryChange: (v: string) => void;
  onTopicChange: (v: string) => void;
}

function BoomSettings({ industry, topic, onIndustryChange, onTopicChange }: BoomSettingsProps) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ borderColor: C.line, background: C.paper }}
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${C.ikb}12`, color: C.ikb }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>tune</span>
        </span>
        <div>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{BOOM_SETTINGS_TITLE}</h2>
          <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>行业 + 主题，精准定向生成</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="boom-industry"
            className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
            style={{ color: C.ink, fontFamily: F.cn }}
          >
            <span
              className="mr-1 inline-block h-3.5 w-1 rounded-full"
              style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
              aria-hidden={true}
            />
            {BOOM_FIELD_INDUSTRY_LABEL}
          </label>
          <div className="relative">
            <span
              className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
              style={{ color: '#6b7280' }}
              aria-hidden={true}
            >storefront</span>
            <input
              id="boom-industry"
              type="text"
              value={industry}
              onChange={(e) => onIndustryChange(e.target.value)}
              placeholder={BOOM_FIELD_INDUSTRY_PLACEHOLDER}
              className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus:ring-1 focus:ring-[#2B53E6]"
              style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.cn }}
              data-testid="boom-industry-input"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="boom-topic"
            className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
            style={{ color: C.ink, fontFamily: F.cn }}
          >
            <span
              className="mr-1 inline-block h-3.5 w-1 rounded-full"
              style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
              aria-hidden={true}
            />
            {BOOM_FIELD_TOPIC_LABEL}
          </label>
          <div className="relative">
            <span
              className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
              style={{ color: '#6b7280' }}
              aria-hidden={true}
            >topic</span>
            <input
              id="boom-topic"
              type="text"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder={BOOM_FIELD_TOPIC_PLACEHOLDER}
              className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus:ring-1 focus:ring-[#2B53E6]"
              style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.cn }}
              data-testid="boom-topic-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── inline BoomCTA ─────────────────────────────────────────────────────────────
interface BoomCTAProps {
  onClick?: () => void;
}

function BoomCTA({ onClick }: BoomCTAProps) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px active:shadow-sm"
        style={{ fontFamily: F.mono }}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_awesome</span>
        {BOOM_CTA}
      </button>
    </div>
  );
}

// ── inline BoomAnalysis ────────────────────────────────────────────────────────
function BoomAnalysis() {
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: C.line, background: C.paper }}
    >
      <div
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: C.line }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ background: C.grad }}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>analytics</span>
          </span>
          <div>
            <h3 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{BOOM_ANALYSIS_TITLE}</h3>
            <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>AI 策略解析 · 实时生效</p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
          style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
        >
          {BOOM_ANALYSIS_TAG}
        </span>
      </div>
      <div className="p-6">
        <p className="text-[14px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{BOOM_ANALYSIS_BODY}</p>
        <p className="mt-4 text-[14px] leading-relaxed">
          <span className="font-bold" style={{ color: C.ikb, fontFamily: F.cn }}>{BOOM_BEST_PRACTICE_LABEL}</span>
          <span style={{ color: '#444653', fontFamily: F.cn }}>{BOOM_BEST_PRACTICE}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BOOM_AVOID_LIST.map((text) => (
            <span
              key={text}
              className="rounded-lg border px-3 py-1.5 text-[12px]"
              style={{ borderColor: `${C.burgundy}30`, background: `${C.burgundy}06`, color: C.burgundyText, fontFamily: F.cn }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── inline BoomResultEntry ────────────────────────────────────────────────────
function BoomResultEntry({ entry }: { entry: BoomEntry }) {
  const fullText = [entry.opening, entry.development, entry.climax, entry.ending].join(' ');

  function handleCopy() {
    navigator.clipboard.writeText(fullText).then(
      () => toast.success('已复制'),
      () => toast.error('复制失败'),
    );
  }

  // IKB 三色轮转 for section left-border
  const sections = [
    { label: BOOM_SECTION_OPENING,     body: entry.opening,     borderColor: C.accent3,  labelColor: C.purpleText },
    { label: BOOM_SECTION_DEVELOPMENT, body: entry.development, borderColor: C.accent3,  labelColor: C.purpleText },
    { label: BOOM_SECTION_CLIMAX,      body: entry.climax,      borderColor: C.burgundy, labelColor: C.burgundyText },
    { label: BOOM_SECTION_ENDING,      body: entry.ending,      borderColor: C.ikb,      labelColor: C.ikb },
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: C.line, background: C.paper }}
    >
      <div
        className="border-b px-6 py-4"
        style={{ borderColor: C.line }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{ background: C.ikb, fontFamily: F.mono }}
            >
              {entry.index}
            </span>
            <span className="text-[15px] font-bold flex-1" style={{ color: C.ink, fontFamily: F.cn }}>{entry.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}
            >
              {BOOM_INDEX_PREFIX}{entry.indexScore}
            </span>
            <button
              type="button"
              aria-label="复制"
              onClick={handleCopy}
              className="ikb-focusring flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors"
              style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>content_copy</span>
              复制
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {/* type chip — accent3/紫 */}
          <span
            className="rounded-lg border px-3 py-1 text-[11px] font-medium"
            style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}0c`, color: C.purpleText, fontFamily: F.cn }}
          >
            {entry.type}
          </span>
          {/* format chip — ikb/蓝 */}
          <span
            className="rounded-lg border px-3 py-1 text-[11px] font-medium"
            style={{ borderColor: `${C.ikb}40`, background: `${C.ikb}10`, color: C.ikb, fontFamily: F.cn }}
          >
            {entry.format}
          </span>
          {/* element chip — ikb/蓝浅 */}
          <span
            className="rounded-lg border px-3 py-1 text-[11px] font-medium"
            style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}06`, color: C.ikb, fontFamily: F.cn }}
          >
            {entry.element}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {sections.map((sec) => (
            <div key={sec.label} className="border-l-2 pl-4" style={{ borderColor: sec.borderColor }}>
              <p className="text-[11px] font-bold mb-1" style={{ color: sec.labelColor, fontFamily: F.mono }}>{sec.label}</p>
              <p className="text-[13px] leading-relaxed" style={{ color: '#444653', fontFamily: F.cn }}>{sec.body}</p>
            </div>
          ))}
        </div>

        <div
          className="mt-6 rounded-xl border p-4"
          style={{ borderColor: C.line, background: C.base }}
        >
          <p className="text-[11px] font-bold mb-2" style={{ color: C.ikb, fontFamily: F.mono }}>{BOOM_SECTION_FULL}</p>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: C.ink, fontFamily: F.cn }}>{fullText}</p>
          <div
            className="mt-4 flex items-center gap-3 border-t pt-3"
            style={{ borderColor: C.line }}
          >
            <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{BOOM_FEEDBACK_PROMPT}</p>
            <button
              type="button"
              aria-label="有帮助"
              className="ikb-focusring flex h-7 w-7 items-center justify-center rounded-md border transition-colors"
              style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>thumb_up</span>
            </button>
            <button
              type="button"
              aria-label="无帮助"
              className="ikb-focusring flex h-7 w-7 items-center justify-center rounded-md border transition-colors"
              style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>thumb_down</span>
            </button>
          </div>
        </div>

        <div
          className="mt-4 rounded-lg border-l-2 p-3"
          style={{ borderColor: C.burgundy, background: `${C.burgundy}06` }}
        >
          <span className="text-[11px] font-bold" style={{ color: C.burgundyText, fontFamily: F.mono }}>{BOOM_REASON_PREFIX}</span>
          <span className="text-[11px]" style={{ color: '#444653', fontFamily: F.cn }}>{entry.reason}</span>
        </div>
      </div>
    </div>
  );
}

// ── inline BoomResultList ─────────────────────────────────────────────────────
function BoomResultList({ entries }: { entries: ReadonlyArray<BoomEntry> }) {
  return (
    <div className="space-y-6">
      {entries.map((entry) => (
        <BoomResultEntry key={entry.index} entry={entry} />
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BoomGenerate() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([...BOOM_DEFAULT_SELECTED_KEYS]);
  const [industry, setIndustry] = useState<string>(BOOM_FIELD_INDUSTRY_DEFAULT);
  const [topic, setTopic] = useState<string>(BOOM_FIELD_TOPIC_DEFAULT);

  const totalElements = HOT_ELEMENT_GROUPS.reduce((sum: number, cat) => sum + cat.items.length, 0);

  function handleGenerate() {
    toast.success('已生成爆款文案');
  }

  return (
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <BoomHero />
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            aria-label="智能优化"
            onClick={handleGenerate}
            className="ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors"
            style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            aria-label="导出方案"
            onClick={() => {
              const text = JSON.stringify(BOOM_ENTRIES, null, 2);
              navigator.clipboard.writeText(text).then(
                () => toast.success('已复制全部'),
                () => toast.error('复制失败'),
              );
            }}
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all active:translate-x-px active:translate-y-px"
            style={{ fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>download</span>
            导出方案
          </button>
        </div>
      </header>

      {/* ── KPI 概览一排 (4 卡) ────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 爆款元素 · 蓝 · 环形 */}
        <div
          className="rounded-xl border p-5 ikb-hovercard"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>local_fire_department</span>
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>全库
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                {totalElements}
                <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 个</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>爆款元素</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label="爆款元素覆盖率">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}22`} strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.ikb} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="100 100" />
              </svg>
            </div>
          </div>
        </div>

        {/* 选中元素 · 玫红 · 进度条 */}
        <div
          className="rounded-xl border p-5 ikb-hovercard"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.burgundy}12`, color: C.burgundy }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>check_circle</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
            >选中</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {selectedKeys.length}
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 个</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>选中元素</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.burgundy}18` }}>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.min(100, Math.round((selectedKeys.length / totalElements) * 100))}%`,
                background: `linear-gradient(to right, ${C.burgundy}, ${C.accent3})`,
              }}
            />
          </div>
        </div>

        {/* 生成结果 · 紫 · 迷你柱 */}
        <div
          className="rounded-xl border p-5 ikb-hovercard"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.accent3}12`, color: C.accent3 }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>article</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}
            >结果库</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {BOOM_ENTRIES.length}
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 篇</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>生成结果</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1" aria-hidden={true}>
            {[64, 88, 72, 96, 82].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `${C.accent3}70` }} />
            ))}
          </div>
        </div>

        {/* 命中率 · 蓝 · chip */}
        <div
          className="rounded-xl border p-5 ikb-hovercard"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>gps_fixed</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              命中率
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              87
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> %</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>命中率</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1" aria-hidden={true}>
            {['共鸣', '转化', '爆款'].map((k) => (
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

      {/* ── 元素多选 ────────────────────────────────────────── */}
      <div className="mb-6">
        <BoomElementsPicker selectedKeys={selectedKeys} onChange={setSelectedKeys} />
      </div>

      {/* ── 设置 ────────────────────────────────────────────── */}
      <div className="mb-6">
        <BoomSettings
          industry={industry}
          topic={topic}
          onIndustryChange={setIndustry}
          onTopicChange={setTopic}
        />
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <BoomCTA onClick={handleGenerate} />
      </div>

      {/* ── 元素组合分析 ────────────────────────────────────── */}
      <div className="mb-8">
        <BoomAnalysis />
      </div>

      {/* ── 结果列表 ─────────────────────────────────────────── */}
      <BoomResultList entries={BOOM_ENTRIES} />

      {/* ── 数据洞察(雷达 + 趋势) ─────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>数据洞察</h2>
        <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
        >
          <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 爆款力雷达 · col-span-5 */}
        <div
          className="col-span-5 rounded-xl border p-6 ikb-hovercard"
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
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>爆款力雷达</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>86</p>
              <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>综合分</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS_BM;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="爆款力雷达图">
                <defs>
                  <linearGradient id="boom-radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#boom-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
                })}
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R + 16);
                  return (
                    <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            );
          })()}
          <div className="mt-2 grid grid-cols-3 gap-y-2">
            {RADAR_DIMS_BM.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 元素权重/热度曲线 · col-span-7 */}
        <div
          className="col-span-7 rounded-xl border p-6 ikb-hovercard"
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
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>元素权重 / 热度曲线</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>按当前选中元素测算</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['权重', '热度', '转化'].map((t, i) => (
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
            <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>97</p>
            <span
              className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>+248%
            </span>
            <span className="mb-1 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>较基准值</span>
          </div>
          {(() => {
            const data = TREND_DATA_BM;
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
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="元素热度曲线图">
                <defs>
                  <linearGradient id="boom-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="boom-trendLine" x1="0" y1="0" x2="1" y2="0">
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
                <path d={area} fill="url(#boom-trendFill)" />
                <path d={line} fill="none" stroke="url(#boom-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" />
                ))}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
            {TREND_LABELS_BM.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </IKBLayout>
  );
}
