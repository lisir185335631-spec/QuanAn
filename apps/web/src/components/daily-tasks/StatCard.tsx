import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  value: number;
  label: string;
  Icon: LucideIcon;
  iconColor: string;
  valueColor: string;
}

export function StatCard({ value, label, Icon, iconColor, valueColor }: StatCardProps) {
  return (
    <div
      data-testid="stat-card"
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6"
    >
      <Icon className={`w-8 h-8 ${iconColor}`} />
      <span className={`text-3xl font-bold ${valueColor}`}>{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
