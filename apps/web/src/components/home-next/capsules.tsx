/**
 * capsules.tsx — iOS 26 Liquid Glass 胶囊组件集合
 *
 * 包含:
 *  - BrandPill      品牌胶囊(slim full-radius pill)
 *  - HeroCapsule    Hero 主胶囊(最大 · prism + refract + spec · Link to /step/1)
 *  - DualCapsules   双胶囊并排(IP 方案 + 工具箱)
 *  - StatStrip      数据玻璃条(slim · stats · 分隔 ·)
 *  - CornerLabels   四角微标注
 *  - ToolboxPanel   工具箱浮层(AnimatePresence 弹出/收起)
 *
 * 所有动效只用 transform/opacity，不引发 layout shift。
 */
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Command, LayoutGrid, Target, X } from 'lucide-react';
import { useCallback, useRef, type MouseEvent, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';

import {
  HOME_HERO_CTA1,
  HOME_HERO_CTA1_HREF,
  HOME_MATRIX,
  HOME_STATS,
} from '@/lib/constants/home-next';

// ─── spring 配置 ─────────────────────────────────────────────────────────────
const SPRING = { stiffness: 120, damping: 18, mass: 0.6 } as const;
const TILT_SPRING = { stiffness: 180, damping: 22, mass: 0.45 } as const;
const MAX_TILT = 6; // deg

// ─── stagger 入场 variants ───────────────────────────────────────────────────
export const capsuleContainerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
} as const;

export const capsuleItemV = {
  hidden: { opacity: 0, y: 26, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
} as const;

// ─── 公用 hook: tilt + specular 跟手 ─────────────────────────────────────────
function useGlassTilt(elRef: React.RefObject<HTMLElement | null>) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const springX = useSpring(rx, TILT_SPRING);
  const springY = useSpring(ry, TILT_SPRING);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = elRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = (e.clientX - cx) / (r.width / 2);   // -1..1
      const ny = (e.clientY - cy) / (r.height / 2);  // -1..1
      rx.set(ny * -MAX_TILT);   // rotateX (pitch)
      ry.set(nx * MAX_TILT);    // rotateY (yaw)
      // specular 跟手
      el.style.setProperty('--lg-mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--lg-my', `${((e.clientY - r.top) / r.height) * 100}%`);
    },
    [elRef, rx, ry],
  );

  const onMouseLeave = useCallback(() => {
    rx.set(0);
    ry.set(0);
  }, [rx, ry]);

  return { springX, springY, onMouseMove, onMouseLeave };
}

// ─── BrandPill ───────────────────────────────────────────────────────────────
export function BrandPill() {
  return (
    <motion.div
      variants={capsuleItemV}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 22px',
        borderRadius: 9999,
        cursor: 'default',
        userSelect: 'none',
      }}
      className="lg-glass lg-spec"
      whileHover={{ scale: 1.025 }}
      transition={SPRING}
    >
      <Command size={15} strokeWidth={2} color="rgba(255,255,255,0.85)" />
      <span
        className="lg-cn"
        style={{
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.9)',
        }}
      >
        QuanAn · AIP 全案获客操盘手
      </span>
    </motion.div>
  );
}

// ─── HeroCapsule ─────────────────────────────────────────────────────────────
export function HeroCapsule() {
  const elRef = useRef<HTMLDivElement>(null);
  const { springX, springY, onMouseMove, onMouseLeave } = useGlassTilt(
    elRef as React.RefObject<HTMLElement | null>,
  );

  return (
    <motion.div
      variants={capsuleItemV}
      style={{ perspective: 1000, width: '100%', maxWidth: 720 }}
    >
      <motion.div
        style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
        whileHover={{ scale: 1.025 }}
        transition={SPRING}
      >
        <Link
          to={HOME_HERO_CTA1_HREF}
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div
            ref={elRef}
            className="lg-glass lg-prism lg-spec lg-refract"
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
              borderRadius: 9999,
              padding: '54px 92px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span
                className="lg-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                AIP · INTELLIGENT ANALYSIS
              </span>
              <span
                className="lg-cn"
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.08,
                  color: '#fff',
                }}
              >
                {HOME_HERO_CTA1}
              </span>
            </div>
            <motion.span
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.18)',
                flexShrink: 0,
              }}
            >
              <ArrowRight size={28} strokeWidth={2.2} color="#fff" />
            </motion.span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ─── SmallCapsule — IP方案 / 工具箱 ──────────────────────────────────────────
interface SmallCapsuleProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

