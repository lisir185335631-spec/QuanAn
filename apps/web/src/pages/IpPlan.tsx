/**
 * /ip-plan · 我的IP方案/进度总览 — 液态玻璃皮
 *
 * 换皮规格:LiquidShell 外壳 · home-next/ikb/system C/F · lg-glass 卡 · Reveal/RevealGroup/Item 入场
 * 逻辑零改动：IP_PLAN_STEPS / completed / remaining / firstUncompleted / navigate
 * testid 全保留：ip-plan-page + header/subtitle/progress/step-list/footer 各子 testid
 */
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import {
  IP_PLAN_FOOTER_TPL,
  IP_PLAN_GO_COMPLETE,
  IP_PLAN_H1,
  IP_PLAN_NEXT_BTN,
  IP_PLAN_PROGRESS_LABEL,
  IP_PLAN_STATUS_DONE,
  IP_PLAN_STATUS_TODO,
  IP_PLAN_STEPS,
  IP_PLAN_SUBTITLE_TPL,
  IP_PLAN_VIEW_DETAIL,
  type IpPlanStep,
} from '@/lib/constants/ipPlan';

// ── KPI 卡色轮(液态玻璃冷蓝体系)──────────────────────────────────────────────
const KPI_ACCENTS = [
  {
    iconBg: 'rgba(168,197,224,0.22)',
    iconText: C.ikb,
    valColor: C.ink,
    badgeBg: 'rgba(168,197,224,0.18)',
    badgeBorder: 'rgba(168,197,224,0.45)',
    badgeText: C.ikb,
    ringTrack: 'rgba(255,255,255,0.12)',
    ringFill: C.ikb,
    icon: 'map',
  },
  {
    iconBg: 'rgba(255,255,255,0.12)',
    iconText: C.burgundy,
    valColor: C.ink,
    badgeBg: 'rgba(255,255,255,0.10)',
    badgeBorder: 'rgba(255,255,255,0.28)',
    badgeText: C.burgundyText,
    ringTrack: 'rgba(255,255,255,0.12)',
    ringFill: 'rgba(255,255,255,0.8)',
    icon: 'check_circle',
  },
  {
    iconBg: 'rgba(168,197,224,0.18)',
    iconText: C.accent3,
    valColor: C.ink,
    badgeBg: 'rgba(168,197,224,0.18)',
    badgeBorder: 'rgba(168,197,224,0.40)',
    badgeText: C.purpleText,
    ringTrack: 'rgba(255,255,255,0.12)',
    ringFill: C.grad,
    icon: 'pending_actions',
  },
  {
    iconBg: 'rgba(168,197,224,0.22)',
    iconText: C.ikb,
    valColor: C.ink,
    badgeBg: 'rgba(168,197,224,0.18)',
    badgeBorder: 'rgba(168,197,224,0.45)',
    badgeText: C.ikb,
    ringTrack: 'rgba(255,255,255,0.12)',
    ringFill: C.ikb,
    icon: 'format_list_numbered',
  },
] as const;

// ── IP 成熟度雷达六维 ─────────────────────────────────────────────────────────
const IP_RADAR_DIMS = [
  { label: '定位', value: 82, color: C.ikb },
  { label: '包装', value: 75, color: C.burgundy },
  { label: '人设', value: 88, color: C.accent3 },
  { label: '执行', value: 70, color: C.ikb },
  { label: '变现', value: 64, color: C.burgundy },
  { label: '内容', value: 78, color: C.accent3 },
];

