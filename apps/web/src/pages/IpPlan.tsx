/**
 * /ip-plan · 我的IP方案/进度总览 — 红蓝紫渐变 IKB 体系
 *
 * 逻辑零改动：IP_PLAN_STEPS / completed / remaining / firstUncompleted / navigate
 * testid 全保留：ip-plan-page + header/subtitle/progress/step-list/footer 各子 testid
 * 4 个 ip-plan 组件 inline 重写（不 import 旧组件）
 */
import { useNavigate } from 'react-router-dom';

import '@/styles/ikb-hero.css';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
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

// ── KPI 卡色轮(蓝→玫红→紫→蓝) ──────────────────────────────────────────────
const KPI_ACCENTS = [
  {
    borderColor: `${C.ikb}30`,
    iconBg: `${C.ikb}1a`,
    iconText: C.ikb,
    valColor: C.ikb,
    badgeBg: `${C.ikb}1a`,
    badgeText: C.purpleText,
    ringTrack: `${C.ikb}18`,
    ringFill: C.ikb,
    icon: 'map',
  },
  {
    borderColor: `${C.burgundy}30`,
    iconBg: `${C.burgundy}1a`,
    iconText: C.burgundy,
    valColor: C.burgundy,
    badgeBg: `${C.burgundy}1a`,
    badgeText: C.burgundyText,
    ringTrack: `${C.burgundy}18`,
    ringFill: C.burgundy,
    icon: 'check_circle',
  },
  {
    borderColor: `${C.accent3}30`,
    iconBg: `${C.accent3}1a`,
    iconText: C.accent3,
    valColor: C.ink,
    badgeBg: `${C.accent3}1a`,
    badgeText: C.purpleText,
    ringTrack: `${C.accent3}18`,
    ringFill: C.accent3,
    icon: 'pending_actions',
  },
  {
    borderColor: `${C.ikb}30`,
    iconBg: `${C.ikb}1a`,
    iconText: C.ikb,
    valColor: C.ink,
    badgeBg: `${C.ikb}1a`,
    badgeText: C.purpleText,
    ringTrack: `${C.ikb}18`,
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
    <header
      style={{ marginBottom: 48, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}
      data-testid="ip-plan-header"
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
            IP 方案
          </span>
        </div>
        <h1
          className="ikb-gradtext"
          style={{ fontFamily: F.display, fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap' }}
          data-testid="ip-plan-h1"
        >
          {IP_PLAN_H1}
        </h1>
        <p
          style={{ marginTop: 8, maxWidth: 820, fontSize: 16, lineHeight: 1.6, color: '#5A6173', fontFamily: F.cn }}
          data-testid="ip-plan-subtitle"
        >
          {IP_PLAN_SUBTITLE_TPL(completed, total)}
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          flexShrink: 0,
          alignItems: 'center',
          gap: 8,
          borderRadius: 9999,
          border: `1px solid ${C.line}`,
          background: C.paper,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
          fontFamily: F.cn,
          color: C.ink,
        }}
      >
        <span
          className="ikb-pulse"
          style={{ display: 'block', height: 10, width: 10, borderRadius: 9999, background: C.ikb }}
          aria-hidden={true}
        />
        进度追踪中
      </div>
    </header>
  );
}

// ── inline IpPlanProgressCard ─────────────────────────────────────────────────
function IpPlanProgressCard({ percent, completed, total }: { percent: number; completed: number; total: number }) {
  const dashArray = `${percent} 100`;
  return (
    <section
      style={{
        marginBottom: 32,
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: C.paper,
        padding: 32,
      }}
      data-testid="ip-plan-progress-card"
    >
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 18,
            fontWeight: 800,
            color: C.ink,
            fontFamily: F.display,
            margin: 0,
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
            className="ikb-gradtext"
            style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, fontFamily: F.display }}
            data-testid="ip-plan-progress-percent"
          >
            {percent}%
          </span>
          <span
            style={{
              marginBottom: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              borderRadius: 9999,
              background: `${C.ikb}15`,
              padding: '2px 8px',
              fontSize: 12,
              fontWeight: 700,
              color: C.purpleText,
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
          background: C.base,
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
                <stop offset="100%" stopColor={C.burgundy} />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}18`} strokeWidth="3" />
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
              className="ikb-gradtext"
              style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, fontFamily: F.display }}
            >
              {percent}<span style={{ fontSize: 14, color: '#6b7280', WebkitTextFillColor: '#6b7280', backgroundImage: 'none' }}>%</span>
            </span>
            <span style={{ marginTop: 4, fontSize: 10, color: '#6b7280', fontFamily: F.mono }}>完成度</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 32, rowGap: 12 }}>
          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', fontFamily: F.mono, margin: 0 }}>已完成</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.ikb, fontFamily: F.display, margin: 0 }}>{completed}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', fontFamily: F.mono, margin: 0 }}>总步数</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0 }}>{total}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── inline step row (为 IpPlanStepList 内联使用) ──────────────────────────────
function StepRow({ step, index }: { step: IpPlanStep; index: number }) {
  // 序号色轮：蓝→玫红→紫 循环
  const NUM_COLORS = [C.ikb, C.burgundy, C.accent3];
  const numColor = step.done ? C.ikb : (NUM_COLORS[index % 3] ?? C.ikb);
  const numBg = step.done ? `${C.ikb}18` : `${numColor}18`;

  return (
    <div
      className="ikb-card ikb-focusring"
      style={{
        borderRadius: 12,
        padding: 20,
        transition: 'all 0.2s',
        ['--ikb-accent' as string]: numColor,
      } as React.CSSProperties}
      data-testid={`ip-plan-step-card-${step.id}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 左侧：序号 + 名称 + 状态 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* 序号圆圈 */}
          <div
            style={{
              display: 'flex',
              height: 48,
              width: 48,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9999,
              fontSize: 15,
              fontWeight: 800,
              fontFamily: F.mono,
              backgroundColor: numBg,
              color: numColor,
            }}
            data-testid={`ip-plan-step-icon-circle-${index}`}
          >
            {String(index + 1).padStart(2, '0')}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: step.done ? C.ink : '#5A6173',
                  fontFamily: F.cn,
                  margin: 0,
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
                    background: `${C.ikb}15`,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.purpleText,
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
                    background: C.base,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#6b7280',
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
        </div>

        {/* 右侧：完成标记 + 跳转链接 */}
        <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 12 }}>
          {step.done ? (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: C.ikb }}
              aria-label={`${step.title} 已完成`}
              data-testid={`ip-plan-step-check-${step.id}`}
            >
              check_circle
            </span>
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: '#d1d5db' }}
              aria-label={`${step.title} 未完成`}
              data-testid={`ip-plan-step-circle-${step.id}`}
            >
              radio_button_unchecked
            </span>
          )}
          <a
            href={step.href}
            className="ikb-focusring"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderRadius: 8,
              border: `1px solid ${step.done ? `${C.ikb}30` : C.line}`,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: F.cn,
              color: step.done ? C.ikb : C.burgundy,
              background: step.done ? `${C.ikb}08` : C.paper,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            data-testid={`ip-plan-step-action-${step.id}`}
          >
            {step.done ? IP_PLAN_VIEW_DETAIL : IP_PLAN_GO_COMPLETE}
            <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>chevron_right</span>
          </a>
        </div>
      </div>

      {/* 完成态 extra 行 */}
      {step.done && step.extra && (
        <div
          style={{
            marginTop: 12,
            borderTop: `1px solid ${C.ikb}18`,
            paddingTop: 12,
          }}
          data-testid={`ip-plan-step-extra-${step.id}`}
        >
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontFamily: F.cn }}>{step.extra}</p>
        </div>
      )}
    </div>
  );
}