function SmallCapsule({ icon, label, href, onClick }: SmallCapsuleProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const { springX, springY, onMouseMove, onMouseLeave } = useGlassTilt(
    elRef as React.RefObject<HTMLElement | null>,
  );

  const inner = (
    <div
      ref={elRef}
      className="lg-glass lg-spec"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        borderRadius: 38,
        padding: '32px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 14,
        height: '100%',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.15)',
        }}
      >
        {icon}
      </span>
      <span
        className="lg-cn"
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </div>
  );

  return (
    <motion.div
      variants={capsuleItemV}
      style={{ perspective: 1000, flex: 1, minWidth: 0 }}
    >
      <motion.div
        style={{ rotateX: springX, rotateY: springY, height: '100%' }}
        whileHover={{ scale: 1.025 }}
        transition={SPRING}
      >
        {href ? (
          <Link to={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
            {inner}
          </Link>
        ) : (
          <div onClick={onClick} style={{ height: '100%' }}>
            {inner}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── ToolboxPanel ─────────────────────────────────────────────────────────────
interface ToolboxPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ToolboxPanel({ open, onClose }: ToolboxPanelProps) {
  // Collect all cards flat
  const allCards = HOME_MATRIX.flatMap((g) => g.cards);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      // Close if backdrop click (not inside panel)
      if ((e.target as HTMLElement).dataset.backdrop === 'true') onClose();
    },
    [onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="toolbox-backdrop"
            data-backdrop="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onPointerDown={handlePointerDown}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(8,20,48,0.45)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Panel */}
            <motion.div
              key="toolbox-panel"
              className="lg-glass"
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              style={{
                borderRadius: 32,
                padding: '36px 32px',
                width: 780,
                maxWidth: '90vw',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative',
                zIndex: 201,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 28,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <LayoutGrid size={20} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />
                  <span
                    className="lg-cn"
                    style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}
                  >
                    全链路工具箱
                  </span>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 9999,
                    background: 'rgba(255,255,255,0.12)',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  aria-label="关闭工具箱"
                >
                  <X size={16} color="rgba(255,255,255,0.8)" strokeWidth={2.2} />
                </motion.button>
              </div>

              {/* Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                }}
              >
                {allCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.href}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 160,
                        damping: 20,
                        delay: i * 0.035,
                      }}
                    >
                      <Link
                        to={card.href}
                        onClick={onClose}
                        style={{ textDecoration: 'none', display: 'block' }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05, y: -2 }}
                          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                          style={{
                            background: 'rgba(255,255,255,0.09)',
                            border: '0.5px solid rgba(255,255,255,0.22)',
                            borderRadius: 16,
                            padding: '16px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            cursor: 'pointer',
                          }}
                        >
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: 'rgba(255,255,255,0.14)',
                            }}
                          >
                            <Icon size={18} strokeWidth={1.8} color="rgba(255,255,255,0.85)" />
                          </span>
                          <span
                            className="lg-cn"
                            style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}
                          >
                            {card.title}
                          </span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── DualCapsules ─────────────────────────────────────────────────────────────
interface DualCapsulesProps {
  onOpenToolbox: () => void;
}

export function DualCapsules({ onOpenToolbox }: DualCapsulesProps) {
  return (
    <motion.div
      variants={capsuleItemV}
      style={{
        display: 'flex',
        gap: 18,
        width: '100%',
        maxWidth: 720,
      }}
    >
      <SmallCapsule
        icon={<Target size={22} strokeWidth={1.8} color="rgba(255,255,255,0.9)" />}
        label="我的 IP 方案"
        href="/ip-plan"
      />
      <SmallCapsule
        icon={<LayoutGrid size={22} strokeWidth={1.8} color="rgba(255,255,255,0.9)" />}
        label="工具箱"
        onClick={onOpenToolbox}
      />
    </motion.div>
  );
}

// ─── StatStrip ────────────────────────────────────────────────────────────────
export function StatStrip() {
  const parts = HOME_STATS.map((s) => `${s.value} ${s.label}`).join(' · ');
  return (
    <motion.div
      variants={capsuleItemV}
      className="lg-glass"
      style={{
        borderRadius: 9999,
        padding: '10px 28px',
        display: 'inline-flex',
        alignItems: 'center',
      }}
      whileHover={{ scale: 1.015 }}
      transition={SPRING}
    >
      <span
        className="lg-mono"
        style={{
          fontSize: 12.5,
          letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.72)',
          textTransform: 'uppercase',
        }}
      >
        {parts}
      </span>
    </motion.div>
  );
}

// ─── CornerLabels ─────────────────────────────────────────────────────────────
export function CornerLabels() {
  const base: React.CSSProperties = {
    position: 'absolute',
    fontFamily: 'var(--lg-mono)',
    fontSize: 10,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.28)',
    pointerEvents: 'none',
    userSelect: 'none',
  };
  return (
    <>
      <span style={{ ...base, top: 16, left: 0 }}>iOS 26</span>
      <span style={{ ...base, top: 16, right: 0 }}>LIQUID GLASS</span>
    </>
  );
}
