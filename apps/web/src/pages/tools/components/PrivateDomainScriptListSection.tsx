// PRD-29.13 · 私域成交流程 · 引流话术 3 sub-list · 液态玻璃皮
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { C, F } from '@/components/home-next/ikb/system';

interface TrafficScripts {
  shortVideo: string[];
  commentInteraction: string[];
  dmGuidance: string[];
}

interface PrivateDomainScriptListSectionProps {
  scripts: TrafficScripts;
  className?: string;
}

const SUB_LISTS: Array<{ key: keyof TrafficScripts; label: string; accent: string }> = [
  { key: 'shortVideo',         label: '短视频引流话术',   accent: C.ikb },
  { key: 'commentInteraction', label: '评论区互动话术',   accent: C.yellow },
  { key: 'dmGuidance',         label: '私信引导话术',     accent: C.accent3 },
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
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'; }}
      aria-label="复制"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
    </button>
  );
}

export function PrivateDomainScriptListSection({
  scripts,
  className,
}: PrivateDomainScriptListSectionProps) {
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
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>campaign</span>
        引流话术
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
