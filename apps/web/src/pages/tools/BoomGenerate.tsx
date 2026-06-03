/**
 * BoomGenerate.tsx — /boom-generate 爆款元素自动生成 · 先锋白重构
 * 逻辑零改动 · 只换皮 + 加可视化 · PioneerLayout 外壳
 * H1 字面锁: "爆款元素自动生成"
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
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

// ── Category colors (爆款元素分组色系 · Step7 照抄) ────────────────────────────
const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  classic:    { border: 'border-[#002fa7]/20', bg: 'bg-[#002fa7]/[0.04]', text: 'text-[#002fa7]',  dot: '#002fa7' },
  emotion:    { border: 'border-[#781621]/20', bg: 'bg-[#781621]/[0.04]', text: 'text-[#781621]',  dot: '#781621' },
  content:    { border: 'border-[#F3E08A]',    bg: 'bg-[#fdf6cc]',        text: 'text-[#8a6a00]',  dot: '#F6D300' },
  conversion: { border: 'border-[#002fa7]/20', bg: 'bg-[#002fa7]/[0.04]', text: 'text-[#002fa7]',  dot: '#002fa7' },
};

// ── Radar data (爆款力雷达 · 六维 钩子/情绪/价值/转化/记忆/传播) ──────────────
const RADAR_DIMS_BM = [
  { label: '钩子强度', value: 88, color: '#002fa7' },
  { label: '情绪张力', value: 82, color: '#781621' },
  { label: '价值密度', value: 91, color: '#F6D300' },
  { label: '转化引导', value: 79, color: '#002fa7' },
  { label: '记忆点',   value: 85, color: '#781621' },
  { label: '传播性',   value: 93, color: '#F6D300' },
];

// ── Trend data (元素权重/热度曲线) ────────────────────────────────────────────
const TREND_DATA_BM = [68, 75, 88, 72, 84, 78, 92, 86, 80, 95, 90, 97];
const TREND_LABELS_BM = ['贪念', '恐惧', '猎奇', '反差', '借势', '共鸣', '共情', '情绪', '热点', '争议', '稀缺', '权威'];

// ── inline BoomHero ────────────────────────────────────────────────────────────
function BoomHero() {
  return (
    <div className="shrink-0">
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
          {BOOM_BREADCRUMB}
        </span>
        <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
          {BOOM_BREADCRUMB_LABEL}
        </span>
      </div>
      <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
        爆款引擎 · {BOOM_H1}
      </h1>
      <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
        {BOOM_SUBTITLE_PART1}
        <span className="font-bold text-[#002fa7]">{BOOM_SUBTITLE_HIGHLIGHT}</span>
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
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
          <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
        </span>
        <div>
          <h2 className="text-[16px] font-bold text-[#111827]">{BOOM_PICKER_TITLE}</h2>
          <p className="text-[11px] text-[#9ca3af]">多选 · 当前 {selectedKeys.length} 个</p>
        </div>
      </div>
      <div className="space-y-5">
        {HOT_ELEMENT_GROUPS.map((group) => {
          const cc = CATEGORY_COLORS[group.key] ?? CATEGORY_COLORS['classic']!;
          return (
            <div key={group.key}>
              <div className={`mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide ${cc.text}`}>
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
                      onClick={() => toggleKey(item.key)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all ${selected ? 'border-[#002fa7] bg-[#002fa7]/[0.04] text-[#002fa7]' : 'border-[#e5e7eb] bg-[#f9f9f9] text-[#6b7280] hover:border-[#c7d2fe] hover:text-[#002fa7]'}`}
                    >
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
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
        <div className="mt-5 rounded-xl border border-[#002fa7]/30 bg-[#002fa7]/[0.04] px-4 py-3 text-[12px]">
          <span className="font-bold text-[#002fa7]">
            {BOOM_SELECTED_PREFIX} {selectedKeys.length} {BOOM_SELECTED_SUFFIX}
          </span>
          <span className="text-[#444653]">{selectedLabels.join('、')}</span>
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
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </span>
        <div>
          <h2 className="text-[16px] font-bold text-[#111827]">{BOOM_SETTINGS_TITLE}</h2>
          <p className="text-[11px] text-[#9ca3af]">行业 + 主题，精准定向生成</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="boom-industry" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
            {BOOM_FIELD_INDUSTRY_LABEL}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">storefront</span>
            <input
              id="boom-industry"
              type="text"
              value={industry}
              onChange={(e) => onIndustryChange(e.target.value)}
              placeholder={BOOM_FIELD_INDUSTRY_PLACEHOLDER}
              className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
              data-testid="boom-industry-input"
            />
          </div>
        </div>
        <div>
          <label htmlFor="boom-topic" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
            {BOOM_FIELD_TOPIC_LABEL}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">topic</span>
            <input
              id="boom-topic"
              type="text"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder={BOOM_FIELD_TOPIC_PLACEHOLDER}
              className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
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
        className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
        {BOOM_CTA}
      </button>
    </div>
  );
}

// ── inline BoomAnalysis ────────────────────────────────────────────────────────
function BoomAnalysis() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft">
      <div className="flex items-center justify-between border-b border-[#eef1f6] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
            <span className="material-symbols-outlined text-[20px]">analytics</span>
          </span>
          <div>
            <h3 className="text-[16px] font-bold text-[#111827]">{BOOM_ANALYSIS_TITLE}</h3>
            <p className="text-[12px] text-[#9ca3af]">AI 策略解析 · 实时生效</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#781621]/10 px-3 py-1 text-[12px] font-bold text-[#781621]">
          {BOOM_ANALYSIS_TAG}
        </span>
      </div>
      <div className="p-6">
        <p className="text-[14px] leading-relaxed text-[#444653]">{BOOM_ANALYSIS_BODY}</p>
        <p className="mt-4 text-[14px] leading-relaxed">
          <span className="font-bold text-[#002fa7]">{BOOM_BEST_PRACTICE_LABEL}</span>
          <span className="text-[#444653]">{BOOM_BEST_PRACTICE}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BOOM_AVOID_LIST.map((text) => (
            <span
              key={text}
              className="rounded-lg border border-[#781621]/30 bg-[#781621]/[0.04] px-3 py-1.5 text-[12px] text-[#781621]"
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

  const sections = [
    { label: BOOM_SECTION_OPENING,    body: entry.opening,     borderColor: 'border-[#F6D300]', labelColor: 'text-[#8a6a00]' },
    { label: BOOM_SECTION_DEVELOPMENT,body: entry.development, borderColor: 'border-[#F6D300]', labelColor: 'text-[#8a6a00]' },
    { label: BOOM_SECTION_CLIMAX,     body: entry.climax,      borderColor: 'border-[#781621]', labelColor: 'text-[#781621]' },
    { label: BOOM_SECTION_ENDING,     body: entry.ending,      borderColor: 'border-[#002fa7]', labelColor: 'text-[#002fa7]' },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-b border-[#eef1f6] px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#002fa7] text-[13px] font-bold text-white">
              {entry.index}
            </span>
            <span className="text-[15px] font-bold text-[#111827] flex-1">{entry.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">
              {BOOM_INDEX_PREFIX}{entry.indexScore}
            </span>
            <button
              type="button"
              aria-label="复制"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#6b7280] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">content_copy</span>
              复制
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-lg border border-[#F6D300]/60 bg-[#fdf6cc] px-3 py-1 text-[11px] font-medium text-[#8a6a00]">
            {entry.type}
          </span>
          <span className="rounded-lg border border-[#002fa7]/40 bg-[#002fa7]/10 px-3 py-1 text-[11px] font-medium text-[#002fa7]">
            {entry.format}
          </span>
          <span className="rounded-lg border border-[#002fa7]/30 bg-[#002fa7]/[0.04] px-3 py-1 text-[11px] font-medium text-[#002fa7]">
            {entry.element}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {sections.map((sec) => (
            <div key={sec.label} className={`border-l-2 ${sec.borderColor} pl-4`}>
              <p className={`text-[11px] font-bold mb-1 ${sec.labelColor}`}>{sec.label}</p>
              <p className="text-[13px] text-[#444653] leading-relaxed">{sec.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] p-4">
          <p className="text-[11px] font-bold text-[#002fa7] mb-2">{BOOM_SECTION_FULL}</p>
          <p className="text-[13px] text-[#1b1b1b] leading-relaxed whitespace-pre-wrap">{fullText}</p>
          <div className="mt-4 flex items-center gap-3 border-t border-[#e5e7eb] pt-3">
            <p className="text-[11px] text-[#9ca3af]">{BOOM_FEEDBACK_PROMPT}</p>
            <button type="button" aria-label="有帮助" className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:border-[#10b981] hover:text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">thumb_up</span>
            </button>
            <button type="button" aria-label="无帮助" className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:border-[#781621] hover:text-[#781621]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">thumb_down</span>
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border-l-2 border-[#781621] bg-[#781621]/[0.04] p-3">
          <span className="text-[11px] font-bold text-[#781621]">{BOOM_REASON_PREFIX}</span>
          <span className="text-[11px] text-[#444653]">{entry.reason}</span>
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

  const btnSecondary =
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <BoomHero />
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button type="button" onClick={handleGenerate} className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={() => {
              const text = JSON.stringify(BOOM_ENTRIES, null, 2);
              navigator.clipboard.writeText(text).then(
                () => toast.success('已复制全部'),
                () => toast.error('复制失败'),
              );
            }}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
            导出方案
          </button>
        </div>
      </header>

      {/* ── 数据洞察(雷达 + 趋势) ─────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]">insights</span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 实时测算</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 爆款力雷达 · col-span-5 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">爆款力雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">86</p>
              <p className="text-[10px] text-[#9ca3af]">综合分</p>
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
              <svg viewBox="0 0 260 244" className="w-full">
                <defs>
                  <linearGradient id="radarFillBM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#radarFillBM)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
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
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 元素权重/热度曲线 · col-span-7 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">元素权重 / 热度曲线</h3>
                <p className="text-[11px] text-[#9ca3af]">按当前选中元素测算</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['权重', '热度', '转化'].map((t, i) => (
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
            <p className="text-[30px] font-bold leading-none text-[#111827]">97</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>+248%
            </span>
            <span className="mb-1 text-[12px] text-[#9ca3af]">较基准值</span>
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
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                <defs>
                  <linearGradient id="trendFillBM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendLineBM" x1="0" y1="0" x2="1" y2="0">
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
                <path d={area} fill="url(#trendFillBM)" />
                <path d={line} fill="none" stroke="url(#trendLineBM)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" />
                ))}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
            {TREND_LABELS_BM.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI 概览一排 (4 卡) ────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 爆款元素 · 蓝 · 环形 */}
        <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>全库
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                {totalElements}
                <span className="text-[15px] text-[#9ca3af]"> 个</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">爆款元素</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#002fa7" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="100 100" />
              </svg>
            </div>
          </div>
        </div>

        {/* 选中元素 · 勃艮第红 · 进度条 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </span>
            <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">选中</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {selectedKeys.length}
              <span className="text-[15px] text-[#9ca3af]"> 个</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">选中元素</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[#781621]/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#781621] to-[#a02030]"
              style={{ width: `${Math.min(100, Math.round((selectedKeys.length / totalElements) * 100))}%` }}
            />
          </div>
        </div>

        {/* 生成结果 · 暖黄 · 迷你柱 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
              <span className="material-symbols-outlined text-[20px]">article</span>
            </span>
            <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">结果库</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {BOOM_ENTRIES.length}
              <span className="text-[15px] text-[#9ca3af]"> 篇</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">生成结果</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[64, 88, 72, 96, 82].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-[#F6D300]/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* 命中率 · 蓝 · chip */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]">gps_fixed</span>
            </span>
            <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">
              命中率
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              87
              <span className="text-[15px] text-[#9ca3af]"> %</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">命中率</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['共鸣', '转化', '爆款'].map((k) => (
              <span key={k} className="rounded bg-[#eff4ff] px-1.5 py-0.5 text-[10px] font-medium text-[#002fa7]">
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
    </PioneerLayout>
  );
}
