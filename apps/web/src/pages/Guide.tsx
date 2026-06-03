import { useState } from 'react';

import { PioneerLayout } from '@/layouts/PioneerLayout';
import {
  GUIDE_CHIP_SUBTITLE,
  GUIDE_CHIP_TITLE,
  GUIDE_FAQ_TITLE,
  GUIDE_FAQS_5,
  GUIDE_FLOW,
  GUIDE_FLOW_TITLE,
  GUIDE_SEARCH_PLACEHOLDER,
  GUIDE_SECTIONS_14,
  GUIDE_TIPS_TITLE,
  type FAQ,
  type FlowStep,
  type GuideSection,
} from '@/lib/constants/guide';

// ── 先锋白品牌三主色 ──────────────────────────────────────────────────────────
// 蓝 #002FA7 / 暖黄 #F6D300 (文字深金 #8A6A00, 黄底深色 #221b00) / 勃艮第 #781621
// 绿 #10b981 状态色

// ── 先锋白 Material Symbols icon 映射(section id → icon name)──────────────────
const SECTION_ICON_MAP: Record<string, string> = {
  system_overview: 'shield',
  trending_library: 'trending_up',
  trending_analysis: 'video_library',
  presentation_forms: 'view_carousel',
  monetization_model: 'payments',
  private_domain: 'groups',
  trending_generation: 'bolt',
  content_generation: 'auto_awesome',
  content_analysis: 'manage_search',
  ai_video: 'clapperboard',
  voice_chat: 'mic',
  deep_learning: 'school',
  video_production: 'movie',
  acquisition_video: 'target',
};

// ── KPI 概览数据 ──────────────────────────────────────────────────────────────
const KPI_ITEMS = [
  {
    label: '功能模块',
    value: String(GUIDE_SECTIONS_14.length),
    unit: '个',
    icon: 'grid_view',
    color: '#002fa7',
    bg: '#e8eeff',
  },
  {
    label: '推荐流程步骤',
    value: String(GUIDE_FLOW.length),
    unit: '步',
    icon: 'route',
    color: '#781621',
    bg: '#fce8ea',
  },
  {
    label: 'FAQ 问题',
    value: String(GUIDE_FAQS_5.length),
    unit: '条',
    icon: 'quiz',
    color: '#8a6a00',
    bg: '#fff9e0',
  },
  {
    label: '最佳实践技巧',
    value: String(GUIDE_SECTIONS_14.reduce((acc, s) => acc + s.tips.length, 0)),
    unit: '条',
    icon: 'lightbulb',
    color: '#002fa7',
    bg: '#e8eeff',
  },
];

// ── GuideChip · 先锋白 Header ─────────────────────────────────────────────────
function GuideChip() {
  return (
    <header
      data-testid="guide-chip"
      className="mb-8 flex flex-row items-center justify-between gap-8"
    >
      <div className="shrink-0">
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
            更多
          </span>
          <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
            使用说明
          </span>
        </div>
        <h1
          data-testid="guide-chip-title"
          className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]"
        >
          {GUIDE_CHIP_TITLE}
        </h1>
        <p
          data-testid="guide-chip-subtitle"
          className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]"
        >
          {GUIDE_CHIP_SUBTITLE}
        </p>
      </div>
    </header>
  );
}

