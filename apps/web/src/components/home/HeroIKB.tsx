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
} from '@/lib/constants/home';

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
          <motion.div variants={rise} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: F.mono, fontSize: 14, letterSpacing: '0.12em', color: C.ink }}>
            <span className="ikb-pulse" style={{ width: 8, height: 8, background: C.ikb, display: 'inline-block' }} />
            <span style={{ textTransform: 'uppercase' }}>{HOME_HERO_CHIP}</span>
          </motion.div>
          <motion.div variants={rise} style={{ fontFamily: F.mono, fontSize: 14.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.burgundyText, margin: '16px 0 24px' }}>▍ 全链路 · 智能加速</motion.div>
          <motion.h1 variants={rise} style={{ fontFamily: F.display, fontWeight: 400, fontSize: 118, lineHeight: 0.94, letterSpacing: '-0.01em', margin: 0, minHeight: '1em' }}>
            <span className="ikb-gradtext">{text}</span>
            <span className="ikb-cursor" style={{ display: 'inline-block', width: '0.56em', height: '0.78em', background: C.burgundy, marginLeft: '0.06em', verticalAlign: '-0.03em' }} aria-hidden />
          </motion.h1>
          <motion.div variants={rise} style={{ height: 1, background: C.line, margin: '24px auto 20px', width: '100%', maxWidth: 760 }} />
          <motion.p variants={rise} style={{ fontFamily: F.cn, fontSize: 21, fontWeight: 500, lineHeight: 1.55, letterSpacing: '0.1em', maxWidth: 880, color: C.ink, margin: '0 auto' }}>{HOME_HERO_SUBTITLE}</motion.p>
          <motion.p variants={rise} style={{ fontFamily: F.cn, fontStyle: 'italic', fontSize: 20, fontWeight: 500, color: C.burgundyText, marginTop: 15, marginBottom: 0 }}>{HOME_HERO_QUOTE}</motion.p>
          <motion.div variants={rise} style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 34 }}>
            <Magnetic>
              <Link to={HOME_HERO_CTA1_HREF} className="ikb-gradbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 11, background: C.grad, color: '#fff', fontFamily: F.cn, fontWeight: 700, fontSize: 17.5, padding: '17px 32px', textDecoration: 'none' }}>
                <ArrowRight size={18} strokeWidth={2.6} />
                {HOME_HERO_CTA1}
              </Link>
            </Magnetic>
            <Magnetic strength={0.3}>
              <Link to={HOME_HERO_CTA2_HREF} style={{ display: 'inline-flex', alignItems: 'center', gap: 11, background: 'transparent', color: C.ikb, border: `1.5px solid ${C.ikb}`, fontFamily: F.cn, fontWeight: 700, fontSize: 17.5, padding: '15.5px 30px', textDecoration: 'none' }}>
                {HOME_HERO_CTA2}
              </Link>
            </Magnetic>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
