import { motion } from 'framer-motion';
import { useState } from 'react';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import {
  GUIDE_CHIP_SUBTITLE,
  GUIDE_CHIP_TITLE,
  GUIDE_FAQ_TITLE,
  GUIDE_FAQS_4,
  GUIDE_FLOW,
  GUIDE_FLOW_TITLE,
  GUIDE_SEARCH_PLACEHOLDER,
  GUIDE_SECTIONS_12,
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
  deep_learning: 'school',
  video_production: 'movie',
};

// ── 三色轮转(液态玻璃冷蓝体系)────────────────────────────────────────────
const ACCENT_CYCLE = [C.ikb, C.yellow, C.accent3] as const;

// ── KPI 概览数据 ──────────────────────────────────────────────────────────────
const KPI_ITEMS = [
  {
    label: '功能模块',
    value: String(GUIDE_SECTIONS_12.length),
    unit: '个',
    icon: 'grid_view',
    color: C.ikb,
    bg: 'rgba(168,197,224,0.18)',
  },
  {
    label: '推荐流程步骤',
    value: String(GUIDE_FLOW.length),
    unit: '步',
    icon: 'route',
    color: C.yellow,
    bg: 'rgba(228,238,255,0.18)',
  },
  {
    label: 'FAQ 问题',
    value: String(GUIDE_FAQS_4.length),
    unit: '条',
    icon: 'quiz',
    color: C.accent3,
    bg: 'rgba(168,197,224,0.18)',
  },
  {
    label: '最佳实践技巧',
    value: String(GUIDE_SECTIONS_12.reduce((acc, s) => acc + s.tips.length, 0)),
    unit: '条',
    icon: 'lightbulb',
    color: C.ikb,
    bg: 'rgba(168,197,224,0.18)',
  },
];

// ── GuideChip · 液态玻璃 Header ──────────────────────────────────────────────
function GuideChip() {
  return (
    <header
      data-testid="guide-chip"
      style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}
    >
      <div style={{ flexShrink: 0 }}>
        {/* chip 标签行 */}
        <Reveal style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
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
            更多
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
            使用说明
          </span>
        </Reveal>
        {/* 主标题 — 冷蓝渐变字 */}
        <h1
          data-testid="guide-chip-title"
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
          {GUIDE_CHIP_TITLE}
        </h1>
        <p
          data-testid="guide-chip-subtitle"
          style={{
            marginTop: 10,
            maxWidth: 820,
            fontSize: 16,
            lineHeight: 1.6,
            color: C.burgundyText,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          {GUIDE_CHIP_SUBTITLE}
        </p>
      </div>
    </header>
  );
}

// ── KPI 概览(液态玻璃卡)─────────────────────────────────────────────────────
function KpiOverview() {
  return (
    <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
      {KPI_ITEMS.map((k) => (
        <Item key={k.label} style={{ height: '100%' }}>
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
                  height: 38,
                  width: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: k.bg,
                  color: k.color,
                }}
              >
                <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {k.icon}
                </span>
              </span>
            </div>
            <p style={{ marginTop: 14, fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
              {k.value}
              <span style={{ marginLeft: 4, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{k.unit}</span>
            </p>
            <p style={{ marginTop: 6, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{k.label}</p>
          </motion.div>
        </Item>
      ))}
    </RevealGroup>
  );
}

// ── FlowSection · 液态玻璃时间线 ──────────────────────────────────────────────
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
    <motion.div
      data-testid={`flow-card-${index}`}
      className="lg-glass lg-spec"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        borderRadius: 16,
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
          background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
          color,
        }}
      >
        <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 22 }}>
          {FLOW_ICON_MAP[step.name] ?? 'chevron_right'}
        </span>
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{step.name}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{step.sub}</span>
    </motion.div>
  );
}

function FlowSection() {
  return (
    <Reveal>
      <section
        data-testid="flow-section"
        className="lg-glass"
        style={{
          marginBottom: 36,
          overflow: 'hidden',
          borderRadius: 20,
          padding: 28,
        }}
      >
        <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              display: 'flex',
              height: 38,
              width: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: 'rgba(168,197,224,0.22)',
              color: C.ikb,
            }}
          >
            <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
              rocket_launch
            </span>
          </span>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{GUIDE_FLOW_TITLE}</h2>
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
    </Reveal>
  );
}

