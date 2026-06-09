// PRD-29.13 · 私域成交流程 · SOP 执行流程 5 step · 液态玻璃皮
import { motion } from 'framer-motion';

import { C, F } from '@/components/home-next/ikb/system';

interface SopStep {
  day: string;
  title: string;
  goal: string;
  desc: string;
}

interface PrivateDomainSopSectionProps {
  sop: SopStep[];
  className?: string;
}

export function PrivateDomainSopSection({ sop, className }: PrivateDomainSopSectionProps) {
  return (
    <div
      className={`lg-glass${className ? ` ${className}` : ''}`}
      style={{ borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <h3
        style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 15,
          fontWeight: 700,
          color: C.ink,
          fontFamily: F.cn,
          textShadow: C.textShadow,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>calendar_month</span>
        SOP执行流程
      </h3>
      <div style={{ position: 'relative' }}>
        {/* timeline track */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            top: 0,
            bottom: 0,
            width: 1.5,
            background: `linear-gradient(to bottom, ${C.ikb}, ${C.accent3})`,
            opacity: 0.45,
          }}
          aria-hidden={true}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sop.map((step, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 24px', gap: 14, alignItems: 'flex-start' }}>
              {/* 左 · Day chip */}
              <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 2 }}>
                <span
                  style={{
                    borderRadius: 9999,
                    border: `0.5px solid rgba(168,197,224,0.4)`,
                    background: 'rgba(168,197,224,0.12)',
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.ikb,
                    fontFamily: F.mono,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.day}
                </span>
              </div>

              {/* 中 · title + goal + desc */}
              <motion.div
                className="lg-glass"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  {step.title}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    alignSelf: 'flex-start',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.8)',
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontFamily: F.cn,
                  }}
                >
                  目标：{step.goal}
                </span>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                  {step.desc}
                </p>
              </motion.div>

              {/* 右 · step number */}
              <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 4 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 20,
                    width: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'rgba(168,197,224,0.25)',
                    fontSize: 10,
                    fontWeight: 800,
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  {i + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
