/* ───────────────────────────────────────────────────────────────────────────
 * 液态玻璃皮 — home-next 专用视觉底座(换皮,结构不动)
 * 约束:在 LiquidShell 固定 1360 画布内 → 全部固定 px
 * 配色已全面换成液态玻璃体系:深色玻璃面 · 冷蓝高光 · 白字
 * ─────────────────────────────────────────────────────────────────────────── */
import { motion, useMotionValue, useSpring, type Variants } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import '@/styles/liquid-glass.css';

// 液态玻璃色板(IKB → 玻璃映射)
export const C = {
  // 原 IKB 槽保留 — 强调/编号/kicker 用冷蓝
  ikb: '#d8e8ff',            // 冷蓝强调 → 大幅提亮(醒目)
  yellow: '#e4eeff',         // 次强调 → 提亮
  burgundy: 'rgba(255,255,255,0.95)', // 装饰 → 更白
  burgundyText: 'rgba(255,255,255,0.94)', // 描述文字 → 更实醒目
  purpleText: 'rgba(255,255,255,0.9)', // → 更实
  accent3: '#d8e8ff',        // 同 ikb
  ink: 'rgba(255,255,255,0.99)', // 正文/标题 → 近纯白
  paper: 'rgba(255,255,255,0.13)', // 原白卡 → 玻璃
  base: 'transparent',       // 原浅底 → 透明(让流体背景透出)
  line: 'rgba(255,255,255,0.18)', // 原发丝线 → 白半透
  // 冷蓝渐变(编号/100%大字/kicker 强调)
  grad: 'linear-gradient(110deg,#d4e6ff 0%,#a8c5e0 52%,#7fb0e6 100%)',
  // 文字阴影(玻璃上保可读)
  textShadow: '0 1px 2px rgba(5,12,34,.95), 0 1px 7px rgba(5,12,34,.66), 0 2px 13px rgba(5,12,34,.4)',
};

export const F = {
  display: "'Smiley Sans', 'Noto Sans SC', sans-serif", // 得意黑 — 大字
  mono: "'Space Mono', ui-monospace, monospace", // 技术体 — 标签/编号
  cn: "'Noto Sans SC', sans-serif", // 正文
};

// 入场:滚动进入视口 stagger 揭示
const riseV: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};
const groupV: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

export function Reveal({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <motion.div variants={riseV} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} style={style}>
      {children}
    </motion.div>
  );
}
export function RevealGroup({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <motion.div variants={groupV} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }} style={style}>
      {children}
    </motion.div>
  );
}
export function Item({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <motion.div variants={riseV} style={style}>
      {children}
    </motion.div>
  );
}

// 磁力(design-spells · 60fps spring)
export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 200, damping: 15, mass: 0.35 });
  const y = useSpring(my, { stiffness: 200, damping: 15, mass: 0.35 });
  return (
    <motion.div
      ref={ref}
      style={{ x, y, display: 'inline-block' }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        mx.set((e.clientX - (r.left + r.width / 2)) * strength);
        my.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

// 统一区块头:mono 编号 + kicker + 得意黑标题 — 液态玻璃皮(冷蓝编号 · 白标题)
export function SectionHead({ index, kicker, title, accent = C.ikb }: { index: string; kicker: string; title: string; accent?: string }) {
  return (
    <Reveal style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
        <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: accent, letterSpacing: '0.08em', textShadow: C.textShadow }}>{index}</span>
        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.burgundyText }}>{kicker}</span>
      </div>
      <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 46, lineHeight: 0.98, letterSpacing: '-0.01em', color: C.ink, margin: 0, textShadow: C.textShadow }}>{title}</h2>
    </Reveal>
  );
}

// 统一卡片:液态玻璃材质 (.lg-glass) · 白字 · 冷蓝编号/箭头 · hover scale 视差
export function Card({
  index,
  title,
  desc,
  href,
  accent = C.ikb,
  arrow = false,
}: {
  index: string;
  title: string;
  desc: string;
  href: string;
  accent?: string;
  arrow?: boolean;
}) {
  return (
    <Item style={{ height: '100%' }}>
      <motion.div
        whileHover={{ y: -7, zIndex: 5 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{ height: '100%', position: 'relative' }}
      >
        <Link
          to={href}
          className="lg-glass lg-spec"
          style={{
            display: 'flex',
            flexDirection: 'column',
            textDecoration: 'none',
            padding: '16px 18px',
            height: '100%',
            borderRadius: 16,
            ['--ikb-accent' as string]: accent,
          } as CSSProperties}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.05em' }}>{index}</span>
            {arrow && (
              <span style={{ color: accent, display: 'inline-flex' }} aria-hidden>
                <ArrowUpRight size={16} strokeWidth={2.6} />
              </span>
            )}
          </div>
          <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: C.ink, marginTop: 12, lineHeight: 1.12, textShadow: C.textShadow }}>{title}</div>
          <div style={{ fontFamily: F.cn, fontSize: 12.5, lineHeight: 1.55, color: C.burgundyText, marginTop: 6 }}>{desc}</div>
        </Link>
      </motion.div>
    </Item>
  );
}