// ── SectionAccordion · 液态玻璃折叠卡 ────────────────────────────────────────
function SectionAccordion({ section }: { section: GuideSection }) {
  const [isOpen, setIsOpen] = useState(true);
  const sectionIdx = GUIDE_SECTIONS_12.findIndex((s) => s.id === section.id);
  const accentColor = ACCENT_CYCLE[sectionIdx % ACCENT_CYCLE.length];

  return (
    <div
      data-testid={`section-accordion-${section.id}`}
      className="lg-glass"
      style={{
        overflow: 'hidden',
        borderRadius: 18,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 标题行 */}
      <button
        data-testid={`section-header-${section.id}`}
        type="button"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? '收起' : '展开'} ${section.name}`}
        onClick={() => setIsOpen((prev) => !prev)}
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
          transition: 'background 0.2s',
          outline: 'none',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        onFocus={(e) => { (e.currentTarget as HTMLButtonElement).style.outline = `2px solid ${C.ikb}`; (e.currentTarget as HTMLButtonElement).style.outlineOffset = '-2px'; }}
        onBlur={(e) => { (e.currentTarget as HTMLButtonElement).style.outline = 'none'; }}
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
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(168,197,224,0.4), rgba(120,160,220,0.25))',
              color: accentColor,
            }}
          >
            <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {SECTION_ICON_MAP[section.id] ?? 'help_outline'}
            </span>
          </span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{section.name}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>{section.sub}</p>
          </div>
        </div>
        <span
          aria-hidden={true}
          className="material-symbols-outlined"
          style={{
            flexShrink: 0,
            fontSize: 22,
            color: 'rgba(255,255,255,0.8)',
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
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            padding: '0 20px 20px',
            borderTop: `0.5px solid ${C.line}`,
          }}
        >
          {/* 步骤列表 */}
          <ol data-testid="section-steps-list" style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '16px 0 0', padding: 0, listStyle: 'none' }}>
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
                    background: 'linear-gradient(135deg, rgba(168,197,224,0.6), rgba(120,160,220,0.4))',
                    fontFamily: F.mono,
                    textShadow: C.textShadow,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, paddingTop: 2 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{step.title}</p>
                  <p style={{ marginTop: 4, whiteSpace: 'pre-line', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', fontFamily: F.cn }}>
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
              className="lg-glass"
              style={{
                borderRadius: 12,
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
                  textShadow: C.textShadow,
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
                      style={{ marginTop: 2, flexShrink: 0, fontSize: 16, color: C.ikb }}
                    >
                      check_circle
                    </span>
                    <span style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{tip}</span>
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

// ── FAQSection · 液态玻璃 Q&A 折叠卡 ──────────────────────────────────────────
function FaqCard({ faq, index }: { faq: FAQ; index: number }) {
  const color = ACCENT_CYCLE[index % ACCENT_CYCLE.length];
  return (
    <Item style={{ height: '100%' }}>
      <motion.div
        data-testid={`faq-card-${index}`}
        className="lg-glass lg-spec"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{
          borderRadius: 18,
          padding: 22,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span
            aria-hidden={true}
            className="material-symbols-outlined"
            style={{ marginTop: 2, flexShrink: 0, fontSize: 18, color }}
          >
            quiz
          </span>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{faq.q}</p>
        </div>
        <p style={{ paddingLeft: 30, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, marginTop: 'auto' }}>{faq.a}</p>
      </motion.div>
    </Item>
  );
}

function FAQSection() {
  return (
    <section data-testid="faq-section">
      <Reveal style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            display: 'flex',
            height: 38,
            width: 38,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: 'rgba(168,197,224,0.22)',
            color: C.ikb,
          }}
        >
          <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
            help
          </span>
        </span>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{GUIDE_FAQ_TITLE}</h2>
      </Reveal>
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {GUIDE_FAQS_4.map((faq, i) => (
          <FaqCard key={faq.q} faq={faq} index={i} />
        ))}
      </RevealGroup>
    </section>
  );
}

// ── Guide · 主页面 ────────────────────────────────────────────────────────────
export default function Guide() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery
    ? GUIDE_SECTIONS_12.filter(
        (s) => s.name.includes(searchQuery) || s.sub.includes(searchQuery),
      )
    : GUIDE_SECTIONS_12;

  return (
    <LiquidShell>
      {/* ── 页面 Header ──────────────────────────────────────────── */}
      <GuideChip />

      {/* ── KPI 概览 ──────────────────────────────────────────────── */}
      <KpiOverview />

      {/* ── 推荐使用流程(仅无搜索时显示)────────────────────────── */}
      {!searchQuery && <FlowSection />}

      {/* ── 搜索框(液态玻璃)──────────────────────────────────────── */}
      <div
        className="lg-glass"
        style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderRadius: 16,
          padding: '12px 18px',
          transition: 'box-shadow 0.2s',
        }}
        onFocus={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = `0 0 0 2px rgba(168,197,224,0.6), 0 26px 52px -14px rgba(8,20,48,0.55)`;
        }}
        onBlur={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = '';
        }}
      >
        <span
          aria-hidden={true}
          className="material-symbols-outlined"
          style={{ flexShrink: 0, fontSize: 22, color: C.ikb }}
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
          style={{
            flex: 1,
            minWidth: 0,
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: C.ink,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="清除搜索"
            onClick={() => setSearchQuery('')}
            style={{
              flexShrink: 0,
              color: 'rgba(255,255,255,0.8)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s',
              padding: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ink; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; }}
          >
            <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        )}
      </div>

      {/* ── 14 Section 折叠卡 ────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {filtered.map((section) => (
          <Item key={section.id} style={{ height: '100%' }}>
            <SectionAccordion section={section} />
          </Item>
        ))}
      </RevealGroup>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <div style={{ marginTop: 40 }}>
        <FAQSection />
      </div>
    </LiquidShell>
  );
}
