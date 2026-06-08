import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Reveal } from '@/components/home-next/ikb/system';

const NOT_FOUND_CODE = '404' as const;
const NOT_FOUND_TITLE = '页面未找到' as const;
const NOT_FOUND_DESC_1 = '抱歉，您访问的页面不存在。' as const;
const NOT_FOUND_DESC_2 = '该页面可能已被移动或删除。' as const;
const NOT_FOUND_CTA = '返回首页' as const;

export default function NotFound() {
  return (
    <LiquidShell>
      <div
        style={{
          display: 'flex',
          minHeight: '60vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Reveal>
          <motion.div
            data-testid="not-found-card"
            className="lg-glass"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              borderRadius: 24,
              padding: '80px 64px',
              maxWidth: 520,
            }}
          >
            {/* icon badge */}
            <span
              data-testid="not-found-icon"
              style={{
                display: 'flex',
                height: 96,
                width: 96,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '1.5px solid rgba(168,197,224,0.45)',
                background: 'rgba(168,197,224,0.14)',
                marginBottom: 32,
              }}
            >
              <span
                className="material-symbols-outlined"
                aria-hidden={true}
                style={{ fontSize: 44, color: C.ikb }}
              >
                error_outline
              </span>
            </span>

            {/* 404 大数字 — 冷蓝渐变字 */}
            <h1
              data-testid="not-found-code"
              style={{
                fontFamily: F.display,
                fontSize: 96,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                margin: '0 0 12px',
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                textShadow: 'none',
              }}
            >
              {NOT_FOUND_CODE}
            </h1>

            {/* 副标题 */}
            <p
              data-testid="not-found-title"
              style={{
                fontFamily: F.cn,
                fontSize: 22,
                fontWeight: 700,
                color: C.ink,
                textShadow: C.textShadow,
                margin: '0 0 20px',
              }}
            >
              {NOT_FOUND_TITLE}
            </p>

            {/* 说明文案 */}
            <p
              data-testid="not-found-desc"
              style={{
                fontFamily: F.cn,
                fontSize: 15,
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.70)',
                margin: '0 0 40px',
              }}
            >
              {NOT_FOUND_DESC_1}
              <br />
              {NOT_FOUND_DESC_2}
            </p>

            {/* CTA 按钮 — 液态玻璃冷蓝边框 */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Link
                data-testid="not-found-cta"
                to="/"
                className="lg-glass"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 9999,
                  padding: '12px 28px',
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: F.cn,
                  color: C.ink,
                  textDecoration: 'none',
                  textShadow: C.textShadow,
                  border: '1px solid rgba(168,197,224,0.55)',
                  background: 'rgba(168,197,224,0.18)',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  aria-hidden={true}
                  style={{ fontSize: 20, color: C.ikb }}
                >
                  home
                </span>
                {NOT_FOUND_CTA}
              </Link>
            </motion.div>
          </motion.div>
        </Reveal>
      </div>
    </LiquidShell>
  );
}