// ── inline IpPlanHeader ───────────────────────────────────────────────────────
function IpPlanHeader({ completed, total }: { completed: number; total: number }) {
  return (
    <Reveal>
      <header
        style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}
        data-testid="ip-plan-header"
      >
        <div style={{ flexShrink: 0 }}>
          {/* chip 标签行 */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
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
              IP 方案
            </span>
          </div>
          {/* 大标题 — 冷蓝渐变字 */}
          <h1
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
            data-testid="ip-plan-h1"
          >
            {IP_PLAN_H1}
          </h1>
          <p
            style={{
              marginTop: 10,
              maxWidth: 820,
              fontSize: 16,
              lineHeight: 1.6,
              color: C.burgundyText,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
            data-testid="ip-plan-subtitle"
          >
            {IP_PLAN_SUBTITLE_TPL(completed, total)}
          </p>
        </div>
        {/* 进度追踪标签 */}
        <div
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 9999,
            border: `0.5px solid rgba(168,197,224,0.40)`,
            background: 'rgba(168,197,224,0.18)',
            backdropFilter: 'blur(12px)',
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 500,
            color: C.ink,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          <span
            aria-hidden={true}
            className="ikb-pulse"
            style={{ display: 'inline-block', height: 10, width: 10, borderRadius: '50%', background: C.ikb }}
          />
          进度追踪中
        </div>
      </header>
    </Reveal>
  );
}

// ── inline IpPlanProgressCard ─────────────────────────────────────────────────
function IpPlanProgressCard({ percent, completed, total }: { percent: number; completed: number; total: number }) {
  const dashArray = `${percent} 100`;
  return (
    <Reveal>
      <motion.section
        className="lg-glass"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{
          marginBottom: 44,
          borderRadius: 20,
          padding: 32,
        }}
        data-testid="ip-plan-progress-card"
      >
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 18,
              fontWeight: 800,
              color: C.ink,
              fontFamily: F.display,
              margin: 0,
              textShadow: C.textShadow,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 4,
                height: 14,
                borderRadius: 9999,
                background: C.grad,
                flexShrink: 0,
              }}
              aria-hidden={true}
            />
            <span data-testid="ip-plan-progress-label">{IP_PLAN_PROGRESS_LABEL}</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1,
                fontFamily: F.display,
                color: C.ink,
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}
              data-testid="ip-plan-progress-percent"
            >
              {percent}%
            </span>
            <span
              style={{
                marginBottom: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 9999,
                background: 'rgba(168,197,224,0.18)',
                border: `0.5px solid rgba(168,197,224,0.45)`,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 700,
                color: C.ikb,
                fontFamily: F.mono,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>trending_up</span>
              {completed}/{total} 已完成
            </span>
          </div>
        </div>
        {/* 品牌色进度条 */}
        <div
          style={{
            marginBottom: 16,
            height: 16,
            width: '100%',
            overflow: 'hidden',
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.10)',
          }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`IP 打造进度 ${percent}%`}
        >
          <div
            style={{ height: 16, borderRadius: 9999, background: C.grad, width: `${percent}%`, transition: 'width 0.7s ease' }}
            data-testid="ip-plan-progress-bar-fill"
          />
        </div>
        {/* 大环形进度 + 数字 */}
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48 }}>
          <div style={{ position: 'relative', display: 'flex', height: 128, width: 128, alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', height: 128, width: 128 }} aria-hidden={true}>
              <defs>
                <linearGradient id="ip-progress-grad" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%" stopColor={C.ikb} />
                  <stop offset="50%" stopColor={C.accent3} />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="url(#ip-progress-grad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={dashArray}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  lineHeight: 1,
                  fontFamily: F.display,
                  background: C.grad,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                }}
              >
                {percent}<span style={{ fontSize: 14, WebkitTextFillColor: 'rgba(255,255,255,0.84)', backgroundImage: 'none', color: 'rgba(255,255,255,0.84)' }}>%</span>
              </span>
              <span style={{ marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>完成度</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 32, rowGap: 12 }}>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: 0 }}>已完成</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>{completed}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: 0 }}>总步数</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>{total}</p>
            </div>
          </div>
        </div>
      </motion.section>
    </Reveal>
  );
}

