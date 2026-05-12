// PRD-11 US-007 · Plan color badge

export type PlanType = 'free' | 'pro' | 'enterprise' | 'banned' | string;

const PLAN_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  free: { bg: 'rgba(136,136,136,0.15)', color: '#888', label: 'free' },
  pro: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'pro' },
  enterprise: { bg: 'rgba(212,175,55,0.15)', color: '#d4af37', label: 'enterprise' },
  banned: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'banned' },
};

interface PlanBadgeProps {
  plan: PlanType;
  isBanned?: boolean;
}

export function PlanBadge({ plan, isBanned }: PlanBadgeProps) {
  const effectivePlan = isBanned ? 'banned' : plan;
  const cfg = PLAN_COLORS[effectivePlan] ?? { bg: 'rgba(136,136,136,0.15)', color: '#888', label: effectivePlan };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        borderRadius: 3,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}33`,
      }}
    >
      {cfg.label}
    </span>
  );
}
