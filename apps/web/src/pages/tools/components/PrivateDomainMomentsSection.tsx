// PRD-29.13 · 私域成交流程 · 朋友圈文案 4 sub-list · 液态玻璃皮
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { C, F } from '@/components/home-next/ikb/system';

interface MomentsScripts {
  grass: string[];
  trust: string[];
  closing: string[];
  fission: string[];
}

interface PrivateDomainMomentsSectionProps {
  scripts: MomentsScripts;
  className?: string;
}

const SUB_LISTS: Array<{ key: keyof MomentsScripts; label: string; accent: string }> = [
  { key: 'grass',   label: '种草文案', accent: C.ikb },
  { key: 'trust',   label: '信任文案', accent: C.yellow },
  { key: 'closing', label: '成交文案', accent: C.accent3 },
  { key: 'fission', label: '裂变文案', accent: C.ikb },
];

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
        fontSize: 16,
        lineHeight: 1,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'; }}
      aria-label="复制"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
    </button>
  );
}

export function PrivateDomainMomentsSection({
  scripts,
  className,
}: PrivateDomainMomentsSectionProps) {
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
          color: C.ikb,
          fontFamily: F.cn,
          textShadow: C.textShadow,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.ikb }}>photo_album</span>
        朋友圈文案
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {SUB_LISTS.map(({ key, label, accent }) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              {scripts[key].map((line, i) => (
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
                  <p style={{ flex: 1, margin: 0, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', fontFamily: F.cn }}>
                    {line}
                  </p>
                  <CopyButton text={line} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