// ── inline step row ───────────────────────────────────────────────────────────
function StepRow({ step, index }: { step: IpPlanStep; index: number }) {
  const NUM_COLORS = [C.ikb, C.burgundy, C.accent3];
  const numColor = step.done ? C.ikb : (NUM_COLORS[index % 3] ?? C.ikb);
  // icon 背景使用字面量 rgba，不做 hex+alpha 拼接
  const numBg = step.done ? 'rgba(168,197,224,0.18)' : index % 3 === 0 ? 'rgba(168,197,224,0.18)' : index % 3 === 1 ? 'rgba(255,255,255,0.12)' : 'rgba(168,197,224,0.14)';

  return (
    <motion.div
      className="lg-glass lg-spec"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{
        borderRadius: 18,
        padding: 20,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      data-testid={`ip-plan-step-card-${step.id}`}
    >
      {/* 上部：序号 + 名称 + 状态 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* 序号圆圈 */}
        <div
          style={{
            display: 'flex',
            height: 44,
            width: 44,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 800,
            fontFamily: F.mono,
            background: numBg,
            color: numColor,
            textShadow: C.textShadow,
          }}
          data-testid={`ip-plan-step-icon-circle-${index}`}
        >
          {String(index + 1).padStart(2, '0')}
        </div>
        <div>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: step.done ? C.ink : 'rgba(255,255,255,0.84)',
              fontFamily: F.cn,
              margin: '0 0 6px',
              textShadow: C.textShadow,
            }}
            data-testid={`ip-plan-step-title-${step.id}`}
          >
            {step.title}
          </h3>
          {step.done ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 9999,
                background: 'rgba(168,197,224,0.18)',
                border: `0.5px solid rgba(168,197,224,0.45)`,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 600,
                color: C.ikb,
                fontFamily: F.mono,
              }}
              data-testid={`ip-plan-step-status-${step.id}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden={true}>check_circle</span>
              {IP_PLAN_STATUS_DONE}
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.08)',
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.8)',
                fontFamily: F.mono,
              }}
              data-testid={`ip-plan-step-status-${step.id}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden={true}>radio_button_unchecked</span>
              {IP_PLAN_STATUS_TODO}
            </span>
          )}
        </div>
      </div>

      {/* 完成态 extra 行 */}
      {step.done && step.extra && (
        <div
          style={{
            marginTop: 10,
            borderTop: `0.5px solid rgba(168,197,224,0.25)`,
            paddingTop: 10,
          }}
          data-testid={`ip-plan-step-extra-${step.id}`}
        >
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>{step.extra}</p>
        </div>
      )}

      {/* 下部 meta：完成标记 + 跳转链接 · marginTop auto 贴底 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 14 }}>
        {step.done ? (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: C.ikb }}
            aria-label={`${step.title} 已完成`}
            data-testid={`ip-plan-step-check-${step.id}`}
          >
            check_circle
          </span>
        ) : (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)' }}
            aria-label={`${step.title} 未完成`}
            data-testid={`ip-plan-step-circle-${step.id}`}
          >
            radio_button_unchecked
          </span>
        )}
        <a
          href={step.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            borderRadius: 10,
            border: step.done
              ? `0.5px solid rgba(168,197,224,0.45)`
              : `0.5px solid rgba(255,255,255,0.20)`,
            background: step.done ? 'rgba(168,197,224,0.18)' : 'rgba(255,255,255,0.08)',
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: F.cn,
            color: step.done ? C.ikb : C.burgundyText,
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          data-testid={`ip-plan-step-action-${step.id}`}
        >
          {step.done ? IP_PLAN_VIEW_DETAIL : IP_PLAN_GO_COMPLETE}
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>chevron_right</span>
        </a>
      </div>
    </motion.div>
  );
}

// ── inline IpPlanStepList ─────────────────────────────────────────────────────
function IpPlanStepList({ steps }: { steps: ReadonlyArray<IpPlanStep> }) {
  return (
    <section data-testid="ip-plan-step-list">
      <Reveal style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
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
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>checklist</span>
        </span>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>步骤清单</h2>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>· 点击跳转对应步骤</span>
      </Reveal>
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {steps.map((step, index) => (
          <Item key={step.id} style={{ height: '100%' }}>
            <StepRow step={step} index={index} />
          </Item>
        ))}
      </RevealGroup>
    </section>
  );
}

// ── inline IpPlanFooter ───────────────────────────────────────────────────────
function IpPlanFooter({ remaining, onNext }: { remaining: number; onNext: () => void }) {
  return (
    <Reveal>
      <motion.section
        className="lg-glass"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{
          marginTop: 32,
          overflow: 'hidden',
          borderRadius: 20,
          padding: 32,
        }}
        data-testid="ip-plan-footer"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                display: 'flex',
                height: 48,
                width: 48,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
                color: C.ink,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden={true}>rocket_launch</span>
            </span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>继续打造你的 IP</p>
              <p
                style={{ marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '4px 0 0' }}
                data-testid="ip-plan-footer-text"
              >
                {IP_PLAN_FOOTER_TPL(remaining)}
              </p>
            </div>
          </div>
          <Magnetic strength={0.3}>
            <button
              type="button"
              onClick={onNext}
              aria-label="继续下一步"
              className="lg-gradbtn"
              style={{
                display: 'inline-flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                borderRadius: 9999,
                padding: '12px 32px',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
                fontFamily: F.cn,
                border: 'none',
              }}
              data-testid="ip-plan-next-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>arrow_forward</span>
              {IP_PLAN_NEXT_BTN}
            </button>
          </Magnetic>
        </div>
      </motion.section>
    </Reveal>
  );
}

// ── IP 成熟度雷达 ─────────────────────────────────────────────────────────────
function IpMaturityRadar() {
  const dims = IP_RADAR_DIMS;
  const cx = 130;
  const cy = 122;
  const R = 88;
  const avg = Math.round(dims.reduce((s, d) => s + d.value, 0) / dims.length);
  const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
  const pt = (i: number, r: number): [number, number] => [
    cx + r * Math.cos(ang(i)),
    cy + r * Math.sin(ang(i)),
  ];
  const poly = (r: number) =>
    dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
  const dataPoly = dims
    .map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(','))
    .join(' ');

  return (
    <Item>
      <motion.div
        className="lg-glass lg-spec"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{ borderRadius: 20, padding: 24 }}
      >
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>radar</span>
            </span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>IP 成熟度雷达</h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: 0 }}>六维模型评估</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontSize: 26,
                fontWeight: 700,
                lineHeight: 1,
                fontFamily: F.display,
                margin: 0,
                color: C.ink,
                textShadow: C.textShadow,
              }}
            >
              {avg}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: 0 }}>综合分</p>
          </div>
        </div>
        <svg viewBox="0 0 260 244" style={{ width: '100%' }} aria-hidden={true}>
          <defs>
            <linearGradient id="ip-radar-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.6)" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          ))}
          {dims.map((_, i) => {
            const [x, y] = pt(i, R);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
          })}
          <polygon
            points={dataPoly}
            fill="url(#ip-radar-fill)"
            stroke={C.ikb}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {dims.map((d, i) => {
            const [x, y] = pt(i, R * (d.value / 100));
            return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
          })}
          {dims.map((d, i) => {
            const [x, y] = pt(i, R + 16);
            return (
              <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.7)" fontSize="10.5" fontWeight="600">
                {d.label}
              </text>
            );
          })}
        </svg>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 0' }}>
          {dims.map((d) => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ height: 8, width: 8, borderRadius: '50%', background: d.color, flexShrink: 0, display: 'inline-block' }} aria-hidden={true} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono, textShadow: C.textShadow }}>{d.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </Item>
  );
}

// ── IP 进度趋势 ──────────────────────────────────────────────────────────────
function IpProgressTrend({ completed, total }: { completed: number; total: number }) {
  const trend = [10, 20, 20, 30, 44, 44, 56, 56, 44];
  const W = 560;
  const H = 168;
  const padL = 6;
  const padR = 6;
  const padT = 12;
  const padB = 8;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = 110;
  const x = (i: number) => padL + (innerW * i) / (trend.length - 1);
  const y = (v: number) => padT + innerH * (1 - v / max);
  const line = trend.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(trend.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  return (
    <Item>
      <motion.div
        className="lg-glass lg-spec"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{ borderRadius: 20, padding: 24 }}
      >
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'flex',
                height: 38,
                width: 38,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.12)',
                color: C.burgundy,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>show_chart</span>
            </span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>IP 完成进度趋势</h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: 0 }}>按步骤完成节点测算</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['进度', '步数', '剩余'].map((t, i) => (
              <span
                key={t}
                style={{
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: F.mono,
                  background: i === 0 ? 'rgba(168,197,224,0.45)' : 'rgba(255,255,255,0.08)',
                  color: i === 0 ? C.ink : 'rgba(255,255,255,0.84)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <p
            style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}
          >
            {completed}/{total}
          </p>
          <span
            style={{
              marginBottom: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              borderRadius: 9999,
              background: 'rgba(168,197,224,0.18)',
              border: `0.5px solid rgba(168,197,224,0.45)`,
              padding: '2px 8px',
              fontSize: 12,
              fontWeight: 700,
              color: C.ikb,
              fontFamily: F.mono,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>trending_up</span>
            步骤完成
          </span>
          <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>持续推进中</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} aria-hidden={true}>
          <defs>
            <linearGradient id="ip-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.ikb} stopOpacity="0.30" />
              <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ip-trend-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.ikb} />
              <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
            </linearGradient>
          </defs>
          {[0, 0.33, 0.66, 1].map((f) => (
            <line
              key={f}
              x1={padL}
              x2={W - padR}
              y1={(padT + innerH * f).toFixed(1)}
              y2={(padT + innerH * f).toFixed(1)}
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="1"
            />
          ))}
          <path d={area} fill="url(#ip-trend-fill)" />
          <path d={line} fill="none" stroke="url(#ip-trend-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {trend.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" />
          ))}
        </svg>
        <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
          {Array.from({ length: 9 }, (_, i) => `步${i + 1}`).map((m) => (
            <span key={m} style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: F.mono }}>{m}</span>
          ))}
        </div>
      </motion.div>
    </Item>
  );
}

// ── 主页组件 ──────────────────────────────────────────────────────────────────
export default function IpPlan() {
  const navigate = useNavigate();
  const completed = IP_PLAN_STEPS.filter((s) => s.done).length;
  const total = IP_PLAN_STEPS.length;
  const remaining = total - completed;
  const firstUncompleted = IP_PLAN_STEPS.find((s) => !s.done);
  const percent = Math.round((completed / total) * 100);

  // KPI 四项数据
  const kpiItems = [
    { label: '总进度', value: `${percent}%`, badge: '实时', accentIdx: 0 },
    { label: '已完成', value: String(completed), badge: '步骤', accentIdx: 1 },
    { label: '剩余', value: String(remaining), badge: '待办', accentIdx: 2 },
    { label: '总步骤', value: String(total), badge: '全部', accentIdx: 3 },
  ];

  return (
    <LiquidShell>
      <main
        style={{ maxWidth: 1152, margin: '0 auto' }}
        data-testid="ip-plan-page"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <IpPlanHeader completed={completed} total={total} />

        {/* ── KPI 概览一排 ───────────────────────────────────── */}
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 44 }}>
          {kpiItems.map((kpi) => {
            const accent = KPI_ACCENTS[kpi.accentIdx]!;
            const ringPercent = kpi.accentIdx === 0
              ? percent
              : kpi.accentIdx === 1
              ? Math.round((completed / total) * 100)
              : kpi.accentIdx === 2
              ? Math.round((remaining / total) * 100)
              : 100;

            return (
              <Item key={kpi.label} style={{ height: '100%' }}>
                <motion.div
                  className="lg-glass lg-spec"
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
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
                        background: accent.iconBg,
                        color: accent.iconText,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>{accent.icon}</span>
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 9999,
                        border: `0.5px solid ${accent.badgeBorder}`,
                        background: accent.badgeBg,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: F.mono,
                        color: accent.badgeText,
                      }}
                    >
                      {kpi.badge}
                    </span>
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: accent.valColor, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>{kpi.value}</p>
                      <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '6px 0 0' }}>{kpi.label}</p>
                    </div>
                    {kpi.accentIdx === 0 && (
                      <div
                        style={{ height: 48, width: 48, flexShrink: 0 }}
                        role="progressbar"
                        aria-valuenow={ringPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${kpi.label} ${kpi.value}`}
                      >
                        <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }} aria-hidden={true}>
                          <defs>
                            <linearGradient id="ip-kpi-ringGrad1" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={C.ikb} />
                              <stop offset="100%" stopColor={C.accent3} />
                            </linearGradient>
                          </defs>
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke="url(#ip-kpi-ringGrad1)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray={`${ringPercent} 100`}
                          />
                        </svg>
                      </div>
                    )}
                    {kpi.accentIdx === 3 && (
                      <div
                        style={{
                          display: 'flex',
                          height: 48,
                          width: 48,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 9999,
                          background: 'rgba(168,197,224,0.14)',
                        }}
                        aria-hidden={true}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>format_list_numbered</span>
                      </div>
                    )}
                    {kpi.accentIdx === 1 && (
                      <div style={{ display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }} aria-hidden={true}>
                        {[44, 56, 78, 100].map((h, i) => (
                          <div
                            key={i}
                            style={{ width: 12, borderRadius: '2px 2px 0 0', background: 'rgba(255,255,255,0.65)', height: `${h}%` }}
                          />
                        ))}
                      </div>
                    )}
                    {kpi.accentIdx === 2 && (
                      <div style={{ marginTop: 12, height: 8, width: 64, borderRadius: 9999, background: 'rgba(168,197,224,0.14)' }} aria-hidden={true}>
                        <div
                          style={{ height: 8, borderRadius: 9999, background: C.grad, width: `${ringPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              </Item>
            );
          })}
        </RevealGroup>

        {/* ── 进度卡 ─────────────────────────────────────────── */}
        <IpPlanProgressCard percent={percent} completed={completed} total={total} />

        {/* ── 步骤清单 ────────────────────────────────────────── */}
        <IpPlanStepList steps={IP_PLAN_STEPS} />

        {/* ── 数据洞察 band ───────────────────────────────────── */}
        <Reveal style={{ marginBottom: 4, marginTop: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>insights</span>
          </span>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>· IP 成熟度综合评估</span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 9999,
              background: 'rgba(168,197,224,0.18)',
              border: `0.5px solid rgba(168,197,224,0.45)`,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: C.ikb,
              fontFamily: F.mono,
            }}
          >
            <span
              className="ikb-pulse"
              style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }}
              aria-hidden={true}
            />
            模型已就绪
          </span>
        </Reveal>
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, marginBottom: 44, marginTop: 8 }}>
          <IpMaturityRadar />
          <IpProgressTrend completed={completed} total={total} />
        </RevealGroup>

        {/* ── 底部 CTA ────────────────────────────────────────── */}
        {remaining > 0 && firstUncompleted && (
          <IpPlanFooter
            remaining={remaining}
            onNext={() => { void navigate(firstUncompleted.href); }}
          />
        )}
      </main>
    </LiquidShell>
  );
}
