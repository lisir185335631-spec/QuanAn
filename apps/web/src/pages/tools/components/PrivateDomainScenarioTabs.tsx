// PRD-29.13 · 私域成交流程 · 6 chip scenario tabs · 液态玻璃皮
import { motion } from 'framer-motion';

import { C, F } from '@/components/home-next/ikb/system';

export type PrivateDomainScenarioId =
  | 'welcome'
  | 'icebreaker'
  | 'trust'
  | 'discovery'
  | 'closing'
  | 'followup';

export interface PrivateDomainScenario {
  id: PrivateDomainScenarioId;
  name: string;
  subtitle: string;
  icon: string;
}

interface PrivateDomainScenarioTabsProps {
  scenarios: PrivateDomainScenario[];
  activeId: PrivateDomainScenarioId;
  onChange: (id: PrivateDomainScenarioId) => void;
}

export function PrivateDomainScenarioTabs({
  scenarios,
  activeId,
  onChange,
}: PrivateDomainScenarioTabsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}
      className="md:grid-cols-3 lg:grid-cols-6"
    >
      {scenarios.map((s) => {
        const active = s.id === activeId;
        return (
          <motion.button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-glass"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              borderRadius: 14,
              padding: '14px 10px',
              background: active ? 'rgba(168,197,224,0.22)' : undefined,
              outline: active ? `1.5px solid rgba(168,197,224,0.65)` : undefined,
              cursor: 'pointer',
              border: 'none',
              transition: 'background 0.18s, outline 0.18s',
            }}
          >
            {/* icon — uses Material Symbols if string is icon name, else text emoji */}
            <span
              style={{
                display: 'flex',
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: active
                  ? 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))'
                  : 'rgba(255,255,255,0.07)',
                color: active ? C.ikb : 'rgba(255,255,255,0.72)',
                fontSize: 20,
              }}
            >
              {s.icon.length > 2 ? (
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{s.icon}</span>
              ) : (
                s.icon
              )}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? C.ikb : 'rgba(255,255,255,0.7)',
                fontFamily: F.cn,
                textShadow: active ? C.textShadow : undefined,
              }}
            >
              {s.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
