/**
 * /dashboard · 系统控制台 — 液态玻璃皮
 *
 * 部署进度斜条纹 + 3 实色 metric 卡(蓝/玫红/紫)+ 活动节点流数据表。
 * 外壳换 LiquidShell，配色换 home-next/ikb/system，保留所有功能/数据/testid。
 */
import { motion } from 'framer-motion';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Reveal, RevealGroup } from '@/components/home-next/ikb/system';

type Tone = 'green' | 'yellow' | 'red';

// icon chip 三色轮转(液态玻璃冷蓝体系)
const ICON_CHIP_COLORS = [
  { bg: 'rgba(168,197,224,0.22)', text: C.ikb },
  { bg: 'rgba(255,255,255,0.12)', text: C.burgundy },
  { bg: 'rgba(168,197,224,0.18)', text: C.accent3 },
];

const TABLE_ROWS: {
  id: string;
  src: string;
  status: string;
  tone: Tone;
  latency: string;
  icon: string;
  chipIdx: number;
}[] = [
  { id: 'NX-001', src: '上海三角洲', status: '极佳', tone: 'green', latency: '12ms', icon: 'wifi_tethering', chipIdx: 0 },
  { id: 'NX-042', src: '北京枢纽', status: '降级', tone: 'yellow', latency: '145ms', icon: 'warning_amber', chipIdx: 1 },
  { id: 'NX-108', src: '深圳核心', status: '危险', tone: 'red', latency: '890ms', icon: 'error_outline', chipIdx: 2 },
];

// ── 系统健康度雷达维度 ─────────────────────────────────────────────────────
const DB_RADAR_DIMS = [
  { label: '算力', value: 86, color: C.ikb },
  { label: '稳定性', value: 91, color: C.burgundy },
  { label: '响应速度', value: 78, color: C.accent3 },
  { label: '任务吞吐', value: 83, color: C.ikb },
  { label: '在线率', value: 95, color: C.burgundy },
  { label: '资源余量', value: 72, color: C.accent3 },
];

// ── 7 日吞吐趋势数据 ────────────────────────────────────────────────────────
const DB_TREND_DATA = [38, 55, 47, 68, 74, 81, 92];
const DB_TREND_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// ── 部署阶段节点 ────────────────────────────────────────────────────────────
const DEPLOY_PHASES = [
  { label: '初始化', pct: 16.67, color: C.ikb, done: true },
  { label: '编译', pct: 16.67, color: C.ikb, done: true },
  { label: '集成', pct: 16.67, color: C.ikb, done: true },
  { label: '测试', pct: 16.66, color: C.ikb, done: true },
  { label: '活跃阶段', pct: 11.33, color: 'rgba(255,255,255,0.9)', done: false },
  { label: '完成', pct: 22.0, color: 'rgba(255,255,255,0.3)', done: false },
];

