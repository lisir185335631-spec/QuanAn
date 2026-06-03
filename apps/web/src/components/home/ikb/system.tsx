/* ───────────────────────────────────────────────────────────────────────────
 * 红蓝紫渐变 · 先锋印刷 — 首页统一视觉底座
 * 约束(按用户反馈):① 在 IKBLayout 固定 1360 画布内 → 全部【固定 px】,不用 vw/vh
 * ② 底用浅色,红蓝紫走【渐变大字/CTA/描边/点缀】,不铺大块纯色 ③ 紧凑,不留大空
 * ─────────────────────────────────────────────────────────────────────────── */
import { motion, useMotionValue, useSpring, type Variants } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import '@/styles/ikb-hero.css';

export const C = {
  ikb: '#2B53E6', // 蓝 — 主导
  yellow: '#7A3BE0', // 紫(原 yellow 槽 → 第二主色)
  burgundy: '#EF3E6B', // 玫红 — 暖点缀(红蓝紫的「红」· 大字/渐变/装饰用)
  burgundyText: '#D11E52', // 玫红·深(小字可读版 · 白底 ≈5:1 过 WCAG AA · 给 kicker/小标签)
  accent3: '#7A3BE0', // 紫(轮转)
  ink: '#161D33', // 正文近黑(冷调藏蓝)
  paper: '#FFFFFF', // 卡片面
  base: '#F3F5FC', // 区块浅底(极浅冷)
  line: 'rgba(22,32,72,0.13)', // 发丝线/边
  grad: 'linear-gradient(110deg, #2B53E6 0%, #7A3BE0 52%, #EF3E6B 100%)', // 红蓝紫主渐变
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

// 统一区块头:mono 编号 + kicker + 得意黑标题(蓝)+ 发丝线(固定 px · 紧凑)
export function SectionHead({ index, kicker, title, accent = C.ikb }: { index: string; kicker: string; title: string; accent?: string }) {
  return (
    <Reveal style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
        <span style={{ fontFamily: F.mono, fontSize: 13, color: accent, letterSpacing: '0.08em' }}>{index}</span>
        <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.ink, opacity: 0.55 }}>{kicker}</span>
      </div>
      <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 46, lineHeight: 0.98, letterSpacing: '-0.01em', color: accent, margin: 0 }}>{title}</h2>
    </Reveal>
  );
}

// 统一卡片:白纸面 + 墨线边 + 顶部色条 + hover 油墨灌注(个体卡,非大块蓝底)
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
      <Link
        to={href}
        className="ikb-card"
        style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', padding: '16px 18px', height: '100%', ['--ikb-accent' as string]: accent } as CSSProperties}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="ikb-c-idx" style={{ fontFamily: F.mono, fontSize: 11, color: accent, letterSpacing: '0.05em' }}>{index}</span>
          {arrow && (
            <span className="ikb-c-arrow" style={{ color: C.ink, display: 'inline-flex' }} aria-hidden>
              <ArrowUpRight size={16} strokeWidth={2.2} />
            </span>
          )}
        </div>
        <div className="ikb-c-title" style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: C.ink, marginTop: 12, lineHeight: 1.12 }}>{title}</div>
        <div className="ikb-c-desc" style={{ fontFamily: F.cn, fontSize: 12.5, lineHeight: 1.55, color: '#5A6173', marginTop: 6 }}>{desc}</div>
      </Link>
    </Item>
  );
}
