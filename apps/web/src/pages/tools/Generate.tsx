/**
 * Generate.tsx — /generate 生成爆款文案 · IKB 红蓝紫渐变体系重构
 * 逻辑零改动 · testid 全保留 · 只换皮
 * 参考样板: Trending.tsx / Monetization.tsx (同类工具页)
 */

import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
import { HOT_ELEMENT_GROUPS, ALL_ELEMENTS } from '@/lib/constants/elements';
import {
  GENERATE_H1,
  GENERATE_SUBTITLE,
  GENERATE_SCRIPT_TITLE,
  GENERATE_ELEMENTS_TITLE,
  GENERATE_TOPIC_TITLE,
  GENERATE_TOPIC_DEFAULT,
  GENERATE_TOPIC_MAXLEN,
  GENERATE_CTA,
  GENERATE_RESULT_TITLE,
  GENERATE_BTN_COPY,
  GENERATE_BTN_AI_OPT,
  GENERATE_BTN_RESTART,
  GENERATE_RESULT_PARAGRAPHS,
  GENERATE_FEEDBACK_PROMPT,
  GENERATE_DEFAULT_SCRIPT_KEY,
  GENERATE_DEFAULT_ELEMENT_KEYS,
} from '@/lib/constants/generatePage';
import { SCRIPT_TYPES } from '@/lib/constants/scripts';

// ── Script type icons (Material Symbols) ─────────────────────────────────────
const SCRIPT_TYPE_ICONS: Record<string, string> = {
  opinion:    'record_voice_over',
  process:    'play_circle',
  knowledge:  'school',
  story:      'auto_stories',
  comedy:     'sentiment_very_satisfied',
  product:    'shopping_bag',
  review:     'rate_review',
  expose:     'lock_open',
  challenge:  'emoji_events',
  interview:  'mic',
  daily:      'photo_camera',
  transform:  'change_circle',
  debate:     'forum',
  list:       'checklist',
  reaction:   'emoji_emotions',
  qna:        'question_answer',
  collab:     'group',
  behind:     'movie',
  trend_news: 'whatshot',
  motivation: 'bolt',
};

// ── Category colors — IKB token 轮转 ─────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { dot: string; text: string }> = {
  classic:    { dot: C.ikb,     text: C.ikb },
  emotion:    { dot: C.burgundy, text: C.burgundyText },
  content:    { dot: C.accent3,  text: C.purpleText },
  conversion: { dot: C.ikb,     text: C.ikb },
};

// ── Element icon map (Material Symbols) ──────────────────────────────────────
const ELEMENT_ICONS: Record<string, string> = {
  greed:           'monetization_on',
  fear:            'warning',
  curiosity:       'search',
  contrast:        'compare_arrows',
  worst:           'error_outline',
  leverage:        'local_fire_department',
  resonance:       'chat_bubble',
  empathy:         'handshake',
  small_big:       'track_changes',
  low_cost_high:   'trending_up',
  low_cost_unknown:'casino',
  anger:           'mood_bad',
  surprise:        'celebration',
  trend:           'whatshot',
  controversy:     'gavel',
  reveal:          'lock_open',
  list:            'checklist',
  challenge:       'emoji_events',
  transformation:  'change_circle',
  scarcity:        'hourglass_bottom',
  social_proof:    'thumb_up',
  authority:       'workspace_premium',
  benefit:         'card_giftcard',
};

// ── KPI / insight constants (文案爆款力雷达) ─────────────────────────────────
const RADAR_DIMS_GN = [
  { label: '钩子强度', value: 86, color: C.ikb },
  { label: '情绪张力', value: 79, color: C.burgundy },
  { label: '价值密度', value: 88, color: C.accent3 },
  { label: '转化引导', value: 82, color: C.ikb },
  { label: '记忆点',   value: 75, color: C.burgundy },
  { label: '传播性',   value: 91, color: C.accent3 },
];

const TREND_DATA_GN = [72, 65, 88, 70, 82, 76, 90, 85, 79, 93, 88, 96];
// 使用中性数字标签，避免与页面元素文字产生 getByText 冲突
const TREND_LABELS_GN = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

// Total elements count
const TOTAL_ELEMENTS = ALL_ELEMENTS.length;