export default function Dashboard() {
  return (
    <LiquidShell>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>
        {/* ── Header ─────────────────────────────────────────── */}
        <Reveal>
          <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
            <div style={{ flexShrink: 0 }}>
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
                  系统
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
                  运行中
                </span>
              </div>
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
              >
                系统控制台
              </h1>
              <p style={{ marginTop: 10, fontSize: 16, lineHeight: 1.6, color: C.burgundyText, fontFamily: F.cn, textShadow: C.textShadow }}>核心数据与运行状态概览</p>
            </div>
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
              系统在线
            </div>
          </header>
        </Reveal>

        {/* ── 数据概览 KPI 卡一排 ───────────────────────────────── */}
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {/* 市场洞察 · 环形进度 · 蓝 */}
          <Item>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                  <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>insights</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 9999, background: 'rgba(168,197,224,0.18)', border: `0.5px solid rgba(168,197,224,0.45)`, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>
                  <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 13 }}>trending_up</span>+12.4%
                </span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                    8.4M<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}> TB</span>
                  </p>
                  <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>市场洞察</p>
                </div>
                <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                    <defs>
                      <linearGradient id="db-ringGrad1" x1="0" y1="0" x2="1" y2="0">
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
                      stroke="url(#db-ringGrad1)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="78 100"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </Item>

          {/* 收益模型 · 迷你柱 · 玫红 */}
          <Item>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: C.burgundy }}>
                  <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>monetization_on</span>
                </span>
                <span style={{ borderRadius: 9999, background: 'rgba(255,255,255,0.10)', border: `0.5px solid rgba(255,255,255,0.28)`, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: C.burgundyText, fontFamily: F.mono }}>Q3预期</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                  ¥2.1B<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}> CNY</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>收益模型</p>
              </div>
              <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
                {[58, 84, 70, 96, 78].map((h, i) => (
                  <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', background: 'rgba(255,255,255,0.65)', height: `${h}%` }} />
                ))}
              </div>
            </motion.div>
          </Item>

          {/* 内容生成 · 进度条 · 紫 */}
          <Item>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.18)', color: C.accent3 }}>
                  <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>bolt</span>
                </span>
                <span style={{ borderRadius: 9999, background: 'rgba(168,197,224,0.18)', border: `0.5px solid rgba(168,197,224,0.40)`, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: C.purpleText, fontFamily: F.mono }}>高速</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                  45K<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}> 节点/秒</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>内容生成</p>
              </div>
              <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 9999, background: 'rgba(255,255,255,0.10)' }}>
                <div
                  style={{
                    height: 8,
                    borderRadius: 9999,
                    background: C.grad,
                    width: '84%',
                  }}
                />
              </div>
            </motion.div>
          </Item>

          {/* 部署进度 · 环形 + 百分比 · 蓝 */}
          <Item>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                  <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span>
                </span>
                <span style={{ borderRadius: 9999, background: 'rgba(168,197,224,0.18)', border: `0.5px solid rgba(168,197,224,0.45)`, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>进行中</span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                    78<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>%</span>
                  </p>
                  <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>整体部署进度</p>
                </div>
                <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                    <defs>
                      <linearGradient id="db-ringGrad2" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={C.ikb} />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
                      </linearGradient>
                    </defs>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="url(#db-ringGrad2)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="78 100"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </Item>
        </RevealGroup>

        {/* ── 部署进度详情 ──────────────────────────────────────── */}
        <Reveal>
          <section
            className="lg-glass"
            style={{
              borderRadius: 20,
              padding: 32,
              marginBottom: 32,
            }}
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
                  margin: 0,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    height: 14,
                    width: 4,
                    borderRadius: 9999,
                    background: C.grad,
                    flexShrink: 0,
                  }}
                />
                部署进度
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ikb, fontFamily: F.display, textShadow: C.textShadow }}>78</span>
                <span style={{ marginBottom: 4, fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>%</span>
                <span style={{ marginBottom: 4, marginLeft: 4, display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 9999, background: 'rgba(168,197,224,0.18)', border: `0.5px solid rgba(168,197,224,0.45)`, padding: '2px 8px', fontSize: 12, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>
                  <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>+5%
                </span>
              </div>
            </div>
            {/* 渐变进度条 */}
            <div style={{ marginBottom: 16, height: 16, width: '100%', overflow: 'hidden', borderRadius: 9999, background: 'rgba(255,255,255,0.10)' }}>
              <div
                style={{
                  height: 16,
                  borderRadius: 9999,
                  background: C.grad,
                  width: '78%',
                  transition: 'width 0.7s ease',
                }}
              />
            </div>
            {/* 阶段节点 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
              {DEPLOY_PHASES.map((phase, i) => (
                <div key={phase.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${phase.pct}%` }}>
                  <div
                    style={{
                      marginBottom: 6,
                      height: 8,
                      width: '100%',
                      borderRadius: 2,
                      background: phase.color,
                      opacity: i < DEPLOY_PHASES.length - 2 ? 1 : 0.4,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: phase.done ? 600 : i === DEPLOY_PHASES.length - 2 ? 700 : 400,
                      color: phase.done
                        ? C.ikb
                        : i === DEPLOY_PHASES.length - 2
                          ? C.burgundyText
                          : 'rgba(255,255,255,0.5)',
                      fontFamily: F.mono,
                      textShadow: C.textShadow,
                    }}
                  >
                    {phase.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── 活动节点流 ─────────────────────────────────────── */}
        <Reveal>
          <section
            className="lg-glass"
            style={{
              overflow: 'hidden',
              borderRadius: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `0.5px solid ${C.line}`,
                background: 'rgba(168,197,224,0.12)',
                padding: '16px 24px',
              }}
            >
              <h3
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 18,
                  fontWeight: 800,
                  margin: 0,
                  fontFamily: F.cn,
                  color: C.ink,
                  textShadow: C.textShadow,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    height: 14,
                    width: 4,
                    borderRadius: 9999,
                    background: C.ikb,
                    flexShrink: 0,
                  }}
                />
                活动节点流
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.12)', padding: '4px 12px', fontSize: 12, fontWeight: 600, color: C.ink, fontFamily: F.mono }}>
                  <span aria-hidden={true} className="ikb-pulse" style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
                  实时监控
                </span>
                <span aria-hidden={true} className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.6)' }}>sort</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', fontSize: 14, borderCollapse: 'collapse' }}>
                <thead style={{ borderBottom: `0.5px solid ${C.line}`, background: 'rgba(255,255,255,0.04)' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', fontFamily: F.mono }}>标识符</th>
                    <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', fontFamily: F.mono }}>来源</th>
                    <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', fontFamily: F.mono }}>状态</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', fontFamily: F.mono }}>延迟</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((r) => {
                    const chip = ICON_CHIP_COLORS[r.chipIdx % ICON_CHIP_COLORS.length] ?? ICON_CHIP_COLORS[0]!;
                    // Status badge & latency badge styling — 液态玻璃版全改 rgba()
                    const statusStyle =
                      r.tone === 'green'
                        ? { background: 'rgba(168,197,224,0.16)', color: C.ikb, borderColor: 'rgba(168,197,224,0.40)' }
                        : r.tone === 'yellow'
                          ? { background: 'rgba(228,238,255,0.14)', color: C.purpleText, borderColor: 'rgba(228,238,255,0.35)' }
                          : { background: 'rgba(255,255,255,0.08)', color: C.burgundyText, borderColor: 'rgba(255,255,255,0.28)' };
                    const dotColor =
                      r.tone === 'green' ? C.ikb : r.tone === 'yellow' ? C.accent3 : C.burgundy;
                    const latencyStyle =
                      r.tone === 'green'
                        ? { background: 'rgba(168,197,224,0.16)', color: C.ikb }
                        : r.tone === 'yellow'
                          ? { background: 'rgba(228,238,255,0.14)', color: C.purpleText }
                          : { background: 'rgba(255,255,255,0.08)', color: C.burgundyText };
                    return (
                      <tr
                        key={r.id}
                        style={{ borderBottom: `0.5px solid ${C.line}`, transition: 'background 0.15s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                      >
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{ display: 'flex', height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: chip.bg, color: chip.text }}
                            >
                              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 15 }}>{r.icon}</span>
                            </span>
                            <span style={{ fontFamily: F.mono, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{r.id}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: 500, color: C.ink, fontFamily: F.cn }}>{r.src}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              borderRadius: 9999,
                              border: `0.5px solid ${statusStyle.borderColor}`,
                              background: statusStyle.background,
                              color: statusStyle.color,
                              padding: '4px 10px',
                              fontSize: 12,
                              fontWeight: 500,
                              fontFamily: F.cn,
                            }}
                          >
                            <span style={{ height: 6, width: 6, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <span
                            style={{
                              borderRadius: 6,
                              padding: '2px 8px',
                              fontFamily: F.mono,
                              fontSize: 13,
                              fontWeight: 600,
                              background: latencyStyle.background,
                              color: latencyStyle.color,
                            }}
                          >
                            {r.latency}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </Reveal>

        {/* ── 数据洞察 band (雷达 + 趋势) ──────────────────────── */}
        <Reveal style={{ marginTop: 32, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }}>insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999, background: 'rgba(168,197,224,0.18)', border: `0.5px solid rgba(168,197,224,0.45)`, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: C.ikb, fontFamily: F.mono }}>
            <span aria-hidden={true} className="ikb-pulse" style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
            模型已就绪
          </span>
        </Reveal>
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, marginBottom: 32 }}>
          {/* 系统健康度雷达 · col-span-5 */}
          <Item>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 24 }}
            >
              <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                    <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>radar</span>
                  </span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>系统健康度雷达</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: F.cn }}>六维模型评估</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: C.ikb, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>84</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: F.cn }}>综合分</p>
                </div>
              </div>
              {(() => {
                const dims = DB_RADAR_DIMS;
                const cx = 130;
                const cy = 122;
                const R = 88;
                const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
                const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
                const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
                const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
                return (
                  <svg viewBox="0 0 260 244" style={{ width: '100%' }}>
                    <defs>
                      <linearGradient id="db-radarFill" x1="0" y1="0" x2="0" y2="1">
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
                    <polygon points={dataPoly} fill="url(#db-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
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
                );
              })()}
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 0' }}>
                {DB_RADAR_DIMS.map((d) => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ height: 8, width: 8, borderRadius: '50%', background: d.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>{d.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono, textShadow: C.textShadow }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </Item>

          {/* 7 日吞吐趋势 · col-span-7 */}
          <Item>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 24 }}
            >
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: C.burgundy }}>
                    <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>show_chart</span>
                  </span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>7 日吞吐趋势</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: F.cn }}>按当前系统节点测算</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {['吞吐', '延迟', '在线率'].map((t, i) => (
                    <span
                      key={t}
                      style={{
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        background: i === 0 ? 'rgba(168,197,224,0.45)' : 'rgba(255,255,255,0.08)',
                        color: i === 0 ? C.ink : 'rgba(255,255,255,0.5)',
                        fontFamily: F.mono,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>92K</p>
                <span style={{ marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 9999, background: 'rgba(168,197,224,0.18)', border: `0.5px solid rgba(168,197,224,0.45)`, padding: '2px 8px', fontSize: 12, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>
                  <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>+142%
                </span>
                <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>节点/秒峰值</span>
              </div>
              {(() => {
                const data = DB_TREND_DATA;
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
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
                    <defs>
                      <linearGradient id="db-trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.30" />
                        <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="db-trendLine" x1="0" y1="0" x2="1" y2="0">
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
                    <path d={area} fill="url(#db-trendFill)" />
                    <path d={line} fill="none" stroke="url(#db-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((v, i) => (
                      <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" />
                    ))}
                  </svg>
                );
              })()}
              <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4 }}>
                {DB_TREND_LABELS.map((m) => (
                  <span key={m} style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: F.mono }}>{m}</span>
                ))}
              </div>
            </motion.div>
          </Item>
        </RevealGroup>
      </div>
    </LiquidShell>
  );
}
