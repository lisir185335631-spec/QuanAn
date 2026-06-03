import { useInView } from 'framer-motion';
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
} from '@/lib/constants/home';

import { C, Card, F, Item, Magnetic, Reveal, RevealGroup, SectionHead } from './system';

// 红蓝紫三主色循环:蓝 / 玫红 / 紫 —— 大数字 + 分组标题轮转上色(统一,不再混入藏蓝)
const GROUP_ACCENT = [C.ikb, C.burgundy, C.accent3];
const STAT_COLORS = [C.ikb, C.burgundy, C.accent3];
const WF_COLORS = [C.ikb, C.burgundy, C.accent3];

const SECTION: React.CSSProperties = { paddingBottom: 48 };

// ── 01 进度 ──────────────────────────────────────────────────────────────────
export function ProgressIKB() {
  return (
    <section style={SECTION}>
      <SectionHead index="01" kicker="Progress" title={HOME_PROGRESS_TITLE} />
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', border: `1px solid ${C.line}`, background: C.paper }}>
        {HOME_STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <Item key={s.label} style={{ height: '100%' }}>
              <Link
                to={s.href}
                className="ikb-step"
                style={{ display: 'block', height: '100%', padding: '14px 6px', textAlign: 'center', textDecoration: 'none', borderLeft: i === 0 ? 'none' : `1px solid ${C.line}` }}
              >
                <div className="ikb-step-idx" style={{ fontFamily: F.mono, fontSize: 10, color: C.burgundy }}>{String(i + 1).padStart(2, '0')}</div>
                <div className="ikb-step-ic" style={{ color: C.ikb, display: 'flex', justifyContent: 'center', margin: '8px 0 6px' }}>
                  <Icon size={18} strokeWidth={1.6} />
                </div>
                <div className="ikb-step-lb" style={{ fontFamily: F.cn, fontSize: 20, fontWeight: 700, color: C.ink }}>{s.label}</div>
              </Link>
            </Item>
          );
        })}
      </RevealGroup>
      <Reveal style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ flex: 1, height: 6, background: C.line, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: C.grad }} />
        </div>
        <div className="ikb-gradtext" style={{ fontFamily: F.display, fontSize: 50, lineHeight: 1 }}>100%</div>
        <Magnetic strength={0.3}>
          <Link to={HOME_PROGRESS_VIEW_PLAN_HREF} className="ikb-gradbtn" style={{ display: 'inline-block', background: C.grad, color: '#fff', fontFamily: F.cn, fontWeight: 700, fontSize: 14, padding: '11px 22px', textDecoration: 'none' }}>
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
      <SectionHead index="02" kicker="Metrics" title="数据概览" accent={C.burgundy} />
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
        {HOME_STATS.map((s, i) => (
          <Item key={s.label} style={{ background: C.paper, padding: '22px 22px' }}>
            <div style={{ fontFamily: F.display, fontSize: 64, color: STAT_COLORS[i % STAT_COLORS.length], lineHeight: 0.95 }}>
              <CountUp value={s.value} />
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', color: C.ink, marginTop: 8, textTransform: 'uppercase' }}>{s.label}</div>
          </Item>
        ))}
      </RevealGroup>
    </section>
  );
}

// ── 03 功能矩阵(统一卡片) ───────────────────────────────────────────────────
export function MatrixIKB() {
  return (
    <section style={SECTION}>
      <SectionHead index="03" kicker="Function Matrix" title="全链路功能矩阵" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {HOME_MATRIX.map((g, gi) => (
          <div key={g.groupTitle}>
            <Reveal style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: GROUP_ACCENT[gi % GROUP_ACCENT.length], letterSpacing: '0.08em' }}>{String(gi + 1).padStart(2, '0')}&nbsp;/</span>
              <span style={{ fontFamily: F.display, fontSize: 24, color: GROUP_ACCENT[gi % GROUP_ACCENT.length] }}>{g.groupTitle}</span>
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

// ── 04 工作流(白底 · 三色轮转大字编号) ──────────────────────────────────────────
export function WorkflowIKB() {
  return (
    <section style={SECTION}>
      <SectionHead index="04" kicker="Workflow" title="从 0 到变现的全流程" accent={C.burgundy} />
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', border: `1px solid ${C.line}`, background: C.paper }}>
        {HOME_WORKFLOW_STEPS.map((w, i) => (
          <Item key={w.num} style={{ padding: '18px 16px', borderLeft: i === 0 ? 'none' : `1px solid ${C.line}` }}>
            <div style={{ fontFamily: F.display, fontSize: 54, color: WF_COLORS[i % WF_COLORS.length], lineHeight: 1 }}>{w.num}</div>
            <div style={{ fontFamily: F.display, fontSize: 17, color: C.ink, marginTop: 10 }}>{w.title}</div>
            <div style={{ fontFamily: F.cn, fontSize: 12.5, color: '#5A6173', marginTop: 4 }}>{w.desc}</div>
          </Item>
        ))}
      </RevealGroup>
    </section>
  );
}

// ── 05 立即启动(白底 · 蓝大字 + 渐变磁力 CTA) ──────────────────────────────────
export function ReadyIKB() {
  return (
    <section style={{ paddingTop: 16, paddingBottom: 24, textAlign: 'center' }}>
      <Reveal>
        <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: '0.3em', color: C.burgundyText, textTransform: 'uppercase', marginBottom: 14 }}>{HOME_READY_TITLE}</div>
        <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 66, color: C.ikb, lineHeight: 1.0, margin: 0, letterSpacing: '-0.01em' }}>{HOME_READY_SUBTITLE}</h2>
        <div style={{ marginTop: 26, display: 'flex', justifyContent: 'center' }}>
          <Magnetic>
            <Link to={HOME_READY_CTA_HREF} className="ikb-gradbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: C.grad, color: '#fff', fontFamily: F.cn, fontWeight: 700, fontSize: 17, padding: '15px 32px', textDecoration: 'none' }}>
              <ArrowRight size={19} strokeWidth={2.6} />
              {HOME_READY_CTA}
            </Link>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}
