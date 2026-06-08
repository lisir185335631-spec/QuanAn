import { motion, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  HOME_HERO_CHIP,
  HOME_HERO_CTA1,
  HOME_HERO_CTA1_HREF,
  HOME_HERO_CTA2,
  HOME_HERO_CTA2_HREF,
  HOME_HERO_DELETE_MS,
  HOME_HERO_HOLD_MS,
  HOME_HERO_QUOTE,
  HOME_HERO_ROTATION,
  HOME_HERO_SUBTITLE,
  HOME_HERO_TYPE_MS,
} from '@/lib/constants/home-next';

import { C, F, Magnetic } from './ikb/system';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const rise: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } };

export function HeroIKB() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const full = HOME_HERO_ROTATION[phraseIndex] ?? '';
    if (!deleting && text === full) {
      const hold = setTimeout(() => setDeleting(true), HOME_HERO_HOLD_MS);
      return () => clearTimeout(hold);
    }
    if (deleting && text === '') {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % HOME_HERO_ROTATION.length);
      return;
    }
    const t = setTimeout(
      () => setText((c) => (deleting ? full.slice(0, c.length - 1) : full.slice(0, c.length + 1))),
      deleting ? HOME_HERO_DELETE_MS : HOME_HERO_TYPE_MS,
    );
    return () => clearTimeout(t);
  }, [text, deleting, phraseIndex]);

  return (
    <motion.section variants={container} initial="hidden" animate="show" style={{ paddingBottom: 44 }}>
      <div style={{ minHeight: 430, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', maxWidth: 1280, margin: '0 auto' }}>
        <div>
          {/* chip 行 */}
          <motion.div variants={rise} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: F.mono, fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', color: C.ink, textShadow: C.textShadow }}>
            <span style={{ width: 8, height: 8, background: C.ikb, display: 'inline-block', borderRadius: 2 }} />
            <span style={{ textTransform: 'uppercase' }}>{HOME_HERO_CHIP}</span>
          </motion.div>

          {/* 全链路副标签 — 无底 · 白字 + 强暗描边(醒目不加框) */}
          <motion.div variants={rise} style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#fff', margin: '16px 0 24px' }}>▍ 全链路 · 智能加速</motion.div>

          {/* 打字机大字 — 白色 + 冷蓝渐变高光 */}
          <motion.h1 variants={rise} style={{ fontFamily: F.display, fontWeight: 400, fontSize: 118, lineHeight: 0.94, letterSpacing: '-0.01em', margin: 0, minHeight: '1em' }}>
            <span
              style={{
                background: 'linear-gradient(110deg,#d4e6ff 0%,#a8c5e0 52%,#ffffff 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                filter: 'drop-shadow(0 2px 4px rgba(6,14,38,.5))',
              }}
            >
              {text}
            </span>
            {/* cursor — 彩虹/冷蓝渐变块 */}
            <span
              style={{
                display: 'inline-block',
                width: '0.56em',
                height: '0.78em',
                background: 'linear-gradient(180deg,#a8c5e0,#7fb0e6)',
                marginLeft: '0.06em',
                verticalAlign: '-0.03em',
                borderRadius: 3,
              }}
              aria-hidden
            />
          </motion.h1>

          {/* 分隔线 */}
          <motion.div variants={rise} style={{ height: 1, background: C.line, margin: '24px auto 20px', width: '100%', maxWidth: 760 }} />

          {/* 副标题 */}
          <motion.p variants={rise} style={{ fontFamily: F.cn, fontSize: 21, fontWeight: 600, lineHeight: 1.55, letterSpacing: '0.1em', maxWidth: 880, color: C.ink, margin: '0 auto', textShadow: C.textShadow }}>{HOME_HERO_SUBTITLE}</motion.p>

          {/* 金句 — 无底 · 白字 + 强暗描边 */}
          <motion.p variants={rise} style={{ fontFamily: F.cn, fontStyle: 'italic', fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 15, marginBottom: 0 }}>{HOME_HERO_QUOTE}</motion.p>

          {/* CTA */}
          <motion.div variants={rise} style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 34 }}>
            {/* 主 CTA — 彩虹边玻璃按钮 */}
            <Magnetic>
              <Link
                to={HOME_HERO_CTA1_HREF}
                className="lg-gradbtn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 11, fontFamily: F.cn, fontWeight: 700, fontSize: 17.5, padding: '17px 40px', textDecoration: 'none', borderRadius: 9999 }}
              >
                <ArrowRight size={18} strokeWidth={2.6} />
                {HOME_HERO_CTA1}
              </Link>
            </Magnetic>
            {/* 副 CTA — 玻璃描边 */}
            <Magnetic strength={0.3}>
              <Link
                to={HOME_HERO_CTA2_HREF}
                className="lg-glass lg-spec"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 11, color: C.ink, fontFamily: F.cn, fontWeight: 700, fontSize: 17.5, padding: '15.5px 34px', textDecoration: 'none', borderRadius: 9999 }}
              >
                {HOME_HERO_CTA2}
              </Link>
            </Magnetic>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