// Full generated result text (for word count KPI)
const RESULT_FULL_TEXT = GENERATE_RESULT_PARAGRAPHS.map((p) => p.label + p.body).join('\n\n');

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Generate() {
  const [scriptKey, setScriptKey] = useState<string>(GENERATE_DEFAULT_SCRIPT_KEY);
  const [elementKeys, setElementKeys] = useState<string[]>([...GENERATE_DEFAULT_ELEMENT_KEYS]);
  const [topic, setTopic] = useState<string>(GENERATE_TOPIC_DEFAULT);

  const currentScript = SCRIPT_TYPES.find((t) => t.key === scriptKey);

  function handleToggleElement(key: string) {
    setElementKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function handleGenerate() {
    toast.success('已生成爆款文案');
  }

  function handleCopyResult() {
    navigator.clipboard.writeText(RESULT_FULL_TEXT).then(
      () => toast.success('已复制文案'),
      () => toast.error('复制失败，请手动选取'),
    );
  }

  function handleOptimize() {
    toast.success('已 AI 优化文案');
  }

  function handleRestart() {
    setScriptKey(GENERATE_DEFAULT_SCRIPT_KEY);
    setElementKeys([...GENERATE_DEFAULT_ELEMENT_KEYS]);
    setTopic(GENERATE_TOPIC_DEFAULT);
    toast.info('重新开始');
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
              工具
            </span>
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${C.burgundy}50`, background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
            >
              文案引擎
            </span>
          </div>
          <h1
            className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight"
            style={{ fontFamily: F.display }}
          >
            {GENERATE_H1}
          </h1>
          <p
            className="mt-2 max-w-[820px] text-[16px] leading-relaxed"
            style={{ color: '#5A6173', fontFamily: F.cn }}
          >
            {GENERATE_SUBTITLE}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            aria-label="智能优化"
            onClick={handleOptimize}
            className="ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors"
            style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            aria-label="复制全部文案"
            onClick={handleCopyResult}
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all active:translate-x-px active:translate-y-px"
            style={{ fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>content_copy</span>
            复制文案
          </button>
        </div>
      </header>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 脚本类型 · 环形 · 蓝 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>description</span>
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>全覆盖
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                {SCRIPT_TYPES.length}
                <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 种</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>脚本类型</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label="脚本类型覆盖率环形图">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}22`} strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={C.ikb}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(100, Math.round((SCRIPT_TYPES.length / 20) * 100))} 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 爆款元素 · 迷你柱 · 玫红 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.burgundy}12`, color: C.burgundy }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>local_fire_department</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
            >
              元素库
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {TOTAL_ELEMENTS}
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 个</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>爆款元素</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1" aria-hidden={true}>
            {[58, 84, 70, 96, 78].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `${C.burgundy}70` }} />
            ))}
          </div>
        </div>

        {/* 已选元素 · 进度条 · 紫 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.accent3}12`, color: C.accent3 }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>check_circle</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}
            >
              已选
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {elementKeys.length}
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 个</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>已选元素</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}18` }}>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.min(100, TOTAL_ELEMENTS > 0 ? Math.round((elementKeys.length / TOTAL_ELEMENTS) * 100) : 0)}%`,
                background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})`,
              }}
            />
          </div>
        </div>

        {/* 文案字数 · chip · 蓝 */}
        <div
          className="ikb-hovercard rounded-xl border p-5"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${C.ikb}12`, color: C.ikb }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>article</span>
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              {RESULT_FULL_TEXT.length} 字
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {RESULT_FULL_TEXT.length}
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 字</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>文案字数</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1" aria-hidden={true}>
            {['钩子', '洞察', '转化'].map((k) => (
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

      {/* ── 2 列配置区(固定 grid-cols-2 · 禁断点) ─────────── */}
      <div className="mb-8 grid grid-cols-2 gap-6">
        {/* 左列:脚本类型 */}
        <div className="space-y-5">
          {/* ── GenerateScriptPicker inline ── */}
          <section
            className="rounded-xl border p-6"
            style={{ borderColor: C.line, background: C.paper }}
          >
            <div className="mb-5 flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.ikb}12`, color: C.ikb }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>description</span>
              </span>
              <div>
                <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{GENERATE_SCRIPT_TITLE}</h2>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>选择适合的内容框架</p>
              </div>
            </div>
            <div className="space-y-2">
              {SCRIPT_TYPES.map((type) => {
                const active = scriptKey === type.key;
                return (
                  <button
                    type="button"
                    key={type.key}
                    aria-pressed={active}
                    data-state={active ? 'active' : 'inactive'}
                    onClick={() => setScriptKey(type.key)}
                    className={`ikb-hovercard ikb-focusring group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all ${active ? 'shadow-sm' : 'border-[#e5e7eb] bg-[#f9f9f9]'}`}
                    style={active ? { borderColor: C.ikb, background: `${C.ikb}06` } : undefined}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm`}
                      style={active ? { background: C.grad, color: '#fff' } : { background: C.base, color: '#6b7280' }}
                    >
                      <span className="material-symbols-outlined text-[22px]" aria-hidden={true}>{SCRIPT_TYPE_ICONS[type.key] ?? 'article'}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{type.label}</span>
                      <span className="block text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{type.desc}</span>
                    </span>
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all"
                      style={active ? { background: C.ikb, color: '#fff' } : { border: `1px solid ${C.line}`, background: C.paper, color: 'transparent' }}
                    >
                      <span className="material-symbols-outlined text-[12px]" aria-hidden={true}>check</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

        </div>

        {/* 右列:爆款元素 + 文案主题 + 生成结果 */}
        <div className="space-y-5">
          {/* ── GenerateElementsPicker inline ── */}
          <section
            className="rounded-xl border p-5"
            style={{ borderColor: C.line, background: C.paper }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.burgundy}12`, color: C.burgundy }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>local_fire_department</span>
              </span>
              <div>
                <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{GENERATE_ELEMENTS_TITLE}</h2>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>多选 · 已选 {elementKeys.length} 个</p>
              </div>
            </div>
            <div className="space-y-4">
              {HOT_ELEMENT_GROUPS.map((cat) => {
                const cc = CATEGORY_COLORS[cat.key] ?? CATEGORY_COLORS['classic']!;
                return (
                  <div key={cat.key}>
                    <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide" style={{ color: cc.text }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cc.dot }} />
                      {cat.label}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((el) => {
                        const selected = elementKeys.includes(el.key);
                        return (
                          <button
                            type="button"
                            key={el.key}
                            aria-pressed={selected}
                            data-state={selected ? 'active' : 'inactive'}
                            onClick={() => handleToggleElement(el.key)}
                            className={`ikb-hovercard ikb-focusring inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all ${selected ? '' : 'border-[#e5e7eb] bg-[#f9f9f9] text-[#6b7280]'}`}
                            style={selected ? { borderColor: C.ikb, background: `${C.ikb}06`, color: C.ikb } : undefined}
                          >
                            <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>{ELEMENT_ICONS[el.key] ?? 'label'}</span>
                            {el.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── GenerateTopicForm inline ── */}
          <section
            className="rounded-xl border p-5"
            style={{ borderColor: C.line, background: C.paper }}
          >
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="gn-topic"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="mr-1 inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                  aria-hidden={true}
                />
                {GENERATE_TOPIC_TITLE}
              </label>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                <span className="material-symbols-outlined text-[14px]" style={{ color: C.burgundy }} aria-hidden={true}>auto_awesome</span>
                AI 据此生成爆款文案
              </span>
            </div>
            <div
              className="overflow-hidden rounded-xl border transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
              style={{ borderColor: C.line, background: C.base }}
            >
              <textarea
                id="gn-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={GENERATE_TOPIC_MAXLEN}
                rows={4}
                placeholder="输入文案主题，例如：如何在3天内涨粉1万"
                className="ikb-input w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed"
                style={{ color: C.ink, fontFamily: F.cn }}
              />
              <div
                className="flex items-center justify-between gap-3 border-t px-4 py-2.5"
                style={{ borderColor: C.line, background: `${C.paper}99` }}
              >
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>支持中英文 · 越具体效果越好</span>
                <span className="shrink-0 tabular-nums text-[11px]" style={{ color: '#6b7280', fontFamily: F.mono }}>{topic.length}/{GENERATE_TOPIC_MAXLEN}</span>
              </div>
            </div>
            {currentScript && (
              <div
                className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2.5"
                style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}08` }}
              >
                <span className="material-symbols-outlined text-[16px]" style={{ color: C.ikb }} aria-hidden={true}>{SCRIPT_TYPE_ICONS[currentScript.key] ?? 'article'}</span>
                <div>
                  <span className="text-[12px] font-bold" style={{ color: C.ikb, fontFamily: F.cn }}>当前：{currentScript.label}</span>
                  <span className="ml-1.5 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{currentScript.desc}</span>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                style={{ fontFamily: F.mono }}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_awesome</span>
                {topic.trim() ? GENERATE_CTA : '请输入主题'}
              </button>
            </div>
          </section>

          {/* ── GenerateResult inline ── */}
          <section
            className="ikb-hovercard overflow-hidden rounded-xl border"
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
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>article</span>
                </span>
                <div>
                  <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{GENERATE_RESULT_TITLE}</h2>
                  <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>基于「{currentScript?.label ?? '脚本类型'}」框架 · AI 深度生成</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="ikb-focusring flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors"
                  style={{ borderColor: C.line, color: '#6b7280', fontFamily: F.cn }}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>content_copy</span>
                  {GENERATE_BTN_COPY}
                </button>
                <button
                  type="button"
                  onClick={handleOptimize}
                  className="ikb-focusring flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors"
                  style={{ borderColor: C.ikb, color: C.ikb, background: 'transparent', fontFamily: F.cn }}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>auto_fix_high</span>
                  {GENERATE_BTN_AI_OPT}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="ikb-focusring flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors"
                  style={{ borderColor: C.line, color: '#6b7280', fontFamily: F.cn }}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>refresh</span>
                  {GENERATE_BTN_RESTART}
                </button>
              </div>
            </div>

            {/* 8 段 mock 文案 · 渐变 chip 头 · whitespace-pre-wrap · 无 line-clamp */}
            <div className="space-y-0">
              {GENERATE_RESULT_PARAGRAPHS.map((para, idx) => {
                // 三色轮转: 蓝 → 玫红 → 紫 → 蓝
                const chipSchemes = [
                  { bg: C.grad, text: '#fff' },
                  { bg: `linear-gradient(135deg, ${C.burgundy}, #c4304e)`, text: '#fff' },
                  { bg: `linear-gradient(135deg, ${C.accent3}, #5e2db8)`, text: '#fff' },
                ];
                const cs = chipSchemes[idx % chipSchemes.length]!;
                return (
                  <div
                    key={para.label}
                    className="px-6 py-5"
                    style={idx < GENERATE_RESULT_PARAGRAPHS.length - 1 ? { borderBottom: `1px solid ${C.line}` } : undefined}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: cs.bg, color: cs.text, fontFamily: F.mono }}
                      >
                        {para.label}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: C.ink, fontFamily: F.cn }}>
                      {para.body}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 底部反馈 row */}
            <div
              className="flex items-center gap-3 border-t px-6 py-4 text-[12px]"
              style={{ borderColor: C.line, color: '#6b7280', fontFamily: F.cn }}
            >
              <span>{GENERATE_FEEDBACK_PROMPT}</span>
              <button
                type="button"
                aria-label="有帮助"
                className="ikb-focusring flex items-center gap-1 rounded-lg border px-2 py-1 text-[12px] transition-colors"
                style={{ borderColor: C.line, color: '#6b7280' }}
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>thumb_up</span>
                有帮助
              </button>
              <button
                type="button"
                aria-label="无帮助"
                className="ikb-focusring flex items-center gap-1 rounded-lg border px-2 py-1 text-[12px] transition-colors"
                style={{ borderColor: C.line, color: '#6b7280' }}
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>thumb_down</span>
                无帮助
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
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
        {/* 文案爆款力雷达 */}
        <div
          className="ikb-hovercard col-span-5 rounded-xl border p-6"
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
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>文案爆款力雷达</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>84</p>
              <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>综合分</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS_GN;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="文案爆款力雷达图">
                <defs>
                  <linearGradient id="gen-radarFill" x1="0" y1="0" x2="0" y2="1">
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
                <polygon points={dataPoly} fill="url(#gen-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
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
            {RADAR_DIMS_GN.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 文案结构曲线 */}
        <div
          className="ikb-hovercard col-span-7 rounded-xl border p-6"
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
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>文案结构曲线</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>近 12 周文案结构趋势</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['权重', '强度', '转化'].map((t, i) => (
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
            <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>96</p>
            <span
              className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>+230%
            </span>
            <span className="mb-1 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>较基准值</span>
          </div>
          {(() => {
            const data = TREND_DATA_GN;
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
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="文案结构曲线图">
                <defs>
                  <linearGradient id="gen-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gen-trendLine" x1="0" y1="0" x2="1" y2="0">
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
                <path d={area} fill="url(#gen-trendFill)" />
                <path d={line} fill="none" stroke="url(#gen-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) =>
                  i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
            {TREND_LABELS_GN.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </IKBLayout>
  );
}
