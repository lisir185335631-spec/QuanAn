import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  HOME_MATRIX,
  HOME_PROGRESS_TITLE,
  HOME_PROGRESS_VIEW_PLAN,
  HOME_PROGRESS_VIEW_PLAN_HREF,
  HOME_READY_CTA,
  HOME_READY_CTA_HREF,
  HOME_READY_SUBTITLE,
  HOME_READY_TITLE,
  HOME_STATS,
  HOME_STEPS,
  HOME_WORKFLOW_STEPS,
} from '@/lib/constants/home-next';

import { C, Card, F, Item, Magnetic, Reveal, RevealGroup, SectionHead } from './system';

// 液态玻璃三色轮转:冷蓝亮 / 冰蓝 / 同 — 大数字 + 分组标题 + 工作流编号
const GROUP_ACCENT = [C.ikb, C.yellow, C.accent3];
const STAT_COLORS = [C.ikb, C.yellow, C.accent3];
const WF_COLORS = [C.ikb, C.yellow, C.accent3];

const SECTION: React.CSSProperties = { paddingBottom: 48 };

// ── 01 进度 ──────────────────────────────────────────────────────────────────
export function ProgressIKB() {
  return (
    <section style={SECTION}>
      <SectionHead index="01" kicker="Progress" title={HOME_PROGRESS_TITLE} />
      <div className="lg-glass" style={{ borderRadius: 20, overflow: 'hidden' }}>
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)' }}>
          {HOME_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Item key={s.label} style={{ height: '100%' }}>
                <motion.div whileHover={{ backgroundColor: 'rgba(168,197,224,0.15)' }} transition={{ duration: 0.2 }}>
                  <Link
                    to={s.href}
                    style={{ display: 'block', height: '100%', padding: '14px 6px', textAlign: 'center', textDecoration: 'none', borderLeft: i === 0 ? 'none' : `1px solid ${C.line}` }}
                  >
                    <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: C.ikb, textShadow: C.textShadow }}>{String(i + 1).padStart(2, '0')}</div>
                    <div style={{ color: C.ikb, display: 'flex', justifyContent: 'center', margin: '8px 0 6px' }}>
                      <Icon size={20} strokeWidth={2.4} />
                    </div>
                    <div style={{ fontFamily: F.cn, fontSize: 20, fontWeight: 700, color: C.ink, textShadow: C.textShadow }}>{s.label}</div>
                  </Link>
                </motion.div>
              </Item>
            );
          })}
        </RevealGroup>
      </div>
      <Reveal style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ flex: 1, height: 6, background: C.line, position: 'relative', borderRadius: 3 }}>
          <div style={{ position: 'absolute', inset: 0, background: C.grad, borderRadius: 3 }} />
        </div>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 50,
            lineHeight: 1,
            background: C.grad,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          100%
        </div>
        <Magnetic strength={0.3}>
          <Link
            to={HOME_PROGRESS_VIEW_PLAN_HREF}
            className="lg-gradbtn"
            style={{ display: 'inline-block', fontFamily: F.cn, fontWeight: 700, fontSize: 14, padding: '11px 26px', textDecoration: 'none', borderRadius: 9999 }}
          >
            {HOME_PROGRESS_VIEW_PLAN}
          </Link>
        </Magnetic>
      </Reveal>
    </section>
  );
}

// ── 02 数据(数字滚动 count-up) ──────────────────────────────────────────────
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const target = parseInt(value, 10) || 0;
  const suffix = value.replace(/[0-9]/g, '');
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / 1100);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

export function StatsIKB() {
  return (
    <section style={SECTION}>
      <SectionHead index="02" kicker="Metrics" title="数据概览" accent={C.ikb} />
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {HOME_STATS.map((s, i) => (
          <Item key={s.label}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ scale: 1.025, y: -3 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              style={{ padding: '22px 22px', borderRadius: 20 }}
            >
              <div style={{ fontFamily: F.display, fontSize: 64, color: STAT_COLORS[i % STAT_COLORS.length], lineHeight: 0.95, textShadow: C.textShadow }}>
                <CountUp value={s.value} />
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', color: C.ink, marginTop: 8, textTransform: 'uppercase', textShadow: C.textShadow }}>{s.label}</div>
            </motion.div>
          </Item>
        ))}
      </RevealGroup>
    </section>
  );
}