// ── inline IpPlanStepList ─────────────────────────────────────────────────────
function IpPlanStepList({ steps }: { steps: ReadonlyArray<IpPlanStep> }) {
  return (
    <section data-testid="ip-plan-step-list">
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>checklist</span>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0 }}>步骤清单</h2>
        <span style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>· 点击跳转对应步骤</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map((step, index) => (
          <StepRow key={step.id} step={step} index={index} />
        ))}
      </div>
    </section>
  );
}

// ── inline IpPlanFooter ───────────────────────────────────────────────────────
function IpPlanFooter({ remaining, onNext }: { remaining: number; onNext: () => void }) {
  return (
    <section
      style={{
        marginTop: 32,
        overflow: 'hidden',
        borderRadius: 12,
        border: `1px solid ${C.ikb}28`,
        background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
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
              background: C.grad,
              color: '#fff',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden={true}>rocket_launch</span>
          </span>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0 }}>继续打造你的 IP</p>
            <p
              style={{ marginTop: 4, fontSize: 14, color: '#6b7280', fontFamily: F.cn, margin: '4px 0 0' }}
              data-testid="ip-plan-footer-text"
            >
              {IP_PLAN_FOOTER_TPL(remaining)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNext}
          aria-label="继续下一步"
          className="ikb-gradbtn ikb-focusring"
          style={{
            display: 'flex',
            flexShrink: 0,
            alignItems: 'center',
            gap: 8,
            borderRadius: 12,
            padding: '12px 32px',
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontFamily: F.mono,
          }}
          data-testid="ip-plan-next-btn"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>arrow_forward</span>
          {IP_PLAN_NEXT_BTN}
        </button>
      </div>
    </section>
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
    <div
      style={{
        gridColumn: 'span 5',
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'flex',
              height: 36,
              width: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: `${C.ikb}1a`,
              color: C.ikb,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>radar</span>
          </span>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0 }}>IP 成熟度雷达</h3>
            <p style={{ fontSize: 11, color: '#6b7280', fontFamily: F.mono, margin: 0 }}>六维模型评估</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p
            className="ikb-gradtext"
            style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, fontFamily: F.display, margin: 0 }}
          >
            {avg}
          </p>
          <p style={{ fontSize: 10, color: '#6b7280', fontFamily: F.mono, margin: 0 }}>综合分</p>
        </div>
      </div>
      <svg viewBox="0 0 260 244" style={{ width: '100%' }} aria-hidden={true}>
        <defs>
          <linearGradient id="ip-radar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
            <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={poly(R * f)} fill="none" stroke={`${C.ikb}18`} strokeWidth="1" />
        ))}
        {dims.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={`${C.ikb}18`} strokeWidth="1" />;
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
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', rowGap: 8 }}>
        {dims.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ height: 8, width: 8, borderRadius: 9999, backgroundColor: d.color, flexShrink: 0 }} aria-hidden={true} />
            <span style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
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
    <div
      style={{
        gridColumn: 'span 7',
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'flex',
              height: 36,
              width: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: `${C.burgundy}1a`,
              color: C.burgundy,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>show_chart</span>
          </span>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0 }}>IP 完成进度趋势</h3>
            <p style={{ fontSize: 11, color: '#6b7280', fontFamily: F.mono, margin: 0 }}>按步骤完成节点测算</p>
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
                background: i === 0 ? C.ikb : C.base,
                color: i === 0 ? '#fff' : '#6b7280',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <p
          style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}
        >
          {completed}/{total}
        </p>
        <span
          style={{
            marginBottom: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            borderRadius: 9999,
            background: `${C.ikb}15`,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 700,
            color: C.purpleText,
            fontFamily: F.mono,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>trending_up</span>
          步骤完成
        </span>
        <span style={{ marginBottom: 4, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>持续推进中</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} aria-hidden={true}>
        <defs>
          <linearGradient id="ip-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
            <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ip-trend-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.ikb} />
            <stop offset="50%" stopColor={C.accent3} />
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
            stroke={C.base}
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="url(#ip-trend-fill)" />
        <path d={line} fill="none" stroke="url(#ip-trend-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {trend.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" />
        ))}
      </svg>
      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
        {Array.from({ length: 9 }, (_, i) => `步${i + 1}`).map((m) => (
          <span key={m} style={{ fontSize: 10, color: '#6b7280', fontFamily: F.mono }}>{m}</span>
        ))}
      </div>
    </div>
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
    <IKBLayout>
      <main
        style={{ maxWidth: 1152, margin: '0 auto' }}
        data-testid="ip-plan-page"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <IpPlanHeader completed={completed} total={total} />

        {/* ── KPI 概览一排 ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
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
              <div
                key={kpi.label}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${accent.borderColor}`,
                  background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
                  padding: 20,
                  transition: 'all 0.2s',
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
                      background: accent.iconBg,
                      color: accent.iconText,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>{accent.icon}</span>
                  </span>
                  <span
                    style={{
                      borderRadius: 9999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: F.mono,
                      background: accent.badgeBg,
                      color: accent.badgeText,
                    }}
                  >
                    {kpi.badge}
                  </span>
                </div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: accent.valColor, fontFamily: F.display, margin: 0 }}>{kpi.value}</p>
                    <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn, margin: '6px 0 0' }}>{kpi.label}</p>
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
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke={accent.ringTrack} strokeWidth="3.5" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={accent.ringFill}
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
                        background: accent.ringTrack,
                      }}
                      aria-hidden={true}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: accent.ringFill }}>format_list_numbered</span>
                    </div>
                  )}
                  {kpi.accentIdx === 1 && (
                    <div style={{ display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }} aria-hidden={true}>
                      {[44, 56, 78, 100].map((h, i) => (
                        <div
                          key={i}
                          style={{ width: 12, borderRadius: '2px 2px 0 0', background: C.ikb, opacity: 0.7, height: `${h}%` }}
                        />
                      ))}
                    </div>
                  )}
                  {kpi.accentIdx === 2 && (
                    <div style={{ marginTop: 12, height: 8, width: 64, borderRadius: 9999, background: `${C.accent3}18` }} aria-hidden={true}>
                      <div
                        style={{ height: 8, borderRadius: 9999, background: C.grad, width: `${ringPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 进度卡 ─────────────────────────────────────────── */}
        <IpPlanProgressCard percent={percent} completed={completed} total={total} />

        {/* ── 数据洞察 band ───────────────────────────────────── */}
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0 }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>· IP 成熟度综合评估</span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 9999,
              background: `${C.ikb}12`,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: C.purpleText,
              fontFamily: F.mono,
            }}
          >
            <span
              className="ikb-pulse"
              style={{ height: 6, width: 6, borderRadius: 9999, background: C.ikb, display: 'inline-block' }}
              aria-hidden={true}
            />
            模型已就绪
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24, marginBottom: 32, marginTop: 8 }}>
          <IpMaturityRadar />
          <IpProgressTrend completed={completed} total={total} />
        </div>

        {/* ── 步骤清单 ────────────────────────────────────────── */}
        <IpPlanStepList steps={IP_PLAN_STEPS} />

        {/* ── 底部 CTA ────────────────────────────────────────── */}
        {remaining > 0 && firstUncompleted && (
          <IpPlanFooter
            remaining={remaining}
            onNext={() => { void navigate(firstUncompleted.href); }}
          />
        )}
      </main>
    </IKBLayout>
  );
}
