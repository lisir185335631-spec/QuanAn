import '@/styles/ikb-hero.css';

import { useState } from 'react';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
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

// ── Material Symbols icon 映射(section id → icon name)──────────────────────
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
  ai_video: 'movie',
  voice_chat: 'mic',
  deep_learning: 'school',
  video_production: 'movie',
  acquisition_video: 'target',
};

// ── 三色轮转 ──────────────────────────────────────────────────────────────────
const ACCENT_CYCLE = [C.ikb, C.burgundy, C.accent3] as const;

// ── KPI 概览数据 ──────────────────────────────────────────────────────────────
const KPI_ITEMS = [
  {
    label: '功能模块',
    value: String(GUIDE_SECTIONS_14.length),
    unit: '个',
    icon: 'grid_view',
    color: C.ikb,
    bg: `${C.ikb}1a`,
  },
  {
    label: '推荐流程步骤',
    value: String(GUIDE_FLOW.length),
    unit: '步',
    icon: 'route',
    color: C.burgundy,
    bg: `${C.burgundy}1a`,
  },
  {
    label: 'FAQ 问题',
    value: String(GUIDE_FAQS_5.length),
    unit: '条',
    icon: 'quiz',
    color: C.accent3,
    bg: `${C.accent3}1a`,
  },
  {
    label: '最佳实践技巧',
    value: String(GUIDE_SECTIONS_14.reduce((acc, s) => acc + s.tips.length, 0)),
    unit: '条',
    icon: 'lightbulb',
    color: C.ikb,
    bg: `${C.ikb}1a`,
  },
];