// ── 03 功能矩阵(统一玻璃卡片) ─────────────────────────────────────────────
export function MatrixIKB() {
  return (
    <section style={SECTION}>
      <SectionHead index="03" kicker="Function Matrix" title="全链路功能矩阵" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {HOME_MATRIX.map((g, gi) => (
          <div key={g.groupTitle}>
            <Reveal style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: GROUP_ACCENT[gi % GROUP_ACCENT.length], letterSpacing: '0.08em', textShadow: C.textShadow }}>{String(gi + 1).padStart(2, '0')}&nbsp;/</span>
              <span style={{ fontFamily: F.display, fontSize: 24, color: C.ink, textShadow: C.textShadow }}>{g.groupTitle}</span>
            </Reveal>
            <RevealGroup style={{ display: 'grid', gridTemplateColumns: `repeat(${g.cols}, minmax(0,1fr))`, gap: 12 }}>
              {g.cards.map((c, ci) => (
                <Card key={c.title} index={String(ci + 1).padStart(2, '0')} title={c.title} desc={c.desc} href={c.href} accent={GROUP_ACCENT[gi % GROUP_ACCENT.length]} arrow={c.arrow} />
              ))}
            </RevealGroup>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 04 工作流(玻璃底 · 冷蓝渐变大字编号 · 白字标题) ──────────────────────────
export function WorkflowIKB() {
  return (
    <section style={SECTION}>
      <SectionHead index="04" kicker="Workflow" title="从 0 到变现的全流程" accent={C.ikb} />
      <div className="lg-glass" style={{ borderRadius: 20, overflow: 'hidden' }}>
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {HOME_WORKFLOW_STEPS.map((w, i) => (
          <Item key={w.num}>
            <motion.div
              whileHover={{ backgroundColor: 'rgba(168,197,224,0.12)' }}
              transition={{ duration: 0.2 }}
              style={{ padding: '18px 16px', height: '100%', borderLeft: i === 0 ? 'none' : `1px solid ${C.line}` }}
            >
              <div
                style={{
                  fontFamily: F.display,
                  fontSize: 54,
                  lineHeight: 1,
                  background: WF_COLORS[i % WF_COLORS.length] === C.ikb ? C.grad : `linear-gradient(110deg,${WF_COLORS[i % WF_COLORS.length]},#d4e6ff)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >
                {w.num}
              </div>
              <div style={{ fontFamily: F.display, fontSize: 17, color: C.ink, marginTop: 10, textShadow: C.textShadow }}>{w.title}</div>
              <div style={{ fontFamily: F.cn, fontSize: 12.5, fontWeight: 500, color: C.burgundyText, marginTop: 4 }}>{w.desc}</div>
            </motion.div>
          </Item>
        ))}
        </RevealGroup>
      </div>
    </section>
  );
}

// ── 05 立即启动(玻璃底 · 冷蓝 kicker · 白大字 · 彩虹边玻璃 CTA) ──────────────
export function ReadyIKB() {
  return (
    <section style={{ paddingTop: 16, paddingBottom: 24, textAlign: 'center' }}>
      <Reveal>
        <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.3em', color: C.ikb, textTransform: 'uppercase', marginBottom: 14, textShadow: C.textShadow }}>{HOME_READY_TITLE}</div>
        <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 66, color: C.ink, lineHeight: 1.0, margin: 0, letterSpacing: '-0.01em', textShadow: C.textShadow }}>{HOME_READY_SUBTITLE}</h2>
        <div style={{ marginTop: 26, display: 'flex', justifyContent: 'center' }}>
          <Magnetic>
            <Link
              to={HOME_READY_CTA_HREF}
              className="lg-gradbtn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: F.cn, fontWeight: 700, fontSize: 17, padding: '15px 40px', textDecoration: 'none', borderRadius: 9999 }}
            >
              <ArrowRight size={19} strokeWidth={2.6} />
              {HOME_READY_CTA}
            </Link>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}