// ── KPI 概览 ──────────────────────────────────────────────────────────────────
function KpiOverview() {
  return (
    <div className="mb-8 grid grid-cols-4 gap-5">
      {KPI_ITEMS.map((k) => (
        <div
          key={k.label}
          className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: k.bg, color: k.color }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {k.icon}
              </span>
            </span>
          </div>
          <p
            className="mt-3 text-[28px] font-extrabold leading-none text-[#111827]"
          >
            {k.value}
            <span className="ml-1 text-[14px] font-bold text-[#6b7280]">{k.unit}</span>
          </p>
          <p className="mt-1 text-[12px] font-medium text-[#6b7280]">{k.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── FlowSection · 先锋白时间线 ───────────────────────────────────────────────
const FLOW_ICON_MAP: Record<string, string> = {
  深度学习: 'school',
  设计变现: 'payments',
  创作内容: 'auto_awesome',
  制作视频: 'clapperboard',
  私域成交: 'groups',
};

function FlowCard({ step, index }: { step: FlowStep; index: number }) {
  const FLOW_COLORS = ['#002fa7', '#781621', '#002fa7', '#002fa7', '#781621'];
  const color = FLOW_COLORS[index % FLOW_COLORS.length];
  return (
    <div
      data-testid={`flow-card-${index}`}
      className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white p-4 text-center pw-shadow-soft"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
          {FLOW_ICON_MAP[step.name] ?? 'chevron_right'}
        </span>
      </span>
      <span className="text-[14px] font-bold text-[#111827]">{step.name}</span>
      <span className="text-[11px] text-[#6b7280]">{step.sub}</span>
    </div>
  );
}

function FlowSection() {
  return (
    <section
      data-testid="flow-section"
      className="mb-8 overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            rocket_launch
          </span>
        </span>
        <h2 className="text-[18px] font-bold text-[#111827]">{GUIDE_FLOW_TITLE}</h2>
      </div>
      <div className="flex items-stretch gap-3">
        {GUIDE_FLOW.map((step, i) => (
          <div key={step.name} className="flex flex-1 items-center gap-3">
            <FlowCard step={step} index={i} />
            {i < GUIDE_FLOW.length - 1 && (
              <span
                data-testid={`flow-arrow-${i}`}
                className="material-symbols-outlined shrink-0 text-[20px] text-[#002fa7]"
                aria-hidden="true"
              >
                chevron_right
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── SectionAccordion · 先锋白折叠卡 ─────────────────────────────────────────
function SectionAccordion({ section }: { section: GuideSection }) {
  const [isOpen, setIsOpen] = useState(true);
  const ACCENT_COLORS = [
    '#002fa7',
    '#781621',
    '#002fa7',
    '#781621',
    '#002fa7',
    '#781621',
    '#002fa7',
    '#781621',
    '#002fa7',
    '#781621',
    '#002fa7',
    '#781621',
    '#002fa7',
    '#781621',
  ];
  const sectionIdx = GUIDE_SECTIONS_14.findIndex((s) => s.id === section.id);
  const accentColor = ACCENT_COLORS[sectionIdx % ACCENT_COLORS.length];

  return (
    <div
      data-testid={`section-accordion-${section.id}`}
      className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft"
    >
      {/* 标题行 */}
      <button
        data-testid={`section-header-${section.id}`}
        type="button"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? '收起' : '展开'} ${section.name}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-[#f8f9fa]"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              {SECTION_ICON_MAP[section.id] ?? 'help_outline'}
            </span>
          </span>
          <div>
            <p className="text-[15px] font-bold text-[#111827]">{section.name}</p>
            <p className="text-[12px] text-[#6b7280]">{section.sub}</p>
          </div>
        </div>
        <span
          className={`material-symbols-outlined shrink-0 text-[22px] text-[#6b7280] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      {/* 展开内容 */}
      {isOpen && (
        <div
          data-testid={`section-body-${section.id}`}
          className="space-y-5 px-5 pb-5 pt-0"
        >
          {/* 步骤列表 */}
          <ol data-testid="section-steps-list" className="space-y-3">
            {section.steps.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 pt-0.5">
                  <p className="text-[14px] font-bold text-[#111827]">{step.title}</p>
                  <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-[#444653]">
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* 实用技巧 */}
          {section.tips.length > 0 && (
            <div
              data-testid="tips-box"
              className="rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-4"
            >
              <h4 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[#111827]">
                <span
                  className="material-symbols-outlined text-[17px]"
                  style={{ color: accentColor }}
                  aria-hidden="true"
                >
                  lightbulb
                </span>
                {GUIDE_TIPS_TITLE}
              </h4>
              <ul className="space-y-2">
                {section.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span
                      className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-[#10b981]"
                      aria-hidden="true"
                    >
                      check_circle
                    </span>
                    <span className="text-[13px] leading-relaxed text-[#444653]">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── FAQSection · 先锋白 Q&A 折叠卡 ──────────────────────────────────────────
function FaqCard({ faq, index }: { faq: FAQ; index: number }) {
  return (
    <div
      data-testid={`faq-card-${index}`}
      className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft"
    >
      <div className="mb-2 flex items-start gap-3">
        <span
          className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#F6D300]"
          style={{ WebkitTextStroke: '1px #8a6a00' }}
          aria-hidden="true"
        >
          star
        </span>
        <p className="text-[15px] font-bold text-[#111827]">{faq.q}</p>
      </div>
      <p className="pl-8 text-[13px] leading-relaxed text-[#444653]">{faq.a}</p>
    </div>
  );
}

function FAQSection() {
  return (
    <section data-testid="faq-section">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            help
          </span>
        </span>
        <h2 className="text-[18px] font-bold text-[#111827]">{GUIDE_FAQ_TITLE}</h2>
      </div>
      <div className="space-y-3">
        {GUIDE_FAQS_5.map((faq, i) => (
          <FaqCard key={faq.q} faq={faq} index={i} />
        ))}
      </div>
    </section>
  );
}

// ── Guide · 主页面 ────────────────────────────────────────────────────────────
export default function Guide() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery
    ? GUIDE_SECTIONS_14.filter(
        (s) => s.name.includes(searchQuery) || s.sub.includes(searchQuery),
      )
    : GUIDE_SECTIONS_14;

  return (
    <PioneerLayout>
      {/* ── 页面 Header ──────────────────────────────────────────── */}
      <GuideChip />

      {/* ── KPI 概览 ──────────────────────────────────────────────── */}
      <KpiOverview />

      {/* ── 推荐使用流程(仅无搜索时显示)────────────────────────── */}
      {!searchQuery && <FlowSection />}

      {/* ── 搜索框 ────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 pw-shadow-soft transition-all focus-within:border-[#002fa7] focus-within:ring-1 focus-within:ring-[#002fa7]">
        <span
          className="material-symbols-outlined shrink-0 text-[22px] text-[#9ca3af]"
          aria-hidden="true"
        >
          search
        </span>
        <label htmlFor="guide-search" className="sr-only">
          搜索功能模块
        </label>
        <input
          id="guide-search"
          type="search"
          data-testid="guide-search-input"
          placeholder={GUIDE_SEARCH_PLACEHOLDER}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9ca3af]"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="清除搜索"
            onClick={() => setSearchQuery('')}
            className="shrink-0 text-[#9ca3af] transition-colors hover:text-[#111827]"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        )}
      </div>

      {/* ── 14 Section 折叠卡 ────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map((section) => (
          <SectionAccordion key={section.id} section={section} />
        ))}
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <div className="mt-8">
        <FAQSection />
      </div>
    </PioneerLayout>
  );
}