// ── GuideChip · IKB Header ────────────────────────────────────────────────────
function GuideChip() {
  return (
    <header
      data-testid="guide-chip"
      style={{ marginBottom: 32, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}
    >
      <div style={{ flexShrink: 0 }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              borderRadius: 8,
              border: `1px solid ${C.line}`,
              background: C.base,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: C.ink,
              fontFamily: F.mono,
            }}
          >
            更多
          </span>
          <span
            style={{
              borderRadius: 8,
              border: `1px solid ${C.ikb}50`,
              background: `${C.ikb}12`,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: C.purpleText,
              fontFamily: F.mono,
            }}
          >
            使用说明
          </span>
        </div>
        <h1
          data-testid="guide-chip-title"
          className="ikb-gradtext"
          style={{ whiteSpace: 'nowrap', fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: F.display, margin: 0 }}
        >
          {GUIDE_CHIP_TITLE}
        </h1>
        <p
          data-testid="guide-chip-subtitle"
          style={{ marginTop: 8, maxWidth: 820, fontSize: 16, lineHeight: 1.6, color: '#5A6173', fontFamily: F.cn }}
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
      {KPI_ITEMS.map((k) => (
        <div
          key={k.label}
          className="ikb-hovercard"
          style={{
            borderRadius: 12,
            border: `1px solid ${C.line}`,
            background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                display: 'flex',
                height: 36,
                width: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: k.bg,
                color: k.color,
              }}
            >
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {k.icon}
              </span>
            </span>
          </div>
          <p style={{ marginTop: 12, fontSize: 28, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: '12px 0 0' }}>
            {k.value}
            <span style={{ marginLeft: 4, fontSize: 14, fontWeight: 700, color: '#6b7280', fontFamily: F.cn }}>{k.unit}</span>
          </p>
          <p style={{ marginTop: 4, fontSize: 12, fontWeight: 500, color: '#6b7280', fontFamily: F.cn }}>{k.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── FlowSection · IKB 时间线 ──────────────────────────────────────────────────
const FLOW_ICON_MAP: Record<string, string> = {
  深度学习: 'school',
  设计变现: 'payments',
  创作内容: 'auto_awesome',
  制作视频: 'movie',
  私域成交: 'groups',
};

function FlowCard({ step, index }: { step: FlowStep; index: number }) {
  const color = ACCENT_CYCLE[index % ACCENT_CYCLE.length];
  return (
    <div
      data-testid={`flow-card-${index}`}
      className="ikb-hovercard"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: C.paper,
        padding: 16,
        textAlign: 'center',
      }}
    >
      <span
        style={{
          display: 'flex',
          height: 48,
          width: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: color,
          color: '#fff',
        }}
      >
        <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 22 }}>
          {FLOW_ICON_MAP[step.name] ?? 'chevron_right'}
        </span>
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>{step.name}</span>
      <span style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>{step.sub}</span>
    </div>
  );
}

function FlowSection() {
  return (
    <section
      data-testid="flow-section"
      style={{
        marginBottom: 32,
        overflow: 'hidden',
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            display: 'flex',
            height: 36,
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: `${C.ikb}12`,
            color: C.ikb,
          }}
        >
          <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
            rocket_launch
          </span>
        </span>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn }}>{GUIDE_FLOW_TITLE}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
        {GUIDE_FLOW.map((step, i) => (
          <div key={step.name} style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 12 }}>
            <FlowCard step={step} index={i} />
            {i < GUIDE_FLOW.length - 1 && (
              <span
                data-testid={`flow-arrow-${i}`}
                aria-hidden={true}
                className="material-symbols-outlined"
                style={{ flexShrink: 0, fontSize: 20, color: C.ikb }}
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

// ── SectionAccordion · IKB 折叠卡 ────────────────────────────────────────────
function SectionAccordion({ section }: { section: GuideSection }) {
  const [isOpen, setIsOpen] = useState(true);
  const sectionIdx = GUIDE_SECTIONS_14.findIndex((s) => s.id === section.id);
  const accentColor = ACCENT_CYCLE[sectionIdx % ACCENT_CYCLE.length];

  return (
    <div
      data-testid={`section-accordion-${section.id}`}
      style={{
        overflow: 'hidden',
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: C.paper,
      }}
    >
      {/* 标题行 */}
      <button
        data-testid={`section-header-${section.id}`}
        type="button"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? '收起' : '展开'} ${section.name}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="ikb-focusring"
        style={{
          display: 'flex',
          width: '100%',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 20,
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.base; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              display: 'flex',
              height: 44,
              width: 44,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: accentColor,
              color: '#fff',
            }}
          >
            <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {SECTION_ICON_MAP[section.id] ?? 'help_outline'}
            </span>
          </span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn }}>{section.name}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontFamily: F.cn }}>{section.sub}</p>
          </div>
        </div>
        <span
          aria-hidden={true}
          className="material-symbols-outlined"
          style={{
            flexShrink: 0,
            fontSize: 22,
            color: '#6b7280',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          expand_more
        </span>
      </button>

      {/* 展开内容 */}
      {isOpen && (
        <div
          data-testid={`section-body-${section.id}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 20px 20px' }}
        >
          {/* 步骤列表 */}
          <ol data-testid="section-steps-list" style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
            {section.steps.map((step, i) => (
              <li key={step.title} style={{ display: 'flex', gap: 12 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 32,
                    width: 32,
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#fff',
                    background: accentColor,
                    fontFamily: F.mono,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, paddingTop: 2 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn }}>{step.title}</p>
                  <p style={{ marginTop: 4, whiteSpace: 'pre-line', fontSize: 13, lineHeight: 1.6, color: '#5A6173', fontFamily: F.cn }}>
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
              style={{
                borderRadius: 8,
                border: `1px solid ${C.line}`,
                background: C.base,
                padding: 16,
              }}
            >
              <h4
                style={{
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.ink,
                  margin: '0 0 12px',
                  fontFamily: F.cn,
                }}
              >
                <span
                  aria-hidden={true}
                  className="material-symbols-outlined"
                  style={{ fontSize: 17, color: accentColor }}
                >
                  lightbulb
                </span>
                {GUIDE_TIPS_TITLE}
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
                {section.tips.map((tip) => (
                  <li key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span
                      aria-hidden={true}
                      className="material-symbols-outlined"
                      style={{ marginTop: 2, flexShrink: 0, fontSize: 16, color: '#166534' }}
                    >
                      check_circle
                    </span>
                    <span style={{ fontSize: 13, lineHeight: 1.6, color: '#5A6173', fontFamily: F.cn }}>{tip}</span>
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

// ── FAQSection · IKB Q&A 折叠卡 ──────────────────────────────────────────────
function FaqCard({ faq, index }: { faq: FAQ; index: number }) {
  const color = ACCENT_CYCLE[index % ACCENT_CYCLE.length];
  return (
    <div
      data-testid={`faq-card-${index}`}
      className="ikb-hovercard"
      style={{
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: C.paper,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span
          aria-hidden={true}
          className="material-symbols-outlined"
          style={{ marginTop: 2, flexShrink: 0, fontSize: 18, color }}
        >
          quiz
        </span>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn }}>{faq.q}</p>
      </div>
      <p style={{ paddingLeft: 30, fontSize: 13, lineHeight: 1.6, color: '#5A6173', fontFamily: F.cn }}>{faq.a}</p>
    </div>
  );
}

function FAQSection() {
  return (
    <section data-testid="faq-section">
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            display: 'flex',
            height: 36,
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: `${C.burgundy}12`,
            color: C.burgundy,
          }}
        >
          <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
            help
          </span>
        </span>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn }}>{GUIDE_FAQ_TITLE}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
    <IKBLayout>
      {/* ── 页面 Header ──────────────────────────────────────────── */}
      <GuideChip />

      {/* ── KPI 概览 ──────────────────────────────────────────────── */}
      <KpiOverview />

      {/* ── 推荐使用流程(仅无搜索时显示)────────────────────────── */}
      {!searchQuery && <FlowSection />}

      {/* ── 搜索框 ────────────────────────────────────────────────── */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderRadius: 12,
          border: `1px solid ${C.line}`,
          background: C.paper,
          padding: '12px 16px',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = C.ikb;
          el.style.boxShadow = `0 0 0 1px ${C.ikb}`;
        }}
        onBlur={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = C.line;
          el.style.boxShadow = '';
        }}
      >
        <span
          aria-hidden={true}
          className="material-symbols-outlined"
          style={{ flexShrink: 0, fontSize: 22, color: '#6b7280' }}
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
          className="ikb-input"
          style={{ flex: 1, background: 'transparent', fontSize: 14, color: C.ink, fontFamily: F.cn }}
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="清除搜索"
            onClick={() => setSearchQuery('')}
            className="ikb-focusring"
            style={{ flexShrink: 0, color: '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s', padding: 0 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ink; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
          >
            <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        )}
      </div>

      {/* ── 14 Section 折叠卡 ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((section) => (
          <SectionAccordion key={section.id} section={section} />
        ))}
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <FAQSection />
      </div>
    </IKBLayout>
  );
}
