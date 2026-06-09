// PRD-29.13 · 私域成交流程 · 成交话术 4 sub-list · 液态玻璃皮
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { C, F } from '@/components/home-next/ikb/system';

interface SalesScripts {
  firstConsult: string[];
  objectionHandling: Array<{ objection: string; response: string }>;
  pushOrder: string[];
  afterSales: string[];
}

interface PrivateDomainSalesScriptSectionProps {
  scripts: SalesScripts;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => toast.success('已复制'));
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        flexShrink: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        color: 'rgba(255,255,255,0.35)',
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'; }}
      aria-label="复制"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
    </button>
  );
}

interface ScriptListProps {
  label: string;
  items: string[];
  accent?: string;
}

function ScriptList({ label, items, accent = C.ikb }: ScriptListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p
        style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          fontFamily: F.cn,
          textShadow: C.textShadow,
        }}
      >
        <span style={{ display: 'inline-block', height: 10, width: 3, borderRadius: 9999, background: accent }} aria-hidden={true} />
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((line, i) => (
          <motion.div
            key={i}
            className="lg-glass"
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              borderRadius: 10,
              padding: '8px 12px',
            }}
          >
            <p style={{ flex: 1, margin: 0, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', fontFamily: F.cn }}>{line}</p>
            <CopyButton text={line} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function PrivateDomainSalesScriptSection({
  scripts,
  className,
}: PrivateDomainSalesScriptSectionProps) {
  return (
    <div
      className={`lg-glass${className ? ` ${className}` : ''}`}
      style={{ borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}
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
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>record_voice_over</span>
        成交话术
      </h3>

      {/* 首次咨询话术 */}
      <ScriptList label="首次咨询话术" items={scripts.firstConsult} accent={C.ikb} />

      {/* 异议处理话术 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: C.yellow,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          <span style={{ display: 'inline-block', height: 10, width: 3, borderRadius: 9999, background: C.yellow }} aria-hidden={true} />
          异议处理话术
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scripts.objectionHandling.map((item, i) => (
            <motion.div
              key={i}
              className="lg-glass"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 12, overflow: 'hidden' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  padding: '8px 12px',
                  borderBottom: `0.5px solid ${C.line}`,
                  background: 'rgba(228,238,255,0.07)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 6,
                    border: `0.5px solid rgba(228,238,255,0.4)`,
                    background: 'rgba(228,238,255,0.12)',
                    padding: '2px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.yellow,
                    fontFamily: F.cn,
                    flexShrink: 0,
                  }}
                >
                  {item.objection}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px' }}>
                <p style={{ flex: 1, margin: 0, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{item.response}</p>
                <CopyButton text={`${item.objection}\n${item.response}`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 逼单话术 */}
      <ScriptList label="逼单话术" items={scripts.pushOrder} accent={C.accent3} />

      {/* 售后跟进话术 */}
      <ScriptList label="售后跟进话术" items={scripts.afterSales} accent={C.ikb} />
    </div>
  );
}
